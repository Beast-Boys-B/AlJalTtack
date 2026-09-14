// AI사진생성 — 담당 조연익
// draft/schemas/AI사진생성.md 가 정본이다. 축 정의·키워드·태그 조립 로직을
// 여기에 구현한다. 이 파일 밖(다른 카테고리 파일, App.tsx, types.ts)은
// 건드리지 않는다.

import type { Category, FixedRule } from "./types"

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
      id: "style",
      label: "화풍",
      options: ["사실적인", "애니메이션", "수채화", "디지털 아트"],
    },
    {
      id: "mood",
      label: "분위기",
      options: ["밝고 따뜻한", "차갑고 모던한", "몽환적인", "드라마틱한"],
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

export const fixedRules: FixedRule[] = [
  {
    label: "상업용",
    message: "생성된 이미지는 상업적 이용 전 해당 AI 서비스의 이용 약관과 저작권 정책을 확인하세요.",
  },
  {
    label: "인물",
    message: "더 정확한 결과를 위해 인물의 나이대, 성별, 표정, 스타일을 함께 적어주시면 좋아요.",
  },
]

// TODO(조연익): draft/schemas/AI사진생성.md 기준 축1(스타일)·축2(피사체)·
// 축3(구도) 자동 감지 로직 + 태그 조립(항상 3개, 순서 고정)으로 교체. 지금은
// 수동 선택값(axes 인자)을 영문 태그로 매핑하는 자리표시자 구현이다.
export function generatePrompt(
  text: string,
  axes: Record<string, string>,
): string {
  const s = axes["style"] || "사실적인"
  const m = axes["mood"] || "밝고 따뜻한"
  const sk =
    s === "사실적인"
      ? "photorealistic, ultra-detailed, RAW photo, 8K resolution"
      : s === "애니메이션"
        ? "anime style, vibrant colors, Studio Ghibli inspired"
        : s === "수채화"
          ? "watercolor painting, soft brush strokes, artistic medium"
          : "digital art, concept art, trending on ArtStation, intricate details"
  const mk =
    m === "밝고 따뜻한"
      ? "warm golden lighting, cheerful atmosphere, soft sunlight, uplifting"
      : m === "차갑고 모던한"
        ? "cool tones, minimalist, contemporary aesthetic, blue hour"
        : m === "몽환적인"
          ? "dreamy, ethereal, soft bokeh, magical atmosphere, misty"
          : "dramatic lighting, cinematic, high contrast, epic scale, powerful"
  return `${text}\n\n${sk}, ${mk}, professional composition, sharp focus, masterpiece quality, highly detailed\n\n[추가 품질 태그]\nbest quality, 4k, intricate details, perfect lighting, award-winning`
}
