/* 실제 깃발 파일, 그림 수배서, 소지품과 현상금 표시를 file://에서 확인한다. */
'use strict';
const assert = require('assert').strict;
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const roster = require('../tools/pirate_roster_20261110/prompts.json');

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--allow-file-access-from-files', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1152, height: 798 } });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    const keys = roster.flags.map(f => ['items/' + f.id, 256, 256])
      .concat(roster.portraits.map(p => ['wanted/' + p.id, 512, 768]));
    const missing = await page.evaluate(async entries => {
      const bad = [];
      for (let i = 0; i < entries.length; i += 6) {
        await Promise.all(entries.slice(i, i + 6).map(async ([key, width, height]) => {
          const im = await G.Img.load(key);
          if (!im || im.naturalWidth !== width || im.naturalHeight !== height) bad.push(key);
        }));
      }
      return bad;
    }, keys);
    assert.deepEqual(missing, []);
    const item = 'flag_calico';
    await page.evaluate(async item => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '제독', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state;
      s.flags.prologue = true; s.date = { y: 1600, m: 5, d: 1 };
      s.settings.sound = 0; s.settings.music = 0; s.settings.res = 0.35;
      const lis = Object.values(G.CITY_DATA).find(c => c.name === '리스본');
      s.loc = { mode: 'city', city: lis.id, lon: lis.lon, lat: lis.lat, via: 'sea' };
      G.Wanted.giveFlag(item.slice(5), []);
      G.Game.go('city', { cityId: lis.id });
    }, item);
    await page.waitForFunction(() => G.Game.sceneName === 'city');
    for (let i = 0; i < 6 && await page.evaluate(() => G.UI.busy()); i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(180);
    }
    await page.evaluate(() => { G.Info.open('items'); });
    await page.waitForSelector('.items-tbl canvas[data-img="items/' + item + '"]');
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'inventory-game.jpg') });
    await page.keyboard.press('Escape');
    await page.waitForSelector('.items-tbl', { state: 'detached' });
    const expected = await page.evaluate(() => {
      const c = G.CITY_DATA[G.Game.state.loc.city];
      const p = G.Wanted.posters('atl')[0];
      const q = G.Captains.pirates().find(other => other.id !== p.id);
      G.Wanted.st().abs[p.id] = [q.id];
      G.Wanted.board(c);
      return { id: p.id, name: p.name, band: p.band, pay: G.U.num(G.Wanted.bounty(p)) };
    });
    await page.waitForSelector('.wp-card .wp-face canvas[data-img="wanted/' + expected.id + '"]');
    const card = page.locator('.wp-card').filter({ has: page.locator('[data-img="wanted/' + expected.id + '"]') });
    assert.equal(await card.locator('.wp-name').innerText(), expected.name);
    assert.equal(await card.locator('.wp-pay').innerText(), '현상금 ' + expected.pay + '닢');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.wp-card canvas')).every(c => c.dataset.img));
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'board-game.jpg') });
    await card.click();
    await page.waitForSelector('.wp-big canvas[data-img="wanted/' + expected.id + '"]');
    await page.waitForSelector('.wp-big canvas[data-img="items/flag_' + expected.band + '"]');
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'detail-game.jpg') });
    assert.deepEqual(errors, []);
    console.log(roster.flags.length + '개 소지품 그림, ' + roster.portraits.length + '장 수배서, 소지품 창, 벽보 상세와 현상금 확인');
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
