/* 라이벌 → 일반 NPC → 지역·역할 NPC → 동료 순서로 무릎상 보유 현황과 생성 대상을 만든다. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const portraits = path.join(root, 'images', 'portraits');
const order = ['rivals', 'npc', 'npc-roles', 'mates'];
const extRe = /\.(png|webp|jpe?g)$/i;

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (extRe.test(e.name)) out.push(f);
  });
}

function keyOf(file) {
  return path.relative(path.join(root, 'images'), file).replace(/\\/g, '/').replace(/\.[^.]+$/, '');
}

const categories = {};
order.forEach(name => {
  const files = [];
  walk(path.join(portraits, name), files);
  const keys = files.map(keyOf);
  const all = new Set(keys);
  const base = keys.filter(k => !/_half$/.test(k)).sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));
  const missing = base.filter(k => !all.has(k + '_half'));
  categories[name] = { base, missing, summary: { total: base.length, withHalf: base.length - missing.length, missing: missing.length } };
});

const out = {
  order,
  summary: Object.fromEntries(order.map(k => [k, categories[k].summary])),
  total: order.reduce((n, k) => n + categories[k].summary.total, 0),
  totalMissing: order.reduce((n, k) => n + categories[k].summary.missing, 0),
  categories
};

if (process.argv.includes('--write')) {
  const dest = path.join(root, 'docs', 'art', 'portrait-knee-extension.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify({ order: out.order, summary: out.summary, total: out.total, totalMissing: out.totalMissing }, null, 2));
  console.log(dest);
} else console.log(JSON.stringify(out, null, 2));
