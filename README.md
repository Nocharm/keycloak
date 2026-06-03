# Keycloak — 로컬 개발 Docker 배포

로컬 환경에서 앱 OIDC 연동을 운영과 동일한 DB 구조로 재현하기 위한 Keycloak + Postgres Docker Compose 설정.

## 구성

| 서비스 | 이미지 | 포트 |
|--------|--------|------|
| keycloak | `quay.io/keycloak/keycloak:26.0` | 8080 (콘솔/OIDC), 9000 (헬스) |
| postgres | `postgres:16-alpine` | 5432 (내부) |

- Keycloak은 `start-dev` 모드로 기동 (로컬 전용 — TLS 없음)
- Postgres는 named volume(`pg_data`)으로 데이터 영속
- Keycloak은 postgres healthcheck 통과 후 기동 (`depends_on: condition: service_healthy`)

## 빠른 시작

```bash
# 1. 환경 변수 파일 준비
cp .env.example .env
# .env 에서 *-pw 값을 실제 비밀번호로 교체

# 2. 스택 기동
docker compose up -d

# 3. Keycloak 준비 대기 (health/ready 가 UP 이 될 때까지)
until curl -fsS http://localhost:9000/health/ready; do sleep 3; done

# 4. 관리 콘솔 접속
open http://localhost:8080
```

## 환경 변수 (`.env.example` 기준)

| 키 | 설명 |
|----|------|
| `KEYCLOAK_IMAGE_TAG` | Keycloak 이미지 태그 |
| `POSTGRES_IMAGE_TAG` | Postgres 이미지 태그 |
| `KC_BOOTSTRAP_ADMIN_USERNAME` | Keycloak 초기 관리자 계정 |
| `KC_BOOTSTRAP_ADMIN_PASSWORD` | Keycloak 초기 관리자 비밀번호 |
| `POSTGRES_DB` | Postgres 데이터베이스 이름 |
| `POSTGRES_USER` | Postgres 사용자 |
| `POSTGRES_PASSWORD` | Postgres 비밀번호 |
| `KC_DB_USERNAME` | Keycloak → Postgres 연결 사용자 (`POSTGRES_USER` 와 동일) |
| `KC_DB_PASSWORD` | Keycloak → Postgres 연결 비밀번호 (`POSTGRES_PASSWORD` 와 동일) |

> **주의:** `.env` 는 절대 커밋하지 않는다 (`.gitignore` 처리됨).

## 유용한 명령어

```bash
# 컨테이너 상태 확인
docker compose ps

# Keycloak 로그 보기
docker compose logs keycloak -f

# 스택 중단 (볼륨 유지)
docker compose down

# 스택 + 볼륨 완전 삭제 (데이터 초기화)
docker compose down -v
```

## 헬스 체크

```bash
# Keycloak readiness
curl http://localhost:9000/health/ready

# 관리자 토큰 발급 테스트
source .env
curl -fsS \
  -d "client_id=admin-cli" \
  -d "username=${KC_BOOTSTRAP_ADMIN_USERNAME}" \
  -d "password=${KC_BOOTSTRAP_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  http://localhost:8080/realms/master/protocol/openid-connect/token
```
