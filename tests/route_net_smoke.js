/* 이어진 항로망 (2026-10-23 — 대항해시대 4처럼) — node tests/route_net_smoke.js   (BROWSER_EXE=크롬 경로)
   · 리스본→세빌리아 (리스본–세빌리아) 다음 세빌리아→알제: 세빌리아–알제와 함께 리스본–알제도 자동항해
   · 떨어진 두 항로망이 이어지면 서로 모두 · 이어지지 않은 항구는 아니다 · 출항 목적지 목록 · 저장·불러오기 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Routes && G.Routes.reachable, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const RT = G.Routes, out = {}, LIS = 0, SEV = 7, ALG = 83, GEN = 28, MAR = 21, LON = 38;
      const r1 = RT.record(LIS, SEV, 3);
      out.s1 = { ls: RT.isOpen(LIS, SEV), la: RT.isOpen(LIS, ALG), linked: r1.linked.length };
      const r2 = RT.record(SEV, ALG, 4);
      out.s2 = { sa: RT.isOpen(SEV, ALG), la: RT.isOpen(LIS, ALG), al: RT.isOpen(ALG, LIS), direct: RT.direct(LIS, ALG), linked: RT.linked(LIS, ALG), gained: r2.linked.map(x => G.CITY_DATA[x].name), label: RT.label(LIS, ALG) };
      out.notLon = RT.isOpen(LIS, LON);
      // 떨어진 항로망: 제노바–마르세유
      RT.record(GEN, MAR, 3);
      out.apart = RT.isOpen(LIS, GEN);
      const r3 = RT.record(ALG, MAR, 3);
      out.joined = { lg: RT.isOpen(LIS, GEN), sg: RT.isOpen(SEV, GEN), gained: r3.linked.map(x => G.CITY_DATA[x].name) };
      // 출항할 때 자동항해 목적지
      const H = G.Scenes.city.B.harbor;
      out.dests = H.autoDests(G.CITY_DATA[LIS]).map(x => x.c.name);
      out.days = RT.days(LIS, GEN);
      // 저장·불러오기
      const json = G.State.serialize();
      G.State.newGame({ name: '둘째', nation: 'ES', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      out.fresh = RT.isOpen(LIS, ALG);
      G.Game.state = G.State.deserialize(json);
      out.loaded = RT.isOpen(LIS, ALG) && RT.isOpen(GEN, SEV);
      out.saved = Object.keys(G.Game.state.routes).length;
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.s1.ls && !r.s1.la && r.s1.linked === 0, '리스본→세빌리아: 리스본–세빌리아만');
    ok(r.s2.sa && r.s2.la && r.s2.al && !r.s2.direct && r.s2.linked && r.s2.gained.indexOf('리스본') >= 0, '세빌리아→알제: 세빌리아–알제, 리스본–알제 (오는 길도) — 새로 이어진 곳: ' + r.s2.gained.join(','));
    ok(/세빌리아 거쳐/.test(r.s2.label), '항로 설명: ' + r.s2.label);
    ok(!r.notLon, '곧장 오간 항로로 이어지지 않은 항구(런던)는 아니다');
    ok(r.apart === false && r.joined.lg && r.joined.sg && r.joined.gained.join() === '리스본,세빌리아', '떨어진 두 항로망이 이어지면 서로 모두 (리스본–제노바) — 마르세유에서 새로 이어진 곳: ' + r.joined.gained.join(','));
    ok(['세빌리아', '알제', '마르세유', '제노바'].every(n => r.dests.indexOf(n) >= 0) && r.dests.length === 4 && r.days > 0, '리스본에서 출항할 때 자동항해 목적지 4곳 — ' + r.dests.join(','));
    ok(r.fresh === false && r.loaded && r.saved === 4, '저장에는 곧장 오간 항로 4개만 · 불러오면 항로망 그대로');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
