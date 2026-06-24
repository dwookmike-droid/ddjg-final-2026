/* ===========================================================
 *  reading.js — 레벨별 독해 시험 (L0 한국어 선지 → L4 엘리트)
 * =========================================================== */
const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦"];

// 영어 지문을 단어 단위로 탭 가능하게
function tappableText(str) {
  const frag = document.createDocumentFragment();
  String(str).split(/(\b)/).forEach(tok => {
    if (/^[A-Za-z][A-Za-z'-]{2,}$/.test(tok)) {
      frag.appendChild(el("span", {
        class: "tap-word", text: tok,
        onclick: () => openWordSheet(tok)
      }));
    } else frag.appendChild(document.createTextNode(tok));
  });
  return frag;
}

const Reading = {
  level: "L0",
  render(root) {
    root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "📚 레벨별 독해 시험" }),
      el("p", { class: "muted", text: "쉬운 한국어 선지(L0)부터 고난도(L4)까지. 내 단계부터 시작해 한 칸씩 올라가요." })
    ]));
    // 레벨 탭
    root.appendChild(el("div", { class: "tabs scroll-x" },
      Data.reading.levels.map(lv => el("button", {
        class: "tab lvl" + (lv.id === this.level ? " on" : ""),
        html: `${lv.badge || ""} ${lv.id}`,
        onclick: () => { this.level = lv.id; this.render(root); }
      }))));
    const lv = Data.reading.levels.find(l => l.id === this.level);
    root.appendChild(el("div", { class: "level-desc" }, [
      el("b", { text: `${lv.badge || ""} ${lv.name} · ${lv.grade}` }),
      el("span", { class: "muted", text: " — " + lv.desc })
    ]));
    // 세트 목록
    const sets = Data.reading.sets.filter(s => s.level === this.level);
    const list = el("div", { class: "set-list" });
    if (!sets.length) {
      list.appendChild(el("div", { class: "empty-card" }, [
        el("p", { text: `${lv.badge || ""} ${lv.name} 독해 세트는 준비 중이에요.` }),
        el("p", { class: "muted", text: "이 난도의 문제는 지금 ‘유형별 훈련’에서 빈칸·순서·어법·어휘별로 골라 풀 수 있어요." }),
        el("button", { class: "primary-btn", text: "🔥 유형별 훈련으로 가기", onclick: () => Router.go("drill") })
      ]));
    }
    sets.forEach(s => {
      const done = (Store.state.progress.results || []).find(r => r.section === "독해 " + s.id);
      list.appendChild(el("button", {
        class: "set-card", onclick: () => this.openSet(s.id)
      }, [
        el("div", { class: "set-main" }, [
          el("div", { class: "set-title", text: s.title }),
          el("div", { class: "set-sub", text: s.passages.length ? `${s.source} · 지문 ${s.passages.length} · 문항 ${s.questions.length}` : `${s.source} · ${s.questions.length}문항` })
        ]),
        done ? el("span", { class: "set-badge ok", text: `${done.pct}점` }) : el("span", { class: "set-go", text: "▶" })
      ]));
    });
    root.appendChild(list);
  },

  openSet(setId) {
    const s = Data.reading.sets.find(x => x.id === setId);
    const root = Router.main; root.innerHTML = "";
    const isL0 = s.level === "L0";
    root.appendChild(el("div", { class: "page-head" }, [
      el("button", { class: "back", text: "← 목록", onclick: () => { Karaoke.stop(); Router.go("reading"); } }),
      el("h2", { text: s.title }),
      el("p", { class: "muted", text: `${s.source} · ${s.level}` })
    ]));

    const t0 = Date.now();
    const answers = {};   // qid -> index

    // 문항을 지문별 / 크로스 / 예외로 분류 (passage = 0-기반 지문 인덱스)
    const np = s.passages.length;
    const byP = Array.from({ length: np }, () => []);
    const crossQ = [];
    const orphan = [];
    s.questions.forEach((q, i) => {
      const entry = [q, i + 1];               // [문항, 원본번호]
      if (q.cross) crossQ.push(entry);
      else if (Number.isInteger(q.passage) && q.passage >= 0 && q.passage < np) byP[q.passage].push(entry);
      else orphan.push(entry);
    });

    // 상단 가이드: 몇 번 문제가 어느 지문인지
    if (np) {
      const guide = el("div", { class: "rq-guide" });
      guide.appendChild(el("div", { class: "rq-guide-h", text: "📋 지문별 문항 안내 — 각 지문 바로 아래에 그 지문으로 푸는 문제가 있어요" }));
      s.passages.forEach((p, j) => {
        const nums = byP[j].map(e => e[1]);
        guide.appendChild(el("div", { class: "rq-guide-row" }, [
          el("span", { class: "rq-guide-p", text: `지문 ${j + 1}. ${p.title}` }),
          el("span", { class: "rq-guide-q", text: nums.length ? "문제 " + nums.join(", ") : "(연결 문항 없음)" })
        ]));
      });
      if (crossQ.length) {
        guide.appendChild(el("div", { class: "rq-guide-row cross" }, [
          el("span", { class: "rq-guide-p", text: "🔀 크로스·통합" }),
          el("span", { class: "rq-guide-q", text: "문제 " + crossQ.map(e => e[1]).join(", ") })
        ]));
      }
      root.appendChild(guide);
    } else {
      root.appendChild(el("div", { class: "variant-note muted", text: "📝 영어 선지 종합 변형 회차예요. 지문은 각 문항에 인용으로 주어집니다." }));
    }

    // 지문 + 그 지문에 속한 문항을 함께 렌더
    s.passages.forEach((p, j) => {
      const box = el("div", { class: "passage-box" });
      box.appendChild(el("div", { class: "passage-head" }, [
        el("span", { class: "passage-no", text: "지문 " + (j + 1) }),
        el("span", { class: "passage-title", text: p.title })
      ]));
      if (p.topic) box.appendChild(el("div", { class: "passage-topic", text: "💡 " + p.topic }));
      // 따라 읽기(문장단위 TTS 노래방) + 영어 지문(문장 span, 단어 탭 유지)
      const enSents = Karaoke.splitSents(p.en);
      const koSents = Karaoke.splitSents(p.ko);
      const enSpans = [], koSpans = [];
      const playBtn = el("button", { class: "kk-btn", html: "▶ 따라 읽기" });
      box.appendChild(el("div", { class: "kk-bar" }, [playBtn]));
      const enP = el("p", { class: "passage-en" });
      enSents.forEach(sent => {
        const sp = el("span", { class: "kk-sent" }, [tappableText(sent)]);
        enSpans.push(sp); enP.appendChild(sp); enP.appendChild(document.createTextNode(" "));
      });
      box.appendChild(enP);
      // 해석(문장 span) 토글
      const ko = el("div", { class: "passage-ko" + (isL0 ? "" : " hidden") });
      koSents.forEach(sent => { const sp = el("span", { class: "kk-ko" }, [document.createTextNode(sent + " ")]); koSpans.push(sp); ko.appendChild(sp); });
      box.appendChild(el("button", {
        class: "toggle-btn", text: isL0 ? "한글 해석 접기 ▲" : "한글 해석 보기 ▼",
        onclick: (e) => { ko.classList.toggle("hidden"); e.target.textContent = ko.classList.contains("hidden") ? "한글 해석 보기 ▼" : "한글 해석 접기 ▲"; }
      }));
      box.appendChild(ko);
      // 재생 제어
      const clearHl = () => { enSpans.forEach(x => x.classList.remove("kk-on")); koSpans.forEach(x => x.classList.remove("kk-on")); };
      playBtn.onclick = () => {
        if (Karaoke.active) { Karaoke.stop(); clearHl(); playBtn.innerHTML = "▶ 따라 읽기"; return; }
        $$(".kk-on", root).forEach(x => x.classList.remove("kk-on"));
        $$(".kk-btn", root).forEach(b => { if (b !== playBtn) b.innerHTML = "▶ 따라 읽기"; });
        ko.classList.remove("hidden");
        playBtn.innerHTML = "⏸ 정지";
        const ok = Karaoke.play(enSents, (i) => {
          clearHl();
          if (enSpans[i]) { enSpans[i].classList.add("kk-on"); enSpans[i].scrollIntoView({ block: "center", behavior: "smooth" }); }
          const ki = koSents.length ? Math.min(koSents.length - 1, Math.round(i * koSents.length / Math.max(1, enSents.length))) : -1;
          if (ki >= 0 && koSpans[ki]) koSpans[ki].classList.add("kk-on");
        }, () => { clearHl(); playBtn.innerHTML = "▶ 따라 읽기"; });
        if (!ok) playBtn.innerHTML = "▶ 따라 읽기";
      };
      // 핵심 어휘
      if (p.vocab && p.vocab.length) {
        const vt = el("div", { class: "passage-vocab hidden" },
          p.vocab.map(v => el("div", { class: "pv-row" }, [
            el("span", { class: "pv-en", text: v.en, onclick: () => Audio2.speak(v.en) }),
            el("span", { class: "pv-ko", text: v.ko })
          ])));
        box.appendChild(el("button", {
          class: "toggle-btn", text: "핵심 어휘 보기 ▼",
          onclick: (e) => { vt.classList.toggle("hidden"); e.target.textContent = vt.classList.contains("hidden") ? "핵심 어휘 보기 ▼" : "핵심 어휘 접기 ▲"; }
        }));
        box.appendChild(vt);
      }
      root.appendChild(box);

      // 이 지문으로 푸는 문항을 지문 바로 아래에 배치
      if (byP[j].length) {
        const qw = el("div", { class: "q-wrap under" });
        qw.appendChild(el("div", { class: "q-group-h", text: `📝 지문 ${j + 1} 문제 (${byP[j].map(e => e[1]).join(", ")}번)` }));
        byP[j].forEach(e => qw.appendChild(this._qcard(s, e[0], e[1], answers)));
        root.appendChild(qw);
      }
    });

    // 크로스·통합 문항 (여러 지문을 묶어 푸는 문제 — 비교 자료는 문제 안에 포함)
    if (crossQ.length) {
      const cw = el("div", { class: "q-wrap cross-wrap" });
      cw.appendChild(el("div", { class: "q-group-h cross", text: "🔀 크로스·통합 문제 — 여러 지문을 묶어 푸는 문제예요 (비교 자료는 문제 안에 있어요)" }));
      crossQ.forEach(e => cw.appendChild(this._qcard(s, e[0], e[1], answers)));
      root.appendChild(cw);
    }
    // 예외(지문 미연결) 문항
    if (orphan.length) {
      const ow = el("div", { class: "q-wrap" });
      orphan.forEach(e => ow.appendChild(this._qcard(s, e[0], e[1], answers)));
      root.appendChild(ow);
    }

    root.appendChild(el("button", {
      class: "primary-btn big", text: "채점하기 ✓",
      onclick: (e) => {
        if (Object.keys(answers).length < s.questions.length) {
          if (!confirm("아직 안 푼 문항이 있어요. 그래도 채점할까요?")) return;
        }
        this._grade(s, answers, root, t0);
        e.target.remove();
      }
    }));
    window.scrollTo(0, 0);
  },

  // 문항 카드 1개 생성 (n = 화면 표시 번호)
  _qcard(s, q, n, answers) {
    const card = el("div", { class: "rq-card", "data-qid": q.id });
    card.appendChild(el("div", { class: "rq-head" }, [
      el("span", { class: "rq-type", text: q.type }),
      el("span", { class: "rq-stem", text: `${n}. ${q.stem}` })
    ]));
    if (q.selfContained && q.lead) card.appendChild(el("div", { class: "rq-selftag", text: "📎 아래 문장만 보고 풀어요 (지문 전체 안 봐도 됨)" }));
    if (q.lead) card.appendChild(el("div", { class: "rq-lead", text: q.lead }));
    const opts = el("div", { class: "rq-opts" });
    q.options.forEach((o, oi) => {
      opts.appendChild(el("button", {
        class: "rq-opt", "data-oi": oi,
        html: `<span class="oc">${CIRCLED[oi]}</span><span>${esc(o)}</span>`,
        onclick: (e) => {
          answers[q.id] = oi;
          $$(".rq-opt", opts).forEach(b => b.classList.toggle("sel", b === e.currentTarget));
        }
      }));
    });
    card.appendChild(opts);
    card.appendChild(el("div", { class: "rq-explain hidden" }));
    card.appendChild(el("button", { class: "report-btn", html: "⚠️ 오류 신고",
      onclick: () => ReportFlag.open({ id: s.id + ":" + q.id, where: `${s.source || ""} ${q.type || ""}`.trim(), stem: q.stem }) }));
    return card;
  },

  _grade(s, answers, qWrap, t0) {
    let correct = 0; const wrong = [];
    s.questions.forEach(q => {
      const card = $(`.rq-card[data-qid="${q.id}"]`, qWrap);
      const chosen = answers[q.id];
      $$(".rq-opt", card).forEach(b => {
        const oi = +b.dataset.oi;
        b.disabled = true;
        if (oi === q.answer) b.classList.add("correct");
        if (oi === chosen && chosen !== q.answer) b.classList.add("wrong");
      });
      const ok = chosen === q.answer;
      if (ok) correct++;
      else wrong.push({ type: "reading", key: s.id + ":" + q.id, q: `${s.id} ${q.id}`, en: q.stem, ko: `정답 ${CIRCLED[q.answer]}` });
      const ex = $(".rq-explain", card);
      ex.classList.remove("hidden");
      ex.innerHTML = `<b>정답 ${CIRCLED[q.answer]}</b> — ${esc(q.explain || "")}`;
    });
    if (wrong.length) Store.addWrong(wrong);
    Store.bumpStreak(); Store.save();
    const pct = Math.round(correct / s.questions.length * 100);
    const result = {
      section: "독해 " + s.id, kind: "reading",
      score: correct, total: s.questions.length, pct,
      duration: Math.round((Date.now() - t0) / 1000),
      wrong: wrong.map(w => ({ q: w.q, answer: w.ko }))
    };
    Results.show(result, () => Router.go("reading"));
    API.submit(result);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }
};
