/* 네덜란드 독립 전쟁 — 개미와 베짱이 (사건은 js/systems/dutchwar.js). 2026-10-28 사용자 요청
   이솝의 「개미와 베짱이」를 섞었다. 이대로 에스파냐 왕의 그늘에서 살지, 제 곳간을 제 손으로 지킬지 다투는 암스테르담 젊은이들의 이야기.
   · 할리나 — 청어 상인의 딸. 여러 사내들 틈에서 독립을 외치는 당돌한 도시 아가씨 (주인공). 할리나 편을 들어 일을 이루면 동료가 된다.
   · 페르베르크 — 펠리페 2세에게서 관직을 받은 귀족 집안의 딸, 에스파냐파. 페르베르크 편을 들어 일을 이루면 동료가 된다.
   · 둘 가운데 한 사람만 동료가 된다. 품삯은 이야기 동료 규칙(G.taleWage), 술집에는 나오지 않는다 (eventOnly).
   · 사내들(지어낸 인물): 얀(바다거지 선원·노래꾼) · 피터르(곡물 상인의 아들) · 디르크 판 페르베르크(페르베르크의 사촌, 에스파냐 테르시오 장교)
   그림: images/legend-events/DUTCH_PROMPT.md — 초상 portraits/legendary/halina·verberk, portraits/history/nl_jan·nl_pieter·nl_dirk, 장면 legend-events/dutch_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.dutchWar = G.BALANCE.dutchWar || {
    city: 24,              // 암스테르담 — 1578년 5월까지 왕의 편이던 도시
    from: 15660810,        // 성상 파괴 소동이 번진 여름부터
    to: 15750731,          // 이때까지 누구 편이든 곳간 일을 마쳐야 한다 (남쪽 도시들이 반란군 편에 서던 1577년의 두 해 전)
    wheat: 30,             // 곳간에 들일 밀
    cool: 30,              // 「아직 모르겠다」·싸움에 진 뒤 다시 찾아오기까지 날 수
    patrol: 60,            // 할리나 편 — 운하를 지키는 디르크의 에스파냐 순찰대
    geuzen: 50,            // 페르베르크 편 — 곳간을 덮치는 얀의 바다거지들
    shift: 2,              // 할리나 편으로 일을 이루면 네덜란드의 독립이 이만큼(해) 빨라진다
    offerUntil: 16000101,  // 동료 제안을 미뤘을 때 암스테르담에서 기다려 주는 마지막 날
    fameFree: 150, fameSpain: 120, trust: 15
  };

  // 사내들 — 지어낸 인물이지만 대화 얼굴은 역사 인물과 같은 방식으로 (G.Hist.speaker)
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    nl_jan: { name: '얀', full: '얀 클라선', title: '바다거지 선원 · 노래꾼', st: 'ne', role: 'captain', g: 'm', born: 1548, fiction: true,
      look: '20대 초반, 바람에 헝클어진 금발, 그을린 얼굴에 장난스러운 웃음, 해진 회색 선원 외투에 「거지 만세」 은메달, 등에 류트, 허리에 단검' },
    nl_pieter: { name: '피터르', full: '피터르 하위헌스', title: '곡물 상인의 아들', st: 'ne', role: 'merchant', g: 'm', born: 1546, fiction: true,
      look: '20대 중반, 단정하게 빗은 갈색 머리, 성실하고 걱정 많은 눈, 검은 모직 상인 옷에 흰 깃, 손에 장부와 밀 이삭' },
    nl_dirk: { name: '디르크', full: '디르크 판 페르베르크', title: '페르베르크의 사촌 · 에스파냐 테르시오 장교', st: 'ne', role: 'soldier', g: 'm', born: 1544, fiction: true,
      look: '20대 후반, 짧은 턱수염, 오만한 눈매, 광낸 흉갑에 붉은 에스파냐 띠, 모리온 투구를 옆에 끼고 레이피어를 찬 모습' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });

  // 동료가 되는 두 아가씨
  var M = [
    { id: 'halina', name: '할리나', g: 'f', style: 'ne', role: 'merchant', tone: 'rush', pic: 'halina', age: 'young',
      st: [58, 80, 52, 90], sk: { acct: 3, speech: 3, ops: 2, ship: 2 }, skBoost: 1, lg: { 3: 3, 2: 2, 0: 1 },
      desc: '암스테르담 청어 상인의 딸. 담 광장의 술통 위에 올라서서 「개미는 우리고, 베짱이는 우리 곳간에서 열 번째 동전을 걷어 가는 자들이에요!」 하고 외치던 당돌한 도시 아가씨. 장부 셈이 빠르고, 말싸움으로는 어떤 사내에게도 지지 않는다. 청혼한 사내가 셋이었지만 「나는 누구 집 곳간지기가 되려는 게 아니에요」 하고 바다로 나왔다. 북해의 배와 돛, 발트해 밀값을 손바닥 보듯 안다.' },
    { id: 'verberk', name: '페르베르크', g: 'f', style: 'ne', role: 'noble', tone: 'noble', pic: 'verberk', age: 'young',
      st: [48, 86, 44, 92], sk: { hist: 3, theo: 2, speech: 2, music: 2, art: 1 }, skBoost: 1, lg: { 3: 3, 0: 3, 2: 2 },
      desc: '마르하리타 판 페르베르크. 펠리페 2세에게서 관직을 받은 암스테르담 귀족 집안의 딸로, 사람들은 그저 「페르베르크 아가씨」라 부른다. 검붉은 비단에 상아색 레이스, 손에는 늘 접은 부채. 「개미 혼자서는 겨울을 못 나요. 더 큰 개미집에 들어가야지요」가 그녀의 지론이다. 역사와 예법, 에스파냐 말과 궁정의 일에 밝고, 왕의 곳간이 얼마나 큰지 제 눈으로 보려고 바다로 나왔다.' }
  ];
  G.DUTCH_MATES = M.map(function (m) { return m.id; });
  M.forEach(function (m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1560, 1640]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });
})(window.G = window.G || {});
