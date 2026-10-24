/* 아이 수 (js/systems/wives.js W.sexesOpen, 2026-10-24 사용자 요청)
   · 부인 한 사람에게 아이 5명까지 · 아들은 모든 부인을 합쳐 5명까지 · 딸은 부인마다 2명까지
   · 아들·딸은 임신 때 정해 두어(preg.sex) 여러 부인이 한꺼번에 아이를 가져도 넘지 않는다. 쌍둥이도 남은 자리만큼
   · 옛 저장의 임신(성별 없음)은 태어날 때 남은 자리를 보고 정한다
   · 본처·둘째 부인에게 수백 번 아이를 낳게 해도 어느 규칙도 넘지 않는다
   node tests/kid_limits_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Wives && G.Family, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const W = G.Wives, F = G.Family, s = G.Game.state, p = s.player, out = {};
      const maids = G.MAIDS.slice(0, 3);
      p.wife = maids[0].id;
      p.wives2 = [maids[1], maids[2]].map(x => ({ id: x.id, kind: 'maid', city: x.city, house: true, aboard: false, wed: s.day }));
      const A = W.of(maids[1].id), B = W.of(maids[2].id);
      const kid = (sex, mom) => { const k = { name: 'K', sex, born: { y: s.date.y - 5, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {} }; if (mom) { k.mother = mom.id; k.house = mom.city; } p.kids.push(k); return k; };
      const reset = () => { p.kids = []; p.preg = null; A.preg = null; B.preg = null; };
      // 1) 부인 한 사람에게 5명
      reset(); ['m', 'm', 'f', 'm', 'f'].forEach(x => kid(x));
      out.mainFull = W.canConceive('main'); out.aOpen = W.sexesOpen(A.id).join('');
      // 2) 아들은 모두 합쳐 5명: 본처 3 + A 2 → B는 딸만
      reset(); kid('m'); kid('m'); kid('m'); kid('m', A); kid('m', A);
      out.sons5 = W.sonTotal(); out.bOpen = W.sexesOpen(B.id).join('');
      out.bPregs = Array.from({ length: 30 }, () => W.newPreg(B.id, s.day, 266).sex).every(x => x === 'f');
      // 3) 딸은 부인마다 2명: A 딸 2 + 아들이 다 찼으면 A는 더 못 가짐, B는 아직 딸 2명까지
      kid('f', A); kid('f', A);
      out.aDone = W.canConceive(A.id); out.bOpen2 = W.sexesOpen(B.id).join('');
      reset(); kid('f'); kid('f');
      out.mainSonOnly = W.sexesOpen('main').join('');
      // 4) 배 속 아들도 센다: 아들 4 + 본처 배 속 아들 → A·B는 딸만
      reset(); kid('m'); kid('m'); kid('m', A); kid('m', B); p.preg = { since: s.day, due: s.day + 266, told: false, sex: 'm' };
      out.reserve = W.sonTotal() + ':' + W.sexesOpen(A.id).join('') + ':' + W.sexesOpen(B.id).join('');
      // 5) 본처 출산: 임신 때 정한 딸로 태어난다 · 쌍둥이는 남은 자리만큼 (딸 1 + 딸로 태어나면 딸 2, 쌍둥이 둘째는 아들 아니면 없음)
      reset(); kid('f'); p.preg = { since: s.day - 266, due: s.day, told: true, sex: 'f' };
      const tw = G.BALANCE.family.twins; G.BALANCE.family.twins = 1;
      F.daily();
      out.twinSexes = p.kids.slice(1).map(k => k.sex).join('');
      // 아들 5명이 다 찬 뒤 딸 1명인 부인의 쌍둥이: 둘째는 딸, 그다음은 없다
      reset(); for (let i = 0; i < 5; i++) kid('m', B);
      B.preg = { since: s.day - 266, due: s.day, told: true, sex: 'f' };
      W.daily();
      out.bTwins = p.kids.filter(k => k.mother === B.id && k.sex === 'f').length + '/' + p.kids.filter(k => k.mother === B.id).length;
      G.BALANCE.family.twins = tw;
      // 6) 옛 저장의 임신(성별 없음): 아들이 다 찼으면 딸로
      reset(); for (let i = 0; i < 5; i++) kid('m', A);
      p.preg = { since: s.day - 266, due: s.day, told: true };
      G.BALANCE.family.twins = 0; F.daily(); G.BALANCE.family.twins = tw;
      out.oldPreg = p.kids.filter(k => !k.mother).map(k => k.sex).join('');
      // 7) 수백 번 낳아도 규칙을 넘지 않는다
      let bad = 0, births = 0;
      for (let run = 0; run < 40; run++) {
        reset();
        for (let step = 0; step < 60; step++) {
          const moms = ['main', A.id, B.id], key = moms[Math.floor(Math.random() * 3)];
          const w = key === 'main' ? null : W.of(key), cur = key === 'main' ? p.preg : w.preg;
          if (!cur) { if (W.canConceive(key)) { const pr = W.newPreg(key, s.day, 266); if (key === 'main') p.preg = pr; else w.preg = pr; } continue; }
          const sexes = W.birthSexes(key, cur, Math.random() < 0.3);
          sexes.forEach(x => { births++; kid(x, w); });
          if (key === 'main') p.preg = null; else w.preg = null;
          const sons = p.kids.filter(k => k.sex === 'm').length;
          const per = moms.map(m => W.momCount(m)), over = sons > 5 || per.some(c => c.all > 5 || c.f > 2);
          if (over) bad++;
        }
      }
      out.sim = { bad, births };
      return out;
    });
    ok(r.mainFull === false && r.aOpen === 'mf', '본처 아이 5명 → 본처는 더 안 생김, 다른 부인은 아들·딸 모두 가능 (' + r.aOpen + ')');
    ok(r.sons5 === 5 && r.bOpen === 'f' && r.bPregs, '아들이 모든 부인을 합쳐 5명 → 셋째 부인은 딸만 (' + r.bOpen + ')');
    ok(r.aDone === false && r.bOpen2 === 'f', '딸 2명 + 아들이 다 찬 부인은 더 안 생김 · 다른 부인은 아직 딸 (' + r.bOpen2 + ')');
    ok(r.mainSonOnly === 'm', '딸 2명인 부인은 아들만');
    ok(r.reserve === '5::f' || r.reserve === '5:f:f', '배 속 아들도 센다: ' + r.reserve);
    ok(r.twinSexes === 'fm' || r.twinSexes === 'f' , '본처 딸 1 + 딸 출산 → 쌍둥이 둘째는 아들 (' + r.twinSexes + ')');
    ok(r.bTwins === '1/6', '아들 5명이 다 찬 부인의 쌍둥이: 딸 하나만 (딸/모두 ' + r.bTwins + ')');
    ok(r.oldPreg === 'f', '옛 저장의 성별 없는 임신: 아들이 다 찼으면 딸로 (' + r.oldPreg + ')');
    ok(r.sim.bad === 0 && r.sim.births > 300, '본처·둘째·셋째 부인에게 ' + r.sim.births + '번 낳게 해도 규칙을 넘지 않음');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
