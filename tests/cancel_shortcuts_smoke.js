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
    // 거리에서 연 대화를 우클릭으로 닫으면 그 우클릭(mouseup)이 거리(js/scenes/town.js T.catcher — 왼쪽 단추인지 보지 않음)로 새어
    // 커서 밑 건물(항구)에 들어가 버린다 (QA 2026-10-23). 게임 쪽 결함이라 끝에서 따로 알리고, 아래 점검을 위해 그 건물에서 나온다.
    await wait(800);
    const leaked = await page.evaluate(() => G.Scenes.city.current() && G.Scenes.city.current().kind);
    if (leaked) { await page.evaluate(() => G.Scenes.city.leave()); await page.waitForFunction(() => !G.Scenes.city.current() && !G.UI.busy() && !!document.querySelector('#ui .cmdmenu')); }

    async function enterAndWait(kind) {
      await page.evaluate(k => { G.Scenes.city.visit(k); }, kind);
      for (let i = 0; i < 30; i++) {
        // 도시가 아직 바빠(들어온 뒤 사건 등) visit이 무시됐으면 다시 부른다
        if (i % 4 === 3 && await page.evaluate(() => !G.Scenes.city.current() && !G.UI.busy())) await page.evaluate(k => { G.Scenes.city.visit(k); }, kind);
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
    // 우클릭(contextmenu)만 보낸다 — 실제 마우스 우클릭은 리눅스에서 뒤이은 mouseup이 다시 거리 건물로 새어 들어간다 (위 leaked, town.js 몫)
    await page.evaluate(() => document.body.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 480, clientY: 270 })));
    await page.waitForFunction(() => !G.Scenes.city.current() && !!document.querySelector('#ui .cmdmenu'));
    ok(await page.evaluate(() => !G.Scenes.city.current() && !G.Town.hidden()), '건물 메뉴에서 우클릭으로 거리에 나온다');
    // 실제 마우스 우클릭으로 나와도 다시 들어가 버리지 않는가 (게임 결함 점검 — 끝에서 알림)
    await enterAndWait('trade');
    await page.mouse.click(480, 270, { button: 'right' });
    await wait(1200);
    const leaked2 = await page.evaluate(() => G.Scenes.city.current() && G.Scenes.city.current().kind);

    ok(!errors.length, '콘솔 오류 0');
    ok(!leaked && !leaked2, '우클릭으로 대화를 닫거나 건물을 나와도 그 우클릭이 거리 건물(' + (leaked || leaked2) + ')로 새지 않는다 — js/scenes/town.js T.catcher mouseup이 e.button을 보지 않음');
    console.log('\n우클릭·Esc 나가기 점검 통과');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
