/* 항해사·후원자 무릎상 현황: 실제 게임의 자료 추가 순서와 초상 선택 규칙을 따라 집계한다. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
global.window = { G: {} };
global.G = window.G;
[
  'js/core/util.js', 'images/manifest.js', 'js/core/images.js',
  'js/data/people.js', 'js/data/estates.js', 'js/data/rulers.js',
  'js/data/materange.js', 'js/data/wanderers.js', 'js/data/cities.js',
  'js/art/paint.js', 'js/art/portrait.js'
].forEach(p => require(path.join(root, p)));

const disk = {};
function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) scan(f);
    else if (/\.(png|webp|jpg|jpeg)$/i.test(e.name)) {
      const rel = path.relative(path.join(root, 'images'), f).replace(/\\/g, '/');
      disk[rel.replace(/\.[^.]+$/, '')] = rel;
    }
  }
}
scan(path.join(root, 'images', 'portraits'));
const imageFiles = Object.assign({}, G.IMAGE_FILES, disk);
function pick(keys) { return [].concat(keys || []).find(k => imageFiles[k]) || null; }
function record(id, name, spec, extra) {
  const keys = G.Art.portraitKeys(spec) || [];
  const bust = pick(keys);
  const halfKeys = id.startsWith('mate:')
    ? G.Img.chain.mateHalf(id.slice(5))
    : G.Img.chain.halfOf(keys);
  const half = pick(halfKeys);
  return Object.assign({ id, name, bust, half, halfFile: half ? imageFiles[half] : null }, extra);
}
const mates = G.MATES.map(m => record('mate:' + m.id, m.name, G.Art.mateSpec(m.id), { witch: !!m.witch, desc: m.desc }));
const sponsors = G.SPONSORS.map(sp => ({
  id: sp.id, title: sp.title, city: G.CITY_DATA[sp.city].name,
  holders: sp.holders.map((h, i) => record('sponsor:' + sp.id, h[2], G.Art.sponsorSpec(sp, i), {
    from: h[0], to: h[1], generic: h[4] === 'g',
    pic: G.Art.sponsorPic(sp, i)
  }))
}));
const holders = sponsors.flatMap(s => s.holders);
const ownBusts = Object.keys(disk).filter(k => /^portraits\/(mates|sponsors)\/[^/]+$/.test(k) && !/_half$/.test(k));
const sources = [...new Set(mates.concat(holders).map(x => x.bust).filter(Boolean))].sort();
const summary = {
  sponsorSlots: sponsors.length,
  staticMates: mates.length,
  ordinaryMates: mates.filter(m => !m.witch).length,
  witchMates: mates.filter(m => m.witch).length,
  totalStaticSlots: sponsors.length + mates.length,
  sponsorTenureRows: holders.length,
  sponsorDistinctNamedLabels: new Set(holders.filter(h => !h.generic).map(h => h.name)).size,
  matesMissingHalf: mates.filter(m => !m.half).length,
  sponsorSlotsWithAnyMissingHalf: sponsors.filter(s => s.holders.some(h => !h.half)).length,
  sponsorTenuresMissingHalf: holders.filter(h => !h.half).length,
  dedicatedBustFiles: ownBusts.length,
  dedicatedBustFilesMissingHalf: ownBusts.filter(k => !pick([k + '_half'])).length,
  uniqueUsedBustSources: sources.length,
  usedBustSourcesMissingHalf: sources.filter(k => !pick([k + '_half'])).length,
  sponsorSlotsWithoutAnyRasterForSomeTenure: sponsors.filter(s => s.holders.some(h => !h.bust)).length,
  note: '후원자는 관직/자리 수다. 역대 보유자 행에는 재위 반복·공위·직함이 포함되므로 고유 인원으로 세지 않는다. 철새 항해사는 저장 파일과 연도에 따라 자동 생성되어 고정 총원이 없다.'
};
const out = { summary, mates, sponsors, sources, dedicatedBusts: ownBusts.sort() };
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 2));
else if (process.argv.includes('--write')) {
  const dest = path.join(root, 'docs', 'art', 'npc-knee-audit.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
  console.log(dest);
} else console.log(JSON.stringify(summary, null, 2));
