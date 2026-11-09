/* 도감 저장소 손상·이전 형식·접근 제한에도 기록과 게임이 유지되는지 검사한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const source = fs.readFileSync(path.join(__dirname, '../js/systems/codexmemo.js'), 'utf8');
function boot(raw, blocked = false) {
  const storage = { getItem() { if (blocked) throw Error('차단'); return raw; }, setItem(k, v) { if (blocked) throw Error('차단'); raw = v; } };
  const sandbox = { localStorage: storage, setTimeout: () => 1, clearTimeout() {}, setInterval() {} };
  sandbox.window = { G: {}, localStorage: storage, addEventListener() {} };
  vm.runInNewContext(source, sandbox);
  return { memo: sandbox.window.G.CodexMemo, saved: () => JSON.parse(raw) };
}
for (const raw of ['null', 'true', '3', '"문자"', '[]', '{', '{"k":[],"n":null,"it":3,"f":"음식","d":false,"a":[],"y":"오늘"}', '{"y":-10}', '{"y":1e999}']) {
  const { memo, saved } = boot(raw);
  const m = memo.load();
  for (const field of ['k', 'n', 'it', 'f', 'd', 'a']) assert(m[field] && typeof m[field] === 'object' && !Array.isArray(m[field]));
  assert.equal(m.y, 0);
  memo.mark('it', 'sword'); memo.flush(); assert.equal(saved().it.sword, 1);
}
const old = boot('{"k":{"legend-events/old":1},"y":15250101}');
assert.equal(old.memo.load().k['legend-events/old'], 1);
assert.equal(old.memo.load().y, 15250101);
old.memo.mark('f', 'meal'); old.memo.flush();
assert.equal(old.saved().k['legend-events/old'], 1);
assert.equal(old.saved().f.meal, 1);
assert.equal(old.memo.load(true).f.meal, 1);
const denied = boot(null, true);
denied.memo.mark('n', '시험 인물'); denied.memo.flush();
assert.equal(denied.memo.load().n['시험 인물'], 1);
assert.doesNotThrow(() => denied.memo.sync());
console.log('도감 저장소: 손상 형식 10종·이전 기록 복원·접근 제한 통과');
