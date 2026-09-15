// 여러 사이트의 콘텐츠 스크립트가 공유하는 텍스트 삽입 로직.
//
// 두 종류의 입력창을 모두 다뤄야 한다:
// 1) <textarea>/<input> — React 등은 네이티브 setter를 오버라이드해서
//    값 변경을 추적하므로, 그냥 el.value = text로는 그 프레임워크가
//    변경을 못 알아챈다. 프로토타입의 네이티브 setter를 직접 호출한
//    뒤 input 이벤트를 수동으로 쏴줘야 한다(잘 알려진 우회법).
// 2) contenteditable(ProseMirror/Quill 등 리치텍스트 에디터, 클로드·
//    챗GPT·제미니 모두 최신 UI는 이쪽) — DOM을 직접 건드리면 에디터
//    내부 문서 모델과 어긋나 이후 타이핑이 깨질 수 있어, execCommand로
//    네이티브 input 이벤트 경로를 그대로 태운다.
export function insertIntoComposer(selectors: string[], text: string): boolean {
  let el: HTMLElement | null = null
  for (const selector of selectors) {
    el = document.querySelector<HTMLElement>(selector)
    if (el) break
  }
  if (!el) return false

  el.focus()

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set
    nativeSetter?.call(el, text)
    el.dispatchEvent(new Event("input", { bubbles: true }))
    return true
  }

  document.execCommand("selectAll")
  document.execCommand("insertText", false, text)
  return true
}

// 콘텐츠 스크립트마다 반복되는 메시지 리스너 등록 — sendResponse를 위해
// true를 반환해야 비동기 응답 채널이 안 닫힌다는 걸 매번 기억할 필요 없게.
export function registerInsertListener(selectors: string[]) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "ALJALTTACK_INSERT_PROMPT") return undefined
    sendResponse({ ok: insertIntoComposer(selectors, String(message.text ?? "")) })
    return true
  })
}
