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
        el("p", { text: "이 레벨의 문제는 준비 중이에요." }),
        el("p", { class: "muted", text: "노션의 변형/엘리트 자료를 동일한 형식으로 추가하면 바로 나타납니다." })
      ]));
    }
    sets.forEach(s => {
      const done = (Store.state.progress.results || []).find(r => r.section === "독해 " + s.id);
      list.appendChild(el("button", {
        class: "set-card", onclick: () => this.openSet(s.id)
      }, [
        el("div", { class: "set-main" }, [
          el("div", { class: "set-title", text: s.title }),
          el("div", { class: "set-sub", text: `${s.source} · 지문 ${s.passages.length} · 문항 ${s.questions.length}` })
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
      el("button", { class: "back", text: "← 목록", onclick: () => Router.go("reading") }),
      el("h2", { text: s.title }),
      el("p", { class: "muted", text: `${s.source} · ${s.level}` })
    ]));

    const t0 = Date.now();
    const answers = {};   // qid -> index

    // 지문들
    s.passages.forEach(p => {
      const box = el("div", { class: "passage-box" });
      box.appendChild(el("div", { class: "passage-head" }, [
        el("span", { class: "passage-no", text: "지문 " + p.no }),
        el("span", { class: "passage-title", text: p.title })
      ]));
      if (p.topic) box.appendChild(el("div", { class: "passage-topic", text: "💡 " + p.topic }));
      box.appendChild(el("p", { class: "passage-en" }, [tappableText(p.en)]));
      // 해석 토글 (L0 기본 펼침)
      const ko = el("div", { class: "passage-ko" + (isL0 ? "" : " hidden"), text: p.ko });
      box.appendChild(el("button", {
        class: "toggle-btn", text: isL0 ? "한글 해석 접기 ▲" : "한글 해석 보기 ▼",
        onclick: (e) => { ko.classList.toggle("hidden"); e.target.textContent = ko.classList.contains("hidden") ? "한글 해석 보기 ▼" : "한글 해석 접기 ▲"; }
      }));
      box.appendChild(ko);
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
    });

    // 문항들
    const qWrap = el("div", { class: "q-wrap" });
    s.questions.forEach((q, qi) => {
      const card = el("div", { class: "rq-card", "data-qid": q.id });
      card.appendChild(el("div", { class: "rq-head" }, [
        el("span", { class: "rq-type", text: q.type }),
        el("span", { class: "rq-stem", text: `${qi + 1}. ${q.stem}` })
      ]));
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
      qWrap.appendChild(card);
    });
    root.appendChild(qWrap);

    root.appendChild(el("button", {
      class: "primary-btn big", text: "채점하기 ✓",
      onclick: (e) => {
        if (Object.keys(answers).length < s.questions.length) {
          if (!confirm("아직 안 푼 문항이 있어요. 그래도 채점할까요?")) return;
        }
        this._grade(s, answers, qWrap, t0);
        e.target.remove();
      }
    }));
    window.scrollTo(0, 0);
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
