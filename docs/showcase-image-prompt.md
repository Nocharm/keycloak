# 쇼케이스 이미지 자동 생성 프롬프트 (Claude Code 직접 실행용)

쇼케이스 카드(`resources/img/services/*.png`)에 넣을 서비스 화면을, **그 서비스의 소스 레포에서 Claude Code에게 직접 만들게** 하는 프롬프트.
사람이 스크린샷을 찍어 채팅에 주던 방식을 폐기하고, Claude Code가 메인 HTML을 읽어 톤 목업 HTML을 작성→headless 캡처까지 처리한다.

**원칙: 단순화된 골격 + 식별 가능.** 결과물은 픽셀 충실한 스크린샷이 아니라 **단순화·추상화된 목업**이어야 한다. 본문 콘텐츠는 고스트(스켈레톤) 플레이스홀더로 비우고, 레이아웃 구조·로고·시그니처 UI 형태·brand색만으로 *누가 봐도 그 사이트*임을 알게 한다. 그 위에 카드들이 한 가족처럼 보이도록 Apple-light 공통 속성을 얹는다.

## 사용법
1. **대상 서비스의 소스 레포**에서 `claude` 실행.
2. 메인 HTML 경로(예: `index.html`, `public/index.html`)를 알려주고 **아래 프롬프트**를 붙여넣는다. (이미지 첨부·참고 목업 불필요 — 톤 스펙은 프롬프트 안에 있다.)
3. Claude Code가 후보 4장 + 컨택시트 1장을 만들면 **사람이 1장을 고른다.**
4. 고른 PNG를 이 keycloak 레포의 `themes/custom/login/resources/img/services/<ServiceName>.png` 로 복사 → `bash themes/custom/login/gen-services.sh` 실행(상세: `showcase-images.md`).

---

## 공통으로 얹을 톤 속성 (절충 최소셋)
단순화된 골격 위에 카드 통일을 위해 **아래만** 공통 적용한다:
- 캔버스 **1280×800**, 바깥 브라우저 크롬/창 타이틀바/라운드 외곽 없음(카드 프레임은 테마가 따로 그림).
- 배경: 사이트 brand색의 옅은 틴트 → `#f5f5f7` 로 가는 **부드러운 대각 그라데이션**.
- 카드/패널: 흰 surface + **1px `#e0e0e0` hairline** + **반경 18px** + **아주 옅은 섀도만**(`0 8px 24px rgba(0,0,0,.04)`).
- accent는 **하나의 hue**(사이트 brand색에서 추출)로 — 로고·강조 요소에 동일하게.
- **Flat** — 요소에 진한 그라데이션/드롭섀도 금지, hairline·surface 단계로 깊이 표현.
- **고스트/단순화** — 본문 텍스트는 둥근 회색 바, 아바타·아이콘은 원/라운드 사각, 이미지·차트는 단순 블록/막대로 추상화. 실제 문구는 로고/워드마크와 섹션 제목 정도만 읽히게 하고 나머지는 비운다.

> 식별은 **레이아웃 구조 + 로고 + 시그니처 UI 형태 + brand색**으로만. 픽셀 단위 충실 재현은 하지 않는다(스크린샷처럼 보이면 실패).

---

## 프롬프트 (복사용)

```
You are generating a "connected service" showcase image for a login screen, working
directly inside this service's own source repository. Produce candidate images, then
wait for me to pick one.

CONTEXT
- This repo IS the real service. Read its main HTML/CSS (I'll point you to the entry
  file) to learn its STRUCTURE: overall layout, header, brand name/logo, the signature
  UI shape that makes this service recognizable, and the primary brand color.
- The output is a simplified, abstracted showcase thumbnail — NOT a screenshot and NOT
  a working page. It should read as a clean stylized mockup of the site, not a capture.

GOAL: a SIMPLIFIED skeleton that is still recognizably this site.
- Do NOT reproduce the page pixel-for-pixel. Abstract the content into ghost/skeleton
  placeholders: body text becomes rounded grey bars, avatars/icons become circles or
  rounded squares, images/charts become simple blocks or accent bars. Keep only the
  logo/wordmark and maybe a section title or two as real legible text; empty the rest.
- Recognition comes ONLY from: overall layout structure + logo + signature UI shape +
  brand color. If it looks like a real screenshot, you went too far — simplify more.
- On top of that skeleton, apply this small shared tone (so a row of these cards looks
  like one family):
  1. Canvas exactly 1280x800, no browser chrome / window title bar / rounded outer
     corners; fill the whole canvas. The content MUST span the full height edge to
     edge — set html/body to exactly 1280x800 (margin:0; overflow:hidden) and make the
     root container width:100% height:100%, laying out sections as a flex column so the
     main panel stretches down near the bottom. Top and bottom margins must be small and
     roughly EQUAL (≤ ~40px each). Do NOT leave the bottom quarter as an empty background
     band (the v1 defect: content was only ~73% tall, pinned to the top).
     If instead the layout is a CENTERED main modal / dialog / card on a background
     (e.g. a sign-in dialog), the gradient may fill the canvas, but size the centered
     element large enough that the surrounding background frame stays modest — the modal
     should dominate the canvas (roughly span ≥ ~70% of each dimension; keep the
     background margin around it to ≤ ~15% per side). Do NOT float a small modal in a
     huge empty background.
  2. Background: soft diagonal gradient from a faint tint of the site's brand color
     into #f5f5f7.
  3. Cards/panels: white surface, 1px #e0e0e0 hairline border, 18px corner radius,
     only a very soft shadow (0 8px 24px rgba(0,0,0,0.04)).
  4. One accent hue, derived from the site's brand color, used consistently.
  5. Flat — no heavy gradients or drop shadows on elements; convey depth with
     hairlines and surface tones.
  6. Ghost everything else: simplified placeholder shapes, generous whitespace, no
     dense real content.

PRODUCE 4 CANDIDATES
- Write 4 standalone mockup HTML files (self-contained, inline CSS, no external assets
  beyond a system font stack). All 4 keep the SAME simplified layout skeleton — vary
  only accent intensity / gradient strength / mood, subtly. None should look like a
  different site, and none should look like a literal screenshot.
- Screenshot each at 1280x800 with headless Chrome, e.g.:
    <chrome> --headless --disable-gpu --hide-scrollbars \
      --screenshot=cand-1.png --window-size=1280,800 --force-device-scale-factor=1 \
      file://<abs path>/mock-1.html
  (use whatever Chrome/Chromium binary exists on this machine).
- Build a 2x2 contact sheet: a simple HTML grid embedding the 4 screenshots, screenshot
  it to contact.png so I can compare all four at once.

VERIFY EACH SCREENSHOT FILLS THE CANVAS (before showing me — never hand over a dead band)
- For each 1280x800 PNG, sample the average color of the bottom 120px and of a known-
  background corner (e.g. 4,4). If they are nearly identical, the bottom is an empty band:
  FIX the HTML (stretch the layout to 100% height / balance the margins) and RE-screenshot.
- Reject any candidate whose top OR bottom empty margin exceeds ~80px. Loop until the real
  content (panels/cards/ghost shapes) reaches close to the bottom edge with only small,
  balanced margins.
- Exception for the CENTERED-MODAL layout: the bottom band is legitimately background, so
  skip the bottom-band check and instead verify the modal's bounding box spans ≥ ~70% of
  width AND height (background frame ≤ ~15% per side). Reject and re-shoot if the modal is
  small relative to the canvas.

THEN STOP and show me the 4 candidates + contact sheet, and ask which one to keep.
Do not finalize or clean up until I pick. After I pick, keep only the chosen PNG and
tell me its path so I can copy it into the theme repo.
```

---

## 산출물 & 마무리
- 작업 산출물(대상 레포 안): `mock-1..4.html`, `cand-1..4.png`, `contact.png`. 선택 후 고른 PNG만 남기고 정리.
- 최종 파일명은 카드 타이틀이 된다(`gen-services.sh`가 파일명을 제목으로 사용). 예: `Mail.png` → "Mail". 하이픈/언더스코어는 공백으로 변환됨.
- 고른 PNG를 keycloak 레포 `resources/img/services/`에 두고 `gen-services.sh` 실행 → manifest 갱신 → 브라우저 새로고침.

## 검증 체크리스트
출력물이 아래를 만족하는지 확인:
- [ ] **스크린샷이 아니라 단순화된 목업으로 보인다** — 본문이 고스트 플레이스홀더로 비워져 있다.
- [ ] 그래도 레이아웃 구조·로고·시그니처 UI 형태·brand색으로 그 사이트임을 알 수 있다.
- [ ] 공통 톤 속성(1280×800·배경 그라데이션·hairline 카드·flat·단일 accent·고스트)이 적용됐다.
- [ ] **콘텐츠가 캔버스 전체 높이를 채운다** — 상·하 여백이 작고 균등(각 ≤ ~40px), 하단 1/4이 빈 배경 밴드가 아니다(v1 결함). 가운데 모달/다이얼로그형이면 모달이 캔버스 대부분(각 변 ≥ ~70%)을 차지하고 바깥 배경 여백이 크지 않다(각 변 ≤ ~15%).
- [ ] 바깥 브라우저 크롬/라운드 외곽이 없다.
- [ ] accent가 사이트 brand색에서 왔고 한 가지 hue로 통일됐다.
- [ ] 실제 사용자 데이터·시크릿이 들어가지 않았다(플레이스홀더만).
