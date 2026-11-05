/* 데뷔탕트 영애·부인 12명과 마녀 1명의 초상 26장을 확인한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/ball_ladies_portraits_20261105_prompts.json'), 'utf8'));
plan.portraits.push(...JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/ball_witch_portraits_20261105_prompts.json'), 'utf8')).portraits);
const OUT = path.join(ROOT, 'artifacts/ball-ladies-portraits-20261105/screenshots');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.Ball && G.Family && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({name: '데뷔탕트 인물화 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.settings.res = .35;
      G.Game.state.settings.sound = 0;
      G.Game.state.settings.music = 0;
    });
    assert.strictEqual(plan.portraits.length, 13);
    const checks = await page.evaluate(async plan => {
      const out = [];
      if (G.BALL_LADIES.length !== 12 || G.BALL_LADIES.some(l => !plan.portraits.some(r => r.id === l.id))) throw Error('무도회 인물 누락');
      for (const row of plan.portraits) {
        const speaker = row.group === 'legendary'
          ? {name: G.MATE[row.id].name, portrait: G.Art.mateSpec(row.id), half: G.Img.chain.mateHalf(row.id), lang: 3}
          : G.Ball.ladySp(G.BALL_LADIES.find(l => l.id === row.id));
        const face = G.Img.pick(G.Art.portraitKeys(speaker.portrait));
        const half = G.Img.pick(speaker.half);
        const expected = 'portraits/' + row.group + '/' + row.id;
        if (face !== expected || half !== expected + '_half') throw Error('전용 인물화: ' + row.id + ' ' + face + ' ' + half);
        for (const [key, width, height] of [[face, 448, 448], [half, 1024, 1536]]) {
          const image = await G.Img.load(key);
          if (!image || image.naturalWidth !== width || image.naturalHeight !== height) throw Error('해독·규격: ' + key);
          if (!G.PORTRAIT_FACES[key]) throw Error('얼굴 좌표: ' + key);
        }
        G.Game.state.player.wife = row.id;
        const wife = G.Family.wifeSpeaker();
        const wifeFace = G.Img.pick(G.Art.portraitKeys(wife.portrait));
        const wifeHalf = G.Img.pick(wife.half);
        if (wifeFace !== expected || wifeHalf !== expected + '_half') throw Error('혼인 후 초상: ' + row.id + ' ' + wifeFace + ' ' + wifeHalf);
        if (row.group === 'legendary' && (G.BALL_WITCH.id !== row.id || !G.MATE[row.id].witch || !G.MATE[row.id].eventOnly)) throw Error('기존 무도회 마녀 연결');
        out.push({id: row.id, face, half});
      }
      return out;
    }, plan);
    for (const row of plan.portraits) {
      for (const mode of ['half', 'face']) {
        await page.evaluate(({id, group, mode}) => {
          const sp = group === 'legendary'
            ? {name: G.MATE[id].name, portrait: G.Art.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3}
            : G.Ball.ladySp(G.BALL_LADIES.find(l => l.id === id));
          if (mode === 'face') { sp.noStand = true; sp.layout = null; sp.partner = null; }
          window.__ballLadyPortraitDialog = G.UI.say('궁정 무도회에서 만난 영애와 부인들 — 인물화 확인.', sp);
        }, {id: row.id, group: row.group, mode});
        await page.waitForSelector(mode === 'half' ? '.dlg-actor.active.tall' : '.dlg .pframe');
        await page.screenshot({path: path.join(OUT, row.id + '_' + mode + '.png')});
        await page.waitForTimeout(250);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.querySelector('.dlg'), null, {timeout: 5000});
        await page.evaluate(() => window.__ballLadyPortraitDialog);
      }
    }
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, errors}, null, 2));
    assert.deepStrictEqual(errors, []);
    console.log('영애·부인 12명과 마녀 1명·초상 26장 해독·규격·얼굴 좌표·실제 대화·가족 연결 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
