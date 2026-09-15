import { useState, useRef, useCallback, useEffect } from "react"
import { LIME, INK, IVORY, AXIS_COLORS } from "../theme"
import {
  FIXED_RULES,
  generateRefinedPrompt,
  detectCategoryAxes,
  type Category,
} from "../categories"
import { playArcadeSound } from "../lib/sound"
import { renderHighlightedText, type HighlightEntry } from "../lib/highlight"

// "어떤 점이 어려우셨나요?" 설문 선택지(F-공21) — 팀이 아직 확정한 문구가
// 아니라 Claude 제안 임시안. api/survey.ts의 ALLOWED_REASONS와 반드시 동일하게 유지.
const SURVEY_REASONS = [
  "원하는 톤·분위기가 안 나와요",
  "핵심 내용이 자꾸 빠져요",
  "축(옵션) 의미가 헷갈려요",
  "결과가 너무 길거나 짧아요",
  "기타",
]

export function ComparePage({
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
    // 자동 감지가 구현된 카테고리는 그 결과로 초기 버튼 상태를 채우고,
    // 아직 구현 안 된 축(또는 카테고리)은 기존처럼 첫 번째 옵션을 기본값으로 둔다.
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
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null)
  const [feedbackThanks, setFeedbackThanks] = useState(false)

  // 재조정 3회 누적 시 힌트 카드와 함께 뜨는 객관식 설문(F-공21/P-공24/R-공25)
  const [showSurveyCard, setShowSurveyCard] = useState(false)
  const [surveyReason, setSurveyReason] = useState<string | null>(null)

  // Axis highlight system
  const [highlights, setHighlights] = useState<HighlightEntry[]>([])
  const [neutralFlash, setNeutralFlash] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

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
      if (next >= 3) {
        setShowHelpCard(true)
        setShowSurveyCard(true)
      }
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
      if (next >= 3) {
        setShowHelpCard(true)
        setShowSurveyCard(true)
      }
    }
    const axisIndex = category.axes.findIndex((a) => a.id === axisId)
    const axisColor = AXIS_COLORS[axisIndex] ?? "#64748B"
    refine(leftText, newAxes, { text: option, color: axisColor })
  }

  const handleCopy = () => {
    if (soundEnabled) playArcadeSound("copy")
    // TC-공9/P-공13: 복사 실패 시 "복사됨" 표시하면 안 되고, 실패 안내 +
    // 수동 복사 영역을 보여줘야 한다 — 성공/실패를 실제로 구분해서 처리.
    navigator.clipboard
      .writeText(refinedPrompt)
      .then(() => {
        addScore(300)
        setCopyFailed(false)
        setHasCopied(true)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2200)
      })
      .catch(() => {
        setCopyFailed(true)
      })
  }

  const sendSurvey = (reason: string) => {
    // 선택지 하나만 고르면 된다(F-공21, 팀 확정) — 첫 선택 후 잠금.
    if (surveyReason) return
    setSurveyReason(reason)
    fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: category.id, reason, adjustCount }),
    }).catch(() => {})
  }

  const sendFeedback = (rating: "up" | "down") => {
    // 프롬프트 완성(이 세션에서 편집·복사해간 결과)당 평가는 한 번만 — 첫 클릭 후 잠금.
    if (feedbackGiven) return
    setFeedbackGiven(rating)
    fetch("/api/feedback", {
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
    { name: "ChatGPT", url: "https://chat.openai.com" },
    { name: "Grok", url: "https://grok.x.ai" },
  ]

  return (
    <div
      style={{
        minHeight: "100vh",
        background: IVORY,
        display: "flex",
        flexDirection: "column",
      }}
      className="arcade-grid"
    >
      {/* Sub Bar */}
      <div
        style={{
          padding: "14px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid #111",
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              background: LIME,
              color: INK,
              border: "1.5px solid #111",
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: "bold",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {(() => {
              const parts = category.arcadeBadge.split(" • ")
              return parts.length === 2 ? (
                <>
                  <span className="font-pixel">{parts[0]} •</span>
                  <span
                    style={{
                      fontFamily: "'GyeonggiTitle', sans-serif",
                      fontSize: 13,
                    }}
                  >
                    {parts[1]}
                  </span>
                </>
              ) : (
                <span className="font-pixel">{category.arcadeBadge}</span>
              )
            })()}
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: INK }}>
            {category.icon} {category.name}
          </span>
          {destination && (
            <span
              style={{
                background: "#F0F0EE",
                border: "1.5px solid #111",
                color: INK,
                fontWeight: 700,
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 999,
              }}
            >
              ✈️ {destination}
            </span>
          )}
        </div>
        <div className="font-pixel" style={{ fontSize: 11, color: "#666" }}>
          STAGE 2: COMPARE & ADJUST
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "2fr 3fr 270px",
          gap: 0,
          overflow: "hidden",
          height: "calc(100vh - 120px)",
        }}
      >
        {/* Left: Original */}
        <div
          style={{
            padding: "18px 22px",
            borderRight: "2px solid #111",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "#FAFAF8",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: INK,
                background: "#E0E0DC",
                padding: "2px 8px",
                borderRadius: 4,
                border: "1.5px solid #111",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span className="font-pixel">[ 1P INPUT ]</span>
              <span
                style={{ fontFamily: "'GyeonggiTitle', sans-serif", fontSize: 13 }}
              >
                원본
              </span>
            </div>
            <div className="font-pixel" style={{ fontSize: 10, color: "#888" }}>
              {leftText.length} CHARS
            </div>
          </div>
          <textarea
            value={leftText}
            onChange={(e) => handleLeftChange(e.target.value)}
            style={{
              height: 280,
              flexShrink: 0,
              padding: "14px 16px",
              fontSize: 14.5,
              lineHeight: 1.7,
              border: "2.5px solid #111",
              borderRadius: 12,
              resize: "none",
              outline: "none",
              fontFamily: "'Noto Sans KR', sans-serif",
              color: INK,
              background: "#fff",
              caretColor: LIME,
              boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
            }}
          />

          {/* 원문 입력칸을 줄여서 생긴 공간 — 상시 존재하는 것(고정 규칙·평가)만
              여기 담는다. 힌트/설문(가끔 뜨는 것)은 레이아웃에 자리를 차지하지
              않도록 화면에 떠있는 팝업으로 따로 뺐다(아래 참고). */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              overflowY: "auto",
              minHeight: 0,
            }}
            className="scrollbar-hide"
          >
            {FIXED_RULES[category.id].length > 0 ? (
              <div
                style={{
                  flexShrink: 0,
                  background: "#FFF5F5",
                  border: "1.5px solid #F87171",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#DC2626",
                    letterSpacing: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                  className="font-pixel"
                >
                  ⚠ FIXED RULE
                </div>
                {FIXED_RULES[category.id].map((rule, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 7,
                      alignItems: "flex-start",
                    }}
                  >
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
                        marginTop: 1,
                      }}
                    >
                      {rule.label}
                    </span>
                    <p
                      style={{
                        fontSize: 11.5,
                        color: "#B91C1C",
                        margin: 0,
                        fontWeight: 600,
                        lineHeight: 1.55,
                      }}
                    >
                      {rule.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontSize: 12,
                  color: "#666",
                  margin: 0,
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                ✏️ 내용을 수정하면 오른쪽에 바로 정제되어 반영돼요.
              </p>
            )}

            {/* 만족도 평가(F-공20/P-공23) — 정제결과 칸에서 이전, 복사·바로가기와는
                독립적인 세션 피드백이라 개념적으로 여기가 더 맞다 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#fff",
                border: "1.5px solid #111",
                borderRadius: 10,
                padding: "8px 14px",
                flexWrap: "nowrap",
                flexShrink: 0,
                boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: INK,
                  whiteSpace: "nowrap",
                }}
              >
                결과가 마음에 드시나요?
              </span>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
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
                    borderRadius: 8,
                    padding: "5px 12px",
                    cursor: feedbackGiven ? "default" : "pointer",
                    fontSize: 16,
                    fontWeight: 700,
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
                    borderRadius: 8,
                    padding: "5px 12px",
                    cursor: feedbackGiven ? "default" : "pointer",
                    fontSize: 16,
                    fontWeight: 700,
                    opacity: feedbackGiven && feedbackGiven !== "down" ? 0.4 : 1,
                  }}
                  title="아쉬워요"
                >
                  👎
                </button>
                {feedbackThanks && (
                  <span style={{ fontSize: 12.5, color: "#666", whiteSpace: "nowrap" }}>
                    소중한 의견 감사합니다
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Refined */}
        <div
          style={{
            padding: "18px 22px",
            borderRight: "2px solid #111",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "#fff",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: INK,
                background: LIME,
                padding: "2px 8px",
                borderRadius: 4,
                border: "1.5px solid #111",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span className="font-pixel">[ AI OUTPUT ]</span>
              <span
                style={{ fontFamily: "'GyeonggiTitle', sans-serif", fontSize: 13 }}
              >
                완성된 프롬프트
              </span>
            </div>
            {isRefining ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#888",
                }}
              >
                <div
                  className="animate-spin"
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid #DDD",
                    borderTopColor: INK,
                    borderRadius: "50%",
                  }}
                />
                퀘스트 수행 중…
              </div>
            ) : (
              <div
                className="font-pixel"
                style={{
                  fontSize: 10,
                  color: INK,
                  fontWeight: 700,
                  background: LIME,
                  padding: "3px 8px",
                  border: "1px solid #111",
                }}
              >
                ✨ READY
              </div>
            )}
          </div>

          {/* Refined prompt with highlight rendering */}
          <div
            style={{
              flex: 1,
              padding: "14px 16px",
              fontSize: 14,
              lineHeight: 1.7,
              border: "2.5px solid #111",
              borderRadius: 12,
              background: neutralFlash ? "#F3F4F6" : "#FAFAF8",
              color: INK,
              whiteSpace: "pre-wrap",
              overflowY: "auto",
              fontFamily: "'Noto Sans KR', sans-serif",
              boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
              opacity: isRefining ? 0.6 : 1,
              transition: "background-color 0.5s ease, opacity 0.2s",
            }}
          >
            {refinedPrompt ? (
              renderHighlightedText(refinedPrompt, highlights)
            ) : (
              <span style={{ color: "#888" }}>
                정제된 프롬프트가 여기에 표시됩니다
              </span>
            )}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="btn-arcade pulse-lime"
            style={{
              background: copySuccess ? INK : LIME,
              color: copySuccess ? LIME : INK,
              fontWeight: 900,
              fontSize: 16,
              padding: "12px 0",
              borderRadius: 10,
              border: "2.5px solid #111",
              cursor: "pointer",
              width: "100%",
              fontFamily: "'Noto Sans KR', sans-serif",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              const coins = e.currentTarget.querySelectorAll(".coin-hover-icon")
              coins.forEach(
                (c) => ((c as HTMLElement).style.display = "inline-block"),
              )
            }}
            onMouseLeave={(e) => {
              const coins = e.currentTarget.querySelectorAll(".coin-hover-icon")
              coins.forEach((c) => ((c as HTMLElement).style.display = "none"))
            }}
          >
            <span
              className="coin-hover-icon"
              style={{ fontSize: 18, display: "none" }}
            >
              🪙
            </span>
            <span>
              {copySuccess ? "🎉 복사 완료! (+300 SCORE)" : "COPY PROMPT"}
            </span>
            <span
              className="coin-hover-icon"
              style={{ fontSize: 18, display: "none" }}
            >
              🪙
            </span>
          </button>

          {/* TC-공9/P-공13: 클립보드 복사 실패 시 수동 복사 영역 */}
          {copyFailed && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: 8,
                padding: "10px 14px",
                border: "2px solid #DC2626",
                borderRadius: 10,
                background: "#FEF2F2",
                flexShrink: 0,
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: 12.5, fontWeight: 700, color: "#991B1B" }}>
                ⚠ 자동 복사에 실패했어요. 아래 내용을 직접 선택해서 복사해주세요.
              </p>
              <textarea
                readOnly
                value={refinedPrompt}
                onFocus={(e) => e.currentTarget.select()}
                style={{
                  width: "100%",
                  minHeight: 100,
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

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 6,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
                padding: "4px 2px 8px 2px",
              }}
            >
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
                    padding: "6px 0",
                    background: "#fff",
                    borderRadius: 8,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    border: "2px solid #111",
                    boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = LIME
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = "#fff"
                  }}
                >
                  {s.name} ↗
                </a>
              ))}
            </div>
          </div>

          {hasCopied && adjustCount > 0 && (
            <div
              className="font-pixel"
              style={{ fontSize: 10, color: "#888", textAlign: "right" }}
            >
              RE-ADJUSTMENT: {adjustCount} TIMES
              {adjustCount < 3 && (
                <span style={{ color: INK, fontWeight: "bold" }}>
                  {" "}
                  (3회 시 힌트 오픈)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Axis sidebar */}
        <div
          style={{
            padding: "18px 18px",
            background: "#FAFAF8",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
          className="scrollbar-hide"
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: INK,
                background: "#E0E0DC",
                padding: "2px 8px",
                borderRadius: 4,
                border: "1.5px solid #111",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <span className="font-pixel">[ OPTION ]</span>
              <span
                style={{ fontFamily: "'GyeonggiTitle', sans-serif", fontSize: 13 }}
              >
                세부 조정
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "#555",
                lineHeight: 1.4,
                margin: 0,
                fontWeight: 500,
              }}
            >
              옵션을 바꾸면 해당 부분이 색으로 표시돼요.
            </p>
          </div>

          {/* Axis legend dots */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              background: "#fff",
              border: "1.5px solid #E0E0DC",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            <div
              className="font-pixel"
              style={{
                fontSize: 9,
                color: "#888",
                marginBottom: 4,
                letterSpacing: 0.5,
              }}
            >
              AXIS COLOR GUIDE
            </div>
            {category.axes.map((axis, idx) => (
              <div
                key={axis.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#555",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: AXIS_COLORS[idx] ?? "#64748B",
                    display: "inline-block",
                    flexShrink: 0,
                    border: "1.5px solid rgba(0,0,0,0.18)",
                  }}
                />
                <span style={{ fontWeight: 600 }}>{axis.label}</span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "#888",
                marginTop: 2,
                borderTop: "1px dashed #E0E0DC",
                paddingTop: 4,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#94A3B8",
                  display: "inline-block",
                  flexShrink: 0,
                  border: "1.5px solid rgba(0,0,0,0.12)",
                }}
              />
              <span>직접 수정 시</span>
            </div>
          </div>

          {category.axes.map((axis, axisIdx) => (
            <div key={axis.id}>
              {/* Axis label with colored dot */}
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: INK,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: AXIS_COLORS[axisIdx] ?? "#64748B",
                    display: "inline-block",
                    flexShrink: 0,
                    border: "2px solid rgba(0,0,0,0.15)",
                    boxShadow: `0 0 0 2px ${AXIS_COLORS[axisIdx] ?? "#64748B"}28`,
                  }}
                />
                {axis.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {axis.options.map((opt) => {
                  const active = axes[axis.id] === opt
                  const axisColor = AXIS_COLORS[axisIdx] ?? "#64748B"
                  return (
                    <button
                      key={opt}
                      className="btn-arcade"
                      onClick={() => handleAxisChange(axis.id, opt)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: active ? 800 : 600,
                        border: active
                          ? `2px solid ${axisColor}`
                          : "1.5px solid #111",
                        background: active ? `${axisColor}18` : "#fff",
                        color: INK,
                        cursor: "pointer",
                        textAlign: "left",
                        boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                        fontFamily: "'Noto Sans KR', sans-serif",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition:
                          "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                        outline: active ? `1.5px solid ${axisColor}44` : "none",
                        outlineOffset: 1,
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
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          padding: "16px 40px",
          borderTop: "2px solid #111",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "#666",
            textDecoration: "underline",
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 600,
          }}
        >
          🔄 처음으로 돌아가기
        </button>
        <button
          onClick={onBack}
          className="btn-arcade"
          style={{
            background: "#fff",
            color: INK,
            fontWeight: 800,
            fontSize: 15,
            padding: "10px 32px",
            borderRadius: 999,
            border: "2px solid #111",
            cursor: "pointer",
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          ← 뒤로가기
        </button>
      </footer>

      {/* 힌트/설문 팝업 — 레이아웃 흐름 밖에 떠서 스크롤을 따라다니는
          고정 위치 알림(가끔만 뜨는 것이라 레이아웃에 자리를 차지하지 않는다). */}
      {(showHelpCard || showSurveyCard) && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 50,
            width: 320,
            maxWidth: "calc(100vw - 40px)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {showHelpCard && (
            <div
              className="animate-slide-in"
              style={{
                background: INK,
                color: "#fff",
                borderRadius: 12,
                padding: "18px 16px",
                position: "relative",
                border: `2px solid ${LIME}`,
                boxShadow: "4px 4px 0 rgba(17,17,17,0.4)",
              }}
            >
              <button
                onClick={() => setShowHelpCard(false)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888",
                  fontSize: 16,
                }}
              >
                ×
              </button>
              <div style={{ fontSize: 20, marginBottom: 6 }}>💡</div>
              <div
                className="font-pixel"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: LIME,
                  marginBottom: 6,
                }}
              >
                ARCADE HINT
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#DDD",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                세부 조정을 이렇게 활용해보세요:
              </p>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {category.axes.map((axis) => (
                  <div
                    key={axis.id}
                    style={{ fontSize: 12, color: "#AAA", lineHeight: 1.5 }}
                  >
                    <span style={{ color: LIME, fontWeight: 700 }}>
                      • {axis.label}
                    </span>
                    : {axis.hint ?? "옵션을 바꿔가며 결과가 어떻게 달라지는지 비교해보세요."}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSurveyCard && (
            <div
              className="animate-slide-in"
              style={{
                background: "#fff",
                color: INK,
                borderRadius: 12,
                padding: "16px 16px",
                position: "relative",
                border: "2px solid #111",
                boxShadow: "4px 4px 0 rgba(17,17,17,0.4)",
              }}
            >
              <button
                onClick={() => setShowSurveyCard(false)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
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
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: INK,
                  margin: "0 20px 10px 0",
                  lineHeight: 1.5,
                }}
              >
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
                        fontSize: 12.5,
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
                <p style={{ fontSize: 12, color: "#666", margin: "10px 0 0" }}>
                  소중한 의견 감사합니다
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
