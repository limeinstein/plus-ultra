/* 아이작 뉴턴 — 사과 · 『프린키피아』 · 남해 회사 주식의 나락 (사건은 js/systems/newton.js). 2026-10-30 사용자 요청
   · 뉴턴은 동료가 될 수 있다: 회계 1 · 측량·과학·조선기술·세공·항해·웅변 3 · 지력 97
   · 핼리·후크는 실제 인물, 주식 중개인은 지어낸 인물
   그림: images/legend-events/NEWTON_PROMPT.md — 초상 portraits/history/<id>, 장면 legend-events/nt_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.newton = G.BALANCE.newton || {
    london: 38,
    farm: [-0.630, 52.809], farmR: 0.6,          // 링컨셔 울즈소프 — 뉴턴의 고향 (경도, 위도) · 이만큼(도) 안의 뭍
    appleFrom: 16650601, appleTo: 16670430,      // 흑사병으로 케임브리지가 문을 닫은 「기적의 해」
    prinFrom: 16860428, prinTo: 16870704,        // 원고가 왕립 학회에 닿은 날 ~ 책이 나오기 전날
    printFund: 1500, fishPrice: 400,             // 인쇄비 · 『물고기의 역사』 스무 권
    bubbleFrom: 17200101, bubbleTo: 17201231,    // 남해 회사 주식 — 1720년 런던
    // 남해 회사 주식 한 주 값 (금화, 날짜 사이는 곧게 잇는다 — 역사의 파운드 값을 따랐다)
    price: [[17200101, 128], [17200301, 330], [17200401, 400], [17200520, 550], [17200602, 890], [17200624, 1050], [17200801, 950], [17200901, 775], [17200915, 520], [17201001, 290], [17201101, 210], [17201231, 150]],
    stake: [2000, 5000, 10000], stakeMax: 10000, fee: 0.03,   // 한 번에 사는 돈 · 들인 돈의 합 상한 · 사고팔 때 중개 수수료
    joinFrom: 16650601, death: 17270320, reOffer: 60,
    fame: { apple: 40, moon: 30, fund: 120, mediate: 80 }
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    newton: { name: '아이작 뉴턴', title: '케임브리지의 수학자 · 왕립 조폐국장', st: 'ne', role: 'scholar', g: 'm', born: 1643, face: 'portraits/history/newton',
      look: '젊을 때는 20대 초반 — 어깨까지 오는 갈색 머리, 창백하고 날카로운 얼굴, 꿰뚫어 보는 회색 눈, 검은 학자 가운. 늙어서는 70대 — 길고 흰 가발, 붉은 벨벳 외투, 깊게 팬 주름' },
    nt_halley: { name: '에드먼드 핼리', title: '천문학자 · 왕립 학회 서기', st: 'ne', role: 'captain', g: 'm', born: 1656,
      look: '30대 초반, 밝고 시원한 얼굴, 갈색 가발, 푸른 외투, 손에 원고 뭉치와 혜성 궤도를 그린 종이' },
    nt_hooke: { name: '로버트 후크', title: '왕립 학회 실험 관리자', st: 'ne', role: 'scholar', g: 'm', born: 1635,
      look: '50대, 굽은 등, 마르고 날카로운 얼굴, 헝클어진 머리, 낡은 외투 주머니에 현미경과 용수철' },
    nt_broker: { name: '익스체인지 앨리의 중개인', title: '주식 중개인', st: 'ne', role: 'captain', g: 'm', fiction: true,
      look: '40대, 번들거리는 얼굴, 화려한 금단추 조끼, 귀에 깃펜, 손에 주식 증서 뭉치' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });

  // 동료 — 뉴턴
  var m = { id: 'newton', name: '아이작 뉴턴', short: '뉴턴', g: 'm', style: 'ne', role: 'scholar', tone: 'genius', pic: 'newton', bornY: 1643,
    st: [45, 97, 30, 55], sk: { acct: 1, survey: 3, sci: 3, ship: 3, craft: 3, nav: 3, speech: 3 }, skBoost: 1, lg: { 3: 3, 2: 3 },
    desc: '잉글랜드 링컨셔 울즈소프의 농가에서 태어난 수학자. 떨어지는 사과를 보고 달이 왜 떨어지지 않는지를 물었고, 그 답으로 하늘과 땅을 하나의 법칙으로 묶은 『자연철학의 수학적 원리(프린키피아)』를 썼다. 손수 반사 망원경을 갈아 만들 만큼 손재주가 좋고, 조수와 달의 움직임으로 바다 위의 자리를 재는 일에 누구보다 밝다. 사람을 잘 믿지 않고 비판에는 날카롭지만, 일단 마음을 열면 밤새 별과 숫자를 이야기한다.' };
  m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1665, 1727]; m.reg = []; m.face = 'portraits/history/newton'; m.eventOnly = true;
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }

  if (G.ITEMS && G.ITEM) {
    [{ id: 'principia', name: '『프린키피아』 초판', kind: 'keepsake', price: 0, gv: 80, reg: [],
       desc: '1687년 런던에서 나온 아이작 뉴턴의 『자연철학의 수학적 원리』 초판. 라틴어로 빽빽이 적힌 세 권 — 운동의 법칙, 저항하는 매질 속의 운동, 그리고 「세계의 체계」. 달이 바다를 끌어당겨 밀물과 썰물이 생긴다는 장이 뱃사람의 눈을 끈다. 속표지에 「인쇄를 도운 바다의 벗에게 — I. N.」이라는 서명이 있다.' },
     { id: 'fish_history', name: '『물고기의 역사』', kind: 'keepsake', price: 0, gv: 2, reg: [],
       desc: '왕립 학회가 큰돈을 들여 찍었다가 하나도 팔리지 않은 윌러비의 물고기 도감. 그림은 아름답지만 아무도 사지 않았다. 이 책 때문에 학회 금고가 비어 『프린키피아』를 찍을 돈이 없었다.' }
    ].forEach(function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } });
  }
})(window.G = window.G || {});
