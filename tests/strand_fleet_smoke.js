/* 남겨 둔 함대 (2026-10-21) — js/systems/strandfleet.js · js/city/shipyard.js Y.buy
   · 탐험대가 배(상륙 지점)에서 멀리 떨어진 항구(뭍길로 들어옴)의 조선소: 「남겨 둔 배는 2년 안에 찾으러 가지 않으면 버려진다」를 묻고
     새 배로 함대를 꾸린다 — 원래 배·짐·식량·물은 그 자리에 · 육상 탐험이 끝나 이 항구에서 출항 · 탈것은 이 도시 마구간
   · 가까우면(3° 안) 묻지 않는다 · 365·90·30일 남으면 알리고, 2년이 지나면 폐기
   · 바다에서 그 자리에 가면 배와 짐을 되찾는다 · 출발 항구에 남겼으면 그 항구에 들어가면 되찾는다
   · 되찾아 5척을 넘으면 넘는 수만큼 폐기 — 제독이 고른다 (기함은 고를 수 없다)
   node tests/strand_fleet_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    const r = await page.evaluate(async () => {
      const s = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.date = { y: 1500, m: 3, d: 1 }; s.player.gold = 200000;
      const R = G.R, C = G.Scenes.city, Y = C.B.shipyard, f = s.fleet, out = {};
      f.ships.push(R.newShip('caravel', '두 번째')); f.crew = 40; f.food = 120; f.water = 100; f.mat = 12;   // 두 척 짐칸 안 (되찾을 때 넘는 짐은 버린다 — QA 2026-10-23)
      f.cargo = { wine: { q: 30, cost: 50, from: 0, d: s.day, lots: { 0: { q: 30, cost: 50 } } } };
      const names0 = f.ships.map(x => x.name);
      // 리스본 앞바다에 배를 대고 상륙 → 걸어서 말라가에 들어왔다 (말을 타고)
      const mal = G.CITY_DATA[9], ship = { type: 'ship', lon: -9.45, lat: 38.6 };
      G.Game.go('city', { cityId: 9, via: 'land' }); await new Promise(r => setTimeout(r, 1500));
      document.querySelectorAll('.modal-back').forEach(m => m.remove());
      s.loc.via = 'land'; s.landReturn = { lon: mal.lon, lat: mal.lat, base: ship, party: 40, days: 20, mount: { id: 'horse', n: 40, draft: 'horse' } };
      // 가까우면 묻지 않는다: 카디스 앞바다에 배가 있으면 말라가는 1.9°
      s.landReturn.base = { type: 'ship', lon: -6.3, lat: 36.3 }; out.nearFar = G.Strand.farFrom(mal); s.landReturn.base = ship;
      out.far = G.Strand.farFrom(mal);
      // 조선소 「구입」 — 실제 창: 배 카드를 누르고, 물음에 답한다
      const asked = [], said = [];
      C.mateAsk = async (t, opts) => { asked.push(t + ' || ' + opts.map(o => o.label).join('|')); return 'go'; };
      const say0 = C.say, mate0 = C.mate; C.say = async (w, t) => { said.push(t); }; C.mate = async t => { said.push('부관: ' + t); };
      const U0 = { choose: G.UI.choose, confirm: G.UI.confirm, prompt: G.UI.prompt };
      G.UI.choose = async () => 0; G.UI.confirm = async () => true; G.UI.prompt = async () => '희망';
      const pb = Y.buy(mal);
      for (let i = 0; i < 40 && !document.querySelector('.shipcard.click'); i++) await new Promise(r => setTimeout(r, 100));
      document.querySelector('.shipcard.click').click();
      await pb;
      Object.assign(G.UI, U0);
      out.asked = asked; out.said = said;
      out.after = { ships: f.ships.map(x => x.name), cargo: Object.keys(f.cargo), food: f.food, water: f.water, mat: f.mat, crew: f.crew, cmax: R.crewMax(), landReturn: !!s.landReturn, via: s.loc.via, stable: s.stable && s.stable[9] };
      const sd = s.strands && s.strands[0];
      out.strand = sd && { crew: sd.crew || 0, ships: sd.ships.map(x => x.name), cargo: Object.keys(sd.cargo), food: sd.food, water: sd.water, lon: sd.lon, lat: sd.lat, keep: sd.until - sd.since, place: sd.place };
      out.harbor = await C.B.harbor.enter(mal);       // 이제 이 항구에서 출항할 수 있다 (예전: 「우리 함대는 이 항구에 없습니다」)
      out.panel = G.Strand.panelHtml();
      // 남은 날 알림 · 폐기
      const day0 = s.day;
      s.day = sd.until - 365; const w1 = G.Strand.daily(); s.day = sd.until - 364; const w1b = G.Strand.daily();
      s.day = sd.until - 90; const w2 = G.Strand.daily();
      out.warn = [w1.map(m => m.text), w1b.length, w2.map(m => m.text)];
      // 바다에서 그 자리 곁으로 가면 되찾는다
      s.day = sd.until - 10;
      out.notYet = (await G.Strand.atSea(-5, 36)).length;
      const back = await G.Strand.atSea(-9.6, 38.5);
      out.back = { msg: back.map(m => m.text), ships: f.ships.map(x => x.name), wine: f.cargo.wine && f.cargo.wine.q, food: f.food, strands: s.strands.length, crew: f.crew };
      // 다시 남겨 두고 기한을 넘기면 폐기
      s.strands.push({ id: 'x', ships: [R.newShip('cog', '버려질')], cargo: { salt: { q: 5, cost: 10 } }, food: 10, water: 10, mat: 0, lon: 10, lat: 10, city: null, place: '어느 해안', since: s.day, until: s.day + 730, warned: {} });
      s.day += 730; const gone = G.Strand.daily();
      out.gone = { msg: gone.map(m => m.text), strands: s.strands.length };
      // 출발 항구(리스본)에 남겼으면 그 항구에 들어가면 되찾는다
      s.strands.push({ id: 'y', ships: [R.newShip('cog', '리스본의')], cargo: {}, food: 0, water: 0, mat: 0, lon: -9.36, lat: 38.45, city: 0, place: '리스본 항구', since: s.day, until: s.day + 730, warned: {} });
      out.city = { msg: await G.Strand.atCity(G.CITY_DATA[0]), has: f.ships.some(x => x.name === '리스본의'), strands: s.strands.length };
      // 되찾아 5척을 넘으면 넘는 수만큼 폐기 — 제독이 고른다 (기함은 목록에 없다)
      const mk = (n, ids) => ({ id: n, ships: ids.map(x => R.newShip('cog', x)), cargo: {}, food: 0, water: 0, mat: 0, lon: 20, lat: 20, city: null, place: '어느 만', since: s.day, until: s.day + 730, warned: {} });
      while (f.ships.length > 4) f.ships.pop(); while (f.ships.length < 4) f.ships.push(R.newShip('cog', '채움' + f.ships.length));
      s.strands = [mk('o1', ['갑', '을'])];
      const offered = [], ch0 = G.UI.choose;
      G.UI.choose = async (t, opts) => { offered.push(opts.map(o => o.label).join('|')); return opts.find(o => o.label === '을호').value; };
      const over1 = await G.Strand.atSea(20, 20);
      out.over1 = { msg: over1.map(m => m.text), ships: f.ships.map(x => x.name), offered: offered.slice(), flag: f.ships[0].name };
      // 넘는 수가 둘이면 두 번 고른다 · 답이 없으면 값어치가 가장 낮은 배
      s.strands = [mk('o2', ['병', '정'])]; offered.length = 0;
      G.UI.choose = async (t, opts) => { offered.push(t); return null; };
      const over2 = await G.Strand.atSea(20, 20);
      out.over2 = { msg: over2.map(m => m.text), n: f.ships.length, asked: offered.length };
      // (QA 2026-10-23) 되찾아 폐기한 뒤 정원·짐칸을 넘으면 정리 — 넘는 선원은 내리고, 값 낮은 짐부터 버린다
      while (f.ships.length > 4) f.ships.pop();
      f.cargo = {}; f.food = 0; f.water = 0; f.mat = 0; f.crew = R.crewMax();
      const big = R.newShip('galleon', '큰배');
      s.strands = [{ id: 'o3', ships: [big], crew: 300, cargo: { wheat: { q: 2000, cost: 8 }, silk: { q: 50, cost: 300 } }, food: 0, water: 0, mat: 0, lon: 20, lat: 20, city: null, place: '어느 곶', since: s.day, until: s.day + 730, warned: {} }];
      G.UI.choose = async (t, opts) => opts.find(o => o.label === '큰배호').value;
      const over3 = await G.Strand.atSea(20, 20);
      out.over3 = { msg: over3.map(m => m.text), crew: f.crew, cmax: R.crewMax(), used: R.used(), cap: R.fleetCap(), silk: f.cargo.silk && f.cargo.silk.q, wheat: f.cargo.wheat ? f.cargo.wheat.q : 0 };
      // 남겨 둔 함대 안의 빌린 배: 후원 계약이 끝나 돌려줄 때 잃은 것으로 물리지 않는다
      const lent = R.newShip('caravel', '빌린'); lent.loan = true;
      s.strands = [{ id: 'o4', ships: [lent], cargo: {}, food: 0, water: 0, mat: 0, lon: 30, lat: 30, city: null, place: '먼 해안', since: s.day, until: s.day + 730, warned: {} }];
      const ret = G.Sponsor.returnLoan({ loan: lent.uid, loanType: 'caravel' });
      out.loan = { returned: !!ret.returned, lost: ret.lost, cost: ret.cost, strands: s.strands.length };
      G.UI.choose = ch0;
      C.say = say0; C.mate = mate0; s.day = day0;
      // 옛 저장: strands가 없어도
      delete s.strands; out.old = [G.Strand.daily().length, (await G.Strand.atSea(0, 0)).length, G.Strand.panelHtml()];
      out.names0 = names0;
      return out;
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 3000));
    ok(r.nearFar === null && r.far && r.far.dist > 3, '배가 3° 안이면 묻지 않고, 멀면(' + r.far.dist.toFixed(1) + '°) 묻는다');
    ok(r.asked.length === 1 && /2년\(730일\) 안에 찾으러 가지 않으면 버려집니다/.test(r.asked[0]) && /새 배를 지어 여기서 떠난다/.test(r.asked[0]), '조선소: 「남겨 둔 배는 2년 안에 찾으러 가지 않으면 버려집니다」를 묻는다');
    ok(r.after.ships.join() === '희망' && !r.after.cargo.length && r.after.food === 0 && r.after.crew === Math.min(40, r.after.cmax) && r.strand.crew === 40 - r.after.crew, '새 배 한 척으로 함대를 꾸린다 — 선원은 새 배 정원(' + r.after.cmax + ')까지, 넘는 ' + r.strand.crew + '명과 짐·식량은 원래 배에');
    ok(r.strand && r.strand.ships.join() === r.names0.join() && r.strand.cargo.join() === 'wine' && r.strand.food === 120 && r.strand.keep === 730 && r.strand.place === '리스본 근처 해안', '원래 배 ' + r.strand.ships.length + '척과 포도주·식량·물은 「' + r.strand.place + '」에 남는다 (730일)');
    ok(!r.after.landReturn && r.after.via === 'sea' && r.after.stable && r.after.stable.id === 'horse' && r.after.stable.n === 40 && r.harbor !== false, '육상 탐험이 끝나 이 항구에서 출항할 수 있다 — 말 40필은 말라가 마구간에');
    ok(/남겨 둔 배 2척/.test(r.panel) && /폐기/.test(r.panel), '함대 현황에 「남겨 둔 배 2척 · 리스본 근처 해안 — n일 안에 찾으러 가지 않으면 폐기」');
    ok(r.warn[0].length === 1 && /365일 뒤면 버려집니다/.test(r.warn[0][0]) && r.warn[1] === 0 && /90일 뒤/.test(r.warn[2][0]), '1년·90일 남았을 때 한 번씩 알린다');
    ok(r.notYet === 0 && /되찾았다/.test(r.back.msg[0]) && r.back.ships.length === 3 && r.back.wine === 30 && r.back.food === 120 && r.back.strands === 0, '바다에서 그 자리에 가면 배 2척과 포도주 30통·식량을 되찾는다');
    ok(/폐기되었다/.test(r.gone.msg[0]) && r.gone.strands === 0, '2년이 지나도록 찾으러 가지 않으면 배와 짐이 폐기된다');
    ok(/되찾았다/.test(r.city.msg) && r.city.has && r.city.strands === 0, '출발 항구에 남겼으면 그 항구에 들어가면 되찾는다');
    ok(r.over1.ships.length === 5 && r.over1.ships.indexOf('을') < 0 && r.over1.ships.indexOf('갑') >= 0 && r.over1.offered.length === 1 && r.over1.offered[0].indexOf(r.over1.flag + '호') < 0 && /을호를 폐기했다/.test(r.over1.msg[0]), '되찾아 6척이 되면 1척을 골라 폐기한다 (기함은 목록에 없다): ' + r.over1.msg[0].split('! ')[1]);
    ok(r.over2.n === 5 && r.over2.asked === 2 && /폐기했다/.test(r.over2.msg[0]), '7척이 되면 2척 — 넘는 수만큼 폐기 (답이 없으면 값어치가 가장 낮은 배)');
    ok(r.back.crew === 40, '되찾으면 남겨 두었던 선원도 다시 함대로 (40명)');
    ok(r.over3.crew === r.over3.cmax && r.over3.used <= r.over3.cap && r.over3.silk === 50 && /선원 \d+명은 여기서 내렸다/.test(r.over3.msg[0]) && /짐칸이 모자라/.test(r.over3.msg[0]), '되찾아 폐기한 뒤 정원·짐칸을 넘으면: 선원은 정원까지, 짐은 값 낮은 밀부터 버린다 (비단은 그대로): ' + r.over3.msg[0].split('그대로다.')[1]);
    ok(r.loan.returned && !r.loan.lost && !r.loan.cost && r.loan.strands === 0, '남겨 둔 함대 안의 빌린 배도 돌려준 것으로 친다 (물지 않는다)');
    ok(r.old[0] === 0 && r.old[1] === 0 && r.old[2] === '', '옛 저장(남겨 둔 배 없음)도 그대로');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
