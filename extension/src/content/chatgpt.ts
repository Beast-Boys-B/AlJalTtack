// chatgpt.com / chat.openai.com(구 도메인, 지금도 리다이렉트로 열려있는
// 탭이 있을 수 있어 둘 다 매칭) 콘텐츠 스크립트. #prompt-textarea는
// ChatGPT가 오래 유지해온 입력창 id지만, 실제 최신 UI 기준 라이브
// 검증은 아직 못 했다 — 안 되면 콘솔 에러 확인 후 셀렉터 조정 필요.
import { registerInsertListener } from "./lib/insertText"

registerInsertListener([
  "#prompt-textarea",
  'div[contenteditable="true"][data-id="root"]',
  'div[contenteditable="true"]',
  "textarea",
])
