/* 미녀와 야수 (2026-11-01) — 장미 · 보르네오의 뭍 · 짐승 가면의 사내 · 강가의 짐승 떼 · 두 동료
   node tests/beautybeast_smoke.js */
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
      const BB = G.Beauty, out = {}, said = [], battles = [];
      let pick = 'help', fightRes = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { const o = opts.find(x => x.value === pick) || opts[0]; return o.value; };
      G.UI.toast = () => {};
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { battles.push({ name, n, beasts, o }); return fightRes; };
      // 보르네오 한가운데의 뭍 한 점
      let pt = null;
      for (let lat = 1.0; lat < 4 && !pt; lat += 0.25) for (let lon = 113; lon < 117 && !pt; lon += 0.25) { const t = G.Geo.terrain(lon, lat); if (t && t !== 'sea') pt = [lon, lat]; }
      out.pt = pt;
      function fresh(y, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; });
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y, m: 3, d: 1 }; s.fleet.cargo = {}; s.player.items = [];
        const p = (o && o.at) || pt; s.loc = { mode: 'land', lon: p[0], lat: p[1], party: 30 };
        if (o && o.item) G.R.addItem(o.item);
        if (o && o.good) s.fleet.cargo[o.good] = { q: 5, cost: 40, from: 0, d: 0, lots: { 0: { q: 5, cost: 40 } } };
        said.length = 0; battles.length = 0; return s;
      }
      const has = id => G.Game.state.mates.some(m => m.id === id);
      const L = G.MATE.landon, A = G.MATE.amy;
      out.data = { l: L.sk, a: A.sk, lname: L.name, aname: A.name, g: L.g + A.g, ev: L.eventOnly && A.eventOnly, lstr: L.st[0], item: !!G.ITEM.beast_mask };
      G.BALANCE.beauty.chance = 0;   // 운에 맡기지 않고 sure일째에
      // 장미가 없으면 없다 · 1570년 전 · 보르네오 밖
      let s = fresh(1575); out.noRose = await BB.onLand(pt[0], pt[1]);
      s = fresh(1565, { item: 'rose' }); out.early = await BB.onLand(pt[0], pt[1]);
      s = fresh(1575, { item: 'rose', at: [101.5, 0.5] }); out.sumatra = await BB.onLand(101.5, 0.5);
      // 장미 소지품(야음의 장미) — 셋째 날 반드시 · 돕는다 · 이긴다
      s = fresh(1575, { item: 'rose' }); out.rose = BB.rose();
      const d1 = await BB.onLand(pt[0], pt[1]), d2 = await BB.onLand(pt[0], pt[1]), d3 = await BB.onLand(pt[0], pt[1]);
      out.days = [d1, d2, d3];
      out.win = { landon: has('landon'), amy: has('amy'), mask: s.player.items.some(x => x.id === 'beast_mask'), how: s.beauty.how, b: battles[0] && { name: battles[0].name, beasts: battles[0].beasts, kind: battles[0].o.kind, kinds: battles[0].o.beast.join(), flee: battles[0].o.flee },
        sniff: said.some(t => t.startsWith('짐승 가면의 사내|') && /장미요/.test(t)), name: said.some(t => t.startsWith('랜던 아이작|') && /랜던 아이작/.test(t)), amy: said.some(t => t.startsWith('에이미 벨라지오|') && /따라다닌 거예요/.test(t)),
        bastard: said.some(t => /왕비는 아니었소/.test(t)), notYet: said.some(t => /배는 넓으니까요/.test(t)), again: BB.ready(),
        sk: { sci: G.R.skillBest('sci').lv, ops: G.R.skillBest('ops').lv, acct: G.R.skillBest('acct').lv, hist: G.R.skillBest('hist').lv, theo: G.R.skillBest('theo').lv } };
      // 장미수(교역품)도 장미 · 물러서면 / 지면 한동안 없다
      s = fresh(1600, { good: 'p_rosewater' }); out.rosewater = BB.rose(); pick = 'no'; s.beauty = { walk: 9 }; await BB.onLand(pt[0], pt[1]);
      out.decl = { how: s.beauty.how, cool: s.beauty.cool > s.day, ready: BB.ready(), any: has('landon') };
      s = fresh(1600, { good: 'p_rosewater' }); pick = 'help'; fightRes = 'lose'; s.beauty = { walk: 9 }; await BB.onLand(pt[0], pt[1]);
      out.lost = { how: s.beauty.how, cool: s.beauty.cool > s.day, any: has('amy'), carried: said.some(t => /업고 밀림 속으로/.test(t)) };
      s.day += 50; out.back = BB.ready();
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(!!r.pt, '보르네오 뭍의 시험 지점');
    ok(JSON.stringify(r.data.l) === JSON.stringify({ sci: 3, ops: 3 }) && JSON.stringify(r.data.a) === JSON.stringify({ acct: 3, hist: 3, theo: 3 }) && r.data.lname === '랜던 아이작' && r.data.aname === '에이미 벨라지오' && r.data.g === 'mf' && r.data.ev && r.data.lstr >= 90 && r.data.item, '랜던 아이작 과학·운용술 3(체력 92) · 에이미 벨라지오 회계·역사학·신학 3 · 사건으로만');
    ok(r.noRose === false && r.early === false && r.sumatra === false, '장미가 없거나 · 1570년 전이거나 · 보르네오 밖이면 없다');
    ok(r.rose === '야음의 장미' && r.days[0] === false && r.days[1] === false && r.days[2] === true, '장미 소지품을 지니고 걸으면 — 운이 나빠도 셋째 날에는 만난다');
    ok(r.win.sniff && r.win.b && r.win.b.beasts === true && r.win.b.kind === 'beast' && /boar/.test(r.win.b.kinds) && r.win.b.flee === false, '짐승 가면의 사내가 장미 냄새를 맡고 도움을 청한다 → 강가의 짐승 떼(멧돼지·말레이곰)');
    ok(r.win.landon && r.win.amy && r.win.mask && r.win.how === 'won' && r.win.name && r.win.amy && r.win.bastard && r.win.notYet && !r.win.again, '구하면 두 사람이 동료로 — 몰락한 왕가의 사생아 · 꽃집 아가씨 · 아직은 티격태격');
    ok(r.win.sk.sci === 3 && r.win.sk.ops === 3 && r.win.sk.acct === 3 && r.win.sk.hist === 3 && r.win.sk.theo === 3, '배의 솜씨: 과학·운용술·회계·역사학·신학 3');
    ok(r.rosewater === '장미수' && r.decl.how === 'declined' && r.decl.cool && !r.decl.ready && !r.decl.any, '장미수(교역품)도 장미 · 믿지 못해 물러서면 한동안 없다');
    ok(r.lost.how === 'lost' && r.lost.cool && !r.lost.any && r.lost.carried && r.back, '지면 사내가 그녀를 업고 사라진다 — 45일 뒤 다시');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
