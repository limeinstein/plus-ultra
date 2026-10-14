#!/usr/bin/env node
/* Build the deterministic queue for the 672-piece portrait completion pass. */
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const legacyHistoricalPairs = new Set([
  'h_hongildong', 'h_jangnoksu', 'h_jogwangjo', 'h_sinsaimdang',
  'h_yihwang', 'h_imkkeokjeong', 'h_yiyi', 'h_nangseolheon',
  'h_samyeong', 'h_gwakjaeu', 'h_nongae'
]);
global.window = { G: {} };
global.G = window.G;
require(path.join(root, 'js/data/regionfolk.js'));
require(path.join(root, 'js/data/court.js'));
require(path.join(root, 'js/data/princess.js'));

function exists(key) {
  return ['.webp', '.png', '.jpg', '.jpeg'].some(ext =>
    fs.existsSync(path.join(root, 'images', key + ext)));
}

const historical = G.REGION_FOLK.people.filter(person => !legacyHistoricalPairs.has(person.id)).map(person => {
  const base = 'portraits/mates/' + person.id;
  return {
    type: 'historical', id: person.id, name: person.name,
    gender: person.g, years: person.y, zones: person.zones,
    role: person.role || '', style: person.style || '', skills: person.sk,
    description: person.desc, biography: person.bio,
    face: base, half: base + '_half',
    needsFace: !exists(base), needsHalf: !exists(base + '_half')
  };
}).filter(person => person.needsFace || person.needsHalf);

const princesses = G.COURT.princesses.map(person => {
  const base = 'portraits/princesses/' + person.id;
  const realm = G.COURT.realms[person.realm];
  return {
    type: 'princess', id: person.id, name: person.name,
    gender: 'f', realm: person.realm, realmName: realm.name,
    kind: realm.kind, style: person.style,
    face: base, half: base + '_half',
    needsFace: !exists(base), needsHalf: !exists(base + '_half')
  };
});
const blancaBase = 'portraits/princesses/m_princess';
princesses.push({
  type: 'princess', id: G.PRINCESS.id, name: G.PRINCESS.name,
  gender: 'f', realm: 'ES', realmName: '에스파냐', kind: 'eu', style: 'ib',
  face: blancaBase, half: blancaBase + '_half',
  needsFace: !exists(blancaBase), needsHalf: !exists(blancaBase + '_half')
});

const sponsorDir = path.join(root, 'images', 'portraits', 'sponsors');
const sponsorFaces = fs.existsSync(sponsorDir) ? fs.readdirSync(sponsorDir)
  .filter(name => /_half\.(webp|png|jpg|jpeg)$/i.test(name))
  .map(name => {
    const stem = name.replace(/_half\.[^.]+$/i, '');
    const half = 'portraits/sponsors/' + name.replace(/\.[^.]+$/, '');
    const face = 'portraits/sponsors/' + stem;
    return {
      type: 'sponsor-face', id: stem, name: stem,
      source: path.join(sponsorDir, name), face, half,
      needsFace: !exists(face), needsHalf: false
    };
  }).filter(person => person.needsFace) : [];

const courtMissing = princesses.filter(person => person.needsFace || person.needsHalf);
const queue = historical.concat(courtMissing, sponsorFaces);
const result = {
  summary: {
    historicalMissingPeople: historical.length,
    princessMissingPeople: courtMissing.length,
    sponsorMissingFaces: sponsorFaces.length,
    missingFiles: queue.reduce((n, person) => n + (+person.needsFace) + (+person.needsHalf), 0)
  },
  queue
};

const typeArg = process.argv.indexOf('--type');
if (typeArg >= 0) {
  const type = process.argv[typeArg + 1];
  result.queue = result.queue.filter(person => person.type === type);
}
const offsetArg = process.argv.indexOf('--offset');
const offset = offsetArg >= 0 ? Math.max(0, +process.argv[offsetArg + 1] || 0) : 0;
const limitArg = process.argv.indexOf('--limit');
if (limitArg >= 0) result.queue = result.queue.slice(offset, offset + Math.max(0, +process.argv[limitArg + 1] || 0));
else if (offset) result.queue = result.queue.slice(offset);
console.log(JSON.stringify(result, null, process.argv.includes('--compact') ? 0 : 2));
