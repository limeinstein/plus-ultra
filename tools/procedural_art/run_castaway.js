'use strict';
/* 야영지 물건 아이콘(윌슨·표류기)을 굽는다: node run_castaway.js <나갈 폴더>  → wilson.png · castawaylog.png (256×256 투명)
   webp로 바꿔 images/items/ 에 넣고 python tools/images.py */
const fs = require('fs'), path = require('path'), HERE = __dirname;
let pw; try { pw = require(path.join(HERE, 'node_modules', 'playwright-core')); } catch (e) { pw = require('playwright'); }
const T = path.join(HERE, 'node_modules', 'three');
const LIBS = ['build/three.min.js', 'examples/js/environments/RoomEnvironment.js', 'examples/js/math/ConvexHull.js', 'examples/js/geometries/ConvexGeometry.js', 'examples/js/utils/BufferGeometryUtils.js'].map(f => path.join(T, f));
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage(); page.on('pageerror', e => console.log('ERR', e.message));
  await page.setContent('<html><body></body></html>');
  for (const f of LIBS.concat([path.join(HERE, 'lib.js'), path.join(HERE, 'icon_page.js'), path.join(HERE, 'objs', '70_castaway.js')])) await page.addScriptTag({ path: f });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const icons = await page.evaluate(() => {
    T3.setup(); THREE.ColorManagement.legacyMode = false;
    var o = {};
    ['wilson', 'castawaylog'].forEach(function (id) { T3.seed(id); o[id] = T3.icon(T3.OBJ[id], 256); });
    return o;
  });
  for (const k in icons) fs.writeFileSync(path.join(out, k + '.png'), Buffer.from(icons[k].split(',')[1], 'base64'));
  await b.close(); console.log('ok', Object.keys(icons).join(','));
})();
