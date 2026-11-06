/* force.js 페이지 쪽: 사건마다 조건을 맞춘 상태를 만들고 실제 끼어드는 길(도시 입항·하루·바다/뭍 hook)을 돌린다.
   qalib.js(window.QA)·evlog.js 뒤에 넣는다. window.__START = 1600년 저장(JSON 문자열). */
(function () {
  'use strict';
  var F = window.FORCE = { notes: [] };
  function S() { return G.Game.state; }
  function U() { return G.U; }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function note(t) { F.notes.push(String(t)); }

  // ---------------------------------------------------------------- 창: 첫 번째 「긍정」 단추 (특정 단추가 보이면 그것)
  var DECL = /사양|거절|아니|그만|나중|지나친|지나간|물러|떠난다|돌아선다|어렵다|않는다|않겠|못 하겠|생각해|미룬|미루|다음에|이르다|머물 수 없다|두고 본다|돌려보|모른 척|그냥 보낸다|가지 않는다|입을 다문다|일러바친다|포기|내려놓|은퇴|해고|버린다|내쫓|떠나보낸|잠입|바쁘다|없소|돌아가시오|극장 사람에게|남의 나라|품에 두고|싫|거두|빼앗|공격한다$|떠나자|지켜본다|배웅/;
  F.specific = null;
  function modalButtons() {
    var root = document.querySelector('#ui') || document.body, ms = root.querySelectorAll('.modal-back'), m = ms.length ? ms[ms.length - 1] : null;
    if (!m) return [];
    return [].slice.call(m.querySelectorAll('.askrow button, .askrow .btn, .foot button, .foot .btn, .choices .choice')).filter(function (b) { return !b.disabled && !b.classList.contains('dis') && !b.classList.contains('disabled'); })
      .map(function (b) { return (b.textContent || '').replace(/\s+/g, ' ').trim(); });
  }
  QA.want = { test: function (l) {
    if (F.specific) { var labs = modalButtons(); if (labs.some(function (x) { return F.specific.test(x); })) return F.specific.test(l); }
    return !DECL.test(l);
  } };

  // ---------------------------------------------------------------- 기다리기
  function cityBusy() { var C = G.Scenes.city; return G.Game.sceneName === 'city' && C.isBusy && C.isBusy(); }
  function landBusy() { if (G.Game.sceneName !== 'land') return false; var r = G.Scenes.land.runtime && G.Scenes.land.runtime(); return !!(r && r.busy); }
  async function battle() {
    if (G.Game.sceneName !== 'battle') return false;
    note('battle@' + QA.date()); await QA.fightBattle();
    return true;
  }
  function overlays() { [].slice.call(document.querySelectorAll('.osa-mem')).forEach(function (el) { el.click(); }); }
  F.idle = async function (ms) {
    var t0 = Date.now(), quiet = 0;
    while (Date.now() - t0 < (ms || 60000)) {
      if (await battle()) { quiet = 0; continue; }
      QA.aux(); overlays(); await QA.clear(40);
      var busy = G.UI.busy() || cityBusy() || landBusy() || (G.Life && G.Life.running) || (G.Coven && G.Coven.running) || (G.FirstLove && G.FirstLove.running);
      if (!busy) { if (++quiet > 6) return true; } else quiet = 0;
      await sleep(40);
    }
    note('idle timeout: ' + modalButtons().join('/') + ' flags=' + JSON.stringify({ui: G.UI.busy(), city: cityBusy(), land: landBusy(), life: !!(G.Life && G.Life.running), coven: !!(G.Coven && G.Coven.running), fl: !!(G.FirstLove && G.FirstLove.running), scene: G.Game.sceneName, layers: [].slice.call(document.querySelectorAll('#ui > .layer')).map(function (x) { return x.children.length + ':' + [].slice.call(x.children).map(function (c) { return c.className; }).join(',').slice(0, 80); }).join(' | ')}));
    return false;
  };
  /** 약속(promise)을 돌리며 창을 넘긴다 */
  F.drive = async function (p, ms) {
    var done = false, err = null, val;
    Promise.resolve(p).then(function (v) { done = true; val = v; }, function (e) { done = true; err = e; });
    var t0 = Date.now();
    while (!done && Date.now() - t0 < (ms || 60000)) { await battle(); QA.aux(); overlays(); await QA.clear(30); await sleep(30); }
    if (!done) note('drive timeout');
    await F.idle(20000);
    if (err) throw err;
    return val;
  };

  // ---------------------------------------------------------------- 상태
  F.setDate = function (y, m, d) {
    var s = S(), nd = { y: y, m: m, d: d };
    s.day += U().dayIndex(nd) - U().dayIndex(s.date); s.date = nd;
    s.player.born = { y: y - 35, m: 2, d: 2 };
  };
  var CLEAR = ['globe', 'sky', 'huguenot', 'nzinga', 'mingFall', 'westph', 'glory', 'newton', 'coven', 'fairy', 'joan', 'snowQ', 'pino', 'peter', 'mowgli', 'tarzan', 'tam', 'maria', 'lprince', 'legend', 'tigers', 'quix', 'sim', 'gw', 'napo', 'princess', 'castaway', 'colony', 'osa', 'oldGuardFl', 'poca'];
  F.base = function (y, m, d, o) {
    o = o || {};
    G.Game.state = G.State.deserialize(window.__START);
    var s = S(), p = s.player, R = G.R;
    s.flags.prologue = true; s.settings.autosave = false; s.settings.res = 0.35; s.settings.sound = 0; s.settings.music = 0;
    CLEAR.forEach(function (k) { delete s[k]; });
    if (s.mina) s.mina.door = s.mina.door; // 그대로
    F.setDate(y, m, d);
    p.gold = 500000; p.fame = o.fame || 20000; if (p.fameBy) { p.fameBy = { ex: Math.round(p.fame * 0.4), tr: Math.round(p.fame * 0.2), bt: Math.round(p.fame * 0.2), so: Math.round(p.fame * 0.2) }; }
    p.notoriety = 0; p.hp = 100;
    s.fleet.ships = [R.newShip(o.ship || 'galleon', '산타 마리아'), R.newShip('galleon', '희망')];
    s.fleet.crew = 160; s.fleet.food = 400; s.fleet.water = 400; s.fleet.fatigue = 0; s.fleet.discipline = 80; s.fleet.cargo = {}; s.fleet.mat = 20;
    s.history = G.HISTORY.length;
    s.known = G.CITY_DATA.map(function (c) { return c.id; });
    delete s.slaver;
    G.SKILLS.forEach(function (x) { p.sk[x.id] = o.skill == null ? 1 : o.skill; });
    p.lg = G.LANGS.map(function () { return 3; });
    QA.evStart();
    return s;
  };
  F.mate = function (id, role, extra) {
    var s = S(); if (!G.MATE[id]) { note('no MATE ' + id); return null; }
    var m = s.mates.filter(function (x) { return x.id === id; })[0];
    if (!m) { m = { id: id, role: role || 'none', joined: U().dateNum(s.date), loyal: 90 }; s.mates.push(m); }
    if (extra) Object.assign(m, extra);
    if (role && role !== 'none') s.mates.forEach(function (x) { if (x !== m && x.role === role) x.role = 'none'; });
    return m;
  };
  F.cargo = function (id, q) { var s = S(); s.fleet.cargo[id] = { q: q, cost: 50, from: 0, d: s.day }; try { G.R.cargoLots(s.fleet.cargo[id]); } catch (e) { /* 없음 */ } };
  F.item = function (id) { if (!G.R.hasItem(id)) { if (!G.R.addItem(id)) S().player.items.push({ id: id }); } };
  F.found = function (id) { var s = S(); s.disc[id] = Object.assign(s.disc[id] || {}, { found: true, me: true, d: U().dateNum(s.date) }); };

  // ---------------------------------------------------------------- 장소
  F.enter = async function (id, arg) {
    var s = S(), c = G.CITY_DATA[id];
    s.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat, via: (arg && arg.via) || (c.port ? 'sea' : 'land') };
    G.Game.go('city', Object.assign({ cityId: id, arrive: true }, arg || {}));
    await sleep(150);
    await F.idle(120000);
  };
  F.visit = async function (kind) {
    var C = G.Scenes.city;
    for (var k = 0; k < 10 && !(C.current() && C.current().kind === kind); k++) { var p = C.visit(kind); await F.drive(p, 30000); }
    return !!(C.current() && C.current().kind === kind);
  };
  F.leave = async function () { var C = G.Scenes.city; if (C.current()) await F.drive(C.leave(), 20000); };
  F.sea = async function (depart, lon, lat, days) {
    var s = S(); s.loc = { mode: 'city', city: depart, lon: G.CITY_DATA[depart].lon, lat: G.CITY_DATA[depart].lat, via: 'sea' };
    G.Game.go('sea', { depart: depart }); await sleep(200); await F.idle(40000);
    s = S(); if (G.Game.sceneName !== 'sea') note('not at sea: ' + G.Game.sceneName);
    s.loc.mode = 'sea'; s.loc.lon = lon; s.loc.lat = lat; s.fleet.daysOut = days == null ? 10 : days;
    var rt = G.Scenes.sea.runtime && G.Scenes.sea.runtime(); if (rt) { rt.paused = true; rt.path = null; }
  };
  F.land = async function (lon, lat, shipLon, shipLat) {
    G.Game.go('land', { landing: { lon: lon, lat: lat, shipLon: shipLon == null ? lon : shipLon, shipLat: shipLat == null ? lat : shipLat, shipHeading: 0 } });
    await sleep(300); await F.idle(40000);
    if (G.Game.sceneName !== 'land') note('not on land: ' + G.Game.sceneName);
    var l = S().loc; if (l.mode === 'land') { l.lon = lon; l.lat = lat; }
  };
  F.camp = async function (re) { F.specific = re; try { await F.drive(G.Scenes.land.camp(), 60000); } finally { F.specific = null; } };
  F.runDay = async function () { await F.drive(G.Scenes.land.runDay(), 60000); };
  F.pass = async function (n) { var m = G.Game.passDays(n); await F.idle(20000); return m; };
  /** 조건에 맞는 자리 찾기 (중심 둘레 격자) */
  F.findPt = function (lon0, lat0, r, ok, step) {
    step = step || 0.1; var best = null;
    for (var rr = 0; rr <= r && !best; rr += step) for (var a = 0; a < 36 && !best; a++) {
      var x = lon0 + Math.cos(a / 36 * 6.283) * rr, y = lat0 + Math.sin(a / 36 * 6.283) * rr;
      if (ok(x, y)) best = [+x.toFixed(3), +y.toFixed(3)];
      if (rr === 0) break;
    }
    return best;
  };
  F.seaNear = function (lon, lat) { return F.findPt(lon, lat, 4, function (x, y) { return !G.Geo.isLand(x, y); }, 0.05); };
  F.landNear = function (lon, lat) { return F.findPt(lon, lat, 4, function (x, y) { return G.Geo.isLand(x, y); }, 0.05); };
  F.maleMates = function (n) {
    return G.MATES.filter(function (m) { return m.g === 'm' && !m.witch && !m.tale && !m.eventOnly && !m.legend && m.y && m.y[0] <= 1640 && m.y[1] >= 1600 && !/^(rocco)$/.test(m.id); }).slice(0, n).map(function (m) { return m.id; });
  };

  // ================================================================ 사건 표
  var E = F.E = {};
  var EN = { london: 38, prague: 53, venice: 29, florence: 30, rome: 33, amsterdam: 24, bremen: 46, paris: 14, luanda: 100, beijing: 188, mina: 97, seville: 7, toledo: 4, tours: 16, toulouse: 19, coruna: 2, hanyang: 190, hangzhou: 177, sakai: 192, hansan: 229, vienna: 54, moscow: 60, bordeaux: null };
  function cityByName(n) { var c = G.CITY_DATA.filter(function (x) { return x && x.name === n; })[0]; return c ? c.id : null; }

  // ── 셰익스피어
  E.globe_tale = async function () { F.base(1610, 6, 1); await F.enter(EN.london); };
  E.globe_anne_fire = async function () { var s = F.base(1613, 6, 10); s.globe = { told: {}, tale: 'no' }; await F.enter(EN.london); };
  E.globe_songs = async function () {
    var s = F.base(1614, 3, 1); s.globe = { told: {}, met: 1, tale: 'wreck', anne: 1, joined: 'yes' }; F.mate('shakespeare'); F.mate('anne_hathaway');
    await F.sea(EN.london, -6, 49.5);
    for (var i = 0; i < 120; i++) { S().globe.songDay = null; var r = await F.drive(G.Romance.seaDay(), 20000); if (S().globe.songN) break; S().day += 1; }
    note('songN=' + S().globe.songN);
  };
  E.globe_news = async function () { var s = F.base(1611, 10, 30); s.globe = { told: {}, met: 1, tale: 'wreck' }; await F.pass(4); s.date = s.date; F.setDate(1613, 6, 29); await F.pass(2); F.setDate(1623, 11, 7); await F.pass(2); };

  // ── 하늘
  E.sky_kep = async function () {
    var s = F.base(1601, 3, 1); F.item('compass'); await F.enter(EN.prague);
    note('after offer kep=' + (s.sky && S().sky.kep));
    if (!(S().sky && S().sky.kep === 1)) return;
    var B = G.BALANCE.sky;
    for (var i = 0; i < 3; i++) { var q = B.seas[i]; await F.sea(i === 0 ? 0 : i === 1 ? cityByName('케이프') || 0 : cityByName('고아') || 0, q[2], q[1]); await F.drive(G.Sky.atSea(), 20000); }
    note('reads=' + G.Sky.reads());
    await F.enter(EN.prague);
    note('kep=' + S().sky.kep);
  };
  E.sky_trial = async function () { var s = F.base(1633, 5, 1); s.sky = { cop: 0, kep: 0, gal: 'done', galDone: 16100301, trial: 0, ms: 0, due: {}, next: {}, seen: {}, reads: {} }; await F.enter(EN.rome); };
  E.sky_ms = async function () {
    var s = F.base(1636, 6, 1); s.sky = { cop: 0, kep: 0, gal: 'done', galDone: 16100301, trial: 'seen', ms: 0, due: {}, next: {}, seen: {}, reads: {} };
    await F.enter(EN.venice); note('ms=' + S().sky.ms); if (S().sky.ms === 1) await F.enter(EN.amsterdam); note('ms=' + S().sky.ms);
  };
  E.sky_news = async function () {
    var s = F.base(1609, 8, 28); s.sky = { cop: 0, kep: 'done', kepDone: 16050101, gal: 'done', galDone: 16100301, trial: 0, ms: 0, due: {}, next: {}, seen: {}, reads: {} };
    await F.pass(6); F.setDate(1627, 9, 13); await F.pass(4); F.setDate(1632, 2, 19); await F.pass(4);
  };

  // ── 위그노
  var FOUR = ['d_artagnan', 'athos', 'porthos', 'aramis'];
  E.huguenot_call = async function () { F.base(1627, 9, 1); FOUR.forEach(function (id) { F.mate(id); }); var fr = cityByName('보르도'); await F.enter(fr != null ? fr : EN.paris); note('phase=' + (S().huguenot || {}).phase + ' owner=' + G.R.cityOwner(G.CITY_DATA[S().loc.city])); };
  E.huguenot_rochelle = async function () {
    var s = F.base(1627, 10, 1); FOUR.forEach(function (id) { F.mate(id); }); s.huguenot = { phase: 'call', at: s.day - 60, tries: 0 };
    var bx = cityByName('보르도') || cityByName('낭트') || 0, pt = F.seaNear(-1.45, 46.1);
    await F.sea(bx, pt[0], pt[1]); note('pending=' + G.Huguenot.seaPending() + ' at ' + pt);
    await F.drive(G.Huguenot.atSea(), 90000);
    note('phase=' + (S().huguenot || {}).phase + ' side=' + (S().huguenot || {}).side);
  };

  // ── 은징가
  E.nzinga_emb = async function () { F.base(1621, 12, 1); await F.enter(EN.luanda); };
  E.nzinga_guns = async function () { F.base(1625, 1, 10); F.cargo('guns', 80); await F.enter(EN.luanda); note('guns=' + (S().nzinga || {}).guns); };
  E.nzinga_kombi = async function () { F.base(1647, 9, 10); await F.enter(EN.luanda); note('kombi=' + (S().nzinga || {}).kombi); };
  E.nzinga_ransom = async function () { F.base(1655, 6, 1); await F.enter(EN.luanda); note('ransom=' + (S().nzinga || {}).ransom); };

  // ── 명의 멸망
  E.mingfall_night = async function () { F.base(1644, 4, 1); await F.enter(EN.beijing, { via: 'land' }); note('mf=' + JSON.stringify(S().mingFall || {})); };
  E.mingfall_maid = async function () { F.base(1644, 7, 1); await F.enter(EN.beijing, { via: 'land' }); note('mf=' + JSON.stringify(S().mingFall || {}) + ' mates=' + S().mates.map(function (m) { return m.id; })); };
  E.mingfall_deliver = E.mingfall_maid;
  E.mingfall_again = async function () {
    var s = F.base(1645, 3, 1); s.mingFall = { told: {}, night: 'no', maid: 'take', letter: 'done', asked: 1, askDay: 0 };
    await F.enter(EN.beijing, { via: 'land' }); note('mf=' + JSON.stringify(S().mingFall || {}) + ' mates=' + S().mates.map(function (m) { return m.id; }));
  };

  // ── 베스트팔렌
  E.westphalia_feast = async function () { var s = F.base(1648, 6, 10); s.westph = { told: {}, oath: 'no' }; await F.enter(EN.amsterdam); };
  E.westphalia_table = async function () { F.base(1648, 7, 1); await F.enter(EN.bremen); };

  // ── 명예혁명
  function frenchPort() { return G.CITY_DATA.filter(function (c) { return c && c.port && /^프랑스/.test(G.R.cityOwner(c) || '') && G.R.cityExists(c); }).map(function (c) { return c.id; })[0]; }
  E.glory_o_call = async function () { F.base(1688, 8, 1); await F.enter(EN.amsterdam); note('o=' + (S().glory || {}).o); };
  E.glory_o_wind = async function () {
    var s = F.base(1688, 11, 12); s.glory = { o: 1, j: 0, next: {}, seen: {}, heardO: 1 };
    var pt = F.seaNear(-1.5, 50.3); await F.sea(EN.london, pt[0], pt[1]); note('seaPending=' + G.Glory.seaPending());
    await F.drive(G.Glory.atSea(), 60000); note('o=' + S().glory.o);
  };
  E.glory_j_call = async function () { F.base(1688, 9, 15); await F.enter(EN.london); note('j=' + (S().glory || {}).j); };
  E.glory_j_wind = async function () {
    var s = F.base(1688, 11, 12); s.glory = { o: 0, j: 1, next: {}, seen: {}, heardJ: 1 };
    var pt = F.seaNear(1.2, 51.6); await F.sea(EN.london, pt[0], pt[1]); await F.drive(G.Glory.atSea(), 60000); note('j=' + S().glory.j);
  };
  E.glory_j_flight = async function () { var s = F.base(1688, 12, 20); s.glory = { o: 0, j: 2, next: {}, seen: {}, heardJ: 1, wind: 16881112 }; await F.enter(EN.london); note('j=' + S().glory.j); };
  E.glory_j_france = async function () { var s = F.base(1689, 1, 10); s.glory = { o: 0, j: 3, next: {}, seen: {}, heardJ: 1, wind: 16881112, flight: 16881220 }; var fp = frenchPort(); note('french port ' + fp + ' ' + (G.CITY_DATA[fp] || {}).name); await F.enter(fp); note('j=' + S().glory.j); };
  E.glory_decl = async function () { F.base(1689, 3, 1); await F.enter(EN.london); note('decl=' + (S().glory || {}).decl); };

  // ── 뉴턴
  E.newton_apple = async function () {
    F.base(1666, 6, 1); var f = G.BALANCE.newton.farm, coast = F.seaNear(0.3, 52.95);
    await F.land(f[0], f[1], coast[0], coast[1]);
    for (var i = 0; i < 2 && !(S().newton && S().newton.apple); i++) await F.runDay();
    if (!(S().newton && S().newton.apple)) { note('runDay did not trigger; calling NT.onLand'); var l = S().loc; await F.drive(G.Newton.onLand(l.lon, l.lat, { stop: function () {} }), 60000); }
    note('apple=' + (S().newton || {}).apple + ' loc=' + S().loc.lon.toFixed(2) + ',' + S().loc.lat.toFixed(2) + ' open=' + G.Newton.appleOpen(f[0], f[1]));
  };
  E.newton_principia = async function () { F.base(1686, 6, 1); await F.enter(EN.london); };
  E.newton_principia_book = async function () { var s = F.base(1687, 7, 2); s.newton = { told: {}, met: 1, prin: 1, fund: 'gold', bubble: { shares: 0, cost: 0 } }; await F.pass(5); note('got=' + S().newton.got + ' item=' + G.R.hasItem('principia')); };
  E.newton_news = async function () { var s = F.base(1699, 12, 20); s.newton = { told: { principia: 1 }, met: 1, bubble: { shares: 0, cost: 0 } }; await F.pass(6); note('mint told=' + S().newton.told.mint); };
  E.newton_reoffer = async function () { note('after-1700: offerOpen needs date>=1720-09-20 (newton.js:68); the game clock stops at 1700-01-01 (main.js:377, eraend.js) — not forced'); return 'skip'; };
  E.newton_bubble = async function () { note('after-1700: bubble window 1720 (js/data/newton.js:14) — clock stops at 1700-01-01 — not forced'); return 'skip'; };

  // ── 엘미나 함락 소식
  E.elmina_news_dutch = async function () { var s = F.base(1637, 8, 27); s.mina = s.mina || { told: {} }; s.mina.told = Object.assign({}, s.mina.told); delete s.mina.told.dutch; await F.pass(4); note('told.dutch=' + S().mina.told.dutch); };

  // ── 마녀 모임
  function witches(n) { return G.MATES.filter(function (m) { return m.witch; }).slice(0, n).map(function (m) { return m.id; }); }
  async function coven(n, extra) {
    var s = F.base(1620, 5, 1); witches(n).forEach(function (id) { F.mate(id); }); if (extra) extra(s);
    await F.enter(0); for (var i = 0; i < 5; i++) { QA.aux(); await F.idle(15000); }
    note('coven=' + JSON.stringify(S().coven || {}) + ' members=' + G.Coven.members().length + ' due=' + ((G.Coven.due() || {}).id || null));
  }
  E.coven_curse = function () { return coven(3, function (s) { s.player.luck = 40; }); };
  E.coven_potion = function () { return coven(5, function (s) { s.coven = { seen: { curse: s.day }, last: s.day - 10 }; s.fleet.fatigue = 60; s.fleet.discipline = 50; }); };
  E.coven_new_fashion_party = function () { return coven(7, function (s) { s.coven = { seen: { curse: s.day, potion: s.day }, last: s.day - 10 }; }); };
  E.coven_charm = function () { return coven(10, function (s) { s.coven = { seen: { curse: s.day, potion: s.day, new_fashion_party: s.day }, last: s.day - 10 }; s.mates[0].loyal = 60; }); };
  E.coven_coven_oath = async function () { note('already diagnosed (static) — mechanism probe:'); await coven(13, function (s) { s.coven = { seen: { curse: s.day, potion: s.day, new_fashion_party: s.day, charm: s.day }, last: s.day - 10 }; }); };
  E.coven_wage_waiver = async function () { note('already diagnosed (static) — mechanism probe:'); await coven(16, function (s) { s.coven = { seen: { curse: s.day, potion: s.day, new_fashion_party: s.day, charm: s.day, coven_oath: s.day }, last: s.day - 10 }; }); };

  // ── 옛이야기
  function frenchForest() { return F.findPt(2.35, 48.85, 3, function (x, y) { return G.Tale.frenchForest(x, y); }, 0.1); }
  function germanForest() { return F.findPt(10, 51, 4, function (x, y) { return G.Tale.germanForest(x, y); }, 0.1); }
  async function tryLand(n, check, fallback) {
    for (var i = 0; i < n && !check(); i++) { await F.runDay(); var l = S().loc; if (l.mode !== 'land') break; }
    if (!check() && fallback) { note('runDay did not trigger in ' + n + ' days; calling hook directly'); for (var k = 0; k < 15 && !check(); k++) await F.drive(fallback(), 60000); }
  }
  E.tale_cinderella = async function () {
    var s = F.base(1620, 6, 1); F.cargo('glass', 5); var pt = frenchForest(); note('forest ' + pt);
    await F.land(pt[0], pt[1]); var l = S().loc;
    await tryLand(6, function () { return S().mates.some(function (m) { return m.id === 'cinderella'; }); }, function () { var l2 = S().loc; l2.lon = pt[0]; l2.lat = pt[1]; return G.Tale.onLand(pt[0], pt[1], { stop: function () {} }); });
  };
  E.tale_snow_white = async function () {
    var s = F.base(1620, 6, 1); s.mates = []; F.maleMates(6).forEach(function (id, i) { F.mate(id, i === 0 ? 'first' : 'none'); }); note('mates=' + S().mates.length + ' snowOk=' + G.Tale.snowOk());
    var pt = frenchForest(); await F.land(pt[0], pt[1]);
    await tryLand(6, function () { return S().mates.some(function (m) { return m.id === 'snow_white'; }); }, function () { var l2 = S().loc; l2.lon = pt[0]; l2.lat = pt[1]; return G.Tale.onLand(pt[0], pt[1], { stop: function () {} }); });
  };
  E.tale_sleeping_beauty = async function () {
    F.base(1620, 6, 1); F.found('dragon'); var pt = germanForest(); note('forest ' + pt + ' beautyOk=' + G.Tale.beautyOk());
    await F.land(pt[0], pt[1]); await F.camp(/쉰다/);
    if (!S().mates.some(function (m) { return m.id === 'sleeping_beauty'; })) { note('camp did not trigger'); }
  };
  E.tale_little_mermaid = async function () {
    F.base(1620, 6, 1); var pt = F.findPt(10.4, 55.3, 1, function (x, y) { return G.Geo.isLand(x, y) && G.Tale.danishIsland(x, y); }, 0.05), sp = F.seaNear(pt[0], pt[1]); note('isle ' + pt + ' ship ' + sp);
    await F.land(pt[0], pt[1], sp[0], sp[1]); await F.camp(/사냥한다/);
  };
  E.joan = async function () {
    F.base(1620, 6, 1); var CB = G.Cabins, slot = 1; try { CB.remodel(slot, 'chapel'); S().mates.forEach(function (m) { if (m.room === slot) CB.place(m, null); }); } catch (e) { note('remodel err ' + e.message); }
    note('emptyChapel=' + G.Joan.emptyChapel());
    var pt = frenchForest(); await F.land(pt[0], pt[1]);
    for (var i = 0; i < 8 && !(S().joan && S().joan.done); i++) { await F.camp(/약초를 캔다/); var l = S().loc; if (l.mode !== 'land') break; l.lon = pt[0]; l.lat = pt[1]; }
    note('joan=' + JSON.stringify(S().joan || {}));
  };
  E.snowqueen_gerda = async function () {
    F.base(1620, 6, 1); var L = G.SnowQueen && G.SnowQueen.LAKES ? G.SnowQueen.LAKES : [['라도가 호', 31.5, 60.9]], lk = L[0];
    var pt = F.findPt(lk[1], lk[2], 1, function (x, y) { return G.Geo.isLand(x, y); }, 0.05); note('lake shore ' + pt);
    await F.land(pt[0], pt[1]);
    for (var i = 0; i < 6 && !S().mates.some(function (m) { return m.id === 'gerda'; }); i++) { await F.camp(/쉰다/); var l = S().loc; if (l.mode !== 'land') break; l.lon = pt[0]; l.lat = pt[1]; }
  };
  E.snowqueen_moscow = async function () {
    var s = F.base(1620, 6, 1); F.mate('gerda'); s.snowQ = { stage: 'escort' };
    G.Games.puzzle = function () { note('puzzle → solved (stub)'); return Promise.resolve(true); };
    await F.enter(EN.moscow, { via: 'land' }); note('snowQ=' + JSON.stringify(S().snowQ || {}));
  };
  E.snowqueen_stow = async function () { var s = F.base(1620, 6, 1); s.snowQ = { stage: 'stow' }; var riga = cityByName('리가') || 0; await F.enter(riga); note('snowQ=' + JSON.stringify(S().snowQ || {})); };
  E.pinocchio_rescue = async function () {
    var s = F.base(1620, 6, 1); s.pino = { whales: 6 };
    await F.sea(0, -30, 30, 20);
    var w0 = G.U.weighted; G.U.weighted = function (tb) { return tb.find(function (e) { return e[0] === 'whales'; }) || tb[0]; };
    try { for (var i = 0; i < 3 && !(S().pino && S().pino.stage); i++) { S().evtRecent = []; await F.drive(G.Explore.seaEvent({ st: G.Scenes.sea.runtime() || {}, refresh: function () {} }), 60000); } } finally { G.U.weighted = w0; }
    note('pino=' + JSON.stringify(S().pino || {}) + ' (sea event forced to 「고래 떼」 via U.weighted stub)');
  };
  E.pinocchio_join = async function () { var s = F.base(1620, 6, 1); s.pino = { whales: 6, stage: 'carry', metDay: s.day - 3 }; await F.enter(0); note('pino=' + JSON.stringify(S().pino || {})); };
  E.peter_lost = async function () {
    var s = F.base(1620, 6, 1), y = s.date.y;
    s.player.kids.push({ name: '마테오', sex: 'm', born: { y: y - 13, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, aboard: true, bond: 50, met: true });
    var pt = F.findPt(-7.0, 57.6, 1, function (x, y) { return G.Geo.isLand(x, y) && G.Peter.isle(x, y); }, 0.05), sp = F.seaNear(pt[0], pt[1]); note('isle ' + pt + ' kid=' + (G.Peter.kid() || {}).name);
    await F.land(pt[0], pt[1], sp[0], sp[1]); await sleep(500); await F.idle(30000);
    note('peter=' + JSON.stringify(S().peter || {}));
    if (S().peter && S().peter.phase === 'lost') { for (var i = 0; i < 3 && S().peter.phase === 'lost'; i++) { await F.camp(/약초를 캔다/); var l = S().loc; if (l.mode !== 'land') break; l.lon = pt[0]; l.lat = pt[1]; } note('after herb peter=' + JSON.stringify(S().peter || {})); }
  };
  E.peter_return = E.peter_lost;
  E.mowgli = async function () {
    F.base(1620, 6, 1); F.cargo('banana', 40); F.mate('h_pocahontas'); var d = G.CITY_DATA[145];
    var pt = F.findPt(d.lon + 0.5, d.lat, 2, function (x, y) { return G.Mowgli.forest(x, y); }, 0.1); note('pt ' + pt);
    G.Game.go('land', { from: 145 }); await sleep(300); await F.idle(30000); var l = S().loc; l.lon = pt[0]; l.lat = pt[1];
    await tryLand(8, function () { return S().mates.some(function (m) { return m.id === 'mowgli'; }) || (S().mowgli && S().mowgli.cool); }, function () { var l2 = S().loc; l2.lon = pt[0]; l2.lat = pt[1]; return G.Mowgli.onLand(pt[0], pt[1], { stop: function () {} }); });
    note('mowgli=' + JSON.stringify(S().mowgli || {}));
  };
  E.tarzan = async function () {
    F.base(1620, 6, 1); var sl = G.CITY_DATA[91]; var pt = F.findPt(sl.lon + 0.8, 8.5, 1.5, function (x, y) { return G.Tarzan.jungle(x, y); }, 0.05), sp = F.seaNear(sl.lon, sl.lat);
    note('jungle ' + pt + ' ship ' + sp);
    await F.land(pt[0], pt[1], sp[0], sp[1]); var l = S().loc; l.base = { type: 'ship', lon: pt[0] + 0.3, lat: pt[1] };
    await F.camp(/사냥한다|일기토/);
    note('tarzan=' + JSON.stringify(S().tarzan || {}));
  };
  E.tam = async function () {
    F.base(1620, 6, 1); F.cargo('silk', 5); var pt = F.findPt(107.5, 12, 3, function (x, y) { return G.Tam.vietCoast(x, y); }, 0.1); note('coast ' + pt);
    await F.sea(cityByName('유에') || 0, pt[0], pt[1]); await F.drive(G.Tam.afterFish(), 60000); note('tam=' + JSON.stringify(S().tam || {}) + ' (fishing minigame bypassed: G.Tam.afterFish called directly)');
  };
  E.maria = async function () {
    F.base(1620, 6, 1); F.found('crocodile'); var pt = F.findPt(121, 14.5, 2, function (x, y) { return G.Geo.isLand(x, y) && G.Maria.philippines(x, y); }, 0.05), sp = F.seaNear(pt[0], pt[1]);
    await F.land(pt[0], pt[1], sp[0], sp[1]); await F.camp(/사냥한다/); note('maria=' + JSON.stringify(S().maria || {}));
  };
  E.littleprince_meet = async function () {
    F.base(1620, 6, 1, { fame: 90000 }); var pt = F.findPt(30, 26, 4, function (x, y) { return G.LittlePrince.isDesert(x, y); }, 0.1); note('desert ' + pt);
    await F.land(pt[0], pt[1]); await F.camp(/정찰한다/); note('lp=' + JSON.stringify(S().lprince || {}));
  };
  E.littleprince_well = async function () {
    await E.littleprince_meet(); var p = S().lprince; if (!p || p.phase !== 'map') { note('no map'); return; }
    var l = S().loc; l.lon = p.tlon; l.lat = p.tlat;
    await tryLand(2, function () { return S().lprince.phase === 'done' || S().lprince.dug; }, function () { return G.LittlePrince.onLand(p.tlon, p.tlat, { stop: function () {} }); });
    note('lp=' + JSON.stringify(S().lprince || {}));
  };

  // ── 전설 (건물)
  function chinaTaverns() { return G.CITY_DATA.filter(function (c) { return G.Legend.isChina(c) && G.R.cityExists(c) && G.R.facilities(c).tavern; }).map(function (c) { return c.id; }); }
  async function inBuilding(cid, kind, fn) {
    var C = G.Scenes.city;
    if (G.Game.sceneName !== 'city' || S().loc.city !== cid) await F.enter(cid);
    var ok = await F.visit(kind); if (!ok) { note('could not enter ' + kind + ' in ' + G.CITY_DATA[cid].name); return; }
    if (fn) await fn(G.CITY_DATA[cid], C.B[kind]);
    await F.leave();
  }
  E.legend_tao = async function () {
    F.base(1620, 6, 1); var ch = chinaTaverns(); note('china taverns ' + ch.slice(0, 4));
    for (var i = 0; i < 3; i++) await inBuilding(ch[i], 'tavern', async function (c, B) { for (var k = 0; k < 3; k++) await F.drive(B.drink(c), 20000); });
    note('tao=' + JSON.stringify((S().legend || {}).tao));
  };
  E.legend_zhuge = async function () { F.base(1620, 6, 1); F.mate('liu_bei', 'first'); var ch = chinaTaverns(); for (var i = 0; i < 3; i++) await inBuilding(ch[i], 'inn'); note('zhuge=' + JSON.stringify((S().legend || {}).zhuge)); };
  E.legend_dartagnan = async function () {
    F.base(1620, 6, 1);
    await inBuilding(EN.paris, 'market', async function (c, B) {
      var n = 0, ch0 = G.UI.choose, nu0 = G.UI.number; G.UI.choose = async function (t, list) { n++; var it = list.filter(function (x) { return !x.disabled; })[0]; return n <= 3 && it ? it.value : null; }; G.UI.number = async function () { return 1; };
      try { await F.drive(B.buy(c), 40000); } finally { G.UI.choose = ch0; G.UI.number = nu0; }
    });
    note('dart=' + JSON.stringify((S().legend || {}).dart) + ' (UI.choose/number stubbed to buy 3 items like tests/legends_smoke.js)');
  };
  E.legend_musketeers = async function () { F.base(1620, 6, 1); F.mate('d_artagnan'); var fr = [15, 18, 20, 21, 22]; for (var i = 0; i < 4; i++) await inBuilding(fr[i], 'tavern'); note('musk=' + JSON.stringify((S().legend || {}).musk)); };
  E.legend_scheherazade = async function () {
    var s = F.base(1620, 6, 1, { skill: 3 }); var LB = G.Scenes.city.B.library;
    var lib = G.CITY_DATA.filter(function (c) { return G.Legend.isIslam(c) && G.R.cityExists(c) && G.R.facilities(c).library; }).map(function (c) { return { id: c.id, open: LB.shelfBooks(c).filter(function (b) { return LB.shelfState(b).kind !== 'lock'; }).length }; }).sort(function (a, b) { return b.open - a.open; });
    note('islam libraries ' + JSON.stringify(lib.slice(0, 3)));
    if (!lib.length) return;
    await inBuilding(lib[0].id, 'library', async function (c, B) { var books = B.shelfBooks(c).filter(function (b) { return B.shelfState(b).kind !== 'lock'; }).slice(0, 5); for (var i = 0; i < books.length; i++) await F.drive(B.pick(c, books[i]), 20000); if (books.length < 5) { note('only ' + books.length + ' readable books — using Legend._t.bookRead for the rest'); for (var k = books.length; k < 5; k++) await F.drive(G.Legend._t.bookRead(c), 20000); } });
  };
  E.legend_lamp = async function () {
    F.base(1620, 6, 1); F.mate('scheherazade', 'interp'); var ott = G.CITY_DATA.filter(function (c) { return G.Legend.isOttoman(c) && G.R.cityExists(c) && G.R.facilities(c).trade; }).map(function (c) { return c.id; });
    G.R.invest(ott[0]).amt = 200000; G.R.invest(ott[1]).amt = 200000; note('ottoman ' + ott.slice(0, 2) + ' lv=' + G.R.investLv(ott[0]));
    await inBuilding(ott[0], 'trade'); await inBuilding(ott[1], 'trade');
  };
  E.fivetigers = async function () {
    var s = F.base(1620, 6, 1); ['guan_yu', 'zhang_fei', 'athos', 'porthos', 'aramis'].forEach(function (id) { F.mate(id); }); s.tigers = { since: s.day - 500 };
    for (var i = 0; i < 8 && !(S().tigers && S().tigers.done); i++) { await F.enter(i % 2 ? 0 : 1); S().tigers.since = S().day - 500; }
    note('tigers=' + JSON.stringify(S().tigers || {}) + ' due=' + G.Tigers.due());
  };
  E.quixote_meet = async function () { F.base(1620, 6, 1); await F.enter(EN.toledo); note('quix=' + JSON.stringify(S().quix || {})); };
  E.quixote_tours = async function () { await E.quixote_meet(); await F.enter(EN.tours); await F.enter(EN.toulouse); await F.enter(EN.coruna); note('quix=' + JSON.stringify(S().quix || {})); };
  E.quixote_toulouse = E.quixote_tours; E.quixote_santiago = E.quixote_tours;
  E.simcheong = async function () { F.base(1620, 6, 1); F.cargo('rice', 320); await F.enter(EN.hanyang); note('sim=' + JSON.stringify(S().sim || {})); };
  E.gyeonwoo_offer = async function () { F.base(1620, 6, 1, { ship: 'geobukseon' }); await F.enter(EN.hanyang); note('gw=' + JSON.stringify(S().gw || {})); };
  E.gyeonwoo_chain = async function () { await E.gyeonwoo_offer(); if (!(S().gw && S().gw.stage === 1)) return; await F.enter(EN.hangzhou); await F.enter(EN.sakai); await F.enter(EN.hansan); note('gw=' + JSON.stringify(S().gw || {})); };
  E.napoleon_rescue = async function () {
    var s = F.base(1620, 6, 1); await F.sea(cityByName('제노바') || 0, 8.6, 42.2);
    G.Napoleon.afterBattle({ kind: 'pirate' }, 'win', [{ side: 'en', sunk: true }], []); await F.drive(G.Napoleon.tell(), 60000);
    note('napo=' + JSON.stringify(S().napo || {}) + ' (battle result simulated: afterBattle+tell as battle.js:1554/1582)');
  };
  E.napoleon_family = async function () {
    var s = F.base(1620, 6, 1); s.napo = { phase: 'rescued', at: s.day - 30 }; F.mate('napoleon');
    await F.sea(0, -12, 40); G.Napoleon.afterBattle({ kind: 'pirate' }, 'win', [{ side: 'en', captured: true }], []); await F.drive(G.Napoleon.tell(), 60000); note('napo=' + JSON.stringify(S().napo || {}));
  };
  E.napoleon_salon = async function () { var s = F.base(1620, 6, 1); s.napo = { phase: 'joined', at: s.day - 30 }; F.mate('napoleon'); F.item('compass'); await F.enter(EN.vienna, { via: 'land' }); note('napo=' + JSON.stringify(S().napo || {})); };

  // ── 왕녀
  E.princess_call = async function () { var s = F.base(1620, 6, 1, { fame: 60000 }); s.player.wife = null; await F.pass(2); note('princess=' + JSON.stringify(S().princess || {})); };
  E.princess_quest = async function () {
    await E.princess_call(); var p = S().princess; if (!p) return; var sp = G.SPONSOR[p.sp];
    await F.drive(G.Princess.audience(sp), 60000); note('after audience stage=' + S().princess.stage + ' (palace audience called directly)');
    G.Princess.afterBattle({ kind: 'pirate', princess: 'levant' }, 'win', [], []); await F.drive(G.Princess.tell(), 60000);
    G.Princess.afterBattle({ kind: 'pirate', princess: 'den' }, 'win', [], []); await F.drive(G.Princess.tell(), 60000);
    note('stage=' + S().princess.stage); await F.drive(G.Princess.audience(sp), 90000); note('princess=' + JSON.stringify(S().princess));
  };

  // ── 그 밖
  E.castaway_wilson = async function () {
    F.base(1620, 6, 1); var pt = F.landNear(-9.0, 39.2), sp = F.seaNear(pt[0], pt[1]); await F.land(pt[0], pt[1], sp[0], sp[1]);
    for (var i = 0; i < 30 && !G.R.hasItem('wilson'); i++) { await F.camp(/사냥한다/); var l = S().loc; if (l.mode !== 'land') break; l.lon = pt[0]; l.lat = pt[1]; }
    note('castaway=' + JSON.stringify(S().castaway || {}).slice(0, 200));
  };
  E.castaway_journal = async function () {
    await E.castaway_wilson(); var pt = [S().loc.lon, S().loc.lat];
    for (var i = 0; i < 40 && !(S().castaway && S().castaway.journal); i++) { await F.camp(/쉰다/); var l = S().loc; if (l.mode !== 'land') break; l.lon = pt[0]; l.lat = pt[1]; }
    note('castaway=' + JSON.stringify(S().castaway || {}).slice(0, 200));
  };
  E.colony_call = async function () { F.base(1620, 6, 1, { fame: 250000 }); await F.pass(2); note('colony=' + JSON.stringify(S().colony || {}).slice(0, 200)); };
  E.family_osa = async function () {
    var s = F.base(1620, 6, 1); s.player.generation = Math.max(2, s.player.generation || 2); s.player.heir = s.player.heir || { sex: 'm' }; s.player.wife = null; s.player.born = { y: 1598, m: 1, d: 1 };
    note('osa open=' + G.Osa.open() + ' age=' + G.R.age());
    for (var i = 0; i < 6 && !(S().osa && S().osa.stage >= 1); i++) { if (S().osa) S().osa.last = -999; note('osa enter ' + i + ' ' + QA.date()); await F.enter(S().player.home, { via: 'sea' }); note('osa=' + JSON.stringify(S().osa || {}).slice(0, 120)); }
    note('osa=' + JSON.stringify(S().osa || {}).slice(0, 200));
  };
  E.family_firstlove = async function () {
    var s = F.base(1620, 6, 1), p = s.player, d = null;
    var heirK = { name: p.given || p.name }; for (var i = 0; i < 20; i++) { d = G.OldGuard.makeKin('friend', p, heirK); if (d && d.g === 'f') break; }
    if (!d) { note('makeKin returned nothing'); return; }
    if (d.g !== 'f') d.g = 'f'; d.kinOf = p.given || p.name; if (!G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; }
    F.mate(d.id); p.wife = null; note('friend ' + d.id + ' isMine=' + G.FirstLove.isMine(G.MATE[d.id]));
    await F.sea(0, -12, 38); var o = G.FirstLove.st(); o.sea = S().day - 10;
    for (var k = 0; k < 10 && !(G.FirstLove.st().st); k++) { QA.aux(); await F.idle(10000); }
    note('fl=' + JSON.stringify(G.FirstLove.st()));
  };
  E.family_kidwed = async function () {
    var s = F.base(1620, 6, 1), y = s.date.y; s.player.wife = 'm_lis';
    s.player.kids.push({ name: '이사벨', sex: 'f', born: { y: y - 19, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 60, mar: 50, cha: 70 }, edu: {}, bond: 70, met: true, touch: 10 });
    note('due=' + JSON.stringify(G.KidWed.due && G.KidWed.due()).slice(0, 100));
    await F.enter(s.player.home); await inBuilding(s.player.home, 'home');
  };

  // ================================================================ 돌리기
  F.run = async function (id) {
    F.notes = []; var r0 = QA.evDump().log.length, t0 = Date.now(), res = null, err = null;
    try { if (!E[id]) return { id: id, skipped: 'no handler' }; res = await E[id](); }
    catch (e) { err = String(e && e.stack || e).slice(0, 400); }
    try { await F.idle(10000); } catch (e) { /* 없음 */ }
    var log = QA.evDump().log.slice(r0).map(function (x) { return x[0] + ' ' + x[1]; });
    return { id: id, res: res, err: err, notes: F.notes.slice(0, 30), log: log, ms: Date.now() - t0, scene: G.Game.sceneName, date: QA.date() };
  };
})();
