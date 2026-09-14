// Shared contract for all 5 category modules. This file is the one piece of
// the category layer everyone depends on — treat changes to it as a
// cross-cutting decision, not something to edit while working on your own
// category (mirrors the docs-공통 vs docs-카테고리 split in the planning docs).

export type CategoryId = "counseling" | "medical" | "travel" | "photo" | "writing"

export interface Axis {
  id: string
  label: string
  options: string[]
}

export interface Category {
  id: CategoryId
  name: string
  icon: string
  description: string
  placeholder: string
  example: string
  axes: Axis[]
  arcadeBadge: string
  hashtags: { tag: string; example: string }[]
}

export interface FixedRule {
  label: string
  message: string
}
