/* 금봉호 — 마대인과 딸 지나 (2026-11-02): 중국 근해의 만남 · 최근에 본 값의 70% · 후려치기 · 조선 물건
   node tests/wangmerchant_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const WM = G.WangMerch, out = {}, said = [], asks = [];
      let picks = [], luck = true;
      G.U.chance = () => luck;
      if (G.Pace) { G.Pace.ok = () => true; }
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value === want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      function fresh(y, lon, lat, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, (o && o.sk) || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y, m: 5, d: 1 }; s.fleet.cargo = {}; s.player.gold = (o && o.gold != null) ? o.gold : 1000000; s.ledger = {};
        s.loc = { mode: 'sea', lon, lat };
        s.fleet.ships.forEach(sh => { sh.cap = 5000; });
        said.length = 0; asks.length = 0; return s;
      }
      out.figs = G.WANGMERCH_FIGS.every(id => G.HIST_FIG[id] && G.HIST_FIG[id].look);
      // 값: 수첩이 없으면 본디 값 · 최근에 본 사는 값이 있으면 그것의 70%
      let s = fresh(1580, 117, 23);
      out.base = WM.seen('silk');
      s.ledger[174] = { t: s.day - 30, s: [], b: { silk: 180 } }; s.ledger[177] = { t: s.day - 3, s: [], b: { silk: 200 } };
      out.seen = WM.seen('silk'); out.price = WM.price('silk', 0.7);
      // 만남: 중국 근해 / 조선 앞바다 · 하루 한 번 굴림
      out.here = WM.seaPending(); out.korSea = (fresh(1580, 127.5, 34), WM.seaPending());
      // 처음 만남 (1550 — 해금) · 조선 물건을 보유해도 금봉호에서는 매입하지 않는다 · 후려치기(흠·치켜세우기 성공) · 견직물을 산다
      s = fresh(1550, 117, 23, { sk: { craft: 2, speech: 2, acct: 2 } }); s.ledger[177] = { t: s.day - 3, s: [], b: { silk: 200, porcelain: 300, tea: 100 } };
      s.fleet.cargo.herbs = { q: 40, cost: 20, from: 190, d: s.day, lots: { 190: { q: 30, cost: 20 }, 0: { q: 10, cost: 20 } } };
      out.koreanCargoBefore = s.fleet.cargo.herbs.q;
      const g0 = s.player.gold;
      out.pend = WM.seaPending();
      picks = ['haggle', 'flaw', 'flatter', 'stop', 'silk', 'done'];
      await WM.atSea();
      const cg = s.fleet.cargo.silk;
      out.meet = { met: s.wangMerch.met, cool: s.wangMerch.cool > s.day, again: WM.seaPending(), haijin: said.some(t => /바다를 막아/.test(t)), ma: said.some(t => t.startsWith('마대인|')), jina: said.some(t => t.startsWith('지나|')), wang: said.some(t => /^(왕서방|명월)\|/.test(t)),
        herbsLeft: s.fleet.cargo.herbs ? s.fleet.cargo.herbs.q : 0, moonState: !!s.wangMoon, silkQ: cg ? cg.q : 0, silkCost: cg ? cg.cost : 0, from: cg ? Object.keys(cg.lots).join() : '', korea: s.wangMerch.korea, deals: s.wangMerch.deals,
        hagQ: asks.filter(a => /후려치기/.test(a.q)).map(a => a.q), spent: g0 - s.player.gold };
      // 후려치기 실패: 들키면 값이 도로 오른다(처음 값 위로는 안 오름) · 거절 2번이면 지나가 장부를 덮는다
      s = fresh(1600, 117, 23); s.ledger[177] = { t: s.day - 3, s: [], b: { silk: 200, porcelain: 300, tea: 100 } };
      luck = true; WM.seaPending(); luck = false; picks = ['haggle', 'walk', 'cash', 'tea', 'done'];
      await WM.atSea();
      out.failHag = { asks: asks.filter(a => /후려치기/.test(a.q)).length, closed: said.some(t => /장부를 탁 덮으며/.test(t)), teaCost: s.fleet.cargo.tea ? s.fleet.cargo.tea.cost : 0, teaQ: s.fleet.cargo.tea ? s.fleet.cargo.tea.q : 0, monthly: said.some(t => /월항이 열린 뒤로/.test(t)) };
      // 바닥값 45% · 소지금만큼만
      s = fresh(1600, 117, 23, { gold: 7000 }); s.ledger[177] = { t: s.day - 3, s: [], b: { silk: 200, porcelain: 300, tea: 100 } };
      out.floor = await (async () => { luck = true; picks = ['flaw', 'cash', 'flatter', 'walk', 'stop']; return WM._t.haggle({ ratio: 0.7, ratio0: 0.7, stock: {} }); })();
      out.canBuy = WM.canBuy('silk', 100, 900);
      // 거래 세 번 → 지나가 따라온다 · 그 뒤로는 마대인이 값을 부르고 지나는 제독 편 (+12%p)
      s = fresh(1600, 117, 23); s.ledger[177] = { t: s.day - 3, s: [], b: { silk: 200, porcelain: 300, tea: 100 } };
      luck = true; const flaw = WM.TACTICS[0], o0 = WM.odds(flaw, 1);
      for (let i = 0; i < 3; i++) { picks = ['buy', 'tea', 'done']; s.fleet.cargo = {}; said.length = 0; await WM.meet(); }
      out.join = { deals: s.wangMerch.deals, jina: s.mates.some(m => m.id === 'jina'), leave: said.some(t => /내 딸을 맡기오/.test(t)), half: said.some(t => /오늘 말은 다 믿으셔도/.test(t)), aboard: WM.jinaAboard(), odds: Math.round((WM.odds(flaw, 1) - o0) * 100),
        sk: G.MATE.jina.sk, adult: /스물두 살/.test(G.MATE.jina.desc) };
      said.length = 0; asks.length = 0; s.fleet.cargo = {}; picks = ['haggle', 'flaw', 'stop', 'done']; await WM.meet();
      out.after = { greet: said.some(t => /내 딸 밥은/.test(t)), sideJina: said.some(t => t.startsWith('지나|') && /이쪽 편이에요/.test(t)), pitchMa: said.some(t => t.startsWith('마대인|') && /딸 둔 집이라고/.test(t)), once: s.mates.filter(m => m.id === 'jina').length };
      // 아무것도 사지 않으면 거래로 치지 않는다
      s = fresh(1600, 117, 23); picks = ['no']; await WM.meet(); out.noDeal = s.wangMerch.deals || 0;
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.figs, '금봉호의 마대인 · 딸 지나 (생김새 포함)');
    ok(r.base.kind === 'base' && r.seen.p === 200 && r.seen.kind === 'buy' && r.price === 140, '최근에 본 값: 시세 수첩의 가장 최근 사는 값(200) → 70% = 140 · 수첩이 없으면 본디 값');
    ok(r.here === true && r.korSea === false, '중국 근해에서만 만난다 (조선 앞바다는 아니다)');
    ok(!r.meet.wang && !r.meet.moonState && r.meet.herbsLeft === r.koreanCargoBefore && !r.meet.korea, '금봉호에는 왕서방·명월이 나오지 않고 조선 물건·별개 이벤트 기록을 건드리지 않는다');
    ok(r.meet.ma && r.meet.jina && r.meet.haijin && r.meet.met === 1 && r.meet.cool && r.meet.again === false, '1550년 처음 만남: 마대인과 딸 지나 · 해금 시절의 바다 장사 · 한 번 만나면 한동안 없다');
    ok(r.meet.hagQ.length === 3 && /70%/.test(r.meet.hagQ[0]) && /64%/.test(r.meet.hagQ[1]) && /57%/.test(r.meet.hagQ[2]) && r.meet.silkCost === 114 && r.meet.silkQ >= 700 && r.meet.from === '287' && r.meet.deals === 1, '후려치기: 흠 −6%p · 치켜세우기 −7%p → 57% · 견직물 700통 넘게 1통 114닢(200의 57%) · 산 곳은 가장 가까운 명나라 항구(하문)');
    ok(r.failHag.asks === 2 && r.failHag.closed && r.failHag.teaCost === 70 && r.failHag.teaQ >= 700 && r.failHag.monthly, '후려치기 실패: 돌아서는 척이 들켜도 70% 위로는 안 오른다 · 두 번 거절당하면 장부를 덮는다');
    ok(Math.abs(r.floor - 0.45) < 1e-9 && r.canBuy === 70, '바닥값 45% · 소지금만큼만 산다');
    ok(r.join.deals === 3 && r.join.jina && r.join.leave && r.join.half && r.join.aboard && r.join.adult && r.join.sk.acct === 3, '거래 세 번 → 마대인의 딸 지나가 따라온다 (회계 3 · 성인)');
    ok(r.join.odds >= 12 && r.after.greet && r.after.sideJina && r.after.pitchMa && r.after.once === 1 && r.noDeal === 0, '그 뒤로는 마대인이 값을 부르고 지나는 제독 편에서 후려친다(지나의 회계·세공에 +12%p) · 사지 않으면 거래가 아니다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
