#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
data/bank.json 무결성 점검 — 배포 전·재빌드 후 회귀 검사용.
build_drills.py 와 '독립된' 기준으로 교차검증한다(같은 로직이면 항상 통과해 무의미).

검사 항목
  [A] 공통 결손   : id 중복, type 누락, stem 빈값
  [B] 객관식(mc/ox): options 2개 이상, answer 정수·범위, 옵션 빈값
  [C] 단답(cloze) : accept 리스트 존재·비어있지 않음
  [D] 드릴 정답   : explain 의 ①~⑤ 정답표기 ↔ answer 인덱스 일치
  [E] 드릴 분류   : 발문의 '명시적' 키워드 ↔ group 일치(모호하면 건너뜀)

불일치가 있으면 목록을 찍고 exit code 1. 기준선(2026-06-22): 전부 통과.
"""
import json, re, os, sys
from collections import Counter

BANK = os.path.join(os.path.dirname(__file__), "..", "data", "bank.json")
CIRC = "①②③④⑤⑥⑦⑧⑨⑩"


def ans_in_explain(ex):
    """explain 의 '정답 X' 표기에서만 정답 번호를 0-based 로 추출. 없으면 None.
    (해설 본문에 함정 선지를 ①②로 언급하는 변형 회차를 정답으로 오인하지 않도록 '정답' 키워드 한정)"""
    if not ex:
        return None
    m = re.search(r"정답\s*([①②③④⑤⑥⑦⑧⑨⑩1-9])", ex)
    if not m:
        return None
    ch = m.group(1)
    return CIRC.index(ch) if ch in CIRC else int(ch) - 1


def expect_group(stem):
    """발문에 '확실한' 유형 신호가 있을 때만 기대 group 반환. 모호하면 None(검사 제외)."""
    s = stem or ""
    if "어법" in s or "어색한" in s:
        return "어법"
    if "일치" in s:
        return "내용일치"
    if "순서" in s or "배열" in s:
        return "순서·삽입"
    if "낱말" in s or "쓰임" in s:
        return "어휘"
    if "제목" in s or "요지" in s or "주장" in s or "목적" in s or "요약" in s:
        return "주제·요지"
    # '빈칸/들어갈 말'은 빈칸추론·연결사로 갈려 모호 → 검사 제외
    return None


def main():
    bank = json.load(open(BANK, encoding="utf-8"))
    items = bank.get("items", [])
    errs, warns = [], []

    seen = set()
    for it in items:
        iid = it.get("id", "?")
        typ = it.get("type")

        # [A] 공통
        if iid in seen:
            errs.append(f"[A] id 중복: {iid}")
        seen.add(iid)
        if not typ:
            errs.append(f"[A] type 누락: {iid}")
        if typ in ("mc", "ox") and not (it.get("stem") or "").strip():
            errs.append(f"[A] stem 빈값: {iid}")

        # [B] 객관식 — mc 는 options 필요, ox 는 O/X 버튼을 렌더러가 생성하므로 answer 0/1 만 검사
        if typ == "mc":
            opts = it.get("options") or []
            ans = it.get("answer")
            if len(opts) < 2:
                errs.append(f"[B] 옵션 부족({len(opts)}): {iid}")
            if not isinstance(ans, int):
                errs.append(f"[B] answer 비정수({ans!r}): {iid}")
            elif not (0 <= ans < len(opts)):
                errs.append(f"[B] answer 범위 이탈({ans}/{len(opts)}): {iid}")
            if any(not str(o).strip() for o in opts):
                errs.append(f"[B] 빈 옵션 포함: {iid}")
        elif typ == "ox":
            if it.get("answer") not in (0, 1):
                errs.append(f"[B] ox answer 0/1 아님({it.get('answer')!r}): {iid}")

        # [C] 단답
        if typ == "cloze":
            acc = it.get("accept")
            if not isinstance(acc, list) or not acc or any(not str(a).strip() for a in acc):
                errs.append(f"[C] accept 결손: {iid}")

        # 드릴 한정 [D][E]
        if it.get("track") == "drill" and typ == "mc":
            exp = ans_in_explain(it.get("explain"))
            ans = it.get("answer")
            if exp is not None and isinstance(ans, int) and exp != ans:
                errs.append(f"[D] explain({CIRC[exp]})≠answer({ans}): {iid}")
            eg = expect_group(it.get("stem"))
            if eg and it.get("group") != eg:
                warns.append(f"[E] 분류 의심 group='{it.get('group')}' 기대='{eg}' : {iid} / {(it.get('stem') or '')[:34]}")

    print(f"bank.json items: {len(items)}  | track: {dict(Counter(i.get('track') for i in items))}")
    print(f"오류 {len(errs)} · 경고(분류의심) {len(warns)}")
    for e in errs:
        print("  ✗", e)
    for w in warns:
        print("  ⚠", w)
    if errs:
        print("\n실패: 오류를 수정하세요.")
        sys.exit(1)
    print("\n통과: 무결성 이상 없음." + (f" (분류 의심 {len(warns)}건은 육안 확인 권장)" if warns else ""))


if __name__ == "__main__":
    main()
