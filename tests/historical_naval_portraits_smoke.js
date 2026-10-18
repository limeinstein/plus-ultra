/* 역사 해전 인물의 얼굴상·무릎상과 이름 별칭 연결을 브라우저 없이 점검한다.
   node tests/historical_naval_portraits_smoke.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const sandbox = { window: { G: {} }, console };
sandbox.G = sandbox.window.G;
vm.createContext(sandbox);
for (const file of ['images/manifest.js', 'js/data/histfigures.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
}

const ids = [
  'hayreddin', 'oruc', 'sokollu', 'sinan', 'piyale', 'mimar', 'charles', 'turgut', 'adoria',
  'donjuan', 'colonna', 'venier', 'gadoria', 'barbarigo', 'bazan',
  'alipasha', 'uluch', 'suluk', 'pertev', 'karahoca', 'hasan', 'mehmedbey',
  'howard', 'drake', 'hawkins', 'winter', 'nassau', 'medina', 'recalde', 'oquendo', 'medrano', 'valdes', 'parma'
];
const M = sandbox.G.IMAGE_FILES;
const H = sandbox.G.Hist;
const missing = [];
for (const id of ids) {
  const pair = H.faceKeys(id).find(k => M[k] && M[k + '_half']);
  if (!pair) missing.push(id);
}
if (missing.length) throw new Error('얼굴상·무릎상 한 쌍이 없는 역사 인물: ' + missing.join(', '));
console.log('통과 — 역사 인물 ' + ids.length + '명 모두 얼굴상·무릎상 및 이름 연결 확인');
