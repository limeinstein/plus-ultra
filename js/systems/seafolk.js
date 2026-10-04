/* 바다의 사람들 — 나라별 상선과 적대, 사략함대·군함의 추격, 바다에서 만나는 항해사와 탐험가.
   ■ 적대 (G.Hostile)
     · 상선·함대에도 나라가 있다. 그 나라의 배를 먼저 공격하면 그 나라의 적대가 오른다.
     · 그 나라의 항구에서 교역(사고팔기)을 하면 적대가 줄어든다. 해적질 한 번을 교역 열 번으로 갚는 비율 (attack.merchant ÷ tradeN).
     · 적대가 10(hunt) 이상이면 그 나라의 사략함대·군함이 제독을 노린다 — 그 나라 항구가 가까운 바다에서 나타나 쫓아온다.
       바다에서 만나면 싸우거나 달아나거나, 배상금을 내고 적대를 낮출 수 있다.
     · 저장: s.hostile = {나라 이름: 수치} (없으면 0 — 옛 저장도 그대로 열린다)
   ■ 배의 선장 (G.SeaFolk)
     · 대부분은 이름 없는 선장이지만, 아직 동료가 되지 않은 항해사(G.MATES)가 상선을 몰고 있기도 하다.
       신호를 보내 이야기하면 어디로 가는지 알려 준다 — 그 항구의 술집에서 다시 만날 수 있다 (G.MateMove 자리도 그곳으로 옮긴다).
     · 역사 속 탐험가(콜럼버스·다 가마·마젤란 …)는 정해진 때에 모항을 떠나 실제 항로를 따라 발견물을 찾아간다(G.EXPEDITIONS).
       경쟁자 발표일(d.rival)에 맞춰 도착하고, 일기토 등으로 늦춰지면(flags.delay_발견물) 그만큼 늦게 떠난다.
       항로 가까이 가면 그 함대가 보이고, 신호를 보내면 행선지(단서)를 들을 수 있다. 공격해서 이기면 항해가 한 해 늦어진다(그 나라 적대는 오른다).
   조정값: G.BALANCE.hostility */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.hostility = G.BALANCE.hostility || {
    attack: { merchant: 5, navy: 8, explorer: 6 },   // 먼저 공격했을 때 오르는 적대
    tradeN: 10,          // 해적질 한 번(상선 공격)을 갚는 교역 횟수 → 교역 한 번에 attack.merchant / tradeN 만큼 준다
    tradeMin: 150,       // 이만큼(금화) 넘는 거래만 교역으로 친다
    hunt: 10,            // 이 수치부터 사략함대·군함이 노린다
    huntP: 0.06, huntPk: 0.012, huntPmax: 0.3,   // 하루에 나타날 확률: huntP + (적대 − hunt) × huntPk (최대 huntPmax)
    near: 16,            // 그 나라 항구가 이만큼(도) 안에 있어야 나타난다
    chase: 8,            // 쫓아오는 거리(도)
    payK: 140, payBase: 400, payCut: 6,   // 배상금 = payBase + 적대 × payK, 내면 적대 −payCut
    mateCaptain: 0.3     // 상선 선장이 아직 만나지 못한 항해사일 확률 (가까이에 그런 항해사가 있을 때)
  };
  function B() { return G.BALANCE.hostility; }
  function S() { return G.Game.state; }

  // ================================================================ 적대
  var H = G.Hostile = {};
  H.all = function () { var s = S(); return (s && s.hostile) || {}; };
  H.get = function (nation) { return nation ? (H.all()[nation] || 0) : 0; };
  H.hunting = function (nation) { return H.get(nation) >= B().hunt; };
  /** 적대를 더하거나 줄인다. 문턱(hunt)을 넘나들면 알린다 */
  H.add = function (nation, v, why) {
    var s = S(); if (!s || !nation || !v) return 0;
    s.hostile = s.hostile || {};
    var before = s.hostile[nation] || 0, after = Math.max(0, Math.round((before + v) * 10) / 10);
    if (after <= 0) delete s.hostile[nation]; else s.hostile[nation] = after;
    var T = B().hunt;
    if (before < T && after >= T) {
      UI.toast(nation + U.j(nation, '이/가').slice(nation.length) + ' 제독을 적으로 여기기 시작했다! 그 나라의 사략함대와 군함이 노린다. (적대 ' + after + ')', 'skull', 6000);
      G.State.log(nation + '의 적대가 ' + after + '에 이르렀다 — 사략함대·군함이 노리기 시작한다.' + (why ? ' (' + why + ')' : ''));
    } else if (before >= T && after < T) {
      UI.toast(nation + '의 적대가 누그러졌다. 더는 사략함대가 쫓지 않는다. (적대 ' + after + ')', 'handshake', 5000);
      G.State.log(nation + '의 적대가 ' + after + '로 누그러졌다.');
    } else if (v > 0) UI.toast(nation + '의 적대 +' + v + ' → ' + after + (after >= T ? ' (추격 중)' : ' / ' + T + '이 되면 추격'), 'skull', 3800);
    return after;
  };
  /** 교역: 그 항구 나라의 적대를 줄인다 */
  H.trade = function (c, value) {
    if (!c || value < B().tradeMin) return;
    var nation = R.cityOwner(c); if (!H.get(nation)) return;
    var cut = B().attack.merchant / B().tradeN;
    var after = H.add(nation, -cut);
    // 「모두 판다」처럼 한꺼번에 여러 번 거래하면 알림은 한 번만
    pend[nation] = { n: (pend[nation] ? pend[nation].n : 0) + 1, v: after };
    clearTimeout(pendT); pendT = setTimeout(function () {
      Object.keys(pend).forEach(function (k) { UI.toast(k + U.j(k, '과/와').slice(k.length) + '의 교역으로 적대가 줄었다 (−' + Math.round(cut * pend[k].n * 10) / 10 + ') → ' + pend[k].v, 'handshake', 3000); });
      pend = {};
    }, 400);
  };
  var pend = {}, pendT = null;
  /** 수첩에 보일 줄: [{n, v, hunt}] 높은 순 */
  H.list = function () {
    var a = H.all(); return Object.keys(a).map(function (k) { return { n: k, v: a[k], hunt: a[k] >= B().hunt }; }).sort(function (x, y) { return y.v - x.v; });
  };
  H.html = function () {
    var l = H.list(); if (!l.length) return '<span class="muted">없음</span>';
    return l.map(function (x) { return '<span' + (x.hunt ? ' class="warn-text" title="사략함대·군함이 노린다"' : '') + '>' + U.esc(x.n) + ' ' + x.v + (x.hunt ? ' ⚔' : '') + '</span>'; }).join(' · ');
  };
  /** 배상금 */
  H.fee = function (nation) { var b = B(); return Math.round(b.payBase + H.get(nation) * b.payK); };

  // ================================================================ 탐험가의 항해 (역사 자료를 바탕으로 한 대략의 항로)
  // pts: [위도, 경도, 'YYYY-MM-DD'(그날 그곳에 있었다) 또는 없음(앞뒤 날짜 사이를 거리로 나눔)]
  // discs: 이 항해가 찾는 발견물 (첫째가 대표 — 늦춤 flags.delay_대표)
  G.EXPEDITIONS = [
    // 1480년 리스본에 살던 콜론이 북쪽 브르타뉴로 — 게임을 시작하고 한 달 뒤 카르낙 거석군을 발표한다 (경쟁자 발견·보고의 첫 사례)
    { id: 'colon0', who: '크리스토발 콜론', nation: '포르투갈', from: '리스본', ships: ['caravel', 'barca'], discs: ['carnac'],
      goal: '브르타뉴 남쪽 들판에 줄지어 선 거인의 돌을 보러 북쪽으로 가는',
      pts: [[38.55, -9.6, '1480-05-06'], [40.6, -9.95], [43.4, -9.6], [45.6, -5.4], [47.45, -2.98, '1480-05-15'], [47.45, -2.98, '1480-05-21'], [45.6, -5.4], [43.4, -9.6], [40.6, -9.95], [38.55, -9.6, '1480-06-01']] },
    { id: 'dias', who: '바르톨로메우 디아스', nation: '포르투갈', from: '리스본', ships: ['caravel', 'caravel', 'hulk'], discs: ['capegood'],
      goal: '아프리카 해안을 끝까지 따라 내려가 대륙이 끝나는 곳을 찾으러 가는',
      pts: [[38.55, -9.6, '1487-08-01'], [33.5, -11.5], [27.0, -17.5], [20.5, -18.5], [14.0, -18.2], [8.0, -15.5], [4.0, -8.0], [3.5, 2.0], [0.0, 7.5], [-6.0, 10.5], [-15.0, 10.8], [-22.0, 13.0], [-29.0, 15.2, '1488-01-10'], [-35.2, 18.0], [-34.6, 22.3, '1488-02-03'], [-34.2, 25.9, '1488-03-12']] },
    { id: 'colon1', who: '크리스토발 콜론', nation: '카스티야', from: '팔로스', ships: ['carrack', 'caravel', 'caravel'], discs: ['westroute', 't_tobacco', 't_maize'],
      goal: '대서양을 곧장 서쪽으로 건너 인디아스와 카타이에 닿으러 가는',
      pts: [[36.95, -7.1, '1492-08-03'], [32.0, -11.5], [27.9, -15.0, '1492-08-12'], [27.6, -17.6, '1492-09-06'], [27.0, -30.0], [26.0, -50.0], [24.6, -68.0], [24.05, -74.6, '1492-10-12'], [22.3, -75.4], [21.4, -76.1, '1492-10-28'], [20.0, -73.9], [20.25, -72.6, '1492-12-06'], [19.95, -72.0, '1492-12-25']] },
    { id: 'cabot', who: '존 캐벗', nation: '잉글랜드', from: '브리스틀', ships: ['caravel'], discs: ['skraeling'],
      goal: '북쪽 바다를 서쪽으로 건너 카타이로 가는 짧은 길을 찾으러 가는',
      pts: [[51.3, -3.9, '1497-05-20'], [51.2, -6.5], [51.6, -12.0], [52.0, -30.0], [51.8, -53.4, '1497-06-24'], [50.5, -54.6, '1497-07-10']] },
    { id: 'gama', who: '바스코 다 가마', nation: '포르투갈', from: '리스본', ships: ['carrack', 'carrack', 'caravel', 'hulk'], discs: ['indiaroute', 't_pepper'],
      goal: '아프리카를 돌아 후추의 땅 인도까지 가는',
      pts: [[38.55, -9.6, '1497-07-08'], [28.0, -17.8], [15.5, -24.6, '1497-07-27'], [5.0, -22.0], [-10.0, -25.0], [-25.0, -20.0], [-32.0, 10.0], [-32.7, 17.8, '1497-11-07'], [-35.3, 19.5, '1497-11-22'], [-34.4, 22.5, '1497-12-01'], [-31.0, 31.5], [-25.0, 35.8], [-15.0, 40.9, '1498-03-02'], [-8.0, 40.4], [-3.3, 40.4, '1498-04-14'], [5.0, 55.0], [11.2, 75.5, '1498-05-20']] },
    { id: 'cortereal', who: '가스파르 코르트레알', nation: '포르투갈', from: '리스본', ships: ['caravel'], discs: ['inuit'],
      goal: '북서쪽 얼음 바다 너머의 땅을 찾으러 가는',
      pts: [[38.55, -9.6, '1500-05-10'], [39.3, -27.6], [48.0, -40.0], [56.0, -52.0], [57.4, -60.4, '1500-07-15']] },
    { id: 'colon4', who: '크리스토발 콜론', nation: '카스티야', from: '카디스', ships: ['caravel', 'caravel', 'caravel', 'caravel'], discs: ['t_cacao'],
      goal: '서쪽 섬들 너머에서 인도양으로 빠지는 해협을 찾으러 가는 네 번째',
      pts: [[36.45, -6.5, '1502-05-11'], [28.0, -17.8], [14.5, -60.6, '1502-06-15'], [17.0, -66.0], [18.25, -69.9, '1502-06-29'], [17.6, -76.0], [16.6, -84.0], [16.6, -85.95, '1502-07-30'], [16.0, -83.3, '1502-08-20']] },
    { id: 'almeida', who: '프란시스쿠 드 알메이다', nation: '포르투갈', from: '리스본', ships: ['carrack', 'carrack', 'carrack', 'carrack', 'caravel', 'caravel'], discs: ['t_cinnamon'],
      goal: '인도의 첫 부왕으로서 함대를 이끌고 가는',
      pts: [[38.55, -9.6, '1505-03-25'], [15.5, -24.6], [-10.0, -25.0], [-32.0, 10.0], [-35.3, 19.5], [-25.0, 35.8], [-9.0, 39.8, '1505-07-22'], [-3.3, 40.4], [5.0, 55.0], [14.7, 73.9, '1505-09-13']] },
    { id: 'sequeira', who: '디오구 로페스 드 세케이라', nation: '포르투갈', from: '리스본', ships: ['carrack', 'carrack', 'caravel', 'caravel'], discs: ['malacca'],
      goal: '인도보다 동쪽, 큰 반도 끝의 항구 말라카를 찾으러 가는',
      pts: [[38.55, -9.6, '1508-04-05'], [15.5, -24.6], [-10.0, -25.0], [-32.0, 10.0], [-35.3, 19.5], [-25.0, 35.8], [-3.3, 40.4], [5.0, 55.0], [9.9, 75.9, '1509-04-21'], [5.6, 80.5], [6.4, 94.0], [4.6, 98.6], [2.3, 101.9, '1509-09-11']] },
    { id: 'abreu', who: '프란시스코 세랑', nation: '포르투갈', from: '말라카', ships: ['carrack', 'caravel', 'junk'], discs: ['spiceis', 't_clove'],
      goal: '정향과 육두구가 나는 동쪽 섬들을 찾으러 가는',
      pts: [[2.1, 102.1, '1511-11-20'], [-2.0, 106.8], [-5.6, 110.0], [-6.7, 112.9, '1511-12-20'], [-7.6, 117.0], [-7.6, 121.5], [-6.3, 126.0], [-4.7, 129.6, '1512-01-25'], [-4.6, 129.4, '1512-02-20']] },
    { id: 'alaminos', who: '안톤 데 알라미노스', nation: '카스티야', from: '푸에르토리코', ships: ['caravel', 'caravel', 'barca'], discs: ['gulfstream'],
      goal: '폰세 데 레온 총독의 배를 몰고 북쪽의 「비미니」 섬을 찾으러 가는',
      pts: [[18.6, -67.3, '1513-03-04'], [21.0, -70.5], [30.0, -80.9, '1513-04-02'], [28.5, -80.2, '1513-04-21'], [26.6, -79.8, '1513-05-08']] },
    { id: 'alvares', who: '조르즈 알바르스', nation: '포르투갈', from: '말라카', ships: ['junk'], discs: ['china'],
      goal: '비단과 도자기의 나라 카타이의 항구를 찾으러 가는',
      pts: [[2.1, 102.1, '1513-03-01'], [5.0, 106.0], [10.0, 109.6], [16.0, 112.0], [21.8, 113.9, '1513-05-25']] },
    { id: 'cortes', who: '에르난 코르테스', nation: '카스티야', from: '쿠바', ships: ['carrack', 'carrack', 'caravel', 'caravel', 'caravel', 'barca'], discs: ['aztec'],
      goal: '서쪽 뭍 깊은 곳에 있다는 황금의 왕국을 찾으러 가는',
      pts: [[21.7, -85.1, '1519-02-18'], [20.6, -86.75, '1519-02-27'], [20.8, -90.8], [18.9, -91.9, '1519-03-20'], [19.25, -96.05, '1519-04-21'], [19.3, -96.1, '1519-07-30']] },
    { id: 'magellan', who: '페르난도 데 마가야네스', nation: '카스티야', from: '산루카르', ships: ['carrack', 'carrack', 'carrack', 'caravel', 'caravel'], discs: ['newstrait', 'patagon'],
      goal: '신대륙 남쪽 어딘가에서 서쪽 바다로 빠지는 해협을 찾아 향료제도로 가는',
      pts: [[36.75, -6.5, '1519-09-20'], [32.0, -11.5], [28.5, -16.0, '1519-09-26'], [20.0, -21.0], [5.0, -22.0], [-8.0, -33.5], [-23.05, -43.15, '1519-12-13'], [-34.8, -54.5, '1520-01-12'], [-49.3, -67.6, '1520-03-31'], [-49.3, -67.6, '1520-08-24'], [-52.35, -68.25, '1520-10-21'], [-53.2, -70.8, '1520-11-10'], [-52.7, -74.6, '1520-11-28']] },
    { id: 'elcano', who: '후안 세바스티안 엘카노', nation: '카스티야', from: '티도레', ships: ['carrack'], discs: ['circum'],
      goal: '향료를 가득 싣고 세계를 한 바퀴 돌아 에스파냐로 돌아가는',
      pts: [[0.6, 127.3, '1521-12-21'], [-10.5, 124.0, '1522-01-25'], [-20.0, 100.0], [-35.5, 40.0], [-35.5, 20.0, '1522-05-19'], [-20.0, 0.0], [0.0, -15.0], [14.9, -23.9, '1522-07-09'], [28.0, -19.0], [36.75, -6.5, '1522-09-06']] },
    { id: 'pizarro', who: '프란시스코 피사로', nation: '카스티야', from: '파나마', ships: ['caravel', 'caravel', 'barca'], discs: ['inca', 'llama', 't_potato'],
      goal: '남쪽 바다 해안을 따라 황금의 제국 비루를 찾으러 가는',
      pts: [[8.8, -79.4, '1531-01-01'], [5.0, -80.0], [1.1, -80.2, '1531-03-01'], [-2.9, -80.5, '1531-11-01'], [-3.5, -80.7, '1532-04-30'], [-3.55, -80.75, '1532-05-20']] }
  ];

  var SF = G.SeaFolk = {};

  // ================================================================ 술집에 머무는 경쟁 탐험가 (고용할 수 없다 — 스스로 함대를 꾸려 발견물을 찾고 발표한다)
  // stays: [[해부터, 해 전까지, 도시 번호]] — 탐험 함대(G.EXPEDITIONS)로 바다에 나가 있는 동안은 술집에 없다.
  // talk: 술집 대사. plan[발견물] = 떠나기 전 계획(단서를 준다), done[발견물] = 발표한 뒤, dream = 먼 꿈(아직 떠날 때가 아님)
  G.RIVAL_STAYS = {
    '크리스토발 콜론': {
      short: '콜론',
      // 「항해사를 찾는다」 명부 카드 (고용할 수 없다 — 능력치·특기·말은 보여 준다)
      card: { g: 'm', y: [1451, 1506], st: [62, 80, 55, 76], sk: { nav: 3, survey: 2, speech: 2 }, lg: { 2: 3, 1: 3, 0: 2 },
        desc: '제노바 태생의 뱃사람. 대서양 서쪽 끝에 인디아스가 있다고 믿으며 스스로 함대를 꾸릴 날을 기다린다. 누구의 부하도 되지 않는다.' },
      stays: [[1480, 1485, 0], [1485, 1506, 7]],
      keeper: '저쪽 구석에서 해도를 펼쳐 놓은 사내 보이나? 제노바에서 온 크리스토발 콜론이라는 자일세. 페레스트렐루 집안 딸과 혼인해 리스본에 눌러앉았지. 제 배를 꾸려 다니는 사람이라 남의 밑에서 일하지는 않을 걸세.',
      away: '콜론 말인가? 배를 끌고 북쪽 바다로 나갔네. 돌아오면 또 저 구석에서 해도를 펼치고 있겠지.',
      intro: '크리스토발 콜론이오. 제노바에서 났지만 지금은 리스본에 살고 있소. 장인 어른이 포르투 산투 섬의 선장이셨던 덕에 그 댁에 해도와 항해 기록이 산더미처럼 있더군.',
      hire: '고맙지만 나는 남의 배에 타는 사람이 아니오. 언젠가 내 함대를 이끌고 아무도 가 보지 않은 바다로 갈 거요. 그때는 바다에서 겨루게 되겠지.',
      plan: {
        carnac: '며칠 뒤 북쪽으로 배를 띄울 참이오. 브르타뉴 남쪽 카르낙이라는 들판에, 옛사람들이 세운 거대한 선돌이 수천 개나 줄지어 있다더군. 다음 달 초면 이 리스본에서 그 이야기를 전할 수 있을 거요.',
        westroute: '대서양을 곧장 서쪽으로 건너면 인디아스에 닿는다 — 이제 그 일을 할 때가 왔소. 카스티야의 여왕께서 배 세 척을 내어 주신다면 말이오.'
      },
      done: {
        carnac: '카르낙에 다녀왔소! 들판 끝까지 돌기둥이 늘어서 있더군. 누가 왜 세웠는지는 끝내 알 수 없었지만, 리스본 사람들은 내 이야기에 귀를 기울였소.',
        westroute: '서쪽 바다 너머에 섬들이 있었소. 나는 그곳이 인디아스의 끝자락이라고 믿소.'
      },
      beaten: '그 들판 이야기를 당신이 먼저 알렸더군. 바다는 넓으니, 다음에는 내가 먼저일 거요.',
      dream: '토스카넬리 선생의 편지를 보았소? 지구가 둥글다면 서쪽으로 곧장 가서 카타이에 닿을 수 있소. 언젠가는 그 길을 열 거요.'
    }
  };
  /** 그 경쟁 탐험가가 지금 머무는 도시 (바다에 나가 있어도 돌아올 도시) — 없으면 null */
  SF.rivalCity = function (nm) {
    var s = S(), r = G.RIVAL_STAYS[nm]; if (!s || !r) return null;
    var y = s.date.y;
    for (var i = 0; i < r.stays.length; i++) if (y >= r.stays[i][0] && y < r.stays[i][1]) return G.CITY_DATA[r.stays[i][2]] || null;
    return null;
  };
  /** 이름으로: 지금 탐험 함대를 이끌고 바다에 나가 있는가 (제독이 먼저 보고·발표한 탐험은 그만둔다) */
  SF.atSeaName = function (nm) {
    var s = S(), t = today();
    return G.EXPEDITIONS.some(function (ex) {
      if (ex.who !== nm) return false;
      var st = s.disc[ex.discs[0]]; if (st && (st.reported || st.announced)) return false;
      var sp = SF.span(ex); return t >= sp[0] && t < sp[1];   // 마지막 날은 항구에 들어와 있다
    });
  };
  function parseD(sd) { var a = sd.split('-'); return U.dayIndex({ y: +a[0], m: +a[1], d: +a[2] }); }
  function dd(a, b) { var dl = Math.abs(a[1] - b[1]); if (dl > 180) dl = 360 - dl; var dx = dl * Math.cos((a[0] + b[0]) / 2 * Math.PI / 180), dy = a[0] - b[0]; return Math.sqrt(dx * dx + dy * dy); }
  /** 늦춤(일기토·해전으로 미뤄진 해) */
  SF.delay = function (ex) { var s = S(); return (s && s.flags['delay_' + ex.discs[0]]) || 0; };
  /** 늦춤만큼 미룬 날수 */
  function shiftOf(ex) {
    var dl = SF.delay(ex); if (!dl) return 0;
    var a = ex.pts[0][2].split('-');
    return U.dayIndex({ y: +a[0] + dl, m: +a[1], d: +a[2] }) - parseD(ex.pts[0][2]);
  }
  /** 떠나는 날과 끝나는 날 (항로를 계산하지 않고 바로) */
  SF.span = function (ex) {
    var sh = shiftOf(ex), last = null;
    for (var i = ex.pts.length - 1; i >= 0 && !last; i--) if (ex.pts[i][2]) last = ex.pts[i][2];
    return [parseD(ex.pts[0][2]) + sh, parseD(last) + sh];
  };
  /** 날짜를 채운 항로 [{lat, lon, t}] (늦춤 반영). 짚은 점 사이는 바닷길 찾기(G.Nav.path)로 뭍을 돌아간다 */
  var timed = {};
  SF.track = function (ex) {
    var key = ex.id + ':' + SF.delay(ex);
    if (timed[key]) return timed[key];
    var shift = shiftOf(ex);
    var K = ex.pts.map(function (p) { return { lat: p[0], lon: p[1], t: p[2] ? parseD(p[2]) + shift : null }; });
    var P = [K[0]];
    for (var q = 1; q < K.length; q++) {
      var a0 = K[q - 1], b0 = K[q];
      if (!(a0.lat === b0.lat && a0.lon === b0.lon) && G.Nav && G.Nav.path) {
        var path = null;
        try { path = G.Nav.path(a0.lon, a0.lat, b0.lon, b0.lat, 400000); } catch (e) { path = null; }
        if (path && path.length > 2) for (var r = 1; r < path.length - 1; r++) { var lo = ((path[r][0] + 540) % 360) - 180; P.push({ lat: path[r][1], lon: lo, t: null }); }
      }
      P.push(b0);
    }
    var i = 0;
    while (i < P.length - 1) {
      var j = i + 1; while (P[j].t == null) j++;
      var tot = 0, cum = [0];
      for (var k = i + 1; k <= j; k++) { tot += dd([P[k - 1].lat, P[k - 1].lon], [P[k].lat, P[k].lon]); cum.push(tot); }
      for (k = i + 1; k < j; k++) P[k].t = P[i].t + (P[j].t - P[i].t) * (tot ? cum[k - i] / tot : (k - i) / (j - i));
      i = j;
    }
    return (timed[key] = P);
  };
  /** 지금(일수 t) 그 함대의 자리 {lat, lon, heading} — 떠나기 전이나 끝난 뒤면 null */
  SF.posAt = function (ex, t) {
    var sp = SF.span(ex);
    if (t < sp[0] || t > sp[1]) return null;
    var P = SF.track(ex);
    if (t < P[0].t || t > P[P.length - 1].t) return null;
    for (var i = 0; i < P.length - 1; i++) {
      var a = P[i], b = P[i + 1];
      if (t <= b.t) {
        var f = b.t > a.t ? (t - a.t) / (b.t - a.t) : 1;
        var dlon = G.Geo && G.Geo.wrapLon ? G.Geo.wrapLon(b.lon - a.lon) : b.lon - a.lon;
        var hd = (a.lat === b.lat && a.lon === b.lon) ? null : Math.atan2(b.lat - a.lat, dlon);
        return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + dlon * f, heading: hd, wait: hd == null };
      }
    }
    return null;
  };
  function today(frac) { var s = S(); return U.dayIndex(s.date) + (frac || 0); }
  /** 이 탐험이 아직 의미가 있는가 (경쟁자가 이미 발표했으면 끝) */
  function live(ex) {
    var s = S(), d = G.DISC[ex.discs[0]]; if (!d) return false;
    var st = s.disc[d.id];
    if (st && (st.reported || st.announced)) return false;   // 제독이 먼저 알렸으면 그 항해는 그만둔다
    return !(st && st.rival && SF.posAt(ex, today()) == null);
  }
  /** 지금 바다에 나가 있는 탐험 함대 */
  SF.voyages = function () {
    var t = today();
    return G.EXPEDITIONS.filter(function (ex) { return G.DISC[ex.discs[0]] && SF.posAt(ex, t) && live(ex); });
  };
  /** 이 경쟁자가 지금 바다에 있는가 (술집에 나타나지 않게) */
  SF.rivalAtSea = function (d) {
    if (!d || !d.rival) return false;
    var t = today();
    return G.EXPEDITIONS.some(function (ex) { var sp = SF.span(ex); return ex.who === d.rival[2] && t >= sp[0] && t <= sp[1]; });
  };

  // ================================================================ 나라와 선장
  function portsNear(lon, lat, maxD) {
    var out = [];
    G.CITY_DATA.forEach(function (c) {
      if (!c.port || !R.cityExists(c)) return;
      var d = G.Geo.dist(lon, lat, c.lon, c.lat); if (d < maxD) out.push({ c: c, d: d, owner: R.cityOwner(c) });
    });
    return out;
  }
  /** 이 바다에 사는(항구를 가진) 나라를 하나 고른다 — 가깝고 큰 항구일수록 */
  SF.localNation = function (lon, lat) {
    var ps = portsNear(lon, lat, 11).filter(function (x) { return x.owner && x.owner !== '원주민'; });
    if (!ps.length) return null;
    return U.weighted(ps, function (x) { return (1 + (x.c.size || 1)) / (1 + x.d * x.d * 0.15); }).owner;
  };
  /** 새로 나타난 배에 나라·선장·이름표를 붙인다 (sea.js spawnNpcs) */
  SF.decorate = function (n, npcs) {
    var s = S();
    if (n.kind === 'merchant' && !n.nation) n.nation = SF.localNation(n.lon, n.lat) || (G.Ships ? G.Ships.navyNation(n.zone, s.date.y) : null);
    if (n.kind === 'navy' && n.nation && H.hunting(n.nation)) { n.hostile = true; n.hunt = true; }
    if (n.kind === 'merchant' && U.chance(B().mateCaptain)) {
      var m = pickMate(n, npcs || []);
      if (m) n.captain = m;
    }
    n.label = SF.label(n);
    return n;
  };
  /** 가까운 항구에 머물던, 아직 동료가 아닌 항해사가 그 배를 몰고 있다 */
  function pickMate(n, npcs) {
    var s = S(); if (!G.MateMove || !G.MATES) return null;
    var locs = G.MateMove.locs(), y = s.date.y;
    var hired = {}; s.mates.forEach(function (x) { hired[x.id] = 1; });
    var busy = {}; npcs.forEach(function (x) { if (x.captain && x.captain.mate) busy[x.captain.mate] = 1; });
    var cand = G.MATES.filter(function (m) {
      if (hired[m.id] || busy[m.id] || s.flags['gone_' + m.id] || m.witch) return false;
      if (G.Frontier && G.Frontier.mateReady && !G.Frontier.mateReady(m, y)) return false;
      var c = G.CITY_DATA[locs[m.id]]; if (!c || !c.port) return false;
      return G.Geo.dist(n.lon, n.lat, c.lon, c.lat) < 12;
    });
    if (!cand.length) return null;
    var m = U.pick(cand), from = G.CITY_DATA[locs[m.id]];
    var dest = G.MateMove.range(m.id).map(function (id) { return G.CITY_DATA[id]; })
      .filter(function (c) { return c && c.port && c.id !== from.id && R.cityExists(c) && G.Geo.dist(from.lon, from.lat, c.lon, c.lat) > 3; });
    var to = dest.length ? U.pick(dest) : from;
    locs[m.id] = to.id;          // 이 배를 타고 그 항구로 간다 — 그곳 술집에서 다시 만날 수 있다
    return { mate: m.id, from: from.id, to: to.id };
  }
  SF.label = function (n) {
    if (n.exp) return n.exp.who + '의 탐험 함대';
    if (n.kind === 'pirate') return G.Ships.pirateLabel(n.zone);
    if (n.hunt) return (n.nation || '') + (n.privateer ? ' 사략함대' : ' 군함');
    return (n.nation ? n.nation + ' ' : '') + (n.kind === 'merchant' ? '상선' : '함대');
  };

  // ================================================================ 날마다: 추격 함대·탐험 함대를 바다에 띄운다 (sea.js spawnNpcs 앞에서)
  /** 반환: 새로 띄운 배 (없으면 null) */
  SF.spawn = function (npcs) {
    var s = S(), l = s.loc;
    // ① 탐험 함대: 항로가 가까우면 늘 보인다
    var t = today();
    var ex = SF.voyages().filter(function (e) {
      if (npcs.some(function (x) { return x.exp && x.exp.id === e.id; })) return false;
      if (s.flags['expBeat_' + e.id + '_' + SF.delay(e)]) return false;
      var p = SF.posAt(e, t); return p && G.Geo.dist(l.lon, l.lat, p.lon, p.lat) < 7.5;
    })[0];
    if (ex) {
      var p = SF.posAt(ex, t);
      var n = { id: 'ex_' + ex.id, kind: 'navy', exp: ex, nation: ex.nation, lon: p.lon, lat: p.lat, heading: p.heading || 0, n: ex.ships.length, K: 0.4, spd: 1, life: 99,
        hostile: false, zone: G.Ships.zone(p.lon, p.lat), ships: ex.ships.slice() };
      n.label = SF.label(n);
      return n;
    }
    // ② 추격: 적대 10 이상인 나라의 항구가 가까우면
    if (npcs.some(function (x) { return x.hunt; })) return null;
    var b = B(), list = H.list().filter(function (x) { return x.hunt; });
    for (var i = 0; i < list.length; i++) {
      var nat = list[i].n, h = list[i].v;
      if (!portsNear(l.lon, l.lat, b.near).some(function (x) { return x.owner === nat; })) continue;
      if (!U.chance(Math.min(b.huntPmax, b.huntP + (h - b.hunt) * b.huntPk))) continue;
      for (var tries = 0; tries < 8; tries++) {
        var ang = U.rf(0, Math.PI * 2), dist = U.rf(3, 5.5), lon = l.lon + Math.cos(ang) * dist, lat = l.lat + Math.sin(ang) * dist;
        if (!G.Geo.isSea(lon, lat, 1)) continue;
        var cnt = Math.min(5, 1 + Math.floor((h - b.hunt) / 8) + U.ri(0, 1)), zone = G.Ships.zone(lon, lat), K = Math.min(1, 0.35 + h / 60);
        var hn = { id: Math.random().toString(36).slice(2), kind: 'navy', hunt: true, privateer: U.chance(0.55), nation: nat, lon: lon, lat: lat, heading: Math.atan2(l.lat - lat, G.Geo.wrapLon(l.lon - lon)), n: cnt, K: K,
          spd: U.rf(1.25, 1.6), life: 20, hostile: true, zone: zone, ships: G.Ships.enemyTypes('navy', zone, nat, cnt, K, s.date.y) };
        hn.label = SF.label(hn);
        UI.toast('수평선에 ' + hn.label + U.j(hn.label, '이/가').slice(hn.label.length) + ' 나타났다! 우리를 쫓아온다!', 'skull', 4800);
        return hn;
      }
    }
    return null;
  };
  /** 탐험 함대는 날짜에 맞춰 항로 위를 간다 (true면 sea.js의 보통 움직임을 건너뛴다) */
  SF.place = function (n, frac) {
    if (!n.exp) return false;
    var p = SF.posAt(n.exp, today(frac));
    if (!p) { n.gone = true; return true; }
    n.lon = p.lon; n.lat = p.lat; if (p.heading != null) n.heading = p.heading;
    return true;
  };

  // ================================================================ 만남
  /** 먼저 공격했다 (sea.js encounter, 싸움을 고른 뒤) */
  SF.attacked = function (n) {
    if (!n || n.kind === 'pirate' || !n.nation) return;
    var a = B().attack, v = n.exp ? a.explorer : n.kind === 'merchant' ? a.merchant : a.navy;
    H.add(n.nation, v, n.label + U.j(n.label, '을/를').slice(n.label.length) + ' 공격');
  };
  /** 해전이 끝난 뒤 (battle.js finish) */
  SF.afterBattle = function (n, res, lines) {
    var s = S();
    if (!n || !n.exp || res !== 'win') return;
    var ex = n.exp, dl0 = SF.delay(ex);
    s.flags['expBeat_' + ex.id + '_' + dl0] = 1;
    ex.discs.forEach(function (id) { s.flags['delay_' + id] = (s.flags['delay_' + id] || 0) + 1; });
    var msg = ex.who + '의 함대가 크게 부서져 모항으로 되돌아갔다. 항해가 한 해 늦어진다.';
    G.State.log(msg);
    if (lines) lines.push('<b>' + U.esc(msg) + '</b>');
  };
  /** 신호에 답하는 사람 (sea.js hail의 who를 바꾼다) */
  SF.captain = function (n, who) {
    var A = G.Art;
    if (n.exp) return { name: n.exp.who, portrait: A && A.rivalSpec ? A.rivalSpec(n.exp.who) : who.portrait, half: G.Img.chain.rivalHalf(n.exp.who) };
    if (n.captain && n.captain.mate) {
      var m = G.MATE[n.captain.mate];
      if (m) return { name: m.name, portrait: G.Scenes.mateSpec ? G.Scenes.mateSpec(m.id) : (A && A.mateSpec ? A.mateSpec(m.id) : who.portrait), half: G.Img.chain.mateHalf(m.id) };
    }
    return who;
  };
  SF.greet = function (n) {
    if (n.exp) return '「' + n.exp.who + '의 함대요. ' + n.exp.nation + ' 왕실의 깃발 아래 항해 중이오. 무슨 일이오?」';
    if (n.captain && n.captain.mate) { var m = G.MATE[n.captain.mate]; return '「좋은 바람이오! 이 배의 선장 ' + (m ? m.name : '') + '이오. 무슨 일이오?」'; }
    return null;
  };
  SF.canTalk = function (n) { return !!(n.exp || (n.captain && n.captain.mate)); };
  /** 선장과 이야기한다 */
  SF.talk = async function (n, who) {
    var s = S();
    if (n.exp) {
      var ex = n.exp, d = G.DISC[ex.discs[0]], st = s.disc[d.id] || {};
      var fk = 'expTalk_' + ex.id + '_' + SF.delay(ex);
      var lines = '나는 ' + ex.who + '. ' + ex.from + U.j(ex.from, '을/를').slice(ex.from.length) + ' 떠나 ' + ex.goal + ' 길이오.';
      if (st.me) lines += '\n\n…누군가 먼저 그곳에 닿았다는 소문을 들었소. 그래도 내 눈으로 보기 전에는 믿지 않겠소.';
      await UI.say(lines, who);
      if (!s.flags[fk]) {
        s.flags[fk] = 1;
        if (!st.me) {
          await UI.say(d.hint + '\n\n— 이 사람이 먼저 닿으면 「' + d.name + '」의 이름은 그의 것이 된다. (' + (d.rival[0] + SF.delay(ex)) + '년 ' + d.rival[1] + '월 무렵 발표)', G.Scenes.mateSpeaker('first'));
          if (G.Disc.addHint(d.id, 'rival')) UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll', 4200);
        }
        G.Fame.add('so', 5);
      }
      return;
    }
    if (n.captain && n.captain.mate) {
      var m = G.MATE[n.captain.mate], from = G.CITY_DATA[n.captain.from], to = G.CITY_DATA[n.captain.to];
      if (!m) return;
      var first = !s.flags['metSea_' + m.id];
      s.flags['metSea_' + m.id] = (s.flags['metSea_' + m.id] || 0) + 1;
      await UI.say((first ? m.desc + '\n\n' : '') + '지금은 ' + (from ? from.name : '') + '에서 ' + (to ? to.name : '') + U.j(to ? to.name : '', '으로/로').slice(to ? to.name.length : 0) + ' 가는 길이오. ' +
        '일손이 필요하면 ' + (to ? to.name : '그 항구') + '의 술집으로 찾아오시오. 바다에서 만난 인연이니 이야기는 들어 드리리다.', who);
      if (first) G.State.log('바다에서 항해사 ' + m.name + U.j(m.name, '을/를').slice(m.name.length) + ' 만났다. ' + (to ? U.j(to.name, '으로/로') + ' 간다고 한다.' : ''));
    }
  };
  /** 추격 함대에게 배상금을 낸다 → true면 물러간다 */
  SF.pay = async function (n) {
    var s = S(), fee = H.fee(n.nation);
    if (s.player.gold < fee) { UI.toast('배상금을 낼 돈이 모자란다. (금화 ' + U.num(fee) + '닢)', 'coin'); return false; }
    s.player.gold -= fee;
    H.add(n.nation, -B().payCut);
    UI.toast(n.nation + '에 배상금 금화 ' + U.num(fee) + '닢을 치렀다. 함대가 물러간다.', 'coin', 4200);
    G.State.log(n.nation + '에 배상금 ' + U.num(fee) + '닢을 치렀다.');
    return true;
  };
})(window.G = window.G || {});
