/* 포카혼타스·아즈텍 신규 초상과 이벤트 그림이 게임 경로에서 실제로 해독되는지 확인한다. */
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
    await page.waitForFunction(() => window.G && G.Pocahontas && G.Aztec && G.Hist && G.Img, null, { timeout: 90000 });
    const result = await page.evaluate(async () => {
      const keys = [
        'portraits/mates/h_pocahontas', 'portraits/mates/h_pocahontas_half',
        'portraits/history/pocahontas_militia', 'portraits/history/pocahontas_militia_half',
        'portraits/history/pocahontas_warrior', 'portraits/history/pocahontas_warrior_half',
        'legend-events/pocahontas_truce', 'legend-events/pocahontas_join',
        'portraits/history/yaocihuatl', 'portraits/history/yaocihuatl_half',
        'portraits/history/cuitlahuac', 'portraits/history/cuitlahuac_half',
        'portraits/history/xicotencatl', 'portraits/history/xicotencatl_half',
        'portraits/history/moctezuma', 'portraits/history/moctezuma_half'
      ];
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
      return {
        decoded,
        femaleWarrior: G.HIST_FIG.yaocihuatl && G.HIST_FIG.yaocihuatl.g,
        historyFirstKeys: ['yaocihuatl', 'cuitlahuac', 'xicotencatl', 'moctezuma'].map(id => G.Hist.faceKeys(id)[0]),
        pocahontasSupportingKeys: [
          G.Pocahontas._test.speakers.militia.portrait.img[0],
          G.Pocahontas._test.speakers.warrior.portrait.img[0]
        ]
      };
    });
    assert.strictEqual(result.femaleWarrior, 'f');
    assert.deepStrictEqual(result.historyFirstKeys, [
      'portraits/history/yaocihuatl', 'portraits/history/cuitlahuac',
      'portraits/history/xicotencatl', 'portraits/history/moctezuma'
    ]);
    assert.deepStrictEqual(result.pocahontasSupportingKeys, [
      'portraits/history/pocahontas_militia', 'portraits/history/pocahontas_warrior'
    ]);
    const sizes = Object.fromEntries(result.decoded.map(image => [image.key, [image.width, image.height]]));
    assert.deepStrictEqual(sizes['portraits/mates/h_pocahontas'], [512, 512]);
    for (const image of result.decoded) {
      if (image.key.endsWith('_half')) assert.deepStrictEqual([image.width, image.height], [1024, 1536], image.key);
      else if (image.key.startsWith('legend-events/')) assert.deepStrictEqual([image.width, image.height], [1881, 836], image.key);
      else if (image.key !== 'portraits/mates/h_pocahontas') assert.deepStrictEqual([image.width, image.height], [448, 448], image.key);
    }
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
