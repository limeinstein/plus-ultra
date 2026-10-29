/* 식물 발견의 말 (2026-10-29): 나무·꽃·열매를 찾았는데 짐승을 만난 말이 나오던 것 */
'use strict';
const assert = require('assert'); const path = require('path'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async function () {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message));
  try {
    await p.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await p.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const r = await p.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const D = G.Disc, RT = G.RevealTalk, out = { kinds: {}, shouts: [], replies: [], cat: [] };
      ['cedar', 'apple', 'rose', 'saguaro', 'bullocho', 'sequoia', 'tiger', 'sloth'].forEach(id => { out.kinds[id] = [D.isPlant(G.DISC[id]), D.plantKind(G.DISC[id]), G.Banter.kindOf(G.DISC[id]), D.impactKind(G.DISC[id])]; });
      (G.PLANTS || []).forEach(id => { const d = G.DISC[id]; for (let i = 0; i < 6; i++) { out.shouts.push(RT.shout(d)); out.replies.push(RT.reply(d)); } });
      const sps = G.SPONSORS.slice(0, 40); sps.forEach(sp => out.cat.push(G.Sponsor.catLine(sp, G.DISC.cedar)));
      out.tiger = G.Sponsor.catLine(G.SPONSORS[0], G.DISC.tiger);
      return out;
    });
    const bad = /짐승|달아납|녀석|겁주지|저 녀석들 땅/;
    assert.deepStrictEqual(r.kinds.cedar.slice(0, 2), [true, 'tree']);
    assert.deepStrictEqual(r.kinds.apple.slice(0, 2), [true, 'fruit']);
    assert.deepStrictEqual(r.kinds.rose.slice(0, 2), [true, 'flower']);
    assert.deepStrictEqual(r.kinds.saguaro.slice(0, 2), [true, 'cactus']);
    assert.deepStrictEqual(r.kinds.bullocho.slice(0, 2), [true, 'fungus']);
    assert.strictEqual(r.kinds.cedar[3], 'awe', '식물 앞에서는 감동');
    assert.deepStrictEqual(r.kinds.tiger.slice(0, 2), [false, null]); assert.strictEqual(r.kinds.tiger[3], 'wonder');
    assert.strictEqual(r.kinds.sloth[2], 'small', '나무늘보는 짐승');
    assert(!r.shouts.some(t => bad.test(t)), '식물 외침에 짐승 말이 없다: ' + r.shouts.filter(t => bad.test(t))[0]);
    assert(!r.replies.some(t => bad.test(t)), '식물 대답에 짐승 말이 없다');
    assert(!r.cat.some(t => /짐승|동물|생물/.test(t)), '후원자의 한마디: ' + r.cat.filter(t => /짐승|동물|생물/.test(t))[0]);
    assert(/짐승|동물|생물/.test(r.tiger), '짐승은 그대로');
    assert.deepStrictEqual(errors, []);
    console.log('통과', JSON.stringify(r.kinds));
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
