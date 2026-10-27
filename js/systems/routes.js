/* 항로 경험과 자동항해 (G.Routes)
   한 항구에서 출항해 다른 항구에 곧장(사이에 다른 항구에 들르지 않고) 입항하면 그 두 항구가 이어져 자동항해가 열린다.
   예) 리스본에서 출항해 세우타에 입항 → 리스본–세우타 자동항해 (가는 길·오는 길 모두)
   이어진 항로망 (2026-10-23 사용자 요청 — 대항해시대 4처럼): 곧장 오간 항로로 이어진 항구들은 서로 모두 자동항해가 열린다.
   예) 리스본→세빌리아 (리스본–세빌리아) 다음 세빌리아→알제 → 세빌리아–알제와 함께 리스본–알제도 열린다.
   저장에는 곧장 오간 항로(s.routes)만 남기고, 항로망(이어진 항구 묶음)은 그때그때 셈한다 (RT.net · 묶음이 바뀌면 다시).
   자동항해 = 항구를 고르면 뱃길을 알아서 찾아 ×4로 입항까지 가는 것. 열리지 않은 항로도 바닷길(뭍·섬을 돌아가는 길)은 따라가지만 배속은 그대로다 (sea.js setTarget).
   자동항해 중 방향키·숫자판·바다 누르기로 손으로 몰면 자동항해가 풀리고(voyage.autoOff),
   그 항해에서는 다시 쓸 수 없다 — 다음 항구에 들어간 뒤 그 항구와 이어진 항로에서 다시 쓴다. */
(function (G) {
  'use strict';
  var U = G.U;
  var RT = {};
  G.Routes = RT;
  function S() { return G.Game.state; }

  RT.NEED = 1;          // 보통 항로: 한 번 곧장 오가면 열린다
  RT.NEED_LONG = 1;     // 장거리 항로도 같다 (표에 '장거리' 표시만)
  RT.LONG_DAYS = 14;    // 이만큼 걸리는 항해는 장거리
  RT.NEAR = 3;          // 바다를 누를 때 이만큼(°) 안이면 곶을 돌아가는 뱃길을 찾아 준다

  RT.key = function (a, b) { return a < b ? a + '-' + b : b + '-' + a; };
  function all() { var s = S(); return s.routes || (s.routes = {}); }
  RT.get = function (a, b) { return all()[RT.key(a, b)] || null; };

  RT.DETOUR = 1.4;      // 뱃길을 아직 재지 않은 항로의 어림: 두 항구 사이 곧은 거리 × 이만큼 (뭍·곶을 돌아가는 몫 — 실제 뱃길 120쌍의 가운데값 1.41)

  // 경험이 없을 때의 날수 (뱃길 길이 ÷ 지금 함대의 평균 선속)
  // 뱃길 길이(°)만 기억해 두고 날수는 그때의 선속으로 나눈다 (배를 바꾸면 날수도 바뀐다). 길이 없으면 -1.
  // 뱃길 찾기(G.Nav.seaPath)는 무거워서, 출항 목적지 목록은 RT.roughDays(어림)를 쓰고 이것은 목적지를 고른 뒤에만 부른다.
  var lenCache = {}, lenVer = 0;
  var spdNow = null;
  function once(fn) { Promise.resolve().then(fn); }
  function speed() {   // 평균 선속 — 한 차례 안에서는 한 번만 센다 (목록의 항구마다 배 다섯 척의 선속을 다시 세지 않게)
    if (spdNow == null) { spdNow = Math.max(0.3, G.Plan ? G.Plan.avgSpeed() : 0.9); once(function () { spdNow = null; }); }
    return spdNow;
  }
  function dockOf(c) { return c.dock || [c.lat, c.lon]; }
  function pathLen(p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(G.Geo.wrapLon(p[i][0] - p[i - 1][0]), p[i][1] - p[i - 1][1]); return L; }
  RT.estDays = function (a, b) {
    var k = RT.key(a, b), L = lenCache[k];
    if (L == null) {
      var A = G.CITY_DATA[a], B = G.CITY_DATA[b]; if (!A || !B || !G.Nav.ready()) return null;
      var da = dockOf(A), db = dockOf(B);
      // 실제 항해와 같은 엄격한 뱃길을 써야 파나마 같은 지협을 가로지른 짧은 예상이 나오지 않는다.
      var p = (G.Nav.seaPath || G.Nav.path)(da[1], da[0], db[1], db[0]);
      L = lenCache[k] = p ? pathLen(p) : -1;
      lenVer++;
    }
    return L < 0 ? null : Math.max(1, Math.ceil(L / Math.max(0.3, G.Plan ? G.Plan.avgSpeed() : 0.9)));   // 정확한 셈은 지금 선속 그대로
  };
  /** 뱃길을 이미 재 두었는가 (그러면 RT.estDays가 가볍다) */
  RT.measured = function (a, b) { return lenCache[RT.key(a, b)] != null; };
  /** 곧은 거리로 어림한 날수 (곧은 거리 × RT.DETOUR ÷ 선속) */
  function lineDays(a, b, v) {
    var A = G.CITY_DATA[a], B = G.CITY_DATA[b]; if (!A || !B) return null;
    var da = dockOf(A), db = dockOf(B);
    return Math.max(1, Math.ceil(Math.hypot(G.Geo.wrapLon(db[1] - da[1]), db[0] - da[0]) * RT.DETOUR / v));
  }
  /** 길찾기 없이 매기는 한 구간 날수: 재 둔 뱃길을 지금 선속으로 환산 → 지난 항해 기록 → 거리 어림 */
  function legDays(a, b, v) {
    var L = lenCache[RT.key(a, b)];
    if (L != null) return L < 0 ? null : Math.max(1, Math.ceil(L / v));
    var r = RT.get(a, b); if (r && r.best) return r.best;
    return lineDays(a, b, v);
  }
  // 한 항구에서 항로망의 모든 항구까지, 곧장 오간 구간 날수를 더한 가장 짧은 합 (다익스트라 — 항구 수백 곳·항로 천여 개라도 몇 ms. 목록을 열 때 한 번)
  var chainMemo = null;
  function chainFrom(a, v) {
    var N = RT.net();
    if (chainMemo && chainMemo.a === a && chainMemo.net === N && chainMemo.v === v && chainMemo.lenVer === lenVer) return chainMemo.d;
    var d = {}, done = {}, list = [a]; d[a] = 0;
    while (list.length) {
      var bi = 0; for (var i = 1; i < list.length; i++) if (d[list[i]] < d[list[bi]]) bi = i;
      var x = list[bi]; list[bi] = list[list.length - 1]; list.pop();
      if (done[x]) continue; done[x] = 1;
      (N.adj[x] || []).forEach(function (y) {
        if (done[y]) return;
        var w = legDays(x, y, v); if (w == null) return;
        if (d[y] == null) { d[y] = d[x] + w; list.push(y); } else if (d[x] + w < d[y]) d[y] = d[x] + w;
      });
    }
    chainMemo = { a: a, net: N, v: v, lenVer: lenVer, d: d };
    return d;
  }
  /** 출항 목적지 목록에 쓰는 가벼운 날수 (뱃길 찾기 없음) → {days, rough}. rough=true면 어림 (화면에 「어림」).
      뱃길을 재 두었으면 지금 선속의 날수, 아니면 지난 항해 기록(rough=false).
      이어진 항로망은 경유 구간의 날수를 더한다(rough=true). 직선거리와 작은 쪽을 고르면
      아프리카를 돌아야 하는 아시아→지중해 항구가 유럽보다 가까운 것으로 잘못 나온다. */
  RT.roughDays = function (a, b) {
    var v = speed(), L = lenCache[RT.key(a, b)];
    if (L != null) return { days: L < 0 ? null : Math.max(1, Math.ceil(L / v)), rough: false };
    var r = RT.get(a, b); if (r && r.best) return { days: r.best, rough: false };
    if (RT.linked(a, b)) { var c = chainFrom(a, v)[b]; if (c != null) return { days: c, rough: true }; }
    return { days: lineDays(a, b, v), rough: true };
  };
  /** 그 항로의 날수: 다녀온 적이 있으면 가장 빨랐던 날수, 없으면 뱃길을 재어 셈 (처음 한 번은 무겁다) */
  RT.days = function (a, b) { var r = RT.get(a, b); return r && r.best ? r.best : RT.estDays(a, b); };
  RT.isLong = function (a, b) { var d = RT.days(a, b); return d != null && d >= RT.LONG_DAYS; };
  RT.need = function (a, b) { return RT.isLong(a, b) ? RT.NEED_LONG : RT.NEED; };
  RT.count = function (a, b) { var r = RT.get(a, b); return r ? r.n : 0; };
  /** 곧장 오간 항로가 열렸는가 (두 항구 사이를 한 번에 오간 적이 있다) */
  RT.direct = function (a, b) {
    if (a == null || b == null || a === b) return false;
    var n = RT.count(a, b);
    if (n < RT.NEED) return false;               // 다녀온 적이 없으면 뱃길 길이를 잴 것도 없다 (해도는 도시마다 이것을 묻는다)
    if (RT.NEED_LONG <= RT.NEED) return true;    // 장거리도 같은 횟수면 날수를 셀 것 없다 (날수를 세면 뱃길 찾기가 돈다)
    return n >= RT.need(a, b);
  };
  // ---------------------------------------------------------------- 이어진 항로망
  // 항로망은 아래가 바뀔 때만 다시 센다: 게임(s) · 항로 묶음(s.routes 자체) · RT.ver(RT.record가 올림) · 달(그 사이 사라지거나 생긴 항구)
  // 다른 곳에서 s.routes를 손으로 고치면(튜토리얼) RT.touch()를 부르거나, 다음 차례(await 한 번 뒤)에 한 번 훑어 알아챈다.
  var NET = null, netState = null, netRoutes = null, netVer = -1, netMonth = -1, netSig = '', sigFresh = false;
  RT.ver = 0;
  RT.touch = function () { RT.ver++; };
  function routesSig(m) {   // 항로 수와 열린 항로 수 — 같은 차례 안에서는 한 번만 훑는다 (해도는 매 장면 도시마다 isOpen을 묻는다)
    var n = 0, o = 0; for (var k in m) { n++; if (m[k] && m[k].n >= RT.NEED) o++; }
    return n + ':' + o;
  }
  function staleSig(m) {
    if (sigFresh) return false;
    sigFresh = true; once(function () { sigFresh = false; });
    return routesSig(m) !== netSig;
  }
  /** 곧장 오간 항로로 이어진 항구 묶음: { of: {항구: 묶음 번호}, groups: [[항구…]], adj: {항구: [이웃…]} }
      지금 없는 항구(아직 세워지지 않았거나 사라진 마을)는 다리가 되지 않는다. */
  RT.net = function () {
    var s = S(), m = all(), d = s.date, mon = d ? d.y * 12 + d.m : 0;
    if (NET && netState === s && netRoutes === m && netVer === RT.ver && netMonth === mon && !staleSig(m)) return NET;
    var adj = {}, ex = {};
    function alive(id) {
      if (ex[id] == null) { var c = G.CITY_DATA[id]; ex[id] = !!c && (!G.R || !G.R.cityExists || G.R.cityExists(c)); }
      return ex[id];
    }
    for (var k in m) {
      var r = m[k]; if (!r || !(r.n >= RT.NEED)) continue;
      var i = k.indexOf('-'), a = +k.slice(0, i), b = +k.slice(i + 1);
      if (!alive(a) || !alive(b) || !RT.direct(a, b)) continue;
      (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a);
    }
    var of = {}, groups = [];
    Object.keys(adj).forEach(function (st) {
      st = +st; if (of[st] != null) return;
      var g = [], q = [st], qi = 0; of[st] = groups.length;
      while (qi < q.length) { var x = q[qi++]; g.push(x); adj[x].forEach(function (y) { if (of[y] == null) { of[y] = groups.length; q.push(y); } }); }
      groups.push(g);
    });
    NET = { of: of, groups: groups, adj: adj }; netState = s; netRoutes = m; netVer = RT.ver; netMonth = mon; netSig = routesSig(m);
    sigFresh = true; once(function () { sigFresh = false; });
    return NET;
  };
  /** 자동항해가 열렸는가: 곧장 오갔거나, 곧장 오간 항로로 이어진 항구끼리 */
  RT.isOpen = function (a, b) {
    if (a == null || b == null || a === b) return false;
    if (RT.direct(a, b)) return true;
    var N = RT.net();
    return N.of[a] != null && N.of[a] === N.of[b];
  };
  /** 이어진 항로망으로만 열렸는가 (곧장 오간 적은 없다) */
  RT.linked = function (a, b) { return RT.isOpen(a, b) && !RT.direct(a, b); };
  /** 이 항구에서 자동항해로 갈 수 있는 항구들 (곧장 오간 곳 + 항로망으로 이어진 곳) */
  RT.reachable = function (a) {
    var N = RT.net(), g = N.of[a]; if (a == null || g == null) return [];
    return N.groups[g].filter(function (x) { return x !== a; });
  };
  /** 항로망에서 a에서 b까지 거쳐 가는 항구 (곧장 오간 항로를 따라 — 가장 적게 거치는 길) */
  RT.via = function (a, b) {
    var N = RT.net(); if (N.of[a] == null || N.of[a] !== N.of[b]) return [];
    var prev = {}, q = [a], qi = 0; prev[a] = a;
    while (qi < q.length) { var x = q[qi++]; if (x === b) break; (N.adj[x] || []).forEach(function (y) { if (prev[y] == null) { prev[y] = x; q.push(y); } }); }
    var out = [], c = prev[b]; while (c != null && c !== a) { out.unshift(c); c = prev[c]; }
    return out;
  };

  /** 항구에 들어왔을 때: from에서 to까지의 항해를 한 번 센다. {n, need, opened, long} */
  RT.record = function (from, to, days) {
    if (from == null || to == null || from === to) return null;
    var k = RT.key(from, to), r = all()[k] || (all()[k] = { n: 0, best: null, last: 0 });
    var wasDirect = RT.direct(from, to), before = {};
    RT.reachable(to).forEach(function (x) { before[x] = 1; });
    r.n++; r.last = U.dateNum(S().date);
    if (days > 0 && (r.best == null || days < r.best)) r.best = days;
    RT.ver++;
    var open = RT.direct(from, to);
    // 이번 항해로 새로 이어진 항구 (항로망): 도착한 항구에서 새로 자동항해할 수 있게 된 곳 (곧장 온 출발 항구는 빼고)
    var gained = open && !wasDirect ? RT.reachable(to).filter(function (x) { return !before[x] && x !== from && G.CITY_DATA[x] && G.CITY_DATA[x].port; }) : [];
    return { n: r.n, need: RT.need(from, to), opened: open && !wasDirect, open: open, long: RT.isLong(from, to), best: r.best, linked: gained };
  };
  /** 이 항해를 시작한 항구 (자동항해 판정의 기준). 이번 항해에 자동항해를 풀었으면 null — 다음 항구에서 다시 */
  RT.origin = function () {
    var s = S();
    if (s.voyage && s.voyage.autoOff && s.loc && s.loc.mode !== 'city') return null;
    if (s.voyage && s.voyage.from != null) return s.voyage.from;
    if (s.loc && s.loc.from != null) return s.loc.from;
    return null;
  };
  /** 이번 항해에 자동항해를 풀었는가 (다음 항구에 들어가면 다시 쓸 수 있다) */
  RT.autoOff = function () { var s = S(); return !!(s.voyage && s.voyage.autoOff && s.loc && s.loc.mode !== 'city'); };
  /** 한 줄 설명: "리스본–세우타 · 아직 곧장 오간 적 없음" */
  RT.label = function (a, b) {
    var A = G.CITY_DATA[a], B = G.CITY_DATA[b];
    if (RT.linked(a, b)) { var v = RT.via(a, b).map(function (x) { return G.CITY_DATA[x].name; }); return A.name + '–' + B.name + ' · 이어진 항로망' + (v.length ? ' (' + v.slice(0, 3).join('·') + (v.length > 3 ? ' 외 ' + (v.length - 3) + '곳' : '') + ' 거쳐 익힘)' : ''); }
    return A.name + '–' + B.name + ' · ' + (RT.isOpen(a, b) ? '이어진 항로' : '아직 곧장 오간 적 없음');
  };
  /** 수첩에 보일 목록: 다녀온 항로를 경험 순으로 */
  RT.list = function () {
    var out = [], m = all();
    for (var k in m) {
      var ab = k.split('-').map(Number), r = m[k];
      if (!G.CITY_DATA[ab[0]] || !G.CITY_DATA[ab[1]]) continue;
      // 장거리 표시는 가볍게 (재 둔 뱃길이 없으면 어림) — 수첩·해도가 항로마다 뱃길 찾기를 돌리지 않게
      var lg = r.best ? r.best >= RT.LONG_DAYS : RT.measured(ab[0], ab[1]) ? RT.isLong(ab[0], ab[1]) : (RT.roughDays(ab[0], ab[1]).days || 0) >= RT.LONG_DAYS;
      out.push({ a: ab[0], b: ab[1], n: r.n, best: r.best, need: lg ? RT.NEED_LONG : RT.NEED, open: RT.isOpen(ab[0], ab[1]), long: lg });
    }
    return out.sort(function (x, y) { return (y.open - x.open) || (y.n - x.n); });
  };
})(window.G = window.G || {});
