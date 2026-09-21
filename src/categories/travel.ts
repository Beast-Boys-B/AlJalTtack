// 여행계획 — 담당 김동윤
// prd/여행계획.md 가 정본이다. 축 정의·키워드·정규식·겹침 처리 로직을
// 여기에 구현한다. 이 파일 밖(다른 카테고리 파일, App.tsx, types.ts)은
// 건드리지 않는다.

import type { Category, FixedRule } from "./types"

// 축 옵션 라벨(좌/우 순서 고정) — category.axes UI와 detectAxes/generatePrompt가
// 이 문자열을 공유해서 오타로 인한 불일치를 막는다.
// 축1·축4는 prd상 "중복선택" 축이라, 좌/우 외에 "둘 다 감지" 상태를 표현할 세
// 번째 옵션을 둔다(고정 Axis 타입이 단일 문자열 값만 허용하기 때문의 표현 방식).
const PURPOSE_OPTIONS = [
  "여행지 정보 알아보기",
  "일정·동선 짜기",
  "정보 확인 + 일정 짜기 모두",
] as const
const COMPANION_OPTIONS = ["혼자", "동반자 있음"] as const
const TIMING_OPTIONS = ["임박한 여행 (예약 완료)", "아직 막연한 단계 (고려 중)"] as const
const STYLE_OPTIONS = [
  "휴양/힐링",
  "액티비티/체험 중심",
  "휴양 + 액티비티 모두",
] as const

export const category: Category = {
  id: "travel",
  name: "여행계획",
  icon: "✈️",
  arcadeBadge: "STAGE 3 • 월드 트립",
  description: "여행 일정과 코스를 함께 짜요",
  placeholder: "다음 달에 3박 4일 여행 가려고 해요. 뭘 준비해야 할까요?",
  example: "처음으로 혼자 해외여행을 가려고 해요. 뭘 준비해야 할지 전혀 모르겠어요.",
  axes: [
    { id: "purpose", label: "목적", options: [...PURPOSE_OPTIONS] },
    { id: "companion", label: "동행", options: [...COMPANION_OPTIONS] },
    { id: "timing", label: "여행 시점", options: [...TIMING_OPTIONS] },
    { id: "style", label: "여행 스타일", options: [...STYLE_OPTIONS] },
  ],
  hashtags: [
    {
      tag: "#국내여행",
      example: "단풍보러 갈건데 국내에서 어디가 단풍으로 유명할까?",
    },
    {
      tag: "#해외여행",
      example: "이번에 처음으로 해외로 여행을 가보려고 해. 어디로 여행을 가는게 좋을까? 3군데 정도만 추천해줘",
    },
    {
      tag: "#혼자여행",
      example: "친구나 가족들과만 여행 했었는데 이번에는 혼자 여행을 떠나보려 해. 걱정되는데 도움을 줬으면 좋겠어.",
    },
    {
      tag: "#음식추천",
      example: "이번에 오사카로 놀러가는데 그 지역만의 음식을 먹고 싶어. 어떤 음식이 있는지 알려주고 맛있게 잘하는 가게를 추천해줘.",
    },
    {
      tag: "#환율",
      example: "곧 미국으로 여행을 떠나는데 현재 환율이 궁금해. 오늘 기준으로 환율을 알려줬으면 좋겠어.",
    },
    {
      tag: "#숙소검색",
      example: "영국으로 3명이서 5박 6일 여행을 계획하고 있어. 런던에 숙소를 잡고 싶은데 가성비 좋은 숙소를 검색해줘.",
    },
    {
      tag: "#예산 편성",
      example: "이번에 도쿄 여행을 3박 4일로 나 혼자 갈거야. 비행기값, 숙소, 교통비, 식사 포함해서 보통 얼마 정도 나오는지 궁금해.",
    },
  ],
}

export const color = "#06B6D4" // cyan

// 목적지(자유 슬롯)는 규칙 엔진으로 감지하지 않고 StartPage의 여행 목적지 입력창
// placeholder로 유도한다(prd "목적지(자유 슬롯) 처리" 문단). 그 입력창은 App.tsx가
// 아니라 pages/StartPage.tsx(공용 페이지 컴포넌트)에 있어, 이 카테고리 파일 경계
// 밖이라 여기서 문구를 바꿀 수 없다 — placeholder 문구 반영은 공용 파일 변경으로
// 팀에 미리 알리고 진행해야 한다.
export const fixedRules: FixedRule[] = [
  {
    label: "영업일정 확인",
    message:
      "추천해준 장소의 영업 일정이 변동될 수 있으니, 방문 전 사전 확인을 권장드립니다.",
  },
  {
    label: "환율 변동",
    message: "환율과 수수료에 따라 예상 금액과는 차이가 발생할 수 있습니다.",
  },
]

// ============================================================================
// 축 감지 로직 — prd/여행계획.md 가 정본이다.
// 축1(목적)·축4(여행 스타일): 중복선택 축이므로 좌/우 신호를 각각 독립적으로
//   감지해 둘 다 반영한다("나중 신호 우선"/"둘 중 하나만 선택" 규칙 대상이 아님).
//   아무 신호도 없을 때만 기본값(좌)을 적용한다.
// 축2(동행): 단일선택 축. 좌/우 신호가 동시에 등장하면 문자열 상 더 나중에
//   등장한 신호를 채택하고, 아무 신호도 없으면 기본값(좌: 혼자)을 따른다.
// 축3(여행 시점): "나중 신호 우선" 규칙의 예외 — 좌/우가 동시에 감지되면 등장
//   순서와 무관하게 더 긴급한 좌(임박한 여행)를 우선한다. 아무 신호도 없으면
//   기본값(우: 고려 중)을 따른다.
// ============================================================================

type Side = "좌" | "우"
type Pattern = string | RegExp

// 문자열/정규식이 섞인 신호 목록 중 텍스트에서 가장 나중(끝쪽)에 등장한 위치를
// 반환한다. 매치 없으면 -1. (prd의 "나중에 나온 신호를 선택" 겹침 규칙 근거)
function lastMatchIndex(text: string, patterns: Pattern[]): number {
  let best = -1
  for (const p of patterns) {
    if (typeof p === "string") {
      const idx = text.lastIndexOf(p)
      if (idx > best) best = idx
      continue
    }
    const flags = p.flags.includes("g") ? p.flags : `${p.flags}g`
    const re = new RegExp(p.source, flags)
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      if (m.index > best) best = m.index
      if (re.lastIndex === m.index) re.lastIndex += 1 // 빈 매치 무한루프 방지
    }
  }
  return best
}

// 축1 — 목적(중복선택): 좌=여행지 정보 알아보기 / 우=일정·동선 짜기
const PURPOSE_LEFT: Pattern[] = [
  "어디가 좋을까",
  "뭐가 유명한지",
  "맛집 추천",
  "가볼만 한지",
  "여긴 어때",
  "정보",
  "유명",
  "궁금",
]
const PURPOSE_RIGHT: Pattern[] = ["몇 박 며칠", "일정 짜줘", "동선", "시간표", /\d+박\s*\d+일/]

// 축2 — 동행(단일선택): 좌=혼자 / 우=동반자 있음
const COMPANION_LEFT: Pattern[] = ["혼자", "저 혼자", "나홀로", "혼행"]
const COMPANION_RIGHT: Pattern[] = [
  "가족이랑",
  "가족하고",
  "아이랑",
  "부모님 모시고",
  "친구들이랑",
  "친구랑",
  "친구하고",
  "친구들과",
  "친구들하고",
  "연인이랑",
  "단체로",
  "단체랑",
  "회사 워크숍",
  "다같이",
  "여러명",
  "부모님",
  /\d+명(이|가|과|랑|하고|하는데|해서|이랑|이서|끼리)/,
]

// 축3 — 여행 시점(단일선택, 겹침 예외): 좌=임박한 여행 / 우=고려 중
const TIMING_LEFT: Pattern[] = [
  "다음 주에",
  "이미 예약했는데",
  "곧 출발",
  "항공권 끊었고",
  "얼마 남았는데",
]
const TIMING_RIGHT: Pattern[] = [
  "언제 갈지 고민",
  "아직 결정 안 함",
  "휴가 계획 중",
  "가볼까 하는데",
  "알아보는 중",
  /\d+(일|주|개월)\s*(후|뒤|남았는데|예정)/,
]

// 축4 — 여행 스타일(중복선택): 좌=휴양/힐링 / 우=액티비티/체험 중심
const STYLE_LEFT: Pattern[] = ["쉬고 싶어", "힐링", "여유롭게", "느긋하게", "아무것도 안 하고", "리조트에서"]
const STYLE_RIGHT: Pattern[] = [
  "많이 돌아다니고",
  "액티비티",
  "체험",
  "투어",
  "바쁘게",
  "알차게",
  "이것저것 해보고",
]

// 단일선택 축의 겹침 처리: 더 나중에 등장한 신호를 채택. 둘 다 없으면 기본값.
function pickSide(leftIndex: number, rightIndex: number, defaultSide: Side): Side {
  if (leftIndex === -1 && rightIndex === -1) return defaultSide
  return rightIndex > leftIndex ? "우" : "좌"
}

// 축3 전용: 좌/우가 동시에 감지되면 등장 순서 무관하게 좌(임박)를 우선한다.
// (prd "겹침 처리 규칙" — 축3은 "나중 신호 우선" 규칙의 예외)
function pickTimingSide(leftIndex: number, rightIndex: number): Side {
  if (leftIndex !== -1 && rightIndex !== -1) return "좌"
  if (leftIndex === -1 && rightIndex === -1) return "우" // 기본값
  return leftIndex !== -1 ? "좌" : "우"
}

interface DualSides {
  left: boolean
  right: boolean
}

// 중복선택 축(목적/스타일) 공용 감지: 좌/우 신호를 독립적으로 판정해 둘 다
// 반영한다. 아무 신호도 없을 때만 기본값(좌)을 적용한다.
function detectDualAxis(text: string, leftPatterns: Pattern[], rightPatterns: Pattern[]): DualSides {
  const left = lastMatchIndex(text, leftPatterns) !== -1
  const right = lastMatchIndex(text, rightPatterns) !== -1
  if (!left && !right) return { left: true, right: false }
  return { left, right }
}

function dualToOption(sides: DualSides, options: readonly [string, string, string]): string {
  if (sides.left && sides.right) return options[2]
  return sides.right ? options[1] : options[0]
}

// 자동 감지 — 페이지2 진입 시 이 결과로 축 버튼 초기 상태를 채운다(ComparePage에서 호출).
// 반환값은 category.axes[].options에 있는 라벨 문자열 그대로다.
export function detectAxes(text: string): Record<string, string> {
  const purpose = detectDualAxis(text, PURPOSE_LEFT, PURPOSE_RIGHT)
  const companionSide = pickSide(
    lastMatchIndex(text, COMPANION_LEFT),
    lastMatchIndex(text, COMPANION_RIGHT),
    "좌",
  )
  const timingSide = pickTimingSide(lastMatchIndex(text, TIMING_LEFT), lastMatchIndex(text, TIMING_RIGHT))
  const style = detectDualAxis(text, STYLE_LEFT, STYLE_RIGHT)

  return {
    purpose: dualToOption(purpose, PURPOSE_OPTIONS),
    companion: companionSide === "좌" ? COMPANION_OPTIONS[0] : COMPANION_OPTIONS[1],
    timing: timingSide === "좌" ? TIMING_OPTIONS[0] : TIMING_OPTIONS[1],
    style: dualToOption(style, STYLE_OPTIONS),
  }
}

// axes는 이미 확정된 축 값이다(detectAxes로 자동 채워졌거나, 사용자가 페이지2에서
// 버튼을 눌러 직접 override한 값) — 여기서는 텍스트를 다시 감지하지 않고 그 값을
// 그대로 문장 조립에 쓴다. destination은 자유 슬롯(placeholder 유도) 입력값이다.
export function generatePrompt(
  text: string,
  axes: Record<string, string>,
  destination?: string,
): string {
  const purposeInfoOn = axes["purpose"] !== PURPOSE_OPTIONS[1]
  const purposeScheduleOn = axes["purpose"] !== PURPOSE_OPTIONS[0]
  const companionIsGroup = axes["companion"] === COMPANION_OPTIONS[1]
  const timingIsImminent = axes["timing"] === TIMING_OPTIONS[0]
  const styleRelaxOn = axes["style"] !== STYLE_OPTIONS[1]
  const styleActiveOn = axes["style"] !== STYLE_OPTIONS[0]

  // 출력 형식: 역할지정형(prd 상단 "출력 형식" 항목). 역할은 축1(목적)에서 결정된다.
  const role =
    purposeScheduleOn && !purposeInfoOn
      ? "여행 일정과 동선을 꼼꼼하게 설계해주는 여행 플래너"
      : purposeInfoOn && !purposeScheduleOn
        ? "여행지 정보를 친절하게 알려주는 여행 가이드"
        : "여행지 정보 안내와 일정 설계를 함께 도와주는 여행 플래너"

  // 하이라이트 매칭용 라벨: 세부 조정에서 고른 옵션 문자열이 프롬프트에 그대로
  // 등장해야 ComparePage의 exact-substring 하이라이트가 동작한다(동행/시점과 동일 패턴).
  const purposeLabel =
    purposeInfoOn && purposeScheduleOn
      ? PURPOSE_OPTIONS[2]
      : purposeScheduleOn
        ? PURPOSE_OPTIONS[1]
        : PURPOSE_OPTIONS[0]
  const styleLabel =
    styleRelaxOn && styleActiveOn
      ? STYLE_OPTIONS[2]
      : styleActiveOn
        ? STYLE_OPTIONS[1]
        : STYLE_OPTIONS[0]

  const bullets: string[] = []
  if (purposeInfoOn) {
    bullets.push("가볼 만한 여행지와 명소를 추천해 주세요.")
    bullets.push("그 지역에서 유명한 맛집과 볼거리를 알려주세요.")
  }
  if (purposeScheduleOn) {
    bullets.push("날짜별 여행 일정을 표로 정리해 주세요.")
    bullets.push("동선과 이동 시간을 고려한 코스를 짜주세요.")
  }
  bullets.push(
    companionIsGroup
      ? "동반자와 함께하기 좋은 동선과 활동으로 구성해 주세요."
      : "혼자 다니기 편하고 안전한 동선으로 구성해 주세요.",
  )
  bullets.push(
    timingIsImminent
      ? "출발이 임박했으니 예약·준비물 등 지금 바로 확정해야 할 사항 위주로 안내해 주세요."
      : "아직 결정 전 단계이니 여러 선택지를 비교할 수 있도록 폭넓게 안내해 주세요.",
  )
  if (styleRelaxOn) bullets.push("여유롭게 쉴 수 있는 휴양 위주로 일정을 구성해 주세요.")
  if (styleActiveOn) bullets.push("다양한 액티비티와 체험 위주로 알차게 일정을 구성해 주세요.")

  const companionLabel = companionIsGroup ? COMPANION_OPTIONS[1] : COMPANION_OPTIONS[0]
  const timingLabel = timingIsImminent ? TIMING_OPTIONS[0] : TIMING_OPTIONS[1]
  const dest = destination ? `[목적지] ${destination}\n` : ""

  // 고정 규칙(영업일정·환율 변동 안내)은 축 판정과 무관하게 항상 최종 프롬프트에 포함
  const safetyMessage = fixedRules.map((rule) => rule.message).join(" ")

  return `당신은 ${role}입니다.\n\n${dest}[목적] ${purposeLabel}\n[동행] ${companionLabel}\n[여행 시점] ${timingLabel}\n[여행 스타일] ${styleLabel}\n\n[여행 상황]\n${text}\n\n[요청사항]\n${bullets
    .map((bullet) => `• ${bullet}`)
    .join("\n")}\n\n※ ${safetyMessage}`
}
