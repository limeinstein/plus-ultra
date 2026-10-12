/* 역사·종교 시네마틱 216개의 등록·장면 판 로딩·실제 재생을 file://에서 확인한다. */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

const ROOT = path.resolve(__dirname, '..');
const rows = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'tools/ruin_gifs/cinematic-prompts.json'), 'utf8'
));
const executablePath = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(function (candidate) { return candidate && fs.existsSync(candidate); });

(async function () {
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader',
      '--allow-file-access-from-files']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', function (error) { errors.push(error.message); });
    page.on('console', function (message) {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, function (route) {
      return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {
      waitUntil: 'domcontentloaded', timeout: 120000
    });
    await page.waitForFunction(function () {
      return window.G && G.DISC && G.Img && G.Reel && G.Scenes;
    }, null, { timeout: 120000 });

    const result = await page.evaluate(async function (ids) {
      const missing = ids.filter(function (id) {
        return !G.DISC[id] || !G.Img.has('discoveries/' + id) ||
          !G.Img.has('discovery-ends/' + id) || !G.Img.has('discovery-sheets/' + id);
      });
      const samples = ['carnac', 'pyramid', 'bulguksa', 'tiantan', 'tajmahal', 'shambhala'];
      const played = [];
      for (const id of samples) {
        const discovery = G.DISC[id];
        const reel = await G.Reel.load(G.Reel.key(discovery));
        const canvas = document.createElement('canvas');
        canvas.width = 576; canvas.height = 256;
        canvas.style.cssText = 'position:fixed;left:-10000px;top:-10000px';
        document.body.appendChild(canvas);
        const player = G.Reel.play(canvas, reel, { ms: 180 });
        const first = canvas.toDataURL();
        await player.done;
        played.push({ id: id, frames: reel.n, changed: first !== canvas.toDataURL() });
        canvas.remove();
      }
      return { missing: missing, played: played };
    }, rows.map(function (row) { return row.id; }));

    assert.deepEqual(result.missing, []);
    assert(result.played.every(function (item) {
      return item.frames === 18 && item.changed;
    }), JSON.stringify(result.played));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ count: rows.length, played: result.played, errors: errors }));
  } finally {
    await browser.close();
  }
}()).catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
