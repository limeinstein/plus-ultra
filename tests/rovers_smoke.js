/* 바다의 사람들 (2026-11-04) — 메이플라워(물자·첫 겨울·왐파노아그·잔치) · 박연 · 스페르베르 · 하멜 · 해적 셋(맞붙어 털고 친해진다)
   node tests/rovers_smoke.js */
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
      const RV = G.Rovers, out = {}, said = [], asks = [], seas = [];
      let picks = [], luck = true, seaGo = true;
      G.U.chance = () => luck;
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value == want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      G.Rel.greatBattle = async (spec) => { seas.push(spec); return seaGo; };
      const lot = q => ({ q, cost: 10, from: 0, d: 0, lots: { 0: { q, cost: 10 } } });
      function fresh(y, m, d, at, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, (o && o.sk) || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y, m, d }; s.player.gold = (o && o.gold != null) ? o.gold : 10000; s.fleet.cargo = (o && o.cargo) || {}; s.player.items = []; s.fleet.food = 5000;
        if (typeof at === 'number') { const c = G.CITY_DATA[at]; s.loc = { mode: 'city', city: at, lon: c.lon, lat: c.lat }; } else s.loc = { mode: 'sea', lon: at[0], lat: at[1] };
        said.length = 0; asks.length = 0; seas.length = 0; return s;
      }
      const has = id => G.Game.state.mates.some(m => m.id === id);
      const hasItem = id => G.Game.state.player.items.some(x => x.id === id);
      out.data = { mates: G.ROVERS_MATES.join(), figs: G.ROVERS_FIGS.every(id => G.HIST_FIG[id] && G.HIST_FIG[id].look) };
      // ① 런던 물자 — 밀 20 · 맥주 10
      let s = fresh(1620, 7, 1, 38, { cargo: { wheat: lot(25), beer: lot(10) } }); const g0 = s.player.gold; picks = ['sell']; await RV.check();
      out.sup = { st: s.rovers.supply, gold: s.player.gold - g0, wheat: s.fleet.cargo.wheat ? s.fleet.cargo.wheat.q : 0, beer: s.fleet.cargo.beer ? 1 : 0, martin: said.some(t => t.startsWith('크리스토퍼 마틴|')) };
      s = fresh(1620, 7, 1, 38); picks = ['sell']; await RV.check(); out.supNo = { dis: asks[0].o.includes('sell!'), how: s.rovers.supplyHow };
      // ②③④ 플리머스 — 겨울 약재 · 봄 모직물 선물 · 가을 잔치
      s = fresh(1621, 1, 10, 253, { cargo: { herbs: lot(10), woolcloth: lot(6) } }); picks = ['herbs']; await RV.check();
      out.win = { st: s.rovers.winter, herbs: s.fleet.cargo.herbs.q, compact: hasItem('mayflower_compact'), brad: said.some(t => t.startsWith('윌리엄 브래드퍼드|')) };
      s.date = { y: 1621, m: 4, d: 1 }; said.length = 0; picks = ['g:woolcloth']; await RV.check();
      out.nat = { st: s.rovers.natives, wool: s.fleet.cargo.woolcloth ? s.fleet.cargo.woolcloth.q : 0, samoset: said.some(t => t.startsWith('사모셋|') && /웰컴/.test(t)), squanto: said.some(t => /물고기 두 마리/.test(t)), mass: said.some(t => t.startsWith('마사소이트|')) };
      s.date = { y: 1621, m: 10, d: 5 }; said.length = 0; out.feastPend = RV.pending(); await RV.check(); out.feast = { st: s.rovers.feast, deer: said.some(t => /사슴 다섯 마리/.test(t)) };
      s = fresh(1621, 10, 5, 253); out.feastNo = RV.pending();
      // ⑤ 한양 박연 — 조선어 +1 · 홍이포
      s = fresh(1640, 3, 1, 190); await RV.check(); out.wel = { lg: s.player.lg[14], item: hasItem('hongi_cannon'), w: said.some(t => /벨테브레이/.test(t)) };
      // ⑥ 제주 — 스페르베르 (박연을 만났으면 통역) · 항해 2면 선원을 잃지 않는다
      s.date = { y: 1653, m: 8, d: 20 }; s.loc = { mode: 'sea', lon: 126.5, lat: 33.2 }; said.length = 0; const c0 = s.fleet.crew; out.spPend = RV.seaPending(); picks = ['save']; await RV.atSea();
      out.sp = { st: s.rovers.sperwer, lost: c0 - s.fleet.crew, hamel: said.some(t => t.startsWith('헨드릭 하멜|')), yi: said.some(t => t.startsWith('이원진|')), wel: said.some(t => t.startsWith('박연 (얀 얀서 벨테브레이)|') && /나처럼/.test(t)) };
      // ⑦ 여수 — 하멜을 태운다 (알아본다)
      s.date = { y: 1666, m: 9, d: 1 }; s.loc = { mode: 'sea', lon: 127.7, lat: 34.6 }; said.length = 0; picks = ['take']; await RV.atSea();
      out.hm = { st: s.rovers.hamel, joined: has('hamel'), knew: said.some(t => /열세 해 만이오/.test(t)), journal: hasItem('hamel_journal') };
      // ⑧ 오말리 — 싸운다 → 이긴다 → 이튿날 친해진다(동료)
      s = fresh(1580, 6, 1, [-10.0, 53.8]); out.omPend = RV.seaPending(); picks = ['fight']; await RV.atSea();
      const sp1 = seas[0] || {}; out.om = { st: s.rovers.omalley, boss: sp1.boss && sp1.boss.hist, ships: (sp1.ships || []).length };
      G.Rel.afterBattle({ great: 'rv_omalley' }, 'win', []); out.om.after = RV.seaPending(); await RV.atSea();
      out.om.st2 = s.rovers.omalley; out.om.mate = has('omalley'); out.om.brooch = hasItem('granuaile_brooch'); out.om.whisky = said.some(t => /위스키/.test(t));
      // ⑨ 보니와 리드 — 지면 털리고 웃으며 떠났다가 180일 뒤 다시, 다시 붙어 이기면 둘 다
      s = fresh(1690, 3, 1, [-77.0, 19.0], { gold: 10000 }); picks = ['fight']; await RV.atSea(); G.Rel.afterBattle({ great: 'rv_bonny' }, 'lose', []); await RV.atSea();
      out.bn = { gold: s.player.gold, how: s.rovers.bonnyHow, mates: has('bonny') || has('mread'), again: RV.seaPending() };
      s.day += 181; seas.length = 0; picks = ['fight']; await RV.atSea(); G.Rel.afterBattle({ great: 'rv_bonny' }, 'win', []); await RV.atSea();
      out.bn.both = has('bonny') && has('mread'); out.bn.jack = said.some(t => /사내답게 싸웠으면/.test(t)); out.bn.pistol = hasItem('calico_pistol');
      // ⑩ 검은 수염 — 통행세를 내면 싸우지 않는다 / 싸워 이기면 동료
      s = fresh(1695, 5, 1, [-76.0, 35.0], { gold: 10000 }); picks = ['pay']; await RV.atSea(); out.tc = { gold: s.player.gold, how: s.rovers.teachHow, smoke: said.some(t => /수염에서 연기/.test(t)) };
      s = fresh(1695, 5, 1, [-76.0, 35.0]); picks = ['fight']; await RV.atSea(); G.Rel.afterBattle({ great: 'rv_teach' }, 'win', []); await RV.atSea(); out.tc.mate = has('blackbeard'); out.tc.fuse = hasItem('blackbeard_fuse');
      out.tcEarly = (fresh(1680, 5, 1, [-76.0, 35.0]), RV.seaPending());
      // 소식
      s = fresh(1620, 1, 1, [0, 50]); RV.daily(); const news = [];
      for (let i = 0; i < 20000 && G.U.dateNum(s.date) < 16690101; i++) { s.date = G.U.addDays(s.date, 1); RV.daily().forEach(x => news.push(x.text)); }
      out.news = news.map(t => (t.match(/【([^】]+)】/) || [])[1]);
      s = fresh(1680, 1, 1, [0, 50]); out.old = RV.daily().length;
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.data.mates === 'hamel,omalley,bonny,mread,blackbeard' && r.data.figs, '동료 다섯(하멜·오말리·보니·리드·검은 수염) · 인물');
    ok(r.sup.st === 'sold' && r.sup.gold === 510 && r.sup.wheat === 5 && !r.sup.beer && r.sup.martin && r.supNo.dis && r.supNo.how === 'no', '① 메이플라워 물자 조달: 밀 20·맥주 10을 값의 1.5배(510)로 · 모자라면 다음에');
    ok(r.win.st === 'herbs' && r.win.herbs === 2 && r.win.compact && r.win.brad, '② 플리머스의 첫 겨울 — 약재 8통 · 메이플라워 서약 사본');
    ok(r.nat.st === 'woolcloth' && r.nat.wool === 1 && r.nat.samoset && r.nat.squanto && r.nat.mass, '③ 원주민과의 만남 — 「웰컴, 잉글리시먼!」 사모셋 · 모직물 선물로 마사소이트와 약속 · 스콴토의 옥수수 심기');
    ok(r.feastPend && r.feast.st === 1 && r.feast.deer && r.feastNo === false, '④ 첫 추수 잔치 — 도운 사람만');
    ok(r.wel.lg === 1 && r.wel.item && r.wel.w, '⑤ 한양의 박연(벨테브레이) — 조선어 +1 · 홍이포 설계도');
    ok(r.spPend && r.sp.st === 'saved' && r.sp.lost === 3 && r.sp.hamel && r.sp.yi && r.sp.wel, '⑥ 스페르베르호 난파 — 생존자를 건지고(항해가 없어 선원 3을 잃음) · 제주 목사 · 박연이 통역');
    ok(r.hm.st === 'joined' && r.hm.joined && r.hm.knew && r.hm.journal, '⑦ 하멜의 탈출 — 제주에서 건졌던 배를 알아보고 동료로');
    ok(r.omPend && r.om.st === 'fighting' && r.om.boss === 'rv_grace' && r.om.ships === 4 && r.om.after && r.om.st2 === 'friends' && r.om.mate && r.om.brooch && r.om.whisky, '⑧ 그레이스 오말리 — 갤리선과 맞붙어 이기면 털고, 그날 밤 위스키 → 동료');
    ok(r.bn.gold === 8000 && r.bn.how === 'lost' && !r.bn.mates && r.bn.again === false && r.bn.both && r.bn.jack && r.bn.pistol, '⑨ 앤 보니·메리 리드 — 지면 20% 털리고 웃으며 떠남 → 180일 뒤 다시 붙어 이기면 둘 다 동료');
    ok(r.tc.gold === 8500 && r.tc.how === 'paid' && r.tc.smoke && r.tc.mate && r.tc.fuse && r.tcEarly === false, '⑩ 검은 수염 — 통행세 15% / 맞붙어 이기면 동료 · 1685년 전엔 없다');
    ok(JSON.stringify(r.news) === JSON.stringify(['메이플라워 서약', '플리머스', '왐파노아그와의 약속', '스페르베르호의 난파', '하멜의 탈출', '하멜 표류기']) && r.old === 0, '소식 · 옛 저장');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
