// chatgpt.com / chat.openai.com(구 도메인, 지금도 리다이렉트로 열려있는
// 탭이 있을 수 있어 둘 다 매칭) 콘텐츠 스크립트. 2026-09-15 사용자가
// 실제 로그인된 브라우저에서 직접 확인, 정상 동작 확인됨.
import { bySelectors, registerInsertListener } from "./lib/insertText"

registerInsertListener(
  bySelectors([
    "#prompt-textarea",
    'div[contenteditable="true"][data-id="root"]',
    'div[contenteditable="true"]',
    "textarea",
  ]),
)
