// Mobile Compare page — single vertical scroll (fixed-rule box → input →
// output+copy → axis buttons → external AI links → 👍/👎 feedback).
// Layout ported from the Figma Make mobile mockup's MobileComparePage
// (mobile/src/App.tsx, ~line 4076) — layout reference only. All category
// data/logic (FIXED_RULES, generateRefinedPrompt, detectCategoryAxes) comes
// from the real ../categories module, and the behaviors below (difficulty
// survey, ARCADE HINT popup, real 👍/👎 feedback POST, hasCopied-gated
// re-adjustment counting, copy-failure fallback) are ported from the real
// desktop ComparePage.tsx, which is the source of truth for behavior.
import { useState, useRef, useCallback, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { Share } from "@capacitor/share"
import { LIME, INK, IVORY, AXIS_COLORS } from "../theme"
import {
  FIXED_RULES,
  generateRefinedPrompt,
  detectCategoryAxes,
  type Category,
} from "../categories"
import { playArcadeSound } from "../lib/sound"
import { CATEGORY_BADGES } from "../lib/categoryBadges"
import { renderHighlightedText, type HighlightEntry } from "../lib/highlight"

// Width is "auto" (not a fixed px computed from one shared aspect ratio) so
// each category's own SVG intrinsic ratio is preserved even if it differs
// from the others (e.g. medical's viewBox is wider than the rest).
const CATEGORY_BADGE_H = 26

// Capacitor로 감싸면 상대경로("/api/...")가 로컬 번들 기준으로 해석돼 실제
// 서버로 안 나간다 — 이 페이지(모바일 전용)의 API 호출만 절대경로로 고정한다.
// 데스크톱 ComparePage.tsx는 항상 브라우저로 이 도메인에 접속해 여는 것이라
// 상대경로로 둬도 문제없어 그대로 둔다.
const API_BASE = "https://proto-design-psi.vercel.app"

// api/survey.ts의 ALLOWED_REASONS와 반드시 동일하게 유지(ComparePage.tsx와 동일 목록).
const SURVEY_REASONS = [
  "원하는 톤·분위기가 안 나와요",
  "핵심 내용이 자꾸 빠져요",
  "축(옵션) 의미가 헷갈려요",
  "결과가 너무 길거나 짧아요",
  "기타",
]

export function MobileComparePage({
  inputText,
  category,
  destination,
  onBack,
  onReset,
  soundEnabled,
  addScore,
}: {
  inputText: string
  category: Category
  destination: string
  onBack: () => void
  onReset: () => void
  soundEnabled: boolean
  addScore: (pts: number) => void
}) {
  const [leftText, setLeftText] = useState(inputText)
  const [axes, setAxes] = useState<Record<string, string>>(() => {
    const detected = detectCategoryAxes(inputText, category)
    const init: Record<string, string> = {}
    category.axes.forEach((a) => {
      init[a.id] = detected[a.id] ?? a.options[0]
    })
    return init
  })
  const [isRefining, setIsRefining] = useState(false)
  const [refinedPrompt, setRefinedPrompt] = useState("")
  const [hasCopied, setHasCopied] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [adjustCount, setAdjustCount] = useState(0)
  const [showHelpCard, setShowHelpCard] = useState(false)
  // 힌트를 한 번이라도 닫으면(사용자가 "이제 안 봐도 됨"이라고 판단한 것) 이후
  // 재조정마다 자동으로 다시 뜨지 않는다 — 대신 아래 RE-ADJUSTMENT 줄에 다시
  // 열어볼 수 있는 버튼을 둔다.
  const [hintDismissed, setHintDismissed] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null)
  const [feedbackThanks, setFeedbackThanks] = useState(false)

  // 재조정 3회 누적 시 피드백 버튼과 함께 뜨는 객관식 설문(F-공21/P-공24/R-공25)
  const [showSurveyCard, setShowSurveyCard] = useState(false)
  const [surveyReason, setSurveyReason] = useState<string | null>(null)

  // Axis highlight system — ComparePage.tsx(데스크톱)에는 있었는데 모바일
  // 페이지엔 포팅이 안 돼 있던 부분(축 조정 시 바뀐 부분 색칠 표시가 안 뜨던 버그).
  const [highlights, setHighlights] = useState<HighlightEntry[]>([])
  const [neutralFlash, setNeutralFlash] = useState(false)
  const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 원래 복사 버튼(AI OUTPUT 줄)이 스크롤로 화면 밖(고정 서브헤더 아래)으로
  // 벗어나면, 처음으로 버튼이 있던 자리에 복사 버튼을 대신 띄운다 — 모바일은
  // 화면이 2개뿐이라 처음으로 버튼을 없애고 그 자리를 이 용도로 재사용.
  // 실제 스크롤은 App.tsx 쪽 조상 div(overflowY:auto)에서 일어나는데, 그 div에
  // ref가 없어 IntersectionObserver의 기본 root(뷰포트)로는 일부 브라우저에서
  // 교차 판정이 어긋날 수 있다 — getBoundingClientRect 기반 스크롤 리스너로
  // 직접 좌표를 재는 방식이 더 확실하다. window에 capture:true로 걸면 중첩된
  // overflow:auto 컨테이너의 scroll 이벤트도(버블링 안 해도) 잡힌다.
  const copyBtnRef = useRef<HTMLButtonElement>(null)
  const shareBtnRef = useRef<HTMLButtonElement>(null)
  const [showStickyCopy, setShowStickyCopy] = useState(false)
  const [showStickyShare, setShowStickyShare] = useState(false)
  const STICKY_HEADER_H = 56
  useEffect(() => {
    const check = () => {
      const copyEl = copyBtnRef.current
      if (copyEl) setShowStickyCopy(copyEl.getBoundingClientRect().bottom < STICKY_HEADER_H)
      const shareEl = shareBtnRef.current
      if (shareEl) setShowStickyShare(shareEl.getBoundingClientRect().bottom < STICKY_HEADER_H)
    }
    check()
    window.addEventListener("scroll", check, true)
    window.addEventListener("resize", check)
    return () => {
      window.removeEventListener("scroll", check, true)
      window.removeEventListener("resize", check)
    }
  }, [])

  const addHighlight = useCallback((searchText: string, color: string) => {
    const id = `hl-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const entry: HighlightEntry = { id, searchText, color, fadingOut: false }

    setHighlights((prev) => {
      // replace any existing highlight with same color (same axis)
      const filtered = prev.filter((h) => h.color !== color)
      return [...filtered, entry]
    })

    // Clear any previous timer for this color slot
    for (const [tid, timer] of highlightTimersRef.current.entries()) {
      if (tid.startsWith(color)) {
        clearTimeout(timer)
        highlightTimersRef.current.delete(tid)
      }
    }

    const fadeTimer = setTimeout(() => {
      setHighlights((prev) =>
        prev.map((h) => (h.id === id ? { ...h, fadingOut: true } : h)),
      )
      const removeTimer = setTimeout(() => {
        setHighlights((prev) => prev.filter((h) => h.id !== id))
      }, 700)
      highlightTimersRef.current.set(`${color}-remove-${id}`, removeTimer)
    }, 3000)
    highlightTimersRef.current.set(`${color}-fade-${id}`, fadeTimer)
  }, [])

  const refine = useCallback(
    (
      text: string,
      ax: Record<string, string>,
      highlightInfo?: { text: string; color: string },
    ) => {
      setIsRefining(true)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const newPrompt = generateRefinedPrompt(text, category, ax, destination)
        setRefinedPrompt(newPrompt)
        setIsRefining(false)
        if (highlightInfo && newPrompt.includes(highlightInfo.text)) {
          addHighlight(highlightInfo.text, highlightInfo.color)
        }
      }, 500)
    },
    [category, destination, addHighlight],
  )

  useEffect(() => {
    refine(leftText, axes)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      highlightTimersRef.current.forEach((t) => clearTimeout(t))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLeftChange = (val: string) => {
    setLeftText(val)
    // Direct text edit → clear axis highlights, show neutral gray flash
    setHighlights([])
    setNeutralFlash(true)
    setTimeout(() => setNeutralFlash(false), 1600)
    if (hasCopied) {
      const next = adjustCount + 1
      setAdjustCount(next)
      if (next >= 3 && !hintDismissed) setShowHelpCard(true)
    }
    refine(val, axes)
  }

  const handleAxisChange = (axisId: string, option: string) => {
    if (soundEnabled) playArcadeSound("select")
    addScore(50)
    const newAxes = { ...axes, [axisId]: option }
    setAxes(newAxes)
    if (hasCopied) {
      const next = adjustCount + 1
      setAdjustCount(next)
      if (next >= 3 && !hintDismissed) setShowHelpCard(true)
    }
    const axisIndex = category.axes.findIndex((a) => a.id === axisId)
    const axisColor = AXIS_COLORS[axisIndex] ?? "#64748B"
    refine(leftText, newAxes, { text: option, color: axisColor })
  }

  const markCopied = () => {
    addScore(300)
    setCopyFailed(false)
    setHasCopied(true)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2200)
  }

  // navigator.clipboard는 보안 컨텍스트(https 또는 localhost)가 아니면 없거나
  // writeText가 실패한다 — LAN IP(http://192.168.x.x)로 폰에서 접속할 때 흔히
  // 걸리는 경우라, 이때는 execCommand("copy") 레거시 방식으로 한 번 더 시도한다.
  const legacyCopy = (text: string) => {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.left = "-9999px"
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand("copy")
    } catch {
      ok = false
    }
    document.body.removeChild(ta)
    return ok
  }

  const handleCopy = () => {
    if (soundEnabled) playArcadeSound("copy")
    // TC-공9/P-공13: 복사 실패 시 "복사됨" 표시하면 안 되고, 실패 안내 + 수동 복사
    // 영역을 보여줘야 한다 — 성공/실패를 실제로 구분해서 처리.
    if (!navigator.clipboard) {
      if (legacyCopy(refinedPrompt)) markCopied()
      else setCopyFailed(true)
      return
    }
    navigator.clipboard
      .writeText(refinedPrompt)
      .then(markCopied)
      .catch(() => {
        if (legacyCopy(refinedPrompt)) markCopied()
        else setCopyFailed(true)
      })
  }

  // [복사]와 별개로 두는 공유 버튼 — 사용자가 앱 하나를 골라 텍스트를 바로
  // 넘길 수 있어(오버레이/자동삽입 없이 "텍스트만 건네준다"는 기존 스코프 그대로).
  // APK로 패키징되면 안드로이드 System WebView에는 Web Share API
  // (navigator.share)가 아예 구현돼있지 않아서(모바일 크롬과 다름) 버튼이
  // 조용히 사라지는 버그가 있었다 — 네이티브에서는 @capacitor/share를 쓰고,
  // 실제 모바일 브라우저에서는 기존 Web Share API를 그대로 쓴다.
  const isNative = Capacitor.isNativePlatform()
  const handleShare = () => {
    if (soundEnabled) playArcadeSound("copy")
    if (isNative) {
      Share.share({ text: refinedPrompt }).catch(() => {
        // 사용자가 공유 시트를 취소한 경우도 여기로 들어오는데, 실패로
        // 취급할 일이 아니라 조용히 무시한다.
      })
      return
    }
    navigator.share?.({ text: refinedPrompt }).catch(() => {
      // 사용자가 공유 시트를 취소한 경우(AbortError)도 여기로 들어오는데,
      // 실패로 취급할 일이 아니라 조용히 무시한다.
    })
  }
  const canShare =
    isNative || (typeof navigator !== "undefined" && typeof navigator.share === "function")

  const sendSurvey = (reason: string) => {
    if (surveyReason) return
    setSurveyReason(reason)
    fetch(`${API_BASE}/api/survey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: category.id, reason, adjustCount }),
    }).catch(() => {})
  }

  const sendFeedback = (rating: "up" | "down") => {
    if (feedbackGiven) return
    setFeedbackGiven(rating)
    if (adjustCount >= 3) setShowSurveyCard(true)
    fetch(`${API_BASE}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: category.id, axisValues: axes, rating, text: leftText }),
    })
      .then(() => {
        setFeedbackThanks(true)
        setTimeout(() => setFeedbackThanks(false), 2200)
      })
      .catch(() => {})
  }

  const SERVICES = [
    { name: "Gemini", url: "https://gemini.google.com" },
    { name: "Claude", url: "https://claude.ai" },
    { name: "ChatGPT", url: "https://chatgpt.com" },
    { name: "Grok", url: "https://grok.com" },
  ]

  const fixedRules = FIXED_RULES[category.id]

  return (
    <div
      style={{
        background: IVORY,
      }}
      className="arcade-grid"
    >
      {/* Sub header — sticky within the ancestor scroll container (App.tsx
          renders this on top of the page's overflow:auto wrapper) so it stays
          pinned to the top while the black ArcadeHeaderBar above it, and the
          content below, scroll away underneath it. */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          padding: "10px 16px",
          display: "grid",
          // 1fr/auto/1fr — the two side columns always stay equal width, so
          // the middle (badge) column sits at the true visual center no
          // matter how wide "뒤로" or the action slot end up being (unlike
          // `justifyContent: space-between`, which only centers the middle
          // item when the two side items happen to be the same width).
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          borderBottom: "2px solid #111",
          background: "#fff",
          gap: 8,
        }}
      >
        <button
          onClick={onBack}
          className="btn-arcade"
          style={{
            justifySelf: "start",
            background: "#fff",
            border: "2px solid #111",
            padding: "6px 14px",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          ← 뒤로
        </button>
        <img
          src={CATEGORY_BADGES[category.id]}
          alt={category.name}
          style={{
            justifySelf: "center",
            height: CATEGORY_BADGE_H,
            width: "auto",
          }}
        />
        {/* 처음으로 버튼 자리 — 모바일은 화면이 2개뿐이라 없앴고, 대신 원래 복사·
            공유 버튼이 스크롤로 안 보일 때 여기에 대신 뜬다. */}
        <div
          style={{
            justifySelf: "end",
            display: "flex",
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          {canShare && showStickyShare && (
            <button
              onClick={handleShare}
              className="btn-arcade"
              style={{
                background: "#fff",
                color: INK,
                fontWeight: 800,
                padding: "6px 10px",
                borderRadius: 8,
                border: "2px solid #111",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
              title="다른 앱으로 공유"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          )}
          {showStickyCopy && (
            <button
              onClick={handleCopy}
              className="btn-arcade"
              style={{
                background: copySuccess ? LIME : "#fff",
                color: INK,
                fontWeight: 800,
                padding: "6px 10px",
                borderRadius: 8,
                border: "2px solid #111",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                transition: "background 0.2s ease",
              }}
              title="프롬프트 복사"
            >
              {copySuccess ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content — no longer its own scroll container; the ancestor
          overflow:auto wrapper in App.tsx scrolls this together with the
          ArcadeHeaderBar above, while the sticky sub-header stays pinned. */}
      <div>
        {/* ① 자연어 입력칸 — 라벨줄+textarea를 position:relative 기준자로 묶어서
            힌트 팝업을 이 박스 아랫변(top:100%)에 순수 CSS로 맞물리게 한다(데스크톱
            ComparePage.tsx와 동일 기법 — JS 위치 재계산 방식은 쓰지 않는다). */}
        <div style={{ padding: "12px 16px 0", position: "relative" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#888",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            className="font-pixel"
          >
            ✏ INPUT
          </div>
          <textarea
            value={leftText}
            onChange={(e) => handleLeftChange(e.target.value)}
            style={{
              width: "100%",
              height: 110,
              padding: "14px",
              fontSize: 15,
              lineHeight: 1.7,
              border: "2.5px solid #111",
              borderRadius: 12,
              resize: "none",
              outline: "none",
              fontFamily: "'Noto Sans KR', sans-serif",
              color: INK,
              background: "#fff",
              caretColor: LIME,
              boxSizing: "border-box",
              boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
            }}
          />

          {/* ARCADE HINT — position:absolute라 레이아웃 흐름에 자리를 차지하지
              않고 아래 내용(완성된 프롬프트 카드) 위로 떠서 표시된다. */}
          {showHelpCard && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 16,
                right: 16,
                zIndex: 50,
              }}
            >
              <div
                className="animate-slide-in"
                style={{
                  background: INK,
                  color: "#fff",
                  borderRadius: 12,
                  padding: "16px 16px",
                  position: "relative",
                  border: `2px solid ${LIME}`,
                  boxShadow: "4px 4px 0 rgba(17,17,17,0.4)",
                }}
              >
                <button
                  onClick={() => {
                    setShowHelpCard(false)
                    setHintDismissed(true)
                  }}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 10,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#888",
                    fontSize: 16,
                  }}
                  aria-label="닫기"
                >
                  ×
                </button>
                <div style={{ fontSize: 18, marginBottom: 6 }}>💡</div>
                <div
                  className="font-pixel"
                  style={{ fontSize: 10, fontWeight: 700, color: LIME, marginBottom: 6 }}
                >
                  ARCADE HINT
                </div>
                <p style={{ fontSize: 12.5, color: "#DDD", lineHeight: 1.6, margin: 0 }}>
                  세부 조정을 이렇게 활용해보세요:
                </p>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {category.axes.map((axis) => (
                    <div key={axis.id} style={{ fontSize: 11.5, color: "#AAA", lineHeight: 1.5 }}>
                      <span style={{ color: LIME, fontWeight: 700 }}>• {axis.label}</span>:{" "}
                      {axis.hint ?? "옵션을 바꿔가며 결과가 어떻게 달라지는지 비교해보세요."}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ② 완성된 프롬프트 — copy button */}
        {/* [2026-09-16 수정] 원래 sticky(top:0)였으나, 텍스트 박스(최대 300px)+
            재조정 카운트까지 이 블록 전체가 상단에 들러붙어 아래 축 버튼·AI
            서비스 링크·피드백을 가리는 문제가 있어 일반 흐름(sticky 아님)으로
            되돌림 — 세로 한 화면 스크롤 구조에선 이 블록만 고정할 이유가 없다. */}
        <div
          style={{
            background: IVORY,
            padding: "10px 16px 0",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: INK,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            className="font-pixel"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#555" }}>✨ AI OUTPUT</span>
              {isRefining && (
                <span style={{ fontSize: 9, color: "#888", fontWeight: 400 }}>
                  ⏳ 정제 중…
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {canShare && (
                <button
                  ref={shareBtnRef}
                  onClick={handleShare}
                  className="btn-arcade"
                  style={{
                    background: "#fff",
                    color: INK,
                    fontWeight: 800,
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "1.5px solid #111",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    lineHeight: 1,
                  }}
                  title="다른 앱으로 공유"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
              )}

            <div style={{ position: "relative" }}>
              <button
                ref={copyBtnRef}
                onClick={handleCopy}
                className="btn-arcade"
                style={{
                  background: copySuccess ? LIME : "#fff",
                  color: INK,
                  fontWeight: 800,
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1.5px solid #111",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  lineHeight: 1,
                  transition: "background 0.2s ease",
                }}
                title="프롬프트 복사"
              >
                {copySuccess ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                )}
              </button>

              {copySuccess && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible", zIndex: 99 }}>
                  {[
                    { emoji: "🎉", tx: "-22px", ty: "-22px" },
                    { emoji: "🎊", tx: "22px", ty: "-22px" },
                    { emoji: "✨", tx: "-28px", ty: "0px" },
                    { emoji: "🌟", tx: "28px", ty: "0px" },
                    { emoji: "💥", tx: "-16px", ty: "18px" },
                    { emoji: "🎉", tx: "16px", ty: "18px" },
                  ].map((p, idx) => (
                    <span
                      key={idx}
                      className="confetti-particle"
                      style={{
                        top: "50%",
                        left: "50%",
                        marginTop: -8,
                        marginLeft: -8,
                        ["--tx" as string]: p.tx,
                        ["--ty" as string]: p.ty,
                      }}
                    >
                      {p.emoji}
                    </span>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>

          <div
            style={{
              background: neutralFlash ? "#F3F4F6" : "#fff",
              border: `2.5px solid ${INK}`,
              borderRadius: 12,
              padding: "14px",
              fontSize: 13.5,
              lineHeight: 1.7,
              color: INK,
              whiteSpace: "pre-wrap",
              minHeight: 150,
              maxHeight: 300,
              overflowY: "auto",
              boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
              opacity: isRefining ? 0.6 : 1,
              transition: "background-color 0.5s ease, opacity 0.2s",
              boxSizing: "border-box",
            }}
            className="scrollbar-hide"
          >
            {refinedPrompt ? (
              renderHighlightedText(refinedPrompt, highlights)
            ) : (
              <span style={{ color: "#aaa" }}>완성된 프롬프트가 여기에 표시돼요</span>
            )}
          </div>

          {hasCopied && adjustCount > 0 && (
            <div
              className="font-pixel"
              style={{
                fontSize: 9,
                color: "#888",
                textAlign: "right",
                marginTop: 4,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>RE-ADJUSTMENT: {adjustCount} TIMES</span>
              {adjustCount >= 3 && (
                <button
                  onClick={() => setShowHelpCard(true)}
                  className="btn-arcade font-pixel"
                  style={{
                    background: "#fff",
                    color: INK,
                    border: "1.5px solid #111",
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    cursor: "pointer",
                  }}
                >
                  HINT
                </button>
              )}
            </div>
          )}
        </div>

        {/* TC-공9/P-공13: 클립보드 복사 실패 시 수동 복사 영역 */}
        {copyFailed && (
          <div
            className="animate-fade-in"
            style={{
              margin: "8px 16px 0",
              padding: "10px 14px",
              border: "2px solid #DC2626",
              borderRadius: 10,
              background: "#FEF2F2",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#991B1B" }}>
              ⚠ 자동 복사에 실패했어요. 아래 내용을 직접 선택해서 복사해주세요.
            </p>
            <textarea
              readOnly
              value={refinedPrompt}
              onFocus={(e) => e.currentTarget.select()}
              style={{
                width: "100%",
                minHeight: 90,
                padding: 10,
                fontSize: 13,
                border: "1.5px solid #111",
                borderRadius: 8,
                fontFamily: "'Noto Sans KR', sans-serif",
                color: INK,
                background: "#fff",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>
        )}

        {/* ③ 축 선택(세부조정) */}
        <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          {category.axes.map((axis, axisIdx) => {
            const axisColor = AXIS_COLORS[axisIdx] ?? "#64748B"
            return (
              <div key={axis.id}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: INK,
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: axisColor,
                      display: "inline-block",
                      border: "2px solid rgba(0,0,0,0.15)",
                      flexShrink: 0,
                    }}
                  />
                  {axis.label}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${axis.options.length}, 1fr)`,
                    gap: 8,
                  }}
                >
                  {axis.options.map((opt) => {
                    const active = axes[axis.id] === opt
                    return (
                      <button
                        key={opt}
                        className="btn-arcade"
                        onClick={() => handleAxisChange(axis.id, opt)}
                        style={{
                          width: "100%",
                          padding: "8px 4px",
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: active ? 800 : 600,
                          border: active ? `2px solid ${axisColor}` : "1.5px solid #111",
                          background: active ? `${axisColor}18` : "#fff",
                          color: INK,
                          cursor: "pointer",
                          fontFamily: "'Noto Sans KR', sans-serif",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          textAlign: "center",
                          boxSizing: "border-box",
                          lineHeight: 1.3,
                        }}
                      >
                        {active && (
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: axisColor,
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span>{opt}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <hr style={{ margin: "16px 16px 0", border: "none", borderTop: "2px dashed #111", opacity: 0.3 }} />

        {/* ④ 고정 규칙 — 세부조정과 AI 접속 링크 사이에 배치 */}
        {fixedRules.length > 0 && (
          <div style={{ padding: "14px 16px 0" }}>
            <div
              style={{
                background: "#FFF5F5",
                border: "1.5px solid #F87171",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div className="font-pixel" style={{ fontSize: 9, color: "#DC2626" }}>
                ⚠ FIXED RULE
              </div>
              {fixedRules.map((rule, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                  <span
                    style={{
                      background: "#DC2626",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: 4,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {rule.label}
                  </span>
                  <p style={{ fontSize: 11, color: "#B91C1C", margin: 0, fontWeight: 600, lineHeight: 1.5 }}>
                    {rule.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr style={{ margin: "16px 16px 0", border: "none", borderTop: "2px dashed #111", opacity: 0.3 }} />

        {/* ⑤ AI 서비스 연결 버튼 */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {SERVICES.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-arcade"
                style={{
                  fontSize: 12,
                  color: INK,
                  fontWeight: 700,
                  padding: "9px 0",
                  background: "#fff",
                  borderRadius: 8,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #111",
                  textAlign: "center",
                }}
              >
                {s.name} ↗
              </a>
            ))}
          </div>
        </div>

        {/* ⑥ 좋아요/싫어요 — 실제 /api/feedback 저장 */}
        <div
          style={{
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            margin: "12px 16px 0",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: INK, fontFamily: "'Noto Sans KR', sans-serif" }}>
            결과가 마음에 드시나요?
          </span>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="btn-arcade"
              disabled={feedbackGiven !== null}
              onClick={() => {
                if (feedbackGiven) return
                if (soundEnabled) playArcadeSound("coin")
                addScore(100)
                sendFeedback("up")
              }}
              style={{
                background: feedbackGiven === "up" ? "#EFEFEF" : "#fff",
                border: "1.5px solid #111",
                borderRadius: 6,
                padding: "3px 12px",
                cursor: feedbackGiven ? "default" : "pointer",
                fontSize: 14,
                opacity: feedbackGiven && feedbackGiven !== "up" ? 0.4 : 1,
              }}
              title="좋아요"
            >
              👍
            </button>
            <button
              className="btn-arcade"
              disabled={feedbackGiven !== null}
              onClick={() => {
                if (feedbackGiven) return
                if (soundEnabled) playArcadeSound("select")
                sendFeedback("down")
              }}
              style={{
                background: feedbackGiven === "down" ? "#EFEFEF" : "#fff",
                border: "1.5px solid #111",
                borderRadius: 6,
                padding: "3px 12px",
                cursor: feedbackGiven ? "default" : "pointer",
                fontSize: 14,
                opacity: feedbackGiven && feedbackGiven !== "down" ? 0.4 : 1,
              }}
              title="아쉬워요"
            >
              👎
            </button>
            {feedbackThanks && (
              <span style={{ fontSize: 11.5, color: "#666", whiteSpace: "nowrap" }}>
                소중한 의견 감사합니다
              </span>
            )}
          </div>
        </div>

        {/* 재조정 3회 이상 후 평가 버튼을 눌렀을 때만 이어서 노출되는 난이도 설문
            (F-공21/P-공24/R-공25) — 데스크톱 ComparePage.tsx와 동일 트리거. */}
        {showSurveyCard && (
          <div
            className="animate-slide-in"
            style={{
              margin: "12px 16px 0",
              background: "#fff",
              color: INK,
              borderRadius: 12,
              padding: "14px 16px",
              position: "relative",
              border: "2px solid #111",
              boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
            }}
          >
            <button
              onClick={() => setShowSurveyCard(false)}
              style={{
                position: "absolute",
                top: 8,
                right: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#888",
                fontSize: 16,
              }}
              aria-label="닫기"
            >
              ×
            </button>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: INK, margin: "0 20px 10px 0", lineHeight: 1.5 }}>
              조정을 몇 번 반복하셨네요. 어떤 점이 어려우셨나요?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SURVEY_REASONS.map((reason) => {
                const selected = surveyReason === reason
                const disabled = surveyReason !== null
                return (
                  <button
                    key={reason}
                    disabled={disabled}
                    onClick={() => sendSurvey(reason)}
                    style={{
                      textAlign: "left",
                      background: selected ? LIME : "#FAFAF8",
                      border: "1.5px solid #111",
                      borderRadius: 8,
                      padding: "7px 10px",
                      fontSize: 12,
                      fontWeight: selected ? 700 : 500,
                      cursor: disabled ? "default" : "pointer",
                      opacity: disabled && !selected ? 0.45 : 1,
                    }}
                  >
                    {reason}
                  </button>
                )
              })}
            </div>
            {surveyReason && (
              <p style={{ fontSize: 11.5, color: "#666", margin: "10px 0 0" }}>소중한 의견 감사합니다</p>
            )}
          </div>
        )}

        {/* bottom spacer */}
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
