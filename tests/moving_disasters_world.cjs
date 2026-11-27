/* 항해·탐험 화면에서 바람 재해를 우회하거나 통과할 때의 차이를 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.OUT || process.env.DISASTER_OUT || path.join(root, 'artifacts/moving-disasters-20261127'));

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      await G.TerrainArt.ready;
      G.State.save = () => false;
      G.State.saveAsync = async () => ({ ok: false });
      G.UI.busy = () => false;
      G.UI.say = async () => {};
      G.UI.ask = async () => null;
      G.UI.toast = message => window.windNotices.push(message);
      G.Disc.checkLand = () => ({ hits: [] });
      G.Explore.sense = () => [];
      G.U.chance = () => false;
      G.BALANCE.disaster.random = 0;
      window.windNotices = [];
      window.setupWind = async (sea, event = true) => {
        const s = G.Game.state = G.State.newGame({
          name: '바람 재해 검사', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 },
          st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal'
        });
        s.date = { y: 1480, m: 7, d: 10 };
        s.flags.prologue = true;
        Object.assign(s.settings, { res: .65, sound: 0, music: 0, landSpeed: 1 });
        s.player.gold = 100000;
        Object.assign(s.fleet, { ships: [G.R.newShip('caravel')], crew: 60, food: 1200, water: 1200, fatigue: 25, discipline: 80 });
        const [lon, lat] = sea ? [-62, 25] : [-101, 36.4];
        const mode = sea ? 'sea' : 'land';
        const scene = G.Scenes[mode];
        if (sea) {
          s.loc = { mode, lon, lat, heading: 0 };
          await G.Game.go(mode, { fresh: true });
        } else {
          await G.Game.go(mode, { from: 0 });
          Object.assign(s.loc, { lon, lat, heading: 0 });
        }
        const state = scene.runtime();
        Object.assign(state.cam, { lon, lat, zoom: sea ? 330 : 380, zoomT: 0 });
        Object.assign(state, { paused: true, busy: 0, dayAcc: -1e6, t: 8, rframe: 2, npcs: [], tipScan: Infinity });
        if (sea) {
          state.wind = { dir: 0, spd: .65, calm: false };
          state.windVis = { ...state.wind };
        }
        const kind = sea ? 'hurricane' : 'tornado';
        const e = event && G.Disaster.start({ kind, lon: lon + (sea ? 1.38 : .64), lat: lat + (sea ? .54 : .32),
          heading: -Math.PI / 2, speed: sea ? .285 : .22, curve: 0, sev: 2, r: sea ? .81 : .31 });
        window.windTrial = { s, scene, sea, state, e, lon, lat, kind };
        window.windFrames = (n, dt = .035) => {
          for (let i = 0; i < n; i++) { state.rframe = state.paused ? 1 : 2; scene.update(dt); }
        };
        scene.refreshHud();
      };
      window.windReport = () => {
        const { s, e, lon, lat, kind, sea } = window.windTrial;
        return {
          kind, hp: s.fleet.ships[0].hp, fatigue: s.fleet.fatigue, discipline: s.fleet.discipline,
          move: G.Geo.dist(lon, lat, s.loc.lon, s.loc.lat),
          drift: e ? G.Geo.dist(lon + (sea ? 1.38 : .64), lat + (sea ? .54 : .32), e.lon, e.lat) : 0,
          warnings: window.windNotices.filter(t => t.includes(e ? e.name : G.DISASTER_KINDS[kind].name)),
          hud: [...document.querySelectorAll('.status-strip, .landstatus')].map(el => el.innerText).join(' ')
        };
      };
    });

    const reports = [];
    for (const sea of [true, false]) {
      const name = sea ? 'hurricane' : 'tornado';
      await page.evaluate(async isSea => {
        window.windNotices.length = 0;
        await window.setupWind(isSea);
        window.windFrames(9);
      }, sea);
      const initial = await page.evaluate(() => window.windReport());
      assert(initial.warnings.length === 1 && initial.discipline === 80 && initial.fatigue === 25);
      const animation = await page.evaluate(isSea => {
        const e = window.windTrial.e, canvas = document.createElement('canvas');
        canvas.width = canvas.height = 450;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const zoom = isSea ? 210 : 360, draw = isSea ? G.Disaster.drawTravelSea : G.Disaster.drawLand;
        const toScreen = (lon, lat) => [225 + G.Geo.wrapLon(lon - e.lon) * zoom, 249 - (lat - e.lat) * zoom];
        function frame(t) {
          ctx.fillStyle = isSea ? '#173a4e' : '#96805b';ctx.fillRect(0, 0, canvas.width, canvas.height);
          draw(ctx, toScreen, zoom, t, 'serif');
          return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        }
        const a = frame(2.18), b = frame(2.31);
        let changed = 0;
        for (let i = 0; i < a.length; i += 4) {
          if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) changed++;
        }
        return { pixelsWithMotion: changed };
      }, sea);
      assert(animation.pixelsWithMotion > 180, name + ' 중심이 고정된 상태에서 회전·바람이 움직이는가');
      if (!sea) await page.waitForFunction(() => {
        window.windFrames(1, 0);
        return window.windTrial.state.unitItems?.length > 0;
      }, null, { polling: 100, timeout: 15000 });
      await page.screenshot({ path: path.join(out, name + '.png') });

      if (sea) {
        await page.evaluate(() => { G.Scenes.sea.takeCourse(Math.PI / 2); window.windFrames(115); });
      } else {
        await page.keyboard.down('ArrowUp');
        await page.evaluate(() => window.windFrames(115));
        await page.keyboard.up('ArrowUp');
      }
      const avoided = await page.evaluate(() => window.windReport());
      assert(avoided.move > .20 && avoided.drift > .20, name + ' 조작과 재해 이동');
      assert(avoided.hp === initial.hp && avoided.fatigue === initial.fatigue && avoided.discipline === initial.discipline, name + ' 우회');

      await page.evaluate(async isSea => {
        window.windNotices.length = 0;
        await window.setupWind(isSea);
        const s = window.windTrial.s;
        s.dis = JSON.parse(JSON.stringify(s.dis));
        window.windTrial.e = s.dis.act[0];
      }, sea);
      if (sea) {
        await page.evaluate(() => { G.Scenes.sea.takeCourse(0); window.windFrames(134); });
      } else {
        await page.keyboard.down('ArrowRight');
        await page.evaluate(() => window.windFrames(109));
        await page.keyboard.up('ArrowRight');
      }
      const hit = await page.evaluate(() => window.windReport());
      assert(hit.move > .24 && hit.drift > .20, name + ' 저장 복원 후 이동');
      assert(hit.discipline < initial.discipline && hit.fatigue > initial.fatigue && hit.warnings.some(t => t.includes('휘말렸다')), name + ' 피해');
      assert(sea ? hit.hp < initial.hp : hit.hp === initial.hp, name + ' 항해·육상별 피해');
      reports.push({ name, initial, animation, avoided, hit });
    }

    const other = await page.evaluate(async () => {
      const d = G.Disaster;
      const spawned = [];
      for (const sea of [true, false]) {
        await window.setupWind(sea, false);
        G.BALANCE.disaster.random = 1;
        G.U.chance = () => true;
        const s = G.Game.state, { lon, lat } = s.loc;
        d.travelStep(.05, lon, lat, true);
        G.U.chance = () => false;
        G.BALANCE.disaster.random = 0;
        spawned.push(d.active().filter(e => e.wind).map(e => e.kind));
      }
      await window.setupWind(false, false);
      const s = G.Game.state, l = s.loc, x = l.lon, y = l.lat;
      const e = d.start({ kind: 'tornado', lon: x, lat: y, heading: 0, speed: 0, curve: 0, r: .14, days: 1 });
      l.lon = x + .28;
      const exactCross = d.travelStep(.12, x - .28, y, false);
      d.travelStep(1, l.lon, l.lat, false);
      return { spawned, exactCross, expired: !d.active().includes(e) };
    });
    const meta=await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'}));
    if(process.env.EXPECT_VERSION)assert.equal(meta.version,process.env.EXPECT_VERSION);
    fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify({ ...meta, reports, other, errors }, null, 2));
    assert.deepEqual(other.spawned, [['hurricane'], ['tornado']]);
    assert(other.exactCross && other.expired);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ ...meta, reports, other, errors }));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
