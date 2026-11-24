/* 마을 하단 황동 인장: 실제 창 연결·키보드·화면 크기 검사. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/town-infobar-medallions-20261124');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], report = { layouts: [], opened: [] };
  let page;
  try {
    page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      localStorage.setItem('pu.lang', 'ko'); localStorage.setItem('pu.uiSize', 'normal');
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => cb.name === 'loop' ? setTimeout(() => raf(cb), 150) : raf(cb);
    });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const s = G.Game.state = G.State.newGame({ name: '선장', nation: 'PT', job: 'explorer', age: 24,
        birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.settings.res = .35; s.flags.prologue = true;
      G.UI.say = async () => {}; G.UI.fade = async fn => fn(); G.Scenes.city.findInside = async () => {};
      G.Game.go('city', { cityId: 0, load: true });
    });
    const ready = async () => page.waitForFunction(() => G.Game.sceneName === 'city' && !G.Scenes.city.isBusy() && !G.UI.busy() && !!document.querySelector('.town-medallions'), null, { timeout: 60000 });
    await ready();
    assert.deepEqual(await page.locator('.town-medallions .tb-label').allTextContents(), ['제독','함대','소지품','발견물','계약·의뢰','해도','일지','수첩','설정']);
    assert.equal(await page.locator('.town-medallions .tb-medal > svg').count(), 9);
    for (const key of ['admiral','fleet','items','disc','contract','map','log','notebook','settings']) {
      await page.locator('[data-town-info="' + key + '"]').click();
      await page.waitForFunction(() => G.UI.busy());
      if (key !== 'settings') {
        await page.waitForSelector('.notebook-win');
        const actual = await page.locator('.notebook-win').getAttribute('data-tab');
        assert.equal(actual, key === 'notebook' ? 'log' : key);
      } else {
        assert.equal(await page.locator('.notebook-win').count(), 0);
        assert.match(await page.locator('.modal-back').innerText(), /설정/);
      }
      report.opened.push(key);
      await page.keyboard.press('Escape'); await ready();
    }
    const day = await page.evaluate(() => G.Game.state.day);
    await page.locator('[data-town-info="admiral"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.townInfo), 'fleet');
    await page.keyboard.press('End');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.townInfo), 'settings');
    await page.keyboard.press('Home');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.townInfo), 'admiral');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.townInfo), 'settings');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.townInfo), 'admiral');
    await page.keyboard.press('Enter'); await page.waitForSelector('.notebook-win[data-tab="admiral"]');
    await page.keyboard.press('Escape'); await ready();
    await page.locator('[data-town-info="fleet"]').focus();
    await page.keyboard.press('Space'); await page.waitForSelector('.notebook-win[data-tab="fleet"]');
    await page.keyboard.press('Escape'); await ready();
    assert.equal(await page.evaluate(() => G.Game.state.day), day);
    assert.equal(await page.evaluate(() => G.Scenes.city.current()), null);
    for (const [width, height, size] of [[1600,900,'normal'],[1280,720,'auto'],[960,540,'max'],[800,600,'normal']]) {
      await page.setViewportSize({ width, height }); await page.evaluate(s => G.Game.setUiSize(s), size);
      await page.waitForTimeout(250);
      const result = await page.evaluate(() => {
        const rect = x => { const r = x.getBoundingClientRect(); return { x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height }; };
        const bar = document.querySelector('.town-medallions'), buttons = [...bar.querySelectorAll('button')], b = rect(bar), caption = rect(document.querySelector('.caption'));
        return { bar:b, caption, buttons:buttons.map(x => ({ box:rect(x), label:rect(x.querySelector('.tb-label')), medal:rect(x.querySelector('.tb-medal')),
          text:x.textContent, overflow:x.querySelector('.tb-label').scrollWidth > x.querySelector('.tb-label').clientWidth + 1 || x.querySelector('.tb-label').scrollHeight > x.querySelector('.tb-label').clientHeight + 1 })) };
      });
      assert.ok(result.bar.x >= 0 && result.bar.right <= width + 1 && result.bar.bottom <= height + 1);
      result.buttons.forEach((x, i, xs) => {
        assert.equal(x.overflow, false, size + ': ' + x.text);
        assert.ok(x.label.bottom <= result.bar.bottom + 1, size + ': 이름표 높이');
        assert.ok(x.medal.x >= x.box.x - 1 && x.medal.right <= x.box.right + 1, size + ': 인장 너비');
        if (i) assert.ok(xs[i-1].box.right < x.box.x);
      });
      assert.ok(result.caption.bottom <= result.bar.y || result.caption.x >= result.bar.right, size + ': 날짜 겹침');
      await page.evaluate(() => document.activeElement.blur());
      await page.locator('[data-town-info="notebook"]').hover();
      await page.screenshot({ path:path.join(OUT, 'town-' + width + '-' + size + '.png') });
      report.layouts.push({ width, height, size, ...result });
      console.log('통과: ' + width + '×' + height + ' ' + size + ' — 9개 메뉴·글자·날짜 겹침 없음');
    }
    await page.evaluate(() => G.Scenes.city.visit('inn'));
    await page.waitForFunction(() => !G.Scenes.city.isBusy() && !!G.Scenes.city.current() && !G.UI.busy());
    assert.equal(await page.locator('.town-medallions').count(), 0);
    await page.keyboard.press('Escape'); await ready();
    assert.equal(await page.locator('.town-medallions button').count(), 9);
    assert.deepEqual(errors, []);
    report.errors = errors; report.keyboard = '방향키·Home/End·Enter·Space'; report.interior = '여관 출입 후 9개 복구';
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log('통과: 실제 9개 창·수첩 마지막 탭·키보드·여관 출입·콘솔 오류 0');
  } catch (e) {
    if (page) { console.error(await page.evaluate(() => document.querySelector('#ui').innerText.slice(-1500)).catch(() => '')); await page.screenshot({ path:path.join(OUT,'failure.png') }).catch(() => {}); }
    throw e;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
