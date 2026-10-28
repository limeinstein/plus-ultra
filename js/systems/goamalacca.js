/* 포르투갈의 고아·말라카 점령 — 인도양의 열쇠 (G.GoaMal) 2026-10-28 사용자 요청 「포르투갈의 고아·말라카 점령 이벤트로 만들어줘」
   잉카(js/systems/incafall.js)·아즈텍(js/systems/aztec.js)과 같은 꼴 — 역사 날짜·장소에 제독이 있으면 이야기에 끼어든다.
   역사는 바뀌지 않는다. 고아는 1510년 3월에 열리고 5월에 빼앗기고 11월 25일(성 카타리나의 날)에 다시 떨어진다. 말라카는 1511년 8월 24일에 무너진다.
   바뀌는 것은 제독이 누구 곁에 섰고, 무엇을 보았고, 무엇을 얻고 잃었는가다.
   ■ 흐름 (사람: js/data/goamalacca.js)
     ① 코친의 새 총독 (1509.11.4~1510.2.20, 코친·카나놀): 알부케르크와 해상 무사 티모자. 「고아를 치자」 — 함대에 들어간다(side 'pt') / 사양한다
     ② 고아의 열쇠 (1510.2.21~5.29, 고아): 성이 싸우지 않고 열린다(3.4) · 티모자가 타나다르로. 아직 고르지 않았으면 여기서도 들어갈 수 있다
     ③ 만도비 강의 우기 (1510.5.30~8.15, 고아 — 누구나): 아딜 샤가 고아를 되찾고, 총독의 함대는 장마에 강 어귀에 갇혀 굶주린다
        (가) 밤에 봉쇄를 뚫고 식량을 건넨다 (나) 아딜 샤의 사절을 태워 강화를 전한다 — 「마지막 포도주 통」 (다) 물러난다
     ④ 성 카타리나의 날 (1510.10.1~11.25 — 카나놀·코친에서 모이는 함대에 들거나, 11.19~25 고아에 바로): 포르투갈 편(육상전) / 비자푸르 편(육상전) / 물러난다
        포르투갈 편이 이기면 사흘의 학살 — (가) 약탈에 끼어든다(악명) (나) 무슬림 가족들을 배에 숨긴다 (다) 배로 돌아간다
     ⑤ 말라카의 인질 (1509.9.11~1511.6.30, 말라카 — 누구나): 클링 상인 니나 차투가 붙잡힌 루이 드 아라우주의 편지를 내민다
        (가) 총독에게 전한다(편지 — 포르투갈 항구 코친·카나놀·고아에서 전하면 말라카의 수비가 30% 약해진다) (나) 술탄의 벤다하라에게 넘긴다 (다) 거절한다
     ⑥ 말라카 공방 (1511.7.1~8.24, 말라카 — 누구나): 다리와 전투 코끼리. 포르투갈 편(육상전 · 이기면 몫, 이어서 약탈 / 클링·중국 거리를 지킨다) /
        술탄 편(아흐마드 샤의 코끼리 부대와 다리를 지키고 왕실 가족을 빈탄으로 — 술탄의 크리스) / 중국 정크선과 거래한다 / 물러난다
     ⑦ 바다의 꽃 (1511.8.25~11.19, 말라카 — ⑥에서 포르투갈 편에 섰으면): 낡은 플로르 드 라 마르 호에 싣는 술탄의 보물.
        「그 배는 썩었다」며 상자 몇 개를 내 배에 나눠 싣자고 하면 — 11.20 침몰 소식 뒤 코친에 닿은 유일한 보물로 사례를 받는다
     소식: 캘리컷 공격 실패(1510.1.3) · 고아 첫 점령(3.4) · 고아를 잃다(5.31) · 만도비 강 탈출(8.16) · 고아 재점령(11.25) · 사티 금지와 혼인 정책(12.15) ·
           말라카 함락(1511.8.24) · 플로르 드 라 마르 침몰(11.20 — 1512년부터 난파선 발견물 단서) · 말라카의 향료가 리스본에(1512.6, 시장 사건 malaccaspice) ·
           알부케르크의 죽음(1515.12.16)
     G.HISTORY의 고아(1510.11)·말라카(1511.8) 한 줄은 날짜(d)를 맞추고 창을 띄우지 않게(quiet) 했다 — 창은 이 소식이 띄운다 (일지에는 둘 다 남는다)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/goa_*.webp · malacca_*.webp — 개발노트에 그림 주문
   ■ 조정값: G.GoaMal.K   ■ 저장: s.goaMal = { side: 'pt'|'no', met, first, winter: 'feed'|'envoy'|'leave', retake: 'pt'|'bij'|'leave', retakeRes, sack: 'loot'|'shelter'|'ships',
       letter: 'carry'|'given'|'late'|'sultan'|'no', mal: 'pt'|'sultan'|'junk'|'leave', malRes, malSack: 'loot'|'protect', flor: 'carry'|'no', friend, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var GM = G.GoaMal = {};
  function S() { return G.Game && G.Game.state; }
  var GOA = 150, CANNANORE = 151, CALICUT = 152, COCHIN = 154, MALACCA = 160, LISBON = 0;
  var K = GM.K = {
    cochinFrom: 15091104, cochinTo: 15100220, calicut: 15100103,
    firstFrom: 15100221, firstFall: 15100304, firstTo: 15100529, lost: 15100531,
    winterFrom: 15100530, winterTo: 15100815, escape: 15100816,
    musterFrom: 15101001, musterTo: 15101118, assaultFrom: 15101119, retake: 15101125, sati: 15101215,
    hostFrom: 15090911, hostTo: 15110630,
    siegeFrom: 15110701, malFall: 15110824, florFrom: 15110825, florTo: 15111119, florSink: 15111120,
    spiceAt: 15120601, death: 15151216,
    feedFood: 30, envoyGold: 800, firstGift: 1500, goaShare: 6000, plunder: 3000, malShare: 9000, malLoot: 3500, junkGold: 1500, florReward: 4500,
    goaFoe: 95, bijFoe: 80, malFoe: 110, sultanFoe: 70, letterCut: 0.7, letterLate: 0.85,
    notoSack: 6, notoLoot: 4
  };
  // 말라카의 향료가 리스본으로 — 정향·육두구가 흔해진다 (시장 사건, js/systems/economy.js)
  var SPICE_EV = { id: 'malaccaspice', name: '말라카의 향료', scope: 'area', r: 6, regions: [0], need: 'big', years: [9999, 9999], dur: [150, 220], lead: [0, 0], glut: true,
    goods: { clove: 0.72, nutmeg: 0.72, pepper: 0.86, cinnamon: 0.88 },
    why: ['{place}에 말라카에서 온 정향과 육두구가 산처럼 내려져 향료 값이 떨어졌다', '{place}의 인도 상관(카자 다 인디아)이 말라카 향료를 풀어 정향·육두구 값이 내려간다'] };
  if (G.Econ && G.Econ.DEF && !G.Econ.DEF.malaccaspice) G.Econ.DEF.malaccaspice = SPICE_EV;

  // 소식의 날짜 — 옛 저장을 늦게 불러오면 이미 지난 소식은 알린 것으로 친다
  var NEWS_AT = { calicut: K.calicut, goa1: K.firstFall, lost: K.lost, escape: K.escape, goa2: K.retake, sati: K.sati, mal: K.malFall, flor: K.florSink, spice: K.spiceAt, death: K.death };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.goaMal) {
      s.goaMal = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.goaMal.told[k] = 1; });
    }
    if (!s.goaMal.told) s.goaMal.told = {};
    return s.goaMal;
  }
  GM.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function cityObj(id) { return G.CITY_DATA && G.CITY_DATA[id]; }
  function ownerIs(id, nat) { var c = cityObj(id); return !!(c && R.cityOwner && R.cityOwner(c) === nat); }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function isPT() { return S().player.nation === 'PT'; }
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var who = l[0] === 'P' ? me() : l[0] && typeof l[0] === 'object' ? l[0] : l[0] ? H(l[0]) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  // 이름 없는 사람
  var ENVOY = H('goa_envoy'), JUNK = H('malacca_junk'), BENDAHARA = H('malacca_bendahara');
  function crownTrust(n) {
    if (!G.Sponsor || !G.SPONSOR) return;
    ['pt_king', 'pt_india', 'pt_casaindia'].forEach(function (id) { if (G.SPONSOR[id]) { var r = G.Sponsor.rel(id); if (r.met || n < 0) G.Sponsor.addTrust(r, n); } });
  }
  function notoriety(n, why) {
    var p = S().player; p.notoriety = (p.notoriety || 0) + n;
    UI.toast(why + ' (악명 +' + n + ')', 'skull', 4200);
  }
  function keepsake(id, name, desc) {
    var p = S().player; if (p.items.some(function (x) { return x.id === id; })) return;
    p.items.push({ id: id, kind: 'keepsake', name: name, desc: desc });
  }
  function dropItem(id) { var p = S().player; p.items = p.items.filter(function (x) { return x.id !== id; }); }
  function hint(id) { if (G.Disc && G.DISC && G.DISC[id] && !G.Disc.foundByMe(id) && G.Disc.addHint) G.Disc.addHint(id, 'lead:goamalacca'); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function gold(n) { var s = S(); s.player.gold += n; UI.toast('금화 +' + U.num(n), 'coin', 4200); }
  /** 도시 안에서 뭍의 싸움 — 함대의 선원으로 (잉카의 싸움과 같은 방식) */
  async function fight(name, n, kind, guns) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, { kind: kind, guns: guns !== false }); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }

  // ================================================================ 날마다 — 소식
  GM.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!(b.met || b.side === 'pt');
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('calicut', met, 'cannon', '【캘리컷】 원수 페르난두 코티뉴가 이끈 포르투갈군이 캘리컷의 자모린 궁을 쳤다가 크게 졌다. 원수는 전사했고, 알부케르크 총독도 화살과 돌에 맞아 실려 나왔다고 한다.');
    news('goa1', true, 'castle', '【고아】 알부케르크 총독의 함대가 만도비 강을 거슬러 올라가자, 비자푸르의 고아가 싸우지 않고 성문을 열었다. 포르투갈 깃발이 아딜 샤의 궁에 올랐다.');
    news('lost', true, 'skull', b.side === 'pt'
      ? '【고아를 잃다】 어린 술탄 이스마일 아딜 샤의 대군이 몰려와, 총독은 밤에 성을 버리고 배로 물러났다. 그런데 장마가 시작되어 강 어귀의 모래톱을 넘을 수 없다. 함대가 만도비 강에 갇혔다.'
      : '【고아를 잃다】 비자푸르의 아딜 샤가 대군을 이끌고 고아를 되찾았다. 포르투갈 함대는 장마철 만도비 강에 갇혔다고 한다.');
    news('escape', met, 'ship', '【만도비 강】 8월 15일, 장마가 걷히자 알부케르크의 함대가 마침내 강 어귀를 빠져나왔다. 석 달 가까이 쥐와 가죽까지 삶아 먹으며 버텼다고 한다.');
    news('goa2', true, 'castle', b.retake === 'pt' && b.retakeRes === 'win'
      ? '【성 카타리나의 날】 11월 25일, 고아가 다시 포르투갈의 손에 떨어졌다. 그날 제독도 성벽 위에 있었다. 알부케르크는 이 도시를 인도 총독령의 서울로 삼겠다고 한다.'
      : '【성 카타리나의 날】 11월 25일, 알부케르크가 서른 척 넘는 함대로 고아를 다시 쳐서 빼앗았다. 비자푸르의 수비대는 강 건너 본토로 물러났다. 고아는 이제 포르투갈령 인도의 서울이다.');
    news('sati', met, 'scroll', '【고아의 새 법】 알부케르크가 고아에서 남편을 따라 아내를 불태우는 사티를 금했다. 또 포르투갈 사내들이 이 땅 여인과 혼인하면 땅과 돈을 주겠다고 한다. 「이 도시를 포르투갈 사람과 이 땅 사람이 함께 사는 곳으로 만들겠다」는 것이다.');
    news('mal', true, 'castle', b.mal === 'pt' && b.malRes === 'win'
      ? '【말라카 함락】 8월 24일, 말라카가 무너졌다. 제독의 사람들도 다리 위에 있었다. 술탄 마흐무드 샤는 남쪽으로 달아났고, 알부케르크는 술탄의 모스크 돌로 요새를 쌓기 시작했다.'
      : b.mal === 'sultan'
        ? '【말라카 함락】 8월 24일, 말라카가 포르투갈의 손에 떨어졌다. 제독이 태워 보낸 왕실 사람들은 무사히 남쪽 섬에 닿았다고 한다. 동방 바다의 목은 이제 포르투갈이 쥐었다.'
        : '【말라카 함락】 8월 24일, 알부케르크가 말라카를 빼앗았다. 술탄 마흐무드 샤는 남쪽으로 달아났다. 인도양과 중국 바다를 잇는 해협의 목이 포르투갈의 손에 들어갔다.');
    if (!told.flor && t >= K.florSink && (met || b.mal)) {
      told.flor = 1;
      var carried = b.flor === 'carry';
      if (carried) { s.player.gold += K.florReward; crownTrust(6); var so0 = G.Fame.add('so', 80); G.State.log('플로르 드 라 마르 호가 가라앉은 뒤, 말라카의 보물 가운데 제독의 배에 나눠 실은 상자만 코친에 닿았다. 총독이 사례했다. (금화 +' + U.num(K.florReward) + ' · 사교 명성 +' + so0 + ')'); }
      out.push({ icon: 'skull', history: true, text: carried
        ? '【바다의 꽃】 말라카의 보물을 실은 플로르 드 라 마르 호가 수마트라 앞바다에서 폭풍을 만나 둘로 부러져 가라앉았다. 총독은 뗏목으로 겨우 살아났다. …말라카에서 제독의 배에 나눠 실은 상자들만이 코친에 닿았다. 총독이 금화 ' + U.num(K.florReward) + '닢으로 사례했다.'
        : '【바다의 꽃】 말라카에서 거둔 술탄의 보물을 실은 플로르 드 라 마르 호가 수마트라 북동쪽 앞바다에서 폭풍을 만나 가라앉았다. 알부케르크 총독은 뗏목으로 겨우 살아났다고 한다. 보물은 지금도 바다 밑에 있다.' });
    }
    // 가라앉은 자리의 이야기 — 난파선 발견물은 1512년부터 찾을 수 있다 (js/data/seadisc.js built 1512)
    if (!told.florHint && t >= 15120101 && (met || b.mal)) { told.florHint = 1; hint('flordelamar'); }
    if (!told.spice && t >= K.spiceAt) {
      told.spice = 1;
      if (G.Econ && G.Econ.start && G.Econ.DEF && G.Econ.DEF.malaccaspice) { try { var e = G.Econ.start('malaccaspice', LISBON, { k: 1 }); if (e) e.told = 'on'; } catch (er) { console.error(er); } }
      out.push({ icon: 'coin', history: true, text: '【말라카의 향료】 말라카를 거쳐 온 첫 정향·육두구 배가 리스본에 닿았다. 이베리아의 향료 값이 뚝 떨어진다. 베네치아 상인들은 알렉산드리아로 오는 향료가 줄었다며 한숨을 쉰다.' });
    }
    news('death', true, 'skull', b.side === 'pt' || b.retake === 'pt' || b.mal === 'pt'
      ? '【알부케르크의 죽음】 호르무즈에서 돌아오던 알부케르크 총독이 고아 앞바다의 배 위에서 숨을 거두었다. 자리를 빼앗겼다는 소식을 들은 뒤였다. 「사람들 때문에 국왕께 미움받고, 국왕 때문에 사람들에게 미움받는구나.」 …함께 고아의 성벽에 섰던 제독은 그 말을 오래 곱씹었다.'
      : '【알부케르크의 죽음】 포르투갈령 인도 총독 아폰수 드 알부케르크가 고아 앞바다의 배 위에서 숨을 거두었다. 고아·말라카·호르무즈 — 인도양의 세 열쇠를 쥔 사람이었다.');
    return out;
  };

  // ================================================================ ① 코친의 새 총독 (1509.11~1510.2)
  function cochinOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.side && (c === COCHIN || c === CANNANORE) && t >= K.cochinFrom && t <= K.cochinTo); }
  async function cochin() {
    return withPic('goa_council', '코친의 새 총독', cochinTalk);
  }
  async function cochinTalk() {
    var b = st(), t = today(), pt = isPT(); b.met = 1;
    var where = cityNow() === COCHIN ? '코친' : '카나놀';
    if (t < K.calicut) await play([
      [null, where + '의 포르투갈 요새. 부두에 쌓인 후추 자루 사이로 갑옷 입은 병사들이 오간다. 흰 수염이 가슴까지 내려오는 노인이 해도를 펼쳐 놓고 있다.'],
      ['albuquerque', (pt ? '포르투갈 배로군. 잘 왔소.' : '외국 깃발이로군. 상관없소. 이 바다에서는 대포를 가진 배가 다 친구요.') + ' 나는 아폰수 드 알부케르크. 알메이다 부왕이 드디어 자리를 내주어, 이제 내가 인도의 총독이오.'],
      ['albuquerque', '새해가 밝으면 캘리컷을 친다. 자모린은 우리 상관을 불태우고 우리 사람들을 죽였소. 원수 코티뉴 경이 리스본에서 군사를 이끌고 왔지. 그 오만한 궁을 무너뜨리고 나면 —'],
      ['magellan', '(해도 너머에서 고개를 들고) 총독 각하, 캘리컷을 친다 한들 후추가 더 나오지는 않습니다. 이 바다에는 우리 배가 늘 머물 항구가 필요합니다.'],
      ['albuquerque', '마가야네스, 그대는 젊은데 말은 늙었군. …옳은 말이오. 요새 하나로는 모자라. 이 바다를 쥐려면 열쇠가 필요하오. 홍해의 아덴, 페르시아만의 호르무즈, 그리고 동쪽 끝 말라카.']
    ]);
    else await play([
      [null, where + '의 포르투갈 요새. 붕대를 감은 병사들이 성벽 그늘에 누워 있다. 캘리컷에서 돌아온 사람들이다.'],
      ['albuquerque', '(왼팔에 붕대를 감은 채) 캘리컷은 졌소. 코티뉴 경은 자모린의 궁 안뜰에서 죽었지. 우리는 그 궁에서 약탈할 것을 고르느라 싸울 때를 놓쳤소. …다시는 그런 짓을 하지 않겠소.'],
      [null, '그때 부두에서 고함이 들린다. 날렵한 배 몇 척에서 흰 터번을 쓴 사내들이 내린다. 앞장선 사내의 허리에서 굽은 칼이 번쩍인다.'],
      ['timoja', '총독 나리! 호나바르의 티모자요. 비자야나가르 왕의 바다에서 배를 모는 사람이지. 좋은 소식을 가져왔소 — 고아요.'],
      ['timoja', '고아의 주인 유수프 아딜 칸(사바이우)이 죽었소. 아들은 아직 어리고, 성에는 군사가 얼마 없지. 고아 사람들은 무슬림 장수들의 세금에 넌더리가 났소. 지금 강을 거슬러 올라가면 성문이 열릴 거요. 내가 길잡이를 하겠소.'],
      ['albuquerque', '고아… 데칸의 말 시장이 있는 섬이지. 아라비아·페르시아의 말이 다 그리로 들어가 비자야나가르와 비자푸르로 팔려 나간다. 그 섬을 쥐면 이 땅의 왕들이 모두 우리에게 말을 사러 오겠군.']
    ]);
    await play([['albuquerque', (t < K.calicut ? '캘리컷 다음은 고아가 될지도 모르오. ' : '') + '제독, 그대 배와 사람들이 필요하오. 우리 함대와 함께 가겠소? 성이 열리면 몫은 넉넉히 주겠소.']]);
    var v = await UI.ask('알부케르크 총독이 함대에 들어오라고 한다.', [
      { label: '함께 간다 — 「고아로」', value: 'pt', icon: 'ship' },
      { label: '남의 땅을 빼앗는 일에는 끼지 않겠다', value: 'no' }], me());
    if (v !== 'pt') {
      b.side = 'no';
      await play([['albuquerque', '좋을 대로. 이 바다는 넓으니 또 만나겠지. 다만 기억해 두시오 — 다음에 만날 때 이 바다의 열쇠는 포르투갈이 쥐고 있을 거요.']]);
      G.State.log(where + '에서 알부케르크 총독의 함대에 들어오라는 청을 사양했다.');
      return;
    }
    b.side = 'pt'; b.joined = t;
    await play([
      ['albuquerque', '좋소! ' + (t < K.calicut ? '캘리컷 일이 끝나면 고아로 간다. 2월 말에서 5월 사이 고아로 오시오.' : '2월 말에 떠나오. 고아 앞바다에서 만납시다. 5월 장마 전까지는 거기 있을 거요.')],
      ['timoja', '하하, 바다를 아는 선장이 하나 더 늘었군! 고아의 강은 얕고 굽이가 많소. 내 배를 따라오시오.']
    ]);
    G.State.log(where + '에서 알부케르크 총독의 함대에 들었다. 해상 무사 티모자의 길잡이로 고아를 치러 간다.');
    UI.toast('알부케르크의 함대 — 1510년 2월 말~5월에 고아로', 'scroll', 6000);
    refresh();
  }

  // ================================================================ ② 고아의 열쇠 (1510.2~5)
  function firstOpen() { var b = st(), t = today(); return !!(b && !b.first && cityNow() === GOA && t >= K.firstFrom && t <= K.firstTo); }
  async function first() {
    var b = st(), t = today(); b.met = 1; b.first = 1;
    var before = t < K.firstFall;
    await withPic('goa_keys', '고아의 열쇠 (1510.3)', function () { return play(before ? [
      [null, '만도비 강 어귀. 포르투갈 깃발을 단 배 스무 척이 강을 거슬러 오른다. 강가 언덕의 판징 보루에서 대포 몇 발이 울리더니 곧 잠잠해졌다.'],
      ['timoja', '보시오, 보루의 수비병들이 도망치오. 고아 사람들은 싸울 마음이 없소. 저기 — 섬의 큰 사람들이 배를 타고 오는군.'],
      [null, '흰 옷을 입은 노인들이 작은 배에서 내려 무릎을 꿇는다. 은 쟁반 위에 커다란 쇠 열쇠가 얹혀 있다.'],
      ['albuquerque', '이 도시의 사람은 무슬림이든 힌두든 다치게 하지 않겠다. 집도, 가게도, 사원도. 세금은 아딜 칸이 걷던 것보다 적게 걷는다. …열쇠를 받겠소.']
    ] : [
      [null, '고아. 아딜 샤의 궁 지붕에 포르투갈 깃발이 펄럭인다. 시장은 문을 열었고, 말 시장에는 페르시아 말들이 매여 있다. 그런데 골목마다 병사들이 둘씩 짝지어 서 있다.'],
      ['albuquerque', '3월 4일에 성문이 열렸소. 피 한 방울 안 흘리고. 티모자 공이 이 섬의 타나다르(세금을 걷고 다스리는 관리)가 되었지.'],
      ['timoja', '(웃으며) 바다의 무사가 땅의 관리라니! 그래도 힌두 사람들은 좋아하오. 무슬림 장수들이 떠나니 숨통이 트였다고.']
    ]); });
    await play([
      ['albuquerque', '…그러나 이 섬은 아직 내 것이 아니오. 강 건너 본토에 비자푸르의 군대가 모인다는 소문이 들려. 어린 술탄이 아버지의 섬을 그냥 두지는 않겠지. 장마가 오기 전에 리스본의 증원이 와야 할 텐데.'],
      ['magellan', '(낮은 목소리로 제독에게) 총독은 물러설 줄을 모르는 사람입니다. 장마철에 이 강에 갇히면… 배가 바다로 나갈 수 없습니다.']
    ]);
    if (!b.side) {
      var v = await UI.ask('알부케르크가 고아를 지킬 배가 필요하다며 함대에 들어오라고 한다.', [
        { label: '총독의 함대에 든다', value: 'pt', icon: 'ship' }, { label: '사양한다', value: 'no' }], me());
      b.side = v === 'pt' ? 'pt' : 'no';
      if (b.side === 'pt') { b.joined = t; G.State.log('고아에서 알부케르크 총독의 함대에 들었다.'); }
    }
    if (b.side === 'pt') {
      S().player.gold += K.firstGift; crownTrust(4);
      var ex = G.Fame.add('so', 60);
      await play([['albuquerque', '그대 배가 강을 오를 때 앞장선 것을 보았소. 총독의 사례요. 고아의 말 시장에서 세금 없이 거래해도 좋소.']]);
      G.State.log('고아가 성문을 열었다. 알부케르크 총독이 함께 온 제독에게 사례했다. (금화 +' + U.num(K.firstGift) + ' · 사교 명성 +' + ex + ')');
      UI.toast('총독의 사례 — 금화 +' + U.num(K.firstGift), 'coin', 4800);
    } else G.State.log('고아에서 포르투갈 깃발이 오른 아딜 샤의 궁을 보았다.');
    refresh();
  }

  // ================================================================ ③ 만도비 강의 우기 (1510.5.30~8.15)
  function winterOpen() { var b = st(), t = today(); return !!(b && !b.winter && cityNow() === GOA && t >= K.winterFrom && t <= K.winterTo); }
  async function winter() {
    var b = st(), S0 = S(), f = S0.fleet; b.met = 1;
    await withPic('goa_mandovi', '만도비 강의 우기 (1510)', function () { return play([
      [null, '고아. 성벽 위에 다시 초록 깃발이 올랐다. 비자푸르 병사들이 강가 보루에 대포를 끌어다 놓았다. 비가 하늘이 무너지듯 쏟아진다.'],
      [null, '강 한가운데 포르투갈 배들이 닻을 내리고 있다. 강 어귀의 모래톱에는 장마의 큰 파도가 하얗게 부서진다 — 저 배들은 바다로 나갈 수 없다. 보루의 대포가 이따금 그 배들을 향해 불을 뿜는다.'],
      [null, '포구의 뱃사람들이 수군거린다. 「저 배 안에서는 쥐를 잡아먹는대.」 「가죽 신을 삶아 먹는대.」 「총독이 명령을 어긴 귀족 하나를 돛대에 매달았대. 우리 여자를 몰래 만나러 갔다나.」'],
      [ENVOY, '(제독의 배로 찾아와) 바다의 선장이시오? 우리 술탄께서 저 갇힌 노인에게 말을 전하고 싶어 하시오. 고아를 단념하면 바다로 나갈 때까지 먹을 것을 대 주겠다고. 그대 배로 나를 저 배까지 태워 주겠소? 삯은 넉넉히 치르리다.']
    ]); });
    var opts = [];
    if ((f.food || 0) >= K.feedFood) opts.push({ label: '밤에 봉쇄를 뚫고 총독의 함대에 식량 ' + K.feedFood + '통을 건넨다', value: 'feed', icon: 'bread' });
    opts.push({ label: '사절을 태워 강화의 말을 전한다 (금화 ' + U.num(K.envoyGold) + '닢)', value: 'envoy', icon: 'scroll' });
    opts.push({ label: '어느 쪽 일에도 끼지 않고 물러난다', value: 'leave' });
    var v = await UI.ask('만도비 강, 1510년 장마 — 갇힌 포르투갈 함대' + ((f.food || 0) < K.feedFood ? ' (식량이 ' + K.feedFood + '통보다 적어 건넬 수 없다)' : ''), opts, me());
    b.winter = v || 'leave';
    if (b.winter === 'feed') {
      f.food = Math.max(0, f.food - K.feedFood);
      var hurt = [];
      f.ships.forEach(function (sh) { var d = Math.round(sh.maxHp * U.rf(0.04, 0.1)); sh.hp = Math.max(1, sh.hp - d); hurt.push(d); });
      await play([
        [null, '그믐밤. 등불을 모두 끄고 노를 헝겊으로 감싸 강을 거슬러 오른다. 보루에서 대포가 울렸다 — 물기둥이 뱃전을 적신다. 배 한쪽이 부서지는 소리가 났지만 멈추지 않았다.'],
        ['albuquerque', '(빗속에서 밧줄을 붙잡고) …누가 이 강에 들어왔나 했더니! 하느님이 보내신 배로군. 쌀이다, 다들 들어라, 쌀이다!'],
        ['albuquerque', '이 노인은 빚을 잊지 않소. 장마가 걷히면 나는 이 섬을 다시 찾을 거요. 그때도 곁에 있어 주시오.']
      ]);
      b.friendAlb = 1; crownTrust(5);
      var so = G.Fame.add('so', 100);
      G.State.log('만도비 강의 장마 속에 봉쇄를 뚫고 갇힌 알부케르크의 함대에 식량 ' + K.feedFood + '통을 건넸다. (사교 명성 +' + so + ')');
      UI.toast('식량 −' + K.feedFood + ' · 배가 보루의 포격에 상했다', 'bread', 5200);
    } else if (b.winter === 'envoy') {
      S0.player.gold += K.envoyGold;
      await play([
        [null, '사절을 태우고 포르투갈 기함에 오른다. 갑판 위에 이상한 것이 놓여 있다 — 포도주 통과 비스킷 상자, 말린 고기가 산처럼 쌓여 있다.'],
        ['albuquerque', '(사절 앞에서 잔을 들며) 먹을 것? 보시다시피 우리는 남아돌아 걱정이오. 술탄께 전하시오 — 고아는 포르투갈의 것이고, 장마가 걷히면 내가 돌아와 되찾겠다고.'],
        [ENVOY, '(배에서 내려오며 낮게) …저 통들 가운데 몇 개가 비어 있는지 우리가 모를 줄 아나 보오. 그래도 저 노인은 굽히지 않는군. 술탄께서 놀라시겠소.'],
        [null, '나중에 들은 이야기로는, 그 포도주 통은 함대에 남은 마지막 것이었다고 한다. 총독은 사절이 떠나자 그것을 병든 선원들에게 나눠 주었다.']
      ]);
      b.bij = 1; crownTrust(-2);
      var so2 = G.Fame.add('so', 60);
      G.State.log('만도비 강에서 아딜 샤의 사절을 알부케르크의 기함까지 태워 주었다. 총독은 마지막 포도주 통을 보이며 강화를 물리쳤다. (금화 +' + U.num(K.envoyGold) + ' · 사교 명성 +' + so2 + ')');
      UI.toast('금화 +' + U.num(K.envoyGold), 'coin', 4200);
    } else G.State.log('만도비 강에 갇힌 포르투갈 함대를 보고 물러났다.');
    refresh();
  }

  // ================================================================ ④ 성 카타리나의 날 (1510.10~11.25)
  function musterOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.retake && (c === CANNANORE || c === COCHIN) && t >= K.musterFrom && t <= K.musterTo); }
  function assaultOpen() { var b = st(), t = today(); return !!(b && !b.retake && cityNow() === GOA && t >= K.assaultFrom && t <= K.retake); }
  async function muster() {
    var b = st(); b.met = 1;
    var where = cityNow() === COCHIN ? '코친' : '카나놀';
    await play([
      [null, where + ' 앞바다에 배가 가득하다. 서른 척이 넘는다. 리스본에서 막 온 배들도 섞여 있다 — 원래는 말라카로 가라는 명을 받은 배들이라고 한다.'],
      ['albuquerque', (b.winter === 'feed' ? '그대로군! 장마 속에 쌀을 싣고 온 그 배. ' : '') + '석 달을 강에서 굶었소. 이제 고아를 되찾으러 간다. 말라카로 가던 디오구 멘드스의 배들도 내가 붙잡아 두었지. 말라카는 그다음이오.'],
      ['timoja', '고아 사람들이 몰래 전갈을 보내왔소. 성 안에 비자푸르 군사가 팔천쯤, 대장은 라술 칸이라 하오. 성벽은 높지만 강 쪽이 약하지.']
    ]);
    var v = await UI.ask('알부케르크가 고아를 되찾으러 간다. 함께 가겠는가?', [
      { label: '함께 간다 — 고아로', value: 'pt', icon: 'ship' },
      { label: '끼지 않는다', value: 'leave' }], me());
    if (v !== 'pt') { b.retake = 'leave'; G.State.log(where + '에서 고아로 가는 알부케르크의 함대를 배웅했다.'); return; }
    if (!b.side || b.side === 'no') b.side = 'pt';
    await play([[null, '함대는 열흘 뒤 만도비 강 어귀에 닿았다. 11월 25일 — 성녀 카타리나의 축일 새벽, 나팔이 울린다.']]);
    await assaultPT();
  }
  async function assault() {
    var b = st(); b.met = 1;
    await withPic('goa_catherine', '성 카타리나의 날 (1510.11.25)', function () { return play([
      [null, '만도비 강 어귀에 포르투갈 함대 서른네 척이 늘어섰다. 강가 보루마다 비자푸르의 초록 깃발과 대포. 성벽 뒤에서 북소리가 울린다.'],
      ['albuquerque', '고아를 다시 찾는다. 오늘은 성녀 카타리나의 날이다. 성녀께서 우리 편이시다!'],
      ['rasulkhan', '(성벽 위에서, 바람에 실려 오는 목소리) 바다의 도적들아, 석 달 굶고도 모자라더냐! 이 성은 아딜 샤의 것이다!']
    ]); });
    var opts = [{ label: '포르투갈 편에서 성벽을 오른다', value: 'pt', icon: 'sword' }];
    opts.push({ label: '라술 칸의 수비대를 돕는다', value: 'bij', icon: 'castle' });
    opts.push({ label: '싸움에 끼지 않고 물러난다', value: 'leave' });
    var v = await UI.ask('고아, 1510년 11월 25일 — 누구 편에 서겠는가?', opts, me());
    b.retake = v || 'leave';
    if (b.retake === 'pt') { if (!b.side || b.side === 'no') b.side = 'pt'; return assaultPT(); }
    if (b.retake === 'bij') return assaultBij();
    G.State.log('고아에서 알부케르크의 함대와 비자푸르 수비대의 싸움을 지켜보다 물러났다.');
  }
  async function assaultPT() {
    var b = st(), S0 = S(); b.retake = 'pt';
    await play([['albuquerque', '강 쪽 성문으로! 사다리를 걸어라! 산티아구!']]);
    var res = await fight('라술 칸의 비자푸르 수비대', K.goaFoe, 'garrison');
    b.retakeRes = res;
    if (res === 'win') {
      S0.player.gold += K.goaShare; crownTrust(8);
      var bt = G.Fame.add('bt', 220);
      await play([
        [null, '사다리 위에서 성벽 너머로 뛰어내렸다. 성문이 안에서 열리고 함성이 쏟아져 들어갔다. 해가 중천에 오르기 전에 라술 칸의 깃발이 내려졌다.'],
        ['albuquerque', '그대의 사람들이 강 쪽 성문을 열었소! 몫이오 — 아딜 샤의 창고에서 나온 금화요.']
      ]);
      G.State.log('성 카타리나의 날, 알부케르크와 함께 고아의 성벽을 올랐다. (금화 +' + U.num(K.goaShare) + ' · 전투 명성 +' + bt + ')');
      UI.toast('고아 재점령 — 금화 +' + U.num(K.goaShare), 'coin', 5200);
    } else {
      var half = Math.round(K.goaShare / 3); S0.player.gold += half;
      await play([[null, '제독의 사람들은 성벽 밑에서 밀려났다. 그러나 다른 성문이 열렸고, 해 질 녘 고아는 다시 포르투갈의 것이 되었다.'], ['albuquerque', '물러섰어도 끝까지 사다리를 놓지 않았지. 몫은 적지만 받아 두시오.']]);
      G.State.log('성 카타리나의 날, 고아의 성벽에서 밀려났지만 도시는 그날 떨어졌다. (금화 +' + U.num(half) + ')');
    }
    // 사흘의 학살
    await withPic('goa_three_days', '고아, 사흘 (1510.11)', function () { return play([
      [null, '그날 밤부터 알부케르크는 명령을 내렸다. 성 안의 무슬림은 — 사내도, 여인도, 아이도 — 살려 두지 말라. 힌두 사람과 그 집은 건드리지 말라.'],
      [null, '사흘 동안 고아의 골목에 비명이 그치지 않았다. 강물이 붉어졌다고 사람들은 말했다. 병사들은 무슬림의 집을 뒤져 금과 비단을 끌어냈다.'],
      ['timoja', '(굳은 얼굴로) …나는 무슬림 장수들의 세금을 미워했소. 그러나 이것은…. 선장, 그대는 어떻게 하겠소?']
    ]); });
    var v = await UI.ask('고아, 사흘의 학살 — 제독은 어떻게 하겠는가?', [
      { label: '병사들과 함께 무슬림의 집을 턴다 (금화 ' + U.num(K.plunder) + '닢)', value: 'loot', icon: 'coin' },
      { label: '숨어 있는 무슬림 가족들을 몰래 배에 태워 강 건너로 보낸다', value: 'shelter', icon: 'heart' },
      { label: '배로 돌아가 사흘이 지나기를 기다린다', value: 'ships' }], me());
    b.sack = v || 'ships';
    if (b.sack === 'loot') {
      S0.player.gold += K.plunder; notoriety(K.notoSack, '고아의 학살 속에서 약탈했다');
      G.State.log('고아의 사흘 동안 무슬림의 집을 털었다. (금화 +' + U.num(K.plunder) + ')');
    } else if (b.sack === 'shelter') {
      await play([
        [null, '밤마다 제독의 보트가 강을 건넜다. 물라의 가족, 말 장수의 아이들, 늙은 직조공 부부…. 건너편 강가에서 그들은 말없이 제독의 손을 붙잡았다가 어둠 속으로 사라졌다.'],
        ['albuquerque', '(사흘째 아침) …강 건너로 보트가 오간다는 말을 들었소. 내 명령을 거스른 자가 누군지는 묻지 않겠소. 오늘로 칼을 거둔다.']
      ]);
      b.friend = 1; crownTrust(-4);
      var so = G.Fame.add('so', 140);
      G.State.log('고아의 사흘 동안 숨어 있던 무슬림 가족들을 몰래 배에 태워 강 건너 본토로 보냈다. (사교 명성 +' + so + ')');
    } else G.State.log('고아의 사흘 동안 배에서 기다렸다.');
    refresh();
  }
  async function assaultBij() {
    var b = st(), S0 = S();
    await play([['rasulkhan', '바다에서 온 이가 우리 편이라고? …좋다, 강 쪽 성문을 맡아 주시오. 저들은 사다리를 걸고 올라올 거요.']]);
    var res = await fight('알부케르크의 상륙대', K.bijFoe, 'garrison');
    b.retakeRes = res; b.friend = 1; crownTrust(-10);
    await play([
      [null, res === 'win' ? '강 쪽 성문 앞에서 포르투갈 병사들이 사다리째 무너져 내렸다. 그러나 다른 성문이 뚫렸다는 고함이 들려왔다.' : '포르투갈 병사들이 사다리를 타고 쏟아져 올라왔다. 제독의 사람들은 성문 안쪽으로 밀려났다.'],
      ['rasulkhan', '…성이 떨어졌소. 오늘은 저들의 날이오. 그대 배로 성 안 사람들을 강 건너로 실어 날라 주시오. 저 노인은 무슬림을 살려 두지 않을 거요.'],
      [null, '그날 밤과 다음 날, 제독의 배는 사람을 가득 싣고 몇 번이고 강을 건넜다. 마지막 보트에서 라술 칸이 무거운 쇠 열쇠 하나를 건넨다.'],
      ['rasulkhan', '고아 강 쪽 성문의 열쇠요. 저들이 문을 부수고 들어왔으니 이제 아무 데도 맞지 않지. …언젠가 이 섬이 다시 우리 것이 되는 날이 오면, 이걸 돌려주시오.']
    ]);
    keepsake('goa_gate_key', '고아 성문의 열쇠', '1510년 성 카타리나의 날, 비자푸르의 장수 라술 칸이 건넨 고아 강 쪽 성문의 쇠 열쇠. 포르투갈군이 문을 부수고 들어온 뒤로 아무 데도 맞지 않는다.');
    var so = G.Fame.add('so', 180), bt = res === 'win' ? G.Fame.add('bt', 120) : 0;
    G.State.log('성 카타리나의 날, 고아에서 비자푸르 수비대 편에 섰다. 성이 떨어진 뒤 사람들을 강 건너로 실어 날랐다. 라술 칸이 성문의 열쇠를 건넸다. (사교 명성 +' + so + (bt ? ' · 전투 명성 +' + bt : '') + ')');
    UI.toast('고아 성문의 열쇠 · 포르투갈 왕실의 신뢰 −10', 'scroll', 5200);
    refresh();
  }

  // ================================================================ ⑤ 말라카의 인질 (1509.9~1511.6)
  function hostageOpen() { var b = st(), t = today(); return !!(b && !b.letter && cityNow() === MALACCA && t >= K.hostFrom && t <= K.hostTo); }
  async function hostage() {
    var b = st(), S0 = S(); b.met = 1;
    await withPic('malacca_letter', '말라카의 편지 (1510)', function () { return play([
      [null, '말라카. 강어귀에 크고 작은 배가 수백 척 떠 있다. 구자라트의 다우, 자바의 정크, 중국의 큰 정크, 벵골과 페구의 배…. 다리 하나가 강을 건너 술탄의 궁과 큰 모스크로 이어진다.'],
      [null, '클링(타밀) 상인들의 거리. 이마에 재로 줄을 그은 상인이 제독을 가게 안쪽으로 이끈다.'],
      ['ninachatu', '니나 차투라 하오. 바다의 선장이시니 알겠지요. 지난해(1509년 9월) 포르투갈 배들이 왔었소. 술탄이 잔치에 부르고는 뒤에서 칼을 갈았지. 배는 달아났지만 뭍에 있던 사람들은 붙잡혔소.'],
      ['ninachatu', '그 가운데 루이 드 아라우주라는 상관원이 있소. 나는 그를 몰래 먹이고, 그가 쓴 편지를 숨겨 두었소. 인도의 포르투갈 총독에게 가야 할 편지요.'],
      ['araujo', '(편지의 글) 「총독 각하. 저희 열아홉은 아직 살아 있습니다. 술탄의 군사는 많으나 서로 믿지 않습니다. 구자라트 상인들이 술탄을 부추기고, 중국·클링 상인들은 술탄을 미워합니다. 다리가 이 도시의 목입니다. 다리를 쥐면 도시를 쥡니다. 대포는 다리 양쪽에….」']
    ]); });
    var opts = [{ label: '편지를 받아 인도의 총독에게 전하겠다', value: 'carry', icon: 'scroll' }, { label: '편지를 술탄의 벤다하라(재상)에게 넘긴다', value: 'sultan', icon: 'coin' }, { label: '남의 싸움에 말려들고 싶지 않다 — 거절한다', value: 'no' }];
    var v = await UI.ask('니나 차투가 루이 드 아라우주의 편지를 내민다.', opts, me());
    b.letter = v || 'no';
    if (b.letter === 'carry') {
      keepsake('araujo_letter', '루이 드 아라우주의 편지', '말라카에 붙잡힌 포르투갈 상관원이 인도 총독에게 쓴 편지. 말라카의 수비와 다리, 상인들의 속사정이 적혀 있다. 코친·카나놀·고아의 알부케르크에게 전하자.');
      await play([['ninachatu', '이 일이 알려지면 내 목이 날아가오. 그래도 이 도시를 구자라트 상인들에게만 맡겨 둘 수는 없소. …총독에게 전해 주시오, 클링 상인들은 성문이 열리는 날을 기다린다고.']]);
      G.State.log('말라카에서 클링 상인 니나 차투에게 붙잡힌 포르투갈인 루이 드 아라우주의 편지를 받았다. 인도의 알부케르크에게 전해야 한다.');
      UI.toast('아라우주의 편지 — 1511년 6월까지 코친·카나놀·고아(포르투갈령)의 총독에게', 'scroll', 6000);
    } else if (b.letter === 'sultan') {
      S0.player.gold += 1500;
      await play([[BENDAHARA, '(편지를 불에 비춰 보며) 흠, 이방인이 이방인을 판다니. 그래도 쓸 만한 걸 가져왔군. 금화요. 클링 상인 하나가 목을 잃겠지만 그건 그대가 알 바 아니지.'], [null, '며칠 뒤, 클링 거리의 니나 차투의 가게는 문이 닫혀 있었다.']]);
      notoriety(3, '말라카에서 편지를 술탄에게 팔아넘겼다');
      G.State.log('말라카에서 루이 드 아라우주의 편지를 술탄의 벤다하라에게 넘기고 금화 1,500닢을 받았다.');
    } else G.State.log('말라카에서 클링 상인이 내민 포르투갈 인질의 편지를 거절했다.');
    refresh();
  }
  function deliverOpen() {
    var b = st(), t = today(), c = cityNow();
    if (!b || b.letter !== 'carry' || t > K.hostTo) return false;
    if (c === COCHIN || c === CANNANORE) return t >= K.cochinFrom;   // 알부케르크가 총독이 된 뒤 (1509.11.4~)
    return c === GOA && goaPT(t);
  }
  /** 그날 고아가 포르투갈의 손에 있었는가 — 1510.3.4~5.30 · 11.25 뒤 (도시 주인 자료는 달 단위라 날짜로 다시 본다) */
  function goaPT(t) { return (t >= K.firstFall && t < K.lost) || t >= K.retake; }
  GM.goaPT = goaPT;
  async function deliver() {
    var b = st(); b.letter = 'given'; b.met = 1; dropItem('araujo_letter');
    await play([
      [null, '포르투갈 요새의 총독 집무실. 알부케르크가 편지를 창가로 들고 가 한 줄 한 줄 읽는다.'],
      ['albuquerque', '…아라우주가 살아 있구나. 다리가 이 도시의 목이라. 다리 양쪽의 대포, 구자라트 상인, 중국 상인… 이 편지 한 장이 군사 백 명보다 낫소.'],
      ['albuquerque', '내년 봄 계절풍이 바뀌면 말라카로 간다. 7월이면 그 해협에 닿을 거요. 그대도 오시오 — 이 편지를 가져온 사람이 그 다리를 보지 못한다면 섭섭하지.']
    ]);
    crownTrust(6); var so = G.Fame.add('so', 80);
    G.State.log('루이 드 아라우주의 편지를 알부케르크 총독에게 전했다. 총독이 말라카로 가겠다고 한다. (사교 명성 +' + so + ')');
    UI.toast('편지를 전했다 — 1511년 7~8월 말라카', 'scroll', 5200);
    refresh();
  }

  // ================================================================ ⑥ 말라카 공방 (1511.7.1~8.24)
  function siegeOpen() { var b = st(), t = today(); return !!(b && !b.mal && cityNow() === MALACCA && t >= K.siegeFrom && t <= K.malFall); }
  async function siege() {
    var b = st(), S0 = S(), t = today(); b.met = 1;
    if (b.letter === 'carry') { b.letter = 'late'; dropItem('araujo_letter'); }
    var known = b.side === 'pt' || b.retake === 'pt' || b.letter === 'given' || b.letter === 'late';
    await withPic('malacca_bridge', '말라카의 다리 (1511)', function () { return play([
      [null, '말라카 앞바다에 포르투갈 배 열여덟 척이 깃발을 올리고 늘어섰다. 항구의 배들이 불타고 있다 — 총독이 인질을 돌려보내지 않는다며 불을 질렀다고 한다.'],
      [null, '강 위의 다리 양쪽에 말뚝 울타리와 대포가 서 있다. 다리 건너 큰 모스크 앞에 등에 망루를 얹은 코끼리들이 줄지어 있다.'],
      ['albuquerque', known ? (b.letter === 'late' ? '편지를 가지고 직접 왔구려! 늦었지만 고맙소. 다리가 이 도시의 목이라는 말, 내 눈으로도 보고 있소.' : '왔구려! ' + (b.letter === 'given' ? '그대가 가져온 편지대로요. 다리가 이 도시의 목이오.' : '고아의 성벽에서처럼 오늘도 곁에 서 주겠소?')) : '말라카에 온 바다의 선장이오? 오늘은 이 해협에서 장사할 날이 아니오. 우리 편에 서든가, 비켜서든가.'],
      ['magellan', '(총독 곁에서) 2년 전 저는 이 항구에서 겨우 목숨만 건져 달아났습니다. 친구 세랑을 붙잡혀 가는 배에서 끌어냈지요. 오늘은 돌아온 날입니다.'],
      [JUNK, '(정크선에서 보트를 타고 와) 우리 중국 상인들은 술탄에게 억울한 일을 많이 당했소. 포르투갈 총독께 우리 보트와 사람을 빌려주겠다고 했소. 그대는 어느 쪽이오?'],
      ['ahmadshah', '(다리 건너 코끼리 위에서) 바다의 도적들! 말라카의 다리는 우리 코끼리가 지킨다. 건너오는 자는 짓밟히리라!']
    ]); });
    var v = await UI.ask('말라카, 1511년 ' + S0.date.m + '월 — 해협의 목을 두고', [
      { label: '포르투갈 편에서 다리를 친다', value: 'pt', icon: 'sword' },
      { label: '술탄 편에서 다리를 지킨다', value: 'sultan', icon: 'castle' },
      { label: '중국 정크선 상인들과 거래나 한다', value: 'junk', icon: 'coin' },
      { label: '해협을 떠난다', value: 'leave' }], me());
    b.mal = v || 'leave';
    if (b.mal === 'pt') return siegePT();
    if (b.mal === 'sultan') return siegeSultan();
    if (b.mal === 'junk') {
      S0.player.gold += K.junkGold;
      await play([[JUNK, '그대는 영리하구려. 싸움이 끝나면 누가 이기든 배는 다시 들어오지. 우리 비단과 그대의 짐을 바꿉시다. 그리고 — 이 싸움이 끝나면 우리는 북쪽 시암(아유타야)으로 가오. 포르투갈 총독이 그 왕에게 사절을 보낸다더군.']]);
      var so = G.Fame.add('so', 40);
      G.State.log('말라카 공방 중에 중국 정크선 상인들과 거래했다. (금화 +' + U.num(K.junkGold) + ' · 사교 명성 +' + so + ')');
      UI.toast('금화 +' + U.num(K.junkGold), 'coin', 4200);
    } else G.State.log('말라카 앞바다에서 포르투갈 함대와 술탄의 싸움을 보고 해협을 떠났다.');
    refresh();
  }
  async function siegePT() {
    var b = st(), S0 = S(), n = K.malFoe * (b.letter === 'given' ? K.letterCut : b.letter === 'late' ? K.letterLate : 1);
    if (b.letter === 'given' || b.letter === 'late') await play([['albuquerque', '아라우주의 편지대로 다리 양쪽의 대포부터 친다. 클링 상인들이 뒷골목 길을 열어 줄 거요.']]);
    await play([[null, '새벽 썰물에 보트들이 다리로 몰려간다. 화살과 독 바른 화살대, 구자라트 대포의 돌탄이 쏟아진다. 다리 건너에서 코끼리가 울부짖는다.']]);
    var res = await fight('말라카 술탄의 군대 (아흐마드 샤)', n, 'garrison');
    b.malRes = res;
    if (res === 'win') {
      var share = Math.round(K.malShare * (b.side === 'pt' ? 1.15 : 1));
      S0.player.gold += share; crownTrust(8);
      var bt = G.Fame.add('bt', 260);
      await play([
        [null, '창에 찔린 코끼리가 몸을 돌려 제 편을 짓밟으며 달아났다. 다리 위의 울타리가 무너지고, 포르투갈 깃발이 모스크 앞에 꽂혔다.'],
        ['albuquerque', '다리를 쥐었다! 이 도시는 우리 것이다. 그대의 몫이오 — 술탄 궁의 금고에서.']
      ]);
      G.State.log('말라카의 다리에서 포르투갈 편에 서서 술탄의 군대를 물리쳤다. (금화 +' + U.num(share) + ' · 전투 명성 +' + bt + ')');
      UI.toast('말라카 공방 — 금화 +' + U.num(share), 'coin', 5200);
      var v = await UI.ask('도시가 열렸다. 병사들이 거리로 쏟아져 들어간다.', [
        { label: '약탈에 끼어든다 (금화 ' + U.num(K.malLoot) + '닢)', value: 'loot', icon: 'coin' },
        { label: '니나 차투의 클링 거리와 중국 상인들의 거리를 지킨다', value: 'protect', icon: 'heart' }], me());
      b.malSack = v === 'loot' ? 'loot' : 'protect';
      if (b.malSack === 'loot') { S0.player.gold += K.malLoot; notoriety(K.notoLoot, '말라카의 약탈에 끼어들었다'); G.State.log('말라카의 약탈에 끼어들었다. (금화 +' + U.num(K.malLoot) + ')'); }
      else {
        await play([['albuquerque', '좋소. 우리를 도운 클링과 중국, 페구 사람들의 집에는 깃발을 꽂아 아무도 건드리지 못하게 하라 일렀소. 그대가 그 거리를 지켜 주시오.'], ['ninachatu', b.letter === 'given' ? '편지가 닿았군요. …이 거리는 무사합니다. 고맙소, 선장.' : '선장, 이 거리를 지켜 줘서 고맙소. 우리는 오늘을 잊지 않겠소.']]);
        var so = G.Fame.add('so', 100);
        G.State.log('말라카가 열린 날 클링·중국 상인들의 거리를 지켰다. (사교 명성 +' + so + ')');
      }
    } else {
      var part = Math.round(K.malShare / 3); S0.player.gold += part;
      await play([[null, '다리 위에서 제독의 사람들은 코끼리에 밀려 물러났다. 그러나 며칠 뒤 다시 친 포르투갈군이 다리를 빼앗았다. 8월 24일, 말라카는 무너졌다.'], ['albuquerque', '물러섰어도 끝까지 보트를 버리지 않았소. 몫이오.']]);
      G.State.log('말라카의 다리에서 밀려났지만 도시는 끝내 떨어졌다. (금화 +' + U.num(part) + ')');
    }
    refresh();
  }
  async function siegeSultan() {
    var b = st(), S0 = S();
    await play([['ahmadshah', '바다에서 온 이가 우리 편이라고? 좋다! 다리 아래 강가를 맡아라. 저들의 보트가 다리 기둥에 닿기 전에 막아라!']]);
    var res = await fight('알부케르크의 상륙대', K.sultanFoe, 'garrison');
    b.malRes = res; b.friend = 1; crownTrust(-10);
    await play([
      [null, res === 'win' ? '다리 아래에서 포르투갈 보트 몇 척이 뒤집혔다. 그러나 다리 위의 울타리는 이미 불타고 있었다.' : '포르투갈 병사들이 다리 기둥을 타고 올라왔다. 제독의 사람들은 강가로 밀려났다.'],
      ['mahmud', '(궁 뒤뜰에서, 짐을 꾸리는 시녀들 사이로) …이 도시는 내 아버지들이 백 년을 지킨 곳이오. 그러나 오늘은 떠나야 하오. 내 아들은 끝까지 싸우겠다고 하지만, 여인들과 아이들은 살아야지.'],
      ['ahmadshah', '바다의 선장, 그대 배로 왕실 사람들을 남쪽 섬(빈탄)까지 데려가 주시오. 나는 아버지를 모시고 뭍길로 가겠소.'],
      [null, '그날 밤 제독의 배는 노란 비단 휘장을 친 보트들을 태우고 해협을 남쪽으로 빠져나갔다. 이튿날 아침 빈탄 섬의 강가에서 아흐마드 샤의 신하가 칼 한 자루를 건넨다.'],
      ['ahmadshah', '(신하가 전하는 말) 「말라카 왕실의 크리스다. 물결 모양 날은 바다를, 손잡이의 금은 해협을 지나간 배들을 뜻한다. 우리가 그 해협을 되찾는 날까지 그대가 지녀 다오.」']
    ]);
    keepsake('malacca_kris', '말라카 술탄의 크리스', '1511년 말라카가 무너진 밤, 왕실 사람들을 빈탄 섬까지 태워 준 답례로 아흐마드 샤가 보낸 물결 모양 날의 칼. 금 손잡이에 해협을 지나간 배들이 새겨져 있다.');
    var so = G.Fame.add('so', 160), bt = res === 'win' ? G.Fame.add('bt', 100) : 0;
    G.State.log('말라카가 무너질 때 술탄 편에 서서 다리를 지키고, 왕실 사람들을 빈탄 섬으로 태워 갔다. 아흐마드 샤가 크리스를 보냈다. (사교 명성 +' + so + (bt ? ' · 전투 명성 +' + bt : '') + ')');
    UI.toast('말라카 술탄의 크리스 · 포르투갈 왕실의 신뢰 −10', 'scroll', 5200);
    refresh();
  }

  // ================================================================ ⑦ 바다의 꽃 (1511.8.25~11.19)
  function florOpen() { var b = st(), t = today(); return !!(b && b.mal === 'pt' && !b.flor && cityNow() === MALACCA && t >= K.florFrom && t <= K.florTo); }
  async function flor() {
    var b = st();
    await withPic('malacca_flor', '바다의 꽃 (1511)', function () { return play([
      [null, '말라카 앞바다. 커다란 카락선 한 척에 짐이 끝없이 실린다. 금 그릇, 보석 상자, 술탄의 옥좌, 청동 사자상…. 배의 이름은 플로르 드 라 마르 — 「바다의 꽃」. 그런데 배의 옆구리에서 물이 새어 나온다.'],
      [null, '부두에서는 노예들이 돌을 나른다. 모스크와 무덤에서 떼어 낸 돌로 요새 「아 파모자(이름난 것)」를 쌓는 중이다.'],
      ['albuquerque', '국왕 폐하께 바칠 것들이오. 이 배는 나와 함께 인도양을 열 번은 건넜소. 늙었어도 아직 쓸 만하지.'],
      ['magellan', '(제독에게만 들리게) 저 배는 아홉 해가 넘었습니다. 인도양의 배는 다섯 해면 썩습니다. 저 바닥에 짐을 저렇게 싣다니….']
    ]); });
    var v = await UI.ask('술탄의 보물을 낡은 플로르 드 라 마르 호에 싣는다.', [
      { label: '「그 배는 썩었습니다」 — 상자 몇 개라도 내 배에 나눠 싣자고 한다', value: 'carry', icon: 'chest' },
      { label: '총독이 하는 일이다 — 말하지 않는다', value: 'no' }], me());
    b.flor = v === 'carry' ? 'carry' : 'no';
    if (b.flor === 'carry') {
      await play([['albuquerque', '(한참 노려보다가) …마가야네스 같은 소리를 하는군. 좋소. 고집 센 늙은이도 다리 하나쯤은 더 놓는 법이지. 상자 여섯 개를 그대 배에 싣고 코친으로 가시오. 국왕 폐하의 것이니 손대지 말고.']]);
      G.State.log('말라카에서 술탄의 보물 상자 여섯 개를 나눠 싣고 코친으로 가기로 했다. 나머지는 플로르 드 라 마르 호에 실렸다.');
    } else G.State.log('말라카에서 술탄의 보물이 낡은 플로르 드 라 마르 호에 실리는 것을 보았다.');
    refresh();
  }

  // ================================================================ 도시에 들어설 때 · 수첩
  GM.pending = function () {
    var s0 = S(); if (!s0) return false;
    return cochinOpen() || firstOpen() || winterOpen() || musterOpen() || assaultOpen() || deliverOpen() || hostageOpen() || siegeOpen() || florOpen();
  };
  GM.check = async function () {
    if (GM._busy) return false; GM._busy = true;
    GM.evDay = U.dayIndex(S().date);
    try {
      if (deliverOpen()) await deliver();
      else if (cochinOpen()) await cochin();
      else if (firstOpen()) await first();
      else if (winterOpen()) await winter();
      else if (musterOpen()) await muster();
      else if (assaultOpen()) await assault();
      else if (siegeOpen()) await siege();
      else if (florOpen()) await flor();
      else if (hostageOpen()) await hostage();
    } catch (e) { console.error(e); }
    GM._busy = false;
    return true;
  };
  GM.html = function () {
    var s0 = S(), b = s0 && s0.goaMal; if (!b) return '';
    var t = today(), li = [];
    if (b.side === 'pt' && !b.first && t <= K.firstTo) li.push('1510년 2월 말~5월 고아 — 알부케르크의 함대와 만도비 강을 오른다');
    if (b.side === 'pt' && !b.retake && t >= K.escape && t <= K.retake) li.push('1510년 10월~11월 중순 카나놀·코친에서 함대가 모인다 (11월 25일까지는 고아로 바로 가도 된다)');
    if (b.letter === 'carry' && t <= K.hostTo) li.push('루이 드 아라우주의 편지 — 1511년 6월까지 코친·카나놀·고아(포르투갈령)의 총독에게');
    if ((b.side === 'pt' || b.letter === 'given') && !b.mal && t <= K.malFall) li.push('1511년 7월~8월 24일 말라카 — 알부케르크의 함대');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">인도양의 열쇠 — 알부케르크</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._goaHtml) { G.Court._goaHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + GM.html(); }; }
  GM._t = { cochin: cochin, first: first, winter: winter, muster: muster, assault: assault, hostage: hostage, deliver: deliver, siege: siege, flor: flor };
})(window.G = window.G || {});
