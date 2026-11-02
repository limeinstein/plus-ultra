/* 제보 126: 좁은 만의 출입항을 실제 항해 물리로 반복한다. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Scenes.sea, null, { polling: 100 });
    await page.evaluate(() => G.Game.ensureGeo());
    // 반복 항해는 그림만 생략한다. 조타·충돌·길목·진행 감시는 본체를 그대로 쓴다.
    const sea = fs.readFileSync(path.resolve(__dirname, '../js/scenes/sea.js'), 'utf8');
    await page.addScriptTag({ content: sea.replace('    render(dt);', '') });
    const result = await page.evaluate(async config => {
      let seed = 126;
      Math.random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
      G.UI.toast = () => {}; G.UI.say = async () => {}; G.UI.busy = () => false;
      G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0;
      const rows = [];
      const pairs = [['오슬로', '베르겐'], ['베르겐', '오슬로'], ['함부르크', '오슬로'], ['오슬로', '함부르크'], ['스톡홀름', '리가'], ['리가', '스톡홀름'], ['오호츠크', '페트로파블롭스크'], ['페트로파블롭스크', '오호츠크']];
      G.State.surveyChart = () => {};
      for (const boost of config.boosts) for (const [an, bn] of pairs) for (const speed of config.speeds) {
        seed = 126;
        const a = G.CITY_DATA.find(c => c && c.name === an), b = G.CITY_DATA.find(c => c && c.name === bn);
        const s = G.State.newGame({ name: '항구 검사', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        s.settings.res = .35; s.date = { y: 1800, m: 7, d: 1 };
        s.fleet.ships = [G.R.newShip('frigate')]; s.fleet.crew = 190;
        s.routes = {}; s.routes[G.Routes.key(a.id, b.id)] = { n: 1 }; s.known.push(b.id);
        let arrival = null;
        G.Scenes.city.handleEntry = async c => { arrival = c.id; return false; };
        G.Game.go('sea', { depart: a.id });
        const SEA = G.Scenes.sea, st = SEA.runtime();
        st.dayAcc = -1e6;
        const motion = G.R.fleetMotion;
        // 선실·동료로 빨라진 함대와 그 이상인 극단 조건도 같은 물리로 검사한다.
        G.R.fleetMotion = function () { const m = motion.apply(this, arguments); for (const key of ['vmg', 'straight', 'legP', 'legM']) m[key] *= boost; return m; };
        SEA.goCity(b.id); st.speed = speed;
        const length = G.Nav.length(st.path), trail = [];
        let days = 0, unchanged = 0, maxUnchanged = 0, lastPath = st.path, lastI = st.pathI;
        for (let i = 0; i < 12000 && days < 60 && arrival == null; i++) {
          st.npcs = []; st.frame = 0; SEA.update(.05); days += .05 * speed / 1.25;
          if (lastPath === st.path && lastI === st.pathI) unchanged += .05 * speed / 1.25;
          else { unchanged = 0; lastPath = st.path; lastI = st.pathI; }
          maxUnchanged = Math.max(maxUnchanged, unchanged);
          if (i % 20 === 0) { trail.push([+days.toFixed(2), +s.loc.lon.toFixed(3), +s.loc.lat.toFixed(3), st.pathI, st.prog && st.prog.n]); if (trail.length > 20) trail.shift(); }
          if (st.pendingPort) { SEA.update(0); }
          if (st.busy || (st.paused && !st.path)) { for (let w = 0; w < 12; w++) await new Promise(r => setTimeout(r, 0)); }
          if (st.paused && !st.pendingPort && !st.path) break;
        }
        rows.push({ an, bn, speed, boost, arrival: arrival === b.id, days: +days.toFixed(2), maxUnchanged: +maxUnchanged.toFixed(2), length: +length.toFixed(2), trail: arrival === b.id ? undefined : trail });
        G.R.fleetMotion = motion;
      }
      return rows;
    }, { speeds: [1, 4, 8], boosts: process.env.BOOST ? [+process.env.BOOST] : [1, 2, 8] });
    const output = path.resolve(__dirname, '../artifacts/feedback126-navigation');
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ result, errors }, null, 2));
    for (const row of result) {
      assert(row.arrival, `${row.an}→${row.bn} 입항`);
      if (row.boost === 8 && row.an === '오슬로' && row.bn === '베르겐') assert(row.days < 6, '고속 함대가 길목에서 여러 날 맴돌지 않는다');
    }
    assert.deepEqual(errors, [], '콘솔 오류 0');
    console.log(`통과: ${result.length}개 조건 입항 · 고속 오슬로→베르겐 ${result.filter(r => r.boost === 8 && r.an === '오슬로' && r.bn === '베르겐').map(r => `×${r.speed} ${r.days}일`).join(', ')} · 콘솔 오류 0`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
