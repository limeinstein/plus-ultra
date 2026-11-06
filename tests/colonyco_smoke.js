/* 식민지 경쟁의 회사들 (2026-11-04) — 서인도 회사 · 프랑스 동인도 회사·퐁디셰리 · 트랑케바르 · 신스웨덴 · 토바고 · 다리엔
   node tests/colonyco_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
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
      const CC = G.ColonyCo, out = {}, said = [], asks = [];
      let picks = [];
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value == want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      const lot = q => ({ q, cost: 10, from: 0, d: 0, lots: { 0: { q, cost: 10 } } });
      function fresh(y, m, d, at, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, (o && o.sk) || {});
        const lg = G.LANGS.map((_, i) => i === 1 ? 3 : 0); if (o && o.hindi) lg[8] = o.hindi;
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg, diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y, m, d }; s.player.gold = (o && o.gold != null) ? o.gold : 20000; s.fleet.cargo = (o && o.cargo) || {}; s.player.items = [];
        if (typeof at === 'number') { const c = G.CITY_DATA[at]; s.loc = { mode: 'city', city: at, lon: c.lon, lat: c.lat }; } else s.loc = { mode: 'sea', lon: at[0], lat: at[1] };
        said.length = 0; asks.length = 0; return s;
      }
      const hasItem = id => G.Game.state.player.items.some(x => x.id === id);
      function run(s, until) { const news = []; for (let i = 0; i < 40000 && G.U.dateNum(s.date) < until; i++) { s.date = G.U.addDays(s.date, 1); s.day++; CC.daily().forEach(x => news.push(x.text)); } return news; }
      out.figs = G.COLONYCO_FIGS.every(id => G.HIST_FIG[id] && G.HIST_FIG[id].look);
      // ① 서인도 회사 3,000 → 1629 배당 1,500
      let s = fresh(1621, 8, 1, 24); out.wPend = CC.pending(); picks = [3000]; await CC.check();
      out.wic = { inv: s.colonyCo.wic, item: hasItem('wic_share'), uss: said.some(t => t.startsWith('빌럼 우셀링크스|')) };
      s.loc = { mode: 'sea', lon: 0, lat: 50 }; const g0 = s.player.gold; const nw = run(s, 16290401); out.wic.div = s.player.gold - g0; out.wic.heyn = nw.some(t => /마탄사스/.test(t));
      // ② 파리 1,000 → 1675 600 · 퐁디셰리 총 10정
      s = fresh(1664, 9, 1, 14); const t0 = G.Sponsor.rel('fr_king').trust; picks = [1000]; await CC.check();
      out.fr = { inv: s.colonyCo.fr, trust: G.Sponsor.rel('fr_king').trust - t0, colbert: said.some(t => t.startsWith('장바티스트 콜베르|')) };
      out.fr.sh = G.Company.state().shares.fr;
      s.loc = { mode: 'sea', lon: 0, lat: 50 }; const g1 = s.player.gold; const nf = run(s, 16750201); out.fr.ret = s.player.gold - g1; out.fr.news = nf.some(t => /프랑스 동인도 회사의 장사/.test(t));
      s = fresh(1675, 3, 1, [79.9, 11.9], { cargo: { guns: lot(12) } }); out.pSea = CC.seaPending(); picks = ['guns']; await CC.atSea();
      out.pondy = { st: s.colonyCo.pondy, guns: s.fleet.cargo.guns ? s.fleet.cargo.guns.q : 0, plan: hasItem('pondy_plan'), martin: said.some(t => t.startsWith('프랑수아 마르탱|')) };
      // ③ 트랑케바르 — 힌두어 2로 통역 / 아무것도 없으면 떠난다 → 180일 뒤
      s = fresh(1620, 8, 1, [79.9, 11.0], { hindi: 2 }); const d0 = G.Sponsor.rel('dk_king').trust; picks = ['lang']; await CC.atSea();
      out.tq = { st: s.colonyCo.tranq, seal: hasItem('dansborg_seal'), dk: G.Sponsor.rel('dk_king').trust - d0, crappe: said.some(t => t.startsWith('롤란 크라페|')), gold: s.player.gold };
      s = fresh(1620, 8, 1, [79.9, 11.0], { gold: 0 }); picks = ['lang']; await CC.atSea(); out.tq2 = { how: s.colonyCo.tranqHow, opts: asks[0].o, again: CC.seaPending() }; s.day += 181; out.tq2.later = CC.seaPending();
      out.tqOther = (fresh(1620, 8, 1, [60, 11]), CC.seaPending());
      // ④ 신스웨덴 — 웅변 2로 공정한 흥정 / 뉴암스테르담에 알린다
      s = fresh(1638, 5, 1, 260, { sk: { speech: 2 } }); picks = ['fair']; await CC.check();
      out.ns = { st: s.colonyCo.nswe, belt: hasItem('wampum_belt'), minuit: said.some(t => t.startsWith('페터 미누이트|')), matt: said.some(t => t.startsWith('마타호른|')) };
      s = fresh(1638, 5, 1, 260); const g2 = s.player.gold; picks = ['dutch']; await CC.check(); out.ns2 = { st: s.colonyCo.nswe, gold: s.player.gold - g2 };
      // ⑤ 토바고 — 식량 30일분
      s = fresh(1655, 1, 1, [-60.7, 11.25]); s.fleet.food = 5000; const f0 = s.fleet.food; picks = ['food']; await CC.atSea();
      out.tb = { st: s.colonyCo.tobago, ate: f0 - s.fleet.food, need: Math.ceil(G.R.dailyUse() * 30), letter: hasItem('courland_letter'), mollens: said.some(t => t.startsWith('빌럼 몰런스|')) };
      // ⑥ 다리엔 — 에든버러 청약 10,000 (사라짐) · 칼레도니아 만에서 식량을 판다
      s = fresh(1696, 4, 1, 42); picks = [10000]; await CC.check(); out.ds = { inv: s.colonyCo.darienSub, pat: said.some(t => t.startsWith('윌리엄 패터슨|')), task: CC.html().replace(/<[^>]+>/g, ' ') };
      s.date = { y: 1699, m: 1, d: 10 }; s.loc = { mode: 'sea', lon: -77.6, lat: 8.9 }; s.fleet.food = 5000; const g3 = s.player.gold; out.dSea = CC.seaPending(); picks = ['sell']; await CC.atSea();
      out.dr = { st: s.colonyCo.darien, gold: s.player.gold - g3 };
      const nd = run(s, 16990701); out.dr.lost = nd.some(t => /다리엔의 실패/.test(t) && /10,000닢도 돌아오지 않는다/.test(t));
      // 소식 전체 · 옛 저장
      s = fresh(1615, 1, 1, [0, 50]); CC.daily(); const all = run(s, 16991231);
      out.news = all.filter(t => /^【/.test(t)).map(t => t.match(/【([^】]+)】/)[1]);
      s = fresh(1699, 12, 1, [0, 50]); out.old = CC.daily().length;
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.figs, '인물 (생김새 포함)');
    ok(r.wPend && r.wic.inv === 3000 && r.wic.item && r.wic.uss && r.wic.heyn && r.wic.div === 1500, '① 서인도 회사 — 우셀링크스와 열아홉 이사 · 청약 3,000(주식 6주) · 마탄사스의 은 선단 → 1629 1주에 250 = 1,500');
    ok(r.fr.inv === 1000 && r.fr.sh === 2 && r.fr.trust === 8 && r.fr.colbert && r.fr.ret === 0 && r.fr.news, '② 프랑스 동인도 회사 — 콜베르 · 출자하면 왕의 신뢰 · 주식 2주 · 1675 장사가 시원치 않다는 소식 (돈을 따로 돌려주지 않는다)');
    ok(r.pSea && r.pondy.st === 'guns' && r.pondy.guns === 2 && r.pondy.plan && r.pondy.martin, '② 퐁디셰리 앞바다 — 마르탱에게 총 10정 · 첫 설계도');
    ok(r.tq.st === 'lang' && r.tq.seal && r.tq.dk === 10 && r.tq.crappe && r.tq.gold === 20000, '③ 트랑케바르 — 힌두어로 나야크 궁정의 말을 옮겨 조약 · 덴마크 국왕의 신뢰');
    ok(r.tq2.how === 'leave' && r.tq2.opts.includes('lang!') && r.tq2.opts.includes('gold!') && r.tq2.again === false && r.tq2.later && r.tqOther === false, '③ 말도 돈도 없으면 떠난다 → 180일 뒤 다시 · 다른 바다엔 없다');
    ok(r.ns.st === 'fairGood' && r.ns.belt && r.ns.minuit && r.ns.matt && r.ns2.st === 'dutch' && r.ns2.gold === 2000, '④ 신스웨덴 — 레나페와 공정한 흥정(왐펌 띠) / 뉴암스테르담에 알리면 금화');
    ok(r.tb.st === 'food' && r.tb.ate === r.tb.need && r.tb.letter && r.tb.mollens, '⑤ 토바고 — 「새 쿠를란트」 이주민에게 식량 30일분 · 공작의 감사장');
    ok(r.ds.inv === 10000 && r.ds.pat && /다리엔/.test(r.ds.task) && r.dSea && r.dr.st === 'sell' && r.dr.gold > 0 && r.dr.lost, '⑥ 다리엔 — 패터슨에게 출자 10,000 · 칼레도니아 만에서 식량을 비싸게 · 실패 소식과 함께 출자금이 사라진다');
    ok(JSON.stringify(r.news) === JSON.stringify(['덴마크 동인도 회사', '트랑케바르', '네덜란드 서인도 회사', '마탄사스의 은 선단', '신스웨덴', '미누이트의 죽음', '새 쿠를란트', '신스웨덴의 끝', '프랑스 동인도 회사', '퐁디셰리', '다리엔', '다리엔의 실패']) && r.old === 0, '소식 열두 가지 차례대로 · 옛 저장');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
