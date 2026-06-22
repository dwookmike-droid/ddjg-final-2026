#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
올림포스_{N}강_문제집_정답지포함.html (학교/학평 기출 통합, 강당 ~190문항)에서
5지선다 문항만 안전하게 추출 → bank.json 의 track="drill" 로 갱신(unit=강, group=유형).
- 본문 끝의 ①~⑤ 옵션 내장 / 정답은 anskey 섹션의 번호별 표기.
- 옵션이 짧고 ①~⑤가 끝에 순서대로 올 때만 채택(서술형·복합형·밑줄형 일부 제외).
기존 speed/cloze/수동 드릴 시드(drl-*)는 보존, 파싱 드릴(qz-*)만 교체.
"""
import re, json, html, os, glob

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ROOT = os.path.abspath(os.path.join(BASE, ".."))
BANK = os.path.join(BASE, "data", "bank.json")
CIRC = "①②③④⑤"

def clean(s):
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()

def group_of(stem):
    s = stem
    if "빈칸" in s: return "빈칸추론"
    if "순서" in s or "배열" in s: return "순서·삽입"
    if "위치" in s or "들어가기" in s or ("문장" in s and "들어갈" in s): return "순서·삽입"
    if "어법" in s or "어색" in s: return "어법"
    if "낱말" in s or "어휘" in s or "문맥" in s or "쓰임" in s: return "어휘"
    if "일치" in s: return "내용일치"
    if "주제" in s or "요지" in s or "제목" in s or "주장" in s or "목적" in s or "요약" in s: return "주제·요지"
    if "함축" in s or "의미하는" in s: return "어휘"
    return "독해"

def stem_for(group):
    return {"빈칸추론": "빈칸에 들어갈 말로 가장 적절한 것은?", "순서·삽입": "이어질 순서로 가장 적절한 것은?",
            "어법": "밑줄 친 부분 중 어법상 틀린 것은?", "어휘": "문맥상 낱말의 쓰임이 적절하지 않은 것은?",
            "내용일치": "윗글의 내용과 일치하지 않는 것은?", "주제·요지": "윗글의 주제로 가장 적절한 것은?",
            "독해": "윗글에 대한 설명으로 가장 적절한 것은?"}.get(group, "다음 물음에 답하시오.")

def extract_opts(bt):
    """끝에서부터 ①..⑤ 순서 블록을 찾아 (앞부분, [5개옵션]) 반환. 옵션이 길면(지문 조각) 실패."""
    for m in reversed(list(re.finditer("①", bt))):
        i = m.start()
        mm = re.match(r"①(.+?)②(.+?)③(.+?)④(.+?)⑤(.+)$", bt[i:], re.S)
        if mm:
            opts = [g.strip(" .·-—:") for g in mm.groups()]
            if all(0 < len(o) <= 80 for o in opts):
                return bt[:i].strip(), opts
    return None, None

RANGE_FILES = {13: "올림포스_13강_배포/올림포스_13강_문제집_정답지포함.html",
               15: "올림포스_15강_배포/올림포스_15강_문제집_정답지포함.html",
               17: "올림포스_17강_배포/올림포스_17강_문제집_정답지포함.html",
               19: "올림포스_19강_배포/올림포스_19강_문제집_정답지포함.html"}

drills = []
by_unit = {}
for n, rel in RANGE_FILES.items():
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        print("(없음)", rel); continue
    raw = open(path, encoding="utf-8").read()
    page, _, anskey = raw.partition('<section class="anskey">')
    # 정답 맵: 번호 → 인덱스
    amap = {}
    for m in re.finditer(r'<b>(\d+)\.</b>\s*([①②③④⑤])', anskey):
        amap[int(m.group(1))] = CIRC.index(m.group(2))
    # 문항
    blocks = [b for b in re.split(r'(?=<div class="q">)', page) if b.strip().startswith('<div class="q">')]
    kept = 0
    for b in blocks:
        lab = re.search(r'class="label">(\d+)\s*번', b)
        src = re.search(r'class="src">(.*?)</span>', b, re.S)
        bod = re.search(r'<div class="body">(.*?)</div>', b, re.S)
        if not (lab and bod):
            continue
        num = int(lab.group(1))
        if num not in amap:
            continue
        bt = clean(bod.group(1))
        pre, opts = extract_opts(bt)
        if not opts or amap[num] >= len(opts):
            continue
        q = re.match(r"(.*?[?？])\s*(.*)$", pre, re.S)
        if q and len(q.group(1)) <= 60:
            stem, passage = q.group(1).strip(), q.group(2).strip()
        else:
            stem, passage = "", pre.strip()
        # 요약형(A·B 2칸)·복합형은 평면 옵션 분리가 깨지므로 제외
        if "요약" in stem or ("(A)" in stem and "(B)" in stem):
            continue
        # 옵션이 공백 없는 긴 덩어리면(두 단어 뭉침) 제외
        if any(" " not in o and len(o) >= 11 and o.isalpha() for o in opts):
            continue
        grp = group_of(stem or "")
        if not stem:
            stem = stem_for(grp)
        if len(passage) < 30:
            continue
        unit = f"올림포스 {n}강"
        drills.append({
            "id": f"qz-{n}-{num}", "track": "drill", "group": grp, "unit": unit, "type": "mc",
            "source": clean(src.group(1)) if src else "", "passage": passage,
            "stem": stem, "options": opts, "answer": amap[num],
            "explain": f"정답 {CIRC[amap[num]]}" + (f" · 출처: {clean(src.group(1))}" if src else "")
        })
        kept += 1
        by_unit[unit] = by_unit.get(unit, 0) + 1
    print(f"올림포스 {n}강: {kept}/{len(blocks)} 채택")

bank = json.load(open(BANK, encoding="utf-8"))
bank["items"] = [i for i in bank["items"] if not str(i.get("id", "")).startswith("qz-")] + drills
json.dump(bank, open(BANK, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

from collections import Counter
print("총 파싱 드릴:", len(drills))
print("유형 분포:", dict(Counter(d["group"] for d in drills)))
print("bank.json 총 items:", len(bank["items"]))
