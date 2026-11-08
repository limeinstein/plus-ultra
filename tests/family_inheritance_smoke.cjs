/* 자녀 능력 계승: 실제 임신·출산 흐름, 과거 저장 호환, 부모 능력·나이의 분포를 고정 난수로 확인한다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const env = { console, Math, Date, document: { addEventListener() {} }, performance: { now: () => 0 } };
env.window = env; vm.createContext(env);
function load(file) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), env, { filename: file }); }
load('js/core/util.js'); load('js/data/base.js');
const G = env.G, keys = ['str', 'int', 'mar', 'cha'];
const s = { date: { y: 1500, m: 1, d: 1 }, day: 0, loc: { mode: 'city', city: 0 }, mates: [],
  player: { wife: 'main', wives2: [], kids: [], home: 0, st: { str: 55, int: 65, mar: 75, cha: 85 } } };
Object.assign(G, { Game: { state: s }, UI: {}, Art: {}, R: { age: () => s.date.y - 1470 }, State: { log() {} },
  CITY_DATA: [{ name: '고향' }], MAID: { main: { name: '동반자', like: 'kind' } }, MATE: { alt: { name: '동료', st: [80, 70, 60, 50], bornY: 1475 } } });
load('js/systems/family.js'); load('js/systems/wives.js');
const F = G.Family, W = G.Wives;
F.atHome = () => true;
G.BALANCE.family.twins = 0;
const bounded = st => assert(keys.every(k => Number.isInteger(st[k]) && st[k] >= 25 && st[k] <= 90));
G.U.rng = G.U.makeRng(20261108);
const pr = W.newPreg('main', 0, 100), before = JSON.stringify(pr.gen);
assert(pr.gen && pr.gen.faAge === 30);
s.player.st.int = 99; s.date.y = 1520;
assert.equal(JSON.stringify(pr.gen), before, '임신 뒤 부모의 성장으로 임신 때 기록이 바뀌면 안 됨');
s.player.preg = pr; s.day = 100;
const news = F.daily();
assert.equal(s.player.kids.length, 1); assert.equal(s.player.preg, null);
assert.equal(s.player.kids[0].gen.faAge, 30, '출생 때도 임신 시점의 나이를 사용'); bounded(s.player.kids[0].st);
assert(news.some(n => n.text.includes('태어났다'))); assert(F.kidStatLine(s.player.kids[0]).includes('30세'));
// 부모 기록이 없던 이전 저장의 임신도 실제 출산을 마친다.
s.player.preg = { since: 0, due: 100, told: true, sex: 'f' };
F.daily(); assert.equal(s.player.kids.length, 2); bounded(s.player.kids[1].st);
assert(s.player.kids[1].gen);
// 동료였던 둘째 부인의 임신 기록에는 그 어머니의 능력과 나이를 보존한다.
s.date.y = 1500;
const second = W.newPreg('alt', 0, 100);
assert.equal(second.gen.mo.str, 80); assert.equal(second.gen.mo.cha, 50); assert.equal(second.gen.moAge, 25);
const momAge = F.momAge('main'); s.date.y++; assert.equal(F.momAge('main'), momAge + 1);
assert.deepEqual(JSON.parse(JSON.stringify(F.momStats('main'))), JSON.parse(JSON.stringify(F.momStats('main'))));
function cohort(parent, faAge, moAge) {
  G.U.rng = G.U.makeRng(314159);
  const g = { fa: Object.fromEntries(keys.map(k => [k, parent])), mo: Object.fromEntries(keys.map(k => [k, parent])), faAge, moAge };
  let sum = 0; const all = new Set();
  for (let i = 0; i < 2000; i++) { const r = F.inherit(g); bounded(r.st); keys.forEach(k => sum += r.st[k]); all.add(JSON.stringify(r.st)); }
  assert(all.size > 100, '동일 부모의 아이들이 모두 같은 능력이 되면 안 됨');
  return sum / 8000;
}
const low = cohort(40, 30, 25), high = cohort(85, 30, 25), older = cohort(85, 65, 44);
assert(high > low + 25); assert(older < high - 5);
console.log('통과 — 임신 시점 기록·실제 출생·옛 저장·어머니 구분·나이 경과·6,000명 분포', { low, high, older });
