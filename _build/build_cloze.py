#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
완벽분석본(문장별 영문 en-text + 해석 kr-text + 핵심어 hl-vocab)에서
'본문 빈칸 채우기' cloze 문항을 생성해 bank.json 의 track="cloze" 로 갱신.
- 각 문장에서 hl-vocab 중 적절한 한 단어를 빈칸 처리, 한글 해석을 힌트로.
- 지문당 최대 MAX_PER_PASSAGE 문항.
기존 bank.json 의 speed/drill 문항은 보존, cloze 만 교체.
"""
import re, json, html, os, glob, random

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ROOT = os.path.abspath(os.path.join(BASE, ".."))
BANK = os.path.join(BASE, "data", "bank.json")
MAX_PER_PASSAGE = 5
random.seed(7)

STOP = set("""the a an of to and or but in on at for with as by from into onto is are was were be been being
this that these those it its their his her our your my we you they he she them us him me
there here have has had do does did not no so than then when while which who whom whose what
one ones other others some any all each both more most much many few less least very too also
about over under above below between among through during before after again once will would can could
should may might must shup such only just even still also because if while where how why""".split())

def text(s):
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s).replace(" ", " ").strip()

def en_clean(h):
    h = re.sub(r'<span class="s-num">.*?</span>', "", h, flags=re.S)
    h = re.sub(r'<span class="s-role[^"]*">.*?</span>', "", h, flags=re.S)
    return re.sub(r"\s+", " ", text(h)).strip()

def ko_haeseok(h):
    t = re.sub(r"\s+", " ", text(h)).strip()
    m = re.search(r"\[해석\]\s*(.*)", t)
    if m:
        t = m.group(1)
    t = re.split(r"\s*(?:구문|구조|어휘|직독|cf\b|Note\b)", t)[0]
    return t.strip()

PAIR = re.compile(r'class="en-text"\s*>(.*?)</(?:p|div)>(.*?)class="kr-text"\s*>(.*?)</(?:p|div)>', re.S)
VOC = re.compile(r'class="hl-vocab"[^>]*>(.*?)</span>', re.S)

def make_items(en_html_full, ko_html, unit, pid, seq):
    en = en_clean(en_html_full)
    ko = ko_haeseok(ko_html)
    if not en or len(en.split()) < 5:
        return None
    vocabs = [text(v) for v in VOC.findall(en_html_full)]
    pick = None
    for v in vocabs:
        vl = v.lower()
        if re.fullmatch(r"[A-Za-z]{4,}", v) and vl not in STOP and re.search(r"\b" + re.escape(v) + r"\b", en):
            pick = v; break
    if not pick:
        return None
    blanked = re.sub(r"\b" + re.escape(pick) + r"\b", "____", en, count=1)
    return {
        "id": f"clz-{pid}-{seq}", "track": "cloze", "group": "본문 빈칸", "unit": unit,
        "type": "cloze", "lang": "en", "lead": ko, "stem": blanked,
        "accept": [pick], "explain": f"{pick} — {ko[:60]}"
    }

def parse_file(path, unit):
    raw = open(path, encoding="utf-8").read()
    body = raw.split("<body", 1)[-1]
    items, seq = [], 0
    pid = unit.replace(" ", "").replace("올림포스", "oly").replace("교과서", "txt").replace("강", "").replace("과", "")
    for m in PAIR.finditer(body):
        en_html = m.group(1)
        it = make_items(en_html, m.group(3), unit, pid, seq + 1)
        if it:
            seq += 1
            items.append(it)
        if seq >= MAX_PER_PASSAGE:
            break
    return items

sources = []
# 올림포스 per-지문 완벽분석본 (시험범위)
RANGE = {13: ["01", "02", "03", "05", "06", "07", "08"], 15: ["01", "02", "04", "05", "06"],
         17: ["01", "02", "04", "05", "06", "07", "08"], 19: ["01-02"]}
for n, nums in RANGE.items():
    for num in nums:
        cands = glob.glob(os.path.join(ROOT, f"올림포스/본문분석/Text_Decoder/올림포스_{n}강/완벽분석본/*{num}번_완벽분석본.html"))
        for p in cands:
            sources.append((p, f"올림포스 {n}강"))
# 교과서 본문분석 (있으면)
for u, fn in [("교과서 4과", "Unit04"), ("교과서 5과", "Unit05")]:
    for p in glob.glob(os.path.join(ROOT, f"교과서/본문분석/Text_Decoder/{fn}/{fn}_지문분석.html")):
        sources.append((p, u))

cloze = []
by_unit = {}
for path, unit in sources:
    its = parse_file(path, unit)
    cloze.extend(its)
    by_unit[unit] = by_unit.get(unit, 0) + len(its)

# id 유니크화
seen = {}
for it in cloze:
    if it["id"] in seen:
        seen[it["id"]] += 1
        it["id"] = f"{it['id']}_{seen[it['id']]}"
    else:
        seen[it["id"]] = 0

bank = json.load(open(BANK, encoding="utf-8"))
bank["items"] = [i for i in bank["items"] if i.get("track") != "cloze"] + cloze
json.dump(bank, open(BANK, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

print("생성 cloze:", len(cloze))
for u, c in by_unit.items():
    print(f"  {u}: {c}")
print("bank.json 총 items:", len(bank["items"]))
print("샘플:", json.dumps(cloze[0], ensure_ascii=False) if cloze else "없음")
