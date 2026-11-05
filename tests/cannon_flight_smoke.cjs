/* 포구 발사·탄도 끝점·명중 시각·저장 호환과 실제 비행 화면을 확인한다. */
'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path'), {pathToFileURL} = require('url');
let chromium; try { ({chromium} = require('playwright')); } catch (_) { ({chromium} = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/cannon-flight-20261101');
fs.mkdirSync(OUT, {recursive: true});
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [], report = {};
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 720}}); page.setDefaultTimeout(90000);
    page.on('pageerror', e => errors.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({body: '', contentType: 'text/css'}));
    await page.addInitScript(() => { const raf = requestAnimationFrame; requestAnimationFrame = fn => fn.name === 'loop' ? 0 : raf(fn); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'load'});
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    await page.evaluate(async () => {
      const s = G.Game.state = G.State.newGame({name: '포탄 비행 검사', nation: 'PT', job: 'explorer', age: 22, birth: {m: 4, d: 12}, st: {str: 60, int: 60, mar: 60, cha: 60}, sk: {gun: 2}, lg: [], diff: 'normal'});
      s.settings.res = .35; s.settings.shake = false; s.fleet.ships = [G.R.newShip('galleon')]; s.fleet.crew = 150;
      s.loc = {mode: 'sea', lon: -30, lat: 30, heading: 0}; await G.Game.ensureGeo();
      G.Game.go('battle', {npc: {kind: 'navy', nation: 'ES', n: 1, ships: ['galleon'], K: .4}});
      window.prepareFlight = function (id, spaced) {
        const B = G.Scenes.battle, st = B.runtime(), b = st.myFlag, e = st.enFlag; B.headless = true;
        st.fx = []; st.balls = []; st.hitstop = st.busy = st.impactSoundAt = 0; st.hsCool = 1000; st.speed = 1;
        st.over = st.paused = st.holdFire = false; st.cameraMode = 'chart'; st.chartFocus = [0, -30]; st.viewZoom = st.vz = 1.1;
        for (const sh of [b, e]) {
          sh.hp = sh.maxHp = 1000; sh.alive = true; sh.sunk = sh.captured = sh.fled = false;
          sh.crew = sh.crew0 = 200; sh.halt = true; sh.vel = [0, 0]; sh.spd = 0; sh.steer = sh.moveTo = sh.target = sh.board = null;
          sh.boardIntent = false; sh.ramCd = 1000; sh.jx = sh.jy = sh.hitT = 0; sh.trem = null; sh.reload = [1000, 1000, 1000];
        }
        b.x = -60; b.y = 0; b.heading = Math.PI / 2; b.guns = {type: id, n: 8}; b.reload[0] = 0;
        e.x = 60; e.y = 0; e.heading = -Math.PI / 2; e.guns.n = 0;
        let seed = 421; Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
        B.update(.001); b.reload = [1000, 1000, 1000];
        st.balls.forEach(k => k.hit = true);
        if (spaced) { // 검수 화면에서 두 배의 간격만 벌린다. 게임의 도착 시각은 그대로 둔다.
          b.x -= 160; e.x += 160; st.fx.forEach(f => f.x -= 160);
          st.balls.forEach((k, i) => { k.x -= 160; if (k.mx != null) k.mx -= 160; k.tx = e.x + (i - 1.5) * 8; k.ty = (i - 1.5) * 6; });
        }
        return st.balls.map(k => ({x: k.x, y: k.y, mx: k.mx, my: k.my, launch: k.launch, dur: k.dur, dmg: k.dmg, tx: k.tx, ty: k.ty, gun: k.gun}));
      };
    });
    report.types = [];
    for (const id of await page.evaluate(() => G.CANNONS.map(c => c.id))) {
      const balls = await page.evaluate(id => prepareFlight(id, false), id); assert.equal(balls.length, 4);
      balls.forEach((b, i) => {
        assert.equal(b.dur, .35 + 120 / 900 + i * .03, id + ' 도착 시간 유지');
        assert(Math.hypot(b.mx - b.x, b.my - b.y) > 10, id + ' 포구에서 출발');
        assert.equal(b.launch, i * .025, id + ' 순차 발사');
      }); report.types.push({id, balls});
    }
    report.geometry = await page.evaluate(() => {
      const pose = G.Scenes.battle._t().projectilePose, bad = []; let cases = 0;
      for (const gun of G.CANNONS) for (const angle of [0, .7, Math.PI, -Math.PI / 2]) for (const d of [0, 120, 600]) {
        const k = {x: -10, y: -10, mx: 0, my: 0, tx: Math.cos(angle) * d, ty: Math.sin(angle) * d, dur: .9, launch: .075, gun: gun.id};
        const start = pose(k, k.launch), end = pose(k, k.dur), mid = pose(k, (k.launch + k.dur) / 2);
        if (start.x !== 0 || start.y !== 0 || start.z !== 0 || Math.hypot(end.x - k.tx, end.y - k.ty, end.z) > 1e-8 || !mid.visible || end.visible || pose(k, .074).visible) bad.push({gun: gun.id, angle, d});
        for (let step = 0; step <= 20; step++) {
          const p = pose(k, step / 20 * k.dur);
          if (!Object.values(p).every(v => typeof v === 'boolean' || Number.isFinite(v)) || p.z < -1e-9) bad.push({gun: gun.id, step});
        } cases++;
      }
      const k = {x: 0, y: 0, tx: 400, ty: 0, dur: .8, gun: 'saker'}, height = pose(k, .4).z;
      k.gun = 'lculverin'; const longHeight = pose(k, .4).z;
      return {cases, bad, height, longHeight};
    }); assert.deepEqual(report.geometry.bad, []); assert.equal(report.geometry.cases, report.types.length * 12); assert(report.geometry.longHeight < report.geometry.height * .5);
    report.arrival = await page.evaluate(() => {
      prepareFlight('hcannon', false); const B = G.Scenes.battle, st = B.runtime(), before = st.enFlag.hp;
      B.update(.24); B.update(.24); const justBefore = st.enFlag.hp, countBefore = st.balls.length;
      B.update(.01); const first = st.enFlag.hp, countFirst = st.balls.length;
      B.update(.12); return {before, justBefore, first, after: st.enFlag.hp, countBefore, countFirst, countAfter: st.balls.length};
    });
    assert.equal(report.arrival.before, report.arrival.justBefore); assert.equal(report.arrival.countBefore, 4);
    assert(report.arrival.first < report.arrival.before); assert.equal(report.arrival.countFirst, 3); assert.equal(report.arrival.countAfter, 0);
    report.save = await page.evaluate(() => {
      prepareFlight('lculverin', true); const B = G.Scenes.battle, st = B.runtime(), pose = B._t().projectilePose;
      st.paused = true; st.balls.forEach(k => k.t = .23); const before = st.balls.map(k => pose(k, k.t)), snap = B.snapshot();
      G.Game.go('battle', {battle: snap}); B.headless = false; B.update(0); B.headless = true;
      const after = B.runtime().balls.map(k => pose(k, k.t)), legacy = B.snapshot();
      legacy.balls.forEach(k => { delete k.mx; delete k.my; delete k.launch; delete k.gun; });
      G.Game.go('battle', {battle: legacy}); B.headless = false; B.update(0); B.headless = true;
      return {before, after, legacy: B.runtime().balls.map(k => pose(k, k.t))};
    }); assert.deepEqual(report.save.before, report.save.after); assert(report.save.legacy.every(p => Number.isFinite(p.x) && Number.isFinite(p.z)));
    for (const id of ['saker', 'lculverin', 'hcannon', 'pedrero']) {
      await page.evaluate(id => {
        prepareFlight(id, true); const B = G.Scenes.battle, st = B.runtime(); B.headless = false; B.update(.22); st.paused = true;
      }, id); await page.screenshot({path: path.join(OUT, id + '-flight.png')});
    }
    report.zooms = [];
    for (const zoom of [.45, 2.6]) {
      const row = await page.evaluate(zoom => {
        const B = G.Scenes.battle, st = B.runtime(); st.viewZoom = st.vz = zoom; B.update(0);
        return {zoom, balls: st.balls.length, camera: st.vz};
      }, zoom); report.zooms.push(row); await page.screenshot({path: path.join(OUT, 'zoom-' + zoom + '.png')});
    }
    // 실제 update로 발사→비행→명중을 이어 찍는다. 포탄 시간·효과 나이를 임의로 옮기지 않는다.
    const frames = path.join(OUT, 'frames'); fs.mkdirSync(frames, {recursive: true});
    await page.evaluate(() => { prepareFlight('hcannon', true); G.Scenes.battle.headless = false; G.Scenes.battle.update(0); });
    for (let frame = 0; frame < 45; frame++) {
      if (frame) await page.evaluate(() => G.Scenes.battle.update(1 / 30));
      await page.screenshot({path: path.join(frames, 'frame-' + String(frame).padStart(2, '0') + '.png'), clip: {x: 300, y: 250, width: 700, height: 350}});
    }
    assert.deepEqual(errors, []); report.errors = errors;
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log('OK: 대포 ' + report.types.length + '종 순차 발사 / 탄도 ' + report.geometry.cases + '조건 / 명중 시각 유지 / 저장·옛 포탄 / 확대·축소 / 실제 비행 45프레임 / 오류 0');
  } catch (e) { fs.writeFileSync(path.join(OUT, 'failure.json'), JSON.stringify({error: e.stack, errors, report}, null, 2)); throw e; }
  finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
