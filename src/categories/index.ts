// Aggregates the 5 per-category modules into the shapes App.tsx (and the
// page components) already expect. Nobody should need to touch this file to
// add/change one category's behavior — that all happens inside
// ./counseling.ts, ./medical.ts, ./travel.ts, ./photo.ts, ./writing.ts.

import type { Category, CategoryId, FixedRule } from "./types"
import * as counseling from "./counseling"
import * as medical from "./medical"
import * as travel from "./travel"
import * as photo from "./photo"
import * as writing from "./writing"

export type { Category, CategoryId, Axis, FixedRule } from "./types"

const MODULES = { counseling, medical, travel, photo, writing } as const

export const CATEGORIES: Category[] = [
  counseling.category,
  medical.category,
  travel.category,
  photo.category,
  writing.category,
]

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  counseling: counseling.color,
  medical: medical.color,
  travel: travel.color,
  photo: photo.color,
  writing: writing.color,
}

export const FIXED_RULES: Record<CategoryId, FixedRule[]> = {
  counseling: counseling.fixedRules,
  medical: medical.fixedRules,
  travel: travel.fixedRules,
  photo: photo.fixedRules,
  writing: writing.fixedRules,
}

export function generateRefinedPrompt(
  text: string,
  category: Category,
  axes: Record<string, string>,
  destination?: string,
): string {
  if (!text.trim()) return ""
  return MODULES[category.id].generatePrompt(text, axes, destination)
}

// Optional per-category auto-detection: given the user's natural-language
// text, returns the axis values (as option label strings, matching
// category.axes[].options) that should be pre-selected in the UI. Not every
// category has implemented this yet — for those, returns {} and the UI
// falls back to its existing default-option behavior.
export function detectCategoryAxes(
  text: string,
  category: Category,
): Record<string, string> {
  const mod = MODULES[category.id] as {
    detectAxes?: (text: string) => Record<string, string>
  }
  if (!text.trim() || !mod.detectAxes) return {}
  return mod.detectAxes(text)
}
