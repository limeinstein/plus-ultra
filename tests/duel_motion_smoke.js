/* 실제 file:// 일기토에서 좌우 피격·빠르게·착지 유지·복귀를 확인한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(() => {
      window.__duelFrames = [];
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (im, ...args) {
        if (im && /duel\/fighters\//.test(im.src || '') && args.length === 8) {
          const tf = this.getTransform();
          window.__duelFrames.push({ id: im.src.split('/').pop().split('.')[0],
            c: args[0] / 432, r: args[1] / 304, time: performance.now(),
            flip: Math.sign(tf.a), b: tf.b, ctf: tf.c });
          if (window.__duelFrames.length > 2000) window.__duelFrames.shift();
        }
        return draw.call(this, im, ...args);
      };
    });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => {
      G.State.newGame({ name: '모션 시험', nation: 'PT', job: 'explorer', age: 18,
        birth: { m: 1, d: 1 }, st: { str: 80, int: 60, mar: 90, cha: 70 }, sk: { sword: 3 }, lg: [], diff: 'normal' });
      G.Game.state.settings.res = 0.35;
      G.Game.state.settings.shake = false;
      G.Games.duel({ name: '아토스', sprite: 'athos', style: 'thrust', str: 70, mar: 70, skill: 2 },
        { sprite: 'aramis', place: 'deck' });
    });
    await page.waitForFunction(() => G.Games._duelDebug && G.Games._duelDebug.en.spriteImg && G.Games._duelDebug.me.spriteImg);
    await page.evaluate(() => {
      G.Games._duelDebug.choose('allout');
      document.querySelector('.rd-sys .btn').click(); // 방침 화면을 닫고 자동 합만 멈춘다.
    });
    for (const fast of [false, true]) for (const target of ['en', 'me']) {
      const id = target === 'en' ? 'athos' : 'aramis';
      await page.evaluate(({ fast, target }) => {
        const d = G.Games._duelDebug;
        d.fast = fast;
        d.me.hp = d.me.maxHp = d.en.hp = d.en.maxHp = 10000;
        window.__duelFrames = [];
        window.__motion = d.useTech('secret', d[target === 'en' ? 'me' : 'en']);
      }, { fast, target });
      await page.waitForFunction(target => {
        const f = G.Games._duelDebug[target]; return f.hp < f.maxHp;
      }, target);
      await page.waitForFunction(id => window.__duelFrames.some(f => f.id === id && f.r === 2 && f.c === 2), id);
      const frames = await page.evaluate(id => window.__duelFrames.filter(f => f.id === id && f.r === 2), id);
      assert(frames.some(f => f.c === 0) && frames.some(f => f.c === 1) && frames.some(f => f.c === 2), id + ': 0→1→2 순서');
      assert(frames.every(f => f.flip === (target === 'en' ? -1 : 1)), id + ': 상대 방향');
      assert(frames.every(f => Math.abs(f.b) < 0.001 && Math.abs(f.ctf) < 0.001), id + ': 시트 착지를 재회전하지 않음');
      if (OUT) {
        fs.mkdirSync(OUT, { recursive: true });
        await page.locator('.rd-stage').screenshot({ path: path.join(OUT, id + (fast ? '-fast' : '') + '-hit.png') });
      }
      await page.waitForFunction(target => G.Games._duelDebug[target].pose === 'idle', target);
      await page.evaluate(() => window.__motion);
      console.log('피격 3단계·착지·복귀:', id, fast ? '빠르게' : '보통');
    }
    // 체력이 0이 되는 실제 피해를 준 뒤, 첫 자세로 되돌아가지 않고 누워 있는지 확인.
    await page.evaluate(() => {
      const d = G.Games._duelDebug;
      d.fast = false; d.en.hp = 1; d.en.maxHp = 10000;
      window.__duelFrames = [];
      window.__motion = d.useTech('secret', d.me);
    });
    await page.waitForFunction(() => G.Games._duelDebug.en.hp === 0);
    await page.waitForTimeout(750);
    const down = await page.evaluate(() => ({ pose: G.Games._duelDebug.en.pose,
      last: window.__duelFrames.filter(f => f.id === 'athos').slice(-8) }));
    assert.strictEqual(down.pose, 'down');
    assert(down.last.length && down.last.every(f => f.r === 2 && f.c === 2), '패배 후 마지막 착지 자세 유지');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log('체력 0: 마지막 착지 자세 유지, 콘솔 오류 0');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
