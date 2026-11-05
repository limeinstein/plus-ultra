/* 미남 항해사 — 유럽 (2026-11-05 사용자 요청 「미남 항해사가 나오는 형태로 이벤트를 추가해줘」 — 연애 없이 동료로만) — node tests/beauxeu_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 다비드의 모델 — 작업장(1501.9.13~1504.5.13) → 광장으로(1504.5.14~9.8 · 돌팔매 패) → 토마소가 배에 · 다비드의 돌가루
   · ② 카니발의 곤돌라꾼 — 베니스 1572~1599년 1~2월 · 가면 도둑 · 곤돌라 추격(일기토/육상전) / 변호 → 로렌초가 배에 · 금박 모레타 가면
   · 술집에 안 나온다(eventOnly) · 연애 없음(wed) — 여자 제독이어도 · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.BeauxEU && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, BX = G.BeauxEU, said = [], asked = [], out = {};
      let plan = [], landRes = [], duelRes = [], luck = true;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => luck;
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      G.Games.duel = async (e) => { said.push('[일기토] ' + e.name); return duelRes.length ? duelRes.shift() : 'win'; };
      const fresh = (y, m, d, g) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; if (g) s.player.g = g; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land, duel) => { plan = choices.slice(); landRes = (land || []).slice(); duelRes = (duel || []).slice(); said.length = 0; asked.length = 0; const p = BX.pending(); if (p) await BX.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const T = G.MATE.bx_tommaso, L = G.MATE.bx_lorenzo;
      out.defs = { t: !!T && T.g === 'm' && T.eventOnly && T.wed === 'sea' && T.sk.nav >= 2 && /잘생|얼굴/.test(T.desc), l: !!L && L.g === 'm' && L.eventOnly && L.wed === 'sea' && L.sk.nav >= 3,
        tav: !G.Frontier || (!G.Frontier.mateReady(T, 1520) && !G.Frontier.mateReady(L, 1580)) };
      // ── ① 다비드의 모델
      let s = fresh(1501, 1, 1); const b = () => G.Game.state.beauxEU;
      out.gate = { early: (at(s, 1501, 9, 12, 30), BX.pending()), yard: (at(s, 1502, 3, 1, 30), BX.pending()), other: (at(s, 1502, 3, 1, 29), BX.pending()), moveNoYard: (at(s, 1504, 6, 1, 30), BX.pending()) };
      at(s, 1502, 3, 1, 30); await go(['sling']);
      out.A1 = { yard: b().yard, sling: said.some(x => /싸우기 직전의 다윗/.test(x)), face: said.some(x => /돌 속에 이미 있다/.test(x)), mi: said.some(x => /^미켈란젤로/.test(x)), again: BX.pending() };
      out.A1early = (at(s, 1504, 5, 13, 30), BX.pending());
      at(s, 1504, 5, 20, 30); await go(['fight', 'ship'], ['win']);
      out.A2 = { guard: b().guard, giant: b().giant, tommaso: b().tommaso, hired: hired('bx_tommaso'), marble: G.R.hasItem('bx_marble'), stones: said.some(x => /\[육상전\] 돌팔매 패/.test(x)), sea: said.some(x => /남은 몸은 바다로/.test(x)), after: BX.pending() };
      s.loc = { mode: 'sea', lon: 10, lat: 42 }; s.beauxEU.told = {};
      const day = (y, m, d) => { s.date = { y, m, d }; return BX.daily().map(x => x.text).join(' | '); };
      out.news = { g: day(1501, 9, 13), p: day(1504, 5, 18), u: day(1504, 9, 8) };
      // 토마소를 사양 · 말로 쫓기 실패
      s = fresh(1501, 10, 1); at(s, 1503, 1, 1, 30); await go(['sea']); luck = false; at(s, 1504, 8, 1, 30); await go(['talk', 'no']);
      out.A3 = { yard: b().yard, guard: b().guard, tommaso: b().tommaso, hired: hired('bx_tommaso'), whale: said.some(x => /고래 이야기/.test(x)) };
      luck = true;
      // ── ② 카니발의 곤돌라꾼
      s = fresh(1572, 1, 1);
      out.gateB = { summer: (at(s, 1575, 6, 1, 29), BX.pending()), early: (at(s, 1571, 2, 1, 29), BX.pending()), late: (at(s, 1600, 1, 10, 29), BX.pending()), carn: (at(s, 1580, 2, 1, 29), BX.pending()) };
      at(s, 1580, 2, 1, 29); await go(['chase', 'ship'], [], ['win']);
      out.B1 = { how: b().how, lorenzo: b().lorenzo, hired: hired('bx_lorenzo'), mask: G.R.hasItem('bx_mask'), duel: said.some(x => /\[일기토\] 곤돌라꾼 주세페/.test(x)), lepanto: said.some(x => /레판토/.test(x)), handsome: said.some(x => /얼굴 반반한/.test(x)), again: (at(s, 1581, 1, 10, 29), BX.pending()) };
      // 추격 실패 → 패거리와 육상전
      s = fresh(1572, 1, 1); luck = false; at(s, 1590, 1, 5, 29); await go(['chase', 'ship'], ['win']);
      out.B2 = { mask: G.R.hasItem('bx_mask'), gang: said.some(x => /\[육상전\] 주세페의 패거리/.test(x)), hired: hired('bx_lorenzo') };
      // 변호 → 사양
      s = fresh(1572, 1, 1); luck = true; at(s, 1585, 1, 20, 29); await go(['plead', 'no']);
      out.B3 = { how: b().how, lorenzo: b().lorenzo, hired: hired('bx_lorenzo'), mask: G.R.hasItem('bx_mask'), palm: said.some(x => /굳은살/.test(x)) };
      // ── 연애 없음 — 여자 제독이어도 청혼·짝짓기 대상이 아니다
      s = fresh(1580, 1, 1, 'f'); at(s, 1580, 1, 10, 29); await go(['chase', 'ship'], [], ['win']);
      out.noLove = { hired: hired('bx_lorenzo'), romanceSkip: !!G.MATE.bx_lorenzo.wed };
      if (G.MateTalk && G.MateTalk.talk) {
        const m = s.mates.find(x => x.id === 'bx_lorenzo'); m.aff = 99;
        plan = []; asked.length = 0; said.length = 0;
        try { await G.MateTalk.talk(29, m); } catch (e) {}
        out.noLove.propose = asked.some(a => a.opts.indexOf('wed') >= 0); out.noLove.asked = asked.length;
      }
      // ── 옛 저장 · 소문 · 일지 · 말투
      s = fresh(1600, 1, 1); delete s.beauxEU; out.oldSave = BX.daily().length; out.oldTold = Object.keys(s.beauxEU.told).length;
      out.rumor = ['beauxeu_david', 'beauxeu_carnival'].every(id => (G.EVENT_RUMORS || []).find(x => x.id === id));
      out.journal = !!(BX.daily && BX.daily._journal);
      const V = G.VOICES || {};
      out.voice = ['bx_tommaso', 'bx_lorenzo'].every(id => V[id] && V[id].stories && V[id].stories.length >= 4 && !V[id].love && !V[id].wife);
      return out;
    });
    console.log(JSON.stringify({ A1: r.A1, A2: r.A2, A3: r.A3, B1: r.B1, B2: r.B2, B3: r.B3, noLove: r.noLove }));
    ok(r.defs.t && r.defs.l && r.defs.tav, '토마소·로렌초 — 남자 · 항해 특기 · 사건으로만(술집에 없음) · 연애 없음(wed: sea)');
    ok(!r.gate.early && r.gate.yard && !r.gate.other && !r.gate.moveNoYard, '① 작업장은 피렌체 1501.9.13~ · 작업장을 안 보면 광장 장면도 없다');
    ok(r.A1.yard === 'sling' && r.A1.sling && r.A1.face && r.A1.mi && !r.A1.again && !r.A1early, '① 작업장 — 미켈란젤로 · 「돌 속에 이미 있다」 · 돌팔매 조언 (한 번만 · 광장은 5.14부터)');
    ok(r.A2.guard === 'win' && r.A2.giant && r.A2.tommaso === 'ship' && r.A2.hired && r.A2.marble && r.A2.stones && r.A2.sea && !r.A2.after, '① 광장으로 — 돌팔매 패를 막고 · 「남은 몸은 바다로」 · 토마소가 배에 · 다비드의 돌가루');
    ok(/거인/.test(r.news.g) && /시뇨리아 광장/.test(r.news.p) && /이방인 선원/.test(r.news.p) && /바다로 갔다/.test(r.news.u), '소식 — 거인 · 광장(지킨 선원) · 다비드 제막(모델은 바다로)');
    ok(r.A3.yard === 'sea' && r.A3.whale && r.A3.guard === 'lose' && r.A3.tommaso === 'no' && !r.A3.hired, '바다 이야기 → 고래 이야기 · 말로 쫓기 실패 · 사양하면 태우지 않는다');
    ok(!r.gateB.summer && !r.gateB.early && !r.gateB.late && r.gateB.carn, '② 카니발 — 베니스 1572~1599년 1~2월에만');
    ok(r.B1.how === 'chase' && r.B1.duel && r.B1.mask && r.B1.lorenzo === 'ship' && r.B1.hired && r.B1.lepanto && r.B1.handsome && !r.B1.again, '② 곤돌라 추격 → 주세페와 일기토 · 금박 모레타 가면 · 로렌초가 배에 (한 번만)');
    ok(r.B2.gang && r.B2.mask && r.B2.hired, '추격을 놓치면 주세페의 패거리와 육상전 → 이기면 가면');
    ok(r.B3.how === 'plead' && r.B3.palm && !r.B3.mask && r.B3.lorenzo === 'no' && !r.B3.hired, '변호 — 레판토의 굳은살 · 가면 없이 · 사양');
    ok(r.noLove.hired && r.noLove.romanceSkip && r.noLove.propose === false && r.noLove.asked > 0, '여자 제독이어도 연애·청혼 없음');
    ok(r.oldSave === 0 && r.oldTold === 3 && r.rumor && r.journal && r.voice, '옛 저장(지난 소식은 조용히) · 소문 2 · 일지 · 말투 2');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
