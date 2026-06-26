/* ============================================================
 *  동대전고2 기말 파이널 — 백엔드 (Google Apps Script)
 *  기능: 로그인/PIN · 진도 동기화 · 결과 기록(시트) · 카카오 '나에게 보내기' 자동 전송
 *
 *  ── 최초 설정 순서 (SETUP.md 참고) ──
 *  1) 이 코드를 새 Apps Script 프로젝트에 붙여넣기
 *  2) initSheet() 1회 실행 → 스프레드시트 자동 생성(로그에 URL 표시)
 *  3) 스크립트 속성에 KAKAO_REST_KEY 저장 (setProp 사용 또는 프로젝트 설정)
 *  4) '배포 > 새 배포 > 웹 앱' (실행: 나, 액세스: 모든 사용자) → /exec URL 복사
 *     → 그 URL을 KAKAO_REDIRECT 속성과 카카오 Redirect URI에 등록, 그리고 프론트 config.js APPS_SCRIPT_URL 에 입력
 *  5) getKakaoAuthUrl() 실행 → 로그의 URL 접속해 동의 → 자동으로 refresh_token 저장
 * ============================================================ */

var PROP = PropertiesService.getScriptProperties();

/* ---------- 라우팅 ---------- */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var out;
    switch (body.action) {
      case 'login':        out = apiLogin(body); break;
      case 'saveProgress': out = apiSaveProgress(body); break;
      case 'submit':       out = apiSubmit(body); break;
      case 'report':       out = apiReport(body); break;
      case 'admin':        out = apiAdmin(body); break;
      default:             out = { ok: false, reason: 'unknown_action' };
    }
    return json(out);
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// 카카오 OAuth 콜백 + 헬스체크
function doGet(e) {
  if (e && e.parameter && e.parameter.code) {
    return ContentService.createTextOutput(kakaoExchangeCode(e.parameter.code));
  }
  if (e && e.parameter && e.parameter.info) {   // 시트 URL 조회(대시보드 찾기용)
    var id = PROP.getProperty('SHEET_ID');
    return json({ ok: !!id, sheetUrl: id ? ('https://docs.google.com/spreadsheets/d/' + id + '/edit') : null });
  }
  return ContentService.createTextOutput('OK · 동대전고2 기말 파이널 백엔드 작동 중');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- 시트 ---------- */
function ss() {
  var id = PROP.getProperty('SHEET_ID');
  if (!id) throw new Error('initSheet()를 먼저 실행하세요.');
  return SpreadsheetApp.openById(id);
}
function sheet(name, headers) {
  var s = ss().getSheetByName(name);
  if (!s) { s = ss().insertSheet(name); s.appendRow(headers); }
  return s;
}
function initSheet() {
  var id = PROP.getProperty('SHEET_ID');
  var doc = id ? SpreadsheetApp.openById(id)
              : SpreadsheetApp.create('동대전고2 기말 파이널 — 학습기록');
  PROP.setProperty('SHEET_ID', doc.getId());
  if (!PROP.getProperty('PIN_SALT')) PROP.setProperty('PIN_SALT', Utilities.getUuid());
  var st = doc.getSheetByName('students') || doc.insertSheet('students');
  if (st.getLastRow() === 0) st.appendRow(['sid', 'name', 'class', 'pin_hash', 'created', 'last_login']);
  var pg = doc.getSheetByName('progress') || doc.insertSheet('progress');
  if (pg.getLastRow() === 0) pg.appendRow(['sid', 'progress_json', 'updated']);
  var rs = doc.getSheetByName('results') || doc.insertSheet('results');
  if (rs.getLastRow() === 0) rs.appendRow(['ts', 'sid', 'name', 'class', 'section', 'kind', 'score', 'total', 'pct', 'duration_s', 'wrong']);
  var df = doc.getSheetByName('Sheet1'); if (df) doc.deleteSheet(df);
  Logger.log('스프레드시트 준비 완료: ' + doc.getUrl());
}

/* ---------- 로그인 ---------- */
function hashPin(pin) {
  var salt = PROP.getProperty('PIN_SALT') || '';
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin);
  return raw.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function apiLogin(b) {
  var name = String(b.name || '').trim(), klass = String(b['class'] || '').trim(), pin = String(b.pin || '');
  if (!name || !/^\d{4}$/.test(pin)) return { ok: false, reason: 'invalid' };
  var st = sheet('students', ['sid', 'name', 'class', 'pin_hash', 'created', 'last_login']);
  var data = st.getDataRange().getValues();
  var sid = (name + '|' + klass).toLowerCase();
  var ph = hashPin(pin);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === sid) {
      if (String(data[i][3]) !== ph) return { ok: false, reason: 'pin' };
      st.getRange(i + 1, 6).setValue(new Date());
      return { ok: true, sid: sid, isNew: false, progress: loadProgress(sid) };
    }
  }
  // 신규 등록
  st.appendRow([sid, name, klass, ph, new Date(), new Date()]);
  return { ok: true, sid: sid, isNew: true, progress: null };
}

/* ---------- 진도 ---------- */
function loadProgress(sid) {
  var pg = sheet('progress', ['sid', 'progress_json', 'updated']);
  var data = pg.getDataRange().getValues();
  for (var i = 1; i < data.length; i++)
    if (String(data[i][0]) === sid) { try { return JSON.parse(data[i][1]); } catch (e) { return null; } }
  return null;
}
function apiSaveProgress(b) {
  var sid = String(b.sid || ''); if (!sid) return { ok: false };
  var pg = sheet('progress', ['sid', 'progress_json', 'updated']);
  var data = pg.getDataRange().getValues();
  var jsonStr = JSON.stringify(b.progress || {});
  for (var i = 1; i < data.length; i++)
    if (String(data[i][0]) === sid) { pg.getRange(i + 1, 2, 1, 2).setValues([[jsonStr, new Date()]]); return { ok: true }; }
  pg.appendRow([sid, jsonStr, new Date()]);
  return { ok: true };
}

/* ---------- 결과 제출 + 카톡 ---------- */
function apiSubmit(b) {
  var r = b.result || {};
  var rs = sheet('results', ['ts', 'sid', 'name', 'class', 'section', 'kind', 'score', 'total', 'pct', 'duration_s', 'wrong']);
  var wrongTxt = (r.wrong || []).map(function (w) { return '· ' + w.q + ' → ' + w.answer; }).join('\n');
  rs.appendRow([new Date(), b.sid, b.student, b['class'], r.section, r.kind || '', r.score, r.total, r.pct, r.duration || '', wrongTxt]);

  var msg = '📚 [' + b.student + ' / ' + b['class'] + ']\n'
    + r.section + '\n'
    + '점수 ' + r.score + '/' + r.total + '  (' + r.pct + '점)\n'
    + '소요 ' + Math.round((r.duration || 0) / 60 * 10) / 10 + '분'
    + (r.pct >= 80 ? '  ✅ 통과' : '  ⚠️ 복습 권장');
  if (wrongTxt) {
    var lines = wrongTxt.split('\n');
    msg += '\n\n[오답 ' + lines.length + ']\n' + lines.slice(0, 12).join('\n');
    if (lines.length > 12) msg += '\n…외 ' + (lines.length - 12) + '개';
  }
  var sent = sendKakaoMemo(msg, 'https://' + (PROP.getProperty('APP_HOST') || ''));
  return { ok: true, kakao: sent };
}

/* ---------- 관리자(선생님) 대시보드 ---------- */
function apiAdmin(b) {
  var key = String(b.key || '');
  var admin = PROP.getProperty('ADMIN_KEY');
  if (!admin || key !== admin) return { ok: false, reason: 'auth' };
  // 학생 목록 (pin_hash 제외)
  var st = sheet('students', ['sid', 'name', 'class', 'pin_hash', 'created', 'last_login']).getDataRange().getValues();
  var students = [];
  for (var i = 1; i < st.length; i++) {
    if (!st[i][0]) continue;
    students.push({ sid: String(st[i][0]), name: st[i][1], 'class': st[i][2], created: st[i][4], last_login: st[i][5] });
  }
  // 결과 (오답 본문 제외 — 가벼운 요약만)
  var rs = sheet('results', ['ts', 'sid', 'name', 'class', 'section', 'kind', 'score', 'total', 'pct', 'duration_s', 'wrong']).getDataRange().getValues();
  var results = [];
  for (var j = 1; j < rs.length; j++) {
    if (!rs[j][1]) continue;
    results.push({ ts: rs[j][0], sid: String(rs[j][1]), name: rs[j][2], 'class': rs[j][3], section: rs[j][4], kind: rs[j][5], score: rs[j][6], total: rs[j][7], pct: rs[j][8] });
  }
  return { ok: true, students: students, results: results, now: new Date() };
}
// 관리자 키 설정(1회 실행) — 따옴표 안 값을 원하는 키로 바꾼 뒤 실행
function setAdminKey() { PROP.setProperty('ADMIN_KEY', 'CHANGE_ME_관리자키'); Logger.log('ADMIN_KEY 설정됨'); }

/* ---------- 문항 오류 신고 ---------- */
function apiReport(b) {
  var rs = sheet('reports', ['ts', 'sid', 'name', 'class', 'itemId', 'where', 'reason', 'stem', 'status']);
  rs.appendRow([new Date(), b.sid, b.student, b['class'], b.itemId, b.where, b.reason, b.stem, '신규']);
  return { ok: true };
}

/* ---------- 카카오 '나에게 보내기' ---------- */
function getKakaoAccessToken() {
  var rest = PROP.getProperty('KAKAO_REST_KEY');
  var refresh = PROP.getProperty('KAKAO_REFRESH_TOKEN');
  if (!rest || !refresh) return null;
  var res = UrlFetchApp.fetch('https://kauth.kakao.com/oauth/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'refresh_token', client_id: rest, refresh_token: refresh }
  });
  var d = JSON.parse(res.getContentText());
  if (d.access_token) {
    if (d.refresh_token) PROP.setProperty('KAKAO_REFRESH_TOKEN', d.refresh_token); // 갱신되면 교체
    return d.access_token;
  }
  return null;
}
function sendKakaoMemo(text, link) {
  var token = getKakaoAccessToken();
  if (!token) return false;
  var template = {
    object_type: 'text', text: text,
    link: { web_url: link || 'https://www.kakao.com', mobile_web_url: link || 'https://www.kakao.com' }
  };
  var res = UrlFetchApp.fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'post', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + token },
    payload: { template_object: JSON.stringify(template) }
  });
  return res.getResponseCode() === 200;
}

/* ---------- 카카오 최초 인증 (1회) ---------- */
function getKakaoAuthUrl() {
  var rest = PROP.getProperty('KAKAO_REST_KEY');
  var redirect = PROP.getProperty('KAKAO_REDIRECT'); // = 웹앱 /exec URL
  if (!rest || !redirect) { Logger.log('KAKAO_REST_KEY / KAKAO_REDIRECT 속성을 먼저 설정하세요.'); return; }
  var url = 'https://kauth.kakao.com/oauth/authorize?response_type=code'
    + '&client_id=' + encodeURIComponent(rest)
    + '&redirect_uri=' + encodeURIComponent(redirect)
    + '&scope=talk_message';
  Logger.log('아래 URL에 접속해 동의하세요(튜터 계정):\n' + url);
}
function kakaoExchangeCode(code) {
  var rest = PROP.getProperty('KAKAO_REST_KEY');
  var redirect = PROP.getProperty('KAKAO_REDIRECT');
  var res = UrlFetchApp.fetch('https://kauth.kakao.com/oauth/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'authorization_code', client_id: rest, redirect_uri: redirect, code: code }
  });
  var d = JSON.parse(res.getContentText());
  if (d.refresh_token) {
    PROP.setProperty('KAKAO_REFRESH_TOKEN', d.refresh_token);
    return '카카오 연결 완료! 이제 결과가 자동으로 전송됩니다. 이 창을 닫으세요.';
  }
  return '연결 실패: ' + res.getContentText();
}

/* ---------- 유틸: 속성 설정 도우미 ---------- */
function setProp() {
  // 필요 값을 여기서 1회 채워 실행하거나, 프로젝트 설정 > 스크립트 속성에서 직접 입력
  // PROP.setProperty('KAKAO_REST_KEY', '여기에_REST_API_키');
  // PROP.setProperty('KAKAO_REDIRECT', '여기에_웹앱_exec_URL');
  // PROP.setProperty('APP_HOST', 'your-id.github.io/finalcheck_webapp');
  Logger.log(JSON.stringify(PROP.getProperties()));
}
function sendTestKakao() { Logger.log(sendKakaoMemo('테스트 메시지 — 백엔드 연결 확인', '')); }
