/* 짐칸이 넘칠 때 내리는 짐 (js/city/harbor.js dumpCargo) — node tests/dump_supply_smoke.js
   2026-10-31 QA: 1700년 장기 자동 플레이에서 사냥·원주민 선물로 짐칸이 넘친 채 폭풍을 만나면(폭풍 → trimCrew)
   물을 먼저 모두 버려 물이 0이 되고 선원이 목말라 모두 쓰러지는 일이 있었다.
   · 교역품 → 자재 → 식량·물 차례로 내린다 · 식량과 물은 많은 쪽부터 줄여 맞춘 뒤 함께 줄인다 (한쪽만 바닥나지 않게)
   · 넘친 만큼만 내린다 · 알림·일지에 무엇을 얼마나 내렸는지 · 넘치지 않으면 아무것도 내리지 않는다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, f = s.fleet, R = G.R, H = G.Scenes.city.B.harbor, out = {};
      const toasts = []; const t0 = G.UI.toast; G.UI.toast = function (m) { toasts.push(String(m)); };
      const cap = R.fleetCap();
      // ① 짐칸에 맞게 실었을 때는 아무것도 내리지 않는다
      f.cargo = {}; f.mat = 0; f.food = Math.floor(cap / 2) - 1; f.water = Math.floor(cap / 2) - 1;
      const a0 = [f.food, f.water]; H.trimCrew(); out.fit = f.food === a0[0] && f.water === a0[1] && !toasts.length;
      // ② 사냥·선물로 식량이 크게 넘쳤다 (예전: 물을 모두 버렸다)
      f.food = cap * 3; f.water = Math.floor(cap / 2); f.mat = 5;
      const over = R.used() - cap; H.trimCrew();
      out.over = over; out.after = [Math.round(f.food), Math.round(f.water), f.mat]; out.used = R.used(); out.cap = cap;
      out.toast = toasts.slice(-1)[0] || ''; out.log = (s.log.slice(-1)[0] || {}).t || '';
      // ③ 교역품이 있으면 교역품부터
      f.food = Math.floor(cap / 2); f.water = Math.floor(cap / 2); f.mat = 0; f.cargo = { wheat: { q: 30, cost: 8, d: s.day } };
      H.trimCrew(); out.goodsFirst = (f.cargo.wheat ? f.cargo.wheat.q : 0) + ':' + Math.round(f.food) + ':' + Math.round(f.water);
      // ④ 물이 많고 식량이 적으면 물 쪽을 먼저 줄여 맞춘다
      f.cargo = {}; f.food = 10; f.water = cap + 40; f.mat = 0;
      H.trimCrew(); out.waterHeavy = [Math.round(f.food), Math.round(f.water)];
      G.UI.toast = t0;
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.fit, '짐칸에 맞으면 아무것도 내리지 않는다');
    ok(r.after[1] > 0 && r.used <= r.cap && r.after[2] === 0 && Math.abs(r.after[0] - r.after[1]) <= 1, '식량이 크게 넘쳐도 물은 남는다 — 자재 먼저, 그다음 식량·물을 맞춰 줄임 (식량 ' + r.after[0] + ' · 물 ' + r.after[1] + ' / 짐칸 ' + r.cap + ')');
    ok(/식량 \d+통/.test(r.toast) && !/물 \d+통/.test(r.toast) && /자재 5통/.test(r.toast) && /바다에 내렸다/.test(r.log), '알림·일지에 내린 양 (식량만 넘쳤으니 물은 그대로): 「' + r.toast + '」');
    const g = r.goodsFirst.split(':').map(Number);
    ok(g[1] + g[2] >= 2 * Math.floor(r.cap / 2) - 1, '교역품이 있으면 교역품부터 내린다 (밀 ' + g[0] + '통 남음, 식량·물 그대로)');
    ok(r.waterHeavy[0] === 10 && r.waterHeavy[1] >= 10, '물이 넘치고 식량이 적으면 물만 줄인다 (식량 ' + r.waterHeavy[0] + ' · 물 ' + r.waterHeavy[1] + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
