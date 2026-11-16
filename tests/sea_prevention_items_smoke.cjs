/* 실제 항해 하루 처리: 라임 예방·기간·재배급 및 고양이별 쥐 피해 방지 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Scenes.sea, null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '예방 시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, R = G.R, SEA = G.Scenes.sea, B = G.BALANCE, f = s.fleet;
      s.settings.res = .35; G.State.save = () => true;
      G.UI.say = async () => {}; G.UI.ask = async () => null; G.UI.confirm = async () => false; G.UI.alert = async () => {};
      const notices = []; G.UI.toast = text => notices.push(String(text));
      G.Game.go('sea', { depart: 0 });
      // 무작위 다른 사건은 끄고 쥐 발생 확률만 100%로 만들어 피해를 비교한다.
      G.U.chance = p => p === 1; B.rat = 1;
      G.Game.newDay = () => { s.day++; return []; };
      const reset = () => { f.food = 1000; f.water = 1000; f.crew = 100; f.fatigue = 0; f.discipline = 100; f.scurvy = 0; f.daysOut = 0; delete s.flags.limeActive; s.player.items = []; };
      const cats = [];
      for (const id of B.ratGuards) {
        reset(); s.player.items = [{ id }]; const use = R.dailyUse();
        await SEA.runDay();
        cats.push({ id, exists: !!G.ITEM[id], protected: Math.abs(f.food - (1000 - use)) < 1e-6, kept: R.hasItem(id) });
      }
      reset(); s.player.storage = [{ id: 'cat' }]; const use = R.dailyUse();
      await SEA.runDay(); const unprotected = f.food < 1000 - use;
      B.rat = 0;
      reset(); s.player.items = [{ id: 'lime', qty: 2, n: 1 }]; f.daysOut = SEA.scurvyOnset();
      await SEA.runDay();
      const first = { scurvy: f.scurvy, active: s.flags.limeActive, qty: R.itemCount('lime') };
      for (let i = 1; i < 60; i++) { f.food = f.water = 1000; await SEA.runDay(); }
      const last = { scurvy: f.scurvy, active: s.flags.limeActive, qty: R.itemCount('lime') };
      await SEA.runDay();
      const next = { scurvy: f.scurvy, active: s.flags.limeActive, qty: R.itemCount('lime') };
      s.flags.limeActive = 1; await SEA.runDay(); const exhausted = f.scurvy > 0 && !s.flags.limeActive;
      reset(); f.scurvy = 100; s.player.items = [{ id: 'lime' }];
      G.U.chance = p => p === 1 || p === 0.5;
      await SEA.runDay(); const cured = f.scurvy === 0 && f.crew === 100;
      G.U.chance = p => p === 1;
      reset(); f.scurvy = 100; s.flags.limeActive = 10;
      await SEA.runDay(); const oldSave = f.scurvy === 0 && s.flags.limeActive === 9;
      s.player.items.push({ id: 'cat' });
      G.Info.open('fleet');
      const screen = document.body.textContent;
      const status = screen.includes('라임 예방 9일') && screen.includes('고양이가 쥐 피해 예방');
      return { cats, unprotected, first, last, next, exhausted, cured, oldSave, status, notice: notices.some(t => /쥐를 잡아/.test(t)) };
    });
    assert(result.cats.every(c => c.exists && c.protected && c.kept), JSON.stringify(result.cats));
    assert(result.unprotected && result.notice && result.status);
    assert.deepStrictEqual(result.first, { scurvy: 0, active: 60, qty: 1 });
    assert.deepStrictEqual(result.last, { scurvy: 0, active: 1, qty: 1 });
    assert.deepStrictEqual(result.next, { scurvy: 0, active: 60, qty: 0 });
    assert(result.exhausted && result.cured && result.oldSave, JSON.stringify(result));
    assert.deepStrictEqual(errors, []);
    console.log('PASS: 고양이 7종 쥐 피해 방지·미보유/보관함 제외·라임 발병 전 배급·60일·재배급·소진·기존 환자/저장 호환, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
