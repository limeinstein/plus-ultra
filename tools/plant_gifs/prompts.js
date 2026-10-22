#!/usr/bin/env node
/* js/data/plantdisc.js의 신규 식물 79종을 ImageGen 원화 지시문으로 바꾼다. */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
global.window = { G: { WONDERS: { list: [], relics: [], books: [], meta: {}, text: {}, leads: {}, front: {} } } };
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js', 'data', 'plantdisc.js'), 'utf8'), {
  filename: 'plantdisc.js'
});

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function prompt(row) {
  const id = row[0], name = row[1], description = clean(row[10]), hint = clean(row[11]);
  const extra = row[12] || {};
  const form = extra.cactus ? 'cactus' : extra.flower ? 'flowering plant' : extra.tree ? 'tree' : 'fruiting plant';
  return `Use case: photorealistic-natural
Asset type: 9:4 panoramic game discovery animation source
Primary request: Create a botanically accurate, breathtaking natural-history view of ${name} (${id}), shown as a living ${form} in the place where this discovery is found.
Scene/backdrop: ${description} Location cue: ${hint}
Subject: one unmistakable hero specimen or coherent natural cluster; show the full growth habit and the diagnostic bark, stems, leaves, flowers, fruit, thorns, cones or roots described above clearly enough to identify the plant.
Style/medium: cinematic high-end nature documentary photography, fully photorealistic and lifelike; broad tonal masses, clean silhouettes and clear depth layers suitable for a pen-sketch-to-photograph reveal.
Composition/framing: very wide 9:4 landscape, fixed frontal three-quarter view, complete hero plant and native habitat visible, no important detail near the edges, no close crop that hides the whole plant.
Lighting/mood: soft dawn light after rain or mist, wondrous first discovery, tranquil and believable.
Constraints: botanically and geographically accurate; no people, animals, modern objects, captions, text, labels, border, panel grid, logo, watermark, illustration or fantasy colors.`;
}

const plants = window.G.WONDERS.list.map(row => ({
  id: row[0],
  name: row[1],
  target: `tools/plant_gifs/sources/${row[0]}.png`,
  transparent: false,
  prompt: prompt(row)
}));

const payload = { generated: '2026-10-22', count: plants.length, plants };
const out = process.argv[2];
if (out) {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(path.resolve(out), JSON.stringify(payload, null, 2) + '\n');
} else {
  process.stdout.write(JSON.stringify(payload));
}
