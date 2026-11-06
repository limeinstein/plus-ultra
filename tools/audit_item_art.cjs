/* 실제 자료 읽는 순서와 그림 체인으로 소지품 전용 원화를 검사한다. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console, document: {}, performance });
context.window = context;
context.G = {};
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const run = file => vm.runInContext(read(file), context, { filename: file });
const scripts = [...read('index.html').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
for (const file of scripts) {
  if (file === 'js/core/util.js' || file.startsWith('js/data/')) run(file);
  else if (file.startsWith('js/systems/') && /G\.ITEMS\.push\(/.test(read(file))) run(file);
}
run('images/manifest.js');
run('js/core/images.js');
const G = context.G;
const rows = Object.values(G.ITEM).map(item => {
  const chain = Array.from(G.Img.chain.item(item));
  const specific = chain.filter(key => !/^(item|relic)-kinds\//.test(key));
  const key = specific.find(key => G.IMAGE_FILES[key] && fs.existsSync(path.join(root, 'images', G.IMAGE_FILES[key]))) || null;
  return { id: item.id, name: item.name, kind: item.kind, desc: item.desc, key, file: key ? G.IMAGE_FILES[key] : null, chain };
});
const missing = rows.filter(row => !row.key);
const summary = { total: rows.length, dedicated: rows.filter(row => row.key === 'items/' + row.id).length,
  sharedSpecific: rows.filter(row => row.key && row.key !== 'items/' + row.id).length,
  missing: missing.length, kinds: {} };
for (const row of rows) {
  const group = summary.kinds[row.kind] ||= { total: 0, missing: 0 };
  group.total++;
  if (!row.key) group.missing++;
}
const outArg = process.argv.indexOf('--out');
if (outArg >= 0) {
  const out = path.resolve(root, process.argv[outArg + 1]);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'runtime-audit.json'), JSON.stringify({ summary, rows }, null, 2) + '\n');
}
console.log(JSON.stringify(summary, null, 2));
if (process.argv.includes('--strict') && missing.length) {
  console.error('전용 원화 누락: ' + missing.map(row => row.id).join(', '));
  process.exitCode = 1;
}
