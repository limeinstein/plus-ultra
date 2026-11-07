/* 남겨 둔 배를 뭍길로 찾으러 가기 (제보 2026-11-06 #153) — js/systems/strandfleet.js SF.offerByLand
   바스라에 배 5척을 두고 알렉산드리아까지 낙타로 가서 새 배를 샀다 → 다시 알렉산드리아에 내려 걸어서 바스라에 들어갔더니
   「우리 함대는 이 항구에 없습니다」만 나오고 배를 되찾을 수 없었다(되찾기는 바다로 들어올 때만 했다).
   · 뭍길로 바스라에 들어오면 남겨 둔 배에 오를지 묻는다 — 오르면 5척과 짐을 되찾고, 지금 배는 알렉산드리아 항구에 남는다(2년)
   · 「나중에」를 고르면 그대로 · 항구 메뉴에서 다시 물을 수 있다 · 오른 뒤 항구에 들어가 출항할 수 있다
   node tests/strand_land_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    const r = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const s = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.date = { y: 1520, m: 3, d: 1 }; s.player.gold = 500000; s.settings.res = 0.35;
      s.player.home = 0;   // 모항이 아닌 곳에서 시험
      const R = G.R, C = G.Scenes.city, f = s.fleet, out = {};
      const byName = n => G.CITY_DATA.find(c => c && c.name === n);
      const bas = byName('바스라'), alx = byName('알렉산드리아');
      out.ids = [bas && bas.id, alx && alx.id];
      while (f.ships.length < 5) f.ships.push(R.newShip('caravel', '배' + f.ships.length));
      f.crew = 100; f.food = 200; f.water = 200;
      f.cargo = { pepper: { q: 20, cost: 300, from: bas.id, d: s.day, lots: {} } };
      const five = f.ships.map(x => x.name);
      // 1) 바스라에 배를 대고 상륙 → 낙타로 알렉산드리아에 들어와 새 배를 샀다 (조선소 구입의 결과와 같게)
      s.loc.via = 'land'; s.landReturn = { lon: alx.lon, lat: alx.lat, base: { type: 'city', city: bas.id }, party: 100, days: 40, mount: { id: 'walk', n: 0 } };
      const far = G.Strand.farFrom(alx); out.far = !!far;
      await G.Strand.leaveAndBoard(alx, R.newShip('caravel', '작은배'), far);
      out.afterBuy = { ships: f.ships.map(x => x.name), strands: s.strands.map(x => ({ city: x.city, n: x.ships.length })) };
      // 2) 1년이 지나 알렉산드리아에 다시 내려(출발 항구 = 알렉산드리아) 걸어서 바스라 성문에 들어온다
      s.day += 300;
      s.landReturn = { lon: bas.lon, lat: bas.lat, base: { type: 'city', city: alx.id }, party: f.crew, days: 30, mount: { id: 'walk', n: 0 } };
      const asked = [], said = [];
      let answer = null;
      C.mateAsk = async (t, opts) => { asked.push(t + ' || ' + opts.map(o => o.label).join('|')); return answer; };
      C.mate = async t => { said.push(t); };
      G.UI.say = async t => { said.push('say: ' + t); };
      // 2-a) 「나중에」 — 그대로 뭍길
      G.Game.go('city', { cityId: bas.id, via: 'land', arrive: true });
      // 입항 때 뜨는 「세상의 소식」 같은 창은 닫아 가며 물음을 기다린다
      for (let i = 0; i < 300 && !asked.length; i++) { await wait(100); const mb = document.querySelector('.modal-back'); if (mb && !asked.length) { const b = mb.querySelector('button'); if (b) b.click(); } }
      await wait(800);
      document.querySelectorAll('.modal-back').forEach(m => m.remove());
      out.later = { asked: asked.slice(), via: s.loc.via, ships: f.ships.map(x => x.name), strands: s.strands.length };
      // 2-b) 항구에 가면 다시 묻는다 → 오른다
      answer = 'go';
      const hv = await C.B.harbor.enter(bas);
      out.harbor = { ret: hv, asked: asked.length, said: said.slice() };
      out.after = {
        ships: f.ships.map(x => x.name), cargo: Object.keys(f.cargo), food: f.food, via: s.loc.via, landReturn: !!s.landReturn,
        strands: s.strands.map(x => ({ city: x.city, ships: x.ships.map(y => y.name), keep: x.until - x.since, place: x.place }))
      };
      out.five = five;
      // 3) 오른 뒤 항구에 다시 들어가면 정상(출항 가능)
      out.harbor2 = await C.B.harbor.enter(bas);
      // 4) 다른 항구에 뭍길로 들어오면 묻지 않는다
      asked.length = 0;
      s.loc.via = 'land'; out.otherPort = G.Strand.hereByLand(alx).length === 1 ? 'alx-has-small' : 'none';
      s.loc.via = 'sea';
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.ids[0] != null && r.ids[1] != null && r.far, '바스라·알렉산드리아는 멀다 (조선소가 「남기고 떠날까」를 묻는 거리)');
    ok(r.afterBuy.ships.join() === '작은배' && r.afterBuy.strands.length === 1 && r.afterBuy.strands[0].city === r.ids[0] && r.afterBuy.strands[0].n === 5, '알렉산드리아에서 새 배 → 5척은 바스라 항구에 남는다');
    ok(r.later.asked.length === 1 && /바스라|남겨 두었던 배 5척/.test(r.later.asked[0]) && /알렉산드리아 항구에 남게/.test(r.later.asked[0]), '뭍길로 바스라에 들어오면 남겨 둔 배에 오를지 묻는다: ' + (r.later.asked[0] || '').split('\n')[0]);
    ok(r.later.via === 'land' && r.later.ships.join() === '작은배' && r.later.strands === 1, '「나중에」면 그대로 (탐험대는 성문 밖, 배는 그대로)');
    ok(r.harbor.ret !== false && r.harbor.asked === 2, '항구에 가면 다시 묻고, 오르면 항구에 들어간다 (예전: 「우리 함대는 이 항구에 없습니다」)');
    ok(r.after.ships.join() === r.five.join() && r.after.cargo.indexOf('pepper') >= 0 && r.after.food >= 200, '남겨 둔 5척과 후추·식량을 되찾는다');
    ok(r.after.via === 'sea' && !r.after.landReturn, '육상 탐험이 끝나 바스라에서 출항할 수 있다');
    ok(r.after.strands.length === 1 && r.after.strands[0].city === r.ids[1] && r.after.strands[0].ships.join() === '작은배' && r.after.strands[0].keep === 730, '작은배는 거꾸로 알렉산드리아 항구에 남는다 (730일)');
    ok(r.harbor2 !== false, '오른 뒤 항구에 다시 들어가도 정상');
    ok(r.otherPort === 'alx-has-small', '알렉산드리아에 뭍길로 가면 작은배에 오를 수 있다');
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
