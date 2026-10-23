/* 눈의 여왕 — 사람 (만나는 일은 js/systems/snowqueen.js). 2026-10-21
   · 게르다: 북유럽 호숫가에서 야영하면 만나는 소녀. 동생 카이를 찾아 모스크바까지 함께 간다 (무급 · 모스크바에서 내린다).
   · 엘리자베타: 「눈의 여왕」이라 불리던 러시아의 공주. 모스크바에서 그녀의 수수께끼를 풀면, 몰래 배에 올라 따라나선다 (무급).
     신학 2 · 과학 3 · 측량 3 · 회계 3 · 웅변 2 / 슬라브·그리스어 · 로망스어 · 게르만어 · 스페인어 · 포르투갈어 모두 3
   그림: images/portraits/legendary/<그림>.webp (흉상) · _half.webp (무릎상) — 없으면 코드 초상(북유럽·러시아 양식). */
(function (G) {
  'use strict';
  var L = [
    { id: 'gerda', name: '게르다', g: 'f', style: 'ne', role: 'maid', tone: 'cute', pic: 'gerda',
      st: [52, 64, 38, 90], sk: { speech: 1, cook: 1, med: 1 }, skBoost: 1, lg: { 3: 3 },
      desc: '눈의 여왕이 하얀 썰매에 태워 간 동생 카이를 찾아 맨발로 북쪽 끝까지 걸어온 소녀. 빨간 구두를 강물에 주고 길을 물었고, 까마귀와 산적의 딸과 핀란드 할머니의 도움을 받았다. 겁이 많지만 한번 마음먹으면 물러서지 않는다.' },
    { id: 'elizaveta', name: '엘리자베타', g: 'f', style: 'ru', role: 'noble', tone: 'polite', pic: 'elizaveta',
      st: [58, 90, 46, 92], sk: { theo: 2, sci: 3, survey: 3, acct: 3, speech: 2 }, skBoost: 1, lg: { 4: 3, 2: 3, 3: 3, 0: 3, 1: 3 },
      desc: '흰 담비 털옷과 은관 때문에 북방 사람들이 「눈의 여왕」이라 부르던 러시아의 공주. 별과 얼음의 이치를 꿰고, 장부를 한 번 훑으면 틀린 셈을 짚어 낸다. 다섯 나라 말을 모국어처럼 한다. 사라진 공가(公家)의 아이들을 몰래 거두어 길렀다 — 「아이들에게도 속아 넘어가는 사람을 누가 지켜 주겠소」라며 제독의 배에 몰래 올랐다.' }
  ];
  G.SNOWQUEEN = L.map(function (m) { return m.id; });
  // 게르다가 남기고 간 빨간 구두 (소지품 — 기념품)
  if (G.ITEMS && G.ITEM && !G.ITEM.redshoes) {
    var shoes = { id: 'redshoes', name: '게르다의 빨간 구두', kind: 'special', price: 0, reg: [], rare: true, desc: '동생을 찾아 북쪽 끝까지 걸어온 소녀가 「길을 잃은 아이를 만나면 그 아이 발에 맞을지도 몰라요」 하며 두고 간 빨간 구두 한 켤레.' };
    G.ITEMS.push(shoes); G.ITEM.redshoes = shoes;
  }
  L.forEach(function (m) {
    m.tale = true; m.fairy = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });
})(window.G = window.G || {});
