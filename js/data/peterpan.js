/* 피터 팬 — 어른이 되지 않는 소년 (만나는 일은 js/systems/peterpan.js). 2026-10-20 사용자 요청
   · 자녀(견습으로 배에 탄 어른이 되기 전의 아들·딸)를 데리고 스코틀랜드의 작은 섬에 상륙하면 아이가 그를 찾아 사라진다.
     그 섬에서 야영하며 약초를 캐면 그가 아이를 데리고 찾아와 돌려주고, 「이 섬을 나갈 수 있다면 어디든 좋다」며 따라온다.
   · 검술·항해·측량 3, 음악 2 · 품삯을 받지 않는다(wage 0)
   · 그림: images/portraits/legendary/peter_pan.webp (흉상) · peter_pan_half.webp (무릎상)
     지금 것은 임시 그림이다 — Codex로 그린 그림을 같은 이름으로 덮어쓰면 그대로 바뀐다 (프롬프트: images/legend-events/PETER_PAN_PROMPT.md)
     J. M. 배리의 희곡(1904)·소설(1911)에 나오는 모습만 쓰고, 뒤에 나온 영화의 옷차림(초록 쫄쫄이·붉은 깃털 모자)은 쓰지 않는다. */
(function (G) {
  'use strict';
  var m = { id: 'peter_pan', name: '피터 팬', g: 'm', style: 'ne', role: 'sailor', tone: 'shonen', pic: 'peter_pan', age: 'young',
    st: [56, 60, 82, 90], sk: { sword: 3, nav: 3, survey: 3, music: 2 }, skBoost: 1, lg: { 3: 3 },   // skBoost: 정해 준 능력 그대로 · 게르만어(스코틀랜드·잉글랜드 말)
    desc: '어른이 되기 싫어 태어난 날 밤 창문으로 달아났다는 소년. 스코틀랜드 서쪽 작은 섬의 바위 굴에서 혼자 살았다. 이가 아직 젖니 그대로이고, 기분이 좋으면 수탉처럼 「꼬끼오」 하고 운다. 바람을 타고 나는 법을 알아 높은 데서 별을 보고 길을 찾고, 섬의 물길과 여울을 손바닥처럼 꿴다. 해적과 칼싸움하는 것이 세상에서 제일 재미있다고 하며, 갈대 피리를 불면 바닷새들이 모여든다. 어른은 싫어하지만, 아이를 찾으러 섬 끝까지 온 제독만은 예외라고 한다.' };
  m.tale = true; m.legend = true; m.fame = 0; m.wage = 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
})(window.G = window.G || {});
