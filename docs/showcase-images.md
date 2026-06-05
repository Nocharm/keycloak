# 로그인 쇼케이스 이미지 등록 절차

로그인 화면 우측의 "연결 서비스" 카드 스택에 들어가는 이미지(PNG) 추가·삭제 방법.

**동작 구조**
- 이미지 위치: `themes/custom/login/resources/img/services/*.png`
- `gen-services.sh` 가 그 폴더의 PNG를 스캔해 `manifest.json` 생성
- `showcase.js` 가 `manifest.json` 을 읽어 카드(브라우저 창 모양)로 렌더 + 자동 회전

---

## 이미지 규칙

- **파일명이 곧 창 타이틀**이 된다. 사람이 읽을 이름으로.
  - `Mail.png` → 타이틀 `Mail`
  - 하이픈/언더스코어는 공백으로 변환: `My-Portal.png` / `My_Portal.png` → `My Portal`
- 권장 사이즈: **~1280×800 (16:10)**, 실제 서비스 화면처럼 보이는 스크린샷.
- 카드 순서는 무관(파일명 glob 순서). 1장이면 회전 없음, 2장 이상이면 자동 회전.

---

## 추가 / 삭제 (로컬 작업)

```bash
# 1. PNG를 services 폴더에 넣는다 (또는 뺀다)
#    themes/custom/login/resources/img/services/<ServiceName>.png

# 2. 목록(manifest.json) 재생성
bash themes/custom/login/gen-services.sh

# 3. 로그인 화면 새로고침 → 카드 반영 (start-dev라 재시작 불필요)
```

삭제도 동일: 파일을 지우고 `gen-services.sh` 재실행 → 새로고침.

---

## 커밋 & 서버 반영

```bash
# 로컬: 추가한 PNG와 갱신된 manifest.json 을 함께 커밋
git add themes/custom/login/resources/img/services/
git commit -m "feat(theme): add <ServiceName> showcase image — 쇼케이스 이미지 추가"
git push origin main
```

서버에서는 배포 절차(`README.md` "서버 배포")대로 `git pull` → 동기화 → 로그인 화면 새로고침.
`manifest.json` 은 로컬에서 이미 생성·커밋되므로 서버에서 `gen-services.sh` 를 다시 돌릴 필요는 없다.

> 서버에서 직접 PNG를 넣었다면, 그 서버에서 `bash themes/custom/login/gen-services.sh` 를 실행해 `manifest.json` 을 갱신해야 한다.

---

## 참고
- 이미지 로드 실패(404)는 콘솔 경고만 남고 로그인 폼은 영향받지 않는다.
- 부채꼴 펼침/낙하 회전 속도·각도 등은 `themes/custom/login/resources/js/showcase.js` 상단 상수에서 조정.
- 서버 운영 명령 모음: `docs/server-commands.md`.
