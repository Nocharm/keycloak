# Keycloak 로컬 개발 Docker 배포 — Design Spec

- **Date**: 2026-06-03
- **Status**: Approved
- **Goal**: 로컬 개발/테스트용 Keycloak을 Docker Compose로 띄운다. Postgres 영속, `start-dev` 모드, realm은 빈 상태로 시작해 관리 콘솔에서 수동 구성.

## 1. Scope

- 공식 이미지(`quay.io/keycloak/keycloak`, `postgres:16-alpine`)만 사용한다. 커스텀 Dockerfile 없음.
- 단일 `docker-compose.yml`로 keycloak + postgres 2개 서비스를 정의한다.
- 운영(HTTPS/hostname/클러스터)·realm 자동 import·리버스 프록시는 **범위 밖**(YAGNI). 추후 운영 전환 시 별도 spec.

## 2. 파일 구성

```
keycloak/
├── docker-compose.yml      # keycloak + postgres
├── .env                    # 실제 비밀번호·계정 (gitignore, 커밋 금지)
├── .env.example            # 키 목록·더미값·주석 (커밋)
├── .gitignore              # .env 등록
├── README.md               # 셋업·기동·접속·검증 절차
└── PROGRESS.md             # 진행 로그
```

## 3. 서비스 구성

### postgres
- 이미지: `postgres:${POSTGRES_IMAGE_TAG}` (핀: `16-alpine`)
- volume: named volume `pg_data:/var/lib/postgresql/data` — 데이터 영속
- healthcheck: `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB`
- 포트: **호스트 비노출**. keycloak이 내부 네트워크로만 접근한다.
- 환경: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

### keycloak
- 이미지: `quay.io/keycloak/keycloak:${KEYCLOAK_IMAGE_TAG}` (핀: `26.x` 계열 stable)
- command: `start-dev`
- depends_on: `postgres` with `condition: service_healthy` — DB 준비 전 기동 레이스 방지
- 포트: `8080:8080`
- 환경:
  - `KC_DB=postgres`
  - `KC_DB_URL=jdbc:postgresql://postgres:5432/${POSTGRES_DB}`
  - `KC_DB_USERNAME=${KC_DB_USERNAME}`, `KC_DB_PASSWORD=${KC_DB_PASSWORD}` (postgres 자격과 동일 값)
  - `KC_BOOTSTRAP_ADMIN_USERNAME=${KC_BOOTSTRAP_ADMIN_USERNAME}`
  - `KC_BOOTSTRAP_ADMIN_PASSWORD=${KC_BOOTSTRAP_ADMIN_PASSWORD}`
  - `KC_HEALTH_ENABLED=true` — `/health/ready` 검증용

## 4. 환경변수 (`.env` / `.env.example`)

| 변수 | 용도 | 분류 |
|---|---|---|
| `KEYCLOAK_IMAGE_TAG` | Keycloak 이미지 버전 핀 | Environment |
| `POSTGRES_IMAGE_TAG` | Postgres 이미지 버전 핀 | Environment |
| `KC_BOOTSTRAP_ADMIN_USERNAME` | 초기 관리자 계정명 | Tuning |
| `KC_BOOTSTRAP_ADMIN_PASSWORD` | 초기 관리자 비밀번호 (secret) | Tuning |
| `POSTGRES_DB` | Keycloak용 DB 이름 | Environment |
| `POSTGRES_USER` | DB 사용자 | Environment |
| `POSTGRES_PASSWORD` | DB 비밀번호 (secret) | Environment |
| `KC_DB_USERNAME` | Keycloak→DB 사용자 (= `POSTGRES_USER`) | Environment |
| `KC_DB_PASSWORD` | Keycloak→DB 비밀번호 (= `POSTGRES_PASSWORD`) | Environment |

- `.env`는 절대 커밋하지 않는다(`.gitignore`).
- `.env.example`은 동일 키 + 더미값 + 한 줄 주석으로 커밋한다.
- secret(비밀번호)은 하드코딩하지 않고 `.env`로만 주입한다 (`rules/common/security.md`, `rules/backend/config.md`).

## 5. 기동 순서 / 데이터 흐름

1. `docker compose up -d`
2. postgres 기동 → healthcheck 통과
3. keycloak 기동 → `start-dev`가 postgres에 스키마 자동 생성/마이그레이션
4. `http://localhost:8080` 관리 콘솔 접속 → `.env` 관리자 계정으로 로그인
5. 관리 콘솔에서 realm/client 수동 생성
6. 모든 상태는 `pg_data` volume에 영속 — `down` 후 `up` 해도 유지

## 6. 에러 처리 / 운영 고려

- `depends_on: condition: service_healthy`로 DB 미준비 기동 레이스 차단.
- postgres 호스트 비노출 → 로컬 포트 충돌·노출면 최소화.
- volume 영속: 데이터 초기화는 `docker compose down -v`로 명시적으로만 수행.

## 7. 검증 (성공 기준)

1. `docker compose up -d` 후 `docker compose ps` — 두 서비스 `running`, postgres `healthy`.
2. `curl -fsS http://localhost:9000/health/ready` 200 응답 (`/health/ready`는 관리 포트 9000에 제공; 콘솔 접속은 8080).
3. 관리 콘솔에 `.env` 계정으로 로그인 성공.
4. realm 1개 생성 → `docker compose restart keycloak` → realm 잔존 확인 (영속 검증).

## 8. Out of Scope (추후 별도 spec)

- 운영 모드(`start`), HTTPS/TLS, `KC_HOSTNAME` 설정
- 리버스 프록시(Nginx/Traefik)
- realm 자동 import(`--import-realm`)
- 커스텀 provider/`kc.sh build` 최적화 이미지
- 클러스터링/HA
