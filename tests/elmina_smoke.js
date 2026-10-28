/* 엘미나 요새 건설 (2026-10-28 사용자 요청) — node tests/elmina_smoke.js   (BROWSER_EXE=크롬 경로)
   · 인물 4명 · 시장 사건 minagold·lisbongold · 날짜·도시마다 장면이 열린다 (리스본·산호르헤)
   · 포르투갈 편 한 판: 리스본에서 원정대에 든다 → 카라만사에게 선물 → 바위 값을 먼저 치른다 → 스무 날의 성벽(몫) → 첫 금 상자 → 리스본의 국왕께 → 소식들
   · 다른 나라 한 판: 원정대를 사양 → 카라만사 편(금 조각) → 일꾼을 지킨다(육상전·악명) → 밤에 몰래 금을 산다(짐칸·악명)
   · 1637년 돌아오지 않는 문(몸값) · G.HISTORY 1482년 한 줄은 창을 띄우지 않는다(quiet) · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Mina && G.Hist && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, MN = G.Mina, said = [], asked = [], out = {};
      let plan = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : null; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      const fights = [];
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { fights.push({ name, n, kind: o && o.kind }); return 'win'; };
      const fresh = (nation) => {
        G.State.newGame({ name: '시험', nation: nation || 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1481, m: 6, d: 1 }; delete s.mina; s.fleet.food = 200; s.fleet.crew = 120; s.player.gold = 5000; return s;
      };
      const at = (s, y, m, d, city) => { s.date = { y, m, d }; s.loc = { mode: 'city', city }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = MN.pending(); if (p) await MN.check(); return p; };
      const daily = (s, y, m, d) => { s.date = { y, m, d }; s.loc = { mode: 'sea' }; return MN.daily(); };
      out.figs = G.MINA_FIGS.length; out.figNames = G.MINA_FIGS.every(id => G.HIST_FIG[id] && G.Hist.speaker(id).name === G.HIST_FIG[id].name);
      out.econDef = !!(G.Econ && G.Econ.DEF && G.Econ.DEF.minagold && G.Econ.DEF.lisbongold);
      out.mina = { name: G.CITY_DATA[97].name, founded: G.CITY_DATA[97].founded, gold: G.CITY_DATA[97].goods.indexOf('gold') >= 0 };
      // 날짜·도시마다 열리는가
      let s = fresh();
      const gate = (y, m, d, c, st) => { at(s, y, m, d, c); s.mina = Object.assign({ told: {} }, st || {}); return MN.pending(); };
      out.gates = {
        muster: gate(1481, 10, 1, 0), musterLate: gate(1481, 12, 20, 0), musterSeville: gate(1481, 10, 1, 7),
        meetEarly: gate(1482, 1, 10, 97), meet: gate(1482, 1, 20, 97), rock: gate(1482, 2, 5, 97, { meet: 'watch' }), walls: gate(1482, 3, 1, 97),
        wallsLate: gate(1482, 7, 10, 97), deliver: (s.player.items.push({ id: 'mina_firstgold', kind: 'keepsake', name: 'x' }), gate(1482, 9, 1, 0, { gold: 'carry' })), deliverNoItem: (s.player.items = s.player.items.filter(x => x.id !== 'mina_firstgold'), gate(1482, 9, 1, 0, { gold: 'carry' })), door: gate(1640, 1, 1, 97), doorEarly: gate(1630, 1, 1, 97)
      };
      // ── 포르투갈 편 한 판
      s = fresh('PT');
      at(s, 1481, 10, 15, 0); await go(['pt']);
      out.muster = { side: s.mina.side, azambuja: said.some(x => /^디오구 드 아잠부자: .*미나의 원정대장/.test(x)), colombo: said.some(x => /^크리스토방 콜롬부: /.test(x)), dias: said.some(x => /^바르톨로메우 디아스: /.test(x)), foreignWarn: said.some(x => /상어 밥/.test(x)) };
      out.sail = daily(s, 1481, 12, 13).some(m => /미나 원정대/.test(m.text));
      const land = daily(s, 1482, 1, 19);
      out.land = land.some(m => /제독의 배도 그 가운데/.test(m.text));
      at(s, 1482, 1, 22, 97); let g0 = s.player.gold; await go(['gift', 'pay']);
      out.meet = { meet: s.mina.meet, rock: s.mina.rock, gold: g0 - s.player.gold, opts: asked.map(a => a.opts), caramansa: said.some(x => /^카라만사: 가끔 만나는 벗/.test(x)), yes: said.some(x => /집을 짓도록 하시오/.test(x)), noto: s.player.notoriety || 0 };
      const wn = daily(s, 1482, 2, 10);
      out.wallsNews = { here: wn.some(m => /제독도 그 성벽 아래에/.test(m.text)), econ: (s.econ && s.econ.ev || []).some(e => e.type === 'minagold' && e.at === 97) };
      at(s, 1482, 2, 20, 97); g0 = s.player.gold; await go(['carry']);
      out.walls = { gold: s.player.gold - g0, carry: s.mina.gold, item: s.player.items.some(x => x.id === 'mina_firstgold'), colombo: said.some(x => /옛 학자들의 말이 틀렸소/.test(x)), html: /미나의 첫 금/.test(MN.html()) };
      out.cheapGold = { m: G.Econ.mult(G.CITY_DATA[97], 'gold', 'buy'), lis: G.Econ.mult(G.CITY_DATA[0], 'gold', 'buy') };
      at(s, 1482, 9, 1, 0); g0 = s.player.gold; await go([]);
      out.deliver = { gold: s.player.gold - g0, state: s.mina.gold, item: s.player.items.some(x => x.id === 'mina_firstgold'), king: said.some(x => /^국왕 주앙 2세: /.test(x)), again: MN.pending() };
      const ln = daily(s, 1483, 3, 16);
      out.lisbon = { news: ln.some(m => /첫 금 배가 리스본/.test(m.text)), econ: (s.econ.ev || []).some(e => e.type === 'lisbongold') };
      out.charter = daily(s, 1486, 1, 16).some(m => /도시의 특권/.test(m.text));
      out.captives = daily(s, 1495, 6, 2).some(m => /금과 바꾸는 사람들/.test(m.text));
      out.dutch = daily(s, 1637, 8, 30).some(m => /엘미나 함락.*서인도 회사/.test(m.text));
      // ── 다른 나라 한 판
      s = fresh('ES');
      at(s, 1481, 11, 1, 0); await go(['no']);
      out.esMuster = { side: s.mina.side, warn: said.some(x => /상어 밥/.test(x)), opt: asked[0] && asked[0].opts };
      at(s, 1482, 1, 25, 97); fights.length = 0; g0 = s.player.gold; await go(['friend', 'guard']);
      out.esMeet = { meet: s.mina.meet, keepsake: s.player.items.some(x => x.id === 'caramansa_gold'), rock: s.mina.rock, fight: fights[0], noto: s.player.notoriety || 0, gold: s.player.gold - g0 };
      at(s, 1482, 3, 5, 97); s.fleet.food = 20; s.fleet.water = 20; out.room = { free: G.R.free(), gold: G.Cargo && G.Cargo.room ? G.Cargo.room('gold') : null, kinds: Object.keys(s.fleet.cargo) }; g0 = s.player.gold; await go(['buy']);
      const cg = s.fleet.cargo.gold;
      out.esWalls = { smug: s.mina.smug, q: cg && cg.q, from: cg && cg.lots && Object.keys(cg.lots), paid: g0 - s.player.gold, noto: s.player.notoriety, opts: asked[0] && asked[0].opts, noCarry: !asked.some(a => a.opts.indexOf('carry') >= 0) };
      // ── 1637년 돌아오지 않는 문
      at(s, 1640, 3, 1, 97); s.mina.told = {}; g0 = s.player.gold = 5000; await go(['redeem']);
      out.door = { door: s.mina.door, paid: g0 - s.player.gold, factor: said.some(x => /^서인도 회사의 상관장: /.test(x)), again: MN.pending() };
      // ── G.HISTORY 1482년 한 줄은 일지에만 (quiet)
      const h = G.HISTORY.filter(x => x.y === 1482 && /미나/.test(x.text))[0];
      out.history = { quiet: !!(h && h.quiet), d: h && h.d };
      // ── 옛 저장: 이미 지난 소식은 알린 것으로
      s = fresh('PT'); s.date = { y: 1500, m: 1, d: 1 }; delete s.mina;
      const old = MN.daily();
      out.oldSave = { n: old.length, told: Object.keys(s.mina.told).length };
      // ── 소문 · 일지
      out.rumor = !!(G.EVENT_RUMORS && G.EVENT_RUMORS.some(x => x.id === 'mina'));
      out.journal = !!(G.Mina.daily && G.Mina.daily._journal);
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.figs === 4 && r.figNames, '인물 4명');
    ok(r.econDef, '시장 사건 minagold·lisbongold');
    ok(r.mina.founded === 1482 && r.mina.gold, '산호르헤(97) 1482년 세움 · 금');
    const g = r.gates;
    ok(g.muster && !g.musterLate && !g.musterSeville, '리스본 1481.9~12.11에만 원정대');
    ok(!g.meetEarly && g.meet && g.rock && g.walls && !g.wallsLate, '황금 해안 장면 날짜');
    ok(g.deliver && !g.deliverNoItem && g.door && !g.doorEarly, '첫 금 상자 · 돌아오지 않는 문 날짜');
    ok(r.muster.side === 'pt' && r.muster.azambuja && r.muster.colombo && r.muster.dias && !r.muster.foreignWarn, '리스본 — 원정대에 든다 (아잠부자·콜롬부·디아스)');
    ok(r.sail && r.land, '출항 · 두 마을 앞바다 소식');
    ok(r.meet.meet === 'gift' && r.meet.rock === 'pay' && r.meet.gold === 1100 && r.meet.caramansa && r.meet.yes && r.meet.noto === 0, '카라만사에게 선물 → 같은 입항에 바위 값을 치름 (금화 −1,100)');
    ok(r.wallsNews.here && r.wallsNews.econ, '스무 날의 성벽 소식 · 미나의 금 시장 사건');
    ok(r.walls.gold === 2500 && r.walls.carry === 'carry' && r.walls.item && r.walls.colombo && r.walls.html, '성벽 — 몫 2,500 · 첫 금 상자');
    ok(r.cheapGold.m < 1, '미나의 금이 싸다 (×' + r.cheapGold.m.toFixed(2) + ')');
    ok(r.deliver.gold === 3000 && r.deliver.state === 'done' && !r.deliver.item && r.deliver.king && !r.deliver.again, '리스본의 국왕께 첫 금 (금화 +3,000)');
    ok(r.lisbon.news && r.lisbon.econ && r.charter && r.captives && r.dutch, '뒷소식: 리스본의 금 · 도시 특권 · 금과 바꾸는 사람들 · 엘미나 함락');
    ok(r.esMuster.side === 'no' && r.esMuster.warn, '에스파냐 제독 — 외국 배 경고 · 사양');
    ok(r.esMeet.meet === 'friend' && r.esMeet.keepsake && r.esMeet.rock === 'guard' && r.esMeet.fight && r.esMeet.fight.kind === 'native' && r.esMeet.noto === 3, '카라만사 편(금 조각) · 일꾼을 지킨다(육상전 · 악명 +3)');
    ok(r.esWalls.smug === 'buy' && r.esWalls.q > 0 && r.esWalls.from.indexOf('97') >= 0 && r.esWalls.paid > 0 && r.esWalls.noto === 5 && r.esWalls.noCarry, '밤에 몰래 금을 산다 (짐칸 ' + r.esWalls.q + '통 · 악명 +2)');
    ok(r.door.door === 'redeem' && r.door.paid === 2400 && r.door.factor && !r.door.again, '돌아오지 않는 문 — 몸값 2,400 · 한 번만');
    ok(r.history.quiet && r.history.d === 19, 'G.HISTORY 1482 한 줄은 창 없이 (d 19, quiet)');
    ok(r.oldSave.n === 0 && r.oldSave.told >= 7, '옛 저장(1500년) — 지난 소식은 띄우지 않는다');
    ok(r.rumor, '소문');
    ok(r.journal, '일지 등급');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패:', e.message); process.exit(1); });
