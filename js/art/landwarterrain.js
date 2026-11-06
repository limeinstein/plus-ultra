/* 육상전의 지역별 개울·언덕·숲. 땅·나무 원화는 저장하고,
   물 표면 전체를 물길 따라 흘리며 나무는 뿌리를 고정한 채 줄기·가지·수관을 휜다. */
(function (G) {
  'use strict';
  var A = G.LandWarTerrain = {}, TAU = Math.PI * 2, grains = {};
  function rnd(n) { var v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function rgb(hex) { return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); }); }
  function rgba(hex, a) { return 'rgba(' + rgb(hex).join(',') + ',' + a + ')'; }
  function oval(c, x, y, w, h, color) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, TAU); c.fill(); }
  function noise(x, y, seed) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    return mix(mix(rnd(ix + iy * 157 + seed), rnd(ix + 1 + iy * 157 + seed), fx),
      mix(rnd(ix + (iy + 1) * 157 + seed), rnd(ix + 1 + (iy + 1) * 157 + seed), fx), fy);
  }
  function foliage(K, P, variant) {
    var key = 'leaf' + P.leaf + P.light + P.dark + variant; if (grains[key]) return grains[key];
    var c = document.createElement('canvas'), N = K.textureSize; c.width = c.height = N;
    var cx = c.getContext('2d'), im = cx.createImageData(N, N), light = rgb(P.light), leaf = rgb(P.leaf), dark = rgb(P.dark);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var dx = x / N * 2 - 1, dy = y / N * 2 - 1, d = Math.sqrt(dx * dx + dy * dy);
      var large = noise(x / 19, y / 19, variant * 31), fine = noise(x / 3, y / 3, 91 + variant * 7);
      var mask = Math.max(0, Math.min(1, (.83 - d + (large - .5) * .65 + (fine - .5) * .24) * 18));
      var value = Math.max(0, Math.min(1, .46 - dx * .20 - dy * .23 + (large - .5) * .6 + (fine - .5) * .7));
      var at = (y * N + x) * 4;
      for (var j = 0; j < 3; j++) im.data[at + j] = value < .55 ? mix(dark[j], leaf[j], value / .55) : mix(leaf[j], light[j], (value - .55) / .45 * .65);
      im.data[at + 3] = mask * 255;
    }
    cx.putImageData(im, 0, 0); return grains[key] = c;
  }
  function currentTexture(K, P) {
    var key = 'flow' + P.water + P.shallow; if (grains[key]) return grains[key];
    var c = document.createElement('canvas'), N = K.textureSize; c.width = N; c.height = N * 4;
    var cx = c.getContext('2d'), im = cx.createImageData(N, N * 2), col = rgb(P.shallow);
    for (var y = 0; y < N * 2; y++) for (var x = 0; x < N; x++) {
      var phase = y / (N * 2) * TAU;
      var n = noise(x / 13 + Math.sin(phase) * 2, Math.cos(phase) * 3 + 9, 73);
      var wave = Math.sin(phase * 12 + x * .19 + n * 5), streak = Math.pow(Math.max(0, wave), 9);
      var fine = noise(x / 3, Math.sin(phase) * 11 + 20, 31), off = (y * N + x) * 4;
      for (var j = 0; j < 3; j++) im.data[off + j] = Math.min(255, col[j] * (.72 + streak * .65 + fine * .22));
      im.data[off + 3] = (streak * .65 + fine * .17) * 255;
    }
    cx.putImageData(im, 0, 0); cx.putImageData(im, 0, N * 2); return grains[key] = c;
  }
  function ribbon(c, pts, grow) {
    c.beginPath();
    pts.forEach(function (p, i) { var x = p.x - p.w / 2 - grow; if (i) c.lineTo(x, p.y); else c.moveTo(x, p.y); });
    for (var i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i].x + pts[i].w / 2 + grow, pts[i].y);
    c.closePath();
  }
  function fade(c, y0, y1, left, width) {
    var g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.14, '#fff');
    g.addColorStop(.84, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalCompositeOperation = 'destination-in'; c.fillStyle = g; c.fillRect(left, y0, width, y1 - y0);
    c.globalCompositeOperation = 'source-over';
  }
  function rock(c, x, y, size, P, seed) {
    oval(c, x + 2, y + 2, size * 1.6, size * .55, 'rgba(20,27,19,.25)');
    var g = c.createLinearGradient(x - size, y - size, x + size, y + size);
    g.addColorStop(0, P.light); g.addColorStop(.35, P.rock); g.addColorStop(1, P.earth);
    c.fillStyle = g; c.beginPath(); c.moveTo(x - size, y);
    c.lineTo(x - size * .7, y - size * .68); c.lineTo(x + size * .1, y - size * (.8 + rnd(seed) * .3));
    c.lineTo(x + size, y - size * .3); c.lineTo(x + size * .85, y + size * .35); c.lineTo(x - size * .4, y + size * .4); c.closePath(); c.fill();
    c.strokeStyle = rgba(P.light, .45); c.lineWidth = .7; c.beginPath(); c.moveTo(x - size * .65, y - size * .6); c.lineTo(x, y - size * .78); c.lineTo(x + size * .6, y - size * .35); c.stroke();
  }
  A.create = function (terr, W, H) {
    var K = G.FX.landwar.terrain, R = K.regions[terr] || K.regions.grass, P = R.colors;
    var layer = null, signature = '', streams = [], trees = [], flowingTexture = null;
    function top(y) { return Math.max(K.groundY, R.groundY, y - K.stream.reachBack); }
    function path(ln, y) {
      var S = K.stream, y0 = top(y), y1 = Math.min(H, Math.max(y + S.reachFront, y0 + S.minReach)), pts = [], phase = ln * 1.7 + .6;
      for (var i = 0; i <= S.segments; i++) {
        var k = i / S.segments, py = mix(y0, y1, k), depth = .45 + .55 * (py - K.groundY) / (H - K.groundY);
        pts.push({x: W / 2 + Math.sin(k * Math.PI * 1.7 + phase) * S.bend * R.bend * depth + (k - .5) * 22,
          y: py, w: mix(S.width[0], S.width[1], depth) * R.width * (.88 + .12 * Math.sin(k * 9 + phase))});
      }
      return pts;
    }
    function at(pts, k) {
      var f = Math.max(0, Math.min(.99999, k)) * (pts.length - 1), i = Math.floor(f), a = pts[i], b = pts[i + 1];
      return {x: mix(a.x, b.x, f - i), y: mix(a.y, b.y, f - i), w: mix(a.w, b.w, f - i)};
    }
    function stream(c, ln, y) {
      var S = K.stream, pts = path(ln, y), y0 = pts[0].y, y1 = pts[pts.length - 1].y;
      // 별도 물길 조각에 끝 흐림을 적용하므로 다른 줄의 언덕·숲을 지우지 않는다.
      var patch = document.createElement('canvas'), scale = K.resolution, bank = S.bank * R.bank;
      var left = W / 2 - S.bend * R.bend - S.width[1] * R.width - bank * 3;
      patch.width = Math.ceil((W / 2 - left) * 2 * scale); patch.height = Math.ceil((y1 - y0) * scale);
      var b = patch.getContext('2d'); b.scale(scale, scale); b.translate(-left, -y0);
      // 물과 둑을 픽셀 재질로 함께 만든다. 가장자리·깊이·작은 굴절이 서로 다른 크기의 난류를 쓴다.
      var surface = document.createElement('canvas'); surface.width = patch.width; surface.height = patch.height;
      var sc = surface.getContext('2d'), im = sc.createImageData(surface.width, surface.height);
      var water = rgb(P.water), shallow = rgb(P.shallow), earth = rgb(P.earth), grass = rgb(P.grass);
      for (var py = 0; py < surface.height; py++) {
        var yy = y0 + py / scale, center = at(pts, py / surface.height);
        for (var px = 0; px < surface.width; px++) {
          var xx = left + px / scale, sd = xx < center.x ? -1 : 1;
          var n = noise(xx / 9, yy / 7, ln + 3), fine = noise(xx / 1.4, yy / 1.2, 97);
          var edge = Math.abs(xx - center.x) - center.w * .5 + (n - .5) * 4;
          var alpha = Math.max(0, Math.min(1, 1 - edge / bank)), col, light = .8 + n * .26 + (fine - .5) * .26;
          if (edge < 0) {
            var depth = Math.min(1, -edge / (center.w * .35)), reflection = Math.pow(Math.max(0, Math.sin(yy * 2.3 + n * 8 + xx * .22)), 8) * .16;
            col = water.map(function (v, j) { return mix(shallow[j], v, depth) + reflection * 110; });
            // 왼쪽 둑의 그림자와 얕은 물에 비치는 모래·자갈.
            if (sd < 0 && edge > -3) light *= .62;
            light += (1 - depth) * (fine - .5) * .5;
          } else {
            var blend = Math.min(1, edge / bank);
            col = earth.map(function (v, j) { return mix(v, grass[j], blend); });
            if (R.snow > .5) col = col.map(function (v, j) { return mix(v, rgb(P.light)[j], R.snow * (.4 + n * .4)); });
            light *= edge < 2 ? .6 : 1;
            alpha *= .7 + n * .3;
          }
          var off = (py * surface.width + px) * 4;
          for (var j = 0; j < 3; j++) im.data[off + j] = Math.min(255, col[j] * light);
          im.data[off + 3] = alpha * 255;
        }
      }
      sc.putImageData(im, 0, 0); b.drawImage(surface, left, y0, patch.width / scale, patch.height / scale);
      // 얕은 물가의 돌도 고정 난수로 배치하고 젖은 아랫면에 그림자를 둔다.
      for (var i = 0; i < S.stones; i++) {
        var k = .13 + rnd(i + ln * 53) * .74, p0 = at(pts, k), side = i % 2 ? -1 : 1;
        rock(b, p0.x + side * (p0.w * .5 + rnd(i + 12) * bank * .65), p0.y, 1.8 + rnd(i + 31) * p0.w * .14, P, i);
      }
      b.save(); fade(b, y0, y1, left, patch.width / scale); b.restore();
      c.drawImage(patch, left, y0, patch.width / scale, patch.height / scale);
      streams.push({pts: pts, lane: ln});
      if (!flowingTexture) flowingTexture = currentTexture(K, P);
    }
    function hill(c, ln, y, side) {
      var x = side === 'me' ? 280 : W - 280, w = K.hill.width, h = K.hill.height * R.hillHeight, seed = ln * 171 + x;
      var base = Math.max(y + 10, R.groundY + 16);
      function ridge(u) {
        var shape = R.hill === 'dune' ? .9 : R.hill === 'scree' || R.hill === 'ice' ? .55 : .7;
        var rough = R.hill === 'scree' || R.hill === 'ice' ? .18 * Math.sin(u * 19 + ln) : .07 * Math.sin(u * 5 + ln);
        return base - h * Math.pow(Math.max(0, 1 - u * u), shape) * (1 + rough);
      }
      var shadow = c.createRadialGradient(x, base + 4, 4, x, base + 4, w);
      shadow.addColorStop(0, 'rgba(29,31,20,.24)'); shadow.addColorStop(1, 'rgba(29,31,20,0)'); oval(c, x + 10, base + 5, w * 1.12, h * .55, shadow);
      c.save(); c.beginPath(); c.moveTo(x - w, base);
      for (var i = 0; i <= 80; i++) { var u = i / 40 - 1; c.lineTo(x + u * w, ridge(u)); }
      c.quadraticCurveTo(x + w * .75, base + 17, x, base + 15); c.quadraticCurveTo(x - w * .75, base + 12, x - w, base); c.closePath(); c.clip();
      // 지면으로 번지는 흙·풀의 재질. 아래·옆은 부드럽게 섞고 능선은 작은 풀 결로 끊는다.
      var surface = document.createElement('canvas'), scale = K.resolution, sy = base - h * 1.3;
      surface.width = w * 2 * scale; surface.height = Math.ceil(h * 2 * scale);
      var sc = surface.getContext('2d'), im = sc.createImageData(surface.width, surface.height);
      var light = rgb(P.light), soil = rgb(P.earth), grass = rgb(P.grass);
      for (var py = 0; py < surface.height; py++) for (var px = 0; px < surface.width; px++) {
        var xx = x - w + px / scale, yy = sy + py / scale, u0 = (xx - x) / w;
        var crest = ridge(u0), down = (yy - crest) / Math.max(1, base + 15 - crest);
        var n = noise(xx / 23, yy / 12, seed), fine = noise(xx / 1.2, yy / 1.2, 43);
        var alpha = Math.max(0, Math.min(1, (yy - crest + (n - .5) * 3) * .5)) * Math.max(0, Math.min(1, (1 - down) * 3));
        alpha *= Math.max(0, Math.min(1, (1 - Math.abs(u0)) * 8));
        var shade = .82 + n * .25 + (fine - .5) * (R.hill === 'dune' ? .12 : R.hill === 'scree' ? .7 : .4), at0 = (py * surface.width + px) * 4;
        if (R.hill === 'dune') shade += Math.sin(xx * .12 + yy * .9 + n) * .035;
        if (R.hill === 'ice') shade += Math.pow(Math.max(0, Math.sin(xx * .08 + yy * .6 + n * 3)), 16) * .24;
        for (var j = 0; j < 3; j++) im.data[at0 + j] = mix(mix(light[j], grass[j], Math.min(1, down * 2.8)), soil[j], Math.max(0, down - .35) * .7) * shade;
        im.data[at0 + 3] = alpha * 255;
      }
      sc.putImageData(im, 0, 0); c.drawImage(surface, x - w, sy, w * 2, surface.height / scale);
      // 비탈의 골은 굴곡을 따라 내려오고 가장자리는 땅에 스며든다.
      for (i = 0; i < 34; i++) {
        var u0 = rnd(seed + i) * 1.9 - .95, xx = x + u0 * w, yy = ridge(u0) + 3 + rnd(i + 73) * 17;
        c.strokeStyle = rgba(i % 3 ? P.dark : P.light, .10); c.lineWidth = .5 + rnd(i + 9) * 2;
        c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + 5, yy + 12, xx + 20 + rnd(i) * 15, base + 9); c.stroke();
      }
      for (i = 0; i < K.hill.tufts * R.tufts; i++) {
        var u1 = rnd(seed + i * 3) * 2 - 1, xx1 = x + u1 * w, yy1 = mix(ridge(u1), base + 12, rnd(i * 7 + seed));
        c.strokeStyle = rgba(i % 4 ? P.light : P.dark, .3); c.lineWidth = .7;
        c.beginPath(); c.moveTo(xx1, yy1); c.lineTo(xx1 - 1.5, yy1 - 2 - rnd(i + 61) * 3); c.stroke();
      }
      c.restore();
      for (i = 0; i < K.hill.stones * R.rocks; i++) {
        var u2 = rnd(seed + i * 17) * 1.8 - .9;
        rock(c, x + u2 * w, base + rnd(i + 90) * 7, 1.2 + rnd(i + 60) * 3.3, P, i);
      }
    }
    function treeSprite(tree) {
      var h = tree.h, seed = tree.seed, kind = tree.kind, scale = K.resolution;
      var canvas = document.createElement('canvas'), size = h * 2, height = h * 1.5;
      canvas.width = Math.ceil(size * scale); canvas.height = Math.ceil(height * scale);
      var c = canvas.getContext('2d'); c.scale(scale, scale); c.translate(h, h * 1.35);
      var trunk = c.createLinearGradient(-3, 0, 4, 0);
      trunk.addColorStop(0, P.rock); trunk.addColorStop(.4, P.earth); trunk.addColorStop(1, P.dark);
      c.strokeStyle = trunk; c.lineCap = 'round'; c.lineWidth = h * .055;
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-h * .04, -h * .3, h * .07, -h * .6, h * .025, -h); c.stroke();
      var pine = kind === 'fir' || kind === 'spruce';
      // 가지도 잎 아래까지 이어 그려 나무 전체와 함께 휘게 한다.
      for (var b = 0; b < 8; b++) {
        var side = b % 2 ? -1 : 1, k = b / 8, by = -h * (.2 + k * .62);
        c.lineWidth = h * (.028 - k * .017); c.beginPath(); c.moveTo(0, by);
        c.quadraticCurveTo(side * h * .15, by - h * .08, side * h * (pine ? .32 * (1 - k) : .2 + rnd(seed + b) * .16), by - h * .18); c.stroke();
      }
      if (kind === 'palm') {
        for (var f = 0; f < 9; f++) {
          var angle = f / 8 * Math.PI + .15, dir = f < 4 ? -1 : 1;
          var endX = Math.cos(angle) * h * .55, endY = -h + Math.sin(angle) * h * .2;
          c.strokeStyle = P.leaf; c.lineWidth = 1.4; c.beginPath(); c.moveTo(h * .025, -h);
          c.quadraticCurveTo(endX * .55, -h * 1.25, endX, endY); c.stroke();
          for (var leaf = 1; leaf < 10; leaf++) {
            var t = leaf / 10, lx = endX * t, ly = -h + (-h * .5 * t * (1 - t)) + (endY + h) * t;
            c.strokeStyle = leaf % 3 ? P.leaf : P.grass; c.lineWidth = 1;
            c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo(lx + dir * 4, ly + h * .07, lx + dir * 2, ly + h * (.12 - t * .06)); c.stroke();
          }
        }
      } else if (kind !== 'bare') {
        var count = kind === 'dwarf' || kind === 'scrub' ? K.woods.foliage * .55 : K.woods.foliage;
        for (var j = 0; j < count; j++) {
          var k = j / count, a = j * 2.4, r = h * (.1 + rnd(seed + j * 7) * .12), fx, fy;
          if (pine) { fy = -h * (.26 + k * .79); fx = Math.sin(a) * h * .36 * (1 - k); r *= .87 - k * .4; }
          else if (kind === 'acacia') { fx = Math.cos(a) * h * .5 * Math.sqrt(k); fy = -h * .82 + Math.sin(a) * h * .09; r *= 1.05; }
          else if (kind === 'dwarf' || kind === 'scrub') { fx = Math.cos(a) * h * .44 * Math.sqrt(k); fy = -h * .52 + Math.sin(a) * h * .3; r *= .8; }
          else { fx = Math.cos(a) * h * .33 * Math.sqrt(k); fy = -h * .76 + Math.sin(a) * h * .25 * Math.sqrt(k); }
          c.drawImage(foliage(K, P, j % 3), fx - r * 1.15, fy - r * .9, r * 2.3, r * 1.8);
          if (R.snow > .4 && j % 3 === 0) {
            var snow = {leaf: P.light, light: '#f4f7f3', dark: P.shallow};
            c.drawImage(foliage(K, snow, j % 3), fx - r, fy - r * .7, r * 1.7, r * .5);
          }
        }
      }
      if (kind === 'tropical') {
        c.strokeStyle = rgba(P.dark, .65); c.lineWidth = .8;
        for (var v = 0; v < 3; v++) { var vx = (rnd(seed + v) - .5) * h * .5; c.beginPath(); c.moveTo(vx, -h * .7); c.bezierCurveTo(vx - 4, -h * .5, vx + 4, -h * .4, vx, -h * .2); c.stroke(); }
      }
      tree.canvas = canvas; tree.left = tree.x - h; tree.top = tree.y - h * 1.35;
      tree.width = size; tree.height = height;
    }
    function woods(c, ln, y) {
      y = Math.max(y, R.groundY + 17);
      [-1, 1].forEach(function (side) {
        var center = side < 0 ? 210 : W - 210, count = Math.max(2, Math.round(K.woods.trees * R.trees));
        for (var i = 0; i < count; i++) {
          var seed = ln * 171 + i * 19 + (side + 1) * 43;
          // 앞뒤 두 줄의 불규칙한 숲 가장자리로 배치한다.
          var kind = R.tree === 'mixed' ? (i % 3 === 0 ? 'fir' : 'oak') : R.tree === 'tropical' && i % 3 === 0 ? 'palm' : R.tree;
          var tree = {x: center - K.woods.spread + (i + .2 + rnd(seed) * .55) / count * K.woods.spread * 2,
            y: y - 17 + (i % 2) * 10 + rnd(seed + 1) * 8,
            h: K.woods.height * R.treeHeight * (.72 + rnd(seed + 2) * .45), seed: seed, kind: kind};
          oval(c, tree.x + 8, tree.y + 2, tree.h * .52, tree.h * .11, rgba(P.dark, .17));
          treeSprite(tree); trees.push(tree);
          for (var g2 = 0; g2 < 7; g2++) {
            c.strokeStyle = rgba(P.grass, .55); c.lineWidth = .8; c.beginPath();
            var gx = tree.x + (rnd(seed + g2) - .5) * tree.h;
            c.moveTo(gx, tree.y + 2); c.lineTo(gx + 2, tree.y - 2 - rnd(g2 + seed + 21) * 5); c.stroke();
          }
        }
      });
      trees.sort(function (a, b) { return a.y - b.y; });
    }
    function wavingTree(c, tree, t) {
      var Kt = K.woods, h = tree.h, seed = tree.seed;
      var wind = Math.sin(t * Kt.windRate + tree.x * .009) * .7 + Math.sin(t * Kt.gustRate + seed * .03) * .3;
      var bend = wind * Kt.sway * R.wind * (h / Kt.height);
      // 뿌리의 변위는 0으로 두고 줄기·가지·잎을 위로 갈수록 크게 휜다.
      var strips = Kt.bendStrips, sh = tree.canvas.height / strips, dh = tree.height / strips;
      for (var n = 0; n < strips; n++) {
        var yy = tree.top + n * dh, reach = Math.max(0, Math.min(1, ((tree.y - yy) / h - .12) / .88));
        var shift = bend * reach * reach + Math.sin(t * Kt.windRate * 1.8 + seed) * reach * reach * .35;
        c.drawImage(tree.canvas, 0, n * sh, tree.canvas.width, Math.min(sh + 1, tree.canvas.height - n * sh),
          tree.left + shift, yy, tree.width, Math.min(dh + 1 / K.resolution, tree.height - n * dh));
      }
    }
    function build(feats, sides, lanes) {
      layer = document.createElement('canvas'); layer.width = W * K.resolution; layer.height = H * K.resolution;
      var c = layer.getContext('2d'); c.scale(K.resolution, K.resolution); streams = []; trees = [];
      feats.forEach(function (f, ln) { if (f === 'stream') stream(c, ln, lanes[ln]); else if (f === 'hill') hill(c, ln, lanes[ln], sides[ln]); else if (f === 'woods') woods(c, ln, lanes[ln]); });
    }
    function flowing(c, s, t) {
      var S = K.stream, pts = s.pts;
      c.save(); c.beginPath(); c.rect(0, Math.max(K.groundY, R.groundY), W, H - Math.max(K.groundY, R.groundY)); c.clip();
      c.save(); ribbon(c, pts, 0); c.clip(); c.lineCap = 'round';
      // 수면 전체의 명암을 물길을 따라 흘려 보내 물 자체가 움직이게 한다.
      var N = K.textureSize, period = N * 2;
      for (var row = 0; row < pts.length - 1; row++) {
        var p0 = pts[row], q0 = pts[row + 1], yy0 = p0.y, dy0 = q0.y - p0.y;
        var age0 = row / (pts.length - 1), edge0 = Math.min(1, age0 * 7, (1 - age0) * 7);
        var sy0 = ((yy0 * 1.3 - t * S.textureSpeed * R.flow) % period + period) % period;
        c.globalAlpha = edge0 * S.textureOpacity;
        c.drawImage(flowingTexture, 0, sy0, N, dy0 * 1.3 + 1, p0.x - p0.w * .5, yy0, p0.w, dy0 + .6);
      }
      c.globalAlpha = 1;
      for (var i = 0; i < S.ripples; i++) {
        var k = (rnd(i * 7 + s.lane * 61) + t * S.flowSpeed * R.flow * (.7 + rnd(i + 19) * .6)) % 1;
        var p = at(pts, k), edge = Math.min(1, k * 7, (1 - k) * 7), off = Math.sin(i * 2.3) * p.w * .36;
        var x = p.x + off, len = 1.2 + rnd(i + 42) * p.w * .18;
        c.strokeStyle = rgba(i % 3 ? P.light : P.dark, edge * (.20 + .28 * Math.pow(.5 + .5 * Math.sin(t * 2.5 + i), 2)));
        c.lineWidth = .6 + rnd(i + 16) * .65;
        var tail = at(pts, Math.max(0, k - .035));
        c.beginPath();
        if (i % 3 === 0) { c.moveTo(tail.x + off, tail.y); c.quadraticCurveTo(x + len, p.y - 2, x, p.y + 2); }
        else { c.moveTo(x - len, p.y); c.quadraticCurveTo(x, p.y - 1.3, x + len, p.y + .4); }
        c.stroke();
      }
      // 돌에 부딪힌 흰 물살과 아래로 퍼지는 작은 잔물결.
      for (i = 0; i < S.foam; i++) {
        var k0 = .2 + rnd(i * 17 + s.lane * 41) * .6, p0 = at(pts, k0), side = i % 2 ? -1 : 1;
        var age = (t * .65 * R.flow + rnd(i + 23)) % 1, yy = p0.y + age * 10;
        c.strokeStyle = rgba(P.light, (1 - age) * .48); c.lineWidth = .8;
        c.beginPath(); c.ellipse(p0.x + side * p0.w * .4, yy, 1.5 + age * 4, .6 + age * 1.2, .2, .1, Math.PI); c.stroke();
      }
      c.restore();
      for (i = 0; i < S.reeds * R.reeds; i++) {
        var p1 = at(pts, .13 + rnd(i * 3 + s.lane * 127) * .72), sd = i % 2 ? -1 : 1;
        var gx = p1.x + sd * (p1.w * .5 + 4 + rnd(i + 72) * S.bank * R.bank), h = 3 + rnd(i + 31) * 10;
        var wind = Math.sin(t * K.woods.windRate + gx * .06) * h * .20 * R.wind;
        c.strokeStyle = rgba(i % 4 ? P.grass : P.light, .8); c.lineWidth = .8;
        c.beginPath(); c.moveTo(gx, p1.y + 2); c.quadraticCurveTo(gx + sd * 2, p1.y - h * .6, gx + sd * 3 + wind, p1.y - h); c.stroke();
        if (i % 5 === 0) { c.strokeStyle = rgba(P.earth, .8); c.lineWidth = 1.7; c.beginPath(); c.moveTo(gx + sd * 3 + wind, p1.y - h); c.lineTo(gx + sd * 3 + wind, p1.y - h - 2.5); c.stroke(); }
      }
      c.restore();
    }
    return {
      top: top,
      draw: function (c, feats, sides, lanes, t) {
        var key = feats.join(',') + sides.join(',') + lanes.join(',');
        if (!layer || key !== signature) { signature = key; build(feats, sides, lanes); }
        c.save(); c.drawImage(layer, 0, 0, W, H);
        streams.forEach(function (s) { flowing(c, s, t); });
        trees.forEach(function (tree) { wavingTree(c, tree, t); });
        c.restore();
      }
    };
  };
})(window.G = window.G || {});
