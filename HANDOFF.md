# 핸드오프 — 기말 파이널 인터랙티브 웹앱

작성 2026-06-22(갱신 2026-06-22 5차). **새 세션은 이 파일을 먼저 읽고** 이어서 진행할 것.
루트(절대경로): `/Users/dongwookkang/Library/Mobile Documents/com~apple~CloudDocs/2025년/2025 과외/1. 동대전고 과외/26년 고2/내신/1학기/기말고사/00_최종배포/finalcheck_webapp/`
같이 볼 문서: 이 폴더의 [README.md](README.md)(구조)·[SETUP.md](SETUP.md)(배포). 메모리: `finalcheck-webapp`.

## 0. 한 줄 상태
학생용 인터랙티브 최종점검 웹앱(반응형 PWA). **콘텐츠·기능 완성. git 초기화·로컬 v6 검증 완료, 남은 건 사용자 손이 필요한 GitHub Pages 푸시·Apps Script·카카오 인증.** 시험일 **2026-07-03(금)**.

## 0-1. 5차 진행분 (2026-06-22)
- **배포 준비**: `.gitignore` 추가 + `finalcheck_webapp/` **git init·첫 커밋(main)** 완료. 잡파일 제외, audio 941 포함, 추적 966파일. 절대경로 0건·SW/manifest 상대경로라 GitHub Pages 서브경로에서 코드 수정 불필요(점검 완료).
- **드릴 QC**: 정답 매핑 전수 검증 결과 불일치 0. 분류 의심 1건(`qz-13-84`)만 `build_drills.py` `group_of()`에 "쓰임"→어휘 규칙 추가 후 재빌드해 보정. 회귀 점검용 **`_build/qc_check.py` 신규**(explain↔answer·발문↔group·필드 결손 전수, 통과 시 exit 0). 현재 **오류 0·경고 0**.
- **L1~L4 막다른 길 폴리시**: 빈 레벨 카드를 학생용으로 교체(「유형별 훈련으로 가기」 버튼 = `Router.go('drill')`). 변형이 전사되지 않은 강에서 폴백.
- **guide 풀이 확장**: 대표 8 → 15문항. 빈출 빈칸추론·어법 7개(`qz-13-8`·`qz-15-7`·`qz-15-14`·`qz-13-2`·`qz-13-17`·`qz-15-3`·`qz-19-7`)에 문항별 💡힌트·📝풀이 추가.
- **변형 전사(L1~L4 실세트 채움)**: 노션 변형 회차 → `_build/build_variants.py`로 reading 세트(`passages=[]`, 문항 lead=인용) + bank `var-*` drill 동시 생성. **13강 변형 1~5회 완료**(난도매핑 1·2회=L1 / 3회=L2 / 4회=L3 / 5회=L4). reading L1 2·L2 1·L3 1·L4 1세트, drill var 100. reading.js가 지문 0 세트 대응(`set-sub`=N문항·변형 안내). **캐시 v6→v7**. preview 검증(각 레벨 채점 100점)·콘솔 0.

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
1. **배포 (최우선, 사용자 손 필요)** — git 초기화는 끝남. 남은 절차는 [SETUP.md](SETUP.md): ① GitHub 빈 저장소 생성→`git remote add origin`→`git push -u origin main`→Settings·Pages(main/root) ② Apps Script(`initSheet`→웹앱 배포→`config.js`의 `APPS_SCRIPT_URL` 채우고 재푸시) ③ 카카오(REST키·`getKakaoAuthUrl` 1회 인증). ①만 해도 로컬 기능 전부 동작(카톡·동기화만 빠짐).
2. ~~드릴 QC~~ **완료(5차)** — 정답 불일치 0, 분류 1건 보정. 재빌드/배포 전 `python3 _build/qc_check.py`로 회귀 점검(통과=exit 0).
3. **레벨독해 변형 추가 전사** — **완료**: 13강 변형 1~5회, 15강 변형 1·2·5회(15강 3·4회는 노션 미제작). **방법**: 노션 회차 fetch → `_build/build_variants.py`의 `SETS`에 `{set_id, level, unit, source, title, items:[(유형,stem,lead,[선지5],정답0base,해설),…]}` 추가 → `python3 _build/build_variants.py && python3 _build/qc_check.py`. 난도매핑 1·2회=L1/3=L2/4=L3/5회+엘리트=L4. 회차당 20문항이 reading 세트+`var-*` drill 동시 생성. OCR 오타 보정 필수. **남은 회차 노션 ID**:
   - 17강 변형: 2회 `b2c4412c-49b3-4f03-a4c1-9fc9651c63da` · 3회 `a3318db5-cab6-42f5-ba12-b833a675689f` · 4회 `666ab781-6bc9-403a-88f2-c0d4994709ac` · 5회 `9658bfde-216d-469a-b6ec-7027758a439c` (1회는 검색 재확인 필요)
   - 19강 변형 1회 `0ebf15f4-313c-4b1d-ae38-9afe4d037126` (15문항·체지방 vs 식량저장)
   - 엘리트 통합 변형 10회 `905b842f-1c4f-442a-bb6e-c5e82b48e850` (전범위·6~9회는 검색 필요) → L4
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
_build/build_variants.py 노션 변형 회차 → reading L1~L4 세트 + bank var-* drill (SETS에 데이터 누적)
_build/qc_check.py      bank.json 무결성 회귀 점검(배포 전 실행)
```

## 5. 데이터 재생성
```
python3 _build/build_data.py     # 단어암기지·동반의어 → vocab/synant.json
python3 _build/build_audio.py    # 발음 m4a + index.json (기존 건너뜀)
python3 _build/build_cloze.py    # 완벽분석본 → bank.json cloze (speed/drill 보존)
python3 _build/build_drills.py   # 올림포스 문제집 → bank.json drill (speed/cloze 보존)
python3 _build/build_variants.py # 변형 회차 → reading L1~L4 + bank var-* (L0/speed/cloze/qz/drl 보존)
python3 _build/qc_check.py        # 배포 전 무결성 회귀 점검 (exit 0 = 통과)
```
- 소스 위치: 단어=`../단어암기지_배포/`, cloze=`../올림포스/도입문장보정_최종본/완벽분석본_본문전용_수정완료/`(+완벽분석본), drill=`../올림포스_{13,15,17,19}강_배포/…_문제집_정답지포함.html`.
- reading.json(L0 6세트)·guide.json·bank의 speed/시드는 **수동 작성** → 파서가 안 건드림.

## 6. 빌드·검증
- 로컬: `python3 -m http.server 8731 --directory finalcheck_webapp` (preview MCP는 `00_최종배포/.claude/launch.json`의 `finalcheck` 사용).
- 검증은 preview MCP로 end-to-end 구동(로그인→코스→각 모듈 채점→결과). 콘솔 에러 0 확인.

## 7. 알려진 gotcha (중요)
- **캐시**: iCloud Drive + http.server 조합에서 JS 편집이 SW/HTTP 캐시로 안 먹는다. → JS/CSS 고치면 `index.html`의 `?v=N`과 `sw.js`의 `VER`를 **함께** 올린다(현재 **v6**). 프리뷰 검증 전 SW unregister + caches.delete 후 reload.
- **bank.json 직접 수정 금지**(cloze/qz 항목): 파서가 덮어씀. 문항별 힌트·풀이는 `data/guide.json`에, 수동 문항은 speed/시드처럼 별도 관리.
- **로컬 모드**: `config.js`의 `APPS_SCRIPT_URL`이 비면 학습·채점·오답은 기기 저장으로 정상, **카톡·기기동기화만 비활성**. 결과 화면에 "로컬 모드" 안내가 뜨면 정상.
- **노션 추출 OCR 오타**: 노션 텍스트를 reading.json 등으로 옮길 때 한글 오타가 섞임(예 옳았음/바닷길/도둑맞) → 전사 시 보정.
- **PIN**: SHA-256 해시 저장이나 경량 인증(과외용). 민감정보 금지.

## 8. 결정 기록 (사용자 확정)
카톡=자동 전송(Apps Script→카카오 나에게 보내기) · 호스팅=GitHub Pages+Apps Script · 식별=PIN+서버 동기화 · 핵심 UX=선형 코스(이전/다음) · 콘텐츠 소스=노션 균일 퀴즈 우선+로컬 보강 · 힌트/풀이=문항별 기본+비슷한 유형 더 풀기 · 실전 모의고사=제작.

## 9. 참고 노션 페이지
허브 `269689d758bc…` · L0 홈 `0984f52805…` · 학습지도(L0~L4) `56f88d46ab…` · 스피드퀴즈 `9a92eba0…` · 유형별훈련 `7aabfd43…` · 기출 DNA `c5e202dee8c2…` · 변형/엘리트는 허브에서 강·회차별 링크.
