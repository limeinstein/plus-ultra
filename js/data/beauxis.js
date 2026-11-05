/* 미남 항해사 — 인도양·신대륙 (사건: js/systems/beauxis.js) 2026-11-05 사용자 요청 「미남 항해사가 나오는 형태로 이벤트를 추가해줘」
   연애는 없이 동료로만 — 여자 제독이어도 썸·청혼 대상이 아니다 (wed: 'sea' — js/systems/romance.js · js/city/matetalk.js 가 d.wed를 본다)
   ■ 동료 (사건으로만 — eventOnly):
     · 사이드(bx_said) — 아라비아의 큰 길잡이 아흐마드 이븐 마지드의 손자 (지어낸 인물). 말린디 부두에서 별을 읽는다
     · 와이나(bx_wayna) — 툼베스의 발사 뗏목 선장 (지어낸 인물). 1526년 바르톨로메 루이스가 붙잡은 뗏목의 사공
     얼굴: images/portraits/mates/bx_said(_half).webp · bx_wayna(_half).webp (없으면 코드 초상)
   ■ 사람 (G.HIST_FIG): 포르투갈 선장 · 말린디의 늙은 사공 · 루이스의 갑판장 · 툼베스의 쿠라카
   ■ 소지품: 『이로움의 책』 사본(bx_fawaid) · 과라 판자(bx_guara) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('bx_pt', { name: '포르투갈 선장', title: '인도로 가는 함대의 선장', st: 'ib', role: 'captain', born: 1470, fiction: true, look: '40대, 검은 수염, 붉은 십자가 망토, 허리에 칼과 권총' });
  fig('bx_oldman', { name: '말린디의 늙은 사공', title: '부두에서 그물을 깁는 노인', st: 'sw', role: 'sailor', born: 1440, fiction: true, look: '70대, 흰 수염, 칸주(흰 긴 옷), 굵은 손마디' });
  fig('bx_bosun', { name: '루이스의 갑판장', title: '바르톨로메 루이스 배의 갑판장', st: 'ib', role: 'sailor', born: 1490, fiction: true, look: '30대, 햇볕에 그을린 얼굴, 쇠사슬 열쇠 꾸러미' });
  fig('bx_curaca', { name: '툼베스의 쿠라카', title: '툼베스의 우두머리', st: 'an', role: 'noble', born: 1475, fiction: true, look: '50대, 금 귀마개, 무늬 놓은 무명 망토, 근엄한 얼굴' });
  G.BEAUXIS_FIGS = ['bx_pt', 'bx_oldman', 'bx_bosun', 'bx_curaca'];

  // ── 동료 (사건으로만) — 연애 없음: 바다와 혼인한 사람 (wed: 'sea')
  function mate(o) {
    o.tale = true; o.legend = true; o.fame = 0; o.wage = 0; o.reg = []; o.eventOnly = true;
    o.wed = 'sea';   // 연애 없음 — 바다와 혼인한 사람 (부하끼리의 썸·제독의 청혼 대상이 아니다)
    if (G.MATES && G.MATE && !G.MATE[o.id]) { G.MATES.push(o); G.MATE[o.id] = o; }
  }
  mate({ id: 'bx_said', name: '사이드', g: 'm', style: 'is', role: 'sailor', tone: 'noble', age: 'young', st: [66, 84, 58, 92], sk: { nav: 3, survey: 2, ship: 1 }, skBoost: 1, lg: { 5: 3, 8: 1, 6: 1 }, y: [1498, 1560],
    desc: '아라비아 바다의 큰 길잡이 아흐마드 이븐 마지드의 손자. 오만의 줄파르에서 나서 할아버지의 배에서 자랐다. 햇볕에 그을린 매끈한 얼굴, 숯처럼 검은 눈썹 아래 깊은 눈, 흰 터번 아래로 흘러내린 검은 머리 — 말린디 부두에 앉아 있으면 그물 깁던 아낙들이 손을 멈춘다. 그러나 그가 보는 것은 언제나 별뿐이다. 카말 판 하나로 북극성의 높이를 재어 바다 위 자리를 맞힌다.' });
  mate({ id: 'bx_wayna', name: '와이나', g: 'm', style: 'an', role: 'sailor', tone: 'shonen', age: 'young', st: [80, 66, 64, 88], sk: { nav: 2, ship: 2, survey: 1, sword: 1 }, skBoost: 1, lg: { 11: 3 }, y: [1526, 1580],
    desc: '툼베스의 발사 뗏목 선장. 「와이나」는 케추아 말로 「젊은이」라는 뜻이다. 구릿빛 넓은 어깨, 바닷바람에 거칠어졌어도 단정한 이목구비, 웃으면 하얀 이가 먼저 보이는 사내 — 툼베스 해변에서 그가 돛을 올리면 마을 사람들이 구경을 나온다. 무명 돛과 뗏목 틈에 꽂는 판자(과라)만으로 바람을 거슬러 간다.' });

  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'bx_fawaid', name: '『이로움의 책』 사본', kind: 'special', price: 0, reg: [], rare: true,
      desc: '아흐마드 이븐 마지드가 1490년 무렵 쓴 항해서 『키타브 알파와이드』를 손자 사이드가 베낀 것. 별자리 스물여덟 집, 계절풍의 달력, 홍해에서 말라카까지의 뱃길이 적혀 있다.' });
    add({ id: 'bx_guara', name: '과라 판자', kind: 'special', price: 0, reg: [], rare: true,
      desc: '발사 뗏목의 통나무 틈에 꽂았다 뺐다 하며 방향을 잡는 단단한 나무 판자. 와이나가 「뱃머리 쪽을 내리면 바람을 비켜 가고, 꼬리 쪽을 내리면 바람을 안는다」며 깎아 준 것.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.beauxIS = G.BALANCE.beauxIS || {
    bribe: 600,               // 사이드: 포르투갈 선원을 매수 · 와이나: 갑판장을 매수
    foe: { pt: 14, ship: 12 },
    fame: { said: 120, wayna: 120, quiz: 40 }
  };
})(window.G = window.G || {});
