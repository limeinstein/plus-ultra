/* 영원성의 여포수 · 수방의 장부 — 천계제의 환관 정치에서 숭정제의 숙청까지 (사건: js/systems/ningchong.js) 2026-11-05 사용자 요청
   「1626 영원성 전투 — 원숭환이 후금의 공격을 저지 · 1627 숭정제 즉위와 위충현 세력 숙청 — 등장하는 미인들이 동료가 될 수 있는 스토리」
   ■ 사람 (G.HIST_FIG): 진수 태감 기용 · 동창의 당두 · 원숭환(houjin 의 hj_yuan 과 같은 사람) · 의안황후 장씨 · 숭정제 · 위충현 · 객씨 · 요동의 양향관
   ■ 동료 (사건으로만 — 만나기 전에는 술집에 없다 · 연애 가능)
     · 이네스(nc_ines) — 오문에서 온 여포수. 포르투갈 포수 아버지와 오문 어머니의 딸 (지어낸 인물)
     · 심옥란(nc_okran) — 객씨의 수방(繡房) 궁녀. 위충현의 생사(生祠)에 입힐 망포를 수놓던 손 (지어낸 인물)
   ■ 소지품: 수방의 장부(nc_ledger — 팔 수 없다) · 영원성의 포탄 조각(nc_shard) · 숭정 원년의 차용증(nc_iou — 팔 수 없다) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('nc_jiyong', { name: '기용', title: '영원에 내려온 진수 태감', st: 'cn', role: 'official', born: 1580, look: '40대, 수염 없는 희멀건 얼굴, 붉은 망포에 옥대, 손톱을 길게 기른 손으로 부채를 쥔다' });
  fig('nc_dangtou', { name: '동창의 당두', title: '위충현이 부리는 동창의 우두머리', st: 'cn', role: 'soldier', fiction: true, look: '30대, 갈색 두건에 짧은 칼, 웃을 때도 눈이 웃지 않는 사내' });
  fig('nc_yuan', { name: '원숭환', title: '영원성을 지킨 장수', st: 'cn', role: 'soldier', born: 1584, mate: 'h_yuanchonghuan', look: '40대 초반, 문관 출신의 장수, 꼿꼿한 수염, 화약 연기 속의 눈빛' });
  fig('nc_empress', { name: '장 황후', title: '천계제의 황후 · 의안황후', st: 'cn', role: 'noble', g: 'f', born: 1606, look: '20대 초반, 키가 크고 눈매가 서늘한 미인, 소복에 가까운 엷은 비단, 흐트러짐 없는 자세' });
  fig('nc_chongzhen', { name: '숭정제', title: '명의 새 황제 (신왕 주유검)', st: 'cn', role: 'noble', born: 1611, look: '열일곱, 마른 얼굴에 날카로운 눈, 아직 몸에 맞지 않는 곤룡포' });
  fig('nc_wei', { name: '위충현', title: '사례감 병필태감 · 「구천세」', st: 'cn', role: 'official', born: 1568, look: '60대, 살찐 얼굴에 가는 눈, 금실 망포, 둘레에 엎드린 관리들' });
  fig('nc_ke', { name: '객씨', title: '천계제의 유모 · 봉성부인', st: 'cn', role: 'noble', g: 'f', born: 1580, look: '40대 후반, 짙은 분과 진주 머리장식, 비단 옷자락을 끄는 오만한 걸음' });
  fig('nc_grain', { name: '요동의 양향관', title: '군량을 맡은 관리', st: 'cn', role: 'official', fiction: true, look: '50대, 빈 장부를 든 지친 얼굴, 해진 관복' });
  G.NINGCHONG_FIGS = ['nc_jiyong', 'nc_dangtou', 'nc_yuan', 'nc_empress', 'nc_chongzhen', 'nc_wei', 'nc_ke', 'nc_grain'];

  // ── 동료 (사건으로만 · 연애 가능 — wed 를 두지 않는다)
  function mate(o) {
    o.tale = true; o.legend = true; o.fame = 0; o.wage = 0; o.reg = []; o.eventOnly = true;
    o.face = 'portraits/mates/' + o.id;
    if (G.MATES && G.MATE && !G.MATE[o.id]) { G.MATES.push(o); G.MATE[o.id] = o; }
  }
  mate({ id: 'nc_ines', name: '이네스', g: 'f', style: 'ib', role: 'soldier', tone: 'rush', age: 'young', st: [72, 74, 80, 92], sk: { gun: 3, shoot: 2, ship: 1 }, skBoost: 1, lg: { 1: 3, 7: 3, 0: 1 }, y: [1626, 1670],
    desc: '오문에서 온 포수. 포르투갈 포수였던 아버지에게서 화승 다루는 법을, 오문 어머니에게서 까만 눈과 고집을 물려받았다. 남장을 하고 영원성 성벽에 올라 홍이포를 쏘았다 — 누르하치를 다치게 한 그 포탄이다. 화약에 그을린 뺨을 닦으면, 선원들이 포격 연습을 하겠다고 줄을 선다. 포르투갈 이름은 이네스 코헤이아, 어머니가 부르던 이름은 연(燕) — 제비.' });
  mate({ id: 'nc_okran', name: '옥란', g: 'f', style: 'cn', role: 'maid', tone: 'polite', age: 'young', st: [44, 86, 28, 96], sk: { art: 2, craft: 2, acct: 1, music: 1 }, skBoost: 1, lg: { 7: 3 }, y: [1627, 1680],
    desc: '소주 자수 집안의 딸로, 열네 살에 궁에 들어가 객씨의 수방에서 비단에 용을 수놓았다. 목련(玉蘭)처럼 희고 가는 손가락 — 그 손이 「구천세」 위충현의 소상에 입힐 망포를 지었고, 그 안감에 꿰매 넣은 장부를 들고 달아났다. 바늘 한 땀으로 사람 얼굴을 그려 내고, 장부의 숫자 한 자도 놓치지 않는다. 사내들 앞에서는 눈을 내리깔지만, 거짓말 앞에서는 절대 고개를 숙이지 않는다.' });

  // ── 소지품
  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'nc_ledger', name: '수방의 장부', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '위충현의 소상에 입힐 망포 안감에 꿰매어 있던 얇은 책. 생사(生祠)를 세우며 누가 은자를 얼마 바쳤는지, 동림의 선비 누구를 누가 고발했는지가 붉은 붓으로 적혀 있다. 팔 수 없다.' });
    add({ id: 'nc_shard', name: '영원성의 포탄 조각', kind: 'special', price: 0, reg: [], rare: true,
      desc: '1626년 정월, 영원성 성벽 위의 홍이포가 쏜 포탄의 쇳조각. 이네스가 성 밖 눈밭에서 주워 끈을 꿰어 목에 걸고 다녔다. 「누르하치의 일산 곁에 떨어진 거예요.」' });
    add({ id: 'nc_iou', name: '숭정 원년의 차용증', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '요동의 군량을 대려고 빌려준 금화에 대해 독사 원숭환의 관인이 찍힌 차용증. 「나라의 곳간이 차면 갚는다.」 — 그날은 오지 않았다. 팔 수 없다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.ningchong = G.BALANCE.ningchong || {
    foe: { wall: 28, dock: 16, okran: 18 },   // 영원성 성벽(작은 싸움 — 큰 싸움은 houjin ②) · 요동 부두의 동창 번역 · 옥란을 쫓는 동창
    bribeInes: 2500,                          // 진수 태감 기용에게 바치는 은자
    bribeOkran: 1800,                         // 동창의 당두에게 쥐여 보내는 은자
    sell: 12000, notoSell: 10,                // 장부를 위충현의 사람에게 판다
    reward: 3000,                             // 장 황후의 하사금
    grain: { q: 60, k: 0.7 },                 // 1628 요동의 빈 곳간 — 쌀·밀 60통을 시세의 0.7배로
    loan: 3000,                               // 금화를 빌려준다 (돌려받지 못한다)
    fame: { wall: 120, ines: 120, okran: 100, ledger: 220, freed: 80, grain: 140, loan: 100 }
  };
})(window.G = window.G || {});
