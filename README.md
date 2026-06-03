# Keycloak — 로컬 개발 Docker 배포

로컬 개발/테스트용 Keycloak을 Docker Compose로 띄우는 저장소. Postgres를 동반(named volume 영속)하고 `start-dev` 모드로 동작하며, realm/client는 관리 콘솔에서 직접 구성한다. 앱의 OIDC 연동을 운영과 동일한 DB 환경에서 재현하는 것이 목적이다.

> 상태: 설계 확정. compose/`.env` 등 배포 산출물은 구현 단계에서 추가된다.
> 설계 문서: [`docs/superpowers/specs/2026-06-03-keycloak-docker-local-dev-design.md`](docs/superpowers/specs/2026-06-03-keycloak-docker-local-dev-design.md)

## 구성

| 서비스 | 이미지 | 역할 |
|---|---|---|
| `keycloak` | `quay.io/keycloak/keycloak` (`start-dev`) | IdP. `localhost:8080` 노출 |
| `postgres` | `postgres:16-alpine` | Keycloak 백엔드 DB. 호스트 비노출, volume 영속 |

## 셋업

1. `.env.example` 를 `.env` 로 복사하고 관리자 계정·DB 비밀번호를 채운다. (`.env` 는 커밋 금지)
   ```bash
   cp .env.example .env
   ```
2. 기동:
   ```bash
   docker compose up -d
   ```
3. `http://localhost:8080` 접속 → `.env` 의 관리자 계정으로 로그인 → realm/client 생성.

## 주요 명령

| 명령 | 설명 |
|---|---|
| `docker compose up -d` | 기동 |
| `docker compose ps` | 상태 확인 (postgres `healthy` 후 keycloak 기동) |
| `docker compose logs -f keycloak` | 로그 확인 |
| `docker compose down` | 중지 (데이터 유지) |
| `docker compose down -v` | 중지 + **데이터 초기화** (volume 삭제) |

## 디렉터리

- `docker-compose.yml` — 서비스 정의
- `.env` / `.env.example` — 자격·버전 핀 (실제 값은 `.env`, 커밋 금지)
- `docs/superpowers/specs/` — 설계 문서
- `rules/`, `CLAUDE.md` — 작업 규칙 (Claude Code)
