/* 베타 피드백 #87 (2026-10-28) 「이유 모를 선원들 충성심 하락과 닢 증발」
   · 바다에서 멈춘 채 자리를 비우면 시간이 계속 흘러 몇 달 치 급료·식량·충성이 빠지던 것 → 입력 없이 G.FX.afkSec초면 멈춘 바다의 시간도 멈춘다 (qa_fixes_smoke에도 있음)
   · 술집에서 술을 거듭 마시다 쓰러지면 지닌 돈의 10~30%를 털렸다 — 큰 재산이면 한 번에 수십만 닢 → 주머니만큼(500 + 도시 크기×250)까지만
   node tests/feedback87_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 1, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [0, 1, 2, 3], diff: 'normal' });
      const s = G.Game.state, U = G.U, UI = G.UI, T = G.Tavern || (G.Scenes.city.B && G.Scenes.city.B.tavern), C = G.Scenes.city;
      UI.say = async () => {}; UI.fade = async fn => fn(); C.say = async () => {}; C.mate = async () => {}; C.leave = () => {};
      const c = G.CITY_DATA[0], out = {};
      C.current = () => ({ kind: 'tavern', drinks: 9, asked: 0 });
      const chance = U.chance, rf = U.rf; U.chance = () => true; U.rf = (a, b) => b;
      for (const gold of [1000000, 2000]) {
        s.player.gold = gold; await T.drink(c);
        out[gold] = gold - s.player.gold;
      }
      U.chance = chance; U.rf = rf;
      out.cap = 500 + c.size * 250; out.afkSec = G.FX.afkSec;
      return out;
    });
    ok(r[1000000] <= r.cap + 20 && r[1000000] > 100, '금화 100만 닢을 지닌 제독이 취해 쓰러져도 털리는 돈은 주머니만큼 (' + r[1000000] + '닢 = 술값 + 상한 ' + r.cap + ')');
    ok(r[2000] < 700, '가진 돈이 적으면 예전처럼 10~30% (' + r[2000] + '닢)');
    ok(r.afkSec === 90, '자리를 비운 것으로 보는 시간 G.FX.afkSec = 90초');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 2).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
