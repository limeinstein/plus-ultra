/* 개척 단계 판정 (G.Frontier): 어떤 발견물의 단서를 지금 들을 수 있는지, 어떤 항해사가 술집에 나타나는지,
   새로 열린 단계와 새로 나타난 항해사를 소식으로 알린다. 단계 정의는 js/data/frontiers.js. */
(function (G) {
  'use strict';
  var U = G.U;
  var F = {};
  G.Frontier = F;
  function S() { return G.Game.state; }
  var START = 1480;

  /** 알려진 해: 내가 찾았으면 찾은 해, 경쟁자가 발표했으면 발표한 해. 아직이면 null */
  function knownYear(id) {
    var st = S().disc[id];
    if (!st || !(st.me || st.rival)) return null;
    return st.found ? Math.floor(st.found / 10000) : S().date.y;
  }
  F.known = function (id) { return knownYear(id) != null; };

  // ---------------------------------------------------------------- 단계 상태 (하루·발견 수가 바뀔 때만 다시 센다)
  var cache = null, cacheKey = '';
  function key() { var s = S(); return s.day + ':' + s.stats.found + ':' + Object.keys(s.disc).length; }
  function compute() {
    var s = S(), y = s.date.y, out = {};
    G.FRONTIERS.forEach(function (f) {
      var o = { f: f, lv: 0, found: 0, lightFound: 0, since: null, t2: false, t3: false, first: null };
      f.ids.forEach(function (id) {
        var st = s.disc[id];
        if (st && st.me) {
          o.found++;
          if (G.DISC_FRONT[id].t === 0) o.lightFound++;
          var fy = st.found ? Math.floor(st.found / 10000) : y;
          if (o.first == null || fy < o.first) o.first = fy;
        }
      });
      // 앞 단계가 알려진 해
      var preY = START;
      if (f.pre) f.pre.forEach(function (id) { var k = knownYear(id); preY = (k == null || preY == null) ? null : Math.max(preY, k); });
      if (f.preAny) { var best = null; f.preAny.forEach(function (id) { var k = knownYear(id); if (k != null && (best == null || k < best)) best = k; }); preY = preY == null || best == null ? null : Math.max(preY, best); }
      var gy = f.gate ? knownYear(f.gate) : null;
      if (gy != null) { o.lv = 3; o.since = gy; }                       // 관문이 알려졌다 (내가 먼저 닿았어도)
      else if (!f.gate && (preY != null || o.found > 0)) {             // 관문 없는 단계: 앞 단계가 알려지거나 직접 가 보았으면
        o.lv = 3; o.since = preY != null ? preY : o.first;
        if (o.first != null && o.first < o.since) o.since = o.first;
      } else if (preY != null) {
        o.lv = 1;
        var d = G.DISC[f.gate], ry = d && d.rival ? d.rival[0] + (s.flags['delay_' + d.id] || 0) : null;
        if (o.lightFound >= (f.light || 0) || (ry != null && y >= ry - 4)) o.lv = 2;
      }
      if (o.lv === 3) {
        var yrs = y - o.since;
        o.t2 = o.found >= G.frontierNeed(f, 2) || yrs >= G.TIER_NEED[2].years;
        o.t3 = o.found >= G.frontierNeed(f, 3) || yrs >= G.TIER_NEED[3].years;
      }
      out[f.id] = o;
    });
    return out;
  }
  F.all = function () { var k = key(); if (!cache || cacheKey !== k) { cache = compute(); cacheKey = k; } return cache; };
  F.state = function (fid) { return F.all()[fid]; };
  F.invalidate = function () { cache = null; };
  F.of = function (d) { var m = d && G.DISC_FRONT[d.id]; return m ? G.FRONTIER[m.f] : null; };

  /** 이 발견물의 단서를 지금 들을 수 있는가 */
  F.available = function (d) {
    if (!d) return false;
    if (d.built && S().date.y < d.built) return false;                                            // 아직 세워지지 않은 건물
    if (d.need && !d.need.every(function (id) { return G.Disc.foundByMe(id); })) return false;   // 발견의 연쇄
    var m = G.DISC_FRONT[d.id]; if (!m) return true;
    var o = F.state(m.f);
    if (m.t === 0) return o.lv >= 1;
    if (m.t === 'G') return o.lv >= 2;
    if (o.lv < 3) return false;
    if (m.t === 1) return true;
    return m.t === 2 ? o.t2 : o.t3;
  };
  /** 지금 온 세상이 떠드는 이야기인가 (맛보기, 찾을 차례가 된 관문) — 소문에 더 자주 오른다 */
  F.hot = function (d) {
    var m = d && G.DISC_FRONT[d.id]; if (!m) return false;
    var o = F.state(m.f);
    return (m.t === 0 && o.lv >= 1) || (m.t === 'G' && o.lv === 2);
  };
  /** 단서를 얻을 수 있는가: 들을 수 있는 것, 또는 그 단계에 소문이 돌 때 경쟁자 본인에게서 듣는 관문 이야기 */
  F.canHint = function (d, src) {
    if (d && d.built && S().date.y < d.built) return false;   // 아직 없는 건물은 책·유물로도 단서가 나오지 않는다
    if (F.available(d)) return true;
    var sr = String(src || '');
    if (sr.indexOf('contract') === 0 || sr.indexOf('lead') === 0 || sr.indexOf('relic') === 0) return true;
    var m = G.DISC_FRONT[d.id];
    return sr === 'rival' && !!m && F.state(m.f).lv >= 1;
  };
  /** 이 도시(리스본·세비야)에서 지금 들을 수 있는 큰 항로 단서 — 앞선 발견이 알려졌고, 아직 모르고, 경쟁자도 발표하지 않은 것 */
  F.leads = function (cityId) {
    var s = S();
    if (!G.GEO_LEADS || (G.LEAD_CITIES || []).indexOf(cityId) < 0) return [];
    var road = (G.LEAD_ROAD || {})[cityId];
    return G.GEO_LEADS.filter(function (l) {
      var d = G.DISC[l.disc], st = s.disc[l.disc];
      if (!d || s.hints[l.disc] || (st && (st.me || st.rival))) return false;
      return l.after.every(F.known);
    }).sort(function (a, b) {
      // 이 도시의 길이 먼저, 그다음 막 열린(앞선 발견이 많은) 이야기가 먼저
      return ((b.road === road) - (a.road === road)) || (b.after.length - a.after.length);
    });
  };
  /** 단서 하나를 듣는다: 단서를 적고 들려줄 말을 돌려준다 (없으면 null) */
  F.takeLead = function (cityId, who) {
    var l = F.leads(cityId)[0]; if (!l) return null;
    var d = G.DISC[l.disc];
    if (!G.Disc.addHint(l.disc, 'lead:' + (who || 'tavern') + ':' + cityId)) return null;
    return { disc: d, text: l.line + ' ' + d.hint };
  };
  /** 항해사가 술집에 나타날 수 있는가 (해·개척 단계) */
  F.mateReady = function (m, year) {
    var y = year || S().date.y;
    if (y < m.y[0] || y > m.y[1]) return false;
    return !m.after || m.after.every(F.known);
  };

  // ---------------------------------------------------------------- 소식
  function namesOf(ids) { return ids.map(function (id) { return G.DISC[id].name; }); }
  function jx(w, p) { return U.jx(w, p); }
  function msgFor(f, o, p) {
    var nm = '〈' + f.name + '〉';
    if (o.lv > p.lv) {
      if (o.lv >= 3) {
        var how = f.gate ? (G.Disc.foundByMe(f.gate) ? '' : ' (' + (S().disc[f.gate].rival || '누군가') + '의 발표로)') : '';
        return { icon: 'globe', text: nm + U.jx(f.name, '으로/로') + ' 가는 길이 열렸다' + how + '! 이제 그 땅의 발견물 이야기가 도서관과 술집에 돌기 시작한다.' + (o.t2 ? ' 깊은 곳의 이야기까지 들려온다.' : '') };
      }
      if (o.lv === 2) return { icon: 'map', text: '「' + G.DISC[f.gate].name + '」의 단서를 모을 수 있게 되었다. ' + nm + U.jx(f.name, '으로/로') + ' 가는 길을 찾아 보자.' };
      var tease = f.tease.length ? ' 먼저 ' + namesOf(f.tease).join('·') + ' 같은 가벼운 것부터 알아보자.' : '';
      return { icon: 'scroll', text: nm + '에 관한 소문이 돌기 시작했다.' + tease };
    }
    if (o.t3 && !p.t3) return { icon: 'star', text: nm + '의 가장 깊은 곳, 전설 같은 발견물의 소문까지 들려온다.' };
    if (o.t2 && !p.t2) return { icon: 'scroll', text: nm + ' 안쪽 깊은 곳의 이야기도 들려오기 시작했다.' };
    return null;
  }
  function snapshot(all) {
    var snap = {};
    for (var id in all) snap[id] = { lv: all[id].lv, t2: all[id].t2, t3: all[id].t3 };
    return snap;
  }
  function matesNow() {
    var s = S(), y = s.date.y, out = {};
    G.MATES.forEach(function (m) { if (F.mateReady(m, y)) out[m.id] = 1; });
    return out;
  }
  /** 하루에 한 번(또는 발견 직후): 새로 열린 단계와 새로 나타난 항해사를 소식으로 돌려준다 */
  F.tick = function () {
    var s = S(), all = F.all(), out = [];
    if (!s.front) { s.front = { fr: snapshot(all), mates: matesNow() }; return out; }   // 처음에는 조용히 기억만
    var prev = s.front.fr;
    G.FRONTIERS.forEach(function (f) {
      var o = all[f.id], p = prev[f.id] || { lv: 0, t2: false, t3: false };
      var m = msgFor(f, o, p);
      if (m) { m.history = true; m.frontier = f.id; out.push(m); }
    });
    s.front.fr = snapshot(all);
    var now = matesNow(), was = s.front.mates || {};
    G.MATES.forEach(function (m) {
      if (m.wd) return;                   // 철새는 해마다 한데 모아 알린다 (wanderers.js)
      if (!now[m.id] || was[m.id]) return;
      if (s.mates.some(function (x) { return x.id === m.id; }) || s.flags['gone_' + m.id]) return;
      var at = G.MateMove && G.MateMove.where(m.id);
      var where = at ? at.name : m.reg.map(function (r) { return G.REGIONS[r].name || G.REGIONS[r]; }).join('·');
      out.push({ icon: 'people', history: true, text: '소문: 「' + m.name + '」' + jx(m.name, '이/가') + ' ' + where + '의 술집에 나타났다고 한다' + (at ? '(' + G.MateMove.zoneNames(m.id) + ' 안을 옮겨 다닌다)' : '') + '. — ' + m.desc });
    });
    s.front.mates = now;
    return out;
  };

  /** 수첩에 보일 요약: 단계마다 {이름, 상태, 찾은 수, 전체, 다음 조건} */
  var LV_NAME = ['미지', '소문', '항로 탐색', '개척'];
  F.status = function (fid) {
    var o = F.state(fid), f = o.f;
    var label = o.lv < 3 ? LV_NAME[o.lv] : o.t3 ? '끝까지' : o.t2 ? '깊은 곳' : '개척';
    var next = '';
    if (o.lv === 0) next = G.frontierPreText(f) + U.jx(G.frontierPreText(f), '이/가') + ' 알려지면 소문이 돌기 시작합니다.';
    else if (o.lv === 1) next = '맛보기 발견(' + namesOf(f.tease).join('·') + ')을 ' + (f.light || 1) + '개 찾으면 「' + G.DISC[f.gate].name + '」의 단서가 나옵니다.';
    else if (o.lv === 2) next = '「' + G.DISC[f.gate].name + '」' + U.jx(G.DISC[f.gate].name, '을/를') + ' 찾으면(또는 경쟁자가 발표하면) 이 땅이 열립니다.';
    else if (!o.t2) next = '이곳에서 발견 ' + G.frontierNeed(f, 2) + '곳(지금 ' + o.found + '곳)을 채우거나 몇 해가 지나면 더 무거운 발견물의 단서가 나옵니다.';
    else if (!o.t3) next = '이곳에서 발견 ' + G.frontierNeed(f, 3) + '곳(지금 ' + o.found + '곳)을 채우면 가장 무거운 발견물의 단서가 나옵니다.';
    else next = '모든 단서를 들을 수 있습니다.';
    return { id: fid, name: f.name, road: f.road, lv: o.lv, t2: o.t2, t3: o.t3, label: label, found: o.found, total: f.n, next: next };
  };
  /** 각 길에서 지금 노릴 만한 다음 목표 (맨 앞의 아직 열리지 않은 단계) */
  F.goals = function () {
    var out = [];
    ['east', 'west'].forEach(function (road) {
      var fs = G.FRONTIERS.filter(function (f) { return f.road === road; });
      for (var i = 0; i < fs.length; i++) {
        var o = F.state(fs[i].id);
        if (o.lv >= 1 && o.lv < 3) { out.push({ road: road, st: F.status(fs[i].id) }); break; }
      }
    });
    return out;
  };
})(window.G = window.G || {});
