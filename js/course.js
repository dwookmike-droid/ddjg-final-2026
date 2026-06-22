/* ===========================================================
 *  course.js — 선형 학습 코스 (이전/다음으로 쭉 이어가기)
 *  흐름: 구간 인트로 → 단어 플래시카드 → 미니 퀴즈 → 지문 → 지문 문제 → 구간 완료(카톡 전송)
 * =========================================================== */

/* ---------- 앱 셸 (헤더 / 본문 / 하단 이전·다음) ---------- */
const App = {
  header: null, main: null, footer: null, prog: null, titleEl: null, leftBtn: null,
  init() {
    const app = $("#app"); app.innerHTML = "";
    this.leftBtn = el("button", { class: "appbar-btn", html: "☰", onclick: () => this._left() });
    this.titleEl = el("div", { class: "appbar-title" });
    this.header = el("header", { class: "appbar" }, [
      this.leftBtn, this.titleEl, el("div", { class: "appbar-btn ghost" })
    ]);
    this.prog = el("div", { class: "appbar-prog-fill" });
    const progBar = el("div", { class: "appbar-prog" }, [this.prog]);
    this.main = el("main", { class: "main course-main", id: "main" });
    this.prevBtn = el("button", { class: "nav-prev", html: "← 이전", onclick: () => Course.prev() });
    this.nextBtn = el("button", { class: "nav-next", html: "다음 →", onclick: () => Course.next() });
    this.footer = el("footer", { class: "footer-nav" }, [this.prevBtn, this.nextBtn]);
    app.appendChild(this.header); app.appendChild(progBar);
    app.appendChild(this.main); app.appendChild(this.footer);
    Router.main = this.main;
    this._mode = "course";
  },
  _left() { this._mode === "course" ? Menu.open() : Course.render(); },
  enterCourse() {
    this._mode = "course";
    this.leftBtn.innerHTML = "☰"; this.footer.classList.remove("hidden");
    this.header.parentElement.querySelector(".appbar-prog").classList.remove("hidden");
  },
  enterSub(title) {
    this._mode = "sub";
    this.leftBtn.innerHTML = "←"; this.titleEl.textContent = title || "";
    this.footer.classList.add("hidden");
    this.header.parentElement.querySelector(".appbar-prog").classList.add("hidden");
    this.main.scrollTo(0, 0); window.scrollTo(0, 0);
  },
  setHeader(title) { this.titleEl.textContent = title; },
  setProgress(p) { this.prog.style.width = Math.max(0, Math.min(100, p)) + "%"; }
};

/* ---------- 사이드 드로어 (진도율 · 범위 목차 · 이동 · 메뉴) ---------- */
const Menu = {
  open() {
    const pg = Store.state.progress;
    const done = pg.courseDone || {};
    const total = Math.max(1, Course.sections.length);
    const doneN = Course.sections.filter((_, i) => done[i]).length;
    const pct = Math.round(doneN / total * 100);
    const deckLabel = id => ((Data.vocab.decks.find(d => d.id === id) || {}).label) || id;
    const statusOf = (sec, i) => (Course.idx >= sec.start && Course.idx < sec.end) ? "current"
      : (done[i] ? "done" : "todo");
    const DOT = { current: "▶", done: "✓", todo: "○" };

    const item = (icon, label, fn) => el("button", { class: "menu-item", onclick: () => { close(); fn(); } },
      [el("span", { class: "mi-ic", text: icon }), el("span", { text: label })]);

    // 목차(범위) — 강(deck)별 그룹, 현재 강만 펼침
    const groups = [];
    Course.sections.forEach((sec, i) => {
      let g = groups[groups.length - 1];
      if (!g || g.deck !== sec.deck) { g = { deck: sec.deck, items: [] }; groups.push(g); }
      g.items.push({ sec, i });
    });
    const toc = el("div", { class: "toc" });
    groups.forEach(g => {
      const gDone = g.items.filter(x => statusOf(x.sec, x.i) === "done").length;
      const hasCur = g.items.some(x => statusOf(x.sec, x.i) === "current");
      const body = el("div", { class: "toc-group-body" + (hasCur ? "" : " hidden") },
        g.items.map(({ sec, i }) => {
          const stt = statusOf(sec, i);
          return el("button", { class: "toc-sec" + (stt === "current" ? " current" : ""), onclick: () => { close(); Course.jumpTo(i); } }, [
            el("span", { class: "toc-dot " + stt, text: DOT[stt] }),
            el("span", { class: "toc-sec-label", text: sec.short || sec.label })
          ]);
        }));
      const chev = el("span", { class: "toc-chev", text: hasCur ? "▾" : "▸" });
      const head = el("button", { class: "toc-group-head", onclick: () => { chev.textContent = body.classList.toggle("hidden") ? "▸" : "▾"; } }, [
        el("span", { class: "toc-group-name", text: deckLabel(g.deck) }),
        el("span", { class: "toc-group-cnt", text: `${gDone}/${g.items.length}` }),
        chev
      ]);
      toc.appendChild(el("div", { class: "toc-group" }, [head, body]));
    });

    const node = el("div", { class: "drawer course-drawer" }, [
      el("div", { class: "menu-title", text: `${Store.state.student.name} · ${Store.state.student.class}` }),
      el("div", { class: "toc-overall" }, [
        el("div", { class: "toc-overall-top" }, [el("span", { text: "전체 진도" }), el("b", { text: pct + "%" })]),
        el("div", { class: "toc-bar" }, [el("div", { class: "toc-bar-fill" })]),
        el("div", { class: "toc-steps", text: `${doneN} / ${total}구간 완료` })
      ]),
      el("div", { class: "toc-cap", text: "범위 · 눌러서 이동" }),
      toc,
      el("div", { class: "drawer-divider" }),
      item("▶", "이어서 학습", () => Course.render()),
      item("📊", "학습 현황", () => openSub("학습 현황", r => Home.render(r))),
      item("📖", "단어장 사전", () => openSub("단어장 사전", r => VocabDict.render(r))),
      item("📝", "단어 시험 따로 풀기", () => openSub("단어 시험", r => VocabTest.setup(r))),
      item("🔥", "유형별 훈련", () => openSub("유형별 훈련", r => Drill.render(r))),
      item("🏆", "실전 모의고사", () => openSub("실전 모의고사", r => Mock.render(r))),
      item("⚡", "데일리 스피드 퀴즈", () => openSub("데일리 스피드 퀴즈", r => Speed.render(r))),
      item("✍️", "본문 빈칸 채우기", () => openSub("본문 빈칸 채우기", r => Cloze.render(r))),
      item("📚", "독해 모음", () => openSub("독해 시험", r => Reading.render(r))),
      item("📕", "오답노트", () => openSub("오답노트", r => WrongNote.render(r))),
      item("⚙️", "설정", () => openSub("설정", r => Settings.render(r))),
      item("🔄", "코스 처음부터", () => { if (confirm("코스를 처음부터 다시 시작할까요? (오답·점수 기록은 유지)")) { Store.state.progress.courseIdx = 0; Store.state.progress.courseDone = {}; Store.save(); Course.idx = 0; Course.render(); } })
    ]);
    var close = showSheet(node, { side: true });
    requestAnimationFrame(() => {
      const f = node.querySelector(".toc-bar-fill"); if (f) f.style.width = pct + "%";
      const cur = node.querySelector(".toc-sec.current"); if (cur) cur.scrollIntoView({ block: "center" });
    });
  }
};
function openSub(title, renderFn) { App.enterSub(title); App.main.innerHTML = ""; renderFn(App.main); }

/* ---------- 코스 ---------- */
const Course = {
  steps: [], sections: [], idx: 0, ans: {}, submitted: {}, secStart: {}, BATCH: 8,

  start() {
    this.build();
    this.idx = Math.min(Store.state.progress.courseIdx || 0, this.steps.length - 1);
    App.enterCourse();
    this.render();
  },

  build() {
    if (this.steps.length) return;
    const order = ["txt4", "txt5", "oly13", "oly15", "oly17", "oly19"];
    const decks = order.map(id => Data.vocab.decks.find(d => d.id === id)).filter(Boolean);
    const SEC_BATCHES = 3;   // 한 구간 = 8단어×3배치 ≈ 24단어 (끝나면 카톡 전송)
    decks.forEach(deck => {
      const pool = deck.passages.flatMap(p => p.words).filter(w => w.en && w.ko);
      // 8개씩 배치로 자르고, 3배치씩 묶어 '구간'으로
      const batches = [];
      for (let i = 0; i < pool.length; i += this.BATCH) batches.push(pool.slice(i, i + this.BATCH));
      const partN = Math.ceil(batches.length / SEC_BATCHES);
      for (let b = 0, part = 1; b < batches.length; b += SEC_BATCHES, part++) {
        const secIdx = this.sections.length;
        const label = partN > 1 ? `${deck.label} (${part}/${partN})` : deck.label;
        const start = this.steps.length;
        this.push({ type: "intro", sec: secIdx, label });
        batches.slice(b, b + SEC_BATCHES).forEach(batch => {
          batch.forEach(w => this.push({ type: "flash", sec: secIdx, word: w }));
          sample(batch, Math.min(3, batch.length)).forEach(w =>
            this.push({ type: "quiz", sec: secIdx, q: this.mcq(w, pool) }));
        });
        this.push({ type: "checkpoint", sec: secIdx });
        this.sections.push({ label, deck: deck.id, kind: "vocab", short: partN > 1 ? `단어 ${part}/${partN}` : "단어", start, end: this.steps.length });
      }
      // 본문 빈칸 구간 (해당 강 cloze 문항이 있을 때)
      this._bankSection(deck, "cloze", `${deck.label} 본문 빈칸`, "cloze");
      // 독해 세트는 각각 별도 구간
      Data.reading.sets.filter(rs => rs.source === deck.label).forEach((rs, ri) => {
        const secIdx = this.sections.length, start = this.steps.length;
        const label = `${deck.label} 독해`;
        this.push({ type: "intro", sec: secIdx, label, reading: true });
        rs.passages.forEach(p => this.push({ type: "rpassage", sec: secIdx, set: rs, p }));
        rs.questions.forEach(q => this.push({ type: "rquiz", sec: secIdx, set: rs, q }));
        this.push({ type: "checkpoint", sec: secIdx });
        this.sections.push({ label, deck: deck.id, kind: "reading", short: `독해 ${ri + 1} · ${rs.level}`, start, end: this.steps.length });
      });
      // 유형별 드릴 구간 (해당 강 태그 문항이 있을 때)
      this._bankSection(deck, "drill", `${deck.label} 유형 훈련`, "drill");
    });
  },
  _bankSection(deck, track, label, kind) {
    if (typeof Bank === "undefined" || !Bank.data) return;
    let items = Bank.items(track).filter(i => i.unit === deck.label);
    if (!items.length) return;
    const cap = kind === "drill" ? 8 : 12;          // 코스 구간은 표본만(전체는 메뉴에서)
    if (items.length > cap) items = sample(items, cap);
    const secIdx = this.sections.length, start = this.steps.length;
    this.push({ type: "intro", sec: secIdx, label, kind });
    items.forEach(it => this.push({ type: "qitem", sec: secIdx, item: it }));
    this.push({ type: "checkpoint", sec: secIdx });
    this.sections.push({ label, deck: deck.id, kind, short: kind === "cloze" ? "본문 빈칸" : "유형 훈련", start, end: this.steps.length });
  },
  push(step) { step._i = this.steps.length; this.steps.push(step); },

  mcq(w, pool) {
    const seen = new Set([w.ko]);
    const distract = shuffle(pool).filter(x => x.en.toLowerCase() !== w.en.toLowerCase() && !seen.has(x.ko) && (seen.add(x.ko) || true)).slice(0, 3).map(x => x.ko);
    const opts = shuffle([w.ko, ...distract]);
    return { main: w.en, audio: w.en, options: opts, answer: opts.indexOf(w.ko), explain: `${w.en} = ${w.ko}`, en: w.en, ko: w.ko };
  },

  /* ---- 이동 ---- */
  next() {
    if (this.idx >= this.steps.length - 1) { return; }
    this.idx++; this._save(); this.render();
  },
  prev() { if (this.idx > 0) { this.idx--; this._save(); this.render(); } },
  jumpTo(secIdx) {
    const sec = this.sections[secIdx]; if (!sec) return;
    this.idx = sec.start; this._save(); this.render();
  },
  _save() { Store.state.progress.courseIdx = this.idx; Store.save(); },

  render() {
    App.enterCourse();
    const step = this.steps[this.idx];
    const sec = this.sections[step.sec];
    if (this.secStart[step.sec] == null) this.secStart[step.sec] = Date.now();
    // 헤더: 구간 + 구간 내 진행
    const inSec = this.idx - sec.start + 1, secLen = sec.end - sec.start;
    App.setHeader(`${sec.label}`);
    App.setProgress((this.idx) / (this.steps.length - 1) * 100);
    // 본문
    const host = App.main; host.innerHTML = "";
    host.appendChild(el("div", { class: "step-meta", text: `${sec.label} · ${inSec}/${secLen}` }));
    const MAP = { intro: "_intro", flash: "_flash", quiz: "_quiz", rpassage: "_rpassage", rquiz: "_rquiz", qitem: "_qitem", checkpoint: "_checkpoint" };
    if (MAP[step.type]) this[MAP[step.type]](step, host);
    // 하단 버튼
    App.prevBtn.disabled = this.idx === 0;
    App.nextBtn.classList.toggle("hidden", step.type === "checkpoint" && this.idx === this.steps.length - 1);
    App.nextBtn.innerHTML = (this.idx === this.steps.length - 1) ? "끝 ✓" : (step.type === "checkpoint" ? "다음 구간 →" : "다음 →");
    host.scrollTo(0, 0); window.scrollTo(0, 0);
  },

  /* ---- 스텝 렌더 ---- */
  _intro(step, host) {
    const sec = this.sections[step.sec];
    const slice = this.steps.slice(sec.start, sec.end);
    const wordN = slice.filter(s => s.type === "flash").length;
    const rN = slice.filter(s => s.type === "rpassage").length;
    const qN = slice.filter(s => s.type === "qitem").length;
    let emoji = "📘", sub = `단어 ${wordN}개`, desc = "다음을 눌러 단어부터 차근차근 이어가요. 단어 카드는 눌러서 뜻·발음을 확인하세요.";
    if (step.kind === "cloze") { emoji = "✍️"; sub = `본문 빈칸 ${qN}문항`; desc = "본문을 떠올리며 빈칸에 알맞은 말을 넣어요."; }
    else if (step.kind === "drill") { emoji = "🔥"; sub = `유형 문제 ${qN}문항`; desc = "약한 유형을 집중적으로 풀어요. 틀리면 바로 해설을 봐요."; }
    else if (step.reading) { emoji = "📚"; sub = `지문 ${rN}개 · 문제 풀기`; desc = "지문을 읽고 문제를 풀어요. 영어 단어를 누르면 뜻이 떠요."; }
    host.appendChild(el("div", { class: "step-card intro-card" }, [
      el("div", { class: "intro-emoji", text: emoji }),
      el("div", { class: "intro-title", text: step.label }),
      el("div", { class: "intro-sub", text: sub }),
      el("p", { class: "intro-desc", text: desc })
    ]));
  },

  _flash(step, host) {
    const w = step.word;
    Store.state.progress.vocabSeen[w.en.toLowerCase()] = Math.max(1, Store.state.progress.vocabSeen[w.en.toLowerCase()] || 0);
    const sa = Data.sa(w.en);
    const k = w.en.toLowerCase();
    const back = el("div", { class: "flash-back hidden" }, [
      el("div", { class: "flash-ko", text: w.ko }),
      sa && sa.syn && sa.syn.length ? el("div", { class: "flash-sa" }, [el("b", { class: "eq", text: "= " }), document.createTextNode(sa.syn.join(", "))]) : null,
      sa && sa.ant && sa.ant.length ? el("div", { class: "flash-sa" }, [el("b", { class: "ar", text: "↔ " }), document.createTextNode(sa.ant.join(", "))]) : null
    ]);
    const card = el("div", { class: "step-card flash-card", onclick: () => back.classList.toggle("hidden") }, [
      el("button", {
        class: "flash-star" + (Store.state.progress.starred[k] ? " on" : ""), html: Store.state.progress.starred[k] ? "★" : "☆",
        onclick: (e) => { e.stopPropagation(); if (Store.state.progress.starred[k]) delete Store.state.progress.starred[k]; else Store.state.progress.starred[k] = true; Store.save(); e.target.classList.toggle("on"); e.target.textContent = Store.state.progress.starred[k] ? "★" : "☆"; }
      }),
      el("div", { class: "flash-en", text: w.en }),
      w.src ? el("span", { class: "src-badge " + (w.src === "school" ? "school" : "anal"), text: w.src === "school" ? "학교" : "분석" }) : null,
      el("button", { class: "flash-audio", html: "🔊 발음", onclick: (e) => { e.stopPropagation(); Audio2.speak(w.en); } }),
      back,
      el("div", { class: "flash-hint", text: "카드를 누르면 뜻이 보여요" })
    ]);
    host.appendChild(card);
  },

  _quiz(step, host) {
    const q = step.q, prev = this.ans[step._i];
    host.appendChild(el("div", { class: "step-tag", text: "미니 퀴즈 · 뜻 고르기" }));
    const card = el("div", { class: "step-card" }, [
      el("div", { class: "q-main-row" }, [
        el("div", { class: "run-q-main", text: q.main }),
        el("button", { class: "q-audio", html: "🔊", onclick: () => Audio2.speak(q.audio) })
      ])
    ]);
    const opts = el("div", { class: "run-opts" });
    q.options.forEach((o, oi) => opts.appendChild(el("button", {
      class: "run-opt", html: `<span class="oc">${CIRCLED[oi]}</span><span>${esc(o)}</span>`,
      onclick: () => this._answer(step, oi, opts, fb, q)
    })));
    const fb = el("div", { class: "run-feedback" });
    card.appendChild(opts); card.appendChild(fb); host.appendChild(card);
    if (prev) this._reveal(step, prev.chosen, opts, fb, q);   // 다시 방문 시 상태 복원
  },
  _answer(step, oi, opts, fb, q) {
    if (this.ans[step._i]) return;
    const ok = oi === q.answer;
    this.ans[step._i] = { chosen: oi, ok };
    if (!ok) Store.addWrong([{ type: "k", key: "k:" + q.en.toLowerCase(), en: q.en, ko: q.ko, q: "코스 퀴즈" }]);
    Store.save();
    this._reveal(step, oi, opts, fb, q);
  },
  _reveal(step, chosen, opts, fb, q) {
    $$(".run-opt", opts).forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add("correct");
      if (i === chosen && chosen !== q.answer) b.classList.add("wrong");
    });
    const ok = chosen === q.answer;
    fb.className = "run-feedback show " + (ok ? "ok" : "bad");
    fb.innerHTML = `<div class="fb-line">${ok ? "정답!" : "오답"}</div><div class="fb-ex">${esc(q.explain)}</div>`;
  },

  _rpassage(step, host) {
    const p = step.p, isL0 = step.set.level === "L0";
    host.appendChild(el("div", { class: "step-tag", text: "독해 지문" }));
    const box = el("div", { class: "step-card passage-box" });
    box.appendChild(el("div", { class: "passage-head" }, [
      el("span", { class: "passage-no", text: "지문 " + p.no }), el("span", { class: "passage-title", text: p.title })
    ]));
    if (p.topic) box.appendChild(el("div", { class: "passage-topic", text: "💡 " + p.topic }));
    box.appendChild(el("p", { class: "passage-en" }, [tappableText(p.en)]));
    const ko = el("div", { class: "passage-ko" + (isL0 ? "" : " hidden"), text: p.ko });
    box.appendChild(el("button", { class: "toggle-btn", text: isL0 ? "한글 해석 접기 ▲" : "한글 해석 보기 ▼", onclick: (e) => { ko.classList.toggle("hidden"); e.target.textContent = ko.classList.contains("hidden") ? "한글 해석 보기 ▼" : "한글 해석 접기 ▲"; } }));
    box.appendChild(ko);
    if (p.vocab && p.vocab.length) {
      const vt = el("div", { class: "passage-vocab hidden" }, p.vocab.map(v => el("div", { class: "pv-row" }, [
        el("span", { class: "pv-en", text: v.en, onclick: () => Audio2.speak(v.en) }), el("span", { class: "pv-ko", text: v.ko })])));
      box.appendChild(el("button", { class: "toggle-btn", text: "핵심 어휘 보기 ▼", onclick: (e) => { vt.classList.toggle("hidden"); e.target.textContent = vt.classList.contains("hidden") ? "핵심 어휘 보기 ▼" : "핵심 어휘 접기 ▲"; } }));
      box.appendChild(vt);
    }
    host.appendChild(box);
  },

  _rquiz(step, host) {
    const q = step.q, prev = this.ans[step._i];
    host.appendChild(el("div", { class: "step-tag", text: "독해 문제 · " + q.type }));
    const card = el("div", { class: "step-card" }, [el("div", { class: "rq-stem big", text: q.stem })]);
    if (q.lead) card.appendChild(el("div", { class: "rq-lead", text: q.lead }));
    const opts = el("div", { class: "rq-opts" });
    q.options.forEach((o, oi) => opts.appendChild(el("button", {
      class: "rq-opt", html: `<span class="oc">${CIRCLED[oi]}</span><span>${esc(o)}</span>`,
      onclick: () => this._answerR(step, oi, opts, fb, q)
    })));
    const fb = el("div", { class: "rq-explain hidden" });
    card.appendChild(opts); card.appendChild(fb); host.appendChild(card);
    if (prev) this._revealR(step, prev.chosen, opts, fb, q);
  },
  _answerR(step, oi, opts, fb, q) {
    if (this.ans[step._i]) return;
    const ok = oi === q.answer;
    this.ans[step._i] = { chosen: oi, ok };
    if (!ok) Store.addWrong([{ type: "reading", key: step.set.id + ":" + q.id, q: `${step.set.id} ${q.id}`, en: q.stem, ko: `정답 ${CIRCLED[q.answer]}` }]);
    Store.save();
    this._revealR(step, oi, opts, fb, q);
  },
  _revealR(step, chosen, opts, fb, q) {
    $$(".rq-opt", opts).forEach((b, i) => { b.disabled = true; if (i === q.answer) b.classList.add("correct"); if (i === chosen && chosen !== q.answer) b.classList.add("wrong"); });
    fb.classList.remove("hidden");
    fb.innerHTML = `<b>정답 ${CIRCLED[q.answer]}</b> — ${esc(q.explain || "")}`;
  },

  _qitem(step, host) {
    renderQuizItem(step.item, host, (ok) => {
      this.ans[step._i] = { ok };
      if (!ok) Store.addWrong([bankWrongRec(step.item)]);
      Store.save();
    }, { allowSimilar: true, back: () => Course.render() });
  },

  _checkpoint(step, host) {
    const sec = this.sections[step.sec];
    const pg = Store.state.progress;
    if (!pg.courseDone) pg.courseDone = {};
    if (!pg.courseDone[step.sec]) { pg.courseDone[step.sec] = 1; Store.save(); }   // 구간 완료(체크포인트 도달)
    const res = this.sectionResult(step.sec);
    const pass = res.pct >= CONFIG.PASS_PCT;
    host.appendChild(el("div", { class: "step-card checkpoint" }, [
      el("div", { class: "cp-emoji", text: pass ? "🎉" : (res.total ? "💪" : "✅") }),
      el("div", { class: "cp-title", text: `${sec.label} 구간 완료!` }),
      res.total ? el("div", { class: "cp-score" }, [el("b", { text: `${res.correct}/${res.total}` }), el("span", { class: "cp-pct" + (pass ? " pass" : ""), text: ` · ${res.pct}점` })]) : el("div", { class: "muted", text: "이 구간엔 퀴즈가 없어요." }),
      el("div", { class: "cp-send", id: "cp-send", text: API.enabled ? "📤 결과를 선생님 카톡으로 전송 중…" : "ⓘ 로컬 모드 — 카톡 전송은 백엔드 연결 후" }),
      this.idx < this.steps.length - 1 ? el("p", { class: "muted", text: "‘다음 구간 →’으로 계속 이어가요." }) : el("p", { class: "muted", text: "모든 구간을 끝냈어요! 수고했어요 👏" })
    ]));
    if (res.total && !this.submitted[step.sec]) {
      this.submitted[step.sec] = true;
      Store.bumpStreak();
      const result = {
        section: `코스 · ${sec.label}`, kind: "course",
        score: res.correct, total: res.total, pct: res.pct,
        duration: Math.round((Date.now() - (this.secStart[step.sec] || Date.now())) / 1000),
        wrong: res.wrong
      };
      API.submit(result).then(r => {
        const e2 = $("#cp-send");
        if (e2) e2.textContent = !API.enabled ? "ⓘ 로컬 모드 — 카톡 전송은 백엔드 연결 후"
          : (r && r.ok ? "✅ 선생님 카톡으로 전송했어요." : "⚠️ 전송 대기 중(네트워크 복구 시 자동 전송).");
      });
    }
  },

  sectionResult(secIdx) {
    const sec = this.sections[secIdx];
    let correct = 0, total = 0; const wrong = [];
    for (let i = sec.start; i < sec.end; i++) {
      const st = this.steps[i];
      if (st.type === "quiz" || st.type === "rquiz" || st.type === "qitem") {
        total++;
        const a = this.ans[i];
        if (a && a.ok) correct++;
        else if (st.type === "quiz") wrong.push({ q: st.q.main, answer: st.q.ko });
        else if (st.type === "rquiz") wrong.push({ q: `${st.set.id} ${st.q.id}`, answer: `정답 ${CIRCLED[st.q.answer]}` });
        else wrong.push({ q: `[${st.item.group}] ${(st.item.stem || "").slice(0, 24)}`, answer: st.item.explain || "" });
      }
    }
    return { correct, total, pct: total ? Math.round(correct / total * 100) : 0, wrong };
  }
};
