/* 해도의 ? 표식 (2026-10-26 사용자 요청): 술집에서 들은 미확인 발견물 — 마우스를 올리면 이름, 누르면 단서와 「수첩 단서에서 보기」 */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOT_DIR || '';

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  async function shot(name) { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name), timeout: 150000 }); } }
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.ChartView && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const setup = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0;
      const home = G.CITY_DATA[s.player.home];
      // 리스본 술집에서 들은 소문: 가까운 바다·뭍의 발견물 하나
      const d = G.DISCOVERIES.filter(x => (x.how === 'sea' || x.how === 'land') && G.Disc.available(x) && !G.Disc.foundByMe(x.id)).sort((a, b) => G.Geo.dist(home.lon, home.lat, a.lon, a.lat) - G.Geo.dist(home.lon, home.lat, b.lon, b.lat))[3];
      G.Disc.addHint(d.id, 'tavern:' + home.id);
      s.marks = s.marks || {}; s.marks[d.id] = { t: s.day, mode: 'rumor', u: 1.2 }; G.Explore.ver++;
      const m = G.Explore.markers(home.lon, home.lat, 'sea').find(x => x.d.id === d.id);
      return { id: d.id, name: d.name, tip: G.Explore.markerTip(m), info: G.Explore.markerInfo(m) };
    });
    // 수첩 「해도」
    await page.evaluate(() => { window.__nb = G.Info.open('map'); });
    await page.waitForSelector('.chartview canvas', { timeout: 20000 });
    await page.waitForTimeout(800);
    // 표식 쪽으로 확대해 두고 다시 그린다
    const pos = await page.evaluate((id) => {
      const api = document.querySelector('.chartview')._cv, s = G.Game.state, d = G.DISC[id];
      api.view.lon = d.lon; api.view.lat = d.lat; api.view.span = 24; api.redraw();
      const q = api.marks().find(x => x.m.d.id === id); if (!q) return null;
      const cv = document.querySelector('.chartview canvas'), r = cv.getBoundingClientRect();
      return { x: r.left + q.x / cv.width * r.width, y: r.top + q.y / cv.height * r.height, n: api.marks().length };
    }, setup.id);
    assert(pos, '해도에 ? 표식이 그려졌다');
    await page.mouse.move(pos.x - 30, pos.y - 30);
    await page.mouse.move(pos.x, pos.y);
    await page.waitForTimeout(400);
    const cursor = await page.evaluate(() => document.querySelector('.chartview canvas').style.cursor);
    await shot('01_해도_물음표_마우스.png');
    await page.mouse.down(); await page.mouse.up();
    await page.waitForSelector('.chartview .cv-info:not([hidden]) [data-a="hint"]', { timeout: 10000 });
    const panel = await page.evaluate(() => document.querySelector('.chartview .cv-info').textContent);
    await shot('02_해도_물음표_누름.png');
    await page.click('.chartview .cv-info [data-a="hint"]');
    await page.waitForSelector('.hint-item.hl', { timeout: 10000 });
    await page.waitForTimeout(500);
    const hint = await page.evaluate(() => ({ tab: document.querySelector('.tabs .tab.on').textContent, id: document.querySelector('.hint-item.hl').getAttribute('data-hid'), wins: document.querySelectorAll('.modal-back').length }));
    await shot('03_수첩_단서.png');

    assert(/「.+」 \(.+\) · .*술집의 소문/.test(setup.tip), setup.tip);
    assert(setup.tip.indexOf(setup.name) >= 0, '이름이 뜬다');
    assert.strictEqual(cursor, 'pointer');
    assert(panel.indexOf(setup.name) >= 0 && /술집의 소문/.test(panel) && /수첩 「단서」에서 보기/.test(panel), panel);
    assert.strictEqual(hint.tab, '단서'); assert.strictEqual(hint.id, setup.id); assert.strictEqual(hint.wins, 1, '같은 수첩에서 단서 탭으로');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify({ setup, pos, panel, hint }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
