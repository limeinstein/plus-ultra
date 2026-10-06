/* 지진·해일·포격 흔들림 점검 (js/art/quakefx.js — G.Quake · G.Shake)
   · 탐험(지진): 전조는 아주 약하게, 본진은 좌우 위주로 거칠게, 끝나면 어긋남이 정확히 0(null). 카메라·탐험대의 실제 좌표는 그대로.
     흔들리는 동안 클릭한 화면 자리가 그 자리의 세상 좌표로 정확히 바뀐다. 상태창·단추·#stage는 움직이지 않는다.
   · 항해(해일): 물결이 배를 들고 밀어도 실제 좌표·뱃머리는 그대로, 끝나면 0. 클릭도 정확하다.
   · 해전(포격): 좌우 위주 흔들림, 맞은 배의 떨림은 그림만, 끝나면 0, 클릭 변환이 보인 자리와 맞는다.
   · 이어지는 노이즈인가(한 장면 사이의 변화가 이어진다), 사인파 하나가 아닌가(양 끝 폭이 고르지 않다)
   스크린샷: OUT 폴더 (quake_pre.png · quake_main.png · tsunami_main.png · battle_hit.png)
   node tests/quake_smoke.js  (BROWSER_EXE=크롬 경로) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'quake_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  const clear = async () => { for (let i = 0; i < 12 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); } };
  // 장면을 rAF마다 기록한다 (효과 시작부터 sec초)
  const record = (sceneExpr, sec) => page.evaluate(([expr, sec]) => new Promise(res => {
    const out = [], t0 = performance.now(), st = eval(expr), l = G.Game.state.loc;
    const ui = [...document.querySelectorAll('#ui > *, #hud, .hud, .topbar')].filter(e => !e.classList.contains('mapcatch') && e.getBoundingClientRect().width > 0).slice(0, 14);
    const pos = e => { const r = e.getBoundingClientRect(); return r.left.toFixed(2) + ',' + r.top.toFixed(2) + ' ' + r.width.toFixed(0) + 'x' + r.height.toFixed(0); };   // 자리와 크기 (크기가 그대로인데 자리만 바뀌면 흔들린 것)
    const moved = (a, b) => { const [pa, sa] = a.split(' '), [pb, sb] = b.split(' '); return sa === sb && pa !== pb; };   // 알림이 사라지며 크기가 바뀌어 가운데 자리가 옮겨지는 것은 흔들림이 아니다
    const rect0 = ui.map(pos);
    const stage0 = document.getElementById('stage').style.transform;
    let uiMoved = 0;
    (function f() {
      const t = (performance.now() - t0) / 1000;
      out.push({ t, qo: st.qo ? [st.qo[0], st.qo[1]] : null, cam: st.cam ? [st.cam.lon, st.cam.lat] : [st.cx, st.cy], loc: [l.lon, l.lat, l.heading] });
      ui.forEach((e, i) => { if (moved(pos(e), rect0[i])) { uiMoved++; (window.__moved = window.__moved || {})[e.className] = pos(e) + ' ← ' + rect0[i]; } });
      if (document.getElementById('stage').style.transform !== stage0) uiMoved++;
      if (t < sec) requestAnimationFrame(f); else res({ out, uiMoved, nui: ui.length });
    })();
  }), [sceneExpr, sec]);
  // 효과가 끝난 뒤 장면을 두 번 더 그리게 기다렸다가 그 장면의 어긋남
  const qoAfter = (expr) => page.evaluate((expr) => new Promise(res => { let n = 0; (function f() { if (++n < 3) requestAnimationFrame(f); else res(eval(expr).qo === null && !G.Quake.active()); })(); }), expr);
  function stats(rec, from, to) {
    const r = rec.filter(x => x.t >= from && x.t < to);
    const ax = r.map(x => x.qo ? Math.abs(x.qo[0]) : 0), ay = r.map(x => x.qo ? Math.abs(x.qo[1]) : 0);
    const mean = a => a.reduce((p, c) => p + c, 0) / Math.max(1, a.length);
    let jump = 0; for (let i = 1; i < r.length; i++) { const a = r[i - 1].qo || [0, 0], b = r[i].qo || [0, 0]; jump = Math.max(jump, Math.hypot(b[0] - a[0], b[1] - a[1])); }
    // 이어짐: 이웃한 장면끼리의 상관 (흰 잡음이면 0 근처)
    const xs = r.map(x => x.qo ? x.qo[0] : 0); let c1 = 0, c0 = 0; const m = mean(xs);
    for (let i = 0; i < xs.length; i++) { c0 += (xs[i] - m) ** 2; if (i) c1 += (xs[i] - m) * (xs[i - 1] - m); }
    // 봉우리 폭이 고른가 (사인파 하나면 봉우리들이 거의 같다)
    const peaks = []; for (let i = 1; i < xs.length - 1; i++) if (Math.abs(xs[i]) >= Math.abs(xs[i - 1]) && Math.abs(xs[i]) >= Math.abs(xs[i + 1]) && Math.abs(xs[i]) > 0.3) peaks.push(Math.abs(xs[i]));
    const pm = mean(peaks), pv = Math.sqrt(mean(peaks.map(p => (p - pm) ** 2)));
    return { n: r.length, maxX: Math.max(0, ...ax), maxY: Math.max(0, ...ay), meanX: mean(ax), meanY: mean(ay), jump, ac1: c0 ? c1 / c0 : 0, peakCV: pm ? pv / pm : 0 };
  }
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Quake && G.Shake && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 28, birth: { m: 4, d: 12 }, st: { str: 60, int: 62, mar: 58, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state; await G.Game.ensureGeo(); s.date.y = 1560;
      s.loc = { mode: 'sea', lon: 128.75, lat: 38.1, heading: 0 };
      setTimeout(() => G.Game.go('land', { landing: { lon: 128.55, lat: 38.1, shipLon: 128.75, shipLat: 38.1 } }), 0);
    });
    await page.waitForTimeout(5000); await clear(); await page.waitForTimeout(2500);   // 카메라가 탐험대에 다 붙도록

    // ---------------- 모양 (시계를 바꿔 끼워 1/120초씩 짚는다 — 헤드리스는 장면이 느려서)
    const shape = await page.evaluate(() => {
      const Q = G.Quake, out = {};
      function run(kind, o, end) {
        let T = 1000; Q._clock(() => T); Q.clear(); Q.start(kind, o);
        const rec = [];
        for (let i = 0; i <= end * 120; i++) { T = 1000 + i / 120; const c = Q.camera(); rec.push({ t: i / 120, qo: c }); }
        Q._clock(null); Q.clear();
        return rec;
      }
      out.quake = run('quake', { sev: 3, close: 1, seed: 12345 }, 6.6);
      out.tsu = run('tsunami', { sev: 3, close: 1, dir: 0.3, seed: 777 }, 7.2);
      // 해전: 맞을 때의 흔들림 (battle.js shake와 같은 쓰임 — 이어지는 떨림 st.shake·지수 감쇠 + 충격)
      const sh = G.Shake.make(99, { freq: 13, yk: 0.55 }); let base = 8 * 0.45; sh.kick(8, { t0: 0, yk: 0.7 });
      out.hit = []; for (let i = 0; i <= 2.5 * 120; i++) { const t = i / 120; const o = sh.sample(t, base); out.hit.push({ t, qo: (o[0] || o[1]) ? o : null }); base *= Math.exp(-9 / 120); if (base < 0.15) base = 0; }
      return out;
    });
    {
      const pre = stats(shape.quake, 0.02, 0.98), main = stats(shape.quake, 1.3, 4.4), end = shape.quake.filter(x => x.t >= 5.8);
      console.log('    지진 전조', JSON.stringify(pre)); console.log('    지진 본진', JSON.stringify(main));
      ok(pre.maxX > 0 && pre.maxX <= 1.2 && pre.maxY <= 1.0, '지진 전조: 아주 약한 떨림 (최대 ' + pre.maxX.toFixed(2) + 'px)');
      ok(main.maxX >= 6 && main.meanX > main.meanY * 1.4 && main.maxY > 0.8, '지진 본진: 좌우 위주 (평균 ' + main.meanX.toFixed(1) + ' / 상하 ' + main.meanY.toFixed(1) + ' px, 최대 ' + main.maxX.toFixed(1) + ')');
      ok(main.ac1 > 0.6, '이어지는 진동 (1/120초 이웃 상관 ' + main.ac1.toFixed(2) + ' — 장면마다 새 난수가 아니다)');
      ok(main.peakCV > 0.25, '폭이 고르지 않다 (봉우리 변동 ' + main.peakCV.toFixed(2) + ' — 같은 폭 사인파가 아니다)');
      ok(end.length && end.every(x => x.qo === null), '지진이 끝나면 어긋남 정확히 0 (null)');
      const ts = stats(shape.tsu, 1.2, 5.0), te = shape.tsu.filter(x => x.t >= 6.4);
      console.log('    해일', JSON.stringify(ts));
      ok(ts.maxX > 2 && ts.meanX > ts.meanY && ts.ac1 > 0.9, '해일: 느리고 좌우 위주 (' + ts.meanX.toFixed(1) + ' / ' + ts.meanY.toFixed(1) + ', 상관 ' + ts.ac1.toFixed(2) + ')');
      ok(te.length && te.every(x => x.qo === null), '해일이 끝나면 어긋남 0');
      const hs = stats(shape.hit, 0, 0.6), he = shape.hit.filter(x => x.t >= 1.6);
      console.log('    포격', JSON.stringify(hs));
      ok(hs.maxX > 3 && hs.meanX > hs.meanY && hs.ac1 > 0.3, '포격: 좌우 위주의 짧고 거친 진동 (' + hs.meanX.toFixed(1) + ' / ' + hs.meanY.toFixed(1) + ', 최대 ' + hs.maxX.toFixed(1) + ')');
      ok(he.every(x => x.qo === null), '포격 흔들림도 잦아들면 정확히 0');
    }

    // ---------------- 탐험: 지진
    ok(await page.evaluate(() => G.Game.sceneName) === 'land', '탐험 화면');
    // 헤드리스는 장면이 느려(초당 몇 장) 시계를 멈춰 두고 전조·본진의 한 순간을 찍고 클릭한다
    await page.evaluate(() => { window.__qT = 5000; G.Quake._clock(() => window.__qT); G.Quake.start('quake', { sev: 3, close: 1, seed: 12345 }); window.__qT = 5000.7; });
    await page.waitForTimeout(1200); await page.screenshot({ path: path.join(OUT, 'quake_pre.png') });
    await page.evaluate(() => { window.__qT = 5002.62; });
    await page.waitForTimeout(1200); await page.screenshot({ path: path.join(OUT, 'quake_main.png') });
    // 본진 한가운데에서 클릭: 클릭한 화면 자리 = 그 장면에 보인 세상 자리
    const click = await page.evaluate(() => {
      const st = G.Scenes.land.runtime(), l = G.Game.state.loc, z = st.cam.zoom, qo = st.qo ? st.qo.slice() : [0, 0];
      const lx = l.lon - 0.3, ly = l.lat - 0.05;                                   // 탐험대 옆 땅
      const sx = 800 + G.Geo.wrapLon(lx - st.cam.lon) * z + qo[0], sy = 450 - (ly - st.cam.lat) * z + qo[1];
      const cv = G.Game.canvases().overlay.getBoundingClientRect(), cx = cv.left + sx / 1600 * cv.width, cy = cv.top + sy / 900 * cv.height;
      const el = document.elementFromPoint(cx, cy); st.paused = true;
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: cx, clientY: cy }));
      const p = st.path; const res = { land: G.Geo.isLand(lx, ly), path: p, want: [lx, ly], qo, el: el.className, errPx: p ? Math.hypot(G.Geo.wrapLon(p[0] - lx), p[1] - ly) * z : null, noFixPx: Math.hypot(qo[0], qo[1]) };
      st.path = null; st.paused = true; return res;
    });
    console.log('    클릭', JSON.stringify(click));
    // 시계를 되돌리고 처음부터 실제 시간으로 한 번 더 — 장면·카메라·상태창 기록
    await page.evaluate(() => { G.Quake._clock(null); G.Quake.clear(); G.Quake.start('quake', { sev: 3, close: 1, seed: 4242 }); });
    const rec = await record('G.Scenes.land.runtime()', 6.6);
    const live = rec.out.filter(x => x.qo), end = rec.out.filter(x => x.t > 6.0);
    console.log('    장면 수', rec.out.length, '흔들린 장면', live.length);
    ok(live.length > 0 && live.some(x => Math.abs(x.qo[0]) > 0.5), '탐험 화면을 그릴 때 흔들림이 들어간다');
    ok(await qoAfter('G.Scenes.land.runtime()'), '끝난 뒤 장면은 어긋남 0 (null)');
    const c0 = rec.out[0];
    ok(rec.out.every(x => x.cam[0] === c0.cam[0] && x.cam[1] === c0.cam[1]), '카메라(st.cam)에는 흔들림이 더해지지 않는다');
    ok(rec.out.every(x => x.loc[0] === c0.loc[0] && x.loc[1] === c0.loc[1]), '탐험대의 실제 좌표는 그대로');
    ok(rec.uiMoved === 0 && rec.nui > 0, '상태창·단추(' + rec.nui + '개)와 #stage는 움직이지 않는다');
    ok(click.land && click.path && click.errPx < 1 && click.noFixPx > 2, '흔들리는 중 클릭한 자리 = 보인 자리 (차 ' + click.errPx.toFixed(2) + 'px — 마우스 좌표 반올림만큼 · 그 순간 흔들림 ' + click.noFixPx.toFixed(1) + 'px)');

    // ---------------- 항해: 해일
    await page.evaluate(() => { G.Quake.clear(); setTimeout(() => G.Game.go('sea', { depart: 226 }), 0); });
    await page.waitForTimeout(4000); await clear();
    await page.evaluate(() => { const st = G.Scenes.sea.runtime(); st.paused = true; st.speed = 1; });
    await page.waitForTimeout(1500);
    // 시계를 멈춰 두고 0.05초씩 짚으며 기함 자리(화면 가운데)의 들림·밀림을 잰다
    const tsu = await page.evaluate(() => {
      window.__qT = 7000; G.Quake._clock(() => window.__qT);
      G.Quake.start('tsunami', { sev: 3, close: 1, dir: 0.3, seed: 777 });
      const l = G.Game.state.loc, rec = [];
      for (let t = 0; t <= 7.2; t += 0.05) { window.__qT = 7000 + t; const qo = G.Quake.camera() || [0, 0]; const fx = G.Quake.shipFx(800 + qo[0], 450 + qo[1], l.heading); rec.push({ t, heave: fx.heave, dx: fx.dx, dy: fx.dy, pitch: fx.pitch }); }
      const best = rec.reduce((a, b) => b.heave > a.heave ? b : a);
      return { rec, best };
    });
    const liftMax = tsu.best.heave * 100, pushMax = Math.max(...tsu.rec.map(r => Math.abs(r.dx))), pitchMax = Math.max(...tsu.rec.map(r => Math.abs(r.pitch)));
    const tailFx = tsu.rec.filter(r => r.t > 6.3);
    await page.evaluate((t) => { G.Quake.clear(); G.Quake.start('tsunami', { sev: 3, close: 1, dir: 0.3, seed: 777 }); window.__qT = 7000 + t; }, tsu.best.t - 0.15);
    // 위 start는 __qT가 이미 7007.2라 시작 시각이 그때다 → 다시 맞춘다
    await page.evaluate((t) => { G.Quake.clear(); window.__qT = 9000; G.Quake.start('tsunami', { sev: 3, close: 1, dir: 0.3, seed: 777 }); window.__qT = 9000 + t; }, tsu.best.t - 0.15);
    await page.waitForTimeout(1500); await page.screenshot({ path: path.join(OUT, 'tsunami_main.png') });
    await page.evaluate((t) => { window.__qT = 9000 + t; }, 1.4);
    await page.waitForTimeout(1500); await page.screenshot({ path: path.join(OUT, 'tsunami_front.png') });
    const sea0 = await page.evaluate(() => { G.Quake._clock(null); G.Quake.clear(); const l = G.Game.state.loc; G.Quake.start('tsunami', { sev: 3, close: 1, dir: 0.3, seed: 778 }); return [l.lon, l.lat, l.heading]; });
    const recSP = record('G.Scenes.sea.runtime()', 7.6);
    await page.waitForTimeout(2500);
    ok(tailFx.length && Math.abs(tailFx[tailFx.length - 1].dx) < 0.5, '해일이 지나가면 밀림이 제자리로 (끝 ' + tailFx[tailFx.length - 1].dx.toFixed(2) + 'px)');
    console.log('    해일 최대 들림(크기 %) ' + liftMax.toFixed(1) + ' · 밀림 ' + pushMax.toFixed(1) + 'px · 뱃머리 기울기 ' + pitchMax.toFixed(3));
    const clickS = await page.evaluate(() => {
      const st = G.Scenes.sea.runtime(), qo = st.qo ? st.qo.slice() : [0, 0], z = st.cam.zoom;
      // toWorld(그 자리) → 다시 그 장면의 변환으로 화면에 → 같은 자리여야 한다
      const sx = 1100, sy = 300, wx = st.cam.lon + (sx - qo[0] - 800) / z, wy = st.cam.lat - (sy - qo[1] - 450) / z;
      const back = G.Scenes.sea.toScreen(wx, wy);
      return { d: Math.hypot(back[0] - sx, back[1] - sy), qo };
    });
    const recS = await recSP;
    const sEnd = recS.out.filter(x => x.t > 6.6);
    ok(liftMax > 8 && pushMax > 10 && pitchMax > 0.02, '해일: 배가 들리고(크기 +' + liftMax.toFixed(1) + '%) 밀리며(' + pushMax.toFixed(1) + 'px) 뱃머리가 들렸다 숙는다 — 그림만');
    console.log('    배 자리', JSON.stringify(sea0), '→', JSON.stringify(recS.out[recS.out.length - 1].loc));
    ok(recS.out.every(x => x.loc[0] === sea0[0] && x.loc[1] === sea0[1]), '배의 실제 좌표는 그대로 (해일 그림이 l.lon·l.lat를 바꾸지 않는다)');
    // 뱃머리: 정박한 배도 원래 조금씩 돈다(해안을 따라 서는 기존 동작) — 해일이 없을 때와 같은 만큼인지 견준다
    const hd = await page.evaluate(() => new Promise(res => { const l = G.Game.state.loc, h0 = l.heading, t0 = performance.now(); (function f() { if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(l.heading - h0); })(); }));
    const hq = recS.out[recS.out.length - 1].loc[2] - sea0[2];
    console.log('    뱃머리 변화: 해일 중 ' + hq.toFixed(4) + ' / 해일 없이 2초 ' + hd.toFixed(4));
    ok(Math.abs(hq) <= Math.abs(hd) * 5 + 0.08, '해일 그림은 뱃머리를 돌리지 않는다 (기존 움직임만)');
    ok(await qoAfter('G.Scenes.sea.runtime()'), '해일이 끝난 뒤 장면은 어긋남 0');
    ok(clickS.d < 1e-6, '항해 화면 클릭 변환 = 보인 자리 (차 ' + clickS.d.toExponential(1) + ')');
    const after = await page.evaluate(() => { const st = G.Scenes.sea.runtime(); const fx = G.Quake.shipFx(800, 450, 0); return { qo: st.qo, fx }; });
    ok(after.qo === null && after.fx.dx === 0 && after.fx.dy === 0 && after.fx.heave === 0, '배의 들림·밀림도 0으로 돌아옴');
    ok(recS.uiMoved === 0, '항해 상태창·단추·미니맵은 움직이지 않는다');

    // ---------------- 해전: 포격
    await page.evaluate(() => { setTimeout(() => G.Game.go('battle', { npc: { kind: 'pirate', n: 2, zone: 'med' } }), 0); });
    await page.waitForTimeout(3500); await clear();
    const b0 = await page.evaluate(() => {
      const st = G.Scenes.battle.runtime(); st.paused = true;
      const me = st.ships.find(b => b.side === 'me'), T = G.Scenes.battle._t();
      T.shake(8); T.tremor(me, 5);
      return { x: me.x, y: me.y, h: me.heading };
    });
    const recBP = record('G.Scenes.battle.runtime()', 2.4);
    await page.waitForTimeout(120); await page.screenshot({ path: path.join(OUT, 'battle_hit.png') });
    const clickB = await page.evaluate(() => {
      const st = G.Scenes.battle.runtime(), T = G.Scenes.battle._t(), qo = st.qo ? st.qo.slice() : [0, 0], zk = st.zkShown || 1;
      const sx = 1000, sy = 380, w = T.toWorld(sx, sy);
      // 보인 장면의 변환: 카메라를 qo만큼 옮겨 그리고, 가운데를 기준으로 zk배
      const ux = 800 + (w[0] - st.cx) * (T.toScreen(1, 0)[0] - T.toScreen(0, 0)[0]) + qo[0], uy = 450 + (w[1] - st.cy) * (T.toScreen(0, 1)[1] - T.toScreen(0, 0)[1]) + qo[1];
      return { d: Math.hypot(800 + (ux - 800) * zk - sx, 450 + (uy - 450) * zk - sy), qo };
    });
    const recB = await recBP;
    const bEnd = recB.out.filter(x => x.t > 2.0);
    const b1 = await page.evaluate(() => { const st = G.Scenes.battle.runtime(), me = st.ships.find(b => b.side === 'me'); return { x: me.x, y: me.y, h: me.heading, trem: me.trem.idle(), qo: st.qo }; });
    ok(recB.out.some(x => x.qo), '해전 화면을 그릴 때 흔들림이 들어간다');
    ok(await qoAfter('G.Scenes.battle.runtime()'), '잦아들면 어긋남 0');
    ok(b1.x === b0.x && b1.y === b0.y && b1.h === b0.h && b1.trem, '맞은 배의 떨림은 그림만 (좌표·뱃머리 그대로, 떨림도 끝남)');
    ok(clickB.d < 1e-6, '해전 클릭 변환 = 보인 자리 (차 ' + clickB.d.toExponential(1) + ')');
    if (recB.uiMoved) console.log('    움직인 요소', await page.evaluate(() => JSON.stringify(window.__moved)));
    ok(recB.uiMoved === 0, '해전 단추·상태창은 움직이지 않는다');

    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗ ' + e.message); console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  await browser.close();
})();
