// AI사진생성 — 담당 조연익
// prd/AI사진생성.md 가 정본이다. 축 정의·키워드·태그 조립 로직을 여기에
// 구현한다. 이 파일 밖(다른 카테고리 파일, App.tsx, types.ts)은 건드리지
// 않는다.

import type { Category, FixedRule } from "./types"

// prd/AI사진생성.md > 축 1 — 가로세로비율: 표시 순서 그대로 4지선다, 원문
// 텍스트에서 키워드로 감지하지 않는 유일한 축(항상 사용자가 세부 조정에서
// 직접 클릭). 그래서 이 배열은 detectAxes에서 전혀 참조되지 않는다 — 참조하는
// 순간 자동감지가 생기는 셈이라 의도적으로 분리해 둔다.
const ASPECT_RATIO_OPTIONS = ["와이드스크린(16:9)", "가로(4:3)", "정사각형(1:1)", "기본(3:4)"] as const

export const category: Category = {
  id: "photo",
  name: "AI사진생성",
  icon: "🎨",
  arcadeBadge: "STAGE 4 • 픽셀 렌더러",
  description: "AI 이미지 생성용 프롬프트를 만들어요",
  placeholder: "파란 하늘 아래 카페에 앉아 있는 고양이를 그려줘",
  example: "노을 지는 바닷가에서 산책하는 사람의 실루엣",
  axes: [
    {
      id: "aspectRatio",
      label: "가로세로비율",
      options: [...ASPECT_RATIO_OPTIONS],
      hint: "이 축은 원문에서 자동으로 감지되지 않아요 — 항상 직접 클릭해서 골라야 해요.",
    },
    {
      id: "style",
      label: "스타일",
      options: ["사진 같은 현실적", "일러스트/만화/추상적"],
      hint: "'일러스트/만화/추상적'을 고르면 사진이 아니라 그림풍 이미지 쪽으로 태그가 바뀌어요.",
    },
    {
      id: "subject",
      label: "주요 피사체",
      options: ["인물 중심", "인물 중심 아님(풍경·물건·동물)"],
      hint: "'인물 중심 아님'을 고르면 풍경·동물·사물 위주로 피사체 태그가 바뀌어요.",
    },
    {
      id: "framing",
      label: "구도/프레이밍",
      options: ["클로즈업", "광활한 뷰"],
      hint: "'광활한 뷰'를 고르면 넓은 배경을 담은 구도로, '클로즈업'은 가까이서 확대한 구도로 태그가 바뀌어요.",
    },
  ],
  hashtags: [
    {
      tag: "#인물",
      example: "노을 지는 바닷가에서 산책하는 아날로그 감성의 인물 실루엣",
    },
    {
      tag: "#풍경",
      example: "구름 가득한 파란 하늘과 들꽃이 만발한 언덕 풍경 수채화",
    },
    {
      tag: "#음식",
      example: "따뜻한김이 모락모락 나는 정갈한 일본식 라멘 한 그릇 4K 초고화질 사진",
    },
    {
      tag: "#동물",
      example: "마법사 모자를 입은 귀여운 3D 픽사 애니메이션 스타일 고양이",
    },
    {
      tag: "#건축",
      example: "네온사인이 번쩍이는 비 내리는 미래 도시 사이버펑크 고층 빌딩 야경",
    },
    {
      tag: "#판타지",
      example: "신비로운 빛이 감도는 고대 숲속의 거대한 드래곤 일러스트",
    },
  ],
}

export const color = "#A855F7" // purple

// prd/AI사진생성.md > 고정 규칙: 문구를 그대로 옮김 (조건 없이 항상 적용).
export const fixedRules: FixedRule[] = [
  {
    label: "상업적 이용",
    message:
      "상업용으로 이용할 경우 생성된 이미지는 이용 전 해당 AI 서비스의 이용 약관과 저작권 정책을 확인하세요.",
  },
  {
    label: "인물 디테일",
    message: "더 정확한 결과를 위해 인물의 나이대, 성별, 표정, 스타일을 함께 적어주시면 좋아요.",
  },
]

// ---------------------------------------------------------------------------
// 매칭 헬퍼 (prd/작성.md 에서 확립된 원칙을 그대로 적용)
//
// 공백 없는 단어(명사 어근, 예: 사진·인물·클로즈업)는 조사가 붙어도
// (사진이·인물을·클로즈업으로 등) 각 어절이 이 어근으로 시작하는지만
// 확인하면 감지되므로 startsWith로 매칭한다. 공백이 있는 복합 표현
// (예: "3D 렌더링", "인물 사진", "전체 샷")은 한 어절이 아니므로 문장 안에
// 그대로 등장하는지(부분 문자열)만 확인한다.
// ---------------------------------------------------------------------------

function lastNounRootIndex(text: string, roots: string[]): number {
  let last = -1
  for (const m of text.matchAll(/\S+/g)) {
    const word = m[0]
    if (roots.some((root) => word.startsWith(root)) && m.index! > last) {
      last = m.index!
    }
  }
  return last
}

function lastLiteralIndex(text: string, phrases: string[]): number {
  let last = -1
  for (const phrase of phrases) {
    const idx = text.lastIndexOf(phrase)
    if (idx > last) last = idx
  }
  return last
}

function lastSignalIndex(text: string, nounRoots: string[], compoundPhrases: string[] = []): number {
  return Math.max(lastNounRootIndex(text, nounRoots), lastLiteralIndex(text, compoundPhrases))
}

// ---------------------------------------------------------------------------
// 축1 — 스타일 (단일 선택): 좌/우 동시 감지 시 전체 텍스트에서 더 나중에 등장한
// 신호를 우선 채택. 기본값: 좌(사진 같은 현실적).
// ---------------------------------------------------------------------------

const STYLE_LEFT_NOUN = ["사진", "현실적", "포토리얼", "실제", "진짜", "사실적"]
const STYLE_LEFT_COMPOUND = ["3D 렌더링"]
const STYLE_RIGHT_NOUN = [
  "일러스트",
  "만화",
  "카툰",
  "드로잉",
  "손그림",
  "추상적",
  "판타지",
  "컨셉아트",
  "스타일라이즈",
]

const STYLE_LABEL = {
  left: "사진 같은 현실적",
  right: "일러스트/만화/추상적",
} as const

function detectStyle(text: string): "left" | "right" {
  const leftIdx = lastSignalIndex(text, STYLE_LEFT_NOUN, STYLE_LEFT_COMPOUND)
  const rightIdx = lastSignalIndex(text, STYLE_RIGHT_NOUN)
  if (leftIdx === -1 && rightIdx === -1) return "left" // 기본값: 좌
  return rightIdx > leftIdx ? "right" : "left"
}

// ---------------------------------------------------------------------------
// 축2 — 주요 피사체 (단일 선택): 좌/우 동시 감지 시 전체 텍스트에서 더 나중에
// 등장한 신호를 우선 채택. 기본값: 좌(인물 중심).
// ---------------------------------------------------------------------------

const SUBJECT_LEFT_NOUN = ["사람", "인물", "초상화", "모델"]
const SUBJECT_LEFT_COMPOUND = ["인물 사진", "사람 사진", "여성 인물", "남성 인물", "인물 포즈"]
const SUBJECT_RIGHT_NOUN = [
  "풍경",
  "자연",
  "건물",
  "물건",
  "제품",
  "동물",
  "강아지",
  "고양이",
  "숲",
  "바다",
  "도시",
  "음식",
]

const SUBJECT_LABEL = {
  left: "인물 중심",
  right: "인물 중심 아님(풍경·물건·동물)",
} as const

function detectSubject(text: string): "left" | "right" {
  const leftIdx = lastSignalIndex(text, SUBJECT_LEFT_NOUN, SUBJECT_LEFT_COMPOUND)
  const rightIdx = lastSignalIndex(text, SUBJECT_RIGHT_NOUN)
  if (leftIdx === -1 && rightIdx === -1) return "left" // 기본값: 좌
  return rightIdx > leftIdx ? "right" : "left"
}

// ---------------------------------------------------------------------------
// 축3 — 구도/프레이밍 (단일 선택): 좌/우 동시 감지 시 전체 텍스트에서 더 나중에
// 등장한 신호를 우선 채택. 기본값: 우(광활한 뷰).
// ---------------------------------------------------------------------------

const FRAMING_LEFT_NOUN = ["클로즈업", "가까운", "확대", "세부", "근접", "헤드샷", "디테일"]
const FRAMING_RIGHT_NOUN = ["멀리서", "광각", "전경", "넓게", "드넓은"]
const FRAMING_RIGHT_COMPOUND = ["전체 샷", "배경 포함", "와이드 샷"]

const FRAMING_LABEL = {
  left: "클로즈업",
  right: "광활한 뷰",
} as const

function detectFraming(text: string): "left" | "right" {
  const leftIdx = lastSignalIndex(text, FRAMING_LEFT_NOUN)
  const rightIdx = lastSignalIndex(text, FRAMING_RIGHT_NOUN, FRAMING_RIGHT_COMPOUND)
  if (leftIdx === -1 && rightIdx === -1) return "right" // 기본값: 우
  return rightIdx > leftIdx ? "right" : "left"
}

// 자동 감지 — 페이지2 진입 시 이 결과로 축 버튼 초기 상태를 채운다(ComparePage에서 호출).
// 이게 없으면 ComparePage는 첫 옵션을 기본값으로 쓰는데, 그 첫 옵션 문자열이
// 마침 STYLE_LABEL.left 등과 똑같아서 generatePrompt가 이를 "수동 선택"으로
// 착각해 첫 로드 시 실제 텍스트 감지를 건너뛰던 문제가 있었다.
export function detectAxes(text: string): Record<string, string> {
  return {
    style: STYLE_LABEL[detectStyle(text)],
    subject: SUBJECT_LABEL[detectSubject(text)],
    framing: FRAMING_LABEL[detectFraming(text)],
  }
}

// prd/AI사진생성.md > 태그 조립 원칙: 가로세로비율(사용자 선택값) 1개 +
// 스타일/피사체/구도 각 축에서 감지된(또는 기본값) 신호 1개씩, 총 4개의
// 태그가 항상 이 순서로 조립된다. 조립 형식도 다른 4개 카테고리(역할지정형
// 문장)와 달리 "[사용자 원문], tag1, tag2, tag3, tag4" 형태다.
export function generatePrompt(text: string, axes: Record<string, string>): string {
  // 축1 — 가로세로비율은 자동감지가 없으므로 axes에 담긴 사용자 선택값을
  // 그대로 쓴다. 값이 없거나 옵션 목록에 없는 값이면(예: 초기 로드 시 축
  // 상태가 아직 채워지지 않은 경우) prd 기본값인 1번째 옵션으로 폴백한다.
  const manualAspectRatio = axes["aspectRatio"]
  const aspectRatio: string = (ASPECT_RATIO_OPTIONS as readonly string[]).includes(manualAspectRatio)
    ? manualAspectRatio
    : ASPECT_RATIO_OPTIONS[0]

  const manualStyle = axes["style"]
  const style: "left" | "right" =
    manualStyle === STYLE_LABEL.right ? "right" : manualStyle === STYLE_LABEL.left ? "left" : detectStyle(text)

  const manualSubject = axes["subject"]
  const subject: "left" | "right" =
    manualSubject === SUBJECT_LABEL.right
      ? "right"
      : manualSubject === SUBJECT_LABEL.left
        ? "left"
        : detectSubject(text)

  const manualFraming = axes["framing"]
  const framing: "left" | "right" =
    manualFraming === FRAMING_LABEL.right
      ? "right"
      : manualFraming === FRAMING_LABEL.left
        ? "left"
        : detectFraming(text)

  // TODO(schema-photo-1): prd/AI사진생성.md는 "감지된 신호 1개씩만 태그로
  // 변환"이라고만 하고, 각 축의 좌/우가 어떤 정확한 태그 문자열(예: 영문
  // 키워드)로 변환되는지는 명시하지 않는다. 여기서는 스키마에 그대로 적힌
  // 축 옵션 라벨 텍스트(예: "사진 같은 현실적")를 태그로 사용한다 — 스키마에
  // 없는 영문 키워드 매핑을 임의로 지어내지 않기 위함이다. 이미지 생성 AI에
  // 더 적합한 구체적 태그 문구가 정해지면 이 매핑만 교체하면 된다.
  const tags = [aspectRatio, STYLE_LABEL[style], SUBJECT_LABEL[subject], FRAMING_LABEL[framing]]

  return `${text}, ${tags.join(", ")}`
}
