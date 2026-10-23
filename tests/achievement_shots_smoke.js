/* 모든 업적 사건 그림 — manifest, 1881×836 규격, 일반 업적 팝업 연결
   node tests/achievement_shots_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Achieve && G.FamEv && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const special = { montcrew: 'legend-events/montcrew_oath', happily: 'legend-events/happily_after_all' };
      const rows = await Promise.all(G.ACHIEVEMENTS.map(async a => {
        const key = special[a.id] || ('achievement-events/' + a.id);
        const size = await new Promise(resolve => {
          const im = new Image();
          im.onload = () => resolve([im.naturalWidth, im.naturalHeight]);
          im.onerror = () => resolve([0, 0]);
          im.src = G.Img.src(key);
        });
        return [a.id, key, !!G.Img.file(key), size[0], size[1]];
      }));

      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state, UI = G.UI, FE = G.FamEv, shown = [], pops = [];
      const oldShow = FE.showPic, oldStop = FE.stopPic, oldWindow = UI.window, oldSay = UI.say;
      FE.showPic = ev => { shown.push([ev.img, ev.title]); return { stop: async () => { shown.push(['stop', ev.img]); } }; };
      FE.stopPic = async () => { shown.push(['stop']); };
      UI.say = () => Promise.resolve(1);
      UI.window = o => { pops.push(o.html); return { result: Promise.resolve(1), close() {} }; };
      s.crewEver = { cinderella: 1, snow_white: 1, sleeping_beauty: 1 };
      await G.Achieve.afterHire('little_mermaid');
      FE.showPic = oldShow; FE.stopPic = oldStop; UI.window = oldWindow; UI.say = oldSay;
      return { rows, total: G.ACHIEVEMENTS.length, once: G.Achieve.done('onceupon'), shown, pop: pops.some(x => /Once Upon a Time/.test(x)) };
    });

    const missing = result.rows.filter(r => !r[2]);
    const badSize = result.rows.filter(r => r[3] !== 1881 || r[4] !== 836);
    ok(result.total === 60, '업적 60개를 모두 검사한다');
    ok(!missing.length, '업적 60개 모두 manifest 사건 그림이 있다');
    ok(!badSize.length, '업적 사건 그림 60개가 모두 1881×836이다');
    ok(result.once && result.pop, '일반 업적 「Once Upon a Time」 달성과 팝업이 정상 동작한다');
    ok(result.shown[0][0] === 'achievement-events/onceupon' && result.shown[0][1] === 'Once Upon a Time' && result.shown.some(x => x[0] === 'stop'), '일반 업적도 전용 사건 그림을 열고 팝업 뒤 닫는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 업적 사건 그림 60개');
  } catch (e) {
    console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
