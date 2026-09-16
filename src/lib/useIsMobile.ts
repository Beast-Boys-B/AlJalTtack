// Shared hook to pick mobile vs desktop page components in App.tsx.
//
// [2026-09-16 변경] 창 너비(matchMedia) 기준에서 실제 기기 종류(User-Agent) 기준으로
// 전환 — 데스크톱 브라우저 창을 좁혀도 모바일 화면(랜딩 없음, 화면 구조 자체가 다름)
// 으로 안 넘어가야 한다는 요구사항 때문. 모바일/데스크톱은 반응형 리플로우가 아니라
// 서로 다른 화면 구성(페이지 자체가 있고 없고)이라 "창 크기"가 아니라 "기기가 뭐냐"가
// 맞는 기준이다. UA 읽기는 getBoundingClientRect() 같은 레이아웃 타이밍 의존이 없는
// 즉시 동기 값이라, 이전에 문제였던 "JS 측정" 부류의 위험(힌트 팝업 버그 참고)과는
// 다르다 — 세션 중 기기가 바뀌지 않으므로 리사이즈 리스너도 필요 없다.

function getIsMobile(): boolean {
  if (typeof navigator === "undefined") return false
  // 태블릿(iPad 등)은 폰 전용으로 설계된 이 모바일 레이아웃 대상이 아니므로 제외하고,
  // 폰급 기기만 모바일로 취급한다.
  return /Android.+Mobile|iPhone|iPod|Windows Phone/i.test(navigator.userAgent)
}

export function useIsMobile(): boolean {
  // 기기 종류는 세션 중 바뀌지 않으므로 마운트 시점에 한 번만 계산하면 된다 —
  // 상태/이펙트/리스너가 필요 없다.
  return getIsMobile()
}
