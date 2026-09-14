// 개인상담 — 담당 이재성
// draft/schemas/개인상담.md 가 정본이다. 축 정의·키워드·겹침 처리 로직을
// 여기에 구현한다. 이 파일 밖(다른 카테고리 파일, App.tsx, types.ts)은
// 건드리지 않는다.

import type { Category, FixedRule } from "./types"

export const category: Category = {
  id: "counseling",
  name: "개인상담",
  icon: "💬",
  arcadeBadge: "STAGE 1 • 마음케어",
  description: "고민, 감정, 인간관계를 편하게 털어놓아요",
  placeholder:
    "요즘 직장에서 상사 때문에 너무 힘들어요. 어떻게 해야 할지 모르겠어요.",
  example:
    "친구랑 크게 싸웠는데 제가 잘못한 건지 모르겠고, 어떻게 화해해야 할지도 모르겠어요.",
  axes: [
    {
      id: "empathy",
      label: "공감 강도",
      options: ["따뜻하게", "중립적으로", "직설적으로"],
    },
    {
      id: "expertise",
      label: "답변 스타일",
      options: ["일상적인 조언", "심리학적 관점", "전문가 수준"],
    },
  ],
  hashtags: [
    {
      tag: "#연애",
      example: "연인과 대화 방식 차이로 자꾸 오해가 생겨서 서운해요.",
    },
    {
      tag: "#인간관계",
      example:
        "친구랑 크게 싸웠는데 제가 잘못한 건지 모르겠고, 화해법을 모르겠어요.",
    },
    {
      tag: "#학업",
      example: "시험 기간만 되면 너무 불안하고 집중이 전혀 안 되어서 걱정이에요.",
    },
    {
      tag: "#진로",
      example: "전공이 적성에 맞지 않는 것 같은데 다른 길을 찾아봐야 할까요?",
    },
    {
      tag: "#가족",
      example: "부모님과 자꾸 의견이 충돌해서 대화할 때마다 갈등이 심해요.",
    },
    {
      tag: "#자존감",
      example: "남과 비교하면서 스스로를 자책하는 습관을 고치고 싶어요.",
    },
  ],
}

export const color = "#10B981" // emerald

export const fixedRules: FixedRule[] = [
  {
    label: "항상",
    message:
      "사용자가 자해, 자살, 심각한 위기 신호를 보이면 위의 스타일 설정과 관계없이 즉시 안전을 최우선으로 하고 전문가의 도움을 받을 것을 권유하세요.",
  },
]

// TODO(이재성): draft/schemas/개인상담.md 기준 축1(6택, 복수감지+우선순위계산)·
// 축2(F-T 3택)·축3(개입방식 2택) 자동 감지 로직으로 교체. 지금은 수동 선택값
// (axes 인자)을 그대로 템플릿에 꽂아 넣는 자리표시자 구현이다.
export function generatePrompt(
  text: string,
  axes: Record<string, string>,
): string {
  const e = axes["empathy"] || "따뜻하게"
  const x = axes["expertise"] || "일상적인 조언"
  return `다음 고민을 ${e} 들어주고, ${x} 수준으로 도움말을 주세요.\n\n[상황]\n${text}\n\n[요청사항]\n• 먼저 충분히 공감을 표현한 후 조언해 주세요.\n• 상황을 객관적으로 바라볼 수 있는 시각을 제공해 주세요.\n• 구체적으로 실행할 수 있는 다음 단계를 알려주세요.\n• 필요하다면 전문가 도움을 받을 시기도 언급해 주세요.`
}
