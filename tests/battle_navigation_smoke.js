/* 해전 길찾기·배속 점검 (js/scenes/battle.js navGoal·navPath·unstick·shorePad · 해전 배속) — node tests/battle_navigation_smoke.js   (BROWSER_EXE=크롬 경로)
   · 섬 너머 목표를 누르면 곧장 해안에 붙어 멈추지 않고 물길을 돌아 닿는다 (예전: 섬 기슭에 걸려 멈춤)
   · 좁은 해협(메시나·다르다넬스·외레순)에서 큰 배가 들어갈 수 있는 물이 넓어졌다 (해안 여유를 선체 길이의 반 → 선체 폭으로)
   · 해전 배속 ×1·×2·×3 — 같은 길을 ×3이면 훨씬 빨리 간다 · 설정에 남는다 · 콘솔 오류 0 · 화면: /tmp/battle_nav */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = '/tmp/battle_nav';
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  function hook(pg) {
    pg.on('pageerror', e => errors.push(e.message)); pg.on('console', m => { if (m.text().startsWith('##')) console.log('   ' + m.text().slice(2)); });
    pg.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME/.test(m.text())) errors.push(m.text()); });
  }
  hook(page);
  await page.addInitScript(() => { window.createImageBitmap = undefined; });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    // 2) 좁은 해협 (먼저 — 해전 화면을 오래 띄운 뒤에는 느린 그래픽에서 페이지가 무거워진다)
    const straits = await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init();
      const s = G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const out = {};
      for (const [nm, lon, lat] of [['메시나', 15.62, 38.2], ['다르다넬스', 26.4, 40.2], ['외레순', 12.7, 55.9]]) {
        s.loc = { mode: 'sea', lon, lat, heading: 0 };
        G.Game.go('battle', { npc: { kind: 'merchant', n: 1, K: 0 } });
        await new Promise(r => setTimeout(r, 300));
        document.querySelectorAll('.modal-back').forEach(e => e.remove());
        const B = G.Scenes.battle, T = B._t(), st = B.debug();
        let water = 0, okBig = 0; const big = { len: 153 };
        for (let y = -400; y <= 400; y += 10) for (let x = -400; x <= 400; x += 10) { const ll = T.geoAt(x, y); if (G.Geo.sdf(ll[0], ll[1]) > -0.05) continue; water++; if (!T.terrainBlocked(x, y, big)) okBig++; }
        out[nm] = +(okBig / water).toFixed(2); st.over = true;
      }
      return out;
    });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init();
      const out = {};
      const s = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state = s; s.fleet.ships = s.fleet.ships.slice(0, 1);
      async function start(lon, lat) {
        s.loc = { mode: 'sea', lon, lat, heading: 0 };
        G.Game.go('battle', { npc: { kind: 'merchant', n: 1, K: 0 } });
        await new Promise(r => setTimeout(r, 600));
        document.querySelectorAll('.modal-back').forEach(e => e.remove());
        const B = G.Scenes.battle; return { B, st: B.debug(), T: B._t() };
      }
      // 1) 섬 너머 목표 (키클라데스 제도)
      let { B, st, T } = await start(25.3, 37.0);
      let me = st.ships.find(x => x.side === 'me'), en = st.ships.find(x => x.side === 'en');
      const sx = me.x, sy = me.y; let goal = null, best = 0;
      for (let k = 0; k < 36; k++) for (const d of [700, 1000, 1200]) {
        const a = k / 36 * 6.283, gx = sx + Math.cos(a) * d, gy = sy + Math.sin(a) * d;
        if (Math.hypot(gx, gy) > 1500 || T.terrainBlocked(gx, gy, me) || T.lineClear(me, gx, gy)) continue;
        const p = T.navPath(me, gx, gy); if (!p) continue;
        let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        const ratio = L / d; if (ratio > 1.2 && ratio < 2.2 && ratio > best) { best = ratio; goal = [gx, gy]; }
      }
      out.goal = goal && { ratio: +best.toFixed(2) }; console.log('##목표 ' + JSON.stringify(out.goal));
      async function sail(speed) {
        me.x = sx; me.y = sy; me.vel = [0, 0]; me.heading = Math.atan2(goal[1] - sy, goal[0] - sx); me.moveTo = goal.slice(); me.target = null; me.steer = null; me.halt = false; me.route = null; me.detour = null; me.stk = null;
        B.speed(speed);
        let t = 0, min = 1e9;
        for (let i = 0; i < 450; i++) {
          en.x = 1000; en.y = 1000; en.vel = [0, 0]; en.moveTo = null; en.target = null; en.alive = true;
          if (!me.moveTo) me.moveTo = goal.slice();
          st.paused = false; st.busy = 0; B.update(0.2); t += 0.2;
          const d = Math.hypot(me.x - goal[0], me.y - goal[1]); if (d < min) min = d;
          if (d < 45) break;
        }
        return { t: +t.toFixed(1), min: Math.round(min) };
      }
      const tt = performance.now(); if (goal) { out.x1 = await sail(1); console.log('##×1 ' + JSON.stringify(out.x1) + ' ' + Math.round(performance.now() - tt) + 'ms'); out.x3 = await sail(3); console.log('##×3 ' + JSON.stringify(out.x3)); }
      out.setting = s.settings.battleSpeed;
      out.ui = [...document.querySelectorAll('.sailbar .speedctl .opt')].map(o => o.textContent + (o.classList.contains('on') ? '*' : '')).join(' ');
      B.speed(1);
      return out;
    });
    r.straits = straits;
    await page.screenshot({ path: path.join(OUT, '1_battle.png'), timeout: 60000 }).catch(() => console.log('   (스크린샷 건너뜀 — 느린 그래픽)'));
    console.log(JSON.stringify(r));
    ok(r.goal && r.x1 && r.x1.min < 60, '섬 너머 목표(곧은 길의 ' + (r.goal && r.goal.ratio) + '배 물길)에 해안에 걸리지 않고 닿았다 (' + (r.x1 && r.x1.t) + '초)');
    ok(r.x3 && r.x3.min < 60 && r.x3.t < r.x1.t * 0.5, '해전 배속 ×3: 같은 길을 ' + (r.x3 && r.x3.t) + '초 (×1은 ' + (r.x1 && r.x1.t) + '초)');
    ok(r.setting === 3 && /×1 ×2 ×3\*/.test(r.ui), '배속 단추 「' + r.ui + '」 · 설정에 남는다 (battleSpeed ' + r.setting + ')');
    ok(Object.values(r.straits).every(v => v >= 0.8), '좁은 해협에서 큰 배가 들어갈 수 있는 물 ' + JSON.stringify(r.straits) + ' (예전 0.65~0.7)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 화면: ' + OUT);
  } catch (e) { console.error('✗ ' + e.message + '\n' + errors.join('\n')); process.exitCode = 1; }
  await browser.close();
})();
