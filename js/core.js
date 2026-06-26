/* ===========================================================
 *  core.js — 공통 유틸 · 상태 · 저장소 · 백엔드 API · 발음
 * =========================================================== */
const $  = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const el = (tag, props = {}, kids = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach(c => {
    if (c == null) return;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return n;
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, m =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (arr, n) => shuffle(arr).slice(0, n);
const fmtTime = s => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m ? `${m}분 ${s % 60}초` : `${s}초`; };
const todayStr = () => new Date().toISOString().slice(0, 10);

/* ---- 채점 정규화 (관대한 매칭) ---- */
function normEn(s) {
  return String(s || "").toLowerCase().trim()
    .replace(/^(to |a |an |the )/g, "")
    .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}
function normKo(s) {
  return String(s || "").trim()
    .replace(/\(.*?\)/g, "")           // 괄호 주석 제거
    .replace(/[~\s.,·/]/g, "")          // 공백·구두점 제거
    .replace(/하다$|되다$/,"");         // 동사 어미 관대화
}
// 정답(콤마/슬래시로 여러 뜻) 중 하나라도 맞으면 정답
function koMatch(input, answer) {
  const got = normKo(input);
  if (!got) return false;
  const cands = String(answer).split(/[,/]/).map(normKo).filter(Boolean);
  return cands.some(c => c && (c === got || c.includes(got) || got.includes(c)));
}
function enMatch(input, answer, alts = []) {
  const got = normEn(input);
  if (!got) return false;
  return [answer, ...alts].some(a => normEn(a) === got);
}

/* ===========================================================
 *  STATE — 학생 세션 + 진도
 * =========================================================== */
const Store = {
  KEY: "ddj_session_v1",
  state: {
    student: null,          // {name, class, sid}
    progress: {             // 모듈별 상태
      vocabSeen: {},        // en -> 회독수
      starred: {},          // en -> true (모르는 단어)
      wrong: [],            // 오답 누적 [{type, en, ko, q, when}]
      results: [],          // 제출 이력 요약
      streak: { last: null, days: 0 }
    },
    queue: [],              // 오프라인 제출 대기열
    reportQueue: []         // 오류 신고 대기열(오프라인/실패 시 보관)
  },
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) Object.assign(this.state, JSON.parse(raw));
    } catch (e) {}
    return this.state;
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.state)); } catch (e) {}
    API.syncProgress();   // 서버 동기화(throttled)
  },
  reset() {
    localStorage.removeItem(this.KEY);
    this.state.student = null;
    this.state.progress = { vocabSeen: {}, starred: {}, wrong: [], results: [], streak: { last: null, days: 0 } };
    this.state.queue = [];
    this.state.reportQueue = [];
  },
  bumpStreak() {
    const t = todayStr(), st = this.state.progress.streak;
    if (st.last === t) return;
    const yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    st.days = (st.last === yest) ? st.days + 1 : 1;
    st.last = t;
  },
  addWrong(items) {
    const w = this.state.progress.wrong;
    items.forEach(it => {
      // 같은 단어/문항 중복은 최신으로 갱신
      const i = w.findIndex(x => x.type === it.type && x.key === it.key);
      if (i >= 0) w.splice(i, 1);
      w.push({ ...it, when: Date.now() });
    });
    if (w.length > 500) w.splice(0, w.length - 500);
  },
  clearWrong(pred) {
    this.state.progress.wrong = this.state.progress.wrong.filter(x => !pred(x));
  },

  // 서버 진도를 로컬과 '병합'(어느 쪽도 잃지 않게). 덮어쓰기 금지.
  mergeProgress(remote) {
    if (!remote || typeof remote !== "object") return;
    const p = this.state.progress;
    p.vocabSeen = p.vocabSeen || {}; p.starred = p.starred || {};
    p.wrong = p.wrong || []; p.results = p.results || [];
    // 단어 회독수: 더 많은 쪽
    const rv = remote.vocabSeen || {};
    for (const k in rv) p.vocabSeen[k] = Math.max(p.vocabSeen[k] || 0, rv[k] || 0);
    // 모르는 단어: 합집합
    Object.assign(p.starred, remote.starred || {});
    // 오답: key별 합집합(최신 when 유지)
    if (Array.isArray(remote.wrong)) {
      const by = {};
      [...p.wrong, ...remote.wrong].forEach(w => {
        const k = (w.type || "") + "|" + (w.key || "");
        if (!by[k] || (w.when || 0) >= (by[k].when || 0)) by[k] = w;
      });
      p.wrong = Object.values(by).sort((a, b) => (a.when || 0) - (b.when || 0));
      if (p.wrong.length > 500) p.wrong = p.wrong.slice(-500);
    }
    // 결과: (section|when|score) 기준 합집합·중복제거
    if (Array.isArray(remote.results)) {
      const seen = {}, out = [];
      [...(p.results || []), ...remote.results].forEach(r => {
        const k = (r.section || "") + "|" + (r.when || 0) + "|" + (r.score || 0);
        if (!seen[k]) { seen[k] = 1; out.push(r); }
      });
      p.results = out.sort((a, b) => (a.when || 0) - (b.when || 0));
    }
    // 코스 진행: 더 앞선 위치 / 완료구간 OR
    if (typeof remote.courseIdx === "number") p.courseIdx = Math.max(p.courseIdx || 0, remote.courseIdx);
    if (remote.courseVer != null) p.courseVer = remote.courseVer;
    if (remote.courseDone) { p.courseDone = p.courseDone || {}; for (const k in remote.courseDone) if (remote.courseDone[k]) p.courseDone[k] = remote.courseDone[k]; }
    // 스트릭: 더 최근 날짜
    if (remote.streak && (!p.streak || String(remote.streak.last || "") > String(p.streak.last || ""))) p.streak = remote.streak;
  }
};

/* ===========================================================
 *  API — Apps Script 백엔드 (없으면 로컬 전용)
 *  CORS 회피: text/plain 으로 POST (preflight 없음)
 * =========================================================== */
const API = {
  get url() { return (CONFIG.APPS_SCRIPT_URL || "").trim(); },
  get enabled() { return !!this.url; },
  _syncT: null,

  async _post(action, payload) {
    if (!this.enabled) return { ok: false, offline: true };
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...payload })
      });
      return await res.json();
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  async login(name, klass, pin) {
    if (!this.enabled) {
      // 로컬 전용: 그냥 통과
      return { ok: true, sid: "local:" + name, progress: null, local: true };
    }
    return this._post("login", { name, class: klass, pin });
  },

  // 진도 저장 — 잦은 호출을 묶어서(throttle) 전송
  syncProgress() {
    if (!this.enabled || !Store.state.student) return;
    clearTimeout(this._syncT);
    this._syncT = setTimeout(() => {
      this._post("saveProgress", {
        sid: Store.state.student.sid,
        progress: Store.state.progress
      });
    }, 1500);
  },

  // 서버 진도 읽기(sid로). 재진입 시 최신본 병합용.
  async getProgress(sid) {
    if (!this.enabled || !sid) return null;
    const r = await this._post("getProgress", { sid });
    return (r && r.ok) ? (r.progress || null) : null;
  },

  // 앱을 떠날 때 즉시 서버로 진도 전송(throttle 우회). sendBeacon 우선(언로드에도 도달).
  flushNow() {
    if (!this.enabled || !Store.state.student) return;
    clearTimeout(this._syncT);
    const payload = JSON.stringify({ action: "saveProgress", sid: Store.state.student.sid, progress: Store.state.progress });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(this.url, new Blob([payload], { type: "text/plain;charset=utf-8" }));
      } else {
        this._post("saveProgress", { sid: Store.state.student.sid, progress: Store.state.progress });
      }
    } catch (e) {}
  },

  // 섹션 제출 — 시트 기록 + 카톡 자동 전송. 실패 시 큐에 보관.
  async submit(result) {
    Store.state.progress.results.push({
      section: result.section, score: result.score, total: result.total,
      pct: result.pct, when: Date.now()
    });
    if (!this.enabled) { Store.save(); return { ok: false, offline: true }; }
    const r = await this._post("submit", {
      sid: Store.state.student.sid,
      student: Store.state.student.name,
      class: Store.state.student.class,
      result
    });
    if (!r.ok) { Store.state.queue.push(result); }
    Store.save();
    return r;
  },

  async flushQueue() {
    if (!this.enabled || !Store.state.queue.length) return;
    const q = Store.state.queue.slice();
    Store.state.queue = [];
    for (const result of q) {
      const r = await this._post("submit", {
        sid: Store.state.student.sid,
        student: Store.state.student.name,
        class: Store.state.student.class, result
      });
      if (!r.ok) Store.state.queue.push(result);
    }
    Store.save();
  },

  // 문항 오류 신고 — reports 시트에 기록. 실패/오프라인 시 큐에 보관.
  async report(rep) {
    const st = Store.state.student || {};
    const payload = { itemId: rep.itemId, where: rep.where || "", stem: (rep.stem || "").slice(0, 80),
                      reason: rep.reason || "", sid: st.sid || "", student: st.name || "", class: st.class || "" };
    if (!Store.state.reportQueue) Store.state.reportQueue = [];
    if (!this.enabled) { Store.state.reportQueue.push(payload); Store.save(); return { ok: false, offline: true }; }
    const r = await this._post("report", payload);
    if (!r || !r.ok) { Store.state.reportQueue.push(payload); Store.save(); }
    return r || { ok: false };
  },

  async flushReports() {
    if (!this.enabled || !Store.state.reportQueue || !Store.state.reportQueue.length) return;
    const q = Store.state.reportQueue.slice();
    Store.state.reportQueue = [];
    for (const p of q) {
      const r = await this._post("report", p);
      if (!r || !r.ok) Store.state.reportQueue.push(p);
    }
    Store.save();
  }
};

/* ===========================================================
 *  AUDIO — 발음 (사전생성 mp3 우선, 없으면 Web Speech)
 * =========================================================== */
const Audio2 = {
  cache: {},
  manifest: null,        // audio/index.json (생성된 mp3 목록)
  async init() {
    try {
      const r = await fetch("audio/index.json");
      if (r.ok) this.manifest = await r.json();
    } catch (e) { this.manifest = null; }
  },
  fileFor(word) {
    const slug = String(word).toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (this.manifest && this.manifest[slug]) return "audio/" + this.manifest[slug];
    return null;
  },
  speak(word) {
    const f = this.fileFor(word);
    if (f) {
      const a = this.cache[f] || (this.cache[f] = new Audio(f));
      a.currentTime = 0; a.play().catch(() => this._tts(word));
      return;
    }
    this._tts(word);
  },
  _tts(word) {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(String(word));
    u.lang = "en-US"; u.rate = 0.9;
    const vs = speechSynthesis.getVoices().filter(v => /en[-_]US/i.test(v.lang));
    if (vs[0]) u.voice = vs[0];
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
};

/* ===========================================================
 *  KARAOKE — 지문 문장단위 TTS 따라읽기 (Web Speech)
 * =========================================================== */
const Karaoke = {
  active: false,
  splitSents(str) {
    return (String(str || "").match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map(s => s.trim()).filter(Boolean);
  },
  _voice() {
    try { return (speechSynthesis.getVoices() || []).filter(v => /en[-_]US/i.test(v.lang))[0] || null; }
    catch (e) { return null; }
  },
  play(sents, onSent, onEnd) {
    if (!("speechSynthesis" in window)) { alert("이 브라우저는 음성 읽기를 지원하지 않아요."); return false; }
    this.stop();
    this.active = true;
    let i = 0;
    const next = () => {
      if (!this.active || i >= sents.length) { this.active = false; onEnd && onEnd(); return; }
      const u = new SpeechSynthesisUtterance(sents[i]);
      u.lang = "en-US"; u.rate = 0.9;
      const v = this._voice(); if (v) u.voice = v;
      const cur = i;
      u.onstart = () => { if (this.active) onSent && onSent(cur); };
      u.onend = () => { i++; next(); };
      u.onerror = () => { i++; next(); };
      speechSynthesis.speak(u);
    };
    next();
    return true;
  },
  stop() {
    this.active = false;
    try { speechSynthesis.cancel(); } catch (e) {}
  }
};

/* ===========================================================
 *  DATA — JSON 로더
 * =========================================================== */
const Data = {
  vocab: null, synant: null, reading: null,
  async load() {
    const [v, s, r] = await Promise.all([
      fetch("data/vocab.json").then(x => x.json()),
      fetch("data/synant.json").then(x => x.json()),
      fetch("data/reading.json").then(x => x.json())
    ]);
    this.vocab = v; this.synant = s; this.reading = r;
    this.wordpoints = await fetch("data/wordpoints.json").then(x => x.json()).catch(() => ({}));
    // 평탄화: 모든 단어 색인
    this.allWords = [];
    this.byEn = {};
    v.decks.forEach(d => d.passages.forEach(p => p.words.forEach(w => {
      const item = { ...w, deck: d.id, deckLabel: d.label, subject: d.subject, passage: p.tag };
      this.allWords.push(item);
      const k = w.en.toLowerCase();
      if (!this.byEn[k]) this.byEn[k] = item;   // 첫 등장 우선
    })));
  },
  sa(en) { return this.synant[String(en).toLowerCase()] || null; },
  point(en) { return (this.wordpoints && this.wordpoints[String(en).toLowerCase()]) || null; }
};
