/* 아시아→유럽·이집트 목록, 선택 전 보급 경고, 옛 기록·충분해 보이는 추정의 출항 재검사. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Game && G.Routes && G.Scenes.city.B.harbor);
    const list = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Nav.init();
      G.State.newGame({ name: '항로시험', nation: 'PT', job: 'explorer', age: 30,
        birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, RT = G.Routes, H = G.Scenes.city.B.harbor;
      s.routes = {}; RT.touch();
      for (const [a, b] of [[152, 101], [101, 0], [0, 78]]) {
        const days = RT.estDays(a, b);
        if (!days) throw new Error('시험 항로를 찾을 수 없음: ' + a + '→' + b);
        RT.record(a, b, days);
      }
      let pathCalls = 0;
      const original = G.Nav.seaPath;
      G.Nav.seaPath = function () { pathCalls++; return original.apply(this, arguments); };
      const t0 = performance.now(), dests = H.autoDests(G.CITY_DATA[152]);
      const listMs = performance.now() - t0;
      G.Nav.seaPath = original;
      const lisbon = dests.find(x => x.c.id === 0), egypt = dests.find(x => x.c.id === 78);
      const supply = Math.floor((lisbon.days + egypt.days) / 2);
      s.fleet.food = s.fleet.water = supply * G.R.dailyUse();
      window.__detourPick = H.pickAutoDest(G.CITY_DATA[152], dests, supply);
      document.getElementById('boot-loader').style.display = 'none';
      const rows = [...document.querySelectorAll('.autodest .choice')].map(x => x.textContent);
      const line = Math.ceil(Math.hypot(29.751 - 75.63, 31.333 - 11.206) * RT.DETOUR / G.Plan.avgSpeed());
      return { listMs, pathCalls, rows, supply, lisbon: lisbon.days, egypt: egypt.days, oldLine: line };
    });
    assert(list.lisbon < list.egypt, JSON.stringify(list));
    assert(list.oldLine < list.lisbon, '기존 직선 어림은 지중해 항구를 유럽보다 가깝게 보이게 했다');
    assert.strictEqual(list.pathCalls, 0, '목록 생성은 무거운 길찾기를 호출하지 않는다');
    assert(list.listMs < 150, '항구 목록 응답 시간: ' + list.listMs);
    assert(list.rows.find(x => x.includes('알렉산드리아')).includes('보급 모자람'));
    assert(!list.rows.find(x => x.includes('리스본')).includes('보급 모자람'));
    fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
    await page.screenshot({ path: path.join(ROOT, 'artifacts/autodest-detour-list.png') });
    await page.evaluate(async () => {
      [...document.querySelectorAll('#ui .win .x')].pop().click();
      await window.__detourPick;
    });

    const checks = await page.evaluate(async () => {
      const RT = G.Routes, H = G.Scenes.city.B.harbor, C = G.Scenes.city;
      const keep = { window: G.UI.window, estimate: RT.estDays, ask: C.mateAsk, mate: C.mate };
      const out = [];
      try {
        G.UI.window = () => ({ content: { querySelector: () => document.createElement('div') }, result: Promise.resolve(78) });
        C.mateAsk = async text => { out.push({ warning: text }); return false; };
        C.mate = async text => { out.push({ failed: text }); };
        // 어림의 세 배 이상 넉넉해 보여도, 실제 길과 지금 남은 보급을 다시 확인한다.
        for (const rough of [true, false]) {
          let calls = 0;
          RT.estDays = () => { calls++; return 50; };
          const use = G.R.dailyUse();
          G.Game.state.fleet.food = G.Game.state.fleet.water = 20 * use;
          const result = await H.pickAutoDest(G.CITY_DATA[152], [{ c: G.CITY_DATA[78], days: 1, rough }], 100);
          out.push({ calls, result, rough });
        }
        // 창을 연 뒤 보급이 늘어났다면 예전 표시값 때문에 출항을 막지 않는다.
        RT.estDays = () => 20;
        G.Game.state.fleet.food = G.Game.state.fleet.water = 100 * G.R.dailyUse();
        out.push({ supplied: await H.pickAutoDest(G.CITY_DATA[152], [{ c: G.CITY_DATA[78], days: 1, rough: true }], 1) });
        RT.estDays = () => null;
        out.push({ unavailable: await H.pickAutoDest(G.CITY_DATA[152], [{ c: G.CITY_DATA[78], days: 1, rough: true }], 100) });
      } finally { G.UI.window = keep.window; RT.estDays = keep.estimate; C.mateAsk = keep.ask; C.mate = keep.mate; }
      return out;
    });
    assert.strictEqual(checks.filter(x => x.calls === 1 && x.result === null).length, 2);
    assert.strictEqual(checks.filter(x => x.warning && x.warning.includes('50일쯤') && x.warning.includes('20일분')).length, 2);
    assert(checks.some(x => x.supplied === 78), '현재 보급이 충분하면 고른 항구로 출항한다');
    assert(checks.some(x => x.failed && x.failed.includes('뱃길을 확인하지 못했습니다')));
    assert.deepStrictEqual(errors, []);
    console.log('통과 — 실제 아프리카 우회·목록 사전 경고·현재 선속/보급 재확인·길 없음·콘솔 오류 0', { list, checks });
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
