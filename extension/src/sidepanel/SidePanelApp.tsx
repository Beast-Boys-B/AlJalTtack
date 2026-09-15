import { useMemo, useState, type CSSProperties } from "react"
import {
  CATEGORIES,
  CATEGORY_COLORS,
  detectCategoryAxes,
  generateRefinedPrompt,
  type CategoryId,
} from "../../../src/categories"
import { LIME, INK, IVORY } from "../../../src/theme"

// 사이드패널은 폭이 좁아서(보통 320~400px) 웹앱의 3단 그리드(ComparePage)를
// 그대로 쓰지 않고 세로 1단으로 재구성한 MVP다. 카테고리 감지·프롬프트
// 조립 로직(src/categories)은 100% 재사용 — 여기서 새로 만들지 않는다.
// destination(여행계획 목적지 자유입력)은 이번 MVP에서는 생략 —
// travel.ts에서 선택 파라미터라 없어도 정상 동작한다.
const MAX_LEN = 500 // docs-공통 P-공8과 동일한 자연어 입력 상한

// "보내기" 대상 사이트 — 하나씩 실제 브라우저에서 검증하며 늘려간다
// (매니페스트의 content_scripts/host_permissions와 짝 맞춰 추가할 것).
// urlPatterns는 chrome.tabs.query의 url 필터(배열 가능, OR 매칭)에 그대로 쓴다.
interface SendTarget {
  id: string
  label: string
  icon: string
  urlPatterns: string[]
}
const SEND_TARGETS: SendTarget[] = [
  { id: "claude", label: "클로드", icon: "🟣", urlPatterns: ["https://claude.ai/*"] },
  {
    id: "chatgpt",
    label: "챗GPT",
    icon: "🟢",
    urlPatterns: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  },
  { id: "gemini", label: "제미니", icon: "🔵", urlPatterns: ["https://gemini.google.com/*"] },
]

type SendStatus = "sent" | "no-tab" | "error"

function buildInitialAxes(text: string, category: (typeof CATEGORIES)[number]) {
  const detected = detectCategoryAxes(text, category)
  const init: Record<string, string> = {}
  category.axes.forEach((a) => {
    init[a.id] = detected[a.id] ?? a.options[0]
  })
  return init
}

export function SidePanelApp() {
  const [categoryId, setCategoryId] = useState<CategoryId>(CATEGORIES[0].id)
  const category = CATEGORIES.find((c) => c.id === categoryId)!
  const [text, setText] = useState("")
  const [axes, setAxes] = useState<Record<string, string>>(() =>
    buildInitialAxes("", category),
  )
  // 대상별로 독립적인 상태 — 하나 실패해도 다른 대상 버튼 상태에
  // 영향 없게 target.id로 키를 나눈다.
  const [sendStatus, setSendStatus] = useState<Record<string, SendStatus | undefined>>({})

  const handleCategoryChange = (id: CategoryId) => {
    const next = CATEGORIES.find((c) => c.id === id)!
    setCategoryId(id)
    setAxes(buildInitialAxes(text, next))
    setSendStatus({})
  }

  const handleTextChange = (val: string) => {
    setText(val)
    setSendStatus({})
    const detected = detectCategoryAxes(val, category)
    if (Object.keys(detected).length === 0) return
    setAxes((prev) => ({ ...prev, ...detected }))
  }

  const refined = useMemo(
    () => generateRefinedPrompt(text, category, axes),
    [text, category, axes],
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(refined).catch(() => {})
  }

  const handleSendTo = async (target: SendTarget) => {
    setSendStatus((prev) => ({ ...prev, [target.id]: undefined }))
    const tabs = await chrome.tabs.query({ url: target.urlPatterns })
    const tab = tabs[0]
    if (!tab?.id) {
      setSendStatus((prev) => ({ ...prev, [target.id]: "no-tab" }))
      return
    }
    try {
      const res = await chrome.tabs.sendMessage(tab.id, {
        type: "ALJALTTACK_INSERT_PROMPT",
        text: refined,
      })
      if (!res?.ok) {
        setSendStatus((prev) => ({ ...prev, [target.id]: "error" }))
        return
      }
      setSendStatus((prev) => ({ ...prev, [target.id]: "sent" }))
      await chrome.tabs.update(tab.id, { active: true })
      if (tab.windowId != null) await chrome.windows.update(tab.windowId, { focused: true })
    } catch {
      // 콘텐츠 스크립트가 아직 안 붙어있는 경우(탭을 새로고침 전) 등 —
      // sendMessage 자체가 reject된다.
      setSendStatus((prev) => ({ ...prev, [target.id]: "error" }))
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: IVORY,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: "'Noto Sans KR', sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 20, color: INK }}>
        알잘딱
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCategoryChange(c.id)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: `1.5px solid ${c.id === categoryId ? INK : "#ccc"}`,
              background: c.id === categoryId ? CATEGORY_COLORS[c.id] : "#fff",
              color: INK,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888" }}>
          <span>하고 싶은 말을 편하게 적어주세요</span>
          <span>
            {text.length}/{MAX_LEN}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value.slice(0, MAX_LEN))}
          placeholder={category.placeholder}
          style={{
            width: "100%",
            boxSizing: "border-box",
            height: 120,
            padding: "10px 12px",
            fontSize: 13.5,
            lineHeight: 1.6,
            border: "2px solid #111",
            borderRadius: 10,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {category.axes.map((axis) => (
          <div key={axis.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>{axis.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {axis.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setAxes((prev) => ({ ...prev, [axis.id]: opt }))
                    setSendStatus({})
                  }}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 6,
                    border: `1.5px solid ${axes[axis.id] === opt ? INK : "#ddd"}`,
                    background: axes[axis.id] === opt ? LIME : "#fff",
                    fontSize: 11.5,
                    cursor: "pointer",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>정제된 프롬프트</div>
        <div
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 12.5,
            lineHeight: 1.6,
            background: "#fff",
            border: "1.5px solid #ddd",
            borderRadius: 10,
            padding: 12,
            minHeight: 80,
            color: INK,
          }}
        >
          {refined || (
            <span style={{ color: "#aaa" }}>내용을 입력하면 여기에 정제된 프롬프트가 표시됩니다.</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleCopy} disabled={!refined} style={actionBtnStyle(false, !refined)}>
          📋 복사
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>바로 보내기</div>
        <div style={{ display: "flex", gap: 8 }}>
          {SEND_TARGETS.map((target) => (
            <button
              key={target.id}
              onClick={() => handleSendTo(target)}
              disabled={!refined}
              style={actionBtnStyle(true, !refined)}
            >
              {target.icon} {target.label}로
            </button>
          ))}
        </div>
        {SEND_TARGETS.map((target) => {
          const status = sendStatus[target.id]
          if (!status) return null
          if (status === "no-tab") {
            return (
              <div key={target.id} style={statusStyle("#B45309")}>
                {target.label} 탭이 열려있지 않아요. 먼저 열어주세요.
              </div>
            )
          }
          if (status === "sent") {
            return (
              <div key={target.id} style={statusStyle("#0ca30c")}>
                {target.label}에 전달했어요!
              </div>
            )
          }
          return (
            <div key={target.id} style={statusStyle("#d03b3b")}>
              {target.label}로 전달에 실패했어요. 탭을 한 번 새로고침한 뒤 다시 시도해주세요.
            </div>
          )
        })}
      </div>
    </div>
  )
}

function actionBtnStyle(primary: boolean, disabled: boolean): CSSProperties {
  return {
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: `1.5px solid ${INK}`,
    background: disabled ? "#eee" : primary ? LIME : "#fff",
    color: disabled ? "#999" : INK,
    fontWeight: 800,
    fontSize: 13,
    cursor: disabled ? "default" : "pointer",
  }
}

function statusStyle(color: string): CSSProperties {
  return { fontSize: 12, color, fontWeight: 700 }
}
