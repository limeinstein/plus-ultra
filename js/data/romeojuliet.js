/* 로미오와 줄리엣 — 베로나의 두 가문 (사건은 js/systems/romeojuliet.js). 2026-10-31 사용자 요청
   · 마르케세 다 포르토(1531) · 반델로(1554) · 셰익스피어(1597)가 쓴 옛이야기를 바탕으로 새로 썼다 — 이 판에서는 두 사람이 죽지 않는다.
   · 베로나는 게임 지도에 없는 도시라, 이웃한 베니스·밀라노에 들어서면 「하루 말을 달려 베로나로」 간다.
   · 로미오와 줄리엣은 동료가 된다 (술집에는 나오지 않고 사건으로만 · 품삯은 이야기 동료 규칙 G.taleWage)
       로미오: 검술·사격술·포술·웅변 3 · 회계·과학 2 — 스무 살 몬터규가의 외아들
       줄리엣: 세공·그림·신학·웅변 2 — 열여덟 살 캐풀렛가의 외동딸 (이 게임에서는 성인으로 그린다)
       ※ 「조각」 특기는 게임에 없어 그림(미술) 특기에 함께 담았다 — 그림 2로 조각·미술을 아우른다.
   · 머큐시오·티볼트·로렌스 수사·영주 에스칼루스·발타자르는 이야기 속 인물
   그림: images/legend-events/ROMEOJULIET_PROMPT.md — 초상 portraits/legendary/romeo·juliet, portraits/history/rj_*, 장면 legend-events/rj_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.romeo = G.BALANCE.romeo || {
    cities: [29, 26],             // 베니스 · 밀라노 — 베로나까지 하루
    from: 14800101, to: 15901231, // 이야기가 일어날 수 있는 때
    gap: 4,                       // 1부(거리 싸움·머큐시오)에서 2부(잠의 약·성배)까지 적어도 이만큼(날)
    doctor: 300,                  // 이발사 외과의를 부르는 값
    herbs: 5,                     // 지혈에 쓰는 약재
    tries: 3,                     // 성배를 고를 기회 (틀릴 때마다 줄리엣의 잠이 열네 시간씩 줄어든다)
    fame: 150
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    rj_mercutio: { name: '머큐시오', title: '영주의 친척 · 로미오의 벗', st: 'it', role: 'captain', g: 'm', fiction: true,
      look: '20대 초반, 장난기 가득한 눈, 헝클어진 곱슬머리, 화려한 노란 줄무늬 겉옷, 허리에 가는 레이피어' },
    rj_tybalt: { name: '티볼트', title: '줄리엣의 사촌 · 「고양이 왕자」', st: 'it', role: 'soldier', g: 'm', fiction: true,
      look: '20대 중반, 날카로운 턱수염, 차가운 눈, 붉은 캐풀렛가 겉옷, 검술 사범다운 꼿꼿한 자세' },
    rj_laurence: { name: '로렌스 수사', title: '프란치스코회 수사 · 약초 학자', st: 'it', role: 'priest', g: 'm', fiction: true,
      look: '60대, 둥근 얼굴에 흰 수염, 갈색 수도복, 허리에 약초 주머니, 손에 작은 유리병' },
    rj_escalus: { name: '영주 에스칼루스', title: '베로나의 영주', st: 'it', role: 'noble', g: 'm', fiction: true,
      look: '50대, 엄한 얼굴, 짙은 자줏빛 망토와 금목걸이, 말 위에서 칼을 높이 든 모습' },
    rj_balthasar: { name: '발타자르', title: '로미오의 하인', st: 'it', role: 'sailor', g: 'm', fiction: true,
      look: '20대 초반의 청년, 흙먼지 묻은 승마복, 숨을 헐떡이는 얼굴' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });

  var M = [
    { id: 'romeo', name: '로미오', g: 'm', style: 'it', role: 'noble', tone: 'rush', pic: 'romeo', age: 'young',
      st: [70, 68, 80, 90], sk: { sword: 3, shoot: 3, gun: 3, speech: 3, acct: 2, sci: 2 }, skBoost: 1, lg: { 2: 3, 0: 1 },
      desc: '베로나 몬터규가의 외아들, 스무 살. 달빛 아래 발코니 밑에서 사랑을 속삭이던 낭만가지만, 칼을 뽑으면 베로나에서 그를 당할 사람이 드물다. 화승총과 대포 다루는 법을 영주의 수비대에서 익혔고, 집안 장부를 맡아 셈에도 밝다. 로렌스 수사 곁에서 약초와 증류를 배워 과학에도 눈이 트였다. 세상이 그와 줄리엣을 죽은 사람으로 알고 있다.' },
    { id: 'juliet', name: '줄리엣', g: 'f', style: 'it', role: 'noble', tone: 'polite', pic: 'juliet', age: 'young',
      st: [48, 76, 32, 96], sk: { craft: 2, art: 2, theo: 2, speech: 2 }, skBoost: 1, lg: { 2: 3, 0: 1 },
      desc: '베로나 캐풀렛가의 외동딸, 열여덟 살. 「장미는 다른 이름으로 불러도 똑같이 향기롭다」며 원수 집안의 아들을 사랑했다. 은세공과 그림·조각에 솜씨가 있어 작은 대리석 천사를 깎아 집안 예배당에 두었고, 수도원 학교에서 신학을 배웠다. 말이 차분하지만 한번 마음먹으면 독약도 마시는 사람이다. 세상이 그녀와 로미오를 죽은 사람으로 알고 있다.' }
  ];
  G.ROMEO_MATES = M.map(function (m) { return m.id; });
  M.forEach(function (m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1480, 1640]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });
  if (G.ITEMS && G.ITEM && !G.ITEM.lead_grail) {
    var it = { id: 'lead_grail', name: '로렌스 수사의 납 잔', kind: 'keepsake', price: 0, gv: 20, reg: [],
      desc: '금잔도 은잔도 아닌 거무스름한 납 잔. 로렌스 수사의 암자에서 「참된 잔」으로 골라 해독제를 담았다. 잔 바닥에 「겉을 보지 말고 말을 보라」고 새겨져 있다. 줄리엣이 깨어난 밤을 기억하는 잔이다.' };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  }
})(window.G = window.G || {});
