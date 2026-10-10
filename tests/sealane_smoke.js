/* 바닷길 따라 항해 시험 (tests/sealane_smoke.js) — node tests/sealane_smoke.js
   예전에는 처음 가는 항로·자동항해를 푼 항해·3°보다 먼 바다는 '곧장 침로'(직선)라서 반도·섬을 가로질러 뭍에 막혔다.
   이제는 늘 바닷길(G.Nav.seaPath)을 따라간다 — 자동항해(×4)만 익숙한 항로에 한한다.
   · 리스본→제노바(처음 가는 항로): 여러 굽이의 바닷길, 뭍을 가로지르지 않음, 배속 그대로, 끝까지 가서 입항
   · 리스본→런던: 브르타뉴 곶을 돌아가는 길 · 먼 바다(지중해 한복판) 클릭도 바닷길
   · 열린 항로는 그대로 자동항해 ×4 · 해전 뒤에 바닷길 항해를 이어 감 · 해도 항로 선이 바닷길을 따름. 콘솔 오류 0 */
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
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
    const f = n => G.CITY_DATA.find(c => c && c.name === n).id; const A = f('리스본'), B = f('제노바'), L = f('런던');
    const s = G.Game.state; s.routes = {}; [B, L].forEach(id => { if (s.known.indexOf(id) < 0) s.known.push(id); }); s.player.gold = 50000;
    window.__arr = null; G.Scenes.city.handleEntry = async c => { window.__arr = c.id; return false; };
    const toasts = []; const t0 = G.UI.toast; G.UI.toast = function (m) { toasts.push(String(m)); return t0.apply(this, arguments); };
    // 뭍을 가로지르는 칸 수 (마지막 부두 토막 0.3°는 뺀다)
    const landHits = (p) => { let n = 0; for (let i = 1; i < p.length; i++) { const a = p[i - 1], c = p[i], dx = c[0] - a[0], dy = c[1] - a[1], k = Math.ceil(Math.hypot(dx, dy) / 0.01); for (let j = 1; j < k; j++) { const x = a[0] + dx * j / k, y = a[1] + dy * j / k; if (i === p.length - 1 && Math.hypot(x - c[0], y - c[1]) < 0.3) continue; if (G.Geo.sdf(x, y) > 0) n++; } } return n; };
    G.Game.go('sea', { depart: A }); let SEA = G.Scenes.sea, st = SEA.runtime(); st.speed = 2;
    // 1) 처음 가는 항로
    ok(!G.Routes.isOpen(A, B), '리스본→제노바는 아직 열리지 않은 항로');
    SEA.goCity(B);
    ok(st.path && st.path.length > 4 && st.pilot && !st.direct && !st.autoOn, '바닷길 따라 (굽이 ' + (st.path && st.path.length) + ', pilot=' + st.pilot + ', direct=' + st.direct + ', auto=' + st.autoOn + ')');
    ok(st.speed === 2, '배속은 그대로 ×' + st.speed);
    ok(landHits(st.path) === 0, '길이 뭍을 가로지르지 않음 (' + landHits(st.path) + ')');
    ok(/바닷길을 따라/.test(toasts.slice(-1)[0] || ''), '안내: ' + (toasts.slice(-1)[0] || '').slice(0, 70));
    // 2) 런던: 브르타뉴를 돌아감 · 먼 바다
    const sv = st.path; SEA.goCity(L);
    ok(st.path && st.path.length > 3 && st.pilot && landHits(st.path) === 0, '리스본→런던도 바닷길 (굽이 ' + st.path.length + ')');
    SEA.setTarget(5, 38.5, null);
    ok(st.path && st.path.length > 3 && st.pilot && !st.direct && landHits(st.path) === 0, '먼 바다(지중해 5°E 38.5°N) 클릭도 지브롤터를 돌아가는 바닷길 (굽이 ' + (st.path && st.path.length) + ')');
    // 3) 끝까지: 제노바
    SEA.goCity(B);
    const tick = async (n) => { for (let i = 0; i < n; i++) { st.npcs = st.keepNpc ? st.npcs : []; SEA.update(0.1); for (let w = 0; w < 20 && st.busy && !G.UI.busy(); w++) await new Promise(r => setTimeout(r, 0)); if (G.UI.busy()) return 'ui'; } return 'ok'; };
    const pick = async () => { const mb = [...document.querySelectorAll('.modal-back')].pop(); if (!mb) return; (mb.querySelector('.dlg') || mb).click(); await new Promise(r => setTimeout(r, 30)); };
    await tick(60); for (let k = 0; k < 10 && G.UI.busy(); k++) await pick();
    // 해전에서 돌아온 것처럼
    G.Game.go('sea', { resume: true }); st = SEA.runtime();
    ok(!st.paused && st.path && st.pilot, '해전 뒤 바닷길 항해를 이어 감 (' + (toasts.slice(-1)[0] || '').slice(0, 50) + ')');
    st.speed = 4;                                  // 시험을 빨리 — 배속만 올림 (자동항해는 아님)
    let stuck = 0;
    for (let k = 0; k < 900 && window.__arr == null; k++) { const q = await tick(40); if (q === 'ui') await pick(); if (st.paused && st.path && !st.pendingPort && !G.UI.busy()) { stuck++; if (stuck > 3) break; st.paused = false; } }   // 길 가운데 멈춤만 센다 (입항 대기는 아님)
    ok(window.__arr === B, '제노바에 들어감 (arr=' + window.__arr + ', 남은 ' + G.Geo.dist(s.loc.lon, s.loc.lat, 8.93, 44.4).toFixed(2) + '°, 멈춤 ' + stuck + ')');
    if (window.__arr !== B) R.push('   디버그: paused=' + st.paused + ' path=' + (st.path && st.path.length) + ' pathI=' + st.pathI + ' tgt=' + JSON.stringify(st.target && [st.target.lon, st.target.lat]) + ' loc=' + s.loc.lon.toFixed(2) + ',' + s.loc.lat.toFixed(2) + ' busy=' + st.busy + ' ui=' + G.UI.busy() + ' dock=' + JSON.stringify(G.CITY_DATA[B].dock) + ' toasts=' + toasts.slice(-4).join(' | ').slice(0, 300));
    ok(!toasts.some(t => /뭍에 막혔/.test(t)), '가는 동안 뭍에 막히지 않음');
    // 4) 이제 열린 항로 → 자동항해
    s.routes[G.Routes.key(A, B)] = { n: 1 };
    G.Game.go('sea', { depart: B }); st = SEA.runtime(); st.speed = 2;
    SEA.goCity(A);
    ok(st.autoOn && !st.pilot && st.speed === ((G.FX && G.FX.autoSailSpeed) || 4), '열린 항로는 자동항해 ×' + st.speed);
    // 5) 해도 항로 선이 바닷길을 따름
    const CV = G.ChartView; let rp = null;
    if (CV && CV.routePath) rp = CV.routePath(A, B);
    ok(rp && rp.length > 4 && landHits(rp.slice(1)) === 0, '해도 항로 선: 바닷길 ' + (rp && rp.length) + '굽이');
    return R;
  });
  console.log(out.join('\n')); console.log(errs.slice(0, 5).join('\n') || '✓ 콘솔 오류 없음'); await b.close();
  process.exitCode = out.some(x => x[0] === '✗') || errs.length ? 1 : 0;
})();
