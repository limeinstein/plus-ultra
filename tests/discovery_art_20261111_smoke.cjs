/* 발견 장면의 실제 재생·모든 신규 증거품 로딩·소지품 표시를 file://에서 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'artifacts/discovery-art-20261111');
const partial = process.argv.includes('--partial');
let assets = JSON.parse(fs.readFileSync(path.join(root, 'tools/discovery_art_20261111/prompts.json'), 'utf8')).assets;
if (partial) {
  const ready = new Set(JSON.parse(fs.readFileSync(path.join(out, 'assets.json'), 'utf8')).map(row => row.id));
  assets = assets.filter(row => ready.has(row.id));
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1040, height: 800 } });
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.__assetRAF = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = () => 0; });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Reel && G.Disc && G.Disc.proofSrc && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const status = await page.evaluate(async ({ rows, partial }) => {
      const expect = (value, message) => { if (!value) throw Error(message); };
      // 게임 루프를 멈춘 검사에서는 타이틀 준비도 멈추므로 로딩 막을 정상 종료한다.
      G.Scenes.title.exit();
      await G.Loader.hide();
      G.UI.clearScreen();
      G.State.newGame({ name: '발견 원화 검사', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.settings.res = .35;
      const icons = rows.filter(row => row.kind !== 'scene');
      const instance = row => row.kind === 'relic' ? { id: row.itemId, disc: row.disc } : row.kind === 'clue'
        ? { id: 'clue_' + row.sp, kind: 'clue', sp: row.sp, clue: row.disc, name: row.name }
        : { id: 'evidence', kind: 'evidence', evidence: true, disc: row.disc, name: row.name };
      for (let start = 0; start < icons.length; start += 24) {
        const batch = icons.slice(start, start + 24);
        await G.Img.preload(batch.map(row => [row.output.slice(7, -5)]));
        for (const row of batch) {
          const key = row.output.slice(7, -5), image = G.Img.get(key);
          expect(image && image.naturalWidth === 256 && image.naturalHeight === 256, '아이콘 로딩: ' + row.id);
          expect(G.Disc.proofSrc(instance(row)) === G.Img.src(key), '증거품 원화 선택: ' + row.id);
        }
      }
      for (const relic of (partial ? [] : Object.values(G.RELIC))) {
        const key = G.Img.pick(G.Img.chain.relic(relic));
        expect(key && /^(relics|items|figureheads)\//.test(key), '전체 유물 전용 원화: ' + relic.id);
      }
      const scenes = rows.filter(row => row.kind === 'scene');
      for (const row of scenes) {
        const definition = G.DISC[row.disc];
        expect(definition && G.Scenes.hasReveal(definition) && G.Reel.key(definition), '발견 장면 연결: ' + row.disc);
        for (const prefix of ['discoveries/', 'discovery-ends/', 'discovery-sheets/']) expect(G.Img.has(prefix + row.disc), '장면 파일: ' + prefix + row.disc);
      }
      const chosen = [icons.find(row => row.disc === 'uppsala') || icons.find(row => row.kind === 'relic'), icons.find(row => row.kind === 'evidence'),
        icons.find(row => row.kind === 'clue'), icons.find(row => row.disc === 'folk_uyghur')].filter(Boolean);
      G.Game.state.player.items = chosen.map(instance);
      let proofBadges = 0;
      for (const row of chosen.filter(row => row.kind !== 'clue')) {
        for (const mode of ['report', 'announce']) {
          const markup = G.Disc.proofThumbs(row.disc, mode);
          expect(markup.includes(row.output.slice(7)) && markup.includes('data-pv-src'), '보고·발표 증빙 그림: ' + row.id + '/' + mode);
          proofBadges++;
        }
      }
      G.Info.open('items');
      return { icons: icons.length, scenes: scenes.length, relics: Object.keys(G.RELIC).length, proofBadges, sampleNames: chosen.map(row => row.name) };
    }, { rows: assets, partial });
    await page.waitForSelector('.items-tbl');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.items-tbl img')).every(img => img.complete && img.naturalWidth > 0));
    await page.screenshot({ path: path.join(out, 'proof-inventory-runtime.png') });
    const playback = await page.evaluate(async available => {
      G.UI.clearScreen();
      // 게임은 화면 밖을 자른다. 검수 모음은 8장을 모두 캡처할 수 있게 펼친다.
      document.documentElement.style.cssText = 'overflow:visible;height:auto';
      document.body.style.cssText = 'overflow:visible;height:auto';
      document.body.innerHTML = '<main style="padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:14px;background:#25242a;color:white;font:16px sans-serif"></main>';
      window.requestAnimationFrame = window.__assetRAF;
      const result = [];
      for (const id of ['uppsala', 'asbyrgi', 'tolstaya', 'folk_mongol', 'karez', 'siberiancrane', 'siberianpine', 'folk_uyghur']) {
        if (!available.includes(id)) continue;
        const definition = G.DISC[id], loaded = await G.Reel.load(G.Reel.key(definition));
        if (!loaded || loaded.n < 16) throw Error('재생 시트 로딩: ' + id);
        const section = document.createElement('section');
        const title = document.createElement('p'); title.textContent = definition.name; section.append(title);
        const canvas = document.createElement('canvas'); canvas.width = 576; canvas.height = 256; canvas.style.width = '100%'; section.append(canvas);
        document.querySelector('main').append(section);
        const player = G.Reel.play(canvas, loaded, { ms: 240 });
        await player.done;
        const pixel = canvas.getContext('2d').getImageData(288, 128, 1, 1).data;
        if (!pixel[3]) throw Error('재생 마지막 장면 미표시: ' + id);
        result.push({ id, frames: loaded.n, completed: true });
      }
      return result;
    }, assets.filter(row => row.kind === 'scene').map(row => row.disc));
    await page.screenshot({ path: path.join(out, 'discovery-runtime.png'), fullPage: true });
    assert.deepEqual(errors, [], '브라우저 오류 없음');
    fs.writeFileSync(path.join(out, partial ? 'browser-check-partial.json' : 'browser-check.json'), JSON.stringify({ ...status, playback, errors }, null, 2) + '\n');
    console.log(JSON.stringify({ ...status, played: playback.length, errors }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
