/* 실제 file:// 일기토에서 가벼운 피격과 마지막 일격 뒤의 느린 착지를 구별한다. */
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
          const id = im.src.split('/').pop().split('.')[0], duel = window.G && G.Games && G.Games._duelDebug;
          const fighter = duel && (duel.me.spriteId === id ? duel.me : duel.en);
          window.__duelFrames.push({ id, pose: fighter && fighter.pose,
            c: args[0] / 432, r: args[1] / 304, time: performance.now(),
            flip: Math.sign(tf.a), b: tf.b, ctf: tf.c, a: tf.a, d: tf.d, x: tf.e, y: tf.f,
            alpha: this.globalAlpha, dx: args[4], dy: args[5], scale: args[6] / 432 });
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
      window.__duelResult = G.Games.duel({ name: '아토스', sprite: 'athos', style: 'thrust', str: 70, mar: 70, skill: 2 },
        { sprite: 'aramis', place: 'deck', fastEnd: true });
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
      await page.waitForFunction(target => G.Games._duelDebug[target].pose === 'idle', target);
      const frames = await page.evaluate(id => window.__duelFrames.filter(f => f.id === id && f.pose === 'hit'), id);
      assert(frames.length && frames.every(f => f.r === 3 && f.c === 0), id + ': 일반 피격에 무릎·쓰러짐 그림이 나오지 않음');
      assert(frames.every(f => f.flip === (target === 'en' ? -1 : 1)), id + ': 상대 방향');
      assert(frames.some(f => Math.abs(f.ctf) > 0.005) && frames.every(f => Math.abs(f.b) < 0.001 && Math.abs(f.ctf) < 0.05), id + ': 서서 살짝 움찔함');
      if (OUT) {
        fs.mkdirSync(OUT, { recursive: true });
        await page.locator('.rd-stage').screenshot({ path: path.join(OUT, id + (fast ? '-fast' : '') + '-hit.png') });
      }
      await page.evaluate(() => window.__motion);
      console.log('일반 피격: 짧은 반동·서서 복귀:', id, fast ? '빠르게' : '보통');
    }
    for (const fast of [false, true]) {
      await page.evaluate(fast => {
        const d = G.Games._duelDebug;
        d.fast = fast;
        for (const f of [d.me, d.en]) { f.hp = f.maxHp = 10000; f.spirit = 0; f.pose = 'idle'; f.poseT = 0; }
        const chance = G.U.chance;
        G.U.chance = () => true;
        window.__duelFrames = [];
        document.querySelector('.rd-sys .btn').click();
        window.__exchange = d.step().finally(() => { G.U.chance = chance; });
        document.querySelector('.rd-sys .btn').click();
      }, fast);
      await page.evaluate(() => window.__exchange);
      const hits = await page.evaluate(() => window.__duelFrames.filter(f => f.pose === 'hit'));
      assert(hits.some(f => f.id === 'athos') && hits.some(f => f.id === 'aramis'), '실제 한 합에서 양쪽이 피격됨');
      assert(hits.every(f => f.r === 3 && f.c === 0), '일반 공격마다 쓰러지지 않고 반격');
      console.log('실제 공격·반격: 서서 피격:', fast ? '빠르게' : '보통');
    }
    for (const fast of [false, true]) for (const target of ['en', 'me']) {
      const id = target === 'en' ? 'athos' : 'aramis';
      await page.evaluate(({ fast, target }) => {
        const d = G.Games._duelDebug;
        d.fast = fast;
        for (const f of [d.me, d.en]) { f.hp = f.maxHp = 10000; f.pose = 'idle'; f.poseT = 0; }
        d[target].hp = 1;
        window.__duelFrames = [];
        window.__motion = d.useTech('secret', d[target === 'en' ? 'me' : 'en']);
      }, { fast, target });
      await page.waitForFunction(target => G.Games._duelDebug[target].hp === 0, target);
      const duration = await page.evaluate(target => G.Games._duelDebug[target].poseDur, target);
      assert.strictEqual(duration, 1.26 * (fast ? 0.5 : 1), '패배 동작은 보통 1.26초·빠르게 0.63초');
      await page.waitForFunction(target => G.Games._duelDebug[target].poseT <= 0, target);
      await page.waitForTimeout(80);
      const down = await page.evaluate(id => ({ last: window.__duelFrames.filter(f => f.id === id).slice(-4),
        frames: window.__duelFrames.filter(f => f.id === id && f.r === 2) }), id);
      assert(down.frames.some(f => f.c === 0) && down.frames.some(f => f.c === 1) && down.frames.some(f => f.c === 2), '마지막 타격 → 무릎 굽힘 → 바닥 착지');
      assert(down.frames.filter(f => f.c === 1).some(f => Math.abs(f.b) > 0.01), '주저앉은 몸이 천천히 기울어짐');
      assert(down.last.length && down.last.every(f => f.r === 2 && f.c === 2 && f.alpha === 1 && Math.abs(f.b) < 0.001 && Math.abs(f.ctf) < 0.001), '착지 그림은 다시 회전하지 않고 그대로 유지');
      await page.evaluate(() => window.__motion);
      console.log('마지막 일격: 무릎 굽힘·느린 착지·누운 자세 유지:', id, fast ? '빠르게' : '보통');
    }
    // 실제 그리기 변환과 시트 외곽으로 머리가 계속 낮아지고 바닥을 뚫지 않는지 확인.
    let previousTop = -Infinity;
    for (const pt of [0.39, 0.46, 0.53, 0.60, 0.67, 0.74]) {
      await page.evaluate(pt => {
        const f = G.Games._duelDebug.me; f.pose = 'down'; f.poseT = 0; f.pt = pt; f.x = 0; f.tx = 0;
        window.__duelFrames = [];
      }, pt);
      await page.waitForTimeout(80);
      const bounds = await page.evaluate(() => {
        const f = window.__duelFrames.filter(f => f.id === 'aramis' && f.r === 2 && f.c === 1).pop();
        const geo = G.DUEL_ART.fallGeometry.aramis;
        const ys = geo.edge.map(v => {
          const x = f.dx + (v[0] + 165) * f.scale, y = f.dy + (v[1] + geo.knee) * f.scale;
          return f.b * x + f.d * y + f.y;
        });
        return { top: Math.min(...ys), bottom: Math.max(...ys), floor: 380 * 0.86 + (geo.ground - 278) * f.scale };
      });
      assert(bounds.top >= previousTop - 0.01, '쓰러지는 도중 머리가 위로 튀지 않음');
      assert(Math.abs(bounds.bottom - bounds.floor) < 0.01, '외투·장화가 바닥에 닿으며 내려앉음');
      previousTop = bounds.top;
    }
    // 실제 렌더러로 각 단계를 고정해 검토용 그림을 남긴다.
    if (OUT) for (const [name, pt] of [['impact', 0], ['knees', 0.34], ['fall', 0.53], ['landing', 0.68], ['down', 1]]) {
      await page.evaluate(pt => { const f = G.Games._duelDebug.me; f.pose = 'down'; f.poseT = 0; f.pt = pt; f.x = 0; f.tx = 0; }, pt);
      await page.waitForTimeout(80);
      await page.locator('.rd-stage').screenshot({ path: path.join(OUT, 'defeat-' + name + '.png') });
    }
    // 실제 승패 처리도 같은 동작을 이어 쓰고, fastEnd에서도 착지하기 전 닫히지 않는다.
    await page.evaluate(() => {
      const d = G.Games._duelDebug;
      d.fast = false;
      for (const f of [d.me, d.en]) { f.hp = f.maxHp = 10000; f.pose = 'idle'; f.poseT = 0; }
      d.en.hp = 1;
      document.querySelector('.rd-sys .btn').click();
      window.__finish = d.use('secret');
    });
    await page.waitForFunction(() => G.Games._duelDebug.over);
    const finishing = await page.evaluate(() => ({ pt: G.Games._duelDebug.en.pt, dur: G.Games._duelDebug.en.poseDur,
      left: G.Games._duelDebug.en.poseT, visible: !!document.querySelector('.rduel') }));
    assert(finishing.visible && finishing.left > 0 && finishing.pt > 0 && finishing.dur === 1.26, '승패 처리에서 마지막 일격의 동작을 처음부터 다시 시작하지 않음');
    await page.waitForFunction(() => G.Games._duelDebug.en.poseT <= 0);
    assert(await page.locator('.rduel').count(), '착지를 마칠 때까지 화면 유지');
    assert.strictEqual(await page.evaluate(() => window.__duelResult), 'win');
    console.log('승패 처리: 착지 동작 유지·fastEnd에서도 끝까지 재생');
    await page.evaluate(() => {
      window.__lossResult = G.Games.duel({ name: '아토스', sprite: 'athos', style: 'thrust', str: 70, mar: 70, skill: 2 },
        { sprite: 'aramis', place: 'deck', stance: 'allout', fastEnd: true });
      document.querySelector('.rd-sys .btn').click();
    });
    await page.waitForFunction(() => G.Games._duelDebug.me.spriteImg && G.Games._duelDebug.en.spriteImg);
    await page.evaluate(() => {
      const d = G.Games._duelDebug;
      d.me.hp = 1; d.me.might = -1000; d.en.might = 1000;
      d.me.spirit = d.en.spirit = 0;
      const chance = G.U.chance;
      G.U.chance = () => true;
      document.querySelector('.rd-sys .btn').click();
      window.__lastStrike = d.step().finally(() => { G.U.chance = chance; });
      document.querySelector('.rd-sys .btn').click();
    });
    await page.waitForFunction(() => G.Games._duelDebug.me.hp === 0);
    assert(await page.locator('.rduel').count(), '패배: 마지막 일격을 맞은 뒤 화면 유지');
    assert.strictEqual(await page.evaluate(() => window.__lossResult), 'lose');
    const loss = await page.evaluate(() => ({ pose: G.Games._duelDebug.me.pose, pt: G.Games._duelDebug.me.pt,
      duration: G.Games._duelDebug.me.poseDur }));
    assert(loss.pose === 'down' && loss.pt >= 0.999 && loss.duration === 1.26, '실제 패배: 반격 없이 착지를 끝내고 마지막 자세 유지');
    console.log('실제 패배: 마지막 일격 뒤 착지를 끝낸 다음 종료');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log('콘솔 오류 0');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
