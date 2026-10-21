/* 설정 「맞바람 지그재그」 (2026-10-21) — G.Ctrl.tackMode · js/scenes/sea.js tackAllowed
   · 곧게(기본): 맞바람 침로에서 뱃머리가 흔들리지 않고 곧게 — 다가가는 빠르기는 지그재그(언제나)와 같다
   · 언제나: 예전처럼 좌우로 번갈아 (다리 각도 θ)
   · 먼바다에서만: 대양 한가운데서는 지그재그, 해안 곁에서는 곧게
   · 설정 화면에 세 단추 · 콘솔 오류 0
   node tests/tack_mode_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => { await G.Game.ensureGeo(); G.Nav.init(); });
    await page.evaluate(() => {
      const s = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      s.flags.prologue = true; s.settings.res = 0.5; s.date = { y: 1500, m: 5, d: 1 };
      s.loc = { mode: 'city', city: 0 }; G.Game.state = s; G.Game.go('sea', { depart: 0, fresh: true });
    });
    await page.waitForFunction(() => G.Game.scene === G.Scenes.sea && G.Scenes.sea.runtime(), null, { timeout: 60000 });
    const r = await page.evaluate(async () => {
      const SEA = G.Scenes.sea, st = SEA.runtime(), s = G.Game.state, l = s.loc;
      G.UI.toast = () => {};
      // 정해진 자리·바람에서 맞바람 침로를 잡고 n걸음 돌린다
      async function run(mode, lon, lat, windDir, crs, n) {
        s.settings.tackMode = mode;
        l.lon = lon; l.lat = lat; l.heading = crs; st.vel = [0, 0]; st.storm = 0; st.calm = 0; st.slowDays = 0;
        st.wind = { dir: windDir, spd: 0.6 }; st.windVis = { dir: windDir, spd: 0.6 };
        SEA.takeCourse(crs);
        const d0 = s.fleet.daysOut || 0; let maxOff = 0, tackSteps = 0, steps = 0, slides = 0, lastLon = lon, lastLat = lat;
        for (let i = 0; i < n; i++) {
          st.busy = 0; st.paused = false; st.wind = { dir: windDir, spd: 0.6 }; st.storm = 0; st.calm = 0;
          st.dayAcc = 0; st.frame = 1;                     // 날이 넘어가는 일·바다의 만남은 빼고 배의 움직임만 본다
          SEA.update(0.05); steps++;
          if (i > 60) { maxOff = Math.max(maxOff, Math.abs(G.U.angDiff(l.heading, crs))); if (st.tackTheta) tackSteps++; }
          
        }
        const along = (l.lon - lon) * Math.cos(crs) + (l.lat - lat) * Math.sin(crs), t = (st.sailT || 0);
        return { mode, end: [+l.lon.toFixed(2), +l.lat.toFixed(2)], maxOffDeg: Math.round(maxOff * 180 / Math.PI), tackPct: Math.round(tackSteps / (n - 60) * 100), along: +along.toFixed(3), upwind: !!st.upwind };
      }
      const out = {};
      // ① 대서양 한가운데 — 서풍(동쪽으로 부는 바람)을 안고 서쪽으로
      out.openOff = await run('off', -35, 30, 0, Math.PI, 600);
      out.openOn = await run('on', -35, 30, 0, Math.PI, 600);
      out.openOpen = await run('open', -35, 30, 0, Math.PI, 600);
      // ② 영국 해협(도버 앞) — 서풍을 안고 서쪽으로: 좌우 다리가 곧 잉글랜드·프랑스 해안
      out.coastOpen = await run('open', 1.25, 50.85, 0, Math.PI, 170);
      out.coastOn = await run('on', 1.25, 50.85, 0, Math.PI, 170);
      s.settings.tackMode = undefined; out.def = G.Ctrl.tackMode();
      // 설정 값: 저장된 값이 이상하면 곧게
      s.settings.tackMode = 'open'; const a1 = G.Ctrl.tackMode(); s.settings.tackMode = 'zz'; const a2 = G.Ctrl.tackMode(); s.settings.tackMode = undefined;
      out.ui = { a1, a2 };
      return out;
    });
    for (const k of ['openOff', 'openOn', 'openOpen', 'coastOpen', 'coastOn']) console.log('   ' + k.padEnd(9) + JSON.stringify(r[k]).slice(0, 160));
    const src = require('fs').readFileSync(path.join(__dirname, '..', 'js/ui/info.js'), 'utf8');
    ok(r.def === 'off', '기본은 「곧게 가기」');
    ok(r.openOff.maxOffDeg <= 6 && r.openOff.tackPct === 0 && r.openOff.upwind, '곧게: 맞바람 침로에서 뱃머리가 거의 흔들리지 않는다 (최대 ' + r.openOff.maxOffDeg + '°)');
    ok(r.openOn.maxOffDeg >= 30 && r.openOn.tackPct > 50, '언제나: 예전처럼 좌우로 번갈아 (최대 ' + r.openOn.maxOffDeg + '° 꺾음)');
    ok(r.openOff.along > 0 && r.openOff.along >= r.openOn.along * 0.95, '곧게 가도 목적 방향으로 다가간 거리는 지그재그만큼 (곧게 ' + r.openOff.along + '° · 지그재그 ' + r.openOn.along + '°)');
    ok(r.openOpen.tackPct > 50, '먼바다에서만: 대양 한가운데서는 지그재그 (' + r.openOpen.tackPct + '%)');
    ok(r.coastOpen.tackPct === 0 && r.coastOpen.maxOffDeg <= 8 && r.coastOn.tackPct > 0, '먼바다에서만: 좁은 영국 해협에서는 곧게 (언제나는 지그재그 ' + r.coastOn.tackPct + '%)');
    ok(r.ui.a1 === 'open' && r.ui.a2 === 'off' && /맞바람 지그재그/.test(src) && /\['off', '곧게 가기'\], \['open', '먼바다에서만'\], \['on', '언제나'\]/.test(src) && /data-tk/.test(src) && /st\.tackMode = o\.dataset\.tk/.test(src), '설정 화면 「맞바람 지그재그」: 곧게 가기 · 먼바다에서만 · 언제나 (이상한 값이면 곧게)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
