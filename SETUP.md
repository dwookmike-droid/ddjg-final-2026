# 배포·설정 가이드 (동대전고2 기말 파이널 웹앱)

순서대로 따라 하면 ① 학생 링크 배포 ② 진도 서버 동기화 ③ 결과 자동 카톡까지 켜집니다.
**①만 해도 앱은 완전히 작동**합니다(로컬 모드). ②③은 카톡 전송·기기 동기화를 위한 것.

---

## A. 학생 링크 배포 — GitHub Pages (무료)

1. `finalcheck_webapp/` 폴더를 GitHub 저장소로 올립니다.
   ```
   cd finalcheck_webapp
   git init && git add . && git commit -m "기말 파이널 웹앱"
   # GitHub에서 빈 저장소 생성 후
   git remote add origin https://github.com/<아이디>/<저장소>.git
   git branch -M main && git push -u origin main
   ```
2. 저장소 **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main` / `/(root)` → Save.
3. 1~2분 뒤 주소가 나옵니다: `https://<아이디>.github.io/<저장소>/`
   이 주소를 학생에게 카톡으로 보내면 됩니다. (PC·모바일·태블릿 동일)
   - 모바일에서 **홈 화면에 추가**하면 앱처럼 전체화면으로 열립니다(PWA).

> 음성 파일(`audio/` 32MB)도 함께 푸시됩니다. 용량이 부담되면 빼도 되고,
> 그 경우 발음은 브라우저 내장 음성으로 자동 대체됩니다.

---

## B. 서버 동기화 + 결과 기록 — Google Apps Script (무료)

1. [script.google.com](https://script.google.com) → **새 프로젝트** → `apps_script/Code.gs` 내용을 통째로 붙여넣기.
2. 함수 선택에서 **`initSheet`** 실행 → 권한 허용. 실행 로그(보기 → 로그)에 **스프레드시트 URL**이 찍힙니다.
   여기에 학생 명단·진도·결과가 자동으로 쌓입니다(튜터 대시보드).
3. 우측 상단 **배포 → 새 배포 → 유형: 웹 앱**
   - 실행 계정: **나**
   - 액세스 권한: **모든 사용자**
   → 배포하면 `.../exec` 로 끝나는 **웹 앱 URL**이 나옵니다. 복사.
4. `js/config.js`의 `APPS_SCRIPT_URL`에 그 URL을 붙여넣고 다시 푸시(A-1의 commit/push 반복).
   → 이제 로그인이 서버에 저장되고, 같은 이름·반·PIN으로 **어느 기기서나 진도가 이어집니다.**

---

## C. 결과 자동 카톡 (튜터 '나에게 보내기')

> 학생이 한 구간을 끝낼 때마다 선생님 카톡(나와의 채팅)으로 점수·오답 카드가 자동 전송됩니다.
> 학생은 카카오가 필요 없고, **튜터 계정 1회 인증**만 하면 됩니다. (개인용 '나에게 보내기'는 카카오 검수 불필요)

1. [developers.kakao.com](https://developers.kakao.com) → **내 애플리케이션 → 추가**.
2. **앱 키 → REST API 키** 복사.
3. Apps Script → **프로젝트 설정(⚙️) → 스크립트 속성**에 추가:
   - `KAKAO_REST_KEY` = 위 REST API 키
   - `KAKAO_REDIRECT` = B-3의 웹 앱 `.../exec` URL (그대로)
   - `APP_HOST` = A-3의 깃헙 페이지 주소(선택, 카드 링크용)
4. 카카오 콘솔 → **카카오 로그인** 활성화 ON → **Redirect URI**에 `KAKAO_REDIRECT`와 동일한 `.../exec` URL 등록.
5. 카카오 콘솔 → **카카오 로그인 → 동의항목 → '카카오톡 메시지 전송(`talk_message`)'** 사용 설정.
6. Apps Script에서 **`getKakaoAuthUrl`** 실행 → 로그의 URL을 **튜터 카카오 계정으로** 열어 동의.
   "카카오 연결 완료!" 가 뜨면 끝. (refresh_token이 자동 저장됨)
7. **`sendTestKakao`** 실행 → 본인 카톡에 테스트 메시지가 오면 정상.

이후 코드를 수정했으면 **배포 → 배포 관리 → 편집(연필) → 새 버전**으로 갱신하세요.

---

## D. 마무리 점검 (`js/config.js`)

| 항목 | 설명 |
|---|---|
| `APPS_SCRIPT_URL` | B-3 웹 앱 URL. 비우면 로컬 모드. |
| `KAKAO_JS_KEY` | (선택) 학생용 '카톡 공유' 버튼. 자동 전송과 무관, 없어도 됨. |
| `EXAM_DATE` | 영어 시험일. 기본 `2026-07-03`. |
| `CLASSES` | 반 목록. 기본 `["S반","A반"]`. |

---

## 콘텐츠 추가 (독해 문제 확장)

`data/reading.json`의 `sets` 배열에 같은 형식으로 항목을 추가하면 앱에 바로 나타납니다.
`level`을 `L1`~`L4`로 주면 해당 레벨 탭에 들어갑니다(영어 선지도 동일 구조).
노션의 L0 나머지 5세트·변형·엘리트를 이 형식으로 옮기면 레벨별 독해가 가득 찹니다.

## 데이터 재생성 (단어가 바뀌었을 때)

```
python3 _build/build_data.py     # 단어암기지·동반의어 HTML → vocab.json·synant.json
python3 _build/build_audio.py    # 발음 m4a + index.json (기존 파일은 건너뜀)
```

## 참고
- PIN은 SHA-256 해시로 저장되지만 경량 인증입니다(과외용). 민감정보 저장은 피하세요.
- Apps Script 무료 한도(하루 실행/UrlFetch)는 개인 과외 규모에 충분합니다.
