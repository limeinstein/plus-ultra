/* 유럽 옛이야기 셋 — 로빈 후드 · 라푼젤 · 빌헬름 텔 (2026-11-10)
   node tests/folktales_smoke.js */
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
      const FT = G.Folktales, K = G.BALANCE.folk, out = {}, said = [], asks = [], lands = [];
      let picks = [], landRes = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value == want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      G.Scenes.land.landBattle = async (name, n, beasts) => { lands.push(name + ':' + n + (beasts ? ':b' : '')); return landRes; };
      function fresh(at, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, (o && o.sk) || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y: 1560, m: 3, d: 1 }; s.player.gold = 10000; s.player.items = [];
        G.Fame.add('ex', (o && o.fame != null) ? o.fame : 3000);
        const c = G.CITY_DATA[at]; s.loc = { mode: 'city', city: at, lon: c.lon, lat: c.lat };
        said.length = 0; asks.length = 0; lands.length = 0; return s;
      }
      const go = at => { const c = G.CITY_DATA[at]; G.Game.state.loc = { mode: 'city', city: at, lon: c.lon, lat: c.lat }; };
      const hasItem = id => G.Game.state.player.items.some(x => x.id === id);
      const mate = id => G.Game.state.mates.some(m => m.id === id);
      out.data = { figs: G.FOLK_FIGS.every(id => G.HIST_FIG[id]), mates: ['bat_hood', 'cathy', 'rapunzel', 'tell'].every(id => G.MATE[id] && G.MATE[id].eventOnly) && G.MATE.bat_hood.sk.shoot === 3 && G.MATE.cathy.g === 'f' && !!G.MATE.robin_hood && !!G.MATE.marian && G.MATE.tell.sk.shoot === 3, items: ['ft_golden_arrow', 'ft_rapunzel_braid', 'ft_gessler_hat'].every(id => G.ITEM[id]), cities: [41, 53, 62, 63, 55].map(c => G.CITY_DATA[c].name).join() };

      // ① 로빈 후드 — 사격술 3이 모자라면 한 번 귀띔
      let s = fresh(41, { sk: { shoot: 2 } }); out.rbHintStep = FT.cityStep(); await FT.check(); out.rbHint = { told: said.some(t => /활쏘기 대회/.test(t)), again: FT.pending() };
      s = fresh(41, { sk: { shoot: 3 }, fame: 500 }); out.rbLow = FT.pending();
      // 모른 척 → 180일 뒤
      s = fresh(41, { sk: { shoot: 3 } }); picks = ['no']; await FT.check(); out.rbNo = { step: s.folk.robin.step, again: FT.pending() }; s.day += 181; out.rbBack = FT.pending();
      // 돕는다 → 금 화살 · 로빈의 방식 · 둘 다 동료
      picks = ['help', 'toll', 'join']; const g0 = s.player.gold; await FT.check();
      out.rb = { land: lands.join(), arrow: hasItem('ft_golden_arrow'), gold: s.player.gold - g0, robin: mate('bat_hood'), marian: mate('cathy'), noRobin: !mate('robin_hood') && !mate('marian'), step: s.folk.robin.step, split: said.some(t => /꽁무니를 쪼개며/.test(t)), ears: said.some(t => /늑대 귀/.test(t)), cathy: said.some(t => t.startsWith('캐시|')), bat: said.some(t => t.startsWith('배트 후드|') && /털 것인가/.test(t)), entrust: said.some(t => t.startsWith('로빈 후드|') && /맡기겠소/.test(t)), q: asks.map(a => a.q).join('/'), again: FT.pending() };
      // 함께 턴다 → 악명 · 셔우드에 남게 하면 180일 뒤 다시 요크에서
      s = fresh(41, { sk: { shoot: 3 } }); const n0 = s.player.notoriety || 0; picks = ['help', 'rob', 'no']; await FT.check();
      out.rob = { gold: s.player.gold - 10000, noto: (s.player.notoriety || 0) - n0, step: s.folk.robin.step, robin: mate('bat_hood'), again: FT.pending() };
      s.day += 181; out.rbAgainStep = FT.cityStep(); picks = ['join']; await FT.check(); out.rbAgain = mate('bat_hood') && mate('cathy');

      // ② 라푼젤 — 측량 3 · 과학 3 (한 사람이 아니어도 된다)
      s = fresh(53, { sk: { survey: 3, sci: 2 } }); out.rpHintStep = FT.cityStep(); await FT.check(); out.rpHint = said.some(t => /문도 계단도 없는 탑/.test(t)) && !FT.pending();
      s = fresh(29, { sk: { survey: 3, sci: 3 } }); out.rpElse = FT.pending();
      s = fresh(62, { sk: { survey: 3, sci: 3 } }); out.rpPend = FT.cityStep(); picks = ['ladder']; await FT.check();
      out.rp = { mate: mate('rapunzel'), braid: hasItem('ft_rapunzel_braid'), land: lands.length, step: s.folk.rapunzel.step, gothel: said.some(t => t.startsWith('마녀 고텔|')), again: FT.pending() };
      s = fresh(63, { sk: { survey: 3, sci: 3 } }); landRes = 'lose'; picks = ['hair']; await FT.check(); out.rpLose = { land: lands.join(), mate: mate('rapunzel'), again: FT.pending() }; landRes = 'win';
      s.day += 181; picks = ['hair']; await FT.check(); out.rpWin2 = mate('rapunzel');

      // ③ 빌헬름 텔 — 사격술 3 · 항해술 3
      s = fresh(55, { sk: { shoot: 3, nav: 2 } }); out.tlHintStep = FT.cityStep(); await FT.check(); out.tlHint = !FT.pending();
      s = fresh(55, { sk: { shoot: 3, nav: 3 } }); out.tlPend = FT.cityStep(); picks = ['wind', 'rock']; await FT.check();
      out.tl = { mate: mate('tell'), hat: hasItem('ft_gessler_hat'), land: lands.length, step: s.folk.tell.step, apple: said.some(t => /사과를 둘로 가르며/.test(t)), walter: said.some(t => t.startsWith('발터|')), second: said.some(t => /두 번째 화살은 그대의 심장/.test(t)), rock: said.some(t => /바위로 뛰어내리며/.test(t)), again: FT.pending() };
      s = fresh(55, { sk: { shoot: 3, nav: 3 } }); picks = ['protest', 'board']; await FT.check(); out.tl2 = { land: lands.join(), mate: mate('tell'), shoot: said.some(t => /그럼 네 사수가 쏴라/.test(t)) };
      // 소문
      const R0 = (G.EVENT_RUMORS || []).filter(x => /^ft_/.test(x.id)); out.rumors = R0.length;
      s = fresh(41, { sk: { shoot: 3, nav: 3 } }); out.rLive = R0.filter(x => x.live(s)).map(x => x.id).join();
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.data.figs && r.data.mates && r.data.items && r.data.cities === '요크,프라하,바르샤바,부다페스트,베른', '인물 · 동료 4(배트 후드·캐시·라푼젤·텔) · 옛 저장용 로빈·마리안 · 아이템 3');
    ok(r.rbHintStep === 'robinHint' && r.rbHint.told && !r.rbHint.again && !r.rbLow, '① 사격술 3이 모자라면 한 번 귀띔 · 명성');
    ok(r.rbNo.step === 0 && !r.rbNo.again && r.rbBack, '① 모른 척하면 180일 뒤');
    ok(r.rb.land.startsWith('노팅엄 장관의 병사들:40') && r.rb.arrow && r.rb.gold === 2500 && r.rb.robin && r.rb.marian && r.rb.noRobin && r.rb.step === 2 && r.rb.split && r.rb.ears && r.rb.cathy && r.rb.bat && r.rb.entrust && /부자 상인을 털 것인가/.test(r.rb.q) && /로빈 후드의 부탁/.test(r.rb.q) && !r.rb.again, '① 대회(배트 후드 · 늑대 귀) → 탈출(캐시) → 배트 후드가 「부자 상인을 털 것인가」 → 로빈 후드가 둘을 맡긴다 — 배트 후드 · 캐시 동료');
    ok(r.rob.gold === 6000 && r.rob.noto === 4 && r.rob.step === 1 && !r.rob.robin && !r.rob.again && r.rbAgainStep === 'robinAgain' && r.rbAgain, '① 함께 털면 금화·악명 · 셔우드에 남기면 180일 뒤 요크에서 다시');
    ok(r.rpHintStep === 'rapunzelHint' && r.rpHint && !r.rpElse, '② 과학 3이 모자라면 한 번 귀띔 · 동유럽 도시에서만');
    ok(r.rpPend === 'rapunzel' && r.rp.mate && r.rp.braid && r.rp.land === 0 && r.rp.step === 1 && r.rp.gothel && !r.rp.again, '② 도르래와 줄사다리 — 라푼젤 동료 · 금빛 머리채');
    ok(r.rpLose.land === '마녀 고텔의 가시덤불과 까마귀 떼:30:b' && !r.rpLose.mate && !r.rpLose.again && r.rpWin2, '② 머리채를 타고 오르면 마녀 고텔과 싸운다 · 지면 180일 뒤');
    ok(r.tlHintStep === 'tellHint' && r.tlHint, '③ 항해술 3이 모자라면 한 번 귀띔');
    ok(r.tlPend === 'tell' && r.tl.mate && r.tl.hat && r.tl.land === 0 && r.tl.step === 1 && r.tl.apple && r.tl.walter && r.tl.second && r.tl.rock && !r.tl.again, '③ 아들 머리 위 사과 · 두 번째 화살 · 폭풍 속 바위 — 빌헬름 텔 동료 · 게슬러의 모자');
    ok(r.tl2.land.startsWith('게슬러의 병사들:30') && r.tl2.mate && r.tl2.shoot, '③ 항의하면 우리 사수가 쏜다 · 배를 덮친다');
    ok(r.rumors === 3 && r.rLive === 'ft_robin,ft_tell', '거리 소문 3 — 능력을 갖췄을 때만 (' + r.rLive + ')');
    ok(errors.length === 0, '페이지 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fail ? '\n실패 ' + fail : '\n모두 통과');
  process.exit(fail ? 1 : 0);
})();
