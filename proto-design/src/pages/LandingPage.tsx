import { useRef } from "react"
import { LIME, INK, IVORY } from "../theme"
import { CATEGORIES } from "../categories"
import { playArcadeSound } from "../lib/sound"
import { AnimatedDemo } from "../components/AnimatedDemo"

export function LandingPage({
  onStart,
  soundEnabled,
}: {
  onStart: () => void
  soundEnabled: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      style={{ height: "100%", overflowY: "auto", background: IVORY }}
      className="scrollbar-hide arcade-grid"
    >
      <section
        style={{
          minHeight: "calc(100vh - 46px)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          padding: "0 80px",
          gap: 50,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -100,
            right: 260,
            width: 450,
            height: 450,
            borderRadius: "50%",
            background: LIME,
            opacity: 0.18,
            filter: "blur(90px)",
            pointerEvents: "none",
          }}
        />
        <div
          className="animate-fade-up"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: INK,
              color: LIME,
              fontSize: 13,
              fontWeight: 800,
              padding: "6px 16px",
              borderRadius: 999,
              marginBottom: 24,
              border: "2px solid #111",
              boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
            }}
          >
            <span className="coin-flash">🕹️</span>
            <span>쉬운 AI 프롬프트 아케이드</span>
          </div>
          <h1
            style={{
              fontFamily: "'Black Han Sans', 'Noto Sans KR', sans-serif",
              fontSize: 68,
              lineHeight: 1.05,
              color: INK,
              margin: "0 0 20px",
              letterSpacing: -2,
            }}
          >
            알잘딱
            <br />
            <span
              style={{
                fontSize: 32,
                letterSpacing: -1,
                verticalAlign: "middle",
                opacity: 0.7,
              }}
            >
              AI PROMPT
            </span>
          </h1>
          <p
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#333",
              lineHeight: 1.6,
              margin: "0 0 36px",
              maxWidth: 460,
            }}
          >
            오늘은 무엇을 만들어볼까요?
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => {
                if (soundEnabled) playArcadeSound("start")
                onStart()
              }}
              className="btn-arcade pulse-lime"
              style={{
                background: LIME,
                color: INK,
                fontWeight: 900,
                fontSize: 20,
                padding: "20px 52px",
                borderRadius: 999,
                border: "3px solid #111",
                cursor: "pointer",
                letterSpacing: -0.3,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span>START →</span>
            </button>
            <div
              className="font-pixel"
              style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}
            >
              <span style={{ color: INK, fontWeight: "bold" }}>
                INSERT COIN (FREE)
              </span>
            </div>
          </div>
        </div>
        <div
          className="animate-fade-up"
          style={{
            animationDelay: "0.15s",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <AnimatedDemo soundEnabled={soundEnabled} />
        </div>
      </section>

      <section
        style={{
          background: INK,
          color: "#fff",
          padding: "90px 80px",
          borderTop: `4px solid ${LIME}`,
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div
            className="font-pixel"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: LIME,
              letterSpacing: 2,
              marginBottom: 20,
            }}
          >
            /// TROUBLESTAGE DETECTED ///
          </div>
          <h2
            style={{
              fontFamily: "'Black Han Sans', 'Noto Sans KR', sans-serif",
              fontSize: 52,
              lineHeight: 1.2,
              margin: "0 0 52px",
              letterSpacing: -1,
            }}
          >
            AI 사용하다 이런 보스 몬스터 만나셨나요?
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {[
              {
                level: "LV.01",
                emoji: "🤔",
                title: "질문 질문 장애물",
                text: '"뭐라고 물어봐야 원하는 답이 나올지 도무지 감이 안 잡힌다"',
              },
              {
                level: "LV.02",
                emoji: "😮‍💨",
                title: "엉뚱 답변 함정",
                text: '"AI한테 물어봤는데 엉뚱한 답만 나와서 결국 포기했다"',
              },
              {
                level: "LV.03",
                emoji: "😓",
                title: "프롬프트 건망증",
                text: '"매번 어떻게 써야 좋은 답이 나오는지 기억하기 어렵다"',
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: "#1C1C1C",
                  borderRadius: 16,
                  padding: "30px 26px",
                  border: "2px solid #333",
                  boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 36 }}>{item.emoji}</div>
                  <span
                    className="font-pixel"
                    style={{
                      fontSize: 10,
                      background: LIME,
                      color: INK,
                      padding: "2px 6px",
                      fontWeight: "bold",
                    }}
                  >
                    {item.level}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "#CCC",
                    fontWeight: 400,
                    margin: 0,
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "100px 80px", background: IVORY }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            className="font-pixel"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: INK,
              background: LIME,
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: 999,
              marginBottom: 20,
              border: "2px solid #111",
            }}
          >
            HOW TO PLAY
          </div>
          <h2
            style={{
              fontFamily: "'Black Han Sans', 'Noto Sans KR', sans-serif",
              fontSize: 52,
              lineHeight: 1.2,
              color: INK,
              margin: "0 0 60px",
              letterSpacing: -1,
            }}
          >
            게임처럼 쉽게 3단계로 끝내요
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 28,
            }}
          >
            {[
              {
                num: "STAGE 1",
                icon: "💬",
                title: "자연어로 편하게",
                desc: "떠오르는 생각을 그냥 말하듯이 써요. 문법도 형식도 신경 쓰지 마세요.",
              },
              {
                num: "STAGE 2",
                icon: "⚡️",
                title: "자동으로 정제",
                desc: "AI가 알아듣기 좋은 형태로 알아서 정제해요. 핵심은 살리고 품질은 UP!",
              },
              {
                num: "STAGE 3",
                icon: "🎯",
                title: "비교하면서 조정",
                desc: "원본과 결과를 나란히 놓고 손쉽게 옵션 버튼만 눌러 맞춤 조정해요.",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: "36px 30px",
                  border: "3px solid #111",
                  boxShadow: "3px 3px 0 rgba(17,17,17,0.28)",
                  position: "relative",
                }}
              >
                <div
                  className="font-pixel"
                  style={{
                    fontSize: 11,
                    color: INK,
                    background: LIME,
                    padding: "3px 8px",
                    border: "1.5px solid #111",
                    position: "absolute",
                    top: 20,
                    right: 20,
                    fontWeight: "bold",
                  }}
                >
                  {s.num}
                </div>
                <div style={{ fontSize: 42, marginBottom: 20 }}>{s.icon}</div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: INK,
                    margin: "0 0 12px",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.75,
                    color: "#555",
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "90px 80px",
          background: "#F2F2EC",
          borderTop: "2px solid #E0E0DC",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            className="font-pixel"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#666",
              letterSpacing: 1,
              marginBottom: 20,
            }}
          >
            SELECT CATEGORY STAGE
          </div>
          <h2
            style={{
              fontFamily: "'Black Han Sans', 'Noto Sans KR', sans-serif",
              fontSize: 50,
              lineHeight: 1.2,
              color: INK,
              margin: "0 0 52px",
              letterSpacing: -1,
            }}
          >
            필요한 모드를 선택하고 바로 시작하세요
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 18,
            }}
          >
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="btn-arcade"
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "28px 20px",
                  border: "2.5px solid #111",
                  cursor: "pointer",
                  textAlign: "center",
                }}
                onClick={() => {
                  if (soundEnabled) playArcadeSound("select")
                  onStart()
                }}
              >
                <div
                  className="font-pixel"
                  style={{
                    fontSize: 9,
                    color: "#666",
                    marginBottom: 10,
                    background: "#F0F0EC",
                    padding: "2px 4px",
                    borderRadius: 4,
                  }}
                >
                  {cat.arcadeBadge}
                </div>
                <div style={{ fontSize: 40, marginBottom: 14 }}>{cat.icon}</div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: INK,
                    margin: "0 0 8px",
                  }}
                >
                  {cat.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#666",
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {cat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          background: INK,
          color: "#fff",
          padding: "110px 80px",
          textAlign: "center",
          borderTop: `4px solid ${LIME}`,
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div
            className="font-pixel coin-flash"
            style={{ fontSize: 14, color: LIME, marginBottom: 16 }}
          >
            ★ INSERT COIN TO PLAY ★
          </div>
          <h2
            style={{
              fontFamily: "'Black Han Sans', 'Noto Sans KR', sans-serif",
              fontSize: 88,
              color: "#fff",
              margin: "0 0 16px",
              letterSpacing: -2,
            }}
          >
            <span style={{ color: LIME }}>알</span>잘딱
          </h2>
          <p
            style={{
              fontSize: 20,
              color: "#AAA",
              marginBottom: 44,
              fontWeight: 500,
            }}
          >
            알아서 잘 딱 맞게 프롬프트를 완성하는 최강 아케이드 도우미
          </p>
          <button
            onClick={() => {
              if (soundEnabled) playArcadeSound("start")
              onStart()
            }}
            className="btn-arcade pulse-lime"
            style={{
              background: LIME,
              color: INK,
              fontWeight: 900,
              fontSize: 20,
              padding: "20px 58px",
              borderRadius: 999,
              border: "3px solid #111",
              cursor: "pointer",
            }}
          >
            START →
          </button>
        </div>
      </section>
    </div>
  )
}
