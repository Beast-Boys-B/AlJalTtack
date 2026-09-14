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

// ============================================================================
// 축 감지 로직 — prd/의료질문.md 가 정본이다.
// 축1(목적)·축3(증상성격): 명사+조사 어근이 아니라 구문(짧은 문장 조각) 형태라
//   어근화하지 않고 구문 그대로 포함(substring) 매칭한다. (prd 축1 "매칭 참고" 문단 근거)
// 축2(대상): 우 신호는 명사+조사 구조라 어근 + startsWith 매칭, 단 "딸"·"형"·"아이"는
//   1~2글자 짧은 어근이라 무관 단어(딸기/형식/아이러니 등)와 겹쳐 조사 결합형으로
//   좁힌 예외를 그대로 둔다. (prd 축2 "매칭 참고" 문단 근거)
// 겹침 처리: 한 축 내 좌/우 신호가 동시에 등장하면 문자열 상 더 나중에 등장한
//   신호를 채택. 아무 신호도 없으면 각 축 기본값(전부 좌). (prd "겹침 처리 규칙")
// "~대신" 같은 대리 질문 표현은 prd 축2 "겹침 처리 참고" 문단에서 의도적으로
//   미처리 결정된 사항이라 별도 로직을 추가하지 않는다.
// ============================================================================

type Side = "좌" | "우"

// 축1 — 목적: 좌=증상·질병 정보 알아보기 / 우=병원 가기 전 문진 준비하기
// ("~인가요"/"~때문인지"의 "~"는 선행 표현 자리표시일 뿐 리터럴 문자가 아니므로 제외)
const PURPOSE_LEFT_PHRASES = [
  "증상",
  "왜 그런지",
  "원인이 뭔지",
  "이게 무슨 병",
  "병명",
  "인가요",
  "위험한가요",
  "심각한가요",
  "이 정도면 괜찮은지",
  "때문인지",
  "이유가 궁금해서",
  "뭐 때문인지",
  "어떤 병일까요",
  "무슨 문제일까요",
  "정상인지",
  "걱정되는데",
  "검색해봐도 모르겠어서",
  "정상 범위인지",
  "심한 건지",
  "큰 병인지",
  "그냥 넘어가도 되는지",
  "걸린 것 같은데",
  "몸에 이상이 있는지",
  "이상 없는지",
]

const PURPOSE_RIGHT_PHRASES = [
  "병원 가기 전",
  "의사한테 뭐라고",
  "진료 볼 때",
  "물어볼 거",
  "준비해야 할 거",
  "문진표",
  "예약했는데",
  "검사받으러 가는데",
  "상담받기 전에",
  "진료 예약했어요",
  "내일 병원 가는데",
  "의사선생님께 뭐라고",
  "진료 전에 정리하고 싶어서",
  "어떤 검사를 받을지",
  "초진인데",
  "상담 전에 미리",
  "뭘 준비해가야",
  "어떻게 설명해야 할지",
  "진료실에서 말할 내용",
  "검진 앞두고",
  "2차 소견 받으러",
]

// 축2 — 대상: 좌=본인 / 우=가족·보호 대상자
// 좌 신호는 "저가"처럼 조사 결합 시 발음이 불규칙(저+가→제가)해 어근화가 불가능하므로
// 형태를 그대로 나열한다. "(주어 없이 본인 지칭)"은 리터럴 키워드가 아니라 "주어가 없으면
// 기본값 좌(본인)"이라는 설명이라 기본값 규칙으로 이미 충족되어 별도 키워드로 옮기지 않는다.
const TARGET_SELF_PHRASES = [
  "제가",
  "저는",
  "나는",
  "요즘 제가",
  "제 몸이",
  "저 요즘",
  "요새 자꾸",
  "며칠 전부터 제가",
  "저 스스로",
]

// 어근 + startsWith 매칭 대상 (조사 무관)
const TARGET_FAMILY_ROOTS = [
  "엄마",
  "아빠",
  "어머니",
  "아버지",
  "아들",
  "남편",
  "아내",
  "할머니",
  "할아버지",
  "부모님",
  "신생아",
  "영유아",
  "오빠",
  "언니",
  "누나",
  "동생",
  "배우자",
  "손주",
  "손자",
  "손녀",
  "며느리",
  "사위",
  "태아",
  "환자분",
  "어르신",
]

// 공백을 포함한 어근이라 startsWith 토큰 매칭이 아니라 구문 포함 매칭으로 처리
const TARGET_FAMILY_MULTIWORD_PHRASES = ["우리 애", "우리 아이"]

// "딸"·"형"·"아이"는 1~2글자 짧은 어근이라 그대로 startsWith 매칭하면
// "딸기"·"형식"·"형편"·"아이러니" 같은 무관 단어와 겹쳐, 자주 쓰는 조사 결합형만 나열해 좁힌 예외.
// TODO(schema-2): 조사가 아예 생략된 구어체("딸 열나요")는 이 좁힌 형태로 못 잡는다는
// 트레이드오프가 prd에 명시돼 있고 팀이 감수하기로 확인됨 — 그대로 반영, 추가 처리 없음.
const TARGET_FAMILY_NARROW_JOSA_FORMS = [
  "딸이",
  "딸은",
  "딸을",
  "딸한테",
  "딸이랑",
  "딸도",
  "형이",
  "형은",
  "형을",
  "형한테",
  "형이랑",
  "형도",
  "아이가",
  "아이는",
  "아이를",
  "아이한테",
  "아이랑",
  "아이도",
]

// 축3 — 증상 성격: 좌=갑자기 생긴 증상 / 우=오래된·만성 증상 (구문 그대로 매칭)
const NATURE_LEFT_PHRASES = [
  "갑자기",
  "어제부터",
  "오늘부터",
  "방금",
  "급격히",
  "순간적으로",
  "그제부터",
  "며칠 전부터",
  "이틀 전부터",
  "아까부터",
  "자다가 갑자기",
  "어젯밤부터",
  "확 나타난",
  "처음 겪는",
  "난생 처음",
]

const NATURE_RIGHT_PHRASES = [
  "계속",
  "오래전부터",
  "몇 달째",
  "몇 년째",
  "만성",
  "반복적으로",
  "예전부터",
  "자꾸 재발",
  "몇 주째",
  "오래됐어요",
  "낫질 않아",
  "없어지지 않고",
  "주기적으로",
  "계속 반복되는",
  "고질적으로",
  "어릴 때부터",
  "지병이라",
  "계속 달고 사는",
]

// 문장 안에서 phrases 중 가장 나중(끝쪽)에 등장한 위치를 반환. 매치 없으면 -1.
function lastPhraseIndex(text: string, phrases: string[]): number {
  let best = -1
  for (const phrase of phrases) {
    const idx = text.lastIndexOf(phrase)
    if (idx > best) best = idx
  }
  return best
}

// 공백 기준으로 나눈 각 토큰이 roots 중 하나로 시작하는지(startsWith) 확인하고,
// 그중 가장 나중에 등장한 토큰의 위치를 반환. 매치 없으면 -1.
function lastRootTokenIndex(text: string, roots: string[]): number {
  const tokens = text.split(/\s+/).filter(Boolean)
  let best = -1
  let searchFrom = 0
  for (const token of tokens) {
    const start = text.indexOf(token, searchFrom)
    if (roots.some((root) => token.startsWith(root))) {
      best = start
    }
    searchFrom = start + token.length
  }
  return best
}

// 겹침 처리 규칙: 더 나중에 등장한 신호를 채택, 둘 다 없으면 기본값(좌)
function pickSide(leftIndex: number, rightIndex: number): Side {
  if (leftIndex === -1 && rightIndex === -1) return "좌"
  return rightIndex > leftIndex ? "우" : "좌"
}

function detectPurpose(text: string): Side {
  const left = lastPhraseIndex(text, PURPOSE_LEFT_PHRASES)
  const right = lastPhraseIndex(text, PURPOSE_RIGHT_PHRASES)
  return pickSide(left, right)
}

function detectTarget(text: string): Side {
  const left = lastPhraseIndex(text, TARGET_SELF_PHRASES)
  const rightRoot = lastRootTokenIndex(text, TARGET_FAMILY_ROOTS)
  const rightMultiWord = lastPhraseIndex(text, TARGET_FAMILY_MULTIWORD_PHRASES)
  const rightNarrowJosa = lastPhraseIndex(text, TARGET_FAMILY_NARROW_JOSA_FORMS)
  const right = Math.max(rightRoot, rightMultiWord, rightNarrowJosa)
  return pickSide(left, right)
}

function detectSymptomNature(text: string): Side {
  const left = lastPhraseIndex(text, NATURE_LEFT_PHRASES)
  const right = lastPhraseIndex(text, NATURE_RIGHT_PHRASES)
  return pickSide(left, right)
}

// axes(수동 선택값)는 이 카테고리 스키마상 축1~3이 전부 텍스트 자동 감지 대상이라 사용하지
// 않는다 — 시그니처는 공유 계약(types.ts 미변경 원칙)을 지키기 위해 그대로 유지한다.
export function generatePrompt(
  text: string,
  _axes: Record<string, string>,
): string {
  const purpose = detectPurpose(text)
  const target = detectTarget(text)
  const nature = detectSymptomNature(text)

  // AI 역할(페르소나)은 축1(목적)에서 결정된다. (prd 축1 하단 안내 문단 근거)
  const role =
    purpose === "좌"
      ? "건강 정보를 알기 쉽게 설명해주는 안내자"
      : "진료 전 준비를 돕는 코디네이터"

  const targetLabel = target === "좌" ? "본인" : "가족/보호 대상자"
  const natureLabel = nature === "좌" ? "갑자기 생긴 증상" : "오래된/만성 증상"

  const bullets =
    purpose === "좌"
      ? [
          "증상의 가능한 원인들을 설명해 주세요.",
          "즉시 병원을 가야 하는 응급 신호가 있다면 알려주세요.",
          "어느 진료과를 방문하면 좋을지 안내해 주세요.",
          "일상에서 할 수 있는 자가 관리법도 포함해 주세요.",
        ]
      : [
          "진료 전 의사에게 꼭 물어봐야 할 질문 목록을 정리해 주세요.",
          "문진표/상담에서 답해야 할 항목(증상 시작 시점, 경과 등)을 짚어 주세요.",
          "예상되는 검사나 준비물이 있다면 안내해 주세요.",
          "진료실에서 증상을 효과적으로 설명하는 방법도 알려주세요.",
        ]

  // 고정 규칙(안전 문구)은 축 판정과 무관하게 항상 최종 프롬프트에 포함
  const safetyMessage = fixedRules.map((rule) => rule.message).join(" ")

  return `당신은 ${role}입니다.\n\n[대상] ${targetLabel}\n[증상 성격] ${natureLabel}\n\n[질문]\n${text}\n\n[답변 구성]\n${bullets
    .map((bullet) => `• ${bullet}`)
    .join("\n")}\n\n※ ${safetyMessage}`
}
