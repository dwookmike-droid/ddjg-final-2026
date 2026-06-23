/* ===========================================================
 *  quiz.js — 통합 문항 은행 + 공용 렌더러 + 유형별 드릴·스피드·본문빈칸
 *  지원 유형: mc · ox · order · insert · grammar · vocab · agree · connector · cloze
 * =========================================================== */

const Bank = {
  data: null,
  async load() {
    try { this.data = await fetch("data/bank.json").then(r => r.json()); }
    catch (e) { this.data = { tracks: {}, items: [] }; }
  },
  items(track) { return (this.data && this.data.items || []).filter(i => i.track === track); },
  groups(track) {
    const m = {};
    this.items(track).forEach(i => { (m[i.group] = m[i.group] || []).push(i); });
    return m;
  },
  units(track) {
    const m = {};
    this.items(track).forEach(i => { const u = i.unit || "기타"; (m[u] = m[u] || []).push(i); });
    return m;
  }
};

/* ---------- 풀이 가이드 (전략·힌트·단계 풀이) ---------- */
const Guide = {
  data: null,
  async load() {
    try { this.data = await fetch("data/guide.json").then(r => r.json()); }
    catch (e) { this.data = { strategies: {}, items: {} }; }
  },
  strategy(g) { return (this.data && this.data.strategies && this.data.strategies[g]) || null; },
  itemGuide(id) { return (this.data && this.data.items && this.data.items[id]) || null; },
  hints(item) {
    const g = this.itemGuide(item.id);
    if (g && g.hints && g.hints.length) return g.hints;
    const s = this.strategy(item.group);
    return s && s.hint ? [s.hint] : [];
  },
  solveHtml(item) {
    const g = this.itemGuide(item.id), s = this.strategy(item.group);
    let h = "";
    if (g && g.solve) h += `<div class="gd-solve">${esc(g.solve)}</div>`;
    if (s && s.steps) h += `<div class="gd-cap">풀이 순서</div><ol class="gd-steps">${s.steps.map(x => `<li>${esc(x)}</li>`).join("")}</ol>`;
    if (s && s.warn) h += `<div class="gd-warn">${esc(s.warn)}</div>`;
    return h;
  }
};

/* ---------- 비슷한 유형 문제 (학생이 직접 더 풀기) ---------- */
function similarItems(item) {
  const pool = Bank.items("drill").filter(i => i.group === item.group && i.id !== item.id);
  const same = shuffle(pool.filter(i => i.unit === item.unit));
  const other = shuffle(pool.filter(i => i.unit !== item.unit));
  return same.concat(other).slice(0, 5);
}
const Similar = {
  run(item, back) {
    const items = similarItems(item);
    if (!items.length) return;
    QuizRunner.run(items, `비슷한 유형 · ${item.group}`, { back: back || (() => openSub("유형별 훈련", r => Drill.render(r))) });
  }
};

/* ---------- 공용 문항 렌더러 ----------
 * renderQuizItem(item, host, onGraded, opts)
 *   opts.review       : 복습 모드(정답·풀이 즉시 공개), opts.chosen = 학생 선택
 *   opts.allowSimilar : 채점 후 '비슷한 유형 더 풀기' 버튼 노출
 *   opts.back         : 비슷한 유형에서 돌아갈 화면 */
function renderQuizItem(item, host, onGraded, opts) {
  opts = opts || {};
  const review = !!opts.review;
  const card = el("div", { class: "step-card qitem" });
  if (item.passage) card.appendChild(el("p", { class: "passage-en qi-passage" }, [tappableText(item.passage)]));
  if (item.lead) card.appendChild(el("div", { class: "rq-lead", text: item.lead }));
  card.appendChild(el("div", { class: "qi-stem" }, [
    item.group ? el("span", { class: "qi-tag", text: item.group }) : null,
    el("span", { text: item.stem })
  ]));

  // 힌트 (연습 모드 — 막히면 펼쳐 봄, 단계적)
  if (!review) {
    const hints = Guide.hints(item);
    if (hints.length) {
      let shown = 0;
      const box = el("div", { class: "hint-box hidden" });
      const btn = el("button", { class: "help-btn", html: "💡 힌트" });
      btn.addEventListener("click", () => {
        box.classList.remove("hidden");
        if (shown < hints.length) { box.appendChild(el("div", { class: "hint-line", text: `힌트 ${shown + 1}. ${hints[shown]}` })); shown++; }
        btn.textContent = shown >= hints.length ? "💡 힌트 끝" : `💡 힌트 더 (${shown}/${hints.length})`;
        if (shown >= hints.length) btn.disabled = true;
      });
      card.appendChild(el("div", { class: "help-row" }, [btn]));
      card.appendChild(box);
    }
  }

  const fb = el("div", { class: "qi-fb" });
  let done = false;
  function markIdx(wrap, cls, sel) {
    $$("." + cls, wrap).forEach((b, i) => { b.disabled = true; if (i === item.answer) b.classList.add("correct"); if (i === sel && i !== item.answer) b.classList.add("wrong"); });
  }
  function afterGrade(ok, skipped) {
    done = true;
    fb.className = "qi-fb show " + (ok ? "ok" : "bad");
    fb.appendChild(el("div", { class: "fb-line", text: ok ? "정답!" : (skipped ? "미응시" : "오답") }));
    if (item.explain) fb.appendChild(el("div", { class: "fb-ex", text: item.explain }));
    if (review) {
      const hs = Guide.hints(item);
      if (hs.length) { const hb = el("div", { class: "hint-box" }); hs.forEach((h, k) => hb.appendChild(el("div", { class: "hint-line", text: `힌트 ${k + 1}. ${h}` }))); fb.appendChild(hb); }
    }
    const sh = Guide.solveHtml(item);
    if (sh) {
      const sol = el("div", { class: "solve-box" + (review ? "" : " hidden"), html: sh });
      const sb = el("button", { class: "help-btn solve", html: review ? "📝 풀이 접기" : "📝 풀이 보기" });
      sb.addEventListener("click", () => { sol.classList.toggle("hidden"); sb.textContent = sol.classList.contains("hidden") ? "📝 풀이 보기" : "📝 풀이 접기"; });
      fb.appendChild(sb); fb.appendChild(sol);
    }
    if (opts.allowSimilar && item.track === "drill" && similarItems(item).length)
      fb.appendChild(el("button", { class: "help-btn sim", html: "🔁 같은 유형 더 풀기", onclick: () => Similar.run(item, opts.back) }));
    if (onGraded) onGraded(ok, item);
  }

  if (item.type === "ox") {
    const wrap = el("div", { class: "ox-row" });
    [["O", "맞음", 0], ["X", "틀림", 1]].forEach(([sym, lab, v]) => wrap.appendChild(el("button", {
      class: "ox-btn", html: `<span class="ox-sym">${sym}</span><span class="ox-lab">${lab}</span>`,
      onclick: () => { if (done) return; markIdx(wrap, "ox-btn", v); afterGrade(v === item.answer); }
    })));
    card.appendChild(wrap);
    if (review) { markIdx(wrap, "ox-btn", opts.chosen); afterGrade(opts.chosen === item.answer, opts.chosen == null); }
  } else if (item.type === "cloze") {
    const inp = el("input", { class: "run-input", type: "text", autocomplete: "off", autocapitalize: "off", placeholder: "정답 입력…", onkeydown: (e) => { if (e.key === "Enter") go(); } });
    const go = () => {
      if (done) return;
      const ok = (item.accept || []).some(a => item.lang === "ko" ? koMatch(inp.value, a) : enMatch(inp.value, a));
      inp.disabled = true; inp.classList.add(ok ? "ok" : "bad");
      if (!ok) fb.appendChild(el("div", { class: "qi-ans", text: "정답: " + (item.accept || []).join(" / ") }));
      afterGrade(ok);
    };
    card.appendChild(inp);
    if (!review) { card.appendChild(el("button", { class: "primary-btn", text: "확인", onclick: go })); setTimeout(() => inp.focus(), 50); }
    else {
      inp.value = opts.chosen || ""; inp.disabled = true;
      const ok = (item.accept || []).some(a => item.lang === "ko" ? koMatch(inp.value, a) : enMatch(inp.value, a));
      inp.classList.add(ok ? "ok" : "bad");
      if (!ok) fb.appendChild(el("div", { class: "qi-ans", text: "정답: " + (item.accept || []).join(" / ") }));
      afterGrade(ok, !opts.chosen);
    }
  } else {
    const circled = item.type !== "insert";
    const ow = el("div", { class: "rq-opts" });
    (item.options || []).forEach((o, oi) => ow.appendChild(el("button", {
      class: "rq-opt", html: circled ? `<span class="oc">${CIRCLED[oi]}</span><span>${esc(o)}</span>` : `<span class="oc">${CIRCLED[oi]}</span>`,
      onclick: () => { if (done) return; markIdx(ow, "rq-opt", oi); afterGrade(oi === item.answer); }
    })));
    card.appendChild(ow);
    if (review) { markIdx(ow, "rq-opt", opts.chosen); afterGrade(opts.chosen === item.answer, opts.chosen == null); }
  }
  card.appendChild(fb);
  card.appendChild(el("button", { class: "report-btn", html: "⚠️ 오류 신고",
    onclick: () => ReportFlag.open({ id: item.id, where: `${item.group || ""} · ${item.source || item.unit || ""}`, stem: item.stem }) }));
  host.appendChild(card);
  return card;
}

function bankWrongRec(item) {
  const s = (item.stem || "").length > 40 ? item.stem.slice(0, 40) + "…" : (item.stem || "");
  return { type: "reading", key: item.id, q: `[${item.group}] ${s}`, ko: item.explain || "" };
}

/* ---------- 순차 러너 (드릴·스피드·본문빈칸 공용) ---------- */
const QuizRunner = {
  run(items, sectionLabel, opts) {
    opts = opts || {};
    this.s = { items, i: 0, correct: 0, wrong: [], t0: Date.now(), label: sectionLabel, back: opts.back };
    this._render();
  },
  _render() {
    const s = this.s, host = App.main; host.innerHTML = "";
    const bar = el("div", { class: "run-bar-fill" });
    host.appendChild(el("div", { class: "run-top" }, [
      el("button", { class: "run-quit", text: "✕ 그만", onclick: () => s.back ? s.back() : Router.go("home") }),
      el("div", { class: "run-bar" }, [bar]),
      el("div", { class: "run-count", text: `${s.i + 1} / ${s.items.length}` })
    ]));
    bar.style.width = (s.i / s.items.length * 100) + "%";
    const area = el("div", { class: "run-area" });
    host.appendChild(area);
    const item = s.items[s.i];
    renderQuizItem(item, area, (ok) => {
      if (ok) s.correct++; else s.wrong.push(item);
      const last = s.i + 1 >= s.items.length;
      area.appendChild(el("button", {
        class: "primary-btn next-btn", text: last ? "결과 보기 ▶" : "다음 ▶",
        onclick: () => { s.i++; last ? this._finish() : this._render(); }
      }));
    });
    host.scrollTo(0, 0); window.scrollTo(0, 0);
  },
  _finish() {
    const s = this.s;
    Store.bumpStreak();
    if (s.wrong.length) Store.addWrong(s.wrong.map(bankWrongRec));
    Store.save();
    const pct = Math.round(s.correct / s.items.length * 100);
    const result = { section: s.label, kind: "drill", score: s.correct, total: s.items.length, pct,
      duration: Math.round((Date.now() - s.t0) / 1000), wrong: s.wrong.map(w => ({ q: `[${w.group}] ${w.stem.slice(0, 30)}`, answer: w.explain || "" })) };
    Results.show(result, () => s.back ? s.back() : Router.go("home"));
    API.submit(result);
  }
};

/* ---------- 유형별 드릴 ---------- */
const Drill = {
  render(root) {
    root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "🔥 유형별 훈련" }),
      el("p", { class: "muted", text: "약한 유형부터 골라 푸세요. 한 유형씩 정복하면 그 유형은 두렵지 않아요." })
    ]));
    const groups = Bank.groups("drill");
    const names = Object.keys(groups);
    if (!names.length) { root.appendChild(emptyBankCard()); return; }
    root.appendChild(el("div", { class: "type-grid" }, names.map(n => el("button", {
      class: "type-tile", onclick: () => this.run(n)
    }, [
      el("div", { class: "type-name", text: n }),
      el("div", { class: "type-cnt", text: `${groups[n].length}문항` })
    ]))));
  },
  run(name) {
    const items = sample(Bank.groups("drill")[name], Math.min(20, Bank.groups("drill")[name].length));
    QuizRunner.run(items, `유형별 훈련 · ${name}`, { back: () => openSub("유형별 훈련", r => Drill.render(r)) });
  }
};

/* ---------- 데일리 스피드 퀴즈 ---------- */
const Speed = {
  render(root) {
    root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "⚡ 데일리 스피드 퀴즈" }),
      el("p", { class: "muted", text: "매일 공부 시작 전 5분! 빠르게 풀고 바로 채점해요." })
    ]));
    const groups = Bank.groups("speed");
    if (!Object.keys(groups).length) { root.appendChild(emptyBankCard()); return; }
    root.appendChild(el("div", { class: "setup-card" }, [
      el("div", { class: "speed-sum" }, Object.entries(groups).map(([n, a]) =>
        el("span", { class: "speed-chip", text: `${n} ${a.length}` }))),
      el("button", { class: "primary-btn big", text: "오늘의 퀴즈 시작 ▶", onclick: () => this.start(20) }),
      el("button", { class: "ghost-btn mt", text: "전체 풀기", onclick: () => this.start(999) })
    ]));
  },
  start(n) {
    const items = sample(Bank.items("speed"), Math.min(n, Bank.items("speed").length));
    QuizRunner.run(items, "데일리 스피드 퀴즈", { back: () => openSub("데일리 스피드 퀴즈", r => Speed.render(r)) });
  }
};

/* ---------- 본문 빈칸 채우기 ---------- */
const Cloze = {
  render(root) {
    root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "✍️ 본문 빈칸 채우기" }),
      el("p", { class: "muted", text: "본문을 떠올리며 빈칸에 알맞은 말을 넣어요." })
    ]));
    const units = Bank.units("cloze");
    const names = Object.keys(units);
    if (!names.length) { root.appendChild(emptyBankCard()); return; }
    root.appendChild(el("div", { class: "set-list" }, names.map(u => el("button", {
      class: "set-card", onclick: () => this.run(u)
    }, [
      el("div", { class: "set-main" }, [el("div", { class: "set-title", text: u }), el("div", { class: "set-sub", text: `${units[u].length}문항` })]),
      el("span", { class: "set-go", text: "▶" })
    ]))));
  },
  run(unit) {
    const items = Bank.units("cloze")[unit];
    QuizRunner.run(items, `본문 빈칸 · ${unit}`, { back: () => openSub("본문 빈칸 채우기", r => Cloze.render(r)) });
  }
};

function emptyBankCard() {
  return el("div", { class: "empty-card" }, [
    el("p", { text: "이 자료는 준비 중이에요." }),
    el("p", { class: "muted", text: "data/bank.json 에 문항을 추가하면 바로 나타납니다." })
  ]);
}

/* ---------- 실전 모의고사 (학교 기말 형식 반영) ---------- */
const Mock = {
  PLAN: [["내용일치", 2, 3.0], ["독해", 2, 3.2], ["순서·삽입", 3, 3.3], ["주제·요지", 3, 3.4], ["어휘", 3, 3.6], ["어법", 3, 3.5], ["빈칸추론", 4, 3.7]],
  render(root) {
    root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "🏆 실전 모의고사" }),
      el("p", { class: "muted", text: "학교 기말 형식(선택형 · 배점 3.0~3.7)을 반영한 실전 세트. 시험처럼 끝까지 푼 뒤 한 번에 채점해요." })
    ]));
    const total = this.PLAN.reduce((a, x) => a + x[1], 0);
    const card = el("div", { class: "setup-card" }, [
      el("div", { class: "mock-info" }, [
        el("div", { html: `<b>${total}문항</b> · 선택형 · 배점 3.0~3.7` }),
        el("div", { class: "muted", text: "내용일치 · 순서/삽입 · 주제 · 어휘 · 어법 · 빈칸추론 (마지막 빈칸 = 최고난도)" }),
        el("div", { class: "muted", text: "동대전고 특징: 어휘=반의어 교체 · 어법=조합형 · 빈칸+연결사 킬러" })
      ]),
      el("button", { class: "primary-btn big", text: "시험 시작 ▶", onclick: () => this.start() })
    ]);
    root.appendChild(card);
  },
  start() {
    const qs = [];
    this.PLAN.forEach(([g, c, pts]) => sample(Bank.groups("drill")[g] || [], c).forEach(it => qs.push({ item: it, pts })));
    this.paper = { qs, answers: {}, t0: Date.now() };
    this._renderPaper();
  },
  _renderPaper() {
    const root = App.main; root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "🏆 실전 모의고사" }),
      el("p", { class: "muted", text: "문제를 모두 풀고 맨 아래 ‘제출’을 누르세요. 채점은 제출 후 한 번에." })
    ]));
    const p = this.paper;
    p.qs.forEach((q, qi) => {
      const it = q.item, c = el("div", { class: "step-card mock-q" });
      c.appendChild(el("div", { class: "mock-qhead" }, [
        el("span", { class: "mock-no", text: String(qi + 1) }),
        el("span", { class: "mock-type", text: it.group }),
        el("span", { class: "mock-pts", text: q.pts.toFixed(1) + "점" })
      ]));
      if (it.passage) c.appendChild(el("p", { class: "passage-en" }, [tappableText(it.passage)]));
      if (it.lead) c.appendChild(el("div", { class: "rq-lead", text: it.lead }));
      c.appendChild(el("div", { class: "qi-stem" }, [el("span", { text: it.stem })]));
      const circled = it.type !== "insert";
      const ow = el("div", { class: "rq-opts" });
      (it.options || []).forEach((o, oi) => ow.appendChild(el("button", {
        class: "rq-opt", html: circled ? `<span class="oc">${CIRCLED[oi]}</span><span>${esc(o)}</span>` : `<span class="oc">${CIRCLED[oi]}</span>`,
        onclick: (e) => { p.answers[qi] = oi; $$(".rq-opt", ow).forEach(b => b.classList.toggle("sel", b === e.currentTarget)); }
      })));
      c.appendChild(ow);
      root.appendChild(c);
    });
    root.appendChild(el("button", {
      class: "primary-btn big", text: "제출하고 채점 ▶",
      onclick: () => { const u = p.qs.length - Object.keys(p.answers).length; if (u > 0 && !confirm(`아직 안 푼 문항 ${u}개. 제출할까요?`)) return; this._grade(); }
    }));
    window.scrollTo(0, 0);
  },
  _grade() {
    const p = this.paper; let earned = 0, max = 0, correct = 0; const wrong = [];
    p.qs.forEach((q, qi) => {
      max += q.pts;
      if (p.answers[qi] === q.item.answer) { earned += q.pts; correct++; }
      else wrong.push({ type: "reading", key: "mock-" + qi + "-" + Date.now(), q: `${qi + 1}. [${q.item.group}]`, ko: `정답 ${CIRCLED[q.item.answer]}` });
    });
    const pct = Math.round(earned / max * 100);
    const grade = pct >= 90 ? 1 : pct >= 80 ? 2 : pct >= 70 ? 3 : pct >= 60 ? 4 : pct >= 50 ? 5 : 6;
    if (wrong.length) Store.addWrong(wrong);
    Store.bumpStreak(); Store.save();
    const result = { section: "실전 모의고사", kind: "mock", score: correct, total: p.qs.length, pct, duration: Math.round((Date.now() - p.t0) / 1000), wrong: wrong.map(w => ({ q: w.q, answer: w.ko })) };
    const node = el("div", { class: "sheet result-sheet" }, [
      el("div", { class: "sheet-grip" }),
      el("div", { class: "res-emoji", text: grade <= 2 ? "🎉" : grade <= 4 ? "👍" : "💪" }),
      el("div", { class: "res-score" }, [el("span", { class: "res-num", text: earned.toFixed(1) }), el("span", { class: "res-of", text: ` / ${max.toFixed(1)}점` })]),
      el("div", { class: "res-pct" + (grade <= 3 ? " pass" : ""), text: `${pct}점 · 예상 ${grade}등급` }),
      el("div", { class: "res-meta", text: `정답 ${correct}/${p.qs.length} · 소요 ${fmtTime(result.duration)}` }),
      API.enabled ? el("div", { class: "res-send", text: "✅ 결과가 선생님께 기록됐어요." }) : el("div", { class: "res-send warn", text: "ⓘ 로컬 모드 — 결과는 이 기기에만 저장돼요." }),
      el("button", { class: "primary-btn", text: "오답 · 해설 보기 ▼", onclick: () => { close(); this._review(); } })
    ]);
    const close = showSheet(node);
    API.submit(result);
  },
  _review() {
    const root = App.main; root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [
      el("button", { class: "back", text: "← 실전 모의고사", onclick: () => Mock.render(App.main) }),
      el("h2", { text: "채점 결과 · 해설" }),
      el("p", { class: "muted", text: "틀린 문제는 풀이·힌트와 ‘비슷한 유형 더 풀기’로 보강하세요." })
    ]));
    const p = this.paper;
    p.qs.forEach((q, qi) => {
      root.appendChild(el("div", { class: "mock-rno", text: `${qi + 1}번 · ${q.item.group} · ${q.pts.toFixed(1)}점` }));
      renderQuizItem(q.item, root, null, { review: true, chosen: p.answers[qi], allowSimilar: true, back: () => Mock._review() });
    });
    window.scrollTo(0, 0);
  }
};
