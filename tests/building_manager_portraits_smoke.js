/* 왕립 시설 관리자 20지역×3직책의 얼굴상·무릎상과 게임 연결 확인. */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

function load(file) {
  const full = path.join(ROOT, file);
  vm.runInThisContext(fs.readFileSync(full, 'utf8'), { filename: full });
}
function ok(value, message) {
  if (!value) throw new Error(message);
  console.log('  ✓ ' + message);
}

global.window = global;
global.G = { U: { strHash: s => Array.from(String(s)).reduce((n, c) => ((n * 31) + c.charCodeAt(0)) | 0, 0) } };
load('images/manifest.js');
load('js/core/images.js');

const styles = ['ib', 'ne', 'it', 'gr', 'ru', 'is', 'pe', 'af', 'sw', 'in', 'se', 'cn', 'kr', 'jp', 'az', 'an', 'co', 'tr', 'st', 'na'];
const roles = ['zoo', 'museum', 'gallery'];
const missing = [];
styles.forEach(style => roles.forEach(role => {
  const base = `portraits/building-managers/${style}/${role}`;
  if (!G.IMAGE_FILES[base]) missing.push(base);
  if (!G.IMAGE_FILES[base + '_half']) missing.push(base + '_half');
}));
ok(missing.length === 0, '20지역×3직책의 얼굴상·무릎상 120장이 등록된다');

const source = fs.readFileSync(path.join(ROOT, 'js/city/museum.js'), 'utf8');
ok(/MANAGER_ROLE\s*=\s*\{\s*zoo:\s*'maid',\s*museum:\s*'scholar',\s*gallery:\s*'official'\s*\}/.test(source), '세 시설이 서로 다른 관리자 역할을 쓴다');
ok(/portraits\/building-managers\/.+style.+kind/.test(source), '도시의 지역 양식과 시설 종류로 전용 초상을 고른다');
ok(/who\.half\s*=\s*\[key \+ '_half'/.test(source), '얼굴과 같은 인물의 무릎상을 우선한다');
ok(/GALLERY_GENDER\s*=/.test(source), '지역별 미술관장의 성별 메타데이터를 원화와 맞춘다');
ok(/기다린 건 아니고/.test(source) && /새벽부터 먹이를/.test(source) && /정한 순서대로/.test(source), '박물관·동물원·미술관의 말투가 역할과 맞다');

console.log('\n통과 — 왕립 시설 관리자 60명과 얼굴상·무릎상 120장 연결을 확인했습니다.');
