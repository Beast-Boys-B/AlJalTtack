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
import { LIME, INK, IVORY, AXIS_COLORS } from "../theme"
import {
  FIXED_RULES,
  CATEGORY_COLORS,
  generateRefinedPrompt,
  detectCategoryAxes,
  type Category,
} from "../categories"
import { playArcadeSound } from "../lib/sound"

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
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null)
  const [feedbackThanks, setFeedbackThanks] = useState(false)

  // 재조정 3회 누적 시 피드백 버튼과 함께 뜨는 객관식 설문(F-공21/P-공24/R-공25)
  const [showSurveyCard, setShowSurveyCard] = useState(false)
  const [surveyReason, setSurveyReason] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refine = useCallback(
    (text: string, ax: Record<string, string>) => {
      setIsRefining(true)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setRefinedPrompt(generateRefinedPrompt(text, category, ax, destination))
        setIsRefining(false)
      }, 500)
    },
    [category, destination],
  )

  useEffect(() => {
    refine(leftText, axes)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLeftChange = (val: string) => {
    setLeftText(val)
    if (hasCopied) {
      const next = adjustCount + 1
      setAdjustCount(next)
      if (next >= 3) setShowHelpCard(true)
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
      if (next >= 3) setShowHelpCard(true)
    }
    refine(leftText, newAxes)
  }

  const handleCopy = () => {
    if (soundEnabled) playArcadeSound("copy")
    // TC-공9/P-공13: 복사 실패 시 "복사됨" 표시하면 안 되고, 실패 안내 + 수동 복사
    // 영역을 보여줘야 한다 — 성공/실패를 실제로 구분해서 처리.
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
    if (surveyReason) return
    setSurveyReason(reason)
    fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: category.id, reason, adjustCount }),
    }).catch(() => {})
  }

  const sendFeedback = (rating: "up" | "down") => {
    if (feedbackGiven) return
    setFeedbackGiven(rating)
    if (adjustCount >= 3) setShowSurveyCard(true)
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

  const catColor = CATEGORY_COLORS[category.id]
  const fixedRules = FIXED_RULES[category.id]

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: IVORY,
      }}
      className="arcade-grid"
    >
      {/* Sub header */}
      <div
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid #111",
          background: "#fff",
          flexShrink: 0,
          gap: 8,
        }}
      >
        <button
          onClick={onBack}
          className="btn-arcade"
          style={{
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
        <span
          style={{
            background: catColor,
            color: "#fff",
            padding: "3px 10px",
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'Noto Sans KR', sans-serif",
            borderRadius: 4,
            border: "1.5px solid #111",
          }}
        >
          {category.icon} {category.name}
        </span>
        <button
          onClick={onReset}
          className="btn-arcade"
          style={{
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
          처음으로
        </button>
      </div>

      {/* Single scrollable column */}
      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {/* ① 고정 규칙 */}
        {fixedRules.length > 0 && (
          <div style={{ padding: "12px 16px 0" }}>
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

        {/* ② 자연어 입력칸 — 라벨줄+textarea를 position:relative 기준자로 묶어서
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
                  onClick={() => setShowHelpCard(false)}
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

        {/* ③ 완성된 프롬프트 — copy button */}
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

            <div style={{ position: "relative" }}>
              <button
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

          <div
            style={{
              background: "#fff",
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
              transition: "opacity 0.2s",
              boxSizing: "border-box",
            }}
            className="scrollbar-hide"
          >
            {refinedPrompt || <span style={{ color: "#aaa" }}>완성된 프롬프트가 여기에 표시돼요</span>}
          </div>

          {hasCopied && adjustCount > 0 && (
            <div
              className="font-pixel"
              style={{ fontSize: 9, color: "#888", textAlign: "right", marginTop: 4 }}
            >
              RE-ADJUSTMENT: {adjustCount} TIMES
              {adjustCount < 3 && (
                <span style={{ color: INK, fontWeight: "bold" }}> (3회 시 힌트 오픈)</span>
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

        {/* ④ 축 선택 */}
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
