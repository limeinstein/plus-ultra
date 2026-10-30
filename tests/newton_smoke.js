/* 아이작 뉴턴 (2026-10-30) — 사과 · 『프린키피아』 · 남해 회사 주식의 나락 · 동료 · 소식
   node tests/newton_smoke.js */
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
      const NT = G.Newton, out = {}, said = [], toasts = [], asks = [];
      let picks = [], join = true;
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value === want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.confirm = async () => join;
      G.UI.toast = (t) => { toasts.push(t); };
      const LON = 38;
      function fresh(y, m, d, where, sk) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, sk || {});
        G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: [3, 3, 3, 3], diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y, m, d }; s.player.gold = 30000;
        if (where === 'farm') s.loc = { mode: 'land', lon: -0.7, lat: 52.85, party: 30 };
        else { const c = G.CITY_DATA[LON]; s.loc = { mode: 'city', city: LON, lon: c.lon, lat: c.lat }; s.portVisit = 1; }
        said.length = 0; toasts.length = 0; asks.length = 0; delete s.newton; return s;
      }
      const hired = () => G.Game.state.mates.some(m => m.id === 'newton');
      const M = G.MATE.newton;
      out.data = { st: M.st, sk: M.sk, int: M.st[1], event: M.eventOnly, figs: ['newton', 'nt_halley', 'nt_hooke', 'nt_broker'].every(id => G.HIST_FIG[id]), items: !!G.ITEM.principia && !!G.ITEM.fish_history };
      // ① 사과
      let s = fresh(1665, 3, 1, 'farm'); out.appleEarly = NT.appleOpen(-0.7, 52.85);
      s = fresh(1666, 8, 1, 'farm'); out.appleFar = NT.appleOpen(-3, 55);
      picks = ['pull', 'orbit']; join = true;
      out.applePend = NT.appleOpen(-0.7, 52.85); const ok1 = await NT.onLand(-0.7, 52.85, { stop: () => {} });
      out.apple = { ok1, apple: s.newton.apple, moon: s.newton.moon, hired: hired(), q: asks.map(a => a.q), cannon: said.some(t => /대포알/.test(t)), again: NT.appleOpen(-0.7, 52.85), sci: G.R.skillBest('sci').lv, nav: G.R.skillBest('nav').lv };
      // ② 프린키피아 — 『물고기의 역사』를 사 주고 웅변 2로 후크를 달랜다 (뉴턴이 동료면 곁에서 말한다)
      s.date = { y: 1686, m: 6, d: 1 }; s.player.sk.speech = 2; const c = G.CITY_DATA[LON]; s.loc = { mode: 'city', city: LON, lon: c.lon, lat: c.lat }; s.portVisit = 5;
      picks = ['fish', 'mediate']; said.length = 0; const g0 = s.player.gold;
      out.prinPend = NT.pending(); await NT.check();
      out.prin = { fund: s.newton.fund, hooke: s.newton.hooke, gold: g0 - s.player.gold, fish: s.player.items.some(x => x.id === 'fish_history'), halley: said.some(t => t.startsWith('에드먼드 핼리|')), hookeSaid: said.some(t => t.startsWith('로버트 후크|')), newtonHere: said.some(t => t.startsWith('아이작 뉴턴|') && /셋째 권/.test(t)) };
      s.date = { y: 1687, m: 7, d: 4 }; G.World.daily(); s.date = { y: 1687, m: 7, d: 5 }; const n1 = G.World.daily().map(x => x.text);
      out.book = { item: s.player.items.some(x => x.id === 'principia'), news: n1.some(t => /초판/.test(t)) && n1.some(t => /【『프린키피아』】/.test(t) && /울즈소프/.test(t)) };
      // 웅변이 모자라면 달래지 못한다 · 금화로 인쇄비
      s = fresh(1686, 9, 1, 'london'); picks = ['gold', 'mediate']; join = false; await NT.check();
      out.prin2 = { fund: s.newton.fund, hooke: s.newton.hooke, dis: asks[1].o.includes('mediate!'), gold: 30000 - s.player.gold, hired: hired() };
      // ③ 주식의 나락
      out.price = [17200101, 17200410, 17200624, 17200915, 17201231, 17210601].map(t => NT.price(t));
      s = fresh(1720, 1, 10, 'london'); picks = ['buy10000']; await NT.check();
      const B = s.newton.bubble; out.buy = { shares: +B.shares.toFixed(2), want: +(9700 / NT.price()).toFixed(2), cost: B.cost, gold: s.player.gold, again: NT.pending() };
      s.portVisit++; s.date = { y: 1720, m: 6, d: 24 }; picks = ['sell']; await NT.check();
      out.sell = { gold: s.player.gold, shares: B.shares, gain: B.sold };
      s.portVisit++; s.date = { y: 1720, m: 7, d: 1 }; s.player.sk.speech = 3; picks = ['buy10000']; asks.length = 0; await NT.check();
      out.top = { cap: asks[0].o, shares: +B.shares.toFixed(2) };
      s.portVisit++; picks = ['warn']; await NT.check(); out.warn = { ok: s.newton.bubbleNewtonOk, buyDis: asks[asks.length - 1].o.filter(x => /^buy/.test(x)).every(x => x.endsWith('!')) };
      out.html = NT.html().replace(/<[^>]+>/g, ' ');
      s.portVisit++; s.date = { y: 1720, m: 10, d: 1 }; picks = ['watch']; join = true; said.length = 0; await NT.check();
      out.fall = { quote: said.some(t => /광기는 계산할 수 없/.test(t)), hired: hired(), shares: +B.shares.toFixed(2) };
      s.portVisit++; s.date = { y: 1721, m: 3, d: 1 }; out.lateOpen = NT.pending(); const sold0 = B.sold; picks = ['sell']; await NT.check(); out.late = { gain: B.sold - sold0, shares: B.shares, gold: s.player.gold };
      // 소식 — 붕괴(말린 덕에 절반) · 죽음 (동료였으면 배를 떠난다)
      s.date = { y: 1720, m: 9, d: 19 }; s.newton.told.crash = 0; delete s.newton.told.crash; const n2 = []; for (let i = 0; i < 3; i++) { s.date = G.U.addDays(s.date, 1); NT.daily().forEach(x => n2.push(x.text)); }
      out.crash = n2.find(t => /남해 회사의 붕괴/.test(t)) || '';
      s.date = { y: 1727, m: 3, d: 19 }; NT.daily(); s.date = { y: 1727, m: 3, d: 20 }; const n3 = NT.daily().map(x => x.text);
      out.death = { gone: !hired() && !!s.flags.gone_newton, news: n3.some(t => /뉴턴의 죽음/.test(t) && /배/.test(t)) };
      // 미뤘다가 1720년 9월 20일 뒤 런던에서 다시
      s = fresh(1721, 1, 1, 'london'); s.newton = { met: 1, told: {}, bubble: { shares: 0, cost: 0 } }; join = true; out.reoffer = NT.pending(); await NT.check(); out.reHired = hired();
      // 옛 저장(1750): 소식 몰아서 없음
      s = fresh(1750, 1, 1, 'london'); NT.daily(); s.newton.met = 1; out.old = NT.daily().length;
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.data.int === 97 && JSON.stringify(r.data.sk) === JSON.stringify({ acct: 1, survey: 3, sci: 3, ship: 3, craft: 3, nav: 3, speech: 3 }) && r.data.event && r.data.figs && r.data.items, '뉴턴: 지력 97 · 회계 1 · 측량·과학·조선기술·세공·항해·웅변 3 · 사건으로만 동료');
    ok(r.appleEarly === false && r.appleFar === false, '사과: 1665년 6월 전·울즈소프 밖에서는 없다');
    ok(r.applePend && r.apple.ok1 && r.apple.moon && r.apple.cannon && !r.apple.again && r.apple.q.length === 2, '① 사과: 「왜 땅으로?」→「달은 왜 안 떨어지지?」 — 대포알 이야기');
    ok(r.apple.hired && r.apple.sci === 3 && r.apple.nav === 3, '사과 뒤 동료로 — 과학·항해 3이 배에 더해진다');
    ok(r.prinPend && r.prin.fund === 'fish' && r.prin.gold === 400 && r.prin.fish && r.prin.hooke === 'mediate' && r.prin.halley && r.prin.hookeSaid && r.prin.newtonHere, '② 『프린키피아』: 『물고기의 역사』를 사 주고, 웅변 2로 후크와 뉴턴을 달랜다 (동료 뉴턴이 곁에서)');
    ok(r.book.item && r.book.news, '1687.7.5 초판이 제독에게 · 소식에 울즈소프의 물음');
    ok(r.prin2.fund === 'gold' && r.prin2.gold === 1500 && r.prin2.hooke === 'halley' && r.prin2.dis && !r.prin2.hired, '인쇄비 금화 1,500 · 웅변이 모자라면 핼리가 달랜다 · 동료 제안을 미룰 수 있다');
    ok(r.price[0] === 128 && r.price[2] === 1050 && r.price[4] === 150 && r.price[5] === 150 && r.price[1] > 330 && r.price[1] < 550 && r.price[3] === 520, '주식 값: 1월 128 → 6월 24일 1,050 → 12월 150 (' + r.price.join(', ') + ')');
    ok(r.buy.cost === 10000 && Math.abs(r.buy.shares - r.buy.want) < 0.05 && r.buy.gold === 20000 && !r.buy.again, '③ 1월에 금화 10,000어치(수수료 3%) · 한 번 들른 사이에는 한 번만');
    ok(r.sell.shares === 0 && r.sell.gain > 40000, '6월 24일 꼭대기에 팔면 큰 이익 (+' + r.sell.gain + ')');
    ok(r.top.cap.includes('buy10000') && r.warn.ok && r.warn.buyDis, '들인 돈은 합쳐 10,000까지 · 웅변 3으로 뉴턴을 말린다');
    ok(/남해 회사 주식/.test(r.html), '수첩에 가진 주식과 값');
    ok(r.fall.quote && r.fall.hired, '가을의 나락: 「사람들의 광기는 계산할 수 없다」 · 무너진 뒤 동료 제안');
    ok(r.lateOpen && r.late.shares === 0 && r.late.gain < 0, '1720년이 지나도 들고 있으면 150에 판다 — 손해 ' + r.late.gain);
    ok(/절반/.test(r.crash), '붕괴 소식: 말린 덕에 뉴턴이 절반만 잃었다');
    ok(r.death.gone && r.death.news, '1727.3.20 뉴턴이 세상을 떠나 배를 떠난다');
    ok(r.reoffer && r.reHired, '미뤘으면 1720년 9월 20일 뒤 런던에서 다시 묻는다');
    ok(r.old === 0, '옛 저장은 지난 소식을 몰아서 알리지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
