/* 긴 플레이의 그림 보관·발견 재생·화면 교체·화질 유지 검사. file://, 원본 자산을 그대로 쓴다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), label = process.argv[2] || 'after';
const OUT = path.join(ROOT, 'artifacts/long-session-perf-20261102', label);
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--allow-file-access-from-files']
  });
  const errors = [], report = { label };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      window.requestAnimationFrame = fn => { if (fn.name === 'loop') window.__gameLoop = fn; return 0; };
    });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Reel && G.Game && window.__gameLoop);
    report.manifest = await page.evaluate(() => {
      const expected = G.Img.list('characters/walk_');
      const samples = [];
      for (let round = 0; round < 7; round++) {
        const start = performance.now();
        for (let i = 0; i < 300; i++) G.Img.chain.heroWalk();
        samples.push(performance.now() - start);
      }
      const changed = G.Img.list('characters/walk_'); changed.length = 0;
      return { count: G.Img.count(), lookup300Ms: samples.sort((a, b) => a - b)[3],
        isolated: G.Img.list('characters/walk_').length === expected.length };
    });
    assert(report.manifest.isolated, '목록을 고쳐도 다른 호출 결과는 보존한다');
    // 서로 다른 발견물 48개의 원본 장면 판을 두 차례 준비한다. 반환값은 보관하지 않는다.
    report.sheets = await page.evaluate(async () => {
      const keys = G.Img.list('discovery-sheets/').slice(0, 48), rounds = [];
      for (let pass = 0; pass < 2; pass++) {
        let originals = true;
        for (const key of keys) {
          const L = await G.Reel.load(key);
          if (!L) throw new Error('장면 판 읽기 실패: ' + key);
          originals = originals && L.img.naturalWidth === 3456 && L.cw === 576;
        }
        const retained = new Set();
        for (const key of keys) {
          const im = G.Img.get(key), L = G.Reel.now(key);
          if (im) retained.add(im); if (L) retained.add(L.img);
        }
        rounds.push({ originals, retained: retained.size,
          retainedBytes: [...retained].reduce((n, im) => n + im.naturalWidth * im.naturalHeight * 4, 0),
          cache: G.Img.cacheStats ? G.Img.cacheStats() : null });
      }
      // 퇴출 전에 받은 재생 자료를 들고 있어도 마지막 장면은 그대로 그릴 수 있어야 한다.
      const active = await G.Reel.load(keys[0]);
      for (const key of keys.slice(1)) await G.Reel.load(key);
      const cv = document.createElement('canvas'); cv.width = 576; cv.height = 256;
      G.Reel.drawLast(cv, active);
      const activePixels = cv.getContext('2d').getImageData(0, 0, 576, 256).data.some(x => x !== 0);
      const reloaded = await G.Reel.load(keys[0]);
      return { rounds, activePixels, reloadWidth: reloaded.img.naturalWidth,
        cache: G.Img.cacheStats ? G.Img.cacheStats() : null };
    });
    assert(report.sheets.rounds.every(x => x.originals), '장면 판 원본 해상도 유지');
    assert(report.sheets.activePixels && report.sheets.reloadWidth === 3456, '재생 중인 판과 재방문 원본 복원');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('HeapProfiler.collectGarbage');
    report.domBefore = await cdp.send('Memory.getDOMCounters');
    await page.evaluate(() => {
      for (let round = 0; round < 100; round++) {
        G.UI.clearScreen();
        for (let i = 0; i < 3; i++) {
          const panel = G.U.el('div', 'minimap'), cv = document.createElement('canvas');
          cv.width = 320; cv.height = 200; panel.appendChild(cv);
          G.UI.add(panel); G.HudPin.pin(panel, 'perf-' + i, '성능 검사');
        }
      }
      G.UI.clearScreen();
    });
    await cdp.send('HeapProfiler.collectGarbage');
    report.domAfter = await cdp.send('Memory.getDOMCounters');
    report.domGrowth = report.domAfter.nodes - report.domBefore.nodes;
    report.quality = await page.evaluate(() => {
      G.Game.scene = { update() {} }; G.Game.state = null; G.Game.showLayers(true, false, false);
      let minWidth = Infinity, minAutoRes = 1;
      for (let i = 1; i <= 480; i++) {
        window.__gameLoop(100000 + i * 40);
        minWidth = Math.min(minWidth, G.Game.canvases().world.width);
        minAutoRes = Math.min(minAutoRes, G.Game.autoRes || 1);
      }
      const cv = G.Game.canvases().world;
      return { autoRes: G.Game.autoRes || 1, minAutoRes, minWidth, width: cv.width, height: cv.height, scale: G.Game.scale };
    });
    if (label !== 'before') {
      const limit = 256 * 1024 * 1024;
      assert(report.sheets.rounds.every(x => x.retainedBytes <= limit), '장면 판을 오래 보아도 보관 한도 유지');
      assert(report.sheets.cache.bytes <= limit, '공통 그림 보관 한도 유지');
      assert(report.domGrowth < 40, '화면을 100번 교체해도 이전 판을 붙잡지 않는다');
      assert.equal(report.quality.autoRes, 1, '느린 프레임에서도 해상도 자동 하향 없음');
      assert.equal(report.quality.minAutoRes, 1);
      assert.equal(report.quality.minWidth, report.quality.width);
      assert.equal(report.quality.width, Math.round(1600 * report.quality.scale));
    }
    assert.deepStrictEqual(errors, [], '브라우저 오류 0');
    report.errors = errors;
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
