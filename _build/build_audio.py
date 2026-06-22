#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
vocab.json + reading.json 의 영어 표제어 발음을 macOS `say`로 생성.
audio/<slug>.m4a 와 audio/index.json(slug->파일명) 작성. 재실행 시 기존 파일은 건너뜀.
"""
import json, os, re, subprocess, sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA = os.path.join(BASE, "data")
ADIR = os.path.join(BASE, "audio")
os.makedirs(ADIR, exist_ok=True)
VOICE = "Samantha"

def slug(w):
    return re.sub(r"[^a-z0-9]+", "_", w.lower().strip()).strip("_")

words = set()
vocab = json.load(open(os.path.join(DATA, "vocab.json"), encoding="utf-8"))
for d in vocab["decks"]:
    for p in d["passages"]:
        for w in p["words"]:
            if w["en"].strip():
                words.add(w["en"].strip())
try:
    reading = json.load(open(os.path.join(DATA, "reading.json"), encoding="utf-8"))
    for s in reading["sets"]:
        for p in s["passages"]:
            for v in p.get("vocab", []):
                # "rare / scarce" 같은 슬래시 항목은 분리
                for part in re.split(r"\s*/\s*", v["en"]):
                    if part.strip():
                        words.add(part.strip())
except Exception:
    pass

words = sorted(words)
index = {}
made = skipped = 0
for i, w in enumerate(words, 1):
    s = slug(w)
    if not s:
        continue
    fn = s + ".m4a"
    fpath = os.path.join(ADIR, fn)
    index[s] = fn
    if os.path.exists(fpath) and os.path.getsize(fpath) > 0:
        skipped += 1
        continue
    try:
        subprocess.run(["say", "-v", VOICE, "-o", fpath, w],
                       check=True, timeout=30,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        made += 1
    except Exception as e:
        index.pop(s, None)
        print("  실패:", w, e, file=sys.stderr)
    if i % 100 == 0:
        print(f"  진행 {i}/{len(words)} (생성 {made}, 건너뜀 {skipped})")
        json.dump(index, open(os.path.join(ADIR, "index.json"), "w"), ensure_ascii=False)

json.dump(index, open(os.path.join(ADIR, "index.json"), "w"), ensure_ascii=False)
print(f"완료: 총 {len(index)}개 발음 (신규 {made}, 기존 {skipped}) → audio/index.json")
