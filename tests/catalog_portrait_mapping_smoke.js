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

const restored = [];
['arabia', 'ottoman', 'persia', 'seasia', 'tropic'].forEach(style => {
  for (let n = 1; n <= 6; n++) restored.push('maid-styles/' + style + '/' + n);
});
ok(restored.every(k => I.has(k) && I.has(k + '_half')), '복원한 초창기 여급 30장의 얼굴상·무릎상이 모두 있다');
ok(restored.every(k => G.PORTRAIT_FACES[k] && G.PORTRAIT_FACES[k + '_half']), '복원한 30명 모두 얼굴 자리(눈·입)를 다시 쟀다');
const archive = [];
[['arabia',14,19],['india',19,30],['china',19,36],['ottoman',8,13],['japan',11,20],['native',13,18],['africa',19,24],['tropic',7,12],['westeurope',8,35]].forEach(([style,a,b]) => {
  for (let n = a; n <= b; n++) archive.push('maid-styles/' + style + '/' + n);
});
ok(archive.length === 98 && archive.every(k => I.has(k) && I.has(k + '_half')), 'ZIP에서 되살린 초창기 여급 98명의 얼굴상·무릎상이 모두 있다');
ok(archive.every(k => G.PORTRAIT_FACES[k] && G.PORTRAIT_FACES[k + '_half']), '초창기 여급 98명 모두 얼굴 자리(눈·입)를 쟀다');
ok(I.maidList('persia').includes('portraits/street-folk/town_woman_pe'), '페르시아 보조 고해상도 지역 인물도 유지한다');
ok(I.maidList('seasia').includes('portraits/street-folk/town_woman_se'), '동남아 보조 고해상도 지역 인물도 유지한다');
ok(I.maidList('tropic').includes('portraits/street-folk/innkeeper_se'), '열대 보조 고해상도 지역 인물도 유지한다');

const catalog = fs.readFileSync(path.join(ROOT, 'js/catalog.js'), 'utf8');
ok(/chain:\s*A\.portraitKeys\(spec\)/.test(catalog), '도감 동료 카드가 게임과 같은 얼굴 선택 사슬을 쓴다');
ok(/half:\s*I\.chain\.mateHalf\(m\.id\)/.test(catalog), '도감 동료 상세가 게임과 같은 반신 선택 사슬을 쓴다');
ok(/I\.maidList\(sid\)/.test(catalog), '도감 여급 카드가 게임과 같은 품질 필터를 쓴다');

console.log('\n통과 — 지역 인물 ' + selected.length + '명, 고유 얼굴 ' + new Set(selected.map(x => x.face)).size + '장');
