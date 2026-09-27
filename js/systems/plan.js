/* 원정 계획 (G.Plan): 목표까지 가는 길·탐사·돌아오는 길·여유를 어림하고, 보급·자금·기한과 견준다.
   대항해시대 3 역기획서의 계획식을 따른다 — 원작 공식이 아니라 플레이어의 계획을 돕는 어림셈이다.
     예상 가용 기간 = min(식량 기준, 식수 기준, 현금 기준)
     필요 원정 기간 = 왕로 + 탐사 + 귀로 + 비상 여유(20%)
     계획 여유 = 예상 가용 기간 − 필요 원정 기간 */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var P = {};
  G.Plan = P;
  function S() { return G.Game.state; }

  /** 바다에서 닿아야 할 지점과, 그곳에서 뭍으로 걸어야 할 거리(°) */
  function goalPoint(d) {
    if (!d || d.how === 'trade' || d.id === 'circum') return null;
    if (d.how === 'city') { var c = G.CITY_DATA[d.city], dk = c.dock || [c.lat, c.lon]; return { sea: [dk[1], dk[0]], land: c.port ? 0 : G.Geo.dist(dk[1], dk[0], c.lon, c.lat) }; }
    if (d.how === 'land') { var ns = G.Nav.nearestSea(d.lon, d.lat, 16); if (!ns) return null; return { sea: ns, land: G.Geo.dist(ns[0], ns[1], d.lon, d.lat) }; }
    return { sea: [d.lon, d.lat], land: 0 };
  }
  P.goalPoint = goalPoint;
  function pathLen(p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(G.Geo.wrapLon(p[i][0] - p[i - 1][0]), p[i][1] - p[i - 1][1]); return L; }
  /** 바람을 고르게 받는다고 칠 때의 평균 선속 (°/일) */
  P.avgSpeed = function () {
    var f = S().fleet, v = 0, n = 8;
    for (var i = 0; i < n; i++) v += R.fleetSpeed(0, { dir: i / n * Math.PI * 2, spd: 0.55 });
    // 선원은 출항 전에 채운다고 보고 계산한다 (모자란 선원 탓에 느려진 몫은 빼고)
    var cm = R.crewMin(), crewF = f.crew >= cm ? 1 : Math.max(0.25, f.crew / Math.max(1, cm));
    return Math.max(0.3, v / n / crewF);
  };
  function daysUntil(n) {
    var s = S(), due = { y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 };
    return U.dayIndex(due) - U.dayIndex(s.date);
  }
  /** from: 출발 지점 [경도, 위도] · d: 목표 발견물 · home: 보고할 도시 */
  P.expedition = function (from, d, home) {
    var s = S(), gp = goalPoint(d);
    if (!gp || !from || !G.Nav.ready()) return null;
    var p1 = G.Nav.path(from[0], from[1], gp.sea[0], gp.sea[1]);
    if (!p1) return null;
    var hk = home ? (home.dock ? [home.dock[1], home.dock[0]] : [home.lon, home.lat]) : from;
    var p2 = G.Nav.path(gp.sea[0], gp.sea[1], hk[0], hk[1]) || p1;
    var v = P.avgSpeed();
    var out = Math.max(1, Math.ceil(pathLen(p1) / v)), back = Math.max(1, Math.ceil(pathLen(p2) / v));
    var explore = d.how === 'land' ? Math.ceil(gp.land * 2 / 0.3) + 3 : d.how === 'city' ? (gp.land ? Math.ceil(gp.land * 2 / 0.3) + 1 : 1) : 2;
    var spare = Math.ceil((out + explore + back) * 0.2);
    var need = out + explore + back + spare;
    var wage = 0; s.mates.forEach(function (m) { var md = G.MATE[m.id]; if (md) wage += md.wage; });
    var cashDays = wage > 0 ? Math.floor(s.player.gold / (wage / 30)) : null;
    var supply = s.fleet.ships.length ? Math.min(R.daysOfFood(), R.daysOfWater()) : 0;
    var dueLeft = s.contract && s.contract.disc === d.id ? daysUntil(s.contract.due) : null;
    return { from: from, goal: gp.sea, d: d, out: out, explore: explore, back: back, spare: spare, need: need, oneWay: out + explore, oneWaySafe: Math.ceil((out + explore) * 1.2), walk: d.how === 'land' ? Math.ceil(gp.land / 0.3) : 0,
      supply: supply, cashDays: cashDays, dueLeft: dueLeft, home: home || null, speed: v };
  };
  /** 지금 맺은 계약의 원정 계획 (도시에 있으면 그 항구에서, 바다면 지금 자리에서) */
  P.forContract = function () {
    var s = S(), k = s.contract; if (!k || k.circ) return null;
    var d = G.DISC[k.disc]; if (!d || G.Disc.foundByMe(d.id)) return null;
    var sp = G.SPONSOR[k.sponsor], home = sp ? G.CITY_DATA[sp.city] : null;
    var from;
    if (s.loc.mode === 'city' && s.loc.city != null) { var c = G.CITY_DATA[s.loc.city], dk = c.dock || [c.lat, c.lon]; from = [dk[1], dk[0]]; }
    else from = [s.loc.lon, s.loc.lat];
    return P.expedition(from, d, home);
  };
  /** 가진 라임 절임 수 */
  P.limes = function () { return S().player.items.filter(function (it) { return it.id === 'lime'; }).reduce(function (n, it) { return n + (it.n || 1); }, 0); };
  /** 화면에 넣을 요약 (HTML) */
  P.html = function (pl, maxLoad) {
    if (!pl) return '';
    var d = pl.d, warn = [];
    var h = '<div class="plan"><div class="plan-h">원정 계획 — 「' + U.esc(d.name) + '」' + (pl.home ? ' <small>(보고: ' + pl.home.name + ')</small>' : '') + '</div>' +
      '<div class="plan-row"><span>가는 길 <b>' + pl.out + '</b>일</span><span>탐사 <b>' + pl.explore + '</b>일</span><span>돌아오는 길 <b>' + pl.back + '</b>일</span><span>여유 <b>' + pl.spare + '</b>일</span><span class="plan-sum">합계 <b>' + pl.need + '</b>일</span></div>';
    if (maxLoad != null && maxLoad < pl.oneWay) warn.push('한 번에 실을 수 있는 보급(최대 ' + maxLoad + '일분)으로는 목표에 닿기도 빠듯합니다. 도중 항구에서 보급하십시오.');
    else if (maxLoad != null && maxLoad < pl.need) warn.push('왕복 ' + pl.need + '일분은 한 번에 못 싣습니다(최대 ' + maxLoad + '일분). 돌아오는 길에 보급할 항구를 정해 두십시오.');
    if (pl.dueLeft != null) warn.push(pl.dueLeft < pl.need ? '<span class="warn-text">계약 기한까지 ' + pl.dueLeft + '일 — 빠듯합니다!</span>' : '계약 기한까지 ' + pl.dueLeft + '일 (여유 ' + (pl.dueLeft - pl.need) + '일)');
    var mo = G.Monsoon && pl.from && pl.goal ? G.Monsoon.advice(pl.from, pl.goal) : null;
    if (mo) warn.push(mo.head ? '<span class="warn-text">계절풍: ' + U.esc(mo.text) + '</span>' : '계절풍: ' + U.esc(mo.text));
    var onset = G.Scenes.sea && G.Scenes.sea.scurvyOnset ? G.Scenes.sea.scurvyOnset() : 40;
    if (pl.out > onset) warn.push('<span class="warn-text">괴혈병: 목표까지 한 번에 가면 출항 ' + onset + '일째 무렵부터 번집니다</span> — 라임 절임(지금 ' + P.limes() + '통)을 챙기거나 도중 항구에 들르십시오.');
    if (pl.cashDays != null && pl.cashDays < pl.need) warn.push('<span class="warn-text">동료 급료로 보면 소지금이 약 ' + pl.cashDays + '일분뿐입니다.</span>');
    // 파티 점검: 읽기·대화·탐색 중 무엇이 모자란가
    var party = [];
    if (d.lang != null && G.LANGS[d.lang] && R.lang(d.lang) === 0) party.push('그 고장 말(' + G.LANGS[d.lang] + ')을 아는 사람이 없어 현지 사람과 이야기하기 어렵습니다 — 통역을 두면 좋습니다');
    if (d.how === 'land') {
      var sk = d.cat === 'ruin' || d.cat === 'treasure' ? 'hist' : d.cat === 'creature' || d.cat === 'nature' ? 'sci' : null;
      if (sk && !R.skill(sk)) party.push(G.SKILL_BY_ID[sk].name + U.jx(G.SKILL_BY_ID[sk].name, '을/를') + ' 아는 사람이 있으면 더 넓게 살필 수 있습니다');
      if (!R.skill('survey')) party.push('측량을 아는 사람이 없어 정찰대가 멀리 보지 못합니다');
    }
    if (party.length) warn.push('파티: ' + party.join(' · '));
    return h + (warn.length ? '<div class="plan-note">' + warn.join('<br>') + '</div>' : '') + '<div class="plan-foot">바람을 고르게 받는다고 친 어림셈 (평균 ' + pl.speed.toFixed(2) + '°/일)</div></div>';
  };
})(window.G = window.G || {});
