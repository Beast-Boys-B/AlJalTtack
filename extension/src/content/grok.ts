// 그록(grok.com) 콘텐츠 스크립트.
//
// 처음엔 일반적인 `textarea`/`div[contenteditable="true"]` 셀렉터만
// 넣었었는데, 실제로는 "성공"이라고 뜨는데도 화면엔 아무 것도 안
// 들어가는 문제가 있었다 — grok.com 페이지 어딘가에 있는 무관한(숨겨진)
// <textarea>가 먼저 매치되어 거기에 텍스트가 들어갔을 뿐, 실제 보이는
// 편집창(Tiptap/ProseMirror 기반 리치텍스트, 빈 문단에
// class="is-empty is-editor-empty"가 붙는 게 Tiptap Placeholder
// 확장의 특징)은 건드리지 못했던 것으로 보인다.
//
// 그래서 이번엔 무작정 셀렉터 순서에 기대지 않고, 그 placeholder
// 문단을 표지 삼아 실제 편집 가능한 조상(contenteditable root)을
// 찾아 올라간다 — 훨씬 신뢰도 높은 방법.
import { bySelectors, registerInsertListener } from "./lib/insertText"

function findGrokComposer(): HTMLElement | null {
  const placeholder = document.querySelector<HTMLElement>("p.is-editor-empty, p.is-empty")
  const viaPlaceholder = placeholder?.closest<HTMLElement>('[contenteditable="true"]')
  if (viaPlaceholder) return viaPlaceholder

  // placeholder가 없다면(이미 뭔가 입력돼 있는 상태) 일반 후보로 대체.
  // <textarea>는 일부러 넣지 않는다 — 그록 페이지에 무관한 숨은
  // textarea가 있어 잘못 매치된 전례가 있어서다.
  return bySelectors([
    'div.ProseMirror[contenteditable="true"]',
    'div.tiptap[contenteditable="true"]',
    'div[contenteditable="true"]',
  ])()
}

registerInsertListener(findGrokComposer)
