/* 직위(부관·항해사·측량사·경리·선장)와 기함 선실이 실제로 효과를 내는지 숫자로 견준다.
   같은 상태에서 「배치 전 → 배치 후」 값을 재어, 효과가 0이거나 거꾸로면 실패.
   node tests/roles_cabins_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const res = [];
function ok(v, msg) { res.push([!!v, msg]); console.log((v ? '  ✓ ' : '  ✗ ') + msg); }
(async function () {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
  await page.evaluate(() => G.Game.ensureGeo());
  await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
  // 새 게임: 제독은 특기 0, 큰 기함 + 배 2척, 부하는 특기를 정해서 넣는다
  await page.evaluate(() => {
    const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
    G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
    const s = G.Game.state; s.player.gold = 500000; s.date = { y: 1500, m: 6, d: 1 };
    G.SKILLS.forEach(x => { s.player.sk[x.id] = 0; });
    if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
    const big = ['galleon', 'carrack', 'nao'].filter(t => G.SHIP[t])[0];
    s.fleet.ships[0] = G.R.newShip(big, '기함'); s.fleet.ships[0].guns = { type: 'culverin', n: 20 };
    s.fleet.ships.push(G.R.newShip('caravel', '둘째')); s.fleet.ships.push(G.R.newShip('caravel', '셋째'));
    s.fleet.crew = 200; s.fleet.food = 500; s.fleet.water = 500; s.fleet.mat = 50;
    s.mates = [];
    const ids = G.MATES.filter(d => d.wage).map(d => d.id).filter(id => id !== 'rocco').slice(0, 30);
    window.__mk = function (k, sk) { const m = { id: ids[k], role: 'none', loyal: 70, sk: Object.assign({}, sk) }; G.SKILLS.forEach(x => { if (m.sk[x.id] == null) m.sk[x.id] = 0; }); s.mates.push(m); return m; };
    window.__ids = ids;
  });
  const E = (f, a) => page.evaluate(f, a);

  console.log('— 부관 (부관실)');
  const first = await E(() => {
    const s = G.Game.state, R = G.R, CB = G.Cabins;
    const m = __mk(0, { sword: 3, med: 2, acct: 2, nav: 3 }), other = __mk(1, { cook: 1 });
    other.room = null; other.role = 'interp'; other.loyal = 50;
    const before = { sword: R.skill('sword'), med: R.skill('med'), pow: CB.power('adjutant') };
    m.role = 'first';
    const after = { sword: R.skill('sword'), med: R.skill('med'), nav: R.skill('nav'), pow: CB.power('adjutant') };
    CB.monthly(true); const lo1 = other.loyal;
    m.role = 'none'; other.loyal = 50; CB.monthly(true); const lo0 = other.loyal;
    m.role = 'first'; m.loyal = 30; const halfSword = R.skill('sword'); m.loyal = 70;
    return { before, after, lo1, lo0, halfSword };
  });
  ok(first.before.sword === 0 && first.after.sword === 3 && first.after.med === 2, '부관의 검술 3·의술 2가 함대 특기로 쓰인다 (전 ' + first.before.sword + ' → 후 ' + first.after.sword + ')');
  ok(first.after.nav === 0, '부관의 항해술은 쓰이지 않는다 (항해는 항해사 몫) — ' + first.after.nav);
  ok(first.lo1 === 51 && first.lo0 === 50, '부관이 있으면 급료 낸 달 충성 70 아래 부하 +1 (부관 있음 ' + first.lo1 + ' · 없음 ' + first.lo0 + ')');
  ok(first.halfSword === 2, '충성 40 아래 부관은 건성 — 검술 3 → ' + first.halfSword);

  console.log('— 항해사 (조타실) · 측량사 (파수대)');
  const navsv = await E(() => {
    const s = G.Game.state, R = G.R, CB = G.Cabins;
    const n = __mk(2, { nav: 3, ops: 2, cook: 1 }), v = __mk(3, { survey: 3, hist: 2 });
    const b = { nav: R.skill('nav'), helm: CB.fx('helm', 'helm'), range: R.surveyRange(), look: CB.fx('lookout', 'lookout') };
    n.role = 'nav'; v.role = 'surveyor';
    const a = { nav: R.skill('nav'), ops: R.skill('ops'), helm: CB.fx('helm', 'helm'), range: R.surveyRange(), look: CB.fx('lookout', 'lookout'), hist: R.skill('hist') };
    return { b, a };
  });
  ok(navsv.a.nav === 3 && navsv.a.ops === 2, '항해사의 항해술 3·운용술 2가 쓰인다');
  ok(navsv.b.helm === 0 && navsv.a.helm > 0, '조타실: 하루 피로 −' + navsv.a.helm.toFixed(2) + ' (항해사 없을 때 0)');
  ok(navsv.a.range > navsv.b.range && navsv.a.look > 0, '파수대: 발견물을 알아보는 거리 ' + navsv.b.range.toFixed(2) + ' → ' + navsv.a.range.toFixed(2) + ' (측량 3 + 파수대 +' + navsv.a.look.toFixed(2) + ')');

  console.log('— 경리 (회계실)');
  const purser = await E(async () => {
    const s = G.Game.state, R = G.R, CB = G.Cabins, T = G.Scenes.city.B.trade, c = G.CITY_DATA[0];
    s.loc = { mode: 'city', city: 0, lon: c.lon, lat: c.lat };
    const p = __mk(4, { acct: 3 });
    const b = { pu: !!R.purser(), odds: T.haggleOdds(c).p, wages: CB.wages(), bmTries: G.BlackMarket && G.BlackMarket.Acct ? null : null };
    // 회계실로 고치고 앉힌다 → 이 사람이 경리
    const rooms = CB.rooms(); const i = rooms.indexOf('hold') > 0 ? rooms.indexOf('hold') : 1;
    CB.remodel(i, 'account'); CB.place(p, i);
    const a = { role: p.role, pu: R.purser() && R.purser().acct, odds: T.haggleOdds(c).p, disc: T.haggleOdds(c).disc, wages: CB.wages(), fx: CB.fx('account', 'haggle'), acct: R.skill('acct') };
    // 회계실에서 빼면 경리도 아니다
    CB.place(p, null); const out = { role: p.role, pu: !!R.purser() };
    CB.place(p, i);
    // 부하편성에서 「기함 경리」로만 맡기면 (회계실 없이) 경리 노릇은 하지만 회계실 덤은 없다
    const q = __mk(5, { acct: 3 }); G.Scenes.city.B.tavern.assign(q, 'purser');
    const c2 = { qRole: q.role, qRoom: q.room, pRole: p.role, pRoom: p.room == null ? null : p.room, pu: R.purser() && R.purser().id === q.id, fx: CB.fx('account', 'haggle') };
    G.Scenes.city.B.tavern.assign(p, 'purser');
    return { b, a, out, c2, i };
  });
  ok(!purser.b.pu && purser.a.role === 'purser' && purser.a.pu === 3, '회계실에 앉히면 그 사람이 경리 (회계 3)');
  ok(purser.a.odds > purser.b.odds, '값 깎기 성공률 ' + (purser.b.odds * 100).toFixed(0) + '% → ' + (purser.a.odds * 100).toFixed(0) + '% (경리 덤 + 회계실 +' + (purser.a.fx * 100).toFixed(0) + '%p)');
  ok(purser.a.wages < purser.b.wages, '회계실: 부하 급료 ' + purser.b.wages + ' → ' + purser.a.wages + '닢 (경리 본인 급료가 늘어난 것을 빼고 비율로)');
  ok(purser.out.role === 'none' && !purser.out.pu, '회계실에서 빼면 경리 자리도 내려놓는다');
  ok(purser.c2.qRole === 'purser' && purser.c2.pu && purser.c2.qRoom === purser.i && purser.c2.fx > 0, '부하편성 「기함 경리」로 바꿔도 새 경리가 회계실에 앉아 회계실 덤이 이어진다 (덤 +' + (purser.c2.fx * 100).toFixed(0) + '%p)');
  console.log('   ' + JSON.stringify(purser.c2));

  console.log('— 선장 (둘째·셋째 배)');
  const cap = await E(() => {
    const s = G.Game.state, R = G.R, sh = s.fleet.ships[1];
    const c = __mk(6, { nav: 3, gun: 3, sword: 2, ship: 2 });
    const b = { cap: R.captain(sh), hand: R.handleK(sh), gun: R.shipSkill(sh, 'gun'), ship: R.shipSkill(sh, 'ship'), atk: R.shipAtk(sh), name: R.captainName(sh) };
    const w = { dir: 0, spd: 8 }; const sp0 = R.fleetSpeed(0, R.wind(s.loc.lon || -9, s.loc.lat || 38, s.date, 0));
    G.Scenes.city.B.tavern.assign(c, 'cap:' + sh.uid);
    const a = { cap: R.captain(sh) === c, hand: R.handleK(sh), gun: R.shipSkill(sh, 'gun'), ship: R.shipSkill(sh, 'ship'), atk: R.shipAtk(sh), name: R.captainName(sh), role: R.roleName(c) };
    // 기함의 특기에는 섞이지 않는다
    const flagGun = R.skill('gun');
    // 바다 위 수리: 그 배 선장의 조선기술
    sh.hp = sh.maxHp - 10;
    // 선장을 선실에 넣으면 선장을 그만둔다
    const rooms = G.Cabins.rooms(); const k = rooms.findIndex((r, j) => j > 0 && r === 'hold'); G.Cabins.remodel(k, 'gun'); G.Cabins.place(c, k);
    const placed = { role: c.role, cap: !!R.captain(sh) };
    G.Cabins.place(c, null); G.Scenes.city.B.tavern.assign(c, 'cap:' + sh.uid);
    return { b, a, flagGun, placed };
  });
  ok(cap.b.cap === null && cap.b.name === '갑판장' && cap.a.cap && cap.a.role.indexOf('선장') === 0, '선장 임명: ' + cap.b.name + ' → ' + cap.a.name + ' (' + cap.a.role + ')');
  ok(cap.b.hand < 1 && cap.a.hand > 1, '조함: 선장이 없으면 그 배 ×' + cap.b.hand + ', 항해술 3 선장이면 ×' + cap.a.hand.toFixed(3));
  ok(cap.b.gun === 0 && cap.a.gun === 3 && cap.a.ship === 2 && cap.a.atk > cap.b.atk, '그 배의 포술 ' + cap.a.gun + ' · 조선기술 ' + cap.a.ship + ' · 백병전 공격 ' + cap.b.atk + ' → ' + cap.a.atk);
  ok(cap.flagGun === 0, '선장의 포술은 그 배에만 — 기함 포술은 그대로 ' + cap.flagGun);
  ok(cap.placed.role === 'none' && !cap.placed.cap, '선장을 선실에 넣으면 선장을 내려놓는다');

  console.log('— 선실 (방마다 힘 = (1 + 특기 단계) × 충성 효율, 상한 8)');
  const cab = await E(() => {
    const s = G.Game.state, CB = G.Cabins, R = G.R, out = {};
    const rooms = CB.rooms();
    out.slots = rooms.length - 1;
    const want = { chart: ['chart', 'survey'], galley: ['galley', 'cook'], mess: ['mess', 'cook'], chapel: ['chapel', 'theo'], sick: ['sick', 'med'], rec: ['rec', 'music'], rig: ['rig', 'nav'], repair: ['repair', 'ship'], pen: ['pen', 'sci'], gun: ['gun', 'gun'], marine: ['marine', 'sword'], musicroom: ['musicroom', 'music'], staff: ['staff', 'ops'] };
    const wind = R.wind(-20, 30, s.date, 0);
    const spd0 = R.fleetSpeed(0, wind);
    let k = 8;
    Object.keys(want).forEach((type, j) => {
      const [key, skill] = want[type];
      let i = rooms.findIndex((r, q) => q > 0 && r === 'hold'); if (i < 0) { out[type] = 'no room'; return; }
      const before = CB.fx(type, key);
      CB.remodel(i, type);
      const empty = CB.fx(type, key);
      const m = __mk(k++, { [skill]: 3 }); CB.place(m, i);
      out[type] = { before, empty, after: CB.fx(type, key), pow: CB.power(type), skillUse: R.skill(skill) };
    });
    out.spd = [spd0, R.fleetSpeed(0, wind)];
    out.deck = CB.fx('deck', 'deck'); const dk = __mk(k++, { ops: 2 }); CB.place(dk, 0); out.deck2 = CB.fx('deck', 'deck');
    out.chartR = null;
    return out;
  });
  console.log('   고칠 수 있는 선실 ' + cab.slots + '칸');
  Object.keys(cab).filter(k => typeof cab[k] === 'object' && cab[k] && 'after' in cab[k]).forEach(k => { const v = cab[k]; ok(v.before === 0 && v.empty === 0 && v.after > 0 && v.pow === 4, k + ': 빈 방 0 → 특기 3 부하 ' + v.after.toFixed(3) + ' (힘 ' + v.pow + ')'); });
  ok(cab.spd[1] > cab.spd[0], '조범실: 함대 속력 ' + cab.spd[0].toFixed(3) + ' → ' + cab.spd[1].toFixed(3));
  ok(cab.deck === 0 && cab.deck2 > 0, '갑판: 운용 2 부하를 두면 규율 +' + cab.deck2.toFixed(2) + '/일');

  console.log('— 바다의 하루 (같은 난수로 선실 있음/없음 견주기)');
  const day = await E(async () => {
    const s = G.Game.state;
    s.loc = { mode: 'sea', lon: -20, lat: 30, heading: 0 }; G.Game.go('sea', {});
    await new Promise(r => setTimeout(r, 1500));
    const SEA = G.Scenes.sea, f = s.fleet;
    const snap = JSON.parse(JSON.stringify(s));
    function seeded() { let x = 12345; return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; }
    async function run(withCab) {
      const st = JSON.parse(JSON.stringify(snap)); G.Game.state = st;
      if (!withCab) st.mates.forEach(m => { delete m.room; });
      st.fleet.fatigue = 50; st.fleet.discipline = 50; st.fleet.daysOut = 200; st.fleet.scurvy = 5; st.fleet.food = 500; st.fleet.ships[0].hp = st.fleet.ships[0].maxHp - 20; st.fleet.mat = 50;
      const r0 = Math.random; Math.random = seeded();
      try { await SEA.runDay(); } catch (e) { return { err: String(e) }; } finally { Math.random = r0; }
      return { fat: st.fleet.fatigue, dis: st.fleet.discipline, scurvy: st.fleet.scurvy, food: st.fleet.food, hp: st.fleet.ships[0].hp };
    }
    const UI = G.UI, say = UI.say, ask = UI.ask; UI.say = async () => {}; UI.ask = async () => null;
    const no = await run(false), yes = await run(true);
    UI.say = say; UI.ask = ask;
    G.Game.state = JSON.parse(JSON.stringify(snap));
    return { no, yes };
  });
  console.log('   ' + JSON.stringify(day));
  ok(day.yes.fat < day.no.fat, '피로: 선실 없음 ' + day.no.fat.toFixed(2) + ' · 있음 ' + day.yes.fat.toFixed(2) + ' (요리실·식당·조타실·음악실)');
  ok(day.yes.dis > day.no.dis, '규율: ' + day.no.dis.toFixed(2) + ' → ' + day.yes.dis.toFixed(2) + ' (예배실·오락실·갑판·식당)');
  ok(day.yes.scurvy < day.no.scurvy, '괴혈병: ' + day.no.scurvy.toFixed(2) + ' → ' + day.yes.scurvy.toFixed(2) + ' (진료실)');
  ok(day.yes.food > day.no.food, '식량: ' + day.no.food.toFixed(2) + ' → ' + day.yes.food.toFixed(2) + ' (사육실)');
  ok(day.yes.hp > day.no.hp, '기함 수리: 내구 ' + day.no.hp.toFixed(2) + ' → ' + day.yes.hp.toFixed(2) + ' (선박 수리실)');

  const ui = await E(async () => {
    G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 2500));
    document.querySelectorAll('.modal-back').forEach(e => e.remove());
    const p = G.CabinView.open(); await new Promise(r => setTimeout(r, 1500));
    const n = document.querySelectorAll('.win').length, txt = (document.querySelector('.win') || {}).innerText || '';
    document.querySelectorAll('.win .btn').forEach(b => { if (/닫/.test(b.textContent)) b.click(); });
    return { n, has: /회계실/.test(txt) && /부관실/.test(txt) };
  });
  ok(ui.n > 0 && ui.has, '선실 화면이 열리고 부관실·회계실이 보인다');
  ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  const bad = res.filter(r => !r[0]);
  console.log(bad.length ? '\n실패 ' + bad.length + '건' : '\n모두 통과 (' + res.length + '건)');
  await browser.close();
  process.exitCode = bad.length ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
