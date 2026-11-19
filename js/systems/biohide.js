/* 동물 발견물이 달아나고 숨는다 (G.BioHide) — 2026-11-19 사용자 요청 (자료·조정값: js/data/biohide.js)
   「같은 동물 발견물 중에 육식이 있으면 주변에 동물 발견물이 안 보이고 도망쳐서 멀리 떨어지는 기능을 구현해.
     식물 발견물이 있으면 동물 발견물이 숨어 버려서 안 보이게 구현해.」
   ■ 달아남: 아직 찾지 않은 육식 동물(G.CARNIVORES)이 scareR 안에 살면, 그 둘레의 다른 동물(먹잇감)은 육식 동물 반대쪽으로
     flee만큼 떨어진 같은 지역의 뭍으로 달아나 있다. 그 자리에서 발자국·정찰·찾기가 모두 이루어진다.
     육식 동물을 찾으면(겁줄 것이 사라지면) 먹잇감은 원래 자리로 돌아온다.
   ■ 숨음: 아직 찾지 않은 식물 발견물이 plantR 안에 있으면 동물은 덤불에 숨어 보이지 않는다 — 발자국·정찰대·찾기 모두.
     그 식물을 찾으면 동물이 모습을 드러낸다. 가까이 가면 부관이 「무언가 숨었다 — 근처의 ○○부터」라고 일러 준다.
   ■ 다루는 곳: 발자국 자리(G.AnimalTracking.basePos·visible) · 뭍의 발견 판정(G.Disc.checkLand) · 정찰(G.Explore.sense·markers)
     · 계약 범위 표시(js/scenes/land.js — G.BioHide.fled). 바다·도시의 발견은 그대로.
   ■ 저장: 없음 (발견 여부로만 정한다 — 옛 저장도 그대로). 알림 간격만 s.bioSaid = {id: 날} */
(function (G) {
  'use strict';
  var U = G.U;
  var B = G.BioHide = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.bio) || { scareR: 2.2, flee: [2.0, 3.2], plantR: 1.0, sayDays: 20 }; }
  var CARN = {}; (G.CARNIVORES || []).forEach(function (id) { CARN[id] = 1; });
  B.isCarnivore = function (d) { return !!(d && CARN[d.id]); };
  // 땅의 들짐승 — 도시 둘레에서 사람과 사는 집짐승(개·고양이·말: homeCity·outskirts)은 달아나지도 숨지도 않는다
  function isAnimal(d) { return !!(d && d.animal && d.cat === 'creature' && d.how === 'land' && !d.outskirts && d.homeCity == null && !(G.Disc.isPlant && G.Disc.isPlant(d))); }
  /** 달아날 수 있는 먹잇감: 땅의 동물 (육식·전설·책으로만 나오는 것·곤충·물고기는 빼고) */
  var BIG = {}; (G.BIO_FEARLESS || []).forEach(function (id) { BIG[id] = 1; });
  B.isPrey = function (d) { return isAnimal(d) && !CARN[d.id] && !BIG[d.id] && !d.legendBeast && !d.bookOnly && !d.insect && !d.fish; };
  function live(d) { return d && !G.Disc.foundByMe(d.id) && G.Disc.built(d) && G.Disc.opened(d) && G.Disc.needMet(d); }

  // 하루·발견 수가 바뀔 때만 다시 센다 (발자국 그림이 프레임마다 부른다)
  var memo = { key: '', pred: {}, flee: {}, hide: {} };
  function fresh() {
    var s = S(); if (!s) return memo;
    var key = (s.day || 0) + ':' + (s.stats && s.stats.found || 0) + ':' + Object.keys(s.disc || {}).length;
    if (memo.key !== key) memo = { key: key, pred: {}, flee: {}, hide: {}, s: s };
    else if (memo.s !== s) memo = { key: key, pred: {}, flee: {}, hide: {}, s: s };
    return memo;
  }
  var CARN_LIST = null, PLANT_LIST = null;
  function carnList() { return CARN_LIST || (CARN_LIST = (G.CARNIVORES || []).map(function (id) { return G.DISC[id]; }).filter(function (d) { return d && d.how === 'land'; })); }
  function plantList() { return PLANT_LIST || (PLANT_LIST = G.DISCOVERIES.filter(function (d) { return d.how === 'land' && G.Disc.isPlant && G.Disc.isPlant(d); })); }

  /** 이 먹잇감을 겁주는 (아직 찾지 않은) 가장 가까운 육식 동물 */
  B.predator = function (d) {
    if (!B.isPrey(d)) return null;
    var m = fresh(); if (m.pred[d.id] !== undefined) return m.pred[d.id];
    var R0 = K().scareR, best = null, bd = 1e9;
    carnList().forEach(function (c) { if (c === d || !live(c)) return; var dd = G.Geo.dist(c.lon, c.lat, d.lon, d.lat); if (dd < R0 && dd < bd) { bd = dd; best = c; } });
    m.pred[d.id] = best; return best;
  };
  function regionAt(lon, lat) {
    var best = null, bd = 1e9;
    G.CITY_DATA.forEach(function (c) { if (!c) return; var dd = G.Geo.dist(c.lon, c.lat, lon, lat); if (dd < bd) { bd = dd; best = c; } });
    return best && bd < 14 ? best.region : null;
  }
  var FLEE = {};   // 육식 동물마다 달아난 자리 (늘 같다 — id로 굴림)
  /** 육식 동물을 피해 달아난 자리. 같은 지역의 뭍을 못 찾으면 null(제자리) */
  B.fleePoint = function (d, c) {
    var k = d.id + '>' + c.id; if (FLEE[k] !== undefined) return FLEE[k];
    var Geo = G.Geo, f = K().flee, rng = U.makeRng(U.strHash(k)), base = Math.atan2(d.lat - c.lat, Geo.wrapLon(d.lon - c.lon)), out = null;
    if (!Geo.isLand) return null;
    for (var tries = 0; tries < 48 && !out; tries++) {
      var a = base + (rng() - 0.5) * (tries < 24 ? 1.6 : 3.4), r = f[0] + rng() * (f[1] - f[0]);
      var lon = Geo.wrapLon(d.lon + Math.cos(a) * r), lat = d.lat + Math.sin(a) * r;
      if (Math.abs(lat) > 80 || Geo.sdf(lon, lat) < 0.12) continue;
      if (G.Geo.dist(lon, lat, c.lon, c.lat) < K().scareR + 0.3) continue;   // 달아난 곳이 또 그 짐승 곁이면 안 된다
      var rg = regionAt(lon, lat); if (rg != null && rg !== d.reg) continue;
      out = { lon: lon, lat: lat };
    }
    FLEE[k] = out; return out;
  };
  /** 지금 이 동물이 있는 곳 (달아났으면 달아난 자리) — 발자국 이동(shift)은 G.AnimalTracking이 더한다 */
  B.home = function (d) { return { lon: d.lon, lat: d.lat }; };
  B.fled = function (d) { var c = B.predator(d); return c ? B.fleePoint(d, c) : null; };
  B.pos = function (d) {
    if (!d) return d;
    if (G.AnimalTracking && G.AnimalTracking.is && G.AnimalTracking.is(d)) return G.AnimalTracking.position(d);
    return B.fled(d) || d;
  };
  /** 가까운 (아직 찾지 않은) 식물 때문에 숨었나 — 숨게 만든 식물을 돌려준다 */
  B.hidingPlant = function (d) {
    if (!isAnimal(d) || d.legendBeast) return null;
    var m = fresh(); if (m.hide[d.id] !== undefined) return m.hide[d.id];
    var p = B.fled(d) || d, R0 = K().plantR, best = null, bd = 1e9;
    plantList().forEach(function (q) { if (!live(q)) return; var dd = G.Geo.dist(q.lon, q.lat, p.lon, p.lat); if (dd < R0 && dd < bd) { bd = dd; best = q; } });
    m.hide[d.id] = best; return best;
  };
  B.hidden = function (d) { return !!B.hidingPlant(d); };

  // ---------------------------------------------------------------- 알림 (가까이 갔을 때 부관이 까닭을 일러 준다)
  function said(id) { var s = S(), m = s.bioSaid || (s.bioSaid = {}); if (m[id] != null && s.day - m[id] < K().sayDays) return true; m[id] = s.day; return false; }
  function nameOf(d) { return d.clue && d.clue !== d.name && !G.Disc.foundByMe(d.id) ? d.clue : d.name; }
  /** 뭍의 하루: 단서를 아는 동물의 원래 자리에 와 보면 왜 없는지 알린다 */
  B.landDay = function (lon, lat) {
    var s = S(); if (!s || !s.hints) return;
    G.DISCOVERIES.forEach(function (d) {
      if (!isAnimal(d) || !s.hints[d.id] || !live(d)) return;
      var home = G.Geo.dist(lon, lat, d.lon, d.lat) < Math.max(0.7, d.r || 0.6);
      var c = B.predator(d), fp = c && B.fleePoint(d, c);
      if (home && fp && !said(d.id)) {
        var dir = U.dirName(Math.atan2(fp.lat - d.lat, G.Geo.wrapLon(fp.lon - d.lon)));
        G.UI.toast('「' + nameOf(d) + '」의 발자국이 ' + dir + '쪽 멀리 달아났다 — 이 근방에 사나운 짐승(「' + nameOf(c) + '」)이 산다.', 'paw', 6500);
        return;
      }
      var hp = B.hidingPlant(d);
      if (hp) { var p = B.pos(d); if (G.Geo.dist(lon, lat, p.lon, p.lat) < Math.max(0.7, d.r || 0.6) && !said(d.id)) G.UI.toast('덤불 속에서 무언가 숨는 기척이 난다. 근처의 「' + nameOf(hp) + '」부터 찾아보자.', 'leaf', 6500); }
    });
  };

  // ---------------------------------------------------------------- 다른 시스템에 붙인다
  function hook() {
    if (B.hooked) return; B.hooked = true;
    var A = G.AnimalTracking;
    if (A && A.basePos) {
      var obp = A.basePos;
      A.basePos = function (d) { var b = obp.apply(this, arguments); var fp = d && d.how === 'land' ? B.fled(d) : null; return fp || b; };
      var ovis = A.visible;
      if (ovis) A.visible = function () { var r = ovis.apply(this, arguments); return Array.isArray(r) ? r.filter(function (d) { return !B.hidden(d); }) : r; };
    }
    var D = G.Disc;
    if (D && D.checkLand) {
      var ocl = D.checkLand;
      D.checkLand = function (lon, lat, opt) {
        var r = ocl.apply(this, arguments);
        if (r && r.hits) r.hits = r.hits.filter(function (d) { return !B.hidden(d); });
        try { B.landDay(lon, lat); } catch (e) { console.error(e); }
        return r;
      };
    }
    var X = G.Explore;
    if (X && X.sense) {
      var osense = X.sense;
      X.sense = function (mode, lon, lat, boost) {
        var r = osense.apply(this, arguments);
        if (mode !== 'land' || !Array.isArray(r)) return r;
        r = r.filter(function (o) { return !B.hidden(o.d) && !B.fled(o.d); });
        // 달아난 동물은 달아난 자리에서 알아챈다
        var s = S(), mk = s && s.marks || {}, rl = X.landRange() * (boost || 1);
        G.DISCOVERIES.forEach(function (d) {
          if (!B.isPrey(d) || mk[d.id] || G.Disc.foundByMe(d.id) || !G.Disc.available(d) || B.hidden(d)) return;
          var fp = B.fled(d); if (!fp) return;
          var dist = G.Geo.dist(lon, lat, fp.lon, fp.lat), hint = G.Disc.clueK(d.id, 'sense');
          if (dist < rl * hint && dist > (d.r || 0.3) * 0.9) r.push({ d: d, dist: dist });
        });
        return r.sort(function (a, b) { return a.dist - b.dist; });
      };
    }
    if (X && X.markers) {
      var omk = X.markers;
      X.markers = function () {
        var r = omk.apply(this, arguments); if (!Array.isArray(r)) return r;
        return r.filter(function (m) { return !B.hidden(m.d); }).map(function (m) {
          var fp = m.d && m.d.how === 'land' ? B.fled(m.d) : null; if (!fp) return m;
          var dx = G.Geo.wrapLon(fp.lon - m.d.lon), dy = fp.lat - m.d.lat;
          var o = {}; for (var k in m) o[k] = m[k]; o.lon = G.Geo.wrapLon(m.lon + dx); o.lat = m.lat + dy; return o;
        });
      };
    }
  }
  B.hook = hook;
  hook();
})(window.G = window.G || {});
