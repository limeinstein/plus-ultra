/* 전설 동료 영입 중 업적이 끼어든 뒤 원래 그림 복귀, 가족 장면, 그림 로딩을 실제 UI로 확인한다. */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '그림시험', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: { craft: 3 }, lg: G.LANGS.map(() => 3), diff: 'normal' });
      G.Loader.hide();
      const s = G.Game.state;
      // 마지막 옛이야기 동료를 맞는 실제 흐름에서 Once Upon a Time 업적이 즉시 열린다.
      s.crewEver = { snow_white: 1, sleeping_beauty: 1, little_mermaid: 1 };
      s.fleet.cargo.glass = { q: 1, cost: 50 };
      window.__eventDone = false;
      window.__eventPromise = G.Tale.cinderella().then(() => { window.__eventDone = true; });
    });
    const observed = [];
    for (let i = 0; i < 100; i++) {
      await page.waitForTimeout(280);
      const frame = await page.evaluate(() => {
        const backs = [...document.querySelectorAll('#ui .modal-back')];
        const back = backs[backs.length - 1];
        const pics = [...document.querySelectorAll('.famscene.on')].filter(p => !p.hidden && getComputedStyle(p).visibility !== 'hidden');
        const top = pics[pics.length - 1], im = top && top.querySelector('img');
        const text = back ? back.textContent : '';
        return { text, key: im && im.src, decoded: !!(im && im.complete && im.naturalWidth), done: window.__eventDone };
      });
      if (frame.text) observed.push(frame);
      if (frame.text.includes('고맙습니다, 제독님. 이 구두는')) {
        fs.mkdirSync(path.join(ROOT, 'artifacts/event-shot-repair'), { recursive: true });
        await page.screenshot({ path: path.join(ROOT, 'artifacts/event-shot-repair/legend-after-achievement.png') });
      }
      if (frame.done) break;
      await page.evaluate(() => {
        const back = [...document.querySelectorAll('#ui .modal-back')].pop();
        if (!back) return;
        const button = [...back.querySelectorAll('button')].find(b => !b.disabled && !b.classList.contains('x'));
        if (button) button.click(); else back.click();
      });
    }
    assert(observed.some(x => x.key && x.key.includes('achievement-events/onceupon') && x.decoded), '업적 그림이 실제 대화와 함께 표시된다');
    const thanks = observed.find(x => x.text.includes('고맙습니다, 제독님. 이 구두는'));
    assert(thanks && thanks.key && thanks.key.includes('cinderella_glass_slippers') && thanks.decoded,
      '업적이 끝난 뒤 신데렐라의 마지막 대사에 원래 이벤트 그림이 돌아와야 한다: ' + JSON.stringify(thanks));
    await page.waitForFunction(() => window.__eventDone);
    await page.waitForFunction(() => !document.querySelector('.famscene'));

    // 그림이 늦어도 빈 장면의 대사만 먼저 넘기지 않는다.
    await page.route('**/legend-events/peach_garden_brothers.webp', async route => {
      await new Promise(resolve => setTimeout(resolve, 700));
      await route.continue();
    });
    await page.evaluate(() => {
      window.__slowShot = G.FamEv.showPic({ img: 'legend-events/peach_garden_brothers', title: '도원의 세 형제' });
      window.__slowTalk = G.UI.say('그림이 준비된 뒤 보이는 대사입니다.', G.Legend.speaker('liu_bei'));
    });
    await page.waitForTimeout(120);
    assert.strictEqual(await page.locator('#ui .modal-back').count(), 0, '그림을 읽는 동안 대화가 먼저 시작되지 않는다');
    await page.waitForFunction(() => document.querySelector('#ui .modal-back .dlg'));
    assert(await page.evaluate(() => { const im = document.querySelector('.famscene.on img'); return im && im.complete && im.naturalWidth > 0; }));
    await page.waitForTimeout(280);
    await page.evaluate(async () => {
      document.querySelector('#ui .modal-back').click();
      await window.__slowTalk;
      await window.__slowShot.stop();
    });

    // 가족·연애·혼례 36장과 연애 사건 5장의 원본도 실제로 읽어 본다.
    const familyImages = await page.evaluate(async () => {
      const keys = G.Img.list('family-events/').concat(G.Img.list('romance-events/'));
      const rows = [];
      for (const key of keys) {
        const size = await new Promise(resolve => {
          const im = new Image();
          im.onload = () => resolve([im.naturalWidth, im.naturalHeight]);
          im.onerror = () => resolve([0, 0]);
          im.src = G.Img.src(key);
        });
        rows.push([key, ...size]);
      }
      const FE = G.FamEv, maid = G.MAIDS[0];
      const cast = FE.cast({ at: 'tavern', love: FE.lover(maid), kids: [], city: maid.city });
      window.__familyDone = false;
      window.__familyTalk = FE.play('tav_toast', cast).then(() => { window.__familyDone = true; });
      return rows;
    });
    assert(familyImages.length >= 41 && familyImages.every(x => x[1] > 0 && x[2] > 0), JSON.stringify(familyImages.filter(x => !x[1])));
    let familyShown = false;
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(280);
      const frame = await page.evaluate(() => {
        const im = document.querySelector('.famscene.on img');
        return { done: window.__familyDone, shown: !!(im && im.complete && im.naturalWidth && im.src.includes('06_tavern_toast')) };
      });
      familyShown = familyShown || frame.shown;
      if (frame.shown && !fs.existsSync(path.join(ROOT, 'artifacts/event-shot-repair/family-in-game.png'))) {
        await page.screenshot({ path: path.join(ROOT, 'artifacts/event-shot-repair/family-in-game.png') });
      }
      if (frame.done) break;
      await page.evaluate(() => { const back = [...document.querySelectorAll('#ui .modal-back')].pop(); if (back) back.click(); });
    }
    assert(familyShown, '실제 가족·연애 사건에도 그림이 표시된다');
    await page.waitForFunction(() => window.__familyDone && !document.querySelector('.famscene'));
    assert.deepStrictEqual(errors, []);
    console.log('통과 — 전설 영입→업적→원래 그림 복귀, 느린 로딩, 가족·연애·혼례 그림 ' + familyImages.length + '장과 실제 사건, 정리·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
