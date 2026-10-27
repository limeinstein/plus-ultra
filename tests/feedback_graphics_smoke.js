/* 제보 #72·#73 — 옛 철새 초상 교정과 산치 전용 지도 그림을 실제 브라우저에서 확인한다. */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 620 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Wander && G.DiscoveryIcon && G.Reel);
    const result = await page.evaluate(async () => {
      const d = { id: 'wd_feedback_maria', name: '마리아 호날두', g: 'f', wd: true,
        style: 'ib', role: 'maid', type: 'nav', st: [50, 50, 50, 50], sk: {},
        face: 'portraits/npc-roles/is/priest', halfKey: 'portraits/npc-roles/is/priest_half' };
      G.MATE[d.id] = d;
      G.MATES.push(d);
      const half = G.Img.pick(G.Img.chain.mateHalf(d.id));
      const face = G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(d.id)));
      const landmark = G.DISC.sanchi;
      const key = G.DiscoveryIcon.key(landmark);
      const loaded = await Promise.all([G.Img.load(key), G.Img.load(face), G.Img.load(half),
        G.Img.load('discovery-ends/sanchi'), G.Img.load('discoveries/sanchi')]);
      const reel = await G.Reel.load('discovery-sheets/sanchi');
      const root = document.createElement('div');
      root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#e4d7b7;color:#302819;padding:24px;display:flex;gap:24px;align-items:center';
      document.body.appendChild(root);
      const panel = document.createElement('div');
      panel.style.cssText = 'width:576px;flex-shrink:0';
      panel.innerHTML = '<h2>산치 대탑</h2>';
      root.appendChild(panel);
      const icon = document.createElement('canvas');
      icon.width = icon.height = 220;
      icon.style.background = '#647a4f';
      panel.appendChild(icon);
      G.DiscoveryIcon.draw(icon.getContext('2d'), landmark, 110, 110, { scale: 4.5 });
      const movie = document.createElement('canvas');
      movie.width = 576; movie.height = 256;
      panel.appendChild(movie);
      if (reel) G.Reel.drawLast(movie, reel);
      const person = document.createElement('div');
      person.innerHTML = '<h2>마리아 호날두</h2>';
      root.appendChild(person);
      const image = document.createElement('img');
      image.src = G.Img.src(half);
      image.style.cssText = 'height:460px;max-width:260px;object-fit:contain';
      person.appendChild(image);
      await image.decode();
      const probe = document.createElement('canvas');
      probe.width = probe.height = 128;
      const ctx = probe.getContext('2d');
      ctx.drawImage(loaded[0], 0, 0, 128, 128);
      const top = ctx.getImageData(0, 0, 128, 12).data;
      const cleanTop = top.every((value, i) => i % 4 !== 3 || value === 0);
      return { face, half, corrected: d.face, allowed: G.Wander.facePool('ib', 'f', 'nav').includes(face),
        key, cleanTop, loaded: loaded.every(Boolean), reel: reel && [reel.cols, reel.rows, reel.n],
        iconSize: loaded[0] && [loaded[0].naturalWidth, loaded[0].naturalHeight] };
    });
    assert(result.allowed, JSON.stringify(result));
    assert.strictEqual(result.half, result.face + '_half');
    assert.strictEqual(result.key, 'map-discoveries/sanchi');
    assert(result.cleanTop, '산치 그림 위에 이웃 칸의 조각이 남지 않아야 한다');
    assert(result.loaded, '지도 그림·얼굴·무릎상·GIF·끝 장면을 모두 읽어야 한다');
    assert.deepStrictEqual(result.reel, [6, 3, 18]);
    assert.deepStrictEqual(errors, [], '페이지·콘솔 오류가 없어야 한다');
    fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
    await page.screenshot({ path: path.join(ROOT, 'artifacts/feedback-72-73-runtime.png') });
    console.log('통과 — 여성 철새 얼굴·무릎상 교정, 산치 전용 아이콘·발견 그림 3종, 콘솔 오류 0', result);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
