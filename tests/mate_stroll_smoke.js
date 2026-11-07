/* 거리를 거니는 동료 (js/systems/matestroll.js · 2026-11-07) — node tests/mate_stroll_smoke.js   (SHOT=파일.png 이면 거리 화면을 찍는다)
   · 공주·셰에라자드·엘리자베타·마녀가 일행에 있으면 입항마다 10% 확률로 그 가운데 한 명이 거리를 걷는다 (2,000번 굴려 7~13%)
   · 한 번 들어온 동안은 같은 한 명 (건물에서 나와 거리 사람을 새로 풀어도) · 다음 도시에서는 다른 사람을 먼저
   · 일행에 없으면 나오지 않는다 · 전용 걷는 그림(characters/mates/<id>/walk 4×2) · 누르면 고유 말투로 이야기 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function ok(v, msg) { if (!v) throw new Error(msg); passed++; console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
    });
    // 1) 일행에 없으면 나오지 않는다
    const a = await page.evaluate(() => {
      const s = G.Game.state, MS = G.MateStroll; G.BALANCE.mateStroll.chance = 1;
      const out = { ids: Object.keys(G.MATE_WALKS), defined: Object.keys(G.MATE_WALKS).filter(id => G.MATE[id]).length };
      s.portVisit = 100; out.none = MS.pick(G.CITY_DATA[0]);
      ['cinderella', 'scheherazade', 'elizaveta', 'w_circe'].forEach(id => s.mates.push({ id, role: 'none', joined: 14800101, loyal: 80 }));
      // 2) 10% 확률
      G.BALANCE.mateStroll.chance = 0.1; let hit = 0; const N = 2000;
      for (let i = 0; i < N; i++) { s.portVisit = 1000 + i; if (MS.pick(G.CITY_DATA[0])) hit++; }
      out.rate = hit / N;
      // 3) 다음 도시: 지난번 사람이 아닌 사람
      G.BALANCE.mateStroll.chance = 1; let same = 0, prev = null;
      for (let i = 0; i < 200; i++) { s.portVisit = 5000 + i; const m = MS.pick(G.CITY_DATA[i % 2]); if (prev && m.id === prev) same++; prev = m.id; }
      out.same = same; out.pool = MS.pool().map(m => m.id);
      return out;
    });
    ok(a.ids.length === 31 && a.defined === 31, '걷는 그림이 있는 동료 31명 (공주 4 · 셰에라자드 · 엘리자베타 · 마녀 25): ' + a.ids.join(','));
    ok(a.none === null, '일행에 없으면 거리에 나오지 않는다');
    ok(a.rate > 0.07 && a.rate < 0.13, '입항마다 10% — 2,000번에 ' + (a.rate * 100).toFixed(1) + '%');
    ok(a.same === 0, '다음 도시에서는 지난번과 다른 사람 (200번 이어 굴려 같은 사람 ' + a.same + '번)');
    // 4) 실제 거리: 리스본에 들어가면 한 명이 걷는다
    await page.evaluate(() => { G.BALANCE.mateStroll.chance = 1; G.Game.go('city', { cityId: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Town.active() && G.Town.folks().length > 0, null, { timeout: 120000 });
    await page.waitForTimeout(2500);
    await page.waitForFunction(()=>{const f=G.Town.folks().find(f=>f.mate);return f&&f.frames&&f.frames.length===8&&G.Img.get(f.frames[0].k);},null,{timeout:20000,polling:100});
    const b = await page.evaluate(() => {
      const mates = () => G.Town.folks().filter(f => f.mate);
      const f0 = mates(), id0 = f0[0] && f0[0].mate, out = { n: f0.length, id: id0, name: f0[0] && f0[0].name, frames: !!(f0[0] && f0[0].frames && f0[0].frames.length === 8), img: !!(f0[0] && G.Img.get(f0[0].frames[0].k)), others: G.Town.folks().length - f0.length };
      const ids = []; for (let i = 0; i < 6; i++) { G.Town.respawnFolk(); ids.push(mates().map(f => f.mate).join('+')); }
      out.respawn = ids;
      // 화면 가운데로 데려와 찍기 좋게
      const f = mates()[0], h = G.Town._hero(); f.x = h.x + 170; f.target = f.x; f.state = 'idle'; f.timer = 99; f.dir = -1;
      return out;
    });
    ok(b.n === 1 && b.frames && b.img && b.others >= 3, '리스본 거리: 마을 사람 ' + b.others + '명 + 동료 「' + b.name + '」 한 명 (전용 걷는 그림 8칸)');
    ok(b.respawn.every(x => x === b.id), '건물에서 나와 거리 사람을 새로 풀어도 같은 한 명: ' + b.respawn.join(' · '));
    if (process.env.SHOT) { await page.waitForTimeout(600); await page.screenshot({ path: process.env.SHOT }); }
    // 5) 말을 건다
    const c = await page.evaluate(async () => {
      const said = []; G.UI.say = async (t, who) => { said.push((who && who.name || '') + ': ' + t); };
      const f = G.Town.folks().filter(x => x.mate)[0];
      await G.Scenes.city.chatFolk(f); const first = said.slice(); said.length = 0;
      await G.Scenes.city.chatFolk(f); return { first, second: said.slice() };
    });
    ok(c.first.length === 3 && /다가온다/.test(c.first[0]) && c.first.slice(1).every(x => x.startsWith(b.name + ':')), '말을 걸면: ' + c.first.map(x => x.slice(0, 50)).join(' / '));
    ok(c.second.length === 1, '두 번째: ' + c.second.map(x => x.slice(0, 50)).join(' / '));
    // 6) 다른 도시에 들어가면 다시 굴린다 (지난번 사람 빼고)
    const d = await page.evaluate(async () => {
      G.Game.go('city', { cityId: 1 }); await new Promise(r => setTimeout(r, 4000));
      return { city: G.Game.state.loc.city, mates: G.Town.folks().filter(f => f.mate).map(f => f.mate), v: G.Game.state.mateStroll };
    });
    ok(d.mates.length === 1 && d.mates[0] !== b.id, '다음 도시(' + d.city + '): 다른 사람 「' + d.mates[0] + '」 (지난번 ' + b.id + ')');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' | ') : ''));
    console.log('통과 ' + passed);
  } catch (e) { console.log('실패: ' + e.message); if (errors.length) console.log(errors.join('\n')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
