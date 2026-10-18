/* 트리니다드 개척지 출항 점검 (js/world/geo.js Geo.CHANNELS · js/world/nav.js viaChannels) — node tests/trinidad_channel_smoke.js   (BROWSER_EXE=크롬 경로)
   파리아 만 안의 개척지 부두에서 나가는 해협(원숭이 입 · 뱀의 입)이 지도 자료에서 얕은 물로만 이어져 배가 걸렸다 → 배가 다닐 물길을 낸다.
   · 수로는 그림의 뭍을 가르지 않는다 · 부두에서 배가 다니는 물로 북쪽·남쪽 바다에 닿는다 · 개척지 부두 일곱 곳 모두 바깥 바다로 이어진다
   · 뱃길(드나드는 쪽 모두)이 수로를 따라가 뭍을 가로지르지 않는다 · 실제로 출항해 카라카스까지 막히지 않고 간다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; window.createImageBitmap = undefined; });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init();
      const Geo = G.Geo, out = {};
      // 1) 수로가 그림의 뭍을 가르지 않는다 (수로를 잠시 빼고 본 바탕과 견준다)
      const keep = Geo.CHANNELS; let onLand = 0, n = 0;
      const pts = []; for (let lat = 9.9; lat <= 10.9; lat += 0.005) for (let lon = -62.1; lon <= -61.7; lon += 0.005) if (Geo.channelSdf(lon, lat) != null && Geo.channelSdf(lon, lat) < -0.05) pts.push([lon, lat]);
      Geo.CHANNELS = []; pts.forEach(p => { n++; if (Geo.sdf(p[0], p[1]) > 0) onLand++; }); Geo.CHANNELS = keep;
      out.carve = { n, onLand };
      // 2) 부두에서 배가 다니는 물(sdf < −0.2)로 어디까지 닿는가
      function reach(lon, lat, R, STP) {
        const st = G.Nav.nearestSea(lon, lat, 12) || [lon, lat], nn = Math.round(2 * R / STP) + 1, seen = new Uint8Array(nn * nn), q = [];
        const sx = Math.round((st[0] - (lon - R)) / STP), sy = Math.round((st[1] - (lat - R)) / STP); seen[sy * nn + sx] = 1; q.push([sx, sy]);
        const hit = { edge: false, north: false, south: false };
        while (q.length) { const [x, y] = q.pop(); const X = lon - R + x * STP, Y = lat - R + y * STP;
          if (x === 0 || y === 0 || x === nn - 1 || y === nn - 1) hit.edge = true;
          if (Y > lat + 0.26 && X > -61.9 && X < -61.6) hit.north = true; if (Y < lat - 0.62 && X > -61.85) hit.south = true;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, c = y + dy; if (a < 0 || c < 0 || a >= nn || c >= nn) continue; const k = c * nn + a; if (seen[k]) continue; seen[k] = 1; if (Geo.isSea(lon - R + a * STP, lat - R + c * STP, 0.2)) q.push([a, c]); } }
        return hit;
      }
      out.trin = reach(-61.569, 10.596, 1.0, 0.008);
      out.sites = (G.COLONY_SITES || []).map(s => { const d = s.dock || [s.lat, s.lon]; return [s.place, reach(d[1], d[0], 1.6, 0.025).edge]; });
      // 3) 뱃길: 개척지 → 카라카스 · 카라카스 → 개척지 · 남동쪽 바다 → 개척지
      const maxSdf = p => { let m = -9; for (let i = 1; i < p.length; i++) { const a = p[i - 1], c = p[i], k = Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 0.005); for (let j = 1; j < k; j++) { const X = a[0] + (c[0] - a[0]) * j / k, Y = a[1] + (c[1] - a[1]) * j / k; if (X < -62.2 || X > -61.4 || Y < 9.9 || Y > 11.0) continue; m = Math.max(m, Geo.sdf(X, Y)); } } return +m.toFixed(2); };   // 파리아 만·두 해협 둘레만 (카라카스 부두 토막은 빼고)
      const viaCh = p => p.some(q => Geo.channelSdf(q[0], q[1]) != null);
      const car = G.CITY_DATA.find(c => c && c.name === '카라카스'), cd0 = car.dock || [car.lat, car.lon], cd = [cd0[1], cd0[0]];
      const p1 = G.Nav.seaPath(-61.569, 10.596, cd[0], cd[1]), p2 = G.Nav.seaPath(cd[0], cd[1], -61.569, 10.596), p3 = G.Nav.seaPath(-60.0, 9.0, -61.569, 10.596);
      out.paths = [p1, p2, p3].map(p => p ? { n: p.length, max: maxSdf(p), ch: viaCh(p) } : null);
      // 4) 실제 항해: 개척지를 세우고 출항해 카라카스로
      G.State.newGame({ name: '후안', nation: 'ES', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; G.Disc.find = async () => {}; G.Explore.report = async () => {}; G.Explore.milestones = async () => {};
      if (G.Rain) G.Rain.chance = () => 0;
      const s = G.Game.state; s.date = { y: 1550, m: 3, d: 1 }; s.fleet.food = 5000; s.fleet.water = 5000; s.player.gold = 50000;
      const e = G.Colony.plant('carib'); if (s.known.indexOf(car.id) < 0) s.known.push(car.id);
      window.__arr = null; G.Scenes.city.handleEntry = async c => { window.__arr = c.id; return false; };
      const toasts = []; const t0 = G.UI.toast; G.UI.toast = function (m) { toasts.push(String(m)); return t0.apply(this, arguments); };
      const pick = async () => { const mb = [...document.querySelectorAll('.modal-back')].pop(); if (!mb) return; const bt = mb.querySelector('.askrow .btn, .choice:not(.dis)'); (bt || mb.querySelector('.dlg') || mb).click(); await new Promise(r => setTimeout(r, 10)); };
      G.Game.go('sea', { depart: e.id }); const SEA = G.Scenes.sea, st = SEA.runtime(); st.speed = 4;
      SEA.goCity(car.id);
      const tick = async (k) => { for (let i = 0; i < k; i++) { st.npcs = []; SEA.update(0.1); for (let w = 0; w < 20 && st.busy && !G.UI.busy(); w++) await new Promise(r => setTimeout(r, 0)); if (G.UI.busy()) return 'ui'; } return 'ok'; };
      let stops = 0, outDay = null; const d0 = s.day;
      for (let k = 0; k < 150 && window.__arr == null; k++) {
        const q = await tick(20); if (q === 'ui') await pick();
        if (outDay == null && (s.loc.lon < -62.3 || s.loc.lat > 10.9)) outDay = s.day - d0;   // 파리아 만을 빠져나왔다
        if (G.Geo.dist(s.loc.lon, s.loc.lat, cd[0], cd[1]) < 0.5) break;
        if (st.paused && !st.pendingPort && !G.UI.busy() && window.__arr == null) { stops++; if (stops > 3) break; SEA.goCity(car.id); }
      }
      out.sail = { outDay, near: G.Geo.dist(s.loc.lon, s.loc.lat, cd[0], cd[1]) < 0.6, stops, blocked: toasts.filter(t => /막혀|막혔/.test(t)), loc: [+s.loc.lon.toFixed(2), +s.loc.lat.toFixed(2)], days: s.day - d0 };
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.carve.n > 50 && r.carve.onLand <= r.carve.n * 0.02, '수로는 이미 물로 그려진 얕은 물 위로만 (' + r.carve.n + '점 중 뭍 ' + r.carve.onLand + ')');
    ok(r.trin.north && r.trin.south, '개척지 부두에서 배가 다니는 물로 북쪽(원숭이 입)·남쪽(뱀의 입) 바다에 닿는다');
    ok(r.sites.every(x => x[1]), '개척지 부두 ' + r.sites.length + '곳 모두 바깥 바다로 이어진다 (' + r.sites.map(x => x[0] + (x[1] ? '' : '✗')).join(' · ') + ')');
    ok(r.paths.every(p => p && p.max < 0 && p.ch), '뱃길이 수로를 따라 뭍을 가로지르지 않는다 (나갈 때·카라카스에서 들어올 때·남동쪽에서 들어올 때 최대 sdf ' + r.paths.map(p => p && p.max).join(' / ') + ')');
    ok(r.sail.outDay != null && r.sail.outDay <= 8 && r.sail.near && !r.sail.blocked.length && r.sail.stops === 0, '개척지에서 출항해 ' + r.sail.outDay + '일 만에 만을 빠져나와 카라카스 앞바다까지 멈추지 않고 갔다 (' + r.sail.days + '일)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }
  await browser.close();
})();
