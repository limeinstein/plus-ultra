/* 건물 NPC가 공통 거리 인물을 빌리지 않고 자기 얼굴과 같은 무릎상을 쓰는지 확인 — node tests/regional_knee_portrait_smoke.js */
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
global.G = {
  U: { strHash: s => Array.from(String(s)).reduce((n, c) => ((n * 31) + c.charCodeAt(0)) | 0, 0) },
  Art: {
    rolePortraitGender: (role, style) => {
      const women = style === 'kr'
        ? ['king', 'noble', 'official', 'merchant', 'scholar', 'keeper', 'maid', 'native']
        : style === 'cn'
          ? ['noble', 'official', 'scholar', 'keeper', 'maid', 'native']
          : ['noble', 'official', 'merchant', 'scholar', 'keeper', 'maid'];
      return women.includes(role) ? 'f' : 'm';
    }
  }
};
load('images/manifest.js');
load('js/core/images.js');

const styles = ['ib', 'ne', 'it', 'gr', 'ru', 'is', 'pe', 'af', 'sw', 'in', 'se', 'cn', 'kr', 'jp', 'az', 'an', 'co', 'tr', 'st', 'na'];
let checked = 0;
let withoutRaster = 0;
styles.forEach((style, si) => {
  const c = { id: 1000 + si, style, rel: style === 'is' || style === 'pe' ? 'I' : 'C' };
  G.Img.NPCS.forEach(([id]) => {
    const bust = G.Img.pick(G.Img.chain.npc(id, c));
    const first = G.Img.pick(G.Img.chain.npcHalf(id, c));
    if (!bust) { withoutRaster++; return; }
    if (first !== bust + '_half') throw new Error(style + ' ' + id + '의 얼굴·무릎상이 다름: ' + bust + ' / ' + first);
    if (/^portraits\/street-folk\//.test(first)) throw new Error(style + ' ' + id + '가 거리 인물 무릎상을 빌림: ' + first);
    if (!G.IMAGE_FILES[first]) throw new Error(style + ' ' + id + '의 무릎상 파일이 없음: ' + first);
    checked++;
  });
});
ok(checked + withoutRaster === styles.length * G.Img.NPCS.length, '그림이 있는 건물 NPC ' + checked + '개가 자기 얼굴과 같은 무릎상을 쓴다');
ok(G.Img.NPCS.every(([id]) => {
  const c = { id: 0, style: 'ib', rel: 'C' }, bust = G.Img.pick(G.Img.chain.npc(id, c));
  return bust && G.Img.pick(G.Img.chain.npcHalf(id, c)) === bust + '_half';
}), '이베리아 건물 NPC 18종은 모두 기존 고유 얼굴·무릎상으로 연결된다');

const court = fs.readFileSync(path.join(ROOT, 'js/data/court.js'), 'utf8');
const catalog = fs.readFileSync(path.join(ROOT, 'js/catalog.js'), 'utf8');
const special = fs.readFileSync(path.join(ROOT, 'js/systems/princess.js'), 'utf8');
ok(/face:\s*base,\s*half:\s*base \+ '_half'/.test(court), '왕명 왕녀의 흉상과 무릎상이 같은 기존 지역 인물 짝이다');
ok(/half:\s*\[hk\]/.test(catalog), '도감도 왕녀 데이터에 지정된 지역 무릎상을 그대로 쓴다');
ok(!/half:\s*\[k \+ '_half'\][\s\S]{0,180}왕명 왕녀/.test(catalog), '도감 왕녀가 얼굴 키로 무릎상을 다시 합성하지 않는다');
ok(/portraits\/street-folk\/town_woman_ib/.test(special) && !/portraits\/npc\/princess_es_half/.test(special), '블랑카 왕녀도 얼굴 확장본 대신 기존 이베리아 무릎상을 쓴다');

console.log('\n통과 — 건물 NPC ' + checked + '개 고유 연결(그림 없는 절차식 얼굴 ' + withoutRaster + '개 제외)과 왕명 왕녀 도감 연결을 확인했습니다.');
