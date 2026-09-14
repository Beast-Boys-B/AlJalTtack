import { useState } from "react"
import { LIME, INK, IVORY, CARD_H } from "../theme"
import { CATEGORIES, CATEGORY_COLORS, type CategoryId } from "../categories"
import { playArcadeSound } from "../lib/sound"

export function StartPage({
  inputText,
  setInputText,
  selectedCategory,
  setSelectedCategory,
  destination,
  setDestination,
  onNext,
  onHome,
  soundEnabled,
}: {
  inputText: string
  setInputText: (v: string) => void
  selectedCategory: CategoryId | null
  setSelectedCategory: (v: CategoryId) => void
  destination: string
  setDestination: (v: string) => void
  onNext: () => void
  onHome: () => void
  soundEnabled: boolean
}) {
  const [hoveredCategory, setHoveredCategory] = useState<CategoryId | null>(
    null,
  )
  const [selectedHashtagIdx, setSelectedHashtagIdx] = useState<number | null>(
    null,
  )
  const cat = CATEGORIES.find((c) => c.id === selectedCategory)

  const placeholder = cat
    ? cat.placeholder
    : '떠오르는 대로 편하게 입력해보세요.\n\n예: "다음 달에 도쿄 여행 가려고 해요. 뭘 준비해야 할까요?"'

  const canProceed = inputText.trim().length > 0 && selectedCategory !== null

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
      {/* Sub header */}
      <div
        style={{
          padding: "16px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid #111",
          background: "#fff",
        }}
      >
        <button
          onClick={onHome}
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
          ← 메인 화면
        </button>
        <div
          className="font-pixel"
          style={{
            fontSize: 12,
            color: INK,
            background: LIME,
            padding: "4px 12px",
            border: "1.5px solid #111",
            borderRadius: 4,
            fontWeight: "bold",
          }}
        >
          STAGE 1: INPUT YOUR INTENT
        </div>
      </div>

      {/* Form section — 820px column */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "50px 40px 28px",
        }}
      >
        <div
          className="animate-fade-up"
          style={{ width: "100%", maxWidth: 820 }}
        >
          {/* Headline */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span
              className="font-pixel"
              style={{
                fontSize: 11,
                color: "#666",
                background: "#EAEAE4",
                padding: "4px 12px",
                borderRadius: 999,
                border: "1px solid #111",
              }}
            >
              STEP 01 / 02
            </span>
            <h1
              style={{
                fontFamily: "'Black Han Sans', 'Noto Sans KR', sans-serif",
                fontSize: 42,
                color: INK,
                margin: "14px 0 0",
                letterSpacing: -1,
              }}
            >
              어떤 내용으로 AI에게 물어볼까요?
            </h1>
          </div>

          {/* Hashtag Chips */}
          {cat && (
            <div
              className="animate-fade-in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              {cat.hashtags.map((item, idx) => {
                const isSelected = selectedHashtagIdx === idx
                const catColor = cat ? CATEGORY_COLORS[cat.id] : LIME
                return (
                  <button
                    key={idx}
                    className="pill-btn btn-arcade"
                    onClick={() => {
                      if (soundEnabled) playArcadeSound("select")
                      setInputText(item.example)
                      setSelectedHashtagIdx(idx)
                    }}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 999,
                      fontSize: 13.5,
                      fontWeight: 700,
                      border: `2px solid ${isSelected ? catColor : "#111"}`,
                      background: isSelected ? catColor : "#fff",
                      color: isSelected ? "#fff" : INK,
                      cursor: "pointer",
                      fontFamily: "'Noto Sans KR', sans-serif",
                      transition:
                        "background 0.15s, border-color 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.background = LIME
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.background = "#fff"
                    }}
                  >
                    {item.tag}
                  </button>
                )
              })}
            </div>
          )}

          {/* Input area */}
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value)
              setSelectedHashtagIdx(null)
            }}
            placeholder={placeholder}
            style={{
              width: "100%",
              minHeight: 180,
              padding: "24px 28px",
              fontSize: 18,
              lineHeight: 1.75,
              border: "3px solid #111",
              borderRadius: 16,
              resize: "vertical",
              outline: "none",
              fontFamily: "'Noto Sans KR', sans-serif",
              background: "#fff",
              color: INK,
              boxSizing: "border-box",
              caretColor: LIME,
              boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
            }}
          />

          {/* Travel destination */}
          {selectedCategory === "travel" && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: 18,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#fff",
                padding: "14px 20px",
                border: "2.5px solid #111",
                borderRadius: 12,
                boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: INK,
                  whiteSpace: "nowrap",
                }}
              >
                ✈️ 여행 목적지:
              </span>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="예: 도쿄, 방콕, 제주도 (선택사항)"
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  fontSize: 15,
                  border: "2px solid #111",
                  borderRadius: 8,
                  outline: "none",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  color: INK,
                  background: "#FAFAF8",
                  fontWeight: 600,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Category cards — flex-grow layout, full container width, no line break ── */}
      <div style={{ padding: "0 40px" }}>
        <div
          className="font-pixel"
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#666",
            marginBottom: 14,
          }}
        >
          ▼ SELECT STAGE CATEGORY ▼
        </div>
        {/*
          flex-grow animates from 1 → 2.8 on hover; CSS transitions flex-grow smoothly.
          Total width always = 100% of this container → no wrapping, no shift.
          Description text height is always reserved (opacity-only transition) → no vertical jank.
        */}
        <div
          style={{
            display: "flex",
            gap: 10,
            width: "100%",
            alignItems: "stretch",
          }}
        >
          {CATEGORIES.map((c) => {
            const isActive = selectedCategory === c.id
            const isHovered = hoveredCategory === c.id
            const catColor = CATEGORY_COLORS[c.id]

            return (
              <div
                key={c.id}
                style={{
                  // flex-grow is the only dimension that changes; height is fixed
                  flexGrow: isHovered ? 2.8 : 1,
                  flexShrink: 1,
                  flexBasis: 0,
                  minWidth: 108, // prevents name clipping on narrowest state
                  height: CARD_H,
                  transition: [
                    "flex-grow 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
                    "background-color 0.2s ease",
                    "border-color 0.2s ease",
                    "box-shadow 0.2s ease",
                  ].join(", "),
                  background: isActive
                    ? catColor
                    : isHovered
                      ? "#F7F7F2"
                      : "#fff",
                  border: `2.5px solid ${isActive ? catColor : "#111"}`,
                  borderRadius: 14,
                  boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                  cursor: "pointer",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
                onMouseEnter={() => setHoveredCategory(c.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => {
                  if (soundEnabled) playArcadeSound("select")
                  setSelectedCategory(c.id)
                  setSelectedHashtagIdx(null)
                }}
              >
                {/* Icon — top of card, pushes name/desc to bottom via flex-end */}
                <div
                  style={{
                    flexGrow: 1,
                    display: "flex",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{c.icon}</span>
                </div>

                {/* Category name — always visible, never clipped (whiteSpace: nowrap + overflow hidden on card) */}
                <div
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: 15,
                    fontWeight: 800,
                    color: isActive ? "#fff" : INK,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.3,
                    transition: "color 0.2s ease",
                  }}
                >
                  {c.name}
                  {isActive ? " ✓" : ""}
                </div>

                {/*
                  Description — height always reserved (18px) so card never reflows.
                  Only opacity transitions; no layout shift.
                */}
                <div
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    color: isActive ? "rgba(255,255,255,0.72)" : "#777",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    height: 18,
                    lineHeight: "18px",
                    marginTop: 3,
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.22s ease 0.12s",
                  }}
                >
                  {c.description}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "36px 40px 70px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 820,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            onClick={() => {
              if (canProceed) {
                if (soundEnabled) playArcadeSound("powerup")
                onNext()
              }
            }}
            className="btn-arcade pulse-lime"
            style={{
              background: canProceed ? LIME : "#E8E8E4",
              color: canProceed ? INK : "#888",
              fontWeight: 900,
              fontSize: 19,
              padding: "18px 64px",
              borderRadius: 999,
              border: "3px solid #111",
              cursor: canProceed ? "pointer" : "not-allowed",
              fontFamily: "'Noto Sans KR', sans-serif",
              opacity: canProceed ? 1 : 0.6,
            }}
          >
            {canProceed
              ? "🎮 프롬프트 완성하기 (START) →"
              : "카테고리를 선택해주세요"}
          </button>

          {!selectedCategory && inputText.trim() && (
            <p
              className="animate-fade-in font-pixel"
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "#555",
                margin: 0,
              }}
            >
              PLEASE SELECT A CATEGORY ABOVE 👆
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
