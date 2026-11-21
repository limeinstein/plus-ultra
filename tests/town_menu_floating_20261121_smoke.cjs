/* 실제 거리 메뉴: 제목 없는 양피지 버튼·작은 도시·긴 이름·배율과 진입 동작. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = process.env.OUT || path.join(ROOT, 'artifacts/town-menu-floating-20261121');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], cases = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      localStorage.setItem('pu.lang', 'ko'); localStorage.setItem('pu.uiSize', 'normal');
      const raf = requestAnimationFrame;
      window.requestAnimationFrame = cb => cb.name === 'loop' ? setTimeout(() => raf(cb), 150) : raf(cb);
    });
    await page.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '선장', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.settings.res = .35; G.Game.state.flags.prologue = true;
      G.UI.say = async () => {}; G.UI.fade = async fn => fn(); G.Scenes.city.findInside = async () => {};
      G.Game.go('city', { cityId: 0, load: true });
    });
    await page.waitForSelector('.town-menu');
    async function check(name) {
      await page.waitForTimeout(250);
      const result = await page.evaluate(() => {
        const m = document.querySelector('.town-menu'), r = m.getBoundingClientRect();
        const buttons = [...m.querySelectorAll('.cmd')];
        return {
          header: !!m.querySelector('h3'), wood: m.classList.contains('wood'), label: m.getAttribute('aria-label'), count: buttons.length,
          keys: buttons.map(b => b.dataset.shortcut).join(''),
          inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1,
          scroll: m.querySelector('.items').scrollHeight > m.querySelector('.items').clientHeight + 1,
          area: r.width * r.height / (innerWidth * innerHeight),
          over: buttons.filter(b => {
            const key = b.querySelector('.cmd-key').getBoundingClientRect();
            return b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1 || [...b.children].some(c => {
              if (getComputedStyle(c).position === 'absolute') return false;
              return c.scrollWidth > c.clientWidth + 1 || c.getBoundingClientRect().right > key.left + 1;
            });
          }).map(b => b.textContent),
          gapsClickThrough: getComputedStyle(m).pointerEvents === 'none' && buttons.every(b => getComputedStyle(b).pointerEvents === 'auto')
        };
      });
      assert(!result.header && !result.wood && result.inside && !result.scroll && result.gapsClickThrough, name + JSON.stringify(result));
      assert.deepEqual(result.over, [], name + ' 글·키 겹침');
      cases.push({ name, ...result });
    }
    for (const [width, height, size] of [[1600,900,'normal'],[1280,720,'auto'],[960,540,'max'],[800,600,'normal']]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(size => { G.Game.setUiSize(size); G.Scenes.city.main(); }, size);
      await check(width + '×' + height + ' ' + size);
      if (width === 1600) {
        assert(cases.at(-1).area < .16, '기존 큰 패널보다 줄인 화면 점유');
        await page.screenshot({ path: path.join(OUT, 'lisbon-applied.png') });
      }
      if (width === 960) await page.screenshot({ path: path.join(OUT, 'lisbon-max.png') });
    }
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.evaluate(() => {
      G.Game.setUiSize('normal'); G.UI.clearScreen(); window.__townHit = '';
      G.UI.cmdMenu('작은 항구', '', [{ label: '항구', icon: 'anchor', onClick: () => { __townHit = '항구'; } }, { label: '성문', icon: 'gate' }], { town: true, shortcuts: true });
    });
    await check('작은 도시 두 건물·한 열');
    await page.locator('.town-menu .cmd').first().click();
    assert.equal(await page.evaluate(() => __townHit), '항구');
    await page.evaluate(() => {
      G.UI.clearScreen();
      G.UI.cmdMenu('긴 이름', '', Array.from({ length: 20 }, (_, i) => ({ label: i % 2 ? '리슐리외 추기경의 오래된 해군 사령부 저택' : '왕립 포르투갈 동인도 회사 상관', icon: 'mansion' })), { town: true, shortcuts: true });
    });
    await check('긴 건물 이름 스무 개');
    await page.screenshot({ path: path.join(OUT, 'long-labels.png') });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ cases, errors }, null, 2));
    console.log(JSON.stringify({ cases, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
