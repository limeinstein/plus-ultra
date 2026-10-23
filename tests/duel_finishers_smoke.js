/* 일기토 GIF 연출: 장비로 비밀무기·전용 호통·전설 필살기·일격필살을 실제 재생한다.
   node tests/duel_finishers_smoke.js */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || '';
if (OUT) fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => {
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 18, birth: { m: 1, d: 1 }, st: { str: 80, int: 60, mar: 90, cha: 70 }, sk: { sword: 3 }, lg: [], diff: 'normal' });
      G.Game.state.settings.res = 0.5;
      G.Games.duel({ name: '훈련 교관', sprite: 'spanish_soldier', style: 'slash', str: 70, mar: 70, skill: 2, atk: 7, def: 3 },
        { mate: { id: 'zhang_fei' }, place: 'deck', stance: 'allout', fastEnd: true });
    });
    await page.waitForFunction(() => G.Games._duelDebug && document.querySelector('.rduel'), null, { timeout: 30000 });
    await page.evaluate(() => { const d = G.Games._duelDebug; d.en.maxHp = d.en.hp = 10000; d.me.hp = d.me.maxHp = 10000; });

    async function play(id, expected) {
      await page.evaluate(id => { const d = G.Games._duelDebug; d.me.spirit = 100; window.__duelMotion = d.use(id); }, id);
      await page.waitForSelector('.rd-motion.show', { timeout: 10000 });
      const src = await page.locator('.rd-motion.show').getAttribute('src');
      ok(src && src.replace(/\\/g, '/').includes(expected), id + ' → ' + expected);
      if (OUT) await page.screenshot({ path: path.join(OUT, id + '.png') });
      await page.evaluate(() => window.__duelMotion);
    }

    await play('secret', 'duel/finishers/common/secret_dagger.gif');
    await play('roar', 'duel/finishers/zhang_fei/roar.gif');
    await play('special', 'duel/finishers/zhang_fei/special.gif');
    await play('deathblow', 'duel/finishers/zhang_fei/slash.gif');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
