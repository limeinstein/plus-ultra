/* 미남 항해사 — 유럽 (사건: js/systems/beauxeu.js) 2026-11-05 사용자 요청 「미남 항해사가 나오는 형태로 이벤트를 추가해줘」
   답: 새 이벤트 · 연애 없이 동료로만 (여자 제독이어도) · 유럽·지중해
   ■ 동료 (사건으로만 — eventOnly · 연애 없음 — wed: 'sea'):
     · 토마소(bx_tommaso) — 리보르노 어부의 아들. 피렌체 대성당 작업장에서 미켈란젤로의 「다비드」 모델로 섰다 (지어낸 인물)
     · 로렌초(bx_lorenzo) — 레판토에서 노를 저은 베네치아의 곤돌라꾼. 카니발에서 가장 잘생긴 사내 (지어낸 인물)
   ■ 사람 (G.HIST_FIG): 대성당 작업장 감독 · 피렌체의 돌팔매 패 대장 · 가면 장인 · 「밤의 나리」 순라 · 곤돌라꾼 주세페
     미켈란젤로는 원래 있던 동료 정의(G.MATE.michelangelo — 얼굴 portraits/mates/michelangelo)를 대화에 세운다
   ■ 소지품: 다비드의 돌가루(bx_marble) · 금박 모레타 가면(bx_mask) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('bx_overseer', { name: '작업장 감독', title: '피렌체 대성당 작업장(오페라 델 두오모)의 감독', st: 'it', role: 'official', born: 1460, fiction: true, look: '40대, 대리석 가루가 묻은 검은 외투, 장부를 든 손' });
  fig('bx_slinger', { name: '돌팔매 패 대장', title: '메디치 편 젊은이들의 우두머리', st: 'it', role: 'soldier', born: 1484, fiction: true, look: '스무 살, 붉은 두건, 허리에 찬 가죽 돌팔매, 비웃는 입' });
  fig('bx_maskmaker', { name: '가면 장인 체칠리아', title: '산 마르코 골목의 가면 공방 주인', st: 'it', role: 'merchant', g: 'f', born: 1530, fiction: true, look: '40대, 금박 가루가 묻은 손가락, 반쯤 쓴 하얀 바우타 가면' });
  fig('bx_notte', { name: '「밤의 나리」', title: '베네치아의 밤 순라 (시뇨리 디 노테)', st: 'it', role: 'official', born: 1535, fiction: true, look: '30대, 검은 망토에 등불, 의심 많은 눈' });
  fig('bx_giuseppe', { name: '곤돌라꾼 주세페', title: '리알토 나루의 곤돌라꾼', st: 'it', role: 'sailor', born: 1545, fiction: true, look: '30대, 굵은 팔뚝, 시샘 어린 눈, 소매 속에 숨긴 칼' });
  G.BEAUXEU_FIGS = ['bx_overseer', 'bx_slinger', 'bx_maskmaker', 'bx_notte', 'bx_giuseppe'];

  // ── 동료 (사건으로만 · 연애 없음)
  function mate(o) {
    o.tale = true; o.legend = true; o.fame = 0; o.wage = 0; o.reg = []; o.eventOnly = true;
    o.wed = 'sea';   // 연애 없음 — 바다와 혼인한 사람 (js/systems/romance.js · js/city/matetalk.js 가 d.wed 를 「이미 짝이 있다」로 본다)
    if (G.MATES && G.MATE && !G.MATE[o.id]) { G.MATES.push(o); G.MATE[o.id] = o; }
  }
  mate({ id: 'bx_tommaso', name: '토마소', g: 'm', style: 'it', role: 'sailor', tone: 'warm', age: 'young', st: [78, 58, 70, 86], sk: { nav: 2, ship: 1, craft: 2, sword: 1 }, lg: { 2: 3 }, y: [1501, 1560],
    desc: '리보르노 어부의 아들. 곱슬곱슬한 머리, 곧은 콧날, 바다를 보는 깊은 눈 — 미켈란젤로가 「돌 속에 이미 있던 얼굴」이라며 거인상의 모델로 세운 청년이다. 몇 달 동안 돌팔매를 어깨에 걸치고 서 있었다. 그물을 깁던 손으로 돛줄도 잘 맨다.' });
  mate({ id: 'bx_lorenzo', name: '로렌초', g: 'm', style: 'it', role: 'sailor', tone: 'charm', age: 'young', st: [74, 64, 76, 90], sk: { nav: 3, sword: 2, speech: 1 }, lg: { 2: 3, 5: 1 }, y: [1572, 1620],
    desc: '베네치아의 곤돌라꾼. 검은 머리를 뒤로 묶고, 왼쪽 눈썹 위에 레판토에서 얻은 흉터가 있다. 카니발 밤마다 그의 곤돌라를 타려는 가면 쓴 손님들이 리알토 나루에 줄을 섰다. 노 하나로 좁은 운하를 바람처럼 빠져나간다.' });

  // ── 소지품
  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'bx_marble', name: '다비드의 돌가루', kind: 'special', price: 0, reg: [], rare: true,
      desc: '거인상을 깎던 작업장 바닥에서 토마소가 쓸어 담은 카라라 대리석 가루 한 줌. 「제 얼굴 부스러기예요」라며 웃었다.' });
    add({ id: 'bx_mask', name: '금박 모레타 가면', kind: 'special', price: 0, reg: [], rare: true,
      desc: '카니발의 밤에 사라졌다가 되찾은 가면 장인 체칠리아의 걸작. 검은 벨벳 위에 금박을 입혔다. 장인이 「도둑을 잡아 준 값」이라며 주었다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.beauxEU = G.BALANCE.beauxEU || {
    tommaso: { from: 15010913, to: 15040513, moveFrom: 15040514, moveTo: 15040908, foe: 10 },   // 거인을 깎는 동안 · 광장으로 옮기는 넉 달
    lorenzo: { from: 1572, to: 1599, months: [1, 2], chase: 0.55, foe: 8 },                       // 카니발(1~2월)
    fame: { yard: 40, giant: 120, mask: 100 }
  };
})(window.G = window.G || {});
