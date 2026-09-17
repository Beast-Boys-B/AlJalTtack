import { useState } from "react"
import { LIME, INK, IVORY, AXIS_COLORS } from "../theme"
import {
  CATEGORIES,
  CATEGORY_COLORS,
  FIXED_RULES,
  generateRefinedPrompt,
  type CategoryId,
} from "../categories"
import { playArcadeSound } from "../lib/sound"

export function LibraryPage({
  onBack,
  onStartWithExample,
  soundEnabled,
}: {
  onBack: () => void
  onStartWithExample: (categoryId: CategoryId, example: string) => void
  soundEnabled: boolean
}) {
  const [activeTab, setActiveTab] = useState<CategoryId>("counseling")
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const cat = CATEGORIES.find((c) => c.id === activeTab)!
  const catColor = CATEGORY_COLORS[activeTab]

  const defaultAxes: Record<string, string> = {}
  cat.axes.forEach((a) => {
    defaultAxes[a.id] = a.options[0]
  })

  const selectedItem = selectedIdx !== null ? cat.hashtags[selectedIdx] : null
  const refinedPrompt = selectedItem
    ? generateRefinedPrompt(selectedItem.example, cat, defaultAxes)
    : ""
  const fixedRules = FIXED_RULES[activeTab]

  const handleTabChange = (id: CategoryId) => {
    setActiveTab(id)
    setSelectedIdx(null)
    if (soundEnabled) playArcadeSound("select")
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: IVORY,
        display: "flex",
        flexDirection: "column",
      }}
      className="arcade-grid"
    >
      {/* Sub header */}
      <div
        style={{
          padding: "14px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid #111",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          className="btn-arcade"
          style={{
            background: "#fff",
            border: "2px solid #111",
            padding: "6px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          <span className="back-label-full">←돌아가기</span>
          <span className="back-label-short">←</span>
        </button>
        <div
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <span
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 22,
              color: INK,
            }}
          >
            프롬프트 라이브러리
          </span>
          <span
            className="font-pixel"
            style={{
              fontSize: 9,
              background: INK,
              color: LIME,
              padding: "2px 7px",
              borderRadius: 3,
            }}
          >
            📚 LIBRARY
          </span>
        </div>
        <div className="font-pixel" style={{ fontSize: 11, color: "#666" }}>
          SELECT &amp; USE
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: "32px 48px 64px",
          overflowY: "auto",
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
        className="scrollbar-hide"
      >
        {/* Category tabs */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          {CATEGORIES.map((c) => {
            const isActive = activeTab === c.id
            const cc = CATEGORY_COLORS[c.id]
            return (
              <button
                key={c.id}
                className="btn-arcade"
                onClick={() => handleTabChange(c.id)}
                style={{
                  padding: "8px 22px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 800,
                  border: `2px solid ${isActive ? cc : "#111"}`,
                  background: isActive ? cc : "#fff",
                  color: isActive ? "#fff" : INK,
                  cursor: "pointer",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: isActive
                    ? `3px 3px 0 rgba(17,17,17,0.28)`
                    : "3px 3px 0 rgba(17,17,17,0.28)",
                }}
              >
                {c.icon} {c.name}
              </button>
            )
          })}
        </div>

        {/* Section label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 20,
              color: INK,
            }}
          >
            {cat.icon} {cat.name}
          </span>
          <span
            className="font-pixel"
            style={{
              fontSize: 9,
              background: catColor,
              color: "#fff",
              padding: "2px 7px",
              border: "1px solid #111",
            }}
          >
            {cat.arcadeBadge.split(" • ")[0]}
          </span>
          <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>
            {cat.hashtags.length}개 예시
          </span>
        </div>

        {/* Card grid or empty state */}
        {cat.hashtags.length > 0 ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {cat.hashtags.map((item, idx) => {
                const isSelected = selectedIdx === idx
                return (
                  <div
                    key={idx}
                    className="btn-arcade"
                    onClick={() => {
                      if (soundEnabled) playArcadeSound("select")
                      setSelectedIdx(isSelected ? null : idx)
                    }}
                    style={{
                      background: isSelected ? `${catColor}10` : "#fff",
                      border: `2.5px solid ${isSelected ? catColor : "#111"}`,
                      borderRadius: 14,
                      padding: "18px 20px",
                      cursor: "pointer",
                      outline: isSelected
                        ? `2px solid ${catColor}44`
                        : "none",
                      outlineOffset: 2,
                      transition: "all 0.18s",
                      boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        background: isSelected ? catColor : "#F0F0EC",
                        color: isSelected ? "#fff" : INK,
                        fontWeight: 800,
                        fontSize: 13,
                        padding: "3px 12px",
                        borderRadius: 999,
                        border: `1.5px solid ${isSelected ? catColor : "#111"}`,
                        marginBottom: 10,
                        fontFamily: "'Noto Sans KR', sans-serif",
                        transition: "all 0.18s",
                      }}
                    >
                      {item.tag}
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#444",
                        lineHeight: 1.6,
                        margin: 0,
                        fontWeight: 500,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      } as React.CSSProperties}
                    >
                      {item.example}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Inline expand */}
            {selectedItem && (
              <div
                className="animate-fade-up"
                style={{
                  marginTop: 20,
                  background: "#fff",
                  border: `2.5px solid ${catColor}`,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                }}
              >
                {/* Expand header bar */}
                <div
                  style={{
                    background: catColor,
                    padding: "10px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: 16,
                      color: "#fff",
                    }}
                  >
                    {selectedItem.tag} — 예시 상세
                  </span>
                  <button
                    onClick={() => setSelectedIdx(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: 20,
                      lineHeight: 1,
                      opacity: 0.75,
                    }}
                  >
                    ×
                  </button>
                </div>

                <div
                  style={{
                    padding: "22px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                  }}
                >
                  {/* 2-column panels */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    {/* Left: original */}
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
                          marginBottom: 10,
                        }}
                      >
                        <span className="font-pixel">[ INPUT ]</span>
                        <span
                          style={{
                            fontFamily: "'Black Han Sans', sans-serif",
                            fontSize: 13,
                          }}
                        >
                          원본
                        </span>
                      </div>
                      <div
                        style={{
                          background: "#FAFAF8",
                          border: "2px solid #111",
                          borderRadius: 10,
                          padding: "14px 16px",
                          fontSize: 13.5,
                          lineHeight: 1.7,
                          color: INK,
                          minHeight: 100,
                          boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                        }}
                      >
                        {selectedItem.example}
                      </div>
                    </div>

                    {/* Right: refined */}
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: INK,
                          background: "#9ffb64",
                          padding: "2px 8px",
                          borderRadius: 4,
                          border: "1.5px solid #111",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          marginBottom: 10,
                        }}
                      >
                        <span className="font-pixel">[ AI OUTPUT ]</span>
                        <span
                          style={{
                            fontFamily: "'Black Han Sans', sans-serif",
                            fontSize: 13,
                          }}
                        >
                          완성된 프롬프트
                        </span>
                      </div>
                      <div
                        style={{
                          background: "#FAFAF8",
                          border: "2px solid #111",
                          borderRadius: 10,
                          padding: "14px 16px",
                          fontSize: 13,
                          lineHeight: 1.7,
                          color: INK,
                          whiteSpace: "pre-wrap",
                          minHeight: 100,
                          maxHeight: 260,
                          overflowY: "auto",
                          boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                        }}
                        className="scrollbar-hide"
                      >
                        {refinedPrompt}
                      </div>
                    </div>
                  </div>

                  {/* Axis chips */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      className="font-pixel"
                      style={{ fontSize: 9, color: "#888", marginRight: 2 }}
                    >
                      DEFAULT AXES:
                    </span>
                    {cat.axes.map((axis, idx) => (
                      <div
                        key={axis.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          background: `${AXIS_COLORS[idx] ?? "#64748B"}12`,
                          border: `1.5px solid ${AXIS_COLORS[idx] ?? "#64748B"}`,
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "'Noto Sans KR', sans-serif",
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: AXIS_COLORS[idx] ?? "#64748B",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: "#777" }}>{axis.label}:</span>
                        <span style={{ color: INK }}>{defaultAxes[axis.id]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fixed rules */}
                  {fixedRules.length > 0 && (
                    <div
                      style={{
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
                        className="font-pixel"
                        style={{
                          fontSize: 9,
                          color: "#DC2626",
                          letterSpacing: 0.5,
                        }}
                      >
                        ⚠ FIXED RULE
                      </div>
                      {fixedRules.map((rule, i) => (
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
                  )}

                  {/* CTA */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      className="btn-arcade pulse-lime"
                      onClick={() => {
                        if (soundEnabled) playArcadeSound("start")
                        onStartWithExample(activeTab, selectedItem.example)
                      }}
                      style={{
                        background: "#9ffb64",
                        color: INK,
                        fontWeight: 900,
                        fontSize: 16,
                        padding: "14px 36px",
                        borderRadius: 999,
                        border: "3px solid #111",
                        cursor: "pointer",
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      이 예시로 시작하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "80px 40px",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
            <div
              className="font-pixel"
              style={{ fontSize: 12, color: "#AAA", marginBottom: 12 }}
            >
              STAGE LOADING...
            </div>
            <p
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 22,
                color: "#BBB",
                margin: 0,
              }}
            >
              아직 준비 중이에요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
