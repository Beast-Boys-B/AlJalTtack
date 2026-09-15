import knob from "../assets/toggle/knob.png"

const TRACK_W = 58
const TRACK_H = 22
const KNOB_H = 18
const KNOB_W = Math.round(KNOB_H * (196 / 99)) // knob.png's native aspect ratio
const MARGIN = 2

export function HashtagToggle({
  on,
  onToggle,
}: {
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label="예시 해시태그 표시"
      style={{
        position: "relative",
        width: TRACK_W,
        height: TRACK_H,
        padding: 0,
        border: "none",
        background: "none",
        cursor: "pointer",
        borderRadius: 999,
        flexShrink: 0,
      }}
    >
      {/* Track — two gradient layers cross-fade (plain `background` can't be
          transitioned smoothly, so opacity does the crossfade instead). */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          boxSizing: "border-box",
          border: "2px solid #929292",
          background: "linear-gradient(180deg, #CCCCCC 0%, #B4B4B4 100%)",
          opacity: on ? 0 : 1,
          transition: "opacity 0.35s ease",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          boxSizing: "border-box",
          border: "2px solid #3F5A20",
          background: "linear-gradient(180deg, #D7FC53 0%, #9ED838 100%)",
          opacity: on ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      />
      <img
        src={knob}
        alt=""
        style={{
          position: "absolute",
          top: "50%",
          left: MARGIN,
          width: KNOB_W,
          height: KNOB_H,
          transform: `translateY(-50%) translateX(${
            on ? TRACK_W - KNOB_W - MARGIN * 2 : 0
          }px)`,
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: "brightness(1.12)",
        }}
      />
    </button>
  )
}
