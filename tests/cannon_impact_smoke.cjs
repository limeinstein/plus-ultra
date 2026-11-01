/* 실제 포격 경로의 10종 포·피해 합산·입자 상한·옛 저장·설정과 화면 검사. */
'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path'), {pathToFileURL} = require('url');
let chromium; try { ({chromium} = require('playwright')); } catch (_) { ({chromium} = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/cannon-impact-20261101');
const baseline = process.env.CANNON_BASELINE === '1' || process.argv.includes('--baseline');
fs.mkdirSync(OUT, {recursive: true});
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [], report = {guns: []};
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 720}});
    page.setDefaultTimeout(90000);
    page.on('pageerror', e => errors.push(e.stack));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({body: '', contentType: 'text/css'}));
    if (baseline) {
      const {execFileSync} = require('child_process');
      for (const file of ['js/data/seafx.js', 'js/scenes/battle.js']) {
        const body = execFileSync('git', ['show', 'HEAD:' + file], {cwd: ROOT, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024});
        await page.route('**/' + file, r => r.fulfill({body, contentType: 'text/javascript'}));
      }
    }
    await page.addInitScript(() => { const raf = requestAnimationFrame; requestAnimationFrame = fn => fn.name === 'loop' ? 0 : raf(fn); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'load'});
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    await page.evaluate(async () => {
      const s = G.Game.state = G.State.newGame({name: '포격 연출 검사', nation: 'PT', job: 'explorer', age: 22, birth: {m: 4, d: 12}, st: {str: 60, int: 60, mar: 60, cha: 60}, sk: {gun: 2}, lg: [], diff: 'normal'});
      s.settings.res = .35; s.settings.shake = false; s.fleet.ships = [G.R.newShip('galleon')]; s.fleet.crew = 150;
      s.loc = {mode: 'sea', lon: -30, lat: 30, heading: 0}; await G.Game.ensureGeo();
      G.Game.go('battle', {npc: {kind: 'navy', nation: 'ES', n: 1, ships: ['galleon'], K: .4}});
      const B = G.Scenes.battle; B.headless = true;
      window.rippleCalls = 0;
      const ripple = G.WaterSplash.ripple;
      G.WaterSplash.ripple = function () { window.rippleCalls++; return ripple.apply(this, arguments); };
      window.prepareGun = function (id) {
        const st = B.runtime(), b = st.myFlag, e = st.enFlag;
        st.fx = []; st.balls = []; st.hitstop = st.hsCool = st.busy = st.impactSoundAt = 0; st.over = st.paused = st.holdFire = false;
        st.cameraMode = 'chart'; st.chartFocus = [0, -30]; st.viewZoom = st.vz = 1.1; st.cx = 0; st.cy = -25;
        for (const sh of [b, e]) {
          sh.hp = sh.maxHp = 240; sh.alive = true; sh.sunk = sh.captured = sh.fled = false;
          sh.crew = sh.crew0 = 200; sh.halt = true; sh.vel = [0, 0]; sh.steer = sh.moveTo = sh.target = sh.board = null;
          sh.boardIntent = false; sh.ramCd = 1000; sh.jx = sh.jy = sh.hitT = 0; sh.trem = null; sh.reload = [1000, 1000, 1000];
        }
        b.x = -60; b.y = 0; b.heading = Math.PI / 2; b.guns = {type: id, n: 8}; b.reload[0] = 0;
        e.x = 60; e.y = 0; e.heading = -Math.PI / 2; e.guns.n = 0;
        let seed = 421; Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
        B.update(.001); b.reload = [1000, 1000, 1000];
        // 실제 발사 뒤 화면 검수용 간격만 벌린다. 피해 판정·장전 시간은 위의 실제 발사 값을 쓴다.
        const shift = 150; b.x -= shift; e.x += shift;
        st.fx.forEach(f => { f.x -= shift; });
        st.balls.forEach((k, i) => { k.x -= shift; if (k.mx != null) k.mx -= shift; k.tx = e.x + (i - 1.5) * 8; k.ty = e.y + (i - 1.5) * 6; });
        return st.balls.map(k => ({gun: k.gun, dmg: k.dmg, kill: k.kill, dur: k.dur}));
      };
      window.landVolley = function () {
        const st = B.runtime(), sfx = G.Audio.sfx, sounds = []; st.paused = false; st.hitstop = 0; st.balls.forEach(k => { k.hit = true; k.t = k.dur; });
        G.Audio.sfx = (name, variant) => sounds.push({name, variant});
        try { B.update(.001); } finally { G.Audio.sfx = sfx; }
        return {hp: st.enFlag.hp, sounds, fx: st.fx.map(f => ({kind: f.kind, r: f.r, life: f.life, val: f.val, crew: f.crew, hits: f.hits, big: f.big, gun: f.gun})), count: st.fx.length};
      };
      window.showPhase = function (age) {
        const st = B.runtime(); st.paused = true; st.hitstop = 0; st.fx.forEach(f => { f.t = age; f.seen = 1; });
        st.fx = st.fx.filter(f => f.t < f.life); B.headless = false; B.update(0); B.headless = true;
      };
    });
    const ids = await page.evaluate(() => G.CANNONS.map(c => c.id));
    for (const id of ids) {
      const balls = await page.evaluate(id => prepareGun(id), id);
      assert.equal(balls.length, 4, id + ' 실제 현측 발사');
      if (!baseline) {
        assert(balls.every(k => k.gun === id));
        assert.equal(await page.evaluate(() => G.Scenes.battle.runtime().fx.filter(f => f.kind === 'ring').length), 0, id + ' 발사 때 원형 물결 없음');
      }
      if (['saker', 'lculverin', 'pedrero', 'hcannon'].includes(id)) {
        await page.evaluate(() => showPhase(.065));
        await page.screenshot({path: path.join(OUT, (baseline ? 'before-' : '') + id + '-muzzle.png')});
      }
      const hit = await page.evaluate(() => landVolley());
      const number = hit.fx.filter(f => f.kind === 'dmg');
      assert.equal(number.length, 1, id + ' 피해 숫자 하나로 합산');
      assert(Math.abs(number[0].val - (240 - hit.hp)) < 1e-8, id + ' 실제 피해와 숫자 일치');
      if (!baseline) {
        assert.equal(number[0].hits, 4); assert.equal(number[0].gun, id);
        assert(hit.fx.some(f => f.kind === 'powderFlame')); assert(hit.fx.some(f => f.kind === 'powderSmoke'));
        assert(hit.fx.some(f => f.kind === 'powderFlash')); assert(hit.fx.some(f => f.kind === 'powderFracture'));
        assert(!hit.fx.some(f => f.kind === 'ring' || f.kind === 'waterSprite'), id + ' 명중 때 원형 물보라 그림 없음');
        const heavy = await page.evaluate(id => G.FX.cannonImpact.profiles[id].size >= 1.3, id);
        assert.deepEqual(hit.sounds, [{name: heavy ? 'boom' : 'hit', variant: heavy ? 0 : 2}], id + ' 중첩되지 않는 포별 명중음');
      }
      report.guns.push({id, balls, number: number[0], flame: hit.fx.find(f => f.kind === 'powderFlame'), count: hit.count});
      await page.evaluate(() => showPhase(.16));
      await page.screenshot({path: path.join(OUT, (baseline ? 'before-' : '') + id + '-hit.png')});
      if (['saker', 'pedrero', 'hcannon'].includes(id)) {
        await page.evaluate(() => showPhase(.95));
        await page.screenshot({path: path.join(OUT, (baseline ? 'before-' : '') + id + '-smoke.png')});
      }
      if (!baseline && id === 'hcannon') for (const age of [.04, .32, .55]) {
        await page.evaluate(age => { prepareGun('hcannon'); landVolley(); showPhase(age); }, age);
        await page.screenshot({path: path.join(OUT, 'hcannon-phase-' + age + '.png')});
      }
    }
    if (!baseline) {
      const gun = id => report.guns.find(g => g.id === id);
      assert(gun('hcannon').flame.r > gun('saker').flame.r * 2);
      assert(gun('hcannon').number.val > gun('saker').number.val * 2); // 난수 편차 양끝에서도 중포가 더 강하다.
      assert.equal(gun('pedrero').balls[0].kill, 2);
      report.misses = await page.evaluate(() => {
        prepareGun('hcannon'); const B = G.Scenes.battle, st = B.runtime(); st.fx = [];
        st.balls.forEach((k, i) => { k.hit = false; k.tx = 80 + i * 48; k.ty = 0; k.t = k.dur; }); B.update(.001);
        const out = {spray: st.fx.filter(f => f.kind === 'powderSpray').length, rings: st.fx.filter(f => f.kind === 'ring' || f.kind === 'waterSprite').length};
        showPhase(.18); return out;
      });
      assert.equal(report.misses.spray, 4); assert.equal(report.misses.rings, 0);
      await page.screenshot({path: path.join(OUT, 'heavy-miss.png')});
      assert.equal(await page.evaluate(() => rippleCalls), 0, '발사·명중·빗나감 전 과정에서 원형 물결 그리기 호출 없음');
      if (process.argv.includes('--preview')) {
        await page.evaluate(() => { prepareGun('hcannon'); landVolley(); });
        const frames = path.join(OUT, 'preview-frames'); fs.mkdirSync(frames, {recursive: true});
        for (let frame = 0; frame < 32; frame++) {
          await page.evaluate(age => showPhase(age), frame / 20);
          await page.screenshot({path: path.join(frames, 'frame-' + String(frame).padStart(2, '0') + '.png'), clip: {x: 640, y: 220, width: 370, height: 390}});
        }
      }
      report.rehit = await page.evaluate(() => {
        const B = G.Scenes.battle, st = B.runtime(); prepareGun('hcannon'); landVolley(); const n = st.fx.find(f => f.kind === 'dmg'); n.t = .2;
        st.hitstop = 0; st.balls.push({x: st.myFlag.x, y: 0, tx: st.enFlag.x, ty: 0, t: 0, dur: .001, hit: true, dmg: 2, gun: 'hcannon', target: st.enFlag, from: st.myFlag});
        B.update(.001); return {count: st.fx.filter(f => f.kind === 'dmg').length, hits: n.hits, age: n.t};
      });
      assert.equal(report.rehit.count, 1); assert.equal(report.rehit.hits, 5); assert.equal(report.rehit.age, 0);
      report.stress = await page.evaluate(() => {
        prepareGun('hcannon'); const B = G.Scenes.battle, st = B.runtime(); st.balls = []; st.enFlag.hp = st.enFlag.maxHp = 100000;
        for (let i = 0; i < 300; i++) st.balls.push({x: -200, y: 0, tx: 200, ty: 0, t: 0, dur: .001, hit: true, dmg: 1, gun: 'hcannon', target: st.enFlag, from: st.myFlag});
        B.update(.001);
        const nums = st.fx.filter(f => f.kind === 'dmg'), out = {total: st.fx.length, cosmetic: st.fx.filter(f => !['dmg', 'waterSprite'].includes(f.kind)).length, value: nums.reduce((a, f) => a + f.val, 0), hp: st.enFlag.hp};
        showPhase(.2); return out;
      });
      assert(report.stress.cosmetic <= 650); assert(Math.abs(report.stress.value - (100000 - report.stress.hp)) < 1e-6);
      report.legacy = await page.evaluate(() => {
        prepareGun('culverin'); const B = G.Scenes.battle, st = B.runtime(); st.paused = true;
        const snap = B.snapshot(); snap.balls.forEach(k => delete k.gun); G.Game.go('battle', {battle: snap});
        const restored = B.runtime(); restored.paused = false; restored.holdFire = true; restored.balls.forEach(k => { k.hit = true; k.t = k.dur; });
        B.headless = false; B.update(.001); B.headless = true;
        return {balls: restored.balls.length, number: restored.fx.filter(f => f.kind === 'dmg').length, shake: B.feel().shake, flash: B.feel().flash};
      });
      assert.equal(report.legacy.balls, 0); assert.equal(report.legacy.number, 1); assert.equal(report.legacy.shake, 0); assert.equal(report.legacy.flash, 0);
      // 화면 흔들림을 켠 실제 장면과 작은 창에서도 모든 단계가 그려져야 한다.
      await page.evaluate(() => { G.Game.state.settings.shake = true; prepareGun('hcannon'); landVolley(); showPhase(.06); });
      await page.screenshot({path: path.join(OUT, 'heavy-feel.png')});
      await page.setViewportSize({width: 960, height: 540});
      await page.evaluate(() => { G.Game.fit(); showPhase(.35); });
      await page.screenshot({path: path.join(OUT, 'small-screen.png')});
      await page.evaluate(() => { showPhase(4); });
      assert.equal(await page.evaluate(() => G.Scenes.battle.runtime().fx.length), 0);
    }
    assert.deepEqual(errors, []); report.errors = errors;
    fs.writeFileSync(path.join(OUT, baseline ? 'before-report.json' : 'report.json'), JSON.stringify(report, null, 2));
    console.log(baseline ? 'OK: 수정 전 대포 10종 비교 화면 / 콘솔 오류 0' : 'OK: 대포 10종 실제 발사·피해 일치·연속 합산·입자 상한·옛 저장·움직임 설정·작은 화면 / 콘솔 오류 0');
  } catch (e) {
    fs.writeFileSync(path.join(OUT, 'failure.json'), JSON.stringify({error: e.stack, errors, report}, null, 2)); throw e;
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exitCode = 1;});
