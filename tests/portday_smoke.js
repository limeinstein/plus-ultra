/* 입항·성문으로 들어올 때는 난이도와 상관없이 0일 · 출항 준비는 난이도의 1·3·10일 (tests/portday_smoke.js — 2026-11-13) */
const path = require('path'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  try {
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea && G.Scenes.city, null, { timeout: 90000, polling: 200 });
  const R = await page.evaluate(async () => {
    const R = []; const sleep = ms => new Promise(r => setTimeout(r, ms));
    try {
    await G.Game.ensureGeo(); G.Nav.init();
    const UI = G.UI;
    UI.say = async () => {}; UI.ask = async (t, ch) => ch[0].value; UI.confirm = async () => true; UI.alert = async () => {}; UI.choose = async (t, o) => o[0].value; window.__R = null;
    for (const diff of ['easy', 'normal', 'original']) {
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 70 }, sk: {}, lg: [], diff });
      const s = G.Game.state; s.settings.diff = diff;
      G.Game.go('city', { cityId: s.player.home }); await sleep(600);
      const d0 = s.day;
      G.Game.go('sea', { depart: s.player.home }); await sleep(800);
      const d1 = s.day;
      // 가까운 다른 항구로 옮겨 놓고 입항
      const c = G.CITY_DATA.find ? null : null;
      const tgt = Object.values(G.CITY_DATA).find(x => x.port && x.name === '세비야') || Object.values(G.CITY_DATA).find(x => x.port && x.id !== s.player.home);
      if (s.known.indexOf(tgt.id) < 0) s.known.push(tgt.id);
      const dk = tgt.dock || [tgt.lat, tgt.lon]; s.loc.lat = dk[0]; s.loc.lon = dk[1];
      const d2 = s.day, dt2 = JSON.stringify(s.date);
      R.push('   entryCheck=' + JSON.stringify(G.Scenes.city.entryCheck(tgt)) + ' busy=' + UI.busy());
      UI.fade = async fn => { fn(); };
      const ok = await G.Scenes.sea.enterPort(tgt);
      await sleep(1500);
      const d3 = s.day;
      R.push(diff + ': 출항 전 ' + d0 + ' → 바다 ' + d1 + ' → 입항 직전 ' + d2 + ' → 입항 뒤 ' + d3 + ' (' + tgt.name + ', ok=' + ok + ', scene=' + G.Game.sceneName + ')');
      // 육상 탐험을 마치고 성문으로 (배가 기다리는 항구 · 다른 도시)
      const g0 = s.day; G.Game.go('city', { cityId: tgt.id, arrive: true, gate: true, via: 'sea' }); await sleep(1200);
      const g1 = s.day; s.loc.via = 'land'; G.Game.go('city', { cityId: s.player.home, arrive: true, gate: true, via: 'land' }); await sleep(1200);
      R.push('   성문으로 들어옴: 배가 있는 항구 ' + g0 + ' → ' + g1 + ' · 뭍길로 다른 도시 ' + g1 + ' → ' + s.day);
      // 출항 준비는 난이도 일수 그대로
      s.loc.via = 'sea'; const h0 = s.day; const H = G.Scenes.city.B.harbor; try { const pr = H.depart(G.CITY_DATA[s.loc.city]); await Promise.race([pr, sleep(2500)]); } catch (e) { R.push('   depart 예외 ' + e.message); }
      R.push('   출항 준비: ' + h0 + ' → ' + s.day + ' (R.portDays=' + G.R.portDays() + ')');
      // 건물 하나
      const d4 = s.day; try { const p = G.Scenes.city.visit('tavern'); await Promise.race([p, sleep(1500)]); } catch (e) {} R.push('   건물 들어감: ' + d4 + ' → ' + s.day);
    }
    } catch (e) { R.push('예외 ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
    return R;
  });
  console.log(R.join('\n')); console.log(errs.slice(0, 5).join('\n') || '오류 0');
  } finally { await b.close(); }
})();
