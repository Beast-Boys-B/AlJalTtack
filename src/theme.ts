// Shared design tokens. Used across pages/components — treat like
// src/categories/types.ts: a cross-cutting file, not something to change
// solo mid-session.

export const LIME = "#CCFF00"
export const INK = "#111111"
export const IVORY = "#FAFAF8"

// Card height is fixed; only flex-grow changes on hover
export const CARD_H = 114 // px

// Axis-slot colors — always 4, assigned by axis index regardless of category
// Clearly distinct from the 5 category colors in src/categories
export const AXIS_COLORS = [
  "#D97706", // 1st axis → amber
  "#DB2777", // 2nd axis → magenta / hot pink
  "#4F46E5", // 3rd axis → indigo
  "#64748B", // 4th axis → slate gray-blue
]
