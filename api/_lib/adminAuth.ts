// 관리자 전용 API(/api/admin/*) 공용 인증 — 로그인/세션 없이 Vercel
// 환경변수(ADMIN_USER/ADMIN_PASSWORD)와 대조하는 HTTP Basic Auth.
// 근거: P-공25(운영자는 전부 동일 권한, 사용자별 구분 불필요) — 그래서
// 공유 계정 하나로 충분하고 별도 사용자 테이블/세션 저장소가 필요 없다.

import { timingSafeEqual } from "crypto"

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function checkAdminAuth(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const expectedUser = process.env.ADMIN_USER
  const expectedPassword = process.env.ADMIN_PASSWORD
  if (!expectedUser || !expectedPassword) return false

  const header = req.headers.authorization ?? req.headers.Authorization
  const value = Array.isArray(header) ? header[0] : header
  if (!value || !value.startsWith("Basic ")) return false

  let decoded: string
  try {
    decoded = Buffer.from(value.slice(6), "base64").toString("utf8")
  } catch {
    return false
  }
  const sep = decoded.indexOf(":")
  if (sep === -1) return false

  const user = decoded.slice(0, sep)
  const password = decoded.slice(sep + 1)
  return safeEqual(user, expectedUser) && safeEqual(password, expectedPassword)
}

export function requireAdminAuth(req: any, res: any): boolean {
  if (checkAdminAuth(req)) return true
  res.setHeader("WWW-Authenticate", 'Basic realm="admin"')
  res.status(401).json({ error: "인증이 필요합니다." })
  return false
}
