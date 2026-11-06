/* 인도 여성 초상: 실제 디코딩·옛 저장·문화권·대화 그림 한 쌍 확인. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const ART = path.join(ROOT, 'artifacts/folk-indian-women-20261106');
(async () => {
  const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.Wander && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    const result = await page.evaluate(async () => {
      G.Game.state = G.State.newGame({name: '인도 여성 초상 확인', nation: 'PT', job: 'explorer', age: 28, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.settings.res = .35;
      G.Game.state.settings.music = 0; G.Game.state.settings.sound = 0;
      const own = G.WANDER_PORTRAITS.in.f;
      if (own.length !== 8 || new Set(own).size !== 8) throw Error('여성 8종 누락');
      for (const type of Object.keys(G.WANDER_TYPES)) {
        if (JSON.stringify(G.Wander.facePool('in', 'f', type)) !== JSON.stringify(own)) throw Error('갈래별 선택 누락: ' + type);
      }
      if (G.Wander.facePool('in', 'm', 'nav').some(k => own.includes(k))) throw Error('남성에게 여성 그림 배정');
      if (G.Wander.facePool('se', 'f', 'nav').some(k => own.includes(k))) throw Error('다른 문화권에 배정');
      if (G.WANDER_PORTRAITS.in.m.length !== 8) throw Error('기존 남성 초상 누락');
      const pairs = [];
      for (const key of own) {
        for (const [k, w, h] of [[key, 512, 512], [key + '_half', 1024, 1536]]) {
          if (!G.PORTRAIT_FACES[k]) throw Error('얼굴 좌표 없음: ' + k);
          const im = await G.Img.load(k);
          if (!im || im.naturalWidth !== w || im.naturalHeight !== h) throw Error('규격/해독: ' + k);
        }
        const d = {id: 'wd_indian_women_qa_' + pairs.length, name: '인도 여성 후보', wd: true, g: 'f', style: 'in', type: 'nav', role: 'maid', st: [50, 50, 50, 50], sk: {}, face: key, halfKey: key + '_half'};
        G.MATES.push(d); G.MATE[d.id] = d;
        const face = G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(d.id)));
        const half = G.Img.pick(G.Img.chain.mateHalf(d.id));
        if (face !== key || half !== key + '_half') throw Error('얼굴/몸 불일치: ' + key);
        pairs.push({id: d.id, face, half});
      }
      const legacy = {id: 'wd_indian_women_legacy', g: 'f', wd: true, style: 'in', type: 'trade', local: 'india', face: 'portraits/pools/mates/ind/f/01', halfKey: 'portraits/pools/mates/ind/f/01_half'};
      G.Wander.fixPortrait(legacy);
      if (!own.includes(legacy.face) || legacy.halfKey !== legacy.face + '_half') throw Error('옛 저장 교정 실패');
      const stable = legacy.face; G.Wander.fixPortrait(legacy);
      if (stable !== legacy.face) throw Error('반복 교정에서 얼굴 변경');
      return {pairs, legacy, maleCount: G.WANDER_PORTRAITS.in.m.length};
    });
    await page.evaluate(() => {
      const id = 'wd_indian_women_qa_0';
      G.UI.say('바람과 물결을 읽는 눈이라면 자신 있어요. 함께 항해하겠습니다.', {name: '인도 출신 여성 항해사', portrait: G.Art.mateSpec(id), half: G.Img.chain.mateHalf(id)});
    });
    await page.waitForSelector('.dlg-actor.active.tall', {timeout: 15000});
    await page.screenshot({path: path.join(ART, 'dialog-preview.png')});
    assert.deepStrictEqual(errors, [], '브라우저 콘솔 오류');
    fs.writeFileSync(path.join(ART, 'runtime-checks.json'), JSON.stringify({ok: true, ...result, errors}, null, 2));
    console.log(JSON.stringify({ok: true, pairs: result.pairs.length, legacy: result.legacy.face, errors}));
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exitCode = 1;});
