/* 심청의 얼굴상·무릎상과 포구·연꽃 이벤트 그림이 게임 이미지 경로에서 실제로 해독되는지 확인한다. */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (error) {
  ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core'));
}

const ROOT = path.resolve(__dirname, '..');

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Sim && G.Img, null, { timeout: 90000 });
    const result = await page.evaluate(async () => {
      const mate = G.MATE.simcheong;
      const keys = [mate.face, mate.face + '_half', 'legend-events/simcheong_harbor', 'legend-events/simcheong_lotus'];
      const decoded = [];
      for (const key of keys) {
        if (!G.Img.has(key)) throw new Error('누락된 이미지 키: ' + key);
        const image = new Image();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = G.Img.src(key);
        });
        await image.decode();
        decoded.push({ key, width: image.naturalWidth, height: image.naturalHeight });
      }
      return decoded;
    });
    assert.deepStrictEqual(result.map(image => [image.width, image.height]), [[448, 448], [1024, 1536], [1881, 836], [1881, 836]]);
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
