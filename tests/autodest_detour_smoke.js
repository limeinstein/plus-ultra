/* 아시아→지중해 자동항해 목록이 아프리카 우회 항로와 보급을 반영하는지 확인한다. */
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
global.window = { G: {} };
global.G = window.G;
require(path.join(ROOT, 'js/core/util.js'));
require(path.join(ROOT, 'js/data/cities.js'));
G.Game = { state: { date: { y: 1500, m: 1, d: 1 }, routes: {} } };
G.Geo = { wrapLon: lon => ((lon + 180) % 360 + 360) % 360 - 180 };
let speed = 1;
G.Plan = { avgSpeed: () => speed };
G.R = { cityExists: () => true };
G.UI = {};
G.Scenes = { city: { B: {} } };
let pathCalls = 0;
G.Nav = { ready: () => true, seaPath: (lo, la, toLo, toLa) => {
  pathCalls++;
  return [[lo, la], [20, -36], [toLo, toLa]];
} };
require(path.join(ROOT, 'js/systems/routes.js'));
require(path.join(ROOT, 'js/city/harbor.js'));

(async () => {
  const RT = G.Routes, H = G.Scenes.city.B.harbor;
  const asia = 152, africa = 101, europe = 0, egypt = 78;
  RT.record(asia, africa, 30);
  RT.record(africa, europe, 90);
  RT.record(europe, egypt, 35);
  const before = pathCalls;
  const dests = H.autoDests(G.CITY_DATA[asia]);
  const lisbon = dests.find(x => x.c.id === europe);
  const alexandria = dests.find(x => x.c.id === egypt);
  assert.strictEqual(lisbon.days, 120, '유럽까지는 익힌 항로 두 구간의 날수를 더한다');
  assert.strictEqual(alexandria.days, 155, '이집트는 유럽에 이른 뒤 지중해 구간까지 더한다');
  assert(dests.indexOf(lisbon) < dests.indexOf(alexandria), '아시아에서 이집트가 유럽보다 가까운 항구로 나오지 않는다');
  assert(alexandria.days > 130 && lisbon.days <= 130, '목적지를 누르기 전부터 이집트행 보급 부족을 판별한다');
  assert.strictEqual(pathCalls, before, '목록은 목적지마다 무거운 길찾기를 실행하지 않는다');

  // 정확히 잰 길은 옛 최단 기록보다 우선하고 함대 속력에 맞춰 다시 환산한다.
  const measured = RT.estDays(asia, africa);
  await Promise.resolve();
  assert.strictEqual(RT.roughDays(asia, africa).days, measured);
  assert.notStrictEqual(measured, 30, '옛 30일 기록과 현재 함대의 예상은 다를 수 있다');
  assert.strictEqual(RT.roughDays(asia, europe).days, measured + 90, '새로 잰 구간이 경유 항로 캐시에도 반영된다');
  speed = 0.5;
  await Promise.resolve();
  assert.strictEqual(RT.roughDays(asia, africa).days, RT.estDays(asia, africa), '함대 속력이 바뀌면 이미 잰 길의 날수도 바뀐다');
  console.log('통과 — 아시아→유럽→이집트 경유 날수·정렬·보급, 목록 길찾기 0회, 측정·선속 변경 반영');
})().catch(e => { console.error(e); process.exitCode = 1; });
