/* 제독 만들기 — 지력의 지식 보너스 (js/scenes/create.js knowPoints · G.BALANCE.create)
   지력 40부터 15마다 +1, 최대 +3 · 지력 99~100이면 +4. 만들기 화면에서 지력을 올려 보며 특기 점수·안내 글을 확인한다.
   node tests/know_bonus_smoke.js  (BROWSER_EXE=크로미움 경로 · OUT=스크린샷 폴더) */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PAGE = process.env.PAGE ? pathToFileURL(path.resolve(process.env.PAGE)).href : pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUT = process.env.OUT || path.join(ROOT, 'tmp', 'know_bonus');
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED|_blob/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(PAGE);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    // ① 지력별 지식 보너스
    const tbl = await page.evaluate(() => [39, 40, 54, 55, 69, 70, 84, 85, 98, 99, 100].map(v => [v, G.Scenes.create.bonus(30, v).know]));
    const want = { 39: 0, 40: 0, 54: 0, 55: 1, 69: 1, 70: 2, 84: 2, 85: 3, 98: 3, 99: 4, 100: 4 };
    ok(tbl.every(([v, k]) => want[v] === k), '지식 보너스: ' + tbl.map(([v, k]) => v + '→+' + k).join(' · '));
    // ② 만들기 화면: 나이 40세 → 지력에 능력 보너스를 몰아 준다 (지력이 99에 닿을 때까지 처음 능력치를 다시 굴린다)
    await page.evaluate(() => { G.Game.go('create'); });
    await page.waitForFunction(() => G.Game.sceneName === 'create' && !!document.querySelector('#age'), null, { timeout: 30000 });
    async function hint() { return page.evaluate(() => (document.querySelector('.cr-bonus') || {}).innerText || ''); }
    async function intel() { return page.evaluate(() => { const r = [...document.querySelectorAll('.cr-stat')].find(x => /지력/.test(x.innerText)); return parseInt(r.querySelector('b').innerText, 10); }); }
    await page.evaluate(() => { const a = document.querySelector('#age'); a.value = 40; a.dispatchEvent(new Event('input', { bubbles: true })); a.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.waitForTimeout(300);
    // 직업: 고고학자(지력 +6)
    await page.evaluate(() => { const j = document.querySelector('[data-g="job"][data-v="digger"]'); if (j) j.click(); });
    let seen = {}, i0 = await intel();
    for (let tries = 0; tries < 60; tries++) {
      for (let k = 0; k < 20; k++) { await page.evaluate(() => { const b = document.querySelector('[data-st="int"][data-d="1"]'); if (b) b.click(); }); }
      const v = await intel(), h = await hint();
      seen[v] = h;
      if (v >= 99) break;
      // 다시 굴린다: 나이를 바꿨다 되돌리면 능력치를 새로 굴린다
      await page.evaluate(() => { const j = document.querySelector('[data-g="job"][data-v="digger"]'); if (j) j.click(); });   // 직업을 다시 고르면 능력치를 새로 굴린다
      await page.waitForTimeout(50);
    }
    const top = Math.max(...Object.keys(seen).map(Number));
    console.log('    만들기 화면에서 본 지력: ' + Object.keys(seen).sort((a, b) => a - b).join(', '));
    ok(top >= 99 && /특기 점수 \+4/.test(seen[top]) && !/이면 \+/.test(seen[top]), '지력 ' + top + ' — 「' + seen[top].split('\n').pop() + '」');
    await page.screenshot({ path: path.join(OUT, 'create_int99.png') });
    // 지력을 하나 내리면 +3과 「지력 99이면 +4」 안내
    await page.evaluate(() => { document.querySelector('[data-st="int"][data-d="-1"]').click(); });
    await page.waitForTimeout(100);
    const h98 = await hint(), v98 = await intel();
    ok(v98 === top - 1 && /특기 점수 \+3/.test(h98) && /지력 99이면 \+4/.test(h98), '지력 ' + v98 + ' — 「' + h98.split('\n').pop() + '」');
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 4).join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  await browser.close();
})();
