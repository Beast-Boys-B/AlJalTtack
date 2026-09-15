// gemini.google.com 콘텐츠 스크립트. 2026-09-15 사용자가 실제
// 로그인된 브라우저에서 직접 확인, 탭 없음 안내/전달 모두 정상 동작 확인됨.
import { bySelectors, registerInsertListener } from "./lib/insertText"

registerInsertListener(
  bySelectors([
    'div.ql-editor[contenteditable="true"]',
    'rich-textarea div[contenteditable="true"]',
    'div[contenteditable="true"]',
  ]),
)
