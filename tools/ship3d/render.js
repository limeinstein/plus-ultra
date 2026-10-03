/* 배 3D 시트 굽기 — 헤드리스 Chromium(Playwright)에서 three.js로 그린다. 보통은 tools/ship3d/bake.py가 부른다.
   node tools/ship3d/render.js <specs.json> <출력 폴더> [--preview <목록.json>]
   필요한 것: playwright(Chromium), three@0.147.0. 찾는 곳: NODE_PATH, tools/ship3d/node_modules, 이 저장소의 node_modules.
   CHROME_PATH를 주면 그 Chrome/Chromium을 쓴다(Windows는 기본 Chrome). */
'use strict';
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
function need(name) {
  const tries = [name, path.join(HERE, 'node_modules', name), path.join(HERE, '..', '..', 'node_modules', name)];
  for (const t of tries) { try { return require.resolve(t); } catch (e) { /* 다음 */ } }
  throw new Error(name + '를 찾지 못했습니다. tools/ship3d에서 `npm install three@0.147.0 playwright` 하거나 NODE_PATH를 지정하세요.');
}
const { chromium } = require(need('playwright'));
const THREE_JS = path.join(path.dirname(need('three')), 'three.min.js');   // three 0.147: build/three.cjs 옆

(async () => {
  const [specFile, outDir] = process.argv.slice(2);
  const pi = process.argv.indexOf('--preview');
  const preview = pi > 0 ? JSON.parse(fs.readFileSync(process.argv[pi + 1], 'utf8')) : null;
  const ssi = process.argv.indexOf('--ss');
  const ss = ssi > 0 ? Number(process.argv[ssi + 1]) : 3;
  const specs = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  fs.mkdirSync(outDir, { recursive: true });
  const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  const browser = await chromium.launch({ executablePath, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
  for (const f of [THREE_JS, path.join(HERE, 'ship3d_tex.js'), path.join(HERE, 'ship3d_models.js'), path.join(HERE, 'ship3d_page.js')]) await page.addScriptTag({ path: f });
  const info = await page.evaluate(ss => Bake.setup({ ss }), ss);
  console.log('준비: 배율 ' + info.ss + 'x, 높이 ' + info.ys.toFixed(3));
  const log = [];
  for (const spec of specs) {
    if (preview) {
      const r = await page.evaluate(([s, l, sc]) => Bake.preview(s, l.list, sc), [spec, preview, preview.scale || 1]);
      r.frames.forEach((d, i) => fs.writeFileSync(path.join(outDir, `${spec.id}_${i}.png`), Buffer.from(d.split(',')[1], 'base64')));
      console.log(`${spec.id} 미리보기 ${r.frames.length}장 · 맞춤 ${r.k.toFixed(3)}`);
      log.push({ id: spec.id, k: r.k, box: r.box });
    } else {
      const r = await page.evaluate(s => Bake.ship(s), spec);
      fs.writeFileSync(path.join(outDir, spec.id + '.png'), Buffer.from(r.png.split(',')[1], 'base64'));
      console.log(`${spec.id} · 맞춤 ${r.k.toFixed(3)} · ${(r.ms / 1000).toFixed(1)}초`);
      log.push({ id: spec.id, k: r.k, box: r.box, ms: r.ms });
    }
    if (errors.length) break;
  }
  fs.writeFileSync(path.join(outDir, '_log.json'), JSON.stringify(log, null, 1));
  await browser.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
