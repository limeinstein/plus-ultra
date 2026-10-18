/* 옛이야기의 아가씨들 — 무급 항해사 네 사람 (만나는 일은 js/systems/fairytales.js). 2026-10-12
   · 신데렐라: 유리를 싣고, 세공에 밝은 사람(제독이나 부하)을 데리고 프랑스 도시 근처 숲을 돌아다니면 만난다 — 유리 한 통으로 유리 구두를 지어 주면 합류
   · 백설공주: 부하가 남자만 꼭 여섯 명일 때(제독까지 일곱) 프랑스 도시 근처 숲을 돌아다니면 사냥꾼에게 쫓기는 그녀를 만난다 — 일기토로 구하면 합류
   · 잠자는 숲속의 공주: 의학에 밝은 사람이 있고 용·드래곤을 찾은 뒤 독일 숲에서 야영하면 — 깨우고, 물레 가락에 찔린 상처를 치료하면 「운명」이라며 합류
   · 인어공주: 덴마크의 섬에 상륙해 사냥하면 걸음이 서툰 그녀를 만난다 — 음악·항해·측량·운용에 밝고 세공을 조금 한다. 돌보기로 하면 합류
     사람의 말을 하나도 모른다(lg 없음): 한배 사람들에게서 말을 익히기 전에는(js/systems/cabins.js) 하는 말이 모두 몸짓으로 나온다 (G.Tale.mime)
   네 사람 모두 품삯을 받지 않는다(wage 0). 넷을 모두 들이면 업적 「Once Upon a Time」, 넷 모두와 혼인하면 「Happily Ever After」.
   그림: images/portraits/legendary/<그림>.webp (흉상) · _half.webp (무릎상) — Codex. 인어공주는 다리가 생긴 모습(little_mermaid_legs). */
(function (G) {
  'use strict';
  var L = [
    { id: 'cinderella', name: '신데렐라', g: 'f', style: 'ne', role: 'maid', tone: 'polite', pic: 'cinderella',
      st: [46, 68, 40, 92], sk: { cook: 2, ops: 2, music: 1 }, lg: { 2: 3, 3: 1 },
      desc: '재투성이라 불리며 새어머니와 언니들의 집안일을 도맡던 아가씨. 부엌일과 살림에 빈틈이 없고, 누구에게도 모진 말을 하지 않는다. 무도회 옷을 입은 채 숲에서 만난 그날의 유리 구두 한 켤레를 소중히 간직한다.' },
    { id: 'snow_white', name: '백설공주', g: 'f', style: 'ne', role: 'noble', tone: 'cute', pic: 'snow_white',
      st: [42, 70, 38, 95], sk: { cook: 3, craft: 3, music: 3, speech: 3, acct: 3 }, skBoost: 1, lg: { 3: 3, 2: 2 },
      desc: '눈처럼 흰 살결과 흑단 같은 머리의 공주. 새어머니의 사냥꾼에게 쫓겨 숲으로 달아났다. 일곱 사내와 한 지붕 아래 사는 데 익숙해, 사내들 틈에서도 금세 살림을 쥐고 야무진 말솜씨로 모두를 부린다. 광부 일곱의 오두막에서 보석 다듬는 법과 장부 셈을 배웠고, 숲의 새들과 함께 부르는 노래는 사나운 뱃사람도 잠잠하게 한다.' },
    { id: 'sleeping_beauty', name: '잠자는 숲속의 공주', short: '들장미 공주', g: 'f', style: 'ne', role: 'noble', tone: 'plain', pic: 'sleeping_beauty',
      st: [40, 76, 36, 94], sk: { music: 2, art: 2, hist: 1 }, lg: { 3: 3, 2: 3, 0: 1 },
      desc: '물레 가락에 찔려 백 년을 잠들었다는 숲속 성의 공주. 깨어난 세상은 그녀가 알던 세상보다 백 년쯤 늙어 있었다. 요정들의 축복으로 노래와 그림에 뛰어나고, 옛 왕가의 일을 누구보다 잘 안다.' },
    { id: 'little_mermaid', name: '인어공주', g: 'f', style: 'ne', role: 'maid', tone: 'cute', pic: 'little_mermaid_legs', mute: true,
      st: [50, 72, 44, 96], sk: { music: 3, nav: 3, survey: 3, ops: 3, craft: 1 }, skBoost: 1, lg: {},
      desc: '바다 마녀에게 목소리를 주고 다리를 얻은 바다 왕의 막내딸. 말을 하지 못하고 뭍의 걸음은 아직 서툴지만, 물살과 바람과 바닷속 지형은 누구보다 잘 알고, 밧줄과 돛을 다루는 손이 빠르다. 목소리는 잃었어도 조개 하프를 뜯고 춤을 추면 선원들이 넋을 잃고, 산호와 조개로 작은 장신구를 엮는다. 사람의 말은 한마디도 모른다 — 한배 사람들에게서 말을 배우기 전까지는 손짓과 몸짓으로만 뜻을 전한다.' }
  ];
  G.FAIRY = L.map(function (m) { return m.id; });
  L.forEach(function (m) {
    m.tale = true; m.fairy = true; m.fame = 0; m.wage = 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });
})(window.G = window.G || {});
