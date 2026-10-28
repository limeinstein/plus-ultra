/* 콜럼버스의 신대륙 발견과 그 뒤 — 콜론의 달걀 · 정복 · 식민 · 역병 (사건은 js/systems/newworld.js). 2026-10-29 사용자 요청
   콜론(크리스토발 콜론 = 콜럼버스)은 경쟁 탐험가(js/data/rivals.js)로 이미 게임에 있다 — 대사 얼굴은 그 그림(G.Art.rivalSpec)을 쓴다.
   그림: images/legend-events/NEWWORLD_PROMPT.md — 초상 portraits/history/<id>, 장면 legend-events/nw_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.newWorld = G.BALANCE.newWorld || {
    // ① 산타페의 약속 — 콜론에게 돈을 대면 바르셀로나 잔치에서 몫을 돌려받는다
    invest: 2000, payback: 3,
    // ② 바다 한가운데 — 겁먹은 콜론의 선원들에게 나눠 주는 식량·물
    gift: 10,
    // ⑤ 엔코미엔다
    encGold: 3000, encInfamy: 6, keepGold: 1500, keepInfamy: 3, freeInfamy: -4,
    // ⑦ 천연두 — 의원이 있으면 (의학 특기) 살리는 사람 수
    village: 300, savedBase: 40, savedPerLv: 55, herbs: 10, savedHerbs: 70, foodGift: 20, savedFood: 15,
    retry: 30   // 의원 없이 다녀간 마을에 다시 오기까지 날 수
  };

  // 사람들 (실제 인물 — 콜론은 경쟁 탐험가 그림을 쓴다)
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    nw_mendoza: { name: '멘도사 추기경', full: '페드로 곤살레스 데 멘도사', title: '톨레도 대주교 · 「에스파냐의 세 번째 왕」', st: 'ib', role: 'priest', born: 1428,
      look: '60대 중반, 길쭉한 얼굴, 추기경의 붉은 모자와 망토, 손가락에 큰 반지, 느긋하고 영리한 미소' },
    nw_ovando: { name: '오반도 총독', full: '니콜라스 데 오반도', title: '에스파뇰라(히스파니올라) 총독', st: 'ib', role: 'noble', born: 1460,
      look: '40대, 짧은 회색 수염, 칼라트라바 기사단의 붉은 십자가가 수놓인 흰 망토, 차갑고 깐깐한 눈' },
    nw_montesinos: { name: '몬테시노스 수사', full: '안톤 데 몬테시노스', title: '도미니코회 수사', st: 'ib', role: 'priest', born: 1475,
      look: '30대, 삭발한 머리, 흰 수도복에 검은 망토, 강단 위에서 손을 치켜든 불같은 눈' },
    nw_lascasas: { name: '라스 카사스', full: '바르톨로메 데 라스 카사스', title: '사제 · 엔코미엔다를 가진 정착민', st: 'ib', role: 'priest', born: 1484,
      look: '20대 후반, 둥근 얼굴에 생각 깊은 눈, 사제의 검은 옷, 손에 작은 기도서' },
    nw_enriquillo: { name: '엔리키요', full: '엔리키요 (과로쿠야)', title: '바오루코 산의 타이노 추장', st: 'az', role: 'king', born: 1496,
      look: '20대 초반, 곧은 검은 머리, 구릿빛 피부, 목에 조개와 돌 목걸이, 수도원에서 배운 에스파냐 옷을 반쯤 걸치고 허리에 면 띠, 굳은 눈빛' },
    nw_cacique: { name: '타이노 추장', title: '섬 마을의 추장', st: 'az', role: 'king', born: 1470,
      look: '50대, 몸에 붉고 검은 무늬, 목에 금박 원반(과닌) 목걸이, 머리에 깃털과 면 띠, 지친 눈' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });

  // 기념품 (시장에서는 팔지 않는다)
  if (G.ITEMS && G.ITEM) {
    [{ id: 'colon_egg', name: '콜론의 달걀', kind: 'keepsake', price: 0, gv: 15, reg: [],
       desc: '바르셀로나의 잔치에서 가져온 삶은 달걀. 밑동이 살짝 깨져 탁자 위에 꼿꼿이 선다. 「누군가 한 번 해 보이면 그 뒤엔 누구나 쉽다고 한다」는 이야기의 증거다. 먹으면 안 된다 — 이야깃거리니까.' },
     { id: 'cemi', name: '타이노의 세미', kind: 'keepsake', price: 0, gv: 40, reg: [],
       desc: '히스파니올라의 타이노 사람들이 조상과 신령을 모시던 작은 돌 신상(세미). 세 꼭지 모양 돌에 커다란 눈이 새겨져 있다. 천연두가 휩쓸던 해, 제독의 의원이 돌본 마을의 추장 엔리키요가 건넸다.' }
    ].forEach(function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } });
  }
})(window.G = window.G || {});
