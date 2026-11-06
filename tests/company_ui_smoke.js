/* 특허 회사 화면 (2026-11-04) — 런던 거리의 회사 본부·거래소, 사원 명부·입회 창, 시세표, 반탐 상관(회사 둘)의 「다른 회사 상관으로」, 단추 8개 이하, 콘솔 오류 0
   node tests/company_ui_smoke.js   (스크린숏: tests/_out/company_*.png) */
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
    async function toCity(id, y) {
      await page.evaluate(async ([id, y]) => {
        await G.Game.ensureGeo();
        if (!G.Game.state || G.Game.state.player.name !== '회사시험') {
          G.Game.state = G.State.newGame({ name: '회사시험', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        }
        const s = G.Game.state; s.date = { y, m: 3, d: 1 }; s.player.gold = 300000; s.player.fame = 3000; s.settings.res = 0.35;
        const c = G.CITY_DATA[id]; s.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat }; s.player.home = 0;
        G.Game.go('city', { cityId: id, load: true });
      }, [id, y]);
      // C.enter()는 거리 배경과 현판을 먼저 그린 뒤 도착 사건을 모두 처리하고
      // 마지막에 C.main()의 거리 명령 메뉴를 연다. 현판만 기다리면 내부 busy 중에
      // visit()을 호출해 아무 일도 일어나지 않을 수 있으므로 실제 조작 가능 상태를 기다린다.
      await page.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.city-banner') && document.querySelector('.cmdmenu .cmd') && !document.querySelector('.bld-notebook'), null, { timeout: 60000 });
      await page.waitForFunction(() => !G.UI.busy() && (!G.Loader || !G.Loader.shown()), null, { timeout: 60000 });
    }
    async function visit(kind, arg) {
      await page.evaluate(([k, a]) => { G.Scenes.city.visit(k, a); }, [kind, arg]);
      // 거리 이동·실내 그림 준비 뒤에 도시 발견물이나 날짜 사건 창이 연달아
      // 나올 수 있다. 짧은 고정 대기 대신 실제 건물 메뉴가 보일 때까지 넘긴다.
      for (let i = 0; i < 180; i++) {
        if (await page.locator('.bld-notebook').count() && await page.locator('.cmdmenu .cmd').count()) break;
        await page.keyboard.press('Enter'); await page.waitForTimeout(250);
      }
      await page.locator('.cmdmenu .cmd').first().waitFor({ timeout: 60000 });
      await page.waitForTimeout(300);
      return page.evaluate(() => [...document.querySelectorAll('.cmdmenu .cmd')].map(d => d.textContent.trim()));
    }
    async function clickCmd(label) { await page.locator('.cmdmenu .cmd', { hasText: label }).first().click(); await page.waitForTimeout(400); }
    async function leave() { await page.locator('.cmdmenu .cmd.exit').click(); await page.waitForTimeout(500); }

    // ── 런던 1650: 머스코비·레반트·동인도 회사 본부 + 왕립 거래소
    await toCity(38, 1650);
    const names = await page.evaluate(() => G.Scenes.city.buildings(G.CITY_DATA[38]).map(b => b.name));
    ok(['머스코비 회사', '레반트 회사', '동인도 회사', '왕립 거래소'].every(n => names.indexOf(n) >= 0), '런던 거리: ' + names.filter(n => /회사|거래소/.test(n)).join('·'));
    await page.screenshot({ path: path.join(OUT, 'company_london_street.png') });
    let cmds = await visit('company', 'eic');
    ok(cmds.length <= 8 && cmds.some(t => /사원 명부/.test(t)) && cmds.some(t => /주식 창구/.test(t)), '동인도 회사 본부 메뉴 ' + cmds.length + '개: ' + cmds.map(t => t.split(/\s/)[0]).join(' / '));
    await page.screenshot({ path: path.join(OUT, 'company_hq_menu.png') });
    await clickCmd('사원 명부');
    await page.locator('.modal-back .win').waitFor({ timeout: 10000 });
    const rosterBtns = await page.locator('.modal-back .win .foot button').count();
    const rosterTxt = await page.locator('.modal-back .win').textContent();
    ok(/입회/.test(rosterTxt) && /이사/.test(rosterTxt) && rosterBtns <= 8, '입회 창 (단추 ' + rosterBtns + '개)');
    await page.screenshot({ path: path.join(OUT, 'company_join.png') });
    await page.locator('.modal-back .win .foot button', { hasText: '입회한다' }).click();
    for (let i = 0; i < 10 && await page.locator('.modal-back').count(); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
    const mem = await page.evaluate(() => ({ m: G.Game.state.company.member, n: G.Game.state.company.shares.eic }));
    ok(mem.m === 'eic' && mem.n > 0, '입회했다 — 주식 ' + mem.n + '주');
    await page.waitForTimeout(400);
    await clickCmd('회사 임무');
    await page.locator('.modal-back').first().waitFor({ timeout: 10000 });
    await page.screenshot({ path: path.join(OUT, 'company_missions.png') });
    for (let i = 0; i < 6 && await page.locator('.modal-back').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
    await leave();
    // 거래소
    cmds = await visit('exchange');
    ok(cmds.length <= 8 && cmds.some(t => /시세표/.test(t)), '왕립 거래소 메뉴 ' + cmds.length + '개');
    await clickCmd('시세표');
    await page.locator('.modal-back .win').waitFor({ timeout: 10000 });
    const rows = await page.locator('.co-quotes tr').count();
    ok(rows >= 7, '시세표 ' + (rows - 1) + '개 회사');
    await page.screenshot({ path: path.join(OUT, 'company_quotes.png') });
    await page.keyboard.press('Enter'); await page.waitForTimeout(300);
    await leave();
    // 수첩 「교역」에 회사 상자
    const box = await page.evaluate(() => { const d = document.createElement('div'); G.Info && (G.Info.PAGES || {}); return G.Company.box(); });
    ok(/동인도 회사/.test(box) && /사원/.test(box), '수첩의 회사 상자');
    // ── 반탐 1650: EIC·VOC 상관이 한 건물
    await toCity(168, 1650);
    const bn = await page.evaluate(() => G.Scenes.city.buildings(G.CITY_DATA[168]).filter(b => b.kind === 'factory').map(b => b.name));
    ok(bn.length === 1 && bn[0] === '회사 상관', '반탐: 회사 상관 한 채');
    cmds = await visit('factory');
    ok(cmds.length <= 8 && cmds.some(t => /회사 창고/.test(t)) && cmds.some(t => /다른 회사 상관으로/.test(t)), 'EIC 상관 메뉴 ' + cmds.length + '개: ' + cmds.map(t => t.split(/\s/)[0]).join(' / '));
    await page.screenshot({ path: path.join(OUT, 'company_factory.png') });
    await clickCmd('중개 주문서');
    await page.locator('.modal-back').first().waitFor({ timeout: 10000 });
    await page.screenshot({ path: path.join(OUT, 'company_chain.png') });
    for (let i = 0; i < 6 && await page.locator('.modal-back').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
    await clickCmd('다른 회사 상관으로');
    for (let i = 0; i < 8 && await page.locator('.modal-back').count(); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
    await page.waitForTimeout(400);
    const title2 = await page.evaluate(() => document.querySelector('.cmdmenu h3') && document.querySelector('.cmdmenu h3').textContent);
    cmds = await page.evaluate(() => [...document.querySelectorAll('.cmdmenu .cmd')].map(d => d.textContent.trim()));
    ok(/네덜란드 동인도|VOC/.test(title2 || '') && !cmds.some(t => /회사 창고/.test(t)), '네덜란드 동인도 상관으로 바꾸면 경쟁사라 창고가 없다: ' + title2);
    await page.screenshot({ path: path.join(OUT, 'company_factory_rival.png') });
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } catch (e) { console.error(e); fail++; }
  finally { await browser.close(); }
  console.log(fail ? '실패 ' + fail : '모두 통과');
  process.exitCode = fail ? 1 : 0;
})();
