// 여행계획 — 담당 김동윤
// draft/schemas/여행계획.md 가 정본이다. 축 정의·키워드·정규식·겹침 처리
// 로직을 여기에 구현한다. 이 파일 밖(다른 카테고리 파일, App.tsx, types.ts)은
// 건드리지 않는다.

import type { Category, FixedRule } from "./types"

export const category: Category = {
  id: "travel",
  name: "여행계획",
  icon: "✈️",
  arcadeBadge: "STAGE 3 • 월드 트립",
  description: "여행 일정과 코스를 함께 짜요",
  placeholder: "다음 달에 3박 4일 여행 가려고 해요. 뭘 준비해야 할까요?",
  example: "처음으로 혼자 해외여행을 가려고 해요. 뭘 준비해야 할지 전혀 모르겠어요.",
  axes: [
    {
      id: "style",
      label: "여행 스타일",
      options: ["자유여행", "관광 중심", "맛집 탐방", "힐링"],
    },
    {
      id: "budget",
      label: "예산 범위",
      options: ["알뜰하게", "적당하게", "럭셔리하게"],
    },
  ],
  hashtags: [
    {
      tag: "#아시아",
      example: "3박 4일 일정으로 다녀오기 좋은 일본 도쿄 가성비 여행 코스 짜주세요.",
    },
    {
      tag: "#유럽",
      example: "처음 가보는 7박 8일 서유럽 핵심 명소 여행 일정 추천해주세요.",
    },
    {
      tag: "#국내",
      example: "주말에 다녀올 수 있는 1박 2일 제주도 해안도로 힐링 드라이브 코스",
    },
    {
      tag: "#혼자여행",
      example: "처음으로 혼자 떠나는 3박 4일 해외여행 추천지 및 주의사항입니다.",
    },
    {
      tag: "#커플여행",
      example: "기념일에 다녀오기 좋은 분위기 있는 오션뷰 숙소와 맛집 여행 코스",
    },
    {
      tag: "#가족여행",
      example: "부모님을 모시고 가기 좋은 걷기 부담 없는 휴양지 일정 부탁해요.",
    },
  ],
}

export const color = "#06B6D4" // cyan

export const fixedRules: FixedRule[] = []

// TODO(김동윤): draft/schemas/여행계획.md 기준 축1(목적, 중복선택)·축2(동행)·
// 축3(여행시점, 긴급우선 예외)·축4(스타일, 중복선택) 자동 감지 로직 +
// 목적지(자유 슬롯) 처리로 교체. 지금은 수동 선택값(axes 인자)을 그대로
// 템플릿에 꽂아 넣는 자리표시자 구현이다. destination은 자유 슬롯(placeholder
// 유도) 입력값이 들어온다.
export function generatePrompt(
  text: string,
  axes: Record<string, string>,
  destination?: string,
): string {
  const s = axes["style"] || "자유여행"
  const b = axes["budget"] || "적당하게"
  const dest = destination ? `[목적지: ${destination}]\n\n` : ""
  return `${dest}아래 여행 계획을 ${s} 스타일로, ${b} 예산 기준으로 도와주세요.\n\n[여행 상황]\n${text}\n\n[계획 요청사항]\n• 날짜별 여행 일정을 표로 정리해 주세요.\n• 꼭 가봐야 할 명소와 숨은 명소를 추천해 주세요.\n• 교통·숙소·식비 예상 예산을 알려주세요.\n• 현지에서 유용한 앱과 팁을 함께 알려주세요.\n• 주의사항과 준비물 체크리스트도 포함해 주세요.`
}
