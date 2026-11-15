/* 한국어 글꼴 선택 (2026-11-15): 실제 설정 창의 누르기·언어 전환·재실행·저장공간 부족·저장 복구.
   node tests/display_font_smoke.cjs (BROWSER_EXE로 Chromium 경로 지정) */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let pw; try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(ROOT, 'artifacts/font-selection-20261115');
const FONTS = { nanum: 'Nanum Myeongjo', notoserif: 'Noto Serif KR', gowun: 'Gowun Batang', nanumgothic: 'Nanum Gothic', notosans: 'Noto Sans KR' };
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  let browser;
  const errors = [], records = [];
  try {
    browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
      args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      if (!localStorage.getItem('pu.lang')) localStorage.setItem('pu.lang', 'ko');
      if (!localStorage.getItem('pu.font')) localStorage.setItem('pu.font', 'auto');
      window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : setTimeout(() => cb(performance.now()), 16);
      window.cancelAnimationFrame = clearTimeout;
    });
    const url = (process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href);
    async function ready() {
      await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !document.querySelector('#boot-loader.on'), null, { polling: 100, timeout: 120000 });
      await page.getByRole('button', { name: '화면 · 글꼴', exact: true }).click();
    }
    async function selected(id) {
      const r = await page.evaluate(() => ({ pref: G.Display.fontPref(), now: G.Display.fontNow().id,
        on: [...document.querySelectorAll('[data-dfont].on')].map(x => x.dataset.dfont),
        sample: getComputedStyle(document.querySelector('.dlg-sample')).fontFamily,
        stored: localStorage.getItem('pu.font'), mem: (G.Display._mem || {})['pu.font'] }));
      assert.equal(r.pref, id); assert.deepEqual(r.on, [id]);
      if (FONTS[id]) { assert.equal(r.now, id); assert.ok(r.sample.includes(FONTS[id]), r.sample); }
      records.push(r); return r;
    }
    async function pick(id) {
      const option = page.locator('[data-dfont="' + id + '"]');
      const span = option.locator('span');
      await (await span.count() ? span : option).click();
      return selected(id);
    }
    await page.goto(url, { waitUntil: 'load', timeout: 120000 }); await ready();
    for (const id of Object.keys(FONTS)) await pick(id);
    await pick('auto');
    console.log('통과: 한국어 글꼴 5종·DEFAULT의 선택 표시와 실제 본문 글꼴');
    await pick('nanumgothic');
    await page.reload({ waitUntil: 'load' }); await ready(); await selected('nanumgothic');
    await page.locator('[data-dlang="en"]').click();
    assert.equal(await page.locator('[data-dfont]').count(), 0);
    await page.locator('[data-dlang="ko"]').click();
    await selected('nanumgothic'); await pick('gowun');
    console.log('통과: 재실행과 English → 한국어 전환 뒤 글꼴 유지·다시 선택');
    await pick('auto');
    const quota = await page.evaluate(() => {
      let low = 0, high = 6 * 1024 * 1024;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        try { localStorage.setItem('qa.font.fill', 'x'.repeat(mid)); low = mid; } catch (_) { high = mid - 1; }
      }
      try { localStorage.setItem('pu.font', 'nanum'); return null; } catch (e) { return e.name; }
    });
    assert.equal(quota, 'QuotaExceededError');
    for (const id of Object.keys(FONTS)) { const r = await pick(id); assert.equal(r.stored, 'auto'); assert.equal(r.mem, id); }
    await page.screenshot({ path: path.join(OUT, 'quota-fixed.png') });
    console.log('통과: 실제 localStorage가 가득 차도 글꼴 5종 즉시 적용');
    await page.evaluate(() => localStorage.removeItem('qa.font.fill'));
    const recovered = await pick('gowun'); assert.equal(recovered.stored, 'gowun'); assert.equal(recovered.mem, undefined);
    await page.reload({ waitUntil: 'load' }); await ready(); await selected('gowun');
    console.log('통과: 저장공간 확보 뒤 새 글꼴 저장·재실행 유지');
    const blocked = await page.evaluate(() => {
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = () => { throw new DOMException('차단', 'SecurityError'); };
      Storage.prototype.setItem = () => { throw new DOMException('차단', 'SecurityError'); };
      try { document.querySelector('[data-dfont="notosans"] span').click(); return { pref: G.Display.fontPref(), now: G.Display.fontNow().id, selected: document.querySelector('[data-dfont].on').dataset.dfont }; }
      finally { Storage.prototype.getItem = get; Storage.prototype.setItem = set; }
    });
    assert.deepEqual(blocked, { pref: 'notosans', now: 'notosans', selected: 'notosans' });
    console.log('통과: 저장소 읽기·쓰기 모두 차단되어도 이번 실행의 선택 적용');
    await page.screenshot({ path: path.join(OUT, 'korean-font-fixed.png') });
    assert.deepEqual(errors, []); console.log('통과: pageerror·console.error 0건');
  } finally {
    fs.writeFileSync(path.join(OUT, 'verification.json'), JSON.stringify({ records, errors }, null, 2));
    if (browser) await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
