/* 식물 특산물 전용 그림: 79종의 등록·실제 읽기·상품 표시·대체 그림을 확인한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
    await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => setTimeout(() => raf(cb), 200); });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|net::ERR_/i.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Img && G.PLANT_CROP && G.goodDot);
    await page.locator('#boot-loader').waitFor({ state: 'hidden', timeout: 120000 });
    const report = await page.evaluate(async () => {
      const crops = Object.values(G.PLANT_CROP);
      const images = [];
      for (const g of crops) {
        const chain = G.Img.chain.good(g), key = G.Img.pick(chain);
        const img = new Image();
        img.src = G.Img.src(key);
        await img.decode();
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 48;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, 48, 48);
        const pixels = ctx.getImageData(0, 0, 48, 48).data;
        let visible = 0, clear = 0;
        for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] > 32) visible++; if (pixels[i] === 0) clear++; }
        images.push({ id: g.id, key, width: img.naturalWidth, height: img.naturalHeight, visible, clear, dot: G.goodDot(g.id).includes('goods/' + g.id + '.webp') });
      }
      const sample = crops.find(g => g.id === 'p_rosewater'), own = 'goods/' + sample.id;
      const saved = G.IMAGE_FILES[own]; delete G.IMAGE_FILES[own]; G.Img.reset();
      const fallback = G.Img.pick(G.Img.chain.good(sample));
      G.IMAGE_FILES[own] = saved; G.Img.reset();
      const regular = G.Img.pick(G.Img.chain.good(G.GOOD.wheat));
      return { images, fallback, regular };
    });
    assert.equal(report.images.length, 79);
    for (const row of report.images) {
      assert.equal(row.key, 'goods/' + row.id, row.id);
      assert(row.width >= 1024 && row.width === row.height && row.visible > 200 && row.clear > 200 && row.dot, JSON.stringify(row));
    }
    assert.equal(report.fallback, 'discovery-ends/rose');
    assert.equal(report.regular, 'goods/wheat');
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '상품 그림 검사', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.settings.res = 0.35;
      s.disc.camphor = { found: true, me: true }; s.disc.durian = { found: true, me: true };
      const city = G.CITY_DATA[160];
      if (!G.PlantTrade.plant(G.DISC.camphor, city) || !G.PlantTrade.plant(G.DISC.durian, city)) throw new Error('특산물 심기 실패');
      G.Scenes.city.B.trade.buy(city);
    });
    const dir = path.join(ROOT, 'artifacts/plant-goods-20261029'); fs.mkdirSync(dir, { recursive: true });
    for (const id of ['p_camphor', 'p_durian']) {
      const icon = page.locator('tr[data-id="' + id + '"] .goodico img');
      await icon.waitFor();
      assert((await icon.getAttribute('src')).includes('goods/' + id + '.webp'));
      await icon.evaluate(img => img.decode());
    }
    await page.screenshot({ path: path.join(dir, 'trade-runtime.png') });
    const catalog = await browser.newPage({ viewport: { width: 1280, height: 820 } });
    catalog.on('pageerror', e => errors.push('도감: ' + e.message));
    catalog.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|net::ERR_/i.test(m.text())) errors.push('도감: ' + m.text()); });
    await catalog.goto(pathToFileURL(path.join(ROOT, 'catalog.html')).href + '#goods');
    await catalog.locator('#q').fill('장미');
    const roseCard = catalog.locator('.card').filter({ hasText: '장미수' });
    await roseCard.locator('.thumb canvas').waitFor();
    await roseCard.click();
    assert((await catalog.locator('#detail').innerText()).includes('images/goods/p_rosewater.webp'));
    await catalog.locator('#detail').evaluate(dialog => dialog.close());
    await catalog.screenshot({ path: path.join(dir, 'catalog-runtime.png') });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(dir, 'browser-report.json'), JSON.stringify(report, null, 2));
    console.log('식물 특산물 79종: 전용 그림 등록·파일 읽기·투명도·작은 상품 그림·기존 그림 대체·콘솔 오류 0 확인');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
