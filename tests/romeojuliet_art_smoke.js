/* 베로나 인물 7명의 전용 초상과 사건 장면 5장의 실제 로드·대화 연결 검사. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
const PEOPLE = ['romeo', 'juliet', 'rj_mercutio', 'rj_tybalt', 'rj_laurence', 'rj_escalus', 'rj_balthasar'];
const EVENTS = ['rj_brawl', 'rj_mercutio', 'rj_potion', 'rj_grail', 'rj_tomb'];
const OUT = path.join(ROOT, 'artifacts/romeojuliet-art/runtime');

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
    await page.waitForFunction(() => window.G && G.Game && G.Romeo && G.Legend && G.Hist, null, { timeout: 90000 });
    const result = await page.evaluate(async ({ people, events }) => {
      const keys = people.flatMap(id => {
        const key = 'portraits/' + (['romeo', 'juliet'].includes(id) ? 'legendary/' : 'history/') + id;
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
        const sp = ['romeo', 'juliet'].includes(id) ? G.Legend.speaker(id) : G.Hist.speaker(id);
        const expected = 'portraits/' + (['romeo', 'juliet'].includes(id) ? 'legendary/' : 'history/') + id;
        return { id, name: sp.name, half: G.Img.pick(sp.half), expected: expected + '_half' };
      });
      G.State.newGame({ name: '베로나 그림 검사', nation: 'PT', job: 'explorer', age: 30,
        birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1546, m: 6, d: 1 }; s.settings.res = 0.35; s.flags.prologue = true;
      // 도시 입장 때 실제 사건이 저절로 시작해 검사 대화와 겹치지 않게 완료 상태로 둔다.
      s.romeo = { p1: 1, p2: 1, joined: 1, told: {} };
      s.loc = { mode: 'city', city: 29 }; await G.Game.ensureGeo(); G.Town._toldKeys = true;
      G.Game.go('city', { cityId: 29 });
      return { decoded, speakers };
    }, { people: PEOPLE, events: EVENTS });
    for (const item of result.decoded) {
      // 장면과 무릎상은 공용 규격, 얼굴상은 원본 해상도를 줄이지 않는 1024px 규격으로 검사한다.
      const expected = item.key.startsWith('legend-events/') ? [1881, 836] : item.key.endsWith('_half') ? [1024, 1536] : [1024, 1024];
      assert.deepStrictEqual([item.width, item.height], expected, item.key);
    }
    for (const sp of result.speakers) assert.strictEqual(sp.half, sp.expected, sp.id);
    await page.waitForTimeout(500);
    for (const id of PEOPLE) {
      await page.evaluate(id => {
        const sp = ['romeo', 'juliet'].includes(id) ? G.Legend.speaker(id) : G.Hist.speaker(id);
        G.UI.say('베로나 — ' + sp.name, sp).catch(e => console.error(e));
      }, id);
      await page.waitForTimeout(650);
      await page.screenshot({ path: path.join(OUT, id + '.png') });
      await page.keyboard.press('Escape'); await page.waitForTimeout(180);
    }
    for (const key of EVENTS) {
      await page.evaluate(async key => {
        window.__romeoArt = G.FamEv.showPic({ img: 'legend-events/' + key, title: '베로나' });
        await window.__romeoArt.ready;
        G.UI.say('베로나의 두 연인', G.Legend.speaker('juliet')).catch(e => console.error(e));
      }, key);
      await page.waitForTimeout(550);
      assert.strictEqual(await page.locator('.famscene img').count(), 1);
      await page.screenshot({ path: path.join(OUT, key + '.png') });
      await page.keyboard.press('Escape');
      await page.evaluate(async () => { await window.__romeoArt.stop(); });
    }
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    fs.writeFileSync(path.join(OUT, 'validation.json'), JSON.stringify({ ...result, consoleErrors: errors }, null, 2) + '\n');
    console.log('베로나: 초상 14장·이벤트 5장 로드, 인물 7명 대화·장면 5개 표시, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
