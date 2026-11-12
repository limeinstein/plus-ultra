/* 피드백 #185. 저장한 배우자의 자택 인사와 여급·후원자가 고른 실제 그림 쌍을 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'artifacts/feedback-185');
const chrome = process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1120, height: 750 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({ body: '', contentType: 'text/css' }));
    async function openGame() {
      await page.goto((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.G && G.Game.sceneName === 'title' && !G.Loader.shown(), null, { timeout: 120000 });
      await page.evaluate(() => {
        const s = G.Game.state = G.State.newGame({ name: '제독', nation: 'PT', job: 'explorer', age: 28, birth: { m: 1, d: 1 },
          st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
        Object.assign(s.settings, { autosave: false, res: 0.35, music: 0, sound: 0 });
        s.player.fame = 50000;
        G.UI.clearScreen();
        G.Game.showLayers(false, false, true);
      });
    }
    async function capture(key, filename) {
      const image = page.locator('.dlg-actor.active.tall .rig-fallback');
      await page.waitForFunction(key => Array.from(document.querySelectorAll('.dlg-actor.active.tall .rig-fallback')).some(im =>
        im.complete && im.naturalHeight && decodeURI(im.src).endsWith('/' + G.Img.file(key))), key);
      assert.equal(await image.count(), 1);
      await page.screenshot({ path: path.join(out, filename) });
    }
    await openGame();
    await page.evaluate(async () => {
      const s = G.Game.state;
      s.player.wife = 'm_gye';
      G.Game.state = G.State.deserialize(G.State.serialize());
      const c = G.CITY_DATA[s.player.home];
      G.Game.setScene(G.Scenes.city.interior('home', c));
      G.Scenes.city.B.home.enter(c).catch(e => console.error(e));
    });
    await capture('maid-styles/korea/6_half', 'dani-home.png');

    await openGame();
    await page.evaluate(() => {
      const m = G.MAID.m_gye, c = G.CITY_DATA[m.city];
      G.Game.state.loc.city = c.id;
      G.Game.setScene(G.Scenes.city.interior('tavern', c));
      G.Scenes.city.B.tavern.maid(c, m).catch(e => console.error(e));
    });
    await capture('maid-styles/korea/6_half', 'dani-tavern.png');

    await openGame();
    const sponsorKey = await page.evaluate(async () => {
      const s = G.Game.state;
      const sp = G.SPONSORS.find(sp => sp.colonial && sp.holders.some(h => G.Sponsor.yearOf(s.date) >= h[0] && G.Sponsor.yearOf(s.date) < h[1]) &&
        G.Img.pick(G.Art.portraitKeys(G.Sponsor.face(sp).portrait)).startsWith('portraits/pools/'));
      const c = G.CITY_DATA[sp.city];
      s.loc.city = c.id;
      await G.Img.preload([G.Scenes.city.interiorKeys('mansion', c, sp.id)], 5000);
      G.Game.setScene(G.Scenes.city.interior('mansion', c, sp.id));
      const who = G.Sponsor.speaker(sp);
      G.Sponsor.rel(sp.id).met = 1;
      G.Scenes.city.B.mansion.enter(c, sp.id).catch(e => console.error(e));
      return G.Img.pick(G.Art.portraitKeys(who.portrait)) + '_half';
    });
    await capture(sponsorKey, 'colony-sponsor.png');

    const report = await page.evaluate(() => {
      const I = G.Img, A = G.Art, tavern = G.Scenes.city.B.tavern;
      const files = new Set(), missing = [];
      function check(label, faces, halves) {
        const f = I.pick(faces), h = I.pick(halves);
        const sameFile = f && h && I.file(f).replace(/\.[^.]+$/, '') === I.file(h).replace(/_half\.[^.]+$/, '');
        if (!sameFile || h !== f + '_half') missing.push({ label, face: f, half: h });
        if (f) files.add(I.file(f));
        if (h) files.add(I.file(h));
      }
      G.MAIDS.forEach(m => {
        const who = tavern.maidSpeaker(m);
        check(m.id, A.portraitKeys(who.portrait), who.half);
      });
      const regional = I.list('maid-styles/').filter(k => !k.endsWith('_half'));
      regional.forEach(k => check(k, [k], [k + '_half']));
      const cities = G.CITY_DATA.filter(c => c && I.maidPicCity(c));
      cities.forEach(c => {
        const who = tavern.servantSpeaker(c);
        check(c.name, A.portraitKeys(who.portrait), who.half);
      });
      function holders(sp) {
        sp.holders.forEach((h, i) => {
          const month = Math.ceil(h[0] * 12);
          G.Game.state.date = { y: Math.floor(month / 12), m: month % 12 + 1, d: 1 };
          const faces = A.portraitKeys(A.sponsorSpec(sp, i));
          check(sp.id + ' ' + h[2], faces, I.chain.matchedHalf(faces));
          if (G.Sponsor.present(sp) && G.Sponsor.holderIndex(sp) === i) {
            const who = G.Sponsor.speaker(sp);
            check(sp.id + ' 알현 ' + who.name, faces, who.half);
          }
        });
        return sp.holders.length;
      }
      const seats = G.SPONSORS.filter(sp => !sp.colonial);
      const historical = seats.reduce((total, sp) => total + holders(sp), 0);
      const colony = {};
      Object.keys(G.COLONY_NATION).forEach((code, n) => {
        let count = 0;
        for (const city of [102, 148, 195, 201]) {
          G.ColonySp.build({ seq: 100 + n, c: city, code, since: 1490, n: 3 }).forEach(sp => { count += holders(sp); });
        }
        colony[code] = count;
      });
      // 전용 짝이 빠졌을 때 다른 사람의 몸통으로 넘어가지 않는지 확인한다.
      const dani = G.MAID.m_gye;
      const k = I.pick(I.chain.maid(dani.id, G.CITY_DATA[dani.city]));
      const other = 'portraits/maids/m_1550_hs';
      const saved = G.IMAGE_FILES[k + '_half'];
      delete G.IMAGE_FILES[k + '_half']; I.reset();
      try {
        if (I.pick(I.chain.matchedHalf([k, other]))) throw Error('누락된 무릎상에 다른 사람을 연결함');
      } finally {
        G.IMAGE_FILES[k + '_half'] = saved; I.reset();
      }
      return { maids: G.MAIDS.length, cities: cities.length, regional: regional.length, seats: seats.length, historical, colony, missing, files: Array.from(files) };
    });
    assert.deepEqual(report.missing, [], '여급과 후원자 그림 쌍');
    for (const f of report.files) assert(fs.existsSync(path.join(root, 'images', f)), f);
    await page.goto(process.env.WEB_BASE ? new URL('catalog.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'catalog.html')).href, { waitUntil: 'domcontentloaded' });
    await page.locator('#tab-people').click();
    await page.locator('#q').fill('단이');
    await page.locator('.card').getByText('단이', { exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('#dStrip figure canvas').length >= 2);
    const captions = await page.locator('#dStrip figcaption').allTextContents();
    assert(captions.some(t => t.includes('무릎상')) && captions.some(t => t.includes('흉상')));
    assert.deepEqual(errors, [], '콘솔·실행 오류');
    fs.writeFileSync(path.join(out, 'runtime.json'), JSON.stringify({ ...report, errors }, null, 2));
    console.log('여급 %d명, 지역 초상 %d쌍, %d개 도시, 후원자 %d자리·%d대 및 식민 세력 %d개 검사 통과', report.maids, report.regional, report.cities, report.seats, report.historical, Object.keys(report.colony).length);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
