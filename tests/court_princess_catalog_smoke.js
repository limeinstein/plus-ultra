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
ok(princesses.every(p => G.IMAGE_FILES[p.face] && G.IMAGE_FILES[p.half]), '도감 카드의 고유 얼굴상·무릎상 파일이 모두 존재한다');
ok(princesses.every(p => p.face === 'portraits/princesses/' + p.id && p.half === p.face + '_half'), '왕녀 65명은 각자의 ID로 된 고유 흉상·무릎상 짝을 쓴다');
ok(new Set(princesses.map(p => p.face)).size === princesses.length && new Set(princesses.map(p => p.half)).size === princesses.length, '왕녀끼리 얼굴상이나 무릎상을 공유하지 않는다');
ok(princesses.filter(p => p.realm === 'KR').every(p => /^portraits\/princesses\/court_princess_kr_[12]$/.test(p.face)), '조선의 두 왕녀도 각각 고유한 한복 흉상·무릎상을 쓴다');
ok(G.IMAGE_FILES['portraits/princesses/m_princess'] && G.IMAGE_FILES['portraits/princesses/m_princess_half'], '블랑카 왕녀의 고유 얼굴상·무릎상도 존재한다');

const html = fs.readFileSync(path.join(ROOT, 'catalog.html'), 'utf8');
const catalog = fs.readFileSync(path.join(ROOT, 'js/catalog.js'), 'utf8');
ok(html.indexOf('js/data/court.js') >= 0 && html.indexOf('js/data/court.js') < html.indexOf('js/catalog.js') && html.indexOf('js/data/princess.js') < html.indexOf('js/catalog.js'), '도감이 두 왕녀 이벤트의 이름 데이터를 먼저 불러온다');
ok(/\['princess',\s*'왕명 왕녀'\]/.test(catalog), '도감 인물 탭에 왕명 왕녀 분류가 있다');
ok(/G\.COURT\.princesses/.test(catalog) && /G\.PRINCESS/.test(catalog) && /group:\s*'princess'/.test(catalog), '도감 카드가 게임의 두 왕녀 이벤트 데이터에서 생성된다');
ok(/portraits\/princesses\/['"]?\s*\+\s*p\.id/.test(catalog), '도감의 블랑카 카드도 고유 왕녀 경로를 쓴다');

console.log('\n통과 — 블랑카 왕녀 외 왕명 인물 ' + princesses.map(p => p.name).join(', '));
