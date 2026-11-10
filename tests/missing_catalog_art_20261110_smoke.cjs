/* 첨부 화면의 발견물 18종·막야·혼인 업적을 실제 도감과 발견 재생기로 검사한다. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const SUBJECTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/missing_catalog_art_20261110/subjects.json'), 'utf8'));
const IDS = SUBJECTS.map(r => r.id);
const OUT = path.join(ROOT, 'artifacts/missing-catalog-art-20261110');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], result = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1800, height: 2200 } });
    page.setDefaultTimeout(20000);
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'catalog.html')).href + '?view=player&all=1', { waitUntil: 'load' });
    await page.waitForSelector('[data-tab="discoveries"]');
    result.assets = await page.evaluate(async ids => {
      const rows = [];
      for (const id of ids) {
        const d = G.DISC[id], key = G.Img.pick(G.Img.chain.discovery(d)), L = await G.Reel.load(G.Reel.key(d));
        rows.push({ id, key, frames: L && L.n, width: L && L.cw, height: L && L.ch });
      }
      return rows;
    }, IDS);
    for (const r of result.assets) { assert.equal(r.key, 'discoveries/' + r.id); assert.equal(r.frames, 18); assert.equal(r.width, 576); assert.equal(r.height, 256); }
    await page.locator('[data-tab="discoveries"]').click();
    await page.locator('[data-chip="people"]').click();
    const cards = await page.evaluate(ids => {
      const names = Object.fromEntries(ids.map(id => [G.DISC[id].name, id])), chosen = [];
      document.querySelectorAll('#grid .card').forEach(el => {
        const id = names[el.querySelector('.name').textContent];
        el.style.display = id ? '' : 'none';
        if (id) chosen.push({ id, uid: el.dataset.uid });
      });
      document.getElementById('grid').style.gridTemplateColumns = 'repeat(3,1fr)';
      return chosen;
    }, IDS);
    assert.equal(cards.length, 18);
    for (const c of cards) {
      const card = page.locator('.card[data-uid="' + c.uid + '"]'); await card.scrollIntoViewIfNeeded();
      await card.locator('.thumb canvas.reel').waitFor();
    }
    await page.waitForTimeout(500); await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(OUT, 'catalog-discoveries.png'), fullPage: true });
    await page.locator('[data-tab="weapons"]').click(); await page.locator('#q').fill('막야');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card').length === 1);
    await page.locator('#grid .card .thumb canvas').waitFor();
    result.moye = await page.evaluate(() => ({ key: G.Img.pick(G.Img.chain.item(G.ITEM.moye)), attack: G.ITEM.moye.atk, name: G.ITEM.moye.name }));
    assert.equal(result.moye.key, 'items/moye'); assert.equal(result.moye.attack, 42);
    await page.screenshot({ path: path.join(OUT, 'catalog-moye.png') });
    await page.locator('#q').fill(''); await page.locator('[data-tab="achievements"]').click(); await page.locator('#q').fill('Happily Ever After');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card').length === 1);
    await page.locator('#grid .card .thumb canvas').waitFor();
    result.happily = await page.evaluate(() => {
      const key = G.Img.pick([G.ACHV_EVENTS.happily.pic || 'achievement-events/happily']);
      const img = G.Img.get(key);
      return { key, file: G.Img.file(key), loaded: !!img, size: img && [img.width, img.height] };
    });
    assert.equal(result.happily.file, 'legend-events/happily_after_all.webp');
    assert(result.happily.loaded);
    await page.screenshot({ path: path.join(OUT, 'catalog-happily.png') });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Scenes && G.Reel && G.DISC, null, { timeout: 120000 });
    result.reveals = await page.evaluate(async ids => {
      const rows = [];
      for (const id of ids) {
        const d = G.DISC[id], cv = G.Scenes.discoveryPicture(d), L = await G.Reel.load(G.Reel.key(d));
        G.Reel.drawLast(cv, L);
        rows.push({ id, tag: cv.tagName, reveal: G.Scenes.hasReveal(d), label: cv.getAttribute('aria-label') });
      }
      return rows;
    }, IDS);
    assert(result.reveals.every(r => r.tag === 'CANVAS' && r.reveal && r.label));
    assert.deepEqual(errors, []);
    result.errors = errors;
    fs.writeFileSync(path.join(OUT, 'runtime-check.json'), JSON.stringify(result, null, 2));
    console.log('OK: 발견 장면 18종·막야 공격력 42·혼인 업적 도감·발견 재생기·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
