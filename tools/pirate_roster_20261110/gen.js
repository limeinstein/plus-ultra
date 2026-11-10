/* 이름난 해적 초상 · 해적 깃발 주문서 만들기 (2026-11-10)
   게임 자료(js/data/seacaptains.js · pirate_lairs.js · pirate_roster.js)를 읽어
     tools/pirate_roster_20261110/prompts.json  — 코덱스가 그릴 목록 (초상 · 깃발, 이미 그림이 있으면 have: true)
     docs/art/pirate-roster-20261110-list.md     — 사람이 보는 목록 (바다별 해적 · 해적단과 깃발 모양)
   을 만든다.   node tools/pirate_roster_20261110/gen.js
   해적 이름·성별·생김새·해적단·깃발 모양을 고치려면 js/data/pirate_roster.js(새 해적·해적단)나 js/data/pirate_lairs.js(소굴 사람)를 고친 뒤 다시 돌린다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
const ctx = { window: {}, console };
ctx.window.G = { ITEMS: [], ITEM: {} };
vm.createContext(ctx);
['js/data/seacaptains.js', 'js/data/pirate_lairs.js', 'js/data/pirate_roster.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
const G = ctx.window.G, B = G.PIRATE_BANDS;
const ZONE = { med: '지중해', atl: '대서양', north: '북해·발트해', amer: '카리브·아메리카', ind: '인도양', sea: '동남아시아', east: '동아시아' };
const ZONE_EN = { med: 'Mediterranean (Barbary coast, Italy, Greece, Levant)', atl: 'Atlantic (Iberia, Morocco, France, Canaries, Newfoundland)', north: 'North Sea / Baltic / Irish and Scottish seas', amer: 'Caribbean and Spanish Main', ind: 'Indian Ocean (Red Sea, Arabia, India, Madagascar, Swahili coast)', sea: 'Southeast Asia (Malay world, Siam, Java, Philippines, Vietnam)', east: 'East Asia (China coast, Japan, Korea)' };
const has = k => fs.existsSync(path.join(ROOT, 'images', k + '.webp'));
const people = [];
G.SEA_PIRATES.forEach(p => people.push({ id: p.id, name: p.name, kind: p.lair ? 'lair_mate' : 'named', zones: p.zones, years: p.y, g: p.g || 'm', hist: !!p.hist, band: p.band, look: p.look || '', desc: p.desc }));
(G.PIRATE_LAIRS || []).forEach(d => d.chiefs.forEach((c, i) => people.push({ id: 'chief_' + d.zone + '_' + (i + 1), name: c.name, kind: 'lair_chief', zones: [d.zone], years: [1480, 1700], g: c.g || 'm', hist: false, band: d.band, look: c.look || '', desc: c.desc + ' ' + d.place + ' 소굴의 두목.' })));
const STYLE = 'Use case: stylized-concept\nAsset type: production-ready 2D game character portrait pair (bust 384x384 opaque + knee-length 1024x1536 transparent)\n' +
  'Input images: images/portraits/rivals/크리스토발 콜론.webp and 크리스토발 콜론_half.webp are the style, framing, lighting and rendering reference only.\n' +
  'Composition: bust = head and shoulders, three-quarter view, warm painted backdrop. Half = standing knee-length, three-quarter view facing screen-left, cut at the knees, genuine alpha transparency, no backdrop.\n' +
  'Constraints: no text, labels, watermark, frame, border or extra people; no modern items; consistent face between the two images.';
const portraits = people.map(p => {
  const b = B[p.band] || {};
  return {
    id: p.id, name: p.name, kind: p.kind, gender: p.g === 'f' ? 'female' : 'male', zones: p.zones.map(z => ZONE[z]), years: p.years.join('–'), historical: p.hist, band: b.name || '', look: p.look,
    face: 'images/portraits/rivals/' + p.name + '.webp', half: 'images/portraits/rivals/' + p.name + '_half.webp', have: has('portraits/rivals/' + p.name),
    prompt: STYLE + '\nPrimary request: Paint ' + (p.hist ? 'the real historical pirate' : 'an original fictional pirate') + ' 「' + p.name + '」 (' + (p.g === 'f' ? 'woman' : 'man') + '), active ' + p.years.join('–') + ' in the ' + p.zones.map(z => ZONE_EN[z]).join(' / ') +
      ', member of the pirate band 「' + (b.name || '') + '」. Appearance and personality (Korean): ' + p.look + '. Background (Korean): ' + p.desc + '\nKeep clothing, weapons and ethnicity true to the region and decade.'
  };
});
const flags = Object.keys(B).map(k => {
  const b = B[k], members = people.filter(p => p.band === k).map(p => p.name);
  return {
    id: 'flag_' + k, band: k, name: b.name + ' 깃발', zone: ZONE[b.zone], real: !!b.real, basis: b.basis, design: b.flag, members, file: 'images/items/flag_' + k + '.webp', have: has('items/flag_' + k),
    prompt: 'Use case: game inventory icon\nAsset type: 256x256 item icon with genuine transparent background, same hand-painted style as images/items/*.webp\n' +
      'Primary request: a single pirate / privateer flag of the band 「' + b.name + '」 flying from a short wooden pole, cloth gently waving, worn sea-faded fabric, 16th–17th century.\n' +
      'Design (Korean, follow exactly): ' + b.flag + '\nConstraints: no extra text except text that the design itself asks for; no frame, no background scenery; the emblem must stay readable at 48x48.'
  };
});
fs.writeFileSync(path.join(__dirname, 'prompts.json'), JSON.stringify({ made: '2026-11-10', portraits, flags }, null, 1));
// 사람이 보는 목록
let md = '# 이름난 해적 · 해적단 · 해적 깃발 목록 (2026-11-10)\n\n자동 생성: `node tools/pirate_roster_20261110/gen.js` — 고치려면 `js/data/pirate_roster.js` · `js/data/pirate_lairs.js`.\n\n';
md += '초상 ' + portraits.length + '명 (그림 있음 ' + portraits.filter(x => x.have).length + ') · 깃발 ' + flags.length + '장 (그림 있음 ' + flags.filter(x => x.have).length + ')\n\n';
Object.keys(ZONE).forEach(z => {
  const L = people.filter(p => p.zones[0] === z);
  md += '## ' + ZONE[z] + ' (' + L.length + '명)\n\n| 이름 | 성별 | 해 | 실존 | 해적단 | 생김새 | 초상 |\n|---|---|---|---|---|---|---|\n';
  L.forEach(p => { md += '| ' + p.name + (p.kind === 'lair_chief' ? ' (소굴 두목)' : p.kind === 'lair_mate' ? ' (소굴 간부)' : '') + ' | ' + (p.g === 'f' ? '여' : '남') + ' | ' + p.years.join('–') + ' | ' + (p.hist ? '실존' : '지어냄') + ' | ' + ((B[p.band] || {}).name || '') + ' | ' + p.look + ' | ' + (has('portraits/rivals/' + p.name) ? '있음' : '**그릴 것**') + ' |\n'; });
  md += '\n';
});
md += '## 해적단과 깃발 (' + flags.length + ')\n\n| 깃발 id | 해적단 | 바다 | 이름 | 이름의 뿌리 | 깃발 모양 | 그림 |\n|---|---|---|---|---|---|---|\n';
flags.forEach(f => { md += '| `' + f.id + '` | ' + B[f.band].name + ' | ' + f.zone + ' | ' + (f.real ? '실존' : '지어냄') + ' | ' + f.basis + ' | ' + f.design + ' | ' + (f.have ? '있음' : '**그릴 것**') + ' |\n'; });
fs.mkdirSync(path.join(ROOT, 'docs', 'art'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs', 'art', 'pirate-roster-20261110-list.md'), md);
console.log('초상', portraits.length, '(있음', portraits.filter(x => x.have).length + ') · 깃발', flags.length, '(있음', flags.filter(x => x.have).length + ')');
