/* 일기토 연출: 장비로 비밀무기·호통(인물 컷인 → 호통 GIF)·전설 필살기·일격필살(인물 전면 컷인)을 실제 재생하고, 적의 컷인이 뒤집히는지 본다.
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
    await page.goto(GAME, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => {
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 18, birth: { m: 1, d: 1 }, st: { str: 80, int: 60, mar: 90, cha: 70 }, sk: { sword: 3 }, lg: [], diff: 'normal' });
      G.Game.state.settings.res = 0.5;
      G.Games.duel({ name: '훈련 교관', sprite: 'spanish_soldier', style: 'slash', str: 70, mar: 70, skill: 2, atk: 7, def: 3 },
        { mate: { id: 'zhang_fei' }, place: 'deck', stance: 'allout', fastEnd: true });
    });
    await page.waitForFunction(() => G.Games._duelDebug && document.querySelector('.rduel'), null, { timeout: 30000 });
    await page.evaluate(() => { const d = G.Games._duelDebug; d.en.maxHp = d.en.hp = 10000; d.me.hp = d.me.maxHp = 10000; });

    // expected: 차례로 나와야 하는 그림들 (호통은 인물 컷인 → 호통 기운 GIF)
    async function play(id, expected, shot) {
      await page.evaluate(id => { const d = G.Games._duelDebug; d.me.spirit = 100; window.__duelMotion = d.use(id); }, id);
      for (const want of [].concat(expected)) {
        const h = await page.waitForFunction(w => { const m = document.querySelector('.rd-motion.show'); const s = m && (m.getAttribute('src') || '').replace(/\\/g, '/'); return s && s.includes(w) ? s : null; }, want, { timeout: 10000 });
        ok(await h.jsonValue(), id + ' → ' + want);
        if (/cutins/.test(want)) {
          const st = await page.evaluate(() => ({ cut: document.querySelector('.rd-motion.cutin.show') !== null, title: document.querySelector('.rd-cut-title.show b')?.textContent || '', flash: document.querySelector('.rd-cut-flash.show') !== null, w: document.querySelector('.rd-motion.cutin').offsetWidth, sw: document.querySelector('.rd-stage').offsetWidth }));
          ok(st.cut && st.flash && st.title && Math.abs(st.w - st.sw) < 4, id + ' 컷인이 무대 전체를 덮고 섬광·제목(' + st.title + ')이 뜬다 ' + JSON.stringify(st));
          if (OUT && shot) { await page.waitForTimeout(shot); await page.screenshot({ path: path.join(OUT, id + '.png'), clip: await page.locator('.rd-stage').boundingBox() }); }
        }
      }
      await page.evaluate(() => window.__duelMotion);
      ok(!(await page.$('.rd-motion.show')) && !(await page.$('.rd-cut-title.show')), id + ' 뒤 컷인이 걷힌다');
    }

    await play('secret', 'duel/finishers/common/secret_dagger.gif');
    await play('roar', ['duel/cutins/zhang_fei.gif', 'duel/finishers/zhang_fei/roar.gif'], 300);
    await play('special', 'duel/cutins/zhang_fei.gif', 480);
    // 적이 쓰면 오른쪽에서 들어온다
    await page.evaluate(() => { const d = G.Games._duelDebug; d.en.spirit = 100; window.__duelMotion = d.useTech('special', d.en); });
    await page.waitForSelector('.rd-motion.cutin.en.show', { timeout: 10000 });
    const ec = await page.evaluate(() => ({ cls: document.querySelector('.rd-motion.cutin').className, tf: getComputedStyle(document.querySelector('.rd-motion.cutin')).transform, title: document.querySelector('.rd-cut-title').className }));
    // 에스파냐 병사 원화는 왼쪽(내 쪽)을 보고 있으므로 뒤집지 않고, 오른쪽에서 드러나며 제목도 오른쪽에 붙는다
    ok(!/flip/.test(ec.cls) && /from-r/.test(ec.cls) && !/matrix\(-1/.test(ec.tf) && /\ben\b/.test(ec.title), '적의 컷인은 오른쪽에서 들어오고 상대(왼쪽)를 향한다 ' + JSON.stringify(ec));
    if (OUT) { await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, 'enemy_special.png'), clip: await page.locator('.rd-stage').boundingBox() }); }
    await page.evaluate(() => window.__duelMotion);
    // 일격필살은 맞으면 싸움이 끝나므로 맨 마지막에
    await play('deathblow', 'duel/cutins/zhang_fei.gif', 120);
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
