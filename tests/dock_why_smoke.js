/* 도크에 맡길 수 없을 때 까닭을 보여 준다 (2026-11-10 제보 「모항 도크에 3척밖에 안 들어간다」) — js/city/harbor.js dockIn · js/systems/dock.js
   ① 모항: 짐이 많으면 어느 배를 빼면 몇 통이 넘치는지 · 실은 짐의 내역(교역품·식량·물)
   ② 배 고르기 목록에 배마다 「짐 N통 넘침」 · 도크 창 맨 위 한 줄
   ③ 모항이 아닌 항구: 3척이 차면 「모항이 아닌 항구는 3척 (모항 리스본은 10척)」
   ④ 기함뿐이면 「기함은 맡길 수 없다」
   node tests/dock_why_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { if (!v) fail++; console.log((v ? '  ✓ ' : '  ✗ ') + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load|ERR_|Folk\.town/.test(m.text())) errors.push(m.text()); });
  const winText = () => page.evaluate(() => { const w = [...document.querySelectorAll('.modal-back')].pop(); return w ? w.innerText.replace(/\s+/g, ' ') : ''; });
  const closeWin = () => page.evaluate(() => { const w = [...document.querySelectorAll('.modal-back')].pop(); if (!w) return; const b = [...w.querySelectorAll('button')].pop(); if (b) b.click(); else { const x = w.querySelector('.close, .x'); if (x) x.click(); } });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'trader', age: 24, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state, R = G.R; s.date = { y: 1520, m: 6, d: 1 };
      const ty = s.fleet.ships[0].type;
      while (s.fleet.ships.length < 5) s.fleet.ships.push(R.newShip(ty, '시험' + s.fleet.ships.length));
      // 짐: 남은 배 넷의 짐칸을 거의 채운다 → 한 척 빼면 넘친다
      const cap1 = R.shipCargoCap(s.fleet.ships[1]);
      s.fleet.food = Math.max(0, R.fleetCap() - cap1 + 25 - R.cargoQty() - Math.ceil(s.fleet.water) - Math.ceil(s.fleet.mat || 0));
    });
    // ① 모항 리스본, 짐이 많다 → 어느 배도 뺄 수 없다
    await page.evaluate(() => { window.__d = false; G.Scenes.city.B.harbor.dockIn(G.CITY_DATA[0]).then(r => { window.__r = r; window.__d = true; }); });
    await page.waitForTimeout(500);
    const t1 = await winText();
    console.log('   ' + t1.slice(0, 260));
    ok(/짐이 많아 어느 배도 함대에서 뺄 수 없습니다/.test(t1) && /식량 [\d,]+통/.test(t1) && /25통이 넘칩니다/.test(t1), '모항이라도 짐이 많으면 막는다 — 실은 짐 내역과 「25통이 넘칩니다」');
    await closeWin(); await page.waitForFunction(() => window.__d);
    // ② 짐을 조금 덜면 고르기 목록이 뜨고, 배마다 넘침 여부 · 도크 창 맨 위 한 줄
    const why0 = await page.evaluate(() => { const s = G.Game.state, R = G.R; s.fleet.food -= 25; return G.Scenes.city.B.harbor.dockWhy(G.CITY_DATA[0]); });
    ok(/지금 맡길 수 있는 배 4\/4척 · 빈자리 10척/.test(why0), '도크 창 한 줄: ' + why0);
    await page.evaluate(() => { const s = G.Game.state; s.fleet.ships[1].cap += 400; s.fleet.food += 300; });   // 큰 배 하나 — 그 배만 빼면 넘친다
    const why1 = await page.evaluate(() => G.Scenes.city.B.harbor.dockWhy(G.CITY_DATA[0]));
    ok(/맡길 수 있는 배 3\/4척.*나머지는 빼면 짐이 넘침/.test(why1), '큰 배만 막히면: ' + why1);
    await page.evaluate(() => { window.__d = false; G.Scenes.city.B.harbor.dockIn(G.CITY_DATA[0]).then(r => { window.__r = r; window.__d = true; }); });
    await page.waitForTimeout(500);
    const t2 = await winText();
    ok(/모항 도크에는 10척까지/.test(t2) && /짐 [\d,]+통 넘침/.test(t2) && /실은 짐 [\d,]+\/[\d,]+통 — /.test(t2), '고르기 목록: 모항 10척 안내 · 실은 짐 · 큰 배에 「짐 N통 넘침」');
    // 넘치는 배를 고르면 까닭 창
    await page.evaluate(() => { const w = [...document.querySelectorAll('.modal-back')].pop(); [...w.querySelectorAll('.choice')][0].click(); });
    await page.waitForTimeout(400);
    const t3 = await winText();
    ok(/시험1호를 함대에서 뺄 수 없습니다/.test(t3) && /넘칩니다/.test(t3), '넘치는 배를 고르면: ' + t3.slice(0, 120));
    await closeWin(); await page.waitForFunction(() => window.__d);
    const r3 = await page.evaluate(() => ({ r: window.__r, n: G.Game.state.fleet.ships.length }));
    ok(r3.r === false && r3.n === 5, '그 배는 함대에 그대로');
    // 넘치지 않는 배는 맡겨진다
    await page.evaluate(() => { window.__d = false; G.Scenes.city.B.harbor.dockIn(G.CITY_DATA[0]).then(r => { window.__r = r; window.__d = true; }); });
    await page.waitForTimeout(400);
    await page.evaluate(() => { const w = [...document.querySelectorAll('.modal-back')].pop(); [...w.querySelectorAll('.choice')][1].click(); });
    await page.waitForFunction(() => window.__d);
    const r4 = await page.evaluate(() => ({ r: window.__r, n: G.Game.state.fleet.ships.length, d: G.Dock.list(0).length }));
    ok(r4.r === true && r4.n === 4 && r4.d === 1, '넘치지 않는 배는 맡겨진다 (함대 4척 · 리스본 도크 1척)');
    // ③ 모항이 아닌 항구(세비야): 3척 가득
    await page.evaluate(() => { const s = G.Game.state, R = G.R; s.fleet.food = 0; for (let i = 0; i < 3; i++) G.Dock.put(7, R.newShip(s.fleet.ships[0].type, '맡김' + i)); window.__d = false; G.Scenes.city.B.harbor.dockIn(G.CITY_DATA[7]).then(r => { window.__d = true; }); });
    await page.waitForTimeout(500);
    const t5 = await winText();
    ok(/도크가 가득 찼습니다 — 3\/3척/.test(t5) && /모항이 아닌 항구의 도크에는 3척까지만/.test(t5) && /모항 리스본의 도크는 10척까지/.test(t5), '모항이 아닌 항구: ' + t5.slice(0, 140));
    await closeWin(); await page.waitForFunction(() => window.__d);
    // ④ 기함뿐
    await page.evaluate(() => { const s = G.Game.state; s.fleet.ships = s.fleet.ships.slice(0, 1); window.__d = false; G.Scenes.city.B.harbor.dockIn(G.CITY_DATA[0]).then(() => { window.__d = true; }); });
    await page.waitForTimeout(400);
    const t6 = await winText();
    ok(/기함은 제독이 타는 배라 도크에 맡길 수 없습니다/.test(t6), '기함뿐이면 까닭');
    await closeWin(); await page.waitForFunction(() => window.__d);
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } catch (e) { fail++; console.error('✗', e.message); } finally { await browser.close(); }
  console.log(fail ? '\n실패 ' + fail : '\n통과');
  process.exitCode = fail ? 1 : 0;
})();
