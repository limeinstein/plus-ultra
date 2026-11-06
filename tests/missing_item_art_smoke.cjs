/* 신규 원화의 실제 로딩과 기존 유물·선수상의 원화 공유를 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'artifacts/missing-item-art-20261106');
const spec = JSON.parse(fs.readFileSync(path.join(root, 'docs/art/missing-item-prompts-20261106.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    // file:// 오프라인 검사: 선택 글꼴은 운영체제 대체 글꼴로 표시한다.
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const result = await page.evaluate(async assets => {
      const expect = (value, reason) => { if (!value) throw Error(reason); };
      const loaded = [];
      // 한꺼번에 모든 원화를 풀지 않아 큰 원화의 메모리 사용을 제한한다.
      for (let start = 0; start < assets.length; start += 20) {
        const batch = assets.slice(start, start + 20);
        await G.Img.preload(batch.map(asset => G.Img.chain.item(G.ITEM[asset.id])));
        for (const asset of batch) {
          const item = G.ITEM[asset.id];
          expect(item && item.name === asset.name, '아이템 자료: ' + asset.id);
          const key = G.Img.pick(G.Img.chain.item(item));
          expect(key === 'items/' + item.id, '전용 원화 연결: ' + item.id);
          const image = G.Img.get(key);
          expect(image && image.naturalWidth === 256 && image.naturalHeight === 256, '원화 읽기: ' + item.id);
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 256;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          expect(ctx.getImageData(0, 0, 1, 1).data[3] === 0, '투명 배경: ' + item.id);
          loaded.push(item.id);
        }
      }
      const all = Object.values(G.ITEM);
      for (const item of all) {
        const key = G.Img.pick(G.Img.chain.item(item));
        expect(key && !/^(item|relic)-kinds\//.test(key), '전체 전용 그림: ' + item.id);
      }
      const instruments = all.filter(item => item.kind === 'instrument');
      expect(instruments.length === 186, '기존 악기 186종 유지');
      expect(instruments.every(item => G.Img.pick(G.Img.chain.item(item)) === 'items/' + item.id), '악기 전체 전용 그림');
      const chosen = ['gayageum', 'geomungo', 'janggu', 'haegeum', 'guitar', 'violin', 'piano', 'oud', 'kora', 'gamelan', 'dl_pavilion', 'calico_pistol', 'br_jade', 'r_santangelo', 'odawara_jinbaori'];
      const panel = document.createElement('div');
      panel.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#25242a;color:white;display:grid;grid-template-columns:repeat(5,1fr);overflow:auto;font:17px sans-serif;padding:12px';
      for (const id of chosen) {
        const card = document.createElement('div');
        card.style.cssText = 'display:flex;flex-direction:column;align-items:center';
        const image = document.createElement('img');
        image.src = G.Img.get('items/' + id).src;
        image.style.cssText = 'width:210px;height:210px;object-fit:contain';
        card.append(image, document.createTextNode(G.ITEM[id].name));
        panel.append(card);
      }
      document.body.append(panel);
      await Promise.all([...panel.querySelectorAll('img')].map(image => image.decode()));
      return { generated: loaded.length, total: all.length, instruments: instruments.length };
    }, spec.assets);
    await page.screenshot({ path: path.join(out, 'runtime-preview.png') });
    assert.deepEqual(errors, [], '브라우저 오류 없음');
    fs.writeFileSync(path.join(out, 'browser-check.json'), JSON.stringify({ ...result, errors }, null, 2) + '\n');
    console.log(JSON.stringify(result));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
