/* 엘미나 요새 건설 — 황금 해안의 돌 성 (G.Mina) 2026-10-28 사용자 요청
   「1482년, 포르투갈이 오늘날 가나 해안에 금 교역 거점을 세운다. 이후 대서양 교역과 노예무역의 주요 거점이 된다」
   고아·말라카(js/systems/goamalacca.js)·잉카·아즈텍과 같은 꼴 — 역사 날짜·장소에 제독이 있으면 이야기에 끼어든다.
   역사는 바뀌지 않는다. 성은 1482년 1월~2월에 서고, 금은 리스본으로 흐르고, 1637년 8월 29일 네덜란드의 손에 넘어간다.
   바뀌는 것은 제독이 누구 곁에 섰고, 무엇을 보았고, 무엇을 얻고 잃었는가다.
   ■ 도시: 리스본(0) · 산호르헤(97, 상 조르즈 다 미나 = 엘미나 — cities.js founded 1482, 그 전에는 지도에 없다)
   ■ 흐름 (사람: js/data/elmina.js)
     ① 리스본의 다듬은 돌 (1481.9.1~12.11, 리스본): 부두에 쌓인 다듬은 돌·석회·들보. 아잠부자가 원정대에 들라 한다 — 함께 간다(side 'pt') / 사양한다
        (포르투갈 사람이 아니면 「주앙 왕의 바다에 외국 배는 못 들어간다 — 포르투갈 깃발 아래라면 모를까」)
     ② 카라만사의 대답 (1482.1.19~1.31, 산호르헤 — 누구나): 큰 나무 아래 첫 미사, 금을 두른 우두머리와의 만남.
        「가끔 만나는 벗이 이웃보다 낫다」 — (가) 선물을 더 얹는다(금화) (나) 카라만사의 말이 옳다고 거든다 (다) 지켜본다
     ③ 신성한 바위 (1482.1.21~2.15, 산호르헤 — 누구나): 석공들이 강의 신이 산다는 바위(코코보)를 깬다. 마을 사람들이 몰려온다 —
        (가) 일꾼들을 지킨다(육상전 · 악명) (나) 늦어진 선물을 내 돈으로 먼저 건넨다(금화) (다) 물러선다
     ④ 스무 날의 성벽 (1482.2.11~6.30, 산호르헤 — 누구나): 탑의 첫 층이 섰다. 원정대에 들었으면 몫.
        포르투갈 사람이거나 원정대에 들었으면: 「미나의 첫 금」 상자를 리스본의 국왕께 (1482년 안 — 늦으면 사례 절반)
        아니면: 밤에 아칸 상인이 몰래 금을 판다 — 산다(금 · 악명 · 포르투갈 왕실의 신뢰 −) / 거절
     ⑤ 첫 금 상자 (리스본 — ④에서 받았으면): 국왕 주앙 2세에게 바친다
     ⑥ 돌아오지 않는 문 (1637.9.1~, 산호르헤 — 누구나, 한 번): 네덜란드 서인도 회사의 성. 지하 감옥과 바다로 난 좁은 문.
        (가) 몸값을 치르고 한 가족을 풀어 준다(금화) (나) 떠난다 — 「노예 상인」이면 회사 상관장이 동업자로 맞는다
     소식: 원정대 출항(1481.12.12) · 두 마을 앞바다(1482.1.19) · 스무 날의 성벽(2.10 — 미나의 금 시장 사건 minagold) · 아잠부자가 기다린 배(7.1) ·
           미나의 금이 리스본에(1483.3.15, 시장 사건 lisbongold) · 미나의 도시 특권(1486.1.15) · 금과 바꾸는 사람들(1495.6.1) ·
           네덜란드의 첫 공격(1596) · 엘미나 함락(1637.8.29)
     G.HISTORY의 1482년 한 줄은 날짜(d 19)를 맞추고 창을 띄우지 않게(quiet) 했다 — 창은 이 소식이 띄운다 (일지에는 둘 다 남는다)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/mina_*.webp — 개발노트에 그림 주문
   ■ 조정값: G.Mina.K   ■ 저장: s.mina = { side: 'pt'|'no', met, meet: 'gift'|'friend'|'watch', rock: 'guard'|'pay'|'leave', rockRes,
       walls, gold: 'carry'|'done'|'late'|'no', smug: 'buy'|'no', door: 'redeem'|'leave', friend, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var MN = G.Mina = {};
  function S() { return G.Game && G.Game.state; }
  var LISBON = 0, MINA = 97;
  var K = MN.K = {
    musterFrom: 14810901, musterTo: 14811211, sail: 14811212,
    land: 14820119, meetFrom: 14820119, meetTo: 14820131,
    rockFrom: 14820121, rockTo: 14820215,
    wallsAt: 14820210, wallsFrom: 14820211, wallsTo: 14820630, noshow: 14820701,
    goldDue: 14821231, goldLast: 14831231, goldLisbon: 14830315, charter: 14860115, captives: 14950601,
    dutch1596: 15961015, dutch: 16370829, doorFrom: 16370901,
    giftGold: 500, rockGift: 600, rockFoe: 60, share: 2500, carryReward: 3000, smugQ: 15, smugK: 0.4, redeem: 2400,
    notoRock: 3, notoSmug: 2
  };
  // 미나의 금 — 성이 서자 황금 해안의 금이 싸진다 / 첫 금 배가 리스본에 닿자 이베리아의 금이 싸진다 (시장 사건, js/systems/economy.js)
  var GOLD_EV = { id: 'minagold', name: '미나의 금', need: 'any', years: [9999, 9999], dur: [220, 280], lead: [0, 0], glut: true,
    goods: { gold: 0.78 },
    why: ['{place}의 새 성 앞마당에 아칸 상인들이 금가루 주머니를 들고 줄을 섰다', '{place}에서 천과 놋쇠 대야를 금과 바꾸려는 사람들로 붐빈다 — 금값이 내린다'] };
  var LIS_EV = { id: 'lisbongold', name: '미나의 금', scope: 'area', r: 6, regions: [0], need: 'big', years: [9999, 9999], dur: [150, 220], lead: [0, 0], glut: true,
    goods: { gold: 0.85, ivory: 0.9 },
    why: ['{place}의 「기니·미나 상관」에 황금 해안의 금이 들어와 금값이 내렸다', '{place} 조폐소가 미나의 금으로 크루자두 금화를 찍어 낸다 — 금이 흔해졌다'] };
  if (G.Econ && G.Econ.DEF) { if (!G.Econ.DEF.minagold) G.Econ.DEF.minagold = GOLD_EV; if (!G.Econ.DEF.lisbongold) G.Econ.DEF.lisbongold = LIS_EV; }

  // 소식의 날짜 — 옛 저장을 늦게 불러오면 이미 지난 소식은 알린 것으로 친다
  var NEWS_AT = { sail: K.sail, land: K.land, walls: K.wallsAt, noshow: K.noshow, lisbon: K.goldLisbon, charter: K.charter, captives: K.captives, d1596: K.dutch1596, dutch: K.dutch };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.mina) {
      s.mina = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.mina.told[k] = 1; });
    }
    if (!s.mina.told) s.mina.told = {};
    return s.mina;
  }
  MN.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function isPT() { return S().player.nation === 'PT'; }
  function slaver() { return !!(G.Slave && G.Slave.title && G.Slave.title()); }
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var who = l[0] === 'P' ? me() : l[0] && typeof l[0] === 'object' ? l[0] : l[0] ? H(l[0]) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  // 주앙 2세는 기존 왕실 초상, 나머지 화자는 사건 전용 얼굴·무릎상을 쓴다.
  var KING = { name: '국왕 주앙 2세', lang: 3, rigId: 'mina:joao2',
    portrait: G.Art.withImg(G.Art.npcSpec('mina_joao2', 'king', 'ib', 'm'), ['portraits/sponsors/pt_king_1']),
    half: ['portraits/sponsors/pt_king_1_half'] },
    TRADER = H('mina_trader'), ELDER = H('mina_elder'), FACTOR = H('mina_factor'), MOTHER = H('mina_mother');
  function crownTrust(n) {
    if (!G.Sponsor || !G.SPONSOR) return;
    ['pt_king', 'pt_casaindia'].forEach(function (id) { if (G.SPONSOR[id]) { var r = G.Sponsor.rel(id); if (r.met || n < 0) G.Sponsor.addTrust(r, n); } });
  }
  function notoriety(n, why) {
    var p = S().player; p.notoriety = (p.notoriety || 0) + n;
    UI.toast(why + ' (악명 +' + n + ')', 'skull', 4200);
  }
  function keepsake(id, name, desc) {
    var p = S().player; if (p.items.some(function (x) { return x.id === id; })) return;
    p.items.push({ id: id, kind: 'keepsake', name: name, desc: desc });
  }
  function hasItem(id) { return S().player.items.some(function (x) { return x.id === id; }); }
  function dropItem(id) { var p = S().player; p.items = p.items.filter(function (x) { return x.id !== id; }); }
  function hint(id) { if (G.Disc && G.DISC && G.DISC[id] && !G.Disc.foundByMe(id) && G.Disc.addHint) G.Disc.addHint(id, 'lead:elmina'); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function gold(n) { var s = S(); s.player.gold += n; UI.toast('금화 +' + U.num(n), 'coin', 4200); }
  function econ(type, city) { if (G.Econ && G.Econ.start && G.Econ.DEF && G.Econ.DEF[type]) { try { var e = G.Econ.start(type, city, { k: 1 }); if (e) e.told = 'on'; return e; } catch (er) { console.error(er); } } return null; }
  /** 도시 안에서 뭍의 싸움 — 함대의 선원으로 (고아·잉카의 싸움과 같은 방식) */
  async function fight(name, n, kind) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, { kind: kind, guns: false }); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  /** 짐칸에 금을 싣는다 (이 도시에서 산 몫으로) — 실은 통 수를 돌려준다 */
  function loadGold(q, price) {
    var s = S(), f = s.fleet, cg = f.cargo.gold;
    if (cg) { R.addCargoLot(cg, MINA, q, price); cg.cost = Math.round((cg.cost * cg.q + price * q) / (cg.q + q)); cg.d = Math.round(((cg.d || s.day) * cg.q + s.day * q) / (cg.q + q)); cg.q += q; }
    else { f.cargo.gold = { q: q, cost: price, from: MINA, d: s.day, lots: {} }; f.cargo.gold.lots[MINA] = { q: q, cost: price }; }
    return q;
  }
  function goldRoom() {
    var f = S().fleet;
    if (!f.cargo.gold && Object.keys(f.cargo).length >= R.maxKinds()) return 0;
    return Math.max(0, G.Cargo && G.Cargo.room ? G.Cargo.room('gold') : R.free());
  }

  // ================================================================ 날마다 — 소식
  MN.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!(b.met || b.side === 'pt');
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('sail', met, 'ship', '【미나 원정대】 디오구 드 아잠부자의 함대가 리스본을 떠났다. 카라벨 열 척과 짐배 두 척, 사람은 육백 명 — 그 가운데 석공과 목수가 백 명이다. 배 밑창에는 리스본에서 다듬어 번호를 매긴 돌과 석회, 들보와 기와가 실렸다. 남쪽 황금 해안에 성 하나를 통째로 옮겨 세우러 간다.');
    news('land', true, 'ship', b.side === 'pt'
      ? '【황금 해안】 1월 19일, 아잠부자의 함대가 「두 마을」이라 불리는 고장 앞바다에 닻을 내렸다. 제독의 배도 그 가운데 있다. 바닷가 바위 곶과 강 어귀 사이에 초가지붕들이 모여 있고, 숲 너머에서 북소리가 들려온다.'
      : '【황금 해안】 포르투갈의 디오구 드 아잠부자가 배 열두 척을 이끌고 황금 해안의 「두 마을」 앞바다에 닿았다. 그곳에 돌로 된 성을 쌓겠다고 한다.');
    if (!told.walls && t >= K.wallsAt) {
      told.walls = 1;
      econ('minagold', MINA);
      out.push({ icon: 'castle', history: true, text: b.meet || b.rock
        ? '【스무 날의 성벽】 황금 해안의 바위 곶 위에 탑의 첫 층이 섰다. 스무 날 만이다. 아잠부자는 이 성을 「상 조르즈 다 미나」 — 광산의 성 조르즈라 이름 지었다. 제독도 그 성벽 아래에 있었다. 성 앞마당에는 벌써 금가루를 든 상인들이 줄을 선다.'
        : '【스무 날의 성벽】 황금 해안에 포르투갈의 돌 성 「상 조르즈 다 미나」가 섰다. 리스본에서 다듬어 실어 간 돌로 스무 날 만에 탑의 첫 층을 올렸다고 한다. 뒷날 사람들은 이곳을 「엘미나」 — 광산이라 부른다.' });
    }
    if (!told.noshow && t >= K.noshow && b.side === 'pt' && !b.walls && !b.meet && !b.rock) {
      told.noshow = 1; crownTrust(-3);
      out.push({ icon: 'scroll', history: true, text: '【기다린 배】 황금 해안에서 돌아온 배들의 말로는, 아잠부자 원정대장이 제독의 배를 한참 기다렸다고 한다. 약속한 배가 끝내 오지 않았다는 말이 리스본 궁정에 퍼졌다. (포르투갈 왕실의 신뢰 −3)' });
    }
    if (!told.lisbon && t >= K.goldLisbon) {
      told.lisbon = 1;
      econ('lisbongold', LISBON);
      out.push({ icon: 'coin', history: true, text: '【미나의 금】 상 조르즈 다 미나에서 온 첫 금 배가 리스본에 닿았다. 금가루와 금 고리가 「기니·미나 상관」의 금고로 들어간다. 이베리아의 금값이 내린다. 주앙 2세는 「기니의 주인」이라는 이름을 스스로 붙였다고 한다.' });
    }
    news('charter', met || isPT(), 'scroll', '【미나의 특권】 주앙 2세가 상 조르즈 다 미나에 포르투갈 도시의 특권을 내렸다. 성 안의 포르투갈 사람들은 이제 「도시의 시민」이다. 다만 성 밖 두 마을 사람들의 땅까지 다스린다는 뜻은 아니라고 한다.');
    news('captives', true, 'skull', '【금과 바꾸는 사람들】 포르투갈 배들이 베닌과 「노예 해안」에서 사람들을 실어 와 미나에서 아칸 상인들의 금과 바꾼다고 한다. 숲에서 금을 캐고 짐을 나를 일손이다. 사람을 실어 날라 금을 사는 장사 — 이 해안의 금은 이제 사람의 값과 엮였다.');
    news('d1596', true, 'cannon', '【미나의 성벽】 네덜란드 배들이 상 조르즈 다 미나를 쳤다가 물러났다. 성 둘레 마을 사람들이 포르투갈 편에 서서 싸웠다고 한다. 북쪽 바다의 장사꾼들도 이제 황금 해안의 금을 노린다.');
    news('dutch', true, 'castle', b.door
      ? '【엘미나 함락】 네덜란드 서인도 회사가 상 조르즈 다 미나를 빼앗았다.'
      : '【엘미나 함락】 8월 29일, 네덜란드 서인도 회사의 배 아홉 척과 병사 팔백 명이 사흘 만에 상 조르즈 다 미나를 빼앗았다. 에과푸·아세부의 전사 천여 명이 함께 싸웠다. 성 북쪽 언덕을 먼저 잡자 성은 더 버틸 수 없었다. 이제 엘미나는 회사의 황금 해안 본부 — 금보다 사람을 더 많이 내보내는 대서양 노예 무역의 거점이 된다.');
    return out;
  };

  // ================================================================ ① 리스본의 다듬은 돌 (1481.9~12)
  function musterOpen() { var b = st(), t = today(); return !!(b && !b.side && cityNow() === LISBON && t >= K.musterFrom && t <= K.musterTo); }
  async function muster() {
    var b = st(), pt = isPT(); b.met = 1;
    await withPic('mina_stones', '리스본의 다듬은 돌 (1481)', function () { return play([
      [null, '리스본의 테주 강가. 부두에 네모난 돌덩이가 산처럼 쌓여 있다. 돌마다 숫자와 표식이 새겨졌다. 석회 자루, 굵은 들보, 기와 더미 사이로 석공들이 망치를 두드린다.'],
      ['colombo', '(돌 하나를 쓰다듬으며) 성 하나를 통째로 다듬어 바다 건너로 싣고 간다니. 제노바에서는 들어 본 적 없는 일이오. …어디로 가는 배인지 아시오? 남쪽, 금이 모래처럼 흔하다는 해안이라오.'],
      [null, '돌더미 위에 올라선 사내가 장부를 펼친다. 회색 수염을 짧게 다듬은 늙은 군인이다.'],
      ['azambuja', '나는 디오구 드 아잠부자. 새로 오르신 주앙 왕께서 나를 미나의 원정대장으로 삼으셨소. 황금 해안의 「두 마을」 — 아칸 사람들이 숲에서 금을 들고 나오는 곳에 성을 하나 세우라는 명이오.'],
      ['azambuja', '지금까지는 배가 와서 천과 놋쇠 대야를 풀고 금을 받아 떠나면 그만이었소. 그러면 카스티야 배, 플랑드르 배도 똑같이 와서 금을 받아 가지. 성이 서면 다르오. 그 해안의 금은 포르투갈의 금이 되오.'],
      ['dias', '(짐배 쪽에서 소리친다) 대장님! 석회 쉰 자루가 더 왔습니다. 짐배 둘이 벌써 물에 깊이 잠겼어요 — 더 실으면 모래톱을 못 넘습니다!'],
      ['azambuja', '디아스, 그럼 카라벨에 나눠 싣게. …보시오, 일손도 배도 모자라오. 12월 12일에 떠나오.']
    ]); });
    if (!pt) await play([
      ['azambuja', '한 가지는 알아 두시오. 기니의 바다는 주앙 왕의 바다요. 외국 깃발을 단 배가 그 해안에서 붙잡히면 배는 빼앗기고 선원들은 상어 밥이 되오. …다만 포르투갈 깃발 아래, 내 명을 따르는 배라면 이야기가 다르지.']
    ]);
    await play([['azambuja', '제독, 그대 배에 돌과 사람을 나눠 싣고 함께 가겠소? 성이 서면 몫은 넉넉히 주겠소. 1월 하순에 황금 해안에서 만나는 거요.']]);
    var v = await UI.ask('아잠부자가 미나 원정대에 들어오라고 한다.', [
      { label: pt ? '함께 간다 — 「황금 해안으로」' : '포르투갈 깃발 아래 함께 간다', value: 'pt', icon: 'ship' },
      { label: '남의 해안에 성을 쌓는 일에는 끼지 않겠다', value: 'no' }], me());
    if (v !== 'pt') {
      b.side = 'no';
      await play([
        ['azambuja', '좋을 대로 하시오. 다만 다음에 그 해안에서 만나면, 거기는 이미 포르투갈의 성 앞마당일 거요.'],
        ['colombo', '(돌아서는 제독에게 낮게) 나는 가 볼 생각이오. 적도 가까운 바다는 뜨거워 사람이 못 산다고들 하지 않소? 내 눈으로 보고 싶소.']
      ]);
      G.State.log('리스본에서 아잠부자의 미나 원정대에 들어오라는 청을 사양했다.');
      return;
    }
    b.side = 'pt'; b.joined = today();
    await play([
      ['azambuja', '좋소! 1월 하순까지 황금 해안의 「두 마을」 앞바다로 오시오. 바위 곶과 강 어귀 사이, 초가지붕이 모인 곳이오. 늦으면 돌을 쌓는 데 그대 몫이 줄어드오.'],
      ['colombo', '하하, 같은 배를 타지는 않아도 같은 바다로 가는군. 거기서 봅시다, 선장.']
    ]);
    G.State.log('리스본에서 디오구 드 아잠부자의 미나 원정대에 들었다. 1482년 1월 하순까지 황금 해안(산호르헤)으로 간다.');
    UI.toast('미나 원정대 — 1482년 1월 하순까지 황금 해안(산호르헤)으로', 'scroll', 6000);
    refresh();
  }

  // ================================================================ ② 카라만사의 대답 (1482.1.19~1.31)
  function meetOpen() { var b = st(), t = today(); return !!(b && !b.meet && cityNow() === MINA && t >= K.meetFrom && t <= K.meetTo); }
  async function meet() {
    var b = st(), joined = b.side === 'pt', p = S().player; b.met = 1;
    await withPic('mina_meeting', '카라만사의 대답 (1482.1)', function () { return play([
      [null, joined ? '배에서 내린 포르투갈 사람들이 가장 좋은 옷을 꺼내 입는다. 아잠부자는 금실 수놓은 비단 옷에 금 목걸이를 걸었다. 바닷가 큰 나무에 깃발을 걸고 그 아래에서 미사를 올린다.'
        : '바닷가 큰 나무 아래에 포르투갈 깃발이 걸렸다. 갑옷 입은 병사들이 줄지어 서고, 사제가 미사를 올린다. 제독의 배가 닿은 것은 바로 그 아침이다.'],
      [null, '숲 쪽에서 뿔피리와 북소리가 크게 울린다. 수많은 사람이 일산을 받쳐 든 한 사내를 따라 나온다. 사내의 팔과 다리에는 금 고리가, 목에는 금 사슬이 걸렸고, 수염에는 작은 금 조각들이 매달려 반짝인다.'],
      ['azambuja', '두 마을의 우두머리여. 포르투갈의 왕께서 그대에게 우정을 보내셨소. 왕께서는 이 해안에 집 한 채 — 돌로 된 튼튼한 집을 지어, 그대들의 금과 우리의 천을 안전하게 바꾸고 싶어 하시오. 그 집이 서면 그대들의 적이 감히 이 마을을 넘보지 못할 거요.'],
      ['caramansa', '(한참 말이 없다가) 지금까지 바다에서 온 사람들은 몇 안 되고, 옷은 해지고, 곧 떠났소. 그대들은 다르군. 큰 왕의 사람들이오. 그래서 하는 말이오.'],
      ['caramansa', '가끔 만나는 벗은 오래 벗으로 남소. 그러나 벗이 이웃이 되어 날마다 담 너머로 얼굴을 보면, 언젠가는 다툼이 생기는 법이오. 바다는 가깝고 사납소. 그대들의 배는 바다에 두고, 장사는 지금처럼 하면 안 되겠소?']
    ]); });
    var opts = [
      { label: '선물을 더 얹는다 — 천과 놋쇠 대야 (금화 ' + U.num(K.giftGold) + ')', value: 'gift', icon: 'coin' },
      { label: '「우두머리의 말이 옳다」 — 성 없이 장사만 하자고 거든다', value: 'friend' },
      { label: '두 사람의 말을 지켜본다', value: 'watch' }];
    if (p.gold < K.giftGold) opts.shift();
    var v = await UI.ask('카라만사가 성을 쌓지 말자고 한다.', opts, me());
    if (v === 'gift' && p.gold >= K.giftGold) {
      b.meet = 'gift'; p.gold -= K.giftGold; b.friend = 1; crownTrust(2);
      await play([
        ['P', '(시종들에게 천 꾸러미와 번쩍이는 놋쇠 대야를 건넨다) 이웃이 되면 이런 것을 해마다 볼 수 있을 거요.'],
        ['caramansa', '(대야에 비친 제 얼굴을 들여다보고 웃는다) 바다의 선장은 말 대신 대야로 이야기하는군. …좋소. 그대의 선물은 잊지 않겠소.'],
        ['azambuja', '(제독에게만 들리게) 고맙소. 돈은 돌려주리다 — 성이 서면.']
      ]);
      G.State.log('황금 해안에서 카라만사에게 천과 놋쇠 대야를 선물했다. (금화 −' + U.num(K.giftGold) + ')');
    } else if (v === 'friend') {
      b.meet = 'friend'; b.friend = 1;
      if (joined || isPT()) crownTrust(-4);
      await play([
        ['P', '우두머리의 말에도 일리가 있소. 금은 지금처럼 바닷가에서 바꾸면 되지 않소? 성이 꼭 있어야 하오?'],
        ['azambuja', '(얼굴이 굳는다) …제독. 왕의 명이오. 그대가 정할 일이 아니오.'],
        ['caramansa', '(제독을 오래 바라본다) 바다에서 온 사람 가운데 우리 말을 거드는 이도 있군. 그대 이름을 기억하겠소.'],
        [null, '카라만사가 수염에 매단 작은 금 조각 하나를 떼어 제독의 손바닥에 올려놓는다.']
      ]);
      keepsake('caramansa_gold', '카라만사의 금 조각', '1482년 황금 해안에서 「두 마을」의 우두머리 카라만사가 수염에 매달았던 작은 금 조각. 성을 쌓지 말자는 그의 말을 거든 바다의 선장에게 떼어 주었다.');
      G.State.log('황금 해안에서 성 없이 장사만 하자는 카라만사의 말을 거들었다. 카라만사가 금 조각을 주었다.' + (joined || isPT() ? ' (포르투갈 왕실의 신뢰 −4)' : ''));
    } else {
      b.meet = 'watch';
      G.State.log('황금 해안에서 아잠부자와 카라만사의 만남을 지켜보았다.');
    }
    await play([
      [null, '카라만사는 시종들과 오래 이야기를 나눈다. 해가 기울 무렵, 그가 다시 일어선다.'],
      ['caramansa', '…좋소. 집을 짓도록 하시오. 다만 그 집이 우리 마을을 내려다보지 않기를, 그대들의 약속이 그 돌처럼 무겁기를 바라오.'],
      ['azambuja', '(작게) 이 해안에서 처음 받은 「예」로군. 내일 새벽부터 돌을 내린다.']
    ]);
    hint('folk_akan');
    refresh();
  }

  // ================================================================ ③ 신성한 바위 (1482.1.21~2.15)
  function rockOpen() { var b = st(), t = today(); return !!(b && !b.rock && cityNow() === MINA && t >= K.rockFrom && t <= K.rockTo); }
  async function rock() {
    var b = st(), joined = b.side === 'pt', p = S().player; b.met = 1;
    await withPic('mina_rock', '신성한 바위 (1482)', function () { return play([
      !b.meet ? [null, '황금 해안의 바위 곶. 포르투갈 사람들이 배에서 다듬은 돌을 내리고, 석공들이 곶의 바위를 깎아 성의 터를 고른다. 「두 마을」의 우두머리가 마지못해 허락했다고 한다.'] : null,
      [null, '곶 끝의 커다란 검은 바위에 석공들의 정이 박힌다. 쩡, 쩡. 그 소리에 마을 쪽이 술렁인다.'],
      [ELDER, '안 되오! 그 바위는 코코보 — 강의 신이 사는 곳이오! 우두머리께서도 그 바위만은 건드리지 말라고 하셨소!'],
      ['azambuja', '(석공들에게) 계속하라. 바위 하나 때문에 성을 비틀어 쌓을 수는 없다. 우두머리에게 보낼 선물은 곧 도착한다.'],
      [null, '바위가 둘로 갈라지는 순간, 마을에서 함성이 터진다. 창과 몽둥이를 든 사람들이 바닷가로 달려 나온다. 선물 꾸러미는 아직 배에서 내려지지도 않았다.']
    ]); });
    var opts = [
      { label: '일꾼들을 지킨다 — 칼을 뽑는다', value: 'guard', icon: 'sword' },
      { label: '내 돈으로 선물을 먼저 건넨다 — 「바위의 값을 치르겠소」 (금화 ' + U.num(K.rockGift) + ')', value: 'pay', icon: 'coin' },
      { label: '물러선다 — 남의 다툼이다', value: 'leave' }];
    if (p.gold < K.rockGift) opts.splice(1, 1);
    var v = await UI.ask('마을 사람들이 바위를 깬 석공들에게 몰려온다.', opts, me());
    if (v === 'guard') {
      b.rock = 'guard';
      var res = await fight('두 마을의 사람들', K.rockFoe, 'native');
      b.rockRes = res; b.friend = 0;
      notoriety(K.notoRock, '신성한 바위를 지키려던 사람들에게 칼을 들었다');
      if (res === 'win') {
        if (joined || isPT()) crownTrust(3);
        await play([
          [null, '마을 사람들이 숲으로 물러난다. 바닷가 모래 위에 쓰러진 사람들이 남았다. 그날 밤 포르투갈 병사들이 바닷가 초가 몇 채에 불을 놓았다.'],
          ['azambuja', '…일은 멈추지 않는다. 고맙소, 제독. 그러나 오늘 일은 이 해안이 오래 기억할 거요.']
        ]);
        G.State.log('황금 해안에서 신성한 바위를 깬 석공들을 지켜 마을 사람들과 싸웠다.');
      } else {
        await play([
          [null, '제독의 사람들은 바닷가로 밀려났다. 석공 몇이 쓰러졌다. 뒤늦게 내려진 선물 꾸러미가 우두머리에게 건너가고서야 함성이 잦아들었다.'],
          ['azambuja', '칼보다 천 꾸러미가 빨랐군. …이 해안에서 배운 첫 가르침이오.']
        ]);
        G.State.log('황금 해안에서 신성한 바위 때문에 마을 사람들과 싸우다 밀려났다.');
      }
    } else if (v === 'pay' && p.gold >= K.rockGift) {
      b.rock = 'pay'; p.gold -= K.rockGift; b.friend = 1;
      var so = G.Fame.add('so', 90);
      await play([
        ['P', '(창 앞으로 나서서 천 꾸러미와 놋쇠 그릇을 내려놓는다) 바위를 깬 것은 잘못이오. 값을 치르겠소. 강의 신께 바칠 것이 모자라면 더 가져오겠소.'],
        [ELDER, '(창끝을 내리고 꾸러미를 살핀다) …바다의 선장이 먼저 머리를 숙이는군. 우두머리께 가져가겠소. 신께는 우리가 따로 빌겠소.'],
        [null, '해가 지기 전에 아잠부자의 선물도 마을로 건너갔다. 그날 밤 바닷가에서는 피 대신 야자술이 흘렀다.'],
        ['azambuja', '(제독의 어깨를 두드리며) 내 선물이 늦었소. 그대가 아니었으면 오늘 이 바닷가가 피로 물들었을 거요.']
      ]);
      if (joined || isPT()) crownTrust(2);
      G.State.log('황금 해안에서 신성한 바위를 깬 값을 먼저 치러 싸움을 막았다. (금화 −' + U.num(K.rockGift) + ' · 사교 명성 +' + so + ')');
    } else {
      b.rock = 'leave';
      await play([[null, '제독은 배로 물러났다. 바닷가에서 한참 고함과 비명이 들렸다. 포르투갈 사람 몇이 쓰러졌고, 그날 밤 바닷가 초가 몇 채가 불탔다. 뒤늦게 아잠부자의 선물이 마을로 건너갔다.']]);
      G.State.log('황금 해안에서 신성한 바위를 둘러싼 다툼을 배에서 지켜보았다.');
    }
    refresh();
  }

  // ================================================================ ④ 스무 날의 성벽 (1482.2.11~6.30)
  function wallsOpen() { var b = st(), t = today(); return !!(b && !b.walls && cityNow() === MINA && t >= K.wallsFrom && t <= K.wallsTo); }
  async function walls() {
    var b = st(), joined = b.side === 'pt', p = S().player; b.met = 1; b.walls = 1;
    var early = !!(b.meet || b.rock);
    await withPic('mina_walls', '스무 날의 성벽 (1482.2)', function () { return play([
      [null, '바위 곶 위에 하얀 돌 탑이 섰다. 리스본에서 번호를 매겨 온 돌이 차례로 맞물려 올라갔다. 스무 날 만에 첫 층이 섰고, 그 둘레로 성벽과 작은 성당이 올라간다.'],
      ['azambuja', '상 조르즈 다 미나 — 광산의 성 조르즈. 오늘부터 이 해안의 금은 이 성문을 지나간다. 나는 예순 명과 함께 여기 남소. 나머지 배는 리스본으로 돌아간다.'],
      ['dias', (early ? '선장, 함께 돌을 나른 보람이 있구려. ' : '') + '내 짐배가 첫 소식을 싣고 리스본으로 가오. 다음엔 더 남쪽으로 가 보고 싶소. 이 해안이 어디서 끝나는지 아무도 모르니까.'],
      ['colombo', '(해도에 무언가를 적으며) 적도 가까운 바다는 너무 뜨거워 사람이 못 산다고 했지요? 보시오, 여기 사람들이 이렇게 많이 산다오. 옛 학자들의 말이 틀렸소. …그렇다면 다른 것도 틀렸을지 모르지.']
    ]); });
    if (joined) {
      var share = Math.round(K.share * (early ? 1 : 0.6));
      gold(share); crownTrust(4);
      var ex = G.Fame.add('ex', 60);
      await play([['azambuja', early ? '돌을 나르고 바위 곶에 함께 섰던 몫이오. 약속대로.' : '늦게 왔지만 그래도 돌 몇 개는 그대 배가 실어 왔소. 몫이오.']]);
      G.State.log('상 조르즈 다 미나 성이 섰다. 아잠부자가 원정대의 몫을 주었다. (금화 +' + U.num(share) + ' · 모험 명성 +' + ex + ')');
    }
    if (joined || isPT()) {
      await play([
        [null, '성 앞마당에서 아칸 상인들이 금가루를 작은 놋쇠 저울에 단다. 아잠부자가 가죽 띠로 묶은 작은 상자 하나를 들고 온다.'],
        ['azambuja', '미나의 첫 금이오. 리스본의 국왕 폐하께 가져가 주겠소? 이 해안에 성이 섰다는 것을 폐하께서 손으로 만져 보시게. 올해 안에 닿으면 폐하께서 크게 기뻐하실 거요.']
      ]);
      var v = await UI.ask('아잠부자가 「미나의 첫 금」 상자를 리스본의 국왕께 가져가 달라고 한다.', [
        { label: '받는다 — 올해 안에 리스본으로', value: 'carry', icon: 'chest' },
        { label: '사양한다', value: 'no' }], me());
      if (v === 'carry') {
        b.gold = 'carry';
        keepsake('mina_firstgold', '미나의 첫 금 상자', '1482년 황금 해안의 상 조르즈 다 미나 성에서 처음 거둔 금. 아잠부자가 리스본의 국왕 주앙 2세께 전해 달라며 맡겼다. 가죽 띠에 성주의 봉인이 찍혀 있다.');
        UI.toast('미나의 첫 금 상자 — 1482년 안에 리스본의 국왕께', 'scroll', 6000);
        G.State.log('상 조르즈 다 미나에서 「미나의 첫 금」 상자를 맡았다. 1482년 안에 리스본의 국왕께 전한다.');
      } else { b.gold = 'no'; G.State.log('상 조르즈 다 미나에서 첫 금 상자를 맡아 달라는 청을 사양했다.'); }
    } else {
      await play([
        ['azambuja', '외국 깃발이로군. 성이 선 것을 보았으면 이제 떠나시오. 내일 아침에도 이 앞바다에 있으면 우리 카라벨이 그대 배를 손님으로 맞지는 않을 거요.'],
        [null, '그날 밤. 배 옆으로 통나무배 한 척이 소리 없이 다가온다. 노를 젓는 사내가 작은 가죽 주머니를 흔들어 보인다. 안에서 사각사각 금가루 소리가 난다.'],
        [TRADER, '성 사람들은 천 한 필에 금을 너무 많이 달라 하오. 바다의 선장, 그대는 어떻소? 성 몰래, 오늘 밤만.']
      ]);
      var room = goldRoom(), price = Math.max(1, Math.round(((G.GOOD.gold && G.GOOD.gold.p) || 300) * K.smugK)), q = Math.min(K.smugQ, room, Math.floor(p.gold / price));
      var opts = [];
      if (q > 0) opts.push({ label: '성 몰래 금을 산다 — 금 ' + q + '통 (금화 ' + U.num(q * price) + ')', value: 'buy', icon: 'coin' });
      opts.push({ label: q > 0 ? '거절한다 — 포르투갈 카라벨과 다투고 싶지 않다' : '실을 곳도 돈도 없다 — 돌려보낸다', value: 'no' });
      var v2 = await UI.ask('아칸 상인이 밤에 몰래 금을 팔겠다고 한다.', opts, me());
      if (v2 === 'buy' && q > 0) {
        b.smug = 'buy'; p.gold -= q * price; loadGold(q, price); b.friend = 1;
        crownTrust(-6);
        notoriety(K.notoSmug, '포르투갈 왕의 바다에서 몰래 금을 샀다');
        await play([[TRADER, '(주머니를 하나씩 건네며) 좋은 밤이오. 성 사람들에게는 바다에서 물고기를 샀다고 하시오.']]);
        G.State.log('상 조르즈 다 미나 앞바다에서 밤에 아칸 상인에게 몰래 금 ' + q + '통을 샀다. (금화 −' + U.num(q * price) + ')');
      } else { b.smug = 'no'; G.State.log('상 조르즈 다 미나 앞바다에서 몰래 금을 팔겠다는 아칸 상인을 돌려보냈다.'); }
    }
    refresh();
  }

  // ================================================================ ⑤ 첫 금 상자 (리스본)
  function deliverOpen() { var b = st(), t = today(); return !!(b && b.gold === 'carry' && cityNow() === LISBON && t <= K.goldLast && hasItem('mina_firstgold')); }
  async function deliver() {
    var b = st(), t = today(), late = t > K.goldDue;
    dropItem('mina_firstgold');
    var rw = Math.round(K.carryReward * (late ? 0.5 : 1));
    b.gold = late ? 'late' : 'done';
    await withPic('mina_king', '미나의 첫 금 (리스본)', function () { return play([
      [null, '리스본 궁. 젊은 왕이 가죽 띠를 풀고 상자를 연다. 금가루와 작은 금 고리들이 촛불에 번쩍인다. 신하들 사이에서 숨소리가 새어 나온다.'],
      [KING, late ? '…늦었군. 아잠부자의 짐배가 벌써 소식을 가져왔소. 그래도 이 금은 내 손으로 처음 만져 보는 미나의 금이오.'
        : '아잠부자의 성이 섰다는 말은 들었지만, 이렇게 손에 쥐어 보니 다르군. 이것이 미나의 금이오. 이 금으로 더 남쪽으로 배를 보내겠소 — 이 바다의 끝이 어딘지 알아낼 때까지.'],
      [KING, '이 금은 「기니·미나 상관」의 금고로 들어가 크루자두 금화가 될 거요. 그대에게도 몫을 주겠소.']
    ]); });
    gold(rw); crownTrust(late ? 2 : 6);
    var so = G.Fame.add('so', late ? 40 : 100);
    G.State.log('리스본에서 국왕 주앙 2세께 「미나의 첫 금」 상자를 바쳤다' + (late ? ' (늦게)' : '') + '. (금화 +' + U.num(rw) + ' · 사교 명성 +' + so + ')');
    refresh();
  }

  // ================================================================ ⑥ 돌아오지 않는 문 (1637.9~)
  function doorOpen() { var b = st(), t = today(); return !!(b && !b.door && cityNow() === MINA && t >= K.doorFrom); }
  async function door() {
    var b = st(), p = S().player, sl = slaver(); b.met = 1;
    await withPic('mina_door', '돌아오지 않는 문 (엘미나)', function () { return play([
      [null, '엘미나 성. 탑 위에 네덜란드 서인도 회사의 깃발이 걸렸다. 성 북쪽 언덕 위에는 새 보루가 올라간다. 성 앞마당의 놋쇠 저울은 그대로지만, 이제 저울 위에 오르는 것은 금만이 아니다.'],
      [FACTOR, sl ? '아, 이 바다에서 이름난 분이로군! 같은 장사를 하는 사람끼리 반갑소. 아래층 창고를 보여 드리지 — 이번 배에 실을 물건이 넉넉하오.'
        : '회사의 성에 잘 왔소. 금도 있고, 상아도 있소. 그리고… 브라질과 카리브의 농장에서 가장 비싸게 팔리는 것도 있지. 아래층을 보여 드리겠소.'],
      [null, '돌계단을 내려간다. 창 하나 없는 지하 방. 숨이 막힐 듯한 냄새. 어둠 속에 수백 명이 쇠사슬에 묶여 앉아 있다. 맨 안쪽 벽에 사람 하나가 겨우 지나갈 만한 좁은 문이 바다 쪽으로 나 있다.'],
      [FACTOR, '저 문을 지나면 바로 배요. 저 문으로 나간 사람은 아무도 돌아오지 않소. 그래서 저 문을 부르는 이름도 있지만… 장사하는 사람이 굳이 입에 올릴 말은 아니오.'],
      [MOTHER, '(제독의 옷자락을 붙든다. 품에 아이 둘이 매달려 있다) …바다 너머로 가면 우리는 다시 숲을 못 보오. 이 아이들만이라도….']
    ]); });
    var opts = [];
    if (p.gold >= K.redeem) opts.push({ label: '상관장에게 몸값을 치르고 이 가족을 풀어 준다 (금화 ' + U.num(K.redeem) + ')', value: 'redeem', icon: 'coin' });
    opts.push({ label: p.gold >= K.redeem ? '돌아선다' : '가진 돈으로는 어찌할 수 없다 — 돌아선다', value: 'leave' });
    var v = await UI.ask('쇠사슬에 묶인 여인이 아이들을 내민다.', opts, me());
    if (v === 'redeem' && p.gold >= K.redeem) {
      b.door = 'redeem'; p.gold -= K.redeem;
      var so = G.Fame.add('so', 120);
      await play([
        [FACTOR, '(어깨를 으쓱하며 장부에 적는다) 셋 값으로는 넉넉하구려. 회사로서는 손해 볼 것 없소. …다만 이 문 앞에는 내일도 사람이 찰 거요.'],
        [null, '쇠사슬이 풀린다. 여인은 아이들을 안고 성문 밖, 두 마을 쪽으로 걸어간다. 한 번도 뒤를 돌아보지 않는다.'],
        [null, sl ? '배로 돌아온 제독에게 부관이 말없이 장부를 내민다. 지난 항해에 실어 나른 「물건」의 수가 적혀 있다.' : '배로 돌아오는 길, 성 아래 바다에서 회사의 배 한 척이 닻을 올린다. 그 배의 짐칸이 무엇으로 찼는지 제독은 이제 안다.']
      ]);
      G.State.log('엘미나 성의 지하 감옥에서 몸값을 치르고 한 어머니와 두 아이를 풀어 주었다. (금화 −' + U.num(K.redeem) + ' · 사교 명성 +' + so + ')');
    } else {
      b.door = 'leave';
      await play([[null, '제독은 돌계단을 올라 햇빛 속으로 나왔다. 등 뒤에서 쇠사슬 소리가 오래 들렸다.']]);
      G.State.log('엘미나 성의 지하 감옥과 바다로 난 좁은 문을 보았다.');
    }
    refresh();
  }

  // ================================================================ 도시에 들어설 때 · 수첩
  MN.pending = function () {
    var s0 = S(); if (!s0) return false;
    return deliverOpen() || musterOpen() || meetOpen() || rockOpen() || wallsOpen() || doorOpen();
  };
  MN.check = async function () {
    if (MN._busy) return false; MN._busy = true;
    MN.evDay = U.dayIndex(S().date);
    try {
      if (deliverOpen()) await deliver();
      else if (musterOpen()) await muster();
      else if (doorOpen()) await door();
      else {
        // 황금 해안에서는 같은 입항에 겹친 장면을 차례로 — 만남 → 바위 → 성벽
        if (meetOpen()) await meet();
        if (rockOpen()) await rock();
        if (wallsOpen()) await walls();
      }
    } catch (e) { console.error(e); }
    MN._busy = false;
    return true;
  };
  MN.html = function () {
    var s0 = S(), b = s0 && s0.mina; if (!b) return '';
    var t = today(), li = [];
    if (b.side === 'pt' && !b.meet && !b.rock && !b.walls && t <= K.wallsTo) li.push(t <= K.meetTo ? '1482년 1월 하순 황금 해안(산호르헤) — 아잠부자의 원정대가 「두 마을」 앞바다에 닿는다' : '1482년 6월까지 황금 해안(산호르헤) — 아잠부자가 기다린다');
    if (b.gold === 'carry' && t <= K.goldLast) li.push('「미나의 첫 금」 상자 — ' + (t <= K.goldDue ? '1482년 안에' : '늦었지만') + ' 리스본의 국왕께');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">황금 해안의 돌 성 — 아잠부자</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._minaHtml) { G.Court._minaHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + MN.html(); }; }
  MN._t = { muster: muster, meet: meet, rock: rock, walls: walls, deliver: deliver, door: door };
})(window.G = window.G || {});
