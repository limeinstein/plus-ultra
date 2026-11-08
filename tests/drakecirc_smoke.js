/* 드레이크의 세계 일주 (2026-11-08 사용자 요청) — node tests/drakecirc_smoke.js   (BROWSER_EXE=크롬 경로)
   · 지도의 함대(G.EXPEDITIONS 'drake') · ① 런던(출자·과라스) · 바다에서 만나면: ② 카보베르데(누누) ③ 남쪽 대서양(다우티) ④ 산훌리안의 재판 ⑤ 해협 ⑥ 폭풍 ⑦ 칠레(발파라이소)
     ⑧ 칼라오 ⑨ 카카푸에고 ⑩ 과툴코(누누가 부하로) ⑪ 노바 알비온 ⑫ 테르나테 ⑬ 산호초 ⑭ 희망봉 · 소식(셈 — 출자·은 상자) · ⑮ 뎃퍼드 · 다우티의 편지
   · 에스파냐 쪽: 리마의 부왕(허가장 → 큰 해전 · 파나마에 알린다) · 지도의 함대를 쳐부숴도 한 해 늦지 않는다(noDelay) · 다우티 편이면 적 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.DrakeCirc && G.World && G.SeaFolk, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, DC = G.DrakeCirc, said = [], asked = [], out = {};
      let plan = [], landRes = [], great = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value), dis: opts.filter(o => o.dis).map(o => o.value) }); return plan.length ? plan.shift() : opts[opts.length - 1].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => true;
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      G.Rel.greatBattle = async (spec) => { great.push(spec); const v = plan.length ? plan.shift() : 'fight'; if (v !== 'fight') return false; return true; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; s.fleet.food = 300; s.fleet.water = 300; s.fleet.cargo = {}; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const onFleet = (s, y, m, d) => { s.date = { y, m, d }; const p = DC.fleetPos(); s.loc = { mode: 'sea', lon: p ? p.lon + 0.5 : 0, lat: p ? p.lat + 0.3 : 0 }; return p; };
      const reset = (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; great.length = 0; };
      const go = async (choices, land) => { reset(choices, land); const p = DC.pending(); if (p) await DC.check(); return p; };
      const sea = async (choices, land) => { reset(choices, land); const p = DC.seaPending(); if (p) await DC.atSea(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const has = (id) => G.R.hasItem(id);
      const b = () => DC.state();
      const saidAny = (re) => said.some(x => re.test(x));
      const ex = G.EXPEDITIONS.find(e => e.id === 'drake');
      const M = G.MATE.dc_nuno;
      out.defs = { ex: !!ex && ex.noDelay && ex.discs[0] === 'endstrait' && ex.nation === '잉글랜드', mate: !!M && M.eventOnly && M.g === 'm' && M.sk.nav === 3 && !!M.wed,
        tavern: G.Frontier && G.Frontier.mateReady ? G.Frontier.mateReady(M, 1590) : false, fig: !!G.HIST_FIG.dc_drake && G.HIST_FIG.dc_drake.face === 'portraits/mates/drake',
        items: ['dc_letter', 'dc_plate', 'dc_plank', 'dc_chest', 'dc_share', 'dc_commission'].every(id => G.ITEM[id] && G.ITEM[id].noSell) };
      // ── 함대의 자리 — 1577.12.13 플리머스 → 1580.9.26 플리머스 (seafolk 바닷길)
      let s = fresh(1578, 1, 1);
      const pos = (y, m, d) => { s.date = { y, m, d }; return DC.fleetPos(); };
      const near = (p, lat, lon, e) => p && Math.abs(p.lat - lat) < (e || 1.2) && Math.abs((((p.lon - lon) + 540) % 360) - 180) < (e || 1.2);
      out.pos = { cv: near(pos(1578, 1, 20), 15.0, -23.7), jul: near(pos(1578, 7, 2), -49.3, -67.6), callao: near(pos(1579, 2, 14), -12.05, -77.3), albion: near(pos(1579, 7, 1), 38.0, -123.0),
        pac: !!pos(1579, 8, 20), tern: near(pos(1579, 11, 5), 0.75, 127.3), reef: near(pos(1580, 1, 9), -1.9, 121.4), cape: near(pos(1580, 6, 18), -34.8, 18.4), map: (s.date = { y: 1578, m: 7, d: 1 }, G.SeaFolk.voyages().some(e => e.id === 'drake')), after: pos(1580, 10, 5) === null, before: pos(1577, 12, 1) === null };
      // ── ① 런던 — 문 · 출자 · 과라스를 알린다
      s = fresh(1577, 4, 1);
      out.gate = { early: (at(s, 1577, 4, 30, 38), DC.pending()), on: (at(s, 1577, 6, 1, 38), DC.pending()), late: (at(s, 1577, 11, 20, 38), DC.pending()), other: (at(s, 1577, 6, 1, 39), DC.pending()) };
      s = fresh(1577, 6, 1); at(s, 1577, 6, 1, 38); const g0 = s.player.gold;
      await go(['invest', 'warn']);
      out.A = { seen: b().seen.london, invest: b().invest, share: has('dc_share'), trust: DC.trust(), paid: g0 - s.player.gold, wal: saidAny(/알렉산드리아로 건포도/), guaras: saidAny(/펠리페 전하께서는/), again: DC.pending() };
      // ── ② 카보베르데 — 누누와 이야기
      onFleet(s, 1578, 1, 25); out.B = { pend: DC.seaPending() };
      await sea(['nuno']); out.B.nuno = b().nuno; out.B.seen = b().seen.atl; out.B.line = saidAny(/성모님, 이것도 셈이 맞습니까/);
      s.date = { y: 1578, m: 1, d: 25 }; s.loc = { mode: 'sea', lon: -40, lat: 30 }; out.B.far = DC.seaPending();
      // ── ③ 다우티의 이야기 (신호로) · ④ 산훌리안 — 드레이크 편
      onFleet(s, 1578, 5, 1); reset(['listen']); await G.SeaFolk.talk({ exp: ex }, { name: '드레이크' });
      out.C = { listen: b().listen, seen: b().seen.plata, doughty: saidAny(/데번 촌구석의 목사 아들/) };
      onFleet(s, 1578, 6, 28); await sea(['side']);
      out.D = { doughty: b().doughty, trust: DC.trust(), letter: has('dc_letter') && b().letter === 'carry', axe: saidAny(/도끼 앞에 스스로 목을/), speech: saidAny(/신사도 선원과 함께 밧줄을/) };
      // ── ⑤ 해협 · ⑥ 폭풍(남쪽 끝 — 단서) · ⑦ 칠레(발파라이소 약탈)
      onFleet(s, 1578, 8, 25); await sea(['scout']); out.E = { strait: b().seen.strait, sixteen: saidAny(/열엿새요/) };
      onFleet(s, 1578, 10, 10); await sea(['south']); out.E.storm = b().seen.storm; out.E.hint = !!(s.hints && s.hints.endstrait);
      onFleet(s, 1578, 11, 28); const v0 = s.player.gold, n0 = s.player.notoriety || 0; await sea(['raid'], ['win']);
      out.F = { chile: b().seen.chile, gold: s.player.gold - v0, noto: (s.player.notoriety || 0) - n0, fight: saidAny(/\[육상전\] 발파라이소의 에스파냐 선원들 16/), hostile: Object.keys(s.hostile || {}).join(','), trust: DC.trust() };
      // ── ⑧ 칼라오(지나간다) · 리마의 부왕은 해적과 한패에게 열리지 않는다 · ⑨ 카카푸에고
      onFleet(s, 1579, 2, 10); await sea(['pass']); out.G = { callao: b().seen.callao };
      at(s, 1579, 2, 20, 222); out.G.limaClosed = DC.pending() === false;
      onFleet(s, 1579, 3, 2); await sea(['chase']); out.G.chest = has('dc_chest') && b().chest === 1; out.G.anton = saidAny(/은 뿜는 배/);
      // ── ⑩ 과툴코 — 누누를 태운다
      onFleet(s, 1579, 4, 14); await sea(['take']); out.H = { join: hired('dc_nuno'), seen: b().seen.guatulco, line: saidAny(/신께서 셈을 맞추셨소/) };
      // ── ⑪ 노바 알비온 · ⑫ 테르나테(정향) · ⑬ 산호초 · ⑭ 희망봉
      onFleet(s, 1579, 6, 25); await sea(['help']); out.I = { albion: b().seen.albion, plate: has('dc_plate') };
      s.fleet.food = 60; s.fleet.water = 60; onFleet(s, 1579, 11, 5); await sea(['buy']); out.I.tern = b().seen.ternate; out.I.clove = (s.fleet.cargo.clove || {}).q || 0;
      onFleet(s, 1580, 1, 9); await sea(['tow', 'buy']); out.I.reef = b().seen.reef; out.I.plank = has('dc_plank'); out.I.excom = saidAny(/목사를 파문하는 총대장/); out.I.clove2 = (s.fleet.cargo.clove || {}).q || 0;
      onFleet(s, 1580, 6, 18); await sea(['give']); out.I.cape = b().seen.cape; out.I.trust = DC.trust(); out.I.fairest = saidAny(/가장 아름다운 곶/);
      // ── 소식 — 귀환 · 셈(출자 1500×12 + 은 상자 6000)
      b().told = {}; s.date = { y: 1580, m: 9, d: 27 }; const n1 = DC.daily().map(x => x.text).join(' | ');
      const p0 = s.player.gold; s.date = { y: 1580, m: 10, d: 16 }; const n2 = DC.daily().map(x => x.text).join(' | ');
      out.news = { dep: /플리머스를 떠난 다섯 척/.test(n1) && /출자 명부/.test(n1), dough: /산훌리안의 도끼/.test(n1), hind: /골든 하인드호】/.test(n1), south: /땅끝의 바다/.test(n1) && /남만 배 한 척/.test(n1), callao: /칼라오의 밤/.test(n1),
        caca: /카카푸에고】/.test(n1), home: /여왕 폐하는 아직 살아 계시오/.test(n1), pay: /골든 하인드호의 셈/.test(n2), paid: s.player.gold - p0, share: has('dc_share'), chest: has('dc_chest') };
      // ── 다우티의 편지 · ⑮ 뎃퍼드
      at(s, 1580, 10, 20, 38); await go([]); out.J = { letter: b().letter, john: saidAny(/법정에 세울 거예요/), hasL: has('dc_letter') };
      at(s, 1581, 3, 1, 38); out.J.knEarly = DC.pending();
      at(s, 1581, 4, 2, 38); await go([]); out.J.knight = b().knight; out.J.queen = saidAny(/금칼로 치겠다/); out.J.march = saidAny(/드레이크 경/);
      s.date = { y: 1581, m: 4, d: 5 }; out.J.newsKn = DC.daily().filter(x => /뎃퍼드의 기사/.test(x.text)).length;
      // ── 믿음이 모자라면 뎃퍼드에 부르지 않는다 · 소식으로만
      s = fresh(1581, 4, 2); at(s, 1581, 4, 2, 38); out.K = { closed: DC.pending() === false }; b().told = {}; s.date = { y: 1581, m: 4, d: 5 }; out.K.news = DC.daily().some(x => /뎃퍼드의 기사/.test(x.text));
      // ── 에스파냐 쪽: 리마의 부왕 — 허가장 → 바다에서 큰 해전
      s = fresh(1579, 2, 20); at(s, 1579, 2, 20, 222);
      await go(['hunt']); out.L = { side: b().side, com: has('dc_commission'), toledo: saidAny(/잉글랜드 해적 「드라케」/) };
      onFleet(s, 1579, 3, 3); out.L.pend = DC.seaPending(); await sea(['fight']);
      out.L.spec = great.length ? great[0].id + ':' + great[0].foe : ''; out.L.hunt = b().hunt;
      const sp = G.Rel.spec ? G.Rel.spec('dc_hunt') : null; if (sp && sp.onWin) sp.onWin();
      out.L.won = b().hunt === 'won' && b().foe === true; out.L.trust = DC.trust();
      onFleet(s, 1579, 4, 14); out.L.after = DC.seaPending();
      reset([]); await G.SeaFolk.talk({ exp: ex }, { name: '드레이크' }); out.L.cold = saidAny(/나눌 말은 없소/);
      // 파나마에 알린다
      s = fresh(1579, 2, 20); at(s, 1579, 2, 20, 222); await go(['warn']); const w0 = s.player.gold;
      at(s, 1579, 3, 10, 210); await go([]); out.M = { warn: b().warn, gold: s.player.gold - w0, late: saidAny(/어제 닿았소/) };
      // ── 지도의 함대를 쳐부숴도 한 해 늦지 않는다 (seafolk afterBattle noDelay)
      s = fresh(1579, 3, 3); const lines = [];
      G.SeaFolk.afterBattle({ exp: ex, kind: 'navy' }, 'win', lines);
      out.N = { delay: G.SeaFolk.delay(ex), flag: !!s.flags['expBeat_drake_0'], beat: b().beat, foe: DC.trust() === -99, line: /밤 사이 수평선 너머로/.test(lines.join(' ')), pos: !!(s.date = { y: 1579, m: 3, d: 3 }, DC.fleetPos()) };
      // ── 다우티 편 — 적 (편지는 받는다)
      s = fresh(1578, 6, 28); onFleet(s, 1578, 6, 28); await sea(['rebel'], ['lose']);
      out.O = { foe: b().foe, trust: DC.trust(), letter: has('dc_letter'), noSpeech: !saidAny(/신사도 선원과 함께 밧줄을/), later: (onFleet(s, 1578, 8, 25), DC.seaPending()) };
      // 청한다(웅변) — 성찬과 저녁 · 믿음 +1
      s = fresh(1578, 6, 28); onFleet(s, 1578, 6, 28); await sea(['plead']); out.O.plead = b().pleadRes === 'win' && DC.trust() === 1 && has('dc_letter');
      // 과라스에게 넘기면 믿음 −2
      s = fresh(1577, 6, 1); at(s, 1577, 6, 1, 38); await go(['no', 'spy']); out.P = { spy: b().spy, trust: DC.trust(), noto: s.player.notoriety };
      // 누누는 이야기도 믿음도 없으면 태울 수 없다
      s = fresh(1579, 4, 14); onFleet(s, 1579, 4, 14); await sea([]); const ask = asked.find(a => a.opts.includes('pass')); out.P.noTake = ask && !ask.opts.includes('take') && !hired('dc_nuno');
      // ── 옛 저장 · 소문 · 일지 · 말투
      s = fresh(1582, 1, 1); delete s.drakeCirc; out.oldSave = { n: DC.daily().length, told: Object.keys(G.Game.state.drakeCirc.told).length };
      const rum = (G.EVENT_RUMORS || []).find(x => x.id === 'drakecirc');
      s = fresh(1577, 6, 1); const r1 = rum ? rum.text(s) : []; s.date = { y: 1579, m: 6, d: 1 }; const r2 = rum ? rum.text(s) : [];
      out.rumor = { has: !!rum, alex: r1.some(x => /알렉산드리아/.test(x.y) && x.o), south: r2.some(x => /닻줄/.test(x.y)) };
      s = fresh(1578, 3, 1); DC.state().seen.london = 'met';
      out.journal = { row: !!(DC.daily && DC.daily._journal), html: /드레이크의 믿음/.test(DC.html()) && /뎃퍼드/.test(DC.html()), court: !!(G.Court && G.Court.taskHtml && /드레이크/.test(G.Court.taskHtml())) };
      const V = G.VOICES.dc_nuno;
      out.voice = { ok: !!V && V.reg === 'hao' && V.stories.length >= 4 && !V.love && !V.wife, len: [].concat(V.greet.hi, V.greet.mid, V.greet.low, V.chat.hi, V.chat.mid, V.chat.low, V.again, V.drink, [V.drinkDone], V.lifeIntro).every(x => x.length <= 140) };
      s = fresh(1582, 1, 1); s.mates.push({ id: 'dc_nuno', role: 'none', loyal: 80 });
      out.greet = !!(G.Voice && G.Voice.greet(M, s.mates[s.mates.length - 1]));
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.defs.ex && r.defs.mate && !r.defs.tavern && r.defs.fig && r.defs.items, '지도의 함대 drake(noDelay·땅끝 해협) · 동료 누누 다 실바 — 사건으로만 · 소지품 여섯은 팔 수 없다');
    const p = r.pos; ok(p.cv && p.jul && p.callao && p.albion && p.pac && p.tern && p.reef && p.cape && p.map && p.after && p.before, '함대의 자리(지도에 보인다) — 카보베르데 · 산훌리안 · 칼라오 · 노바 알비온 · 큰 바다 · 테르나테 · 산호초 · 희망봉 · 떠나기 전·돌아온 뒤에는 없다');
    ok(!r.gate.early && r.gate.on && !r.gate.late && !r.gate.other && r.A.seen === 'invest' && r.A.invest === 1500 && r.A.share && r.A.trust === 2 && r.A.paid === 1500 && r.A.wal && r.A.guaras && r.A.again === false, '① 런던 1577.5~11 — 출자(증서) · 과라스의 금화를 알린다 (믿음 2)');
    ok(r.B.pend && r.B.nuno === 1 && r.B.seen === 'nuno' && r.B.line && r.B.far === false, '② 카보베르데 — 함대 곁에서 하루가 끝나면 · 누누와 이야기 · 멀면 열리지 않는다');
    ok(r.C.listen && r.C.seen === 'listen' && r.C.doughty && r.D.doughty === 'side' && r.D.trust === 4 && r.D.letter && r.D.axe && r.D.speech, '③ 신호로 「선장과 이야기」 — 다우티의 이야기 · ④ 산훌리안(드레이크 편 +2) — 역사대로 도끼 · 편지 · 「신사도 밧줄을」');
    ok(r.E.strait === 'scout' && r.E.sixteen && r.E.storm === 'south' && r.E.hint && r.F.chile === 'raid' && r.F.gold === 1500 && r.F.noto === 3 && r.F.fight && r.F.hostile.length > 0 && r.F.trust === 7, '⑤ 해협(열엿새) · ⑥ 남쪽 끝(땅끝 해협의 단서) · ⑦ 발파라이소 약탈(16 · 몫 1,500 · 악명 · 적대)');
    ok(r.G.callao === 'pass' && r.G.limaClosed && r.G.chest && r.G.anton && r.H.join && r.H.seen === 'take' && r.H.line, '⑧ 칼라오 · 해적과 한패면 리마의 부왕이 열리지 않는다 · ⑨ 카카푸에고(은 상자) · ⑩ 과툴코 — 누누가 부하로');
    ok(r.I.albion === 'help' && r.I.plate && r.I.tern === 'buy' && r.I.clove === 30 && r.I.reef === 'tow' && r.I.plank && r.I.excom && r.I.clove2 > 30 && r.I.cape === 'give' && r.I.fairest && r.I.trust === 13, '⑪ 노바 알비온(놋쇠 판) · ⑫ 테르나테(정향 30) · ⑬ 산호초(+2 · 판자 · 버린 정향) · ⑭ 희망봉');
    ok(r.news.dep && r.news.dough && r.news.hind && r.news.south && r.news.callao && r.news.caca && r.news.home && r.news.pay && r.news.paid === 24000 && !r.news.share && !r.news.chest, '소식 — 출항 · 도끼 · 골든 하인드 · 땅끝 · 칼라오 · 카카푸에고 · 귀환 · 셈(출자 18,000 + 은 상자 6,000)');
    ok(r.J.letter === 'given' && r.J.john && !r.J.hasL && !r.J.knEarly && r.J.knight === 1 && r.J.queen && r.J.march && r.J.newsKn === 0 && r.K.closed && r.K.news, '다우티의 편지(아우 존) · ⑮ 뎃퍼드 1581.3.25~ — 믿음이 모자라면 부르지 않고 소식으로만');
    ok(r.L.side === 'es' && r.L.com && r.L.toledo && r.L.pend && r.L.spec === 'dc_hunt:잉글랜드' && r.L.won && r.L.trust === -99 && r.L.after === false && r.L.cold && r.M.warn === 'done' && r.M.gold === 1200 && r.M.late, '에스파냐 쪽 — 리마의 허가장 → 바다에서 골든 하인드호와 큰 해전 · 파나마에 알린다(사례 1,200)');
    ok(r.N.delay === 0 && r.N.flag && r.N.beat && r.N.foe && r.N.line && r.N.pos, '지도의 함대를 쳐부숴도 한 해 늦지 않는다(noDelay) — 그의 적이 된다');
    ok(r.O.foe && r.O.trust === -99 && r.O.letter && r.O.noSpeech && r.O.later === false && r.O.plead && r.P.spy === 'es' && r.P.trust === -2 && r.P.noto >= 3 && r.P.noTake, '다우티 편이면 적(편지만) · 청하면 성찬과 저녁(+1) · 과라스에게 넘기면 −2 · 인연이 없으면 누누를 태울 수 없다');
    ok(r.oldSave.n === 0 && r.oldSave.told === 10, '옛 저장은 지난 소식을 띄우지 않는다');
    ok(r.rumor.has && r.rumor.alex && r.rumor.south && r.journal.row && r.journal.html && r.journal.court, '소문 · 일지(소식 줄 · 할 일 — 믿음)');
    ok(r.voice.ok && r.voice.len && r.greet, '누누의 말투 — 하오체 · 옛이야기 4 · 연정 말 없음 · 한 줄 140자 이하 · 첫마디');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
