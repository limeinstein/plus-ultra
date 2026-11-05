/* 두 부인이 한 도시에 — 질투와 부부싸움 (2026-11-05)
   node tests/wifefeud_smoke.js */
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
      const WF = G.WifeFeud, out = {}, said = [], asks = [];
      let picks = [], luck = true;
      G.U.chance = () => luck;
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value === want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      const maids = Object.keys(G.MAID).slice(0, 3), mateW = 'kasha';
      function fresh(city, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, (o && o.sk) || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y: 1560, m: 5, d: 1 }; s.player.gold = 5000; s.fleet.discipline = 50;
        const c = G.CITY_DATA[city]; s.loc = { mode: 'city', city, lon: c.lon, lat: c.lat };
        said.length = 0; asks.length = 0; return s;
      }
      const name = id => G.MAID[id] ? G.MAID[id].name : G.MATE[id].name;
      // ① 한 도시의 두 집 (리스본에 둘째·셋째 부인) — 말로 달랜다
      let s = fresh(1); const home = s.player.home;
      s.player.wives2 = [{ id: maids[0], kind: 'maid', city: 1, house: true, no: 2 }, { id: maids[1], kind: 'maid', city: 1, house: true, no: 3 }];
      out.present = WF.present(1).map(x => x.no).join();
      out.pend = WF.pending(); picks = ['calm']; await WF.check();
      out.calm = { loveA: s.player.wives2[0].love, loveB: s.player.wives2[1].love, market: said.some(t => /한 도시에 집이 둘/.test(t)), cmp: said.some(t => /누가 먼저예요/.test(t)), peace: said.some(t => /한 식탁에서 제독의 흉을/.test(t)) };
      out.gap = WF.pending();                  // 45일 안에는 다시 없다
      s.day += 50; out.pairCool = WF.pending();  // 같은 두 사람은 1년에 한 번
      // ② 선실의 비밀 — 고향 항구에서 본처가 숨어 있는 부인을 찾아낸다 → 본처 편
      s = fresh(1); const hc = s.player.home; s.loc = { mode: 'city', city: hc, lon: G.CITY_DATA[hc].lon, lat: G.CITY_DATA[hc].lat };
      s.player.wife = maids[2]; s.player.wifeAboard = false;
      s.mates.push({ id: mateW, role: 'none', loyal: 80, hidden: hc }); s.player.wives2 = [{ id: mateW, kind: 'mate', city: 100, aboard: true, house: false, no: 2 }];
      const pr = WF.pair(hc); out.cabinPair = pr && pr.a.kind + '>' + pr.b.kind + (pr.b.hidden ? ':hidden' : '');
      picks = ['sideA']; await WF.check();
      out.cabin = { main: s.player.wifeLove, b: s.player.wives2[0].love, cold: s.player.wives2[0].cold == null, scene: said.some(t => /담요를 뒤집어쓰고/.test(t)), ask: asks[0].o.join() };
      // ③ 부두에서 마주치다 — 본처가 배에 타고, 그 도시에 집이 있는 둘째 부인 → 둘째 편을 들면 본처가 서운
      s = fresh(29); s.player.wife = maids[2]; s.player.wifeAboard = true; s.player.wives2 = [{ id: maids[0], kind: 'maid', city: 29, house: true, no: 2 }];
      picks = ['sideB']; await WF.check();
      out.dock = { main: s.player.wifeLove, b: s.player.wives2[0].love, scene: said.some(t => /배다리가 내려지고/.test(t)) };
      // ④ 본처 편을 들면 집에 사는 둘째 부인은 문을 닫는다 → 그동안은 「그 도시에 있다」로 치지 않는다
      s = fresh(29); s.player.wife = maids[2]; s.player.wifeAboard = true; s.player.wives2 = [{ id: maids[0], kind: 'maid', city: 29, house: true, no: 2 }];
      picks = ['sideA']; await WF.check(); const w = s.player.wives2[0];
      out.shut = { cold: w.cold > s.day, isCold: G.Wives.isCold(w), present: WF.present(29).length };
      // ⑤ 선물 (금화 2,000) · ⑥ 자리를 피한다 (규율 −2) · ⑦ 말로 달래다 실패
      s = fresh(1); s.player.wives2 = [{ id: maids[0], kind: 'maid', city: 1, house: true, no: 2 }, { id: maids[1], kind: 'maid', city: 1, house: true, no: 3 }];
      picks = ['gift']; await WF.check(); out.gift = { gold: s.player.gold, love: s.player.wives2.map(x => x.love).join() };
      s = fresh(1); s.player.wives2 = [{ id: maids[0], kind: 'maid', city: 1, house: true, no: 2 }, { id: maids[1], kind: 'maid', city: 1, house: true, no: 3 }];
      picks = ['flee']; await WF.check(); out.flee = { disc: s.fleet.discipline, love: s.player.wives2.map(x => x.love).join(), mate: said.some(t => /정말 빠르시더군요/.test(t)) };
      s = fresh(1); s.player.wives2 = [{ id: maids[0], kind: 'maid', city: 1, house: true, no: 2 }, { id: maids[1], kind: 'maid', city: 1, house: true, no: 3 }];
      luck = true; WF.pending(); luck = false; picks = ['calm']; await WF.check(); out.calmFail = s.player.wives2.map(x => x.love).join();
      // ⑧ 한 사람뿐이거나 다른 도시면 없다 · 운이 없으면 없다
      luck = true;
      s = fresh(1); s.player.wives2 = [{ id: maids[0], kind: 'maid', city: 1, house: true, no: 2 }, { id: maids[1], kind: 'maid', city: 29, house: true, no: 3 }]; out.apart = WF.pending();
      s = fresh(1); s.player.wives2 = [{ id: maids[0], kind: 'maid', city: 1, house: true, no: 2 }]; out.one = WF.pending();
      s = fresh(1); s.player.wives2 = [{ id: maids[0], kind: 'maid', city: 1, house: true, no: 2 }, { id: maids[1], kind: 'maid', city: 1, house: true, no: 3 }]; luck = false; out.unlucky = WF.pending();
      out.names = [name(maids[0]), name(maids[1])];
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.present === '2,3' && r.pend && r.calm.loveA === 76 && r.calm.loveB === 76 && r.calm.market && r.calm.cmp && r.calm.peace, '① 한 도시의 두 집 — 시장에서 마주쳐 다툼 · 말로 달래면 둘 다 정 +6');
    ok(r.gap === false && r.pairCool === false, '45일 안에는 다시 없다 · 같은 두 사람은 1년에 한 번');
    ok(r.cabinPair === 'main>w2:hidden' && r.cabin.main === 82 && r.cabin.b === 50 && r.cabin.cold && r.cabin.scene, '② 선실의 비밀 — 고향 항구에서 숨은 부인을 본처가 찾아낸다 · 본처 편 (배에 탄 부인은 문을 닫지 않는다)');
    ok(r.dock.main === 50 && r.dock.b === 82 && r.dock.scene, '③ 부두에서 마주치다 — 배에 탄 본처와 그 도시의 둘째 부인 · 둘째 편을 들면 본처가 서운');
    ok(r.shut.cold && r.shut.isCold && r.shut.present === 1, '④ 편을 들어 주지 않은 둘째 부인은 한동안 집 문을 닫는다');
    ok(r.gift.gold === 3000 && r.gift.love === '76,76' && r.flee.disc === 48 && r.flee.love === '62,62' && r.flee.mate && r.calmFail === '60,60', '⑤ 선물 금화 2,000 · ⑥ 자리를 피하면 둘 다 −8·규율 −2 · ⑦ 달래다 실패하면 둘 다 −10');
    ok(r.apart === false && r.one === false && r.unlucky === false, '다른 도시·한 사람뿐·운이 없으면 없다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
