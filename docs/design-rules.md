# 디자인 규칙 (로그인 테마)

이 커스텀 로그인 테마(`themes/custom/login`)의 디자인은
[claude_design_template](https://github.com/Nocharm/claude_design_template) 의
`.claude/design/styling-rules.md` · `apple.md` 를 따른다. 핵심만 요약:

1. **토큰 우선** — 색·반경·모션은 `resources/css/custom.css` 상단의 CSS 변수
   (`--accent`, `--ink`, `--hairline`, `--surface`, `--radius-pill`, `--spring` …)만 쓴다.
   값은 apple.css 원본과 동기화하며 컴포넌트 규칙에서 임의로 바꾸지 않는다.
2. **raw hex 금지** — 규칙 본문에 `#xxxxxx` 직접 사용 금지. 새 색이 필요하면 변수로 먼저 정의 후 `var(...)` 로 참조.
3. **Flat — shadow 제한** — 카드·버튼·입력칸·헤더는 그림자 없이 **hairline border + surface 단계**로 깊이 표현.
   그림자는 floating overlay(모달·드롭다운, 우측 서비스 쇼케이스 카드처럼 떠 있는 요소)에만 허용.
4. **UI 텍스트 영어** — 버튼·라벨·헤딩·placeholder 는 영어 기본
   (제목 `Login`, placeholder `Enter username or email` / `Enter password`).
   한글은 사용자 입력 데이터·내부 문서(`docs/**`, `PROGRESS.md`)에 한정.
5. **비밀번호 토글** — press-and-hold 노출 패턴(누르는 동안만 평문, 떼면 다시 마스킹).
   `resources/js/password-hold.js` 로 구현(클릭 토글 대체). 버튼은 `data-password-hold`.

상세 출처: 템플릿 repo `.claude/design/styling-rules.md`(§1~§8), `.claude/design/apple.md`(토큰 원본 스펙).
