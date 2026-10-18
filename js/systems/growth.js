/* 능력치 성장 (G.Growth) — 조정값: G.BALANCE.growth (js/data/base.js). 2026-10-18
   ■ 여섯 갈래의 경험: 설득 · 거래 · 전투 · 일기토 · 미식 · 사교. 일을 해낼 때마다 그 갈래의 경험이 쌓이고,
     갈래마다 정해진 몫(kinds[].to)으로 능력치(체력·지력·무력·매력)에 나뉘어 들어간다.
   ■ 능력이 높을수록 1 오르는 데 경험이 훨씬 많이 든다 (knee 위로 지수로 늘고, 95부터 또 두 배, 99→100은 네 배 더).
     한 능력에 하루 dayCap · 한 해 yearCap까지만 쌓인다 — 같은 일을 되풀이해도 몰아서 키울 수 없다. 80세 전에 경험만으로 100이 되는 일은 사실상 없다.
   ■ 사건(G.Growth.event): 작위·혼인·세계일주·표류기·구출 같은 큰일은 능력을 곧바로 1 올린다 (eventCap 이상이면 그만큼의 경험으로).
   ■ 저장: s.player.xp = { k: {갈래: 쌓인 경험}, p: {능력: 다음 1까지 모은 경험}, d: {n: 날번호, 능력: 그날 쌓은 것}, y: {n: 해, 능력: 그해 쌓은 것}, food: {음식: 1} }
     없으면 아무것도 쌓이지 않은 것 (옛 저장 파일 그대로 열린다). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var GR = {};
  G.Growth = GR;
  var STATS = ['str', 'int', 'mar', 'cha'];
  function S() { return G.Game && G.Game.state; }
  function K() {
    return (G.BALANCE && G.BALANCE.growth) || { base: 120, knee: 60, curve: 10, top: 95, topK: 2, lastK: 4, dayCap: 45, yearCap: 900, eventCap: 85, eventPts: 160, kinds: {}, pts: {} };
  }
  GR.K = K;
  function statName(k) { var st = (G.STATS || []).filter(function (x) { return x.id === k; })[0]; return st ? st.name : k; }
  GR.statName = statName;
  function xp() {
    var s = S(); if (!s || !s.player) return null;
    var x = s.player.xp || (s.player.xp = {});
    x.k = x.k || {}; x.p = x.p || {}; x.d = x.d || {}; x.y = x.y || {};
    return x;
  }
  GR.state = xp;
  /** 능력 v에서 v+1이 되는 데 드는 경험 */
  GR.cost = function (v) {
    var b = K(), c = b.base * (v < b.knee ? 1 : Math.exp((v - b.knee) / b.curve));
    if (v >= b.top) c *= b.topK || 1;
    if (v >= 99) c *= b.lastK || 1;
    return Math.round(c);
  };
  /** 오늘·올해 그 능력에 더 쌓을 수 있는 경험 */
  function room(x, k) {
    var s = S(), b = K(), yr = s.date.y;
    if (x.d.n !== s.day) x.d = { n: s.day };
    if (x.y.n !== yr) x.y = { n: yr };
    return Math.max(0, Math.min(b.dayCap - (x.d[k] || 0), b.yearCap - (x.y[k] || 0)));
  }
  /** 능력 k에 경험 n을 쌓는다 → 오른 만큼 [{k, from, to}] (opts.noCap: 하루·한 해 한도를 보지 않는다 — 사건) */
  function addTo(k, n, why, opts) {
    var s = S(), x = xp(); if (!x || !(n > 0)) return null;
    opts = opts || {};
    var take = opts.noCap ? n : Math.min(n, room(x, k));
    if (take <= 0) return null;
    if (!opts.noCap) { x.d[k] = (x.d[k] || 0) + take; x.y[k] = (x.y[k] || 0) + take; }
    x.p[k] = (x.p[k] || 0) + take;
    var st = s.player.st, v0 = st[k], v = v0;
    while (v < 100 && x.p[k] >= GR.cost(v)) { x.p[k] -= GR.cost(v); v++; }
    if (v >= 100) x.p[k] = 0;
    if (v === v0) return null;
    st[k] = v;
    return { k: k, from: v0, to: v };
  }
  function announce(ups, why, icon) {
    ups.forEach(function (u) {
      var t = statName(u.k) + ' ' + u.from + ' → ' + u.to + (why ? ' — ' + why : '');
      UI.toast(t, icon || 'star', 5200);
      if (G.State && G.State.log) G.State.log(statName(u.k) + U.jx(statName(u.k), '이/가') + ' ' + u.to + U.jx(String(u.to), '으로/로') + ' 올랐다' + (why ? ' (' + why + ')' : '') + '.');
    });
    if (ups.length && G.Game && G.Game.refreshHud) G.Game.refreshHud();
  }
  /** 경험을 얻는다: kind(persuade·trade·battle·duel·food·social) · n(경험) · why(알림에 붙는 말). 오른 능력 목록을 돌려준다 */
  GR.gain = function (kind, n, why) {
    var s = S(), b = K(), kd = b.kinds[kind]; if (!s || !s.player || !s.player.st || !kd || !(n > 0)) return [];
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return [];
    var x = xp(); x.k[kind] = (x.k[kind] || 0) + Math.round(n);
    var ups = [];
    Object.keys(kd.to).forEach(function (k) {
      var part = n * kd.to[k];
      // 소수 몫은 그만큼의 확률로 1 (작은 경험도 버려지지 않게)
      var whole = Math.floor(part) + (U.chance(part % 1) ? 1 : 0);
      var u = addTo(k, whole, why); if (u) ups.push(u);
    });
    announce(ups, why || (kd.name + ' 경험'), kd.icon);
    return ups;
  };
  /** 한 능력에 곧바로 경험을 쌓는다 (갈래 없이 — 독서 등). 하루·한 해 한도는 지킨다 */
  GR.add = function (k, n, why) {
    if (STATS.indexOf(k) < 0 || (G.Tutorial && G.Tutorial.active && G.Tutorial.active())) return null;
    var u = addTo(k, Math.round(n), why); if (u) announce([u], why, 'book');
    return u;
  };
  /** 사건으로 능력이 오른다: 능력이 eventCap 아래면 곧바로 +n, 그 위면 n × eventPts의 경험으로 (하루·한 해 한도는 보지 않는다) */
  GR.event = function (k, n, why) {
    var s = S(), b = K(); if (!s || !s.player || !s.player.st || STATS.indexOf(k) < 0) return null;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return null;
    n = n || 1;
    var st = s.player.st, v0 = st[k], up;
    if (v0 < b.eventCap) { st[k] = Math.min(b.eventCap, v0 + n); up = { k: k, from: v0, to: st[k] }; }
    else up = addTo(k, n * b.eventPts, why, { noCap: true });
    if (up) announce([up], why, 'star');
    else UI.toast(statName(k) + ' — ' + (why || '') + ' (경험이 쌓였다)', 'star', 4200);
    return up;
  };
  /** 한 번만 일어나는 사건 (같은 id는 두 번 오르지 않는다) */
  GR.once = function (id, k, n, why) {
    var x = xp(); if (!x) return null;
    x.once = x.once || {};
    if (x.once[id]) return null;
    x.once[id] = 1;
    return GR.event(k, n, why);
  };

  // ---------------------------------------------------------------- 갈래별로 부르기 쉽게
  function P() { return K().pts || {}; }
  /** 설득·교섭: ok = 해냈다 */
  GR.persuade = function (ok, why) { var p = P(); return GR.gain('persuade', ok ? (p.persuadeOk || 14) : (p.persuadeFail || 4), why || (ok ? '설득 경험' : '설득 경험 (실패에서도 배운다)')); };
  /** 사들임: 치른 금화 */
  GR.buy = function (paid) { var b = P().buy || [1, 6, 4000]; return GR.gain('trade', U.clamp(Math.round(b[0] + paid / b[2]), b[0], b[1]), '거래 경험'); };
  /** 팔기: 이익(밑지면 음수) */
  GR.sell = function (profit) { var b = P().sell || [2, 18, 1500]; return GR.gain('trade', profit > 0 ? U.clamp(Math.round(b[0] + profit / b[2]), b[0], b[1]) : (P().sellLoss || 1), '거래 경험'); };
  GR.haggle = function () { return GR.gain('trade', P().haggle || 6, '거래 경험 (값 깎기)'); };
  /** 해전: res = 'win' | 'lose' | 그 밖(물러남) · n = 적 배 수 */
  GR.battle = function (res, n) {
    var p = P(), v = res === 'win' ? (p.battleWin || 30) + (p.battlePerShip || 6) * Math.max(0, (n || 1) - 1) : res === 'lose' ? (p.battleLose || 10) : (p.battleFlee || 3);
    return GR.gain('battle', v, '전투 경험');
  };
  GR.land = function (res) { var p = P(); return GR.gain('battle', res === 'win' ? (p.landWin || 18) : res === 'lose' ? (p.landLose || 6) : 2, '전투 경험 (육상전)'); };
  GR.duel = function (res) { var p = P(); return GR.gain('duel', res === 'win' ? (p.duelWin || 26) : res === 'lose' ? (p.duelLose || 9) : (p.duelFlee || 2), '일기토 경험'); };
  /** 식당: tier(0~3) · id(음식 — 처음 먹는 것은 두 배) */
  GR.meal = function (tier, id) {
    var x = xp(); if (!x) return [];
    x.food = x.food || {};
    var first = id && !x.food[id]; if (id) x.food[id] = 1;
    var m = P().meal || [6, 10, 16, 22], v = m[U.clamp(tier || 0, 0, m.length - 1)] * (first ? (P().mealNew || 2) : 1);
    return GR.gain('food', v, first ? '미식 경험 (처음 맛본 음식)' : '미식 경험');
  };
  /** 사교 명성을 얻을 때 (js/systems/fame.js) */
  GR.social = function (fame) { var b = P().social || [1, 24]; if (!(fame > 0)) return []; return GR.gain('social', U.clamp(Math.round(Math.sqrt(fame) * 2), b[0], b[1]), '사교 경험'); };

  // ---------------------------------------------------------------- 수첩 (제독)
  GR.html = function () {
    var s = S(), x = xp(), b = K(); if (!x) return '';
    var kinds = Object.keys(b.kinds).map(function (k) {
      var kd = b.kinds[k], to = Object.keys(kd.to).map(function (t) { return statName(t); }).join('·');
      return '<div class="gr-kind" title="' + U.esc(kd.name + ' → ' + to) + '">' + G.icon(kd.icon) + '<b>' + kd.name + '</b><span>' + U.num(x.k[k] || 0) + '</span><small>' + to + '</small></div>';
    }).join('');
    var bars = STATS.map(function (k) {
      var v = s.player.st[k], need = v >= 100 ? 0 : GR.cost(v), have = x.p[k] || 0, pct = need ? Math.min(100, Math.round(have / need * 100)) : 100;
      var yr = x.y.n === s.date.y ? (x.y[k] || 0) : 0;
      return '<div class="gr-bar"><span>' + statName(k) + ' <b>' + v + '</b></span><div class="gr-track"><i style="width:' + pct + '%"></i></div>' +
        '<small>' + (need ? U.num(have) + ' / ' + U.num(need) : '최고') + ' · 올해 ' + U.num(yr) + '/' + U.num(b.yearCap) + '</small></div>';
    }).join('');
    return '<div class="sep"></div><h4 style="margin:0 0 6px">경험과 성장 <small class="muted">— 일을 해낼수록 능력치가 조금씩 오른다 (높을수록 더디다)</small></h4>' +
      '<div class="gr-kinds">' + kinds + '</div><div class="gr-bars">' + bars + '</div>';
  };
})(window.G = window.G || {});
