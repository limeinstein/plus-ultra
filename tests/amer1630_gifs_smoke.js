/* 신규 아메리카 발견물 70종: file:// 그림 연결·재생·발견·다시 보기·GIF 팩 경로. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/discovery-gif-import-20261029');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/art/amer1630-gif-prompts.json'), 'utf8')).items;
(async () => {
  const browser = await playwright.chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Reel && G.Game.sceneName === 'title');
    const report = await page.evaluate(async rows => {
      const checks = [], ok = (v, m) => { if (!v) throw new Error(m); checks.push(m); };
      ok(G.AMER1630.length === 70 && rows.every(r => G.AMER1630.includes(r.id)), '게임의 발견물 70종과 제작 목록 일치');
      const loaded = [];
      for (const row of rows) {
        const d = G.DISC[row.id];
        ok(d && G.Img.has('discoveries/' + d.id) && G.Img.has('discovery-ends/' + d.id) && G.Reel.has(d), d.id + ': GIF・끝 장면・시트 연결');
        const L = await G.Reel.load(G.Reel.key(d));
        ok(L && L.cols === 6 && L.cw === 576 && L.ch === 256 && L.n === (row.kind === 'animal' || row.kind === 'ruin' ? 18 : 24), d.id + ': 실제 시트 해독·6열 규격');
        const end = await G.Img.load('discovery-ends/' + d.id);
        ok(end && end.naturalWidth === 576 && end.naturalHeight === 256, d.id + ': 마지막 장면 해독');
        loaded.push(d.id);
      }
      for (const id of ['yosemite', 'cinchona', 'condor', 'copan', 'harvard']) {
        const L = G.Reel.now('discovery-sheets/' + id), cv = document.createElement('canvas');
        cv.width = 576; cv.height = 256; document.body.appendChild(cv);
        const movie = G.Reel.play(cv, L, { ms: 240 });
        const first = cv.toDataURL();
        await movie.done;
        const last = cv.toDataURL();
        ok(first !== last, id + ': 첫 장면에서 마지막 장면까지 재생');
        G.Reel.drawLast(cv, L);
        ok(last === cv.toDataURL(), id + ': 마지막 장면에서 정확히 멈춤');
        cv.remove();
      }
      const prefer = G.PREFER_GIF;
      try {
        G.PREFER_GIF = true;
        ok(rows.every(r => !G.Reel.has(G.DISC[r.id]) && G.Img.isAnim(G.Img.pick(['discoveries/' + r.id]))), '설치형 GIF 팩의 원본 GIF 경로 70종');
      } finally { G.PREFER_GIF = prefer; }
      return { loaded, checks };
    }, rows);
    // 실제 발견 연출은 대표 갈래와 대학 신기루까지 끝 장면·대화·정리를 확인한다.
    await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.State.newGame({ name: '그림 검사', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 },
        st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      G.Game.state.settings.res = .35;
      await G.Game.ensureGeo();
      G.Game.go('sea', { depart: 0 });
      G.Game.scene.update = function () {}; // 검수 중 날짜·날씨 사건이 발견 화면을 덮지 않게 한다.
      G.FX.reveal.playMs = 240; G.FX.reveal.plantPlayMs = 240;
      G.FX.reveal.titleMs = 1200; G.FX.reveal.replayTitleMs = 100;
      window.gifTestLines = [];
      G.UI.say = async text => { window.gifTestLines.push(text); };
    });
    for (const id of ['yosemite', 'cinchona', 'condor', 'copan', 'harvard']) {
      await page.evaluate(id => { G.FX.reveal.titleMs = id === 'copan' ? 7000 : 1200; window.gifRevealDone = false; G.Scenes.discoveryReveal(G.DISC[id], 100).then(v => { window.gifRevealDone = v; }); }, id);
      await page.waitForSelector('.reveal.on.titled', { state: 'visible', timeout: 15000 });
      await page.waitForTimeout(200);
      assert(await page.locator('.reveal .rv-reel').isVisible(), id + ': 발견 그림이 화면에 보임');
      if (id === 'copan') {
        await page.screenshot({ path: path.join(OUT, 'copan-reveal.png'), animations: 'disabled' });
        assert(await page.locator('.reveal.on.titled .rv-reel').isVisible(), '코판 캡처에도 발견 그림이 보임');
      }
      await page.waitForFunction(() => window.gifRevealDone, null, { timeout: 15000 });
      assert.strictEqual(await page.locator('.reveal').count(), 0, id + ': 발견 화면 정리');
      assert(await page.evaluate(() => window.gifTestLines.length > 0), id + ': 발견 대화');
      assert(await page.evaluate(id => G.Scenes.discoveryReplay(G.DISC[id]), id), id + ': 다시 보기');
      assert.strictEqual(await page.locator('.reveal').count(), 0, id + ': 다시 보기 정리');
    }
    assert.deepStrictEqual(errors, [], '브라우저 콘솔 오류');
    fs.writeFileSync(path.join(OUT, 'smoke-report.json'), JSON.stringify({ ...report, errors, revealAndReplay: ['yosemite', 'cinchona', 'condor', 'copan', 'harvard'] }, null, 2));
    console.log('PASS: 70종 file:// 연결·해독, 5종 실제 발견·다시 보기, GIF 팩, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
