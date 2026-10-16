/* 포카의 에이스 순환 스트레이트 규칙 — node tests/poker_wrap_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      const E = G.Games.evalHand;
      const C = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; };
      const hand = (ranks, oneSuit) => ranks.map((rank, i) => ({ r: rank, s: oneSuit ? 's' : ['s', 'h', 'd', 'c', 's'][i] }));
      const wrap = E(hand([11, 12, 0, 1, 2], false));       // K-A-2-3-4
      const aceLow = E(hand([12, 0, 1, 2, 3], false));     // A-2-3-4-5
      const broadway = E(hand([8, 9, 10, 11, 12], false)); // 10-J-Q-K-A
      const wrapFlush = E(hand([11, 12, 0, 1, 2], true));
      return { wrap, aceLow, broadway, wrapFlush, isWrap: !!wrap.wrap, isWrapFlush: !!wrapFlush.wrap, lowCmp: C(wrap, aceLow), highCmp: C(broadway, aceLow) };
    });
    ok(r.wrap[0] === 4 && r.isWrap, 'K-A-2-3-4를 돌아가는 스트레이트로 판정');
    ok(r.lowCmp < 0 && r.highCmp > 0, '돌아가는 스트레이트 < A-2-3-4-5 < 10-J-Q-K-A 순서');
    ok(r.wrapFlush[0] === 8 && r.isWrapFlush, '같은 무늬면 돌아가는 스트레이트 플러시');
    ok(errors.length === 0, '콘솔 오류 0');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error(errors.join(' | ')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
