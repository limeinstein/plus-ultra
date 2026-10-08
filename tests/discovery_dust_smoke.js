/* 발견물 탐지 표식의 먼지 구름 점검.
   · 점선/외곽선 없이 분류색의 반투명 먼지가 그려진다.
   · 중심 밖 구름은 화면을 가리지 않을 만큼 옅다.
   · 시간이 흐르면 구름과 먼지 알갱이가 실제로 움직인다.
   node tests/discovery_dust_smoke.js  (미리보기: OUT 경로) */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1120, height: 650 } });
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Explore && G.U, null, { timeout: 90000 });
    const stats = await page.evaluate(() => {
      const sample = (t, cat, id) => {
        const cv = document.createElement('canvas'); cv.width = 360; cv.height = 260;
        const ctx = cv.getContext('2d');
        let strokes = 0, dashes = 0;
        const stroke = ctx.stroke.bind(ctx), dash = ctx.setLineDash.bind(ctx);
        ctx.stroke = function () { strokes++; return stroke(); };
        ctx.setLineDash = function (v) { if (v.length) dashes++; return dash(v); };
        G.Explore.drawMarker(ctx, { d: { id, cat }, col: G.Explore.catColor(cat) }, [180, 140], 130, t, 'sans-serif');
        const px = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let visible = 0, outerMax = 0, sum = 0;
        for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
          const a = px[(y * cv.width + x) * 4 + 3];
          if (a) visible++;
          if (Math.hypot(x - 180, y - 140) > 24) outerMax = Math.max(outerMax, a);
          sum += a;
        }
        return { cv, px, visible, outerMax, sum, strokes, dashes };
      };
      const a = sample(1.2, 'nature', 'dust_nature'), b = sample(4.7, 'nature', 'dust_nature');
      let changed = 0;
      for (let i = 0; i < a.px.length; i += 4) if (Math.abs(a.px[i + 3] - b.px[i + 3]) > 2) changed++;

      const preview = document.createElement('canvas'); preview.id = 'dust-preview'; preview.width = 1080; preview.height = 560;
      preview.style.cssText = 'position:fixed;left:20px;top:20px;z-index:99999;width:1080px;height:560px'; document.body.appendChild(preview);
      const pc = preview.getContext('2d'), cats = ['geo', 'nature', 'ruin', 'treasure', 'creature', 'people'];
      pc.fillStyle = '#315b6a'; pc.fillRect(0, 0, 1080, 280); pc.fillStyle = '#74684f'; pc.fillRect(0, 280, 1080, 280);
      pc.fillStyle = 'rgba(255,255,255,.7)'; pc.font = '18px sans-serif'; pc.fillText('바다', 18, 30); pc.fillText('육지', 18, 310);
      cats.forEach((cat, i) => {
        const x = 130 + (i % 3) * 350, y = i < 3 ? 150 : 420;
        G.Explore.drawMarker(pc, { d: { id: 'preview_' + cat, cat }, col: G.Explore.catColor(cat) }, [x, y], 115, 3.4, 'sans-serif');
        pc.globalAlpha = 0.85; pc.fillStyle = '#fff'; pc.textAlign = 'center'; pc.font = '15px sans-serif'; pc.fillText(cat, x, y + 95); pc.globalAlpha = 1;
      });
      return { visible: a.visible, outerMax: a.outerMax, sum: a.sum, changed, strokes: a.strokes, dashes: a.dashes };
    });
    assert.strictEqual(stats.strokes, 0, '먼지 표식은 외곽선을 그리지 않는다');
    assert.strictEqual(stats.dashes, 0, '먼지 표식은 점선을 그리지 않는다');
    assert(stats.visible > 2500, '구름을 알아볼 만큼 넓은 픽셀이 그려진다');
    assert(stats.outerMax <= 52, '중심 밖 먼지의 최대 불투명도가 21%를 넘지 않는다 (실제 ' + stats.outerMax + '/255)');
    assert(stats.changed > 900, '시간이 흐르면 먼지 구름이 움직인다');
    if (process.env.OUT) await page.locator('#dust-preview').screenshot({ path: process.env.OUT });
    console.log('발견물 먼지 구름: 선 없음 · 바깥 최대 알파 ' + stats.outerMax + '/255 · 움직인 픽셀 ' + stats.changed);
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
