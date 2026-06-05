# 기존(운영) Keycloak에 커스텀 로그인 테마 추가

별도로 운영 중인 **ai-portal Keycloak**에 이 레포의 커스텀 로그인 테마만 입히는 절차.
(이 레포를 6502에 띄우는 테스트 스택과는 다름 — 여기선 **기존 스택의 데이터·네트워크를 그대로 두고 테마만** 추가한다.)

## 전제 (기존 스택)
- Keycloak **26.0**, `start-dev`, `container_name: keycloak`
- DB: `keycloak-db` (volume `keycloak_db_data`), network `shared-net`(앱과 연결됨)
- 적용 realm: **`ai-portal`**
- admin: `.env` 의 `KC_ADMIN`/`KC_PASSWORD` → 컨테이너 env `KC_BOOTSTRAP_ADMIN_USERNAME`/`KC_BOOTSTRAP_ADMIN_PASSWORD`

> ⚠️ **레포 전체를 배포 폴더에 풀어서 그걸로 띄우지 말 것.** 이 레포의 `docker-compose.yml`은 다른 스택(서비스 `postgres`, 볼륨 `pg_data`, `shared-net` 없음)이라, 그걸로 `up` 하면 기존 `keycloak_db_data`/`shared-net`을 못 써서 **데이터·앱 연결이 끊긴 새 인스턴스**가 뜬다. 아래처럼 **테마만** 가져온다.

---

## 1. 테마 레포를 서브폴더로 clone
```bash
cd <배포 폴더>        # 기존 docker-compose.yml, .env 가 있는 곳
git clone https://github.com/Nocharm/keycloak.git kc-theme
```
> 배포 폴더가 그 자체로 git repo라면 `.gitignore` 에 `kc-theme/` 추가(중첩 repo 충돌 방지).

## 2. compose에 볼륨 한 줄 추가
기존 `keycloak` 서비스에 마운트만 추가(나머지 설정 불변):
```yaml
  keycloak:
    image: keycloak/keycloak:26.0
    container_name: keycloak
    command: start-dev
    volumes:                                    # ← 추가
      - ./kc-theme/themes:/opt/keycloak/themes
    # ...기존 environment / depends_on / networks 그대로...
```

## 3. keycloak 컨테이너만 재생성 (데이터 보존)
```bash
docker compose up -d keycloak
```
> ⚠️ **`docker compose down -v` 절대 금지** (`-v` 가 볼륨 삭제 = 데이터 소멸).
> `up -d keycloak` 은 keycloak 컨테이너만 새로 만들고 DB 컨테이너·`keycloak_db_data`·`shared-net` 은 건드리지 않는다.

## 4. realm(ai-portal)에 테마 적용
컨테이너 내부 env 를 써서 시크릿을 호스트에 남기지 않는다:
```bash
docker compose exec keycloak sh -c '/opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 --realm master \
  --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD"'
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh update realms/ai-portal -s loginTheme=custom
```
> GUI로도 가능: Admin Console → **ai-portal** → Realm settings → Themes → Login theme → `custom` → Save

## 5. 확인
로그아웃 상태에서 ai-portal 로그인 화면 접속 → 좌측 Apple 폼 + 우측 서비스 쇼케이스가 보이면 성공.

## 6. 이후 테마 업데이트
```bash
cd <배포 폴더>/kc-theme
git pull
# 로그인 화면 새로고침 (start-dev라 캐시 off → 재시작 불필요)
```
> `field.ftl`/`messages`/새 JS 등 **새 파일**이 추가됐는데 반영이 안 되면 `docker compose restart keycloak` 한 번.

---

## 참고
- 쇼케이스 PNG 추가/삭제: `kc-theme/docs/showcase-images.md`
- 서버 운영 명령 모음: `kc-theme/docs/server-commands.md`
- "HTTPS required" 가 뜨면(외부에서 HTTP 직접 접속 시) 해당 realm 의 `sslRequired` 를 조정 — 단 ai-portal 은 HTTPS 리버스 프록시(`KC_PROXY_HEADERS=xforwarded`) 뒤라 보통 불필요.
