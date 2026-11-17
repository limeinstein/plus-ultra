/* 발견 날짜를 기준으로 움직이는 철새 명부. 5년·3명·40년 수치는 base.js에서 정한다. */
(function (G) {
  'use strict';
  var U = G.U;
  G.DiscoveryCrew = {
    create: function (ids, cfgKey, stateKey) {
      function state() { return G.Game && G.Game.state; }
      function cfg() { return G.BALANCE[cfgKey]; }
      function busy(s, id) {
        var p = s && s.player || {};
        return !!(s && ((s.flags && s.flags['gone_' + id]) ||
          (s.mates || []).some(function (m) { return m.id === id; }) || p.wife === id ||
          (p.wives2 || []).some(function (w) { return w && w.id === id; })));
      }
      function anchor() {
        var s = state(), d = s && s.disc && s.disc[cfg().gate];
        if (!d || !(d.me || d.rival)) return null;
        // 경쟁자의 발표 뒤 제독이 다시 찾아도 첫 개방 날짜를 바꾸지 않는다.
        var old = s[stateKey];
        if (old && old.v === 1 && old.anchor && old.gate === cfg().gate) return old.anchor;
        // 날짜가 빠진 옛 발견 기록은 첫 읽기 날짜를 한 번만 보존한다.
        var at = Number.isFinite(d.found) && d.found >= 10000101 ? d.found : U.dateNum(s.date);
        s[stateKey] = { v: 1, gate: cfg().gate, anchor: at };
        return at;
      }
      function period(year) {
        var at = anchor(), s = state();
        if (at == null || !s) return null;
        var ay = Math.floor(at / 10000), md = at % 10000;
        var elapsed = (year == null ? s.date.y : year) - ay - (s.date.m * 100 + s.date.d < md ? 1 : 0);
        if (elapsed < 0) return null;
        return { anchor: at, cycle: Math.floor(elapsed / cfg().cycle), index: Math.floor(elapsed / cfg().years),
          slot: Math.floor((elapsed % cfg().cycle) / cfg().years) };
      }
      function valid(order) {
        return Array.isArray(order) && order.every(function (id, i) { return ids.indexOf(id) >= 0 && order.indexOf(id) === i; });
      }
      function roster(p, seed) {
        var s = state(), key = String(seed == null ? s.seed : seed), saved = s[stateKey];
        if (saved && saved.v === 1 && saved.anchor === p.anchor && saved.cycle === p.cycle && saved.seed === key && valid(saved.order)) return saved.order;
        var rand = U.makeRng(U.strHash(stateKey + ':' + key + ':' + p.anchor + ':' + p.cycle));
        var order = U.shuffle(ids.filter(function (id) { return !busy(s, id); }), rand);
        s[stateKey] = { v: 1, gate: cfg().gate, anchor: p.anchor, cycle: p.cycle, seed: key, order: order };
        return order;
      }
      return {
        ids: ids.slice(),
        rememberDiscovery: anchor,
        active: function (id, year, seed) {
          if (ids.indexOf(id) < 0 || busy(state(), id)) return false;
          var p = period(year); if (!p) return false;
          var index = roster(p, seed).indexOf(id), start = p.slot * cfg().count;
          return index >= start && index < start + cfg().count;
        },
        roster: function (year, seed) { var p = period(year); return p ? roster(p, seed).slice() : []; },
        periodText: function (year) {
          var k = cfg(), rule = k.label + ' 발견 후 ' + k.years + '년마다 최대 ' + k.count + '명 · ' + k.cycle + '년 주기';
          if (year == null) return rule;
          var p = period(year); if (!p) return rule + ' (발견 대기)';
          var y = Math.floor(p.anchor / 10000) + p.index * k.years, md = p.anchor % 10000;
          return y + '년 ' + Math.floor(md / 100) + '월 ' + md % 100 + '일부터 ' + k.years + '년간 · 최대 ' + k.count + '명';
        }
      };
    }
  };
})(window.G = window.G || {});
