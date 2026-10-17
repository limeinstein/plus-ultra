/* 전체 화면 F11·제독 얼굴 순환 회귀 시험 — node tests/fullscreen_face_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const fs = await page.evaluate(async () => {
      let current = null, entered = 0, exited = 0;
      Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => true });
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => current });
      document.documentElement.requestFullscreen = function () { entered++; current = document.documentElement; document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); };
      document.exitFullscreen = function () { exited++; current = null; document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); };
      const press = () => !window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F11', code: 'F11', bubbles: true, cancelable: true }));
      const canceledIn = press(); await new Promise(r => setTimeout(r, 20)); const on = G.UI.fs.on();
      const canceledOut = press(); await new Promise(r => setTimeout(r, 20)); const off = !G.UI.fs.on();
      return { can: G.UI.fs.can(), canceledIn, canceledOut, on, off, entered, exited };
    });
    ok(fs.can && fs.canceledIn && fs.canceledOut && fs.on && fs.off && fs.entered === 1 && fs.exited === 1,
      'F11이 브라우저 기본 동작을 막고 게임 전체 화면을 켰다 끈다');

    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#faceprev');
    const first = await page.locator('.look-name').innerText();
    await page.click('#faceprev');
    const zero = await page.locator('.look-name').innerText();
    await page.click('#faceprev');
    const last = await page.locator('.look-name').innerText();
    await page.click('#face');
    const wrapped = await page.locator('.look-name').innerText();
    const count = +((first.match(/\/(\d+)/) || [])[1] || 0);
    ok(/2\//.test(first) && /1\//.test(zero) && new RegExp(count + '\\/\\s*' + count).test(last) && /1\//.test(wrapped),
      '얼굴 ◀·▶가 처음과 마지막 사이를 순환한다 (' + first.replace(/\s+/g, ' ') + ' → ' + last.replace(/\s+/g, ' ') + ' → ' + wrapped.replace(/\s+/g, ' ') + ')');
    ok((await page.locator('#faceprev').innerText()).includes('앞 얼굴') && (await page.locator('#face').innerText()).includes('다음 얼굴'), '얼굴 단추의 방향을 글자로 안내한다');
    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ' — ' + errors.join(' / ') : ''));
  } catch (e) { console.error('실패:', e.message); if (errors.length) console.error(errors.join('\n')); process.exitCode = 1; }
  await browser.close();
})();
