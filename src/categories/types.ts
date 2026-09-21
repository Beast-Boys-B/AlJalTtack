// Shared contract for all 5 category modules. This file is the one piece of
// the category layer everyone depends on — treat changes to it as a
// cross-cutting decision, not something to edit while working on your own
// category (mirrors the docs-공통 vs docs-카테고리 split in the planning docs).

export type CategoryId = "counseling" | "medical" | "travel" | "photo" | "writing"

export interface Axis {
  id: string
  label: string
  options: string[]
  // 재조정 3회 누적 시 뜨는 힌트 카드(F-공21 인접 UI)용 안내 문구 — "이 축을
  // 조정하면 결과가 실제로 어떻게 달라지는지" 구체적 예시. generatePrompt의
  // 실제 분기 로직과 일치해야 한다(지어낸 효과 아님).
  hint?: string
  // true면 페이지 진입 시 options[0]으로 자동 채우지 않는다(AI사진생성의
  // 가로세로비율처럼 "기본값 없음"이 명시적 스펙인 축 전용). 이 축이 비어있는
  // 동안 ComparePage/MobileComparePage는 generatePrompt를 호출하지 않고
  // refinedPrompt를 빈 문자열로 유지해, 복사·공유 버튼도 함께 비활성화된다.
  noDefault?: boolean
}

export interface Category {
  id: CategoryId
  name: string
  icon: string
  description: string
  placeholder: string
  example: string
  axes: Axis[]
  arcadeBadge: string
  hashtags: { tag: string; example: string }[]
}

export interface FixedRule {
  label: string
  message: string
}
