/* 임진왜란 15명: 실제 그림 선택·해독·투명도·눈/입 자리와 대화 화면을 확인한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts', 'imjin-portraits-20261030', 'screenshots');
const assets = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'imjin_portrait_prompts.json'), 'utf8')).assets;
const mates = { yisunsin: 'h_yisunsin', heojun: 'h_heojun', gwakjaeu: 'h_gwakjaeu',
  samyeong: 'h_samyeong', nongae: 'h_nongae', kimdeokryeong: 'h_kimdeokryeong' };

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    fs.mkdirSync(OUT, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Imjin && !G.Scenes.title.bootPending,
      null, { timeout: 120000 });
    const checked = await page.evaluate(async ({ assets, mates }) => {
      G.Game.state = G.State.newGame({ name: '제독', nation: 'PT', job: 'explorer', age: 40,
        birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.settings.res = 0.35;
      G.Game.state.settings.sound = 0; G.Game.state.settings.music = 0;
      const result = [];
      function check(v, m) { if (!v) throw new Error(m); }
      window.__imjinPortraitSpeakers = {};
      for (const a of assets) {
        const sp = mates[a.id] ? G.Legend.speaker(mates[a.id]) : G.Hist.speaker(a.id);
        const faceKey = G.Img.pick(G.Art.portraitKeys(sp.portrait));
        const halfKey = G.Img.pick(sp.half);
        check(faceKey === 'portraits/' + a.key, a.name + ' 실제 얼굴 선택: ' + faceKey);
        check(halfKey === 'portraits/' + a.key + '_half', a.name + ' 실제 무릎상 선택: ' + halfKey);
        for (const [key, width, height] of [[faceKey, 1024, 1024], [halfKey, 1024, 1536]]) {
          const im = await G.Img.load(key);
          check(im && im.naturalWidth === width && im.naturalHeight === height, key + ' 해독·규격');
          const cv = document.createElement('canvas'); cv.width = width; cv.height = height;
          const ctx = cv.getContext('2d'); ctx.drawImage(im, 0, 0);
          const pixels = ctx.getImageData(0, 0, width, height).data;
          let clear = 0, solid = 0;
          for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] < 8) clear++; if (pixels[i] > 240) solid++; }
          check(clear > width * height * 0.04 && solid > width * height * 0.08, key + ' 실제 투명 배경·인물');
          const f = G.PORTRAIT_FACES[key];
          check(f && f.eyes.length === 4 && f.mouth.length === 2, key + ' 눈·입 자리');
          check(f.eyes.every(v => v > 0 && v < 1) && f.mouth.every(v => v > 0 && v < 1), key + ' 얼굴 좌표 범위');
        }
        window.__imjinPortraitSpeakers[a.id] = sp;
        result.push({ name: a.name, faceKey, halfKey });
      }
      return result;
    }, { assets, mates });
    for (const a of assets) {
      await page.evaluate(id => { window.__imjinPortraitDone = G.UI.say('복식과 얼굴을 확인합니다.', window.__imjinPortraitSpeakers[id]); }, a.id);
      await page.waitForSelector('.dlg-actor.active.tall');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, a.id + '.png') });
      await page.keyboard.press('Enter');
      await page.evaluate(() => window.__imjinPortraitDone);
    }
    assert.strictEqual(checked.length, 15);
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({ checked, errors }, null, 2));
    console.log('15명 실제 얼굴·무릎상 선택, 그림 30장 해독·규격·투명도·얼굴 좌표, 대화 화면 15장 확인. 콘솔 오류 0.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
