/* 세계 식당 120종 · 유럽 한정 왕립 미술관 — node tests/restaurant_gallery_smoke.js */
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
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const s = G.State.newGame({ name: '미식 제독', nation: 'PT', job: 'merchant', age: 24, birth: { m: 3, d: 1 }, st: { str: 60, int: 70, mar: 55, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      G.Game.state = s; s.player.gold = 99999; s.fleet.fatigue = 50;
      const names = ids => ids.map(id => G.CUISINE.byId[id].name);
      const city = id => G.CUISINE.dishes(G.CITY_DATA[id]).map(x => x.id);
      const specials = { london: city(38), hamburg: city(44), delhi: city(145), chengdu: city(182), beijing: city(188), seoul: city(190), osaka: city(192), dongnae: city(226) };
      const shortMenus = G.CITY_DATA.filter(c => c && G.CUISINE.hasRestaurant(c) && G.CUISINE.dishes(c).length !== 6).map(c => c.id + ':' + c.name + '=' + G.CUISINE.dishes(c).length);
      const foodIcons = Object.keys(G.IMAGE_FILES || {}).filter(k => /^foods\//.test(k)).length;
      const restaurant = G.Scenes.city.buildings(G.CITY_DATA[38]).some(b => b.kind === 'restaurant');
      G.UI.say = async () => {}; G.Game.refreshHud = () => {}; G.State.log = () => {};
      await G.Scenes.city.B.restaurant.eat(G.CITY_DATA[38], G.CUISINE.byId.fish_chips);
      const once = { fatigue: s.fleet.fatigue, gold: s.player.gold };
      await G.Scenes.city.B.restaurant.eat(G.CITY_DATA[38], G.CUISINE.byId.pie_mash);
      const twice = { fatigue: s.fleet.fatigue, gold: s.player.gold };
      const asian = G.SPONSORS.filter(x => G.COURT.bySponsor[x.id] && G.COURT.realms[G.COURT.bySponsor[x.id]].kind !== 'eu')[0];
      G.Fame.add('so', 50000); const forbidden = {};
      if (asian) for (let i = 0; i < 100; i++) { s.court = s.court || {}; s.court.offers = {}; s.seed = 5000 + i; G.Court.offers(asian).forEach(x => { if (/^(museum|gallery|zoo)$/.test(x.kind)) forbidden[x.kind] = 1; }); }
      const art = [{ id: 'masterwork', name: '시험 그림', desc: '시험용 명작', value: 1000, mw: true, by: 'leonardo', wk: 'paint', n: 0, y: 1510 }];
      s.court = { gallery: { PT: { city: 0, y: 1510, sp: 'pt_king', items: art } } };
      const gallery = G.Scenes.city.buildings(G.CITY_DATA[0]).filter(b => b.kind === 'gallery')[0];
      return { n: G.CUISINES.length, unique: new Set(G.CUISINES.map(x => x.id)).size, shortMenus, foodIcons, restaurant, specials, once, twice, forbidden: Object.keys(forbidden), gallery, sample: names(['fish_chips', 'hamburg_steak', 'peking_duck', 'dwaeji_gukbap', 'galbi', 'samgyeopsal', 'delhi_curry', 'jiaozi', 'sushi']) };
    });
    ok(r.n === 120 && r.unique === 120 && !r.shortMenus.length, '지역 음식 120종이 겹치지 않고 식당이 있는 모든 도시에 6종씩 배정됨' + (r.shortMenus.length ? ' — ' + r.shortMenus.join(', ') : ''));
    ok(r.restaurant, '런던 거리에 식당이 선다');
    ok(r.specials.london[0] === 'fish_chips' && r.specials.hamburg[0] === 'hamburg_steak' && r.specials.beijing[0] === 'peking_duck' && r.specials.dongnae[0] === 'dwaeji_gukbap', '런던·함부르크·북경·동래 대표 음식 우선 배정');
    ok(r.specials.seoul[0] === 'galbi' && r.specials.seoul[1] === 'samgyeopsal' && r.specials.delhi[0] === 'delhi_curry' && r.specials.chengdu[0] === 'jiaozi' && r.specials.osaka[0] === 'sushi', '한양·델리·성도·사카이(오사카 권역) 대표 음식 우선 배정');
    ok(r.once.fatigue < 50 && r.once.gold < 99999 && r.once.fatigue === r.twice.fatigue && r.once.gold === r.twice.gold, '식사는 값을 내고 피로를 회복하며 도시마다 하루 한 번');
    ok(!r.forbidden.length, '박물관·미술관·동물원 건립 왕명은 비유럽 궁정에 나오지 않음');
    ok(r.gallery && r.gallery.name === '왕립 미술관', '명작을 바친 유럽 수도에 왕립 미술관이 선다');
    ok(r.foodIcons === 120, '전용 음식 그림 120개가 매니페스트에 등록됨');
    await page.evaluate(() => { void G.Scenes.city.B.gallery.show(G.CITY_DATA[0], 'PT'); });
    await page.waitForSelector('.mu-card', { timeout: 15000, state: 'attached' });
    const art = await page.evaluate(() => [...document.querySelectorAll('.mu-card .mu-name')].map(x => x.textContent));
    ok(art.length === 1 && art[0] === '시험 그림', '왕립 미술관 전시실에 바친 명작이 걸린다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error(errors.slice(0, 5).join(' | ')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
