import { useState, useRef, useCallback, useEffect } from "react"
import { LIME, INK, IVORY, AXIS_COLORS } from "../theme"
import { FIXED_RULES, generateRefinedPrompt, type Category } from "../categories"
import { playArcadeSound } from "../lib/sound"
import { renderHighlightedText, type HighlightEntry } from "../lib/highlight"

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
    const init: Record<string, string> = {}
    category.axes.forEach((a) => {
      init[a.id] = a.options[0]
    })
    return init
  })
  const [isRefining, setIsRefining] = useState(false)
  const [refinedPrompt, setRefinedPrompt] = useState("")
  const [hasCopied, setHasCopied] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [adjustCount, setAdjustCount] = useState(0)
  const [showHelpCard, setShowHelpCard] = useState(false)

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
    const axisIndex = category.axes.findIndex((a) => a.id === axisId)
    const axisColor = AXIS_COLORS[axisIndex] ?? "#64748B"
    refine(leftText, newAxes, { text: option, color: axisColor })
  }

  const handleCopy = () => {
    if (soundEnabled) playArcadeSound("copy")
    addScore(300)
    navigator.clipboard.writeText(refinedPrompt).catch(() => {})
    setHasCopied(true)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2200)
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
          gridTemplateColumns: "1fr 1fr 270px",
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
              flex: 1,
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
            <div
              style={{
                borderTop: "2px dashed #111",
                opacity: 0.25,
                margin: "2px 0",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#FAFAF8",
                border: "1.5px solid #111",
                borderRadius: 10,
                padding: "8px 14px",
                flexWrap: "nowrap",
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
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  className="btn-arcade"
                  onClick={() => {
                    if (soundEnabled) playArcadeSound("coin")
                    addScore(100)
                  }}
                  style={{
                    background: "#fff",
                    border: "1.5px solid #111",
                    borderRadius: 8,
                    padding: "5px 12px",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                  title="좋아요"
                >
                  👍
                </button>
                <button
                  className="btn-arcade"
                  onClick={() => {
                    if (soundEnabled) playArcadeSound("select")
                  }}
                  style={{
                    background: "#fff",
                    border: "1.5px solid #111",
                    borderRadius: 8,
                    padding: "5px 12px",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                  title="아쉬워요"
                >
                  👎
                </button>
              </div>
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

          <div style={{ borderTop: "2px dashed #111" }} />

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
                boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
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
                    : 마지막 옵션을 선택하면 훨씬 구체적인 답변을 얻을 수
                    있습니다.
                  </div>
                ))}
              </div>
            </div>
          )}
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
    </div>
  )
}
