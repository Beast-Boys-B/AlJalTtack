// 작성 — 담당 조연익
// draft/schemas/작성.md 가 정본이다. 축 정의·키워드·매칭 원칙(명사 어근 vs
// 구문형)·겹침 처리 로직을 여기에 구현한다. 이 파일 밖(다른 카테고리 파일,
// App.tsx, types.ts)은 건드리지 않는다.

import type { Category, FixedRule } from "./types"

export const category: Category = {
  id: "writing",
  name: "작성",
  icon: "✍️",
  arcadeBadge: "STAGE 5 • 오피스 마스터",
  description: "이메일, 보고서, 자기소개서를 도와줘요",
  placeholder: "자기소개서를 써야 하는데 어떻게 시작해야 할지 모르겠어요.",
  example: "상사에게 업무 협조를 구하는 이메일을 써야 하는데 어떻게 시작해야 할까요?",
  axes: [
    { id: "tone", label: "문체", options: ["격식체", "캐주얼", "비즈니스"] },
    { id: "length", label: "길이", options: ["짧게", "적당히", "길게"] },
  ],
  hashtags: [
    {
      tag: "#이메일",
      example: "상사에게 다음 주 프로젝트 업무 협조를 요청하는 정중한 비즈니스 이메일",
    },
    {
      tag: "#보고서",
      example: "신규 마케팅 캠페인 추진 성과와 향후 계획을 요약한 1페이지 보고서",
    },
    {
      tag: "#자기소개서",
      example: "IT 개발 직무 지원을 위한 성장 과정과 핵심 역량 자기소개서",
    },
    {
      tag: "#에세이",
      example: "인공지능과 현대 사회의 변화에 대한 개인적인 생각을 담은 수필",
    },
    {
      tag: "#SNS글",
      example: "새로 출시된 디저트 카페 메뉴를 홍보하는 감성적인 인스타그램 게시글",
    },
    {
      tag: "#기획서",
      example: "신규 모바일 앱 서비스 개편안을 제안하는 요약 사업 기획서",
    },
  ],
}

export const color = "#F97316" // orange

export const fixedRules: FixedRule[] = [
  {
    label: "체계적 형식",
    message: "구조화된 템플릿 형식(항목별 소제목, 번호 매기기)으로 제공",
  },
  {
    label: "상급자·외부인",
    message: "존댓말과 공손한 표현 사용",
  },
]

// TODO(조연익): draft/schemas/작성.md 기준 축1(목적, 중복선택)·축2(대상)·
// 축3(문서유형) 자동 감지 로직으로 교체. 지금은 수동 선택값(axes 인자)을
// 그대로 템플릿에 꽂아 넣는 자리표시자 구현이다.
export function generatePrompt(
  text: string,
  axes: Record<string, string>,
): string {
  const t = axes["tone"] || "격식체"
  const l = axes["length"] || "적당히"
  const lg =
    l === "짧게" ? "200~300자" : l === "적당히" ? "500~700자" : "1000자 이상"
  return `아래 내용을 ${t}로, ${lg} 분량으로 작성해 주세요.\n\n[작성 요청]\n${text}\n\n[작성 가이드]\n• ${t}에 맞는 자연스러운 어투와 표현을 사용해 주세요.\n• 도입부에서 독자의 관심을 끌 수 있는 문장으로 시작해 주세요.\n• 핵심 내용이 명확하게 전달되도록 구성해 주세요.\n• 마무리는 여운이 남도록 깔끔하게 끝내 주세요.`
}
