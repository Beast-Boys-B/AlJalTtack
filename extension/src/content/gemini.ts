// gemini.google.com 콘텐츠 스크립트. 제미니는 Quill 기반 리치텍스트
// 에디터(class="ql-editor")를 쓴다고 알려져 있음 — 이 환경엔 브라우저가
// 없어 직접 검증은 못 했다. 안 되면 콘솔 에러 확인 후 셀렉터 조정 필요.
import { registerInsertListener } from "./lib/insertText"

registerInsertListener([
  'div.ql-editor[contenteditable="true"]',
  'rich-textarea div[contenteditable="true"]',
  'div[contenteditable="true"]',
])
