/* 검정·와인 돛: 전 선종, 대체 그림, 네임드 해적의 항해→해전·저장 복원 연결. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
let pw; try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..'), OUT = process.env.OUT || path.join(ROOT, 'artifacts/pirate-sails-20261119');
const integrationOnly = (process.argv.includes('--integration-only') || !!process.env.WEB_BASE);
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], report = {};
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    await page.addInitScript(() => {
      window.requestAnimationFrame = () => 0;
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type) { const gl = get.apply(this, arguments); if (type === 'webgl2' && gl) window.__shipGL = gl; return gl; };
    });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    if (!integrationOnly) {
    await page.goto(pathToFileURL(path.join(ROOT, 'test_ships_3d.html')).href, { waitUntil: 'domcontentloaded' });
    const finish = await page.evaluate(() => {
      const cv = document.createElement('canvas'); cv.width = 700; cv.height = 450;
      const ctx = cv.getContext('2d'), atlas = document.createElement('canvas'); atlas.width = 1400; atlas.height = 1800;
      const ax = atlas.getContext('2d'), checks = [], Renderer = G.Three.WebGLRenderer;
      let materials;
      G.Ship3D.dispose();
      G.Three.WebGLRenderer = function (options) {
        const renderer = new Renderer(options), render = renderer.render;
        renderer.render = function (scene) {
        const result = render.apply(this, arguments), seen = new Set(); materials = [];
        scene.traverse(o => { const m = o.material; if (m && m.userData.shipArtRole && !seen.has(m)) {
          seen.add(m); materials.push([m.userData.shipArtRole, m.roughness, m.shininess, m.emissive && m.emissive.getHex()]);
        } }); return result;
        }; return renderer;
      };
      function draw(spec) {
        ctx.clearRect(0, 0, 700, 450); ctx.fillStyle = '#254a5b'; ctx.fillRect(0, 0, 700, 450);
        if (!G.Ship3D.draw(ctx, 350, 370, .58, 310, spec, 1.25)) throw new Error('선체 도색 실패');
        return cv.toDataURL();
      }
      try {
        ['galleon', 'junk', 'geobukseon', 'balsa'].forEach((id, row) => {
          const plain = G.Art.shipLook(id), normal = draw(plain), original = JSON.stringify(materials);
          const black = Object.assign(G.Art.shipLook(id), G.FX.pirateShips.black, { pirateLivery: 'black', sailTint: '#ffffff', flag: null });
          const wine = Object.assign(G.Art.shipLook(id), G.FX.pirateShips.wine, { pirateLivery: 'wine', sailTint: '#ffffff', flag: null });
          const aged = draw(black), blackMats = JSON.stringify(materials), wear = G.FX.pirateShips.black.finish.wear;
          let fresh;
          try { G.FX.pirateShips.black.finish.wear = 0; draw(plain); fresh = draw(black); }
          finally { G.FX.pirateShips.black.finish.wear = wear; }
          draw(plain);
          const gilded = draw(wine), wineMats = JSON.stringify(materials);
          checks.push({ id, hullOnlyDiffers: aged !== gilded, wearVisible: aged !== fresh,
            finishesDiffer: blackMats !== wineMats, ordinaryRestored: draw(plain) === normal && JSON.stringify(materials) === original });
          ['black', 'wine'].forEach((style, col) => {
            draw(Object.assign(G.Art.shipLook(id), G.FX.pirateShips[style], { pirateLivery: style }));
            ax.drawImage(cv, col * 700, row * 450); ax.fillStyle = '#f1dfb4'; ax.font = '22px sans-serif';
            ax.fillText(G.SHIP[id].name + ' · ' + (style === 'black' ? '낡은 검정 선체 · 회은색 장식' : '마호가니 선체 · 청록 선루 · 금박'), col * 700 + 18, row * 450 + 30);
          });
        });
      } finally { G.Three.WebGLRenderer = Renderer; G.Ship3D.dispose(); }
      return { checks, image: atlas.toDataURL() };
    });
    fs.writeFileSync(path.join(OUT, 'hull-finish-closeup.png'), Buffer.from(finish.image.split(',')[1], 'base64'));
    report.finish = finish.checks;
    report.finish.forEach(r => assert(r.hullOnlyDiffers && r.wearVisible && r.finishesDiffer && r.ordinaryRestored, JSON.stringify(r)));
    assert.deepStrictEqual(errors, []);
    if (process.argv.includes('--preview-only')) { console.log('선체 도색·마모·광택·원래 재질 복원 통과'); return; }
    for (const style of ['black', 'wine']) {
      const result = await page.evaluate(style => {
        const cv = document.createElement('canvas'); cv.width = 1800; cv.height = 1620;
        const ctx = cv.getContext('2d'), ids = G.SHIP_TYPES.map(s => s.id), rows = [];
        let npc;
        for (let i = 0; !npc && i < 100; i++) {
          const n = { kind: 'pirate', cap: { id: 'preview-' + i } };
          if (G.Art.pirateLook({}, n).pirateLivery === style) npc = n;
        }
        ids.forEach((id, i) => {
          ctx.save(); ctx.translate(i % 6 * 300, Math.floor(i / 6) * 270);
          ctx.fillStyle = '#254a5b'; ctx.fillRect(0, 0, 300, 270);
          ctx.fillStyle = '#efe1c0'; ctx.font = '16px sans-serif'; ctx.fillText(G.SHIP[id].name, 12, 24);
          const look = G.Art.pirateLook(G.Art.shipLook(id), npc);
          look.rig = { fill: .9, brace: .15, lee: 1 }; look.oarPower = .6;
          if (!G.Ship3D.draw(ctx, 150, 210, .58, 160, look, 1.25)) throw new Error(id + ' 3D 실패');
          rows.push({ id, style: look.pirateLivery, sails: G.Ship3D.stats().sails });
          ctx.strokeStyle = '#6b8391'; ctx.strokeRect(.5, .5, 299, 269); ctx.restore();
        });
        return { rows, image: cv.toDataURL('image/png') };
      }, style);
      fs.writeFileSync(path.join(OUT, style + '-fleet.png'), Buffer.from(result.image.split(',')[1], 'base64'));
      report[style] = result.rows;
      assert.strictEqual(result.rows.length, 36);
      console.log(style + ' · 36종 실제 렌더 완료');
    }
    report.render = await page.evaluate(() => {
      const cv = document.createElement('canvas'); cv.width = 600; cv.height = 500;
      const ctx = cv.getContext('2d'), out = [];
      function pixels(spec, a = .58) {
        ctx.clearRect(0, 0, 600, 500);
        if (!G.Ship3D.draw(ctx, 300, 360, a, 230, spec, 1.25)) throw new Error('3D 실패');
        return cv.toDataURL();
      }
      for (const id of ['galleon', 'galleass', 'dhow', 'junk', 'jong', 'panokseon', 'geobukseon', 'atakebune', 'korakora', 'balsa']) {
        const plain = G.Art.shipLook(id), normal = pixels(plain);
        const black = Object.assign(G.Art.shipLook(id), G.FX.pirateShips.black, { pirateLivery: 'black', sid: 'same-ship' });
        const wine = Object.assign(G.Art.shipLook(id), G.FX.pirateShips.wine, { pirateLivery: 'wine', sid: 'same-ship' });
        const b = pixels(black), w = pixels(wine), resources = G.Ship3D.stats();
        const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5].map(a => pixels(wine, a));
        const folds = [0, .5, 1].map(f => pixels(Object.assign({}, black, { sid: null, furl: f })));
        for (let i = 0; i < 8; i++) pixels(i % 2 ? wine : black);
        const after = G.Ship3D.stats();
        const fallback = [];
        G.FX.ship3d.enabled = false;
        for (const spec of [black, wine]) {
          ctx.clearRect(0, 0, 600, 500);
          if (G.Ship3D.draw(ctx, 300, 300, .58, 200, spec, 1)) throw new Error('3D 비활성 무시');
          if (G.ShipSprite.draw(ctx, 300, 300, .58, 200, spec, 1)) throw new Error('원래 돛의 시트 사용');
          G.Art.shipTop(ctx, 300, 300, .58, 200, spec, 1);
          fallback.push(cv.toDataURL());
        }
        G.FX.ship3d.enabled = true;
        out.push({ id, colorsDiffer: b !== w && normal !== b && normal !== w,
          ordinaryRestored: pixels(plain) === normal, directions: new Set(angles).size, folds: new Set(folds).size,
          stableResources: resources.geometries === after.geometries && resources.textures === after.textures && resources.programs === after.programs,
          fallbackDiffer: fallback[0] !== fallback[1] });
      }
      G.Ship3D.dispose(); return out;
    });
    report.render.forEach(r => {
      assert(r.colorsDiffer && r.ordinaryRestored && r.stableResources && r.fallbackDiffer, JSON.stringify(r));
      assert.strictEqual(r.directions, 4, r.id); assert.strictEqual(r.folds, 3, r.id);
    });
    report.context = await page.evaluate(async () => {
      const cv = document.createElement('canvas'); cv.width = 600; cv.height = 500;
      const ctx = cv.getContext('2d'), look = Object.assign(G.Art.shipLook('galleon'), G.FX.pirateShips.black, { pirateLivery: 'black' });
      function draw() { ctx.clearRect(0, 0, 600, 500); if (!G.Ship3D.draw(ctx, 300, 370, .58, 240, look, 1.25)) throw new Error('복구 후 도색 실패'); return cv.toDataURL(); }
      const before = draw(), gl = window.__shipGL, ext = gl.getExtension('WEBGL_lose_context');
      await new Promise(resolve => { gl.canvas.addEventListener('webglcontextlost', resolve, { once: true }); ext.loseContext(); });
      const lost = G.Ship3D.stats().lost && !G.Ship3D.draw(ctx, 0, 0, 0, 200, look, 1);
      G.Art.shipTop(ctx, 300, 250, .58, 200, look, 1);
      await new Promise(resolve => setTimeout(resolve, 100));
      await new Promise(resolve => { gl.canvas.addEventListener('webglcontextrestored', resolve, { once: true }); ext.restoreContext(); });
      const restored = draw() === before; G.Ship3D.dispose(); return { lost, restored };
    });
    assert(report.context.lost && report.context.restored, '그래픽 장치 손실·복구 도색 유지');
    fs.writeFileSync(path.join(OUT, 'visual-report.json'), JSON.stringify(report, null, 2));
    }
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.State, null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    report.integration = await page.evaluate(() => {
      const s = G.State.newGame({ name: '해적 돛 검사', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state = s; s.settings.res = .35; s.settings.sound = 0; s.settings.music = 0;
      const before = JSON.stringify(s), types = JSON.stringify(G.SHIP_TYPES), pirates = G.Captains.pirates(), counts = {}, examples = {};
      pirates.forEach(p => {
        const a = G.Art.pirateLook(G.Art.shipLook('junk'), { kind: 'pirate', cap: p });
        const b = G.Art.pirateLook(G.Art.shipLook('galleon'), { kind: 'pirate', cap: JSON.parse(JSON.stringify(p)), id: '다른 재등장 ID' });
        if (a.pirateLivery !== b.pirateLivery || !a.sailTint) throw new Error(p.id + ' 도색 유지 실패');
        counts[a.pirateLivery] = (counts[a.pirateLivery] || 0) + 1; examples[a.pirateLivery] = p;
      });
      const unchanged = before === JSON.stringify(s) && types === JSON.stringify(G.SHIP_TYPES);
      const merchant = G.Art.pirateLook(G.Art.shipLook('galleon'), { kind: 'merchant', cap: pirates[0] });
      const original = G.Ship3D.draw, draws = []; let phase = 'sea';
      G.Ship3D.draw = function (ctx, x, y, angle, len, spec, t) {
        draws.push({ phase, type: spec.type, sid: spec.sid, style: spec.pirateLivery || null, tint: spec.sailTint || null });
        return original.apply(this, arguments);
      };
      const scenes = [];
      try {
        for (const style of ['black', 'wine']) {
          const cap = examples[style];
          G.Game.go('sea', { depart: 0, fresh: true });
          const st = G.Scenes.sea.runtime(); st.paused = true; st.manual = true;
          s.loc.lon = -13; s.loc.lat = 36; st.cam.lon = -13; st.cam.lat = 36;
          const npc = { id: 'named-' + style, kind: 'pirate', cap, zone: 'atl', n: 2, ships: ['galleon', 'junk'],
            lon: -12.6, lat: 36, heading: .58, spd: 0, hostile: true, life: 10 };
          st.npcs = [npc]; phase = 'sea-' + style;
          for (let i = 0; i < 6; i++) G.Scenes.sea.update(0);
          G.Game.go('battle', { npc }); const battle = G.Scenes.battle.runtime(); battle.paused = true; battle.cameraMode = 'overview';
          phase = 'battle-' + style; G.Scenes.battle.update(0);
          const saved = G.Scenes.battle.snapshot();
          G.Game.go('battle', { battle: JSON.parse(JSON.stringify(saved)) });
          G.Scenes.battle.runtime().cameraMode = 'overview'; phase = 'restored-' + style; G.Scenes.battle.update(0);
          scenes.push({ style, cap: cap.id });
        }
      } finally { G.Ship3D.draw = original; G.Game.go('title'); }
      return { counts, scenes, draws, unchanged, merchantUnchanged: !merchant.pirateLivery && !merchant.sailTint,
        disposed: !G.Ship3D.stats().ready };
    });
    const integration = report.integration;
    assert(integration.unchanged && integration.merchantUnchanged && integration.disposed);
    assert(integration.counts.black > 0 && integration.counts.wine > 0);
    for (const style of ['black', 'wine']) for (const phase of ['sea', 'battle', 'restored']) {
      const draws = integration.draws.filter(d => d.phase === phase + '-' + style && d.style === style);
      assert(draws.some(d => d.type === 'galleon') && draws.some(d => d.type === 'junk'), phase + ' ' + style);
    }
    assert(integration.draws.some(d => !d.style && !d.tint), '아군 기본 돛 유지');
    assert.deepStrictEqual(errors, []);
    report.errors = errors; fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    if (fs.existsSync(path.join(OUT, 'failure.json'))) fs.unlinkSync(path.join(OUT, 'failure.json'));
    console.log((integrationOnly ? '통합 검사 통과' : '통과 · 72종 도색 렌더') + ' · 방향/접기/대체 그림/자원 · 전체 네임드 · 항해/해전/저장 복원 · 콘솔 오류 0');
  } catch (e) {
    fs.writeFileSync(path.join(OUT, 'failure.json'), JSON.stringify({ report, errors, error: e.stack }, null, 2)); throw e;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
