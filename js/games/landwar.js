/* 육상전 — 대항해시대 3의 육상전처럼 탐험대를 부대로 나누어 싸운다 (규칙·글·그림은 이 게임에서 새로 만들었다).
   - 우리 편: 제독대 + 부대 최대 5개. 부대마다 보병 · 기병(말·낙타·코끼리가 있어야) · 총병 · 포병(짐 나르는 짐승·마차가 있어야, 한 부대) 중에서 고른다
     기병은 적 한 부대를, 총병은 앞줄 세 부대를, 포병은 적 전체를 친다
   - 특기가 3단계면 부대가 강해진다: 검술 → 중장기병, 사격술 → 머스킷총병, 포술 → 캐논포병, 셋 다 → 무적 제독대
   - 특수 작전(한 번씩): 기습 · 함정 · 저격 · 작렬탄 (작렬탄은 소지품의 작렬탄과 포병이 있어야). 지형에 따라 성공률이 다르다
   - 적 우두머리를 쓰러뜨리면 남은 적이 흩어져 이긴다. 제독대가 무너지면 진다 · 쓰러진 대원 일부는 의학 솜씨만큼 살아 돌아온다
   G.Games.landWar({ enemy: {name, kind: native|bandit|beast|garrison, n}, party, terr, guns, flee }) → {res: win|lose|flee, dead, back, left} */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, I = G.Img;
  G.Games = G.Games || {};
  var W = 1000, H = 430;
  var TYPES = {
    inf: { name: '보병', pow: 1.0, reach: 'one' },
    cav: { name: '기병', up: '중장기병', pow: 1.45, reach: 'one', sk: 'sword' },
    gun: { name: '총병', up: '머스킷총병', pow: 0.8, reach: 'front', sk: 'shoot' },
    art: { name: '포병', up: '캐논포병', pow: 0.5, reach: 'all', sk: 'gun' },
    adm: { name: '제독대', up: '무적 제독대', pow: 1.35, reach: 'one' }
  };
  G.LANDWAR_TYPES = TYPES;
  // 적: 부대 종류 [이름, 닿는 곳, 힘, 그림], 우두머리 [이름, 힘]
  var FOES = {
    native: { units: [['전사', 'one', 1.1, 'spear'], ['궁수', 'front', 0.8, 'bow']], mix: [0, 0, 1], leader: ['족장', 1.6], col: ['#8a4a2a', '#c89060'] },
    bandit: { units: [['도적', 'one', 1.15, 'blade'], ['총잡이', 'front', 0.9, 'musket']], mix: [0, 0, 1], leader: ['두목', 1.7], col: ['#5a1e1a', '#3a3030'] },
    beast: { units: [['짐승 떼', 'one', 1.35, 'beast']], mix: [0], leader: ['우두머리 짐승', 2.0], col: ['#5a4a3a', '#7a6a58'] },
    garrison: { units: [['창병', 'one', 1.15, 'pike'], ['총병', 'front', 0.95, 'musket'], ['포대', 'all', 0.5, 'cannon']], mix: [0, 1, 0, 1, 2], leader: ['수비대장', 1.7], col: ['#6a6a78', '#8a2a24'] }
  };
  // 특수 작전 — 지형별 성공률
  var TERR_AMBUSH = { forest: 0.8, jungle: 0.85, mountain: 0.7, grass: 0.45, steppe: 0.4, desert: 0.3, snow: 0.35, tundra: 0.4, ice: 0.25 };
  var TERR_TRAP = { forest: 0.65, jungle: 0.7, mountain: 0.6, grass: 0.5, steppe: 0.45, desert: 0.4, snow: 0.55, tundra: 0.5, ice: 0.4 };
  var TERR_BG = { grass: ['#6f8a4a', '#51683a'], steppe: ['#a09a5a', '#7a7440'], desert: ['#d8b878', '#b89458'], forest: ['#46643a', '#2e4a2a'], jungle: ['#3a5a30', '#223a1e'],
    mountain: ['#8a8474', '#666050'], snow: ['#e8ecf0', '#c4ccd6'], tundra: ['#a8a888', '#84846a'], ice: ['#dfeaf2', '#b8ccdc'] };

  /* 그린 스프라이트 (images/sprites/, js/art/sprites.js): 우리 편은 솜씨 단계, 적은 싸우는 땅에 따라 — 짝은 js/data/landwarart.js.
     그림이 없으면 아래 fig()가 코드로 그린다 */
  function ART() { return G.LANDWAR_ART || null; }
  function S() { return G.Game.state; }
  function sk(id) { return R.skill(id); }
  function mountInfo() {
    var l = S().loc || {}, mt = l.mount || { id: 'walk', n: 0 }, id = mt.id, n = mt.n || 0;
    var ride = id === 'horse' || id === 'camel' ? n : id === 'elephant' ? n * 6 : 0;
    var pack = ['wagon', 'donkey', 'llama', 'yak', 'porter', 'camel', 'elephant'].indexOf(id) >= 0 && n > 0;
    return { id: id, ride: ride, pack: pack, name: id === 'elephant' ? '코끼리' : id === 'camel' ? '낙타' : '말' };
  }
  function upgraded(type) {
    if (type === 'adm') return sk('sword') >= 3 && sk('shoot') >= 3 && sk('gun') >= 3;
    var t = TYPES[type]; return !!(t.sk && sk(t.sk) >= 3);
  }
  function unitName(u) { if (u.side === 'en') return u.name; var t = TYPES[u.type]; return u.type === 'cav' && u.ride === '코끼리' ? (u.up ? '중장 코끼리대' : '코끼리대') : (u.up ? t.up : t.name); }

  /** 우리 편 편성: 제독대 + 부대 (인원을 고르게 나눈다) */
  function formMine(P, guns) {
    var adm = Math.max(1, Math.min(12, Math.round(P * 0.12))), rest = Math.max(0, P - adm);
    var k = U.clamp(Math.floor(rest / 5), rest >= 3 ? 1 : 0, 5), out = [];
    for (var i = 0; i < k; i++) {
      var n = Math.floor(rest / k) + (i < rest % k ? 1 : 0);
      out.push({ side: 'me', type: i % 2 ? 'gun' : 'inf', n: n, n0: n });
    }
    // 탈것이 있으면 앞 부대를 기병으로, 짐 나르는 짐승·마차와 포가 있으면 마지막 부대를 포병으로
    var mi = mountInfo(), cap = mi.ride;
    out.forEach(function (u) { if (u.type === 'inf' && cap >= u.n) { u.type = 'cav'; cap -= u.n; } });
    if (guns && out.length >= 2) out[out.length - 1].type = 'art';
    out.push({ side: 'me', type: 'adm', n: adm, n0: adm, leader: true });
    return out;
  }
  function allowed(units, u, type, guns) {
    if (u.type === 'adm') return type === 'adm';
    if (type === 'adm') return false;
    if (type === 'cav') { var mi = mountInfo(), used = 0; units.forEach(function (o) { if (o !== u && o.type === 'cav') used += o.n; }); return mi.ride - used >= u.n; }
    if (type === 'art') return guns && !units.some(function (o) { return o !== u && o.type === 'art'; });
    return true;
  }
  function formFoe(e) {
    var F = FOES[e.kind] || FOES.bandit, n = Math.max(3, e.n), lead = Math.max(3, Math.round(n * 0.15)), rest = Math.max(2, n - lead);
    var k = U.clamp(Math.round(rest / 10), 2, 5), out = [];
    for (var i = 0; i < k; i++) {
      var m = Math.floor(rest / k) + (i < rest % k ? 1 : 0), ut = F.units[F.mix[i % F.mix.length]] || F.units[0];
      if (ut[3] === 'cannon' && n < 60) ut = F.units[0];
      out.push({ side: 'en', name: ut[0], reach: ut[1], pow: ut[2], look: ut[3], n: m, n0: m });
    }
    out.push({ side: 'en', name: F.leader[0], reach: 'one', pow: F.leader[1], look: e.kind === 'beast' ? 'beast' : 'chief', n: lead, n0: lead, leader: true });
    return out;
  }

  G.Games.landWar = function (opt) {
    var s = S(), f = s.fleet, e = opt.enemy, terr = opt.terr || 'grass', guns = !!opt.guns;
    var P0 = Math.max(1, opt.party);
    var mine = formMine(P0, guns), foes = formFoe(e), Fk = FOES[e.kind] || FOES.bandit;
    var used = {}, phase = 'form', target = null, guardMe = false, trapOn = false, stunEn = false, auto = false, over = false;
    var fx = [], shakeT = 0, t0 = performance.now(), log = [];
    var mi = mountInfo();
    mine.forEach(function (u) { if (u.type === 'cav') u.ride = mi.name; });
    var here = S().loc || {}, LA = ART(), reg = LA ? LA.regions[LA.regionOf(here.lon || 0, here.lat || 0)] : null;
    var SPR = G.Sprites, SFX = (G.FX && G.FX.sprites) || {}, useSpr = !!(SPR && LA && reg) && SFX.battle !== false;
    var bgImg = null, bgChain = I && I.chain && I.chain.landWarBackground ? I.chain.landWarBackground(terr) : [];
    if (I && bgChain.length) I.resolve(bgChain).then(function (res) { if (res) bgImg = res.img; });
    if (useSpr) {
      var need = ['swordsmen', 'musketeers', 'cannons', 'officers', 'animals'];
      ['m', 'r', 'l', 'c', 'bandit'].forEach(function (k) { if (reg[k] && need.indexOf(reg[k][0]) < 0) need.push(reg[k][0]); });
      SPR.preload(need);
      if (LA.cav[mi.name]) SPR.partyReady(LA.cav[mi.name]);   // 기병 그림(말 탄 탐험대)도 미리
    }
    if (G.Audio) G.Audio.music('battle');

    return new Promise(function (resolve) {
      var html = '<div class="lwar"><canvas width="' + W + '" height="' + H + '"></canvas>' +
        '<div class="lw-bar"><div class="lw-log"></div><div class="lw-btns"></div></div>' +
        '<div class="lw-help muted">적 부대를 누르면 공격 목표가 된다 — 기병은 뒷줄·우두머리까지, 보병·제독대는 앞줄만 친다 · 적 우두머리를 쓰러뜨리면 이긴다 (다른 적이 둘 넘게 남아 있으면 호위를 받아 덜 맞는다) · 제독대가 무너지면 진다</div></div>';
      var win = UI.window({ title: '육상전 — ' + e.name, icon: 'sword', width: 1080, html: html, closable: false });
      var el = win.content, cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), btns = el.querySelector('.lw-btns'), logEl = el.querySelector('.lw-log');
      function say(t) { log.push(t); logEl.innerHTML = log.slice(-2).map(function (x, i, a) { return '<div' + (i < a.length - 1 ? ' class="old"' : '') + '>' + x + '</div>'; }).join(''); }

      // ------------------------------------------------ 자리
      function alive(list) { return list.filter(function (u) { return u.n > 0; }); }
      function front(list) { return alive(list).filter(function (u) { return !u.leader; }).slice(0, 3).concat(alive(list).filter(function (u) { return !u.leader; }).length ? [] : alive(list).filter(function (u) { return u.leader; })); }
      function place() {
        [mine, foes].forEach(function (list) {
          var me = list === mine, rows = alive(list).filter(function (u) { return !u.leader; });
          rows.forEach(function (u, i) {
            var col = i < 3 ? 0 : 1, row = i < 3 ? i : i - 3, nRow = i < 3 ? Math.min(3, rows.length) : rows.length - 3;
            u.tx = me ? (col ? 250 : 380) : (col ? W - 250 : W - 380);
            u.ty = 268 + (row - (nRow - 1) / 2) * 100;
          });
          list.forEach(function (u) { if (u.leader) { u.tx = me ? 120 : W - 120; u.ty = 268; } if (u.x == null) { u.x = u.tx + (me ? -160 : 160); u.y = u.ty; } });
        });
      }
      place();

      // ------------------------------------------------ 그리기
      function fig(x, y, look, col, k, face, t) {
        ctx.save(); ctx.translate(x, y); ctx.scale(face * k, k);
        var bob = Math.sin(t * 3 + x * 0.1) * 0.8;
        if (look === 'beast') {
          ctx.fillStyle = col[0]; ctx.beginPath(); ctx.ellipse(0, -8 + bob, 13, 6, 0, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.ellipse(12, -12 + bob, 6, 4.5, -0.3, 0, 7); ctx.fill();
          ctx.fillRect(-10, -4, 2.5, 8); ctx.fillRect(-4, -4, 2.5, 8); ctx.fillRect(4, -4, 2.5, 8); ctx.fillRect(9, -4, 2.5, 8);
          ctx.beginPath(); ctx.moveTo(15, -16 + bob); ctx.lineTo(17, -21 + bob); ctx.lineTo(13, -16 + bob); ctx.fill();
          ctx.restore(); return;
        }
        if (look === 'cav') {
          ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.ellipse(0, -12 + bob, 15, 7, 0, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.ellipse(15, -19 + bob, 5, 8, 0.5, 0, 7); ctx.fill();
          ctx.fillRect(-11, -7, 3, 11); ctx.fillRect(-5, -7, 3, 11); ctx.fillRect(5, -7, 3, 11); ctx.fillRect(10, -7, 3, 11);
          ctx.translate(0, -16);
        }
        if (look === 'cannon') {
          ctx.fillStyle = '#2a2a2e'; ctx.fillRect(-4, -12, 24, 7); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(0, -4, 6, 0, 7); ctx.fill();
          ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(0, -4, 2, 0, 7); ctx.fill();
          ctx.translate(-14, 0);
        }
        // 사람
        ctx.fillStyle = col[0]; ctx.fillRect(-4, -20 + bob, 8, 13);
        ctx.fillStyle = col[1]; ctx.fillRect(-4, -8 + bob, 3, 8); ctx.fillRect(1, -8 + bob, 3, 8);
        ctx.fillStyle = '#d8a878'; if (look === 'spear' || look === 'bow' || look === 'chief') ctx.fillStyle = '#8a5a3a';
        ctx.beginPath(); ctx.arc(0, -25 + bob, 4.5, 0, 7); ctx.fill();
        ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1.6;
        if (look === 'sword' || look === 'blade' || look === 'cav' || look === 'adm') { ctx.strokeStyle = '#e8e8f0'; ctx.beginPath(); ctx.moveTo(4, -16 + bob); ctx.lineTo(13, -26 + bob); ctx.stroke(); }
        if (look === 'musket' || look === 'gunner') { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, -16 + bob); ctx.lineTo(16, -19 + bob); ctx.stroke(); }
        if (look === 'spear' || look === 'pike') { ctx.strokeStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(3, -4 + bob); ctx.lineTo(8, -40 + bob); ctx.stroke(); ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(8, -44 + bob); ctx.lineTo(10, -38 + bob); ctx.lineTo(6, -38 + bob); ctx.fill(); }
        if (look === 'bow') { ctx.strokeStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(6, -18 + bob, 9, -1.2, 1.2); ctx.stroke(); }
        if (look === 'chief') { ctx.fillStyle = '#e0b040'; for (var q = 0; q < 5; q++) { ctx.beginPath(); ctx.ellipse(-4 + q * 2, -32 + bob, 1.4, 5, (q - 2) * 0.3, 0, 7); ctx.fill(); } ctx.strokeStyle = '#e8e8f0'; ctx.beginPath(); ctx.moveTo(4, -16 + bob); ctx.lineTo(14, -24 + bob); ctx.stroke(); }
        if (look === 'adm') { ctx.fillStyle = '#1a1a2a'; ctx.fillRect(-6, -31 + bob, 12, 3); ctx.fillRect(-3, -35 + bob, 6, 4); }
        if (look === 'hat') { ctx.fillStyle = '#2a2020'; ctx.fillRect(-5, -30 + bob, 10, 3); }
        ctx.restore();
      }
      /** 이 부대의 그림: {id 시트, row 줄} · {party 말 탄 탐험대 시트} · null(코드 그림) */
      /** 우리 편 단계 (0~3): 보병 = 검술, 총병 = 사격술, 포병 = 포술, 제독대 = 세 솜씨의 평균 (셋 다 3이면 전설) */
      function tierOf(u) {
        var skill = LA.mine[u.type] && LA.mine[u.type][1];
        if (skill) return U.clamp(sk(skill), 0, 3);
        if (u.type === 'adm') return upgraded('adm') ? 3 : U.clamp(Math.floor((sk('sword') + sk('shoot') + sk('gun')) / 3), 0, 2);
        return 0;
      }
      function sprOf(u) {
        if (!useSpr) return null;
        if (u._spr !== undefined && u._sprType === u.type) return u._spr;
        var me = u.side === 'me', r = null, L = null;
        if (me && u.type === 'cav') r = LA.cav[u.ride] ? { party: LA.cav[u.ride] } : null;
        else if (me) { var mm = LA.mine[u.type]; if (mm) r = { id: mm[0], row: tierOf(u) }; }
        else if (u.look === 'beast') r = { id: 'animals', row: SPR.row('animals', u.leader ? reg.b[1] : reg.b[0]), beast: 1 };
        else {
          L = u.leader ? reg.l
            : u.look === 'cannon' ? (reg.c || reg.m)
            : u.look === 'bow' || u.look === 'musket' ? reg.r
            : u.look === 'blade' && reg.bandit ? reg.bandit
            : reg.m;
          if (L) r = { id: L[0], row: SPR.row(L[0], L[1]) };
        }
        if (r && r.id && !(r.row >= 0)) r = null;
        u._spr = r; u._sprType = u.type;
        return r;
      }
      /** 지금 보일 동작 (공격·다침은 한 바퀴, 쓰러지면 dead, 움직이면 walk) */
      function actOf(u) {
        if (u.n <= 0) return 'dead';
        if (u.act && u.actT < (u.act === 'attack' ? 0.75 : 0.45)) return u.act;
        return Math.abs(u.tx - u.x) + Math.abs(u.ty - u.y) > 4 ? 'walk' : 'idle';
      }
      /** 그림 시트로 부대를 그린다 — 그림이 없거나 끝내 못 받았으면 false (코드 그림으로) */
      function drawSprUnit(u, sp, x, y, face, t) {
        var act = actOf(u), fps = SFX.battleFps || {}, k0 = u.leader ? 1.22 : 1;
        if (sp.party) {
          if (!SPR.partyReady(sp.party)) return SPR.partyPending(sp.party);   // 받는 중이면 비워 두고 기다린다
          var nfp = SPR.partyFrames(sp.party), kk = (SFX.unitH || 50) * 1.2 / SPR.partyHeight(sp.party) * k0;
          var moving = act === 'walk' || act === 'attack';   // 그림 한 장이 말 탄 세 사람 — 겹쳐 그리지 않는다
          SPR.drawParty(ctx, sp.party, face > 0 ? 2 : 6, moving ? Math.floor(t * 9) % nfp : 0, x, y, kk);
          return true;
        }
        var id = sp.id, row = sp.row;
        if (!SPR.ready(id)) return SPR.pending(id);
        var k = ((sp.beast ? SFX.beastH : SFX.unitH) || 46) / SPR.bodyH(id) * k0 * ((SFX.sheetK || {})[id] || 1);
        var big = id === 'cannons' || (id === 'ottoman' && row === 1);
        var nf = U.clamp(Math.ceil(u.n / 4), 1, big ? 2 : sp.beast ? 3 : 6), gap = big ? 58 : sp.beast ? 42 : 24;
        for (var i = 0; i < nf; i++) {
          var col = i % 3, back = i >= 3, inRow = back ? nf - 3 : Math.min(nf, 3);
          var fx0 = x + (col - (inRow - 1) / 2) * gap * face - (back ? 10 * face : 0), fy0 = y - (back ? 14 : 0) + (col === 1 ? 5 : 0);
          var fr = act === 'dead' ? SPR.at(id, row, 'dead', 99, 1, false)
            : act === 'idle' || act === 'walk' ? SPR.at(id, row, act, t + i * 0.37, fps[act] || 6)
            : SPR.at(id, row, act, (u.actT || 0) - i * 0.04, fps[act] || 10, false);
          SPR.draw(ctx, id, row, fr, fx0, fy0, k, face < 0);
        }
        return true;
      }
      function drawUnit(u, t) {
        if (u.n <= 0 && !(u.fade > 0)) return;
        var me = u.side === 'me', face = me ? 1 : -1, x = u.x + (u.lunge || 0) * face, y = u.y;
        var look = me ? (u.type === 'inf' ? 'sword' : u.type === 'gun' ? 'musket' : u.type === 'cav' ? 'cav' : u.type === 'art' ? 'cannon' : 'adm') : u.look;
        var col = me ? (u.type === 'adm' ? ['#1d3f7a', '#e8dcc0'] : ['#2a4a7a', '#d8ccb0']) : Fk.col;
        var nf = U.clamp(Math.ceil(u.n / 4), 1, look === 'cav' || look === 'cannon' ? 3 : 6), k = u.leader ? 1.25 : 1;
        ctx.save(); if (u.n <= 0) ctx.globalAlpha = Math.max(0, u.fade);
        // 받침 그림자
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 52, 12, 0, 0, 7); ctx.fill();
        if (target === u) { ctx.strokeStyle = 'rgba(255,90,60,' + (0.6 + 0.3 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 4, 60, 16, 0, 0, 7); ctx.stroke(); }
        var sp = sprOf(u);
        if (!(sp && drawSprUnit(u, sp, x, y, face, t))) {
          for (var i = 0; i < nf; i++) {
            var fx0 = x + ((i % 3) - 1) * (look === 'cav' ? 30 : 17) * (i >= 3 ? 1 : 1) - (i >= 3 ? 8 : 0), fy0 = y - (i >= 3 ? 14 : 0) + ((i % 3) === 1 ? 5 : 0);
            fig(fx0, fy0, look === 'musket' && u.side === 'me' ? 'musket' : look, col, k, face, t);
          }
        }
        if (u.hitT > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,160,120,' + u.hitT * 1.2 + ')'; ctx.beginPath(); ctx.ellipse(x, y - 16, 55, 28, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore();
        if (u.n <= 0) return;
        // 이름·인원·막대
        ctx.font = '700 14px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center';
        var label = (u.leader ? '★ ' : '') + unitName(u) + ' ' + u.n;
        var tw = ctx.measureText(label).width + 12;
        ctx.fillStyle = me ? 'rgba(20,34,64,.82)' : 'rgba(70,20,16,.82)'; ctx.fillRect(x - tw / 2, y + 12, tw, 19);
        ctx.fillStyle = u.leader ? '#ffe08a' : '#f2e7cc'; ctx.fillText(label, x, y + 26);
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - 36, y + 33, 72, 5);
        ctx.fillStyle = me ? '#6aa86a' : '#d05040'; ctx.fillRect(x - 36, y + 33, 72 * u.n / u.n0, 5);
        if (guardMe && me) { ctx.strokeStyle = 'rgba(160,200,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 42, y - 18, 9, 0, 7); ctx.stroke(); }
      }
      function draw() {
        var t = (performance.now() - t0) / 1000;
        var bg = TERR_BG[terr] || TERR_BG.grass;
        ctx.save();
        if (shakeT > 0 && S().settings.shake !== false) ctx.translate(U.rf(-1, 1) * shakeT * 14, U.rf(-1, 1) * shakeT * 10);
        if (bgImg && I) {
          I.drawCover(ctx, bgImg, -20, -20, W + 40, H + 40, 0.5, 0.5);
          var shade = ctx.createLinearGradient(0, 0, 0, H);
          shade.addColorStop(0, 'rgba(10,14,20,.02)'); shade.addColorStop(0.62, 'rgba(18,12,8,.03)'); shade.addColorStop(1, 'rgba(18,10,6,.12)');
          ctx.fillStyle = shade; ctx.fillRect(-20, -20, W + 40, H + 40);
        } else {
          var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9ab8d0'); g.addColorStop(0.22, '#c8d6d8'); g.addColorStop(0.23, bg[0]); g.addColorStop(1, bg[1]);
          ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
          var rng = U.makeRng(11);
          for (var i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(0,0,0,' + rng() * 0.07 + ')'; ctx.fillRect(rng() * W, H * 0.25 + rng() * H * 0.75, 3 + rng() * 20, 2); }
          if (terr === 'forest' || terr === 'jungle') { ctx.fillStyle = 'rgba(20,40,20,.55)'; for (var k = 0; k < 14; k++) { var tx = k * 75 + rng() * 30; ctx.beginPath(); ctx.moveTo(tx - 22, H * 0.25); ctx.lineTo(tx, H * 0.06); ctx.lineTo(tx + 22, H * 0.25); ctx.fill(); } }
          if (terr === 'mountain') { ctx.fillStyle = 'rgba(90,86,76,.6)'; ctx.beginPath(); ctx.moveTo(0, H * 0.25); for (var m = 0; m <= 10; m++) ctx.lineTo(m * 100, H * (0.1 + rng() * 0.1)); ctx.lineTo(W, H * 0.25); ctx.fill(); }
        }
        // 부대 (위에서 아래 순서로)
        mine.concat(foes).slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (u) { drawUnit(u, t); });
        // 효과
        fx.forEach(function (e) {
          var k2 = e.t / e.life;
          if (e.kind === 'ball' || e.kind === 'arrow' || e.kind === 'shot') {
            var px = e.x0 + (e.x1 - e.x0) * k2, py = e.y0 + (e.y1 - e.y0) * k2 - Math.sin(k2 * Math.PI) * (e.kind === 'ball' ? 120 : e.kind === 'arrow' ? 60 : 4);
            if (e.kind === 'ball') { ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill(); }
            else if (e.kind === 'arrow') { var ang = Math.atan2((e.y1 - e.y0) - Math.cos(k2 * Math.PI) * 60 * Math.PI, e.x1 - e.x0); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(ang) * 14, py - Math.sin(ang) * 14); ctx.stroke(); }
            else { ctx.strokeStyle = 'rgba(255,240,180,' + (1 - k2) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - (e.x1 - e.x0) * 0.06, py - (e.y1 - e.y0) * 0.06); ctx.stroke(); }
          } else if (e.kind === 'smoke') { ctx.fillStyle = 'rgba(230,230,225,' + 0.55 * (1 - k2) + ')'; ctx.beginPath(); ctx.arc(e.x + k2 * 16 * e.d, e.y - k2 * 12, 8 + k2 * 18, 0, 7); ctx.fill(); }
          else if (e.kind === 'flash') { ctx.fillStyle = 'rgba(255,230,140,' + (1 - k2) + ')'; ctx.beginPath(); ctx.arc(e.x, e.y, 6 + k2 * 6, 0, 7); ctx.fill(); }
          else if (e.kind === 'boom') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,' + Math.round(200 - k2 * 150) + ',80,' + (1 - k2) * 0.9 + ')'; ctx.beginPath(); ctx.arc(e.x, e.y, 10 + k2 * 40, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(80,70,60,' + 0.5 * (1 - k2) + ')'; ctx.beginPath(); ctx.arc(e.x, e.y - k2 * 30, 14 + k2 * 30, 0, 7); ctx.fill(); }
          else if (e.kind === 'clash') { ctx.strokeStyle = 'rgba(255,245,200,' + (1 - k2) + ')'; ctx.lineWidth = 2.5; for (var r = 0; r < 6; r++) { var a = r / 6 * 6.28 + e.seed; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * 6, e.y + Math.sin(a) * 6); ctx.lineTo(e.x + Math.cos(a) * (14 + k2 * 22), e.y + Math.sin(a) * (14 + k2 * 22)); ctx.stroke(); } }
          else if (e.kind === 'num') { ctx.font = '800 ' + (e.big ? 28 : 22) + 'px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,' + (1 - k2) + ')'; ctx.strokeText(e.text, e.x, e.y - k2 * 40); ctx.fillStyle = 'rgba(' + e.col + ',' + (1 - k2) + ')'; ctx.fillText(e.text, e.x, e.y - k2 * 40); }
          else if (e.kind === 'spike') { ctx.fillStyle = 'rgba(90,60,30,' + (1 - k2) + ')'; for (var sp = 0; sp < 7; sp++) { var sx = e.x - 50 + sp * 16; ctx.beginPath(); ctx.moveTo(sx - 5, e.y + 8); ctx.lineTo(sx, e.y - 14 * Math.min(1, k2 * 4)); ctx.lineTo(sx + 5, e.y + 8); ctx.fill(); } }
          else if (e.kind === 'banner') { ctx.font = '800 38px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.lineWidth = 6; var al = k2 < 0.15 ? k2 / 0.15 : k2 > 0.75 ? (1 - k2) / 0.25 : 1; ctx.strokeStyle = 'rgba(20,10,0,' + al + ')'; ctx.strokeText(e.text, W / 2, 70); ctx.fillStyle = 'rgba(255,226,140,' + al + ')'; ctx.fillText(e.text, W / 2, 70); }
        });
        ctx.restore();
      }
      function banner(text, life) { fx = fx.filter(function (e) { return e.kind !== 'banner'; }); fx.push({ kind: 'banner', text: text, t: 0, life: life || 1.3 }); }
      var last = performance.now(), live = true;
      function loop() {
        if (!live) return;
        var now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
        mine.concat(foes).forEach(function (u) {
          u.x += (u.tx - u.x) * Math.min(1, dt * 4); u.y += (u.ty - u.y) * Math.min(1, dt * 4);
          if (u.hitT > 0) u.hitT = Math.max(0, u.hitT - dt * 2.5);
          if (u.lunge) u.lunge = Math.max(0, u.lunge - dt * 90);
          if (u.act) u.actT = (u.actT || 0) + dt;
          if (u.n <= 0 && u.fade > 0) u.fade = Math.max(0, u.fade - dt * 1.2);
        });
        fx.forEach(function (e) { e.t += dt; }); fx = fx.filter(function (e) { return e.t < e.life; });
        if (shakeT > 0) shakeT = Math.max(0, shakeT - dt * 2.2);
        draw();
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
      G.Games._landDebug = { mine: mine, foes: foes, step: function (n) { for (var i = 0; i < (n || 1); i++) { mine.concat(foes).forEach(function (u) { u.x = u.tx; u.y = u.ty; }); fx.forEach(function (e) { e.t += 0.1; }); } draw(); }, draw: draw };

      // ------------------------------------------------ 편성 (싸우기 전에 부대 종류를 고른다)
      function formBar() {
        btns.innerHTML = '';
        var row = U.el('div', 'lw-form');
        mine.forEach(function (u) {
          if (u.type === 'adm') return;
          var b = U.el('button', 'btn small lw-slot', '<b>' + unitName(u) + '</b><small>' + u.n + '명</small>');
          b.title = '눌러서 부대 종류를 바꾼다';
          b.onclick = function () {
            var order = ['inf', 'cav', 'gun', 'art'], i = order.indexOf(u.type);
            for (var k = 1; k <= 4; k++) { var nt = order[(i + k) % 4]; if (allowed(mine, u, nt, guns)) { u.type = nt; if (nt === 'cav') u.ride = mountInfo().name; break; } }
            u.up = upgraded(u.type); formBar();
          };
          row.appendChild(b);
        });
        btns.appendChild(row);
        var go = U.el('button', 'btn red', '전투 개시'); go.onclick = start; btns.appendChild(go);
        var fl = U.el('button', 'btn ghost', '피한다'); fl.onclick = function () { tryFlee(true); }; if (opt.flee !== false) btns.appendChild(fl);
        var mi2 = mountInfo();
        say('부대 편성 — 칸을 눌러 종류를 바꾸십시오. 보병 · 총병(앞줄 셋) · ' + (mi2.ride ? '기병(' + mi2.name + ' ' + mi2.ride + '명분)' : '기병은 말·낙타·코끼리가 있어야') + ' · ' + (guns ? '포병(적 전체, 한 부대)' : '포병은 짐 나르는 짐승·마차가 있어야') + '. 적: ' + foes.map(function (u) { return (u.leader ? '★' : '') + u.name + ' ' + u.n; }).join(' · '));
      }
      mine.forEach(function (u) { u.up = upgraded(u.type); });

      // ------------------------------------------------ 전투
      function cmdBar() {
        btns.innerHTML = '';
        function B(label, cls, fn, dis, tip) { var b = U.el('button', 'btn ' + (cls || ''), label); if (dis) { b.classList.add('disabled'); b.disabled = true; } if (tip) b.title = tip; b.onclick = function () { if (!busy && !over) fn(); }; btns.appendChild(b); return b; }
        B('1 공격', 'red', function () { turn('attack'); });
        B('2 방어', 'navy', function () { turn('guard'); });
        var sp = specials();
        sp.forEach(function (x, i) { B((i + 3) + ' ' + x.name + (x.p != null ? ' <small>' + Math.round(x.p * 100) + '%</small>' : ''), '', function () { turn(x.id); }, !x.ok, x.tip); });
        var ab = B(auto ? '자동 멈춤' : '자동', 'ghost', function () { auto = !auto; cmdBar(); if (auto && !busy) turn('attack'); });
        if (auto) ab.classList.add('on');
        if (opt.flee !== false) B('후퇴', 'ghost', function () { tryFlee(false); });
      }
      function specials() {
        var art = alive(mine).some(function (u) { return u.type === 'art'; }), shells = R.hasItem('shells');
        return [
          { id: 'ambush', name: '기습', p: U.clamp((TERR_AMBUSH[terr] || 0.45) + sk('survey') * 0.04, 0.1, 0.95), ok: !used.ambush, tip: '숨어서 덮친다 — 적 모두를 치고 한 차례 발을 묶는다 (숲·밀림·산에서 잘 된다)' },
          { id: 'trap', name: '함정', p: U.clamp((TERR_TRAP[terr] || 0.5) + sk('survey') * 0.05, 0.1, 0.95), ok: !used.trap, tip: '함정을 판다 — 다음에 달려드는 적이 걸려 크게 다친다' },
          { id: 'snipe', name: '저격', p: U.clamp(0.18 + sk('shoot') * 0.12, 0.05, 0.8), ok: !used.snipe, tip: '솜씨 좋은 사수가 적 우두머리를 노린다' },
          { id: 'shells', name: '작렬탄', p: null, ok: !used.shells && art && shells, tip: '포병이 작렬탄을 쏜다 — 적 전체에 큰 피해 (소지품의 작렬탄 1회를 쓴다)' }
        ];
      }
      var busy = false;
      function start() {
        phase = 'fight'; mine.forEach(function (u) { u.up = upgraded(u.type); });
        banner('전투 개시!', 1.4);
        var ups = mine.filter(function (u) { return u.up; }).map(unitName);
        say('전투 개시!' + (ups.length ? ' <b>' + ups.join(' · ') + '</b> — 특기 덕에 강해졌다.' : ''));
        if (G.Audio) G.Audio.sfx('sword');
        cmdBar();
      }
      function myMul(u) {
        var m = 1 - Math.min(0.5, f.fatigue / 250);
        if (u.type === 'inf' || u.type === 'adm') m *= 1 + sk('sword') * 0.08;
        if (u.type === 'cav') m *= (1 + sk('sword') * 0.08) * (1 + G.Mounts.combat(S().loc.mount, P0) * 0.6);
        if (u.type === 'gun') m *= 1 + sk('shoot') * 0.1;
        if (u.type === 'art') m *= 1 + sk('gun') * 0.1;
        if (u.type === 'adm') m *= 1 + R.atk() / 40;
        if (u.up) m *= u.type === 'adm' ? 2 : 1.4;
        return m;
      }
      function kills(att, pow, k, def) {
        var base = Math.max(1, att.n) * pow * U.rf(0.2, 0.3) * k;
        if (def.side === 'me') { if (guardMe) base *= 0.5; if (def.type === 'adm') base *= (1 - Math.min(0.5, R.def() / 30)) * (def.up ? 0.5 : 1); }
        if (def.side === 'en' && def.leader) { base *= 0.5; if (alive(foes).filter(function (u) { return !u.leader; }).length >= 2) base *= 0.5; }   // 우두머리는 날랜 호위병 — 다른 적이 둘 넘게 남아 있으면 더 단단하다
        var n = Math.round(base); if (n < 1 && U.chance(base)) n = 1;
        return Math.min(def.n, n);
      }
      function hurt(u, n, big) {
        if (n <= 0) { fx.push({ kind: 'num', text: '막음', col: '200,220,255', x: u.x, y: u.y - 50, t: 0, life: 0.9 }); return; }
        u.n -= n; u.hitT = 0.5; if (u.n <= 0) { u.n = 0; u.fade = 1; }
        if (u.act !== 'attack' || u.actT > 0.3) { u.act = 'hurt'; u.actT = 0; }
        fx.push({ kind: 'num', text: '−' + n, col: u.side === 'me' ? '255,140,120' : '255,236,160', x: u.x + U.rf(-10, 10), y: u.y - 52, big: big, t: 0, life: 1.1 });
        shakeT = Math.min(1, shakeT + (big ? 0.5 : 0.18));
      }
      function targetsFor(att, list, reach) {
        var al = alive(list); if (!al.length) return [];
        if (reach === 'all') return al;
        if (reach === 'front') return front(list);
        // 기병은 어느 부대든 (뒷줄·우두머리도) 칠 수 있고, 보병·제독대는 앞줄만 친다
        if (att.side === 'me' && target && target.n > 0 && (att.type === 'cav' || front(list).indexOf(target) >= 0)) return [target];
        return [front(list)[0] || al[0]];
      }
      function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
      /** 한 부대의 공격 (그림과 함께) */
      async function act(u, list) {
        if (u.n <= 0) return;
        var me = u.side === 'me', reach = me ? TYPES[u.type].reach : u.reach, pow = me ? TYPES[u.type].pow * myMul(u) : u.pow;
        var ts = targetsFor(u, list, reach); if (!ts.length) return;
        var look = me ? u.type : u.look;
        u.act = 'attack'; u.actT = 0;
        if (reach === 'one') {
          var t = ts[0]; u.lunge = 42; fx.push({ kind: 'clash', x: (u.x + t.x) / 2 + (me ? 30 : -30), y: t.y - 20, seed: U.rand() * 6, t: 0, life: 0.45 });
          if (G.Audio) G.Audio.sfx('sword');
          await sleep(140);
          var n = kills(u, pow, 1, t);
          if (trapOn && !me) { trapOn = false; fx.push({ kind: 'spike', x: u.x, y: u.y, t: 0, life: 1.2 }); var tk = Math.max(1, Math.round(u.n * U.rf(0.25, 0.4))); hurt(u, tk, true); say(u.name + U.jx(u.name, '이/가') + ' 함정에 걸렸다! (' + tk + ' 쓰러짐)'); return; }
          hurt(t, n, look === 'cav' || u.leader);
        } else {
          var k = reach === 'all' ? 0.36 : 0.62;
          ts.forEach(function (t, i) {
            var kk = reach === 'front' ? [1, 0.75, 0.55][i] || 0.5 : 1;
            if (look === 'art' || look === 'cannon') fx.push({ kind: 'ball', x0: u.x, y0: u.y - 20, x1: t.x, y1: t.y - 10, t: -i * 0.08, life: 0.7 });
            else if (look === 'bow') for (var a = 0; a < 3; a++) fx.push({ kind: 'arrow', x0: u.x + a * 6, y0: u.y - 24, x1: t.x + U.rf(-20, 20), y1: t.y - 14, t: -a * 0.05, life: 0.6 });
            else { for (var m = 0; m < 3; m++) { fx.push({ kind: 'flash', x: u.x + (me ? 22 : -22) + (m - 1) * 16, y: u.y - 22, t: 0, life: 0.18 }); fx.push({ kind: 'smoke', x: u.x + (me ? 26 : -26) + (m - 1) * 16, y: u.y - 22, d: me ? 1 : -1, t: 0, life: 1.4 }); } fx.push({ kind: 'shot', x0: u.x, y0: u.y - 22, x1: t.x, y1: t.y - 18, t: 0, life: 0.25 }); }
            t._k = kk;
          });
          if (G.Audio) G.Audio.sfx(look === 'art' || look === 'cannon' ? 'cannon' : 'cannon');
          await sleep(look === 'art' || look === 'cannon' ? 620 : look === 'bow' ? 520 : 200);
          ts.forEach(function (t) { if (look === 'art' || look === 'cannon') fx.push({ kind: 'boom', x: t.x, y: t.y - 10, t: 0, life: 0.7 }); hurt(t, kills(u, pow, k * t._k, t), look === 'art' || look === 'cannon'); });
        }
        await sleep(160);
      }
      function outcome() {
        var lead = foes.filter(function (u) { return u.leader; })[0], adm = mine.filter(function (u) { return u.leader; })[0];
        if (lead.n <= 0 || !alive(foes).length) return 'win';
        if (adm.n <= 0) return 'lose';
        var tot = U.sum(mine, function (u) { return u.n; });
        if (tot < P0 * 0.2) return 'lose';
        return null;
      }
      async function turn(cmd) {
        if (busy || over || phase !== 'fight') return; busy = true;
        guardMe = cmd === 'guard';
        var skipMine = false;
        if (cmd === 'ambush' || cmd === 'trap' || cmd === 'snipe' || cmd === 'shells') {
          used[cmd] = 1; skipMine = true;
          var sp = specials().filter(function (x) { return x.id === cmd; })[0];
          var ok = sp.p == null || U.chance(sp.p);
          if (cmd === 'ambush') {
            if (ok) { banner('기습!', 1.2); say('기습이 먹혔다! 적이 우왕좌왕한다.'); await sleep(300); alive(foes).forEach(function (t) { for (var a = 0; a < 3; a++) fx.push({ kind: 'arrow', x0: t.x - 260, y0: t.y - 120, x1: t.x + U.rf(-20, 20), y1: t.y - 14, t: -a * 0.06, life: 0.55 }); }); await sleep(560); alive(foes).forEach(function (t) { hurt(t, Math.max(1, Math.round(t.n * U.rf(0.15, 0.25))), false); }); stunEn = true; }
            else { say('기습을 들켰다! 적이 먼저 달려든다.'); }
          } else if (cmd === 'trap') {
            if (ok) { trapOn = true; say('앞길에 함정을 팠다. 다음에 달려드는 적이 걸려들 것이다.'); banner('함정', 1); }
            else say('함정을 팔 틈이 없었다.');
          } else if (cmd === 'snipe') {
            var L = foes.filter(function (u) { return u.leader; })[0];
            fx.push({ kind: 'flash', x: 200, y: 180, t: 0, life: 0.2 }); fx.push({ kind: 'shot', x0: 200, y0: 180, x1: L.x, y1: L.y - 24, t: 0, life: 0.3 });
            if (G.Audio) G.Audio.sfx('cannon');
            await sleep(320);
            if (ok) { var sn = Math.max(1, Math.round(L.n * (L.n <= 3 ? 1 : 0.5))); hurt(L, sn, true); say('저격 성공! ' + L.name + '에게 명중했다!'); }
            else { hurt(L, 0); say('저격이 빗나갔다...'); }
          } else if (cmd === 'shells') {
            R.useCharge('shells');
            var art = alive(mine).filter(function (u) { return u.type === 'art'; })[0];
            banner('작렬탄!', 1.2);
            alive(foes).forEach(function (t, i) { fx.push({ kind: 'ball', x0: art.x, y0: art.y - 20, x1: t.x, y1: t.y - 10, t: -i * 0.06, life: 0.7 }); });
            if (G.Audio) G.Audio.sfx('cannon');
            await sleep(700);
            alive(foes).forEach(function (t) { fx.push({ kind: 'boom', x: t.x, y: t.y - 10, t: 0, life: 0.9 }); hurt(t, Math.max(1, Math.round(t.n * U.rf(0.35, 0.5))), true); });
            say('작렬탄이 적진 한가운데서 터졌다!');
          }
          if (!ok && cmd !== 'shells') await sleep(300);
        }
        // 우리 편 공격 (방어할 때는 근접 부대가 받아칠 채비만 한다)
        if (!skipMine) {
          if (cmd === 'guard') say('방어 태세! 방패를 세우고 버틴다.');
          else for (var i = 0; i < mine.length; i++) { if (mine[i].n > 0 && alive(foes).length && !outcome()) await act(mine[i], foes); }
        }
        var r = outcome();
        if (!r) {
          // 적의 차례
          if (stunEn) { stunEn = false; say('적은 발이 묶여 이번에는 움직이지 못한다.'); await sleep(300); }
          else for (var j = 0; j < foes.length; j++) { if (foes[j].n > 0 && alive(mine).length && !outcome()) await act(foes[j], mine); }
          if (cmd === 'guard') { alive(mine).filter(function (u) { return u.type === 'inf' || u.type === 'cav' || u.type === 'adm'; }).forEach(function (u) { var t = front(foes)[0]; if (t) hurt(t, Math.round(kills(u, TYPES[u.type].pow * myMul(u), 0.35, t)), false); }); }
          r = outcome();
        }
        place();
        if (target && target.n <= 0) target = null;
        if (r) return end(r);
        var tot = U.sum(mine, function (u) { return u.n; }), et = U.sum(foes, function (u) { return u.n; });
        if (cmd === 'attack' || cmd === 'guard') say('아군 ' + tot + '명 · 적 ' + et + (e.kind === 'beast' ? '마리' : '명') + (target ? ' · 목표: ' + target.name : ''));
        busy = false; cmdBar();
        if (auto) setTimeout(function () { if (auto && !over) turn('attack'); }, 650);
      }
      async function tryFlee(before) {
        if (busy || over) return; busy = true;
        var p = (before ? 0.7 : 0.5) + (mountInfo().ride ? 0.15 : 0) - (e.kind === 'beast' ? 0.1 : 0);
        if (U.chance(p)) { say('싸움을 피해 물러났다.'); return end('flee'); }
        say('물러나지 못했다! 적이 뒤를 친다.');
        if (before) { phase = 'fight'; mine.forEach(function (u) { u.up = upgraded(u.type); }); }
        for (var j = 0; j < foes.length; j++) if (foes[j].n > 0 && !outcome()) await act(foes[j], mine);
        place(); var r = outcome(); if (r) return end(r);
        busy = false; cmdBar();
      }
      function end(res) {
        over = true; auto = false;
        var lead = foes.filter(function (u) { return u.leader; })[0];
        if (res === 'win' && alive(foes).length) { foes.forEach(function (u) { if (u.n > 0) { u.tx = u.x + 400; u.fade = 1; } }); }
        banner(res === 'win' ? (lead.n <= 0 ? lead.name + U.jx(lead.name, '을/를') + ' 쓰러뜨렸다!' : '승리!') : res === 'lose' ? '패배...' : '후퇴', 2.2);
        var left = U.sum(mine, function (u) { return u.n; }), dead = P0 - left;
        var back = res === 'flee' && dead === 0 ? 0 : Math.min(dead, Math.round(dead * U.clamp(0.25 + sk('med') * 0.15 + (S().player.st.int > 70 ? 0.05 : 0), 0, 1)));
        var adm = mine.filter(function (u) { return u.leader; })[0];
        if (!opt.noHurt) S().player.hp = Math.max(10, Math.round(S().player.hp - 40 * (1 - adm.n / adm.n0)));
        btns.innerHTML = '';
        say((res === 'win' ? (lead.n <= 0 ? '<b>' + lead.name + U.jx(lead.name, '이/가') + ' 쓰러지자 남은 적이 흩어져 달아났다!</b>' : '<b>적을 모두 물리쳤다!</b>') : res === 'lose' ? (adm.n <= 0 ? '<b class="warn-text">제독대가 무너졌다...</b>' : '<b class="warn-text">탐험대가 무너졌다...</b>') : '싸움을 피했다.') +
          (dead ? ' 쓰러진 대원 ' + dead + '명 가운데 ' + back + '명이 치료받고 일어섰다.' : ''));
        var ok = U.el('button', 'btn navy', '확인'); btns.appendChild(ok);
        var done = function () { live = false; win.close(res); if (G.Audio) G.Audio.music('land'); resolve({ res: res, dead: dead - back, back: back, left: left + back, leaderDown: lead.n <= 0 }); };
        ok.onclick = done;
        if (opt.fastEnd) setTimeout(done, 50);
      }
      // 적 부대를 누르면 목표
      cv.addEventListener('mousedown', function (ev) {
        var r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
        var hit = null, bd = 70 * 70; alive(foes).forEach(function (u) { var d = (u.x - x) * (u.x - x) + (u.y - 20 - y) * (u.y - 20 - y); if (d < bd) { bd = d; hit = u; } });
        if (hit) { target = target === hit ? null : hit; if (phase === 'fight' && !busy) say(target ? '목표: ' + hit.name + (front(foes).indexOf(hit) < 0 ? ' — 뒷줄이라 기병만 닿는다' : '') + (hit.leader && alive(foes).filter(function (u) { return !u.leader; }).length >= 2 ? ' (호위를 받고 있어 덜 맞는다)' : '') : '목표를 풀었다 — 앞줄의 적을 친다'); }
      });
      var unkey = UI.pushKey(function (ev) {
        if (over) return false;
        var k = ev.key;
        if (phase === 'form' && (k === 'Enter' || k === ' ')) { start(); return true; }
        if (phase !== 'fight' || busy) return false;
        if (k === '1') { turn('attack'); return true; } if (k === '2') { turn('guard'); return true; }
        var n = parseInt(k, 10); if (n >= 3 && n <= 6) { var x = specials()[n - 3]; if (x && x.ok) turn(x.id); return true; }
        return false;
      });
      win.result.then(function () { live = false; unkey(); });
      formBar();
    });
  };
})(window.G = window.G || {});
