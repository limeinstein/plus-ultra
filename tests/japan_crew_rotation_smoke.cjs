/* 일본 여성 항해사 10명의 1550년·5년 주기, 초상, 모집, 저장 호환을 실제 게임에서 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const out = process.env.OUT || path.join(root, 'artifacts/japan-crew-20261114');

(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined),
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const errors = [];
    const page = await browser.newPage({viewport: {width: 960, height: 540}});
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({contentType: 'text/css', body: ''}));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto((process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'index.html')).href), {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.G && G.JapanCrew && G.Game && G.Game.sceneName === 'title', null, {timeout: 120000});
    const result = await page.evaluate(async () => {
      function check(ok, message) { if (!ok) throw Error(message); }
      let s = G.Game.state = G.State.newGame({name: '일본 항해사 시험', nation: 'PT', job: 'explorer', age: 25,
        birth: {m: 1, d: 1}, st: {str: 65, int: 65, mar: 65, cha: 65}, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal'});
      s.settings.res = 0.35; s.seed = 67271; s.player.fame = 10000; s.player.gold = 500000; s.flags.prologue = true;
      const tavern = G.Scenes.city.B.tavern, crew = G.MATES.filter(m => m.japanRotation);
      const ids = crew.map(m => m.id), japan = G.MATE_ZONES.japan.ids;
      const selection = y => crew.filter(m => G.Frontier.mateReady(m, y)).map(m => m.id).join(',');
      const candidates = () => japan.flatMap(id => tavern.candidates(G.CITY_DATA[id]).filter(m => m.japanRotation).map(m => m.id)).sort();
      check(crew.length === 10 && new Set(ids).size === 10 && new Set(crew.map(m => m.name)).size === 10, '고유한 여성 10명');
      for (const m of crew) {
        check(G.MATE[m.id] === m && m.g === 'f' && !G.MatePower.why(m), '일반 고용 후보 ' + m.name);
        check(G.MateMove.range(m.id).every(id => japan.includes(id)), '일본 안에서만 이동 ' + m.name);
        for (const key of [m.face, m.face + '_half']) {
          check(!!G.PORTRAIT_FACES[key], '얼굴 자리 ' + key);
          const image = await G.Img.load(key);
          check(image && image.naturalWidth === (key.endsWith('_half') ? 1024 : 512) &&
            image.naturalHeight === (key.endsWith('_half') ? 1536 : 512), '실제 파일 크기 ' + key);
        }
        check(G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(m.id))) === m.face &&
          G.Img.pick(G.Img.chain.mateHalf(m.id)) === m.face + '_half', '얼굴·무릎의 같은 인물 ' + m.name);
      }
      const borrowed = G.Wander.facePool('jp', 'f', 'nav', 'JP');
      check(!borrowed.some(key => crew.some(m => m.face === key)), '일반 철새가 전용 얼굴을 빌리지 않음');
      s.date.y = 1549;
      s.mateLoc = Object.fromEntries(ids.map(id => [id, 191]));
      check(!selection(1549) && !candidates().length && !G.MateMove.where(ids[0]), '1549년 미등장·옛 자리 정리');
      const cycles = [], periods = [];
      for (let epoch = 1550; epoch <= 1700; epoch += 25) {
        const batches = [];
        for (let y = epoch; y < epoch + 25; y += 5) {
          s.date.y = y;
          const batch = selection(y).split(',');
          check(batch.length === 2 && selection(y + 4) === batch.join(','), y + '년부터 5년 고정 명단');
          check(candidates().join(',') === batch.slice().sort().join(','), y + '년 술집 명단');
          check(!tavern.candidates(G.CITY_DATA[175]).some(m => m.japanRotation), '일본 밖 모집 제외');
          batches.push(batch.join(','));
          periods.push({from: y, to: y + 4, names: batch.map(id => G.MATE[id].name)});
        }
        check(new Set(batches.join(',').split(',')).size === 10, epoch + '년부터 25년 동안 한 번씩 등장');
        cycles.push(batches.join('|'));
      }
      check(new Set(cycles).size === cycles.length, '25년마다 다른 순서로 재추첨');
      s.date.y = 1550;
      const first = selection(1550), m = G.MATE[first.split(',')[0]], city = G.MateMove.where(m.id);
      check(tavern._mateCard(m, city).textContent.includes('1550~1554년'), '인물 카드의 실제 모집 기간');
      window.__jpQA = G.UI.window({title: m.name + ' — 항해사 후보', width: 820, parch: false, html: '<div class="hire-card parch"></div>'});
      window.__jpQA.content.firstElementChild.appendChild(tavern._mateCard(m, city));
      window.__jpTest = {first, id: m.id, city: city.id, periods};
      return {periods, cycles: cycles.length};
    });
    await GLoader(page);
    await page.screenshot({path: path.join(out, 'recruit-card.png')});
    const hiring = await page.evaluate(async () => {
      window.__jpQA.close(null);
      function check(ok, message) { if (!ok) throw Error(message); }
      let s = G.Game.state;
      const tavern = G.Scenes.city.B.tavern, crew = G.MATES.filter(m => m.japanRotation), data = window.__jpTest;
      const selection = y => crew.filter(m => G.Frontier.mateReady(m, y)).map(m => m.id).join(',');
      const candidates = () => G.MATE_ZONES.japan.ids.flatMap(id => tavern.candidates(G.CITY_DATA[id]).filter(m => m.japanRotation).map(m => m.id));
      const m = G.MATE[data.id], city = G.CITY_DATA[data.city];
      G.UI.confirm = async () => true; G.UI.say = async () => {}; G.UI.window = () => ({result: Promise.resolve(1)});
      const inactive = crew.find(d => !G.Frontier.mateReady(d));
      check(!await tavern.hireMate(city, inactive), '추첨되지 않은 후보의 직접 고용 차단');
      check(await tavern.hireMate(city, m) && !candidates().includes(m.id), '실제 고용과 중복 모집 차단');
      check(!await tavern.hireMate(city, m), '중복 고용 차단');
      const kept = s.mates.find(x => x.id === m.id);
      s.date.y = 1555;
      check(s.mates.includes(kept) && candidates().length === 2 && !G.MateMove.where(m.id), '주기 변경 후 고용 동료 유지·새 후보 등장');
      s.mates = s.mates.filter(x => x.id !== m.id);
      s.mateDismiss = {[m.id]: {available: true}};
      check(!G.MateDismiss.returning(m.id), '쉬는 기간의 해고 동료 미등장');
      s.date.y = 1554;
      check(G.MateDismiss.returning(m.id) && candidates().includes(m.id), '해당 기간 재고용 가능');
      s.mates.push(kept); delete s.mateDismiss[m.id]; s.date.y = 1550;
      const seed = s.seed;
      delete s.seed; delete s.mateLoc;
      const legacy = selection(1550);
      check(legacy.split(',').length === 2 && candidates().length === (legacy.split(',').includes(m.id) ? 1 : 2) && selection(1554) === legacy, '추가 주기 필드가 없는 옛 저장');
      s.seed = seed;
      check(selection(1550) === data.first, '시작 난수 복원');
      const saved = await G.State.saveAsync(1);
      check(saved.ok, '저장 성공');
      const different = [];
      for (let seed = 1; seed <= 8; seed++) { s.seed = seed; different.push(selection(1550)); }
      check(new Set(different).size > 1, '다른 저장별 무작위 추첨');
      s = G.Game.state = await G.State.loadAsync(1);
      check(selection(1550) === data.first && s.mates.some(x => x.id === m.id) && !candidates().includes(m.id), '저장 복원 후 명단·고용 상태 유지');
      s.date.y = 1549;
      check(!G.Frontier.mateReady(m) && !await tavern.hireMate(city, m), '1550년 이전 직접 고용 차단');
      return '고용·중복 방지·주기 교체·해고 후 복귀·옛 저장·저장 복원';
    });
    await page.goto((process.env.WEB_BASE ? new URL('catalog.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'catalog.html')).href), {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.G && G.JapanCrew && document.readyState === 'complete', null, {timeout: 90000});
    assert(await page.evaluate(() => G.JapanCrew.periodText() === '1550년부터 5년마다 10명 중 2명 등장'));
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({...result, hiring, errors}, null, 2));
    console.log('통과 — 10명·초상 20장·얼굴 자리 20개, ' + result.cycles + '주기·35개 기간, ' + hiring + ', 게임·도감 콘솔 오류 0건');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

async function GLoader(page) { await page.evaluate(async () => { if (G.Loader) await G.Loader.hide(); }); }
