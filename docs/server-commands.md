# 서버 운영 명령어 (copy & paste)

서버에서 자주 쓰는 명령 모음. **배포/전송 절차**(scp, /data 이동)는 `README.md` "서버 배포" 섹션 참고.
앞으로 운영 중 필요한 명령은 이 문서에 계속 추가한다.

> **전제**
> - 아래 `docker compose ...` 는 **compose 파일이 있는 디렉터리**(`/data/keycloak_dev`)에서 실행.
> - 컨테이너는 컨테이너명이 아니라 **서비스명** `keycloak` 으로 접근: `docker compose exec keycloak ...`
> - 컨테이너 풀네임 확인: `docker compose ps`

---

## "HTTPS required" 해제 (직접 HTTP 테스트용)

원인은 realm 의 `sslRequired=external`(기본값). 외부 IP로 HTTP 접속하면 막힌다.
`sslRequired=NONE` 으로 끄면 **DB에 저장 → 재배포해도 유지**된다.
⚠ 평문 HTTP로 비밀번호가 오가므로 **테스트용만**. 운영은 HTTPS 프록시 뒤에 둘 것.

**1) kcadm 로그인** (localhost라 SSL 정책 통과 — 아래 update 전에 먼저 실행):
```bash
docker compose exec keycloak sh -c '/opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 --realm master \
  --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD"'
```

**2) master realm(관리 콘솔) SSL 요구 해제:**
```bash
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=NONE
```

**3) 테마 테스트용 demo realm 도 (있을 때):**
```bash
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh update realms/demo -s sslRequired=NONE
```

→ 새로고침하면 `http://<server>:6502` 접속됨.

---

## 커스텀 로그인 테마 적용 (loginTheme=custom)

(로그인은 위 "1) kcadm 로그인" 먼저)

**realm 생성** (빈 상태에서 테스트 realm 이 필요할 때):
```bash
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh create realms -s realm=demo -s enabled=true
```

**테마 지정:**
```bash
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh update realms/demo -s loginTheme=custom
```

확인 (account 콘솔이 로그인 화면으로 리다이렉트):
```
http://<server>:6502/realms/demo/account
```

> GUI로도 가능: Admin Console → 해당 realm → Realm settings → Themes → Login theme → `custom` → Save

---

## 상태 · 로그 · 헬스

```bash
docker compose ps
```
```bash
docker compose logs keycloak --tail=50 -f
```
```bash
curl -fsS http://localhost:9000/health/ready
```

---

## 재기동 · 반영

테마 **파일만** 바뀌면 재기동 없이 로그인 화면 **새로고침**으로 반영된다(`start-dev`, 캐시 off).
compose/이미지/환경변수가 바뀌었을 때만:

```bash
docker compose up -d
```
```bash
docker compose restart keycloak
```

---

## 커스텀 테마가 드롭다운에 안 보일 때 (진단)

증상: Realm settings → Themes 드롭다운에 `custom`이 없고 로그인은 기본 화면.
= Keycloak이 `/opt/keycloak/themes/custom/login` 을 못 찾는 상태. 아래 순서로 좁힌다.

**A. 컨테이너가 테마를 보는가 (가장 중요):**
```bash
docker compose exec keycloak ls -la /opt/keycloak/themes/custom/login
```
- `No such file` → 전송/마운트/구조 문제 (B)
- 파일이 보이면 → 권한 문제 (C)

**B. 호스트 구조·중첩·바인드 소스 확인:**
```bash
ls -la /data/keycloak_dev/docker-compose.yml /data/keycloak_dev/themes/custom/login
```
```bash
find /data/keycloak_dev -maxdepth 5 -type d -name login
```
```bash
docker compose config | grep -B1 -A3 -i themes
```
→ `themes/themes/...` 처럼 중첩됐거나 `themes/custom/login` 이 없으면 전송 구조가 깨진 것. 올바른 위치로 다시 맞춘 뒤 `docker compose up -d`.

**C. 권한 (컨테이너는 비root user — 못 읽으면 테마 무시됨):**
```bash
docker compose exec keycloak sh -c 'id; cat /opt/keycloak/themes/custom/login/theme.properties >/dev/null 2>&1 && echo READABLE || echo "NOT READABLE"'
```
- `NOT READABLE` 이면 호스트에서 읽기 권한 부여:
```bash
sudo chmod -R a+rX /data/keycloak_dev/themes
```

**D. 재스캔 (위를 고친 뒤, 또는 마운트 후 기동했을 때):**
```bash
docker compose restart keycloak
```
→ 다시 Realm settings → Themes 드롭다운 확인.
