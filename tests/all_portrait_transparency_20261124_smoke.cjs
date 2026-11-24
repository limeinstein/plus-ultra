/* 등록된 얼굴상 전체를 실제 이미지 로더와 공통 그리기로 검사한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/portrait-transparency-audit-20261124');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], results = [];
  const retry = process.argv.includes('--retry-failures');
  const reportFile = path.join(OUT, 'runtime-audit.json');
  const previous = retry ? JSON.parse(fs.readFileSync(reportFile, 'utf8')) : null;
  let page;
  async function open() {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.addInitScript(() => { window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : setTimeout(() => cb(performance.now()), 16); });
    await p.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await p.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await p.evaluate(() => {
      window.alphaStats = cv => {
        const data = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let clear = 0, solid = 0;
        for (let i = 3; i < data.length; i += 4) { if (data[i] === 0) clear++; if (data[i] > 250) solid++; }
        return { clear, solid, corner: data[3] };
      };
    });
    return p;
  }
  try {
    page = await open();
    const keys = retry ? previous.failures.map(r => r.key) : await page.evaluate(() => Object.keys(G.IMAGE_FILES).filter(k => /^(portraits|maid-styles)\//.test(k) && !/_half(?:$|\/)/.test(k)));
    // 큰 원화를 메모리에 쌓아 두지 않도록 묶음마다 페이지를 닫는다.
    for (let at = 0; at < keys.length; at += 100) {
      if (at) { await page.close(); page = await open(); }
      const rows = await page.evaluate(async keys => {
        const out = [];
        for (const key of keys) {
          const im = await G.Img.load(key);
          if (!im || !im.naturalWidth) { out.push({ key, error: '그림 읽기 실패' }); continue; }
          const frame = G.FX.portraitFace.frames[key];
          if (frame && frame.source) await G.Img.load(frame.source);
          const source = G.Art.canvas(64, 64); source.getContext('2d').drawImage(im, 0, 0, 64, 64);
          const spec = G.Art.withImg(G.Art.npcSpec('alpha:' + key, 'captain', 'ib', 'm'), [key]);
          spec.noRole = true; spec.noFallback = true;
          const rendered = G.Art.portraitCanvas(spec, 64);
          out.push({ key, source: alphaStats(source), transparentSource: frame && frame.source, rendered: alphaStats(rendered) });
        }
        return out;
      }, keys.slice(at, at + 100));
      results.push(...rows);
      console.log('얼굴상 검사 ' + results.length + '/' + keys.length);
    }
    const fallback = await page.evaluate(async () => {
      const spec = G.Art.portraitSpec({ seed: '투명 대체 얼굴', culture: 'asia', g: 'f', age: 'young' });
      spec.noRole = true; spec.noFallback = true;
      const modes = [undefined, false, true, false, undefined].map(transparent => ({ transparent: transparent !== false,
        stats: alphaStats(G.Art.portraitCanvas(spec, 100, transparent === undefined ? undefined : { transparent })) }));
      const key = 'portraits/alpha-test-fallback'; G.IMAGE_FILES[key] = 'portraits/alpha-test-fallback.webp';
      G.Img.reset(); spec.img = [key];
      const resolve = G.Img.resolve; G.Img.resolve = async () => null;
      let cv;
      try { cv = G.Art.portraitCanvas(spec, 100); await new Promise(r => setTimeout(r, 20)); }
      finally { G.Img.resolve = resolve; delete G.IMAGE_FILES[key]; }
      return { modes, failedImage: alphaStats(cv) };
    });
    const replacements = new Map(results.map(r => [r.key, r]));
    const all = previous ? previous.files.map(r => replacements.get(r.key) || r) : results;
    const failures = all.filter(r => r.error || (!r.source.clear && !r.transparentSource) || !r.rendered.clear || !r.rendered.solid);
    fs.writeFileSync(reportFile, JSON.stringify({ count: all.length, checkedThisRun: results.length, failures, fallback, errors, files: all }, null, 2));
    assert.deepStrictEqual(failures, [], '원본·표시 얼굴상의 투명 여백');
    for (const m of fallback.modes) assert(m.transparent ? m.stats.clear > 0 && m.stats.corner === 0 : m.stats.clear === 0, '대체 얼굴·캐시: ' + JSON.stringify(m));
    assert(fallback.failedImage.clear > 0 && fallback.failedImage.corner === 0, '원화 로딩 실패 뒤 대체 얼굴');
    assert.deepStrictEqual(errors, [], '콘솔·페이지 오류');
    await page.evaluate(async () => {
      G.Game.showLayers(false, false, true); G.UI.clearScreen(); G.UI.hud.hide();
      if (G.Loader) G.Loader.hide(); document.querySelector('#boot-loader')?.remove();
      const grid = document.createElement('div'); grid.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:20px;overflow:auto;background:#263e46;color:#fff;font:16px sans-serif';
      document.body.appendChild(grid);
      for (const key of ['portraits/history/papal_legate', 'portraits/rivals/가라앉은 종소리 이네스', 'portraits/rivals/붉은 손톱 카테리나', 'portraits/rivals/금빛 날개 데위',
        'portraits/rivals/물범 가죽의 에일리드', 'portraits/history/ot_suleyman', 'maid-styles/japan/1', 'portraits/rivals/앤 보니']) {
        await G.Img.load(key);
        const frame = G.FX.portraitFace.frames[key]; if (frame && frame.source) await G.Img.load(frame.source);
        const spec = G.Art.withImg(G.Art.npcSpec('preview:' + key, 'captain', 'ib', 'm'), [key]); spec.noRole = true; spec.noFallback = true;
        const cell = document.createElement('div'); cell.style.cssText = 'padding:10px;background:repeating-conic-gradient(#7eaaa4 0% 25%,#d8bf8f 0% 50%) 0 0/28px 28px;text-align:center;overflow:hidden';
        const cv = G.Art.portraitCanvas(spec, 230); cell.appendChild(cv);
        const label = document.createElement('div'); label.textContent = key; label.style.cssText = 'background:#20333b;padding:8px;font-size:12px'; cell.appendChild(label); grid.appendChild(cell);
      }
    });
    await page.screenshot({ path: path.join(OUT, 'verified-faces.png') });
    console.log(JSON.stringify({ faces: all.length, checkedThisRun: results.length, failures: failures.length, errors, output: OUT }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
