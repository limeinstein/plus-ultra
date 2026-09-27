/* 물보라와 항적 (G.SeaFX) — 기함이 물을 밀어내는 모습.
   · 항적(trail): 배가 실제로 지나간 자리(선미)를 일정한 거리마다 기록한다. 점마다 그때의 선수 방향·속력·선회·옆 미끄러짐을 담아,
                  선회해도 지나온 항적은 제자리에 남는다. 그릴 때 나이만큼 옆으로 퍼지고(선미 V자 파문 = 켈빈 파) 옅어지며 끊어진다.
                  가운데는 거품 섞인 물길, 선회 때는 바깥쪽이 두껍다.
   · 입자(parts): 선수 물보라(좌우로 갈라져 튀는 짧은 물보라), 선측 물살(선체 옆에 생겨 제자리에 남아 뒤로 흐르는 것처럼 보이는 접촉 포말),
                  선미 거품, 선회 물보라(선체가 옆으로 밀리는 쪽). 이동 거리로 만들어 장면 수·배속과 상관없이 같은 양이 생긴다.
   · 선수 파도·선측 물줄기는 선체에 붙여 그린다 (속력에 비례).
   크기는 모두 선체 길이·폭 기준(세상 좌표 °), 시간은 게임 속 날(d). 조정값은 G.FX.wake / G.FX.spray. */
(function (G) {
  'use strict';
  var FXS = {};
  G.SeaFX = FXS;
  function W() { return (G.FX && G.FX.wake) || { spacing: 0.012, life: 1.5, spread: 0.34, foamWidth: 0.55, foamGrow: 1.4, alpha: 0.85, maxPoints: 420 }; }
  function SP() { return (G.FX && G.FX.spray) || { bow: 1, side: 1, stern: 1, turn: 1, maxParticles: 700, size: 1 }; }
  function wrap(d) { d = (d + 180) % 360; if (d < 0) d += 360; return d - 180; }
  var seedN = 1;
  function rnd() { seedN = (seedN * 16807) % 2147483647; return (seedN - 1) / 2147483646; }

  /** cfg (선택): 바다 장면이 아닌 곳(해전)에서 단위를 바꿔 쓴다 — {spacing(세상 단위), life(d), maxPoints, kz(퍼짐 배율, 없으면 배 그림 크기로), ref(기준 속력)} */
  FXS.create = function (cfg) { return { trail: [], parts: [], et: 0, acc: { bow: 0, side: 0, stern: 0, turn: 0 }, rest: 0, flow: 0, cfg: cfg || null, ref: 1.1 }; };
  function WF(F) { var w = W(); if (!F.cfg) return w; var o = {}, k; for (k in w) o[k] = w[k]; for (k in F.cfg) o[k] = F.cfg[k]; return o; }

  function spawn(F, x, y, vx, vy, life, s0, s1, a0, kind) {
    var P = F.parts, max = SP().maxParticles;
    if (P.length >= max) P.shift();
    P.push({ x: x, y: y, vx: vx, vy: vy, age: 0, life: life, s0: s0, s1: s1, a0: a0, k: kind });
  }

  /** 한 걸음 움직였을 때: o = {x0,y0 → x,y, h (선수 rad), vx,vy (°/d), lat (선체 기준 옆 속도, +왼쪽), fwd, turn (rad/d), days}, g = {len, wid, ref} */
  FXS.step = function (F, o, g) {
    var Wk = WF(F), S = SP();
    F.ref = g.ref;
    var dx = wrap(o.x - o.x0), dy = o.y - o.y0, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 0) return;
    var sp = Math.sqrt(o.vx * o.vx + o.vy * o.vy), sr = Math.min(1.5, sp / g.ref);
    var hx = Math.cos(o.h), hy = Math.sin(o.h), px = -hy, py = hx;
    var L = g.len, Wd = g.wid;
    var slip = Math.min(1.2, Math.abs(o.lat) / g.ref * 2.2);          // 옆 미끄러짐 세기
    var turnK = Math.min(1.2, Math.abs(o.turn) * sr * 0.35);           // 선회 세기 (선회율 × 속력)
    // ---------- 항적 점: 선미 자리를 일정한 거리마다
    var sx0 = o.x0 - hx * L * 0.46, sy0 = o.y0 - hy * L * 0.46;
    F.rest += dist;
    var n = 0;
    while (F.rest >= Wk.spacing && n < 40) {
      F.rest -= Wk.spacing; n++;
      var f = 1 - F.rest / dist; if (f < 0) f = 0; if (f > 1) f = 1;
      var tx = sx0 + dx * f, ty = sy0 + dy * f;
      F.trail.push({ x: tx, y: ty, px: px, py: py, s: sr, lat: o.lat / g.ref, t0: F.et + (o.days || 0) * f, seed: rnd(), side: o.lat >= 0 ? 1 : -1, slip: slip, turn: turnK });
      if (F.trail.length > Wk.maxPoints) F.trail.shift();
    }
    // ---------- 입자: 이동 거리(선체 길이 단위)에 비례해 만든다
    var dl = dist / L;
    // 선수 물보라: 속력의 제곱에 비례, 좌우로 갈라져 튄다
    F.acc.bow += dl * 9 * sr * sr * S.bow;
    while (F.acc.bow >= 1) {
      F.acc.bow -= 1;
      var sd = rnd() < 0.5 ? -1 : 1, bx = o.x + hx * L * (0.46 + rnd() * 0.06) + px * sd * Wd * 0.18, by = o.y + hy * L * (0.46 + rnd() * 0.06) + py * sd * Wd * 0.18;
      var out = (0.22 + 0.25 * rnd()) * sp, fw = (0.35 + 0.2 * rnd()) * sp;
      spawn(F, bx, by, hx * fw + px * sd * out, hy * fw + py * sd * out, 0.12 + 0.12 * rnd(), Wd * 0.12 * S.size, Wd * (0.34 + 0.30 * sr) * S.size, 0.6 + 0.3 * Math.min(1, sr), 0);
    }
    // 선측 물살: 선체 옆에서 생겨 제자리에 남는다 → 배가 지나가면 뒤로 흐르는 것처럼
    F.acc.side += dl * 16 * sr * S.side;
    while (F.acc.side >= 1) {
      F.acc.side -= 1;
      var sd2 = rnd() < 0.5 ? -1 : 1, along = -0.30 + rnd() * 0.72;
      var ex = o.x + hx * L * along + px * sd2 * Wd * (0.50 + 0.06 * rnd()), ey = o.y + hy * L * along + py * sd2 * Wd * (0.50 + 0.06 * rnd());
      var ob = 0.05 * sp;
      spawn(F, ex, ey, px * sd2 * ob, py * sd2 * ob, 0.22 + 0.18 * rnd(), Wd * 0.07 * S.size, Wd * 0.16 * S.size, 0.45 + 0.25 * Math.min(1, sr), 1);
    }
    // 선미 거품
    F.acc.stern += dl * 7 * Math.min(1, sr) * S.stern;
    while (F.acc.stern >= 1) {
      F.acc.stern -= 1;
      var sx = o.x - hx * L * 0.48 + px * (rnd() - 0.5) * Wd * 0.7, sy = o.y - hy * L * 0.48 + py * (rnd() - 0.5) * Wd * 0.7;
      spawn(F, sx, sy, -hx * 0.06 * sp + px * (rnd() - 0.5) * 0.08 * sp, -hy * 0.06 * sp + py * (rnd() - 0.5) * 0.08 * sp, 0.35 + 0.3 * rnd(), Wd * 0.14 * S.size, Wd * 0.34 * S.size, 0.40 + 0.2 * Math.min(1, sr), 2);
    }
    // 선회 물보라: 선체가 옆으로 밀리는 쪽에서 물을 밀어낸다 (옆 미끄러짐 × 속력, 거의 서 있으면 없다)
    var tk = Math.max(slip * 0.8, turnK) * Math.min(1, sr * 1.5);
    F.acc.turn += dl * 22 * tk * S.turn;
    var sideT = o.lat >= 0 ? 1 : -1;
    while (F.acc.turn >= 1) {
      F.acc.turn -= 1;
      var along2 = -0.35 + rnd() * 0.75;
      var qx = o.x + hx * L * along2 + px * sideT * Wd * 0.55, qy = o.y + hy * L * along2 + py * sideT * Wd * 0.55;
      var push = (0.25 + 0.35 * rnd()) * (Math.abs(o.lat) + 0.15 * sp);
      spawn(F, qx, qy, px * sideT * push + hx * 0.12 * sp, py * sideT * push + hy * 0.12 * sp, 0.14 + 0.12 * rnd(), Wd * 0.14 * S.size, Wd * (0.35 + 0.35 * tk) * S.size, 0.5 + 0.3 * Math.min(1, tk), 3);
    }
    F.last = { x: o.x, y: o.y, h: o.h, sr: sr, slip: slip, turnK: turnK, side: sideT };
  };

  /** 선수가 파도에 박힐 때 한꺼번에 튀는 물보라 (G.Waves가 앞뒤 흔들림으로 판정).
      (x, y) 배 가운데, h 선수 방향, g = {len, wid, ref}, sp = 속력(세상 단위/d), amt = 세기(0.5~2) */
  FXS.burst = function (F, x, y, h, g, sp, amt) {
    var S = SP(), L = g.len, Wd = g.wid, hx = Math.cos(h), hy = Math.sin(h), px = -hy, py = hx;
    var n = Math.round(10 * amt * (S.bow == null ? 1 : S.bow)), v = Math.max(sp, g.ref * 0.35);
    for (var i = 0; i < n; i++) {
      var sd = i % 2 ? 1 : -1, bx = x + hx * L * (0.40 + rnd() * 0.12) + px * sd * Wd * (0.1 + 0.3 * rnd()), by = y + hy * L * (0.40 + rnd() * 0.12) + py * sd * Wd * (0.1 + 0.3 * rnd());
      var out = (0.35 + 0.45 * rnd()) * v, fw = (0.2 + 0.35 * rnd()) * v;
      spawn(F, bx, by, hx * fw + px * sd * out, hy * fw + py * sd * out, 0.18 + 0.18 * rnd(), Wd * 0.16 * S.size, Wd * (0.55 + 0.45 * rnd()) * Math.min(1.6, amt) * S.size, 0.75, 0);
    }
  };

  /** 시간이 흐른다 (게임 속 날) */
  FXS.age = function (F, days) {
    if (!(days > 0)) return;
    F.et += days;
    var P = F.parts, k = Math.exp(-days / 0.18), j = 0;
    for (var i = 0; i < P.length; i++) {
      var p = P[i]; p.age += days;
      if (p.age >= p.life) continue;
      p.x += p.vx * days; p.y += p.vy * days; p.vx *= k; p.vy *= k;
      P[j++] = p;
    }
    P.length = j;
    var life = WF(F).life, T = F.trail, c = 0;
    while (c < T.length && F.et - T[c].t0 > life) c++;
    if (c) T.splice(0, c);
    F.flow += days;
  };

  /** 그리기: ctx(화면 px, 1600x900 기준), toScreen(lon,lat)->[x,y], zoom(px/세상 단위), shipPx(배 그림 길이 px) */
  FXS.draw = function (F, ctx, toScreen, zoom, shipPx) {
    var Wk = WF(F), T = F.trail, life = Wk.life, n = T.length;
    var sPx = shipPx || 38, lk = Math.sqrt(sPx / 38);              // 배 그림이 클수록 선도 조금 굵게 (길이의 제곱근)
    var Lw = sPx / zoom, halfW = Lw * 0.17, kz = Wk.kz != null ? Wk.kz : Lw / 0.345;   // 세상 좌표의 선체 길이·반폭 (배 그림이 실제보다 크면 그만큼 파문도 넓게)
    var refV = F.ref || 1.1;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (n > 1) {
      var pts = new Array(n);
      for (var i = 0; i < n; i++) {
        var q = T[i], ag = F.et - q.t0, a = ag / life;
        var spread = halfW * (0.9 + 0.3 * q.s) + Wk.spread * q.s * refV * ag * kz;
        var off = q.side * Math.min(q.slip, 1) * halfW * 1.3 * Math.min(1, ag * 5);
        pts[i] = { c: toScreen(q.x + q.px * off, q.y + q.py * off), l: toScreen(q.x + q.px * spread, q.y + q.py * spread), r: toScreen(q.x - q.px * spread, q.y - q.py * spread), a: a, ag: ag, q: q };
      }
      // 1) 선미 V자 파문: 두 팔이 매끈한 곡선으로 퍼지며, 마디마다 끊기고 옅어진다
      var CH = 5;
      for (var side = -1; side <= 1; side += 2) {
        for (var c0 = 0; c0 < n - 1; c0 += CH) {
          var c1 = Math.min(n - 1, c0 + CH), mid = pts[Math.min(n - 1, c0 + 2)], qa = mid.q;
          if (((qa.seed * 13.7) % 1) < 0.16) continue;            // 끊긴 마디
          var fade = Math.pow(1 - Math.min(1, mid.a), 1.5) * Math.min(1, mid.a * 10 + 0.15);
          var al = Wk.alpha * 0.6 * Math.min(1, qa.s * 1.4) * fade;
          if (al < 0.02) continue;
          var wrapJump = false;
          for (var j = c0 + 1; j <= c1; j++) if (Math.abs(pts[j].c[0] - pts[j - 1].c[0]) > 200) wrapJump = true;
          if (wrapJump) continue;
          for (var pass = 0; pass < 2; pass++) {
            ctx.strokeStyle = pass ? 'rgba(236,246,250,' + al.toFixed(3) + ')' : 'rgba(6,26,48,' + (al * 0.30).toFixed(3) + ')';
            ctx.lineWidth = (pass ? 1.1 + qa.s * 0.9 : 3.0) * lk;
            ctx.beginPath();
            var e0 = side < 0 ? pts[c0].l : pts[c0].r, sh = pass ? 0 : side * 1.3;
            ctx.moveTo(e0[0] + sh, e0[1]);
            for (var j2 = c0 + 1; j2 < c1; j2++) {
              var ea = side < 0 ? pts[j2].l : pts[j2].r, eb = side < 0 ? pts[j2 + 1].l : pts[j2 + 1].r;
              ctx.quadraticCurveTo(ea[0] + sh, ea[1], (ea[0] + eb[0]) / 2 + sh, (ea[1] + eb[1]) / 2);
            }
            var eL = side < 0 ? pts[c1].l : pts[c1].r; ctx.lineTo(eL[0] + sh, eL[1]);
            ctx.stroke();
          }
        }
      }
      // 1-b) 팔을 따라 깃털처럼 비스듬한 짧은 물마루 (선미 V자 파문의 결)
      for (var i4 = 2; i4 < n; i4 += 4) {
        var Pq = pts[i4], qq = Pq.q;
        if (qq.seed < 0.45) continue;
        var fq = Math.pow(1 - Math.min(1, Pq.a), 1.6) * Math.min(1, Pq.a * 8 + 0.1) * Math.min(1, qq.s * 1.3);
        if (fq < 0.05) continue;
        var dxv = pts[i4 - 1].c[0] - pts[i4].c[0], dyv = pts[i4 - 1].c[1] - pts[i4].c[1], dl2 = Math.hypot(dxv, dyv) || 1; dxv /= dl2; dyv /= dl2;   // 배 쪽(앞)
        for (var sd4 = -1; sd4 <= 1; sd4 += 2) {
          var E = sd4 < 0 ? Pq.l : Pq.r, ix = Pq.c[0] - E[0], iy = Pq.c[1] - E[1], il = Math.hypot(ix, iy) || 1;
          var len4 = Math.min(11 * lk, il * 0.35);
          ix /= il; iy /= il;
          ctx.strokeStyle = 'rgba(232,244,250,' + (0.26 * fq).toFixed(3) + ')'; ctx.lineWidth = lk;
          ctx.beginPath(); ctx.moveTo(E[0], E[1]); ctx.lineTo(E[0] + (ix * 0.8 - dxv * 0.6) * len4, E[1] + (iy * 0.8 - dyv * 0.6) * len4); ctx.stroke();
        }
      }
      // 2) 가운데 거품 물길: 한 줄 리본이 아니라 거품 덩어리들 — 선미 가까이는 촘촘하고 밝게, 멀어질수록 넓게 흩어지며 사라진다
      for (var i3 = 1; i3 < n; i3++) {
        var P1 = pts[i3], q1 = P1.q, ag1 = P1.ag;
        var fa = Math.pow(1 - Math.min(1, P1.a / 0.62), 1.5);
        if (fa <= 0.02) continue;
        var nx = P1.l[0] - P1.r[0], ny = P1.l[1] - P1.r[1], nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
        var wpx = halfW * zoom * (Wk.foamWidth + Wk.foamGrow * ag1 * kz) * (0.6 + 0.5 * q1.s) * (1 + q1.slip * 0.9);
        var strong = Math.min(1, q1.s * 1.4 + 0.1);
        // 옅은 바탕 (끊겨 보이도록 점마다 세기가 다르다)
        var baseA = 0.10 * fa * strong * (0.5 + q1.seed);
        if (baseA > 0.015) { ctx.fillStyle = 'rgba(214,232,240,' + baseA.toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(P1.c[0], P1.c[1], Math.max(1, wpx * 1.1), Math.max(1, wpx * 0.8), Math.atan2(ny, nx), 0, 6.2832); ctx.fill(); }
        var nb = Math.floor(q1.seed * 3 * strong + (ag1 < 0.2 ? 1.5 : 0.3));
        for (var b = 0; b < nb; b++) {
          var ss = (q1.seed * (b + 1) * 7.31 + b * 0.37) % 1, ss2 = (q1.seed * (b + 3) * 3.17) % 1;
          if (ss2 < 0.25 * Math.min(1, ag1 * 2)) continue;                // 나이 들수록 구멍이 난다
          var ofs = (ss - 0.5) * wpx * 1.8;
          var bx = P1.c[0] + nx * ofs, by = P1.c[1] + ny * ofs;
          var rad = Math.max(0.7, (0.7 + ss2 * 1.5) * lk * (1 + ag1 * 1.4 * kz) * Math.min(1.3, 0.45 + q1.s));
          ctx.fillStyle = 'rgba(242,248,250,' + (0.42 * fa * strong * (0.35 + 0.65 * ss2)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(bx, by, rad, 0, 6.2832); ctx.fill();
        }
        // 선회 때 바깥쪽의 두꺼운 포말
        var tk = Math.min(1, Math.max(q1.slip, q1.turn));
        if (tk > 0.12) {
          var sd = q1.side, ex = P1.c[0] + nx * sd * wpx * 0.9, ey = P1.c[1] + ny * sd * wpx * 0.9;
          ctx.fillStyle = 'rgba(242,248,250,' + (0.30 * tk * fa).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(ex, ey, Math.max(1, wpx * (0.30 + 0.38 * tk) * (0.7 + 0.6 * q1.seed)), 0, 6.2832); ctx.fill();
        }
      }
    }
    // 3) 입자 (선수 물보라·선측 물살·선미 거품·선회 물보라)
    var Pp = F.parts;
    for (var k = 0; k < Pp.length; k++) {
      var p = Pp[k], t = Math.max(0, p.age / p.life);
      var sp2 = toScreen(p.x, p.y);
      if (sp2[0] < -50 || sp2[0] > 1650 || sp2[1] < -50 || sp2[1] > 950) continue;
      var r = Math.max(0.7, (p.s0 + (p.s1 - p.s0) * Math.sqrt(t)) * zoom);
      var al2 = p.a0 * Math.pow(1 - t, p.k === 1 ? 1.2 : 1.8);
      if (al2 < 0.02) continue;
      ctx.fillStyle = 'rgba(242,248,250,' + al2.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sp2[0], sp2[1], r, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  };

  /** 선체에 붙어 있는 물: 선수 파도(좌우로 갈라지는 물결)와 선측 물줄기(뒤로 흐름). 배를 그리기 바로 전에 */
  FXS.drawHull = function (F, ctx, x, y, ang, lenPx, sr, slip, side, t) {
    if (sr < 0.04) return;
    var L = lenPx, Wd = lenPx * 0.34, k = Math.min(1, sr), lk = Math.sqrt(lenPx / 38);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-ang);
    ctx.lineCap = 'round';
    // 선수 파도: 뱃머리에서 좌우로 갈라져 뒤로 퍼지는 두 줄 (속력이 높을수록 벌어지고 길다)
    for (var s = -1; s <= 1; s += 2) {
      var spread = Wd * (0.55 + 0.55 * k) + (s === side ? slip * Wd * 0.6 : 0);
      ctx.strokeStyle = 'rgba(10,35,60,' + (0.18 * k).toFixed(3) + ')'; ctx.lineWidth = 2.4 * lk;
      ctx.beginPath(); ctx.moveTo(L * 0.56, 0); ctx.quadraticCurveTo(L * 0.30, s * Wd * 0.62, L * (0.02 - 0.18 * k), s * (spread + 1.5)); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,248,250,' + (0.55 * k).toFixed(3) + ')'; ctx.lineWidth = (1.2 + 1.3 * k) * lk;
      ctx.beginPath(); ctx.moveTo(L * 0.58, 0); ctx.quadraticCurveTo(L * 0.32, s * Wd * 0.58, L * (0.04 - 0.18 * k), s * spread); ctx.stroke();
    }
    // 선측 물줄기: 선체 옆을 따라 뒤로 흐르는 끊긴 흰 줄 (흐르는 빠르기 = 배 속력)
    ctx.setLineDash([(3 + 4 * k) * lk, (5 + 3 * k) * lk]);
    ctx.lineDashOffset = -((F.flow || 0) * sr * 260 * lk) % (100 * lk);
    for (var s2 = -1; s2 <= 1; s2 += 2) {
      var extra = s2 === side ? slip * 0.7 : 0;
      ctx.strokeStyle = 'rgba(236,246,250,' + (0.42 * k + 0.3 * extra).toFixed(3) + ')'; ctx.lineWidth = (1 + k + extra * 2) * lk;
      ctx.beginPath(); ctx.moveTo(L * 0.34, s2 * Wd * 0.52); ctx.quadraticCurveTo(L * 0.0, s2 * Wd * (0.60 + extra * 0.5), -L * 0.48, s2 * Wd * (0.46 + extra * 0.4)); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  };
})(window.G = window.G || {});
