/* 시안에 쓰는 시설과 발견물을 본편 데이터에서 확인한다. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'artifacts/city-icons-large-20261126');
const context = { G: {}, console };
context.window = context;
vm.createContext(context);
const load = name => vm.runInContext(fs.readFileSync(path.join(root, `js/${name}.js`), 'utf8'), context, { filename: name });
for (const name of ['data/base', 'data/cities', 'data/people', 'data/wonders', 'data/discadd', 'data/heritagedisc', 'data/miragedisc', 'data/discoveries', 'data/books', 'core/rules', 'art/city_icon']) load(name);
const G = context.G;
const year = 1480;
const selections = [
  ['paris', 14, 'notredame', '루브르 성채'], ['rome', 33, 'colosseum', '교황청'],
  ['istanbul', 112, 'hagiasophia', '톱카프 궁전'], ['london', 38, 'whitetower', '웨스트민스터 왕궁'],
  ['seville', 7, 'giralda', '알카사르 왕궁']
];
const cities = selections.map(([key, id, landmark, palace]) => {
  const city = G.CITY_DATA[id];
  const disc = G.DISC[landmark];
  assert(disc && disc.city === id && disc.cat === 'ruin' && (!disc.built || disc.built <= year) && !disc.mirageFrom && !disc.alwaysMirage, landmark);
  const sponsor = G.SPONSORS.filter(s => s.city === id && s.holders.some(([from, to]) => from <= year && year < to))
    .sort((a, b) => b.pw - a.pw || Number(b.bld === 'palace') - Number(a.bld === 'palace'))[0];
  assert(sponsor && sponsor.bld === 'palace', city.name);
  const facilities = G.R.facilities(city);
  assert.equal(facilities.harbor, Boolean(city.port));
  return { key, id, name: city.name, size: city.size, coords: [city.lon, city.lat], landmark, landmarkName: disc.name,
    sponsor: sponsor.title, palace, facilities, old: [G.CityIcon.metrics(city).width, Math.round(G.CityIcon.metrics(city, 1.15).width)] };
});
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'cities.json'), JSON.stringify({ year, cities }, null, 2));
