// APK(Capacitor)로 패키징된 앱은 origin이 이 도메인이 아니게 되어(안드로이드
// WebView 기본 스킴 https://localhost) /api/feedback, /api/survey 호출이
// 진짜 크로스 오리진 요청이 된다. 두 엔드포인트 모두 로그인 없는 익명 POST라
// 쿠키/인증정보를 안 쓰므로 Access-Control-Allow-Origin을 넓게 열어도 안전하다.
//
// applyCors가 true를 반환하면 preflight(OPTIONS) 응답을 이미 끝낸 것이므로
// 호출부는 그 즉시 return해야 한다.
export function applyCors(req: any, res: any): boolean {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.status(204).end()
    return true
  }
  return false
}
