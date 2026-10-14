/* 우클릭·Esc로 헤어지기/건물 나오기 — node tests/cancel_shortcuts_smoke.js
   선택 대화에서 우클릭은 Esc처럼 취소하고, 건물 기본 메뉴에서는 둘 다 실제 나가기 동작을 부른다. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const wait = ms => new Promise(r => setTimeout(r, ms));

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'adventurer', age: 22,
        birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35;
      G.UI.fade = async fn => { await fn(); };
      G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('#ui .cmdmenu'), null, { timeout: 30000 });

    // 항해사와 마주한 선택 대화: 우클릭 한 번으로 떠난다(null).
    await page.evaluate(() => {
      window.__talkDone = false;
      G.Scenes.city.B.tavern.talkMate(G.CITY_DATA[0], G.MATE.rocco || G.MATES[0], true)
        .then(() => { window.__talkDone = true; });
    });
    await page.waitForSelector('#ui .askrow');
    await page.mouse.click(480, 270, { button: 'right' });
    await page.waitForFunction(() => window.__talkDone);
    ok(await page.evaluate(() => window.__talkDone && !G.UI.busy()), '항해사 선택 대화에서 우클릭으로 헤어진다');

    async function enterAndWait(kind) {
      await page.evaluate(k => { G.Scenes.city.visit(k); }, kind);
      for (let i = 0; i < 30; i++) {
        if (await page.evaluate(() => G.UI.busy())) await page.keyboard.press('Enter');
        if (await page.evaluate(k => G.Scenes.city.current() && G.Scenes.city.current().kind === k && !G.UI.busy() && !!document.querySelector('#ui .cmdmenu'), kind)) return;
        await wait(250);
      }
      throw new Error(kind + ' 건물 메뉴가 열리지 않음');
    }

    await enterAndWait('trade');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !G.Scenes.city.current() && !!document.querySelector('#ui .cmdmenu'));
    ok(await page.evaluate(() => !G.Scenes.city.current() && !G.Town.hidden()), '건물 메뉴에서 Esc로 거리에 나온다');

    await enterAndWait('trade');
    await page.mouse.click(480, 270, { button: 'right' });
    await page.waitForFunction(() => !G.Scenes.city.current() && !!document.querySelector('#ui .cmdmenu'));
    ok(await page.evaluate(() => !G.Scenes.city.current() && !G.Town.hidden()), '건물 메뉴에서 우클릭으로 거리에 나온다');

    ok(!errors.length, '콘솔 오류 0');
    console.log('\n우클릭·Esc 나가기 점검 통과');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
