/* 시장 악기: 최대 3종, 7일 교체, 저장·재방문 유지, 기존 일반 물건 입고 보존. */
'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'artifacts/instrument-weekly-20261103');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
    await page.addInitScript(() => { requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Scenes && G.Scenes.city, null, { polling: 100 });
    const report = await page.evaluate(() => {
      const s = G.State.newGame({ name: '주간 악기 검사', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const MK = G.Scenes.city.B.market, check = (ok, msg) => { if (!ok) throw new Error(msg); };
      const ids = a => a.map(it => it.id).sort().join(','), arts = c => MK.stock(c).filter(it => it.kind === 'instrument');
      const seen = new Set(); let checks = 0;
      G.CITY_DATA.forEach(c => {
        let previous;
        for (let week = 0; week < 20; week++) {
          s.day = week * 7;
          const list = arts(c), key = ids(list);
          check(list.length > 0 && list.length <= 3 && new Set(list).size === list.length, '진열 상한·중복: ' + c.name);
          check(key !== previous, '지난주와 같은 진열: ' + c.name + '/' + week);
          list.forEach(it => {
            check(it.reg.includes(c.region) && (!it.subRegion || it.subRegion === G.subRegion(c)) && (!it.marketRel || it.marketRel === c.rel), '지역 조건: ' + c.name + '/' + it.id);
            seen.add(it.id);
          });
          for (let offset = 1; offset < 7; offset++) {
            s.day = week * 7 + offset;
            check(ids(arts(c)) === key, '주중 재추첨: ' + c.name + '/' + s.day); checks++;
          }
          previous = key;
        }
        // 악기 추첨을 분리하면서 기존 일반 물건의 45일 입고 난수 순서가 바뀌지 않았는지 비교한다.
        [0, 6, 7, 44, 45, 46].forEach(day => {
          s.day = day;
          const rng = G.U.makeRng(c.id * 7717 + Math.floor(day / 45));
          const always = s.player.home === c.id ? G.BALANCE.homeTools : [];
          const eligible = G.ITEMS.filter(it => it.price > 0 && !it.rare && (always.includes(it.id) || it.reg.includes(c.region) && (!it.subRegion || G.subRegion(c) === it.subRegion) && (!it.marketRel || c.rel === it.marketRel) && (!it.from || s.date.y >= it.from)));
          const expected = eligible.filter(it => rng() < .7 || it.id === 'lime' || always.includes(it.id)).filter(it => it.kind !== 'instrument');
          check(ids(MK.stock(c).filter(it => it.kind !== 'instrument')) === ids(expected), '일반 물건 입고 변경: ' + c.name + '/' + day);
        });
      });
      // 판매 후보가 0~3종뿐인 경우에도 지역 밖 물건·희귀품·미래 물건을 채워 넣지 않는다.
      const all = G.ITEMS, city = G.CITY_DATA[0];
      try {
        for (let count = 0; count <= 3; count++) {
          G.ITEMS = Array.from({ length: count }, (_, i) => ({ id: 'weekly-test-' + i, kind: 'instrument', price: 10, reg: [city.region] })).concat([
            { id: 'rare-test', kind: 'instrument', price: 10, reg: [city.region], rare: true },
            { id: 'future-test', kind: 'instrument', price: 10, reg: [city.region], from: s.date.y + 1 },
            { id: 'foreign-test', kind: 'instrument', price: 10, reg: [-1] }
          ]);
          check(arts(city).length === count, '후보 부족 처리: ' + count);
        }
      } finally { G.ITEMS = all; }
      s.day = 45;
      const saved = G.State.serialize(), before = G.CITY_DATA.map(c => ids(arts(c)));
      localStorage.setItem('weekly-test-save', saved);
      return { cities: G.CITY_DATA.length, weeks: 20, stableDayChecks: checks, seen: seen.size, before };
    });
    await page.reload();
    await page.waitForFunction(() => window.G && G.Scenes && G.Scenes.city, null, { polling: 100 });
    const after = await page.evaluate(() => {
      G.Game.state = G.State.deserialize(localStorage.getItem('weekly-test-save'));
      localStorage.removeItem('weekly-test-save');
      return G.CITY_DATA.map(c => G.Scenes.city.B.market.stock(c).filter(it => it.kind === 'instrument').map(it => it.id).sort().join(','));
    });
    assert.deepEqual(after, report.before, '브라우저 재실행·저장 불러오기 뒤에도 같은 주간 진열');
    assert.deepEqual(errors, []);
    delete report.before;
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ ...report, saveReload: true, errors }, null, 2));
    console.log('통과: ' + report.cities + '개 도시·20주·주중 ' + report.stableDayChecks + '회 유지·일반 물건 입고 보존·후보 부족·저장 재실행·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
