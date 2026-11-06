/* 아프리카계 민족 12종 남성 초상의 실제 선택·옛 저장·대화창을 확인한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/folk_african_men_20261106_prompts.json'), 'utf8'));
const OUT = path.join(ROOT, 'artifacts/folk-african-men-20261106/screenshots');

(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.FolkJoin && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({name: '민족 인물화 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.settings.res = .35;
      G.Game.state.settings.sound = 0;
      G.Game.state.settings.music = 0;
    });
    const checks = await page.evaluate(async plan => {
      const out = [], ids = plan.portraits.map(r => r.id), s = G.Game.state;
      window.__folkMen = {};
      for (const row of plan.portraits) {
        const P = G.FOLK_JOIN[row.id], d = G.FolkJoin.make(G.DISC[row.id], 'm');
        if (d.face !== row.key || d.halfKey !== row.key + '_half') throw Error('민족별 선택: ' + row.id);
        if (!P.m.includes(d.name) || !P.types.includes(d.type) || d.lg[P.lang[0]] !== 3) throw Error('이름·솜씨·말: ' + row.id);
        G.MATES.push(d); G.MATE[d.id] = d; s.wander.defs[d.id] = d;
        const face = G.Img.pick(G.Art.portraitKeys(G.Scenes.mateSpec(d.id)));
        const half = G.Img.pick(G.Img.chain.mateHalf(d.id));
        if (face !== row.key || half !== row.key + '_half') throw Error('대화 연결: ' + row.id + ' ' + face + ' ' + half);
        for (const [key, w, h] of [[face, 512, 512], [half, 1024, 1536]]) {
          const img = await G.Img.load(key);
          if (!img || img.naturalWidth !== w || img.naturalHeight !== h) throw Error('규격·해독: ' + key);
          if (!G.PORTRAIT_FACES[key]) throw Error('얼굴 좌표: ' + key);
        }
        // 옛 저장의 공용 역할 그림도 무릎상과 함께 한 번에 교정한다.
        d.face = G.FolkJoin.faces(P.style, 'm')[0]; d.halfKey = d.face + '_half';
        G.Wander.fixPortrait(d);
        if (d.face !== row.key || d.halfKey !== row.key + '_half') throw Error('옛 얼굴 교정: ' + row.id);
        const f = G.FolkJoin.make(G.DISC[row.id], 'f');
        if (!G.FolkJoin.faces(P.style, 'f', row.id).includes(f.face)) throw Error('여성 기존 선택: ' + row.id);
        window.__folkMen[row.id] = d.id;
        out.push({id: row.id, mate: d.id, face, half, femaleFace: f.face});
      }
      for (const id of Object.keys(G.FOLK_JOIN).filter(id => !ids.includes(id))) {
        const P = G.FOLK_JOIN[id], d = G.FolkJoin.make(G.DISC[id], 'm');
        if (!G.FolkJoin.faces(P.style, 'm', id).includes(d.face)) throw Error('다른 민족 기존 선택: ' + id);
      }
      const first = plan.portraits[0], originalHas = G.Img.has;
      try {
        G.Img.has = k => k === first.key + '_half' ? false : originalHas(k);
        const fallback = G.FolkJoin.make(G.DISC[first.id], 'm');
        if (fallback.face === first.key || !originalHas(fallback.face)) throw Error('한 쪽 누락 대체');
      } finally {G.Img.has = originalHas;}
      const json = G.State.serialize();
      G.Game.state = G.State.deserialize(json); G.Wander.apply();
      for (const row of plan.portraits) {
        const d = G.MATE[window.__folkMen[row.id]];
        if (!d || d.face !== row.key || d.halfKey !== row.key + '_half') throw Error('저장 불러오기: ' + row.id);
      }
      return out;
    }, plan);

    for (const row of plan.portraits) {
      for (const mode of ['half', 'face']) {
        await page.evaluate(({id, mode}) => {
          const mate = window.__folkMen[id], def = G.MATE[mate];
          const sp = {name: def.name, portrait: G.Scenes.mateSpec(mate), half: G.Img.chain.mateHalf(mate), lang: 3};
          if (mode === 'face') sp.noStand = true;
          window.__folkDialog = G.UI.say('수평선 너머를 보고 싶어요. 당신의 배에 함께 타고 싶습니다.', sp);
        }, {id: row.id, mode});
        await page.waitForSelector(mode === 'half' ? '.dlg-actor.active.tall' : '.dlg .pframe');
        await page.waitForTimeout(180);
        await page.screenshot({path: path.join(OUT, row.id + '_' + mode + '.png')});
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.querySelector('.dlg'), null, {timeout: 5000});
        await page.evaluate(() => window.__folkDialog);
      }
    }
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, errors}, null, 2));
    assert.strictEqual(checks.length, 12);
    assert.deepStrictEqual(errors, []);
    console.log('12민족·24장 규격·얼굴 좌표·민족별 선택·옛 저장 교정·저장 불러오기·실제 대화 통과. 다른 38민족·여성 유지. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
