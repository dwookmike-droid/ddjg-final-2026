/* ===========================================================
 *  admin.js — 선생님 대시보드 (?admin 으로 진입, 관리자 키로 잠금)
 *  학생 전체 성과: 응시 수·평균·코스 완료·마지막 활동·반별 통계
 * =========================================================== */
const Admin = {
  data: null, filter: "전체", sortKey: "last",

  start() {
    document.documentElement.classList.remove("dark"); // 대시보드는 라이트
    const k = sessionStorage.getItem("ddj_admin_key");
    if (k) { this._load(k); } else { this.renderLogin(); }
  },

  renderLogin(msg) {
    const app = $("#app"); app.innerHTML = "";
    const key = el("input", { class: "login-input", placeholder: "관리자 키", type: "password", autocomplete: "off" });
    const m = el("div", { class: "login-msg", text: msg || "" });
    const submit = () => { const v = key.value.trim(); if (!v) return; this._load(v); };
    const btn = el("button", { class: "primary-btn big", text: "대시보드 열기", onclick: submit });
    key.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
    app.appendChild(el("div", { class: "login-screen" }, [
      el("div", { class: "login-logo", text: "📊" }),
      el("h1", { class: "login-title", text: "선생님 대시보드" }),
      el("p", { class: "login-sub", text: (window.CONFIG && CONFIG.APP_TITLE) || "" }),
      el("div", { class: "login-card" }, [key, btn, m,
        el("p", { class: "login-hint", text: "관리자 키는 백엔드(Apps Script)의 ADMIN_KEY 속성과 같아야 해요." })])
    ]));
    key.focus();
  },

  async _load(key) {
    const app = $("#app"); app.innerHTML = "";
    app.appendChild(el("div", { class: "boot", text: "불러오는 중…" }));
    let r;
    try { r = await API.admin(key); } catch (e) { r = { ok: false }; }
    if (!r || !r.ok) {
      sessionStorage.removeItem("ddj_admin_key");
      return this.renderLogin(r && r.reason === "auth" ? "키가 일치하지 않아요." : "연결에 실패했어요. 다시 시도하세요.");
    }
    sessionStorage.setItem("ddj_admin_key", key);
    this.data = r;
    this.render();
  },

  _fmtDate(v) {
    if (!v) return "—";
    const d = new Date(v); if (isNaN(d)) return String(v).slice(0, 16).replace("T", " ");
    const p = n => ("0" + n).slice(-2);
    return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  },

  // 학생별 집계
  _agg() {
    const { students, results } = this.data;
    const bySid = {};
    results.forEach(r => { (bySid[r.sid] || (bySid[r.sid] = [])).push(r); });
    const courseSecs = new Set(results.filter(r => r.kind === "course").map(r => r.section));
    const courseTotal = Math.max(12, courseSecs.size);
    return students.map(s => {
      const rs = bySid[s.sid] || [];
      const n = rs.length;
      const avg = n ? Math.round(rs.reduce((a, r) => a + (+r.pct || 0), 0) / n) : 0;
      const lastTs = rs.length ? rs.map(r => +new Date(r.ts)).sort((a, b) => b - a)[0] : (s.last_login ? +new Date(s.last_login) : 0);
      const done = new Set(rs.filter(r => r.kind === "course").map(r => r.section)).size;
      // 약점: 평균 60 미만이거나 가장 낮은 점수 세트
      const low = rs.slice().sort((a, b) => (+a.pct || 0) - (+b.pct || 0))[0];
      return { name: s.name, klass: s["class"], n, avg, lastTs, done, courseTotal, low: low ? `${String(low.section).replace(/^코스 · /, "")} ${low.pct}점` : "—" };
    });
  },

  render() {
    const app = $("#app"); app.innerHTML = "";
    let rows = this._agg();
    const classes = ["전체", ...Array.from(new Set(rows.map(r => r.klass))).filter(Boolean)];
    if (this.filter !== "전체") rows = rows.filter(r => r.klass === this.filter);
    // 정렬
    const sorters = {
      last: (a, b) => b.lastTs - a.lastTs,
      avg: (a, b) => b.avg - a.avg,
      n: (a, b) => b.n - a.n,
      name: (a, b) => String(a.name).localeCompare(String(b.name), "ko")
    };
    rows.sort(sorters[this.sortKey] || sorters.last);

    // 헤더
    app.appendChild(el("div", { class: "adm-top" }, [
      el("div", { class: "adm-title", text: "📊 선생님 대시보드" }),
      el("div", { class: "adm-actions" }, [
        el("button", { class: "ghost-btn sm", text: "새로고침", onclick: () => this._load(sessionStorage.getItem("ddj_admin_key")) }),
        el("button", { class: "ghost-btn sm", text: "잠그기", onclick: () => { sessionStorage.removeItem("ddj_admin_key"); this.renderLogin(); } })
      ])
    ]));

    // 요약
    const totN = rows.reduce((a, r) => a + r.n, 0);
    const active = rows.filter(r => r.n > 0).length;
    const avgAll = rows.filter(r => r.n).length ? Math.round(rows.filter(r => r.n).reduce((a, r) => a + r.avg, 0) / rows.filter(r => r.n).length) : 0;
    app.appendChild(el("div", { class: "adm-stats" }, [
      ["학생", rows.length], ["응시한 학생", active], ["총 응시", totN], ["평균 점수", avgAll]
    ].map(([l, v]) => el("div", { class: "adm-stat" }, [
      el("div", { class: "adm-stat-v", text: String(v) }), el("div", { class: "adm-stat-l", text: l })
    ]))));

    // 반 필터 + 정렬
    app.appendChild(el("div", { class: "adm-controls" }, [
      el("div", { class: "chip-row" }, classes.map(c => el("button", {
        class: "pick" + (c === this.filter ? " on" : ""), text: c,
        onclick: () => { this.filter = c; this.render(); }
      }))),
      el("div", { class: "adm-sort" }, [
        el("span", { class: "muted", text: "정렬:" }),
        ...[["last", "최근활동"], ["avg", "평균"], ["n", "응시수"], ["name", "이름"]].map(([k, lb]) =>
          el("button", { class: "adm-sortbtn" + (this.sortKey === k ? " on" : ""), text: lb, onclick: () => { this.sortKey = k; this.render(); } }))
      ])
    ]));

    // 표
    const table = el("div", { class: "adm-table" });
    table.appendChild(el("div", { class: "adm-row adm-head" }, [
      el("span", { class: "adm-c-name", text: "이름" }),
      el("span", { class: "adm-c-cls", text: "반" }),
      el("span", { class: "adm-c-num", text: "응시" }),
      el("span", { class: "adm-c-num", text: "코스" }),
      el("span", { class: "adm-c-num", text: "평균" }),
      el("span", { class: "adm-c-last", text: "최근" })
    ]));
    if (!rows.length) table.appendChild(el("div", { class: "adm-empty", text: "학생 기록이 없어요." }));
    rows.forEach(r => {
      const cls = r.avg >= 80 ? "good" : (r.n && r.avg < 60 ? "warn" : "");
      table.appendChild(el("div", { class: "adm-row" }, [
        el("span", { class: "adm-c-name", text: r.name }),
        el("span", { class: "adm-c-cls", text: r.klass || "" }),
        el("span", { class: "adm-c-num", text: String(r.n) }),
        el("span", { class: "adm-c-num", text: `${r.done}/${r.courseTotal}` }),
        el("span", { class: "adm-c-num adm-pct " + cls, text: r.n ? r.avg + "점" : "—" }),
        el("span", { class: "adm-c-last", text: r.lastTs ? this._fmtDate(r.lastTs) : "—" })
      ]));
    });
    app.appendChild(table);
    app.appendChild(el("div", { class: "adm-foot muted", text: `기준 ${this._fmtDate(this.data.now)} · 코스 = 강·과별 단어/독해 12구간` }));
    window.scrollTo(0, 0);
  }
};
