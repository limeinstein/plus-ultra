/* 잉카 제국 멸망 사건의 전용 초상·무릎상·장면 그림이 게임에서 실제로 해독되는지 확인한다. */
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
const FIGURES = [
  'pizarro', 'almagro', 'luque', 'hpizarro', 'desoto', 'valverde', 'felipillo',
  'atahualpa', 'manco', 'curaocllo', 'villacumu', 'tupacamaru', 'toledo'
];
const EVENTS = [
  'inca_gallo_line', 'inca_cajamarca', 'inca_ransom_room',
  'inca_coricancha', 'inca_sacsayhuaman', 'inca_ollantaytambo'
];

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
    await page.waitForFunction(() => window.G && G.IncaFall && G.Hist && G.Img && G.HIST_FIG, null, { timeout: 90000 });
    const result = await page.evaluate(async ({ figures, events }) => {
      const keys = figures.flatMap(id => ['portraits/history/' + id, 'portraits/history/' + id + '_half'])
        .concat(events.map(id => 'legend-events/' + id));
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
        femaleLeader: G.HIST_FIG.curaocllo && G.HIST_FIG.curaocllo.g,
        incaFigureIncluded: G.INCA_FIGS.includes('curaocllo'),
        historyFirstKeys: figures.map(id => G.Hist.faceKeys(id)[0])
      };
    }, { figures: FIGURES, events: EVENTS });
    assert.strictEqual(result.femaleLeader, 'f');
    assert.strictEqual(result.incaFigureIncluded, true);
    assert.deepStrictEqual(result.historyFirstKeys, FIGURES.map(id => 'portraits/history/' + id));
    for (const image of result.decoded) {
      if (image.key.endsWith('_half')) assert.deepStrictEqual([image.width, image.height], [1024, 1536], image.key);
      else if (image.key.startsWith('legend-events/')) assert.deepStrictEqual([image.width, image.height], [1881, 836], image.key);
      else assert.deepStrictEqual([image.width, image.height], [448, 448], image.key);
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
