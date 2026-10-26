/* 건물 안 수첩 단추를 열고 닫으면 원래 건물 메뉴로 돌아오는지 확인한다. */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }

const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await pw.chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : setTimeout(() => cb(performance.now()), 16); });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '수첩시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.go('city', { cityId: 0, load: true });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.city-banner'));
    // Game.go는 도시 진입 작업을 백그라운드에서 끝낸다. 기본 거리 메뉴가 안정된 뒤 건물로 들어간다.
    await page.waitForFunction(() => !G.UI.busy() && (!G.Loader || !G.Loader.shown()), null, { timeout: 30000 });
    await page.evaluate(() => { G.Scenes.city.visit('market'); });
    // 첫 방문 상인 인사처럼 건물 진입 대화가 있으면 끝까지 넘긴다.
    for (let i = 0; i < 20 && !await page.locator('.bld-notebook').count(); i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(180);
    }
    const button = page.locator('.bld-notebook');
    await button.waitFor({ timeout: 15000 });
    assert.strictEqual(await button.getAttribute('aria-label'), '항해 수첩 열기');
    await button.click();
    await page.waitForFunction(() => [...document.querySelectorAll('.modal-back')].some(x => /항해 수첩/.test(x.textContent || '')));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.modal-back') && document.querySelector('.bld-notebook'));
    assert.strictEqual(await page.locator('.bld-plaque .nm').textContent(), '시장');
    assert.deepStrictEqual(errors, []);
    console.log('통과: 건물 수첩 열기·닫기·시장 메뉴 복귀, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
