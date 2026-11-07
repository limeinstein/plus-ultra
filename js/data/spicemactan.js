/* 향료제도와 막탄 — 세랑의 편지·보키 나이라·막탄의 새벽 (사건: js/systems/spicemactan.js) 2026-11-07 사용자 요청
   「1512 포르투갈 원정대의 향료제도 진입 · 1521 막탄 전투와 마젤란의 죽음 — 플레이어와 관계되는 미형 인물 등장」
   (1511 말라카 점령은 js/systems/goamalacca.js · 1527 막 왕조 · 1527 자야카르타 · 1528 조호르는 다른 묶음)
   ■ 사람 (G.HIST_FIG): 안토니우 드 아브레우 · 프란시스쿠 세랑 · 주앙 세랑 · 마가야네스(1521, 마흔 줄) · 술탄 바얀 시룰라 · 티도레의 사신 ·
       라자 후마본 · 안토니오 피가페타 · 두아르테 바르보자 · 거북섬의 해적(지어낸 인물)
     라푸라푸(h_lapulapu)와 엔리케 데 말라카(h_enrique)는 원래 있던 지역 사람 동료 (js/data/regionfolk.js)
   ■ 동료 둘 (사건으로만 — eventOnly)
     · 보키 나이라(sm_naira) — 테르나테 술탄의 조카딸(「보키」는 테르나테 왕실 여인의 칭호). 세랑의 통역 (지어낸 인물 · 여자 어른 — 연애도 된다)
     · 불란(sm_bulan) — 막탄의 젊은 전사, 라푸라푸의 조카. 온몸의 문신이 싸움의 이력이다 (지어낸 인물 · 연애 없음 — 바다와 혼인한 사람 wed:'sea')
   ■ 소지품: 세랑의 편지(sm_letter — 팔 수 없다) · 테르나테의 정향 가지(sm_clove) · 막탄의 대나무 창(sm_spear)
   ■ 얼굴: images/portraits/mates/sm_*.webp · _half.webp (없으면 코드 초상) — 개발노트의 그림 주문 */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('sm_abreu', { name: '안토니우 드 아브레우', title: '향료제도로 가는 포르투갈 함대의 대장', st: 'ib', role: 'captain', born: 1480, look: '30대, 볕에 그은 얼굴, 짧게 깎은 수염, 낡은 붉은 비단 조끼, 해도를 만 손' });
  fig('sm_serrao', { name: '프란시스쿠 세랑', title: '아브레우 함대의 선장 · 마가야네스의 벗', st: 'ib', role: 'captain', born: 1480, look: '30대, 덥수룩한 갈색 수염, 웃음 많은 눈가의 주름, 바닷물에 바랜 셔츠, 목에 건 작은 십자가' });
  fig('sm_joao', { name: '주앙 세랑', title: '마가야네스 함대의 선장 · 프란시스쿠 세랑의 아우', st: 'ib', role: 'captain', born: 1485, look: '30대 중반, 형을 닮은 갈색 수염, 단정한 가죽 조끼, 걱정 많은 이마' });
  fig('sm_magellan', { name: '페르난도 데 마가야네스', title: '카스티야 왕의 함대 사령관', st: 'ib', role: 'captain', born: 1480, look: '마흔 줄, 희끗한 검은 수염, 오래된 상처로 저는 다리, 녹슨 흉갑, 굳게 다문 입과 지친 눈' });
  fig('sm_bayan', { name: '술탄 바얀 시룰라', title: '테르나테의 술탄', st: 'se', role: 'noble', born: 1470, look: '40대, 흰 터번과 금실 두른 비단 저고리, 허리에 찬 물결무늬 크리스, 정향 냄새 나는 수염' });
  fig('sm_tidore', { name: '티도레의 사신', title: '티도레 술탄 알만수르가 보낸 사람', st: 'se', role: 'official', born: 1480, fiction: true, look: '40대, 붉은 머릿수건, 금 귀고리, 노 젓는 사내 서른을 거느린 코라코라 배의 뱃머리에 선 사내' });
  fig('sm_pirate', { name: '거북섬의 해적 두목', title: '반다 바다의 해적', st: 'se', role: 'sailor', born: 1480, fiction: true, look: '30대, 맨몸에 쇠고리 목걸이, 이가 빠진 웃음, 대나무 장대 끝에 맨 칼' });
  fig('sm_humabon', { name: '라자 후마본', title: '세부(수그부)의 왕 · 세례명 카를로스', st: 'se', role: 'noble', born: 1475, look: '40대, 몸을 덮은 문신, 금 귀고리와 금 이, 무명 머릿수건, 목에 새로 건 나무 십자가' });
  fig('sm_pigafetta', { name: '안토니오 피가페타', title: '함대의 기록자 · 비첸차 사람', st: 'it', role: 'scholar', born: 1491, look: '20대 후반, 마른 몸, 펜과 젖은 공책, 놀란 듯 크게 뜬 눈' });
  fig('sm_barbosa', { name: '두아르테 바르보자', title: '마가야네스의 처남 · 함대의 선장', st: 'ib', role: 'captain', born: 1480, look: '40대, 붉은 얼굴, 술에 젖은 수염, 거만하게 치켜든 턱' });
  G.SPICEMACTAN_FIGS = ['sm_abreu', 'sm_serrao', 'sm_joao', 'sm_magellan', 'sm_bayan', 'sm_tidore', 'sm_pirate', 'sm_humabon', 'sm_pigafetta', 'sm_barbosa'];

  // ── 동료 (사건으로만)
  function mate(o) {
    o.tale = true; o.legend = true; o.fame = 0; o.wage = 0; o.reg = []; o.eventOnly = true;
    o.face = 'portraits/mates/' + o.id;
    if (G.MATES && G.MATE && !G.MATE[o.id]) { G.MATES.push(o); G.MATE[o.id] = o; }
  }
  mate({ id: 'sm_naira', name: '보키 나이라', g: 'f', style: 'se', role: 'scholar', tone: 'polite', age: 'young', st: [48, 84, 46, 94], sk: { speech: 3, acct: 1, nav: 1, survey: 1 }, lg: { 12: 3, 1: 2 }, y: [1512, 1570],
    desc: '테르나테 술탄 바얀 시룰라의 조카딸. 「보키」는 테르나테 왕실 여인을 부르는 말이다. 구릿빛 매끈한 살결에 숯처럼 검고 긴 눈썹, 웃으면 눈꼬리가 초승달처럼 휘고, 허리까지 내려오는 머리를 정향 꽃봉오리를 꿴 금실로 묶는다. 말레이 말과 자와 말, 그리고 프란시스쿠 세랑에게 배운 포르투갈 말을 섞어 쓴다. 가말라마 화산의 정향나무 숲을 손바닥처럼 아는 사람.' });
  mate({ id: 'sm_bulan', name: '불란', g: 'm', style: 'se', role: 'soldier', tone: 'noble', age: 'young', st: [84, 62, 82, 90], sk: { sword: 3, nav: 1, ops: 1, survey: 1 }, lg: { 12: 3 }, y: [1515, 1570], wed: 'sea',
    desc: '막탄섬의 젊은 전사, 라푸라푸의 조카. 「불란」은 비사야 말로 「달」이다. 긴 머리를 붉은 천으로 묶고, 어깨에서 손목까지 싸움마다 하나씩 새긴 문신이 물결처럼 흐른다. 오뚝한 코에 깊은 눈, 웃으면 금으로 박은 앞니가 반짝 — 세부의 아낙들이 그를 보려고 일부러 막탄 나루까지 물을 길으러 온다고 한다. 그러나 그의 눈은 늘 수평선에 있다. 「나는 바다에 장가들었소.」' });

  // 엔리케 데 말라카(h_enrique): 1521년 세부의 잔치 뒤 제독의 배에 오르면 1521년에 사라지지 않는다 (js/systems/spicemactan.js의 setup)

  // ── 소지품
  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'sm_letter', name: '세랑의 편지', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1512년 테르나테에서 프란시스쿠 세랑이 벗 마가야네스에게 쓴 편지. 「나는 여기서 바스쿠 다 가마가 찾은 것보다 더 크고 더 부유한 새 세상을 찾았네.」 정향 냄새가 밴 종이에 밀랍으로 봉했다. 팔 수 없다.' });
    add({ id: 'sm_clove', name: '테르나테의 정향 가지', kind: 'special', price: 0, reg: [], rare: true,
      desc: '가말라마 화산 중턱, 보키 나이라가 「할머니의 할머니가 심은 나무」라 부르는 정향나무에서 꺾은 꽃봉오리 가지. 붉은 봉오리가 마르면서 못 모양이 된다. 그래서 정향(丁香)이다.' });
    add({ id: 'sm_spear', name: '막탄의 대나무 창', kind: 'special', price: 0, reg: [], rare: true,
      desc: '1521년 4월 27일, 막탄의 얕은 여울에서 쓰인 대나무 창. 끝을 불에 그슬려 단단하게 했다. 불란이 「우리 바다를 지킨 것」이라며 건넸다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.spicemactan = G.BALANCE.spicemactan || {
    nutmeg: { n: 30, k: 0.35 },          // ② 반다의 육두구 — 오랑 카야에게 n통까지 시세의 k배로
    clove: { n: 30, k: 0.4 },            // ③ 테르나테의 정향 — 나이라가 이어 준 값
    letterGold: 800,                     // ④ 편지를 받은 마가야네스의 답례
    foe: { pirate: 12, tidore: 14, mactan: 40, landing: 22, beach: 18 },
    fame: { abreu: 40, castaway: 100, hitu: 80, clove: 60, letter: 120, mactan: 160, bulan: 140, naira: 160, enrique: 100 }
  };
})(window.G = window.G || {});
