/* 기존 주소 종료 경계·실행 중 종료·새 주소 유지 검사. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('web/legacy-access.js', 'utf8');
const end = Date.parse('2026-11-21T00:00:00+09:00');
let count = 0;
function equal(actual, expected) { assert.equal(actual, expected); count++; }
function client(path, time, hostname = 'limeinstein.github.io') {
  let wall = time, mono = 0, nextId = 0, server = null;
  const timers = new Map(), events = {}, redirects = [];
  class Clock extends Date { static now() { return wall; } }
  const ctx = {
    Date: Clock, performance: { now: () => mono },
    location: { hostname, pathname: path, replace: value => redirects.push(value) },
    setTimeout(fn, delay) { timers.set(++nextId, { fn, due: mono + delay }); return nextId; },
    clearTimeout(id) { timers.delete(id); }, setInterval() {},
    fetch: async () => ({ headers: { get: () => server } }),
    document: { addEventListener: (type, fn) => { events[type] = fn; } },
    addEventListener: (type, fn) => { events[type] = fn; }
  };
  ctx.window = ctx;
  vm.runInNewContext(code, ctx);
  return {
    ctx, redirects, events, setServer(value) { server = value; },
    advance(ms, wallDelta = ms) {
      mono += ms; wall += wallDelta;
      for (const [id, timer] of [...timers]) if (timer.due <= mono) { timers.delete(id); timer.fn(); }
    },
    allowed: () => ctx.PU_WEB_ACCESS.allowed()
  };
}
(async () => {
  for (const path of ['/plus-ultra/', '/plus-ultra/index.html', '/plus-ultra/beta/', '/plus-ultra/beta/index.html', '/plus-ultra/catalog.html']) {
    const before = client(path, end - 1);
    equal(before.allowed(), true);
    before.advance(1);
    equal(before.allowed(), false);
    equal(before.redirects[0], '/plus-ultra/closed.html');
    const after = client(path, end);
    equal(after.allowed(), false);
    equal(after.redirects.length, 1);
  }
  for (const path of ['/loop-good-hope/', '/loop-good-hope/beta/index.html', '/plus-ultrax/']) {
    const fresh = client(path, end + 86400000);
    equal(fresh.allowed(), true); equal(fresh.redirects.length, 0);
  }
  equal(client('/D:/game/index.html', end + 86400000, '').allowed(), true);
  const back = client('/plus-ultra/', end - 10);
  back.advance(11, -86400000);
  equal(back.allowed(), false); equal(back.redirects.length, 1);
  const server = client('/plus-ultra/beta/', end - 86400000);
  server.setServer(new Date(end).toUTCString());
  await new Promise(resolve => setImmediate(resolve));
  equal(server.allowed(), false); equal(server.redirects[0], '/plus-ultra/closed.html');
  const interaction = client('/plus-ultra/', end - 10);
  interaction.advance(11);
  let blocked = 0;
  interaction.events.pointerdown({ preventDefault() { blocked++; }, stopImmediatePropagation() { blocked++; } });
  equal(blocked, 2);
  console.log(`기존 주소 종료 검사 ${count}개 통과`);
})().catch(error => { console.error(error); process.exitCode = 1; });
