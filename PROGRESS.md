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
