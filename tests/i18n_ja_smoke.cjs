/* 일본어의 이름·숫자 틀·도시/교역품 전체 표·도움말·설정과 주요 건물 메뉴.
   node tests/i18n_ja_smoke.cjs — file:// 실행, 브라우저는 성공·실패 모두 닫는다. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'artifacts/i18n-ja-20261122');
const hangul = /[가-힣]/;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [], screens = [];
  try {
    const context = await browser.newContext({ locale: 'ja-JP', viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => localStorage.setItem('pu.lang', 'ja'));
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    console.log('일본어 첫 화면 열기');
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game.sceneName === 'title' && document.querySelector('.title-menu .btn:not(.disabled)'), null, { timeout: 120000 });
    await page.locator('#boot-loader').waitFor({ state: 'hidden', timeout: 120000 });
    const values = await page.evaluate(() => ({
      lang: G.I18N.lang, ready: G.I18N.ready('ja'), html: document.documentElement.lang,
      cities: G.CITY_DATA.filter(Boolean).map(c => G.cityName(c)),
      citySource: G.CITY_DATA.filter(Boolean).map(c => [c.id, c.name]),
      goods: G.GOODS.map(g => G.goodName(g.id)),
      goodSource: G.GOODS.map(g => [g.id, g.name]),
      samples: [
        G.I18N.tx('쾨니히스베르크에 처음으로 입항했다.'),
        G.I18N.tx('(지력 70이면 +2)'),
        G.I18N.tx('아직 능력 점수 3점·특기 점수 4점이 남아 있습니다. 남긴 점수는 시작 후 배분할 수 없습니다. 그대로 시작할까요?'),
        G.I18N.tx('교역품 12통 · 2/8종 · 무게 18 / 100'),
        G.I18N.tx('해적선 3호'),
        G.I18N.tx('호위 요청 — 쾨니히스베르크까지 · 상인 마테오'),
        G.T('{city|에} 처음으로 입항했다.', { city: '리스본' })
      ],
      names: ['디오구', '페헤이라', '주앙', '다 시우바', '에스파냐', '조선', '소조', '관선', '안택선'].map(G.N),
      unknown: G.T('아직 번역하지 않은 대사는 원문으로 둡니다.')
    }));
    assert.equal(values.lang, 'ja'); assert.equal(values.html, 'ja'); assert(values.ready);
    fs.writeFileSync(path.join(out, 'ja-data.json'), JSON.stringify(values, null, 2));
    assert(values.cities.length >= 316); assert(values.goods.length >= 163);
    assert(values.cities.every(t => !hangul.test(t))); assert(values.goods.every(t => !hangul.test(t)));
    assert(values.samples.every(t => !hangul.test(t) && !/[⟦⟧]|\\$[1-9]/.test(t)), JSON.stringify(values.samples));
    assert.equal(values.samples[0], 'ケーニヒスベルクに初めて入港した。');
    assert(values.samples[2].includes('3') && values.samples[2].includes('4'));
    assert(values.names.every(t => !hangul.test(t)), JSON.stringify(values.names));
    assert.equal(values.unknown, '아직 번역하지 않은 대사는 원문으로 둡니다.');
    async function dismiss() {
      for (let i = 0; i < 15 && await page.evaluate(() => G.UI.busy()); i++) {
        await page.keyboard.press('Escape'); await page.waitForTimeout(100);
      }
    }
    console.log('일본어 이름·숫자 틀 확인, 조작 안내 열기');
    await page.evaluate(() => { G.Scenes.title.help(); });
    await page.waitForSelector('.win');
    assert(!hangul.test(await page.locator('.win').innerText()), '조작 안내 전체 일본어');
    await page.screenshot({ path: path.join(out, 'ja-help.png') }); await dismiss();
    console.log('일본어 도시 준비');
    await page.evaluate(async () => {
      G.State.newGame({ name: 'ディオゴ', nation: 'PT', job: 'merchant', age: 24, birth: { m: 1, d: 1 },
        st: { str: 60, int: 65, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.settings.res = 0.35; G.Game.state.flags.prologue = true;
      await G.Game.ensureGeo(); G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.city-banner'), null, { timeout: 120000 });
    await dismiss();
    console.log('일본어 설정 열기');
    await page.evaluate(() => { G.Info.settings(); }); await page.waitForSelector('.win [data-as]');
    const settings = (await page.locator('.win').innerText()).replace(/한국어/g, '');
    fs.writeFileSync(path.join(out, 'settings-text.txt'), settings);
    assert(!hangul.test(settings), '설정 문구 전체 일본어: ' + settings.match(/[^\n]*[가-힣][^\n]*/g));
    await page.screenshot({ path: path.join(out, 'ja-settings.png') }); await dismiss();
    for (const kind of ['harbor', 'trade', 'shipyard', 'inn', 'tavern', 'restaurant', 'market', 'church', 'library', 'guild', 'gate', 'home']) {
      const rows = await page.evaluate(kind => {
        const b = G.Scenes.city.B[kind], c = G.CITY_DATA[0];
        if (!b || !b.menu) return null;
        return b.menu(c).filter(Boolean).map(it => ({ ko: it.label, ja: G.I18N.tx(it.label) }));
      }, kind);
      if (!rows) continue;
      assert(rows.every(r => !/[가-힣]/.test(r.ja)), kind + ': ' + JSON.stringify(rows));
      screens.push({ kind, labels: rows.length });
    }
    await page.evaluate(() => { G.Info.open('admiral'); }); await page.waitForSelector('.notebook-win');
    const tabs = await page.locator('.notebook-win .tabs').innerText();
    assert(!hangul.test(tabs), tabs);
    await page.screenshot({ path: path.join(out, 'ja-notebook.png') }); await dismiss();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'ja-runtime.json'), JSON.stringify({ values, screens, errors }, null, 2) + '\n');
    console.log('일본어: 도시 ' + values.cities.length + '·교역품 ' + values.goods.length + '·이름·숫자 틀·도움말·설정·주요 건물·수첩 탭 통과, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
