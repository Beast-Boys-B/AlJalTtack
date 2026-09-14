// 작성 — 담당 조연익
// prd/작성.md 가 정본이다. 축 정의·키워드·매칭 원칙(명사 어근 vs 구문형)·
// 겹침 처리 로직을 여기에 구현한다. 이 파일 밖(다른 카테고리 파일, App.tsx,
// types.ts)은 건드리지 않는다.

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
    {
      id: "purpose",
      label: "목적",
      options: ["정보 전달/보고하기", "요청/승인받기"],
    },
    {
      id: "target",
      label: "대상",
      options: ["상급자/외부인", "동료/팀원"],
    },
    {
      id: "docType",
      label: "문서 유형",
      options: ["간단한 형식(이메일/메신저)", "체계적 형식(회의록/보고서/기획서)"],
    },
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

// prd/작성.md > 고정 규칙: 조건 "상급자, 외부인" → 문구를 그대로 옮김.
export const fixedRules: FixedRule[] = [
  {
    label: "상급자, 외부인",
    message: "공손한 말투: 상사나 고객에게 적합한 존댓말을 사용해요.",
  },
]

// ---------------------------------------------------------------------------
// 매칭 헬퍼
//
// prd/작성.md 매칭 참고: 명사 어근 키워드(조사 무관 매칭 전제)는 순수 명사라
// 조사가 붙어도(보고서·보고드립니다·전달할게요 등) 각 어절이 이 어근으로
// 시작하는지(startsWith)만 확인하면 감지된다. 구문형 키워드(승인해 주세요·
// 검토 부탁 등)는 짧은 문장 조각이라 어근화하지 않고 나열된 형태 그대로
// 매칭한다. 두 그룹을 하나로 뭉뚱그리면 순수 명사 키워드가 활용형을 못 잡는
// 버그가 되므로 반드시 구분해서 구현한다.
//
// 축2·축3의 좌/우 신호 목록에도 같은 원리를 적용한다: 공백 없는 단어(팀원,
// 회의록, 형식 등)는 명사 어근으로 보고 startsWith, 공백이 있는 복합 표현
// ("같은 팀", "한두 줄" 등)은 한 어절이 아니므로 문장 안에 그대로 등장하는지
// (부분 문자열)만 확인한다 — 이 경우도 뒤에 조사가 붙으면("같은 팀에서")
// 부분 문자열 검사만으로 그대로 잡힌다.
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

function hasNounRoot(text: string, roots: string[]): boolean {
  return lastNounRootIndex(text, roots) >= 0
}

function lastLiteralIndex(text: string, phrases: string[]): number {
  let last = -1
  for (const phrase of phrases) {
    const idx = text.lastIndexOf(phrase)
    if (idx > last) last = idx
  }
  return last
}

function hasLiteral(text: string, phrases: string[]): boolean {
  return lastLiteralIndex(text, phrases) >= 0
}

// ---------------------------------------------------------------------------
// 축1 — 목적 (중복 선택): 좌/우를 독립적으로 감지해 감지된 신호를 모두
// 반영한다(겹침 처리 규칙 대상이 아님).
// ---------------------------------------------------------------------------

const PURPOSE_LEFT_NOUN = ["보고", "전달", "공유", "완료", "결과", "현황", "공지"]
const PURPOSE_LEFT_LITERAL = ["알려드립니다", "진행 상황"]
const PURPOSE_RIGHT_NOUN = ["요청", "결재"]
const PURPOSE_RIGHT_LITERAL = [
  "승인해 주세요",
  "검토 부탁",
  "허락받고 싶은데",
  "해주실 수 있을까요",
  "도와주세요",
  "협조 부탁",
]

const PURPOSE_LABEL = {
  left: "정보 전달/보고하기",
  right: "요청/승인받기",
} as const

function detectPurpose(text: string): { left: boolean; right: boolean } {
  const left = hasNounRoot(text, PURPOSE_LEFT_NOUN) || hasLiteral(text, PURPOSE_LEFT_LITERAL)
  const right = hasNounRoot(text, PURPOSE_RIGHT_NOUN) || hasLiteral(text, PURPOSE_RIGHT_LITERAL)
  if (!left && !right) return { left: true, right: false } // 기본값: 좌
  return { left, right }
}

// ---------------------------------------------------------------------------
// 축2 — 대상 (단일 선택): 좌/우 동시 감지 시 문장에서 더 나중에 등장한 신호를
// 우선 채택한다.
// ---------------------------------------------------------------------------

const TARGET_LEFT_NOUN = [
  "사장님",
  "임원진",
  "본부장",
  "과장",
  "팀장",
  "거래처",
  "외부",
  "고객",
  "클라이언트",
  "상사",
]
const TARGET_RIGHT_NOUN = ["팀원", "동료", "후배", "누나", "언니", "오빠"]
const TARGET_RIGHT_COMPOUND = ["같은 팀", "우리 팀", "옆 부서", "같은 직급"]

const TARGET_LABEL = {
  left: "상급자/외부인",
  right: "동료/팀원",
} as const

function detectTarget(text: string): "left" | "right" {
  const leftIdx = lastNounRootIndex(text, TARGET_LEFT_NOUN)
  const rightIdx = Math.max(
    lastNounRootIndex(text, TARGET_RIGHT_NOUN),
    lastLiteralIndex(text, TARGET_RIGHT_COMPOUND),
  )
  if (leftIdx === -1 && rightIdx === -1) return "left" // 기본값: 좌
  return rightIdx > leftIdx ? "right" : "left"
}

// ---------------------------------------------------------------------------
// 축3 — 문서 유형 (단일 선택): 좌/우 동시 감지 시 문장에서 더 나중에 등장한
// 신호를 우선 채택한다.
// ---------------------------------------------------------------------------

const DOC_LEFT_NOUN = ["이메일", "메시지", "메신저", "카톡", "슬랙", "빠르게", "간단히"]
const DOC_LEFT_COMPOUND = ["한두 줄"]
const DOC_RIGHT_NOUN = ["회의록", "보고서", "기획서", "제안서", "문서", "형식", "체계", "상세", "첨부"]

const DOC_LABEL = {
  left: "간단한 형식(이메일/메신저)",
  right: "체계적 형식(회의록/보고서/기획서)",
} as const

function detectDocType(text: string): "left" | "right" {
  const leftIdx = Math.max(
    lastNounRootIndex(text, DOC_LEFT_NOUN),
    lastLiteralIndex(text, DOC_LEFT_COMPOUND),
  )
  const rightIdx = lastNounRootIndex(text, DOC_RIGHT_NOUN)
  if (leftIdx === -1 && rightIdx === -1) return "left" // 기본값: 좌
  return rightIdx > leftIdx ? "right" : "left"
}

export function generatePrompt(
  text: string,
  axes: Record<string, string>,
): string {
  // 축1(목적)은 중복 선택 축이라 좌/우가 동시에 참일 수 있다. 공유 타입의
  // axes는 Record<string, string>(축 하나당 값 하나)이라 두 개를 동시에 담을
  // 채널이 없다 — 수동 선택이 있으면 그 옵션 하나만 참으로 두고, 없으면
  // 자동 감지 결과(좌/우 동시 가능)를 그대로 쓴다.
  // TODO(schema-1): 축1처럼 중복 선택인 축의 수동 선택값을 axes:
  // Record<string,string>에 좌/우 모두 담아 전달하는 방법은 공유 계약에
  // 정의돼 있지 않다. UI가 다중 선택을 지원하게 되면 이 부분을 다시 봐야 한다.
  const manualPurpose = axes["purpose"]
  const purpose =
    manualPurpose === PURPOSE_LABEL.left
      ? { left: true, right: false }
      : manualPurpose === PURPOSE_LABEL.right
        ? { left: false, right: true }
        : detectPurpose(text)

  const manualTarget = axes["target"]
  const target: "left" | "right" =
    manualTarget === TARGET_LABEL.right
      ? "right"
      : manualTarget === TARGET_LABEL.left
        ? "left"
        : detectTarget(text)

  const manualDocType = axes["docType"]
  const docType: "left" | "right" =
    manualDocType === DOC_LABEL.right
      ? "right"
      : manualDocType === DOC_LABEL.left
        ? "left"
        : detectDocType(text)

  const purposeParts: string[] = []
  if (purpose.left) purposeParts.push(PURPOSE_LABEL.left)
  if (purpose.right) purposeParts.push(PURPOSE_LABEL.right)
  const purposeLabel = purposeParts.join(" + ") || PURPOSE_LABEL.left

  const targetLabel = TARGET_LABEL[target]
  const docLabel = DOC_LABEL[docType]

  // 고정 규칙: 대상이 좌(상급자/외부인)일 때 공손한 말투 지침을 반영한다.
  const politenessNote =
    target === "left"
      ? "\n• 공손한 말투: 상사나 고객에게 적합한 존댓말을 사용해 주세요."
      : ""
  const structureNote =
    docType === "right"
      ? "\n• 구조화된 형식(항목별 소제목, 번호 매기기 등)으로 체계적으로 정리해 주세요."
      : ""

  return `아래 내용을 "${purposeLabel}" 목적으로, ${targetLabel}을(를) 대상으로, ${docLabel}에 맞게 작성해 주세요.\n\n[작성 요청]\n${text}\n\n[작성 가이드]\n• 목적(${purposeLabel})에 맞게 핵심 내용을 명확히 전달해 주세요.\n• ${targetLabel} 대상에게 어울리는 어투와 표현을 사용해 주세요.${politenessNote}${structureNote}`
}
