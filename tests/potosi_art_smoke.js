/* 포토시 인물 6명의 전용 초상과 사건 장면 5장의 실제 로드·대화 연결 검사. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PEOPLE = ['chaska', 'huallpa', 'villarroel', 'kusimayta', 'ayala', 'mendo'];
const EVENTS = ['potosi_wayra', 'potosi_hostage', 'potosi_caravan', 'potosi_tunnel', 'potosi_star'];
const OUT = path.join(ROOT, 'artifacts/potosi-art/runtime');

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + (m.location().url || ''))) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Potosi && G.Legend && G.Hist, null, { timeout: 90000 });
    const result = await page.evaluate(async ({ people, events }) => {
      const keys = people.flatMap(id => {
        const key = 'portraits/' + (id === 'chaska' ? 'legendary/' : 'history/') + id;
        return [key, key + '_half'];
      }).concat(events.map(id => 'legend-events/' + id));
      const decoded = [];
      for (const key of keys) {
        if (!G.Img.has(key)) throw new Error('누락된 그림: ' + key);
        const image = new Image(); image.src = G.Img.src(key); await image.decode();
        decoded.push({ key, width: image.naturalWidth, height: image.naturalHeight });
        if (key.startsWith('portraits/') && !G.PORTRAIT_FACES[key]) throw new Error('얼굴 좌표 누락: ' + key);
      }
      const speakers = people.map(id => {
        const sp = id === 'chaska' ? G.Legend.speaker(id) : G.Hist.speaker(id);
        const expected = 'portraits/' + (id === 'chaska' ? 'legendary/' : 'history/') + id;
        return { id, name: sp.name, half: G.Img.pick(sp.half), expected: expected + '_half' };
      });
      G.State.newGame({ name: '포토시 그림 검사', nation: 'PT', job: 'explorer', age: 30,
        birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1546, m: 6, d: 1 }; s.settings.res = 0.35; s.flags.prologue = true;
      // 도시 입장 때 실제 사건이 저절로 시작해 검사 대화와 겹치지 않게 완료 상태로 둔다.
      s.potosi = { met: 1, fire: 'native', hostage: 1, res: 'rescued', told: {} };
      s.loc = { mode: 'city', city: 225 }; await G.Game.ensureGeo(); G.Town._toldKeys = true;
      G.Game.go('city', { cityId: 225 });
      return { decoded, speakers };
    }, { people: PEOPLE, events: EVENTS });
    for (const item of result.decoded) {
      const expected = item.key.startsWith('legend-events/') ? [1800, 800] : item.key.endsWith('_half') ? [1024, 1536] : [1024, 1024];
      assert.deepStrictEqual([item.width, item.height], expected, item.key);
    }
    for (const sp of result.speakers) assert.strictEqual(sp.half, sp.expected, sp.id);
    await page.waitForTimeout(500);
    for (const id of PEOPLE) {
      await page.evaluate(id => {
        const sp = id === 'chaska' ? G.Legend.speaker(id) : G.Hist.speaker(id);
        G.UI.say('포토시 — ' + sp.name, sp).catch(e => console.error(e));
      }, id);
      await page.waitForTimeout(650);
      await page.screenshot({ path: path.join(OUT, id + '.png') });
      await page.keyboard.press('Escape'); await page.waitForTimeout(180);
    }
    for (const key of EVENTS) {
      await page.evaluate(async key => {
        window.__potosiArt = G.FamEv.showPic({ img: 'legend-events/' + key, title: '포토시' });
        await window.__potosiArt.ready;
        G.UI.say('은산과 샛별', G.Legend.speaker('chaska')).catch(e => console.error(e));
      }, key);
      await page.waitForTimeout(550);
      assert.strictEqual(await page.locator('.famscene img').count(), 1);
      await page.screenshot({ path: path.join(OUT, key + '.png') });
      await page.keyboard.press('Escape');
      await page.evaluate(async () => { await window.__potosiArt.stop(); });
    }
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    fs.writeFileSync(path.join(OUT, 'validation.json'), JSON.stringify({ ...result, consoleErrors: errors }, null, 2) + '\n');
    console.log('포토시: 초상 12장·이벤트 5장 로드, 인물 6명 대화·장면 5개 표시, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
