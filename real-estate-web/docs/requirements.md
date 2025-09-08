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
- 전월세 보기: 전월세 실거래(보증금/월세) 조회·표시(검색/상세), 매매와 전환 토글

## 향후 확장(후순위)
- 즐겨찾기/알림, SNS 공유, 다국어
- 지도 시각화 내장(현재는 외부 지도 링크 위주)
- 추천/트렌드 리포트

## 외부 연동
- 국토교통부 실거래가 OpenAPI(RTMS): 거래/핫스팟 산출에 활용
- 국토교통부 전월세 실거래가 OpenAPI: 보증금/월세 데이터 조회
- 뉴스 RSS/Atom: Korea.kr, Google 뉴스, 네이버 뉴스 등 병합·중복 제거

## 데이터 모델(요약)
- 거래: 지역코드, 기간, 거래량, 중위가격
- 전월세: 지역코드, 날짜, 보증금(만원), 월세(만원), 전용면적, 층, 건축년도, 주소
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
- /rankings 상세: 각 지역행 ‘보기’ 클릭 시 해당 월(또는 데이터 없는 경우 전월)의 상세 거래 20건을 표로 제공(단지명/층수/면적/가격/날짜/건축년도/주소)
- /api/*: 실패 시 200 + 폴백 데이터와 `x-source` 헤더 제공

## 제약/리스크
- 뉴스 피드 포맷 변경/차단(헤더·폴백·유지보수 필요)
- 공공데이터 API 한도/지연(캐시·스케줄링 고려)
- 지도 라이선스/요금(내장 지도 채택 시 재평가)

## API 계약서(초안)

### GET /api/transactions
- 목적: 특정 시군구(LAWD_CD)와 대상 월(DEAL_YMD)의 아파트 거래 이력을 정규화해 반환
- 쿼리 파라미터
  - `lawdCd`(string, 기본 `11500`): 시군구 법정동 코드 5자리
  - `dealYmd`(string, 기본 현재월 `YYYYMM`): 대상 월
  - `pageNo`(string, 기본 `1`): 외부 API 전달용 페이지 번호
  - `numOfRows`(string, 기본 `200`): 외부 API 전달용 행 수(최대치 권장)
- 응답(배열)
```
[
  {
    "regionCode": "11500",
    "name": "강서구 화곡동",
    "date": "2024-09-02",
    "price": 850.0,          // 단위: 만원
    "aptName": "○○아파트",
    "area": 84.97            // 전용면적
  },
  ...
]
```
- 헤더: `x-source: molit | mock | fallback-mock`
  - `molit`: 실시간 OpenAPI 응답을 정규화
  - `mock`: `MOLIT_API_KEY` 미설정으로 목 데이터 반환
  - `fallback-mock`: 외부 API 오류 시 목 데이터로 폴백
- 입력 검증/정규화
  - `lawdCd`: 숫자 5자리 아니면 기본값(`11500`)으로 대체, 경고 플래그(`x-params-warn`) 부착
  - `dealYmd`: `YYYYMM` 형식 아니면 현재월로 대체, 경고 플래그 부착
  - `pageNo`: 1 미만이면 1로 정규화
  - `numOfRows`: 1 미만→1, 2000 초과→2000으로 클램프
- 비고
  - 현재 MVP는 단일 월(`dealYmd`) 조회를 지원. 범위 조회(from/to)는 후속 작업에서 검토

### GET /api/leases
- 목적: 특정 시군구(LAWD_CD)와 대상 월(DEAL_YMD)의 아파트 전월세 실거래를 정규화해 반환
- 쿼리 파라미터
  - `lawdCd`(string, 기본 `11500`): 시군구 법정동 코드 5자리
  - `dealYmd`(string, 기본 현재월 `YYYYMM`): 대상 월
  - `pageNo`(string, 기본 `1`), `numOfRows`(string, 기본 `200`)
  - `strict`(boolean, 기본 `true` 권장): 키 없음/오류 시 빈 배열 반환(mock 금지)
- 응답(배열)
```
[
  {
    "regionCode": "11500",
    "name": "강서구 마곡동",
    "date": "2024-09-02",
    "deposit": 50000,         // 보증금(만원)
    "monthlyRent": 150,       // 월세(만원), 전세는 0
    "aptName": "○○아파트",
    "area": 84.97,
    "floor": 12,
    "buildYear": 2015,
    "jibun": "○○-○○",
    "roadAddress": "강서구 마곡중앙로 161-17"
  }
]
```
- 헤더: `x-source: molit | none | none-error`
- 비고: UI에서 매매/전월세 전환 시 표시 컬럼이 자연스럽게 바뀌도록 네이밍 유지

### GET /api/hotspots
- 목적: 전월 대비 거래량·중위가격 변화율로 핫스팟 지수를 계산해 반환
- 쿼리 파라미터
  - `lawdCd`(string, 기본 `11500`): 시군구 법정동 코드 5자리
  - `yyyymm`(string, 기본 현재월): 기준 월(전월은 자동 계산)
  - `wCnt`(number, 기본 `0.6`): 거래량 변화율 가중치
  - `wMed`(number, 기본 `0.4`): 중위가격 변화율 가중치
  - `clampLow`(number, 기본 `-1`), `clampHigh`(number, 기본 `1`): 변화율 윈저라이즈 한계
  - `minScore`(number, 기본 `0`), `minCount`(number, 기본 `0`): 필터 임계값
- 응답(JSON)
```
{
  "yyyymm": "2024-09",
  "previous": "2024-08",
  "lawdCd": "11500",
  "source": "molit | partial-molit | mock",
  "weights": { "count": 0.6, "median": 0.4 },
  "clamp": { "low": -1, "high": 1 },
  "hotspots": [
    {
      "name": "마곡동",
      "lat": 37.56,
      "lng": 126.83,
      "img": "...",
      "regionCode": "11500",
      "currentCount": 12,
      "previousCount": 7,
      "currentMedianPrice": 900,
      "previousMedianPrice": 850,
      "momCount": 0.42,           // 거래량 전월대비
      "momMedianPrice": 0.06,     // 중위가 전월대비
      "score": 78                 // 0..100 정규화 점수
    }
  ]
}
```
- 비고
  - `source = partial-molit`은 현재월/전월 중 하나만 실시간 API로 채워졌음을 의미
