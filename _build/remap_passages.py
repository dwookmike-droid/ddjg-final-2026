#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
reading.json 의 question.passage(0-기반 지문 인덱스)를 내용 매칭으로 재도출.

배경: 변형 빌더가 자기완결형 문항(어휘/어법/삽입/순서 등)을 실제 출처와 무관하게
대부분 index 0 으로 박아둠 → 저장 인덱스 정확도 57%. 그러나 각 문항 lead/stem 에
실제 지문에서 가져온 영어 인용(또는 한글 주제어)이 들어있어 자동 복원 가능.

동작:
  - 영어 인용이 충분하면: 지문별 영어 토큰과의 idf 가중 중첩으로 최적 지문 선택.
  - 부족하면: stem 의 한글 주제어를 지문 title 과 매칭.
  - confidence(1등-2등 마진) 로 신뢰도 표기.
DRY-RUN(기본): 교정 가이드만 출력. --apply 주면 reading.json 에 passage 갱신 + selfContained 플래그.
"""
import json, os, re, sys, math, collections

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RJSON = os.path.join(BASE, "data", "reading.json")
SELF_TYPES = {"어휘", "어법", "빈칸", "삽입", "순서", "연결사"}  # lead 인용 자기완결형 추정

STOP = set("the a an of to and or in on at for with as is are was were be been being it its this that these those by from into about than then so but not no can will may we you they he she i his her our their them us".split())

def en_tokens(t):
    return [w for w in re.findall(r"[a-z]+", (t or "").lower()) if len(w) > 2 and w not in STOP]

def longest_en(*flds):
    best = ""
    for f in flds:
        for m in re.findall(r"[A-Za-z][A-Za-z ,;:'\-]{20,}", f or ""):
            if len(m) > len(best):
                best = m
    return best.strip()

def ko_tokens(t):
    return re.findall(r"[가-힣]{2,}", t or "")

def all_en_seq(text):
    # 지문 전체를 소문자 단어열로(부분문자열 매칭용)
    return re.findall(r"[a-z]+", (text or "").lower())

def longest_run(qseq, pseq):
    # qseq 의 연속 부분열이 pseq 안에 통째로 등장하는 최장 길이(동적계획 LCSubstring)
    if not qseq or not pseq:
        return 0
    ppos = collections.defaultdict(list)
    for i, w in enumerate(pseq):
        ppos[w].append(i)
    best = 0
    prev = {}
    for w in qseq:
        cur = {}
        for i in ppos.get(w, ()):
            run = prev.get(i - 1, 0) + 1
            cur[i] = run
            if run > best:
                best = run
        prev = cur
    return best

def remap_set(s):
    ps = s["passages"]
    if not ps:
        return []
    # 지문별 영어 토큰 + idf + 전체 단어열
    ptok = [collections.Counter(en_tokens(p.get("en", ""))) for p in ps]
    pseq = [all_en_seq(p.get("en", "")) for p in ps]
    df = collections.Counter()
    for c in ptok:
        for w in c:
            df[w] += 1
    N = len(ps)
    idf = {w: math.log((N + 1) / (df[w])) for w in df}
    titles = [p.get("title", "") for p in ps]

    out = []
    for qi, q in enumerate(s["questions"], 1):
        eng = longest_en(q.get("lead"), q.get("stem"))
        scores = [0.0] * N
        method = "-"
        if len(eng) >= 20:
            qt = en_tokens(eng)
            qseq = all_en_seq(eng)
            for j, c in enumerate(ptok):
                overlap = sum(idf.get(w, 0) for w in qt if c.get(w))
                run = longest_run(qseq, pseq[j])
                # 연속 일치 5단어↑면 사실상 확정 → 강한 가중
                scores[j] = overlap + (run ** 2) * 3.0
            method = "en"
        # 한글 주제어 -> title 매칭(영어 약하거나 보강)
        kt = [w for w in ko_tokens(q.get("stem", "")) if w not in ("으로", "가장", "적절한", "알맞은", "다음", "들어갈")]
        if (method != "en" or max(scores) == 0) and kt:
            for j, ti in enumerate(titles):
                hit = sum(1 for w in kt if len(w) >= 2 and w in ti)
                scores[j] += hit * 5.0
            method = "ko" if method != "en" else "en+ko"
        order = sorted(range(N), key=lambda j: scores[j], reverse=True)
        best = order[0]
        s1 = scores[best]
        s2 = scores[order[1]] if N > 1 else 0
        conf = 0.0 if s1 == 0 else (s1 - s2) / s1
        cur = q.get("passage")
        out.append({
            "qi": qi, "type": q.get("type", ""), "cur": cur,
            "new": best if s1 > 0 else cur, "conf": conf, "score": round(s1, 2),
            "method": method, "self": q.get("type") in SELF_TYPES,
            "no": ps[best].get("no") if s1 > 0 else (ps[cur].get("no") if isinstance(cur, int) and 0 <= cur < N else None),
            "title": titles[best] if s1 > 0 else "",
        })
    return out

# 전체지문형 28건 수동 판정(내용 확인 후). 값: 원문 no / "CROSS"(두 글 비교) / "SELF"(세트밖 인용 자체포함)
OVERRIDES = {
    ("L1-13-1", 15): 2,
    ("L1-13-2", 13): 5, ("L1-13-2", 14): 2,
    ("L2-13-3", 17): 7, ("L2-13-3", 20): 2,
    ("L3-13-4", 17): "CROSS",
    ("L4-13-5", 14): "CROSS", ("L4-13-5", 15): "CROSS", ("L4-13-5", 16): "CROSS",
    ("L4-13-5", 17): "CROSS", ("L4-13-5", 20): 5,
    ("L1-15-1", 9): 5, ("L1-15-1", 16): 5,
    ("L1-15-2", 17): 5, ("L1-15-2", 18): 6,
    ("L4-15-5", 12): "CROSS", ("L4-15-5", 15): 6, ("L4-15-5", 20): 1,
    ("L2-17-3", 8): 1, ("L2-17-3", 16): 7,
    ("L4-17-5", 15): 1, ("L4-17-5", 16): 1, ("L4-17-5", 20): "CROSS",
    ("L1-19-1", 9): 1, ("L1-19-1", 10): 1,
    ("L4-E10", 11): "SELF", ("L4-E10", 15): 3, ("L4-E10", 20): "CROSS",
}

def main():
    apply = "--apply" in sys.argv
    d = json.load(open(RJSON, encoding="utf-8"))
    changed = low = 0
    for s in d["sets"]:
        if s["id"].startswith("L0"):
            # L0는 이미 정확(passage=원문 no, 1-기반) → 0-기반 인덱스로만 변환
            no2idx = {p.get("no"): j for j, p in enumerate(s["passages"])}
            if apply:
                for q in s["questions"]:
                    old = q.get("passage")
                    q["passage"] = no2idx.get(old, max(0, (old or 1) - 1))
                    q["selfContained"] = False
                    q["cross"] = False
            continue
        res = remap_set(s)
        ps = s["passages"]
        no2idx = {p.get("no"): j for j, p in enumerate(ps)}
        # 수동 오버라이드 반영
        for r in res:
            ov = OVERRIDES.get((s["id"], r["qi"]))
            r["cross"] = False
            if ov == "CROSS":
                r["cross"] = True
            elif ov == "SELF":
                r["self"] = True
            elif isinstance(ov, int) and ov in no2idx:
                r["new"] = no2idx[ov]
                r["conf"] = 1.0
        print(f"\n===== {s['id']}  ({s['source']}) =====")
        bypass = collections.defaultdict(list)
        cross = []
        flags = []
        for r in res:
            if r.get("cross"):
                cross.append(r["qi"])
            else:
                bypass[r["new"]].append(r["qi"])
            if r["cur"] != r["new"]:
                changed += 1
            if not r.get("cross") and (r["conf"] < 0.15 or r["score"] == 0):
                low += 1
                flags.append(f"Q{r['qi']}({r['type']})")
        for j, p in enumerate(ps):
            qs = bypass.get(j, [])
            tag = " ".join(f"Q{n}" for n in sorted(qs)) or "(없음)"
            print(f"   [지문 no={p.get('no')}] {p.get('title','')[:24]:24} <- {tag}")
        if cross:
            print("   🔀 크로스/통합(지문 비교·자료):", " ".join(f"Q{n}" for n in sorted(cross)))
        if flags:
            print("   ⚠ 저신뢰(수동확인 권장):", ", ".join(flags))
        if apply:
            for r in res:
                q = s["questions"][r["qi"] - 1]
                q["passage"] = r["new"]
                q["selfContained"] = bool(r["self"])
                q["cross"] = bool(r.get("cross"))
    print(f"\n요약: 인덱스 변경 {changed}건 · 저신뢰 {low}건")
    if apply:
        json.dump(d, open(RJSON, "w", encoding="utf-8"), ensure_ascii=False)
        print("reading.json 갱신 완료(passage 교정 + selfContained).")
    else:
        print("DRY-RUN. 적용하려면 --apply")

if __name__ == "__main__":
    main()
