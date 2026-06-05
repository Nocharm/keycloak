# 로그인 화면 쇼케이스 카드 고정(pin) 안내 — 연동 사이트 담당자용

이 SSO 로그인 화면 우측에는 "연결된 서비스" 미리보기 카드들이 부채꼴로 쌓여 자동 회전합니다.
기본값은 **로그인할 때마다 맨 앞 카드가 무작위**입니다. 특정 서비스 카드를 **항상 맨 앞에 고정**하고 싶으면,
여러분 앱이 보내는 **로그인(인증) 요청 URL 끝에 쿼리 파라미터 하나만 추가**하면 됩니다.

> 이 기능은 **순수 시각 효과**입니다. 인증·토큰·보안에는 전혀 영향이 없고, 값이 틀려도 로그인은 정상 동작합니다(그냥 무작위로 표시).

## 무엇을 하면 되나

평소 사용자를 Keycloak 로그인으로 보낼 때 만들어지는 인증 요청 URL —

```
https://<keycloak-host>/realms/<realm>/protocol/openid-connect/auth?client_id=...&redirect_uri=...&response_type=code&scope=openid&code_challenge=...&code_challenge_method=S256
```

여기에 **`&showcase=<서비스이름>`** 만 덧붙입니다.

```
...&code_challenge_method=S256&showcase=Dashboard
```

- `<서비스이름>` = 카드 제목(또는 이미지 파일명에서 `.png`를 뗀 값). 대소문자 무시.
- 이름에 **공백이 있으면 URL 인코딩**: `AI Portal` → `showcase=AI%20Portal`.

현재 사용할 수 있는 이름: `AI Portal`, `Analytics`, `Calendar`, `Dashboard`, `Mail`
(쇼케이스 이미지가 추가/변경되면 이름도 바뀝니다 — 최신 목록은 SSO 운영자에게 문의.)

## 어디에 추가하나 — 스택별 예시

대부분의 OIDC 라이브러리는 "인증 요청에 추가 파라미터"를 넣는 옵션이 있습니다. 그 옵션에 `showcase`를 넣으면 됩니다.

- **keycloak-js**
  ```js
  keycloak.login({ /* ...기존 옵션... */, showcase: "Dashboard" });
  // 어댑터 버전에 따라 안 먹으면, createLoginUrl 결과에 "&showcase=Dashboard"를 직접 append.
  ```
- **oidc-client-ts / oidc-react**
  ```js
  userManager.signinRedirect({ extraQueryParams: { showcase: "Dashboard" } });
  ```
- **NextAuth (Keycloak provider)**
  ```js
  KeycloakProvider({ /* ... */, authorization: { params: { showcase: "Dashboard" } } })
  ```
- **Spring Security (OAuth2 Client)** — `OAuth2AuthorizationRequestResolver`에서 추가 파라미터 주입:
  ```java
  .additionalParameters(p -> p.put("showcase", "Dashboard"))
  ```
- **그 외 / 직접 링크**: 인증 요청 URL을 직접 만든다면 끝에 `&showcase=Dashboard`만 붙이면 됩니다.

## 동작 규칙 (요약)

| 상황 | 결과 |
|------|------|
| 인증 요청에 `showcase=<맞는 이름>` 포함 | 그 카드가 **맨 앞 고정** |
| 파라미터 없음 / 이름 오타 / 빈 값 | **매 로드 무작위** (조용히 폴백) |
| 잘못 줘서 깨질 위험 | 없음 — 로그인은 항상 정상 |

## 테스트 방법

1. 여러분 앱의 로그인 링크에 `&showcase=<이름>`을 붙여 브라우저로 엽니다.
2. 로그인 화면 우측 **맨 앞 카드가 그 서비스인지** 확인합니다.
3. 파라미터를 빼고 여러 번 새로고침 → 맨 앞 카드가 **매번 바뀌면(무작위)** 정상입니다.

> 로그인까지 완료할 필요는 없습니다. 로그인 **화면만 떠도** 카드 순서는 확인됩니다.

**로컬 demo 기준 예시 링크** (Keycloak이 `localhost:8080`, `demo` realm으로 떠 있을 때):

- 고정(Dashboard 앞):
  ```
  http://localhost:8080/realms/demo/protocol/openid-connect/auth?client_id=account-console&redirect_uri=http://localhost:8080/realms/demo/account/&response_type=code&scope=openid&code_challenge=wU1VR6XbvvTpIxubYXUcAoLIdNKFzuTMGdMB5lUs4DI&code_challenge_method=S256&showcase=Dashboard
  ```
- 무작위(파라미터 없음, 새로고침마다 바뀜):
  ```
  http://localhost:8080/realms/demo/protocol/openid-connect/auth?client_id=account-console&redirect_uri=http://localhost:8080/realms/demo/account/&response_type=code&scope=openid&code_challenge=wU1VR6XbvvTpIxubYXUcAoLIdNKFzuTMGdMB5lUs4DI&code_challenge_method=S256
  ```
  `showcase=Dashboard`를 `Analytics`·`Calendar`·`Mail`·`AI%20Portal`로 바꿔 다른 카드도 확인하세요.
  (위 `code_challenge`는 화면 확인용 고정값입니다. 운영 host/realm에서는 주소만 바꾸면 됩니다.)

## 자주 묻는 점

- **PKCE가 뭔지 몰라도 되나요?** 네. 표준 Keycloak/OIDC 라이브러리를 쓰면 PKCE(`code_challenge`)는 자동 처리됩니다. 여러분은 `showcase` 파라미터만 추가하면 됩니다.
- **로그인 페이지 주소에 `?showcase=`만 직접 쳐도 되나요?** 안 됩니다. 반드시 여러분 앱이 만드는 **정식 인증 요청**(client_id·redirect_uri·PKCE 포함)에 얹혀야 로그인 페이지까지 전달됩니다. 그렇지 않으면 무작위로 표시됩니다.
- **보안에 영향 없나요?** 없습니다. Keycloak은 모르는 쿼리 파라미터를 인증에 사용하지 않고 무시합니다. 토큰·서명·리다이렉트 검증과 무관합니다.
- **로그인 실패 후 다시 떴을 때 고정이 풀려요.** 폼 재렌더 시 파라미터가 빠질 수 있어 그때는 무작위가 됩니다. 시각 효과라 무해합니다.
