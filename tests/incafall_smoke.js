/* 잉카 제국의 멸망: 자료 등록, 시대·도시별 사건 진입과 시대 소식을 확인한다. */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.IncaFall, null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, IF = G.IncaFall;
      function at(y, m, d, city, state) {
        s.date = { y, m, d }; s.loc = { mode: 'city', city }; s.incaFall = state || {};
        return IF.pending();
      }
      const gates = {
        panama: at(1524, 1, 1, 210, {}),
        tumbes: at(1532, 4, 1, 220, { side: 'partner' }),
        cusco: at(1533, 11, 15, 223, {}),
        siege: at(1536, 5, 1, 223, { cusco: 'manco' }),
        tupac: at(1572, 9, 1, 223, { cusco: 'manco', siege: 'manco', friend: 1 })
      };
      s.date = { y: 1534, m: 1, d: 9 }; s.loc = { mode: 'city', city: 7 }; s.incaFall = { side: 'partner', met: 1, told: {} };
      const news = IF.daily().map(x => x.text);
      return {
        figures: G.INCA_FIGS.length,
        gates,
        goldEvent: !!(G.Econ && G.Econ.DEF && G.Econ.DEF.incagold),
        news: news.join(' | '),
        keys: Object.keys(IF._t).sort(),
        version: G.Scenes.title.version
      };
    });
    assert.strictEqual(result.figures, 13, '역사 인물 13명');
    assert.deepStrictEqual(result.gates, { panama: true, tumbes: true, cusco: true, siege: true, tupac: true });
    assert(result.goldEvent && /잉카의 황금/.test(result.news), '금값 하락 시장 사건과 시대 소식');
    assert.deepStrictEqual(result.keys, ['cusco', 'panama', 'siege', 'tumbes', 'tupac']);
    assert(typeof result.version === 'string' && result.version.length > 0, '버전 문자열이 있다');   // 버전이 오를 때마다 깨지지 않게 값은 묻지 않는다 (QA 2026-10-23)
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
