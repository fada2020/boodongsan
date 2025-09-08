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

설명
- `MOLIT_API_KEY`: 국토부 실거래가 OpenAPI 키(매매/전월세 공통). 키가 없거나 오류일 경우 strict 모드에서는 빈 배열을 반환합니다.

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
  - `/rankings`: 지역(검색), 월/정렬 설정, 동별 순위 + 상세 보기(단지명/층수/면적/실거래가/날짜/건축년도/주소)
  - `/search`: 지역 선택 후 동별 요약표 + 상세 거래(필터/정렬)
  - 전월세: `/search` 상단 “거래 유형” → 전월세로 전환. `/rankings?mode=lease`로 전월세 랭킹 모드 확인.

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

## 전월세(Leases) 사용법
- API 라우트: `GET /api/leases?lawdCd=11680&dealYmd=202409&strict=1`
  - 쿼리: `lawdCd`(5자리), `dealYmd`(YYYYMM), `pageNo`, `numOfRows`, `strict`(권장: 1)
  - 응답 예: `[ { deposit, monthlyRent, aptName, area, floor, buildYear, jibun, roadAddress, date, name, regionCode } ]`
  - 헤더: `x-source: molit | none | none-error`
- UI
  - `/search`: 상단 “거래 유형” 토글(매매/전월세), 상세 표 컬럼 자동 전환(보증금/월세)
  - `/rankings`: `mode=lease`로 전월세 모드. 평균가/실거래가 라벨이 보증금/월세 중심으로 전환

## FAQ
- Q: 상세 거래가 비어있어요. 버그인가요?
  - A: strict 모드(`strict=1`)에서는 선택 월에 데이터가 없거나 키 오류 시 빈 배열을 반환합니다(거짓 데이터 사용 금지). 월을 바꾸거나 키/쿼리를 확인해 주세요.
- Q: 전월세 총액이 억/만으로 보이는 이유는?
  - A: 가독성을 위해 억/만 단위를 혼용합니다. 셀 툴팁/CSV에는 만원 단위 정수가 포함됩니다.

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
