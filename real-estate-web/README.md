# 부동산 인사이트 (웹)

모던한 UI/UX로 지역 검색, 거래 랭킹, 정책 뉴스를 제공하는 Next.js 앱.

## 실행
- Node.js 18+
- 설치: `npm install`
- 개발: `npm run dev`

## 구조
- `app/`: 페이지 및 API 라우트(App Router)
- `components/`: UI 컴포넌트
- `data/`: 샘플 데이터
- `lib/`: 유틸·랭킹 로직
- `public/`: 정적 자산
- `docs/API_KEYS.md`: 공공데이터/뉴스 키 발급 가이드

## 환경변수
- `.env.local` 예시
```
MOLIT_API_KEY=...
# 하나만 쓸 때
NEWS_RSS_URL=https://www.korea.kr/rss/policy.xml
# 여러 소스를 합칠 때(쉼표 또는 줄바꿈)
# NEWS_RSS_URLS=https://www.korea.kr/rss/policy.xml,https://news.google.com/rss/search?q=부동산+정책&hl=ko&gl=KR&ceid=KR:ko,https://news.search.naver.com/search.naver?where=rss&query=부동산%20정책
NEXT_PUBLIC_MAPBOX_TOKEN=...
NEXT_PUBLIC_BASE_URL=
```

## 배포 (Vercel)
- Vercel 계정 연결 → 새 프로젝트로 가져오기(Import)
- Root Directory: `real-estate-web` 선택 (모노레포일 경우)
- Environment Variables 설정
  - `MOLIT_API_KEY` (Server)
  - `NEWS_RSS_URL` 또는 `NEWS_RSS_URLS` (Server, 선택) — 다중 피드 병합 지원
  - `NEXT_PUBLIC_MAPBOX_TOKEN` (Client)
  - `NEXT_PUBLIC_BASE_URL` (선택, 보통 비움)
- 빌드 프레임워크: Next.js (자동 인식), 빌드 커맨드: `next build`
- 배포 후 확인: `/rankings`, `/search`, `/news`

### Vercel CLI (옵션)
```
npm i -g vercel
vercel login
vercel link
vercel env add MOLIT_API_KEY
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN
vercel env pull .env.local   # 로컬 동기화
vercel --prod
```

## 체크리스트
- 실거래가 API 키 설정됨 (MOLIT_API_KEY, 선택)
- `/api/hotspots` 응답 정상(미설정 시 샘플 폴백 동작)

## CI/CD (GitHub Actions)
- 워크플로우: `.github/workflows/web-ci.yml` (lint/typecheck/build)
- 배포: `.github/workflows/vercel-deploy.yml` (PR→Preview, main/master→Production)
- GitHub Secrets 필요:
  - `VERCEL_TOKEN`: Vercel Personal Token
  - `VERCEL_ORG_ID`: Vercel Organization ID
  - `VERCEL_PROJECT_ID`: Vercel Project ID
- 설정 방법: Vercel 프로젝트 대시보드 → Settings → General에서 ORG/PROJECT ID 확인, 토큰은 https://vercel.com/account/tokens 에서 생성 후 GitHub Secrets에 추가

## Contributing
- 코드 스타일/PR 규칙: 저장소 루트의 `AGENTS.md` 참고
- 이슈/PR 템플릿: `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md`
- 자동 라벨링: `.github/labeler.yml` (경로 기반)
- 자동 리뷰어: `CODEOWNERS` + `auto-assign` 워크플로우
- CODEOWNERS의 팀/사용자 핸들은 조직에 맞게 수정하세요.
