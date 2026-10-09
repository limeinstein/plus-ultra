/* 시대의 유행과 세상의 유행 (G.Era) — js/data/eratrade.js 의 자료를 쓴다
   · 시대 수요: 1480~1700년 유럽(이베리아·북유럽·지중해) 시장이 찾던 물건의 흐름. 그 해의 배수를 유럽 도시의 사는 값·파는 값에 곱한다
     (R.buyPrice·R.sellPrice). 1700년 뒤는 1700년 값 그대로. 세기는 G.BALANCE.era.strength.
   · 시대의 소식: G.ERA_NEWS 의 달이 되면 세상의 소식으로 알린다.
   · 세상의 유행 (제독이 만드는 유행과 따로 일어난다 — G.Fad 에 src와 배수 m을 붙여 올린다):
     ① 발견의 유행: 지리적 발견·교역품 발견이 알려지면(제독의 보고·발표, 경쟁자의 발표) 그 발견과 이어진 물건이 알려진 곳의 유럽 지역에서 유행한다 (G.DISC_FADS, 교역품 발견은 그 물건).
     ② 저절로 이는 유행: 한 해에 몇 번(worldPerYear), 유럽 한 지역에서 그 시대에 수요가 큰 물건일수록 잘 뽑혀 유행한다.
     ③ 번짐: 세상의 유행은 spreadDays 뒤 spreadChance로 이웃한 유럽 지역 한 곳에 번진다(한 번).
   · 저장: s.era = {news: 다음 소식 번호, dz: {알린 발견: 1}}
   조정값: G.BALANCE.era */
(function (G) {
  'use strict';
  var U = G.U, E = {};
  G.Era = E;
  function S() { return G.Game && G.Game.state; }
  function cfg() { return (G.BALANCE && G.BALANCE.era) || {}; }
  var EU = { 0: 'ib', 1: 'n', 2: 'med' };
  E.EUROPE = [0, 1, 2];
  function curve(a, y) {
    if (!a || !a.length) return 1;
    if (y <= a[0][0]) return a[0][1];
    for (var i = 1; i < a.length; i++) if (y <= a[i][0]) { var p = a[i - 1], q = a[i]; return p[1] + (q[1] - p[1]) * (y - p[0]) / Math.max(1e-6, q[0] - p[0]); }
    return a[a.length - 1][1];
  }
  function yearNow() { var s = S(); return s ? s.date.y + (s.date.m - 1) / 12 + (s.date.d - 1) / 365 : 1480; }
  /** 그 지역·그 해의 시대 수요 (유럽이 아니거나 자료가 없으면 1) */
  E.raw = function (goodId, region, y) {
    var d = G.ERA_DEMAND && G.ERA_DEMAND[goodId]; if (!d || EU[region] == null) return 1;
    var k = cfg().strength == null ? 1 : cfg().strength;
    return 1 + (curve(d[EU[region]] || d.eu, y == null ? yearNow() : y) - 1) * k;
  };
  /** 값에 곱할 배수 (R.buyPrice·R.sellPrice) */
  E.mult = function (c, goodId) { if (!c || cfg().on === false) return 1; return E.raw(goodId, c.region); };
  /** 수첩: 유럽 세 지역 가운데 가장 높은·낮은 시대 수요 + 10년 뒤 흐름 */
  E.list = function () {
    var y = yearNow(), out = [];
    Object.keys(G.ERA_DEMAND || {}).forEach(function (id) {
      if (!G.GOOD[id]) return;
      var vs = E.EUROPE.map(function (r) { return E.raw(id, r, y); }), hi = Math.max.apply(null, vs), lo = Math.min.apply(null, vs);
      var fut = Math.max.apply(null, E.EUROPE.map(function (r) { return E.raw(id, r, y + 10); }));
      out.push({ g: id, name: G.GOOD[id].name, hi: hi, lo: lo, best: E.EUROPE[vs.indexOf(hi)], worst: E.EUROPE[vs.indexOf(lo)], trend: fut - hi, note: G.ERA_DEMAND[id].note || '' });
    });
    return out;
  };

  // ---------------------------------------------------------------- 날마다
  function st() {
    var s = S(); if (!s) return null;
    if (!s.era) {
      s.era = { news: 0, dz: {} };
      // 새 게임·옛 저장: 이미 지난 소식과 이미 알려진 발견은 건너뛴다
      var N = G.ERA_NEWS || [];
      while (s.era.news < N.length && (N[s.era.news][0] * 12 + N[s.era.news][1]) < (s.date.y * 12 + s.date.m)) s.era.news++;
      (G.DISCOVERIES || []).forEach(function (d) { if (isPublic(s, d)) s.era.dz[d.id] = 1; });
    }
    return s.era;
  }
  function isPublic(s, d) { var x = s.disc && s.disc[d.id]; return !!(x && (x.rival || x.reported || x.announced)); }
  function regName(r) { return G.REGIONS[r] + ' 지역'; }
  function fadsOf() { var s = S(); return s.fad && s.fad.on ? s.fad.on.filter(function (f) { return s.day < f.until; }) : []; }
  function hasFad(g, r) { return fadsOf().some(function (f) { return f.g === g && f.k === 'r' && f.key === r; }); }
  /** 세상의 유행을 올린다 */
  function start(g, r, src, why, m, days) {
    var s = S(); if (!G.GOOD[g] || hasFad(g, r) || !G.Fad || !G.Fad.start) return null;
    var f = { g: g, k: 'r', key: r, since: s.day, until: s.day + days, m: Math.round(m * 100) / 100, src: src, why: why || '' };
    G.Fad.start(f);
    return f;
  }
  /** 값이 오른 만큼을 말로 (숫자 대신 — 소식은 이야기하듯) */
  function riseText(m) {
    var h = U.howMuch(m);
    return /곱절$/.test(h) ? h + '로 뛰었다' : h + ' 올랐다';
  }
  function fadText(f, place) {
    var nm = G.GOOD[f.g].name, rg = G.REGIONS[f.key];
    return place + ' ' + nm + U.jx(nm, '이/가') + ' 유행이다. ' + rg + ' 상인들 말로는 ' + nm + ' 값이 ' + riseText(f.m) + '며, ' + U.howLong(f.until - f.since) + '은 이 바람이 가라앉지 않을 거라고 한다.';
  }
  /** 발견이 알려진 곳의 유럽 지역 */
  function discRegion(s, d) {
    var x = s.disc[d.id] || {}, c = null;
    if (x.reported && G.SPONSOR && G.SPONSOR[x.reported]) c = G.CITY_DATA[G.SPONSOR[x.reported].city];
    else if (x.rival && G.SeaFolk && G.SeaFolk.rivalCity) c = G.SeaFolk.rivalCity(x.rival);
    else if (s.loc && s.loc.mode === 'city') c = G.CITY_DATA[s.loc.city];
    if (c && E.EUROPE.indexOf(c.region) >= 0) return c.region;
    return s.date.y < 1580 ? 0 : 1;          // 대항해 초기에는 이베리아, 뒤로는 북유럽 상인들이 먼저 소문을 퍼뜨렸다
  }
  E.daily = function () {
    var s = S(), T = st(), cf = cfg(), out = []; if (!T || cf.on === false) return out;
    // ① 시대의 소식
    var N = G.ERA_NEWS || [];
    while (T.news < N.length && (N[T.news][0] * 12 + N[T.news][1]) <= (s.date.y * 12 + s.date.m)) {
      var n = N[T.news++];
      out.push({ icon: 'scales', history: true, text: '【유럽 시장】 ' + n[3] });
      G.State.log('유럽 시장: ' + n[3].split('.')[0] + '.');
    }
    // ② 발견의 유행
    (G.DISCOVERIES || []).forEach(function (d) {
      if (T.dz[d.id] || !isPublic(s, d)) return;
      T.dz[d.id] = 1;
      var goods = d.cat === 'trade' && d.good ? [d.good] : (G.DISC_FADS[d.id] || []).slice();
      goods = goods.filter(function (g) { return G.GOOD[g] && g !== 'slaves'; });
      if (!goods.length || !U.chance(cf.discChance == null ? 0.85 : cf.discChance)) return;
      var r = discRegion(s, d), place = U.pick(G.FAD_PLACES[r] || ['유럽에서']);
      U.shuffle(goods).slice(0, cf.discGoods || 2).forEach(function (g) {
        var f = start(g, r, 'disc', '「' + d.name + '」 발견 소식', cf.discMult || 2, U.ri.apply(null, cf.discDays || [90, 150]));
        if (f) { out.push({ icon: 'star', history: true, text: '【세상의 유행】 「' + d.name + '」의 소식이 퍼지자 ' + fadText(f, place) }); G.State.log('세상의 유행: ' + regName(r) + '의 ' + G.GOOD[g].name + ' (「' + d.name + '」 발견 소식)'); }
      });
    });
    // ③ 저절로 이는 유행 — 그 시대에 수요가 큰 물건일수록 잘 뽑힌다
    if (U.chance((cf.worldPerYear == null ? 2.5 : cf.worldPerYear) / 365)) {
      var r2 = U.pick(E.EUROPE), y = yearNow();
      var cand = Object.keys(G.ERA_DEMAND).filter(function (g) { return G.GOOD[g] && !hasFad(g, r2) && E.raw(g, r2, y) >= (cf.worldMin || 1.05); });
      if (cand.length) {
        var g2 = U.weighted(cand, function (g) { return Math.pow(E.raw(g, r2, y) - 0.95, 1.5); });
        var f2 = start(g2, r2, 'world', '시대의 바람', cf.worldMult || 1.7, U.ri.apply(null, cf.worldDays || [60, 120]));
        if (f2) { out.push({ icon: 'star', text: '【세상의 유행】 ' + fadText(f2, U.pick(G.FAD_PLACES[r2])) }); G.State.log('세상의 유행: ' + regName(r2) + '의 ' + G.GOOD[g2].name); }
      }
    }
    // ④ 번짐 — 세상의 유행은 이웃한 유럽 지역으로 한 번 번질 수 있다
    fadsOf().forEach(function (f) {
      if (f.spreadTried || (f.src !== 'disc' && f.src !== 'world') || s.day - f.since < (cf.spreadDays || 30)) return;
      f.spreadTried = true;
      if (!U.chance(cf.spreadChance == null ? 0.4 : cf.spreadChance)) return;
      var to = E.EUROPE.filter(function (r) { return r !== f.key && !hasFad(f.g, r); }); if (!to.length) return;
      var r3 = U.pick(to), f3 = start(f.g, r3, 'spread', regName(f.key) + '에서 번진 유행', Math.max(1.3, f.m - 0.3), Math.round((f.until - f.since) * 0.7));
      if (f3) { var gn3 = G.GOOD[f.g].name; out.push({ icon: 'star', text: G.REGIONS[f.key] + '에서 일던 ' + gn3 + ' 바람이 ' + G.REGIONS[r3] + '까지 번졌다. 그곳에서도 ' + gn3 + ' 값이 ' + riseText(f3.m) + '고 한다.' }); }
    });
    return out;
  };
})(window.G = window.G || {});
