/* 조범실 (2026-10-21): 16칸을 3단계 항해사로 채우면 최대 속력 2배 — 방마다 (1+단계)/64, 조범실 상한 caps.rig 64, rigMax +100%
   node tests/rig_speed_smoke.js */
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
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Cabins, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, CB = G.Cabins, R = G.R, t = G.SHIP.hcarrack;
      const sh = s.fleet.ships[0]; sh.type = 'hcarrack'; sh.hp = sh.maxHp = t.hp; sh.crewMax = t.crew[1]; sh.sails = t.sails.slice(); delete sh.cabins;
      s.fleet.ships = [sh]; s.fleet.crew = t.crew[1]; s.fleet.fatigue = 0; s.mates = [];
      const slots = CB.slots(sh), rooms = CB.rooms();
      for (let i = 1; i <= slots; i++) rooms[i] = 'rig';
      const wind = { dir: 0, spd: 1 }, env = null, ang = Math.PI;
      const sp = () => R.fleetSpeed(ang, wind, env);
      // 기준: 조타실에 3단계 항해사 한 명 (함대의 항해술은 이미 3단계) — 조범실이 더하는 속력만 잰다
      const all = G.MATES.filter(m => !m.wd).map(m => m.id);
      s.mates.push({ id: all[16], role: 'nav', loyal: 80, joined: 1, sk: { nav: 3 } });
      const v0 = sp(), out = { slots, steps: [], navSkill: R.skill('nav') };
      const ids = all.slice(0, 16);
      ids.forEach((id, k) => { const m = { id, role: 'none', loyal: 80, joined: 1, sk: { nav: 3 } }; s.mates.push(m); CB.place(m, k + 1); if ([1, 2, 8, 16].indexOf(k + 1) >= 0) out.steps.push([k + 1, +(sp() / v0).toFixed(4), +CB.power('rig').toFixed(2)]); });
      // 충성이 낮으면 줄어든다
      s.mates.forEach(m => { if (m.role !== 'nav') m.loyal = 30; }); out.lowLoyal = +(sp() / v0).toFixed(4);
      // 다른 방의 상한은 그대로 8
      out.otherCap = (G.BALANCE.cabins.caps || {}).galley || G.BALANCE.cabins.cap;
      return out;
    });
    console.log(JSON.stringify(r));
    assert.strictEqual(r.slots, 16, '중카락 선실 16칸');
    assert.strictEqual(r.navSkill, 3, '기준: 조타실 3단계 항해사');
    assert.deepStrictEqual(r.steps, [[1, 1.0625, 4], [2, 1.125, 8], [8, 1.5, 32], [16, 2, 64]], '3단계 항해사 1·2·8·16명: ×1.0625 · ×1.125 · ×1.5 · ×2');
    assert.strictEqual(r.lowLoyal, 1.5625, '충성 40 아래면 단계도 효율도 75% (방마다 (1+2)×0.75) → ×1.5625');
    assert.strictEqual(r.otherCap, 8, '다른 방 상한은 그대로 8');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log('통과');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
