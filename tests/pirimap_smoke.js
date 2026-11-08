/* 피리 레이스의 해도 — 이스탄불 · 산 브랜던 · 산토도밍고 · 바이아 · 아브롤류스의 보물 (2026-11-08)
   node tests/pirimap_smoke.js */
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
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const PM = G.PiriMap, K = G.BALANCE.pirimap, out = {}, said = [], asks = [], lands = [];
      let picks = [], landRes = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value == want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      G.Scenes.land.landBattle = async (name, n) => { lands.push(name + ':' + n); return landRes; };
      function fresh(at, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, (o && o.sk) || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y: (o && o.y) || 1570, m: 3, d: 1 }; s.player.gold = 10000; s.fleet.cargo = {}; s.player.items = []; s.fleet.food = 60; s.fleet.water = 60;
        G.Fame.add('ex', (o && o.fame != null) ? o.fame : 5000);
        go(at); said.length = 0; asks.length = 0; lands.length = 0; return s;
      }
      function go(at) { const s = G.Game.state; if (typeof at === 'number') { const c = G.CITY_DATA[at]; s.loc = { mode: 'city', city: at, lon: c.lon, lat: c.lat }; } else s.loc = { mode: 'sea', lon: at[0], lat: at[1] }; }
      const box = b => [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2];
      const hasItem = id => G.Game.state.player.items.some(x => x.id === id);
      out.data = { figs: G.PIRIMAP_FIGS.every(id => G.HIST_FIG[id] && G.HIST_FIG[id].look), mate: !!(G.MATE.leyla && G.MATE.leyla.eventOnly), items: ['pr_family_map', 'pr_astrolabe', 'pr_red_note'].every(id => G.ITEM[id]), cities: [112, 194, 215, 88].map(c => G.CITY_DATA[c].name).join() };
      // 조건: 1555년 뒤 · 명성 · 이스탄불
      let s = fresh(112, { y: 1550 }); out.early = PM.pending();
      s = fresh(112, { fame: 1000 }); out.lowFame = PM.pending();
      s = fresh(1); out.elsewhere = PM.pending();
      // ① 사양 → 180일 뒤
      s = fresh(112); out.pend = PM.pending(); picks = ['no']; await PM.check(); out.decl = { step: s.pirimap.step, again: PM.pending() }; s.day += 181; out.declBack = PM.pending();
      // ① 함께 간다
      picks = ['go']; await PM.check(); out.start = { step: s.pirimap.step, map: hasItem('pr_family_map'), leyla: said.some(t => t.startsWith('레일라 피리자데|') && /붉은 점/.test(t)), again: PM.pending() };
      // ② 산 브랜던 — 고래를 따라간다 (용연향)
      go([-14, 28.5]); out.offBox = PM.seaPending();
      go(box(K.brendan.box)); out.bPend = PM.seaPending(); const f0 = s.fleet.food; picks = ['follow']; await PM.atSea();
      out.brendan = { step: s.pirimap.step, amb: s.fleet.cargo.ambergris && s.fleet.cargo.ambergris.q, food: f0 - s.fleet.food, whale: said.some(t => /향유고래/.test(t)) };
      // ③ 산토도밍고 — 말솜씨가 없으면 설득은 막힌다 · 기부
      go(194); out.dPend = PM.pending(); const g0 = s.player.gold; picks = ['gift']; await PM.check();
      out.domingo = { opts: asks[asks.length - 1].o.join(), step: s.pirimap.step, paid: g0 - s.player.gold, how: s.pirimap.how[3], col: said.some(t => /카브랄의 배/.test(t)) };
      // ④ 바이아 — 수로안내인
      go(215); const g1 = s.player.gold; picks = ['pilot']; await PM.check();
      out.bahia = { step: s.pirimap.step, pilot: s.pirimap.pilot, paid: g1 - s.player.gold, abre: said.some(t => /abre os olhos/.test(t)) };
      // ⑤ 아브롤류스 — 수로안내인이 있으면 선체가 멀쩡 · 사냥꾼과 싸워 이긴다 · 보물 · 레일라 동료
      go(box(K.abrolhos.box)); const hp0 = s.fleet.ships[0].hp, g2 = s.player.gold; picks = ['join']; await PM.atSea();
      out.abrolhos = { hp: s.fleet.ships[0].hp === hp0, land: lands.join(), gold: s.player.gold - g2, gems: s.fleet.cargo.gems && s.fleet.cargo.gems.q, astro: hasItem('pr_astrolabe'), note: hasItem('pr_red_note'), step: s.pirimap.step, joined: s.mates.some(m => m.id === 'leyla'), again: PM.seaPending(), cityAgain: (go(112), PM.pending()) };
      // 다른 길: 산토도밍고에 몰래 · 바이아에서 혼자 · 아브롤류스에서 진다 → 30일 뒤 싸움 없이 보물 · 레일라는 돌아간다
      s = fresh(194); s.pirimap = { step: 2, how: {} }; landRes = 'lose'; const n0 = s.player.notoriety || 0; picks = ['sneak']; await PM.check();
      out.sneak = { step: s.pirimap.step, land: lands.join(), noto: (s.player.notoriety || 0) - n0 };
      go(215); picks = ['self']; await PM.check(); out.self = s.pirimap.pilot;
      go(box(K.abrolhos.box)); const hp1 = s.fleet.ships[0].hp, mx = s.fleet.ships[0].maxHp; lands.length = 0; await PM.atSea();
      out.lose = { reef: Math.round(hp1 - s.fleet.ships[0].hp) === Math.round(mx * K.abrolhos.reef), lost: s.pirimap.lost, step: s.pirimap.step, cool: PM.seaPending() };
      s.day += 31; landRes = 'win'; lands.length = 0; const g3 = s.player.gold; picks = ['home']; await PM.atSea();
      out.second = { land: lands.length, gold: s.player.gold - g3, step: s.pirimap.step, joined: s.mates.some(m => m.id === 'leyla'), empty: said.some(t => /버려진 삽/.test(t)) };
      // 짐칸이 모자라면 보석 대신 그 값만큼 금화
      s = fresh(215); s.pirimap = { step: 4, how: {}, pilot: true }; s.fleet.food = 99999; go(box(K.abrolhos.box)); const g4 = s.player.gold; picks = ['home']; await PM.atSea();
      out.full = { gems: s.fleet.cargo.gems ? s.fleet.cargo.gems.q : 0, gold: s.player.gold - g4 };
      // 소문
      const R0 = (G.EVENT_RUMORS || []).filter(x => /^pr_/.test(x.id)); out.rumors = R0.length;
      s = fresh(112); out.rLive0 = R0.filter(x => x.live(s)).map(x => x.id).join(); s.pirimap = { step: 3 }; out.rLive3 = R0.filter(x => x.live(s)).map(x => x.id).join();
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    const K = { gold: 50000, gems: 20 };
    ok(r.data.figs && r.data.mate && r.data.items && r.data.cities === '이스탄불,산토도밍고,바이앙,라스팔마스', '인물 4 · 레일라(사건 동료) · 아이템 3');
    ok(!r.early && !r.lowFame && !r.elsewhere, '1555년 전 · 명성이 모자라거나 다른 도시면 없다');
    ok(r.pend && r.decl.step === 0 && !r.decl.again && r.declBack, '① 이스탄불 — 사양하면 180일 뒤 다시');
    ok(r.start.step === 1 && r.start.map && r.start.leyla && !r.start.again, '① 레일라 피리자데 — 집안의 해도 사본 · 붉은 점');
    ok(!r.offBox && r.bPend && r.brendan.step === 2 && r.brendan.amb === 6 && r.brendan.food > 0 && r.brendan.whale, '② 산 브랜던의 섬 — 고래를 따라가 용연향 6통');
    ok(r.dPend && /talk!/.test(r.domingo.opts) && r.domingo.step === 3 && r.domingo.paid === 3000 && r.domingo.how === 'gift' && r.domingo.col, '③ 산토도밍고 — 설득은 말솜씨가 있어야 · 기부 3,000 · 콜롬보의 지도');
    ok(r.bahia.step === 4 && r.bahia.pilot === true && r.bahia.paid === 2000 && r.bahia.abre, '④ 바이아 — 「눈을 떠라」 · 수로안내인 2,000');
    ok(r.abrolhos.hp && r.abrolhos.land.startsWith('돈 로드리고의 보물 사냥꾼들:60') && r.abrolhos.gold === K.gold && r.abrolhos.gems === K.gems && r.abrolhos.astro && r.abrolhos.note && r.abrolhos.step === 5 && r.abrolhos.joined && !r.abrolhos.again && !r.abrolhos.cityAgain, '⑤ 아브롤류스 — 사냥꾼을 물리치고 금화 50,000 · 보석 20통 · 아스트롤라베 · 레일라 동료');
    ok(r.sneak.step === 3 && r.sneak.land.startsWith('산토도밍고 총독의 경비병') && r.sneak.noto === 3 && r.self === false, '③ 몰래 들어가다 쫓겨도 한 장은 건진다(악명 +3) · ④ 혼자 간다');
    ok(r.lose.reef && r.lose.lost && r.lose.step === 4 && !r.lose.cool, '⑤ 수로안내인이 없으면 암초에 긁힌다 · 지면 30일');
    ok(r.second.land === 0 && r.second.gold === K.gold && r.second.step === 5 && !r.second.joined && r.second.empty, '⑤ 30일 뒤 — 사냥꾼은 떠났다, 싸움 없이 보물 · 레일라는 돌아간다');
    ok(r.full.gems === 0 && r.full.gold === K.gold + 20 * 210, '짐칸이 모자라면 보석 값만큼 금화');
    ok(r.rumors === 4 && r.rLive0 === 'pr_leyla' && r.rLive3 === 'pr_abrolhos', '거리 소문 4 — 단계마다');
    ok(errors.length === 0, '페이지 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fail ? '\n실패 ' + fail : '\n모두 통과');
  process.exit(fail ? 1 : 0);
})();
