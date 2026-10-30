/* 커피 메뉴 (2026-10-30) — 커피를 팔면 그 문화권 식당에 메뉴가 생기고, 마시면 사교 명성이 오른다
   node tests/coffee_smoke.js  (BROWSER_EXE=크롬 경로) */
'use strict';
const path = require('path'), { pathToFileURL } = require('url');
let pw; try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
const ok = (v, m) => { console.log((v ? '✓ ' : '✗ ') + m); if (!v) process.exitCode = 1; };
(async () => {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE || process.platform === 'win32') opt.executablePath = process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await pw.chromium.launch(opt), errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Coffee, null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1600, m: 5, d: 1 }; s.player.born = { y: 1570, m: 6, d: 10 }; s.player.gold = 100000;
      const T = G.Scenes.city.B.trade, kr = G.CITY_DATA[190], rome = G.CITY_DATA[33], toasts = [];
      const t0 = G.UI.toast; G.UI.toast = m => toasts.push(m);
      const sell = (c, id, q) => { s.fleet.cargo[id] = { q, cost: 50 }; T.sellQty(c, id, q); };
      const o = { n: G.COFFEE.length, zones: new Set(G.COFFEE.map(d => d.zone)).size, bad: G.COFFEE.filter(d => !G.CUISINE.list.some(x => x.zone === d.zone)).map(d => d.id) };
      o.m0 = G.Coffee.menu(kr).length;
      sell(kr, 'coffee', 5); o.m5 = G.Coffee.menu(kr).length;
      sell(kr, 'silk', 30); o.mSilk = G.Coffee.menu(kr).length;
      sell(kr, 'coffee', 20); o.mKr = G.Coffee.menu(kr).map(d => d.name).join('·');
      for (let i = 0; i < 5; i++) sell(rome, 'coffee', 12);
      o.mRome = G.Coffee.menu(rome).map(d => d.name).join('·'); o.mKr2 = G.Coffee.menu(kr).map(d => d.name).join('·');
      o.toasts = toasts.filter(t => /커피 맛/.test(t)).length; G.UI.toast = t0;
      o.row = G.Scenes.city.B.restaurant.menu(kr).map(x => x.label).join(',');
      const so0 = G.Fame.get('so'), d = G.COFFEE_BY.iced_americano, a = G.Coffee.drink(kr, d); o.first = G.Fame.get('so') - so0;
      o.again = G.Coffee.drink(kr, d);
      s.portVisit = (s.portVisit || 0) + 1; s.day += 3; const so1 = G.Fame.get('so'); G.Coffee.drink(kr, d); o.second = G.Fame.get('so') - so1;
      o.closed = G.Coffee.drink(rome, G.COFFEE_BY.buna);
      delete s.coffee; o.old = G.Coffee.menu(kr).length + ':' + G.Coffee.used(kr);
      o.price = a.price;
      return o;
    });
    console.log(JSON.stringify(r));
    ok(r.n === 20 && !r.bad.length, '커피 메뉴 20가지 · 모두 식당이 있는 문화권');
    ok(r.m0 === 0 && r.m5 === 0 && r.mSilk === 0, '처음엔 없음 · 10통 미만·다른 물건은 열지 않음');
    ok(r.mKr === '아이스 아메리카노', '조선(한양)에 커피를 팔면 아이스 아메리카노');
    ok(r.mRome === '에스프레소·카푸치노·마키아토·콘파냐' && r.mKr2 === '아이스 아메리카노', '이탈리아는 팔 때마다 차례로 넷, 다른 문화권 식당에는 안 나옴');
    ok(r.toasts === 5, '열릴 때마다 알림 ' + r.toasts);
    ok(/커피를 마신다/.test(r.row), '식당 메뉴에 「커피를 마신다」');
    ok(r.first === 30 && r.again === 'used' && r.second === 6, '처음 한 잔 사교 명성 +30, 같은 입항 두 번째는 막힘, 다음 입항 +6');
    ok(r.closed === 'closed', '열리지 않은 메뉴는 못 마신다');
    ok(r.old === '0:false', '옛 저장(coffee 없음)');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; }
  finally { ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | ')); await browser.close(); }
})();
