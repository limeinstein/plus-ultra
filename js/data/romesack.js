/* 1527년 로마 약탈 — 사람·물건·조정값 (사건: js/systems/romesack.js). 2026-10-29 사용자 요청
   ■ 인물 (모두 실제 인물): 클레멘스 7세 · 니콜로 마키아벨리 · 프란체스코 귀차르디니 · 부르봉 공작 샤를 · 스위스 근위대장 카스파르 뢰이스트 · 벤베누토 첼리니
     얼굴: images/portraits/history/<id>.webp — 클레멘스 7세·마키아벨리는 후원자 그림(portraits/sponsors/it_pope_6 · it_machiavelli)을 그대로 쓴다.
   ■ 물건: 「군주론」 필사본(마키아벨리가 건넨다 — 책으로 찍혀 나온 것은 1532년) · 「산탄젤로의 천사상」(귀한 선수상 — 약탈꾼에게서 빼앗은 것을 로마 사람들에게 기부하면) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    clement: { name: '클레멘스 7세', full: '교황 클레멘스 7세 (줄리오 데 메디치)', title: '로마 교황', st: 'it', role: 'priest', face: 'portraits/sponsors/it_pope_6', born: 1478, look: '40대 후반, 길고 각진 얼굴과 짧은 수염(약탈 뒤로는 애도의 뜻으로 길게 기른다), 흰 수단 위에 붉은 모제타, 근심 어린 눈' },
    machiavelli: { name: '니콜로 마키아벨리', title: '피렌체의 서기관 · 『군주론』을 쓴 사람', st: 'it', role: 'scholar', face: 'portraits/sponsors/it_machiavelli', born: 1469, look: '50대 후반, 짧은 머리와 깡마른 얼굴, 얇은 입술에 비꼬는 듯한 미소, 검은 피렌체 서기관 옷' },
    guicciardini: { name: '프란체스코 귀차르디니', title: '교황군 총대리 · 코냑 동맹군', st: 'it', role: 'noble', born: 1483, look: '40대, 둥근 얼굴과 짙은 수염, 검은 벨벳 옷 위 흉갑, 지도와 편지 다발' },
    bourbon: { name: '부르봉 공작 샤를', full: '샤를 3세 드 부르봉', title: '황제군 총사령관', st: 'ne', role: 'noble', born: 1490, look: '30대 후반, 날카로운 얼굴과 짧은 수염, 은빛 판금 갑옷 위에 흰 망토(안개 속에서도 눈에 띄는), 사다리를 짚은 손' },
    roist: { name: '카스파르 뢰이스트', title: '교황 스위스 근위대장', st: 'ne', role: 'soldier', born: 1478, look: '40대 후반, 굵은 콧수염, 노랑·파랑·빨강 줄무늬 근위대 옷에 흉갑, 미늘창' },
    cellini: { name: '벤베누토 첼리니', title: '피렌체의 금세공인 · 산탄젤로성의 포수', st: 'it', role: 'merchant', born: 1500, look: '20대 후반, 곱슬머리와 뾰족한 수염, 소매를 걷은 장인의 셔츠에 화약 자국, 화승총과 세공 망치' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.ROMESACK_FIGS = Object.keys(L);

  // ── 물건: 군주론 필사본 (책)
  if (G.ITEMS && G.ITEM && !G.ITEM.il_principe) {
    var bk = { id: 'il_principe', name: '『군주론』 필사본', kind: 'book', price: 0, reg: [], rare: true,
      desc: '니콜로 마키아벨리가 1513년에 쓰고 메디치 가에 바친 『군주론(Il Principe)』을 그가 손수 고쳐 쓴 필사본. 책으로 찍혀 나오는 것은 그가 죽은 뒤인 1532년이다. 마지막 장은 「이탈리아를 야만인들로부터 해방하라는 권고」로 끝난다. 「운명은 강물과 같다 — 둑을 쌓아 두지 않은 곳을 덮친다.」' };
    G.ITEMS.push(bk); G.ITEM.il_principe = bk;
  }
  // ── 물건: 산탄젤로의 천사상 (귀한 선수상 — 유물 선수상처럼 배에 달고 뗄 수 있다)
  if (G.FIGUREHEADS && G.FIGUREHEAD && !G.FIGUREHEAD.r_santangelo) {
    var fg = { id: 'r_santangelo', name: '산탄젤로의 천사상', price: 16000, rare: true, relic: 'romesack', luck: 0.06, storm: 0.12, morale: 0.14, battle: 0.08,
      desc: '1527년 로마 약탈 때 약탈꾼에게서 되찾은 금과 은을 로마 사람들에게 돌려준 제독에게, 로마 사람들과 금세공인 첼리니가 답례로 깎아 준 칼을 든 천사. 산탄젤로성 꼭대기의 대천사를 본떴다. 배를 지키고, 선원들의 마음을 붙든다.' };
    G.FIGUREHEADS.push(fg); G.FIGUREHEAD.r_santangelo = fg;
    if (G.ITEMS && G.ITEM && !G.ITEM.r_santangelo) { var it = { id: 'r_santangelo', name: fg.name, kind: 'fig', price: fg.price, rare: true, reg: [], desc: fg.desc }; G.ITEMS.push(it); G.ITEM.r_santangelo = it; }
  }

  // ── 조정값
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.romeSack = G.BALANCE.romeSack || {
    wallFoe: 110,          // ② 안개 낀 성벽 — 부르봉의 황제군
    escortFoe: 60,         // ② 파세토 — 교황을 산탄젤로성으로 (퇴각 판, 적의 차례 hold번)
    escortTeam: 40, hold: 2,
    loot: 7000,            // ③ 부하들이 약탈꾼을 약탈한 돈
    lootFoe: 35,           // ③ 약탈꾼 무리
    bribe: 3000,           // ④ 에스파냐 장교 매수
    hide: [0.5, 0.15],     // ④ 행상 수레에 숨기: 기본 + 웅변 단계마다
    fame: { wall: 220, escort: 160, donate: 180, flee: 200 }
  };
})(window.G = window.G || {});
