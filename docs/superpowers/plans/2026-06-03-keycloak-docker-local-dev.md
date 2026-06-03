# Keycloak 로컬 개발 Docker 배포 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로컬 개발/테스트용 Keycloak을 Docker Compose(keycloak `start-dev` + Postgres 영속)로 띄우고, 관리자 로그인·데이터 영속을 런타임으로 검증한다.

**Architecture:** 단일 `docker-compose.yml`에 2개 서비스를 정의한다. `postgres`(호스트 비노출, named volume 영속, healthcheck)와 `keycloak`(`start-dev`, `depends_on: postgres healthy`, 8080 노출). 모든 자격·버전은 `.env`로 주입하고 `.env`는 커밋하지 않는다.

**Tech Stack:** Docker Compose v2, `quay.io/keycloak/keycloak:26.0`, `postgres:16-alpine`, Keycloak Admin REST API(검증용).

> **검증 방식 주의:** 이 프로젝트는 단위 테스트 하니스(pytest/jest 등)가 없는 인프라 구성이다. "테스트"는 `docker compose config` 정적 검증과, 기동 후 health/admin-REST를 호출하는 런타임 검증으로 대체한다. 읽기가 아니라 실제 명령 실행으로 확인한다.
>
> **사전 조건:** Docker Desktop(또는 Docker Engine) + Compose v2 가 설치·실행 중이어야 한다. `docker compose version` 으로 확인. 미설치면 여기서 중단하고 사용자에게 알린다.

---

### Task 1: `.env.example` 작성 (커밋 대상)

**Files:**
- Create: `.env.example`

- [ ] **Step 1: `.env.example` 작성**

```bash
# Image version pins (배포마다 바뀔 수 있음 → Environment)
KEYCLOAK_IMAGE_TAG=26.0
POSTGRES_IMAGE_TAG=16-alpine

# Keycloak 초기 관리자 (Keycloak 26+ bootstrap 변수)
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=change-me-admin-pw

# Postgres
POSTGRES_DB=keycloak
POSTGRES_USER=keycloak
POSTGRES_PASSWORD=change-me-db-pw

# Keycloak -> Postgres 연결 (POSTGRES_USER / POSTGRES_PASSWORD 와 동일 값이어야 함)
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=change-me-db-pw
```

위 내용을 `.env.example` 파일로 저장한다.

- [ ] **Step 2: `.gitignore` 가 `.env` 를 무시하고 `.env.example` 은 추적하는지 확인**

Run: `git check-ignore .env .env.example; echo "exit=$?"`
Expected: `.env` 한 줄만 출력 (`.env.example` 은 출력 안 됨 → 추적 대상). `.gitignore` 에 이미 `.env` / `!.env.example` 규칙이 있으므로 수정 불필요.

- [ ] **Step 3: 커밋 (PROGRESS.md 먼저 갱신)**

`PROGRESS.md` 의 `## 2026-06-03` 섹션 끝에 한 줄 추가:
```markdown
- **구현 시작**: `.env.example` 추가 (이미지 핀·관리자·DB 자격 키 정의). secret 실값은 `.env`(미커밋)로 주입.
```

```bash
git add .env.example PROGRESS.md
git commit -m "feat(compose): add .env.example for Keycloak local-dev — Keycloak 로컬 개발용 환경변수 예시 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 로컬 `.env` 생성 (커밋 안 함, 검증용)

**Files:**
- Create: `.env` (gitignored)

- [ ] **Step 1: `.env.example` 를 복사해 `.env` 생성**

Run: `cp .env.example .env`

- [ ] **Step 2: 검증용 실값 채우기**

`.env` 를 열어 `change-me-*` 자리를 로컬 개발용 값으로 교체한다. 예:
```bash
KC_BOOTSTRAP_ADMIN_PASSWORD=devadmin123
POSTGRES_PASSWORD=devdbpass123
KC_DB_PASSWORD=devdbpass123
```
주의: `KC_DB_PASSWORD` 는 `POSTGRES_PASSWORD` 와 **반드시 동일**해야 한다.

- [ ] **Step 3: `.env` 가 git에 안 잡히는지 확인**

Run: `git status --short .env`
Expected: 출력 없음 (gitignore 처리되어 untracked로도 안 뜸). 만약 뜨면 즉시 중단하고 `.gitignore` 점검.

---

### Task 3: `docker-compose.yml` 작성 및 정적 검증

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: `docker-compose.yml` 작성**

```yaml
# 로컬 개발용 Keycloak + Postgres. 운영(start/HTTPS) 전환은 별도 spec.
services:
  postgres:
    image: postgres:${POSTGRES_IMAGE_TAG}
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pg_data:/var/lib/postgresql/data
    # $$ 로 compose 보간을 escape → 컨테이너 런타임 env 를 그대로 사용
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  keycloak:
    image: quay.io/keycloak/keycloak:${KEYCLOAK_IMAGE_TAG}
    command: start-dev
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      KC_DB_USERNAME: ${KC_DB_USERNAME}
      KC_DB_PASSWORD: ${KC_DB_PASSWORD}
      KC_BOOTSTRAP_ADMIN_USERNAME: ${KC_BOOTSTRAP_ADMIN_USERNAME}
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KC_BOOTSTRAP_ADMIN_PASSWORD}
      # health/ready, metrics 를 관리 포트(9000)에 활성화
      KC_HEALTH_ENABLED: "true"
    ports:
      - "8080:8080"   # 관리 콘솔 / OIDC 엔드포인트
      - "9000:9000"   # 관리 포트: /health/ready 검증용 (이미지에 curl 없어 호스트에서 검증)
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  pg_data:
```

- [ ] **Step 2: 정적 검증 — 변수 보간 + 스키마**

Run: `docker compose config >/dev/null && echo OK`
Expected: `OK`. 경고/에러 없이 통과. `.env` 미설정 변수 경고가 뜨면 Task 2 를 먼저 끝낸다.

- [ ] **Step 3: 커밋 (PROGRESS.md 먼저 갱신)**

`PROGRESS.md` `## 2026-06-03` 섹션에 추가:
```markdown
- **compose 추가**: `docker-compose.yml` — postgres(healthcheck·volume) + keycloak(start-dev, depends_on healthy, 8080/9000). `docker compose config` 통과.
```

```bash
git add docker-compose.yml PROGRESS.md
git commit -m "feat(compose): add docker-compose for Keycloak + Postgres — Keycloak/Postgres compose 구성 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 기동 및 런타임 검증 (health + 관리자 로그인)

**Files:** 없음 (런타임 검증만)

- [ ] **Step 1: 스택 기동**

Run: `docker compose up -d`
Expected: `postgres`, `keycloak` 컨테이너 생성 후 `Started`.

- [ ] **Step 2: postgres healthy 확인**

Run: `docker compose ps`
Expected: `postgres` 의 STATUS 가 `(healthy)`, `keycloak` 은 `running`(또는 `Up`).

- [ ] **Step 3: Keycloak readiness 대기/확인**

Run:
```bash
for i in $(seq 1 30); do
  curl -fsS http://localhost:9000/health/ready && break
  echo "waiting keycloak... ($i)"; sleep 2
done
```
Expected: 마지막에 `{"status":"UP","checks":[]}` (또는 status UP) JSON 출력.

- [ ] **Step 4: 관리자 로그인 검증 (master realm 토큰 발급)**

Run (`.env` 의 관리자 계정/비번 사용):
```bash
set -a; . ./.env; set +a
curl -fsS \
  -d "client_id=admin-cli" \
  -d "username=${KC_BOOTSTRAP_ADMIN_USERNAME}" \
  -d "password=${KC_BOOTSTRAP_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  http://localhost:8080/realms/master/protocol/openid-connect/token | grep -q access_token && echo "LOGIN OK"
```
Expected: `LOGIN OK`. 실패(401)면 `.env` 의 `KC_BOOTSTRAP_ADMIN_*` 와 컨테이너 환경 불일치 → `docker compose logs keycloak` 확인 후 `down -v && up -d` 로 재부트스트랩.

---

### Task 5: 데이터 영속 검증 (재시작 후 realm 잔존)

**Files:** 없음 (런타임 검증만)

- [ ] **Step 1: 관리자 토큰 확보 후 테스트 realm 생성**

Run:
```bash
set -a; . ./.env; set +a
TOKEN=$(curl -fsS -d "client_id=admin-cli" \
  -d "username=${KC_BOOTSTRAP_ADMIN_USERNAME}" \
  -d "password=${KC_BOOTSTRAP_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  http://localhost:8080/realms/master/protocol/openid-connect/token | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
curl -fsS -X POST http://localhost:8080/admin/realms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"realm":"persist-check","enabled":true}' -o /dev/null -w "%{http_code}\n"
```
Expected: `201`.

- [ ] **Step 2: keycloak 재시작**

Run: `docker compose restart keycloak`
그리고 Task 4 Step 3 의 readiness 루프를 다시 실행해 `UP` 확인.

- [ ] **Step 3: realm 잔존 확인 (영속 검증)**

Run:
```bash
set -a; . ./.env; set +a
TOKEN=$(curl -fsS -d "client_id=admin-cli" \
  -d "username=${KC_BOOTSTRAP_ADMIN_USERNAME}" \
  -d "password=${KC_BOOTSTRAP_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  http://localhost:8080/realms/master/protocol/openid-connect/token | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
curl -fsS http://localhost:8080/admin/realms/persist-check \
  -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}\n"
```
Expected: `200` (재시작 후에도 realm 이 Postgres volume 에 남아있음 → 영속 검증 성공).

- [ ] **Step 4: 테스트 realm 정리**

Run:
```bash
curl -fsS -X DELETE http://localhost:8080/admin/realms/persist-check \
  -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}\n"
```
Expected: `204`.

---

### Task 6: 마무리 — PROGRESS 갱신 및 검증 결과 기록

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: 검증 결과를 PROGRESS.md 에 기록**

`PROGRESS.md` `## 2026-06-03` 섹션에 추가:
```markdown
- **런타임 검증 완료**: `up -d` → postgres healthy/keycloak running, `/health/ready` UP, master realm 토큰 발급(관리자 로그인) OK, realm 생성→`restart keycloak`→잔존(200) 으로 영속 검증. 테스트 realm 정리(204).
```

- [ ] **Step 2: README 명령/구성이 실제와 일치하는지 확인**

`README.md` 의 셋업·명령 표가 실제 `docker-compose.yml`/`.env.example` 과 어긋나지 않는지 확인. 어긋나면 README 를 실제에 맞춰 수정. (현재 spec 기준 작성되어 대체로 일치)

- [ ] **Step 3: 커밋**

```bash
git add PROGRESS.md README.md
git commit -m "docs: record Keycloak local-dev verification results — 로컬 개발 배포 런타임 검증 결과 기록

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:**
- 파일 구성(spec §2): `.env.example`(T1), `.env`(T2), `docker-compose.yml`(T3) 생성. `README.md`/`PROGRESS.md`/`.gitignore` 는 기존 commit `a559319` 에 이미 존재 → T6에서 정합성 확인. ✅
- postgres 구성(spec §3): image/volume/healthcheck/비노출 — T3 compose 반영. ✅
- keycloak 구성(spec §3): `start-dev`/depends_on healthy/8080/KC_DB*/KC_BOOTSTRAP*/KC_HEALTH_ENABLED — T3 반영. 관리 포트 9000 노출은 spec §3 "health/ready 검증" 의도 구현(이미지에 curl 없음). ✅
- env 표(spec §4): 9개 변수 전부 `.env.example`(T1)에 포함. ✅
- 기동 순서/데이터 흐름(spec §5): T4 기동·로그인. ✅
- 에러 처리(spec §6): depends_on healthy(T3), postgres 비노출(T3), down -v 초기화(README). ✅
- 검증 성공 기준(spec §7): ps healthy(T4-S2), /health/ready(T4-S3), 관리자 로그인(T4-S4), realm 영속(T5). ✅
- Out of scope(spec §8): 운영모드/HTTPS/프록시/realm import/커스텀 빌드 — 플랜에서 다루지 않음. ✅

**2. Placeholder scan:** TBD/TODO/"적절히 처리" 류 없음. 모든 코드 스텝에 실제 내용 포함. ✅

**3. Type/이름 일관성:** 변수명(`KC_BOOTSTRAP_ADMIN_USERNAME` 등)·서비스명(`postgres`/`keycloak`)·realm명(`persist-check`)이 T3~T6 전반에서 일치. `KC_DB_URL` 의 호스트 `postgres` 가 서비스명과 일치. ✅
