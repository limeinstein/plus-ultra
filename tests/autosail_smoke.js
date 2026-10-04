/* 자동항해 시험 (tests/autosail_smoke.js) — node tests/autosail_smoke.js
   리스본→제노바 자동항해 중: 해적에게 통행료를 내면 가던 길을 이어 가는지 / Space로 멈췄다가 Space로 다시 가는지 /
   해전을 마치고 돌아오면 자동항해를 이어 가는지 / 끝까지 가서 목적 항구로 들어가는지. 콘솔 오류 0.
   (느린 swiftshader에서 빨리 돌리려고 그림 칠하기를 끄고 requestAnimationFrame을 막은 채 G.Scenes.sea.update를 직접 돌린다) */
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
    const f = n => G.CITY_DATA.find(c => c && c.name === n).id; const A = f('리스본'), B = f('제노바');
    const s = G.Game.state; s.routes = {}; s.routes[G.Routes.key(A, B)] = { n: 1 }; if (s.known.indexOf(B) < 0) s.known.push(B); s.player.gold = 50000; s.player.fame = 3000;
    window.__arr = null; G.Scenes.city.handleEntry = async c => { window.__arr = c.id; return false; };
    const toasts = []; const t0 = G.UI.toast; G.UI.toast = function (m) { toasts.push(String(m)); return t0.apply(this, arguments); };
    G.Game.go('sea', { depart: A }); let SEA = G.Scenes.sea, st = SEA.runtime(); st.speed = 2;
    SEA.goCity(B); ok(st.autoOn && st.path, '리스본→제노바 자동항해 시작');
    const tick = async (n) => { for (let i = 0; i < n; i++) { st.npcs = st.keepNpc ? st.npcs : []; SEA.update(0.1); for (let w = 0; w < 20 && st.busy && !G.UI.busy(); w++) await new Promise(r => setTimeout(r, 0)); if (G.UI.busy()) return 'ui'; } return 'ok'; };
    const pick = async (txt) => { const mb = [...document.querySelectorAll('.modal-back')].pop(); if (!mb) return false; const bt = [...mb.querySelectorAll('button')].find(x => x.textContent.indexOf(txt) >= 0); if (bt) { bt.click(); await new Promise(r => setTimeout(r, 30)); return true; } (mb.querySelector('.dlg') || mb).click(); await new Promise(r => setTimeout(r, 30)); return false; };
    const clear = async () => { for (let k = 0; k < 10 && G.UI.busy(); k++) await pick(''); };
    await tick(20); await clear();
    // 1) 해적 → 통행료
    const pirate = () => ({ id: 'p' + Math.random(), kind: 'pirate', lon: s.loc.lon + 0.05, lat: s.loc.lat, heading: 0, n: 1, K: 0, spd: 1, life: 10, hostile: true, zone: G.Ships.zone(s.loc.lon, s.loc.lat), ships: G.Ships.enemyTypes('pirate', G.Ships.zone(s.loc.lon, s.loc.lat), null, 1, 0, s.date.y) });
    st.keepNpc = true; st.npcs = [pirate()];
    let r = 'ok'; for (let k = 0; k < 30 && r === 'ok'; k++) r = await tick(1);
    const txt = ([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || '';
    ok(/해적/.test(txt), '해적을 만남: ' + txt.slice(0, 40));
    await pick('통행료'); for (let k = 0; k < 5 && G.UI.busy(); k++) await pick('');
    st.keepNpc = false; st.npcs = [];
    await new Promise(r => setTimeout(r, 30));
    ok(!st.paused && st.path && st.autoOn, '통행료를 내면 자동항해를 이어 감 (paused=' + st.paused + ')');
    const p0 = [s.loc.lon, s.loc.lat]; await tick(10); ok(G.Geo.dist(p0[0], p0[1], s.loc.lon, s.loc.lat) > 0.05, '실제로 다시 나아감');
    // 2) Space 정지 → Space 다시
    const key = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: k === ' ' ? 'Space' : k, bubbles: true }));
    await clear(); key(' '); for (let k = 0; k < 40 && !st.paused; k++) { if (await tick(1) === 'ui') await clear(); } ok(st.paused && st.path, 'Space로 멈춤 (길은 남음)');
    await clear(); key(' '); ok(!st.paused && st.path && st.autoOn, 'Space를 한 번 더 누르면 자동항해를 이어 감');
    await tick(5); await clear();
    // 3) 해전 → 돌아오면 이어 감
    st.keepNpc = true; st.npcs = [pirate()]; r = 'ok'; for (let k = 0; k < 60; k++) { r = await tick(1); if (r === 'ui') { if (/해적/.test(([...document.querySelectorAll('.modal-back')].pop() || {}).textContent)) break; await clear(); st.npcs = [pirate()]; } }
    await pick('싸운다'); for (let k = 0; k < 60 && G.Game.scene === SEA; k++) await new Promise(r => setTimeout(r, 50));
    ok(G.Game.scene !== SEA, '싸운다 → 해전 화면');
    st.keepNpc = false;
    G.Game.go('sea', { resume: true }); st = SEA.runtime();
    ok(!st.paused && st.path && st.autoOn, '해전 뒤 바다로 돌아오면 자동항해를 이어 감 (' + toasts.slice(-1)[0] + ')');
    // 4) 끝까지
    for (let k = 0; k < 400 && window.__arr == null; k++) { const q = await tick(40); if (q === 'ui') await pick(''); }
    ok(window.__arr === B, '제노바에 들어감 (arr=' + window.__arr + ', 남은 ' + G.Geo.dist(s.loc.lon, s.loc.lat, 8.93, 44.4).toFixed(2) + ')');
    return R;
  });
  console.log(out.join('\n')); console.log(errs.slice(0, 5).join('\n') || '✓ 콘솔 오류 없음'); await b.close();
  process.exitCode = out.some(x => x[0] === '✗') || errs.length ? 1 : 0;
})();
