// Mobile Library page — per-category tab + hashtag example cards; tapping a
// card opens a swipe-down-to-dismiss detail sheet with a rendered preview
// prompt. Layout ported from the Figma Make mobile mockup's
// MobileLibraryPage (mobile/src/App.tsx, ~line 4630) — layout reference
// only. All data comes from the real ../categories module, same as the
// desktop LibraryPage.
import { useEffect, useRef, useState } from "react"
import { LIME, INK, IVORY, AXIS_COLORS } from "../theme"
import {
  CATEGORIES,
  CATEGORY_COLORS,
  FIXED_RULES,
  generateRefinedPrompt,
  type CategoryId,
} from "../categories"
import { playArcadeSound } from "../lib/sound"

export function MobileLibraryPage({
  onHome,
  onStartWithExample,
  soundEnabled,
}: {
  onHome: () => void
  onStartWithExample: (categoryId: CategoryId, example: string) => void
  soundEnabled: boolean
}) {
  const [activeTab, setActiveTab] = useState<CategoryId>("counseling")
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  // 중앙 바를 위로 끌면 무조건 전체(카테고리 탭까지) 덮게 펼쳐지고, 아래로
  // 끌면 무조건 원래 자리로 돌아온다 — 중간에 멈추는 상태 없음.
  const [expanded, setExpanded] = useState(false)
  const touchStartRef = useRef<number | null>(null)

  // 접혔을 땐 해시태그 카드 바로 아래(카드들은 안 가림), 펼치면 "프롬프트
  // 라이브러리" 헤더 아래 선까지(탭·카드 다 덮음) — 시트의 top으로 쓴다.
  // collapsedTop은 카드를 누르는 순간 grid 바닥의 화면상 y좌표를 재서 고정한다.
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [headerBottom, setHeaderBottom] = useState(0)
  const [collapsedTop, setCollapsedTop] = useState(0)
  useEffect(() => {
    const measure = () => setHeaderBottom(headerRef.current?.getBoundingClientRect().bottom ?? 0)
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  const DETAIL_GAP = 12

  const openDetail = (idx: number | null) => {
    setSelectedIdx(idx)
    setExpanded(false)
    if (idx !== null) setCollapsedTop((gridRef.current?.getBoundingClientRect().bottom ?? 0) + DETAIL_GAP)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartRef.current
    if (delta < -20) setExpanded(true)
    else if (delta > 20) setExpanded(false)
    touchStartRef.current = null
  }

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
    setExpanded(false)
    if (soundEnabled) playArcadeSound("select")
  }

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
      {/* Header */}
      <div
        ref={headerRef}
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid #111",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onHome}
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
          ← 메인
        </button>
        <span style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 18, color: INK }}>
          프롬프트 라이브러리
        </span>
        <span className="font-pixel" style={{ fontSize: 11, color: "#888" }}>
          📚
        </span>
      </div>

      {/* Category tabs — 2-row layout: 2 buttons (row 1), 3 buttons (row 2) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "10px 16px",
          flexShrink: 0,
          borderBottom: "1px solid #E0E0DC",
          background: "#fff",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {CATEGORIES.slice(0, 2).map((c) => {
            const isActive = activeTab === c.id
            const cc = CATEGORY_COLORS[c.id]
            return (
              <button
                key={c.id}
                className="btn-arcade"
                onClick={() => handleTabChange(c.id)}
                style={{
                  width: "100%",
                  padding: "8px 4px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 800,
                  border: `2px solid ${isActive ? cc : "#111"}`,
                  background: isActive ? cc : "#fff",
                  color: isActive ? "#fff" : INK,
                  cursor: "pointer",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            )
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {CATEGORIES.slice(2, 5).map((c) => {
            const isActive = activeTab === c.id
            const cc = CATEGORY_COLORS[c.id]
            return (
              <button
                key={c.id}
                className="btn-arcade"
                onClick={() => handleTabChange(c.id)}
                style={{
                  width: "100%",
                  padding: "8px 4px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 800,
                  border: `2px solid ${isActive ? cc : "#111"}`,
                  background: isActive ? cc : "#fff",
                  color: isActive ? "#fff" : INK,
                  cursor: "pointer",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
        className="scrollbar-hide"
      >
        {cat.hashtags.length > 0 ? (
          <>
            <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {cat.hashtags.map((item, idx) => {
                const isSelected = selectedIdx === idx
                return (
                  <div
                    key={idx}
                    className="btn-arcade"
                    onClick={() => {
                      if (soundEnabled) playArcadeSound("select")
                      openDetail(isSelected ? null : idx)
                    }}
                    style={{
                      background: isSelected ? `${catColor}10` : "#fff",
                      border: `2px solid ${isSelected ? catColor : "#111"}`,
                      borderRadius: 12,
                      padding: "14px",
                      cursor: "pointer",
                      boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                      transition: "all 0.18s",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        background: isSelected ? catColor : "#F0F0EC",
                        color: isSelected ? "#fff" : INK,
                        fontWeight: 800,
                        fontSize: 12,
                        padding: "2px 10px",
                        borderRadius: 999,
                        border: `1.5px solid ${isSelected ? catColor : "#111"}`,
                        marginBottom: 8,
                        fontFamily: "'Noto Sans KR', sans-serif",
                        transition: "all 0.18s",
                      }}
                    >
                      {item.tag}
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#444",
                        lineHeight: 1.55,
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

            {/* 바텀시트 — 헤더의 중앙 바를 위/아래로 끌면 "프롬프트 라이브러리"
                헤더 아래 선까지만 덮는 전체 높이와 원래(peek) 높이, 이 둘 사이만
                스냅한다(중간 정지 없음). bottom을 고정하고 height만 애니메이션해서
                항상 카드(둥근 모서리·테두리) 모양을 유지한 채 스르륵 늘어난다. */}
            {selectedItem && (
              <div
                className="animate-fade-up"
                style={{
                  position: "fixed",
                  left: 12,
                  right: 12,
                  bottom: 16,
                  height: `calc(100vh - ${(expanded ? headerBottom - 6 : collapsedTop)}px - 16px)`,
                  transition: "height 0.3s ease",
                  background: "#fff",
                  border: `2.5px solid ${catColor}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                  display: "flex",
                  flexDirection: "column",
                  zIndex: 50,
                }}
              >
                <div
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    background: catColor,
                    padding: "8px 16px 6px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flexShrink: 0,
                    cursor: "grab",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 5,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.75)",
                      marginBottom: 6,
                    }}
                  />
                  <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 15, color: "#fff" }}>
                      {selectedItem.tag} 예시 상세
                    </span>
                    <button
                      onClick={() => setSelectedIdx(null)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", fontSize: 20, lineHeight: 1 }}
                      aria-label="닫기"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div
                  style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}
                  className="scrollbar-hide"
                >
                  {/* Original */}
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
                        gap: 4,
                        marginBottom: 8,
                      }}
                    >
                      <span className="font-pixel">[ INPUT ]</span>
                      <span style={{ fontFamily: "'GyeonggiTitle', sans-serif", fontSize: 13 }}>원본</span>
                    </div>
                    <div
                      style={{
                        background: "#FAFAF8",
                        border: "2px solid #111",
                        borderRadius: 8,
                        padding: "12px",
                        fontSize: 13,
                        lineHeight: 1.65,
                        color: INK,
                        boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                      }}
                    >
                      {selectedItem.example}
                    </div>
                  </div>

                  {/* Refined */}
                  <div>
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
                        gap: 4,
                        marginBottom: 8,
                      }}
                    >
                      <span className="font-pixel">[ AI OUTPUT ]</span>
                      <span style={{ fontFamily: "'GyeonggiTitle', sans-serif", fontSize: 13 }}>완성된 프롬프트</span>
                    </div>
                    <div
                      style={{
                        background: "#FAFAF8",
                        border: "2px solid #111",
                        borderRadius: 8,
                        padding: "12px",
                        fontSize: 12.5,
                        lineHeight: 1.65,
                        color: INK,
                        whiteSpace: "pre-wrap",
                        boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                      }}
                    >
                      {refinedPrompt}
                    </div>
                  </div>

                  {/* Axis chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="font-pixel" style={{ fontSize: 8, color: "#888" }}>
                      DEFAULT:
                    </span>
                    {cat.axes.map((axis, idx) => (
                      <div
                        key={axis.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: `${AXIS_COLORS[idx] ?? "#64748B"}12`,
                          border: `1.5px solid ${AXIS_COLORS[idx] ?? "#64748B"}`,
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "'Noto Sans KR', sans-serif",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
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
                        borderRadius: 8,
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div className="font-pixel" style={{ fontSize: 8, color: "#DC2626" }}>
                        ⚠ FIXED RULE
                      </div>
                      {fixedRules.map((rule, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                          <span
                            style={{
                              background: "#DC2626",
                              color: "#fff",
                              fontSize: 9,
                              fontWeight: 800,
                              padding: "1px 5px",
                              borderRadius: 3,
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
                  )}

                  {/* CTA */}
                  <button
                    className="btn-arcade pulse-lime"
                    onClick={() => {
                      if (soundEnabled) playArcadeSound("start")
                      onStartWithExample(activeTab, selectedItem.example)
                    }}
                    style={{
                      width: "100%",
                      background: LIME,
                      color: INK,
                      fontWeight: 900,
                      fontSize: 15,
                      padding: "14px",
                      borderRadius: 999,
                      border: "3px solid #111",
                      cursor: "pointer",
                      fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  >
                    🎮 이 예시로 시작하기 →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
            <div className="font-pixel" style={{ fontSize: 10, color: "#AAA", marginBottom: 10 }}>
              STAGE LOADING...
            </div>
            <p style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 20, color: "#BBB", margin: 0 }}>
              아직 준비 중이에요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
