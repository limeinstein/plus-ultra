/* 설치형 게임 「GIF 팩」 점검 (먼저 python tools/build_desktop.py · python tools/build_gifpack.py)
   · 팩이 없으면: 발견 장면은 장면 판(G.Reel, Canvas) — 본 설치 파일만 깐 상태
   · 팩이 있으면(desktop/preload.js가 주는 PU_DESKTOP.gifpack을 흉내): 발견물 그림이 팩 안의 원본 GIF(<img>)로 나오고 실제로 읽힌다
   · 콘솔 오류 0
   node tests/desktop_gifpack_smoke.js */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const APP = path.join(ROOT, 'desktop', 'app', 'index.html'), PACK = path.join(ROOT, 'desktop', 'gifpack');
  if (!fs.existsSync(APP) || !fs.existsSync(path.join(PACK, 'images', 'gifpack-list.js'))) { console.error('✗ desktop/app 또는 desktop/gifpack 이 없습니다'); process.exitCode = 1; return; }
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const out = {};
    for (const withPack of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
      if (withPack) await page.addInitScript(u => { window.PU_DESKTOP = { gifpack: u, version: 'test' }; }, pathToFileURL(PACK).href);
      await page.goto(pathToFileURL(APP).href);
      await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
      out[withPack] = await page.evaluate(async () => {
        const d = G.DISC.kremlin, el = G.Scenes.discoveryPicture(d);
        const src = el.tagName === 'IMG' ? el.src : '';
        const w = src ? await new Promise(res => { const im = new Image(); im.onload = () => res(im.naturalWidth); im.onerror = () => res(0); im.src = src; }) : 0;
        return { pack: G.GIF_PACK || null, tag: el.tagName, reel: G.Reel.has(d), gif: /\.gif$/i.test(src), w };
      });
      await page.close();
    }
    ok(!out[false].pack && out[false].tag === 'CANVAS' && out[false].reel, '팩이 없으면 발견 장면은 장면 판(Canvas)으로 돈다');
    ok(out[true].pack && out[true].pack.count > 600 && out[true].tag === 'IMG' && out[true].gif && !out[true].reel && out[true].w > 0,
      '팩이 있으면 원본 GIF ' + (out[true].pack && out[true].pack.count) + '개를 쓰고, 크렘린 GIF를 실제로 읽었다 (너비 ' + out[true].w + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
