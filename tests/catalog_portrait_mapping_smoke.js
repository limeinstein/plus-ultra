/* 도감과 게임의 인물 그림 연결 검사 — node tests/catalog_portrait_mapping_smoke.js
   브라우저 없이 실제 manifest와 초상 선택 코드를 읽어, 동료 카드의 얼굴·반신 및 여급 대표 그림을 확인한다. */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

function ok(value, message) {
  if (!value) throw new Error(message);
  console.log('  ✓ ' + message);
}

function load(file) {
  const full = path.join(ROOT, file);
  vm.runInThisContext(fs.readFileSync(full, 'utf8'), { filename: full });
}

global.window = global;
global.performance = { now: () => Date.now() };
global.G = {
  Art: {},
  CITY_DATA: Array.from({ length: 400 }, (_, id) => ({ id, region: 0, style: 'kr' })),
  MATES: [], MATE: {}, MATE_RANGE: {}, BIOS: {}
};

[
  'js/core/util.js',
  'images/manifest.js',
  'js/core/images.js',
  'js/art/paint.js',
  'js/data/regionfolk.js',
  'js/art/portrait.js',
  'js/data/portraitfaces.js'
].forEach(load);

const I = G.Img;
const A = G.Art;
const people = G.REGION_FOLK.people;
const selected = people.map(p => {
  const face = I.pick(A.portraitKeys(A.mateSpec(p.id)));
  const half = I.pick(I.chain.mateHalf(p.id));
  return { id: p.id, name: p.name, face, half, zones: p.zones };
});

ok(selected.every(x => x.face && I.has(x.face)), '지역 인물 전원의 도감 얼굴 파일이 존재한다 — ' + selected.length + '명');
ok(selected.every(x => x.half === x.face + '_half' && I.has(x.half)), '도감 반신 그림이 선택된 얼굴과 모두 일치한다');

// 같은 나라·복식·성별 묶음에서는 10장을 다 쓰기 전 얼굴이 반복되지 않아야 한다.
const borrowed = selected.filter(x => /^portraits\/pools\/(mates|sponsors)\//.test(x.face));
const groups = {};
borrowed.forEach(x => {
  const group = x.face.replace(/\/\d+$/, '');
  (groups[group] || (groups[group] = [])).push(x.face);
});
Object.keys(groups).forEach(group => {
  const faces = groups[group];
  const unique = new Set(faces);
  ok(unique.size === Math.min(faces.length, 10), group + '에서 가능한 얼굴을 먼저 고유하게 배정한다 (' + unique.size + '/' + faces.length + ')');
});

const korea = selected.filter(x => x.zones.indexOf('korea') >= 0).slice(0, 20);
ok(new Set(korea.map(x => x.face)).size === korea.length, '도감 첫 조선 인물 20명의 얼굴이 서로 다르다');

const exact = {
  h_hongildong: 'hong_gildong', h_jangnoksu: 'jang_noksu', h_jogwangjo: 'jo_gwangjo',
  h_sinsaimdang: 'shin_saimdang', h_yihwang: 'yi_hwang',
  h_imkkeokjeong: 'im_kkeokjeong', h_yiyi: 'yi_i', h_nangseolheon: 'heo_nanseolheon',
  h_samyeong: 'samyeong_daesa', h_gwakjaeu: 'gwak_jaeu', h_nongae: 'nongae'
};
Object.keys(exact).forEach(id => {
  const found = selected.find(x => x.id === id);
  ok(found && found.face === 'portraits/legendary/' + exact[id], found ? found.name + '이(가) 전용 얼굴을 쓴다' : id + '을 찾는다');
});

const low = [];
['arabia', 'ottoman', 'persia', 'seasia', 'tropic'].forEach(style => {
  const list = I.maidList(style);
  for (let n = 1; n <= 6; n++) if (list.indexOf('maid-styles/' + style + '/' + n) >= 0) low.push(style + '/' + n);
});
ok(low.length === 0, '도감 여급 후보에서 저해상도 구판 30장을 제외한다');
ok(I.maidList('persia')[0] === 'portraits/street-folk/town_woman_pe', '페르시아 도감 대표가 고해상도 지역 인물이다');
ok(I.maidList('seasia')[0] === 'portraits/street-folk/town_woman_se', '동남아 도감 대표가 고해상도 지역 인물이다');
ok(I.maidList('tropic')[0] === 'portraits/street-folk/innkeeper_se', '열대 도감 대표가 고해상도 지역 인물이다');

const catalog = fs.readFileSync(path.join(ROOT, 'js/catalog.js'), 'utf8');
ok(/chain:\s*A\.portraitKeys\(spec\)/.test(catalog), '도감 동료 카드가 게임과 같은 얼굴 선택 사슬을 쓴다');
ok(/half:\s*I\.chain\.mateHalf\(m\.id\)/.test(catalog), '도감 동료 상세가 게임과 같은 반신 선택 사슬을 쓴다');
ok(/I\.maidList\(sid\)/.test(catalog), '도감 여급 카드가 게임과 같은 품질 필터를 쓴다');

console.log('\n통과 — 지역 인물 ' + selected.length + '명, 고유 얼굴 ' + new Set(selected.map(x => x.face)).size + '장');
