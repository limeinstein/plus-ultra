/* 항구 영향도·식민지 후원자 화면 (2026-11-05) — 고아(1650) 거리의 식민지 저택 · 저택 알현 · 교역소 메뉴 글의 영향도 · 수첩 「교역」의 영향도 상자 · 콘솔 오류 0
   node tests/influence_ui_smoke.js   (스크린숏: tests/_out/influence_*.png) */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(__dirname, '_out');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : setTimeout(() => cb(performance.now()), 16); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    // 고아 1650: 인도청 선장 · 교역소 출자 · 회사 일
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '영향시험', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map((_, i) => i === 1 ? 3 : i === 0 ? 2 : 0), diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1650, m: 3, d: 1 }; s.player.gold = 3000000; s.player.fame = 9000; s.settings.res = 0.35;
      G.ColonySp.apply();
      G.Company.join('pt'); s.company.rank = 2; G.Company.buy('pt', 300);
      G.R.invest(150).amt = 400000;
      G.Influence.add(G.CITY_DATA[150], 12, 'pt');
      const c = G.CITY_DATA[150]; s.loc = { mode: 'city', city: 150, lon: c.lon, lat: c.lat };
      G.Game.go('city', { cityId: 150, load: true });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.city-banner'), null, { timeout: 60000 });
    for (let i = 0; i < 60; i++) {   // 도시에 들어설 때의 소식·사건 창은 넘긴다
      if (await page.evaluate(() => !G.Scenes.city.isBusy() && !G.UI.busy() && (!G.Loader || !G.Loader.shown()))) break;
      if (i === 5 && process.env.VERBOSE) console.log('  (창) ' + (await page.evaluate(() => ([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || '')).slice(0, 120));
      if (await page.evaluate(() => G.UI.busy())) await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
    }
    await page.waitForFunction(() => !G.Scenes.city.isBusy() && !G.UI.busy(), null, { timeout: 60000 });
    // 도시 진입이 끝난 직후 업적·명성 알림이 다음 틱에 열릴 수 있다. 열린 창만 닫으며 짧게 안정화한다.
    for (let i = 0; i < 20; i++) {
      if (await page.evaluate(() => G.UI.busy())) await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    await page.waitForFunction(() => !G.Scenes.city.isBusy() && !G.UI.busy(), null, { timeout: 30000 });
    const info = await page.evaluate(() => ({
      lv: G.Influence.level(G.CITY_DATA[150]),
      mansions: G.Scenes.city.buildings(G.CITY_DATA[150]).filter(b => b.kind === 'mansion').map(b => b.name + '|' + b.arg),
      menu: [...document.querySelectorAll('#screen .cmdmenu:not(.talk-hidden) .cmd')].filter(d => d.offsetParent !== null).map(d => d.textContent.trim())
    }));
    ok(info.mansions.filter(x => /\|csp_/.test(x)).length >= 2, '고아 거리의 식민지 저택: ' + info.mansions.map(x => x.split('|')[0]).join('·'));
    ok(info.menu.some(t => info.mansions.some(m => t.indexOf(m.split('|')[0]) >= 0)), '도시 메뉴에 저택이 보인다');
    await page.screenshot({ path: path.join(OUT, 'influence_goa_street.png') });
    // 교역소: 메뉴 글에 영향도
    const tradeStart = await page.evaluate(() => { const before = { busy: G.Scenes.city.isBusy(), ui: G.UI.busy(), cur: G.Scenes.city.current() && G.Scenes.city.current().kind, modal: ([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || '' }; G.Scenes.city.visit('trade'); return { before, after: { busy: G.Scenes.city.isBusy(), ui: G.UI.busy(), cur: G.Scenes.city.current() && G.Scenes.city.current().kind } }; });
    if (process.env.VERBOSE) console.log('  trade start', tradeStart);
    for (let i = 0; i < 120; i++) {
      if (await page.evaluate(() => { const c = G.Scenes.city.current(); return c && c.kind === 'trade' && !G.Scenes.city.isBusy() && !G.UI.busy(); })) break;
      if (await page.evaluate(() => G.UI.busy())) await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    }
    await page.locator('#screen .cmdmenu:not(.talk-hidden) .cmd:visible').first().waitFor({ timeout: 20000 });
    const sub = await page.evaluate(() => (document.querySelector('#screen .cmdmenu h3 small') || {}).textContent || '');
    ok(/포르투갈 영향도 \d+ · (우세|지배|독점)/.test(sub), '교역소 메뉴 글: ' + sub + ' (영향도 ' + info.lv + ')');
    await page.screenshot({ path: path.join(OUT, 'influence_trade.png') });
    // 수첩 「교역」
    await page.evaluate(() => { G.Info.open('trade'); });   // 수첩 창이 닫힐 때 끝나는 약속은 기다리지 않는다
    await page.waitForTimeout(800);
    const box = await page.evaluate(() => { const b = document.querySelector('.inf-box'); return b ? b.textContent : ''; });
    ok(/항구 영향도/.test(box) && /고아/.test(box), '수첩의 영향도 상자');
    const bx = await page.locator('.inf-box').first();
    if (await bx.count()) { await bx.scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(OUT, 'influence_notebook.png') }); }
    for (let i = 0; i < 6 && await page.locator('.modal-back').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
    await page.locator('#screen .cmdmenu:not(.talk-hidden) .cmd.exit:visible').click(); await page.waitForTimeout(500);
    // 식민지 저택 알현
    const arg = info.mansions.find(x => /\|csp_/.test(x)).split('|')[1];
    await page.evaluate(a => { G.Scenes.city.visit('mansion', a); }, arg);
    let shot = false;
    for (let i = 0; i < 120; i++) {
      if (await page.evaluate(() => { const c = G.Scenes.city.current(); return c && c.kind === 'mansion' && !G.Scenes.city.isBusy() && !G.UI.busy(); })) break;
      if (!shot && await page.locator('.modal-back').count()) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, 'influence_mansion_audience.png') }); shot = true; }
      if (await page.evaluate(() => G.UI.busy())) await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
    }
    const inside = await page.evaluate(() => { const m = document.querySelector('#screen .cmdmenu:not(.talk-hidden)'); return { title: ((m && m.querySelector('h3')) || {}).textContent || '', cmds: m ? [...m.querySelectorAll('.cmd')].filter(d => d.offsetParent !== null).map(d => d.textContent.trim()) : [] }; });
    ok(inside.cmds.length >= 2 && !/위병/.test(inside.title), '식민지 저택에 들어가 알현: ' + inside.title.slice(0, 30) + ' — ' + inside.cmds.map(t => t.split(/\s/)[0]).join(' / '));
    await page.screenshot({ path: path.join(OUT, 'influence_mansion_menu.png') });
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } catch (e) { console.error(e); fail++; }
  finally { await browser.close(); }
  console.log(fail ? '실패 ' + fail : '모두 통과');
  process.exitCode = fail ? 1 : 0;
})();
