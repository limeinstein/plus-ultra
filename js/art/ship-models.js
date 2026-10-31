/* build_runtime.py 생성물. 수정 원본: tools/ship3d/의 모델·재질·미술·모션 파일. */
(function(G){'use strict';var window={};
/* 배 3D 렌더러의 재질 그림(캔버스로 그리는 판재·돛천·지붕). 같은 씨앗이면 늘 같은 그림이 나온다.
   tools/ship3d/bake.py → render.js → page.html 이 불러 쓴다. 게임 실행에는 쓰지 않는다. */
(function (root) {
  'use strict';
  var X = root.Ship3DTex = {};

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  X.rng = rng;
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function css(c, k, a) {
    k = k == null ? 1 : k;
    var r = Math.max(0, Math.min(255, Math.round(c[0] * k))), g = Math.max(0, Math.min(255, Math.round(c[1] * k))), b = Math.max(0, Math.min(255, Math.round(c[2] * k)));
    return a == null ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  X.hex = hex; X.css = css;
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* 판재: 가로로 긴 널빤지 줄. rows 줄, 이음매·나뭇결·나무못. clinker면 겹친 판(아래 가장자리 그늘) */
  X.planks = function (opt) {
    var W = opt.w || 512, H = opt.h || 512, rows = opt.rows || 16, base = hex(opt.color), seam = hex(opt.seam || '#1b0f07');
    var r = rng(opt.seed || 7), c = canvas(W, H), g = c.getContext('2d'), rh = H / rows;
    for (var i = 0; i < rows; i++) {
      var y0 = i * rh, x = -r() * 200;
      while (x < W) {
        var len = (opt.minLen || 150) + r() * (opt.varLen || 180), k = 0.86 + r() * 0.26;
        g.fillStyle = css(base, k); g.fillRect(x, y0, len, rh);
        // 나뭇결
        for (var s = 0; s < 7; s++) {
          var gy = y0 + 2 + r() * (rh - 4);
          g.strokeStyle = css(base, r() < 0.5 ? 0.72 : 1.22, 0.10 + r() * 0.12); g.lineWidth = 0.6 + r() * 1.1;
          g.beginPath(); g.moveTo(x, gy);
          g.bezierCurveTo(x + len * 0.3, gy + (r() - 0.5) * 3, x + len * 0.7, gy + (r() - 0.5) * 3, x + len, gy + (r() - 0.5) * 2); g.stroke();
        }
        // 맞댄 이음과 나무못
        g.fillStyle = css(seam, 1, 0.75); g.fillRect(x, y0, 2.2, rh);
        if (opt.nails !== false) {
          g.fillStyle = css(seam, 1.4, 0.55);
          g.beginPath(); g.arc(x + 6, y0 + rh * 0.3, 1.4, 0, 6.3); g.arc(x + 6, y0 + rh * 0.7, 1.4, 0, 6.3); g.fill();
        }
        x += len;
      }
      // 줄 사이 틈과 빛 받는 모서리
      g.fillStyle = css(seam, 1, opt.seamA || 0.85); g.fillRect(0, y0, W, opt.seamW || 2.4);
      g.fillStyle = css(base, 1.35, 0.28); g.fillRect(0, y0 + (opt.seamW || 2.4), W, 1.4);
      if (opt.clinker) { var gr = g.createLinearGradient(0, y0 + rh * 0.55, 0, y0 + rh); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,5,2,0.38)'); g.fillStyle = gr; g.fillRect(0, y0 + rh * 0.55, W, rh * 0.45); }
    }
    return c;
  };

  /* 돛천: 세로 솔기(천 폭), 가장자리 볼트로프, 아래쪽 약한 때. kind: sq | lat | bat | jp | mat */
  X.sail = function (opt) {
    var W = 256, H = 256, base = hex(opt.color || '#f1e3bf'), r = rng(opt.seed || 11), c = canvas(W, H), g = c.getContext('2d');
    g.fillStyle = css(base); g.fillRect(0, 0, W, H);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, css(base, 1.03, 0.0)); gr.addColorStop(0.75, css(base, 0.96, 0.25)); gr.addColorStop(1, css(base, 0.84, 0.55));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // 천의 결(아주 옅은 잡티)
    for (var n = 0; n < 900; n++) { g.fillStyle = css(base, r() < 0.5 ? 0.9 : 1.06, 0.12); g.fillRect(r() * W, r() * H, 1 + r() * 2, 1); }
    var kind = opt.kind || 'sq', cloths = opt.cloths || 9;
    if (kind === 'bat' || kind === 'mat') {
      // 대나무 살 사이 천: 살 줄 아래쪽이 조금 어둡다(부풀어 그늘)
      var bands = opt.bands || 6;
      for (var b = 0; b < bands; b++) {
        var y0 = b * H / bands, y1 = (b + 1) * H / bands, bg = g.createLinearGradient(0, y0, 0, y1);
        bg.addColorStop(0, css(base, 0.80, 0.55)); bg.addColorStop(0.25, css(base, 1.04, 0.0)); bg.addColorStop(0.8, css(base, 0.97, 0.10)); bg.addColorStop(1, css(base, 0.78, 0.45));
        g.fillStyle = bg; g.fillRect(0, y0, W, y1 - y0);
      }
      if (kind === 'mat') {   // 거적·대자리 돛: 엮은 결
        for (var yy = 0; yy < H; yy += 4) { g.fillStyle = css(base, 0.86, 0.22); g.fillRect(0, yy, W, 1); }
        for (var xx = 0; xx < W; xx += 6) { g.fillStyle = css(base, 0.9, 0.12); g.fillRect(xx, 0, 1, H); }
      }
      cloths = kind === 'mat' ? 0 : 6;
    }
    for (var i = 1; i < cloths; i++) {
      var x = i * W / cloths;
      g.fillStyle = css(base, 0.78, kind === 'jp' ? 0.75 : 0.42); g.fillRect(x - (kind === 'jp' ? 1.6 : 0.8), 0, kind === 'jp' ? 3.2 : 1.6, H);
      g.fillStyle = css(base, 1.08, 0.5); g.fillRect(x + 1, 0, 1, H);
    }
    if (kind === 'sq') {   // 리프 줄(돛 접는 끈 줄)
      for (var rf = 1; rf <= 2; rf++) { var ry = rf * H * 0.16; g.fillStyle = css(base, 0.8, 0.3); g.fillRect(0, ry, W, 1.2); for (var p = 4; p < W; p += 12) { g.fillStyle = css(base, 0.62, 0.5); g.fillRect(p, ry - 1.5, 1.2, 4); } }
    }
    // 볼트로프(가장자리)
    g.strokeStyle = css(base, 0.66, 0.7); g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
    return c;
  };

  /* 기와 지붕 */
  X.roof = function (opt) {
    var W = 256, H = 256, base = hex(opt.color || '#46474c'), r = rng(opt.seed || 23), c = canvas(W, H), g = c.getContext('2d');
    g.fillStyle = css(base); g.fillRect(0, 0, W, H);
    var cols = opt.cols || 16;
    for (var i = 0; i < cols; i++) {
      var x0 = i * W / cols, w = W / cols, gr = g.createLinearGradient(x0, 0, x0 + w, 0);
      gr.addColorStop(0, css(base, 0.62)); gr.addColorStop(0.45, css(base, 1.22)); gr.addColorStop(1, css(base, 0.72));
      g.fillStyle = gr; g.fillRect(x0, 0, w, H);
    }
    for (var y = 0; y < H; y += 16) { g.fillStyle = css(base, 0.55, 0.6); g.fillRect(0, y, W, 2); }
    for (var n = 0; n < 300; n++) { g.fillStyle = css(base, r() < 0.5 ? 0.8 : 1.2, 0.15); g.fillRect(r() * W, r() * H, 2, 2); }
    return c;
  };

  /* 초가·야자잎 지붕 */
  X.thatch = function (opt) {
    var W = 256, H = 256, base = hex(opt.color || '#b48a4a'), r = rng(opt.seed || 29), c = canvas(W, H), g = c.getContext('2d');
    g.fillStyle = css(base); g.fillRect(0, 0, W, H);
    for (var n = 0; n < 1600; n++) { var x = r() * W, y = r() * H; g.strokeStyle = css(base, 0.7 + r() * 0.6, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y + 6 + r() * 8); g.stroke(); }
    for (var yy = 0; yy < H; yy += 32) { g.fillStyle = css(base, 0.6, 0.45); g.fillRect(0, yy, W, 3); }
    return c;
  };

  /* 거북선 지붕: 육각 철판과 이음 */
  X.plates = function (opt) {
    var W = 256, H = 256, base = hex(opt.color || '#5a5a4c'), c = canvas(W, H), g = c.getContext('2d'), r = rng(opt.seed || 31);
    g.fillStyle = css(base, 0.62); g.fillRect(0, 0, W, H);
    var s = 16, h = s * Math.sqrt(3);
    for (var row = -1; row < H / h + 2; row++) {
      for (var col = -1; col < W / (s * 1.5) + 2; col++) {
        var cx = col * s * 1.5, cy = row * h + ((col & 1) ? h / 2 : 0);
        g.beginPath();
        for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * (s - 1.5), cy + Math.sin(a) * (s - 1.5)); }
        g.closePath(); g.fillStyle = css(base, 0.9 + r() * 0.25); g.fill();
        g.strokeStyle = css(base, 1.35, 0.35); g.lineWidth = 1; g.stroke();
      }
    }
    return c;
  };

  /* 판벽(세로 널): 안택선·판옥선 방패벽 */
  X.wall = function (opt) {
    var W = 256, H = 128, base = hex(opt.color || '#4a3221'), c = canvas(W, H), g = c.getContext('2d'), r = rng(opt.seed || 37), n = opt.boards || 24;
    for (var i = 0; i < n; i++) { g.fillStyle = css(base, 0.85 + r() * 0.28); g.fillRect(i * W / n, 0, W / n, H); g.fillStyle = css(base, 0.45, 0.8); g.fillRect(i * W / n, 0, 1.6, H); }
    g.fillStyle = css(base, 0.4); g.fillRect(0, 0, W, 6); g.fillRect(0, H - 6, W, 6); g.fillRect(0, H * 0.5 - 2, W, 4);
    if (opt.holes) for (var j = 0; j < opt.holes; j++) { var x = (j + 0.5) * W / opt.holes; g.fillStyle = '#120c08'; g.fillRect(x - 4, H * 0.24, 8, 10); }
    return c;
  };
})(window);

/* 배 36종의 3D 모형. three.js(r147, 전역 THREE)로 선체·선루·돛대·돛·노·물결을 짓는다.
   좌표: x 앞(뱃머리 +), y 위, z 우현(+)·좌현(−). 1단위 = 시트의 1px(224px 칸).
   치수(L·W·H·돛대 자리·높이)는 tools/render_ship_sprites.py의 dims()·mast_positions()·mast_heights()를 그대로 받아
   게임의 배 크기(baseLen)·깃발 자리와 맞춘다. 재질은 docs/art/ship-galleon-upgrade-reference.png(Codex 갤리온 기준 시안):
   짙은 월넛 외판, 황동 테, 꿀빛 갑판, 아이보리 돛. */
(function (root) {
  'use strict';
  var M = root.Ship3D = {};
  var TX = root.Ship3DTex;
  var T;                         // THREE
  var PI = Math.PI;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ───────────────────────────────── 선체 평면형
  // bow/stern: 수면 끝(L 비율) · half: 최대 반폭(W 비율) · bowHalf/sternHalf: 끝 반폭(사각 선수·선미판)
  // uf/ua: 평행 중앙부의 앞·뒤 끝(길이 비율 0~1) · pb,cb / ps,cs: 선수·선미 곡률 · sB/sS: 현호(H 비율)
  // w0·tm·wTop: 단면(수면 폭·최대폭 높이·뱃전 폭 — 1보다 작으면 텀블홈) · rakeB/rakeS: 높이 1당 앞·뒤로 기우는 양
  var FORMS = {
    needle: { bow: .53, stern: -.50, half: .50, bowHalf: 0, sternHalf: .20, uf: .70, ua: .22, pb: 1.5, cb: .9, ps: 2.0, cs: .6, sB: .45, sS: .70, w0: .90, tm: .55, wTop: .99, rakeB: .55, rakeS: .45 },
    canoe:  { bow: .50, stern: -.50, half: .50, bowHalf: 0, sternHalf: 0, uf: .66, ua: .34, pb: 1.6, cb: .9, ps: 1.6, cs: .9, sB: 1.6, sS: 1.6, w0: .86, tm: .6, wTop: 1.0, rakeB: 1.9, rakeS: 1.9 },
    fine:   { bow: .52, stern: -.47, half: .49, bowHalf: 0, sternHalf: .29, uf: .62, ua: .28, pb: 1.7, cb: .75, ps: 2.2, cs: .55, sB: .34, sS: .28, w0: .82, tm: .45, wTop: .86, rakeB: .62, rakeS: .14 },
    bluff:  { bow: .46, stern: -.46, half: .55, bowHalf: 0, sternHalf: .36, uf: .56, ua: .38, pb: 2.2, cb: .55, ps: 2.4, cs: .45, sB: .30, sS: .22, w0: .84, tm: .45, wTop: .92, rakeB: .75, rakeS: .35 },
    round:  { bow: .48, stern: -.47, half: .56, bowHalf: 0, sternHalf: .34, uf: .56, ua: .32, pb: 2.0, cb: .62, ps: 2.4, cs: .5, sB: .26, sS: .20, w0: .82, tm: .42, wTop: .82, rakeB: .62, rakeS: .16 },
    pear:   { bow: .50, stern: -.46, half: .57, bowHalf: 0, sternHalf: .30, uf: .50, ua: .30, pb: 2.0, cb: .6, ps: 2.0, cs: .6, sB: .22, sS: .26, w0: .86, tm: .36, wTop: .68, rakeB: .62, rakeS: .2 },
    dhow:   { bow: .48, stern: -.47, half: .50, bowHalf: 0, sternHalf: .28, uf: .60, ua: .26, pb: 1.6, cb: .8, ps: 2.2, cs: .55, sB: .60, sS: .38, w0: .86, tm: .5, wTop: .95, rakeB: 1.6, rakeS: .25 },
    jong:   { bow: .48, stern: -.49, half: .50, bowHalf: 0, sternHalf: .10, uf: .62, ua: .32, pb: 1.7, cb: .75, ps: 1.8, cs: .7, sB: .55, sS: .75, w0: .86, tm: .5, wTop: .97, rakeB: 1.15, rakeS: .95 },
    junk:   { bow: .49, stern: -.47, half: .50, bowHalf: .22, sternHalf: .42, uf: .62, ua: .24, pb: 1.8, cb: .6, ps: 3.0, cs: .4, sB: .40, sS: .80, w0: .84, tm: .6, wTop: 1.03, rakeB: .95, rakeS: .7 },
    sand:   { bow: .50, stern: -.48, half: .50, bowHalf: .30, sternHalf: .40, uf: .70, ua: .22, pb: 2.2, cb: .5, ps: 3.0, cs: .4, sB: .28, sS: .38, w0: .92, tm: .4, wTop: 1.0, rakeB: .85, rakeS: .45 },
    box:    { bow: .49, stern: -.47, half: .50, bowHalf: .26, sternHalf: .40, uf: .64, ua: .24, pb: 2.0, cb: .55, ps: 3.0, cs: .4, sB: .32, sS: .42, w0: .90, tm: .45, wTop: 1.0, rakeB: .65, rakeS: .35 },
    open:   { bow: .52, stern: -.47, half: .49, bowHalf: 0, sternHalf: .26, uf: .60, ua: .28, pb: 1.8, cb: .7, ps: 2.2, cs: .55, sB: .42, sS: .32, w0: .86, tm: .5, wTop: .95, rakeB: .62, rakeS: .22 }
  };

  // 문화권·선체별 목재 색 [그늘, 외판, 갑판] — render_ship_sprites.py의 PALETTES와 같은 계열
  var PAL = {
    west: ['#2a160b', '#5c3119', '#a2723f'], galley: ['#2e140b', '#64301a', '#a66d3a'], dhow: ['#33200f', '#744825', '#b4854b'],
    jong: ['#2c170d', '#5f321b', '#a06a3a'], outrigger: ['#3a2111', '#7b4e2a', '#b48a52'], junk: ['#2a150c', '#5a2e1a', '#9a6237'],
    kr: ['#33220f', '#6b4a2b', '#a27a4c'], panok: ['#2e1f14', '#634329', '#9c7146'], turtle: ['#28241b', '#544c37', '#8c7a50'],
    jp: ['#241a12', '#4d3826', '#8c6c4a'], atake: ['#1f1610', '#43301f', '#7d5c3e'], raft: ['#46301a', '#8c6334', '#b88d53']
  };
  var IVORY = '#f2e4c1', TAN = '#d2b986', MAT_TAN = '#b79a6a', BRASS = 0xc89038;

  // ───────────────────────────────── 재질(한 번 만들어 계속 쓴다)
  var MAT = {}, TEXC = {};
  function tex(key, fn, rx, ry) {
    var k = key + '|' + rx + '|' + ry;
    if (TEXC[k]) return TEXC[k];
    var c = fn(), t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    if (rx) t.repeat.set(rx, ry || rx);
    return (TEXC[k] = t);
  }
  function std(key, o) {
    if (MAT[key]) return MAT[key];
    var m = new T.MeshStandardMaterial(Object.assign({ roughness: 0.78, metalness: 0, side: T.DoubleSide }, o));
    return (MAT[key] = m);
  }
  function phong(key, o) {
    if (MAT[key]) return MAT[key];
    return (MAT[key] = new T.MeshPhongMaterial(Object.assign({ side: T.DoubleSide }, o)));
  }
  function mats(hullType, clinker) {
    var p = PAL[hullType] || PAL.west, key = hullType + (clinker ? 'C' : '');
    return {
      hull: std('hull' + key, { map: tex('hull' + key, function () { return TX.planks({ color: p[1], seam: p[0], rows: 16, seed: 3 + key.length, clinker: clinker, seamW: clinker ? 3.2 : 2.4 }); }) }),
      deck: std('deck' + key, { map: tex('deck' + key, function () { return TX.planks({ color: p[2], seam: p[0], rows: 14, seed: 5, minLen: 220, varLen: 200, seamA: 0.55, seamW: 1.6 }); }), roughness: 0.86 }),
      inner: std('inner' + key, { map: tex('inner' + key, function () { return TX.planks({ color: mix(p[1], p[2], 0.55), seam: p[0], rows: 16, seed: 9, nails: false, seamA: 0.6 }); }) }),
      dark: std('dark' + key, { color: new T.Color(p[0]).convertSRGBToLinear(), roughness: 0.7 }),
      mid: std('mid' + key, { color: new T.Color(p[1]).convertSRGBToLinear(), roughness: 0.72 }),
      deckc: std('deckc' + key, { color: new T.Color(p[2]).convertSRGBToLinear(), roughness: 0.8 }),
      pal: p
    };
  }
  function mix(a, b, t) {
    var A = TX.hex(a), B = TX.hex(b), o = '#';
    for (var i = 0; i < 3; i++) { var v = Math.round(lerp(A[i], B[i], t)); o += (v < 16 ? '0' : '') + v.toString(16); }
    return o;
  }
  function common() {
    return {
      brass: phong('brass', { color: new T.Color(BRASS).convertSRGBToLinear(), specular: 0xffe6a8, shininess: 46, emissive: new T.Color(0x3a2408).convertSRGBToLinear() }),
      brassHi: phong('brassHi', { color: new T.Color(0xf0c46c).convertSRGBToLinear(), specular: 0xfff2c8, shininess: 60, emissive: new T.Color(0x4a3010).convertSRGBToLinear() }),
      iron: phong('iron', { color: new T.Color(0x26262a).convertSRGBToLinear(), specular: 0x777777, shininess: 30 }),
      glass: phong('glass', { color: new T.Color(0x1a2330).convertSRGBToLinear(), specular: 0x9fb8d0, shininess: 80, emissive: new T.Color(0x0a0f18).convertSRGBToLinear() }),
      hole: std('hole', { color: 0x070403, roughness: 1 }),
      mast: std('mast', { color: new T.Color('#4a2a15').convertSRGBToLinear(), roughness: 0.6 }),
      spar: std('spar', { color: new T.Color('#3d2212').convertSRGBToLinear(), roughness: 0.62 }),
      rope: std('rope', { color: new T.Color('#3b2a18').convertSRGBToLinear(), roughness: 0.9 }),
      oar: std('oar', { color: new T.Color('#b98a52').convertSRGBToLinear(), roughness: 0.75 }),
      bamboo: std('bamboo', { color: new T.Color('#b39a5c').convertSRGBToLinear(), roughness: 0.7 }),
      batten: std('batten', { color: new T.Color('#5a3a1e').convertSRGBToLinear(), roughness: 0.7 }),
      red: std('red', { color: new T.Color('#7e2a1c').convertSRGBToLinear(), roughness: 0.65 }),
      white: std('white', { color: new T.Color('#e9e1cf').convertSRGBToLinear(), roughness: 0.85 }),
      roof: std('roof', { map: tex('roof', function () { return TX.roof({}); }), roughness: 0.7 }),
      thatch: std('thatch', { map: tex('thatch', function () { return TX.thatch({}); }), roughness: 0.95 }),
      plates: std('plates', { map: tex('plates', function () { return TX.plates({ color: '#55574a' }); }, 2, 1.2), roughness: 0.5, metalness: 0.2 }),
      wallJ: std('wallJ', { map: tex('wallJ', function () { return TX.wall({ color: '#3e2a1b', holes: 6 }); }), roughness: 0.8 }),
      wallK: std('wallK', { map: tex('wallK', function () { return TX.wall({ color: '#5a3d24', holes: 5, seed: 41 }); }), roughness: 0.8 }),
      spike: phong('spike', { color: new T.Color(0x8a8a86).convertSRGBToLinear(), specular: 0xdddddd, shininess: 50 }),
      log: std('log', { color: new T.Color('#9b7342').convertSRGBToLinear(), roughness: 0.85 }),
      foam: new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide })
    };
  }
  function sailMat(kind, color) {
    var key = 'sail' + kind + color;
    if (MAT[key]) return MAT[key];
    var t = tex(key, function () { return TX.sail({ kind: kind, color: color, cloths: kind === 'jp' ? 7 : kind === 'lat' ? 10 : 9, bands: 6 }); });
    return (MAT[key] = new T.MeshStandardMaterial({ map: t, roughness: 0.92, metalness: 0, side: T.DoubleSide, emissive: new T.Color(0x14100a).convertSRGBToLinear() }));
  }

  // ───────────────────────────────── 기하 도우미
  function geo(pos, uv, idx) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    if (uv) g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  /* (ni+1)×(nj+1) 격자. fn(i,j) → [x,y,z,u,v]. flip이면 면 방향을 뒤집는다 */
  function grid(ni, nj, fn, flip) {
    var pos = [], uv = [], idx = [];
    for (var j = 0; j <= nj; j++) for (var i = 0; i <= ni; i++) { var p = fn(i, j); pos.push(p[0], p[1], p[2]); uv.push(p[3], p[4]); }
    var w = ni + 1;
    for (var jj = 0; jj < nj; jj++) for (var ii = 0; ii < ni; ii++) {
      var a = jj * w + ii, b = a + 1, c = a + w, d = c + 1;
      if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    return geo(pos, uv, idx);
  }
  function mesh(g, m, shadow) { var o = new T.Mesh(g, m); o.castShadow = shadow !== false; o.receiveShadow = true; return o; }
  /* 두 점을 잇는 원기둥(돛대·활대·밧줄·노) */
  var UP = null;
  function rod(a, b, r0, r1, m, seg) {
    var A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), len = d.length();
    var g = new T.CylinderGeometry(r1 == null ? r0 : r1, r0, len, seg || 8, 1, false);
    var o = new T.Mesh(g, m); o.castShadow = true; o.receiveShadow = true;
    o.position.copy(A).addScaledVector(d, 0.5);
    if (!UP) UP = new T.Vector3(0, 1, 0);
    o.quaternion.setFromUnitVectors(UP, d.normalize());
    return o;
  }
  function box(w, h, d, m, x, y, z) { var o = mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; }

  // ───────────────────────────────── 선체
  function Hull(s) {
    var q = s.p, f = FORMS[q.form] || FORMS.open;
    this.s = s; this.q = q; this.f = f;
    this.L = s.L; this.W = s.W;
    var hk = s.hull === 'west' ? 1.18 : s.hull === 'galley' ? 1.12 : 1.1;
    this.H = s.H * hk;
    this.B = f.half * s.W;
    this.xb0 = f.bow * s.L; this.xs0 = f.stern * s.L;
    // 이물이 셀 밖으로 나가지 않게 기울기를 줄인다(뱃전 높이에서 L의 0.60 안)
    var top = this.H * (1 + f.sB);
    this.rB = Math.min(f.rakeB, Math.max(0, (0.60 * s.L - this.xb0) / top));
    this.rS = Math.min(f.rakeS, Math.max(0, (-0.55 * s.L - this.xs0) / -(this.H * (1 + f.sS))));
    this.bul = clamp(this.H * 0.17, 1.0, 3.4);       // 뱃전 판 높이
    this.th = clamp(this.W * 0.035, 0.7, 1.6);        // 판 두께
  }
  Hull.prototype.ends = function (y) { return [this.xs0 - this.rS * y, this.xb0 + this.rB * y]; };
  Hull.prototype.X = function (u, y) { var e = this.ends(y); return lerp(e[0], e[1], u); };
  Hull.prototype.U = function (x, y) { var e = this.ends(y); return clamp((x - e[0]) / (e[1] - e[0]), 0, 1); };
  Hull.prototype.sheer = function (u) {
    var f = this.f, kb = clamp((u - 0.62) / 0.38, 0, 1), ks = clamp((0.36 - u) / 0.36, 0, 1);
    return this.H * (1 + f.sB * kb * kb + f.sS * ks * ks);
  };
  Hull.prototype.plan = function (u) {
    var f = this.f, B = this.B, W = this.W, b;
    if (u >= f.uf) { var t = (u - f.uf) / (1 - f.uf); b = f.bowHalf * W + (B - f.bowHalf * W) * Math.pow(Math.max(0, 1 - Math.pow(t, f.pb)), f.cb); }
    else if (u <= f.ua) { var t2 = (f.ua - u) / f.ua; b = f.sternHalf * W + (B - f.sternHalf * W) * Math.pow(Math.max(0, 1 - Math.pow(t2, f.ps)), f.cs); }
    else b = B;
    return b;
  };
  Hull.prototype.g = function (tau) {
    var f = this.f;
    if (tau <= f.tm) return f.w0 + (1 - f.w0) * Math.sin(PI / 2 * tau / f.tm);
    if (tau <= 1) { var k = (tau - f.tm) / (1 - f.tm); return 1 + (f.wTop - 1) * (1 - Math.cos(PI * k)) / 2; }
    return f.wTop + (f.wTop - 1) * 0.35 * (tau - 1);
  };
  Hull.prototype.half = function (u, y) { return this.plan(u) * this.g(y / this.H); };
  Hull.prototype.deckY = function (u) { return this.sheer(u) - this.bul; };
  Hull.prototype.us = function (n) {   // 끝으로 갈수록 촘촘한 길이 방향 자리
    var o = []; for (var i = 0; i <= n; i++) { var t = i / n; o.push(0.5 - 0.5 * Math.cos(PI * t)); } return o;
  };

  /* 선체 껍질: 바깥 옆면(수면~뱃전), 선미·선수판, 갑판, 안쪽 뱃전, 난간 덮개.
     같은 함수로 선루(성루)도 짓는다: uA~uB 구간, 아래 y0(u)·위 y1(u), 폭 배수 inset */
  function shell(h, grp, M, o) {
    var uA = o.uA, uB = o.uB, y0 = o.y0, y1 = o.y1, inset = o.inset || 1, n = o.n || 40, nj = o.nj || 8;
    var us = []; for (var i = 0; i <= n; i++) { var t = i / n; us.push(lerp(uA, uB, o.even ? t : 0.5 - 0.5 * Math.cos(PI * t))); }
    var bul = o.bul == null ? h.bul : o.bul, th = h.th;
    function hw(u, y) { return Math.max(0, h.half(u, y) * inset); }
    [1, -1].forEach(function (side) {
      grp.add(mesh(grid(n, nj, function (i, j) {
        var u = us[i], ya = y0(u), yb = y1(u), y = lerp(ya, yb, j / nj), x = h.X(u, y);
        return [x, y, side * hw(u, y), x / 80, y / 25.6];
      }, side < 0), o.side || M.hull));
      if (o.top !== false) {
        // 안쪽 뱃전 벽
        grp.add(mesh(grid(n, 1, function (i, j) {
          var u = us[i], yt = y1(u), y = j ? yt : yt - bul, x = h.X(u, yt);
          return [x, y, side * Math.max(0, hw(u, yt) - th), x / 80, y / 25.6];
        }, side > 0), M.inner));
        // 난간 덮개
        grp.add(mesh(grid(n, 1, function (i, j) {
          var u = us[i], yt = y1(u), x = h.X(u, yt), w = hw(u, yt);
          return [x, yt, side * (j ? w + 0.1 : Math.max(0, w - th)), x / 40, j];
        }, side > 0), o.rail || M.dark));
      }
    });
    if (o.top !== false) {
      // 갑판
      grp.add(mesh(grid(n, 1, function (i, j) {
        var u = us[i], yt = y1(u), y = yt - bul, x = h.X(u, yt), w = Math.max(0, hw(u, yt) - th);
        return [x, y, j ? w : -w, x / 80, (j ? w : -w) / 25.6];
      }), o.deck || M.deck));
    }
    // 끝판(선미판·사각 선수판·선루 앞벽)
    function endWall(u, faceFwd, yA, yB, m, inner) {
      var nk = 6;
      grp.add(mesh(grid(nk, 4, function (i, j) {
        var y = lerp(yA, yB, j / 4), x = h.X(u, y) + (inner ? (faceFwd ? -0.01 : 0.01) : 0), w = hw(u, y) - (inner ? th : 0);
        var z = lerp(-w, w, i / nk);
        return [x, y, z, z / 25.6, y / 25.6];
      }, faceFwd), m || M.hull));
    }
    var hasBack = o.backWall != null ? o.backWall : (h.plan(uA) > 0.4);
    var hasFront = o.frontWall != null ? o.frontWall : (h.plan(uB) > 0.4);
    if (hasBack) endWall(uA, false, y0(uA), y1(uA), o.backMat);
    if (hasFront) endWall(uB, true, y0(uB), y1(uB), o.frontMat);
    return us;
  }

  /* 띠(외판의 굵은 띠·황동 테): 높이 y(u)를 따라 바깥에 덧댄 띠 */
  function band(h, grp, m, uA, uB, yf, hh, out, inset) {
    var n = 36;
    [1, -1].forEach(function (side) {
      grp.add(mesh(grid(n, 1, function (i, j) {
        var u = lerp(uA, uB, i / n), yc = yf(u), y = yc + (j ? hh : -hh), x = h.X(u, yc);
        return [x, y, side * (h.half(u, yc) * (inset || 1) + out), x / 40, j];
      }, side < 0), m, false));
    });
  }

  /* 창(황동 테·어두운 유리) — 법선 nx,nz 쪽을 바라본다 */
  function windowAt(grp, C, x, y, z, w, hgt, rotY) {
    var g = new T.Group();
    g.add(box(w + 0.9, hgt + 0.9, 0.35, C.brass, 0, 0, 0));
    g.add(box(w, hgt, 0.5, C.glass, 0, 0, 0.12));
    g.position.set(x, y, z); g.rotation.y = rotY; grp.add(g);
  }
  /* 포문과 포신 */
  function gunPort(grp, C, h, u, side, size) {
    var y = h.sheer(u) * 0.5, x = h.X(u, y), z = side * (h.half(u, y) + 0.1);
    var g = new T.Group();
    g.add(box(size * 1.35, size * 1.25, 0.4, C.brass, 0, 0, 0));
    g.add(box(size, size * 0.9, 0.55, C.hole, 0, 0, 0.08));
    var barrel = rod([0, 0, 0], [0, 0, size * 1.1], size * 0.26, size * 0.22, C.iron, 7);
    g.add(barrel);
    g.position.set(x, y, z); if (side < 0) g.rotation.y = PI; grp.add(g);
  }

  // ───────────────────────────────── 배 한 척
  function Ship(s) {
    this.s = s; this.q = s.p; this.h = new Hull(s);
    this.M = mats(s.hull, !!this.q.clinker); this.C = common();
    this.big = s.cap >= 250;
  }
  M.Ship = Ship;

  Ship.prototype.buildHull = function () {
    var s = this.s, q = this.q, h = this.h, M = this.M, C = this.C, grp = new T.Group(), self = this;
    if (s.hull === 'raft') return this.buildRaft(grp);
    shell(h, grp, M, { uA: 0, uB: 1, y0: function () { return 0; }, y1: function (u) { return h.sheer(u); }, n: 44, nj: 10 });

    // 외판 띠와 황동 테
    var west = s.hull === 'west', gal = s.hull === 'galley';
    if (west || gal || s.hull === 'dhow') {
      var wales = gal ? [0.72] : this.big ? [0.36, 0.66] : [0.58];
      wales.forEach(function (tw) {
        band(h, grp, M.dark, 0.03, 0.97, function (u) { return h.sheer(u) * tw; }, 0.75, 0.32);
        band(h, grp, C.brass, 0.04, 0.96, function (u) { return h.sheer(u) * tw + 1.15; }, 0.22, 0.42);
      });
      band(h, grp, C.brass, 0.02, 0.98, function (u) { return h.sheer(u) - 0.55; }, 0.2, 0.18);
    } else if (s.hull === 'junk' || s.hull === 'jong') {
      band(h, grp, C.red, 0.02, 0.98, function (u) { return h.sheer(u) * 0.78; }, 0.7, 0.3);
      band(h, grp, M.dark, 0.02, 0.98, function (u) { return h.sheer(u) * 0.45; }, 0.6, 0.3);
    } else {
      band(h, grp, M.dark, 0.02, 0.98, function (u) { return h.sheer(u) * 0.7; }, 0.6, 0.3);
    }

    // 문화권별 상부구조
    var fn = this['up_' + s.hull]; if (fn) fn.call(this, grp);
    // 포문
    var guns = q.guns || 0;
    if (guns && (west || gal || s.hull === 'dhow' || s.hull === 'junk' || s.hull === 'jong')) {
      var sz = clamp(h.H * 0.17, 1.6, 2.7);
      for (var k = 0; k < guns; k++) {
        var x = -s.L * 0.22 + k * (s.L * 0.48 / Math.max(1, guns - 1)), u = h.U(x, h.H * 0.5);
        gunPort(grp, C, h, u, 1, sz); gunPort(grp, C, h, u, -1, sz);
      }
    }
    // 이물 장식: 갤리 충각, 갤리온 부리, 다우의 긴 이물
    var bow = q.bow, yb = h.sheer(1);
    if (bow === 'ram') {
      var xr = h.X(1, h.H * 0.3);
      grp.add(rod([xr - 2, h.H * 0.32, 0], [Math.min(xr + s.L * 0.09, s.L * 0.62), h.H * 0.22, 0], 1.0, 0.35, M.dark, 6));
      grp.add(rod([xr - 3, h.H * 0.32, 0], [Math.min(xr + s.L * 0.08, s.L * 0.61), h.H * 0.24, 0], 0.5, 0.2, C.brass, 6));
    } else if (bow === 'beak') {
      var xk = h.X(0.985, yb * 0.7);
      var beak = new T.Shape(); beak.moveTo(0, -h.W * 0.15); beak.lineTo(s.L * 0.075, 0); beak.lineTo(0, h.W * 0.15); beak.closePath();
      var bg = new T.ExtrudeGeometry(beak, { depth: 1.2, bevelEnabled: false }); bg.rotateX(PI / 2);
      var bm = mesh(bg, M.mid); bm.position.set(xk - 1, yb * 0.72 + 1.2, 0); grp.add(bm);
      grp.add(rod([xk - 1, yb * 0.6, 0], [xk + s.L * 0.075, yb * 0.7, 0], 0.7, 0.4, M.dark, 6));
    }
    // 이물 돛대(바우스프릿)
    if (west && s.id !== 'barca' && s.id !== 'cog') {
      var x0 = h.X(0.93, yb), x1 = Math.min(s.L * 0.66, h.X(1, yb) + s.L * 0.13);
      this.sprit = { a: [x0, yb + 0.5, 0], b: [x1, yb + (x1 - x0) * 0.42, 0] };
      grp.add(rod(this.sprit.a, this.sprit.b, 0.95, 0.5, C.spar, 7));
    } else if (s.hull === 'galley' && s.id !== 'fusta') {
      var x2 = h.X(0.96, yb), x3 = Math.min(s.L * 0.64, x2 + s.L * 0.08);
      this.sprit = { a: [x2, yb + 0.3, 0], b: [x3, yb + (x3 - x2) * 0.32, 0] };
      grp.add(rod(this.sprit.a, this.sprit.b, 0.7, 0.4, C.spar, 6));
    }
    // 갤리의 노받이 틀(아포스티스)
    if (s.hull === 'galley' || q.oars) {
      var ap = s.hull === 'galley' ? h.W * 0.1 : 0;
      this.apost = ap;
      if (ap > 0) [1, -1].forEach(function (side) {
        var xa = -s.L * 0.36, xb2 = s.L * 0.34, ua = h.U(xa, h.H), ub = h.U(xb2, h.H);
        grp.add(rod([xa, h.sheer(ua) - 0.3, side * (h.half(ua, h.sheer(ua)) + ap)], [xb2, h.sheer(ub) - 0.3, side * (h.half(ub, h.sheer(ub)) + ap)], 0.55, 0.55, M.dark, 6));
        for (var k2 = 0; k2 < 5; k2++) {
          var xx = lerp(xa, xb2, k2 / 4), uu = h.U(xx, h.H), ys = h.sheer(uu) - 0.4, hw = h.half(uu, ys);
          grp.add(rod([xx, ys, side * hw], [xx, ys, side * (hw + ap)], 0.35, 0.35, M.dark, 5));
        }
      });
    }
    if (q.outrigger) this.outriggers(grp);
    return grp;
  };

  /* 갑판 위 성루(선루) */
  Ship.prototype.castle = function (grp, uA, uB, hc, o) {
    var h = this.h, M = this.M; o = o || {};
    var base = o.base || function (u) { return h.sheer(u); };
    var us = shell(h, grp, M, {
      uA: uA, uB: uB, y0: function (u) { return base(u) - h.bul - 0.2; }, y1: function (u) { return base(u) + hc; },
      inset: o.inset || 0.985, n: 18, nj: 3, bul: clamp(hc * 0.22, 0.9, 2.4), backWall: o.backWall, frontWall: o.frontWall,
      side: o.side, deck: o.deck, rail: o.rail
    });
    // 성루 위 황동 테
    band(h, grp, this.C.brass, uA + 0.005, uB - 0.005, function (u) { return base(u) + hc - 0.6; }, 0.2, 0.15, o.inset || 0.985);
    return us;
  };

  Ship.prototype.up_west = function (grp) {
    var s = this.s, q = this.q, h = this.h, C = this.C, self = this, big = this.big, id = s.id;
    var stern = q.stern, bow = q.bow;
    // 선미루
    if (stern && stern !== 'open') {
      var uq = { quarter: 0.20, castle: 0.22, high: 0.27, tower: 0.30, gallery: 0.33, round: 0.24 }[stern] || 0.22;
      var h1 = { quarter: 0.55, castle: 0.75, high: 0.8, tower: 0.85, gallery: 0.62, round: 0.55 }[stern] * h.H;
      if (id === 'cog' || id === 'hulk') h1 = h.H * 0.7;
      this.castle(grp, 0, uq, h1, { inset: stern === 'round' ? 0.86 : 0.98 });
      var top1 = function (u) { return h.sheer(u) + h1; };
      if (stern === 'high' || stern === 'tower' || stern === 'gallery') {
        var uq2 = uq * (stern === 'tower' ? 0.66 : 0.58), h2 = h.H * (stern === 'tower' ? 0.72 : stern === 'gallery' ? 0.48 : 0.55);
        this.castle(grp, 0, uq2, h2, { base: top1, inset: 0.95 });
        if (stern === 'tower') {
          var top2 = function (u) { return top1(u) + h2; };
          this.castle(grp, 0, uq2 * 0.62, h.H * 0.45, { base: top2, inset: 0.9 });
        }
      }
      // 선미 창과 회랑
      var ys = h.sheer(0) + h1 * 0.55, xs = h.X(0, ys) - 0.25, ws = h.half(0.002, ys) * 0.98;
      var nw = Math.max(2, Math.round(ws / 4.2));
      for (var k = 0; k < nw; k++) windowAt(grp, C, xs, ys, lerp(-ws * 0.7, ws * 0.7, nw > 1 ? k / (nw - 1) : 0.5), 2.2, 2.6, -PI / 2);
      if (stern === 'gallery') {
        var yg = ys - 2.2;
        grp.add(box(1.8, 0.6, ws * 2.05, C.brass, xs - 0.9, yg, 0));
        grp.add(box(1.5, 0.35, ws * 2.05, this.M.dark, xs - 0.75, yg + 2.8, 0));
        // 옆 회랑(쿼터 갤러리)
        [1, -1].forEach(function (side) {
          var uu = uq * 0.45, yq = h.sheer(uu) + h1 * 0.4, xq = h.X(uu, yq), zq = side * (h.half(uu, yq) * 0.98 + 0.9);
          grp.add(box(5.5, h1 * 0.55, 1.6, self.M.mid, xq, yq, zq));
          windowAt(grp, C, xq, yq, zq + side * 0.85, 1.6, 1.8, side > 0 ? 0 : PI);
        });
      }
      // 옆 창(작은 배는 하나)
      [1, -1].forEach(function (side) {
        var n2 = big ? 3 : 2;
        for (var j = 0; j < n2; j++) {
          var uu = uq * (0.25 + j * 0.25), yw = h.sheer(uu) + h1 * 0.5, xw = h.X(uu, yw), zw = side * (h.half(uu, yw) * 0.98 + 0.12);
          windowAt(grp, C, xw, yw, zw, 1.5, 1.8, side > 0 ? 0 : PI);
        }
      });
    }
    // 이물루
    if (bow === 'castle') {
      var hf = h.H * (big ? 0.72 : 0.55);
      this.castle(grp, 0.80, 1.0, hf, { inset: 0.98, frontWall: false });
      if (id === 'hcarrack' || id === 'lcarrack') this.castle(grp, 0.86, 1.0, h.H * 0.38, { base: function (u) { return h.sheer(u) + hf; }, inset: 0.92, frontWall: false });
    } else if (bow === 'beak' && big) {
      this.castle(grp, 0.76, 0.93, h.H * 0.42, { inset: 0.96 });
    } else if (bow === 'round') {
      this.castle(grp, 0.82, 1.0, h.H * 0.3, { inset: 0.96, frontWall: false });
    }
    // 승강구·캡스턴 등 갑판 소품
    var xm = -s.L * 0.05, um = h.U(xm, h.H), yd = h.deckY(um);
    grp.add(box(s.L * 0.08, 0.9, h.half(um, h.H) * 0.55, this.M.dark, xm, yd + 0.45, 0));
    if (big) grp.add(rod([-s.L * 0.16, yd, 0], [-s.L * 0.16, yd + 2.6, 0], 1.3, 1.1, this.M.mid, 10));
    if (id === 'barca' || id === 'pinnace' || id === 'caravel' || id === 'tartane') {
      // 키(선미 방향타)
      var x0 = h.X(0, h.H * 0.6);
      grp.add(rod([x0 - 0.5, h.sheer(0) + 1, 0], [x0 - 3.2, 0.4, 0], 0.8, 1.4, this.M.dark, 6));
    }
  };

  Ship.prototype.up_galley = function (grp) {
    var s = this.s, q = this.q, h = this.h, C = this.C, M = this.M, id = s.id;
    // 고물 차양(갤리의 선미 캐노피) 또는 성루
    if (q.stern === 'castle') {
      this.castle(grp, 0, 0.17, h.H * (id === 'galleass' ? 0.9 : 0.75), { inset: 0.96 });
      var ys = h.sheer(0) + h.H * 0.45, xs = h.X(0, ys) - 0.2, ws = h.half(0.004, ys) * 0.9;
      for (var k = 0; k < 3; k++) windowAt(grp, C, xs, ys, lerp(-ws * 0.6, ws * 0.6, k / 2), 2, 2.2, -PI / 2);
    } else if (q.stern === 'quarter') {
      // 아치형 차양
      var ua = 0.03, ub = 0.17, n = 10;
      var g2 = grid(n, 8, function (i, j) {
        var u = lerp(ua, ub, i / n), yd = h.deckY(u), x = h.X(u, yd), w = h.half(u, h.sheer(u)) * 0.92, a = PI * j / 8;
        return [x, yd + 1 + Math.sin(a) * w * 0.55 + 2.2, -Math.cos(a) * w, i / n, j / 8];
      });
      var cm = mesh(g2, C.red); cm.material = C.red; grp.add(cm);
    }
    if (id === 'galleass') this.castle(grp, 0.82, 1.0, h.H * 0.7, { inset: 0.96, frontWall: false });
    // 노꾼 의자(갑판 가로대)와 중앙 통로
    var xa = -s.L * 0.3, xb = s.L * 0.3;
    for (var k2 = 0; k2 < 9; k2++) {
      var x = lerp(xa, xb, k2 / 8), u = h.U(x, h.H), yd = h.deckY(u), w = h.half(u, h.sheer(u)) - h.th;
      grp.add(box(0.8, 0.5, w * 1.9, M.dark, x, yd + 0.3, 0));
    }
    var ux = h.U(0, h.H);
    grp.add(box(s.L * 0.62, 0.8, h.W * 0.13, M.mid, 0, h.deckY(ux) + 0.6, 0));
  };

  Ship.prototype.up_dhow = function (grp) {
    var s = this.s, q = this.q, h = this.h, C = this.C, id = s.id;
    if (q.stern !== 'open') {
      var hc = h.H * (id === 'baghlah' ? 0.95 : 0.6);
      this.castle(grp, 0, 0.24, hc, { inset: 0.97 });
      // 다우·바글라의 장식 선미판
      var ys = h.sheer(0) + hc * 0.5, xs = h.X(0, ys) - 0.25, ws = h.half(0.002, ys) * 0.95;
      var nwin = id === 'baghlah' ? 4 : 2;
      for (var k = 0; k < nwin; k++) windowAt(grp, C, xs, ys, lerp(-ws * 0.6, ws * 0.6, nwin > 1 ? k / (nwin - 1) : 0.5), 1.8, 2.4, -PI / 2);
      if (id === 'baghlah') grp.add(box(0.5, hc * 0.35, ws * 1.7, C.brass, xs - 0.2, ys + hc * 0.32, 0));
    }
    // 긴 이물 끝 기둥
    var y1 = h.sheer(1), x1 = h.X(1, y1);
    grp.add(rod([x1 - 1, y1 - 1, 0], [x1 + 1.2, y1 + 3.2, 0], 0.8, 0.5, this.M.dark, 6));
    if (id === 'sambuk') {   // 삼부크의 낮은 선미 난간
      var u0 = 0.06;
      grp.add(box(4, 1.2, h.half(u0, h.H) * 1.8, this.M.mid, h.X(u0, h.H), h.sheer(u0) + 0.6, 0));
    }
  };

  Ship.prototype.up_jong = function (grp) {
    var h = this.h, C = this.C, M = this.M, s = this.s;
    var hc = h.H * 0.8;
    this.castle(grp, 0.02, 0.27, hc, { inset: 0.94 });
    // 선미 집 지붕
    this.roofHouse(grp, h.X(0.04, h.H), h.X(0.25, h.H), h.half(0.15, h.H) * 0.78, h.sheer(0.15) + hc, h.H * 0.35, C.thatch, 0.18);
    // 이물 갑판집
    var x0 = s.L * 0.16, x1 = s.L * 0.32, u = h.U((x0 + x1) / 2, h.H);
    this.roofHouse(grp, x0, x1, h.half(u, h.H) * 0.55, h.deckY(u), h.H * 0.45, C.thatch, 0.25);
  };

  Ship.prototype.up_outrigger = function (grp) {
    var s = this.s, h = this.h, C = this.C;
    // 코라코라의 무사 대(가운데 높은 단)와 야자잎 지붕
    var x0 = -s.L * 0.24, x1 = s.L * 0.18, u = h.U(0, h.H), yd = h.deckY(u);
    grp.add(box(x1 - x0, 0.7, h.half(u, h.H) * 2.9, this.M.deckc, (x0 + x1) / 2, h.sheer(u) + 0.6, 0));
    this.roofHouse(grp, -s.L * 0.12, s.L * 0.06, h.half(u, h.H) * 1.3, h.sheer(u) + 0.9, 4.2, C.thatch, 0.3);
  };

  Ship.prototype.up_junk = function (grp) {
    var s = this.s, q = this.q, h = this.h, C = this.C, M = this.M, id = s.id, big = this.big;
    var hc = h.H * (q.stern === 'tower' ? 0.95 : q.stern === 'high' ? 0.8 : 0.6);
    this.castle(grp, 0, 0.26, hc, { inset: 1.0 });
    var top1 = function (u) { return h.sheer(u) + hc; };
    if (q.stern === 'tower') {
      this.castle(grp, 0, 0.17, h.H * 0.6, { base: top1, inset: 0.96 });
      this.roofHouse(grp, h.X(0.02, h.H), h.X(0.15, h.H), h.half(0.08, h.H) * 0.8, top1(0.08) + h.H * 0.6, h.H * 0.45, C.roof, 0.3);
    } else if (q.stern === 'high') {
      this.roofHouse(grp, h.X(0.04, h.H), h.X(0.2, h.H), h.half(0.1, h.H) * 0.78, top1(0.1), h.H * 0.5, C.roof, 0.25);
    }
    // 선미판의 붉은 테와 창
    var ys = h.sheer(0) + hc * 0.5, xs = h.X(0, ys) - 0.3, ws = h.half(0.002, ys);
    grp.add(box(0.5, hc * 0.7, ws * 1.6, C.red, xs, ys, 0));
    windowAt(grp, C, xs - 0.3, ys, 0, 2.2, 2.2, -PI / 2);
    // 키(높이 올린 큰 방향타)
    grp.add(box(2.6, h.sheer(0) * 0.8, 0.5, M.mid, xs - 1.2, h.sheer(0) * 0.45 + 0.6, 0));
    if (big) {
      var xm = -s.L * 0.02, um = h.U(xm, h.H);
      this.roofHouse(grp, xm - s.L * 0.08, xm + s.L * 0.08, h.half(um, h.H) * 0.62, h.deckY(um), h.H * (id === 'baochuan' ? 0.75 : 0.5), C.roof, 0.2);
    }
    if (id === 'shachuan') {
      var xb = s.L * 0.3, ub = h.U(xb, h.H);
      grp.add(box(s.L * 0.1, 1.6, h.half(ub, h.H) * 1.4, M.mid, xb, h.deckY(ub) + 0.8, 0));
    }
  };

  Ship.prototype.up_kr = function (grp) {   // 맹선: 낮은 판옥 없는 전선
    var s = this.s, h = this.h, C = this.C;
    var x0 = -s.L * 0.4, x1 = -s.L * 0.2, u = h.U((x0 + x1) / 2, h.H);
    this.roofHouse(grp, x0, x1, h.half(u, h.H) * 0.7, h.deckY(u), h.H * 0.75, C.roof, 0.25, C.wallK);
  };

  Ship.prototype.up_panok = function (grp) {
    var s = this.s, h = this.h, C = this.C, M = this.M;
    // 판옥: 뱃전 위로 넓게 덮은 윗갑판과 방패벽(총안)
    var ua = 0.04, ub = 0.92, hu = h.H * 0.95, ext = 1.08;
    var base = function (u) { return h.sheer(u); };
    var us = shell(h, grp, M, {
      uA: ua, uB: ub, y0: function (u) { return base(u) - h.bul; }, y1: function (u) { return base(u) + hu; },
      inset: ext, n: 22, nj: 3, side: C.wallK, bul: h.H * 0.4, backWall: true, frontWall: true, backMat: C.wallK, frontMat: C.wallK
    });
    // 장대(지휘 누각)
    var x0 = -s.L * 0.12, x1 = s.L * 0.06, u = h.U(0, h.H);
    this.roofHouse(grp, x0, x1, h.half(u, h.H) * 0.55, h.sheer(u) + hu - h.H * 0.4, h.H * 0.75, C.roof, 0.28, C.wallK);
  };

  function TURTLE_HR(h, e) { return h.B * 0.62 * Math.pow(e, 0.45) + 0.8; }
  Ship.prototype.up_turtle = function (grp) {
    var s = this.s, h = this.h, C = this.C, M = this.M;
    // 낮은 방패벽 위에 거북 등 지붕
    var ua = 0.06, ub = 0.9, hw0 = 0.5;
    shell(h, grp, M, {
      uA: ua, uB: ub, y0: function (u) { return h.sheer(u) - h.bul; }, y1: function (u) { return h.sheer(u) + h.H * 0.38; },
      inset: 1.04, n: 22, nj: 2, side: C.wallK, top: false, backWall: true, frontWall: true, backMat: C.wallK, frontMat: C.wallK
    });
    var n = 26, nk = 12, wallTop = function (u) { return h.sheer(u) + h.H * 0.38; };
    var shellG = grid(n, nk, function (i, j) {
      var u = lerp(ua, ub, i / n), e = Math.sin(PI * (i / n)), y0 = wallTop(u), w = h.half(u, y0) * 1.04, a = PI * j / nk;
      var hr = TURTLE_HR(h, e), x = h.X(u, y0);
      return [x, y0 + Math.sin(a) * hr, -Math.cos(a) * w * (0.55 + 0.45 * Math.pow(e, 0.35)), i / n * 3, j / nk * 1.2];
    });
    grp.add(mesh(shellG, C.plates));
    // 쇠못(인스턴스)
    var spikes = [], cone = new T.ConeGeometry(0.42, 2.0, 5);
    for (var i = 2; i < n - 1; i += 1) for (var j = 2; j <= nk - 2; j += 2) {
      var u = lerp(ua, ub, i / n), e = Math.sin(PI * (i / n)), y0 = wallTop(u), w = h.half(u, y0) * 1.04, a = PI * j / nk;
      var hr = TURTLE_HR(h, e), x = h.X(u, y0), z = -Math.cos(a) * w * (0.55 + 0.45 * Math.pow(e, 0.35));
      var p = new T.Vector3(x, y0 + Math.sin(a) * hr, z), nrm = new T.Vector3(0, Math.sin(a), -Math.cos(a)).normalize();
      var m4 = new T.Matrix4(), qn = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), nrm);
      m4.compose(p.add(nrm.clone().multiplyScalar(0.6)), qn, new T.Vector3(1, 1, 1));
      spikes.push(m4);
    }
    var im = new T.InstancedMesh(cone, C.spike, spikes.length);
    spikes.forEach(function (m4, k) { im.setMatrixAt(k, m4); });
    im.castShadow = true; grp.add(im);
    // 등마루 띠
    grp.add(mesh(grid(n, 1, function (i, j) {
      var u = lerp(ua, ub, i / n), e = Math.sin(PI * (i / n)), y0 = wallTop(u), hr = TURTLE_HR(h, e), x = h.X(u, y0);
      return [x, y0 + hr + 0.15, j ? 1.1 : -1.1, i / n, j];
    }), C.red));
    // 용머리
    var yb = h.sheer(1) + h.H * 0.35, xb = h.X(1, yb);
    var head = new T.Group();
    head.add(box(5.5, 3.4, 3.6, C.brass, 0, 0, 0));
    head.add(box(2.2, 1.4, 2.6, C.hole, 2.8, -0.2, 0));
    var horn = rod([-1, 1.5, 0], [-3, 4.5, 0], 0.5, 0.2, C.brass, 5); head.add(horn);
    head.position.set(xb + 0.5, yb, 0); head.rotation.z = 0.25; grp.add(head);
    // 이물·고물의 포혈
    for (var g2 = 0; g2 < 5; g2++) [1, -1].forEach(function (side) {
      var u = lerp(0.2, 0.82, g2 / 4), yy = h.sheer(u) + h.H * 0.2, xx = h.X(u, yy);
      grp.add(box(1.6, 1.2, 0.5, C.hole, xx, yy, side * (h.half(u, yy) * 1.04 + 0.2)));
    });
  };

  Ship.prototype.up_jp = function (grp) {
    var s = this.s, h = this.h, C = this.C, M = this.M, id = s.id;
    if (id === 'sekibune') {
      // 세키부네: 뱃전 둘레 대나무·널 방패(다테)와 지붕 없는 갑판
      shell(h, grp, M, {
        uA: 0.08, uB: 0.82, y0: function (u) { return h.sheer(u) - h.bul; }, y1: function (u) { return h.sheer(u) + h.H * 0.55; },
        inset: 1.03, n: 20, nj: 2, side: C.wallJ, top: false, backWall: true, frontWall: true, backMat: C.wallJ, frontMat: C.wallJ
      });
      var x0 = -s.L * 0.36, x1 = -s.L * 0.18, u = h.U(-s.L * 0.27, h.H);
      this.roofHouse(grp, x0, x1, h.half(u, h.H) * 0.6, h.sheer(u) + h.H * 0.1, h.H * 0.7, C.roof, 0.25, C.wallJ);
    } else {
      // 고바야: 대나무 다발 방패만
      [1, -1].forEach(function (side) {
        for (var k = 0; k < 9; k++) {
          var u = lerp(0.2, 0.78, k / 8), y = h.sheer(u), x = h.X(u, y), z = side * (h.half(u, y) + 0.2);
          grp.add(rod([x, y - 0.5, z], [x, y + h.H * 0.75, z], 0.8, 0.8, C.bamboo, 6));
        }
      });
    }
  };

  Ship.prototype.up_atake = function (grp) {
    var s = this.s, h = this.h, C = this.C, M = this.M;
    // 아타케부네: 배 전체를 덮은 상자형 성벽(총안), 위에 2층 망루(야구라)
    var hu = h.H * 1.15;
    shell(h, grp, M, {
      uA: 0.05, uB: 0.92, y0: function (u) { return h.sheer(u) - h.bul; }, y1: function (u) { return h.sheer(u) + hu; },
      inset: 1.03, n: 22, nj: 3, side: C.wallJ, deck: M.deckc, bul: h.H * 0.3, backWall: true, frontWall: true, backMat: C.wallJ, frontMat: C.wallJ
    });
    var u = h.U(-s.L * 0.08, h.H), y0 = h.sheer(u) + hu - h.H * 0.3, w = h.half(u, h.H) * 0.6;
    this.roofHouse(grp, -s.L * 0.22, s.L * 0.06, w, y0, h.H * 0.65, C.roof, 0.22, C.white);
    this.roofHouse(grp, -s.L * 0.16, 0, w * 0.75, y0 + h.H * 0.65 + 1.2, h.H * 0.55, C.roof, 0.22, C.white);
  };

  /* 지붕 있는 집: x0~x1, 반폭 hw, 바닥 y0, 벽 높이 hh. eave = 처마(폭 비율) */
  Ship.prototype.roofHouse = function (grp, x0, x1, hw, y0, hh, roofMat, eave, wallMat) {
    var C = this.C, M = this.M, len = x1 - x0, cx = (x0 + x1) / 2;
    var walls = mesh(new T.BoxGeometry(len, hh, hw * 2), wallMat || M.mid); walls.position.set(cx, y0 + hh / 2, 0); grp.add(walls);
    var ov = Math.min(hw * (eave || 0.2), 3.2), rh = Math.min(hw * 0.5, 2.2 + hh * 0.55);
    // 박공 지붕: 두 경사면
    [1, -1].forEach(function (side) {
      var g = grid(1, 1, function (i, j) {
        var x = lerp(x0 - ov, x1 + ov, i), z = side * (j ? 0 : hw + ov), y = y0 + hh + (j ? rh : -ov * 0.35);
        return [x, y, z, i * 2, j];
      }, side > 0);
      grp.add(mesh(g, roofMat));
    });
    // 박공 벽(삼각)
    [x0, x1].forEach(function (x, k) {
      var g = geo([x, y0 + hh, -hw, x, y0 + hh, hw, x, y0 + hh + rh, 0], [0, 0, 1, 0, 0.5, 1], k ? [0, 1, 2] : [0, 2, 1]);
      grp.add(mesh(g, wallMat || M.mid));
    });
    grp.add(rod([x0 - ov, y0 + hh + rh + 0.2, 0], [x1 + ov, y0 + hh + rh + 0.2, 0], 0.55, 0.55, M.dark, 6));
  };

  Ship.prototype.outriggers = function (grp) {
    var s = this.s, h = this.h, C = this.C, W = s.W;
    var zf = W * 2.25;
    [-s.L * 0.24, s.L * 0.2].forEach(function (x) {
      var u = h.U(x, h.H), y = h.sheer(u) + 0.6;
      grp.add(rod([x, y, -zf], [x, y, zf], 0.55, 0.55, C.bamboo, 6));
      [1, -1].forEach(function (side) { grp.add(rod([x, y, side * zf], [x, 0.6, side * zf], 0.4, 0.4, C.bamboo, 5)); });
    });
    [1, -1].forEach(function (side) {
      for (var k = 0; k < 2; k++) grp.add(rod([-s.L * 0.36, 0.7 + k * 0.9, side * (zf - k * 0.8)], [s.L * 0.32, 0.7 + k * 0.9, side * (zf - k * 0.8)], 0.75, 0.75, C.bamboo, 6));
    });
  };

  Ship.prototype.buildRaft = function (grp) {
    var s = this.s, C = this.C, L = s.L, W = s.W, n = 9, r = W / (n * 2.05);
    this.h.H = r * 2.2;
    for (var k = 0; k < n; k++) {
      var z = lerp(-W * 0.47, W * 0.47, k / (n - 1)), len = L * (0.86 + 0.12 * Math.cos(PI * (k / (n - 1) - 0.5)));
      grp.add(rod([-L * 0.5, r * 0.6, z], [-L * 0.5 + len, r * 0.6, z], r, r * 0.92, C.log, 10));
    }
    [-L * 0.3, 0, L * 0.25].forEach(function (x) { grp.add(rod([x, r * 1.6, -W * 0.5], [x, r * 1.6, W * 0.5], r * 0.45, r * 0.45, C.batten, 6)); });
    // 대나무 갑판과 오두막
    grp.add(box(L * 0.55, 0.6, W * 0.8, C.bamboo, -L * 0.04, r * 1.9, 0));
    this.roofHouse(grp, -L * 0.3, -L * 0.08, W * 0.26, r * 2.2, 4.5, C.thatch, 0.25, C.bamboo);
    // 고물 노(방향)
    grp.add(rod([-L * 0.42, r * 2.4, W * 0.15], [-L * 0.56, 0.2, W * 0.2], 0.5, 0.5, C.oar, 5));
    this.raftDeck = r * 2.2;
    return grp;
  };

  // ───────────────────────────────── 돛대·돛 (동작마다 새로 짓는다)
  /* st: { furl: bool, brace: rad, bill: 0~1, pulse: -1~1, oar: 위상, oarPow: 0~1, phase } */
  Ship.prototype.buildRig = function (st) {
    var s = this.s, q = this.q, h = this.h, C = this.C, grp = new T.Group(), self = this;
    var rig = q.rig || '', H0 = s.H, masts = s.masts, hs = s.heights, nm = masts.length;
    var west = s.hull === 'west', galley = s.hull === 'galley';
    var rbase = clamp(0.75 + 0.5 * Math.sqrt(s.cap / 600), 0.8, 1.7);
    var tiers2 = (rig === 'carrack' || rig === 'galleon' || rig === 'fluyt' || rig === 'frigate' || rig === 'hulk') && s.cap >= 300;
    var raft = s.hull === 'raft';
    var sailKinds = s.sails;
    for (var i = 0; i < nm; i++) {
      var mx = masts[i], mh = hs[i], top = H0 + mh, kind = sailKinds[i] || 'sq';
      var ud = h.U(mx, h.H), yd = raft ? this.raftDeck : h.deckY(ud);
      var r = rbase * (i === 0 && nm > 2 ? 0.85 : i === nm - 1 && nm > 2 ? 0.75 : 1);
      var style = (rig === 'jong' || rig === 'korakora') ? 'tanja' : kind === 'sq' ? (rig === 'japanese' ? 'jp' : 'sq') : kind === 'lat' ? 'lat' : (rig === 'korean' ? 'kr' : 'bat');
      // 돛대
      if (raft) {
        [1, -1].forEach(function (side) { grp.add(rod([mx - 2, yd, side * s.W * 0.28], [mx, top, 0], 0.7, 0.5, C.bamboo, 6)); });
      } else if (rig === 'korakora') {
        [[-3, -s.W * 0.3], [-3, s.W * 0.3], [3, 0]].forEach(function (p) { grp.add(rod([mx + p[0], yd, p[1]], [mx, top, 0], 0.55, 0.4, C.bamboo, 6)); });
      } else {
        var hasTop = west && (s.cap >= 150) && style === 'sq';
        var yTop1 = H0 + mh * (tiers2 && style === 'sq' ? 0.67 : 0.72);
        grp.add(rod([mx, yd - 0.5, 0], [mx, top, 0], r, r * 0.55, C.mast, 10));
        // 돛대 테(황동)
        for (var b = 1; b <= 3; b++) { var yb2 = lerp(yd, yTop1, b / 4); grp.add(rod([mx, yb2 - 0.3, 0], [mx, yb2 + 0.3, 0], r * 1.18, r * 1.18, C.brass, 10)); }
        if (hasTop) {
          var tr = r * 2.6 + 0.8;
          grp.add(rod([mx, yTop1 - 0.4, 0], [mx, yTop1 + 0.4, 0], tr, tr, C.spar, 14));
          var ring = new T.CylinderGeometry(tr, tr * 0.95, 1.3, 14, 1, true);
          var rm = mesh(ring, this.M.mid); rm.position.set(mx, yTop1 + 1.0, 0); grp.add(rm);
        }
        // 슈라우드(돛대 줄) — 서양선·갤리·다우
        if (west || galley || s.hull === 'dhow' || s.hull === 'jong') {
          var yh = west && hasTop ? yTop1 - 0.5 : H0 + mh * 0.78, nsh = west ? (this.big ? 4 : 3) : 2;
          [1, -1].forEach(function (side) {
            for (var k = 0; k < nsh; k++) {
              var xc = mx - 1.5 - k * 2.2 * (west ? 1 : 1.3), uc = h.U(xc, h.H), yc = h.sheer(uc), zc = side * (h.half(uc, yc) + 0.6);
              grp.add(rod([mx, yh, side * r * 0.6], [xc, yc + 0.2, zc], 0.17, 0.17, C.rope, 4));
            }
            if (west && self.big) {   // 줄사다리(가로줄)
              var x0 = mx - 1.5, x1 = mx - 1.5 - (nsh - 1) * 2.2, u0 = h.U(x0, h.H), u1 = h.U(x1, h.H);
              var z0 = side * (h.half(u0, h.sheer(u0)) + 0.6), z1 = side * (h.half(u1, h.sheer(u1)) + 0.6), ya = h.sheer(u0) + 0.2;
              for (var rr = 1; rr < 9; rr++) {
                var t = rr / 9, yy = lerp(ya, yh, t);
                var pa = [lerp(x0, mx, t), yy, lerp(z0, side * r * 0.6, t)], pb = [lerp(x1, mx, t), yy, lerp(z1, side * r * 0.6, t)];
                grp.add(rod(pa, pb, 0.09, 0.09, C.rope, 3));
              }
            }
          });
          // 앞 버팀줄(포어스테이)
          var fx = i === 0 ? (self.sprit ? self.sprit.b : [h.X(1, h.sheer(1)), h.sheer(1), 0]) : [masts[i - 1], H0 + hs[i - 1] * 0.3, 0];
          grp.add(rod([mx, top - 1, 0], fx, 0.14, 0.14, C.rope, 3));
        }
      }
      // 돛
      if (style === 'sq' || style === 'jp') this.squareSails(grp, mx, mh, H0, top, i, nm, st, style, tiers2 && style === 'sq', raft);
      else if (style === 'lat') this.lateen(grp, mx, mh, H0, st, i);
      else if (style === 'tanja') this.tanja(grp, mx, mh, H0, st);
      else this.batten(grp, mx, mh, H0, st, style, i);
      // 돛대 꼭대기 공
      var knob = mesh(new T.SphereGeometry(r * 0.75, 8, 6), C.spar); knob.position.set(mx, top + 0.3, 0); grp.add(knob);
    }
    // 이물 아래 돛(스프릿세일) — 16세기 카락·갤리온·플루트
    if (this.sprit && !st.furl && (rig === 'carrack' || rig === 'galleon' || rig === 'fluyt' || rig === 'hulk')) {
      var a = this.sprit.a, b2 = this.sprit.b, t2 = 0.62, px = lerp(a[0], b2[0], t2), py = lerp(a[1], b2[1], t2);
      var span = s.W * 0.30, hh = s.W * 0.30;
      this.sqSurface(grp, px, py - 0.6, py - 0.6 - hh, span, span * 0.95, st.brace * 0.6, st.bill * 0.7, st, sailMat('sq', IVORY), 6, 6);
      grp.add(rod([px, py - 0.6, -span], [px, py - 0.6, span], 0.45, 0.45, C.spar, 6));
    }
    // 앞 삼각돛(지브): 지중해 소형선
    if (!st.furl && (s.id === 'tartane' || s.id === 'xebec') && this.sprit) {
      var sb = this.sprit.b, m0 = masts[0], mh0 = hs[0];
      var p0 = [sb[0], sb[1], 0], p1 = [m0 + 0.5, H0 + mh0 * 0.78, 0], p2 = [m0 + 2, h.sheer(h.U(m0, h.H)) + 2, 0];
      this.triSurface(grp, p0, p1, p2, st.bill * s.W * 0.1, st.brace * 1.6, m0, sailMat('lat', IVORY));
    }
    return grp;
  };

  /* 사각돛 면: (mx) 둘레로 brace만큼 돌린 활대 아래 걸린 천. bill = 앞으로 부푼 정도 */
  Ship.prototype.sqSurface = function (grp, mx, yT, yB, spT, spB, brace, bill, st, mat, ni, nj) {
    ni = ni || 12; nj = nj || 10;
    var amp = bill, flut = (st.flutter || 0), ph = st.phase || 0;
    var g = grid(ni, nj, function (i, j) {
      var s1 = i / ni * 2 - 1, t = j / nj, z = s1 * lerp(spT, spB, t), y = lerp(yT, yB, t);
      var belly = amp * Math.pow(1 - s1 * s1, 0.85) * Math.pow(Math.sin(PI / 2 * t), 0.9);
      y += amp * 0.22 * (1 - s1 * s1) * t * t;                                // 아랫자락이 바람에 들린다
      belly += flut * Math.sin(t * 7 + ph * 2 + s1 * 2) * Math.pow(Math.abs(s1), 3) * 0.6;
      return [belly, y, z, (s1 + 1) / 2, t];
    });
    var o = mesh(g, mat); o.position.x = mx; o.rotation.y = brace; grp.add(o);
    return o;
  };
  Ship.prototype.squareSails = function (grp, mx, mh, H0, top, i, nm, st, style, tiers2, raft) {
    var s = this.s, C = this.C, W = s.W, mat = sailMat(style === 'jp' ? 'jp' : raft ? 'mat' : 'sq', raft ? TAN : IVORY);
    var spanK = (nm > 2 && i === 0 ? 1.0 : 1.12) * (style === 'jp' ? 0.86 : 1) * (raft ? 0.8 : 1);
    var bands = tiers2 ? [[0.95, 0.68, 0.72], [0.64, 0.27, 1.0]] : [[0.93, 0.30, 1.0]];
    var self = this;
    bands.forEach(function (bd, ti) {
      var span = W * spanK * bd[2], yT = H0 + mh * bd[0], yB = H0 + mh * bd[1];
      var br = st.brace * (ti ? 1 : 1.1);
      // 활대
      var yard = new T.Group(), yo = rod([0, yT + 0.6, -span * 1.08], [0, yT + 0.6, span * 1.08], 0.75, 0.75, C.spar, 7);
      yard.add(yo); yard.position.x = mx; yard.rotation.y = br; grp.add(yard);
      if (st.furl) {
        var f = rod([0, yT - 0.9, -span * 0.9], [0, yT - 0.9, span * 0.9], 1.7 + 0.2 * ti, 1.7, mat, 9);
        f.scale.set(1.15, 1, 1); var fg = new T.Group(); fg.add(f); fg.position.x = mx; fg.rotation.y = br; grp.add(fg);
        // 묶은 끈
        for (var g2 = -2; g2 <= 2; g2++) { var gk = rod([0, yT - 0.6, span * 0.38 * g2 - 0.15], [0, yT - 0.6, span * 0.38 * g2 + 0.15], 1.45, 1.45, C.rope, 8); fg.add(gk); }
        return;
      }
      var bill = st.bill * W * (0.2 + 0.03 * ti);
      self.sqSurface(grp, mx, yT, yB, span, span * (ti ? 0.98 : 0.92), br, bill, st, mat);
      // 아래 활대(코스 아래 활대 대신, 윗돛은 아래 돛 활대에 묶인다)
      if (style === 'jp' || raft) {
        var yb = new T.Group(); yb.add(rod([bill * 0.8, yB, -span * 0.95], [bill * 0.8, yB, span * 0.95], 0.55, 0.55, C.spar, 6)); yb.position.x = mx; yb.rotation.y = br; grp.add(yb);
      }
    });
  };

  /* 삼각돛(라틴): 앞 아래(택) → 뒤 위(피크) 활대, 뒤 아래(클루). 바람 아래쪽(+z)으로 부푼다 */
  Ship.prototype.lateen = function (grp, mx, mh, H0, st, i) {
    var s = this.s, C = this.C, rig = this.q.rig, mat = sailMat('lat', IVORY);
    var g = new T.Group(); g.position.x = mx;
    var long = rig === 'galley' || rig === 'galleass' || rig === 'xebec';
    var tack = [mh * (long ? 0.62 : 0.5), H0 + mh * 0.14], peak = [-mh * (long ? 0.62 : 0.56), H0 + mh * 1.0], clew = [-mh * (long ? 0.36 : 0.42), H0 + mh * 0.13];
    if (rig === 'dhow' || rig === 'baghlah') { tack = [mh * 0.58, H0 + mh * 0.12]; peak = [-mh * 0.5, H0 + mh * 1.03]; clew = [-mh * 0.48, H0 + mh * 0.22]; }
    // 활대(택과 피크 너머로 조금 나간다)
    var d = [peak[0] - tack[0], peak[1] - tack[1]];
    var ya = [tack[0] - d[0] * 0.04, tack[1] - d[1] * 0.04], yb = [peak[0] + d[0] * 0.04, peak[1] + d[1] * 0.04];
    if (st.furl) {
      g.add(rod([ya[0], ya[1], 0.6], [yb[0], yb[1], 0.6], 0.8, 0.45, C.spar, 7));
      var fr = rod([lerp(ya[0], yb[0], 0.08), lerp(ya[1], yb[1], 0.08) - 0.8, 0.6], [lerp(ya[0], yb[0], 0.85), lerp(ya[1], yb[1], 0.85) - 0.8, 0.6], 1.1, 0.7, mat, 8);
      g.add(fr); g.rotation.y = 0.05; grp.add(g); return;
    }
    g.add(rod([ya[0], ya[1], 0.5], [yb[0], yb[1], 0.5], 0.8, 0.45, C.spar, 7));
    var amp = st.bill * s.W * 0.22, flut = st.flutter || 0, ph = st.phase || 0;
    var ni = 14, nj = 10;
    var sg = grid(ni, nj, function (a, b) {
      var u = a / ni, r = b / nj, lx = lerp(tack[0], peak[0], u), ly = lerp(tack[1], peak[1], u);
      var x = lerp(lx, clew[0], r), y = lerp(ly, clew[1], r);
      var belly = amp * Math.pow(Math.sin(PI * r), 0.85) * (0.35 + 0.65 * Math.sin(PI * u)) * (1 - 0.6 * r * r);
      belly += flut * Math.sin(u * 8 + ph * 2) * r * r * 0.7;
      return [x - belly * 0.25, y, 0.9 + belly, u, r];
    });
    g.add(mesh(sg, mat));
    g.rotation.y = -st.brace * 1.8;   // 돛이 바람 아래로 돈다
    grp.add(g);
  };

  /* 탄자(동남아 기울인 사각돛): 위·아래 활대 모두 비스듬한 사각형 */
  Ship.prototype.tanja = function (grp, mx, mh, H0, st) {
    var s = this.s, C = this.C, mat = sailMat('mat', MAT_TAN), g = new T.Group(); g.position.x = mx;
    var wS = mh * 0.62, hS = mh * 0.8, be = 0.36, ph = 0.30;          // 아래 활대는 고물로 오르고, 돛 전체가 이물로 기운다
    var bx = -Math.cos(be), by = Math.sin(be), vx = Math.sin(ph), vy = Math.cos(ph);
    var A = [wS * 0.34, H0 + mh * 0.12], Bp = [A[0] + wS * bx, A[1] + wS * by], D = [A[0] + hS * vx, A[1] + hS * vy], Cc = [Bp[0] + hS * vx, Bp[1] + hS * vy];
    if (st.furl) {
      g.add(rod([A[0], A[1], 0.6], [Bp[0], Bp[1], 0.6], 0.6, 0.6, C.bamboo, 6));
      g.add(rod([lerp(A[0], Bp[0], 0.05), A[1] + 1.4, 0.6], [lerp(A[0], Bp[0], 0.95), Bp[1] + 1.4, 0.6], 1.4, 1.4, mat, 8));
      g.add(rod([lerp(A[0], Bp[0], 0.02), A[1] + 2.6, 0.6], [lerp(A[0], Bp[0], 0.98), Bp[1] + 2.6, 0.6], 0.55, 0.55, C.bamboo, 6));
      grp.add(g); return;
    }
    var amp = st.bill * s.W * 0.2, ni = 10, nj = 10;
    g.add(mesh(grid(ni, nj, function (a, b) {
      var u = a / ni, v = b / nj, x0 = lerp(A[0], Bp[0], u), y0 = lerp(A[1], Bp[1], u), x1 = lerp(D[0], Cc[0], u), y1 = lerp(D[1], Cc[1], u);
      var belly = amp * Math.sin(PI * u) * Math.sin(PI * v) + (st.flutter || 0) * Math.sin(v * 7 + (st.phase || 0) * 2) * u * u * 0.6;
      return [lerp(x0, x1, v), lerp(y0, y1, v), 0.8 + belly, u, 1 - v];
    }), mat));
    g.add(rod([A[0], A[1], 0.8], [Bp[0], Bp[1], 0.8], 0.55, 0.55, C.bamboo, 6));
    g.add(rod([D[0], D[1], 0.8], [Cc[0], Cc[1], 0.8], 0.55, 0.55, C.bamboo, 6));
    for (var k = 1; k < 4; k++) { var t = k / 4; g.add(rod([lerp(A[0], D[0], t), lerp(A[1], D[1], t), 0.9 + amp * Math.sin(PI * t) * 0.5], [lerp(Bp[0], Cc[0], t), lerp(Bp[1], Cc[1], t), 0.9 + amp * Math.sin(PI * t) * 0.5], 0.28, 0.28, C.batten, 4)); }
    g.rotation.y = -st.brace * 1.5; grp.add(g);
  };

  /* 대나무 살 돛(정크·조선 전선): 활대가 고물 쪽으로 높은 러그 돛, 살마다 칸이 조금씩 부푼다.
     style kr: 좌우가 거의 같은 사각형(판옥선·거북선) */
  Ship.prototype.batten = function (grp, mx, mh, H0, st, style, i) {
    var s = this.s, C = this.C, kr = style === 'kr', mat = sailMat('bat', kr ? '#e6d7b4' : TAN), g = new T.Group(); g.position.x = mx;
    var w = mh * (kr ? 0.56 : 0.62), fwd = kr ? 0.42 : 0.3;
    var luffX = w * fwd, leechX = -w * (1 - fwd);
    var yBot = H0 + mh * 0.16, yTopF = H0 + mh * (kr ? 0.9 : 0.84), yTopA = H0 + mh * (kr ? 0.95 : 1.0);
    var nb = kr ? 7 : 6, furl = st.furl, amp = st.bill * s.W * 0.13;
    var hgt = function (t) { return furl ? lerp(yBot, yBot + (yTopF - yBot) * 0.14, t) : null; };
    var ni = 10, nj = nb * 3;
    var sg = grid(ni, nj, function (a, b) {
      var u = a / ni, v = b / nj;                       // u: 앞(러프) → 뒤(리치), v: 아래 → 위
      var yF = lerp(yBot, yTopF, v), yA = lerp(yBot - mh * 0.02, yTopA, v);
      if (furl) { yF = lerp(yBot, yBot + mh * 0.1, v); yA = lerp(yBot - mh * 0.02, yBot + mh * 0.14, v); }
      var x = lerp(luffX, leechX, u) - (kr ? 0 : Math.sin(PI * v) * w * 0.12 * u);       // 리치가 뒤로 둥글다
      var y = lerp(yF, yA, u);
      var panel = (v * nb) % 1, belly = furl ? 0.2 : amp * (0.55 * Math.sin(PI * u) + 0.45 * Math.sin(PI * panel) * Math.sin(PI * u * 0.9 + 0.15));
      return [x, y, 0.9 + belly, u, v];
    });
    g.add(mesh(sg, mat));
    // 살
    for (var k = 0; k <= nb; k++) {
      var v = k / nb, yF = furl ? lerp(yBot, yBot + mh * 0.1, v) : lerp(yBot, yTopF, v), yA = furl ? lerp(yBot - mh * 0.02, yBot + mh * 0.14, v) : lerp(yBot - mh * 0.02, yTopA, v);
      var xa = leechX - (kr || furl ? 0 : Math.sin(PI * v) * w * 0.12);
      var bz = 0.9 + (furl ? 0.25 : amp * 0.55 * 0.2);
      g.add(rod([luffX + 0.6, yF, bz], [xa - 0.6, yA, bz], k === 0 || k === nb ? 0.55 : 0.32, k === 0 || k === nb ? 0.55 : 0.32, k === nb ? C.spar : C.batten, 5));
    }
    g.rotation.y = -st.brace * 1.2; grp.add(g);
  };

  Ship.prototype.triSurface = function (grp, p0, p1, p2, amp, brace, pivotX, mat) {
    var g = new T.Group(), ni = 8, nj = 8;
    g.add(mesh(grid(ni, nj, function (a, b) {
      var u = a / ni, r = b / nj, lx = lerp(p0[0], p1[0], u), ly = lerp(p0[1], p1[1], u);
      var x = lerp(lx, p2[0], r), y = lerp(ly, p2[1], r), belly = amp * Math.sin(PI * r) * Math.sin(PI * u);
      return [x - pivotX, y, belly, u, r];
    }), mat));
    g.position.x = pivotX; g.rotation.y = -brace; grp.add(g);
  };

  // ───────────────────────────────── 노
  Ship.prototype.buildOars = function (st) {
    var s = this.s, q = this.q, h = this.h, C = this.C, grp = new T.Group();
    var ht = s.hull, n = q.oars || 0;
    if (!n && !(ht === 'galley' || ht === 'kr' || ht === 'panok' || ht === 'turtle' || ht === 'jp' || ht === 'atake' || ht === 'outrigger')) return grp;
    n = n || 7;
    var reach = (ht === 'atake' || ht === 'panok' || ht === 'turtle') ? 0.62 : ht === 'outrigger' ? 0.95 : 0.9;
    var ap = this.apost || 0;
    for (var k = 0; k < n; k++) {
      var x = -s.L * 0.33 + k * (s.L * 0.64 / Math.max(1, n - 1)), u = h.U(x, h.H);
      var ys = (ht === 'panok' || ht === 'turtle' || ht === 'atake') ? h.sheer(u) * 0.72 : h.sheer(u) - 0.3;
      [1, -1].forEach(function (side) {
        var hw = h.half(u, ys) + ap + 0.3;
        var ph = (st.oar || 0) + k * 0.42 + (side > 0 ? 0 : 0.28), pow = st.oarPow || 0;
        var sweep = Math.sin(ph) * 0.42 * pow, lift = (0.5 + 0.5 * Math.cos(ph)) * pow;
        var len = s.W * reach + (ys - 0.5) * 0.6, dz = Math.cos(sweep) * len * 0.92, dx = -Math.sin(sweep) * len * 0.92;
        var yt = st.furl ? ys * 0.7 + 1.2 : 0.6 + lift * 3.0;
        var a = [x, ys, side * hw], b = [x + dx, yt, side * (hw + dz)];
        grp.add(rod(a, b, 0.32, 0.3, C.oar, 5));
        // 노깃
        var bl = new T.Mesh(new T.BoxGeometry(2.6, 0.25, 1.1), C.oar);
        bl.position.set(b[0] + dx * 0.04, b[1], b[2] + side * dz * 0.04); bl.rotation.y = -sweep * side; bl.castShadow = true; grp.add(bl);
      });
    }
    return grp;
  };

  // ───────────────────────────────── 물결(잔물결·선수 포말·물살 자국) — 수면에 붙은 반투명 띠
  Ship.prototype.buildWater = function (st) {
    var s = this.s, h = this.h, grp = new T.Group(), mat = this.C.foam, pow = st.power, ph = st.phase || 0;
    function ribbon(pts, w0, w1, a0, a1, y) {
      var pos = [], col = [], idx = [], n = pts.length;
      for (var i = 0; i < n; i++) {
        var p = pts[i], q2 = pts[Math.min(n - 1, i + 1)], p0 = pts[Math.max(0, i - 1)];
        var dx = q2[0] - p0[0], dz = q2[1] - p0[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, t = i / (n - 1), w = lerp(w0, w1, t), a = lerp(a0, a1, t) * Math.sin(PI * Math.min(1, t * 4 + 0.05));
        pos.push(p[0] + nx * w, y, p[1] + nz * w, p[0] - nx * w, y, p[1] - nz * w);
        col.push(0.92, 0.97, 0.95, a, 0.92, 0.97, 0.95, a);
        if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 4));
      g.setIndex(idx);
      var m = new T.Mesh(g, mat); m.renderOrder = -1; grp.add(m);
    }
    if (s.hull === 'raft') { /* 뗏목도 같은 규칙 */ }
    var xb = h.xb0, xs = h.xs0, L = s.L, B = h.B;
    var sideOut = function (u) { return h.half(u, 0.2) + 0.6; };
    // 선체 둘레 잔물결(정박·표류에 잘 보임)
    for (var r = 0; r < 2; r++) {
      var off = 1.2 + r * 2.4 + (0.6 + 0.6 * Math.sin(ph + r * 1.7)) * 1.2, a = (0.20 - r * 0.07) * (1 - pow * 0.4);
      [1, -1].forEach(function (side) {
        var pts = []; for (var i = 0; i <= 24; i++) { var u = i / 24; pts.push([h.X(u, 0) + (u > 0.97 ? off * 0.6 : u < 0.03 ? -off * 0.4 : 0), side * (sideOut(u) + off)]); }
        ribbon(pts, 0.35, 0.35, a, a, 0.15);
      });
    }
    if (pow > 0.1) {
      // 선수 포말: 이물에서 양옆으로 퍼진다
      [1, -1].forEach(function (side) {
        var pts = [], kick = 0.5 + 0.5 * Math.sin(ph + side * 0.8);
        for (var i = 0; i <= 14; i++) { var t = i / 14, u = 1 - t * 0.55; pts.push([h.X(u, 0) + 1.2 - t * 2, side * (sideOut(u) + t * (2 + 4 * pow) + kick * pow * 0.8 * t)]); }
        ribbon(pts, 0.6 + 1.0 * pow, 0.4, 0.55 * pow + 0.1, 0.05, 0.2);
        // 뒤로 퍼지는 물살 자국
        var tw = [], spread = B * (0.65 + 0.45 * pow);
        for (var j = 0; j <= 12; j++) { var t2 = j / 12; tw.push([lerp(xs + 2, xs - L * (0.05 + 0.04 * pow), t2), side * lerp(h.half(0.02, 0.2) * 0.6, spread, t2)]); }
        ribbon(tw, 0.5 + 0.8 * pow, 1.2 + pow, 0.45 * pow, 0.02, 0.18);
      });
      // 선미 바로 뒤 흰 물
      var pts2 = []; for (var k = 0; k <= 8; k++) { var t3 = k / 8; pts2.push([xs - 1 - t3 * L * 0.05 * (0.5 + pow), Math.sin(ph * 2 + t3 * 6) * 0.6]); }
      ribbon(pts2, h.half(0.01, 0.2) * 0.5 + 0.5, 1.6 + 1.6 * pow, 0.35 * pow, 0.0, 0.17);
    }
    return grp;
  };

  M.FORMS = FORMS;
  M.init = function (three) { T = three; };
})(window);

/* 선박 미술 보강에 쓰는 공용 목재·돛천 재질. */
(function(root){'use strict';
  root.ShipArtMaterials={make:function(ship,T,look){
    var C=ship.C,TX=root.Ship3DTex;
    function color(v) { return new T.Color(v).convertSRGBToLinear(); }
    function material(v, rough) { return new T.MeshStandardMaterial({ color: color(v), roughness: rough || .75, side: T.DoubleSide }); }
    function texture(cv) {
      var t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding;
      t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; return t;
    }
    function wood(base, rows, seed, seam) {
      var map = texture(TX.planks({ w: 1024, h: 1024, color: base, seam: seam, rows: rows,
        seed: seed, minLen: 260, varLen: 340, seamW: 2, seamA: .68, clinker: !!ship.q.clinker && base === look.hull }));
      return new T.MeshStandardMaterial({ map: map, bumpMap: map, bumpScale: look.woodRelief,
        roughness: .72, side: T.DoubleSide });
    }
    var M = ship.M = Object.assign({}, ship.M, {
      hull: wood(look.hull, 22, 37, '#28160f'), deck: wood(look.deck, 18, 48, '#483629'),
      inner: wood(look.inner, 20, 18, '#322318'), dark: material(look.wales, .68),
      mid: material(look.hull), deckc: material(look.deck)
    });
    var paint = material(look.paint, .6), gold = C.brass, rope = C.rope, iron = C.iron;
    C.mast.color.copy(color(look.mast)); C.spar.color.copy(color(look.mast));
    C.rope.color.copy(color(look.rope));
    C.boltRope = material(look.boltRope, .94);
    C.glass.color.copy(color('#243e43')); C.glass.specular.setHex(0xb4d8df);

    // 각 폭의 색 차이, 겹솔기, 리프 밴드, 모서리 보강천을 하나의 지도에 그린다.
    var clothCache = {};
    function cloth(kind) {
      if (clothCache[kind]) return clothCache[kind];
      var triangle = kind === 'lat', woven = kind === 'mat', battens = kind === 'bat';
      var cv = document.createElement('canvas'); cv.width = cv.height = 1024;
      var g = cv.getContext('2d'), r = TX.rng(triangle ? 74 : 73), n = triangle ? 11 : 12;
      g.fillStyle = look.sail; g.fillRect(0, 0, 1024, 1024);
      for (var i = 0; i < n; i++) {
        var x = i * 1024 / n;
        g.fillStyle = 'rgba(113,85,49,' + (.018 + r() * .035) + ')'; g.fillRect(x, 0, 1024 / n, 1024);
        var shade = g.createLinearGradient(x, 0, x + 1024 / n, 0);
        shade.addColorStop(0, 'rgba(74,54,31,.14)'); shade.addColorStop(.10, 'rgba(255,251,234,.08)');
        shade.addColorStop(.82, 'rgba(116,91,55,0)'); shade.addColorStop(1, 'rgba(116,91,55,.055)');
        g.fillStyle = shade; g.fillRect(x, 0, 1024 / n, 1024);
        g.fillStyle = 'rgba(90,69,43,.25)'; g.fillRect(x, 0, 2, 1024);
        g.strokeStyle = 'rgba(88,69,45,.27)'; g.lineWidth = 1; g.setLineDash([3, 5]);
        g.beginPath(); g.moveTo(x + 5, 0); g.lineTo(x + 5, 1024); g.stroke(); g.setLineDash([]);
      }
      for (var k = 0; k < 12000; k++) {
        g.fillStyle = k % 2 ? 'rgba(255,255,242,.06)' : 'rgba(74,60,42,.045)';
        g.fillRect(r() * 1024, r() * 1024, 1, 2 + r() * 5);
      }
      if (woven || battens) {
        for (var wy = 0; wy < 1024; wy += woven ? 5 : 12) { g.fillStyle = 'rgba(82,58,25,.12)'; g.fillRect(0, wy, 1024, 1); }
        for (var wx = 0; wx < 1024; wx += woven ? 7 : 16) { g.fillStyle = 'rgba(255,239,192,.12)'; g.fillRect(wx, 0, 1, 1024); }
      }
      // UV의 아래쪽(v=1)이 실제 돛 발끝이다. CanvasTexture의 flipY를 감안한다.
      var age = g.createLinearGradient(0, 0, 0, 1024);
      age.addColorStop(0, 'rgba(99,75,39,.16)'); age.addColorStop(.17, 'rgba(99,75,39,.015)'); age.addColorStop(1, 'rgba(99,75,39,.025)');
      g.fillStyle = age; g.fillRect(0, 0, 1024, 1024);
      // 모서리의 겹천과 부분 수선. 모든 폭을 똑같이 더럽히지 않는다.
      function patch(x,y,w,h,alpha){
        g.fillStyle='rgba(137,109,68,'+alpha+')';g.fillRect(x,y,w,h);
        g.strokeStyle='rgba(94,72,43,.34)';g.lineWidth=1.5;g.setLineDash([4,4]);g.strokeRect(x+4,y+4,w-8,h-8);g.setLineDash([]);
        g.strokeStyle='rgba(255,247,220,.32)';g.beginPath();g.moveTo(x,y+h);g.lineTo(x+w,y+h);g.stroke();
      }
      if(!woven){
        patch(172,triangle?350:196,84,128,.12);patch(692,triangle?110:720,78,103,.09);
        if(!battens)[0,1].forEach(function(side){
          g.save();g.translate(side?1024:0,0);g.scale(side?-1:1,1);
          [160,112,64].forEach(function(size){g.fillStyle='rgba(137,110,69,.05)';g.beginPath();g.moveTo(0,0);g.lineTo(size,0);g.lineTo(0,size);g.closePath();g.fill();
            g.strokeStyle='rgba(111,86,51,.25)';g.setLineDash([3,4]);g.stroke();});g.restore();
        });
      }
      if (!triangle && !woven && !battens) {
        [.59, .78].forEach(function (v) {
          var y = v * 1024;
          g.fillStyle = 'rgba(154,130,90,.14)'; g.fillRect(0, y - 6, 1024, 12);
          g.strokeStyle = 'rgba(109,88,57,.24)'; g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke();
          for (var x = 32; x < 1024; x += 52) {
            g.strokeStyle = 'rgba(83,64,41,.48)'; g.lineWidth = 2;
            g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 2, y - 8, x + 2, y - 15); g.stroke();
          }
        });
        [[0, 0], [1024, 0], [0, 1024], [1024, 1024]].forEach(function (p) {
          g.fillStyle = 'rgba(154,126,80,.10)'; g.beginPath(); g.moveTo(p[0], p[1]);
          g.lineTo(p[0] + (p[0] ? -100 : 100), p[1]); g.lineTo(p[0], p[1] + (p[1] ? -100 : 100)); g.closePath(); g.fill();
        });
      }
      g.strokeStyle = 'rgba(102,79,44,.58)'; g.lineWidth = 9; g.strokeRect(4.5, 4.5, 1015, 1015);
      g.strokeStyle = 'rgba(255,240,199,.6)'; g.lineWidth = 2; g.strokeRect(9, 9, 1006, 1006);
      var map = texture(cv); map.wrapS = map.wrapT = T.ClampToEdgeWrapping;
      return (clothCache[kind] = new T.MeshStandardMaterial({ map: map, bumpMap: map, bumpScale: look.clothRelief,
        roughness: .97, side: T.DoubleSide, emissive: color('#1d170e'), emissiveIntensity: .28 }));
    }
    ship.artCloth=cloth;
    return {M:M,paint:paint,cloth:cloth,texture:texture,material:material,color:color};
  }};
})(window);

/* 실시간 갤리온 전용 미술. 공용 36종 모형과 스프라이트 제작에는 적용하지 않는다.
   외부 파일 없이 목재·돛천을 만들고, 정적 장식은 런타임에서 재질별로 합친다. */
(function (root) {
  'use strict';
  root.GalleonDetail = { enrich: function (ship, T, cfg) {
    var h = ship.h, s = ship.s, C = ship.C, TX = root.Ship3DTex, PI = Math.PI;
    var look = cfg.art, mix = function (a, b, t) { return a + (b - a) * t; };
    var art = root.ShipArtMaterials.make(ship, T, look), M = art.M, paint = art.paint;
    var gold = C.brass, rope = C.rope, iron = C.iron, squareCloth = art.cloth('sq'), lateenCloth = art.cloth('lat');
    var baseSq = ship.sqSurface, baseLat = ship.lateen;
    ship.sqSurface = function (grp, mx, yT, yB, spT, spB, brace, bill, st) {
      return baseSq.call(this, grp, mx, yT, yB, spT, spB, brace, bill, st, squareCloth, 24, 16);
    };
    ship.lateen = function (grp) {
      baseLat.apply(this, arguments);
      grp.children[grp.children.length - 1].traverse(function (o) {
        if (o.isMesh && o.material.map) { o.material = lateenCloth; o.userData.galleonSail = true; }
      });
    };

    function mesh(g, m, p, parent) {
      var o = new T.Mesh(g, m); if (p) o.position.set(p[0], p[1], p[2]);
      o.castShadow = o.receiveShadow = true; parent.add(o); return o;
    }
    function box(parent, x, y, z, a, b, c, m) { return mesh(new T.BoxGeometry(a, b, c), m, [x, y, z], parent); }
    function rod(parent, a, b, rad, m, tip, sides) {
      var va = new T.Vector3().fromArray(a), vb = new T.Vector3().fromArray(b), d = vb.clone().sub(va);
      var o = mesh(new T.CylinderGeometry(tip == null ? rad : tip, rad, d.length(), sides || 6), m, null, parent);
      o.position.copy(va.add(vb).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return o;
    }
    function path(parent, pts, r, m, sides) { for (var i = 1; i < pts.length; i++) rod(parent, pts[i - 1], pts[i], r, m, r, sides || 4); }
    function torus(parent, x, y, z, r, thick, m, rx) {
      var o = mesh(new T.TorusGeometry(r, thick, 4, 16), m, [x, y, z], parent); o.rotation.x = rx || 0; return o;
    }
    function deckY(x) { return h.deckY(h.U(x, h.H)); }
    function sideStrip(parent, a, b, height, lower, upper, inset, m) {
      [1, -1].forEach(function (side) {
        var p = [], uv = [], idx = [], n = 36;
        for (var i = 0; i <= n; i++) {
          var u = mix(a, b, i / n);
          [lower, upper].forEach(function (off) {
            var y = h.sheer(u) + height + off;
            p.push(h.X(u, y), y, side * (h.half(u, y) * inset + .28)); uv.push(i / n, off === lower ? 0 : 1);
          });
          if (i < n) { var q = i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
        }
        var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); mesh(g, m, null, parent);
      });
    }
    function rail(parent, a, b, height, inset, count) {
      [1, -1].forEach(function (side) {
        var points = [];
        for (var i = 0; i <= count; i++) {
          var u = mix(a, b, i / count), y = h.sheer(u) + height + .05;
          var x = h.X(u, y), z = side * (h.half(u, y) * inset - .45);
          rod(parent, [x, y, z], [x, y + 2.35, z], .25, M.deckc, .20);
          rod(parent, [x, y + .7, z], [x, y + 1.35, z], .39, M.mid, .39);
          points.push([x, y + 2.65, z]);
        }
        path(parent, points, .43, M.dark, 6); path(parent, points.map(function (p) { return [p[0], p[1] + .18, p[2]]; }), .14, gold);
      });
    }
    // 둥근 창 윗부분과 가는 황동 창살.
    function windowFrame(parent, p, w, ht, rot) {
      var group = new T.Group(); group.position.fromArray(p); group.rotation.y = rot; parent.add(group);
      var shape = new T.Shape(); shape.moveTo(-w / 2, -ht / 2); shape.lineTo(w / 2, -ht / 2);
      shape.lineTo(w / 2, ht * .12); shape.absarc(0, ht * .12, w / 2, 0, PI, false); shape.closePath();
      mesh(new T.ShapeGeometry(shape, 8), C.glass, [0, 0, .12], group);
      var outline = [[-w / 2, -ht / 2, .22], [w / 2, -ht / 2, .22], [w / 2, ht * .12, .22]];
      for (var j = 0; j <= 8; j++) outline.push([Math.cos(j * PI / 8) * w / 2, ht * .12 + Math.sin(j * PI / 8) * w / 2, .22]);
      outline.push(outline[0]); path(group, outline, .17, gold);
      rod(group, [0, -ht / 2, .26], [0, ht * .12 + w / 2, .26], .09, gold);
      rod(group, [-w / 2, -ht * .06, .26], [w / 2, -ht * .06, .26], .09, gold);
      box(group, 0, -ht / 2 - .3, .3, w + .8, .4, .8, M.dark);
    }
    function stairs(parent, x, y, z, up, run, width, direction) {
      var n = Math.ceil(up / 1.25);
      for (var i = 0; i <= n; i++) box(parent, x + direction * run * i / n, y + up * i / n, z, run / n + .25, .35, width, M.deckc);
      [-1, 1].forEach(function (side) {
        var zz = z + side * width * .5;
        rod(parent, [x, y - .35, zz], [x + direction * run, y + up - .35, zz], .33, M.dark);
        rod(parent, [x, y, zz], [x, y + 3.1, zz], .23, M.mid);
        rod(parent, [x + direction * run, y + up, zz], [x + direction * run, y + up + 3.1, zz], .23, M.mid);
        rod(parent, [x, y + 3.1, zz], [x + direction * run, y + up + 3.1, zz], .25, M.dark);
      });
    }
    function fittings(grp) {
      // 구멍의 어둠이 남도록 격자 덮개 아래에 어두운 바닥을 둔다.
      [-5, 29].forEach(function (x) {
        var y = deckY(x) + .55, w = x < 0 ? 10 : 7, l = x < 0 ? 14 : 9;
        box(grp, x, y, 0, l, .6, w, M.dark);
        [-1,1].forEach(function(side){box(grp,x+side*l*.5,y+.4,0,.65,1.3,w+.8,M.hull);box(grp,x,y+.4,side*w*.5,l+.6,1.3,.65,M.hull);box(grp,x,y+1.1,side*w*.5,l+1,.18,.8,M.deckc);});
        for (var zz = -w * .45; zz <= w * .45; zz += 1.1) box(grp, x, y + .48, zz, l - .5, .3, .27, M.deckc);
        for (var xx = -l * .45; xx <= l * .45; xx += 1.2) box(grp, x + xx, y + .45, 0, .28, .3, w - .4, M.deckc);
      });
      // 캡스턴과 여덟 개의 손잡이.
      var x = -24, y = deckY(x);
      rod(grp, [x, y, 0], [x, y + 3.5, 0], 1.35, M.mid, 1.1, 10);
      rod(grp, [x, y + 2.6, 0], [x, y + 3.1, 0], 1.7, iron, 1.7, 10);
      for (var k = 0; k < 8; k++) { var a = k * PI / 4; rod(grp, [x, y + 2.8, 0], [x + Math.cos(a) * 4.2, y + 2.8, Math.sin(a) * 4.2], .2, M.deckc); }
      // 선루로 오르는 두 계단. 계단 도착점의 갑판 높이를 맞춘다.
      var top = h.sheer(.33) + h.H * .62 - 2.4, edge = h.X(.33, top);
      stairs(grp, edge + 12, deckY(edge + 12), -8, top - deckY(edge + 12), 12, 4.2, -1);
      var top2 = h.sheer(.1914) + h.H * 1.10 - 2.2, edge2 = h.X(.1914, top2);
      stairs(grp, edge2 + 10, h.sheer(.26) + h.H * .62 - 2.4, 7, top2 - (h.sheer(.26) + h.H * .62 - 2.4), 10, 3.8, -1);
      // 물통 세 개: 휘어진 판재와 철제 띠.
      [[-15, -11], [-19, -11], [36, 8]].forEach(function (p) {
        var yy = deckY(p[0]) + 2, g = new T.CylinderGeometry(1.35, 1.35, 3.7, 10, 4), pos = g.attributes.position;
        for (var i = 0; i < pos.count; i++) { var swell = 1 + .16 * (1 - Math.pow(pos.getY(i) / 1.85, 2)); pos.setX(i, pos.getX(i) * swell); pos.setZ(i, pos.getZ(i) * swell); }
        g.computeVertexNormals(); mesh(g, M.hull, [p[0], yy, p[1]], grp);
        [-1.25, 1.25].forEach(function (off) { torus(grp, p[0], yy + off, p[1], 1.46, .14, iron, PI / 2); });
      });
      // 갑판 가장자리에 놓인 구명정: 열린 안쪽, 늑골, 세 개의 벤치.
      var boat = new T.Group(), bx = 1, by = deckY(bx) + .7; boat.position.set(bx, by, 10); grp.add(boat);
      var vertices = [], indices = [], uv = [], seg = 28;
      for (var i = 0; i <= seg; i++) {
        var a = i * PI * 2 / seg, xx = Math.cos(a) * 9, zz = Math.sin(a) * 2.9;
        vertices.push(xx * .84, .3, zz * .45, xx, 2.6 + Math.abs(Math.cos(a)) * .7, zz); uv.push(i / seg * 2, 0, i / seg * 2, 1);
        if (i < seg) { var b = i * 2; indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
      var bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); bg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); bg.setIndex(indices); bg.computeVertexNormals(); mesh(bg, M.inner, null, boat);
      box(boat, 0, .35, 0, 14, .3, 2.5, M.dark);
      var lip = []; for (var j = 0; j <= seg; j++) { var a = j * PI * 2 / seg; lip.push([Math.cos(a) * 9, 2.6 + Math.abs(Math.cos(a)) * .7, Math.sin(a) * 2.9]); }
      path(boat, lip, .22, M.deckc);
      [-4, 0, 4].forEach(function (x) { box(boat, x, 2.1, 0, .9, .25, 4.9, M.deckc); });
      [-30, 39].forEach(function (x) { for (var k = 0; k < 3; k++) torus(grp, x, deckY(x) + .2 + k * .14, 9, 1.5 - k * .27, .16, rope, PI / 2); });
    }
    function decorations(grp) {
      var h1 = h.H * .62, h2 = h.H * .48;
      sideStrip(grp, .008, .325, 0, h1 * .24, h1 - 1.2, .98, paint);
      sideStrip(grp, .008, .189, h1, h2 * .18, h2 - 1.2, .95, paint);
      [.25, .85].forEach(function (k) { sideStrip(grp, .01, .323, 0, h1 * k, h1 * k + .25, .985, gold); });
      sideStrip(grp, .76, .93, 0, h.H * .24, h.H * .34, .967, paint);
      rail(grp, .012, .185, h1 + h2, .95, 12);
      rail(grp, .197, .323, h1, .98, 8);
      rail(grp, .345, .745, 0, 1, 18);
      rail(grp, .77, .925, h.H * .42, .96, 10);
      [1, -1].forEach(function (side) {
        // 옆 회랑의 지붕·주춧돌, 창틀과 창 사이의 금박 기둥.
        [.07, .115, .21, .27].forEach(function (u) {
          var y = h.sheer(u) + h1 * .57, x = h.X(u, y), z = side * (h.half(u, y) * .98 + .6);
          windowFrame(grp, [x, y, z], 2.3, 3.7, side > 0 ? 0 : PI);
        });
        [.035, .185, .305].forEach(function (u) {
          var y = h.sheer(u) + h1 * .56, x = h.X(u, y), z = side * (h.half(u, y) * .985 + .5);
          rod(grp, [x, y - 3.4, z], [x, y + 3.5, z], .28, gold, .24);
          box(grp, x, y + 3.5, z, 1.2, .5, .65, gold);
        });
        var u = .1485, y = h.sheer(u) + h1 * .4, x = h.X(u, y), z = side * (h.half(u, y) * .98 + 1.7);
        windowFrame(grp, [x, y, z + side * .15], 3.1, 4.2, side > 0 ? 0 : PI);
        box(grp, x, y - 3.1, z, 6.8, .7, 3.2, gold);
        box(grp, x, y + 3.5, z - side * .5, 6.6, .6, 3.8, M.dark);
        // 선미루의 마름모 무늬. 작게 보아도 반복되는 금색 점이 남는다.
        for (var k = 0; k < 8; k++) {
          var u = .022 + k * .021, y = h.sheer(u) + h1 + h2 * .55;
          var mark = box(grp, h.X(u, y), y, side * (h.half(u, y) * .95 + .4), .9, 1.25, .24, gold); mark.rotation.z = PI / 4;
        }
        // 포문 덮개, 포신의 테와 현측 사다리.
        for (var k = 0; k < 6; k++) {
          var x = -s.L * .22 + k * s.L * .48 / 5, u = h.U(x, h.H * .5), y = h.sheer(u) * .5;
          var z = side * (h.half(u, y) + .4), size = 2.7;
          var lid = box(grp, x, y + 2.15, z + side * .7, 3.4, .3, 2.4, M.mid); lid.rotation.x = side * -.45;
          torus(grp, x, y, z + side * 2.7, .54, .12, iron);
        }
        // 선수에 걸어둔 닻과 고정줄.
        var ax = 58, ay = h.sheer(h.U(ax, h.H)) - 3, az = side * (h.half(h.U(ax, h.H), ay) + 1.3);
        var anchor = new T.Group(); anchor.position.set(ax, ay, az); anchor.rotation.z = side * -.28; grp.add(anchor);
        rod(anchor, [0, 2, 0], [0, -6, 0], .38, iron);
        rod(anchor, [-2.8, .7, 0], [2.8, .7, 0], .4, M.dark);
        path(anchor, [[-3, -3.5, 0], [-2.3, -5.2, 0], [0, -6, 0], [2.3, -5.2, 0], [3, -3.5, 0]], .35, iron, 6);
        torus(anchor, 0, 2.7, 0, .75, .17, iron);
        rod(grp, [ax, ay + 2.7, az], [ax - 4, ay + 5, az - side * 2], .2, rope);
      });
      // 선미의 뒤로 기운 면을 따라 도색과 창을 배치한다.
      var ya = h.sheer(0) + h1 * .23, yb = h.sheer(0) + h1 + h2 * .84;
      var pts = [], uv = [], ids = [];
      for (var j = 0; j <= 6; j++) {
        var y = mix(ya, yb, j / 6), w = h.half(.002, y) * .955;
        pts.push(h.X(0, y) - .45, y, -w, h.X(0, y) - .45, y, w); uv.push(0, j / 6, 1, j / 6);
        if (j < 6) { var b = j * 2; ids.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
      var geom = new T.BufferGeometry(); geom.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); geom.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geom.setIndex(ids); geom.computeVertexNormals(); mesh(geom, paint, null, grp);
      [h1 * .58, h1 + h2 * .48].forEach(function (off, row) {
        var y = h.sheer(0) + off, w = h.half(.002, y) * .78, x = h.X(0, y) - 1.2;
        [-1, 0, 1].forEach(function (k) { windowFrame(grp, [x, y, k * w * .72], row ? 2.6 : 3, 4.1, -PI / 2); });
        rod(grp, [x - .1, y - 3, -w * 1.17], [x - .1, y - 3, w * 1.17], .3, gold);
      });
      var y = h.sheer(0) + h1 * .35, x = h.X(0, y) - 2, w = h.half(.002, y);
      box(grp, x - .7, y - .5, 0, 3.5, .7, w * 2, M.deckc);
      rod(grp, [x - 2.2, y + 2, -w], [x - 2.2, y + 2, w], .3, gold);
      for (var k = -5; k <= 5; k++) rod(grp, [x - 2.2, y, k * w / 5], [x - 2.2, y + 2, k * w / 5], .17, M.deckc);
      // 작은 선미 등. 발광은 유리 재질에만 두어 밤에도 과장되지 않는다.
      var ly = h.sheer(0) + h1 + h2 + 4, lx = h.X(0, ly) - .8;
      rod(grp, [lx, ly - 4, 0], [lx, ly + 1.8, 0], .25, gold);
      box(grp, lx, ly, 0, 1.5, 2.1, 1.5, C.glass);
      [-1, 1].forEach(function (side) { rod(grp, [lx + side * .85, ly - 1.1, -.85], [lx + side * .85, ly + 1.1, -.85], .13, gold); rod(grp, [lx + side * .85, ly - 1.1, .85], [lx + side * .85, ly + 1.1, .85], .13, gold); });
      mesh(new T.ConeGeometry(1.5, 1.3, 4), gold, [lx, ly + 1.6, 0], grp);
    }
    function deadeyes(grp) {
      s.masts.forEach(function (mx, i) {
        [1, -1].forEach(function (side) {
          for (var k = 0; k < 4; k++) {
            var x = mx - 1.5 - k * 2.2, u = h.U(x, h.H), y = h.sheer(u), z = side * (h.half(u, y) + .65);
            rod(grp, [x, y - 3.5, z - side * .5], [x, y + .5, z], .15, iron);
            var wheel = mesh(new T.CylinderGeometry(.54, .54, .4, 8), M.dark, [x, y + .7, z], grp); wheel.rotation.x = PI / 2;
            var upper = mesh(new T.CylinderGeometry(.54, .54, .4, 8), M.dark, [x, y + 2.25, z - side * .5], grp); upper.rotation.x = PI / 2;
            [-.22, .22].forEach(function (dx) { rod(grp, [x + dx, y + .7, z], [x + dx, y + 2.25, z - side * .5], .09, rope); });
          }
        });
      });
    }
    var baseHull = ship.buildHull;
    ship.buildHull = function () {
      var grp = baseHull.call(this); decorations(grp); fittings(grp); deadeyes(grp); return grp;
    };
    return ship;
  }};
})(window);

/* 35종의 선형·문화권별 미술 보강. 갤리온은 승인된 별도 모형을 유지한다. */
(function(root){
  'use strict';
  root.FleetDetail={enrich:function(ship,T,look,profile){
    var s=ship.s,h=ship.h,q=ship.q,C=ship.C,art=root.ShipArtMaterials.make(ship,T,look),M=art.M;
    var paint=art.paint,wood=M.deckc,dark=M.dark,gold=C.brass,rope=C.rope,PI=Math.PI,levels=[];
    var trim=profile.family==='west'||profile.family==='dhow'?gold:wood;
    C.red.color.copy(art.color(look.paint));
    // 장갑판·기와·초가에도 표면 깊이를 준다. 통나무는 널빤지 재질로 바꾸지 않는다.
    ['roof','thatch','plates','wallJ','wallK'].forEach(function(k){C[k]=C[k].clone();if(C[k].map){C[k].bumpMap=C[k].map;C[k].bumpScale=look.woodRelief;}});
    function mesh(g,m,p,parent){var o=new T.Mesh(g,m);if(p)o.position.fromArray(p);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
    function box(g,x,y,z,w,ht,d,m){return mesh(new T.BoxGeometry(w,ht,d),m,[x,y,z],g);}
    function rod(g,a,b,r,m,tip,n){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),v=B.clone().sub(A);
      var o=mesh(new T.CylinderGeometry(tip==null?r:tip,r,v.length(),n||5),m,null,g);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
    function line(g,pts,r,m){for(var i=1;i<pts.length;i++)rod(g,pts[i-1],pts[i],r,m);}
    function ring(g,x,y,z,r,m,axis){var o=mesh(new T.TorusGeometry(r,.15,4,14),m,[x,y,z],g);if(axis==='y')o.rotation.x=PI/2;if(axis==='x')o.rotation.y=PI/2;return o;}
    function deck(x){return h.deckY(h.U(x,h.H));}
    function strip(g,a,b,yf,height,inset,m){
      [1,-1].forEach(function(side){var p=[],uv=[],ix=[],n=28;
        for(var i=0;i<=n;i++){var u=a+(b-a)*i/n,y=yf(u);[-height/2,height/2].forEach(function(off){p.push(h.X(u,y+off),y+off,side*(h.half(u,y+off)*inset+.25));uv.push(i/n,off>0?1:0);});
          if(i<n){var j=i*2;ix.push(j,j+1,j+2,j+1,j+3,j+2);}}
        var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();mesh(geo,m,null,g);
      });
    }
    function rail(g,a,b,yf,inset,n,height){
      [1,-1].forEach(function(side){var top=[],mid=[];
        for(var i=0;i<=n;i++){var u=a+(b-a)*i/n,y=yf(u),x=h.X(u,y),z=side*(h.half(u,y)*inset-.4);
          rod(g,[x,y,z],[x,y+height,z],.24,wood,.2);top.push([x,y+height,z]);mid.push([x,y+height*.42,z]);
          if(i%2===0)box(g,x,y+height+.15,z,.65,.35,.65,trim);
        }line(g,top,.33,dark);line(g,mid,.16,wood);
      });
    }
    function windowFrame(g,x,y,z,w,ht,side){
      var o=new T.Group();o.position.set(x,y,z);o.rotation.y=side>0?0:PI;g.add(o);
      box(o,0,0,0,w,ht,.25,C.glass);
      [-1,1].forEach(function(a){box(o,a*w/2,0,.2,.2,ht+.3,.3,trim);box(o,0,a*ht/2,.2,w+.3,.2,.3,trim);});
      box(o,0,0,.26,.12,ht,.2,trim);box(o,0,0,.26,w,.12,.2,trim);
      if(profile.family==='junk'||profile.family==='korean')[-.25,.25].forEach(function(a){box(o,a*w,0,.3,.10,ht,.2,wood);});
    }
    function hatch(g,x,z,len,w,y){
      box(g,x,y+.35,z,len,.7,w,dark);
      [-1,1].forEach(function(side){box(g,x+side*len*.5,y+.75,z,.65,1.5,w+1.1,M.hull);box(g,x,y+.75,z+side*w*.5,len+.65,1.5,.65,M.hull);
        box(g,x,y+1.55,z+side*w*.5,len+1.1,.2,.8,wood);});
      for(var a=-w*.44;a<=w*.44;a+=1.4)box(g,x,y+.86,z+a,len-.5,.25,.23,wood);
      for(var a=-len*.43;a<=len*.43;a+=1.6)box(g,x+a,y+.85,z,.22,.25,w-.4,wood);
    }
    function barrel(g,x,z,y,r){
      var geo=new T.CylinderGeometry(r*.85,r*.85,r*2.5,10,4),p=geo.attributes.position;
      for(var i=0;i<p.count;i++){var swell=1+.18*(1-Math.pow(p.getY(i)/(r*1.25),2));p.setX(i,p.getX(i)*swell);p.setZ(i,p.getZ(i)*swell);}geo.computeVertexNormals();
      mesh(geo,M.hull,[x,y+r*1.25,z],g);[-.75,.75].forEach(function(a){ring(g,x,y+r*(1.25+a),z,r*.96,C.iron,'y');});
      box(g,x,y+r*2.52,z,r*1.3,.15,.18,dark);
    }
    function stairs(g,x,y,z,up,run,w,dir){
      var n=Math.max(3,Math.ceil(up/1.35));for(var i=0;i<=n;i++)box(g,x+dir*run*i/n,y+up*i/n,z,run/n+.2,.3,w,wood);
      [-1,1].forEach(function(side){var zz=z+side*w*.5;rod(g,[x,y-.3,zz],[x+dir*run,y+up-.3,zz],.3,dark);rod(g,[x,y+2.7,zz],[x+dir*run,y+up+2.7,zz],.22,wood);});
    }
    function coil(g,x,z,y,r){for(var i=0;i<3;i++)ring(g,x,y+i*.13,z,r-i*.22,rope,'y');}
    function bollard(g,x,z,y){[-.9,.9].forEach(function(off){rod(g,[x+off,y,z],[x+off,y+2.1,z],.36,dark);});box(g,x,y+1.5,z,3.4,.4,.6,wood);}
    function anchors(g){
      [1,-1].forEach(function(side){var u=.79,y=h.sheer(u)-1.5,x=h.X(u,y),z=side*(h.half(u,y)+1.2),a=new T.Group();a.position.set(x,y,z);a.rotation.z=-.24;g.add(a);
        rod(a,[0,1,0],[0,-5,0],.28,C.iron);rod(a,[-2.5,0,0],[2.5,0,0],.3,dark);
        line(a,[[-2.6,-2.8,0],[-1.8,-4.5,0],[0,-5,0],[1.8,-4.5,0],[2.6,-2.8,0]],.25,C.iron);ring(a,0,1.6,0,.6,C.iron);
        rod(g,[x,y+1.6,z],[x-2,y+4,z-side*1.3],.16,rope);
      });
    }
    // 선루를 만들 때 실제 갑판 높이와 폭을 받아 해당 선종에 맞는 난간·창·도색을 붙인다.
    var castle=ship.castle;
    ship.castle=function(g,a,b,hc,opt){
      var result=castle.apply(this,arguments),o=opt||{},base=o.base||function(u){return h.sheer(u);},inset=o.inset||.985;
      var upper=function(u){return base(u)+hc;};levels.push({a:a,b:b,hc:hc,base:base,top:upper,inset:inset});
      rail(g,a+.008,b-.008,upper,inset,Math.max(5,Math.round((b-a)*45)),2.1);
      strip(g,a+.008,b-.008,function(u){return upper(u)-hc*.42;},hc*.46,inset,paint);
      strip(g,a+.008,b-.008,function(u){return upper(u)-.7;},.26,inset+.005,trim);
      if(hc>5)[1,-1].forEach(function(side){var count=Math.max(2,Math.round((b-a)*15));
        for(var i=0;i<count;i++){var u=a+(b-a)*(i+1)/(count+1),y=base(u)+hc*.52;windowFrame(g,h.X(u,y),y,side*(h.half(u,y)*inset+.5),2,Math.min(3.4,hc*.43),side);}
      });return result;
    };
    // 기와·초가집: 기둥, 창호, 처마 받침과 지붕 마감. 지붕의 위치는 원본에서 받는다.
    var house=ship.roofHouse;
    ship.roofHouse=function(g,x0,x1,hw,y,hh,roof,eave,wall){
      house.apply(this,arguments);var n=Math.max(2,Math.round((x1-x0)/7)), post=profile.family==='japanese'?dark:paint;
      [1,-1].forEach(function(side){for(var i=0;i<=n;i++){var x=x0+(x1-x0)*i/n;
        box(g,x,y+hh*.5,side*(hw+.16),.45,hh+.25,.45,post);
        rod(g,[x,y+hh-.8,side*hw],[x,y+hh-.3,side*(hw+1.3)],.16,wood);
      }box(g,(x0+x1)/2,y+hh-.15,side*(hw+.2),x1-x0+.5,.45,.5,post);
        if(hh>3.5)windowFrame(g,(x0+x1)/2,y+hh*.52,side*(hw+.3),Math.min(4,(x1-x0)*.4),hh*.48,side);
      });
    };
    // 천의 종류에 맞는 재질을 쓰고 실시간 모션 어댑터가 찾아갈 수 있게 둔다.
    var sq=ship.sqSurface;
    ship.sqSurface=function(grp,mx,yT,yB,spT,spB,brace,bill,st){return sq.call(this,grp,mx,yT,yB,spT,spB,brace,bill,st,art.cloth(s.hull==='raft'?'mat':'sq'),20,14);};
    ['lateen','batten','tanja','triSurface'].forEach(function(name){var original=ship[name];ship[name]=function(grp){
      original.apply(this,arguments);var group=grp.children[grp.children.length-1];
      group.traverse(function(o){if(o.isMesh&&o.material.map)o.material=art.cloth(name==='batten'?'bat':name==='tanja'?'mat':'lat');});
    };});
    function western(g){
      var sternEnd=levels.length?Math.max.apply(null,levels.filter(function(l){return l.a<.1;}).map(function(l){return l.b;})):0;
      if(!isFinite(sternEnd))sternEnd=0;
      var bowStart=.92;levels.forEach(function(l){if(l.a>.65)bowStart=Math.min(bowStart,l.a);});
      rail(g,Math.max(.07,sternEnd+.025),bowStart-.02,function(u){return h.sheer(u);},1,15,1.6);
      if(profile.kit==='gallery'||profile.kit==='castle'){
        levels.filter(function(l){return l.a<.03;}).forEach(function(l){
          [1,-1].forEach(function(side){for(var i=0;i<6;i++){var u=.02+(l.b-.04)*i/5,y=l.top(u)-1.8;
            var mark=box(g,h.X(u,y),y,side*(h.half(u,y)*l.inset+.45),.7,.9,.2,gold);mark.rotation.z=PI/4;}
          });
          var yy=l.base(0)+l.hc*.5,xx=h.X(0,yy)-.9,w=h.half(.002,yy)*l.inset;
          box(g,xx,yy,0,.5,l.hc*.6,w*1.8,paint);
          for(var i=-1;i<=1;i++){var win=new T.Group();win.position.set(xx-.4,yy,i*w*.58);win.rotation.y=-PI/2;g.add(win);windowFrame(win,0,0,0,2.2,Math.min(3.5,l.hc*.45),1);}
          if(profile.kit==='gallery'){box(g,xx-1,yy-l.hc*.34,0,2.7,.5,w*1.9,wood);rod(g,[xx-2.2,yy-.5,-w],[xx-2.2,yy-.5,w],.23,gold);for(var j=-4;j<=4;j++)rod(g,[xx-2.2,yy-l.hc*.32,j*w/4],[xx-2.2,yy-.5,j*w/4],.13,wood);}
        });
      }
      var first=levels.filter(function(l){return l.a<.03;})[0];
      if(first){var target=first.top(first.b)-Math.min(2.4,first.hc*.22),x=h.X(first.b,target),run=Math.min(11,first.hc*.9),y=deck(x+run);
        if(target>y+1)stairs(g,x+run,y,-s.W*.14,target-y,run,3.7,-1);
      }
      hatch(g,s.L*.12,0,Math.min(12,s.L*.08),Math.min(8,s.W*.2),deck(s.L*.12));anchors(g);
      if(profile.kit==='merchant'){
        var x=-s.L*.04,y=deck(x);box(g,x,y+1,0,s.L*.13,2,s.W*.26,dark);
        for(var i=-2;i<=2;i++)box(g,x+i*2,y+2.1,0,1.8,.25,s.W*.24,wood);
      }
    }
    function mediterranean(g){
      // 노꾼 좌석·노받이와 통로 가장자리. 낮은 배에 큰 성루를 얹지 않는다.
      for(var i=0;i<8;i++){var x=-s.L*.27+i*s.L*.55/7,u=h.U(x,h.H),y=deck(x),w=h.half(u,h.H);
        [1,-1].forEach(function(side){box(g,x,y+.7,side*w*.55,1.4,.55,w*.55,wood);rod(g,[x,h.sheer(u),side*(w+.2)],[x,h.sheer(u)+1.7,side*(w+.2)],.24,dark);});
      }
      if(q.stern==='quarter'){
        for(var i=0;i<4;i++){var u=.04+i*.04,y=h.deckY(u),w=h.half(u,h.sheer(u))*.92,x=h.X(u,y),pts=[];
          for(var j=0;j<=10;j++){var a=PI*j/10;pts.push([x,y+3.3+Math.sin(a)*w*.55,-Math.cos(a)*w]);}line(g,pts,.16,trim);
        }
      }
      strip(g,.03,.94,function(u){return h.sheer(u)-1.2;},.65,1,paint);
      [1,-1].forEach(function(side){bollard(g,s.L*.3,side*s.W*.22,deck(s.L*.3));});
      if(s.cap>150)anchors(g);
    }
    function indian(g){
      rail(g,.27,.88,function(u){return h.sheer(u);},1,16,1.8);
      // 판재 이음에 걸친 야자 끈. 선체 곡면을 따라 작은 사선으로 교차한다.
      [1,-1].forEach(function(side){for(var i=0;i<24;i++){var u=.06+i*.87/23;
        [.38,.67].forEach(function(v){var y=h.sheer(u)*v,x=h.X(u,y),z=side*(h.half(u,y)+.26);
          rod(g,[x-.55,y-.65,z],[x+.55,y+.65,z],.1,rope);rod(g,[x-.55,y+.65,z],[x+.55,y-.65,z],.1,rope);
        });
      }});anchors(g);hatch(g,s.L*.04,0,11,8,deck(s.L*.04));
      var x=-s.L*.06,y=deck(x);box(g,x,y+1.5,s.W*.18,11,3,6,art.cloth('mat'));
      for(var i=-1;i<=1;i++)rod(g,[x+i*3,y+3.1,s.W*.18-3],[x+i*3,y+3.1,s.W*.18+3],.13,rope);
    }
    function asian(g){
      var f=profile.family,upper=s.hull==='panok'?h.H*.95:s.hull==='atake'?h.H*1.15:0;
      if(s.hull!=='turtle')rail(g,upper?.06:.3,.89,function(u){return h.sheer(u)+upper;},s.hull==='panok'?1.08:upper?1.035:1,18,1.7);
      var wallY=s.hull==='panok'?h.H*.75:s.hull==='atake'?h.H*.95:s.hull==='jp'&&s.id==='sekibune'?h.H*.4:0;
      if(wallY){
        var wallInset=s.hull==='panok'?1.085:1.04;
        strip(g,.09,.88,function(u){return h.sheer(u)+wallY;},.8,wallInset,paint);
        [1,-1].forEach(function(side){for(var i=0;i<12;i++){var u=.1+i*.76/11,y=h.sheer(u)+wallY*.6,x=h.X(u,y),z=side*(h.half(u,y)*wallInset+.4);
          box(g,x,y,z,.5,wallY,.5,dark);box(g,x,y+wallY*.4,z,2.2,.35,.6,wood);
        }});
      }
      if(f==='junk'){
        [1,-1].forEach(function(side){var u=.9,y=h.sheer(u)*.74,x=h.X(u,y),z=side*(h.half(u,y)+.5);
          var eye=mesh(new T.SphereGeometry(1.4,10,6),C.white,[x,y,z],g);eye.scale.set(1.2,.7,.2);var pupil=mesh(new T.SphereGeometry(.65,8,5),C.hole,[x+.2,y,z+side*.28],g);pupil.scale.z=.22;
        });
        hatch(g,s.L*.25,0,12,9,deck(s.L*.25));
      }
      if(f==='japanese'){
        var y=h.sheer(.16)+(upper||0),x=h.X(.16,y);
        [-1,1].forEach(function(side){var z=side*s.W*.28;rod(g,[x,y,z],[x,y+9,z],.2,dark);box(g,x,y+6,z+side*.65,.22,5,1.8,C.white);});
      }
      if(s.hull==='turtle'&&!ship.turtleDetail){
        // 기존 쇠못을 보존하면서 용머리의 눈·뿔·수염과 포구의 테를 보강한다.
        var y=h.sheer(1)+h.H*.35,x=h.X(1,y)+.5;
        [1,-1].forEach(function(side){mesh(new T.SphereGeometry(.6,8,6),C.white,[x+1,y+1,side*1.8],g);mesh(new T.SphereGeometry(.28,6,5),C.hole,[x+1.25,y+1.1,side*2.15],g);
          line(g,[[x-1,y+1.5,side],[x-2,y+4.4,side*1.6],[x,y+3.4,side*1.9]],.23,gold);
          line(g,[[x+3,y-.2,side*1.2],[x+4,y-1,side*3],[x+2,y-1.5,side*4]],.18,gold);
        });
        var muzzle=ring(g,x+4,y,0,1.05,C.iron,'x');muzzle.rotation.z=.25;
        strip(g,.08,.88,function(u){return h.sheer(u)+h.H*.3;},.55,1.045,paint);
      }
      if(f==='korean'&&s.hull!=='turtle')hatch(g,s.L*.25,0,10,8,deck(s.L*.25)+upper-(upper?h.H*.4:0));
      if(s.hull!=='turtle'&&f!=='japanese')anchors(g);
    }
    function tropical(g){
      if(s.hull==='raft'){
        var rr=s.W/(9*2.05),y=rr*1.9;
        [-s.L*.3,0,s.L*.25].forEach(function(x){for(var k=0;k<9;k++){var z=-s.W*.47+k*s.W*.94/8;
          var o=ring(g,x,rr*.6,z,rr*1.02,rope,'x');o.scale.y=.95;
        }});
        for(var i=-5;i<=5;i++)rod(g,[-s.L*.31,y+.45,i*3.3],[s.L*.23,y+.45,i*3.3],.23,C.bamboo);
        coil(g,s.L*.18,10,y+1,2);barrel(g,s.L*.1,-9,y+1,1.5);
      }else if(s.hull==='outrigger'){
        var z=s.W*2.25;[-s.L*.24,s.L*.2].forEach(function(x){var y=h.sheer(h.U(x,h.H))+.6;
          [-1,1].forEach(function(side){for(var k=-1;k<=1;k++)ring(g,x+k*.5,y,side*z,.8,rope,'x');
            rod(g,[x-4,y,side*z],[x+4,y,side*(z-6)],.18,rope);});
        });
        strip(g,.08,.92,function(u){return h.sheer(u)-.5;},.7,1,paint);
      }else{rail(g,.29,.88,function(u){return h.sheer(u);},1,16,1.7);hatch(g,-s.L*.02,0,14,10,deck(-s.L*.02));}
    }
    var base=ship.buildHull;
    ship.buildHull=function(){
      var g=base.call(this);
      if(profile.family==='west')western(g);else if(profile.family==='galley')mediterranean(g);else if(profile.family==='dhow')indian(g);
      else if(['junk','korean','japanese'].indexOf(profile.family)>=0)asian(g);else tropical(g);
      if(['turtle','atake','panok','outrigger','raft'].indexOf(s.hull)<0){
        for(var k=0;k<profile.cargo;k++){var x=s.L*(.02+(k%3)*.045),z=(k%2?1:-1)*s.W*.22;barrel(g,x,z,deck(x)+.1,Math.min(1.65,s.W*.035));}
        [-.12,.28].forEach(function(v){coil(g,s.L*v,-s.W*.19,deck(s.L*v)+.3,1.25);});
        bollard(g,s.L*.34,s.W*.12,deck(s.L*.34));
      }
      // 돛대의 감긴 끈과 철제 밑동. 큰 배에는 작은 도르래도 붙인다.
      s.masts.forEach(function(mx){var y=s.hull==='raft'?ship.raftDeck:deck(mx);
        for(var k=0;k<3;k++)ring(g,mx,y+1+k*.35,0,1.15,rope,'y');
        if(s.cap>=250)[1,-1].forEach(function(side){var u=h.U(mx-3,h.H),yy=h.sheer(u),z=side*(h.half(u,yy)+.5);ring(g,mx-3,yy+1,z,.6,dark);rod(g,[mx-3,yy+1,z],[mx-1,y+s.heights[0]*.42,side*.7],.11,rope);});
      });return g;
    };
    ship.artProfile=profile;return ship;
  }};
})(window);

/* 두 번째 미술 보강: 선루의 실제 높이를 따라 조타·닻 설비와 지붕 마감을 붙인다. */
(function(root){'use strict';
  root.ShipFinish={enrich:function(ship,T,profile){
    var s=ship.s,h=ship.h,q=ship.q,C=ship.C,M=ship.M,PI=Math.PI,levels=[],houses=[];
    function mesh(g,geo,m,x,y,z){var o=new T.Mesh(geo,m);o.position.set(x||0,y||0,z||0);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
    function box(g,x,y,z,w,ht,d,m){return mesh(g,new T.BoxGeometry(w,ht,d),m,x,y,z);}
    function rod(g,a,b,r,m,tip){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),v=B.clone().sub(A);
      var o=mesh(g,new T.CylinderGeometry(tip==null?r:tip,r,v.length(),6),m);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
    function line(g,pts,r,m){for(var i=1;i<pts.length;i++)rod(g,pts[i-1],pts[i],r,m);}
    function ring(g,x,y,z,r,m,axis){var o=mesh(g,new T.TorusGeometry(r,.15,4,14),m,x,y,z);if(axis==='y')o.rotation.x=PI/2;if(axis==='x')o.rotation.y=PI/2;return o;}
    var castle=ship.castle;
    ship.castle=function(g,a,b,hc,opt){var o=opt||{};
      levels.push({a:a,b:b,base:o.base||function(u){return h.sheer(u);},hc:hc});return castle.apply(this,arguments);
    };
    function deck(u){
      var y=h.deckY(u);
      levels.forEach(function(l){if(u>=l.a&&u<=l.b)y=Math.max(y,l.base(u)+l.hc-Math.max(.9,Math.min(2.4,l.hc*.22)));});
      if(s.hull==='panok'&&u>.04&&u<.92)y=h.sheer(u)+h.H*.55;
      if(s.hull==='atake'&&u>.05&&u<.92)y=h.sheer(u)+h.H*.85;
      return y;
    }
    function occupied(x){return houses.some(function(a){return x>a.x0-3&&x<a.x1+3;})||s.masts.some(function(mx){return Math.abs(x-mx)<5;});}
    var house=ship.roofHouse;
    ship.roofHouse=function(g,x0,x1,hw,y,hh,roof,eave,wall){
      house.apply(this,arguments);houses.push({x0:x0,x1:x1});
      var ov=Math.min(hw*(eave||.2),3.2),rh=Math.min(hw*.5,2.2+hh*.55),yy=y+hh;
      var tiled=['junk','korean','japanese'].indexOf(profile.family)>=0;
      // 지붕 절단면의 두께, 박공 틀, 처마 밑의 짧은 서까래.
      [x0-ov,x1+ov].forEach(function(x){
        line(g,[[x,yy-ov*.35,-hw-ov],[x,yy+rh,0],[x,yy-ov*.35,hw+ov]],tiled?.36:.25,M.dark);
        rod(g,[x,yy-.12,-hw],[x,yy-.12,hw],.28,M.deckc);
        rod(g,[x,yy,0],[x,yy+rh-.2,0],.23,M.deckc);
      });
      [-1,1].forEach(function(side){
        box(g,(x0+x1)/2,yy-ov*.35-.25,side*(hw+ov),x1-x0+2*ov,.55,.45,M.dark);
        for(var x=x0;x<=x1;x+=3.8)rod(g,[x,yy-.3,side*(hw-.8)],[x,yy-ov*.35-.35,side*(hw+ov)],.18,M.deckc);
      });
      // 전면 문과 작은 문턱. 창호와 함께 벽에 깊이를 만든다.
      if(hh>3.2){var dw=Math.min(3.8,hw*.65),dh=hh*.77;
        box(g,x1+.15,y+dh*.5,0,.28,dh,dw,M.dark);
        [-1,1].forEach(function(side){box(g,x1+.4,y+dh*.5,side*dw*.46,.28,dh,.23,M.deckc);});
        for(var i=-1;i<=1;i++)box(g,x1+.32,y+dh*.48,i*dw*.23,.22,dh*.9,.12,M.mid);
        box(g,x1+.6,y+.15,0,1.5,.3,dw+1,M.deckc);box(g,x1+.3,y+dh,0,.45,.3,dw+.5,M.deckc);
      }
      if(tiled){
        [x0-ov,x1+ov].forEach(function(x,i){var dir=i?1:-1;
          line(g,[[x-dir*1.2,yy+rh+.3,0],[x,yy+rh+.45,0],[x+dir*1.4,yy+rh+1.2,0]],.28,M.dark);
        });
      }
    };
    function rudder(g){
      if(s.hull==='raft'){
        // 원본 뗏목의 조타 노에 넓적한 끝과 고정 끈만 더한다.
        var r=ship.raftDeck/2.2,blade=box(g,-s.L*.535,1.1,s.W*.195,6,2.1,.45,C.oar);blade.rotation.z=.25;
        ring(g,-s.L*.42,r*2.4,s.W*.15,.65,C.rope,'x');return;
      }
      if(s.hull==='outrigger'){
        var y=h.sheer(.1),x=-s.L*.36,z=s.W*.28;
        rod(g,[x+4,y+3,z],[x-10,.6,z+4],.35,C.spar);
        var blade=box(g,x-8,1.4,z+3.4,6,2.4,.45,M.mid);blade.rotation.z=.26;
        ring(g,x,y+1.8,z+.9,.75,C.rope,'x');return;
      }
      if(s.hull==='junk'){
        // 정크에는 이미 큰 방향타가 있다. 같은 자리에 두 번째 판을 만들지 않는다.
        var hc=h.H*(q.stern==='tower'?.95:q.stern==='high'?.8:.6),cx=h.X(0,h.sheer(0)+hc*.5)-1.5;
        [.22,.57].forEach(function(v){var yy=h.sheer(0)*v+.6;box(g,cx,yy,0,2.8,.5,.72,C.iron);
          [-1,1].forEach(function(side){rod(g,[cx+.75,yy-1,side*.34],[cx+.75,yy+1,side*.34],.18,C.iron);});});return;
      }
      var top=h.sheer(0)*.83,width=Math.min(6,s.W*.13),shape=new T.Shape();
      shape.moveTo(h.X(0,1)-.6,1);shape.lineTo(h.X(0,top)-.6,top);
      shape.lineTo(h.X(0,top)-width*.65,top);shape.lineTo(h.X(0,1)-width,1);shape.closePath();
      var fin=new T.ExtrudeGeometry(shape,{depth:.8,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.16,bevelThickness:.12});fin.translate(0,0,-.4);mesh(g,fin,M.hull);
      [.28,.62].forEach(function(v){var yy=top*v,x=h.X(0,yy)-.8;
        box(g,x-width*.36,yy,0,width*.82,.55,1.05,C.iron);rod(g,[x,yy-1.1,0],[x,yy+1.1,0],.34,C.iron);
        [-1,1].forEach(function(side){for(var i=0;i<3;i++)mesh(g,new T.SphereGeometry(.16,5,4),C.brass,x-i*width*.27,yy,side*.56);});
      });
      // 작은 배의 노출된 조타 손잡이. 선실이 있는 자리는 비워 둔다.
      var u=.035,yy=deck(u),xx=h.X(u,yy);
      if(!occupied(xx+4)&&s.hull!=='turtle'){
        rod(g,[xx,yy,0],[xx,yy+2.1,0],.5,M.dark);rod(g,[xx,yy+2.1,0],[xx+7,yy+1.6,0],.3,C.spar,.22);
        box(g,xx+6.5,yy+1.65,0,.7,.55,2.4,M.deckc);
      }
    }
    function windlass(g){
      if(['raft','outrigger','turtle'].indexOf(s.hull)>=0)return;
      var u=.81,x=h.X(u,deck(u));
      if(occupied(x)){u=.87;x=h.X(u,deck(u));}if(occupied(x))return;
      var y=deck(u),r=Math.max(.65,Math.min(1.25,s.W*.023)),w=Math.min(7,h.half(u,y)*.55);
      if(s.id==='shachuan'&&Math.abs(x-s.L*.3)<s.L*.05)y+=1.6;
      if(w<2)return;
      [-1,1].forEach(function(side){
        box(g,x,y+1.2,side*w,1.2,2.4,1.1,M.dark);box(g,x,y+.15,side*w,2.5,.3,2.1,M.mid);
        for(var k=0;k<2;k++){var a=k*PI/2;rod(g,[x-Math.cos(a)*2,y+2.1-Math.sin(a)*2,side*(w+.8)],[x+Math.cos(a)*2,y+2.1+Math.sin(a)*2,side*(w+.8)],.19,M.deckc);}
      });
      rod(g,[x,y+2.1,-w-1.2],[x,y+2.1,w+1.2],r,C.spar);
      for(var i=-2;i<=2;i++)ring(g,x,y+2.1,i*.32,r+.08,C.rope);
      [-1,1].forEach(function(side){var pts=[];for(var j=0;j<=8;j++){var v=u+(.95-u)*j/8,yy=deck(v)+.2;pts.push([h.X(v,yy),yy,side*1.2]);}line(g,pts,.15,C.rope);});
    }
    function beak(g){
      if(q.bow!=='beak')return;
      var y=h.sheer(1)*.72+1.3,x=h.X(.985,h.sheer(1)*.7)-1,len=s.L*.075,w=h.W*.15;
      [-1,1].forEach(function(side){
        line(g,[[x,y+2.8,side*w],[x+len*.5,y+2.4,side*w*.48],[x+len,y+2,0]],.25,C.brass);
        for(var i=0;i<4;i++){var t=i/4;rod(g,[x+len*t,y,side*w*(1-t)],[x+len*t,y+2.8-t*.8,side*w*(1-t)],.2,M.dark);}
      });
      for(var i=1;i<6;i++){var t=i/6;rod(g,[x+len*t,y+.1,-w*(1-t)],[x+len*t,y+.1,w*(1-t)],.18,M.deckc);}
    }
    function armor(g){
      if(s.hull!=='turtle'||ship.turtleDetail)return;
      // 머리 아래 비어 있던 연결부를 굽은 목으로 이어 선수에 고정한다.
      var headY=h.sheer(1)+h.H*.35,headX=h.X(1,headY)+.5,baseY=h.sheer(.96),baseX=h.X(.96,baseY);
      var neck=new T.CatmullRomCurve3([new T.Vector3(baseX-1,baseY-.8,0),new T.Vector3(headX-2.8,headY-3.4,0),new T.Vector3(headX-.5,headY-.8,0)]);
      mesh(g,new T.TubeGeometry(neck,12,1.3,8,false),C.brass);
      box(g,baseX-1,baseY-.7,0,3.8,.7,3.6,M.dark);
      for(var k=1;k<5;k++){var t=k/6,p=neck.getPoint(t),tangent=neck.getTangent(t),collar=ring(g,p.x,p.y,p.z,1.33,M.dark);
        collar.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),tangent);}
      function point(t,a){var u=.06+.84*t,e=Math.sin(PI*t),y=h.sheer(u)+h.H*.38,w=h.half(u,y)*1.04,hr=h.B*.62*Math.pow(e,.45)+.8;
        return [h.X(u,y),y+Math.sin(a)*(hr+.18),-Math.cos(a)*(w*(.55+.45*Math.pow(e,.35))+.18)];}
      // 등판의 곡면 이음: 쇠못의 위치와 둥근 실루엣을 그대로 둔다.
      [.17,.33,.5,.67,.83].forEach(function(t){var p=[];for(var j=0;j<=16;j++)p.push(point(t,PI*j/16));line(g,p,.13,C.iron);});
      [PI*.24,PI*.76].forEach(function(a){var p=[];for(var j=1;j<26;j++)p.push(point(j/26,a));line(g,p,.12,C.iron);});
    }
    var base=ship.buildHull;
    ship.buildHull=function(){levels.length=houses.length=0;var g=base.call(this);rudder(g);windlass(g);beak(g);armor(g);return g;};
    return ship;
  }};
})(window);

/* 거북선 전용 상부 구조. 사용자 복원선 사진의 용두·방패벽·두 돛 배치를 따른다. */
(function(root){'use strict';
  var PI=Math.PI;
  function roof(ship,c,t,a){
    var h=ship.h,u=c.roofStart+(c.roofEnd-c.roofStart)*t,y=h.sheer(u)+h.H*c.wallHeight;
    return [h.X(u,y),y+Math.sin(a)*h.H*c.roofRise*(.82+.18*Math.sin(PI*t)),-Math.cos(a)*h.half(u,y)*1.035];
  }
  root.TurtleDetail={prepare:function(ship,c){
    ship.turtleDetail=true;
    // 공유 선종 자료는 복사한다. 선체의 길이·폭·건현은 건드리지 않는다.
    var top=0;for(var i=0;i<=40;i++)top=Math.max(top,roof(ship,c,i/40,PI/2)[1]);
    var s=Object.assign({},ship.s);s.masts=c.mastX.map(function(x){return x*s.L;});
    s.heights=c.sailHeight.map(function(h){return top+c.sailClearance+h+4-s.H;});
    ship.s=s;ship.h.s=s;ship.turtleRoofTop=top;ship.turtleSailBase=top+c.sailClearance;
  },enrich:function(ship,T,c){
    var s=ship.s,h=ship.h,M=ship.M,C=ship.C;
    function color(v){return new T.Color(v).convertSRGBToLinear();}
    function mat(v,r){return new T.MeshStandardMaterial({color:color(v),roughness:r||.8,side:T.DoubleSide});}
    var carved=mat('#ab977d',.78),edge=mat('#302820'),tooth=mat('#d5c49f'),inside=mat('#171613'),tongue=mat('#40312a'),eye=mat('#b8aa7e');
    // 통나무를 깎은 용두에는 선체 판재 이음이 나타나지 않도록 잔결만 따로 만든다.
    var woodCanvas=document.createElement('canvas');woodCanvas.width=woodCanvas.height=256;var wg=woodCanvas.getContext('2d');
    wg.fillStyle='#81715d';wg.fillRect(0,0,256,256);wg.lineWidth=.5;
    for(var j=0;j<160;j++){wg.strokeStyle=j%3?'rgba(26,21,17,.10)':'rgba(198,172,130,.08)';wg.beginPath();
      for(var i=0;i<=24;i++){var xx=i*256/24,yy=j*1.65+Math.sin(i*.3+j*.41)*2.4;if(i)wg.lineTo(xx,yy);else wg.moveTo(xx,yy);}wg.stroke();}
    var woodTex=new T.CanvasTexture(woodCanvas);woodTex.encoding=T.sRGBEncoding;woodTex.wrapS=woodTex.wrapT=T.RepeatWrapping;woodTex.anisotropy=8;
    carved.color.copy(color('#6f6a60'));carved.map=woodTex;carved.bumpMap=woodTex;carved.bumpScale=.035;
    var relief=carved.clone();relief.color.copy(color('#867d70'));
    var frame=mat('#4d3526'),panel=M.inner,roofMat;
    function mesh(g,geo,m,p,role){var o=new T.Mesh(geo,m);if(p)o.position.fromArray(p);o.castShadow=o.receiveShadow=true;if(role)o.userData.turtleRole=role;g.add(o);return o;}
    function box(g,p,size,m,role){return mesh(g,new T.BoxGeometry(size[0],size[1],size[2]),m,p,role);}
    function ball(g,p,size,m,role){var o=mesh(g,new T.SphereGeometry(1,14,10),m,p,role);o.scale.fromArray(size);return o;}
    function rod(g,a,b,r,m,tip){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),d=B.clone().sub(A);
      var o=mesh(g,new T.CylinderGeometry(tip==null?r:tip,r,d.length(),8),m);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
    function curve(g,pts,r,m,end,role,quality){
      var path=new T.CatmullRomCurve3(pts.map(function(p){return new T.Vector3().fromArray(p);})),n=quality===true?24:quality||12,sides=quality===true?10:7,geo=new T.TubeGeometry(path,n,r,sides,false);
      if(end!=null){var p=geo.attributes.position;for(var i=0;i<=n;i++){var center=path.getPointAt(i/n),k=1+(end/r-1)*i/n;
        for(var j=0;j<=sides;j++){var idx=i*(sides+1)+j;p.setXYZ(idx,center.x+(p.getX(idx)-center.x)*k,center.y+(p.getY(idx)-center.y)*k,center.z+(p.getZ(idx)-center.z)*k);}}geo.computeVertexNormals();}
      return mesh(g,geo,m,null,role);
    }
    function ring(g,p,r,m,thick){var o=mesh(g,new T.TorusGeometry(r,thick||.15,5,20),m,p);o.rotation.x=PI/2;return o;}
    function grid(g,nu,nv,fn,m,role){var p=[],uv=[],ids=[];
      for(var j=0;j<=nv;j++)for(var i=0;i<=nu;i++){p.push.apply(p,fn(i/nu,j/nv));uv.push(i/nu,j/nv);}
      for(var j=0;j<nv;j++)for(var i=0;i<nu;i++){var a=j*(nu+1)+i;ids.push(a,a+1,a+nu+1,a+1,a+nu+2,a+nu+1);}
      var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();return mesh(g,geo,m,null,role);
    }
    // 길이 방향 덮개 판재와 이음. 이전의 큰 반구보다 낮고 긴 지붕을 만든다.
    var cv=document.createElement('canvas');cv.width=cv.height=512;var ctx=cv.getContext('2d'),rng=root.Ship3DTex.rng(81);
    ctx.fillStyle='#737971';ctx.fillRect(0,0,512,512);
    for(var j=0;j<16;j++)for(var i=0;i<8;i++){
      ctx.fillStyle='rgba(23,31,29,'+(.04+rng()*.14)+')';ctx.fillRect(i*64,j*32,64,32);
      ctx.fillStyle='rgba(22,30,28,.45)';ctx.fillRect(i*64,j*32,64,1.5);ctx.fillRect(i*64,j*32,1.2,32);
      ctx.fillStyle='rgba(222,220,194,.3)';ctx.fillRect(i*64+3,j*32+3,1.3,26);
      ctx.fillStyle='#3c433e';ctx.fillRect(i*64+6,j*32+5,2,2);ctx.fillRect(i*64+56,j*32+26,2,2);
    }
    var tx=new T.CanvasTexture(cv);tx.encoding=T.sRGBEncoding;tx.anisotropy=8;
    roofMat=new T.MeshStandardMaterial({map:tx,bumpMap:tx,bumpScale:.14,roughness:.9,side:T.DoubleSide});
    function dragon(parent){
      var g=new T.Group();g.userData.turtleRole='dragon';parent.add(g);
      var front=roof(ship,c,1,0),baseY=front[1]-h.H*.36;
      g.position.set(front[0]+1.3,baseY,0);g.scale.setScalar(c.dragonScale);
      // 단면을 이어 코부터 이마까지 한 덩어리로 깎는다. 둥근 코를 따로 붙이지 않는다.
      function loft(parent,sections,m,role){
        var path=new T.CatmullRomCurve3(sections.map(function(p){return new T.Vector3(p[0],p[1],p[2]);})),width=new T.CatmullRomCurve3(sections.map(function(p){return new T.Vector3(p[3],0,0);}));
        return grid(parent,48,24,function(u,v){var p=path.getPoint(u),w=Math.max(.015,width.getPoint(u).x),a=v*PI*2,sy=Math.sin(a),sz=Math.cos(a);
          return[p.x,p.y+Math.sign(sy)*Math.pow(Math.abs(sy),.65)*Math.max(.015,p.z),Math.sign(sz)*Math.pow(Math.abs(sz),.65)*w];},m,role);
      }
      // 볼의 비늘·눈썹·수염은 면적과 볼륨이 있는 양각. 가는 선을 붙인 장식과 구분한다.
      function plaque(parent,outline,z,side,bulge,m,role){
        var path=new T.CatmullRomCurve3(outline.map(function(p){return new T.Vector3(p[0],p[1],0);}),true,'centripetal'),center=new T.Vector3();
        outline.forEach(function(p){center.x+=p[0]/outline.length;center.y+=p[1]/outline.length;});
        var o=grid(parent,32,4,function(u,v){var p=path.getPoint(u);return[center.x+(p.x-center.x)*v,center.y+(p.y-center.y)*v,side*(z+bulge*(1-v*v))];},m,role);
        grid(parent,32,1,function(u,v){var p=path.getPoint(u),r=1+.025*v;return[center.x+(p.x-center.x)*r,center.y+(p.y-center.y)*r,side*(z-.025*v)];},edge,'carving-groove');return o;
      }
      function carve(parent,pts,r,end,role,m){return curve(parent,pts,r,m||relief,end,role,role==='tooth'?8:true);}
      // 굵은 목의 앞쪽에는 겹치는 배 비늘, 뒤·옆에는 방패 모양 비늘을 둔다.
      box(g,[-.9,1,0],[3.6,6,6.4],frame,'dragon-mount');
      function neckPoint(a,y,extra){var t=y/12.5,r=2.95-.45*t+extra,cs=Math.cos(a),t4=Math.pow(t,4);return[t*t-1.7*t4+r*cs*(1-.42*t4*Math.max(0,cs)),y,r*.93*Math.sin(a)];}
      grid(g,32,24,function(u,v){return neckPoint(u*PI*2,v*12.6,0);},carved,'dragon-neck');
      grid(g,32,1,function(u,v){var p=neckPoint(u*PI*2,12.6,0);return[-.75+(p[0]+.75)*v,p[1],p[2]*v];},carved);
      for(var j=0;j<6;j++)(function(j){
        grid(g,28,5,function(u,v){var a=(u-.5)*PI*1.38,y=.35+j*1.88+v*1.88-.18*Math.cos(a);return neckPoint(a,y,.1+.16*(1-v)+.06*Math.sin(v*PI));},relief,'neck-scute');
        var seam=[];for(var i=0;i<=24;i++){var a=(i/24-.5)*PI*1.38;seam.push(neckPoint(a,.35+j*1.88-.18*Math.cos(a),.27));}curve(g,seam,.065,edge);
      })(j);
      [-1,1].forEach(function(side){for(var j=0;j<3;j++){
        var y=7.4+j*1.55;plaque(g,[[-1.7,y+1.4],[.2,y+1.0],[.8,y-.05],[-.6,y-.45],[-2.2,y+.2]],2.35,side,.22,carved,'neck-scale');
      }});
      var head=new T.Group();head.position.set(1.65,12.3,0);head.userData.turtleRole='dragon-head';g.add(head);
      loft(head,[[-3.8,1.7,.02,.02],[-3.1,1.7,2.0,2.0],[-1.6,2.05,2.4,2.55],[0,2.65,1.65,2.5],[1.5,2.68,1.1,2.12],[3.4,2.98,.98,1.9],[5.2,3.55,1.08,2.12],[6.4,3.98,1.1,2.2],[7.05,3.9,.86,1.9],[7.32,3.8,.04,.03]],carved,'upper-jaw');
      loft(head,[[-3.35,.25,.02,.02],[-2.5,-.15,1.55,2.25],[-1,-1.1,.87,2.42],[1,-1.65,.56,2.25],[3.4,-1.55,.48,2.05],[5.4,-1.24,.55,2.12],[6.55,-.88,.65,1.85],[7,-.7,.03,.03]],carved,'lower-jaw');
      ball(head,[2.35,-1.15,0],[3.5,.24,1.54],tongue,'tongue');
      // 입 안쪽은 오목한 면으로 만들어 정면에서도 어두운 목구멍이 보인다.
      grid(head,24,12,function(u,v){var a=(u-.5)*PI,y=-1.25+v*3;return[-.55-Math.cos(a)*.9,y,Math.sin(a)*1.72];},inside,'mouth-cavity');
      [-1,1].forEach(function(side){
        // 이어진 C자 입가와 코의 날개. 정면에도 위·아래 턱 사이가 열린다.
        carve(head,[[6.85,3.12,side*1.35],[5.6,2.68,side*1.75],[3.4,2.11,side*1.68],[1.4,1.72,side*1.84],[-.4,1.2,side*2.16],[-.83,.0,side*2.39],[.1,-.8,side*2.24],[2.5,-1.12,side*2.0],[5.5,-.79,side*2.0],[6.6,-.37,side*1.45]],.23,.18,'mouth-rim');
        carve(head,[[6.5,4.1,side*1.76],[5.95,4.47,side*1.95],[5.3,4.29,side*1.91],[5.0,3.88,side*2.02]],.23,.12,'nose-wing');
        var nostril=ball(head,[5.73,4.13,side*2.05],[.52,.25,.12],inside,'nostril');nostril.rotation.z=.25;
        // 눈 윤곽을 뾰족하게 잡고 눈두덩에서 긴 눈썹을 뒤로 흘린다.
        plaque(head,[[-1.22,3.13],[-.55,3.72],[.55,3.64],[1.55,2.92],[.53,2.58],[-.61,2.67]],2.42,side,.13,inside,'eye-socket');
        plaque(head,[[-.83,3.11],[-.26,3.46],[.51,3.39],[1.12,2.98],[.42,2.77],[-.36,2.86]],2.56,side,.14,eye,'eye');
        ball(head,[.32,3.13,side*2.73],[.22,.32,.07],inside,'pupil');
        plaque(head,[[1.6,3.01],[.66,3.95],[-.65,4.16],[-2.45,4.04],[-3.85,4.75],[-3.26,3.64],[-1.35,3.47],[.25,3.56]],2.43,side,.32,relief,'brow');
        plaque(head,[[.65,3.95],[-.5,4.37],[-2.0,4.48],[-3.7,5.02],[-3.0,4.11],[-1.45,3.99]],2.08,side,.22,carved,'brow-flame');
        plaque(head,[[-.55,4.3],[-1.4,4.62],[-2.5,4.63],[-3.8,5.2],[-3.18,4.46],[-2.2,4.24]],1.62,side,.20,relief,'brow-flame');
        // 불꽃 모양 갈기를 겹쳐 넓은 볼에서 뒤통수까지 연결한다.
        for(var k=0;k<3;k++){
          var y=2.8-k*.77;plaque(head,[[-.55,y],[-1.6,y+.47],[-3.15,y+.63],[-4.75-k*.15,y+1.42],[-3.85,y+.02],[-2.12,y-.42]],2.42-k*.09,side,.26,carved,'cheek-scale');
        }
        plaque(head,[[-1.5,.45],[-2.0,1.05],[-3.05,.82],[-4.62,1.22],[-4.0,.1],[-2.8,-.52],[-2,-.2]],2.64,side,.3,relief,'ear');
        carve(head,[[-2.0,.48,side*2.95],[-2.9,.52,side*3.03],[-3.65,.68,side*2.95]],.075,.03,'ear-fold',edge);
        // 뿔은 굵은 밑동에서 뒤로 뻗어 세 갈래로 갈라진다.
        carve(head,[[-2.3,2.8,side*1.85],[-3.8,3.2,side*2.7],[-5.3,3.65,side*3.3],[-7.15,4.65,side*3.65],[-8.15,6.25,side*3.7]],.79,.035,'horn',carved);
        carve(head,[[-4.3,3.35,side*2.95],[-4.8,4.55,side*3.05],[-5.05,5.8,side*3.1],[-5.65,6.5,side*3.1]],.43,.025,'horn-tine',carved);
        carve(head,[[-6,4.05,side*3.45],[-6.2,5.1,side*3.5],[-6.5,6.0,side*3.5]],.33,.02,'horn-tine',carved);
        // 코 수염을 입 바깥으로 흘려 이빨이 드러나게 한다.
        carve(head,[[5.2,3.0,side*2.0],[4.6,2.6,side*2.45],[3,2.55,side*2.8],[1.5,2.7,side*3.0],[.5,2.9,side*3.2]],.17,.025,'whisker');
        // 작은 이빨과 굽은 송곳니의 뿌리를 잇몸 안에 묻는다.
        for(var k=0;k<8;k++){
          var x=.35+k*.73,y=1.57+Math.max(0,x-1.5)*.25,z=side*(1.8-Math.max(0,x-1)*.027);
          carve(head,[[x,y,z],[x+.06,y-.26,z],[x-.07,y-.57,z*.98]],.16,.015,'tooth',tooth);
          var yy=-1.05+Math.max(0,x-2.5)*.08;carve(head,[[x+.14,yy,z],[x+.18,yy+.24,z],[x+.07,yy+.51,z*.98]],.16,.015,'tooth',tooth);
        }
        carve(head,[[5.86,2.95,side*1.67],[5.7,2.23,side*1.72],[5.4,1.53,side*1.69],[5.06,1.12,side*1.58]],.36,.02,'fang',tooth);
        carve(head,[[4.9,-.83,side*1.72],[4.94,-.17,side*1.78],[4.6,.27,side*1.73]],.3,.02,'fang',tooth);
        // 아래턱 가장자리에 폭이 넓고 끝이 뾰족한 조각 수염을 잇는다.
        for(var k=0;k<6;k++){
          var x=-.5+k*.95,y=-1.6+Math.max(0,x-2.7)*.1;plaque(head,[[x-.7,y+.05],[x+.3,y+.02],[x+.55,y-.5],[x-.22,y-1.25],[x-.7,y-.6]],2.04-Math.abs(x-1.9)*.035,side,.2,carved,'beard');
        }
      });
      // 코끝의 좌우를 잇는 주름과 앞니도 같은 입체 모형에 붙인다.
      carve(head,[[6.85,3.12,-1.35],[7.2,3.19,0],[6.85,3.12,1.35]],.23,.23,'upper-lip');
      carve(head,[[6.6,-.37,-1.45],[6.83,-.34,0],[6.6,-.37,1.45]],.23,.23,'lower-lip');
      for(var j=-1;j<=1;j+=2){carve(head,[[6.9,3.15,j*.65],[6.95,2.68,j*.64],[6.75,2.39,j*.61]],.24,.02,'tooth',tooth);carve(head,[[6.55,-.44,j*.6],[6.61,-.02,j*.61],[6.48,.18,j*.61]],.2,.015,'tooth',tooth);}
      // 정수리의 낮은 능선을 이마와 이어진 볼륨으로 만든다.
      loft(head,[[-3.25,3.5,.02,.02],[-2.55,4.0,.3,.8],[-1.35,4.4,.22,.74],[-.45,4.14,.18,.6],[.5,3.7,.02,.02]],relief,'forehead-crest');
    }
    ship.up_turtle=function(g){
      var lo=c.roofStart,hi=c.roofEnd;
      [1,-1].forEach(function(side){
        grid(g,28,2,function(t,v){var u=lo+(hi-lo)*t,y=h.sheer(u)-h.bul+v*(h.bul+h.H*c.wallHeight);return[h.X(u,y),y,side*(h.half(u,y)*1.03)];},panel,'shield-wall');
        var eave=[];for(var j=0;j<=28;j++)eave.push(roof(ship,c,j/28,side>0?PI:0));curve(g,eave,.48,frame);
        for(var j=0;j<=10;j++){var u=lo+(hi-lo)*j/10,y=h.sheer(u),top=y+h.H*c.wallHeight,x=h.X(u,top),z=side*h.half(u,top)*1.035;
          rod(g,[x,y-h.bul,z],[x,top,z],.42,frame);
          if(j<10){var v=u+(hi-lo)/20,yy=h.sheer(v),xx=h.X(v,yy+h.H*.26),zz=side*(h.half(v,yy+h.H*.26)*1.034+.12);
            var port=mesh(g,new T.CircleGeometry(1.1,12),inside,[xx,yy+h.H*.24,zz],'gun-port');if(side<0)port.rotation.y=PI;
            var rim=mesh(g,new T.TorusGeometry(1.2,.16,5,12),frame,[xx,yy+h.H*.24,zz+side*.08]);
            var ventY=yy+h.H*c.wallHeight-1.6;box(g,[h.X(v,ventY),ventY,side*(h.half(v,ventY)*1.035+.12)],[5.2,1.55,.35],inside,'vent');
          }
        }
      });
      // 앞뒤 방패벽의 둥근 박공과 가로 골조.
      [0,1].forEach(function(t){var face=roof(ship,c,t,0),u=lo+(hi-lo)*t,base=h.sheer(u)-h.bul,pts=[face[0],base,0],ids=[];
        for(var j=0;j<=18;j++)pts.push.apply(pts,roof(ship,c,t,PI*j/18));
        for(var j=0;j<18;j++)ids.push(0,j+1,j+2);
        pts.push(face[0],base,-face[2],face[0],base,face[2]);ids.push(0,1,21,0,19,20);
        var uv=[];for(var j=0;j<pts.length;j+=3)uv.push((pts[j+2]/Math.abs(face[2])+1)*.5,(pts[j+1]-base)/(face[1]+h.H*c.roofRise-base));
        var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();mesh(g,geo,panel,null,'end-wall');
        var x=face[0]+(t? .25:-.25),w=Math.abs(face[2]);
        [-.7,0,.7].forEach(function(k){rod(g,[x,base,k*w],[x,face[1]+(k?1.5:h.H*c.roofRise),k*w],.5,frame);});
        rod(g,[x,base+.5,-w],[x,base+.5,w],.65,frame);rod(g,[x,face[1]-2.8,-w],[x,face[1]-2.8,w],.42,frame);
      });
      grid(g,36,16,function(t,v){return roof(ship,c,t,PI*v);},roofMat,'roof');
      [.25,.5,.75].forEach(function(t){var pts=[];for(var j=0;j<=16;j++)pts.push(roof(ship,c,t,PI*j/16));curve(g,pts,.17,frame);});
      var spikes=new T.InstancedMesh(new T.ConeGeometry(.32,1.65,5),C.spike,88),matrix=new T.Matrix4(),quat=new T.Quaternion(),scale=new T.Vector3(1,1,1),count=0;
      for(var j=1;j<=11;j++)for(var k=1;k<=8;k++){var t=j/12,a=k*PI/9,p=new T.Vector3().fromArray(roof(ship,c,t,a)),n=new T.Vector3(0,Math.sin(a),-Math.cos(a)).normalize();p.addScaledVector(n,.7);quat.setFromUnitVectors(new T.Vector3(0,1,0),n);spikes.setMatrixAt(count++,matrix.compose(p,quat,scale));}
      spikes.castShadow=spikes.receiveShadow=true;spikes.userData.turtleRole='roof-spikes';g.add(spikes);
      s.masts.forEach(function(mx){var u=h.U(mx,h.H),t=(u-lo)/(hi-lo),p=roof(ship,c,t,PI/2),y=p[1];
        box(g,[mx,y+.25,0],[5,.65,5],frame,'mast-collar');ring(g,[mx,y+.75,0],1.5,C.rope,.18);
      });dragon(g);
    };
    // 이 전용 돛도 공용 모션 어댑터가 천·돛살·테두리를 함께 갱신한다.
    var batten=ship.batten;
    ship.batten=function(g,mx,mh,H0,st,style,i){
      batten.apply(this,arguments);var group=g.children[g.children.length-1],cloth=group.children[0],material=cloth.material;
      group.children.slice().forEach(function(o){group.remove(o);o.geometry.dispose();});
      var width=s.W*c.sailWidth[i],bottom=ship.turtleSailBase,ht=c.sailHeight[i],n=c.sailPanels;
      grid(group,14,n*3,function(u,v){return[(.47-u)*width,bottom+v*ht+(u-.5)*v*1.4,.9];},material,'sail');
      for(var k=0;k<=n;k++){var v=k/n;rod(group,[width*.47+.6,bottom+ht*v-.7*v,.9],[-width*.53-.6,bottom+ht*v+.7*v,.9],k===0||k===n?.55:.3,k===n?C.spar:C.batten);}
      group.position.x=mx;group.userData.sailBaseYaw=c.sailYaw;group.userData.sailPanels=n;group.rotation.y=c.sailYaw;
    };
    ship.buildRig=function(st){var g=new T.Group();
      s.masts.forEach(function(mx,i){var top=s.H+s.heights[i],base=ship.turtleRoofTop;
        rod(g,[mx,h.H,0],[mx,top,0],1.1,C.mast,.64);
        [base+1,base+2].forEach(function(y){ring(g,[mx,y,0],1.18,C.rope,.16);});
        [-1,1].forEach(function(side){rod(g,[mx,top-2,side*.5],[mx-7,base-4,side*s.W*.32],.13,C.rope);});
        var ax=i===0?s.L*.39:s.masts[0];rod(g,[mx,top-1,0],[ax,base+1,0],.13,C.rope);
        ship.batten(g,mx,s.heights[i],s.H,st,'kr',i);
      });return g;
    };
    return ship;
  }};
})(window);

/* 박물관 자료를 대조한 세 번째 미술 보강. 구조별 근거는 docs/art/rig3d-references.md. */
(function(root){'use strict';
  root.FleetCraft={enrich:function(ship,T,profile){
    var s=ship.s,h=ship.h,q=ship.q,C=ship.C,M=ship.M,f=profile.family,PI=Math.PI,levels=[],houses=[];
    function mesh(g,geo,m,p,role){var o=new T.Mesh(geo,m);if(p)o.position.fromArray(p);o.castShadow=o.receiveShadow=true;if(role)o.userData.craftRole=role;g.add(o);return o;}
    function box(g,p,size,m,role){return mesh(g,new T.BoxGeometry(size[0],size[1],size[2]),m,p,role);}
    function rod(g,a,b,r,m,role,tip){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),d=B.clone().sub(A),o=mesh(g,new T.CylinderGeometry(tip==null?r:tip,r,d.length(),7),m,null,role);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
    function curve(g,p,r,m,role){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(p.map(function(v){return new T.Vector3().fromArray(v);})),16,r,6,false),m,null,role);}
    function grid(g,nu,nv,fn,m,role){var p=[],uv=[],ix=[];for(var j=0;j<=nv;j++)for(var i=0;i<=nu;i++){p.push.apply(p,fn(i/nu,j/nv));uv.push(i/nu,j/nv);}for(var j=0;j<nv;j++)for(var i=0;i<nu;i++){var a=j*(nu+1)+i;ix.push(a,a+1,a+nu+1,a+1,a+nu+2,a+nu+1);}var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();return mesh(g,geo,m,null,role);}
    function loop(g,p,r,axis,role){var o=mesh(g,new T.TorusGeometry(r,.10,4,12),C.rope,p,role);if(axis==='y')o.rotation.x=PI/2;if(axis==='x')o.rotation.y=PI/2;return o;}
    var castle=ship.castle;ship.castle=function(g,a,b,hc,opt){var o=opt||{};levels.push({a:a,b:b,hc:hc,base:o.base||function(u){return h.sheer(u);}});return castle.apply(this,arguments);};
    function deck(u){var y=h.deckY(u);levels.forEach(function(l){if(u>=l.a&&u<=l.b)y=Math.max(y,l.base(u)+l.hc-1.1);});if(s.hull==='panok')y=h.sheer(u)+h.H*.55;if(s.hull==='atake')y=h.sheer(u)+h.H*.85;return y;}
    function rail(g,a,b,height){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),n=Math.max(3,Math.ceil(A.distanceTo(B)/2.8));
      for(var k=0;k<=n;k++){var p=A.clone().lerp(B,k/n);rod(g,p.toArray(),[p.x,p.y+height,p.z],.15,M.dark,'baluster');}
      [.45,1].forEach(function(v){rod(g,[a[0],a[1]+height*v,a[2]],[b[0],b[1]+height*v,b[2]],.19,M.deckc,'handrail');});
    }
    function ladder(g,x,y,z,height){[-1,1].forEach(function(side){rod(g,[x+height*.5,y-height,z+side*.9],[x,y+.3,z+side*.9],.18,M.dark,'access-ladder');});for(var j=0;j<=Math.ceil(height/.9);j++){var t=j/Math.ceil(height/.9);rod(g,[x+height*.5*t,y-height*t,z-.9],[x+height*.5*t,y-height*t,z+.9],.15,M.deckc);}}
    // 판옥선 연구소 복원도의 장대: 기와집 대신 난간·기둥·가벼운 차양이 열린 공간을 이룬다.
    function pavilion(g,x0,x1,hw,y,hh){
      var length=x1-x0,cx=(x0+x1)/2,roof=y+hh,w=hw*.88;
      box(g,[cx,y+.3,0],[length,.6,w*2],M.deckc,'command-platform');
      [-1,1].forEach(function(side){
        for(var i=0;i<=3;i++){var x=x0+length*i/3;rod(g,[x,y,side*w],[x,roof,side*w],.28,M.dark,'pavilion-post');rod(g,[x,roof-1.5,side*w],[x,roof-.1,side*(w+1.2)],.16,M.deckc,'pavilion-brace');}
        rail(g,[x0,y+.3,side*w],[x1,y+.3,side*w],1.9);
        rod(g,[x0-1.1,roof,side*(w+1.1)],[x1+1.1,roof,side*(w+1.1)],.28,M.dark);
      });
      rail(g,[x0,y+.3,-w],[x0,y+.3,w],1.9);ladder(g,x1,y+.3,w*.55,Math.min(5.2,hh*.7));
      grid(g,12,8,function(u,v){return[x0-1.1+u*(length+2.2),roof+.65*Math.sin(PI*v)+.18*Math.sin(PI*u),(-1+2*v)*(w+1.1)];},ship.artCloth('sq'),'pavilion-canopy');
      for(var i=0;i<5;i++)rod(g,[x0+length*i/4,roof-.12,-w-1.1],[x0+length*i/4,roof-.12,w+1.1],.14,C.spar);
    }
    var house=ship.roofHouse;ship.roofHouse=function(g,x0,x1,hw,y,hh,roof,eave,wall){
      houses.push({x0:x0,x1:x1,hw:hw,y:y,hh:hh});
      if(s.id==='panokseon'){pavilion(g,x0,x1,hw,y,hh);return;}
      house.apply(this,arguments);
      // 지붕 밑 받침과 옆 회랑은 실제 집 치수에 맞춰 만든다.
      if(['junk','japanese','korean','jong'].indexOf(f)>=0){
        [-1,1].forEach(function(side){for(var i=0;i<4;i++){var x=x0+(x1-x0)*(i+.5)/4;rod(g,[x,y+hh-1.6,side*(hw-.2)],[x,y+hh-.3,side*(hw+1.3)],.22,M.dark,'eave-bracket');}
          if(s.id==='atakebune'){box(g,[(x0+x1)/2,y+.1,side*(hw+1.2)],[x1-x0+1,.4,2.7],M.deckc,'yagura-balcony');rail(g,[x0,y+.3,side*(hw+2.35)],[x1,y+.3,side*(hw+2.35)],1.5);}
        });
        if(s.id==='jong'){for(var x=x0;x<=x1;x+=2.2)[-1,1].forEach(function(side){rod(g,[x,y+hh,0],[x,y+hh*.86,side*(hw+1.2)],.12,C.bamboo,'thatch-binding');});}
      }
    };
    function mastFoot(g,mx){
      var u=h.U(mx,h.H),y=deck(u);if(houses.some(function(a){return mx>a.x0-2&&mx<a.x1+2;}))return;
      var r=Math.max(.65,s.W*.024);box(g,[mx,y+.35,0],[r*5.4,.7,r*5.4],M.dark,'mast-step');
      [-1,1].forEach(function(side){box(g,[mx,y+2.1,side*r*1.6],[r*3,4.2,r*.7],M.mid,'mast-cheek');rod(g,[mx,y+2.8,side*r*1.95],[mx,y+2.8,-side*r*1.95],.19,f==='west'?C.iron:M.dark,'mast-pivot');});
      for(var i=0;i<4;i++){var a=i*PI/2;var wedge=box(g,[mx+Math.cos(a)*r*1.15,y+.95,Math.sin(a)*r*1.15],[r*.8,1.3,r*.65],M.deckc,'mast-wedge');wedge.rotation.y=-a;}
      if(s.id==='shachuan')[-1,1].forEach(function(side){rod(g,[mx,y+9,0],[mx-2,y,side*s.W*.30],.43,M.dark,'junk-mast-brace');});
    }
    function gallery(g){
      var u=.1,y=deck(u),x=h.X(u,y),w=h.half(u,y)*.97,len=s.L*.17;
      [-1,1].forEach(function(side){var z=side*(w+1.35);box(g,[x,y-.2,z],[len,.5,3.1],M.deckc,'baghlah-gallery');
        rail(g,[x-len/2,y,side*(w+2.7)],[x+len/2,y,side*(w+2.7)],2.2);
        for(var j=0;j<5;j++){var xx=x-len*.44+len*j*.22;rod(g,[xx,y-3,side*(w-.8)],[xx,y-.4,side*(w+2.6)],.25,M.dark,'gallery-knee');
          var ring=mesh(g,new T.TorusGeometry(.45,.09,4,10),M.deckc,[xx,y+1.05,side*(w+2.73)],'carved-roundel');}
      });
    }
    function sternStage(g){
      var y=deck(.015),x=h.X(0,y),w=h.half(.025,y)*.86,len=Math.min(6,s.L*.045);
      for(var j=0;j<6;j++)box(g,[x-len*.5,y-.15,-w+(j+.5)*w/3],[len,.35,w/3-.12],M.deckc,'stern-working-stage');
      [-1,1].forEach(function(side){rod(g,[x+3,y-2,side*w*.65],[x-len,y-.4,side*w*.85],.3,M.dark,'stage-knee');rail(g,[x,y,side*w],[x-len,y,side*w],1.75);});
      rail(g,[x-len,y,-w],[x-len,y,w],1.75);
      // 큰 중앙 키를 올리는 쌍 기둥과 도르래 축.
      [-1,1].forEach(function(side){rod(g,[x,y,side*2],[x,y+4.2,side*2],.3,M.dark,'rudder-hoist');rod(g,[x,y+3.6,side*2],[x-1,y-h.H*.55,side*.55],.11,C.rope);});
      rod(g,[x,y+4,-2.4],[x,y+4,2.4],.35,C.spar);
    }
    function oarStation(g){
      var n=q.oars||7,apost=ship.apost||0;
      for(var k=0;k<n;k++)[-1,1].forEach(function(side){var x=-s.L*.33+k*s.L*.64/Math.max(1,n-1),u=h.U(x,h.H),y=['panok','turtle','atake'].indexOf(s.hull)>=0?h.sheer(u)*.72:h.sheer(u)-.3,z=side*(h.half(u,y)+apost+.3);
        box(g,[x,y-.65,z],[2.3,.45,1.5],M.dark,'oar-bearing');
        [-1,1].forEach(function(a){rod(g,[x+a*.75,y-.6,z],[x+a*.75,y+.7,z],.15,M.deckc,'thole-pin');});
      });
      if(f==='galley'){for(var j=0;j<7;j++){var x=s.L*(-.29+j*.095),u=h.U(x,h.H),y=h.deckY(u);[-1,1].forEach(function(side){var z=side*(h.half(u,h.H)+apost);rod(g,[x,y-1,side*h.half(u,h.H)*.7],[x,y+.05,z],.22,M.dark,'outrigger-knee');});}}
    }
    function bulwarks(g){
      var height=s.id==='panokseon'?h.H*.95:s.id==='atakebune'?h.H*1.15:s.id==='sekibune'?h.H*.55:h.H*.45,inset=s.id==='panokseon'?1.08:1.035;
      [-1,1].forEach(function(side){for(var j=0;j<12;j++){var u=.1+j*.72/11,y=h.sheer(u)+height*.7,x=h.X(u,y),z=side*(h.half(u,y)*inset+.28);
        if(s.id==='kobaya'){for(var k=-1;k<=1;k++){var xx=x+k*.55;rod(g,[xx,y-height*.55,z],[xx,y+height*.35,z],.2,C.bamboo,'bamboo-shield');}loop(g,[x,y,z],.75,'y','shield-binding');}
        else{box(g,[x,y,z],[1.4,height*.20,.18],C.hole,'arrow-slit');box(g,[x,y+height*.13,z],[1.9,.2,.4],M.dark,'slit-lintel');
          var shutter=box(g,[x+1.1,y,z+side*.18],[.65,height*.28,.22],M.deckc,'slit-shutter');shutter.rotation.y=side*.65;}
      }});
    }
    function western(g){
      // 선미루 외부의 무릎재와 갑판 기둥은 넓은 상선의 높은 성루를 받친다.
      if(['cog','hulk','carrack','lcarrack','hcarrack','fluyt'].indexOf(s.id)>=0)[-1,1].forEach(function(side){for(var j=0;j<6;j++){var u=.04+j*.035,l=levels.find(function(l){return u>=l.a&&u<=l.b;}),y=h.sheer(u),x=h.X(u,y),z=side*(h.half(u,y)+.4);if(!l)return;
        rod(g,[x,y-h.H*.6,z*.92],[x,y+l.hc*.78,z*.98],.38,M.dark,'castle-timber');rod(g,[x+2,y,z*.96],[x,y+l.hc*.4,z],.25,M.deckc,'castle-knee');
      }});
      if(q.guns&&s.id!=='galleon'&&s.id!=='lgalleon')for(var k=0;k<q.guns;k++)[-1,1].forEach(function(side){var size=Math.max(1.6,Math.min(2.7,h.H*.17)),x=-s.L*.22+k*s.L*.48/Math.max(1,q.guns-1),u=h.U(x,h.H*.5),y=h.sheer(u)*.5,z=side*(h.half(u,y)+.2);
        var lid=box(g,[h.X(u,y),y+size*.8,z+side*size*.45],[size*1.18,.25,size*.95],M.mid,'port-lid');lid.rotation.x=-side*.35;
        [-1,1].forEach(function(a){rod(g,[h.X(u,y)+a*size*.34,y+size*.9,z+side*.25],[h.X(u,y)+a*size*.34,y+size*.6,z+side*size*.86],.06,C.rope,'port-lift');});
      });
      // 통로 밖의 목제 펌프와 빌레이 핀. 큰 장식이 없는 배에도 작업 설비를 읽게 한다.
      var mx=s.masts[0],u=h.U(mx-4,h.H),y=deck(u),z=s.W*.18;
      box(g,[mx-4,y+1.5,z],[.9,3,.9],M.dark,'deck-pump');rod(g,[mx-5,y+3.1,z],[mx-2,y+3.8,z],.15,C.spar,'pump-handle');
      [-1,1].forEach(function(side){var zz=side*s.W*.21;box(g,[mx-3,y+2.2,zz],[5,.45,1],M.mid,'pin-rail');[-1,1].forEach(function(a){box(g,[mx-3+a*1.9,y+1.1,zz],[.45,2.2,.45],M.dark);});for(var j=0;j<4;j++){rod(g,[mx-4.5+j,y+1.75,zz],[mx-4.5+j,y+2.9,zz],.14,M.deckc,'belaying-pin');loop(g,[mx-4.5+j,y+1.5,zz+.5],.45,'x','rope-coil');}});
    }
    function lashings(g){
      if(s.hull==='raft'){
        var y=ship.raftDeck,r=s.W/(9*2.05);[-s.L*.25,s.L*.20].forEach(function(x){for(var j=0;j<9;j++){var z=-s.W*.47+j*s.W*.94/8;[-.3,0,.3].forEach(function(off){loop(g,[x+off,r*.6,z],r*1.035,'x','log-lashing');});}});
        // 통나무 사이에서 드러나는 목제 조향판의 손잡이와 쐐기.
        [-.38,.34].forEach(function(v,i){var z=(i?-.12:.12)*s.W;box(g,[s.L*v,r*1.6+1.4,z],[3.5,3.2,.55],M.dark,'steering-board');rod(g,[s.L*v-2,r*1.6+3,z],[s.L*v+2,r*1.6+3,z],.23,M.deckc);});return;
      }
      if(s.hull==='outrigger')[-s.L*.24,s.L*.2].forEach(function(x){var y=h.sheer(h.U(x,h.H))+.6;[-1,1].forEach(function(side){for(var k=-2;k<=2;k++)loop(g,[x+k*.22,y,side*s.W*.52],.7,'x','beam-lashing');rod(g,[x-7,y-1,side*s.W*.5],[x,y,side*s.W*2.25],.3,C.bamboo,'outrigger-strut');});});
      if(s.id==='jong')[-1,1].forEach(function(side){for(var j=0;j<9;j++){var u=.28+j*.06,y=h.sheer(u),x=h.X(u,y),z=side*(h.half(u,y)-.5);rod(g,[x,y,z],[x+1,y+1.7,z*.94],.23,M.dark,'deck-knee');}});
    }
    ship.craftRigMast=function(g,mx,foot,top,r,style){
      if(style==='kr'||style==='jp'){rod(g,[mx,top-2.4,-r*3.3],[mx,top-2.4,r*3.3],.26,C.spar,'masthead-crossbar');[-1,1].forEach(function(side){loop(g,[mx,top-2.4,side*r*2.4],.39,'x','halyard-eye');rod(g,[mx-.65,top-2.4,side*r*2.4],[mx-.65,foot+2,side*r*.8],.08,C.rope,'halyard');});}
      else if(style==='bat'){rod(g,[mx-1.3,top-2,0],[mx+1.3,top-2,0],.3,C.spar,'junk-masthead');[-1,1].forEach(function(side){rod(g,[mx+side*.6,top-2,0],[mx+side*.6,foot+2,.7],.09,C.rope,'junk-halyard');});}
      else if(s.hull==='raft'||s.hull==='outrigger'){for(var j=0;j<5;j++)loop(g,[mx,top-1.5+j*.28,0],.75,'y','bipod-lashing');}
    };
    var base=ship.buildHull;ship.buildHull=function(){levels.length=houses.length=0;var g=base.call(this),details=new T.Group();details.userData.craftFamily=f;g.add(details);
      if(ship.turtleDetail)return g;
      if(s.hull!=='raft'&&s.hull!=='outrigger')s.masts.forEach(function(mx){mastFoot(details,mx);});
      if(f==='west')western(details);
      if(f==='dhow'){if(s.id==='baghlah')gallery(details);var y=h.sheer(1),x=h.X(1,y);curve(details,[[x-.6,y,0],[x+1.5,y+2.5,0],[x+1.3,y+4,0],[x+.3,y+4.4,0]],.45,M.dark,'stem-head');[y+1,y+1.65].forEach(function(yy){loop(details,[x+.45,yy,0],.66,'y','stem-binding');});}
      if(f==='junk')sternStage(details);
      if(['galley','korean','japanese','outrigger'].indexOf(f)>=0)oarStation(details);
      if(f==='japanese'||s.id==='panokseon'||s.id==='maengseon')bulwarks(details);
      if(['jong','outrigger','raft'].indexOf(f)>=0)lashings(details);
      return g;
    };return ship;
  }};
})(window);

/* 선종별 범장. 선체 자료를 복사하고 지붕·선루 위에 실제 돛의 아래 끝을 배치한다. */
(function(root){'use strict';
  var PI=Math.PI,mix=function(a,b,t){return a+(b-a)*t;};
  root.RigDetail={prepare:function(ship,c){
    var p=c.profiles[ship.s.id];if(!p)throw new Error('범장 프로필 누락: '+ship.s.id);
    ship.rigPlan=p;ship.rigConfig=c;
    if(ship.s.id==='geobukseon')return;
    var s=Object.assign({},ship.s);s.masts=p.map(function(m){return m[0]*s.L;});s.heights=p.map(function(m){return m[1]*s.L;});
    s.sails=p.map(function(m){return m[2];});ship.s=s;ship.h.s=s;
  },enrich:function(ship,T){
    if(ship.turtleDetail)return ship;
    var s=ship.s,h=ship.h,C=ship.C,c=ship.rigConfig,plan=ship.rigPlan,levels=[],houses=[];
    function mesh(g,geo,m,p){var o=new T.Mesh(geo,m);if(p)o.position.fromArray(p);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
    function rod(g,a,b,r,m,tip){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),d=B.clone().sub(A);
      var o=mesh(g,new T.CylinderGeometry(tip==null?r:tip,r,d.length(),6),m);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
    function block(g,p,r){
      var b=new T.Group();b.position.fromArray(p);b.userData.rigBlock=true;g.add(b);
      [-1,1].forEach(function(side){var cheek=mesh(b,new T.SphereGeometry(1,10,7),ship.M.mid,[0,0,side*r*.42]);cheek.scale.set(r,r*1.45,r*.25);});
      var wheel=mesh(b,new T.CylinderGeometry(r*.65,r*.65,r*.65,10),C.rope);wheel.rotation.x=PI/2;
      rod(b,[0,0,-r*.78],[0,0,r*.78],r*.15,C.iron);
      var strop=mesh(b,new T.TorusGeometry(r*1.06,r*.13,4,12),C.rope);strop.scale.y=1.45;return b;
    }
    function deadeyes(g,x,y,z,side,r){
      var d=new T.Group();d.position.set(x,y,z);d.userData.rigDeadeye=true;g.add(d);
      [0,r*3.4].forEach(function(yy){var disk=mesh(d,new T.CylinderGeometry(r,r,r*.48,12),ship.M.dark,[0,yy,0]);disk.rotation.x=PI/2;
        for(var k=0;k<3;k++){var a=-PI/2+k*PI*2/3,xx=Math.cos(a)*r*.46,dy=Math.sin(a)*r*.46;
          var hole=mesh(d,new T.CircleGeometry(r*.15,6),C.hole,[xx,yy+dy,side*r*.26]);if(side<0)hole.rotation.y=PI;}
      });
      for(var k=0;k<3;k++){var xx=(k-1)*r*.45;rod(d,[xx,r*.35,side*r*.32],[-xx,r*3.05,side*r*.32],.065,C.rope);}
      rod(d,[0,-r*.6,0],[0,-r*4,side*-.6],.14,C.iron);
      return[y+r*3.4,z];
    }
    function grid(g,nu,nv,fn,m){var p=[],uv=[],ids=[];
      for(var j=0;j<=nv;j++)for(var i=0;i<=nu;i++){p.push.apply(p,fn(i/nu,j/nv));uv.push(i/nu,j/nv);}
      for(var j=0;j<nv;j++)for(var i=0;i<nu;i++){var a=j*(nu+1)+i;ids.push(a,a+1,a+nu+1,a+1,a+nu+2,a+nu+1);}
      var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();return mesh(g,geo,m);
    }
    var castle=ship.castle,house=ship.roofHouse;
    ship.castle=function(g,a,b,hc,opt){var o=opt||{};levels.push({a:a,b:b,top:function(u){return(o.base?o.base(u):h.sheer(u))+hc;}});return castle.apply(this,arguments);};
    ship.roofHouse=function(g,x0,x1,hw,y,hh){houses.push({x0:x0-3,x1:x1+3,top:y+hh+Math.min(hw*.5,2.2+hh*.55)+1.5});return house.apply(this,arguments);};
    function deck(x,reach){var y=0;
      for(var k=0;k<=8;k++){var xx=x+(k/8-.5)*2*(reach||0),u=Math.max(0,Math.min(1,h.U(xx,h.H)));y=Math.max(y,h.sheer(u));
        levels.forEach(function(l){if(u>=l.a&&u<=l.b)y=Math.max(y,l.top(u));});
        if(s.hull==='panok')y=Math.max(y,h.sheer(u)+h.H*.95);
        if(s.hull==='atake')y=Math.max(y,h.sheer(u)+h.H*1.05);
      }
      houses.forEach(function(a){if(x+(reach||0)>a.x0&&x-(reach||0)<a.x1)y=Math.max(y,a.top);});return y;
    }
    ship.rigDeckTop=deck;
    function base(mx,reach){return deck(mx,reach)+c.clearance;}
    function planAt(mx){return plan[s.masts.indexOf(mx)];}
    function reset(g){var mat=g.children.filter(function(o){return o.isMesh&&o.material.map&&o.geometry.attributes.uv;})[0].material;
      g.children.slice().forEach(function(o){g.remove(o);if(o.geometry)o.geometry.dispose();});return mat;}
    // 서양 사각돛: 큰 코스 위에 머리가 좁고 발이 넓은 윗돛. 활대마다 독립된 층이다.
    ship.squareSails=function(g,mx,mh,H0,top,i,nm,st,style,tiers,raft){
      var m=plan[i],jp=m[2]==='jp',bottom=base(mx,s.W*m[4]*.28),height=top-bottom,span=s.W*m[4]*.5;
      var bands=c.bands[m[3]];
      bands.forEach(function(b,k){var yT=bottom+height*(m[3]===1&&s.hull==='west'&&s.cap>=150?.83:b[0]),yB=bottom+height*b[1],spT=span*b[2],spB=span*b[3];
        var yard=new T.Group();yard.position.x=mx;yard.userData.rigYard=true;yard.userData.yardY=yT;g.add(yard);
        rod(yard,[c.sailOffset,yT+.55,-spT*1.06],[c.sailOffset,yT+.55,spT*1.06],k?.42:.64,C.spar).userData.rigYardSpar=true;
        // 돛머리 묶음과 중앙 도르래. 활대와 같은 그룹이어서 방향을 바꿀 때 함께 돈다.
        for(var z=-spT*.94;z<=spT*.94;z+=Math.max(2.5,spT*.15)){
          var tie=mesh(yard,new T.TorusGeometry(k?.48:.69,.08,4,8),C.rope,[c.sailOffset,yT+.55,z]);
          rod(yard,[c.sailOffset,yT+.2,z],[c.sailOffset,yT-.35,z],.08,C.rope);
        }
        block(yard,[c.sailOffset+.2,yT+1.45,0],c.blockRadius);
        // 활대 들줄: 돛대 중심에서 활대 끝으로 연결한다.
        [-1,1].forEach(function(side){rod(yard,[0,Math.min(top,yT+height*.18),0],[c.sailOffset,yT+.55,side*spT*1.03],.10,C.rope);});
        var cloth=ship.sqSurface(g,mx,yT,yB,spT,spB,0,st.bill*Math.min(s.W*.22,(yT-yB)*.3),st);
        cloth.userData.sailOffset=c.sailOffset;cloth.userData.squareBoom=jp||raft;cloth.userData.rigTier=k;cloth.userData.rigMast=i;cloth.userData.rigClearance=bottom;
        cloth.userData.sailFoot=(yT-yB)*(k?c.topFoot:c.courseFoot);cloth.userData.sailLeech=c.leech;
        // 서양 코스의 아랫자락에는 활대가 없다. 일본선·뗏목만 아래 활대를 둔다.
        if(jp||raft){var lower=new T.Group();lower.position.x=mx;lower.userData.rigYard=true;lower.userData.lowerSail=cloth;
          rod(lower,[c.sailOffset,yB,-spB],[c.sailOffset,yB,spB],.42,C.spar).userData.rigYardSpar=true;g.add(lower);}
      });
    };
    var lateen=ship.lateen;
    ship.lateen=function(g,mx,mh,H0,st,i){
      lateen.apply(this,arguments);var group=g.children[g.children.length-1],material=reset(group),m=plan[i];
      var width=s.W*m[4],top=H0+mh;width=Math.max(width,(top-base(mx,width*.60))*.95);
      var bottom=base(mx,width*.64),dh=Math.max(24,top-bottom);
      // 긴 대각선 활대. 뒷돛은 선미루 높이에 맞춰 짧게, 갤리는 길고 낮게 둔다.
      var A=[width*.42,bottom+dh*.08],B=[-width*.60,bottom+dh*.96],D=[-width*.45,bottom];
      var delta=[B[0]-A[0],B[1]-A[1]];
      rod(group,[A[0]-delta[0]*.035,A[1]-delta[1]*.035,.55],[B[0]+delta[0]*.035,B[1]+delta[1]*.035,.55],.65,C.spar,.36);
      grid(group,22,16,function(u,v){return[mix(mix(A[0],B[0],u),D[0],v),mix(mix(A[1],B[1],u),D[1],v),.9];},material);
      group.userData.trianglePlan={A:A,B:B,C:D,bill:Math.min(width*.16,dh*.15),turn:1.15,xBelly:.08};
      group.userData.rigClearance=bottom;
      rod(group,[0,top,0],[mix(A[0],B[0],.48),mix(A[1],B[1],.48),.55],.12,C.rope);
      var center=[mix(A[0],B[0],.48),mix(A[1],B[1],.48),.55];block(group,[center[0],center[1]+1.1,center[2]],c.blockRadius*1.2);
      for(var k=-2;k<=2;k++){var tie=mesh(group,new T.TorusGeometry(.72,.10,4,10),C.rope,[center[0]+delta[0]*k*.009,center[1]+delta[1]*k*.009,.55]);tie.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(delta[0],delta[1],0).normalize());}
    };
    var batten=ship.batten;
    ship.batten=function(g,mx,mh,H0,st,style,i){
      batten.apply(this,arguments);var group=g.children[g.children.length-1],material=reset(group),m=plan[i],kr=m[2]==='kr';
      var w=s.W*m[4],bottom=base(mx,kr?w*.38:w*.95),top=H0+mh-3,ht=Math.max(24,top-bottom),n=kr?8:7;
      var f=kr?.48:.22,lx=w*f,ax=-w*(1-f),rise=kr?ht*.025:ht*.22;
      grid(group,16,n*3,function(u,v){return[mix(lx,ax,u),bottom+v*(ht-rise+rise*u),.9];},material);
      for(var k=0;k<=n;k++){var v=k/n;rod(group,[lx+.5,bottom+v*(ht-rise),.9],[ax-.5,bottom+v*ht,.9],k===0||k===n?.48:.27,k===n?C.spar:C.batten);}
      group.userData.sailBaseYaw=kr?PI/2:0;group.userData.sailPanels=n;group.userData.rigClearance=bottom;
      group.rotation.y=group.userData.sailBaseYaw;
    };
    var tanja=ship.tanja;
    ship.tanja=function(g,mx,mh,H0,st){
      tanja.apply(this,arguments);var group=g.children[g.children.length-1],material=reset(group),m=planAt(mx),w=s.W*m[4],bottom=base(mx,w*.6),ht=H0+mh-bottom;
      // 기울어진 위·아래 활대 사이에 매단 직조 사각돛. 대나무 정크돛과 구분한다.
      var A=[w*.38,bottom],B=[-w*.62,bottom+ht*.18],D=[w*.60,bottom+ht*.78],E=[-w*.40,bottom+ht*.96];
      grid(group,18,16,function(u,v){return[mix(mix(D[0],E[0],u),mix(A[0],B[0],u),v),mix(mix(D[1],E[1],u),mix(A[1],B[1],u),v),.8];},material);
      rod(group,[A[0],A[1],.8],[B[0],B[1],.8],.48,C.bamboo);rod(group,[D[0],D[1],.8],[E[0],E[1],.8],.48,C.bamboo);
      group.userData.rigClearance=bottom;
    };
    function platform(g,mx,y,r){
      var nest=new T.Group();nest.position.set(mx-r*.20,y,0);nest.userData.rigTop=true;g.add(nest);
      // 승강구는 실제로 뚫고, 판재도 구멍 가장자리에서 끊는다.
      var shape=new T.Shape();shape.absarc(0,0,r,0,PI*2,false);var hole=new T.Path(),x0=-r*.84,x1=-r*.30,z0=-r*.31,z1=r*.31;
      hole.moveTo(x0,z0);hole.lineTo(x0,z1);hole.lineTo(x1,z1);hole.lineTo(x1,z0);hole.closePath();shape.holes.push(hole);
      var geo=new T.ExtrudeGeometry(shape,{depth:.6,bevelEnabled:false,curveSegments:18});geo.rotateX(PI/2);var floor=mesh(nest,geo,ship.M.mid);floor.userData.topFloor=true;floor.userData.topHatch={x0:x0,x1:x1,z0:z0,z1:z1};
      for(var x=-r*.86;x<=r*.86;x+=r*.24){var span=Math.sqrt(r*r-x*x)*.96,parts=x+r*.11>x0&&x-r*.11<x1?[[-span,z0],[z1,span]]:[[-span,span]];
        parts.forEach(function(p){if(p[1]>p[0]){var plank=mesh(nest,new T.BoxGeometry(r*.21,.16,p[1]-p[0]),ship.M.deckc,[x,.08,(p[0]+p[1])/2]);plank.userData.topPlank=true;}});}
      [z0,z1].forEach(function(z){mesh(nest,new T.BoxGeometry(x1-x0+.2,.22,.16),ship.M.dark,[(x0+x1)/2,.16,z]);});
      var height=r*.65;
      for(var k=0;k<c.topRailPosts;k++){var a=k*PI*2/c.topRailPosts,xx=Math.cos(a),zz=Math.sin(a);
        var post=rod(nest,[xx*r*.88,.1,zz*r*.88],[xx*r*1.06,height,zz*r*1.06],.16,ship.M.dark);post.userData.topRailPost=true;
        if(k%2===0)rod(nest,[r*.2,-r*.95,0],[xx*r*.86,-.3,zz*r*.86],.22,C.spar);
      }
      [.65,height].forEach(function(yy){var rr=yy===height?r*1.06:r*.93;
        var rim=mesh(nest,new T.TorusGeometry(rr,.22,5,24),ship.M.dark,[0,yy,0]);rim.rotation.x=PI/2;rim.userData.topRail=true;});
      // 망루 입구까지 이어지는 짧은 승강 사다리. 아래 슈라우드와 시각적으로 연결한다.
      [-1,1].forEach(function(side){rod(nest,[-r*.57,-r*1.6,side*r*.21],[-r*.57,.5,side*r*.21],.12,C.rope);});
      for(var k=0;k<5;k++)rod(nest,[-r*.57,-r*1.45+k*r*.34,-r*.21],[-r*.57,-r*1.45+k*r*.34,r*.21],.12,C.spar);
      // 망루 아래 돛대 볼받침과 위쪽 접합 모자.
      [-1,1].forEach(function(side){mesh(nest,new T.BoxGeometry(r*.55,r*1.45,r*.18),ship.M.dark,[r*.2,-r*.72,side*r*.3]);});
      mesh(nest,new T.BoxGeometry(r*.85,.55,r*.9),ship.M.dark,[r*.20,r*.95,0]).userData.mastCap=true;
    }
    ship.buildRig=function(st){var g=new T.Group(),west=s.hull==='west',raft=s.hull==='raft';
      plan.forEach(function(m,i){var mx=s.masts[i],mh=s.heights[i],top=Math.max(s.H+mh,base(mx,s.W*m[4]*.95)+32),foot=h.deckY(h.U(mx,h.H)),r=Math.max(.65,s.W*.024)*(m[2]==='lat'?.75:1),style=m[2];
        mh=top-s.H;s.heights[i]=mh;
        if(raft||s.hull==='outrigger'){
          [-1,1].forEach(function(side){rod(g,[mx-3,foot,side*s.W*.25],[mx,top,0],.65,C.bamboo,.38);});
          if(!raft)rod(g,[mx+4,foot,0],[mx,top,0],.55,C.bamboo,.35);
        }else{
          rod(g,[mx,foot-.5,0],[mx,top,0],r,C.mast,r*.48);
          for(var j=1;j<6;j++){var y=mix(foot,top*.64,j/6);rod(g,[mx,y-.22,0],[mx,y+.22,0],r*1.05,C.iron);}
        }
        var sq=style==='sq'&&west,bot=base(mx,s.W*m[4]*.28),topY=bot+(top-bot)*(m[3]===3?.54:m[3]===1?.88:.63);
        if(sq&&s.cap>=150){platform(g,mx,topY,r*4.1);if(m[3]===3)platform(g,mx,bot+(top-bot)*.81,r*2.5);}
        // 정크의 자립 돛대에는 서양식 사다리 그물을 복제하지 않는다.
        if(west||s.hull==='galley'||s.hull==='dhow'){
          var count=sq?4:2,yh=sq?topY:top*.76;
          [-1,1].forEach(function(side){var ends=[];
            for(var k=0;k<count;k++){var x=mx-1.5-k*2.2,u=h.U(x,h.H),y=h.sheer(u),z=side*(h.half(u,y)+.9),ey=y+.2;
              if(west){var result=deadeyes(g,x,y+.7,z,side,c.deadeyeRadius);ey=result[0];}
              ends.push([x,ey,z]);rod(g,[mx,yh,side*r*.6],ends[k],.16,C.rope);}
            if(west)mesh(g,new T.BoxGeometry(count*2.2+1,.5,1.8),ship.M.dark,[mx-1.5-(count-1)*1.1,ends[0][1]-c.deadeyeRadius*4,ends[0][2]-side*.3]);
            if(sq)for(var j=1;j<14;j++){var t=j/14,A=ends[0],B=ends[count-1];rod(g,[mix(A[0],mx,t),mix(A[1],yh,t),mix(A[2],side*r*.6,t)],[mix(B[0],mx,t),mix(B[1],yh,t),mix(B[2],side*r*.6,t)],.075,C.rope);}
            if(sq&&m[3]>1)rod(g,[mx,top-2,0],[mx-5,topY+1,side*r*2.5],.11,C.rope);
          });
          var end=i?[s.masts[i-1],s.H+s.heights[i-1]*.43,0]:ship.sprit?ship.sprit.b:[s.L*.46,h.sheer(.95)+1,0];
          rod(g,[mx,top-2,0],end,.13,C.rope);
        }else if(style==='kr'||style==='jp'){
          [-1,1].forEach(function(side){rod(g,[mx,top-3,0],[mx-s.L*.09,foot+1,side*s.W*.37],.13,C.rope);});
        }
        if(style==='sq'||style==='jp')ship.squareSails(g,mx,mh,s.H,top,i,plan.length,st,style,false,raft);
        else if(style==='lat')ship.lateen(g,mx,mh,s.H,st,i);
        else if(style==='tanja')ship.tanja(g,mx,mh,s.H,st);
        else ship.batten(g,mx,mh,s.H,st,style==='kr'?'kr':'bat',i);
        mesh(g,new T.SphereGeometry(r*.6,8,6),C.spar,[mx,top+.3,0]);
        if(ship.craftRigMast)ship.craftRigMast(g,mx,foot,top,r,style,i);
      });
      if(ship.sprit&&['carrack','lcarrack','hcarrack','galleon','lgalleon','fluyt','hulk'].indexOf(s.id)>=0){
        var a=ship.sprit.a,b=ship.sprit.b,x=mix(a[0],b[0],.70),y=mix(a[1],b[1],.70)-1,span=s.W*.29;
        var cloth=ship.sqSurface(g,x,y,Math.max(3,y-s.W*.25),span,span*.94,0,s.W*.07,st);cloth.userData.spritsail=true;
        var yard=new T.Group();yard.position.x=x;yard.userData.rigYard=true;yard.userData.yardY=y;yard.userData.braceFactor=.6;g.add(yard);
        rod(yard,[0,y+.5,-span*1.08],[0,y+.5,span*1.08],.42,C.spar).userData.rigYardSpar=true;
        [-1,1].forEach(function(side){rod(yard,[0,y+3,0],[0,y+.5,side*span],.10,C.rope);});
      }
      if(ship.sprit&&['tartane','xebec'].indexOf(s.id)>=0){
        var b=ship.sprit.b,mx=s.masts[0],top=s.H+s.heights[0],bottom=base(mx,2);
        ship.triSurface(g,b,[mx,top*.84,0],[mx+3,bottom,0],s.W*.1,0,mx,ship.artCloth('lat'));
        g.children[g.children.length-1].userData.rigFixed=true;
      }
      return g;
    };
    return ship;
  }};
})(window);

/* 제작용 돛을 실시간으로 갱신한다. 선종별 활대·돛살과 노의 좌표를 함께 움직인다. */
(function (root) {
  'use strict';
  var PI = Math.PI;
  function mix(a,b,t){return a+(b-a)*t;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  root.RuntimeRig = { make: function(ship,T,batch,cfg) {
    var moving=[], sails=[], yards=[], s=ship.s, q=ship.q, rig=ship.buildRig;
    function clothIn(group){return group.children.filter(function(o){return o.isMesh && o.geometry.attributes.uv && o.material.map;})[0];}
    function mark(mesh,kind){mesh.userData.sailKind=kind;mesh.frustumCulled=false;mesh.geometry.attributes.position.setUsage(T.DynamicDrawUsage);}
    var square=ship.sqSurface, squareSails=ship.squareSails;
    ship.sqSurface=function(grp,mx,yT,yB,spT,spB,brace,bill){
      var mesh=square.apply(this,arguments);mark(mesh,'square');
      sails.push({kind:'square',mesh:mesh,yT:yT,yB:yB,spT:spT,spB:spB,bill:bill,brace:1});moving.push(mesh);return mesh;
    };
    ship.squareSails=function(grp){
      var n=grp.children.length, first=sails.length;squareSails.apply(this,arguments);
      grp.children.slice(n).forEach(function(o){if(!o.isGroup)return;
        var lower=null, y=o.children[0].position.y;
        if(o.userData.lowerSail)sails.slice(first).forEach(function(a){if(a.mesh===o.userData.lowerSail)lower=a;});
        sails.slice(first).forEach(function(a){if(Math.abs(a.yB-y)<.1)lower=a;});
        moving.push(o);yards.push({group:o,lower:lower,brace:o.userData.braceFactor||1});
      });
    };
    function triangle(group,mesh,A,B,C,bill,turn,xBelly){
      mark(mesh,'triangle');sails.push({kind:'triangle',group:group,mesh:mesh,A:A,B:B,C:C,bill:bill,turn:turn,xBelly:xBelly});moving.push(group);
    }
    var lateen=ship.lateen;
    ship.lateen=function(grp,mx,mh,H0){
      lateen.apply(this,arguments);var group=grp.children[grp.children.length-1],mesh=clothIn(group);
      if(group.userData.trianglePlan){var p=group.userData.trianglePlan;triangle(group,mesh,p.A,p.B,p.C,p.bill,p.turn,p.xBelly);return;}
      var long=q.rig==='galley'||q.rig==='galleass'||q.rig==='xebec';
      var A=[mh*(long?.62:.5),H0+mh*.14], B=[-mh*(long?.62:.56),H0+mh], C=[-mh*(long?.36:.42),H0+mh*.13];
      if(q.rig==='dhow'||q.rig==='baghlah'){A=[mh*.58,H0+mh*.12];B=[-mh*.5,H0+mh*1.03];C=[-mh*.48,H0+mh*.22];}
      triangle(group,mesh,A,B,C,s.W*.22,1.4,.25);
    };
    var tri=ship.triSurface;
    ship.triSurface=function(grp,p0,p1,p2,amp,brace,pivot){
      tri.apply(this,arguments);var group=grp.children[grp.children.length-1];
      triangle(group,clothIn(group),[p0[0]-pivot,p0[1]],[p1[0]-pivot,p1[1]],[p2[0]-pivot,p2[1]],amp,1,0);
    };
    // 여러 돛살은 같은 원통을 인스턴싱한다. 매 프레임 메시를 만들지 않는다.
    function makeBars(group,bars){
      var bins={};bars.forEach(function(b){var key=b.mat.uuid;(bins[key]||(bins[key]={mat:b.mat,bars:[]})).bars.push(b);});
      var out=[];Object.keys(bins).forEach(function(key){var b=bins[key];
        var segments=6,im=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,5),b.mat,b.bars.length*segments);
        im.instanceMatrix.setUsage(T.DynamicDrawUsage);im.frustumCulled=false;im.castShadow=im.receiveShadow=true;group.add(im);out.push({mesh:im,bars:b.bars,segments:segments});
      });return out;
    }
    function quadGroup(grp,kind,args,original){
      original.apply(ship,args);var group=grp.children[grp.children.length-1],mesh=clothIn(group),uv=mesh.geometry.attributes.uv,p=mesh.geometry.attributes.position;
      mark(mesh,kind);
      function corner(u,v){for(var i=0;i<p.count;i++)if(Math.abs(uv.getX(i)-u)<.001&&Math.abs(uv.getY(i)-v)<.001)return[p.getX(i),p.getY(i),p.getZ(i)];throw new Error('돛 모서리 누락: '+s.id);}
      var a={kind:kind,group:group,mesh:mesh,corners:[corner(0,0),corner(1,0),corner(0,1),corner(1,1)],mh:args[2],kr:args[5]==='kr',baseYaw:group.userData.sailBaseYaw||0,panels:group.userData.sailPanels};
      var bars=[],children=group.children.slice(),n=kind==='batten'?(a.panels||(a.kr?7:6)):4;
      children.forEach(function(o,i){if(o===mesh)return;
        var v=kind==='batten'?(i-1)/n:i===1?1:i===2?0:1-(i-2)/4;
        bars.push({v:v,mat:o.material,rad:o.geometry.parameters.radiusTop||.3});group.remove(o);o.geometry.dispose();
      });
      a.bars=makeBars(group,bars);sails.push(a);moving.push(group);
    }
    var batten=ship.batten,tanja=ship.tanja;
    ship.batten=function(grp){quadGroup(grp,'batten',arguments,batten);};
    ship.tanja=function(grp){quadGroup(grp,'tanja',arguments,tanja);};
    var staticRig=rig.call(ship,{furl:false,brace:0,bill:1,flutter:0,phase:0}),dynamic=new T.Group();
    // 보조 활대와 지브도 같은 회전·고정 규칙을 적용한다.
    staticRig.children.slice().forEach(function(o){if(o.userData.rigYard&&moving.indexOf(o)<0){moving.push(o);yards.push({group:o,lower:null,brace:o.userData.braceFactor||1});}});
    sails.forEach(function(a){if(a.mesh.userData.spritsail)a.brace=.6;if(a.group&&a.group.userData.rigFixed)a.turn=0;});
    moving.forEach(function(o){
      if(o.userData.rigYard){var parts=new T.Group();o.children.slice().forEach(function(ch){parts.add(ch);});o.add(batch(parts,T));}
      // 라틴 활대의 도르래·묶음도 정적으로 합친다. 천만 별도로 변형한다.
      var triangular=sails.filter(function(a){return a.kind==='triangle'&&a.group===o;})[0];
      if(triangular){var fittings=new T.Group();o.children.slice().forEach(function(ch){if(ch!==triangular.mesh)fittings.add(ch);});o.add(batch(fittings,T));}
      staticRig.remove(o);dynamic.add(o);
    });dynamic.add(batch(staticRig,T));
    // 테두리 줄은 천의 실제 꼭짓점에 묶는다. 선종·돛 수와 관계없이 한 번에 그린다.
    var ties=[],ropeMesh,localMatrix=new T.Matrix4(),tieA=new T.Vector3(),tieB=new T.Vector3();
    sails.forEach(function(a){
      var uv=a.mesh.geometry.attributes.uv;
      [[0,0],[0,1],[1,0],[1,1]].forEach(function(edge){
        // 삼각돛의 v=1은 한 점으로 모이므로 중복된 테두리를 만들지 않는다.
        if(a.kind==='triangle'&&edge[0]===1&&edge[1]===1)return;
        var row=[];for(var i=0;i<uv.count;i++)if(Math.abs((edge[0]?uv.getY(i):uv.getX(i))-edge[1])<.001)row.push(i);
        row.sort(function(i,j){return edge[0]?uv.getX(i)-uv.getX(j):uv.getY(i)-uv.getY(j);});
        for(var j=0;j<row.length-1;j+=2)ties.push({sail:a,a:row[j],b:row[Math.min(j+2,row.length-1)],reef:false});
      });
      if(a.kind==='square'&&s.hull!=='raft'&&s.hull!=='jp'&&s.hull!=='atake'){
        [.22,.41].forEach(function(v){for(var u=.15;u<.9;u+=.14){
          var nearest=0,best=Infinity;for(var i=0;i<uv.count;i++){var d=Math.abs(uv.getX(i)-u)+Math.abs(uv.getY(i)-v);if(d<best){best=d;nearest=i;}}
          ties.push({sail:a,a:nearest,b:nearest,reef:true});
        }});
      }
      // 아랫귀의 조임줄. 바람·접기에 따라 움직이는 천의 실제 꼭짓점에 붙인다.
      function corner(u,v){var best=Infinity,idx=0;for(var k=0;k<uv.count;k++){var d=Math.abs(uv.getX(k)-u)+Math.abs(uv.getY(k)-v);if(d<best){best=d;idx=k;}}return idx;}
      var mx=a.group?a.group.position.x:a.mesh.position.x;
      var x=Math.max(-s.L*.45,Math.min(s.L*.45,mx-s.L*.09)),u=ship.h.U(x,ship.h.H),y=ship.rigDeckTop?ship.rigDeckTop(x,0):ship.h.sheer(u);
      var width=ship.h.half(u,ship.h.H)*.92;
      if(a.kind==='square'&&!a.mesh.userData.spritsail){
        // 윗돛의 아랫귀는 바로 아래 활대 끝에 매단다.
        var below=null;sails.forEach(function(b){if(b.kind==='square'&&Math.abs(b.mesh.position.x-a.mesh.position.x)<.01&&b.yT<a.yB&&(!below||b.yT>below.yT))below=b;});
        [-1,1].forEach(function(side){ties.push({sail:a,a:corner(side<0?0:1,1),b:0,sheet:true,anchor:below?null:[x,y+1,side*width],below:below,side:side});});
      }else if(a.kind==='triangle')ties.push({sail:a,a:corner(0,1),b:0,sheet:true,anchor:[x,y+1,width*.65]});
      else if(a.kind==='batten'||a.kind==='tanja'){
        var sheets=a.kind==='batten'?(a.panels||7):2;
        for(var j=0;j<sheets;j++)ties.push({sail:a,a:corner(1,j/sheets),b:0,sheet:true,anchor:[x,y+1,-width*.6]});
      }
    });
    ropeMesh=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,4,1,true),ship.C.boltRope,ties.length);
    ropeMesh.userData.sailRopes=true;ropeMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);ropeMesh.frustumCulled=false;
    ropeMesh.castShadow=ropeMesh.receiveShadow=true;dynamic.add(ropeMesh);
    var axis=new T.Vector3(0,1,0), va=new T.Vector3(),vb=new T.Vector3(),mid=new T.Vector3(),dir=new T.Vector3(),sc=new T.Vector3(),quat=new T.Quaternion(),mat4=new T.Matrix4();
    function matrixBetween(a,b,r){va.fromArray(a);vb.fromArray(b);dir.subVectors(vb,va);var len=dir.length();mid.addVectors(va,vb).multiplyScalar(.5);quat.setFromUnitVectors(axis,dir.normalize());sc.set(r,len,r);return mat4.compose(mid,quat,sc);}
    function quadPoint(a,u,v,furl,fill,pulse){
      var c=a.corners,edge=a.kind==='batten'?0:1, vv=mix(v,edge,furl*.94);
      var x=mix(mix(c[0][0],c[1][0],u),mix(c[2][0],c[3][0],u),vv);
      var y=mix(mix(c[0][1],c[1][1],u),mix(c[2][1],c[3][1],u),vv),z;
      if(a.kind==='batten'){
        if(!a.kr)x-=Math.sin(PI*vv)*a.mh*.62*.12*u*(1-furl);
        var panels=a.panels||(a.kr?7:6), panel=(v*panels)%1;
        z=.9+s.W*.13*fill*pulse*(1-furl)*(.55*Math.sin(PI*u)+.45*Math.sin(PI*panel)*Math.sin(PI*u*.9+.15));
      }else z=.8+s.W*.2*fill*pulse*(1-furl)*Math.sin(PI*u)*Math.sin(PI*v);
      return [x,y,z];
    }
    // 노받이 위치는 공용 모델의 buildOars와 동일하다.
    var n=q.oars||(['galley','kr','panok','turtle','jp','atake','outrigger'].indexOf(s.hull)>=0?7:0), oars=[];
    var poles,blades;
    if(n){
      poles=new T.InstancedMesh(new T.CylinderGeometry(.3,.32,1,5),ship.C.oar,n*2);
      blades=new T.InstancedMesh(new T.BoxGeometry(2.6,.25,1.1),ship.C.oar,n*2);
      [poles,blades].forEach(function(m){m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.frustumCulled=false;m.castShadow=m.receiveShadow=true;dynamic.add(m);});
      var reach=['atake','panok','turtle'].indexOf(s.hull)>=0?.62:s.hull==='outrigger'?.95:.9;
      for(var k=0;k<n;k++)[1,-1].forEach(function(side){
        var x=-s.L*.33+k*s.L*.64/Math.max(1,n-1),u=ship.h.U(x,ship.h.H),y=['panok','turtle','atake'].indexOf(s.hull)>=0?ship.h.sheer(u)*.72:ship.h.sheer(u)-.3;
        oars.push({x:x,y:y,z:side*(ship.h.half(u,y)+(ship.apost||0)+.3),side:side,len:s.W*reach+(y-.5)*.6,phase:k*.42+(side>0?0:.28)});
      });
    }
    function update(spec,t){
      var c=cfg,wind=spec.rig||{},furl=clamp(spec.furl||0,0,1),deploy=mix(c.foldHeight,1,1-furl);
      var fill=clamp(wind.fill==null?.9:wind.fill,.05,1.25),brace=clamp(wind.brace||0,-c.maxBrace,c.maxBrace),luff=clamp(wind.luff||0,0,1);
      var pulse=1+Math.sin(t*c.billRate)*c.billPulse,lee=wind.lee==null?1:wind.lee;
      yards.forEach(function(y){y.group.rotation.y=brace*(y.brace||1);if(y.lower)y.group.position.y=(y.lower.yT-y.lower.yB)*(1-deploy);});
      sails.forEach(function(a,index){
        var p=a.mesh.geometry.attributes.position,uv=a.mesh.geometry.attributes.uv;
        if(a.group)a.group.rotation.y=(a.baseYaw||0)-brace*(a.turn==null?(a.kind==='batten'?1.2:1.5):a.turn);else a.mesh.rotation.y=brace*a.brace;
        for(var i=0;i<p.count;i++){
          var u=uv.getX(i),v=uv.getY(i);
          if(a.kind==='square'){
            u=u*2-1;var boom=a.mesh.userData.squareBoom,edge=Math.pow(Math.abs(u),3),belly=a.bill*fill*pulse*(1-furl)*Math.pow(Math.max(0,1-u*u),.85)*(Math.pow(Math.sin(PI*v),.9)*.82+(boom?0:v*.22));
            var flap=Math.sin(v*7+t*c.flutterRate+u*2+index)*edge*v*c.flutter*(.12+luff)*(1-furl)*(boom?1-v:1),fold=furl*Math.sin(v*PI*8)*c.foldDepth;
            var foot=(boom?0:(a.mesh.userData.sailFoot||c.sailFoot))*(1-u*u)*v*v*(1-furl),crease=Math.sin(u*PI*12+v*1.6)*c.sailCrease*u*u*Math.sin(v*PI)*(1-furl);
            var wrinkle=Math.sin(u*PI*7+v*10+index)*c.sailWrinkle*Math.pow(Math.abs(u),1.5)*Math.sin(PI*v)*(1-furl);
            p.setXYZ(i,(a.mesh.userData.sailOffset||0)+belly+flap+fold+crease+wrinkle,a.yT+(a.yB-a.yT)*v*deploy+foot,u*mix(a.spT,a.spB,v)*(1-(a.mesh.userData.sailLeech||c.sailLeech)*Math.sin(PI*v)*(1-furl)));
          }else if(a.kind==='triangle'){
            var lx=mix(a.A[0],a.B[0],u),ly=mix(a.A[1],a.B[1],u);
            var b=fill*pulse*(1-furl)*a.bill*Math.pow(Math.sin(PI*v),.85)*(.35+.65*Math.sin(PI*u))*(1-.6*v*v);
            var flap=Math.sin(u*8+t*c.flutterRate+index)*v*v*c.flutter*(.12+luff)*(1-furl);
            p.setXYZ(i,mix(lx,a.C[0],v*deploy)-b*a.xBelly,mix(ly,a.C[1],v*deploy),.9+(b+flap)*lee);
          }else{var pt=quadPoint(a,u,v,furl,fill,pulse);p.setXYZ(i,pt[0],pt[1],pt[2]*lee);}
        }
        p.needsUpdate=true;a.mesh.geometry.computeVertexNormals();
        if(a.bars)a.bars.forEach(function(bin){bin.bars.forEach(function(b,k){
          // 휜 돛살도 천의 곡면을 따라간다. 직선으로 잇으면 가운데가 천에 묻힌다.
          for(var j=0;j<bin.segments;j++){
            var A=quadPoint(a,j/bin.segments,b.v,furl,fill,pulse),B=quadPoint(a,(j+1)/bin.segments,b.v,furl,fill,pulse);
            if(j===0)A[0]+=.6;if(j===bin.segments-1)B[0]-=.6;A[2]=(A[2]+.16)*lee;B[2]=(B[2]+.16)*lee;
            bin.mesh.setMatrixAt(k*bin.segments+j,matrixBetween(A,B,b.rad));
          }
        });bin.mesh.instanceMatrix.needsUpdate=true;});
      });
      // 배 전체의 회전·기울기는 부모에 맡기고 돛의 국소 변환만 적용한다.
      var lastSail=null;
      ties.forEach(function(tie,i){var a=tie.sail,p=a.mesh.geometry.attributes.position;
        if(a!==lastSail){a.mesh.updateMatrix();localMatrix.copy(a.mesh.matrix);if(a.group){a.group.updateMatrix();localMatrix.premultiply(a.group.matrix);}lastSail=a;}
        tieA.fromBufferAttribute(p,tie.a);tieB.fromBufferAttribute(p,tie.b);
        if(tie.reef){tieA.x+=c.sailRopeRadius;tieB.x+=c.sailRopeRadius+.22;tieB.y-=c.reefRopeLength*(1-furl*.85);}
        tieA.applyMatrix4(localMatrix);tieB.applyMatrix4(localMatrix);
        if(tie.sheet){
          if(tie.below){var b=tie.below;b.mesh.updateMatrix();tieB.set(b.mesh.userData.sailOffset||0,b.yT+.55,tie.side*b.spT).applyMatrix4(b.mesh.matrix);}
          else tieB.fromArray(tie.anchor);
        }
        dir.subVectors(tieB,tieA);var len=dir.length();mid.addVectors(tieA,tieB).multiplyScalar(.5);
        if(len>.00001)quat.setFromUnitVectors(axis,dir.divideScalar(len));else quat.identity();
        var r=tie.sheet?(ship.rigConfig?ship.rigConfig.sheetRadius:.12):c.sailRopeRadius*(tie.reef?.6:1);sc.set(r,Math.max(len,.00001),r);ropeMesh.setMatrixAt(i,mat4.compose(mid,quat,sc));
      });ropeMesh.instanceMatrix.needsUpdate=true;
      var power=clamp(spec.oarPower==null?(spec.motionSpeed==null?.6:spec.motionSpeed):spec.oarPower,0,1)*(1-furl);
      oars.forEach(function(o,i){
        var ph=t*c.oarRate+o.phase,sweep=Math.sin(ph)*c.oarSweep*power,dx=-Math.sin(sweep)*o.len*.92,dz=Math.cos(sweep)*o.len*.92;
        var yy=mix(.6+(.5+.5*Math.cos(ph))*power*c.oarLift,o.y*.7+1.2,furl),A=[o.x,o.y,o.z],B=[o.x+dx,yy,o.z+o.side*dz];
        poles.setMatrixAt(i,matrixBetween(A,B,1));
        mid.set(B[0]+dx*.04,B[1],B[2]+o.side*dz*.04);quat.setFromAxisAngle(axis,-sweep*o.side);sc.set(1,1,1);blades.setMatrixAt(i,mat4.compose(mid,quat,sc));
      });
      if(n){poles.instanceMatrix.needsUpdate=true;blades.instanceMatrix.needsUpdate=true;}
    }
    update({rig:{fill:1,brace:0}},0);
    return {root:dynamic,update:update,sails:sails,oars:oars.length,sailRopes:ties.length};
  }};
})(window);

var specs={"barca":{"id":"barca","name":"바르카","cult":"eu","hull":"west","cap":90.0,"len":1,"sails":["sq"],"traits":["shallow"],"p":{"scale":0.76,"beam":0.76,"free":0.62,"form":"open","stern":"open","rig":"single","rail":0},"L":114.0,"W":29.457600000000003,"H":7.846914205415692,"masts":[4.5600000000000005],"heights":[67.0]},"cog":{"id":"cog","name":"코그","cult":"eu","hull":"west","cap":150.0,"len":1,"sails":["sq"],"traits":["sturdy"],"p":{"scale":0.84,"beam":1.22,"free":1.18,"form":"bluff","stern":"castle","rig":"cog","clinker":1},"L":126.0,"W":52.2648,"H":15.84655705507781,"masts":[5.04],"heights":[67.0]},"hulk":{"id":"hulk","name":"홀크","cult":"eu","hull":"west","cap":430.0,"len":1,"sails":["sq","sq"],"traits":["sturdy","thrift"],"p":{"scale":0.96,"beam":1.22,"free":1.28,"form":"round","stern":"castle","bow":"castle","rig":"hulk","clinker":1},"L":144.0,"W":59.7312,"H":20.231940581032656,"masts":[46.08,-50.39999999999999],"heights":[70.35000000000001,57.62]},"caravel":{"id":"caravel","name":"카라벨","cult":"eu","hull":"west","cap":170.0,"len":1,"sails":["lat","lat"],"traits":["scout","shallow"],"p":{"scale":0.88,"beam":0.78,"free":0.75,"form":"fine","stern":"quarter","rig":"lateen"},"L":132.0,"W":35.006400000000006,"H":10.238065010185114,"masts":[42.24,-46.19999999999999],"heights":[70.35000000000001,57.62]},"lcaravel":{"id":"lcaravel","name":"대형카라벨","cult":"eu","hull":"west","cap":260.0,"len":1,"sails":["sq","lat","lat"],"traits":["scout"],"p":{"scale":0.96,"beam":0.84,"free":0.86,"form":"fine","stern":"quarter","bow":"beak","rig":"mixed"},"L":144.0,"W":41.1264,"H":12.482783331580581,"masts":[46.08,-2.159999999999994,-50.39999999999999],"heights":[58.96,75.71,53.6]},"pinnace":{"id":"pinnace","name":"피너스","cult":"eu","hull":"west","cap":120.0,"len":1,"sails":["sq","lat"],"traits":["scout","oar"],"p":{"scale":0.78,"beam":0.72,"free":0.62,"form":"fine","stern":"open","bow":"beak","rig":"pinnace","oars":5},"L":117.0,"W":28.6416,"H":8.101692719657937,"masts":[37.44,-40.94999999999999],"heights":[70.35000000000001,57.62]},"carrack":{"id":"carrack","name":"카락","cult":"eu","hull":"west","cap":380.0,"len":1,"sails":["sq","sq","lat"],"traits":["highdeck"],"p":{"scale":1.0,"beam":1.08,"free":1.25,"form":"round","stern":"high","bow":"castle","rig":"carrack","guns":4},"L":150.0,"W":55.08000000000001,"H":19.322756041366276,"masts":[48.0,-2.249999999999994,-52.499999999999986],"heights":[58.96,75.71,53.6]},"lcarrack":{"id":"lcarrack","name":"대형카락","cult":"eu","hull":"west","cap":560.0,"len":1,"sails":["sq","sq","lat","lat"],"traits":["highdeck"],"p":{"scale":1.04,"beam":1.12,"free":1.34,"form":"round","stern":"high","bow":"castle","rig":"carrack","guns":5},"L":156.0,"W":59.404800000000016,"H":22.278852538475906,"masts":[49.92,15.080000000000005,-19.759999999999987,-54.59999999999999],"heights":[57.0,84.00000000000001,73.5,53.25]},"hcarrack":{"id":"hcarrack","name":"중카락","cult":"eu","hull":"west","cap":720.0,"len":1,"sails":["sq","sq","sq","lat"],"traits":["highdeck","sturdy"],"p":{"scale":1.07,"beam":1.15,"free":1.42,"form":"round","stern":"tower","bow":"castle","rig":"carrack","guns":6},"L":160.5,"W":62.755500000000005,"H":24.868727534246997,"masts":[51.36,15.515000000000006,-20.329999999999988,-56.17499999999999],"heights":[57.0,84.00000000000001,73.5,53.25]},"galleon":{"id":"galleon","name":"갤리온","cult":"eu","hull":"west","cap":620.0,"len":1,"sails":["sq","sq","lat","lat"],"traits":["gundeck"],"p":{"scale":1.04,"beam":0.91,"free":1.04,"form":"fine","stern":"gallery","bow":"beak","rig":"galleon","guns":6},"L":156.0,"W":48.266400000000004,"H":17.65082152586864,"masts":[49.92,15.080000000000005,-19.759999999999987,-54.59999999999999],"heights":[57.0,84.00000000000001,73.5,53.25]},"lgalleon":{"id":"lgalleon","name":"대형 갤리온","cult":"eu","hull":"west","cap":900.0,"len":1,"sails":["sq","sq","sq","lat"],"traits":["gundeck","highdeck"],"p":{"scale":1.08,"beam":0.96,"free":1.14,"form":"fine","stern":"gallery","bow":"beak","rig":"galleon","guns":8},"L":162.0,"W":52.8768,"H":20.52,"masts":[51.84,15.660000000000007,-20.51999999999999,-56.69999999999999],"heights":[57.0,84.00000000000001,73.5,53.25]},"fluyt":{"id":"fluyt","name":"플류트","cult":"eu","hull":"west","cap":680.0,"len":1,"sails":["sq","sq","lat"],"traits":["thrift"],"p":{"scale":1.0,"beam":1.08,"free":1.12,"form":"pear","stern":"round","bow":"round","rig":"fluyt","guns":2},"L":150.0,"W":55.08000000000001,"H":19.377687497086207,"masts":[48.0,-2.249999999999994,-52.499999999999986],"heights":[66.0,84.74999999999999,60.0]},"frigate":{"id":"frigate","name":"프리깃","cult":"eu","hull":"west","cap":460.0,"len":1,"sails":["sq","sq","sq","lat"],"traits":["gundeck"],"p":{"scale":1.08,"beam":0.75,"free":0.78,"form":"fine","stern":"gallery","bow":"beak","rig":"frigate","guns":7},"L":162.0,"W":41.31,"H":12.484158152752745,"masts":[51.84,15.660000000000007,-20.51999999999999,-56.69999999999999],"heights":[50.92,75.04,65.66,47.57]},"tartane":{"id":"tartane","name":"타르타나","cult":"eu","hull":"west","cap":130.0,"len":1,"sails":["lat"],"traits":["shallow","thrift"],"p":{"scale":0.76,"beam":0.82,"free":0.63,"form":"fine","stern":"open","rig":"lateen"},"L":114.0,"W":31.7832,"H":8.31126944987488,"masts":[11.4],"heights":[67.0]},"galley":{"id":"galley","name":"갤리","cult":"eu","hull":"galley","cap":110.0,"len":1.35,"sails":["lat"],"traits":["oar","bow","ram","coast"],"p":{"scale":1.0,"beam":0.9,"free":0.58,"form":"needle","stern":"quarter","bow":"ram","rig":"galley","oars":11},"L":165.0,"W":32.67,"H":7.503265569428326,"masts":[16.5],"heights":[58.96]},"greatgalley":{"id":"greatgalley","name":"대형 갤리","cult":"eu","hull":"galley","cap":300.0,"len":1.35,"sails":["lat","lat","lat"],"traits":["oar","bow","highdeck"],"p":{"scale":1.06,"beam":1.03,"free":0.72,"form":"needle","stern":"castle","bow":"ram","rig":"galley","oars":13},"L":174.9,"W":39.63234,"H":10.691814428058859,"masts":[54.219,0.0,-54.219],"heights":[51.8848,66.6248,47.168000000000006]},"galleass":{"id":"galleass","name":"갤리어스","cult":"eu","hull":"galley","cap":340.0,"len":1.45,"sails":["lat","lat","lat"],"traits":["oar","dragon","highdeck","coast"],"p":{"scale":1.08,"beam":1.16,"free":0.91,"form":"needle","stern":"castle","bow":"ram","rig":"galleass","oars":14,"guns":6},"L":178.20000000000002,"W":45.476639999999996,"H":13.798279855436457,"masts":[55.242000000000004,0.0,-55.242000000000004],"heights":[51.8848,66.6248,47.168000000000006]},"fusta":{"id":"fusta","name":"푸스타","cult":"eu","hull":"galley","cap":70.0,"len":1.25,"sails":["lat"],"traits":["oar","bow","grapple","coast"],"p":{"scale":0.91,"beam":0.72,"free":0.48,"form":"needle","stern":"open","bow":"ram","rig":"galley","oars":9},"L":150.15,"W":23.78376,"H":5.924471075661797,"masts":[15.015],"heights":[58.96]},"xebec":{"id":"xebec","name":"지벡","cult":"eu","hull":"galley","cap":190.0,"len":1.2,"sails":["lat","lat","lat"],"traits":["oar","grapple"],"p":{"scale":1.02,"beam":0.82,"free":0.62,"form":"needle","stern":"quarter","bow":"beak","rig":"xebec","oars":10,"guns":3},"L":168.3,"W":30.36132,"H":8.592910863362864,"masts":[52.173,0.0,-52.173],"heights":[51.8848,66.6248,47.168000000000006]},"dhow":{"id":"dhow","name":"다우","cult":"is","hull":"dhow","cap":210.0,"len":1,"sails":["lat","lat"],"traits":["sewn","monsoon"],"p":{"scale":0.91,"beam":0.91,"free":0.82,"form":"dhow","stern":"transom","bow":"raked","rig":"dhow"},"L":136.5,"W":42.23310000000001,"H":11.527220100925094,"masts":[24.57,-34.125],"heights":[70.35000000000001,57.62]},"sambuk":{"id":"sambuk","name":"삼부크","cult":"is","hull":"dhow","cap":140.0,"len":1,"sails":["lat","lat"],"traits":["sewn","shallow"],"p":{"scale":0.78,"beam":0.78,"free":0.67,"form":"dhow","stern":"open","bow":"raked","rig":"dhow"},"L":117.0,"W":31.0284,"H":8.919713134618977,"masts":[21.06,-29.25],"heights":[70.35000000000001,57.62]},"baghlah":{"id":"baghlah","name":"바글라","cult":"is","hull":"dhow","cap":420.0,"len":1,"sails":["lat","lat","lat"],"traits":["monsoon","highdeck"],"p":{"scale":1.02,"beam":1.09,"free":1.05,"form":"dhow","stern":"high","bow":"raked","rig":"baghlah","guns":3},"L":153.0,"W":56.701800000000006,"H":16.525207050384246,"masts":[27.54,-5.355,-38.25],"heights":[58.96,75.71,53.6]},"parau":{"id":"parau","name":"파라우","cult":"is","hull":"galley","cap":60.0,"len":1.2,"sails":["lat"],"traits":["oar","grapple","shallow","coast"],"p":{"scale":0.84,"beam":0.7,"free":0.45,"form":"needle","stern":"open","bow":"raked","rig":"lateen","oars":8},"L":138.6,"W":21.344399999999997,"H":5.475991803244269,"masts":[13.86],"heights":[67.0]},"jong":{"id":"jong","name":"종","cult":"sa","hull":"jong","cap":720.0,"len":1,"sails":["lat","sq","lat","lat"],"traits":["layered","monsoon"],"p":{"scale":1.05,"beam":1.02,"free":1.16,"form":"jong","stern":"high","bow":"raked","rig":"jong","guns":3},"L":157.5,"W":62.65350000000001,"H":20.31529854910318,"masts":[47.25,13.649999999999997,-19.950000000000006,-53.550000000000004],"heights":[57.0,84.00000000000001,73.5,53.25]},"korakora":{"id":"korakora","name":"코라코라","cult":"sa","hull":"outrigger","cap":40.0,"len":1.25,"sails":["lat"],"traits":["oar","grapple","shallow","coast"],"p":{"scale":0.91,"beam":0.7,"free":0.38,"form":"canoe","stern":"raised","bow":"raised","rig":"korakora","oars":12,"outrigger":1},"L":150.15,"W":17.86785,"H":4.472932686083831,"masts":[6.006],"heights":[67.0]},"junk":{"id":"junk","name":"정크","cult":"ea","hull":"junk","cap":300.0,"len":1,"sails":["bat","bat"],"traits":["bulkhead"],"p":{"scale":0.88,"beam":0.92,"free":0.84,"form":"junk","stern":"junk","bow":"square","rig":"junk"},"L":132.0,"W":49.7904,"H":12.473783499402,"masts":[39.6,-44.88],"heights":[70.35000000000001,57.62]},"shachuan":{"id":"shachuan","name":"사선","cult":"ea","hull":"junk","cap":380.0,"len":1,"sails":["bat","bat","bat"],"traits":["bulkhead","shallow","coast"],"p":{"scale":0.95,"beam":0.84,"free":0.72,"form":"sand","stern":"junk","bow":"flat","rig":"junk"},"L":142.5,"W":49.077,"H":11.129907479826974,"masts":[42.75,-2.8500000000000023,-48.45],"heights":[58.96,75.71,53.6]},"ljunk":{"id":"ljunk","name":"대형 정크","cult":"ea","hull":"junk","cap":580.0,"len":1,"sails":["bat","bat","bat"],"traits":["bulkhead","highdeck"],"p":{"scale":1.03,"beam":1.04,"free":1.03,"form":"junk","stern":"high","bow":"square","rig":"junk","guns":4},"L":154.5,"W":65.8788,"H":17.245591753047396,"masts":[46.35,-3.0900000000000025,-52.53],"heights":[66.0,84.74999999999999,60.0]},"baochuan":{"id":"baochuan","name":"보선","cult":"ea","hull":"junk","cap":1400.0,"len":1.05,"sails":["bat","bat","bat","bat","bat"],"traits":["bulkhead","highdeck","awe"],"p":{"scale":1.1,"beam":1.18,"free":1.25,"form":"junk","stern":"tower","bow":"square","rig":"treasure","guns":4},"L":173.25,"W":83.81835,"H":22.5,"masts":[51.975,24.255,-3.465000000000003,-31.185,-58.905],"heights":[52.800000000000004,76.8,90.39999999999999,72.8,49.6]},"maengseon":{"id":"maengseon","name":"맹선","cult":"ea","hull":"kr","cap":240.0,"len":1,"sails":["bat","bat"],"traits":["oar","sturdy","shallow"],"p":{"scale":0.91,"beam":0.94,"free":0.64,"form":"box","stern":"open","bow":"flat","rig":"korean","oars":8},"L":136.5,"W":51.324,"H":9.176154462561476,"masts":[40.949999999999996,-46.410000000000004],"heights":[70.35000000000001,57.62]},"panokseon":{"id":"panokseon","name":"판옥선","cult":"ea","hull":"panok","cap":300.0,"len":1,"sails":["bat","bat"],"traits":["oar","highdeck","heavygun","coast"],"p":{"scale":0.98,"beam":1.02,"free":1.05,"form":"box","stern":"panok","bow":"flat","rig":"korean","oars":9,"guns":5},"L":147.0,"W":64.4742,"H":15.592229374252502,"masts":[44.1,-49.980000000000004],"heights":[70.35000000000001,57.62]},"geobukseon":{"id":"geobukseon","name":"거북선","cult":"ea","hull":"turtle","cap":150.0,"len":1,"sails":["bat","bat"],"traits":["oar","armor","spikes","ram","dragon","coast"],"p":{"scale":0.93,"beam":0.98,"free":0.88,"form":"box","stern":"turtle","bow":"dragon","rig":"korean","oars":9,"guns":5},"L":139.5,"W":57.4182,"H":11.817771363108875,"masts":[41.85,-47.43000000000001],"heights":[70.35000000000001,57.62]},"kobaya":{"id":"kobaya","name":"소조","cult":"ea","hull":"jp","cap":50.0,"len":1,"sails":["sq"],"traits":["oar","scout","coast"],"p":{"scale":0.8,"beam":0.73,"free":0.42,"form":"needle","stern":"open","bow":"raked","rig":"japanese","oars":8},"L":120.0,"W":30.66,"H":5.03155757467538,"masts":[4.8],"heights":[67.0]},"sekibune":{"id":"sekibune","name":"관선","cult":"ea","hull":"jp","cap":130.0,"len":1,"sails":["sq"],"traits":["oar","grapple","coast"],"p":{"scale":0.93,"beam":0.88,"free":0.68,"form":"box","stern":"quarter","bow":"raked","rig":"japanese","oars":10},"L":139.5,"W":42.965999999999994,"H":8.97089400938876,"masts":[5.58],"heights":[67.0]},"atakebune":{"id":"atakebune","name":"안택선","cult":"ea","hull":"atake","cap":260.0,"len":1,"sails":["sq"],"traits":["oar","armor","highdeck","coast"],"p":{"scale":1.03,"beam":1.04,"free":1.2,"form":"box","stern":"atake","bow":"flat","rig":"japanese","oars":12,"guns":5},"L":154.5,"W":67.4856,"H":17.417837206856625,"masts":[6.18],"heights":[67.0]},"balsa":{"id":"balsa","name":"발사","cult":"am","hull":"raft","cap":60.0,"len":1,"sails":["sq"],"traits":["raft","shallow"],"p":{"scale":0.78,"beam":1.12,"free":0.2,"form":"raft","stern":"open","rig":"raft"},"L":117.0,"W":58.968,"H":2.4337741347752306,"masts":[11.700000000000001],"heights":[67.0]}};
G.ShipModels={ids:Object.keys(specs),has:function(id){return Object.prototype.hasOwnProperty.call(specs,id);},
      create:function(T,id){
        if(!this.has(id))throw new Error('지원하지 않는 선종: '+id);
        window.Ship3D.init(T);var ship=new window.Ship3D.Ship(specs[id]);
        Object.keys(ship.C).forEach(function(k){ship.C[k]=ship.C[k].clone();});
        var data=G.FX.shipArt,p=data.profiles[id];if(!p)throw new Error('미술 프로필 누락: '+id);
        var look=Object.assign({},data.families.west,data.families[p.family],p);
        window.RigDetail.prepare(ship,G.FX.shipRig);
        if(id==='geobukseon')window.TurtleDetail.prepare(ship,G.FX.turtle3d);
        if(id==='galleon'||id==='lgalleon')ship=window.GalleonDetail.enrich(ship,T,Object.assign({},G.FX.ship3d,{art:look}));
        else ship=window.FleetDetail.enrich(ship,T,look,p);
        if(id==='geobukseon')window.TurtleDetail.enrich(ship,T,G.FX.turtle3d);
        ship=window.ShipFinish.enrich(ship,T,p);window.FleetCraft.enrich(ship,T,p);window.RigDetail.enrich(ship,T);ship.artProfile=p;return ship;
      },makeRig:function(ship,T,batch,cfg){return window.RuntimeRig.make(ship,T,batch,cfg);}
    };})(window.G=window.G||{});
