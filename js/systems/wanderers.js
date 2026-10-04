/* 철새 — 떠돌이 항해사 (G.Wander)
   · 새 게임에는 BALANCE.wander.startN명, 해가 바뀔 때마다 perYear명이 새로 항구에 나타난다.
   · cycle년(30년)마다 세대가 바뀐다: 고용하지 않은 철새는 모두 떠나고, 그 가운데 rebornMax명의 「다음 세대」가 나타난다.
     다음 세대는 윗대의 솜씨 갈래와 얼굴을 이어받지만 이름은 새로 붙고, 국적(keepNation)과 성별(keepGender)은 확률로 바뀐다.
     (성별이 바뀌면 얼굴도 새로 고른다.) 윗대의 이름은 그 사람의 이야기에 「닮았다는 소문」으로 남는다.
   · 얼굴은 이미 있는 그림(마을 사람 역할 그림, 다른 항해사의 초상)을 빌려 쓴다 — 철새끼리, 또는 다른 항해사와 얼굴이 겹치기도 한다.
   · 저장: s.wander = {seq, gen, defs: {ID: 정의}} — 정의는 G.MATES·G.MATE·G.MATE_RANGE에 그대로 올려 다른 항해사처럼 쓴다.
     ID(wd_…)는 한 번 붙으면 바뀌지 않는다. 떠난 철새는 부하·아내가 아니면 정의를 지운다. */
(function (G) {
  'use strict';
  var U = G.U, WD = {};
  G.Wander = WD;
  function S() { return G.Game.state; }
  function cfg() { return (G.BALANCE && G.BALANCE.wander) || {}; }
  function known(id) { return G.Frontier ? G.Frontier.known(id) : true; }
  function city(id) { return G.CITY_DATA[id]; }
  function exists(c, y) { return c && !(c.founded && y < c.founded) && !(c.until && y >= c.until); }

  // ---------------------------------------------------------------- 명부에 올리고 내리기
  function register(d) {
    if (!G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; }
    G.MATE_RANGE[d.id] = { zones: d.zones, home: d.home };
  }
  function unregister(id) {
    var s = S(), i;
    for (i = G.MATES.length - 1; i >= 0; i--) if (G.MATES[i].id === id) G.MATES.splice(i, 1);
    delete G.MATE[id]; delete G.MATE_RANGE[id];
    if (s) { if (s.mateLoc) delete s.mateLoc[id]; if (s.wander) delete s.wander.defs[id]; }
  }
  /** 새 게임·불러오기: 지난 게임의 철새를 치우고 이 게임의 철새를 올린다 */
  WD.apply = function () {
    var s = S(); if (!s) return;
    G.MATES.filter(function (m) { return m.wd; }).forEach(function (m) { delete G.MATE[m.id]; delete G.MATE_RANGE[m.id]; });
    for (var i = G.MATES.length - 1; i >= 0; i--) if (G.MATES[i].wd) G.MATES.splice(i, 1);
    if (!s.wander) {
      s.wander = { seq: 0, gen: genOf(s.date.y), defs: {} };
      var n = cfg().startN == null ? 12 : cfg().startN;
      for (var k = 0; k < n; k++) { var d = WD.make({}); if (d) { s.wander.defs[d.id] = d; } }
    }
    for (var id in s.wander.defs) register(s.wander.defs[id]);
    if (G.RegionFolk) G.RegionFolk.fill();   // 고장마다 도시 수의 80%쯤은 사람이 있게 (5년 칸마다)
    if (G.Bio) G.Bio.reset();
  };
  function genOf(y) { var c = cfg(); return Math.floor((y - (c.epoch || 1480)) / (c.cycle || 30)); }
  WD.genOf = genOf;
  WD.list = function () { var s = S(); return s && s.wander ? Object.keys(s.wander.defs).map(function (k) { return s.wander.defs[k]; }) : []; };

  // ---------------------------------------------------------------- 나라·이름
  /** 지금 나타날 수 있는 나라 */
  function nations(y) {
    return Object.keys(G.WANDER_NATIONS).filter(function (k) {
      var n = G.WANDER_NATIONS[k];
      return (!n.from || y >= n.from) && (!n.after || n.after.every(known));
    });
  }
  function pickNation(y) {
    var ks = nations(y);
    return U.weighted(ks, function (k) { return G.WANDER_NATIONS[k].w || 1; });
  }
  function takenNames() {
    var t = {}; G.MATES.forEach(function (m) { t[m.name] = 1; });
    var s = S(); if (s && s.wander) for (var k in s.wander.defs) t[s.wander.defs[k].name] = 1;
    return t;
  }
  /** 두 사람(되도록 배우 하나·축구 선수 하나)의 이름과 성을 섞는다. 한 사람의 이름을 통째로 쓰지 않는다 */
  WD.makeName = function (natKey, g) {
    var n = G.WANDER_NATIONS[natKey], ppl = n.people;
    var givers = ppl.filter(function (p) { return p[3] === g; });
    if (!givers.length) givers = ppl;
    var taken = takenNames(), real = {};
    ppl.forEach(function (p) { real[fmt(n, p[0], p[1])] = 1; });
    for (var t = 0; t < 40; t++) {
      var a = U.pick(givers);
      var others = ppl.filter(function (p) { return p !== a && p[1] !== a[1]; });
      var diff = others.filter(function (p) { return p[2] !== a[2]; });
      var b = U.pick(diff.length && U.chance(0.85) ? diff : others);
      if (!b) continue;
      var nm = fmt(n, a[0], b[1]);
      if (real[nm] || taken[nm]) continue;
      return { name: nm, from: [a[0] + ' ' + a[1], b[0] + ' ' + b[1]] };
    }
    var a2 = U.pick(givers), b2 = U.pick(ppl);
    return { name: fmt(n, a2[0], b2[1]) + ' ' + (U.ri(2, 9)) + '세', from: [] };
  };
  function fmt(n, given, sur) { return n.order === 'sf' ? sur + (n.sep || '') + given : given + ' ' + sur; }

  // ---------------------------------------------------------------- 얼굴
  // 얼굴을 빌려주지 않는 이름난 사람들 (누가 봐도 그 사람인 초상)
  var ICONIC = { leonardo: 1, michelangelo: 1, raffaello: 1, galileo: 1, shakespeare: 1, drake: 1, barbarossa: 1, xavier: 1, kepler: 1, tycho: 1, cervantes: 1, camoes: 1, rocco: 1, marina: 1 };
  var MALE_ROLES = ['sailor', 'captain', 'soldier', 'priest'], FEMALE_ROLES = ['maid', 'keeper', 'merchant', 'scholar', 'noble', 'official'];
  var REGION_STYLE = ['ib', 'ne', 'it', 'af', 'is', 'in', 'cn', 'is', 'se', 'jp', 'az'];
  function faceOk(k) { return !G.Img || !G.Img.has || G.Img.has(k); }
  /** 그 양식·성별의 얼굴 후보 (역할 그림 + 같은 문화권 항해사의 초상) */
  WD.facePool = function (style, g, type) {
    var A = G.Art, T = G.WANDER_TYPES[type] || {}, out = [];
    var roles = (g === 'f' ? FEMALE_ROLES : MALE_ROLES).filter(function (r) { return !A || !A.rolePortraitGender || A.rolePortraitGender(r, style) === g; });
    var pref = (T.role || []).filter(function (r) { return roles.indexOf(r) >= 0; });
    (pref.length ? pref.concat(pref) : []).concat(roles).forEach(function (r) { var k = 'portraits/npc-roles/' + style + '/' + r; if (faceOk(k)) out.push(k); });
    var cult = A && A.imageCulture ? A.imageCulture(style) : null;
    G.MATES.forEach(function (m) {
      if (m.wd || m.witch || m.g !== g || ICONIC[m.id]) return;
      var ms = m.style || REGION_STYLE[(m.reg || [])[0]] || 'ib';
      if (ms !== style && (!cult || !A.imageCulture || A.imageCulture(ms) !== cult)) return;
      var k = 'portraits/mates/' + m.id; if (faceOk(k)) out.push(k);
    });
    return out;
  };

  // ---------------------------------------------------------------- 한 사람 짓기
  var FAR = ['iberia', 'italy', 'britain', 'lowlands', 'maghreb', 'egypt', 'ottoman', 'arabia', 'wafrica', 'eafrica', 'india', 'seasia', 'china', 'antilles'];
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  /** opts: {nat, g, type, face, prev: 윗대 정의} */
  WD.make = function (opts) {
    var s = S(), y = s.date.y, c = cfg();
    opts = opts || {};
    var nk = opts.nat && nations(y).indexOf(opts.nat) >= 0 ? opts.nat : pickNation(y);
    if (!nk) return null;
    var N = G.WANDER_NATIONS[nk];
    var tk = opts.type || U.weighted(Object.keys(G.WANDER_TYPES), function (k) { return G.WANDER_TYPES[k].w || 1; });
    var T = G.WANDER_TYPES[tk];
    var g = opts.g || (U.chance(tk === 'war' || tk === 'gun' ? 0.18 : 0.32) ? 'f' : 'm');
    var nm = WD.makeName(nk, g);
    var st = T.st.map(function (v) { return clamp(v + U.ri(-10, 12), 28, 92); });
    var sk = {}, skSum = 0;
    T.sk.forEach(function (x) { var lv = U.ri(x[1], x[2]); if (lv > 0) { sk[x[0]] = lv; skSum += lv; } });
    var lg = {}; lg[N.lang] = 3;
    if (N.native != null) lg[N.native] = U.ri(2, 3);
    var ex = U.shuffle(N.extra.filter(function (l) { return !(l in lg); })).slice(0, T.langs || U.ri(1, 2));
    ex.forEach(function (l) { lg[l] = T.langs ? U.ri(2, 3) : U.ri(1, 2); });
    var stSum = st[0] + st[1] + st[2] + st[3];
    var fame = Math.max(0, Math.round(((stSum - 205) * 9 + skSum * 90 - 250) / 50) * 50);
    var wage = Math.max(25, Math.round((28 + skSum * 12 + (stSum - 200) / 3) / 5) * 5);
    var zones = N.zones.slice();
    if (U.chance(c.farZone == null ? 0.35 : c.farZone)) { var fz = U.pick(FAR.filter(function (z) { return zones.indexOf(z) < 0 && G.MATE_ZONES[z]; })); if (fz) zones.push(fz); }
    var homes = ((G.MATE_ZONES[zones[0]] || {}).ids || []).filter(function (id) { return exists(city(id), y); });
    var home = homes.length ? U.pick(homes) : null;
    var born = home != null ? city(home).name : N.name;
    // 얼굴: 윗대의 얼굴(성별이 같을 때) 또는 새로
    var face = opts.face && opts.g === g ? opts.face : (function () { var pool = WD.facePool(N.style, g, tk); return pool.length ? U.pick(pool) : null; })();
    var tx = G.WANDER_TEXT, tr = U.pick(tx.trait[tk] || tx.trait.nav);
    var desc = N.adj + ' 출신의 ' + (g === 'f' ? '여' : '') + T.nm + '. ' + tr;
    var story = born + '에서 태어났다. ' + U.pick(tx.past) + ' ' + U.pick(tx.dream);
    if (opts.prev) story += ' 서른 해쯤 전 이 바다를 떠돌던 ' + opts.prev.name + '(' + opts.prev.natName + ')' + U.jx(opts.prev.name, '과/와') + ' 똑 닮았다는 말을 자주 듣는다.';
    s.wander.seq = (s.wander.seq || 0) + 1;
    var id = 'wd_' + y + '_' + s.wander.seq;
    return {
      id: id, name: nm.name, g: g, wd: true, nat: nk, natName: N.name, type: tk, typeName: T.nm, st: st, sk: sk, lg: lg, fame: fame, wage: wage,
      y: [y, 9999], after: N.after ? N.after.slice() : undefined, reg: [], desc: desc, story: story, style: N.style, role: g === 'f' ? 'maid' : (T.role[0] || 'sailor'),
      face: face, zones: zones, home: home, gen: genOf(y), born: y, line: opts.prev ? opts.prev.line || opts.prev.id : id, prevName: opts.prev ? opts.prev.name : null, nameFrom: nm.from
    };
  };

  // ---------------------------------------------------------------- 해마다
  function busy(id) {
    var s = S();
    return s.mates.some(function (m) { return m.id === id; }) || s.player.wife === id;
  }
  WD.newYear = function () {
    var s = S(), c = cfg(), out = [];
    if (!s.wander) { WD.apply(); return out; }
    var y = s.date.y, g = genOf(y);
    // 떠난 철새 치우기: 부하도 아내도 아니고 지난 세대 사람이면
    WD.list().forEach(function (d) { if (d.gen < s.wander.gen && !busy(d.id)) unregister(d.id); });
    // 세대 교체
    if (g > s.wander.gen) {
      s.wander.gen = g;
      var old = WD.list().filter(function (d) { return !busy(d.id) && d.gen < g; });
      var keep = U.shuffle(old.filter(function (d) { return !d.local; })).slice(0, c.rebornMax == null ? 30 : c.rebornMax), born = [];   // 고장 사람(local)은 다음 셈 때 새로 채운다 (regionfolk.js)
      old.forEach(function (d) { unregister(d.id); });
      keep.forEach(function (p) {
        var nat = U.chance(c.keepNation == null ? 0.55 : c.keepNation) ? p.nat : null;
        var gg = U.chance(c.keepGender == null ? 0.7 : c.keepGender) ? p.g : (p.g === 'f' ? 'm' : 'f');
        var d = WD.make({ nat: nat, g: gg, type: p.type, face: p.face, prev: p }); if (!d) return;
        s.wander.defs[d.id] = d; register(d); born.push(d);
      });
      out.push({ icon: 'people', history: true, text: '한 세대가 흘렀다. 항구를 떠돌던 철새들이 떠나고 ' + born.length + '명의 새 얼굴이 나타났다 — 어딘가 윗대 뱃사람들을 닮았다는 소문이다.' });
    }
    // 새로 나타나는 철새
    var n = c.perYear == null ? 5 : c.perYear, fresh = [];
    for (var k = 0; k < n; k++) { var d2 = WD.make({}); if (!d2) continue; s.wander.defs[d2.id] = d2; register(d2); fresh.push(d2); }
    if (fresh.length) {
      out.push({ icon: 'people', text: '철새 소식: 올해 떠돌이 항해사 ' + fresh.length + '명이 새로 항구에 나타났다 — ' + fresh.map(function (d) {
        var at = d.home != null ? city(d.home) : null;
        return d.name + '(' + d.natName + ' ' + d.typeName + (at ? ', ' + at.name : '') + ')';
      }).join(', ') + '.' });
    }
    if (G.RegionFolk) G.RegionFolk.fill();
    if (G.Bio) G.Bio.reset();
    return out;
  };
})(window.G = window.G || {});
