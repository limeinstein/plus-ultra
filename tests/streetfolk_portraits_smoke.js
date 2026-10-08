'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

global.window = { G: {} };
global.G = window.G;
[
  'js/core/util.js', 'images/manifest.js', 'js/core/images.js',
  'js/data/base.js', 'js/data/cities.js', 'js/data/streetfolk.js',
  'js/art/paint.js', 'js/art/portrait.js', 'js/art/streetfolk.js'
].forEach(p => require(path.join(root, p)));

const styles = G.Art.NPC_STYLES;
const humanTypes = Object.keys(G.STREET_FOLK.types).filter(t => !G.STREET_FOLK.types[t].animal);
assert.strictEqual(styles.length, 20);
assert.strictEqual(humanTypes.length, 13);
const missing = [];
for (const style of styles) for (const type of humanTypes) {
  const sprite = G.STREET_FOLK.sprites[type] || type;
  for (const suffix of ['', '_half']) {
    const key = `portraits/street-folk/${sprite}_${style}${suffix}`;
    if (!G.IMAGE_FILES[key] || !fs.existsSync(path.join(root, 'images', G.IMAGE_FILES[key]))) missing.push(key);
  }
}
assert.deepStrictEqual(missing, []);
console.log(JSON.stringify({ styles: styles.length, peoplePerStyle: humanTypes.length, assets: styles.length * humanTypes.length * 2 }, null, 2));
