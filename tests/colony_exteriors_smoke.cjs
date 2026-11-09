/* 갤버스턴 개척지의 첫 방문과 단계별 거리, 전용 외관이 없는 그림 묶음을 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--allow-file-access-from-files']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    for (const dedicated of [true, false]) {
      const result = await page.evaluate(async dedicated => {
        const colony = { id: 1000, nat: 'ES', key: 'gulf', name: '갤버스턴', stage: 0 };
        const state = G.Game.state = G.State.newGame({
          name: '제독', nation: 'ES', age: 25, birth: { m: 1, d: 1 }, st: {}, sk: {}, lg: {}
        });
        state.colony = { list: [colony] };
        const dir = 'exterior-styles/espana/';
        if (!dedicated) {
          delete G.IMAGE_FILES[dir + 'inspector'];
          delete G.IMAGE_FILES[dir + 'govhall'];
        }
        G.Img.reset();
        const stages = [];
        for (const stage of dedicated ? [0, 1, 2, 3, 4] : [4]) {
          colony.stage = stage;
          const c = G.Colony.sync(colony);
          const town = await G.Town.open(c, G.Scenes.city.buildings(c));
          const verified = [];
          for (const it of town.items) {
            let kind = it.kind;
            if (!dedicated && kind === 'inspector') kind = 'mansion';
            if (!dedicated && kind === 'govhall') kind = 'palace';
            const key = G.Img.pick(G.Img.chain.exterior(kind, c));
            const img = G.Img.get(key);
            if (!img) throw new Error(it.name + ' 외관을 읽지 못함: ' + key);
            if (it.kind === 'inspector' || it.kind === 'govhall') {
              if (key !== dir + kind) throw new Error('예상 밖의 외관: ' + key);
              const cv = G.Art.canvas(it.w, it.h), ctx = cv.getContext('2d');
              if (!dedicated && it.kind === 'inspector') { ctx.translate(it.w, 0); ctx.scale(-1, 1); }
              ctx.drawImage(img, 0, 0, it.w, it.h);
              if (cv.toDataURL() !== it.cv.toDataURL()) throw new Error(it.name + ' 거리에 그린 그림이 다름');
            }
            verified.push(it.kind);
          }
          stages.push(verified);
        }
        G.Town.lookAt('govhall');
        const street = G.Town.runtime();
        street.cam = street.camTo;
        G.Town.update(1 / 30);
        return stages;
      }, dedicated);
      if (dedicated) {
        assert.deepEqual(result.map(row => row.length), [1, 6, 8, 10, 11]);
        assert(!result[2].includes('inspector') && result[3].includes('inspector'));
        assert(!result[3].includes('govhall') && result[4].includes('govhall'));
        if (process.env.SHOT) {
          const png = await page.evaluate(() => G.Game.canvases().scene.toDataURL());
          fs.writeFileSync(process.env.SHOT, Buffer.from(png.split(',')[1], 'base64'));
        }
        await page.evaluate(async () => {
          const s = G.Game.state, c = G.Town.city();
          s.player.seat = c.id;
          await G.Town.open(c, G.Scenes.city.buildings(c));
          if (!G.Town.item('home') || !G.Img.get(G.Img.pick(G.Img.chain.exterior('home', c)))) {
            throw new Error('총독 관저 외관이 없음');
          }
        });
      } else assert.equal(result[0].length, 11);
    }
    assert.deepEqual(errors, []);
    console.log('개척 5단계·총독 관저·첫 방문 대체 외관 통과. 콘솔 오류 0.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
