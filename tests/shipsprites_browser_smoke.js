/* 실제 index.html에서 8방향 키 조타와 동작 시트 읽기를 확인한다.
   실행: NODE_PATH=<playwright의 node_modules> node tests/shipsprites_browser_smoke.js */
const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tmp', 'shipsprites-sea-smoke.png');
const executablePath = process.env.CHROME_PATH || (process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);

(async () => {
  const browser = await chromium.launch({ executablePath, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.State && G.Img && G.Img.count() > 0, null, { timeout: 90000 });
  await page.evaluate(() => G.Game.ensureGeo());
  await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 90000 });
  await page.evaluate(() => {
    const lg = G.LANGS.map(() => 0), sk = {};
    G.SKILLS.forEach(x => { sk[x.id] = 0; }); sk.nav = 2; sk.survey = 2;
    const s = G.State.newGame({ name: '그림 시험', nation: 'PT', job: 'explorer', age: 22,
      birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg, diff: 'normal' });
    s.settings.res = 0.5;
    s.fleet.ships[0].type = 'galleon';
    G.Game.state = s;
    G.Game.go('sea', { depart: 0, fresh: true });
  });
  await page.waitForFunction(() => G.Game.scene === G.Scenes.sea && G.Scenes.sea.runtime(), null, { timeout: 30000 });
  await page.evaluate(() => G.ShipSprite.preload(['galleon'], 30000));
  await page.waitForFunction(() => G.ShipSprite.status('galleon') === 'ok', null, { timeout: 30000 });
  const rows = await page.evaluate(() => {
    function sourceCell(spec) {
      const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
      cv.width = cv.height = 240; let source = [-1, -1];
      const draw = ctx.drawImage.bind(ctx);
      ctx.drawImage = function () { source = [arguments[1], arguments[2]]; return draw.apply(null, arguments); };
      spec.type = 'galleon'; spec.noWake = true;
      G.ShipSprite.draw(ctx, 120, 150, Math.PI / 4, 120, spec, 0.2);
      return source;
    }
    return { idle: sourceCell({ furl: 1 }), drift: sourceCell({ motion: 'drift' }), dash: sourceCell({ motion: 'dash' }) };
  });

  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(6500);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const st = G.Scenes.sea.runtime(), a = st.dirCrs;
    return { status: G.ShipSprite.status('galleon'), heading: G.Game.state.loc.heading,
      course: a, diagonal: a != null && Math.abs(G.U.angDiff(a, Math.PI / 4)) < 0.35 };
  });
  await page.screenshot({ path: OUT });
  await browser.close();
  if (errors.length) throw new Error(errors.join('\n'));
  if (String(rows.idle) !== '0,224' || String(rows.drift) !== '672,224' || String(rows.dash) !== '448,2016') throw new Error('동작 칸 연결 실패: ' + JSON.stringify(rows));
  if (result.status !== 'ok' || !result.diagonal) throw new Error('8방향 연결 실패: ' + JSON.stringify(result));
  console.log('OK · 브라우저 · 갤리온 시트 준비 · ↑+→ 북동 침로 · ' + OUT);
})().catch(e => { console.error(e.stack || e); process.exit(1); });
