/* 암시장 명검 점검: 대항해시대 2의 야시장 칼이 그 도시의 뒷골목 암시장에 늘 한 자루 나오는지 (js/systems/blackmarket.js BM.SWORDS)
   node tests/bm_swords_smoke.js   (스크린샷: OUT 또는 임시 폴더/bm_swords_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'bm_swords_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  async function city(id) {
    await page.evaluate((id) => { const s = G.Game.state, c = G.CITY_DATA[id]; s.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: id }); }, id);
    await page.waitForFunction((id) => G.Game.sceneName === 'city' && G.Game.state.loc.city === id, id, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
  }
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.player.gold = 2000000; s.player.sk.acct = 3; s.date = { y: 1540, m: 6, d: 1 };
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
    });
    await city(0);

    // ① 열 도시 모두 명검 — 내륙·작은 항구도 암시장이 선다
    const all = await page.evaluate(() => {
      const BM = G.BlackMarket, out = [];
      Object.keys(BM.SWORDS).forEach(id => { const c = G.CITY_DATA[+id], st = BM.stock(c), it = st.items[0]; out.push({ city: c.name, port: c.port, size: c.size, here: BM.here(c), open: BM.open(c), named: !!(it && it.named), id: it && it.id, want: BM.SWORDS[id], n: st.items.length, price: it && it.price }); });
      return out;
    });
    console.log(JSON.stringify(all));
    ok(all.length === 10 && all.every(x => x.here && x.open && x.named && x.id === x.want && x.n === 4), '열 도시의 암시장 맨 위에 그 도시의 명검 + 물건 3가지: ' + all.map(x => x.city + '=' + x.id).join(', '));
    ok(all.filter(x => !x.port || x.size < 2).map(x => x.city).sort().join() === ['통북투', '카이로', '페르남부쿠'].sort().join(), '내륙(통북투·카이로)·작은 항구(페르남부쿠)에도 암시장이 선다');
    const prices = Object.fromEntries(all.map(x => [x.want, x.price]));
    ok(prices.muramasa === 240000 && prices.paladin === 240000 && prices.runeblade === 225000 && prices.shivablade === 180000 && prices.claymore === 9600, '명검 값(×1.5): 무라마사·성기사 240,000 · 룬 225,000 · 시바 180,000 · 클레이모어 9,600');

    // ② 회계 2면 닫힘, 다른 도시(리스본)는 명검 없이 3가지 + 귀띔
    const lis = await page.evaluate(() => {
      const s = G.Game.state, BM = G.BlackMarket, c = G.CITY_DATA[0], tim = G.CITY_DATA[93], T = G.Scenes.city.B.trade;
      s.player.sk.acct = 2; const m2 = T.menu(tim).filter(Boolean).map(m => m.label); const o2 = BM.open(tim);
      s.player.sk.acct = 3; const m3 = T.menu(tim).filter(Boolean).map(m => m.label);
      const st = BM.stock(c), rm = BM.rumor(c);
      return { o2, m2: m2.indexOf('뒷골목 암시장') >= 0, m3: m3.indexOf('뒷골목 암시장') >= 0, n: st.items.length, named: st.items.some(x => x.named), rm, rmPrice: rm && G.ITEM[rm.item].price };
    });
    console.log(JSON.stringify(lis));
    ok(!lis.o2 && !lis.m2 && lis.m3, '통북투 교역소: 회계 2에는 없고 회계 3에 「뒷골목 암시장」');
    ok(lis.n === 3 && !lis.named, '리스본(명검 없는 도시): 예전처럼 물건 3가지');
    ok(lis.rm && lis.rmPrice >= 100000 && /뒷골목/.test(lis.rm.text), '거간꾼의 귀띔: ' + (lis.rm && lis.rm.text));

    // ③ 시대: 무라마사는 1501년부터, 페르남부쿠는 1535년에 세워진다
    const era = await page.evaluate(() => {
      const s = G.Game.state, BM = G.BlackMarket, sak = G.CITY_DATA[192], per = G.CITY_DATA[214];
      s.date = { y: 1490, m: 6, d: 1 };
      const st = BM.stock(sak), r = { sakai: st.items.map(x => x.id), named: st.items.some(x => x.named), perExists: G.R.cityExists(per), rumorCities: [] };
      for (let d = 0; d < 400; d += 30) { s.day += 30; const rm = BM.rumor(G.CITY_DATA[0]); if (rm) r.rumorCities.push(rm.item); }
      s.date = { y: 1540, m: 6, d: 1 };
      return r;
    });
    console.log(JSON.stringify(era));
    ok(!era.named && era.sakai.indexOf('muramasa') < 0 && era.sakai.length === 3, '1490년 사카이: 무라마사는 아직 없다 (' + era.sakai.join(',') + ')');
    ok(!era.perExists && era.rumorCities.indexOf('muramasa') < 0 && era.rumorCities.indexOf('runeblade') < 0, '1490년 귀띔에 무라마사·룬 블레이드는 나오지 않는다 (' + [...new Set(era.rumorCities)].join(',') + ')');

    // ④ 사카이에서 무라마사를 산다 — 값·악명·「팔렸다」·바로 차기
    await city(192);
    const buy = await page.evaluate(async () => {
      const s = G.Game.state, BM = G.BlackMarket, c = G.CITY_DATA[192], C = G.Scenes.city;
      C.say = async () => {}; C.mate = async () => {};
      const gold0 = s.player.gold, noto0 = s.player.notoriety || 0, w0 = s.player.equip.weapon;
      const answers = ['i:muramasa', null]; const asks = [];
      const ch0 = G.UI.choose, cf0 = G.UI.confirm;
      G.UI.choose = async (t, rows, o) => { window.__rows = rows.map(r => r.label + ' | ' + r.right); window.__text = o.text; return answers.shift(); };
      G.UI.confirm = async (t) => { asks.push(t); return true; };
      await BM.visit(c);
      G.UI.choose = ch0; G.UI.confirm = cf0;
      return { paid: gold0 - s.player.gold, noto: (s.player.notoriety || 0) - noto0, has: G.R.hasItem('muramasa'), eq: s.player.equip.weapon, w0, asks, rows: window.__rows, text: window.__text, sold: BM.stock(c).items[0].sold };
    });
    console.log(JSON.stringify(buy));
    ok(buy.rows[0].indexOf('명검 · 요도 무라마사') === 0 && /공격 33/.test(buy.rows[0]), '사카이 암시장 첫 줄: ' + buy.rows[0].replace(/<[^>]+>/g, ''));
    ok(buy.paid === 240000 && buy.noto === 1 && buy.has && buy.sold, '무라마사를 샀다: 240,000닢 · 악명 +1 · 이번 기간에는 「팔렸다」');
    ok(buy.eq === 'muramasa' && buy.asks.some(a => /바로 차겠습니까/.test(a)), '지금 찬 칼(' + buy.w0 + ')보다 나아서 바로 찼다');
    ok(/귀띔/.test(buy.text), '암시장 안내에 거간꾼의 귀띔');

    // ⑤ 일기토의 공격 갈래 · 시장·전리품에 안 나옴 · 그림
    const misc = await page.evaluate(() => {
      const ids = ['claymore', 'shivablade', 'runeblade', 'paladin', 'muramasa'];
      return { style: ids.map(id => G.Games.weaponStyle(id)), rare: ids.every(id => G.ITEM[id].rare && !G.ITEM[id].reg.length), img: ids.map(id => !!G.Img.itemSrc({ id })) };
    });
    ok(misc.style.join() === 'bash,slash,slash,slash,slash', '일기토 공격 갈래: 클레이모어 치기, 나머지 베기');
    ok(misc.rare, '새 칼 다섯 자루는 시장·해적 전리품에 나오지 않는다 (rare · 파는 고장 없음)');
    ok(misc.img.every(Boolean), '새 칼 그림 5장 (images/items)');

    // 화면: 사카이·통북투 암시장
    for (const [id, name] of [[192, 'sakai'], [93, 'timbuktu']]) {
      await city(id);
      await page.evaluate((id) => { const C = G.Scenes.city; C.say = async () => {}; G.Game.state.day += 31; G.BlackMarket.visit(G.CITY_DATA[id]); }, id);
      await page.waitForSelector('.win', { timeout: 10000 }); await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT, 'bm_' + name + '.png') });
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    }
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
