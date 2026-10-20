/* 잉카 여급 5명의 전용 얼굴상·무릎상과 안데스 도시 연결 검사.
   node tests/inca_maids_smoke.js */
'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (error) {
  ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core'));
}

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, 'index.html')).href;
const IDS = ['m_qui', 'm_tum', 'm_cha', 'm_cuz', 'm_naz'];
function ok(value, message) { if (!value) throw new Error(message); console.log('  ✓ ' + message); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(message.text() + ' ' + ((message.location() || {}).url || ''))) {
      errors.push('console: ' + message.text());
    }
  });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const result = await page.evaluate(async (ids) => {
      const keys = Array.from({ length: 5 }, (_, index) => `maid-styles/inca/${index + 1}`);
      await Promise.all(keys.flatMap(key => [G.Img.load(key), G.Img.load(key + '_half')]));
      function alphaAtCorner(key) {
        const image = G.Img.get(key), canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, 1, 1).data[3];
      }
      return {
        pool: G.Img.MAID_POOL.an,
        list: G.Img.maidList('inca'),
        mapped: ids.map((id, index) => {
          const maid = G.MAID[id], city = G.CITY_DATA[maid.city], expected = keys[index];
          return { id, expected, face: G.Img.pick(G.Img.chain.maid(id, city)), half: G.Img.pick(G.Img.chain.maidHalf(id, city)) };
        }),
        files: keys.map(key => {
          const face = G.Img.get(key), half = G.Img.get(key + '_half');
          return { key, face: [face.width, face.height], half: [half.width, half.height], alpha: [alphaAtCorner(key), alphaAtCorner(key + '_half')], meta: !!G.PORTRAIT_FACES[key] && !!G.PORTRAIT_FACES[key + '_half'] };
        })
      };
    }, IDS);
    ok(JSON.stringify(result.pool) === JSON.stringify(['inca']), '안데스 도시가 잉카 전용 여급 묶음을 쓴다');
    ok(result.list.length === 5, '잉카 여급 묶음에 얼굴 5장이 있다');
    ok(result.mapped.every(row => row.face === row.expected && row.half === row.expected + '_half'), '키토·툼베스·찬찬·쿠스코·나스카에 1:1로 연결된다');
    ok(result.files.every(row => row.face.join('x') === '448x448' && row.half.join('x') === '1024x1536'), '얼굴상 448×448, 무릎상 1024×1536 규격이다');
    ok(result.files.every(row => row.alpha[0] === 0 && row.alpha[1] === 0), '모든 초상의 바깥 모서리가 투명하다');
    ok(result.files.every(row => row.meta), '모든 얼굴상·무릎상에 눈·입 위치 메타데이터가 있다');
    ok(!errors.length, '브라우저 콘솔 오류가 없다 — ' + errors.join(' | '));
  } catch (error) {
    console.error('✗', error.message);
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
