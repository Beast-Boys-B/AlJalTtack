// POST /api/survey — [복사] 후 재조정 사이클이 3회 누적된 세션에서 뜨는
// "어떤 점이 어려우셨나요?" 객관식 응답을 Neon에 저장한다.
// 근거: docs/docs-공통/03-requirements.md R-공25, 04-features.md F-공21,
// 05-policy.md P-공24 (판단 기준: [복사] 후 재조정 사이클 3회 누적,
// 재조정이 적었던 순조로운 세션에는 노출·저장 강제 없음).
// REASONS 목록은 아직 팀 확정 사항이 아니라 Claude가 제안한 임시 문구다
// (docs 06-test-matrix.md에 [제안]으로 기록, 팀 검토 후 문구 변경 가능).

import { neon } from "@neondatabase/serverless"

const ALLOWED_CATEGORIES = new Set(["medical", "counseling", "travel", "photo", "writing"])

// 프론트(ComparePage.tsx)의 REASONS 배열과 반드시 동일하게 유지한다.
const ALLOWED_REASONS = new Set([
  "원하는 톤·분위기가 안 나와요",
  "핵심 내용이 자꾸 빠져요",
  "축(옵션) 의미가 헷갈려요",
  "결과가 너무 길거나 짧아요",
  "기타",
])

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST만 지원합니다." })
    return
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    res.status(500).json({ error: "DATABASE_URL 환경변수가 설정되지 않았습니다." })
    return
  }

  const body = req.body ?? {}
  const { category, reason, adjustCount } = body as {
    category?: string
    reason?: string
    adjustCount?: number
  }

  if (!category || !ALLOWED_CATEGORIES.has(category)) {
    res.status(400).json({ error: "category가 없거나 알 수 없는 값입니다." })
    return
  }
  if (!reason || !ALLOWED_REASONS.has(reason)) {
    res.status(400).json({ error: "reason이 없거나 알 수 없는 값입니다." })
    return
  }

  const safeAdjustCount = Number.isInteger(adjustCount) ? adjustCount : null

  try {
    const sql = neon(databaseUrl)
    await sql`
      INSERT INTO difficulty_survey (category, reason, adjust_count)
      VALUES (${category}, ${reason}, ${safeAdjustCount})
    `
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error("survey insert failed", err)
    res.status(500).json({ error: "저장 중 오류가 발생했습니다." })
  }
}
