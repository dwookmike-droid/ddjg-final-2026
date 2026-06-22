#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
기존 인쇄용 HTML(단어암기지 + 동의어반의어 통합본)을 파싱해
웹앱용 data/vocab.json, data/synant.json 을 생성한다.
일회용이 아니라 재실행 가능(소스 변경 시 다시 돌림).
"""
import re, json, html, os, glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "단어암기지_배포")
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
os.makedirs(OUT, exist_ok=True)

def unescape(s):
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s).strip()

# ---- 단어암기지 → decks ----
# 파일: 올림포스_{13,15,17,19}강_단어암기지.html, 교과서_{4,5}과_단어암기지.html
DECK_FILES = []
for n in (13, 15, 17, 19):
    DECK_FILES.append((f"oly{n}", "olympus", f"올림포스 {n}강",
                       os.path.join(SRC, f"올림포스_{n}강_단어암기지.html")))
for n in (4, 5):
    DECK_FILES.append((f"txt{n}", "textbook", f"교과서 {n}과",
                       os.path.join(SRC, f"교과서_{n}과_단어암기지.html")))

W_RE = re.compile(
    r'<div class="w[^"]*">(.*?)</div>', re.S)
EN_RE = re.compile(r'<span class="en">(.*?)</span>', re.S)
MN_RE = re.compile(r'<span class="mn">(.*?)</span>', re.S)
BG_RE = re.compile(r'<span class="bg (school|anal)">')
PTAG_RE = re.compile(r'<div class="ptag">(.*?)</div>', re.S)

def parse_deck(path):
    """본문을 순서대로 훑으며 ptag(그룹)과 w(단어)를 모은다."""
    raw = open(path, encoding="utf-8").read()
    body = raw.split("<body>", 1)[-1]
    # ptag/word 토큰을 등장 순서대로 추출
    token_re = re.compile(
        r'<div class="ptag">(?P<ptag>.*?)</div>'
        r'|<div class="w[^"]*">(?P<w>.*?)</div>', re.S)
    passages = []
    cur = None
    for m in token_re.finditer(body):
        if m.group("ptag") is not None:
            tag = unescape(m.group("ptag"))
            tag = re.sub(r"\s*\(동반의어.*?\)\s*$", "", tag).strip()
            cur = {"tag": tag, "words": []}
            passages.append(cur)
        else:
            chunk = m.group("w")
            en = EN_RE.search(chunk)
            mn = MN_RE.search(chunk)
            if not en:
                continue
            bg = BG_RE.search(chunk)
            word = {
                "en": unescape(en.group(1)),
                "ko": unescape(mn.group(1)) if mn else "",
                "src": bg.group(1) if bg else "",
            }
            if cur is None:
                cur = {"tag": "", "words": []}
                passages.append(cur)
            cur["words"].append(word)
    return passages

decks = []
seen_en = set()
for did, subject, label, path in DECK_FILES:
    if not os.path.exists(path):
        print("  (없음, 건너뜀)", path)
        continue
    passages = parse_deck(path)
    n = sum(len(p["words"]) for p in passages)
    for p in passages:
        for w in p["words"]:
            seen_en.add(w["en"].lower())
    decks.append({"id": did, "subject": subject, "label": label,
                  "passages": passages, "count": n})
    print(f"  {label}: {len(passages)}그룹 {n}단어")

vocab = {"decks": decks,
         "total": sum(d["count"] for d in decks)}
json.dump(vocab, open(os.path.join(OUT, "vocab.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
print(f"vocab.json: {len(decks)}덱 {vocab['total']}단어 (고유 {len(seen_en)})")

# ---- 동의어반의어 통합본 → synant ----
SYN_PATH = os.path.join(SRC, "교과서올림포스_동의어반의어_통합본.html")
synant = {}
if os.path.exists(SYN_PATH):
    raw = open(SYN_PATH, encoding="utf-8").read()
    body = raw.split("<body>", 1)[-1]
    w_re = re.compile(r'<div class="w">(.*?)</div>', re.S)
    en_re = re.compile(r'<span class="en">(.*?)</span>', re.S)
    mn_re = re.compile(r'<span class="mn">(.*?)</span>', re.S)
    sa_re = re.compile(r'<span class="sa">(.*?)</span>\s*$', re.S)
    eq_block = re.compile(r"<span class='eq'>=</span>\s*<span class='terms'>(.*?)</span>", re.S)
    ar_block = re.compile(r"<span class='ar'>↔</span>\s*<span class='terms'>(.*?)</span>", re.S)
    for m in w_re.finditer(body):
        chunk = m.group(1)
        en = en_re.search(chunk)
        if not en:
            continue
        key = unescape(en.group(1)).lower()
        syn = [t.strip() for blk in eq_block.findall(chunk)
               for t in unescape(blk).split(",") if t.strip()]
        ant = [t.strip() for blk in ar_block.findall(chunk)
               for t in unescape(blk).split(",") if t.strip()]
        if not syn and not ant:
            continue
        e = synant.setdefault(key, {"syn": [], "ant": []})
        for s in syn:
            if s not in e["syn"]:
                e["syn"].append(s)
        for a in ant:
            if a not in e["ant"]:
                e["ant"].append(a)

json.dump(synant, open(os.path.join(OUT, "synant.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
print(f"synant.json: {len(synant)}개 표제어")

# 단어암기지 단어 중 동반의어 데이터가 있는 비율
have = sum(1 for e in seen_en if e in synant)
print(f"단어장 단어 중 동반의어 보유: {have}/{len(seen_en)}")
