/* 누락 보완 원화 19종을 file:// 게임·발견 재생·소지품·도감에서 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), out = process.env.OUT || path.join(root, 'artifacts/missing-catalog-art-20261119');
const assets = JSON.parse(fs.readFileSync(path.join(root, 'tools/missing_discovery_art_20261119/prompts.json'), 'utf8')).assets;
const url = file => process.env.WEB_BASE ? new URL(file,process.env.WEB_BASE).href : pathToFileURL(path.join(root, file)).href;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const watch = async page => {
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await watch(page);
    await page.addInitScript(() => { window.artRAF = requestAnimationFrame.bind(window); window.requestAnimationFrame = () => 0; });
    await page.goto(url('index.html'));
    await page.waitForFunction(() => window.G?.Game?.sceneName === 'title', null, { timeout: 120000 });
    const loaded = await page.evaluate(async assets => {
      function check(ok, message) { if (!ok) throw Error(message); }
      G.Scenes.title.exit(); await G.Loader.hide(); G.UI.clearScreen();
      G.State.newGame({ name: '누락 그림 검사', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      Object.assign(G.Game.state.settings, { res: .35, music: 0, sound: 0 });
      window.requestAnimationFrame = window.artRAF;
      const loaded = [];
      for (const a of assets) {
        const key = a.output.slice(7).replace(/\.[^.]+$/, '');
        const image = new Image(); if (/^https?:/.test(G.Img.src(key))) image.crossOrigin = 'anonymous'; image.src = G.Img.src(key); await image.decode();
        if (a.kind === 'item') {
          const resolved = await G.Img.resolve(G.Img.chain.item(G.ITEM[a.id]));
          check(resolved?.key === key, '전용 아이템 그림 선택 ' + a.id);
          check(image.naturalWidth === 256 && image.naturalHeight === 256, '아이템 크기 ' + a.id);
          const cv = document.createElement('canvas'); cv.width = cv.height = 256;
          const c = cv.getContext('2d'); c.drawImage(image, 0, 0);
          check(c.getImageData(0, 0, 1, 1).data[3] === 0, '아이템 투명도 ' + a.id);
        } else {
          const d = G.DISC[a.id]; check(d && G.Scenes.hasReveal(d), '발견 연출 연결 ' + a.id);
          check(G.Img.pick(G.Img.chain.discovery(d)) === key, '발견 GIF 선택 ' + a.id);
          const end = new Image(); end.src = G.Img.src('discovery-ends/' + a.id); await end.decode();
          check(end.naturalWidth === 576 && end.naturalHeight === 256, '마지막 장면 ' + a.id);
          const sheet = await G.Reel.load(G.Reel.key(d)); check(sheet?.n === 24, '24칸 재생 시트 ' + a.id);
          const cv = document.createElement('canvas'); cv.width = 576; cv.height = 256; document.body.append(cv);
          let playable = sheet;
          if (/^https?:/.test(sheet.img.src)) {
            const readable = new Image(); readable.crossOrigin = 'anonymous'; readable.src = sheet.img.src; await readable.decode();
            check(readable.naturalWidth === sheet.img.naturalWidth && readable.naturalHeight === sheet.img.naturalHeight, '외부 재생 시트 해독 ' + a.id);
            playable = Object.assign({}, sheet, { img: readable });
          }
          await G.Reel.play(cv, playable, { ms: 240 }).done;
          check(cv.getContext('2d').getImageData(288, 128, 1, 1).data[3] === 255, '연출 재생 완료 ' + a.id);
          cv.remove();
        }
        loaded.push(a.id);
      }
      G.Game.state.player.items = assets.filter(a => a.kind === 'item').map(a => ({ id: a.id }));
      G.Info.open('items');
      return loaded;
    }, assets);
    await page.waitForSelector('.items-tbl');
    await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'));
    await page.waitForFunction(() => [...document.querySelectorAll('.items-tbl img')].every(i => i.complete && i.naturalWidth > 0));
    await page.screenshot({ path: path.join(out, 'inventory-runtime.png') });
    await page.keyboard.press('Escape');
    for (const a of assets.filter(a => a.kind === 'scene')) {
      await page.evaluate(id => { G.UI.clearScreen(); G.FX.reveal.playMs = 300; G.FX.reveal.titleMs = 2500; window.artReveal = G.Scenes.discoveryReveal(G.DISC[id], 0); }, a.id);
      await page.waitForSelector('.reveal.titled', { timeout: 15000 });
      await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.reveal .rv-frame')).opacity) > .95, null, { timeout: 5000, polling: 100 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(out, a.id + '-reveal.png') });
      // 제목 뒤의 발견 대화까지 실제 확인 키로 넘겨 연출을 정상 종료한다.
      for (let n = 0; n < 100 && await page.locator('.reveal').count(); n++) {
        await page.keyboard.press('Enter'); await page.waitForTimeout(120);
      }
      await page.waitForSelector('.reveal', { state: 'detached', timeout: 15000 });
      await page.evaluate(() => window.artReveal);
    }
    const catalog = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await watch(catalog);
    let activeTab = null;
    for (const a of assets) {
      const tab = a.kind === 'scene' ? 'discoveries' : 'items';
      if (tab !== activeTab) {
        await catalog.goto(url('catalog.html') + '?view=assets&check=' + a.id + '#' + tab); activeTab = tab;
      } else {
        await catalog.keyboard.press('Escape'); await catalog.locator('#detail[open]').waitFor({ state: 'detached' });
      }
      await catalog.locator('#q').fill(a.name);
      await catalog.locator('.card').filter({ hasText: a.name }).first().click();
      await catalog.locator('#detail[open]').waitFor();
      assert((await catalog.locator('#detail').innerText()).includes(a.id), '도감 ID ' + a.id);
      await catalog.waitForFunction(() => [...document.querySelectorAll('#detail img')].every(i => i.complete && i.naturalWidth > 0));
      if (['worldtree', 'ps_cutlass', 'pl_doubloons'].includes(a.id)) await catalog.screenshot({ path: path.join(out, a.id + '-catalog.png') });
    }
    assert.deepEqual(errors, [], '게임·도감 콘솔 오류 없음');
    const report = { loaded: loaded.length, discoveries: 4, items: 15, catalog: assets.length, errors };
    fs.writeFileSync(path.join(out, 'browser-check.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
