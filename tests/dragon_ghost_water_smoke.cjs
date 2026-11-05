/* 거북선 연소·저장·유령선 부상과 보상·물 공격 폭발을 실제 전투 경로에서 검사한다. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict'), {pathToFileURL} = require('url');
let chromium; try { ({chromium} = require('playwright')); } catch (_) { ({chromium} = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..'), GPU = process.env.SHIP3D_GPU === '1', OUT = path.join(ROOT, 'artifacts/dragon-ghost-water-20261105', GPU ? 'gpu' : 'software');
fs.mkdirSync(OUT, {recursive: true});
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [], report = {mode: GPU ? 'GPU' : 'SwiftShader'};
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 720}}); page.setDefaultTimeout(90000);
    page.on('pageerror', e => errors.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({body: '', contentType: 'text/css'}));
    await page.addInitScript(() => { const raf = requestAnimationFrame; requestAnimationFrame = fn => fn.name === 'loop' ? 0 : raf(fn); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'load'});
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    await page.evaluate(async () => {
      const s = G.Game.state = G.State.newGame({name: '용머리와 유령선 검사', nation: 'PT', job: 'explorer', age: 22, birth: {m: 4, d: 12}, st: {str: 60, int: 60, mar: 60, cha: 60}, sk: {gun: 2}, lg: [], diff: 'normal'});
      s.settings.res = .35; s.settings.shake = false; s.date.y = 1650; s.loc = {mode: 'sea', lon: -30, lat: 30, heading: 0};
      await G.Game.ensureGeo(); G.SeaMonsters.sync();
      window.enterTest = function (type, monster, cycle) {
        s.fleet.ships = [G.R.newShip(type || 'geobukseon')]; s.fleet.crew = 150;
        let npc = {kind: 'navy', nation: 'ES', n: 1, ships: ['galleon'], K: .4};
        if (monster) { const e = s.seaMonsters.entries[monster]; e.active = true; e.cycle = cycle || 1; e.hp = null; e.maxHp = null; npc = G.SeaMonsters.npc(e); npc.center = {lon: -30, lat: 30}; }
        G.Game.go('battle', {npc}); const B = G.Scenes.battle, st = B.runtime(); B.headless = true;
        st.paused = false; st.busy = st.hitstop = 0; st.hsCool = 1000; B.speed(1); st.over = false; st.balls = []; st.fx = [];
        st.cameraMode = 'chart'; st.chartFocus = [0, -35]; st.viewZoom = st.vz = 1.1;
        const b = st.myFlag, e = st.enFlag;
        for (const sh of st.ships) { sh.hp = sh.maxHp = 10000; sh.crew = sh.crew0 = 200; sh.halt = true; sh.vel = [0, 0]; sh.spd = 0; sh.reload = [1000, 1000, 1000]; sh.ramCd = 1000; sh.moveTo = sh.steer = sh.target = null; sh.boardIntent = false; sh.guns.n = 0; }
        b.x = -100; b.y = 0; b.heading = 0; b.guns = {type: 'perrier', n: 2}; e.x = 100; e.y = 0; e.heading = Math.PI; e.attackCd = 999;
        return st;
      };
      window.advanceTest = function (seconds) { const B = G.Scenes.battle; for (let left = seconds; left > 1e-8; left -= .05) B.update(Math.min(.05, left)); };
      window.injectTest = function (fields) {
        const B = G.Scenes.battle, st = B.runtime(), b = st.myFlag, e = st.enFlag;
        st.hitstop = 0; st.hsCool = 1000; st.balls = [Object.assign({x: b.x, y: b.y, tx: e.x, ty: e.y, t: 0, dur: .001, hit: true, dmg: 20, target: e, from: b, gun: 'perrier'}, fields)]; B.update(.001);
      };
      window.drawTest = function (age) {
        const B = G.Scenes.battle, st = B.runtime(); st.paused = true; st.hitstop = 0;
        if (age != null) st.fx.forEach(f => f.t = Math.min(age, f.life - .001)); B.headless = false; B.update(0); B.headless = true;
      };
    });
    report.renderer = await page.evaluate(() => { const gl = G.Game.renderer.gl, ext = gl.getExtension('WEBGL_debug_renderer_info'); return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); });
    report.fireGuns = await page.evaluate(() => {
      const B = G.Scenes.battle, rows = [], rf = G.U.rf; G.U.rf = (a, b) => (a + b) / 2;
      try {
      for (const [type, mount, heading] of [['geobukseon', 0, Math.PI / 2], ['geobukseon', 2, 0], ['galleass', 2, 0]]) {
        const st = enterTest(type), b = st.myFlag; b.heading = heading; b.reload[mount] = 0; B.update(.001);
        const k = st.balls[0]; if (!k) throw Error(type + ' 실제 발사 실패');
        rows.push({type, mount, fire: !!k.dragonFire, element: k.element, dmg: k.dmg, mx: k.mx, my: k.my, launchHeight: k.launchHeight, x: b.x, y: b.y, len: b.len});
      } } finally { G.U.rf = rf; } return rows;
    });
    assert(!report.fireGuns[0].fire && report.fireGuns[1].fire && !report.fireGuns[2].fire);
    assert(Math.abs(report.fireGuns[1].dmg / report.fireGuns[0].dmg - .55) < 1e-9); assert.equal(report.fireGuns[1].element, 'fire');
    assert(Math.abs(report.fireGuns[1].mx - report.fireGuns[1].x - report.fireGuns[1].len * .58) < 1e-8);
    report.burn = await page.evaluate(() => {
      const st = enterTest('geobukseon'), B = G.Scenes.battle, e = st.enFlag; st.myFlag.guns.n = 0;
      injectTest({dragonFire: true, element: 'fire', dmg: 11}); const direct = 10000 - e.hp, initial = G.U.clone(e.fireBurn);
      advanceTest(.5); const beforePause = G.U.clone(e.fireBurn); st.paused = true; B.update(2); const afterPause = G.U.clone(e.fireBurn); st.paused = false;
      advanceTest(.5); const firstTick = 10000 - e.hp - direct;
      const snap = B.snapshot(); st.paused = true; G.Game.go('battle', {battle: snap}); B.headless = true;
      const restored = B.runtime(), savedBurn = G.U.clone(restored.enFlag.fireBurn); restored.myFlag.guns.n = 0; restored.paused = false; restored.hsCool = 1000;
      advanceTest(9); return {direct, initial, beforePause, afterPause, firstTick, savedBurn, total: 10000 - restored.enFlag.hp, expired: !restored.enFlag.fireBurn};
    });
    assert.equal(report.burn.initial.left, 10); assert.deepEqual(report.burn.beforePause, report.burn.afterPause);
    assert(Math.abs(report.burn.firstTick - 1.76) < 1e-7); assert(report.burn.expired); assert(Math.abs(report.burn.total - 29.7) < 1e-7);
    report.refresh = await page.evaluate(() => {
      const st = enterTest('geobukseon'); st.myFlag.guns.n = 0; injectTest({dragonFire: true, element: 'fire', dmg: 11}); advanceTest(.6);
      const old = G.U.clone(st.enFlag.fireBurn); injectTest({dragonFire: true, element: 'fire', dmg: 11}); const next = G.U.clone(st.enFlag.fireBurn);
      G.Scenes.battle.speed(2); advanceTest(.5); return {old, next, afterFast: st.enFlag.fireBurn.left};
    });
    assert.equal(report.refresh.next.left, 10); assert.equal(report.refresh.old.dps, report.refresh.next.dps); assert(report.refresh.next.clock >= report.refresh.old.clock); assert(Math.abs(report.refresh.afterFast - 9) < 1e-7);
    report.burnKill = await page.evaluate(() => {
      const st = enterTest('geobukseon'), victim = Object.assign({}, st.enFlag, {name: '연소 시험선', no: 2, flag: false, x: 200, y: 200, hp: 1, maxHp: 100, guns: {type: 'saker', n: 0}, reload: [1000, 1000, 1000]});
      st.myFlag.guns.n = 0; st.ships.push(victim); injectTest({target: victim, tx: victim.x, ty: victim.y, dragonFire: true, element: 'fire', dmg: .55});
      const afterHit = {alive: victim.alive, hp: victim.hp}; advanceTest(5.1);
      return {afterHit, sunk: victim.sunk, alive: victim.alive, burning: !!victim.fireBurn, flagshipAlive: st.enFlag.alive};
    }); assert(report.burnKill.afterHit.alive && report.burnKill.afterHit.hp > 0); assert(report.burnKill.sunk && !report.burnKill.alive && !report.burnKill.burning && report.burnKill.flagshipAlive);
    await page.evaluate(() => {
      const st = enterTest('geobukseon'), B = G.Scenes.battle, b = st.myFlag, e = st.enFlag;
      b.x = -210; b.heading = 0; e.x = 160; b.guns.n = 2; b.guns.type = 'lculverin'; b.reload[2] = 0; B.update(.001);
      b.reload = [1000, 1000, 1000]; B.update(.22); drawTest();
    }); await page.screenshot({path: path.join(OUT, 'dragon-fire-flight.png')});
    await page.evaluate(() => { const st = G.Scenes.battle.runtime(); st.paused = false; st.balls.forEach(k => { k.hit = true; k.t = k.dur; }); G.Scenes.battle.update(.001); drawTest(.2); });
    await page.screenshot({path: path.join(OUT, 'dragon-fire-impact.png')});
    report.water = await page.evaluate(() => {
      const st = enterTest('galleon', 'kraken'), B = G.Scenes.battle, b = st.myFlag, e = st.enFlag; b.guns.n = 0;
      let rings = 0; const ripple = G.WaterSplash.ripple; G.WaterSplash.ripple = function () { rings++; return ripple.apply(this, arguments); };
      const old = G.Audio.sfx, sounds = []; G.Audio.sfx = name => sounds.push(name);
      st.balls = [{x: e.x, y: e.y, tx: b.x, ty: b.y, t: 0, dur: .001, hit: false, dmg: 20, radial: true, element: 'water', from: e}]; B.update(.001);
      const out = {damage: 10000 - b.hp, kinds: st.fx.map(f => f.kind), burning: !!b.fireBurn, sounds, scale: st.fx.find(f => f.kind === 'waterBurst').s};
      drawTest(.22); out.rings = rings; G.Audio.sfx = old; G.WaterSplash.ripple = ripple; return out;
    });
    assert(report.water.damage > 0); assert(report.water.kinds.includes('waterBurst')); assert(!report.water.kinds.includes('powderFlame')); assert(!report.water.burning); assert(report.water.sounds.includes('splash')); assert.equal(report.water.rings, 0);
    await page.screenshot({path: path.join(OUT, 'monster-water-impact.png')});
    report.waterStress = await page.evaluate(() => {
      const st = enterTest('galleon'), B = G.Scenes.battle; st.myFlag.guns.n = 0; st.enFlag.crew = st.enFlag.crew0 = 100000;
      for (let i = 0; i < 300; i++) st.balls.push({x: -100, y: 0, tx: 100, ty: 0, t: 0, dur: .001, hit: true, target: st.enFlag, dmg: 20, element: 'water', from: st.myFlag});
      B.update(.001); const count = st.fx.length, sprays = st.fx.filter(f => f.kind === 'waterBurst').length, damage = 10000 - st.enFlag.hp;
      advanceTest(2); return {count, sprays, damage, remaining: st.fx.filter(f => f.kind === 'waterBurst').length};
    }); assert(report.waterStress.sprays <= 36); assert.equal(report.waterStress.remaining, 0); assert(Math.abs(report.waterStress.damage - 6600) < 1e-7);
    report.ghost = await page.evaluate(() => {
      const rows = [], B = G.Scenes.battle, M = G.SeaMonsters;
      for (const cycle of [1, 2]) {
        const st = enterTest('galleon', 'ghost-ship', cycle), e = st.enFlag; st.myFlag.guns.n = 0;
        const initial = {hull: e.ghostHull, phase: e.monsterPhase, targetable: M.targetable(e), progress: M.ghostVisual(e).progress};
        advanceTest(1.6); const mid = M.ghostVisual(e).progress, snap = B.snapshot(); G.Game.go('battle', {battle: snap}); B.headless = true; B.runtime().myFlag.guns.n = 0;
        const restored = B.runtime().enFlag; advanceTest(1.6); rows.push({initial, mid, saved: M.ghostVisual(restored).hull, phase: restored.monsterPhase, targetable: M.targetable(restored)});
      } return rows;
    });
    assert.deepEqual(report.ghost.map(r => r.initial.hull), ['galleon', 'frigate']);
    for (const r of report.ghost) { assert.equal(r.initial.phase, 'emerge'); assert(!r.initial.targetable); assert.equal(r.initial.progress, 0); assert(Math.abs(r.mid - .5) < 1e-7); assert.equal(r.phase, 'surface'); assert(r.targetable); }
    report.gold = await page.evaluate(() => {
      const s = G.Game.state, M = G.SeaMonsters, e = s.seaMonsters.entries['ghost-ship']; e.active = true;
      const npc = M.npc(e), body = {monster: 'ghost-ship', sunk: false, hp: 5, maxHp: 100}; const start = s.player.gold;
      M.afterBattle(npc, 'flee', [body]); const flee = s.player.gold - start; e.active = true; body.sunk = true;
      const reward = M.afterBattle(npc, 'win', [body]); const once = s.player.gold - start; M.afterBattle(npc, 'win', [body]);
      return {flee, once, twice: s.player.gold - start, reward, stored: e.rewardGold, next: e.next.y - s.date.y};
    }); assert.equal(report.gold.flee, 0); assert(report.gold.once >= 80000 && report.gold.once <= 150000); assert.equal(report.gold.once, report.gold.twice); assert.equal(report.gold.stored, report.gold.once); assert.equal(report.gold.next, 10);
    // 두 선형 × 네 방향을 같은 3D 렌더러로 직접 그려 수면과 실루엣을 검수한다.
    for (const phase of ['surface', 'emerge']) {
      report['sheet-' + phase] = await page.evaluate(phase => {
        const cv = document.createElement('canvas'); cv.id = 'ghost-sheet'; cv.width = 1280; cv.height = 720; cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:999999';
        document.getElementById('ghost-sheet')?.remove(); document.body.appendChild(cv); const ctx = cv.getContext('2d'); ctx.fillStyle = '#164253'; ctx.fillRect(0, 0, 1280, 720);
        G.Ship3D.beginFrame(); for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
          const hull = row ? 'frigate' : 'galleon'; G.SeaMonsters.draw(ctx, {monster: 'ghost-ship', ghostHull: hull, heading: col * Math.PI / 2, len: 185, alive: true, monsterPhase: phase, phaseTime: 2.35}, 160 + col * 320, 235 + row * 350, 4);
          ctx.fillStyle = '#e7ebcf'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(hull + ' · ' + col * 90 + '°', 160 + col * 320, 325 + row * 350);
        } G.Ship3D.endFrame(); return G.Ship3D.stats();
      }, phase); await page.screenshot({path: path.join(OUT, 'ghost-' + phase + '-forms.png')});
    }
    report.resources = await page.evaluate(() => {
      const cv = document.getElementById('ghost-sheet'), ctx = cv.getContext('2d'), stats = [];
      for (let i = 0; i < 8; i++) {
        G.Ship3D.beginFrame(); for (const hull of ['galleon', 'frigate']) G.SeaMonsters.draw(ctx, {monster: 'ghost-ship', ghostHull: hull, heading: i * .4, len: 100, alive: true, monsterPhase: 'surface'}, 160, 240, i);
        G.Ship3D.endFrame(); stats.push(G.Ship3D.stats());
      } return stats;
    });
    assert(report.resources.every(s => s.ready && Object.keys(s.failures).length === 0));
    assert.equal(report.resources[0].geometries, report.resources.at(-1).geometries); assert.equal(report.resources[0].textures, report.resources.at(-1).textures);
    report.hidden = await page.evaluate(() => {
      document.getElementById('ghost-sheet').remove(); const cv = document.createElement('canvas'); cv.width = cv.height = 500; const ctx = cv.getContext('2d');
      G.SeaMonsters.draw(ctx, {monster: 'ghost-ship', ghostHull: 'frigate', heading: 0, len: 180, alive: true, monsterPhase: 'submerged', phaseTime: 1}, 250, 300, 1);
      const data = ctx.getImageData(0, 0, 500, 500).data; return data.some((v, i) => i % 4 === 3 && v > 0);
    }); assert(!report.hidden);
    await page.evaluate(() => { const st = enterTest('galleon', 'ghost-ship', 2); st.enFlag.phaseTime = 2.4; drawTest(); });
    await page.screenshot({path: path.join(OUT, 'ghost-emerging-battle.png')});
    report.fallback = await page.evaluate(() => {
      const st = G.Scenes.battle.runtime(), draw = G.Ship3D.draw; st.enFlag.phaseTime = 3.2; st.enFlag.monsterPhase = 'surface'; G.Ship3D.draw = () => false;
      try { drawTest(); return true; } finally { G.Ship3D.draw = draw; }
    }); assert(report.fallback);
    await page.screenshot({path: path.join(OUT, 'ghost-fallback.png')});
    if (process.argv.includes('--preview')) {
      const ghostFrames = path.join(OUT, 'ghost-frames'), waterFrames = path.join(OUT, 'water-frames');
      fs.mkdirSync(ghostFrames, {recursive: true}); fs.mkdirSync(waterFrames, {recursive: true});
      await page.evaluate(() => { const st = enterTest('galleon', 'ghost-ship', 1); st.myFlag.guns.n = 0; st.myFlag.x = -300; st.enFlag.x = 220; G.Scenes.battle.headless = false; G.Scenes.battle.update(0); });
      for (let frame = 0; frame < 18; frame++) {
        if (frame) await page.evaluate(() => G.Scenes.battle.update(.2));
        await page.screenshot({path: path.join(ghostFrames, 'frame-' + String(frame).padStart(2, '0') + '.png'), clip: {x: 590, y: 230, width: 400, height: 350}});
      }
      await page.evaluate(() => {
        const st = enterTest('galleon', 'kraken'), b = st.myFlag, e = st.enFlag; b.guns.n = 0;
        st.balls = [{x: e.x, y: e.y, tx: b.x, ty: b.y, t: 0, dur: .001, hit: true, dmg: 20, element: 'water', from: e, target: b}];
        G.Scenes.battle.headless = false; G.Scenes.battle.update(.001);
      });
      for (let frame = 0; frame < 14; frame++) {
        if (frame) await page.evaluate(() => G.Scenes.battle.update(.08));
        await page.screenshot({path: path.join(waterFrames, 'frame-' + String(frame).padStart(2, '0') + '.png'), clip: {x: 330, y: 200, width: 490, height: 390}});
      }
    }
    assert.deepEqual(errors, []); report.errors = errors; fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log('OK: 용머리 전용 화염탄·직격 55%·10초 연소·갱신/정지/배속/저장 / 유령선 2선형·부상·잠수·한 번 보상 / 물 폭발·300발 / 오류 0');
  } catch (e) { fs.writeFileSync(path.join(OUT, 'failure.json'), JSON.stringify({error: e.stack, errors, report}, null, 2)); throw e; }
  finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
