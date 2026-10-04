/* node run.js <출력폴더> id1,id2,...|all  [--objs 파일들]
   보물 4×2 회전 원화를 PNG로 굽는다. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
let pw; try { pw = require(path.join(HERE, 'node_modules', 'playwright-core')); } catch (e) { pw = require('playwright'); }
const { chromium } = pw;
const T = path.join(HERE, 'node_modules', 'three');
const LIBS = [
  'build/three.min.js', 'examples/js/environments/RoomEnvironment.js', 'examples/js/math/ConvexHull.js',
  'examples/js/geometries/ConvexGeometry.js', 'examples/js/utils/BufferGeometryUtils.js'
].map(f => path.join(T, f));

(async () => {
  const out = process.argv[2];
  const which = process.argv[3] || 'all';
  fs.mkdirSync(out, { recursive: true });
  const objFiles = fs.readdirSync(path.join(HERE, 'objs')).filter(f => f.endsWith('.js')).sort().map(f => path.join(HERE, 'objs', f));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined),
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:"Noto Serif CJK TC"}</style></head><body><span style="font-family:\'Noto Serif CJK KR\'">가</span><span style="font-family:\'Noto Serif CJK TC\'">字</span></body></html>');
  for (const f of LIBS.concat([path.join(HERE, 'lib.js')], objFiles)) await page.addScriptTag({ path: f });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => T3.setup());
  const ids = which === 'all' ? await page.evaluate(() => Object.keys(T3.OBJ)) : which.split(',');
  for (const id of ids) {
    const t0 = Date.now();
    try {
      const url = await page.evaluate(id => T3.sheet(id), id);
      fs.writeFileSync(path.join(out, id + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      console.log(id, ((Date.now() - t0) / 1000).toFixed(1) + 's');
    } catch (e) { console.log(id, 'ERROR', e.message.split('\n')[0]); }
    if (errors.length) { console.log(errors.slice(0, 5).join('\n')); errors.length = 0; }
  }
  await browser.close();
})();
