/* 식민지의 후원자 (G.ColonySp) — 2026-11-05 사용자 요청 「식민지가 생기면 그 도시에 귀족 저택 같은 후원자 2~3명」
   자료: js/data/influence.js (G.BALANCE.colonySp · G.COLONY_POWERS · G.COLONY_NATION · G.COLONY_NAMES · G.COLONY_ARCHETYPES)
   ■ 식민지: 유럽 밖(지역 3~10)과 대서양의 섬(세우타·아조레스·마데이라·카나리아)에 있는 도시가 식민 세력(포르투갈·에스파냐·잉글랜드·네덜란드·프랑스·스웨덴…)의 것이 되면.
     · 역사(G.Dominion)의 주인이 바뀐 것은 그 뒤 stay(24)달 넘게 이어질 때만 (드레이크의 산토도밍고 약탈 같은 짧은 점령은 빼고)
     · 제독이 점령한 도시(G.Conquest) · 제독이 세운 개척 도시(G.Colony, 도시를 세운 뒤)는 곧바로
     · 부족 마을과 항구가 아닌 작은 마을(크기 1)은 빼고. 작은 도시(크기 1)는 2명, 큰 도시는 3명
   ■ 후원자: 그 나라에서 건너온 대농장주·대상인·주교·요새 사령관·아우디엔시아 판사·엔코멘데로·광산주·상관장·선교회 원장·박물학자 가운데 그 고장에 맞는 이들.
     가문(대농장주·상인…)은 대를 잇고(gen 해마다), 직책(주교·사령관…)은 임기(term)마다 사람이 바뀐다. 저택은 보통 후원자와 같다 (알현·계약·보고 — js/city/palace.js).
     이름은 그 나라에 흔한 이름과 성을 섞어 지은 가상의 인물이다.
   ■ 식민지를 잃으면(다른 나라로 넘어가 stay달 넘게) 그 무리의 마지막 사람이 그날 자리를 떠난다 — 저택이 비고, 계약 중이면 집사가 보고를 받는다 (G.Sponsor.caretaker).
   ■ 저장: s.colonySp = { groups: [{ seq, c(도시), code(나라), since(해), until(해 — 떠난 때), n(사람 수) }], seq, mk(살핀 달) }
     후원자 기록은 저장하지 않는다 — 무리(seq·도시·나라·해)에서 늘 같은 사람들을 다시 짓는다(CS.build). 일지를 열 때·새로 시작할 때 CS.apply()가 G.SPONSORS에 끼워 넣는다.
     후원자 id: 'csp_<seq>_<번호>' (옛 저장·자료와 겹치지 않게) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var CS = G.ColonySp = {};
  function K() { return G.BALANCE.colonySp; }
  function S() { return G.Game && G.Game.state; }
  function st() {
    var s = S(); if (!s) return null;
    var b = s.colonySp || (s.colonySp = { groups: [], seq: 0 });
    if (!Array.isArray(b.groups)) b.groups = [];
    if (!(b.seq >= 0)) b.seq = 0;
    return b;
  }
  CS.state = st;
  function city(id) { return G.CITY_DATA[id]; }
  function yNow() { var d = S().date; return d.y + (d.m - 1) / 12; }
  function rngOf(seed) { var h = (U.strHash(String(seed)) >>> 0) || 1; return function () { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; }; }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function codeOf(name) { return (G.COLONY_POWERS || {})[name] || null; }

  // ================================================================ 어느 도시가 식민지인가
  /** 식민지가 될 수 있는 도시인가 */
  CS.candidate = function (c) {
    if (!c || c.outpost) return false;
    if (c.colony != null) { var e = G.Colony && G.Colony.of(c); return !!(e && e.stage >= 1); }   // 제독이 세운 개척 도시: 도시를 세운 뒤
    if (!R.cityExists(c)) return false;
    if (c.flags && c.flags.indexOf('T') >= 0) return false;   // 아프리카 부족 마을
    if (!(c.region >= 3 || K().islands.indexOf(c.id) >= 0)) return false;   // 유럽 본토는 식민지가 아니다
    return !!(c.port || c.size >= 2);
  };
  /** 지금 이 도시를 다스리는 식민 세력 (없으면 null) */
  CS.codeNow = function (c) {
    if (c.colony != null) { var e = G.Colony && G.Colony.of(c); return e ? (codeOf(e.owner) || (e.nat === 'ES' ? 'ES' : 'PT')) : null; }
    return codeOf(R.cityOwner(c));
  };
  /** 자리 잡은 주인: stay달 동안 같은 세력이면 그 기호('-' = 식민지가 아님), 흔들리는 중이면 undefined */
  function settled(c) {
    var s = S(), now = CS.codeNow(c) || '-';
    if (c.colony != null || (s.conquests && s.conquests[c.id]) || !G.Dominion || !G.Dominion.ownerAt) return now;
    var t0 = s.date.y * 12 + s.date.m - 1, stay = K().stay;
    for (var k = 6; k <= stay; k += 6) {
      var t = t0 + k, o = codeOf(G.Dominion.ownerAt(c, Math.floor(t / 12), t % 12 + 1)) || '-';
      if (o !== now) return undefined;
    }
    return now;
  }
  CS.settled = settled;
  /** 이 식민지가 언제부터 그 세력의 것이었나 (해) — 일지를 열 때 이미 식민지인 곳 */
  function since(c, code) {
    var s = S();
    if (c.colony != null) { var e = G.Colony.of(c), f = e && e.founded; return f ? Math.floor(f / 10000) + (Math.floor(f / 100) % 100 - 1) / 12 : yNow(); }
    var q = s.conquests && s.conquests[c.id];
    if (q && q.date) { var d = q.date; return typeof d === 'number' ? Math.floor(d / 10000) + (Math.floor(d / 100) % 100 - 1) / 12 : d.y + ((d.m || 1) - 1) / 12; }
    var H = G.Dominion && G.Dominion.history ? G.Dominion.history(c) : [], y = yNow(), start = null, prev = null;
    H.forEach(function (h) {
      var hy = h.y + ((h.m || 1) - 1) / 12; if (hy > y) return;
      var cd = codeOf(h.n) || '-';
      if (cd === code && prev !== code) start = hy;
      prev = cd;
    });
    return start == null ? y : start;
  }

  // ================================================================ 사람 짓기
  function region(c) {
    if (K().islands.indexOf(c.id) >= 0) return 'island';
    return c.region === 10 ? 'amer' : c.region === 3 ? 'africa' : 'asia';
  }
  function fits(a, c, code) {
    var N = G.COLONY_NATION[code] || {}, cls = region(c);
    if (a.only && a.only !== code) return false;
    if (a.cath && !N.cath) return false;
    if (a.prot && N.cath) return false;
    if (a.silver && !(c.goods || []).some(function (g) { return g === 'silver' || g === 'gold'; })) return false;
    if (a.trade && !c.port) return false;
    return a.where.indexOf('any') >= 0 || a.where.indexOf(cls) >= 0;
  }
  function wpick(rng, list) {
    var tot = 0; list.forEach(function (a) { tot += a.w || 1; });
    var r = rng() * tot;
    for (var i = 0; i < list.length; i++) { r -= list[i].w || 1; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  }
  function personName(rng, code, sur) {
    var P = G.COLONY_NAMES[code] || G.COLONY_NAMES.PT;
    return pick(rng, P.given) + ' ' + (sur || pick(rng, P.sur));
  }
  /** 이 무리의 후원자들 — 언제 지어도 같은 사람들 */
  CS.build = function (g) {
    var c = city(g.c); if (!c) return [];
    var k = K(), N = G.COLONY_NATION[g.code] || G.COLONY_NATION.PT, rng = rngOf('csp:' + g.seq + ':' + g.c + ':' + g.code);
    var pool = G.COLONY_ARCHETYPES.filter(function (a) { return fits(a, c, g.code); }), picked = [], usedSur = {};
    while (picked.length < g.n && pool.length) { var a = wpick(rng, pool); picked.push(a); pool = pool.filter(function (x) { return x !== a; }); }
    var y0 = Math.floor(g.since), end = g.until != null ? g.until : k.end;
    return picked.map(function (a, i) {
      var r = rngOf('csp:' + g.seq + ':' + i), holders = [], y = y0, P = G.COLONY_NAMES[g.code] || G.COLONY_NAMES.PT, sur = null;
      if (a.family) { for (var t = 0; t < 8; t++) { sur = pick(r, P.sur); if (!usedSur[sur]) break; } usedSur[sur] = 1; }
      while (y < k.end) {
        var len = a.family ? k.gen[0] + Math.floor(r() * (k.gen[1] - k.gen[0] + 1)) : k.term[0] + Math.floor(r() * (k.term[1] - k.term[0] + 1));
        var to = Math.min(k.end, y + len);
        holders.push([y, to, personName(r, g.code, a.family ? sur : null)]);
        y = to;
      }
      // 식민지를 잃었으면 그때 자리를 떠난다 (그 뒤의 사람은 오지 않는다)
      if (end < k.end) {
        holders = holders.filter(function (h) { return h[0] < end; });
        if (!holders.length) holders = [[y0, Math.max(y0 + 0.01, end), personName(r, g.code, sur)]];
        holders[holders.length - 1][1] = Math.max(holders[holders.length - 1][0] + 0.01, end);
      }
      var o = { id: 'csp_' + g.seq + '_' + i, title: c.name + ' ' + a.title, type: a.type, city: c.id, bld: 'mansion', pw: a.pw, wealth: a.wealth,
        lang: N.lang, rel: 'C', taste: a.taste.slice(), holders: holders, style: N.style, colonial: g.code };
      if (N.sp) o.nation = N.sp;
      if (a.place) o.place = c.name + ' ' + a.place;
      return o;
    });
  };

  // ================================================================ G.SPONSORS에 끼워 넣기
  var injected = [];
  function eject() {
    if (!injected.length) return;
    var gone = {}; injected.forEach(function (id) { gone[id] = 1; delete G.SPONSOR[id]; });
    for (var i = G.SPONSORS.length - 1; i >= 0; i--) if (gone[G.SPONSORS[i].id]) G.SPONSORS.splice(i, 1);   // 같은 배열을 고친다 (다른 곳이 G.SPONSORS를 쥐고 있어도)
    injected = [];
  }
  function inject(g) {
    return CS.build(g).map(function (o) {
      if (G.SPONSOR[o.id]) { var j = G.SPONSORS.indexOf(G.SPONSOR[o.id]); if (j >= 0) G.SPONSORS[j] = o; else G.SPONSORS.push(o); }
      else G.SPONSORS.push(o);
      G.SPONSOR[o.id] = o; if (injected.indexOf(o.id) < 0) injected.push(o.id);
      return o;
    });
  }
  /** 새 게임·일지를 열 때 (js/core/state.js · js/scenes/common.js): 이 일지의 식민지 후원자를 넣고, 이미 식민지인 곳에 아직 없으면 조용히 짓는다 */
  CS.apply = function () {
    eject();
    var b = st(); if (!b) return;
    b.groups.forEach(inject);
    CS.scan(true);
    if (G.Succession && G.Succession.sync) { try { G.Succession.sync(); } catch (e) { console.error(e); } }
  };
  function activeAt(cid) { var b = st(); for (var i = b.groups.length - 1; i >= 0; i--) { var g = b.groups[i]; if (g.c === cid && g.until == null) return g; } return null; }
  CS.groupAt = activeAt;
  /** 식민지를 살핀다 — 새 식민지에 후원자를 세우고, 잃은 식민지의 사람들을 떠나보낸다. quiet면 소식 없이 (돌려주는 값: 새로 생긴 [{c, code, sps}]) */
  CS.scan = function (quiet) {
    var b = st(); if (!b) return [];
    var made = [];
    G.CITY_DATA.forEach(function (c) {
      if (!c) return;
      var g = activeAt(c.id);
      if (!CS.candidate(c)) {
        if (g && c.colony == null) { if (!R.cityExists(c)) close(g); else { var e0 = settled(c); if (e0 !== undefined && e0 !== g.code) close(g); } }   // 도시가 사라졌거나(테노치티틀란 1521) 식민지를 잃었다
        return;
      }
      var code = settled(c); if (code === undefined) return;
      if (g && g.code === code) return;
      if (g) close(g);
      if (code === '-' || !G.COLONY_NATION[code]) return;
      var ng = { seq: ++b.seq, c: c.id, code: code, since: quiet ? since(c, code) : yNow(), n: c.size >= 2 ? K().count[1] : K().count[0] };
      b.groups.push(ng);
      made.push({ c: c, code: code, sps: inject(ng) });
    });
    return made;
  };
  function close(g) {
    g.until = Math.max(Math.floor(g.since) + 0.01, yNow());
    inject(g);   // 마지막 사람이 지금 떠나도록 다시 짓는다
  }
  /** 날마다 (G.World.daily) — 달이 바뀌면 식민지를 살핀다 */
  CS.daily = function () {
    var b = st(), s = S(); if (!b) return [];
    var mk = s.date.y * 12 + s.date.m;
    if (b.mk === mk) return [];
    var first = b.mk == null; b.mk = mk;
    var made = CS.scan(first);
    if (!made.length || first) return [];
    var parts = made.slice(0, 4).map(function (x) { return x.c.name + '(' + G.COLONY_NATION[x.code].name + ') ' + x.sps.map(function (o) { return o.title.replace(x.c.name + ' ', ''); }).join('·'); });
    var text = '새 식민지에 본국의 귀족·상인·성직자들이 건너와 저택을 세웠다 — ' + parts.join(' / ') + (made.length > 4 ? ' 그 밖에 ' + (made.length - 4) + '곳' : '') + '.';
    G.State.log(text);
    return [{ icon: 'mansion', history: true, text: text }];
  };
  /** 이 도시의 식민지 후원자 (지금 자리에 있는) */
  CS.at = function (cid) { return G.SPONSORS.filter(function (o) { return o.colonial && o.city === cid && G.Sponsor && G.Sponsor.open(o); }); };

  // ================================================================ 걸기
  (function hookDaily() {
    var W = G.World; if (!W || W._colonySp) return;
    W._colonySp = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(CS.daily()); } catch (e) { console.error(e); } return out; };
  })();
  // 제독의 개척 도시: 도시를 세우면 곧바로 · 거리에 저택을 세운다 (js/systems/colony.js)
  (function hookColony() {
    var CO = G.Colony; if (!CO || CO._colonySp) return;
    CO._colonySp = true;
    var of = CO.found;
    if (typeof of === 'function') CO.found = async function (c) {
      var r = await of.apply(this, arguments);
      try {
        var made = CS.scan(false).filter(function (x) { return x.c.id === c.id; });
        if (made.length) {
          var names = made[0].sps.map(function (o) { return (G.Scenes.city && G.Scenes.city.mansionName ? G.Scenes.city.mansionName(o) : o.title); });
          var text = c.name + '에 본국의 귀족·상인들이 건너와 저택을 세웠다 — ' + names.join(' · ') + '. 저택에서 후원을 청할 수 있다.';
          UI.toast(text, 'mansion', 6500); G.State.log(text);
        }
      } catch (e) { console.error(e); }
      return r;
    };
    var ob = CO.buildings;
    if (typeof ob === 'function') CO.buildings = function (c) {
      var out = ob.apply(this, arguments) || [];
      try {
        var C = G.Scenes && G.Scenes.city, add = CS.at(c.id).map(function (o) { return { kind: 'mansion', arg: o.id, name: C && C.mansionName ? C.mansionName(o) : o.title, icon: 'mansion' }; });
        if (add.length) { var gi = out.map(function (x) { return x.kind; }).indexOf('gate'); if (gi < 0) gi = out.length; out.splice.apply(out, [gi, 0].concat(add)); }
      } catch (e) { console.error(e); }
      return out;
    };
  })();
})(window.G = window.G || {});
