/* 왕명과 바다 (tests/court_sea_smoke.js) — node tests/court_sea_smoke.js
   왕녀 구출: 소굴(알제) 앞바다에서 납치한 해적단이 나타나 덤비고, 싸우면 해전으로 넘어간다 / 이기면 왕녀를 모신다.
   나포: 그 나라(틀렘센 왕국) 항구 가까운 바다에 그 나라 배가 나타나고, 먼저 공격해도 악명이 오르지 않는다. 콘솔 오류 0.
   (자동항해 시험처럼 그림 칠하기를 끄고 G.Scenes.sea.update를 직접 돌린다) */
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const page = await b.newPage({ viewport: { width: 640, height: 360 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; window.createImageBitmap = undefined; document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '*{animation:none!important;transition:none!important} body > *{visibility:hidden!important} canvas{display:none!important}'; document.head.appendChild(st); }); });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea, null, { timeout: 90000 });
  const out = await page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m);
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; G.Disc.find = async () => {}; G.Explore.report = async () => {}; G.Explore.milestones = async () => {};
    const s = G.Game.state; s.player.gold = 50000; G.Fame.add('ex', 12000); s.fleet.scurvy = 0; s.fleet.food = 400; s.fleet.water = 400;
    const base = { cat: 'bt', fame: 800, gold: 5000, sp: 'pt_king', realm: 'PT', taken: 14800501, due: 14820501, title: '시험', desc: '시험' };
    s.court = { task: Object.assign({ kind: 'rescue', den: 83, who: '주아나 왕녀', stage: 0, ships: 2 }, base) };
    G.Game.go('sea', { depart: 83 }); let SEA = G.Scenes.sea, st = SEA.runtime(); st.speed = 2;
    const tick = async (n) => { for (let i = 0; i < n; i++) { SEA.update(0.1); for (let w = 0; w < 20 && st.busy && !G.UI.busy(); w++) await new Promise(r => setTimeout(r, 0)); if (G.UI.busy()) return 'ui'; } return 'ok'; };
    const top = () => ([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || '';
    const pick = async (txt) => { const mb = [...document.querySelectorAll('.modal-back')].pop(); if (!mb) return false; const bt = [...mb.querySelectorAll('button')].find(x => x.textContent.indexOf(txt) >= 0); if (bt) { bt.click(); await new Promise(r => setTimeout(r, 30)); return true; } (mb.querySelector('.dlg') || mb).click(); await new Promise(r => setTimeout(r, 30)); return false; };
    // ---- 구출: 해적단이 나타나 덤빈다
    let met = false, seen = false;
    const T0 = Date.now();
    for (let k = 0; k < 400 && !met && Date.now() - T0 < 40000; k++) {
      const r = await tick(1);
      if (st.npcs.some(n => n.court === 'rescue')) seen = true;
      if (r === 'ui') { if (/왕녀/.test(top()) && /싸운다/.test(top()) && !/통행료/.test(top())) met = true; else await pick(''); }
      const pn = st.npcs.find(n => n.court === 'rescue');
      if (!pn && !G.UI.busy()) { st.paused = true; await SEA.runDay(); }   // 닻을 내린 채 날을 보낸다
      else if (pn && st.paused && !G.UI.busy()) SEA.takeCourse(Math.atan2(pn.lat - s.loc.lat, G.Geo.wrapLon(pn.lon - s.loc.lon)));   // 해적단 쪽으로 돛을 편다
    }
    ok(seen, '소굴 앞바다에 납치한 해적단이 나타남');
    ok(met, '해적단이 덤벼 온다: ' + top().slice(0, 50));
    await pick('싸운다'); for (let k = 0; k < 80 && G.Game.scene === SEA; k++) await new Promise(r => setTimeout(r, 50));
    const BT = G.Scenes.battle, bst = BT.runtime && BT.runtime();
    ok(G.Game.scene !== SEA && bst && bst.npc && bst.npc.court === 'rescue', '싸운다 → 해전 (상대는 납치한 해적단 ' + (bst && bst.npc && bst.npc.n) + '척)');
    if (!bst || !bst.npc) { R.push('  (npcs: ' + st.npcs.map(n => n.kind + ':' + (n.court || '') + ':' + G.Geo.dist(s.loc.lon, s.loc.lat, n.lon, n.lat).toFixed(2)).join(' ') + ' · 창: ' + top().slice(0, 60) + ')'); return R; }
    const lines = []; G.Court.afterBattle(bst.npc, 'win', [{ side: 'en', sunk: true }], lines);
    ok(s.court.task.stage === 1 && /왕녀/.test(lines.join('')) && G.Court.progress(s.court.task).done, '이기면 왕녀를 배에 모신다');
    // ---- 나포: 그 나라 배가 나타난다
    s.court.task = Object.assign({ kind: 'capture', nation: '틀렘센 왕국', n: 2, got: 0 }, base);
    G.Game.go('sea', { depart: 83 }); st = SEA.runtime(); st.paused = true;
    let cap = null;
    for (let k = 0; k < 80 && !cap; k++) { await SEA.runDay(); for (let w = 0; w < 5 && G.UI.busy(); w++) await pick(''); cap = st.npcs.find(n => n.court === 'capture'); }
    ok(cap && cap.nation === '틀렘센 왕국' && !cap.hostile && cap.ships.length === cap.n, '틀렘센 왕국 배가 나타남: ' + (cap && (cap.label || cap.kind)));
    ok(G.Court.lawful(cap) && !G.Court.lawful({ kind: 'merchant', nation: '베네치아' }), '왕명으로 치는 배만 악명 없이');
    return R;
  });
  console.log(out.join('\n')); console.log(errs.slice(0, 5).join('\n') || '✓ 콘솔 오류 없음'); await b.close();
  process.exitCode = out.some(x => x[0] === '✗') || errs.length ? 1 : 0;
})();
