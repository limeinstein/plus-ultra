/* 신작 항해사 사건 22명·초상 44장의 실제 얼굴·무릎상과 동료 연결을 확인한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/beaux_portraits_20261105_prompts.json'), 'utf8'));
const OUT = path.join(ROOT, 'artifacts/beaux-portraits-20261105/screenshots');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.BeauxEA && G.BeauxEU && G.BeauxIS && G.Hist && G.Legend && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({name: '새 항해사 인물화 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.settings.res = .35;
      G.Game.state.settings.sound = 0;
      G.Game.state.settings.music = 0;
    });
    assert.strictEqual(plan.portraits.length, 22);
    const checks = await page.evaluate(async plan => {
      const out = [];
      const figures = G.BEAUXEA_FIGS.concat(G.BEAUXEU_FIGS, G.BEAUXIS_FIGS);
      const planned = plan.portraits.filter(r => r.group === 'history').map(r => r.id);
      if (figures.length !== 15 || figures.some(id => !planned.includes(id))) throw Error('주변 인물 누락');
      for (const row of plan.portraits) {
        const speaker = row.group === 'mates' ? G.Legend.speaker(row.id) : G.Hist.speaker(row.id);
        const face = G.Img.pick(G.Art.portraitKeys(speaker.portrait));
        const half = row.group === 'mates' ? G.Img.pick(G.Img.chain.mateHalf(row.id)) : G.Img.pick(speaker.half);
        const expected = 'portraits/' + row.group + '/' + row.id;
        if (face !== expected || half !== expected + '_half') throw Error('전용 인물화: ' + row.id + ' ' + face + ' ' + half);
        for (const [key, width, height] of [[face, 448, 448], [half, 1024, 1536]]) {
          const image = await G.Img.load(key);
          if (!image || image.naturalWidth !== width || image.naturalHeight !== height) throw Error('해독·규격: ' + key);
          if (!G.PORTRAIT_FACES[key]) throw Error('얼굴 좌표: ' + key);
        }
        if (row.group === 'mates' && (!G.MATE[row.id].eventOnly || G.MATE[row.id].wed !== 'sea')) throw Error('기존 동료 규칙: ' + row.id);
        out.push({id: row.id, face, half});
      }
      return out;
    }, plan);
    for (const row of plan.portraits) {
      for (const mode of ['half', 'face']) {
        await page.evaluate(({id, group, mode}) => {
          const sp = group === 'mates' ? G.Legend.speaker(id) : G.Hist.speaker(id);
          if (mode === 'face') sp.noStand = true;
          window.__beauxPortraitDialog = G.UI.say('새로운 항해 길에서 만난 사람들 — 인물화 확인.', sp);
        }, {id: row.id, group: row.group, mode});
        await page.waitForSelector(mode === 'half' ? '.dlg-actor.active.tall' : '.dlg .pframe');
        await page.screenshot({path: path.join(OUT, row.id + '_' + mode + '.png')});
        await page.waitForTimeout(250);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.querySelector('.dlg'), null, {timeout: 5000});
        await page.evaluate(() => window.__beauxPortraitDialog);
      }
    }
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, errors}, null, 2));
    assert.deepStrictEqual(errors, []);
    console.log('22명·초상 44장 해독·규격·얼굴 좌표·실제 대화, 동료 7명 연결 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
