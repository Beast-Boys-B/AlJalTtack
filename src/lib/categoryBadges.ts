import type { CategoryId } from "../categories"
import counselingBadge from "../assets/category-badges/counseling.svg"
import medicalBadge from "../assets/category-badges/medical.svg"
import travelBadge from "../assets/category-badges/travel.svg"
import photoBadge from "../assets/category-badges/photo.svg"
import writingBadge from "../assets/category-badges/writing.svg"

// Custom icon+title artwork per category, replacing the emoji+text badge.
// Shared by the desktop and mobile compare pages.
export const CATEGORY_BADGES: Record<CategoryId, string> = {
  counseling: counselingBadge,
  medical: medicalBadge,
  travel: travelBadge,
  photo: photoBadge,
  writing: writingBadge,
}
