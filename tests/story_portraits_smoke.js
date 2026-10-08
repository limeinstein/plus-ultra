'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
global.window = { G: {} };
global.G = window.G;
require(path.join(root, 'images/manifest.js'));

const people = {
  'portraits/npc/story_mother': '레오노르 다 코스타',
  'portraits/npc/story_father': '김도현',
  'portraits/mates/anselmo': '안셀무 신부',
  'portraits/mates/estevao': '에스테방 누네스',
  'portraits/sponsors/pt_casanova': '카사노바 남작'
};
const missing = [];
for (const key of Object.keys(people)) for (const suffix of ['', '_half']) {
  const asset = key + suffix;
  const rel = G.IMAGE_FILES[asset];
  if (!rel || !fs.existsSync(path.join(root, 'images', rel))) missing.push(asset);
}
assert.deepStrictEqual(missing, []);
console.log(JSON.stringify({ people: Object.values(people), assets: Object.keys(people).length * 2 }, null, 2));
