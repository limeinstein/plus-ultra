/* 누락 사건의 전용 인물화·시기별 얼굴·사건 그림과 혼례 연결을 실제 file:// 화면에서 확인한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const portraits = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/missing_event_portraits_20261105_prompts.json'), 'utf8')).portraits;
const scenes = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/missing_event_scenes_20261105_prompts.json'), 'utf8')).scenes;
const OUT = path.join(ROOT, 'artifacts/missing-event-art-20261105/screenshots');
(async () => {
  const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [], checks = {portraits: [], scenes: []};
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.Hist && G.Legend && G.Gyeonwoo && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({name: '누락 이벤트 그림 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      Object.assign(G.Game.state.settings, {res: .35, sound: 0, music: 0});
      window.__artSpeaker = row => {
        const late = row.id.endsWith('_late'), id = late ? row.id.slice(0, -5) : row.id;
        G.Game.state.date.y = id === 'rc_ricci' ? (late ? 1607 : 1583) : id === 'jj_altan' ? (late ? 1572 : 1550) : 1542;
        return row.group === 'legendary' || row.group === 'mates' ? G.Legend.speaker(id) : G.Hist.speaker(id);
      };
    });
    assert.strictEqual(portraits.length, 67);
    assert.strictEqual(scenes.length, 71);
    for (const row of portraits) {
      checks.portraits.push(await page.evaluate(async row => {
        const sp = window.__artSpeaker(row), face = G.Img.pick(G.Art.portraitKeys(sp.portrait)), half = G.Img.pick(sp.half);
        const expected = 'portraits/' + row.group + '/' + row.id;
        if (face !== expected || half !== expected + '_half') throw Error('화자 연결: ' + row.id + ' ' + face + ' ' + half);
        for (const [key, w, h] of [[face, 448, 448], [half, 1024, 1536]]) {
          const im = await G.Img.load(key);
          if (!im || im.naturalWidth !== w || im.naturalHeight !== h || !G.PORTRAIT_FACES[key]) throw Error('해독·규격·얼굴 좌표: ' + key);
        }
        return {id: row.id, face, half};
      }, row));
      for (const mode of ['half', 'face']) {
        await page.evaluate(({row, mode}) => {
          const sp = window.__artSpeaker(row);
          if (mode === 'face') {sp.noStand = true; sp.layout = null; sp.partner = null;}
          window.__artDialog = G.UI.say('바다에서 만난 사람 — 전용 인물화 확인.', sp);
        }, {row, mode});
        await page.waitForSelector(mode === 'half' ? '.dlg-actor.active.tall' : '.dlg .pframe');
        await page.screenshot({path: path.join(OUT, row.id + '_' + mode + '.png')});
        await page.waitForTimeout(250);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.querySelector('.dlg'), null, {timeout: 5000});
        await page.evaluate(() => window.__artDialog);
      }
    }
    for (const row of scenes) {
      checks.scenes.push(await page.evaluate(async row => {
        const im = await G.Img.load(row.key);
        if (!im || im.naturalWidth !== 1881 || im.naturalHeight !== 836) throw Error('사건 그림 해독·규격: ' + row.key);
        G.Game.state.date.y = row.id === 'jj_guihua' ? 1572 : row.id === 'rc_peking' ? 1607 : 1583;
        const sp = G.HIST_FIG[row.speaker] ? G.Hist.speaker(row.speaker) : G.Legend.speaker(row.speaker);
        const face = G.Img.pick(G.Art.portraitKeys(sp.portrait));
        if (!face || !await G.Img.load(face)) throw Error('사건 화자 얼굴: ' + row.speaker);
        window.__artScene = G.FamEv.showPic({img: row.key, title: row.title});
        await window.__artScene.ready;
        window.__artDialog = G.UI.say('사건 그림과 등장인물을 확인합니다.', sp);
        return {key: row.key, speaker: row.speaker, face};
      }, row));
      await page.waitForSelector('.famscene.on img');
      await page.waitForSelector('.dlg .pframe');
      await page.evaluate(async () => {await document.querySelector('.famscene img').decode();});
      assert(await page.locator('#ui').evaluate(el => el.classList.contains('scenepic-on')));
      assert.strictEqual(await page.locator('.dlg-actor.active.tall').count(), 0);
      await page.screenshot({path: path.join(OUT, row.id + '_scene.png')});
      await page.waitForTimeout(250);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('.dlg'), null, {timeout: 5000});
      await page.evaluate(async () => {await window.__artDialog; await window.__artScene.stop();});
      assert.strictEqual(await page.locator('.famscene').count(), 0);
      assert(!(await page.locator('#ui').evaluate(el => el.classList.contains('scenepic-on'))));
    }
    // 실제 한산도 도착 흐름을 두 선택지로 끝내 전용 그림의 표시·정리를 확인한다.
    checks.wedding = await page.evaluate(async () => {
      const original = {say: G.UI.say, ask: G.UI.ask, toast: G.UI.toast, showPic: G.FamEv.showPic};
      const out = [];
      try {
        G.UI.say = async () => {}; G.UI.toast = () => {};
        for (const choice of ['yes', 'no']) {
          const shown = [];
          G.Game.state.gw = {stage: 3, aboard: ['gyeonwoo', 'jiknyeo']};
          G.UI.ask = async () => choice;
          G.FamEv.showPic = spec => {shown.push(spec.img); return original.showPic(spec);};
          await G.Gyeonwoo.arrival(G.CITY_DATA.find(c => c.id === G.BALANCE.gyeonwoo.hansan));
          if (shown.length !== 1 || shown[0] !== 'legend-events/gyeonwoo_wedding') throw Error('한산도 혼례 그림 연결');
          if (G.Game.state.gw.end !== (choice === 'yes' ? 'crew' : 'gift')) throw Error('혼례 선택 결과');
          if (document.querySelector('.famscene') || document.querySelector('#ui').classList.contains('scenepic-on')) throw Error('혼례 그림 정리');
          out.push({choice, end: G.Game.state.gw.end, shown});
        }
      } finally {Object.assign(G.UI, {say: original.say, ask: original.ask, toast: original.toast}); G.FamEv.showPic = original.showPic;}
      return out;
    });
    assert.deepStrictEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({...checks, errors}, null, 2));
    console.log('인물화 134장·사건 71장 해독·규격·얼굴 좌표·실제 대화·종료, 리치·알탄 시기별 초상, 한산도 혼례 두 선택지 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
