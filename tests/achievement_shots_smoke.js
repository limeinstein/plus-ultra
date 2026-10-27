/* 모든 업적 사건 그림 — manifest, 가로 9:4 규격, 일반·명성 업적 팝업 연결
   node tests/achievement_shots_smoke.js */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Achieve && G.FamEv && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const special = { montcrew: 'legend-events/montcrew_oath', happily: 'legend-events/happily_after_all' };
      const illustrated = G.ACHIEVEMENTS;
      const rows = await Promise.all(illustrated.map(async a => {
        const key = special[a.id] || ('achievement-events/' + a.id);
        const size = await new Promise(resolve => {
          const im = new Image();
          im.onload = () => resolve([im.naturalWidth, im.naturalHeight]);
          im.onerror = () => resolve([0, 0]);
          im.src = G.Img.src(key);
        });
        return [a.id, key, !!G.Img.file(key), size[0], size[1], !!a.fameRule, !!a.collectionRule];
      }));

      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state, UI = G.UI, FE = G.FamEv, shown = [], pops = [];
      const oldShow = FE.showPic, oldStop = FE.stopPic, oldWindow = UI.window, oldSay = UI.say;
      FE.showPic = ev => { shown.push([ev.img, ev.title]); return { stop: async () => { shown.push(['stop', ev.img]); } }; };
      FE.stopPic = async () => { shown.push(['stop']); };
      UI.say = () => Promise.resolve(1);
      UI.window = o => { pops.push(o.html); return { result: Promise.resolve(1), close() {} }; };
      const fame = illustrated.filter(a => a.fameRule), fameScenes = [];
      try {
        s.crewEver = { cinderella: 1, snow_white: 1, sleeping_beauty: 1 };
        await G.Achieve.afterHire('little_mermaid');
        for (const a of fame) {
          const start = shown.length, popStart = pops.length;
          await G.Achieve.scene(a);
          const events = shown.slice(start);
          fameScenes.push(events.length === 2 && events[0][0] === 'achievement-events/' + a.id &&
            events[0][1] === a.name && events[1][0] === 'stop' && pops.length === popStart + 1 && pops[popStart].includes(a.name));
        }
      } finally {
        FE.showPic = oldShow; FE.stopPic = oldStop; UI.window = oldWindow; UI.say = oldSay;
      }
      return { rows, total: illustrated.length, fameScenes, once: G.Achieve.done('onceupon'), shown, pop: pops.some(x => /Once Upon a Time/.test(x)) };
    });

    const missing = result.rows.filter(r => !r[2]);
    // 기존 그림은 정확한 규격, 새 ImageGen 원본은 1~2px의 출력 편차만 허용한다.
    const badSize = result.rows.filter(r => r[6] ? r[3] < 1800 || r[4] < 700 || r[3] / r[4] < 2.1 || r[3] / r[4] > 2.5 :
      r[5] ? Math.abs(r[3] - 1881) > 2 || Math.abs(r[4] - 836) > 2 : r[3] !== 1881 || r[4] !== 836);
    ok(result.total === 95, '기존 82개와 발견물 완성 13개 업적을 모두 검사한다');
    ok(!missing.length, '업적 95개 모두 manifest 사건 그림이 있다: ' + missing.map(r => r[0]).join(', '));
    ok(!badSize.length, '업적 사건 그림 95개가 모두 고해상도 가로 장면 규격이다: ' + badSize.map(r => r[0] + ' ' + r[3] + '×' + r[4]).join(', '));
    ok(result.once && result.pop, '일반 업적 「Once Upon a Time」 달성과 팝업이 정상 동작한다');
    ok(result.shown[0][0] === 'achievement-events/onceupon' && result.shown[0][1] === 'Once Upon a Time' && result.shown.some(x => x[0] === 'stop'), '일반 업적도 전용 사건 그림을 열고 팝업 뒤 닫는다');
    ok(result.fameScenes.length === 22 && result.fameScenes.every(Boolean), '명성 업적 22개가 각각 전용 그림·제목·팝업을 표시하고 그림을 닫는다');
    await page.waitForFunction(() => !document.querySelector('.achv-ribbon'));
    await page.evaluate(() => { G.Loader.hide(); void G.Achieve.scene(G.Achieve.get('fame_balanced')); });
    await page.waitForFunction(() => {
      const im = document.querySelector('.famscene.on img');
      return im && im.complete && im.naturalWidth > 0 && im.src.includes('fame_balanced');
    });
    const out = path.join(ROOT, 'artifacts', 'fame-achievement-shots-20261027');
    fs.mkdirSync(out, { recursive: true });
    await page.screenshot({ path: path.join(out, 'fame-balanced-in-game.png') });
    const gallery = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await gallery.goto(pathToFileURL(path.join(ROOT, 'docs/art/fame-achievement-shots.html')).href);
    ok(await gallery.locator('img').evaluateAll(ims => ims.length === 22 && ims.every(im => im.complete && im.naturalWidth > 0)), '미리보기에도 새 그림 22개가 모두 보인다');
    await gallery.screenshot({ path: path.join(out, 'fame-achievement-contact-sheet.png'), fullPage: true });
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 업적 사건 그림 95개');
  } catch (e) {
    console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
