/* 심청 — 공양미 삼백 석의 효녀, 무급 항해사 (만나는 일은 js/systems/simcheong.js). 2026-10-19 사용자 요청
   · 쌀 300을 교역품으로 싣고 조선의 항구(한양·동래·한산도)에 들어서면, 인당수 제물로 몸을 판 그녀를 만난다
   · 쌀 300으로 남경 뱃사람들과의 약조를 풀어 주면 품삯 없이 합류한다
   · 요리·음악·세공·항해·운용·웅변·회계 3단계, 조선어·일본어 능숙
   그림: images/portraits/legendary/simcheong(.webp · _half.webp) · 장면 images/legend-events/simcheong_*.webp — Codex
   항해사 한 사람의 꼴은 js/data/people.js 의 G.MATES 와 같다 (st = [힘, 지력, 무력, 매력], lg = {말 번호: 단계}). */
(function (G) {
  'use strict';
  var m = { id: 'simcheong', name: '심청', g: 'f', style: 'kr', role: 'maid', tone: 'polite', pic: 'simcheong',
    st: [46, 78, 38, 94], sk: { cook: 3, music: 3, craft: 3, nav: 3, ops: 3, speech: 3, acct: 3 }, skBoost: 1, lg: { 14: 3, 13: 3 },
    desc: '황주 도화동 심 봉사의 외동딸. 젖동냥으로 자라 열다섯에 앞 못 보는 아버지를 홀로 봉양했다. 삯바느질과 길쌈으로 끼니를 잇던 손끝이 야무지고, 부엌일과 셈에 빈틈이 없으며, 그녀가 부르는 노래에는 장터 사람들이 발걸음을 멈춘다. 포구에서 뱃사람들 틈에 자라 물때와 바람을 읽을 줄 알고, 왜관을 드나드는 상인들에게서 일본 말도 익혔다. 아버지의 눈을 뜨게 하려고 공양미 삼백 석에 제 몸을 인당수 제물로 팔았던 효녀.' };
  m.tale = true; m.fame = 0; m.wage = 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic;
  G.SIMCHEONG = m.id;
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
})(window.G = window.G || {});
