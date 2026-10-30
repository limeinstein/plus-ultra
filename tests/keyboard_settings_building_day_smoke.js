/* 공통 키보드 메뉴·키 변경·건물 입장 하루 경과 — node tests/keyboard_settings_building_day_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = pw;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '키시험', nation: 'PT', job: 'adventurer', age: 22,
        birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      G.Game.state.settings.res = 0.35;
      G.UI.fade = async fn => { await fn(); };
      G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('#ui .cmdmenu'), null, { timeout: 30000 });

    // 거리(마을 풍경)에서는 방향키가 제독 몫 — 오른쪽 메뉴는 움직이지 않는다
    if (await page.evaluate(() => G.Town.active() && !G.Town.hidden())) {
      ok(await page.evaluate(() => !document.querySelector('#ui .cmdmenu .cmd.kbd-focus')), '거리: 오른쪽 메뉴에 키 표시 없음 (마우스로 누른다)');
      const x0 = await page.evaluate(() => G.Town.runtime().hero.x);
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(400); await page.keyboard.up('ArrowRight');
      await page.keyboard.press('ArrowDown');
      ok(await page.evaluate((x0) => G.Town.runtime().hero.x > x0 + 20 && !document.querySelector('#ui .cmdmenu .cmd.kbd-focus'), x0), '거리: → 로 제독만 걷고, ↓ 로 메뉴가 움직이지 않는다');
      await page.evaluate(() => { const st = G.Town.runtime(), it = G.Town.item('trade'); st.hero.x = it.x + it.w / 2; st.hero.to = null; window.__picked = null; st.onPick = (k) => { window.__picked = k; }; });
      await page.waitForTimeout(150);
      await page.keyboard.press('ArrowUp');
      ok(await page.evaluate(() => window.__picked === 'trade'), '거리: 건물 앞에서 ↑ 로 들어간다');
      await page.evaluate(() => { G.Town.walkTo(G.Town.runtime().hero.x + 300); });
      await page.waitForFunction(() => { const h = G.Town.runtime().hero; return h.to == null && !h.walking; }, null, { timeout: 15000 });
      ok(true, '거리: 마우스로 누른 빈 거리까지 걸어가 멈춘다');
      await page.evaluate(() => { G.Scenes.city.main(); });
    }

    await page.evaluate(() => { window.__pick = 'waiting'; G.UI.choose('키보드 선택', [{ label: '첫째', value: 1 }, { label: '둘째', value: 2 }]).then(v => { window.__pick = v; }); });
    await page.waitForSelector('#ui .choices');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__pick !== 'waiting');
    ok(await page.evaluate(() => window.__pick === 2), '선택창에서 방향키와 ENTER로 선택');

    await page.evaluate(() => { window.__spacePick = 'waiting'; G.UI.choose('SPACE 선택', [{ label: '선택', value: 3 }]).then(v => { window.__spacePick = v; }); });
    await page.waitForSelector('#ui .choices');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__spacePick === 3);
    ok(true, 'SPACE로 메뉴 선택');

    const before = await page.evaluate(() => G.Game.state.day);
    await page.evaluate(() => {
      window.__findInside = G.Scenes.city.findInside;
      window.__tradeEnter = G.Scenes.city.B.trade.enter;
      window.__focusOn = G.Town.focusOn;
      window.__imgCount = G.Img.count;
      G.Scenes.city.findInside = async () => {};
      G.Scenes.city.B.trade.enter = async () => true;
      G.Town.focusOn = async () => null;
      G.Img.count = () => 0;
      G.Scenes.city.visit('trade');
    });
    await page.waitForFunction(b => G.Game.state.day === b + 1, before, { timeout: 10000 });
    ok(await page.evaluate(b => G.Game.state.day === b + 1, before), '건물 문을 열 때 게임 날짜가 정확히 1일 경과');
    await page.waitForFunction(() => !G.UI.busy() && G.Scenes.city.current() && document.querySelector('#ui .cmdmenu'), null, { timeout: 15000 });
    {
      const a = await page.evaluate(() => (document.querySelector('#ui .cmdmenu .cmd.kbd-focus') || {}).innerText || '');
      await page.keyboard.press('ArrowDown');
      const b = await page.evaluate(() => (document.querySelector('#ui .cmdmenu .cmd.kbd-focus') || {}).innerText || '');
      ok(a && b && a !== b, '건물 안 메뉴에서는 ↑↓ 포커스 이동');
    }
    await page.evaluate(() => { G.Scenes.city.findInside = window.__findInside; G.Scenes.city.B.trade.enter = window.__tradeEnter; G.Town.focusOn = window.__focusOn; G.Img.count = window.__imgCount; });

    await page.evaluate(() => { G.Info.open('menu'); });
    await page.waitForSelector('[data-keyact="confirm"]');
    ok(await page.locator('[data-keyact]:not([data-keyact="notebook"]):not([data-keyact^="nb_"])').count() === 12, '설정에 방향·확정·취소·해상 배속(×0.5·×1·×2·×4)·마우스 따라가기 키 12개 표시');
    ok(await page.locator('[data-keyact="notebook"]').count() === 1 && await page.locator('[data-keyact^="nb_"]').count() === 13, '수첩 단축키 1개 + 수첩 탭 바로가기 13개 (2026-10-30)');
    await page.locator('[data-keyact="confirm"]').click();
    await page.keyboard.press('k');
    await page.waitForFunction(() => G.Game.state.settings.keys.confirm === 'KeyK');
    ok(await page.evaluate(() => G.Keys.is({ code: 'KeyK', key: 'k' }, 'confirm') && !G.Keys.is({ code: 'Enter', key: 'Enter' }, 'confirm')), '확정 키 변경이 즉시 입력 판정에 반영');
    await page.keyboard.press('Escape');

    await page.evaluate(() => { window.__pick2 = 'waiting'; G.UI.choose('바꾼 키 확인', [{ label: '선택', value: 7 }]).then(v => { window.__pick2 = v; }); });
    await page.waitForSelector('#ui .choices');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    ok(await page.evaluate(() => window.__pick2 === 'waiting'), '바꾸기 전 ENTER는 더 이상 확정으로 작동하지 않음');
    await page.keyboard.press('k');
    await page.waitForFunction(() => window.__pick2 === 7);
    ok(true, '새 확정 키로 메뉴 선택');

    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('\n키보드 설정·메뉴·건물 날짜 점검 통과');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
