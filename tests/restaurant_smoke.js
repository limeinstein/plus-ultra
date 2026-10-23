/* 도시 식당 점검 — node tests/restaurant_smoke.js (BROWSER_EXE=크롬 경로)
   · 중도시 이상이거나 이름난 음식이 있는 도시에 식당이 있고 지역 음식 여섯 가지를 낸다
   · 무인 전초지에는 식당을 억지로 만들지 않는다
   · 한 끼 값을 내면 피로·체력이 회복되며 같은 도시에서는 하루 한 번만 먹는다
   · 옛 저장처럼 restaurant 필드가 없어도 즉석에서 만든다. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load/.test(m.text())) errors.push(m.text().slice(0, 300)); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const s = G.State.newGame({ name: '맛 시험', nation: 'PT', job: 'merchant', age: 24, birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state = s; s.day = 20; s.player.gold = 1000; s.player.hp = 50; s.fleet.fatigue = 50; delete s.restaurant;
      const C = G.Scenes.city, T = C.B.restaurant, lisboa = G.CITY_DATA[0], busan = G.CITY_DATA[226];
      const oldSay = C.say; C.say = async function () {};
      const before = { gold: s.player.gold, hp: s.player.hp, fatigue: s.fleet.fatigue };
      const dish = G.CUISINE.dishes(lisboa)[0];
      await T.eat(lisboa, dish);
      const first = { gold: s.player.gold, hp: s.player.hp, fatigue: s.fleet.fatigue, saved: s.restaurant.last[lisboa.id] };
      await T.eat(lisboa, dish);
      const twice = { gold: s.player.gold, hp: s.player.hp, fatigue: s.fleet.fatigue };
      s.day++; await T.eat(lisboa, dish);   // 건물에 드나들며 하루가 흘러도 같은 입항이면 막힌다 (QA 2026-10-23)
      const stay = { gold: s.player.gold, hp: s.player.hp, fatigue: s.fleet.fatigue };
      s.day++; s.portVisit = (s.portVisit || 0) + 1; await T.eat(lisboa, dish);
      const next = { gold: s.player.gold, hp: s.player.hp, fatigue: s.fleet.fatigue };
      C.say = oldSay;
      const ordinaryCities = G.CITY_DATA.filter(c => c && !c.outpost && c.colony == null);
      const restaurantCities = ordinaryCities.filter(c => G.CUISINE.hasRestaurant(c));
      const outposts = G.CITY_DATA.filter(c => c && c.outpost);
      return {
        cityCount: restaurantCities.length,
        restaurantCount: restaurantCities.filter(c => C.buildings(c).some(b => b.kind === 'restaurant')).length,
        extraRestaurants: ordinaryCities.filter(c => !G.CUISINE.hasRestaurant(c) && C.buildings(c).some(b => b.kind === 'restaurant')).length,
        outpostRestaurants: outposts.filter(c => C.buildings(c).some(b => b.kind === 'restaurant')).length,
        lisboa: G.CUISINE.dishes(lisboa).map(d => d.name), busan: G.CUISINE.dishes(busan).map(d => d.name),
        before, first, twice, stay, next, dish: dish.name
      };
    });
    ok(r.restaurantCount === r.cityCount && r.extraRestaurants === 0, '중도시 이상이거나 이름난 음식이 있는 도시 ' + r.cityCount + '곳에만 식당이 있다');
    ok(r.outpostRestaurants === 0, '무인 전초지는 항구만 두고 식당을 만들지 않는다');
    ok(r.lisboa.length === 6 && r.busan.length === 6, '지역 음식 여섯 가지: 리스본 ' + r.lisboa.join('·') + ' / 부산 ' + r.busan.join('·'));
    ok(r.first.gold < r.before.gold && r.first.fatigue < r.before.fatigue && r.first.hp > r.before.hp && r.first.saved === 20, '옛 저장에도 식사 기록을 만들고 ' + r.dish + ' 한 끼가 값·피로·체력을 바꾼다');
    ok(JSON.stringify(r.twice) === JSON.stringify({ gold: r.first.gold, hp: r.first.hp, fatigue: r.first.fatigue }), '같은 도시에서는 하루 한 끼만 먹는다');
    ok(JSON.stringify(r.stay) === JSON.stringify(r.twice), '다음 날이라도 같은 입항(건물만 드나듦)이면 다시 먹지 못한다');
    ok(r.next.gold < r.twice.gold && r.next.fatigue < r.twice.fatigue, '다음에 입항하면 다시 먹을 수 있다');
    ok(errors.length === 0, '콘솔 오류 0');
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error(errors.join(' | ')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
