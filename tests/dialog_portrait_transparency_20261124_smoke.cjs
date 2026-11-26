/* 사건 대화의 얼굴상에 원본의 투명 배경이 유지되는지 실제 픽셀로 검사한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/dialog-portrait-transparency-20261124');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [], results = [], rigs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.addInitScript(() => { window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : setTimeout(() => cb(performance.now()), 16); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => {
      const s = G.Game.state = G.State.newGame({ name: '김소영', nation: 'KR', job: 'adventurer', age: 24,
        birth: { m: 5, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.settings.res = .35; s.settings.music = 0; s.settings.sound = 0; s.settings.autosave = false;
      s.loc = { mode: 'land', lon: 127, lat: 37 }; G.Game.sceneName = 'land';
      G.Game.showLayers(false, false, true); G.UI.clearScreen(); G.UI.hud.hide();
      if (G.Loader) G.Loader.hide();
      document.querySelector('#boot-loader')?.remove();
      document.querySelector('#ui').style.background = 'linear-gradient(135deg, #5a8c82, #c2a36a)';
      window.alphaStats = canvas => {
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let clear = 0, solid = 0;
        for (let i = 3; i < data.length; i += 4) { if (data[i] === 0) clear++; if (data[i] > 250) solid++; }
        return { clear: clear / (data.length / 4), solid: solid / (data.length / 4), corner: data[3] };
      };
    });
    for (const [id, name, key, ask] of [
      ['myeongwol', '명월', 'portraits/history/wm_myeongwol', false],
      ['hwanggyu', '황규', 'portraits/mates/sy_hwanggyu', false],
      ['soyoung', '김소영', 'portraits/player/soyoung', false],
      ['anne', '앤 보니', 'portraits/rivals/앤 보니', false],
      ['maid', '일본 여급', 'maid-styles/japan/1', false],
      ['choice', '명월', 'portraits/history/wm_myeongwol', true]
    ]) {
      const result = await page.evaluate(async ({ name, key, ask }) => {
        const image = await G.Img.load(key);
        if (!image || !image.naturalWidth) throw Error('원본 로딩 실패: ' + key);
        const who = { name, portrait: { img: [key], noRole: true, noFallback: true }, noStand: true };
        window.dialogPromise = ask
          ? G.UI.ask('이 물건의 산지를 살펴볼까요?', [{ label: '확인한다', value: true }], who)
          : G.UI.say('초상 뒤로 게임 배경이 투명하게 보입니다.', who);
        await new Promise(r => setTimeout(r, 500));
        const canvas = document.querySelector('.dlg .pframe canvas');
        if (!canvas) throw Error('대화 초상 없음: ' + key);
        return { name, key, ask, ...alphaStats(canvas) };
      }, { name, key, ask });
      await page.screenshot({ path: path.join(OUT, id + '.png') });
      results.push(result);
      if (ask) await page.locator('.askrow button').first().click();
      else await page.locator('.dlg').click();
      await page.evaluate(() => window.dialogPromise);
    }
    // 눈·입 중심 보정이 실제로 실행되는 투명 원화도 배경을 덧칠하지 않는다.
    results.push(await page.evaluate(async () => {
      const key = 'portraits/history/wm_myeongwol', spec = { img: [key], noRole: true, noFallback: true };
      const transparent = alphaStats(G.Art.portraitCanvas(spec, 248, { transparent: true }));
      const opaque = alphaStats(G.Art.portraitCanvas(spec, 248, { transparent: false }));
      const face = G.PORTRAIT_FACES[key];
      const layout = G.PORTRAIT_LAYOUT[key];
      let centered;
      try {
        delete G.PORTRAIT_LAYOUT[key];
        G.PORTRAIT_FACES[key] = { box: [.3, .2, .4, .5], eyes: [.6, .4, .8, .4], mouth: [.7, .55] };
        centered = alphaStats(G.Art.portraitCanvas(spec, 248, { transparent: true }));
      } finally { G.PORTRAIT_FACES[key] = face; G.PORTRAIT_LAYOUT[key] = layout; }
      const host = document.createElement('div'); document.querySelector('#ui').appendChild(host);
      const fallback = G.Img.pick; let picks = 0;
      G.Img.pick = function () { return picks++ === 0 ? null : fallback.apply(this, arguments); };
      let rig;
      try { rig = G.PortraitRig.mount(host, { portrait: spec, profile: 'bust' }); }
      finally { G.Img.pick = fallback; }
      await new Promise(r => setTimeout(r, 200));
      const rigAlpha = alphaStats(rig.root.querySelector('canvas'));
      rig.destroy(); host.remove();
      return { name: '가운데 정렬·기존 얼굴 칸·리그 대체', key, ...transparent, opaque, centered, rigAlpha };
    }));
    // 수동 frames에 없는 얼굴도 대화 인물·체인 전용 호출에서 공통 구도를 쓴다.
    for (const key of ['portraits/mates/gs_eleonore', 'maid-styles/japan/1', 'portraits/player/soyoung', 'portraits/rivals/앤 보니']) {
      const check = await page.evaluate(async key => {
        const frame = G.PORTRAIT_LAYOUT[key];
        if (!frame) throw Error('공통 구도 누락: ' + key);
        await G.Img.load(frame.source);
        const spec = { img: [key], noRole: true, noFallback: true };
        const reference = G.Art.portraitCanvas(spec, 248).toDataURL();
        const host = document.createElement('div'); document.querySelector('#ui').appendChild(host);
        const output = [], manual = G.FX.portraitFace.frames[key];
        delete G.FX.portraitFace.frames[key];
        try {
          for (const opts of [{ portrait: spec }, { chain: [key] }]) {
            const rig = G.PortraitRig.mount(host, { ...opts, profile: 'bust' });
            try {
              const cv = rig.root.querySelector('canvas');
              output.push({ canvas: !!cv, equal: !!cv && cv.toDataURL() === reference,
                stats: cv && alphaStats(cv) });
            } finally { rig.destroy(); }
          }
        } finally {
          host.remove();
          if (manual) G.FX.portraitFace.frames[key] = manual;
        }
        return { key, output };
      }, key);
      for (const mode of check.output) {
        assert(mode.canvas && mode.equal && mode.stats.clear > .05, '대화 리그 공통 구도: ' + JSON.stringify(check));
      }
      rigs.push(check);
    }
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ results, rigs, errors }, null, 2));
    for (const result of results) {
      assert(result.clear > .05 && result.solid > .05 && result.corner === 0, '대화 초상 투명도: ' + JSON.stringify(result));
      if (result.opaque) {
        assert.strictEqual(result.opaque.clear, 0, '기존 일반 얼굴 칸은 배경색 유지');
        assert(result.centered.clear > .05 && result.centered.corner === 0, '가운데 정렬한 얼굴의 투명도');
        assert(result.rigAlpha.clear > .05 && result.rigAlpha.corner === 0, '리그 대체 얼굴의 투명도');
      }
    }
    assert.deepStrictEqual(errors, [], '콘솔·페이지 오류');
    console.log(JSON.stringify({ results, errors, screenshots: OUT }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
