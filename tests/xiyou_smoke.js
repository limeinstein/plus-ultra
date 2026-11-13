/* 서유기 — 네 아가씨의 천축 길 (2026-11-13)
   node tests/xiyou_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.join(ROOT, 'index.html')).href), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const XY = G.XiYou, K = G.BALANCE.xiyou, out = {}, said = [], asks = [], lands = [], seas = [];
      let picks = [], landRes = 'win', seaRes = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value == want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      G.UI.fade = async fn => { if (fn) await fn(); };
      G.Scenes.land.landBattle = async (name, n, beasts) => { lands.push(name + ':' + n + (beasts ? ':b' : '')); return landRes; };
      G.Game.go = (scene, o) => { seas.push(o.npc); G.Rel.afterBattle(o.npc, seaRes, []); };
      const L = G.DISCOVERIES;
      const pickId = f => (L.find(f) || {}).id;
      const KR = pickId(d => d.reg === 6 && d.lon >= 124.4 && d.lon <= 131 && d.lat >= 33 && d.lat <= 43.1), CN = pickId(d => d.reg === 6 && d.lon < 122), JP = pickId(d => d.reg === 9);
      out.picks = [KR, CN, JP].join();
      function fresh(at, o) {
        o = o || {};
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, o.sk || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = o.date || { y: 1640, m: 3, d: 1 }; s.player.gold = 10000; s.player.items = []; s.fleet.food = 80; s.fleet.water = 60;
        s.disc = s.disc || {};
        (o.disc || ['indiaroute', KR, CN, JP]).forEach(id => { s.disc[id] = Object.assign(s.disc[id] || {}, { found: true, me: true }); });
        go(at); said.length = 0; asks.length = 0; lands.length = 0; seas.length = 0; return s;
      }
      function go(at) { const s = G.Game.state; if (typeof at === 'number') { const c = G.CITY_DATA[at]; s.loc = { mode: 'city', city: at, lon: c.lon, lat: c.lat }; } else s.loc = { mode: 'sea', lon: at[0], lat: at[1] }; }
      const box = b => [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2];
      const hasItem = id => G.Game.state.player.items.some(x => x.id === id);
      const mate = id => G.Game.state.mates.some(m => m.id === id);
      const FOUR = ['xy_misu', 'xy_yukino', 'xy_mungun', 'xy_naing'];
      out.data = { figs: G.XIYOU_FIGS.every(id => G.HIST_FIG[id]), mates: FOUR.every(id => G.MATE[id] && G.MATE[id].eventOnly && G.MATE[id].g === 'f'), cook: G.MATE.xy_naing.sk.cook === 3, theo: G.MATE.xy_misu.sk.theo === 3, items: ['xy_last_sutra', 'xy_golden_staff', 'xy_butterfly_pin', 'xy_curry_recipe'].every(id => G.ITEM[id]), cities: [192, 177, 162, 160, 152].map(c => G.CITY_DATA[c].name).join() };

      // 조건 — 통신사 · 인도항로 · 중국 · 조선 · 일본
      let s = fresh(192, { date: { y: 1630, m: 1, d: 1 } }); out.early = XY.cityStep();
      s = fresh(192, { date: { y: 1630, m: 1, d: 1 } }); s.beauxEA = { mu: 1, told: {} }; out.muOK = XY.cityStep();
      s = fresh(192, { disc: ['indiaroute', CN, JP] }); out.noKr = XY.lacks().join(); out.hintStep = XY.cityStep(); await XY.check(); out.hint = { told: said.some(t => /인연이 익으면/.test(t)), again: XY.pending() };
      s = fresh(192, { disc: [KR, CN, JP] }); out.noIndia = XY.lacks().join();
      s = fresh(29); out.elsewhere = XY.pending();
      // ① 사카이 — 사양 → 180일
      s = fresh(192); picks = ['chant', 'no']; await XY.check(); out.decl = { step: s.xiyou.step, again: XY.pending() }; s.day += 181; out.declBack = XY.pending();
      // ① 다시 — 낭인과 싸운다 → 태운다
      picks = ['fight', 'go']; await XY.check();
      out.sakai = { step: s.xiyou.step, land: lands.join(), circlet: said.some(t => t.startsWith('유키노|') && /금테/.test(t)), misu: said.some(t => t.startsWith('최미수|') && /천축/.test(t)), again: XY.pending() };
      // ② 항주 — 웅변이 없으면 말로는 못 쫓는다 → 싸운다 → 넷이 모인다 · 보물 지도
      go(177); picks = ['talk']; await XY.check();
      out.hz = { talkDis: /talk!/.test(asks[asks.length - 1].o.join()), land: lands.join(), step: s.xiyou.step, map: s.xiyou.map, mishear: said.some(t => t.startsWith('뭉군|') && /천 마리 가축/.test(t)), naing: said.some(t => t.startsWith('나잉|') && /수렴동/.test(t)) };
      // 곁길 — 화과산 수렴동
      go([125, 30]); out.hgOff = XY.seaPending();
      go(box(K.huaguo.box)); const g0 = s.player.gold; await XY.atSea(); out.hg = { gold: s.player.gold - g0, staff: hasItem('xy_golden_staff'), done: !!s.xiyou.mapDone, again: XY.seaPending() };
      // ③ 아유타야 — 나비를 따라간다
      go(162); const g1 = s.player.gold; picks = ['butterfly']; await XY.check(); out.ay = { step: s.xiyou.step, pin: hasItem('xy_butterfly_pin'), paid: g1 - s.player.gold, sate: said.some(t => /꼬치/.test(t)) };
      // ④ 말라카 — 흑풍대왕
      go(160); await XY.check(); out.ml = { step: s.xiyou.step, land: lands.join(), sold: said.some(t => /왜구 두목 구로나미/.test(t)) };
      // ⑤ 말라카 해협 — 왜구 (지면 30일 · 이기면 나잉)
      go(box(K.wokou.box)); out.wkPend = XY.seaPending(); seaRes = 'lose'; picks = ['fight']; await XY.atSea();
      out.wkLose = { key: seas[0] && seas[0].great, ships: seas[0] && seas[0].ships.join(), boss: seas[0] && seas[0].boss.hist, step: s.xiyou.step, cool: XY.seaPending() };
      s.day += 31; seaRes = 'win'; const g2 = s.player.gold; picks = ['fight']; await XY.atSea();
      out.wk = { gold: s.player.gold - g2, after: s.xiyou.after, key: seas[1] && seas[1].great };
      await XY.atSea(); out.after = { step: s.xiyou.step, after: s.xiyou.after, back: said.some(t => t.startsWith('나잉|') && /쌀을 다 먹어 치웠더니/.test(t)) };
      // ⑥ 인도 — 카레 → 넷 모두 동료
      go(154); out.cPend = XY.cityStep(); await XY.check();
      out.end = { mates: FOUR.every(mate), sutra: hasItem('xy_last_sutra'), recipe: hasItem('xy_curry_recipe'), step: s.xiyou.step, curry: said.some(t => /카레/.test(t)), blank: said.some(t => /무자진경/.test(t)), again: XY.pending() };
      // 다른 길: 금화로 물림 · 웅변으로 쫓음 · 뱃사공 · 탑 · 흑풍대왕에게 지면 30일
      s = fresh(192, { sk: { speech: 2 } }); picks = ['pay', 'go']; await XY.check(); out.pay = 10000 - s.player.gold;
      go(177); picks = ['talk']; await XY.check(); out.talk = { land: lands.length, step: s.xiyou.step };
      go(162); picks = ['boat']; const g3 = s.player.gold; await XY.check(); out.boat = g3 - s.player.gold;
      go(160); landRes = 'lose'; await XY.check(); out.mlLose = { step: s.xiyou.step, again: XY.pending() }; s.day += 31; landRes = 'win'; await XY.check(); out.mlWin = s.xiyou.step;
      // 소문
      const R0 = (G.EVENT_RUMORS || []).filter(x => /^xy_/.test(x.id)); out.rumors = R0.length;
      s = fresh(192); out.rLive = R0.filter(x => x.live(s)).map(x => x.id).join();
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.data.figs && r.data.mates && r.data.cook && r.data.theo && r.data.items && r.data.cities === '사카이,항주,아유타야,말라카,캘리컷', '인물 · 네 아가씨(미수 신학 3 · 나잉 요리 3) · 아이템 4 (' + r.picks + ')');
    ok(r.early === null && r.muOK === 'start', '조선 통신사 — 1637년 봄 전에는 없다 · 에도의 마상재를 겪었으면 연다');
    ok(/조선의 발견물/.test(r.noKr) && r.hintStep === 'hint' && r.hint.told && !r.hint.again && /인도항로/.test(r.noIndia) && !r.elsewhere, '인도항로 · 중국 · 조선 · 일본의 발견물이 있어야 · 모자라면 사카이에서 한 번 귀띔');
    ok(r.decl.step === 0 && !r.decl.again && r.declBack, '① 사양하면 180일 뒤');
    ok(r.sakai.step === 1 && r.sakai.land.startsWith('사카이의 낭인 패거리:30') && r.sakai.circlet && r.sakai.misu && !r.sakai.again, '① 사카이 — 불경 수레의 낭인들 · 유키노의 금테 · 미수와 유키노를 태운다');
    ok(r.hz.talkDis && r.hz.land.indexOf('소금 상인의 건달들:24') >= 0 && r.hz.step === 2 && r.hz.map === 1 && r.hz.mishear && r.hz.naing, '② 항주 — 서호의 건달들 · 뭉군(사오정)과 나잉(저팔계) · 보물 지도');
    ok(!r.hgOff && r.hg.gold === 20000 && r.hg.staff && r.hg.done && !r.hg.again, '곁길 — 화과산 수렴동의 보물 (금화 20,000 · 금테 쇠막대)');
    ok(r.ay.step === 3 && r.ay.pin && r.ay.paid === 300 && r.ay.sate, '③ 아유타야 — 사라진 나잉 · 나비를 따라 · 꼬치 값');
    ok(r.ml.step === 4 && r.ml.land.indexOf('흑풍대왕의 산적 떼:45') >= 0 && r.ml.sold, '④ 말라카 — 납치된 나잉 · 산적 두목 흑풍대왕 → 왜구에게 팔렸다');
    ok(r.wkPend && r.wkLose.key === 'xy_wokou_1' && r.wkLose.ships === 'sekibune,kobaya,kobaya,junk' && r.wkLose.boss === 'xy_wokou' && r.wkLose.step === 4 && !r.wkLose.cool && r.wk.gold >= 15000 && r.wk.after === 1 && r.wk.key === 'xy_wokou_2' && r.after.step === 5 && !r.after.after && r.after.back, '⑤ 말라카 해협의 왜구 — 지면 30일 · 이기면 나잉을 구한다');
    ok(r.cPend === 'curry' && r.end.mates && r.end.sutra && r.end.recipe && r.end.step === 6 && r.end.curry && r.end.blank && !r.end.again, '⑥ 인도 — 카레 잔치 · 글 없는 마지막 권 · 네 아가씨 모두 동료');
    ok(r.pay === 1500 && r.talk.land === 0 && r.talk.step === 2 && r.boat === 1300 && r.mlLose.step === 3 && !r.mlLose.again && r.mlWin === 4, '다른 길: 금화로 물림 · 웅변 · 뱃사공 · 흑풍대왕에게 지면 30일');
    ok(r.rumors === 4 && r.rLive === 'xy_start', '거리 소문 4');
    ok(errors.length === 0, '페이지 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fail ? '\n실패 ' + fail : '\n모두 통과');
  process.exit(fail ? 1 : 0);
})();
