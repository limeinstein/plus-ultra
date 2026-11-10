/* 통합 검증 중 발견한 마을 기능 충돌·첫날 현상금·이전 언어 단계 회귀 검사. */
'use strict';
const assert = require('assert'), path = require('path'), { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    const base = process.env.WEB_BASE;
    await page.goto(base ? new URL('index.html', base).href : pathToFileURL(path.resolve(__dirname, '../index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      const modules = [typeof G.Folk.town, typeof G.Folk.tavern, typeof G.Folktales.ready, typeof G.Folktales.pending];
      const s = G.State.newGame({ name: '통합 검사', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const c = G.CITY_DATA[s.player.home], UI = G.UI;
      s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat }; s.player.gold = 100000; s.day = 0;
      UI.say = async () => {}; UI.toast = () => {}; G.Scenes.city.say = async () => {};
      const p = G.Captains.pirates().find(p => p.band), npc = { kind: 'pirate', cap: p, zone: p.zones[0] };
      const oldAbsorb = G.Wanted.absorb; G.Wanted.absorb = () => null;
      let first, second, paid;
      try {
        G.Wanted.afterWin(npc, []); first = G.Wanted.due();
        await G.Wanted.claim(c); paid = G.Wanted.st().paid[p.id];
        G.Wanted.afterWin(npc, []); second = G.Wanted.due();
      } finally { G.Wanted.absorb = oldAbsorb; }
      const k = { name: '이전 저장의 아이', given: '아이', sex: 'm', unnamed: false, born: { y: s.date.y - 10, m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: { 0: 3, 1: 3, 2: 3, 3: 3, 5: 3 }, edu: {}, bond: 70 };
      s.player.kids = [k]; s.player.wife = Object.keys(G.MAID)[0];
      const answers = ['edu', 'lang']; UI.ask = async () => answers.shift() ?? null;
      const pick = G.U.pick, chance = G.U.chance;
      try { G.U.pick = a => a[0]; G.U.chance = () => true; await G.Family.talk(); }
      finally { G.U.pick = pick; G.U.chance = chance; }
      return { modules, first, second, paid, languages: Object.values(k.lg), taught: k.edu[s.date.y] };
    });
    assert.deepStrictEqual(r.modules, ['function', 'function', 'function', 'function']);
    assert(r.first > 0); assert.equal(r.paid, 0); assert.equal(r.second, 0);
    assert.equal(r.taught, 'lang'); assert(r.languages.every(v => v === 3)); assert.deepStrictEqual(errors, []);
    console.log('민족 마을·옛이야기 공존, 첫날 현상금 1회 지급, 이전 언어 3단계 보존, 브라우저 오류 0 통과');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
