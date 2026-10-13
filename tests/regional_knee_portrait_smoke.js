/* 얼굴 확장본보다 지역별 완성 무릎상을 우선하는지 확인 — node tests/regional_knee_portrait_smoke.js */
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
styles.forEach((style, si) => {
  const c = { id: 1000 + si, style, rel: style === 'is' || style === 'pe' ? 'I' : 'C' };
  G.Img.NPCS.forEach(([id]) => {
    const first = G.Img.chain.npcHalf(id, c)[0];
    if (!/^portraits\/street-folk\/.+_half$/.test(first)) throw new Error(style + ' ' + id + '가 지역 무릎상을 우선하지 않음: ' + first);
    if (!G.IMAGE_FILES[first]) throw new Error(style + ' ' + id + '의 우선 무릎상 파일이 없음: ' + first);
    if (style === 'kr' && /town_man_kr_half$/.test(first)) throw new Error('조선 남성에게 여성 town_man 무릎상이 연결됨: ' + id);
    checked++;
  });
});
ok(checked === styles.length * G.Img.NPCS.length, '20개 지역의 마을 NPC ' + checked + '개가 완성된 지역 무릎상을 우선한다');

const court = fs.readFileSync(path.join(ROOT, 'js/data/court.js'), 'utf8');
const catalog = fs.readFileSync(path.join(ROOT, 'js/catalog.js'), 'utf8');
const special = fs.readFileSync(path.join(ROOT, 'js/systems/princess.js'), 'utf8');
ok(/face:\s*base,\s*half:\s*base \+ '_half'/.test(court), '왕명 왕녀의 흉상과 무릎상이 같은 기존 지역 인물 짝이다');
ok(/half:\s*\[hk\]/.test(catalog), '도감도 왕녀 데이터에 지정된 지역 무릎상을 그대로 쓴다');
ok(!/half:\s*\[k \+ '_half'\][\s\S]{0,180}왕명 왕녀/.test(catalog), '도감 왕녀가 얼굴 키로 무릎상을 다시 합성하지 않는다');
ok(/portraits\/street-folk\/town_woman_ib/.test(special) && !/portraits\/npc\/princess_es_half/.test(special), '블랑카 왕녀도 얼굴 확장본 대신 기존 이베리아 무릎상을 쓴다');

console.log('\n통과 — 지역별 마을 NPC ' + checked + '개 연결과 왕명 왕녀 도감 연결을 확인했습니다.');
