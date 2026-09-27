/* 자동 플레이의 '머리': 무엇을 하러 어디로 갈지 정한다.
   포르투갈 리스본에서 시작 → 아프리카 서안을 따라 남단 → 인도 → 말라카·향료제도 → 서쪽으로 세계일주. */
(function () {
  'use strict';
  var B = window.BOT, G = window.G, U = G.U, R = G.R;
  var S = function () { return G.Game.state; };
  var C = G.Scenes.city, SEA = G.Scenes.sea, BAT = G.Scenes.battle;
  var ev = B.evf;
  B.route = []; B.leg = null; B.stage = 'start'; B.noLoan = true;

  function P(lat, lon, label, r) { return { lat: lat, lon: lon, label: label, r: r || 0.7 }; }
  function GULF() { return P(-4, 2, '기니 만 바깥 바다', 1.5); }
  function cities(ids) { return ids.filter(function (id) { return R.cityExists(G.CITY_DATA[id]) && !(B.bad && B.bad[id]); }).map(function (id) { return { city: id }; }); }
  var ROUTES = {
    capeOut: function () { return cities([87, 89, 90, 91, 97, 99, 100]).concat([P(-35.2, 19.0, '아프리카 남단 앞바다', 0.8), { city: 101 }]); },
    capeBack: function () { return cities([100]).concat([GULF()]).concat(cities([91, 90, 87, 0])); },
    levant: function () { return cities([84, 83, 82, 36, 74, 78, 74, 36, 82, 83, 84, 0]); },
    indiaOut: function () { return cities([87, 90, 100, 101, 102, 103, 105, 108, 152]); },
    indiaBack: function () { return cities([150, 108, 103, 101, 100]).concat([GULF()]).concat(cities([90, 87, 0])); },
    eastOut: function () { return cities([87, 90, 100, 101, 103, 108, 152, 155, 160]).concat([P(1.6, 125.6, '향료제도 앞바다', 0.8)]).concat(cities([171, 172])); },
    eastBack: function () { return cities([160, 152, 108, 103, 101, 100]).concat([GULF()]).concat(cities([90, 87, 0])); },
    circ: function () {
      var oc = function (x) { x.ocean = true; return x; };
      return cities([87, 90]).concat([oc(P(-8, -30, '남대서양', 1.2)), oc(P(-38, -52, '라플라타 앞바다', 1.2)), oc(P(-52.4, -67.8, '해협 동쪽 어귀', 0.6)), oc(P(-53.5, -70.8, '해협 한가운데', 0.6)), oc(P(-52.8, -74.6, '해협 서쪽 어귀', 0.6))])
        .concat([oc({ city: 224 })]).concat(cities([221, 220]))
        .concat([oc(P(-7, -95, '태평양 동부', 1.5)), oc(P(-8, -130, '태평양 한가운데', 1.5)), oc(P(-9, -170, '날짜변경선 부근', 1.5)), oc(P(-10, 160, '태평양 서부', 1.5)), oc(P(-10.3, 142.5, '토레스 해협', 0.8)), oc({ city: 172 })])
        .concat(cities([171, 160, 152, 108, 103, 101, 100])).concat([GULF()]).concat(cities([90, 87, 0]));
    }
  };
  B.ROUTES = ROUTES;

  // ================================================================ 시작 · 이어하기 · 기록
  B.newGame = async function () {
    var lg = []; for (var i = 0; i < G.LANGS.length; i++) lg.push(0);
    lg[R.nativeLang('PT')] = 3; lg[0] = 2; lg[5] = 1;         // 특기 점수 1: 아랍어 기초
    var sk = {}; G.SKILLS.forEach(function (x) { sk[x.id] = 0; }); sk.nav = 2; sk.survey = 2; sk.ops = 1; sk.speech = 1; sk.med = 1; sk.acct = 1;   // 탐험가 기본 + 특기 점수 3
    var st = { str: 58, int: 50, mar: 55, cha: 52 };            // 22세 탐험가 (4월 12일생, 양자리 무력 +6 포함)
    var s = G.State.newGame({ name: '주앙 다 시우바', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: st, sk: sk, lg: lg, diff: 'normal', gold: 3000 });
    s.player.portrait = null;
    s.settings.res = 0.35;
    G.Game.state = s;
    ev('start', { name: s.player.name, nation: '포르투갈', job: '탐험가', home: '리스본', ship: G.SHIP[s.fleet.ships[0].type].name + ' ' + s.fleet.ships[0].name + '호', crew: s.fleet.crew });
    G.Game.go('city', { cityId: s.player.home, prologue: true });
    await waitCity();
  };
  async function waitCity() { for (var i = 0; i < 400; i++) { await B.tick(); if (G.Game.scene === C && !C.isBusy()) break; await B.sleep(5); } await B.settle(); }
  B.checkpoint = function () { return B.lastCk || null; };
  function snap() {
    return JSON.stringify({ state: G.State.serialize(), bot: { stage: B.stage, route: B.route, spd: B.spd, ev: B.ev, notes: B.notes || {}, bad: B.bad || {} } });
  }
  B.resume = async function (json) {
    var o = JSON.parse(json);
    G.Game.state = G.State.deserialize(o.state);
    if (G.Names && G.Names.apply) G.Names.apply();
    B.stage = o.bot.stage; B.route = o.bot.route; B.spd = o.bot.spd; B.ev = o.bot.ev || []; B.notes = o.bot.notes || {}; B.bad = o.bot.bad || {};
    ev('resume', { stage: B.stage });
    G.Game.go('city', { cityId: S().loc.city });
    await waitCity();
  };
  B.info = function () {
    var s = S(); if (!s) return '';
    var l = s.loc, where = l.mode === 'city' ? G.CITY_DATA[l.city].name : '바다(' + l.lat.toFixed(1) + ',' + l.lon.toFixed(1) + ')';
    return U.fmtDate(s.date) + ' ' + where + ' 금화' + Math.round(s.player.gold) + ' 명성' + s.player.fame + ' 발견' + s.stats.found + ' 함대' + s.fleet.ships.length + '척/' + s.fleet.crew + '명 계약:' + (s.contract ? G.Errand.name(s.contract) : '-') + ' 다음:' + (B.route[0] ? B.stopName(B.route[0]) : '-');
  };
  B.final = function () {
    var s = S();
    var found = G.DISCOVERIES.filter(function (d) { return G.Disc.foundByMe(d.id); }).map(function (d) { var st = s.disc[d.id]; return { id: d.id, name: d.name, aka: d.aka || null, cat: G.DISC_CATS[d.cat], how: d.how, found: st.found, rival: st.rival || null, reported: st.reported || null, announced: !!st.announced }; });
    found.sort(function (a, b) { return a.found - b.found; });
    return { ev: B.ev, log: s.log, stats: s.stats, found: found, player: { name: s.player.name, fame: s.player.fame, gold: s.player.gold, notoriety: s.player.notoriety, title: R.fameTitle(s.player.fame), age: s.date.y - s.player.born.y }, date: U.fmtDate(s.date), fleet: s.fleet.ships.map(function (x) { return G.SHIP[x.type].name + ' ' + x.name + '호'; }), mates: s.mates.map(function (m) { return G.MATE[m.id].name + '(' + m.role + ')'; }), known: s.known.length, visited: s.visited, circ: s.circ, chart: G.State.chartPercent() };
  };

  // ================================================================ 메인 루프
  B.start = async function (o) {
    o = o || {};
    B.status = 'running';
    try {
      B.patchUI();
      if (o.resume) await B.resume(o.resume); else await B.newGame();
      var guard = 0;
      while (!B.stopFlag) {
        if (G.Disc.foundByMe('circum') && !(S().contract && S().contract.circ) && B.stage === 'circDone') { B.status = 'done'; break; }
        if (G.Game.scene === C) { await cityTurn(); guard = 0; continue; }
        if (G.Game.scene === SEA) { var r = await B.sailLeg(B.leg || []); await afterLeg(r); continue; }
        if (G.Game.scene === BAT) { await B.sailLeg(B.leg || []); continue; }
        await B.sleep(50); if (++guard > 400) throw new Error('알 수 없는 장면: ' + G.Game.sceneName);
      }
    } catch (e) { B.status = 'error'; B.err.push('FATAL ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 4).join(' | ')); ev('fatal', { msg: e.message }); }
  };

  // ================================================================ 도시에서 한 차례
  async function cityTurn() {
    var s = S(), c = B.city();
    B.emergency = false;
    B.lastCk = snap();
    await B.inCity();
    if (B.route.length && B.route[0].city === c.id) B.route.shift();
    // 세계일주를 마쳤다
    if (G.Disc.foundByMe('circum')) {
      if (s.contract && s.contract.circ && G.SPONSOR[s.contract.sponsor].city !== c.id) { B.route = [{ city: G.SPONSOR[s.contract.sponsor].city }]; }
      else { B.stage = 'circDone'; B.status = 'done'; ev('goal', { text: '세계일주 완성' }); B.stopFlag = true; return; }
    }
    if (!B.route.length) await planMission();
    await cityActs();
    // 다음 구간 (너무 길면 아는 항구를 사이에 끼운다)
    await splitLeg();
    var leg = [], i;
    for (i = 0; i < B.route.length; i++) { leg.push(B.route[i]); if (B.route[i].city != null) break; }
    if (!leg.length) throw new Error('갈 곳이 없다 (' + B.stage + ')');
    var est = B.legEstimate([c.lon, c.lat], leg);
    if (!est) { ev('noroute', { to: leg.map(B.stopName).join('→') }); B.route.shift(); return; }
    var days = Math.max(12, est.days * 1.45 + 7);
    // 같은 구간을 거듭 되돌아오면: 선원을 줄이고, 되돌아가지 않고 버틴다
    var key = c.id + '>' + B.stopName(leg[leg.length - 1]);
    B.tries = B.tries || {}; B.tries[key] = (B.tries[key] || 0) + 1;
    B.noDivert = B.tries[key] >= 3;
    if (B.tries[key] >= 6) { ev('give_up_leg', { leg: key }); B.route.splice(0, leg.length); B.tries[key] = 0; return; }
    var futures = B.route.filter(function (x) { return x.city != null; }).slice(0, 7).map(function (x) { return x.city; });
    if (futures.indexOf(s.player.home) < 0) futures.push(s.player.home);
    // 남는 선원은 내린다 (식량·물을 아낀다)
    var cm = R.crewMin();
    if (s.fleet.crew > cm + 8 || (days > maxDaysNow() && s.fleet.crew > cm + 4)) await B.trimCrew(cm + 4);
    B.needDaysTo = function (cid) { return needDaysTo(cid); };
    await B.doTrade(futures, days);
    // 짐 때문에 식량·물을 다 못 실으면 짐부터 판다
    if (maxDaysNow() < days && R.cargoQty() > 0) { ev('cargo_space', { need: Math.round(days), can: maxDaysNow(), cargo: R.cargoQty() }); B.clearCargo = true; await B.doTrade(futures, days, 'sell'); B.clearCargo = false; }
    // 모항에서는 쓸 돈만 들고 나머지는 금고에 맡긴다 (해적 통행료는 가진 돈에 비례한다)
    if (c.id === s.player.home) await B.bank(keepCash());
    // 먼 길 전에는 쉬고 기도한다
    if (days > 30 || s.fleet.fatigue > 35) { if (s.fleet.fatigue > 15) await B.doInn(1); await B.doChurch(); }
    // 계절풍 바다에서 맞바람이면, 곧 바뀔 때는 여관에서 기다린다 (항구 관리인의 계절풍 형편을 따른다)
    if (G.Monsoon && !leg.some(function (x) { return x.ocean; })) {
      var tgt0 = leg[leg.length - 1], tp = tgt0.city != null ? B.dockOf(tgt0.city) : [tgt0.lon, tgt0.lat], cd = c.dock || [c.lat, c.lon];
      var mo = G.Monsoon.advice([cd[1], cd[0]], tp);
      if (mo && mo.head && mo.fitNext !== '맞바람' && mo.next.days <= 150 && est.days > 12) {
        var d0 = s.day;
        ev('monsoon_wait', { city: c.id, cityName: c.name, to: B.stopName(tgt0), text: mo.text, days: mo.next.days });
        for (var w = 0; w < 4 && G.Monsoon.advice([cd[1], cd[0]], tp).head; w++) await B.doInn(Math.min(60, G.Monsoon.next(mo.zone).days + 1));
        ev('monsoon_go', { city: c.id, cityName: c.name, waited: s.day - d0 });
      }
    }
    B.leg = leg.map(function (x) { return Object.assign({}, x); });
    var ocean = leg.some(function (x) { return x.ocean; });
    if (ocean || days > 40) await B.repair();
    if (ocean) { B.clearCargo = true; await B.doTrade(futures, days, 'sell'); B.clearCargo = false; if (s.fleet.crew > R.crewMin() + 2) await B.trimCrew(R.crewMin() + 2); if (s.fleet.fatigue > 5) await B.doInn(1); }
    var ok = await B.departFor(days, leg, { lean: ocean });
    if (!ok) {
      ev('depart_fail', { gold: Math.round(s.player.gold), days: Math.round(days), cap: R.fleetCap(), cargo: R.cargoQty() });
      B.clearCargo = true; await B.doTrade(futures, days, 'sell'); B.clearCargo = false;
      if (c.id === s.player.home) await B.bank(keepCash() + 3000);
      ok = await B.departFor(Math.min(days, maxDaysNow()), leg);
      if (!ok) { await earnMoney(); }
    }
  }
  /** 이 도시에 닿을 때까지 남은 구간 가운데 가장 긴 것의 준비 날수 (직선거리 어림) */
  function needDaysTo(cid) {
    var c = B.city(), x = c.lon, y = c.lat, mx = 0, legD = 0;
    for (var i = 0; i < B.route.length; i++) {
      var st = B.route[i], p = st.city != null ? B.dockOf(st.city) : [st.lon, st.lat];
      legD += G.Geo.dist(x, y, p[0], p[1]) * 1.3; x = p[0]; y = p[1];
      if (st.city != null) { mx = Math.max(mx, legD / Math.max(0.5, B.spd) * 1.45 + 7); legD = 0; if (st.city === cid) return mx; }
    }
    return mx;
  }
  /** 이번 임무에 들고 다닐 돈: 보급·선원·수리 + 교역 밑천 */
  function keepCash() {
    var s = S(), p = s.player, tot = p.gold + p.bank;
    var trade = B.stage === 'india' || B.stage === 'east' ? Math.min(25000, tot * 0.5) : Math.min(12000, tot * 0.3);
    if (B.stage === 'circ') return 12000;
    return Math.max(9000, Math.round(trade + 6000));
  }
  /** 구간이 식량·물을 실을 수 있는 날수를 넘거나(또는 라임 없이 45일을 넘으면) 아는 항구를 사이에 끼운다 */
  async function splitLeg() {
    var s = S(), c = B.city();
    for (var round = 0; round < 3; round++) {
      var leg = [], i;
      for (i = 0; i < B.route.length; i++) { leg.push(B.route[i]); if (B.route[i].city != null) break; }
      if (leg.length !== 1 || leg[0].city == null) return;       // 바다 지점이 낀 구간은 그대로
      var est = B.legEstimate([c.lon, c.lat], leg); if (!est) return;
      var cap = capDays(), lime = B.countItem('lime');
      var need = est.days * 1.3 + 5;
      if (need <= cap && (est.days <= 45 || lime >= Math.ceil(est.days / 60))) return;
      var T = leg[0].city, td = B.dockOf(T), from = [c.lon, c.lat];
      var best = null;
      s.known.forEach(function (id) {
        var x = G.CITY_DATA[id]; if (id === c.id || id === T || !x.port || !R.cityExists(x) || C.entryCheck(x) || (B.bad && B.bad[id])) return;
        var xd = B.dockOf(id), a = G.Geo.dist(from[0], from[1], xd[0], xd[1]), b = G.Geo.dist(xd[0], xd[1], td[0], td[1]), t = G.Geo.dist(from[0], from[1], td[0], td[1]);
        if (a < 2 || b < 2 || b > t * 0.85 || a + b > t * 1.4 + 3) return;
        var sc = Math.max(a, b);
        if (!best || sc < best.sc) best = { id: id, sc: sc };
      });
      if (!best) { ev('split_none', { to: G.CITY_DATA[T].name, days: Math.round(est.days), cap: cap }); return; }
      B.route.unshift({ city: best.id, via: true });
      ev('split', { to: G.CITY_DATA[T].name, via: G.CITY_DATA[best.id].name, days: Math.round(est.days), cap: cap });
    }
  }
  /** 선원을 최저+4명으로 줄이고 짐을 다 비웠을 때 실을 수 있는 날수 */
  function capDays() { var use = R.dailyUse(R.crewMin() + 4); return Math.floor(R.fleetCap() / (use * 2)); }
  function maxDaysNow() { var f = S().fleet, use = R.dailyUse(Math.max(f.crew, R.crewMin() + 4)); return Math.floor((R.fleetCap() - R.cargoQty()) / (use * 2)); }
  async function earnMoney() {
    // 돈이 모자라면 여관 허드렛일
    var c = B.city();
    B.rule('ask', /일손이 필요/, function (list) { return 30; }, 'work', true);
    await B.visit('inn', undefined, async function () { await C.B.inn.work(c); });
    ev('work', { city: c.id, cityName: c.name });
  }

  // ---------------------------------------------------------------- 구간이 끝난 뒤
  async function afterLeg(r) {
    var s = S();
    ev('leg', { result: r.arrived != null ? '입항 ' + G.CITY_DATA[r.arrived].name : r.reached ? '도달' : r.refused != null ? '입항 거절 ' + G.CITY_DATA[r.refused].name : r.missing != null ? '항구 없음 ' + G.CITY_DATA[r.missing].name : '실패 ' + r.fail, days: r.days });
    if (r.arrived != null) {
      // 지나온 바다 지점은 지운다
      B.route.splice(0, r.idx || 0);
      var lastC = B.leg && B.leg.length ? B.leg[B.leg.length - 1].city : null;
      if (lastC === r.arrived) B.tries = {};
      return;
    }
    if (r.refused != null || r.missing != null) {
      B.route.splice(0, (r.idx || 0) + 1);
    } else if (r.reached) {
      B.route.splice(0, B.leg.length);
    } else if (r.city != null) {
      // 들어갈 수 없는 항구: 건너뛴다
      ev('skip_port', { city: G.CITY_DATA[r.city].name, why: r.fail });
      B.route = B.route.filter(function (x) { return x.city !== r.city; });
      if ((B.failN = (B.failN || 0) + 1) > 8) throw new Error('항해 실패가 거듭됨: ' + r.fail);
    } else {
      // 막혔다: 가까운 아는 항구로
      var em = B.nearestFriendlyPort(s.loc.lon, s.loc.lat);
      if (em != null) B.route.unshift({ city: em });
      if ((B.failN = (B.failN || 0) + 1) > 6) throw new Error('항해 실패가 거듭됨: ' + r.fail);
    }
    if (!B.route.length) { var h = B.nearestFriendlyPort(s.loc.lon, s.loc.lat); B.route = [{ city: h }]; }
    var leg = []; for (var i = 0; i < B.route.length; i++) { leg.push(B.route[i]); if (B.route[i].city != null) break; }
    // 남은 식량으로 닿을 수 있는가
    var est = B.legEstimate([s.loc.lon, s.loc.lat], leg), left = Math.min(R.daysOfFood(), R.daysOfWater());
    if (est && est.days * 1.1 > left) {
      var em2 = B.nearestFriendlyPort(s.loc.lon, s.loc.lat);
      if (em2 != null && !(leg.length === 1 && leg[0].city === em2)) { leg = [{ city: em2 }]; B.route.unshift({ city: em2 }); ev('divert', { to: G.CITY_DATA[em2].name, left: left, need: Math.round(est.days) }); }
    }
    B.leg = leg.map(function (x) { return Object.assign({}, x); });
  }

  // ================================================================ 임무 고르기
  async function planMission() {
    var s = S(), c = B.city(), st = B.stage;
    if (st === 'start') {
      await homeActs({ rumour: true });
      await getContract(['capegood'], ['pt_behaim', 'pt_casaindia', 'pt_queen', 'pt_marchionni'], { errand: true });
      setStage('cape', ROUTES.capeOut(), '아프리카 서안을 따라 남쪽 끝을 찾는다');
    } else if (st === 'cape') {
      if (!G.Disc.foundByMe('capegood')) { B.route = [P(-35.4, 20.5, '아프리카 남단 앞바다(다시)', 0.8), { city: 101 }]; return; }
      setStage('capeBack', ROUTES.capeBack(), '리스본으로 돌아가 보고');
    } else if (st === 'capeBack') {
      await homeActs({ rumour: true });
      if (!s.hints.indiaroute && !G.Disc.foundByMe('t_pepper') && !G.Disc.foundByMe('t_ginger')) {
        await getContract([], ['pt_casaindia', 'pt_marchionni', 'pt_queen'], { errand: true, errandFor: 'levant' });
        setStage('levant', ROUTES.levant(), '알렉산드리아에서 인도산 향신료를 사 보고(맛보기 발견) 라임 절임을 구한다');
        return;
      }
      await getContract(['indiaroute'], ['pt_casaindia', 'pt_queen', 'pt_marchionni', 'pt_king'], { errand: true, bribe: true });
      setStage('india', ROUTES.indiaOut(), '남단을 돌아 인도로');
    } else if (st === 'levant') {
      await homeActs({ rumour: true });
      await getContract(['indiaroute'], ['pt_casaindia', 'pt_queen', 'pt_marchionni', 'pt_king'], { errand: true, bribe: true });
      setStage('india', ROUTES.indiaOut(), '남단을 돌아 인도로');
    } else if (st === 'india') {
      setStage('indiaBack', ROUTES.indiaBack(), '후추를 싣고 리스본으로');
    } else if (st === 'indiaBack') {
      await homeActs({ rumour: true });
      await getContract(['spiceis', 'malacca', 'china'], ['pt_casaindia', 'pt_king', 'pt_queen', 'pt_marchionni'], { errand: true, bribe: true });
      setStage('east', ROUTES.eastOut(), '말라카와 향료제도로');
    } else if (st === 'east') {
      setStage('eastBack', ROUTES.eastBack(), '향료를 싣고 리스본으로');
    } else if (st === 'eastBack') {
      await homeActs({ rumour: true });
      await getContract(['circum'], ['pt_king'], { errand: false, bribe: true });
      if (!s.contract) await getContract(['newstrait', 'circum'], ['pt_casaindia', 'pt_queen', 'pt_marchionni'], {});
      await circPrep();
      setStage('circ', ROUTES.circ(), '서쪽으로 대서양·신세계 해협·태평양을 건너 세계일주');
    } else if (st === 'circ') {
      B.route = [{ city: s.player.home }];
    } else {
      B.route = [{ city: s.player.home }];
    }
  }
  /** 세계일주 준비: 배 두 척, 의학·과학을 아는 동료를 부관 자리에, 라임 절임 */
  async function circPrep() {
    var s = S();
    for (var k = 0; k < 2 && s.fleet.ships.length < 3; k++) { if (s.player.gold < 16000 && s.player.bank > 0) await B.bank(24000); if (!(await B.doShipyard('caravel'))) break; }
    var best = null;
    s.mates.forEach(function (m) { var d = G.MATE[m.id]; var sc = (d.sk.med || 0) * 2 + (d.sk.sci || 0); if (sc > 2 && (!best || sc > best.sc)) best = { m: m, sc: sc }; });
    if (best && best.m.role !== 'first') await B.assignRole(best.m.id, 'first');
    await B.repair();
    if (s.player.gold < 20000 && s.player.bank > 0) await B.bank(26000);
    await B.figureheads();
    ev('circ_prep', { ships: s.fleet.ships.map(function (x) { return G.SHIP[x.type].name + ' ' + x.name + '호' + (x.fig ? '(' + G.FIGUREHEAD[x.fig].name + ')' : ''); }), stormCut: Math.round(R.fleetBonus('storm') * 300) + '%', limes: B.countItem('lime'), mates: s.mates.map(function (m) { return G.MATE[m.id].name + '(' + m.role + ')'; }), nav: R.skill('nav'), med: R.skill('med'), sci: R.skill('sci') });
  }
  function setStage(st, route, why) { B.stage = st; B.route = route; ev('mission', { stage: st, why: why, route: route.map(B.stopName) }); }

  /** 모항에서: 보고·발견 알리기·도서관·술집·배 */
  async function homeActs(o) {
    var s = S();
    await B.doLibrary();
    await lateReports();
    await B.doTavern({ rumour: !!o.rumour, hire: true });
    await B.doMarket([{ id: 'cat', n: 1, keep: 1500 }]);
    if (o.ship && s.fleet.ships.length < 2 && s.player.gold > 36000) await B.doShipyard(o.ship);
  }
  /** 아직 알리지 않은 발견을 후원자에게 늦게라도 알린다 (없으면 항구에서 발표) */
  async function lateReports() {
    var s = S(), c = B.city();
    for (var n = 0; n < 8; n++) {
      var un = G.Disc.unreported(); if (!un.length || s.contract) break;
      var did = false;
      var sps = B.sponsorsHere(c).filter(function (sp) { return B.canMeet(sp) && !G.Sponsor.isRivalNation(sp); }).sort(function (a, b) { return b.pw - a.pw; });
      for (var i = 0; i < sps.length && !did; i++) {
        var sp = sps[i], ok = un.filter(function (d) { return d.pw <= sp.pw + 1; });
        if (!ok.length) continue;
        var f0 = s.player.fame;
        await B.propose(sp, ok.map(function (d) { return d.id; }));
        if (s.player.fame > f0 || G.Disc.unreported().length < un.length) did = true;
      }
      if (!did) break;
    }
    if (G.Disc.unreported().length && !(B.stage === 'start')) await B.announceAll();
  }
  /** 모험 계약을 맺는다 (안 되면 작은 일거리) */
  async function getContract(want, spIds, o) {
    var s = S(), c = B.city();
    if (s.contract && s.contract.small && !G.Errand.done(s.contract) && G.SPONSOR[s.contract.sponsor].city === c.id && want.length) {
      // 끝내지 못한 작은 일거리는 정리하고 큰 계약으로 간다
      var k0 = s.contract, sp0 = G.SPONSOR[k0.sponsor], bb = sp0.bld === 'palace' ? ['palace', undefined] : ['mansion', sp0.id];
      B.giveUp = true; await B.visit(bb[0], bb[1], async function () { if (C.current()) await G.Sponsor.report(sp0); }); B.giveUp = false;
      ev('errand_drop', { what: G.Errand.name(k0), sponsor: G.Sponsor.holderName(sp0), done: !s.contract });
    }
    if (s.contract) return !!s.contract;
    var avail = want.filter(function (id) {
      if (id === 'circum') return s.player.fame >= 6880;
      return !G.Disc.foundByMe(id) && (s.hints[id] || false) && s.player.fame >= (G.POWER_FAME[G.DISC[id].pw] || 0) * 0.8;
    });
    for (var i = 0; i < spIds.length && avail.length; i++) {
      var sp = G.SPONSOR[spIds[i]]; if (!sp || sp.city !== c.id || !G.Sponsor.present(sp)) continue;
      var fit = avail.filter(function (id) { return G.DISC[id].pw <= sp.pw + 1; }); if (!fit.length) continue;
      var need = G.Sponsor.fameNeed(sp), gap = need - s.player.fame;
      if (gap > 0) {
        var bribe = Math.round(gap * 3 + sp.pw * 300);
        if (!o.bribe || gap > need * 0.5 || s.player.gold < bribe + 6000) continue;
        B.rule('ask', /어떻게 할까\?/, function (list) { return by(list, /뇌물/); }, 'bribe', true);
        ev('bribe_try', { sponsor: G.Sponsor.holderName(sp), cost: bribe });
      }
      await B.propose(sp, fit);
      B.unrule('bribe');
      if (s.contract) return true;
    }
    if (o.errand && !s.contract) await takeErrand(spIds.concat(['pt_behaim', 'pt_king']));
    return !!s.contract;
  }
  function by(list, re) { for (var i = 0; i < list.length; i++) { var o = list[i]; if (!o || o.dis) continue; if (re.test(B.strip(o.label))) return o.value; } return undefined; }
  /** 작은 일거리: 다음 항해 길에 맞는 것 (조달 물건이 길목에서 나거나, 해도 목표가 길에서 가깝거나) */
  async function takeErrand(spIds) {
    var s = S(), c = B.city(), seen = {};
    var nextRoute = plannedRouteFor(B.stage);
    for (var i = 0; i < spIds.length && !s.contract; i++) {
      var sp = G.SPONSOR[spIds[i]]; if (!sp || seen[sp.id] || sp.city !== c.id || !G.Sponsor.present(sp)) continue; seen[sp.id] = 1;
      var offers = G.Errand.offers(sp), pick = -1, best = 1e9;
      offers.forEach(function (t, k) {
        var cost = 1e9;
        if (t.kind === 'procure') { var on = nextRoute.filter(function (x) { return x.city != null && x.city !== S().player.home && R.cityGoods(G.CITY_DATA[x.city]).indexOf(t.good) >= 0; }); if (on.length) cost = 1; }
        if (t.kind === 'survey') { var dmin = 1e9; nextRoute.forEach(function (x) { var p = x.city != null ? B.dockOf(x.city) : [x.lon, x.lat]; dmin = Math.min(dmin, G.Geo.dist(p[0], p[1], t.lon, t.lat)); }); if (dmin < 7) cost = 2 + dmin; }
        if (cost < best) { best = cost; pick = k; }
      });
      if (pick < 0) { ev('errand_skip', { sponsor: G.Sponsor.holderName(sp), offers: offers.map(function (t) { return t.title; }) }); continue; }
      var want = offers[pick];
      B.rule('choose', /^작은 일거리/, function (list) { return pick; }, 'errpick', true);
      if (B.canMeet(sp)) await B.propose(sp, [], { errand: true });
      else await B.errandVia(sp);
      B.unrule('errpick');
      if (s.contract && s.contract.task && s.contract.task.kind === 'survey') B.notes = Object.assign(B.notes || {}, { survey: { lon: s.contract.task.lon, lat: s.contract.task.lat } });
    }
  }
  function plannedRouteFor(stage) {
    var nx = { start: 'capeOut', capeBack: 'levant', levant: 'indiaOut', indiaBack: 'eastOut', eastBack: 'circ' }[stage];
    return nx ? ROUTES[nx]() : [];
  }
  /** 해도 일거리 목표를 길에 끼워 넣는다 */
  function insertSurvey() {
    var s = S(), k = s.contract; if (!k || !k.task || k.task.kind !== 'survey' || k.task.done) return;
    if (B.route.some(function (x) { return x.survey; })) return;
    var t = k.task, bi = 0, bd = 1e9;
    B.route.forEach(function (x, i) { var p = x.city != null ? B.dockOf(x.city) : [x.lon, x.lat]; var d = G.Geo.dist(p[0], p[1], t.lon, t.lat); if (d < bd) { bd = d; bi = i; } });
    B.route.splice(bi, 0, { lat: t.lat, lon: t.lon, label: '해도 일거리 목표', r: 0.6, survey: true });
    ev('route_add', { what: '해도 일거리 목표', at: bi });
  }

  // ================================================================ 도시마다
  async function cityActs() {
    var s = S(), c = B.city(), f = B.fac(c);
    insertSurvey();
    // 도서관: 새 단서가 있을 만한 책
    await B.doLibrary();
    // 술집: 모항이 아니면 가끔 항해사를 찾는다
    if (c.size >= 2 && s.mates.length < 4) await B.doTavern({ hire: true, rumour: false });
    // 라임 절임: 먼 항해를 앞두고 (지중해·중근동·인도 시장)
    // 인도양의 다우: 짐칸에 견주어 선원이 적어 먼 바다에서 오래 버틴다 — 세계일주에 쓸 배를 미리 산다
    if (false && (B.stage === 'east' || B.stage === 'eastBack') && B.fac(c).shipyard && s.fleet.ships.length < 3 && C.B.shipyard.types(c).indexOf('dhow') >= 0) {
      for (var k = 0; k < 2 && s.fleet.ships.length < 3; k++) { if (s.player.gold < 12000) break; if (!(await B.doShipyard('dhow'))) break; }
    }
    if ((B.stage === 'levant' || B.stage === 'east' || B.stage === 'eastBack' || B.stage === 'indiaBack' || B.stage === 'india' || B.stage === 'circ')) await B.doMarket([{ id: 'lime', n: B.stage === 'eastBack' || B.stage === 'east' ? 7 : 4, keep: 2500 }]);
    // 아프리카 서안(항구가 드문 긴 구간): 이베리아에서도 라임을 판다 — 두 통은 챙긴다
    else if (B.stage === 'cape' || B.stage === 'capeBack') await B.doMarket([{ id: 'lime', n: 2, keep: 1500 }]);
  }
})();
