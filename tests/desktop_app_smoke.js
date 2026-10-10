/* 설치형 게임 파일(desktop/app — python tools/build_desktop.py가 만든다) 점검
   · 게임이 찾는 그림만 실렸다(빠진 그림 0) · 장면 판이 있는 발견물의 GIF는 빠지고 정지 그림 자리는 마지막 장면이 대신한다
   · 발견 장면은 장면 판(G.Reel)으로 돈다 · 무릎상이 실려 대화에 선다 · 타이틀까지 콘솔 오류 0 · 크기가 설치 파일 한도(2GB) 아래
   node tests/desktop_app_smoke.js   (먼저 python tools/build_desktop.py) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'desktop', 'app');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  if (!fs.existsSync(path.join(APP, 'index.html'))) { console.error('✗ desktop/app 이 없습니다 — python tools/build_desktop.py'); process.exitCode = 1; return; }
  const info = JSON.parse(fs.readFileSync(path.join(ROOT, 'desktop', 'app-info.json'), 'utf8'));
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [], missing = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => { if (r.url().startsWith('file:')) missing.push(r.url()); });
  try {
    await page.goto(pathToFileURL(path.join(APP, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      const files = G.IMAGE_FILES, keys = Object.keys(files);
      const sheets = keys.filter(k => k.startsWith('discovery-sheets/')).map(k => k.slice(17));
      const gifLeft = sheets.filter(id => /\.gif$/i.test(files['discoveries/' + id] || ''));
      const aliased = sheets.filter(id => files['discoveries/' + id] === files['discovery-ends/' + id]).length;
      const d = G.DISC.kremlin || G.DISCOVERIES.find(x => sheets.indexOf(x.id) >= 0);
      const reel = G.Scenes.common && G.Scenes.common.hasReveal ? G.Scenes.common.hasReveal(d) : null;
      const half = G.Img.pick(G.Img.chain.mateHalf('chen'));
      return { n: keys.length, sheets: sheets.length, gifLeft, aliased, disc: d.id, reelHas: G.Reel.has(d), reel, half };
    });
    // 실린 파일이 모두 있는지 (그림 목록의 경로)
    const paths = await page.evaluate(() => [...new Set(Object.values(G.IMAGE_FILES))]);
    const notThere = paths.filter(rel => !fs.existsSync(path.join(APP, 'images', rel)));
    ok(!notThere.length && !missing.length, '그림 목록 ' + r.n + '개의 파일 ' + paths.length + '개가 모두 실렸다 ' + notThere.slice(0, 5).join(','));
    ok(!r.gifLeft.length && r.aliased === r.sheets, '장면 판이 있는 발견물 ' + r.sheets + '곳은 GIF를 빼고 정지 그림 자리를 마지막 장면으로 ' + r.gifLeft.slice(0, 5).join(','));
    ok(r.reelHas, '발견 장면은 장면 판으로 돈다 (' + r.disc + ')');
    ok(/_half$/.test(r.half || ''), '무릎상이 실렸다: ' + r.half);
    ok(info.bytes < 1900e6, '크기 ' + Math.round(info.bytes / 1e6) + 'MB · 파일 ' + info.files + '개 (설치 파일 한도 2GB 아래) · 뺀 그림 ' + info.dropped + '장 ' + Math.round(info.saved / 1e6) + 'MB · 가볍게 한 무릎상 ' + info.halves + '장');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
