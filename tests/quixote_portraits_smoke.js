/* 돈키호테·산초의 얼굴상·무릎상과 네 이벤트 그림이 실제 게임 경로로 연결되는지 확인한다. */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (error) {
  ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core'));
}

const ROOT = path.resolve(__dirname, '..');

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Quix && G.MATE && G.Img && G.Art, null, { timeout: 90000 });
    const result = await page.evaluate(async () => {
      const people = ['don_quixote', 'sancho_panza'].map(id => ({
        id,
        face: G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(id))),
        half: G.Img.pick(G.Img.chain.mateHalf(id))
      }));
      const events = ['quixote_windmill', 'quixote_tours_cloak', 'quixote_bazacle', 'quixote_botafumeiro'].map(id => 'legend-events/' + id);
      const paths = people.flatMap(person => [person.face, person.half]).concat(events);
      const decoded = [];
      for (const key of paths) {
        const image = new Image();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = G.Img.src(key);
        });
        await image.decode();
        decoded.push({ key, width: image.naturalWidth, height: image.naturalHeight });
      }
      return { people, events: events.map(key => ({ key, present: G.Img.has(key) })), decoded };
    });
    assert.deepStrictEqual(result.people, [
      { id: 'don_quixote', face: 'portraits/legendary/don_quixote', half: 'portraits/legendary/don_quixote_half' },
      { id: 'sancho_panza', face: 'portraits/legendary/sancho_panza', half: 'portraits/legendary/sancho_panza_half' }
    ]);
    assert(result.events.every(event => event.present), '네 이벤트 그림이 모두 등록되어야 한다');
    assert.deepStrictEqual(result.decoded.slice(0, 4).map(image => [image.width, image.height]), [[448, 448], [1024, 1536], [448, 448], [1024, 1536]]);
    assert.deepStrictEqual(result.decoded.slice(4).map(image => [image.width, image.height]), [[1881, 836], [1881, 836], [1879, 837], [1881, 836]]);
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
