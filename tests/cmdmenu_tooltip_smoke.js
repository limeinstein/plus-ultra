/* 건물 메뉴 긴 설명 도움말 — node tests/cmdmenu_tooltip_smoke.js
   긴 설명은 고정 높이 버튼 밖의 도움말로, 짧은 상태·숫자는 버튼 안에 표시한다.
   풍선은 메뉴마다 하나(.cmd-tip)이고, 메뉴를 막 열었을 때(첫 항목의 키보드 표시)는 뜨지 않으며 마우스·방향키로 고를 때 뜬다.
   실제 건물 메뉴는 tests/cmdmenu_buildings_smoke.js 가 본다. */
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
        { label: '금고', sub: '12,623,387닢' },
        { label: '보급', sub: '20·20일 · 자재 10' },
        { label: '보관함', sub: '맡긴 물건 0점 · 소지품 2/40' },
        { label: '선원을 모은다', sub: '16명 / 8~36' },
        { label: '정보를 듣는다', sub: '계약한 일이 없다', dim: true }
      ]);
      const tipEl = () => [...menu.querySelectorAll('.cmd-tip')].filter(t => getComputedStyle(t).display !== 'none');
      const buttons = Array.from(menu.querySelectorAll('.cmd'));
      const heights = buttons.map(x => Math.round(x.getBoundingClientRect().height));
      const first = buttons[0];
      const autoFocus = first.classList.contains('kbd-focus'), tipsAtOpen = tipEl().length + buttons.filter(b => !/^(none|normal)$/.test(getComputedStyle(b, '::after').content)).length;
      first.dispatchEvent(new MouseEvent('mouseenter'));
      const hovered = tipEl().map(t => t.textContent);
      buttons[1].dispatchEvent(new MouseEvent('mouseenter'));
      const moved = tipEl().length;
      buttons[6].dispatchEvent(new MouseEvent('mouseenter'));
      const dimTip = tipEl()[0], dimOp = dimTip ? +getComputedStyle(dimTip).opacity * +getComputedStyle(menu).opacity : 0;
      menu.dispatchEvent(new MouseEvent('mouseleave'));
      const left = tipEl().length;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', code: 'ArrowUp', bubbles: true }));
      const keyTip = tipEl().map(t => t.textContent);
      return {
        autoFocus, tipsAtOpen, hovered, moved, dimOp, left, keyTip,
        statusInline: buttons.slice(3, 6).map(b => b.querySelector('.sub') && b.querySelector('.sub').textContent),
        over: buttons.filter(b => b.scrollWidth > b.clientWidth + 1 || [...b.children].some(c => c.scrollWidth > c.clientWidth + 1 && c.clientWidth > 0)).map(b => b.textContent),
        heights,
        longTip: first.classList.contains('has-tip') && first.dataset.tip === long,
        longInline: !!first.querySelector('.sub'),
        aria: first.getAttribute('aria-label'),
        shortInline: buttons[1].querySelector('.sub')?.textContent,
        numberInline: buttons[2].querySelector('.sub')?.textContent,
      };
    });
    ok(new Set(result.heights).size === 1, '긴 설명이 있어도 메뉴 버튼 높이가 모두 같다 ' + JSON.stringify(result.heights));
    ok(result.longTip && !result.longInline, '긴 설명을 버튼 밖 도움말 데이터로 분리한다');
    ok(result.aria && result.aria.includes('아기를 기다리는 중'), '긴 설명을 키보드·보조기기 이름에도 남긴다');
    ok(result.shortInline === '저장 가능' && result.numberInline === '12,623,387닢', '짧은 상태와 긴 숫자는 버튼 안에 유지한다');
    ok(result.statusInline.join('|') === '20·20일 · 자재 10|맡긴 물건 0점 · 소지품 2/40|16명 / 8~36', '숫자가 든 짧은 상태도 버튼 안에 둔다 ' + JSON.stringify(result.statusInline));
    ok(!result.over.length, '버튼 글이 넘치지 않는다 ' + JSON.stringify(result.over));
    ok(result.autoFocus && result.tipsAtOpen === 0, '메뉴를 막 열었을 때(첫 항목 키보드 표시)는 풍선이 없다');
    ok(result.hovered.length === 1 && result.hovered[0] === '자녀 2 · 아기를 기다리는 중', '마우스를 올리면 풍선 하나');
    ok(result.moved === 0, '설명 없는 버튼으로 옮기면 풍선이 사라진다');
    ok(result.dimOp > 0.99, '흐린 항목의 풍선도 또렷하다');
    ok(result.left === 0, '메뉴 밖으로 나가면 풍선이 사라진다');
    ok(result.keyTip.length === 1 && result.keyTip[0].includes('아기를 기다리는 중'), '방향키로 고르면 도움말을 표시한다');
    ok(!errors.length, '콘솔 오류 0');
    console.log('\n건물 메뉴 도움말 점검 통과');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
