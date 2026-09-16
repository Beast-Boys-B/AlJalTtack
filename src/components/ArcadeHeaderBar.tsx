import { useLayoutEffect, useRef, useState } from "react"
import { LIME, INK } from "../theme"
import libraryPull from "../assets/library-button/pull.svg"
import libraryPush from "../assets/library-button/push.svg"

// The SVGs' viewBox (87 x 30) is padded — the pill graphic inside is placed
// via translate(2.32 3.87) scale(.16) of a 512x132 source, so it only fills
// 132*.16 / 30 ≈ 70.4% of the full box height. To match the *visible pill's*
// height (not the padded box) to the CRT button, we size the box larger by
// the inverse of that fraction.
const LIBRARY_BTN_ASPECT = 87 / 30
const LIBRARY_BTN_VISIBLE_FRACTION = (132 * 0.16) / 30
// Slight bump on top of the CRT-matched size, per request.
const LIBRARY_BTN_EXTRA_SCALE = 1.15 * 0.9

export function ArcadeHeaderBar({
  crtEnabled,
  setCrtEnabled,
  credits,
  score,
  onHome,
  onLibrary,
  libraryActive,
  isMobile,
}: {
  crtEnabled: boolean
  setCrtEnabled: (v: boolean) => void
  credits: number
  score: number
  onHome?: () => void
  onLibrary?: () => void
  libraryActive?: boolean
  isMobile?: boolean
}) {
  // Shrinks while the mouse/finger is physically held down, grows back on
  // release — to whichever resting scale matches the (possibly just-toggled)
  // libraryActive state, since the click itself fires on mouseup.
  const [libraryHeld, setLibraryHeld] = useState(false)
  const libraryRestScale = libraryActive ? 0.94 : 1
  const libraryScale = libraryHeld ? libraryRestScale - 0.08 : libraryRestScale

  // Measure the CRT button's actual rendered height so the *visible pill*
  // inside the library SVGs matches it exactly, instead of guessing a px
  // value by hand — the box itself is sized bigger to compensate for the
  // SVGs' internal padding (see LIBRARY_BTN_VISIBLE_FRACTION above).
  const crtBtnRef = useRef<HTMLButtonElement>(null)
  const [libraryVisibleH, setLibraryVisibleH] = useState(28)
  useLayoutEffect(() => {
    if (crtBtnRef.current) setLibraryVisibleH(crtBtnRef.current.offsetHeight)
  }, [])
  const libraryBtnH = Math.round(
    (libraryVisibleH * LIBRARY_BTN_EXTRA_SCALE) / LIBRARY_BTN_VISIBLE_FRACTION,
  )
  const libraryBtnW = Math.round(libraryBtnH * LIBRARY_BTN_ASPECT)
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
          {!isMobile && (
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
          )}
        </button>
        {!isMobile && (
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
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {!isMobile && (
          <button
            ref={crtBtnRef}
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
        )}
        <button
          onClick={onLibrary}
          onMouseDown={() => setLibraryHeld(true)}
          onMouseUp={() => setLibraryHeld(false)}
          onMouseLeave={() => setLibraryHeld(false)}
          onTouchStart={() => setLibraryHeld(true)}
          onTouchEnd={() => setLibraryHeld(false)}
          aria-pressed={libraryActive}
          aria-label="라이브러리"
          style={{
            position: "relative",
            top: 1,
            width: libraryBtnW,
            height: libraryBtnH,
            padding: 0,
            border: "none",
            background: "none",
            cursor: "pointer",
            transform: `scale(${libraryScale})`,
            transition: "transform 0.15s ease-out",
          }}
        >
          <img
            src={libraryPull}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: libraryActive ? 0 : 1,
              transition: "opacity 0.25s ease",
            }}
          />
          <img
            src={libraryPush}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: libraryActive ? 1 : 0,
              transition: "opacity 0.25s ease",
            }}
          />
        </button>
      </div>
    </div>
  )
}
