## Project — Keycloak Docker 배포 + 커스텀 로그인 테마

Keycloak(26.x)을 Docker Compose로 띄우고(`demo` realm), `themes/custom/login` Apple 스타일 로그인 테마를 입힌 프로젝트. 실서버 적용 대상은 별도 ai-portal Keycloak(이 레포를 서브폴더로 clone 후 테마만 bind-mount — `docs/apply-theme-existing-keycloak.md`).

**핵심 명령**
- 기동: `docker compose up -d` (헬스: `curl http://localhost:9000/health/ready`) / 접속: `http://localhost:8080` (서버는 `KEYCLOAK_HTTP_PORT`, 예: 6502)
- 테마: `./themes:/opt/keycloak/themes` bind-mount. `start-dev`라 테마 캐시 off → 파일 수정은 **새로고침만**, 새 파일 추가 시 `docker compose restart keycloak`
- realm 적용: `kcadm.sh update realms/demo -s loginTheme=custom`
- 쇼케이스 이미지: PNG를 `themes/custom/login/resources/img/services/`에 넣고 `bash themes/custom/login/gen-services.sh`

**검증**: 단위 테스트 하니스 없음(CSS·FTL·JS·compose). `docker compose`/`curl` 실행 결과와 Chrome headless 스크린샷으로 **런타임/시각 확인**한다. (testing.md의 "테스트 케이스 필수"는 비적용 — guidelines.md "테스트 하니스 없으면 수동 검증 명시" 조항을 따른다.)

**문서**: `README.md`(구성·서버 배포), `docs/server-commands.md`(운영 명령), `docs/showcase-images.md`(PNG 등록), `docs/apply-theme-existing-keycloak.md`(기존 Keycloak 적용), `docs/showcase-image-prompt.md`(이미지 톤 통일), `docs/design-rules.md`(디자인 규칙).

---

## Working Style — 최우선 (모든 룰보다 먼저)

**모든 작업의 행동 기반.** 아래 도메인 룰과 충돌해도 이 가이드의 원칙이 우선한다.

@rules/guidelines.md

---

## Rules — 범용 (유지)

@rules/common/comments.md
@rules/common/naming.md
@rules/common/git.md
@rules/common/security.md
@rules/common/error-handling.md
@rules/common/dependencies.md
@rules/common/documentation.md
@rules/common/testing.md

## Rules — 백엔드/Docker

Docker Compose 배포·테마 컨테이너 전제 규칙. (이 프로젝트는 공식 Keycloak 이미지를 쓰고 커스텀 Dockerfile·패키지 의존성은 없으므로, docker.md의 Dockerfile/빌드 규칙과 dependencies.md는 해당 시에만 적용.)

@rules/backend/config.md
@rules/backend/docker.md
@rules/backend/sync-checklist.md
