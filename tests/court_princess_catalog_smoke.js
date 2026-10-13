/* 왕녀 구출 이벤트 이름·도감 연결 검사 — node tests/court_princess_catalog_smoke.js */
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
global.G = {};
load('js/data/court.js');
load('js/data/princess.js');
load('images/manifest.js');

const princesses = G.COURT.princesses;
const realms = G.COURT.realms;
ok(princesses.length === 65, '22개 궁정의 이벤트 왕녀·귀족 여성 65명이 등록되어 있다');
ok(new Set(princesses.map(p => p.name)).size === princesses.length, '65명 모두 서로 다른 고유 이름을 쓴다');
ok(G.PRINCESS.name === '블랑카 왕녀' && !princesses.some(p => p.name === G.PRINCESS.name), '특별 이벤트의 블랑카 왕녀도 별도 고유 이름을 쓴다');
ok(new Set(princesses.map(p => p.id)).size === princesses.length, '도감용 ID도 모두 고유하다');
ok(Object.keys(realms).every(id => {
  const names = princesses.filter(p => p.realm === id).map(p => p.name);
  return JSON.stringify(names) === JSON.stringify(realms[id].ladies);
}), '게임 왕명과 도감이 같은 이름 목록을 읽는다');
ok(princesses.every(p => G.IMAGE_FILES[p.face] && G.IMAGE_FILES[p.half]), '도감 카드의 얼굴·지역 무릎상 파일이 모두 존재한다');
ok(princesses.every(p => /^portraits\/street-folk\/.+_[a-z]+$/.test(p.face) && p.half === p.face + '_half'), '왕녀는 얼굴 확장 pool 대신 지역 거리 인물의 완성된 흉상·무릎상 짝을 쓴다');
ok(princesses.filter(p => p.realm === 'KR').map(p => p.half).join('|') === 'portraits/street-folk/town_woman_kr_half|portraits/street-folk/librarian_kr_half', '조선의 두 왕녀는 무릎이 드러나지 않는 서로 다른 한복 무릎상을 쓴다');

const html = fs.readFileSync(path.join(ROOT, 'catalog.html'), 'utf8');
const catalog = fs.readFileSync(path.join(ROOT, 'js/catalog.js'), 'utf8');
ok(html.indexOf('js/data/court.js') >= 0 && html.indexOf('js/data/court.js') < html.indexOf('js/catalog.js') && html.indexOf('js/data/princess.js') < html.indexOf('js/catalog.js'), '도감이 두 왕녀 이벤트의 이름 데이터를 먼저 불러온다');
ok(/\['princess',\s*'왕명 왕녀'\]/.test(catalog), '도감 인물 탭에 왕명 왕녀 분류가 있다');
ok(/G\.COURT\.princesses/.test(catalog) && /G\.PRINCESS/.test(catalog) && /group:\s*'princess'/.test(catalog), '도감 카드가 게임의 두 왕녀 이벤트 데이터에서 생성된다');

console.log('\n통과 — 블랑카 왕녀 외 왕명 인물 ' + princesses.map(p => p.name).join(', '));
