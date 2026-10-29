/* 선수상 전용 그림 읽기, 유물 그림 연결, 실제 조선소 장착과 도감 표시를 확인한다. */
'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/figureheads-20261029');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const timeout = setTimeout(() => browser.close(), 120000);
  const watch = page => {
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 720 } }); watch(page);
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ body: '', contentType: 'text/css' }));
    await page.addInitScript(() => { const raf = requestAnimationFrame; window.requestAnimationFrame = fn => fn.name === 'loop' ? 0 : raf(fn); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Game.sceneName === 'title' && G.Img.figureheadSrc);
    const report = await page.evaluate(async () => {
      const rows = [];
      for (const f of G.FIGUREHEADS.filter(f => G.IMAGE_FILES['figureheads/' + f.id])) {
        const key = G.Img.pick(G.Img.chain.figurehead(f));
        const img = new Image(); img.src = G.Img.figureheadSrc(f);
        try { await img.decode(); }
        catch (e) { throw new Error('선수상 그림 읽기 실패: ' + f.id + ' → ' + img.src); }
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 192;
        const c = canvas.getContext('2d'); c.drawImage(img, 0, 0);
        const px = c.getImageData(0, 0, 192, 192).data;
        let clear = 0, solid = 0;
        for (let i = 3; i < px.length; i += 4) { if (!px[i]) clear++; if (px[i] > 230) solid++; }
        rows.push({ id: f.id, key, width: img.naturalWidth, height: img.naturalHeight, clear, solid });
      }
      const fallbacks = [];
      for (const f of G.FIGUREHEADS.filter(f => f.legend && !G.IMAGE_FILES['figureheads/' + f.id])) {
        const key = G.Img.pick(G.Img.chain.figurehead(f));
        const img = new Image(); img.src = G.Img.figureheadSrc(f);
        try { await img.decode(); }
        catch (e) { throw new Error('전설 선수상 대체 그림 읽기 실패: ' + f.id + ' → ' + img.src); }
        fallbacks.push({ id: f.id, key, width: img.naturalWidth, height: img.naturalHeight });
      }
      const relic = G.FIGUREHEADS.find(f => f.relic);
      return { rows, fallbacks, relicKey: G.Img.pick(G.Img.chain.figurehead(relic)), relicId: relic.id,
        missing: G.Img.figureheadSrc('missing_figurehead') };
    });
    assert.equal(report.rows.length, 36);
    for (const row of report.rows) {
      assert.equal(row.key, 'figureheads/' + row.id);
      assert(row.width === 192 && row.height === 192 && row.clear > 5000 && row.solid > 1000, JSON.stringify(row));
    }
    assert.equal(report.fallbacks.length, 4);
    assert(report.fallbacks.every(row => /^(discovery-ends|discoveries|sea-monsters)\//.test(row.key)), JSON.stringify(report.fallbacks));
    assert.equal(report.relicKey, 'figureheads/' + report.relicId); assert.equal(report.missing, null);
    await page.evaluate(() => {
      const s = G.Game.state = G.State.newGame({ name: '선수상 검사', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.settings.res = .35; s.player.gold = 50000; s.flags.prologue = true;
      s.fleet.ships[0].fig = 'goddess';
      const f = G.FIGUREHEADS.find(f => f.relic);
      s.player.items.push({ id: f.id });
      s.tech = s.tech || {}; s.tech[0] = 200000;
      G.Scenes.city.B.shipyard.refit(G.CITY_DATA[0]);
    });
    await page.locator('.choice').first().click();
    const figRow = page.locator('.choice').filter({ hasText: '선수상' });
    await figRow.locator('img').evaluate(img => img.decode());
    assert((await figRow.locator('img').getAttribute('src')).includes('figureheads/goddess.webp'));
    await figRow.click();
    await page.locator('.choice').filter({ hasText: '선수상 떼어내기' }).waitFor();
    const choices = await page.locator('.choice').evaluateAll(async rows => {
      await Promise.all(rows.map(r => r.querySelector('img')).filter(Boolean).map(img => img.decode()));
      return rows.map(r => ({ label: r.innerText, src: r.querySelector('img')?.getAttribute('src') }));
    });
    assert(choices.some(r => r.src?.includes('figureheads/')));
    assert(choices.filter(r => r.label.includes('닢')).every(r => r.src));
    await page.screenshot({ path: path.join(OUT, 'shipyard-runtime.png') });
    const buyIndex = choices.findIndex(r => r.src?.includes('figureheads/') && /\d[\d,]*닢/.test(r.label) && !r.label.includes('달기 150닢'));
    assert(buyIndex >= 0);
    const id = choices[buyIndex].src.match(/figureheads\/(\w+)\.webp/)[1];
    const before = await page.evaluate(() => G.Game.state.player.gold);
    await page.locator('.choice').nth(buyIndex).click();
    await page.waitForFunction(id => G.Game.state.fleet.ships[0].fig === id, id);
    const after = await page.evaluate(() => G.Game.state.player.gold);
    assert.equal(before - after, await page.evaluate(id => G.FIGUREHEAD[id].price, id));
    await page.locator('.win .title .x').last().click();
    const catalog = await browser.newPage({ viewport: { width: 1280, height: 900 } }); watch(catalog);
    await catalog.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ body: '', contentType: 'text/css' }));
    await catalog.goto(pathToFileURL(path.join(ROOT, 'catalog.html')).href + '#figureheads');
    await catalog.locator('#q').fill('해신상');
    const card = catalog.locator('.card').filter({ hasText: '해신상' });
    await card.locator('.thumb canvas').waitFor(); await card.click();
    assert((await catalog.locator('#detail').innerText()).includes('images/figureheads/seagod.webp'));
    await catalog.locator('#detail').evaluate(d => d.close());
    await catalog.locator('#q').fill('');
    await catalog.waitForFunction(() => document.querySelectorAll('.card').length === G.FIGUREHEADS.length);
    await catalog.screenshot({ path: path.join(OUT, 'catalog-runtime.png') });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'browser-report.json'), JSON.stringify({ ...report, choices, bought: id, errors }, null, 2));
    console.log('선수상 36종: 192×192 투명 그림·실제 읽기·유물 연결·조선소 장착·도감·콘솔 오류 0 확인');
  } finally { clearTimeout(timeout); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
