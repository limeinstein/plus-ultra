/* 기함 선실 「창고」 — node tests/cabin_store_smoke.js   (BROWSER_EXE=크롬 경로)
   · 창고 한 칸마다 기함 짐칸 + 배 적재량 × 5%, 4칸까지 (5칸째는 헛방) · 기함에만
   · 무게 한도는 그대로: 가벼운 짐(후추)은 더 싣고, 무거운 짐(광석)은 늘지 않는다
   · 창고에는 사람을 둘 수 없다 · 짐이 넘치면 창고를 다른 방으로 못 고친다 · 기함을 바꾸면 창고 몫은 새 기함 기준
   · 선실 화면: 카드에 「짐칸 +N통」, 함대 능력 판에 「기함 짐칸」 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'cabin_store');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, R = G.R, CB = G.Cabins, CG = G.Cargo, out = {};
      const sh = s.fleet.ships[0]; sh.type = 'hcarrack'; sh.cap = G.SHIP.hcarrack.cap; sh.cabins = null; s.fleet.cabinUid = null;
      s.fleet.cargo = {}; s.fleet.food = 0; s.fleet.water = 0; s.fleet.mat = 0;
      const t = G.SHIP.hcarrack; out.slots = CB.rooms().length - 1; out.tcap = t.cap;
      const cap0 = R.fleetCap(), wt0 = CG.fleetWtCap(), pep0 = CG.room('pepper'), ore0 = CG.room('iron');
      CB.remodel(1, 'store');
      out.one = R.fleetCap() - cap0;
      [2, 3, 4, 5].forEach(i => CB.remodel(i, 'store'));
      out.five = R.fleetCap() - cap0; out.wtSame = CG.fleetWtCap() === wt0;
      out.pep = CG.room('pepper') - pep0; out.ore = CG.room('iron') - ore0;
      // 사람을 둘 수 없다
      s.mates.push({ id: Object.keys(G.MATE)[5], role: 'none', loyal: 80 }); const m = s.mates[s.mates.length - 1];
      CB.place(m, 1); out.placed = m.room;
      // 기함을 바꾸면: 새 기함에 창고가 없으면 몫이 사라진다
      const other = JSON.parse(JSON.stringify(sh)); other.uid = 'z2'; other.cabins = null; s.fleet.ships.push(other);
      out.otherCap = R.shipCargoCap(other) === Math.floor(other.cap - R.gunLoad(other));
      s.fleet.ships.pop();
      // 짐을 가득 싣고 창고를 없애려 하면 화면에서 막는다
      s.fleet.cargo.pepper = { q: R.fleetCap() - 5, cost: 10, from: null, d: s.day };
      G.Game.go('city', { city: 0 });
      return out;
    });
    console.log(r);
    ok(r.one === Math.floor(r.tcap * 0.05), '창고 한 칸 → 짐칸 +' + r.one + '통 (적재량 ' + r.tcap + '의 5%)');
    ok(r.five === Math.floor(r.tcap * 0.05 * 4), '다섯 칸이어도 넷까지만 센다 (+' + r.five + '통 = 20%)');
    ok(r.wtSame, '무게 한도는 그대로');
    ok(r.pep > 0 && r.ore === 0, '가벼운 후추는 ' + r.pep + '통 더, 무거운 철광석은 그대로 (' + r.ore + ')');
    ok(r.placed == null, '창고에는 사람을 둘 수 없다');
    ok(r.otherCap, '기함이 아닌 배는 창고 몫이 없다');
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(600);
    await page.evaluate(() => { window.__noRaf = true; G.CabinView.open({ yard: G.CITY_DATA[0] }); });
    await page.waitForFunction(() => document.querySelector('.cb-card[data-i="1"]'), null, { timeout: 15000 });
    const view = await page.evaluate(() => ({ c1: document.querySelector('.cb-card[data-i="1"]').textContent, c5: document.querySelector('.cb-card[data-i="5"]').textContent, fx: (document.querySelector('.cb-totals') || document.body).textContent }));
    console.log(view.c1, '|', view.c5);
    ok(/짐칸 \+\d+통/.test(view.c1) && /헛방/.test(view.c5), '카드: 「짐칸 +N통」, 다섯째 칸은 「헛방」');
    ok(/기함 짐칸\s*\+[\d,]+통/.test(view.fx), '함대 능력 판에 「기함 짐칸 +N통」');
    await page.screenshot({ path: path.join(OUT, '1_store.png') });
    // 창고(1)를 빈 선실로 고치려 하면: 짐이 넘쳐 막힌다
    const tc = [];
    await page.evaluate(() => { const t0 = G.UI.toast; window.__toasts = []; G.UI.toast = function (m) { window.__toasts.push(m); return t0.apply(this, arguments); }; });
    await page.evaluate(() => G.Cabins.remodel(5, 'hold'));   // 창고 네 칸만 남긴다 (다섯째는 헛방이라 없애도 짐칸이 줄지 않는다)
    await page.click('.cb-card[data-i="1"]');
    await page.waitForFunction(() => document.querySelectorAll('.choices .choice').length, null, { timeout: 10000 });
    const list = await page.evaluate(() => [...document.querySelectorAll('.choices .choice')].map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    ok(list.some(t => /창고.*(짐칸 \+\d+통|더는 늘지 않는다)/.test(t)), '고치기 목록의 창고에 늘어나는 양');
    await page.evaluate(() => [...document.querySelectorAll('.choices .choice')].find(x => /빈 선실/.test(x.textContent)).click());
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({ room: G.Cabins.rooms()[1], t: window.__toasts.join(' / ') }));
    ok(after.room === 'store' && /넘칩니다/.test(after.t), '짐이 넘치면 창고를 못 고친다 (' + after.t + ')');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('통과 — 그림: ' + OUT);
  } catch (e) { console.error('실패:', e.message, errors); await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {}); process.exitCode = 1; } finally { await browser.close(); }
})();
