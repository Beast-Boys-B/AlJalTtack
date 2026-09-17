// POST /api/feedback — 페이지2 👍/👎 클릭을 Neon에 저장한다.
// 정책 근거: docs/docs-공통/05-policy.md P-공26/SP-공3(2026-09-14 번복 확정).
// - 의료질문·개인상담(민감정보 위험 큰 2개 카테고리): 원문 저장 안 함(축값+평점만).
// - 여행계획·작성·AI사진생성(나머지 3개): 원문도 저장(익명 원칙은 그대로 유지 —
//   사용자 식별값은 애초에 이 앱에 없음, 로그인 없는 세션 기반이라 IP 등도 남기지 않음).
// - 저장된 데이터는 전부 관리자(A2)만 열람 가능, 일반 사용자에게 공개 안 됨(P-공25와
//   동일 원칙) — 이 API 자체도 조회(GET)는 만들지 않는다. 관리자 열람 화면은 별도 작업.

import { neon } from "@neondatabase/serverless"
import { applyCors } from "./_lib/cors"

// 이 2개 카테고리는 원문을 저장하지 않는다.
const NO_RAW_TEXT_CATEGORIES = new Set(["medical", "counseling"])

const ALLOWED_CATEGORIES = new Set(["medical", "counseling", "travel", "photo", "writing"])

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return

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
  const { category, axisValues, rating, text } = body as {
    category?: string
    axisValues?: Record<string, string>
    rating?: string
    text?: string
  }

  if (!category || !ALLOWED_CATEGORIES.has(category)) {
    res.status(400).json({ error: "category가 없거나 알 수 없는 값입니다." })
    return
  }
  if (rating !== "up" && rating !== "down") {
    res.status(400).json({ error: "rating은 'up' 또는 'down'이어야 합니다." })
    return
  }
  if (!axisValues || typeof axisValues !== "object") {
    res.status(400).json({ error: "axisValues가 필요합니다." })
    return
  }

  // 민감 카테고리는 원문을 아예 버린다(요청에 실려 왔더라도 저장하지 않음).
  const rawText = NO_RAW_TEXT_CATEGORIES.has(category) ? null : (text ?? null)

  try {
    const sql = neon(databaseUrl)
    await sql`
      INSERT INTO feedback (category, axis_values, rating, raw_text)
      VALUES (${category}, ${JSON.stringify(axisValues)}, ${rating}, ${rawText})
    `
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error("feedback insert failed", err)
    res.status(500).json({ error: "저장 중 오류가 발생했습니다." })
  }
}
