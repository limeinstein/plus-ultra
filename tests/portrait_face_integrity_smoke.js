/* 첨부 제보 장면 회귀 검사: 라코루냐의 왕실 전령과 navigator_white 제독.
   무릎상과 얼굴상 대체 모두 원본 한 장만 표시하고 얼굴 조각을 만들지 않는다.
   node tests/portrait_face_integrity_smoke.js */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

const ROOT = path.resolve(__dirname, '..');
const BROWSER = process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: BROWSER,
    args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {
      if (m.type() === 'error' && !/Failed to load resource|fonts\.|net::/.test(m.text())) errors.push(m.text());
    });
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Loader.shown(), null, { timeout: 120000 });

    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const s = G.Game.state = G.State.newGame({
        name: '레오나르도 디카프리오', nation: 'ES', job: 'explorer', age: 22,
        birth: { m: 4, d: 5 }, st: { str: 60, int: 60, mar: 60, cha: 60 },
        sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal'
      });
      s.date = { y: 1487, m: 4, d: 5 };
      s.player.look = 'navigator_white';
      s.player.portrait = G.Art.withImg(G.Art.portraitSpec({
        seed: 'face-integrity-player', culture: 'med', g: 'm', age: 'young', beard: 0
      }), ['portraits/player/navigator_white']);
      s.loc = { mode: 'city', city: 2, lon: G.CITY_DATA[2].lon, lat: G.CITY_DATA[2].lat };
      s.settings.music = 0; s.settings.sound = 0; s.settings.autosave = false;
      G.State.save = () => {};
      G.UI.clearScreen();
      G.Game.showLayers(false, false, true);
      G.Game.setScene(G.Scenes.city.view(G.CITY_DATA[2]));
      window.__faceIntegrity = async noHalf => {
        const who = G.Scenes.city.npc('herald', '왕실 전령');
        if (noHalf) who.noHalf = true;
        const pending = G.UI.say('…큰 소리로는 말씀드릴 수 없습니다. 왕궁으로, 어서 드십시오.', who);
        return pending;
      };
    });

    async function probe(noHalf) {
      await page.evaluate(noHalf => { window.__faceIntegrityPending = window.__faceIntegrity(noHalf); }, noHalf);
      await page.waitForSelector('.dlg-actor .portrait-rig .rig-fallback');
      await page.waitForFunction(() => [...document.querySelectorAll('.dlg-actor .rig-fallback')].every(im => im.complete && im.naturalWidth > 0), null, { timeout: 30000 });
      const out = await page.evaluate(() => ({
        tall: document.querySelectorAll('.dlg-actor.tall').length,
        bust: document.querySelectorAll('.dlg-actor.bust').length,
        actors: [...document.querySelectorAll('.dlg-actor .portrait-rig')].map(root => {
          const im = root.querySelector('.rig-fallback');
          return {
            single: root.classList.contains('rig-single'),
            pieces: root.querySelectorAll('.rig-piece, .rig-facefx').length,
            width: im && im.naturalWidth,
            height: im && im.naturalHeight,
            src: im && decodeURIComponent(im.src)
          };
        })
      }));
      await page.locator('.modal-back .dlg').click();
      await page.evaluate(() => window.__faceIntegrityPending);
      return out;
    }

    const knee = await probe(false);
    assert.strictEqual(knee.tall, 2, '첨부 장면은 제독·전령 무릎상 둘');
    assert.strictEqual(knee.bust, 0, '첨부 장면에서 얼굴상으로 잘못 대체되지 않음');
    assert(knee.actors.every(a => a.single && a.pieces === 0), '무릎상은 원본 한 장만 표시');
    assert(knee.actors.some(a => /player_half_navigator_white\.png/.test(a.src) && a.width === 512 && a.height === 512), '선택한 제독 무릎상 원본 유지');
    assert(knee.actors.some(a => /portraits\/pools\/sponsors\/es\/m\/02_half\.webp/.test(a.src) && a.width >= 1024 && a.height >= 1536), '라코루냐 왕실 전령 무릎상 원본 유지');

    const bust = await probe(true);
    assert.strictEqual(bust.tall, 0, '대체 장면은 무릎상 없음');
    assert.strictEqual(bust.bust, 2, '대체 장면은 얼굴상 둘');
    assert(bust.actors.every(a => a.single && a.pieces === 0), '얼굴상도 원본 한 장만 표시');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify({ knee, bust, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
