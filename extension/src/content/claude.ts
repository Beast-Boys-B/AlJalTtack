// claude.ai에 주입되는 콘텐츠 스크립트. 셀렉터는 UI가 바뀌면 깨질 수
// 있다 — 2026-09-15 사용자가 실제 로그인된 브라우저에서 직접 확인,
// 정상 동작 확인됨.
import { registerInsertListener } from "./lib/insertText"

registerInsertListener([
  'div[contenteditable="true"][data-testid="chat-input"]',
  'div.ProseMirror[contenteditable="true"]',
  'div[contenteditable="true"]',
])
