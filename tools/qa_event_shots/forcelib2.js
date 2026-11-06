/* forcelib2.js — forcelib.js(window.FORCE) 뒤에 넣는다. 아직 손잡이가 없던 사건들 (자연히 일어난 1600~1699 사건 · 1600년 전 사건 · 그 밖).
   window.FORCE2[id] = async function () {...} 를 더하고, FORCE.run 이 FORCE2 를 먼저 보게 감싼다. */
(function () {
  'use strict';
  var E2 = window.FORCE2 = {};
  function boot() {
    var F = window.FORCE;
    if (!F || !window.QA || !QA.evDump) return false;
    if (F.run.__f2) return true;
    var run0 = F.run;
    F.run = async function (id) {
      var T = window.FORCE2;
      if (!T[id]) return run0(id);
      F.notes = []; var r0 = QA.evDump().log.length, t0 = Date.now(), res = null, err = null;
      try { res = await T[id](); }
      catch (e) { err = String(e && e.stack || e).slice(0, 400); }
      try { F.specific = null; await F.idle(10000); } catch (e) { /* 없음 */ }
      var ok = null; try { ok = window.FORCE2_OK && window.FORCE2_OK[id] ? !!window.FORCE2_OK[id](res) : null; } catch (e) { ok = false; }
      F.notes.push('FIRED2=' + ok + ' RES=' + (typeof res === 'string' ? res : JSON.stringify(res)).slice(0, 200));
      var log = QA.evDump().log.slice(r0).map(function (x) { return x[0] + ' ' + x[1]; });
      var nn = F.notes.length > 30 ? F.notes.slice(0, 29).concat(F.notes.slice(-1)) : F.notes.slice();
      return { id: id, res: res, err: err, notes: nn, log: log, ms: Date.now() - t0, scene: G.Game.sceneName, date: QA.date() };
    };
    F.run.__f2 = 1;
    return true;
  }
  if (!boot()) { var t = setInterval(function () { if (boot()) clearInterval(t); }, 30); }

  // ================================================================ 도움
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function F() { return window.FORCE; }
  function S() { return G.Game.state; }
  function note(t) { F().notes.push(String(t)); }
  function dn(n) { return { y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }; }
  function today() { return G.U.dateNum(S().date); }
  function cid(name) { var c = G.CITY_DATA.filter(function (x) { return x && x.name === name; })[0]; return c ? c.id : null; }
  function aboard(id) { return S().mates.some(function (m) { return m.id === id; }); }
  function js(o) { try { return JSON.stringify(o).slice(0, 300); } catch (e) { return String(o); } }
  var H = window.FORCE2H = {};
  H.dn = dn; H.cid = cid;
  /** 그날 하루 앞으로 날을 옮겨 이틀을 보내고, 역사 소식이면 도시의 「세상의 소식」 창(js/scenes/city.js C.news — 입항·숙박 때와 같은 창)으로 보인다 */
  H.newsAt = async function (dates, opt) {
    opt = opt || {}; var shown = 0, texts = [];
    if (opt.warm !== false && dates.length) {   // 먼 날에서 건너온 첫날의 밀린 소식(소문·관계 갈래)은 조용히 보낸다
      var w = G.U.addDays(dn(dates[0]), -4);
      if (G.U.dateNum(S().date) < G.U.dateNum(w)) { F().setDate(w.y, w.m, w.d); if (opt.born) S().player.born = opt.born; }
      G.Game.passDays(1);
    }
    for (var i = 0; i < dates.length; i++) {
      var d = dates[i], before = G.U.addDays(dn(d), -(opt.lead || 1));
      if (G.U.dateNum(S().date) < G.U.dateNum(before)) { F().setDate(before.y, before.m, before.d); if (opt.born) S().player.born = opt.born; }
      if (opt.each) opt.each(d);
      var msgs = G.Game.passDays(opt.days || 2) || [];
      var hist = msgs.filter(function (m) { return m && m.history; });
      msgs.filter(function (m) { return m && !m.history; }).forEach(function (m) { G.UI.toast(m.text, m.icon); });
      if (hist.length) { shown += hist.length; hist.forEach(function (m) { texts.push(String(m.text).slice(0, 40)); }); await F().drive(G.Scenes.city.news(hist), 30000); }
    }
    note('news shown ' + shown + ': ' + texts.join(' | ').slice(0, 600));
    return shown;
  };
  /** .modal-back 이 아닌 화면(온 화면 나레이션·신기루)을 손으로 찍는다 */
  H.shot = async function (ev, i, el, title, kind) {
    if (!window.__shot) return;
    var imgs = el ? [].slice.call(el.querySelectorAll('img')) : [];
    var bgs = []; if (el) [el].concat([].slice.call(el.querySelectorAll('*'))).forEach(function (x) { var bi = getComputedStyle(x).backgroundImage; if (bi && bi !== 'none') { var m = bi.match(/url\("?([^")]+)"?\)/); if (m && !/data:image\/svg/.test(m[1])) bgs.push(m[1].replace(/^.*\/images\//, '')); } });
    await window.__shot({ ev: ev, i: i, title: title, kind: kind || 'overlay', text: el ? (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300) : '', imgs: imgs.map(function (im) { return { src: (im.getAttribute('src') || '').replace(/^.*\/images\//, '').slice(0, 120), ok: im.complete && im.naturalWidth > 0, w: im.naturalWidth, h: im.naturalHeight, cls: im.className }; }), bgs: bgs.slice(0, 8), canvases: [], bad: [], overflow: '', date: S() ? S().date.y + '.' + S().date.m + '.' + S().date.d : '', scene: G.Game.sceneName });
  };
  /** 도시에 들어선다 (forcelib F.enter) — via 를 고른다 */
  H.enter = function (id, via) { return F().enter(id, via ? { via: via } : undefined); };
  /** 이 사건의 일지 줄이 생겼나 */
  H.logged = function (re) { return QA.evDump().log.some(function (x) { return re.test(x[1]); }); };
  /** 한 번만 조정값을 바꿔 돌리고 되돌린다 */
  H.withBal = async function (obj, patch, fn) { var old = {}; Object.keys(patch).forEach(function (k) { old[k] = obj[k]; obj[k] = patch[k]; }); try { return await fn(); } finally { Object.keys(old).forEach(function (k) { obj[k] = old[k]; }); } };

  // ================================================================ A) 1600~1699 — 자연히 일어나 손잡이가 없던 것
  var LUANDA = 100, AMS = 24, LONDON = 38, VENICE = 29;
  // ── 갈릴레이의 망원경: 베니스에서 받고 → 먼 바다에서 시험 → 베니스에 알린다
  E2.sky_gal = async function () {
    F().base(1609, 8, 1); await H.enter(VENICE);
    note('gal=' + (S().sky || {}).gal);
    if (!(S().sky && S().sky.gal === 1)) return 'no offer';
    await F().sea(VENICE, 15.5, 41.0, 10); await F().drive(G.Sky.atSea(), 60000);
    note('after sea gal=' + S().sky.gal);
    await H.enter(VENICE); note('gal=' + S().sky.gal);
    return 'gal=' + S().sky.gal;
  };
  // ── 은징가 ③ 마탐바의 왕 · ⑤ 사의 함대 · 소식
  E2.nzinga_court = async function () { F().base(1632, 3, 1); await H.enter(LUANDA); note('nz=' + js(S().nzinga)); return (S().nzinga || {}).court; };
  E2.nzinga_sa = async function () { F().base(1648, 8, 5); await H.enter(LUANDA); note('nz=' + js(S().nzinga)); return (S().nzinga || {}).sa; };
  E2.nzinga_news = async function () {
    var s = F().base(1622, 6, 20); s.nzinga = { told: {}, met: 1, emb: 'go' };
    var K = G.Nzinga.K; return H.newsAt([K.baptism, K.crown, K.kindonga, K.matamba, K.dutch, K.ngoleme, K.kavanga, K.kifunji, K.kombi, K.retake, K.peace, K.death]);
  };
  // ── 명·청 소식
  E2.mingfall_news = async function () {
    F().base(1644, 1, 20); G.MingFall.state();
    var K = G.MingFall.K || {}; var at = [K.shun, K.fall, K.passAt, K.burn, K.qing, K.shunzhi, K.nanjing].filter(Boolean);
    note('dates ' + at.join(','));
    return H.newsAt(at);
  };
  // ── 베스트팔렌 ① 뮌스터의 맹세 · 소식 (+ 관계 사건 rf_westphalia 가 같은 날 겹치는지)
  E2.westphalia_oath = async function () { F().base(1648, 3, 20); await H.enter(AMS); note('wp=' + js(S().westph)); return (S().westph || {}).oath; };
  E2.westphalia_news = async function () {
    F().base(1648, 1, 20); var K = G.Westphalia.K;
    return H.newsAt([K.sign, K.oath, K.proclaim, K.peace, K.pope]);
  };
  // ── 명예혁명: 권리장전의 날(교역 증서) · 소식
  E2.glory_bill = async function () {
    var s = F().base(1689, 12, 20); s.glory = { o: 'done', j: 0, decl: 'seen', declDay: 16890301, oath: 'yes', next: {}, seen: {} };
    var D = G.GLORY || {}; (D.news || []).forEach(function (n, i) { if (n.d < 16891226) s.glory.seen[i] = 1; });
    await H.newsAt([16891226]); note('glory=' + js(S().glory)); return 'charter=' + S().glory.charter;
  };
  E2.glory_news = async function () {
    var s = F().base(1688, 6, 10);
    var D = G.GLORY || {}; var ds = (D.news || []).map(function (n) { return n.d; });
    note('news dates ' + ds.join(','));
    // 「part」 소식(1690~1694)은 이 일에 낀 제독에게만 — 오라녜 공과 함께 건넌 것으로
    return H.newsAt(ds, { each: function (d) { if (d >= 16900101 && S().glory) S().glory.o = 'done'; } });
  };
  // ── 엘미나 ⑥ 돌아오지 않는 문
  E2.elmina_door = async function () { F().base(1640, 3, 1); await H.enter(97); note('mina=' + js(S().mina)); return (S().mina || {}).door; };
  // ── 포카혼타스의 중재: 북아메리카 항구
  E2.pocahontas = async function () {
    F().base(1620, 6, 1);
    var ports = G.CITY_DATA.filter(function (c) { return c && G.Pocahontas && G.Pocahontas.isPort(c) && G.R.cityExists(c); }).map(function (c) { return c.id; });
    note('ports ' + ports.slice(0, 5) + ' ready=' + G.Pocahontas.ready());
    await H.enter(ports[0]); note('poca=' + js(S().poca)); return aboard('h_pocahontas') ? 'joined' : js(S().poca);
  };
  // ── 산티아고 순례 완료 (투르·툴루즈를 마친 순례자를 태우고 라코루냐에)
  E2.quixote_santiago = async function () {
    var s = F().base(1620, 6, 1); F().mate('don_quixote'); F().mate('sancho_panza');
    s.quix = { stage: 'pilgrim', tours: 1, toulouse: 1, warned: 1, met: s.day - 200 };
    await H.enter(2); note('quix=' + js(S().quix)); return js(S().quix);
  };
  // ── 신기루: 아직 세워지지 않은(1600~1699년에 세워질) 바다·뭍의 발견물 자리에서
  E2.mirage = async function () {
    var s = F().base(1600, 6, 1);
    var cands = G.DISCOVERIES.filter(function (d) { return (d.how === 'sea' || d.how === 'land') && d.built && d.built > 1601 && d.built < 1700 && d.lon != null && !(d.openY && d.openY > 1600); });
    cands.sort(function (a, b) { return a.built - b.built; });
    var d = cands.filter(function (x) { return x.how === 'land'; })[0] || cands[0]; if (!d) { note('no candidate'); return 'none'; }
    note('mirage ' + d.id + ' ' + d.name + ' built ' + d.built + ' how ' + d.how + ' active=' + G.Mirage.active(d));
    if (d.how === 'land') { var sp = F().seaNear(d.lon, d.lat); await F().land(d.lon, d.lat, sp[0], sp[1]); G.Disc.checkLand(d.lon, d.lat); }
    else { await F().sea(0, d.lon, d.lat, 10); G.Disc.checkSea(d.lon, d.lat); }
    await sleep(900);
    var el = document.querySelector('#ui .mirage'); note('overlay=' + !!el);
    if (el) await H.shot('mirage', 901, el, '신기루 — ' + d.name, 'overlay');
    for (var k = 0; k < 40 && document.querySelector('#ui .mirage'); k++) await sleep(250);
    return el ? 'shown ' + d.id : 'no overlay';
  };
  // ── 아들의 소꿉친구가 찾아오다 (집)
  E2.family_heirplan_friend = async function () {
    var s = F().base(1620, 6, 1), p = s.player, y = s.date.y;
    p.born = { y: 1570, m: 2, d: 2 };
    p.kids = [{ name: '페드루', sex: 'm', born: { y: y - 20, m: 3, d: 3 }, sk: {}, lg: {}, st: { str: 60, int: 60, mar: 60, cha: 60 }, edu: {}, bond: 70, met: true }];
    if (G.Family && G.Family.setKidName) { try { G.Family.setKidName(p.kids[0], '페드루'); } catch (e) { /* 없음 */ } }
    var K = G.BALANCE.heirPlan || G.BALANCE.heirplan;
    note('heir=' + js(G.HeirPlan.heir && G.HeirPlan.heir()) + ' due=' + (G.HeirPlan.heir() && G.HeirPlan.friendDue(G.HeirPlan.heir())));
    var C = G.Scenes.city;
    await H.enter(p.home);
    await H.withBal(K || {}, { friendVisit: 1 }, async function () { await F().visit('home'); await F().leave(); });
    note('kid=' + js(p.kids[0].cfriend)); return js(p.kids[0].cfriend);
  };
  // ── 부하 커플의 혼례 (항구)
  E2.romance_wedding = async function () {
    var s = F().base(1620, 6, 1); s.mates = [];
    var m = G.MATES.filter(function (x) { return x.g === 'm' && !/^(gyeonwoo|rocco)$/.test(x.id) && !x.witch && !x.tale && !x.legend && !x.eventOnly && x.y && x.y[0] <= 1620 && x.y[1] >= 1620; })[0];
    var fs = G.MATES.filter(function (x) { return x.g === 'f' && !/^(jiknyeo)$/.test(x.id) && !x.witch && !x.tale && !x.minor && !x.sib && x.y && x.y[0] <= 1620 && x.y[1] >= 1620; });
    var f = fs.filter(function (x) { return !x.legend && !x.eventOnly; })[0] || fs[0] || G.MATE.jiknyeo;
    if (!m || !f) { note('no pair: m=' + (m && m.id) + ' f=' + (f && f.id)); return 'no pair'; }
    F().mate(m.id, 'first', { joined: 16100101 }); F().mate(f.id, 'none', { joined: 16100101 });
    var key = G.Romance.key(m.id, f.id);
    s.romance = { pairs: {}, next: 0 }; s.romance.pairs[key] = { m: m.id, f: f.id, heat: 100, stage: 'lover', since: s.day - 400, cd: 0, due: 'wed' };
    note('pair ' + key + ' due=' + js(G.Romance.due('city')));
    await H.withBal(G.BALANCE.romance, { portChance: 1 }, function () { return H.enter(0); });
    var p = S().romance.pairs[key]; note('stage=' + (p && p.stage)); return p && p.stage;
  };
  // ── 대항해시대의 끝: 1699.1.1 · 1699.12.1 소식 → 1700.1.1 온 화면 나레이션 (찍으며 기다린다)
  E2.eraend_warnings = async function () {
    F().base(1698, 12, 20); S().player.born = { y: 1660, m: 2, d: 2 };
    await H.enter(0);
    await H.newsAt([16990101, 16991201], { born: { y: 1660, m: 2, d: 2 } });
    F().setDate(1699, 12, 30); S().player.born = { y: 1660, m: 2, d: 2 };
    // QA.aux(evlog.js)는 나레이션을 곧장 건너뛴다 — 그동안 곁일을 멈추고 tick만 불러 기다리며 찍는다
    var aux0 = QA.aux; QA.aux = function () {};
    try {
      var msgs = G.Game.passDays(3) || [], hist = msgs.filter(function (m) { return m.history; });
      if (hist.length) await F().drive(G.Scenes.city.news(hist), 20000);
      note('over=' + G.EraEnd.over() + ' date=' + QA.date());
      for (var w = 0; w < 40 && !document.querySelector('.era-end'); w++) { await QA.clear(10); G.EraEnd.tick(); await sleep(100); }
      var ov = document.querySelector('.era-end'); if (!ov) { note('no overlay; running=' + !!G.EraEnd.running + ' ui=' + G.UI.busy()); return 'no overlay'; }
    var t0 = Date.now(), shot = { a: 0, b: 0 };
    while (Date.now() - t0 < 90000) {
      await sleep(250);
      ov = document.querySelector('.era-end'); if (!ov) break;
      if (!shot.a && ov.classList.contains('dated') && ov.querySelectorAll('.ee-line').length >= 3) { shot.a = 1; await H.shot('eraend_warnings', 900, ov, 'era-end overlay — first stanza'); }
      if (!shot.b && ov.classList.contains('dawn') && ov.querySelectorAll('.ee-line').length >= 2) { shot.b = 1; await sleep(400); await H.shot('eraend_warnings', 901, ov, 'era-end overlay — dawn'); }
      if (ov.classList.contains('done')) { await sleep(300); await H.shot('eraend_warnings', 902, ov, 'era-end overlay — end (FINIS)'); var nx = ov.querySelector('.ee-next'); if (nx) nx.click(); break; }
    }
    } finally { QA.aux = aux0; }
    await F().idle(30000);
    note('scene=' + G.Game.sceneName + ' shots=' + js(shot));
    return 'scene ' + G.Game.sceneName;
  };
  // ── 관계 사건 (G.REL_EVENTS) — 그날을 지나며 「세상의 소식」으로
  [['rel_ib_restore', 16401201], ['rel_cr_vienna2', 16830912], ['rel_rf_defenest', 16180523], ['rel_rf_westphalia', 16481024], ['rel_fe_henriette', 16250613], ['rel_no_gustav', 16300706], ['rel_ea_moscow1610', 16100704], ['rel_ea_romanov', 16130221]].forEach(function (x) {
    E2[x[0]] = async function () {
      var d = dn(x[1]), b = G.U.addDays(d, -6); F().base(b.y, b.m, b.d);
      G.Game.passDays(2);   // 1600년에서 건너온 날을 먼저 정리한다 (지난 일은 조용히)
      var n = await H.newsAt([x[1]]);
      var id = x[0].slice(4); note('seen=' + !!(S().rel && S().rel.seen[id]) + ' pend=' + js(S().rel && S().rel.pend));
      if (G.Rel.pending()) { await H.enter(0); }
      return 'news ' + n;
    };
  });
  // ================================================================ B) 1600년 전
  /** 1600년 저장에서 날을 되돌린다 — 그 시대 상태(s.<key>)는 지운다 */
  H.pre = function (y, m, d, keys, o) {
    var s = F().base(y, m, d, o);
    (keys || []).forEach(function (k) { delete s[k]; });
    if ((keys || []).indexOf('romeo') < 0) s.romeo = Object.assign({}, s.romeo || {}, { p1: s.romeo && s.romeo.p1 || 1, p2: 1 });   // 1600년 저장의 로미오 2부가 베니스·밀라노에서 끼어들지 않게
    return s;
  };
  /** 같은 상태로 날만 옮겨 도시에 든다 */
  H.at = async function (n, city, via) { var d = dn(n); F().setDate(d.y, d.m, d.d); await H.enter(city, via); };
  function stg(k) { return js(S()[k]); }

  // ── 엘미나 ①~⑤ (1481~1483)
  E2.elmina_1to5 = async function () {
    H.pre(1481, 10, 1, ['mina']); var K = G.Mina.K;
    await H.enter(0); note('① ' + stg('mina'));
    await H.at(K.meetFrom, 97); note('② ' + stg('mina'));
    await H.at(K.rockFrom + 3, 97); note('③ ' + stg('mina'));
    await H.at(K.wallsFrom + 2, 97); note('④ ' + stg('mina'));
    await H.at(14820801, 0); note('⑤ ' + stg('mina') + ' item=' + G.R.hasItem('mina_firstgold'));
    return stg('mina');
  };

  /** [날, 도시(, via)] 를 차례로 — 단계마다 상태를 적는다 */
  H.chain = async function (key, steps) {
    for (var i = 0; i < steps.length; i++) {
      var st0 = steps[i]; if (typeof st0 === 'function') { await st0(); continue; }
      if (G.U.dateNum(S().date) < st0[0]) { var d = dn(st0[0]); F().setDate(d.y, d.m, d.d); }
      await H.enter(st0[1], st0[2]);
      note((st0[3] || i) + ' @' + QA.date() + ' ' + (G.CITY_DATA[st0[1]] || {}).name + ': ' + stg(key));
    }
    return stg(key);
  };

  // ── 아즈텍 제국의 멸망 (1517~1521) — 정복자의 편으로 열한 장 (② 바다의 코르테스 함대는 G.SeaFolk.talk 로)
  E2.aztec = async function () {
    H.pre(1518, 1, 1, ['aztec', 'poca']); var K = G.Aztec.K;
    return H.chain('aztec', [
      [15180101, 195, null, '1 rumor'],
      async function () { F().setDate(1519, 3, 1); await H.aztecSea(); },
      [15190501, 199, null, '3 vc'], [15190901, 202, 'land', '4 tlax'], [15191201, 200, 'land', '5 aud'], [15200501, 199, null, '6 cemp'],
      [15200601, 200, 'land', '7 mass'], [15200701, 200, 'land', '8 noche'], [15200720, 202, 'land', '9 otumba'], [15201001, 202, 'land', '10 pox'],
      [15210601, 200, 'land', '11 lake'], [15210901, 199, null, '12 end']
    ]);
  };
  H.aztecSea = async function () {
    var SF = G.SeaFolk; if (!SF || !SF.talk) { note('no SeaFolk.talk'); return; }
    G.Aztec.init();
    await F().sea(196, -84, 21, 5);
    var rt = G.Scenes.sea.runtime && G.Scenes.sea.runtime();
    var n = ((rt && rt.npcs) || []).filter(function (x) { return x.exp && x.exp.id === 'cortes'; })[0];
    note('cortes npc at sea: ' + !!n);
    if (!n) { n = { exp: G.EXPEDITIONS.filter(function (x) { return x.id === 'cortes'; })[0] }; note('using G.EXPEDITIONS cortes record as the hailed fleet (SeaFolk.talk)'); }
    try { await F().drive(SF.talk(n), 60000); } catch (e) { note('talk err ' + String(e.message).slice(0, 120)); }
    note('2 sea: ' + stg('aztec'));
  };
  // ── 잉카 제국의 멸망 (1524~1572)
  E2.incafall = async function () {
    H.pre(1530, 1, 1, ['incaFall']);
    var r = await H.chain('incaFall', [
      [15300101, 210, null, '① panama'], [15320501, 220, null, '② tumbes'], [15320901, 220, null, '② ambush'], [15321201, 220, null, '② ransom'],
      [15340101, 223, 'land', '③ cusco'], [15360601, 223, 'land', '④ siege'], function () { S().incaFall.friend = 1; note('(⑤ is for the Inca friend only — set incaFall.friend=1)'); }, [15720910, 223, 'land', '⑤ tupac']
    ]);
    return r;
  };
  // ── 고아·말라카 (1509~1511)
  E2.goamalacca = async function () {
    H.pre(1509, 11, 10, ['goaMal', 'goamal']);
    return H.chain('goaMal', [
      [15091110, 154, null, '① cochin'], [15100310, 150, null, '② first'], [15100601, 150, null, '③ winter'], [15101020, 154, null, '④ muster'], [15101120, 150, null, '④ assault'],
      [15110101, 160, null, '⑤ hostage'], [15110201, 154, null, '⑤ deliver'], [15110801, 160, null, '⑥ siege'], [15110901, 160, null, '⑦ flor']
    ]);
  };

  /** 바다에서 역사 탐험 함대(G.EXPEDITIONS)를 불러 이야기한다 — js/systems/seafolk.js SF.talk (아즈텍·신대륙이 이것을 감싼다) */
  H.hailExp = async function (expId, from, lon, lat) {
    await F().sea(from, lon, lat, 20);
    var rt = G.Scenes.sea.runtime && G.Scenes.sea.runtime();
    var n = ((rt && rt.npcs) || []).filter(function (x) { return x.exp && x.exp.id === expId; })[0];
    if (!n) { n = { exp: G.EXPEDITIONS.filter(function (x) { return x.id === expId; })[0] }; note(expId + ': fleet not spawned near — hailing with its G.EXPEDITIONS record'); }
    try { await F().drive(G.SeaFolk.talk(n), 90000); } catch (e) { note('talk err ' + String(e.message).slice(0, 120)); }
  };
  /** 도시에 들어가 건물(왕궁 등)에 들른다 */
  H.building = async function (city, kind, via) {
    if (G.Game.sceneName !== 'city' || S().loc.city !== city) await H.enter(city, via);
    var ok = await F().visit(kind); note('visit ' + kind + '@' + (G.CITY_DATA[city] || {}).name + ' ok=' + ok);
    if (ok) await F().leave();
    return ok;
  };

  // ── 바르바로사 (1543~1546): 왕궁의 부름 → 툴롱 앞바다 → 제노바 → 이스탄불의 무덤
  E2.barbarossa = async function () {
    var s = H.pre(1543, 4, 1, ['barb']); s.barb = { ok: 1 };
    await H.building(7, 'palace'); note('① ' + stg('barb'));
    F().setDate(1543, 12, 1); var T = [5.95, 43.0]; var pt = F().seaNear(T[0], T[1]); await F().sea(cid('마르세유') || 26, pt[0], pt[1], 5);
    note('toulon pending=' + G.Barb.pending() + ' at ' + pt); if (G.Barb.pending()) await F().drive(G.Barb.check(), 90000); note('② ' + stg('barb'));
    await H.at(15440501, 28); note('③ ' + stg('barb'));
    await H.newsAt([15440918, 15460704]);
    await H.at(15460901, 112); note('④ ' + stg('barb'));
    return stg('barb');
  };
  // ── 네덜란드 독립 전쟁 (1566~1609): 여름의 노래 → 곳간(밀) → 동료 → 소식
  E2.dutchwar = async function () {
    H.pre(1566, 9, 1, ['dutchwar']); F().cargo('wheat', 40);
    await H.enter(24); note('①② ' + stg('dutchwar'));
    if (S().dutchwar && S().dutchwar.step === 1) { F().setDate(1566, 11, 1); F().cargo('wheat', 40); await H.enter(24); note('② again ' + stg('dutchwar')); }
    if (S().dutchwar && S().dutchwar.offer && !aboard(S().dutchwar.offer)) { F().setDate(1567, 1, 1); await H.enter(24); note('offer ' + stg('dutchwar')); }
    await H.newsAt([15710801, 15720401, 15730713, 15741003, 15761104, 15790123, 15790726, 15840710, 16020320, 16090409]);
    return stg('dutchwar');
  };
  // ── 갈릴레오와 피사의 사탑 (1583~1654)
  E2.galpisa = async function () {
    H.pre(1584, 1, 1, ['galPisa']);
    await H.enter(31, 'land'); note('① ' + stg('galPisa'));
    await H.at(15900101, 31, 'land'); note('② ' + stg('galPisa'));
    await H.newsAt([15920926, 16120601, 16540101]);
    return stg('galPisa');
  };
  // ── 무굴 제국의 성립 (1504~1556)
  E2.mughal = async function () {
    H.pre(1519, 6, 1, ['mughal']); F().cargo('guns', 30); F().cargo('cannon', 6);
    var r = await H.chain('mughal', [[15190601, 148, null, '① diu'], [15200101, 136, 'land', '① kabul'], [15250101, 145, 'land', '② court'], [15260310, 145, 'land', '③ panipat'], [15260501, 145, 'land', '④ crown']]);
    await H.newsAt([15261201, 15270316, 15301226, 15400517, 15550723, 15561105]);
    return r;
  };
  // ── 콜럼버스의 신대륙 (1491~1520)
  E2.newworld = async function () {
    H.pre(1491, 10, 15, ['newworld']);
    await H.enter(7); note('① ' + stg('newworld'));
    F().setDate(1492, 9, 25); await H.hailExp('colon1', 7, -45, 27); note('② ' + stg('newworld'));
    F().setDate(1492, 10, 25); await H.hailExp('colon1', 7, -74, 24); note('③ ' + stg('newworld'));
    var r = await H.chain('newworld', [[14930415, 12, null, '④ egg'], [15030201, 194, null, '⑤ encomienda'], [15120101, 194, null, '⑥ sermon'], [15190101, 194, null, '⑦ pox']]);
    return r;
  };
  // ── 포토시 은광 (1545~1574)
  E2.potosi = async function () {
    H.pre(1545, 5, 1, ['potosi']);
    var r = await H.chain('potosi', [[15450501, 225, 'land', '① fire'], [15460201, 225, 'land', '② hostage']]);
    if (S().potosi && !S().potosi.res) { await H.at(15460601, 225, 'land'); note('② again ' + stg('potosi')); }
    await H.newsAt([15470101, 15730101, 15740601]);
    return stg('potosi');
  };

  // ── 임진왜란 (1592~1598): 부름 → 부산포 해전 → 동래(논개·김시민) → 뭍(성문 밖·탄금대) → 한양 → 뭍(곽재우·행주) → 원균·옥포·한산도 → 칠천량 → 노량
  H.landAt = async function (lon, lat, hook) {
    var l = S().loc;
    if (G.Game.sceneName !== 'land') {
      var sp = F().seaNear(lon, lat);
      if (sp) await F().land(lon, lat, sp[0], sp[1]);
      else {   // 바다에서 먼 내륙 — 가장 가까운 도시의 성문으로 나선다
        var near = G.CITY_DATA.filter(function (c) { return c && G.R.cityExists(c); }).sort(function (a, b) { return G.Geo.dist(lon, lat, a.lon, a.lat) - G.Geo.dist(lon, lat, b.lon, b.lat); })[0];
        S().loc = { mode: 'city', city: near.id, lon: near.lon, lat: near.lat, via: 'land' };
        G.Game.go('land', { from: near.id }); await sleep(300); await F().idle(30000); note('inland: set out from ' + near.name);
      }
    }
    l = S().loc; l.lon = lon; l.lat = lat;
    await F().drive(hook(lon, lat), 120000);
  };
  E2.imjin = async function () {
    var s = H.pre(1592, 3, 1, ['imjin'], { ship: 'panokseon' }); s.visited = s.visited || {}; s.visited[190] = 2; s.visited[226] = 1;
    var IJ = G.Imjin, ij = function () { return stg('imjin'); };
    await H.enter(192); note('① call ' + ij());
    F().setDate(1592, 5, 26); var dg = G.CITY_DATA[226], sp = F().seaNear(dg.lon, dg.lat - 0.2);
    await F().sea(192, sp[0], sp[1], 6);
    var go = await F().drive(IJ.beforePort(dg), 180000); note('② busan went=' + go + ' scene=' + G.Game.sceneName + ' ' + ij());
    if (G.Game.sceneName !== 'city' || S().loc.city !== 226) await H.enter(226);
    note('③ dongnae ' + ij());
    for (var i = 0; i < 2 && IJ.pending(); i++) { await F().drive(IJ.check(), 120000); }
    var on = function (x, y) { return IJ.onLand(x, y, { stop: function () {} }); };
    await H.landAt(dg.lon + 0.15, dg.lat + 0.2, on); note('④ breakout ' + ij());
    await H.landAt(127.90, 36.99, on); note('⑤ tangeum ' + ij());
    await H.enter(190, 'land'); note('⑥ seoul ' + ij());
    await H.landAt(127.2, 37.3, on); note('⑦ gwak ' + ij());
    await H.landAt(126.82, 37.60, on); note('⑧ haengju ' + ij());
    await H.enter(229); note('⑨ wongyun ' + ij());
    for (var k = 0; k < 4 && IJ.pending(); k++) { await H.enter(229); note('⑨+ ' + ij()); }
    F().setDate(1597, 8, 5); await H.enter(229); note('⑩ chil ' + ij());
    F().setDate(1598, 12, 5); await H.enter(229); note('⑪ noryang ' + ij());
    for (var j = 0; j < 2 && IJ.pending(); j++) { await H.enter(229); note('⑪+ ' + ij()); }
    return ij();
  };

  // ── 포르투갈과 콩고 1편·2편 (1482~1491)
  E2.kongo = async function () {
    H.pre(1482, 9, 1, ['kongo', 'mina']); var B = G.BALANCE.kongo, kg = function () { return stg('kongo'); };
    await H.enter(0); note('ep1 call ' + kg());
    F().setDate(1483, 3, 1); var sp = F().seaNear(B.mouth[1] - 0.3, B.mouth[0]); await F().sea(0, sp[0], sp[1], 30);
    note('mouth pending=' + G.Kongo.seaPending()); await F().drive(G.Kongo.atSea(), 90000); note('ep1 mouth ' + kg());
    await H.at(14830601, 0); note('ep1 lisbon ' + kg());
    await H.at(14840101, B.kongo); note('ep1 return ' + kg());
    await H.newsAt([14901001]);
    await H.at(14901101, 0); note('ep2 call ' + kg());
    await H.at(14910301, B.kongo); note('ep2 baptism ' + kg());
    await H.at(14910901, 0); note('ep2 lisbon ' + kg());
    await H.newsAt([14920101, 15060101, 15260101]);
    return kg();
  };

  /** 왕궁 메뉴의 항목을 눌러 준다 (G.Court.palaceItems — 사람이 왕궁 메뉴에서 고르는 것과 같은 onClick) */
  H.palaceItem = async function (city, spId, re) {
    if (G.Game.sceneName !== 'city' || S().loc.city !== city) await H.enter(city);
    var ok = await F().visit('palace');
    var C = G.Scenes.city, B = C.B.palace, c = G.CITY_DATA[city];
    var list = (B.menu ? B.menu(c) : []) || []; if (G.Court && G.Court.palaceItems) list = list.concat(G.Court.palaceItems(G.SPONSOR[spId]) || []);
    var it = list.filter(function (x) { return x && re.test(x.label || ''); })[0];
    note('palace ' + c.name + ' ok=' + ok + ' item ' + re + ' → ' + (it ? it.label : 'none') + ' [' + list.map(function (x) { return x && x.label; }).join('/').slice(0, 200) + ']');
    if (it) await F().drive(it.onClick(), 120000);
    if (C.current()) await F().leave();
    return !!it;
  };

  // ── 메디치 은행의 위기 (≤1492): 로렌초의 고백 → 빚쟁이 셋(술집) → 잉글랜드 국왕(일기토) → 로렌초에게 (G.Medici._t = 메뉴 항목 뒤의 함수)
  E2.medici = async function () {
    var s = H.pre(1489, 3, 1, ['medici']); var M = G.Medici, T = M._t, md = function () { return stg('medici'); };
    F().specific = /^맡는다/;   // 왕궁에 들 때 뜨는 왕명 창: 「다른 왕명을 본다」만 누르면 끝없이 돈다
    s.sponsors = s.sponsors || {}; s.sponsors.it_medici = Object.assign(s.sponsors.it_medici || {}, { met: 1, trust: 50, done: 1 }); note('rel=' + js(G.Sponsor.rel('it_medici')));
    await H.enter(30, 'land'); await F().visit('palace');
    await F().drive(T.afterReport(G.SPONSOR.it_medici), 60000); note('confession ' + md());
    await F().drive(T.visitLuc(), 60000); await F().leave();
    var debt = [[12, null], [100, null], [14, 'land']];
    for (var i = 0; i < debt.length; i++) {
      F().setDate(1489, 5 + i * 2, 1); await H.enter(debt[i][0], debt[i][1]); var ok = await F().visit('tavern');
      if (ok) { await F().drive(T.findDebtor(G.CITY_DATA[debt[i][0]]), 60000); await F().leave(); }
      note('debtor @' + G.CITY_DATA[debt[i][0]].name + ' ' + md());
    }
    F().setDate(1490, 1, 1); await H.enter(30, 'land'); await F().visit('palace'); await F().drive(T.visitLuc(), 60000); await F().leave();
    F().setDate(1490, 3, 1); await H.enter(38); await F().visit('palace'); await F().drive(T.demandKing(G.CITY_DATA[38], G.SPONSOR.en_king), 90000); await F().leave(); note('king ' + md());
    F().setDate(1490, 6, 1); await H.enter(30, 'land'); await F().visit('palace'); await F().drive(T.deliver(G.CITY_DATA[30], G.SPONSOR.it_medici), 90000); await F().leave();
    F().specific = null;
    return md();
  };
  // ── 레오나르도 다 빈치: 밤샘 이야기(계약 보고 뒤 — G.Leo.nightTalk) → 배에 태운다 → 생일 선물(발명품)
  E2.leonardo = async function () {
    var s = H.pre(1500, 6, 1, ['leo']); s.sponsors = s.sponsors || {}; s.sponsors.it_moro = Object.assign(s.sponsors.it_moro || {}, { met: 1 }); s.sponsors.it_leonardo = Object.assign(s.sponsors.it_leonardo || {}, { met: 1, trust: 60 });
    await H.enter(26, 'land'); await F().visit('palace');
    note('report hook: G.Leo.nightTalk (what Sponsor.report calls after a finished contract)');
    await F().drive(G.Leo.nightTalk(), 60000); await F().leave(); note('leo ' + stg('leo'));
    var p = S().player, d = G.U.addDays(S().date, 3); p.born = { y: 1460, m: d.m, d: d.d };
    G.Game.passDays(4); S().player.born = { y: 1460, m: d.m, d: d.d }; note('pend ' + stg('leo'));
    await H.enter(26, 'land'); note('after gift ' + stg('leo'));
    return stg('leo');
  };
  // ── 루터의 종교 개혁 (1499~1517): 술을 싣고 마그데부르크에 — 만남 → 수사 수첩(단서) → 추리 → 고발
  E2.reformation = async function () {
    H.pre(1505, 3, 1, ['reform']); F().cargo('wine', 60); F().cargo('beer', 60); F().cargo('brandy', 30);
    var rf = function () { return stg('reform'); };
    F().specific = /^그라우엔펠스 추기경$|추기경의 친필 장부|죄를 돈으로 미리|^추리한다/;   // 추리의 세 물음에 맞는 답 (js/systems/reformation.js QS)
    for (var i = 0; i < 7 && !(S().reform && S().reform.solved); i++) {
      if (i) { var d = G.U.addDays(S().date, 8); F().setDate(d.y, d.m, d.d); }
      F().cargo('wine', 60); F().cargo('beer', 60); F().cargo('brandy', 30);
      await H.enter(50, 'land'); note('visit ' + i + ' ' + rf());
    }
    F().specific = null;
    return rf();
  };
  // ── 로미오와 줄리엣 1부·2부 (베니스)
  E2.romeojuliet = async function () {
    H.pre(1528, 5, 1, ['romeo']); F().cargo('herbs', 20);
    await H.enter(29); note('p1 ' + stg('romeo'));
    F().specific = /^납잔/;   // 성배 문제의 답 (js/systems/romeojuliet.js — 납 잔)
    await H.at(15280520, 29); note('p2 ' + stg('romeo')); F().specific = null;
    await H.newsAt([15310101, 15540101, 15620101, 15970101].filter(function (x) { return x > today(); }));
    return stg('romeo');
  };
  // ── 1527년 로마 약탈: 피렌체의 경고 → 로마의 성벽 → 마키아벨리 → 행상인 옷의 교황
  E2.romesack = async function () {
    H.pre(1527, 3, 10, ['romeSack']);
    var r = await H.chain('romeSack', [[15270310, 30, 'land', '① warn'], [15270501, 33, null, '② wall'], [15270525, 30, 'land', '③ mach'], [15271110, 33, null, '④ flee']]);
    await H.newsAt([15271207, 15300224, 15320101]);
    return r;
  };
  // ── 철포 삼백 자루: 일본 항구에서 도키치로의 부탁 → 사카이에서 노부나가에게 → 뒷소식
  E2.teppo = async function () {
    H.pre(1570, 3, 1, ['teppo']);
    var jp = G.CITY_DATA.filter(function (c) { return c && c.port && c.id !== 192 && G.Teppo.ready && G.R.cityExists(c) && c.region === 9; }).map(function (c) { return c.id; });
    await H.enter(192); note('offer@sakai ' + stg('teppo'));
    if (!(S().teppo && S().teppo.stage === 1) && jp.length) { await H.at(15700601, jp[0]); note('offer@' + G.CITY_DATA[jp[0]].name + ' ' + stg('teppo')); }
    F().cargo('guns', 320); await H.at(15710101, 192); note('deliver ' + stg('teppo'));
    await H.newsAt([15750629, 15760801, 15820621, 15820702, 15900801]);
    return stg('teppo');
  };

  // ── 튜더: 헨리 8세의 이혼(런던→로마 교황궁→런던) · 런던 탑의 엘리자베스(→ 피신 → 기사) · 드레이크의 습격 셋 · 무적함대
  E2.tudor = async function () {
    var s = H.pre(1528, 3, 1, ['tudor']); s.sponsors = s.sponsors || {}; s.sponsors.en_king = Object.assign(s.sponsors.en_king || {}, { met: 1, trust: 70 });
    var td = function () { return stg('tudor'); };
    F().specific = /^맡는다/;   // 왕궁의 왕명 창
    G.Tudor.daily();   // hookCourt
    await H.building(38, 'palace'); note('henry ask ' + td());
    F().setDate(1528, 6, 1); await H.palaceItem(33, 'it_pope', /특사/); note('pope ' + td());
    F().setDate(1528, 9, 1); await H.building(38, 'palace'); note('henry break ' + td());
    // 런던 탑 (메리 1세 시절)
    F().setDate(1554, 4, 1); s = S(); s.sponsors.en_king = Object.assign(s.sponsors.en_king || {}, { met: 1, trust: 70 });
    await H.enter(38); note('towerOpen=' + G.Tudor.towerOpen() + ' holder ok');
    var ok = await F().visit('tower'); if (ok) { var C = G.Scenes.city, it = (C.B.tower.menu(G.CITY_DATA[38]) || [])[0]; if (it) await F().drive(it.onClick(), 60000); await F().leave(); }
    note('eliz ' + td());
    var dest = S().tudor.eliz && S().tudor.eliz.dest; if (dest != null) { F().setDate(1554, 5, 1); await H.enter(dest); note('eliz safe ' + td()); }
    F().setDate(1559, 3, 1); await H.building(38, 'palace'); note('knight ' + td());
    // 드레이크의 습격 셋 (1585~1587) → 무적함대 (1588.5.28~)
    var R = G.Tudor.RAIDS;
    for (var i = 0; i < 3; i++) {
      F().setDate(1585 + i, 2, 1); G.Game.passDays(2); var d = S().tudor.drake || {}; note('raid call ' + (i + 1) + ' ' + js(d));
      if (!d.call) continue;
      var bx = R[d.call - 1].box, pt = F().seaNear((bx[0] + bx[1]) / 2, (bx[2] + bx[3]) / 2); await F().sea(0, pt[0], pt[1], 10);
      await F().drive(G.Tudor.check(), 120000); note('raid ' + (i + 1) + ' ' + js(S().tudor.drake));
    }
    F().setDate(1588, 5, 30); G.Game.passDays(2); note('armada=' + S().tudor.armada);
    var cp = F().seaNear(-3, 50.0); await F().sea(38, cp[0], cp[1], 5); await F().drive(G.Tudor.check(), 120000);
    note('armada ' + td()); F().specific = null;
    return td();
  };
  // ── 칼레 해전 (1588): 여왕에게 보고한 제독 — 왕궁의 부름 → 칼레 앞바다의 화선 → 그라블린 해전
  E2.tudor_calais = async function () {
    var s = H.pre(1588, 3, 1, ['tudor']); s.sponsors = s.sponsors || {}; s.sponsors.en_king = Object.assign(s.sponsors.en_king || {}, { met: 1, trust: 70 });
    G.Tudor.daily(); S().tudor.calais = { rep: 1 };
    await H.building(38, 'palace'); note('calais call ' + stg('tudor'));
    F().setDate(1588, 7, 22); G.Game.passDays(1);
    var pt = F().seaNear(1.7, 51.0); await F().sea(38, pt[0], pt[1], 5); note('pending=' + G.Tudor.pending());
    await F().drive(G.Tudor.check(), 150000);
    return stg('tudor');
  };
  // ── 토르데시야스(1494.6.7)·사라고사(1529.4.22) 조약 창 (G.Treaty.tick — 600ms 마다) + 상대 반구 항구에 막힘
  E2.treaty = async function () {
    var s = H.pre(1494, 6, 1, ['treaty']); s.treaty = { init: 1 };
    await H.enter(0);
    F().setDate(1494, 6, 6); G.Game.passDays(2); note('t1=' + S().treaty.t1);
    for (var i = 0; i < 30 && S().treaty.t1 === 'due'; i++) { await F().idle(1500); }
    note('after window t1=' + S().treaty.t1);
    // 상대 왕실(카스티야)의 반구 항구 — 포르투갈 제독은 들어갈 수 없다
    F().setDate(1510, 1, 1);
    var sd = G.CITY_DATA.filter(function (c) { return c && c.port && G.R.cityExists(c) && G.Treaty.entryBlock(c, G.R.cityOwner(c)); })[0];
    note('blocked port ' + (sd && sd.name));
    if (sd) {   // 바다에서 그 항구에 들어가려 할 때의 수비병 (js/scenes/sea.js → C.handleEntry)
      var sp = F().seaNear(sd.lon, sd.lat); await F().sea(0, sp[0], sp[1], 20);
      var okIn = await F().drive(G.Scenes.city.handleEntry(sd), 60000); note('entry allowed=' + okIn);
    }
    F().setDate(1529, 4, 20); if (G.Game.sceneName !== 'city') await H.enter(0); G.Game.passDays(3); note('t2=' + S().treaty.t2);
    for (var k = 0; k < 30 && S().treaty.t2 === 'due'; k++) { await F().idle(1500); }
    return stg('treaty');
  };
  // ── 하늘을 재는 사람들 ① 코페르니쿠스의 원고: 단치히 → 뉘른베르크(인쇄) → 첫 책 → 단치히 (1539~1543)
  E2.sky_cop = async function () {
    var s = H.pre(1540, 1, 1, ['sky']); var B = G.BALANCE.sky;
    await H.enter(B.danzig); note('offer ' + stg('sky'));
    await H.at(15400401, B.nuremberg, 'land'); note('print ' + stg('sky'));
    if (S().sky && S().sky.cop === 2) { S().sky.ready = today() + 1; var r = dn(S().sky.ready); S().sky.ready = G.U.dateNum(G.U.addDays(S().date, 1)); }
    await H.newsAt([G.U.dateNum(G.U.addDays(S().date, 2))]); note('book ' + stg('sky'));
    await H.at(G.U.dateNum(G.U.addDays(S().date, 30)), B.danzig); note('deliver ' + stg('sky'));
    return stg('sky');
  };
  // ── 이름 붙이기: 희망봉에 이름(G.Names.offer — 발견 직후) · 서회항로·인도항로를 보고하면 새 대륙의 이름 (≤1507)
  E2.naming = async function () {
    var s = H.pre(1499, 3, 1, ['names', 'nameBy', 'vesp']); var N = G.Names;
    ['capegood', 'westroute', 'indiaroute'].forEach(function (id) { var x = s.disc[id] || (s.disc[id] = {}); delete x.rival; x.found = true; x.me = true; x.d = 14990301; delete x.nameGrant; });
    await H.enter(0);
    await F().drive(N.offer(G.DISC.capegood), 60000); note('named capegood=' + N.get('capegood'));
    await F().drive(N.offer(G.DISC.westroute), 60000);
    ['westroute', 'indiaroute', 'capegood'].forEach(function (id) { s.disc[id].reported = true; });
    note('canNameContinent=' + N.canNameContinent());
    await F().drive(N.onReport(G.DISC.westroute), 60000); note('continent=' + N.continent());
    return 'continent=' + N.continent();
  };
  // ── 이름 붙이기(늦은 경우): 베스푸치의 보고 셋 → 1507 「아메리카」
  E2.naming_america = async function () {
    H.pre(1500, 1, 1, ['names', 'nameBy', 'vesp']);
    await H.newsAt([15000301, 15020901, 15030601, 15070401]);
    return 'continent=' + G.Names.continent();
  };

  // ================================================================ C) 인벤토리·forcelib 밖의 사건 체계 — 첫 장(들)을 그 날짜·그 도시에서
  /** 그 시대로 가서 [날, 도시이름(, via, 준비)] 들에 차례로 든다 — s[key] 가 바뀌었는지 적는다 */
  H.first = async function (key, steps, prep) {
    var d0 = dn(steps[0][0]); H.pre(d0.y, d0.m, d0.d, [key]); H._key = key;
    if (prep) prep(S());
    for (var i = 0; i < steps.length; i++) {
      var st0 = steps[i]; if (typeof st0 === 'function') { await st0(); continue; }
      var id = typeof st0[1] === 'number' ? st0[1] : cid(st0[1]);
      if (id == null) { note('no city ' + st0[1]); continue; }
      if (st0[3]) st0[3](S());
      if (G.U.dateNum(S().date) < st0[0]) { var d = dn(st0[0]); F().setDate(d.y, d.m, d.d); }
      await H.enter(id, st0[2]);
      note((i + 1) + ' @' + QA.date() + ' ' + G.CITY_DATA[id].name + ': ' + stg(key));
    }
    return stg(key);
  };
  E2.beauxea = function () { return H.first('beauxEA', [[15820601, '쿄토', 'land'], [15820615, '쿄토', 'land']]); };
  E2.beauxeu = function () { return H.first('beauxEU', [[15020101, 30, 'land'], [15040601, 30, 'land']]); };
  E2.beauxis = function () { return H.first('beauxIS', [[15270101, 210], [15270301, 210], [15000101, '말린디']]); };
  E2.brothers = function () { return H.first('brothers', [[15900301, 190], [15900401, 190], [15900601, 190]]); };
  E2.colonyco = function () { return H.first('colonyCo', [[16210701, 24], [16210801, 24]]); };
  E2.donglin = function () { return H.first('donglin', [[16220101, '광주'], [16220301, '광주']]); };
  E2.eastindia = function () { return H.first('eindia', [[16001001, 38], [16010101, 38]]); };
  E2.horan = function () { return H.first('horan', [[16270305, 190], [16270320, 190]], function (s) { s.visited = s.visited || {}; s.visited[190] = 2; }); };
  E2.houjin = async function () {
    var r = await H.first('houjin', [[16160301, '국내성', 'land'], [16160401, '길림', 'land']]);
    if (S().houjin && Object.keys(S().houjin).length > 1) return r;
    await H.landAt(124.83, 41.66, function (x, y) { return G.Houjin.onLand ? G.Houjin.onLand(x, y, { stop: function () {} }) : Promise.resolve(); });
    note('land ' + stg('houjin')); return stg('houjin');
  };
  E2.jiajing = function () { return H.first('jiajing', [[15410101, '광주'], [15410301, '광주']]); };
  E2.mohacs = function () { return H.first('mohacs', [[15260701, '부다페스트', 'land'], [15260801, '부다페스트', 'land']]); };
  E2.nerchinsk = function () { return H.first('nerchinsk', [[16890510, 188, 'land'], [16890601, 188, 'land']]); };
  E2.ningchong = function () { return H.first('ningChong', [[16260401, '요동', 'land'], [16260501, '요동', 'land']]); };
  E2.odawara = function () { return H.first('odawara', [[15900301, 192], [15900501, 192]]); };
  E2.ottomaneurope = function () { return H.first('ottoEu', [[15290910, 54, 'land'], [15291001, 54, 'land']]); };
  E2.ricci = function () { return H.first('ricci', [[15830701, '오문'], [15830801, '오문']]); };
  E2.rovers = function () { return H.first('rovers', [[16200701, 38, null, function () { F().cargo('wheat', 60); F().cargo('beer', 60); }], [16200801, 38]]); };
  E2.safavid = function () { return H.first('safavid', [[15010801, '타브리즈', 'land'], [15011001, '타브리즈', 'land']]); };
  E2.sekigahara = function () { return H.first('sekigahara', [[16000601, 192], [16000801, 192]]); };
  E2.taiwan = function () { return H.first('taiwan', [[16610401, '하문'], [16610501, '하문']]); };
  E2.wokou = function () { return H.first('wokou', [[15540101, '나가사키'], [15540301, '나가사키']]); };
  E2.yeonsan = function () { return H.first('yeonsan', [[15020101, 190], [15020301, 190]], function (s) { s.visited = s.visited || {}; s.visited[190] = 2; }); };
  E2.yuegang = function () { return H.first('yuegang', [[15660101, '하문'], [15660301, '하문']]); };
  E2.wangmoon = function () { return H.first('wangMoon', [[16100101, 190], [16100601, 226]]); };

  // ── 민족 발견물에서 나서는 동료 (G.FolkJoin.offer — 발견 직후 3%로 부르는 것)
  E2.folkjoin = async function () {
    F().base(1620, 6, 1); var d = G.DISC.folk_maasai || G.DISCOVERIES.filter(function (x) { return G.FolkJoin.can(x); })[0];
    note('disc ' + (d && d.id)); await H.enter(0);
    var r = await F().drive(G.FolkJoin.offer(d, 'f'), 60000);
    note('folkJoin=' + js(S().folkJoin) + ' r=' + r); return 'joined=' + r;
  };
  // ── 업적 장면 (하나만): 업적 전용 그림이 있는 「allchains」 — G.Achieve.scene (업적을 이룰 때 announce 가 부른다)
  E2.achieve_sample = async function () {
    F().base(1620, 6, 1); await H.enter(0);
    var a = G.Achieve.get('allchains') || G.Achieve.get('arthur'); note('achv ' + (a && a.id) + ' pic=' + (G.Img.file('achievement-events/' + a.id) || ''));
    await F().drive(G.Achieve.scene(a), 60000); return a.id;
  };
  // ── 튜토리얼 「첫 항해」: 시작 → 프롤로그 → 도서관(『지지』) → 술집 (진행기 G.Tutorial 의 0.35초 tick 이 대사를 띄운다)
  E2.tutorial = async function () {
    var TU = G.Tutorial, D = G.TUTORIAL; TU.start('QA 항해사'); S().settings.autosave = false; S().settings.sound = 0; S().settings.music = 0; QA.evStart();
    G.Game.go('city', { cityId: D.home, arrive: true }); await sleep(400);
    var wait = async function (n) { for (var i = 0; i < n; i++) { await F().idle(4000); if (!TU.busy() && !TU.pending()) break; await sleep(400); } };
    await wait(12); note('step ' + TU.step());
    var C = G.Scenes.city, c = G.CITY_DATA[D.home];
    if (await F().visit('library')) {
      await wait(6); var LB = C.B.library, bk = LB.shelfBooks(c).filter(function (b) { return b.id === D.book; })[0] || LB.shelfBooks(c)[0];
      if (bk) await F().drive(LB.pick(c, bk), 30000); await F().leave(); await wait(10);
    }
    note('step ' + TU.step());
    if (await F().visit('tavern')) { await wait(6); await F().drive(C.B.tavern.drink(c), 30000); await wait(6); await F().leave(); await wait(10); }
    note('step ' + TU.step() + ' tut=' + js(S().tut));
    return TU.step();
  };
  // ── 이야기 「아버지의 사진」: 시작 → 리스본 프롤로그(컷) → 첫 흔적(그라나다 — 찾으면 G.Story.onFind 의 장면)
  E2.story = async function () {
    var ST = G.Story, D = G.STORY; ST.start(); S().settings.autosave = false; S().settings.sound = 0; S().settings.music = 0; QA.evStart();
    G.Game.go('city', { cityId: D.home, story: true }); await sleep(400); await F().idle(60000);
    note('prologue=' + js(S().story) + ' contract=' + !!S().contract);
    var tr = D.traces[0], d = G.DISC[tr[0]];
    await H.enter(tr[2], G.CITY_DATA[tr[2]].port ? null : 'land');
    var st0 = S().disc[d.id] || (S().disc[d.id] = {}); st0.found = true; st0.me = true; st0.d = today();
    note('trace ' + d.id + ' found → G.Story.onFind (what the discovery wrapper calls)');
    await F().drive(ST.onFind(d), 60000);
    return js(S().story);
  };

  // ================================================================ 일어났는가 (FORCE.run 이 노트에 FIRED2=… 로 남긴다 — shots2.json 의 observed)
  function k(key) { return S()[key] || {}; }
  function started(key) { var o = S()[key]; return !!o && Object.keys(o).some(function (x) { return !/^(told|seen|next|due|cool|init)$/.test(x) && o[x] && !(typeof o[x] === 'object' && !Object.keys(o[x]).length); }); }
  var OK = window.FORCE2_OK = {
    sky_gal: function () { return k('sky').gal === 'done'; }, nzinga_court: function () { return !!k('nzinga').court; }, nzinga_sa: function () { return !!k('nzinga').sa; },
    nzinga_news: function () { return H.logged(/은징가/); }, mingfall_news: function () { return H.logged(/순치제|남경을/); }, westphalia_oath: function () { return !!k('westph').oath; },
    westphalia_news: function () { return H.logged(/교황 인노첸시오/); }, glory_bill: function () { return k('glory').charter === 1; }, glory_news: function () { return H.logged(/권리장전|대관식/); },
    elmina_door: function () { return !!k('mina').door; }, pocahontas: function () { return aboard('h_pocahontas') || !!k('poca').done; }, quixote_santiago: function () { return k('quix').stage === 'done'; },
    mirage: function (r) { return /^shown/.test(r); }, family_heirplan_friend: function () { return !!(S().player.kids[0] && S().player.kids[0].cfriend); },
    romance_wedding: function (r) { return r === 'wed'; }, eraend_warnings: function (r) { return G.Game.sceneName === 'title' || /scene title/.test(r); },
    elmina_1to5: function () { return k('mina').gold === 'done'; }, aztec: function () { return !!k('aztec').end; }, incafall: function () { return !!k('incaFall').siege; },
    goamalacca: function () { return !!k('goaMal').flor; }, barbarossa: function () { return !!k('barb').tomb; }, dutchwar: function () { return !!k('dutchwar').joined; },
    galpisa: function () { return k('galPisa').tower === 'done'; }, mughal: function () { return !!k('mughal').crown; }, newworld: function () { return Object.keys(k('newworld').pox || {}).length > 0; },
    potosi: function () { return !!k('potosi').res; }, imjin: function () { return !!k('imjin').noryang; }, kongo: function () { return k('kongo').ep2 === 'done'; },
    medici: function () { return k('medici').end === 'done'; }, leonardo: function () { return (k('leo').given || []).length > 0; }, reformation: function () { return !!k('reform').solved; },
    romeojuliet: function () { return !!k('romeo').p2 && k('romeo').p2 !== 1; }, romesack: function () { return !!k('romeSack').flee; }, teppo: function () { return k('teppo').end === 'done'; },
    tudor: function () { return k('tudor').armada === 'won' || k('tudor').armada === 'lost'; }, tudor_calais: function () { return !!(k('tudor').calais && /won|lost/.test(k('tudor').calais.stage)); },
    treaty: function () { return k('treaty').t1 === 1 && k('treaty').t2 === 1; }, sky_cop: function () { return k('sky').cop === 'done' || k('sky').cop === 'late'; },
    naming: function () { return !!G.Names.continent(); }, naming_america: function () { return G.Names.continent() === '아메리카'; },
    folkjoin: function () { return (k('folkJoin').joined || []).length > 0; }, achieve_sample: function () { return true; },
    tutorial: function () { return !!S().tut && S().tut.step >= 2; }, story: function () { return !!(S().story && S().story.prologue && (S().story.found || []).length); }
  };
  ['rel_ib_restore', 'rel_cr_vienna2', 'rel_rf_defenest', 'rel_rf_westphalia', 'rel_fe_henriette', 'rel_no_gustav', 'rel_ea_moscow1610', 'rel_ea_romanov'].forEach(function (id) { OK[id] = function (r) { return /news [1-9]/.test(r) && !!(S().rel && S().rel.seen[id.slice(4)]); }; });
  ['beauxea', 'beauxeu', 'beauxis', 'brothers', 'colonyco', 'donglin', 'eastindia', 'horan', 'houjin', 'jiajing', 'mohacs', 'nerchinsk', 'ningchong', 'odawara', 'ottomaneurope', 'ricci', 'rovers', 'safavid', 'sekigahara', 'taiwan', 'wokou', 'yeonsan', 'yuegang', 'wangmoon']
    .forEach(function (id) { OK[id] = function () { return !!H._key && started(H._key); }; });

  // ── 17세기 아프리카 다섯 이야기: 쿠바의 뭍(G.Afr17.onLand) · 곤다르 · 케이프 · 루안다(음빌라 뒤) · 몸바사
  E2.africa17 = async function () {
    H.pre(1640, 3, 1, ['afr17']); H._key = 'afr17'; var K = G.BALANCE.afr17, kb = K.kuba.box;
    await H.landAt((kb[0] + kb[1]) / 2, (kb[2] + kb[3]) / 2, function (x, y) { return G.Afr17.onLand(x, y, { stop: function () {} }); }); note('kuba ' + stg('afr17'));
    var steps = [[16400401, K.gondar.city, 'gondar'], [16600501, K.cape.city, 'cape'], [16661201, K.mbwila.city, 'mbwila'], [16970501, K.mombasa.city, 'mombasa']];
    for (var i = 0; i < steps.length; i++) { var d = dn(steps[i][0]); F().setDate(d.y, d.m, d.d); await H.enter(steps[i][1], G.CITY_DATA[steps[i][1]].port ? null : 'land'); note(steps[i][2] + ' ' + stg('afr17')); }
    return stg('afr17');
  };
  // ── 미녀와 야수: 장미를 지니고 보르네오의 뭍을 걷는다 (G.Beauty.onLand)
  E2.beautybeast = async function () {
    H.pre(1580, 3, 1, ['beauty']); H._key = 'beauty'; F().item('rose'); var b = G.BALANCE.beauty.box;
    var pt = F().findPt(114.5, 1.0, 3, function (x, y) { return G.Geo.isLand(x, y); }, 0.1);
    var met = function () { return !!(S().beauty && S().beauty.met); };
    for (var i = 0; i < 8 && !met(); i++) { await H.landAt(pt[0], pt[1], function (x, y) { return G.Beauty.onLand(x, y, { stop: function () {} }); }); if (!met()) G.Game.passDays(1); }   // 날마다 chance, sure일을 걸으면 반드시
    note('beauty ' + stg('beauty'));
    if (met()) { await H.enter(G.BALANCE.beauty.city); note('brunei ' + stg('beauty')); }
    return stg('beauty');
  };
  // ── 포르투갈의 마카오: 광주 앞바다에서 레오넬 드 소자(G.Macao.beforePort) → 광주·오문
  E2.macao = async function () {
    H.pre(1554, 3, 1, ['macao']); H._key = 'macao'; var c = G.CITY_DATA[174], sp = F().seaNear(c.lon, c.lat - 0.3);
    await F().sea(173, sp[0], sp[1], 5); await F().drive(G.Macao.beforePort(c), 90000); note('deal ' + stg('macao'));
    await H.at(15540601, 174); note('canton ' + stg('macao'));
    await H.at(15570201, 174); note('grant ' + stg('macao'));
    await H.at(15570401, 173); note('settle ' + stg('macao'));
    return stg('macao');
  };
  ['africa17', 'macao'].forEach(function (id) { OK[id] = function () { return !!H._key && started(H._key); }; });
  OK.beautybeast = function () { return !!(S().beauty && S().beauty.met); };

})();
