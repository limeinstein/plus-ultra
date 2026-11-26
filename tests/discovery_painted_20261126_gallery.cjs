/* 새 회화 전체 미리보기의 검색·갈래·실제 GIF 전환과 보존본 연결을 검사한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/discovery-painted-20261126');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/discovery_painted_20261126/plan.json'), 'utf8'));
const rows = [...plan.generate, ...plan.recompose];
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox','--allow-file-access-from-files']});
  const errors = [], report = {cards: rows.length, samples: [], categories: {}};
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(OUT, 'index.html')).href);
    assert.equal(await page.locator('article').count(), rows.length);
    for (const cat of new Set(rows.map(r => r.cat))) {
      await page.locator('#cat').selectOption(cat);
      const expected = rows.filter(r => r.cat === cat).length;
      assert.equal(await page.locator('article:visible').count(), expected);
      report.categories[cat] = expected;
    }
    await page.locator('#cat').selectOption('');
    for (const id of ['giza','muyeol','moonjar','t_pepper','canyon','sequoia','ft_hangzhou']) {
      await page.locator('#query').fill(id);
      assert.equal(await page.locator('article:visible').count(), 1, id);
      const card = page.locator('article:visible');
      assert.equal(await card.locator('a').filter({hasText: '이전 GIF'}).count(), 1);
      const link = await card.locator('a').filter({hasText: '이전 GIF'}).getAttribute('href');
      assert.ok(fs.existsSync(path.resolve(OUT, link)), '보존본:' + id);
      const original = await card.locator('a').filter({hasText: '원화'}).getAttribute('href');
      assert.ok(fs.existsSync(path.resolve(OUT, original)), '원화:' + id);
      await card.locator('button').click();
      await page.waitForFunction(id => {const im = document.querySelector('article:not([hidden]) img'); return im.complete && im.naturalWidth === 576 && im.src.endsWith('/'+id+'.gif');}, id);
      await card.locator('button').click();
      await page.waitForFunction(id => {const im = document.querySelector('article:not([hidden]) img'); return im.complete && im.naturalWidth === 576 && im.src.endsWith('/'+id+'.jpg');}, id);
      await page.screenshot({path: path.join(OUT, 'gallery-'+id+'.png')});
      report.samples.push({id, gifLoaded: true, endLoaded: true, beforePreserved: true});
    }
    assert.deepEqual(errors, []);
    report.consoleErrors = errors; report.pass = true;
    fs.writeFileSync(path.join(OUT, 'gallery.json'), JSON.stringify(report, null, 2));
    console.log('PASS: 회화 미리보기', rows.length, '종, 갈래·검색·재생·보존본, 콘솔 오류 0');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
