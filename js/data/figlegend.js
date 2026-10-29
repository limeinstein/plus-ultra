/* 전설의 선수상 (2026-10-29 사용자 요청 「선수상의 효과를 명확히 하고 전설의 선수상을 만들어줘」)
   - 전설의 바다 괴물을 무찌르면 그 괴물이 지키던(또는 그 몸에서 나온) 선수상이 떠오른다 — 한 판에 하나씩, 다시 나오지 않는다 (js/systems/figfx.js FX.afterMonster)
   - 소지품으로 들어오고, 조선소 「개조 → 선수상」에서 품삯 150닢에 단다. 배를 팔거나 파기하면 소지품으로 돌려받는다
   - 보통 덕(spd·hp·luck·storm·monster·morale·battle)이 크고, 저마다 다른 선수상에 없는 「전설의 힘」(sp) 하나가 있다 — 효과 글은 js/systems/figfx.js
   - 마왕상만은 저주가 깃들어 있다: 성스러운 선수상(holy — 천사상·바다의 별 성모상·대천사 미카엘상·성 니콜라스상)이 함대에 있으면 저주가 막힌다
   - 그림은 따로 없다 — 그 괴물의 발견 그림으로 보인다 (js/core/images.js K.item)
   글은 이 게임을 위해 새로 썼다. */
(function (G) {
  'use strict';
  if (!G.FIGUREHEADS || !G.FIGUREHEAD) return;
  // 성스러운 선수상: 함대의 저주를 막는다
  ['angel', 'michael', 'stnicholas', 'stellamaris'].forEach(function (id) { if (G.FIGUREHEAD[id]) G.FIGUREHEAD[id].holy = true; });

  // [id, 이름, 지키던 괴물(G.SEA_MONSTERS), 값, 덕, 전설의 힘, 설명]
  var LIST = [
    ['seagod', '해신상', 'leviathan', 12000, { spd: 0.06, storm: 0.2, monster: 0.5 }, ['calm'],
      '불을 뿜던 레비아탄이 가라앉은 자리에서 떠오른, 삼지창을 든 바다신의 상. 그 뱃속에서 몇백 년을 견디고도 비늘 자국 하나 없다.'],
    ['goddess', '바다의 여신상', 'bakunawa', 9000, { luck: 0.1, storm: 0.15, morale: 0.1 }, ['guard'],
      '달을 삼키던 바쿠나와가 쓰러지자 그 입에서 달빛과 함께 흘러나온 여신상. 두 팔로 뱃사람을 감싸 안는 모습이다.'],
    ['zarashell', '자라탄 등딱지 선수상', 'zaratan', 10000, { hp: 0.16, storm: 0.06 }, ['regen'],
      '섬인 줄 알고 내렸던 거대한 거북 자라탄의 등딱지 한 조각을 깎은 상. 금이 가도 며칠이면 저절로 아물어 있다.'],
    ['jormring', '요르문간드 고리 선수상', 'jormungandr', 11000, { monster: 0.35, storm: 0.08, luck: 0.05 }, ['oracle'],
      '세상을 한 바퀴 감고 제 꼬리를 문 뱀, 요르문간드의 비늘로 엮은 고리 모양 상. 온 바다를 감던 뱀이라 먼 바다의 일을 속삭인다고 한다.'],
    ['isonadetail', '이소나데 꼬리 선수상', 'isonade', 9500, { spd: 0.08, battle: 0.04 }, ['wake'],
      '갈고리 꼬리로 배를 끌어 가던 일본 바다의 괴물 이소나데의 꼬리지느러미를 단 상. 이제는 함대 전체를 앞으로 끌어 준다.'],
    ['cipactooth', '시팍틀리 이빨 선수상', 'cipactli', 10500, { battle: 0.14, morale: 0.04 }, ['terror'],
      '마디마다 입이 달렸다는 태초의 악어 시팍틀리의 이빨을 줄줄이 박은 상. 적 포수들이 그 이빨을 보면 손이 떨린다.'],
    ['demon', '마왕상', 'ghost-ship', 6000, { battle: 0.2, morale: -0.1 }, ['curse'],
      '유령선의 뱃머리에 붙어 있던 뿔 달린 상. 무서운 힘을 주지만 저주가 깃들어 있다 — 성스러운 선수상과 함께라야 다스릴 수 있다.']
  ];
  G.FIG_LEGENDS = [];
  LIST.forEach(function (x) {
    var f = G.FIGUREHEAD[x[0]];
    if (!f) { f = { id: x[0] }; G.FIGUREHEADS.push(f); G.FIGUREHEAD[x[0]] = f; }
    ['spd', 'hp', 'luck', 'storm', 'monster', 'morale', 'battle', 'curse'].forEach(function (k) { delete f[k]; });
    f.name = x[1]; f.src = x[2]; f.price = x[3]; f.desc = x[6];
    for (var k in x[4]) f[k] = x[4][k];
    f.sp = x[5].slice(); f.rare = true; f.legend = true;
    if (f.sp.indexOf('curse') >= 0) f.curse = true;
    G.FIG_LEGENDS.push(f.id);
    // 소지품으로도 들고 다닌다 (kind 'fig')
    if (G.ITEMS && G.ITEM && !G.ITEM[f.id]) {
      var it = { id: f.id, name: f.name, kind: 'fig', price: f.price, rare: true, legend: true, reg: [], desc: f.desc };
      G.ITEMS.push(it); G.ITEM[f.id] = it;
    }
  });
})(window.G = window.G || {});
