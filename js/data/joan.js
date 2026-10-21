/* 오를레앙의 처녀 잔 — 마녀로 몰린 처녀 기사 (만나는 일은 js/systems/joan.js). 2026-10-21 사용자 요청
   · 기함에 예배실(기도실)이 있고 비어 있을 때, 프랑스 도시 근처 숲에서 야영하며 약초를 찾으면
     그녀를 마녀로 몰아 화형대에 세우려는 사람들과 마주친다 — 무리의 우두머리와 일기토로 구하면 합류
   · 웅변·측량·운용·검술·신학 3 · 로망스어·게르만어 3 · 체력 92 · 무력 95 (지력·매력은 정해 주지 않아 72·86)
   · 말투: 츤데레 — 「내가 이길 수도 있었는데」
   · 품삯을 받지 않는다(wage 0)
   · 그림: images/portraits/legendary/joan_of_arc.webp (흉상) · joan_of_arc_half.webp (무릎상) — Codex가 그린다 (프롬프트: images/legend-events/JOAN_PROMPT.md)
     장면 그림(없으면 건너뜀): images/legend-events/joan_of_arc_stake.webp · joan_of_arc_rescue.webp */
(function (G) {
  'use strict';
  var m = { id: 'joan_of_arc', name: '오를레앙의 처녀 잔', short: '잔', g: 'f', style: 'ne', role: 'noble', tone: 'tsun', pic: 'joan_of_arc', age: 'young',
    st: [92, 72, 95, 86], sk: { speech: 3, survey: 3, ops: 3, sword: 3, theo: 3 }, skBoost: 1, lg: { 2: 3, 3: 3 },   // skBoost: 정해 준 능력 그대로 · 로망스어·게르만어
    desc: '로렌의 시골 마을에서 「하늘의 목소리」를 들었다며 갑옷을 입고 군대 맨 앞에 섰던 처녀. 짧게 자른 머리에 깃발을 높이 들고, 말 위에서도 칼 위에서도 사내들보다 앞섰다. 적의 손에 넘어가 마녀로 몰렸으나 불길 앞에서도 고개를 숙이지 않았다. 고맙다는 말을 하는 데에는 서툴다.' };
  m.tale = true; m.legend = true; m.fame = 0; m.wage = 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
})(window.G = window.G || {});
