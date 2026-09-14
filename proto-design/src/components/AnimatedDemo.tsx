import { useState, useEffect } from "react"
import { LIME, INK } from "../theme"
import { CATEGORIES } from "../categories"
import { playArcadeSound } from "../lib/sound"

export function AnimatedDemo({ soundEnabled }: { soundEnabled: boolean }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [typed, setTyped] = useState("")
  const demoText = "도쿄 3박 4일 여행 계획 짜줘. 맛집이랑 명소 위주로."
  const refinedText =
    "[목적지: 도쿄]\n\n자유여행 스타일, 적당한 예산으로 3박 4일\n일정을 도와주세요.\n\n[요청사항]\n• 날짜별 코스를 표로 정리해 주세요.\n• 현지인 추천 맛집을 포함해 주세요.\n• 교통·숙소 예상 예산을 알려주세요."

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>
    let interval: ReturnType<typeof setInterval>

    const runCycle = () => {
      setPhase(0)
      setTyped("")
      let i = 0
      interval = setInterval(() => {
        i++
        setTyped(demoText.slice(0, i))
        if (i >= demoText.length) {
          clearInterval(interval)
          t1 = setTimeout(() => {
            setPhase(1)
            if (soundEnabled) playArcadeSound("select")
            t1 = setTimeout(() => {
              setPhase(2)
              if (soundEnabled) playArcadeSound("powerup")
              t1 = setTimeout(runCycle, 3800)
            }, 1200)
          }, 600)
        }
      }, 55)
    }

    runCycle()
    return () => {
      clearInterval(interval)
      clearTimeout(t1)
    }
  }, [soundEnabled])

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        width: 490,
        overflow: "hidden",
        border: "3px solid #111",
        boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <div
        style={{
          background: "#111",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `2px solid ${LIME}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#FF5F57",
              border: "1px solid #000",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#FFBD2E",
              border: "1px solid #000",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#28C840",
              border: "1px solid #000",
            }}
          />
          <span
            className="font-pixel"
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: LIME,
              letterSpacing: 1,
            }}
          >
            ARCADE DEMO UNIT
          </span>
        </div>
        <div className="font-pixel" style={{ fontSize: 10, color: "#888" }}>
          PRESS 1P START
        </div>
      </div>
      <div style={{ padding: "20px 20px 16px", background: "#FAFAF8" }}>
        {phase < 2 ? (
          <>
            <div
              style={{
                background: "#fff",
                border: "3px solid",
                borderColor: phase === 0 ? INK : LIME,
                borderRadius: 12,
                padding: "14px 16px",
                minHeight: 80,
                fontSize: 14,
                color: INK,
                lineHeight: 1.7,
                transition: "border-color 0.3s",
                position: "relative",
                boxShadow: "inset 2px 2px 0 rgba(0,0,0,0.05)",
              }}
            >
              {typed || (
                <span style={{ color: "#aaa" }}>
                  떠오르는 대로 편하게 입력해보세요
                </span>
              )}
              {phase === 0 && typed.length < demoText.length && (
                <span
                  className="blink"
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: "1em",
                    background: INK,
                    verticalAlign: "text-bottom",
                    marginLeft: 2,
                  }}
                />
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              {CATEGORIES.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    background:
                      phase === 1 && c.id === "travel" ? LIME : "#fff",
                    color: INK,
                    border: `2px solid ${
                      phase === 1 && c.id === "travel" ? INK : "#DDD"
                    }`,
                    boxShadow:
                      phase === 1 && c.id === "travel"
                        ? "3px 3px 0 rgba(17,17,17,0.28)"
                        : "none",
                    transition: "all 0.25s",
                  }}
                >
                  {c.icon} {c.name}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                className="btn-arcade"
                style={{
                  background: phase === 1 ? LIME : "#E8E8E4",
                  color: INK,
                  fontWeight: 800,
                  fontSize: 13,
                  padding: "10px 22px",
                  borderRadius: 999,
                  transition: "all 0.2s",
                }}
              >
                🎮 프롬프트 생성 [START] →
              </div>
            </div>
          </>
        ) : (
          <div
            className="animate-fade-in"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <div
                className="font-pixel"
                style={{ fontSize: 10, color: "#666", marginBottom: 8 }}
              >
                [ INPUT RAW ]
              </div>
              <div
                style={{
                  background: "#fff",
                  border: "2px solid #111",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: INK,
                  lineHeight: 1.7,
                  minHeight: 110,
                  boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                }}
              >
                {demoText}
              </div>
            </div>
            <div>
              <div
                className="font-pixel"
                style={{
                  fontSize: 10,
                  color: "#111",
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>[ AI REFINED ]</span>
                <span
                  style={{
                    background: LIME,
                    color: INK,
                    padding: "1px 6px",
                    border: "1px solid #111",
                    fontWeight: "bold",
                  }}
                >
                  COMBO +100
                </span>
              </div>
              <div
                style={{
                  background: "#fff",
                  border: `2.5px solid ${INK}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 11.5,
                  color: INK,
                  lineHeight: 1.7,
                  minHeight: 110,
                  whiteSpace: "pre-wrap",
                  boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                }}
              >
                {refinedText}
              </div>
              <div
                className="btn-arcade font-pixel"
                style={{
                  marginTop: 10,
                  background: LIME,
                  color: INK,
                  fontWeight: 800,
                  fontSize: 11,
                  padding: "8px 0",
                  borderRadius: 8,
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                📋 COPY PROMPT
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
