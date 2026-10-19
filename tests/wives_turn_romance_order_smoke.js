/* 둘째 부인 여럿이 돌아가며 술집에서 · 부하 썸이 등용 순으로 생기지 않는다 (js/systems/familyevent.js · js/systems/romance.js)
   node tests/wives_turn_romance_order_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const out = {};
      const fresh = () => G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      // ---- 둘째 부인 셋이 배에
      let s = fresh(); s = G.Game.state;
      const ids = ['cinderella', 'snow_white', 'sleeping_beauty'];
      s.player.wife = 'x_home'; s.player.wifeAboard = false;
      s.player.wives2 = ids.map((id, i) => ({ id, kind: 'mate', city: 0, house: false, aboard: true, wed: s.day - 100 + i }));
      ids.forEach(id => { if (!s.mates.some(m => m.id === id)) s.mates.push({ id, role: 'none', loyal: 90 }); });
      const FE = G.FamEv; FE.run = async () => true;
      const c = G.CITY_DATA[0], seq = [], can = [];
      for (let d = 0; d < 4; d++) { can.push(FE.canWifeDate()); const L = FE.aboardWife('tavern'); if (FE.canWifeDate()) { seq.push(L.id); await FE.wifeDate(c); } s.day++; }
      out.seq = seq; out.can = can; out.wait = FE.wifeDateWait();
      s.day += 7; out.after = [FE.canWifeDate(), FE.aboardWife('tavern').id];
      // 술집 메뉴 줄
      const items = G.Scenes.city.B.tavern.menu ? null : null;
      // 한 사람뿐이면 예전처럼 (본처 없이 둘째 부인 하나)
      s.player.wives2 = s.player.wives2.slice(0, 1); out.single = FE.aboardWife('tavern').id;
      // ---- 썸: 3년 넘은 여자 셋·남자 셋 — 누가 먼저 엮이나 (등용 순이 아닌가)
      const K = G.BALANCE.romance; K.chemMin = 0;
      const fem = G.MATES.filter(d => d.g === 'f' && !d.fairy && !d.witch && !d.wd).slice(0, 3).map(d => d.id);
      const mal = G.MATES.filter(d => d.g !== 'f' && !d.wd).slice(0, 3).map(d => d.id);
      const firsts = {};
      for (let t = 0; t < 24; t++) {
        s = fresh(); s = G.Game.state; s.day = 2000; s.romance = null;
        s.mates = fem.concat(mal).map((id, i) => ({ id, role: 'none', loyal: 80, joined: 0 }));   // 등용 순 = fem[0], fem[1], …
        let f = null;
        for (let d = 0; d < 400 && !f; d++) { G.Romance.daily(); const p = G.Romance.due('sea'); if (p) f = p.f + '|' + p.m; s.day++; }
        if (f) firsts[f] = (firsts[f] || 0) + 1;
      }
      out.firsts = firsts; out.fem = fem; out.mal = mal;
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.seq.join() === 'cinderella,snow_white,sleeping_beauty' && r.can.join() === 'true,true,true,false', '둘째 부인 셋이 돌아가며 술집에 (날마다 한 사람씩: ' + r.seq.join(' → ') + '), 넷째 날은 모두 한 번씩 함께해 쉼 (' + r.wait + '일 뒤)');
    ok(r.after[0] && r.after[1] === 'cinderella', '7일이 지나면 다시 첫 사람 차례');
    ok(r.single === 'cinderella', '한 사람뿐이면 그 사람');
    const fs = Object.keys(r.firsts).map(k => k.split('|')[0]);
    ok(new Set(fs).size >= 2 && Object.keys(r.firsts).length >= 3, '썸이 등용 순으로 생기지 않는다 — 24번 중 처음 엮인 짝: ' + JSON.stringify(r.firsts));
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
