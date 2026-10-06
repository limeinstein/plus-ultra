/* 지진·해일·포격의 흔들림 (G.Shake · G.Quake)
   · 흔들림은 「그릴 때만」 카메라를 옮긴다. 카메라(st.cam)·배·탐험대의 실제 좌표에는 아무것도 더하지 않는다.
     장면마다 그리기 직전에 G.Quake.camera()로 이번 장면의 어긋남(화면 px)을 받아 st.qo에 적어 두고,
     toScreen(그리기·고르기)과 toWorld(클릭)가 같은 값을 쓴다 → 흔들리는 화면에서도 클릭한 곳이 정확하다.
     상태창·단추·자막·미니맵·소지품·마우스 커서(모두 DOM)는 건드리지 않는다. 최상위 화면 요소도 옮기지 않는다.
   · 모양: 이어지는 노이즈(fBm, 좌우가 주, 상하는 절반 남짓) + 짧은 충격(감쇠 진동, 좌우로 치우침).
     같은 폭의 사인파나 장면마다 새로 뽑는 난수(순간이동)는 쓰지 않는다.
   · 끝나면 어긋남은 정확히 0으로 돌아간다(끝 0.4초에 걸쳐 줄이고, 끝난 효과는 지운다). 값을 어디에도 누적하지 않는다.
   · 지진(땅): 전조 1초(아주 약한 떨림 · 먼지 · 잔돌 · 나무 윗부분과 풀의 떨림) → 본진 3.5초 → 잦아듦 1.2초
   · 해일(바다): 전조 1초(물이 떨림) → 큰 물결이 화면을 가로지르며 배를 들어 올렸다 내리고 민다(그림만) → 잦아듦
   조정값: G.FX.quake (없으면 아래 기본값) */
(function (G) {
  'use strict';
  var TAU = Math.PI * 2;
  var clockFn = null;   // 시험용: G.Quake._clock(fn)로 시계를 바꿔 끼우면 장면 빠르기와 상관없이 1/120초씩 짚어 볼 수 있다
  function now() { return clockFn ? clockFn() : (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function rngOf(seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  // ---------------------------------------------------------------- 이어지는 1차원 노이즈 (기울기 노이즈 + 몇 겹)
  function hash(i, seed) { var h = (i * 374761393 + seed * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; h ^= h >>> 16; return h; }
  function grad(i, seed) { return ((hash(i, seed) & 1023) / 511.5) - 1; }
  function noise1(x, seed) {
    var i = Math.floor(x), f = x - i, g0 = grad(i, seed) * f, g1 = grad(i + 1, seed) * (f - 1);
    var u = f * f * f * (f * (f * 6 - 15) + 10);
    return (g0 + (g1 - g0) * u) * 2.2;
  }
  function fbm(x, seed) { return noise1(x, seed) * 0.6 + noise1(x * 2.17 + 13.1, seed + 7) * 0.28 + noise1(x * 4.41 + 41.7, seed + 19) * 0.12; }

  // ================================================================ G.Shake — 노이즈 + 충격을 섞은 흔들림 하나
  /* sh = G.Shake.make(seed, {freq, yk})
     sh.kick(px, o)        짧은 충격 하나 (o.f 진동수 Hz · o.tau 감쇠 초 · o.ang 방향(라디안, 없으면 좌우로 치우친 무작위))
     sh.sample(t, base)    t초에서의 [x, y] — base = 이어지는 떨림의 폭(px). 충격이 다 잦아들고 base가 0이면 정확히 [0, 0] */
  function Shaker(seed, o) {
    o = o || {};
    this.seed = seed | 0; this.rng = rngOf(seed * 2654435761 + 1);
    this.freq = o.freq || 9;        // 이어지는 떨림의 빠르기 (Hz 남짓)
    this.yk = o.yk == null ? 0.5 : o.yk;   // 상하 비율 (좌우 1에 대해)
    this.kicks = [];
  }
  Shaker.prototype.kick = function (px, o) {
    o = o || {}; var r = this.rng;
    var side = r() < 0.5 ? 0 : Math.PI;                               // 왼쪽 또는 오른쪽으로 치우쳐
    var ang = o.ang != null ? o.ang : side + (r() - 0.5) * 1.1 + (r() - 0.5) * 0.6;
    // 좌우(cx)가 주이고, 상하(cy)는 조금 다른 빠르기·위상으로 섞는다 (한 직선 위를 오가지 않게)
    var yk = o.yk != null ? o.yk : 0.75;
    this.kicks.push({ t0: o.t0 != null ? o.t0 : now(), px: px, f: o.f || (7 + r() * 6), tau: o.tau || (0.08 + r() * 0.12), cx: Math.cos(ang), cy: Math.sin(ang) * yk, vy: (r() < 0.5 ? -1 : 1) * yk * (0.45 + r() * 0.35), fy: 0.7 + r() * 0.25, phy: r() * 0.8, ph: r() * 0.6 });
    if (this.kicks.length > 24) this.kicks.shift();
  };
  Shaker.prototype.sample = function (t, base) {
    var x = 0, y = 0;
    if (base > 0) {
      var f = this.freq;
      x = fbm(t * f, this.seed) * base;
      y = fbm(t * f * 0.83 + 100, this.seed + 3) * base * this.yk;
    }
    var keep = [];
    for (var i = 0; i < this.kicks.length; i++) {
      var k = this.kicks[i], dt = t - k.t0;
      if (dt < 0) { keep.push(k); continue; }
      if (dt > k.tau * 6) continue;                                   // 다 잦아든 충격은 버린다
      keep.push(k);
      // 감쇠 진동: 0에서 시작해(순간이동 없음) 한두 번 크게 흔들고 잦아든다. 진동수도 조금씩 흔들린다
      var env = Math.exp(-dt / k.tau), w = Math.sin(TAU * k.f * dt * (1 + 0.15 * Math.sin(dt * 23 + k.ph)));
      var v = k.px * env * w * Math.min(1, dt * 60), wy = Math.sin(TAU * k.f * k.fy * dt + k.phy * dt * 10);
      x += k.cx * v; y += k.cy * v + k.vy * k.px * env * wy * Math.min(1, dt * 60);
    }
    this.kicks = keep;
    return [x, y];
  };
  Shaker.prototype.idle = function () { return !this.kicks.length; };
  G.Shake = { make: function (seed, o) { return new Shaker(seed, o); }, noise: noise1, fbm: fbm };

  // ================================================================ G.Quake — 지진·해일
  var DEF = {
    quake: { pre: 1.0, main: 3.6, tail: 1.2, preAmp: 1.1, amp: 9, yk: 0.55, freq: 8.5, kickRate: 5.5, kickMin: 0.35, kickMax: 1.0, bigKicks: 2 },
    tsunami: { pre: 1.0, main: 3.9, tail: 1.4, preAmp: 0.45, amp: 4.5, yk: 0.6, freq: 1.7, lift: 34, liftScale: 0.2, push: 30, width: 190, pitch: 0.16, roll: 0.12 },
    staggerK: 0.35,          // 탐험대가 땅보다 늦게 따라가는 비율 (그림만)
    dust: 1, trees: 1, pebbles: 1
  };
  function CF() { var f = (G.FX && G.FX.quake) || {}; return { quake: Object.assign({}, DEF.quake, f.quake || {}), tsunami: Object.assign({}, DEF.tsunami, f.tsunami || {}), staggerK: f.staggerK != null ? f.staggerK : DEF.staggerK, dust: f.dust != null ? f.dust : 1, trees: f.trees != null ? f.trees : 1, pebbles: f.pebbles != null ? f.pebbles : 1 }; }
  /** 설정 「화면 흔들림·번쩍임」을 끄면(또는 움직임 줄이기) 카메라는 흔들지 않는다 — 먼지·물결 같은 그림은 그대로 */
  function motionOn() {
    var s = G.Game && G.Game.state, v = s && s.settings ? s.settings.shake : undefined;
    if (v === false) return false;
    if (v === undefined && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  }
  var Q = {}, act = [], seq = 1;
  G.Quake = Q;

  /** 시작: kind 'quake'(땅) | 'tsunami'(바다). o = {sev 1~3, close 0~1, dir 물결이 오는 방향(화면, 라디안: 0 = 오른쪽으로 밀려감), seed} */
  Q.start = function (kind, o) {
    o = o || {};
    var C = CF()[kind]; if (!C) return null;
    var sev = clamp(o.sev || 2, 1, 3), close = o.close == null ? 0.8 : clamp(o.close, 0, 1);
    var power = (0.55 + 0.225 * (sev - 1)) * (0.6 + 0.4 * close);   // 세기 1 가까이 0.55 … 세기 3 바로 곁 1.0
    var seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
    var e = { id: seq++, kind: kind, t0: now(), C: C, power: power, sev: sev, seed: seed, rng: rngOf(seed + 99),
      sh: G.Shake.make(seed, { freq: C.freq, yk: C.yk }), nextKick: 0, big: 0, dir: o.dir == null ? Math.random() * TAU : o.dir,
      end: C.pre + C.main + C.tail, parts: [], anchors: null, lastT: 0 };
    act.push(e);
    return e;
  };
  Q.clear = function () { act = []; };
  Q._clock = function (fn) { clockFn = fn || null; };
  Q.active = function (kind) { prune(); return act.some(function (e) { return !kind || e.kind === kind; }); };
  Q.list = function () { return act.slice(); };
  function prune() { var t = now(); act = act.filter(function (e) { return e.t0 + e.end - t > 1e-6; }); }
  function phaseOf(e, t) {
    var u = t - e.t0, C = e.C;
    if (u < C.pre) return { ph: 'pre', u: u, k: u / C.pre };
    if (u < C.pre + C.main) return { ph: 'main', u: u, k: (u - C.pre) / C.main };
    return { ph: 'tail', u: u, k: clamp((u - C.pre - C.main) / C.tail, 0, 1) };
  }
  Q.phase = function (kind) { prune(); var e = act.filter(function (x) { return !kind || x.kind === kind; })[0]; return e ? Object.assign({ kind: e.kind, power: e.power }, phaseOf(e, now())) : null; };
  /** 흔들림의 크기 곡선: 전조는 아주 약하게, 본진은 빠르게 올라 불규칙하게 오르내리고, 끝에서 0으로 */
  function envelope(e, t) {
    var C = e.C, p = phaseOf(e, t), u = p.u, base;
    if (p.ph === 'pre') base = C.preAmp / (C.amp * 0.55) * (0.4 + 0.6 * p.k);   // 전조: 많아야 preAmp px 남짓
    else if (p.ph === 'main') base = smooth((u - C.pre) / 0.28) * (0.72 + 0.28 * (0.5 + 0.5 * noise1(u * 1.3, e.seed + 5)));
    else base = (1 - smooth(p.k)) * 0.75;
    return base;
  }
  function endFade(e, t) { var left = e.t0 + e.end - t; return left <= 0 ? 0 : smooth(left / 0.4); }
  /** 본진 동안 짧은 충격을 띄엄띄엄 넣는다 (같은 효과 안에서 정해진 난수열 — 장면마다 새로 뽑지 않는다) */
  function schedule(e, t) {
    var C = e.C, p = phaseOf(e, t);
    if (e.kind !== 'quake') return;
    if (!e.nextKick) e.nextKick = e.t0 + C.pre + 0.05;
    while (e.nextKick <= t && e.nextKick < e.t0 + C.pre + C.main) {
      var big = e.big < C.bigKicks && e.rng() < 0.22;
      if (big) e.big++;
      var px = C.amp * e.power * (big ? 1.35 : C.kickMin + e.rng() * (C.kickMax - C.kickMin));
      e.sh.kick(px, { t0: e.nextKick, f: big ? 5 + e.rng() * 3 : undefined, tau: big ? 0.22 : undefined });
      e.kickLog = (e.kickLog || 0) + 1; e.lastKick = { t: e.nextKick, big: big };
      var gap = -Math.log(1 - e.rng() * 0.95) / C.kickRate;
      e.nextKick += clamp(gap, 0.07, 0.55);
    }
    void p;
  }
  /** 이번 장면의 카메라 어긋남 [x, y] (화면 px, 1600×900 기준). 장면마다 한 번 불러 st.qo에 적어 둔다 */
  Q.camera = function () {
    prune();
    if (!act.length) return null;
    var t = now(), x = 0, y = 0, on = motionOn();
    act.forEach(function (e) {
      schedule(e, t);
      var C = e.C, fade = endFade(e, t), o;
      if (e.kind === 'quake') {
        o = e.sh.sample(t, C.amp * e.power * 0.55 * envelope(e, t));
      } else {
        // 해일: 느린 너울 같은 출렁임(좌우 위주) + 물마루가 배 밑을 지날 때 한 번 크게
        o = e.sh.sample(t, C.amp * e.power * envelope(e, t));
        var w = waveAt(e, t); if (w && !e.hitKick && w.passK > 0.45) { e.hitKick = 1; e.sh.kick(C.amp * e.power * 1.6, { t0: t, f: 2.6, tau: 0.32, ang: e.dir + Math.PI }); }
      }
      x += o[0] * fade; y += o[1] * fade;
    });
    if (!on) return [0, 0];
    return [x, y];
  };
  /** 탐험대가 흔들리는 땅을 늦게 따라가 휘청이는 느낌 (그림만 — 실제 자리는 그대로) */
  Q.stagger = function (qo) { if (!qo) return [0, 0]; var k = CF().staggerK; return [-qo[0] * k, -qo[1] * k]; };

  // ---------------------------------------------------------------- 땅: 먼지 · 잔돌 · 나무 윗부분 · 풀
  var DUSTC = { desert: [222, 196, 148], steppe: [206, 188, 142], grass: [196, 180, 140], forest: [168, 152, 118], jungle: [150, 140, 110], mountain: [150, 144, 134], snow: [246, 250, 252], tundra: [220, 226, 222], ice: [236, 244, 250] };
  var TREE = { forest: ['#2f4a24', '#3f5f2c', '#587a3a'], jungle: ['#22401e', '#2f5a26', '#477a34'] };
  var GRASS = { grass: '#6f8a3c', steppe: '#9a9a52', tundra: '#7f8c62', forest: '#4f6f2e', jungle: '#3f6a2a' };
  /** 탐험대 둘레(화면 안)의 땅에 나무·풀·잔돌 자리를 한 번 정해 둔다 (세상 좌표 — 카메라가 움직여도 땅에 붙어 있다) */
  function anchorsFor(e, toWorld, zoom) {
    if (e.anchors) return e.anchors;
    var r = rngOf(e.seed + 7), out = { trees: [], grass: [], pebbles: [] }, CF0 = CF();
    var geo = G.Geo;
    for (var i = 0; i < 420; i++) {
      var sx = 40 + r() * 1520, sy = 60 + r() * 780, w = toWorld(sx, sy);
      var terr = geo && geo.terrain ? geo.terrain(w[0], w[1]) : 'grass';
      if (terr === 'sea') continue;
      if (TREE[terr] && out.trees.length < 110 * CF0.trees) out.trees.push({ lon: w[0], lat: w[1], terr: terr, s: 0.7 + r() * 0.6, ph: r() * 100 });
      else if (GRASS[terr] && out.grass.length < 110 * CF0.trees && r() < 0.8) out.grass.push({ lon: w[0], lat: w[1], terr: terr, s: 0.7 + r() * 0.6, ph: r() * 100, n: 3 + Math.floor(r() * 3) });
      if (out.pebbles.length < 80 * CF0.pebbles && r() < 0.35) out.pebbles.push({ lon: w[0], lat: w[1], terr: terr, r: 1 + r() * 1.8, ph: r() * 100, hop: 0, hv: 0, ox: 0 });
    }
    e.anchors = out; e.zoom0 = zoom;
    return out;
  }
  function puff(e, lon, lat, terr, big) {
    var r = e.rng, c = DUSTC[terr] || DUSTC.grass;
    var zk = e.zk || 1;   // 확대에 맞춰 먼지 크기도 (멀리 볼 때 너무 작지 않게)
    e.parts.push({ lon: lon, lat: lat, ox: (r() - 0.5) * 14 * zk, oy: (r() - 0.5) * 6 * zk, age: 0, life: (big ? 1.5 : 1.0) + r() * 0.7, r0: (big ? 5 : 3) * zk, r1: ((big ? 20 : 10) + r() * 12) * zk, c: c, rise: (6 + r() * 12) * zk, vx: (r() - 0.5) * 18 * zk });
    if (e.parts.length > 320) e.parts.shift();
  }
  /** 이번 장면에 그려진 땅 그림을 2D 판에 한 번 옮겨 둔다 (WebGL 캔버스에서 조각마다 읽지 않게) */
  var snap = null, snapCtx = null;
  function snapshot(wc) {
    var w = wc.width, h = wc.height;
    if (!snap) { snap = document.createElement('canvas'); snapCtx = snap.getContext('2d'); }
    if (snap.width !== w || snap.height !== h) { snap.width = w; snap.height = h; }
    try { snapCtx.drawImage(wc, 0, 0, w, h); } catch (e) { return null; }
    return snap;
  }
  /** 탐험 지도 위에 땅의 떨림을 그린다 (탐험대 그림 전에). toScreen·toWorld는 장면의 것(흔들림 포함) */
  Q.drawLand = function (ctx, toScreen, toWorld, zoom) {
    prune();
    var t = now(), C0 = CF();
    act.forEach(function (e) {
      if (e.kind !== 'quake') return;
      var dt = Math.min(0.1, Math.max(0, t - (e.lastT || t))); e.lastT = t;
      var p = phaseOf(e, t), A = anchorsFor(e, toWorld, zoom), env = envelope(e, t), fade = endFade(e, t), r = e.rng;
      e.zk = clamp(zoom / 200, 0.9, 1.8);
      var tremble = (p.ph === 'pre' ? 0.35 + 0.25 * p.k : p.ph === 'main' ? 1 : 1 - smooth(p.k)) * fade;
      // 먼지: 전조에는 띄엄띄엄 작게, 본진에는 많이, 큰 충격마다 한꺼번에
      var rate = (p.ph === 'pre' ? 7 : p.ph === 'main' ? 46 * e.power : 10 * (1 - p.k)) * C0.dust;
      e.dacc = (e.dacc || 0) + rate * dt;
      var pool = A.pebbles.length ? A.pebbles : A.grass;
      while (e.dacc >= 1 && pool.length) { e.dacc -= 1; var a = pool[Math.floor(r() * pool.length)]; puff(e, a.lon + (r() - 0.5) * 18 / zoom, a.lat + (r() - 0.5) * 10 / zoom, a.terr, false); }
      if (e.lastKick && e.lastKick.t !== e.seenKick) { e.seenKick = e.lastKick.t; for (var b = 0; b < (e.lastKick.big ? 14 : 5) * C0.dust && pool.length; b++) { var a2 = pool[Math.floor(r() * pool.length)]; puff(e, a2.lon, a2.lat, a2.terr, e.lastKick.big); } }
      // 나무 윗부분·풀: 이미 그려진 땅 그림(세상 캔버스)에서 우듬지·풀숲 조각을 떠서 조금씩 흔들어 다시 얹는다.
      // 새 나무를 그려 넣지 않으므로 지진 때 나무가 갑자기 생겨 보이지 않는다. 조각의 아래(줄기·뿌리)는 덜, 위는 더 흔들린다
      var wc0 = G.Game && G.Game.canvases ? G.Game.canvases().world : null, wc = wc0 ? snapshot(wc0) : null, ks = wc ? wc.width / 1600 : 1;
      if (wc && tremble > 0.01) {
        ctx.save();
        [A.trees, A.grass].forEach(function (list, gi) {
          var R0 = (gi ? 7 : 11) * e.zk, amp = (gi ? 1.6 : 2.6) * e.zk;
          list.forEach(function (tr) {
            var q = toScreen(tr.lon, tr.lat); if (q[0] < R0 || q[0] > 1600 - R0 || q[1] < R0 + 56 || q[1] > 900 - R0) return;
            var sw = (noise1(t * (gi ? 13 : 7.5) + tr.ph, 41) * 0.75 + noise1(t * 21 + tr.ph, 43) * 0.35) * amp * tremble * tr.s;
            var sv = noise1(t * 9 + tr.ph, 47) * 0.35 * amp * tremble;
            if (Math.abs(sw) + Math.abs(sv) < 0.15) return;
            ctx.save(); ctx.beginPath(); ctx.ellipse(q[0] + sw * 0.5, q[1] - R0 * 0.25, R0, R0 * 0.8, 0, 0, TAU); ctx.clip();
            // 위쪽 절반은 sw만큼, 아래쪽은 절반만 (위가 더 흔들린다)
            var sx0 = (q[0] - R0) * ks, sy0 = (q[1] - R0 * 1.1) * ks, sw0 = R0 * 2 * ks, sh0 = R0 * 1.1 * ks;
            ctx.globalAlpha = 0.92;
            try {
              ctx.drawImage(wc, sx0, sy0, sw0, sh0, q[0] - R0 + sw, q[1] - R0 * 1.1 + sv, R0 * 2, R0 * 1.1);
              ctx.drawImage(wc, sx0, sy0 + sh0, sw0, R0 * 0.8 * ks, q[0] - R0 + sw * 0.45, q[1], R0 * 2, R0 * 0.8);
            } catch (er) { /* 캔버스를 읽을 수 없으면 건너뛴다 */ }
            ctx.restore();
          });
        });
        ctx.restore();
        // 본진: 숲에서 잎이 떨어진다
        if (p.ph === 'main') A.trees.forEach(function (tr) { if (r() < 0.015 * e.power) e.parts.push({ lon: tr.lon, lat: tr.lat, leaf: 1, ox: 0, oy: -8 * e.zk, age: 0, life: 1.2 + r() * 0.8, c: [92, 120, 52], vx: (r() - 0.5) * 30, rise: -18 - r() * 10 }); });
      }
      ctx.save();
      // 잔돌: 전조에는 제자리에서 달달 떨고, 충격이 오면 튀어 오르며 미끄러진다
      A.pebbles.forEach(function (pb) {
        var q = toScreen(pb.lon, pb.lat); if (q[0] < -10 || q[0] > 1610 || q[1] < -10 || q[1] > 910) return;
        if (e.lastKick && pb.kick !== e.lastKick.t && r() < (e.lastKick.big ? 0.8 : 0.35)) { pb.kick = e.lastKick.t; pb.hv = 30 + r() * 60 * e.power; pb.vx = (r() - 0.5) * 50; }
        pb.hv -= 380 * dt; pb.hop = Math.max(0, pb.hop + pb.hv * dt); if (pb.hop === 0) pb.hv = 0;
        pb.ox = clamp((pb.ox || 0) + (pb.vx || 0) * dt * (pb.hop > 0 ? 1 : 0.15), -24, 24); pb.vx = (pb.vx || 0) * Math.exp(-dt * 3);
        var jx = noise1(t * 19 + pb.ph, 53) * 0.9 * tremble, c = pb.terr === 'snow' || pb.terr === 'ice' ? [170, 176, 182] : [104, 96, 86];
        ctx.fillStyle = 'rgba(0,0,0,' + (0.18 * fade).toFixed(3) + ')'; var pr = pb.r * e.zk; ctx.beginPath(); ctx.ellipse(q[0] + pb.ox + jx, q[1] + 1, pr * 1.2, pr * 0.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; ctx.globalAlpha = fade;
        ctx.beginPath(); ctx.ellipse(q[0] + pb.ox + jx, q[1] - pb.hop, pr, pr * 0.8, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      });
      // 먼지·잎
      var j = 0;
      for (var i = 0; i < e.parts.length; i++) {
        var d = e.parts[i]; d.age += dt; if (d.age >= d.life) continue; e.parts[j++] = d;
        var u = d.age / d.life, sp = toScreen(d.lon, d.lat), x = sp[0] + d.ox + d.vx * u, y = sp[1] + d.oy;
        if (d.leaf) { ctx.fillStyle = 'rgba(' + d.c.join(',') + ',' + (0.85 * (1 - u)).toFixed(3) + ')'; ctx.fillRect(x + Math.sin(u * 9 + i) * 4, y - d.rise * u, 2.2, 1.4); continue; }
        var rr = d.r0 + (d.r1 - d.r0) * Math.sqrt(u), al = 0.46 * (1 - u) * Math.min(1, u * 5 + 0.2);
        ctx.fillStyle = 'rgba(' + d.c[0] + ',' + d.c[1] + ',' + d.c[2] + ',' + al.toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(x, y - d.rise * u, rr, rr * 0.6, 0, 0, TAU); ctx.fill();
      }
      e.parts.length = j;
      ctx.restore();
    });
  };

  // ---------------------------------------------------------------- 바다: 큰 물결
  /** 물마루의 자리: 화면 가운데를 지나는 직선(방향 e.dir 쪽으로 나아감). s = 가운데에서 물마루까지(px) */
  function waveAt(e, t) {
    var C = e.C, p = phaseOf(e, t);
    if (e.kind !== 'tsunami') return null;
    var dx = Math.cos(e.dir), dy = Math.sin(e.dir);
    // 본진 동안 화면 한쪽 밖(-1150)에서 반대쪽 밖(+1150)까지 — 처음엔 빠르게 들이치고 배를 지나며 조금 느려진다
    var k = p.ph === 'pre' ? 0 : p.ph === 'main' ? p.k : 1;
    var s = -1150 + 2300 * (k < 0.5 ? 0.5 * Math.pow(k * 2, 0.85) : 1 - 0.5 * Math.pow((1 - k) * 2, 1.15));
    var amp = (p.ph === 'pre' ? 0 : p.ph === 'main' ? smooth(p.k / 0.15) : 1 - smooth(p.k)) * endFade(e, t);
    return { dx: dx, dy: dy, s: s, amp: amp, W: C.width * (0.8 + 0.2 * e.power), passK: k, ph: p };
  }
  /** 물마루가 길이 방향(yy, 물마루를 따라 잰 px)으로 휘는 만큼 — 그림과 배의 들림이 같은 값을 쓴다 */
  function bendOf(e, yy, t) { return noise1(yy * 0.0024 + e.seed * 0.001, e.seed + 2) * 70 + noise1(yy * 0.009 + t * 0.35, e.seed + 4) * 18; }
  /** 물결의 높이(0~1)와 기울기: u = 물마루에서 진행 방향으로 잰 거리(px, +는 물마루 앞) */
  function profile(u, W) {
    var a = u / W, crest = Math.exp(-a * a * 1.6), trough = -0.32 * Math.exp(-Math.pow((u - W * 1.5) / W, 2) * 1.4);
    var back = 0.18 * Math.exp(-Math.pow((u + W * 1.4) / (W * 1.3), 2));
    var slope = -3.2 * a / W * crest - 0.32 * -2.8 * (u - W * 1.5) / (W * W) * Math.exp(-Math.pow((u - W * 1.5) / W, 2) * 1.4);
    return { h: crest + trough + back, slope: slope };
  }
  /** 화면 (x, y)에 있는 배의 그림용 변형: {dx, dy 밀림·들림(px), heave 크기(더함), pitch, roll} — 실제 좌표·뱃머리는 그대로 */
  Q.shipFx = function (x, y, heading) {
    prune();
    var t = now(), out = { dx: 0, dy: 0, heave: 0, pitch: 0, roll: 0 };
    act.forEach(function (e) {
      if (e.kind !== 'tsunami') return;
      var w = waveAt(e, t), C = e.C; if (!w || !w.amp) { e.pushV = 0; return; }
      var lx = (x - 800) * w.dx + (y - 450) * w.dy - w.s, ly = -(x - 800 - w.dx * w.s) * w.dy + (y - 450 - w.dy * w.s) * w.dx;
      var u = lx - bendOf(e, ly, t), pf = profile(u, w.W), A = w.amp * e.power;
      var lift = Math.max(0, pf.h) * A;
      // 밀림: 물마루가 지나간 만큼 물결 쪽으로 밀렸다가(그림만) 잦아들며 제자리로
      var behind = smooth(clamp((-u + w.W * 0.4) / (w.W * 1.6), 0, 1)), ret = w.ph.ph === 'tail' ? 1 - smooth(w.ph.k) : 1;
      var push = C.push * A * behind * ret;
      out.dx += w.dx * push; out.dy += w.dy * push - C.lift * lift;
      out.heave += C.liftScale * lift;
      // 뱃머리가 물결을 마주 보면 들렸다 숙고, 옆으로 받으면 기운다
      var along = heading == null ? 1 : Math.cos(heading) * w.dx - Math.sin(heading) * w.dy, side = heading == null ? 0 : Math.sin(heading) * w.dx + Math.cos(heading) * w.dy;
      var sl = clamp(pf.slope * w.W, -2, 2) * A;
      out.pitch += C.pitch * sl * along; out.roll += C.roll * sl * side;
    });
    return out;
  };
  /* 바다 위에 물결을 그린다 (배 그림 전에). 전조에는 물이 잘게 떨린다.
     물결은 따로 된 판(반 해상도)에 그리고, 뭍인 곳을 지운 뒤 얹는다 — 물결이 섬·땅 위로 넘어가 보이지 않게.
     o = { land(x, y): 흔들림 없는 화면 자리가 뭍인가, key: 카메라 열쇠(바뀌면 뭍 판을 새로), qo: 이번 장면의 흔들림 } */
  var layer = null, lctx = null, mask = null, mctx = null, maskKey = '';
  var MW = 200, MH = 113;
  function landMask(o) {
    if (!o || !o.land) return null;
    if (!mask) { mask = document.createElement('canvas'); mask.width = MW; mask.height = MH; mctx = mask.getContext('2d'); }
    if (maskKey !== o.key) {
      maskKey = o.key;
      var img = mctx.createImageData(MW, MH), d = img.data;
      for (var j = 0; j < MH; j++) for (var i = 0; i < MW; i++) {
        var sea = !o.land((i + 0.5) * 1600 / MW, (j + 0.5) * 900 / MH), q = (j * MW + i) * 4;
        d[q] = d[q + 1] = d[q + 2] = 255; d[q + 3] = sea ? 255 : 0;
      }
      mctx.putImageData(img, 0, 0);
    }
    return mask;
  }
  Q.drawSea = function (ctx, ships, o) {
    prune();
    var t = now(), list = act.filter(function (e) { return e.kind === 'tsunami'; });
    if (!list.length) return;
    if (!layer) { layer = document.createElement('canvas'); layer.width = 800; layer.height = 450; lctx = layer.getContext('2d'); }
    var L = lctx; L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, 800, 450); L.setTransform(0.5, 0, 0, 0.5, 0, 0);
    list.forEach(function (e) {
      var w = waveAt(e, t), p = phaseOf(e, t), fade = endFade(e, t), r = rngOf(e.seed + 3);
      L.save();
      // 전조·본진 초반: 배 둘레와 바다 곳곳에 잔물결 고리가 떤다
      var trem = (p.ph === 'pre' ? 0.4 + 0.6 * p.k : p.ph === 'main' ? 1 - p.k * 0.6 : 0.4 * (1 - p.k)) * fade;
      if (trem > 0.02) {
        L.lineWidth = 1.6;
        for (var i = 0; i < 56; i++) {
          var x = r() * 1600, y = r() * 900, ph = r() * 10, rr = 6 + ((t * 1.8 + ph) % 1) * 24;
          L.strokeStyle = 'rgba(225,240,250,' + (0.3 * trem * (1 - ((t * 1.8 + ph) % 1))).toFixed(3) + ')';
          L.beginPath(); L.ellipse(x + noise1(t * 6 + ph, 61) * 1.5, y, rr, rr * 0.45, 0, 0, TAU); L.stroke();
        }
        (ships || []).forEach(function (q) { for (var k = 0; k < 3; k++) { var u2 = (t * 2.2 + k * 0.33) % 1, R = 14 + u2 * 46; L.strokeStyle = 'rgba(235,246,252,' + (0.42 * trem * (1 - u2)).toFixed(3) + ')'; L.beginPath(); L.ellipse(q[0], q[1], R, R * 0.42, 0, 0, TAU); L.stroke(); } });
      }
      if (w && w.amp > 0.01) {
        var ang = Math.atan2(w.dy, w.dx), A = Math.min(1, w.amp * e.power * 1.1), W = w.W;
        L.translate(800 + w.dx * w.s, 450 + w.dy * w.s); L.rotate(ang);
        // 물마루는 곧은 줄이 아니다: 길이 방향으로 크게 휘고(meander), 잘게 일렁인다
        var bend = function (yy) { return bendOf(e, yy, t); };
        // 단면(진행 방향 x): 뒤쪽 긴 비탈(밝은 물) → 물마루(흰 거품) → 앞 물벽(맑은 청록, 아래로 갈수록 어둡게) → 깊은 골 → 잔잔
        var g = L.createLinearGradient(-W * 2.4, 0, W * 2.2, 0);
        g.addColorStop(0, 'rgba(40,110,140,0)');
        g.addColorStop(0.30, 'rgba(70,150,170,' + (0.22 * A).toFixed(3) + ')');
        g.addColorStop(0.47, 'rgba(150,210,220,' + (0.42 * A).toFixed(3) + ')');
        g.addColorStop(0.53, 'rgba(236,248,250,' + (0.72 * A).toFixed(3) + ')');
        g.addColorStop(0.56, 'rgba(110,200,205,' + (0.55 * A).toFixed(3) + ')');
        g.addColorStop(0.64, 'rgba(30,110,130,' + (0.5 * A).toFixed(3) + ')');
        g.addColorStop(0.74, 'rgba(4,30,54,' + (0.55 * A).toFixed(3) + ')');
        g.addColorStop(0.88, 'rgba(4,30,54,' + (0.25 * A).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(4,30,54,0)');
        L.fillStyle = g;
        var SEG = 24;
        for (var yy = -1400; yy < 1400; yy += SEG) { var m = bend(yy + SEG / 2); L.save(); L.translate(m, 0); L.fillRect(-W * 2.4, yy, W * 4.6, SEG + 1); L.restore(); }
        // 물마루의 흰 거품: 두껍게 부서지는 거품 덩어리 + 몇 겹의 일렁이는 띠
        for (var Ln = 0; Ln < 4; Ln++) {
          L.strokeStyle = 'rgba(248,252,255,' + ((0.85 - Ln * 0.18) * A).toFixed(3) + ')'; L.lineWidth = (8 - Ln * 1.8); L.beginPath();
          for (var y2 = -1400; y2 <= 1400; y2 += 18) {
            var x2 = bend(y2) + W * 0.12 - Ln * 16 + noise1(y2 * 0.03 + t * 1.6 + Ln * 3, e.seed + Ln) * 9;
            if (y2 === -1400) L.moveTo(x2, y2); else L.lineTo(x2, y2);
          }
          L.stroke();
        }
        for (var fb = 0; fb < 160; fb++) {
          var fy2 = -1380 + r() * 2760, fr = (3 + r() * 9) * (0.6 + 0.4 * A), fx2 = bend(fy2) + W * 0.1 + (r() - 0.6) * 26 + noise1(fy2 * 0.05 + t * 2, 91) * 6;
          L.fillStyle = 'rgba(250,253,255,' + ((0.35 + r() * 0.4) * A).toFixed(3) + ')';
          L.beginPath(); L.ellipse(fx2, fy2, fr, fr * (0.6 + r() * 0.5), 0, 0, TAU); L.fill();
        }
        // 물마루 뒤로 끌리는 거품 줄무늬
        L.lineWidth = 2;
        for (var f2 = 0; f2 < 90; f2++) {
          var fy = -1350 + r() * 2700, fl = 30 + r() * 110, fx = bend(fy) - W * 0.2 - r() * W * 1.3;
          L.strokeStyle = 'rgba(235,246,252,' + (0.32 * A * r()).toFixed(3) + ')';
          L.beginPath(); L.moveTo(fx, fy); L.lineTo(fx - fl, fy + noise1(fy * 0.02 + t, 83) * 10); L.stroke();
        }
        // 물보라: 물마루에서 진행 방향으로 튄다
        for (var sIdx = 0; sIdx < 150; sIdx++) {
          var sy = -1350 + r() * 2700, life = (t * (1.5 + r()) + r() * 7) % 1, sx = bend(sy) + W * 0.15 + life * (24 + r() * 70);
          L.fillStyle = 'rgba(250,253,255,' + (0.7 * A * (1 - life)).toFixed(3) + ')';
          L.beginPath(); L.arc(sx, sy - life * 10, 1.4 + r() * 3.2 * (1 - life), 0, TAU); L.fill();
        }
      }
      L.restore();
    });
    // 뭍을 지운다 (뭍 판은 흔들림 없는 화면 기준 — 이번 장면의 흔들림만큼 옮겨 맞춘다)
    var M = landMask(o);
    if (M) {
      var qo = (o && o.qo) || [0, 0];
      L.save(); L.setTransform(0.5, 0, 0, 0.5, 0, 0); L.globalCompositeOperation = 'destination-in'; L.imageSmoothingEnabled = true;
      L.drawImage(M, qo[0], qo[1], 1600, 900); L.restore();
    }
    ctx.drawImage(layer, 0, 0, 1600, 900);
  };
})(window.G = window.G || {});
