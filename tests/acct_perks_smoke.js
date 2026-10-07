/* 회계 단계의 혜택 점검: 흥정 성공률·흥정 횟수·배가 버티는 무게·비밀 암시장 (js/systems/blackmarket.js · js/city/trade.js)
   node tests/acct_perks_smoke.js   (스크린샷: OUT 또는 임시 폴더/acct_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'acct_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.player.gold = 200000; s.fleet.ships = [G.R.newShip('caravel'), G.R.newShip('caravel')]; s.fleet.cargo = {};
      s.loc = { mode: 'city', city: 0, lon: 0, lat: 0 }; G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });

    // ① 단계별 수치
    const lv = await page.evaluate(() => {
      const s = G.Game.state, c = G.CITY_DATA[0], T = G.Scenes.city.B.trade;
      s.mates.forEach(m => { m.role = 'none'; });   // 부하의 회계는 빼고 제독의 회계만
      const base = G.U.sum(s.fleet.ships, G.Cargo.shipWtCap);
      return [0, 1, 2, 3].map(l => { s.player.sk.acct = l; return { l, lvl: G.Acct.lv(), tries: T.hagMax(), wt: G.Cargo.fleetWtCap(), base, p: Math.round(T.haggleOdds(c).p * 100), bm: G.BlackMarket.open(c), perks: G.Acct.perks() }; });
    });
    console.log(JSON.stringify(lv));
    ok(lv.map(x => x.tries).join() === '1,2,2,3', '흥정 횟수 회계 0~3: ' + lv.map(x => x.tries).join('·') + '번');
    ok(lv[0].p < lv[1].p && lv[1].p < lv[2].p && lv[2].p < lv[3].p, '흥정 성공률 ' + lv.map(x => x.p + '%').join(' → '));
    ok(lv[0].wt === lv[0].base && lv[3].wt === Math.floor(lv[0].base * 1.12) && lv[1].wt > lv[0].wt && lv[2].wt > lv[1].wt, '배가 버티는 무게 ' + lv.map(x => x.wt).join(' → '));
    ok(!lv[2].bm && lv[3].bm, '비밀 암시장: 회계 3에서 열림 (' + lv[3].perks + ')');

    // ② 흥정 횟수: 회계 3 — 모두 거절당하면 3번, 같은 날 다시 들어와도 그대로, 다음 날 새로
    const hg = await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA[0], C = G.Scenes.city, T = C.B.trade;
      s.player.sk.acct = 3;
      C.say = async () => {}; C.me = async () => {}; C.mate = async () => {}; G.UI.say = async () => {};
      const curObj = {}; window.__cur0 = C.current; C.current = () => curObj;   // 교역소 안에 있는 것으로
      const toasts = []; const t0 = G.UI.toast; G.UI.toast = (t) => { toasts.push(String(t)); };
      const ch0 = G.U.chance; G.U.chance = () => false;
      const cur = C.current();
      await T.enter(c);
      const subs = [];
      for (let i = 0; i < 4; i++) { await T.haggle(c); subs.push((T.menu(c).find(m => m && /값 깎기|후려치기/.test(m.label)) || {}).sub); }
      const after = { n: cur.hagN, h: cur.haggle };
      await T.enter(c);   // 같은 날 다시 들어온다
      const re = { n: cur.hagN, left: T.hagLeft(c), h: !!cur.haggle };
      G.Game.passDays(1); await T.enter(c);
      const next = { n: cur.hagN, left: T.hagLeft(c), h: !!cur.haggle };
      // 다음 날: 두 번째에 성공
      let k = 0; G.U.chance = () => (k++ === 1);
      await T.haggle(c); await T.haggle(c);
      const win = { ok: cur.haggle && cur.haggle.ok, buy: cur.haggle && cur.haggle.buy, n: cur.hagN };
      G.U.chance = ch0; G.UI.toast = t0;
      return { subs, after, re, next, win, toasts: toasts.filter(t => /흥정/.test(t)) };
    });
    console.log(JSON.stringify(hg));
    ok(hg.after.n === 3 && hg.after.h && hg.after.h.ok === false && /남은 흥정 2번/.test(hg.subs[0]) && /남은 흥정 1번/.test(hg.subs[1]) && hg.subs[2] === '실패', '회계 3: 거절 → 「남은 흥정 2번」 → 「1번」 → 세 번째에 끝 (' + hg.subs.join(' / ') + ')');
    ok(hg.re.n === 3 && hg.re.h, '같은 날 다시 들어와도 흥정 횟수는 그대로');
    ok(hg.next.n === 0 && hg.next.left === 3 && !hg.next.h, '다음 날에는 다시 3번');
    ok(hg.win.ok && hg.win.buy < 1 && hg.win.n === 2, '두 번째 흥정에 성공 (사는 값 ×' + hg.win.buy.toFixed(2) + ')');

    // ③ 비밀 암시장
    const bm = await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA[0], C = G.Scenes.city, T = C.B.trade, BM = G.BlackMarket;
      s.player.sk.acct = 2; const m2 = T.menu(c).filter(Boolean).map(m => m.label);
      s.player.sk.acct = 3; const m3 = T.menu(c).filter(Boolean).map(m => m.label);
      const small = G.CITY_DATA.find(x => x.port && x.size === 1), inland = G.CITY_DATA.find(x => !x.port && x.size >= 2);
      const st = BM.stock(c);
      const gold0 = s.player.gold, noto0 = s.player.notoriety || 0, items0 = s.player.items.length;
      const it = st.items[0], g = st.goods[0];
      const answers = ['i:' + it.id, g ? 'g:' + g.id : null, null];
      const ch0 = G.UI.choose, cf0 = G.UI.confirm, nm0 = G.UI.number;
      G.UI.choose = async () => answers.shift(); G.UI.confirm = async () => true; G.UI.number = async (o) => Math.min(3, o.max);
      await BM.visit(c);
      G.UI.choose = ch0; G.UI.confirm = cf0; G.UI.number = nm0;
      const st2 = BM.stock(c);
      return { m2, m3, small: BM.here(small), inland: BM.here(inland), items: st.items.map(x => x.name + ':' + x.price + (x.early ? '(이른)' : '')), goods: st.goods.map(x => x.name + ':' + x.q + '@' + x.price + '←' + G.CITY_DATA[x.from].name), sellsHere: st.goods.some(x => G.R.sells(c, x.id)),
        bought: s.player.items.length - items0, has: G.R.hasItem(it.id), gold: gold0 - s.player.gold, noto: (s.player.notoriety || 0) - noto0, cargo: g ? (s.fleet.cargo[g.id] || {}).q : null, sold: st2.items[0].sold, gq: g ? [g.q, st2.goods[0].q] : null };
    });
    console.log(JSON.stringify(bm));
    ok(bm.m2.indexOf('뒷골목 암시장') < 0 && bm.m3.indexOf('뒷골목 암시장') >= 0, '교역소 메뉴: 회계 2에는 없고 회계 3에 「뒷골목 암시장」');
    ok(!bm.small && !bm.inland, '작은 항구·내륙 도시에는 암시장이 없다');
    ok(bm.items.length === 3 && bm.goods.length >= 1 && !bm.sellsHere, '물건 ' + bm.items.join(', ') + ' · 밀수품 ' + bm.goods.join(', '));
    ok(bm.bought === 1 && bm.has && bm.sold && bm.cargo === 3 && bm.gq[1] === bm.gq[0] - 3, '물건 1개·밀수품 3통을 샀다 (팔린 물건은 「팔렸다」, 밀수품 ' + bm.gq.join('→') + '통)');
    ok(bm.gold > 0 && bm.noto === 2, '금화 ' + bm.gold + '닢 · 거래마다 악명 +1 (+' + bm.noto + ')');

    // 화면: 교역소 메뉴와 암시장 창
    await page.evaluate(() => { G.Scenes.city.B.trade.enter = G.Scenes.city.B.trade.enter; G.BlackMarket.visit(G.CITY_DATA[0]); });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'black_market.png') });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
