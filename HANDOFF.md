# 핸드오프 — 기말 파이널 인터랙티브 웹앱

작성 2026-06-22. **새 세션은 이 파일을 먼저 읽고** 이어서 진행할 것.
루트(절대경로): `/Users/dongwookkang/Library/Mobile Documents/com~apple~CloudDocs/2025년/2025 과외/1. 동대전고 과외/26년 고2/내신/1학기/기말고사/00_최종배포/finalcheck_webapp/`
같이 볼 문서: 이 폴더의 [README.md](README.md)(구조)·[SETUP.md](SETUP.md)(배포). 메모리: `finalcheck-webapp`.

## 0. 한 줄 상태
학생용 인터랙티브 최종점검 웹앱(반응형 PWA). **콘텐츠·기능은 사실상 완성, 배포만 남음.** 시험일 **2026-07-03(금)**.

## 1. 무엇인가
PC·모바일·태블릿 동일 동작. 학생은 **이전/다음만 눌러 선형 코스**로 학습, 구간 끝낼 때마다 결과가 **선생님 카톡으로 자동 전송**(배포 후). 정적 프론트(GitHub Pages) + Apps Script 백엔드(시트 DB + 카카오 '나에게 보내기').

## 2. 지금까지 완료 (1~4차)
- **데이터**: 단어 921(6덱)·동반의어 478·발음 940(m4a)·레벨독해 **L0 6세트**(전 강/과, 한국어 선지)·문항은행 **bank.json 463**(스피드 43 / 본문빈칸 cloze 108 / 유형별 드릴 302 / 시드 10)·풀이가이드 **guide.json**(유형 전략 11 + 대표문항 힌트·풀이 8).
- **학생 화면(전부 동작 검증)**: 선형 코스(강별 단어→본문빈칸→독해→유형드릴→체크포인트=카톡) / 인터랙티브 단어장 / 단어 테스트 4종 / 유형별 훈련 / **실전 모의고사** / 데일리 스피드 퀴즈 / 본문 빈칸 / 레벨독해(L0) / 오답노트 / 학습현황 / 설정.
- **문항 유형 렌더러**: mc·**ox**·순서·삽입·**밑줄어법**·어휘·내용일치·연결사·**cloze 단답**.
- **힌트·풀이·비슷한문제**(전 문항): 💡 단계 힌트(학습=풀기 전 / 시험=채점 후) · 📝 풀이 보기(문항별 + 유형 단계 + 동대전고 경고) · 🔁 같은 유형 더 풀기.
- **실전 모의고사**: 기출 DNA 반영(선택형 20문항·배점 3.0~3.7·빈칸추론 킬러 마지막), 시험 모드→채점·예상 등급→복습 해설.
- **백엔드** `apps_script/Code.gs`: 로그인/PIN·진도 동기화·결과 기록·카카오 자동 전송 — **코드 완성, 배포 전**.
- PIN 로그인+기기 동기화, D-day, 스트릭, 다크모드·글자크기, 오프라인 PWA.

## 3. 다음 할 일 (우선순위)
1. **배포 (최우선)** — 현재 **로컬 모드**라 학생 접속·카톡·동기화 0. [SETUP.md](SETUP.md) 순서: ① GitHub Pages(git init→push→Pages) ② Apps Script(`initSheet`→웹앱 배포→`config.js`의 `APPS_SCRIPT_URL`) ③ 카카오(REST키·`getKakaoAuthUrl` 1회 인증). 내가 할 수 있는 것=git 준비·구조 점검, 사용자만 가능=계정/인증.
2. **드릴 QC** — 자동 파싱 드릴 302는 **유형 분류·정답 매핑 오류 가능**(예: 어법 조합형이 '내용일치'로 분류 → 힌트가 어긋남). 배포 전 유형별 표본 검수. 분류 보정은 `_build/build_drills.py`의 `group_of()` 또는 개별 수정.
3. **레벨독해 L1~L4 탭** — 현재 비어 있음(변형 내용은 유형별 드릴로 들어감). 채우려면 노션 변형 회차를 난도별 reading 세트로 전사. 막다른 길 폴리시(“유형별 훈련에서 풀어요” 안내)만 넣는 저비용 대안도 있음.
4. **엘리트 6~10회**(전범위 고난도, 노션 전용) → L4/킬러 드릴로. 미반영.
5. **guide.json 확장** — 현재 대표 8문항만 상세 힌트·풀이. 더 많은 문항에 문항별 힌트·풀이 추가(유형 전략은 전 문항 자동 적용 중).

## 4. 핵심 파일
```
index.html              진입(스크립트에 ?v=N 캐시버스터)
css/app.css             반응형·다크모드
js/config.js            ★배포 시 수정: APPS_SCRIPT_URL, KAKAO_JS_KEY, EXAM_DATE
js/core.js              유틸·상태(Store)·API·발음(Audio2)·데이터로더(Data)
js/vocab.js             단어장 사전 + 단어테스트4종 + openWordSheet
js/reading.js           레벨독해(L0~) + tappableText
js/quiz.js              Bank·Guide·renderQuizItem·QuizRunner·Similar·Drill·Speed·Cloze·Mock
js/course.js            App셸·선형코스(Course)·Menu
js/app.js               로그인·Router(SUB)·Runner·Results·오답노트·설정·boot
data/{vocab,synant,reading,bank,guide}.json
audio/*.m4a + index.json
apps_script/Code.gs     백엔드(붙여넣기용)
_build/build_{data,audio,cloze,drills}.py
```

## 5. 데이터 재생성
```
python3 _build/build_data.py     # 단어암기지·동반의어 → vocab/synant.json
python3 _build/build_audio.py    # 발음 m4a + index.json (기존 건너뜀)
python3 _build/build_cloze.py    # 완벽분석본 → bank.json cloze (speed/drill 보존)
python3 _build/build_drills.py   # 올림포스 문제집 → bank.json drill (speed/cloze 보존)
```
- 소스 위치: 단어=`../단어암기지_배포/`, cloze=`../올림포스/도입문장보정_최종본/완벽분석본_본문전용_수정완료/`(+완벽분석본), drill=`../올림포스_{13,15,17,19}강_배포/…_문제집_정답지포함.html`.
- reading.json(L0 6세트)·guide.json·bank의 speed/시드는 **수동 작성** → 파서가 안 건드림.

## 6. 빌드·검증
- 로컬: `python3 -m http.server 8731 --directory finalcheck_webapp` (preview MCP는 `00_최종배포/.claude/launch.json`의 `finalcheck` 사용).
- 검증은 preview MCP로 end-to-end 구동(로그인→코스→각 모듈 채점→결과). 콘솔 에러 0 확인.

## 7. 알려진 gotcha (중요)
- **캐시**: iCloud Drive + http.server 조합에서 JS 편집이 SW/HTTP 캐시로 안 먹는다. → JS/CSS 고치면 `index.html`의 `?v=N`과 `sw.js`의 `VER`를 **함께** 올린다(현재 **v5**). 프리뷰 검증 전 SW unregister + caches.delete 후 reload.
- **bank.json 직접 수정 금지**(cloze/qz 항목): 파서가 덮어씀. 문항별 힌트·풀이는 `data/guide.json`에, 수동 문항은 speed/시드처럼 별도 관리.
- **로컬 모드**: `config.js`의 `APPS_SCRIPT_URL`이 비면 학습·채점·오답은 기기 저장으로 정상, **카톡·기기동기화만 비활성**. 결과 화면에 "로컬 모드" 안내가 뜨면 정상.
- **노션 추출 OCR 오타**: 노션 텍스트를 reading.json 등으로 옮길 때 한글 오타가 섞임(예 옳았음/바닷길/도둑맞) → 전사 시 보정.
- **PIN**: SHA-256 해시 저장이나 경량 인증(과외용). 민감정보 금지.

## 8. 결정 기록 (사용자 확정)
카톡=자동 전송(Apps Script→카카오 나에게 보내기) · 호스팅=GitHub Pages+Apps Script · 식별=PIN+서버 동기화 · 핵심 UX=선형 코스(이전/다음) · 콘텐츠 소스=노션 균일 퀴즈 우선+로컬 보강 · 힌트/풀이=문항별 기본+비슷한 유형 더 풀기 · 실전 모의고사=제작.

## 9. 참고 노션 페이지
허브 `269689d758bc…` · L0 홈 `0984f52805…` · 학습지도(L0~L4) `56f88d46ab…` · 스피드퀴즈 `9a92eba0…` · 유형별훈련 `7aabfd43…` · 기출 DNA `c5e202dee8c2…` · 변형/엘리트는 허브에서 강·회차별 링크.
