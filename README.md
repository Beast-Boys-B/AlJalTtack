# 알잘딱 (AlJalTtack)

AI에게 프롬프트를 어떻게 써야 할지 막막한 비전공자·고령자를 위한 프롬프트 작성 도우미. 자연어로 편하게 쓴 문장을 카테고리별 규칙에 따라 분석해서, 바로 복사해 쓸 수 있는 정제된 프롬프트로 바꿔준다.

**🔗 배포 주소**: https://proto-design-psi.vercel.app

## 무엇을 하는 앱인가

로그인 없이, 세션 안에서만 동작하는 2단계 화면(+랜딩/라이브러리)으로 구성된다.

1. **시작** — 자연어로 하고 싶은 말을 쓰고 카테고리 5개 중 하나를 고른다.
2. **비교·조정·완료** — 입력한 문장에서 자동으로 감지된 축(옵션)들을 확인·수정하면서, 오른쪽에서 실시간으로 조정되는 정제 프롬프트를 보고 그대로 복사한다.

지원하는 5개 카테고리: **의료질문 · 여행계획 · 개인상담 · 작성(이메일/보고서 등) · AI사진생성**. 각 카테고리마다 전용 "축"(목적, 대상, 스타일 등)이 있고, 입력 문장 안의 키워드를 규칙 기반으로 감지해 자동으로 채워준다.

## 기술 스택

- **프론트엔드**: React 19 + Vite 8 + TypeScript, Tailwind CSS v4
- **백엔드**: Vercel 서버리스 함수(`/api`)
- **데이터베이스**: Neon Postgres (서버리스)
- **배포**: Vercel — `main` 브랜치에 푸시하면 자동 배포

## 프로젝트 구조

```
src/
  App.tsx                 # 최상위 라우팅(랜딩→시작→비교→라이브러리)
  theme.ts                # 공유 디자인 토큰(LIME/INK/IVORY 등)
  categories/              # 카테고리별 축 감지·프롬프트 조립 로직
    types.ts               #   5개 카테고리가 공유하는 유일한 계약
    index.ts               #   카테고리 dispatcher(detectCategoryAxes 등)
    medical.ts              #   의료질문
    travel.ts                #   여행계획
    counseling.ts             #   개인상담
    writing.ts                 #   작성
    photo.ts                    #   AI사진생성
  pages/                   # 화면 단위 컴포넌트(Landing/Start/Compare/Library)
  components/              # 공용 UI 조각(헤더바, 애니메이션 데모 등)
  lib/                     # 공용 유틸(사운드, 하이라이트 렌더링)
api/
  feedback.ts              # POST — 페이지2 👍/👎 만족도 저장
  survey.ts                # POST — 재조정 3회 누적 시 뜨는 객관식 설문 저장
prd/
  <카테고리>.md             # 카테고리별 축·키워드 사전 정본(스키마)
```

## 로컬에서 실행하기

```bash
npm install
npm run dev       # http://localhost:5173
```

백엔드(`/api/*`)까지 로컬에서 살려서 테스트하려면 Vercel CLI로 프로젝트를 링크하고 환경변수를 받아와야 한다:

```bash
npx vercel link
npx vercel env pull .env.development.local
```

`DATABASE_URL`(Neon Postgres 연결 문자열)이 있어야 `/api/feedback`, `/api/survey`가 동작한다.

```bash
npm run build      # 프로덕션 빌드
npx tsc --noEmit    # 타입 체크만
```

## 여러 명이 같이 작업하기

이 리포는 팀원 4명이 각자 다른 카테고리 로직을 동시에(vibe-coding으로) 작업한다. 충돌을 줄이기 위한 규칙:

- **자기 카테고리 파일만 수정한다.** 다른 카테고리 파일이나 `categories/types.ts`, `categories/index.ts`, `App.tsx` 같은 공유 파일은 건드리지 않는다 — 필요하면 먼저 팀에 알린다.
- **`prd/<카테고리>.md`가 정본이다.** 코드와 스키마가 다르면 코드를 스키마에 맞춘다.
- 자세한 규칙은 [`AGENTS.md`](./AGENTS.md), 자동화된 경계 검사는 `.claude/agents/category-engine.md` 참고.

**카테고리 담당**

| 카테고리 | 담당 | 파일 |
|---|---|---|
| 의료질문 | 우석민 | `src/categories/medical.ts` |
| 여행계획 | 김동윤 | `src/categories/travel.ts` |
| 개인상담 | 이재성 | `src/categories/counseling.ts` |
| 작성 · AI사진생성 | 조연익 | `src/categories/writing.ts`, `src/categories/photo.ts` |

## 기여하기

- 이슈: 버그 리포트 / 오탐·미탐 신고 / 기획-코드 불일치 / 팀 결정 요청 / 디자인 피드백 / 카테고리 스키마 작성 — [`.github/ISSUE_TEMPLATE`](./.github/ISSUE_TEMPLATE)에서 상황에 맞는 템플릿을 골라 쓴다.
- PR을 올릴 땐 [PR 템플릿](./.github/pull_request_template.md)의 체크리스트(다른 카테고리와 충돌 없는지 등)를 확인한다.
- 브랜치는 `main`에서 갈라져 나온 자기 이름/카테고리 브랜치를 쓰고, 푸시 전 `npx tsc --noEmit`으로 빌드 확인.

## 기획 문서

전체 요구사항·정책·기능 정의는 별도 리포 [`planning-document`](https://github.com/Beast-Boys-B/planning-document)의 `docs/` 아래에 있다. 카테고리별 축·키워드 정의(스키마)만 이 리포의 `prd/`로 복사해 정본으로 쓴다.
