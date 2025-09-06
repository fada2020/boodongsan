# Task Board (부동산 인사이트)

> 이 문서는 우리가 진행할 작업의 단일 출처입니다. 번호는 대분류-세부작업 형식(예: 1-3)으로 관리합니다. 각 Task 착수 전 반드시 승인 요청합니다. 요구사항/계획 변경 시 `real-estate-web/docs/requirements.md`, `real-estate-web/docs/plan.md`도 함께 갱신합니다.

연관 문서: `real-estate-web/docs/requirements.md`, `real-estate-web/docs/plan.md`

## 1. 정책 뉴스(/news)

### 1-1. RSS/Atom 파서 단위 테스트 추가
- 목적: 다중 피드 포맷 변화에도 안정적으로 동작하는지 보장합니다.
- 작업
  - RSS 케이스(아이템, pubDate, link 포함) 샘플 고정(fixture) 추가
  - Atom 케이스(ENTRY, link href, updated) 샘플 고정 추가
  - 파서 함수에 대한 성공/빈결과/이상 XML 케이스 테스트
- 완료 기준
  - `npm test`에서 파서 테스트 모두 통과
  - XML 변경에 취약한 정규식 부분이 케이스로 커버됨
- 참고 파일: `real-estate-web/app/api/news/route.ts`

### 1-2. 소스 탭/검색 입력 접근성 보강
- 목적: 키보드 네비게이션/스크린리더 친화적 UI 제공
- 작업
  - 탭 버튼에 `aria-pressed`, 역할(role="tablist"/"tab") 적용
  - 입력에 `aria-label`/`id`와 label 연결
  - 포커스 스타일 명확화(테일윈드 ring 활용)
- 완료 기준
  - 키보드만으로 탭 전환/검색 입력이 자연스럽게 가능
  - Lighthouse 접근성 90점 이상(해당 화면)
- 참고 파일: `real-estate-web/components/NewsList.tsx`

### 1-3. 빈 상태/오류 메시지 세분화
- 목적: 왜 목록이 비었는지 사용자에게 명확히 안내
- 작업
  - 서버 헤더 `x-source` 값을 클라이언트에서 읽어 빈 상태 메시지에 출처 표기(예: fallback-empty-parse)
  - 네트워크 실패/파싱 실패/필터 결과 없음 을 구분 표시
- 완료 기준
  - 세 가지 케이스가 재현 가능하고 각기 다른 메시지 노출
- 참고 파일: `real-estate-web/app/api/news/route.ts`, `real-estate-web/components/NewsList.tsx`

## 2. 거래 랭킹(/rankings)

### 2-1. API 계약서 정리 및 샘플 응답 정의
- 목적: 프론트/백엔드 간 파라미터/응답 스키마 확정
- 작업
  - 요청 파라미터: 기간(YYYYMM 범위), 지역코드(LAWD_CD), 정렬키(거래량/중위가)
  - 응답 형태: [{ regionName, lawdCd, volume, medianPrice, period }]
  - 문서에 예시 쿼리와 예시 JSON 추가
- 완료 기준
  - 계약서 초안이 `docs/requirements.md` 부록 또는 별도 섹션에 반영
- 참고 파일: `real-estate-web/app/api/transactions/route.ts`, `real-estate-web/docs/requirements.md`

### 2-2. /api/transactions 파라미터 검증/폴백 강화
- 목적: 잘못된 입력/외부 API 실패에도 예측 가능한 응답
- 작업
  - Zod(또는 수기 검증)로 쿼리 파라미터 검증 추가
  - 외부 API 실패 시 샘플 폴백 + `x-source` 헤더 명시
- 완료 기준
  - 정상/미입력/이상 입력/외부 오류 각각 200 응답과 일관된 JSON 스키마 유지
- 참고 파일: `real-estate-web/app/api/transactions/route.ts`

### 2-3. 랭킹 화면 UI 1차 구현(필터+리스트)
- 목적: 기간/지역 필터와 정렬에 따른 리스트 표시
- 작업
  - 기간 선택(최근 n개월/직접 입력), 지역코드 입력 또는 선택 UI
  - 정렬 토글(거래량/중위가)
  - 로딩/빈 상태/에러 상태 표시
- 완료 기준
  - 기본 플로우에서 요청→응답→리스트 표시가 가능
- 참고 파일: `real-estate-web/app/rankings/*`(신규 생성), `real-estate-web/components/*`

## 3. 지역 검색(/search)

### 3-1. 검색 폼 UX 보완 및 결과 정렬
- 목적: 사용자가 빠르게 원하는 지역을 찾고 비교
- 작업
  - 자동완성(간단 매칭) 또는 플레이스홀더/예시 추가
  - 결과 정렬 기준(거래량/중위가/최근거래일) 드롭다운
- 완료 기준
  - 입력→검색→정렬 변경이 지연 없이 동작
- 참고 파일: `real-estate-web/app/search/*`

### 3-2. 빈 상태/가이드 콘텐츠 추가
- 목적: 신규 사용자 온보딩 개선
- 작업
  - 검색 전 상태에 예시 쿼리/도움말 노출
  - 결과 없음 시 제안 키워드/지역 예시 제시
- 완료 기준
  - 사용자 테스트에서 ‘무엇을 해야 할지’ 혼란이 줄어듦

## 4. 품질/문서/배포

### 4-1. 테스트 스캐폴딩 및 스크립트 추가
- 목적: 커버리지 확보 기반 마련
- 작업
  - Jest/Testing Library 초기 설정, `npm test` 스크립트 추가
  - CI에서 `npm run test` 단계 포함
- 완료 기준
  - 로컬/CI 모두 테스트 실행 가능, 최소 1개 테스트 포함

### 4-2. CI 파이프라인 정비
- 목적: 일관된 품질 게이트 확보
- 작업
  - GitHub Actions 워크플로우에 lint/typecheck/build/test 단계 구성
  - 캐시(Cache) 최적화로 실행 시간 단축
- 완료 기준
  - PR 생성 시 파이프라인 자동 실행 및 통과 필수

### 4-3. 문서 최신화 및 예시 강화
- 목적: 합류한 주니어도 30분 내 로컬 구동 가능
- 작업
  - README에 빠른 시작/문제해결(FAQ) 추가
  - API_KEYS에 다중 피드 설정 예시 보강(완료 사항 재점검)
- 완료 기준
  - 신규 환경에서 README만 보고 무리 없이 dev 서버 구동

## 5. 운영/모니터링(선택)

### 5-1. 서버 로그/에러 리포팅 훅 추가
- 목적: 배포 환경 문제를 빠르게 파악
- 작업
  - 간단한 로깅 유틸과 에러 경계 처리
- 완료 기준
  - 주요 API 실패율/오류 스택을 확인할 수 있는 경로 마련

---

승인 프로세스
- 각 Task 착수 전, 이 문서의 해당 항목(예: 1-2)에 대해 “시작해도 될까요?”라고 요청합니다.
- 승인 후 작업 진행 → PR/변경 요약 공유 → 이 문서에 상태(예: 진행 중/완료)와 링크를 업데이트합니다.

표기 제안(선택)
- [대기] / [진행] / [완료] 토글을 각 항목 앞에 붙여 상태 관리
- 작업 링크: PR 번호, 커밋, 배포 URL을 항목 하단에 나열
