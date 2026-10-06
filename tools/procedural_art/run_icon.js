'use strict';
const fs = require('fs'), path = require('path'), HERE = __dirname;
let pw; try { pw = require(path.join(HERE, 'node_modules', 'playwright-core')); } catch (e) { pw = require('playwright'); }
const T = path.join(HERE, 'node_modules', 'three');
const LIBS = ['build/three.min.js', 'examples/js/environments/RoomEnvironment.js', 'examples/js/math/ConvexHull.js', 'examples/js/geometries/ConvexGeometry.js', 'examples/js/utils/BufferGeometryUtils.js'].map(f => path.join(T, f));
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage(); page.on('pageerror', e => console.log('ERR', e.message));
  await page.setContent('<html><body></body></html>');
  for (const f of LIBS.concat([path.join(HERE, 'lib.js'), path.join(HERE, 'trade', 'trade.js'), path.join(HERE, 'icon_page.js')])) await page.addScriptTag({ path: f });
  const icons = await page.evaluate(() => {
    T3.setup(); THREE.ColorManagement.legacyMode = false; T3.seed('icons');
    return {
      banana: T3.icon(function () { var g = T3.group(T3.bananaHand(7, 1.0)); var h = T3.bananaHand(5, 0.9); h.position.set(0.08, 0.0, 0.12); h.rotation.y = 0.7; g.add(h); g.rotation.y = 1.3; return g; }, 192),
      sweetpotato: T3.icon(function () { var g = T3.group(); [[0, 0, 0, 0.3, 0.2], [0.12, 0.0, 0.1, 0.27, -0.5], [-0.1, 0.02, 0.12, 0.25, 0.9], [0.02, 0.08, 0.05, 0.24, 2.0]].forEach(function (q) { var m = T3.sweetPotato(q[3]); m.position.set(q[0], q[1], q[2]); m.rotation.y = q[4]; g.add(m); }); return g; }, 192)
    };
  });
  for (const k in icons) fs.writeFileSync(path.join(out, k + '.png'), Buffer.from(icons[k].split(',')[1], 'base64'));
  await b.close(); console.log('ok');
})();
