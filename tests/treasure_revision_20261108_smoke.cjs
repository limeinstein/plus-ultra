/* 교체된 15종을 실제 발견 그림 재생기로 읽고 색·시점·마지막 장면을 확인한다. */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const IDS = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/treasure_gifs/profiles_20261108.json'), 'utf8')));
const OUT = path.join(ROOT, 'artifacts/treasure-upgrade-20261108');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-gpu'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1800, height: 1600 } });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.DISC && G.Reel && G.Scenes.discoveryPicture);
    const result = await page.evaluate(async ids => {
      document.body.innerHTML = '<main id="review" style="padding:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;background:#11151c"></main>';
      const main = document.getElementById('review'), result = [];
      for (const id of ids) {
        const d = G.DISC[id];
        if (!d) throw new Error('발견 자료 없음: ' + id);
        const L = await G.Reel.load(G.Reel.key(d));
        const card = document.createElement('section');
        card.innerHTML = '<h3 style="margin:0;color:#e8d6b3;font:18px serif">' + d.name + '</h3>';
        const cv = G.Scenes.discoveryPicture(d); cv.style.cssText = 'width:100%;height:auto;display:block';
        main.appendChild(card); card.appendChild(cv);
        G.Reel.drawLast(cv, L);
        const ctx = cv.getContext('2d'), px = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let bright = 0; for (let i = 0; i < px.length; i += 4) if (px[i] + px[i + 1] + px[i + 2] > 120) bright++;
        result.push({ id, tag: cv.tagName, frames: L.n, size: [cv.width, cv.height], bright });
      }
      return result;
    }, IDS);
    assert.equal(result.length, IDS.length);
    for (const r of result) { assert.equal(r.tag, 'CANVAS'); assert.equal(r.frames, 24); assert.deepEqual(r.size, [1152, 512]); assert(r.bright > 5000, r.id); }
    assert.deepEqual(errors, []);
    fs.mkdirSync(OUT, { recursive: true });
    for (let start = 0; start < IDS.length; start += 24) {
      await page.evaluate(([start, count]) => {
        [...document.querySelectorAll('#review > section')].forEach((el, i) => { el.style.display = i >= start && i < start + count ? '' : 'none'; });
      }, [start, 24]);
      await page.screenshot({ path: path.join(OUT, 'runtime-all-' + (Math.floor(start / 24) + 1) + '.png'), fullPage: true });
    }
    fs.writeFileSync(path.join(OUT, 'runtime-check.json'), JSON.stringify({ result, errors }, null, 2));
    console.log('OK: ' + result.length + '종 실제 재생기 · 마지막 장면 · 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
