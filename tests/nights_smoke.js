/* 천일야화의 세 이야기 — 신드바드의 모험 · 하룬 알 라시드의 밤 산책 · 흑단 말 (2026-11-08)
   node tests/nights_smoke.js */
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
      const N = G.Nights, K = G.BALANCE.nights, out = {}, said = [], asks = [], lands = [];
      let picks = [], landRes = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value == want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      G.Scenes.land.landBattle = async (name, n, beasts) => { lands.push(name + ':' + n + (beasts ? ':b' : '')); return landRes; };
      function fresh(at, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, (o && o.sk) || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: (o && o.cha) || 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y: 1560, m: 3, d: 1 }; s.player.gold = 10000; s.fleet.cargo = {}; s.player.items = []; s.fleet.food = 80; s.fleet.water = 60;
        G.Fame.add('ex', (o && o.fame != null) ? o.fame : 3000);
        if (!(o && o.sche === false)) s.legend = { sche: { done: 1 } };   // 셰헤라자드 해금
        s.visited = (o && o.visited) || { 126: 1, 155: 1 };
        if (!(o && o.title === false)) s.court = { titles: { PT: 1 } };
        ((o && o.mates) || []).forEach(id => s.mates.push({ id: id, role: 'none', loyal: 80 }));
        go(at); said.length = 0; asks.length = 0; lands.length = 0; return s;
      }
      function go(at) { const s = G.Game.state; if (typeof at === 'number') { const c = G.CITY_DATA[at]; s.loc = { mode: 'city', city: at, lon: c.lon, lat: c.lat }; } else s.loc = { mode: 'sea', lon: at[0], lat: at[1] }; }
      const box = b => [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2];
      const hasItem = id => G.Game.state.player.items.some(x => x.id === id);
      const mate = id => G.Game.state.mates.some(m => m.id === id);
      const FX = G.MATES.filter(m => (m.sk.ops || 0) >= 2 && (m.sk.sci || 0) >= 2 && (m.st[3] || 0) < 80)[0], CH = G.MATES.filter(m => !m.eventOnly && (m.st[3] || 0) >= 85 && !(m.sk.ops >= 2 && m.sk.sci >= 2))[0];
      out.fx = FX && FX.id; out.ch = CH && CH.id;
      out.data = { figs: G.NIGHTS_FIGS.every(id => G.HIST_FIG[id]), mates: G.MATE.sinbad.sk.nav === 3 && G.MATE.sinbad.eventOnly && G.MATE.qamar.eventOnly, sp: !!G.SPONSOR.ar_harun, items: ['an_valley_diamond', 'an_roc_feather', 'an_khilat', 'an_ebony_key', 'an_sanaa_pearls'].every(id => G.ITEM[id]), cities: [126, 127, 129, 130, 155].map(c => G.CITY_DATA[c].name).join() };

      // ① 신드바드 — 명성 · 사양 · 태운다
      let s = fresh(126, { fame: 500 }); out.sbLow = N.pending();
      s = fresh(126, { sche: false }); out.sbNoSche = N.pending();
      s = fresh(126, { visited: { 126: 1 } }); out.sbHintPend = N.cityStep(); await N.check(); out.sbHint = { told: said.some(t => /세렌디브에 가 본 적/.test(t)), again: N.pending(), step: s.nights.sinbad.step, ready: N.ready('sinbad') };
      s = fresh(126); picks = ['no']; await N.check(); out.sbDecl = { step: s.nights.sinbad.step, again: N.pending() }; s.day += 181; out.sbBack = N.pending();
      picks = ['go']; await N.check(); out.sb1 = { step: s.nights.sinbad.step, face: said.some(t => t.startsWith('뱃사람 신드바드|')) };
      // 고래 섬 — 끝까지 건진다 (선원 그대로 · 선체 12%)
      go([60, 15]); out.whaleOff = N.seaPending();
      go(box(K.sinbad.whale.box)); const crew0 = s.fleet.crew, hp0 = s.fleet.ships[0].hp, mx = s.fleet.ships[0].maxHp; picks = ['save']; await N.atSea();
      out.whale = { step: s.nights.sinbad.step, crew: s.fleet.crew === crew0, hp: Math.round(hp0 - s.fleet.ships[0].hp) === Math.round(mx * K.sinbad.whale.hpSave), fire: said.some(t => /불은 안 돼/.test(t)) };
      // 로크의 알 — 깃털만
      go(box(K.sinbad.roc.box)); picks = ['feather']; await N.atSea(); out.roc = { step: s.nights.sinbad.step, feather: hasItem('an_roc_feather') };
      // 콜롬보 — 고깃덩이 → 보석 · 큰 다이아몬드 → 동료
      go(155); out.vPend = N.pending(); picks = ['meat', 'join']; await N.check();
      out.valley = { gems: s.fleet.cargo.gems && s.fleet.cargo.gems.q, dia: hasItem('an_valley_diamond'), mate: mate('sinbad'), step: s.nights.sinbad.step, again: N.pending() };
      // 다른 길: 닻줄을 끊는다(선원을 잃는다) · 알을 깬다(바위) · 골짜기로 내려간다(뱀)
      s = fresh(126); s.nights = { sinbad: { step: 1 } }; go(box(K.sinbad.whale.box)); const c1 = s.fleet.crew; picks = ['cut']; await N.atSea(); out.cut = c1 - s.fleet.crew;
      go(box(K.sinbad.roc.box)); const c2 = s.fleet.crew, h2 = s.fleet.ships[0].hp; picks = ['break']; await N.atSea(); out.brk = { crew: c2 - s.fleet.crew, hp: h2 - s.fleet.ships[0].hp, gems: s.fleet.cargo.gems && s.fleet.cargo.gems.q, rock: said.some(t => /바위/.test(t)) };
      go(155); picks = ['dive', 'bye']; await N.check(); out.dive = { land: lands.join(), gems: s.fleet.cargo.gems && s.fleet.cargo.gems.q, mate: mate('sinbad'), step: s.nights.sinbad.step };

      // ② 하룬 알 라시드 — 후원자는 그전에는 없다 · 술값을 낸다 → 후원자
      s = fresh(127, { title: false }); out.hNoTitle = N.pending() || N.ready('harun');
      s = fresh(127, { sche: false }); out.hNoSche = N.pending();
      s = fresh(127); out.title = !!G.Court.best(); out.spBefore = G.Sponsor.present(G.SPONSOR.ar_harun); out.hPend = N.pending();
      const g0 = s.player.gold; picks = ['pay']; await N.check();
      const rl = G.Sponsor.rel('ar_harun');
      out.harun = { paid: g0 - s.player.gold, done: !!s.nights.harun.done, robe: hasItem('an_khilat'), sp: G.Sponsor.present(G.SPONSOR.ar_harun), trust: rl.trust, met: rl.met, name: G.Sponsor.holderName(G.SPONSOR.ar_harun), again: N.pending(), reveal: said.some(t => t.startsWith('모술의 상인|') && /하룬 알 라시드/.test(t)), jafar: said.some(t => t.startsWith('자파르|')),
        bld: G.Scenes.city.buildings ? G.Scenes.city.buildings(G.CITY_DATA[127]).filter(x => x.kind === 'mansion').map(x => x.name).join() : '?' };
      s = fresh(127); picks = ['talk']; await N.check(); out.hTalkDis = /talk!/.test(asks[0].o.join());
      s = fresh(127); picks = ['no']; await N.check(); out.hNo = { done: !!s.nights.harun.done, again: N.pending() };
      s = fresh(127, { sk: { speech: 2 } }); picks = ['talk']; await N.check(); out.hTalk = !!s.nights.harun.done;
      s = fresh(127); landRes = 'lose'; picks = ['fight']; await N.check(); out.hLose = { done: !!s.nights.harun.done, land: lands.join() }; landRes = 'win';

      // ③ 흑단 말 — 운용술·과학 동료 + 매력 80 · 모자라면 한 번 귀띔
      s = fresh(129, { cha: 90 }); out.eNoFx = N.cityStep(); await N.check(); out.eHint1 = { toast: said.some(t => /톱니만 알아서도/.test(t)), again: N.pending() };
      s = fresh(129, { mates: [FX.id] }); out.eNoCh = N.cityStep(); await N.check(); out.eHint2 = said.some(t => /볼일 없소/.test(t));
      s = fresh(129, { mates: [FX.id], cha: 90, sche: false }); out.eNoSche = N.pending();
      s = fresh(129, { mates: [FX.id, CH.id] }); out.eMateCh = N.cityStep() === 'ebShiraz' && N.ready('ebony');
      s = fresh(129, { mates: [FX.id], cha: 85 }); out.ePend = N.pending(); picks = ['no']; await N.check(); out.eNo = { opts: asks[0].o.join(), step: s.nights.ebony.step, again: N.pending() };
      s = fresh(129, { mates: [FX.id], cha: 85, sk: { med: 1 } }); picks = ['fix']; await N.check(); out.eFix = { step: s.nights.ebony.step, mate: mate('qamar'), key: hasItem('an_ebony_key'), gold: s.player.gold, fixer: said.some(t => t.indexOf(FX.name) >= 0 && /톱니 수를 세고/.test(t)) };
      go(130); out.iPend = N.pending();
      picks = ['doctor']; await N.check();
      out.isf = { step: s.nights.ebony.step, pearls: hasItem('an_sanaa_pearls'), mate: mate('qamar') && mate('nadira'), fly: said.some(t => /솟아오른다/.test(t)), shams: said.some(t => t.startsWith('나디라 알 사나니|') && /담장/.test(t)), nadiraNav: G.MATE.nadira && G.MATE.nadira.eventOnly && G.MATE.nadira.sk.speech === 3, land: lands.length, again: N.pending() };
      s = fresh(129, { mates: [FX.id, CH.id] }); picks = ['fix']; await N.check(); out.eFix2 = s.nights.ebony.step;
      go(130); picks = ['storm']; await N.check(); out.storm = { land: lands.join(), step: s.nights.ebony.step, nadira: mate('nadira') };
      // 소문
      const R0 = (G.EVENT_RUMORS || []).filter(x => /^an_/.test(x.id)); out.rumors = R0.length;
      s = fresh(127); out.rLive = R0.filter(x => x.live(s)).map(x => x.id).join();
      s = fresh(127, { sche: false }); out.rLiveNo = R0.filter(x => x.live(s)).map(x => x.id).join();
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.data.figs && r.data.mates && r.data.sp && r.data.items && r.data.cities === '바스라,바그다드,시라즈,이스파한,콜롬보', '인물 7 · 신드바드(항해술 3) · 카마르 · 칼리프 후원자 · 아이템 5');
    ok(!r.sbNoSche && r.sbHintPend === 'sbHint' && r.sbHint.told && !r.sbHint.again && r.sbHint.step === 0 && !r.sbHint.ready, '① 셰헤라자드가 해금되어야 · 콜롬보에 다녀오지 않았으면 한 번 귀띔');
    ok(!r.sbLow && r.sbDecl.step === 0 && !r.sbDecl.again && r.sbBack && r.sb1.step === 1 && r.sb1.face, '① 바스라 — 명성 · 사양하면 180일 · 신드바드를 태운다');
    ok(!r.whaleOff && r.whale.step === 2 && r.whale.crew && r.whale.hp && r.whale.fire, '① 오만 앞바다 — 섬이 된 고래 · 선원을 끝까지 건진다');
    ok(r.roc.step === 3 && r.roc.feather, '① 라카디브 바다 — 로크의 알 · 깃털');
    ok(r.vPend && r.valley.gems === 10 && r.valley.dia && r.valley.mate && r.valley.step === 5 && !r.valley.again, '① 콜롬보 — 다이아몬드 골짜기(고깃덩이 → 보석 10) · 신드바드가 동료로');
    ok(r.cut > 0 && r.brk.crew > 0 && r.brk.hp > 0 && r.brk.gems === 8 && r.brk.rock && r.dive.land === '다이아몬드 골짜기의 큰 뱀들:40:b' && r.dive.gems > 8 && !r.dive.mate && r.dive.step === 5, '① 닻줄을 끊으면 선원을 잃는다 · 알을 깨면 바위 · 골짜기의 뱀 · 작별');
    ok(!r.hNoTitle && !r.hNoSche && r.title, '② 작위가 없거나 셰헤라자드가 해금되지 않으면 없다');
    ok(!r.spBefore && r.hPend && r.harun.paid === 300 - 3000 && r.harun.done && r.harun.robe && r.harun.sp && r.harun.trust >= 60 && r.harun.met === 1 && r.harun.name === '하룬 알 라시드' && !r.harun.again && r.harun.reveal && r.harun.jafar, '② 바그다드 — 술값을 내면 칼리프 하룬 알 라시드가 후원자(신뢰 60) · 영예의 옷 · 금화 3,000');
    ok(r.harun.bld === '황금 문의 궁', '② 바그다드에 황금 문의 궁이 선다 (' + r.harun.bld + ')');
    ok(r.hTalkDis && !r.hNo.done && !r.hNo.again && r.hTalk && !r.hLose.done && r.hLose.land.startsWith('골목의 건달들'), '② 웅변 2가 있어야 말로 · 모른 척하면 180일 · 지면 다음에');
    ok(r.fx && r.ch && r.eNoFx === 'ebHint' && r.eHint1.toast && !r.eHint1.again && r.eNoCh === 'ebHint' && r.eHint2 && !r.eNoSche && r.eMateCh, '③ 운용술 2·과학 2 동료와 매력 80(제독이나 동료)이 있어야 · 모자라면 한 번 귀띔 (' + r.fx + ' · ' + r.ch + ')');
    ok(r.ePend && r.eNo.opts === 'fix,no' && r.eNo.step === 0 && r.eFix.step === 1 && r.eFix.mate && r.eFix.key && r.eFix.gold === 10000 && r.eFix.fixer, '③ 시라즈 — 그 동료가 흑단 말을 고치면 왕자가 동료로');
    ok(r.iPend && r.isf.step === 2 && r.isf.pearls && r.isf.mate && r.isf.fly && r.isf.shams && r.isf.nadiraNav && r.isf.land === 0 && !r.isf.again, '③ 이스파한 — 의원 행세로 공주를 구한다 · 진주 · 왕자와 공주 나디라가 함께 동료로');
    ok(r.eFix2 === 1 && r.storm.land.startsWith('이스파한 성주의 병사들:50') && r.storm.step === 2 && r.storm.nadira, '③ 매력 있는 동료와 함께여도 · 궁에 쳐들어간다 · 나디라 동료');
    ok(r.rumors === 6 && /an_harun/.test(r.rLive) && /an_sinbad/.test(r.rLive) && !/an_harun|an_sinbad|an_ebony/.test(r.rLiveNo), '거리 소문 6 — 셰헤라자드가 해금되어야');
    ok(errors.length === 0, '페이지 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fail ? '\n실패 ' + fail : '\n모두 통과');
  process.exit(fail ? 1 : 0);
})();
