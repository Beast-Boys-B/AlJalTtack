// GET /api/admin/stats — 관리자 대시보드(F-공22)용 집계 데이터.
// HTTP Basic Auth로 보호(../_lib/adminAuth.ts). 카테고리별 순서는 5개
// 브랜드 색상이 인접했을 때 색약 사용자도 구분 가능하도록 고정한 순서
// (medical/photo/counseling/writing/travel) — 색만으로 구분하지 않도록
// 프론트에서 항상 카테고리명을 함께 표기하지만, 순서 자체도 dataviz 스킬의
// 색상 검증 스크립트 기준을 통과하도록 맞춰뒀다.

import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "../_lib/adminAuth"

const CATEGORY_ORDER = ["medical", "photo", "counseling", "writing", "travel"] as const

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET만 지원합니다." })
    return
  }
  if (!requireAdminAuth(req, res)) return

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    res.status(500).json({ error: "DATABASE_URL 환경변수가 설정되지 않았습니다." })
    return
  }

  try {
    const sql = neon(databaseUrl)

    const [totals] = await sql`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE rating = 'up')::int AS up,
        count(*) FILTER (WHERE rating = 'down')::int AS down
      FROM feedback
    `
    const [surveyTotal] = await sql`SELECT count(*)::int AS total FROM difficulty_survey`

    const byCategoryRows = await sql`
      SELECT
        category,
        count(*)::int AS total,
        count(*) FILTER (WHERE rating = 'up')::int AS up,
        count(*) FILTER (WHERE rating = 'down')::int AS down
      FROM feedback
      GROUP BY category
    `
    const byCategoryMap = new Map(byCategoryRows.map((row: any) => [row.category, row]))
    const byCategory = CATEGORY_ORDER.map((category) => {
      const row = byCategoryMap.get(category) as
        | { total: number; up: number; down: number }
        | undefined
      return {
        category,
        total: row?.total ?? 0,
        up: row?.up ?? 0,
        down: row?.down ?? 0,
      }
    })

    const topReasons = await sql`
      SELECT reason, count(*)::int AS count
      FROM difficulty_survey
      GROUP BY reason
      ORDER BY count DESC
    `

    // raw_text는 의료질문/개인상담은 애초에 저장 시점(api/feedback.ts,
    // NO_RAW_TEXT_CATEGORIES)에 null로 강제되므로 여기서 카테고리별로
    // 다시 걸러낼 필요가 없다 — P-공26이 DB 저장 단계에서 이미 지켜진다.
    const recentFeedback = await sql`
      SELECT
        id,
        category,
        axis_values AS "axisValues",
        rating,
        raw_text AS "rawText",
        created_at AS "createdAt"
      FROM feedback
      ORDER BY created_at DESC
      LIMIT 20
    `

    res.status(200).json({
      summary: {
        totalFeedback: totals.total,
        up: totals.up,
        down: totals.down,
        surveyResponses: surveyTotal.total,
      },
      byCategory,
      topReasons,
      recentFeedback,
    })
  } catch (err) {
    console.error("admin stats query failed", err)
    res.status(500).json({ error: "조회 중 오류가 발생했습니다." })
  }
}
