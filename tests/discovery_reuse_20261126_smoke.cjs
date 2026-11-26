/* 중복 통합한 옛 키와 기존 불국사·콜로세움을 실제 그림 읽기·재생기로 검사한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files']});
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    // 빈 로컬 문서에서 실제 게임 그림 목록·읽기·재생기만 실행한다.
    await page.goto(pathToFileURL(path.join(ROOT, 'tests/fixtures/discovery_reuse_20261126.html')).href);
    const result = await page.evaluate(async () => {
      const rows = [];
      for (const id of ['bulguksa', 'colosseum', 'pufferfish', 'flyingfish']) {
        const gif = await G.Img.load('discoveries/' + id);
        const end = await G.Img.load('discovery-ends/' + id);
        const reel = await G.Reel.load(G.Reel.key({id}));
        if (!gif || !end || !reel || gif.naturalWidth !== 576 || end.naturalWidth !== 576) throw Error('읽기 실패:' + id);
        const canvas = document.createElement('canvas'); canvas.width = 576; canvas.height = 256;
        document.body.append(canvas);
        const ctx = canvas.getContext('2d');
        const play = G.Reel.play(canvas, reel, {ms: 200});
        const first = ctx.getImageData(0, 0, 576, 256).data;
        await play.done;
        const last = ctx.getImageData(0, 0, 576, 256).data;
        if (!first.some((v, i) => v !== last[i])) throw Error('재생 변화 없음:' + id);
        rows.push({id, frames: reel.n, gif: G.IMAGE_FILES['discoveries/' + id]});
        canvas.remove();
      }
      return rows;
    });
    assert.equal(result.find(r => r.id === 'pufferfish').gif, 'discoveries/f_puffer.gif');
    assert.equal(result.find(r => r.id === 'flyingfish').gif, 'discoveries/f_flying.gif');
    assert.deepEqual(errors, []);
    const out = path.join(ROOT, 'artifacts/discovery-category-20261126');
    fs.mkdirSync(out, {recursive: true});
    fs.writeFileSync(path.join(out, 'runtime.json'), JSON.stringify({pass: true, samples: result, consoleErrors: errors}, null, 2));
    console.log('PASS: 기존 완성본·중복 통합 키 4종 실제 읽기·재생, 콘솔 오류 0');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
