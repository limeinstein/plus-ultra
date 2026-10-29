/* Naval battle: real-time tactical broadsides and boarding on the open sea. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var B = {};
  G.Scenes.battle = B;
  var st = null, battleState = null;
  function S() { return G.Game.state; }
  var SCALE = 1;           // px per battle unit
  var ARENA = 1800;        // retreat radius from arena centre (2026-10-17 1300 → 1800: 전장을 넓혔다)
  /* 해전 화면 배율 (2026-10-17): 살아 있는 배들이 양옆 정보창(함대·명령) 사이의 빈 자리(free: x0,y0,x1,y1 — 1600×900 기준)에 다 들어오게
     min~max 사이에서 저절로 당기고 민다. label: 배율이 작아져도 이름표·막대·피해 숫자는 이 크기(원래 대비)로 읽히게 그린다 */
  function VIEW() { return (G.FX && G.FX.battleView) || { min: 0.45, max: 0.7, free: [336, 92, 1230, 876], pad: 150, label: 0.92, follow: 0.9 }; }
  function labelK() { return VIEW().label / ((st && st.vz) || 1); }
  /** 위에서 내려다본 배의 위아래 반높이 — 옆으로 누운 배는 낮고 세로로 선 배는 높다 (이름표가 이웃 배에 붙어 보이지 않게) */
  function halfH(b) { var h = b.heading || 0; return (Math.abs(Math.sin(h)) * 0.5 + Math.abs(Math.cos(h)) * 0.17) * (b.len || 90); }
  // 전장 900px를 세계 지도 1도에 대응시킨다. 섬·해안은 실제 위치를 쓰되 전술 화면에서 읽히도록 조금 압축해 보인다.
  var GEO_SCALE = 900;

  function geoAt(x, y) {
    if (!st || !st.center) return [0, 0];
    return [G.Geo.wrapLon(st.center.lon + x / GEO_SCALE), st.center.lat - y / GEO_SCALE];
  }
  function shorePad(b) {
    // 해안에서 띄우는 거리 — 예전에는 선체 길이의 반(len×0.42)만큼 띄워, 배 폭보다 넓은 좁은 물길도 큰 배는 지나가지 못하고 벽에 걸렸다 (2026-10-18).
    // 이제 선체 폭에 맞춘다 (len × BFX.hullPad, 기본 0.22). 시작 자리는 startBlocked가 둘레를 더 본다
    var px = b ? Math.max(16, b.len * ((BFX && BFX.hullPad) || 0.22)) : 12;
    return Math.max(0.2, px / GEO_SCALE * (G.Geo.TEX_PER_DEG || 11.38));
  }
  /** 선체 폭만큼 여유를 둔 뭍·섬·빙산 충돌. true면 그 자리로 갈 수 없다. */
  function terrainBlocked(x, y, b) {
    if (!st || !G.Geo || !G.Geo.sdf || !G.Geo.ready) return false;
    if (st.npc && st.npc.lake) return false;   // 호수의 큰 싸움: 막힘 없는 물 (js/systems/aztec.js)
    var ll = geoAt(x, y);
    return G.Geo.sdf(ll[0], ll[1]) > -shorePad(b) || (G.Geo.berg && G.Geo.berg(ll[0], ll[1]));
  }
  function terrainInfo() {
    var out = { hasLand: false, samples: 0, blocked: 0, scale: GEO_SCALE };
    if (!G.Geo || !G.Geo.ready) return out;
    for (var y = -ARENA; y <= ARENA; y += 130) for (var x = -ARENA; x <= ARENA; x += 130) {
      if (x * x + y * y > ARENA * ARENA * 1.08) continue;
      out.samples++;
      if (terrainBlocked(x, y, null)) { out.blocked++; out.hasLand = true; }
    }
    return out;
  }
  /** 시작 자리를 고를 때는 해안에서 조금 더 떨어뜨린다 (첫 화면에서 배가 해안에 얹혀 보이지 않게) */
  function startBlocked(x, y, b) {
    if (terrainBlocked(x, y, b)) return true;
    var r = b ? b.len * 0.35 : 0;
    for (var i = 0; i < 6 && r; i++) { var a = i / 6 * Math.PI * 2; if (terrainBlocked(x + Math.cos(a) * r, y + Math.sin(a) * r, b)) return true; }
    return false;
  }
  function sepOK(px, py, b, placed) {
    return !(placed || []).some(function (o) { return Math.hypot(o.x - px, o.y - py) < Math.max(55, (o.len + b.len) * 0.42); });
  }
  function clearStart(x, y, b, placed) {
    function ok(px, py) { return !startBlocked(px, py, b) && sepOK(px, py, b, placed); }
    if (ok(x, y)) return [x, y];
    for (var r = 45; r <= 1000; r += 45) for (var i = 0; i < 24; i++) {
      var a = i / 24 * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (Math.hypot(px, py) < ARENA - 120 && ok(px, py)) return [px, py];
    }
    return [x, y];
  }
  /** 진형째 옮긴다: 한쪽 함대가 해안에 걸리면 그 함대 전체를 가장 가까운 열린 바다로 밀어 진형을 지킨다. 안 되면 한 척씩. */
  function settleStartingShips() {
    var placed = [];
    ['me', 'en'].forEach(function (side) {
      var grp = st.ships.filter(function (b) { return b.side === side; }), best = null;
      function fits(tx, ty) {
        var got = [];
        for (var i = 0; i < grp.length; i++) {
          var b = grp[i], px = b.x + tx, py = b.y + ty;
          if (Math.hypot(px, py) > ARENA - 120 || startBlocked(px, py, b) || !sepOK(px, py, b, placed)) return false;
        }
        return true;
      }
      if (fits(0, 0)) best = [0, 0];
      for (var r = 45; !best && r <= 900; r += 45) for (var i = 0; i < 24 && !best; i++) {
        var a = i / 24 * Math.PI * 2; if (fits(Math.cos(a) * r, Math.sin(a) * r)) best = [Math.cos(a) * r, Math.sin(a) * r];
      }
      grp.forEach(function (b) {
        if (best) { b.x += best[0]; b.y += best[1]; }
        else { var p = clearStart(b.x, b.y, b, placed); b.x = p[0]; b.y = p[1]; }
        placed.push(b);
      });
    });
    // 진형을 옮겼으면 서로 마주 보게 뱃머리를 다시 맞춘다
    var me = st.ships.filter(function (b) { return b.side === 'me'; }), en = st.ships.filter(function (b) { return b.side === 'en'; });
    function mid(l) { return [U.sum(l, function (b) { return b.x; }) / Math.max(1, l.length), U.sum(l, function (b) { return b.y; }) / Math.max(1, l.length)]; }
    if (me.length && en.length) {
      var a = mid(me), e = mid(en);
      me.forEach(function (b) { b.heading = Math.atan2(e[1] - a[1], e[0] - a[0]); });
      en.forEach(function (b) { b.heading = Math.atan2(a[1] - e[1], a[0] - e[0]); });
    }
  }
  /** 육지로 들어간 이동을 되돌리고, 한 축이 열려 있으면 해안을 따라 미끄러지게 한다. */
  function resolveTerrain(b, ox, oy) {
    if (!terrainBlocked(b.x, b.y, b)) return false;
    var nx = b.x, ny = b.y, xOK = !terrainBlocked(nx, oy, b), yOK = !terrainBlocked(ox, ny, b);
    if (xOK && (!yOK || Math.abs(nx - ox) >= Math.abs(ny - oy))) { b.y = oy; b.vel[1] *= -0.08; b.vel[0] *= 0.62; }
    else if (yOK) { b.x = ox; b.vel[0] *= -0.08; b.vel[1] *= 0.62; }
    else { b.x = ox; b.y = oy; b.vel[0] *= -0.12; b.vel[1] *= -0.12; }
    b.spd *= 0.18;
    if (b.side === 'me' && b.flag && (!st.shoreWarn || st.t - st.shoreWarn > 2.5)) {
      st.shoreWarn = st.t;
      UI.toast(st.retreat ? '퇴각로가 육지에 막혔습니다! 해안을 돌아 열린 바다로 빠져나가십시오.' : '해안·섬에 진로가 막혔습니다.', 'anchor', 3000);
    }
    return true;
  }

  // ---------------------------------------------------------------- 해안 길찾기 (2026-10-18)
  /* 섬·곶 너머의 목표로 곧장 뱃머리를 들이밀다 해안에 붙어 멈추던 것(벽 걸림)을 막는다.
     · 목표까지 곧게 물로 이어지지 않으면 전장 격자(NAV.cell px)에서 A*로 물길을 찾아 그 굽이를 따라간다 (클릭 이동·공격 추격·적 AI 모두)
     · 그래도 한동안(NAV.stuckT 초) 거의 못 움직이면 열린 쪽으로 잠깐 비켜 간다 (detour) */
  var NAV = { cell: 36, probe: 18, stuckT: 0.8, stuckPx: 6, recheck: 0.35 };
  function lineClear(b, x1, y1) {
    var dx = x1 - b.x, dy = y1 - b.y, d = Math.hypot(dx, dy), n = Math.ceil(d / NAV.probe);
    for (var i = 1; i <= n; i++) if (terrainBlocked(b.x + dx * i / n, b.y + dy * i / n, b)) return false;
    return true;
  }
  function navGrid() {
    if (st.nav) return st.nav;
    var C = NAV.cell, R0 = ARENA + 320, W = Math.ceil(R0 * 2 / C), free = new Uint8Array(W * W), ref = { len: 90 };
    for (var j = 0; j < W; j++) for (var i = 0; i < W; i++) free[j * W + i] = terrainBlocked(-R0 + (i + 0.5) * C, -R0 + (j + 0.5) * C, ref) ? 0 : 1;
    st.nav = { W: W, R0: R0, C: C, free: free };
    return st.nav;
  }
  function navCell(N, x, y) { return [U.clamp(Math.floor((x + N.R0) / N.C), 0, N.W - 1), U.clamp(Math.floor((y + N.R0) / N.C), 0, N.W - 1)]; }
  function nearFree(N, c) {
    if (N.free[c[1] * N.W + c[0]]) return c;
    for (var r = 1; r < 8; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      var x = c[0] + dx, y = c[1] + dy; if (x < 0 || y < 0 || x >= N.W || y >= N.W) continue;
      if (N.free[y * N.W + x]) return [x, y];
    }
    return null;
  }
  /** 격자 A* — 배 자리에서 목표까지의 굽이 [[x,y]…] (못 찾으면 null) */
  function navPath(b, gx, gy) {
    var N = navGrid(), W = N.W, s0 = nearFree(N, navCell(N, b.x, b.y)), t0 = nearFree(N, navCell(N, gx, gy));
    if (!s0 || !t0) return null;
    var si = s0[1] * W + s0[0], ti = t0[1] * W + t0[0], g = new Float32Array(W * W), came = new Int32Array(W * W), seen = new Uint8Array(W * W);
    for (var k = 0; k < g.length; k++) g[k] = 1e9;
    g[si] = 0; came[si] = -1;
    // 작은 이진 힙 (열린 칸)
    var hk = [], hv = [];
    function hpush(key, v) { var i = hk.length; hk.push(key); hv.push(v); while (i > 0) { var p = (i - 1) >> 1; if (hk[p] <= key) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = key; hv[i] = v; }
    function hpop() { var top = hv[0], lk = hk.pop(), lv = hv.pop(), n = hk.length; if (n) { var i = 0; for (;;) { var l = 2 * i + 1, r = l + 1, m = i, mk = lk; if (l < n && hk[l] < mk) { m = l; mk = hk[l]; } if (r < n && hk[r] < mk) { m = r; mk = hk[r]; } if (m === i) break; hk[i] = hk[m]; hv[i] = hv[m]; i = m; } hk[i] = lk; hv[i] = lv; } return top; }
    hpush(0, si);
    var DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1], DC = [1, 1, 1, 1, 1.414, 1.414, 1.414, 1.414], found = false, guard = 0;
    while (hk.length && guard++ < 60000) {
      var cur = hpop();
      if (seen[cur]) continue; seen[cur] = 1;
      if (cur === ti) { found = true; break; }
      var cx = cur % W, cy = (cur - cx) / W;
      for (var d = 0; d < 8; d++) {
        var nx = cx + DX[d], ny = cy + DY[d]; if (nx < 0 || ny < 0 || nx >= W || ny >= W) continue;
        var ni = ny * W + nx; if (!N.free[ni] || seen[ni]) continue;
        if (d >= 4 && (!N.free[cy * W + nx] || !N.free[ny * W + cx])) continue;
        var ng = g[cur] + DC[d]; if (ng >= g[ni]) continue;
        g[ni] = ng; came[ni] = cur;
        hpush(ng + Math.hypot(nx - t0[0], ny - t0[1]), ni);
      }
    }
    if (!found) return null;
    var pts = [];
    for (var c = ti; c !== -1; c = came[c]) { var x = c % W; pts.push([-N.R0 + (x + 0.5) * N.C, -N.R0 + ((c - x) / W + 0.5) * N.C]); }
    pts.reverse(); pts.push([gx, gy]);
    return pts;
  }
  /** 이번 걸음에 향할 곳: 목표까지 곧게 트였으면 목표, 아니면 물길의 다음 굽이 */
  function navGoal(b, goal) {
    if (b.detour && st.t < b.detour.until) return [b.x + Math.cos(b.detour.a) * 200, b.y + Math.sin(b.detour.a) * 200];
    b.detour = null;
    if (!st.terrain || !st.terrain.hasLand) return goal;
    if (st.t >= (b.navT || 0)) { b.navT = st.t + NAV.recheck; b.navOpen = lineClear(b, goal[0], goal[1]); }
    if (b.navOpen) { b.route = null; return goal; }
    var r = b.route;
    if (!r || Math.hypot(r.gx - goal[0], r.gy - goal[1]) > 120 || st.t - r.t > 4) {
      var pts = navPath(b, goal[0], goal[1]);
      r = b.route = pts ? { gx: goal[0], gy: goal[1], pts: pts, i: 0, t: st.t } : null;
      if (!r) return goal;
    }
    while (r.i < r.pts.length - 1 && (Math.hypot(r.pts[r.i][0] - b.x, r.pts[r.i][1] - b.y) < 45 || lineClear(b, r.pts[r.i + 1][0], r.pts[r.i + 1][1]))) r.i++;
    return r.pts[r.i];
  }
  /** 한동안 거의 못 움직였으면(해안에 붙음) 열린 쪽으로 잠깐 비켜 간다 */
  function unstick(b, want, moving, dt) {
    if (!moving) { b.stk = null; return; }
    if (!b.stk) b.stk = { x: b.x, y: b.y, t: 0, n: 0 };
    b.stk.t += dt;
    if (b.stk.t < NAV.stuckT) return;
    var moved = Math.hypot(b.x - b.stk.x, b.y - b.stk.y);
    if (moved < NAV.stuckPx) {
      b.stk.n++;
      var best = null;
      for (var k = 1; k <= 16 && best == null; k++) {
        var off = Math.ceil(k / 2) * (Math.PI / 8) * (k % 2 ? 1 : -1) * (b.stk.n % 2 ? 1 : -1), a = want + off;
        if (!terrainBlocked(b.x + Math.cos(a) * 40, b.y + Math.sin(a) * 40, b) && !terrainBlocked(b.x + Math.cos(a) * 80, b.y + Math.sin(a) * 80, b)) best = a;
      }
      if (best != null) { b.detour = { a: best, until: st.t + 0.9 + Math.min(1.5, b.stk.n * 0.3) }; b.route = null; b.navT = 0; }
      if (b.stk.n > 0 && b.heading != null && best == null) b.heading += Math.PI / 2;   // 사방이 막혔으면 뱃머리를 돌려 본다
    } else b.stk.n = 0;
    b.stk.x = b.x; b.stk.y = b.y; b.stk.t = 0;
  }

  // ---------------------------------------------------------------- setup
  function enemyFleet(npc) {
    if (npc.monster && G.SeaMonsters) return [G.SeaMonsters.enemy(npc)];
    var s = S(), n = npc.n || 1, list = [];
    var fameK = npc.K != null ? npc.K : Math.min(1, s.player.fame / ((G.BALANCE && G.BALANCE.pirateFame) || 4000));   // 해적은 명성과 우리 함대 크기로 정한 세기 (sea.js pirateK)
    var zone = npc.zone || G.Ships.zone(s.loc.lon, s.loc.lat);
    var types = npc.ships && npc.ships.length === n ? npc.ships : G.Ships.enemyTypes(npc.kind, zone, npc.nation, n, fameK, s.date.y);
    var pname = npc.kind === 'pirate' ? (zone === 'east' ? '왜구선 ' : '해적선 ') : npc.kind === 'navy' ? (npc.nation || '') + ' 군함 ' : '상선 ';
    for (var i = 0; i < n; i++) {
      var t = G.SHIP[types[i]] || G.SHIP.caravel;
      var gun = npc.gun || (npc.kind === 'navy' ? U.pick(['culverin', 'perrier', 'cannon']) : npc.kind === 'pirate' ? U.pick(['saker', 'perrier', 'culverin']) : 'saker');   // npc.gun: 큰 해전에서 정해 준 대포 (무적함대 = 카논포)
      // 해적: 처음(세기 0)에는 선원이 정원의 22%, 포문의 40~60%만 채운 작은 무리 — 세기 1이면 88%, 70~90% (G.BALANCE.pirateCrew)
      var pc = (G.BALANCE && G.BALANCE.pirateCrew) || [0.38, 0.5];
      var crew = Math.round(t.crew[1] * (npc.crewK ? npc.crewK * U.rf(0.9, 1.05) : npc.kind === 'pirate' ? (pc[0] + pc[1] * fameK) * U.rf(0.85, 1.15) : U.rf(0.45, 0.8)));
      var gunK = npc.gunK || (npc.kind === 'merchant' ? 0.3 : npc.kind === 'pirate' ? Math.min(0.9, U.rf(0.4, 0.6) + 0.3 * fameK) : U.rf(0.5, 0.9));   // npc.crewK·gunK: 큰 해전의 선원·포문 비율
      list.push({ type: t.id, name: (npc.names && npc.names[i]) || pname + (i + 1) + '호', hp: t.hp, maxHp: t.hp, crew: crew, crewMax: t.crew[1], guns: { type: gun, n: Math.max(1, Math.round(t.ports * gunK)) }, sails: t.sails.slice() });
    }
    return list;
  }
  function makeShip(src, side, i, n) {
    var t = G.SHIP[src.type];
    var len = (58 + Math.min(1000, t.cap) / 14) * 1.5 * (t.len || 1);
    var x = side === 'me' ? -380 : 380, y = (i - (n - 1) / 2) * 150;
    var b = {
      side: side, src: src, name: src.name, type: src.type, x: x + U.rf(-30, 30), y: y + U.rf(-20, 20), heading: side === 'me' ? 0 : Math.PI,
      hp: src.hp, maxHp: src.maxHp, crew: 0, crew0: 0, guns: { type: src.guns.type, n: src.guns.n }, sails: src.sails, len: len,
      reload: [U.rf(0, 2), U.rf(0, 2), U.rf(0, 2)], alive: true, captured: false, fled: false, target: null, moveTo: null, sink: 0, flag: i === 0, no: i + 1, speedK: t.spd, turn: t.turn || 1,
      t: t, tr: t.traits, ramCd: 0, bulk: false,
      vel: null, spd: 0, lat: 0, turnRate: 0,
      fx: G.SeaFX ? G.SeaFX.create({ spacing: BFX.wakeSpacing, life: BFX.wakeLife, maxPoints: 280, kz: 1 }) : null   // 해전 좌표(px)와 해전 시간(1.5초 = 물보라의 하루)으로
    };
    if (src.monster && G.SeaMonsters) G.SeaMonsters.decorate(b, src);
    return b;
  }

  // 배끼리 가리키는 목표·포탄은 번호로 바꾼다. 그림·입력·길찾기 캐시는 불러올 때 다시 만든다.
  B.saveBlocked = function () { return !!(st && battleState === S() && (st.busy || st.over)); };
  B.snapshot = function () {
    if (!st || battleState !== S()) return null;
    // 튜토리얼 해적과의 연습 해전은 지면 시작 전으로 되돌린다(tutorial.js check). 그 사본은 메모리에만 있으므로 일지에는 해전 앞(바다)으로 남긴다.
    if (st.npc && st.npc.tut) return null;
    if (B.saveBlocked()) throw new Error('백병전이나 해전 결과를 처리하는 중에는 잠시 저장할 수 없습니다.');
    var out = { v: 1 };
    Object.keys(st).forEach(function (k) {
      if (['ships', 'fx', 'seaArt', 'seaArtRect', 'nav', 'terrain', 'unkey', 'arrows', 'mouse', 'shaker'].indexOf(k) < 0) out[k] = st[k];
    });
    out.ships = st.ships.map(function (b) {
      var sh = {};
      Object.keys(b).forEach(function (k) { if (['src', 't', 'tr', 'fx', 'ride', 'rig', 'trem'].indexOf(k) < 0) sh[k] = b[k]; });
      sh.fleetIndex = S().fleet.ships.indexOf(b.src);
      if (sh.fleetIndex < 0 && !b.escort) sh.src = b.src;
      return sh;
    });
    return JSON.parse(JSON.stringify(out, function (k, value) {
      var i = st.ships.indexOf(value);
      return i < 0 ? value : { battleShip: i };
    }));
  };
  function restoreBattle(saved) {
    st = U.clone(saved); delete st.v; delete st.shaker;
    var ships = st.ships;
    function refs(value) {
      if (!value || typeof value !== 'object') return value;
      if (Object.keys(value).length === 1 && value.battleShip != null) return ships[value.battleShip] || null;
      Object.keys(value).forEach(function (k) { value[k] = refs(value[k]); });
      return value;
    }
    refs(st);
    ships.forEach(function (b) {
      b.src = b.fleetIndex >= 0 ? S().fleet.ships[b.fleetIndex] : b.escort && G.Escort ? G.Escort.ship() : b.src;
      delete b.fleetIndex;
      b.t = G.SHIP[b.type]; b.tr = b.monster ? [] : b.t.traits;
      delete b.trem;
      b.fx = G.SeaFX ? G.SeaFX.create({ spacing: BFX.wakeSpacing, life: BFX.wakeLife, maxPoints: 280, kz: 1 }) : null;
    });
    st.fx = []; st.busy = 0;
    delete S().battle;
  }

  B.enter = function (arg) {
    var s = S(), npc = arg.npc || { kind: 'pirate', n: 1 };
    battleState = s;
    if (G.Audio) setTimeout(function () { if (G.Audio) G.Audio.sfx('drums'); }, 350);   // 해전이 시작된다: 북소리
    G.Game.showLayers(true, true, false);
    G.Game.ensureRenderer();
    st = { cx: 0, cy: 0, npc: npc, t: 0, ships: [], fx: [], balls: [], paused: false, over: false, mode: 'follow', sel: null, busy: 0, log: [], fled: 0, center: npc.center ? { lon: npc.center.lon, lat: npc.center.lat } : { lon: s.loc.lon, lat: s.loc.lat }, seaArt: null, spare: 0 };   // npc.center: 그 자리가 아닌 물 위에서 (호수의 큰 싸움)
    if (arg.battle) {
      restoreBattle(arg.battle); npc = st.npc;
    } else {
      // player ships & crew distribution
      var f = s.fleet, totMax = R.crewMax();
      if (npc.myFleet && npc.myFleet.length) {
        // 이 싸움에서만 모는 배 (아즈텍 호수의 브리건틴·카누 — js/systems/aztec.js): 내 함대는 뭍에 두고, 선원이 이 배들에 나누어 탄다. 남은 선원은 기다린다
        var mine = npc.myFleet.map(function (a, i) {
          var t = G.SHIP[a.type] || G.SHIP.pinnace;
          return { type: t.id, name: a.name, hp: t.hp, maxHp: t.hp, crewMax: t.crew[1], guns: { type: a.gun || 'saker', n: Math.max(1, Math.round(t.ports * 0.9)) }, sails: t.sails.slice(), admiral: i === 0, lent: true };
        });
        var cap = U.sum(mine, function (x) { return x.crewMax; }), put = Math.min(f.crew, cap);
        st.spare = f.crew - put;
        mine.forEach(function (sh, i) {
          var b = makeShip(sh, 'me', i, mine.length);
          b.crew = b.crew0 = Math.max(1, Math.round(put * sh.crewMax / Math.max(1, cap)));
          st.ships.push(b);
        });
      } else f.ships.forEach(function (sh, i) {
        var b = makeShip(sh, 'me', i, f.ships.length);
        if (npc.myGun && b.guns.n > 0) b.guns.type = npc.myGun;   // 큰 해전에서 빌려 실은 대포 (드레이크의 캘버린포) — 이 싸움에서만, 배의 대포는 그대로
        b.crew = b.crew0 = Math.max(1, Math.round(f.crew * sh.crewMax / Math.max(1, totMax)));
        st.ships.push(b);
      });
      var myN = st.ships.length;
      // 호위하는 상선: 우리 편이지만 내 배가 아니다 — 제 선원으로 싸우고, 기함 뒤에 숨는다 (js/systems/escort.js)
      var escSh = G.Escort && !npc.myFleet ? G.Escort.ship() : null;
      if (escSh) { var eb = makeShip(escSh, 'me', myN, myN + 1); eb.flag = false; eb.escort = true; eb.crew = eb.crew0 = escSh.crew || G.SHIP[escSh.type].crew[0]; st.ships.push(eb); }
      // 큰 해전의 우리 편 함대 (무적함대·레판토 — js/systems/relations.js G.Rel.greatBattle): 우리 편이지만 내 배가 아니다 — 제 선원으로 제멋대로 싸운다
      (npc.allies || []).forEach(function (a, i) {
        var t = G.SHIP[a.type] || G.SHIP.galleon, src = { type: t.id, name: a.name, hp: t.hp, maxHp: t.hp, crew: t.crew[1], guns: { type: a.gun || 'culverin', n: Math.max(4, Math.round(t.ports * 0.85)) }, sails: t.sails.slice() };
        var ab = makeShip(src, 'me', myN + 1 + i, myN + 1 + npc.allies.length); ab.flag = false; ab.ally = true; ab.order = 'free'; ab.crew = ab.crew0 = Math.round(t.crew[1] * 0.85); st.ships.push(ab);
      });
      var en = enemyFleet(npc);
      en.forEach(function (sh, i) { var b = makeShip(sh, 'en', i, en.length); b.crew = b.crew0 = sh.crew; st.ships.push(b); });
      settleStartingShips();
      st.wind = R.wind(s.loc.lon, s.loc.lat, s.date, 0);
      s.stats.battles++;
      // 기함: 양쪽 모두 1번 배. 적 기함을 가라앉히거나 나포하면 이기고, 우리 기함을 잃으면 진다
      st.myFlag = st.ships.filter(function (b) { return b.side === 'me'; })[0] || null;
      st.enFlag = st.ships.filter(function (b) { return b.side === 'en'; })[0] || null;
      st.ships.forEach(function (b) { if (b.side === 'me' && !b.flag && !b.ally) b.order = 'follow'; });   // 큰 해전의 우리 편 함대는 제멋대로 싸운다(free)
    }
    st.terrain = terrainInfo();
    if (G.Img && G.Img.has('battle/rough-sea')) {
      var here = st;
      G.Img.load('battle/rough-sea').then(function (im) { if (im && st === here) { st.seaArt = im; st.seaArtRect = artRect(im); } });
    }
    if (G.ShipSprite) G.ShipSprite.preload(st.ships.map(function (b) { return b.type; }), 3000);
    if (G.SeaMonsterSprite) G.SeaMonsterSprite.preload(st.ships.filter(function (b) { return b.monster; }).map(function (b) { return b.monster; }));
    if (G.WaterSplash) G.WaterSplash.preload();
    buildUI();
    st.pf = 14;   // 첫 장면부터 복원한 내구·선원 정보를 보여 준다.
    if (st.paused) el.pause.innerHTML = G.icon('sail') + '재개';
    var entered = st;
    if (!arg.battle && st.enFlag && st.ships.filter(function (b) { return b.side === 'en'; }).length > 1) setTimeout(function () { if (st === entered && !st.over) UI.toast('적 기함(1번 · ' + st.enFlag.name + ')을 가라앉히거나 나포하면 이깁니다. 우리 기함(1번)을 잃으면 집니다.', 'flag', 5200); }, 600);
    if (!arg.battle && npc.gunNote) setTimeout(function () { if (st === entered && !st.over) UI.toast(npc.gunNote, 'cannon', 6500); }, 6000);
    if (!arg.battle && npc.tacticNote) setTimeout(function () { if (st === entered && !st.over) UI.toast(npc.tacticNote, 'skull', 6500); }, 5600);   // 이름난 해적의 전술 (js/systems/corsairs.js)   // 큰 해전의 대포 이야기 (무적함대: 우리는 멀리, 저들은 세게)
    if (G.Audio) G.Audio.music('battle');
    var foe = npc.monster ? G.SEA_MONSTER_ART[npc.monster].name : npc.kind === 'pirate' ? '해적' : npc.kind === 'navy' ? ((npc.nation ? npc.nation + ' ' : '') + '함대') : '상선단';
    UI.toast(arg.battle ? '저장한 해전을 이어갑니다.' : foe + U.jx(foe, '과/와') + ' 전투가 시작되었다! ' + (st.terrain.hasLand ? '주변 섬과 해안은 통과할 수 없습니다. ' : '') + '방향키로 기함을 몰고 Space로 세웁니다. 바다를 클릭해 움직이고, 적함을 클릭하면 공격합니다.', 'cannon', 5600);
  };
  B.exit = function (next) { if (st && st.unkey) st.unkey(); if (G.Rain && next !== 'sea') G.Rain.leave(); st = null; battleState = null; };
  B.debug = function () { return st; };

  // ---------------------------------------------------------------- UI
  var el = {};
  function buildUI() {
    UI.clearScreen();
    UI.hud.show([{ k: 'title', icon: 'cannon', text: '해전' }, { k: 'me', icon: 'ship', text: '' }, { k: 'en', icon: 'skull', text: '' }, { grow: true }, { k: 'wind', icon: 'wind', text: '' }]);
    var catcher = U.el('div', 'mapcatch'); catcher.style.cssText = 'position:absolute;inset:0;z-index:5;cursor:crosshair';
    catcher.addEventListener('mousedown', onDown);
    catcher.addEventListener('mousemove', function (e) { st.mouse = pos(e); });
    UI.add(catcher);
    var bar = U.el('div', 'sailbar wood brass-frame');
    function btn(label, icon, fn, cls) { var b = U.el('button', 'btn ' + (cls || ''), G.icon(icon) + label); b.onclick = function (e) { e.stopPropagation(); if (!UI.busy() && !st.busy) fn(); }; bar.appendChild(b); return b; }
    el.pause = btn('일시정지', 'pause', function () { B.pause(!st.paused); });
    // 해전 배속: ×1 · ×2 · ×3 (설정에 남는다 · 키 + / −)
    var sp = U.el('div', 'speedctl');
    BSPEEDS.forEach(function (k) { var o = U.el('div', 'opt' + (battleSpeed() === k ? ' on' : ''), '×' + k); o.title = '해전 배속 ×' + k + ' (키 + / −)'; o.dataset.k = k; o.onclick = function (e) { e.stopPropagation(); setBattleSpeed(k); }; sp.appendChild(o); });
    bar.appendChild(sp); el.speed = sp;
    el.board = btn('백병전', 'sword', function () { boardNearest(); }, 'red');
    if (st.npc.monster) { el.board.disabled = true; el.board.title = '해상 괴물에게는 백병전·나포·일기토를 할 수 없습니다.'; }
    el.flee = btn('퇴각', 'boot', function () { st.retreat = true; var f0 = flagship(); if (f0) { f0.steer = null; f0.halt = false; } UI.toast('퇴각! 전장 가장자리로 벗어나십시오.', 'boot'); });
    UI.add(bar);
    el.panel = UI.add(U.el('div', 'battlepanel wood brass-frame', ''));
    buildOrders();
    if (st.unkey) st.unkey();
    st.arrows = {};
    // 방향키·WASD = 기함을 그 방위로 몬다 (두 키 = 대각선) · Space = 기함 정지 · P = 일시정지 · B = 백병전
    st.unkey = UI.pushKey(function (e) {
      if (G.Game.scene !== B || UI.busy()) return false;
      var k = String(e.key).toLowerCase();
      if (G.Keys.is(e, 'confirmAlt')) { if (!e.repeat) haltFlag(); return true; }
      if (G.Keys.is(e, 'cancel') && st.sel) { selectShip(null); return true; }
      var da = directionAction(e);
      if (da) {
        st.arrows[da] = true;
        if (e.repeat) return true;                     // 누른 채 되풀이되는 신호는 무시 (대각선에서 한 키를 먼저 떼도 그대로)
        var a = arrowAngle(); if (a != null) steerFlag(a);
        return true;
      }
      if (k === 'p') { el.pause.click(); return true; }
      if (k === '+' || k === '=' || k === ']') { setBattleSpeed(BSPEEDS[Math.min(BSPEEDS.length - 1, BSPEEDS.indexOf(battleSpeed()) + 1)]); return true; }
      if (k === '-' || k === '_' || k === '[') { setBattleSpeed(BSPEEDS[Math.max(0, BSPEEDS.indexOf(battleSpeed()) - 1)]); return true; }
      if (k === 'b') { boardNearest(); return true; }
      if (/^[1-7]$/.test(k)) { var od = ORDERS[+k - 1]; if (od) giveOrder(od.id); return true; }
      if (k === 'tab' && allies().length) { cycleSel(e.shiftKey ? -1 : 1); return true; }
      return false;
    });
    if (!B._keyHooked) {
      B._keyHooked = true;
      window.addEventListener('keyup', function (e) { if (st && st.arrows) ['left', 'right', 'up', 'down'].forEach(function (a) { if (G.Keys.is(e, a)) st.arrows[a] = false; }); });
      window.addEventListener('blur', function () { if (st) st.arrows = {}; });
    }
  }
  var BSPEEDS = [1, 2, 3];
  /** 해전 배속 (s.settings.battleSpeed — 다음 해전에도 남는다) */
  function battleSpeed() { var s = S(), k = st && st.speedK; if (!k) { k = (s && s.settings && s.settings.battleSpeed) || 1; if (BSPEEDS.indexOf(k) < 0) k = 1; if (st) st.speedK = k; } return k; }
  function setBattleSpeed(k) {
    if (BSPEEDS.indexOf(k) < 0 || !st) return;
    st.speedK = k; var s = S(); if (s && s.settings) s.settings.battleSpeed = k;
    if (el.speed) U.$$('.opt', el.speed).forEach(function (o) { o.classList.toggle('on', +o.dataset.k === k); });
    UI.toast('해전 배속 ×' + k, 'sail', 1200);
  }
  B.speed = function (k) { if (k != null) setBattleSpeed(k); return battleSpeed(); };
  /** 튜토리얼이 싸움을 멈출 때도 단추에 현재 상태를 함께 반영한다. */
  B.pause = function (paused) {
    if (!st) return false;
    st.paused = !!paused;
    if (el.pause) el.pause.innerHTML = G.icon(st.paused ? 'sail' : 'pause') + (st.paused ? '재개' : '일시정지');
    return st.paused;
  };
  // 해전 화면은 y가 아래로 커진다: ↑ = 화면 위(북)
  var ARROWDIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function directionAction(e) { return ['left', 'right', 'up', 'down'].filter(function (a) { return G.Keys.is(e, a); })[0] || null; }
  function arrowAngle() {
    var x = 0, y = 0, a = st.arrows || {};
    for (var k in a) if (a[k] && ARROWDIR[k]) { x += ARROWDIR[k][0]; y += ARROWDIR[k][1]; }
    x = Math.sign(x); y = Math.sign(y);
    return (x || y) ? Math.atan2(y, x) : null;
  }
  /** 방향키: 기함이 그 방위로 계속 나아간다 (클릭한 목적지·공격 목표는 버린다 — 현측에 든 적에게는 알아서 쏜다) */
  function steerFlag(a) {
    var fs = flagship(); if (!fs || st.over) return;
    dropTactic(fs);
    fs.steer = a; fs.halt = false; fs.moveTo = null; fs.target = null; fs.boardIntent = false;
    if (st.paused) el.pause.click();
  }
  /** Space: 기함이 돛을 거두고 선다 (포는 현측에 든 적에게 계속 쏜다) */
  function haltFlag() {
    var fs = flagship(); if (!fs || st.over) return;
    if (fs.halt) { UI.toast('기함이 멈춰 있습니다. 방향키로 몰거나 바다·적함을 클릭하십시오.', 'anchor', 2400); return; }
    dropTactic(fs);
    fs.halt = true; fs.steer = null; fs.moveTo = null; fs.target = null; fs.boardIntent = false;
    UI.toast(fs.name + '호가 돛을 거두고 멈춥니다.', 'anchor', 1800);
  }
  function pos(e) { var r = G.Game.canvases().overlay.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1600, (e.clientY - r.top) / r.height * 900]; }
  function toScreen(x, y) { return [800 + (x - st.cx) * SCALE, 450 + (y - st.cy) * SCALE]; }
  // 클릭 → 세상: 마지막으로 그린 장면의 변환(흔들림 st.qo · 다가옴 st.zkShown)을 거꾸로 풀어 화면에 보인 자리를 그대로 짚는다
  function toWorld(px, py) {
    var zk = st.zkShown || 1, o = st.qo;
    px = 800 + (px - 800) / zk; py = 450 + (py - 450) / zk;
    return [st.cx + (px - 800 - (o ? o[0] : 0)) / SCALE, st.cy + (py - 450 - (o ? o[1] : 0)) / SCALE];
  }
  /** 기함: 우리 1번 배 (지휘·일기토). 기함을 잃으면 해전에 진다 */
  /** 배 이름표: 번호 동그라미(기함은 1번 — 금빛·붉은빛 테와 「기함」 표) + 이름 */
  function drawShipTag(ctx, b, x, y) {
    var me = b.side === 'me', txt = b.name, tw = ctx.measureText(txt).width, r = b.flag ? 11 : 9.5;
    var tagW = b.flag ? 34 : 0, total = r * 2 + 6 + tw + (tagW ? 6 + tagW : 0), x0 = x - total / 2;
    // 번호
    ctx.beginPath(); ctx.arc(x0 + r, y - 5, r, 0, 7);
    ctx.fillStyle = b.flag ? (me ? '#e2b04a' : '#d8503a') : 'rgba(10,14,24,.72)'; ctx.fill();
    ctx.lineWidth = b.flag ? 2 : 1.2; ctx.strokeStyle = b.flag ? '#fff2cc' : (me ? '#b8d0a0' : '#ffb0a0'); ctx.stroke();
    ctx.fillStyle = b.flag ? '#2a1606' : (me ? '#e8f0d8' : '#ffd0c4'); ctx.textAlign = 'center';
    var f0 = ctx.font; ctx.font = '800 ' + (b.flag ? 14 : 12) + 'px ' + getComputedStyle(document.body).fontFamily; ctx.fillText(String(b.no || ''), x0 + r, y); ctx.font = f0;
    // 이름
    ctx.textAlign = 'left'; ctx.fillStyle = me ? '#f2e7cc' : '#ffb0a0'; ctx.fillText(txt, x0 + r * 2 + 6, y);
    // 기함 표
    if (tagW) {
      var tx = x0 + r * 2 + 6 + tw + 6;
      ctx.fillStyle = me ? 'rgba(226,176,74,.9)' : 'rgba(216,80,58,.9)'; ctx.fillRect(tx, y - 13, tagW, 17);
      ctx.fillStyle = '#1a0e04'; var f1 = ctx.font; ctx.font = '800 11px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.fillText(b.monster ? '괴물' : '기함', tx + tagW / 2, y); ctx.font = f1;
    }
    ctx.textAlign = 'center';
  }
  function flagship() {
    var fs = st.myFlag;
    return fs && fs.alive ? fs : null;
  }
  function onDown(e) {
    if (e.button !== 0 || UI.busy() || st.over) return;
    var p = pos(e), w = toWorld(p[0], p[1]), fs = flagship(); if (!fs) return;
    var hit = null, bd = Math.max(50, 34 / (st.vz || 1));     // 화면이 멀어져도 누르기 쉽게
    st.ships.forEach(function (b) { if (!targetable(b) || b.side !== 'en') return; var d = Math.hypot(b.x - w[0], b.y - w[1]); if (d < bd) { bd = d; hit = b; } });
    // 우리 배를 누르면 그 배를 고른다 (기함을 누르면 고르기를 푼다) — 고른 배에게는 적함 클릭 = 그 적을 노림, 바다 클릭 = 그 자리를 지킴
    var mine = null, md = Math.max(46, 30 / (st.vz || 1));
    st.ships.forEach(function (b) { if (!b.alive || b.side !== 'me') return; var d = Math.hypot(b.x - w[0], b.y - w[1]); if (d < md) { md = d; mine = b; } });
    if (mine && !hit) { selectShip(mine.flag || mine === st.sel ? null : mine); return; }
    var sel = st.sel && st.sel.alive ? st.sel : null;
    if (sel) {
      if (hit) { setShipOrder(sel, 'attack', { target: hit }); UI.toast(sel.no + '번 ' + shipLabel(sel) + ' — ' + hit.name + U.jx(hit.name, '을/를') + ' 노립니다.', 'target', 2000); }
      else if (terrainBlocked(w[0], w[1], sel)) UI.toast('그곳은 육지라 배가 갈 수 없습니다.', 'anchor', 2200);
      else { setShipOrder(sel, 'hold', { at: w }); UI.toast(sel.no + '번 ' + shipLabel(sel) + ' — 그 자리로 가서 지킵니다.', 'anchor', 2000); }
      return;
    }
    dropTactic(fs);
    fs.steer = null; fs.halt = false;
    if (hit) { fs.target = hit; fs.moveTo = null; UI.toast(hit.name + U.j(hit.name, '을/를').slice(hit.name.length) + ' 공격합니다.', 'target', 1800); }
    else if (terrainBlocked(w[0], w[1], fs)) UI.toast('그곳은 육지라 배가 갈 수 없습니다.', 'anchor', 2200);
    else { fs.moveTo = w; fs.target = null; }
  }

  // ---------------------------------------------------------------- 타격감: 히트스톱·화면 흔들림·번쩍임·넉백 (조정값 G.FX.impact)
  function IMP() { return (G.FX && G.FX.impact) || { hitstop: 0.07, hitstopTaken: 0.05, hitstopSink: 0.3, hitstopRam: 0.12, hitstopCool: 0.12, shakeFire: 1.5, shakeHit: 5, shakeTaken: 8, shakeSink: 16, shakeClash: 11, shakeRound: 5, shakeDecay: 9, flashFire: 0.04, flashHit: 0.1, flashTaken: 0.16, flashSink: 0.42, flashClash: 0.32, flashRound: 0.12, flashDecay: 9, shipFlash: 0.12, recoil: 4, knock: 14, knockApart: 34, roundDelay: 0.26, numbers: true, debris: 12, sparks: 9, ballArc: 24, zoomHit: 0.015, zoomSink: 0.05, burnAt: 0.55, fireAt: 0.3 }; }
  /** 설정에서 「화면 흔들림·번쩍임」을 끄면 흔들림과 번쩍임은 빠진다 (히트스톱·넉백은 남는다) */
  function feelOn() {
    var s = S(), v = s && s.settings ? s.settings.shake : undefined;
    if (v === false) return false;
    if (v === undefined && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;   // 움직임 줄이기를 켠 컴퓨터는 기본으로 끈다
    return true;
  }
  /* 화면 흔들림: 좌우가 주, 상하가 섞인 이어지는 노이즈(st.shake만큼, 지수로 잦아듦) + 맞을 때마다 짧은 충격 (G.Shake, js/art/quakefx.js).
     같은 폭의 사인파나 장면마다 새로 뽑는 난수(순간이동)는 쓰지 않는다. 충격이 잦아들고 st.shake가 0이면 정확히 0 */
  function shaker() { return st.shaker || (st.shaker = G.Shake ? G.Shake.make((Math.random() * 1e9) | 0, { freq: 13, yk: 0.55 }) : null); }
  function shake(px) {
    if (!st || !feelOn() || !(px > 0)) return;
    st.shake = Math.max(st.shake || 0, px * 0.45);
    var sh = shaker(); if (sh) sh.kick(px, { yk: 0.7 });
  }
  /** 맞은 배 자체도 좌우 위주로 거칠게 떤다 (그림만 — b.x·b.y·뱃머리·충돌은 그대로) */
  function tremor(b, px) {
    if (!b || !feelOn() || !(px > 0) || !G.Shake) return;
    b.trem = b.trem || G.Shake.make((Math.random() * 1e9) | 0, { freq: 16, yk: 0.5 });
    b.trem.kick(px, { f: 9 + Math.random() * 6, tau: 0.07 + Math.random() * 0.07, yk: 0.6 });
    b.trem.kick(px * 0.6, { t0: (performance.now() / 1000) + 0.05 + Math.random() * 0.06, yk: 0.6 });
  }
  /** 공격 한 번에 반동 한 번. 사방 포탄 수만큼 흔들림을 중첩하지 않는다. */
  function attackFeel(b, action) {
    var c = G.FX.waterSplash;
    if (st.attackFeelT == null || st.t - st.attackFeelT >= c.attackGap) {
      shake(c.shake[action] || 0); st.attackFeelT = st.t;
    }
    tremor(b, c.tremor[action] || 0);
  }
  function waterFx(id, b, angle) {
    if (!G.WaterSplash) return;
    var c = G.FX.waterSplash, scale = U.clamp(b.len * c.shipScale, c.minScale, c.maxScale);
    G.WaterSplash.emit(st, id, b.x, b.y, scale, angle == null ? b.heading : angle);
  }
  function flash(a, rgb) { if (!st || !feelOn() || !(a > 0)) return; if (!st.flash || a >= st.flash.a) st.flash = { a: a, c: rgb || '255,244,220' }; }
  /** 히트스톱: 잠깐 모든 배와 포탄을 멈춘다 (흔들림·번쩍임은 그 사이에도 움직인다) */
  function hitstop(t) { if (!st || !(t > 0) || st.hsCool > 0) return; st.hitstop = Math.max(st.hitstop || 0, t); }
  /** 보이는 밀림: 배를 (dx, dy) 쪽으로 px만큼 잠깐 밀었다가 제자리로 (멈춰 있는 동안에도 보인다) */
  function jolt(b, dx, dy, px) { var d = Math.hypot(dx, dy) || 1; b.jx = (b.jx || 0) + dx / d * px; b.jy = (b.jy || 0) + dy / d * px; }
  /** 화면이 살짝 다가온다 (큰 명중·침몰) */
  function zoomKick(z) { if (st && feelOn() && z > 0) st.zoomK = Math.max(st.zoomK || 0, z); }
  /** 피해 숫자: 같은 배에 0.4초 안에 맞은 포탄은 한 숫자로 합친다 (현측 한 번 = 숫자 하나) */
  function dmgNumber(t, dmg, kill) {
    if (!IMP().numbers) return;
    var f = null;
    for (var i = st.fx.length - 1; i >= 0; i--) { var o = st.fx[i]; if (o.kind === 'dmg' && o.ship === t && o.t < 0.4) { f = o; break; } }
    if (!f) { f = { kind: 'dmg', ship: t, x: t.x, y: t.y, dx: U.rf(-12, 12), val: 0, crew: 0, t: 0, life: 1.3 }; st.fx.push(f); }
    f.val += dmg; f.crew += kill || 0; f.popT = f.t; f.big = f.val >= t.maxHp * 0.2;
  }
  /** 포탄이 선체에 맞은 자리: 불덩이·섬광·충격파·나뭇조각·불티·검은 연기 */
  function hitBurst(x, y, dirx, diry, power) {
    var I = IMP(), d = Math.hypot(dirx, diry) || 1, ux = dirx / d, uy = diry / d;
    var budget = st.fx.length > 500 ? 0.3 : 1;          // 큰 해전에서 효과가 너무 쌓이면 조각·불티를 줄인다
    st.fx.push({ kind: 'blast', x: x, y: y, t: 0, life: 0.34, r: 30 + power * 5 });
    st.fx.push({ kind: 'fireball', x: x, y: y, t: 0, life: 0.5, r: 16 + power * 3 });
    for (var i = 0; i < Math.round(I.debris * (0.6 + power * 0.08) * budget); i++) {
      var a = Math.atan2(uy, ux) + U.rf(-1.3, 1.3), sp = U.rf(60, 190);
      st.fx.push({ kind: 'debris', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, h: U.rf(40, 110), rot: U.rf(0, 6.28), vr: U.rf(-12, 12), w: U.rf(3, 8), t: 0, life: U.rf(0.7, 1.15), dark: U.chance(0.4) });
    }
    for (var j = 0; j < Math.round(I.sparks * budget); j++) {
      var b2 = Math.atan2(uy, ux) + U.rf(-1.6, 1.6), sp2 = U.rf(140, 320);
      st.fx.push({ kind: 'spark', x: x, y: y, vx: Math.cos(b2) * sp2, vy: Math.sin(b2) * sp2, t: 0, life: U.rf(0.22, 0.45) });
    }
    for (var k = 0; k < 2; k++) st.fx.push({ kind: 'dsmoke', x: x + U.rf(-6, 6), y: y + U.rf(-6, 6), vx: windDrift()[0] + U.rf(-6, 6), vy: windDrift()[1] + U.rf(-6, 6), r: 8 + power * 1.2, t: 0, life: U.rf(1.8, 2.8) });
  }
  /** 연기가 바람에 밀려가는 방향 (px/초, 화면 좌표) */
  function windDrift() { return [Math.cos(st.wind.dir) * (8 + 18 * st.wind.spd), -Math.sin(st.wind.dir) * (8 + 18 * st.wind.spd)]; }
  B.runtime = function () { return st; };
  B._t = function () { return { prizeFleet: prizeFleet, prizeShip: prizeShip, pirateDrops: pirateDrops, prizeHolds: prizeHolds, prizeLoot: prizeLoot, finish: finish, shake: shake, tremor: tremor, toWorld: toWorld, toScreen: toScreen, geoAt: geoAt, terrainBlocked: terrainBlocked, terrainInfo: terrainInfo, resolveTerrain: resolveTerrain, geoScale: GEO_SCALE, arena: ARENA, navPath: navPath, lineClear: lineClear, shorePad: shorePad, inArena: inArena }; };   // 시험용
  B.feel = function () { return st ? { shake: st.shake || 0, flash: st.flash ? st.flash.a : 0, hitstop: st.hitstop || 0 } : null; };

  // ---------------------------------------------------------------- 함대 명령 (기함을 뺀 배들 — 전체 또는 고른 한 척)
  /* 1 기함 추종 · 2 학익진(적을 반원으로 둘러싸 여러 방향에서 쏜다 — 포위하면 포격이 더 아프다) · 3 일제 공격(한 적에게 다 같이 붙어 한꺼번에 쏜다, 선원이 넉넉하면 올라탄다)
     4 포격전(사정거리 끝에서 포로만, 적이 다가오면 물러난다) · 5 기함 호위(기함 곁을 지키며 기함에 다가오는 적부터) · 6 자유 공격 · 7 물러나기(그 배만 전장을 벗어난다)
     배 하나를 고르면(지도에서 우리 배 클릭·Tab·명령판의 줄) 그 배에게만: 적함 클릭 = 그 적을 노림(attack), 바다 클릭 = 그 자리를 지킴(hold).
     조정값: G.BALANCE.fleetOrders */
  var ORDERS = [
    { id: 'follow', name: '기함 추종', icon: 'people', tip: '기함 뒤로 줄지어 따라가며 기함이 노리는 적을 함께 쏜다.' },
    { id: 'crane', name: '학익진', icon: 'flag', tip: '학이 날개를 펴듯 기함을 가운데 두고 양옆으로 벌려 적을 반원으로 감싼다. 여러 방향에서 쏘면 포격이 더 아프다.' },
    { id: 'focus', name: '일제 공격', icon: 'target', tip: '모두 한 적에게 바짝 붙어 한꺼번에 쏜다(일제 사격). 선원이 넉넉하면 올라탄다.' },
    { id: 'gun', name: '포격전', icon: 'cannon', tip: '사정거리 끝에서 포로만 싸운다. 적이 다가오면 물러나 백병전을 피한다.' },
    { id: 'guard', name: '기함 호위', icon: 'shield', tip: '기함 곁을 둘러싸고, 기함에 다가오는 적부터 쏜다.' },
    { id: 'free', name: '자유 공격', icon: 'sword', tip: '배마다 가장 가까운 적과 알아서 싸운다.' },
    { id: 'retreat', name: '물러나기', icon: 'boot', tip: '그 배만 적에게서 먼 쪽으로 전장을 벗어난다 (배는 잃지 않는다).' }
  ];
  var ORDER_NAME = { attack: '노림', hold: '자리 지킴' };
  ORDERS.forEach(function (o) { ORDER_NAME[o.id] = o.name; });
  B.ORDERS = ORDERS;
  function FO() { return (G.BALANCE && G.BALANCE.fleetOrders) || {}; }
  function allies() { return st ? st.ships.filter(function (b) { return b.side === 'me' && b.alive && !b.flag; }) : []; }
  function setShipOrder(b, id, o) {
    o = o || {};
    b.order = id; b.otarget = o.target || null; b.hold = o.at || null;
    b.moveTo = null; b.target = null; b.boardIntent = false; b.close = 1; b.steer = null; b.halt = false;
  }
  /** 명령을 내린다: 고른 배가 있으면 그 배에게, 없으면 기함을 뺀 모든 배에게 */
  function giveOrder(id) {
    if (!st || st.over) return;
    var list = st.sel && st.sel.alive ? [st.sel] : allies();
    if (!list.length) { soloOrder(id); return; }
    if (st.retreat && id !== 'retreat') st.retreat = false;            // 전체 퇴각을 거두고 다시 싸운다
    list.forEach(function (b) { setShipOrder(b, id); });
    var od = ORDERS.filter(function (x) { return x.id === id; })[0];
    var who = list.length === 1 && st.sel ? list[0].no + '번 ' + shipLabel(list[0]) : '함대';
    UI.toast(who + ' — ' + (od ? od.name : id) + '!' + (id === 'crane' ? ' 날개를 펴 적을 감쌉니다.' : id === 'focus' ? ' 한 적에게 일제히 덤빕니다.' : id === 'gun' ? ' 멀리서 포로만 싸웁니다.' : ''), od ? od.icon : 'flag', 2200);
    if (st.paused) el.pause.click();
    st.ordersSig = null; refreshOrders();
  }
  /* 기함 혼자일 때(함께 싸울 배가 없거나 모두 잃었을 때): 같은 명령판이 「기함 전술」이 된다.
     3 일제 공격 = 돌격(적 기함에 바짝 붙어 쏘고, 선원이 넉넉하면 올라탐) · 4 포격전 = 포격 중심(사정거리 끝에서 포로만, 다가오면 물러남)
     6 자유 공격 = 가까운 적과 알아서 · 7 물러나기 = 퇴각. 1 기함 추종 = 직접 조종으로 돌아감. 학익진·기함 호위는 배가 2척 이상일 때.
     방향키·Space·바다/적함 클릭으로 직접 몰면 전술을 풀고 직접 조종으로 돌아간다. */
  var SOLO = { focus: '돌격', gun: '포격 중심', free: '자동 교전' };
  function solo() { return !allies().length; }
  function dropTactic(fs) {
    if (!fs || !fs.tactic) return;
    fs.tactic = null; fs.close = 1; fs.boardIntent = false;
    UI.toast('직접 조종 — 기함 전술을 풉니다.', 'ship', 1600);
    if (st) { st.ordersSig = null; refreshOrders(); }
  }
  function soloOrder(id) {
    var fs = flagship(); if (!fs) return;
    if (id === 'crane' || id === 'guard') { UI.toast((id === 'crane' ? '학익진' : '기함 호위') + '은 함께 싸울 배가 있어야 합니다 (함대 2척 이상).', 'flag', 2600); return; }
    if (id === 'retreat') { el.flee.click(); return; }
    if (st.retreat) st.retreat = false;
    if (id === 'follow') { if (fs.tactic) dropTactic(fs); else UI.toast('직접 조종 중입니다. 방향키로 몰거나 바다·적함을 클릭하십시오.', 'ship', 2200); return; }
    fs.tactic = id; fs.steer = null; fs.halt = false; fs.moveTo = null; fs.target = null; fs.boardIntent = false;
    UI.toast('기함 — ' + SOLO[id] + '!' + (id === 'gun' ? ' 사정거리 끝에서 포로만 싸우고, 적이 다가오면 물러납니다.' : id === 'focus' ? ' 적 기함에 바짝 붙어 쏘고, 선원이 넉넉하면 올라탑니다.' : ' 가까운 적과 알아서 싸웁니다.') + ' (직접 몰면 풀림)', id === 'gun' ? 'cannon' : id === 'focus' ? 'target' : 'sword', 2600);
    if (st.paused) el.pause.click();
    st.ordersSig = null; refreshOrders();
  }
  function selectShip(b) { st.sel = b && b.alive ? b : null; if (st.sel) UI.toast(st.sel.no + '번 ' + shipLabel(st.sel) + U.jx(shipLabel(st.sel), '을/를') + ' 골랐다. 적함 클릭 = 노림 · 바다 클릭 = 자리 지킴 · 1~7 = 이 배에만 명령 · Esc = 풀기', 'ship', 3200); st.ordersSig = null; refreshOrders(); }
  function cycleSel(dir) {
    var a = allies(); if (!a.length) return;
    var i = st.sel ? a.indexOf(st.sel) : -1, n = i + dir;
    selectShip(n < 0 || n >= a.length ? null : a[n]);
  }
  /** 함대가 노릴 적: 기함이 노리는 적 → 적 기함 → 우리 기함에 가장 가까운 적 */
  function mainTarget(foes) {
    var fs = flagship();
    if (fs && fs.target && fs.target.alive) return fs.target;
    if (st.enFlag && st.enFlag.alive) return st.enFlag;
    var ref = fs || allies()[0]; if (!ref) return foes[0];
    return foes.slice().sort(function (p, q) { return Math.hypot(p.x - ref.x, p.y - ref.y) - Math.hypot(q.x - ref.x, q.y - ref.y); })[0];
  }
  /** 정한 자리(slot)에 이르면 그 둘레를 천천히 돌며 옆구리(현측)를 과녁으로 돌린다 */
  function slotGoal(b, slot, aim, dirSign) {
    var d = Math.hypot(slot[0] - b.x, slot[1] - b.y);
    if (d > (FO().slotR || 70)) return slot;
    var a = Math.atan2(aim[1] - slot[1], aim[0] - slot[0]) + (dirSign || 1) * Math.PI / 2;
    return [slot[0] + Math.cos(a) * 110, slot[1] + Math.sin(a) * 110];
  }
  function allyThink(b, foes, near) {
    var K = FO(), o = b.order || 'follow', fs = flagship();
    b.close = 1;
    if (b.escort && o !== 'retreat') {
      // 호위하는 상선은 명령과 상관없이 적의 반대쪽, 기함 뒤에 숨는다 (가까이 온 적에게는 쏜다)
      var cx0 = 0, cy0 = 0; foes.forEach(function (q) { cx0 += q.x; cy0 += q.y; }); cx0 /= foes.length; cy0 /= foes.length;
      var ref = fs || b, ux = ref.x - cx0, uy = ref.y - cy0, ul = Math.hypot(ux, uy) || 1, back = ((G.BALANCE || {}).escort || {}).back || 260;
      b.moveTo = [ref.x + ux / ul * back, ref.y + uy / ul * back]; b.target = near; b.boardIntent = false;
      return;
    }
    if (o === 'attack') { if (b.otarget && b.otarget.alive) { b.target = b.otarget; b.moveTo = null; return; } o = b.order = 'free'; b.otarget = null; }
    if (o === 'hold') {
      if (!b.hold) { o = b.order = 'free'; }
      else { b.target = near; var dh = Math.hypot(b.hold[0] - b.x, b.hold[1] - b.y); b.moveTo = dh > 40 ? b.hold : slotGoal(b, b.hold, [near.x, near.y], b.no % 2 ? 1 : -1); return; }
    }
    if (o === 'retreat') {
      var ex = 0, ey = 0; foes.forEach(function (f) { ex += f.x; ey += f.y; }); ex /= foes.length; ey /= foes.length;
      var ax = b.x - ex, ay = b.y - ey, al = Math.hypot(ax, ay) || 1;
      b.moveTo = [b.x + ax / al * 3000, b.y + ay / al * 3000]; b.target = null; return;
    }
    if (o === 'free' || !fs) { b.target = near; b.moveTo = null; return; }
    var mates = allies().filter(function (x) { return (x.order || 'follow') === o; }), idx = mates.indexOf(b);
    if (o === 'follow') {
      var all = st.ships.filter(function (x) { return x.side === 'me' && x.alive; }), fi = all.indexOf(b);
      b.moveTo = [fs.x - Math.cos(fs.heading) * 110 * fi, fs.y - Math.sin(fs.heading) * 110 * fi + (fi % 2 ? 60 : -60)]; b.target = fs.target && fs.target.alive ? fs.target : null;
      return;
    }
    var T = mainTarget(foes);
    if (o === 'crane') {
      // 학익진: 기함을 가운데에 두고 양 날개로 벌려 적을 반원으로 감싼다 (홀수 번째는 오른쪽, 짝수 번째는 왼쪽 날개)
      var th0 = Math.atan2(fs.y - T.y, fs.x - T.x), step = K.craneStep || 0.62, wing = Math.ceil((idx + 1) / 2), sgn = idx % 2 ? -1 : 1;
      var th = th0 + sgn * Math.min(wing * step, K.craneMax || 1.45), R0 = gunRange(b) * (K.craneR || 0.72);
      var slot = [T.x + Math.cos(th) * R0, T.y + Math.sin(th) * R0];
      b.target = T; b.moveTo = slotGoal(b, slot, [T.x, T.y], sgn); b.crane = { T: T, th: th, R: R0 };
      return;
    }
    if (o === 'focus') {
      b.target = T; b.moveTo = null; b.close = K.focusR || 0.55;
      b.boardIntent = !T.monster && !has(T, 'spikes') && b.crew > T.crew * (K.board || 1.5) && b.crew >= 8;
      return;
    }
    if (o === 'gun') {
      // 포격전: 사정거리 끝을 지키고, 적이 가까이 오면(백병전 거리의 몇 배) 물러난다
      var keep = K.gunKeep || 170, close = null, cd = keep;
      foes.forEach(function (f) { var d = Math.hypot(f.x - b.x, f.y - b.y); if (d < cd) { cd = d; close = f; } });
      if (close) { var dx = b.x - close.x, dy = b.y - close.y, dl = Math.hypot(dx, dy) || 1; b.moveTo = [b.x + dx / dl * 260, b.y + dy / dl * 260]; b.target = close; }
      else { b.target = near; b.moveTo = null; b.close = K.gunR || 1.05; }
      return;
    }
    if (o === 'guard') {
      // 호위: 기함 둘레의 자리를 지키며 기함에 다가오는 적부터 쏜다
      var n = Math.max(1, mates.length), ga = fs.heading + Math.PI + (idx - (n - 1) / 2) * (Math.PI * 1.6 / Math.max(1, n)) + (n === 1 ? Math.PI / 2 : 0);
      var gr = K.guardR || 120, gslot = [fs.x + Math.cos(ga) * gr, fs.y + Math.sin(ga) * gr];
      var threat = null, td = gunRange(b) * 1.3;
      foes.forEach(function (f) { var d = Math.hypot(f.x - fs.x, f.y - fs.y); if (d < td) { td = d; threat = f; } });
      b.target = threat || near;
      b.moveTo = Math.hypot(gslot[0] - b.x, gslot[1] - b.y) > 60 ? gslot : null;
      if (!b.moveTo && !threat) b.moveTo = gslot;
      return;
    }
    b.target = near; b.moveTo = null;
  }
  /** 포위·일제 사격의 힘: 우리 배들이 한 적을 여러 방향에서 쏘거나(학익진), 함께 한 적을 노려 쏘면(일제 공격) 포탄이 더 아프다 */
  function envelop(t, side) {
    side = side || 'me';
    if (t.envT != null && t.envS === side && st.t - t.envT < 0.4) return t.envK;
    var K = FO(), bs = [];
    st.ships.forEach(function (m) { if (m.side !== side || !m.alive) return; if (Math.hypot(m.x - t.x, m.y - t.y) < gunRange(m) * 1.15) bs.push(Math.atan2(m.y - t.y, m.x - t.x)); });
    var k = 1;
    if (bs.length >= 2) {
      bs.sort(function (a, c) { return a - c; });
      var gap = 0; for (var i = 0; i < bs.length; i++) gap = Math.max(gap, (i + 1 < bs.length ? bs[i + 1] : bs[0] + Math.PI * 2) - bs[i]);
      var cover = Math.PI * 2 - gap, sp = K.envSpread || [1.6, 2.6], ek = K.envelop || [0.2, 0.35];
      if (bs.length >= 3 && cover >= sp[1]) k = 1 + ek[1]; else if (cover >= sp[0]) k = 1 + ek[0];
    }
    if (k > 1 && !t.envLogged) { t.envLogged = true; log((side === 'en' ? '적 함대가 ' + t.name + U.jx(t.name, '을/를') + ' 학익진으로 에워쌌다! 사방에서 포탄이 쏟아진다' : t.name + U.jx(t.name, '을/를') + ' 에워쌌다! 여러 방향에서 포탄이 쏟아진다') + '. (포격 +' + Math.round((k - 1) * 100) + '%)'); }
    t.envT = st.t; t.envK = k; t.envS = side;
    return k;
  }
  function orderDmg(b, t) {
    var k = envelop(t);
    if (b.order === 'focus' || b.order === 'attack') {
      var n = st.ships.filter(function (m) { return m.side === 'me' && m.alive && m.target === t && Math.hypot(m.x - t.x, m.y - t.y) < gunRange(m); }).length;
      if (n >= 2) k *= 1 + (FO().volley || 0.15);
    }
    return k;
  }
  // 명령판 (오른쪽 위)
  function buildOrders() {
    el.cmd = UI.add(U.el('div', 'ordpanel wood brass-frame', ''));
    var head = U.el('div', 'fp-h', G.icon('flag') + '함대 명령 <small class="cream-muted" data-k="who">— 기함을 뺀 배 모두</small>');
    el.cmd.appendChild(head); el.cmdWho = head.querySelector('[data-k=who]');
    var grid = U.el('div', 'ord-grid');
    el.cmdBtns = {};
    ORDERS.forEach(function (o, i) {
      var bt = U.el('button', 'btn small ord-btn', '<span class="ord-key">' + (i + 1) + '</span>' + G.icon(o.icon) + o.name);
      bt.title = o.tip;
      bt.onclick = function (e) { e.stopPropagation(); if (!UI.busy() && !st.busy) giveOrder(o.id); };
      grid.appendChild(bt); el.cmdBtns[o.id] = bt;
    });
    el.cmd.appendChild(grid);
    el.cmdList = U.el('div', 'ord-list'); el.cmd.appendChild(el.cmdList);
    el.cmdList.addEventListener('click', function (e) {
      var row = e.target.closest('[data-no]'); if (!row || UI.busy() || st.busy) return; e.stopPropagation();
      var b = st.ships.filter(function (x) { return x.side === 'me' && x.no === +row.getAttribute('data-no'); })[0];
      if (b && b.alive) selectShip(st.sel === b ? null : b);
    });
    el.cmdHint = el.cmd.appendChild(U.el('div', 'ord-hint cream-muted', ''));
    st.ordersSig = null; refreshOrders();
  }
  function refreshOrders() {
    if (!st || !el.cmd) return;
    if (st.sel && !st.sel.alive) st.sel = null;
    var mine = st.ships.filter(function (b) { return b.side === 'me' && !b.flag; });
    var fs0 = flagship(), one = solo();
    var sig = (st.sel ? st.sel.no : 0) + '|' + (one ? 'solo:' + (fs0 && fs0.tactic || '') : '') + '|' + mine.map(function (b) { return b.no + ':' + (b.alive ? b.order + (b.otarget ? b.otarget.no : '') : b.sunk ? 's' : 'x'); }).join(',');
    if (sig === st.ordersSig) return;
    st.ordersSig = sig;
    el.cmd.classList.toggle('solo', one);
    el.cmdHint.textContent = one ? '기함 혼자: 3 돌격 · 4 포격 중심 · 6 자동 교전 — 방향키·클릭으로 직접 몰면 풀립니다. 학익진·호위는 배가 2척 이상일 때.' : '배를 고르면(줄·지도에서 클릭·Tab) 그 배에게만 — 적함 클릭: 노림 · 바다 클릭: 자리 지킴 · Esc: 풀기';
    if (one) {
      // 기함 혼자: 기함 전술 (학익진·호위는 배가 2척 이상일 때)
      el.cmdWho.textContent = '— 기함 전술 (함께 싸울 배 없음)';
      var tac = fs0 && fs0.tactic;
      ORDERS.forEach(function (o) {
        var bt = el.cmdBtns[o.id], off = o.id === 'crane' || o.id === 'guard';
        bt.classList.toggle('off', off); bt.classList.toggle('on', o.id === 'follow' ? !tac : o.id === tac);
        bt.title = off ? '함께 싸울 배가 있어야 합니다 (함대 2척 이상).' : o.id === 'follow' ? '직접 조종: 방향키·클릭으로 기함을 몹니다.' : o.id === 'retreat' ? '함대 퇴각' : SOLO[o.id] + ' — ' + o.tip;
        bt.lastChild.textContent = o.id === 'follow' ? '직접 조종' : SOLO[o.id] || (o.id === 'retreat' ? '퇴각' : o.name);
      });
    } else {
      ORDERS.forEach(function (o) { var bt = el.cmdBtns[o.id]; bt.classList.remove('off'); bt.title = o.tip; bt.lastChild.textContent = o.name; });
    }
    if (!one) el.cmdWho.textContent = st.sel ? '— ' + st.sel.no + '번 ' + shipLabel(st.sel) + '에게만' : '— 기함을 뺀 배 모두';
    var cur = st.sel ? [st.sel] : mine.filter(function (b) { return b.alive; });
    if (!one) ORDERS.forEach(function (o) { el.cmdBtns[o.id].classList.toggle('on', cur.length > 0 && cur.every(function (b) { return b.order === o.id; })); });
    el.cmdList.innerHTML = mine.map(function (b) {
      var tx = !b.alive ? (b.sunk ? '침몰' : b.fled ? '이탈' : '상실') : (ORDER_NAME[b.order] || '') + (b.order === 'attack' && b.otarget ? ' · ' + b.otarget.name : '');
      if (b.escort && b.alive) tx = b.order === 'retreat' ? '호위 · 퇴각' : '호위 · 기함 뒤에 숨는다';   // 호위하는 상선은 퇴각 말고는 명령을 듣지 않는다
      return '<div class="ord-row' + (st.sel === b ? ' sel' : '') + (b.alive ? '' : ' gone') + '" data-no="' + b.no + '"><span class="shipno">' + b.no + '</span><b>' + U.esc(b.name) + '</b><span class="right">' + U.esc(tx) + '</span></div>';
    }).join('');
  }
  /** 지도 위: 우리 배 아래 명령 이름, 노리는 적으로 이어진 선, 고른 배의 고리, 학익진의 반원 */
  var ORD_COL = { follow: '210,220,200', crane: '255,214,120', focus: '255,140,110', gun: '150,200,255', guard: '170,240,170', free: '230,230,230', retreat: '200,200,200', attack: '255,120,90', hold: '200,220,255' };
  function drawOrderTag(ctx, b, p) {
    var col = ORD_COL[b.order] || '230,230,230', nm = ORDER_NAME[b.order] || '';
    if (b === st.sel) { ctx.strokeStyle = 'rgba(255,240,180,.95)'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.arc(p[0], p[1], b.len * 0.62, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    if ((b.order === 'focus' || b.order === 'attack' || b.order === 'crane') && b.target && b.target.alive) {
      var q = toScreen(b.target.x, b.target.y);
      ctx.strokeStyle = 'rgba(' + col + ',.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 7]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (b.order === 'hold' && b.hold) { var hp = toScreen(b.hold[0], b.hold[1]); ctx.strokeStyle = 'rgba(' + col + ',.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hp[0], hp[1], 12, 0, 7); ctx.moveTo(hp[0] - 6, hp[1]); ctx.lineTo(hp[0] + 6, hp[1]); ctx.moveTo(hp[0], hp[1] - 6); ctx.lineTo(hp[0], hp[1] + 6); ctx.stroke(); }
    if (b.order === 'crane' && b.crane && b.crane.T.alive) {
      var c0 = toScreen(b.crane.T.x, b.crane.T.y);
      ctx.strokeStyle = 'rgba(255,214,120,.25)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(c0[0], c0[1], b.crane.R * SCALE, b.crane.th - 0.3, b.crane.th + 0.3); ctx.stroke();
    }
    var f0 = ctx.font; ctx.font = '700 12px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center';
    var w = ctx.measureText(nm).width + 12, lk = labelK();
    ctx.save(); ctx.translate(p[0], p[1] + halfH(b) * 0.84); ctx.scale(lk, lk);
    ctx.fillStyle = 'rgba(10,14,24,.62)'; ctx.fillRect(-w / 2, 16 - 12, w, 17);
    ctx.fillStyle = 'rgb(' + col + ')'; ctx.fillText(nm, 0, 17); ctx.restore(); ctx.font = f0;
  }

  // ---------------------------------------------------------------- simulation
  /** 배마다 보이는 파도를 탄다(G.Waves.battle — 해전 바다 셰이더와 같은 식)와 돛·깃발이 겉바람을 따른다 */
  function rideShips(dt, frozen) {
    var RD = G.FX && G.FX.ride, WV = G.Waves;
    if (!RD || RD.on === false || !WV || !(dt > 0)) return;
    var K = RD.battle, wind = [Math.cos(st.wind.dir) * st.wind.spd, Math.sin(st.wind.dir) * st.wind.spd], t = st.t, pxU = 100 * (G.Game.renderer && G.Game.renderer.canvas ? G.Game.renderer.canvas.width / 1600 : 1);
    var fn = function (x, y) { return WV.battle(x, y, t, wind, pxU); }, refV = BFX.ref / BFX.day;
    st.ships.forEach(function (b) {
      if (b.fled) return;
      var sr = Math.min(1.4, Math.max(0, b.spd || 0) / refV), L = b.len / 100;
      var h = WV.hull(fn, b.x / 100, -b.y / 100, -b.heading, Math.min(L, 0.45 * WV.battleSwell()), L * 0.34);
      var heel = U.clamp(-(b.turnRate || 0) * sr * 0.08, -0.12, 0.12);
      var R = b.ride = b.ride || WV.newRide(), vp0 = R.vp;
      var ch = K.chop || 0;
      WV.spring(R, { roll: heel + (h.roll + ch * h.lr) * K.roll, pitch: (h.pitch + ch * h.lp) * K.pitch, heave: h.heave * K.heave }, RD, dt);
      R.cool = Math.max(0, R.cool - dt);
      if (!frozen && b.alive && b.fx && G.SeaFX.burst && R.vp < -RD.slam && vp0 >= -RD.slam && sr > 0.35 && !R.cool) {
        R.cool = RD.slamCool;
        G.SeaFX.burst(b.fx, b.x, -b.y, -b.heading, { len: b.len, wid: b.len * 0.3, ref: BFX.ref }, (b.spd || 0) * BFX.day, RD.slamSpray * Math.min(2, (0.6 + sr * 0.7) * (-R.vp / RD.slam) * 0.8));
        st.slams = (st.slams || 0) + 1;
      }
      if (b.alive && !b.sunk) {
        var vk = 0.5 / refV, v = b.vel || [0, 0];
        b.rig = WV.rigStep(b.rig || {}, WV.apparent({ dir: st.wind.dir, spd: st.wind.spd * (RD.windScale || 1.6) }, v[0] * vk, -v[1] * vk, -b.heading), dt, 0);
      }
    });
  }
  B.update = function (dt) {
    if (!st) return;
    st.t += dt;
    if (G.Audio && G.Audio.amb && Date.now() >= (st.ambAt || 0)) { st.ambAt = Date.now() + 300; G.Audio.amb({ sea_close: 0.9, sea_wind: 0.35 }); }   // 뱃전에 부딪는 물결·바람
    var I = IMP();
    if (st.hitstop > 0) { st.hitstop -= dt; if (st.hitstop <= 0) { st.hitstop = 0; st.hsCool = I.hitstopCool; } }
    else if (st.hsCool > 0) st.hsCool -= dt;
    st.shake = (st.shake || 0) * Math.exp(-dt * I.shakeDecay); if (st.shake < 0.15) st.shake = 0;
    st.zoomK = (st.zoomK || 0) * Math.exp(-dt * 7); if (st.zoomK < 0.0005) st.zoomK = 0;
    if (st.flash) { st.flash.a *= Math.exp(-dt * I.flashDecay); if (st.flash.a < 0.008) st.flash = null; }
    st.ships.forEach(function (b) {
      if (b.jx || b.jy) { var kj = Math.exp(-dt * 7); b.jx *= kj; b.jy *= kj; if (Math.abs(b.jx) + Math.abs(b.jy) < 0.05) b.jx = b.jy = 0; }
      if (b.hitT > 0) b.hitT -= dt;
    });
    var frozen = st.paused || st.busy || UI.busy() || st.over || st.hitstop > 0;
    if (!frozen) {
      var left = Math.min(dt, 0.25) * battleSpeed();   // 해전 배속 ×1·×2·×3 (2026-10-18) — 한 걸음은 그대로 0.05초씩 잘라 셈한다
      while (left > 1e-4 && !st.busy && !st.over) {
        var sdt = Math.min(left, 0.05); left -= sdt;
        st.ships.forEach(function (b) { if (b.alive) think(b, sdt); });
        st.ships.forEach(function (b) { if (b.alive && !b.monster) moveShip(b, sdt); });
        st.ships.forEach(function (b) { if (b.fx) G.SeaFX.age(b.fx, sdt / BFX.day); });
        st.ships.forEach(function (b) { if (b.alive && !b.monster) gunnery(b, sdt); });
        updateBalls(sdt);
        checkEnd();
      }
      // 크게 부서진 배는 검은 연기를 뿜는다 (연기는 그 자리에 남아 바람에 밀린다 — 움직이는 배 뒤로 꼬리가 생긴다)
      st.ships.forEach(function (b) {
        if (!b.alive || b.fled || b.monster) return;
        var hr = b.hp / b.maxHp; if (hr >= I.burnAt) return;
        b.smokeT = (b.smokeT || 0) - dt; if (b.smokeT > 0) return;
        b.smokeT = 0.1 + hr * 0.5;
        var off = U.rf(-0.3, 0.3) * b.len, wd = windDrift();
        st.fx.push({ kind: 'dsmoke', x: b.x + Math.cos(b.heading) * off, y: b.y + Math.sin(b.heading) * off, vx: wd[0] * 1.6 + U.rf(-5, 5), vy: wd[1] * 1.6 + U.rf(-5, 5), r: 8 + (1 - hr) * 12, t: 0, life: U.rf(2, 3.2), thin: hr > I.fireAt });
      });
    }
    // 멈춘 동안에도 물보라·항적은 천천히 사라진다
    if (frozen) st.ships.forEach(function (b) { if (b.fx) G.SeaFX.age(b.fx, dt / BFX.day * 0.3); });
    // sinking animations
    st.ships.forEach(function (b) { if (!b.alive && b.sink < 1) b.sink = Math.min(1, b.sink + dt * 0.35); });
    rideShips(Math.min(dt, 0.1), frozen);
    // 이 장면에서 막 생긴 효과는 다음 장면부터 나이를 먹는다 (느린 컴퓨터에서 한 장면이 길어도 번쩍임이 한 번은 보이게)
    if (!(st.hitstop > 0)) st.fx = st.fx.filter(function (f) { if (!f.seen) { f.seen = 1; return true; } f.t += dt; return f.t < f.life; });
    // camera: 살아 있는 배를 모두 감싸는 상자를 양옆 정보창 사이의 빈 자리에 맞춘다 — 배율(st.vz)도 함께 (2026-10-17)
    var alive = st.ships.filter(function (b) { return b.alive; }), V = VIEW(), fr = V.free;
    var mx = st.cx, my = st.cy, tz = st.vz || V.max;
    if (alive.length) {
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      alive.forEach(function (b) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x); y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y); });
      tz = U.clamp(Math.min((fr[2] - fr[0]) / (x1 - x0 + V.pad * 2), (fr[3] - fr[1]) / (y1 - y0 + V.pad * 2)), V.min, V.max);
      var vz0 = st.vz || tz;
      mx = (x0 + x1) / 2 + (800 - (fr[0] + fr[2]) / 2) / vz0; my = (y0 + y1) / 2 + (450 - (fr[1] + fr[3]) / 2) / vz0;   // 빈 자리의 한가운데에 오게
    }
    if (st.vz == null) { st.vz = tz; st.cx = mx; st.cy = my; }
    else { st.vz += (tz - st.vz) * Math.min(1, dt * (V.follow || 0.9)); st.cx += (mx - st.cx) * Math.min(1, dt * 1.2); st.cy += (my - st.cy) * Math.min(1, dt * 1.2); }
    render();
  };
  function speedOf(b) {
    var t = G.SHIP[b.type];
    var rel = Math.abs(U.angDiff(-b.heading, st.wind.dir)); // screen y down -> world angle = -heading
    var th = 0; b.sails.forEach(function (k) { th += R.sailEff(k, rel); }); th /= Math.max(1, b.sails.length);
    var crewF = Math.min(1, b.crew / Math.max(1, t.crew[0]));
    var hpF = 0.5 + 0.5 * b.hp / b.maxHp, crF = 0.4 + 0.6 * crewF;
    var sail = 34 * t.spd * (0.35 + th * 0.9) * hpF * crF;
    if (t.oar) sail = Math.max(sail, 34 * t.oar * 1.5 * hpF * crF);     // 노: 바람과 상관없이 움직인다
    return sail;
  }
  function has(b, k) { return b.tr.indexOf(k) >= 0; }
  function targetable(b) { return G.SeaMonsters ? G.SeaMonsters.targetable(b) : b && b.alive; }
  function boardRange(b) { return has(b, 'grapple') ? 80 : 55; }
  function think(b, dt) {
    if (b.monster && G.SeaMonsters) {
      G.SeaMonsters.step(b, dt, st, { arena: ARENA, resolveTerrain: resolveTerrain, armor: function (o) { return armorK(o) * (o.side === 'me' ? Math.max(0.5, 1 - R.fleetBonus('monster')) : 1); }, hullBreak: hullBreak, log: log,
        effect: function (action) { waterFx(action === 'rush' ? 'wake' : action, b); if (action !== 'wake') attackFeel(b, action); },
        hit: function (o, damage, from) { o.hitT = IMP().shipFlash; dmgNumber(o, damage, 0); hitBurst(o.x, o.y, o.x - from.x, o.y - from.y, damage); waterFx('ram', o, from.heading); tremor(o, G.FX.waterSplash.tremor.ram); jolt(o, o.x - from.x, o.y - from.y, IMP().knock); shake(IMP().shakeClash); } });
      return;
    }
    var foes = st.ships.filter(function (o) { return targetable(o) && o.side !== b.side; });
    if (!foes.length) return;
    var near = foes.slice().sort(function (p, q) { return Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y); })[0];
    if (b.side === 'me') {
      if (st.retreat) { var fs = flagship(); b.moveTo = [b.x - 2000, b.y + (b.y - (fs ? fs.y : 0)) * 0.2]; b.target = null; return; }
      if (b.flag && b.tactic) { var o0 = b.order; b.order = b.tactic; allyThink(b, foes, near); b.order = o0; return; }   // 기함 전술 (기함 혼자일 때)
      if (b.flag) { if (b.target && !b.target.alive) b.target = null; if (!b.target && !b.moveTo) b.target = null; return; }
      allyThink(b, foes, near);
      return;
    }
    // enemy AI — 우리 기함이 가까이 있으면 기함을 노린다 (기함을 잡으면 이기니까)
    var mfl = st.myFlag;
    if (mfl && mfl.alive && near !== mfl && Math.hypot(mfl.x - b.x, mfl.y - b.y) < 1.4 * Math.hypot(near.x - b.x, near.y - b.y)) near = mfl;
    var kind = st.npc.kind;
    if (st.npc.tactic && enemyTactic(b, foes, near, mfl)) return;   // 이름난 해적의 전술 (js/systems/corsairs.js)
    var myCrew = b.crew, theirCrew = near.crew;
    if (kind === 'merchant' || (b.hp < b.maxHp * 0.25 && kind !== 'navy')) { b.moveTo = [b.x + (b.x - near.x) * 3, b.y + (b.y - near.y) * 3]; b.target = null; b.fleeing = true; return; }
    var awe = st.ships.some(function (o) { return o.side === 'me' && o.flag && o.alive && has(o, 'awe'); });
    var boardK = (awe ? 2.0 : 1.3) * (has(near, 'spikes') ? 99 : 1) / (has(b, 'grapple') ? 1.25 : 1);
    if ((kind === 'pirate' || has(b, 'grapple')) && myCrew > theirCrew * boardK) { b.board = near; b.moveTo = [near.x, near.y]; b.target = near; return; }
    b.target = near; b.moveTo = null;
  }
  /** 이름난 해적의 전술 — true면 이번 생각은 끝
      swarm(아랍 해적): 부하 배는 갈고리를 걸고 뛰어든다 · 기함은 뒤에서 포를 쏘다가 부하가 다 없어지면 돌진
      crane(서양 사략 해적): 부하 배는 우리 기함을 학익진으로 감싸 포격만 · 기함은 사정거리 끝에서 쏜다 */
  /** 물러나는 목표점을 전장 원 ×0.75 안으로 자른다 — 이름난 해적 기함이 뒤로 물러나다 전장 밖으로 달아나 싸움이 끝나던 것 (QA 2026-10-23) */
  function inArena(p) {
    var r = Math.hypot(p[0], p[1]), lim = ARENA * 0.75;
    return r > lim ? [p[0] / r * lim, p[1] / r * lim] : p;
  }
  function enemyTactic(b, foes, near, mfl) {
    var tac = st.npc.tactic, T = mfl && mfl.alive ? mfl : near, ef = st.enFlag;
    var mates = st.ships.filter(function (o) { return o.side === 'en' && o.alive && !o.flag; });
    b.close = 1; b.board = null;
    if (!b.flag && b.hp < b.maxHp * 0.2) return false;                     // 다 부서진 부하 배는 달아난다 (기본 생각으로)
    if (tac === 'swarm') {
      if (!b.flag) {
        var tg = has(near, 'spikes') ? T : near;                            // 쇠못 지붕에는 못 뛰어든다 — 다른 배를 노린다
        if (has(tg, 'spikes')) { b.target = tg; b.moveTo = null; return true; }
        b.board = tg; b.target = tg; b.moveTo = [tg.x, tg.y]; return true;
      }
      if (mates.length) {
        // 기함: 부하들 뒤, 사정거리 끝에서 포를 쏜다 — 가까이 오면 물러난다
        var keep = gunRange(b) * 0.55, cl = null, cd = keep;
        foes.forEach(function (f) { var d = Math.hypot(f.x - b.x, f.y - b.y); if (d < cd) { cd = d; cl = f; } });
        if (cl) { var dx = b.x - cl.x, dy = b.y - cl.y, dl = Math.hypot(dx, dy) || 1; b.moveTo = inArena([b.x + dx / dl * 240, b.y + dy / dl * 240]); b.target = cl; }
        else { b.target = T; b.moveTo = null; b.close = 1.0; }
        return true;
      }
      if (!st.charged) { st.charged = true; log('적 기함 ' + b.name + U.jx(b.name, '이/가') + ' 돛과 노를 다 써서 돌진해 온다!'); }
      if (has(T, 'spikes')) { b.target = T; b.moveTo = null; b.close = 0.5; return true; }
      b.board = T; b.target = T; b.moveTo = [T.x, T.y];
      return true;
    }
    if (tac === 'crane') {
      if (b.flag || !ef || !ef.alive) {
        var keep2 = gunRange(b) * 0.5, cl2 = null, cd2 = keep2;
        foes.forEach(function (f) { var d = Math.hypot(f.x - b.x, f.y - b.y); if (d < cd2) { cd2 = d; cl2 = f; } });
        if (cl2) { var ex = b.x - cl2.x, ey = b.y - cl2.y, el2 = Math.hypot(ex, ey) || 1; b.moveTo = inArena([b.x + ex / el2 * 240, b.y + ey / el2 * 240]); b.target = cl2; }
        else { b.target = T; b.moveTo = null; b.close = 1.05; }
        return true;
      }
      var K = FO(), idx = mates.indexOf(b), th0 = Math.atan2(ef.y - T.y, ef.x - T.x), step = K.craneStep || 0.62;
      var wing = Math.ceil((idx + 1) / 2), sgn = idx % 2 ? -1 : 1;
      var th = th0 + sgn * Math.min(wing * step, K.craneMax || 1.45), R0 = gunRange(b) * (K.craneR || 0.72);
      var slot = [T.x + Math.cos(th) * R0, T.y + Math.sin(th) * R0];
      b.target = T; b.moveTo = slotGoal(b, slot, [T.x, T.y], sgn); b.crane = { T: T, th: th, R: R0 };
      return true;
    }
    return false;
  }
  function moveShip(b, dt) {
    var goal = null;
    if (b.halt) goal = null;                                                           // 방향키 조타: Space로 세움
    else if (b.steer != null) {
      goal = [b.x + Math.cos(b.steer) * 400, b.y + Math.sin(b.steer) * 400];            // 방향키 조타: 그 방위로 계속
      var ed = Math.hypot(b.x, b.y);
      if (ed > ARENA * 0.8 && !st.edgeWarned) { st.edgeWarned = true; UI.toast('전장 가장자리입니다! 이대로 가면 기함이 전장을 벗어납니다.', 'boot', 3000); }
      else if (ed < ARENA * 0.65) st.edgeWarned = false;
    }
    else if (b.moveTo) goal = b.moveTo;
    else if (targetable(b.target)) {
      // stand off at gun range and present the broadside
      var t = b.target, d = Math.hypot(t.x - b.x, t.y - b.y), rng = gunRange(b) * (b.close || 1);   // b.close: 함대 명령마다 붙는 거리 (일제 공격은 가까이, 포격전은 멀리)
      var ang = Math.atan2(t.y - b.y, t.x - b.x);
      if (b.board === t || (b.boardIntent && b.side === 'me') || d > rng * 0.85) goal = [t.x, t.y];
      else if (has(b, 'ram') || (has(b, 'bow') && !has(b, 'dragon'))) goal = [t.x, t.y];      // 뱃머리를 적에게 겨눈다 (충파·뱃머리 포)
      else { var side = U.angDiff(ang, b.heading) > 0 ? 1 : -1; goal = [b.x + Math.cos(ang - side * Math.PI / 2) * 100, b.y + Math.sin(ang - side * Math.PI / 2) * 100]; }
    }
    var v = speedOf(b);
    if (goal && !b.halt && b.steer == null) goal = navGoal(b, goal);   // 섬 너머 목표는 물길을 따라 (벽 걸림 막기)
    if (b.halt) v = 0;
    else if (goal) {
      var want = Math.atan2(goal[1] - b.y, goal[0] - b.x);
      var dd = Math.hypot(goal[0] - b.x, goal[1] - b.y);
      if (b.moveTo && dd < 20) { b.moveTo = null; v *= 0.3; }
      var diff = U.angDiff(b.heading, want);
      b.heading += U.clamp(diff, -0.7 * b.turn * dt, 0.7 * b.turn * dt);
    } else v *= 0.35;
    // 관성: 앞뒤 속력은 천천히 붙고 줄며, 뱃머리를 돌려도 진행 방향은 뒤늦게 따라온다 (옆 미끄러짐)
    var hx = Math.cos(b.heading), hy = Math.sin(b.heading), h0 = b.prevH == null ? b.heading : b.prevH;
    if (!b.vel) b.vel = [hx * v * 0.6, hy * v * 0.6];
    var along = b.vel[0] * hx + b.vel[1] * hy, latv = -b.vel[0] * hy + b.vel[1] * hx;
    along += (v - along) * (1 - Math.exp(-dt / (v > along ? BFX.accel : BFX.decel)));
    latv *= Math.exp(-dt / BFX.lateral);
    b.vel = [hx * along - hy * latv, hy * along + hx * latv];
    var ox = b.x, oy = b.y;
    b.x += b.vel[0] * dt; b.y += b.vel[1] * dt;
    var shoreHit = resolveTerrain(b, ox, oy);
    unstick(b, goal ? Math.atan2(goal[1] - b.y, goal[0] - b.x) : b.heading, !b.halt && !!goal && b.steer == null && v > 3, dt);   // 방향키로 모는 동안은 손대지 않는다
    b.spd = shoreHit ? along * 0.18 : along; b.lat = latv; b.turnRate = U.angDiff(h0, b.heading) / Math.max(1e-4, dt); b.prevH = b.heading;
    if (b.fx) G.SeaFX.step(b.fx, { x0: ox, y0: -oy, x: b.x, y: -b.y, h: -b.heading, vx: b.vel[0] * BFX.day, vy: -b.vel[1] * BFX.day, lat: -latv * BFX.day, fwd: along * BFX.day, turn: -b.turnRate * BFX.day, days: dt / BFX.day }, { len: b.len, wid: b.len * 0.3, ref: BFX.ref });
    if (b.side === 'me' && b.boardIntent && b.target && b.target.alive && Math.hypot(b.target.x - b.x, b.target.y - b.y) < boardRange(b) + 5 && !st.busy) { b.boardIntent = false; boarding(b.target, b, false); }
    // enemy boarding attempt
    if (b.board && b.board.alive && Math.hypot(b.board.x - b.x, b.board.y - b.y) < boardRange(b) && !st.busy) { var tgt = b.board; b.board = null; boarding(tgt, b, true); }
    // ship separation
    if (b.ramCd > 0) b.ramCd -= dt;
    st.ships.forEach(function (o) {
      if (o === b || !targetable(o)) return;
      var dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy);
      // 충파: 뱃머리로 적선을 들이받는다
      if (has(b, 'ram') && o.side !== b.side && b.ramCd <= 0 && d < 34 + (b.len + o.len) * 0.18 && !st.busy && Math.abs(U.angDiff(b.heading, Math.atan2(-dy, -dx))) < 0.7) {
        var rd = (8 + b.t.hp * 0.12) * U.rf(0.8, 1.2) * armorK(o);
        o.hp -= rd; if (!o.monster) o.crew = Math.max(0, o.crew - Math.ceil(o.crew * 0.05)); b.hp -= 1.5; b.ramCd = 5;
        st.fx.push({ kind: 'hit', x: (b.x + o.x) / 2, y: (b.y + o.y) / 2, t: 0, life: 0.8 });
        waterFx('ram', o, b.heading); tremor(b, G.FX.waterSplash.tremor.ram); tremor(o, G.FX.waterSplash.tremor.ram);
        var bn = shipLabel(b), on = shipLabel(o);
        log(bn + U.jx(bn, '이/가') + ' ' + on + U.jx(on, '을/를') + ' 들이받았다!');
        var I3 = IMP(); o.hitT = I3.shipFlash; jolt(o, o.x - b.x, o.y - b.y, I3.knock); jolt(b, b.x - o.x, b.y - o.y, I3.knock * 0.4);
        hitstop(I3.hitstopRam); shake(I3.shakeClash * 0.8); flash(I3.flashClash * 0.6);
        if (G.Audio) G.Audio.sfx('cannon');
        if (o.hp <= 0) hullBreak(o);
      }
      if (d < 40 && d > 0.1) { b.x += dx / d * (40 - d) * 0.5; b.y += dy / d * (40 - d) * 0.5; }
    });
    if (resolveTerrain(b, ox, oy)) b.spd *= 0.18;       // 다른 배와 밀려난 뒤에도 섬 안으로 들어가지 않는다
    // fleeing off the arena
    var dist = Math.hypot(b.x, b.y);
    if (dist > ARENA) {
      var ux = b.x / dist, uy = b.y / dist;
      if (terrainBlocked(b.x + ux * 120, b.y + uy * 120, b)) {
        b.x = ux * (ARENA - 4); b.y = uy * (ARENA - 4); b.vel[0] *= 0.1; b.vel[1] *= 0.1;
        if (b.side === 'me' && b.flag && (!st.escapeWarn || st.t - st.escapeWarn > 3)) { st.escapeWarn = st.t; UI.toast('이쪽 퇴각로는 육지로 막혀 있습니다!', 'anchor', 3000); }
      } else {
        b.alive = false; b.fled = true; b.sink = 1;
        if (b.side === 'en') log(b.name + U.j(b.name, '이/가').slice(b.name.length) + ' 달아났다.');
        else log(b.name + '호가 전장을 벗어났다.');
      }
    }
  }
  /** 기함의 선실(포격실·해병 대기실)이 보태는 힘 — 사람을 배치한 방만 (G.BALANCE.cabins.fx) */
  function cabinK(b, type) { return b.side === 'me' && G.Cabins && b.src === G.Cabins.flagship() ? G.Cabins.fx(type, type) : 0; }
  function gunRange(b) { var c = G.CANNON[b.guns.type] || G.CANNON.saker; return 90 + c.range * 55; }
  function gunnery(b, dt) {
    var c = G.CANNON[b.guns.type] || G.CANNON.saker;
    // 포술은 그 배 선장의 것 (기함은 제독·부관, 다른 배는 선장, 선장이 없으면 갑판장 — 재장전이 느리다)
    var gunSk = b.side === 'me' ? R.shipSkill(b.src, 'gun') : (st.npc.kind === 'navy' ? 2 : 1);
    var reloadT = 5.5 * (1.25 - gunSk * 0.12) / (1 + cabinK(b, 'gun') * 0.5) * (1 + c.load * 0.12) * (1.4 - 0.4 * Math.min(1, b.crew / Math.max(1, b.crew0))) * (has(b, 'gundeck') ? 0.85 : 1) * (b.side === 'me' && !R.captain(b.src) ? 1.1 : 1);
    var rng = gunRange(b), bow = has(b, 'bow') && !has(b, 'dragon'), dragon = has(b, 'dragon');
    // 0·1: 왼쪽·오른쪽 현측 / 2: 뱃머리 (뱃머리 포·용머리 포구)
    for (var side = 0; side < 3; side++) {
      if (side === 2 && !bow && !dragon) continue;
      b.reload[side] -= dt;
      if (b.reload[side] > 0 || b.guns.n <= 0) continue;
      var sAng = side === 2 ? b.heading : b.heading + (side === 0 ? -Math.PI / 2 : Math.PI / 2);
      var tgt = null, best = 1e9, part = 1;
      st.ships.forEach(function (o) {
        if (!targetable(o) || o.side === b.side) return;
        var dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
        if (d > rng) return;
        var a = Math.abs(U.angDiff(sAng, Math.atan2(dy, dx))), k;
        if (side === 2) k = a <= 0.6 ? (bow ? 2 : 1) : 0;                    // 뱃머리: 뱃머리 포는 모든 포를, 용머리는 한쪽 현측만큼
        else if (bow) k = d < 90 && a <= 1.2 ? 0.25 : 0;                      // 뱃머리 포 배는 옆으로 거의 못 쏜다
        else {
          k = a <= 0.95 ? 1 : d < 90 ? 0.5 : 0;                              // broadside arc, or point-blank
          if (!k && side === 0 && d < rng * 0.7 && !dragon) k = 0.2;         // bow/stern chasers
        }
        if (!k) return;
        var dk = d / k * (o === b.target ? 0.6 : 1);          // 명령으로 노리는 적을 먼저 쏜다
        if (dk < best) { best = dk; tgt = o; part = k; }
      });
      if (!tgt) continue;
      b.reload[side] = reloadT;
      var dist = Math.hypot(tgt.x - b.x, tgt.y - b.y);
      fire(b, tgt, c, dist, rng, gunSk, part < 1 || side === 2 ? Math.atan2(tgt.y - b.y, tgt.x - b.x) : sAng, part);
    }
  }
  function fire(b, t, c, d, rng, gunSk, sAng, part) {
    if (!targetable(t)) return;
    var shots = Math.max(1, Math.round(b.guns.n / 2 * (part || 1)));
    var acc = c.acc * (1 + gunSk * 0.1) * (1.15 - 0.5 * d / rng);
    if (b.side === 'me') { var bonus = R.fleetBonus('battle'); acc *= 1 + bonus; if (R.hasItem('shells')) acc *= 1.05; }
    else if (G.FigFx) acc *= G.FigFx.enemyAccK();   // 전설 「떨리는 포수」 (js/systems/figfx.js)
    var careerBaseAcc = acc;
    if (b.side === 'me' && G.SkillCombos) acc *= G.SkillCombos.factor('cannonAccuracy');
    if (b.side === 'me' && G.Career) acc += G.Career.accuracy(b.src === S().fleet.ships[0], careerBaseAcc);
    if (G.Audio && st.sfxT !== Math.floor(st.t * 4)) { st.sfxT = Math.floor(st.t * 4); G.Audio.sfx('cannon'); }
    attackFeel(b, 'fire');
    if (b.side === 'me') { var I0 = IMP(); flash(I0.flashFire, '255,226,170'); }
    jolt(b, -Math.cos(sAng), -Math.sin(sAng), 2 + Math.min(3, shots * 0.4));             // 포를 쏜 반동으로 배가 반대쪽으로 밀린다
    st.fx.push({ kind: 'ring', x: b.x + Math.cos(sAng) * b.len * 0.22, y: b.y + Math.sin(sAng) * b.len * 0.22, t: 0, life: 0.55, r: b.len * 0.55 });   // 물 위에 퍼지는 충격파
    for (var i = 0; i < shots; i++) {
      var hit = U.chance(U.clamp(acc, 0.05, 0.95));
      var fwd = part >= 1 && sAng === b.heading ? b.len * 0.45 : 0;
      var ox = b.x + Math.cos(b.heading) * ((i - shots / 2) * (b.len / shots) * (fwd ? 0.1 : 0.8) + fwd), oy = b.y + Math.sin(b.heading) * ((i - shots / 2) * (b.len / shots) * (fwd ? 0.1 : 0.8) + fwd);
      var tx = t.x + U.rf(-18, 18) + (hit ? 0 : U.rf(-50, 50)), ty = t.y + U.rf(-18, 18) + (hit ? 0 : U.rf(-50, 50));
      st.balls.push({ x: ox, y: oy, tx: tx, ty: ty, t: 0, dur: 0.35 + d / 900 + i * 0.03, hit: hit, dmg: c.dmg * U.rf(0.6, 1.2) * (b.side === 'me' && R.hasItem('shells') ? 1.4 : 1) * (has(b, 'heavygun') ? 1.2 : 1) * (1 + cabinK(b, 'gun')) * (b.side === 'me' && G.SkillCombos ? G.SkillCombos.factor('cannonPower') : 1) * (b.side === 'me' ? orderDmg(b, t) : st.npc.tactic === 'crane' ? envelop(t, 'en') : 1), kill: c.kill || 1, target: t, from: b });   // kill: 페드레로·캐로네이드는 갑판 선원을 더 쓰러뜨린다
      st.fx.push({ kind: 'smoke', x: ox + Math.cos(sAng) * 14, y: oy + Math.sin(sAng) * 14, vx: Math.cos(sAng) * 18, vy: Math.sin(sAng) * 18, t: 0, life: 2.4, r: 10 + U.rf(0, 8) });
      st.fx.push({ kind: 'muzzle', x: ox + Math.cos(sAng) * 10, y: oy + Math.sin(sAng) * 10, ang: sAng, t: 0, life: 0.2, s: U.rf(1.1, 1.5) });
      for (var sp3 = 0; sp3 < 3; sp3++) { var a3 = sAng + U.rf(-0.35, 0.35), v3 = U.rf(160, 280); st.fx.push({ kind: 'spark', x: ox + Math.cos(sAng) * 12, y: oy + Math.sin(sAng) * 12, vx: Math.cos(a3) * v3, vy: Math.sin(a3) * v3, t: 0, life: U.rf(0.15, 0.3) }); }
    }
  }
  function updateBalls(dt) {
    for (var i = st.balls.length - 1; i >= 0; i--) {
      var k = st.balls[i];
      if (k.radial && G.SeaMonsters) {
        var victim = G.SeaMonsters.projectileHit(k, st, dt);
        if (victim) { k.target = victim; k.hit = true; k.tx = victim.x; k.ty = victim.y; k.t = k.dur; }
      }
      k.t += dt;
      if (k.t >= k.dur) {
        st.balls.splice(i, 1);
        if (k.hit && targetable(k.target)) {
          var t = k.target;
          var dmg = k.dmg * (1 - (k.target.side === 'me' ? R.fleetBonus('hp') : 0)) * 1.1 * armorK(t) * (k.radial && t.side === 'me' ? Math.max(0.5, 1 - R.fleetBonus('monster')) : 1);
          t.hp -= dmg;
          var kill = !t.monster && Math.random() < 0.5 ? Math.ceil(dmg * 0.35 * (k.kill || 1) * (has(t, 'armor') ? 0.4 : has(t, 'raft') ? 1.5 : 1)) : 0; t.crew = Math.max(0, t.crew - kill);
          st.fx.push({ kind: 'hit', x: k.tx, y: k.ty, t: 0, life: 0.6 });
          hitBurst(k.tx, k.ty, k.tx - k.x, k.ty - k.y, dmg);
          if (G.WaterSplash) G.WaterSplash.emit(st, 'hull', k.tx, k.ty, 1, Math.atan2(k.ty - k.y, k.tx - k.x));
          dmgNumber(t, dmg, kill);
          // 타격감: 맞은 배가 번쩍이며 포탄 방향으로 밀리고, 잠깐 멈추고, 화면이 흔들린다
          var I1 = IMP(), mine = t.side === 'me', big = Math.min(1, dmg / Math.max(1, t.maxHp) * 8);
          t.hitT = I1.shipFlash; jolt(t, k.tx - k.x, k.ty - k.y, I1.recoil * (0.7 + big));
          hitstop((mine ? I1.hitstopTaken : I1.hitstop) * (1 + big * 0.8));
          shake((mine ? I1.shakeTaken : I1.shakeHit) * (0.7 + big * 0.6));
          tremor(t, (mine ? 5 : 3.5) * (0.7 + big * 0.8));
          flash(mine ? I1.flashTaken : I1.flashHit, mine ? '255,120,90' : '255,236,200');
          if (big > 0.7) zoomKick(I1.zoomHit);
          if (t.hp <= 0) hullBreak(t);
          else if (t.crew <= 0) { t.alive = false; t.captured = t.side === 'en'; t.drifting = true; log(t.name + '의 선원이 전멸했다.'); }
        } else {
          if (G.WaterSplash) G.WaterSplash.emit(st, 'cannon', k.tx, k.ty);
          else st.fx.push({ kind: 'splash', x: k.tx, y: k.ty, t: 0, life: 2.2, seed: Math.random() });
        }
      }
    }
  }
  /** 포탄·충파 피해 배수: 덮개 장갑·겹판자는 줄이고 꿰맨 선체는 키운다 */
  function armorK(t) { var k = 1; if (has(t, 'armor')) k *= t.t.armor || 0.6; if (has(t, 'layered')) k *= 0.8; if (has(t, 'sewn')) k *= 1.2; return k; }
  /** 선체가 버티지 못할 때: 수밀 격벽은 한 번 버티고, 뗏목은 가라앉지 않는다 */
  function hullBreak(t) {
    var tn = shipLabel(t);
    if (has(t, 'raft')) { t.hp = 1; if (!t.bulk) { t.bulk = true; log(tn + U.jx(tn, '은/는') + ' 부서졌지만 뗏목이라 가라앉지 않는다.'); } return; }
    if (has(t, 'bulkhead') && !t.bulk) { t.bulk = true; t.hp = Math.max(1, t.maxHp * 0.08); log(tn + '의 칸막이 선창이 물을 막았다! 가라앉지 않고 버틴다.'); return; }
    sinkShip(t);
  }
  function shipLabel(b) { return b.side === 'me' ? b.name + '호' : b.name; }
  function sinkShip(t) {
    t.alive = false; t.sunk = true; t.hp = 0;
    log(t.name + (t.side === 'me' ? '호가 침몰했다!' : U.j(t.name, '이/가').slice(t.name.length) + ' 침몰했다!'));
    if (G.Audio) { G.Audio.sfx('boom'); G.Audio.sfx('splash'); }   // 화약고가 터지고 가라앉는다
    st.fx.push({ kind: 'bigsplash', x: t.x, y: t.y, t: 0, life: 6, seed: Math.random(), len: t.len });
    waterFx('emerge', t);
    var I2 = IMP(); st.hsCool = 0; hitstop(I2.hitstopSink); shake(I2.shakeSink); flash(I2.flashSink, t.side === 'me' ? '255,110,80' : '255,240,210');
    st.fx.push({ kind: 'blast', x: t.x, y: t.y, t: 0, life: 0.5, r: t.len * 0.9 });
    hitBurst(t.x, t.y, U.rf(-1, 1), U.rf(-1, 1), 14); zoomKick(I2.zoomSink);
    st.fx.push({ kind: 'float', x: t.x, y: t.y - t.len * 0.5 - 118, text: t.side === 'me' ? '침몰' : '격침!', col: t.side === 'me' ? '255,120,100' : '255,222,120', size: 40, t: 0, life: 1.7 });   // 피해 숫자 위에
  }
  function log(t) { st.log.push(t); if (st.log.length > 6) st.log.shift(); UI.toast(t, 'cannon', 2600); }

  // ---------------------------------------------------------------- boarding & duel
  /** 백병전 시작: 두 배가 부딪친다 — 번쩍임·흔들림·넉백 */
  function clashFx(me, en, k) {
    var I = IMP(), mx = (me.x + en.x) / 2, my = (me.y + en.y) / 2;
    st.hsCool = 0; hitstop(I.hitstopRam * k); shake(I.shakeClash * k); flash(I.flashClash * k, '255,232,190');
    jolt(me, me.x - en.x, me.y - en.y, I.knock * 1.2 * k); jolt(en, en.x - me.x, en.y - me.y, I.knock * 1.2 * k);
    me.hitT = en.hitT = I.shipFlash;
    if (G.Audio) { G.Audio.sfx('creak'); setTimeout(function () { if (G.Audio) G.Audio.sfx('draw'); }, 260); }   // 뱃전이 부딪쳐 삐걱이고, 칼을 뽑아 건너간다
    for (var i = 0; i < 3; i++) st.fx.push({ kind: 'clash', x: mx + U.rf(-14, 14), y: my + U.rf(-14, 14), t: 0, life: 0.4, seed: Math.random(), s: 1.3 });
  }
  /** 백병전 한 판: 더 많이 쓰러진 쪽이 밀려나고, 칼 부딪치는 불꽃과 쓰러진 선원 수가 뜬다 */
  async function meleeRound(me, en, lostMe, lostEn, n) {
    var I = IMP(), mx = (me.x + en.x) / 2, my = (me.y + en.y) / 2;
    var push = I.knock * (0.5 + Math.min(1, Math.abs(lostMe - lostEn) / Math.max(1, lostMe + lostEn)));
    if (lostMe > lostEn) { jolt(me, me.x - en.x, me.y - en.y, push); jolt(en, me.x - en.x, me.y - en.y, push * 0.35); }
    else if (lostEn > lostMe) { jolt(en, en.x - me.x, en.y - me.y, push); jolt(me, en.x - me.x, en.y - me.y, push * 0.35); }
    else { jolt(me, me.x - en.x, me.y - en.y, push * 0.5); jolt(en, en.x - me.x, en.y - me.y, push * 0.5); }
    shake(I.shakeRound); flash(I.flashRound, lostMe > lostEn ? '255,150,120' : '255,236,200');
    if (lostEn) en.hitT = I.shipFlash; if (lostMe) me.hitT = I.shipFlash;
    for (var i = 0; i < 2; i++) st.fx.push({ kind: 'clash', x: mx + U.rf(-20, 20), y: my + U.rf(-20, 20), t: 0, life: 0.34, seed: Math.random(), s: 1 });
    // 쓰러진 선원 수: 배 이름표 위로 떠오른다
    if (lostEn) st.fx.push({ kind: 'float', x: en.x + U.rf(-8, 8), y: en.y - en.len * 0.5 - 44, text: '−' + lostEn, col: '255,214,150', t: 0, life: 0.9 });
    if (lostMe) st.fx.push({ kind: 'float', x: me.x + U.rf(-8, 8), y: me.y - me.len * 0.5 - 44, text: '−' + lostMe, col: '255,130,110', t: 0, life: 0.9 });
    if (G.Audio && n % 2) G.Audio.sfx('sword');
    await U.sleep(I.roundDelay * 1000);
  }
  /** 백병전이 끝나고 갈고리를 풀면 두 배가 튕겨 떨어진다 (실제 속력) */
  function pushApart(me, en, v) {
    var dx = me.x - en.x, dy = me.y - en.y, d = Math.hypot(dx, dy) || 1;
    [[me, 1], [en, -1]].forEach(function (pr) { var b = pr[0]; if (!b.vel) b.vel = [0, 0]; b.vel[0] += dx / d * v * pr[1]; b.vel[1] += dy / d * v * pr[1]; });
    jolt(me, dx, dy, IMP().knock); jolt(en, -dx, -dy, IMP().knock);
  }
  function boardNearest() {
    if (st && st.npc.monster) { UI.toast('해상 괴물은 포격과 충파로 쓰러뜨려야 합니다. 백병전·일기토는 없습니다.', 'cannon'); return; }
    var fs = flagship(); if (!fs || st.over) return;
    var best = null, bd = 1e9;
    st.ships.forEach(function (o) {
      if (!o.alive || o.side !== 'en') return;
      st.ships.forEach(function (m) { if (!m.alive || m.side !== 'me') return; var d = Math.hypot(o.x - m.x, o.y - m.y); if (d < boardRange(m) + 25 && d < bd) { bd = d; best = [m, o]; } });
    });
    if (!best) { UI.toast('백병전을 하려면 적함에 바짝 붙어야 합니다. (적함을 클릭해 추격)', 'sword'); if (fs && st.ships.some(function (o) { return o.alive && o.side === 'en'; })) { var tg = fs.target || st.ships.filter(function (o) { return o.alive && o.side === 'en'; })[0]; fs.target = tg; fs.boardIntent = true; fs.steer = null; fs.halt = false; } return; }
    boarding(best[1], best[0], false);
  }
  async function boarding(enemy, mine, enemyStarted) {
    if (enemy.monster || mine.monster) { if (mine) mine.boardIntent = false; return; }
    if (st.busy) return;
    st.busy++;
    var s = S();
    var me = enemyStarted ? enemy : mine, en = enemyStarted ? mine : enemy; // me = player's ship
    if (me.side !== 'me') { var tmp = me; me = en; en = tmp; }
    // 쇠못 지붕: 적이 올라타지 못한다
    if (enemyStarted && has(me, 'spikes')) {
      var hurt = Math.max(1, Math.round(en.crew * U.rf(0.12, 0.2)));
      en.crew = Math.max(0, en.crew - hurt);
      await UI.say('적이 ' + me.name + '호에 뛰어들었지만 지붕의 쇠못에 찔려 나뒹군다! (적 ' + hurt + '명 쓰러짐)', G.Scenes.mateSpeaker('first'));
      if (en.crew <= 0) { en.alive = false; en.captured = true; en.drifting = true; }
      st.busy--; checkEnd(); return;
    }
    if (!enemyStarted && has(en, 'spikes')) {
      var hurt2 = Math.max(1, Math.round(me.crew * U.rf(0.08, 0.14)));
      me.crew = Math.max(1, me.crew - hurt2);
      await UI.say(en.name + '의 지붕에 쇠못이 빽빽하다! 뛰어든 선원 ' + hurt2 + '명이 다쳐 물러났다. 저 배는 포로 부숴야 한다.', G.Scenes.mateSpeaker('first'));
      st.busy--; checkEnd(); return;
    }
    clashFx(me, en, 1);
    await UI.say(enemyStarted ? '적이 우리 배에 갈고리를 걸었다! 백병전이다!' : '갈고리를 걸어라! 적선에 뛰어든다!', G.Scenes.mateSpeaker('first'));
    // captain duel between flagships
    if (me.flag && en.flag && st.npc.kind !== 'merchant' && !st.dueled) {
      var px = G.Games.proxy(), pd = px && G.MATE[px.id];
      var nbN = st.npc.boss && (st.npc.boss.hist && G.HIST_FIG ? G.HIST_FIG[st.npc.boss.hist] : st.npc.boss.name ? st.npc.boss : null);   // 큰 해전의 적장 · 이름난 해적 (corsairs.js)
      var v = await UI.ask(nbN ? nbN.name + U.jx(nbN.name.replace(/\s*\(.*\)$/, ''), '이/가') + ' 칼을 뽑고 나섰다. "' + (st.npc.boss.line || '제독끼리 승부를 내자!') + '"' : '적의 두목이 나섰다. "제독끼리 승부를 내자!"', [{ label: '일기토를 받는다', value: 1 }].concat(pd ? [{ label: '부관 ' + pd.name + '에게 맡긴다', value: 2 }] : []).concat([{ label: '병사끼리 싸운다', value: 0 }]), {});
      if (v) {
        st.dueled = true;
        if (v === 2) await UI.say(U.pick(['제독께서 나서실 것까지 없습니다. 제가 상대하겠습니다!', '저런 녀석은 제게 맡기십시오.', '제독의 칼을 더럽힐 것 없습니다. 제가 나가지요.']), G.Scenes.mateSpeaker('first'));
        var bossZone = st.npc.zone || G.Ships.zone(st.center.lon, st.center.lat), bossStyle = A.fleetStyle(bossZone, st.npc.nation);
        var bossLook = st.npc.kind === 'pirate' ? 'pirate' : 'captain', bossSpec = A.npcSpec('boss' + st.t, 'captain', bossStyle);
        A.withImg(bossSpec, [A.rolePortraitKey(bossSpec), 'portraits/npc/' + bossLook + '_' + A.imageCulture(bossStyle)]);
        var boss = { name: st.npc.kind === 'pirate' ? '해적 두목' : '적 함장', look: bossLook, portrait: bossSpec, str: U.ri(55, 80), atk: U.ri(6, 12), def: U.ri(2, 6), skill: U.ri(0, 1), mar: U.ri(55, 78), int: U.ri(30, 60), cha: U.ri(30, 55) };
        var nb = st.npc.boss;   // 큰 해전: 이름난 적장이 나선다 (js/data/histfigures.js)
        if (nb && nb.hist && G.Hist) { var hs = G.Hist.speaker(nb.hist); boss.name = hs.name; boss.portrait = hs.portrait || boss.portrait; ['str', 'atk', 'def', 'skill', 'mar', 'int', 'cha', 'look'].forEach(function (k) { if (nb[k] != null) boss[k] = nb[k]; }); }
        else if (nb && nb.name) { var cs = st.npc.cap && G.Captains && G.Captains.speaker ? G.Captains.speaker(st.npc) : null; boss.name = nb.name; if (cs && cs.portrait) boss.portrait = cs.portrait; ['str', 'atk', 'def', 'skill', 'mar', 'int', 'cha', 'look'].forEach(function (k) { if (nb[k] != null) boss[k] = nb[k]; }); }
        var res = await G.Games.duel(boss, v === 2 ? { mate: px, place: 'deck' } : { place: 'deck' });
        var ld = G.Games.lastDuel || {}, fm = ld.mate, fd = fm && G.MATE[fm.id];
        if (res === 'win') {
          var how = ld.how, lead = fd ? fd.name + U.jx(fd.name, '이/가') + ' ' : '';
          if (fm) { fm.loyal = Math.min(100, (fm.loyal || 70) + 8); UI.toast(fd.name + '의 충성이 올랐다. (명성 +' + G.Fame.add('bt', 5) + ')', 'sword', 3500); }
          if (how === 'capture') { var ransomG = U.ri(600, 1400); S().player.gold += ransomG; var fmC = G.Fame.add('bt', 8); await UI.say(lead + '두목을 사로잡자 적의 전의가 꺾였다! 적 함대가 항복했다! (두목의 몸값 금화 ' + U.num(ransomG) + '닢, 명성 +' + fmC + ')', {}); }
          else if (how === 'persuade') { var fmP = G.Fame.add('bt', 6); await UI.say(lead + '두목을 설득하자 두목이 칼을 거두었다. 적 함대가 피를 더 흘리지 않고 항복했다! (명성 +' + fmP + ')', {}); }
          else if (how === 'rout') await UI.say(lead + '호통에 두목이 달아나자 적이 우왕좌왕하다 항복했다!', {});
          else await UI.say(lead + '두목을 쓰러뜨리자 적의 전의가 꺾였다! 적 함대가 항복했다!', {});
          if (ld.secret) { S().player.notoriety += 2; UI.toast('비밀무기를 쓴 일로 뒷말이 돈다. (악명 +2)', 'skull', 3500); }
          st.ships.forEach(function (o) { if (o.side === 'en' && o.alive) { o.alive = false; o.captured = true; } });
          st.busy--; checkEnd(); return;
        }
        if (res === 'lose') {
          if (fm) { fm.hurt = S().day + 30; me.crew = Math.max(0, Math.round(me.crew * 0.88)); await UI.say(fd.name + U.jx(fd.name, '이/가') + ' 쓰러졌다! 부하들이 끌어내 물러선다... (30일 동안 다쳐 능력이 절반이 된다)', {}); }
          else { me.crew = Math.max(0, Math.round(me.crew * 0.8)); await UI.say('제독이 쓰러졌다! 부하들의 사기가 떨어진다...', {}); }
        }
      }
    }
    // melee resolution
    // 백병전은 그 배를 지휘하는 사람의 검술과 공격력 (갑판장뿐이면 ×0.9)
    var sword = R.shipSkill(me.src, 'sword'), atk = R.shipAtk(me.src), capK = R.captain(me.src) ? 1 : 0.9;
    // 높은 갑판은 공격·방어 모두 유리하고, 접현 돌격은 먼저 건 쪽의 첫 공격이 세다
    var myK = (has(me, 'highdeck') ? 1.2 : 1) * (!enemyStarted && has(me, 'grapple') ? 1.15 : 1) * (G.SkillCombos ? G.SkillCombos.factor('boardingPower') : 1);
    if (G.Career) myK *= G.Career.boardingK(me.src === S().fleet.ships[0], me.crew, en.crew);
    var enK = (has(en, 'highdeck') ? 1.2 : 1) * (enemyStarted && has(en, 'grapple') ? 1.15 : 1);
    var myPow = me.crew * (1 + sword * 0.18 + atk / 60) * (0.7 + S().fleet.discipline / 300) * myK * capK * (1 + cabinK(me, 'marine'));
    var enSk = (st.npc.kind === 'pirate' ? 1.25 : st.npc.kind === 'navy' ? 1.15 : 0.8) * enK;
    var enPow = en.crew * enSk;
    var rounds = 0;
    while (me.crew > 0 && en.crew > 0 && rounds < 12) {
      rounds++;
      var a = Math.ceil(enPow * U.rf(0.08, 0.16)), b = Math.ceil(myPow * U.rf(0.08, 0.16));
      var lostMe = Math.min(a, me.crew), lostEn = Math.min(b, en.crew);
      me.crew = Math.max(0, me.crew - lostMe); en.crew = Math.max(0, en.crew - lostEn);
      myPow = me.crew * (1 + sword * 0.18 + atk / 60) * (0.7 + S().fleet.discipline / 300) * myK * capK * (1 + cabinK(me, 'marine')); enPow = en.crew * enSk;
      if (en.crew < en.crew0 * 0.15) { lostEn += en.crew; en.crew = 0; }
      await meleeRound(me, en, lostMe, lostEn, rounds);          // 한 판마다: 칼 부딪치는 불꽃·밀려남·쓰러진 수
      if (me.crew < me.crew0 * 0.1) break;
    }
    if (G.Audio) G.Audio.sfx('sword');
    var I4 = IMP();
    if (en.crew <= 0 || me.crew <= 0 || me.crew < me.crew0 * 0.1) {
      st.hsCool = 0; hitstop(I4.hitstopSink); shake(I4.shakeSink * 0.8); flash(I4.flashSink * 0.8, en.crew <= 0 ? '255,240,200' : '255,110,80'); zoomKick(I4.zoomSink * 0.8);
      var lb = en.crew <= 0 ? en : me;
      st.fx.push({ kind: 'float', x: lb.x, y: lb.y - lb.len * 0.5 - 118, text: en.crew <= 0 ? '나포!' : '빼앗김', col: en.crew <= 0 ? '255,222,120' : '255,120,100', size: 40, t: 0, life: 1.7 });
    }
    else pushApart(me, en, I4.knockApart);                        // 양쪽 모두 버티면 두 배가 튕겨 떨어진다
    if (en.crew <= 0) {
      en.alive = false; en.captured = true;
      await UI.say(en.name + U.j(en.name, '을/를').slice(en.name.length) + ' 점령했다! (아군 선원 ' + me.crew + '명 남음)', {});
    } else if (me.crew <= 0 || me.crew < me.crew0 * 0.1) {
      me.alive = false; me.lostBoard = true;
      await UI.say(me.name + '호가 적에게 넘어갔다...', {});
    } else await UI.say('양쪽 모두 큰 피해를 입고 물러섰다.', {});
    st.busy--;
    checkEnd();
  }

  // ---------------------------------------------------------------- end of battle
  function checkEnd() {
    if (st.over) return;
    var mine = st.ships.filter(function (b) { return b.side === 'me' && b.alive; });
    var foes = st.ships.filter(function (b) { return b.side === 'en' && b.alive; });
    var ef = st.enFlag, mf = st.myFlag;
    // 적 기함을 무찔렀다: 남은 적은 싸울 뜻을 잃고 흩어져 달아난다 → 승리
    if (ef && !ef.alive && (ef.sunk || ef.captured) && foes.length) {
      foes.forEach(function (b) { b.alive = false; b.fled = true; b.routed = true; });
      st.over = true; st.flagWin = true;
      log('적 기함 ' + ef.name + U.jx(ef.name, '이/가') + ' ' + (ef.captured ? '나포되었다' : '가라앉았다') + '! 남은 적이 흩어져 달아난다.');
      UI.toast('적 기함을 무찔렀다! 남은 적 ' + foes.length + '척이 흩어져 달아난다.', 'flag', 4200);
      finish('win'); return;
    }
    // 적 기함이 달아났다: 따르던 배도 모두 물러난다
    if (ef && ef.fled && !ef.routed && foes.length) {
      foes.forEach(function (b) { b.alive = false; b.fled = true; b.routed = true; });
      st.over = true; log('적 기함이 달아나자 남은 적도 모두 물러났다.');
      finish(st.ships.some(function (b) { return b.side === 'en' && (b.sunk || b.captured); }) ? 'win' : 'escaped-enemy'); return;
    }
    // 우리 기함을 잃었다 (가라앉거나 빼앗김): 남은 배는 흩어져 달아난다 → 패배
    if (mf && !mf.alive && !mf.fled && mine.length) {
      mine.forEach(function (b) { b.alive = false; b.fled = true; b.routed = true; });
      st.over = true; st.flagLost = true;
      log('기함 ' + mf.name + '호를 잃었다! 남은 배가 흩어져 달아난다.');
      finish('flaglost'); return;
    }
    // 우리 기함이 전장을 벗어났다: 함대 전체가 물러난다
    if (mf && mf.fled && !mf.routed && mine.length) {
      mine.forEach(function (b) { b.alive = false; b.fled = true; b.routed = true; });
      st.over = true; finish('retreat'); return;
    }
    if (!foes.length) { st.over = true; finish(st.ships.some(function (b) { return b.side === 'en' && (b.sunk || b.captured); }) ? 'win' : 'escaped-enemy'); }
    else if (!mine.length) { st.over = true; var anyFled = st.ships.some(function (b) { return b.side === 'me' && b.fled; }); finish(anyFled ? 'retreat' : 'lose'); }
  }
  async function finish(res) {
    // 튜토리얼의 해전에서 지거나 물러나면 되돌려서 다시 싸운다 (js/systems/tutorial.js)
    if (res !== 'win' && res !== 'escaped-enemy' && G.Tutorial && G.Tutorial.active && G.Tutorial.active()) { try { if (await G.Tutorial.battleLost(res)) return; } catch (e) { console.error(e); } }
    var s = S(), f = s.fleet;
    var finishing = st;
    await U.sleep(900);
    if (st !== finishing || S() !== s) return;
    // apply damage & crew back to state
    var survivors = [];
    st.ships.forEach(function (b) {
      if (b.side !== 'me' || b.escort || b.ally) return;          // 호위하는 상선·큰 해전의 우리 편 함대는 내 배·내 선원이 아니다
      if (b.sunk || b.lostBoard) { var i = f.ships.indexOf(b.src); if (i >= 0) f.ships.splice(i, 1); return; }
      b.src.hp = Math.max(1, b.hp); survivors.push(b);
    });
    f.crew = U.sum(survivors, function (b) { return b.crew; }) + (st.spare || 0);   // 빌린 배로 싸웠으면 타지 못한 선원은 그대로
    var lines = [];
    if (G.Growth) G.Growth.battle(res, (st.npc && st.npc.n) || st.ships.filter(function (b) { return b.side !== 'me'; }).length);   // 전투 경험 (js/systems/growth.js)
    if (G.Escort) { try { G.Escort.afterBattle(st.ships, res, lines); } catch (e) { console.error(e); } }   // 호위하던 상선을 잃었는가
    if (st.npc.monster && G.SeaMonsters) {
      G.SeaMonsters.afterBattle(st.npc, res, st.ships);
      var monsterName = G.SEA_MONSTER_ART[st.npc.monster].name;
      if (res === 'win') {
        s.stats.wins++;
        var legend = G.SEA_MONSTERS[st.npc.monster].years > 10;
        var monsterFame = G.Fame.add('bt', legend ? G.BALANCE.seaMonsters.legendFame : G.BALANCE.seaMonsters.commonFame);
        lines.push(monsterName + U.jx(monsterName, '을/를') + ' 무찔렀다! (전투 명성 +' + monsterFame + ')');
        lines.push('다음 출몰은 ' + G.SEA_MONSTERS[st.npc.monster].years + '년 뒤, 다른 바다에서 일어납니다.');
        await UI.alert(lines.join('<br>'), '해상 괴물 토벌');
      } else {
        await UI.alert(monsterName + '의 공격을 피해 물러났다. 괴물은 그 해역에 남아 있다.', '해상 괴물 — 퇴각');
        if (!f.ships.length) await ransom(true);
      }
    } else if (res === 'win') {
      s.stats.wins++;
      if (G.SeaFolk) G.SeaFolk.afterBattle(st.npc, res, lines);   // 탐험 함대를 꺾으면 그 항해가 한 해 늦어진다
      if (G.Captains) G.Captains.afterBattle(st.npc, res, st.ships, lines);   // 이름난 선장·해적의 기함을 나포하면 사로잡는다 (seacaptains.js)
      if (G.Court) G.Court.afterBattle(st.npc, res, st.ships, lines);   // 왕명: 나포·해적 토벌·왕녀 구출
      if (G.Princess) G.Princess.afterBattle(st.npc, res, st.ships, lines);   // 사라진 왕녀: 레반트의 해적 함대·요새의 함대
      if (G.Napoleon) G.Napoleon.afterBattle(st.npc, res, st.ships, lines);   // 코르시카 바다의 소년 나폴레옹 (포격으로) · 사로잡힌 가족 (백병전으로) — js/systems/napoleon.js
      if (G.Rel) G.Rel.afterBattle(st.npc, res, lines);   // 큰 해전(무적함대·레판토)의 보상
      var gold = 0, caps = [];
      st.ships.forEach(function (b) {
        if (b.side !== 'en') return;
        if (b.sunk || b.captured) gold += Math.round((st.npc.kind === 'merchant' ? 1400 : st.npc.kind === 'pirate' ? ((G.BALANCE && G.BALANCE.pirateLoot) || 900) : 700) * U.rf(0.6, 1.4) * (st.npc.kind === 'pirate' ? Math.max(1, G.SHIP[b.type].cap / 200) : G.SHIP[b.type].cap / 200));   // 작은 해적선도 한 척 몫은 낸다
        if (b.captured && !st.npc.noPrize) caps.push(b);   // noPrize: 호수의 카누·브리건틴은 끌고 갈 수 없다
      });
      s.player.gold += gold;
      var fame = st.npc.kind === 'pirate' ? ((G.BALANCE && G.BALANCE.pirateFameGain) || 25) * Math.max(1, st.ships.filter(function (b) { return b.side === 'en' && (b.sunk || b.captured); }).length) : 10;   // 달아난 배는 치지 않는다
      fame = G.Fame.add('bt', fame); if (st.npc.kind !== 'pirate' && !st.npc.great && !(G.Court && G.Court.lawful(st.npc))) s.player.notoriety += 5;   // 큰 해전(무적함대·레판토·제노바·아즈텍 호수)은 나라 편에 선 싸움 — 악명을 붙이지 않는다 (QA 2026-10-23)
      s.stats.sunk += st.ships.filter(function (b) { return b.side === 'en' && b.sunk; }).length;
      // 조합의 해적 퇴치 의뢰
      if (st.npc.kind === 'pirate' && G.Quest) {
        var beaten = st.ships.filter(function (b) { return b.side === 'en' && (b.sunk || b.captured); }).length;
        if (beaten) G.Quest.onPirateBeaten(beaten);
      }
      if (st.flagWin) { fame += G.Fame.add('bt', 10); }
      lines.push((st.flagWin ? '적 기함을 무찔러 이겼다! ' : '승리했다! ') + '전리품으로 금화 ' + U.num(gold) + '닢을 얻었다. (명성 +' + fame + ')' + (st.flagWin ? '<br><span class="muted">남은 적 배는 흩어져 달아났다.</span>' : ''));
      G.State.log((st.npc.kind === 'pirate' ? '해적' : st.npc.kind === 'navy' ? '함대' : '상선단') + '과의 해전에서 승리했다.');
      if (G.Audio) { G.Audio.sfx('cheer'); setTimeout(function () { if (G.Audio) G.Audio.sfx('coin'); }, 720); }
      // 해적은 장신구·무기·도구 같은 물건을 떨어뜨리기도 한다
      var drops = st.npc.kind === 'pirate' ? pirateDrops(st.ships.filter(function (b) { return b.side === 'en' && (b.sunk || b.captured); })) : [];
      if (drops.length) lines.push('해적선에서 ' + drops.map(function (d) { var pic = G.Img.itemSrc(d.id); return (pic ? '<img class="inline-ic" src="' + pic + '" alt="">' : '') + '<b>' + d.name + '</b>' + (d.kept ? '' : ' <span class="muted">(소지품이 가득 차 버렸다)</span>'); }).join(', ') + U.jx(drops[drops.length - 1].name, '을/를') + ' 건졌다.');
      await UI.alert(lines.join('<br>'), '해전 승리');
      if (caps.length) await prizeFleet(caps.map(prizeShip));
      if (caps.length) await prizeHolds(caps);     // 나포선의 식량·물·자재·교역품·따르겠다는 선원을 옮겨 싣는다
      if (G.Princess) { try { await G.Princess.tell(); } catch (e) { console.error(e); } }   // 사로잡은 두목의 실토 · 왕녀와의 만남
      if (G.Napoleon) { try { await G.Napoleon.tell(); } catch (e) { console.error(e); } }   // 바다에서 건진 소년 · 짐칸의 가족
    } else if (res === 'flaglost') {
      // 기함을 잃고 흩어져 달아났다: 쫓기며 짐 절반을 버렸다
      var lostK = 0;
      if (!st.npc.myFleet) Object.keys(f.cargo).forEach(function (k) { var c = f.cargo[k], d = Math.ceil(c.q / 2); c.q -= d; lostK += d; if (c.q <= 0) delete f.cargo[k]; });   // 빌린 배로 싸웠으면 짐은 뭍의 내 배에 그대로
      await UI.alert((st.myFlag ? '기함 ' + st.myFlag.name + '호를 잃었다! ' : '') + '지휘를 잃은 함대가 흩어져 달아났다...' + (lostK ? '<br>쫓기는 동안 짐 ' + lostK + '통을 바다에 버렸다.' : '') + (f.ships.length ? '<br><span class="muted">새 기함: ' + U.esc(f.ships[0].name) + '호</span>' : ''), '패배 — 기함 상실');
      if (!f.ships.length) { await ransom(); }
    } else if (res === 'escaped-enemy') {
      await UI.alert('적이 모두 달아났다.', '해전 종료');
    } else if (res === 'retreat') {
      await UI.alert('간신히 전장을 벗어났다.', '퇴각');
    } else if (st.npc.great) {
      // 큰 해전에서 졌다: 우리 편 함대가 물러나는 길을 열어 주어 짐은 지켰다
      if (!f.ships.length) { await UI.alert('모든 배를 잃고 말았다... 제독은 포로가 되었다.', '패배'); await ransom(); }
      else await UI.alert('우리 편 함대가 물러날 길을 열어 주어 간신히 빠져나왔다.', '큰 해전 — 퇴각');
    } else {
      // defeat
      if (!f.ships.length) {
        await UI.alert('모든 배를 잃고 말았다... 제독은 포로가 되었다.', '패배');
        await ransom();
      } else {
        var lostG = Math.floor(s.player.gold * 0.4); s.player.gold -= lostG;
        f.cargo = {};
        await UI.alert('패배했다... 짐을 모두 빼앗기고 금화 ' + U.num(lostG) + '닢을 약탈당했다.', '패배');
      }
    }
    if (res !== 'win' && G.Princess) G.Princess.afterBattle(st.npc, res, st.ships, null);
    if (res !== 'win' && st.npc.great && G.Rel) G.Rel.afterBattle(st.npc, res, null);   // 큰 해전에서 물러났다   // 사라진 왕녀: 놓친 함대는 며칠 뒤에 다시
    if (f.crew <= 0 && f.ships.length) f.crew = Math.max(3, Math.round(R.crewMin() * 0.3));
    G.Scenes.city.B.harbor.trimCrew && G.Scenes.city.B.harbor.trimCrew();
    if (G.Game.scene !== B) return;
    if (!f.ships.length) return;
    if (st.npc.backCity != null && G.CITY_DATA[st.npc.backCity]) { var bc = st.npc.backCity; UI.fade(function () { G.Game.go('city', { cityId: bc }); }); return; }   // 도시에서 나선 싸움이면 그 도시로 (호수의 큰 싸움)
    UI.fade(function () { G.Game.go('sea', { resume: true }); });
  }
  /** 해적의 물건: 무찌른 배마다 45%로 하나 — 장신구(선물)가 가장 흔하고, 무기·방어구·항해도구. 값진 것일수록 드물다 */
  function pirateDrops(beaten) {
    var s = S(), out = [];
    var pool = G.ITEMS.filter(function (it) { return !it.rare && it.price > 0 && (it.kind === 'gift' || it.kind === 'weapon' || it.kind === 'armor' || it.kind === 'tool') && (!it.from || s.date.y >= it.from); });
    beaten.forEach(function (b) {
      if (!U.chance(0.45) || !pool.length) return;
      var w = pool.map(function (it) { return (it.kind === 'gift' ? 3 : it.kind === 'weapon' ? 1.6 : 1) * 1000 / Math.max(200, it.price); });
      var tot = U.sum(w), r = U.rand() * tot, it = pool[0];
      for (var i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) { it = pool[i]; break; } }
      var kept = R.addItem(it.id);   // 칸이 차면 못 챙긴다 — 같은 물건이 있으면 그 칸에 (2026-10-20)
      out.push({ id: it.id, name: it.name, kept: kept });
    });
    return out;
  }
  /** 나포한 배를 우리 배처럼 만든다 */
  function prizeShip(b) {
    var t = G.SHIP[b.type];
    var sh = R.newShip(b.type, b.name.replace(/ \d+호$/, '') === b.name ? b.name : U.pick(G.SHIP_NAMES));
    sh.hp = Math.max(1, Math.round(b.hp > 0 ? b.hp : t.hp * 0.3)); sh.guns = { type: b.guns.type, n: Math.min(b.guns.n, sh.ports) };
    sh._prize = true;
    return sh;
  }
  /** 나포한 뒤 함대 정리: 지금 배와 나포한 배 가운데 가져갈 배를 고른다 (최대 G.MAX_SHIPS척).
      나포선은 「판다」(값의 prizeSale)·「가라앉힌다」, 우리 배는 「버린다」(기함·빌린 배는 버릴 수 없다). 짐칸이 모자라면 넘치는 교역품을 버린다 */
  async function prizeFleet(prizes) {
    var s = S(), f = s.fleet, MAX = G.MAX_SHIPS, BAL = G.BALANCE || {};
    var list = f.ships.map(function (sh, i) { return { sh: sh, own: true, keep: true, lock: i === 0 ? '기함' : sh.loan ? '빌린 배' : null }; })
      .concat(prizes.map(function (sh) { return { sh: sh, own: false, keep: false, sale: Math.round(R.shipValue(sh) * (BAL.prizeSale || 0.6)), sink: false }; }));
    // 자리가 남으면 나포선을 먼저 넣어 둔다 (값이 큰 배부터)
    prizes.map(function (sh, i) { return list[f.ships.length + i]; }).sort(function (a, b) { return b.sale - a.sale; }).forEach(function (x) { if (list.filter(function (y) { return y.keep; }).length < MAX) x.keep = true; });
    var win = UI.window({ title: '나포한 배 — 함대 정리', icon: 'ship', width: 1100, closable: false,
      html: '<div class="muted" style="font-size:16px;margin-bottom:8px">함대에는 ' + MAX + '척까지 둘 수 있습니다. 가져갈 배를 고르십시오. 두고 가는 나포선은 팔거나 가라앉히고, 우리 배를 버리면 그 배는 여기 남습니다(선원·짐은 옮겨 싣습니다).</div><div class="pf-body"></div><div class="pf-info" style="margin-top:10px;font-size:17px"></div>',
      buttons: [{ label: '이대로 정한다', value: 'ok', cls: 'navy' }] });
    var body = win.content.querySelector('.pf-body'), info = win.content.querySelector('.pf-info'), okBtn = win.el.querySelector('.foot .btn.navy');
    function row(x, i) {
      var sh = x.sh, t = G.SHIP[sh.type];
      var st = x.keep ? '<span class="good-text">가져간다</span>' : x.own ? '<span class="warn-text">버린다</span>' : x.sink ? '<span class="muted">가라앉힌다</span>' : '판다 (금화 ' + U.num(x.sale) + ')';
      var btns = x.lock ? '<span class="muted">' + x.lock + '</span>' :
        '<button class="btn small" data-i="' + i + '" data-a="keep"' + (x.keep ? ' disabled' : '') + '>가져간다</button> ' +
        (x.own ? '<button class="btn small" data-i="' + i + '" data-a="drop"' + (!x.keep ? ' disabled' : '') + '>버린다</button>'
          : '<button class="btn small" data-i="' + i + '" data-a="sell"' + (!x.keep && !x.sink ? ' disabled' : '') + '>판다</button> <button class="btn small" data-i="' + i + '" data-a="sink"' + (x.sink ? ' disabled' : '') + '>가라앉힌다</button>');
      return '<tr' + (x.keep ? '' : ' style="opacity:.6"') + '><td>' + (x.own ? '우리 배' : '<b>나포</b>') + '</td><td><b>' + U.esc(sh.name) + '</b></td><td>' + t.name + ' <small class="muted">' + (G.SHIP_LV ? G.SHIP_LV[t.lv] || '' : '') + '</small></td>' +
        '<td class="num">' + Math.round(sh.hp) + '/' + sh.maxHp + '</td><td class="num">' + R.shipCargoCap(sh) + '</td><td class="num">' + sh.crewMin + '~' + sh.crewMax + '</td><td class="num">' + sh.guns.n + '</td><td>' + st + '</td><td>' + btns + '</td></tr>';
    }
    function draw() {
      body.innerHTML = '<table class="tbl"><tr><th></th><th>선명</th><th>선종</th><th class="num">내구</th><th class="num">짐칸</th><th class="num">선원</th><th class="num">대포</th><th>정한 것</th><th></th></tr>' + list.map(row).join('') + '</table>';
      var keep = list.filter(function (x) { return x.keep; }), cap = U.sum(keep, function (x) { return R.shipCargoCap(x.sh); });
      var cmin = U.sum(keep, function (x) { return x.sh.crewMin; }), cmax = U.sum(keep, function (x) { return x.sh.crewMax; });
      var sale = U.sum(list, function (x) { return !x.own && !x.keep && !x.sink ? x.sale : 0; });
      var over = R.used() - cap;
      info.innerHTML = '가져가는 배 <b>' + keep.length + '/' + MAX + '척</b> · 짐칸 ' + U.num(cap) + '통 (지금 실은 것 ' + U.num(R.used()) + '통' + (over > 0 ? ' — <span class="warn-text">넘치는 ' + Math.ceil(over) + '통은 버림</span>' : '') + ') · 필요한 선원 ' + cmin + '~' + cmax + '명 (지금 ' + f.crew + '명' + (f.crew > cmax ? ' — <span class="warn-text">' + (f.crew - cmax) + '명은 탈 자리가 없음</span>' : f.crew < cmin ? ' — <span class="warn-text">모자람</span>' : '') + ')' + (sale ? ' · 파는 값 금화 <b>' + U.num(sale) + '</b>닢' : '');
      okBtn.disabled = keep.length > MAX; okBtn.classList.toggle('disabled', keep.length > MAX);
      U.$$('button[data-i]', body).forEach(function (b) {
        b.onclick = function () {
          var x = list[+b.dataset.i], a = b.dataset.a;
          if (a === 'keep') { if (list.filter(function (y) { return y.keep; }).length >= MAX) { UI.toast('함대에는 ' + MAX + '척까지입니다. 먼저 다른 배를 빼십시오.', 'ship'); return; } x.keep = true; x.sink = false; }
          else if (a === 'drop') x.keep = false;
          else if (a === 'sell') { x.keep = false; x.sink = false; }
          else if (a === 'sink') { x.keep = false; x.sink = true; }
          draw();
        };
      });
    }
    draw();
    await win.result;
    var keepShips = [], got = 0, dropped = [];
    list.forEach(function (x) {
      if (x.keep) { keepShips.push(x.sh); if (!x.own) { delete x.sh._prize; s.stats.captured++; } }
      else if (x.own) dropped.push(x.sh.name);
      else if (!x.sink) got += x.sale;
    });
    // 기함은 늘 맨 앞
    f.ships = keepShips;
    s.player.gold += got;
    R.tidyCaptains();
    if (G.CrewAuto) G.CrewAuto.refresh();   // 나포한 배·잃은 배 — 다른 배의 선장·조타수·갑판·파수꾼을 다시 (js/systems/crewauto.js)
    var leftCrew = Math.max(0, f.crew - R.crewMax()); if (leftCrew) f.crew = R.crewMax();   // 탈 자리가 없는 선원은 버린 배에 남는다
    var over = Math.ceil(R.used() - R.fleetCap()), lost = 0;
    if (over > 0) {      // 넘치는 짐: 싼 교역품부터 버린다
      Object.keys(f.cargo).sort(function (a, b) { return G.GOOD[a].p - G.GOOD[b].p; }).forEach(function (k) { if (over <= 0) return; var c = f.cargo[k], d = Math.min(c.q, over); c.q -= d; over -= d; lost += d; if (c.q <= 0) delete f.cargo[k]; });
      if (over > 0) { var fw = Math.min(over, f.food * 0.5); f.food -= fw; f.water = Math.max(0, f.water - (over - fw)); }
    }
    var msg = [];
    var newOnes = keepShips.filter(function (sh) { return prizes.indexOf(sh) >= 0; });
    if (newOnes.length) msg.push(newOnes.map(function (sh) { return sh.name + '호'; }).join('·') + U.jx(newOnes[newOnes.length - 1].name + '호', '을/를') + ' 함대에 넣었다');
    if (got) msg.push('나포선을 팔아 금화 ' + U.num(got) + '닢');
    if (dropped.length) msg.push(dropped.join('·') + '호를 두고 왔다');
    if (lost) msg.push('짐칸이 모자라 교역품 ' + lost + '통을 버렸다');
    if (leftCrew) msg.push('선원 ' + leftCrew + '명은 버린 배에 남았다');
    if (msg.length) UI.toast(msg.join(' · '), 'ship', 5200);
  }
  /* 나포한 배의 짐: 식량·물·자재·교역품을 옮겨 싣고, 붙잡은 선원 가운데 따르겠다는 사람을 태운다.
     양은 배의 크기(짐칸)와 적의 종류(상선은 교역품, 해적은 약탈품, 군함은 자재·보급)로 정한다 — G.BALANCE.prizeHold */
  function holdBal() {
    var d = { food: [0.05, 0.12], water: [0.05, 0.12], mat: [0.02, 0.06], goods: { merchant: [0.35, 0.7], pirate: [0.1, 0.3], navy: [0, 0.08] },
      matK: { navy: 1.6 }, join: { merchant: 0.3, pirate: 0.5, navy: 0.2 }, crewLeft: [0.15, 0.4] };
    var b = G.BALANCE && G.BALANCE.prizeHold; if (!b) return d;
    for (var k in b) d[k] = b[k];
    return d;
  }
  /** 이 바다 가까운 항구들의 교역품 (상선이 싣고 다닐 만한 것) */
  function nearGoods() {
    var l = S().loc, out = [];
    G.CITY_DATA.filter(function (c) { return c && c.port && c.goods && c.goods.length && R.cityExists(c); })
      .map(function (c) { return { c: c, d: G.Geo.dist(l.lon, l.lat, c.lon, c.lat) }; })
      .sort(function (a, b) { return a.d - b.d; }).slice(0, 4)
      .forEach(function (x) { R.cityGoods(x.c).forEach(function (id) { if (G.GOOD[id] && out.indexOf(id) < 0 && !(G.Slave && G.Slave.is(id))) out.push(id); }); });
    if (!out.length) out = G.GOODS.filter(function (g) { return !g.nw && !g.plant; }).map(function (g) { return g.id; });
    return out;
  }
  /** 나포선마다 실린 것을 모은다: [{key, kind:'food'|'water'|'mat'|'good'|'crew', id, name, q}] */
  function prizeLoot(caps) {
    var B = holdBal(), kind = (st.npc && st.npc.kind) || 'pirate', pool = nearGoods(), sum = { food: 0, water: 0, mat: 0, crew: 0 }, goods = {};
    var rf = function (r) { return U.rf(r[0], r[1]); };
    caps.forEach(function (b) {
      var t = G.SHIP[b.type], cap = t.cap;
      sum.food += Math.round(cap * rf(B.food)); sum.water += Math.round(cap * rf(B.water));
      sum.mat += Math.round(cap * rf(B.mat) * ((B.matK && B.matK[kind]) || 1));
      var gq = Math.round(cap * rf(B.goods[kind] || B.goods.pirate));
      if (gq > 0) {
        var n = kind === 'merchant' && gq > 30 && U.chance(0.6) ? 2 : 1;
        for (var i = 0; i < n; i++) { var id = U.pick(pool); goods[id] = (goods[id] || 0) + Math.round(gq / n); }
      }
      var left = b.crew > 0 ? b.crew : Math.round(t.crew[0] * rf(B.crewLeft));
      sum.crew += Math.round(left * ((B.join && B.join[kind]) || 0.3));
    });
    var out = [];
    if (sum.food > 0) out.push({ key: 'food', kind: 'food', name: '식량', icon: 'bread', q: sum.food });
    if (sum.water > 0) out.push({ key: 'water', kind: 'water', name: '물', icon: 'drop', q: sum.water });
    if (sum.mat > 0) out.push({ key: 'mat', kind: 'mat', name: '자재', icon: 'hammer', q: sum.mat });
    Object.keys(goods).sort(function (a, b) { return G.GOOD[b].p - G.GOOD[a].p; }).forEach(function (id) { if (goods[id] > 0) out.push({ key: 'g:' + id, kind: 'good', id: id, name: G.GOOD[id].name, icon: 'sack', q: goods[id] }); });
    if (sum.crew > 0) out.push({ key: 'crew', kind: 'crew', name: '항해 인원 (따르겠다는 포로)', icon: 'people', q: sum.crew });
    return out;
  }
  async function prizeHolds(caps) {
    var s = S(), f = s.fleet, items = prizeLoot(caps);
    if (!items.length) return;
    var K = (G.BALANCE && G.BALANCE.cargo) || {};
    var supW = K.supWt != null ? K.supWt : 1, matW = K.matWt != null ? K.matWt : 1.2, crewW = K.crewWt != null ? K.crewWt : 0.1;
    function wtOf(x) { return x.kind === 'good' ? (G.Cargo ? G.Cargo.wt(x.id) : 1) : x.kind === 'mat' ? matW : x.kind === 'crew' ? crewW : supW; }
    var vol0 = Math.floor(R.freeVol()), wt0 = G.Cargo ? G.Cargo.wfree() : Infinity, seatLeft = Math.max(0, R.crewMax() - f.crew);
    var kinds0 = Object.keys(f.cargo).length, maxKinds = R.maxKinds();
    items.forEach(function (x) { x.take = 0; x.max = x.kind === 'crew' ? Math.min(x.q, seatLeft) : x.q; if (x.kind === 'good' && !f.cargo[x.id] && kinds0 >= maxKinds) { x.max = 0; x.noKind = true; } });
    function usage() {
      var v = 0, w = 0, nk = 0;
      items.forEach(function (x) { if (x.kind !== 'crew') v += x.take; w += x.take * wtOf(x); if (x.kind === 'good' && x.take > 0 && !f.cargo[x.id]) nk++; });
      return { v: v, w: w, nk: nk };
    }
    /** 자리만큼 채운다: 물·식량 → 자재 → 비싼 교역품 → 선원 */
    function fill() {
      items.forEach(function (x) { x.take = 0; });
      var order = items.slice().sort(function (a, b) { var r = { water: 0, food: 1, mat: 2, good: 3, crew: 4 }; return (r[a.kind] - r[b.kind]) || ((b.id ? G.GOOD[b.id].p : 0) - (a.id ? G.GOOD[a.id].p : 0)); });
      order.forEach(function (x) {
        if (!x.max) return;
        var u = usage(), roomV = x.kind === 'crew' ? Infinity : vol0 - u.v, roomW = (wt0 - u.w) / wtOf(x);
        if (x.kind === 'good' && !f.cargo[x.id] && kinds0 + u.nk >= maxKinds) return;
        x.take = Math.max(0, Math.min(x.max, Math.floor(Math.min(roomV, roomW) + 1e-9)));
      });
    }
    fill();
    var win = UI.window({ title: '나포한 배의 짐', icon: 'sack', width: 820, closable: false,
      html: '<div class="muted" style="font-size:16px;margin-bottom:8px">나포한 배' + (caps.length > 1 ? ' ' + caps.length + '척' : '') + '에 실려 있던 것입니다. 옮겨 실을 만큼 정하십시오(◀ ▶ 단추나 키보드 ←→로 하나씩, Shift는 10씩 · ↑↓로 줄을 고릅니다). 싣지 않은 것은 배와 함께 두고 갑니다. 교역품은 품목 ' + maxKinds + '종까지, 선원은 탈 자리(' + seatLeft + '명)만큼.</div>' +
        '<div class="ph-quick flex" style="gap:8px;margin-bottom:8px"><button class="btn small" data-q="fill">자리만큼 싣는다</button><button class="btn small" data-q="none">아무것도 싣지 않는다</button></div>' +
        '<table class="tbl ph-tbl"></table><div class="ph-info" style="margin-top:10px;font-size:17px"></div>',
      buttons: [{ label: '옮겨 싣는다', value: 'ok', cls: 'navy' }] });
    var tbl = win.content.querySelector('.ph-tbl'), info = win.content.querySelector('.ph-info'), okBtn = win.el.querySelector('.foot .btn.navy');
    /* 수량 조절 (2026-10-20): 줄마다 ◀ ▶ (누르고 있으면 빨라진다, Shift는 10씩), 키보드 ←→ (Shift 10씩) · ↑↓ 줄 고르기 · Home 0 · End 최대.
       표는 한 번만 만들고 값만 고친다 — 예전엔 값이 바뀔 때마다 표를 새로 그려 막대를 끌던 손이 놓쳤다. */
    var sel = 0; for (var si = 0; si < items.length; si++) if (items[si].max) { sel = si; break; }
    /** 이 줄에 더 실을 수 있는 최대 (짐칸·무게 여유 안에서) */
    function fitMax(x) {
      var keep = x.take; x.take = 0;
      var u2 = usage(), roomV = x.kind === 'crew' ? Infinity : vol0 - u2.v, roomW = (wt0 - u2.w) / wtOf(x);
      x.take = keep;
      return Math.max(0, Math.min(x.max, Math.floor(Math.min(roomV, roomW) + 1e-9)));
    }
    function setTake(i, v) { var x = items[i]; if (!x || !x.max) return; x.take = U.clamp(Math.round(v), 0, x.max); refresh(); }
    function step(i, d) {
      var x = items[i]; if (!x || !x.max) return;
      if (d > 0) setTake(i, Math.min(Math.max(x.take, fitMax(x)), x.take + d));   // 넘치게는 늘리지 않는다
      else setTake(i, x.take + d);
    }
    function select(i) { if (items[i] && items[i].max) { sel = i; refresh(); } }
    var hold = null;
    function stopHold() { if (hold) { clearTimeout(hold.t); hold = null; } }
    function startHold(i, d) {
      stopHold(); step(i, d);
      var h = hold = { n: 0 };
      (function again(delay) {
        h.t = setTimeout(function () {
          if (hold !== h) return;
          var before = items[i].take; h.n++; step(i, d * (h.n > 24 ? 10 : 1));
          if (items[i].take === before) { stopHold(); return; }   // 끝에 닿으면 멈춘다 (잠긴 단추는 손을 뗀 것을 알리지 못한다)
          again(h.n > 6 ? 45 : 95);
        }, delay);
      })(380);
    }
    function build() {
      tbl.innerHTML = '<tr><th>실린 것</th><th class="num">있는 양</th><th style="width:48%">옮겨 싣기 <small class="muted">◀ ▶ · 키보드 ←→</small></th><th class="num">싣는 양</th></tr>' + items.map(function (x, i) {
        var unit = x.kind === 'crew' ? '명' : '통', note = x.noKind ? ' <small class="warn-text">품목 칸이 가득</small>' : x.kind === 'crew' && x.max < x.q ? ' <small class="muted">탈 자리 ' + x.max + '명</small>' : x.kind === 'good' && G.Cargo && G.Cargo.wt(x.id) !== 1 ? ' <small class="muted">무게 ' + G.Cargo.wt(x.id) + '</small>' : '';
        var dis = x.max ? '' : ' disabled';
        return '<tr data-row="' + i + '"><td>' + G.icon(x.icon) + ' ' + U.esc(x.name) + note + '</td><td class="num">' + U.num(x.q) + unit + '</td>' +
          '<td><div class="flex" style="gap:5px;align-items:center">' +
          '<button class="btn small ph-step" data-i="' + i + '" data-d="-1" title="하나 덜 (Shift 10) · 키보드 ←"' + dis + '>◀</button>' +
          '<input type="range" data-i="' + i + '" min="0" max="' + x.max + '" value="' + x.take + '"' + dis + ' style="flex:1;min-width:0">' +
          '<button class="btn small ph-step" data-i="' + i + '" data-d="1" title="하나 더 (Shift 10) · 키보드 →"' + dis + '>▶</button>' +
          '<button class="btn small" data-max="' + i + '"' + dis + '>최대</button></div></td>' +
          '<td class="num"><b class="ph-take"></b>' + unit + '</td></tr>';
      }).join('');
      U.$$('tr[data-row]', tbl).forEach(function (tr) { tr.addEventListener('pointerdown', function () { select(+tr.dataset.row); }); });
      U.$$('input[type=range]', tbl).forEach(function (r) { r.oninput = function () { sel = +r.dataset.i; items[sel].take = +r.value; refresh(); }; });
      U.$$('button.ph-step', tbl).forEach(function (b) {
        var i = +b.dataset.i, d = +b.dataset.d;
        b.addEventListener('pointerdown', function (e) { if (e.button) return; e.preventDefault(); sel = i; startHold(i, d * (e.shiftKey ? 10 : 1)); });
        b.addEventListener('click', function (e) { if (e.detail === 0) { sel = i; step(i, d * (e.shiftKey ? 10 : 1)); } });   // 키보드로 누른 단추
      });
      U.$$('button[data-max]', tbl).forEach(function (b) { b.onclick = function () { var i = +b.dataset.max; sel = i; setTake(i, fitMax(items[i])); }; });
    }
    function refresh() {
      items.forEach(function (x, i) {
        var tr = tbl.querySelector('tr[data-row="' + i + '"]'); if (!tr) return;
        var r = tr.querySelector('input[type=range]'); if (+r.value !== x.take) r.value = x.take;
        tr.querySelector('.ph-take').textContent = U.num(x.take);
        var bs = tr.querySelectorAll('button.ph-step');
        if (x.max) { bs[0].disabled = x.take <= 0; bs[1].disabled = x.take >= fitMax(x); }   // 더 실을 자리가 없으면 ▶ 잠금
        tr.style.background = i === sel ? 'rgba(201,154,60,.16)' : '';
        tr.style.boxShadow = i === sel ? 'inset 3px 0 0 #c99a3c' : '';
      });
      var u = usage(), overV = u.v - vol0, overW = u.w - wt0, overK = kinds0 + u.nk > maxKinds;
      info.innerHTML = '짐칸 <b>' + U.num(Math.max(0, vol0 - u.v)) + '</b>통 남음' + (G.Cargo ? ' · 무게 여유 ' + U.num(Math.max(0, Math.floor(wt0 - u.w))) : '') +
        (overV > 0 ? ' — <span class="warn-text">짐칸이 ' + Math.ceil(overV) + '통 넘침</span>' : overW > 0 ? ' — <span class="warn-text">배가 버티는 무게를 넘음</span>' : '') +
        (overK ? ' — <span class="warn-text">교역품 품목이 ' + maxKinds + '종을 넘음</span>' : '');
      var bad = overV > 0 || overW > 0.001 || overK;
      okBtn.disabled = bad; okBtn.classList.toggle('disabled', bad);
    }
    var draw = refresh;
    U.$$('button[data-q]', win.content).forEach(function (b) { b.onclick = function () { if (b.dataset.q === 'fill') fill(); else items.forEach(function (x) { x.take = 0; }); draw(); }; });
    build(); refresh();
    var unkey = UI.pushKey ? UI.pushKey(function (e) {
      var k = e.key, m = e.shiftKey ? 10 : 1;
      if (k === 'ArrowLeft' || k === 'ArrowRight') { step(sel, k === 'ArrowRight' ? m : -m); return true; }
      if (k === 'ArrowUp' || k === 'ArrowDown') {
        var dir = k === 'ArrowDown' ? 1 : -1;
        for (var j = sel + dir; j >= 0 && j < items.length; j += dir) if (items[j].max) { sel = j; break; }
        refresh(); var tr = tbl.querySelector('tr[data-row="' + sel + '"]'); if (tr && tr.scrollIntoView) tr.scrollIntoView({ block: 'nearest' });
        return true;
      }
      if (k === 'Home') { setTake(sel, 0); return true; }
      if (k === 'End') { var x = items[sel]; if (x) setTake(sel, Math.max(x.take, fitMax(x))); return true; }
      return false;
    }) : function () {};
    document.addEventListener('pointerup', stopHold); document.addEventListener('pointercancel', stopHold);
    try { await win.result; } finally { unkey(); stopHold(); document.removeEventListener('pointerup', stopHold); document.removeEventListener('pointercancel', stopHold); }
    var got = [];
    items.forEach(function (x) {
      if (!x.take) return;
      if (x.kind === 'food') f.food += x.take;
      else if (x.kind === 'water') f.water += x.take;
      else if (x.kind === 'mat') f.mat = (f.mat || 0) + x.take;
      else if (x.kind === 'crew') { f.crew += x.take; f.discipline = Math.max(20, f.discipline - x.take * 0.3); }   // 낯선 뱃사람이 섞여 규율이 조금 흔들린다
      else if (x.kind === 'good') {
        var cg = f.cargo[x.id];
        if (cg) { cg.cost = Math.round(cg.cost * cg.q / (cg.q + x.take)); cg.d = Math.round((cg.d * cg.q + s.day * x.take) / (cg.q + x.take)); cg.q += x.take; }
        else f.cargo[x.id] = { q: x.take, cost: 0, from: null, d: s.day, prize: true };
      }
      got.push(x.name.replace(/ \(.*\)$/, '') + ' ' + U.num(x.take) + (x.kind === 'crew' ? '명' : '통'));
    });
    if (got.length) { UI.toast('나포한 배에서 ' + got.join(' · ') + U.jx(got[got.length - 1], '을/를') + ' 옮겨 실었다.', 'sack', 5200); G.State.log('나포한 배에서 ' + got.join(', ') + '을(를) 얻었다.'); }
    if (G.Game.refreshHud) G.Game.refreshHud();
  }
  async function ransom(rescued) {
    var s = S(), p = s.player;
    var fee = Math.floor((p.gold + p.bank) * 0.5);
    var fromGold = Math.min(p.gold, fee);                   // 모자라는 만큼만 금고에서 (예전에는 금고에서 몸값을 한 번 더 냈다)
    p.gold -= fromGold; p.bank = Math.max(0, (p.bank || 0) - (fee - fromGold));
    var home = G.CITY_DATA[p.home];
    await UI.say(rescued ? '지나가던 배에 구조되어 치료와 귀향 비용을 치렀다. 몇 달 뒤 고향 ' + home.name + '에 돌아왔다...' : '몸값을 치르고 풀려났다. 몇 달 뒤, 겨우 고향 ' + home.name + '에 돌아왔다...', {});
    G.Game.passDays(90);
    s.fleet = R.restartFleet(s.fleet.ships[0] && s.fleet.ships[0].type);
    G.Fame.add('bt', -100);
    UI.fade(function () { G.Game.go('city', { cityId: p.home }); });
  }

  // ---------------------------------------------------------------- 물보라 (포탄이 떨어진 자리, 가라앉는 배)
  /* 해전의 배 움직임·물보라 조정값: accel/decel = 속력이 붙고 줄어드는 시간(초), lateral = 옆 미끄러짐이 줄어드는 시간(초),
     day = 물보라의 '하루'(초) — 바다 장면의 항적·물보라 수치를 그대로 쓰기 위한 시간 환산, ref = 물보라 세기 기준 속력(px/하루) */
  var BFX = (G.FX && G.FX.battle) || { accel: 1.6, decel: 2.4, lateral: 0.45, day: 3.0, ref: 105, wakeLife: 2.2, wakeSpacing: 5 };
  function rs(f, i) { return ((f.seed * 9301 + i * 49297) % 233280) / 233280; }
  /** 포탄이 물에 떨어진 자리: 퍼지는 고리와 옅어지는 거품 자국 (배 아래에) */
  function splashUnder(ctx, p, f, u) {
    var a = 1 - u;
    if (G.WaterSplash) G.WaterSplash.ripple(ctx, p[0], p[1], 28, u, f.seed);
    for (var i = 0; i < 5; i++) { var r0 = rs(f, i), ang = r0 * 6.2832, d = (4 + u * 16) * (0.3 + rs(f, i + 7)); ctx.fillStyle = 'rgba(240,248,250,' + (0.35 * a).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(p[0] + Math.cos(ang) * d, p[1] + Math.sin(ang) * d * 0.75, 1 + rs(f, i + 3) * 2.2, 0, 6.2832); ctx.fill(); }
  }
  /** 물기둥: 솟았다가 떨어지는 물방울 (배 위에 그린다) */
  function splashColumn(ctx, p, f) {
    var T = 0.9; if (f.t > T) return;
    var u = f.t / T, H = 34 * Math.sin(Math.PI * Math.min(1, u * 1.1));
    for (var i = 0; i < 11; i++) {
      var r0 = rs(f, i), r1 = rs(f, i + 11), sx = (r0 - 0.5) * (4 + u * 22), top = H * (0.45 + 0.55 * r1);
      var y = p[1] - top * Math.max(0, 1 - Math.pow(u * 1.25 - r1 * 0.2, 2) * 0.8);
      ctx.fillStyle = 'rgba(244,250,252,' + (0.85 * (1 - u)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(p[0] + sx, y, 1.2 + r1 * 2.2 * (1 - u * 0.5), 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = 'rgba(244,250,252,' + (0.5 * (1 - u)).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(p[0], p[1] - H * 0.4, 3 + u * 3, H * 0.5 + 1, 0, 0, 6.2832); ctx.fill();
  }
  /** 가라앉는 배: 거품이 넓게 번지고 소용돌이가 돌며 잔해 조각이 떠돈다 */
  function sinkFoam(ctx, p, f, u) {
    var a = 1 - u, R0 = (f.len || 100) * 0.5;
    ctx.strokeStyle = 'rgba(166,197,207,' + (G.FX.waterSplash.rippleOpacity * a).toFixed(3) + ')'; ctx.lineWidth = G.FX.waterSplash.rippleLine;
    for (var k = 0; k < 3; k++) { var r = R0 * (0.25 + k * 0.22) * (1 + u * 0.6), a0 = f.t * (1.2 - k * 0.3) + k * 2; ctx.beginPath(); ctx.arc(p[0], p[1], r, a0, a0 + 2.2); ctx.stroke(); }
    for (var i = 0; i < 14; i++) {
      var ang = rs(f, i) * 6.2832 + f.t * 0.15, d = R0 * (0.2 + rs(f, i + 20) * (0.8 + u)), bx = p[0] + Math.cos(ang) * d, by = p[1] + Math.sin(ang) * d * 0.8;
      if (i < 6) { ctx.fillStyle = 'rgba(92,64,38,' + (0.8 * a).toFixed(3) + ')'; ctx.save(); ctx.translate(bx, by); ctx.rotate(rs(f, i + 40) * 3); ctx.fillRect(-4 - rs(f, i) * 5, -1.2, 8 + rs(f, i) * 10, 2.4); ctx.restore(); }
      else { ctx.fillStyle = 'rgba(244,250,252,' + (0.5 * a * (0.5 + 0.5 * Math.sin(f.t * 4 + i))).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(bx, by, 1.2 + rs(f, i) * 2, 0, 6.2832); ctx.fill(); }
    }
    if (G.WaterSplash) G.WaterSplash.ripple(ctx, p[0], p[1], R0, u, f.seed);
  }

  // ---------------------------------------------------------------- rendering
  var IMPACT_KINDS = { muzzle: 1, blast: 1, clash: 1, float: 1, fireball: 1, debris: 1, spark: 1, dsmoke: 1, dmg: 1 };   // 배 위에 그리는 것 (ring은 배 아래)
  /** 불타는 배: 갑판 몇 곳에서 불길이 일렁인다 */
  function burnGlow(ctx, b, p) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var hr = b.hp / b.maxHp, n = hr < IMP().fireAt * 0.5 ? 3 : 2;
    for (var i = 0; i < n; i++) {
      var off = (i - (n - 1) / 2) * b.len * 0.28 + Math.sin(i * 7.1) * 6, fl = 0.65 + 0.35 * Math.sin(st.t * (11 + i * 3) + i * 2) * Math.sin(st.t * 7.3 + i);
      var fx = p[0] + Math.cos(b.heading) * off, fy = p[1] + Math.sin(b.heading) * off, R0 = (7 + (1 - hr) * 8) * fl;
      var g = ctx.createRadialGradient(fx, fy - 3, 0, fx, fy - 3, R0 * 1.8);
      g.addColorStop(0, 'rgba(255,240,170,' + (0.85 * fl).toFixed(3) + ')'); g.addColorStop(0.35, 'rgba(255,150,40,' + (0.6 * fl).toFixed(3) + ')'); g.addColorStop(1, 'rgba(200,40,10,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy - 3, R0 * 1.8, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  /** 번쩍이는 효과: 포구 화염 · 맞은 자리의 섬광·불덩이·나뭇조각·불티·검은 연기·충격파 · 칼 부딪치는 불꽃 · 피해 숫자 */
  function impactFx(ctx, f, a) {
    var q = toScreen(f.x, f.y), u = f.t / f.life;
    if (f.kind === 'dsmoke') {        // 검은 연기 (위로 퍼지며 바람에 밀린다)
      var ps = toScreen(f.x + f.vx * f.t, f.y + f.vy * f.t), rr = f.r + f.t * 18, al = (f.thin ? 0.42 : 0.66) * Math.min(1, f.t * 6) * (1 - u);
      ctx.save(); ctx.globalCompositeOperation = 'source-over';
      // 짙은 바다 위에서도 보이게 잿빛 테두리에 검은 속 (위에서 내려다본 연기 기둥)
      var gs = ctx.createRadialGradient(ps[0], ps[1] - f.t * 6, rr * 0.15, ps[0], ps[1] - f.t * 6, rr);
      gs.addColorStop(0, 'rgba(40,36,34,' + al.toFixed(3) + ')'); gs.addColorStop(0.6, 'rgba(96,90,84,' + (al * 0.85).toFixed(3) + ')'); gs.addColorStop(1, 'rgba(120,114,108,0)');
      ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(ps[0], ps[1] - f.t * 6, rr, 0, 7); ctx.fill();
      ctx.restore();
      return;
    }
    if (f.kind === 'ring') {          // 포격 반동의 잔물결은 닫힌 원 없이 옅게 끊어 그린다
      if (G.WaterSplash) G.WaterSplash.ripple(ctx, q[0], q[1], f.r, u, f.x + f.y);
      return;
    }
    if (f.kind === 'debris') {        // 나뭇조각: 튀어 올랐다가 물에 떨어진다
      var dr = 2.4, k1 = (1 - Math.exp(-f.t * dr)) / dr, hh = Math.max(0, f.h * f.t - 180 * f.t * f.t);
      var pd = toScreen(f.x + f.vx * k1, f.y + f.vy * k1);
      ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.translate(pd[0], pd[1] - hh); ctx.rotate(f.rot + f.vr * f.t);
      ctx.fillStyle = f.dark ? 'rgba(60,40,24,' + Math.min(1, a * 1.6).toFixed(3) + ')' : 'rgba(150,108,64,' + Math.min(1, a * 1.6).toFixed(3) + ')';
      ctx.fillRect(-f.w / 2, -1.3, f.w, 2.6); ctx.restore();
      return;
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (f.kind === 'spark') {         // 불티: 짧은 빛줄기
      var k2 = (1 - Math.exp(-f.t * 5)) / 5, sp = toScreen(f.x + f.vx * k2, f.y + f.vy * k2), sl = Math.exp(-f.t * 5) * 0.035;
      ctx.strokeStyle = 'rgba(255,' + Math.round(200 + 55 * a) + ',' + Math.round(90 + 120 * a) + ',' + a.toFixed(3) + ')'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(sp[0], sp[1]); ctx.lineTo(sp[0] - f.vx * sl, sp[1] - f.vy * sl); ctx.stroke();
    } else if (f.kind === 'fireball') {   // 불덩이: 하얗게 터졌다가 붉게 식는다
      var R1 = f.r * (0.55 + u * 0.9), aa = Math.pow(1 - u, 1.4);
      var gf = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], R1);
      gf.addColorStop(0, 'rgba(255,255,230,' + aa.toFixed(3) + ')'); gf.addColorStop(0.3, 'rgba(255,196,90,' + (aa * 0.95).toFixed(3) + ')'); gf.addColorStop(0.7, 'rgba(230,80,20,' + (aa * 0.6).toFixed(3) + ')'); gf.addColorStop(1, 'rgba(120,20,0,0)');
      ctx.fillStyle = gf; ctx.beginPath(); ctx.arc(q[0], q[1], R1, 0, 7); ctx.fill();
    } else if (f.kind === 'dmg') {        // 피해 숫자 (배를 따라 떠오르고, 새 포탄이 더해지면 다시 튄다)
      ctx.globalCompositeOperation = 'source-over';
      var sh = f.ship; if (sh && sh.alive) { f.x = sh.x + (sh.jx || 0); f.y = sh.y + (sh.jy || 0); f.len = sh.len; }
      var base = toScreen(f.x + f.dx, f.y), ux2 = Math.min(1, f.t / f.life), fade = ux2 < 0.7 ? 1 : 1 - (ux2 - 0.7) / 0.3;
      var pop = 1 + 0.55 * Math.max(0, 1 - (f.t - (f.popT || 0)) / 0.16);
      var mineS = sh && sh.side === 'me', col = mineS ? '255,110,90' : f.big ? '255,246,200' : '255,214,110';
      var dk = labelK(), size = Math.round((24 + Math.min(20, f.val * 0.9)) * pop * dk), yy = base[1] - (sh ? halfH(sh) : (f.len || 90) * 0.5) - (64 + ux2 * 30) * dk;   // 배 이름표(위 24px) 위로 — 화면 배율과 상관없이 같은 크기
      ctx.font = '800 ' + size + 'px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      var txt = '−' + Math.max(1, Math.round(f.val));
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(24,12,4,' + (0.85 * fade).toFixed(3) + ')'; ctx.strokeText(txt, base[0], yy);
      ctx.fillStyle = 'rgba(' + col + ',' + fade.toFixed(3) + ')'; ctx.fillText(txt, base[0], yy);
      if (f.big) { ctx.font = '700 15px ' + getComputedStyle(document.body).fontFamily; ctx.lineWidth = 3; ctx.strokeText('강타', base[0], yy - size * 0.8); ctx.fillText('강타', base[0], yy - size * 0.8); }
      if (f.crew > 0) {
        ctx.font = '700 15px ' + getComputedStyle(document.body).fontFamily; var ct = '선원 −' + f.crew;
        ctx.lineWidth = 3; ctx.strokeText(ct, base[0], yy + 17); ctx.fillStyle = 'rgba(240,228,205,' + fade.toFixed(3) + ')'; ctx.fillText(ct, base[0], yy + 17);
      }
    } else if (f.kind === 'muzzle') {
      var L = 36 * f.s * (0.6 + u * 0.8), c = Math.cos(f.ang), sn = Math.sin(f.ang);
      var g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], L * 1.5);
      g.addColorStop(0, 'rgba(255,252,230,' + a + ')'); g.addColorStop(0.25, 'rgba(255,214,110,' + a + ')'); g.addColorStop(0.6, 'rgba(255,130,40,' + a * 0.7 + ')'); g.addColorStop(1, 'rgba(200,60,10,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(q[0] - sn * 6, q[1] + c * 6); ctx.lineTo(q[0] + c * L * 1.5, q[1] + sn * L * 1.5); ctx.lineTo(q[0] + sn * 6, q[1] - c * 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(q[0], q[1], L * 0.45, 0, 7); ctx.fill();
    } else if (f.kind === 'blast') {
      var R0 = f.r * (0.4 + u * 0.9), g2 = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], R0);
      g2.addColorStop(0, 'rgba(255,255,235,' + a + ')'); g2.addColorStop(0.35, 'rgba(255,200,110,' + a * 0.85 + ')'); g2.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(q[0], q[1], R0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,200,' + a * 0.7 + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], f.r * (0.5 + u * 1.4), 0, 7); ctx.stroke();   // 퍼지는 충격파 고리
    } else if (f.kind === 'clash') {
      var rnd = U.makeRng(Math.floor(f.seed * 1e6)), n = 9;
      ctx.strokeStyle = 'rgba(255,245,210,' + a + ')'; ctx.lineWidth = 2;
      for (var i = 0; i < n; i++) { var an = rnd() * 6.283, r1 = (4 + u * 26) * f.s, r2 = r1 + (6 + rnd() * 10) * (1 - u) * f.s; ctx.beginPath(); ctx.moveTo(q[0] + Math.cos(an) * r1, q[1] + Math.sin(an) * r1); ctx.lineTo(q[0] + Math.cos(an) * r2, q[1] + Math.sin(an) * r2); ctx.stroke(); }
      var g3 = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 16 * f.s); g3.addColorStop(0, 'rgba(255,255,240,' + a * 0.9 + ')'); g3.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g3; ctx.beginPath(); ctx.arc(q[0], q[1], 16 * f.s, 0, 7); ctx.fill();
    } else if (f.kind === 'float') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = '700 ' + (f.size || 26) + 'px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center';
      var yy = q[1] - u * 30; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,12,6,' + a * 0.8 + ')'; ctx.strokeText(f.text, q[0], yy);
      ctx.fillStyle = 'rgba(' + f.col + ',' + a + ')'; ctx.fillText(f.text, q[0], yy);
    }
    ctx.restore();
  }
  /** 화면 흔들림은 카메라를 잠깐 옮겨 그리는 것으로 (바다·배·효과가 함께 흔들린다), 번쩍임은 맨 위에 한 겹 */
  function render() {
    if (B.headless) return;   // 시험: 그리지 않고 셈만 (tests/fleet_orders_smoke.js)
    var sx = 0, sy = 0, sh = st.shaker;
    if (sh && (st.shake || !sh.idle())) { var o = sh.sample(performance.now() / 1000, st.shake || 0); sx = o[0]; sy = o[1]; }
    st.qo = sx || sy ? [sx, sy] : null;                 // 클릭 변환(toWorld)이 이번 장면과 같은 어긋남을 쓴다
    st.zkShown = (st.vz || 1) * (1 + (st.zoomK || 0));
    var cx0 = st.cx, cy0 = st.cy;
    st.cx -= sx / SCALE / (st.vz || 1); st.cy -= sy / SCALE / (st.vz || 1);          // 이번 장면만 — 끝나면 원래 카메라로 (누적하지 않는다)
    try { renderScene(); } finally { st.cx = cx0; st.cy = cy0; }
    if (st.flash) {
      var cv = G.Game.canvases().overlay, ctx = cv.getContext('2d');
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(' + st.flash.c + ',' + Math.min(0.6, st.flash.a).toFixed(3) + ')'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.restore();
    }
  }
  /** 격랑 그림의 실제 바다 부분 (양옆 검은 띠는 뺀다 — 그대로 얹으면 화면 가장자리에 세로 줄이 생긴다) */
  function artRect(im) {
    var w = im.naturalWidth, h = im.naturalHeight, r = [0, 0, w, h];
    try {
      var cw = 200, chh = Math.max(1, Math.round(cw * h / w)), c = document.createElement('canvas'); c.width = cw; c.height = chh;
      var x = c.getContext('2d'); x.drawImage(im, 0, 0, cw, chh);
      var d = x.getImageData(0, 0, cw, chh).data, col = function (i) { var t = 0; for (var y = 0; y < chh; y++) { var o = (y * cw + i) * 4; t += d[o] + d[o + 1] + d[o + 2]; } return t / chh / 3; };
      var l = 0, rr = cw - 1; while (l < cw / 3 && col(l) < 10) l++; while (rr > cw * 2 / 3 && col(rr) < 10) rr--;
      var sx = Math.ceil((l + 1) * w / cw), ex = Math.floor(rr * w / cw);
      if (l > 0 || rr < cw - 1) r = [sx, 0, Math.max(1, ex - sx), h];
    } catch (e) { /* 그림을 못 읽으면 통째로 */ }
    return r;
  }
  /** 먼바다에서는 생성한 격랑 질감을 아주 옅게 얹는다. 연안에서는 실제 지형을 가리지 않도록 셰이더 물결만 쓴다. */
  function roughSeaArt(ctx) {
    var im = st.seaArt;
    if (!im || !im.complete || !im.naturalWidth || (st.terrain && st.terrain.hasLand)) return;
    var driftX = Math.sin(st.t * 0.035) * 28 - (st.cx % 55) * 0.16;
    var driftY = Math.cos(st.t * 0.028) * 18 - (st.cy % 45) * 0.12;
    ctx.save();
    var k0 = G.Game.overlayScale || 1; ctx.setTransform(k0, 0, 0, k0, 0, 0);   // 배율과 상관없이 화면 전체를 덮는다
    ctx.globalAlpha = 0.13;
    var sr = st.seaArtRect || [0, 0, im.naturalWidth, im.naturalHeight];
    ctx.drawImage(im, sr[0], sr[1], sr[2], sr[3], -64 + driftX, -44 + driftY, 1728, 972);
    ctx.restore();
  }
  function renderScene() {
    var s = S(), r = G.Game.renderer;
    var zk = (st.vz || 1) * (1 + (st.zoomK || 0));   // 화면 배율(st.vz) × 큰 명중·침몰 때 살짝 다가옴 (바다와 배를 같은 배율로)
    var bw = G.Rain ? G.Rain.weather({ cloud: 0.12, storm: 0.32 }) : { cloud: 0.12, storm: 0.32 };
    if (r) r.draw({ lon: st.center.lon + st.cx / GEO_SCALE, lat: st.center.lat - st.cy / GEO_SCALE, zoom: GEO_SCALE * zk, battleZoom: GEO_SCALE, time: st.t, wind: [Math.cos(st.wind.dir) * st.wind.spd, Math.sin(st.wind.dir) * st.wind.spd], cloud: bw.cloud, edge: 0.0, mode: 1, dusk: 0, storm: bw.storm, quality: 1, cssWidth: 1600, origin: [st.center.lon, st.center.lat] });
    var cv = G.Game.canvases().overlay, ctx = cv.getContext('2d'), k = G.Game.overlayScale || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(k * zk, 0, 0, k * zk, k * 800 * (1 - zk), k * 450 * (1 - zk));
    roughSeaArt(ctx);
    // arena boundary hint
    var c0 = toScreen(0, 0);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.setLineDash([10, 14]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c0[0], c0[1], ARENA * SCALE, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    // 항적·물보라 (배가 지나간 바다에 남는다)
    var toW = function (x, y) { return toScreen(x, -y); };
    st.ships.forEach(function (b) { if (b.fx && !b.fled) G.SeaFX.draw(b.fx, ctx, toW, 1, b.len); });
    // 물 위의 흔적: 포탄이 떨어진 자리의 거품, 가라앉는 배의 거품과 소용돌이
    st.fx.forEach(function (f) {
      var p = toScreen(f.x, f.y), u = f.t / f.life;
      if (f.kind === 'splash') splashUnder(ctx, p, f, u);
      if (f.kind === 'bigsplash') sinkFoam(ctx, p, f, u);
      if (f.kind === 'ring') impactFx(ctx, f, 1 - u);          // 물 위의 충격파 고리는 배 아래에
      if (f.kind === 'waterSprite' && G.FX.waterSplash.types[f.style].under) G.WaterSplash.draw(ctx, f, p[0], p[1]);
    });
    // ships
    st.ships.forEach(function (b) {
      if (b.fled) return;
      var p = toScreen(b.x + (b.jx || 0), b.y + (b.jy || 0));
      if (b.trem && !b.trem.idle()) { var tq = b.trem.sample(performance.now() / 1000, 0); p = [p[0] + tq[0], p[1] + tq[1]]; }   // 맞은 배의 떨림 (그림만)
      ctx.save();
      if (!b.alive) { ctx.globalAlpha = b.sunk ? 1 - b.sink : 0.75; }
      if (b.monster && G.SeaMonsters) {
        G.SeaMonsters.draw(ctx, b, p[0], p[1], st.t);
      } else {
      var spec = A.shipLook(b.type, { sails: b.sails, flag: b.side === 'me' ? '#1d3f7a' : st.npc.kind === 'pirate' ? '#111' : '#8a1e1e' });
      if (b.side === 'en') { spec.cross = false; if (st.npc.kind === 'pirate') { spec.hull = '#2a2420'; if (spec.hullType === 'west' || spec.hullType === 'galley' || spec.hullType === 'dhow') spec.sail = '#4a4440'; } }
      // 선체의 흔들림(선회 때 바깥으로 기울고, 물결에 오르내림)과 선체에 붙은 물(선수 파도·선측 물줄기)
      var sr = Math.min(1.4, Math.max(0, b.spd || 0) / (BFX.ref / BFX.day)), slp = Math.min(1.2, Math.abs(b.lat || 0) / (BFX.ref / BFX.day) * 2.2), ph0 = (b.x + b.y) * 0.01;
      var RDb = G.FX.ride;
      if (b.ride && RDb) { spec.pose = { roll: U.clamp(b.ride.roll, -RDb.maxRoll, RDb.maxRoll), pitch: U.clamp(b.ride.pitch, -RDb.maxPitch, RDb.maxPitch), heave: U.clamp(b.ride.heave, -RDb.maxHeave, RDb.maxHeave) }; spec.rig = b.rig || null; }
      else spec.pose = { roll: U.clamp(-(b.turnRate || 0) * sr * 0.08 + Math.sin(st.t * 0.9 + ph0) * 0.02, -0.12, 0.12), pitch: Math.sin(st.t * 1.3 + ph0 * 2) * 0.012 * (1 + sr), heave: Math.sin(st.t * 0.8 + ph0) * 0.012 };
      spec.noWake = true; spec.sid = b.side + (b.no || 0); spec.motionSpeed = sr; spec.motionRate = 0.82 + sr * 0.3;
      if (b.alive && b.fx) G.SeaFX.drawHull(b.fx, ctx, p[0], p[1], -b.heading, b.len, sr, slp, (b.lat || 0) <= 0 ? 1 : -1, st.t);
      A.shipTop(ctx, p[0], p[1], -b.heading + (b.sunk ? b.sink * 0.6 : 0), b.len * (b.sunk ? 1 - b.sink * 0.3 : 1), spec, st.t);
      // 맞은 배: 잠깐 하얗게 번쩍인다 (같은 그림을 밝게 한 번 더 겹친다)
      if (b.hitT > 0 && !b.sunk) { var hk = Math.min(1, b.hitT / Math.max(0.01, IMP().shipFlash)); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.75 * hk; A.shipTop(ctx, p[0], p[1], -b.heading, b.len, spec, st.t); }
      }
      ctx.restore();
      // 불길: 크게 부서진 배의 갑판 두세 곳이 일렁인다
      if (b.alive && !b.monster && b.hp / b.maxHp < IMP().fireAt) burnGlow(ctx, b, p);
      if (!b.alive) return;
      // bars
      // 막대·이름표는 화면 배율과 상관없이 읽히는 크기로 (선체 위 끝에 붙여 그린다)
      var w = 60, lk = labelK();
      ctx.save(); ctx.translate(p[0], p[1] - halfH(b)); ctx.scale(lk, lk);
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(-w / 2, -18, w, 9);
      ctx.fillStyle = b.side === 'me' ? '#5b9a5d' : '#c0463a'; ctx.fillRect(-w / 2 + 1, -17, (w - 2) * Math.max(0, b.hp / b.maxHp), 3.5);
      ctx.fillStyle = '#d9c9a6'; ctx.fillRect(-w / 2 + 1, -12.5, (w - 2) * Math.min(1, b.crew / Math.max(1, b.crew0)), 3);
      ctx.font = '600 13px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center';
      drawShipTag(ctx, b, 0, -24);
      ctx.restore();
      if (b.side === 'me' && b.alive && !b.flag) drawOrderTag(ctx, b, p);
      if (b.side === 'me' && b.alive && b.flag && b.tactic) { var o1 = b.order; b.order = b.tactic; var nm1 = ORDER_NAME[b.tactic]; ORDER_NAME[b.tactic] = SOLO[b.tactic]; drawOrderTag(ctx, b, p); ORDER_NAME[b.tactic] = nm1; b.order = o1; }   // 기함 전술 이름
      if (b.side === 'me' && b.flag && b.steer != null && b.alive) {
        var sx = p[0] + Math.cos(b.steer) * (b.len * 0.9 + 70), sy = p[1] + Math.sin(b.steer) * (b.len * 0.9 + 70);
        ctx.strokeStyle = 'rgba(255,240,200,.75)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(p[0] + Math.cos(b.steer) * b.len * 0.6, p[1] + Math.sin(b.steer) * b.len * 0.6); ctx.lineTo(sx, sy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,240,200,.85)'; ctx.beginPath(); ctx.moveTo(sx + Math.cos(b.steer) * 12, sy + Math.sin(b.steer) * 12); ctx.lineTo(sx + Math.cos(b.steer + 2.5) * 10, sy + Math.sin(b.steer + 2.5) * 10); ctx.lineTo(sx + Math.cos(b.steer - 2.5) * 10, sy + Math.sin(b.steer - 2.5) * 10); ctx.closePath(); ctx.fill();
      }
      if (b.side === 'me' && b.flag && b.moveTo) { var mp = toScreen(b.moveTo[0], b.moveTo[1]); ctx.strokeStyle = 'rgba(255,240,200,.7)'; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(mp[0], mp[1]); ctx.stroke(); ctx.setLineDash([]); }
      if (b.side === 'me' && b.flag && targetable(b.target)) { var tp = toScreen(b.target.x, b.target.y); ctx.strokeStyle = 'rgba(255,90,60,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tp[0], tp[1], b.target.len * 0.6, 0, 7); ctx.stroke(); }
    });
    // cannon balls
    // 포탄: 물 위의 그림자, 뒤로 끌리는 연기 꼬리, 막 떠난 포탄의 달군 빛
    var arcH = IMP().ballArc || 14;
    st.balls.forEach(function (k2) {
      var u = Math.min(1, k2.t / k2.dur);
      var at = function (uu) { var q = toScreen(k2.x + (k2.tx - k2.x) * uu, k2.y + (k2.ty - k2.y) * uu); return [q[0], q[1] - Math.sin(uu * Math.PI) * arcH, q[0], q[1]]; };
      var c = at(u);
      ctx.fillStyle = 'rgba(0,18,28,0.28)'; ctx.beginPath(); ctx.ellipse(c[2], c[3], 3.4, 2, 0, 0, 7); ctx.fill();
      for (var i = 5; i >= 1; i--) { var q2 = at(Math.max(0, u - i * 0.04)); ctx.fillStyle = 'rgba(214,210,200,' + (0.3 * (1 - i / 6)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(q2[0], q2[1], 1.8 + i * 0.7, 0, 7); ctx.fill(); }
      if (u < 0.4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; var gb = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 9); gb.addColorStop(0, 'rgba(255,200,120,' + (0.8 * (1 - u / 0.4)).toFixed(3) + ')'); gb.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = gb; ctx.beginPath(); ctx.arc(c[0], c[1], 9, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = k2.element === 'water' ? '#88e4ff' : k2.element === 'ghost' ? '#8cf9bb' : '#151210'; ctx.beginPath(); ctx.arc(c[0], c[1], k2.radial ? 5 : 3.3, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(c[0] - 1, c[1] - 1, 1.1, 0, 7); ctx.fill();
    });
    // smoke & hits over ships
    st.fx.forEach(function (f) {
      var a = 1 - f.t / f.life;
      if (f.kind === 'smoke') { var p = toScreen(f.x + f.vx * f.t, f.y + f.vy * f.t); ctx.fillStyle = 'rgba(230,230,225,' + a * 0.55 + ')'; ctx.beginPath(); ctx.arc(p[0], p[1], f.r + f.t * 14, 0, 7); ctx.fill(); }
      if (f.kind === 'hit') { var q = toScreen(f.x, f.y); ctx.fillStyle = 'rgba(255,170,60,' + a + ')'; ctx.beginPath(); ctx.arc(q[0], q[1], 6 + f.t * 20, 0, 7); ctx.fill(); }
      if (IMPACT_KINDS[f.kind]) impactFx(ctx, f, a);
      if (f.kind === 'splash') splashColumn(ctx, toScreen(f.x, f.y), f);
      if (f.kind === 'waterSprite' && !G.FX.waterSplash.types[f.style].under) { var wp = toScreen(f.x, f.y); G.WaterSplash.draw(ctx, f, wp[0], wp[1]); }
    });
    // 항해 중 내리던 비는 전투에 들어와도 끊기지 않는다. 화면 공간으로 그려 카메라 확대·타격 흔들림에 빗줄기가 늘어나지 않게 한다.
    if (G.Rain && G.Rain.raining()) G.Rain.draw(ctx, st.t, st.wind.dir, false, function (x, y) { var w = toWorld(x, y); return !terrainBlocked(w[0], w[1], null); });
    // HUD texts
    var me = st.ships.filter(function (b) { return b.side === 'me' && b.alive; }), en = st.ships.filter(function (b) { return b.side === 'en' && b.alive; });
    UI.hud.set('me', '아군 ' + me.length + '척 · 선원 ' + U.sum(me, function (b) { return b.crew; }));
    UI.hud.set('en', st.npc.monster && en[0] ? en[0].name + ' · ' + G.SeaMonsters.phaseLabel(en[0]) : '적 ' + en.length + '척 · 선원 ' + U.sum(en, function (b) { return b.crew; }));
    UI.hud.set('wind', U.dirName(st.wind.dir + Math.PI) + '풍' + (st.npc && st.npc.place ? ' · ' + st.npc.place : st.terrain && st.terrain.hasLand ? ' · 연안 전장' : ' · 격랑 해역'));   // npc.place: 큰 해전의 자리 이름 (텍스코코 호수)
    if (st.pf % 6 === 0) refreshOrders();
    if ((st.pf = (st.pf || 0) + 1) % 15 === 0 && el.panel) {
      el.panel.innerHTML = '<div class="fp-h">' + G.icon('ship') + '아군 함대</div>' + st.ships.filter(function (b) { return b.side === 'me'; }).map(function (b) {
        return '<div class="fp-ship"><div class="flex"><span class="shipno' + (b.flag ? ' flag' : '') + '">' + b.no + '</span><b>' + U.esc(b.name) + '</b>' + (b.flag ? '<span class="flagtag">기함</span>' : '') + '<small class="cream-muted" style="margin-left:6px">' + U.esc(R.captainName(b.src)) + '</small><span class="right cream-muted">' + (b.alive ? '선원 ' + b.crew : b.sunk ? '침몰' : b.fled ? '이탈' : '상실') + '</span></div>' + UI.bar(b.hp, b.maxHp, 'green dark') + '</div>';
      }).join('') + '<div class="fp-h" style="margin-top:8px">' + G.icon('flag') + (st.npc.monster ? '해상 괴물 <small class="cream-muted">— 잠수 중 공격 불가</small>' : '적 함대 <small class="cream-muted">— 1번 기함을 무찌르면 승리</small>') + '</div>' + st.ships.filter(function (b) { return b.side === 'en'; }).map(function (b) {
        if (b.monster) return '<div class="fp-ship en"><div class="flex"><b>' + U.esc(b.name) + '</b><span class="right cream-muted">괴물</span></div><div class="cream-muted" style="font-size:14px">' + (b.alive ? G.SeaMonsters.phaseLabel(b) : '처치') + '</div>' + UI.bar(b.hp, b.maxHp, 'red dark') + '<small>내구 ' + Math.ceil(Math.max(0, b.hp)) + ' / ' + b.maxHp + '</small></div>';
        return '<div class="fp-ship en"><div class="flex"><span class="shipno en' + (b.flag ? ' flag' : '') + '">' + b.no + '</span><b>' + U.esc(b.name) + '</b>' + (b.flag ? '<span class="flagtag en">' + (b.monster ? '괴물' : '기함') + '</span>' : '') + '<span class="right cream-muted">' + (b.monster ? (b.alive ? G.SeaMonsters.phaseLabel(b) : '처치') : b.alive ? '선원 ' + b.crew : b.sunk ? '침몰' : b.captured ? '나포' : b.fled ? '달아남' : '상실') + '</span></div>' + UI.bar(b.hp, b.maxHp, 'red dark') + '</div>';
      }).join('') + '<div class="cream-muted" style="font-size:14px;margin-top:6px">방향키: 기함 몰기 · Space: 기함 정지 · 클릭: 이동 · 적함 클릭: 공격 · ' + (st.npc.monster ? '괴물에게 백병전·일기토 불가 · ' : 'B: 백병전 · ') + 'P: 일시정지 · +/−: 배속 · 1~7: 함대 명령 · Tab: 배 고르기' + (st.terrain && st.terrain.hasLand ? '<br><b>섬·해안은 통과할 수 없으며, 막힌 쪽으로는 퇴각할 수 없습니다.</b>' : '') + '</div>';
    }
  }
})(window.G = window.G || {});
