// Mobile Start page — merges category picker + text input + destination
// field into one screen (no separate landing step; mobile has no landing
// page by design, see App.tsx). Layout/structure ported from the Figma Make
// mobile mockup's MobileStartPage (mobile/src/App.tsx, ~line 3693) — that
// file is layout reference only, its CATEGORIES/FIXED_RULES/generic axis
// content is stale and is NOT used here. All data comes from the real
// ../categories module, same as the desktop StartPage.
//
// 500자 상한(P-공8/P-공17)과 욕설 블랙리스트 경고(P-공9, MVP 임시 목록)는
// StartPage.tsx의 정책이라 모바일에서도 동일하게 지켜야 한다. StartPage.tsx가
// 이 상수/함수들을 export하지 않아(다른 카테고리 담당자와의 공유 파일이 아니므로)
// 여기서는 정책 텍스트·리스트를 그대로 복제해 유지한다 — StartPage.tsx와 동일하게
// 맞춰서 갱신해야 한다.
import { useState } from "react"
import { LIME, INK, IVORY } from "../theme"
import { CATEGORIES, CATEGORY_COLORS, type CategoryId } from "../categories"
import { playArcadeSound } from "../lib/sound"

const MAX_INPUT_LENGTH = 500

const PROFANITY_BLACKLIST = [
  "씨발", "씨팔", "시발", "개새끼", "병신", "지랄", "좆", "미친놈", "미친년", "개소리",
]

function findProfanity(text: string): string[] {
  return PROFANITY_BLACKLIST.filter((word) => text.includes(word))
}

function maskProfanityPreview(text: string, words: string[]): string {
  let masked = text
  for (const word of words) {
    masked = masked.split(word).join("*".repeat(word.length))
  }
  return masked
}

export function MobileStartPage({
  inputText,
  setInputText,
  selectedCategory,
  setSelectedCategory,
  destination,
  setDestination,
  onNext,
  onLibrary,
  soundEnabled,
}: {
  inputText: string
  setInputText: (v: string) => void
  selectedCategory: CategoryId | null
  setSelectedCategory: (v: CategoryId) => void
  destination: string
  setDestination: (v: string) => void
  onNext: () => void
  onLibrary: () => void
  soundEnabled: boolean
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const cat = CATEGORIES.find((c) => c.id === selectedCategory)
  const catColor = cat ? CATEGORY_COLORS[cat.id] : LIME

  const trimmedLength = inputText.trim().length
  const charCount = inputText.length
  const overLimit = charCount > MAX_INPUT_LENGTH
  const profanityHits = findProfanity(inputText)
  const hasProfanity = profanityHits.length > 0

  const canProceed =
    trimmedLength > 0 && selectedCategory !== null && !overLimit && !hasProfanity

  const ctaLabel = !selectedCategory
    ? "카테고리를 선택해주세요"
    : trimmedLength === 0
      ? "내용을 입력해주세요"
      : hasProfanity
        ? "부적절한 표현을 지워주세요"
        : overLimit
          ? "500자 이내로 입력해주세요"
          : "🎮 프롬프트 완성하기 →"

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
      {/* Category 2-row layout: 2 buttons (row 1), 3 buttons (row 2) */}
      <div
        style={{
          padding: "12px 16px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
          borderBottom: "1px solid #E0E0DC",
          background: "#fff",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {CATEGORIES.slice(0, 2).map((c) => {
            const isActive = selectedCategory === c.id
            const cc = CATEGORY_COLORS[c.id]
            return (
              <button
                key={c.id}
                className="btn-arcade"
                onClick={() => {
                  if (soundEnabled) playArcadeSound("select")
                  setSelectedCategory(c.id)
                  setShowDropdown(false)
                }}
                style={{
                  width: "100%",
                  padding: "9px 4px",
                  borderRadius: 999,
                  fontSize: 13.5,
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
            const isActive = selectedCategory === c.id
            const cc = CATEGORY_COLORS[c.id]
            return (
              <button
                key={c.id}
                className="btn-arcade"
                onClick={() => {
                  if (soundEnabled) playArcadeSound("select")
                  setSelectedCategory(c.id)
                  setShowDropdown(false)
                }}
                style={{
                  width: "100%",
                  padding: "9px 4px",
                  borderRadius: 999,
                  fontSize: 13.5,
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

      {/* Scrollable body */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "14px 16px 8px" }}
        className="scrollbar-hide"
      >
        <div style={{ position: "relative" }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              cat?.placeholder ||
              '떠오르는 대로 편하게 입력해보세요.\n\n예: "다음 달에 도쿄 여행 가려고 해요."'
            }
            style={{
              width: "100%",
              height: isFocused || showDropdown ? 180 : 380,
              padding: "16px 56px 56px 16px",
              fontSize: 16,
              lineHeight: 1.75,
              border: "3px solid #111",
              borderRadius: 16,
              resize: "none",
              outline: "none",
              fontFamily: "'Noto Sans KR', sans-serif",
              background: "#fff",
              color: INK,
              caretColor: LIME,
              boxSizing: "border-box",
              boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
              transition: "height 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          {/* 프롬프트 완성하기 — 입력창 우측 하단의 동그란 화살표 버튼 (데스크톱과 동일한 패턴) */}
          <button
            onClick={() => {
              if (!canProceed) return
              if (soundEnabled) playArcadeSound("powerup")
              onNext()
            }}
            className="btn-arcade"
            title={ctaLabel}
            aria-label={ctaLabel}
            style={{
              position: "absolute",
              right: 10,
              bottom: 14,
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "2.5px solid #111",
              background: canProceed ? LIME : "#E8E8E4",
              color: canProceed ? INK : "#999",
              fontSize: 15,
              fontWeight: 900,
              cursor: canProceed ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
            }}
          >
            →
          </button>
        </div>

        {/* 500자 상한(P-공8/P-공17) */}
        <div
          style={{
            textAlign: "right",
            fontSize: 12,
            fontWeight: 700,
            marginTop: 6,
            color: overLimit ? "#DC2626" : "#888",
          }}
        >
          {charCount} / {MAX_INPUT_LENGTH}
          {overLimit ? " · 500자를 넘었어요" : ""}
        </div>

        {/* 욕설 블랙리스트 경고(P-공9, MVP 임시 목록) */}
        {hasProfanity && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: 4,
              padding: "10px 14px",
              border: "2px solid #DC2626",
              borderRadius: 10,
              background: "#FEF2F2",
              color: "#991B1B",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            ⚠ 부적절한 표현이 포함되어 있어요: "
            {maskProfanityPreview(inputText, profanityHits)}"
          </div>
        )}

        {/* Travel destination */}
        {selectedCategory === "travel" && (
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#fff",
              padding: "12px 16px",
              border: "2.5px solid #111",
              borderRadius: 12,
              boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
              marginTop: 10,
            }}
          >
            <span
              style={{ fontSize: 15, fontWeight: 800, color: INK, whiteSpace: "nowrap" }}
            >
              ✈️ 목적지:
            </span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="도쿄, 방콕, 제주도… (선택사항)"
              style={{
                flex: 1,
                // flex 아이템 기본값(min-width:auto)이 콘텐츠 기준 최소 너비
                // 밑으로 못 줄어들게 막아서, 좁은 화면에서 입력창이 컨테이너를
                // 뚫고 나오는 문제가 있었다 — 0으로 명시해 flex:1이 실제로 화면
                // 폭에 맞게 줄어들 수 있게 한다.
                minWidth: 0,
                padding: "8px 12px",
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

        {/* 예시 더보기 dropdown */}
        {cat && (
          <div style={{ position: "relative", marginTop: 10 }}>
            <button
              onClick={() => {
                if (soundEnabled) playArcadeSound("select")
                setShowDropdown((v) => !v)
              }}
              className="btn-arcade"
              style={{
                width: "100%",
                padding: "12px 18px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                border: `2px solid ${showDropdown ? catColor : "#111"}`,
                background: showDropdown ? `${catColor}10` : "#fff",
                color: INK,
                cursor: "pointer",
                fontFamily: "'Noto Sans KR', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>▷ 예시 더보기</span>
              <span
                style={{
                  fontSize: 11,
                  color: "#888",
                  transition: "transform 0.2s",
                  display: "inline-block",
                  transform: showDropdown ? "rotate(90deg)" : "none",
                }}
              >
                ▼
              </span>
            </button>

            {showDropdown && (
              <div
                className="animate-fade-in"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: "#fff",
                  border: `2px solid ${catColor}`,
                  borderRadius: 10,
                  boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                  overflow: "hidden",
                }}
              >
                {cat.hashtags.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (soundEnabled) playArcadeSound("select")
                      setInputText(item.example)
                      setShowDropdown(false)
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      textAlign: "left",
                      border: "none",
                      borderBottom:
                        idx < cat.hashtags.length - 1 ? "1px solid #E0E0DC" : "none",
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        color: catColor,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {item.tag}
                    </span>
                    <span style={{ fontSize: 12.5, color: "#444", lineHeight: 1.55 }}>
                      {item.example}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 진행 불가 사유 안내(TC-공1) — 버튼이 입력창 안으로 옮겨오며 함께 이동 */}
        {!canProceed && trimmedLength > 0 && !overLimit && !hasProfanity && (
          <p
            className="animate-fade-in font-pixel"
            style={{
              textAlign: "right",
              fontSize: 11,
              color: "#555",
              margin: "8px 0 0",
            }}
          >
            {ctaLabel}
          </p>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
