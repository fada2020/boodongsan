# 부동산 인사이트 – 계획서

## 마일스톤/일정(초안)
- M1 기초 뼈대(1주): 라우팅/레이아웃/네비게이션, 공통 UI, 스타일
- M2 데이터 연동(1–2주): RTMS 게이트웨이, 랭킹/핫스팟 계산
- M3 정책 뉴스(완료): 다중 피드 병합, 소스 탭·키워드·페이지 URL 동기화
- M4 품질/문서/배포(1주): 테스트, README/Docs, Vercel 파이프라인
- M5 성능/관측(1주): 캐싱 전략, 에러 핸들링, 로깅/모니터링
- M6 전월세 통합(1주): 전월세 API 라우트(/api/leases), 검색/상세/토글 UI, 테스트/문서

## 작업 분류(WBS)
- 앱 레이아웃/네비게이션, 공통 컴포넌트
- /search: 폼, 결과 리스트, 로딩/빈상태
- /rankings: 기간/지역 필터, 정렬, 표/카드 뷰
- /api/transactions, /api/hotspots: 파라미터 검증, 포맷 통일, 폴백 데이터
- /api/news: 병렬 fetch/파싱/중복 제거/정렬, q/src/page 처리, 타임아웃·헤더
- /api/leases: 전월세 실거래 라우트(정규화, strict 모드), 입력 검증, 응답 스키마 문서화
- 문서화: API_KEYS, README, .env.example, requirements/plan
- CI/CD: GitHub Actions(lint/typecheck/build), Vercel 설정
- 관측: 에러 리포팅/로그, 성능 계측

## 아키텍처/설계
- 프론트: App Router 기반 서버 컴포넌트 우선, 상호작용(UI 필터/탭/페이지)은 클라이언트 컴포넌트로 분리
- 백엔드: Route Handlers로 외부 API 프록시·전처리, 폴백 데이터 제공, 캐시 정책은 라우트별 최적화
- 모듈: 뉴스 피드 병합기, 랭킹 계산 유틸, 공통 HTTP 유틸

## 기술 스택
- Next.js(App Router), TypeScript, Tailwind CSS
- 테스트(제안): Jest/Testing Library(컴포넌트), Vitest(유틸)
- 배포: Vercel(Preview/Prod), GitHub Actions

## 개발 프로세스
- 브랜치: feature/fix 단위, PR 기반 협업
- 커밋 규칙: Conventional Commits
- 품질 게이트: lint/typecheck/build/test 통과 필수

## 품질/테스트 전략
- 단위: RSS/Atom 파서, 랭킹/핫스팟 유틸 함수
- 통합: API 라우트 성공/에러/타임아웃 케이스
- UI: 주요 컴포넌트 스냅샷·상호작용, 빈 상태/로딩 표시
- 성능: Lighthouse·CWV 측정, 느린 외부 API 구간 캐시/ISR 평가

## 성능/캐시 전략(초안)
- 뉴스: 동적 처리(force-dynamic), 외부 피드 정책 고려해 서버 캐시 비활성화 유지(필요 시 짧은 TTL 검토)
- 거래/랭킹: 파라미터 고정 구간은 ISR/캐시, 자주 변하는 범위는 서버 동적 처리

## 운영/모니터링
- 에러/성능 모니터링 도입(Sentry/Logtail 등)
- API 실패율·응답시간 대시보드 운영
- 피드 파싱 실패율 임계 기반 알림

## 롤백/리스크 대응
- Vercel 프리뷰/롤백 활용, 기능 플래그로 점진적 배포
- 뉴스/랭킹 폴백 경로 상시 유효

## 로드맵(후속)
- 고급 필터(가격대/면적/유형), 북마크/알림
- 지도 시각화 내장 및 히트맵
- 추천/트렌드 리포트, 이메일/웹푸시 구독
