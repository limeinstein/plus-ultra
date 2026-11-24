/* 바닷길 노래에서 누락됐던 발견 GIF·종이 증거품·지도 외관의 실제 연결 검사. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'artifacts/claude-request-art-20261124');
const url = file => pathToFileURL(path.join(root, file)).href;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], report = {};
  async function setup(page) {
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  }
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await setup(page);
    await page.addInitScript(() => { window.artRAF = requestAnimationFrame.bind(window); window.requestAnimationFrame = () => 0; });
    await page.goto(url('index.html') + '?song=1');
    await page.waitForFunction(() => window.G?.Game?.sceneName === 'title', null, { timeout: 120000 });
    report.assets = await page.evaluate(async () => {
      function check(v, text) { if (!v) throw Error(text); }
      G.Scenes.title.exit(); await G.Loader.hide(); G.UI.clearScreen();
      G.SongStory.start();
      G.Game.state.song.prologue = 1;
      Object.assign(G.Game.state.settings, { res: .35, music: 0, sound: 0 });
      G.FX.song = Object.assign(G.FX.song || {}, { noWait: true, fast: true });
      window.requestAnimationFrame = window.artRAF;
      G.UI.say = async () => {};
      G.UI.ask = async (question, choices) => choices && choices[0] && choices[0].value;
      const savedMates = G.Game.state.mates.slice();
      G.Game.state.mates = ['sy_hwanggyu', 'sy_woldam'].map(id => ({ id, role: 'none', loyal: 90 }));
      for (const region of ['kr', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        const city = region === 'kr' ? { style: 'kr', region: 6 } : { style: '', region };
        const key = G.SongStory.concertArt(city);
        check(key === 'song/concerts/' + region + '_trio', '초반 3인 공연 선택: ' + region);
        const im = new Image(); im.src = G.Img.src(key); await im.decode(); check(im.naturalWidth === 1881, '공연 원화 해독: ' + region);
      }
      G.Game.state.mates = savedMates;
      const marks = [];
      for (const [id] of G.SONG.marks) {
        const d = G.DISC[id]; check(d, '지도 발견물 등록: ' + id);
        for (const folder of ['discoveries', 'discovery-ends', 'discovery-sheets']) {
          const im = new Image(); im.src = G.Img.src(folder + '/' + id); await im.decode();
          check(im.naturalWidth > 0, '그림 해독: ' + folder + '/' + id);
        }
        check(G.Scenes.hasReveal(d), '발견 연출: ' + id);
        const relics = G.Disc.relicsOf(id);
        for (const relic of relics) {
          const key = G.Img.pick(G.Img.chain.relic(relic)); check(key, '유물 그림: ' + relic.id);
          const im = new Image(); im.src = G.Img.src(key); await im.decode();
        }
        marks.push({ id, relics: relics.length });
      }
      for (const d of G.SONG.discs) {
        check(G.DiscoveryIcon.isMapLandmark(G.DISC[d.id]), '지도 외관 연결: ' + d.id);
        const key = G.DiscoveryIcon.key(d), im = new Image(); im.src = G.Img.src(key); await im.decode();
        check(im.naturalWidth === 512 && im.naturalHeight === 512, '지도 외관 크기: ' + d.id);
        const reel = await G.Reel.load(G.Reel.key(G.DISC[d.id])); check(reel && reel.n === 24, '24칸 시트: ' + d.id);
        const cv = document.createElement('canvas'); cv.width = 576; cv.height = 256;
        await G.Reel.play(cv, reel, { ms: 120 }).done;
        check(cv.getContext('2d').getImageData(288, 128, 1, 1).data[3] === 255, '실제 재생: ' + d.id);
      }
      const originalReveal = G.Scenes.discoveryReveal, originalCard = G.Scenes.discoveryCard;
      G.Scenes.discoveryReveal = async () => true;
      G.Scenes.discoveryCard = async () => {};
      for (const d of G.SONG.discs) {
        await G.Disc.find(G.DISC[d.id], 'special');
        const items = G.Game.state.player.items.filter(it => it.disc === d.id && it.kind === 'evidence');
        check(items.length === 1 && items[0].name === d.evidence, '발견 증거품 실제 획득: ' + d.id);
        check(await G.Disc.find(G.DISC[d.id], 'special') === false, '중복 발견 거절: ' + d.id);
        const im = new Image(); im.src = G.Disc.proofSrc(items[0]); await im.decode();
        check(im.naturalWidth === 256, '증거품 전용 아이콘: ' + d.id);
        check(!G.Disc.needsProof(G.DISC[d.id]), '옛 저장의 증거 없는 보고 허용: ' + d.id);
      }
      check(G.Disc.needsProof(G.DISC.capegood), '기존 해도 증거 규칙 유지');
      G.Scenes.discoveryReveal = originalReveal; G.Scenes.discoveryCard = originalCard;
      const saved = JSON.parse(JSON.stringify(G.Game.state)); G.Game.state = saved;
      check(saved.player.items.filter(it => it.id === 'sy_map').length === 1, '저장 복원 지도 1개');
      check(saved.player.items.filter(it => it.kind === 'evidence' && /^sy_/.test(it.disc)).length === 2, '저장 복원 증거품 2개');
      G.Game.state.player.items = saved.player.items.filter(it => it.id === 'sy_map' || (it.disc && /^sy_/.test(it.disc)));
      G.Info.open('items');
      return { marks, newDiscoveries: G.SONG.discs.map(d => d.id), evidence: 2, savedItems: G.Game.state.player.items.length };
    });
    await page.waitForSelector('.items-tbl');
    await page.waitForFunction(() => document.querySelectorAll('.items-tbl .relic-ic').length === 3);
    await page.screenshot({ path: path.join(out, 'song-inventory.png') });
    await page.keyboard.press('Escape');
    for (const id of ['sy_longmen', 'sy_todaiji']) {
      await page.evaluate(id => { G.UI.clearScreen(); G.FX.reveal.playMs = 300; G.FX.reveal.titleMs = 2500; window.revealCheck = G.Scenes.discoveryReveal(G.DISC[id], 0); }, id);
      await page.waitForSelector('.reveal.titled', { timeout: 15000 });
      await page.waitForTimeout(650);
      await page.screenshot({ path: path.join(out, id + '-reveal.png') });
      await page.evaluate(() => window.revealCheck);
    }
    report.proofs = await page.evaluate(() => {
      const rows = G.SONG.discs.map(d => { const p = G.Sponsor.submitProof(G.SPONSOR.sy_imsato, G.DISC[d.id]); return { id: d.id, name: p.ev && p.ev.name, noProof: p.noProof }; });
      for (const row of rows) if (!row.name || row.noProof) throw Error('실제 증거 보고: ' + row.id);
      // 같은 발견을 예전에 마쳤지만 새 증거품은 없던 저장도 벌점이 없다.
      for (const d of G.SONG.discs) if (G.Sponsor.submitProof(G.SPONSOR.sy_imsato, G.DISC[d.id]).noProof) throw Error('옛 저장 보고 벌점');
      return rows;
    });
    const catalog = await browser.newPage({ viewport: { width: 1280, height: 900 } }); await setup(catalog);
    await catalog.goto(url('catalog.html') + '?view=assets#discoveries');
    for (const name of ['용문석굴', '도다이지 대불']) {
      await catalog.locator('#q').fill(name);
      await catalog.locator('.card').filter({ hasText: name }).first().click();
      await catalog.locator('#detail[open]').waitFor();
      await catalog.screenshot({ path: path.join(out, name + '-catalog.png') });
      await catalog.keyboard.press('Escape');
    }
    assert.deepEqual(errors, [], '게임·도감 콘솔 오류 0');
    report.errors = errors; fs.writeFileSync(path.join(out, 'browser-check.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
