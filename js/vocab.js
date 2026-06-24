/* ===========================================================
 *  vocab.js — 인터랙티브 단어장 + 단어 테스트 4종
 * =========================================================== */

/* ---------- 공용: 단어 상세 시트 (단어장·독해 공용) ---------- */
function openWordSheet(en) {
  const item = Data.byEn[String(en).toLowerCase()] || { en, ko: "" };
  const sa = Data.sa(en);
  const seen = Store.state.progress.vocabSeen[en.toLowerCase()] || 0;
  const starred = !!Store.state.progress.starred[en.toLowerCase()];
  const pt = Data.point(en);   // 이번 시험 포인트(함정·정의)

  const badge = item.src === "school"
    ? el("span", { class: "src-badge school", text: "학교" })
    : item.src === "anal" ? el("span", { class: "src-badge anal", text: "분석" }) : null;

  const saRows = [];
  if (sa && sa.syn && sa.syn.length)
    saRows.push(el("div", { class: "sa-line" }, [
      el("span", { class: "sa-sym eq", text: "=" }),
      el("span", { class: "sa-terms", text: sa.syn.join(", ") })
    ]));
  if (sa && sa.ant && sa.ant.length)
    saRows.push(el("div", { class: "sa-line" }, [
      el("span", { class: "sa-sym ar", text: "↔" }),
      el("span", { class: "sa-terms", text: sa.ant.join(", ") })
    ]));

  const sheet = el("div", { class: "sheet word-sheet" }, [
    el("div", { class: "sheet-grip" }),
    el("div", { class: "ws-head" }, [
      el("button", { class: "ws-audio", title: "발음 듣기", onclick: () => Audio2.speak(en), html: "🔊" }),
      el("div", { class: "ws-en" }, [document.createTextNode(item.en), badge]),
      el("button", {
        class: "ws-star" + (starred ? " on" : ""), title: "모르는 단어 표시",
        html: starred ? "★" : "☆",
        onclick: (e) => {
          const k = en.toLowerCase();
          if (Store.state.progress.starred[k]) delete Store.state.progress.starred[k];
          else Store.state.progress.starred[k] = true;
          Store.save();
          e.target.classList.toggle("on");
          e.target.textContent = Store.state.progress.starred[k] ? "★" : "☆";
        }
      })
    ]),
    el("div", { class: "ws-ko", text: item.ko || "(뜻 정보 없음)" }),
    item.deckLabel ? el("div", { class: "ws-meta", text: `${item.deckLabel}${item.passage ? " · " + item.passage : ""}` }) : null,
    saRows.length ? el("div", { class: "ws-sa" }, saRows) : null,
    (saRows.length || (pt && pt.notes && pt.notes.length)) ? el("div", { class: "ws-point" }, [
      el("div", { class: "ws-point-h", text: "🎯 이번 시험 포인트" }),
      saRows.length ? el("div", { class: "ws-point-tip", text: "동대전고 빈출 — 동의어/반의어 교체에 주의 (위 = · ↔ 확인)" }) : null,
      ...((pt && pt.notes) ? pt.notes.map(n => el("div", { class: "ws-point-note", text: "• " + n })) : [])
    ]) : null,
    el("div", { class: "ws-read" }, [
      el("span", { class: "ws-read-label", text: "회독" }),
      ...[1, 2, 3].map(n => el("button", {
        class: "read-dot" + (seen >= n ? " on" : ""), text: String(n),
        onclick: (e) => {
          const k = en.toLowerCase();
          const cur = Store.state.progress.vocabSeen[k] || 0;
          Store.state.progress.vocabSeen[k] = (cur >= n) ? n - 1 : n;
          Store.save();
          $$(".read-dot", sheet).forEach((d, i) => d.classList.toggle("on", (Store.state.progress.vocabSeen[k] || 0) >= i + 1));
        }
      }))
    ])
  ]);
  showSheet(sheet);
}

/* ---------- 인터랙티브 단어장 ---------- */
const VocabDict = {
  deck: null, q: "",
  render(root) {
    this.deck = this.deck || Data.vocab.decks[0].id;
    root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "📖 인터랙티브 단어장" }),
      el("p", { class: "muted", text: "단어를 누르면 뜻·동의어/반의어·발음을 볼 수 있어요. ☆로 모르는 단어를 모아두세요." })
    ]));
    // 덱 탭
    const tabs = el("div", { class: "tabs scroll-x" },
      Data.vocab.decks.map(d => el("button", {
        class: "tab" + (d.id === this.deck ? " on" : ""), text: d.label,
        onclick: () => { this.deck = d.id; this.render(root); }
      })));
    root.appendChild(tabs);
    // 검색
    const search = el("input", {
      class: "search", type: "search", placeholder: "단어/뜻 검색…", value: this.q,
      oninput: (e) => { this.q = e.target.value; this._list(listWrap); }
    });
    root.appendChild(el("div", { class: "search-wrap" }, [search,
      el("button", {
        class: "ghost-btn", text: "★ 내 단어장",
        onclick: () => { this.deck = "__star"; this.render(root); }
      })]));
    const listWrap = el("div", { class: "vocab-list" });
    root.appendChild(listWrap);
    this._list(listWrap);
  },
  _list(wrap) {
    wrap.innerHTML = "";
    const q = this.q.trim().toLowerCase();
    if (this.deck === "__star") {
      const items = Data.allWords.filter(w => Store.state.progress.starred[w.en.toLowerCase()]);
      if (!items.length) { wrap.appendChild(el("p", { class: "muted pad", text: "아직 ☆로 표시한 단어가 없어요." })); return; }
      wrap.appendChild(this._group("★ 내 단어장", items.filter(w => !q || w.en.toLowerCase().includes(q) || w.ko.includes(q))));
      return;
    }
    const deck = Data.vocab.decks.find(d => d.id === this.deck);
    deck.passages.forEach(p => {
      const items = p.words.filter(w => !q || w.en.toLowerCase().includes(q) || (w.ko || "").includes(q));
      if (items.length) wrap.appendChild(this._group(p.tag, items));
    });
  },
  _group(title, items) {
    return el("div", { class: "vgroup" }, [
      title ? el("div", { class: "vgroup-tag", text: title }) : null,
      el("div", { class: "vgroup-items" }, items.map(w => {
        const k = w.en.toLowerCase();
        const star = Store.state.progress.starred[k];
        const seen = Store.state.progress.vocabSeen[k] || 0;
        return el("button", {
          class: "vchip" + (star ? " star" : ""),
          onclick: () => openWordSheet(w.en)
        }, [
          el("span", { class: "vchip-en", text: w.en }),
          el("span", { class: "vchip-ko", text: w.ko || "" }),
          seen ? el("span", { class: "vchip-seen", text: "•".repeat(seen) }) : null,
          Data.sa(w.en) ? el("span", { class: "vchip-sa", text: "동반의" }) : null
        ]);
      }))
    ]);
  }
};

/* ---------- 단어 테스트 ---------- */
const VocabTest = {
  TYPES: {
    k:  { label: "한글 쓰기 (영→뜻)",     hint: "영어를 보고 뜻 고르기" },
    e:  { label: "영어 쓰기 (뜻→영)",     hint: "뜻을 보고 영어 고르기" },
    sa: { label: "동의어·반의어",          hint: "동의어/반의어 고르기" },
    mix:{ label: "종합 섞어쓰기",          hint: "세 유형을 섞어서" }
  },
  cfg: { deck: null, type: "k", mode: "study", count: 20, mc: true },

  setup(root) {
    this.cfg.deck = this.cfg.deck || Data.vocab.decks[0].id;
    root.innerHTML = "";
    root.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "📝 단어 테스트" }),
      el("p", { class: "muted", text: "범위·유형·모드를 고르고 시작하세요. 끝나면 결과가 선생님께 자동 전송돼요." })
    ]));
    const c = this.cfg;
    const card = el("div", { class: "setup-card" });

    card.appendChild(el("label", { class: "field-label", text: "범위" }));
    card.appendChild(el("div", { class: "chip-row" },
      [{ id: "__all", label: "전체" }, ...Data.vocab.decks].map(d => el("button", {
        class: "pick" + (c.deck === d.id ? " on" : ""), text: d.label,
        onclick: (e) => { c.deck = d.id; $$(".pick", e.target.parentElement).forEach(x => x.classList.remove("on")); e.target.classList.add("on"); }
      }))));

    card.appendChild(el("label", { class: "field-label", text: "유형" }));
    card.appendChild(el("div", { class: "chip-row" },
      Object.entries(this.TYPES).map(([id, t]) => el("button", {
        class: "pick" + (c.type === id ? " on" : ""), text: t.label,
        onclick: (e) => { c.type = id; $$(".pick", e.target.parentElement).forEach(x => x.classList.remove("on")); e.target.classList.add("on"); }
      }))));

    card.appendChild(el("label", { class: "field-label", text: "모드" }));
    card.appendChild(el("div", { class: "chip-row" }, [
      ["study", "학습 (바로 정답 확인)"], ["exam", "시험 (끝나고 채점)"]
    ].map(([id, lab]) => el("button", {
      class: "pick" + (c.mode === id ? " on" : ""), text: lab,
      onclick: (e) => { c.mode = id; $$(".pick", e.target.parentElement).forEach(x => x.classList.remove("on")); e.target.classList.add("on"); }
    }))));

    card.appendChild(el("label", { class: "field-label", text: "방식 / 문항 수" }));
    const row = el("div", { class: "chip-row" });
    [["객관식", true], ["주관식 입력", false]].forEach(([lab, v]) => row.appendChild(el("button", {
      class: "pick" + (c.mc === v ? " on" : ""), text: lab,
      onclick: (e) => { c.mc = v; $$(".pick", row).forEach(x => x.classList.toggle("on", x === e.target)); }
    })));
    [10, 20, 30, 50].forEach(n => row.appendChild(el("button", {
      class: "pick num" + (c.count === n ? " on" : ""), text: String(n),
      onclick: (e) => { c.count = n; $$(".pick.num", row).forEach(x => x.classList.toggle("on", x === e.target)); }
    })));
    card.appendChild(row);

    card.appendChild(el("button", { class: "primary-btn big", text: "시작하기 ▶", onclick: () => this.start() }));
    root.appendChild(card);
  },

  _pool() {
    const c = this.cfg;
    let words = c.deck === "__all" ? Data.allWords.slice()
      : Data.vocab.decks.find(d => d.id === c.deck).passages.flatMap(p =>
          p.words.map(w => ({ ...w, deckLabel: c.deck })));
    // 중복 영어 제거
    const seen = new Set(); words = words.filter(w => { const k = w.en.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    return words.filter(w => w.en && w.ko);
  },

  _makeQ(type, w, pool) {
    if (type === "sa") {
      const sa = Data.sa(w.en);
      const useAnt = sa.ant && sa.ant.length && (!sa.syn.length || Math.random() < 0.4);
      const correct = (useAnt ? sa.ant : sa.syn)[0];
      const distract = sample(pool.filter(x => x.en.toLowerCase() !== w.en.toLowerCase()), 3).map(x => x.en.split("/")[0].trim());
      const opts = shuffle([correct, ...distract]);
      return {
        top: useAnt ? "다음 단어의 반의어(↔)는?" : "다음 단어의 동의어(=)는?",
        main: `${w.en}  —  ${w.ko}`, audio: w.en,
        options: opts, answerIndex: opts.indexOf(correct),
        explain: `${w.en} ${useAnt ? "↔" : "="} ${(useAnt ? sa.ant : sa.syn).join(", ")}`,
        key: "sa:" + w.en.toLowerCase(), rec: { type: "sa", key: "sa:" + w.en.toLowerCase(), en: w.en, ko: w.ko, q: "동반의어" }
      };
    }
    if (type === "k") { // 영→뜻
      if (this.cfg.mc) {
        const distract = sample(pool.filter(x => x.en.toLowerCase() !== w.en.toLowerCase()), 3).map(x => x.ko);
        const opts = shuffle([w.ko, ...distract]);
        return { top: "뜻을 고르세요", main: w.en, audio: w.en, options: opts, answerIndex: opts.indexOf(w.ko),
          explain: `${w.en} = ${w.ko}`, key: "k:" + w.en.toLowerCase(),
          rec: { type: "k", key: "k:" + w.en.toLowerCase(), en: w.en, ko: w.ko, q: "영→뜻" } };
      }
      return { top: "뜻을 입력하세요", main: w.en, audio: w.en, text: true, answerText: w.ko, grade: (v) => koMatch(v, w.ko),
        explain: `${w.en} = ${w.ko}`, key: "k:" + w.en.toLowerCase(),
        rec: { type: "k", key: "k:" + w.en.toLowerCase(), en: w.en, ko: w.ko, q: "영→뜻" } };
    }
    // e: 뜻→영
    if (this.cfg.mc) {
      const distract = sample(pool.filter(x => x.en.toLowerCase() !== w.en.toLowerCase()), 3).map(x => x.en);
      const opts = shuffle([w.en, ...distract]);
      return { top: "영어를 고르세요", main: w.ko, options: opts, answerIndex: opts.indexOf(w.en),
        explain: `${w.ko} = ${w.en}`, key: "e:" + w.en.toLowerCase(),
        rec: { type: "e", key: "e:" + w.en.toLowerCase(), en: w.en, ko: w.ko, q: "뜻→영" } };
    }
    const sa = Data.sa(w.en);
    return { top: "영어를 입력하세요", main: w.ko, text: true, answerText: w.en,
      grade: (v) => enMatch(v, w.en, sa ? sa.syn : []), explain: `${w.ko} = ${w.en}`,
      key: "e:" + w.en.toLowerCase(), rec: { type: "e", key: "e:" + w.en.toLowerCase(), en: w.en, ko: w.ko, q: "뜻→영" } };
  },

  start() {
    const c = this.cfg;
    let pool = this._pool();
    if (c.type === "sa") pool = pool.filter(w => { const s = Data.sa(w.en); return s && ((s.syn && s.syn.length) || (s.ant && s.ant.length)); });
    if (pool.length < 4) { alert("이 범위/유형에 충분한 단어가 없어요. 다른 범위를 골라보세요."); return; }
    const picks = sample(pool, Math.min(c.count, pool.length));
    this.session = {
      qs: picks.map(w => {
        const t = c.type === "mix" ? ["k", "e", "sa"][Math.floor(Math.random() * 3)] : c.type;
        const tt = (t === "sa" && !(Data.sa(w.en))) ? "k" : t;
        return this._makeQ(tt, w, pool);
      }),
      i: 0, correct: 0, wrong: [], answered: [], t0: Date.now(),
      sectionLabel: `단어테스트 · ${c.deck === "__all" ? "전체" : Data.vocab.decks.find(d => d.id === c.deck).label} · ${this.TYPES[c.type].label}`
    };
    Runner.run(this.session, "단어 테스트", (s) => this._finish(s));
  },

  _finish(s) {
    Store.bumpStreak();
    if (s.wrong.length) Store.addWrong(s.wrong.map(q => q.rec));
    Store.save();
    const pct = Math.round(s.correct / s.qs.length * 100);
    const dur = (Date.now() - s.t0) / 1000;
    const result = {
      section: s.sectionLabel, kind: "vocab",
      score: s.correct, total: s.qs.length, pct, duration: Math.round(dur),
      wrong: s.wrong.map(q => ({ q: q.main, answer: q.explain }))
    };
    Results.show(result, () => Router.go("test"));
    API.submit(result);
  }
};
