/* 보급에서 식량·물을 줄여 교역품 자리를 만들기 (js/city/harbor.js H.supply · js/city/trade.js offerUnload)
   · 항구 「보급」 창에서 지금보다 적게 맞추면 내리고, 이 항구 보급값 × G.BALANCE.supplyRefund 로 되판다 → 남는 짐칸이 는다
   · 교역소에서 짐칸이 꽉 차면 부관이 「식량·물을 줄인다」를 묻고, 보급 창(필요한 칸 안내)을 열어 줄이면 다시 살 수 있다
   · 늘리는 보급(사기)은 예전처럼 · 콘솔 오류 0
   node tests/supply_unload_smoke.js   (스크린샷: OUT 또는 임시 폴더/supply_unload) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'supply_unload');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  const win = () => page.waitForSelector('.win .sup-info', { timeout: 10000 });
  const click = label => page.evaluate(l => { const b = [...document.querySelectorAll('.win .foot .btn, .win button')].find(x => x.textContent.trim() === l); b.click(); }, label);
  const setBoth = d => page.evaluate(d => { const n = document.querySelector('.win .b-num'); n.value = d; n.onchange(); }, d);
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    // 리스본에서 새 게임: 식량·물 60일분, 교역품으로 짐칸을 꽉 채운다
    const st = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'trader', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state, f = s.fleet, R = G.R, use = R.dailyUse(), c = G.CITY_DATA[0];
      s.player.gold = 100000;
      f.food = 60 * use; f.water = 60 * use; f.mat = 10;
      const id = R.cityGoods(c)[0];
      const fill = Math.max(0, Math.floor(R.free()));
      f.cargo[id] = { q: fill, cost: 10 };
      s.loc = { mode: 'city', city: 0, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: 0 });
      return { use, free: R.free(), food: f.food, gold: s.player.gold, good: id };
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 60000 });
    await page.waitForTimeout(500);
    ok(st.free <= 0, '짐칸이 꽉 찼다 (남는 칸 ' + st.free + ', 식량·물 60일분)');

    // ① 항구 「보급」에서 식량·물을 10일분으로 줄인다
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); window.__sup = G.Scenes.city.B.harbor.supply(G.CITY_DATA[0]); });
    await win();
    await setBoth(10);
    const shown = await page.evaluate(() => document.querySelector('.win .sup-info').textContent);
    await page.screenshot({ path: path.join(OUT, 'supply_unload.png') });
    await click('맞춘다');
    const r1 = await page.evaluate(async () => { const res = await window.__sup; const s = G.Game.state, f = s.fleet; return { res, food: f.food, water: f.water, gold: s.player.gold, free: G.R.free(), refund: G.BALANCE.supplyRefund, pF: G.R.supplyCost(G.CITY_DATA[0]), pW: G.R.waterCost(G.CITY_DATA[0]) }; });
    const expGot = Math.floor(50 * st.use * r1.pF * r1.refund) + Math.floor(50 * st.use * r1.pW * r1.refund);
    console.log('  창: ' + shown.replace(/\s+/g, ' ').slice(0, 160));
    ok(Math.abs(r1.food - 10 * st.use) < 1e-6 && Math.abs(r1.water - 10 * st.use) < 1e-6, '식량·물을 60일분 → 10일분으로 내렸다');
    ok(r1.gold - st.gold === expGot && r1.res.got === expGot, '내린 것을 보급값의 ' + Math.round(r1.refund * 100) + '%에 되팔았다 (+' + expGot + '닢)');
    const said = +((/교역품을 ([\d,]+)통 더 실을 수/.exec(shown) || [])[1] || '0').replace(/,/g, '');
    ok(r1.free >= Math.floor(100 * st.use) - 1 && said === r1.free, '그만큼 짐칸이 났다 (남는 칸 ' + r1.free + ') — 창의 「교역품을 ' + said + '통 더 실을 수 있게 됩니다」와 같다');

    // ② 교역소: 다시 꽉 채운 뒤 사려고 하면 부관이 묻고, 보급 창에서 줄이면 자리가 난다
    await page.evaluate(id => { const s = G.Game.state, f = s.fleet; f.food = 40 * G.R.dailyUse(); f.water = 40 * G.R.dailyUse(); f.cargo[id].q += Math.max(0, Math.floor(G.R.free())); }, st.good);
    await page.evaluate(() => {
      window.__asks = []; const C = G.Scenes.city; window.__keepAsk = C.mateAsk;
      C.mateAsk = async (t, opts) => { window.__asks.push(t); return opts[0].value; };
      window.__off = G.Scenes.city.B.trade.offerUnload(G.CITY_DATA[0], 200);
    });
    await win();
    const note = await page.evaluate(() => (document.querySelector('.win .woodnote') || {}).textContent || '');
    await setBoth(5);
    await click('맞춘다');
    const r2 = await page.evaluate(async () => { const v = await window.__off; G.Scenes.city.mateAsk = window.__keepAsk; return { v, asks: window.__asks, free: G.R.free() }; });
    ok(r2.v && r2.free > 0 && /짐칸이 꽉 찼습니다/.test(r2.asks[0] || '') && /200통/.test(note), '교역소에서 짐칸이 꽉 차면 부관이 묻고, 보급 창(「짐칸 200통이 더 있어야」)에서 줄여 자리를 냈다 (남는 칸 ' + r2.free + ')');

    // ③ 늘리는 보급은 예전처럼 산다
    await page.evaluate(id => { const f = G.Game.state.fleet; f.cargo[id].q = 0; delete f.cargo[id]; window.__g0 = G.Game.state.player.gold; window.__sup = G.Scenes.city.B.harbor.supply(G.CITY_DATA[0]); }, st.good);
    await win();
    await setBoth(30);
    await click('맞춘다');
    const r3 = await page.evaluate(async () => { const res = await window.__sup; const f = G.Game.state.fleet, u = G.R.dailyUse(); return { food: f.food / u, water: f.water / u, spent: window.__g0 - G.Game.state.player.gold, res }; });
    ok(Math.round(r3.food) === 30 && Math.round(r3.water) === 30 && r3.spent > 0 && r3.res.buy === r3.spent, '늘리면 예전처럼 산다: 5일 → 30일분 (금화 ' + r3.spent + '닢)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
