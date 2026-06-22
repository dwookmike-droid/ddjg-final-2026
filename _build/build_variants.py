#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
노션 변형/엘리트 회차 → reading.json(레벨독해 L1~L4 세트) + bank.json(track=drill, id=var-*) 동시 생성.
변형 회차는 '지문 없는 영어 선지 종합문항'이라 reading 세트는 passages=[], 문항별 lead(인용)로 자기완결.
난도 매핑: 변형 1·2회=L1, 3회=L2, 4회=L3, 5회+엘리트=L4.

회차 데이터는 SETS 에 누적한다(노션에서 전사). 각 문항 = (유형, stem, lead, [선지5], 정답0base, 해설).
재실행 시 reading 의 L1~L4 세트와 bank 의 var-* 만 교체(L0·speed·cloze·qz·drl 보존).
"""
import json, os
from collections import Counter

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
READING = os.path.join(BASE, "data", "reading.json")
BANK = os.path.join(BASE, "data", "bank.json")

# 문항 유형 → drill group
GROUP = {"어휘": "어휘", "어법": "어법", "내용일치": "내용일치",
         "주제": "주제·요지", "지칭": "독해", "연결사": "연결사"}

SETS = [
  {
    "set_id": "L1-13-1", "level": "L1", "unit": "올림포스 13강 변형",
    "source": "올림포스 13강 변형 1회 (★ 기초)",
    "title": "13강 변형 1회 · 어휘·어법·주제 종합 (★ 기초)",
    "items": [
      ("어휘", "다음 밑줄 친 단어와 의미가 가장 가까운 것은?",
       "We might forget an anecdote about a stranger because it makes few connections with our existing associations.",
       ["antidote", "statistic", "short story", "rumor", "argument"], 2,
       "anecdote는 '일화·짧은 이야기' = short story. ① antidote(해독제)는 철자가 비슷한 함정, ④ rumor는 본문의 gossip과 연결되는 함정."),
      ("어휘", "다음 밑줄 친 단어와 의미가 가장 가까운 것은?",
       "Steve Jobs used analogy to get people to embrace the new technology.",
       ["reject", "accept", "ignore", "criticize", "delay"], 1,
       "embrace는 '(기꺼이) 받아들이다' = accept. 반의어 ① reject가 최대 함정."),
      ("어휘", "다음 영영 풀이(English definition)에 해당하는 단어는?",
       "the psychological tendency to want something more strongly when we are deprived of it or when our freedom to choose it is taken away",
       ["attraction", "instinct", "scarcity", "reactance", "phenomenon"], 3,
       "'선택지를 빼앗기면 더 원하게 되는 심리'의 정의 → reactance. ③ scarcity(희소성)는 원인이지 현상명이 아니다."),
      ("어휘", "다음 밑줄 친 단어의 반의어로 가장 적절한 것은?",
       "The most effective communicators find ways to make the abstract personal.",
       ["concrete", "complex", "symbolic", "logical", "objective"], 0,
       "abstract(추상적)의 반의어 = concrete(구체적). 본문에서 abstract ↔ personal/concrete 대립."),
      ("어휘", "다음 밑줄 친 단어의 반의어로 가장 적절한 것은?",
       "If the process is fair, we cannot nearly as easily externalize the outcome.",
       ["realize", "generalize", "rationalize", "visualize", "internalize"], 4,
       "externalize(외부화)의 반의어 = internalize(내면화). 나머지 -ize 단어는 의미가 무관한 함정."),
      ("어휘", "다음 밑줄 친 단어의 반의어로 가장 적절한 것은?",
       "The idea of working in a virtual world was radically different.",
       ["digital", "physical", "artificial", "imaginary", "similar"], 1,
       "virtual(가상의)의 반의어 = physical(물리적·실물의). ④ imaginary는 virtual의 유의어에 가까워 반의어가 아니다."),
      ("내용일치", "대중음악과 접근성에 관한 글의 내용과 일치하는 것은?", "",
       ["Punk musicians insisted that their music be highly virtuosic.",
        "Ordinary people had never sung or made music before the popular music movement.",
        "The popular music movement was driven by a spirit of obedience.",
        "In the 1950s, anyone could pick up everyday objects and a second-hand guitar and start a band.",
        "Groups that had been excluded from music avoided opportunities to create."], 3,
       "본문과 일치(누구나 일상 도구·중고 기타로 밴드 시작). ① 펑크는 비기교적을 조건으로 삼아 반대, ② 보통 사람들은 늘 노래해 왔으므로 반대, ③ 저항(rebellion)이라 obedience는 반대, ⑤ 만끽했으므로 avoided는 반대."),
      ("내용일치", "포스터 실험(리액턴스)의 내용과 일치하는 것은?", "",
       ["The poster with the highest rating became unavailable.",
        "Students were promised that they could keep all the posters.",
        "Students were asked to arrange ten posters in order of attractiveness.",
        "After the change, students judged only the remaining nine posters.",
        "The unavailable poster was rated the least beautiful."], 2,
       "본문과 일치(포스터 10장을 매력도 순으로 배열). ① 사라진 건 1위가 아니라 3위, ② 보상은 1장, ④ 10장 전부 from scratch 재평가, ⑤ 사라진 포스터는 가장 아름다운 것으로 분류."),
      ("내용일치", "매몰 비용 오류에 관한 글의 내용과 일치하지 않는 것은?", "",
       ["People find it very difficult to walk away from investments that have not repaid them.",
        "Giving up would mean acknowledging that we have wasted something we cannot get back.",
        "Staying with a genuinely bad bet simply increases the amount we lose.",
        "The writer advises us to keep investing until it finally proves worthwhile.",
        "Sometimes we just have to cut our losses."], 3,
       "본문은 '손실을 끊어내라'고 주장. ④ '가치 있다 판명될 때까지 계속 투자하라'는 정반대(매몰비용 오류) → 불일치. 나머지는 본문 진술."),
      ("어법", "(A), (B), (C)의 각 네모 안에서 어법에 맞는 표현끼리 가장 적절하게 짝지은 것은?",
       "So if a new piece of information (A)(has / will have) something to do with us, it (B)(will be processed / will process) more easily and (C)(thoroughly / thorough).",
       ["has — will be processed — thoroughly", "has — will process — thoroughly",
        "has — will be processed — thorough", "will have — will be processed — thorough",
        "will have — will process — thoroughly"], 0,
       "(A) 조건 if절은 미래라도 현재시제 → has. (B) 정보가 '처리되는' 수동 → will be processed. (C) 동사 수식 부사 → thoroughly."),
      ("어법", "다음 빈칸에 어법상 가장 적절한 것은?",
       "Steve Jobs used analogy to get people ＿＿＿＿ the new technology.",
       ["embrace", "embracing", "embraced", "to be embraced", "to embrace"], 4,
       "get은 준사역동사로 get + O + to V. make/have/let(원형)과 달리 to부정사 → to embrace. ① embrace(원형)는 함정."),
      ("어법", "다음 빈칸에 어법상 가장 적절한 것은?",
       "All translators feel some pressure from the community of readers ＿＿＿＿ they are doing their work.",
       ["for who", "for whom", "whom", "which", "what"], 1,
       "do their work for the readers의 for가 관계사 앞으로 이동, 뒤가 완전한 절 → 전치사+관계대명사 for whom. ① for who 불가, ③ whom 단독은 전치사 누락."),
      ("주제", "자아와 기억에 관한 글의 주제로 가장 적절한 것은?", "",
       ["why people quickly forget gossip about their relatives",
        "the importance of memorizing statistics accurately",
        "how effective communicators make abstract ideas personal to engage the self",
        "the difficulty of taking a vacation away from home",
        "practical ways to lower the dropout rate of law schools"], 2,
       "주제 = '효과적인 의사전달자는 추상을 개인화해 자아를 일깨운다'. 나머지는 세부 소재를 과장한 함정."),
      ("주제", "매몰 비용 오류에 관한 글의 요지로 가장 적절한 것은?", "",
       ["We should sometimes stop and accept our losses rather than chase a bad investment.",
        "Persistence in any investment always pays off in the end.",
        "Emotional relationships are always more valuable than financial ones.",
        "Admitting our mistakes is unnecessary as long as we keep trying.",
        "The longer we hold an investment, the more worthwhile it becomes."], 0,
       "요지 = '나쁜 투자를 쫓지 말고 손실을 인정·단절하라'. ②⑤는 반대, ③④는 과장·왜곡."),
      ("주제", "Steve Jobs의 유추에 관한 글의 제목으로 가장 적절한 것은?", "",
       ["The Failure of the Virtual Workplace", "Why Physical Offices Will Never Disappear",
        "A Short History of Paper and Pens", "Steve Jobs's Long Struggle Against Analogy",
        "Familiar Terms Open the Door to New Technology"], 4,
       "친숙한 용어(document·folder·desktop)로 신기술 수용을 이끔 → 'Familiar Terms Open the Door to New Technology'."),
      ("주제", "공정한 과정의 역설에 관한 글의 제목으로 가장 적절한 것은?", "",
       ["How Unfair Processes Destroy Society", "The Hidden Cost of a Fair Process",
        "Winning Fair and Square Brings Pure Joy", "Always Blame Yourself for Every Outcome",
        "Consolation Prizes for Everyone"], 1,
       "공정한 과정이 결과 외부화를 막아 수용을 어렵게 하는 역설 → 'The Hidden Cost of a Fair Process'. ③은 정반대."),
      ("지칭", "다음 밑줄 친 This가 가리키는 것으로 가장 적절한 것은?",
       "This led to specific genres such as skiffle, but also, more generally, reflected a much more relaxed and inclusive attitude to music making.",
       ["the global circulation of music by the creative industries",
        "the punk movement that emerged in the 1970s",
        "the spirit of rebellion and freedom",
        "the fact that, in the 1950s, anyone could use everyday objects to start a band",
        "a sense of novelty and empowerment"], 3,
       "This는 앞 문장(1950년대 누구나 일상 도구로 밴드 시작)을 가리킴. ② 펑크는 This의 결과(뒤 문장)라 함정."),
      ("지칭", "다음 밑줄 친 it이 가리키는 것으로 가장 적절한 것은?",
       "In the end, by delaying the pain of admitting our problem, we only add to it.",
       ["the pain", "our problem", "the investment", "the relationship", "a thousand dollars"], 0,
       "add to it의 it은 앞의 the pain. ② our problem은 지칭 함정 — 미루는 것은 '고통'이지 '문제'가 아니다."),
      ("연결사", "다음 빈칸에 들어갈 연결어로 가장 적절한 것은?",
       "We have been thinking about ourselves in our whole lives. ＿＿＿＿ if a new piece of information has something to do with us, it will be more easily and thoroughly processed.",
       ["However", "Nevertheless", "In contrast", "For example", "So"], 4,
       "앞(평생 자신을 생각)의 결과로 뒤(나와 관련된 정보는 더 잘 처리)가 이어짐 → 인과·결과의 So."),
      ("연결사", "다음 빈칸에 들어갈 연결어로 가장 적절한 것은?",
       "We may reassure ourselves by believing that our bad outcome had everything to do with the unfair process. If the process is fair, ＿＿＿＿, we cannot nearly as easily externalize the outcome.",
       ["therefore", "similarly", "however", "for instance", "moreover"], 2,
       "앞(불공정→외부 귀인으로 자기 안심)과 뒤(공정→외부화 불가)가 대조 → 역접 however."),
    ],
  },
]


def build():
    reading = json.load(open(READING, encoding="utf-8"))
    bank = json.load(open(BANK, encoding="utf-8"))

    new_sets, new_drill = [], []
    for s in SETS:
        tag = "-".join(s["set_id"].split("-")[1:])   # L1-13-1 → 13-1
        qs = []
        for n, (t, stem, lead, opts, ans, exp) in enumerate(s["items"], 1):
            assert 0 <= ans < len(opts), f"{s['set_id']} #{n} 정답 범위 오류"
            qs.append({"id": f"V{n}", "passage": 0, "type": t, "stem": stem,
                       "lead": lead, "options": opts, "answer": ans, "explain": exp})
            new_drill.append({"id": f"var-{tag}-{n}", "track": "drill", "group": GROUP[t],
                              "unit": s["unit"], "type": "mc", "source": s["source"],
                              "passage": lead, "stem": stem, "options": opts,
                              "answer": ans, "explain": exp})
        new_sets.append({"id": s["set_id"], "level": s["level"], "source": s["source"],
                         "title": s["title"], "passages": [], "questions": qs})

    # reading: L0 유지, L1~L4 변형 세트 교체
    reading["sets"] = [x for x in reading["sets"] if x["id"].split("-")[0] == "L0"] + new_sets
    # bank: var-* 교체
    bank["items"] = [i for i in bank["items"] if not str(i.get("id", "")).startswith("var-")] + new_drill

    json.dump(reading, open(READING, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump(bank, open(BANK, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    print("변형 세트:", [s["id"] for s in new_sets])
    print("레벨 분포:", dict(Counter(s["level"] for s in new_sets)))
    print("drill var 항목:", len(new_drill), "| 유형:", dict(Counter(d["group"] for d in new_drill)))
    print("reading sets 총:", len(reading["sets"]), "| bank items 총:", len(bank["items"]))


if __name__ == "__main__":
    build()
