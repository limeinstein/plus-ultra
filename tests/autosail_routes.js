/* 자동항해 여러 항로 시험 (tests/autosail_routes.js) — N=40 SEED=7 RS=1 node tests/autosail_routes.js
   알려진 항구 가운데 2~30° 떨어지고 같은 바다로 이어진 쌍을 골라, 쌍마다 새 게임에서 그 항로를 열어 두고 goCity → 입항까지 돌린다(배속 ×4).
   해적·폭풍·발견 카드는 끄고 바다 사건 대화는 첫 단추로 넘긴다. 같은 SEED·RS면 같은 쌍·같은 바람. 실패하면 OUT 폴더의 fail_*.txt에 마지막 자취.
   25쌍마다 페이지를 새로 연다(오래 돌리면 느려짐). 지구 반 바퀴 항로(200일 넘게)는 'days'로 끝난다. */
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const N = +(process.env.N || 40), SEED = +(process.env.SEED || 7), RS = +(process.env.RS || 1), ROOT = path.resolve(__dirname, '..'), TAG = process.env.TAG || 'run';
const OUTDIR = process.env.OUT || require('os').tmpdir();
const fs = require('fs');
async function openPage(b) {
  const page = await b.newPage({ viewport: { width: 640, height: 360 } });
  page.errs = []; page.on('pageerror', e => page.errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) page.errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript(() => { let __s = 12345; window.__seed = n => { __s = (n >>> 0) || 1; }; Math.random = () => { __s ^= __s << 13; __s >>>= 0; __s ^= __s >>> 17; __s ^= __s << 5; __s >>>= 0; return __s / 4294967296; }; window.requestAnimationFrame = () => 0; window.createImageBitmap = undefined; document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '*{animation:none!important;transition:none!important} body > *{visibility:hidden!important} canvas{display:none!important}'; document.head.appendChild(st); }); });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea, null, { timeout: 120000 });
  await page.evaluate(async () => { await G.Game.ensureGeo(); G.Nav.init(); });
  return page;
}
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  let page = await openPage(b);
  let pairs = await page.evaluate(([N, SEED]) => {
    let seed = SEED; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    const ports = G.CITY_DATA.filter(c => c && c.port && G.R.cityExists(c));
    const out = []; let tries = 0;
    while (out.length < N && tries++ < 20000) {
      const a = ports[Math.floor(rnd() * ports.length)], c = ports[Math.floor(rnd() * ports.length)]; if (a === c) continue;
      const d = G.Geo.dist(a.lon, a.lat, c.lon, c.lat); if (d < 2 || d > 30) continue;
      const da = a.dock || [a.lat, a.lon], db = c.dock || [c.lat, c.lon];
      const sa = G.Nav.nearestSea(da[1], da[0], 12), sb = G.Nav.nearestSea(db[1], db[0], 12); if (!sa || !sb || G.Nav.component(sa[0], sa[1]) !== G.Nav.component(sb[0], sb[1])) continue;
      const p = G.Nav.path(sa[0], sa[1], db[1], db[0], 120000); if (!p) continue;
      let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(G.Geo.wrapLon(p[i][0] - p[i - 1][0]), p[i][1] - p[i - 1][1]);
      if (L > 50) continue;
      out.push([a.id, c.id, +L.toFixed(1)]);
    }
    return out;
  }, [N, SEED]);
  if (process.env.PAIRS) pairs = JSON.parse(process.env.PAIRS);
  console.log('pairs', pairs.length);
  let ok = 0, n = 0, long = 0; const errs = [];
  for (const [A, B, L] of pairs) {
    if (n && n % 25 === 0) { errs.push(...page.errs); await page.close(); page = await openPage(b); }
    n++;
    const t0 = Date.now();
    const r = await page.evaluate(async ([A, B, RS]) => {
      window.__seed(A * 7919 + B * 104729 + RS);
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; G.Disc.find = async () => {}; G.Disc.pickupLeft = async () => {}; G.Explore.report = async () => {}; G.Explore.milestones = async () => {};
      const s = G.Game.state; s.routes = {}; s.routes[G.Routes.key(A, B)] = { n: 1 }; if (s.known.indexOf(B) < 0) s.known.push(B); s.fleet.food = 9999; s.fleet.water = 9999;
      window.__arr = null; G.Scenes.city.handleEntry = async c => { window.__arr = c.id; return false; };
      const toasts = []; if (!G.UI.__t0) G.UI.__t0 = G.UI.toast; G.UI.toast = function (m) { toasts.push(String(m).slice(0, 70)); return G.UI.__t0.apply(this, arguments); };
      G.Game.go('sea', { depart: A }); const SEA = G.Scenes.sea, st = SEA.runtime(); st.speed = 4;
      SEA.goCity(B); const auto = !!st.autoOn;
      const trail = []; let lastPos = [s.loc.lon, s.loc.lat], still = 0, hang = 0, i = 0, why = '';
      const wall = performance.now();
      while (s.fleet.daysOut < 200) {
        if (performance.now() - wall > 240000) { why = 'wall'; break; }
        st.npcs = []; s.fleet.scurvy = 0; SEA.update(0.1); i++;
        for (let w = 0; w < 30 && st.busy && !G.UI.busy(); w++) await new Promise(r => setTimeout(r, 0));
        if (G.UI.busy()) { const mb = [...document.querySelectorAll('.modal-back')].pop(); const bt = mb && mb.querySelector('button'); if (bt) bt.click(); else if (mb) (mb.querySelector('.dlg') || mb).click(); await new Promise(r => setTimeout(r, 15)); hang = 0; continue; }
        if (st.busy) { if (++hang > 300) { why = 'busy-hang'; break; } continue; } else hang = 0;
        if (i % 4 === 0) { trail.push([i, s.fleet.daysOut, +s.loc.lon.toFixed(3), +s.loc.lat.toFixed(3), +s.loc.heading.toFixed(2), st.pathI, st.path ? st.path.length : 0, st.repath, +(st.tackTheta || 0).toFixed(2), st.paused ? 1 : 0, +Math.hypot(st.vel[0], st.vel[1]).toFixed(3), st.calm, st.prog ? st.prog.n : -1]); if (trail.length > 80) trail.shift(); }
        if (window.__arr != null) break;
        if (st.paused && !st.path && !st.pendingPort) { await new Promise(r => setTimeout(r, 150)); if (window.__arr != null) break; why = 'stopped'; break; }
        if (i % 40 === 0) { const d = Math.hypot(s.loc.lon - lastPos[0], s.loc.lat - lastPos[1]); lastPos = [s.loc.lon, s.loc.lat]; if (d < 0.02 && !st.paused) { if (++still > 8) { why = 'still'; break; } } else still = 0; }
      }
      if (!why && window.__arr == null) why = 'days';
      const c = G.CITY_DATA[B], db = c.dock || [c.lat, c.lon];
      return { A, B, an: G.CITY_DATA[A].name, bn: c.name, auto, arr: window.__arr, why, days: s.fleet.daysOut, left: +G.Geo.dist(s.loc.lon, s.loc.lat, db[1], db[0]).toFixed(2), loc: [+s.loc.lon.toFixed(2), +s.loc.lat.toFixed(2)], toasts: toasts.filter(t => !/출항|자동항해합니다|계절풍|쥐가|콜론|선원들에게|피로가/.test(t)).slice(-3), P: st.path && st.path.map(q => q.map(v => +v.toFixed(2))), trail };
    }, [A, B, RS]);
    const good = r.arr === B; if (good) ok++; else if (r.why === 'days') long++; if (!good) r.scene = await page.evaluate(() => { for (const k in G.Scenes) if (G.Scenes[k] === G.Game.scene) return k + ' alive=' + !!(G.Scenes.sea.runtime() && G.Scenes.sea.runtime().alive); return '?'; });
    console.log((good ? 'OK  ' : 'FAIL') + ' ' + r.an + '→' + r.bn + ' L=' + L + ' days=' + r.days + ' left=' + r.left + ' t=' + Math.round((Date.now() - t0) / 1000) + 's' + (good ? '' : ' why=' + r.why + ' arr=' + r.arr + ' scene=' + r.scene + ' loc=' + r.loc + ' ' + JSON.stringify(r.toasts)));
    if (!good) fs.appendFileSync(path.join(OUTDIR, 'autosail_fail_' + TAG + '.txt'), JSON.stringify(r) + '\n');
  }
  errs.push(...page.errs);
  console.log('ARRIVED ' + ok + '/' + pairs.length + (long ? ' (200일 넘는 먼 항로 ' + long + ')' : '')); console.log([...new Set(errs)].slice(0, 10).join('\n') || '콘솔 오류 없음'); await b.close();
  process.exitCode = ok + long === pairs.length ? 0 : 1;
})();
