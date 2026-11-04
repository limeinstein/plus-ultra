/* 아프리카 다섯 이야기의 초상 20장·사건 장면 10장을 실제 file:// 대화에서 검사한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/africa17_art_20261104_prompts.json'), 'utf8'));
const OUT = path.join(ROOT, 'artifacts/africa17-art-20261104/screenshots');

(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [], checks = [];
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.Game && G.Afr17 && G.Hist && G.Legend && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({name: '아프리카 그림 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.settings.res = .35;
      G.Game.state.settings.sound = 0;
      G.Game.state.settings.music = 0;
      G.Game.state.date = {y: 1665, m: 1, d: 1};
      window.__afSpeaker = id => G.MATE[id] ? G.Legend.speaker(id) : G.Hist.speaker(id);
    });
    for (const row of plan.portraits) {
      const check = await page.evaluate(async row => {
        const speaker = window.__afSpeaker(row.id);
        const expected = 'portraits/' + row.dir + '/' + row.id;
        const face = G.Img.pick(G.Art.portraitKeys(speaker.portrait));
        const half = G.Img.pick(speaker.half || G.Img.chain.mateHalf(row.id));
        if (face !== expected || half !== expected + '_half') throw Error('초상 선택: ' + row.id + ' ' + face + ' ' + half);
        for (const [key, width, height] of [[face, 512, 512], [half, 1024, 1536]]) {
          const image = await G.Img.load(key);
          if (!image || image.naturalWidth !== width || image.naturalHeight !== height) throw Error('해독·규격: ' + key);
          if (!G.PORTRAIT_FACES[key]) throw Error('얼굴 좌표: ' + key);
        }
        if (G.MATE[row.id]) {
          if (!G.MATE[row.id].eventOnly || !G.MATE[row.id].tale) throw Error('사건 동료 연결: ' + row.id);
        }
        return {id: row.id, face, half};
      }, row);
      for (const mode of ['half', 'face']) {
        await page.evaluate(({id, mode}) => {
          const speaker = window.__afSpeaker(id);
          if (mode === 'face') speaker.noStand = true;
          window.__afDialog = G.UI.say('새로운 바다와 만날 날을 기다립니다.', speaker);
        }, {id: row.id, mode});
        await page.waitForSelector(mode === 'half' ? '.dlg-actor.active.tall' : '.dlg .pframe');
        // 대화는 시작 직후 220ms 동안 입력을 무시하므로 실제 조작과 같은 간격을 둔다.
        await page.waitForTimeout(300);
        await page.screenshot({path: path.join(OUT, row.id + '_' + mode + '.png')});
        await page.keyboard.press('Enter');
        await page.evaluate(() => window.__afDialog);
      }
      checks.push(check);
    }
    if (!process.argv.includes('--portraits-only')) {
      assert.strictEqual(plan.scenes.length, 10);
      const system = fs.readFileSync(path.join(ROOT, 'js/systems/africa17.js'), 'utf8');
      for (const row of plan.scenes) {
        assert(system.includes("withPic('" + row.id + "'"), '실제 사건의 장면 열쇠: ' + row.id);
        const check = await page.evaluate(async row => {
          const key = 'legend-events/' + row.id;
          const image = await G.Img.load(key);
          if (!image || image.naturalWidth !== 1881 || image.naturalHeight !== 836) throw Error('장면 해독·규격: ' + key);
          window.__afScene = G.FamEv.showPic({img: key, title: row.name});
          await window.__afScene.ready;
          window.__afDialog = G.UI.say('그날의 이야기를 기억합니다.', window.__afSpeaker(row.speaker));
          return {key, speaker: row.speaker, width: image.naturalWidth, height: image.naturalHeight};
        }, row);
        await page.waitForSelector('.famscene.on img');
        await page.waitForSelector('.dlg .pframe');
        await page.evaluate(() => document.querySelector('.famscene img').decode());
        assert(await page.locator('#ui').evaluate(el => el.classList.contains('scenepic-on')));
        assert.strictEqual(await page.locator('.dlg-actor.active.tall').count(), 0, '무릎상이 장면을 가리지 않음');
        await page.waitForTimeout(350);
        await page.screenshot({path: path.join(OUT, row.id + '.png')});
        await page.keyboard.press('Enter');
        await page.evaluate(async () => {await window.__afDialog; await window.__afScene.stop();});
        assert.strictEqual(await page.locator('.famscene').count(), 0);
        assert(!(await page.locator('#ui').evaluate(el => el.classList.contains('scenepic-on'))));
        checks.push(check);
      }
    }
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, errors}, null, 2));
    assert.deepStrictEqual(errors, []);
    console.log('인물 10명·초상 20장 선택·규격·얼굴 좌표·실제 대화' + (process.argv.includes('--portraits-only') ? '' : ', 장면 10장 표시·종료·대본 연결') + ' 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
