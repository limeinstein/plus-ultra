/* 로딩용 갤리온: 항로의 접선에 맞춰 매 장면을 실제 3D로 새로 그린다. */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const { chromium } = require('playwright');

(async () => {
  const cfg = JSON.parse(fs.readFileSync(0, 'utf8'));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader']
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') console.log(m.text()); });
    await page.setContent('<!doctype html><html><body></body></html>');
    for (const name of [
      'tools/procedural_art/node_modules/three/build/three.min.js',
      'tools/ship3d/ship3d_tex.js', 'tools/ship3d/ship3d_models.js', 'tools/ship3d/ship3d_page.js'
    ]) await page.addScriptTag({ path: path.join(root, name) });
    await page.evaluate(() => {
      const Original = THREE.WebGLRenderer;
      THREE.WebGLRenderer = class extends Original { constructor(args) { super(args); window.rendererAudit = this; } };
      Bake.setup({ ss: 2, exposure: 1.5 });
    });
    const rendered = await page.evaluate(cfg => Bake.preview(cfg.spec, cfg.poses, 1), cfg);
    if (await page.evaluate(() => rendererAudit.getContext().isContextLost())) throw new Error('WebGL 렌더링 장치를 잃었습니다. 빈 그림은 저장하지 않습니다.');
    if (errors.length) throw new Error(errors.join('\n'));
    fs.mkdirSync(cfg.out, { recursive: true });
    rendered.frames.forEach((url, i) => fs.writeFileSync(
      path.join(cfg.out, `ship-${String(i).padStart(3, '0')}.png`), Buffer.from(url.split(',')[1], 'base64')));
    fs.writeFileSync(path.join(cfg.out, 'scale.json'), JSON.stringify({ scale: rendered.k, hullLength: cfg.spec.L }));
    console.log(`갤리온 ${rendered.frames.length}장: 선수·선미·양현을 항로 방향에 맞춰 3D로 렌더링`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
