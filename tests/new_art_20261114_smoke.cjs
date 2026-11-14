/* 강서대묘·사신도·천축 소지품의 실제 로딩·지도·발견·소지품·도감을 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), out = process.env.OUT || path.join(root, 'artifacts/new-art-20261114');
const spec = JSON.parse(fs.readFileSync(path.join(root, 'tools/new_art_20261114/prompts.json'), 'utf8'));
const url = file => process.env.WEB_BASE ? new URL(file,process.env.WEB_BASE).href : pathToFileURL(path.join(root, file)).href;

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const watch = async page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({ contentType: 'text/css', body: '' }));
  };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await watch(page);
    await page.addInitScript(() => {
      window.resumeFrames = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = () => 0;
    });
    await page.goto(url('index.html'));
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const report = await page.evaluate(async assets => {
      function check(value, message) { if (!value) throw Error(message); }
      G.Scenes.title.exit();
      await G.Loader.hide();
      G.UI.clearScreen();
      G.State.newGame({ name: '새 발견·소지품 검사', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.settings.res = .35;
      window.requestAnimationFrame = window.resumeFrames;
      const loaded = [];
      for (const a of assets) {
        const key = a.output.slice(7).replace(/\.[^.]+$/, '');
        const image = new Image(), src = G.Img.src(key);
        if (/^https?:/.test(src)) image.crossOrigin = 'anonymous';
        image.src = src; await image.decode();
        if (a.kind !== 'scene') {
          const size = a.kind === 'map' ? 512 : 256;
          check(image.naturalWidth === size && image.naturalHeight === size, '이미지 크기 ' + a.id);
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
          check(ctx.getImageData(0, 0, 1, 1).data[3] === 0, '투명 배경 ' + a.id);
        }
        if (a.kind === 'item' || a.kind === 'relic') {
          check(G.Img.pick(G.Img.chain.item(G.ITEM[a.id])) === key, '소지품 연결 ' + a.id);
        }
        loaded.push({ id: a.id, key, size: [image.naturalWidth, image.naturalHeight] });
      }
      const d = G.DISC.gangseo;
      G.Game.state.player.items = assets.filter(a => a.kind === 'item' || a.kind === 'relic').map(a => ({ id: a.id, ...(a.disc ? { disc: a.disc } : {}) }));
      check(G.Scenes.hasReveal(d), '발견 연출 연결');
      check(G.Disc.proofSrc({ id: 'r_sasindo', disc: 'gangseo' }) === G.Img.src('relics/r_sasindo'), '사신도 증빙 연결');
      for (const mode of ['report', 'announce']) check(G.Disc.proofThumbs('gangseo', mode).includes('relics/r_sasindo.webp'), '보고·발표 그림 ' + mode);
      const sheet = await G.Reel.load(G.Reel.key(d));
      check(sheet && sheet.n === 24, '24칸 발견 시트');
      const canvas = document.createElement('canvas'); canvas.width = 576; canvas.height = 256;
      await G.Reel.play(canvas, sheet, { ms: 240 }).done;
      check(canvas.getContext('2d').getImageData(288, 128, 1, 1).data[3] === 255, '발견 시트 재생 완료');
      check(!G.DiscoveryIcon.visible().some(row => row.id === d.id), '발견 전 외관 숨김');
      G.Game.state.disc.gangseo = { me: true, found: 1 };
      await G.DiscoveryIcon.preload([d]);
      await new Promise(resolve => setTimeout(resolve, 270));
      check(G.DiscoveryIcon.visible().some(row => row.id === d.id), '발견 후 지도 표시');
      check(G.DiscoveryIcon.key(d) === 'map-discoveries/completion/gangseo', '지도 외관 연결');
      const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 576, 256);
      G.DiscoveryIcon.draw(ctx, d, 100, 100, { scale: 3 });
      check(ctx.getImageData(37, 37, 126, 126).data.some((v, i) => i % 4 === 3 && v > 60), '지도 그리기');
      G.Info.open('items');
      return { loaded, reelFrames: sheet.n, playbackComplete: true, mapBeforeAfter: true, proofBadges: 2 };
    }, spec.assets);
    await page.waitForSelector('.items-tbl');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.items-tbl img')).every(im => im.complete && im.naturalWidth > 0));
    await page.screenshot({ path: path.join(out, 'inventory-runtime.png') });
    await page.locator('.items-tbl tr').last().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(out, 'inventory-bottom-runtime.png') });
    await page.keyboard.press('Escape');
    await page.waitForSelector('.items-tbl', { state: 'detached' });
    console.log('그림 7종 실제 로딩·투명도·소지품·24칸 재생·지도 표시 통과');

    // 실제 발견 화면을 띄우고 자연스럽게 마지막 장면으로 넘어가는지 확인한다.
    await page.evaluate(() => {
      G.UI.clearScreen();
      G.FX.reveal.titleMs = 5000;
      window.assetReveal = G.Scenes.discoveryReveal(G.DISC.gangseo, 0);
    });
    await page.waitForSelector('.reveal.titled', { timeout: 15000 });
    await page.screenshot({ path: path.join(out, 'discovery-runtime.png') });

    const catalog = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await watch(catalog);
    const cards = [
      { tab: 'discoveries', name: '강서대묘', needle: 'gangseo' },
      { tab: 'relics', name: '사신도', needle: 'r_sasindo' },
      { tab: 'items', name: '빠진 마지막 권의 빈 두루마리', needle: 'xy_last_sutra' }
    ];
    for (const card of cards) {
      // 도감은 처음 열 때 해시를 읽으므로 분류마다 전체 탐색으로 연다.
      await catalog.goto(url('catalog.html') + '?view=assets&check=' + card.tab + '#' + card.tab);
      await catalog.locator('#q').fill(card.name);
      const entry = catalog.locator('.card').filter({ hasText: card.name }).first();
      await entry.waitFor(); await entry.click();
      await catalog.locator('#detail[open]').waitFor();
      assert((await catalog.locator('#detail').innerText()).includes(card.needle), card.name + ' 도감 연결');
      await catalog.waitForFunction(() => Array.from(document.querySelectorAll('#detail img')).every(im => im.complete && im.naturalWidth > 0));
      await catalog.screenshot({ path: path.join(out, card.needle + '-catalog.png') });
    }
    assert.deepEqual(errors, [], '페이지·콘솔 오류 없음');
    fs.writeFileSync(path.join(out, 'browser-check.json'), JSON.stringify({ ...report, catalog: cards.map(c => c.name), errors }, null, 2) + '\n');
    console.log('실제 강서대묘 발견 화면·도감 3종 통과, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
