/* 자녀 40대 초상과 성인 가족 이벤트 이미지 검사 — node tests/family_age40_events_art_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (error) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Img && G.Img.has, null, { timeout: 90000 });
    const result = await page.evaluate(async () => {
      const portraitKeys = ['daughter', 'son'].flatMap(sex => [1, 2, 3, 4, 5].flatMap(v => [
        `portraits/family/${sex}_age40_v${v}`, `portraits/family/${sex}_age40_v${v}_half`
      ]));
      const eventKeys = [
        '31_daughter_wedding_father_pov', '32_daughter_wedding_brother_pov',
        '33_daughter_wedding_sister_pov', '34_adult_daughter_chart_gift',
        '35_adult_son_first_command', '36_adult_siblings_homecoming'
      ].map(x => `family-events/${x}`);
      async function inspect(key) {
        const url = G.Img.src(key), img = new Image();
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
        return { key, width: img.width, height: img.height, alpha: ctx.getImageData(0, 0, 1, 1).data[3] };
      }
      return { portraits: await Promise.all(portraitKeys.map(inspect)), events: await Promise.all(eventKeys.map(inspect)) };
    });
    ok(result.portraits.length === 20, '40대 얼굴·무릎상 20장 로드');
    ok(result.portraits.every(x => (x.width === 448 && x.height === 448) || (x.width === 1024 && x.height === 1536)), '초상 크기 448×448 / 1024×1536');
    ok(result.portraits.every(x => x.alpha < 255), '모든 40대 초상의 투명 배경');
    ok(result.events.length === 6 && result.events.every(x => x.width === 576 && x.height === 256), '이벤트 6장 576×256 로드');
  } catch (error) {
    console.error('✗', error.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
