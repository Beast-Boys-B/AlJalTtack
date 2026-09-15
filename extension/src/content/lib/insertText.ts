// 여러 사이트의 콘텐츠 스크립트가 공유하는 텍스트 삽입 로직.
//
// 두 종류의 입력창을 모두 다뤄야 한다:
// 1) <textarea>/<input> — React 등은 네이티브 setter를 오버라이드해서
//    값 변경을 추적하므로, 그냥 el.value = text로는 그 프레임워크가
//    변경을 못 알아챈다. 프로토타입의 네이티브 setter를 직접 호출한
//    뒤 input 이벤트를 수동으로 쏴줘야 한다(잘 알려진 우회법).
// 2) contenteditable(ProseMirror/Tiptap/Quill 등 리치텍스트 에디터,
//    클로드·챗GPT·제미니·그록 모두 최신 UI는 이쪽) — DOM을 직접 건드리면
//    에디터 내부 문서 모델과 어긋나 이후 타이핑이 깨질 수 있어,
//    execCommand로 네이티브 input 이벤트 경로를 그대로 태운다.
export function insertTextInto(el: HTMLElement, text: string): void {
  el.focus()

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set
    nativeSetter?.call(el, text)
    el.dispatchEvent(new Event("input", { bubbles: true }))
    return
  }

  document.execCommand("selectAll")
  document.execCommand("insertText", false, text)
}

// 셀렉터를 순서대로 시도해서 처음 매치되는 걸 쓰는, 가장 흔한 케이스용
// 기본 finder. 사이트가 흔한 <textarea>를 아무데나(숨겨진 것 포함) 두고
// 있으면 이 방식이 엉뚱한 요소를 집어서 "성공"처럼 보이고 실제로는 아무
// 데도 안 들어가는 문제가 생길 수 있다 — 그런 사이트는 registerInsertListener에
// 커스텀 finder 함수를 직접 넘겨서 더 구체적으로 찾을 것(예: grok.ts 참고).
export function bySelectors(selectors: string[]): () => HTMLElement | null {
  return () => {
    for (const selector of selectors) {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) return el
    }
    return null
  }
}

// 콘텐츠 스크립트마다 반복되는 메시지 리스너 등록 — sendResponse를 위해
// true를 반환해야 비동기 응답 채널이 안 닫힌다는 걸 매번 기억할 필요 없게.
export function registerInsertListener(findComposer: () => HTMLElement | null) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "ALJALTTACK_INSERT_PROMPT") return undefined
    const el = findComposer()
    if (!el) {
      sendResponse({ ok: false })
      return true
    }
    insertTextInto(el, String(message.text ?? ""))
    sendResponse({ ok: true })
    return true
  })
}
