/* 발견 순간의 말이 발견 갈래에 맞는지 — node tests/reveal_talk_smoke.js   (BROWSER_EXE=크롬 경로)
   · 교역품의 외침: 상아·비취·융단(보고 만지는 것)·유향·사향(향)에는 「맛」 이야기가 없고, 「혀가 얼얼」은 향신료에만
   · 요리에 밝은 사람의 말(「맛을 보았습니다」)은 맛을 볼 수 있는 교역품에만, 그림·세공의 말은 갈래마다 (유적의 「지붕선」·「지었는지」가 다른 데 나오지 않게)
   · 요리의 값어치 보탬도 맛을 볼 수 있는 교역품에만. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const RT = G.RevealTalk, SC = G.Scenes, D = G.DISC || {}, out = { bad: [], kinds: {} };
      const all = (G.DISCOVERIES || []);
      const trades = all.filter(d => d.cat === 'trade');
      trades.forEach(d => {
        const k = RT.tradeKind(d); out.kinds[d.id] = k;
        const lines = new Set(); for (let i = 0; i < 80; i++) lines.add(RT.shout(d, { d: d.name }));
        lines.forEach(t => {
          if (/맛/.test(t) && !RT.edible(d)) out.bad.push(d.name + ' 외침: ' + t);
          if (/혀가 얼얼/.test(t) && k !== 'spice') out.bad.push(d.name + ' 외침: ' + t);
          if (/냄새 맡아/.test(t) && k !== 'spice') out.bad.push(d.name + ' 외침: ' + t);
          if (k === 'grave' && /금값|배값|빛깔|보십시오!/.test(t)) out.bad.push(d.name + ' 외침: ' + t);
        });
        [1, 2, 3].forEach(lv => ['art', 'craft'].forEach(kind => {
          const t = SC._lineFor(kind, lv, d);
          if (/지붕|기둥|지었는지|이음새/.test(t) || (/맛/.test(t) && !RT.edible(d)) || (k === 'grave' && /상품|값|빛깔/.test(t))) out.bad.push(d.name + ' ' + kind + lv + ': ' + t.slice(0, 50));
        }));
      });
      // 다른 갈래의 그림·세공 말에 유적의 말이 섞이지 않는다
      ['treasure', 'people', 'geo'].forEach(cat => {
        const d = all.find(x => x.cat === cat); if (!d) return;
        [1, 2, 3].forEach(lv => ['art', 'craft'].forEach(kind => {
          const t = SC._lineFor(kind, lv, d);
          if (/지붕|기둥 사이|지었는지/.test(t)) out.bad.push(d.name + '(' + cat + ') ' + kind + lv + ': ' + t.slice(0, 50));
        }));
      });
      const sl = all.find(d => d.id === 't_slaves');
      if (sl) { const rp = new Set(); for (let i = 0; i < 40; i++) rp.add(RT.reply(sl, { d: sl.name })); rp.forEach(t => { if (/한 잔|수고|잘했다|찾았구나/.test(t)) out.bad.push('노예 무역 대답: ' + t); }); }
      const ivory = all.find(d => d.id === 't_ivory'), pepper = all.find(d => d.id === 't_pepper');
      out.ivoryEdible = RT.edible(ivory); out.pepperEdible = RT.edible(pepper);
      out.ivoryArt = SC._lineFor('art', 2, ivory); out.ivoryCraft = SC._lineFor('craft', 1, ivory);
      out.pepperCook = SC._lineFor('cook', 1, pepper);
      // 요리의 값어치 보탬
      const s = G.Game.state; s.player.sk.cook = 3;
      out.ivoryCare = G.Disc.valueParts(ivory).care; out.pepperCare = G.Disc.valueParts(pepper).care;
      return out;
    });
    console.log(JSON.stringify(r.kinds));
    console.log('상아 그림:', r.ivoryArt, '\n상아 세공:', r.ivoryCraft, '\n후추 요리:', r.pepperCook);
    if (r.bad.length) console.log(r.bad.join('\n'));
    ok(r.kinds.t_ivory === 'hand' && r.kinds.t_pepper === 'spice' && r.kinds.t_frank === 'scent' && r.kinds.t_slaves === 'grave' && r.kinds.t_rice === 'taste', '교역품 갈래 (상아 hand · 후추 spice · 유향 scent · 쌀 taste · 노예 무역 grave)');
    ok(!r.ivoryEdible && r.pepperEdible, '상아는 맛을 보지 않는다 · 후추는 본다');
    ok(r.bad.length === 0, '교역품·보물·민족·지리의 말이 갈래에 맞다 (' + r.bad.length + '건 어긋남)');
    ok(r.ivoryCare !== 'cook' && r.pepperCare === 'cook', '요리의 값어치 보탬은 맛을 볼 수 있는 교역품에만');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('통과');
  } catch (e) { console.error('실패:', e.message, errors); process.exitCode = 1; } finally { await browser.close(); }
})();
