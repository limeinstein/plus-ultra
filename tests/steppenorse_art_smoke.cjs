/* 초원·북유럽·시베리아 발견 장면과 야외·도시 외관을 실제 게임에서 확인한다. */
'use strict';
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => {
      window.resumeFrames = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = () => 0;
    });
    await page.goto((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const report = await page.evaluate(async () => {
      function check(value, message) { if (!value) throw Error(message); }
      G.Scenes.title.exit();
      await G.Loader.hide();
      G.UI.clearScreen();
      G.State.newGame({ name: '발견물 검사', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const state = G.Game.state;
      state.date.y = 1650;
      state.settings.res = .35;
      window.requestAnimationFrame = window.resumeFrames;
      const discoveries = G.STEPPE_NORSE.map(id => G.DISC[id]);
      const field = discoveries.filter(d => d.how === 'land' && (d.cat === 'ruin' || d.cat === 'nature'));
      const cities = discoveries.filter(d => d.how === 'city');
      const canvas = document.createElement('canvas');
      canvas.width = 576; canvas.height = 256;
      document.body.append(canvas);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      for (const d of discoveries) {
        const gif = 'discoveries/' + d.id;
        check(G.Scenes.hasReveal(d) && G.Img.isAnim(gif), '발견 GIF 연결 ' + d.id);
        const art = new Image();
        art.src = G.Img.src(gif);
        await art.decode();
        check(art.naturalWidth === 576 && art.naturalHeight === 256, 'GIF 크기 ' + d.id);
        const sheet = await G.Reel.load(G.Reel.key(d));
        check(sheet && sheet.n === 24, '재생 시트 ' + d.id);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await G.Reel.play(canvas, sheet, { ms: 240 }).done;
        check(ctx.getImageData(288, 128, 1, 1).data[3] === 255, '재생 완료 ' + d.id);
      }
      const initiallyVisible = new Set(G.DiscoveryIcon.visible().map(d => d.id));
      for (const d of field) {
        check(!initiallyVisible.has(d.id), '발견 전 지도 표시 ' + d.id);
        state.disc[d.id] = { me: true, found: 1 };
      }
      await G.DiscoveryIcon.preload(field);
      // 지도는 0.25초 동안 표시 목록을 다시 쓴다.
      await new Promise(resolve => setTimeout(resolve, 260));
      const visible = new Set(G.DiscoveryIcon.visible().map(d => d.id));
      for (const d of field) {
        check(visible.has(d.id) && G.DiscoveryIcon.isMapLandmark(d), '발견 후 지도 표시 ' + d.id);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        G.DiscoveryIcon.draw(ctx, d, 50, 50, { scale: 1 });
        const data = ctx.getImageData(25, 25, 50, 50).data;
        check(data.some((v, i) => i % 4 === 3 && v > 60), '지도 그리기 ' + d.id);
      }
      canvas.remove();
      for (const d of cities) {
        check(!G.DiscoveryIcon.isMapLandmark(d), '도시 유적 위치 ' + d.id);
        const city = G.CITY_DATA[d.city];
        check(G.Town.available(city), '도시 거리 ' + city.name);
        await G.Town.open(city, G.Scenes.city.buildings(city));
        try {
          const mark = G.Town.runtime().marks.find(m => m.id === d.id);
          check(mark && mark.cv.width > 100 && mark.cv.height > 100, '거리 외관 배치 ' + d.id);
          await G.Town.focusMark(d.id);
          const street = G.Town.runtime();
          street.cam = street.camTo;
          G.Town.update(0);
          const x = mark.x + mark.cv.width / 2 - street.cam;
          check(x >= 0 && x <= G.Game.sceneCtx().canvas.width, '거리 유적 위치 ' + d.id);
        } finally { G.Town.close(); }
      }
      return { scenes: discoveries.length, field: field.length, city: cities.map(d => d.id) };
    });
    assert.deepEqual(report, { scenes: 42, field: 18, city: ['karez', 'idkah'] });
    assert.deepEqual(errors, []);
    console.log('통과 — 발견 GIF와 게임 재생 42개, 지도 외관 18개, 도시 거리 외관 2개, 콘솔 오류 0개');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
