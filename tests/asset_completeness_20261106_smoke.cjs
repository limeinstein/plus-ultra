/* 모든 시스템이 읽힌 뒤의 실제 발견물·소지품·교역품 자료와 원화 연결을 검사한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/asset-completeness-20261106');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    const page = await browser.newPage({viewport: {width: 960, height: 540}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({status: 200, contentType: 'text/css', body: ''}));
    await page.addInitScript(() => {window.requestAnimationFrame = () => 0;});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    const rows = await page.evaluate(() => {
      const audit = (data, chainOf) => Object.values(data).map(o => {
        const chain = chainOf(o), key = G.Img.pick(chain);
        const related = data === G.DISC ? ['discovery-ends/' + o.id, 'discovery-sheets/' + o.id].map(key => ({key, file: G.Img.file(key)})) : [];
        return {id: o.id, name: o.name, kind: o.kind || o.cat, chain, key, file: key && G.Img.file(key), related};
      });
      return {discoveries: audit(G.DISC, G.Img.chain.discovery), items: audit(G.ITEM, G.Img.chain.item), goods: audit(G.GOOD, G.Img.chain.good)};
    });
    const summary = {};
    for (const [kind, group] of Object.entries(rows)) {
      const missing = group.filter(r => !r.key || /^(discovery-cats|item-kinds|relic-kinds|good-kinds)\//.test(r.key) || !r.file || !fs.existsSync(path.join(ROOT, 'images', r.file)));
      summary[kind] = {total: group.length, missing: missing.length, missingIds: missing.map(r => r.id)};
    }
    const related = rows.discoveries.flatMap(r => r.related);
    const missingRelated = related.filter(r => !r.file || !fs.existsSync(path.join(ROOT, 'images', r.file))).map(r => r.key);
    const keys = [...new Set(Object.values(rows).flat().map(r => r.key).concat(related.map(r => r.key)).filter(Boolean))];
    // 큰 발견 GIF를 한꺼번에 풀지 않도록 순서대로 브라우저 이미지 해독을 확인한다.
    const bad = await page.evaluate(async keys => {
      const failures = [];
      for (let i = 0; i < keys.length; i += 4) {
        await Promise.all(keys.slice(i, i + 4).map(async key => {
          const image = new Image();
          image.src = G.Img.src(key);
          try {await image.decode(); if (!image.naturalWidth || !image.naturalHeight) failures.push(key);}
          catch (_) {failures.push(key);}
          finally {image.src = '';}
        }));
      }
      return failures;
    }, keys);
    fs.mkdirSync(OUT, {recursive: true});
    fs.writeFileSync(path.join(OUT, 'browser-audit.json'), JSON.stringify({summary, related: related.length, missingRelated, decoded: keys.length, bad, errors, rows}, null, 2) + '\n');
    assert(Object.values(summary).every(v => v.missing === 0), JSON.stringify(summary));
    assert.deepStrictEqual(missingRelated, []); assert.deepStrictEqual(bad, []); assert.deepStrictEqual(errors, []);
    console.log(JSON.stringify({summary, related: related.length, decoded: keys.length, bad, errors}));
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
