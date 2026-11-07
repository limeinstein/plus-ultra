/* 16세기 동남아시아와 태평양 — 여섯 이야기 (사건은 js/systems/seasia16.js · G.SEAsia). 2026-11-07 사용자 요청
   ① 바인나웅의 아바·란나 정복 (1555~1558, 페구) — 포르투갈 용병과 총포
   ② 란쌍의 비엔티안 천도와 탓루앙 (1560~1566, 아유타야에 온 란쌍 사절) — 탑을 덮을 금
   ③ 레가스피의 세부 거점 (1565~1570, 세부 앞바다) — 산토 니뇨와 라자 투파스, 포르투갈 함대의 봉쇄(1568)
   ④ 마닐라 갤리온의 길 (1565.10~1566, 아카풀코) — 우르다네타의 「돌아오는 길(토르나비아헤)」
   ⑤ 아유타야 함락 (1568.11~1569.8.29, 아유타야) — 장인과 왕족의 피란, 바인나웅의 포위
   ⑥ 마닐라 (1570.5~1572, 마닐라 만) — 라자 술라이만과 반쿠사이, 레가스피의 도시, 중국 상인들
   그림: images/legend-events/SEASIA16_PROMPT.md — 초상 portraits/history/sa_*, 장면 legend-events/sa_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.seasia16 = G.BALANCE.seasia16 || {
    toungoo: { city: 159, from: 15541001, to: 15581231, guns: 10, cannon: 3, premium: 2.2, army: 90 },
    lanxang: { city: 162, from: 15600101, to: 15661231, gold: 10, k: 1.8, donate: 2000 },
    cebu: { from: 15650427, to: 15701231, box: [123.3, 124.4, 9.8, 10.9], food: 30, k: 3 },
    urdaneta: { city: 205, from: 15651008, to: 15661231, herbs: 6 },
    ayutthaya: { city: 162, from: 15681101, to: 15690829, army: 80, guns: 10, premium: 2.0 },
    manila: { from: 15700501, to: 15721231, box: [120.4, 121.15, 14.2, 14.95], fight: 60 },
    again: 180
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    sa_bayinnaung: { name: '바인나웅', title: '따웅우 왕조의 왕 · 「열 방향의 승리자」', st: 'in', role: 'king', born: 1516,
      look: '40대, 다부진 무인의 몸, 짧은 콧수염, 금실 버마식 관(오각형 왕관), 붉은 비단 겉옷, 흰 코끼리 문장, 손에 칼' },
    sa_setthathirath: { name: '세타티랏 왕', title: '란쌍 왕국의 왕', st: 'in', role: 'king', born: 1534,
      look: '20대 후반, 부드럽지만 단호한 얼굴, 끝이 뾰족한 라오식 금관, 흰 비단 옷, 손에 연꽃' },
    sa_laomonk: { name: '라오의 큰스님', title: '란쌍 왕실의 스님 · 사절단을 이끄는 이', st: 'in', role: 'priest', born: 1500,
      look: '60대, 깎은 머리, 주황빛 가사, 손에 야자잎 경전 꾸러미, 맑은 눈' },
    sa_legazpi: { name: '미겔 로페스 데 레가스피', title: '필리핀 원정대장 · 첫 총독', st: 'ib', role: 'noble', born: 1502,
      look: '60대, 흰 수염, 검은 옷 위의 흉갑, 붉은 어깨띠, 노장의 침착한 눈' },
    sa_urdaneta: { name: '안드레스 데 우르다네타', title: '아우구스티노회 수사 · 항해사', st: 'ib', role: 'priest', born: 1508,
      look: '50대 후반, 수척한 얼굴, 검은 수도복, 손에 해도와 아스트롤라베, 괴혈병으로 지친 기색' },
    sa_tupas: { name: '라자 투파스', title: '세부의 왕', st: 'se', role: 'king', born: 1530,
      look: '30대, 몸에 문신, 금 목걸이와 팔찌, 붉은 머리띠, 허리에 칼(캄필란)' },
    sa_sulayman: { name: '라자 술라이만', title: '마닐라(마이닐라)의 왕', st: 'se', role: 'king', born: 1540,
      look: '30세, 젊고 당당한 얼굴, 이슬람식 터번과 붉은 비단 옷, 금 귀걸이, 허리에 크리스' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.SEASIA16_FIGS = Object.keys(L);

  var IT = [
    { id: 'white_elephant_seal', name: '흰 코끼리 인장', gv: 18, desc: '따웅우 왕 바인나웅이 총포를 바친 포르투갈 사람에게 내린 인장. 흰 코끼리는 버마 왕권의 상징이다.' },
    { id: 'thatluang_leaf', name: '탓루앙의 금박 한 장', gv: 20, desc: '비엔티안의 큰 탑 탓루앙을 덮을 금박 가운데 한 장. 란쌍의 스님이 「공덕을 나눈 사람」에게 돌려준 것이다.' },
    { id: 'santo_nino_copy', name: '산토 니뇨의 작은 모상', gv: 16, desc: '1565년 세부의 불탄 집에서 찾아낸 아기 예수상 — 마젤란이 마흔네 해 전에 남긴 것 — 을 본떠 깎은 작은 나무 상.' },
    { id: 'tornaviaje_chart', name: '우르다네타의 돌아오는 길 해도', kind: 'book', gv: 30, desc: '필리핀에서 북쪽으로 올라가 북위 40도 언저리의 서풍과 해류를 타고 아메리카로 돌아오는 길을 그린 해도. 이 길이 열리자 마닐라와 아카풀코 사이에 갤리온이 오가게 되었다.' },
    { id: 'ayutthaya_craft', name: '아유타야 장인의 금 상감 함', gv: 22, desc: '1569년 무너지는 아유타야에서 함께 빠져나온 장인이 고마움의 뜻으로 건넨 작은 함. 검은 옻칠 위에 금으로 연꽃이 새겨져 있다.' },
    { id: 'sulayman_kris', name: '술라이만의 크리스', gv: 18, desc: '마닐라의 젊은 왕 라자 술라이만이 지녔다는 물결 모양 칼날의 단검. 반쿠사이의 바다에서 건져 올렸다.' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) {
    if (G.ITEM[x.id]) return;
    var it = { id: x.id, name: x.name, kind: x.kind || 'keepsake', price: 0, gv: x.gv, reg: [], desc: x.desc };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  });
})(window.G = window.G || {});
