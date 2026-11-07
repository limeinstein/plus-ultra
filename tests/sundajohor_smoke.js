/* 순다클라파와 자야카르타 · 조호르 술탄국의 성립 (2026-11-07 사용자 요청) — node tests/sundajohor_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 돌기둥의 약속(1522~1527.4 반탐) — 라트나 · ② 6월 22일 순다클라파(1527.5.1~6.21 → 6.22) — 파타힐라 편/순다 편/라트나만/떠남
   · ③ 늦게 온 함대(1527.6.23~1528.3.31 반탐) · ④ 빈탄이 불타던 해(1526.11~1527.9 말라카 — 1511년의 편: 왕실 / 포르투갈 / 없음)
   · ⑤ 조호르 강의 북소리(1528.5.1~12.14 말라카) — 쿠말라 · 둘 다 eventOnly · 여자 어른(연애 됨) · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.SundaJohor && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, SJ = G.SundaJohor, said = [], asked = [], out = {};
      let plan = [], landRes = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value), dis: opts.filter(o => o.dis).map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => false;
      const PD = G.Game.passDays; G.Game.passDays = function (n) { const st = G.Game.state, g = st.player.gold; const res = PD.apply(this, arguments); st.player.gold = g; return res; };   // 지나가는 날의 월급은 셈에서 뺀다
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d, mal) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; s.fleet.food = 200;
        if (mal) s.goaMal = { told: { calicut: 1, goa1: 1, lost: 1, escape: 1, goa2: 1, sati: 1, mal: 1, flor: 1, spice: 1, death: 1 }, mal };
        return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; const p = SJ.pending(); if (p) await SJ.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const has = (id) => G.R.hasItem(id);
      const b = () => SJ.state();
      const sea = (s, y, m, d) => { s.loc = { mode: 'sea', lon: 105, lat: -4 }; s.date = { y, m, d }; };
      const said1 = (re) => said.some(x => re.test(x));
      const trust = () => G.Sponsor.rel('pt_king').trust;
      const IDS = ['sj_ratna', 'sj_kumala'];
      out.mates = IDS.map(id => { const m = G.MATE[id]; return !!m && m.eventOnly && !m.wed && m.g === 'f' && !m.minor && m.wage === 0 && !!m.desc && !!m.face; });
      out.inPool = (G.MATES || []).filter(m => IDS.includes(m.id)).length;
      out.tavern = G.Frontier && G.Frontier.mateReady ? IDS.map(id => G.Frontier.mateReady(G.MATE[id], 1528)) : null;
      // ── 문
      let s = fresh(1521, 6, 1);
      out.gate = {
        padEarly: (at(s, 1521, 12, 31, 168), SJ.pending()), padOn: (at(s, 1522, 3, 1, 168), SJ.pending()), padMal: (at(s, 1522, 3, 1, 160), SJ.pending()),
        skOn: (b().pad = 'no', at(s, 1527, 5, 1, 168), SJ.pending()), skOff: (at(s, 1527, 6, 22, 168), SJ.pending()),
        fleetOn: (b().sk = 'leave', at(s, 1527, 7, 1, 168), SJ.pending()), fleetOff: (at(s, 1528, 4, 1, 168), SJ.pending()),
        binEarly: (at(s, 1526, 10, 31, 160), SJ.pending()), binOn: (at(s, 1526, 11, 1, 160), SJ.pending()), binOff: (at(s, 1527, 10, 1, 160), SJ.pending()),
        johorEarly: (at(s, 1528, 4, 30, 160), SJ.pending()), johorOn: (at(s, 1528, 5, 1, 160), SJ.pending()), johorOff: (at(s, 1528, 12, 15, 160), SJ.pending())
      };
      // ── ① 약속 → ② 라트나만 빼낸다(매수) → 동료 · 탁본 · 6.22까지
      s = fresh(1523, 3, 1); at(s, 1523, 3, 1, 168); await go(['promise']);
      out.P1 = { pad: b().pad, jasmine: said1(/재스민 한 송이를 뽑아/), treaty: said1(/파드랑/), again: (at(s, 1523, 4, 1, 168), SJ.pending()) };
      const g0 = s.player.gold; at(s, 1527, 5, 10, 168); await go(['ratna', 'bribe']);
      out.S1 = { sk: b().sk, way: b().skWay, ratna: b().ratna, hired: hired('sj_ratna'), padrao: has('sj_padrao'), date: s.date.m + '.' + s.date.d, paid: g0 - s.player.gold >= G.BALANCE.sundajohor.bribe,
        letter: said1(/꽃은 시들었나요/), saint: said1(/칼이 아니라 이름을 바꾸러/), wilted: said1(/다 말랐는데 아직 향이 나요/), loyal: (s.mates.find(m => m.id === 'sj_ratna') || {}).loyal };
      b().told = {}; sea(s, 1527, 6, 23); out.newsJaya = SJ.daily().map(x => x.text).join(' | ');
      // ── ③ 늦게 온 함대 — 라트나가 배에 있으면 한마디 · 알린다
      at(s, 1527, 11, 1, 168); await go(['warn']);
      out.F1 = { fleet: b().fleet, coelho: said1(/두아르트 코엘류요/), ratna: said1(/다섯 해나 늦었어요/), ratna2: said1(/죽을 만큼 잘못한 건 아니니까요/) };
      b().told = {}; sea(s, 1527, 11, 21); out.newsSa = SJ.daily().map(x => x.text).join(' | ');
      // ── ② 파타힐라 편 — 이긴다 · 약속했으면 몸값으로 풀어 준 라트나가 동료(충성 낮음)
      s = fresh(1527, 5, 1); b().pad = 'promise'; const g1 = s.player.gold; const t0 = trust(); at(s, 1527, 5, 1, 168); await go(['fatah', 'ransom'], ['win']);
      out.S2 = { sk: b().sk, res: b().skRes, ratna: b().ratna, hired: hired('sj_ratna'), loyal: (s.mates.find(m => m.id === 'sj_ratna') || {}).loyal, gold: s.player.gold - g1, expect: G.BALANCE.sundajohor.share.fatah - G.BALANCE.sundajohor.ransom,
        fight: said1(/\[육상전\] 순다클라파의 수비대 32/), other: said1(/다른 쪽 배로요/), forgive: said1(/용서한 건 아니에요/), jaya: said1(/자야카르타 — 「완전한 승리」/) };
      // ③ 파타힐라와 함께 상륙대를 친다 → 신뢰 −
      at(s, 1527, 8, 1, 168); await go(['ambush'], ['win']);
      out.F2 = { fleet: b().fleet, fight: said1(/\[육상전\] 두아르트 코엘류의 상륙대 20/), trust: trust() - t0, fatah: said1(/다섯 해 늦었소/) };
      // ── ② 파타힐라 편 · 약속하지 않았으면 풀어 준 뒤 제 길로 / 두고 가면 포로
      s = fresh(1527, 5, 1); at(s, 1527, 5, 1, 168); await go(['fatah', 'ransom'], ['win']);
      out.S3 = { ratna: b().ratna, hired: hired('sj_ratna'), bye: said1(/다시는 만나지 말아요/), noLetter: !said1(/꽃은 시들었나요/) };
      s = fresh(1527, 5, 1); at(s, 1527, 5, 1, 168); await go(['fatah', 'leave'], ['win']);
      out.S4 = { ratna: b().ratna, hired: hired('sj_ratna') };
      // ── ② 순다 편 — 이기면 · 약속도 웅변도 없으면 식구와 함께 산으로 / 웅변이면 동료
      s = fresh(1527, 5, 1); at(s, 1527, 5, 1, 168); await go(['sunda'], ['win']);
      out.S5 = { ratna: b().ratna, hired: hired('sj_ratna'), fight: said1(/\[육상전\] 파타힐라의 데막 군 40/), inland: said1(/파쿠안의 왕도로 가요/), half: said1(/반나절로 식구들이 살겠소/) };
      s = fresh(1527, 5, 1); s.player.sk.speech = 2; at(s, 1527, 5, 1, 168); await go(['sunda'], ['win']);
      out.S6 = { ratna: b().ratna, hired: hired('sj_ratna'), eyes: said1(/눈이 거짓말을 안 해서예요/) };
      s = fresh(1527, 5, 1); at(s, 1527, 5, 1, 168); await go(['sunda'], ['lose']);
      out.S7 = { ratna: b().ratna, hired: hired('sj_ratna'), res: b().skRes };
      s = fresh(1527, 5, 1); at(s, 1527, 5, 1, 168); await go(['leave']);
      out.S8 = { sk: b().sk, date: s.date.m + '.' + s.date.d };
      // ── ④ 1511년 왕실 편 — 알아본다 → 캄파르까지(이긴다) → ⑤ 호위(이긴다) → 쿠말라
      s = fresh(1526, 11, 1, 'sultan'); at(s, 1526, 11, 5, 160); await go(['carry'], ['win']);
      out.B1 = { bin: b().bin, res: b().binRes, link: b().link, know: said1(/소매를 놓지 않던 여덟 살 아이/), fight: said1(/\[육상전\] 말라카 요새의 순찰 갤리선 16/), mahmud: said1(/나는 이 사람의 아버지를 죽였소/), fatimah: said1(/바다가 두 번 우리를 버리지 않았네요/), again: (at(s, 1527, 1, 1, 160), SJ.pending()) };
      s.mates.push({ id: 'sj_ratna', role: 'none', loyal: 80 });
      const g2 = s.player.gold, t2 = trust(); at(s, 1528, 6, 1, 160); await go(['escort', 'yes'], ['win']);
      out.J1 = { johor: b().johor, kum: b().kum, hired: hired('sj_kumala'), loyal: (s.mates.find(m => m.id === 'sj_kumala') || {}).loyal, nobat: has('sj_nobat'), noSell: !!G.ITEM.sj_nobat.noSell, gold: s.player.gold - g2, trust: trust() - t2,
        drums: said1(/열일곱 해 만의 즉위 북소리/), sleeve: said1(/그 밤에 놓지 않았던 소매요/), ratna: said1(/장부와 북은 남아요/), again: (at(s, 1528, 7, 1, 160), SJ.pending()) };
      b().told = {}; sea(s, 1528, 12, 16); out.newsJohor = SJ.daily().map(x => x.text).join(' | ');
      // ── ④ 1511년 포르투갈 편 — 크리스를 반쯤 뽑는다 · 약값 → ⑤ 인연이 있으니 바로
      s = fresh(1526, 11, 1, 'pt'); at(s, 1526, 12, 1, 160); await go(['aid']);
      out.B2 = { bin: b().bin, link: b().link, bridge: said1(/다리 위에서/), half: said1(/크리스의 물결 모양 날이 반쯤/), paid: 30000 - s.player.gold };
      at(s, 1528, 6, 1, 160); await go(['escort', 'no'], ['lose']);
      out.J2 = { johor: b().johor, res: b().johorRes, kum: b().kum, hired: hired('sj_kumala'), nobat: has('sj_nobat'), prahu: said1(/작은 배를 놓쳤다/), noCheck: !said1(/포르투갈의 깃발 아래\.$/) };
      // ── ⑤ 포르투갈 편 · ④ 없이 — 웅변이 없으면 돌아선다 / 웅변이면 믿는다
      s = fresh(1528, 5, 1, 'pt'); at(s, 1528, 5, 1, 160); await go(['escort']);
      out.J3 = { johor: b().johor, hired: hired('sj_kumala'), refused: said1(/솔직하셔서 고마워요/) };
      s = fresh(1528, 5, 1, 'pt'); s.player.sk.speech = 2; at(s, 1528, 5, 1, 160); await go(['escort', 'yes'], ['win']);
      out.J4 = { johor: b().johor, hired: hired('sj_kumala'), believe: said1(/이분 눈을 보세요/), loyal: (s.mates.find(m => m.id === 'sj_kumala') || {}).loyal };
      // ── ④ 알린다 → ⑤ 닫힌다 · 인연 없이(1511년 없음) 바로 ⑤
      s = fresh(1526, 11, 1); const t4 = trust(); at(s, 1527, 2, 1, 160); await go(['tell']);
      out.B3 = { bin: b().bin, link: b().link, stranger: said1(/포르투갈 배가 아닌 건 돛을 보고 알았어요/), knife: said1(/노란 비단 끈 하나/), johor: (at(s, 1528, 6, 1, 160), SJ.pending()) };
      s = fresh(1528, 5, 1); at(s, 1528, 9, 1, 160); await go(['escort', 'yes'], ['win']);
      out.J5 = { johor: b().johor, hired: hired('sj_kumala'), first: said1(/포르투갈 배가 아닌 큰 배를 찾았어요/), loyal: (s.mates.find(m => m.id === 'sj_kumala') || {}).loyal };
      // ── 소식 · 옛 저장
      s = fresh(1522, 8, 1); b(); sea(s, 1526, 12, 31); out.newsAll = SJ.daily().map(x => x.text);
      sea(s, 1528, 4, 16); out.newsAll = out.newsAll.concat(SJ.daily().map(x => x.text));
      s = fresh(1529, 1, 1); delete s.sundaJohor; out.oldSave = { n: SJ.daily().length, told: Object.keys(G.Game.state.sundaJohor.told).length };
      // ── 소문 · 일지 · 연애 · 말투
      const rum = (G.EVENT_RUMORS || []).find(x => x.id === 'sundajohor');
      s = fresh(1527, 3, 1); const rr = rum ? rum.text(s) : []; s.date = { y: 1527, m: 3, d: 1 }; s.date = { y: 1526, m: 12, d: 1 }; const rr2 = rum ? rum.text(s) : []; s.date = { y: 1528, m: 6, d: 1 }; const rr3 = rum ? rum.text(s) : [];
      out.rumor = { has: !!rum, pillar: rr.some(x => /돌기둥/.test(x.y) && x.o), fatah: rr.some(x => /파타힐라/.test(x.y)), maid: rr2.some(x => /시녀/.test(x.y)), drums: rr3.some(x => /조호르 강/.test(x.y)) };
      out.journal = !!(SJ.daily && SJ.daily._journal);
      out.love = IDS.every(id => !G.MATE[id].wed && G.VOICES[id] && G.VOICES[id].love && G.VOICES[id].love.a50.length >= 3 && G.VOICES[id].love.a80.length >= 3);
      out.voice = IDS.map(id => { const v = G.VOICES && G.VOICES[id]; return !!v && v.stories.length >= 4 && v.stories.length <= 6 && v.stories.every(st => st.l.length >= 3 && st.l.length <= 6); });
      out.voiceLen = IDS.every(id => { const v = G.VOICES[id]; const L = [].concat(v.greet.hi, v.greet.mid, v.greet.low, v.chat.hi, v.chat.mid, v.chat.low, v.again, v.drink, [v.drinkDone], v.lifeIntro, v.love.a50, v.love.a80); return L.every(x => x.length <= 140); });
      s = fresh(1528, 1, 1); s.mates.push({ id: 'sj_kumala', role: 'none', loyal: 90 }); const m = s.mates[s.mates.length - 1];
      out.greet = !!(G.Voice && G.Voice.greet(G.MATE.sj_kumala, m));
      return out;
    });
    console.log(JSON.stringify({ gate: r.gate, S1: r.S1, S2: r.S2, F2: r.F2, B1: r.B1, J1: r.J1, J2: r.J2, J4: r.J4, J5: r.J5, oldSave: r.oldSave }));
    ok(r.mates.every(Boolean) && r.inPool === 2 && (!r.tavern || r.tavern.every(x => !x)), '동료 둘 — 사건으로만(eventOnly · 술집에 안 나옴) · 여자 어른 · 월급 0 · wed 없음(연애 됨) · 얼굴 경로');
    const g = r.gate;
    ok(!g.padEarly && g.padOn && !g.padMal && g.skOn && !g.skOff && g.fleetOn && !g.fleetOff && !g.binEarly && g.binOn && !g.binOff && !g.johorEarly && g.johorOn && !g.johorOff, '문 — 약속 1522~ 반탐 · 순다클라파 1527.5.1~6.21 · 늦은 함대 ~1528.3 · 빈탄 1526.11~1527.9 말라카 · 조호르 1528.5.1~12.14');
    ok(r.P1.pad === 'promise' && r.P1.jasmine && r.P1.treaty && r.P1.again === false, '① 돌기둥의 약속 — 라트나 · 파드랑 · 재스민');
    ok(r.S1.sk === 'ratna' && r.S1.way === 'bribe' && r.S1.ratna === 'joined' && r.S1.hired && r.S1.padrao && r.S1.date === '6.22' && r.S1.paid && r.S1.letter && r.S1.saint && r.S1.wilted && r.S1.loyal === 88 && /자야카르타/.test(r.newsJaya) && /이방인의 배를 타고 사라졌다/.test(r.newsJaya), '② 약속했으면 야자잎 편지 · 6.22까지 날이 지나간다 · 척후 매수 → 라트나 동료(충성 88) · 파드랑의 탁본 · 소식');
    ok(r.F1.fleet === 'warn' && r.F1.coelho && r.F1.ratna && r.F1.ratna2 && /닻을 끊고 달아났다/.test(r.newsSa), '③ 늦게 온 함대 — 코엘류에게 알린다 · 라트나의 한마디 · 소식');
    ok(r.S2.sk === 'fatah' && r.S2.res === 'win' && r.S2.ratna === 'joined' && r.S2.hired && r.S2.loyal === 60 && r.S2.gold === r.S2.expect && r.S2.fight && r.S2.other && r.S2.forgive && r.S2.jaya, '② 파타힐라 편(수비대 32) — 몫 · 약속했으면 몸값으로 풀어 준 라트나가 동료(충성 60 「용서한 건 아니에요」)');
    ok(r.F2.fleet === 'ambush' && r.F2.fight && r.F2.trust < 0 && r.F2.fatah, '③ 파타힐라와 상륙대를 친다(20) → 포르투갈 왕실의 신뢰 −');
    ok(r.S3.ratna === 'freed' && !r.S3.hired && r.S3.bye && r.S3.noLetter && r.S4.ratna === 'captive' && !r.S4.hired, '② 약속 없이 풀어 주면 제 길로 · 두고 가면 포로');
    ok(r.S5.ratna === 'inland' && !r.S5.hired && r.S5.fight && r.S5.inland && r.S5.half && r.S6.ratna === 'joined' && r.S6.hired && r.S6.eyes && r.S7.ratna === 'inland' && !r.S7.hired && r.S7.res === 'lose' && r.S8.sk === 'leave' && r.S8.date === '5.1', '② 순다 편(데막 40) — 약속·웅변이 없으면 산으로 · 웅변이면 동료 · 지면 산으로 · 떠나면 날이 지나가지 않는다');
    ok(r.B1.bin === 'carry' && r.B1.res === 'win' && r.B1.link === 'sultan' && r.B1.know && r.B1.fight && r.B1.mahmud && r.B1.fatimah && r.B1.again === false, '④ 1511년 왕실을 태웠으면 「소매를 놓지 않던 아이」 · 순찰 갤리선 16 · 캄파르의 마흐무드 샤와 툰 파티마');
    ok(r.J1.johor === 'escort' && r.J1.kum === 'joined' && r.J1.hired && r.J1.loyal === 90 && r.J1.nobat && r.J1.noSell && r.J1.gold === 2500 && r.J1.trust < 0 && r.J1.drums && r.J1.sleeve && r.J1.ratna && r.J1.again === false && /북을 실은 배를 이방인 선장이 지켰다/.test(r.newsJohor), '⑤ 조호르 강의 북소리 — 갤리선 24 · 사례 · 노바트의 북채(팔 수 없음) · 쿠말라 동료(충성 90) · 라트나와 쿠말라 · 소식');
    ok(r.B2.link === 'pt' && r.B2.bin === 'aid' && r.B2.bridge && r.B2.half && r.B2.paid === 800 && r.J2.johor === 'escort' && r.J2.res === 'lose' && r.J2.kum === 'stay' && !r.J2.hired && r.J2.nobat && r.J2.prahu, '④ 포르투갈 편이었으면 크리스를 반쯤 뽑는다 · 약값 → ⑤ 바로 · 져도 프라후가 북을 빼낸다 · 남겨 두면 끝');
    ok(r.J3.johor === 'refused' && !r.J3.hired && r.J3.refused && r.J4.johor === 'escort' && r.J4.hired && r.J4.believe && r.J4.loyal === 80, '⑤ 포르투갈 편 · 인연 없음 — 웅변이 없으면 항 나딤이 돌아선다 · 웅변이면 쿠말라가 믿는다');
    ok(r.B3.bin === 'tell' && r.B3.link === 'none' && r.B3.stranger && r.B3.knife && r.B3.johor === false && r.J5.johor === 'escort' && r.J5.hired && r.J5.first && r.J5.loyal === 80, '④ 요새에 알리면 ⑤는 닫힌다 · ④를 건너뛰어도 ⑤에서 처음 만나 동료');
    ok(r.newsAll.some(x => /후추 천 자루/.test(x)) && r.newsAll.some(x => /빈탄 섬을 쳐서/.test(x)) && r.newsAll.some(x => /하사누딘/.test(x)) && r.newsAll.some(x => /마르훔 캄파르/.test(x)) && r.oldSave.n === 0 && r.oldSave.told === 7, '소식 — 조약·빈탄·반텐·캄파르 · 옛 저장은 지난 소식을 띄우지 않는다');
    ok(r.rumor.has && r.rumor.pillar && r.rumor.fatah && r.rumor.maid && r.rumor.drums && r.journal, '소문(돌기둥·파타힐라·시녀·조호르 강) · 일지');
    ok(r.love && r.voice.every(Boolean) && r.voiceLen && r.greet, '말투 — 둘 다 옛이야기 · 연애 말(a50·a80) · 한 줄 140자 이하 · 첫마디');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
