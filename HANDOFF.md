# 핸드오프 — 기말 파이널 인터랙티브 웹앱

작성 2026-06-22 / 갱신 2026-06-23(13차). **새 세션은 이 파일을 먼저 읽고** 이어서 진행할 것.
루트: `/Users/dongwookkang/Library/Mobile Documents/com~apple~CloudDocs/2025년/2025 과외/1. 동대전고 과외/26년 고2/내신/1학기/기말고사/00_최종배포/finalcheck_webapp/`
같이 볼 문서: [README.md](README.md)(구조) · [SETUP.md](SETUP.md)(배포 절차). 메모리: `finalcheck-webapp`.

## 0. 한 줄 상태
학생용 인터랙티브 최종점검 웹앱(반응형 PWA, 정적 프론트=GitHub Pages + Apps Script 백엔드). **배포·백엔드 연결 완료, 라이브(캐시 v16).** 로그인·진도 서버 동기화, 세트 결과·오류 신고가 구글 시트에 자동 기록. **카카오 자동전송은 미사용 — 선생님이 시트로 확인.** 시험일 **2026-07-03(금)**.

- **학생 배포 URL**: https://dwookmike-droid.github.io/ddjg-final-2026/  (학생에겐 이 주소만 공유)
- **저장소**: `dwookmike-droid/ddjg-final-2026` (Public, Pages main `/(root)`). push에 PAT 필요(토큰 1회용, 폐기 권장).
- **백엔드**: Apps Script 웹앱 `/exec`가 `js/config.js`의 `APPS_SCRIPT_URL`에 연결(라이브). `apps_script/Code.gs`가 소스(편집 시 Apps Script에 붙여넣고 **배포 관리→편집→새 버전**으로 재배포해야 반영).
- **선생님 대시보드(스프레드시트)**: https://docs.google.com/spreadsheets/d/1VIzU3Ivk2U-OgplDzefvbK346V30w95g1A8SPpC8nmk/edit — 탭 **students·progress·results·reports**. URL 분실 시 `/exec?info=1` 또는 Apps Script `initSheet` 재실행 로그. 테스트 행(연결테스트·문구테스트·신고테스트·신고검증·점검)은 지워도 됨.

## 1. 학생 기능 (전부 라이브·검증됨)
- **선형 코스**: 강별 **2세트**(① 단어 ② 독해·문제[본문빈칸→독해→유형]) · 세트 끝에 결과 1회 기록. 좌상단 ☰ = **사이드 드로어**(전체 진도율·강별 목차·구간 점프).
- **레벨독해**: L0(쉬운 적응 지문·한글선지) ~ L1~L4(변형, **실제 원문 지문** 부착). 지문 **▶ 따라 읽기**(문장단위 TTS, 영어+한글 동시 강조). 단어 탭 → 뜻·발음·**🎯 이번 시험 포인트**.
- **실전 모의고사 30문항**(7유형, 배점 3.0~3.7) · 채점·예상등급 · 리뷰에 정답근거+풀이순서+함정.
- 단어장 사전 · 단어 테스트 4종 · 유형별 훈련 · 데일리 스피드 · 본문 빈칸 · 오답노트 · 학습현황(세트별 결과 누적) · 설정.
- **모든 문항에 ⚠️ 오류 신고**(이유+메모 → reports 탭). PIN 로그인+기기 동기화, D-day, 스트릭, 다크모드·글자크기, 오프라인 PWA.

## 2. 콘텐츠 현황
- 단어 921(6덱)·동반의어 478·발음 940 m4a.
- 레벨독해 20세트: L0 6(수동) + 변형 14(L1~L4, **원문 지문 부착 완료**).
- bank.json: speed 43 / cloze(본문빈칸) 108 / drill 587(기출 qz-* + 변형 var-* 275).
- guide.json: 유형 전략 11(7개 모의고사 유형 steps+warn) + 대표문항 가이드 15.
- wordpoints.json: 시험 포인트 19단어(변형 어휘 해설 추출).

## 3. 다음 할 일 / 미구현
1. **엘리트 통합 변형 6~9회 전사**(선택, 변형 시리즈 완결용). 노션 "엘리트 통합 변형 N회"(6 패러프레이징·7 구조해체·8 혼합킬러·9 크로스소스, 전범위 L4). 절차=§5의 build_variants.
2. **단어 게이미피케이션(가벼운)** — 기획안 보관(플랜 파일 `~/.claude/plans/floofy-gathering-wand.md`): 단어별 숙련도(미학습/학습중/익힘/마스터)·마스터리 대시보드·약점 집중복습·강별 배지. 기타 아이디어: 받아쓰기·슬래시 끊어읽기·SRS·데일리 미션.
3. **자투리**: 코스 본문지문(rpassage)에도 TTS 카라오케 적용(동일 `Karaoke` 재사용) · `var-E10-20`(엘리트 전범위 캡스톤, 단일지문 없어 무지문 1건 허용) · guide 문항별 풀이 추가(선택).
4. (선택) 카카오 자동전송을 켜려면 SETUP.md §C — 현재는 의도적으로 미사용.

## 4. 핵심 파일
```
index.html              진입(스크립트 ?v=N 캐시버스터)  ·  sw.js  SW(VER=현재 v16)
css/app.css             반응형·다크모드
js/config.js            ★ APPS_SCRIPT_URL(연결됨)·KAKAO_JS_KEY(빈)·EXAM_DATE
js/core.js              유틸·Store·API(submit/report/flush)·Audio2·Karaoke·Data(point 포함)
js/vocab.js             단어장·단어테스트4종·openWordSheet(시험포인트)
js/reading.js           레벨독해·tappableText·지문 TTS 카라오케
js/quiz.js              Bank·Guide·renderQuizItem(오류신고 버튼)·Drill·Speed·Cloze·Mock(30문항)
js/course.js            App셸·선형코스(2세트 빌드)·사이드 드로어(Menu)
js/app.js               로그인·Router·Runner·Results·오답노트·설정·ReportFlag·toast·boot
data/{vocab,synant,reading,bank,guide,wordpoints}.json  ·  audio/*.m4a
apps_script/Code.gs     백엔드(로그인·진도·submit·report·?info=1)
_build/build_{data,audio,cloze,drills,variants,wordpoints}.py  ·  variant_passages.py  ·  qc_check.py
```

## 5. 데이터 재생성 (필요할 때만)
```
python3 _build/build_data.py       # 단어암기지·동반의어 → vocab/synant.json
python3 _build/build_audio.py      # 발음 m4a + index.json (기존 건너뜀)
python3 _build/build_cloze.py      # 완벽분석본 → bank cloze (speed/drill 보존)
python3 _build/build_drills.py     # 올림포스 문제집 → bank drill (speed/cloze 보존)
python3 _build/build_variants.py   # 변형 회차 → reading L1~L4 + bank var-* (원문지문 부착; SHOW_RESOLVE=1 로 배정 로그)
python3 _build/build_wordpoints.py # 변형 어휘+synant → wordpoints.json
python3 _build/qc_check.py         # 배포 전 무결성 점검 (exit 0 = 통과)
```
- 변형 지문 추가/수정 = `_build/variant_passages.py`(강별 원문) + `build_variants.py`의 `SETS`/`OVERRIDES`만 손대고 재빌드.
- reading.json(L0 6세트)·guide.json·bank의 speed/시드는 **수동 작성** → 파서가 안 건드림. bank.json 직접 수정 금지(파서가 덮어씀).
- 변형 SETS 항목 = `(유형, stem, lead, [선지5], 정답0base, 해설)`. 난도 1·2회=L1/3=L2/4=L3/5회+엘리트=L4.

## 6. 빌드·검증·배포
- 로컬: preview MCP `finalcheck`(`00_최종배포/.claude/launch.json`) 또는 `python3 -m http.server 8731 --directory finalcheck_webapp`.
- preview로 end-to-end(로그인→각 모듈 채점→결과) + 콘솔 0 확인.
- **배포**: 코드/데이터 수정 시 **캐시 올림 필수** → `index.html`의 모든 `?v=N`과 `sw.js` `VER`를 **함께** +1(현재 **v16**). 그 뒤 `git add -A && git commit && git push`(remote origin, PAT 인증). 라이브 반영 `curl …/index.html | grep app.js?v=` 확인.
- **백엔드(Code.gs) 변경 시**: Apps Script에 붙여넣고 배포 관리→편집→**새 버전**→배포(같은 /exec 유지). 새 배포로 URL이 바뀌면 `config.js` 교체 후 재배포.

## 7. 알려진 gotcha
- **캐시**: iCloud+http.server에서 JS 편집이 SW/HTTP 캐시로 안 먹음 → `?v=N`+`VER` 함께 올리고, 프리뷰 검증 전 SW unregister + caches.delete 후 reload.
- **L0 독해 = 일부러 쉬운 적응 지문**(원문 아님, 한글선지 입문용). L1~L4가 실제 원문. 문항(변형)은 새로 제작한 것.
- **노션 OCR 오타**: 노션 텍스트 전사 시 한글 오타 섞임 → 보정.
- **PIN**: SHA-256 해시 경량 인증(과외용). 민감정보 금지.
- **로컬 모드**: `APPS_SCRIPT_URL` 비면 기기 저장만(현재는 연결됨). 

## 8. 결정 기록 (사용자 확정)
결과 전달 = **선생님이 구글 시트로 확인**(카카오 자동전송 미사용) · 호스팅=GitHub Pages+Apps Script · 식별=PIN+서버 동기화 · 핵심 UX=선형 코스(강별 2세트) · 콘텐츠=노션 변형+기출+로컬 보강 · 모의고사=30문항 · 오류신고=시트 reports.

## 9. 변경 이력 (요약)
- **5차** 배포준비(git init)·드릴 QC·변형 14세트 전사·guide 15.
- **7차** GitHub Pages 배포(라이브).
- **8차** 코스 사이드 드로어(진도율·목차·점프).
- **9차** 코스 강별 2세트화(58→12결과)·학습현황 세트결과·COURSE_VER=2.
- **10차** Apps Script 백엔드 연결(서버동기화·시트기록)·카카오 미사용 결정·문구 정정.
- **11차** 변형 원문 지문 복원(reading 14세트+bank, variant_passages.py·자동배정).
- **12차** 문항 오류 신고(reports 탭)·Code.gs report/?info=1·백엔드 신규 URL.
- **13차** 모의고사 30문항·지문 TTS 문장 카라오케·단어 시험포인트 팝업(wordpoints).

## 10. 참고 노션
허브 `269689d758bc…` · 강별 원문 "올림포스 N강 시험범위 원문" · 변형 "올림포스 N강 변형 N회"·"엘리트 통합 변형 N회"(허브 링크) · 기출 DNA `c5e202dee8c2…`.
