/* 실제 자료 순서와 그림 선택 경로로 발견물·소지품·교역품 누락을 조사한다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/asset-completeness-20261106');
const context = vm.createContext({console, document: {readyState: 'loading'}, performance, addEventListener() {}});
context.window = context; context.G = {};
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const run = file => vm.runInContext(read(file), context, {filename: file});
const scripts = [...read('index.html').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
for (const file of scripts) {
  if (file === 'js/core/util.js' || file.startsWith('js/data/')) run(file);
  else if (file === 'js/world/geo.js' || file === 'js/systems/story.js') run(file);
  else if (file.startsWith('js/systems/') && /G\.ITEMS\.push\(/.test(read(file))) run(file);
}
run('images/manifest.js'); run('js/core/images.js');
const G = context.G;
function fileFor(key) {
  const file = G.IMAGE_FILES[key];
  return file && fs.existsSync(path.join(ROOT, 'images', file)) ? file : null;
}
function audit(list, chainOf, ownOf) {
  return list.map(obj => {
    const chain = Array.from(chainOf(obj));
    const specific = chain.filter(k => !/^(discovery-cats|item-kinds|relic-kinds|good-kinds)\//.test(k));
    const key = specific.find(fileFor) || null;
    const own = ownOf(obj);
    return {id: obj.id, name: obj.name, kind: obj.kind || obj.cat, desc: obj.desc || '', chain, own,
      ownExists: !!fileFor(own), key, file: key ? fileFor(key) : null,
      relatedFiles: ['discoveries/', 'discovery-ends/', 'discovery-sheets/', 'goods/', 'items/'].map(p => p + obj.id).filter(fileFor)};
  });
}
const rows = {
  discoveries: audit(Object.values(G.DISC), G.Img.chain.discovery, obj => 'discoveries/' + obj.id),
  items: audit(Object.values(G.ITEM), G.Img.chain.item, obj => 'items/' + obj.id),
  goods: audit(Object.values(G.GOOD), G.Img.chain.good, obj => 'goods/' + obj.id)
};
const summary = Object.fromEntries(Object.entries(rows).map(([group, values]) => [group,
  {total: values.length, dedicated: values.filter(r => r.ownExists).length,
    sharedSpecific: values.filter(r => !r.ownExists && r.key).length, missing: values.filter(r => !r.key).length}]));
fs.mkdirSync(OUT, {recursive: true});
const report = {summary, rows};
fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'missing.json'), JSON.stringify(Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.filter(r => !r.key)])), null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
for (const [group, values] of Object.entries(rows)) {
  const missing = values.filter(r => !r.key);
  if (missing.length) console.log(group + ': ' + missing.map(r => r.id + ' (' + r.name + ')').join(', '));
}
if (process.argv.includes('--strict') && Object.values(summary).some(v => v.missing)) process.exitCode = 1;
