# OpenAPI 키 발급 및 설정 가이드

본 서비스는 국토교통부 실거래가(OpenAPI)와 뉴스 RSS를 사용합니다.

## 1) 국토교통부 실거래가 OpenAPI
- 발급처: https://www.data.go.kr
- 검색어: "국토교통부_아파트매매 실거래 상세 자료" (RTMS)
- 절차: 회원가입 → 활용신청 → 승인 후 마이페이지에서 서비스키(ServiceKey) 확인

### 주요 파라미터
- `LAWD_CD`: 법정동 코드(시군구 5자리)
- `DEAL_YMD`: 조회년월(YYYYMM)
- `pageNo`, `numOfRows`: 페이지/행수

### Next.js 환경변수 설정
- `.env.local` 파일 생성 후 아래 추가:
```
MOLIT_API_KEY=발급받은_서비스키
```
- 서버 라우트에서 `process.env.MOLIT_API_KEY` 사용 (클라이언트에 노출 금지)

## 2) 정책 뉴스 RSS
- 예시 소스: 국토부 보도자료 RSS, 네이버 뉴스(검색 RSS), 구글 뉴스(검색 RSS)
- `.env.local` 예시:
```
# 하나만 사용할 경우
NEWS_RSS_URL=https://www.korea.kr/rss/policy.xml

# 여러 소스를 합쳐서 사용할 경우(쉼표 또는 줄바꿈)
NEWS_RSS_URLS=https://www.korea.kr/rss/policy.xml,https://news.google.com/rss/search?q=부동산+정책&hl=ko&gl=KR&ceid=KR:ko,https://news.search.naver.com/search.naver?where=rss&query=부동산%20정책
```
> 서버는 RSS와 Atom 형식을 모두 자동 파싱합니다. 일부 피드는 User-Agent/Accept 헤더가 없으면 차단할 수 있으므로 서버에서 적절한 헤더를 추가해 호출합니다.

## 3) 로컬에서 테스트
- `npm install`
- `npm run dev`
- 브라우저에서 http://localhost:3000 접속

## 참고
- 서비스키는 URL 인코딩 주의가 필요합니다. 서버에서 프록시 호출로 안전하게 처리하세요.

<!-- 지도 서비스는 제거되었습니다. 필요 시 외부 지도(네이버맵 등)로 링크만 제공합니다. -->
