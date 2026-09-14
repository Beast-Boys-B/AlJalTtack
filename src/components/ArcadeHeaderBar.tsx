import { LIME, INK } from "../theme"

export function ArcadeHeaderBar({
  crtEnabled,
  setCrtEnabled,
  credits,
  score,
  onHome,
  onLibrary,
}: {
  crtEnabled: boolean
  setCrtEnabled: (v: boolean) => void
  credits: number
  score: number
  onHome?: () => void
  onLibrary?: () => void
}) {
  return (
    <div
      style={{
        background: "#111",
        color: "#fff",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `2px solid ${LIME}`,
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onHome}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 22,
              color: LIME,
            }}
          >
            알잘딱
          </span>
          <span
            className="font-pixel"
            style={{
              fontSize: 9,
              background: LIME,
              color: INK,
              padding: "2px 5px",
              fontWeight: "bold",
            }}
          >
            ARCADE v2.0
          </span>
        </button>
        <div
          style={{ display: "flex", alignItems: "center", gap: 12 }}
          className="font-pixel"
        >
          <div style={{ fontSize: 10, color: "#888" }}>
            SCORE:{" "}
            <span style={{ color: LIME }}>
              {score.toString().padStart(6, "0")}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#888" }}>
            CREDIT:{" "}
            <span style={{ color: "#FFDD00" }}>
              {credits.toString().padStart(2, "0")} 🪙
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => setCrtEnabled(!crtEnabled)}
          style={{
            background: crtEnabled ? LIME : "#222",
            color: crtEnabled ? INK : "#888",
            border: "1px solid #444",
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          className="font-pixel"
        >
          📺 CRT {crtEnabled ? "ON" : "OFF"}
        </button>
        <button
          onClick={onLibrary}
          style={{
            background: LIME,
            color: INK,
            border: "1px solid #444",
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          className="font-pixel"
        >
          📚 LIBRARY
        </button>
      </div>
    </div>
  )
}
