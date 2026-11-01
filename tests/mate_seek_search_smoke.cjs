/* 여급 수색: 세 글자부터 부분 일치 후보 셋, 현재 인물 필터, 실제 선택·의뢰·취소·한글 조합. */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.MateKnow && G.MatePower && G.Game.sceneName === 'title');
    const checks = await page.evaluate(async () => {
      G.State.newGame({ name: '수색 시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state, MK = G.MateKnow, passed = [];
      s.settings.res = 0.35; s.player.gold = 100000;
      function ok(v, t) { if (!v) throw new Error(t); passed.push(t); }
      function add(id, name, extra) {
        const d = Object.assign({ id: 'seek_test_' + id, name, wd: true, y: [s.date.y, s.date.y], reg: [0] }, extra);
        G.MATES.push(d); G.MATE[d.id] = d; return d;
      }
      const exact = add('exact', '테스트'), prefix = add('prefix', '테스트라'), inner = add('inner', '라테스트');
      const long = add('long', '테스트라우'); add('future', '테스트미래', { y: [s.date.y + 1, 1700] });
      add('past', '테스트과거', { y: [1400, s.date.y - 1] });
      const gone = add('gone', '테스트떠남'); s.flags['gone_' + gone.id] = 1;
      const dead = add('dead', '테스트사망'); (s.mateFate || (s.mateFate = {}))[dead.id] = { kind: 'death' };
      add('power', '테스트왕', { noWander: true }); add('family', '테스트가족', { sib: true });
      ok(MK.suggest('테스').length === 0 && MK.suggest(' 테 스 ').length === 0, '공백을 제외한 두 글자까지 후보를 숨긴다');
      ok(JSON.stringify(MK.suggest('테스트').map(d => d.id)) === JSON.stringify([exact.id, prefix.id, long.id]), '세 글자부터 정확·접두·부분 일치 순으로 최대 세 명');
      ok(MK.suggest('라테스트')[0].id === inner.id, '이름 중간에 포함된 글자로도 찾는다');
      ok(MK.suggest(' 테 스 트 ').length === 3, '공백이 섞여도 같은 이름을 찾는다');
      ok(['미래', '과거', '떠남', '사망', '왕', '가족'].every(n => !MK.suggest('테스트' + n).length), '미등장·시기 종료·떠남·사망·권력자·가족은 제외한다');
      ok(MK.suggest('%테스트').length === 0 && MK.suggest('없는인물').length === 0, '검색 기호를 문자 그대로 읽고 무관한 이름을 채우지 않는다');
      const real = G.MATES.find(d => !d.id.startsWith('seek_test_') && MK.suggest(d.name).some(x => x.id === d.id));
      ok(!!real, '실제 게임 인물도 부분 이름 검색에 나온다');
      // 동명이인도 이름을 다시 조회하지 않고 선택한 ID로 의뢰해야 한다.
      const duplicate = add('duplicate', '테스트라');
      MK.know(duplicate.id, 0, 'met'); G.MateMove.locs(); s.mateLoc[duplicate.id] = 0;
      window.__seekTarget = duplicate.id; window.__seekGold = s.player.gold;
      window.__seekMaid = G.MAIDS.find(m => m.city === 0);
      G.UI.confirm = async () => true;
      window.__seekSaid = [];
      window.__startSeek = () => {
        window.__seekDone = false;
        MK.seek(G.CITY_DATA[0], window.__seekMaid, { aff: 80, met: 5 }, async t => { window.__seekSaid.push(t); })
          .then(() => { window.__seekDone = true; });
      };
      await G.Loader.hide(); window.__startSeek();
      return passed;
    });
    const input = page.locator('.mk-seek-name');
    await input.fill('테스'); assert.strictEqual(await page.locator('.mk-seek-hits button').count(), 0);
    await input.fill('테스트'); assert.strictEqual(await page.locator('.mk-seek-hits button').count(), 3);
    await input.fill('없는인물'); assert.match(await page.locator('.mk-seek-hint').innerText(), /일치하는 인물이 없습니다/);
    await input.fill('테스트라');
    assert.strictEqual(await page.locator('.mk-seek-hits button').count(), 3);
    assert(await page.evaluate(() => !G.MateKnow.seekOf(window.__seekMaid.id) && G.Game.state.player.gold === window.__seekGold));
    const chosen = page.locator('.mk-seek-hits button').filter({ hasText: '인연 있는 항해사' });
    await chosen.focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__seekDone);
    const request = await page.evaluate(() => ({ q: G.MateKnow.seekOf(window.__seekMaid.id), target: window.__seekTarget,
      paid: window.__seekGold - G.Game.state.player.gold }));
    assert.strictEqual(request.q.id, request.target); assert.strictEqual(request.paid, request.q.fee); assert(request.paid > 0);
    checks.push('한글 이름 입력·후보 갱신·동명이인 키보드 선택 후 올바른 ID로 의뢰하고 사례금을 한 번 낸다');
    await page.evaluate(() => { window.__pickDone = false; G.MateKnow.promptSeek().then(r => { window.__pickResult = r; window.__pickDone = true; }); });
    await input.fill('테스트');
    await input.dispatchEvent('compositionstart');
    await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true });
    assert.strictEqual(await page.evaluate(() => window.__pickDone), false);
    await input.dispatchEvent('compositionend');
    if (process.env.OUT) {
      fs.mkdirSync(process.env.OUT, { recursive: true });
      await page.screenshot({ path: path.join(process.env.OUT, 'mate-seek-search.png') });
    }
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__pickDone);
    assert.strictEqual(await page.evaluate(() => window.__pickResult), null);
    checks.push('한글 조합 확정 Enter는 선택하지 않고, Esc로 수색창을 취소한다');
    await page.evaluate(() => { G.MateKnow.promptSeek().then(r => { window.__shortResult = r; }); });
    await input.fill('이순'); await page.keyboard.press('Enter');
    await page.waitForFunction(() => !!window.__shortResult);
    assert.strictEqual(await page.evaluate(() => window.__shortResult.name), '이순');
    checks.push('두 글자 이름의 직접 입력 경로도 유지한다');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    checks.forEach(t => console.log('  ✓ ' + t)); console.log('  ✓ 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
