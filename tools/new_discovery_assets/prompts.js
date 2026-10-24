#!/usr/bin/env node
/* 2026-10-18 신규 발견물 151종의 ImageGen 원화·도시 정면 건물·지도 아이콘 프롬프트를 만든다. */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
global.window = { G: {} };
for (const file of ['wonders.js', 'discadd.js', 'dh3disc.js', 'seasiadisc.js', 'northasiadisc.js', 'arabiadisc.js', 'zoodisc.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js', 'data', file), 'utf8'), { filename: file });
}

const G = window.G;
const added = new Set(G.DiscAdd.ids);
const rows = G.WONDERS.list.filter(row => added.has(row[0])).map(row => ({
  id: row[0], name: row[1], cat: row[2], lat: row[3], lon: row[4], how: row[5],
  desc: row[10], hint: row[11], extra: row[12] || {}
}));

function clean(text) { return String(text || '').replace(/\s+/g, ' ').trim(); }

const SAGRES_RUIN_PROMPT = `Use case: historical-scene
Asset type: exact 4-column by 4-row cinematic discovery storyboard source for a historical exploration game's ruin GIF pipeline
Primary request: Recreate Sagres as the historically plausible 15th-century Vila do Infante and Fortaleza de Sagres on Portugal's windswept southwestern headland. This discovery is called "Sagres Navigation School", but do NOT invent a grand academy building: portray a modest fortified settlement where Prince Henry gathered navigators, chartmakers, astronomers, pilots, and shipwrights.
Scene/backdrop: A broad, mostly flat, treeless limestone promontory exposed to Atlantic wind and ocean on three sides. A low fortified entrance wall with a central arched gate and stout earth-and-stone bastions cuts across the landward neck. Beyond it lies a very large open grass-and-stone parade ground, the simple low whitewashed Igreja de Nossa Senhora da Graça with a plain nave and small bell gable, a low row of practical dwellings/workrooms, a cistern, a windbreak wall, and the huge 43-metre circular stone compass/wind-rose pattern laid flat on the ground. Small groups of 15th-century Portuguese cartographers and mariners may study parchment charts, astrolabes and portolan maps in the open yard and plain workroom.
Storyboard: exact 4 columns by 4 rows, 16 equal panels, read left-to-right then top-to-bottom, thin clean gutters. Panels 1-5 show a miniature construction progression on a wooden drafting table. Panel 6 becomes the real place outside the low landward gate. Panels 7-9 pass through the gate into the enormous open yard and show navigators, the ground compass rose, modest church and workrooms. Panels 10-16 orbit the same complete site through midday, late afternoon, sunset, night, pre-dawn, sunrise, and clear morning. Final panel: the large ground compass rose in the foreground, low church and practical buildings beyond, Atlantic horizon behind.
Style/medium: polished photorealistic historical reconstruction, cinematic natural Atlantic light, high detail, coherent production storyboard, Portuguese 15th-century limestone and limewash.
Constraints: exact 4x4 grid; 16 distinct sequential panels; same low architecture, gate, open plateau, ground compass circle, coastline, materials and proportions; no captions, letters, numbers, UI, logo, or watermark.
Avoid: any tall tower, monastery, cloister, cathedral, palace, castle wrapping around a cliff edge, fantasy academy, dense city, modern visitor centre, modern tourists, roads, cars, giant freestanding compass sculpture, ornate star mosaic, invented enclosed quadrangle, inconsistent buildings, collage overlap.`;

const SAGRES_ICON_PROMPT = `Use case: stylized-concept
Asset type: one transparent world-map discovery icon for a historical exploration game
Primary request: Create one compact hand-painted isometric 3D miniature of the historically plausible Sagres fortress and Vila do Infante in Portugal, representing the "Sagres Navigation School" without inventing an academy.
Subject: A broad, flat, windswept limestone headland above the Atlantic. A low fortified entrance wall with a central arched gate crosses the landward edge. Behind it is a large open plateau with a clearly visible circular stone compass/wind-rose laid flat on the ground, a small plain whitewashed church with a tiny bell gable, and a short row of low practical white buildings.
Style/medium: polished hand-painted isometric 3D game miniature, realistic stone and limewash, crisp silhouette, warm natural daylight.
Composition/framing: slightly elevated three-quarter view, complete site centered in a square, generous transparent padding, readable at 256x256.
Constraints: genuinely transparent background; exactly one isolated miniature; no people, text, letters, numbers, label, logo, border, or watermark.
Avoid: tall tower, monastery, cloister, cathedral, palace, giant school building, fantasy architecture, ornate compass mosaic, modern visitor center, opaque background.`;

function ruinPrompt(r) {
  if (r.id === 'sagres') return SAGRES_RUIN_PROMPT;
  return `Use case: historical-scene
Asset type: 4x4 cinematic discovery storyboard source for the PLUS ULTRA browser game's ruin GIF pipeline
Primary request: Create one exact 4-column by 4-row storyboard sheet (16 equal panels, read left-to-right then top-to-bottom) for ${r.name}. It must be the same site and consistent architecture in every panel.
Scene/backdrop: ${clean(r.desc)} Location cue: ${clean(r.hint)}
Style/medium: polished photorealistic historical reconstruction concept art, cinematic natural light, high detail, coherent production storyboard.
Composition/framing: Panels 1-5 show a miniature construction progression on a wooden drafting table with parchment plans: surveyed site, foundations, structural frame or carved mass, exterior finish, completed miniature. Only panels 1-5 are tabletop miniatures. Panel 6 seamlessly becomes the real full-scale historical place. Panels 7-9 approach the entrance and inspect its real interior, courtyard, passage, or central space at human eye level; if the site has no interior, move through its actual paths and structural spaces without inventing a room. Panels 10-16 orbit the complete exterior consistently clockwise through midday, late afternoon, sunset, night, pre-dawn, sunrise, and clear morning. Panel 16 is a strong, recognizable hero view.
Constraints: exact 4x4 grid; 16 distinct sequential panels; same architecture, terrain, entrance, proportions and materials; historically and geographically plausible; no captions, letters, numbers, UI, logo, or watermark; thin clean gutters; keep rooflines, towers, statues and full silhouettes inside every panel.
Avoid: fantasy redesign, modern tourists, signs, roads or vehicles, inconsistent buildings, duplicated structures, invented chambers, collage overlap.`;
}

function naturePrompt(r) {
  return `Use case: photorealistic-natural
Asset type: extra-wide panoramic source for the PLUS ULTRA browser game's nature discovery GIF
Primary request: a geographically faithful, majestic panorama of ${r.name}.
Scene/backdrop: ${clean(r.desc)} Location cue: ${clean(r.hint)}
Style/medium: photorealistic natural-history landscape photography, documentary realism, rich but believable detail.
Composition/framing: very wide 9:4-friendly establishing view with the defining landform or waterscape fully readable, layered depth from foreground through horizon, enough detail across the entire width for a slow pan.
Lighting/mood: clear natural daylight with subtle atmospheric depth; awe without fantasy exaggeration.
Constraints: no people, buildings not intrinsic to the named place, signs, roads, vehicles, captions, letters, logos, borders, or watermark; accurate geology, vegetation, climate, scale, and water behavior.
Avoid: generic scenery, surreal colors, fantasy forms, heavy HDR, montage or split panels.`;
}

function animalPrompt(r) {
  return `Use case: photorealistic-natural
Asset type: exact 2x2 animal discovery storyboard source for the PLUS ULTRA browser game's animal GIF pipeline
Primary request: create four sequential wildlife-photo panels of ${r.name}, with the same juvenile and same protective adult in the same habitat.
Scene/backdrop: ${clean(r.desc)} Habitat and location cue: ${clean(r.hint)}
Style/medium: photorealistic wildlife documentary photography, natural anatomy, detailed fur, feathers, scales or skin, believable habitat and light.
Composition/framing: exact 2-column by 2-row grid. Top-left: only the juvenile's nose, beak, ears, eyes, or face edge peeks from cover. Top-right: the juvenile leans farther out and tilts its head. Bottom-left: the juvenile comes close and behaves curiously. Bottom-right: the protective adult appears behind it, both clearly visible and correctly scaled. Keep camera axis and habitat continuous.
Constraints: exactly four equal panels; same individuals and markings; correct species anatomy; no humans, cages, collars, captions, letters, logos, borders thicker than a thin gutter, or watermark; keep ears, horns, antlers, tails and wings inside panels.
Avoid: anthropomorphic smiles, pet accessories, hybrid animals, extra limbs, duplicate heads, aggressive attack, fantasy styling, collage overlap.`;
}

function treasurePrompt(r) {
  return `Use case: product-mockup
Asset type: exact 4x2 museum turntable storyboard source for the PLUS ULTRA browser game's treasure discovery GIF
Primary request: eight consistent 45-degree turntable views of ${r.name}. ${clean(r.desc)}
Scene/backdrop: dark neutral museum studio with a nearly black seamless background and subtle pedestal reflection.
Subject: one historically plausible ancient Egyptian ankh amulet, blue-green faience, looped cross form, worn excavated surface, no chain unless structurally necessary.
Style/medium: photorealistic museum object photography, macro material detail.
Composition/framing: exact 4-column by 2-row grid; views in clockwise order from front, front-right, right, back-right, back, back-left, left, front-left; identical object, scale, camera height, lighting and centered placement in every panel.
Constraints: no text, labels, hands, ruler, multiple objects, logo, or watermark; complete silhouette inside every panel; thin clean gutters.
Avoid: Christian crucifix form, gold jewelry redesign, fantasy runes, inconsistent geometry, collage overlap.`;
}

function landmarkPrompt(r) {
  return `Use case: stylized-concept
Asset type: transparent full-building cutout for a historical game city street landmark
Primary request: ${r.name}, shown as a single complete building in a strict centered frontal elevation, viewed straight on at human eye level. ${clean(r.desc)}
Style/medium: polished realistic architectural game asset, historically faithful materials and ornament, photographic detail with gently unified concept-art lighting.
Composition/framing: symmetrical or naturally centered front facade; entire structure from ground contact to highest roof, dome, spire or tower visible; generous transparent padding; building base level and horizontal; no perspective tilt, no aerial or three-quarter angle.
Lighting/mood: neutral warm daylight from slightly above, soft contact shadow directly under the building only.
Constraints: genuinely transparent background; one isolated building; clean alpha edges; no sky, street, trees blocking the facade, people, signs, captions, letters, flags with readable emblems, logo, frame, or watermark.
Avoid: side view, three-quarter view, fisheye, aerial view, cropped roof, cropped base, floating building, opaque backdrop.`;
}

const source = rows.map(r => ({
  id: r.id, name: r.name, cat: r.cat, target: r.cat === 'ruin' ? `tools/ruin_gifs/v3/master/${r.id}${r.id === 'sagres' ? '-v2' : ''}.png` :
    r.cat === 'nature' ? `tools/nature_gifs/sources/${r.id}.png` :
    r.cat === 'creature' ? `tools/animal_gifs/sources/${r.id}.png` :
    `tools/treasure_gifs/sources/${r.id}.png`,
  transparent: false,
  prompt: r.cat === 'ruin' ? ruinPrompt(r) : r.cat === 'nature' ? naturePrompt(r) : r.cat === 'creature' ? animalPrompt(r) : treasurePrompt(r)
}));

const landmarks = rows.filter(r => r.cat === 'ruin' && r.how === 'city').map(r => ({
  id: r.id, name: r.name, cat: 'landmark', target: `tools/new_discovery_assets/landmark-sources/${r.id}.png`,
  final: `images/landmarks/${r.id}.webp`, transparent: true, prompt: landmarkPrompt(r)
}));

const mapRows = rows.filter(r => (r.cat === 'ruin' || r.cat === 'nature') && r.how !== 'city');
const iconSheets = [];
for (const cat of ['ruin', 'nature']) {
  const subset = mapRows.filter(r => r.cat === cat);
  for (let offset = 0; offset < subset.length; offset += 16) {
    const chunk = subset.slice(offset, offset + 16);
    const no = 1 + Math.floor(offset / 16);
    const prefix = cat === 'ruin' ? 'new-ruins' : 'new-nature';
    const cells = chunk.map((r, i) => `${i + 1}. ${r.name}: ${clean(r.desc)}`).join('\n');
    iconSheets.push({
      id: `${prefix}-${no}`, cat: 'map-sheet', target: `images/map-discoveries/${prefix}-${no}.png`,
      ids: chunk.map(r => r.id), transparent: true,
      prompt: `Use case: stylized-concept\nAsset type: transparent 4x4 sprite sheet of miniature world-map discovery icons for a historical exploration game\nPrimary request: Create exactly ${chunk.length} distinct miniature ${cat === 'ruin' ? 'historical site and monument' : 'natural landmark'} icons in the listed order, filled left-to-right then top-to-bottom in an exact 4-column by 4-row grid. Empty remaining cells must stay fully transparent.\n${cells}\nStyle/medium: consistent hand-painted isometric 3D game miniatures, realistic materials, crisp silhouettes, warm natural light, matching the existing PLUS ULTRA map-discovery sheets.\nComposition/framing: every icon is centered in its own equal square cell, complete silhouette, same visual scale, slightly elevated three-quarter view, small integral ground/rock/water base, generous clear separation.\nConstraints: genuinely transparent background; exact 4x4 grid alignment; no cell borders, captions, letters, numbers, people, logo, or watermark; do not merge neighboring icons; preserve the exact listed order.\nAvoid: opaque backdrop, flat pictograms, photorealistic rectangular photos, cropped structures, overlapping cells, duplicate icons.`
    });
  }
}

// 2026-10-24 지역별 미스터리 유적 110곳. 도시형은 정면 외관으로,
// 그 밖의 육상·해상 발견물은 탐험 지도에서 보이는 투명 미니어처로 만든다.
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js', 'data', 'mysterydisc.js'), 'utf8'),
  { filename: 'mysterydisc.js' });
const mysterySet = new Set(G.MYSTERY_IDS || []);
const mysteryRows = G.WONDERS.list.filter(row => mysterySet.has(row[0])).map(row => ({
  id: row[0], name: row[1], cat: row[2], lat: row[3], lon: row[4], how: row[5],
  desc: row[10], hint: row[11], extra: row[12] || {}
}));
const mystery = mysteryRows.map(r => ({
  id: r.id, name: r.name, cat: 'ruin', target: `tools/ruin_gifs/v3/master/${r.id}.png`,
  transparent: false, prompt: ruinPrompt(r)
}));
const mysteryLandmarks = mysteryRows.filter(r => r.how === 'city').map(r => ({
  id: r.id, name: r.name, cat: 'landmark',
  target: `tools/new_discovery_assets/landmark-sources/${r.id}.png`,
  final: `images/landmarks/${r.id}.webp`, transparent: true, prompt: landmarkPrompt(r)
}));
const mysteryIconSheets = [];
const mysteryMapRows = mysteryRows.filter(r => r.how !== 'city');
for (let offset = 0; offset < mysteryMapRows.length; offset += 16) {
  const chunk = mysteryMapRows.slice(offset, offset + 16);
  const no = 1 + Math.floor(offset / 16);
  const cells = chunk.map((r, i) => `${i + 1}. ${r.name}: ${clean(r.desc)}`).join('\n');
  mysteryIconSheets.push({
    id: `mystery-ruins-${no}`, cat: 'map-sheet',
    target: `images/map-discoveries/mystery-ruins-${no}.png`,
    ids: chunk.map(r => r.id), transparent: true,
    prompt: `Use case: stylized-concept\nAsset type: transparent 4x4 sprite sheet of miniature world-map discovery icons for a historical exploration game\nPrimary request: Create exactly ${chunk.length} distinct miniature archaeological mystery-site icons in the listed order, filled left-to-right then top-to-bottom in an exact 4-column by 4-row grid. ${chunk.length < 16 ? `Cells ${chunk.length + 1}-16 must stay fully transparent.` : ''}\n${cells}\nStyle/medium: consistent hand-painted isometric 3D game miniatures, realistic historical materials, crisp silhouettes, warm natural light, matching the existing PLUS ULTRA map-discovery sheets.\nComposition/framing: every icon is centered in its own equal square cell, complete silhouette, same visual scale, slightly elevated three-quarter view, small integral ground, rock, cave, wreck or water base as appropriate, generous clear separation.\nConstraints: genuinely transparent background; exact 4x4 grid alignment; no cell borders, captions, letters, numbers, people, logo, or watermark; do not merge neighboring icons; preserve the exact listed order.\nAvoid: opaque backdrop, flat pictograms, photorealistic rectangular photos, cropped structures, overlapping cells, duplicate icons.`
  });
}

const payload = { generated: '2026-10-18', repaired: { sagres: {
  reason: '가상의 고탑 수도원 형태를 실제 사그레스의 낮은 요새·성당·바람장미로 교정',
  sourcePrompt: SAGRES_RUIN_PROMPT, mapIconPrompt: SAGRES_ICON_PROMPT
} }, source, landmarks, iconSheets, mystery, mysteryLandmarks, mysteryIconSheets };
const out = process.argv[2];
if (out) {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(path.resolve(out), JSON.stringify(payload, null, 2) + '\n');
} else {
  process.stdout.write(JSON.stringify(payload));
}
