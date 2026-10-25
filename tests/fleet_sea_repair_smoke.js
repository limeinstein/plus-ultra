/* 항해 중 함대 공동 수리 (2026-10-25)
   node tests/fleet_sea_repair_smoke.js */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea, null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, f = s.fleet;
      s.settings.res = 0.3; s.mates = []; s.player.sk.ship = 3;
      f.ships = [G.R.newShip('caravel', '기함'), G.R.newShip('caravel', '호위선')];
      f.crew = 40; f.food = 100; f.water = 100; f.mat = 20; f.fatigue = 0;
      f.ships.forEach(sh => { sh.hp = sh.maxHp - 10; });
      G.State.save = () => true; G.U.chance = () => false;
      G.UI.say = async () => {}; G.UI.alert = async () => {}; G.UI.confirm = async () => false;
      G.UI.ask = async (text, choices) => choices && choices.length ? (choices[choices.length - 1].value || choices[choices.length - 1]) : null;
      G.UI.toast = () => {};
      G.Game.go('sea', { depart: 0 });
      await new Promise(resolve => setTimeout(resolve, 800));
      const SEA = G.Scenes.sea;
      const before = f.ships.map(sh => sh.hp), mat0 = f.mat;
      const captainless = G.R.shipSkill(f.ships[1], 'ship');
      await SEA.runDay();
      const withFleet = { before, after: f.ships.map(sh => sh.hp), mat0, mat1: f.mat, captainless, fleetSkill: G.R.skill('ship') };

      s.player.sk.ship = 0; f.mat = 20;
      f.ships.forEach(sh => { sh.hp = sh.maxHp - 10; });
      const noSkillBefore = f.ships.map(sh => sh.hp);
      await SEA.runDay();
      const withoutFleet = { before: noSkillBefore, after: f.ships.map(sh => sh.hp), mat: f.mat, fleetSkill: G.R.skill('ship') };
      return { withFleet, withoutFleet };
    });
    console.log(JSON.stringify(result));
    assert.strictEqual(result.withFleet.captainless, 0, '호위선에는 선장이 없어야 한다');
    assert.strictEqual(result.withFleet.fleetSkill, 3, '함대 최고 조선술은 3단계');
    assert.ok(result.withFleet.after.every((hp, i) => hp > result.withFleet.before[i]), '기함과 선장 없는 호위선이 모두 수리된다');
    assert.ok(result.withFleet.mat1 < result.withFleet.mat0, '공동 수리에 자재를 쓴다');
    assert.strictEqual(result.withoutFleet.fleetSkill, 0, '두 번째 날 함대 조선술은 0단계');
    assert.deepStrictEqual(result.withoutFleet.after, result.withoutFleet.before, '조선술이 없으면 자동 수리하지 않는다');
    assert.strictEqual(result.withoutFleet.mat, 20, '수리하지 않으면 자재를 쓰지 않는다');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log('통과: 선장 없는 호위선도 함대 최고 조선술로 항해 중 수리');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
