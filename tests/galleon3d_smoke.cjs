/* 갤리온 시제품: 방향·돛·메모리·그림 장치 복구·실제 항해 연결을 file://에서 검사한다.
   NODE_PATH=<playwright 설치 경로> node tests/galleon3d_smoke.cjs */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const GPU = process.env.GALLEON_GPU === '1';
const OUT = path.join(ROOT, 'artifacts/galleon3d-20261031' + (GPU ? '/gpu' : ''));
fs.mkdirSync(OUT, {recursive: true});

(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined),
    args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader']});
  const errors = [], report = {mode: GPU ? 'GPU' : 'SwiftShader'};
  try {
    const page = await browser.newPage({viewport: {width: 1320, height: 1060}});
    await page.addInitScript(() => {
      window.requestAnimationFrame = () => 0;
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        const result = getContext.call(this, type, ...args);
        if (type === 'webgl2' && result) window.__galleonGL = result;
        return result;
      };
    });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'test_galleon_3d.html')).href);
    assert.deepStrictEqual(errors, [], '비교 화면 스크립트 로드 오류');
    await page.waitForFunction(() => G.Galleon3D && (G.Galleon3D.stats().frames > 0 || G.Galleon3D.stats().failure), null, {timeout: 60000, polling: 100});
    report.initial = await page.evaluate(() => G.Galleon3D.stats());
    assert(report.initial.frames > 0, JSON.stringify({initial: report.initial, errors}));
    report.renderer = await page.evaluate(() => { const gl = window.__galleonGL, ext = gl.getExtension('WEBGL_debug_renderer_info'); return gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER); });
    await page.screenshot({path: path.join(OUT, 'comparison.png')});
    report.motion = await page.evaluate(() => {
      const render = G.GalleonPreview.render, cv = document.getElementById('live'), ctx = cv.getContext('2d');
      function hash() { const a = ctx.getImageData(0, 0, cv.width, cv.height).data; let h = 0; for (let i = 0; i < a.length; i += 4) h = (Math.imul(h, 31) + a[i] + a[i + 1] * 3 + a[i + 2] * 7) | 0; return h; }
      const out = [];
      for (const a of [0, 1, 22, 23, 45, 90, 135, 180, 225, 270, 315, 359]) {
        document.getElementById('heading').value = a; render(1.25, 1); out.push({a, hash: hash()});
      }
      document.getElementById('heading').value = 35;
      const folds = [];
      for (const f of [0, 50, 100]) { document.getElementById('furl').value = f; render(1.25, 1); folds.push(hash()); }
      const state = JSON.stringify({spec: G.SHIP_ART.galleon, type: G.SHIP.galleon});
      const initial = G.Galleon3D.stats();
      for (let i = 0; i < 80; i++) { document.getElementById('heading').value = (i * 4.5) % 360; render(i / 30, 1 / 30); }
      return {directions: out, folds, before: initial, after: G.Galleon3D.stats(), dataUnchanged: state === JSON.stringify({spec: G.SHIP_ART.galleon, type: G.SHIP.galleon}), globals: {THREE: typeof window.THREE, Ship3D: typeof window.Ship3D}};
    });
    assert.strictEqual(new Set(report.motion.directions.map(x => x.hash)).size, 12, '방향이 연속해서 달라져야 한다');
    assert.strictEqual(new Set(report.motion.folds).size, 3, '돛 0·50·100%가 달라야 한다');
    assert.strictEqual(report.motion.before.geometries, report.motion.after.geometries, '동작 중 모형 수 증가');
    assert.strictEqual(report.motion.before.textures, report.motion.after.textures, '동작 중 재질 그림 수 증가');
    assert(report.motion.dataUnchanged, '선박 규칙 자료 변조');
    assert.deepStrictEqual(report.motion.globals, {THREE: 'undefined', Ship3D: 'undefined'});
    await page.evaluate(() => { document.getElementById('heading').value = 135; document.getElementById('furl').value = 100; G.GalleonPreview.render(2, 1); });
    await page.waitForTimeout(180);
    await page.evaluate(() => G.GalleonPreview.render(2, 1));
    await page.screenshot({path: path.join(OUT, 'furled.png')});
    // 선미·선수·측면과 접은 돛을 큰 화면에 남겨 장식의 겹침과 실루엣을 검토한다.
    const artBoard = await page.evaluate(() => {
      const cv = document.createElement('canvas'); cv.width = 1800; cv.height = 1200;
      const ctx = cv.getContext('2d');
      const views = [
        {a: .61, f: 0, name: '선미 회랑 · 금박 장식'},
        {a: 5.55, f: 0, name: '선수 · 닻 · 목재 난간'},
        {a: 0, f: 0, name: '현측 · 돛천 솔기와 곡면'},
        {a: 2.35, f: 1, name: '갑판 · 구명정 · 계단 · 격자 덮개'}
      ];
      views.forEach((v, i) => {
        ctx.save(); ctx.translate((i % 2) * 900, Math.floor(i / 2) * 600);
        const bg = ctx.createLinearGradient(0, 0, 0, 600); bg.addColorStop(0, '#24495b'); bg.addColorStop(1, '#0d2735');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, 900, 600);
        ctx.fillStyle = '#e6d8ba'; ctx.font = '24px sans-serif'; ctx.fillText(v.name, 32, 42);
        G.Galleon3D.draw(ctx, 450, 455, v.a, 410, {type: 'galleon', furl: v.f, flag: '#315c99', rig: {fill: .95, brace: .16, lee: 1}, light: {cloud: .12}}, 1.25);
        ctx.strokeStyle = '#527080'; ctx.strokeRect(.5, .5, 899, 599); ctx.restore();
      });
      return cv.toDataURL('image/png');
    });
    fs.writeFileSync(path.join(OUT, 'art-details.png'), Buffer.from(artBoard.split(',')[1], 'base64'));
    await page.evaluate(() => { document.getElementById('size').value = 360; document.getElementById('heading').value = 35; document.getElementById('furl').value = 0; G.GalleonPreview.render(1.25, 1); });
    await page.waitForTimeout(180);
    await page.evaluate(() => G.GalleonPreview.render(1.25, 1));
    await page.screenshot({path: path.join(OUT, 'inspection.png')});
    report.performance = await page.evaluate(() => {
      const spec = {type: 'galleon', rig: {fill: 1, brace: .25, lee: 1}, noWake: true, sid: 'perf', motion: 'dash'};
      function sample(fn, len, readback) { const cv = document.createElement('canvas'); cv.width = 600; cv.height = 500; const ctx = cv.getContext('2d'), times = []; for (let i = 0; i < 28; i++) { ctx.clearRect(0, 0, 600, 500); const t = performance.now(); fn(ctx, 300, 330, .6 + i * .01, len, spec, i / 30); if (readback) ctx.getImageData(300, 330, 1, 1); if (i > 3) times.push(performance.now() - t); } times.sort((a, b) => a - b); return {p50: times[Math.floor(times.length * .5)], p95: times[Math.floor(times.length * .95)]}; }
      const sprite66Submit = sample(G.Art.shipTop, 66, false), live66Submit = sample(G.Galleon3D.draw, 66, false);
      const live66Readback = sample(G.Galleon3D.draw, 66, true), live240Readback = sample(G.Galleon3D.draw, 240, true);
      return {note: 'Submit은 호출 시간, Readback은 GPU 완료 대기를 포함. file:// 스프라이트는 보안 정책상 픽셀 읽기 불가.', sprite66Submit, live66Submit, live66Readback, live240Readback, stats: G.Galleon3D.stats()};
    });
    report.fallback = await page.evaluate(() => {
      const ctx = document.getElementById('live').getContext('2d');
      G.FX.galleon3d.enabled = false;
      const disabled = G.Galleon3D.draw(ctx, 0, 0, 0, 66, {type: 'galleon'}, 0);
      G.FX.galleon3d.enabled = true;
      const otherType = G.Galleon3D.draw(ctx, 0, 0, 0, 66, {type: 'junk'}, 0);
      G.Galleon3D.dispose();
      const recreated = G.Galleon3D.draw(ctx, 300, 330, 1, 66, {type: 'galleon'}, 0);
      return {disabled, otherType, recreated};
    });
    assert.deepStrictEqual(report.fallback, {disabled: false, otherType: false, recreated: true});
    await page.waitForTimeout(100);
    assert.strictEqual(await page.evaluate(() => G.Galleon3D.stats().lost), false, '해제한 옛 캔버스의 이벤트가 새 렌더러에 영향을 주면 안 된다');
    await page.evaluate(() => { window.__galleonLose = window.__galleonGL.getExtension('WEBGL_lose_context'); window.__galleonLose.loseContext(); });
    await page.waitForFunction(() => G.Galleon3D.stats().lost, null, {polling: 50});
    report.contextLostFallback = await page.evaluate(() => G.Galleon3D.draw(document.getElementById('live').getContext('2d'), 300, 330, 0, 66, {type: 'galleon'}, 0));
    assert.strictEqual(report.contextLostFallback, false);
    await page.evaluate(() => window.__galleonLose.restoreContext());
    await page.waitForFunction(() => !G.Galleon3D.stats().lost, null, {polling: 50});
    assert(await page.evaluate(() => G.Galleon3D.draw(document.getElementById('live').getContext('2d'), 300, 330, 0, 66, {type: 'galleon'}, 0)));
    console.log('비교 화면·연속 방향·돛·자원 수·그림 장치 손실/복구 확인');

    await page.setViewportSize({width: 960, height: 540});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => G.Game && G.State && G.Img.count() > 0, null, {timeout: 90000, polling: 100});
    await page.evaluate(() => G.Game.ensureGeo());
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => sk[x.id] = 0); sk.nav = 2;
      const s = G.State.newGame({name: '갤리온 시제품', nation: 'PT', job: 'explorer', age: 22, birth: {m: 4, d: 12},
        st: {str: 50, int: 50, mar: 50, cha: 50}, sk, lg: G.LANGS.map(() => 0), diff: 'normal'});
      s.settings.res = .35; s.fleet.ships[0].type = 'galleon'; G.Game.state = s;
      G.Game.go('sea', {depart: 0, fresh: true});
      const st = G.Scenes.sea.runtime(); st.paused = true; st.manual = true; st.npcs = [];
      s.loc.lon = -13; s.loc.lat = 36; s.loc.heading = Math.PI / 4; st.cam.lon = -13; st.cam.lat = 36;
    });
    await page.evaluate(() => G.ShipSprite.preload(['galleon'], 30000));
    report.integration = await page.evaluate(() => {
      const st = G.Scenes.sea.runtime(); st.furl = 0;
      for (let i = 0; i < 6; i++) G.Scenes.sea.update(0);
      const live = G.Galleon3D.stats();
      G.FX.galleon3d.enabled = false;
      for (let i = 0; i < 6; i++) G.Scenes.sea.update(0);
      const disabled = G.Galleon3D.stats();
      G.FX.galleon3d.enabled = true;
      return {live, disabled, sameFrameCount: live.frames === disabled.frames, scene: G.Game.sceneName, lon: G.Game.state.loc.lon, lat: G.Game.state.loc.lat};
    });
    assert(report.integration.live.frames > 0); assert(report.integration.sameFrameCount); assert.strictEqual(report.integration.scene, 'sea');
    await page.screenshot({path: path.join(OUT, 'sea-sprite.png')});
    await page.evaluate(() => { for (let i = 0; i < 6; i++) G.Scenes.sea.update(0); });
    await page.screenshot({path: path.join(OUT, 'sea-live.png')});
    report.stateUnchangedByDrawing = await page.evaluate(() => {
      const before = JSON.stringify(G.Game.state), cv = document.createElement('canvas'); cv.width = cv.height = 256;
      G.Galleon3D.draw(cv.getContext('2d'), 128, 160, 1, 66, {type: 'galleon', furl: .5, rig: {fill: .5, brace: .3}}, 2);
      return before === JSON.stringify(G.Game.state);
    });
    assert(report.stateUnchangedByDrawing, '그림 코드가 저장 상태를 바꾸면 안 된다');
    report.releasedOnSceneExit = await page.evaluate(() => { G.Scenes.sea.exit('city'); return !G.Galleon3D.stats().ready; });
    assert(report.releasedOnSceneExit);
    report.errors = errors;
    assert.deepStrictEqual(errors, [], '브라우저 오류');
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report.performance));
    console.log('OK · file:// 비교 화면·실제 항해 갤리온 3D 연결·브라우저 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
