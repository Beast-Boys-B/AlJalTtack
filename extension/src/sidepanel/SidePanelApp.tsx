import { useMemo, useState, type CSSProperties } from "react"
import {
  CATEGORIES,
  CATEGORY_COLORS,
  detectCategoryAxes,
  generateRefinedPrompt,
  type CategoryId,
} from "../../../src/categories"
import { LIME, INK } from "../../../src/theme"
import btnLeft from "./assets/axis-buttons/btn-left.png"
import btnMid from "./assets/axis-buttons/btn-mid.png"
import btnRight from "./assets/axis-buttons/btn-right.png"
import counselingLeftPressed from "./assets/axis-buttons/pressed/counseling-left.png"
import counselingMidPressed from "./assets/axis-buttons/pressed/counseling-mid.png"
import counselingRightPressed from "./assets/axis-buttons/pressed/counseling-right.png"
import medicalLeftPressed from "./assets/axis-buttons/pressed/medical-left.png"
import medicalMidPressed from "./assets/axis-buttons/pressed/medical-mid.png"
import medicalRightPressed from "./assets/axis-buttons/pressed/medical-right.png"
import travelLeftPressed from "./assets/axis-buttons/pressed/travel-left.png"
import travelMidPressed from "./assets/axis-buttons/pressed/travel-mid.png"
import travelRightPressed from "./assets/axis-buttons/pressed/travel-right.png"
import photoLeftPressed from "./assets/axis-buttons/pressed/photo-left.png"
import photoMidPressed from "./assets/axis-buttons/pressed/photo-mid.png"
import photoRightPressed from "./assets/axis-buttons/pressed/photo-right.png"
import writingLeftPressed from "./assets/axis-buttons/pressed/writing-left.png"
import writingMidPressed from "./assets/axis-buttons/pressed/writing-mid.png"
import writingRightPressed from "./assets/axis-buttons/pressed/writing-right.png"
import sendTargetClaude from "./assets/send-targets/claude.png"
import sendTargetChatgpt from "./assets/send-targets/chatgpt.png"
import sendTargetGemini from "./assets/send-targets/gemini.png"
import sendTargetGrok from "./assets/send-targets/grok.png"

const AXIS_BTN_HEIGHT = 28

// 선택된(눌린) 버튼은 카테고리별로 색이 다른 이미지로 바뀐다
const PRESSED_AXIS_BTN: Record<CategoryId, { left: string; mid: string; right: string }> = {
  counseling: { left: counselingLeftPressed, mid: counselingMidPressed, right: counselingRightPressed },
  medical: { left: medicalLeftPressed, mid: medicalMidPressed, right: medicalRightPressed },
  travel: { left: travelLeftPressed, mid: travelMidPressed, right: travelRightPressed },
  photo: { left: photoLeftPressed, mid: photoMidPressed, right: photoRightPressed },
  writing: { left: writingLeftPressed, mid: writingMidPressed, right: writingRightPressed },
}

// 같은 축(가로줄) 안의 버튼들은 폭이 같아야 해서, 가장 긴 옵션 텍스트 기준으로
// 그 줄의 버튼 폭을 캔버스로 측정해 통일한다. 굵은 글씨(선택 시) 기준으로 재서
// 선택이 바뀌어도 폭이 흔들리지 않게 한다.
const AXIS_BTN_FONT = "800 11.5px 'Noto Sans KR', sans-serif"
const AXIS_BTN_PADDING_X = 20
let measureCtx: CanvasRenderingContext2D | null = null
function measureTextWidth(text: string): number {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d")
  }
  if (!measureCtx) return text.length * 12 // 캔버스를 못 만들면 대략치로 대체
  measureCtx.font = AXIS_BTN_FONT
  return measureCtx.measureText(text).width
}
function axisButtonWidth(options: string[]): number {
  return Math.max(...options.map((opt) => measureTextWidth(opt))) + AXIS_BTN_PADDING_X
}

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
  image: string
  urlPatterns: string[]
}
const SEND_TARGETS: SendTarget[] = [
  { id: "claude", label: "클로드", image: sendTargetClaude, urlPatterns: ["https://claude.ai/*"] },
  {
    id: "chatgpt",
    label: "챗GPT",
    image: sendTargetChatgpt,
    urlPatterns: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  },
  { id: "gemini", label: "제미니", image: sendTargetGemini, urlPatterns: ["https://gemini.google.com/*"] },
  { id: "grok", label: "그록", image: sendTargetGrok, urlPatterns: ["https://grok.x.ai/*", "https://grok.com/*"] },
]

type SendStatus = "sent" | "no-tab" | "error"

// 방향 조사 로/으로 — 받침 있는 명사("그록") 뒤엔 "으로", 없는 명사
// ("클로드", "챗GPT", "제미니") 뒤엔 "로". 유니코드 완성형 한글
// 코드포인트에서 받침 인덱스((code - 0xAC00) % 28)로 판별한다.
function withRo(label: string): string {
  const lastChar = label.trim().slice(-1)
  const code = lastChar.charCodeAt(0)
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
  return `${label}${hasBatchim ? "으로" : "로"}`
}

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
  const [pressedAxisOpt, setPressedAxisOpt] = useState<string | null>(null)

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

  const [copySuccess, setCopySuccess] = useState(false)

  const handleCopy = () => {
    navigator.clipboard
      .writeText(refined)
      .then(() => {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      })
      .catch(() => {})
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
        background: "#F0F2F5",
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

      {/* 카테고리 2줄(2개+3개) 그리드 — MobileStartPage와 동일한 배치 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
          {CATEGORIES.slice(0, 2).map((c) => (
            <CategoryButton key={c.id} c={c} active={c.id === categoryId} onClick={handleCategoryChange} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {CATEGORIES.slice(2, 5).map((c) => (
            <CategoryButton key={c.id} c={c} active={c.id === categoryId} onClick={handleCategoryChange} />
          ))}
        </div>
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

      {/* 완성된 프롬프트 — 라벨 옆에 공유/복사 아이콘 버튼(MobileComparePage AI OUTPUT 줄과 동일 패턴) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>완성된 프롬프트</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={handleCopy} disabled={!refined} style={iconBtnStyle(!refined, copySuccess)} title="프롬프트 복사">
              {copySuccess ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>
        <div
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 12.5,
            lineHeight: 1.6,
            background: "#fff",
            border: `2px solid ${INK}`,
            borderRadius: 10,
            padding: 12,
            minHeight: 100,
            color: INK,
          }}
        >
          {refined || <span style={{ color: "#aaa" }}>완성된 프롬프트가 여기에 표시돼요</span>}
        </div>
      </div>

      {/* 세부 조정 — 축(axis) 선택 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: INK }}>세부 조정</div>
        {category.axes.map((axis) => {
          const btnWidth = axisButtonWidth(axis.options)
          return (
            <div key={axis.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>{axis.label}</div>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                {axis.options.map((opt, optIdx) => {
                  const active = axes[axis.id] === opt
                  const pos = optIdx === 0 ? "left" : optIdx === axis.options.length - 1 ? "right" : "mid"
                  const bg = active
                    ? PRESSED_AXIS_BTN[categoryId][pos]
                    : pos === "left"
                      ? btnLeft
                      : pos === "right"
                        ? btnRight
                        : btnMid
                  const key = `${axis.id}:${opt}`
                  const pressed = pressedAxisOpt === key
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        setAxes((prev) => ({ ...prev, [axis.id]: opt }))
                        setSendStatus({})
                      }}
                      onMouseDown={() => setPressedAxisOpt(key)}
                      onMouseUp={() => setPressedAxisOpt(null)}
                      onMouseLeave={() => setPressedAxisOpt(null)}
                      style={{
                        flex: "0 0 auto",
                        width: btnWidth,
                        minHeight: AXIS_BTN_HEIGHT,
                        marginLeft: optIdx === 0 ? 0 : -1,
                        padding: "6px 0",
                        border: "none",
                        backgroundImage: `url(${bg})`,
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                        whiteSpace: "nowrap",
                        fontSize: 11.5,
                        fontWeight: active ? 800 : 600,
                        color: INK,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          transform: pressed ? "translateY(1px)" : "none",
                        }}
                      >
                        {opt}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>바로 보내기</div>
        <div style={{ display: "flex", gap: 8 }}>
          {SEND_TARGETS.map((target) => (
            <button
              key={target.id}
              onClick={() => handleSendTo(target)}
              disabled={!refined}
              style={actionBtnStyle(!refined)}
            >
              <img src={target.image} alt={target.label} style={{ height: 32, width: "auto" }} />
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
              {withRo(target.label)} 전달에 실패했어요. 탭을 한 번 새로고침한 뒤 다시 시도해주세요.
            </div>
          )
        })}
      </div>
    </div>
  )
}

function actionBtnStyle(disabled: boolean): CSSProperties {
  return {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 0",
    borderRadius: 8,
    border: `1.5px solid ${INK}`,
    background: "#fff",
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? "default" : "pointer",
  }
}

function statusStyle(color: string): CSSProperties {
  return { fontSize: 12, color, fontWeight: 700 }
}

function iconBtnStyle(disabled: boolean, active = false): CSSProperties {
  return {
    background: active ? LIME : "#fff",
    color: disabled ? "#999" : INK,
    padding: "5px 8px",
    borderRadius: 6,
    border: `1.5px solid ${INK}`,
    cursor: disabled ? "default" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    opacity: disabled ? 0.5 : 1,
    transition: "background 0.2s ease",
  }
}

function CategoryButton({
  c,
  active,
  onClick,
}: {
  c: (typeof CATEGORIES)[number]
  active: boolean
  onClick: (id: CategoryId) => void
}) {
  const cc = CATEGORY_COLORS[c.id]
  return (
    <button
      onClick={() => onClick(c.id)}
      style={{
        width: "100%",
        padding: "8px 4px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        border: `2px solid ${active ? cc : "#111"}`,
        background: active ? cc : "#fff",
        color: active ? "#fff" : INK,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        boxSizing: "border-box",
      }}
    >
      <span>{c.icon}</span>
      <span>{c.name}</span>
    </button>
  )
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
