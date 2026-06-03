# Progress

프로젝트 진행 현황 로그. 커밋 직전 갱신한다 (`rules/common/git.md` 규칙).

## 2026-06-03

- **템플릿 셋업** (`/setup-from-template`): 미사용 언어 룰(python/typescript) import·섹션 제거, 상단 seed 주석 제거, `docs/template/`·`rules/languages/` 삭제. @import 12개 검증 OK.
- **Keycloak 로컬 개발 배포 설계 확정**: Docker Compose 2-서비스(keycloak `start-dev` + postgres, named volume 영속), realm 빈 상태 시작·수동 구성, secret은 `.env` 주입. spec: `docs/superpowers/specs/2026-06-03-keycloak-docker-local-dev-design.md`. WHY: 로컬에서 앱 OIDC 연동을 운영과 동일 DB로 재현 가능하게 하기 위함.
