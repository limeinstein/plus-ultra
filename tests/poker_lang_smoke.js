/* 포카 상대의 말: 그 도시의 말을 모르면 알아듣지 못한다 (js/games/poker.js · G.Tongues) — node tests/poker_lang_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.mates = []; s.player.gold = 5000;
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      G.UI.choose = async () => 0;     // 판돈을 고르지 않고 그만둔다
      async function talk(cid) {
        const c = G.CITY_DATA[cid]; s.loc = Object.assign({}, s.loc, { mode: 'city', city: c.id });
        const pr = G.Games.poker(c), got = [];
        for (let k = 0; k < 2; k++) {
          for (let t = 0; t < 60 && !document.querySelector('.dlg .body'); t++) await sleep(50);
          const b = document.querySelector('.dlg .body'); got.push(b ? b.innerText.replace(/▼/g, '').trim() : '');
          await sleep(260); const back = document.querySelector('.modal-back'); if (back) back.click(); await sleep(120);
        }
        await pr;
        return { city: c.name, lv: G.Scenes.city.langLv(c), lines: got };
      }
      const lis = await talk(0);
      const arab = G.CITY_DATA.find(c => c && c.lang === 5 && c.port && G.Scenes.city.langLv(c) === 0);
      const far = await talk(arab.id);
      return { lis, far };
    });
    console.log('   ' + JSON.stringify(r));
    const plain = /포카|재미없군/;
    ok(r.lis.lv >= 3 && plain.test(r.lis.lines.join(' ')), r.lis.city + '(말이 통함): 「' + r.lis.lines.join('」 「') + '」');
    ok(r.far.lv === 0 && !plain.test(r.far.lines.join(' ')) && r.far.lines.every(t => t.length > 0), r.far.city + '(아랍어 모름): 알아듣지 못한다 — 「' + r.far.lines.join('」 「') + '」');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
