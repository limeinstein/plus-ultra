/* 술집 「보너스를 지급한다」 (2026-10-28 사용자 요청) — 소지금 금화 100만 닢부터 · 전원(기본 20만 + 한 사람 5만 · 충성 +30 · 규율 +20) · 한 사람(15만 · 충성 +50) */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOT_DIR || '';

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, p = s.player, T = G.Scenes.city.B.tavern, out = {}; s.settings.sound = 0; s.settings.music = 0;
      const extra = G.MATES.filter(m => m.id !== 'rocco' && !m.eventOnly && !m.tale).slice(0, 3);
      extra.forEach((m, i) => s.mates.push({ id: m.id, role: 'none', loyal: [20, 60, 100][i], joined: 14800101 }));
      s.mates.find(m => m.id === 'rocco').loyal = 70;
      const c = G.CITY_DATA[p.home];
      const said = []; G.UI.say = async (t, sp) => { said.push(((sp && sp.name) || '') + '|' + String(t).slice(0, 50)); };
      G.Scenes.city.mate = async (t) => { said.push('MATE|' + String(t).slice(0, 60)); };
      G.UI.confirm = async () => true;
      // 100만 닢이 안 되면
      p.gold = 999999;
      out.menuLow = T.menu(c).filter(Boolean).find(m => /보너스/.test(m.label));
      out.menuLow = { dim: out.menuLow.dim, sub: out.menuLow.sub };
      await T.bonus(c);
      out.low = { gold: p.gold, said: said.slice() };
      // 전원 보너스: 충성 100이 아닌 3명 (로코 70 · 20 · 60) → 20만 + 15만
      p.gold = 1200000; said.length = 0; s.fleet.discipline = 50;
      out.cost = T.bonusAllCost();
      let n = 0; G.UI.choose = async (t, o) => (n++ === 0 ? 'all' : null);
      await T.bonus(c);
      out.all = { gold: p.gold, loyal: s.mates.map(m => m.loyal), disc: s.fleet.discipline, said: said.slice(), log: s.log.slice(-1)[0].t };
      // 한 사람: 가장 낮은 사람(50)에게 +50
      p.gold = 1000000; said.length = 0; n = 0;
      G.UI.choose = async (t, o) => (n++ === 0 ? 'one' : n === 2 ? 0 : null);
      await T.bonus(c);
      out.one = { gold: p.gold, loyal: s.mates.map(m => m.loyal), said: said.slice() };
      return out;
    });
    console.log(JSON.stringify(r, null, 2));
    assert.strictEqual(r.menuLow.dim, true); assert(/100만|1,000,000/.test(r.menuLow.sub), r.menuLow.sub);
    assert.strictEqual(r.low.gold, 999999, '100만 닢이 안 되면 줄 수 없다'); assert(r.low.said.some(x => /1,000,000/.test(x)));
    assert.strictEqual(r.cost, 350000, '기본 20만 + 충성 100이 아닌 3명 × 5만');
    assert.strictEqual(r.all.gold, 1200000 - 350000);
    assert.deepStrictEqual(r.all.loyal, [100, 50, 90, 100], '충성 +30 (100까지)');
    assert.strictEqual(r.all.disc, 70, '규율 +20');
    assert(r.all.said.some(x => /다음 항구에서 내릴|곁을 지키겠습니다/.test(x)), '충성이 낮던 부하가 반응');
    assert(/보너스/.test(r.all.log));
    assert.strictEqual(r.one.gold, 1000000 - 150000);
    assert.deepStrictEqual(r.one.loyal, [100, 100, 90, 100], '가장 낮은 부하 +50');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
