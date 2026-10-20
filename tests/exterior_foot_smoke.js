/* 거리 건물이 떠 보이지 않게 (2026-10-20) — js/scenes/town.js trimFoot · js/data/exteriorfoot.js (tools/exterior_foot.py)
   아가데스(천막 고장)의 교역소·술집·여관 그림은 아래에 그림 높이의 23~25% 빈칸이 있어, 바닥선에 맞추면 건물이 공중에 떠 보였다.
   · 표: 천막 교역소·술집·여관이 표에 있다
   · 아가데스 · 콰줄루(크랄) · 키투와(숲) · 리스본: 거리의 모든 건물 그림 아래 빈칸이 그림 높이의 3% 이하 (바닥선에 붙는다) · 콘솔 오류 0
   node tests/exterior_foot_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const tbl = await page.evaluate(() => ['trade', 'tavern', 'inn'].map(k => G.EXT_FOOT && G.EXT_FOOT['exterior-styles/tent/' + k]));
    ok(tbl.every(v => v > 0.2), '표: 천막 교역소·술집·여관 아래 빈칸 ' + tbl.join(' · '));
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    await page.waitForTimeout(2000);
    for (let i = 0; i < 30 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(400); }
    for (const [cid, nm] of [[306, '아가데스'], [298, '콰줄루'], [231, '키투와'], [0, '리스본']]) {
      await page.evaluate(c => { const s = G.Game.state; s.date = { y: 1500, m: 3, d: 1 }; s.loc = { mode: 'city', city: c }; if (s.known.indexOf(c) < 0) s.known.push(c); G.Game.go('city', { city: c }); }, cid);
      await page.waitForFunction(c => G.Game.sceneName === 'city' && G.Town.active() && G.Town.city() && G.Town.city().id === c, cid, { timeout: 60000 });
      await page.waitForTimeout(1500);
      for (let i = 0; i < 30 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(400); }
      const r = await page.evaluate(() => {
        const st = G.Town.runtime(), out = [];
        (st.items || []).forEach(it => {
          try {
            const cv = it.cv, w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data;
            let y = h - 1; for (; y > h * 0.4; y--) { let n = 0; for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 128) n++; if (n >= Math.max(2, w * 0.04 / 2)) break; }
            out.push([it.kind, +((h - 1 - y) / h).toFixed(3)]);
          } catch (e) { out.push([it.kind, 'unreadable']); }
        });
        return out;
      });
      const bad = r.filter(x => typeof x[1] === 'number' && x[1] > 0.03);
      console.log('   ' + nm + ': ' + r.map(x => x[0] + ' ' + x[1]).join(' · '));
      ok(r.length && !bad.length && r.some(x => typeof x[1] === 'number'), nm + ': 건물 ' + r.length + '채 모두 바닥선에 붙었다 (아래 빈칸 3% 이하) ' + bad.map(x => x.join(' ')).join(', '));
    }
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
