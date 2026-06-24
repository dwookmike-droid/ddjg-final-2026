#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
단어별 '이번 시험 포인트' 노트 생성 → data/wordpoints.json
소스: 변형 어휘 문항(bank var-* group=어휘)의 해설. synant 교차검증으로 헤드워드가
'확실할 때만' 채택(정확성 우선, 불확실은 건너뜀). openWordSheet가 표시.

  - 동의어/반의어형: 정답이 어떤 synant 단어 W의 syn/ant에 속하고 W가 문항 문장에 등장 → W가 헤드워드
  - 영영정의형: stem에 '영영/정의', 정답이 단일 영단어 → 그 단어가 헤드워드
출력: {word(소문자): {"notes": [해설…]}}
"""
import json, os, re

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BANK = os.path.join(BASE, "data", "bank.json")
SYN = os.path.join(BASE, "data", "synant.json")
OUT = os.path.join(BASE, "data", "wordpoints.json")

bank = json.load(open(BANK, encoding="utf-8"))
items = bank["items"]
syn = json.load(open(SYN, encoding="utf-8"))

def words_in(text):
    return set(w.lower() for w in re.findall(r"[A-Za-z][A-Za-z'\-]+", text or ""))

# synact 역색인: 정답표현(소문자) → 그 표현을 syn/ant로 갖는 헤드워드들
rev = {}
for head, d in syn.items():
    for w in (d.get("syn") or []) + (d.get("ant") or []):
        rev.setdefault(w.strip().lower(), set()).add(head.lower())

out = {}
added = 0
for it in items:
    if not str(it.get("id", "")).startswith("var-") or it.get("group") != "어휘":
        continue
    opts = it.get("options") or []
    ans = it.get("answer")
    if not isinstance(ans, int) or not (0 <= ans < len(opts)):
        continue
    answer = str(opts[ans]).strip().lower()
    sent = it.get("passage") or it.get("lead") or ""
    stem = it.get("stem") or ""
    explain = (it.get("explain") or "").strip()
    if not explain:
        continue
    head = None
    # 동의어/반의어형: 정답을 syn/ant로 갖는 헤드워드가 문장에 등장
    cands = rev.get(answer)
    if cands:
        inSent = words_in(sent)
        hit = [c for c in cands if c in inSent]
        if len(hit) == 1:
            head = hit[0]
    # 영영정의형: 정답이 단일 영단어
    if not head and ("영영" in stem or "정의" in stem) and re.fullmatch(r"[A-Za-z][A-Za-z'\-]+", answer):
        head = answer
    if not head:
        continue
    rec = out.setdefault(head, {"notes": []})
    if explain not in rec["notes"]:
        rec["notes"].append(explain)
        added += 1

# 노트 최대 3개로 제한
for w in out:
    out[w]["notes"] = out[w]["notes"][:3]

json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"wordpoints: {len(out)}개 단어 · 노트 {added}건 → data/wordpoints.json")
print("예시:", list(out.keys())[:12])
