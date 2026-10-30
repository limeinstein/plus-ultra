/* 임진왜란 조연 8명과 사건 그림 14장의 실제 선택·해독·대화·장면 표시를 확인한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/imjin-missing-art-20261031/screenshots');
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/imjin_missing_art_20261031.json'), 'utf8'));
const story = fs.readFileSync(path.join(ROOT, 'js/systems/imjin.js'), 'utf8');
const sceneIds = [...story.matchAll(/withPic\('(imjin_[a-z_]+)'/g)].map(m => m[1]);
assert.deepStrictEqual([...new Set(sceneIds)].sort(), spec.scenes.map(a => a.id).sort());

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    fs.mkdirSync(OUT, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Imjin && !G.Scenes.title.bootPending,
      null, { timeout: 120000 });
    const checked = await page.evaluate(async spec => {
      function check(v, m) { if (!v) throw new Error(m); }
      G.Game.state = G.State.newGame({ name: '제독', nation: 'PT', job: 'explorer', age: 40,
        birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.settings.res = 0.35;
      G.Game.state.settings.sound = 0; G.Game.state.settings.music = 0;
      check(JSON.stringify([...G.IMJIN_SUPPORT_FIGS].sort()) === JSON.stringify(spec.portraits.map(a => a.id).sort()), '조연 목록');
      window.__imjinSupportSpeakers = {};
      const portraits = [];
      for (const a of spec.portraits) {
        const sp = G.Hist.speaker(a.id);
        const face = G.Img.pick(G.Art.portraitKeys(sp.portrait)), half = G.Img.pick(sp.half);
        check(face === a.key && half === a.key + '_half', a.name + ' 실제 초상 선택');
        for (const [key, w, h] of [[face, 1024, 1024], [half, 1024, 1536]]) {
          const im = await G.Img.load(key);
          check(im && im.naturalWidth === w && im.naturalHeight === h, key + ' 해독·규격');
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d'); ctx.drawImage(im, 0, 0);
          const pixels = ctx.getImageData(0, 0, w, h).data;
          let clear = 0, solid = 0;
          for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] < 8) clear++; if (pixels[i] > 240) solid++; }
          check(clear > w * h * 0.04 && solid > w * h * 0.08, key + ' 투명 배경·인물');
          const f = G.PORTRAIT_FACES[key];
          check(f && f.eyes.length === 4 && f.mouth.length === 2, key + ' 얼굴 좌표');
          check(f.eyes.concat(f.mouth).every(v => v > 0 && v < 1), key + ' 얼굴 좌표 범위');
        }
        window.__imjinSupportSpeakers[a.id] = sp;
        portraits.push({ id: a.id, face, half });
      }
      const scenes = [];
      for (const a of spec.scenes) {
        const key = 'legend-events/' + a.id, im = await G.Img.load(key);
        check(im && im.naturalWidth === 1881 && im.naturalHeight === 836, key + ' 해독·규격');
        scenes.push(key);
      }
      return { portraits, scenes };
    }, spec);
    for (const a of spec.portraits) {
      await page.evaluate(id => { window.__imjinDialogDone = G.UI.say('복식과 얼굴을 확인합니다.', window.__imjinSupportSpeakers[id]); }, a.id);
      await page.waitForSelector('.dlg-actor.active.tall');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, a.id + '.png') });
      await page.keyboard.press('Enter');
      await page.evaluate(() => window.__imjinDialogDone);
    }
    for (const a of spec.scenes) {
      await page.evaluate(async a => {
        window.__imjinPicture = G.FamEv.showPic({ img: 'legend-events/' + a.id, title: a.name });
        if (!await window.__imjinPicture.ready) throw new Error(a.id + ' 장면 준비');
        window.__imjinDialogDone = G.UI.say('이벤트 장면과 대화 표시를 확인합니다.', window.__imjinSupportSpeakers.yiwan);
      }, a);
      await page.waitForSelector('.famscene.on img');
      await page.waitForTimeout(400);
      assert.strictEqual(await page.locator('#ui.scenepic-on').count(), 1, '장면 대화 모드');
      assert.strictEqual(await page.locator('.dlg-actor.active.tall').count(), 0, '장면 앞 무릎상 겹침 없음');
      await page.screenshot({ path: path.join(OUT, a.id + '.png') });
      await page.keyboard.press('Enter');
      await page.evaluate(async () => { await window.__imjinDialogDone; await window.__imjinPicture.stop(); });
      assert.strictEqual(await page.locator('.famscene, #ui.scenepic-on').count(), 0, '장면 종료 정리');
    }
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({ checked, errors }, null, 2));
    console.log('조연 8명 초상 16장 선택·해독·투명도·얼굴 좌표, 사건 그림 14장 해독·표시·종료, 실제 화면 22장 확인. 콘솔 오류 0.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
