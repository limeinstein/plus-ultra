/* 동인도 회사의 탄생 — 잉글랜드(1600)와 네덜란드(1602), 그리고 향료의 바다에서 벌어진 네 번의 위기 (사건은 js/systems/eastindia.js · G.EIndia). 2026-11-04 사용자 요청
   · 설립: 런던(1600.9~1601.2) 「동인도 무역 런던 상인 회사」의 출자 · 암스테르담(1602.3.20~8.31) 「연합 동인도 회사(VOC)」의 주식 청약
   · 위기의 절정 — 미인·미남이 동료가 된다 (모두 이 게임을 위해 새로 지은 사람 · 성인):
       1612 수왈리 해전 (디우 북동쪽 수라트 앞바다)   마리암 하코비안 — 수라트의 아르메니아 상인 딸
       1619 자야카르타의 불 (반탐 동쪽, 바타비아가 서기 전) 라덴 아유 칸차나 — 자야카르타 왕가의 아가씨
       1621 반다의 비극 (암보이나 남쪽 반다 제도)       이드리스 — 반다 오랑 카야의 아들
       1623 암보이나 사건 (암보이나)                    에드먼드 헤일 — 잉글랜드 동인도 회사의 젊은 서기
   그림: images/legend-events/EASTINDIA_PROMPT.md — 초상 portraits/legendary/<id>, portraits/history/ei_*, 장면 legend-events/ei_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.eindia = G.BALANCE.eindia || {
    // 출자·청약은 그 회사의 주식이 된다 (G.Company.subscribe · 주가 곡선은 js/data/company.js 하나뿐 — 2026-11-06)
    eic: { city: 38, from: 16000922, to: 16010213, opts: [1000, 3000, 10000], payAt: 16040301, ret: 1.95 },   // 첫 항해(랭커스터)가 돌아와 이익(약 95%)을 1주마다 나눈다 — 액면 × (ret − 1)
    voc: { city: 24, from: 16020320, to: 16020831, opts: [1000, 3000, 10000], divAt: 16100415, div: 0.75 },
    swally: { city: 148, from: 16121001, to: 16121231, pirates: 30 },
    jakatra: { city: 168, from: 16181201, to: 16190530, soldiers: 30, bribe: 2500 },
    banda: { city: 172, from: 16210201, to: 16211231, soldiers: 26 },
    amboyna: { city: 172, from: 16230215, to: 16230308, speech: 2, guards: 24 },
    again: 180,
    loyal: 82
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    ei_smythe: { name: '토머스 스마이스', title: '런던 상인 · 동인도 회사의 첫 총재', st: 'ne', role: 'merchant', born: 1558,
      look: '40대 초반, 단정한 갈색 수염, 검은 비단 더블릿에 넓은 주름 깃(러프), 금목걸이, 손에 출자 명부' },
    ei_lancaster: { name: '제임스 랭커스터', title: '동인도 회사 첫 함대의 사령관', st: 'ne', role: 'captain', born: 1554,
      look: '40대 후반, 바닷바람에 그을린 얼굴, 짧은 회색 수염, 가죽 조끼와 넓은 모자, 손에 레몬 즙 병' },
    ei_lemaire: { name: '이삭 르메르', title: '암스테르담의 큰 상인 · 네덜란드 동인도 회사의 큰 출자자', st: 'ne', role: 'merchant', born: 1558,
      look: '40대 중반, 날카로운 눈, 검은 옷에 흰 맷돌 깃, 손에 주식 장부' },
    ei_best: { name: '토머스 베스트', title: '동인도 회사 제10차 항해 사령관 · 레드 드래건호', st: 'ne', role: 'captain', born: 1570,
      look: '40대, 다부진 몸, 붉은 수염, 칼 찬 허리와 검은 망토' },
    ei_coen: { name: '얀 피터르스존 쿤', title: '네덜란드 동인도 회사 총독 · 바타비아를 세운 이', st: 'ne', role: 'official', born: 1587,
      look: '30대 초반, 마르고 차가운 얼굴, 짧게 다듬은 수염, 검은 옷에 흰 깃, 꽉 쥔 장갑' },
    ei_speult: { name: '헤르만 판스페울트', title: '네덜란드 동인도 회사 암보이나 총독', st: 'ne', role: 'official', born: 1580,
      look: '40대, 의심 많은 눈, 붉은 얼굴, 흉갑 위에 주황 장식띠' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.EINDIA_FIGS = Object.keys(L);

  var M = [
    { id: 'mariam', name: '마리암 하코비안', short: '마리암', g: 'f', style: 'pe', role: 'merchant', tone: 'polite', pic: 'mariam', age: 'young',
      st: [52, 84, 30, 96], sk: { speech: 3, acct: 2, craft: 2 }, skBoost: 1, lg: { 6: 3, 8: 2, 1: 2, 5: 1 },
      desc: '수라트에 사는 아르메니아 상인 집안의 딸. 스물넷. 이스파한에서 수라트까지 비단과 보석을 사고팔던 아버지 곁에서 자라, 페르시아어·힌두어·포르투갈어로 흥정한다. 길게 늘어뜨린 검은 머리와 짙은 눈썹, 웃으면 사람의 경계가 풀린다. 보석의 흠을 한눈에 가려낸다. 수왈리 앞바다의 혼란 속에서 아버지의 배를 지켜 낸 제독을 따라나섰다.' },
    { id: 'kancana', name: '라덴 아유 칸차나', short: '칸차나', g: 'f', style: 'se', role: 'noble', tone: 'noble', pic: 'kancana', age: 'young',
      st: [55, 80, 35, 95], sk: { music: 3, art: 2, speech: 2 }, skBoost: 1, lg: { 12: 3, 1: 1, 5: 1 },
      desc: '자바 서쪽 자야카르타 왕가의 아가씨. 스물둘. 가믈란 악단을 이끌고 바틱 무늬를 손수 그린다. 머리에 꽂은 금 장식과 우아한 걸음, 낮고 맑은 목소리. 1619년 네덜란드 사람들이 자야카르타를 불태우던 날, 백성들을 반텐으로 피신시키다 제독을 만났다. 「불탄 도시 위에 새 이름이 붙어도, 노래는 옛 이름을 기억한다」.' },
    { id: 'idris', name: '이드리스', short: '이드리스', g: 'm', style: 'se', role: 'sailor', tone: 'rush', pic: 'idris', age: 'young',
      st: [80, 74, 76, 92], sk: { nav: 3, ship: 2, survey: 2, sword: 1 }, skBoost: 1, lg: { 12: 3, 5: 2, 1: 1 },
      desc: '반다 제도의 오랑 카야(원로) 집안 아들. 스물여섯. 육두구 숲과 화산섬 사이를 쪽배로 누비며 자라, 별과 바람으로 길을 찾는다. 햇볕에 그을린 단단한 몸, 바다처럼 깊은 눈, 웃을 때 드러나는 흰 이. 1621년 네덜란드 동인도 회사가 반다를 짓밟던 날, 육두구 묘목을 품에 안고 바다로 달아났다. 「이 나무가 한 섬에만 자라니 우리가 죽는다. 세상에 퍼뜨리겠다.」' },
    { id: 'edmund', name: '에드먼드 헤일', short: '에드먼드', g: 'm', style: 'ne', role: 'scholar', tone: 'polite', pic: 'edmund', age: 'young',
      st: [64, 86, 50, 90], sk: { acct: 3, hist: 2, speech: 2 }, skBoost: 1, lg: { 3: 3, 12: 1, 1: 1 },
      desc: '잉글랜드 동인도 회사의 젊은 서기. 스물넷. 옥스퍼드에서 공부하다 빚 많은 집안을 일으키려 동방으로 왔다. 금발에 가는 얼굴, 장부를 넘기는 긴 손가락. 1623년 암보이나에서 반역 누명을 쓰고 물고문을 당했지만 끝내 거짓 자백을 하지 않았다. 「장부에는 거짓을 적지 않는다 — 그것이 내가 아는 단 하나의 맹세다.」' }
  ];
  G.EINDIA_MATES = M.map(function (m) { return m.id; });
  M.forEach(function (m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1590, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });

  var IT = [
    { id: 'eic_charter', name: '동인도 회사 출자 증서', gv: 16, desc: '1600년 런던의 「동인도 무역 런던 상인 회사」에 낸 출자의 증서. 엘리자베스 여왕의 특허장 날짜가 적혀 있다.' },
    { id: 'voc_share', name: '네덜란드 동인도 회사 주식 증서', gv: 18, desc: '1602년 암스테르담에서 청약한 연합 동인도 회사의 주식 증서. 세상에서 처음으로 누구나 사고팔 수 있게 된 회사의 몫이다.' },
    { id: 'armenian_ring', name: '하코비안 집안의 석류석 반지', gv: 20, desc: '마리암의 아버지가 수왈리의 밤에 건넨 반지. 아르메니아 글자로 「길 위의 형제」라 새겨져 있다.' },
    { id: 'gamelan_gong', name: '자야카르타의 작은 징', gv: 18, desc: '불타는 자야카르타에서 칸차나가 건져 낸 가믈란의 작은 징. 치면 낮고 긴 소리가 오래 남는다.' },
    { id: 'nutmeg_seedling', name: '반다의 육두구 묘목', gv: 24, desc: '이드리스가 품에 안고 반다를 빠져나온 육두구 묘목. 이 나무가 한 섬에만 자란다는 것이 반다 사람들의 비극이었다.' },
    { id: 'hale_ledger', name: '에드먼드의 피 묻은 장부', gv: 18, desc: '암보이나의 감옥에서도 에드먼드 헤일이 놓지 않은 회사 장부. 마지막 쪽에 거짓 자백을 거부한 날짜가 적혀 있다.' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) {
    if (G.ITEM[x.id]) return;
    var it = { id: x.id, name: x.name, kind: 'keepsake', price: 0, gv: x.gv, reg: [], desc: x.desc };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  });
})(window.G = window.G || {});
