/* ===========================================================
 *  guide.js — 학습 가이드(튜토리얼)
 *  공부 시작점을 모르는 학생용: 단계별 목적·순서 + 오늘 추천 + 사용법
 * =========================================================== */
const StudyGuide = {
  // 첫 진입 학생(진도 0)에게 1회 자동 노출
  shouldAutoShow() {
    try {
      if (localStorage.getItem("ddj_guide_seen")) return false;
      return ((Store.state.progress.results || []).length === 0);
    } catch (e) { return false; }
  },

  _stats() {
    const P = Store.state.progress;
    const results = P.results || [];
    const hasKind = k => results.some(r => r.kind === k);
    const seenN = Object.values(P.vocabSeen || {}).filter(v => v >= 1).length;
    let totalWords = 0;
    try {
      (Data.vocab.decks || []).forEach(d => d.passages.forEach(p => p.words.forEach(w => { if (w.en && w.ko) totalWords++; })));
    } catch (e) {}
    totalWords = totalWords || 1;
    const wrongN = (P.wrong || []).length;
    const readDone = hasKind("reading") || hasKind("course") || results.some(r => /빈칸/.test(r.section || ""));
    return { results, hasKind, seenN, totalWords, wrongN, readDone };
  },

  // 6단계 정의. status: 'done' | 'todo'. badge: 짧은 진행 표시.
  _steps(s) {
    return [
      { ic: "📖", title: "단어 익히기", view: "dict",
        purpose: "지문·문제를 푸는 기초 재료예요. 모르는 단어가 많으면 아무것도 안 보여요. 단어장으로 뜻·발음을 먼저 훑어요.",
        done: s.seenN >= s.totalWords * 0.6, badge: `${s.seenN}/${s.totalWords} 단어` },
      { ic: "📝", title: "단어 확인", view: "test",
        purpose: "외운 단어가 진짜 머리에 남았는지 점검해요. 틀린 단어는 자동으로 오답노트에 모여요.",
        done: s.hasKind("vocab"), badge: s.hasKind("vocab") ? "응시함" : "미응시" },
      { ic: "📚", title: "본문 이해", view: "reading",
        purpose: "시험 범위 본문을 정확히 읽는 단계예요. 쉬운 레벨(L0)부터, 본문 빈칸으로 흐름을 잡아요.",
        done: s.readDone, badge: s.readDone ? "시작함" : "미시작" },
      { ic: "🔥", title: "유형 적응", view: "drill",
        purpose: "빈칸·순서·어법·어휘 등 문제 유형별 푸는 법을 익혀요. 약한 유형만 골라 훈련할 수 있어요.",
        done: s.hasKind("drill"), badge: s.hasKind("drill") ? "시작함" : "미시작" },
      { ic: "🏆", title: "실전 점검", view: "mock",
        purpose: "실제 시험처럼 30문항을 시간 안에 풀어요. 예상 등급과 풀이 순서·함정을 확인해요.",
        done: s.hasKind("mock"), badge: s.hasKind("mock") ? "응시함" : "미응시" },
      { ic: "✍️", title: "약점 보강", view: "wrong",
        purpose: "틀린 단어·문항만 모아 반복해요. 시험 직전엔 여기만 봐도 점수가 올라요.",
        done: s.wrongN === 0, badge: s.wrongN ? `복습 ${s.wrongN}개` : "오답 없음" },
    ];
  },

  // 오늘 추천 단계 인덱스(0-base)
  _recIdx(steps, s) {
    const dday = (typeof DDay !== "undefined") ? DDay.days() : 99;
    if (s.wrongN >= 10) return 5;                       // 오답 많으면 보강 우선
    if (dday <= 3 && s.hasKind("mock")) return 5;        // 막판 + 모의 끝남 → 보강
    for (let i = 0; i < 5; i++) if (!steps[i].done) return i;   // 첫 미완료
    return 4;                                           // 다 했으면 실전 반복
  },

  render(root) {
    try { localStorage.setItem("ddj_guide_seen", "1"); } catch (e) {}
    root.innerHTML = "";
    const s = this._stats();
    const steps = this._steps(s);
    const rec = this._recIdx(steps, s);

    root.appendChild(el("div", { class: "page-head" }, [
      el("h2", { text: "🧭 학습 가이드 — 어디서부터?" }),
      el("p", { class: "muted", text: "무엇부터 해야 할지 모르겠다면 이 순서대로 따라와요. 각 단계가 ‘왜’ 필요한지도 함께 알려줄게요." })
    ]));
    if (typeof DDay !== "undefined") root.appendChild(DDay.card());

    // 오늘 추천(강조)
    const r = steps[rec];
    root.appendChild(el("button", { class: "guide-rec", onclick: () => Router.go(r.view) }, [
      el("span", { class: "gr-label", text: "오늘은 여기부터" }),
      el("span", { class: "gr-title", text: `${r.ic} ${r.title}` }),
      el("span", { class: "gr-purpose", text: r.purpose }),
      el("span", { class: "gr-go", text: "지금 시작하기 →" })
    ]));

    // 로드맵
    root.appendChild(el("h3", { class: "mt", text: "전체 학습 순서" }));
    const list = el("div", { class: "guide-steps" });
    steps.forEach((st, i) => {
      const status = st.done ? "done" : (i === rec ? "now" : "todo");
      const STT = { done: "✓ 완료", now: "▶ 지금", todo: "○ 대기" };
      list.appendChild(el("button", { class: "guide-step " + status, onclick: () => Router.go(st.view) }, [
        el("span", { class: "gs-num", text: String(i + 1) }),
        el("span", { class: "gs-body" }, [
          el("span", { class: "gs-titlerow" }, [
            el("span", { class: "gs-title", text: `${st.ic} ${st.title}` }),
            el("span", { class: "gs-badge " + status, text: STT[status] })
          ]),
          el("span", { class: "gs-purpose", text: st.purpose }),
          el("span", { class: "gs-meta", text: st.badge })
        ]),
        el("span", { class: "gs-go", text: "›" })
      ]));
    });
    root.appendChild(list);

    // 사용법 미니 안내(접이식)
    const tips = [
      ["☰", "왼쪽 위 ☰ 를 누르면 모든 기능(단어장·시험·독해·모의고사·오답)으로 갈 수 있어요."],
      ["↔", "코스 화면에선 아래 ‘이전 / 다음’ 으로 한 단계씩 쭉 이어서 공부해요."],
      ["▶", "지문에서 ‘따라 읽기’ 를 누르면 영어를 읽어주고, 영어·한글을 같이 강조해줘요."],
      ["👆", "지문 속 영어 단어를 탭하면 뜻·발음·시험 포인트가 떠요."],
      ["✍️", "문제를 틀리면 자동으로 오답노트에 모이고, 단어 오답은 바로 다시 풀 수 있어요."],
      ["📱", "이름·반·PIN으로 로그인하면 폰·태블릿 어디서나 진도가 이어져요."]
    ];
    const usage = el("div", { class: "guide-usage hidden" },
      tips.map(([ic, t]) => el("div", { class: "usage-item" }, [
        el("span", { class: "ui-ic", text: ic }), el("span", { text: t })
      ])));
    root.appendChild(el("button", {
      class: "toggle-btn mt", text: "📱 앱 사용법 보기 ▼",
      onclick: (e) => { usage.classList.toggle("hidden"); e.target.textContent = usage.classList.contains("hidden") ? "📱 앱 사용법 보기 ▼" : "📱 앱 사용법 접기 ▲"; }
    }));
    root.appendChild(usage);

    // 코스 시작 CTA
    root.appendChild(el("button", {
      class: "primary-btn big mt", text: "▶ 코스로 차근차근 시작하기",
      onclick: () => { if (typeof Course !== "undefined") { (Course.steps && Course.steps.length) ? Course.render() : Course.start(); } }
    }));
    window.scrollTo(0, 0);
  }
};
