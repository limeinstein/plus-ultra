/* 항해·육상 탐험의 도시 근접 출입 물음과 거절 뒤 실제 시간 5초 쉬기.
   node tests/city_entry_prompt_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FILE_NOT_FOUND|Failed to load/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; window.createImageBitmap = undefined; });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea && G.Scenes.land, null, { timeout: 90000 });
    await page.evaluate(async () => { await G.Game.ensureGeo(); if (G.Nav && G.Nav.init) G.Nav.init(); });

    const result = await page.evaluate(async () => {
      const sleep = () => new Promise(r => setTimeout(r, 0));
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.State.newGame({ name: '근접 시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 0), diff: 'normal' });
      const s = G.Game.state, target = G.CITY_DATA[1], dock = target.dock || [target.lat, target.lon];
      if (s.known.indexOf(target.id) < 0) s.known.push(target.id);
      let now = 100000, phase = 'sea', answer = 0;
      const realNow = Date.now, realAsk = G.UI.ask, realEntry = G.Scenes.city.handleEntry, realFade = G.UI.fade;
      const prompts = { sea: [], land: [] }, attempts = { sea: [], land: [] };
      Date.now = () => now;
      G.UI.ask = async (text, opts) => { prompts[phase].push({ text, labels: opts.map(x => x.label) }); return answer; };
      G.Scenes.city.handleEntry = async c => { attempts[phase].push(c.id); return false; };
      G.UI.fade = async fn => { fn(); };
      try {
        G.Game.go('sea', { depart: 0 });
        const SEA = G.Scenes.sea, ss = SEA.runtime(); ss.paused = true;
        SEA.update(0); await sleep();                         // 출항한 리스본은 다시 묻지 않는다
        const seaDepart = prompts.sea.length;
        s.loc.lon = dock[1]; s.loc.lat = dock[0];
        SEA.update(0); await sleep();                         // 첫 근접 물음: 거절
        const seaFirst = prompts.sea.length;
        now += 4999; SEA.update(0); await sleep();            // 5초 전: 묻지 않는다
        const seaBefore5 = prompts.sea.length;
        now += 1; SEA.update(0); await sleep();               // 5초 뒤: 다시 묻는다
        const seaAt5 = prompts.sea.length;
        now += 5000; answer = 1; SEA.update(0); await sleep(); await sleep(); // 입항한다 → 실제 입항 처리로 넘긴다
        const seaAttempt = attempts.sea.slice();

        phase = 'land'; answer = 0; prompts.land.length = 0;
        G.Game.go('land', { from: 0 });
        const LAND = G.Scenes.land, ls = LAND.runtime();
        LAND.update(0); await sleep();                        // 출발한 리스본 성문은 다시 묻지 않는다
        const landDepart = prompts.land.length;
        s.loc.lon = target.lon; s.loc.lat = target.lat;
        LAND.update(0); await sleep();                        // 첫 근접 물음: 거절
        const landFirst = prompts.land.length;
        now += 4999; LAND.update(0); await sleep();
        const landBefore5 = prompts.land.length;
        now += 1; LAND.update(0); await sleep();
        const landAt5 = prompts.land.length;
        now += 5000; answer = 1; LAND.update(0); await sleep(); await sleep();
        const landAttempt = attempts.land.slice();
        return { seaDepart, seaFirst, seaBefore5, seaAt5, seaAttempt, seaPrompt: prompts.sea[0], landDepart, landFirst, landBefore5, landAt5, landAttempt, landPrompt: prompts.land[0], cooldown: G.BALANCE.cityEntryPrompt.cooldownMs };
      } finally {
        Date.now = realNow; G.UI.ask = realAsk; G.Scenes.city.handleEntry = realEntry; G.UI.fade = realFade;
      }
    });

    ok(result.cooldown === 5000, '거절 쿨다운은 실제 시간 5초');
    ok(result.seaDepart === 0 && result.seaFirst === 1, '항해: 출항한 항구는 건너뛰고 다른 항구에 가까워지면 한 번 묻는다');
    ok(result.seaBefore5 === 1 && result.seaAt5 === 2, '항해: 거절 뒤 4.999초에는 침묵, 5초 뒤 다시 묻는다');
    ok(/입항하시겠습니까/.test(result.seaPrompt.text) && result.seaPrompt.labels.join('|') === '입항한다|지나간다', '항해 물음에서 입항하거나 지나갈 수 있다');
    ok(result.seaAttempt[result.seaAttempt.length - 1] === 1, '항해에서 「입항한다」를 고르면 입항 처리로 이어진다');
    ok(result.landDepart === 0 && result.landFirst === 1, '탐험: 막 나온 성문은 건너뛰고 다른 도시에 가까워지면 한 번 묻는다');
    ok(result.landBefore5 === 1 && result.landAt5 === 2, '탐험: 거절 뒤 4.999초에는 침묵, 5초 뒤 다시 묻는다');
    ok(/들어가시겠습니까/.test(result.landPrompt.text) && result.landPrompt.labels.join('|') === '들어간다|지나간다', '탐험 물음에서 도시에 들어가거나 지나갈 수 있다');
    ok(result.landAttempt[result.landAttempt.length - 1] === 1, '탐험에서 「들어간다」를 고르면 출입 처리로 이어진다');
    await page.evaluate(() => {
      G.Game.go('land', { from: 0 });
      const c = G.CITY_DATA[1], l = G.Game.state.loc; l.lon = c.lon; l.lat = c.lat;
      G.Scenes.land.update(0);
    });
    await page.waitForSelector('.askrow button', { timeout: 3000 });
    const realPrompt = await page.evaluate(() => ({ text: document.querySelector('.modal-back').textContent, buttons: [...document.querySelectorAll('.modal-back .askrow button')].map(b => b.textContent.trim()) }));
    ok(/도시로 들어가시겠습니까/.test(realPrompt.text) && realPrompt.buttons.join('|') === '들어간다|지나간다', '실제 선택창에 도시 출입 물음과 두 선택지가 표시된다');
    await page.locator('.askrow button', { hasText: '지나간다' }).click();
    await page.waitForTimeout(100);
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
  } catch (e) {
    console.error('✗', e.stack || e.message); if (errors.length) console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
