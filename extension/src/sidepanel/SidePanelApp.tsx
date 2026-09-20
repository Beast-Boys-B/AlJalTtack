import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import {
  CATEGORIES,
  detectCategoryAxes,
  generateRefinedPrompt,
  type CategoryId,
} from "../../../src/categories"
import { LIME, INK } from "../../../src/theme"
import logoMark from "../../../src/assets/logo/mark.svg"
import categoryPhotoCounseling from "./assets/category-photos/counseling.svg"
import categoryPhotoMedical from "./assets/category-photos/medical.svg"
import categoryPhotoTravel from "./assets/category-photos/travel.svg"
import categoryPhotoPhoto from "./assets/category-photos/photo.svg"
import categoryPhotoWriting from "./assets/category-photos/writing.svg"
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
import sendTargetClaude from "./assets/send-targets/claude.svg"
import sendTargetChatgpt from "./assets/send-targets/chatgpt.svg"
import sendTargetGemini from "./assets/send-targets/gemini.svg"
import sendTargetGrok from "./assets/send-targets/grok.svg"

const CATEGORY_PHOTOS: Record<CategoryId, string> = {
  counseling: categoryPhotoCounseling,
  medical: categoryPhotoMedical,
  travel: categoryPhotoTravel,
  photo: categoryPhotoPhoto,
  writing: categoryPhotoWriting,
}

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
const AXIS_BTN_BASE_FONT_SIZE = 11.5
const AXIS_BTN_MIN_FONT_SIZE = 9
const AXIS_BTN_FONT = `800 ${AXIS_BTN_BASE_FONT_SIZE}px 'Noto Sans KR', sans-serif`
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

// 세부 조정 축 패널이 접혔다 펼쳐지는 데 걸리는 시간 — 다른 카테고리로 바꿀 때
// "빠르게 접혔다가 새 축으로 펼쳐지는" 연출도 이 값과 맞춰 순서를 맞춘다.
// 완성된 프롬프트 칸도 같은 시간으로 슬라이드+디졸브된다.
const AXES_TRANSITION_MS = 220
// 자연어 칸에 처음 글을 쓰면 완성된 프롬프트가 먼저 나타나고, 축은 그 뒤를
// 이어서 나타나도록 주는 지연 시간.
const AXES_TEXT_REVEAL_DELAY_MS = 150

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

// 완성된 프롬프트/세부 조정이 슬라이드+디졸브로 열리는 동안, 매 프레임 맨
// 아래(document.documentElement.scrollHeight)로 스크롤 위치를 다시 맞춘다.
// 늘어나는 도중의 높이를 프레임마다 그대로 쫓아가므로, 딱 한 번 스크롤하고
// 기다렸다가 다 열린 뒤에야 점프하는 것과 달리 펼쳐지자마자 바로 같이
// 내려가기 시작해서 "먼저 스크롤 내려가고 뜨는" 느낌을 준다. durationMs는
// 이 카테고리/축이 다 펼쳐지는 데 걸리는 시간(트랜지션 시간)과 맞춘다.
function chaseScrollToBottom(durationMs: number) {
  const start = performance.now()
  let frameId = 0
  const tick = (now: number) => {
    window.scrollTo({ top: document.documentElement.scrollHeight })
    if (now - start < durationMs) frameId = requestAnimationFrame(tick)
  }
  frameId = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(frameId)
}

export function SidePanelApp() {
  // 켜졌을 때도, 축 선택이 전부 풀렸을 때도 "선택 안 됨" 상태가 기본값 —
  // 카테고리 버튼 하나를 다시 누르면 선택이 풀린다(토글).
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null)
  const category = categoryId ? CATEGORIES.find((c) => c.id === categoryId)! : null
  const [text, setText] = useState("")
  // 완성된 프롬프트/세부 조정 칸은 자연어를 하나도 안 썼을 땐 아예 없다가,
  // 뭔가 쓰면 나타난다 — 빈 프롬프트를 보여줄 이유가 없어서.
  const hasText = text.trim().length > 0
  const [axes, setAxes] = useState<Record<string, string>>({})
  // 세부 조정 패널에 실제로 그려지는 카테고리 — 다른 카테고리로 전환할 땐
  // categoryId(버튼 강조)는 즉시 바뀌어도, 이건 접히는 모션이 끝난 뒤에 바뀐다.
  const [axesPanelCategoryId, setAxesPanelCategoryId] = useState<CategoryId | null>(null)
  const [axesExpanded, setAxesExpanded] = useState(false)
  // 전환 도중 다른 카테고리를 또 눌렀을 때, 먼저 걸어둔 setTimeout이 뒤늦게
  // 실행되며 최신 선택을 덮어쓰지 않도록 막는 용도.
  const latestCategoryIdRef = useRef<CategoryId | null>(null)
  // 대상별로 독립적인 상태 — 하나 실패해도 다른 대상 버튼 상태에
  // 영향 없게 target.id로 키를 나눈다.
  const [sendStatus, setSendStatus] = useState<Record<string, SendStatus | undefined>>({})
  const [pressedAxisOpt, setPressedAxisOpt] = useState<string | null>(null)

  const handleCategoryChange = (id: CategoryId) => {
    setSendStatus({})
    if (id === categoryId) {
      // 같은 버튼을 다시 누르면 선택 해제 — 축 패널은 위로 밀리며 사라진다.
      latestCategoryIdRef.current = null
      setCategoryId(null)
      setAxesExpanded(false)
      return
    }

    const next = CATEGORIES.find((c) => c.id === id)!
    latestCategoryIdRef.current = id
    setCategoryId(id)
    setAxes(buildInitialAxes(text, next))

    if (categoryId === null) {
      // 아무것도 선택 안 된 상태에서 첫 선택 — 바로 아래로 밀리며 나타난다.
      // 단, 자연어를 아직 안 썼으면 접힌 채로 대기 — 타이핑하면 그때 나타남
      // (아래 hasText 이펙트가 처리).
      setAxesPanelCategoryId(id)
      setAxesExpanded(hasText)
      // 이미 글을 써둔 상태에서 카테고리를 처음 고른 경우 — 축이 펼쳐지는
      // 동안 계속 맨 아래를 쫓아간다.
      if (hasText) chaseScrollToBottom(AXES_TRANSITION_MS)
    } else {
      // 다른 카테고리가 이미 선택돼 있던 상태 — 빠르게 접었다가, 다 접힌 뒤에
      // 새 카테고리 축으로 바꿔서 다시 펼친다.
      setAxesExpanded(false)
      window.setTimeout(() => {
        if (latestCategoryIdRef.current !== id) return
        setAxesPanelCategoryId(id)
        setAxesExpanded(hasText)
        // 새 축이 펼쳐지면서 칸 높이가 다시 늘어나는 동안 맨 아래를 쫓아간다.
        if (hasText) chaseScrollToBottom(AXES_TRANSITION_MS)
      }, AXES_TRANSITION_MS)
    }
  }

  // 자연어 칸이 비어있다가 글이 생기면(또는 그 반대) 세부 조정 축을 그에 맞춰
  // 여닫는다 — 완성된 프롬프트 칸은 hasText로 직접 렌더링되니 별도 처리가
  // 필요 없고, 축만 "카테고리가 있을 때" 지연을 두고 뒤따라 나타나야 해서
  // 이펙트로 뺐다. categoryId는 의도적으로 deps에서 뺌 — 카테고리 전환은
  // 위 handleCategoryChange가 이미 처리하므로, 여긴 hasText가 바뀔 때만
  // (그 시점의 최신 categoryId를 참고해) 반응하면 된다.
  useEffect(() => {
    if (!hasText) {
      setAxesExpanded(false)
      return
    }
    // 카테고리를 아직 안 골랐으면 완성된 프롬프트 칸만 나타나고 끝 —
    // 펼쳐지는 동안(AXES_TRANSITION_MS) 계속 맨 아래를 쫓아간다.
    if (!categoryId) {
      return chaseScrollToBottom(AXES_TRANSITION_MS)
    }
    const t = window.setTimeout(() => {
      setAxesPanelCategoryId(categoryId)
      setAxesExpanded(true)
    }, AXES_TEXT_REVEAL_DELAY_MS)
    // 완성된 프롬프트가 먼저 뜨고, 지연 후 축이 뒤이어 펼쳐진다 — 두 단계 모두
    // 합친 시간(지연 + 펼침) 동안 계속 맨 아래를 쫓아가서, 각 단계가 늘어날
    // 때마다 같이 내려간다.
    const cancelChase = chaseScrollToBottom(AXES_TEXT_REVEAL_DELAY_MS + AXES_TRANSITION_MS)
    return () => {
      window.clearTimeout(t)
      cancelChase()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasText])

  const handleTextChange = (val: string) => {
    setText(val)
    setSendStatus({})
    if (!category) return
    const detected = detectCategoryAxes(val, category)
    if (Object.keys(detected).length === 0) return
    setAxes((prev) => ({ ...prev, ...detected }))
  }

  const refined = useMemo(
    () => (category ? generateRefinedPrompt(text, category, axes) : ""),
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
        // 패널을 살짝 어두운 배경(index.html의 body padding) 위에 띄워서
        // 둥근 모서리(15px — 다른 요소들과 동일한 곡률)가 실제로 보이게 함.
        // 여백은 카드의 margin이 아니라 body의 padding으로 처리돼 있음 —
        // 여기서 margin을 쓰면 위쪽 margin이 body 밖으로 겹쳐(margin
        // collapsing) 위쪽만 여백이 더 커 보이는 버그가 생긴다.
        borderRadius: 15,
        overflow: "hidden",
        background: "#F0F2F5",
        // 카드 안쪽 가장자리가 살짝 어두워지는 그라데이션 그림자 — inset
        // box-shadow는 blur 반경만큼 자연스럽게 옅어지며 퍼지는 그라데이션이라
        // 별도 그라데이션 배경 없이 이걸로 표현한다.
        boxShadow: "inset 0 0 30px rgba(0, 0, 0, 0.1)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: "'Noto Sans KR', sans-serif",
        boxSizing: "border-box",
      }}
    >
      <img src={logoMark} alt="알잘딱" style={{ height: 28, width: "auto", alignSelf: "flex-start" }} />

      {/* 카테고리 2줄(2개+3개) 그리드 — MobileStartPage와 동일한 배치 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 7 }}>
          {CATEGORIES.slice(0, 2).map((c) => (
            <CategoryButton key={c.id} c={c} active={c.id === categoryId} onClick={handleCategoryChange} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
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
          placeholder={category?.placeholder ?? "카테고리를 먼저 선택해주세요"}
          style={
            {
              width: "100%",
              boxSizing: "border-box",
              minHeight: 120,
              padding: "10px 12px",
              fontSize: 13.5,
              lineHeight: 1.6,
              background: "#fafafa",
              borderRadius: 15,
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              // 완성된 프롬프트 칸(div)처럼 내용이 늘어나면 칸 자체가 늘어나게 함 —
              // textarea는 div와 달리 기본적으로 내용에 맞춰 자동으로 커지지 않아서
              // 크롬 123+가 지원하는 field-sizing:content로 처리 (React 타입에 아직
              // 없어서 as로 캐스팅).
              fieldSizing: "content",
            } as CSSProperties
          }
        />
      </div>

      {/* 완성된 프롬프트 — 자연어 칸이 비어있으면 아예 없다가, 글을 쓰면
          아래로 밀리며 + 디졸브로 함께 나타난다(세부 조정과 같은 방식). */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: hasText ? "1fr" : "0fr",
          opacity: hasText ? 1 : 0,
          transition: `grid-template-rows ${AXES_TRANSITION_MS}ms ease, opacity ${AXES_TRANSITION_MS}ms ease`,
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          {/* 라벨 옆에 공유/복사 아이콘 버튼(MobileComparePage AI OUTPUT 줄과 동일 패턴) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 2 }}>
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
                background: "#eaeaea",
                borderRadius: 15,
                padding: 12,
                minHeight: 100,
                color: INK,
              }}
            >
              {refined || <span style={{ color: "#aaa" }}>완성된 프롬프트가 여기에 표시돼요</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 세부 조정 — 축(axis) 선택. 카테고리 선택 + 자연어 작성 여부에 따라
          아래로 밀리며 + 디졸브로 나타나거나, 위로 밀리며 사라진다
          (grid-template-rows 0fr↔1fr 트릭 — 축 개수가 카테고리마다 달라도
          높이를 몰라도 됨). */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: axesExpanded ? "1fr" : "0fr",
          opacity: axesExpanded ? 1 : 0,
          transition: `grid-template-rows ${AXES_TRANSITION_MS}ms ease, opacity ${AXES_TRANSITION_MS}ms ease`,
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: INK }}>세부 조정</div>
            {axesPanelCategoryId &&
              CATEGORIES.find((c) => c.id === axesPanelCategoryId)!.axes.map((axis) => (
                <div key={axis.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>{axis.label}</div>
                  <AxisOptionRow
                    axis={axis}
                    categoryId={axesPanelCategoryId}
                    selectedOption={axes[axis.id]}
                    pressedOption={pressedAxisOpt}
                    onSelect={(opt) => {
                      setAxes((prev) => ({ ...prev, [axis.id]: opt }))
                      setSendStatus({})
                    }}
                    onPressStart={setPressedAxisOpt}
                    onPressEnd={() => setPressedAxisOpt(null)}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>

      <br />
      <hr style={{ width: "100%", border: "none", borderTop: "1px solid #ddd", margin: 0 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>바로 보내기</div>
        <div style={{ display: "flex", gap: 18 }}>
          {SEND_TARGETS.map((target) => (
            <SendTargetButton
              key={target.id}
              target={target}
              disabled={!refined}
              onClick={() => handleSendTo(target)}
            />
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

function AxisOptionRow({
  axis,
  categoryId,
  selectedOption,
  pressedOption,
  onSelect,
  onPressStart,
  onPressEnd,
}: {
  axis: (typeof CATEGORIES)[number]["axes"][number]
  categoryId: CategoryId
  selectedOption: string | undefined
  pressedOption: string | null
  onSelect: (option: string) => void
  onPressStart: (key: string) => void
  onPressEnd: () => void
}) {
  const idealWidth = axisButtonWidth(axis.options)
  const rowRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // 버튼 폭 합이 사이드패널 폭을 넘어서 밖으로 잘려나가던 문제 — 실제로 쓸 수
  // 있는 가로 폭(이 행 자신의 렌더링 폭)을 재서, 다 안 들어가면 버튼 폭과
  // 글자 크기를 같은 비율로 줄인다. 다 들어가면 scale=1이라 기존 모습 그대로.
  useLayoutEffect(() => {
    const el = rowRef.current
    if (!el) return
    const n = axis.options.length
    const idealTotal = idealWidth * n - (n - 1) // 버튼끼리 1px씩 겹치는 것 보정
    const update = () => {
      const available = el.offsetWidth
      setScale(available > 0 && idealTotal > 0 ? Math.min(1, available / idealTotal) : 1)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [idealWidth, axis.options.length])

  const btnWidth = idealWidth * scale
  const fontSize = Math.max(AXIS_BTN_MIN_FONT_SIZE, AXIS_BTN_BASE_FONT_SIZE * scale)

  return (
    <div ref={rowRef} style={{ display: "flex", justifyContent: "flex-start" }}>
      {axis.options.map((opt, optIdx) => {
        const active = selectedOption === opt
        const pos = optIdx === 0 ? "left" : optIdx === axis.options.length - 1 ? "right" : "mid"
        const inactiveBg = pos === "left" ? btnLeft : pos === "right" ? btnRight : btnMid
        const activeBg = PRESSED_AXIS_BTN[categoryId][pos]
        const key = `${axis.id}:${opt}`
        const pressed = pressedOption === key
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            onMouseDown={() => onPressStart(key)}
            onMouseUp={onPressEnd}
            onMouseLeave={onPressEnd}
            style={{
              position: "relative",
              flex: "0 0 auto",
              width: btnWidth,
              minHeight: AXIS_BTN_HEIGHT,
              marginLeft: optIdx === 0 ? 0 : -1,
              padding: "6px 0",
              border: "none",
              background: "none",
              whiteSpace: "nowrap",
              fontSize,
              fontWeight: active ? 800 : 600,
              color: INK,
              cursor: "pointer",
            }}
          >
            {/* 선택 안 된 상태 이미지 — 선택되면 디졸브로 사라진다 */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${inactiveBg})`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                filter: "saturate(0.7)", // 선택 안 된 옵션은 채도 -30
                opacity: active ? 0 : 1,
                transition: "opacity 200ms ease",
              }}
            />
            {/* 선택된 상태 이미지 — 선택되면 디졸브로 나타난다 */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${activeBg})`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                opacity: active ? 1 : 0,
                transition: "opacity 200ms ease",
              }}
            />
            <span
              style={{
                position: "relative",
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
  )
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
  const photo = CATEGORY_PHOTOS[c.id]
  const photoRef = useRef<HTMLDivElement>(null)
  const [isPressed, setIsPressed] = useState(false)
  const [pressScale, setPressScale] = useState(1)

  // 실제로 6px만큼 작아지게(비율이 아니라 정확히 6px) — 위/아래 줄 버튼
  // 크기가 서로 달라서, 누르는 순간 실측한 폭 기준으로 스케일을 계산한다.
  const handlePressStart = () => {
    const size = photoRef.current?.offsetWidth ?? 0
    setPressScale(size > 0 ? (size - 6) / size : 1)
    setIsPressed(true)
  }
  const handlePressEnd = () => setIsPressed(false)

  return (
    <button
      onClick={() => onClick(c.id)}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      style={{
        width: "100%",
        padding: 0,
        border: "none",
        background: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        boxSizing: "border-box",
      }}
    >
      <div
        ref={photoRef}
        style={{
          width: "calc(100% - 5px)", // 전체적으로 5px 작게 — 부모 버튼이 center 정렬이라 자동으로 가운데 맞춰짐
          aspectRatio: "1 / 1",
          backgroundImage: `url(${photo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 15, // 완성된 프롬프트 칸과 동일한 곡률
          // outline은 border와 달리 배경 위치·박스 크기에 전혀 영향을 안 줘서,
          // 선택 안 됐을 때(투명) 이미지가 안쪽으로 밀려 보이는 문제가 없다.
          outline: `3px solid ${active ? "#1a1a1a" : "transparent"}`,
          outlineOffset: -3,
          filter: `saturate(${active ? 1 : 0.08})`, // 선택 안 됐을 때 채도 -92
          transform: `scale(${isPressed ? pressScale : 1})`,
          boxShadow: isPressed ? "0 3px 10px rgba(0, 0, 0, 0.35)" : "0 0 0 rgba(0, 0, 0, 0)",
          transition: "transform 150ms ease, filter 150ms ease, outline-color 200ms ease, box-shadow 150ms ease",
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 800, color: INK }}>{c.name}</span>
    </button>
  )
}

// 바로가기 버튼 밑에 적을 영문 브랜드명 + 각 브랜드 워드마크 느낌을 살린
// 폰트 스타일 — 대상마다 서체가 달라서 target.label(한글, 상태 메시지용)과
// 별도로 둔다.
const SEND_TARGET_NAME: Record<string, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  grok: "Grok",
}
const SEND_TARGET_NAME_STYLE: Record<string, CSSProperties> = {
  claude: { fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 600 },
  chatgpt: { fontFamily: "'Noto Sans KR', Arial, sans-serif", fontWeight: 500 },
  gemini: { fontFamily: "'Noto Sans KR', Arial, sans-serif", fontWeight: 300, letterSpacing: "0.7px" }, // chatgpt보다 얇게
  grok: { fontFamily: "Arial, sans-serif", fontWeight: 500, letterSpacing: "-0.2px" },
}

function SendTargetButton({
  target,
  disabled,
  onClick,
}: {
  target: SendTarget
  disabled: boolean
  onClick: () => void
}) {
  const squareRef = useRef<HTMLDivElement>(null)
  const [isPressed, setIsPressed] = useState(false)
  const [pressScale, setPressScale] = useState(1)
  // 카테고리 버튼의 선택 테두리(outline)와 같은 모양이지만, 여긴 "선택"
  // 개념이 없는 1회성 액션 버튼이라 계속 켜져있지 않다. 누르고 있는 동안엔
  // 안 뜨고, 클릭이 끝난(뗀) 시점에 0.5초만 반짝 떴다가 사라진다.
  const [showBorderFlash, setShowBorderFlash] = useState(false)
  const borderFlashTimeoutRef = useRef<number | null>(null)

  // 카테고리 이미지 버튼과 동일한 패턴(채도 변화만 제외) — 로고 자체는
  // 투명 배경이라 클릭 가능한 영역을 눈에 보이는 사각형(정사각형 안쪽
  // div)으로 따로 두고, 눌렀을 때 그 사각형이 살짝 작아지며 그림자가 생겨서
  // "여기가 눌렸다"가 로고 픽셀 유무와 무관하게 사각형 전체로 느껴지게 한다.
  const handlePressStart = () => {
    if (disabled) return
    const size = squareRef.current?.offsetWidth ?? 0
    setPressScale(size > 0 ? (size - 6) / size : 1)
    setIsPressed(true)
  }
  const handlePressEnd = () => setIsPressed(false)

  const handleClick = () => {
    if (borderFlashTimeoutRef.current != null) window.clearTimeout(borderFlashTimeoutRef.current)
    setShowBorderFlash(true)
    borderFlashTimeoutRef.current = window.setTimeout(() => setShowBorderFlash(false), 500)
    onClick()
  }

  useEffect(() => {
    return () => {
      if (borderFlashTimeoutRef.current != null) window.clearTimeout(borderFlashTimeoutRef.current)
    }
  }, [])

  return (
    <button
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      disabled={disabled}
      title={target.label}
      style={{
        flex: 1,
        padding: 0,
        border: "none",
        background: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <div
        ref={squareRef}
        style={{
          width: "calc(100% - 10px)", // 전체적으로 10px 작게 — 부모 버튼이 center 정렬이라 자동으로 가운데 맞춰짐
          aspectRatio: "1 / 1",
          borderRadius: 15, // 완성된 프롬프트 칸과 동일한 곡률
          background: `url(${target.image}) center / contain no-repeat`, // 로고 자체가 투명 배경이라 카드 배경이 그대로 비침
          opacity: disabled ? 0.4 : 1,
          transform: `scale(${isPressed ? pressScale : 1})`,
          boxShadow: isPressed ? "0 3px 10px rgba(0, 0, 0, 0.35)" : "0 0 0 rgba(0, 0, 0, 0)",
          outline: `3px solid ${showBorderFlash ? "#1a1a1a" : "transparent"}`,
          outlineOffset: -3,
          transition: "transform 150ms ease, box-shadow 150ms ease, outline-color 200ms ease",
        }}
      />
      <span
        style={{
          fontSize: 12,
          color: INK,
          opacity: disabled ? 0.4 : 1,
          ...SEND_TARGET_NAME_STYLE[target.id],
        }}
      >
        {SEND_TARGET_NAME[target.id]}
      </span>
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
