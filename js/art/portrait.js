/* Procedural chiaroscuro profile portraits. */
(function (G) {
  'use strict';
  var A = G.Art, U = G.U;
  var cache = {};

  var SKINS = { eu: '#d9a888', med: '#c89272', arab: '#b07a58', af: '#6e4632', in: '#9a6a4a', asia: '#d2a882', am: '#a8704c' };
  var CLOTH = ['#7a2a22', '#2a3a5a', '#3a4a2a', '#5a3a5a', '#2a2a2a', '#6a4a2a', '#1e3552', '#5a1e1e', '#3d5a5a', '#4a3a2a'];
  var HAIR = ['#1e140e', '#3a2616', '#5a3a1e', '#2a1a10', '#7a5a3a', '#888078', '#c8c0b0'];

  /** build a spec from simple hints: {seed, g:'m'|'f', age:'young'|'mid'|'old', culture, role, hat, beard, cloth} */
  A.portraitSpec = function (h) {
    var rng = U.makeRng(U.strHash(String(h.seed || 'x')));
    var cul = h.culture || 'eu';
    var g = h.g || 'm';
    var sp = {
      g: g, skin: h.skin || A.jitter(SKINS[cul] || SKINS.eu, rng, 18), hair: h.hair || HAIR[Math.floor(rng() * (h.age === 'old' ? 7 : 5))],
      cloth: h.cloth || CLOTH[Math.floor(rng() * CLOTH.length)], nose: rng(), chin: rng(), brow: rng(), hairStyle: Math.floor(rng() * 4),
      beard: g === 'm' ? (h.beard != null ? h.beard : Math.floor(rng() * 4)) : 0, hat: h.hat || 'none', age: h.age || 'mid', gold: !!h.gold,
      bg: h.bg || A.jitter('#3a2a1c', rng, 20), facing: h.facing || 1, ruff: !!h.ruff, armor: !!h.armor, veil: h.veil || null, seed: h.seed
    };
    if (h.age === 'old') { sp.hair = rng() < 0.6 ? '#c8c0b0' : '#8a8278'; }
    return sp;
  };

  /** role/culture presets */
  A.npcSpec = function (seed, role, style, gender) {
    var cul = { is: 'arab', pe: 'arab', af: 'af', sw: 'af', tr: 'af', in: 'in', se: 'asia', cn: 'asia', kr: 'asia', jp: 'asia', az: 'am', an: 'am' }[style] || (style === 'gr' || style === 'it' || style === 'ib' || style === 'co' ? 'med' : 'eu');
    var h = { seed: seed, culture: cul, g: gender || 'm' };
    var rng = U.makeRng(U.strHash(seed + role));
    var isl = cul === 'arab' || (style === 'in' && rng() < 0.5) || style === 'sw';
    switch (role) {
      case 'king': h.hat = cul === 'arab' ? 'turban' : cul === 'asia' ? (style === 'jp' ? 'eboshi' : 'gauze') : cul === 'am' ? 'feather' : 'crown'; h.gold = true; h.age = 'mid'; h.cloth = '#6a1e1e'; h.ruff = cul === 'eu' || cul === 'med'; break;
      case 'pope': h.hat = 'mitre'; h.gold = true; h.age = 'old'; h.cloth = '#e8e0d0'; h.beard = 0; break;
      case 'priest': h.hat = cul === 'arab' ? 'turban' : cul === 'asia' ? 'none' : 'hood'; h.age = rng() < 0.5 ? 'old' : 'mid'; h.cloth = cul === 'asia' ? '#b8742a' : '#2a2420'; h.beard = cul === 'asia' ? 0 : h.beard; break;
      case 'noble': case 'gov': case 'official': h.hat = cul === 'arab' ? 'turban' : cul === 'asia' ? 'gauze' : 'beret'; h.gold = true; h.ruff = cul === 'eu' || cul === 'med'; h.age = rng() < 0.4 ? 'old' : 'mid'; break;
      case 'merchant': h.hat = isl ? 'turban' : cul === 'asia' ? 'gauze' : 'beret'; h.gold = rng() < 0.5; h.age = 'mid'; break;
      case 'scholar': h.hat = isl ? 'turban' : cul === 'asia' ? 'gauze' : rng() < 0.5 ? 'beret' : 'none'; h.age = 'old'; h.cloth = '#2a2a3a'; break;
      case 'keeper': h.hat = isl ? 'kufi' : cul === 'asia' ? 'none' : rng() < 0.5 ? 'cap' : 'none'; h.age = rng() < 0.5 ? 'mid' : 'old'; h.cloth = '#5a3a24'; break;
      case 'sailor': h.hat = isl ? 'turban' : rng() < 0.6 ? 'cap' : 'none'; h.age = rng() < 0.6 ? 'young' : 'mid'; break;
      case 'soldier': h.hat = cul === 'asia' ? 'helmetA' : 'morion'; h.armor = true; h.age = 'mid'; break;
      case 'maid': h.g = 'f'; h.hat = isl ? 'hijab' : rng() < 0.4 ? 'kerchief' : 'none'; h.age = 'young'; h.cloth = A.jitter(['#7a2a3a', '#2a4a5a', '#5a3a1e', '#3a5a3a'][Math.floor(rng() * 4)], rng, 20); break;
      case 'native': h.hat = cul === 'am' ? 'feather' : cul === 'af' ? 'none' : 'band'; h.age = 'mid'; h.cloth = '#8a5a2a'; break;
      default: break;
    }
    if (h.g === 'f') h.beard = 0;
    return A.portraitSpec(h);
  };

  // ---------------------------------------------------------------- named people
  var REGION_STYLE = ['ib', 'ne', 'it', 'af', 'is', 'in', 'cn', 'is', 'se', 'jp', 'az'];
  var mateSpecCache = {};
  A.mateSpec = function (id) {
    if (mateSpecCache[id]) return mateSpecCache[id];
    var d = G.MATE[id]; if (!d) return null;
    var sk = d.sk || {}, role = 'sailor';
    if (sk.theo >= 2) role = 'priest';
    else if (sk.sci >= 2 || sk.med >= 2 || sk.hist >= 2 || (sk.survey >= 3 && d.st[1] > 70)) role = 'scholar';
    else if (sk.sword >= 3 || sk.gun >= 2) role = 'soldier';
    else if (sk.acct >= 2) role = 'merchant';
    var style = REGION_STYLE[d.reg[0]] || 'ib';
    if (id === 'rocco') style = 'it';
    if (d.g === 'f') role = 'maid';
    var sp = A.npcSpec('mate_' + id, role, style, d.g);
    if (id === 'rocco') { sp.beard = 2; sp.hat = 'cap'; sp.age = 'mid'; }
    A.withImg(sp, G.Img.chain.mate(id));
    return (mateSpecCache[id] = sp);
  };
  A.maidSpec = function (m) {
    var c = G.CITY_DATA[m.city];
    return A.withImg(A.npcSpec('maid_' + m.id, 'maid', c.style, 'f'), G.Img.chain.maid(m.id, c));
  };
  /** sponsor portrait; holder = 0-based index into sp.holders (-1 → title only) */
  A.sponsorSpec = function (sp, holder) {
    var h = sp.holders[holder], name = h ? h[2] : sp.title;
    var role = sp.type === 'official' || sp.type === 'gov' ? 'noble' : sp.type;
    var c = G.CITY_DATA[sp.city];
    var spec = A.npcSpec('sp_' + sp.id + '_' + name, role, c.style, /이사벨|엘리자베스|여왕|왕비|왕대비|공작부인|여제|수녀/.test(name) ? 'f' : 'm');
    return A.withImg(spec, G.Img.chain.sponsor(sp, h ? holder + 1 : 0));
  };
  A.rivalSpec = function (name) { return A.withImg(A.npcSpec('rival_' + name, 'noble', 'ib'), G.Img.chain.rival(name)); };
  /** townsfolk who greet you in buildings: id → [portrait role, seed variant, gender] */
  A.TOWNFOLK = { trader: ['merchant', '', 'm'], vendor: ['merchant', 'mk', 'm'], harbormaster: ['official', '', 'm'], innkeeper: ['keeper', 'inn', 'f'],
    tavernkeeper: ['keeper', 'tav', 'm'], shipwright: ['keeper', 'yard', 'm'], priest: ['priest', '', 'm'], librarian: ['scholar', '', 'm'], guildmaster: ['official', 'gd', 'm'] };
  A.townSpec = function (id, c) {
    var t = A.TOWNFOLK[id] || ['merchant', id, 'm'];
    return A.withImg(A.npcSpec('c' + c.id + ':' + t[0] + t[1], t[0], c.style, t[2]), G.Img.chain.npc(id, c));
  };
  function headPath(ctx, s, cx, cy, R) {
    // profile facing right. R = head radius
    var n = s.nose, ch = s.chin, br = s.brow, f = s.g === 'f';
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.05, cy - R * 1.02);                                    // crown
    ctx.bezierCurveTo(cx + R * 0.55, cy - R * 1.05, cx + R * 0.82, cy - R * 0.7, cx + R * (0.84 + br * 0.04), cy - R * 0.32); // forehead
    ctx.quadraticCurveTo(cx + R * 0.9, cy - R * 0.2, cx + R * 0.86, cy - R * 0.14);           // brow ridge
    // nose
    var nl = f ? 0.2 : 0.24 + n * 0.1, nd = n > 0.7 ? 0.06 : 0;
    ctx.quadraticCurveTo(cx + R * (0.9 + nl * 0.6), cy - R * (0.02 + nd), cx + R * (0.9 + nl), cy + R * 0.14);
    ctx.quadraticCurveTo(cx + R * (0.9 + nl * 0.5), cy + R * 0.2, cx + R * 0.88, cy + R * 0.22);
    // lips
    ctx.quadraticCurveTo(cx + R * 0.93, cy + R * 0.3, cx + R * 0.88, cy + R * 0.36);
    ctx.quadraticCurveTo(cx + R * 0.92, cy + R * 0.42, cx + R * 0.85, cy + R * 0.47);
    // chin
    var cf = 0.78 + ch * 0.1;
    ctx.quadraticCurveTo(cx + R * (cf + 0.06), cy + R * 0.62, cx + R * (cf - 0.08), cy + R * 0.72);
    ctx.quadraticCurveTo(cx + R * 0.45, cy + R * 0.82, cx + R * 0.25, cy + R * 0.66); // jaw
    ctx.lineTo(cx + R * 0.2, cy + R * 1.2);                                     // neck front
    ctx.lineTo(cx - R * 0.35, cy + R * 1.2);                                    // neck back
    ctx.bezierCurveTo(cx - R * 0.3, cy + R * 0.7, cx - R * 0.95, cy + R * 0.45, cx - R * 0.9, cy - R * 0.2); // back of head
    ctx.bezierCurveTo(cx - R * 0.85, cy - R * 0.8, cx - R * 0.5, cy - R * 1.0, cx - R * 0.05, cy - R * 1.02);
    ctx.closePath();
  }

  /** draw portrait into ctx at size sz */
  A.drawPortrait = function (ctx, sz, s) {
    var rng = U.makeRng(U.strHash(String(s.seed || 'p') + 'd'));
    ctx.save();
    // background
    var bg = ctx.createRadialGradient(sz * 0.35, sz * 0.3, sz * 0.05, sz * 0.5, sz * 0.5, sz * 0.8);
    bg.addColorStop(0, A.rgba(A.shade(s.bg, 1.9))); bg.addColorStop(0.55, A.rgba(s.bg)); bg.addColorStop(1, A.rgba(A.shade(s.bg, 0.35)));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, sz, sz);
    if (s.facing < 0) { ctx.translate(sz, 0); ctx.scale(-1, 1); }
    var cx = sz * 0.46, cy = sz * 0.42, R = sz * 0.2;
    // torso
    var cl = A.hex(s.cloth);
    var tg = ctx.createLinearGradient(sz * 0.1, 0, sz * 0.9, 0);
    tg.addColorStop(0, A.rgba(A.shade(cl, 0.45))); tg.addColorStop(0.6, A.rgba(A.shade(cl, 1.0))); tg.addColorStop(1, A.rgba(A.shade(cl, 1.25)));
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.moveTo(sz * 0.02, sz); ctx.bezierCurveTo(sz * 0.05, sz * 0.78, sz * 0.18, sz * 0.7, cx - R * 0.2, sz * 0.66);
    ctx.lineTo(cx + R * 0.45, sz * 0.66); ctx.bezierCurveTo(sz * 0.8, sz * 0.7, sz * 0.95, sz * 0.8, sz * 0.98, sz); ctx.closePath(); ctx.fill();
    if (s.armor) {
      ctx.fillStyle = 'rgba(190,195,205,.8)'; ctx.beginPath(); ctx.ellipse(sz * 0.62, sz * 0.8, sz * 0.22, sz * 0.12, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(sz * 0.66, sz * 0.76, sz * 0.12, sz * 0.04, -0.3, 0, Math.PI * 2); ctx.fill();
    }
    if (s.ruff) {
      ctx.fillStyle = '#efe8da';
      for (var r = 0; r < 9; r++) { ctx.beginPath(); ctx.arc(cx - R * 0.35 + r * R * 0.12, sz * 0.66 + Math.sin(r) * 2, R * 0.13, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(cx - R * 0.45, sz * 0.67, R * 1.2, R * 0.08);
    }
    if (s.gold) {
      ctx.strokeStyle = '#d9b45f'; ctx.lineWidth = sz * 0.012;
      ctx.beginPath(); ctx.moveTo(cx - R * 0.4, sz * 0.72); ctx.quadraticCurveTo(cx + R * 0.1, sz * 0.92, cx + R * 0.7, sz * 0.72); ctx.stroke();
      ctx.fillStyle = '#e8c56e'; ctx.beginPath(); ctx.arc(cx + R * 0.15, sz * 0.86, sz * 0.03, 0, Math.PI * 2); ctx.fill();
    }
    // back hair (long hair for women / veil)
    var hair = A.hex(s.hair);
    if (s.g === 'f' && s.hat === 'none') {
      ctx.fillStyle = A.rgba(A.shade(hair, 0.9));
      ctx.beginPath(); ctx.moveTo(cx - R * 0.2, cy - R * 1.05); ctx.bezierCurveTo(cx - R * 1.3, cy - R * 0.8, cx - R * 1.2, cy + R * 1.4, cx - R * 0.6, sz * 0.8); ctx.lineTo(cx + R * 0.1, sz * 0.7); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
    }
    // head
    var sk = A.hex(s.skin);
    var hg = ctx.createLinearGradient(cx - R, cy - R, cx + R * 1.1, cy + R * 0.5);
    hg.addColorStop(0, A.rgba(A.shade(sk, 0.45))); hg.addColorStop(0.55, A.rgba(A.shade(sk, 0.85))); hg.addColorStop(1, A.rgba(A.shade(sk, 1.18)));
    ctx.fillStyle = hg; headPath(ctx, s, cx, cy, R); ctx.fill();
    // rim light on face edge
    ctx.save(); headPath(ctx, s, cx, cy, R); ctx.clip();
    ctx.strokeStyle = A.rgba(A.shade(sk, 1.45), 0.55); ctx.lineWidth = sz * 0.018; headPath(ctx, s, cx - sz * 0.006, cy, R); ctx.stroke();
    // cheek glow
    var cg = ctx.createRadialGradient(cx + R * 0.45, cy + R * 0.25, 1, cx + R * 0.45, cy + R * 0.25, R * 0.45);
    cg.addColorStop(0, 'rgba(210,110,90,.22)'); cg.addColorStop(1, 'rgba(210,110,90,0)'); ctx.fillStyle = cg; ctx.fillRect(0, 0, sz, sz);
    ctx.restore();
    // ear
    ctx.fillStyle = A.rgba(A.shade(sk, 0.75)); ctx.beginPath(); ctx.ellipse(cx - R * 0.1, cy + R * 0.02, R * 0.12, R * 0.2, 0.2, 0, Math.PI * 2); ctx.fill();
    // eye & brow
    ctx.fillStyle = 'rgba(25,15,10,.9)'; ctx.beginPath(); ctx.ellipse(cx + R * 0.66, cy - R * 0.08, R * 0.08, R * 0.035, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(cx + R * 0.68, cy - R * 0.1, R * 0.02, R * 0.02);
    ctx.strokeStyle = A.rgba(A.shade(hair, 0.8), 0.85); ctx.lineWidth = sz * 0.012; ctx.beginPath(); ctx.moveTo(cx + R * 0.55, cy - R * 0.2); ctx.quadraticCurveTo(cx + R * 0.7, cy - R * 0.27, cx + R * 0.84, cy - R * 0.2); ctx.stroke();
    if (s.age === 'old') { ctx.strokeStyle = 'rgba(60,35,25,.35)'; ctx.lineWidth = sz * 0.006; ctx.beginPath(); ctx.moveTo(cx + R * 0.55, cy + R * 0.35); ctx.quadraticCurveTo(cx + R * 0.65, cy + R * 0.5, cx + R * 0.72, cy + R * 0.52); ctx.stroke(); }
    // hair (top)
    if (s.hat === 'none' || s.hat === 'cap' || s.hat === 'band' || s.hat === 'kufi' || s.hat === 'feather') {
      ctx.fillStyle = A.rgba(hair);
      ctx.beginPath(); ctx.moveTo(cx + R * 0.72, cy - R * 0.58);
      ctx.bezierCurveTo(cx + R * 0.6, cy - R * 1.18, cx - R * 0.6, cy - R * 1.25, cx - R * 0.95, cy - R * 0.25);
      if (s.g === 'f') ctx.lineTo(cx - R * 0.9, cy + R * 0.9); else ctx.bezierCurveTo(cx - R * 0.9, cy + R * 0.2, cx - R * 0.6, cy + R * 0.35, cx - R * 0.4, cy + R * 0.3);
      ctx.bezierCurveTo(cx - R * 0.25, cy - R * 0.3, cx + R * 0.2, cy - R * 0.55, cx + R * 0.72, cy - R * 0.58); ctx.fill();
      if (s.hairStyle === 1) { for (var cc = 0; cc < 7; cc++) { ctx.beginPath(); ctx.arc(cx - R * 0.6 + cc * R * 0.2, cy - R * 0.95 + Math.abs(cc - 3) * R * 0.05, R * 0.14, 0, Math.PI * 2); ctx.fill(); } }
      ctx.fillStyle = 'rgba(255,230,190,.12)'; ctx.beginPath(); ctx.ellipse(cx + R * 0.1, cy - R * 0.9, R * 0.4, R * 0.1, -0.2, 0, Math.PI * 2); ctx.fill();
    }
    // beard
    if (s.beard > 0) {
      ctx.fillStyle = A.rgba(A.shade(hair, 0.95), s.beard === 1 ? 0.55 : 0.95);
      ctx.beginPath(); ctx.moveTo(cx + R * 0.05, cy + R * 0.15);
      ctx.bezierCurveTo(cx + R * 0.4, cy + R * 0.25, cx + R * 0.7, cy + R * 0.3, cx + R * 0.86, cy + R * 0.42);
      var bl = s.beard === 3 ? 1.25 : s.beard === 2 ? 0.95 : 0.78;
      ctx.bezierCurveTo(cx + R * 0.9, cy + R * (bl - 0.1), cx + R * 0.6, cy + R * bl, cx + R * 0.3, cy + R * (bl - 0.05));
      ctx.bezierCurveTo(cx + R * 0.05, cy + R * 0.8, cx - R * 0.05, cy + R * 0.4, cx + R * 0.05, cy + R * 0.15); ctx.fill();
      // mustache
      ctx.beginPath(); ctx.ellipse(cx + R * 0.8, cy + R * 0.28, R * 0.12, R * 0.04, 0.2, 0, Math.PI * 2); ctx.fill();
    }
    // headwear
    function hatFill(c) { var g = ctx.createLinearGradient(cx - R, 0, cx + R, 0); g.addColorStop(0, A.rgba(A.shade(c, 0.5))); g.addColorStop(1, A.rgba(A.shade(c, 1.15))); ctx.fillStyle = g; }
    switch (s.hat) {
      case 'beret': hatFill('#2a1e18'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.92, R * 1.0, R * 0.34, -0.12, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(cx - R * 0.55, cy - R * 0.95, R * 1.1, R * 0.2); break;
      case 'cap': hatFill('#6a3a22'); ctx.beginPath(); ctx.ellipse(cx - R * 0.1, cy - R * 0.85, R * 0.85, R * 0.4, -0.2, Math.PI, 0); ctx.fill(); break;
      case 'hood': hatFill('#3a2e24'); ctx.beginPath(); ctx.moveTo(cx + R * 0.7, cy - R * 0.6); ctx.bezierCurveTo(cx + R * 0.5, cy - R * 1.5, cx - R * 1.4, cy - R * 1.2, cx - R * 1.1, sz * 0.72); ctx.lineTo(cx + R * 0.1, sz * 0.72); ctx.bezierCurveTo(cx - R * 0.4, cy, cx - R * 0.1, cy - R * 0.7, cx + R * 0.7, cy - R * 0.6); ctx.fill(); break;
      case 'turban': case 'kufi':
        var tc = s.hat === 'kufi' ? '#e8e0cc' : (s.gold ? '#efe6d0' : ['#e8e0cc', '#b44a2a', '#2a5a6a'][Math.floor(rng() * 3)]);
        hatFill(tc); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.82, R * (s.hat === 'kufi' ? 0.8 : 1.05), R * (s.hat === 'kufi' ? 0.35 : 0.62), -0.1, 0, Math.PI * 2); ctx.fill();
        if (s.hat === 'turban') { ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = sz * 0.008; for (var t = 0; t < 4; t++) { ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * (0.95 - t * 0.12), R * 0.95, R * 0.25, -0.1, 0.2, 2.8); ctx.stroke(); } if (s.gold) { ctx.fillStyle = '#d9b45f'; ctx.beginPath(); ctx.arc(cx + R * 0.55, cy - R * 0.8, R * 0.09, 0, Math.PI * 2); ctx.fill(); } }
        break;
      case 'crown': ctx.fillStyle = '#d9b45f'; ctx.beginPath(); ctx.moveTo(cx - R * 0.75, cy - R * 0.72); for (var p = 0; p <= 5; p++) { ctx.lineTo(cx - R * 0.75 + p * R * 0.3, cy - R * (p % 2 ? 1.05 : 1.35)); } ctx.lineTo(cx + R * 0.75, cy - R * 0.72); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#a3261e'; ctx.beginPath(); ctx.arc(cx, cy - R * 0.88, R * 0.07, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = A.rgba(hair); ctx.fillRect(cx - R * 0.9, cy - R * 0.72, R * 0.4, R * 0.9); break;
      case 'mitre': hatFill('#efe6d0'); ctx.beginPath(); ctx.moveTo(cx - R * 0.6, cy - R * 0.7); ctx.lineTo(cx - R * 0.35, cy - R * 1.7); ctx.lineTo(cx + R * 0.05, cy - R * 1.9); ctx.lineTo(cx + R * 0.55, cy - R * 0.7); ctx.fill(); ctx.fillStyle = '#d9b45f'; ctx.fillRect(cx - R * 0.1, cy - R * 1.7, R * 0.12, R); break;
      case 'gauze': hatFill('#1a1a1c'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.9, R * 0.8, R * 0.32, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - R * 0.8, cy - R * 0.95, R * 1.5, R * 0.18); ctx.fillRect(cx - R * 1.35, cy - R * 0.9, R * 0.6, R * 0.08); break;
      case 'eboshi': hatFill('#1a1a1c'); ctx.beginPath(); ctx.moveTo(cx - R * 0.5, cy - R * 0.7); ctx.quadraticCurveTo(cx - R * 0.6, cy - R * 1.8, cx + R * 0.3, cy - R * 1.6); ctx.lineTo(cx + R * 0.5, cy - R * 0.8); ctx.fill(); break;
      case 'feather':
        for (var fe = 0; fe < 7; fe++) { ctx.fillStyle = ['#2f8a5a', '#d9b45f', '#b8342a', '#2a6a9a'][fe % 4]; ctx.beginPath(); ctx.ellipse(cx - R * 0.6 + fe * R * 0.18, cy - R * 1.25, R * 0.07, R * 0.45, -0.6 + fe * 0.2, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#d9b45f'; ctx.fillRect(cx - R * 0.7, cy - R * 0.92, R * 1.4, R * 0.14); break;
      case 'morion': hatFill('#9aa0aa'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.85, R * 0.85, R * 0.55, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - R * 1.2, cy - R * 0.72); ctx.quadraticCurveTo(cx, cy - R * 0.62, cx + R * 1.1, cy - R * 0.9); ctx.lineTo(cx + R * 1.1, cy - R * 0.8); ctx.quadraticCurveTo(cx, cy - R * 0.5, cx - R * 1.2, cy - R * 0.62); ctx.fill(); ctx.fillRect(cx - R * 0.08, cy - R * 1.55, R * 0.16, R * 0.3); break;
      case 'helmetA': hatFill('#3a3a3a'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.8, R * 0.95, R * 0.6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - R * 1.1, cy - R * 0.85, R * 0.5, R * 0.9); break;
      case 'hijab': case 'kerchief':
        var vc = s.hat === 'hijab' ? '#2f5a5a' : '#8a3a2a'; if (s.veil) vc = s.veil;
        hatFill(vc); ctx.beginPath(); ctx.moveTo(cx + R * 0.72, cy - R * 0.55); ctx.bezierCurveTo(cx + R * 0.6, cy - R * 1.3, cx - R * 1.3, cy - R * 1.2, cx - R * 1.2, cy + R * 0.2);
        if (s.hat === 'hijab') { ctx.bezierCurveTo(cx - R * 1.1, cy + R * 1.3, cx - R * 0.2, sz * 0.8, cx + R * 0.35, sz * 0.72); ctx.lineTo(cx + R * 0.3, cy + R * 0.7); ctx.bezierCurveTo(cx - R * 0.2, cy + R * 0.2, cx - R * 0.1, cy - R * 0.5, cx + R * 0.72, cy - R * 0.55); }
        else { ctx.lineTo(cx - R * 0.5, cy + R * 0.1); ctx.bezierCurveTo(cx - R * 0.3, cy - R * 0.5, cx + R * 0.1, cy - R * 0.6, cx + R * 0.72, cy - R * 0.55); }
        ctx.fill(); break;
      case 'band': ctx.fillStyle = '#b8342a'; ctx.fillRect(cx - R * 0.95, cy - R * 0.7, R * 1.75, R * 0.14); break;
      default: break;
    }
    ctx.restore();
    // frame glow & vignette
    var vg = ctx.createRadialGradient(sz / 2, sz / 2, sz * 0.3, sz / 2, sz / 2, sz * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, sz, sz);
    A.applyGrain(ctx, sz, sz, 0.05);
  };

  /** attach an override-image chain to a spec (returns the spec) */
  A.withImg = function (spec, chain) { if (spec && chain && chain.length) spec.img = chain; return spec; };
  /** override-image chain for a portrait spec (spec.img, or the player's face index) */
  A.portraitKeys = function (spec) {
    if (!spec || !G.Img) return null;
    if (spec.img) return [].concat(spec.img);
    var m = /^player(\d+)/.exec(String(spec.seed || ''));
    if (m) return G.Img.chain.player(+m[1]);
    return null;
  };
  A.portraitCanvas = function (spec, size) {
    size = size || 134;
    var chain = A.portraitKeys(spec);
    if (chain && G.Img.pick(chain)) {
      var oc = G.Img.make(chain, size * 2, size * 2, function () { var pc = A.canvas(size * 2, size * 2); A.drawPortrait(pc.getContext('2d'), size * 2, spec); return pc; }, { fy: 0.25, bg: '#1a120c' });
      oc.style.width = size + 'px'; oc.style.height = size + 'px';
      return oc;
    }
    var key = JSON.stringify(spec) + size;
    var c = A.canvas(size * 2, size * 2);
    c.style.width = size + 'px'; c.style.height = size + 'px';
    var ctx = c.getContext('2d');
    if (cache[key]) { ctx.drawImage(cache[key], 0, 0); return c; }
    A.drawPortrait(ctx, size * 2, spec);
    var copy = A.canvas(size * 2, size * 2); copy.getContext('2d').drawImage(c, 0, 0); cache[key] = copy;
    return c;
  };
})(window.G = window.G || {});
