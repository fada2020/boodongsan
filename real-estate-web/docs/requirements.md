# 부동산 인사이트 – 요건정의서

## 개요
- 프로젝트명: 부동산 인사이트 (웹, Next.js)
- 목표: 지역 검색·거래 랭킹·핫스팟·정책 뉴스를 한 곳에서 제공해 빠른 의사결정을 돕는다.
- 대상: 실수요자/투자자, 중개인, 정책·시장 동향 관심자

## 핵심 지표(KPI)
- 검색 전환율, 뉴스 체류시간, 재방문률, 95p 로딩 시간, API 성공률

## 기능 범위(MVP)
- 지역 검색(/search): 시군구/동 단위 검색, 기본 지표 노출
- 거래 랭킹(/rankings): 기간/지역 필터, 거래량·중위가격 랭킹
- 핫스팟(/hotspots 또는 랭킹 내 포함): 거래 급증 구간 리스트(지도 링크 옵션)
- 정책 뉴스(/news): 다중 RSS/Atom 병합, 키워드·소스 필터, 페이지네이션, URL 쿼리 동기화(q, src, page)

## 향후 확장(후순위)
- 즐겨찾기/알림, SNS 공유, 다국어
- 지도 시각화 내장(현재는 외부 지도 링크 위주)
- 추천/트렌드 리포트

## 외부 연동
- 국토교통부 실거래가 OpenAPI(RTMS): 거래/핫스팟 산출에 활용
- 뉴스 RSS/Atom: Korea.kr, Google 뉴스, 네이버 뉴스 등 병합·중복 제거

## 데이터 모델(요약)
- 거래: 지역코드, 기간, 거래량, 중위가격
- 뉴스: title, link, pubDate, source
- 파싱: RSS/Atom 자동 판별, UA/Accept 헤더 부착, 10초 타임아웃

## 비기능 요구사항
- 성능: TTFB < 500ms(캐시 가능한 구간), LCP < 2.5s(데스크탑)
- 안정성: 외부 API 실패 시 폴백·재시도, 로그/모니터링
- 보안: 키는 서버 환경변수에서 관리, 클라이언트 노출 금지
- 접근성/SEO: 시맨틱 마크업, 메타/OG 구성, App Router 메타데이터 활용

## 기술/환경
- Next.js(App Router) + TypeScript + Tailwind CSS
- Node.js 18+, Vercel 배포(Preview/Prod)
- 환경변수: MOLIT_API_KEY, NEWS_RSS_URLS(또는 NEWS_RSS_URL), NEXT_PUBLIC_BASE_URL(옵션), NEXT_PUBLIC_MAPBOX_TOKEN(옵션)

## 수용 기준(Acceptance Criteria)
- /news: `NEWS_RSS_URLS`에 3개 피드 설정 시 병합 결과 최신순 최대 60건, q/src/page 쿼리 동기화, 빈 결과 시 안내 노출
- /rankings: 기간·지역 필터에 따른 정렬 정확, 빈 데이터 시 안내
- /api/*: 실패 시 200 + 폴백 데이터와 `x-source` 헤더 제공

## 제약/리스크
- 뉴스 피드 포맷 변경/차단(헤더·폴백·유지보수 필요)
- 공공데이터 API 한도/지연(캐시·스케줄링 고려)
- 지도 라이선스/요금(내장 지도 채택 시 재평가)

