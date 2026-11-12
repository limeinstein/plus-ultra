/* 번역이 빠진 글 모으기 (js/core/i18n.js G.I18N.missing) — 2026-11-12
   고른 언어로 게임을 열어 화면을 차례로 띄우고, 옮기지 못한 한국어 글을 많이 본 차례로 파일에 적는다.
   그 파일을 번역해 js/lang/언어.js 의 text(통째로 같은 글) · pat(숫자가 섞인 글의 틀)에 넣으면 된다.
   숫자는 #로 묶어 적는다 (「금화 #닢」 같은 글은 pat 틀로 옮긴다).

   node tools/i18n_missing.js [언어=en] [내보낼 파일=tmp/i18n_missing_언어.json]
   (선택) BROWSER_EXE=크로뮴 실행 파일 · SHOTS=스크린샷 폴더 */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('./procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;

const ROOT = path.resolve(__dirname, '..');
const LANG = process.argv[2] || 'en';
const OUT = process.argv[3] || path.join(ROOT, 'tmp', 'i18n_missing_' + LANG + '.json');
const SHOTS = process.env.SHOTS || '';
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;

/* 둘러볼 화면 — 늘리려면 여기에 한 줄씩 (fn은 페이지 안에서 돈다: 약속(Promise)을 돌려주는 창은 기다리지 않는다) */
const SCREENS = [
  ['title_load', () => { G.Scenes.title.loadMenu(); }],
  ['title_help', () => { G.Scenes.title.help(); }],
  ['title_display', () => { G.Display.open(); }],
  ['city', () => {
    G.State.newGame({ name: 'Juan', nation: 'ES', job: 'merchant', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    G.Game.state.settings.res = 0.35; G.Game.state.player.gold = 20000;
    G.Game.ensureGeo().then(() => G.Game.go('city', { cityId: 7 }));
  }, 5000],
  ['trade_menu', () => { G.Scenes.city.visit('trade'); }, 2500],
  ['trade_buy', () => { G.Scenes.city.B.trade.buy(G.CITY_DATA[7]); }],
  ['trade_sell', () => { G.Game.state.fleet.cargo = { pepper: { q: 20, cost: 50, from: 152, d: 0 }, wine: { q: 30, cost: 20, from: 0, d: 0 } }; G.Scenes.city.B.trade.sell(G.CITY_DATA[7]); }],
  ['trade_quotes', () => { G.Scenes.city.B.trade.quotes(G.CITY_DATA[7]); }],
  ['sea', () => { G.Game.go('sea', { depart: 7 }); }, 6000]
];

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await ctx.addInitScript((l) => { try { localStorage.setItem('pu.lang', l); } catch (e) { /* */ } }, LANG);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(GAME, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !document.querySelector('#boot-loader.on'), null, { timeout: 120000 });
    await page.waitForTimeout(1500);
    const esc = async (n) => { for (let i = 0; i < (n || 6); i++) { if (await page.evaluate(() => G.UI.busy())) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); } } };
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, '00_title.png') }); }
    for (let i = 0; i < SCREENS.length; i++) {
      const [name, fn, wait] = SCREENS[i];
      await page.evaluate('(' + fn.toString() + ')()');
      await page.waitForTimeout(wait || 1200);
      if (name === 'city' || name === 'trade_menu' || name === 'sea') await esc(12);
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, String(i + 1).padStart(2, '0') + '_' + name + '.png') });
      if (!/^(city|trade_menu|sea)$/.test(name)) await esc();
    }
    // 대사·알림·창으로 들어온 통문장(api)을 먼저 — 화면 글자(dom)의 조각은 통문장을 옮기면 대개 사라진다
    const miss = await page.evaluate(() => G.I18N.missingApi().map(t => ({ src: 'api', ko: t, n: G.I18N.missApi[t] })).concat(G.I18N.missing().map(t => ({ src: 'dom', ko: t, n: G.I18N.miss[t] }))));
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(miss, null, 1));
    console.log(LANG + ': 옮기지 못한 글 ' + miss.length + '가지 → ' + OUT);
    if (errors.length) console.log('페이지 오류: ' + errors.slice(0, 5).join(' / '));
  } finally {
    await browser.close();
  }
})();
