/* 건물 메뉴 긴 설명 도움말 — node tests/cmdmenu_tooltip_smoke.js
   긴 설명은 고정 높이 버튼 밖의 도움말로, 짧은 상태·숫자는 버튼 안에 표시한다. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FILE|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.UI && G.UI.cmdMenu, null, { timeout: 90000 });
    const result = await page.evaluate(() => {
      const long = '자녀 2 · 아기를 기다리는 중';
      const menu = G.UI.cmdMenu('자택', '', [
        { label: '가족', sub: long },
        { label: '보관함', sub: '저장 가능' },
        { label: '금고', sub: '12,623,387닢' }
      ]);
      const buttons = Array.from(menu.querySelectorAll('.cmd'));
      const heights = buttons.map(x => Math.round(x.getBoundingClientRect().height));
      const first = buttons[0];
      first.classList.add('kbd-focus');
      return {
        heights,
        longTip: first.classList.contains('has-tip') && first.dataset.tip === long,
        longInline: !!first.querySelector('.sub'),
        aria: first.getAttribute('aria-label'),
        shortInline: buttons[1].querySelector('.sub')?.textContent,
        numberInline: buttons[2].querySelector('.sub')?.textContent,
        pseudo: getComputedStyle(first, '::after').content
      };
    });
    ok(new Set(result.heights).size === 1, '긴 설명이 있어도 메뉴 버튼 높이가 모두 같다 ' + JSON.stringify(result.heights));
    ok(result.longTip && !result.longInline, '긴 설명을 버튼 밖 도움말 데이터로 분리한다');
    ok(result.aria && result.aria.includes('아기를 기다리는 중'), '긴 설명을 키보드·보조기기 이름에도 남긴다');
    ok(result.shortInline === '저장 가능' && result.numberInline === '12,623,387닢', '짧은 상태와 긴 숫자는 버튼 안에 유지한다');
    ok(result.pseudo && result.pseudo.includes('아기를 기다리는 중'), '키보드 선택에서도 도움말을 표시한다');
    ok(!errors.length, '콘솔 오류 0');
    console.log('\n건물 메뉴 도움말 점검 통과');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
