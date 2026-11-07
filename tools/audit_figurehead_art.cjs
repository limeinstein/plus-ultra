/* 실제 등록된 선수상의 전용 조각 원화 누락을 조사한다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console, document: {}, performance });
context.window = context; context.G = {};
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scripts = [...read('index.html').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
for (const file of scripts) {
  if (file === 'js/core/util.js' || file.startsWith('js/data/')) vm.runInContext(read(file), context, { filename: file });
}
for (const file of ['images/manifest.js', 'js/core/images.js']) vm.runInContext(read(file), context, { filename: file });
const G = context.G;
const rows = G.FIGUREHEADS.map(f => {
  const key = G.Img.pick(G.Img.chain.figurehead(f));
  const dedicated = ['webp', 'png', 'jpg'].some(ext => fs.existsSync(path.join(root, 'images/figureheads', f.id + '.' + ext)));
  return { ...f, desc: (G.RELIC[f.id] || G.ITEM[f.id] || {}).desc || '', dedicated, selected: key };
});
const out = path.join(root, 'artifacts/figureheads-20261107');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'inventory.json'), JSON.stringify(rows, null, 2) + '\n');
const dedicated = rows.filter(f => f.dedicated);
const missing = rows.filter(f => !f.selected || /^(discovery-ends|discoveries|sea-monsters)\//.test(f.selected));
const report = { total: rows.length, dedicated: dedicated.length, sharedSculpture: rows.length - dedicated.length - missing.length,
  missing: missing.length, rows: missing.map(f => ({id:f.id,name:f.name,desc:f.desc,selected:f.selected,legend:f.legend,src:f.src})) };
fs.writeFileSync(path.join(out, 'audit-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(process.argv.includes('--summary') ? { ...report, rows: undefined } : report, null, 2));
if (process.argv.includes('--strict') && missing.length) process.exitCode = 1;
