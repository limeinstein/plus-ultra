/* 실제 생일 경계와 수첩·대화창의 40세 중년/70세 노년 표시를 확인한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/player-portrait-ages-20261123');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [], screens = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : setTimeout(() => cb(performance.now()), 16); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const cases = await page.evaluate(async () => {
      const s = G.Game.state = G.State.newGame({
        name: '나이 시험 제독', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal'
      });
      s.player.born = { y: 1450, m: 4, d: 12 };
      s.settings.music = 0; s.settings.sound = 0; s.settings.autosave = false;
      G.State.save = () => {};
      s.loc = { mode: 'city', city: 0 }; G.Game.sceneName = 'city';
      G.Game.showLayers(false, false, true); G.UI.clearScreen(); G.UI.hud.hide();
      if (G.Loader) G.Loader.hide();
      document.querySelector('#boot-loader')?.remove();
      const all = G.Img.heroFaces('m').map(key => key.slice('portraits/player/'.length));
      if (all.length !== 14) throw Error('남성 외형 14종: ' + all.length);
      const results = [];
      for (const id of all) {
        s.player.look = id;
        s.player.portrait = { img: ['portraits/player/' + id] };
        for (const [year, day, age, stage] of [[1490, 11, 39, 'young'], [1490, 12, 40, 'middle'], [1520, 11, 69, 'middle'], [1520, 12, 70, 'elderly']]) {
          s.date = { y: year, m: 4, d: day };
          if (G.R.age() !== age || G.Img.heroAgeStage() !== stage) throw Error(id + ': 생일 단계 ' + age);
          const face = G.Img.pick(G.Art.portraitKeys(s.player.portrait));
          const half = G.Img.pick(G.Img.chain.heroHalf());
          const expectedFace = 'portraits/' + ({ young: 'player', middle: 'player-aged', elderly: 'player-elderly' })[stage] + '/' + id;
          const expectedHalf = 'characters/player_half' + (id === 'admiral' ? '' : '_' + id) + ({ young: '', middle: '_old', elderly: '_elderly' })[stage];
          if (face !== expectedFace || half !== expectedHalf) throw Error(id + ': 그림 단계 ' + age);
          for (const key of [face, half]) {
            const image = await G.Img.load(key);
            if (!image || !image.naturalWidth) throw Error('그림 읽기 실패: ' + key);
          }
          results.push({ id, age, stage, face, half });
        }
      }
      // 수첩이 고른 실제 무릎상 키를 기록한다.
      const apply = G.Img.apply;
      G.Img.apply = function (canvas, chain) {
        if ([].concat(chain).some(key => /^characters\/player_half/.test(key))) window.__ageAppliedHalf = G.Img.pick(chain);
        return apply.apply(this, arguments);
      };
      window.__setAge = (age, id = 'armored_navigator') => {
        s.player.look = id; s.player.portrait = { img: ['portraits/player/' + id] };
        s.date = { y: s.player.born.y + age, m: 4, d: 12 };
      };
      return results;
    });
    assert.strictEqual(cases.length, 56);
    for (const age of [39, 40, 69, 70]) {
      await page.evaluate(age => { __setAge(age); window.__ageAppliedHalf = null; G.Info.open('admiral'); }, age);
      await page.waitForFunction(() => !!window.__ageAppliedHalf && !!document.querySelector('.pc canvas'));
      const half = await page.evaluate(() => window.__ageAppliedHalf);
      assert.strictEqual(half, 'characters/player_half_armored_navigator' + (age >= 70 ? '_elderly' : age >= 40 ? '_old' : ''));
      await page.screenshot({ path: path.join(OUT, `notebook-${age}.png`) });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.pc canvas'));
      // 같은 나이의 대화창 얼굴상도 실제 파일을 읽는다.
      await page.evaluate(() => {
        window.__ageSpeech = G.UI.say('선장의 모습을 확인합니다.', {
          name: G.Game.state.player.name, portrait: G.Game.state.player.portrait,
          rigId: 'player', solo: true, noHalf: true, keepScene: true
        });
      });
      await page.waitForFunction(() => [...document.querySelectorAll('.dlg .rig-fallback, .dlg-stage .rig-fallback')].some(im => im.complete && im.naturalWidth > 0));
      const src = await page.evaluate(() => [...document.querySelectorAll('.dlg .rig-fallback, .dlg-stage .rig-fallback')].find(im => im.complete && im.naturalWidth > 0).src);
      const stage = age >= 70 ? 'elderly' : age >= 40 ? 'middle' : 'young';
      assert(src.includes(`/player-ages-20261123/${stage}/armored_navigator.webp`), src);
      await page.screenshot({ path: path.join(OUT, `dialog-face-${age}.png`) });
      await page.waitForTimeout(450);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('.dlg'));
      screens.push({ age, half, faceSource: src });
    }
    // 만들기 화면도 현재 플레이어의 나이 대신 슬라이더의 40세를 쓴다.
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#age');
    await page.locator('#age').fill('40');
    await page.locator('#age').dispatchEvent('input');
    const preview = await page.evaluate(() => G.Scenes.create.playerSpec().img);
    assert(preview[0].startsWith('portraits/player-aged/'), JSON.stringify(preview));
    assert.deepStrictEqual(errors, [], '콘솔·페이지 오류 0');
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ cases, screens, creationPreview: preview, errors }, null, 2));
    console.log('실제 날짜 경계 56건·그림 112회 읽기·수첩/대화창 8화면·만들기 40세 미리보기 통과');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
