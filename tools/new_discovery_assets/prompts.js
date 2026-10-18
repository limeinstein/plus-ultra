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

function ruinPrompt(r) {
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
  id: r.id, name: r.name, cat: r.cat, target: r.cat === 'ruin' ? `tools/ruin_gifs/v3/master/${r.id}.png` :
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

const payload = { generated: '2026-10-18', source, landmarks, iconSheets };
const out = process.argv[2];
if (out) {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(path.resolve(out), JSON.stringify(payload, null, 2) + '\n');
} else {
  process.stdout.write(JSON.stringify(payload));
}
