/* 천계제의 궁궐과 동림당 (2026-11-05 사용자 요청) — node tests/donglin_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 목수 황제의 주문(1621~1626 명의 항구) — 약조하면 북경·항주·소주·남경 통행 · ② 대패 소리(북경, 백단향) — 「짐은 다 알았다」 · 누각 · 궁녀 취연(양식 → 매수/동안문 육상전/두고 감)
   · ③ 서호의 탄궁(1625.4.25~1626.3.31 항주) — 설소소와 소만 · 배에 태운다(육상전)/매수/모른 척 · ④ 소주 민변(1626.3.1~4.14 — 4.14까지 날이 지나간다) · ④' 서호의 배
   · 셋 다 eventOnly · 여자 어른(연애 됨) · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Donglin && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, DL = G.Donglin, said = [], asked = [], out = {};
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
      const fresh = (y, m, d, noCall) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; s.fleet.food = 200; if (noCall) DL.state().call = 'no'; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; const p = DL.pending(); if (p) await DL.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const has = (id) => G.R.hasItem(id);
      const b = () => DL.state();
      const sea = (s, y, m, d) => { s.loc = { mode: 'sea', lon: 121, lat: 30 }; s.date = { y, m, d }; };
      const IDS = ['dl_cuiyan', 'dl_xiaoman', 'dl_wangwei'];
      out.mates = IDS.map(id => { const m = G.MATE[id]; return !!m && m.eventOnly && !m.wed && m.g === 'f' && !m.minor && m.wage === 0 && !!m.desc && !!m.face; });
      out.inPool = (G.MATES || []).filter(m => IDS.includes(m.id)).length;
      out.tavern = G.Frontier && G.Frontier.mateReady ? IDS.map(id => G.Frontier.mateReady(G.MATE[id], 1626)) : null;
      // ── 문
      let s = fresh(1621, 1, 1);
      out.gate = { callEarly: (at(s, 1620, 12, 31, 173), DL.pending()), callMacao: (at(s, 1621, 3, 1, 173), DL.pending()), callNanjing: (at(s, 1624, 3, 1, 178), DL.pending()), callLate: (at(s, 1627, 1, 1, 173), DL.pending()) };
      s = fresh(1621, 1, 1, true);
      Object.assign(out.gate, {
        bjNoOrder: (at(s, 1622, 1, 1, 188), DL.pending()),
        lakeEarly: (at(s, 1625, 4, 24, 177), DL.pending()), lakeOn: (at(s, 1625, 4, 25, 177), DL.pending()), lakeLate: (b().riot = 'x', at(s, 1626, 4, 1, 177), DL.pending()),
        riotEarly: (delete b().riot, at(s, 1626, 2, 28, 286), DL.pending()), riotOn: (at(s, 1626, 3, 1, 286), DL.pending()), lateOn: (at(s, 1626, 6, 1, 286), DL.pending()), lateOff: (at(s, 1628, 1, 1, 177), DL.pending())
      });
      // ── ① 약조 → 통행 · 기한
      s = fresh(1622, 5, 1); at(s, 1622, 5, 1, 173); await go(['take']);
      const w = G.BALANCE.donglin.wood;
      out.C1 = { call: b().call, due: b().dueDay - s.day, pass: [188, 177, 286, 178].every(id => G.Sneak.hasPass(G.CITY_DATA[id])), carpenter: said.some(x => /손수 대패질/.test(x)), wei: said.some(x => /위 공공의 말이 곧 성지/.test(x)), again: (at(s, 1622, 5, 2, 174), DL.pending()) };
      // 백단향 없이 북경 — 열리지 않는다
      at(s, 1622, 8, 1, 188); out.C1.noWood = DL.pending();
      // ── ② 백단향을 바친다 · 양식 → 매수 → 취연
      s.fleet.cargo[w.good] = { q: w.n + 2 }; const g0 = s.player.gold, f0 = s.fleet.food;
      await go(['food', 'bribe']);
      out.W1 = { wood: !!b().wood, call: b().call, gold: s.player.gold - g0, expect: DL.woodGold() - G.BALANCE.donglin.bribe, left: s.fleet.cargo[w.good] && s.fleet.cargo[w.good].q, item: has('dl_pavilion'), food: f0 - s.fleet.food, cui: b().cui, way: b().cuiWay, hired: hired('dl_cuiyan'),
        know: said.some(x => /짐은 다 알았다/.test(x)), ke: said.some(x => /이 오랑캐는 누구요/.test(x)), wall: said.some(x => /이 틈에 숨길 수 있어요/.test(x)), crate: said.some(x => /백단향 궤짝 하나가 비었구려/.test(x)), dead: said.some(x => /유비 마마는 그렇게 굶어/.test(x)), again: (at(s, 1622, 8, 2, 188), DL.pending()) };
      sea(s, 1623, 6, 16); out.newsFood = DL.daily().map(x => x.text).join(' | ');
      // ── ② 1624년 · 양식은 주었으나 동안문에서 진다
      s = fresh(1624, 1, 1); b().call = 'take'; b().dueDay = s.day + 300; s.fleet.cargo[w.good] = { q: w.n }; at(s, 1624, 3, 1, 188);
      await go(['food', 'gate'], ['lose']);
      out.W2 = { cui: b().cui, hired: hired('dl_cuiyan'), fight: said.some(x => /\[육상전\] 동안문의 동창 교위들 16/.test(x)), dead: said.some(x => /유비 마마는 그렇게 굶어/.test(x)) };
      // ── ② 못 본 척 · 기한이 지나면 끝
      s = fresh(1622, 1, 1); b().call = 'take'; b().dueDay = s.day + 300; s.fleet.cargo[w.good] = { q: w.n }; at(s, 1622, 3, 1, 188); await go(['no']);
      out.W3 = { cui: b().cui, hired: hired('dl_cuiyan'), item: has('dl_pavilion') };
      s = fresh(1622, 1, 1); b().call = 'take'; b().dueDay = s.day - 1; sea(s, 1622, 12, 1); const lateMsg = DL.daily().map(x => x.text).join(' ');
      at(s, 1622, 12, 1, 188); s.fleet.cargo[w.good] = { q: w.n };
      out.W4 = { call: b().call, msg: /기한이 지났다/.test(lateMsg), pending: DL.pending() };
      // ── ③ 서호 — 배에 태운다(이긴다)
      s = fresh(1625, 5, 1, true); at(s, 1625, 5, 1, 177); await go(['ship'], ['win']);
      out.L1 = { lake: b().lake, way: b().lakeWay, hired: hired('dl_xiaoman'), orchid: has('dl_orchid'), pass: G.Sneak.hasPass(G.CITY_DATA[286]), pellet: said.some(x => /흙탄이 가루가 되어/.test(x)), lamps: said.some(x => /등불 심지 셋이 끊겨/.test(x)), narrow: said.some(x => /서호가 좁다고 우는 아이/.test(x)), fight: said.some(x => /\[육상전\] 서호 부두의 동창 교위 12/.test(x)), again: (at(s, 1625, 6, 1, 177), DL.pending()) };
      sea(s, 1625, 8, 28); out.newsSix = DL.daily().map(x => x.text).join(' | ');
      // ── ③ 매수 · 모른 척
      s = fresh(1625, 5, 1); let g1 = s.player.gold; at(s, 1625, 9, 1, 177); await go(['bribe']);
      out.L2 = { lake: b().lake, paid: g1 - s.player.gold, hired: hired('dl_xiaoman') };
      s = fresh(1625, 5, 1); at(s, 1625, 9, 1, 177); await go(['no']);
      out.L3 = { lake: b().lake, hired: hired('dl_xiaoman'), cold: said.some(x => /바다 사람도 별수 없네요/.test(x)) };
      // ── ④ 항주에서 왕미의 거룻배로 — 4.14까지 · 군중과 함께 · 소만·취연이 배에 있으면 한마디
      s = fresh(1626, 3, 1, true); s.mates.push({ id: 'dl_xiaoman', role: 'none', loyal: 80 }); at(s, 1626, 3, 1, 177);
      await go(['fight', 'yes'], ['win']);
      out.R1 = { riot: b().riot, way: b().riotWay, date: s.date.m + '.' + s.date.d, wang: b().wang, hired: hired('dl_wangwei'), wuren: has('dl_wuren'), noSell: !!G.ITEM.dl_wuren.noSell, skiff: said.some(x => /운하의 버드나무가 사흘/.test(x)), fake: said.some(x => /동창에서도 나오는가/.test(x)), five: said.some(x => /안패위, 양념여, 마걸, 심양, 주문원/.test(x)), man: said.some(x => /체포 문서 든 손만 맞혔어요/.test(x)), again: (at(s, 1626, 4, 20, 177), DL.pending()) };
      b().told = {}; sea(s, 1626, 4, 15); const nr = DL.daily().map(x => x.text).join(' | ');
      out.newsRiot = { fight: /남만 옷을 입은 선원들/.test(nr), walk: /스스로 걸어 나가/.test(nr) };
      sea(s, 1626, 9, 2); out.newsFive = DL.daily().map(x => x.text).join(' | ');
      // ── ④ 소주에서 · 주순창을 빼내자고 · 왕미를 놓아준다
      s = fresh(1626, 3, 1, true); s.mates.push({ id: 'dl_cuiyan', role: 'none', loyal: 80 }); at(s, 1626, 4, 10, 286); await go(['save', 'no']);
      out.R2 = { riot: b().riot, way: b().riotWay, wang: b().wang, hired: hired('dl_wangwei'), zhou: said.some(x => /내가 가지 않으면 다음엔/.test(x)), cui: said.some(x => /궁에서도 그랬어요/.test(x)), later: (at(s, 1626, 10, 1, 177), DL.pending()) };
      // ── ④' 놓쳤으면 서호의 배에서
      s = fresh(1626, 1, 1); at(s, 1626, 10, 1, 177); await go(['yes']);
      out.R3 = { riot: b().riot, wang: b().wang, hired: hired('dl_wangwei'), buxi: said.some(x => /불계원/.test(x)), five: said.some(x => /다섯 사람이 목이 베였어요/.test(x)), poem: said.some(x => /글자가 하나도 없는데 시네요/.test(x)) };
      // ── 소식 · 옛 저장
      s = fresh(1620, 8, 1, true); sea(s, 1620, 10, 2); out.news1620 = DL.daily().map(x => x.text).join(' | ');
      sea(s, 1626, 8, 2); out.newsAll = DL.daily().map(x => x.text);
      s = fresh(1627, 1, 1); delete s.donglin; out.oldSave = { n: DL.daily().length, told: Object.keys(G.Game.state.donglin.told).length };
      // ── 소문 · 일지 · 연애 · 말투
      const rum = (G.EVENT_RUMORS || []).find(x => x.id === 'donglin');
      s = fresh(1622, 1, 1); const rr = rum ? rum.text(s) : []; s.date = { y: 1626, m: 3, d: 10 }; const rr2 = rum ? rum.text(s) : [];
      out.rumor = { has: !!rum, wood: rr.some(x => /대패질/.test(x.y) && x.o), wang: rr2.some(x => /왕미/.test(x.y)), arrest: rr2.some(x => /동림 선비/.test(x.y)) };
      out.journal = !!(DL.daily && DL.daily._journal);
      out.love = IDS.every(id => !G.MATE[id].wed && G.VOICES[id] && G.VOICES[id].love && G.VOICES[id].love.a50.length >= 3 && G.VOICES[id].love.a80.length >= 3);
      out.voice = IDS.map(id => { const v = G.VOICES && G.VOICES[id]; return !!v && v.stories.length >= 4 && v.stories.length <= 6 && v.stories.every(st => st.l.length >= 3 && st.l.length <= 6); });
      out.voiceLen = IDS.every(id => { const v = G.VOICES[id]; const L = [].concat(v.greet.hi, v.greet.mid, v.greet.low, v.chat.hi, v.chat.mid, v.chat.low, v.again, v.drink, [v.drinkDone], v.lifeIntro, v.love.a50, v.love.a80); return L.every(x => x.length <= 140); });
      s = fresh(1626, 1, 1); s.mates.push({ id: 'dl_wangwei', role: 'none', loyal: 90 }); const m = s.mates[s.mates.length - 1];
      out.greet = !!(G.Voice && G.Voice.greet(G.MATE.dl_wangwei, m));
      return out;
    });
    console.log(JSON.stringify({ gate: r.gate, C1: r.C1, W1: r.W1, L1: r.L1, R1: r.R1, R2: r.R2, R3: r.R3, oldSave: r.oldSave }));
    ok(r.mates.every(Boolean) && r.inPool === 3 && (!r.tavern || r.tavern.every(x => !x)), '동료 셋 — 사건으로만(eventOnly · 술집에 안 나옴) · 여자 어른 · 월급 0 · wed 없음(연애 됨) · 얼굴 경로');
    const g = r.gate;
    ok(!g.callEarly && g.callMacao && g.callNanjing && !g.callLate && !g.bjNoOrder && !g.lakeEarly && g.lakeOn && !g.lakeLate && !g.riotEarly && g.riotOn && g.lateOn && !g.lateOff, '문 — 주문 1621~1626 명의 항구(오문·남경) · 서호 1625.4.25~1626.3.31 · 민변 1626.3.1~4.14 · 서호의 배 ~1627');
    ok(r.C1.call === 'take' && r.C1.due === 300 && r.C1.pass && r.C1.carpenter && r.C1.wei && r.C1.again === false && r.C1.noWood === false, '① 목수 황제의 주문 — 300일 · 어용감 목재 패(북경·항주·소주·남경) · 백단향이 없으면 북경에서 열리지 않는다');
    ok(r.W1.wood && r.W1.call === 'done' && r.W1.gold === r.W1.expect && r.W1.left === 2 && r.W1.item && r.W1.know && r.W1.ke && r.W1.wall && r.W1.food === 10 && r.W1.crate && r.W1.cui === 'joined' && r.W1.way === 'bribe' && r.W1.hired && !r.W1.dead && r.W1.again === false, '② 대패 소리 — 「짐은 다 알았다」 · 시세의 3배 · 작은 누각 · 객씨 · 양식 10을 벽 틈에 · 빈 백단향 궤짝 → 취연');
    ok(/마른 떡/.test(r.newsFood), '소식 — 양식을 주었으면 「바다 건너 배의 마른 떡」으로 성비가 살았다');
    ok(r.W2.cui === 'lost' && !r.W2.hired && r.W2.fight && r.W2.dead && r.W3.cui === 'pass' && !r.W3.hired && r.W3.item && r.W4.call === 'late' && r.W4.msg && !r.W4.pending, '② 동안문에서 지면 붙잡힌다 · 1623 뒤에는 유비의 죽음 · 못 본 척 · 기한이 지나면 끝');
    ok(r.L1.lake === 'saved' && r.L1.hired && r.L1.orchid && r.L1.pass && r.L1.pellet && r.L1.lamps && r.L1.narrow && r.L1.fight && r.L1.again === false && /바다로 나갔다/.test(r.newsSix), '③ 서호의 탄궁 — 설소소와 소만 · 등불 셋 · 부두의 교위 12 · 난초 그림 · 소주 통행 · 육군자 소식');
    ok(r.L2.lake === 'saved' && r.L2.paid === 1500 && r.L2.hired && r.L3.lake === 'pass' && !r.L3.hired && r.L3.cold, '③ 교위를 매수(1500) · 모른 척하면 소만은 오지 않는다');
    ok(r.R1.riot === 'done' && r.R1.way === 'fight' && r.R1.date === '4.14' && r.R1.wang === 'joined' && r.R1.hired && r.R1.wuren && r.R1.noSell && r.R1.skiff && r.R1.fake && r.R1.five && r.R1.man && r.R1.again === false && r.newsRiot.fight && r.newsRiot.walk && /바다로 떠났다/.test(r.newsFive), '④ 소주 민변 — 항주에서 왕미의 거룻배로 · 4.14까지 · 군중과 함께 · 다섯 사람의 이름(팔 수 없음) · 왕미 동료 · 소식');
    ok(r.R2.way === 'save' && r.R2.zhou && r.R2.cui && r.R2.wang === 'free' && !r.R2.hired && r.R2.later === false && r.R3.riot === 'late' && r.R3.wang === 'joined' && r.R3.hired && r.R3.buxi && r.R3.five && r.R3.poem, '④ 주순창은 스스로 걸어간다 · 왕미를 놓아주면 끝 · 놓쳤으면 서호의 불계원 배에서 만난다');
    ok(/만력제/.test(r.news1620) && /붉은 환약/.test(r.news1620) && /천계제다/.test(r.news1620) && r.newsAll.some(x => /스물네 가지/.test(x)) && r.newsAll.some(x => /왕공창/.test(x)) && r.newsAll.some(x => /보덕/.test(x)) && r.oldSave.n === 0 && r.oldSave.told === 11, '소식 — 만력제·홍환안·이궁안 · 양련 · 왕공창 · 서호의 생사 · 옛 저장은 지난 소식을 띄우지 않는다');
    ok(r.rumor.has && r.rumor.wood && r.rumor.wang && r.rumor.arrest && r.journal, '소문(목수 황제·동림 체포·왕미) · 일지');
    ok(r.love && r.voice.every(Boolean) && r.voiceLen && r.greet, '말투 — 셋 다 옛이야기 · 연애 말(a50·a80) · 한 줄 140자 이하 · 첫마디');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
