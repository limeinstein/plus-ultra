/* 동료로 출전하고 교체하는 실제 일기토에서 여섯 공주의 공격·피격 그림을 확인한다. */
'use strict';
const assert = require('assert/strict');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ids = ['cinderella', 'snow_white', 'sleeping_beauty', 'little_mermaid', 'elizaveta', 'scheherazade'];
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    for (let i = 0; i < ids.length; i++) {
      const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
      await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts\./.test(m.text())) errors.push(m.text()); });
      await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.G && G.Game.sceneName === 'title');
      await page.clock.install();
      await page.clock.pauseAt(new Date(Date.now() + 500));
      const id = ids[i], next = ids[(i + 1) % ids.length], move = ['slash', 'thrust', 'bash'][i % 3];
      await page.evaluate(async ({ id, next }) => {
        G.State.newGame({ name: '모션 확인', nation: 'PT', job: 'explorer', age: 18, birth: { m: 1, d: 1 },
          st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: { sword: 2 }, lg: [], diff: 'normal' });
        const s = G.Game.state;
        s.settings.res = 0.35;
        s.mates = [{ id, role: 'first' }, { id: next }];
        s.player.hp = 20;
        const draw = CanvasRenderingContext2D.prototype.drawImage;
        window.trace = [];
        CanvasRenderingContext2D.prototype.drawImage = function (im, ...args) {
          if (args.length === 8 && im.src && im.src.includes('/fighters_ext/')) {
            trace.push([im.src.split('/').pop(), args[1] / 304, args[0] / 432]);
          }
          return draw.call(this, im, ...args);
        };
        const keys = [id, next].flatMap(f => ['duel/fighters/' + f, 'duel/fighters_ext/' + f + '_atk',
          'duel/fighters_ext/' + f + '_react', 'duel/cutins/' + f]);
        keys.push('duel/backgrounds/deck');
        const loaded = await Promise.all(keys.map(k => G.Img.load(k)));
        if (loaded.some(im => !im)) throw Error('공주 그림 누락 ' + id);
        G.Games.duel({ name: G.MATE[next].name, style: 'slash', skill: 1 },
          { mate: G.Games.proxy(), place: 'deck', stance: 'allout', fastEnd: true });
        document.querySelector('.rd-sys .btn').click();
        window.duel = G.Games._duelDebug;
      }, { id, next });
      await page.clock.runFor(900);
      assert.deepEqual(await page.evaluate(() => [duel.me.spriteId, duel.en.spriteId]), [id, next]);
      await page.evaluate(move => {
        duel.me.hp = duel.en.hp = 10000;
        duel.en.move = move;
        window.attack = duel.strike(duel.me, move, { sure: true });
      }, move);
      await page.clock.runFor([300, 335, 475][i % 3]);
      if (process.env.OUT) {
        fs.mkdirSync(process.env.OUT, { recursive: true });
        await page.locator('.rd-stage canvas').screenshot({ path: path.join(process.env.OUT, id + '.png') });
      }
      await page.clock.runFor(1500);
      await page.evaluate(() => window.attack);
      const frames = await page.evaluate(() => trace);
      assert(frames.some(([file, row, col]) => file === id + '_atk.png' && row === i % 3 && col === 3), id + ': 무기 접촉 장면 ' + JSON.stringify([...new Set(frames.map(f => f.join('/')))]));
      if (move !== 'bash') assert(frames.some(([file]) => file === next + '_react.png'), next + ': 피격 장면');
      await page.evaluate(() => { duel.me.spirit = 100; window.swap = duel.useTech('swap', duel.me); });
      await page.clock.runFor(2200);
      await page.evaluate(() => window.swap);
      assert.deepEqual(await page.evaluate(() => [duel.me.spriteId, duel.me.atkSheet.src.split('/').pop(),
        duel.me.reactSheet.src.split('/').pop()]), [next, next + '_atk.png', next + '_react.png']);
      await page.close();
      console.log(id + ' 출전·' + move + ' 접촉·' + next + ' 교체 확인');
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
