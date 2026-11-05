/* 첨부 참고 동료의 전용 파일·리그·사건 대화·혼인 후 얼굴 연결을 실제 file://로 확인한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/event_companion_refs_20261106_prompts.json'), 'utf8')).portraits;
const OUT = path.join(ROOT, 'artifacts/event-companion-refs-20261106/runtime');
(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [], checks = [];
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.Legend && G.Family && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({name: '인물화 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      Object.assign(G.Game.state.settings, {res: .35, sound: 0, music: 0});
      G.Game.state.date.y = 1627;
    });
    for (const row of rows) {
      checks.push(await page.evaluate(async row => {
        const id = row.id, sp = G.Legend.speaker(id), expected = 'portraits/mates/' + id;
        const face = G.Img.pick(G.Art.portraitKeys(sp.portrait)), half = G.Img.pick(sp.half);
        if (!G.MATE[id].eventOnly || face !== expected || half !== expected + '_half') throw Error('사건 동료 초상 연결: ' + id);
        const assets = [];
        for (const [key, w, h] of [[face, 448, 448], [half, 1024, 1536]]) {
          if (!G.IMAGE_FILES[key].includes('_ref20261106')) throw Error('새 그림 선택: ' + key);
          const image = await G.Img.load(key), coords = G.PORTRAIT_FACES[key];
          if (!image || image.naturalWidth !== w || image.naturalHeight !== h || !coords || coords.box[2] <= 0 || coords.box[3] <= 0) throw Error('그림 해독·규격·얼굴 자리: ' + key);
          const c = document.createElement('canvas'); c.width = c.height = 1;
          const x = c.getContext('2d'); x.drawImage(image, 0, 0, 1, 1, 0, 0, 1, 1);
          if (x.getImageData(0, 0, 1, 1).data[3] > 8) throw Error('투명 배경: ' + key);
          assets.push({key, file: G.IMAGE_FILES[key], size: [w, h]});
        }
        G.Game.state.player.wife = id;
        const wife = G.Family.wifeSpeaker();
        if (G.Img.pick(G.Art.portraitKeys(wife.portrait)) !== face || G.Img.pick(wife.half) !== half) throw Error('혼인 후 초상 연결: ' + id);
        G.Game.state.player.wife = null;
        return {id, assets};
      }, row));
      for (const mode of ['half', 'face']) {
        await page.evaluate(({id, mode}) => {
          const sp = G.Legend.speaker(id);
          if (mode === 'face') {sp.noStand = true; sp.layout = null; sp.partner = null;}
          window.__portraitDialog = G.UI.say('먼 바다에서도 제 솜씨를 쓸 수 있을 거예요.', sp);
        }, {id: row.id, mode});
        await page.waitForSelector(mode === 'half' ? '.dlg-actor.active.tall' : '.dlg .pframe');
        await page.waitForTimeout(500);
        await page.screenshot({path: path.join(OUT, row.id + '_' + mode + '.png')});
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.querySelector('.dlg'));
        await page.evaluate(() => window.__portraitDialog);
        assert.strictEqual(await page.locator('.dlg-actors').count(), 0);
      }
    }
    assert.deepStrictEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, errors}, null, 2));
    console.log('성인 동료 5명: 새 그림 10장 해독·투명도·규격·얼굴 자리, 사건·혼인 후 연결, 얼굴·무릎상 대화 표시·종료 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
