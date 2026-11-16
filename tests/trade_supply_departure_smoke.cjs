/* 교역 보급 안내와 항구 출항 준비 중 식량·물 보존 회귀 시험 */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.resolve(__dirname, '../index.html')).href));
    await page.waitForFunction(() => window.G && G.Game && G.Scenes.city.B.trade, null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '보급 시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, C = G.Scenes.city, T = C.B.trade, H = C.B.harbor, R = G.R, c = G.CITY_DATA[0];
      s.settings.res = .35; G.State.save = () => true;
      let prompts = [], supplies = 0, accept = true, purser = null;
      C.mateAsk = async (text, choices, role) => { prompts.push({ text, role }); return accept; };
      C.mate = async () => {}; G.UI.say = async () => {}; G.UI.toast = () => {};
      const supply = H.supply, originalPurser = R.purser;
      H.supply = async () => { supplies++; }; R.purser = () => purser;
      const use = R.dailyUse();
      const checks = [];
      for (const [food, water, who, yes] of [[10, 20, null, true], [20, 3, {}, true], [11, 11, null, true], [1, 1, null, false]]) {
        s.fleet.food = use * food; s.fleet.water = use * water; purser = who; accept = yes;
        const before = prompts.length, count = supplies;
        await T.checkSupply(c);
        checks.push({ prompted: prompts.length > before, supplied: supplies > count, role: prompts.length > before ? prompts[prompts.length - 1].role : null });
      }
      H.supply = supply; R.purser = originalPurser;
      // 실제 출항 명령과 날짜 처리를 실행하되, 마지막 바다 화면 전환만 가로챈다.
      G.UI.fade = async fn => fn(); G.Game.go = () => {}; G.Game.refreshHud = () => {};
      if (G.CrewAuto) G.CrewAuto.refresh = () => {};
      R.portDays = () => delay;
      R.skill = () => 1;
      accept = true; let delay = 0; const days = [];
      for (delay of [1, 3, 5, 10]) {
        s.fleet.crew = Math.max(100, R.crewMin());
        s.fleet.food = R.dailyUse() * 40; s.fleet.water = R.dailyUse() * 40;
        const before = { day: s.day, food: s.fleet.food, water: s.fleet.water };
        await H.depart(c);
        days.push({ delay, elapsed: s.day - before.day, food: s.fleet.food === before.food, water: s.fleet.water === before.water });
      }
      return { checks, days };
    });
    assert.deepStrictEqual(result.checks, [
      { prompted: true, supplied: true, role: 'first' },
      { prompted: true, supplied: true, role: 'purser' },
      { prompted: false, supplied: false, role: null },
      { prompted: true, supplied: false, role: 'first' }
    ]);
    for (const d of result.days) assert(d.elapsed === d.delay && d.food && d.water, JSON.stringify(d));
    assert.deepStrictEqual(errors, []);
    console.log('PASS: 보급 10일 경계·경리/부관·보급 선택/취소, 출항 준비 1·3·5·10일 식량·물 보존, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
