/* 갇힌 항구가 없다 (2026-10-21 과야킬) — js/world/geo.js CHANNELS
   길찾기(G.Nav)는 거친 격자라 「이어졌다」고 보는데, 배가 실제로 부딪치는 물가(G.Geo.isLand)에서는 얇은 뭍이 막아
   부두 앞바다가 갇힌 못이 되는 곳이 있었다 (과야킬: 입항하면 나오지 못함).
   · 모든 항구(뒤에 세워지는 도시까지)의 부두에서 물가를 따라 물을 채우면 ±1.6° 밖의 바다에 닿는다
   · 과야킬: 시가는 뭍, 부두는 물 · 출항해 과야킬만 밖(서경 80.7° 너머)까지 실제로 나간다
   node tests/port_trap_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady && G.Nav && G.Nav.ready(), null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      const out = [], step = 0.03, R = 1.6; let ports = 0;
      G.CITY_DATA.forEach(c => {
        if (!c || !c.port) return; ports++;
        const d = c.dock || [c.lat, c.lon], s = G.Nav.nearestSea(d[1], d[0], 12) || [d[1], d[0]];
        const n = Math.round(2 * R / step), seen = new Uint8Array((n + 1) * (n + 1)), q = [], x0 = s[0] - R, y0 = s[1] - R, idx = (i, j) => j * (n + 1) + i;
        const si = Math.round(R / step); q.push([si, si]); seen[idx(si, si)] = 1; let open = false, cnt = 0;
        while (q.length && cnt < 40000) {
          const [i, j] = q.pop(); cnt++;
          if (i <= 0 || j <= 0 || i >= n || j >= n) { open = true; break; }
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const ii = i + a, jj = j + b, k = idx(ii, jj); if (seen[k]) return; seen[k] = 1; if (!G.Geo.isLand(x0 + ii * step, y0 + jj * step)) q.push([ii, jj]); });
        }
        if (!open) out.push(c.name);
      });
      const g = G.CITY_DATA.find(c => c.name === '과야킬');
      return { ports, trapped: out, cityLand: G.Geo.isLand(g.lon, g.lat), dockSea: !G.Geo.isLand(g.dock[1], g.dock[0]) };
    });
    ok(!r.trapped.length, '항구 ' + r.ports + '곳(뒤에 세워지는 도시까지) 모두 부두에서 큰 바다로 나갈 물길이 있다 ' + r.trapped.join(', '));
    ok(r.cityLand && r.dockSea, '과야킬: 시가는 뭍, 부두는 물');
    // 과야킬에서 출항해 만 밖으로 — 바다 장면을 직접 돌린다
    await page.evaluate(() => {
      const s = G.State.newGame({ name: '시험', nation: 'ES', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      s.flags.prologue = true; s.settings.res = 0.5; s.date = { y: 1600, m: 5, d: 1 };
      s.loc = { mode: 'city', city: 273 }; G.Game.state = s; G.Game.go('sea', { depart: 273, fresh: true });
    });
    await page.waitForFunction(() => G.Game.scene === G.Scenes.sea && G.Scenes.sea.runtime(), null, { timeout: 60000 });
    const run = await page.evaluate(async () => {
      const SEA = G.Scenes.sea, st = SEA.runtime(), l = G.Game.state.loc, lon0 = l.lon;
      G.UI.say = async () => {}; G.UI.toast = () => {}; if (G.Pace) G.Pace.ok = () => true;
      document.querySelectorAll('.modal-back').forEach(m => m.remove());
      SEA.setTarget(-81.1, -2.62);
      const plen = st.path ? st.path.length : 0; let minLon = l.lon;
      for (let i = 0; i < 6000 && l.lon > -80.75; i++) { st.busy = 0; st.paused = false; try { SEA.update(0.05); } catch (e) { return { err: e.message }; } if (i % 200 === 0) await new Promise(r => setTimeout(r, 0)); minLon = Math.min(minLon, l.lon); if (!st.path && l.lon > -80.75) SEA.setTarget(-81.1, -2.62); }
      return { lon0, lon: l.lon, lat: l.lat, plen, minLon };
    });
    console.log('   ' + JSON.stringify(run));
    ok(!run.err && run.minLon < -80.75, '과야킬에서 출항해 엘모로 수로로 만 밖까지 나간다 (서경 ' + (-run.lon0).toFixed(2) + '° → ' + (-run.minLon).toFixed(2) + '°)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
