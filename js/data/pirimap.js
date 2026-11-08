/* 피리 레이스의 해도 — 후손과 함께 붉은 잉크의 길을 따라간다 (사건은 js/systems/pirimap.js · G.PiriMap). 2026-11-08 사용자 요청
   1513년 피리 레이스가 겔리볼루에서 가젤 가죽에 그린 세계 지도. 술탄께 바친 것과 따로, 집안에 남은 사본의 여백에는 붉은 잉크로 적은 글 몇 줄과 점 하나가 더 있다.
   (전설: 1501년 케말 레이스의 갤리에 잡힌 포르투갈 수로안내인이, 1500년 카브랄 선단의 보급선이 「진짜 십자가의 땅」 남쪽 암초에 걸려 금화 상자를 묻었다고 말했다 —
    젊은 피리가 그 이야기를 집안 사본에만 적어 두었다)
     ① 이스탄불 — 피리 레이스 집안의 후손 레일라 피리자데 (1555년 뒤 · 명성 minFame 이상)
     ② 카나리아 서쪽 바다 — 지도에 그려진 「산 브랜던의 섬」 (고래 등에 미사를 올린 수도사들)
     ③ 산토도밍고 — 피리가 참고했다는 콜롬보의 지도 (대성당 문서고)
     ④ 바이아 — 카브랄이 남기고 간 유배자의 손자, 늙은 수로안내인 · 「눈을 떠라(abre os olhos)」 — 아브롤류스 암초
     ⑤ 아브롤류스 암초 — 따라온 보물 사냥꾼들 · 묻힌 금화 상자 → 보물 · 레일라가 동료가 될 수 있다
   그림: images/legend-events/PIRIMAP_PROMPT.md — 초상 portraits/legendary/leyla · portraits/history/pr_*, 장면 legend-events/pr_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.pirimap = G.BALANCE.pirimap || {
    start: { city: 112, from: 15550101, to: 16901231, minFame: 3000 },   // 이스탄불 · 피리 레이스가 죽은(1553) 뒤
    brendan: { box: [-20.4, -18.3, 27.2, 29.5], food: 3, ambergris: 6 },   // 엘이에로 섬 서쪽 바다
    domingo: { city: 194, gift: 3000, speech: 2, guards: 24 },
    bahia: { city: 215, pilot: 2000 },
    abrolhos: { box: [-39.05, -38.2, -18.5, -17.3], reef: 0.18, army: 60 },
    gold: 50000, gems: 20, fame: 600, loyal: 85,
    again: 30,          // 아브롤류스에서 밀려나면 이만큼 뒤에 다시
    decline: 180        // 이스탄불에서 사양하면 이만큼 뒤에 다시
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    pr_leyla: { name: '레일라 피리자데', title: '피리 레이스 집안의 후손 · 지도 그리는 사람', st: 'is', role: 'scholar', born: 1532, face: 'portraits/legendary/leyla',
      look: '20대 중반의 여성, 짙은 눈썹과 또렷한 검은 눈, 머리를 감싼 남색 비단 두건, 잉크 묻은 손가락, 가죽 지도통을 멘 오스만 옷차림' },
    pr_friar: { name: '도밍고 수사', title: '산토도밍고 대성당 문서고를 지키는 도미니코회 수사', st: 'ib', role: 'priest', born: 1500,
      look: '60대, 흰 수도복과 검은 망토, 둥근 안경, 손에 열쇠 꾸러미, 의심 많은 눈' },
    pr_pilot: { name: '조앙 히베이루', title: '바이아의 늙은 수로안내인 · 유배자의 손자', st: 'ib', role: 'sailor', born: 1520,
      look: '50대, 햇볕에 그을린 얼굴, 투피남바 어머니를 닮은 검은 눈, 짧은 흰 수염, 맨발, 허리에 측연줄' },
    pr_rodrigo: { name: '돈 로드리고 데 바야스', title: '산토도밍고의 보물 사냥꾼', st: 'ib', role: 'soldier', born: 1530,
      look: '40대, 칼자국 난 뺨, 깃 달린 모자, 녹슨 흉갑, 손에 남의 지도를 베낀 종이' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.PIRIMAP_FIGS = Object.keys(L);

  var m = { id: 'leyla', name: '레일라 피리자데', short: '레일라', g: 'f', style: 'is', role: 'scholar', tone: 'polite', pic: 'leyla', age: 'young',
    st: [50, 88, 42, 84], sk: { survey: 3, art: 2, hist: 2, nav: 1 }, skBoost: 1, lg: { 5: 3, 1: 2, 0: 1, 2: 1 },
    desc: '오스만 제독이자 지도 제작자 피리 레이스 집안의 후손. 1553년 카이로에서 피리가 처형된 뒤 집안은 재산을 잃었고, 레일라는 이스탄불 책방 거리에서 남의 해도를 베껴 팔며 살았다. 그래도 할아버지들의 가젤 가죽 지도 사본만은 팔지 않았다. 별자리와 바람 장미를 보면 손이 먼저 움직이고, 지도가 틀린 곳을 보면 참지 못한다. 「바다는 지도보다 먼저 있었지만, 지도가 없으면 아무도 돌아오지 못해요.」' };
  m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1555, 1700]; m.reg = []; m.face = 'portraits/legendary/leyla'; m.eventOnly = true;
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }

  var IT = [
    { id: 'pr_family_map', name: '피리 레이스 집안의 해도 사본', kind: 'book', gv: 30, desc: '1513년 겔리볼루에서 그린 가젤 가죽 세계 지도를 피리 레이스가 손수 베낀 사본. 술탄께 바친 지도에는 없는 붉은 잉크의 글 몇 줄과, 「진짜 십자가의 땅」 남쪽 바다에 찍힌 붉은 점 하나가 있다.' },
    { id: 'pr_astrolabe', name: '카브랄 선단의 청동 아스트롤라베', kind: 'keepsake', gv: 34, desc: '1500년 카브랄 선단 보급선의 수로안내인이 금화 상자와 함께 아브롤류스 암초에 묻은 청동 아스트롤라베. 테두리에 포르투갈 왕가의 혼천의 문장이 새겨져 있다.' },
    { id: 'pr_red_note', name: '붉은 잉크의 마지막 쪽지', kind: 'keepsake', gv: 22, desc: '금화 상자 밑바닥에 깔려 있던 쪽지. 젊은 피리의 글씨로 「이것을 찾은 이는 내 지도를 믿어 준 사람이다」라고 적혀 있다.' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) {
    if (G.ITEM[x.id]) return;
    var it = { id: x.id, name: x.name, kind: x.kind || 'keepsake', price: 0, gv: x.gv, reg: [], desc: x.desc };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  });
})(window.G = window.G || {});
