// claude.ai에 주입되는 콘텐츠 스크립트. 사이드패널에서 온 메시지를 받아
// 정제된 프롬프트를 실제 입력창(ProseMirror 기반 contenteditable)에
// 넣어준다. innerText/textContent를 직접 바꾸면 ProseMirror 내부 문서
// 모델과 어긋나서 이후 타이핑이 깨질 수 있어, execCommand('insertText')로
// 네이티브 input 이벤트 경로를 그대로 태운다(리치텍스트 에디터에 흔히
// 쓰이는 우회법).
//
// 셀렉터는 claude.ai가 UI를 바꾸면 깨질 수 있다 — 실제 배포 전 반드시
// 로그인된 브라우저에서 직접 확인이 필요하다(이 환경엔 브라우저가 없어
// 여기서 직접 검증은 못 했음).
function findComposer(): HTMLElement | null {
  const selectors = [
    'div[contenteditable="true"][data-testid="chat-input"]',
    'div.ProseMirror[contenteditable="true"]',
    'div[contenteditable="true"]',
  ]
  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) return el
  }
  return null
}

function insertPrompt(text: string): boolean {
  const el = findComposer()
  if (!el) return false

  el.focus()
  document.execCommand("selectAll")
  document.execCommand("insertText", false, text)
  return true
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "ALJALTTACK_INSERT_PROMPT") return undefined
  sendResponse({ ok: insertPrompt(String(message.text ?? "")) })
  return true
})
