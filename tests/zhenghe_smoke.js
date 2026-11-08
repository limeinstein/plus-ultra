/* 정화의 보선 — 말린디의 소문 · 캘리컷 · 실론 · 말라카 · 황해 · 막야 (2026-11-08)
   node tests/zhenghe_smoke.js */
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
      const ZH = G.ZhengHe, K = G.BALANCE.zhenghe, out = {}, said = [], asks = [], seas = [];
      let picks = [], result = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value == want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      // 큰 해전: 실제 G.Rel.greatBattle 로 묻고, 해전 장면 대신 G.Rel.afterBattle 로 결과를 바로 낸다
      G.UI.fade = async fn => { if (fn) await fn(); };
      G.Game.go = (scene, o) => { seas.push(o.npc); G.Rel.afterBattle(o.npc, result, []); };
      function fresh(at, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; });
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = (o && o.mates) || []; s.date = { y: 1560, m: 3, d: 1 }; s.player.gold = 10000; s.player.items = [];
        G.Fame.add('ex', (o && o.fame != null) ? o.fame : 210000);
        if (typeof at === 'number') { const c = G.CITY_DATA[at]; s.loc = { mode: 'city', city: at, lon: c.lon, lat: c.lat }; } else s.loc = { mode: 'sea', lon: at[0], lat: at[1] };
        said.length = 0; asks.length = 0; seas.length = 0; return s;
      }
      const hasItem = id => G.Game.state.player.items.some(x => x.id === id);
      const sea = n => { const b = K.stages[n].box; G.Game.state.loc = { mode: 'sea', lon: (b[0] + b[1]) / 2, lat: (b[2] + b[3]) / 2 }; };
      const chen = { id: 'chen', role: 'none', loyal: 80 }, guan = { id: 'guan_yu', role: 'none', loyal: 80 }, prince = { id: 'little_prince', role: 'nav', loyal: 80 };
      out.data = { figs: G.ZHENGHE_FIGS.every(id => G.HIST_FIG[id] && G.HIST_FIG[id].look), moye: G.ITEM.moye && G.ITEM.moye.atk === 42 && G.ITEM.moye.kind === 'weapon', ok: [108, 109].every(c => G.CITY_DATA[c]) };
      // 조건: 명성 · 중국인 항해사
      let s = fresh(108, { fame: 150000, mates: [Object.assign({}, chen)] }); out.lowFame = ZH.pending();
      s = fresh(108, { mates: [Object.assign({}, guan)] }); out.noNav = ZH.pending();               // 관우: 중국인이지만 항해 특기가 없다
      s = fresh(108, { mates: [Object.assign({}, guan, { role: 'nav' })] }); out.guanNav = !!ZH.navigator(); // 항해사 자리에 앉히면 항해사
      s = fresh(108, { mates: [Object.assign({}, prince)] }); out.prince = ZH.pending();             // 별에서 온 소년: 중국말은 해도 중국인이 아니다
      s = fresh(29, { mates: [Object.assign({}, chen)] }); out.elsewhere = ZH.pending();
      // ① 말린디의 소문
      s = fresh(108, { mates: [Object.assign({}, chen)] }); out.pend = ZH.pending(); await ZH.check();
      out.rumor = { step: s.zhenghe.step, nav: s.zhenghe.nav, chen: said.some(t => t.startsWith('진조의|') && /보선/.test(t)), scroll: hasItem('zh_qilin_scroll'), again: ZH.pending() };
      // 캘리컷 앞바다 밖에서는 없다 · 안에서는 나타난다 — 물러나면 30일
      s.loc = { mode: 'sea', lon: 60, lat: 10 }; out.offBox = ZH.seaPending();
      sea(1); out.inBox = ZH.seaPending(); picks = ['no']; await ZH.atSea();
      out.decl = { cool: s.zhenghe.cool - s.day, again: ZH.seaPending(), fight: s.zhenghe.fight }; s.day += 31; out.declBack = ZH.seaPending();
      // ② 캘리컷 — 진다 → 30일 뒤 · 다시 싸워 이긴다 (해전 열쇠가 바뀐다)
      result = 'lose'; picks = ['fight']; await ZH.atSea();
      out.lose = { key: seas[0] && seas[0].great, ghost: seas[0] && seas[0].ghost, noPrize: seas[0] && seas[0].noPrize, cool: ZH.seaPending(), step: s.zhenghe.step };
      s.day += 31; result = 'win'; const g1 = s.player.gold; picks = ['fight']; await ZH.atSea();
      out.w1 = { key: seas[1] && seas[1].great, ships: seas[1] && seas[1].ships.join(), gold: s.player.gold - g1, after: s.zhenghe.after, boss: seas[1] && seas[1].boss.hist };
      await ZH.atSea(); out.w1b = { step: s.zhenghe.step, after: s.zhenghe.after, tablet: said.some(t => /석란산/.test(t)) };
      // ③ 실론 · ④ 말라카 — 5만 · 7만 (이긴 뒤 항구에 먼저 들어가도 행선 패를 읽는다)
      sea(2); let g = s.player.gold; picks = ['fight']; await ZH.atSea(); out.w2 = { gold: s.player.gold - g, ships: seas[seas.length - 1].ships.length };
      const c0 = G.CITY_DATA[155]; s.loc = { mode: 'city', city: 155, lon: c0.lon, lat: c0.lat }; out.cityAfter = ZH.pending(); await ZH.check(); out.w2b = { step: s.zhenghe.step, malacca: said.some(t => /만랄가/.test(t)) };
      sea(3); g = s.player.gold; picks = ['fight']; await ZH.atSea(); out.w3 = { gold: s.player.gold - g, ships: seas[seas.length - 1].ships.length }; await ZH.atSea(); out.w3b = s.zhenghe.step;
      // ⑤ 황해 — 보선 다섯 척 · 20만 · 막야
      sea(4); g = s.player.gold; picks = ['fight']; await ZH.atSea(); const last = seas[seas.length - 1];
      out.w4 = { gold: s.player.gold - g, ships: last.ships.join(), boss: last.boss.hist, flag: last.names[0], moye: hasItem('moye') };
      await ZH.atSea(); out.end = { step: s.zhenghe.step, bye: said.some(t => t.startsWith('정화의 혼령|') && /막야/.test(t)), again: ZH.seaPending() };
      // 싸우는 중 표시가 남은 옛 저장
      s.zhenghe.step = 2; s.zhenghe.fight = 2; G.World.daily(); out.unstick = s.zhenghe.fight;
      // 소문 (거리의 마을 사람)
      const R0 = (G.EVENT_RUMORS || []).filter(x => /^zh_/.test(x.id)); out.rumors = R0.length;
      s = fresh(108, { mates: [] }); out.rumorLive = R0.filter(x => x.live(s)).map(x => x.id).join();
      s.zhenghe = { step: 3, won: {} }; out.rumorLive3 = R0.filter(x => x.live(s)).map(x => x.id).join();
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.data.figs && r.data.moye && r.data.ok, '인물 4 · 막야(무기 · 무력 42)');
    ok(!r.lowFame && !r.noNav && r.guanNav && !r.prince && !r.elsewhere, '명성 20만 · 중국인 항해사(항해사 자리이거나 항해 특기) · 아프리카 항구에서만');
    ok(r.pend && r.rumor.step === 1 && r.rumor.nav === 'chen' && r.rumor.chen && r.rumor.scroll && !r.rumor.again, '① 말린디 — 진조의가 정화의 보선을 알아본다 · 기린도 두루마리');
    ok(!r.offBox && r.inBox && r.decl.cool === 30 && !r.decl.again && !r.decl.fight && r.declBack, '캘리컷 앞바다에서만 · 물러나면 30일 뒤 다시');
    ok(r.lose.key === 'zh_1_2' && r.lose.ghost && r.lose.noPrize && !r.lose.cool && r.lose.step === 1, '지면 30일 뒤 · 유령선 표시 · 끌고 갈 수 없다');
    ok(r.w1.key === 'zh_1_3' && r.w1.ships === 'baochuan,ljunk,ljunk' && r.w1.gold === 30000 && r.w1.after === 1 && r.w1.boss === 'zh_hongbao', '② 캘리컷의 유령 보선 — 금화 30,000');
    ok(r.w1b.step === 2 && !r.w1b.after && r.w1b.tablet, '행선 패 — 다음은 실론');
    ok(r.w2.gold === 50000 && r.w2.ships === 4 && r.cityAfter && r.w2b.step === 3 && r.w2b.malacca, '③ 실론 — 금화 50,000 · 항구에서도 행선 패');
    ok(r.w3.gold === 70000 && r.w3.ships === 5 && r.w3b === 4, '④ 말라카 해협 — 금화 70,000');
    ok(r.w4.gold >= 200000 && r.w4.gold < 201000 && r.w4.ships === 'baochuan,baochuan,baochuan,baochuan,baochuan' && r.w4.boss === 'zh_zhenghe' && /기함/.test(r.w4.flag) && r.w4.moye, '⑤ 황해의 보선 다섯 척 — 금화 200,000 · 막야');
    ok(r.end.step === 5 && r.end.bye && !r.end.again, '정화의 혼령과의 작별 · 끝');
    ok(r.unstick === 0, '싸우는 중 표시가 남은 옛 저장을 푼다');
    ok(r.rumors === 5 && r.rumorLive === 'zh_rumor' && r.rumorLive3 === 'zh_malacca', '거리 소문 5 — 단계마다');
    ok(errors.length === 0, '페이지 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fail ? '\n실패 ' + fail : '\n모두 통과');
  process.exit(fail ? 1 : 0);
})();
