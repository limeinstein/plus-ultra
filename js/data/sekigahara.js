/* 세키가하라 전투·에도 막부 성립 (사건: js/systems/sekigahara.js). 2026-11-01 사용자 요청
   「1600~1603 세키가하라 전투·에도 막부 성립 — 도쿠가와 이에야스가 승리하고 막부를 수립해 일본의 새로운 지배 체제를 확립」
   ■ 사람(G.HIST_FIG): 도쿠가와 이에야스 · 이시다 미쓰나리 · 윌리엄 애덤스 · 고바야카와 히데아키 · 시마 사콘 · 예수회 통역
     얼굴: portraits/legendary/tokugawa_ieyasu · ishida_mitsunari (이미 있다) · 없으면 portraits/history/<id>
   ■ 동료: 미야모토 무사시 h_musashi (원래 있던 지역 사람 — js/data/regionfolk.js). 서군 편이면 싸움 뒤에 만난다
   ■ 소지품: sekigahara_shuin 주인장(朱印状) · sekigahara_globe 리프데호의 지구의 조각 */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('sk_ieyasu', { name: '도쿠가와 이에야스', title: '다섯 다이로 가운데 으뜸 · 에도의 주인', st: 'jp', role: 'noble', born: 1543, face: 'portraits/legendary/tokugawa_ieyasu', look: '50대 후반, 살집 있는 얼굴, 차분한 눈, 갈색 하오리, 손에 든 쥘부채' });
  fig('sk_mitsunari', { name: '이시다 미쓰나리', title: '도요토미 가문의 봉행', st: 'jp', role: 'official', born: 1560, face: 'portraits/legendary/ishida_mitsunari', look: '40대, 마른 얼굴에 날카로운 눈매, 대일대만대길(大一大万大吉) 문양의 깃발' });
  fig('sk_adams', { name: '윌리엄 애덤스', title: '리프데호의 잉글랜드인 항해사', st: 'ne', role: 'captain', born: 1564, look: '30대 후반, 햇볕에 그을린 얼굴, 덥수룩한 갈색 수염, 해진 선원 외투' });
  fig('sk_kobayakawa', { name: '고바야카와 히데아키', title: '마쓰오산에 진을 친 젊은 다이묘', st: 'jp', role: 'noble', born: 1582, look: '10대 후반, 창백하고 앳된 얼굴, 화려한 갑옷이 몸에 겉돈다' });
  fig('sk_sakon', { name: '시마 사콘', title: '미쓰나리의 가로', st: 'jp', role: 'soldier', born: 1540, look: '60대, 흰 수염, 귀신 같은 눈빛, 창을 짚은 노장' });
  fig('sk_jesuit', { name: '예수회 통역 신부', title: '오사카의 포르투갈인 신부', st: 'ib', role: 'priest', fiction: true, look: '검은 수단, 십자가, 못마땅한 얼굴' });
  G.SEKIGAHARA_FIGS = ['sk_ieyasu', 'sk_mitsunari', 'sk_adams', 'sk_kobayakawa', 'sk_sakon'];

  if (G.ITEMS && G.ITEM) {
    if (!G.ITEM.sekigahara_shuin) {
      var it = { id: 'sekigahara_shuin', name: '주인장 (朱印状)', kind: 'special', price: 0, reg: [], rare: true,
        desc: '에도의 쇼군 도쿠가와 이에야스가 붉은 인장을 찍어 내린 바다 건너 교역 허가장. 이것을 가진 배는 일본의 「주인선」으로 대접받는다.' };
      G.ITEMS.push(it); G.ITEM.sekigahara_shuin = it;
    }
    if (!G.ITEM.sekigahara_globe) {
      var gl = { id: 'sekigahara_globe', name: '리프데호의 지구의 조각', kind: 'special', price: 0, reg: [], rare: true,
        desc: '오사카 성에서 이에야스가 윌리엄 애덤스에게 「세상이 어떻게 생겼느냐」 물었을 때 쓴 작은 지구의의 받침. 애덤스가 고맙다며 건넸다.' };
      G.ITEMS.push(gl); G.ITEM.sekigahara_globe = gl;
    }
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.sekigahara = G.BALANCE.sekigahara || {
    westGold: 3000,          // 미쓰나리가 서군에 서라며 내미는 금화
    eastGold: 3000,          // 이긴 뒤 이에야스의 포상
    shuinFee: { none: 1500, west: 3000 },   // 1603 에도에서 주인장을 받는 값 (동군이면 공짜 · 애덤스를 변호했으면 절반)
    persuade: 0.35,          // 서군: 마쓰오산의 고바야카와를 붙잡을 가망 (+ 웅변 단계마다 0.1) — 붙잡아도 역사는 그대로
    foe: { east: 60, west: 70 },
    field: [136.43, 35.37], fieldR: 0.3,
    fame: { adams: 60, battle: 160, shogun: 120 }
  };
})(window.G = window.G || {});
