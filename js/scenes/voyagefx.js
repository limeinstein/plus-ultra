/* 항해 효과 스프라이트 (images/effects/)
   · 배가 속력을 낼 때 — 선수 양옆으로 물보라(ship_spray.png, 4열×2행, 셀 256×256, 오른쪽으로 가는 배 기준)
     가속이 셀수록 크고 진하게, 가속이 갑자기 붙는 순간엔 한 번 크게 튄다
   · 모항에서 출항할 때 — 갈매기 떼가 항구에서 날아올라 함대를 배웅한다(departure_gull.png, 8프레임 날갯짓)
     지난번 모항 출항에서 3개월(G.FX.voyage.sendoffMonths)이 지났을 때만 (매번은 아니다), 처음 출항도 포함
   조정값: G.FX.voyage (js/data/seafx.js). 그림 파일이 없으면 아무것도 그리지 않는다 (게임은 그대로). */
(function (G) {
  'use strict';
  var U = G.U;
  var VF = G.VoyageFX = {};
  var DEF = {
    spray: true,         // 가속 물보라를 쓰나
    accelFrom: 0.35,     // 이 가속(°/일²)부터 물보라가 보이기 시작해
    accelFull: 1.8,      // 이 가속에서 가장 세다
    sprayScale: 0.95,    // 물보라 한 장의 너비 = 배 그림 길이 × 이 값 (세기에 따라 0.65~1.1배)
    sprayFrameMs: 80,    // 한 프레임 (그림 설명: 70~90ms)
    sprayFollow: 0.6,    // 따르는 배는 이만큼만
    sprayAlpha: 0.9,
    burstFrom: 0.55,     // 세기가 이 값을 넘어서는 순간 한 번 크게 튄다
    burstCool: 2.5,      // 크게 튄 뒤 쉬는 시간(초)
    burstScale: 1.35,    // 크게 튈 때 크기
    sendoffMonths: 3,    // 모항 출항 배웅: 지난번 모항 출항에서 이만큼(달) 지나야
    gulls: 9,            // 갈매기 수
    gullFrameMs: 95,     // 날갯짓 한 프레임 (그림 설명: 85~110ms)
    gullSize: 0.62,      // 갈매기 한 마리 = 배 그림 길이 × 이 값 (가까이 올수록 1.4배까지)
    sendoffSec: 7.5,     // 배웅이 이어지는 시간(초)
    title: true          // 「모항 ○○을 떠나다」 글귀
  };
  function C() { var v = (G.FX && G.FX.voyage) || {}, o = {}; for (var k in DEF) o[k] = v[k] != null ? v[k] : DEF[k]; return o; }
  function S() { return G.Game.state; }

  // ---------------------------------------------------------------- 그림 시트
  var SHEET = {}, CELL = 256;
  function sheet(id) {
    var o = SHEET[id]; if (o) return o.img;
    o = SHEET[id] = { img: null };
    var I = G.Img; if (!I) return null;
    var chain = I.chain && I.chain.effect ? I.chain.effect(id) : ['effects/' + id];
    var k = I.pick(chain); if (!k) return null;
    var got = I.get(k);
    if (got) { o.img = got; return got; }
    I.resolve(chain).then(function (r) { if (r && r.img) o.img = r.img; });
    return null;
  }
  /** 갈매기 그림자 (검은 실루엣) — 한 번만 만든다 */
  function silhouette(img) {
    if (img._sil) return img._sil;
    var c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    var x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    img._sil = c; return c;
  }
  VF.preload = function () { sheet('ship_spray'); sheet('departure_gull'); };
  function frame(ctx, img, f, dx, dy, dw, dh) {
    ctx.drawImage(img, (f % 4) * CELL, Math.floor(f / 4) * CELL, CELL, CELL, dx, dy, dw, dh);
  }

  // ---------------------------------------------------------------- 상태
  function V(st) { return st.vfx || (st.vfx = { I: 0, prevI: 0, cd: 0, t: 0, bursts: [], sendoff: null }); }
  VF.state = V;

  /** 모항에서 출항할 때 (sea.js enter). 배웅을 시작했으면 true */
  VF.onDepart = function (st, c) {
    var s = S(), cf = C(); VF.preload();
    if (!c || !s || !s.player || c.id !== s.player.home) return false;
    s.flags = s.flags || {};
    var last = s.flags.homeDepart, now = { y: s.date.y, m: s.date.m, d: s.date.d };
    s.flags.homeDepart = now;
    if (last && U.monthsBetween(last, now) < cf.sendoffMonths) return false;
    var v = V(st), rng = U.makeRng((s.day || 0) * 131 + c.id);
    var gulls = [];
    for (var i = 0; i < cf.gulls; i++) {
      var circle = i < 2;
      gulls.push({ circle: circle, delay: circle ? 0.4 + i * 0.35 : rng() * 1.3, T: circle ? cf.sendoffSec * 0.92 : cf.sendoffSec * (0.62 + rng() * 0.3),
        side: rng() < 0.5 ? -1 : 1, jx: rng() - 0.5, jy: rng() - 0.5, far: 5.5 + rng() * 3, spread: (rng() - 0.5) * 6,
        size: 0.8 + rng() * 0.4, phase: Math.floor(rng() * 8), flap: 0.85 + rng() * 0.35, a0: rng() * 6.28, dir: rng() < 0.5 ? -1 : 1, px: null, py: null });
    }
    v.sendoff = { t: 0, city: c.id, name: c.name, date: U.fmtDate(s.date), ships: s.fleet.ships.length, crew: s.fleet.crew, gulls: gulls };
    if (G.State && G.State.log) G.State.log('모항 ' + c.name + '에서 갈매기의 배웅을 받으며 출항했다.');
    return true;
  };

  /** 매 프레임 (sea.js update) — 가속 세기와 한 번 크게 튀는 물보라, 배웅 시간 */
  VF.step = function (st, dt, info) {
    var v = V(st), cf = C(); info = info || {};
    v.t += dt; if (v.cd > 0) v.cd -= dt;
    var a = st.accel || 0, sp = info.speed || 0;
    var moving = !st.paused && !info.frozen && sp > 0.03;
    var tgt = moving && cf.spray ? U.clamp((a - cf.accelFrom) / Math.max(0.01, cf.accelFull - cf.accelFrom), 0, 1) * Math.min(1, 0.35 + sp * 2.2) : 0;
    v.prevI = v.I;
    v.I += (tgt - v.I) * Math.min(1, dt * (tgt > v.I ? 6 : 2.2));
    if (v.I > cf.burstFrom && v.prevI <= cf.burstFrom && v.cd <= 0) { v.bursts.push({ t: 0, k: 0.8 + v.I * 0.4 }); v.cd = cf.burstCool; }
    var life = 8 * cf.sprayFrameMs / 1000;
    v.bursts.forEach(function (b) { b.t += dt; });
    v.bursts = v.bursts.filter(function (b) { return b.t < life; });
    if (v.sendoff) { v.sendoff.t += dt; if (v.sendoff.t > cf.sendoffSec + 1.5) v.sendoff = null; }
  };

  var LOOP = [1, 2, 3, 4, 3, 2];
  /** 한 배의 선수 물보라 (sea.js drawOverlay — 배를 그린 뒤). idx 0 = 기함 */
  VF.drawSpray = function (st, ctx, bx, by, h, L, idx) {
    var v = st.vfx; if (!v || (!v.bursts.length && v.I < 0.03)) return;
    var img = sheet('ship_spray'); if (!img) return;
    var cf = C(), kShip = idx ? cf.sprayFollow : 1;
    var fx = Math.cos(h), fy = -Math.sin(h), lx = -Math.sin(h), ly = -Math.cos(h);   // 화면에서 앞·왼쪽(좌현)
    var bowX = bx + fx * L * 0.34, bowY = by + fy * L * 0.34;
    function put(f, side, k, alpha) {
      var w = L * cf.sprayScale * k * kShip, sc = w / CELL;
      ctx.save();
      ctx.translate(bowX + lx * side * L * 0.07, bowY + ly * side * L * 0.07);
      ctx.rotate(-h);
      if (side < 0) ctx.scale(1, -1);                 // 우현 쪽은 위아래를 뒤집어 바깥으로 튀게
      ctx.globalAlpha = alpha;
      frame(ctx, img, f, -150 * sc, -226 * sc, CELL * sc, CELL * sc);   // 그림의 물마루 밑동(150, 226)을 선수 옆에
      ctx.restore();
    }
    var tms = v.t * 1000;
    if (v.I >= 0.03) {
      var k = 0.65 + 0.45 * v.I, al = Math.min(1, v.I * 1.25) * cf.sprayAlpha * (idx ? 0.8 : 1);
      put(LOOP[Math.floor(tms / cf.sprayFrameMs + idx * 2) % LOOP.length], 1, k, al);
      put(LOOP[Math.floor(tms / cf.sprayFrameMs + 3 + idx * 2) % LOOP.length], -1, k * 0.94, al);
    }
    v.bursts.forEach(function (b) {
      var f = Math.min(7, Math.floor(b.t * 1000 / cf.sprayFrameMs));
      put(f, 1, cf.burstScale * b.k, cf.sprayAlpha * (idx ? 0.75 : 1));
      put(Math.max(0, f - 1), -1, cf.burstScale * b.k * 0.92, cf.sprayAlpha * (idx ? 0.75 : 1));
    });
  };

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function bez(a, b, c, d, t) { var u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; }
  /** 하늘: 배웅하는 갈매기 떼와 글귀 (sea.js drawOverlay 맨 위). pp = 기함 화면 자리 */
  VF.drawSky = function (st, ctx, pp, h, L, toScreen) {
    var v = st.vfx, so = v && v.sendoff; if (!so) return;
    var cf = C(), img = sheet('departure_gull'), c = G.CITY_DATA[so.city];
    var cp = c && toScreen ? toScreen(c.lon, c.lat) : [pp[0] - Math.cos(h) * L * 3, pp[1] + Math.sin(h) * L * 3];
    var fx = Math.cos(h), fy = -Math.sin(h), lx = -Math.sin(h), ly = -Math.cos(h);
    if (img) {
      var sil = silhouette(img), list = [];
      so.gulls.forEach(function (g) {
        var tt = (so.t - g.delay) / g.T; if (tt <= 0 || tt >= 1) return;
        var x, y;
        if (g.circle) {
          // 항구에서 날아와 기함 위를 한 바퀴 반 돌고 앞으로 멀어진다
          var ang = g.a0 + g.dir * tt * Math.PI * 3, rr = L * (1.25 + 0.35 * Math.sin(tt * 7));
          var ox = pp[0] + fx * L * 0.2 + Math.cos(ang) * rr, oy = pp[1] + fy * L * 0.2 + Math.sin(ang) * rr * 0.78;
          var inK = U.clamp(tt / 0.22, 0, 1), outK = U.clamp((tt - 0.78) / 0.22, 0, 1);
          x = cp[0] + (ox - cp[0]) * ease(inK); y = cp[1] + (oy - cp[1]) * ease(inK);
          x += fx * L * 7 * outK * outK; y += fy * L * 7 * outK * outK;
        } else {
          // 항구 → 함대 위 → 뱃머리 앞쪽 멀리 (앞의 두 점은 항구, 뒤의 두 점은 지금 배의 자리와 방향을 따른다)
          var p0x = cp[0] + g.jx * L * 1.6, p0y = cp[1] + g.jy * L * 1.6;
          var p1x = (cp[0] + pp[0]) / 2 + lx * g.side * L * 1.8, p1y = (cp[1] + pp[1]) / 2 + ly * g.side * L * 1.8;
          var p2x = pp[0] + fx * L * 1.2 - lx * g.side * L * 1.3, p2y = pp[1] + fy * L * 1.2 - ly * g.side * L * 1.3;
          var p3x = pp[0] + fx * L * g.far + lx * L * g.spread, p3y = pp[1] + fy * L * g.far + ly * L * g.spread;
          var e = ease(tt);
          x = bez(p0x, p1x, p2x, p3x, e); y = bez(p0y, p1y, p2y, p3y, e);
        }
        var vx = g.px == null ? fx : x - g.px, vy = g.py == null ? fy : y - g.py; g.px = x; g.py = y;
        var near = g.circle ? 0.75 + 0.35 * Math.sin(Math.min(1, tt * 1.3) * Math.PI) + (tt > 0.78 ? (tt - 0.78) * 2.5 : 0) : 0.5 + 0.9 * ease(tt);
        var alpha = Math.min(1, tt / 0.08) * Math.min(1, (1 - tt) / 0.18);
        list.push({ g: g, x: x, y: y, vx: vx, vy: vy, near: near, alpha: alpha, tt: tt });
      });
      list.sort(function (a, b) { return a.near - b.near; });      // 가까운(큰) 갈매기를 나중에
      var tms = so.t * 1000;
      list.forEach(function (o) {
        var g = o.g, w = L * cf.gullSize * g.size * o.near, sc = w / CELL;
        var glide = Math.sin(so.t * 1.3 + g.a0) > 0.72 && o.tt > 0.2;          // 가끔 날개를 편 채 미끄러진다
        var f = glide ? 0 : (g.phase + Math.floor(tms / (cf.gullFrameMs * g.flap * (o.tt < 0.25 ? 0.8 : 1)))) % 8;
        var flip = o.vx < 0 ? -1 : 1, tilt = U.clamp(Math.atan2(o.vy, Math.abs(o.vx) + 1e-3), -0.45, 0.45) * flip;
        var alt = 0.35 + 0.65 * o.near;                                        // 높이 날수록 그림자가 멀고 옅다
        // 바다에 드리운 그림자
        ctx.save(); ctx.globalAlpha = 0.16 * o.alpha / (0.6 + alt * 0.5);
        ctx.translate(o.x + L * 0.55 * alt, o.y + L * 0.75 * alt); ctx.rotate(tilt); ctx.scale(flip * 0.85, 0.55);
        frame(ctx, sil, f, -CELL * sc / 2, -CELL * sc / 2, CELL * sc, CELL * sc);
        ctx.restore();
        // 갈매기
        ctx.save(); ctx.globalAlpha = o.alpha;
        ctx.translate(o.x, o.y); ctx.rotate(tilt); ctx.scale(flip, 1);
        frame(ctx, img, f, -CELL * sc / 2, -CELL * sc / 2, CELL * sc, CELL * sc);
        ctx.restore();
      });
    }
    // 글귀: 「모항 리스본을 떠나다」
    if (cf.title) {
      var t = so.t, a = U.clamp((t - 0.5) / 0.8, 0, 1) * U.clamp((cf.sendoffSec - 0.6 - t) / 1.2, 0, 1);
      if (a > 0) {
        var fam = getComputedStyle(document.body).fontFamily, cx = 800, cy = 132;
        ctx.save(); ctx.globalAlpha = a;
        var g2 = ctx.createLinearGradient(cx - 420, 0, cx + 420, 0);
        g2.addColorStop(0, 'rgba(12,18,30,0)'); g2.addColorStop(0.2, 'rgba(12,18,30,.55)'); g2.addColorStop(0.8, 'rgba(12,18,30,.55)'); g2.addColorStop(1, 'rgba(12,18,30,0)');
        ctx.fillStyle = g2; ctx.fillRect(cx - 420, cy - 44, 840, 88);
        ctx.strokeStyle = 'rgba(217,180,95,.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - 300, cy - 40); ctx.lineTo(cx + 300, cy - 40); ctx.moveTo(cx - 300, cy + 40); ctx.lineTo(cx + 300, cy + 40); ctx.stroke();
        ctx.textAlign = 'center';
        ctx.font = '700 34px ' + fam; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,8,4,.7)';
        var line = '모항 ' + so.name + U.jx(so.name, '을/를') + ' 떠나다';
        ctx.strokeText(line, cx, cy + 4); ctx.fillStyle = '#f3dc9c'; ctx.fillText(line, cx, cy + 4);
        ctx.font = '500 16px ' + fam; ctx.fillStyle = 'rgba(242,231,204,.9)';
        ctx.fillText(so.date + ' · 배 ' + so.ships + '척 · 선원 ' + so.crew + '명 — 갈매기들이 배웅한다', cx, cy + 30);
        ctx.restore();
      }
    }
  };
})(window.G = window.G || {});
