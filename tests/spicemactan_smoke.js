/* 향료제도와 막탄 (2026-11-07 사용자 요청) — node tests/spicemactan_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 동쪽으로 가는 배(1511.9~11.19 말라카) · ② 반다의 육두구·거북섬·히투의 코라코라(1512.1.20~6.30 암보이나) · ③ 정향의 섬(테르나테) · ④ 벗의 편지(코친·리스본·세빌리아)
   · ⑤ 정향 향기의 상복(1521.3~4.20 테르나테 · 3.20~ 브루나이) → ⑥ 막탄(4.27, 날이 지나간다) → ⑦ 세부의 잔치(5.1) → 나이라·불란·엔리케
   · 동료: 보키 나이라(여자 어른 · 연애 됨) · 불란(wed:'sea') — eventOnly · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.SpiceMactan && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, SM = G.SpiceMactan, said = [], asked = [], out = {};
      let plan = [], landRes = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value), dis: opts.filter(o => o.dis).map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => false;
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; s.fleet.food = 40; s.fleet.water = 40; s.fleet.cargo = {}; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; const p = SM.pending(); if (p) await SM.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const mrow = (id) => G.Game.state.mates.find(m => m.id === id);
      const has = (id) => G.R.hasItem(id);
      const b = () => SM.state();
      const sea = (s, y, m, d) => { s.loc = { mode: 'sea', lon: 125, lat: 5 }; s.date = { y, m, d }; };
      const saidAny = (re) => said.some(x => re.test(x));
      const N = G.MATE.sm_naira, B = G.MATE.sm_bulan;
      out.defs = { n: !!N && N.eventOnly && N.g === 'f' && !N.wed && !N.minor && N.wage === 0 && !!N.face && /눈썹/.test(N.desc), bu: !!B && B.eventOnly && B.g === 'm' && B.wed === 'sea' && /문신/.test(B.desc) && !!B.face,
        tavern: G.Frontier && G.Frontier.mateReady ? [G.Frontier.mateReady(N, 1521), G.Frontier.mateReady(B, 1521)] : null, enY: G.MATE.h_enrique && G.MATE.h_enrique.y[1] };
      // ── 문
      let s = fresh(1511, 9, 1);
      out.gate = { abreuEarly: (at(s, 1511, 8, 31, 160), SM.pending()), abreuOn: (at(s, 1511, 10, 1, 160), SM.pending()), goaPending: !!(G.GoaMal && G.GoaMal.pending()), abreuLate: (at(s, 1511, 11, 20, 160), SM.pending()),
        bandaEarly: (at(s, 1512, 1, 19, 172), SM.pending()), bandaOn: (at(s, 1512, 1, 20, 172), SM.pending()), bandaLate: (at(s, 1512, 7, 1, 172), SM.pending()),
        ternEarly: (at(s, 1512, 6, 30, 171), SM.pending()), ternAll: (at(s, 1512, 7, 1, 171), SM.pending()), ternLate: (at(s, 1516, 1, 1, 171), SM.pending()),
        cebuT: (at(s, 1521, 3, 1, 171), SM.pending()), cebuBEarly: (at(s, 1521, 3, 19, 170), SM.pending()), cebuB: (at(s, 1521, 3, 20, 170), SM.pending()), cebuLate: (at(s, 1521, 4, 21, 171), SM.pending()) };
      // ── ① 말라카 — 마가야네스와 함께 싸웠던 사람
      s = fresh(1511, 10, 1); s.goaMal = { told: {}, side: 'pt', mal: 'leave', flor: 'no', met: 1 }; at(s, 1511, 10, 1, 160);
      const goaP = G.GoaMal ? G.GoaMal.pending() : false;
      await go(['go']);
      out.A1 = { goaP, abreu: b().abreu, mag: saidAny(/말라카의 다리에서 함께였던 분/), write: saidAny(/정향을 보면 편지하게|편지를 쓰다 손이 닳겠지/), again: SM.pending() };
      // ── ② 반다 · 구한다 · 테르나테 편 (이긴다)
      at(s, 1512, 2, 10, 172); const g0 = s.player.gold;
      await go(['buy', 'save', 'ternate'], ['win', 'win']);
      const nk = G.BALANCE.spicemactan.nutmeg, np = Math.max(1, Math.round(G.GOOD.nutmeg.p * nk.k));
      out.B1 = { nut: b().nutmeg, q: s.fleet.cargo.nutmeg && s.fleet.cargo.nutmeg.q, paid: g0 - s.player.gold, expect: b().nutmeg * np, cast: b().castaway, hitu: b().hitu, bond: b().bond,
        abreu: saidAny(/약조대로 왔구려/), mace: saidAny(/메이스/), naira: saidAny(/보키 나이라|「보키」라고 불러 주세요/), brows: saidAny(/숯처럼 검고 긴 눈썹/), fights: said.filter(x => /\[육상전\]/.test(x)), again: SM.pending() };
      sea(s, 1512, 2, 21); out.newsBanda = SM.daily().map(x => x.text).join(' | ');
      // ── ③ 테르나테 — 정향 · 편지
      at(s, 1512, 5, 1, 171); const c0 = s.player.gold;
      await go(['buy', 'carry']);
      out.C1 = { tern: b().tern, clove: b().clove, cq: s.fleet.cargo.clove && s.fleet.cargo.clove.q, paid: c0 - s.player.gold, item: has('sm_clove'), letter: b().letter, li: has('sm_letter'), noSell: !!G.ITEM.sm_letter.noSell, bond: b().bond,
        saved: saidAny(/거북섬의 은인/), honest: saidAny(/솔직한 선장님/), richer: saidAny(/바스쿠 다 가마가 찾은 것보다 더 크고 더 부유한/), kids: saidAny(/아이가 태어나면 정향나무/), again: SM.pending() };
      sea(s, 1512, 7, 2); out.newsTern = SM.daily().map(x => x.text).join(' | ');
      // ── ④ 리스본 1515 — 편지를 전한다
      at(s, 1513, 3, 1, 7); out.D0 = { sevEarly: SM.pending() };
      at(s, 1515, 3, 1, 0); const l0 = s.player.gold;
      await go([]);
      out.D1 = { letter: b().letter, at: b().letterAt, gold: s.player.gold - l0, li: has('sm_letter'), castile: saidAny(/카스티야의 길로라도/), lame: saidAny(/아자모르/), again: SM.pending() };
      sea(s, 1517, 10, 21); out.newsSev = SM.daily().map(x => x.text).join(' | ');
      // ── ⑤ 테르나테 1521 — 나이라와 세부 → 마가야네스와 상륙(이긴다) → 엔리케를 태운다 → 나이라
      at(s, 1521, 3, 10, 171);
      await go(['go', 'mag', 'ship', 'yes'], ['win']);
      const nr = mrow('sm_naira');
      out.E1 = { cebu: b().cebu, from: b().cebuFrom, date: s.date.m + '.' + s.date.d, mactan: b().mactan, res: b().mactanRes, naira: b().naira, hired: hired('sm_naira'), loyal: nr && nr.loyal, en: b().enrique, enHired: hired('h_enrique'), enY: G.MATE.h_enrique.y[1],
        bulan: hired('sm_bulan'), last: saidAny(/섬의 왕들을 너무 믿지 말라/), fall: saidAny(/얼굴을 물에 묻고 쓰러졌다/), piga: saidAny(/꼭 적겠소/), joao: saidAny(/나를 두고 가지 마라/), barbosa: saidAny(/너는 여전히 노예다/), round: saidAny(/세상을 처음으로 한 바퀴 돈 사람/), halfway: saidAny(/길이 이제 절반 남았소/), stay: saidAny(/이번엔 제가 선장님 배에 남을게요/), again: SM.pending(),
        fights: said.filter(x => /\[육상전\]/.test(x)) };
      b().told = {}; sea(s, 1521, 5, 2); const nx = SM.daily().map(x => x.text).join(' | ');
      out.newsCebu = { bap: /카를로스/.test(nx), mac: /4월 27일/.test(nx) && /건진 남만 선장/.test(nx), feast: /주앙 세랑/.test(nx) && /남만 배를 타고 서쪽/.test(nx), serrao: /독이 들었다/.test(nx), tidore: /티도레/.test(nx) && !/트리니다드/.test(nx) };
      sea(s, 1521, 11, 9); out.newsTidore = SM.daily().map(x => x.text).join(' | ');
      // ── ⑤ 테르나테(처음 보는 사람) — 라푸라푸 편(이긴다) → 불란 · 나이라는 남는다 · 엔리케는 혼자
      s = fresh(1521, 4, 1); at(s, 1521, 4, 1, 171);
      await go(['go', 'lapu', 'free', 'yes', 'no'], ['win']);
      out.E2 = { mactan: b().mactan, res: b().mactanRes, bulan: b().bulan, bHired: hired('sm_bulan'), spear: has('sm_spear'), naira: b().naira, nHired: hired('sm_naira'), en: b().enrique, enHired: hired('h_enrique'), enY: G.MATE.h_enrique.y[1],
        stranger: saidAny(/낯선 배를 보고/), gold: saidAny(/금으로 박은 앞니/), sea: saidAny(/바다에 장가들었소/), fight: saidAny(/\[육상전\] 카스티야의 상륙 부대 22/), respect: saidAny(/그것이 존중이오/) };
      // ── ⑤ 브루나이 — 라푸라푸를 만나 말로 막아 본다 → 불란 · 나이라는 없다
      s = fresh(1521, 3, 25); at(s, 1521, 3, 25, 170);
      await go(['go', 'talk', 'ship', 'yes']);
      out.E3 = { from: b().cebuFrom, mactan: b().mactan, bulan: b().bulan, bHired: hired('sm_bulan'), naira: b().naira || null, nHired: hired('sm_naira'), en: b().enrique, junk: saidAny(/정크선/), late: saidAny(/말은 늦었다/), noLetter: !saidAny(/마지막 편지예요/) };
      // ── 라푸라푸 편에서 지면 불란은 오지 않는다 · 가지 않으면 끝
      s = fresh(1521, 3, 25); at(s, 1521, 3, 25, 170); await go(['go', 'lapu', 'free'], ['lose']);
      out.E4 = { bulan: b().bulan, bHired: hired('sm_bulan') };
      s = fresh(1521, 3, 25); at(s, 1521, 3, 10, 171); await go(['no']);
      out.E5 = { cebu: b().cebu, nHired: hired('sm_naira'), again: (at(s, 1521, 4, 1, 171), SM.pending()) };
      // ── ② 지켜보고 티도레를 권한다 · 편지를 맡기지 않는다 · ③ 늦게 온 사람
      s = fresh(1512, 1, 1); at(s, 1512, 3, 1, 172); await go(['no', 'watch', 'tidore']);
      out.B2 = { cast: b().castaway, hitu: b().hitu, bond: b().bond || 0, trick: saidAny(/해적선은 세랑의 것이 되었다/), cold: saidAny(/솔직한 쪽으로 해 주세요/), fights: said.filter(x => /\[육상전\]/.test(x)).length, nut: b().nutmeg };
      s = fresh(1512, 1, 1); at(s, 1512, 8, 1, 171); await go(['no', 'no']);
      out.C2 = { hitu: b().hitu, tern: b().tern, letter: b().letter, li: has('sm_letter'), stranger: saidAny(/처음 보네요/), banda: (at(s, 1512, 6, 1, 172), SM.pending()), lisbon: (at(s, 1514, 1, 1, 0), SM.pending()) };
      // 편지를 늦게 들고 가면 열리지 않는다 · 세빌리아에서는 1517.10.20부터
      s = fresh(1512, 1, 1); b().letter = 'carry'; G.R.addItem('sm_letter');
      out.D2 = { lisLate: (at(s, 1517, 11, 1, 0), SM.pending()), sev: (at(s, 1517, 11, 1, 7), SM.pending()), sevLate: (at(s, 1519, 8, 10, 7), SM.pending()), cochin: (at(s, 1512, 10, 1, 154), SM.pending()) };
      // ── 소식 · 옛 저장
      s = fresh(1522, 1, 1); delete s.spiceMactan; out.oldSave = { n: SM.daily().length, told: Object.keys(G.Game.state.spiceMactan.told).length };
      // ── 소문 · 일지 · 말투
      const rum = (G.EVENT_RUMORS || []).find(x => x.id === 'spicemactan');
      s = fresh(1511, 10, 1); const r1 = rum ? rum.text(s) : []; s.date = { y: 1521, m: 4, d: 1 }; const r2 = rum ? rum.text(s) : [];
      out.rumor = { has: !!rum, abreu: r1.some(x => /동쪽으로 간대요/.test(x.y) && x.o), cebu: r2.some(x => /수그부/.test(x.y)) };
      out.journal = !!(SM.daily && SM.daily._journal);
      const VN = G.VOICES.sm_naira, VB = G.VOICES.sm_bulan;
      out.voice = { n: !!VN && VN.reg === 'yo' && VN.stories.length >= 4 && VN.love && VN.love.a50.length >= 3 && VN.love.a80.length >= 3, b: !!VB && VB.reg === 'hao' && VB.stories.length >= 4 && !VB.love && !VB.wife };
      out.voiceLen = [VN, VB].every(v => [].concat(v.greet.hi, v.greet.mid, v.greet.low, v.chat.hi, v.chat.mid, v.chat.low, v.again, v.drink, [v.drinkDone], v.lifeIntro, v.love ? v.love.a50.concat(v.love.a80) : []).every(x => x.length <= 140) && v.stories.every(st => st.l.length >= 3 && st.l.length <= 6));
      s = fresh(1522, 1, 1); s.mates.push({ id: 'sm_naira', role: 'none', loyal: 90 });
      out.greet = !!(G.Voice && G.Voice.greet(G.MATE.sm_naira, s.mates[s.mates.length - 1]));
      return out;
    });
    console.log(JSON.stringify({ defs: r.defs, gate: r.gate, A1: r.A1, B1: r.B1, C1: r.C1, D1: r.D1, E1: r.E1, E2: r.E2, E3: r.E3, B2: r.B2, C2: r.C2, D2: r.D2, oldSave: r.oldSave }));
    ok(r.defs.n && r.defs.bu && (!r.defs.tavern || r.defs.tavern.every(x => !x)) && r.defs.enY === 1521, '동료 둘 — 사건으로만(술집에 안 나옴) · 나이라: 여자 어른·연애 됨 · 불란: 바다와 혼인(wed sea) · 얼굴 경로 · 엔리케는 그대로 1521');
    const g = r.gate;
    ok(!g.abreuEarly && g.abreuOn && !g.goaPending && !g.abreuLate && !g.bandaEarly && g.bandaOn && !g.bandaLate && !g.ternEarly && g.ternAll && !g.ternLate && g.cebuT && !g.cebuBEarly && g.cebuB && !g.cebuLate, '문 — 말라카 1511.9~11.19 · 암보이나 1512.1.20~6.30 · 테르나테 ~1515 · 1521 테르나테 3.1~ / 브루나이 3.20~ (4.20까지)');
    ok(!r.A1.goaP && r.A1.abreu === 'go' && r.A1.mag && r.A1.write && r.A1.again === false, '① 동쪽으로 가는 배 — 말라카의 다리를 기억하는 마가야네스 · 세랑의 작별 · 약조');
    ok(r.B1.nut > 0 && r.B1.q === r.B1.nut && r.B1.paid === r.B1.expect && r.B1.cast === 'saved' && r.B1.hitu === 'ternate' && r.B1.bond === 1 && r.B1.abreu && r.B1.mace && r.B1.naira && r.B1.brows && r.B1.fights.length === 2 && /거북섬의 해적 12/.test(r.B1.fights[0]) && /티도레 사람들 14/.test(r.B1.fights[1]) && r.B1.again === false && /그대의 배도 있었다/.test(r.newsBanda), '② 반다의 육두구(시세의 35%) · 거북섬의 해적 12 · 히투의 티도레 사람들 14 · 보키 나이라 · 소식');
    ok(r.C1.tern === 'done' && r.C1.clove > 0 && r.C1.cq === r.C1.clove && r.C1.item && r.C1.letter === 'carry' && r.C1.li && r.C1.noSell && r.C1.bond === 2 && r.C1.saved && r.C1.honest && r.C1.richer && r.C1.kids && r.C1.again === false && /티도레의 코라코라를 물리친/.test(r.newsTern), '③ 정향의 섬 — 술탄 바얀 시룰라 · 거북섬의 은인 · 정향나무 숲 · 정향 · 「더 크고 더 부유한 새 세상」 편지(팔 수 없음)');
    ok(!r.D0.sevEarly && r.D1.letter === 'given' && r.D1.at === 0 && r.D1.gold === G_LETTER(r) && !r.D1.li && r.D1.castile && r.D1.lame && r.D1.again === false && /그대가 건넨 것/.test(r.newsSev), '④ 리스본 1515 — 마가야네스가 편지를 읽는다 · 「카스티야의 길로라도」 · 답례 · 1517 세빌리아 소식');
    ok(r.E1.cebu === 'go' && r.E1.from === 171 && r.E1.date === '5.15' && r.E1.mactan === 'mag' && r.E1.res === 'win' && /막탄의 전사들 40/.test(r.E1.fights[0]) && r.E1.naira === 'joined' && r.E1.hired && r.E1.loyal === 90 && r.E1.en === 'joined' && r.E1.enHired && r.E1.enY >= 1560 && !r.E1.bulan &&
       r.E1.last && r.E1.fall && r.E1.piga && r.E1.joao && r.E1.barbosa && r.E1.round && r.E1.halfway && r.E1.stay && r.E1.again === false, '⑤⑥⑦ 테르나테에서 나이라와 세부로 — 4.27 막탄(마가야네스는 쓰러진다) · 5.1 잔치(주앙 세랑) · 엔리케 동료(1521에 사라지지 않음) · 나이라 동료(정 깊으면 충성 90)');
    ok(r.newsCebu.bap && r.newsCebu.mac && r.newsCebu.feast && r.newsCebu.serrao && /트리니다드호와 빅토리아호/.test(r.newsTidore), '소식 — 세랑의 죽음 · 세부의 세례 · 막탄(건진 선장) · 세부의 잔치(엔리케가 서쪽으로) · 티도레의 두 척');
    ok(r.E2.mactan === 'lapu' && r.E2.res === 'win' && r.E2.bulan === 'joined' && r.E2.bHired && r.E2.spear && r.E2.naira === 'stay' && !r.E2.nHired && r.E2.en === 'free' && !r.E2.enHired && r.E2.enY === 1521 && r.E2.stranger && r.E2.gold && r.E2.sea && r.E2.fight && r.E2.respect, '⑥ 라푸라푸 편(카스티야의 상륙 부대 22) → 불란 동료 · 대나무 창 · 나이라를 남게 하면 남는다 · 엔리케를 보내면 1521 그대로');
    ok(r.E3.from === 170 && r.E3.mactan === 'talk' && r.E3.bulan === 'joined' && r.E3.bHired && !r.E3.naira && !r.E3.nHired && r.E3.en === 'joined' && r.E3.junk && r.E3.late && r.E3.noLetter && r.E4.bulan === 'wounded' && !r.E4.bHired && r.E5.cebu === 'no' && !r.E5.nHired && r.E5.again === false, '브루나이의 정크로 · 라푸라푸를 만나면 불란 · 지면 오지 않는다 · 가지 않으면 끝');
    ok(r.B2.cast === 'watch' && r.B2.hitu === 'tidore' && r.B2.bond === 0 && r.B2.trick && r.B2.cold && r.B2.fights === 0 && r.B2.nut === 0 && r.C2.hitu === 'late' && r.C2.tern === 'done' && r.C2.letter === 'no' && !r.C2.li && r.C2.stranger && r.C2.banda === false && r.C2.lisbon === false, '② 지켜보면 세랑이 꾀로 해적선을 빼앗는다 · 티도레를 권해도 테르나테로 · ③ 늦게 온 사람 · 편지를 맡기지 않으면 끝');
    ok(r.D2.lisLate === false && r.D2.sev && r.D2.sevLate === false && r.D2.cochin, '④ 편지 — 코친 ~1512 · 리스본 ~1517.10.19 · 세빌리아 1517.10.20~1519.8.9');
    ok(r.oldSave.n === 0 && r.oldSave.told === 8, '옛 저장은 지난 소식을 띄우지 않는다');
    ok(r.rumor.has && r.rumor.abreu && r.rumor.cebu && r.journal, '소문(아브레우의 출항·수그부의 흰 배) · 일지');
    ok(r.voice.n && r.voice.b && r.voiceLen && r.greet, '말투 — 나이라(해요체·옛이야기·연정 말) · 불란(하오체·연정 말 없음) · 한 줄 140자 이하 · 첫마디');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
function G_LETTER() { return 800; }
