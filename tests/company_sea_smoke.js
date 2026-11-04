/* 특허 회사와 바다 (2026-11-04) — node tests/company_sea_smoke.js
   귀환 대선단: 바다에서 습격대가 나타나 「회사 선단」 말로 덤비고, 싸우면 해전 → 물러나면(battle.js finish) 회사선을 잃는다.
   단속: 목표 항구 앞바다에 밀수선단이 나타나고, 먼저 공격해도 악명이 오르지 않는다. 콘솔 오류 0. */
const path = require('path');
const { pathToFileURL } = require('url');
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const errs = [];
  let out = ['✗ 시작하지 못함'];
  try {
    const page = await b.newPage({ viewport: { width: 640, height: 360 } });
    page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; window.createImageBitmap = undefined; document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '*{animation:none!important;transition:none!important} body > *{visibility:hidden!important} canvas{display:none!important}'; document.head.appendChild(st); }); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea, null, { timeout: 90000 });
    out = await page.evaluate(async () => {
      const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m);
      await G.Game.ensureGeo(); G.Nav.init();
      G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; G.Disc.find = async () => {}; G.Explore.report = async () => {}; G.Explore.milestones = async () => {};
      const s = G.Game.state, CO = G.Company; s.date = { y: 1530, m: 2, d: 1 }; s.player.gold = 200000; s.player.fame = 3000; s.fleet.food = 400; s.fleet.water = 400; s.fleet.scurvy = 0;
      const coc = G.CITY_DATA[154]; s.loc = { mode: 'city', city: 154, lon: coc.lon, lat: coc.lat };
      CO.join('pt'); s.company.rank = 2; s.company.merit = 500;
      let cv = null; for (let i = 0; i < 8 && !cv; i++) { cv = CO.offers(coc, 'pt').filter(o => o.kind === 'convoy')[0]; if (!cv) s.day += 30; }
      CO.accept(cv); s.company.mission.next = 0;
      G.Game.go('sea', { depart: 154 }); const SEA = G.Scenes.sea; let st = SEA.runtime(); st.paused = true;
      const top = () => ([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || '';
      const pick = async (txt) => { const mb = [...document.querySelectorAll('.modal-back')].pop(); if (!mb) return false; const bt = [...mb.querySelectorAll('button')].find(x => x.textContent.indexOf(txt) >= 0); if (bt) { bt.click(); await new Promise(r => setTimeout(r, 40)); return true; } (mb.querySelector('.dlg') || mb).click(); await new Promise(r => setTimeout(r, 40)); return false; };
      const day = async () => { let done = false; SEA.runDay().then(() => { done = true; }, () => { done = true; }); for (let i = 0; i < 300 && !done; i++) { if (G.UI.busy()) await pick(''); await new Promise(r => setTimeout(r, 20)); } }; const fp = G.Info.fleetPanel().innerHTML; ok(/귀환 선단/.test(fp), '함대 현황에 회사 귀환 선단 ' + cv.ships + '척');
      let raid = null;
      const T1 = Date.now(); for (let k = 0; k < 120 && !raid && Date.now() - T1 < 60000; k++) { await day(); for (let w = 0; w < 5 && G.UI.busy(); w++) await pick(''); raid = st.npcs.find(n => n.co === 'raid'); }
      ok(raid && raid.hostile, '바다에서 습격대가 나타남: ' + (raid && (raid.label || raid.kind)) + ' ' + (raid && raid.n) + '척');
      if (!raid) return R;
      SEA.encounterForTest(raid, false); for (let w = 0; w < 20 && !G.UI.busy(); w++) await new Promise(r => setTimeout(r, 30));
      ok(/회사 선단/.test(top()), '덤벼 올 때 말: ' + top().slice(0, 50));
      await pick('싸운다'); for (let k = 0; k < 120 && G.Game.scene === SEA; k++) await new Promise(r => setTimeout(r, 50));
      const BT = G.Scenes.battle, bst = BT.runtime && BT.runtime();
      ok(bst && bst.npc && bst.npc.co === 'raid', '싸운다 → 해전 (상대 ' + (bst && bst.npc && bst.npc.n) + '척)');
      const before = s.company.mission.ships;
      if (bst && bst.npc) {
        const fin = BT._t().finish('retreat');
        for (let k = 0; k < 60 && G.UI.busy() === false; k++) await new Promise(r => setTimeout(r, 30));
        for (let k = 0; k < 30 && G.UI.busy(); k++) { await pick(''); await new Promise(r => setTimeout(r, 40)); }
        await Promise.race([fin, new Promise(r => setTimeout(r, 3000))]);
      }
      const m = s.company.mission;
      ok(m && m.ships === before - 1, '물러나면 회사선 한 척을 잃는다 (' + before + ' → ' + (m && m.ships) + ')');
      // ── 단속
      s.company.mission = null; s.day += 40; s.loc = { mode: 'city', city: 154, lon: coc.lon, lat: coc.lat };
      let pa = null; for (let i = 0; i < 10 && !pa; i++) { pa = CO.offers(coc, 'pt').filter(o => o.kind === 'patrol')[0]; if (!pa) s.day += 30; }
      CO.accept(pa);
      G.Game.go('sea', { depart: pa.at }); st = SEA.runtime(); st.paused = true;
      let sm = null;
      const T2 = Date.now(); for (let k = 0; k < 120 && !sm && Date.now() - T2 < 60000; k++) { await day(); for (let w = 0; w < 5 && G.UI.busy(); w++) await pick(''); sm = st.npcs.find(n => n.co === 'patrol'); }
      ok(sm, '목표 항구 앞바다에 ' + (sm && sm.label) + U(sm));
      function U(x) { return x ? ' (' + x.n + '척)' : ''; }
      if (sm) {
        const noto = s.player.notoriety || 0;
        SEA.encounterForTest(sm, true); for (let w = 0; w < 20 && !G.UI.busy(); w++) await new Promise(r => setTimeout(r, 30));
        ok(/밀수선단|무장 상선단/.test(top()), '마주칠 때 말: ' + top().slice(0, 40));
        await pick('싸운다'); for (let k = 0; k < 120 && G.Game.scene === SEA; k++) await new Promise(r => setTimeout(r, 50));
        ok((s.player.notoriety || 0) === noto, '회사의 이름으로 먼저 쳐도 악명이 오르지 않는다');
        const b2 = BT.runtime();
        ok(b2 && b2.npc && b2.npc.co === 'patrol', '해전으로 넘어감');
      }
      return R;
    });
  } catch (e) { out.push('✗ ' + e.message); }
  finally { await b.close(); }
  console.log(out.join('\n')); console.log(errs.slice(0, 5).join('\n') || '✓ 콘솔 오류 없음');
  process.exitCode = out.some(x => x[0] === '✗') || errs.length ? 1 : 0;
})();
