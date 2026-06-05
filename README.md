# Keycloak — 로컬 개발 Docker 배포

로컬 환경에서 앱 OIDC 연동을 운영과 동일한 DB 구조로 재현하기 위한 Keycloak + Postgres Docker Compose 설정.

## 구성

| 서비스 | 이미지 | 포트 |
|--------|--------|------|
| keycloak | `quay.io/keycloak/keycloak:26.0` | `KEYCLOAK_HTTP_PORT` (기본 8080, 콘솔/OIDC), 9000 (헬스) |
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

## 서버 배포 (Mac → Windows → 서버)

배포 경로: **Mac(개발)** 에서 푸시 → **Windows(중계)** 에서 풀 → `scp` 로 서버 전송 → **서버**에서 기동.

`.env` 는 `.gitignore` 처리되어 Windows 가 `git pull` 해도 작업본에 생기지 않는다. 따라서 `scp -r` 로 폴더째 보내면 `.env` 는 자연히 제외되고 `.git` 은 포함된다. (Windows 작업본에 `.env` 를 만들지 말 것 — 만들면 전송에 섞인다.)

```bash
# ── 1) Mac: 커밋 후 푸시 ───────────────────────────────
git add <변경 파일>
git commit -m "..."
git push origin main
```

```powershell
# ── 2) Windows: 풀 (중계) ──────────────────────────────
git pull origin main

# ── 3) Windows → 서버: 폴더 전송 (.env 제외 / .git 포함) ─
#    .env 는 작업본에 없으므로 자동 제외, .git 은 함께 복사됨
scp -r C:\path\to\keycloak <user>@<server>:/opt/keycloak
```

```bash
# ── 4) 서버: .env 작성 후 기동 ─────────────────────────
cd /opt/keycloak
cp .env.example .env            # 최초 1회
#   .env 편집: 비밀번호(*-pw) 교체 + KEYCLOAK_HTTP_PORT=6502 설정
docker compose up -d
#   접속: http://<server>:6502   (헬스: http://<server>:9000/health/ready)
```

> **CRLF:** `.gitattributes` 가 `eol=lf` 를 강제하므로 Windows 체크아웃에서도 working tree 가 LF 로 유지된다 → `gen-services.sh` 셰뱅이 깨지지 않는다. 별도 `git config` 불필요. 단, **`.gitattributes` 추가 이전에 이미 클론/풀 한 작업본**은 한 번 정규화해야 한다: `git add --renormalize . && git commit -m "chore: normalize line endings"` (또는 Windows에서 재클론).

## 환경 변수 (`.env.example` 기준)

| 키 | 설명 |
|----|------|
| `KEYCLOAK_IMAGE_TAG` | Keycloak 이미지 태그 |
| `POSTGRES_IMAGE_TAG` | Postgres 이미지 태그 |
| `KEYCLOAK_HTTP_PORT` | Keycloak 을 노출할 호스트 포트 (기본 8080, 서버는 6502) |
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
