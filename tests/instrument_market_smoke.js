/* 지역 악기: 입고·구매·매각·저장·그림·도감. node tests/instrument_market_smoke.js */
'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const root = path.resolve(__dirname, '..');
const out = process.env.OUT || path.join(root, 'artifacts', 'instruments-20261101');
fs.mkdirSync(out, { recursive: true });
const extraTrades = [{ id: 'handbell', name: '핸드벨', city: 14 }, { id: 'sleighbells', name: '슬레이벨', city: 14 }, { id: 'cowbell', name: '카우벨', city: 14 }, { id: 'agogo', name: '아고고', city: 98 }, { id: 'ghanta', name: '간타', city: 139 }, { id: 'tingsha', name: '팅샤', city: 139 }, { id: 'suzu', name: '스즈', city: 191 }, { id: 'pyeonjong', name: '편종', city: 190 }, { id: 'bianzhong', name: '중국 편종', city: 180 }, { id: 'woodblock', name: '우드블록', city: 14 }, { id: 'claves', name: '클라베스', city: 196 }, { id: 'guiro', name: '귀로', city: 196 }, { id: 'cabasa', name: '카바사', city: 196 }, { id: 'caxixi', name: '카시시', city: 98 }, { id: 'sistrum', name: '시스트럼', city: 98 }, { id: 'manjira', name: '만지라', city: 150 }, { id: 'castanets', name: '캐스터네츠', city: 0 }, { id: 'triangle', name: '트라이앵글', city: 14 }];
(async () => {
  const executablePath = process.env.BROWSER_EXE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  try {
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const report = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '악기 시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, R = G.R, MK = G.Scenes.city.B.market;
      s.settings.res = 0.35;
      const instruments = G.ITEMS.filter(it => it.kind === 'instrument');
      const fail = (ok, message) => { if (!ok) throw new Error(message); };
      fail(instruments.length === 186, '악기 186종');
      fail(new Set(instruments.map(it => it.id)).size === 186, '악기 ID 중복');
      const required = ['가야금', '거문고', '장구', '태평소', '기타', '베이스', '드럼', '아코디언', '백파이프', '오르간', '피아노', '바이올린', '비올라', '첼로', '하프'];
      required.forEach(name => fail(instruments.some(it => it.name === name), name + ' 누락'));
      const requested = ['harmonica', 'ajaeng', 'kkwaenggwari', 'jing', 'singingbowl', 'panflute', 'moktak'];
      const percussionNew = ['handbell', 'sleighbells', 'cowbell', 'agogo', 'ghanta', 'tingsha', 'suzu', 'pyeonjong', 'bianzhong', 'woodblock', 'claves', 'guiro', 'cabasa', 'caxixi', 'sistrum', 'manjira'];
      const artIds = requested.concat(percussionNew, ['castanets', 'triangle']);
      percussionNew.forEach(id => fail(G.ITEM[id] && G.ITEM[id].tradition && !G.ITEM[id].military, '종·소형 타악기 신규 품목: ' + id));
      fail(G.ITEM.pyeonjong.subRegion === '조선' && G.ITEM.bianzhong.subRegion === '중국', '조선·중국 편종 판매처 구분');
      fail(instruments.filter(it => it.id === 'castanets').length === 1 && instruments.filter(it => it.id === 'triangle').length === 1, '기존 캐스터네츠·트라이앵글 ID 유지');
      requested.forEach(id => fail(instruments.filter(it => it.id === id).length === 1, '요청 악기·중복 없음: ' + id));
      fail(G.ITEM.moktak.reg.join(',') === '6' && G.ITEM.moktak.subRegion === '조선' && G.ITEM.moktak.shape === 'moktak' && !G.ITEM.moktak.marketRel, '목탁 조선 판매·외형·종교 제한 없음');
      fail(G.ITEM.singingbowl.reg.join(',') === '5,7' && G.ITEM.singingbowl.shape === 'singingbowl', '싱잉볼 판매처·주발 외형');
      fail(G.ITEM.panflute.reg.join(',') === '1,2' && G.ITEM.panflute.aliases.includes('팬플룻'), '팬플루트 판매처·입력 이름 검색 호환');
      fail(G.ITEM.panflute.id !== G.ITEM.zampona.id && G.ITEM.panflute.shape !== G.ITEM.zampona.shape, '유럽 팬플루트·안데스 삼포냐 구분');
      await G.Img.preload(artIds.map(id => G.Img.chain.item(G.ITEM[id])));
      artIds.forEach(id => {
        const key = G.Img.pick(G.Img.chain.item(G.ITEM[id]));
        fail(key === 'items/' + id && G.Img.get(key).naturalWidth === 256, '전용 악기 원화 연결: ' + id);
      });
      ['ajaeng', 'kkwaenggwari', 'jing'].forEach(id => fail(G.ITEM[id].reg.length === 1 && G.ITEM[id].reg[0] === 6 && G.ITEM[id].subRegion === '조선', '국악기 조선 판매: ' + id));
      fail(G.ITEM.ajaeng.strings === 7 && G.ITEM.ajaeng.aliases.includes('어쟁'), '아쟁 일곱 줄·입력 이름 검색 호환');
      const orchestra = {
        strings: ['violin', 'viola', 'cello', 'doublebass', 'harp'],
        woodwind: ['flute', 'piccolo', 'oboe', 'englishhorn', 'clarinet', 'bassclarinet', 'eflatclarinet', 'contrabassclarinet', 'bassoon', 'contrabassoon', 'saxophone'],
        brass: ['frenchhorn', 'trumpet', 'cornet', 'trombone', 'basstrombone', 'tuba'],
        percussion: ['timpani', 'snaredrum', 'tenordrum', 'bassdrum', 'cymbals', 'suspendedcymbal', 'triangle', 'tambourine', 'tamtam', 'glockenspiel', 'xylophone', 'marimba', 'vibraphone', 'tubularbells', 'crotales'],
        keyboards: ['piano', 'organ', 'celesta', 'harpsichord']
      };
      Object.keys(orchestra).forEach(family => orchestra[family].forEach(id => {
        fail(G.ITEM[id] && G.ITEM[id].kind === 'instrument' && [1, 2].every(reg => G.ITEM[id].reg.includes(reg)), '오케스트라 품목·유럽 판매처: ' + id);
      }));
      fail(G.ITEM.doublebass.id !== G.ITEM.bass.id && G.ITEM.bassdrum.id !== G.ITEM.drums.id, '베이스·드럼과 오케스트라 악기 구분');
      const traditions = {
        medieval: ['vielle', 'rebec', 'hurdygurdy', 'psaltery', 'gittern', 'citole', 'crwth', 'lyre', 'shawm', 'crumhorn', 'cornett', 'sackbut', 'portativeorgan', 'taborpipe', 'tabordrum', 'nakers', 'dulcimer', 'medievaltrumpet', 'gemshorn', 'bladderpipe'],
        islamic: ['rabab', 'kamancheh', 'tanbur', 'setar', 'santur', 'chang', 'rubab', 'saz', 'zurna', 'mizmar', 'arghul', 'nafir', 'karna', 'davul', 'naqqara', 'daf', 'riq', 'bendir', 'qraqeb', 'gasba']
      };
      Object.keys(traditions).forEach(culture => traditions[culture].forEach(id => {
        const it = G.ITEM[id];
        fail(it && it.kind === 'instrument' && it.tradition && (culture === 'islamic' ? it.marketRel === 'I' : it.tradition.includes('유럽')), '고악기 전통·판매 조건: ' + id);
      }));
      fail(G.ITEM.cornett.id !== G.ITEM.cornet.id && G.ITEM.rabab.id !== G.ITEM.rubab.id, '코르네토/코넷·활 라바브/발현 루밥 구분');
      const militaryNew = ['bugle', 'fife', 'euphonium', 'baritonehorn', 'tenorhorn', 'flugelhorn', 'sousaphone', 'serpent', 'sopranosax', 'tenorsax', 'baritonesax', 'marchingsnare', 'marchingbass', 'marchingtenors', 'belllyra', 'signalwhistle', 'kos', 'cevgen', 'boru', 'nabal', 'nagak', 'jing', 'yonggo', 'jabara', 'piri', 'sogeum', 'unra', 'horagai', 'suona', 'tanggu'];
      militaryNew.forEach(id => fail(G.ITEM[id] && G.ITEM[id].kind === 'instrument' && G.ITEM[id].military, '신규 군악기: ' + id));
      const militaryIds = instruments.filter(it => it.military).map(it => it.id);
      fail(militaryIds.length === 59 && militaryIds.includes('trumpet') && militaryIds.includes('taepyeongso') && militaryIds.includes('davul'), '기존·신규 군악기 59종 표시');
      fail(G.ITEM.bugle.shape !== G.ITEM.trumpet.shape && G.ITEM.marchingsnare.id !== G.ITEM.snaredrum.id && G.ITEM.nagak.id !== G.ITEM.nabal.id, '신호 나팔·행진용 북·나각/나발 구분');
      const regionalNew = ['shekere', 'veena', 'komuz', 'igil', 'kendang', 'suling', 'ocarina'];
      regionalNew.forEach(id => fail(G.ITEM[id] && !G.ITEM[id].marketRel && G.ITEM[id].tradition, '지역 기본 악기 보강: ' + id));
      const regionalCore = [
        { name: '이베리아', reg: 0, ids: ['guitar', 'castanets', 'gittern', 'citole', 'taborpipe'] },
        { name: '북유럽', reg: 1, ids: ['bagpipes', 'crwth', 'lyre', 'recorder', 'hurdygurdy'] },
        { name: '지중해', reg: 2, ids: ['lute', 'mandolin', 'rebec', 'shawm', 'portativeorgan'] },
        { name: '아프리카', reg: 3, ids: ['djembe', 'kora', 'mbira', 'balafon', 'shekere'] },
        { name: '중근동', reg: 4, ids: ['oud', 'qanun', 'ney', 'darbuka', 'santur'] },
        { name: '인도', reg: 5, ids: ['sitar', 'sarod', 'tabla', 'bansuri', 'veena'] },
        { name: '조선', reg: 6, subRegion: '조선', ids: ['gayageum', 'geomungo', 'janggu', 'taepyeongso', 'daegeum'] },
        { name: '중국', reg: 6, subRegion: '중국', ids: ['guzheng', 'pipa', 'erhu', 'dizi', 'sheng'] },
        { name: '중앙아시아', reg: 7, ids: ['dombra', 'morinkhuur', 'dutar', 'komuz', 'igil'] },
        { name: '동남아시아', reg: 8, ids: ['gamelan', 'angklung', 'ranat', 'kendang', 'suling'] },
        { name: '일본', reg: 9, ids: ['koto', 'shamisen', 'shakuhachi', 'taiko', 'horagai'] },
        { name: '아메리카', reg: 10, ids: ['quena', 'zampona', 'charango', 'maracas', 'ocarina'] }
      ];
      regionalCore.forEach(group => {
        fail(new Set(group.ids).size >= 5, '지역 고유 악기 최소 5종: ' + group.name);
        group.ids.forEach(id => fail(G.ITEM[id] && G.ITEM[id].reg.includes(group.reg) && (!group.subRegion || G.ITEM[id].subRegion === group.subRegion), '지역 대표 악기 판매처: ' + group.name + '/' + id));
      });
      instruments.forEach(it => {
        fail(G.ITEM[it.id] === it && !(G.RELIC && G.RELIC[it.id]), '다른 데이터와 ID 충돌: ' + it.id);
        fail(it.price > 0 && !it.rare && !it.from, '시작부터 판매: ' + it.id);
        fail(G.ItemCat.of({ id: it.id }) === 'instrument', '소지품 분류: ' + it.id);
        const cv = G.Art.relicArt(it, 128, 128, { transparent: true });
        const pixels = cv.getContext('2d').getImageData(0, 0, 128, 128).data;
        let filled = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 100) filled++;
        fail(filled > 200 && pixels[3] === 0, '악기 그림·투명 배경: ' + it.id);
      });
      fail(G.ItemCat.ORDER.includes('instrument') && G.ITEM_KIND.instrument === '악기', '악기 분류 순서');
      const seen = new Set(), regions = new Set(), originalDay = s.day, regionalMinimum = {};
      fail(G.BALANCE.marketInstrumentMin === 5, '시장 악기 최소 진열 5종');
      for (let cycle = 0; cycle < 5; cycle++) {
        s.day = originalDay + cycle * 45;
        G.CITY_DATA.forEach(c => {
          const stock = MK.stock(c), arts = stock.filter(it => it.kind === 'instrument'), label = G.regionLabel(c);
          fail(arts.length >= G.BALANCE.marketInstrumentMin, '실제 시장 최소 5종: ' + c.name + ' / ' + arts.length);
          fail(new Set(stock.map(it => it.id)).size === stock.length, '중복 진열 없음: ' + c.name);
          fail(stock.map(it => it.id).join(',') === MK.stock(c).map(it => it.id).join(','), '같은 도시·입고 주기는 같은 진열: ' + c.name);
          regionalMinimum[label] = Math.min(regionalMinimum[label] == null ? Infinity : regionalMinimum[label], arts.length);
          arts.forEach(it => {
            fail(it.reg.includes(c.region), '다른 지역 입고: ' + it.id + ' / ' + c.name);
            fail(!it.subRegion || it.subRegion === G.subRegion(c), '조선·중국 판매 구분: ' + it.id + ' / ' + c.name);
            fail(!it.marketRel || it.marketRel === c.rel, '이슬람 문화권 판매 구분: ' + it.id + ' / ' + c.name);
            seen.add(it.id); regions.add(c.region);
          });
        });
      }
      fail(seen.size === 186 && regions.size === 11 && Object.keys(regionalMinimum).length === 12, '모든 악기와 12개 문화권 입고');
      s.day = originalDay;
      while (!MK.stock(G.CITY_DATA[14]).some(it => it.id === 'trumpet')) s.day += 45;
      s.player.gold = 300000;
      G.Game.go('city', { cityId: 14, load: true });
      return { total: instruments.length, regions: regions.size, requested, artIds, percussionNew, regionalCore, regionalNew, regionalMinimum, orchestra, traditions, militaryNew, militaryIds, shapes: new Set(instruments.map(it => it.shape)).size, names: instruments.map(it => it.name) };
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city');
    await page.evaluate(() => {
      // 인사 대화만 생략하고 구입·수량·확인·매각 창은 실제 화면으로 조작한다.
      G.Scenes.city.say = async () => {};
      window.__goldBefore = G.Game.state.player.gold;
      window.__unit = G.Scenes.city.B.market.price(G.ITEM.trumpet);
      G.Scenes.city.B.market.buy(G.CITY_DATA[14]);
    });
    await page.locator('.choice-cats [data-cat="instrument"]').click();
    const visible = page.locator('.choices .choice:visible');
    assert(await visible.count() > 0);
    assert((await visible.allTextContents()).every(t => t.includes('악기')));
    await page.screenshot({ path: path.join(out, 'market-buy.png') });
    await page.locator('.choice:visible').filter({ hasText: /^트럼펫 / }).click();
    await page.locator('.win .nfield').fill('2');
    await page.locator('.win .foot .btn.navy').click();
    await page.locator('.item-show').waitFor();
    assert.equal(await page.locator('.item-show img').count(), 1);
    await page.locator('.win .foot .btn.navy').click();
    await page.waitForFunction(() => G.R.itemCount('trumpet') === 2);
    await page.locator('.choices').waitFor();
    await page.locator('.win .title .x').click();
    const bought = await page.evaluate(() => {
      const R = G.R, s = G.Game.state;
      const loaded = G.State.deserialize(G.State.serialize());
      const it = loaded.player.items.find(it => it.id === 'trumpet');
      return { qty: R.itemQty(it), cost: window.__goldBefore - s.player.gold, expected: window.__unit * 2, paid: R.paidAt(s.player.items.find(it => it.id === 'trumpet'), 14), unit: window.__unit };
    });
    assert.equal(bought.qty, 2);
    assert.equal(bought.cost, bought.expected);
    assert.equal(bought.paid, bought.unit);
    await page.evaluate(() => {
      window.__sellUnit = G.Scenes.city.B.market.sellValue(G.Game.state.player.items.find(it => it.id === 'trumpet'));
      window.__goldBefore = G.Game.state.player.gold;
      G.Scenes.city.B.market.sell(G.CITY_DATA[14]);
    });
    const row = page.locator('tr[data-icat="instrument"]').filter({ hasText: '트럼펫' });
    await row.locator('.mq').fill('1');
    await row.locator('.mq').dispatchEvent('input');
    await page.screenshot({ path: path.join(out, 'market-sell.png') });
    await page.locator('.win .foot .btn').filter({ hasText: '고른 것을 판다' }).click();
    await page.locator('.win .foot .btn.navy').click();
    await page.waitForFunction(() => G.R.itemCount('trumpet') === 1);
    assert(await page.evaluate(() => G.Game.state.player.gold - window.__goldBefore === window.__sellUnit));
    await page.locator('.win .title .x').click();
    await page.evaluate(() => {
      G.Game.state.player.items = G.Game.state.player.items.filter(it => G.ITEM[it.id] && G.ITEM[it.id].kind === 'instrument');
      G.R.addItem('janggu'); G.Info.open('items');
    });
    await page.locator('[data-icf="instrument"]').click();
    assert.equal(await page.locator('.items-tbl tr').count(), 3);
    await page.screenshot({ path: path.join(out, 'inventory.png') });
    const traditionTrades = [];
    for (const item of [{ id: 'hurdygurdy', city: 14, name: '허디거디' }, { id: 'santur', city: 132, name: '산투르' }, { id: 'bugle', city: 14, name: '뷰글' }, { id: 'yonggo', city: 190, name: '용고' }, { id: 'kos', city: 112, name: '쾨스' }, { id: 'kendang', city: 160, name: '큰당' }, { id: 'shekere', city: 98, name: '셰케레' }, { id: 'harmonica', city: 14, name: '하모니카' }, { id: 'ajaeng', city: 190, name: '아쟁' }, { id: 'kkwaenggwari', city: 190, name: '꽹과리' }, { id: 'jing', city: 190, name: '징' }, { id: 'singingbowl', city: 139, name: '싱잉볼' }, { id: 'panflute', city: 14, name: '팬플루트' }, { id: 'moktak', city: 190, name: '목탁' }].concat(extraTrades)) {
      await page.locator('.win .title .x').click();
      await page.evaluate(data => {
        const MK = G.Scenes.city.B.market, s = G.Game.state;
        let attempts = 0;
        while (!MK.stock(G.CITY_DATA[data.city]).some(it => it.id === data.id) && attempts++ < 20) s.day += 45;
        if (attempts >= 20) throw new Error('시험 악기 입고 실패: ' + data.id);
        G.Game.go('city', { cityId: data.city, load: true });
        if (G.Scenes.city.city().id !== data.city) throw new Error('시험 시장 위치 불일치: ' + data.id);
        window.__goldBefore = s.player.gold;
        window.__unit = MK.price(G.ITEM[data.id]);
        MK.buy(G.CITY_DATA[data.city]);
      }, item);
      await page.locator('.choice-cats [data-cat="instrument"]').click();
      if (item.id === 'kendang' || item.id === 'shekere') {
        assert(await page.locator('.choices .choice:visible').count() >= 5);
        await page.screenshot({ path: path.join(out, 'market-buy-' + item.id + '.png') });
      }
      await page.locator('.choice:visible').filter({ hasText: new RegExp('^' + item.name + ' ') }).click();
      await page.locator('.win .nfield').fill('2');
      await page.locator('.win .foot .btn.navy').click();
      await page.locator('.item-show').waitFor();
      if (report.artIds.includes(item.id)) {
        const img = page.locator('.item-show img');
        await img.evaluate(el => el.decode());
        assert((await img.getAttribute('src')).endsWith('/items/' + item.id + '.webp'));
        assert.equal(await img.evaluate(el => el.naturalWidth), 256);
        await page.screenshot({ path: path.join(out, 'art-purchase-' + item.id + '.png') });
      }
      await page.locator('.win .foot .btn.navy').click();
      await page.waitForFunction(id => G.R.itemCount(id) === 2, item.id);
      await page.locator('.choices').waitFor();
      await page.locator('.win .title .x').click();
      const purchase = await page.evaluate(data => {
        const s = G.Game.state, R = G.R;
        const restored = G.State.deserialize(G.State.serialize()).player.items.find(it => it.id === data.id);
        const result = { id: data.id, qty: R.itemQty(restored), cost: window.__goldBefore - s.player.gold, expected: window.__unit * 2 };
        window.__goldBefore = s.player.gold;
        window.__sellUnit = G.Scenes.city.B.market.sellValue(s.player.items.find(it => it.id === data.id));
        G.Scenes.city.B.market.sell(G.CITY_DATA[data.city]);
        return result;
      }, item);
      assert.equal(purchase.qty, 2); assert.equal(purchase.cost, purchase.expected);
      const saleRow = page.locator('tr[data-icat="instrument"]').filter({ hasText: item.name });
      await saleRow.locator('.mq').fill('1'); await saleRow.locator('.mq').dispatchEvent('input');
      await page.screenshot({ path: path.join(out, 'market-' + item.id + '.png') });
      await page.locator('.win .foot .btn').filter({ hasText: '고른 것을 판다' }).click();
      await page.locator('.win .foot .btn.navy').click();
      await page.waitForFunction(id => G.R.itemCount(id) === 1, item.id);
      assert(await page.evaluate(() => G.Game.state.player.gold - window.__goldBefore === window.__sellUnit));
      traditionTrades.push(purchase);
      // 매각 뒤 다시 열린 목록은 다음 순환 시작에서 닫는다.
      await page.locator('table.mksell').waitFor();
    }
    await page.locator('.win .title .x').click();
    await page.evaluate(() => { G.Info.open('items'); });
    await page.locator('[data-icf="instrument"]').click();
    assert(await page.evaluate(ids => ids.every(id => {
      const cell = [...document.querySelectorAll('[data-ic]')].find(td => G.Game.state.player.items[+td.dataset.ic].id === id);
      const cv = cell && cell.querySelector('canvas');
      const expected = G.Img.make(G.Img.chain.item(G.ITEM[id]), 96, 96, () => { throw new Error('원화 누락'); }, { fit: 'contain' });
      return cv && cv.toDataURL() === expected.toDataURL();
    }), report.artIds), '소지품 전용 악기 원화 픽셀 일치');
    await page.screenshot({ path: path.join(out, 'art-inventory.png') });
    await page.evaluate(async () => {
      await G.Img.preload(G.ITEMS.filter(it => it.kind === 'instrument').map(it => G.Img.chain.item(it)));
      const grid = document.createElement('div'); grid.id = 'instrument-preview';
      grid.style.cssText = 'position:fixed;inset:0;overflow:auto;z-index:99999;background:#e7d8b4;color:#352718;display:grid;grid-template-columns:repeat(8,1fr);font:14px sans-serif;gap:6px;padding:12px';
      G.ITEMS.filter(it => it.kind === 'instrument').forEach(it => {
        const cell = document.createElement('div'); cell.style.textAlign = 'center'; cell.dataset.item = it.id;
        const cv = G.Img.make(G.Img.chain.item(it), 110, 110, () => G.Art.relicArt(it, 110, 110, { transparent: true }), { fit: 'contain' }); cell.append(cv, document.createElement('br'), it.name); grid.append(cell);
      }); document.body.append(grid);
    });
    await page.setViewportSize({ width: 1100, height: Math.ceil(report.total / 8) * 150 + 24 });
    await page.screenshot({ path: path.join(out, 'instruments-preview.png') });
    await page.evaluate(ids => {
      document.querySelectorAll('#instrument-preview > div').forEach(cell => { cell.style.display = ids.includes(cell.dataset.item) ? '' : 'none'; });
    }, Object.values(report.traditions).flat());
    await page.setViewportSize({ width: 1100, height: 774 });
    await page.screenshot({ path: path.join(out, 'medieval-islamic-preview.png') });
    await page.evaluate(ids => {
      document.querySelectorAll('#instrument-preview > div').forEach(cell => { cell.style.display = ids.includes(cell.dataset.item) ? '' : 'none'; });
    }, report.militaryNew);
    await page.setViewportSize({ width: 1100, height: 624 });
    await page.screenshot({ path: path.join(out, 'military-preview.png') });
    await page.evaluate(ids => {
      document.querySelectorAll('#instrument-preview > div').forEach(cell => { cell.style.display = ids.includes(cell.dataset.item) ? '' : 'none'; });
    }, report.regionalNew);
    await page.setViewportSize({ width: 1100, height: 180 });
    await page.screenshot({ path: path.join(out, 'regional-minimum-preview.png') });
    await page.evaluate(ids => {
      document.querySelectorAll('#instrument-preview > div').forEach(cell => { cell.style.display = ids.includes(cell.dataset.item) ? '' : 'none'; });
    }, report.requested);
    await page.screenshot({ path: path.join(out, 'harmonica-ajaeng-preview.png') });
    await page.evaluate(ids => {
      const grid = document.querySelector('#instrument-preview');
      grid.innerHTML = ''; grid.style.gridTemplateColumns = 'repeat(7,1fr)';
      ids.forEach(id => {
        const it = G.ITEM[id], cell = document.createElement('div');
        cell.style.cssText = 'text-align:center;background:#eee1c1;border:1px solid #af9064;padding:8px';
        cell.append(it.name, document.createElement('br'), '기존 코드 그림', document.createElement('br'),
          G.Art.relicArt(it, 224, 224, { transparent: true }), document.createElement('br'),
          '교역품 수준 전용 원화', document.createElement('br'),
          G.Img.make(G.Img.chain.item(it), 224, 224, () => { throw new Error('전용 원화 누락: ' + id); }, { fit: 'contain' }));
        grid.append(cell);
      });
    }, report.requested);
    await page.setViewportSize({ width: 1850, height: 580 });
    await page.screenshot({ path: path.join(out, 'instrument-art-before-after.png') });
    await page.evaluate(ids => {
      const grid = document.querySelector('#instrument-preview');
      grid.innerHTML = ''; grid.style.gridTemplateColumns = 'repeat(6,1fr)';
      ids.forEach(id => {
        const it = G.ITEM[id], cell = document.createElement('div');
        cell.style.cssText = 'text-align:center;background:#eee1c1;border:1px solid #af9064;height:194px;padding:3px';
        cell.append(G.Img.make(G.Img.chain.item(it), 160, 160, () => { throw new Error('원화 누락'); }, { fit: 'contain' }), document.createElement('br'), it.name);
        grid.append(cell);
      });
    }, report.percussionNew.concat(['castanets', 'triangle']));
    await page.setViewportSize({ width: 1100, height: 650 });
    await page.screenshot({ path: path.join(out, 'bells-small-percussion-preview.png') });
    await page.setViewportSize({ width: 1100, height: 774 });
    await page.goto(pathToFileURL(path.join(root, 'catalog.html')).href + '#items');
    await page.locator('[data-chip="instrument"]').click();
    assert.equal(await page.locator('#grid .card').count(), 186);
    assert.equal(await page.evaluate(() => G.ITEMS.filter(it => it.kind === 'instrument').length), 186);
    await page.locator('#grid .card').filter({ hasText: '가야금' }).click();
    await page.locator('#dHero canvas').waitFor();
    assert((await page.locator('#dBody').innerText()).includes('조선'));
    assert((await page.locator('#dBody').innerText()).includes('45일마다'));
    await page.screenshot({ path: path.join(out, 'catalog-gayageum.png') });
    await page.locator('#detail').evaluate(el => el.close());
    await page.locator('#grid .card').filter({ hasText: '트럼펫' }).click();
    await page.locator('#dHero canvas').waitFor();
    assert((await page.locator('#dBody').innerText()).includes('북유럽 · 지중해'));
    await page.screenshot({ path: path.join(out, 'catalog-trumpet.png') });
    for (const item of [{ name: '허디거디', culture: '중세 유럽' }, { name: '산투르', culture: '이슬람권 · 페르시아·중앙아시아' }]) {
      await page.locator('#detail').evaluate(el => el.close());
      await page.locator('#grid .card').filter({ hasText: item.name }).click();
      await page.locator('#dHero canvas').waitFor();
      const detail = await page.locator('#dBody').innerText();
      assert(detail.includes(item.culture));
      if (item.name === '산투르') assert(detail.includes('이슬람 문화권 도시'));
    }
    await page.locator('#detail').evaluate(el => el.close());
    await page.locator('#q').fill('군악');
    await page.waitForFunction(count => document.querySelectorAll('#grid .card').length === count, report.militaryIds.length, { polling: 100 });
    await page.screenshot({ path: path.join(out, 'catalog-military.png') });
    await page.locator('#grid .card').filter({ hasText: '용고' }).click();
    await page.locator('#dHero canvas').waitFor();
    const militaryDetail = await page.locator('#dBody').innerText();
    assert(militaryDetail.includes('군악 용도') && militaryDetail.includes('전통 군악 장단') && militaryDetail.includes('조선'));
    await page.locator('#detail').evaluate(el => el.close());
    await page.locator('#q').fill('어쟁');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card').length === 1 && document.querySelector('#grid .card .name').textContent === '아쟁', null, { polling: 100 });
    await page.locator('#grid .card').click();
    await page.locator('#dHero canvas').waitFor();
    const ajaengDetail = await page.locator('#dBody').innerText();
    assert(ajaengDetail.includes('일곱 줄') && ajaengDetail.includes('조선'));
    for (const id of report.artIds) {
      await page.locator('#detail').evaluate(el => el.close());
      const name = await page.evaluate(id => G.ITEM[id].name, id);
      await page.locator('#q').fill(name);
      await page.locator('#grid .card .name').filter({ hasText: new RegExp('^' + name + '$') }).click();
      await page.locator('#dHero canvas').waitFor();
      assert.equal(await page.locator('#dTitle').innerText(), name);
      assert(await page.evaluate(id => {
        const cv = document.querySelector('#dHero canvas');
        const expected = G.Img.make(G.Img.chain.item(G.ITEM[id]), cv.width, cv.height, () => { throw new Error('원화 누락'); }, { fit: 'contain' });
        return cv.toDataURL() === expected.toDataURL();
      }, id), '도감 원화 픽셀 일치: ' + id);
      await page.screenshot({ path: path.join(out, 'art-catalog-' + id + '.png') });
    }
    await page.locator('#detail').evaluate(el => el.close());
    await page.locator('#q').fill('팬플룻');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card').length === 1 && document.querySelector('#grid .card .name').textContent === '팬플루트', null, { polling: 100 });
    await page.screenshot({ path: path.join(out, 'catalog-panflute-alias.png') });
    for (const group of [{ q: '종 계열', count: 10 }, { q: '소형 타악기', count: 9 }, { q: '캐스터넷', count: 1 }, { q: '삼각철', count: 1 }]) {
      await page.locator('#q').fill(group.q);
      await page.waitForFunction(data => document.querySelectorAll('#grid .card').length === data.count && document.querySelector('#q').value === data.q, group, { polling: 100 });
      if (group.count > 1) await page.screenshot({ path: path.join(out, group.count === 10 ? 'catalog-bells.png' : 'catalog-small-percussion.png') });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ ...report, bought, traditionTrades, errors }, null, 2));
    console.log('통과: 악기 186종·종/소형 타악기 거래·어쟁/팬플룻 검색·12개 문화권 최소 5종·군악/전통/오케스트라·저장·그림·도감·콘솔 오류 0');
    console.log(out);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
