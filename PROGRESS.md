# Progress

프로젝트 진행 현황 로그. 커밋 직전 갱신한다 (`rules/common/git.md` 규칙).

## 2026-06-03

- **템플릿 셋업** (`/setup-from-template`): 미사용 언어 룰(python/typescript) import·섹션 제거, 상단 seed 주석 제거, `docs/template/`·`rules/languages/` 삭제. @import 12개 검증 OK.
- **Keycloak 로컬 개발 배포 설계 확정**: Docker Compose 2-서비스(keycloak `start-dev` + postgres, named volume 영속), realm 빈 상태 시작·수동 구성, secret은 `.env` 주입. spec: `docs/superpowers/specs/2026-06-03-keycloak-docker-local-dev-design.md`. WHY: 로컬에서 앱 OIDC 연동을 운영과 동일 DB로 재현 가능하게 하기 위함.
- **구현 플랜 작성**: 6-task 플랜(env.example → .env → compose → 기동·로그인 검증 → 영속 검증 → 기록). plan: `docs/superpowers/plans/2026-06-03-keycloak-docker-local-dev.md`.
- **구현 시작**: `.env.example` 추가 (이미지 핀·관리자·DB 자격 키 정의). secret 실값은 `.env`(미커밋)로 주입.
- **compose 추가**: `docker-compose.yml` — postgres(healthcheck·volume) + keycloak(start-dev, depends_on healthy, 8080/9000). `docker compose config` 통과.
- **런타임 검증 완료**: `up -d` → postgres healthy / keycloak running, `/health/ready` UP, master realm 토큰 발급(관리자 로그인) OK, realm 생성→`restart keycloak`→잔존(200) 으로 영속 검증. 테스트 realm 정리(204).
- **README 작성**: 플레이스홀더 1줄 → 전체 문서(구성표·빠른 시작·환경 변수표·명령어·헬스 체크) 로 교체.
- **SSO 동작 GUI 검증**: `demo` realm + 테스트 사용자 생성, OIDC client 2개(`site1` localhost:3000 / `site2` localhost:3001, public·standard flow) 등록. site1 로그인 → site2 자동 로그인(SSO) 및 site1 로그아웃 → site2 세션 종료(Single Logout) 확인. WHY: 단일 realm으로 다중 앱 세션 공유가 실제로 동작하는지 로컬에서 확인하기 위함.
- **커스텀 로그인 테마 추가**: compose `keycloak` 서비스에 `./themes:/opt/keycloak/themes` 볼륨 마운트(다른 서비스/설정 불변). `themes/custom/login` 테마 생성 — `parent=keycloak.v2`, `styles=css/styles.css css/custom.css`(v2 베이스 스타일 유지 위에 Apple 스타일 오버라이드), v2 `login.ftl`/`template.ftl` 사본(검증 마커 + `apple-login` body 클래스), `custom.css`는 `docs/superpowers/apple.md` 토큰(Action Blue·SF Pro·pill CTA) 구현. `demo` realm `loginTheme=custom` 설정(kcadm). 검증: site1 로그인 폼 HTML에 `apple-login` body·마커·`styles.css`→`custom.css` 순서 확인, 테마 CSS 200 서빙. WHY: 내장 jar 테마 불변 유지하며 호스트 오버라이드로 로그인 화면 브랜딩.
- **로그인 테마 세부 조정**: `AI-portal/src/app/admin/login/page.tsx`(+ tailwind.config·apple.css) 기준으로 `custom.css` 재작성 — 카드 제거(맨 surface-alt 배경·max-w 384px), 입력 pill·h44·focus 테두리만 accent, 중앙 display-md(34px) 타이틀, fade-up 스태거 진입(ease-spring), eye 토글 ghost 버튼. Chrome headless 스크린샷으로 시각 검증.
- **연결 서비스 쇼케이스 스택 추가**: 로그인 화면을 2-컬럼으로(좌 폼 불변 + 우 쇼케이스). 우측에 브라우저 창 모양 카드를 겹쳐 쌓고 `showcase.js`가 `manifest.json`을 fetch해 렌더 후 3.5s 간격 맨 위 카드를 뒤로 보내는 오토 로테이션. `gen-services.sh`가 `resources/img/services/*.png`를 스캔해 파일명→창 타이틀 매핑으로 `manifest.json` 자동 생성(PNG 추가/삭제 후 재실행만 하면 카드 증감). 목업 PNG 4종은 headless Chrome 렌더로 생성(Python 의존성 0). 검증: 리소스 200 서빙, 좌 폼+우 스택 스크린샷, 회전 동작, 4↔5 증감, ≤900px 우측 패널 숨김. WHY: 어떤 서비스들이 이 SSO로 연결되는지 로그인 시점에 시각적으로 보여주기 위함.
