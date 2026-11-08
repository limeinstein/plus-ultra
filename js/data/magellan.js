/* 마가야네스(마젤란)의 세계 일주 — 사람·동료·소지품·조정값 (사건: js/systems/magellan.js) 2026-11-08 사용자 요청
   「마젤란의 세계 일주 이벤트를 만들어줘. 중간 중간에 만나면 이벤트가 발생하는 형태로 구성해줘.
     마젤란의 사망 직전에 도와주는 이벤트를 수행하면 마젤란을 부하로 둘 수 있어.」
   ■ 사람 (G.HIST_FIG): 마가야네스(얼굴 portraits/history/magellan) · 루이 팔레이루 · 후안 데 카르타헤나 · 가스파르 데 케사다 ·
       곤살로 고메스 데 에스피노사 · 이스테방 고메스 · 세바스티앙 알바르스(포르투갈 상관장) · 후안 세바스티안 엘카노 · 안토니오 피가페타 · 차모로의 추장(지어낸 인물)
     향료제도·막탄(js/data/spicemactan.js)의 sm_magellan · sm_pigafetta와 같은 사람이다 — 이 묶음만 깔려 있어도 말할 수 있게 따로 둔다
   ■ 동료 (사건으로만 — eventOnly): 마가야네스(mg_magellan) — 1521년 4월 27일 막탄의 여울에서 제독이 건져 낸 사람.
       함대와 세상은 그가 죽은 줄 안다. 아내 베아트리스가 세빌리아에 있다(wed — 부하와의 연애·혼담에 끼지 않는다)
   ■ 소지품: 마가야네스의 아스트롤라베(mg_astrolabe — 팔 수 없다) · 빅토리아호의 출자 증서(mg_share — 팔 수 없다) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('mg_mag', { name: '페르난도 데 마가야네스', title: '카스티야 왕의 향료제도 함대 사령관', st: 'ib', role: 'captain', born: 1480, face: 'portraits/history/magellan',
    look: '마흔 언저리, 짧게 다듬은 검은 수염에 흰 올, 모로코 아자모르에서 다친 왼다리를 저는 걸음, 검은 망토 아래 낡은 흉갑, 말수 적은 굳은 입' });
  fig('mg_faleiro', { name: '루이 팔레이루', title: '포르투갈의 천문학자 · 원정의 공동 사령관', st: 'ib', role: 'scholar', born: 1480, look: '40대, 헝클어진 머리, 잉크 묻은 손가락, 별표를 쥐고 혼잣말을 하는 번득이는 눈' });
  fig('mg_alvares', { name: '세바스티앙 알바르스', title: '세빌리아의 포르투갈 상관장', st: 'ib', role: 'merchant', born: 1475, look: '50대, 검은 벨벳 옷깃에 금 사슬, 부드러운 목소리, 웃지 않는 눈' });
  fig('mg_cartagena', { name: '후안 데 카르타헤나', title: '산안토니오호 선장 · 왕실 감찰관', st: 'ib', role: 'noble', born: 1482, look: '30대, 깃털 꽂은 모자와 비단 소매, 턱을 치켜든 카스티야 귀족, 포르투갈 사람을 내려다보는 눈' });
  fig('mg_quesada', { name: '가스파르 데 케사다', title: '콘셉시온호 선장', st: 'ib', role: 'captain', born: 1485, look: '30대, 붉게 탄 얼굴, 칼자루를 쥔 떨리는 손, 술 냄새' });
  fig('mg_espinosa', { name: '곤살로 고메스 데 에스피노사', title: '함대의 경리관(알과실)', st: 'ib', role: 'soldier', born: 1490, look: '20대 후반, 짧은 머리, 가죽 조끼 안의 단검, 말보다 손이 빠른 사내' });
  fig('mg_gomes', { name: '이스테방 고메스', title: '산안토니오호의 수로 안내인', st: 'ib', role: 'sailor', born: 1483, look: '30대, 포르투갈 사람, 원망이 고인 눈, 팔짱을 낀 채 사령관의 등을 보는 사내' });
  fig('mg_elcano', { name: '후안 세바스티안 엘카노', title: '콘셉시온호의 항해장 · 바스크 사람', st: 'ib', role: 'sailor', born: 1486, look: '30대 초, 바스크 사람, 볕에 그은 넓은 얼굴, 짧은 수염, 굳은 손바닥' });
  fig('mg_piga', { name: '안토니오 피가페타', title: '함대의 기록자 · 비첸차 사람', st: 'it', role: 'scholar', born: 1491, face: 'portraits/history/sm_pigafetta', look: '20대 후반, 마른 몸, 소매에 꽂은 펜, 바닷물에 우는 공책, 크게 뜬 눈' });
  fig('mg_chamorro', { name: '차모로의 추장', title: '도둑의 섬(괌)의 마을 우두머리', st: 'se', role: 'noble', born: 1480, fiction: true, look: '40대, 붉게 물들인 이, 야자잎 모자, 쇠붙이를 보면 반짝이는 눈, 날랜 프로아 배' });
  G.MAGELLAN_FIGS = ['mg_mag', 'mg_faleiro', 'mg_alvares', 'mg_cartagena', 'mg_quesada', 'mg_espinosa', 'mg_gomes', 'mg_elcano', 'mg_piga', 'mg_chamorro'];

  // ── 동료 (사건으로만)
  if (G.MATES && G.MATE && !G.MATE.mg_magellan) {
    var m = { id: 'mg_magellan', name: '페르난도 데 마가야네스', g: 'm', style: 'ib', role: 'captain', tone: 'noble', age: 'mid', born: 1480,
      st: [70, 84, 80, 62], sk: { nav: 3, ops: 3, survey: 2, sword: 1 }, lg: { 1: 3, 0: 3, 12: 1 }, y: [1519, 1545], wed: 'beatriz',
      desc: '포르투갈 태생의 항해가. 카스티야 왕의 다섯 척을 이끌고 서쪽으로 돌아 신대륙 남쪽 끝의 해협을 지나 큰 바다를 건넜다. 1521년 4월 27일 막탄의 여울에서 쓰러졌다 — 고 모두가 안다. 다리를 더 심하게 저는 것과, 얼굴의 대나무 창 자국과, 별을 재는 손만은 그대로다.',
      face: 'portraits/history/magellan' };
    m.tale = true; m.legend = true; m.fame = 0; m.wage = 0; m.reg = []; m.eventOnly = true;
    G.MATES.push(m); G.MATE[m.id] = m;
  }

  // ── 소지품
  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'mg_astrolabe', name: '마가야네스의 아스트롤라베', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1521년 4월 27일 막탄의 여울에서 건져 낸 사령관이 끝내 놓지 않은 놋쇠 아스트롤라베. 고리에 「모든 성인의 해협」을 지난 날짜가 칼끝으로 새겨져 있다. 팔 수 없다.' });
    add({ id: 'mg_share', name: '빅토리아호의 출자 증서', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1519년 세빌리아 무역관(카사 데 콘트라타시온)에서 끊어 준 향료제도 원정의 출자 증서. 배가 정향을 싣고 돌아오면 몫을 받는다. 팔 수 없다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.magellan = G.BALANCE.magellan || {
    need: 3,                              // 막탄 직전에 그를 살릴 수 있는 믿음 (세랑의 편지·말라카의 다리도 하나씩 셈한다)
    invest: 2000, shareK: 1.6,            // ① 세빌리아의 출자 — 1522년 9월 빅토리아호가 돌아오면 몫(×shareK)
    bribe: 1500,                          // ① 포르투갈 상관장의 금화
    meetR: 4.5,                           // 바다에서 함대를 「만난」 거리(도)
    cebuR: 2.2,                           // 세부 앞바다
    supply: { atl: 20, winter: 30, pac: 30, pacHalf: 15 },   // 나눠 주는 식량·물(통)
    guamGold: 400, rebelGold: 1200,
    foe: { mutiny: 18, guam: 12, save: 26, land: 40 },
    fame: { seville: 40, atl: 60, plata: 40, mutiny: 120, winter: 60, strait: 120, pac: 120, guam: 40, save: 240, land: 120 }
  };
})(window.G = window.G || {});
