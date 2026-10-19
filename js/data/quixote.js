/* 라 만차의 돈키호테와 산초 판사 — 무급 항해사 두 사람 (만나는 일은 js/systems/quixote.js). 2026-10-19
   · 톨레도에 들어서면 라 만차 들판의 풍차에 돌격하는 늙은 기사와 당나귀 탄 종자를 만난다 → 산티아고 순례에 함께해 달라고 청한다
   · 프랑스 길의 두 성소(투르의 생마르탱 · 툴루즈의 생세르냉)를 들른 뒤 라코루냐(산티아고 데 콤포스텔라)에 이르면 둘이 무급 항해사로 합류한다
   그림: images/portraits/legendary/don_quixote(.webp · _half.webp) · sancho_panza. 장면 그림은 images/legend-events/quixote_*.webp
   항해사 한 사람의 꼴은 js/data/people.js 의 G.MATES 와 같다 (st = [힘, 지력, 무력, 매력], lg = {말 번호: 단계}). */
(function (G) {
  'use strict';
  var L = [
    { id: 'don_quixote', name: '돈키호테', full: '라 만차의 돈키호테', g: 'm', style: 'ib', role: 'soldier', tone: 'rush', pic: 'don_quixote',
      st: [58, 76, 72, 60], sk: { sword: 3, speech: 3, hist: 3, theo: 1 }, skBoost: 1, lg: { 0: 3, 1: 2, 2: 2 },
      desc: '기사도 이야기책을 밤낮으로 읽다가 스스로 편력 기사가 된 라 만차의 시골 귀족. 이발사의 놋대야를 「맘브리노의 투구」라 부르며 쓰고, 뼈만 남은 말 로시난테를 탄다. 풍차를 거인으로, 주막을 성으로 보지만, 약한 이를 보면 물러서는 법이 없고 기사도와 옛 역사를 이야기하면 학자도 고개를 숙인다. 그의 연설 한 자락에 선원들의 눈이 젖는다.' },
    { id: 'sancho_panza', name: '산초 판사', g: 'm', style: 'ib', role: 'keeper', tone: 'merch', pic: 'sancho_panza',
      st: [74, 54, 44, 78], sk: { cook: 2, acct: 2, ops: 1, speech: 1, gun: 3 }, skBoost: 1, lg: { 0: 3 },
      desc: '돈키호테의 종자. 「섬 하나를 다스리게 해 주겠다」는 약속을 믿고 잿빛 당나귀를 타고 따라나선 라 만차의 농사꾼. 배가 고프면 아무것도 못 하는 사람답게 어디서든 먹을거리를 구해 오고, 셈이 밝아 장사꾼에게 속는 법이 없다. 입만 열면 속담이 줄줄 나오는데, 엉뚱한 듯 그 말이 늘 옳다. 들판에서 돌팔매로 까마귀를 떨어뜨리던 눈썰미 덕에, 대포를 맡기면 「겁나서 빨리 맞혀야 한다」며 누구보다 잘 맞힌다.' }
  ];
  G.QUIXOTE = L.map(function (m) { return m.id; });
  L.forEach(function (m) {
    m.tale = true; m.fame = 0; m.wage = 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });
})(window.G = window.G || {});
