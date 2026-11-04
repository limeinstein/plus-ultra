/* 연산군 사건의 전용 초상·장면을 실제 file:// 대화창에서 확인한다. */
'use strict';
const assert = require('assert');
const fs = require('fs'), path = require('path'), {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/yeonsan-art-20261103/screenshots');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/yeonsan_art_20261103_prompts.json'), 'utf8'));
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [], checked = [];
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 720}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Yeonsan && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({name: '그림 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.date = {y: 1505, m: 7, d: 20};
      G.Game.state.settings.res = .35;
      G.Game.state.settings.sound = 0;
      window.__ysSpeakers = {};
    });
    for (const row of plan.portraits) {
      const result = await page.evaluate(async row => {
        function check(v, m) {if (!v) throw Error(m);}
        const sp = row.id === 'jang_noksu' ? G.Legend.speaker('h_jangnoksu') : G.Hist.speaker(row.id === 'yeonsangun' ? 'ys_king' : row.id);
        const expected = 'portraits/' + row.folder + '/' + row.id;
        const face = G.Img.pick(G.Art.portraitKeys(sp.portrait)), half = G.Img.pick(sp.half);
        check(face === expected && half === expected + '_half', row.id + ' 전용 초상 선택: ' + face + ', ' + half);
        for (const [key,w,h] of [[face,1024,1024],[half,1024,1536]]) {
          const im = await G.Img.load(key);
          check(im && im.naturalWidth === w && im.naturalHeight === h, key + ' 크기·해독');
          const f = G.PORTRAIT_FACES[key];
          check(f && f.eyes.concat(f.mouth).every(v => v > 0 && v < 1), key + ' 얼굴 자리');
        }
        window.__ysSpeakers[row.id] = sp;
        return {id: row.id, face, half};
      }, row);
      checked.push(result);
      for (const mode of ['half', 'face']) {
        await page.evaluate(({id, mode}) => {
          const sp = Object.assign({}, window.__ysSpeakers[id]);
          if (mode === 'face') sp.noStand = true;
          window.__ysDialog = G.UI.say('이 사람의 얼굴과 복식을 확인합니다.', sp);
        }, {id: row.id, mode});
        await page.waitForSelector(mode === 'half' ? '.dlg-actor.active.tall' : '.dlg .pframe');
        await page.waitForTimeout(200);
        await page.screenshot({path: path.join(OUT, row.id + '_' + mode + '.png')});
        await page.keyboard.press('Enter');
        await page.evaluate(() => window.__ysDialog);
      }
    }
    const system = fs.readFileSync(path.join(ROOT, 'js/systems/yeonsan.js'), 'utf8');
    const sceneKeys = [...system.matchAll(/withPic\('(ys_\w+)'/g)].map(m => m[1]).sort();
    assert.deepStrictEqual(plan.scenes.map(r => r.id).sort(), sceneKeys, '대본의 장면 6개에 모두 그림이 있다');
    for (const row of plan.scenes) {
      const result = await page.evaluate(async row => {
        const key = 'legend-events/' + row.id;
        const im = await G.Img.load(key);
        if (!im || im.naturalWidth !== 1881 || im.naturalHeight !== 836) throw Error(key + ' 크기·해독');
        window.__ysPic = G.FamEv.showPic({img: key, title: row.title});
        await window.__ysPic.ready;
        const node = window.__ysPic.box.querySelector('img');
        if (!node.complete || !node.naturalWidth) throw Error(key + ' 표시 실패');
        if (!document.getElementById('ui').classList.contains('scenepic-on')) throw Error('초상 겹침 방지 누락');
        window.__ysDialog = G.UI.say(row.title + ' 장면을 확인합니다.', window.__ysSpeakers[row.id === 'ys_last' ? 'yeonsangun' : 'jang_noksu']);
        return {id: row.id, scene: key};
      }, row);
      checked.push(result);
      await page.waitForSelector('.famscene.on');
      await page.waitForTimeout(200);
      await page.screenshot({path: path.join(OUT, row.id + '.png')});
      await page.keyboard.press('Enter');
      await page.evaluate(async () => {await window.__ysDialog; await window.__ysPic.stop();});
      assert.strictEqual(await page.locator('.famscene').count(), 0, row.id + ' 장면 정리');
    }
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checked, errors}, null, 2));
    assert.deepStrictEqual(errors, [], '콘솔 오류');
    console.log('8명 얼굴·무릎상 16장과 이벤트 6장: 전용 선택·해독·얼굴 좌표·실제 화면·장면 정리 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
