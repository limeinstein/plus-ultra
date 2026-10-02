/* 사건 그림 (G.EventFx) — 항해·육상 탐험 중 사건이 일어나면 대화창 바로 위에 나무틀 그림창을 띄워 그린 스프라이트를 튼다.
   · 고래·돌고래·인어(항해 사건), 폭풍·비구름·소나기·뙤약볕(날씨), 들짐승의 습격(육상 탐험)
   · 그림 시트는 images/sprites/ (tools/sprite_repack.py), 칸·피벗·장면 시간은 G.SPRITE_SHEETS. 그림이 없으면 아무것도 띄우지 않는다
   · 창 안은 하늘·수평선·물결(또는 땅)을 코드로 그리고 그 위에 스프라이트를 올린다. 물결은 움직인다
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
  /** 장면 목록을 시간 t에 맞춰 고른다. hold: 한 바퀴 뒤 쉬는 시간(초) — 한 번 도는 시트는 쉬었다가 다시 */
  function pick(list, t, ms, hold) {
    var n = list.length, cyc = n * ms / 1000 + (hold || 0), u = ((t % cyc) + cyc) % cyc, i = Math.floor(u * 1000 / ms);
    return i < n ? list[i] : null;
  }

  // ---------------------------------------------------------------- 배경 (하늘 위·아래, 물·땅 위·아래, 물결 빛)
  var BG = {
    sea: { sky: ['#5f88ad', '#c6d8e0'], low: ['#3f7b9a', '#163f5c'], glint: 'rgba(235,245,255,.35)', sea: 1 },
    dusk: { sky: ['#30335c', '#e0a07c'], low: ['#3c5a78', '#122640'], glint: 'rgba(255,214,170,.4)', sea: 1, sun: '#ffd9a0' },
    storm: { sky: ['#1d232b', '#47515c'], low: ['#25404e', '#0b1820'], glint: 'rgba(200,220,235,.22)', sea: 1 },
    grey: { sky: ['#5d6772', '#a7b0b7'], low: ['#4b6979', '#22394a'], glint: 'rgba(225,235,245,.25)', sea: 1 },
    warm: { sky: ['#e0a458', '#f6dca6'], low: ['#4c8fad', '#1d587a'], glint: 'rgba(255,240,200,.45)', sea: 1 },
    grass: { sky: ['#8fb2cf', '#dfe8e2'], low: ['#7a964f', '#4c6436'] },
    steppe: { sky: ['#9fbbd2', '#ebe9d6'], low: ['#aaa060', '#7a7440'] },
    desert: { sky: ['#e9c58a', '#f8ebc8'], low: ['#dcbc7c', '#b38d52'] },
    forest: { sky: ['#86a6b8', '#d0dcd4'], low: ['#4f6e3e', '#2b4626'], trees: '#2b4128' },
    jungle: { sky: ['#78989e', '#c0d2c6'], low: ['#40633a', '#20381c'], trees: '#20361f' },
    mountain: { sky: ['#93abc1', '#dce3e7'], low: ['#8e8878', '#625c4c'], hills: '#7d8a96' },
    snow: { sky: ['#b2c2d2', '#f0f4f8'], low: ['#eef2f5', '#c6d0da'], hills: '#d6dfe8' },
    tundra: { sky: ['#a5b6c5', '#e2e6e2'], low: ['#aeae8e', '#84846a'] },
    ice: { sky: ['#bccddc', '#f2f8fb'], low: ['#e2edf4', '#b6cbda'], hills: '#e6eef4' }
  };
  var HZ = 0.52;   // 수평선 높이 (창 높이 비율)
  function backdrop(w, h, kind) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'), b = BG[kind] || BG.sea, hz = Math.round(h * HZ), rng = G.U.makeRng(w * 7 + h);
    var g = x.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, b.sky[0]); g.addColorStop(1, b.sky[1]); x.fillStyle = g; x.fillRect(0, 0, w, hz + 1);
    if (b.sun) { var sg = x.createRadialGradient(w * 0.78, hz, 0, w * 0.78, hz, h * 0.6); sg.addColorStop(0, b.sun); sg.addColorStop(1, 'rgba(255,220,170,0)'); x.fillStyle = sg; x.fillRect(0, 0, w, hz); }
    // 먼 구름: 부드러운 뭉게 몇 덩이 (작은 공을 겹쳐 가장자리가 흐리게)
    for (var i = 0; i < 5; i++) {
      var cx = rng() * w, cy = hz * (0.2 + rng() * 0.45), r = 14 + rng() * 22;
      for (var p = 0; p < 6; p++) {
        var px = cx + (p - 2.5) * r * 0.7, py = cy - Math.sin(p / 5 * Math.PI) * r * 0.45, pr = r * (0.7 + 0.5 * Math.sin(p / 5 * Math.PI));
        var cg = x.createRadialGradient(px, py, 0, px, py, pr); cg.addColorStop(0, 'rgba(255,255,255,.22)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = cg; x.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
    }
    if (b.hills) { x.fillStyle = b.hills; x.beginPath(); x.moveTo(0, hz); for (var k = 0; k <= 12; k++) x.lineTo(k * w / 12, hz - (14 + rng() * 34)); x.lineTo(w, hz); x.fill(); }
    if (b.trees) { x.fillStyle = b.trees; for (var tq = 0; tq < 40; tq++) { var tx = rng() * w, th = 12 + rng() * 22; x.beginPath(); x.moveTo(tx - th * 0.4, hz + 1); x.lineTo(tx, hz - th); x.lineTo(tx + th * 0.4, hz + 1); x.fill(); } }
    g = x.createLinearGradient(0, hz, 0, h); g.addColorStop(0, b.low[0]); g.addColorStop(1, b.low[1]); x.fillStyle = g; x.fillRect(0, hz, w, h - hz);
    if (!b.sea) {   // 땅: 풀결·돌
      x.fillStyle = 'rgba(0,0,0,.08)';
      for (var j = 0; j < 90; j++) { var yy = hz + Math.pow(rng(), 1.4) * (h - hz), ww = 3 + rng() * 22 * (yy - hz) / (h - hz); x.fillRect(rng() * w, yy, ww, 1.4); }
    }
    // 안쪽 가장자리 그늘
    var v = x.createRadialGradient(w / 2, h * 0.55, h * 0.35, w / 2, h * 0.55, w * 0.62);
    v.addColorStop(0, 'rgba(10,8,6,0)'); v.addColorStop(1, 'rgba(10,8,6,.42)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
    return c;
  }
  /** 움직이는 물결 빛 (바다 배경에서만) */
  function waves(x, w, h, t, b) {
    if (!b.sea) return;
    var hz = h * HZ;
    x.save(); x.strokeStyle = b.glint; x.lineCap = 'round';
    for (var i = 0; i < 26; i++) {
      var d = (i + 0.5) / 26, y = hz + Math.pow(d, 1.5) * (h - hz) + 2, len = 8 + 46 * d, lw = 0.8 + 1.6 * d;
      var x0 = ((i * 137.5 + t * (10 + 26 * d)) % (w + 80)) - 40;
      x.lineWidth = lw; x.globalAlpha = 0.5 + 0.5 * Math.sin(t * 1.7 + i);
      x.beginPath(); x.moveTo(x0, y); x.quadraticCurveTo(x0 + len / 2, y - 2.2 * d, x0 + len, y); x.stroke();
    }
    x.restore();
  }

  // ---------------------------------------------------------------- 사건 장면
  /* 장면마다 그리기 함수(ctx, w, h, t, o), 배경 이름 bg, 창 위 글귀 title */
  var SCENES = {
    whale: { bg: 'sea', title: '고래 떼', ids: ['whale'], draw: function (x, w, h, t) {
      var S = SPR(), f = pick(seq('whale'), t, msOf('whale') * 1.5); if (!f) return;   // 떠오름·물 뿜기·솟구침·꼬리·물결을 쉬지 않고 되풀이
      var k = h * 0.82 / S.height('whale'); S.draw(x, 'whale', f[0], f[1], w * 0.5, h * 0.9, k);
    } },
    dolphin: { bg: 'sea', title: '돌고래 떼', ids: ['dolphin'], draw: function (x, w, h, t) {
      var S = SPR(), list = seq('dolphin'), ms = msOf('dolphin'), k = h * 0.66 / S.height('dolphin');
      [[0.28, 0, 1], [0.54, 0.55, 0.8], [0.76, 1.1, 0.66]].forEach(function (d) {
        var f = pick(list, t - d[1], ms, 0.5); if (f && t >= d[1]) S.draw(x, 'dolphin', f[0], f[1], w * d[0], h * (0.9 - (1 - d[2]) * 0.16), k * d[2]);
      });
    } },
    mermaid: { bg: 'dusk', title: '물결 위의 노래', ids: ['mermaid'], draw: function (x, w, h, t) {
      var S = SPR(), ms = msOf('mermaid'), up = seq('mermaid', [0]), sing = seq('mermaid', [1]);
      var tu = up.length * ms / 1000, f = t < tu ? up[Math.floor(t * 1000 / ms)] : sing[Math.floor((t - tu) * 1000 / (ms * 1.6)) % sing.length];
      var k = h * 0.84 / S.height('mermaid'); S.draw(x, 'mermaid', f[0], f[1], w * 0.5, h * 0.96, k);
    } },
    storm: { bg: 'storm', title: '폭풍', ids: ['storm', 'rain'], draw: function (x, w, h, t) {
      var S = SPR(), f = pick(seq('storm'), t, msOf('storm')), k = h * 0.9 / S.height('storm');
      rain(x, w, h, t, 0.42, [0.16, 0.84]);
      S.draw(x, 'storm', f[0], f[1], w * 0.5, h * 0.98, k);
      if ((t * 1.3) % 3.2 < 0.08) { x.fillStyle = 'rgba(230,236,255,.3)'; x.fillRect(0, 0, w, h); }
    } },
    raincloud: { bg: 'grey', title: '먹구름', ids: ['raincloud', 'rain'], draw: function (x, w, h, t) { cloud(x, w, h, t, 0.45); } },
    shower: { bg: 'grass', title: '소나기', ids: ['raincloud', 'rain'], draw: function (x, w, h, t) { rain(x, w, h, t, 0.5, [0.22, 0.78]); cloud(x, w, h, t, 0.9); } },
    sun: { bg: 'warm', title: '뙤약볕', ids: ['sun'], draw: function (x, w, h, t) {
      var S = SPR(), f = pick(seq('sun'), t, msOf('sun')), k = h * 0.72 / S.height('sun');
      var g = x.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, h * 0.75); g.addColorStop(0, 'rgba(255,236,170,.5)'); g.addColorStop(1, 'rgba(255,236,170,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      S.draw(x, 'sun', f[0], f[1], w * 0.5, h * 0.8, k * (1 + 0.03 * Math.sin(t * 2)));
    } },
    beast: { bg: 'grass', title: '짐승의 습격', ids: ['animals'], draw: function (x, w, h, t, o) {
      var S = SPR(), row = S.row('animals', o.animal || 'boar'); if (row < 0) return;
      var k = h * 0.36 / S.bodyH('animals'), run = 1.1, ax, act, tt;
      // 오른쪽에서 달려들어 와서(왼쪽을 보고) 덮친다
      if (t < run) { act = 'run'; tt = t; ax = w * (1.05 - 0.55 * (t / run)); }
      else { act = 'attack'; tt = (t - run) % 1.4; ax = w * 0.5; }
      // 뒤따르는 떼 (조금 멀리, 작게)
      if (o.pack) [[0.22, 0.3], [0.8, 0.6]].forEach(function (p) {
        var r2 = S.row('animals', o.pack); if (r2 < 0 || t < p[1]) return;
        var tp = t - p[1], moving = tp < run, px = w * p[0] + (moving ? (1 - tp / run) * w * 0.45 : 0);
        shadowAt(x, px, h * 0.78, 18 * k * 0.72);
        S.draw(x, 'animals', r2, S.at('animals', r2, moving ? 'run' : 'idle', tp, moving ? 12 : 4), px, h * 0.78, k * 0.72, true);
      });
      shadowAt(x, ax, h * 0.9, 22 * k);
      S.draw(x, 'animals', row, S.at('animals', row, act, tt, act === 'run' ? 12 : 7, act === 'run'), ax, h * 0.9, k, true);
    } }
  };
  function shadowAt(x, cx, cy, rx) { x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.ellipse(cx, cy, rx, rx * 0.16, 0, 0, 7); x.fill(); }
  /** 비구름 한 덩이와 그 밑의 빗줄기 (a: 빗줄기 진하기) */
  function cloud(x, w, h, t, a) {
    var S = SPR(), f = pick(seq('raincloud'), t, msOf('raincloud')), k = h * 0.62 / S.height('raincloud');
    rain(x, w, h, t, a, [0.5]);
    S.draw(x, 'raincloud', f[0], f[1], w * 0.5, h * 0.62, k);
  }
  /** 빗줄기 시트를 가로 자리(xs: 창 너비 비율)마다 하나씩 */
  function rain(x, w, h, t, a, xs) {
    var S = SPR(); if (!S.ready('rain')) return;
    var list = seq('rain'), ms = msOf('rain'), k = h * 0.78 / S.height('rain');
    (xs || [0.5]).forEach(function (px, i) { var f = pick(list, t + i * 0.13, ms); S.draw(x, 'rain', f[0], f[1], w * px, h, k, i % 2 === 1, a); });
  }
  EF.SCENES = SCENES;
  function bgOf(sc, o) { return o && o.bg && BG[o.bg] ? o.bg : sc.bg; }
  function paint(ctx, sc, bg, w, h, t, o) {
    ctx.drawImage(bg, 0, 0);
    waves(ctx, w, h, t, BG[bgOf(sc, o)] || BG.sea);
    ctx.save();
    try { sc.draw(ctx, w, h, t, o); } finally { ctx.restore(); }
  }
  /** 창 없이 한 장면을 ctx에 그린다 (도감·시험용). 그림을 아직 못 읽었으면 false */
  EF.render = function (ctx, kind, t, o, w, h) {
    var sc = SCENES[kind], S = SPR(); o = o || {};
    if (!sc || !S || !sc.ids.every(function (id) { return S.ready(id); })) { if (sc && S) S.preload(sc.ids); return false; }
    w = w || ctx.canvas.width; h = h || ctx.canvas.height;
    paint(ctx, sc, backdrop(w, h, bgOf(sc, o)), w, h, t, o);
    return true;
  };

  // ---------------------------------------------------------------- 띄우기
  var cur = null;
  /** kind: whale · dolphin · mermaid · storm · raincloud · shower · sun · beast. o: {bg 배경(지형 이름), animal, pack, title} */
  EF.show = function (kind, o) {
    o = o || {};
    var sc = SCENES[kind], S = SPR(), cf = C();
    if (!sc || !S || cf.events === false) return NOOP;
    if (!sc.ids.every(function (id) { return S.has(id); })) return NOOP;
    S.preload(sc.ids);
    if (cur) cur.stop();
    var root = document.getElementById('ui'); if (!root) return NOOP;
    var w = cf.eventW || 640, h = cf.eventH || 280;
    var box = document.createElement('div');
    box.className = 'eventfx wood brass-frame';
    box.style.cssText = 'left:' + Math.round((1600 - w - 20) / 2) + 'px;top:' + Math.round(900 - (cf.eventBottom || 205) - h - 20) + 'px';
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    box.appendChild(cv);
    var cap = o.title || sc.title;
    if (cap) { var tl = document.createElement('div'); tl.className = 'eventfx-title'; tl.textContent = cap; box.appendChild(tl); }
    root.appendChild(box);
    var bg = backdrop(w, h, bgOf(sc, o)), ctx = cv.getContext('2d');
    var h0 = { alive: true }, t0 = performance.now(), shown = false;
    function frame() {
      if (!h0.alive) return;
      if (!sc.ids.every(function (id) { return S.ready(id); })) { t0 = performance.now(); requestAnimationFrame(frame); return; }
      if (!shown) { shown = true; box.classList.add('on'); }
      try { paint(ctx, sc, bg, w, h, (performance.now() - t0) / 1000, o); } catch (e) { console.warn('[사건 그림]', e); h0.alive = false; return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    h0.stop = function () {
      if (!box.parentNode) return Promise.resolve();
      h0.alive = false; box.classList.remove('on'); if (cur === h0) cur = null;
      return new Promise(function (res) { setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); res(); }, 280); });
    };
    h0.canvas = cv; h0.box = box;
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
  /** 장면에 들어갈 때 그 장면의 사건 그림을 미리 받아 둔다 (사건이 일어난 뒤에 받느라 창이 늦게 뜨지 않게) */
  EF.preload = function (where) {
    var S = SPR(); if (!S || C().events === false) return;
    S.preload(where === 'land' ? ['animals', 'raincloud', 'rain', 'sun'] : ['whale', 'dolphin', 'mermaid', 'storm', 'raincloud', 'rain', 'sun']);
  };
  /** 육상 탐험: 지금 자리의 짐승 떼 [떼, 우두머리] (육상전과 같은 규칙, js/data/landwarart.js) */
  EF.beastsHere = function () {
    var l = (G.Game && G.Game.state && G.Game.state.loc) || {};
    var LA = G.LANDWAR_ART, reg = LA && LA.regions[LA.regionOf(l.lon || 0, l.lat || 0)];
    return reg ? reg.b : ['boar', 'bear'];
  };
})(window.G = window.G || {});
