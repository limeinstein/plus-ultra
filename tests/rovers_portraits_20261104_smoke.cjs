/* 바다의 사람들 13명·초상 26장과 사건·동료 연결을 file://에서 검사한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/rovers_portraits_20261104_prompts.json'), 'utf8'));
const OUT = path.join(ROOT, 'artifacts/rovers-portraits-20261104/screenshots');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.Rovers && G.Hist && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({name: '바다의 사람들 초상 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.settings.res = .35;
      G.Game.state.settings.sound = 0;
      G.Game.state.settings.music = 0;
    });
    const checks = await page.evaluate(async plan => {
      const out = [];
      if (G.ROVERS_FIGS.length !== plan.portraits.length) throw Error('등장인물 누락');
      for (const row of plan.portraits) {
        const speaker = G.Hist.speaker(row.hist);
        const face = G.Img.pick(G.Art.portraitKeys(speaker.portrait));
        const half = G.Img.pick(speaker.half);
        const expected = 'portraits/' + row.group + '/' + row.id;
        if (face !== expected || half !== expected + '_half') throw Error('사건 초상 선택: ' + row.id + ' ' + face + ' ' + half);
        for (const [key, width, height] of [[face, 448, 448], [half, 1024, 1536]]) {
          const image = await G.Img.load(key);
          if (!image || image.naturalWidth !== width || image.naturalHeight !== height) throw Error('해독·규격: ' + key);
          if (!G.PORTRAIT_FACES[key]) throw Error('얼굴 좌표: ' + key);
        }
        if (row.group === 'legendary') {
          const mateFace = G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(row.id)));
          const mateHalf = G.Img.pick(G.Img.chain.mateHalf(row.id));
          if (mateFace !== expected || mateHalf !== expected + '_half') throw Error('동료 초상 선택: ' + row.id);
        }
        out.push({id: row.id, hist: row.hist, face, half});
      }
      return out;
    }, plan);
    for (const row of plan.portraits) {
      for (const mode of ['half', 'face']) {
        await page.evaluate(({id, mode}) => {
          const sp = G.Hist.speaker(id);
          if (mode === 'face') sp.noStand = true;
          window.__roversDialog = G.UI.say('바다의 사람들 — 인물화 표시 확인.', sp);
        }, {id: row.hist, mode});
        await page.waitForSelector(mode === 'half' ? '.dlg-actor.active.tall' : '.dlg .pframe');
        await page.screenshot({path: path.join(OUT, row.id + '_' + mode + '.png')});
        // 대화창은 열린 뒤 220ms 동안 중복 입력을 막는다.
        await page.waitForTimeout(250);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.querySelector('.dlg'), null, {timeout: 5000});
        await page.evaluate(() => window.__roversDialog);
      }
    }
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, errors}, null, 2));
    assert.deepStrictEqual(errors, []);
    console.log('13명·초상 26장 해독·규격·얼굴 좌표·실제 대화, 동료 5명 연결 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
