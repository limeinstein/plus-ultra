/* 거리를 걷는 마을 사람 그림 (G.Art.folkSpec · G.Art.drawFolk) — 옆모습, 걷는 동작은 다리·팔을 흔들어 그때그때 그린다.
   사람이 그린 그림이 있으면 그쪽이 먼저: images/street-folk/<종류>_<문화권>/walk_1… 또는 images/street-folk/<종류>/walk_1… (js/systems/streetfolk.js)
   종류(type): man woman boy girl elder grandma librarian innkeeper dog cat adventurer merchant noble soldier navigator
   문화권(cul): europe islam south eastasia native — A.cultureOf(도시). 세부 양식(st)은 G.Img.folkStyle(도시): kr·jp·cn·af·az·an·na… */
(function (G) {
  'use strict';
  var A = G.Art, U = G.U;
  var INK = '#2a1d12';

  // ---------------------------------------------------------------- 생김새
  var SKIN = {
    europe: ['#f1cfae', '#e8c09b', '#ddb08a', '#f3d6bb'], islam: ['#d8a878', '#c99766', '#b98757', '#e0b48a'],
    south: ['#b07c52', '#9c6a44', '#c08a5e', '#8a5a38'], eastasia: ['#efcfa6', '#e6c296', '#f2d6b2', '#dcb88c'],
    native: ['#a8714a', '#8e5a38', '#b8825a', '#6e4428'], africa: ['#6e4a32', '#5a3a26', '#7e5638', '#4a3020']
  };
  var HAIR = { europe: ['#3a2618', '#5a3a20', '#7a5a34', '#2a1c14', '#9a7a4a'], islam: ['#1e1612', '#2a1c14', '#3a2618'], south: ['#120e0c', '#1e1612'], eastasia: ['#121014', '#1a1618'], native: ['#141010', '#1e1612'], africa: ['#121010'] };
  // 옷감 (문화권마다 결이 다른 빛깔)
  var CLOTH = {
    europe: ['#6a3a24', '#3a4a5a', '#5a6a3a', '#7a2a2a', '#4a3a5a', '#8a6a3a', '#5a4a3a', '#2a3a4a'],
    islam: ['#e6dcc4', '#c8b48a', '#8a5a3a', '#3a5a6a', '#6a3a2a', '#d8c8a0', '#4a4a5a'],
    south: ['#c86a2a', '#b83a3a', '#2a7a5a', '#d8a83a', '#7a3a7a', '#e8dcc0', '#3a6a9a'],
    eastasia: ['#3a4a6a', '#5a6a7a', '#e8e4d8', '#6a5a4a', '#2a3a3a', '#7a8a8a', '#4a3a3a'],
    native: ['#8a5a2a', '#a8743a', '#6a4a2a', '#b85a2a', '#c8a060', '#5a3a1e'],
    africa: ['#c8783a', '#2a5a8a', '#d8b040', '#8a2a2a', '#3a6a3a', '#e8dcc0']
  };
  function pick(rng, a) { return a[Math.floor(rng() * a.length)]; }
  function shade(c, k) {   // k<0 어둡게, k>0 밝게
    var n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); }
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  /** 문화권: europe·islam·south·eastasia·native, 아프리카 사람은 skin 'africa' */
  function culOf(c) {
    var cul = A.cultureOf ? A.cultureOf(c) : 'europe', st = G.Img && G.Img.folkStyle ? G.Img.folkStyle(c) : c.style;
    var afr = st === 'af' || st === 'sw' || st === 'tr' || (c.region === 3 && cul !== 'islam');
    return { cul: cul, st: st, afr: afr };
  }
  A.folkCulture = culOf;

  /** 한 사람(짐승)의 생김새. type·도시·씨앗 → spec */
  A.folkSpec = function (type, c, seed, opts) {
    opts = opts || {};
    var rng = U.makeRng(U.strHash('folk:' + seed + ':' + type)), K = culOf(c), cul = K.cul, st = K.st;
    var skinKey = K.afr ? 'africa' : cul === 'native' ? 'native' : cul;
    var s = { type: type, cul: cul, st: st, afr: K.afr, seed: seed,
      skin: pick(rng, SKIN[skinKey] || SKIN.europe), hair: pick(rng, HAIR[skinKey] || HAIR.europe),
      top: pick(rng, CLOTH[K.afr ? 'africa' : cul] || CLOTH.europe), bottom: pick(rng, CLOTH[K.afr ? 'africa' : cul] || CLOTH.europe),
      accent: pick(rng, ['#c8a040', '#a83a2a', '#e8dcc0', '#3a5a8a', '#5a7a3a']), hat: 'none', prop: null, garment: 'tunic',
      h: 150, stoop: 0, beard: 0, sex: 'm', grey: false, boots: '#3a2a1e' };
    if (s.bottom === s.top) s.bottom = shade(s.top, -0.35);
    var asia = cul === 'eastasia', isl = cul === 'islam', south = cul === 'south', nat = cul === 'native';
    switch (type) {
      case 'man':
        s.garment = asia ? 'robeShort' : isl ? 'robe' : south ? (rng() < 0.5 ? 'wrap' : 'tunic') : nat ? 'wrap' : 'tunic';
        s.hat = asia ? (st === 'kr' ? 'gat' : st === 'jp' ? 'none' : rng() < 0.5 ? 'conical' : 'none') : isl ? 'turban' : south ? (rng() < 0.6 ? 'turban' : 'none') : nat ? (rng() < 0.5 ? 'band' : 'none') : pick(rng, ['cap', 'none', 'beret']);
        s.hairStyle = st === 'jp' ? 'topknot' : asia ? 'bun' : 'short'; s.beard = isl || rng() < 0.3 ? 1 : 0; s.prop = rng() < 0.4 ? 'sack' : null; break;
      case 'woman':
        s.sex = 'f'; s.h = 142; s.garment = asia ? (st === 'jp' ? 'kimono' : 'hanbok') : south && !K.afr ? 'sari' : isl ? 'robe' : 'dress';
        s.hat = isl ? 'hijab' : cul === 'europe' ? pick(rng, ['coif', 'kerchief', 'none']) : K.afr ? 'headwrap' : 'none';
        s.hairStyle = asia ? 'bun' : 'long'; s.prop = rng() < 0.6 ? 'basket' : null; break;
      case 'boy':
        s.h = 100; s.garment = asia ? 'robeShort' : isl ? 'robe' : nat || K.afr ? 'wrap' : 'tunic'; s.hat = isl && rng() < 0.5 ? 'kufi' : 'none'; s.hairStyle = asia ? 'bun' : 'short'; s.child = true; s.prop = rng() < 0.4 ? 'stick' : null; break;
      case 'girl':
        s.sex = 'f'; s.h = 96; s.garment = asia ? (st === 'jp' ? 'kimono' : 'hanbok') : 'dress'; s.hat = isl ? 'hijab' : 'none'; s.hairStyle = asia ? 'bun' : 'braid'; s.child = true; s.prop = rng() < 0.5 ? 'flower' : null; break;
      case 'elder':
        s.h = 140; s.stoop = 0.14; s.grey = true; s.beard = 2; s.garment = asia ? 'robe' : isl ? 'robe' : south ? 'wrap' : nat ? 'wrap' : 'coat';
        s.hat = asia ? (st === 'kr' ? 'gat' : 'none') : isl ? 'turban' : south ? 'turban' : nat ? 'feather' : 'cap'; s.hairStyle = asia ? 'bun' : 'short'; s.prop = 'cane'; s.top = shade(s.top, -0.15); break;
      case 'grandma':
        s.sex = 'f'; s.h = 132; s.stoop = 0.16; s.grey = true; s.garment = asia ? (st === 'jp' ? 'kimono' : 'hanbok') : south ? 'sari' : isl ? 'robe' : 'dress';
        s.hat = isl ? 'hijab' : cul === 'europe' ? 'shawl' : K.afr ? 'headwrap' : 'none'; s.hairStyle = 'bun'; s.prop = 'cane'; s.top = shade(s.top, -0.2); break;
      case 'librarian':
        s.garment = 'robe'; s.top = asia ? '#3a3a4a' : isl ? '#e6dcc4' : '#2a2a3a'; s.hat = asia ? 'gauze' : isl ? 'turban' : pick(rng, ['beret', 'none']); s.hairStyle = 'short'; s.prop = 'book'; s.beard = rng() < 0.5 ? 1 : 0; s.specs = true; break;
      case 'innkeeper':
        s.sex = opts.sex || (rng() < 0.5 ? 'f' : 'm'); s.h = s.sex === 'f' ? 142 : 148; s.garment = s.sex === 'f' ? (asia ? 'hanbok' : 'dress') : (asia ? 'robeShort' : 'tunic');
        s.apron = true; s.hat = s.sex === 'f' ? (isl ? 'hijab' : 'coif') : (isl ? 'kufi' : 'none'); s.hairStyle = s.sex === 'f' ? 'bun' : 'short'; s.prop = 'keys'; s.wide = 1.18; break;
      case 'adventurer':
        s.garment = 'coat'; s.top = pick(rng, ['#5a4a2a', '#4a3a2a', '#3a4a3a', '#6a4a2a']); s.hat = isl ? 'turban' : asia ? 'conical' : 'wide'; s.hairStyle = 'short'; s.prop = 'sword'; s.pack = true; s.beard = rng() < 0.5 ? 1 : 0; s.cloak = shade(s.top, -0.25); break;
      case 'merchant':
        s.garment = 'coat'; s.wide = 1.2; s.top = pick(rng, ['#6a2a2a', '#2a3a5a', '#4a2a4a', '#5a4a2a']); s.trim = '#d8c8a0'; s.hat = isl ? 'turban' : asia ? 'gauze' : 'beret'; s.hairStyle = 'short'; s.prop = 'satchel'; s.beard = rng() < 0.5 ? 1 : 0; break;
      case 'noble':
        s.garment = asia ? 'robe' : isl ? 'robe' : 'doublet'; s.top = pick(rng, ['#7a1e2a', '#1e3a6a', '#3a1e5a', '#1e4a3a']); s.bottom = '#2a2028'; s.gold = true;
        s.hat = asia ? 'gauze' : isl ? 'turban' : nat ? 'feather' : 'plume'; s.hairStyle = 'short'; s.prop = asia || isl ? 'fan' : 'rapier'; s.cape = asia ? null : shade(s.top, -0.3); s.ruff = cul === 'europe'; break;
      case 'soldier':
        s.garment = asia ? 'armorA' : nat || K.afr ? 'wrap' : 'armor'; s.top = asia ? '#5a3a2a' : nat || K.afr ? pick(rng, ['#8a5a2a', '#a8743a', '#6a4a2a']) : '#8a8a8a'; s.bottom = pick(rng, ['#5a2a2a', '#3a3a4a', '#4a4a3a']);
        s.hat = asia ? 'helmetA' : isl ? 'turbanHelm' : nat || K.afr ? 'band' : 'morion'; s.hairStyle = 'short'; s.prop = nat || K.afr ? 'spearShield' : 'halberd'; s.beard = rng() < 0.5 ? 1 : 0; break;
      case 'navigator':
        s.garment = 'coat'; s.top = pick(rng, ['#28435a', '#2a3a4a', '#3a2a24']); s.hat = isl ? 'turban' : asia ? 'conical' : 'cap'; s.hairStyle = 'short'; s.prop = 'spyglass'; s.beard = rng() < 0.6 ? 1 : 0; s.sash = '#a83a2a'; break;
      case 'dog':
        s.h = 58; s.fur = pick(rng, ['#8a5a2a', '#c8a070', '#3a2a1e', '#e8dcc0', '#6a4a30']); s.patch = rng() < 0.5 ? shade(s.fur, -0.4) : null; break;
      case 'cat':
        s.h = 40; s.fur = pick(rng, ['#d88a3a', '#5a5048', '#e8e0d0', '#2a2420', '#a08060']); s.stripe = rng() < 0.6; break;
    }
    // 대화창 얼굴이 여자면 거리의 모습도 여자로 (장사꾼·사서 등 — js/systems/streetfolk.js 가 얼굴 그림의 성별을 넘겨준다)
    if (opts.sex === 'f' && s.sex !== 'f' && type !== 'dog' && type !== 'cat') {
      s.sex = 'f'; s.beard = 0; s.h = Math.round(s.h * 0.95); s.hairStyle = asia ? 'bun' : 'long'; s.cape = null; s.ruff = false;
      if (s.garment === 'coat' || s.garment === 'tunic' || s.garment === 'doublet' || s.garment === 'robeShort') s.garment = asia ? (st === 'jp' ? 'kimono' : 'hanbok') : isl ? 'robe' : 'dress';
      if (/beret|cap|plume|kufi|gauze/.test(s.hat)) s.hat = isl ? 'hijab' : asia ? 'none' : 'coif';
      if (s.prop === 'rapier') s.prop = 'fan';
    }
    if (s.grey) s.hair = pick(rng, ['#c8c4bc', '#e0dcd4', '#a8a49c']);
    s.h = Math.round(s.h * (0.96 + rng() * 0.08));
    return s;
  };

  // ---------------------------------------------------------------- 그리기 도구
  function seg(ctx, pts, w, col) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = w + 3; line(ctx, pts);
    ctx.strokeStyle = col; ctx.lineWidth = w; line(ctx, pts);
  }
  function line(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }
  function fillPath(ctx, pts, col, close) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) { var p = pts[i]; if (p.length === 4) ctx.quadraticCurveTo(p[0], p[1], p[2], p[3]); else ctx.lineTo(p[0], p[1]); }
    if (close !== false) ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  }
  function circle(ctx, x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
  /** 관절 두 개로 된 팔다리: 어깨(엉덩이)에서 각도 a1로 l1, 거기서 a2로 l2 (0 = 똑바로 아래, +는 앞) */
  function joint(x, y, a1, l1, a2, l2) { var k = [x + Math.sin(a1) * l1, y + Math.cos(a1) * l1]; return [[x, y], k, [k[0] + Math.sin(a2) * l2, k[1] + Math.cos(a2) * l2]]; }

  // ---------------------------------------------------------------- 사람
  /** 발 가운데 (0,0)에 서서 오른쪽을 본다. ph: 걸음 0~1, moving: 걷는 중인가 */
  function person(ctx, s, ph, moving) {
    var H = s.h, R = H * (s.child ? 0.095 : 0.074), sw = moving ? 1 : 0;
    var t = ph * Math.PI * 2, bob = moving ? -Math.abs(Math.cos(t)) * H * 0.012 : 0;
    var wide = (s.wide || 1) * (s.sex === 'f' ? 0.94 : 1);
    var hipY = -H * 0.47 + bob, shY = -H * 0.79 + bob, lean = s.stoop * H * 0.6;
    var hipX = 0, shX = lean * 0.5 + H * 0.01;
    var legL = H * 0.245, shinL = H * 0.235, armL = H * 0.17, foreL = H * 0.16;
    var swingL = 0.42 * sw, swingA = 0.5 * sw * (s.stoop ? 0.6 : 1);
    var longSkirt = /dress|robe|sari|kimono|hanbok/.test(s.garment);
    var legCol = s.bottom, armCol = s.garment === 'armor' ? '#9a9a9a' : s.top;
    function leg(phase, back) {
      var th = Math.sin(phase) * swingL, bend = sw * 0.55 * Math.max(0, -Math.cos(phase));
      var p = joint(hipX + (back ? -1 : 1) * H * 0.012, hipY, th, legL, th - bend, shinL);
      var col = back ? shade(legCol, -0.25) : legCol;
      if (!longSkirt) seg(ctx, p, H * 0.07 * wide, col);
      // 장화·신
      var f = p[2], bl = back ? shade(s.boots, -0.2) : s.boots;
      ctx.beginPath(); ctx.ellipse(f[0] + H * 0.025, f[1] - H * 0.006, H * 0.045, H * 0.022, 0, 0, 7); ctx.fillStyle = s.cul === 'eastasia' || s.cul === 'south' || s.cul === 'native' ? (back ? '#4a3a2a' : '#6a5038') : bl; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
      return p;
    }
    function arm(phase, back) {
      var a = -Math.sin(phase) * swingA + (back ? 0.05 : -0.05), el = 0.28 + (s.prop && !back ? 0.35 : 0);
      if (!back && (s.prop === 'cane')) { a = 0.35 + Math.sin(phase) * 0.12 * sw; el = 0.15; }
      if (!back && (s.prop === 'halberd' || s.prop === 'spearShield')) { a = 0.25; el = 1.2; }
      if (!back && (s.prop === 'book' || s.prop === 'spyglass' || s.prop === 'fan' || s.prop === 'flower')) { a = 0.2; el = 1.5; }
      if (!back && s.prop === 'basket') { a = 0.05; el = 1.25; }
      var p = joint(shX + (back ? -1 : 1) * H * 0.02, shY + H * 0.02, a, armL, a + el, foreL);
      seg(ctx, p, H * 0.058 * wide, back ? shade(armCol, -0.28) : armCol);
      circle(ctx, p[2][0], p[2][1], H * 0.024, back ? shade(s.skin, -0.15) : s.skin);
      return p;
    }
    // 그림자
    ctx.fillStyle = 'rgba(40,26,12,.28)'; ctx.beginPath(); ctx.ellipse(0, 0, H * 0.17, H * 0.03, 0, 0, 7); ctx.fill();
    // 망토 (뒤)
    if (s.cape || s.cloak) fillPath(ctx, [[shX - H * 0.05, shY], [shX - H * 0.16 - Math.sin(t) * 3 * sw, hipY + H * 0.12], [shX - H * 0.02, hipY + H * 0.1]], s.cape || s.cloak);
    if (s.pack) fillPath(ctx, [[shX - H * 0.13, shY + H * 0.02], [shX - H * 0.2, shY + H * 0.06], [shX - H * 0.19, shY + H * 0.2], [shX - H * 0.08, shY + H * 0.2]], '#6a4a2a');
    // 뒤쪽 팔·다리
    arm(t + Math.PI, true); leg(t + Math.PI, true);
    // 몸통
    var wT = H * 0.11 * wide, wH = H * 0.1 * wide;
    if (longSkirt) {
      var hem = -H * 0.03, flare = H * (s.garment === 'kimono' ? 0.11 : s.garment === 'sari' ? 0.14 : s.garment === 'hanbok' ? 0.2 : 0.17) * wide, sway = Math.sin(t) * H * 0.02 * sw;
      leg(t, false);
      var skirtCol = s.garment === 'robe' || s.garment === 'kimono' ? s.top : s.bottom;
      fillPath(ctx, [[shX - wT, shY + H * 0.04], [shX + wT * 0.95, shY + H * 0.04], [hipX + wH * 0.9, hipY], [flare + sway, hem], [-flare * 0.95 + sway * 0.6, hem], [hipX - wH, hipY]], skirtCol);
      if (s.garment === 'hanbok') { fillPath(ctx, [[shX - wT * 0.9, shY], [shX + wT * 0.95, shY], [shX + wT, shY + H * 0.1], [shX - wT, shY + H * 0.1]], s.top); ctx.strokeStyle = s.accent; ctx.lineWidth = 3; line(ctx, [[shX + wT * 0.3, shY + H * 0.05], [shX + wT * 0.7, shY + H * 0.14]]); }
      if (s.garment === 'kimono') { ctx.fillStyle = s.accent; ctx.fillRect(hipX - wH, hipY - H * 0.07, wH * 1.95, H * 0.06); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(hipX - wH, hipY - H * 0.07, wH * 1.95, H * 0.06); }
      if (s.garment === 'sari') { ctx.strokeStyle = s.accent; ctx.lineWidth = H * 0.025; line(ctx, [[shX + wT * 0.8, shY + H * 0.03], [hipX - wH * 0.6, hipY + H * 0.08]]); }
      if (s.garment === 'dress' || s.garment === 'robe') { ctx.strokeStyle = shade(skirtCol, -0.3); ctx.lineWidth = 1.5; line(ctx, [[hipX + 2, hipY + 6], [hipX + 4 + sway, hem - 3]]); }
    } else {
      leg(t, false);
      var tailY = s.garment === 'coat' ? hipY + H * 0.2 : s.garment === 'robeShort' || s.garment === 'wrap' ? hipY + H * 0.12 : hipY + H * 0.05;
      var flap = Math.sin(t) * H * 0.012 * sw;
      fillPath(ctx, [[shX - wT, shY + H * 0.02], [shX + wT * 0.95, shY + H * 0.02], [hipX + wH * 1.05 + flap, tailY], [hipX - wH * 1.1 + flap, tailY]], s.garment === 'armor' || s.garment === 'armorA' ? s.bottom : s.top);
      if (s.garment === 'armor') { fillPath(ctx, [[shX - wT * 0.95, shY + H * 0.03], [shX + wT * 1.05, shY + H * 0.03], [hipX + wH * 1.05, hipY - H * 0.01], [hipX - wH, hipY - H * 0.01]], '#a8a8a8'); ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 2; line(ctx, [[shX + wT * 0.4, shY + H * 0.06], [hipX + wH * 0.5, hipY - H * 0.04]]); }
      if (s.garment === 'armorA') { for (var r = 0; r < 4; r++) { ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1.5; line(ctx, [[shX - wT, shY + H * (0.07 + r * 0.06)], [shX + wT, shY + H * (0.07 + r * 0.06)]]); } }
      if (s.garment === 'doublet') { ctx.strokeStyle = s.gold ? '#d8b040' : s.accent; ctx.lineWidth = 2; for (var b = 0; b < 4; b++) circle(ctx, shX + wT * 0.75, shY + H * (0.05 + b * 0.055), 1.6, '#d8b040'); }
      // 허리띠
      ctx.fillStyle = s.sash || '#3a2414'; ctx.fillRect(hipX - wH * 1.02, hipY - H * 0.035, wH * 2.05, H * 0.03);
      if (s.trim) { ctx.strokeStyle = s.trim; ctx.lineWidth = 3; line(ctx, [[shX + wT * 0.9, shY + H * 0.03], [hipX + wH * 1.05, tailY - 2]]); }
    }
    if (s.apron) fillPath(ctx, [[shX + wT * 0.2, shY + H * 0.08], [shX + wT * 1.0, shY + H * 0.08], [hipX + wH * 1.2, hipY + H * 0.24], [hipX + wH * 0.1, hipY + H * 0.24]], '#ece4d0');
    if (s.ruff) { ctx.fillStyle = '#f2ece0'; ctx.beginPath(); ctx.ellipse(shX + H * 0.01, shY - H * 0.005, H * 0.045, H * 0.02, 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); }
    if (s.prop === 'sword' || s.prop === 'rapier') { ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = s.prop === 'rapier' ? 2 : 3.5; line(ctx, [[hipX - wH * 0.6, hipY], [hipX - wH * 0.6 - H * 0.2, hipY + H * 0.2]]); ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 3; line(ctx, [[hipX - wH * 0.3, hipY - H * 0.03], [hipX - wH * 0.9, hipY + H * 0.03]]); }
    if (s.prop === 'satchel') { fillPath(ctx, [[hipX + wH * 0.4, hipY - H * 0.04], [hipX + wH * 1.35, hipY - H * 0.04], [hipX + wH * 1.35, hipY + H * 0.08], [hipX + wH * 0.4, hipY + H * 0.08]], '#7a4a24'); ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 2; line(ctx, [[shX - wT * 0.5, shY + 2], [hipX + wH * 0.9, hipY - H * 0.04]]); }
    if (s.prop === 'sack') fillPath(ctx, [[shX - wT * 0.4, shY - H * 0.04], [shX - wT * 1.6, shY - H * 0.02], [shX - wT * 1.7, shY + H * 0.12], [shX - wT * 0.5, shY + H * 0.1]], '#c8b088');
    // 머리
    var hx = shX + H * 0.025 + lean * 0.4, hy = shY - R * 1.15;
    ctx.fillStyle = s.skin; ctx.fillRect(hx - R * 0.35, hy + R * 0.6, R * 0.6, R * 0.7);   // 목
    hairBack(ctx, s, hx, hy, R);
    circle(ctx, hx, hy, R, s.skin);
    // 코·눈·입
    ctx.fillStyle = s.skin; ctx.beginPath(); ctx.moveTo(hx + R * 0.85, hy - R * 0.1); ctx.lineTo(hx + R * 1.18, hy + R * 0.18); ctx.lineTo(hx + R * 0.85, hy + R * 0.3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + R * 0.45, hy - R * 0.08, Math.max(1.3, R * 0.12), 0, 7); ctx.fill();
    if (s.specs) { ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx + R * 0.48, hy - R * 0.06, R * 0.24, 0, 7); ctx.stroke(); }
    ctx.strokeStyle = shade(s.skin, -0.45); ctx.lineWidth = 1.5; line(ctx, [[hx + R * 0.55, hy + R * 0.48], [hx + R * 0.8, hy + R * 0.45]]);
    if (s.beard) { ctx.fillStyle = s.grey ? s.hair : shade(s.hair, 0.05); ctx.beginPath(); ctx.moveTo(hx + R * 0.85, hy + R * 0.32); ctx.quadraticCurveTo(hx + R * (s.beard > 1 ? 0.75 : 0.65), hy + R * (s.beard > 1 ? 1.5 : 1.05), hx - R * 0.1, hy + R * 0.7); ctx.lineTo(hx - R * 0.2, hy + R * 0.35); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); }
    hairTop(ctx, s, hx, hy, R);
    hat(ctx, s, hx, hy, R);
    // 앞쪽 팔
    var fr = arm(t, false);
    propFront(ctx, s, H, fr, t, sw);
  }
  function hairBack(ctx, s, hx, hy, R) {
    ctx.fillStyle = s.hair; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    if (s.hairStyle === 'long' && s.hat !== 'hijab') { ctx.beginPath(); ctx.moveTo(hx - R * 0.2, hy - R); ctx.quadraticCurveTo(hx - R * 1.6, hy + R * 0.6, hx - R * 0.9, hy + R * 2.2); ctx.lineTo(hx - R * 0.2, hy + R * 1.2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (s.hairStyle === 'braid' && s.hat !== 'hijab') { ctx.lineWidth = R * 0.45; ctx.strokeStyle = s.hair; ctx.lineCap = 'round'; line(ctx, [[hx - R * 0.7, hy + R * 0.2], [hx - R * 1.0, hy + R * 1.4]]); }
  }
  function hairTop(ctx, s, hx, hy, R) {
    if (s.hat === 'hijab' || s.hat === 'turban' || s.hat === 'turbanHelm' || s.hat === 'headwrap' || s.hat === 'shawl') return;
    ctx.fillStyle = s.hair; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(hx + R * 0.7, hy - R * 0.55); ctx.quadraticCurveTo(hx + R * 0.2, hy - R * 1.35, hx - R * 0.9, hy - R * 0.4); ctx.quadraticCurveTo(hx - R * 1.05, hy + R * 0.25, hx - R * 0.55, hy + R * 0.55); ctx.lineTo(hx - R * 0.1, hy - R * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (s.hairStyle === 'bun' || s.hairStyle === 'topknot') circle(ctx, hx - R * (s.hairStyle === 'topknot' ? 0.1 : 0.75), hy - R * (s.hairStyle === 'topknot' ? 1.1 : 0.55), R * 0.36, s.hair);
  }
  function hat(ctx, s, hx, hy, R) {
    var h = s.hat; if (!h || h === 'none') return;
    switch (h) {
      case 'cap': fillPath(ctx, [[hx - R * 0.95, hy - R * 0.35], [hx - R * 0.6, hy - R * 1.15], [hx + R * 0.55, hy - R * 1.05], [hx + R * 1.2, hy - R * 0.45]], shade(s.top, -0.2)); break;
      case 'beret': ctx.fillStyle = h === 'beret' ? (s.gold ? '#2a1e2a' : '#3a2a2a') : s.top; ctx.beginPath(); ctx.ellipse(hx - R * 0.05, hy - R * 0.85, R * 1.15, R * 0.45, -0.15, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); break;
      case 'plume': ctx.fillStyle = '#1e1a1e'; ctx.beginPath(); ctx.ellipse(hx, hy - R * 0.85, R * 1.3, R * 0.4, -0.12, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.stroke();
        ctx.strokeStyle = '#f2ece0'; ctx.lineWidth = R * 0.28; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx - R * 0.4, hy - R * 1.0); ctx.quadraticCurveTo(hx - R * 1.6, hy - R * 1.8, hx - R * 2.0, hy - R * 0.9); ctx.stroke(); break;
      case 'wide': fillPath(ctx, [[hx - R * 1.7, hy - R * 0.55], [hx + R * 1.8, hy - R * 0.7], [hx + R * 0.7, hy - R * 0.9], [hx + R * 0.55, hy - R * 1.6], [hx - R * 0.65, hy - R * 1.55], [hx - R * 0.8, hy - R * 0.85]], '#4a3420'); break;
      case 'conical': fillPath(ctx, [[hx - R * 1.9, hy - R * 0.45], [hx + R * 0.1, hy - R * 1.75], [hx + R * 2.0, hy - R * 0.45]], '#d8b878'); break;
      case 'gat': ctx.fillStyle = 'rgba(20,16,16,.85)'; ctx.beginPath(); ctx.ellipse(hx, hy - R * 0.75, R * 2.0, R * 0.28, 0, 0, 7); ctx.fill(); ctx.fillRect(hx - R * 0.55, hy - R * 1.75, R * 1.1, R * 1.0); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(hx - R * 0.55, hy - R * 1.75, R * 1.1, R * 1.0); line(ctx, [[hx + R * 0.3, hy - R * 0.6], [hx + R * 0.4, hy + R * 0.9]]); break;
      case 'gauze': fillPath(ctx, [[hx - R * 0.95, hy - R * 0.45], [hx - R * 0.8, hy - R * 1.35], [hx + R * 0.75, hy - R * 1.35], [hx + R * 0.95, hy - R * 0.45]], '#1e1e24'); ctx.fillStyle = '#1e1e24'; ctx.fillRect(hx - R * 1.6, hy - R * 1.05, R * 0.7, R * 0.18); break;
      case 'turban': case 'turbanHelm':
        ctx.fillStyle = h === 'turbanHelm' ? '#e8dcc4' : (s.cul === 'south' ? s.accent : '#f2ece0'); ctx.beginPath(); ctx.ellipse(hx - R * 0.05, hy - R * 0.72, R * 1.15, R * 0.75, 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = 'rgba(42,29,18,.45)'; line(ctx, [[hx - R * 0.9, hy - R * 0.5], [hx + R * 0.9, hy - R * 1.0]]);
        if (h === 'turbanHelm') { ctx.fillStyle = '#a8a8a8'; ctx.beginPath(); ctx.moveTo(hx - R * 0.4, hy - R * 1.3); ctx.lineTo(hx, hy - R * 2.1); ctx.lineTo(hx + R * 0.4, hy - R * 1.3); ctx.fill(); ctx.stroke(); }
        break;
      case 'kufi': fillPath(ctx, [[hx - R * 0.9, hy - R * 0.5], [hx - R * 0.6, hy - R * 1.1], [hx + R * 0.6, hy - R * 1.1], [hx + R * 0.85, hy - R * 0.55]], '#f2ece0'); break;
      case 'hijab': case 'shawl': case 'headwrap': case 'coif': case 'kerchief':
        var col = h === 'hijab' ? shade(s.top, -0.2) : h === 'shawl' ? '#6a5a4a' : h === 'headwrap' ? s.accent : '#f2ece0';
        if (h === 'kerchief') { fillPath(ctx, [[hx - R * 1.0, hy - R * 0.2], [hx - R * 0.5, hy - R * 1.1], [hx + R * 0.6, hy - R * 1.05], [hx + R * 0.8, hy - R * 0.55], [hx - R * 1.4, hy + R * 0.2]], s.accent); break; }
        if (h === 'headwrap') { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(hx - R * 0.2, hy - R * 0.85, R * 1.05, R * 0.75, -0.3, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); break; }
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(hx + R * 0.7, hy - R * 0.9);
        ctx.quadraticCurveTo(hx - R * 0.3, hy - R * 1.6, hx - R * 1.15, hy - R * 0.2);
        ctx.quadraticCurveTo(hx - R * (h === 'coif' ? 1.0 : 1.4), hy + R * (h === 'coif' ? 0.8 : 1.6), hx - R * (h === 'coif' ? 0.2 : 0.4), hy + R * (h === 'coif' ? 0.7 : 1.5));
        ctx.lineTo(hx + R * 0.15, hy + R * 0.85); ctx.quadraticCurveTo(hx + R * 0.55, hy - R * 0.2, hx + R * 0.7, hy - R * 0.9); ctx.closePath();
        ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); break;
      case 'morion': fillPath(ctx, [[hx - R * 1.6, hy - R * 0.5], [hx - R * 0.7, hy - R * 0.8], [hx - R * 0.5, hy - R * 1.5], [hx + R * 0.1, hy - R * 1.95], [hx + R * 0.6, hy - R * 1.5], [hx + R * 0.8, hy - R * 0.8], [hx + R * 1.7, hy - R * 0.55], [hx + R * 1.2, hy - R * 0.85], [hx - R * 1.1, hy - R * 0.85]], '#b8b8b8'); break;
      case 'helmetA': fillPath(ctx, [[hx - R * 1.2, hy - R * 0.2], [hx - R * 1.0, hy - R * 1.2], [hx + R * 0.1, hy - R * 1.5], [hx + R * 1.0, hy - R * 1.1], [hx + R * 1.05, hy - R * 0.5]], '#3a3028'); ctx.fillStyle = '#c8a050'; ctx.fillRect(hx - R * 0.2, hy - R * 1.95, R * 0.4, R * 0.5); break;
      case 'band': ctx.fillStyle = s.accent; ctx.fillRect(hx - R * 1.0, hy - R * 0.62, R * 1.95, R * 0.25); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(hx - R * 1.0, hy - R * 0.62, R * 1.95, R * 0.25); break;
      case 'feather': ctx.fillStyle = s.accent; ctx.fillRect(hx - R * 1.0, hy - R * 0.62, R * 1.95, R * 0.25); ctx.strokeStyle = '#f2ece0'; ctx.lineWidth = R * 0.25; ctx.lineCap = 'round'; line(ctx, [[hx - R * 0.8, hy - R * 0.6], [hx - R * 1.2, hy - R * 2.0]]); ctx.strokeStyle = '#8a2a1e'; line(ctx, [[hx - R * 0.5, hy - R * 0.6], [hx - R * 0.6, hy - R * 1.8]]); break;
    }
  }
  function propFront(ctx, s, H, p, t, sw) {
    var hand = p[2], hx = hand[0], hy = hand[1];
    switch (s.prop) {
      case 'cane': ctx.strokeStyle = INK; ctx.lineWidth = 5; line(ctx, [[hx, hy], [hx + H * 0.06, 0]]); ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 3; line(ctx, [[hx, hy], [hx + H * 0.06, 0]]); break;
      case 'book': fillPath(ctx, [[hx - H * 0.03, hy - H * 0.06], [hx + H * 0.05, hy - H * 0.07], [hx + H * 0.05, hy + H * 0.02], [hx - H * 0.03, hy + H * 0.03]], '#6a2a1e'); break;
      case 'spyglass': ctx.strokeStyle = INK; ctx.lineWidth = 7; line(ctx, [[hx - H * 0.03, hy + H * 0.02], [hx + H * 0.1, hy - H * 0.04]]); ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 4.5; line(ctx, [[hx - H * 0.03, hy + H * 0.02], [hx + H * 0.1, hy - H * 0.04]]); break;
      case 'fan': fillPath(ctx, [[hx, hy], [hx + H * 0.05, hy - H * 0.09], [hx + H * 0.11, hy - H * 0.04]], '#e8dcc0'); break;
      case 'flower': ctx.strokeStyle = '#3a6a2a'; ctx.lineWidth = 2; line(ctx, [[hx, hy], [hx + H * 0.03, hy - H * 0.1]]); circle(ctx, hx + H * 0.03, hy - H * 0.11, H * 0.025, '#d84a6a'); break;
      case 'basket': fillPath(ctx, [[hx - H * 0.06, hy], [hx + H * 0.06, hy], [hx + H * 0.045, hy + H * 0.07], [hx - H * 0.045, hy + H * 0.07]], '#b88a4a'); ctx.fillStyle = '#c84a3a'; ctx.beginPath(); ctx.arc(hx - H * 0.015, hy - H * 0.005, H * 0.018, 0, 7); ctx.arc(hx + H * 0.02, hy - H * 0.008, H * 0.016, 0, 7); ctx.fill(); break;
      case 'keys': ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy + H * 0.025, H * 0.018, 0, 7); ctx.stroke(); line(ctx, [[hx, hy + H * 0.04], [hx + H * 0.01, hy + H * 0.08]]); break;
      case 'stick': ctx.strokeStyle = INK; ctx.lineWidth = 4; line(ctx, [[hx - H * 0.05, hy + H * 0.1], [hx + H * 0.12, hy - H * 0.12]]); ctx.strokeStyle = '#9a7a4a'; ctx.lineWidth = 2; line(ctx, [[hx - H * 0.05, hy + H * 0.1], [hx + H * 0.12, hy - H * 0.12]]); break;
      case 'halberd': case 'spearShield':
        var top = -H * 1.18;
        ctx.strokeStyle = INK; ctx.lineWidth = 5; line(ctx, [[hx, 0], [hx, top]]); ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 3; line(ctx, [[hx, 0], [hx, top]]);
        if (s.prop === 'halberd') fillPath(ctx, [[hx, top - H * 0.08], [hx + H * 0.025, top], [hx + H * 0.09, top + H * 0.03], [hx + H * 0.09, top + H * 0.08], [hx, top + H * 0.06], [hx - H * 0.04, top + H * 0.04]], '#d0d0d0');
        else { fillPath(ctx, [[hx, top - H * 0.08], [hx + H * 0.02, top], [hx - H * 0.02, top]], '#d0d0d0'); ctx.fillStyle = s.accent; ctx.beginPath(); ctx.ellipse(hx + H * 0.02, -H * 0.55, H * 0.07, H * 0.13, 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); }
        break;
    }
  }

  // ---------------------------------------------------------------- 짐승
  function animal(ctx, s, ph, moving) {
    var H = s.h, t = ph * Math.PI * 2, sw = moving ? 1 : 0, cat = s.type === 'cat';
    var L = H * (cat ? 1.6 : 1.5), bodyY = -H * 0.62, legL = H * 0.5;
    ctx.fillStyle = 'rgba(40,26,12,.25)'; ctx.beginPath(); ctx.ellipse(0, 0, L * 0.55, H * 0.07, 0, 0, 7); ctx.fill();
    function legAt(x, phase, back) { var a = Math.sin(phase) * 0.5 * sw; seg(ctx, [[x, bodyY + H * 0.1], [x + Math.sin(a) * legL * 0.5, bodyY + H * 0.1 + legL * 0.5], [x + Math.sin(a * 0.6) * legL * 0.7, -H * 0.02]], H * (cat ? 0.09 : 0.12), back ? shade(s.fur, -0.25) : s.fur); }
    legAt(L * 0.32, t + Math.PI, true); legAt(-L * 0.3, t, true);
    // 꼬리
    var wag = Math.sin(t * (cat ? 0.5 : 2.4) + 1) * (cat ? 0.25 : 0.6);
    ctx.strokeStyle = INK; ctx.lineWidth = H * (cat ? 0.12 : 0.13) + 3; ctx.lineCap = 'round';
    var tx = -L * 0.48, ty = bodyY - H * 0.05, ex = tx - H * (cat ? 0.25 : 0.4) + Math.sin(wag) * H * 0.15, ey = ty - H * (cat ? 0.75 : 0.35);
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - H * 0.35, ty - H * 0.1, ex, ey); ctx.stroke();
    ctx.strokeStyle = s.fur; ctx.lineWidth = H * (cat ? 0.12 : 0.13); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - H * 0.35, ty - H * 0.1, ex, ey); ctx.stroke();
    // 몸
    ctx.fillStyle = s.fur; ctx.beginPath(); ctx.ellipse(0, bodyY, L * 0.52, H * (cat ? 0.2 : 0.24), 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    if (s.patch) { ctx.fillStyle = s.patch; ctx.beginPath(); ctx.ellipse(-L * 0.12, bodyY - H * 0.06, L * 0.18, H * 0.13, 0.3, 0, 7); ctx.fill(); }
    if (s.stripe) { ctx.strokeStyle = shade(s.fur, -0.35); ctx.lineWidth = 2.5; for (var i = -1; i <= 1; i++) line(ctx, [[i * L * 0.18, bodyY - H * 0.18], [i * L * 0.18 - 3, bodyY + H * 0.05]]); }
    legAt(L * 0.38, t, false); legAt(-L * 0.24, t + Math.PI, false);
    // 머리
    var hx = L * 0.55, hy = bodyY - H * (cat ? 0.32 : 0.3) - (moving ? Math.abs(Math.sin(t)) * 2 : 0), hr = H * (cat ? 0.24 : 0.26);
    if (!cat) { ctx.fillStyle = shade(s.fur, -0.1); ctx.beginPath(); ctx.ellipse(hx + hr * 0.9, hy + hr * 0.25, hr * 0.7, hr * 0.42, 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); circle(ctx, hx + hr * 1.55, hy + hr * 0.12, hr * 0.17, '#1a1210'); }
    circle(ctx, hx, hy, hr, s.fur);
    if (cat) { fillPath(ctx, [[hx - hr * 0.7, hy - hr * 0.5], [hx - hr * 0.45, hy - hr * 1.5], [hx - hr * 0.05, hy - hr * 0.8]], s.fur); fillPath(ctx, [[hx + hr * 0.1, hy - hr * 0.85], [hx + hr * 0.45, hy - hr * 1.55], [hx + hr * 0.75, hy - hr * 0.55]], s.fur); circle(ctx, hx + hr * 0.95, hy + hr * 0.15, hr * 0.1, '#d88a8a'); }
    else fillPath(ctx, [[hx - hr * 0.35, hy - hr * 0.75], [hx - hr * 0.9, hy - hr * 0.1], [hx - hr * 0.55, hy + hr * 0.6], [hx - hr * 0.1, hy - hr * 0.3]], s.patch || shade(s.fur, -0.3));
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + hr * 0.45, hy - hr * 0.15, Math.max(1.4, hr * 0.13), 0, 7); ctx.fill();
  }

  /** 마을 사람 한 명을 그린다: (x, y) = 발 가운데, dir: 1 오른쪽 · −1 왼쪽, ph 걸음 0~1, sc 크기 */
  A.drawFolk = function (ctx, s, x, y, dir, ph, moving, sc, glow) {
    ctx.save();
    ctx.translate(x, y); if (dir < 0) ctx.scale(-1, 1); if (sc && sc !== 1) ctx.scale(sc, sc);
    try { if (s.type === 'dog' || s.type === 'cat') animal(ctx, s, ph, moving); else person(ctx, s, ph, moving); } catch (e) { /* 그리다 틀려도 거리는 돈다 */ }
    ctx.restore();
    if (glow) { ctx.save(); ctx.strokeStyle = 'rgba(255,236,170,.9)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(x, y, s.h * (sc || 1) * 0.26, s.h * (sc || 1) * 0.06, 0, 0, 7); ctx.stroke(); ctx.restore(); }
  };
})(window.G = window.G || {});
