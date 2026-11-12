/* 실제 자료·추가 등록·이야기 전용 발견물·구입한 단서 증거품까지 그림을 대조한다. */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.resolve(__dirname, '../..');
process.chdir(root);
global.window = global; global.document = {}; global.G = {};
for (const match of fs.readFileSync('index.html', 'utf8').matchAll(/<script src="([^"]+)"/g)) {
  const file = match[1], source = fs.readFileSync(file, 'utf8');
  if (file === 'js/core/util.js' || file.startsWith('js/data/') || (file.startsWith('js/systems/') && /G\.ITEMS\.push\(/.test(source))) vm.runInThisContext(source, { filename: file });
}
for (const file of ['images/manifest.js', 'js/core/images.js']) vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
const extensions = ['.webp', '.gif', '.png', '.jpg', '.jpeg', '.avif'];
const asset = key => ({ key, file: extensions.map(ext => 'images/' + key + ext).find(file => fs.existsSync(file)) || null, manifest: G.IMAGE_FILES[key] || null });
const sourceRows = G.DISCOVERIES.slice();
for (const match of fs.readFileSync('js/data/story.js', 'utf8').matchAll(/^\s*\['(ft_[^']+)',\s*'([^']+)',\s*\d+/gm)) {
  if (!sourceRows.some(row => row.id === match[1])) sourceRows.push({ id: match[1], name: match[2], cat: 'treasure', how: 'special', storyOnly: true });
}
const discoveries = sourceRows.map(row => ({ ...row, assets: ['discoveries/', 'discovery-ends/', 'discovery-sheets/'].map(prefix => asset(prefix + row.id)) }));
const relics = Object.values(G.RELIC).map(row => ({ ...row, assets: ['relics/', 'items/', 'figureheads/'].map(prefix => asset(prefix + row.id)), chain: G.Img.chain.relic(row) }));
const evidence = discoveries.filter(row => row.evidence).map(row => ({ id: 'evidence_' + row.id, disc: row.id, name: row.evidence, desc: row.desc, asset: asset('items/evidence_' + row.id) }));
const clues = (G.TAVERN_SPECIAL || []).filter(row => row.ev).map(row => ({ id: 'evidence_' + row.id, sp: row.id, disc: row.disc, name: row.ev.name, desc: row.ev.desc, asset: asset('items/evidence_' + row.id) }));
const missingScenes = discoveries.filter(row => !row.assets[0].file);
const missingSets = discoveries.filter(row => row.assets.some(item => !item.file || !item.manifest));
const missingRelics = relics.filter(row => row.assets.every(item => !item.file));
const missingEvidence = evidence.filter(row => !row.asset.file || !row.asset.manifest);
const missingClues = clues.filter(row => !row.asset.file || !row.asset.manifest);
const summary = { discoveries: discoveries.length, relics: relics.length, evidence: evidence.length, clues: clues.length, missingScenes: missingScenes.length, missingSets: missingSets.length, missingRelics: missingRelics.length, missingEvidence: missingEvidence.length, missingClues: missingClues.length };
const report = { summary, discoveries, relics, evidence, clues, missingScenes, missingSets, missingRelics, missingEvidence, missingClues };
const outIndex = process.argv.indexOf('--out');
const out = outIndex >= 0 ? process.argv[outIndex + 1] : 'artifacts/discovery-art-20261111/audit-current.json';
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (process.argv.includes('--strict') && [missingScenes, missingSets, missingRelics, missingEvidence, missingClues].some(rows => rows.length)) process.exitCode = 1;
