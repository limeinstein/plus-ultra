/* 포르투갈의 마카오 거점 (2026-11-01 사용자 요청) — node tests/macao_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 광주에 다가가면 레오넬 드 소자 — 1553.6~1557.5만 · 설득 실패면 30일 뒤 · 선물이면 반드시 · 허가첩(팔 수 없다) · 광주 통행 허가가 날마다 다시
   · ② 해적 — 약조 20일 뒤 광주에서 큰 해전(물 위의 자리 · 끝나면 광주) · ③ 1557 전에는 기다리라 · 1557 뒤 땅을 빌림 · ④ 오문의 첫 집들 — 포르투갈 제독은 작위, 다른 나라는 몫
   · 진짜 입항: 광주로 다가가면 담판 → 허가첩으로 성문을 지난다 · 소식 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Macao && G.World && G.Rel, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, MC = G.Macao, said = [], asked = [], out = {}, specs = [];
      let plan = [], seaWin = true;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Rel.greatBattle = async (sp) => { specs.push(sp); if (seaWin) sp.onWin(); else sp.onLose(); return true; };
      const fresh = (nation) => {
        G.State.newGame({ name: '시험', nation: nation || 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1554, m: 3, d: 1 }; s.player.born = { y: 1524, m: 1, d: 1 }; delete s.life; delete s.macao; s.player.gold = 20000;
        return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = MC.pending(); if (p) await MC.check(); return p; };
      const canton = G.CITY_DATA[174];
      // ── ① 날짜
      let s = fresh();
      s.date = { y: 1553, m: 1, d: 1 }; out.early = await MC.beforePort(canton) === false && !s.macao.met;
      // 설득 실패 → 30일 뒤
      const chance0 = G.U.chance; G.U.chance = () => false;
      s.date = { y: 1554, m: 3, d: 1 }; plan = ['talk']; said.length = 0; await MC.beforePort(canton);
      out.fail = { deal: s.macao.deal, cool: s.macao.cool > s.day, again: MC._t.dealOpen(canton), line: said.some(x => /번인의 말을 어찌 믿겠느냐/.test(x)) };
      G.U.chance = chance0;
      s.day += 31; plan = ['gift']; said.length = 0; const g0 = s.player.gold; await MC.beforePort(canton);
      out.deal = { v: s.macao.deal, gold: g0 - s.player.gold, chop: G.R.hasItem('macao_chop'), noSell: !!G.ITEM.macao_chop.noSell, pass: G.Sneak.hasPass(canton), tax: said.some(x => /짐의 절반을 헤아려 그 2할/.test(x)), entry: !G.Scenes.city.entryCheck(canton) };
      // 통행 허가가 날마다 다시
      s.day += 400; out.passOld = G.Sneak.hasPass(canton); MC.daily(); out.passNew = G.Sneak.hasPass(canton);
      // ── ② 해적: 20일 안에는 없음 → 뒤에 광주에서
      s.macao.dealDay = s.day; at(s, 1555, 1, 1, 174); out.pirEarly = MC.pending();
      s.day += 21; seaWin = false; await go([]);
      const sp = specs[0];
      out.pir = { id: sp && sp.id, back: sp && sp.backCity, center: sp && G.Geo.isSea(sp.center.lon, sp.center.lat, 0.02), allies: sp && sp.allies.length, label: sp && sp.fightLabel, v: s.macao.pirates };
      seaWin = true; specs.length = 0; await go([]); out.pir2 = { again: specs.length === 1, v: s.macao.pirates };
      // ── ③ 1557 전에는 기다리라 · 1557 뒤
      await go([]); out.wait = { said: said.some(x => /정사년\(1557\)이 되면/.test(x)), grant: !!s.macao.grant, quiet: MC.pending() };
      at(s, 1557, 3, 1, 174); await go([]);
      out.grant = { v: s.macao.grant, rent: said.some(x => /은 오백 냥/.test(x)), toast: said.some(x => /오문\(아마항\)으로/.test(x)), settle: !!s.macao.settle };
      // ── ④ 오문 — 포르투갈 제독은 작위
      const realm = G.COURT.realms.PT, rk0 = G.Court.rank(realm);
      at(s, 1557, 4, 1, 173); out.macaoExists = G.R.cityExists(G.CITY_DATA[173]); await go([]);
      out.settle = { v: s.macao.settle, name: said.some(x => /아-마-가오… 마카오/.test(x)), rank: G.Court.rank(realm) - rk0, title: s.macao.title, done: MC.pending() };
      // ── 다른 나라 제독: 오문에서 곧바로 땅을 빌리고 첫 집 · 몫
      s = fresh('ES'); s.macao = { told: {}, met: 1, deal: 'talk', dealDay: 0, pirates: 'won' }; G.R.addItem('macao_chop');
      at(s, 1557, 5, 1, 173); const g1 = s.player.gold; await go([]);
      out.es = { grant: s.macao.grant, settle: s.macao.settle, title: s.macao.title, gold: s.player.gold - g1 };
      // ── 소식
      s = fresh('PT'); s.loc = { mode: 'sea', lon: 114, lat: 22 };
      const day = (y, m, d) => { s.date = { y, m, d }; return MC.daily().map(x => x.text).join(' | '); };
      out.news = { xavier: day(1552, 12, 3), sousa: day(1554, 10, 1), gate: day(1573, 1, 1), ricci: day(1582, 8, 7) };
      s = fresh('PT'); s.date = { y: 1700, m: 1, d: 1 }; delete s.macao; out.oldSave = MC.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'macao');
      out.journal = !!(MC.daily && MC.daily._journal);
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.early, '① 1553.6 전에는 광주 앞바다에서 아무 일 없다');
    ok(!r.fail.deal && r.fail.cool && !r.fail.again && r.fail.line, '① 설득에 실패하면 「번인의 말을 어찌 믿겠느냐」 — 30일 동안 다시 열리지 않는다');
    ok(r.deal.v === 'gift' && r.deal.gold === 3000 && r.deal.chop && r.deal.noSell && r.deal.pass && r.deal.tax && r.deal.entry, '① 선물(3,000닢)이면 약조 — 「짐의 절반에 2할」 · 허가첩(팔 수 없다) · 광주 성문이 열린다');
    ok(!r.passOld && r.passNew, '허가첩이 있으면 광주 통행 허가를 날마다 다시 써 준다');
    ok(!r.pirEarly && r.pir.id === 'macao_pirates' && r.pir.back === 174 && r.pir.center && r.pir.allies === 2 && /약조를 지키겠소/.test(r.pir.label) && r.pir.v === 'lost', '② 약조 20일 뒤 광주 — 향산 앞바다(물 위) 해적 해전 · 레오넬과 광동 수군이 우리 편 · 끝나면 광주로');
    ok(r.pir2.again && r.pir2.v === 'won', '② 졌으면 다시 청할 수 있다');
    ok(r.wait.said && !r.wait.grant && !r.wait.quiet, '③ 1557 전에는 「정사년이 되면」 — 한 번만 말한다');
    ok(r.grant.v === 1 && r.grant.rent && r.grant.toast && !r.grant.settle, '③ 1557 — 아마항 반도에 집을 짓고 살아도 좋다(지대 은 오백 냥) · 오문으로');
    ok(r.macaoExists && r.settle.v === 1 && r.settle.name && r.settle.rank === 1 && r.settle.title && r.settle.title !== 'share' && !r.settle.done, '④ 오문의 첫 집들 — 「아마가오… 마카오」 · 포르투갈 제독은 작위 한 칸 · 끝');
    ok(r.es.grant === 1 && r.es.settle === 1 && r.es.title === 'share' && r.es.gold === 3000, '다른 나라 제독은 오문에서 곧바로 — 작위 대신 몫 금화 3,000');
    const n = r.news;
    ok(/상천도/.test(n.xavier) && /왕백/.test(n.sousa) && /관갑/.test(n.gate) && /마테오 리치/.test(n.ricci), '소식 — 상천도의 사비에르 · 소자의 약조 · 관갑 · 마테오 리치');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장 · 소문 · 일지');
    await page.reload();
    await page.waitForFunction(() => window.G && G.Game && G.Macao && G.World && G.Rel, null, { timeout: 120000 });
    const w = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, out = {}; let lines = [];
      UI.say = async (t) => { lines.push(String(t)); }; UI.alert = async () => {}; UI.toast = () => {}; UI.ask = async (t, opts) => opts[0].value; UI.confirm = async () => true;
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      const wait = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return true; await new Promise(r => setTimeout(r, 200)); } return false; };
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1554, m: 3, d: 1 }; s.player.born = { y: 1524, m: 1, d: 1 }; delete s.life; s.player.gold = 20000;
      const c = G.CITY_DATA[174]; s.loc = { mode: 'sea', lon: c.dock[1], lat: c.dock[0], heading: 0 };
      G.Game.go('sea', {}); await wait(() => G.Game.sceneName === 'sea', 20000);
      await G.Scenes.sea.enterPort(c);
      out.city = await wait(() => G.Game.sceneName === 'city' && s.loc.city === 174, 30000);
      out.deal = s.macao && s.macao.deal; out.sousa = lines.some(x => /레오넬 드 소자요/.test(x));
      return out;
    });
    console.log(JSON.stringify(w));
    ok(w.city && w.deal === 'gift' && w.sousa, '진짜 입항 — 광주로 다가가면 레오넬 드 소자와 해도부사의 담판 → 허가첩으로 광주 성문을 지난다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
