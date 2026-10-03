/* 발견한 유적을 항해·해도·육상 탐험 지도에 표시하는 투명 미니어처.
   도시 안에서 찾는 발견물은 거리 화면에 있으므로 지도에는 그리지 않는다. */
(function (G) {
  'use strict';
  var DI = {};
  G.DiscoveryIcon = DI;

  var COLS = 4, ROWS = 4, BASE = 42;
  var SHEETS = [
    ['map-discoveries/ruins-1', ['carnac', 'stonehenge', 'mycenae', 'delphi', 'knossos', 'pyramid', 'giza', 'kings', 'thebes', 'abusimbel', 'troy', 'ishtar', 'babel']],
    ['map-discoveries/ruins-2', ['persepolis', 'mohenjo', 'angkor', 'yungang', 'qinshi', 'greatwall', 'qianling', 'muryeong', 'bulguksa', 'seokguram', 'munmu', 'fertile', 'borobudur']],
    ['map-discoveries/ruins-3', ['tula', 'nazca', 'tiwanaku', 'poitiers', 'montstmichel', 'stave', 'rusch', 'prester', 'cappadocia', 'edom', 'ur', 'petra', 'brendan']],
    ['map-discoveries/ruins-4', ['cibola', 'ark', 'tajmahal', 'qutb', 'madurai', 'shwedagon', 'konjiki', 'pueblo', 'machupicchu', 'sacsay', 'moai', 'mu', 'ananda']]
  ];
  var POS = {}, ASKED = {};
  SHEETS.forEach(function (s) { s[1].forEach(function (id, i) { POS[id] = { key: s[0], slot: i }; }); });

  DI.isMapLandmark = function (d) { return !!(d && d.cat === 'ruin' && d.how !== 'city' && POS[d.id]); };
  DI.visible = function () {
    if (!G.DISCOVERIES || !G.Disc) return [];
    return G.DISCOVERIES.filter(function (d) { return DI.isMapLandmark(d) && G.Disc.foundByMe(d.id); });
  };
  DI.count = function () { return Object.keys(POS).length; };
  DI.key = function (d) { var p = d && POS[d.id]; return p ? p.key : null; };

  function request(key) {
    if (!key || ASKED[key] || !G.Img || !G.Img.has(key)) return;
    ASKED[key] = 1; G.Img.load(key);
  }
  DI.preload = function (list) {
    var keys = {}, jobs = [];
    (list || DI.visible()).forEach(function (d) { var p = POS[d.id]; if (p) keys[p.key] = 1; });
    Object.keys(keys).forEach(function (key) {
      if (!G.Img || !G.Img.has(key)) return;
      ASKED[key] = 1; jobs.push(G.Img.load(key));
    });
    return Promise.all(jobs);
  };

  DI.metrics = function (d, scale) {
    scale = scale || 1;
    var p = d && POS[d.id], im = p && G.Img && G.Img.get(p.key), ratio = 1;
    if (im) ratio = (im.naturalHeight || im.height) / (im.naturalWidth || im.width);
    var w = BASE * scale, h = BASE * ratio * scale;
    return { width: w, height: h, radius: Math.max(12, Math.max(w, h) * 0.46), top: -h / 2, base: h / 2 };
  };

  /** 발견물 좌표 (x,y)를 중심으로 투명 스프라이트 한 칸을 그린다. */
  DI.draw = function (ctx, d, x, y, opts) {
    opts = opts || {};
    var p = d && POS[d.id], scale = opts.scale || 1, met = DI.metrics(d, scale);
    if (!p || !G.Img) return met;
    var im = G.Img.get(p.key);
    if (!im) { request(p.key); return met; }
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    var col = p.slot % COLS, row = Math.floor(p.slot / COLS), sw = iw / COLS, sh = ih / ROWS;
    var dw = BASE * scale, dh = dw * sh / sw;
    met = { width: dw, height: dh, radius: Math.max(12, Math.max(dw, dh) * 0.46), top: -dh / 2, base: dh / 2 };
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(im, col * sw + 0.5, row * sh + 0.5, sw - 1, sh - 1, x - dw / 2, y - dh / 2, dw, dh);
    if (opts.selected) {
      ctx.strokeStyle = 'rgba(242,215,145,.9)'; ctx.lineWidth = Math.max(1.2, 1.7 * scale); ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.ellipse(x, y + dh * 0.28, dw * 0.42, Math.max(4, dh * 0.13), 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
    return met;
  };

  DI.at = function (list, toScreen, x, y, scale) {
    var best = null, bd = Infinity;
    (list || DI.visible()).forEach(function (d) {
      var p = toScreen(d.lon, d.lat), hit = Math.max(14, DI.metrics(d, scale).radius + 3);
      var dd = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y);
      if (dd <= hit * hit && dd < bd) { best = d; bd = dd; }
    });
    return best;
  };
})(window.G = window.G || {});
