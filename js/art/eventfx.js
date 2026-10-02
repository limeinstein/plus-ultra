/* 사건 그림 (G.EventFx) — 항해·육상 탐험 중 사건이 일어나면 대화창 바로 위에 작은 창을 띄워 그린 스프라이트를 튼다.
   · 고래·돌고래·인어(항해 사건), 폭풍·비구름·소나기·뙤약볕(날씨), 들짐승의 습격(육상 탐험)
   · 그림 시트는 images/sprites/ (tools/sprite_repack.py), 칸·피벗·장면 시간은 G.SPRITE_SHEETS. 그림이 없으면 아무것도 띄우지 않는다
   · 쓰는 법: var fx = G.EventFx.show('whale'); await UI.say(...); fx.stop();
             또는 await G.EventFx.during('storm', function () { return UI.say(...); });
   조정값: G.FX.sprites (events · eventW · eventH · eventBottom) */
(function (G) {
  'use strict';
  var EF = G.EventFx = {};
  var SPR = function () { return G.Sprites; };
  function C() { return (G.FX && G.FX.sprites) || {}; }
  var NOOP = { stop: function () { return Promise.resolve(); }, alive: false };

  /** 시트의 모든 장면을 줄 차례로 [줄, 칸] */
  function seq(id, rows) {
    var m = SPR().meta(id), out = []; if (!m) return out;
    (rows || m.rows.map(function (_, i) { return i; })).forEach(function (r) { for (var c = 0; c < m.n[r]; c++) out.push([r, c]); });
    return out;
  }
  function msOf(id) { var m = SPR().meta(id); return (m && m.ms) || 120; }
  /** 장면 목록을 시간 t에 맞춰 고른다. hold: 한 바퀴 뒤 쉬는 시간(초) — once 시트는 쉬었다가 다시 */
  function pick(list, t, ms, hold) {
    var n = list.length, cyc = n * ms / 1000 + (hold || 0), u = t % cyc, i = Math.floor(u * 1000 / ms);
    return i < n ? list[i] : null;
  }

  // ---------------------------------------------------------------- 배경
  var BG = {
    sea: ['#4a7398', '#a3bfd0', '#2f6a8a', '#123c58'],
    dusk: ['#3a3e6a', '#c98a72', '#2a4a68', '#0f2236'],
    storm: ['#2a3038', '#4a525c', '#22323e', '#0c161e'],
    grey: ['#69737e', '#a9b1b8', '#4e6a7a', '#2a4250'],
    warm: ['#d99a52', '#f3d29a', '#4f8eae', '#1f5a7c'],
    grass: ['#9ab8d0', '#d8e2dc', '#6f8a4a', '#51683a'], steppe: ['#a8c0d4', '#e2e2d0', '#a09a5a', '#7a7440'],
    desert: ['#e8c890', '#f6e6c0', '#d8b878', '#b89458'], forest: ['#8aa8b8', '#c8d6d0', '#46643a', '#2e4a2a'],
    jungle: ['#7a9aa0', '#b8ccc0', '#3a5a30', '#223a1e'], mountain: ['#9ab0c4', '#d6dee2', '#8a8474', '#666050'],
    snow: ['#b8c6d4', '#eef2f6', '#e8ecf0', '#c4ccd6'], tundra: ['#a8b8c6', '#e0e4e0', '#a8a888', '#84846a'], ice: ['#c0d0de', '#f0f6fa', '#dfeaf2', '#b8ccdc']
  };
  function backdrop(w, h, kind) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'), b = BG[kind] || BG.sea, hz = h * 0.56;
    var g = x.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, b[0]); g.addColorStop(1, b[1]); x.fillStyle = g; x.fillRect(0, 0, w, hz + 1);
    g = x.createLinearGradient(0, hz, 0, h); g.addColorStop(0, b[2]); g.addColorStop(1, b[3]); x.fillStyle = g; x.fillRect(0, hz, w, h - hz);
    // 물결·풀결
    var rng = G.U.makeRng(w + h);
    x.globalAlpha = 0.18; x.fillStyle = '#ffffff';
    for (var i = 0; i < 60; i++) { var yy = hz + Math.pow(rng(), 1.6) * (h - hz), ww = 6 + rng() * 30 * (yy - hz) / (h - hz); x.fillRect(rng() * w, yy, ww, 1.2); }
    x.globalAlpha = 1;
    // 가장자리를 부드럽게 지운다 (타원 창)
    x.globalCompositeOperation = 'destination-in';
    var m = x.createRadialGradient(0, 0, w * 0.3, 0, 0, w * 0.5);
    m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(0.6, 'rgba(0,0,0,.9)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    x.save(); x.translate(w / 2, h / 2); x.scale(1, h / w);
    x.fillStyle = m; x.fillRect(-w / 2, -w / 2, w, w);
    x.restore();
    // 망원경으로 들여다보듯 가장자리를 어둡게
    x.globalCompositeOperation = 'source-atop';
    var r = x.createRadialGradient(0, 0, w * 0.26, 0, 0, w * 0.5);
    r.addColorStop(0, 'rgba(12,10,8,0)'); r.addColorStop(1, 'rgba(12,10,8,.55)');
    x.save(); x.translate(w / 2, h / 2); x.scale(1, h / w); x.fillStyle = r; x.fillRect(-w / 2, -w / 2, w, w); x.restore();
    x.globalCompositeOperation = 'source-over';
    return c;
  }

  // ---------------------------------------------------------------- 사건 장면
  /* 장면마다 그리기 함수(ctx, w, h, t). 배경은 bg 이름 */
  var SCENES = {
    whale: { bg: 'sea', ids: ['whale'], draw: function (x, w, h, t) {
      var S = SPR(), f = pick(seq('whale'), t, msOf('whale'), 0.6); if (!f) return;
      var k = h * 0.8 / S.height('whale'); S.draw(x, 'whale', f[0], f[1], w * 0.5, h * 0.88, k);
    } },
    dolphin: { bg: 'sea', ids: ['dolphin'], draw: function (x, w, h, t) {
      var S = SPR(), list = seq('dolphin'), ms = msOf('dolphin'), k = h * 0.62 / S.height('dolphin');
      [[0.3, 0, 1], [0.55, 0.55, 0.82], [0.76, 1.1, 0.7]].forEach(function (d) {
        var f = pick(list, t - d[1], ms, 0.5); if (f && t >= d[1]) S.draw(x, 'dolphin', f[0], f[1], w * d[0], h * (0.84 - (1 - d[2]) * 0.12), k * d[2]);
      });
    } },
    mermaid: { bg: 'dusk', ids: ['mermaid'], draw: function (x, w, h, t) {
      var S = SPR(), ms = msOf('mermaid'), up = seq('mermaid', [0]), sing = seq('mermaid', [1]);
      var tu = up.length * ms / 1000, f = t < tu ? up[Math.floor(t * 1000 / ms)] : sing[Math.floor((t - tu) * 1000 / (ms * 1.6)) % sing.length];
      var k = h * 0.78 / S.height('mermaid'); S.draw(x, 'mermaid', f[0], f[1], w * 0.5, h * 0.92, k);
    } },
    storm: { bg: 'storm', ids: ['storm', 'rain'], draw: function (x, w, h, t) {
      var S = SPR(), f = pick(seq('storm'), t, msOf('storm')), k = h * 0.86 / S.height('storm');
      rain(x, w, h, t, 0.45, [0.2, 0.8]);
      S.draw(x, 'storm', f[0], f[1], w * 0.5, h * 0.95, k);
      if ((t * 1.3) % 3.2 < 0.08) { x.fillStyle = 'rgba(230,236,255,.35)'; x.fillRect(0, 0, w, h); }
    } },
    raincloud: { bg: 'grey', ids: ['raincloud', 'rain'], draw: function (x, w, h, t) { cloud(x, w, h, t, 0.45); } },
    shower: { bg: 'grass', ids: ['raincloud', 'rain'], draw: function (x, w, h, t) { rain(x, w, h, t, 0.5, [0.24, 0.76]); cloud(x, w, h, t, 0.9); } },
    sun: { bg: 'warm', ids: ['sun'], draw: function (x, w, h, t) {
      var S = SPR(), f = pick(seq('sun'), t, msOf('sun')), k = h * 0.7 / S.height('sun');
      var g = x.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, h * 0.7); g.addColorStop(0, 'rgba(255,236,170,.55)'); g.addColorStop(1, 'rgba(255,236,170,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      S.draw(x, 'sun', f[0], f[1], w * 0.5, h * 0.8, k * (1 + 0.03 * Math.sin(t * 2)));
    } },
    beast: { bg: 'grass', ids: ['animals'], draw: function (x, w, h, t, o) {
      var S = SPR(), row = S.row('animals', o.animal || 'boar'); if (row < 0) return;
      var k = h * 0.5 / S.height('animals') * (((C().sheetK || {}).animals) || 1), run = 1.1, ax, act, tt;
      // 오른쪽에서 달려들어 와서(왼쪽을 보고) 덮친다
      if (t < run) { act = 'run'; tt = t; ax = w * (1.05 - 0.55 * (t / run)); }
      else { act = 'attack'; tt = (t - run) % 1.4; ax = w * 0.5; }
      // 뒤따르는 떼 (조금 멀리, 작게)
      if (o.pack) [[0.24, 0.3], [0.8, 0.6]].forEach(function (p) {
        var r2 = S.row('animals', o.pack); if (r2 < 0 || t < p[1]) return;
        var tp = t - p[1], moving = tp < run, px = w * p[0] + (moving ? (1 - tp / run) * w * 0.45 : 0);
        S.draw(x, 'animals', r2, S.at('animals', r2, moving ? 'run' : 'idle', tp, moving ? 12 : 4), px, h * 0.76, k * 0.72, true, 0.92);
      });
      var fr = S.at('animals', row, act, tt, act === 'run' ? 12 : 7, act === 'run');
      x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.ellipse(ax, h * 0.86, 60 * k, 9 * k, 0, 0, 7); x.fill();
      S.draw(x, 'animals', row, fr, ax, h * 0.86, k, true);
    } }
  };
  /** 비구름 한 덩이와 그 밑의 빗줄기 (a: 빗줄기 진하기) */
  function cloud(x, w, h, t, a) {
    var S = SPR(), f = pick(seq('raincloud'), t, msOf('raincloud')), k = h * 0.6 / S.height('raincloud');
    rain(x, w, h, t, a, [0.5]);
    S.draw(x, 'raincloud', f[0], f[1], w * 0.5, h * 0.62, k);
  }
  /** 빗줄기 시트를 가로 자리(xs: 창 너비 비율)마다 하나씩 */
  function rain(x, w, h, t, a, xs) {
    var S = SPR(); if (!S.ready('rain')) return;
    var list = seq('rain'), ms = msOf('rain'), k = h * 0.75 / S.height('rain');
    (xs || [0.5]).forEach(function (px, i) { var f = pick(list, t + i * 0.13, ms); S.draw(x, 'rain', f[0], f[1], w * px, h * 0.98, k, i % 2 === 1, a); });
  }
  EF.SCENES = SCENES;
  /** 창 없이 한 장면을 ctx에 그린다 (도감·시험용). 그림을 아직 못 읽었으면 false */
  EF.render = function (ctx, kind, t, o, w, h) {
    var sc = SCENES[kind], S = SPR(); o = o || {};
    if (!sc || !S || !sc.ids.every(function (id) { return S.ready(id); })) { if (sc && S) S.preload(sc.ids); return false; }
    w = w || ctx.canvas.width; h = h || ctx.canvas.height;
    var bg = backdrop(w, h, o.bg && BG[o.bg] ? o.bg : sc.bg);
    ctx.save(); ctx.drawImage(bg, 0, 0); sc.draw(ctx, w, h, t, o); ctx.restore();
    return true;
  };

  // ---------------------------------------------------------------- 띄우기
  var cur = null;
  /** kind: whale · dolphin · mermaid · storm · raincloud · shower · sun · beast. o: {bg 배경(지형 이름), animal, pack} */
  EF.show = function (kind, o) {
    o = o || {};
    var sc = SCENES[kind], S = SPR(), cf = C();
    if (!sc || !S || cf.events === false) return NOOP;
    if (!sc.ids.every(function (id) { return S.has(id); })) return NOOP;
    S.preload(sc.ids);
    if (cur) cur.stop();
    var root = document.getElementById('ui'); if (!root) return NOOP;
    var w = cf.eventW || 720, h = cf.eventH || 300;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.className = 'eventfx';
    cv.style.cssText = 'position:absolute;left:' + Math.round((1600 - w) / 2) + 'px;top:' + Math.round(900 - (cf.eventBottom || 205) - h) + 'px;width:' + w + 'px;height:' + h + 'px;z-index:59;pointer-events:none;opacity:0;transition:opacity .28s ease';
    root.appendChild(cv);
    var bg = backdrop(w, h, o.bg && BG[o.bg] ? o.bg : sc.bg), ctx = cv.getContext('2d');
    var h0 = { alive: true }, t0 = performance.now(), shown = false;
    function frame() {
      if (!h0.alive) return;
      if (!sc.ids.every(function (id) { return S.ready(id); })) { requestAnimationFrame(frame); t0 = performance.now(); return; }
      if (!shown) { shown = true; cv.style.opacity = '1'; }
      var t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, w, h); ctx.drawImage(bg, 0, 0);
      ctx.save();
      try { sc.draw(ctx, w, h, t, o); } catch (e) { console.warn('[사건 그림]', e); h0.alive = false; }
      ctx.restore();
      // 그림도 창 가장자리에서 흐려지게
      ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(bg, 0, 0); ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    h0.stop = function () {
      if (!h0.alive && !cv.parentNode) return Promise.resolve();
      h0.alive = false; cv.style.opacity = '0'; if (cur === h0) cur = null;
      return new Promise(function (res) { setTimeout(function () { if (cv.parentNode) cv.parentNode.removeChild(cv); res(); }, 300); });
    };
    h0.canvas = cv;
    cur = h0;
    return h0;
  };
  /** fn()이 끝날 때까지 사건 그림을 띄워 둔다 (fn 은 Promise 를 돌려준다) */
  EF.during = async function (kind, fn, o) {
    var h = EF.show(kind, o);
    try { return await fn(); } finally { h.stop(); }
  };
  /** 잠깐 띄웠다가 스스로 닫는다 (대화 없이 알림만 있을 때) */
  EF.flash = function (kind, sec, o) { var h = EF.show(kind, o); if (h.alive !== false) setTimeout(function () { h.stop(); }, (sec || 2.6) * 1000); return h; };
  /** 육상 탐험: 지금 자리의 짐승 떼 [떼, 우두머리] (육상전과 같은 규칙) */
  EF.beastsHere = function () {
    var l = (G.Game && G.Game.state && G.Game.state.loc) || {};
    return G.LANDWAR_LOOK ? G.LANDWAR_LOOK.beastsOf(l.lon || 0, l.lat || 0) : ['boar', 'bear'];
  };
})(window.G = window.G || {});
