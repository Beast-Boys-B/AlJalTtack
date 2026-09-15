// 그록 콘텐츠 스크립트 — 4곳 중 실제 DOM 구조를 가장 모르는 채로 작성.
// 메인 웹앱 SERVICES 목록의 URL(grok.x.ai)에 맞춰뒀지만 실제 서비스가
// grok.com으로 옮겨갔을 가능성도 있어 둘 다 매칭해둔다. 셀렉터는
// 일반적인 textarea/contenteditable 후보만 넣었다 — 이 환경엔 브라우저가
// 없어 직접 검증 못 했고, 4곳 중 가장 확인이 필요한 곳이다.
import { registerInsertListener } from "./lib/insertText"

registerInsertListener(['textarea', 'div[contenteditable="true"]'])
