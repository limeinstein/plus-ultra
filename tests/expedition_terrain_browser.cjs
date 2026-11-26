/* 실제 file:// 육상 장면에서 식생 가림·험지 이동·도하·야영을 확인한다. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const out = process.env.EXPEDITION_TERRAIN_OUT || path.join(root, 'artifacts/world-detail-20261125/expedition-visibility');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files', '--use-angle=d3d11', '--enable-gpu'] });
  const errors = [];
  try {
    fs.mkdirSync(out, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.setDefaultTimeout(35000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction(() => G.Game.geoReady && document.querySelector('.title-wrap .loading.done') && !G.Loader.shown());
    await page.evaluate(async () => {
      await G.Game.prepareRenderer();
      requestAnimationFrame = () => 0;
      const sk = {}; G.SKILLS.forEach(x => sk[x.id] = 1);
      const s = G.Game.state = G.State.newGame({ name: '험지 탐험 시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
      s.flags.prologue = true; s.fleet.crew = 60; s.fleet.food = s.fleet.water = 2000;
      s.date = { y: 1480, m: 5, d: 15 };
      G.State.save = () => {}; G.State.surveyChart = () => {}; G.UI.toast = () => {};
      if (G.OlympianApostles) G.OlympianApostles.onLand = async () => false;
      G.Game.go('land', { from: 0 });
      window.reviewLand = {
        set(lon, lat, zoom, dir) {
          const st = G.Scenes.land.runtime();
          Object.assign(s.loc, { lon, lat, heading: dir ? Math.atan2(dir[1], dir[0]) : 0, mount: { id: 'walk', n: 0 } });
          Object.assign(st.cam, { lon, lat, zoom, zoomT: 0 });
          Object.assign(st, { paused: !dir, dir, path: null, dayAcc: -1e6, busy: 0, trail: [], unit: {}, pxs: 0, gph: 0, movT: 0, speed: 1, effort: null, camping: false });
          return st;
        },
        tick(st, count) {
          const samples = [];
          for (let i = 0; i < count; i++) {
            const t = performance.now();
            st.rframe = 5; G.Scenes.land.update(1 / 60); G.Game.renderer.gl.finish();
            samples.push(performance.now() - t);
          }
          samples.sort((a, b) => a - b);
          return samples[Math.floor(samples.length * .95)];
        },
        syncHud() { G.Scenes.land.refreshHud(); },
        get campButton() { return [...document.querySelectorAll('.land-bar button')].find(b => b.textContent.trim() === '야영'); },
        get state() { return s; }
      };
    });
    await page.evaluate(() => G.TerrainArt.ready);
    await page.waitForFunction(() => G.ExpeditionFormation.canDraw({ mount: { id: 'walk', n: 0 }, party: 4 }), null, { polling: 100 });
    const forest = await page.evaluate(() => {
      const view = reviewLand;
      let best = null;
      for (const lon of [-55.76, -55.62, -55.48, -55.34, -55.2, -54.8, -54.66, -54.52]) {
        for (const lat of [-3.3, -3.18, -3.06, -2.94]) {
          if (G.Geo.terrain(lon, lat) !== 'jungle' || !G.Geo.canWalk(lon, lat)) continue;
          const st = view.set(lon, lat, 540, null);
          view.tick(st, 3);
          const items = st.unitItems || [], leader = items.find(m => m.leader), count = items.filter(m => m.covered).length;
          const score = count + (leader && leader.covered ? 3 : 0);
          if (!best || score > best.score) best = { lon, lat, score, count, leader: !!(leader && leader.covered) };
          if (score >= 6) return best;
        }
      }
      return best;
    });
    const forestFrames = [];
    for (const [zoom, name] of [[170, 'forest-basic'], [540, 'forest-close']]) {
      forestFrames.push(await page.evaluate(({ forest, zoom }) => {
        const view = reviewLand, st = view.set(forest.lon, forest.lat, zoom, null);
        view.tick(st, 20);
        for (let i = 0; i < 80 && G.TerrainArt.stats().pendingChunks; i++) view.tick(st, 1);
        const p95Ms = view.tick(st, 30);
        view.syncHud();
        return { zoom, p95Ms, visible: st.unitItems.filter(m => m.im).length, covered: st.unitItems.filter(m => m.covered).length };
      }, { forest, zoom }));
      await page.screenshot({ path: path.join(out, name + '.png') });
    }
    const slope = await page.evaluate(() => {
      const h = (lon, lat) => G.Terrain.sample(lon, lat).elevation;
      let best = null;
      for (let lon = 7.82; lon < 8.42; lon += .035) for (let lat = 46.28; lat < 46.67; lat += .035) {
        if (G.Geo.terrain(lon, lat) !== 'mountain') continue;
        const z = h(lon, lat);
        for (const dir of [[1, 0], [-1, 0], [.8, .6], [.8, -.6], [-.8, .6], [-.8, -.6]]) {
          const [x, y] = dir, d = .058, a = h(lon - x * d, lat - y * d), b = h(lon + x * d, lat + y * d);
          const score = Math.min(z - a, b - z);
          if (score > 0 && (!best || score > best.score) && G.Geo.canWalk(lon + x * d, lat + y * d) && G.Geo.canWalk(lon - x * d, lat - y * d)) best = { lon, lat, dir, score };
        }
      }
      return best;
    });
    assert(slope && slope.score > 100, '양쪽에 고도차가 있는 통행 가능한 산사면');
    const movement = [];
    for (const [name, k] of [['climb', 1], ['descent', -1], ['plain', 0]]) {
      movement.push(await page.evaluate(({ name, slope, k }) => {
        const view = reviewLand, [lon, lat] = k ? [slope.lon, slope.lat] : [-98.4, 39.5], dir = k ? slope.dir.map(x => x * k) : [1, 0];
        const st = view.set(lon, lat, 540, dir), loc = view.state.loc;
        const start = G.Terrain.sample(lon, lat).elevation;
        view.tick(st, 12);
        const p95Ms = view.tick(st, 25);
        view.syncHud();
        const lead = st.unitItems.find(m => m.leader);
        return { name, p95Ms, effort: st.effort.value, grade: st.effort.grade, lean: lead.lean, gait: lead.gait,
          width: st.unit.formation.width, distance: G.Geo.dist(lon, lat, loc.lon, loc.lat), rise: G.Terrain.sample(loc.lon, loc.lat).elevation - start, dir };
      }, { name, slope, k }));
      await page.screenshot({ path: path.join(out, name + '.png') });
    }
    const ford = await page.evaluate(() => {
      const hydro = G.Hydro;
      for (const id of ['nile', 'niger', 'amazon', 'seine', 'danube']) {
        const route = hydro.routes().find(r => r.id === id);
        for (let i = 1; i < route.pts.length; i++) {
          const a = route.pts[i - 1], b = route.pts[i], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
          const dir = [-dy / len, dx / len];
          for (const t of [.5, .65, .35]) {
            const lon = a[0] + dx * t, lat = a[1] + dy * t, center = hydro.landEffect(lon, lat);
            if (G.Geo.baseSdf(lon, lat) < .45 * G.Geo.TEX_PER_DEG) continue;
            if (!center.allowed || center.bridge || !center.river || center.river.route !== route || center.river.width < 250) continue;
            const reach = center.river.half / Math.cos(lat * Math.PI / 180) * 1.45;
            const at = d => [lon + d * dir[0], lat + d * dir[1]];
            const start = at(-reach), end = at(reach), samples = Array.from({ length: 31 }, (_, i) => hydro.landEffect(...at(reach * (i / 15 - 1))));
            if (samples.every(e => e.allowed && !e.bridge) && !samples[0].river && !samples.at(-1).river) return { name: route.name, lon, lat, start, end, dir, reach };
          }
        }
      }
      return null;
    });
    assert(ford, '양쪽 둑을 걸어서 통과할 수 있는 큰 강');
    const wading = await page.evaluate(ford => {
      const view = reviewLand, st = view.set(...ford.start, 540, ford.dir), loc = view.state.loc;
      const sample = () => {
        const lead = st.unitItems.find(it => it.leader);
        const matchesWater = st.unitItems.every(it => {
          const e = G.Hydro.landEffect(it.worldX, -it.worldY);
          const wading = e.allowed && e.river?.signed < 0 && !e.bridge && !e.frozen;
          return (it.sink > 0) === !!wading;
        });
        return { sink: lead.sink, lean: lead.lean, moving: lead.moving, gait: lead.gait,
          immersion: lead.water ? lead.water.immersion : 0, wetMembers: st.unitItems.filter(it => it.sink > 0).length,
          distance: G.Geo.dist(...ford.start, loc.lon, loc.lat), campEnabled: !view.campButton.disabled, matchesWater };
      };
      view.tick(st, 1);
      const bank = sample(); let entry, mid;
      for (let i = 0; i < 750 && !st.paused; i++) {
        view.tick(st, 1); const now = sample();
        if (!entry && now.immersion > .14) entry = now;
        if (now.immersion > .98) { mid = now; break; }
      }
      view.syncHud(); window.reviewFord = { st, sample };
      return { bank, entry, mid };
    }, ford);
    await page.screenshot({ path: path.join(out, 'river-ford.png') });
    wading.exit = await page.evaluate(() => {
      const { st, sample } = reviewFord;
      for (let i = 0; i < 750 && !st.paused; i++) {
        reviewLand.tick(st, 1); const now = sample();
        if (!now.sink && now.moving) return now;
      }
      return sample();
    });
    const solidCrossings = await page.evaluate(() => {
      const view = reviewLand, date = view.state.date, hydro = G.Hydro;
      const bridge = hydro.routes().flatMap(r => r.crossings.map(c => hydro.at(c.lon, c.lat, r))).find(q => q && hydro.landEffect(...q.point).bridge);
      const dvina = hydro.routes().find(r => r.id === 'northerndvina'), last = dvina.pts.at(-1), prev = dvina.pts.at(-2);
      const frozen = [(last[0] + prev[0]) / 2, (last[1] + prev[1]) / 2];
      function stand(p, flag) {
        const st = view.set(...p, 540, null);
        view.tick(st, 5);
        return { terrain: !!hydro.landEffect(...p)[flag], sink: st.unitItems.find(it => it.leader).sink };
      }
      const bridgeTest = bridge && stand(bridge.point, 'bridge');
      view.state.date = { y: date.y, m: 1, d: 15 };
      const frozenTest = stand(frozen, 'frozen');
      view.state.date = date;
      return { bridge: bridgeTest, frozen: frozenTest };
    });
    const woodland = await page.evaluate(() => {
      let best;
      for (const [west, south] of [[24, 56.5], [8, 47], [17, 49], [12, 59]]) {
        for (let x = west; x <= west + 2; x += .12) for (let y = south; y <= south + 2; y += .12) {
          if (![x - .2, x, x + .24].every(lon => G.Geo.terrain(lon, y) === 'forest' && G.Geo.canWalk(lon, y))) continue;
          const st = reviewLand.set(x, y, 540, null);
          reviewLand.tick(st, 4);
          const covered = st.unitItems.filter(it => it.covered).length;
          if (!best || covered > best.covered) best = { x, y, covered };
          if (covered === 4) return best;
        }
      }
      return best;
    });
    assert(woodland?.covered >= 2, '걸어서 지날 수 있는 온대 숲');
    const mounts = await page.evaluate(() => Object.keys(G.MOUNTS).map(id => ({ id, n: id === 'walk' ? 0 : 60 })));
    mounts.push({ id: 'wagon', n: 60, draft: 'ox' }, { id: 'camel', n: 60, style: 'pe' });
    const mounted = [];
    for (const mount of mounts) {
      const variant = mount.draft || mount.style || mount.id;
      await page.evaluate(({ woodland, mount }) => {
        reviewLand.set(woodland.x, woodland.y, 540, [1, 0]);
        reviewLand.state.loc.mount = mount;
        G.Party.preloadSprites(mount.id);
      }, { woodland, mount });
      await page.waitForFunction(() => G.ExpeditionFormation.canDraw(G.Game.state.loc) && G.ExpeditionMotion.ready(G.Game.state.loc.mount.id, 'camp'), null, { polling: 100 });
      const walk = await page.evaluate(woodland => {
        const view = reviewLand, st = G.Scenes.land.runtime(), loc = view.state.loc;
        let covered = 0, pitch = 0; const poses = new Set();
        for (let i = 0; i < 48; i++) {
          view.tick(st, 1);
          const leader = st.unitItems.find(it => it.leader);
          covered = Math.max(covered, st.unitItems.filter(it => it.covered).length);
          pitch = Math.max(pitch, Math.abs(leader.pitch));
          poses.add(leader.frame);
        }
        view.syncHud();
        return { distance: G.Geo.dist(woodland.x, woodland.y, loc.lon, loc.lat), poses: poses.size, pitch, covered,
          count: st.unitItems.filter(it => it.im).length, kind: st.unitItems.find(it => it.leader).kind };
      }, woodland);
      if (['horse', 'wagon', 'elephant'].includes(variant)) await page.screenshot({ path: path.join(out, `forest-${variant}.png`) });
      await page.getByRole('button', { name: '야영', exact: true }).click();
      const closeCamp = page.getByRole('button', { name: /^그만둔다/ });
      await closeCamp.waitFor({ state: 'visible' });
      if (variant === 'horse' || variant === 'elephant') await page.waitForFunction(() => {
        const st = G.Scenes.land.runtime();
        reviewLand.tick(st, 1);
        return st.unitItems.some(it => it.parked && it.im);
      }, null, { polling: 100 });
      const camp = await page.evaluate(() => {
        const st = G.Scenes.land.runtime(), loc = reviewLand.state.loc;
        const before = [loc.lon, loc.lat], frames = new Set();
        for (let i = 0; i < 24; i++) {
          reviewLand.tick(st, 1);
          frames.add(st.unitItems.find(it => it.camp)?.frame);
        }
        const shelter = st.unitItems.find(it => it.camp), park = st.unitItems.find(it => it.parked);
        return { camping: st.camping, shelter: !!shelter?.im, covered: !!shelter?.covered, frames: frames.size,
          parked: park?.parked, parkedType: park?.m.t, draft: park?.m.draft, species: park?.m.sp,
          still: loc.lon === before[0] && loc.lat === before[1], blocked: G.UI.busy(),
          status: document.querySelector('.status-strip').textContent.includes('야영 중') };
      });
      if (['horse', 'wagon', 'elephant'].includes(variant)) await page.screenshot({ path: path.join(out, `camp-${variant}.png`) });
      await closeCamp.click();
      await page.waitForFunction(() => !G.Scenes.land.runtime().camping);
      const resumed = await page.evaluate(() => {
        const st = G.Scenes.land.runtime();
        reviewLand.tick(st, 4);
        return st.unitItems.length === 4 && !st.unitItems.some(it => it.camp);
      });
      mounted.push({ variant, mount: mount.id, walk, camp, resumed });
      console.log('숲 이동·야영 확인', variant, walk.distance.toFixed(3), camp.parked || '도보');
    }
    const campGroundChecks = await page.evaluate(async ({ ford: { lon, lat, end }, mounts }) => {
      const view = reviewLand, ask = G.UI.ask, toast = G.UI.toast;
      let opened = 0, note = '';
      G.UI.ask = async () => { opened++; return null; };
      G.UI.toast = message => { note = message; };
      try {
        const checks = [];
        const places = [...mounts.map(mount => ['river', lon, lat, mount]), ['lake', -87, 44.5], ['sea', -30, 28], ['bank', ...end]];
        for (const [name, x, y, mount] of places) {
          const st = view.set(x, y, 540, null), loc = view.state.loc;
          if (mount) loc.mount = mount;
          const before = opened;
          note = '';
          G.Scenes.land.refreshBar();
          const button = view.campButton;
          await G.Scenes.land._test.camp();
          checks.push({ name, mount: G.ExpeditionFormation.variant(loc), terrain: G.Geo.terrain(x, y), lake: G.Terrain.isLake(x, y),
            disabled: button.disabled && button.getAttribute('aria-disabled') === 'true',
            opened: opened > before, note, stayed: loc.lon === x && loc.lat === y && !st.camping && !st.busy });
        }
        return checks;
      } finally { G.UI.ask = ask; G.UI.toast = toast; }
    }, { ford, mounts });
    const mountedFords = [];
    for (const mount of mounts.filter(m => m.id !== 'walk')) {
      await page.evaluate(({ ford, mount }) => {
        reviewLand.set(...ford.start, 540, ford.dir);
        reviewLand.state.loc.mount = mount;
        G.Party.preloadSprites(mount.id);
      }, { ford, mount });
      await page.waitForFunction(() => G.ExpeditionFormation.canDraw(G.Game.state.loc), null, { polling: 100 });
      mountedFords.push(await page.evaluate(({ ford, id }) => {
        const view = reviewLand, st = G.Scenes.land.runtime();
        const variant = G.ExpeditionFormation.variant(view.state.loc);
        const deep = G.Hydro.landEffect(ford.lon, ford.lat), max = { sink:0 };
        for (let i = 0; i < 330 && !st.paused; i++) {
          view.tick(st, 1);
          const it = st.unitItems.find(it => it.leader);
          if (it && it.sink > max.sink) Object.assign(max, { sink:it.sink, kind:it.kind, gait:it.gait });
          if (it?.water?.immersion > .97) break;
        }
        view.syncHud();
        const { lon, lat } = view.state.loc;
        return { id, variant, allowed:deep.allowed, stopped:st.paused, distance:G.Geo.dist(...ford.start, lon, lat), ...max };
      }, { ford, id: mount.id }));
      if (mount.id === 'horse') await page.screenshot({ path: path.join(out, 'river-horse.png') });
    }
    const report = { forest, forestFrames, slope, movement, ford, wading, solidCrossings, woodland, mounted, campGroundChecks, mountedFords, errors };
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ woodland, campGroundChecks, mountedFords, errors }));
    assert(forest.leader && forestFrames.every(r => r.visible === 4) && forestFrames[1].covered >= 2, '밀림에서 가려진 대원과 조종 표시가 나온다');
    const [up, down, plain] = movement;
    assert(up.rise > 50 && down.rise < -50 && up.grade > .35 && down.grade < -.35, '실제 고도차에 맞춰 오르막과 내리막을 가른다');
    assert(up.lean * up.dir[0] > .07 && down.lean * down.dir[0] < 0 && plain.effort < .3, '등반은 앞으로 숙이고 하산은 뒤로 버틴다');
    assert(up.gait === 'walk' && down.gait === 'walk' && up.width < plain.width, '험지에서 걷기와 좁은 대열이 적용된다');
    assert(wading.bank.sink === 0 && wading.entry?.sink > 1 && wading.mid?.sink > 14, '둑에서 강 가운데까지 다리가 점차 잠긴다');
    assert(wading.mid.gait === 'walk' && wading.exit.sink === 0 && wading.exit.wetMembers > 0 && Object.values(wading).every(r => r.matchesWater), '나일강 폭과 대원마다 다른 발 위치에 맞춰 물을 건넌다');
    assert(solidCrossings.bridge.terrain && solidCrossings.bridge.sink === 0 && solidCrossings.frozen.terrain && solidCrossings.frozen.sink === 0, '다리와 결빙 수로에서는 발이 잠기지 않는다');
    for (const { mount, variant, walk, camp, resumed } of mounted) {
      assert(walk.count === 4 && walk.covered >= 2 && walk.distance > .025 && walk.poses > 1, '숲에서 이동·가림·보행 자세 ' + variant);
      if (mount === 'wagon' || mount === 'reindeer') assert(walk.pitch > 0, '수레가 바퀴 축을 중심으로 기운다 ' + variant);
      assert(camp.camping && camp.shelter && camp.frames > 1 && camp.still && camp.blocked && camp.status && resumed, '게임 야영 시작·멈춤·복귀 ' + variant);
      if (mount !== 'walk' && mount !== 'porter') assert.equal(camp.parked, mount, '같은 탈것이 쉬는 모습 ' + variant);
    }
    assert(mounted.find(r => r.variant === 'ox').camp.draft === 'ox' && mounted.find(r => r.variant === 'pe').camp.species === 'camel2', '지역별 마차와 낙타가 야영에도 남는다');
    assert(mounted.some(r => r.camp.covered), '숲 식생이 야영지 일부를 가린다');
    assert(wading.bank.campEnabled && !wading.entry.campEnabled && !wading.mid.campEnabled && wading.exit.campEnabled, '강에 들어가면 야영 버튼이 꺼지고 둑에서는 다시 켜진다');
    const riverCamps = campGroundChecks.filter(r => r.name === 'river');
    const [lakeCamp, seaCamp, bankCamp] = campGroundChecks.slice(-3);
    assert(riverCamps.length === mounts.length && riverCamps.every(r => r.terrain === 'river') && lakeCamp.lake && seaCamp.terrain === 'sea', '실제 강·호수·바다 좌표를 사용한다');
    assert([...riverCamps, lakeCamp, seaCamp].every(r => r.disabled && !r.opened && r.note.includes('마른 땅') && r.stayed), '물에서는 탈것에 관계없이 야영을 막는다');
    assert(!bankCamp.disabled && bankCamp.opened && bankCamp.stayed, '마른 둑에서는 현재 위치에 야영을 열 수 있다');
    for (const r of mountedFords) {
      if (r.id === 'wagon') assert(!r.allowed && r.stopped, '큰 강에 진입하기 전에 마차가 멈춘다 ' + r.variant);
      else assert(r.allowed && r.distance > .008 && r.sink > 5 && r.kind === r.variant && r.gait === 'walk', '도하 중 탈것에 맞는 잠김과 발걸음 ' + r.variant);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
