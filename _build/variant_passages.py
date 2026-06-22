# -*- coding: utf-8 -*-
"""
변형 회차가 참조하는 '올림포스 N강 시험범위 원문' 지문 (영어+한글).
출처: 노션 "올림포스 N강 시험범위 원문" 페이지. build_variants.py가 import해서
 - reading 변형 세트의 passages를 채우고(강 전체 지문)
 - bank 지문필수 var-* 문항에 해당 지문(passage)을 부착한다.

키: 강("13","15","17","19","E"=엘리트) → 지문번호(int) → {title, source, en, ko}
"""

PASSAGES = {
  "13": {
    1: {
      "title": "자아와 기억",
      "source": "2025년 6월 고2 학평 31번",
      "en": "We might forget an anecdote about a stranger because it makes few connections with our existing associations, but we won't forget a piece of gossip about our cousin. There's one complex network that is larger and quicker to access than all others ─ the self. We've been thinking about ourselves in our whole lives. So if a new piece of information has something to do with us, it will be more easily and thoroughly processed. It hits even closer to home than our actual home ─ we can take a vacation away from our home, but not from ourselves. The most effective communicators find ways to make the abstract personal. Consider the warning that law schools give to motivate first-year law students concerning the rigors of their program. Hearing that \"the first-year dropout rate is 33%\" is an abstract statistic. \"Look to your left, look to your right. One of the three of you won't be joining us next fall\" wakes up the self.",
      "ko": "우리는 우리의 기존 연상들과 연관성이 거의 없기 때문에 낯선 사람에 관한 일화는 잊어버릴지 모르지만, 우리의 사촌에 관한 소문은 한 부분도 잊지 않을 것이다. 다른 모든 것보다 더 크고 접근하기에 더 빠른 하나의 복잡한 네트워크, 바로 자아이다. 우리는 평생 우리 자신에 대해 생각해 왔다. 그래서 어떤 새로운 정보가 '우리'와 관련이 있다면, 그것은 더 쉽게 그리고 더 철저하게 처리될 것이다. 그것은 우리의 실제 집보다 훨씬 더 가깝게 와닿는다. 우리는 집으로부터 떠나 휴가를 갈 수 있지만, '우리 자신'으로부터는 아니다. 가장 효과적인 의사소통자들은 추상적인 것을 개인적인 것으로 만드는 방법을 찾는다. 로스쿨이 그들의 프로그램의 엄격함에 대해 1학년 로스쿨 학생들에게 동기를 부여하기 위해 주는 경고를 생각해 보라. \"첫해 중도 탈락률은 33%입니다\"라고 듣는 것은 추상적인 통계이다. \"여러분의 왼쪽을 보세요, 여러분의 오른쪽을 보세요. 여러분 세 명 중 한 명은 내년 가을에 우리와 함께하지 않을 것입니다\"는 자아를 일깨운다.",
    },
    2: {
      "title": "Steve Jobs의 유추",
      "source": "2025년 6월 고2 학평 32번",
      "en": "Steve Jobs used analogy to get people to embrace the new technology. Before computers, people worked in a physical world. We used paper and pens and physical file folders and so on. The idea of working in a virtual world was radically different. Or at least seemed radically different. What Jobs understood was that a physical office was fundamentally similar to a virtual office. To win over the masses, Jobs drew strong analogies between the traditional workplace people knew well with the new, unfamiliar virtual workplace. In the pre-computer workplace, when ideas were written on paper it was called ... a document. When those documents needed to be stored they were put in ... a folder. And those folders were kept on ... a desk. Documents, folders, and desktops are the terms we use in our virtual work because Steve Jobs understood that using familiar terms would make the new technology easier to understand. The parallels between the physical and virtual workplace now seem obvious.",
      "ko": "Steve Jobs는 사람들이 새로운 기술을 받아들이도록 하기 위해 유사성을 사용했다. 컴퓨터 이전에, 사람들은 물리적인 세계에서 일을 했다. 우리는 종이와 펜과 물리적인 파일 폴더 등을 사용했다. 가상 세계에서 일한다는 개념은 혁신적으로 달랐다. 혹은 적어도 근본적으로 다르게 '보였다'. Jobs가 이해한 것은 물리적인 사무실이 근본적으로 가상 사무실과 유사하다는 것이었다. 대중을 사로잡기 위해, Jobs는 사람들이 잘 알고 있는 전통적인 일터와 새롭고, 낯선 가상 일터 간의 강한 유사성을 끌어냈다. 컴퓨터 이전의 일터에서, 생각이 종이에 쓰이면 그것은 ... 문서(document)라고 불렸다. 그 문서들이 저장될 필요가 있을 때 그것들은 ... 폴더(folder)에 넣어졌다. 그리고 그 폴더들은 ... 책상(desk)에 보관되었다. 문서, 폴더, 그리고 데스크톱은 Steve Jobs가 친숙한 용어를 사용하는 것이 새로운 기술을 이해하기 더 쉽게 만들리라는 것을 이해했기 때문에 우리가 우리의 가상 작업에서 사용하는 용어들이다. 물리적 일터와 가상 일터 사이의 유사점이 지금은 분명해 보인다.",
    },
    3: {
      "title": "대중음악과 접근성",
      "source": "2025년 3월 고2 학평 31번",
      "en": "The explosion of popular music in the second half of the twentieth century as well as the global circulation and dissemination of music by the creative industries propelled a new understanding of accessibility in relation to music. Suddenly, in the 1950s, anyone could pick up spoons, a couple of pans, a second-hand guitar and start a band. This led to specific genres such as skiffle, but also, more generally, reflected a much more relaxed and inclusive attitude to music making. While ordinary people had always sung and made music, the popular music movement was driven by a spirit of rebellion and freedom. This approach led to the punk movement, whose musicians even made it a condition for their music to be non-virtuosic and accessible to all in the 1970s. Groups who had been entirely excluded from music revelled in opportunities to create. This led to a sense of novelty and empowerment in and beyond the music sphere.",
      "ko": "창작 산업계의 전 세계적 음악 유통과 보급뿐만 아니라 20세기 후반의 대중음악의 폭발적 증가는 음악과 관련된 접근성에 대한 새로운 이해를 촉진했다. 갑자기, 1950년대에, 누구나 숟가락, 냄비 몇 개, 중고 기타를 집어 들고 밴드를 시작할 수 있었다. 이는 스키플(skiffle)과 같은 특정 장르로 이어졌을 뿐만 아니라, 또한, 더 일반적으로는, 음악 제작에 대한 훨씬 더 여유롭고 포용적인 태도를 반영했다. 평범한 사람들이 항상 노래를 부르고 음악을 만들어 왔었지만, 대중음악 운동은 저항과 자유 정신에 의해 촉진되었다. 이러한 접근 방식은 펑크 운동으로 이어졌으며, 이 운동의 음악가들은 1970년대에 심지어 자신의 음악이 전문성이 높지 않고 모든 사람에게 접근 가능해야 한다는 조건을 내걸었다. 음악에서 완전히 배제되었던 사람들은 창작할 수 있는 기회를 만끽했다. 이는 음악계 안팎에서 참신성과 자율성이라는 인식으로 이어졌다.",
    },
    5: {
      "title": "모든 번역은 군중 번역이다",
      "source": "2024년 10월 고2 학평 32번",
      "en": "All translators feel some pressure from the community of readers for whom they are doing their work. And all translators arrive at their interpretations in dialogue with other people. The English poet Alexander Pope had pretty good Greek, but when he set about translating Homer's Iliad in the early 18th century he was not on his own. He had Greek commentaries to refer to, and translations that had already been done in English, Latin, and French ─ and of course he had dictionaries. Translators always draw on more than one source text. Even when the scene of translation consists of just one person with a pen, paper, and the book that is being translated, or even when it is just one person translating orally for another, that person's linguistic knowledge arises from lots of other texts and other conversations. And then his or her idea of the translation's purpose will be influenced by the expectations of the person or people it is for. In both these senses every translation is a crowd translation.",
      "ko": "모든 번역가들은 그들이 대상으로 작업하고 있는 독자들의 공동체로부터 약간의 압박을 느낀다. 그리고 모든 번역가들은 다른 사람들과의 대화에서 그들의 해석에 도달한다. 영국의 시인 알렉산더 포프는 그리스어를 꽤 잘했지만, 18세기 초에 호머의 'Iliad'를 번역하기 시작했을 때 그는 혼자 한 것이 아니었다. 그는 참고할 그리스어 해설과 이미 영어, 라틴어, 프랑스어로 된 번역본을 가지고 있었고, 물론 사전도 가지고 있었다. 번역가들은 항상 한 가지 이상의 원문을 활용한다. 심지어 번역 현장이 하나의 펜, 종이, 그리고 번역 중인 책을 가진 단 한 사람으로 구성되어 있을 때나, 한 사람이 다른 사람을 위해 구두로 번역 중일 때에도, 그 사람의 언어적 지식은 많은 다른 텍스트와 다른 대화에서 발생한다. 그러고 나서 번역의 목적에 대한 그 또는 그녀의 생각은 이것의 대상이 되는 사람 또는 사람들의 기대에 의해 영향을 받는다. 이 두 가지 의미에서 모든 번역은 군중 번역이다.",
    },
    6: {
      "title": "공정한 과정의 역설",
      "source": "2024년 9월 고2 학평 31번",
      "en": "When we receive an unfavorable outcome, in some ways the very last thing we want to hear is that the process was fair. As outraging as the combination of an unfavorable outcome and an unfair process is, this combination also brings with it a consolation prize: the possibility of attributing the bad outcome to something other than ourselves. We may reassure ourselves by believing that our bad outcome had little to do with us and everything to do with the unfair process. If the process is fair, however, we cannot nearly as easily externalize the outcome; we got what we got \"fair and square.\" When the process is fair we believe that our outcome is deserved, which is another way of saying that there must have been something about ourselves (what we did or who we are) that caused the outcome.",
      "ko": "우리가 불리한 결과를 얻을 때, 어떤 면에서 우리가 '가장 듣고 싶지 않은' 말은 그 과정이 공정했다는 말이다. 불리한 결과와 불공정한 과정의 결합이 분노를 일으키지만, 이 결합은 또한 위로의 상, 즉 나쁜 결과를 우리 자신 이외의 다른 무언가의 탓으로 돌릴 가능성을 더불어 가져다준다. 우리는 우리의 나쁜 결과가 우리와는 거의 관련이 없었고 불공정한 과정과 전적으로 관련이 있었다고 믿음으로써 우리 자신을 안심시킬지도 모른다. 하지만 그 과정이 공정하다면, 우리는 결과를 그만큼 쉽게 외부화할 수 없으며, 우리는 우리가 얻은 것을 '정정당당하게' 얻은 것이다. 그 과정이 공정할 때 우리는 우리의 결과가 마땅하다고 믿게 되는데, 이는 그 결과를 초래한 우리 자신(우리가 무엇을 했는지 또는 우리가 누구인지)에 관한 무언가가 틀림없이 있었을 것이라고 말하는 또 다른 방식이다.",
    },
    7: {
      "title": "희소성과 리액턴스",
      "source": "2024년 6월 고2 학평 31번",
      "en": "We collect stamps, coins, vintage cars even when they serve no practical purpose. The post office doesn't accept the old stamps, the banks don't take old coins, and the vintage cars are no longer allowed on the road. These are all side issues; the attraction is that they are in short supply. In one study, students were asked to arrange ten posters in order of attractiveness ─ with the agreement that afterward they could keep one poster as a reward for their participation. Five minutes later, they were told that the poster with the third highest rating was no longer available. Then they were asked to judge all ten from scratch. The poster that was no longer available was suddenly classified as the most beautiful. In psychology, this phenomenon is called reactance: when we are deprived of an option, we suddenly deem it more attractive.",
      "ko": "우리는 그것들이 실용적인 목적을 수행하지 않더라도 우표, 동전, 빈티지 자동차들을 수집한다. 우체국은 오래된 우표를 받지 않고, 은행은 오래된 동전을 받지 않으며, 그리고 빈티지 자동차는 더 이상 도로에서 허용되지 않는다. 이런 것들은 모두 부수적인 문제이다. 매력은 그것들이 부족한 공급에 있다는 것이다. 한 연구에서, 학생들은 나중에 그들의 참여에 대한 보상으로 포스터 1장을 간직할 수 있다는 합의와 함께 포스터 10장을 매력도의 순서대로 배열하도록 요청받았다. 5분 후, 그들은 세 번째 높은 평가의 포스터가 더 이상 이용할 수 없다는 것을 들었다. 그런 다음 그들은 10개의 포스터를 모두 맨 처음부터 평가하라는 요청을 받았다. 더 이상 이용할 수 없는 포스터가 갑자기 가장 아름다운 것으로 분류되었다. 심리학에서, 이러한 현상은 '리액턴스'라고 불린다. 우리가 선택지를 빼앗겼을 때, 우리는 그것을 갑자기 더 매력적으로 여긴다.",
    },
    8: {
      "title": "매몰 비용 오류",
      "source": "2024년 6월 고2 학평 32번",
      "en": "If we've invested in something that hasn't repaid us ─ be it money in a failing venture, or time in an unhappy relationship ─ we find it very difficult to walk away. This is the sunk cost fallacy. Our instinct is to continue investing money or time as we hope that our investment will prove to be worthwhile in the end. Giving up would mean acknowledging that we've wasted something we can't get back, and that thought is so painful that we prefer to avoid it if we can. The problem, of course, is that if something really is a bad bet, then staying with it simply increases the amount we lose. Rather than walk away from a bad five-year relationship, for example, we turn it into a bad 10-year relationship; rather than accept that we've lost a thousand dollars, we lay down another thousand and lose that too. In the end, by delaying the pain of admitting our problem, we only add to it. Sometimes we just have to cut our losses.",
      "ko": "우리에게 보답해 주지 않는 무언가에 우리가 투자해 왔다면, 실패한 사업에 투자한 돈이거나, 불행한 인간관계에 투자한 시간이던지 간에 우리는 벗어나기가 매우 어렵다는 것을 안다. 이것은 매몰 비용 오류이다. 우리의 본능은 결국에는 우리의 투자가 가치 있는 것으로 입증될 것이라고 희망하면서 돈이나 시간에 투자를 계속하는 것이다. 포기한다는 것은 우리가 돌이킬 수 없는 무언가를 낭비해 왔다고 인정하는 것을 의미하고, 그런 생각은 너무 고통스러워서 우리가 할 수 있다면 그것을 피하기를 선호한다. 물론, 문제는 어떤 것이 정말 나쁜 투자라면, 그것을 계속하는 것은 우리가 잃는 총액을 증가시킬 뿐이라는 것이다. 예를 들어, 5년의 나쁜 관계에서 벗어나기보다는 우리는 그것을 10년의 나쁜 관계로 바꾸고, 천 달러를 잃었다는 사실을 받아들이기보다는 또 다른 천 달러를 내놓고 그것도 역시 잃는다. 결국, 우리의 문제를 인정하는 고통을 미룸으로써 우리는 그것(고통)을 키울 뿐이다. 때때로 우리는 손실을 끊어야만 한다.",
    },
  },
}
