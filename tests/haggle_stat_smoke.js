/* 흥정의 지력·매력 (js/city/trade.js T.haggleStat · G.BALANCE.haggleStat — 2026-11-08)
   · 지력·매력이 50 이하이면 예전 값 그대로 — 매력이 낮아도 성공률이 깎이지 않는다 (지금 값이 바닥)
   · 50을 넘는 만큼 교역소 값 깎기·시장 값 깎기·일괄 거래 흥정·시장 결제 협상의 성공률과 깎는 폭이 커지고, 깎는 폭의 상한도 올라간다
   · 경리가 있으면 지력·매력 저마다 제독과 경리 가운데 높은 쪽
   node tests/haggle_stat_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const near = (a, b) => Math.abs(a - b) < 1e-6;
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.player.gold = 200000; s.player.items = []; s.fleet.cargo = {};
      s.mates.forEach(m => { m.role = 'none'; });
      s.loc = { mode: 'city', city: 0, lon: 0, lat: 0 }; G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });

    // ① 수치: 50 이하 = 덤 0, 100/100 = 성공률 +35%p · 깎는 폭 +10%p
    const v = await page.evaluate(() => {
      const s = G.Game.state, c = G.CITY_DATA[0], T = G.Scenes.city.B.trade, out = {};
      const set = (i, ch) => { s.player.st.int = i; s.player.st.cha = ch; };
      [[50, 50], [20, 20], [50, 30], [80, 50], [50, 80], [100, 100], [130, 130]].forEach(([i, ch]) => {
        set(i, ch); const h = T.haggleStat(), o = T.haggleOdds(c);
        out[i + '/' + ch] = { p: h.p, d: h.d, odds: o.p, disc: o.disc, step: T.batchStep(c, 0), cap: T.batchCap(true) };
      });
      set(50, 50); return out;
    });
    console.log('    ' + Object.keys(v).map(k => k + ' 성공률 ' + Math.round(v[k].odds * 100) + '% 깎는 폭 ' + (v[k].disc * 100).toFixed(1) + '% 일괄 ' + (v[k].step * 100).toFixed(2) + '% 상한 ' + (v[k].cap * 100).toFixed(0) + '%').join(' | '));
    ok(v['50/50'].p === 0 && v['50/50'].d === 0, '지력·매력 50: 덤 없음 (예전 값 그대로)');
    ok(near(v['20/20'].odds, v['50/50'].odds) && near(v['50/30'].odds, v['50/50'].odds) && near(v['20/20'].disc, v['50/50'].disc), '지력·매력이 낮아도 성공률·깎는 폭이 깎이지 않는다 — 지금 값이 바닥');
    ok(near(v['80/50'].p, 0.09) && near(v['80/50'].d, 0.036), '지력 80: 성공률 +9%p · 깎는 폭 +3.6%p');
    ok(near(v['50/80'].p, 0.12) && near(v['50/80'].d, 0.024), '매력 80: 성공률 +12%p · 깎는 폭 +2.4%p');
    ok(near(v['100/100'].p, 0.35) && near(v['100/100'].d, 0.10), '지력·매력 100: 성공률 +35%p · 깎는 폭 +10%p');
    ok(near(v['130/130'].p, 0.35), '100을 넘는 몫은 셈하지 않는다');
    ok(v['100/100'].odds > v['50/50'].odds && near(v['100/100'].disc - v['50/50'].disc, 0.10), '교역소 값 깎기 성공률·깎는 폭이 커진다');
    ok(near(v['100/100'].step - v['50/50'].step, 0.05) && near(v['100/100'].cap - v['50/50'].cap, 0.05), '일괄 거래 흥정 한 번에 +5%p, 상한 22% → 27%');

    // ② 경리: 제독과 경리 가운데 높은 쪽
    const pu = await page.evaluate(() => {
      const s = G.Game.state, T = G.Scenes.city.B.trade;
      s.player.st.int = 50; s.player.st.cha = 50;
      const id = Object.keys(G.MATE).find(k => G.MATE[k].st && G.MATE[k].st[1] >= 85 && !G.MATE[k].tale);
      s.mates.push({ id, role: 'purser', loyal: 60, ev: 1, joined: G.U.dateNum(s.date), from: 0 });
      const h = T.haggleStat(), st = G.R.mateStats(s.mates[s.mates.length - 1]).st;
      s.mates.pop();
      return { id, int: h.int, mInt: st[1], p: h.p };
    });
    ok(pu.int === pu.mInt && pu.p > 0, '경리(' + pu.id + ', 지력 ' + pu.mInt + ')가 있으면 경리의 지력으로 셈한다');

    // ③ 교역소: 성공했을 때 깎는 폭이 25%를 넘을 수 있다 (상한 25% + 덤)
    const tr = await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA[0], C = G.Scenes.city, T = C.B.trade, U = G.U;
      s.player.sk.acct = 3; s.player.st.int = 100; s.player.st.cha = 100;
      C.say = async () => {}; C.me = async () => {}; C.mate = async () => {}; G.UI.say = async () => {};
      const toasts = []; const t0 = G.UI.toast; G.UI.toast = (t) => { toasts.push(String(t)); };
      const ch0 = U.chance, rf0 = U.rf; U.chance = () => true; U.rf = (a, b) => b;
      const curObj = {}; const cur0 = C.current; C.current = () => curObj;
      await T.enter(c); await T.haggle(c);
      const h = curObj.haggle;
      // 시장
      const MK = C.B.market; curObj.mk = null; curObj.mkBuyDeals = 0;
      await MK.haggle(c);
      const mk = curObj.mk;
      U.chance = ch0; U.rf = rf0; G.UI.toast = t0; C.current = cur0;
      s.player.st.int = 50; s.player.st.cha = 50; s.player.sk.acct = 0;
      return { buy: h && h.buy, ok: h && h.ok, mk: mk && mk.buy, toast: toasts.filter(t => /깎기 성공|흥정 성공/.test(t)) };
    });
    console.log('    ' + tr.toast.join(' / '));
    ok(tr.ok && tr.buy < 0.75 - 1e-9 && tr.buy >= 0.65 - 1e-9, '교역소: 지력·매력 100이면 25%를 넘겨 깎인다 (사는 값 ×' + tr.buy.toFixed(3) + ')');
    ok(tr.mk && tr.mk < 0.78 - 1e-9 && tr.mk >= 0.68 - 1e-9, '시장: 22%를 넘겨 깎인다 (사는 값 ×' + (tr.mk || 0).toFixed(3) + ')');
    ok(tr.toast.some(t => /지력 100·매력 100/.test(t)), '성공 알림에 지력·매력의 덤이 나온다');

    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('통과');
  } catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }
  await browser.close();
})();
