/* 철새 얼굴상·무릎상 연결 검사 — node tests/wanderer_portrait_mapping_smoke.js */
'use strict';
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
global.window = { G: {} };
global.G = window.G;
[
  'js/core/util.js', 'images/manifest.js', 'js/core/images.js',
  'js/data/people.js', 'js/data/wanderers.js', 'js/data/cities.js',
  'js/art/paint.js', 'js/art/portrait.js', 'js/systems/wanderers.js',
  'js/data/portraitfaces.js'
].forEach(p => require(path.join(ROOT, p)));

const retired = [
  'portraits/fairy-tales/snow_white',
  'portraits/fairy-tales/little_mermaid'
];
const keys = new Set();
for (const nation of Object.values(G.WANDER_NATIONS)) {
  for (const gender of ['m', 'f']) {
    for (const type of Object.keys(G.WANDER_TYPES)) {
      for (const key of G.Wander.facePool(nation.style, gender, type)) keys.add(key);
    }
  }
}
const missing = [...keys].filter(key => !G.Img.has(key) || !G.Img.has(key + '_half'));
const unmeasured = [...keys].filter(key => !G.PORTRAIT_FACES[key] || !G.PORTRAIT_FACES[key + '_half']);
assert.deepStrictEqual(missing, [], '모든 철새 후보에 같은 경로의 얼굴상·무릎상이 있어야 한다');
assert.deepStrictEqual(unmeasured, [], '모든 철새 후보의 얼굴 자리를 재어야 한다');

const northWomen = G.Wander.facePool('ne', 'f', 'nav');
retired.forEach(key => assert(northWomen.includes(key), key + '를 북유럽권 여성 철새가 쓴다'));
retired.forEach((key, i) => {
  const id = 'wd_portrait_test_' + i;
  const d = { id, name: '시험 철새 ' + i, g: 'f', wd: true, role: 'maid', style: 'ne', st: [50, 50, 50, 50], sk: {}, face: key, halfKey: key + '_half' };
  G.MATES.push(d); G.MATE[id] = d;
  const face = G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(id)));
  const half = G.Img.pick(G.Img.chain.mateHalf(id));
  assert.strictEqual(face, key);
  assert.strictEqual(half, key + '_half');
});

const legacy = {
  id: 'wd_portrait_legacy', name: '옛 저장 철새', g: 'f', wd: true,
  role: 'maid', style: 'ne', st: [50, 50, 50, 50], sk: {},
  face: retired[0], zones: [], home: null
};
const legacyPool = {
  id: 'wd_portrait_pool_legacy', name: '라미 마레즈', g: 'm', wd: true, local: 'egypt',
  type: 'nav', role: 'captain', style: 'is', st: [50, 50, 50, 50], sk: {},
  face: 'portraits/pools/mates/eg/m/06', halfKey: 'portraits/pools/mates/eg/m/06_half', zones: [], home: null
};
G.Game = { state: { date: { y: 1500 }, wander: { defs: { [legacy.id]: legacy, [legacyPool.id]: legacyPool } } } };
G.MATE_RANGE = G.MATE_RANGE || {};
G.Wander.apply();
assert.strictEqual(legacy.halfKey, retired[0] + '_half', '옛 저장에도 같은 사람의 무릎상을 고정한다');
assert(!/^portraits\/pools\//.test(legacyPool.face), '옛 얼굴-몸 합성 묶음을 완성된 초상으로 교체한다');
assert.strictEqual(legacyPool.halfKey, legacyPool.face + '_half', '교체한 얼굴과 같은 무릎상을 저장한다');
const shownFace = G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(legacyPool.id)));
const shownHalf = G.Img.pick(G.Img.chain.mateHalf(legacyPool.id));
assert.strictEqual(shownFace, legacyPool.face, '라미 마레즈형 옛 저장의 표시 얼굴을 교체한다');
assert.strictEqual(shownHalf, shownFace + '_half', '라미 마레즈형 옛 저장의 표시 무릎상이 정확히 같은 사람이다');

console.log('통과 — 철새 얼굴 후보 ' + keys.size + '쌍, 누락 0쌍, 옛 합성 묶음 저장 교체, 옛 사건 인물 여성 철새 2명 연결');
