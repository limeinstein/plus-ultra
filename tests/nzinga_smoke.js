/* 은징가 여왕의 저항 (2026-10-28 사용자 요청) — node tests/nzinga_smoke.js   (BROWSER_EXE=크롬 경로)
   · 인물 6명 · 장면은 루안다에서만, 날짜에 맞게 열린다
   · 벗의 길: ① 「조공은 정복당한 나라가 바치는 것」 → ② 총 60자루를 거저 준다(실은 총 −60) → ③ 마탐바의 킬롬보 — 벗의 맹세(전투 도끼) →
     ④ 콤비 연합군(육상전 90) → ⑤ 사의 함대에서 사절을 빼낸다 → ⑥ 캄부의 몸값을 금화로(묵주) → 소식이 제독의 선택을 따라 달라지고, 죽음 소식에 「바다 건너의 벗」
   · 총이 없으면 팔 수도 줄 수도 없다 · 일러바치면 금화·악명, 마탐바의 부름은 오지 않는다 · 사람을 사고판 제독에게는 맹세가 없다 · 웅변이 몸값을 깎는다
   · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Nzinga && G.Hist && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, NZ = G.Nzinga, said = [], asked = [], out = {};
      let plan = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : null; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      const fights = [];
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { fights.push({ name, n, kind: o && o.kind }); return 'win'; };
      const fresh = (nation) => {
        G.State.newGame({ name: '시험', nation: nation || 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1620, m: 1, d: 1 }; delete s.nzinga; s.fleet.crew = 120; s.player.gold = 20000; return s;
      };
      const at = (s, y, m, d, city) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: city == null ? 100 : city }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = NZ.pending(); if (p) await NZ.check(); return p; };
      out.figs = G.NZINGA_FIGS.length; out.figNames = G.NZINGA_FIGS.every(id => G.HIST_FIG[id] && G.Hist.speaker(id).name === G.HIST_FIG[id].name);
      // 날짜·도시
      let s = fresh();
      const gate = (y, m, d, c, st) => { at(s, y, m, d, c); s.nzinga = Object.assign({ trust: 0, told: {} }, st || {}); return NZ.pending(); };
      out.gates = {
        emb: gate(1621, 12, 1), embSaoTome: gate(1621, 12, 1, 99), embLate: gate(1622, 7, 1),
        guns: gate(1625, 3, 1, 100, { emb: 'quiet' }), court: gate(1635, 1, 1, 100, { emb: 'quiet', guns: 'no' }), courtBetray: gate(1635, 1, 1, 100, { emb: 'quiet', guns: 'betray' }),
        kombi: gate(1647, 9, 15, 100, { court: 'no', guns: 'no' }), kombiEarly: gate(1647, 8, 1, 100, { court: 'no', guns: 'no' }),
        sa: gate(1648, 8, 10, 100, { kombi: 'leave' }), saLate: gate(1648, 8, 25, 100, { kombi: 'leave' }),
        ransom: gate(1656, 3, 1, 100, { sa: 'wait', kombi: 'leave' }), ransomLate: gate(1656, 10, 12, 100, { sa: 'wait', kombi: 'leave' })
      };
      out.owner1645 = (s.date = { y: 1645, m: 1, d: 1 }, G.R.cityOwner(G.CITY_DATA[100]));
      // ── 벗의 길
      s = fresh('NL');
      s.fleet.cargo.guns = { q: 80 };
      at(s, 1621, 12, 1); await go(['nz']);
      out.emb = { v: s.nzinga.emb, trust: s.nzinga.trust, chair: said.some(x => /그 등에 앉아/.test(x)), tribute: said.some(x => /^은징가: 조공은 싸움에 져서 정복당한 나라가 바치는 것/.test(x)) };
      at(s, 1625, 3, 1); let g0 = s.player.gold; await go(['gift']);
      out.guns = { opts: asked[0] && asked[0].opts, v: s.nzinga.guns, left: s.fleet.cargo.guns && s.fleet.cargo.guns.q, gold: s.player.gold - g0, trust: s.nzinga.trust, kifunji: said.some(x => /^키푼지: /.test(x)) };
      s.date = { y: 1626, m: 7, d: 15 }; out.kindonga = NZ.daily().map(x => x.text).join(' | ');
      at(s, 1635, 2, 1); await go(['go', 'oath']);
      out.court = { v: s.nzinga.court, axe: G.R.hasItem('njinga_axe'), king: said.some(x => /나는 여왕이 아니다\. 왕이다/.test(x)), remember: said.some(x => /킨동가의 섬에서 그대의 총이/.test(x)), trust: s.nzinga.trust };
      at(s, 1647, 9, 20); g0 = s.player.gold; fights.length = 0; await go(['ally']);
      out.kombi = { v: s.nzinga.kombi, res: s.nzinga.kombiRes, n: fights[0] && fights[0].n, gold: s.player.gold - g0, nl: said.some(x => /^네덜란드 서인도 회사 사령관: 조국의 배로군/.test(x)) };
      at(s, 1648, 8, 10); await go(['evac']);
      out.sa = { v: s.nzinga.sa, trust: s.nzinga.trust };
      at(s, 1656, 3, 1); g0 = s.player.gold; await go(['paid']);
      out.ransom = { v: s.nzinga.ransom, cost: g0 - s.player.gold, rosary: G.R.hasItem('kambu_rosary'), gaeta: said.some(x => /^안토니우 다 가에타 신부: /.test(x)), trust: s.nzinga.trust };
      s.loc = { mode: 'sea', lon: 10, lat: -9 };
      s.date = { y: 1648, m: 8, d: 24 }; out.retake = NZ.daily().map(x => x.text).join(' | ');
      s.date = { y: 1656, m: 10, d: 12 }; out.peace = NZ.daily().map(x => x.text).join(' | ');
      s.date = { y: 1663, m: 12, d: 17 }; out.death = NZ.daily().map(x => x.text).join(' | ');
      out.logs = s.log.map(x => x.t).filter(t => /은징가|키푼지|캄부|콤비/.test(t)).length;
      // ── 총이 없으면
      s = fresh('PT'); at(s, 1625, 3, 1); s.nzinga = { trust: 0, told: {}, emb: 'quiet' }; await go(['no']);
      out.noGuns = asked[0] && asked[0].opts;
      // ── 일러바친다
      s = fresh('PT'); s.fleet.cargo.guns = { q: 80 }; at(s, 1625, 3, 1); s.nzinga = { trust: 0, told: {}, emb: 'pt' }; g0 = s.player.gold; const nt0 = s.player.notoriety || 0;
      await go(['betray']);
      out.betray = { v: s.nzinga.guns, gold: s.player.gold - g0, noto: (s.player.notoriety || 0) - nt0, trust: s.nzinga.trust, gunsKept: s.fleet.cargo.guns.q };
      s.date = { y: 1626, m: 7, d: 15 }; out.betrayNews = NZ.daily().map(x => x.text).join(' | ');
      at(s, 1635, 2, 1); out.betrayCourt = NZ.pending();
      s.date = { y: 1663, m: 12, d: 17 }; s.nzinga.told = { baptism: 1, crown: 1, kindonga: 1, matamba: 1, dutch: 1, ngoleme: 1, kavanga: 1, kifunji: 1, kombi: 1, retake: 1, peace: 1 };
      out.betrayDeath = NZ.daily().map(x => x.text).join(' | ');
      // ── 사람을 사고판 제독
      s = fresh('PT'); s.slaver = { bought: 20, sold: 0, first: 1 }; at(s, 1635, 2, 1); s.nzinga = { trust: 0, told: {}, emb: 'quiet', guns: 'no' }; await go(['go', 'trade']);
      out.slaver = { opts: asked[1] && asked[1].opts, cold: said.some(x => /사슬에 묶어 가는 배와 나는 벗이 될 수 없다/.test(x)), v: s.nzinga.court };
      // ── 웅변이 몸값을 깎는다
      const sk0 = G.R.skill; G.R.skill = (id) => id === 'speech' ? 2 : sk0(id);
      out.ransomSpeech = NZ.ransomCost(); G.R.skill = sk0; out.ransomBase = NZ.ransomCost();
      // ── 옛 저장(1650)
      s = fresh('PT'); s.date = { y: 1650, m: 1, d: 1 }; delete s.nzinga; out.oldSave = NZ.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'nzinga');
      out.journal = !!(NZ.daily && NZ.daily._journal);
      return out;
    });
    console.log(JSON.stringify({ kombi: r.kombi, ransom: r.ransom, betray: r.betray }));
    ok(r.figs === 6 && r.figNames, '인물 6명 (은징가·키푼지·캄부·총독 둘·가에타 신부)');
    const g = r.gates;
    ok(g.emb && !g.embSaoTome && !g.embLate && g.guns && g.court && !g.courtBetray && g.kombi && !g.kombiEarly && g.sa && !g.saLate && g.ransom && !g.ransomLate && r.owner1645 === '네덜란드',
      '장면은 루안다에서 날짜에 맞게 열린다 (1645년 루안다는 네덜란드령) ' + JSON.stringify(g));
    ok(r.emb.v === 'nz' && r.emb.trust === 1 && r.emb.chair && r.emb.tribute, '① 앉을 자리 없는 방 — 시녀의 등에 앉은 은징가 · 「조공은 정복당한 나라가」 편에 선다');
    ok(r.guns.opts.join() === 'sell,gift,no,betray' && r.guns.v === 'gift' && r.guns.left === 20 && r.guns.gold === 0 && r.guns.trust === 3 && r.guns.kifunji, '② 키푼지에게 총 60자루를 거저 준다 (친분 +2)');
    ok(/제독이 실어다 준 총이었다/.test(r.kindonga), '킨동가 섬 소식이 제독의 총을 기억한다');
    ok(r.court.v === 'oath' && r.court.axe && r.court.king && r.court.remember && r.court.trust === 4, '③ 마탐바의 킬롬보 — 「여왕이 아니라 왕」 · 벗의 맹세 · 은징가의 전투 도끼');
    ok(r.kombi.v === 'ally' && r.kombi.res === 'win' && r.kombi.n === 90 && r.kombi.gold === 4000 && r.kombi.nl, '④ 콤비 연합군 — 육상전 90 · 몫 4,000 · 네덜란드 제독이면 「조국의 배」');
    ok(r.sa.v === 'evac' && r.ransom.v === 'paid' && r.ransom.cost === 6000 && r.ransom.rosary && r.ransom.gaeta && r.ransom.trust === 7, '⑤ 사절을 빼내고 ⑥ 캄부의 몸값을 금화 6,000으로 — 캄부의 묵주');
    ok(/제독이 태워 보낸 사절들은 무사히/.test(r.retake) && /제독의 금화/.test(r.peace) && /바다 건너의 벗/.test(r.death) && r.logs >= 7, '소식이 제독의 선택을 따라간다 — 루안다 탈환 · 강화 · 죽음 (일지 ' + r.logs + '줄)');
    ok(r.noGuns.join() === 'no,betray', '총이 없으면 팔 수도 줄 수도 없다');
    ok(r.betray.v === 'betray' && r.betray.gold === 2500 && r.betray.noto === 3 && r.betray.trust === -3 && r.betray.gunsKept === 80 && /섬으로 가던 총은 강가에서 붙잡혔다/.test(r.betrayNews) && !r.betrayCourt && !/벗/.test(r.betrayDeath),
      '일러바치면 금화 2,500 · 악명 +3 · 마탐바의 부름은 오지 않고, 죽음 소식에 벗 이야기가 없다');
    ok(r.slaver.cold && r.slaver.opts.join() === 'trade' && r.slaver.v === 'trade', '사람을 사고판 제독에게 은징가는 장사만 한다 (맹세 없음)');
    ok(r.ransomBase === 6000 && r.ransomSpeech === 4200, '웅변 2단계면 몸값 6,000 → 4,200');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장(1650)에 지난 소식이 몰려 뜨지 않는다 · 소문 · 일지에 남는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
