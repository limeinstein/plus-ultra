/* 발견 날짜를 기준으로 움직이는 철새 명부. 5년·3명·40년 수치는 base.js에서 정한다. */
(function (G) {
  'use strict';
  var U = G.U;
  G.DiscoveryCrew = {
    create: function (ids, cfgKey, stateKey, groupKey) {
      function state() { return G.Game && G.Game.state; }
      function cfg() {
        var k = G.BALANCE[cfgKey];
        return groupKey ? Object.assign({}, k, k.groups[groupKey]) : k;
      }
      function gateKey() { return cfg().gate || groupKey; }
      function busy(s, id) {
        var p = s && s.player || {};
        return !!(s && ((s.flags && s.flags['gone_' + id]) ||
          (s.mates || []).some(function (m) { return m.id === id; }) || p.wife === id ||
          (p.wives2 || []).some(function (w) { return w && w.id === id; })));
      }
      function anchor() {
        var s = state(), k = cfg(), at = null;
        if (!s) return null;
        (k.gates || [k.gate]).forEach(function (id) {
          var d = s.disc && s.disc[id];
          if (!d || !(d.me || (!k.ownOnly && d.rival))) return;
          // 지역 안의 여러 발견 중 가장 이른 직접 발견일. 날짜 없는 옛 기록은 처음 읽은 날을 쓴다.
          var found = Number.isFinite(d.found) && d.found >= 10000101 ? d.found : U.dateNum(s.date);
          if (at == null || found < at) at = found;
        });
        if (at == null) return null;
        // 경쟁자의 발표 뒤 제독이 다시 찾아도 첫 개방 날짜를 바꾸지 않는다.
        var old = s[stateKey];
        if (old && old.v === 1 && old.anchor && old.gate === gateKey()) return old.anchor;
        // 날짜가 빠진 옛 발견 기록은 첫 읽기 날짜를 한 번만 보존한다.
        s[stateKey] = { v: 1, gate: gateKey(), anchor: at };
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
        // 순환 명부는 원래 순서를 보존하고, 각 5년 기간을 배정할 때 현재 부하를 제외한다.
        var order = U.shuffle(ids.filter(function (id) { return cfg().repeatWithinCycle || !busy(s, id); }), rand);
        s[stateKey] = { v: 1, gate: gateKey(), anchor: p.anchor, cycle: p.cycle, seed: key, order: order };
        return order;
      }
      function batch(p, seed) {
        var order = roster(p, seed), s = state(), saved = s[stateKey], n = cfg().count;
        if (saved.slot === p.slot && valid(saved.batch) && saved.batch.length <= n) return saved.batch;
        var available = order.filter(function (id) { return !busy(s, id); }), out = [];
        for (var i = 0; i < Math.min(n, available.length); i++) out.push(available[(p.slot * n + i) % available.length]);
        // 고용한 자리는 그 기간 안에 보충하지 않는다. 다음 5년 기간에는 남은 후보로 다시 최대 3명.
        saved.slot = p.slot; saved.batch = out;
        return out;
      }
      return {
        ids: ids.slice(),
        rememberDiscovery: anchor,
        active: function (id, year, seed) {
          if (ids.indexOf(id) < 0 || busy(state(), id)) return false;
          var p = period(year); if (!p) return false;
          if (cfg().repeatWithinCycle) return batch(p, seed).indexOf(id) >= 0;
          var index = roster(p, seed).indexOf(id), start = p.slot * cfg().count;
          return index >= start && index < start + cfg().count;
        },
        roster: function (year, seed) { var p = period(year); return p ? roster(p, seed).slice() : []; },
        periodText: function (year) {
          var k = cfg(), rule = k.label + (k.ownOnly ? ' 직접' : '') + ' 발견 후 ' + k.years + '년마다 최대 ' + k.count + '명 · ' + k.cycle + '년' + (k.repeatWithinCycle ? '마다 재추첨 (미고용 후보 순환)' : ' 주기');
          if (year == null) return rule;
          var p = period(year); if (!p) return rule + ' (발견 대기)';
          var y = Math.floor(p.anchor / 10000) + p.index * k.years, md = p.anchor % 10000;
          return y + '년 ' + Math.floor(md / 100) + '월 ' + md % 100 + '일부터 ' + k.years + '년간 · 최대 ' + k.count + '명';
        }
      };
    }
  };
})(window.G = window.G || {});
