/* ===========================================================
 *  app.js — 라우터 · 로그인 · 홈 · 러너 · 결과 · 오답노트 · 부팅
 * =========================================================== */

/* ---------- 바텀시트 / 사이드 드로어 ---------- */
function showSheet(node, opts = {}) {
  const back = el("div", { class: "sheet-back" + (opts.side ? " side" : ""), onclick: (e) => { if (e.target === back) close(); } }, [node]);
  function close() { back.classList.add("closing"); setTimeout(() => back.remove(), 220); }
  node.appendChild(el("button", { class: "sheet-close", html: "✕", onclick: close }));
  document.body.appendChild(back);
  requestAnimationFrame(() => back.classList.add("show"));
  return close;
}

/* ---------- 퀴즈 러너 (단어 테스트: 한 문항씩) ---------- */
const Runner = {
  run(session, title, onFinish) {
    this.s = session; this.title = title; this.onFinish = onFinish;
    Router.main.innerHTML = "";
    this.bar = el("div", { class: "run-bar-fill" });
    Router.main.appendChild(el("div", { class: "run-top" }, [
      el("button", { class: "run-quit", text: "✕ 그만", onclick: () => { if (confirm("테스트를 그만둘까요? 기록되지 않아요.")) Router.go("test"); } }),
      el("div", { class: "run-bar" }, [this.bar]),
      el("div", { class: "run-count" })
    ]));
    this.area = el("div", { class: "run-area" });
    Router.main.appendChild(this.area);
    this._render();
  },
  _render() {
    const s = this.s, q = s.qs[s.i];
    this.bar.style.width = (s.i / s.qs.length * 100) + "%";
    $(".run-count", Router.main).textContent = `${s.i + 1} / ${s.qs.length}`;
    this.area.innerHTML = "";
    const card = el("div", { class: "run-card" });
    card.appendChild(el("div", { class: "run-q-top" }, [
      el("span", { text: q.top }),
      q.audio ? el("button", { class: "q-audio", html: "🔊", onclick: () => Audio2.speak(q.audio) }) : null
    ]));
    card.appendChild(el("div", { class: "run-q-main", text: q.main }));

    const feedback = el("div", { class: "run-feedback" });
    if (q.text) {
      const inp = el("input", { class: "run-input", type: "text", autocomplete: "off", autocapitalize: "off", placeholder: "정답 입력…",
        onkeydown: (e) => { if (e.key === "Enter") submit(); } });
      const submit = () => this._answerText(q, inp.value, feedback, card);
      card.appendChild(inp);
      card.appendChild(el("button", { class: "primary-btn", text: "확인", onclick: submit }));
      setTimeout(() => inp.focus(), 50);
    } else {
      const opts = el("div", { class: "run-opts" });
      q.options.forEach((o, oi) => opts.appendChild(el("button", {
        class: "run-opt", html: `<span class="oc">${CIRCLED[oi]}</span><span>${esc(o)}</span>`,
        onclick: () => this._answerMC(q, oi, opts, feedback)
      })));
      card.appendChild(opts);
    }
    card.appendChild(feedback);
    this.area.appendChild(card);
  },
  _answerMC(q, oi, opts, feedback) {
    const ok = oi === q.answerIndex;
    this._record(q, ok);
    $$(".run-opt", opts).forEach((b, i) => {
      b.disabled = true;
      if (i === q.answerIndex) b.classList.add("correct");
      if (i === oi && !ok) b.classList.add("wrong");
    });
    this._after(ok, q, feedback);
  },
  _answerText(q, val, feedback, card) {
    if ($(".run-input", card).disabled) return;
    const ok = q.grade(val);
    this._record(q, ok);
    $(".run-input", card).disabled = true;
    $(".run-input", card).classList.add(ok ? "ok" : "bad");
    this._after(ok, q, feedback);
  },
  _record(q, ok) {
    if (ok) this.s.correct++;
    else this.s.wrong.push(q);
    this.s.answered.push({ q: q.main, ok });
  },
  _after(ok, q, feedback) {
    const exam = VocabTest.cfg.mode === "exam";
    if (!exam) {
      feedback.className = "run-feedback show " + (ok ? "ok" : "bad");
      feedback.appendChild(el("div", { class: "fb-line", text: ok ? "정답!" : "오답" }));
      feedback.appendChild(el("div", { class: "fb-ex", text: q.explain }));
    }
    const next = el("button", { class: "primary-btn next-btn", text: this.s.i + 1 >= this.s.qs.length ? "결과 보기 ▶" : "다음 ▶",
      onclick: () => this._next() });
    feedback.appendChild(next);
    feedback.classList.add("show");
    if (exam) setTimeout(() => this._next(), 180);
  },
  _next() {
    this.s.i++;
    if (this.s.i >= this.s.qs.length) { this.bar.style.width = "100%"; this.onFinish(this.s); }
    else this._render();
  }
};

/* ---------- 결과 화면 ---------- */
const Results = {
  show(result, onClose) {
    const pass = result.pct >= CONFIG.PASS_PCT;
    const node = el("div", { class: "sheet result-sheet" }, [
      el("div", { class: "sheet-grip" }),
      el("div", { class: "res-emoji", text: pass ? "🎉" : (result.pct >= 50 ? "👍" : "💪") }),
      el("div", { class: "res-score" }, [
        el("span", { class: "res-num", text: `${result.score}` }),
        el("span", { class: "res-of", text: ` / ${result.total}` })
      ]),
      el("div", { class: "res-pct" + (pass ? " pass" : ""), text: result.pct + "점" }),
      el("div", { class: "res-sec", text: result.section }),
      el("div", { class: "res-meta", text: `소요 ${fmtTime(result.duration)} · ${pass ? "통과" : "복습 권장"}` }),
      API.enabled
        ? el("div", { class: "res-send", text: "✅ 결과가 선생님께 기록됐어요." })
        : el("div", { class: "res-send warn", text: "ⓘ 로컬 모드 — 결과는 이 기기에만 저장돼요." }),
      result.wrong && result.wrong.length
        ? el("details", { class: "res-wrong" }, [
            el("summary", { text: `틀린 문항 ${result.wrong.length}개 보기` }),
            ...result.wrong.map(w => el("div", { class: "res-wrong-row" }, [
              el("span", { class: "rw-q", text: w.q }), el("span", { class: "rw-a", text: w.answer })
            ]))
          ])
        : el("div", { class: "res-allright", text: "전부 맞혔어요! 완벽해요 ✨" }),
      el("div", { class: "res-btns" }, [
        CONFIG.KAKAO_JS_KEY ? el("button", { class: "ghost-btn", text: "카톡 공유", onclick: () => shareKakao(result) }) : null,
        el("button", { class: "primary-btn", text: "확인", onclick: () => { close(); onClose && onClose(); } })
      ])
    ]);
    const close = showSheet(node);
  }
};

function shareKakao(result) {
  if (!window.Kakao || !Kakao.isInitialized()) return alert("카카오 공유가 설정되지 않았어요.");
  Kakao.Share.sendDefault({
    objectType: "text",
    text: `[${Store.state.student.name}/${Store.state.student.class}] ${result.section}\n점수 ${result.score}/${result.total} (${result.pct}점) · 소요 ${fmtTime(result.duration)}`,
    link: { mobileWebUrl: location.href, webUrl: location.href }
  });
}

/* ---------- 라우터 (서브뷰: 메뉴에서 여는 화면들) ---------- */
const Router = {
  main: null, view: "home",
  SUB: {
    home:     ["학습 현황", r => Home.render(r)],
    dict:     ["단어장 사전", r => VocabDict.render(r)],
    test:     ["단어 시험", r => VocabTest.setup(r)],
    reading:  ["독해 시험", r => Reading.render(r)],
    drill:    ["유형별 훈련", r => Drill.render(r)],
    mock:     ["실전 모의고사", r => Mock.render(r)],
    speed:    ["데일리 스피드 퀴즈", r => Speed.render(r)],
    cloze:    ["본문 빈칸 채우기", r => Cloze.render(r)],
    wrong:    ["오답노트", r => WrongNote.render(r)],
    settings: ["설정", r => Settings.render(r)]
  },
  go(view) {
    this.view = view;
    const s = this.SUB[view] || this.SUB.home;
    openSub(s[0], s[1]);
  }
};

/* ---------- 로그인 ---------- */
const Login = {
  render() {
    const app = $("#app");
    app.innerHTML = "";
    const name = el("input", { class: "login-input", placeholder: "이름", autocomplete: "off" });
    let klass = CONFIG.CLASSES[0];
    const pin = el("input", { class: "login-input", placeholder: "비밀번호 4자리(PIN)", inputmode: "numeric", maxlength: "4", type: "password" });
    const msg = el("div", { class: "login-msg" });
    const classRow = el("div", { class: "chip-row center" },
      CONFIG.CLASSES.map((c, i) => el("button", {
        class: "pick" + (i === 0 ? " on" : ""), text: c,
        onclick: (e) => { klass = c; $$(".pick", classRow).forEach(x => x.classList.toggle("on", x === e.target)); }
      })));
    const submit = async () => {
      const nm = name.value.trim();
      if (!nm) return msg.textContent = "이름을 입력하세요.";
      if (!/^\d{4}$/.test(pin.value)) return msg.textContent = "PIN은 숫자 4자리예요.";
      msg.textContent = "확인 중…"; btn.disabled = true;
      const r = await API.login(nm, klass, pin.value);
      btn.disabled = false;
      if (!r.ok) { msg.textContent = r.reason === "pin" ? "PIN이 일치하지 않아요." : "연결에 실패했어요. 다시 시도하세요."; return; }
      Store.state.student = { name: nm, class: klass, sid: r.sid };
      if (r.progress) Object.assign(Store.state.progress, r.progress);  // 서버 진도 채택(기기 동기화)
      Store.save();
      boot2();
    };
    const btn = el("button", { class: "primary-btn big", text: "시작하기", onclick: submit });
    pin.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });

    app.appendChild(el("div", { class: "login-screen" }, [
      el("div", { class: "login-logo", text: "📖" }),
      el("h1", { class: "login-title", text: CONFIG.APP_TITLE }),
      el("p", { class: "login-sub", text: CONFIG.APP_SUBTITLE }),
      DDay.card(),
      el("div", { class: "login-card" }, [
        name, classRow, pin, btn, msg,
        el("p", { class: "login-hint", text: "처음이면 새 PIN이 등록돼요. 같은 이름·반·PIN으로 어느 기기서나 이어서 학습할 수 있어요." })
      ])
    ]));
    name.focus();
  }
};

/* ---------- D-Day ---------- */
const DDay = {
  days() {
    const exam = new Date(CONFIG.EXAM_DATE + "T00:00:00");
    return Math.ceil((exam - new Date(todayStr() + "T00:00:00")) / 864e5);
  },
  card() {
    const d = this.days();
    return el("div", { class: "dday-card" }, [
      el("span", { class: "dday-label", text: "영어 시험" }),
      el("span", { class: "dday-num", text: d > 0 ? `D-${d}` : d === 0 ? "D-DAY" : `D+${-d}` }),
      el("span", { class: "dday-date", text: CONFIG.EXAM_DATE + " (금)" })
    ]);
  }
};

/* ---------- 홈 ---------- */
const Home = {
  render(root) {
    root.innerHTML = "";
    const st = Store.state.student, pg = Store.state.progress;
    const seenN = Object.values(pg.vocabSeen).filter(v => v >= 1).length;
    const starN = Object.keys(pg.starred).length;
    const wrongN = pg.wrong.length;
    const resN = (pg.results || []).length;

    root.appendChild(el("div", { class: "home-hero" }, [
      el("div", { class: "hero-hi", text: `${st.name}님 (${st.class})` }),
      DDay.card(),
      pg.streak.days ? el("div", { class: "streak", text: `🔥 ${pg.streak.days}일 연속 학습 중` }) : null
    ]));

    root.appendChild(el("div", { class: "stat-row" }, [
      ["외운 단어", seenN], ["★ 모르는", starN], ["오답", wrongN], ["응시", resN]
    ].map(([l, v]) => el("div", { class: "stat" }, [
      el("div", { class: "stat-v", text: String(v) }), el("div", { class: "stat-l", text: l })
    ]))));

    root.appendChild(el("div", { class: "module-grid" }, [
      this._tile("📖", "단어장", "뜻·동의어·발음", "dict", "blue"),
      this._tile("📝", "단어 테스트", "4종 자동채점", "test", "green"),
      this._tile("📚", "독해 시험", "L0~L4 레벨별", "reading", "purple"),
      this._tile("✍️", "오답노트", wrongN ? `${wrongN}개 복습` : "오답 모으기", "wrong", "red")
    ]));

    // 추천 다음
    let rec;
    if (seenN < 30) rec = ["📖 먼저 단어장으로 핵심 단어를 훑어보세요.", "dict"];
    else if (wrongN >= 5) rec = [`✍️ 오답 ${wrongN}개를 복습할 차례예요.`, "wrong"];
    else if (resN === 0) rec = ["📝 단어 테스트로 실력을 점검해 보세요.", "test"];
    else rec = ["📚 독해 시험으로 본문 이해를 확인해요.", "reading"];
    root.appendChild(el("button", { class: "rec-card", onclick: () => Router.go(rec[1]) }, [
      el("span", { class: "rec-label", text: "추천 다음 학습" }),
      el("span", { class: "rec-text", text: rec[0] })
    ]));

    // 세트별 결과(누적, 최신순)
    const results = (pg.results || []).slice().reverse();
    if (results.length) {
      root.appendChild(el("h3", { class: "mt", text: "세트별 결과" }));
      root.appendChild(el("div", { class: "res-hist" }, results.slice(0, 20).map(r => {
        const passed = (r.pct || 0) >= CONFIG.PASS_PCT;
        return el("div", { class: "res-hist-row" }, [
          el("span", { class: "rh-sec", text: String(r.section || "").replace(/^코스 · /, "") }),
          el("span", { class: "rh-score", text: `${r.score}/${r.total}` }),
          el("span", { class: "rh-pct" + (passed ? " pass" : ""), text: `${r.pct}점` })
        ]);
      })));
    }
  },
  _tile(emoji, title, sub, view, color) {
    return el("button", { class: "module-tile " + color, onclick: () => Router.go(view) }, [
      el("div", { class: "tile-emoji", text: emoji }),
      el("div", { class: "tile-title", text: title }),
      el("div", { class: "tile-sub", text: sub })
    ]);
  }
};

/* ---------- 오답노트 ---------- */
const WrongNote = {
  render(root) {
    root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "✍️ 오답노트" }),
      el("p", { class: "muted", text: "틀린 단어·문항이 자동으로 모여요. 단어 오답은 바로 재시험할 수 있어요." })
    ]));
    const wrong = Store.state.progress.wrong;
    const vocabWrong = wrong.filter(w => w.type !== "reading");
    const readWrong = wrong.filter(w => w.type === "reading");

    if (!wrong.length) { root.appendChild(el("div", { class: "empty-card" }, [el("p", { text: "아직 오답이 없어요. 테스트를 풀면 여기에 모여요." })])); return; }

    if (vocabWrong.length) {
      root.appendChild(el("div", { class: "section-row" }, [
        el("h3", { text: `단어 오답 ${vocabWrong.length}개` }),
        el("button", { class: "primary-btn sm", text: "오답 재시험 ▶", onclick: () => this._retest(vocabWrong) })
      ]));
      root.appendChild(el("div", { class: "wrong-list" }, vocabWrong.map(w => el("button", {
        class: "wrong-row", onclick: () => openWordSheet(w.en)
      }, [
        el("span", { class: "wr-en", text: w.en }),
        el("span", { class: "wr-ko", text: w.ko }),
        el("span", { class: "wr-tag", text: w.q })
      ]))));
    }
    if (readWrong.length) {
      root.appendChild(el("h3", { text: `독해 오답 ${readWrong.length}개`, class: "mt" }));
      root.appendChild(el("div", { class: "wrong-list" }, readWrong.map(w => el("div", { class: "wrong-row" }, [
        el("span", { class: "wr-en", text: w.q }), el("span", { class: "wr-ko", text: w.ko })
      ]))));
    }
    root.appendChild(el("button", { class: "ghost-btn mt", text: "오답 전체 비우기", onclick: () => {
      if (confirm("오답 기록을 모두 지울까요?")) { Store.state.progress.wrong = []; Store.save(); this.render(root); }
    }}));
  },
  _retest(items) {
    const pool = VocabTest._pool();
    VocabTest.session = {
      qs: items.map(it => {
        const w = Data.byEn[it.en.toLowerCase()] || { en: it.en, ko: it.ko };
        const t = it.type === "sa" && Data.sa(w.en) ? "sa" : (it.type === "e" ? "e" : "k");
        return VocabTest._makeQ(t, w, pool);
      }),
      i: 0, correct: 0, wrong: [], answered: [], t0: Date.now(), sectionLabel: "오답 재시험 · 단어"
    };
    VocabTest.cfg.mode = "study";
    Runner.run(VocabTest.session, "오답 재시험", (s) => {
      // 맞힌 오답은 노트에서 제거
      const wrongKeys = new Set(s.wrong.map(q => q.key));
      Store.clearWrong(x => x.type !== "reading" && !wrongKeys.has(x.key) && items.some(it => it.key === x.key));
      VocabTest._finish(s);
    });
  }
};

/* ---------- 설정 ---------- */
const Settings = {
  render(root) {
    root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [el("h2", { text: "⚙️ 설정" })]));
    const card = el("div", { class: "setup-card" });
    // 다크모드
    card.appendChild(this._toggle("🌙 다크 모드", "dark", v => document.documentElement.classList.toggle("dark", v)));
    // 글자 크기
    card.appendChild(el("label", { class: "field-label", text: "글자 크기" }));
    const cur = localStorage.getItem("ddj_fs") || "100";
    card.appendChild(el("div", { class: "chip-row" }, [["작게", "90"], ["보통", "100"], ["크게", "115"], ["아주 크게", "130"]].map(([l, v]) =>
      el("button", { class: "pick" + (cur === v ? " on" : ""), text: l, onclick: (e) => {
        document.documentElement.style.fontSize = v + "%"; localStorage.setItem("ddj_fs", v);
        $$(".pick", e.target.parentElement).forEach(x => x.classList.toggle("on", x === e.target));
      }}))));
    card.appendChild(el("div", { class: "set-info" }, [
      el("div", { text: `학생: ${Store.state.student.name} (${Store.state.student.class})` }),
      el("div", { class: "muted", text: API.enabled ? "서버 연결됨 · 진도 동기화 중" : "로컬 모드 (백엔드 미연결)" })
    ]));
    card.appendChild(el("button", { class: "ghost-btn danger", text: "로그아웃", onclick: () => {
      if (confirm("로그아웃할까요? 이 기기의 진도 캐시가 지워져요. (서버 진도는 유지)")) { Store.reset(); location.reload(); }
    }}));
    root.appendChild(card);
  },
  _toggle(label, key, fn) {
    const on = localStorage.getItem("ddj_" + key) === "1";
    fn(on);
    const sw = el("button", { class: "switch" + (on ? " on" : ""), onclick: () => {
      const v = !sw.classList.contains("on");
      sw.classList.toggle("on", v); localStorage.setItem("ddj_" + key, v ? "1" : "0"); fn(v);
    }});
    return el("div", { class: "toggle-row" }, [el("span", { text: label }), sw]);
  }
};

/* ---------- 부팅 ---------- */
async function boot() {
  if (localStorage.getItem("ddj_dark") === "1") document.documentElement.classList.add("dark");
  const fs = localStorage.getItem("ddj_fs"); if (fs) document.documentElement.style.fontSize = fs + "%";
  Store.load();
  await Data.load();
  await Bank.load();
  await Guide.load();
  Audio2.init();
  if (CONFIG.KAKAO_JS_KEY) loadKakao();
  if (Store.state.student) boot2();
  else Login.render();
  API.flushQueue();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}

function loadKakao() {
  const s = el("script", { src: "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js" });
  s.onload = () => { try { if (!Kakao.isInitialized()) Kakao.init(CONFIG.KAKAO_JS_KEY); } catch (e) {} };
  document.head.appendChild(s);
}

function boot2() {
  App.init();
  Course.start();
}

document.addEventListener("DOMContentLoaded", boot);
