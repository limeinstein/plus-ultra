/* 16세기 동남아시아와 태평양 — 바인나웅 · 란쌍 · 세부 · 우르다네타 · 아유타야 · 마닐라 (2026-11-07)
   node tests/seasia16_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const SA = G.SEAsia, K = G.BALANCE.seasia16, out = {}, said = [], asks = [], lands = [];
      let picks = [], landRes = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value == want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      G.Scenes.land.landBattle = async (name, n) => { lands.push(name + ':' + n); return landRes; };
      const lot = q => ({ q, cost: 10, from: 0, d: 0, lots: { 0: { q, cost: 10 } } });
      function fresh(y, m, d, at, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; });
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y, m, d }; s.player.gold = (o && o.gold != null) ? o.gold : 10000; s.fleet.cargo = (o && o.cargo) || {}; s.player.items = []; s.fleet.food = 5000;
        if (typeof at === 'number') { const c = G.CITY_DATA[at]; s.loc = { mode: 'city', city: at, lon: c.lon, lat: c.lat }; } else s.loc = { mode: 'sea', lon: at[0], lat: at[1] };
        said.length = 0; asks.length = 0; lands.length = 0; return s;
      }
      const hasItem = id => G.Game.state.player.items.some(x => x.id === id);
      const cebuAt = [123.9, 10.3], manilaAt = [120.8, 14.55];
      out.data = { figs: G.SEASIA16_FIGS.every(id => G.HIST_FIG[id] && G.HIST_FIG[id].look), items: ['white_elephant_seal', 'thatluang_leaf', 'santo_nino_copy', 'tornaviaje_chart', 'ayutthaya_craft', 'sulayman_kris'].every(id => G.ITEM[id]) };
      // ① 페구 — 총을 판다 (12정 × 85 × 2.2)
      let s = fresh(1556, 3, 1, 159, { cargo: { guns: lot(12) } }); const g0 = s.player.gold;
      out.pegu = { pend: SA.pending() }; picks = ['arms']; await SA.check();
      Object.assign(out.pegu, { gold: s.player.gold - g0, guns: !s.fleet.cargo.guns, seal: hasItem('white_elephant_seal'), b: s.seasia16.toungoo, again: SA.pending(), bay: said.some(t => t.startsWith('바인나웅|')) });
      // ① 총이 없으면 「판다」는 막히고, 원정에 함께 — 이기면 금화 6,000 · 인장
      s = fresh(1555, 1, 1, 159); const g1 = s.player.gold; picks = ['march']; await SA.check();
      out.march = { dis: asks[0].o[0], land: lands.join(), gold: s.player.gold - g1, b: s.seasia16.toungoo, seal: hasItem('white_elephant_seal') };
      // ① 사양하면 180일 뒤 다시 · 기한 밖이면 없다
      s = fresh(1556, 1, 1, 159); picks = ['no']; await SA.check(); out.cool = SA.pending(); s.day += 181; out.coolBack = SA.pending();
      s = fresh(1560, 1, 1, 159); out.late = SA.pending();
      // ② 란쌍 — 금 10통 판매 · 공덕
      s = fresh(1563, 6, 1, 162, { cargo: { gold: lot(12) } }); const g2 = s.player.gold; picks = ['sell']; await SA.check();
      out.lanSell = { gold: s.player.gold - g2, left: s.fleet.cargo.gold && s.fleet.cargo.gold.q, leaf: hasItem('thatluang_leaf'), b: s.seasia16.lanxang };
      s = fresh(1563, 6, 1, 162); picks = ['donate']; await SA.check();
      out.lanGive = { gold: s.player.gold, leaf: hasItem('thatluang_leaf'), b: s.seasia16.lanxang, monk: said.some(t => t.startsWith('라오의 큰스님|')) };
      // ③ 세부 — 바다에서 · 식량을 판다 / 1568.9 뒤엔 포르투갈 함대에 알릴 수 있다
      s = fresh(1566, 3, 1, cebuAt); const f0 = s.fleet.food, g3 = s.player.gold, need = Math.ceil(G.R.dailyUse() * K.cebu.food);
      out.cebu = { pend: SA.seaPending(), city: SA.pending() }; picks = ['sell']; await SA.atSea();
      Object.assign(out.cebu, { food: f0 - s.fleet.food, need, gold: s.player.gold - g3, nino: hasItem('santo_nino_copy'), b: s.seasia16.cebu, opts: asks[0].o.join(), blockade: said.some(t => /봉쇄/.test(t)) });
      s = fresh(1569, 2, 1, cebuAt); picks = ['pt']; await SA.atSea();
      out.cebuPt = { opts: asks[0].o.join(), b: s.seasia16.cebu, blockade: said.some(t => /포르투갈 깃발/.test(t)) };
      s = fresh(1566, 3, 1, [123.9, 12.5]); out.cebuOff = SA.seaPending();
      // ④ 아카풀코 — 약재 6통 → 해도
      s = fresh(1565, 11, 1, 205, { cargo: { herbs: lot(6) } }); picks = ['herbs']; await SA.check();
      out.urd = { herbs: !s.fleet.cargo.herbs, chart: hasItem('tornaviaje_chart'), b: s.seasia16.urdaneta, u: said.some(t => /북위 서른여덟/.test(t)) };
      s = fresh(1565, 9, 1, 205); out.urdEarly = SA.pending();
      // ⑤ 아유타야 포위 — 같은 도시의 란쌍보다 먼저 · 사람들을 빼낸다
      s = fresh(1569, 3, 1, 162); picks = ['rescue']; await SA.check();
      out.ayu = { first: said.some(t => /세 강이 감싸/.test(t)), land: lands.join(), craft: hasItem('ayutthaya_craft'), b: s.seasia16.ayutthaya };
      landRes = 'lose'; s = fresh(1569, 3, 1, 162); picks = ['rescue']; await SA.check(); out.ayuLost = { b: s.seasia16.ayutthaya, craft: hasItem('ayutthaya_craft') }; landRes = 'win';
      s = fresh(1569, 9, 1, 162); out.ayuAfter = SA.pending();
      // ⑥ 마닐라 만 — 술라이만 편 / 중국 상인 비단
      s = fresh(1571, 5, 20, manilaAt); out.mPend = SA.seaPending(); picks = ['sulayman']; await SA.atSea();
      out.man = { land: lands.join(), kris: hasItem('sulayman_kris'), b: s.seasia16.manila };
      s = fresh(1571, 8, 1, manilaAt); s.fleet.food = 50; s.fleet.water = 50; const g6 = s.player.gold; out.room = G.Cargo.room('silk'); picks = ['trade']; await SA.atSea();
      out.manTrade = { silk: s.fleet.cargo.silk && s.fleet.cargo.silk.q, paid: g6 - s.player.gold, b: s.seasia16.manila, city: said.some(t => /도시를 세운다/.test(t)) };
      s = fresh(1571, 8, 1, manilaAt); picks = ['leave']; await SA.atSea(); out.manCool = SA.seaPending();
      // 소식 — 1554 ~ 1590 · 월항 사건에서 마닐라를 들었으면 빼고
      s = fresh(1554, 1, 1, 159); SA.daily(); const news = [];
      for (let i = 0; i < 20000 && G.U.dateNum(s.date) < 15900101; i++) { s.date = G.U.addDays(s.date, 1); SA.daily().forEach(x => news.push(x.text.slice(0, 12))); }
      out.news = news;
      s = fresh(1554, 1, 1, 159); s.yuegang = { told: { manilaNews: 1 } }; SA.daily(); const news2 = [];
      for (let i = 0; i < 20000 && G.U.dateNum(s.date) < 15900101; i++) { s.date = G.U.addDays(s.date, 1); SA.daily().forEach(x => news2.push(x.text)); }
      out.noManila = !news2.some(t => /【마닐라】/.test(t)) && news2.length === news.length - 1;
      s = fresh(1600, 1, 1, 159); out.old = SA.daily().length;
      // World.daily 에 소식이 실린다
      s = fresh(1555, 1, 21, 159); SA.daily(); s.date = { y: 1555, m: 1, d: 22 }; out.world = (G.World.daily() || []).some(x => /아바 함락/.test(x.text || ''));
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.data.figs && r.data.items, '인물 7 · 기념품 6');
    ok(r.pegu.pend && r.pegu.gold === Math.round(12 * 85 * 2.2) && r.pegu.guns && r.pegu.seal && r.pegu.b === 'arms' && !r.pegu.again && r.pegu.bay, '① 페구 — 바인나웅에게 총 12정을 2.2배에 팔고 흰 코끼리 인장');
    ok(r.march.dis === 'arms!' && r.march.land.startsWith('아바 성의 샨 군사들:90') && r.march.gold === 6000 && r.march.b === 'won' && r.march.seal, '① 총이 없으면 판매는 막힘 · 아바 원정(육상전 90) 승리 — 금화 6,000');
    ok(r.cool === false && r.coolBack === true && r.late === false, '① 사양하면 180일 뒤 다시 · 1558년이 지나면 없다');
    ok(r.lanSell.gold === Math.round(10 * 175 * 1.8) && r.lanSell.left === 2 && r.lanSell.leaf && r.lanSell.b === 'sell', '② 란쌍의 사절 — 금 10통을 1.8배에 · 탓루앙의 금박');
    ok(r.lanGive.gold === 8000 && r.lanGive.leaf && r.lanGive.b === 'donate' && r.lanGive.monk, '② 금화 2,000 공덕');
    ok(r.cebu.pend && !r.cebu.city && r.cebu.food === r.cebu.need && r.cebu.gold === Math.max(1500, r.cebu.need * 30) && r.cebu.nino && r.cebu.b === 'sell' && !/pt/.test(r.cebu.opts) && !r.cebu.blockade, '③ 세부 앞바다 — 레가스피의 요새에 식량 30일분 · 산토 니뇨 모상');
    ok(/pt/.test(r.cebuPt.opts) && r.cebuPt.b === 'pt' && r.cebuPt.blockade && r.cebuOff === false, '③ 1568.9 뒤엔 포르투갈 봉쇄 — 함대에 알리기 · 앞바다 밖에서는 없다');
    ok(r.urd.herbs && r.urd.chart && r.urd.b === 'herbs' && r.urd.u && r.urdEarly === false, '④ 아카풀코 — 우르다네타의 선원들에 약재 6통 · 돌아오는 길 해도 (1565.10.8 전엔 없다)');
    ok(r.ayu.first && r.ayu.land.startsWith('강가의 버마 군:80') && r.ayu.craft && r.ayu.b === 'rescue' && r.ayuLost.b === 'rescueLost' && !r.ayuLost.craft && r.ayuAfter === false, '⑤ 아유타야 포위 — 란쌍보다 먼저 · 장인들을 빼낸다(육상전 80) · 함락 뒤엔 없다');
    ok(r.mPend && r.man.land.startsWith('에스파냐 원정대와 비사야 동맹군:60') && r.man.kris && r.man.b === 'sulayman', '⑥ 마닐라 만 — 라자 술라이만 편에서 싸워 크리스');
    ok(r.manTrade.silk === 40 && r.manTrade.paid === 40 * 84 && r.manTrade.b === 'trade' && r.manTrade.city && r.manCool === false, '⑥ 1571.6.24 뒤 — 레가스피의 마닐라 · 중국 상인 비단 40통(0.8배) · 지나가면 180일');
    ok(r.news.length === 10 && r.noManila && r.old === 0 && r.world, '소식 10 (월항에서 마닐라를 들었으면 9) · 지난 소식은 안 나온다 · World.daily');
    ok(errors.length === 0, '페이지 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fail ? '\n실패 ' + fail : '\n모두 통과');
  process.exit(fail ? 1 : 0);
})();
