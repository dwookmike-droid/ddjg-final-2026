# 핸드오프 — 기말 파이널 인터랙티브 웹앱

작성 2026-06-22 / 갱신 2026-06-23(13차). **새 세션은 이 파일을 먼저 읽고** 이어서 진행할 것.
루트: `/Users/dongwookkang/Library/Mobile Documents/com~apple~CloudDocs/2025년/2025 과외/1. 동대전고 과외/26년 고2/내신/1학기/기말고사/00_최종배포/finalcheck_webapp/`
같이 볼 문서: [README.md](README.md)(구조) · [SETUP.md](SETUP.md)(배포 절차). 메모리: `finalcheck-webapp`.

## 0. 한 줄 상태
학생용 인터랙티브 최종점검 웹앱(반응형 PWA, 정적 프론트=GitHub Pages + Apps Script 백엔드). **배포·백엔드 연결 완료, 라이브=캐시 v16.** 로그인·진도 서버 동기화, 세트 결과·오류 신고가 구글 시트에 자동 기록. **카카오 자동전송은 미사용 — 선생님이 시트로 확인.** 시험일 **2026-07-03(금)**.

> **동기화 수정 완료(v20, 백엔드 재배포 불필요).** v17 레벨독해 재배치·가이드, v18 학습 가이드 탭, **v20 진도 유실 수정**: 재진입 시 **저장된 PIN으로 조용히 재로그인**해 서버 진도를 병합(기존 `login` 엔드포인트 재사용 → Apps Script 손 안 댐) + 종료 시 `sendBeacon` flush + 로그인 병합. (PIN을 localStorage에 저장 — 경량 인증 모델과 동일 수준.)

- **학생 배포 URL**: https://dwookmike-droid.github.io/ddjg-final-2026/  (학생에겐 이 주소만 공유)
- **저장소**: `dwookmike-droid/ddjg-final-2026` (Public, Pages main `/(root)`). push에 PAT 필요(토큰 1회용, 폐기 권장).
- **백엔드**: Apps Script 웹앱 `/exec`가 `js/config.js`의 `APPS_SCRIPT_URL`에 연결(라이브). `apps_script/Code.gs`가 소스(편집 시 Apps Script에 붙여넣고 **배포 관리→편집→새 버전**으로 재배포해야 반영).
- **선생님 대시보드(스프레드시트)**: https://docs.google.com/spreadsheets/d/1VIzU3Ivk2U-OgplDzefvbK346V30w95g1A8SPpC8nmk/edit — 탭 **students·progress·results·reports**. URL 분실 시 `/exec?info=1` 또는 Apps Script `initSheet` 재실행 로그. 테스트 행(연결테스트·문구테스트·신고테스트·신고검증·점검)은 지워도 됨.

## 1. 학생 기능 (라이브는 v16 기준 / v17~v18은 로컬·미배포 표기)
- **학습 가이드(v18, 신규·미배포)**: 길 잃은 학생용 튜토리얼. D-day + 오늘 추천 단계 + 6단계 로드맵(목적·진행상태·바로가기) + 앱 사용법. 첫 진입(진도 0) 학생에게 1회 자동 노출, 홈 카드·☰ 메뉴 상시 접근. 모듈=`js/guide.js`의 **`StudyGuide`**(주의: `quiz.js`의 `Guide`와 다름).
- **선형 코스**: 강별 **2세트**(① 단어 ② 독해·문제[본문빈칸→독해→유형]) · 세트 끝에 결과 1회 기록. 좌상단 ☰ = **사이드 드로어**(전체 진도율·강별 목차·구간 점프).
- **레벨독해**: L0(쉬운 적응 지문·한글선지) ~ L1~L4(변형, **실제 원문 지문** 부착). **문항이 해당 지문 바로 아래 배치 + 상단 지문별 안내 가이드 + 크로스·통합 섹션**(v17, 미배포). 지문 **▶ 따라 읽기**(문장단위 TTS=합성음성, 영어+한글 동시 강조). 단어 탭 → 뜻·발음·**🎯 이번 시험 포인트**.
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
0. **v18 배포** — 위 미배포 변경(레벨독해 재배치·가이드 + 학습 가이드 탭) `git push`. 푸시 전 캐시 v18 확인.
1. **원어민 TTS = 아카이빙(보류).** 지문 낭독을 원어민 음원으로 만드는 별도 탭(`js/listen.js`) 구상했으나 보류. 사유: ElevenLabs 무료 한도 10k자(전체 25k자 부족·초과과금 불가), macOS `say`는 무제한이나 음질이 원어민급 아님, VoiceBox는 GUI 반복작업 과다. 재개 시: 유료 TTS 키 또는 macOS 프리미엄 음성 설치 후 per-passage(고유 38지문) 생성 → 듣기 전용 탭. (`.gitignore`에 `_build/.ttskey` 무시 항목 유지)
2. **엘리트 통합 변형 6~9회 전사**(선택). 노션 "엘리트 통합 변형 N회". 절차=§5의 build_variants.
3. **단어 게이미피케이션(가벼운)** — 기획안 `~/.claude/plans/floofy-gathering-wand.md`.
4. **자투리**: 코스 본문지문(rpassage) TTS 카라오케 확대 · guide 문항별 풀이(선택) · 카카오 자동전송(SETUP.md §C, 의도적 미사용).

## 4. 핵심 파일
```
index.html              진입(스크립트 ?v=N 캐시버스터)  ·  sw.js  SW(VER=로컬 v18 / 라이브 v16)
css/app.css             반응형·다크모드(.guide-* / .rq-guide / .q-group-h 등 포함)
js/config.js            ★ APPS_SCRIPT_URL(연결됨)·KAKAO_JS_KEY(빈)·EXAM_DATE
js/core.js              유틸·Store·API(submit/report/flush)·Audio2·Karaoke·Data(point 포함)
js/guide.js             ★ StudyGuide — 학습 가이드 탭(로드맵·오늘추천·사용법). quiz.js의 Guide와 별개
js/vocab.js             단어장·단어테스트4종·openWordSheet(시험포인트)
js/reading.js           레벨독해(지문별 문항 그룹·가이드·크로스·_qcard)·tappableText·TTS 카라오케
js/quiz.js              Bank·Guide(유형전략)·renderQuizItem(오류신고)·Drill·Speed·Cloze·Mock(30문항)
js/course.js            App셸·선형코스(2세트 빌드)·사이드 드로어(Menu, 맨 위 학습 가이드)
js/app.js               로그인·Router(SUB.guide 포함)·Runner·Results·Home(가이드 카드)·boot2(첫진입 가이드)
data/{vocab,synant,reading,bank,guide,wordpoints}.json  ·  audio/*.m4a
apps_script/Code.gs     백엔드(로그인·진도·submit·report·?info=1)
_build/build_{data,audio,cloze,drills,variants,wordpoints}.py · variant_passages.py · remap_passages.py · qc_check.py
```

## 5. 데이터 재생성 (필요할 때만)
```
python3 _build/build_data.py       # 단어암기지·동반의어 → vocab/synant.json
python3 _build/build_audio.py      # 발음 m4a + index.json (기존 건너뜀)
python3 _build/build_cloze.py      # 완벽분석본 → bank cloze (speed/drill 보존)
python3 _build/build_drills.py     # 올림포스 문제집 → bank drill (speed/cloze 보존)
python3 _build/build_variants.py   # 변형 회차 → reading L1~L4 + bank var-* (원문지문 부착; SHOW_RESOLVE=1 로 배정 로그)
python3 _build/build_wordpoints.py # 변형 어휘+synant → wordpoints.json
python3 _build/remap_passages.py --apply  # ★ 문항→지문 인덱스 재매핑(passage 0-base·selfContained·cross). build_variants 뒤 필수
python3 _build/qc_check.py         # 배포 전 무결성 점검 (exit 0 = 통과)
```
- ⚠️ **`build_variants.py` 재실행 시 문항-지문 매핑이 초기화됨** → 직후 `remap_passages.py --apply` 꼭 실행(자기완결형 문항이 전부 지문0에 박히는 버그 보정 + 수동 OVERRIDES 28건 재적용). reading.json의 question.passage = **0-기반 지문 배열 인덱스**.
- 변형 지문 추가/수정 = `_build/variant_passages.py`(강별 원문) + `build_variants.py`의 `SETS`/`OVERRIDES`만 손대고 재빌드.
- reading.json(L0 6세트)·guide.json·bank의 speed/시드는 **수동 작성** → 파서가 안 건드림. bank.json 직접 수정 금지(파서가 덮어씀).
- 변형 SETS 항목 = `(유형, stem, lead, [선지5], 정답0base, 해설)`. 난도 1·2회=L1/3=L2/4=L3/5회+엘리트=L4.

## 6. 빌드·검증·배포
- 로컬: preview MCP `finalcheck`(`00_최종배포/.claude/launch.json`) 또는 `python3 -m http.server 8731 --directory finalcheck_webapp`.
- preview로 end-to-end(로그인→각 모듈 채점→결과) + 콘솔 0 확인.
- **배포**: 코드/데이터 수정 시 **캐시 올림 필수** → `index.html`의 모든 `?v=N`과 `sw.js` `VER`를 **함께** +1(로컬 **v18**, 라이브 v16 — v18 푸시 대기). 새 JS 파일 추가 시 `index.html`·`sw.js` SHELL 둘 다 등록. 그 뒤 `git add -A && git commit && git push`. 라이브 반영 `curl …/index.html | grep app.js?v=` 확인.
- **백엔드(Code.gs) 변경 시**: Apps Script에 붙여넣고 배포 관리→편집→**새 버전**→배포(같은 /exec 유지). 새 배포로 URL이 바뀌면 `config.js` 교체 후 재배포.

## 7. 알려진 gotcha
- **캐시**: iCloud+http.server에서 JS 편집이 SW/HTTP 캐시로 안 먹음 → `?v=N`+`VER` 함께 올리고, 프리뷰 검증 전 SW unregister + caches.delete 후 reload.
- **L0 독해 = 일부러 쉬운 적응 지문**(원문 아님, 한글선지 입문용). L1~L4가 실제 원문. 문항(변형)은 새로 제작한 것.
- **노션 OCR 오타**: 노션 텍스트 전사 시 한글 오타 섞임 → 보정.
- **PIN**: SHA-256 해시 경량 인증(과외용). 민감정보 금지.
- **로컬 모드**: `APPS_SCRIPT_URL` 비면 기기 저장만(현재는 연결됨).
- **전역 이름 충돌**: `quiz.js`에 이미 `Guide`(유형 전략 로더, `Guide.load()`)가 있음 → 학습 가이드는 **`StudyGuide`**. 새 전역 `const` 추가 시 중복 선언(스크립트 침묵 실패) 주의.
- **첫진입 자동 가이드**: 진도(results) 0 & `localStorage.ddj_guide_seen` 없을 때만 1회. 테스트하려면 `localStorage.removeItem('ddj_guide_seen')` + results 비우고 reload.

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
- **14차(로컬·미배포 v17)** 레벨독해 문항↔지문 재매핑(remap_passages.py, 57%→교정) + 지문별 문항 그룹 배치·상단 가이드·크로스 섹션·자기완결 태그.
- **15차(v18)** 학습 가이드 탭(StudyGuide: 로드맵·오늘추천·사용법, 첫진입 자동노출). 원어민 TTS는 아카이빙(§3-1).
- **16차(v20)** 진도 유실 수정: 재진입 시 **저장 PIN으로 silent 재로그인** → 서버 진도 `Store.mergeProgress` 병합(기존 login 재사용, 백엔드 무변경), 종료 시 `API.flushNow`(sendBeacon, visibilitychange/pagehide), 로그인 덮어쓰기→병합. (v19에서 시도한 getProgress 신규 엔드포인트 방식은 재배포 회피 위해 폐기.)

## 10. 참고 노션
허브 `269689d758bc…` · 강별 원문 "올림포스 N강 시험범위 원문" · 변형 "올림포스 N강 변형 N회"·"엘리트 통합 변형 N회"(허브 링크) · 기출 DNA `c5e202dee8c2…`.
