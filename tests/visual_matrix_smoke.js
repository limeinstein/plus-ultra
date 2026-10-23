/* 화면 비율·DPR 행렬 시각 회귀 검사.
   제목/버전, 도시 HUD, 정보창의 경계와 가로 넘침을 확인하고 원본 렌더링을 PNG로 남긴다.
   node tests/visual_matrix_smoke.js */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
const EXE = process.env.BROWSER_EXE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = process.env.OUT || path.join(os.tmpdir(), 'plusultra-visual-matrix');
const MATRIX = [
  { name: 'hd', w: 1280, h: 720, dpr: 1 },
  { name: 'base', w: 1600, h: 900, dpr: 1 },
  { name: 'fhd', w: 1920, h: 1080, dpr: 1 },
  { name: 'scaled', w: 1536, h: 864, dpr: 1.25 },
  { name: 'ultrawide', w: 2560, h: 1080, dpr: 1.5 }
];
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const allErrors = [], rows = [];
  try {
    for (const m of MATRIX) {
      const context = await browser.newContext({ viewport: { width: m.w, height: m.h }, deviceScaleFactor: m.dpr });
      const page = await context.newPage(), errors = [];
      await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', x => { if (x.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED|net::/.test(x.text())) errors.push(x.text()); });
      await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
      await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
      await page.screenshot({ path: path.join(OUT, m.name + '-title.png') });
      const title = await page.evaluate(() => {
        const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
        const st = R(document.getElementById('stage')), logo = R(document.querySelector('.title-logo')), menu = R(document.querySelector('.title-menu')), ver = R(document.querySelector('.title-version'));
        return { st, logo, menu, ver, version: document.querySelector('.title-version').textContent.trim(), scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], viewport: [innerWidth, innerHeight] };
      });
      const inside = (r, p) => r.l >= p.l - 1 && r.r <= p.r + 1 && r.t >= p.t - 1 && r.b <= p.b + 1;
      ok(inside(title.logo, title.st) && inside(title.menu, title.st) && inside(title.ver, title.st), `${m.w}×${m.h} DPR ${m.dpr}: 제목·메뉴·버전이 무대 안`);
      ok(/^VERSION \d+\.\d{3}(?: · BETA)?$/.test(title.version) && title.menu.b < title.ver.t, `${m.name}: 소수점 3자리 버전이 메뉴 아래에 분리됨 (${title.version})`);
      ok(title.scroll[0] <= title.viewport[0] + 1 && title.scroll[1] <= title.viewport[1] + 1, `${m.name}: 제목 화면 스크롤 넘침 없음`);

      const city = await page.evaluate(async () => {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        G.UI.say = async () => {}; G.UI.alert = async () => {}; G.UI.toast = () => {};
        G.State.newGame({ name: '화면시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
        G.Game.state.prologueDone = true; G.Game.go('city', { cityId: 0 });
        await new Promise(r => setTimeout(r, 2200));
        G.Info.open('trade'); await new Promise(r => setTimeout(r, 900));
        const st = document.getElementById('stage').getBoundingClientRect(), hud = document.querySelector('.hud'), win = document.querySelector('.modal-back .win').getBoundingClientRect();
        return { hudFit: hud.scrollWidth <= hud.clientWidth + 1, winIn: win.left >= st.left - 1 && win.right <= st.right + 1 && win.top >= st.top - 1 && win.bottom <= st.bottom + 1, scrollW: document.documentElement.scrollWidth, innerW: innerWidth, zoom: G.Game.uiZoom };
      });
      await page.screenshot({ path: path.join(OUT, m.name + '-city.png') });
      ok(city.hudFit && city.winIn && city.scrollW <= city.innerW + 1, `${m.name}: 도시 HUD·정보창 경계와 가로 넘침 정상 (UI ${Math.round(city.zoom * 100)}%)`);
      rows.push({ ...m, version: title.version, zoom: city.zoom });
      allErrors.push(...errors.map(x => m.name + ': ' + x));
      await context.close();
    }
    ok(!allErrors.length, '5개 화면 조합 콘솔 오류 0 ' + allErrors.slice(0, 3).join(' | '));
    console.log(JSON.stringify(rows));
    console.log('  캡처: ' + OUT);
  } catch (e) {
    console.error('✗', e.stack || e.message); console.error(allErrors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
