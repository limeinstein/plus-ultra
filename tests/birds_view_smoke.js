/* 하늘 관찰 구도: 알림과 분리, 상승·거리감, 화면 가장자리와 대화·장면 전환 복귀. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const root = path.resolve(__dirname, '..'), out = path.join(root, 'artifacts/nature-view-20261101');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => {
      const raf = requestAnimationFrame.bind(window); window.__frames = true;
      window.requestAnimationFrame = cb => raf(t => { if (window.__frames) cb(t); });
    });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Birds && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending && !G.Loader.shown(), null, { timeout: 120000 });
    const report = await page.evaluate(async () => {
      const checks = [], ok = (v, m) => { if (!v) throw Error(m); checks.push(m); };
      window.__frames = false;
      G.State.newGame({ name: '하늘 관찰자', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 },
        st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      await G.Game.ensureGeo(); G.Game.state.settings.res = .35;
      G.UI.say = async () => {}; G.Game.state.flags.prologue = true;
      await Promise.all(['birds/flamingo', 'butterflies/morpho', 'birds/kiwi'].map(id => G.Img.load('effects/' + id)));
      G.Game.go('land', { from: 0 }); G.Scenes.land.runtime().paused = true;
      for (let i = 0; i < 4; i++) G.Scenes.land.update(1 / 30);
      const ui = document.getElementById('ui'), box = ui.querySelector('.toasts');
      const fresh = id => {
        G.Game.state = G.State.deserialize(G.State.serialize());
        const s = G.Game.state;
        return G.Birds.show(G.DISC[id], { found: G.U.dateNum(s.date), birdPlace: { ...s.loc } });
      };
      const ctx = document.createElement('canvas').getContext('2d'); let draws = [];
      ctx.drawImage = (...a) => { const m = ctx.getTransform(); draws.push({ x: m.e, y: m.f, w: a[7], h: a[8], alpha: ctx.globalAlpha }); };
      const sample = (f, t, p = [800, 450]) => { f.t = t; draws = []; G.Birds.draw(ctx, () => p, 'land'); return draws.slice(); };
      let f = fresh('flamingo'); f.members.forEach(b => { b.delay = 0; });
      const duration = G.FX.birds.flightDuration;
      const low = sample(f, duration * .15), middle = sample(f, duration * .5), high = sample(f, duration * .85);
      ok(low.length === 32 && middle.length === 32 && high.length === 32, '홍학 32마리를 비행 초반·중반·후반에 유지');
      ok(high.every((p, i) => p.y < middle[i].y && middle[i].y < low[i].y), '날아오른 새가 다시 내려오지 않고 하늘로 상승');
      ok(high.every((p, i) => p.w < middle[i].w && middle[i].w < low[i].w), '멀어지는 날개가 부드럽게 작아짐');
      const stable = sample(f, duration * .5, [-5000, 6000]);
      ok(stable.every((p, i) => p.x === middle[i].x && p.y === middle[i].y), '지도·카메라 이동에도 비행 구도 유지');
      let tested = 0;
      for (const id of ['flamingo', 'morpho']) {
        for (const origin of [[-2000, -2000], [3600, 2900], [800, 450]]) {
          f = fresh(id);
          for (let t = .5; t < f.limit; t += .5) {
            const poses = sample(f, t, origin);
            ok(poses.every(p => p.x - p.w / 2 > 0 && p.x + p.w / 2 < 1600 && p.y - p.h / 2 > 54 && p.y + p.h / 2 < 650), id + ': 화면·윗줄·아래 알림 밖의 비행 ' + (++tested));
          }
        }
      }
      f = fresh('flamingo'); f.t = duration * .5;
      const backdrop = document.createElement('canvas'); backdrop.width = 1600; backdrop.height = 900;
      const backdropCtx = backdrop.getContext('2d');
      G.Birds.draw(backdropCtx, () => [800, 450], 'land');
      ok([[32, 160], [1568, 160], [32, 500], [1568, 500]].every(([x, y]) => backdropCtx.getImageData(x, y, 1, 1).data[3] === 0),
        '새 주변은 투명하게 유지해 큰 구름·하늘 배경이 게임 화면을 덮지 않음');
      G.Game.state.settings.noticePos = 'top'; G.UI.noticeSettings();
      box.innerHTML = '';
      G.UI.toast('새들이 바람을 타고 먼 하늘로 날아오른다. 탐험 명성 +75', 'compass', 5500, { tier: 'line' });
      G.UI.toast('보급이 부족하다!', 'warn', 5500);
      G.Birds.update(0);
      ok(ui.classList.contains('watching-nature') && box.dataset.zone === 'bottom', '늘 위 설정·이미 뜬 알림도 관찰 중에는 아래로 이동');
      const stage = document.getElementById('stage').getBoundingClientRect(), k = stage.width / 1600;
      const rects = [...box.children].map(el => { const r = el.getBoundingClientRect(); return { top: (r.top - stage.top) / k, bottom: (r.bottom - stage.top) / k }; });
      ok(rects.length === 2 && rects.every(r => r.top > 650), '관찰 소식·큰 위험 알림 모두 실제 비행 영역과 겹치지 않음: ' + JSON.stringify(rects));
      ok(!!box.querySelector('.t-big'), '위험 알림은 읽을 수 있게 유지');
      G.UI.toast('폭풍으로 돛이 상했다. '.repeat(12), 'warn', 6000);
      G.UI.toast('해적선이 다가오고 있다. '.repeat(12), 'skull', 6000);
      G.Game.setUiSize('max');
      const stacked = box.getBoundingClientRect();
      ok((stacked.top - stage.top) / k >= 649 && box.scrollHeight > box.clientHeight && box.scrollTop > 0,
        '최대 글씨·긴 위험 알림 세 장도 하늘 밖에서 새 소식부터 읽고 스크롤 가능');
      G.Game.setUiSize('auto');
      const time = f.t; ui.classList.add('talking'); G.Birds.update(.1);
      ok(f.t === time && !ui.classList.contains('watching-nature'), '대화 중 비행 시계를 멈추고 관찰 구도 해제');
      ui.classList.remove('talking'); G.Birds.update(0);
      ok(ui.classList.contains('watching-nature') && f.t === time, '대화 뒤 같은 비행 시점부터 복귀');
      f.t = 8.01; G.Birds.update(0);
      ok(!ui.classList.contains('watching-nature') && box.dataset.zone === 'top', '출발 지연까지 8초 안에 연출 종료·원래 알림 설정 복원');
      f = fresh('kiwi'); f.t = 2; G.Birds.update(0);
      ok(!ui.classList.contains('watching-nature'), '달리는 새에는 하늘 구도를 적용하지 않음');
      f = fresh('morpho'); f.t = 3; G.Birds.update(0);
      const savedMode = G.Game.sceneName; G.Game.sceneName = 'title'; G.Birds.update(0);
      ok(!ui.classList.contains('watching-nature') && document.getElementById('bird-flocks').style.display === 'none', '타이틀로 나가면 관찰 구도·캔버스 정리');
      G.Game.sceneName = savedMode;
      window.__natureFresh = fresh;
      return { checks, rects, sampledFrames: tested };
    });
    for (const mode of ['land', 'sea', 'city']) {
      await page.evaluate(mode => {
        G.Game.go(mode, mode === 'land' ? { from: 0 } : mode === 'sea' ? { depart: 0 } : { cityId: 0 });
        if (mode !== 'city') G.Scenes[mode].runtime().paused = true;
      }, mode);
      // 장면 진입 때의 비동기 거리 준비·알림을 기다린다.
      await page.waitForTimeout(800);
      await page.evaluate(() => { for (let i = 0; i < 4; i++) { if (G.Game.scene.update) G.Game.scene.update(1 / 30); } });
      for (const id of ['flamingo', 'morpho']) {
        await page.evaluate(({ id, mode }) => {
          document.querySelector('#ui > .toasts').innerHTML = '';
          const f = window.__natureFresh(id); f.t = id === 'morpho' ? 4 : G.FX.birds.flightDuration * .5;
          const label = { land: '탐험길', sea: '바다', city: '거리' }[mode];
          G.UI.toast(label + ' — ' + G.DISC[id].name + ' 무리가 하늘로 날아오른다. 탐험 명성 +75', 'compass', 5500, { tier: 'line' });
          G.Birds.update(0);
        }, { id, mode });
        await page.waitForTimeout(1300);
        await page.evaluate(() => {
          const panels = [...document.querySelectorAll('#ui .cmdmenu, #ui .sea-zoom, #ui .city-banner, #ui .todo')];
          if (panels.some(el => Number(getComputedStyle(el).opacity) < .8)) throw Error('비행 중 메뉴·상태판 선명도 유지');
        });
        await page.screenshot({ path: path.join(out, mode + '-' + id + '.png') });
      }
    }
    await page.setViewportSize({ width: 540, height: 960 });
    await page.evaluate(() => {
      document.querySelector('#ui > .toasts').innerHTML = '';
      const f = window.__natureFresh('flamingo'); f.t = G.FX.birds.flightDuration * .5;
      G.UI.toast('홍학 무리가 바람을 타고 먼 하늘로 날아오른다.', 'compass', 5500, { tier: 'line' });
      G.Birds.update(0);
    });
    await page.screenshot({ path: path.join(out, 'portrait-flamingo.png') });
    assert.deepStrictEqual(errors, [], '브라우저 오류 0');
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ ...report, errors }, null, 2));
    console.log(`PASS: ${report.checks.length} checks, ${report.sampledFrames} edge/time samples, three scenes, no browser errors`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
