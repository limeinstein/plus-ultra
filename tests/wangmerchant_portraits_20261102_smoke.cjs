/* 금봉호의 얼굴·무릎상 8장, 지나의 동료 초상 연결을 file://에서 검사한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/wangmerchant_portraits_20261102_prompts.json'), 'utf8'));
const OUT = path.join(ROOT, 'artifacts/wangmerchant-portraits-20261102/screenshots');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.Game && G.WangMerch && G.Hist && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({name: '금봉호 초상 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.settings.res = .35;
      G.Game.state.settings.sound = 0;
      G.Game.state.settings.music = 0;
    });
    const checks = await page.evaluate(async plan => {
      const out = [];
      for (const row of plan.portraits) {
        const speaker = G.Hist.speaker(row.id);
        const face = G.Img.pick(G.Art.portraitKeys(speaker.portrait));
        const half = G.Img.pick(speaker.half);
        const expected = 'portraits/history/' + row.id;
        if (face !== expected || half !== expected + '_half') throw Error('전용 초상 선택: ' + row.id);
        for (const [key, width, height] of [[face, 512, 512], [half, 1024, 1536]]) {
          const image = await G.Img.load(key);
          if (!image || image.naturalWidth !== width || image.naturalHeight !== height) throw Error('해독·크기: ' + key);
          if (!G.PORTRAIT_FACES[key]) throw Error('얼굴 좌표: ' + key);
        }
        out.push({id: row.id, face, half});
      }
      const mate = G.Art.mateSpec('jina');
      if (G.Img.pick(G.Art.portraitKeys(mate)) !== 'portraits/history/wm_jina') throw Error('동료 지나 얼굴');
      if (G.Img.pick(G.Img.chain.mateHalf('jina')) !== 'portraits/history/wm_jina_half') throw Error('동료 지나 무릎상');
      return out;
    }, plan);
    for (const row of plan.portraits) {
      for (const mode of ['half', 'face']) {
        await page.evaluate(({id, mode}) => {
          const sp = G.Hist.speaker(id);
          if (mode === 'face') sp.noStand = true;
          window.__merchantDialog = G.UI.say('장사 길에서 다시 만나 반갑습니다.', sp);
        }, {id: row.id, mode});
        await page.waitForSelector(mode === 'half' ? '.dlg-actor.active.tall' : '.dlg .pframe');
        await page.screenshot({path: path.join(OUT, row.id + '_' + mode + '.png')});
        await page.keyboard.press('Enter');
        await page.evaluate(() => window.__merchantDialog);
      }
    }
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, errors}, null, 2));
    assert.deepStrictEqual(errors, []);
    console.log('인물 4명·초상 8장 해독·규격·얼굴 좌표·실제 대화, 동료 지나 초상 연결 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
