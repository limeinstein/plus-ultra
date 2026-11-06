/* 해적이 활동하는 바다 (G.PirateAct) — 2026-11-07 사용자 요청
   · 해적은 바다(G.Ships.zone)마다, 그 바다의 지리상 발견이 이루어지고(관문 발견물이 세상에 알려짐 — 제독이든 경쟁자든)
     그 바다의 발견물이 reports(5)개 이상 보고된 뒤부터 활동하기 시작한다. 처음에는 본래 빈도의 start(20%)로, rampYears(10)년에 걸쳐
     점점 늘어 본래 빈도가 된다.
       보고 = 제독의 발표(st.announced)·후원자 보고(st.reported)·경쟁자의 발표(st.rival). 찾기만 하고 알리지 않은 것과 관문 발견물 자신은 세지 않는다.
       그 바다의 발견물 = 발견물 자리(lon·lat)가 그 바다 구역에 드는 것.
   · 처음부터 활동하는 바다(always): 동아시아(왜구) · 지중해(바르바리 해적 — 제르바 섬) · 대서양(모로코·서아프리카 바다 — 마모라).
   · 관문(gate): 아메리카 westroute(서쪽 항로) · 인도양 indiaroute(인도 항로) · 동남아시아 malacca(말라카). 북해·발트해는 유럽의 바다라 관문 없이 보고 수만 본다.
   · 바다의 보통 해적(sea.js pirateChance·spawnNpcs)과 여급의 귀띔(maidtip.js)에 적용한다. 이름난 해적은 보통 해적 떼에 붙으므로 함께 따른다.
     이야기의 해적(왕명·왕녀·회사 임무·튜토리얼·해적 소굴의 두목)은 이 규칙과 상관없다.
   · 게임을 시작하고 calmYears(5)년 동안 이름난 해적은 바다에 보여도 제독을 먼저 건드리지 않는다(n.calm — js/systems/seacaptains.js CP.assign).
     제독이 먼저 다가가 공격할 수는 있다.
   활동이 시작된 날은 기록에서 센다: 관문이 알려진 날과 그 바다의 다섯째 보고(발견한 날 기준) 가운데 늦은 날 — 옛 저장도 그대로 맞는다.
   조정값: G.BALANCE.pirateAct (js/data/base.js). 저장: s.pirateAct.told = {바다: 1} (해적이 나타나기 시작했다는 소문을 알렸다) */
(function (G) {
  'use strict';
  var U = G.U;
  var PA = {};
  G.PirateAct = PA;
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.pirateAct) || {}; }
  function st() { var s = S(); if (!s) return null; if (!s.pirateAct || typeof s.pirateAct !== 'object') s.pirateAct = {}; if (!s.pirateAct.told) s.pirateAct.told = {}; return s.pirateAct; }
  PA.ZONES = ['med', 'atl', 'north', 'amer', 'ind', 'sea', 'east'];
  PA.always = function (zone) { return (K().always || ['east', 'med', 'atl']).indexOf(zone) >= 0; };
  PA.gate = function (zone) { var g = K().gate || {}; return g[zone] || null; };

  // ---------------------------------------------------------------- 바다마다 보고된 발견물 수 (하루에 한 번 센다)
  var cacheKey = '', cache = null, zoneOfDisc = null;
  function discZone(d) {
    if (!zoneOfDisc) zoneOfDisc = {};
    if (zoneOfDisc[d.id] === undefined) zoneOfDisc[d.id] = d.lon != null && d.lat != null && G.Ships ? G.Ships.zone(d.lon, d.lat) : null;
    return zoneOfDisc[d.id];
  }
  function reported(x) { return !!(x && ((x.me && (x.announced || x.reported)) || x.rival)); }
  /** 날짜 수(YYYYMMDD) → 게임 날(s.day 기준) */
  function dayOf(dn) {
    var s = S(); if (!dn || !U.dayIndex) return s.day;
    return s.day - (U.dayIndex(s.date) - U.dayIndex({ y: Math.floor(dn / 10000), m: Math.floor(dn / 100) % 100 || 1, d: dn % 100 || 1 }));
  }
  /** 바다마다 보고된 발견물의 날(오름차순) — 하루에 한 번 센다 */
  function days() {
    var s = S(); if (!s) return {};
    // 보고 여부까지 담은 열쇠 (발표·보고는 발견물 수를 바꾸지 않는다) — 발견물 기록을 한 번 훑는 값싼 셈
    var keys = Object.keys(s.disc || {}), sig = 0;
    keys.forEach(function (id, i) { if (reported(s.disc[id])) sig += i + 1; });
    var k = s.day + ':' + keys.length + ':' + sig;
    if (cache && cacheKey === k) return cache;
    var out = {}; PA.ZONES.forEach(function (z) { out[z] = []; });
    Object.keys(s.disc || {}).forEach(function (id) {
      var d = G.DISC[id], x = s.disc[id]; if (!d || !reported(x)) return;
      var z = discZone(d); if (!z || !out[z] || PA.gate(z) === id) return;   // 관문 발견물(서쪽 항로 등)은 다섯에 넣지 않는다 — 그 뒤의 보고 다섯
      out[z].push(Math.min(s.day, dayOf(x.found)));
    });
    PA.ZONES.forEach(function (z) { out[z].sort(function (a, b) { return a - b; }); });
    cache = out; cacheKey = k; return out;
  }
  PA.counts = function () { var d = days(), out = {}; PA.ZONES.forEach(function (z) { out[z] = (d[z] || []).length; }); return out; };
  /** 이 바다의 지리상 발견(관문)이 세상에 알려졌다 */
  PA.gateOpen = function (zone) {
    var g = PA.gate(zone); if (!g) return true;
    return G.Frontier && G.Frontier.known ? G.Frontier.known(g) : !!(S().disc[g] && (S().disc[g].me || S().disc[g].rival));
  };
  /** 해적이 활동할 조건을 채웠다 (활동이 시작되었는지는 PA.since) */
  PA.ready = function (zone) {
    if (PA.always(zone)) return true;
    return PA.gateOpen(zone) && (PA.counts()[zone] || 0) >= (K().reports || 5);
  };
  /** 이 바다에서 해적이 활동하기 시작한 날 (아직이면 null): 관문이 알려진 날과 다섯째 보고의 날 가운데 늦은 날 */
  PA.since = function (zone) {
    var s = S(); if (!s) return null;
    if (PA.always(zone)) return 0;
    if (!PA.ready(zone)) return null;
    var n = K().reports || 5, list = days()[zone] || [], t = list[n - 1] != null ? list[n - 1] : s.day;
    var g = PA.gate(zone), gx = g && s.disc[g];
    if (gx) t = Math.max(t, Math.min(s.day, dayOf(gx.found)));
    return t;
  };
  /** 이 바다의 해적 활동 배수 (0~1): 아직이면 0, 시작하면 start에서 rampYears에 걸쳐 1까지 */
  PA.k = function (zone) {
    var s = S(); if (!s || !zone) return 1;
    if (PA.always(zone)) return 1;
    var t0 = PA.since(zone); if (t0 == null) return 0;
    var b = K(), start = b.start == null ? 0.2 : b.start, ramp = (b.rampYears == null ? 10 : b.rampYears) * 365;
    return ramp <= 0 ? 1 : Math.min(1, start + (1 - start) * Math.max(0, s.day - t0) / ramp);
  };
  PA.kAt = function (lon, lat) { return G.Ships ? PA.k(G.Ships.zone(lon, lat)) : 1; };
  /** 게임을 시작하고 calmYears 동안: 이름난 해적이 먼저 덤비지 않는다 */
  PA.calm = function () { var s = S(); return !!(s && s.day < (K().calmYears == null ? 5 : K().calmYears) * 365); };

  /** 날마다: 새로 해적이 나타나기 시작한 바다를 알린다 (W.daily) */
  PA.daily = function () {
    var out = [], x = st(); if (!x) return out;
    PA.ZONES.forEach(function (z) {
      if (PA.always(z) || x.told[z]) return;
      var t0 = PA.since(z);
      if (t0 != null) {
        x.told[z] = 1;
        if (S().day - t0 > 30) return;   // 오래전에 시작된 바다(옛 저장)는 조용히 적어 둔다
        var nm = G.Ships.ZONE_NAME[z] || z;
        out.push({ icon: 'skull', text: '【소문】 ' + nm + '에 해적이 나타나기 시작했다고 한다. 뱃길이 열리고 보물 이야기가 퍼지자 한탕을 노리는 무리가 몰려든다는데 — 앞으로 점점 늘어날 것이다.' });
        G.State.log(nm + '에 해적이 나타나기 시작했다.');
      }
    });
    return out;
  };

  /** 수첩·시험용: 바다마다의 상태 */
  PA.report = function () {
    var c = PA.counts();
    return PA.ZONES.map(function (z) { return { zone: z, always: PA.always(z), gate: PA.gate(z), gateOpen: PA.gateOpen(z), reports: c[z] || 0, since: PA.since(z), k: Math.round(PA.k(z) * 100) / 100 }; });
  };

  function hook() {
    if (PA.hooked || !G.World || !G.World.daily) return;
    PA.hooked = true;
    var od = G.World.daily;
    G.World.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(PA.daily()); } catch (e) { console.error(e); } return out; };
  }
  hook();
  if (!PA.hooked) document.addEventListener('DOMContentLoaded', hook);
})(window.G = window.G || {});
