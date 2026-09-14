// Axis-change highlight system: marks which part of the refined prompt
// changed because of which axis toggle (color-coded, fades out after a
// few seconds). Shared by ComparePage (live UI) and LibraryPage (static
// preview cards) — kept here so both stay in sync automatically.

import type { ReactNode } from "react"

export interface HighlightEntry {
  id: string
  searchText: string
  color: string
  fadingOut: boolean
}

export function renderHighlightedText(
  text: string,
  highlights: HighlightEntry[],
): ReactNode {
  if (!highlights.length) return text

  interface Seg {
    text: string
    highlight?: HighlightEntry
  }
  let segments: Seg[] = [{ text }]

  for (const hl of highlights) {
    const next: Seg[] = []
    for (const seg of segments) {
      if (seg.highlight) {
        next.push(seg)
        continue
      }
      const idx = seg.text.indexOf(hl.searchText)
      if (idx === -1) {
        next.push(seg)
      } else {
        if (idx > 0) next.push({ text: seg.text.slice(0, idx) })
        next.push({ text: hl.searchText, highlight: hl })
        const rest = seg.text.slice(idx + hl.searchText.length)
        if (rest) next.push({ text: rest })
      }
    }
    segments = next
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <span
            key={i}
            style={{
              backgroundColor: seg.highlight.fadingOut
                ? "transparent"
                : seg.highlight.color + "38",
              borderRadius: 3,
              padding: "1px 3px",
              outline: seg.highlight.fadingOut
                ? "none"
                : `1.5px solid ${seg.highlight.color}88`,
              transition: "background-color 0.7s ease, outline-color 0.7s ease",
            }}
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}
