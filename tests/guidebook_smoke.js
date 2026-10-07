/* 플레이 가이드북 점검: 타이틀 「조작 안내」 → 가이드북 카드·단추 → 장 넘기기·절 바로가기·그림 크게 보기 (js/ui/guidebook.js)
   node tests/guidebook_smoke.js   (스크린샷: OUT 또는 임시 폴더/guidebook_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'guidebook_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.waitForTimeout(1500);
    const data = await page.evaluate(() => ({ n: G.GUIDEBOOK.chapters.length, imgs: G.GUIDEBOOK.chapters.reduce((a, c) => a + (c.html.match(/data-gk="/g) || []).length, 0), have: G.GUIDEBOOK.chapters.every(c => (c.html.match(/data-gk="([^"]+)"/g) || []).every(m => G.Img.has(m.slice(9, -1)))) }));
    ok(data.n === 11 && data.imgs === 36 && data.have, '가이드북 ' + data.n + '장 · 그림 ' + data.imgs + '장 (모두 manifest에 있음)');

    // ① 조작 안내 창 맨 위 카드와 아래 단추
    await page.click('text=조작 안내');
    await page.waitForSelector('.help-guide', { timeout: 10000 });
    await page.waitForFunction(() => { const i = document.querySelector('.help-guide .hg-pic'); return i && i.naturalWidth > 0; }, null, { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '1_help.png') });
    const help = await page.evaluate(() => ({ card: document.querySelector('.help-guide').innerText, btns: [...document.querySelectorAll('.win .foot button')].map(b => b.innerText.trim()) }));
    ok(/플레이 가이드북 펼치기/.test(help.card) && /그림 36장/.test(help.card) && help.btns.join('|') === '플레이 가이드북|닫기', '조작 안내: 맨 위 카드(「' + help.card.split('\n')[0] + '」) · 단추 ' + help.btns.join(' / '));

    // ② 카드를 누르면 가이드북 — 첫 장, 그림이 실제로 읽힘
    await page.click('.help-guide');
    await page.waitForSelector('.gb-win .gb-page h2', { timeout: 10000 });
    await page.waitForFunction(() => { const i = document.querySelector('.gb-page figure img'); return i && i.naturalWidth > 0; }, null, { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '2_book_c1.png') });
    const c1 = await page.evaluate(() => ({ h: document.querySelector('.gb-page h2').innerText, nav: document.querySelectorAll('.gb-ch').length, on: document.querySelector('.gb-ch.on b').innerText, prevDis: [...document.querySelectorAll('.gb-win .foot button')][0].disabled, table: !!document.querySelector('.gb-page table.gb-table'), wins: document.querySelectorAll('.win').length }));
    ok(c1.h === '환영합니다, 선장님' && c1.nav === 11 && /^1\./.test(c1.on) && c1.prevDis && c1.table, '첫 장 「' + c1.h + '」 · 차례 11장 · 표 · 「이전 장」 막힘');
    ok(c1.wins === 2, '조작 안내 위에 가이드북 창이 겹쳐 열림');

    // ③ 다음 장 · 키보드 · 절 바로가기
    await page.click('.gb-win .foot button:has-text("다음 장")');
    await page.waitForTimeout(400);
    const c2 = await page.evaluate(() => document.querySelector('.gb-page h2').innerText);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300);
    const c3 = await page.evaluate(() => document.querySelector('.gb-page h2').innerText);
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(300);
    const back = await page.evaluate(() => document.querySelector('.gb-page h2').innerText);
    ok(c2 === '시작하기' && c3 === '화면과 조작' && back === '시작하기', '다음 장 단추 → 「' + c2 + '」, → 키 → 「' + c3 + '」, ← 키 → 「' + back + '」');
    // 4장(도시)의 「조합: 수행과 의뢰」 절로 바로
    await page.click('.gb-ch[data-ch="3"] > b'); await page.waitForTimeout(300);
    const secIdx = await page.evaluate(() => [...document.querySelectorAll('.gb-ch.on .gb-sec')].findIndex(e => /조합/.test(e.innerText)));
    await page.click('.gb-ch.on .gb-sec[data-sec="' + secIdx + '"]'); await page.waitForTimeout(600);
    const sec = await page.evaluate(() => { const p = document.querySelector('.gb-page'), h = [...p.querySelectorAll('h3')].find(e => /조합/.test(e.innerText)); return { st: p.scrollTop, top: h.offsetTop, h: h.innerText }; });
    await page.waitForFunction(() => [...document.querySelectorAll('.gb-page figure img')].filter(i => i.getBoundingClientRect().top < 900 && i.getBoundingClientRect().bottom > 0).every(i => i.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '3_book_guild.png') });
    ok(sec.st > 0 && Math.abs(sec.st - (sec.top - 12)) < 40, '차례의 절 「' + sec.h + '」을 누르면 그 자리로 (scrollTop ' + sec.st + ')');

    // ④ 그림 크게 보기
    await page.click('.gb-ch[data-ch="7"] > b'); await page.waitForTimeout(300);
    await page.waitForFunction(() => { const i = document.querySelector('.gb-page figure img'); return i && i.naturalWidth > 0; }, null, { timeout: 15000 });
    await page.click('.gb-page figure img');
    await page.waitForSelector('.gb-zoom img', { timeout: 5000 }); await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '4_zoom.png') });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    const z = await page.evaluate(() => ({ zoom: !!document.querySelector('.gb-zoom'), book: !!document.querySelector('.gb-win') }));
    ok(!z.zoom && z.book, '그림을 누르면 크게, Esc는 크게 보기만 닫고 가이드북은 그대로');

    // ⑤ 닫고 다시 열면 마지막 장
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await page.click('.win .foot button:has-text("플레이 가이드북")'); await page.waitForSelector('.gb-win .gb-page h2');
    const again = await page.evaluate(() => document.querySelector('.gb-page h2').innerText);
    ok(again === '전투', '다시 열면 마지막에 본 장 「' + again + '」');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
