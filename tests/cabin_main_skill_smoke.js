/* 선실이 보는 특기 (2026-10-29 카페 피드백 「선실에 항해사를 배치할 때 어떤 능력치를 중요하게 보는지 표기」)
   · 방마다 주 특기(★)·보조 특기(☆ — 절반만 친다) · 방의 힘과 추천 순서가 같은 셈 · 팝업에 「이 방이 보는 특기」 */
'use strict';
const assert = require('assert'); const path = require('path'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async function () {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errors = []; p.on('pageerror', e => errors.push(e.message));
  try {
    await p.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await p.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const r = await p.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, CB = G.Cabins, out = {};
      const pickId = (f) => Object.keys(G.MATE).find(id => { const d = G.MATE[id]; return !d.eventOnly && !d.tale && d.sk && f(d.sk); });
      const sw = { id: pickId(k => k.sword === 3 && !k.ops), loyal: 80 }, op3 = { id: pickId(k => k.ops === 3 && !k.sword), loyal: 80 }, op2 = { id: pickId(k => k.ops === 2 && !k.sword), loyal: 80 };
      const deck = G.CABIN.deck;
      out.lv = { sw: CB.roomLevel(deck, sw), op3: CB.roomLevel(deck, op3), op2: CB.roomLevel(deck, op2) };
      out.best = CB.roomBest(deck, sw);
      out.label = CB.skillLabel(deck).replace(/<[^>]+>/g, '');
      out.all = G.CABINS.filter(c => !c.fixed || c.role || c.skills).filter(c => !c.noStaff && c.id !== 'hold' && c.id !== 'captain' && !c.lang).map(c => [c.id, CB.roomSkills(c).main.length]);
      out.pen = CB.skillLabel(G.CABIN.pen).replace(/<[^>]+>/g, '');
      out.posts = G.CrewAuto.POSTS.map(p => p.id + ':' + G.CrewAuto.postFit(op3, p.id).toFixed(2) + '/' + G.CrewAuto.postFit(sw, p.id).toFixed(2));
      return out;
    });
    console.log(JSON.stringify(r));
    assert.deepStrictEqual(r.lv, { sw: 1.5, op3: 3, op2: 2 }, '갑판: 운용술(주) 그대로 · 검술(보조) 절반');
    assert.strictEqual(r.best.main, false); assert.strictEqual(r.best.raw, 3);
    assert(/★운용술 · ☆검술/.test(r.label), r.label);
    assert(r.all.every(x => x[1] >= 1), '사람을 두는 방마다 주 특기가 있다: ' + JSON.stringify(r.all.filter(x => !x[1])));
    assert(/★과학/.test(r.pen));
    assert(/deck:3\.\d+\/1\.\d+/.test(r.posts.join(' ')), '다른 배의 갑판도 같은 셈: ' + r.posts.join(' '));
    assert.deepStrictEqual(errors, []);
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
