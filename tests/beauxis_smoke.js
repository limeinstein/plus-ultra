/* 미남 항해사 — 인도양·신대륙 (2026-11-05 사용자 요청) — node tests/beauxis_smoke.js   (BROWSER_EXE=크롬 경로)
   · 사이드: 말린디 등 네 항구 · 물음 둘(계절풍·카말) · 포르투갈 선장(매수/말/육상전 — 져도 바다로 빠져나온다) · 『이로움의 책』
   · 와이나: 파나마의 포로(매수/말/지나침) → 툼베스(재회/해변) · 과라 물음 · 과라 판자 · 1532.3 이후 닫힘(잉카 정복과 겹치지 않게)
   · 연애 없음(wed: 'sea' — 부하끼리 썸 대상에서 빠진다) · eventOnly · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.BeauxIS && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, BX = G.BeauxIS, said = [], asked = [], out = {};
      let plan = [], landRes = [], luck = false;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => luck;
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; const p = BX.pending(); if (p) await BX.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const b = () => G.Game.state.beauxIS;
      const D1 = G.MATE.bx_said, D2 = G.MATE.bx_wayna;
      out.defs = { e: !!(D1.eventOnly && D2.eventOnly), wed: D1.wed === 'sea' && D2.wed === 'sea', g: D1.g + D2.g, style: D1.style + D2.style, wage: D1.wage + D2.wage, nav: D1.sk.nav, hand: /얼굴/.test(D1.desc) && /이목구비/.test(D2.desc) };
      // ── 사이드 A: 두 물음 다 맞힘 → 매수
      let s = fresh(1500, 1, 1);
      out.gateS = { early: (at(s, 1498, 3, 31, 108), BX.pending()), malindi: (at(s, 1500, 5, 1, 108), BX.pending()), mombasa: (at(s, 1500, 5, 1, 107), BX.pending()), muscat: (at(s, 1500, 5, 1, 125), BX.pending()), calicut: (at(s, 1500, 5, 1, 152), BX.pending()), late: (at(s, 1521, 1, 1, 108), BX.pending()), lisbon: (at(s, 1500, 5, 1, 1), BX.pending()) };
      at(s, 1500, 5, 1, 108); const g0 = s.player.gold; await go(['sw', 'polaris', 'bribe']);
      out.SA = { said: b().said, quiz: b().quiz, way: b().saidWay, hired: hired('bx_said'), book: G.R.hasItem('bx_fawaid'), paid: g0 - s.player.gold, grand: said.some(x => /이븐 마지드의 손자/.test(x)), guilt: said.some(x => /끝까지 아니라 하셨소/.test(x)), sea: said.some(x => /바다와 혼인한 사람/.test(x)), women: said.some(x => /그물 깁던 아낙들/.test(x)), again: BX.pending() };
      s.loc = { mode: 'sea', lon: 50, lat: 10 }; s.beauxIS.told = {};
      const day = (y, m, d) => { s.date = { y, m, d }; return BX.daily().map(x => x.text).join(' | '); };
      out.newsS = day(1577, 1, 2);
      // ── 사이드 B: 둘 다 틀림 → 60일 뒤 다시 → 하나 맞힘 → 말 실패 → 육상전 짐 → 그래도 합류
      s = fresh(1505, 1, 1); at(s, 1505, 2, 1, 152); await go(['ne', 'sun']);
      out.SB1 = { said: b().said, hired: hired('bx_said'), cool: (s.day += 30, BX.pending()) };
      s.day += 31; out.SB1.open = BX.pending();
      luck = false; await go(['sw', 'moon', 'talk'], ['lose']);
      out.SB2 = { said: b().said, quiz: b().quiz, way: b().saidWay, hired: hired('bx_said'), fight: said.some(x => /\[육상전\] 포르투갈 선원들 14/.test(x)), jump: said.some(x => /바다로 뛰어들었다/.test(x)), again: said.some(x => /또 왔구려/.test(x)) };
      // ── 사이드 C: 말 성공
      s = fresh(1510, 1, 1); luck = true; at(s, 1510, 3, 1, 125); await go(['sw', 'polaris', 'talk']); luck = false;
      out.SC = { way: b().saidWay, hired: hired('bx_said'), fights: said.filter(x => /\[육상전\]/.test(x)).length, soco: said.some(x => /소코트라/.test(x)) };
      // ── 와이나 A: 파나마에서 매수 → 툼베스 재회 → 과라 맞힘
      s = fresh(1526, 1, 1);
      out.gateW = { panamaEarly: (at(s, 1526, 5, 31, 210), BX.pending()), tumbesOpen: (at(s, 1526, 2, 1, 220), BX.pending()), late: (at(s, 1532, 4, 1, 220), BX.pending()), panamaLate: (at(s, 1532, 1, 1, 210), BX.pending()) };
      at(s, 1527, 1, 1, 210); const g1 = s.player.gold; await go(['bribe']);
      out.WA1 = { wayna: b().wayna, paid: g1 - s.player.gold, hired: hired('bx_wayna'), raft: said.some(x => /발사나무/.test(x)), wind: said.some(x => /바람을 거슬러 가는 배/.test(x)), panamaAgain: BX.pending() };
      at(s, 1527, 3, 1, 220); const f0 = (s.player.fame || {}).ex || 0; await go(['guara']);
      out.WA2 = { wayna: b().wayna, hired: hired('bx_wayna'), guara: G.R.hasItem('bx_guara'), quiz: b().waynaQuiz, reunion: said.some(x => /쿠라카/.test(x) && /데려온 이가/.test(x)), horizon: said.some(x => /수평선 너머/.test(x)), loyal: (s.mates.find(m => m.id === 'bx_wayna') || {}).loyal, again: BX.pending() };
      s.loc = { mode: 'sea', lon: -80, lat: -3 }; s.beauxIS.told = {}; out.newsW = day(1526, 11, 2);
      // ── 와이나 B: 파나마 지나침 → 툼베스 해변 · 과라 틀림
      s = fresh(1528, 1, 1); at(s, 1528, 2, 1, 210); await go(['pass']);
      const passed = b().wayna;
      at(s, 1528, 4, 1, 220); await go(['swim']);
      out.WB = { passed, wayna: b().wayna, hired: hired('bx_wayna'), fled: said.some(x => /이로 끊었지/.test(x)) && said.some(x => /그냥 지나간 사람/.test(x)), wrong: said.some(x => /이것도 몰랐소/.test(x)), loyal: (s.mates.find(m => m.id === 'bx_wayna') || {}).loyal };
      // ── 와이나 C: 파나마를 거치지 않고 툼베스 · 피사로 동업자의 한마디
      s = fresh(1526, 1, 1); at(s, 1526, 2, 1, 220); await go(['guara']); out.WC = { hired: hired('bx_wayna'), first: said.some(x => /처음 보는 얼굴/.test(x)) };
      s = fresh(1527, 1, 1); s.incaFall = { side: 'partner' }; at(s, 1527, 1, 1, 210); await go(['pass']); out.WD = said.some(x => /예쁜 앵무새/.test(x));
      // ── 연애 없음: 부하끼리의 썸에서 빠진다 (같은 조건의 다른 남자 부하는 엮인다)
      const fem = G.MATES.find(d => d.g === 'f' && !d.minor && !d.wed && !d.sib && d.id !== 'cinderella') || G.MATE.cinderella;
      const ctl = G.MATES.filter(d => d.g === 'm' && !d.minor && !d.wed && !d.sib && !/^bx_/.test(d.id) && !G.Romance.unfit(d.id, fem.id)).sort((a, c) => G.Romance.chem(c.id, fem.id) - G.Romance.chem(a.id, fem.id))[0];
      const roman = (ids) => { const s2 = fresh(1540, 1, 1); s2.mates = []; ids.forEach(id => s2.mates.push({ id, role: 'none', loyal: 90, joined: 15300101 })); delete s2.romance; luck = true; for (let i = 0; i < 400; i++) { s2.day++; G.Romance.daily(); } luck = false; return Object.keys(G.Romance.st().pairs); };
      out.rom = { bx: roman(['bx_said', 'bx_wayna', fem.id]), ctl: ctl ? roman([ctl.id, fem.id]) : ['?'], fem: fem.id, ctlId: ctl && ctl.id, chemBx: G.Romance.chem('bx_said', fem.id), chemCtl: ctl && G.Romance.chem(ctl.id, fem.id) };
      // ── 옛 저장 · 소문 · 일지 · 말투
      s = fresh(1600, 1, 1); delete s.beauxIS; out.oldSave = BX.daily().length;
      const ER = G.EventRumor; const rumAt = (y, c) => { s.date = { y, m: 6, d: 1 }; return ER && ER.at ? ER.at(G.CITY_DATA[c]).map(x => x.id) : []; };
      s = fresh(1500, 1, 1); out.rumor = { list: !!(G.EVENT_RUMORS || []).find(x => x.id === 'beauxis_said') && !!(G.EVENT_RUMORS || []).find(x => x.id === 'beauxis_wayna'), malindi: rumAt(1505, 108).indexOf('beauxis_said') >= 0, tumbes: rumAt(1528, 220).indexOf('beauxis_wayna') >= 0, lisbon: rumAt(1505, 1).indexOf('beauxis_said') < 0 };
      out.journal = !!(BX.daily && BX.daily._journal);
      out.voice = !!(G.VOICES && G.VOICES.bx_said && G.VOICES.bx_wayna && !G.VOICES.bx_said.love && !G.VOICES.bx_wayna.wife);
      return out;
    });
    console.log(JSON.stringify({ SA: r.SA, SB1: r.SB1, SB2: r.SB2, WA2: r.WA2, WB: r.WB, rom: r.rom, rumor: r.rumor }));
    ok(r.defs.e && r.defs.wed && r.defs.g === 'mm' && r.defs.style === 'isan' && r.defs.wage === 0 && r.defs.nav === 3 && r.defs.hand, '두 미남 — 사건으로만(eventOnly) · 바다와 혼인(wed: sea) · 남자 · 품삯 0 · 사이드 항해 3 · 잘생긴 얼굴 설명');
    const gs = r.gateS;
    ok(!gs.early && gs.malindi && gs.mombasa && gs.muscat && gs.calicut && !gs.late && !gs.lisbon, '사이드 — 1498.4~1520 · 말린디·몸바사·무스카트·캘리컷에서만');
    ok(r.SA.said === 'joined' && r.SA.quiz === 2 && r.SA.way === 'bribe' && r.SA.hired && r.SA.book && r.SA.paid === 600 && r.SA.grand && r.SA.guilt && r.SA.sea && r.SA.women && !r.SA.again, '사이드 ① 물음 둘 다 맞힘 → ② 포르투갈 선장을 금화 600으로 → 합류 · 『이로움의 책』 · 「바다와 혼인한 사람」');
    ok(/예멘의 번개/.test(r.newsS) && /술을 입에 대지 않으셨소/.test(r.newsS), '소식 — 예멘의 연대기(1577) · 손자가 배에 있으면 한마디');
    ok(r.SB1.said === 'quizFail' && !r.SB1.hired && r.SB1.cool === false && r.SB1.open === true, '물음을 다 틀리면 — 60일 뒤 다시');
    ok(r.SB2.said === 'joined' && r.SB2.quiz === 1 && r.SB2.way === 'talk' && r.SB2.hired && r.SB2.fight && r.SB2.jump && r.SB2.again, '다시 와서 하나 맞힘 → 말이 안 통해 육상전(14) → 져도 사이드가 바다로 빠져나와 합류');
    ok(r.SC.way === 'talk' && r.SC.hired && r.SC.fights === 0 && r.SC.soco, '말로 설득 — 「소코트라 앞에서 배 두 척을 잃었지」');
    const gw = r.gateW;
    ok(!gw.panamaEarly && gw.tumbesOpen && !gw.late && !gw.panamaLate, '와이나 — 파나마 1526.6~1531 · 툼베스 1526~1532.3 (카하마르카 전)');
    ok(r.WA1.wayna === 'freed' && r.WA1.paid === 600 && !r.WA1.hired && r.WA1.raft && r.WA1.wind && !r.WA1.panamaAgain, '와이나 ① 파나마 — 루이스의 배에 묶인 사공을 금화로 풀어 준다');
    ok(r.WA2.wayna === 'joined' && r.WA2.hired && r.WA2.guara && r.WA2.quiz === 'guara' && r.WA2.reunion && r.WA2.horizon && r.WA2.loyal === 90 && !r.WA2.again && /루이스/.test(r.newsW) && /고향으로 돌아갔다/.test(r.newsW), '와이나 ② 툼베스 재회 · 과라 물음 · 「수평선 너머」 → 합류 · 과라 판자 · 루이스의 뗏목 소식');
    ok(r.WB.passed === 'passed' && r.WB.wayna === 'joined' && r.WB.hired && r.WB.fled && r.WB.wrong && r.WB.loyal === 82 && r.WC.hired && r.WC.first && r.WD, '지나쳐도 — 스스로 달아난 와이나를 툼베스에서 · 파나마를 안 거쳐도 · 피사로 동업자의 한마디');
    ok(!r.rom.bx.some(k => /bx_/.test(k)) && r.rom.ctl.length > 0, '연애 없음 — 사이드·와이나는 부하끼리의 썸에서 빠진다 (같은 조건의 다른 남자 부하는 엮인다: ' + r.rom.ctlId + ')');
    ok(r.oldSave === 0 && r.rumor.list && r.rumor.malindi && r.rumor.tumbes && r.rumor.lisbon && r.journal && r.voice, '옛 저장 · 소문(말린디·툼베스) · 일지 · 말투 (love/wife 없음)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
