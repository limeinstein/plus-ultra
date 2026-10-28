/* 무굴 제국의 성립 (1504~1556)에 나오는 실제 인물들 — G.HIST_FIG 에 덧붙인다. 사건은 js/systems/mughal.js. 2026-10-28 사용자 요청
   얼굴 그림: images/portraits/history/<id>.webp (448×448) · <id>_half.webp (1024×1536 투명 무릎상) — images/legend-events/MUGHAL_PROMPT.md
   그림이 없으면 역할(role)·양식(st: pe 페르시아·중앙아시아, in 인도)으로 그린 얼굴. */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    babur: { name: '바부르', full: '자히르 웃딘 무함마드 바부르', title: '카불의 왕 · 무굴 제국의 첫 황제', st: 'pe', role: 'king', born: 1483,
      look: '40대 초반, 다부진 기병의 몸, 짧게 다듬은 검은 수염, 티무르 왕가의 흰 터번에 깃털 장식, 금실 수놓은 초록 겉옷, 허리에 굽은 칼과 회고록을 적는 작은 책' },
    humayun: { name: '후마윤', full: '나시르 웃딘 후마윤', title: '바부르의 맏아들 · 바다흐샨의 태수', st: 'pe', role: 'noble', born: 1508,
      look: '10대 후반, 갸름하고 부드러운 얼굴, 옅은 수염, 높은 터번과 진주 장식, 별자리를 즐겨 보는 몽상가의 눈' },
    aliquli: { name: '우스타드 알리 쿨리', title: '바부르의 포술장 · 오스만식 대포 장인', st: 'pe', role: 'soldier', born: 1480,
      look: '40대, 화약에 그을린 손과 얼굴, 짧은 회색 수염, 오스만식 붉은 모자와 가죽 앞치마, 허리에 화약통과 쇠꼬챙이' },
    ibrahim: { name: '이브라힘 로디', title: '델리의 술탄 · 로디 왕조', st: 'in', role: 'king', born: 1480,
      look: '40대, 살집 있는 오만한 얼굴, 아프간식 수염, 금실 터번에 커다란 루비, 비단 겉옷과 보석 박힌 단검' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.MUGHAL_FIGS = Object.keys(L);

  // 바부르가 건네는 기념품 (시장에서는 팔지 않는다)
  if (G.ITEMS && G.ITEM && !G.ITEM.babur_page) {
    var it = { id: 'babur_page', name: '바부르의 회고록 한 장', kind: 'keepsake', price: 0, gv: 25, reg: [], desc: '무굴 제국을 세운 바부르가 손수 적은 회고록(『바부르나마』)의 한 장. 카불의 정원과 멜론, 파니파트의 화포 이야기가 차가타이 튀르크어로 빼곡하다. 「대포는 프랑크 사람의 것이 으뜸이라 들었다」는 줄이 보인다.' };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  }
})(window.G = window.G || {});
