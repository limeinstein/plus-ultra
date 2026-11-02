/* 모하치 전투(1526) — 사람·소지품·조정값 (사건: js/systems/mohacs.js) 2026-11-02 사용자 요청
   ■ 사람 (G.HIST_FIG): 러요시 2세 · 헝가리의 마리아 · 토모리 팔 · 서포여이 야노시 · 페르디난트 · 첼레 개울가의 시종
     술탄 쉴레이만과 이브라힘 파샤는 js/data/ottomaneurope.js 의 ot_suleyman · ot_ibrahim 을 그대로 쓴다
   ■ 소지품: 코르비누스 문고의 필사본(mh_corvina) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('mh_louis', { name: '러요시 2세', title: '헝가리와 보헤미아의 왕', st: 'ne', role: 'noble', born: 1506, look: '스무 살, 앳된 얼굴에 가는 수염, 금박 판금 갑옷, 지친 눈' });
  fig('mh_mary', { name: '헝가리의 마리아', title: '헝가리의 왕비 · 카를 5세의 누이', st: 'ne', role: 'noble', g: 'f', born: 1505, look: '스물한 살, 합스부르크의 긴 턱, 짙은 색 사냥복, 책을 즐겨 읽는 단단한 눈빛' });
  fig('mh_tomori', { name: '토모리 팔', title: '칼로처 대주교 · 헝가리 군 총사령관', st: 'ne', role: 'priest', born: 1475, look: '50대, 프란치스코회 수도사의 거친 옷 위에 갑옷, 깎은 머리, 군인의 얼굴' });
  fig('mh_zapolya', { name: '서포여이 야노시', title: '트란실바니아의 영주 · 헝가리의 왕(1526.11~)', st: 'ne', role: 'noble', born: 1487, look: '30대 후반, 검은 수염, 모피 깃의 붉은 망토, 계산하는 눈' });
  fig('mh_ferdinand', { name: '페르디난트', title: '오스트리아 대공 · 보헤미아·헝가리의 왕(1526.12~)', st: 'ne', role: 'noble', born: 1503, look: '20대 초반, 합스부르크의 긴 턱, 검은 벨벳 옷, 금양모 기사단 목걸이' });
  fig('mh_page', { name: '첼레 개울가의 시종', title: '왕의 말을 끌던 소년', st: 'ne', role: 'sailor', born: 1510, fiction: true, look: '열여섯 살, 진흙투성이 시종 옷, 울어서 부은 눈' });
  G.MOHACS_FIGS = ['mh_louis', 'mh_mary', 'mh_tomori', 'mh_zapolya', 'mh_ferdinand', 'mh_page'];

  if (G.ITEMS && G.ITEM && !G.ITEM.mh_corvina) {
    var it = { id: 'mh_corvina', name: '코르비누스 문고의 필사본', kind: 'special', price: 0, reg: [], rare: true,
      desc: '마차시 왕이 부다 궁에 모은 「비블리오테카 코르비니아나」의 한 권. 금박 장식과 까마귀 문장이 박힌 가죽 표지 — 1526년 부다가 무너질 때 흩어진 책들 가운데 하나다.' };
    G.ITEMS.push(it); G.ITEM.mh_corvina = it;
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.mohacs = G.BALANCE.mohacs || {
    loan: 3000,               // ① 빈 국고 — 왕에게 빌려주는 금화 (용병을 사면 전투의 오스만 군이 준다)
    loanCut: 0.85,            // 빌려주면 적의 수 ×
    bridgeGold: 2500,         // ② 드라바 강의 다리 값
    support: 2000,            // ③ 두 왕 가운데 한 사람을 돕는 금화
    foe: { battle: 90, raid: 22, magyar: 70 },
    fame: { battle: 160, mary: 200, bridge: 120, king: 80 }
  };
})(window.G = window.G || {});
