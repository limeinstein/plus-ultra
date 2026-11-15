/* 원본 화질의 항해·탐험·해전·일기토를 같은 Chrome에서 측정한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..'), label = process.argv[2] || 'after';
const OUT = process.env.OUT || path.join(ROOT, 'artifacts/runtime-perf-20261115', label);
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await playwright.chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--allow-file-access-from-files']
  });
  const errors = [], report = { label, baseline: process.env.PERF_BASELINE || null, scenes: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.setDefaultTimeout(120000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    // 같은 시험기로 수정 전 커밋도 측정할 수 있다. 작업 파일은 바꾸지 않는다.
    if (process.env.PERF_BASELINE) {
      const files = ['js/main.js', 'js/data/seafx.js', 'js/ui/ui.js', 'js/games/duel.js', 'js/games/landwar.js',
        'js/scenes/sea.js', 'js/scenes/battle.js', 'js/art/ship3d.js'];
      for (const file of files) await page.route(pathToFileURL(path.join(ROOT, file)).href, r => r.fulfill({
        contentType: 'text/javascript', body: execFileSync('git', ['show', process.env.PERF_BASELINE + ':' + file], { cwd: ROOT })
      }));
    }
    await page.addInitScript(() => {
      let seed = 3415;
      Math.random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
    });
    await page.goto((process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    if (label !== 'before') {
      const clocks = await page.evaluate(() => [30, 60, 120, 144, 240].map(hz => {
        const clock = {}; let count = 0, last = 0;
        for (let i = 1; i <= hz * 10; i++) { const t = i * 1000 / hz; if (G.Game.frameDue(clock, t)) { count++; last = t; } }
        const gap = {}, first = G.Game.frameDue(gap, 0), late = G.Game.frameDue(gap, 60000), twice = G.Game.frameDue(gap, 60000);
        return { hz, count, last, first, late, twice };
      }));
      for (const c of clocks) {
        assert(Math.abs(c.count - Math.min(c.hz, 60) * 10) <= 1, c.hz + 'Hz에서도 고른 화면 갱신');
        assert(10000 - c.last < 34 && c.first && c.late && !c.twice, '긴 멈춤 뒤 몰아서 그리기 없음');
      }
      report.clocks = clocks;
    }
    await page.evaluate(async () => {
      const s = G.Game.state = G.State.newGame({ name: '성능 검사', nation: 'PT', job: 'explorer', age: 22,
        birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.settings.res = 1;
      s.fleet.ships = ['galleon', 'galley', 'caravel'].map(id => G.R.newShip(id)); s.fleet.crew = 220;
      await G.Game.ensureGeo(); G.Game.fit();
      window.__perf = { on: false, parts: {}, calls: {}, frames: [], last: 0, resizes: 0 };
      function wrap(o, k, name) {
        if (!o || typeof o[k] !== 'function') return;
        const f = o[k]; o[k] = function (...args) {
          const p = window.__perf, t = performance.now();
          try { return f.apply(this, args); } finally {
            if (p.on) { (p.parts[name] ||= []).push(performance.now() - t); p.calls[name] = (p.calls[name] || 0) + 1; }
          }
        };
      }
      ['sea', 'land', 'battle'].forEach(k => wrap(G.Scenes[k], 'update', 'scene'));
      wrap(G.Ship3D, 'draw', 'ships'); wrap(G.Party, 'draw', 'party');
      for (const k of ['Birds', 'Life', 'MateLeave', 'FirstLove', 'Coven', 'EraEnd']) wrap(G[k], k === 'Birds' ? 'update' : 'tick', k);
      for (const k of ['width', 'height']) {
        const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k);
        Object.defineProperty(HTMLCanvasElement.prototype, k, { ...d, set(v) { if (window.__perf.on) window.__perf.resizes++; d.set.call(this, v); } });
      }
      const drawImage = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (...args) {
        const p = window.__perf;
        if (p.on && this.canvas.closest) {
          const kind = this.canvas.closest('.lwar') ? 'landwarCanvas' : this.canvas.closest('.rd-stage') ? 'duelCanvas' : '';
          if (kind) p.calls[kind] = (p.calls[kind] || 0) + 1;
        }
        return drawImage.apply(this, args);
      };
      (function frame(t) { const p = window.__perf; if (p.on && p.last) p.frames.push(t - p.last); p.last = t; requestAnimationFrame(frame); })();
      window.__openSea = () => {
        s.loc = { mode: 'sea', lon: -25, lat: 33, heading: 0 };
        G.Game.go('sea', { fresh: true });
        const st = G.Scenes.sea.runtime(); st.dayAcc = -1e6; st.paused = true;
        st.npcs = ['merchant', 'pirate', 'navy'].map((kind, i) => ({ id: 'perf-' + kind, kind, n: 1,
          ships: [['fluyt', 'xebec', 'frigate'][i]], lon: -25 + (i - 1) * 2, lat: 35,
          heading: .3, spd: 0, life: 100, K: .4, nation: 'PT', zone: 'atlantic', awed: true }));
      };
      window.__openSea();
      wrap(G.Game.renderer, 'draw', 'terrain');
    });
    await page.waitForFunction(() => G.Ship3D.stats().ready);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
    async function measure(name) {
      await page.waitForTimeout(1200);
      await cdp.send('Profiler.start');
      await page.evaluate(() => Object.assign(window.__perf, { on: true, start: performance.now(), parts: {}, calls: {}, frames: [], last: 0, resizes: 0 }));
      await page.waitForTimeout(3500);
      const data = await page.evaluate(() => {
        const p = window.__perf; p.on = false;
        const cv = G.Game.canvases();
        return { ...p, elapsed: performance.now() - p.start, world: [cv.world.width, cv.world.height], overlay: [cv.overlay.width, cv.overlay.height],
          quality: G.Game.state.settings.res, ships: G.Ship3D.stats(), duel: !!document.querySelector('.duel-win') };
      });
      const { profile } = await cdp.send('Profiler.stop');
      const hits = {};
      (profile.samples || []).forEach((id, i) => hits[id] = (hits[id] || 0) + (profile.timeDeltas[i] || 0));
      const cpu = profile.nodes.map(n => ({ name: n.callFrame.functionName, file: n.callFrame.url.split('/').pop(),
        line: n.callFrame.lineNumber + 1, ms: (hits[n.id] || 0) / 1000 })).sort((a, b) => b.ms - a.ms).slice(0, 22);
      const q = (a, f) => a.slice().sort((a, b) => a - b)[Math.floor((a.length - 1) * f)] || 0;
      const row = { name, elapsed: data.elapsed, browserFrameMedian: q(data.frames, .5), browserFrameP95: q(data.frames, .95), browserFrames: data.frames.length,
        sceneUpdatesPerSecond: (data.calls.scene || 0) * 1000 / data.elapsed,
        sceneCpuMsPerSecond: (data.parts.scene || []).reduce((x, y) => x + y, 0) * 1000 / data.elapsed,
        parts: Object.fromEntries(Object.entries(data.parts).map(([k, a]) => [k, { calls: a.length, median: q(a, .5), p95: q(a, .95), total: a.reduce((x, y) => x + y, 0) }])),
        resizes: data.resizes, world: data.world, overlay: data.overlay, quality: data.quality, ships: data.ships, cpu };
      report.scenes.push(row); console.log(JSON.stringify(row));
      fs.writeFileSync(path.join(OUT, name + '.cpuprofile'), JSON.stringify(profile));
      await page.screenshot({ path: path.join(OUT, name + '.png') });
      assert.equal(data.quality, 1, '선택한 원본 화질 유지');
      assert.deepStrictEqual(data.world, [1600, 900]);
      assert.deepStrictEqual(data.overlay, [1600, 900]);
      if (label !== 'before') {
        assert((data.calls.scene || 0) <= data.elapsed * .06 + 3, '고주사율에서도 초당 최대 60회 갱신');
        if (name === 'duel' || name === 'landwar' || name === 'landwar-duel') assert.equal(data.calls.scene || 0, 0, '독립 전투 창 뒤의 장면 갱신 없음');
        if (name === 'landwar-duel') {
          assert.equal(data.calls.landwarCanvas || 0, 0, '일기토 뒤의 육상전 독립 반복도 정지');
          assert(data.calls.duelCanvas > 30, '앞쪽 일기토는 계속 그린다');
        }
      }
    }
    await page.evaluate(() => { const st = G.Scenes.sea.runtime(); G.Scenes.sea.takeCourse(0); st.dayAcc = -1e6; });
    await measure('sea');
    report.transition = await page.evaluate(() => {
      const before = G.Ship3D.stats(), gl = G.Game.renderer.gl, t = performance.now();
      G.Game.go('battle', { npc: { kind: 'pirate', n: 3, K: .4, ships: ['caravel', 'galley', 'galleon'] } });
      const st = G.Scenes.battle.runtime(); st.paused = true;
      G.Scenes.battle.update(1 / 60);
      const battle = G.Ship3D.stats(), enterMs = performance.now() - t;
      G.Game.go('sea', { resume: true });
      const sea = G.Scenes.sea.runtime(); sea.busy = 1; sea.rframe = 2;
      G.Scenes.sea.update(1 / 60);
      return { before, battle, after: G.Ship3D.stats(), enterMs, sameTerrainContext: gl === G.Game.renderer.gl };
    });
    if (label !== 'before') {
      assert.equal(report.transition.battle.builds, report.transition.before.builds, '해전 진입 때 같은 선종 모형 재생성 없음');
      assert.equal(report.transition.after.builds, report.transition.before.builds, '항해 복귀 때 같은 선종 모형 재생성 없음');
      assert(report.transition.sameTerrainContext);
    }
    await page.evaluate(() => {
      G.Game.state.loc = { mode: 'city', city: 0, lon: -4, lat: 40 };
      G.Game.go('land', { from: 0 });
      const s = G.Game.state, st = G.Scenes.land.runtime();
      s.loc.lon = st.cam.lon = -4; s.loc.lat = st.cam.lat = 40;
      st.dayAcc = -1e6; st.paused = false; st.dir = [.2, 0]; st.cityPromptBlock = 0;
    });
    await measure('land');
    await page.evaluate(() => { window.__landwar = G.Games.landWar({ enemy: { name: '시험 도적', kind: 'bandit', n: 120 }, party: 220, terr: 'grass', fastEnd: true }); });
    await measure('landwar');
    await page.evaluate(() => {
      window.__nestedDuel = G.Games.duel({ name: '아토스', sprite: 'athos', str: 70, mar: 70, skill: 2 }, { sprite: 'aramis', place: 'tavern', fastEnd: true });
    });
    await page.waitForFunction(() => { const d = G.Games._duelDebug; return d && [d.me, d.en].every(f => f.spriteImg); });
    await measure('landwar-duel');
    await page.keyboard.press('Escape'); await page.evaluate(() => window.__nestedDuel);
    if (label !== 'before') {
      await page.evaluate(() => Object.assign(window.__perf, { on: true, calls: {} }));
      await page.waitForTimeout(300);
      assert(await page.evaluate(() => { window.__perf.on = false; return window.__perf.calls.landwarCanvas > 0; }), '일기토 종료 뒤 육상전 그림 재개');
    }
    await page.evaluate(() => G.Games._landDebug.close());
    await page.evaluate(() => window.__landwar);
    if (label !== 'before') assert.equal(await page.evaluate(() => G.UI.scenePaused()), false, '육상전 종료 뒤 탐험 재개');
    await page.evaluate(() => {
      G.Game.state.loc = { mode: 'sea', lon: -25, lat: 33, heading: 0 };
      G.Game.go('battle', { npc: { kind: 'pirate', n: 3, K: .4, ships: ['carrack', 'carrack', 'carrack'] } });
    });
    await measure('battle');
    await page.evaluate(() => {
      window.__musicBeforeDuel = G.Audio.want;
      window.__duel = G.Games.duel({ name: '아토스', sprite: 'athos', str: 70, mar: 70, skill: 2 },
        { sprite: 'aramis', place: 'deck', fastEnd: true });
    });
    await page.waitForFunction(() => { const d = G.Games._duelDebug; return d && [d.me, d.en].every(f => f.spriteImg && f.atkSheet && f.reactSheet); });
    await measure('duel');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => window.__duel), 'flee');
    if (label !== 'before') {
      const resumed = await page.evaluate(() => ({ paused: G.UI.scenePaused(), music: G.Audio.want === window.__musicBeforeDuel, frames: G.Ship3D.stats().frames }));
      await page.waitForTimeout(500);
      assert(!resumed.paused && resumed.music, '일기토 종료 뒤 배경 장면·원래 음악 복원');
      assert(await page.evaluate(n => G.Ship3D.stats().frames > n, resumed.frames), '해전 화면이 다시 움직인다');
      const removed = await page.evaluate(async () => {
        const a = G.UI.window({ pauseScene: true }), b = G.UI.window({ pauseScene: true }), c = G.UI.window({});
        a.close(); c.close(); const nested = G.UI.scenePaused(); b.back.remove(); const detached = G.UI.scenePaused(); b.close();
        await Promise.all([a.result, b.result, c.result]); return { nested, detached };
      });
      assert(removed.nested && !removed.detached, '중첩·강제 제거된 창에도 배경 정지가 남지 않는다');
    }
    report.departure = await page.evaluate(() => {
      const s = G.Game.state, n = s.sailNo || 0;
      s.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat };
      G.Game.go('sea', { depart: 0 }); G.Scenes.sea.runtime().dayAcc = -1e6; G.Scenes.sea.update(1 / 60);
      return { from: s.loc.from, sea: s.loc.mode === 'sea', voyage: s.sailNo === n + 1,
        drawn: G.Ship3D.stats().ready, quality: s.settings.res };
    });
    assert(report.departure.sea && report.departure.voyage && report.departure.drawn && report.departure.quality === 1, '실제 항구 출항 경로·함대 그림·원본 화질 유지');
    await page.evaluate(() => G.Game.go('title'));
    assert.equal(await page.evaluate(() => G.Ship3D.stats().ready), false, '항해·해전을 떠나면 그래픽 자원 해제');
    report.errors = errors; assert.deepStrictEqual(errors, [], '브라우저 오류 0');
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
