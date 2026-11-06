/* 아메리카 남성 전용 초상: 새 후보·옛 저장·누락 대체·실제 대화창을 확인한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/folk-american-men-20261106/screenshots');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/folk_american_men_20261106_prompts.json'), 'utf8'));
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
    const checks = await page.evaluate(async rows => {
      G.Game.state = G.State.newGame({name: '아메리카 남성 인물화 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 50, int: 50, mar: 50, cha: 50}, sk: {}, lg: [], diff: 'normal'});
      const s = G.Game.state; s.settings.res = .35; s.settings.sound = 0; s.settings.music = 0;
      const check = (v, message) => {if (!v) throw Error(message);};
      const expectedIds = Object.keys(G.FOLK_JOIN).filter(id => ['na', 'an', 'az'].includes(G.FOLK_JOIN[id].style));
      check(expectedIds.length === 22 && expectedIds.every(id => rows.some(r => r.id === id)), '아메리카 민족 전체 22종 누락 없음');
      const out = [];
      for (const row of rows) {
        const p = G.FOLK_JOIN[row.id], base = row.key;
        const d = G.FolkJoin.make(G.DISC[row.id], 'm');
        check(d.face === base && d.halfKey === base + '_half', row.id + ' 새 후보');
        check(p.m.includes(d.name) && p.types.includes(d.type) && d.lg[p.lang[0]] === 3, row.id + ' 기존 이름·솜씨·말');
        s.wander.defs[d.id] = d; s.mates.push({id: d.id, role: 'none', loyal: 80});
        // 옛 저장에서 빌리던 공용 얼굴을 복원한 뒤 실제 불러오기 경로로 교정한다.
        d.face = 'portraits/npc-roles/' + p.style + '/native'; d.halfKey = d.face + '_half';
        G.Game.state = G.State.deserialize(G.State.serialize()); G.Wander.apply();
        const restored = G.MATE[d.id];
        check(restored.face === base && restored.halfKey === base + '_half', row.id + ' 옛 저장');
        check(G.Img.pick(G.Art.portraitKeys(G.Scenes.mateSpec(d.id))) === base, row.id + ' 얼굴 선택');
        check(G.Img.pick(G.Img.chain.mateHalf(d.id)) === base + '_half', row.id + ' 무릎상 선택');
        for (const [key, w, h] of [[base, 512, 512], [base + '_half', 1024, 1536]]) {
          const image = await G.Img.load(key);
          check(image && image.naturalWidth === w && image.naturalHeight === h, key + ' 규격·해독');
          check(!!G.PORTRAIT_FACES[key], key + ' 얼굴 좌표');
        }
        // 무릎상이 없으면 전용 얼굴만 골라 짝이 어긋나지 않아야 한다.
        const savedHas = G.Img.has;
        try {
          G.Img.has = key => key === base + '_half' ? false : savedHas(key);
          check(!G.FolkJoin.faces(p.style, 'm', row.id).includes(base), row.id + ' 한 쪽 누락 대체');
        } finally {G.Img.has = savedHas;}
        check(!G.FolkJoin.faces(p.style, 'f', row.id).includes(base), row.id + ' 다른 성별 보존');
        out.push({folk: row.id, id: d.id, name: restored.name, face: base, half: base + '_half'});
        // 다음 반복도 현재 저장 자료를 사용한다.
        Object.assign(s, G.Game.state); G.Game.state = s;
      }
      const ocean = G.FolkJoin.make(G.DISC.folk_maori, 'm');
      check(!rows.some(r => r.key === ocean.face), '다른 민족 초상 보존');
      return out;
    }, plan.portraits);
    for (const row of checks) {
      for (const mode of ['half', 'face']) {
        await page.evaluate(({id, mode}) => {
          const sp = {name: G.MATE[id].name, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3};
          if (mode === 'face') sp.noStand = true;
          window.__folkMaleDialog = G.UI.say('바다 끝까지 함께 가 보고 싶어요.', sp);
        }, {id: row.id, mode});
        await page.waitForSelector(mode === 'half' ? '.dlg-actor.active.tall' : '.dlg .pframe');
        await page.waitForTimeout(200);
        await page.screenshot({path: path.join(OUT, row.folk + '_' + mode + '.png')});
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.querySelector('.dlg'), null, {timeout: 5000});
        await page.evaluate(() => window.__folkMaleDialog);
      }
    }
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, errors}, null, 2));
    assert.strictEqual(checks.length, 22);
    assert.deepStrictEqual(errors, []);
    console.log('22종·44장: 새 후보·옛 저장·성별·민족·짝 누락 대체·실제 대화창 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
