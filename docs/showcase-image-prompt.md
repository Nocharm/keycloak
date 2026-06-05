# 쇼케이스 이미지 톤 통일 프롬프트

실제 서비스 화면(원본)을, 이 레포 기본 목업(`resources/img/services/*.png`)과 **같은 톤**으로 다시 그려
쇼케이스 카드들의 느낌을 통일하기 위한 프롬프트. **원본의 정체성(브랜드·레이아웃·핵심 요소)은 유지**한다.

## 사용법
Claude에게 아래 3가지를 함께 전달:
1. **원본 이미지** — 실제 서비스 스크린샷 (첫 번째 첨부)
2. **참고 이미지** — 이 레포 `themes/custom/login/resources/img/services/` 의 목업 중 하나 (두 번째 첨부, 톤 기준)
3. **아래 프롬프트**

결과(1280×800)는 `resources/img/services/<ServiceName>.png` 로 저장 → `gen-services.sh` 실행(상세: `showcase-images.md`).

---

## 목업 스타일 스펙 (참고 이미지의 톤)
- 캔버스 **1280×800**, 바깥 라운드/브라우저 크롬 없음(카드 프레임은 테마가 따로 그림).
- 배경: accent 색의 옅은 틴트 → `#f5f5f7` 로 가는 **부드러운 대각 그라데이션**.
- 상단 앱바(~64px): 반투명 흰색 + 하단 1px `#e0e0e0` hairline. 좌측에 **라운드 사각 로고(반경 8px, accent)** + 서비스명(18px/600), 우측에 흰 **검색 pill**(1px `#e0e0e0`) + **원형 아바타(accent)**.
- 본문: 큰 타이틀(~46px/600, 타이트 자간) + 조용한 회색 서브타이틀(`#7a7a7a`).
- 카드: 흰 배경 + **1px `#e0e0e0` hairline** + **반경 18px** + **아주 옅은 섀도만**(`0 8px 24px rgba(0,0,0,.04)`). KPI 숫자는 accent.
- 그래프: **윗모서리 둥근 막대**, accent 색, opacity ~0.85.
- 타이포: SF Pro/시스템 산세리프. ink `#1d1d1f`, 보조 회색 `#7a7a7a`. 여백 넉넉.
- **Flat** — 요소에 진한 그라데이션/그림자 금지, hairline·surface 단계로 깊이 표현.
- accent는 **하나의 색**으로 통일(로고·아바타·KPI·막대 모두 동일 hue). (기본 목업: Dashboard 파랑, Analytics 보라, Mail 청록, Calendar 주황)

---

## 프롬프트 (복사용)

```
You are restyling a product UI screenshot into a unified design system, for a row
of "connected service" cards shown on a login screen.

Inputs:
- IMAGE 1 (ORIGINAL): a real screenshot of the actual service — defines WHAT to show.
- IMAGE 2 (REFERENCE): a mockup in the target style — defines HOW it should look.

Task: produce ONE 1280×800 image that re-renders IMAGE 1's interface in the exact
visual language of IMAGE 2.

PRESERVE from the ORIGINAL (keep the service recognizable — this is required):
- Overall layout and structure (header, main regions, column arrangement).
- Brand identity: the service name/wordmark and logo shape. Derive the single
  accent color from the original's primary brand color.
- The real labels, key data/numbers, and any signature UI that makes this service
  distinctive (e.g. a calendar grid, an inbox list, a specific chart). Keep its
  reading order and rough proportions.

ADOPT from the REFERENCE (unify the tone):
- Light, clean, flat Apple-style aesthetic.
- Background: soft diagonal gradient from a faint tint of the accent color into #f5f5f7.
- Top app bar (~64px): translucent white with a 1px #e0e0e0 bottom hairline;
  left = rounded-square logo (8px radius) in the accent color + service name
  (~18px semibold); right = a white pill search field (1px #e0e0e0) + a round
  accent avatar.
- Content: a large title (~46px, semibold, tight tracking) with a quiet grey
  (#7a7a7a) subtitle; cards on white surfaces with 1px #e0e0e0 hairline borders,
  18px corner radius, and only a very soft shadow (0 8px 24px rgba(0,0,0,0.04)).
- Charts/figures use rounded-top bars in the accent color at ~85% opacity; KPI
  numbers in the accent color.
- Typography: SF Pro / system sans-serif; ink #1d1d1f, secondary grey #7a7a7a;
  generous whitespace.
- Flat: no heavy gradients on elements, no drop shadows except the subtle card
  shadow; convey depth with hairlines and surface tones only.

Color: use exactly ONE accent hue (derived from the original brand) for the logo,
avatar, KPI numbers and chart bars — matching how the reference uses a single hue.

Output: a single 1280×800 image, no browser chrome / window title bar, no rounded
outer corners, filling the whole canvas. Match the reference's spacing and balance
while keeping the original's content and identity.
```

---

## 원본 특징 보존 체크리스트
출력물이 아래를 만족하는지 확인:
- [ ] 서비스명/로고가 원본 그대로 알아볼 수 있다.
- [ ] 원본의 핵심 화면 요소(고유 UI)가 남아 있다.
- [ ] accent 색이 원본 브랜드에서 왔고, 한 가지 hue로 통일됐다.
- [ ] 톤(배경 그라데이션·hairline 카드·소프트 섀도·flat)이 참고 이미지와 일치한다.
- [ ] 1280×800, 바깥 크롬/라운드 없음.

> 톤이 더 정확히 맞아야 하면 참고 이미지를 **같은 계열 색**(원본 브랜드와 가까운)으로 골라 전달하면 결과가 안정적이다.
