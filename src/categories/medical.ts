// 의료질문 — 담당 우석민
// draft/schemas/의료질문.md 가 정본이다. 축 정의·키워드·겹침 처리 로직을
// 여기에 구현한다. 이 파일 밖(다른 카테고리 파일, App.tsx, types.ts)은
// 건드리지 않는다.

import type { Category, FixedRule } from "./types"

export const category: Category = {
  id: "medical",
  name: "의료질문",
  icon: "🩺",
  arcadeBadge: "STAGE 2 • 닥터 가이드",
  description: "건강 궁금증을 알기 쉽게 물어봐요",
  placeholder: "머리가 자주 아픈데 어떤 이유일 수 있나요? 병원은 어디 가야 하나요?",
  example: "두통이 일주일째 계속되는데 원인이 뭘까요. 어떤 병원에 가야 하나요?",
  axes: [
    {
      id: "terminology",
      label: "설명 방식",
      options: ["쉬운 말로", "일반적으로", "의학 용어로"],
    },
    {
      id: "format",
      label: "답변 형식",
      options: ["간단히", "항목별로", "자세하게"],
    },
  ],
  hashtags: [
    {
      tag: "#두통",
      example: "두통이 일주일째 계속되는데 원인이 뭘까요. 어떤 병원에 가야 하나요?",
    },
    {
      tag: "#소화",
      example: "식사만 하면 속이 더부룩하고 체한 느낌이 드는데 자가 관리법이 궁금해요.",
    },
    { tag: "#피부", example: "환절기만 되면 피부에 붉은 반점이 생기고 가려워요." },
    {
      tag: "#수면",
      example: "밤에 잠들기까지 2시간 이상 걸리는데 불면증 개선법이 있을까요?",
    },
    {
      tag: "#운동",
      example: "무릎 관절에 무리 없이 할 수 있는 실내 유산소 운동 추천해주세요.",
    },
    {
      tag: "#영양",
      example: "비타민D와 오메가3를 같이 복용해도 되는지 영양제 섭취법이 궁금해요.",
    },
  ],
}

export const color = "#EF4444" // red

export const fixedRules: FixedRule[] = [
  {
    label: "항상",
    message: "이 정보는 진단을 대체하지 않으며, 응급 증상은 즉시 119/응급실로 문의하세요.",
  },
]

// TODO(우석민): draft/schemas/의료질문.md 기준 축1(목적)·축2(대상)·축3(증상성격)
// 자동 감지 로직으로 교체. 지금은 수동 선택값(axes 인자)을 그대로 템플릿에
// 꽂아 넣는 자리표시자 구현이다.
export function generatePrompt(
  text: string,
  axes: Record<string, string>,
): string {
  const t = axes["terminology"] || "쉬운 말로"
  const f = axes["format"] || "항목별로"
  return `다음 건강 질문에 대해 ${t}, ${f} 답변해 주세요.\n\n[질문]\n${text}\n\n[답변 구성]\n• 증상의 가능한 원인들을 설명해 주세요.\n• 즉시 병원을 가야 하는 응급 신호가 있다면 알려주세요.\n• 어느 진료과를 방문하면 좋을지 안내해 주세요.\n• 일상에서 할 수 있는 자가 관리법도 포함해 주세요.\n\n※ 이 답변은 참고용이며 실제 진료를 대체하지 않습니다.`
}
