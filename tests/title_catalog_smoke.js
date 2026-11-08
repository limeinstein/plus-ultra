/* 타이틀 도감: 일곱 분류·게임 자료 일치·검색·발견 세부 갈래·되돌아가기·작은 화면 검사.
   node tests/title_catalog_smoke.js [웹판 주소 또는 폴더] */
'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), target = process.argv[2] || ROOT;
const base = /^https?:/.test(target) ? target.replace(/\/$/, '') + '/' : pathToFileURL(path.resolve(target) + path.sep).href;
const out = path.join(ROOT, 'artifacts/title-catalog-20261108'); fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
    page.setDefaultTimeout(30000);
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(base + 'catalog.html?view=player&from=index.html#people', { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('#tabs [data-tab="people"]');
    // 대표 카드뿐 아니라 새 분류의 모든 상세 설명과 대체 그림도 만들 수 있어야 한다.
    const dataErrors = await page.evaluate(() => {
      const bad = [], tabs = {}, make = G.Img.make;
      // 수백 장의 원본을 동시에 받지 않고 대체 그림 경로를 따로 확인한다.
      G.Img.make = (chain, w, h, fallback) => typeof fallback === 'function' ? fallback() : fallback || G.Art.canvas(w, h);
      try { G.CatalogExtras.register({ tab: (id, label, options) => (tabs[id] = { id, items: [], ...options }),
        people: { chips: [], items: [] }, portrait: spec => G.Art.portraitCanvas(spec, 160), num: n => Number(n).toLocaleString('ko-KR'),
        add: (t, it) => { try { const d = it.detail(); if (!d || !Array.isArray(d.facts)) throw Error('상세 설명 없음'); const cv = it.pic(); if (!cv || !cv.width || !cv.height) throw Error('그림 없음'); } catch (e) { bad.push(it.name + ': ' + e.message); } t.items.push(it); } });
      } finally { G.Img.make = make; }
      return bad;
    });
    assert.deepEqual(dataErrors, [], '도감 자료의 상세·대체 그림');
    const ids = ['people', 'events', 'achievements', 'discoveries', 'foods', 'instruments', 'weapons'];
    assert.deepEqual(await page.locator('#tabs [data-tab]').evaluateAll(es => es.map(e => e.dataset.tab)), ids);
    assert.equal(await page.locator('#helpBtn').isVisible(), false);
    const counts = {};
    for (const id of ids) {
      await page.locator('[data-tab="' + id + '"]').click();
      counts[id] = await page.locator('.card').count(); assert(counts[id] > 0, id + ' 자료 없음');
      assert.equal(await page.locator('.card .file').count(), 0);
      await page.locator('.card').first().click();
      await page.locator('#detail').waitFor({ state: 'visible' });
      assert(await page.locator('#dTitle').textContent());
      assert(!((await page.locator('#dBody').innerText()).includes('이 그림을 바꾸려면')));
      await page.keyboard.press('Escape');
    }
    const expected = await page.evaluate(() => ({ achievements: G.ACHIEVEMENTS.length, foods: G.CUISINES.length,
      instruments: new Set(G.ITEMS.filter(i => i.kind === 'instrument').map(i => i.id)).size,
      weapons: new Set(G.ITEMS.filter(i => i.kind === 'weapon').map(i => i.id)).size,
      discoveries: G.DISCOVERIES.length }));
    Object.keys(expected).forEach(k => assert.equal(counts[k], expected[k], k + ' 게임 자료 누락'));
    await page.locator('[data-tab="discoveries"]').click();
    await page.locator('[data-chip="creature"]').click();
    for (const part of ['식물', '곤충', '해양 생물', '동물·전설 생물']) {
      await page.locator('[data-facet="part"]').selectOption(part);
      assert(await page.locator('.card').count() > 0, part + ' 자료 없음');
      const wanted = await page.evaluate(p => G.DISCOVERIES.filter(d => d.cat === 'creature' && (p === '식물' ? d.plant || d.id === 'bullocho' : p === '곤충' ? d.insect && !d.plant : p === '해양 생물' ? !d.plant && !d.insect && d.id !== 'bullocho' && d.how === 'sea' : !d.plant && !d.insect && d.id !== 'bullocho' && d.how !== 'sea')).length, part);
      assert.equal(await page.locator('.card').count(), wanted, part + ' 분류 혼합');
    }
    await page.locator('[data-facet="part"]').selectOption('식물');
    await page.locator('[data-facet="region"]').selectOption('6');
    await page.locator('[data-facet="how"]').selectOption('land');
    const filtered = await page.evaluate(() => G.DISCOVERIES.filter(d => d.cat === 'creature' && (d.plant || d.id === 'bullocho') && (d.regions || [d.reg]).includes(6) && d.how === 'land').length);
    assert.equal(await page.locator('.card').count(), filtered);
    await page.locator('#q').fill('도감없는검색어123456');
    await page.waitForFunction(() => document.querySelector('#empty').hidden === false);
    await page.locator('#empty [data-reset]').click();
    assert.equal(await page.locator('.card').count(), counts.discoveries);
    await page.locator('#q').fill('가야금');
    await page.locator('[data-tab="instruments"]').click();
    await page.waitForFunction(() => document.querySelectorAll('.card').length === 1);
    await page.locator('.card').click();
    assert((await page.locator('#dBody').innerText()).includes('열두 줄'));
    await page.keyboard.press('Escape');
    await page.locator('#q').fill('');
    await page.waitForFunction(() => document.querySelectorAll('.card').length > 1);
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator('.card .thumb canvas').nth(2).waitFor();
    await page.screenshot({ path: path.join(out, 'instruments-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-tab="discoveries"]').click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '작은 화면 가로 넘침');
    await page.screenshot({ path: path.join(out, 'discoveries-mobile.png') });
    // 옛 그림 제작용 도감의 직접 주소와 파일 안내도 유지한다.
    await page.goto(base + 'catalog.html#figureheads', { waitUntil: 'load', timeout: 120000 });
    assert.equal(await page.locator('#extraCatalog').getAttribute('open') !== null, true);
    await page.locator('.card').first().click();
    assert((await page.locator('#dBody').innerText()).includes('이 그림을 바꾸려면'));
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 960, height: 540 });
    await page.goto(base + 'index.html', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.waitForFunction(() => !G.Loader || !G.Loader.shown(), null, { timeout: 120000 });
    await page.locator('#boot-loader').waitFor({ state: 'hidden', timeout: 120000 });
    const catalog = page.getByRole('button', { name: '도감', exact: true });
    await catalog.waitFor({ state: 'visible' });
    const geometry = await page.locator('.title-books .btn').evaluateAll(es => es.map(e => ({ width: e.clientWidth, content: e.scrollWidth })));
    assert(geometry.every(e => e.content <= e.width + 1), '타이틀 도감·불러오기 글자 넘침: ' + JSON.stringify(geometry));
    await page.screenshot({ path: path.join(out, 'title.png') });
    await catalog.click();
    await page.waitForURL('**/catalog.html?view=player&from=index.html#people');
    await page.locator('#tabs [data-tab="people"]').waitFor();
    assert.equal(await page.locator('#titleReturn').getAttribute('href'), 'index.html');
    await page.locator('#titleReturn').click();
    await page.waitForURL('**/index.html');
    assert.deepEqual(errors, [], '브라우저 오류');
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ base, counts, errors }, null, 2));
    console.log('통과 — 타이틀 도감, 일곱 분류, 자료 수 일치, 검색, 발견물 세부 필터, 모바일, 옛 도감, 타이틀 복귀', counts);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
