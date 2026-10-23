/* Happily After All 사건 그림 — 옛이야기의 네 아가씨와 모두 혼인한 직후 전용 그림과 업적 창
   node tests/happily_after_all_smoke.js */
'use strict';
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || os.tmpdir();
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Achieve && G.FamEv && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state, UI = G.UI, FE = G.FamEv, shown = [], pops = [];
      const oldShow = FE.showPic, oldStop = FE.stopPic, oldWindow = UI.window, oldSay = UI.say;
      FE.showPic = ev => { shown.push([ev.img, ev.title]); return { stop: async () => { shown.push(['stop', ev.img]); } }; };
      FE.stopPic = async () => { shown.push(['stop']); };
      UI.say = () => Promise.resolve(1);
      UI.window = o => { pops.push(o.html); return { result: Promise.resolve(1), close() {} }; };
      s.player.wife = 'cinderella';
      s.player.wives2 = [{ id: 'snow_white', kind: 'mate' }, { id: 'sleeping_beauty', kind: 'mate' }];
      await G.Achieve.afterWed('sleeping_beauty');
      const before = { done: G.Achieve.done('happily'), shown: shown.length };
      s.player.wives2.push({ id: 'little_mermaid', kind: 'mate' });
      await G.Achieve.afterWed('little_mermaid');
      const after = { done: G.Achieve.done('happily'), shown: shown.slice(), pop: pops.some(x => /Happily Ever After/.test(x)) };
      FE.showPic = oldShow; FE.stopPic = oldStop; UI.window = oldWindow; UI.say = oldSay;
      const key = 'legend-events/happily_after_all';
      const image = await new Promise(resolve => { const im = new Image(); im.onload = () => resolve([im.naturalWidth, im.naturalHeight]); im.onerror = () => resolve([0, 0]); im.src = G.Img.src(key); });
      return { before, after, key: G.Img.pick([key]), image };
    });
    ok(!result.before.done && result.before.shown === 0, '세 사람과 혼인했을 때는 아직 사건 그림이 뜨지 않는다');
    ok(result.after.done && result.after.pop, '네 사람과 혼인한 직후 「Happily Ever After」 업적 창이 뜬다');
    ok(result.after.shown[0][0] === 'legend-events/happily_after_all' && result.after.shown[0][1] === 'Happily After All' && result.after.shown.some(x => x[0] === 'stop'), '전용 사건 그림 「Happily After All」을 열고 업적 창 뒤 닫는다');
    ok(result.key === 'legend-events/happily_after_all' && result.image[0] === 1881 && result.image[1] === 836, '사건 그림 1881×836 WEBP를 manifest에서 실제로 불러온다');

    await page.evaluate(() => { window.__happyPic = G.FamEv.showPic({ img: 'legend-events/happily_after_all', title: 'Happily After All' }); });
    await page.waitForSelector('.famscene.on img', { timeout: 10000 });
    await page.waitForTimeout(500);
    const shot = path.join(OUT, 'happily-after-all.png');
    await page.screenshot({ path: shot });
    await page.evaluate(async () => { if (window.__happyPic) await window.__happyPic.stop(); });
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 화면: ' + shot);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
