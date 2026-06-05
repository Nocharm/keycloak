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

배포 경로: **Mac(개발)** 에서 푸시 → **Windows(중계)** 에서 풀 → `scp` 로 서버 홈(`~/keycloak_dev`)에 전송 → **서버**에서 `/data/keycloak_dev` 로 옮겨 기동. (`/data` 는 용량이 넉넉하지만 쓰기 권한이 없어, 권한 있는 홈에 먼저 올린 뒤 `sudo` 로 옮긴다.)

`.env` 는 `.gitignore` 처리되어 Windows 가 `git pull` 해도 작업본에 생기지 않는다. 따라서 `scp -r .` 로 폴더째 보내면 `.env` 는 자연히 제외되고 `.git`·`.gitattributes` 같은 숨김 파일은 포함된다. (전송할 폴더에 `.env` 를 만들지 말 것 — 있으면 같이 전송된다.)

```bash
# ── 1) Mac: 커밋 후 푸시 ───────────────────────────────
git add <변경 파일>
git commit -m "..."
git push origin main
```

```powershell
# ── 2) Windows: 풀 + 전송 (폴더로 이동 후 상대경로 '.') ──
cd C:\path\to\keycloak                      # 전송할 폴더로 이동
git pull origin main
scp -r . <user>@<server>:~/keycloak_dev     # '.' = 현재 폴더 전체(.git 포함), .env 는 없으니 제외
```

```bash
# ── 3) 서버(최초 1회): 홈 → /data 로 옮기고 기동 ───────
ssh <user>@<server>
sudo mv ~/keycloak_dev /data/keycloak_dev
cd /data/keycloak_dev
cp .env.example .env            # .env 편집: 비밀번호(*-pw) + KEYCLOAK_HTTP_PORT=6502
docker compose up -d
#   접속: http://<server>:6502   (헬스: http://<server>:9000/health/ready)
```

### 이후 업데이트 (반복 — 매번 이 명령으로 전송/반영)

`/data/keycloak_dev` 가 이미 있으면 `mv` 는 폴더를 중첩시킨다. 대신 홈에 올린 뒤 **내용만 동기화**한다 — 서버의 `.env` 와 DB 볼륨(데이터)은 보존:

```powershell
# (Windows) 폴더로 이동 후 다시 전송
cd C:\path\to\keycloak
git pull origin main
scp -r . <user>@<server>:~/keycloak_dev
```

```bash
# (서버) 홈 → /data 동기화 후 반영
ssh <user>@<server>
sudo rsync -a --delete --exclude='.env' ~/keycloak_dev/ /data/keycloak_dev/
rm -rf ~/keycloak_dev
cd /data/keycloak_dev
docker compose up -d            # compose/이미지 변경 시 재생성. 테마 파일만 바뀌었으면 로그인 화면 새로고침으로 반영(start-dev)
```

> `--exclude='.env'` 가 서버 `.env` 를 보호한다(소스엔 `.env` 가 없어 `--delete` 가 지우는 것을 방지). `rsync` 가 없으면 `sudo cp -a ~/keycloak_dev/. /data/keycloak_dev/` 로 대체(단, 이 경우 레포에서 삭제된 파일은 서버에 남는다).

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
