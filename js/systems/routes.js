/* 항로 경험과 자동항해 (G.Routes)
   한 항구에서 출항해 다른 항구에 곧장(사이에 다른 항구에 들르지 않고) 입항하면 그 두 항구가 이어져 자동항해가 열린다.
   예) 리스본에서 출항해 세우타에 입항 → 리스본–세우타 자동항해 (가는 길·오는 길 모두)
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

  // 경험이 없을 때의 어림 날수 (뱃길 길이 ÷ 지금 함대의 평균 선속)
  var estCache = {};
  RT.estDays = function (a, b) {
    var k = RT.key(a, b);
    if (estCache[k] != null) return estCache[k];
    var A = G.CITY_DATA[a], B = G.CITY_DATA[b]; if (!A || !B || !G.Nav.ready()) return null;
    var da = A.dock || [A.lat, A.lon], db = B.dock || [B.lat, B.lon];
    var p = G.Nav.path(da[1], da[0], db[1], db[0]); if (!p) return null;
    var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(G.Geo.wrapLon(p[i][0] - p[i - 1][0]), p[i][1] - p[i - 1][1]);
    var v = G.Plan ? G.Plan.avgSpeed() : 0.9;
    return (estCache[k] = Math.max(1, Math.ceil(L / Math.max(0.3, v))));
  };
  /** 그 항로의 날수: 다녀온 적이 있으면 가장 빨랐던 날수, 없으면 어림 */
  RT.days = function (a, b) { var r = RT.get(a, b); return r && r.best ? r.best : RT.estDays(a, b); };
  RT.isLong = function (a, b) { var d = RT.days(a, b); return d != null && d >= RT.LONG_DAYS; };
  RT.need = function (a, b) { return RT.isLong(a, b) ? RT.NEED_LONG : RT.NEED; };
  RT.count = function (a, b) { var r = RT.get(a, b); return r ? r.n : 0; };
  RT.isOpen = function (a, b) {
    if (a == null || b == null || a === b) return false;
    var n = RT.count(a, b);
    if (n < RT.NEED) return false;               // 다녀온 적이 없으면 뱃길 길이를 잴 것도 없다 (해도는 도시마다 이것을 묻는다)
    return n >= RT.need(a, b);
  };

  /** 항구에 들어왔을 때: from에서 to까지의 항해를 한 번 센다. {n, need, opened, long} */
  RT.record = function (from, to, days) {
    if (from == null || to == null || from === to) return null;
    var k = RT.key(from, to), r = all()[k] || (all()[k] = { n: 0, best: null, last: 0 });
    var wasOpen = RT.isOpen(from, to);
    r.n++; r.last = U.dateNum(S().date);
    if (days > 0 && (r.best == null || days < r.best)) r.best = days;
    var open = RT.isOpen(from, to);
    return { n: r.n, need: RT.need(from, to), opened: open && !wasOpen, open: open, long: RT.isLong(from, to), best: r.best };
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
    return A.name + '–' + B.name + ' · ' + (RT.isOpen(a, b) ? '이어진 항로' : '아직 곧장 오간 적 없음');
  };
  /** 수첩에 보일 목록: 다녀온 항로를 경험 순으로 */
  RT.list = function () {
    var out = [], m = all();
    for (var k in m) {
      var ab = k.split('-').map(Number), r = m[k];
      if (!G.CITY_DATA[ab[0]] || !G.CITY_DATA[ab[1]]) continue;
      out.push({ a: ab[0], b: ab[1], n: r.n, best: r.best, need: RT.need(ab[0], ab[1]), open: RT.isOpen(ab[0], ab[1]), long: RT.isLong(ab[0], ab[1]) });
    }
    return out.sort(function (x, y) { return (y.open - x.open) || (y.n - x.n); });
  };
})(window.G = window.G || {});
