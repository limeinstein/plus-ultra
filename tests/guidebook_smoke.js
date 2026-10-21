/* 플레이 가이드북 (js/ui/guidebook.js · 원고 docs/guidebook.md → js/data/guidebook.js) 2026-10-21
   ① 타이틀 「조작 안내」 → 「플레이 가이드북」으로 열린다 ② 쪽마다(절 하나 = 한 쪽) 넘겨 보며: 그림이 모두 읽히는가(숨겨진 그림 0) ·
   그림과 번호 표가 나란히(gb-duo) · 번호 동그라미 ③ ←→ 키로 쪽 넘기기 · 차례의 쪽을 누르면 그 쪽 ④ 마지막에 본 쪽을 기억 ⑤ 콘솔 오류 0
   node tests/guidebook_smoke.js   (OUT=스크린샷 폴더 — 몇 쪽을 찍는다) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'guidebook_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Guidebook && G.GUIDEBOOK, null, { timeout: 120000 });
    await page.evaluate(() => { try { localStorage.removeItem('plusultra_guide_pg'); } catch (e) {} });
    // ① 조작 안내 → 플레이 가이드북
    await page.evaluate(() => { const b = [...document.querySelectorAll('.btn')].find(e => /^조작 안내$/.test(e.innerText.trim())); b.click(); });
    await sleep(800);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.btn')].find(e => /플레이 가이드북/.test(e.innerText)); b.click(); });
    await page.waitForSelector('.gb-win .gb-page', { timeout: 10000 });
    const info = await page.evaluate(() => ({ n: G.Guidebook.pages().length, ch: G.GUIDEBOOK.chapters.length }));
    ok(info.n >= 30 && info.ch >= 8, '가이드북 열림 — ' + info.ch + '장 · ' + info.n + '쪽');
    // ② 쪽마다
    const rows = [], shots = { 0: 'title', 1: 'create', 4: 'city', 9: 'tavern', 30: 'sea' };
    for (let i = 0; i < info.n; i++) {
      await page.evaluate((i) => G.Guidebook._show(i), i);
      await page.waitForFunction(() => !document.querySelector('.gb-page figure.wait'), null, { timeout: 30000 }).catch(() => {});
      await sleep(150);
      const r = await page.evaluate(() => {
        const pg = document.querySelector('.gb-page'), figs = [...pg.querySelectorAll('figure.gb-fig')];
        return { kick: pg.querySelector('.gb-kicker').innerText.replace(/\s+/g, ' '), figs: figs.length, hidden: figs.filter(f => f.style.display === 'none').map(f => f.querySelector('img').getAttribute('data-gk')),
          loaded: figs.filter(f => { const im = f.querySelector('img'); return im.complete && im.naturalWidth > 0; }).length, duo: pg.querySelectorAll('.gb-duo').length, circles: pg.querySelectorAll('.gb-legend td:first-child span').length,
          over: Math.max(0, pg.scrollHeight - pg.clientHeight) };
      });
      rows.push(r);
      if (shots[i] || (r.figs && i % 9 === 0)) await page.screenshot({ path: path.join(OUT, 'gb_' + String(i).padStart(2, '0') + '_' + (shots[i] || 'p') + '.png') });
    }
    rows.forEach((r, i) => console.log('   ' + String(i + 1).padStart(2) + ' ' + r.kick.slice(0, 44).padEnd(44) + ' 그림 ' + r.loaded + '/' + r.figs + ' · 나란히 ' + r.duo + ' · 번호 ' + r.circles + (r.over ? ' · 넘침 ' + r.over + 'px' : '')));
    const hidden = rows.flatMap(r => r.hidden);
    ok(!hidden.length && rows.every(r => r.loaded === r.figs), '모든 쪽의 그림이 읽힌다 (' + rows.reduce((a, r) => a + r.figs, 0) + '장) ' + hidden.join(','));
    ok(rows.filter(r => r.duo).length >= 25, '그림 + 번호 표가 나란히인 쪽 ' + rows.filter(r => r.duo).length);
    // ③ 키로 넘기기 · 차례
    await page.evaluate(() => G.Guidebook._show(3));
    await page.keyboard.press('ArrowRight'); await sleep(200);
    const k1 = await page.evaluate(() => document.querySelector('.gb-page .gb-kicker span').innerText);
    await page.keyboard.press('ArrowLeft'); await sleep(200);
    const k2 = await page.evaluate(() => document.querySelector('.gb-page .gb-kicker span').innerText);
    ok(/^5 \//.test(k1) && /^4 \//.test(k2), '← → 로 쪽 넘기기 (' + k1 + ' → ' + k2 + ')');
    const toc = await page.evaluate(() => { const e = [...document.querySelectorAll('.gb-sec, .gb-ch > b')].find(x => /해도 \(M\)/.test(x.innerText)); if (e) e.click(); return document.querySelector('.gb-page h3') ? document.querySelector('.gb-page h3').innerText : ''; });
    ok(/해도/.test(toc), '차례에서 쪽을 누르면 그 쪽 (' + toc + ')');
    const kept = await page.evaluate(() => { try { return localStorage.getItem('plusultra_guide_pg'); } catch (e) { return 'x'; } });
    ok(kept != null, '마지막에 본 쪽을 기억 (' + kept + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
