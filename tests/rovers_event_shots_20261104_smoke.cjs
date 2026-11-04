/* 바다의 사람들 사건 그림 14장을 실제 file:// 장면틀과 대화에서 확인한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/rovers_event_shots_20261104_prompts.json'), 'utf8'));
const OUT = path.join(ROOT, 'artifacts/rovers-event-shots-20261104/screenshots');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.Rovers && G.FamEv && G.Hist && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({name: '바다의 사람들 사건 그림 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.settings.res = .35;
      G.Game.state.settings.sound = 0;
      G.Game.state.settings.music = 0;
    });
    assert.strictEqual(plan.scenes.length, 14);
    const script = fs.readFileSync(path.join(ROOT, 'js/systems/rovers.js'), 'utf8');
    const direct = [...script.matchAll(/withPic\('(rv_[a-z_]+)'/g)].map(m => m[1]);
    const pirate = [...script.matchAll(/pic: '(rv_[a-z_]+)'/g)].map(m => m[1]);
    assert.deepStrictEqual(plan.scenes.map(r => r.id).sort(), [...direct, ...pirate, ...pirate.map(k => k + '_friends')].sort());
    const checks = [];
    for (const row of plan.scenes) {
      const check = await page.evaluate(async row => {
        const key = 'legend-events/' + row.id;
        const image = await G.Img.load(key);
        if (!image || image.naturalWidth !== 1881 || image.naturalHeight !== 836) throw Error('장면 해독·규격: ' + key);
        const sp = G.Hist.speaker(row.speaker);
        const face = G.Img.pick(G.Art.portraitKeys(sp.portrait));
        if (!face || !await G.Img.load(face)) throw Error('화자 얼굴: ' + row.speaker);
        window.__roversScene = G.FamEv.showPic({img: key, title: row.title});
        await window.__roversScene.ready;
        window.__roversSceneDialog = G.UI.say('바다의 사람들 사건 그림과 등장인물을 확인합니다.', sp);
        return {key, speaker: row.speaker, face, width: image.naturalWidth, height: image.naturalHeight};
      }, row);
      await page.waitForSelector('.famscene.on img');
      await page.waitForSelector('.dlg .pframe');
      await page.evaluate(async () => {await document.querySelector('.famscene img').decode();});
      assert(await page.locator('#ui').evaluate(el => el.classList.contains('scenepic-on')));
      assert.strictEqual(await page.locator('.dlg-actor.active.tall').count(), 0, '사건 그림을 무릎상이 가리지 않음');
      await page.screenshot({path: path.join(OUT, row.id + '.png')});
      await page.waitForTimeout(250); // 대화창의 220ms 중복 입력 보호가 끝난 뒤 넘긴다.
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('.dlg'), null, {timeout: 5000});
      await page.evaluate(async () => {await window.__roversSceneDialog; await window.__roversScene.stop();});
      assert.strictEqual(await page.locator('.famscene').count(), 0);
      assert(!(await page.locator('#ui').evaluate(el => el.classList.contains('scenepic-on'))));
      checks.push(check);
    }
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, errors}, null, 2));
    assert.deepStrictEqual(errors, []);
    console.log('사건 14장 경로·해독·규격·실제 장면·대화 얼굴·종료 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
