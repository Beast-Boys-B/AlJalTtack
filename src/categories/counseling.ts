// 개인상담 — 담당 이재성
// prd/개인상담.md 가 정본이다. 축 정의·키워드·겹침 처리 로직을
// 여기에 구현한다. 이 파일 밖(다른 카테고리 파일, App.tsx, types.ts)은
// 건드리지 않는다.

import type { Category, FixedRule } from "./types"

// 축 옵션 라벨(순서 고정) — category.axes UI와 detectAxes/generatePrompt가 이 값을
// 공유해서 오타로 인한 불일치를 막는다. (의료질문 모듈과 동일한 패턴)
const AXIS1_OPTIONS = ["연애", "인간관계", "학업", "진로", "가족", "자존감"] as const
const AXIS2_OPTIONS_DISPLAY = ["완전 공감형", "균형형", "직설·해결형"] as const
const AXIS3_OPTIONS_DISPLAY = ["질문으로 유도", "직접 조언 제시"] as const

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
    { id: "topic", label: "상담 주제", options: [...AXIS1_OPTIONS] },
    { id: "style", label: "상담 스타일", options: [...AXIS2_OPTIONS_DISPLAY] },
    { id: "intervention", label: "개입 방식", options: [...AXIS3_OPTIONS_DISPLAY] },
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

// ---------------------------------------------------------------------------
// 축1 — 상담 주제별 페르소나 (6택, 다중 신호 가능)
// ---------------------------------------------------------------------------

type Axis1Topic = "연애" | "인간관계" | "학업" | "진로" | "가족" | "자존감"

interface Axis1Def {
  personaLabel: string
  effect: string
  // 명사 어근(조사·활용형 무관, 어절 startsWith)으로 매칭
  roots: string[]
  // 구문형 키워드는 문장 그대로(substring) 매칭
  phrases: string[]
}

const AXIS1_DEFS: Record<Axis1Topic, Axis1Def> = {
  연애: {
    personaLabel: "연애고수 모드",
    effect:
      "반말체를 사용하고 비속어·은어는 쓰지 마세요. 연애 경험이 많고 트렌드에 밝은 친구처럼 밀당, 심리전, 이별 회복 등을 짚어주세요. 가벼운 유머는 사용해도 좋습니다.",
    // "헤어지"는 "헤어졌어/헤어졌는데"처럼 불규칙 활용(지+었→졌)이 붙으면
    // 원형 어근 startsWith로는 못 잡아서, 두 글자로 줄인 "헤어"를 어근으로 쓴다.
    roots: [
      "남자친구",
      "여자친구",
      "썸",
      "이별",
      "헤어",
      "짝사랑",
      "연애",
      "소개팅",
      "권태기",
      "양다리",
      "환승",
    ],
    phrases: [],
  },
  인간관계: {
    personaLabel: "친구 상담 모드",
    effect:
      "반말체를 사용하고 비속어·은어는 쓰지 마세요. 또래 친구처럼 상황을 먼저 정리해주고 공감해주세요.",
    roots: ["친구", "동료", "손절", "뒷담화", "왕따", "인간관계", "절교"],
    phrases: ["거리를 두고 싶어", "관계가 불편해"],
  },
  학업: {
    personaLabel: "친한 선생님 모드",
    effect:
      "존댓말 기반의 편안하고 친근한 어투를 사용하세요. 실제 학습 경험을 섞어 현실적인 방법을 제시해주세요.",
    roots: [
      "시험",
      "성적",
      "공부",
      "과제",
      "학교",
      "수행평가",
      "수능",
      "학점",
      "등수",
      "벼락치기",
    ],
    phrases: [],
  },
  진로: {
    personaLabel: "진로 선생님 모드",
    effect:
      "존댓말 기반의 친근한 어투를 사용하세요. 경험담을 섞어 현실적인 시장 정보와 준비 방향을 제시해주세요.",
    roots: [
      "취업",
      "이직",
      "진로",
      "커리어",
      "면접",
      "퇴사",
      "스펙",
      "자소서",
      "인턴",
      "진학",
    ],
    phrases: [],
  },
  가족: {
    personaLabel: "나이 많은 누나·언니 모드",
    effect:
      "친근한 존댓말을 사용하세요. 양쪽 입장도 짚어주되 사용자 편에서 균형 잡힌 조언을 해주세요.",
    // "형"은 "형식/형편"과 겹칠 수 있음(prd 명시 주의사항) — 실제 대화에서
    // 드문 케이스라 표에 있는 그대로 둔다.
    roots: ["엄마", "아빠", "부모님", "형", "오빠", "언니", "누나", "동생", "가족", "집안"],
    phrases: [],
  },
  자존감: {
    personaLabel: "부모님 모드",
    effect:
      "편안하고 다정한 말투를 사용하세요. 조건 없이 존재 자체를 인정하는 지지적인 화법을 사용하세요.",
    roots: ["자존감", "자신감", "열등감", "자기혐오", "무기력"],
    phrases: ["나 자신", "내가 부족한 것 같아"],
  },
}

const AXIS1_TOPIC_ORDER: Axis1Topic[] = [...AXIS1_OPTIONS]

const AXIS1_DEFAULT: Axis1Topic = "인간관계"

// 어절 단위 토큰화 — 명사 어근 startsWith 매칭에 사용
function tokenize(text: string): { token: string; index: number }[] {
  const regex = /[^\s,.!?~"'()[\]{}<>·…:;]+/g
  const tokens: { token: string; index: number }[] = []
  let m: RegExpExecArray | null
  while ((m = regex.exec(text))) {
    tokens.push({ token: m[0], index: m.index })
  }
  return tokens
}

// def의 어근/구문 키워드가 매칭된 모든 위치(글자 인덱스)를 반환
function findAxis1Matches(
  text: string,
  tokens: { token: string; index: number }[],
  def: Axis1Def,
): number[] {
  const indices: number[] = []
  for (const { token, index } of tokens) {
    if (def.roots.some((root) => token.startsWith(root))) {
      indices.push(index)
    }
  }
  for (const phrase of def.phrases) {
    let idx = text.indexOf(phrase)
    while (idx !== -1) {
      indices.push(idx)
      idx = text.indexOf(phrase, idx + 1)
    }
  }
  return indices
}

// 마지막 문장의 [start, end) 범위. 문장 종결부호(./!/?/줄바꿈) 기준 단순 분리.
function getLastSentenceRange(text: string): [number, number] {
  const terminator = /[.!?\n]+/g
  const boundaries: number[] = [0]
  let m: RegExpExecArray | null
  while ((m = terminator.exec(text))) {
    boundaries.push(m.index + m[0].length)
  }
  boundaries.push(text.length)
  for (let i = boundaries.length - 2; i >= 0; i--) {
    const start = boundaries[i]
    const end = boundaries[i + 1]
    if (text.slice(start, end).trim().length > 0) return [start, end]
  }
  return [0, text.length]
}

type AgeGroup = "10대" | "20대" | "30대" | "40대" | "50대이상"

// 연령대는 축1 우선순위 계산의 배경 신호일 뿐, 사용자에게 노출되는 축이 아니다.
// 정확한 컷오프가 prd에 없어 다음은 구현 판단(단순화)이다:
// - "직장 N년차": 1~9→20대, 10~19→30대, 20~29→40대, 30+→50대이상
// - "저/제가 OO살": 10대~50대이상 구간을 나이대로 그대로 매핑
// - "애 엄마/애 아빠": 30대로 고정(대표값, 정밀 분류 아님)
function detectAgeGroup(text: string): AgeGroup | null {
  if (text.includes("고3")) return "10대"
  if (text.includes("고1") || text.includes("고2")) return "10대"
  if (text.includes("대학생") || text.includes("취준생")) return "20대"

  const workYears = text.match(/직장\s*(\d+)\s*년차/)
  if (workYears) {
    const n = parseInt(workYears[1], 10)
    if (n < 10) return "20대"
    if (n < 20) return "30대"
    if (n < 30) return "40대"
    return "50대이상"
  }

  const age = text.match(/(?:저|제가)\s*(\d+)\s*살/)
  if (age) {
    const n = parseInt(age[1], 10)
    if (n < 20) return "10대"
    if (n < 30) return "20대"
    if (n < 40) return "30대"
    if (n < 50) return "40대"
    return "50대이상"
  }

  if (text.includes("애 엄마") || text.includes("애 아빠")) return "30대"

  return null
}

const AGE_WEIGHTS: Record<AgeGroup, Record<Axis1Topic, number>> = {
  "10대": { 연애: 1, 인간관계: 2, 학업: 3, 진로: 0, 가족: 0, 자존감: 1 },
  "20대": { 연애: 3, 인간관계: 1, 학업: 0, 진로: 2, 가족: 0, 자존감: 1 },
  "30대": { 연애: 1, 인간관계: 0, 학업: 0, 진로: 3, 가족: 1, 자존감: 1 },
  "40대": { 연애: 0, 인간관계: 1, 학업: 0, 진로: 1, 가족: 3, 자존감: 1 },
  "50대이상": { 연애: 0, 인간관계: 1, 학업: 0, 진로: 0, 가족: 2, 자존감: 3 },
}

function detectAxis1(text: string): Axis1Topic {
  const tokens = tokenize(text)
  const detected = new Map<Axis1Topic, { base: number; recency: boolean; lastIndex: number }>()
  const [lastStart, lastEnd] = getLastSentenceRange(text)

  for (const topic of AXIS1_TOPIC_ORDER) {
    const matches = findAxis1Matches(text, tokens, AXIS1_DEFS[topic])
    if (matches.length === 0) continue
    detected.set(topic, {
      base: matches.length,
      recency: matches.some((i) => i >= lastStart && i < lastEnd),
      lastIndex: Math.max(...matches),
    })
  }

  if (detected.size === 0) return AXIS1_DEFAULT

  const age = detectAgeGroup(text)

  // 연령대 신호가 없으면 2~5단계(점수 계산) 없이 바로 "나중에 등장한 신호 우선"만 적용
  if (!age) {
    let best: Axis1Topic = AXIS1_DEFAULT
    let bestIndex = -1
    for (const [topic, s] of detected) {
      if (s.lastIndex > bestIndex) {
        bestIndex = s.lastIndex
        best = topic
      }
    }
    return best
  }

  const ranked = Array.from(detected.entries()).map(([topic, s]) => ({
    topic,
    total: s.base + (s.recency ? 2 : 0) + AGE_WEIGHTS[age][topic],
    recency: s.recency,
    lastIndex: s.lastIndex,
  }))

  ranked.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    if (a.recency !== b.recency) return (b.recency ? 1 : 0) - (a.recency ? 1 : 0)
    return b.lastIndex - a.lastIndex
  })

  return ranked[0].topic
}

// ---------------------------------------------------------------------------
// 축2 — 상담 스타일 (3택) / 축3 — 개입 방식 (2택)
// 둘 다 "문장에서 나중에 등장한 신호 우선"만 적용(연령대 계산은 축1 전용)
// ---------------------------------------------------------------------------

type Axis2Style = "완전공감형" | "균형형" | "직설해결형"
type Axis3Mode = "질문유도" | "직접조언"

interface KeywordOption<T extends string> {
  value: T
  keywords: string[]
}

const AXIS2_OPTIONS: KeywordOption<Axis2Style>[] = [
  {
    value: "완전공감형",
    keywords: [
      "그냥 들어만 줘",
      "판단하지 말고",
      "위로만 해줘",
      "조언은 됐고",
      "그냥 공감만 해줘",
      "듣기만 해줘",
      "그냥 하소연하고 싶어",
    ],
  },
  {
    value: "균형형",
    keywords: [
      "위로도 해주고 조언도 해줘",
      "같이 생각해줘",
      "공감도 하고 조언도 해줘",
      "위로랑 조언 둘 다",
    ],
  },
  {
    value: "직설해결형",
    keywords: [
      "팩트로 말해줘",
      "쓴소리 해도 돼",
      "돌려 말하지 말고",
      "객관적으로 뭐가 문제인지",
      "직설적으로 말해줘",
      "현실적으로 말해줘",
      "핵심만 말해줘",
    ],
  },
]

const AXIS2_EFFECTS: Record<Axis2Style, string> = {
  완전공감형: "길게(3~4문장) 답변하고, 조언 없이 감정 반영에만 집중하세요.",
  균형형: "중간 길이로 답변하고, 공감과 조언을 반반 섞어주세요.",
  직설해결형:
    "짧고 간결하게(2~3문장) 답변하고, 위로는 최소화하며 핵심 조언 위주로 답하세요.",
}

const AXIS3_OPTIONS: KeywordOption<Axis3Mode>[] = [
  {
    value: "질문유도",
    keywords: [
      "같이 생각해봐줘",
      "질문 좀 던져줘",
      "정리하게 도와줘",
      "내가 뭘 원하는지 모르겠어",
      "스스로 답을 찾게",
      "질문해줘",
    ],
  },
  {
    value: "직접조언",
    keywords: [
      "그냥 답을 알려줘",
      "어떻게 해야 하는지 말해줘",
      "결론만",
      "뭘 해야 할지 알려줘",
      "방법을 알려줘",
      "어떻게 하면 좋을지",
    ],
  },
]

const AXIS3_EFFECTS: Record<Axis3Mode, string> = {
  질문유도: "결론을 바로 주지 말고 열린 질문으로 스스로 정리하도록 유도하세요.",
  직접조언: "상황을 분석해 구체적이고 실행 가능한 방향을 바로 제시하세요.",
}

// 내부 타입(공백 없음) ↔ UI/축 표시 라벨(prd 표기 그대로, 공백·가운뎃점 포함) 매핑.
// category.axes[].options·detectAxes 반환값은 표시 라벨을, generatePrompt 내부 로직은
// 내부 타입을 쓰므로 양방향 변환이 필요하다.
const AXIS2_DISPLAY: Record<Axis2Style, (typeof AXIS2_OPTIONS_DISPLAY)[number]> = {
  완전공감형: "완전 공감형",
  균형형: "균형형",
  직설해결형: "직설·해결형",
}
const AXIS2_FROM_DISPLAY: Record<string, Axis2Style> = Object.fromEntries(
  (Object.entries(AXIS2_DISPLAY) as [Axis2Style, string][]).map(([internal, display]) => [
    display,
    internal,
  ]),
)

const AXIS3_DISPLAY: Record<Axis3Mode, (typeof AXIS3_OPTIONS_DISPLAY)[number]> = {
  질문유도: "질문으로 유도",
  직접조언: "직접 조언 제시",
}
const AXIS3_FROM_DISPLAY: Record<string, Axis3Mode> = Object.fromEntries(
  (Object.entries(AXIS3_DISPLAY) as [Axis3Mode, string][]).map(([internal, display]) => [
    display,
    internal,
  ]),
)

// 축2·축3 공통: 옵션들의 키워드 중 텍스트에서 가장 나중에 등장한 것이 채택된다.
function detectLastOccurring<T extends string>(
  text: string,
  options: KeywordOption<T>[],
  defaultValue: T,
): T {
  let best = defaultValue
  let bestIndex = -1
  for (const opt of options) {
    for (const kw of opt.keywords) {
      let idx = text.indexOf(kw)
      while (idx !== -1) {
        if (idx > bestIndex) {
          bestIndex = idx
          best = opt.value
        }
        idx = text.indexOf(kw, idx + 1)
      }
    }
  }
  return best
}

function detectAxis2(text: string): Axis2Style {
  return detectLastOccurring(text, AXIS2_OPTIONS, "균형형")
}

function detectAxis3(text: string): Axis3Mode {
  return detectLastOccurring(text, AXIS3_OPTIONS, "직접조언")
}

// 자동 감지 — 페이지2 진입 시 이 결과로 축 버튼 초기 상태를 채운다(ComparePage에서 호출).
// 반환값은 category.axes[].options에 있는 라벨 문자열 그대로다.
export function detectAxes(text: string): Record<string, string> {
  const topic = detectAxis1(text)
  const style = detectAxis2(text)
  const mode = detectAxis3(text)
  return {
    topic,
    style: AXIS2_DISPLAY[style],
    intervention: AXIS3_DISPLAY[mode],
  }
}

// axes는 이미 확정된 축 값이다(detectAxes로 자동 채워졌거나, 사용자가 페이지2에서
// 버튼을 눌러 직접 override한 값) — 여기서는 텍스트를 다시 감지하지 않고 그 값을
// 그대로 문장 조립에 쓴다.
export function generatePrompt(
  text: string,
  axes: Record<string, string>,
): string {
  const topic: Axis1Topic =
    axes["topic"] && axes["topic"] in AXIS1_DEFS
      ? (axes["topic"] as Axis1Topic)
      : AXIS1_DEFAULT
  const style: Axis2Style = AXIS2_FROM_DISPLAY[axes["style"]] ?? "균형형"
  const mode: Axis3Mode = AXIS3_FROM_DISPLAY[axes["intervention"]] ?? "직접조언"

  const persona = AXIS1_DEFS[topic]

  // 축2 × 축3 충돌 처리 매트릭스 (prd 개인상담.md)
  let styleInstruction: string
  if (style === "완전공감형" && mode === "직접조언") {
    styleInstruction = AXIS2_EFFECTS[style] // 축2 우선, 축3(직접 조언) 지시는 보류
  } else if (style === "직설해결형" && mode === "질문유도") {
    styleInstruction =
      "결론을 완전히 유보하지 말고, 짧은 진단 한 문장과 다음 행동을 확인하는 질문 하나를 결합해서 답변하세요."
  } else {
    styleInstruction = `${AXIS2_EFFECTS[style]} ${AXIS3_EFFECTS[mode]}`
  }

  // 연애/인간관계 페르소나는 effect 안에 이미 "비속어·은어 금지"가 들어 있으므로
  // 여기서 별도 금칙어 지시를 중복 삽입하지 않는다(P-상담2).
  return `다음 고민에 "${persona.personaLabel}"로 답변해 주세요.\n\n[페르소나 지침]\n• ${persona.effect}\n\n[상담 방식 지침]\n• ${styleInstruction}\n\n[상황]\n${text}\n\n[안전 규칙]\n• ${fixedRules[0].message}`
}
