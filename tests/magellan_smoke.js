/* 마가야네스(마젤란)의 세계 일주 (2026-11-08 사용자 요청) — node tests/magellan_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 세빌리아의 다섯 척(출자·포르투갈 상관장) · 바다에서 함대를 만나면: ② 대서양 ③ 라플라타 ④ 산훌리안의 반란 ⑤ 겨울 ⑥ 해협 ⑦ 큰 바다 ⑧ 도둑의 섬 ⑨ 세부
   · ⑩ 막탄 — 믿음이 모자라면 「사령관을 살린다」가 닫혀 있다 · 넉넉하면 살리고(동료·아스트롤라베) · 지면 역사대로
   · 향료제도·막탄(테르나테 → 세부)의 막탄 장면에서도 살릴 수 있다 · 반란자 편이면 적 · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Magellan && G.World && G.SeaFolk, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, MG = G.Magellan, SM = G.SpiceMactan, said = [], asked = [], out = {};
      let plan = [], landRes = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value), dis: opts.filter(o => o.dis).map(o => o.value) }); return plan.length ? plan.shift() : opts[opts.length - 1].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => false;
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; s.fleet.food = 200; s.fleet.water = 200; s.fleet.cargo = {}; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const onFleet = (s, y, m, d) => { s.date = { y, m, d }; const p = MG.fleetPos(); s.loc = { mode: 'sea', lon: p ? p.lon + 0.5 : 0, lat: p ? p.lat + 0.3 : 0 }; return p; };
      const reset = (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; };
      const go = async (choices, land) => { reset(choices, land); const p = MG.pending(); if (p) await MG.check(); return p; };
      const sea = async (choices, land) => { reset(choices, land); const p = MG.seaPending(); if (p) await MG.atSea(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const has = (id) => G.R.hasItem(id);
      const b = () => MG.state();
      const saidAny = (re) => said.some(x => re.test(x));
      const M = G.MATE.mg_magellan;
      out.defs = { ok: !!M && M.eventOnly && M.g === 'm' && !!M.wed && M.face === 'portraits/history/magellan' && M.sk.nav === 3 && /막탄/.test(M.desc),
        tavern: G.Frontier && G.Frontier.mateReady ? G.Frontier.mateReady(M, 1525) : false, fig: !!G.HIST_FIG.mg_mag && G.HIST_FIG.mg_mag.face === 'portraits/history/magellan' };
      // ── 함대의 자리 — 해협까지는 seafolk, 그 너머는 PAC
      let s = fresh(1519, 10, 1);
      const pos = (y, m, d) => { s.date = { y, m, d }; return MG.fleetPos(); };
      const pC = pos(1519, 9, 26), pR = pos(1519, 12, 13), pP = pos(1521, 1, 24), pG = pos(1521, 3, 7), pX = pos(1521, 5, 10), pB = pos(1519, 9, 1);
      out.pos = { can: pC && Math.abs(pC.lat - 28.5) < 1 && Math.abs(pC.lon + 16) < 1, rio: pR && Math.abs(pR.lat + 23.05) < 1, pac: pP && Math.abs(pP.lat + 16.2) < 0.5 && Math.abs(pP.lon + 138.6) < 0.5, guam: pG && Math.abs(pG.lat - 13.4) < 0.5 && Math.abs(pG.lon - 144.7) < 0.5, after: pX === null, before: pB === null };
      // ── ① 세빌리아 — 문 · 출자 · 알바르스를 알린다
      s = fresh(1518, 1, 1);
      out.gate = { early: (at(s, 1518, 3, 21, 7), MG.pending()), on: (at(s, 1518, 6, 1, 7), MG.pending()), cadizEarly: (at(s, 1519, 7, 1, 8), MG.pending()), cadiz: (at(s, 1519, 8, 15, 8), MG.pending()), late: (at(s, 1519, 9, 20, 7), MG.pending()),
        lisbon: (at(s, 1518, 6, 1, 0), MG.pending()), seaEarly: (s.date = { y: 1519, m: 9, d: 1 }, s.loc = { mode: 'sea', lon: -6.5, lat: 36.7 }, MG.seaPending()) };
      // 세랑의 편지가 기다리면 그것이 먼저
      s.spiceMactan = { told: {}, letter: 'carry' }; G.R.addItem('sm_letter'); at(s, 1518, 6, 1, 7);
      out.gate.letterFirst = !!(SM && SM.pending()) && MG.pending() === false;
      s = fresh(1518, 6, 1); at(s, 1518, 6, 1, 7); const g0 = s.player.gold;
      await go(['invest', 'warn']);
      out.A = { seen: b().seen.seville, invest: b().invest, share: has('mg_share'), trust: MG.trust(), paid: g0 - s.player.gold, faleiro: saidAny(/경도요/), cart: saidAny(/왕실의 눈은 나요/), alv: saidAny(/리스본의 마누엘 전하/), africa: saidAny(/아프리카 해안에 붙어서/), again: MG.pending() };
      // ── ② 대서양 (무풍대) — 물·식량
      const f0 = s.fleet.food;
      onFleet(s, 1519, 11, 10); out.B = { pend: MG.seaPending() };
      await sea(['give']);
      out.B.seen = b().seen.atl; out.B.trust = MG.trust(); out.B.food = f0 - s.fleet.food; out.B.cart = saidAny(/선장」이라 불렀소/); out.B.again = MG.seaPending();
      // 멀리 있으면 열리지 않는다
      s.date = { y: 1520, m: 1, d: 20 }; s.loc = { mode: 'sea', lon: -30, lat: 0 }; out.B.far = MG.seaPending();
      // ── ③ 라플라타 · ④ 반란(빅토리아호 갑판 — 이긴다)
      onFleet(s, 1520, 1, 20); await sea(['tell']); out.C = { plata: b().seen.plata, trust: MG.trust(), sweet: saidAny(/달군. 강이오/) };
      onFleet(s, 1520, 4, 2); await sea(['fight'], ['win']);
      out.D = { mutiny: b().mutiny, res: b().mutinyRes, trust: MG.trust(), fight: saidAny(/\[육상전\] 빅토리아호 갑판의 반란 선원 18/), elcano: saidAny(/배만 몰았소/), espinosa: saidAny(/에스피노사의 단검/) };
      // ── ⑤ 겨울 — 신호를 보내 「선장과 이야기한다」
      onFleet(s, 1520, 6, 1); reset(['give']);
      const ex = G.EXPEDITIONS.find(e => e.id === 'magellan');
      await G.SeaFolk.talk({ exp: ex }, { name: '마가야네스' });
      out.E = { winter: b().seen.winter, trust: MG.trust(), santiago: saidAny(/산티아고호가/) };
      // ── ⑥ 해협 · ⑦ 큰 바다 · ⑧ 괌
      onFleet(s, 1520, 11, 10); await sea(['scout']); out.F = { strait: b().seen.strait, cry: saidAny(/늙은 뱃사람이 울면 흉이오/) };
      onFleet(s, 1521, 1, 24); out.F.pacPend = MG.seaPending(); await sea(['give']); out.F.pac = b().seen.pac; out.F.rat = saidAny(/쥐 한 마리를 금화 반 닢/);
      onFleet(s, 1521, 3, 7); await sea(['buy']); out.F.guam = b().seen.guam; out.F.trust = MG.trust();
      // ── ⑨ 세부 → ⑩ 막탄 — 살린다 (이긴다)
      s.date = { y: 1521, m: 4, d: 10 }; s.loc = { mode: 'sea', lon: 124.3, lat: 10.0 };
      out.G = { pend: MG.seaPending() };
      await sea(['save'], ['win']);
      const saveAsk = asked.find(a => a.opts.includes('save'));
      out.G.saveDis = saveAsk ? saveAsk.dis.includes('save') : null; out.G.date = s.date.m + '.' + s.date.d;
      out.G.rescue = b().rescue; out.G.hired = hired('mg_magellan'); out.G.astro = has('mg_astrolabe'); out.G.noSell = !!G.ITEM.mg_astrolabe.noSell;
      out.G.fight = saidAny(/\[육상전\] 막탄의 여울 — 물러나는 길 26/); out.G.helm = saidAny(/투구와 흉갑이 벗겨져/); out.G.dead = saidAny(/오늘 아침 막탄의 여울에서 죽었소/);
      out.G.smCebu = s.spiceMactan && s.spiceMactan.cebu; out.G.smMactan = s.spiceMactan && s.spiceMactan.mactan;
      at(s, 1521, 4, 15, 171); out.G.smClosed = !!SM && SM.pending() === false;
      s.spiceMactan.told = {}; s.date = { y: 1521, m: 5, d: 2 }; s.loc = { mode: 'sea', lon: 125, lat: 5 };
      out.G.smNews = SM ? SM.daily().map(x => x.text).join(' | ') : '';
      // ── 소식 — 반란·평화의 바다·도둑의 섬·고메스 · 빅토리아호(출자의 몫 · 그의 한마디)
      b().told = {}; s.date = { y: 1521, m: 5, d: 7 }; const n1 = MG.daily().map(x => x.text).join(' | ');
      const v0 = s.player.gold; s.date = { y: 1522, m: 9, d: 9 }; const n2 = MG.daily().map(x => x.text).join(' | ');
      out.news = { mut: /산훌리안의 반란/.test(n1) && /낯선 남만 선원/.test(n1), pac: /평화의 바다/.test(n1), lad: /그 전에 남만 배 한 척이/.test(n1), gom: /이스테방 고메스/.test(n1), cap: /바야돌리드/.test(n1),
        vic: /빅토리아호, 산루카르/.test(n2) && /금화 3,200닢/.test(n2) && /바스크 사람이 해냈군/.test(n2), paid: s.player.gold - v0, share: has('mg_share') };
      // ── 믿음이 모자라면 닫혀 있다 → 지켜본다 (역사대로)
      s = fresh(1521, 4, 10); s.loc = { mode: 'sea', lon: 124.3, lat: 10.0 };
      await sea(['watch']);
      const ask2 = asked.find(a => a.opts.includes('save'));
      out.H = { saveDis: ask2 ? ask2.dis.includes('save') : null, rescue: b().rescue, hired: hired('mg_magellan'), fall: saidAny(/얼굴을 묻었다/), piga: saidAny(/참된 길잡이였던 분이/) };
      // ── 향료제도·막탄의 길(테르나테 → 세부) — 세랑의 편지·말라카의 다리 + 한 번 만남 = 3 → 살린다
      s = fresh(1521, 3, 10); s.goaMal = { told: {}, side: 'pt', mal: 'pt' }; s.spiceMactan = { told: {}, letter: 'given', bond: 0 }; b().trust = 1; b().seen.guam = 'buy';
      at(s, 1521, 3, 10, 171); reset(['go', 'save', 'ship'], ['win']);
      const smP = SM ? SM.pending() : false; if (smP) await SM.check();
      const ask3 = asked.find(a => a.opts.includes('save'));
      out.I = { smP, trust: MG.trust(), saveOpen: ask3 ? !ask3.dis.includes('save') : null, rescue: b().rescue, hired: hired('mg_magellan'), smMactan: s.spiceMactan.mactan, smRes: s.spiceMactan.mactanRes,
        feast: saidAny(/너는 여전히 노예다/), en: hired('h_enrique'), seaAfter: (s.date = { y: 1521, m: 4, d: 20 }, s.loc = { mode: 'sea', lon: 124.3, lat: 10 }, MG.seaPending()) };
      // 같은 길에서 지면 역사대로
      s = fresh(1521, 3, 10); s.goaMal = { told: {}, side: 'pt', mal: 'pt' }; s.spiceMactan = { told: {}, letter: 'given', bond: 0 }; b().trust = 1;
      at(s, 1521, 3, 10, 171); reset(['go', 'save', 'free'], ['lose']); if (SM && SM.pending()) await SM.check();
      out.I2 = { rescue: b().rescue, hired: hired('mg_magellan'), piga: saidAny(/몇 번이고 뒤를 돌아보셨소/) };
      s.spiceMactan.told = {}; s.date = { y: 1521, m: 5, d: 2 }; out.I2.news = SM ? /닿지 못했다고 한다/.test(SM.daily().map(x => x.text).join(' ')) : true;
      // ── 반란자 편 — 적 (살릴 수 없고, 신호에 등을 돌린다)
      s = fresh(1520, 4, 2); onFleet(s, 1520, 4, 2); const r0 = s.player.gold;
      await sea(['rebel']);
      out.J = { foe: b().foe, trust: MG.trust(), gold: s.player.gold - r0, saveOpt: MG.saveOpt().length, pendLater: (onFleet(s, 1520, 11, 10), MG.seaPending()) };
      reset([]); await G.SeaFolk.talk({ exp: ex }, { name: '마가야네스' }); out.J.cold = saidAny(/나눌 말은 없소/);
      // ── 세빌리아에서 항로를 넘기면 믿음이 깎인다
      s = fresh(1518, 6, 1); at(s, 1518, 6, 1, 7); await go(['no', 'spy']); out.K = { spy: b().spy, trust: MG.trust(), noto: s.player.notoriety };
      // ── 옛 저장 · 소문 · 일지 · 말투
      s = fresh(1523, 1, 1); delete s.magellan; out.oldSave = { n: MG.daily().length, told: Object.keys(G.Game.state.magellan.told).length };
      const rum = (G.EVENT_RUMORS || []).find(x => x.id === 'magellan');
      s = fresh(1518, 6, 1); const r1 = rum ? rum.text(s) : []; s.date = { y: 1521, m: 6, d: 1 }; const r2 = rum ? rum.text(s) : [];
      out.rumor = { has: !!rum, five: r1.some(x => /배 다섯 척/.test(x.y) && x.o), gomes: r2.some(x => /산안토니오호/.test(x.y)) };
      s = fresh(1520, 1, 1); MG.state().seen.seville = 'met';
      out.journal = { row: !!(MG.daily && MG.daily._journal), html: /마가야네스의 믿음/.test(MG.html()) && /막탄/.test(MG.html()), court: !!(G.Court && G.Court.taskHtml && /마가야네스/.test(G.Court.taskHtml())) };
      const V = G.VOICES.mg_magellan;
      out.voice = { ok: !!V && V.reg === 'hao' && V.stories.length >= 5 && !V.love && !V.wife, len: [].concat(V.greet.hi, V.greet.mid, V.greet.low, V.chat.hi, V.chat.mid, V.chat.low, V.again, V.drink, [V.drinkDone], V.lifeIntro).every(x => x.length <= 140) };
      s = fresh(1522, 1, 1); s.mates.push({ id: 'mg_magellan', role: 'none', loyal: 90 });
      out.greet = !!(G.Voice && G.Voice.greet(M, s.mates[s.mates.length - 1]));
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.defs.ok && !r.defs.tavern && r.defs.fig, '동료 마가야네스 — 사건으로만(술집에 안 나옴) · 아내가 있어 혼담 없음(wed) · 얼굴 portraits/history/magellan');
    ok(r.pos.can && r.pos.rio && r.pos.pac && r.pos.guam && r.pos.after && r.pos.before, '함대의 자리 — 카나리아 1519.9.26 · 리우 12.13 (seafolk) · 큰 바다 1521.1.24 · 괌 3.7 (PAC) · 떠나기 전·막탄 뒤에는 없다');
    const g = r.gate;
    ok(!g.early && g.on && !g.cadizEarly && g.cadiz && !g.late && !g.lisbon && !g.seaEarly && g.letterFirst, '① 세빌리아 1518.3.22~1519.9.19 (카디스는 8.10부터) · 세랑의 편지가 먼저');
    ok(r.A.seen === 'invest' && r.A.invest === 2000 && r.A.share && r.A.trust === 2 && r.A.paid === 2000 && r.A.faleiro && r.A.cart && r.A.alv && r.A.africa && r.A.again === false, '① 출자(증서) · 알바르스의 금화를 알린다 — 믿음 2');
    ok(r.B.pend && r.B.seen === 'give' && r.B.trust === 3 && r.B.food === 20 && r.B.cart && r.B.again === false && r.B.far === false, '② 대서양 — 함대 곁에서 하루가 끝나면 · 물·식량 20통 · 멀면 열리지 않는다');
    ok(r.C.plata === 'tell' && r.C.trust === 4 && r.C.sweet && r.D.mutiny === 'fight' && r.D.res === 'win' && r.D.trust === 6 && r.D.fight && r.D.elcano && r.D.espinosa, '③ 라플라타(강이오) · ④ 산훌리안의 반란 — 빅토리아호 갑판 18 (믿음 +2)');
    ok(r.E.winter === 'give' && r.E.trust === 7 && r.E.santiago, '⑤ 겨울 — 신호를 보내 「선장과 이야기한다」로도 열린다');
    ok(r.F.strait === 'scout' && r.F.cry && r.F.pacPend && r.F.pac === 'give' && r.F.rat && r.F.guam === 'buy' && r.F.trust === 11, '⑥ 해협 · ⑦ 큰 바다(PAC 항로 곁) · ⑧ 도둑의 섬');
    ok(r.G.pend && r.G.saveDis === false && r.G.date === '4.26' && r.G.rescue === 'saved' && r.G.hired && r.G.astro && r.G.noSell && r.G.fight && r.G.helm && r.G.dead && r.G.smCebu === 'mg' && r.G.smMactan === 'save' && r.G.smClosed, '⑨ 세부 → ⑩ 막탄 — 살린다(26) · 동료 · 아스트롤라베 · 향료제도·막탄의 세부 장면은 닫힌다');
    ok(/투구와 흉갑만/.test(r.G.smNews) && r.news.mut && r.news.pac && r.news.lad && r.news.gom && r.news.cap && r.news.vic && r.news.paid === 3200 && !r.news.share, '소식 — 막탄(몸을 찾지 못했다) · 반란 · 평화의 바다 · 도둑의 섬 · 고메스 · 빅토리아호(몫 3,200 · 그의 한마디)');
    ok(r.H.saveDis === true && r.H.rescue === 'none' && !r.H.hired && r.H.fall && r.H.piga, '믿음이 모자라면 「사령관을 살린다」가 닫혀 있다 — 역사대로');
    ok(r.I.smP && r.I.trust === 3 && r.I.saveOpen && r.I.rescue === 'saved' && r.I.hired && r.I.smMactan === 'save' && r.I.smRes === 'win' && r.I.feast && r.I.en && r.I.seaAfter === false, '향료제도·막탄의 길 — 그 막탄 장면에서 살린다 → 동료 · 세부의 잔치는 그대로');
    ok(r.I2.rescue === 'fail' && !r.I2.hired && r.I2.piga && r.I2.news, '같은 길에서 지면 — 역사대로 쓰러진다 · 소식(닿지 못했다)');
    ok(r.J.foe && r.J.trust === -99 && r.J.gold === 1200 && r.J.saveOpt === 0 && r.J.pendLater === false && r.J.cold && r.K.spy === 'pt' && r.K.trust === -2 && r.K.noto >= 3, '반란자 편이면 적(살릴 수 없다·신호에 등을 돌린다) · 항로를 넘기면 믿음 −2');
    ok(r.oldSave.n === 0 && r.oldSave.told === 8, '옛 저장은 지난 소식을 띄우지 않는다');
    ok(r.rumor.has && r.rumor.five && r.rumor.gomes && r.journal.row && r.journal.html && r.journal.court, '소문 · 일지(소식 줄 · 할 일 — 믿음)');
    ok(r.voice.ok && r.voice.len && r.greet, '말투 — 하오체 · 옛이야기 6 · 연정 말 없음 · 한 줄 140자 이하 · 첫마디');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
