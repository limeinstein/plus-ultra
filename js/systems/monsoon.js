/* 계절풍 안내 (G.Monsoon) — 인도양·남중국해는 반년마다 바람이 뒤바뀐다 (바람 모델은 R.wind, 바다 정의는 G.MONSOON).
   · 지금 부는 계절풍과 바뀌는 날
   · 두 지점을 잇는 뱃길이 지금 순풍인지 맞바람인지, 기다리면 언제 순풍이 되는지
   · 항구·술집·출항 준비·원정 계획·바다 화면에서 이 안내를 보여 준다 */
(function (G) {
  'use strict';
  var U = G.U;
  var M = {};
  G.Monsoon = M;
  function S() { return G.Game.state; }
  function inBox(b, lon, lat) { lon = G.Geo ? G.Geo.wrapLon(lon) : lon; return lon > b[0] && lon < b[1] && lat > b[2] && lat < b[3]; }

  /** 이 자리의 계절풍 바다 (없으면 null) */
  M.at = function (lon, lat) { var z = (G.MONSOON || []).filter(function (x) { return inBox(x.box, lon, lat); })[0]; return z || null; };
  /** 이 항구가 계절풍 바다의 연안인가 (안내를 들려줄 곳) */
  M.rim = function (c) {
    if (!c || !c.port) return null;
    var d = c.dock || [c.lat, c.lon], lon = d[1], lat = d[0];
    return M.at(lon, lat) || (G.MONSOON || []).filter(function (x) { return inBox(x.rim, lon, lat); })[0] || null;
  };
  /** 'sw'(남서 계절풍, 여름) | 'ne'(북동 계절풍, 겨울) */
  M.phase = function (z, date) {
    z = z || (G.MONSOON || [])[0]; date = date || S().date;
    var doy = U.dayOfYear(date);
    return doy > z.sw[0] && doy < z.sw[1] ? 'sw' : 'ne';
  };
  M.NAME = { sw: '남서 계절풍', ne: '북동 계절풍' };
  /** 계절풍이 불어 가는 방향 (라디안, 0 = 동쪽, 반시계) — 남서풍은 북동쪽으로, 북동풍은 남서쪽으로 분다 */
  M.toward = function (ph) { return ph === 'sw' ? Math.PI / 4 : Math.PI * 5 / 4; };
  /** 날수(1월 1일부터)를 그해의 날짜로 */
  function doyDate(y, doy) { return U.addDays({ y: y, m: 1, d: 1 }, doy - 1); }
  function mdText(dt) { return dt.m + '월 ' + dt.d + '일'; }
  /** 다음에 바뀌는 날: {phase: 바뀐 뒤의 계절풍, date, days} */
  M.next = function (z, date) {
    z = z || (G.MONSOON || [])[0]; date = date || S().date;
    var doy = U.dayOfYear(date), ph = M.phase(z, date), tgtDoy, y = date.y;
    if (ph === 'sw') tgtDoy = z.sw[1];
    else { tgtDoy = z.sw[0] + 1; if (doy >= z.sw[1]) y++; }
    var dt = doyDate(y, tgtDoy);
    return { phase: ph === 'sw' ? 'ne' : 'sw', date: dt, days: Math.max(1, U.dayIndex(dt) - U.dayIndex(date)) };
  };
  /** 뱃길(방위 ang)과 계절풍의 어울림: '순풍' | '옆바람' | '맞바람' */
  M.fit = function (ang, ph) {
    var rel = Math.abs(U.angDiff(ang, M.toward(ph))) * 180 / Math.PI;
    return rel < 60 ? '순풍' : rel < 115 ? '옆바람' : '맞바람';
  };
  /** 두 지점을 잇는 뱃길이 계절풍 바다를 지나면 안내를 돌려준다 (없으면 null)
      from, to: [경도, 위도] */
  M.advice = function (from, to, date) {
    if (!from || !to) return null;
    date = date || S().date;
    // 곧은 뱃길을 11곳으로 나눠 보고, 계절풍 바다를 40% 넘게 지날 때만 안내한다
    var dl = G.Geo.wrapLon(to[0] - from[0]), dt = to[1] - from[1], cnt = {}, z = null, N = 11;
    for (var i = 0; i < N; i++) {
      var t = i / (N - 1), zz = M.at(from[0] + dl * t, from[1] + dt * t);
      if (zz) { cnt[zz.id] = (cnt[zz.id] || 0) + 1; if (!z || cnt[zz.id] > cnt[z.id]) z = zz; }
    }
    if (!z || cnt[z.id] * 5 < N * 2) return null;
    var ang = Math.atan2(dt, dl);
    var ph = M.phase(z, date), nx = M.next(z, date);
    var fit = M.fit(ang, ph), fitNext = M.fit(ang, nx.phase);
    var dir = U.dirName(ang);
    var text = z.name + ' — 지금은 ' + M.NAME[ph] + '(' + mdText(nx.date) + ' 무렵까지). ' + dir + '쪽으로 가는 이 뱃길은 ' + fit + '입니다.';
    if (fit === '맞바람' && fitNext !== '맞바람') text += ' ' + mdText(nx.date) + ' 무렵(' + nx.days + '일 뒤) ' + M.NAME[nx.phase] + '으로 바뀌면 ' + fitNext + '이 됩니다 — 항구에서 기다리는 것도 방법입니다.';
    else if (fit === '순풍') text += ' 바람이 바뀌기 전에 건너십시오.';
    return { zone: z, phase: ph, fit: fit, next: nx, fitNext: fitNext, dir: dir, text: text, head: fit === '맞바람' };
  };
  /** 항구에서 들려줄 한 줄 (계절풍 바다 연안이 아니면 null) */
  M.portNote = function (c, date) {
    var z = M.rim(c); if (!z) return null;
    date = date || S().date;
    var ph = M.phase(z, date), nx = M.next(z, date);
    var good = U.dirName(M.toward(ph)), bad = U.dirName(M.toward(ph) + Math.PI);
    return { zone: z, phase: ph, next: nx,
      short: M.NAME[ph] + ' (' + mdText(nx.date) + ' 무렵까지) — ' + good + '쪽 순풍 · ' + bad + '쪽 맞바람',
      text: z.name + '에는 지금 ' + M.NAME[ph] + '이 분다. ' + good + '쪽으로 가는 배에는 순풍, ' + bad + '쪽으로 가는 배에는 맞바람이다 — ' + z.tip[ph] + '. ' +
        mdText(nx.date) + ' 무렵(' + nx.days + '일 뒤)부터는 ' + M.NAME[nx.phase] + '이 불어 ' + z.tip[nx.phase] + '.' };
  };
  /** 하루가 지날 때 (world.js): 계절풍 바다에 있거나 그 연안 항구에 있으면 바람이 바뀐 날 알린다 */
  M.daily = function () {
    var s = S(), l = s.loc, out = [];
    var z = l.mode === 'city' ? M.rim(G.CITY_DATA[l.city]) : M.at(l.lon, l.lat);
    if (!z) return out;
    var y = U.addDays(s.date, -1);
    if (M.phase(z, y) !== M.phase(z, s.date)) {
      var ph = M.phase(z, s.date);
      out.push({ icon: 'wind', text: z.name + '의 바람이 바뀌었다 — ' + M.NAME[ph] + '이 불기 시작했다. ' + z.tip[ph] + '.' });
    }
    return out;
  };
})(window.G = window.G || {});
