/* 드레이크의 세계 일주 — 사람·동료·소지품·항로·조정값 (사건: js/systems/drakecirc.js) 2026-11-08 사용자 요청 「드레이크의 세계일주 이벤트」
   ■ 사람 (G.HIST_FIG): 드레이크(얼굴 portraits/mates/drake — 술집 동료 drake와 같은 사람) · 토머스 다우티 · 프랜시스 월싱엄 · 안토니오 데 과라스(에스파냐 왕의 런던 첩자) ·
       목사 프랜시스 플레처 · 존 윈터 · 디에고(시마론) · 산 후안 데 안톤 · 페루 부왕 프란시스코 데 톨레도 · 페드로 사르미엔토 데 감보아 · 테르나테의 술탄 바불라 ·
       미웍의 늙은이(지어낸 인물) · 존 다우티(토머스의 아우) · 마르쇼몽(프랑스 사절)
   ■ 동료 (사건으로만 — eventOnly): 누누 다 실바(dc_nuno) — 1578년 1월 카보베르데에서 드레이크에게 붙잡혀 브라질·해협·남쪽 바다를 길잡이한 포르투갈 수로 안내인.
       역사에서는 1579년 4월 과툴코에 내려져 누에바 에스파냐의 종교 재판에 넘겨졌다. 제독이 그를 그 바닷가에서 먼저 태우면 부하가 된다.
   ■ 지도에 보이는 함대: G.RIVAL_VOYAGES에 'drake'를 더한다 (js/systems/seafolk.js가 G.EXPEDITIONS에 잇는다) — 1577.12.13 플리머스 → 1580.9.26 플리머스.
       noDelay: 그 함대를 바다에서 쳐부숴도 항해가 한 해 늦춰지지 않는다 (역사: 드레이크는 돌아온다 — seafolk afterBattle 한 줄).
       대표 발견물 endstrait(땅끝 해협) — 경쟁 발표(rival)가 없는 발견물이라 누가 먼저 닿아도 발표 다툼은 없다. 제독이 땅끝 해협을 먼저 보고했으면 지도에서만 사라진다.
   ■ 소지품: 다우티의 마지막 편지(dc_letter) · 노바 알비온의 놋쇠 판 탁본(dc_plate) · 골든 하인드호의 판자(dc_plank) · 카카푸에고의 은 상자 증서(dc_chest) ·
       드레이크 원정의 출자 증서(dc_share) · 페루 부왕의 사략 허가장(dc_commission) — 모두 팔 수 없다 */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('dc_drake', { name: '프랜시스 드레이크', title: '펠리컨호(골든 하인드호) 선장 · 원정의 총대장', st: 'ne', role: 'captain', born: 1540, face: 'portraits/mates/drake',
    look: '서른일곱, 다부진 몸집, 붉은 기 도는 갈색 곱슬머리와 짧은 수염, 햇볕에 탄 둥근 얼굴, 데번 사투리, 웃을 때와 노할 때가 한순간인 눈' });
  fig('dc_doughty', { name: '토머스 다우티', title: '원정의 신사 · 드레이크의 옛 친구', st: 'ne', role: 'noble', born: 1545, look: '30대 초, 말쑥한 비단 더블릿, 라틴어를 섞는 매끄러운 말씨, 웃는 입과 달리 늘 무언가를 재는 눈' });
  fig('dc_walsingham', { name: '프랜시스 월싱엄', title: '여왕의 국무장관', st: 'ne', role: 'official', born: 1532, look: '40대 중반, 검은 옷에 흰 주름 깃, 길고 마른 얼굴, 낮은 목소리, 서류 뭉치' });
  fig('dc_guaras', { name: '안토니오 데 과라스', title: '런던의 에스파냐 상인 · 펠리페 왕의 눈', st: 'ib', role: 'merchant', born: 1520, look: '50대, 검은 벨벳 망토, 반지 낀 손가락으로 금화를 세는 버릇, 부드러운 웃음' });
  fig('dc_fletcher', { name: '프랜시스 플레처', title: '함대의 목사', st: 'ne', role: 'priest', born: 1545, look: '30대, 검은 사제복, 펜과 일지, 바다에 시달린 창백한 얼굴, 할 말은 하는 고집' });
  fig('dc_winter', { name: '존 윈터', title: '엘리자베스호 선장', st: 'ne', role: 'captain', born: 1550, look: '20대 후반, 젊은 신사 선장, 소금에 튼 입술, 망설이는 눈' });
  fig('dc_diego', { name: '디에고', title: '드레이크의 하인 · 파나마에서 온 시마론', st: 'af', role: 'sailor', born: 1550, look: '20대 후반, 아프리카 출신의 키 큰 사내, 에스파냐 말과 잉글랜드 말을 다 하는 빠른 입, 허리의 단검' });
  fig('dc_anton', { name: '산 후안 데 안톤', title: '「누에스트라 세뇨라 데 라 콘셉시온」호 선장', st: 'ib', role: 'captain', born: 1530, look: '40대, 바스크 사람, 볕에 그은 넓은 얼굴, 은 단추의 낡은 외투, 기가 막혀 벌어진 입' });
  fig('dc_toledo', { name: '프란시스코 데 톨레도', title: '페루 부왕', st: 'ib', role: 'noble', born: 1515, look: '60대, 흰 수염, 검은 비단에 금 십자 훈장, 노여움을 누르는 굳은 턱' });
  fig('dc_sarmiento', { name: '페드로 사르미엔토 데 감보아', title: '항해가 · 부왕의 추격대 대장', st: 'ib', role: 'captain', born: 1532, look: '40대 후반, 학자 같은 눈에 군인의 어깨, 아스트롤라베와 칼을 같이 차고 다니는 사내' });
  fig('dc_babullah', { name: '술탄 바불라', title: '테르나테의 술탄', st: 'se', role: 'noble', born: 1528, look: '50대, 금실 터번, 금 사슬과 루비, 포르투갈 사람을 몰아낸 사람의 느긋한 웃음, 노 젓는 사람 수백의 코라코라 배' });
  fig('dc_miwok', { name: '미웍의 늙은이', title: '노바 알비온 바닷가 마을의 어른', st: 'na', role: 'noble', born: 1520, fiction: true, look: '60대, 깃털 관과 조개 목걸이, 깃털 망토, 낯선 사람들을 오래 지켜보는 깊은 눈' });
  fig('dc_john', { name: '존 다우티', title: '토머스 다우티의 아우', st: 'ne', role: 'noble', born: 1550, look: '20대 후반, 형을 닮은 얼굴, 검은 상복, 주먹을 쥔 손' });
  fig('dc_marchaumont', { name: '마르쇼몽', title: '프랑스 왕제 앙주 공의 사절', st: 'ne', role: 'noble', born: 1540, look: '40대, 레이스 깃, 금 박차, 정중한 미소' });
  G.DRAKECIRC_FIGS = ['dc_drake', 'dc_doughty', 'dc_walsingham', 'dc_guaras', 'dc_fletcher', 'dc_winter', 'dc_diego', 'dc_anton', 'dc_toledo', 'dc_sarmiento', 'dc_babullah', 'dc_miwok', 'dc_john', 'dc_marchaumont'];

  // ── 동료 (사건으로만)
  if (G.MATES && G.MATE && !G.MATE.dc_nuno) {
    var m = { id: 'dc_nuno', name: '누누 다 실바', g: 'm', style: 'ib', role: 'sailor', tone: 'plain', age: 'mid', born: 1528,
      face: 'portraits/history/dc_nuno', halfKey: 'portraits/history/dc_nuno_half',
      st: [58, 74, 56, 60], sk: { nav: 3, survey: 2, acct: 1 }, lg: { 1: 3, 0: 2, 3: 1 }, y: [1579, 1600], wed: 'sea',
      desc: '리스본 태생의 수로 안내인. 브라질 바다를 스무 해 넘게 오갔다. 1578년 카보베르데 앞바다에서 드레이크에게 배째로 붙잡혀 브라질·해협·남쪽 바다를 길잡이했다. 1579년 과툴코 바닷가에서 내려져 종교 재판소로 끌려갈 참에 제독의 배에 올랐다. 일지를 손에서 놓지 않는다.' };
    m.tale = true; m.fame = 0; m.wage = 0; m.reg = []; m.eventOnly = true;
    G.MATES.push(m); G.MATE[m.id] = m;
  }

  // ── 소지품
  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'dc_letter', name: '다우티의 마지막 편지', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1578년 7월 2일 산훌리안의 바닷가, 목이 베이기 전날 밤 토머스 다우티가 아우 존에게 쓴 편지. 밀랍 위에 그의 반지 자국이 찍혀 있다. 팔 수 없다.' });
    add({ id: 'dc_plate', name: '노바 알비온의 놋쇠 판 탁본', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1579년 여름, 드레이크가 북쪽 바닷가의 기둥에 못 박은 놋쇠 판을 종이에 문질러 뜬 것. 「여왕 엘리자베스의 이름으로 이 땅을 노바 알비온이라 부른다」 — 가운데 구멍에는 여왕의 얼굴을 새긴 은화가 박혀 있었다. 팔 수 없다.' });
    add({ id: 'dc_plank', name: '골든 하인드호의 판자', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1580년 1월 셀레베스 앞바다의 산호초에 걸렸던 골든 하인드호의 바닥에서 갈아 낸 참나무 판자. 드레이크가 「이 배가 나를 놓지 않았듯 그대도 나를 놓지 않았소」라며 건넸다. 팔 수 없다.' });
    add({ id: 'dc_chest', name: '카카푸에고의 은 상자', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1579년 3월 1일 적도 바다에서 사로잡은 보물선 「누에스트라 세뇨라 데 라 콘셉시온」의 은 상자 하나. 드레이크가 몫으로 떼어 주며 봉인했다. 팔 수 없다 — 잉글랜드에 닿아 원정의 셈이 끝나면 금화가 된다.' });
    add({ id: 'dc_share', name: '드레이크 원정의 출자 증서', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1577년 런던에서 끊은 「알렉산드리아 무역」 원정의 출자 증서. 실은 남쪽 바다로 가는 길이라는 것을 아는 사람은 몇 없다. 여왕도 몰래 한 몫을 냈다고 한다. 팔 수 없다.' });
    add({ id: 'dc_commission', name: '페루 부왕의 허가장', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1579년 리마에서 부왕 톨레도가 내준 허가장. 「잉글랜드 해적 프란시스코 드라케를 쫓아 붙잡거나 그 배를 부수는 자에게 왕의 이름으로 상을 내린다.」 팔 수 없다.' });
  }

  // ── 지도에 보이는 함대 (seafolk.js가 G.EXPEDITIONS에 잇는다) — 율리우스력(그 무렵 잉글랜드의 날짜)
  G.RIVAL_VOYAGES = G.RIVAL_VOYAGES || [];
  if (!G.RIVAL_VOYAGES.some(function (v) { return v.id === 'drake'; })) G.RIVAL_VOYAGES.push({
    id: 'drake', who: '프랜시스 드레이크', nation: '잉글랜드', from: '플리머스', ships: ['galleon', 'galleon', 'caravel', 'hulk', 'barca'], discs: ['endstrait'], noDelay: true,
    goal: '「알렉산드리아로 간다」고 둘러대고 남쪽 바다의 에스파냐 보물선을 노리러 가는',
    pts: [[50.2, -4.3, '1577-12-13'], [31.5, -10.0, '1577-12-27'], [28.0, -16.2], [15.0, -23.7, '1578-01-20'], [5.0, -28.0], [-10.0, -33.0], [-31.0, -50.0, '1578-04-05'], [-35.2, -55.0, '1578-04-14'],
      [-47.8, -65.7, '1578-05-12'], [-49.3, -67.6, '1578-06-20'], [-49.3, -67.6, '1578-08-17'], [-52.35, -68.25, '1578-08-21'], [-53.2, -70.8], [-52.7, -74.6, '1578-09-06'], [-56.0, -78.0, '1578-09-30'],
      [-57.2, -70.5, '1578-10-28'], [-50.0, -76.0], [-38.4, -73.9, '1578-11-25'], [-33.0, -71.8, '1578-12-05'], [-29.9, -71.5, '1578-12-19'], [-18.5, -70.5, '1579-02-05'], [-12.05, -77.3, '1579-02-13'],
      [-12.05, -77.3, '1579-02-15'], [0.6, -80.3, '1579-03-01'], [0.6, -80.3, '1579-03-06'], [8.6, -83.9, '1579-03-20'], [15.7, -96.2, '1579-04-13'], [15.7, -96.2, '1579-04-16'], [22.0, -110.0], [38.0, -123.0, '1579-06-17'],
      [38.0, -123.0, '1579-07-23'], [30.0, -150.0], [15.0, -175.0], [7.5, 134.3, '1579-09-30'], [7.0, 126.6, '1579-10-21'], [0.75, 127.3, '1579-11-03'], [0.75, 127.3, '1579-11-09'], [-1.6, 123.2, '1579-11-14'],
      [-1.6, 123.2, '1579-12-12'], [-2.05, 121.7, '1580-01-09'], [-2.05, 121.7, '1580-01-10'], [-8.3, 116.125], [-7.8, 109.0, '1580-03-12'], [-7.8, 109.0, '1580-03-26'], [-20.0, 80.0], [-34.8, 18.4, '1580-06-18'],
      [-20.0, 0.0], [8.4, -13.4, '1580-07-22'], [8.4, -13.4, '1580-07-24'], [20.0, -22.0], [40.0, -15.0], [50.2, -4.3, '1580-09-26']]
  });

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.drakecirc = G.BALANCE.drakecirc || {
    need: 3,                              // 1581년 4월 뎃퍼드에 그가 제독을 부르는 믿음
    invest: 1500, shareK: 12,             // ① 런던의 출자 — 1580년 10월 몫(×shareK · 역사의 출자자들은 마흔일곱 배를 받았다고 한다)
    spyGold: 1500,                        // ① 에스파냐 왕의 눈에게 항로를 판다
    meetR: 4.5,                           // 바다에서 함대를 「만난」 거리(도)
    supply: { atl: 20, plata: 20, chile: 20, cape: 20, herbs: 5 },
    raid: { valpo: 1500, callao: 2200 },  // 약탈의 몫
    chest: 6000,                          // ⑥ 카카푸에고의 은 상자 — 1580년 10월 잉글랜드에서 금화로
    clove: { n: 30, k: 0.45 },            // ⑨ 테르나테의 정향 (시세의 k)
    reef: { n: 15, k: 0.3 },              // ⑩ 산호초 — 덜어 낸 정향을 싸게
    hunt: { ships: ['galleon'], gold: 5000, so: 160 },   // 부왕의 사략 — 골든 하인드호를 쳐부수면
    warn: 1200,                           // 부왕에게 알린 사례
    noto: { valpo: 3, callao: 4, cacafuego: 5, spy: 3 },
    hostile: { valpo: 6, callao: 8, cacafuego: 10 },     // 에스파냐(카스티야)의 적대
    foe: { mocha: 14, valpo: 16, callao: 18, albion: 0 },
    fame: { london: 40, atl: 50, plata: 40, julian: 100, strait: 100, storm: 120, chile: 60, valpo: 60, callao: 80, cacafuego: 140, guatulco: 40, albion: 80, ternate: 60, reef: 120, cape: 60, deptford: 200, hunt: 160, warn: 60 }
  };
})(window.G = window.G || {});
