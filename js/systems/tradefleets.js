/* 교역 항로의 상선대 (G.TradeFleet) — 자료: js/data/tradefleets.js (G.TRADE_ROUTES) · 조정값: G.BALANCE.tradeFleet
   ■ 항로가 열린다: 인도·향료·서회·신세계(태평양)·말라카·중국·일본 항로의 발견이 세상에 알려지면(제독의 보고·발표, 경쟁자의 발표)
   ■ 상선대가 늘어난다: 처음 두 해 2함대 → 다음 두 해 4함대 → 8 → 16 → 32함대 (10년째부터는 32함대에서 멈춘다)
     늘 때마다 세상의 소식으로 알린다.
   ■ 경제: 함대가 많을수록(2함대 0.2 … 32함대 1.0) 그 항로의 물건 값이 바뀐다 — 교역소의 사는 값·파는 값·재고 (rules.js R.buyPrice·R.sellPrice·R.supply)
     · 받는 쪽(home): 실어 오는 물건(goods)이 흔해진다 — 값 ↓(최대 homeDrop), 재고 ↑(homeStock)
     · 나는 쪽(far): 상선대가 사 가니 그 물건이 귀해진다 — 값 ↑(farRise), 재고 ↓(farStock)
     · 나는 쪽(far): 값으로 치르는 물건(back)이 흔해진다 — 값 ↓(backDrop), 재고 ↑(backStock) · 받는 쪽에서는 조금 귀해진다(backRise)
     · 뭍 안의 도시(항구가 아닌 곳)는 그 반만. 여러 항로가 겹치면 곱하되 [minMult, maxMult] 안으로
   ■ 바다: 항로 가까운 바다(lane에서 near도 안)에서 그 항로의 상선대를 더 자주 만난다 (sea.js spawnNpcs → TF.seaChance·TF.decorate)
   ■ 수첩 「교역」에 열린 항로와 함대 수 (TF.box), 교역소 물건 줄에 「항로 ▼▲」 꼬리표 (TF.tag)
   저장: s.tfleet = { open: {항로: 열린 날(s.day)}, told: {항로: 알린 함대 수} } — 옛 저장에 없으면 만든다(이미 알려진 항로는 발견된 날부터 센다) */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var TF = {};
  G.TradeFleet = TF;
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.tradeFleet = G.BALANCE.tradeFleet || {
    stepYears: 2, start: 2, max: 32,                  // 두 해마다 두 배, 2함대에서 32함대까지
    homeDrop: 0.25, homeStock: 0.8, farRise: 0.12, farStock: 0.3, backDrop: 0.18, backStock: 0.5, backRise: 0.08,
    inland: 0.5, minMult: 0.55, maxMult: 1.5,
    near: 5, seaChance: 0.1                           // 뱃길에서 near도 안이면 상선을 만날 확률이 32함대일 때 +seaChance (함대 수만큼)
  };
  function K() { return G.BALANCE.tradeFleet; }
  function S() { return G.Game && G.Game.state; }
  function routes() { return G.TRADE_ROUTES || []; }
  TF.route = function (id) { return routes().filter(function (r) { return r.id === id; })[0] || null; };

  // ---------------------------------------------------------------- 열림·함대 수
  function isPublic(s, discId) { var x = s.disc && s.disc[discId]; return !!(x && (x.rival || x.reported || x.announced)); }
  function dayOf(s, dn) {   // 날번호(yyyymmdd) → 게임 날(s.day)
    if (!dn || !U.dayIndex) return s.day;
    var dt = { y: Math.floor(dn / 10000), m: Math.floor(dn / 100) % 100 || 1, d: dn % 100 || 1 };
    return Math.min(s.day, s.day - (U.dayIndex(s.date) - U.dayIndex(dt)));
  }
  function st() {
    var s = S(); if (!s) return null;
    if (!s.tfleet) {
      s.tfleet = { open: {}, told: {} };
      // 옛 저장·새 게임: 이미 알려진 항로는 발견된 날부터 센다 (소식은 지금 함대 수까지 이미 알린 것으로)
      routes().forEach(function (r) {
        if (!G.DISC || !G.DISC[r.disc] || !isPublic(s, r.disc)) return;
        s.tfleet.open[r.id] = dayOf(s, (s.disc[r.disc] || {}).found);
        s.tfleet.told[r.id] = TF.fleets(r.id);
      });
    }
    return s.tfleet;
  }
  TF.state = st;
  TF.isOpen = function (id) { var T = st(); return !!(T && T.open[id] != null); };
  /** 열린 지 몇 해 */
  TF.years = function (id) { var s = S(), T = st(); if (!T || T.open[id] == null) return -1; return Math.max(0, Math.floor((s.day - T.open[id]) / 365)); };
  /** 지금 그 항로를 오가는 상선대 수 (열리지 않았으면 0): 2·4·8·16·32 */
  TF.fleets = function (id) {
    var s = S(), T = st(); if (!T || T.open[id] == null) return 0;
    var k = K(), y = Math.max(0, Math.floor((s.day - T.open[id]) / 365));
    return Math.min(k.max, k.start * Math.pow(2, Math.floor(y / k.stepYears)));
  };
  /** 다음에 늘어날 때까지 남은 날 (다 늘었으면 null) */
  TF.nextIn = function (id) {
    var s = S(), T = st(), k = K(); if (!T || T.open[id] == null || TF.fleets(id) >= k.max) return null;
    var span = k.stepYears * 365, since = s.day - T.open[id];
    return span - (since % span);
  };
  /** 세기 0~1: 2함대 0.2 · 4함대 0.4 · 8함대 0.6 · 16함대 0.8 · 32함대 1.0 */
  TF.level = function (id) { var n = TF.fleets(id), k = K(); return n ? Math.log(n) / Math.log(2) / (Math.log(k.max) / Math.log(2)) : 0; };

  // ---------------------------------------------------------------- 값
  var CACHE = {}, CKEY = '';
  function levels() {
    var s = S(); if (!s || !st()) return {};
    var key = s.day + ':' + JSON.stringify((s.tfleet || {}).open || {});
    if (key === CKEY) return CACHE;
    CKEY = key; CACHE = {};
    routes().forEach(function (r) { var t = TF.level(r.id); if (t > 0) CACHE[r.id] = t; });
    return CACHE;
  }
  /** 도시 c의 물건 g에 상선대가 거는 배수 — side: 'buy'·'sell'(값) · 'stock'(재고) */
  TF.mult = function (c, g, side) {
    if (!c || !S()) return 1;
    var L = levels(), k = K(), v = 1, any = false, w = c.port ? 1 : k.inland;
    for (var id in L) {
      var r = TF.route(id), t = L[id] * w; if (!r) continue;
      var home = r.home.indexOf(c.region) >= 0, far = r.far.indexOf(c.region) >= 0;
      if (!home && !far) continue;
      var inG = r.goods.indexOf(g) >= 0, inB = r.back.indexOf(g) >= 0;
      if (side === 'stock') {
        if (home && inG) v *= 1 + k.homeStock * t;
        else if (far && inG) v *= 1 - k.farStock * t;
        else if (far && inB) v *= 1 + k.backStock * t;
        else continue;
      } else {
        if (home && inG) v *= 1 - k.homeDrop * t;
        else if (far && inG) v *= 1 + k.farRise * t;
        else if (far && inB) v *= 1 - k.backDrop * t;
        else if (home && inB) v *= 1 + k.backRise * t;
        else continue;
      }
      any = true;
    }
    if (!any) return 1;
    return side === 'stock' ? Math.max(0.3, Math.min(3, v)) : Math.max(k.minMult, Math.min(k.maxMult, v));
  };
  /** 그 도시에서 이 물건에 걸린 항로들 (꼬리표·설명용) */
  function routesOn(c, g) {
    var L = levels(), out = [];
    for (var id in L) { var r = TF.route(id); if (r && (r.home.indexOf(c.region) >= 0 || r.far.indexOf(c.region) >= 0) && (r.goods.indexOf(g) >= 0 || r.back.indexOf(g) >= 0)) out.push(r); }
    return out;
  }
  /** 교역소 물건 줄의 꼬리표: 항로 ▼(흔해짐) ▲(귀해짐) */
  TF.tag = function (c, g) {
    var m = TF.mult(c, g, 'sell'); if (m > 0.95 && m < 1.05) return '';
    var rs = routesOn(c, g), why = rs.map(function (r) { return r.name + ' 상선대 ' + TF.fleets(r.id) + '함대'; }).join(' · ');
    return ' <span class="tag ' + (m < 1 ? 'era-down' : 'era-up') + '" title="' + U.esc((m < 1 ? '상선대가 실어 와 흔해졌다' : '상선대가 사 가서 귀해졌다') + ' ×' + m.toFixed(2) + ' — ' + why) + '">항로 ' + (m < 1 ? '▼' : '▲') + '</span>';
  };

  // ---------------------------------------------------------------- 날마다: 열림·늘어남 소식
  function goodsText(list) { return list.filter(function (g) { return G.GOOD[g]; }).slice(0, 3).map(function (g) { return G.GOOD[g].name; }).join('·'); }
  /** 문화권 이름들 — 유럽 세 지역 가운데 둘 넘게 들면 「유럽」으로 묶는다 */
  function regionsName(list) {
    var eu = list.filter(function (x) { return x <= 2; }), rest = list.filter(function (x) { return x > 2; }).map(function (x) { return G.REGIONS[x]; });
    return (eu.length >= 2 ? ['유럽'] : eu.map(function (x) { return G.REGIONS[x]; })).concat(rest).join('·');
  }
  function homeName(r) { return regionsName(r.home); }
  TF.daily = function () {
    var s = S(), T = st(), out = []; if (!T) return out;
    var k = K();
    routes().forEach(function (r) {
      if (!G.DISC || !G.DISC[r.disc]) return;
      if (T.open[r.id] == null) {
        if (!isPublic(s, r.disc)) return;
        T.open[r.id] = s.day; T.told[r.id] = TF.fleets(r.id);
        out.push({ icon: 'ship', history: true, text: '【교역 항로】 ' + r.name + U.jx(r.name, '이/가') + ' 열렸다. ' + r.nat + '의 상선대 ' + T.told[r.id] + '함대가 ' + r.from + U.jx(r.from, '과/와') + ' ' + r.to + ' 사이를 오가기 시작했다. ' + homeName(r) + '에서는 ' + goodsText(r.goods) + ' 값이 차츰 내리고, ' + r.to + '에서는 ' + goodsText(r.back) + U.jx(goodsText(r.back).split('·').pop(), '이/가') + ' 흔해질 것이다. 상선대는 두 해마다 두 배로 늘어난다.' });
        G.State.log('교역 항로: ' + r.name + ' 개통 — 상선대 ' + T.told[r.id] + '함대');
        return;
      }
      var n = TF.fleets(r.id);
      if (n > (T.told[r.id] || 0)) {
        T.told[r.id] = n;
        var full = n >= k.max;
        out.push({ icon: 'ship', history: true, text: '【교역 항로】 ' + r.name + '의 상선대가 ' + n + '함대로 늘었다' + (full ? ' — 이제 더는 늘지 않는다' : '') + '. ' + homeName(r) + '의 ' + goodsText(r.goods) + ' 값이 더 내리고, ' + r.to + ' 쪽에서는 사 가려는 배가 몰려 값이 오른다.' });
        G.State.log('교역 항로: ' + r.name + ' 상선대 ' + n + '함대' + (full ? ' (최대)' : ''));
      }
    });
    return out;
  };

  // ---------------------------------------------------------------- 바다: 뱃길의 상선대
  function segDist(lon, lat, a, b) {
    var px = G.Geo.wrapLon(lon - a[0]), py = lat - a[1], bx = G.Geo.wrapLon(b[0] - a[0]), by = b[1] - a[1];
    var L2 = bx * bx + by * by, t = L2 ? Math.max(0, Math.min(1, (px * bx + py * by) / L2)) : 0;
    return Math.hypot(px - bx * t, py - by * t);
  }
  /** 이 바다에 가까운 열린 항로 (가장 가까운 것) */
  TF.laneAt = function (lon, lat) {
    var best = null, bd = K().near;
    routes().forEach(function (r) {
      if (!TF.fleets(r.id) || !r.lane) return;
      for (var i = 1; i < r.lane.length; i++) { var d = segDist(lon, lat, r.lane[i - 1], r.lane[i]); if (d < bd) { bd = d; best = r; } }
    });
    return best;
  };
  /** 상선을 만날 확률에 더할 몫 */
  TF.seaChance = function (lon, lat) { var r = TF.laneAt(lon, lat); return r ? K().seaChance * TF.level(r.id) : 0; };
  /** 뱃길 위에 나타난 상선: 그 항로의 상선대로 꾸민다 (나라·척수) */
  TF.decorate = function (npc) {
    if (!npc || npc.kind !== 'merchant') return npc;
    var r = TF.laneAt(npc.lon, npc.lat); if (!r) return npc;
    npc.route = r.id;
    if (!npc.nation && U.chance(0.6)) npc.nation = r.nat;
    return npc;
  };
  TF.greet = function (n) {
    var r = n && n.route && TF.route(n.route); if (!r) return null;
    return '「좋은 바람이오! ' + r.name + U.jx(r.name, '을/를') + ' 오가는 상선대요. ' + U.pick([r.from + '에서 ' + r.to + U.jx(r.to, '으로/로') + ' 가는 길이오.', r.to + '에서 짐을 가득 싣고 ' + r.from + U.jx(r.from, '으로/로') + ' 돌아가는 길이오.']) + ' 이 길에만 우리 같은 배가 ' + TF.fleets(r.id) + '함대나 다니오. 무슨 일이오?」';
  };

  // ---------------------------------------------------------------- 수첩
  TF.list = function () {
    return routes().filter(function (r) { return TF.isOpen(r.id); }).map(function (r) {
      return { id: r.id, name: r.name, nat: r.nat, from: r.from, to: r.to, n: TF.fleets(r.id), years: TF.years(r.id), next: TF.nextIn(r.id), goods: r.goods, back: r.back, home: homeName(r), far: regionsName(r.far) };
    });
  };
  TF.box = function () {
    var L = TF.list(); if (!L.length) return '';
    var k = K();
    function gl(list) { return list.filter(function (g) { return G.GOOD[g]; }).map(function (g) { return G.goodDot(g) + G.GOOD[g].name; }).join(' '); }
    function dots(n) { var full = Math.round(Math.log(n) / Math.log(2)); return '<span class="tf-dots">' + '●'.repeat(full) + '<span class="muted">' + '○'.repeat(Math.max(0, 5 - full)) + '</span></span>'; }
    return '<div class="era-box tf-box"><b>' + G.icon('ship') + ' 교역 항로의 상선대</b> <small class="muted">— 항로가 열리면 두 해마다 두 배(2 → 32함대). 실어 오는 물건은 받는 쪽에서 싸지고, 나는 쪽에서는 비싸진다</small>' +
      L.map(function (x) {
        return '<div class="era-row"><span class="era-lbl">' + x.name + '</span> ' + dots(x.n) + ' <b>' + x.n + '함대</b> <small class="muted">' + x.nat + ' · ' + x.from + ' ↔ ' + x.to + ' · 열린 지 ' + x.years + '년' + (x.next != null ? ' · ' + U.howLong(x.next) + ' 뒤 ' + Math.min(k.max, x.n * 2) + '함대' : ' · 다 늘었다') + '</small><br>' +
          '<small>' + x.home + '에서 싸짐 ▼ ' + gl(x.goods) + ' &nbsp;·&nbsp; ' + x.far + '에서 싸짐 ▼ ' + gl(x.back) + ', 비싸짐 ▲ ' + gl(x.goods) + '</small></div>';
      }).join('') + '</div>';
  };
})(window.G = window.G || {});
