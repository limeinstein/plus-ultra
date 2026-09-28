/* Game state: creation, persistence, time. */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var ST = {};
  G.State = ST;

  var CHART_W = 720, CHART_H = 360; // 0.5 degree cells
  ST.CHART_W = CHART_W; ST.CHART_H = CHART_H;

  /** params: {name, nation, job, age, birth:{m,d}, st:{...}, sk:{...}, lg:[...], diff} */
  ST.newGame = function (p) {
    var home = p.nation === 'PT' ? 0 : 7;
    var S = {
      version: 1,
      seed: Math.floor(U.rand() * 1e9),
      date: { y: 1480, m: 5, d: 1 },
      day: 0,
      player: {
        name: p.name, nation: p.nation, job: p.job, born: { y: 1480 - p.age, m: p.birth.m, d: p.birth.d },
        st: p.st, luck: U.ri(30, 70), sk: p.sk, lg: p.lg,
        fame: 0, notoriety: 0, gold: p.gold || 3000, bank: 0, items: [], equip: { weapon: 'rapier', armor: null },
        hp: 100, home: home, wife: null, kids: [], generation: 1, jailed: 0
      },
      fleet: { ships: [], crew: 0, food: 0, water: 0, cargo: {}, fatigue: 0, discipline: 80, daysOut: 0, sick: 0, scurvy: 0, rats: 0 },
      mates: [],
      loc: { mode: 'city', city: home, lon: G.CITY_DATA[home].lon, lat: G.CITY_DATA[home].lat, heading: Math.PI },
      contract: null,
      disc: {}, hints: {},
      known: [], chart: null,
      market: {}, sponsors: {}, maids: {}, owners: {},
      flags: {}, log: [], history: 0,
      stats: { trades: 0, profit: 0, battles: 0, wins: 0, sunk: 0, captured: 0, distance: 0, found: 0 },
      circ: null,
      settings: { diff: p.diff || 'normal', speed: 1, sound: 0.5, music: 0.35 }
    };
    S.player.items.push({ id: 'rapier' });
    S.player.items.push({ id: 'compass' });
    // starting ship depends on job
    var shipType = p.job === 'merchant' ? 'cog' : p.job === 'conq' || p.job === 'soldier' ? 'caravel' : 'caravel';
    var hc = G.CITY_DATA[S.player.home];
    var ship = R.newShip(shipType, p.nation === 'PT' ? '산 가브리엘' : '산타 클라라', hc && G.Ships ? G.Ships.localWood(hc).id : null);
    ship.guns = { type: 'saker', n: 4 };
    S.fleet.ships.push(ship);
    S.fleet.crew = Math.min(ship.crewMax, ship.crewMin + 8);
    S.fleet.food = Math.ceil(R.dailyUse(S.fleet.crew) * 20);
    S.fleet.water = Math.ceil(R.dailyUse(S.fleet.crew) * 20);
    S.fleet.mat = (G.BALANCE && G.BALANCE.matStart) || 10;     // 자재(수리용 목재·밧줄·돛천) — 바다 위 수리에 쓴다
    S.fleet.cargo = {};
    // starting mate
    S.mates.push({ id: 'rocco', role: 'first', joined: 0, loyal: 80 });
    // known cities: Iberia, western Med, Atlantic islands; home region
    G.CITY_DATA.forEach(function (c) {
      if (c.region === 0 || c.region === 2 || (c.region === 1 && c.port) || [78, 79, 81, 82, 83, 85].indexOf(c.id) >= 0) S.known.push(c.id);
    });
    if (S.known.indexOf(home) < 0) S.known.push(home);
    ST.chartInit(S);
    // reveal home waters on chart
    G.Game.state = S;
    if (G.Names) G.Names.apply();       // 이름(대륙·곶·해협)은 이 게임의 것으로 다시 입힌다
    ST.revealChart(-12, 38, 9);
    ST.revealChart(0, 40, 9);
    ST.revealChart(12, 38, 8);
    ST.revealChart(24, 37, 7);
    ST.revealChart(-2, 50, 7);
    ST.revealChart(-16, 30, 7);
    ST.log('항해자 ' + p.name + U.j(p.name, '이/가').slice(p.name.length) + ' ' + G.CITY_DATA[home].name + '에서 모험의 첫걸음을 내디뎠다.');
    return S;
  };

  // ---------------------------------------------------------------- sea chart bitset
  ST.chartInit = function (S) { S.chartBits = new Uint8Array(CHART_W * CHART_H / 8); };
  ST.revealChart = function (lon, lat, r) {
    var S = G.Game.state; if (!S.chartBits) ST.chartInit(S);
    var cx = Math.floor((lon + 180) * 2), cy = Math.floor((90 - lat) * 2), rr = Math.ceil(r * 2), n = 0;
    for (var y = cy - rr; y <= cy + rr; y++) {
      if (y < 0 || y >= CHART_H) continue;
      for (var x = cx - rr; x <= cx + rr; x++) {
        var dx = x - cx, dy = y - cy; if (dx * dx + dy * dy > rr * rr) continue;
        var xx = ((x % CHART_W) + CHART_W) % CHART_W, i = y * CHART_W + xx;
        if (!(S.chartBits[i >> 3] & (1 << (i & 7)))) { S.chartBits[i >> 3] |= 1 << (i & 7); n++; }
      }
    }
    if (n) S.chartDirty = true;
    return n;
  };
  ST.charted = function (lon, lat) {
    var S = G.Game.state; if (!S.chartBits) return false;
    var x = Math.floor((G.Geo.wrapLon(lon) + 180) * 2), y = Math.floor((90 - lat) * 2);
    if (y < 0 || y >= CHART_H) return false;
    var i = y * CHART_W + x; return !!(S.chartBits[i >> 3] & (1 << (i & 7)));
  };
  ST.chartPercent = function () {
    var S = G.Game.state, n = 0; for (var i = 0; i < S.chartBits.length; i++) { var b = S.chartBits[i]; while (b) { n += b & 1; b >>= 1; } }
    return n / (CHART_W * CHART_H);
  };

  // ---------------------------------------------------------------- log
  ST.log = function (text) {
    var S = G.Game.state; S.log.push({ d: U.dateNum(S.date), t: text }); if (S.log.length > 300) S.log.shift();
  };

  // ---------------------------------------------------------------- persistence
  var KEY = 'plusultra_save_';
  function b64(u8) { var s = ''; for (var i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); }
  function unb64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  ST.serialize = function () {
    var S = G.Game.state;
    var copy = {}; for (var k in S) if (k !== 'chartBits' && k !== 'chartDirty') copy[k] = S[k];
    copy.chart = b64(S.chartBits);
    return JSON.stringify(copy);
  };
  ST.deserialize = function (json) {
    var S = JSON.parse(json);
    S.chartBits = S.chart ? unb64(S.chart) : new Uint8Array(CHART_W * CHART_H / 8);
    delete S.chart;
    return S;
  };
  ST.save = function (slot) {
    try {
      var data = ST.serialize();
      localStorage.setItem(KEY + slot, data);
      var S = G.Game.state;
      var meta = { name: S.player.name, date: U.fmtDate(S.date), place: S.loc.mode === 'city' ? G.CITY_DATA[S.loc.city].name : '해상', fame: S.player.fame, t: Date.now() };
      localStorage.setItem(KEY + slot + '_meta', JSON.stringify(meta));
      return true;
    } catch (e) { console.error(e); return false; }
  };
  ST.load = function (slot) {
    try {
      var data = localStorage.getItem(KEY + slot);
      if (!data) return null;
      return ST.deserialize(data);
    } catch (e) { console.error(e); return null; }
  };
  ST.meta = function (slot) {
    try { var m = localStorage.getItem(KEY + slot + '_meta'); return m ? JSON.parse(m) : null; } catch (e) { return null; }
  };
  ST.hasAnySave = function () { for (var i = 0; i < 4; i++) if (ST.meta(i)) return true; return false; };
})(window.G = window.G || {});
