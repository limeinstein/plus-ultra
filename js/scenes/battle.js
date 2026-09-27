/* Naval battle: real-time tactical broadsides and boarding on the open sea. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var B = {};
  G.Scenes.battle = B;
  var st = null;
  function S() { return G.Game.state; }
  var SCALE = 1;           // px per battle unit
  var ARENA = 1300;        // retreat radius from arena centre

  // ---------------------------------------------------------------- setup
  function enemyFleet(npc) {
    var s = S(), n = npc.n || 1, list = [];
    var fameK = npc.K != null ? npc.K : Math.min(1, s.player.fame / 4000);   // 해적은 명성과 우리 함대 크기로 정한 세기 (sea.js pirateK)
    var zone = npc.zone || G.Ships.zone(s.loc.lon, s.loc.lat);
    var types = npc.ships && npc.ships.length === n ? npc.ships : G.Ships.enemyTypes(npc.kind, zone, npc.nation, n, fameK, s.date.y);
    var pname = npc.kind === 'pirate' ? (zone === 'east' ? '왜구선 ' : '해적선 ') : npc.kind === 'navy' ? (npc.nation || '') + ' 군함 ' : '상선 ';
    for (var i = 0; i < n; i++) {
      var t = G.SHIP[types[i]] || G.SHIP.caravel;
      var gun = npc.kind === 'navy' ? U.pick(['culverin', 'perrier', 'cannon']) : npc.kind === 'pirate' ? U.pick(['saker', 'perrier', 'culverin']) : 'saker';
      // 해적: 처음(세기 0)에는 선원이 정원의 22%, 포문의 40~60%만 채운 작은 무리 — 세기 1이면 88%, 70~90% (G.BALANCE.pirateCrew)
      var pc = (G.BALANCE && G.BALANCE.pirateCrew) || [0.38, 0.5];
      var crew = Math.round(t.crew[1] * (npc.kind === 'pirate' ? (pc[0] + pc[1] * fameK) * U.rf(0.85, 1.15) : U.rf(0.45, 0.8)));
      var gunK = npc.kind === 'merchant' ? 0.3 : npc.kind === 'pirate' ? Math.min(0.9, U.rf(0.4, 0.6) + 0.3 * fameK) : U.rf(0.5, 0.9);
      list.push({ type: t.id, name: pname + (i + 1) + '호', hp: t.hp, maxHp: t.hp, crew: crew, crewMax: t.crew[1], guns: { type: gun, n: Math.max(1, Math.round(t.ports * gunK)) }, sails: t.sails.slice() });
    }
    return list;
  }
  function makeShip(src, side, i, n) {
    var t = G.SHIP[src.type];
    var len = (58 + Math.min(1000, t.cap) / 14) * 1.5 * (t.len || 1);
    var x = side === 'me' ? -380 : 380, y = (i - (n - 1) / 2) * 150;
    return {
      side: side, src: src, name: src.name, type: src.type, x: x + U.rf(-30, 30), y: y + U.rf(-20, 20), heading: side === 'me' ? 0 : Math.PI,
      hp: src.hp, maxHp: src.maxHp, crew: 0, crew0: 0, guns: { type: src.guns.type, n: src.guns.n }, sails: src.sails, len: len,
      reload: [U.rf(0, 2), U.rf(0, 2), U.rf(0, 2)], alive: true, captured: false, fled: false, target: null, moveTo: null, sink: 0, flag: i === 0, no: i + 1, speedK: t.spd, turn: t.turn || 1,
      t: t, tr: t.traits, ramCd: 0, bulk: false,
      vel: null, spd: 0, lat: 0, turnRate: 0,
      fx: G.SeaFX ? G.SeaFX.create({ spacing: BFX.wakeSpacing, life: BFX.wakeLife, maxPoints: 280, kz: 1 }) : null   // 해전 좌표(px)와 해전 시간(1.5초 = 물보라의 하루)으로
    };
  }

  B.enter = function (arg) {
    var s = S(), npc = arg.npc || { kind: 'pirate', n: 1 };
    G.Game.showLayers(true, true, false);
    G.Game.ensureRenderer();
    st = { cx: 0, cy: 0, npc: npc, t: 0, ships: [], fx: [], balls: [], paused: false, over: false, mode: 'follow', sel: null, busy: 0, log: [], fled: 0, center: { lon: s.loc.lon, lat: s.loc.lat } };
    // player ships & crew distribution
    var f = s.fleet, totMax = R.crewMax();
    f.ships.forEach(function (sh, i) {
      var b = makeShip(sh, 'me', i, f.ships.length);
      b.crew = b.crew0 = Math.max(1, Math.round(f.crew * sh.crewMax / Math.max(1, totMax)));
      st.ships.push(b);
    });
    var en = enemyFleet(npc);
    en.forEach(function (sh, i) { var b = makeShip(sh, 'en', i, en.length); b.crew = b.crew0 = sh.crew; st.ships.push(b); });
    st.wind = R.wind(s.loc.lon, s.loc.lat, s.date, 0);
    s.stats.battles++;
    // 기함: 양쪽 모두 1번 배. 적 기함을 가라앉히거나 나포하면 이기고, 우리 기함을 잃으면 진다
    st.myFlag = st.ships.filter(function (b) { return b.side === 'me'; })[0] || null;
    st.enFlag = st.ships.filter(function (b) { return b.side === 'en'; })[0] || null;
    buildUI();
    if (st.enFlag && st.ships.filter(function (b) { return b.side === 'en'; }).length > 1) setTimeout(function () { if (st && !st.over) UI.toast('적 기함(1번 · ' + st.enFlag.name + ')을 가라앉히거나 나포하면 이깁니다. 우리 기함(1번)을 잃으면 집니다.', 'flag', 5200); }, 600);
    if (G.Audio) G.Audio.music('battle');
    var foe = npc.kind === 'pirate' ? '해적' : npc.kind === 'navy' ? ((npc.nation ? npc.nation + ' ' : '') + '함대') : '상선단';
    UI.toast(foe + U.jx(foe, '과/와') + ' 전투가 시작되었다! 방향키로 기함을 몰고 Space로 세웁니다. 바다를 클릭해 움직이고, 적함을 클릭하면 공격합니다.', 'cannon', 5000);
  };
  B.exit = function () { if (st && st.unkey) st.unkey(); st = null; };
  B.debug = function () { return st; };

  // ---------------------------------------------------------------- UI
  var el = {};
  function buildUI() {
    UI.clearScreen();
    UI.hud.show([{ k: 'title', icon: 'cannon', text: '해전' }, { k: 'me', icon: 'ship', text: '' }, { k: 'en', icon: 'skull', text: '' }, { grow: true }, { k: 'wind', icon: 'wind', text: '' }]);
    var catcher = U.el('div', 'mapcatch'); catcher.style.cssText = 'position:absolute;inset:0;z-index:5;cursor:crosshair';
    catcher.addEventListener('mousedown', onDown);
    catcher.addEventListener('mousemove', function (e) { st.mouse = pos(e); });
    UI.add(catcher);
    var bar = U.el('div', 'sailbar wood brass-frame');
    function btn(label, icon, fn, cls) { var b = U.el('button', 'btn ' + (cls || ''), G.icon(icon) + label); b.onclick = function (e) { e.stopPropagation(); if (!UI.busy() && !st.busy) fn(); }; bar.appendChild(b); return b; }
    el.pause = btn('일시정지', 'pause', function () { st.paused = !st.paused; el.pause.innerHTML = G.icon(st.paused ? 'sail' : 'pause') + (st.paused ? '재개' : '일시정지'); });
    el.mode = btn('진형: 기함 추종', 'people', function () { st.mode = st.mode === 'follow' ? 'free' : 'follow'; el.mode.innerHTML = G.icon('people') + (st.mode === 'follow' ? '진형: 기함 추종' : '진형: 자유 공격'); });
    el.board = btn('백병전', 'sword', function () { boardNearest(); }, 'red');
    el.flee = btn('퇴각', 'boot', function () { st.retreat = true; var f0 = flagship(); if (f0) { f0.steer = null; f0.halt = false; } UI.toast('퇴각! 전장 가장자리로 벗어나십시오.', 'boot'); });
    UI.add(bar);
    el.panel = UI.add(U.el('div', 'battlepanel wood brass-frame', ''));
    if (st.unkey) st.unkey();
    st.arrows = {};
    // 방향키·WASD = 기함을 그 방위로 몬다 (두 키 = 대각선) · Space = 기함 정지 · P = 일시정지 · B = 백병전
    st.unkey = UI.pushKey(function (e) {
      if (G.Game.scene !== B || UI.busy()) return false;
      var k = String(e.key).toLowerCase();
      if (k === ' ') { if (!e.repeat) haltFlag(); return true; }
      if (k === 'p') { el.pause.click(); return true; }
      if (k === 'b') { boardNearest(); return true; }
      if (ARROWDIR[k]) {
        st.arrows[k] = true;
        if (e.repeat) return true;                     // 누른 채 되풀이되는 신호는 무시 (대각선에서 한 키를 먼저 떼도 그대로)
        var a = arrowAngle(); if (a != null) steerFlag(a);
        return true;
      }
      return false;
    });
    if (!B._keyHooked) {
      B._keyHooked = true;
      window.addEventListener('keyup', function (e) { if (st && st.arrows) st.arrows[String(e.key).toLowerCase()] = false; });
      window.addEventListener('blur', function () { if (st) st.arrows = {}; });
    }
  }
  // 해전 화면은 y가 아래로 커진다: ↑ = 화면 위(북)
  var ARROWDIR = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
  function arrowAngle() {
    var x = 0, y = 0, a = st.arrows || {};
    for (var k in a) if (a[k] && ARROWDIR[k]) { x += ARROWDIR[k][0]; y += ARROWDIR[k][1]; }
    x = Math.sign(x); y = Math.sign(y);
    return (x || y) ? Math.atan2(y, x) : null;
  }
  /** 방향키: 기함이 그 방위로 계속 나아간다 (클릭한 목적지·공격 목표는 버린다 — 현측에 든 적에게는 알아서 쏜다) */
  function steerFlag(a) {
    var fs = flagship(); if (!fs || st.over) return;
    fs.steer = a; fs.halt = false; fs.moveTo = null; fs.target = null; fs.boardIntent = false;
    if (st.paused) el.pause.click();
  }
  /** Space: 기함이 돛을 거두고 선다 (포는 현측에 든 적에게 계속 쏜다) */
  function haltFlag() {
    var fs = flagship(); if (!fs || st.over) return;
    if (fs.halt) { UI.toast('기함이 멈춰 있습니다. 방향키로 몰거나 바다·적함을 클릭하십시오.', 'anchor', 2400); return; }
    fs.halt = true; fs.steer = null; fs.moveTo = null; fs.target = null; fs.boardIntent = false;
    UI.toast(fs.name + '호가 돛을 거두고 멈춥니다.', 'anchor', 1800);
  }
  function pos(e) { var r = G.Game.canvases().overlay.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1600, (e.clientY - r.top) / r.height * 900]; }
  function toScreen(x, y) { return [800 + (x - st.cx) * SCALE, 450 + (y - st.cy) * SCALE]; }
  function toWorld(px, py) { return [st.cx + (px - 800) / SCALE, st.cy + (py - 450) / SCALE]; }
  /** 기함: 우리 1번 배 (지휘·일기토). 기함을 잃으면 해전에 진다 */
  /** 배 이름표: 번호 동그라미(기함은 1번 — 금빛·붉은빛 테와 「기함」 표) + 이름 */
  function drawShipTag(ctx, b, x, y) {
    var me = b.side === 'me', txt = b.name, tw = ctx.measureText(txt).width, r = b.flag ? 11 : 9.5;
    var tagW = b.flag ? 34 : 0, total = r * 2 + 6 + tw + (tagW ? 6 + tagW : 0), x0 = x - total / 2;
    // 번호
    ctx.beginPath(); ctx.arc(x0 + r, y - 5, r, 0, 7);
    ctx.fillStyle = b.flag ? (me ? '#e2b04a' : '#d8503a') : 'rgba(10,14,24,.72)'; ctx.fill();
    ctx.lineWidth = b.flag ? 2 : 1.2; ctx.strokeStyle = b.flag ? '#fff2cc' : (me ? '#b8d0a0' : '#ffb0a0'); ctx.stroke();
    ctx.fillStyle = b.flag ? '#2a1606' : (me ? '#e8f0d8' : '#ffd0c4'); ctx.textAlign = 'center';
    var f0 = ctx.font; ctx.font = '800 ' + (b.flag ? 14 : 12) + 'px ' + getComputedStyle(document.body).fontFamily; ctx.fillText(String(b.no || ''), x0 + r, y); ctx.font = f0;
    // 이름
    ctx.textAlign = 'left'; ctx.fillStyle = me ? '#f2e7cc' : '#ffb0a0'; ctx.fillText(txt, x0 + r * 2 + 6, y);
    // 기함 표
    if (tagW) {
      var tx = x0 + r * 2 + 6 + tw + 6;
      ctx.fillStyle = me ? 'rgba(226,176,74,.9)' : 'rgba(216,80,58,.9)'; ctx.fillRect(tx, y - 13, tagW, 17);
      ctx.fillStyle = '#1a0e04'; var f1 = ctx.font; ctx.font = '800 11px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.fillText('기함', tx + tagW / 2, y); ctx.font = f1;
    }
    ctx.textAlign = 'center';
  }
  function flagship() {
    var fs = st.myFlag;
    return fs && fs.alive ? fs : null;
  }
  function onDown(e) {
    if (e.button !== 0 || UI.busy() || st.over) return;
    var p = pos(e), w = toWorld(p[0], p[1]), fs = flagship(); if (!fs) return;
    var hit = null, bd = 50;
    st.ships.forEach(function (b) { if (!b.alive || b.side !== 'en') return; var d = Math.hypot(b.x - w[0], b.y - w[1]); if (d < bd) { bd = d; hit = b; } });
    fs.steer = null; fs.halt = false;
    if (hit) { fs.target = hit; fs.moveTo = null; UI.toast(hit.name + U.j(hit.name, '을/를').slice(hit.name.length) + ' 공격합니다.', 'target', 1800); }
    else { fs.moveTo = w; fs.target = null; }
  }

  // ---------------------------------------------------------------- 타격감: 히트스톱·화면 흔들림·번쩍임·넉백 (조정값 G.FX.impact)
  function IMP() { return (G.FX && G.FX.impact) || { hitstop: 0.07, hitstopTaken: 0.05, hitstopSink: 0.3, hitstopRam: 0.12, hitstopCool: 0.12, shakeFire: 1.5, shakeHit: 5, shakeTaken: 8, shakeSink: 16, shakeClash: 11, shakeRound: 5, shakeDecay: 9, flashFire: 0.04, flashHit: 0.1, flashTaken: 0.16, flashSink: 0.42, flashClash: 0.32, flashRound: 0.12, flashDecay: 9, shipFlash: 0.12, recoil: 4, knock: 14, knockApart: 34, roundDelay: 0.26, numbers: true, debris: 12, sparks: 9, ballArc: 24, zoomHit: 0.015, zoomSink: 0.05, burnAt: 0.55, fireAt: 0.3 }; }
  /** 설정에서 「화면 흔들림·번쩍임」을 끄면 흔들림과 번쩍임은 빠진다 (히트스톱·넉백은 남는다) */
  function feelOn() {
    var s = S(), v = s && s.settings ? s.settings.shake : undefined;
    if (v === false) return false;
    if (v === undefined && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;   // 움직임 줄이기를 켠 컴퓨터는 기본으로 끈다
    return true;
  }
  function shake(px) { if (st && feelOn() && px > 0) st.shake = Math.max(st.shake || 0, px); }
  function flash(a, rgb) { if (!st || !feelOn() || !(a > 0)) return; if (!st.flash || a >= st.flash.a) st.flash = { a: a, c: rgb || '255,244,220' }; }
  /** 히트스톱: 잠깐 모든 배와 포탄을 멈춘다 (흔들림·번쩍임은 그 사이에도 움직인다) */
  function hitstop(t) { if (!st || !(t > 0) || st.hsCool > 0) return; st.hitstop = Math.max(st.hitstop || 0, t); }
  /** 보이는 밀림: 배를 (dx, dy) 쪽으로 px만큼 잠깐 밀었다가 제자리로 (멈춰 있는 동안에도 보인다) */
  function jolt(b, dx, dy, px) { var d = Math.hypot(dx, dy) || 1; b.jx = (b.jx || 0) + dx / d * px; b.jy = (b.jy || 0) + dy / d * px; }
  /** 화면이 살짝 다가온다 (큰 명중·침몰) */
  function zoomKick(z) { if (st && feelOn() && z > 0) st.zoomK = Math.max(st.zoomK || 0, z); }
  /** 피해 숫자: 같은 배에 0.4초 안에 맞은 포탄은 한 숫자로 합친다 (현측 한 번 = 숫자 하나) */
  function dmgNumber(t, dmg, kill) {
    if (!IMP().numbers) return;
    var f = null;
    for (var i = st.fx.length - 1; i >= 0; i--) { var o = st.fx[i]; if (o.kind === 'dmg' && o.ship === t && o.t < 0.4) { f = o; break; } }
    if (!f) { f = { kind: 'dmg', ship: t, x: t.x, y: t.y, dx: U.rf(-12, 12), val: 0, crew: 0, t: 0, life: 1.3 }; st.fx.push(f); }
    f.val += dmg; f.crew += kill || 0; f.popT = f.t; f.big = f.val >= t.maxHp * 0.2;
  }
  /** 포탄이 선체에 맞은 자리: 불덩이·섬광·충격파·나뭇조각·불티·검은 연기 */
  function hitBurst(x, y, dirx, diry, power) {
    var I = IMP(), d = Math.hypot(dirx, diry) || 1, ux = dirx / d, uy = diry / d;
    var budget = st.fx.length > 500 ? 0.3 : 1;          // 큰 해전에서 효과가 너무 쌓이면 조각·불티를 줄인다
    st.fx.push({ kind: 'blast', x: x, y: y, t: 0, life: 0.34, r: 30 + power * 5 });
    st.fx.push({ kind: 'fireball', x: x, y: y, t: 0, life: 0.5, r: 16 + power * 3 });
    for (var i = 0; i < Math.round(I.debris * (0.6 + power * 0.08) * budget); i++) {
      var a = Math.atan2(uy, ux) + U.rf(-1.3, 1.3), sp = U.rf(60, 190);
      st.fx.push({ kind: 'debris', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, h: U.rf(40, 110), rot: U.rf(0, 6.28), vr: U.rf(-12, 12), w: U.rf(3, 8), t: 0, life: U.rf(0.7, 1.15), dark: U.chance(0.4) });
    }
    for (var j = 0; j < Math.round(I.sparks * budget); j++) {
      var b2 = Math.atan2(uy, ux) + U.rf(-1.6, 1.6), sp2 = U.rf(140, 320);
      st.fx.push({ kind: 'spark', x: x, y: y, vx: Math.cos(b2) * sp2, vy: Math.sin(b2) * sp2, t: 0, life: U.rf(0.22, 0.45) });
    }
    for (var k = 0; k < 2; k++) st.fx.push({ kind: 'dsmoke', x: x + U.rf(-6, 6), y: y + U.rf(-6, 6), vx: windDrift()[0] + U.rf(-6, 6), vy: windDrift()[1] + U.rf(-6, 6), r: 8 + power * 1.2, t: 0, life: U.rf(1.8, 2.8) });
  }
  /** 연기가 바람에 밀려가는 방향 (px/초, 화면 좌표) */
  function windDrift() { return [Math.cos(st.wind.dir) * (8 + 18 * st.wind.spd), -Math.sin(st.wind.dir) * (8 + 18 * st.wind.spd)]; }
  B.runtime = function () { return st; };
  B.feel = function () { return st ? { shake: st.shake || 0, flash: st.flash ? st.flash.a : 0, hitstop: st.hitstop || 0 } : null; };

  // ---------------------------------------------------------------- simulation
  /** 배마다 보이는 파도를 탄다(G.Waves.battle — 해전 바다 셰이더와 같은 식)와 돛·깃발이 겉바람을 따른다 */
  function rideShips(dt, frozen) {
    var RD = G.FX && G.FX.ride, WV = G.Waves;
    if (!RD || RD.on === false || !WV || !(dt > 0)) return;
    var K = RD.battle, wind = [Math.cos(st.wind.dir) * st.wind.spd, Math.sin(st.wind.dir) * st.wind.spd], t = st.t, pxU = 100 * (G.Game.renderer && G.Game.renderer.canvas ? G.Game.renderer.canvas.width / 1600 : 1);
    var fn = function (x, y) { return WV.battle(x, y, t, wind, pxU); }, refV = BFX.ref / BFX.day;
    st.ships.forEach(function (b) {
      if (b.fled) return;
      var sr = Math.min(1.4, Math.max(0, b.spd || 0) / refV), L = b.len / 100;
      var h = WV.hull(fn, b.x / 100, -b.y / 100, -b.heading, Math.min(L, 0.45 * WV.battleSwell()), L * 0.34);
      var heel = U.clamp(-(b.turnRate || 0) * sr * 0.08, -0.12, 0.12);
      var R = b.ride = b.ride || WV.newRide(), vp0 = R.vp;
      var ch = K.chop || 0;
      WV.spring(R, { roll: heel + (h.roll + ch * h.lr) * K.roll, pitch: (h.pitch + ch * h.lp) * K.pitch, heave: h.heave * K.heave }, RD, dt);
      R.cool = Math.max(0, R.cool - dt);
      if (!frozen && b.alive && b.fx && G.SeaFX.burst && R.vp < -RD.slam && vp0 >= -RD.slam && sr > 0.35 && !R.cool) {
        R.cool = RD.slamCool;
        G.SeaFX.burst(b.fx, b.x, -b.y, -b.heading, { len: b.len, wid: b.len * 0.3, ref: BFX.ref }, (b.spd || 0) * BFX.day, RD.slamSpray * Math.min(2, (0.6 + sr * 0.7) * (-R.vp / RD.slam) * 0.8));
        st.slams = (st.slams || 0) + 1;
      }
      if (b.alive && !b.sunk) {
        var vk = 0.5 / refV, v = b.vel || [0, 0];
        b.rig = WV.rigStep(b.rig || {}, WV.apparent({ dir: st.wind.dir, spd: st.wind.spd * (RD.windScale || 1.6) }, v[0] * vk, -v[1] * vk, -b.heading), dt, 0);
      }
    });
  }
  B.update = function (dt) {
    if (!st) return;
    st.t += dt;
    var I = IMP();
    if (st.hitstop > 0) { st.hitstop -= dt; if (st.hitstop <= 0) { st.hitstop = 0; st.hsCool = I.hitstopCool; } }
    else if (st.hsCool > 0) st.hsCool -= dt;
    st.shake = (st.shake || 0) * Math.exp(-dt * I.shakeDecay); if (st.shake < 0.15) st.shake = 0;
    st.zoomK = (st.zoomK || 0) * Math.exp(-dt * 7); if (st.zoomK < 0.0005) st.zoomK = 0;
    if (st.flash) { st.flash.a *= Math.exp(-dt * I.flashDecay); if (st.flash.a < 0.008) st.flash = null; }
    st.ships.forEach(function (b) {
      if (b.jx || b.jy) { var kj = Math.exp(-dt * 7); b.jx *= kj; b.jy *= kj; if (Math.abs(b.jx) + Math.abs(b.jy) < 0.05) b.jx = b.jy = 0; }
      if (b.hitT > 0) b.hitT -= dt;
    });
    var frozen = st.paused || st.busy || UI.busy() || st.over || st.hitstop > 0;
    if (!frozen) {
      var left = Math.min(dt, 0.25);
      while (left > 1e-4 && !st.busy && !st.over) {
        var sdt = Math.min(left, 0.05); left -= sdt;
        st.ships.forEach(function (b) { if (b.alive) think(b, sdt); });
        st.ships.forEach(function (b) { if (b.alive) moveShip(b, sdt); });
        st.ships.forEach(function (b) { if (b.fx) G.SeaFX.age(b.fx, sdt / BFX.day); });
        st.ships.forEach(function (b) { if (b.alive) gunnery(b, sdt); });
        updateBalls(sdt);
        checkEnd();
      }
      // 크게 부서진 배는 검은 연기를 뿜는다 (연기는 그 자리에 남아 바람에 밀린다 — 움직이는 배 뒤로 꼬리가 생긴다)
      st.ships.forEach(function (b) {
        if (!b.alive || b.fled) return;
        var hr = b.hp / b.maxHp; if (hr >= I.burnAt) return;
        b.smokeT = (b.smokeT || 0) - dt; if (b.smokeT > 0) return;
        b.smokeT = 0.1 + hr * 0.5;
        var off = U.rf(-0.3, 0.3) * b.len, wd = windDrift();
        st.fx.push({ kind: 'dsmoke', x: b.x + Math.cos(b.heading) * off, y: b.y + Math.sin(b.heading) * off, vx: wd[0] * 1.6 + U.rf(-5, 5), vy: wd[1] * 1.6 + U.rf(-5, 5), r: 8 + (1 - hr) * 12, t: 0, life: U.rf(2, 3.2), thin: hr > I.fireAt });
      });
    }
    // 멈춘 동안에도 물보라·항적은 천천히 사라진다
    if (frozen) st.ships.forEach(function (b) { if (b.fx) G.SeaFX.age(b.fx, dt / BFX.day * 0.3); });
    // sinking animations
    st.ships.forEach(function (b) { if (!b.alive && b.sink < 1) b.sink = Math.min(1, b.sink + dt * 0.35); });
    rideShips(Math.min(dt, 0.1), frozen);
    // 이 장면에서 막 생긴 효과는 다음 장면부터 나이를 먹는다 (느린 컴퓨터에서 한 장면이 길어도 번쩍임이 한 번은 보이게)
    if (!(st.hitstop > 0)) st.fx = st.fx.filter(function (f) { if (!f.seen) { f.seen = 1; return true; } f.t += dt; return f.t < f.life; });
    // camera: centre between fleets
    var alive = st.ships.filter(function (b) { return b.alive; });
    var mx = 0, my = 0; alive.forEach(function (b) { mx += b.x; my += b.y; }); if (alive.length) { mx /= alive.length; my /= alive.length; }
    st.cx += (mx - st.cx) * Math.min(1, dt * 1.2); st.cy += (my - st.cy) * Math.min(1, dt * 1.2);
    render();
  };
  function speedOf(b) {
    var t = G.SHIP[b.type];
    var rel = Math.abs(U.angDiff(-b.heading, st.wind.dir)); // screen y down -> world angle = -heading
    var th = 0; b.sails.forEach(function (k) { th += R.sailEff(k, rel); }); th /= Math.max(1, b.sails.length);
    var crewF = Math.min(1, b.crew / Math.max(1, t.crew[0]));
    var hpF = 0.5 + 0.5 * b.hp / b.maxHp, crF = 0.4 + 0.6 * crewF;
    var sail = 34 * t.spd * (0.35 + th * 0.9) * hpF * crF;
    if (t.oar) sail = Math.max(sail, 34 * t.oar * 1.5 * hpF * crF);     // 노: 바람과 상관없이 움직인다
    return sail;
  }
  function has(b, k) { return b.tr.indexOf(k) >= 0; }
  function boardRange(b) { return has(b, 'grapple') ? 80 : 55; }
  function think(b, dt) {
    var foes = st.ships.filter(function (o) { return o.alive && o.side !== b.side; });
    if (!foes.length) return;
    var near = foes.slice().sort(function (p, q) { return Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y); })[0];
    if (b.side === 'me') {
      if (st.retreat) { var fs = flagship(); b.moveTo = [b.x - 2000, b.y + (b.y - (fs ? fs.y : 0)) * 0.2]; b.target = null; return; }
      if (b.flag) { if (b.target && !b.target.alive) b.target = null; if (!b.target && !b.moveTo) b.target = null; return; }
      if (st.mode === 'follow') { var f2 = flagship(); if (f2) { var idx = st.ships.filter(function (o) { return o.side === 'me' && o.alive; }).indexOf(b); b.moveTo = [f2.x - Math.cos(f2.heading) * 110 * idx, f2.y - Math.sin(f2.heading) * 110 * idx + (idx % 2 ? 60 : -60)]; b.target = f2.target; } }
      else { b.target = near; b.moveTo = null; }
      return;
    }
    // enemy AI — 우리 기함이 가까이 있으면 기함을 노린다 (기함을 잡으면 이기니까)
    var mfl = st.myFlag;
    if (mfl && mfl.alive && near !== mfl && Math.hypot(mfl.x - b.x, mfl.y - b.y) < 1.4 * Math.hypot(near.x - b.x, near.y - b.y)) near = mfl;
    var kind = st.npc.kind;
    var myCrew = b.crew, theirCrew = near.crew;
    if (kind === 'merchant' || (b.hp < b.maxHp * 0.25 && kind !== 'navy')) { b.moveTo = [b.x + (b.x - near.x) * 3, b.y + (b.y - near.y) * 3]; b.target = null; b.fleeing = true; return; }
    var awe = st.ships.some(function (o) { return o.side === 'me' && o.flag && o.alive && has(o, 'awe'); });
    var boardK = (awe ? 2.0 : 1.3) * (has(near, 'spikes') ? 99 : 1) / (has(b, 'grapple') ? 1.25 : 1);
    if ((kind === 'pirate' || has(b, 'grapple')) && myCrew > theirCrew * boardK) { b.board = near; b.moveTo = [near.x, near.y]; b.target = near; return; }
    b.target = near; b.moveTo = null;
  }
  function moveShip(b, dt) {
    var goal = null;
    if (b.halt) goal = null;                                                           // 방향키 조타: Space로 세움
    else if (b.steer != null) {
      goal = [b.x + Math.cos(b.steer) * 400, b.y + Math.sin(b.steer) * 400];            // 방향키 조타: 그 방위로 계속
      var ed = Math.hypot(b.x, b.y);
      if (ed > ARENA * 0.8 && !st.edgeWarned) { st.edgeWarned = true; UI.toast('전장 가장자리입니다! 이대로 가면 기함이 전장을 벗어납니다.', 'boot', 3000); }
      else if (ed < ARENA * 0.65) st.edgeWarned = false;
    }
    else if (b.moveTo) goal = b.moveTo;
    else if (b.target && b.target.alive) {
      // stand off at gun range and present the broadside
      var t = b.target, d = Math.hypot(t.x - b.x, t.y - b.y), rng = gunRange(b);
      var ang = Math.atan2(t.y - b.y, t.x - b.x);
      if (b.board === t || d > rng * 0.85) goal = [t.x, t.y];
      else if (has(b, 'ram') || (has(b, 'bow') && !has(b, 'dragon'))) goal = [t.x, t.y];      // 뱃머리를 적에게 겨눈다 (충파·뱃머리 포)
      else { var side = U.angDiff(ang, b.heading) > 0 ? 1 : -1; goal = [b.x + Math.cos(ang - side * Math.PI / 2) * 100, b.y + Math.sin(ang - side * Math.PI / 2) * 100]; }
    }
    var v = speedOf(b);
    if (b.halt) v = 0;
    else if (goal) {
      var want = Math.atan2(goal[1] - b.y, goal[0] - b.x);
      var dd = Math.hypot(goal[0] - b.x, goal[1] - b.y);
      if (b.moveTo && dd < 20) { b.moveTo = null; v *= 0.3; }
      var diff = U.angDiff(b.heading, want);
      b.heading += U.clamp(diff, -0.7 * b.turn * dt, 0.7 * b.turn * dt);
    } else v *= 0.35;
    // 관성: 앞뒤 속력은 천천히 붙고 줄며, 뱃머리를 돌려도 진행 방향은 뒤늦게 따라온다 (옆 미끄러짐)
    var hx = Math.cos(b.heading), hy = Math.sin(b.heading), h0 = b.prevH == null ? b.heading : b.prevH;
    if (!b.vel) b.vel = [hx * v * 0.6, hy * v * 0.6];
    var along = b.vel[0] * hx + b.vel[1] * hy, latv = -b.vel[0] * hy + b.vel[1] * hx;
    along += (v - along) * (1 - Math.exp(-dt / (v > along ? BFX.accel : BFX.decel)));
    latv *= Math.exp(-dt / BFX.lateral);
    b.vel = [hx * along - hy * latv, hy * along + hx * latv];
    var ox = b.x, oy = b.y;
    b.x += b.vel[0] * dt; b.y += b.vel[1] * dt;
    b.spd = along; b.lat = latv; b.turnRate = U.angDiff(h0, b.heading) / Math.max(1e-4, dt); b.prevH = b.heading;
    if (b.fx) G.SeaFX.step(b.fx, { x0: ox, y0: -oy, x: b.x, y: -b.y, h: -b.heading, vx: b.vel[0] * BFX.day, vy: -b.vel[1] * BFX.day, lat: -latv * BFX.day, fwd: along * BFX.day, turn: -b.turnRate * BFX.day, days: dt / BFX.day }, { len: b.len, wid: b.len * 0.3, ref: BFX.ref });
    if (b.side === 'me' && b.boardIntent && b.target && b.target.alive && Math.hypot(b.target.x - b.x, b.target.y - b.y) < boardRange(b) + 5 && !st.busy) { b.boardIntent = false; boarding(b.target, b, false); }
    // enemy boarding attempt
    if (b.board && b.board.alive && Math.hypot(b.board.x - b.x, b.board.y - b.y) < boardRange(b) && !st.busy) { var tgt = b.board; b.board = null; boarding(tgt, b, true); }
    // ship separation
    if (b.ramCd > 0) b.ramCd -= dt;
    st.ships.forEach(function (o) {
      if (o === b || !o.alive) return;
      var dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy);
      // 충파: 뱃머리로 적선을 들이받는다
      if (has(b, 'ram') && o.side !== b.side && b.ramCd <= 0 && d < 34 + (b.len + o.len) * 0.18 && !st.busy && Math.abs(U.angDiff(b.heading, Math.atan2(-dy, -dx))) < 0.7) {
        var rd = (8 + b.t.hp * 0.12) * U.rf(0.8, 1.2) * armorK(o);
        o.hp -= rd; o.crew = Math.max(0, o.crew - Math.ceil(o.crew * 0.05)); b.hp -= 1.5; b.ramCd = 5;
        st.fx.push({ kind: 'hit', x: (b.x + o.x) / 2, y: (b.y + o.y) / 2, t: 0, life: 0.8 });
        var bn = shipLabel(b), on = shipLabel(o);
        log(bn + U.jx(bn, '이/가') + ' ' + on + U.jx(on, '을/를') + ' 들이받았다!');
        var I3 = IMP(); o.hitT = I3.shipFlash; jolt(o, o.x - b.x, o.y - b.y, I3.knock); jolt(b, b.x - o.x, b.y - o.y, I3.knock * 0.4);
        hitstop(I3.hitstopRam); shake(I3.shakeClash * 0.8); flash(I3.flashClash * 0.6);
        if (G.Audio) G.Audio.sfx('cannon');
        if (o.hp <= 0) hullBreak(o);
      }
      if (d < 40 && d > 0.1) { b.x += dx / d * (40 - d) * 0.5; b.y += dy / d * (40 - d) * 0.5; }
    });
    // fleeing off the arena
    var dist = Math.hypot(b.x, b.y);
    if (dist > ARENA) {
      b.alive = false; b.fled = true; b.sink = 1;
      if (b.side === 'en') log(b.name + U.j(b.name, '이/가').slice(b.name.length) + ' 달아났다.');
      else log(b.name + '호가 전장을 벗어났다.');
    }
  }
  function gunRange(b) { var c = G.CANNON[b.guns.type] || G.CANNON.saker; return 90 + c.range * 55; }
  function gunnery(b, dt) {
    var c = G.CANNON[b.guns.type] || G.CANNON.saker;
    // 포술은 그 배 선장의 것 (기함은 제독·부관, 다른 배는 선장, 선장이 없으면 갑판장 — 재장전이 느리다)
    var gunSk = b.side === 'me' ? R.shipSkill(b.src, 'gun') : (st.npc.kind === 'navy' ? 2 : 1);
    var reloadT = 5.5 * (1.25 - gunSk * 0.12) * (1 + c.load * 0.12) * (1.4 - 0.4 * Math.min(1, b.crew / Math.max(1, b.crew0))) * (has(b, 'gundeck') ? 0.85 : 1) * (b.side === 'me' && !R.captain(b.src) ? 1.1 : 1);
    var rng = gunRange(b), bow = has(b, 'bow') && !has(b, 'dragon'), dragon = has(b, 'dragon');
    // 0·1: 왼쪽·오른쪽 현측 / 2: 뱃머리 (뱃머리 포·용머리 포구)
    for (var side = 0; side < 3; side++) {
      if (side === 2 && !bow && !dragon) continue;
      b.reload[side] -= dt;
      if (b.reload[side] > 0 || b.guns.n <= 0) continue;
      var sAng = side === 2 ? b.heading : b.heading + (side === 0 ? -Math.PI / 2 : Math.PI / 2);
      var tgt = null, best = 1e9, part = 1;
      st.ships.forEach(function (o) {
        if (!o.alive || o.side === b.side) return;
        var dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
        if (d > rng) return;
        var a = Math.abs(U.angDiff(sAng, Math.atan2(dy, dx))), k;
        if (side === 2) k = a <= 0.6 ? (bow ? 2 : 1) : 0;                    // 뱃머리: 뱃머리 포는 모든 포를, 용머리는 한쪽 현측만큼
        else if (bow) k = d < 90 && a <= 1.2 ? 0.25 : 0;                      // 뱃머리 포 배는 옆으로 거의 못 쏜다
        else {
          k = a <= 0.95 ? 1 : d < 90 ? 0.5 : 0;                              // broadside arc, or point-blank
          if (!k && side === 0 && d < rng * 0.7 && !dragon) k = 0.2;         // bow/stern chasers
        }
        if (!k) return;
        if (d / k < best) { best = d / k; tgt = o; part = k; }
      });
      if (!tgt) continue;
      b.reload[side] = reloadT;
      var dist = Math.hypot(tgt.x - b.x, tgt.y - b.y);
      fire(b, tgt, c, dist, rng, gunSk, part < 1 || side === 2 ? Math.atan2(tgt.y - b.y, tgt.x - b.x) : sAng, part);
    }
  }
  function fire(b, t, c, d, rng, gunSk, sAng, part) {
    var shots = Math.max(1, Math.round(b.guns.n / 2 * (part || 1)));
    var acc = c.acc * (1 + gunSk * 0.1) * (1.15 - 0.5 * d / rng);
    if (b.side === 'me') { var bonus = R.fleetBonus('battle'); acc *= 1 + bonus; if (R.hasItem('shells')) acc *= 1.05; }
    if (G.Audio && st.sfxT !== Math.floor(st.t * 4)) { st.sfxT = Math.floor(st.t * 4); G.Audio.sfx('cannon'); }
    if (b.side === 'me') { var I0 = IMP(); shake(I0.shakeFire); flash(I0.flashFire, '255,226,170'); }
    jolt(b, -Math.cos(sAng), -Math.sin(sAng), 2 + Math.min(3, shots * 0.4));             // 포를 쏜 반동으로 배가 반대쪽으로 밀린다
    st.fx.push({ kind: 'ring', x: b.x + Math.cos(sAng) * b.len * 0.22, y: b.y + Math.sin(sAng) * b.len * 0.22, t: 0, life: 0.55, r: b.len * 0.55 });   // 물 위에 퍼지는 충격파
    for (var i = 0; i < shots; i++) {
      var hit = U.chance(U.clamp(acc, 0.05, 0.95));
      var fwd = part >= 1 && sAng === b.heading ? b.len * 0.45 : 0;
      var ox = b.x + Math.cos(b.heading) * ((i - shots / 2) * (b.len / shots) * (fwd ? 0.1 : 0.8) + fwd), oy = b.y + Math.sin(b.heading) * ((i - shots / 2) * (b.len / shots) * (fwd ? 0.1 : 0.8) + fwd);
      var tx = t.x + U.rf(-18, 18) + (hit ? 0 : U.rf(-50, 50)), ty = t.y + U.rf(-18, 18) + (hit ? 0 : U.rf(-50, 50));
      st.balls.push({ x: ox, y: oy, tx: tx, ty: ty, t: 0, dur: 0.35 + d / 900 + i * 0.03, hit: hit, dmg: c.dmg * U.rf(0.6, 1.2) * (b.side === 'me' && R.hasItem('shells') ? 1.4 : 1) * (has(b, 'heavygun') ? 1.2 : 1), target: t, from: b });
      st.fx.push({ kind: 'smoke', x: ox + Math.cos(sAng) * 14, y: oy + Math.sin(sAng) * 14, vx: Math.cos(sAng) * 18, vy: Math.sin(sAng) * 18, t: 0, life: 2.4, r: 10 + U.rf(0, 8) });
      st.fx.push({ kind: 'muzzle', x: ox + Math.cos(sAng) * 10, y: oy + Math.sin(sAng) * 10, ang: sAng, t: 0, life: 0.2, s: U.rf(1.1, 1.5) });
      for (var sp3 = 0; sp3 < 3; sp3++) { var a3 = sAng + U.rf(-0.35, 0.35), v3 = U.rf(160, 280); st.fx.push({ kind: 'spark', x: ox + Math.cos(sAng) * 12, y: oy + Math.sin(sAng) * 12, vx: Math.cos(a3) * v3, vy: Math.sin(a3) * v3, t: 0, life: U.rf(0.15, 0.3) }); }
    }
  }
  function updateBalls(dt) {
    for (var i = st.balls.length - 1; i >= 0; i--) {
      var k = st.balls[i]; k.t += dt;
      if (k.t >= k.dur) {
        st.balls.splice(i, 1);
        if (k.hit && k.target.alive) {
          var t = k.target;
          var dmg = k.dmg * (1 - (k.target.side === 'me' ? R.fleetBonus('hp') : 0)) * 1.1 * armorK(t);
          t.hp -= dmg;
          var kill = Math.random() < 0.5 ? Math.ceil(dmg * 0.35 * (has(t, 'armor') ? 0.4 : has(t, 'raft') ? 1.5 : 1)) : 0; t.crew = Math.max(0, t.crew - kill);
          st.fx.push({ kind: 'hit', x: k.tx, y: k.ty, t: 0, life: 0.6 });
          hitBurst(k.tx, k.ty, k.tx - k.x, k.ty - k.y, dmg);
          dmgNumber(t, dmg, kill);
          // 타격감: 맞은 배가 번쩍이며 포탄 방향으로 밀리고, 잠깐 멈추고, 화면이 흔들린다
          var I1 = IMP(), mine = t.side === 'me', big = Math.min(1, dmg / Math.max(1, t.maxHp) * 8);
          t.hitT = I1.shipFlash; jolt(t, k.tx - k.x, k.ty - k.y, I1.recoil * (0.7 + big));
          hitstop((mine ? I1.hitstopTaken : I1.hitstop) * (1 + big * 0.8));
          shake((mine ? I1.shakeTaken : I1.shakeHit) * (0.7 + big * 0.6));
          flash(mine ? I1.flashTaken : I1.flashHit, mine ? '255,120,90' : '255,236,200');
          if (big > 0.7) zoomKick(I1.zoomHit);
          if (t.hp <= 0) hullBreak(t);
          else if (t.crew <= 0) { t.alive = false; t.captured = t.side === 'en'; t.drifting = true; log(t.name + '의 선원이 전멸했다.'); }
        } else { st.fx.push({ kind: 'splash', x: k.tx, y: k.ty, t: 0, life: 2.2, seed: Math.random() }); st.fx.push({ kind: 'ring', x: k.tx, y: k.ty, t: 0, life: 0.45, r: 22 }); }
      }
    }
  }
  /** 포탄·충파 피해 배수: 덮개 장갑·겹판자는 줄이고 꿰맨 선체는 키운다 */
  function armorK(t) { var k = 1; if (has(t, 'armor')) k *= t.t.armor || 0.6; if (has(t, 'layered')) k *= 0.8; if (has(t, 'sewn')) k *= 1.2; return k; }
  /** 선체가 버티지 못할 때: 수밀 격벽은 한 번 버티고, 뗏목은 가라앉지 않는다 */
  function hullBreak(t) {
    var tn = shipLabel(t);
    if (has(t, 'raft')) { t.hp = 1; if (!t.bulk) { t.bulk = true; log(tn + U.jx(tn, '은/는') + ' 부서졌지만 뗏목이라 가라앉지 않는다.'); } return; }
    if (has(t, 'bulkhead') && !t.bulk) { t.bulk = true; t.hp = Math.max(1, t.maxHp * 0.08); log(tn + '의 칸막이 선창이 물을 막았다! 가라앉지 않고 버틴다.'); return; }
    sinkShip(t);
  }
  function shipLabel(b) { return b.side === 'me' ? b.name + '호' : b.name; }
  function sinkShip(t) {
    t.alive = false; t.sunk = true; t.hp = 0;
    log(t.name + (t.side === 'me' ? '호가 침몰했다!' : U.j(t.name, '이/가').slice(t.name.length) + ' 침몰했다!'));
    if (G.Audio) G.Audio.sfx('splash');
    st.fx.push({ kind: 'bigsplash', x: t.x, y: t.y, t: 0, life: 6, seed: Math.random(), len: t.len });
    var I2 = IMP(); st.hsCool = 0; hitstop(I2.hitstopSink); shake(I2.shakeSink); flash(I2.flashSink, t.side === 'me' ? '255,110,80' : '255,240,210');
    st.fx.push({ kind: 'blast', x: t.x, y: t.y, t: 0, life: 0.5, r: t.len * 0.9 });
    hitBurst(t.x, t.y, U.rf(-1, 1), U.rf(-1, 1), 14); zoomKick(I2.zoomSink);
    st.fx.push({ kind: 'float', x: t.x, y: t.y - t.len * 0.5 - 118, text: t.side === 'me' ? '침몰' : '격침!', col: t.side === 'me' ? '255,120,100' : '255,222,120', size: 40, t: 0, life: 1.7 });   // 피해 숫자 위에
  }
  function log(t) { st.log.push(t); if (st.log.length > 6) st.log.shift(); UI.toast(t, 'cannon', 2600); }

  // ---------------------------------------------------------------- boarding & duel
  /** 백병전 시작: 두 배가 부딪친다 — 번쩍임·흔들림·넉백 */
  function clashFx(me, en, k) {
    var I = IMP(), mx = (me.x + en.x) / 2, my = (me.y + en.y) / 2;
    st.hsCool = 0; hitstop(I.hitstopRam * k); shake(I.shakeClash * k); flash(I.flashClash * k, '255,232,190');
    jolt(me, me.x - en.x, me.y - en.y, I.knock * 1.2 * k); jolt(en, en.x - me.x, en.y - me.y, I.knock * 1.2 * k);
    me.hitT = en.hitT = I.shipFlash;
    for (var i = 0; i < 3; i++) st.fx.push({ kind: 'clash', x: mx + U.rf(-14, 14), y: my + U.rf(-14, 14), t: 0, life: 0.4, seed: Math.random(), s: 1.3 });
  }
  /** 백병전 한 판: 더 많이 쓰러진 쪽이 밀려나고, 칼 부딪치는 불꽃과 쓰러진 선원 수가 뜬다 */
  async function meleeRound(me, en, lostMe, lostEn, n) {
    var I = IMP(), mx = (me.x + en.x) / 2, my = (me.y + en.y) / 2;
    var push = I.knock * (0.5 + Math.min(1, Math.abs(lostMe - lostEn) / Math.max(1, lostMe + lostEn)));
    if (lostMe > lostEn) { jolt(me, me.x - en.x, me.y - en.y, push); jolt(en, me.x - en.x, me.y - en.y, push * 0.35); }
    else if (lostEn > lostMe) { jolt(en, en.x - me.x, en.y - me.y, push); jolt(me, en.x - me.x, en.y - me.y, push * 0.35); }
    else { jolt(me, me.x - en.x, me.y - en.y, push * 0.5); jolt(en, en.x - me.x, en.y - me.y, push * 0.5); }
    shake(I.shakeRound); flash(I.flashRound, lostMe > lostEn ? '255,150,120' : '255,236,200');
    if (lostEn) en.hitT = I.shipFlash; if (lostMe) me.hitT = I.shipFlash;
    for (var i = 0; i < 2; i++) st.fx.push({ kind: 'clash', x: mx + U.rf(-20, 20), y: my + U.rf(-20, 20), t: 0, life: 0.34, seed: Math.random(), s: 1 });
    // 쓰러진 선원 수: 배 이름표 위로 떠오른다
    if (lostEn) st.fx.push({ kind: 'float', x: en.x + U.rf(-8, 8), y: en.y - en.len * 0.5 - 44, text: '−' + lostEn, col: '255,214,150', t: 0, life: 0.9 });
    if (lostMe) st.fx.push({ kind: 'float', x: me.x + U.rf(-8, 8), y: me.y - me.len * 0.5 - 44, text: '−' + lostMe, col: '255,130,110', t: 0, life: 0.9 });
    if (G.Audio && n % 2) G.Audio.sfx('sword');
    await U.sleep(I.roundDelay * 1000);
  }
  /** 백병전이 끝나고 갈고리를 풀면 두 배가 튕겨 떨어진다 (실제 속력) */
  function pushApart(me, en, v) {
    var dx = me.x - en.x, dy = me.y - en.y, d = Math.hypot(dx, dy) || 1;
    [[me, 1], [en, -1]].forEach(function (pr) { var b = pr[0]; if (!b.vel) b.vel = [0, 0]; b.vel[0] += dx / d * v * pr[1]; b.vel[1] += dy / d * v * pr[1]; });
    jolt(me, dx, dy, IMP().knock); jolt(en, -dx, -dy, IMP().knock);
  }
  function boardNearest() {
    var fs = flagship(); if (!fs || st.over) return;
    var best = null, bd = 1e9;
    st.ships.forEach(function (o) {
      if (!o.alive || o.side !== 'en') return;
      st.ships.forEach(function (m) { if (!m.alive || m.side !== 'me') return; var d = Math.hypot(o.x - m.x, o.y - m.y); if (d < boardRange(m) + 25 && d < bd) { bd = d; best = [m, o]; } });
    });
    if (!best) { UI.toast('백병전을 하려면 적함에 바짝 붙어야 합니다. (적함을 클릭해 추격)', 'sword'); if (fs && st.ships.some(function (o) { return o.alive && o.side === 'en'; })) { var tg = fs.target || st.ships.filter(function (o) { return o.alive && o.side === 'en'; })[0]; fs.target = tg; fs.boardIntent = true; fs.steer = null; fs.halt = false; } return; }
    boarding(best[1], best[0], false);
  }
  async function boarding(enemy, mine, enemyStarted) {
    if (st.busy) return;
    st.busy++;
    var s = S();
    var me = enemyStarted ? enemy : mine, en = enemyStarted ? mine : enemy; // me = player's ship
    if (me.side !== 'me') { var tmp = me; me = en; en = tmp; }
    // 쇠못 지붕: 적이 올라타지 못한다
    if (enemyStarted && has(me, 'spikes')) {
      var hurt = Math.max(1, Math.round(en.crew * U.rf(0.12, 0.2)));
      en.crew = Math.max(0, en.crew - hurt);
      await UI.say('적이 ' + me.name + '호에 뛰어들었지만 지붕의 쇠못에 찔려 나뒹군다! (적 ' + hurt + '명 쓰러짐)', G.Scenes.mateSpeaker('first'));
      if (en.crew <= 0) { en.alive = false; en.captured = true; en.drifting = true; }
      st.busy--; checkEnd(); return;
    }
    if (!enemyStarted && has(en, 'spikes')) {
      var hurt2 = Math.max(1, Math.round(me.crew * U.rf(0.08, 0.14)));
      me.crew = Math.max(1, me.crew - hurt2);
      await UI.say(en.name + '의 지붕에 쇠못이 빽빽하다! 뛰어든 선원 ' + hurt2 + '명이 다쳐 물러났다. 저 배는 포로 부숴야 한다.', G.Scenes.mateSpeaker('first'));
      st.busy--; checkEnd(); return;
    }
    clashFx(me, en, 1);
    await UI.say(enemyStarted ? '적이 우리 배에 갈고리를 걸었다! 백병전이다!' : '갈고리를 걸어라! 적선에 뛰어든다!', G.Scenes.mateSpeaker('first'));
    // captain duel between flagships
    if (me.flag && en.flag && st.npc.kind !== 'merchant' && !st.dueled) {
      var px = G.Games.proxy(), pd = px && G.MATE[px.id];
      var v = await UI.ask('적의 두목이 나섰다. "제독끼리 승부를 내자!"', [{ label: '일기토를 받는다', value: 1 }].concat(pd ? [{ label: '부관 ' + pd.name + '에게 맡긴다', value: 2 }] : []).concat([{ label: '병사끼리 싸운다', value: 0 }]), {});
      if (v) {
        st.dueled = true;
        if (v === 2) await UI.say(U.pick(['제독께서 나서실 것까지 없습니다. 제가 상대하겠습니다!', '저런 녀석은 제게 맡기십시오.', '제독의 칼을 더럽힐 것 없습니다. 제가 나가지요.']), G.Scenes.mateSpeaker('first'));
        var boss = { name: st.npc.kind === 'pirate' ? '해적 두목' : '적 함장', look: st.npc.kind === 'pirate' ? 'pirate' : 'captain', portrait: A.withImg(A.npcSpec('boss' + st.t, st.npc.kind === 'pirate' ? 'sailor' : 'soldier', 'ib'), G.Img.chain.npc(st.npc.kind === 'pirate' ? 'pirate' : 'captain', G.Game.state && G.CITY_DATA[G.Game.state.player.city])), str: U.ri(55, 80), atk: U.ri(6, 12), def: U.ri(2, 6), skill: U.ri(0, 1), mar: U.ri(55, 78), int: U.ri(30, 60), cha: U.ri(30, 55) };
        var res = await G.Games.duel(boss, v === 2 ? { mate: px, place: 'deck' } : { place: 'deck' });
        var ld = G.Games.lastDuel || {}, fm = ld.mate, fd = fm && G.MATE[fm.id];
        if (res === 'win') {
          var how = ld.how, lead = fd ? fd.name + U.jx(fd.name, '이/가') + ' ' : '';
          if (fm) { fm.loyal = Math.min(100, (fm.loyal || 70) + 8); S().player.fame += 5; UI.toast(fd.name + '의 충성이 올랐다. (명성 +5)', 'sword', 3500); }
          if (how === 'capture') { var ransomG = U.ri(600, 1400); S().player.gold += ransomG; S().player.fame += 8; await UI.say(lead + '두목을 사로잡자 적의 전의가 꺾였다! 적 함대가 항복했다! (두목의 몸값 금화 ' + U.num(ransomG) + '닢, 명성 +8)', {}); }
          else if (how === 'persuade') { S().player.fame += 6; await UI.say(lead + '두목을 설득하자 두목이 칼을 거두었다. 적 함대가 피를 더 흘리지 않고 항복했다! (명성 +6)', {}); }
          else if (how === 'rout') await UI.say(lead + '호통에 두목이 달아나자 적이 우왕좌왕하다 항복했다!', {});
          else await UI.say(lead + '두목을 쓰러뜨리자 적의 전의가 꺾였다! 적 함대가 항복했다!', {});
          if (ld.secret) { S().player.notoriety += 2; UI.toast('비밀무기를 쓴 일로 뒷말이 돈다. (악명 +2)', 'skull', 3500); }
          st.ships.forEach(function (o) { if (o.side === 'en' && o.alive) { o.alive = false; o.captured = true; } });
          st.busy--; checkEnd(); return;
        }
        if (res === 'lose') {
          if (fm) { fm.hurt = S().day + 30; me.crew = Math.max(0, Math.round(me.crew * 0.88)); await UI.say(fd.name + U.jx(fd.name, '이/가') + ' 쓰러졌다! 부하들이 끌어내 물러선다... (30일 동안 다쳐 능력이 절반이 된다)', {}); }
          else { me.crew = Math.max(0, Math.round(me.crew * 0.8)); await UI.say('제독이 쓰러졌다! 부하들의 사기가 떨어진다...', {}); }
        }
      }
    }
    // melee resolution
    // 백병전은 그 배를 지휘하는 사람의 검술과 공격력 (갑판장뿐이면 ×0.9)
    var sword = R.shipSkill(me.src, 'sword'), atk = R.shipAtk(me.src), capK = R.captain(me.src) ? 1 : 0.9;
    // 높은 갑판은 공격·방어 모두 유리하고, 접현 돌격은 먼저 건 쪽의 첫 공격이 세다
    var myK = (has(me, 'highdeck') ? 1.2 : 1) * (!enemyStarted && has(me, 'grapple') ? 1.15 : 1);
    var enK = (has(en, 'highdeck') ? 1.2 : 1) * (enemyStarted && has(en, 'grapple') ? 1.15 : 1);
    var myPow = me.crew * (1 + sword * 0.18 + atk / 60) * (0.7 + S().fleet.discipline / 300) * myK * capK;
    var enSk = (st.npc.kind === 'pirate' ? 1.25 : st.npc.kind === 'navy' ? 1.15 : 0.8) * enK;
    var enPow = en.crew * enSk;
    var rounds = 0;
    while (me.crew > 0 && en.crew > 0 && rounds < 12) {
      rounds++;
      var a = Math.ceil(enPow * U.rf(0.08, 0.16)), b = Math.ceil(myPow * U.rf(0.08, 0.16));
      var lostMe = Math.min(a, me.crew), lostEn = Math.min(b, en.crew);
      me.crew = Math.max(0, me.crew - lostMe); en.crew = Math.max(0, en.crew - lostEn);
      myPow = me.crew * (1 + sword * 0.18 + atk / 60) * (0.7 + S().fleet.discipline / 300) * myK * capK; enPow = en.crew * enSk;
      if (en.crew < en.crew0 * 0.15) { lostEn += en.crew; en.crew = 0; }
      await meleeRound(me, en, lostMe, lostEn, rounds);          // 한 판마다: 칼 부딪치는 불꽃·밀려남·쓰러진 수
      if (me.crew < me.crew0 * 0.1) break;
    }
    if (G.Audio) G.Audio.sfx('sword');
    var I4 = IMP();
    if (en.crew <= 0 || me.crew <= 0 || me.crew < me.crew0 * 0.1) {
      st.hsCool = 0; hitstop(I4.hitstopSink); shake(I4.shakeSink * 0.8); flash(I4.flashSink * 0.8, en.crew <= 0 ? '255,240,200' : '255,110,80'); zoomKick(I4.zoomSink * 0.8);
      var lb = en.crew <= 0 ? en : me;
      st.fx.push({ kind: 'float', x: lb.x, y: lb.y - lb.len * 0.5 - 118, text: en.crew <= 0 ? '나포!' : '빼앗김', col: en.crew <= 0 ? '255,222,120' : '255,120,100', size: 40, t: 0, life: 1.7 });
    }
    else pushApart(me, en, I4.knockApart);                        // 양쪽 모두 버티면 두 배가 튕겨 떨어진다
    if (en.crew <= 0) {
      en.alive = false; en.captured = true;
      await UI.say(en.name + U.j(en.name, '을/를').slice(en.name.length) + ' 점령했다! (아군 선원 ' + me.crew + '명 남음)', {});
    } else if (me.crew <= 0 || me.crew < me.crew0 * 0.1) {
      me.alive = false; me.lostBoard = true;
      await UI.say(me.name + '호가 적에게 넘어갔다...', {});
    } else await UI.say('양쪽 모두 큰 피해를 입고 물러섰다.', {});
    st.busy--;
    checkEnd();
  }

  // ---------------------------------------------------------------- end of battle
  function checkEnd() {
    if (st.over) return;
    var mine = st.ships.filter(function (b) { return b.side === 'me' && b.alive; });
    var foes = st.ships.filter(function (b) { return b.side === 'en' && b.alive; });
    var ef = st.enFlag, mf = st.myFlag;
    // 적 기함을 무찔렀다: 남은 적은 싸울 뜻을 잃고 흩어져 달아난다 → 승리
    if (ef && !ef.alive && (ef.sunk || ef.captured) && foes.length) {
      foes.forEach(function (b) { b.alive = false; b.fled = true; b.routed = true; });
      st.over = true; st.flagWin = true;
      log('적 기함 ' + ef.name + U.jx(ef.name, '이/가') + ' ' + (ef.captured ? '나포되었다' : '가라앉았다') + '! 남은 적이 흩어져 달아난다.');
      UI.toast('적 기함을 무찔렀다! 남은 적 ' + foes.length + '척이 흩어져 달아난다.', 'flag', 4200);
      finish('win'); return;
    }
    // 적 기함이 달아났다: 따르던 배도 모두 물러난다
    if (ef && ef.fled && !ef.routed && foes.length) {
      foes.forEach(function (b) { b.alive = false; b.fled = true; b.routed = true; });
      st.over = true; log('적 기함이 달아나자 남은 적도 모두 물러났다.');
      finish(st.ships.some(function (b) { return b.side === 'en' && (b.sunk || b.captured); }) ? 'win' : 'escaped-enemy'); return;
    }
    // 우리 기함을 잃었다 (가라앉거나 빼앗김): 남은 배는 흩어져 달아난다 → 패배
    if (mf && !mf.alive && !mf.fled && mine.length) {
      mine.forEach(function (b) { b.alive = false; b.fled = true; b.routed = true; });
      st.over = true; st.flagLost = true;
      log('기함 ' + mf.name + '호를 잃었다! 남은 배가 흩어져 달아난다.');
      finish('flaglost'); return;
    }
    // 우리 기함이 전장을 벗어났다: 함대 전체가 물러난다
    if (mf && mf.fled && !mf.routed && mine.length) {
      mine.forEach(function (b) { b.alive = false; b.fled = true; b.routed = true; });
      st.over = true; finish('retreat'); return;
    }
    if (!foes.length) { st.over = true; finish(st.ships.some(function (b) { return b.side === 'en' && (b.sunk || b.captured); }) ? 'win' : 'escaped-enemy'); }
    else if (!mine.length) { st.over = true; var anyFled = st.ships.some(function (b) { return b.side === 'me' && b.fled; }); finish(anyFled ? 'retreat' : 'lose'); }
  }
  async function finish(res) {
    var s = S(), f = s.fleet;
    await U.sleep(900);
    // apply damage & crew back to state
    var survivors = [];
    st.ships.forEach(function (b) {
      if (b.side !== 'me') return;
      if (b.sunk || b.lostBoard) { var i = f.ships.indexOf(b.src); if (i >= 0) f.ships.splice(i, 1); return; }
      b.src.hp = Math.max(1, b.hp); survivors.push(b);
    });
    f.crew = U.sum(survivors, function (b) { return b.crew; });
    var lines = [];
    if (res === 'win') {
      s.stats.wins++;
      var gold = 0, caps = [];
      st.ships.forEach(function (b) {
        if (b.side !== 'en') return;
        if (b.sunk || b.captured) gold += Math.round((st.npc.kind === 'merchant' ? 1400 : st.npc.kind === 'pirate' ? ((G.BALANCE && G.BALANCE.pirateLoot) || 900) : 700) * U.rf(0.6, 1.4) * (G.SHIP[b.type].cap / 200));
        if (b.captured) caps.push(b);
      });
      s.player.gold += gold;
      var fame = st.npc.kind === 'pirate' ? 25 * Math.max(1, st.ships.filter(function (b) { return b.side === 'en' && (b.sunk || b.captured); }).length) : 10;   // 달아난 배는 치지 않는다
      s.player.fame += fame; if (st.npc.kind !== 'pirate') s.player.notoriety += 5;
      s.stats.sunk += st.ships.filter(function (b) { return b.side === 'en' && b.sunk; }).length;
      // 조합의 해적 퇴치 의뢰
      if (st.npc.kind === 'pirate' && G.Quest) {
        var beaten = st.ships.filter(function (b) { return b.side === 'en' && (b.sunk || b.captured); }).length;
        if (beaten) G.Quest.onPirateBeaten(beaten);
      }
      if (st.flagWin) { s.player.fame += 10; fame += 10; }
      lines.push((st.flagWin ? '적 기함을 무찔러 이겼다! ' : '승리했다! ') + '전리품으로 금화 ' + U.num(gold) + '닢을 얻었다. (명성 +' + fame + ')' + (st.flagWin ? '<br><span class="muted">남은 적 배는 흩어져 달아났다.</span>' : ''));
      G.State.log((st.npc.kind === 'pirate' ? '해적' : st.npc.kind === 'navy' ? '함대' : '상선단') + '과의 해전에서 승리했다.');
      if (G.Audio) G.Audio.sfx('coin');
      await UI.alert(lines.join('<br>'), '해전 승리');
      for (var i = 0; i < caps.length; i++) await prize(caps[i]);
    } else if (res === 'flaglost') {
      // 기함을 잃고 흩어져 달아났다: 쫓기며 짐 절반을 버렸다
      var lostK = 0;
      Object.keys(f.cargo).forEach(function (k) { var c = f.cargo[k], d = Math.ceil(c.q / 2); c.q -= d; lostK += d; if (c.q <= 0) delete f.cargo[k]; });
      await UI.alert((st.myFlag ? '기함 ' + st.myFlag.name + '호를 잃었다! ' : '') + '지휘를 잃은 함대가 흩어져 달아났다...' + (lostK ? '<br>쫓기는 동안 짐 ' + lostK + '통을 바다에 버렸다.' : '') + (f.ships.length ? '<br><span class="muted">새 기함: ' + U.esc(f.ships[0].name) + '호</span>' : ''), '패배 — 기함 상실');
      if (!f.ships.length) { await ransom(); }
    } else if (res === 'escaped-enemy') {
      await UI.alert('적이 모두 달아났다.', '해전 종료');
    } else if (res === 'retreat') {
      await UI.alert('간신히 전장을 벗어났다.', '퇴각');
    } else {
      // defeat
      if (!f.ships.length) {
        await UI.alert('모든 배를 잃고 말았다... 제독은 포로가 되었다.', '패배');
        await ransom();
      } else {
        var lostG = Math.floor(s.player.gold * 0.4); s.player.gold -= lostG;
        f.cargo = {};
        await UI.alert('패배했다... 짐을 모두 빼앗기고 금화 ' + U.num(lostG) + '닢을 약탈당했다.', '패배');
      }
    }
    if (f.crew <= 0 && f.ships.length) f.crew = Math.max(3, Math.round(R.crewMin() * 0.3));
    G.Scenes.city.B.harbor.trimCrew && G.Scenes.city.B.harbor.trimCrew();
    if (G.Game.scene !== B) return;
    if (!f.ships.length) return;
    UI.fade(function () { G.Game.go('sea', { resume: true }); });
  }
  async function prize(b) {
    var s = S(), f = s.fleet, t = G.SHIP[b.type];
    var sh = R.newShip(b.type, b.name.replace(/ \d+호$/, '') === b.name ? b.name : U.pick(G.SHIP_NAMES));
    sh.hp = Math.max(1, Math.round(b.hp > 0 ? b.hp : t.hp * 0.3)); sh.guns = { type: b.guns.type, n: Math.min(b.guns.n, sh.ports) };
    var val = R.shipValue(sh);
    var sale = Math.round(val * ((G.BALANCE && G.BALANCE.prizeSale) || 0.6));
    var opts = [{ label: '함대에 편입한다', value: 'keep', dis: f.ships.length >= G.MAX_SHIPS }, { label: '팔아 치운다 (금화 ' + U.num(sale) + '닢)', value: 'sell' }, { label: '가라앉힌다', value: 'sink' }];
    var v = await UI.ask('나포한 ' + t.name + U.j(t.name, '을/를').slice(t.name.length) + ' 어떻게 할까요? (내구 ' + Math.round(sh.hp) + '/' + sh.maxHp + ')', opts, G.Scenes.mateSpeaker('first'));
    if (v === 'keep' && f.ships.length < G.MAX_SHIPS) { f.ships.push(sh); s.stats.captured++; UI.toast(sh.name + '호를 함대에 편입했다.', 'ship'); }
    else if (v === 'sell' || v === 'keep') { s.player.gold += sale; }
  }
  async function ransom() {
    var s = S(), p = s.player;
    var fee = Math.floor((p.gold + p.bank) * 0.5);
    var fromGold = Math.min(p.gold, fee);                   // 모자라는 만큼만 금고에서 (예전에는 금고에서 몸값을 한 번 더 냈다)
    p.gold -= fromGold; p.bank = Math.max(0, (p.bank || 0) - (fee - fromGold));
    var home = G.CITY_DATA[p.home];
    await UI.say('몸값을 치르고 풀려났다. 몇 달 뒤, 겨우 고향 ' + home.name + '에 돌아왔다...', {});
    G.Game.passDays(90);
    var sh = R.newShip('caravel', U.pick(G.SHIP_NAMES)); sh.guns = { type: 'saker', n: 2 };
    s.fleet = { ships: [sh], crew: 12, food: 10, water: 10, cargo: {}, fatigue: 0, discipline: 60, daysOut: 0, sick: 0, scurvy: 0, rats: 0 };
    p.fame = Math.max(0, p.fame - 100);
    UI.fade(function () { G.Game.go('city', { cityId: p.home }); });
  }

  // ---------------------------------------------------------------- 물보라 (포탄이 떨어진 자리, 가라앉는 배)
  /* 해전의 배 움직임·물보라 조정값: accel/decel = 속력이 붙고 줄어드는 시간(초), lateral = 옆 미끄러짐이 줄어드는 시간(초),
     day = 물보라의 '하루'(초) — 바다 장면의 항적·물보라 수치를 그대로 쓰기 위한 시간 환산, ref = 물보라 세기 기준 속력(px/하루) */
  var BFX = (G.FX && G.FX.battle) || { accel: 1.6, decel: 2.4, lateral: 0.45, day: 3.0, ref: 105, wakeLife: 2.2, wakeSpacing: 5 };
  function rs(f, i) { return ((f.seed * 9301 + i * 49297) % 233280) / 233280; }
  /** 포탄이 물에 떨어진 자리: 퍼지는 고리와 옅어지는 거품 자국 (배 아래에) */
  function splashUnder(ctx, p, f, u) {
    var a = 1 - u;
    ctx.fillStyle = 'rgba(226,238,242,' + (0.28 * a * a).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(p[0], p[1], 5 + u * 18, 3.5 + u * 13, f.seed * 3, 0, 6.2832); ctx.fill();
    for (var i = 0; i < 5; i++) { var r0 = rs(f, i), ang = r0 * 6.2832, d = (4 + u * 16) * (0.3 + rs(f, i + 7)); ctx.fillStyle = 'rgba(240,248,250,' + (0.35 * a).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(p[0] + Math.cos(ang) * d, p[1] + Math.sin(ang) * d * 0.75, 1 + rs(f, i + 3) * 2.2, 0, 6.2832); ctx.fill(); }
    if (f.t < 1.2) { var ru = f.t / 1.2; ctx.strokeStyle = 'rgba(236,246,250,' + (0.55 * (1 - ru)).toFixed(3) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p[0], p[1], 4 + ru * 28, 3 + ru * 20, 0, 0, 6.2832); ctx.stroke(); }
  }
  /** 물기둥: 솟았다가 떨어지는 물방울 (배 위에 그린다) */
  function splashColumn(ctx, p, f) {
    var T = 0.9; if (f.t > T) return;
    var u = f.t / T, H = 34 * Math.sin(Math.PI * Math.min(1, u * 1.1));
    for (var i = 0; i < 11; i++) {
      var r0 = rs(f, i), r1 = rs(f, i + 11), sx = (r0 - 0.5) * (4 + u * 22), top = H * (0.45 + 0.55 * r1);
      var y = p[1] - top * Math.max(0, 1 - Math.pow(u * 1.25 - r1 * 0.2, 2) * 0.8);
      ctx.fillStyle = 'rgba(244,250,252,' + (0.85 * (1 - u)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(p[0] + sx, y, 1.2 + r1 * 2.2 * (1 - u * 0.5), 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = 'rgba(244,250,252,' + (0.5 * (1 - u)).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(p[0], p[1] - H * 0.4, 3 + u * 3, H * 0.5 + 1, 0, 0, 6.2832); ctx.fill();
  }
  /** 가라앉는 배: 거품이 넓게 번지고 소용돌이가 돌며 잔해 조각이 떠돈다 */
  function sinkFoam(ctx, p, f, u) {
    var a = 1 - u, R0 = (f.len || 100) * 0.5;
    ctx.fillStyle = 'rgba(214,230,236,' + (0.30 * a).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(p[0], p[1], R0 * (0.7 + u * 0.9), R0 * (0.45 + u * 0.7), f.seed * 2, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(236,246,250,' + (0.45 * a).toFixed(3) + ')'; ctx.lineWidth = 1.6;
    for (var k = 0; k < 3; k++) { var r = R0 * (0.25 + k * 0.22) * (1 + u * 0.6), a0 = f.t * (1.2 - k * 0.3) + k * 2; ctx.beginPath(); ctx.arc(p[0], p[1], r, a0, a0 + 2.2); ctx.stroke(); }
    for (var i = 0; i < 14; i++) {
      var ang = rs(f, i) * 6.2832 + f.t * 0.15, d = R0 * (0.2 + rs(f, i + 20) * (0.8 + u)), bx = p[0] + Math.cos(ang) * d, by = p[1] + Math.sin(ang) * d * 0.8;
      if (i < 6) { ctx.fillStyle = 'rgba(92,64,38,' + (0.8 * a).toFixed(3) + ')'; ctx.save(); ctx.translate(bx, by); ctx.rotate(rs(f, i + 40) * 3); ctx.fillRect(-4 - rs(f, i) * 5, -1.2, 8 + rs(f, i) * 10, 2.4); ctx.restore(); }
      else { ctx.fillStyle = 'rgba(244,250,252,' + (0.5 * a * (0.5 + 0.5 * Math.sin(f.t * 4 + i))).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(bx, by, 1.2 + rs(f, i) * 2, 0, 6.2832); ctx.fill(); }
    }
    if (f.t < 1.5) { var ru = f.t / 1.5; ctx.strokeStyle = 'rgba(240,248,250,' + (0.6 * (1 - ru)).toFixed(3) + ')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(p[0], p[1], R0 * (0.6 + ru * 1.6), R0 * (0.45 + ru * 1.2), 0, 0, 6.2832); ctx.stroke(); }
  }

  // ---------------------------------------------------------------- rendering
  var IMPACT_KINDS = { muzzle: 1, blast: 1, clash: 1, float: 1, fireball: 1, debris: 1, spark: 1, dsmoke: 1, dmg: 1 };   // 배 위에 그리는 것 (ring은 배 아래)
  /** 불타는 배: 갑판 몇 곳에서 불길이 일렁인다 */
  function burnGlow(ctx, b, p) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var hr = b.hp / b.maxHp, n = hr < IMP().fireAt * 0.5 ? 3 : 2;
    for (var i = 0; i < n; i++) {
      var off = (i - (n - 1) / 2) * b.len * 0.28 + Math.sin(i * 7.1) * 6, fl = 0.65 + 0.35 * Math.sin(st.t * (11 + i * 3) + i * 2) * Math.sin(st.t * 7.3 + i);
      var fx = p[0] + Math.cos(b.heading) * off, fy = p[1] + Math.sin(b.heading) * off, R0 = (7 + (1 - hr) * 8) * fl;
      var g = ctx.createRadialGradient(fx, fy - 3, 0, fx, fy - 3, R0 * 1.8);
      g.addColorStop(0, 'rgba(255,240,170,' + (0.85 * fl).toFixed(3) + ')'); g.addColorStop(0.35, 'rgba(255,150,40,' + (0.6 * fl).toFixed(3) + ')'); g.addColorStop(1, 'rgba(200,40,10,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy - 3, R0 * 1.8, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  /** 번쩍이는 효과: 포구 화염 · 맞은 자리의 섬광·불덩이·나뭇조각·불티·검은 연기·충격파 · 칼 부딪치는 불꽃 · 피해 숫자 */
  function impactFx(ctx, f, a) {
    var q = toScreen(f.x, f.y), u = f.t / f.life;
    if (f.kind === 'dsmoke') {        // 검은 연기 (위로 퍼지며 바람에 밀린다)
      var ps = toScreen(f.x + f.vx * f.t, f.y + f.vy * f.t), rr = f.r + f.t * 18, al = (f.thin ? 0.42 : 0.66) * Math.min(1, f.t * 6) * (1 - u);
      ctx.save(); ctx.globalCompositeOperation = 'source-over';
      // 짙은 바다 위에서도 보이게 잿빛 테두리에 검은 속 (위에서 내려다본 연기 기둥)
      var gs = ctx.createRadialGradient(ps[0], ps[1] - f.t * 6, rr * 0.15, ps[0], ps[1] - f.t * 6, rr);
      gs.addColorStop(0, 'rgba(40,36,34,' + al.toFixed(3) + ')'); gs.addColorStop(0.6, 'rgba(96,90,84,' + (al * 0.85).toFixed(3) + ')'); gs.addColorStop(1, 'rgba(120,114,108,0)');
      ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(ps[0], ps[1] - f.t * 6, rr, 0, 7); ctx.fill();
      ctx.restore();
      return;
    }
    if (f.kind === 'ring') {          // 물 위에 퍼지는 충격파 고리
      ctx.save(); ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(236,246,250,' + (0.6 * (1 - u)).toFixed(3) + ')'; ctx.lineWidth = 2.2 * (1 - u) + 0.6;
      ctx.beginPath(); ctx.ellipse(q[0], q[1], f.r * (0.3 + u), f.r * (0.22 + u * 0.75), 0, 0, 7); ctx.stroke();
      ctx.restore();
      return;
    }
    if (f.kind === 'debris') {        // 나뭇조각: 튀어 올랐다가 물에 떨어진다
      var dr = 2.4, k1 = (1 - Math.exp(-f.t * dr)) / dr, hh = Math.max(0, f.h * f.t - 180 * f.t * f.t);
      var pd = toScreen(f.x + f.vx * k1, f.y + f.vy * k1);
      ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.translate(pd[0], pd[1] - hh); ctx.rotate(f.rot + f.vr * f.t);
      ctx.fillStyle = f.dark ? 'rgba(60,40,24,' + Math.min(1, a * 1.6).toFixed(3) + ')' : 'rgba(150,108,64,' + Math.min(1, a * 1.6).toFixed(3) + ')';
      ctx.fillRect(-f.w / 2, -1.3, f.w, 2.6); ctx.restore();
      return;
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (f.kind === 'spark') {         // 불티: 짧은 빛줄기
      var k2 = (1 - Math.exp(-f.t * 5)) / 5, sp = toScreen(f.x + f.vx * k2, f.y + f.vy * k2), sl = Math.exp(-f.t * 5) * 0.035;
      ctx.strokeStyle = 'rgba(255,' + Math.round(200 + 55 * a) + ',' + Math.round(90 + 120 * a) + ',' + a.toFixed(3) + ')'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(sp[0], sp[1]); ctx.lineTo(sp[0] - f.vx * sl, sp[1] - f.vy * sl); ctx.stroke();
    } else if (f.kind === 'fireball') {   // 불덩이: 하얗게 터졌다가 붉게 식는다
      var R1 = f.r * (0.55 + u * 0.9), aa = Math.pow(1 - u, 1.4);
      var gf = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], R1);
      gf.addColorStop(0, 'rgba(255,255,230,' + aa.toFixed(3) + ')'); gf.addColorStop(0.3, 'rgba(255,196,90,' + (aa * 0.95).toFixed(3) + ')'); gf.addColorStop(0.7, 'rgba(230,80,20,' + (aa * 0.6).toFixed(3) + ')'); gf.addColorStop(1, 'rgba(120,20,0,0)');
      ctx.fillStyle = gf; ctx.beginPath(); ctx.arc(q[0], q[1], R1, 0, 7); ctx.fill();
    } else if (f.kind === 'dmg') {        // 피해 숫자 (배를 따라 떠오르고, 새 포탄이 더해지면 다시 튄다)
      ctx.globalCompositeOperation = 'source-over';
      var sh = f.ship; if (sh && sh.alive) { f.x = sh.x + (sh.jx || 0); f.y = sh.y + (sh.jy || 0); f.len = sh.len; }
      var base = toScreen(f.x + f.dx, f.y), ux2 = Math.min(1, f.t / f.life), fade = ux2 < 0.7 ? 1 : 1 - (ux2 - 0.7) / 0.3;
      var pop = 1 + 0.55 * Math.max(0, 1 - (f.t - (f.popT || 0)) / 0.16);
      var mineS = sh && sh.side === 'me', col = mineS ? '255,110,90' : f.big ? '255,246,200' : '255,214,110';
      var size = Math.round((24 + Math.min(20, f.val * 0.9)) * pop), yy = base[1] - (f.len || 90) * 0.5 - 64 - ux2 * 30;   // 배 이름표(위 24px) 위로
      ctx.font = '800 ' + size + 'px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      var txt = '−' + Math.max(1, Math.round(f.val));
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(24,12,4,' + (0.85 * fade).toFixed(3) + ')'; ctx.strokeText(txt, base[0], yy);
      ctx.fillStyle = 'rgba(' + col + ',' + fade.toFixed(3) + ')'; ctx.fillText(txt, base[0], yy);
      if (f.big) { ctx.font = '700 15px ' + getComputedStyle(document.body).fontFamily; ctx.lineWidth = 3; ctx.strokeText('강타', base[0], yy - size * 0.8); ctx.fillText('강타', base[0], yy - size * 0.8); }
      if (f.crew > 0) {
        ctx.font = '700 15px ' + getComputedStyle(document.body).fontFamily; var ct = '선원 −' + f.crew;
        ctx.lineWidth = 3; ctx.strokeText(ct, base[0], yy + 17); ctx.fillStyle = 'rgba(240,228,205,' + fade.toFixed(3) + ')'; ctx.fillText(ct, base[0], yy + 17);
      }
    } else if (f.kind === 'muzzle') {
      var L = 36 * f.s * (0.6 + u * 0.8), c = Math.cos(f.ang), sn = Math.sin(f.ang);
      var g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], L * 1.5);
      g.addColorStop(0, 'rgba(255,252,230,' + a + ')'); g.addColorStop(0.25, 'rgba(255,214,110,' + a + ')'); g.addColorStop(0.6, 'rgba(255,130,40,' + a * 0.7 + ')'); g.addColorStop(1, 'rgba(200,60,10,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(q[0] - sn * 6, q[1] + c * 6); ctx.lineTo(q[0] + c * L * 1.5, q[1] + sn * L * 1.5); ctx.lineTo(q[0] + sn * 6, q[1] - c * 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(q[0], q[1], L * 0.45, 0, 7); ctx.fill();
    } else if (f.kind === 'blast') {
      var R0 = f.r * (0.4 + u * 0.9), g2 = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], R0);
      g2.addColorStop(0, 'rgba(255,255,235,' + a + ')'); g2.addColorStop(0.35, 'rgba(255,200,110,' + a * 0.85 + ')'); g2.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(q[0], q[1], R0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,200,' + a * 0.7 + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], f.r * (0.5 + u * 1.4), 0, 7); ctx.stroke();   // 퍼지는 충격파 고리
    } else if (f.kind === 'clash') {
      var rnd = U.makeRng(Math.floor(f.seed * 1e6)), n = 9;
      ctx.strokeStyle = 'rgba(255,245,210,' + a + ')'; ctx.lineWidth = 2;
      for (var i = 0; i < n; i++) { var an = rnd() * 6.283, r1 = (4 + u * 26) * f.s, r2 = r1 + (6 + rnd() * 10) * (1 - u) * f.s; ctx.beginPath(); ctx.moveTo(q[0] + Math.cos(an) * r1, q[1] + Math.sin(an) * r1); ctx.lineTo(q[0] + Math.cos(an) * r2, q[1] + Math.sin(an) * r2); ctx.stroke(); }
      var g3 = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 16 * f.s); g3.addColorStop(0, 'rgba(255,255,240,' + a * 0.9 + ')'); g3.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g3; ctx.beginPath(); ctx.arc(q[0], q[1], 16 * f.s, 0, 7); ctx.fill();
    } else if (f.kind === 'float') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = '700 ' + (f.size || 26) + 'px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center';
      var yy = q[1] - u * 30; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,12,6,' + a * 0.8 + ')'; ctx.strokeText(f.text, q[0], yy);
      ctx.fillStyle = 'rgba(' + f.col + ',' + a + ')'; ctx.fillText(f.text, q[0], yy);
    }
    ctx.restore();
  }
  /** 화면 흔들림은 카메라를 잠깐 옮겨 그리는 것으로 (바다·배·효과가 함께 흔들린다), 번쩍임은 맨 위에 한 겹 */
  function render() {
    var sx = 0, sy = 0;
    if (st.shake) { sx = st.shake * (Math.sin(st.t * 71) * 0.6 + Math.sin(st.t * 131 + 1.7) * 0.4); sy = st.shake * (Math.cos(st.t * 83) * 0.6 + Math.sin(st.t * 149 + 0.3) * 0.4); }
    var cx0 = st.cx, cy0 = st.cy;
    st.cx -= sx / SCALE; st.cy -= sy / SCALE;
    try { renderScene(); } finally { st.cx = cx0; st.cy = cy0; }
    if (st.flash) {
      var cv = G.Game.canvases().overlay, ctx = cv.getContext('2d');
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(' + st.flash.c + ',' + Math.min(0.6, st.flash.a).toFixed(3) + ')'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.restore();
    }
  }
  function renderScene() {
    var s = S(), r = G.Game.renderer;
    var zk = 1 + (st.zoomK || 0);             // 큰 명중·침몰 때 화면이 살짝 다가온다 (바다와 배를 같은 배율로)
    if (r) r.draw({ lon: st.center.lon + st.cx / 3000, lat: st.center.lat - st.cy / 3000, zoom: 3000 * zk, time: st.t, wind: [Math.cos(st.wind.dir) * st.wind.spd, Math.sin(st.wind.dir) * st.wind.spd], cloud: 0.0, edge: 0.0, mode: 1, dusk: 0, storm: 0, quality: 1, cssWidth: 1600, origin: [st.center.lon, st.center.lat] });
    var cv = G.Game.canvases().overlay, ctx = cv.getContext('2d'), k = G.Game.overlayScale || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(k * zk, 0, 0, k * zk, k * 800 * (1 - zk), k * 450 * (1 - zk));
    // arena boundary hint
    var c0 = toScreen(0, 0);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.setLineDash([10, 14]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c0[0], c0[1], ARENA * SCALE, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    // 항적·물보라 (배가 지나간 바다에 남는다)
    var toW = function (x, y) { return toScreen(x, -y); };
    st.ships.forEach(function (b) { if (b.fx && !b.fled) G.SeaFX.draw(b.fx, ctx, toW, 1, b.len); });
    // 물 위의 흔적: 포탄이 떨어진 자리의 거품, 가라앉는 배의 거품과 소용돌이
    st.fx.forEach(function (f) {
      var p = toScreen(f.x, f.y), u = f.t / f.life;
      if (f.kind === 'splash') splashUnder(ctx, p, f, u);
      if (f.kind === 'bigsplash') sinkFoam(ctx, p, f, u);
      if (f.kind === 'ring') impactFx(ctx, f, 1 - u);          // 물 위의 충격파 고리는 배 아래에
    });
    // ships
    st.ships.forEach(function (b) {
      if (b.fled) return;
      var p = toScreen(b.x + (b.jx || 0), b.y + (b.jy || 0));
      ctx.save();
      if (!b.alive) { ctx.globalAlpha = b.sunk ? 1 - b.sink : 0.75; }
      var spec = A.shipLook(b.type, { sails: b.sails, flag: b.side === 'me' ? '#1d3f7a' : st.npc.kind === 'pirate' ? '#111' : '#8a1e1e' });
      if (b.side === 'en') { spec.cross = false; if (st.npc.kind === 'pirate') { spec.hull = '#2a2420'; if (spec.hullType === 'west' || spec.hullType === 'galley' || spec.hullType === 'dhow') spec.sail = '#4a4440'; } }
      // 선체의 흔들림(선회 때 바깥으로 기울고, 물결에 오르내림)과 선체에 붙은 물(선수 파도·선측 물줄기)
      var sr = Math.min(1.4, Math.max(0, b.spd || 0) / (BFX.ref / BFX.day)), slp = Math.min(1.2, Math.abs(b.lat || 0) / (BFX.ref / BFX.day) * 2.2), ph0 = (b.x + b.y) * 0.01;
      var RDb = G.FX.ride;
      if (b.ride && RDb) { spec.pose = { roll: U.clamp(b.ride.roll, -RDb.maxRoll, RDb.maxRoll), pitch: U.clamp(b.ride.pitch, -RDb.maxPitch, RDb.maxPitch), heave: U.clamp(b.ride.heave, -RDb.maxHeave, RDb.maxHeave) }; spec.rig = b.rig || null; }
      else spec.pose = { roll: U.clamp(-(b.turnRate || 0) * sr * 0.08 + Math.sin(st.t * 0.9 + ph0) * 0.02, -0.12, 0.12), pitch: Math.sin(st.t * 1.3 + ph0 * 2) * 0.012 * (1 + sr), heave: Math.sin(st.t * 0.8 + ph0) * 0.012 };
      spec.noWake = true;
      if (b.alive && b.fx) G.SeaFX.drawHull(b.fx, ctx, p[0], p[1], -b.heading, b.len, sr, slp, (b.lat || 0) <= 0 ? 1 : -1, st.t);
      A.shipTop(ctx, p[0], p[1], -b.heading + (b.sunk ? b.sink * 0.6 : 0), b.len * (b.sunk ? 1 - b.sink * 0.3 : 1), spec, st.t);
      // 맞은 배: 잠깐 하얗게 번쩍인다 (같은 그림을 밝게 한 번 더 겹친다)
      if (b.hitT > 0 && !b.sunk) { var hk = Math.min(1, b.hitT / Math.max(0.01, IMP().shipFlash)); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.75 * hk; A.shipTop(ctx, p[0], p[1], -b.heading, b.len, spec, st.t); }
      ctx.restore();
      // 불길: 크게 부서진 배의 갑판 두세 곳이 일렁인다
      if (b.alive && b.hp / b.maxHp < IMP().fireAt) burnGlow(ctx, b, p);
      if (!b.alive) return;
      // bars
      var w = 60;
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(p[0] - w / 2, p[1] - b.len * 0.5 - 18, w, 9);
      ctx.fillStyle = b.side === 'me' ? '#5b9a5d' : '#c0463a'; ctx.fillRect(p[0] - w / 2 + 1, p[1] - b.len * 0.5 - 17, (w - 2) * Math.max(0, b.hp / b.maxHp), 3.5);
      ctx.fillStyle = '#d9c9a6'; ctx.fillRect(p[0] - w / 2 + 1, p[1] - b.len * 0.5 - 12.5, (w - 2) * Math.min(1, b.crew / Math.max(1, b.crew0)), 3);
      ctx.font = '600 13px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center';
      drawShipTag(ctx, b, p[0], p[1] - b.len * 0.5 - 24);
      if (b.side === 'me' && b.flag && b.steer != null && b.alive) {
        var sx = p[0] + Math.cos(b.steer) * (b.len * 0.9 + 70), sy = p[1] + Math.sin(b.steer) * (b.len * 0.9 + 70);
        ctx.strokeStyle = 'rgba(255,240,200,.75)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(p[0] + Math.cos(b.steer) * b.len * 0.6, p[1] + Math.sin(b.steer) * b.len * 0.6); ctx.lineTo(sx, sy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,240,200,.85)'; ctx.beginPath(); ctx.moveTo(sx + Math.cos(b.steer) * 12, sy + Math.sin(b.steer) * 12); ctx.lineTo(sx + Math.cos(b.steer + 2.5) * 10, sy + Math.sin(b.steer + 2.5) * 10); ctx.lineTo(sx + Math.cos(b.steer - 2.5) * 10, sy + Math.sin(b.steer - 2.5) * 10); ctx.closePath(); ctx.fill();
      }
      if (b.side === 'me' && b.flag && b.moveTo) { var mp = toScreen(b.moveTo[0], b.moveTo[1]); ctx.strokeStyle = 'rgba(255,240,200,.7)'; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(mp[0], mp[1]); ctx.stroke(); ctx.setLineDash([]); }
      if (b.side === 'me' && b.flag && b.target && b.target.alive) { var tp = toScreen(b.target.x, b.target.y); ctx.strokeStyle = 'rgba(255,90,60,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tp[0], tp[1], b.target.len * 0.6, 0, 7); ctx.stroke(); }
    });
    // cannon balls
    // 포탄: 물 위의 그림자, 뒤로 끌리는 연기 꼬리, 막 떠난 포탄의 달군 빛
    var arcH = IMP().ballArc || 14;
    st.balls.forEach(function (k2) {
      var u = Math.min(1, k2.t / k2.dur);
      var at = function (uu) { var q = toScreen(k2.x + (k2.tx - k2.x) * uu, k2.y + (k2.ty - k2.y) * uu); return [q[0], q[1] - Math.sin(uu * Math.PI) * arcH, q[0], q[1]]; };
      var c = at(u);
      ctx.fillStyle = 'rgba(0,18,28,0.28)'; ctx.beginPath(); ctx.ellipse(c[2], c[3], 3.4, 2, 0, 0, 7); ctx.fill();
      for (var i = 5; i >= 1; i--) { var q2 = at(Math.max(0, u - i * 0.04)); ctx.fillStyle = 'rgba(214,210,200,' + (0.3 * (1 - i / 6)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(q2[0], q2[1], 1.8 + i * 0.7, 0, 7); ctx.fill(); }
      if (u < 0.4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; var gb = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 9); gb.addColorStop(0, 'rgba(255,200,120,' + (0.8 * (1 - u / 0.4)).toFixed(3) + ')'); gb.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = gb; ctx.beginPath(); ctx.arc(c[0], c[1], 9, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#151210'; ctx.beginPath(); ctx.arc(c[0], c[1], 3.3, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(c[0] - 1, c[1] - 1, 1.1, 0, 7); ctx.fill();
    });
    // smoke & hits over ships
    st.fx.forEach(function (f) {
      var a = 1 - f.t / f.life;
      if (f.kind === 'smoke') { var p = toScreen(f.x + f.vx * f.t, f.y + f.vy * f.t); ctx.fillStyle = 'rgba(230,230,225,' + a * 0.55 + ')'; ctx.beginPath(); ctx.arc(p[0], p[1], f.r + f.t * 14, 0, 7); ctx.fill(); }
      if (f.kind === 'hit') { var q = toScreen(f.x, f.y); ctx.fillStyle = 'rgba(255,170,60,' + a + ')'; ctx.beginPath(); ctx.arc(q[0], q[1], 6 + f.t * 20, 0, 7); ctx.fill(); }
      if (IMPACT_KINDS[f.kind]) impactFx(ctx, f, a);
      if (f.kind === 'splash') splashColumn(ctx, toScreen(f.x, f.y), f);
    });
    // HUD texts
    var me = st.ships.filter(function (b) { return b.side === 'me' && b.alive; }), en = st.ships.filter(function (b) { return b.side === 'en' && b.alive; });
    UI.hud.set('me', '아군 ' + me.length + '척 · 선원 ' + U.sum(me, function (b) { return b.crew; }));
    UI.hud.set('en', '적 ' + en.length + '척 · 선원 ' + U.sum(en, function (b) { return b.crew; }));
    UI.hud.set('wind', U.dirName(st.wind.dir + Math.PI) + '풍');
    if ((st.pf = (st.pf || 0) + 1) % 15 === 0 && el.panel) {
      el.panel.innerHTML = '<div class="fp-h">' + G.icon('ship') + '아군 함대</div>' + st.ships.filter(function (b) { return b.side === 'me'; }).map(function (b) {
        return '<div class="fp-ship"><div class="flex"><span class="shipno' + (b.flag ? ' flag' : '') + '">' + b.no + '</span><b>' + U.esc(b.name) + '</b>' + (b.flag ? '<span class="flagtag">기함</span>' : '') + '<small class="cream-muted" style="margin-left:6px">' + U.esc(R.captainName(b.src)) + '</small><span class="right cream-muted">' + (b.alive ? '선원 ' + b.crew : b.sunk ? '침몰' : b.fled ? '이탈' : '상실') + '</span></div>' + UI.bar(b.hp, b.maxHp, 'green dark') + '</div>';
      }).join('') + '<div class="fp-h" style="margin-top:8px">' + G.icon('flag') + '적 함대 <small class="cream-muted">— 1번 기함을 무찌르면 승리</small></div>' + st.ships.filter(function (b) { return b.side === 'en'; }).map(function (b) {
        return '<div class="fp-ship en"><div class="flex"><span class="shipno en' + (b.flag ? ' flag' : '') + '">' + b.no + '</span><b>' + U.esc(b.name) + '</b>' + (b.flag ? '<span class="flagtag en">기함</span>' : '') + '<span class="right cream-muted">' + (b.alive ? '선원 ' + b.crew : b.sunk ? '침몰' : b.captured ? '나포' : b.fled ? '달아남' : '상실') + '</span></div>' + UI.bar(b.hp, b.maxHp, 'red dark') + '</div>';
      }).join('') + '<div class="cream-muted" style="font-size:14px;margin-top:6px">방향키: 기함 몰기 · Space: 기함 정지 · 클릭: 이동 · 적함 클릭: 공격 · B: 백병전 · P: 일시정지</div>';
    }
  }
})(window.G = window.G || {});
