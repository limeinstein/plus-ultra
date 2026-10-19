/* 술집: 고용하기 전에 「능력치를 살펴본다」 — 인물 카드(능력치·특기·말·필요 명성·월급) → 돌아가기 / 고용하기 (js/city/tavern.js T.showCard) */
'use strict';
const assert = require('assert');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(os.tmpdir(), 'tavern_card');
require('fs').mkdirSync(OUT, { recursive: true });

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const pick = await page.evaluate(() => {
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0; s.player.fame = 99999; s.player.gold = 99999;
      const T = G.Scenes.city.B.tavern;
      const m = G.MATES.filter(x => !x.wd && x.lg && x.lg[1] >= 3 && x.st && x.sk && Object.keys(x.sk).length >= 2)[0];
      window.__m = m; window.__asks = [];
      const ask = G.UI.ask; let n = 0;
      G.UI.ask = async (q, opts) => { window.__asks.push(opts.map(o => o.label)); n++; return n === 1 ? 'card' : n === 2 ? 'card' : null; };
      G.UI.say = async () => {}; G.UI.confirm = async () => true;
      window.__done = T.talkMate(G.CITY_DATA[1], m, true).then(() => 'done');
      return { id: m.id, name: m.name };
    });
    // 첫 번째: 카드를 보고 「돌아간다」
    await page.waitForSelector('.mcard-solo .mc-foot button', { timeout: 15000 });
    const card = await page.evaluate(() => {
      const el = document.querySelector('.mcard-solo');
      return { title: document.querySelector('.win .title').textContent, stats: el.querySelectorAll('.statline').length, skills: el.querySelectorAll('.mc-col .pipline').length, text: el.textContent, btns: [...el.querySelectorAll('.mc-foot button')].map(b => b.textContent + (b.disabled ? '(x)' : '')) };
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'card.png') });
    await page.evaluate(() => [...document.querySelectorAll('.mcard-solo .mc-foot button')].filter(b => /돌아간다/.test(b.textContent))[0].click());
    // 두 번째: 카드에서 바로 「부하로 고용한다」
    await page.waitForSelector('.mcard-solo .mc-foot button', { timeout: 15000 });
    await page.evaluate(() => [...document.querySelectorAll('.mcard-solo .mc-foot button')].filter(b => /고용/.test(b.textContent))[0].click());
    const done = await page.evaluate(() => window.__done);
    const after = await page.evaluate(() => ({ hired: G.Game.state.mates.some(x => x.id === window.__m.id), asks: window.__asks.length, menu: window.__asks[0] }));
    assert(card.title.indexOf(pick.name) >= 0, '카드 제목에 이름');
    assert.strictEqual(card.stats, 4, '능력치 네 줄');
    assert(card.skills >= 2, '특기·말 줄');
    assert(/필요 명성/.test(card.text) && /월급/.test(card.text), '필요 명성·월급');
    assert.deepStrictEqual(card.btns, ['돌아간다', '부하로 고용한다']);
    assert(after.menu.indexOf('능력치를 살펴본다') >= 0, '용건 메뉴에 「능력치를 살펴본다」');
    assert.strictEqual(after.hired, true, '카드에서 바로 고용');
    assert.strictEqual(after.asks, 2, '돌아가면 다시 용건을 묻고, 고용하면 끝난다');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify({ pick, card: Object.assign(card, { text: card.text.slice(0, 120) }), after, done }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
