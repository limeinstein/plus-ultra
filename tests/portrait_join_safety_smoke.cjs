/* 얼굴을 붙인 옛 몸통 제외, 역사 화자의 정확한 한 쌍, 로딩 대체·원본 한 장 표시. */
'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/portrait-join-20261106');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { const raf = requestAnimationFrame.bind(window); requestAnimationFrame = cb => window.__pauseFrames ? 0 : raf(cb); });
    await page.goto((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Hist && G.Game.sceneName === 'title' && !G.Loader.shown(), null, { timeout: 120000 });
    const audit = await page.evaluate(async () => {
      window.__pauseFrames = true;
      const s = G.Game.state = G.State.newGame({ name: '인물 검수', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.date = { y: 1696, m: 4, d: 1 }; s.player.born = { y: 1671, m: 1, d: 1 }; s.loc = { mode: 'city', city: 42 }; s.settings.res = .35; s.settings.autosave = false;
      s.player.portrait = G.Art.withImg(G.Art.portraitSpec({ seed: 'join-check', culture: 'med', g: 'm', age: 'young' }), ['portraits/player/admiral']);
      G.UI.clearScreen(); G.Game.showLayers(false, false, true); G.Game.refreshHud();
      const reject = Object.keys(G.PORTRAIT_REJECTED_HALVES), bad = [], hist = [];
      reject.forEach(k => { if (G.Img.has(k) || G.Img.pick([k]) || !G.Img.has(k.slice(0, -5))) bad.push(k); });
      const preservedPools = G.Img.list('portraits/pools/mates/').filter(k => /^portraits\/pools\/mates\/(pt|cn)\/.+_half$/.test(k) && G.Img.has(k)).length;
      Object.keys(G.HIST_FIG).forEach(id => {
        const sp = G.Hist.speaker(id), face = sp.portrait && G.Img.pick(G.Art.portraitKeys(sp.portrait)), half = G.Img.pick(sp.half);
        if (face && half && half !== face + '_half') bad.push(id + ':' + face + ' / ' + half);
        hist.push({ id, face, half });
      });
      const paterson = G.Hist.speaker('cw_paterson');
      const face = G.Img.pick(G.Art.portraitKeys(paterson.portrait)), key = face + '_half';
      const file = G.IMAGE_FILES[key]; delete G.IMAGE_FILES[key]; G.Img.reset();
      const missing = G.Hist.speaker('cw_paterson');
      const missingHalf = G.Img.pick(missing.half);
      G.IMAGE_FILES[key] = file; G.Img.reset();
      window.__joinShow = mode => {
        let who = G.Hist.speaker('cw_paterson');
        if (mode === 'legacy') {
          const key = 'portraits/pools/sponsors/nl/m/01';
          who = { name: '옛 후원자', portrait: G.Art.withImg(G.Art.npcSpec('join-legacy', 'merchant', 'ne', 'm'), [key]), half: [key + '_half', 'portraits/history/cw_paterson_half'] };
        }
        if (mode === 'maid') {
          const key = 'maid-styles/china/1';
          who = { name: '시녀', portrait: G.Art.withImg(G.Art.npcSpec('join-maid', 'maid', 'cn', 'f'), [key]), half: [key + '_half', 'portraits/history/cw_paterson_half'] };
        }
        if (mode === 'face') who.noHalf = true;
        window.__joinPending = G.UI.ask('스코틀랜드 회사에 출자할까?', [{ label: '닫기', value: null }], who);
      };
      return { rejected: reject.length, preservedPools, bad, hist, missingHalf };
    });
    assert(audit.rejected > 0); assert.equal(audit.preservedPools, 40, '검수·교체 완료한 묶음 무릎상 40장 유지'); assert.deepEqual(audit.bad, []); assert.equal(audit.missingHalf, null, '전용 무릎상 누락 때 다른 사람 몸으로 대체하지 않음');
    for (const mode of ['normal', 'legacy', 'maid', 'face']) {
      await page.evaluate(mode => { window.__joinShow(mode); }, mode);
      await page.waitForFunction(() => document.querySelectorAll('.dlg-actor .rig-fallback').length === 2 && [...document.querySelectorAll('.dlg-actor .rig-fallback')].every(im => im.complete && im.naturalWidth > 0), null, { polling: 100 });
      const actual = await page.evaluate(() => ({ tall: document.querySelectorAll('.dlg-actor.tall').length, bust: document.querySelectorAll('.dlg-actor.bust').length,
        sources: [...document.querySelectorAll('.dlg-actor .rig-fallback')].map(im => decodeURIComponent(im.src)),
        pieces: document.querySelectorAll('.dlg-actor .rig-piece, .dlg-actor .rig-facefx').length }));
      assert.equal(actual.pieces, 0);
      const restored = mode === 'normal' || mode === 'maid';
      assert.equal(actual.tall, restored ? 2 : 0); assert.equal(actual.bust, restored ? 0 : 2);
      if (mode === 'normal') assert(actual.sources.some(src => /cw_paterson_half\.webp/.test(src)));
      if (mode === 'legacy') { assert(actual.sources.some(src => /sponsors\/nl\/m\/01\.webp/.test(src))); assert(!actual.sources.some(src => /cw_paterson/.test(src))); }
      if (mode === 'maid') assert(actual.sources.some(src => /maid-styles\/china\/1_half\.webp/.test(src)));
      await page.screenshot({ path: path.join(OUT, mode + '.png') });
      await page.locator('.askrow button').last().click();
      await page.evaluate(() => window.__joinPending);
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'runtime.json'), JSON.stringify({ ...audit, errors }, null, 2));
    console.log(`역사 화자 ${audit.hist.length}명 짝 검사, 합성 무릎상 ${audit.rejected}장 제외, 정상·옛 합성본·얼굴 대체 화면 통과, 콘솔 오류 0`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
