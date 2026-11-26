/* 본편·이야기·튜토리얼 전체 발견물의 실제 file:// 그림 읽기·연출·GIF 팩 경로를 검사한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/discovery-gif-qa-20261126');
const partial = process.argv.includes('--allow-incomplete');
const onlyPlayback = process.argv.includes('--only-playback');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], report = { partial, categories: {}, loaded: [], playback: [] };
  fs.mkdirSync(OUT, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'tests/fixtures/discovery-gif-gallery-20261126.html'), path.join(OUT, 'index.html'));
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.addInitScript(() => {
      localStorage.clear(); localStorage.setItem('pu.lang', 'ko');
      const raf = requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : raf(cb);
    });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Reel && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const inventory = await page.evaluate(async partial => {
      G.Scenes.title.exit(); await G.Loader.hide(); G.UI.clearScreen();
      G.State.newGame({ name: '전체 발견 검사', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.settings.res = .35;
      const rows = G.DISCOVERIES, missing = [], ready = [], ids = rows.map(d => d.id);
      if (ids.length !== new Set(ids).size) throw Error('발견물 ID 중복');
      for (const d of rows) {
        if (['discoveries/', 'discovery-ends/', 'discovery-sheets/'].some(prefix => !G.Img.has(prefix + d.id))) { missing.push(d.id); continue; }
        if (G.Img.pick(G.Img.chain.discovery(d)) !== 'discoveries/' + d.id) throw Error('전용 그림 선택 실패:' + d.id);
        if (!G.Img.isAnim('discoveries/' + d.id) || !G.Scenes.hasReveal(d) || G.Reel.key(d) !== 'discovery-sheets/' + d.id) throw Error('연출 미연결:' + d.id);
        ready.push({ id: d.id, name: d.realName || d.name, cat: d.cat });
      }
      if (!partial && missing.length) throw Error('그림 누락:' + missing.join(','));
      const original = G.PREFER_GIF;
      try {
        G.PREFER_GIF = true;
        for (const row of ready) if (G.Reel.key(G.DISC[row.id]) !== null || !G.Scenes.hasReveal(G.DISC[row.id])) throw Error('설치판 GIF 경로:' + row.id);
      } finally { G.PREFER_GIF = original; }
      return { total: rows.length, missing, ready, story: rows.filter(d => d.tale).map(d => d.id) };
    }, partial);
    report.total = inventory.total; report.missing = inventory.missing;
    assert.ok(report.total > 0); assert.equal(inventory.story.length, 7);
    for (const id of ['herc_cave', 'sy_longmen', 'sy_todaiji', 'ds_083', 'ds_925']) {
      assert.ok(inventory.ready.some(r => r.id === id) || partial && inventory.missing.includes(id), '자료 범위:' + id);
    }
    for (let start = 0; !onlyPlayback && start < inventory.ready.length; start += 8) {
      const batch = inventory.ready.slice(start, start + 8);
      const loaded = await page.evaluate(async rows => Promise.all(rows.map(async row => {
        const [gif, end, sheet] = await Promise.all([G.Img.load('discoveries/' + row.id), G.Img.load('discovery-ends/' + row.id), G.Reel.load('discovery-sheets/' + row.id)]);
        if (!gif || gif.naturalWidth !== 576 || gif.naturalHeight !== 256) throw Error('GIF 읽기:' + row.id);
        if (!end || end.naturalWidth * 256 !== end.naturalHeight * 576) throw Error('끝 장면 읽기:' + row.id);
        if (!sheet || sheet.n < 12 || Math.abs(sheet.cw / sheet.ch - 576 / 256) > .001) throw Error('시트 읽기:' + row.id);
        return { ...row, sheetFrames: sheet.n };
      })), batch);
      report.loaded.push(...loaded);
      loaded.forEach(r => report.categories[r.cat] = (report.categories[r.cat] || 0) + 1);
      if (start % 64 === 0) console.log('그림 읽기', report.loaded.length, '/', inventory.ready.length);
    }
    const samples = ['giza', 'muyeol', 'moonjar', 'herc_cave', 'sy_longmen', 'ft_granada', 'canyon', 'flordelamar', 'ds_083', 'ds_377', 'ds_183', 'ds_427', 'ds_265', 'ds_295', 'ds_405']
      .filter(id => inventory.ready.some(r => r.id === id));
    // 실제 재생기는 첫 장면과 끝 장면을 그리며, finish가 마지막 장면을 보존한다.
    for (const id of samples) {
      const result = await page.evaluate(async id => {
        const d = G.DISC[id], L = await G.Reel.load(G.Reel.key(d)), canvas = document.createElement('canvas');
        canvas.width = 576; canvas.height = 256; document.body.append(canvas);
        const ctx = canvas.getContext('2d'), pixel = () => Array.from(ctx.getImageData(0, 0, 576, 256).data);
        const play = G.Reel.play(canvas, L, { ms: 200 });
        const first = pixel(); await play.done; const last = pixel();
        if (!first.some((x, i) => x !== last[i])) throw Error('첫·끝 장면 변화 없음:' + id);
        const finalPixel = pixel(); play.finish();
        if (pixel().some((x, i) => x !== finalPixel[i])) throw Error('마지막 장면 고정 실패:' + id);
        canvas.remove(); return { id, frames: L.n, ended: true };
      }, id);
      report.playback.push(result);
    }
    // 실제 발견 팝업을 열어 건너뛰기·대사·정리까지 연결한다. 기다리는 시간과 대사 선택만 줄인다.
    await page.evaluate(() => {
      G.__qaSleep = G.U.sleep; G.U.sleep = async () => {};
      G.__qaSay = G.UI.say; G.UI.say = async () => {};
      G.__qaStories = G.DiscStories.play; G.DiscStories.play = async () => true;
    });
    try {
      for (const id of samples) {
        await page.evaluate(id => { window.__discoveryResult = null; window.__discoveryError = null;
          G.Game.state.disc[id] = { me: true, found: 14800101 };
          G.Scenes.discoveryReveal(G.DISC[id], 100).then(v => { window.__discoveryResult = v; }, e => { window.__discoveryError = e.message; });
        }, id);
        await page.waitForSelector('.reveal canvas.rv-reel');
        await page.waitForFunction(() => document.querySelector('.reveal canvas.rv-reel').getContext('2d').getImageData(100, 100, 1, 1).data[3] > 0);
        if (['giza', 'moonjar', 'ds_083', 'herc_cave', 'sy_longmen'].includes(id)) {
          await page.locator('.reveal').evaluate(el => el.classList.add('on'));
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(OUT, 'runtime-' + id + '.png') });
        }
        await page.locator('.reveal').click({ position: { x: 10, y: 10 }, force: true });
        await page.waitForFunction(() => window.__discoveryResult !== null || window.__discoveryError !== null);
        assert.equal(await page.evaluate(() => window.__discoveryError), null, id);
        assert.equal(await page.evaluate(() => window.__discoveryResult), true, id);
        assert.equal(await page.locator('.reveal').count(), 0, '연출 DOM 정리:' + id);
        assert.equal(await page.evaluate(() => document.getElementById('ui').classList.contains('scenepic-on')), false, '대화 모드 정리:' + id);
      }
    } finally {
      await page.evaluate(() => { G.U.sleep = G.__qaSleep; G.UI.say = G.__qaSay; G.DiscStories.play = G.__qaStories; });
    }
    if (!partial) {
      await page.goto(pathToFileURL(path.join(OUT, 'index.html')).href);
      assert.equal(await page.locator('article').count(), 438);
      await page.locator('#query').fill('ds_925');
      assert.equal(await page.locator('article:visible').count(), 1);
      const card = page.locator('article:visible');
      await card.locator('button').click();
      await page.waitForFunction(() => { const im = document.querySelector('article:not([hidden]) img'); return im.src.endsWith('ds_925.gif') && im.complete && im.naturalWidth === 576; });
      await card.locator('button').click();
      await page.waitForFunction(() => { const im = document.querySelector('article:not([hidden]) img'); return im.src.endsWith('ds_925.jpg') && im.complete && im.naturalWidth === 576; });
      await page.screenshot({ path: path.join(OUT, 'gallery-filter.png') });
      report.gallery = { cards: 438, search: true, playStop: true };
    }
    assert.deepEqual(errors, []);
    report.consoleErrors = errors; report.pass = true;
    fs.writeFileSync(path.join(OUT, onlyPlayback ? 'runtime-playback.json' : partial ? 'runtime-partial.json' : 'runtime.json'), JSON.stringify(report, null, 2));
    console.log('PASS:', report.total, '종, 실제 그림 읽기', report.loaded.length, '종, 재생·발견 연출', samples.length, '종, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
