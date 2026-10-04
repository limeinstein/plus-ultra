/* 처음 떠나는 도시(고향) 시장에 나침반·육분의가 늘 있는지 — 1480년(육분의는 원래 1490년부터), 45일마다 바뀌는 물량과 상관없이.
   node tests/home_tools_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    for (const nation of ['PT', 'ES']) {
      const r = await page.evaluate((nation) => {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
        G.Game.state = G.State.newGame({ name: '시험', nation, job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 0), diff: 'normal' });
        const s = G.Game.state, MK = G.Scenes.city.B.market, home = G.CITY_DATA[s.player.home], other = G.CITY_DATA[12];
        const rows = [];
        for (let k = 0; k < 12; k++) { s.day = k * 45; const ids = MK.stock(home).map(it => it.id); rows.push(ids.includes('compass') && ids.includes('sextant')); }
        s.day = 0;
        return { home: home.name, y: s.date.y, all: rows.every(Boolean), other: other.name, otherSextant: MK.stock(other).some(it => it.id === 'sextant') };
      }, nation);
      ok(r.all, r.home + '(' + nation + ') 시장: 12번의 물량 교체 내내 나침반·육분의 (' + r.y + '년)');
      ok(!r.otherSextant, '다른 도시(' + r.other + ')는 예전대로 — 1480년에는 육분의 없음');
    }
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
