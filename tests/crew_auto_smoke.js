/* 배마다의 자리와 자동 배치 (2026-10-28) — js/systems/crewauto.js · js/ui/cabinview.js · js/city/tavern.js
   · 다른 배마다 선장 · 조타수 · 갑판 · 파수꾼 + 그 배 크기만큼의 선실. 사람은 능력에 맞게 저절로 앉는다
     (선장 = 항해술·포술·검술이 가장 높은 사람, 조타수 = 항해술·운용술, 파수꾼 = 측량·역사학)
   · 술집에서 정한 기함 역할(부관·항해사·측량사·통역·경리)은 자동 배치가 건드리지 않는다
   · 다른 배 자리에 앉은 사람은 달마다 충성이 떨어지지 않고, 자리가 모자라 대기인 사람만 떨어진다
   · 다른 배의 조타수·갑판·파수꾼·선실은 함대 특기(R.skill)에 더해지지 않는다 (충성만 지킨다)
   · 기함 「자동 배치」: 요리 3인 사람은 요리실, 검술·운용술은 갑판 … 방에 맞는 특기를 가진 사람부터
   · 기함을 바꾸면 새 기함에 있던 다른 배 선원은 다시 앉는다 · 옛 저장(crew 없음)도 그대로 열린다
   · 화면: 선실 창의 「자동 배치」 단추와 「다른 배」 판, 대기 부하는 명단에서 붉은 바탕(.cb-mate.idle) ·
     술집 부하편성에 다른 배 선장 고르기가 없다 · 대기 줄은 mate-idle · 콘솔 오류 0
   node tests/crew_auto_smoke.js */
'use strict';
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || os.tmpdir();
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const E = (f, a) => page.evaluate(f, a);
    await E(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.player.gold = 500000; s.date = { y: 1500, m: 6, d: 1 }; s.flags.prologue = true; s.settings.res = 0.5;
      G.SKILLS.forEach(x => { s.player.sk[x.id] = 0; });
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
      const big = ['galleon', 'carrack', 'nao'].filter(t => G.SHIP[t])[0];
      s.fleet.ships[0] = G.R.newShip(big, '기함');
      s.fleet.ships.push(G.R.newShip('caravel', '둘째')); s.fleet.ships.push(G.R.newShip('caravel', '셋째'));
      s.fleet.crew = 200; s.fleet.food = 500; s.fleet.water = 500;
      s.mates = [];
      const ids = G.MATES.filter(d => d.wage).map(d => d.id).filter(id => id !== 'rocco').slice(0, 40);
      window.__mk = function (k, sk, role) { const m = { id: ids[k], role: role || 'none', loyal: 60, sk: Object.assign({}, sk) }; G.SKILLS.forEach(x => { if (m.sk[x.id] == null) m.sk[x.id] = 0; }); s.mates.push(m); return m; };
      // 기함 선실: 요리실·갑판(0번)·조범실
      const rooms = G.Cabins.rooms(); rooms[1] = 'galley'; if (rooms.length > 2) rooms[2] = 'rig';
      window.__T = {
        first: __mk(0, { sword: 2, med: 2 }, 'first'), nav: __mk(1, { nav: 2 }, 'nav'),
        capA: __mk(2, { nav: 3, gun: 3, sword: 2 }), capB: __mk(3, { nav: 2, gun: 2, sword: 2 }),
        helm: __mk(4, { nav: 1, ops: 1 }), look: __mk(5, { survey: 3, hist: 2 }), cook: __mk(6, { cook: 3 }),
        plain1: __mk(7, {}), plain2: __mk(8, {}), sword: __mk(9, { sword: 1, ops: 1 })
      };
    });

    console.log('— 저절로 채우기 (도시에 들어올 때·출항·달마다)');
    const a = await E(() => {
      const T = __T, CA = G.CrewAuto, R = G.R, s = G.Game.state, sh = s.fleet.ships;
      const navBefore = R.skill('nav'), survBefore = R.skill('survey');
      const moved = CA.refresh();
      const crew = sh.slice(1).map(x => { const o = CA.crewOf(x); return { name: x.name, cap: o.captain && o.captain.id, helm: o.helm && o.helm.id, deck: o.deck && o.deck.id, look: o.lookout && o.lookout.id, cabin: o.cabin.length, berths: CA.berths(x) }; });
      return { moved: moved.length, crew, idle: CA.idleCount(), first: T.first.role, nav: T.nav.role,
        capA: R.roleName(T.capA), capB: R.roleName(T.capB), look: R.roleName(T.look), cook: G.Cabins.placeName(T.cook),
        navAfter: R.skill('nav'), survAfter: R.skill('survey'), navBefore, survBefore,
        caps: sh.slice(1).map(x => R.captainName(x)), notice: CA.notice(moved), ids: { capA: T.capA.id, capB: T.capB.id, look: T.look.id } };
    });
    console.log('   ' + JSON.stringify(a.crew));
    ok(a.idle === 0 && a.moved >= 8, '자리 없던 ' + a.moved + '명이 모두 자리를 얻었다 (대기 0) — ' + a.notice);
    ok(a.first === 'first' && a.nav === 'nav', '술집에서 정한 부관·항해사는 그대로');
    ok(/^선장 · /.test(a.capA) && /^선장 · /.test(a.capB), '두 배의 선장: ' + a.caps.join(' · ') + ' (항해술·포술·검술이 높은 두 사람)');
    ok(a.crew.every(c => c.cap && c.helm), '배마다 선장·조타수 — 사람이 모자라면 배마다 고르게 (조타수 → 갑판 → 파수꾼 차례)');
    ok(/^파수꾼 · /.test(a.look) || /파수대|지도/.test(a.look), '측량 3인 사람: ' + a.look);
    ok(/요리실/.test(a.cook), '요리 3인 사람은 기함의 빈 요리실: ' + a.cook);
    ok(a.navAfter === a.navBefore && a.survAfter === a.survBefore, '다른 배의 조타수·파수꾼은 함대 특기에 더해지지 않는다 (항해술 ' + a.navBefore + '→' + a.navAfter + ' · 측량 ' + a.survBefore + '→' + a.survAfter + ')');

    console.log('— 충성: 다른 배 자리는 떨어지지 않고, 자리가 모자라면 대기만 떨어진다');
    const b = await E(() => {
      const s = G.Game.state, CA = G.CrewAuto, CB = G.Cabins;
      const onShip = s.mates.filter(m => m.role === 'crew')[0], lo0 = onShip.loyal;
      CB.monthly(false);
      const kept = onShip.loyal;
      // 배 한 척만 남기고 기함 선실을 모두 빈 선실로 → 자리가 모자란다
      s.fleet.ships.length = 1; const rooms = CB.rooms(); for (let i = 1; i < rooms.length; i++) rooms[i] = 'hold';
      G.R.tidyCaptains(); CB.tidy(); CA.refresh();
      const idle = s.mates.filter(m => CA.idle(m)); const lo1 = idle.map(m => m.loyal);
      CB.monthly(false);
      return { lo0, kept, n: idle.length, drop: idle.map((m, k) => lo1[k] - m.loyal), deck: !!CB.occupant(0), crewLeft: s.mates.filter(m => m.role === 'crew' || m.role === 'captain').length };
    });
    ok(b.kept === b.lo0, '다른 배 자리의 부하는 한 달 뒤에도 충성 그대로 (' + b.lo0 + ' → ' + b.kept + ')');
    ok(b.crewLeft === 0 && b.deck && b.n > 0 && b.drop.every(d => d === 2), '배를 잃고 빈 선실뿐이면 갑판 1명만 자리 · 대기 ' + b.n + '명은 충성 −2');

    console.log('— 기함 「자동 배치」 · 기함 바꾸기 · 옛 저장');
    const c = await E(() => {
      const s = G.Game.state, CA = G.CrewAuto, CB = G.Cabins, R = G.R, T = __T;
      s.fleet.ships.push(R.newShip('caravel', '둘째')); s.fleet.ships.push(R.newShip('carrack', '넷째'));
      const rooms = CB.rooms(); rooms[1] = 'galley'; rooms[2] = 'rig'; if (rooms.length > 3) rooms[3] = 'chart';
      // 손으로 엉뚱하게: 요리사를 갑판, 칼잡이를 요리실
      T.sword.role = 'none'; delete T.sword.ship; T.cook.role = 'none'; delete T.cook.ship;
      CB.place(T.cook, 0); CB.place(T.sword, 1);
      const moved = CA.autoAll();
      const out = { moved: moved.length, cook: CB.placeName(T.cook), sword: CB.placeName(T.sword), first: T.first.role, idle: CA.idleCount(), galleyPow: CB.power('galley') };
      // 기함 바꾸기: 넷째 배를 기함으로 — 그 배에 있던 사람들은 다시 앉는다
      const four = s.fleet.ships[2], onFour = s.mates.filter(m => m.ship === four.uid).map(m => m.id);
      s.fleet.ships.splice(2, 1); s.fleet.ships.unshift(four); CB.rooms(); R.tidyCaptains(); CA.refresh();
      out.onFour = onFour.length; out.stale = s.mates.filter(m => m.ship === four.uid).length; out.idle2 = CA.idleCount();
      // 옛 저장: crew 없음 · post만 남은 줄 · 없는 배 uid
      const old = s.mates[s.mates.length - 1]; old.role = 'crew'; old.ship = 'nope'; old.post = 'helm';
      R.tidyCaptains(); out.oldFixed = old.role === 'none' && old.ship == null && old.post == null;
      CA.refresh(); out.idle3 = CA.idleCount();
      // 사람이 넉넉하면 배마다 네 자리가 다 찬다
      for (let k = 10; k < 30; k++) __mk(k, {});
      CA.refresh();
      out.full = s.fleet.ships.slice(1).every(x => { const o = CA.crewOf(x); return o.captain && o.helm && o.deck && o.lookout; });
      out.cabins = s.fleet.ships.slice(1).map(x => CA.crewOf(x).cabin.length + '/' + CA.berths(x)).join(' · ');
      out.idle4 = CA.idleCount();
      return out;
    });
    ok(/요리실/.test(c.cook) && !/요리실/.test(c.sword) && c.first === 'first', '자동 배치: 요리 3 → ' + c.cook + ' · 검술 → ' + c.sword + ' · 부관은 그대로 (' + c.moved + '명 이동)');
    ok(c.galleyPow >= 4, '요리실의 힘 ' + c.galleyPow + ' (1 + 요리 3)');
    ok(c.onFour > 0 && c.stale === 0 && c.idle2 === 0, '기함을 바꾸자 새 기함에 있던 ' + c.onFour + '명이 다른 자리로 (대기 0)');
    ok(c.oldFixed && c.idle3 === 0, '없는 배를 가리키는 옛 줄은 대기로 고친 뒤 다시 자리를 얻는다');
    ok(c.full, '부하가 넉넉하면 배마다 선장·조타수·갑판·파수꾼이 다 차고, 남는 사람은 그 배 선실로 (' + c.cabins + ' · 대기 ' + c.idle4 + ')');

    console.log('— 화면');
    await E(() => { const s = G.Game.state; s.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat }; G.Game.go('city', { cityId: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 60000 });
    await page.waitForTimeout(1200);
    for (let i = 0; i < 25 && await E(() => G.UI.busy()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
    // 대기 한 명을 만들고(저절로 채우기를 잠시 멈춘다) 선실 창을 연다
    await E(() => {
      document.querySelectorAll('.modal-back').forEach(e => e.remove());
      const m = G.Game.state.mates.filter(x => x.role === 'crew')[0]; window.__idleName = G.MATE[m.id].name; m.role = 'none'; delete m.ship; delete m.post;
      const CA = G.CrewAuto, r = CA.refresh; CA.refresh = function () { return []; }; window.__restore = () => { CA.refresh = r; };
      window.__cv = G.CabinView.open();
    });
    await page.waitForSelector('.cb-others .cb-oship', { timeout: 15000 });
    await page.waitForTimeout(800);
    const v = await E(() => ({
      auto: !!document.querySelector('.cb-top .cb-auto'), ships: document.querySelectorAll('.cb-others .cb-oship').length,
      seats: [...document.querySelectorAll('.cb-others .cb-oship')][0].textContent.replace(/\s+/g, ' ').trim(),
      idle: [...document.querySelectorAll('.cb-mate.idle')].map(e => e.textContent.replace(/\s+/g, ' ').slice(0, 30)),
      away: document.querySelectorAll('.cb-mate.away').length,
      bg: (() => { const e = document.querySelector('.cb-mate.idle'), n = document.querySelector('.cb-mate:not(.idle):not(.away)'); return e && n ? [getComputedStyle(e).backgroundImage !== 'none', getComputedStyle(e).borderLeftWidth, getComputedStyle(n).borderLeftWidth] : null; })(),
      first: (document.querySelector('.cb-roster .cb-mate') || {}).className }));
    console.log('   ' + JSON.stringify(v));
    await page.screenshot({ path: path.join(OUT, 'crew_auto_cabin.png') });
    const lay = await E(() => { const side = document.querySelector('.cb-side').getBoundingClientRect(), main = document.querySelector('.cb-main').getBoundingClientRect(); document.querySelector('.cb-others').scrollIntoView(); return { sideRight: side.left >= main.right - 2, top: Math.abs(side.top - main.top) < 40 }; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, 'crew_auto_others.png') });
    ok(lay.sideRight && lay.top, '「다른 배」 판이 있어도 명단은 오른쪽에 나란히');
    ok(v.auto && v.ships === 2 && /선장/.test(v.seats) && /조타수/.test(v.seats) && /갑판/.test(v.seats) && /파수꾼/.test(v.seats) && /선실/.test(v.seats), '선실 창: 「자동 배치」 단추 · 다른 배 2척 판 「' + v.seats.slice(0, 90) + '…」');
    const idleName = await E(() => window.__idleName);
    ok(v.idle.length >= 1 && v.idle.some(x => x.indexOf(idleName) >= 0) && /대기/.test(v.idle[0]) && v.bg && v.bg[0] && v.bg[1] !== v.bg[2] && /idle/.test(v.first), '대기 부하 ' + v.idle.length + '명은 명단 맨 위에 붉은 바탕(.idle)·「대기」 표 — ' + v.idle.join(' / '));
    ok(v.away > 0, '다른 배 사람은 푸른 바탕(.away) ' + v.away + '명');
    // 자동 배치 단추
    await E(() => document.querySelector('.cb-auto').click());
    await page.waitForTimeout(400);
    await E(() => { const b = [...document.querySelectorAll('.win .foot button')].filter(x => /자동 배치/.test(x.textContent)).pop(); b.click(); });
    await page.waitForSelector('.cb-mate', { timeout: 10000 });
    await page.waitForTimeout(600);
    const after = await E(() => ({ idle: document.querySelectorAll('.cb-mate.idle').length, n: G.CrewAuto.idleCount() }));
    ok(after.idle === after.n && after.n < v.idle.length, '「자동 배치」를 누르자 대기 ' + v.idle.length + ' → ' + after.n + ' (자리가 모자라 남는 사람만 대기)');
    await E(() => { const w = document.querySelector('.cb-auto').closest('.win'); [...w.querySelectorAll('.foot button')].filter(b => /닫는다/.test(b.textContent))[0].click(); });
    await page.waitForTimeout(400);
    // 술집 부하편성: 대기 줄은 mate-idle, 역할 고르기에 「선장 — ○○호」가 없다
    await E(() => { const m = G.Game.state.mates.filter(x => x.role === 'crew')[0]; window.__idleName = G.MATE[m.id].name; m.role = 'none'; delete m.ship; delete m.post; window.__org = G.Scenes.city.B.tavern.organize(); });
    await page.waitForSelector('.choice', { timeout: 10000 });
    const t = await E(() => ({
      head: [...document.querySelectorAll('.choice')].slice(0, 3).map(e => e.textContent.replace(/\s+/g, ' ').slice(0, 40)),
      idle: [...document.querySelectorAll('.choice.mate-idle')].map(e => e.textContent.replace(/\s+/g, ' ').slice(0, 40)),
      away: document.querySelectorAll('.choice.mate-away').length }));
    console.log('   ' + JSON.stringify(t));
    await page.screenshot({ path: path.join(OUT, 'crew_auto_tavern.png') });
    ok(/자동 배치/.test(t.head.join('|')) && /다른 배의 사람들/.test(t.head.join('|')), '부하편성 맨 위: 「' + t.head.join(' / ') + '」');
    const idleName2 = await E(() => window.__idleName);
    ok(t.idle.length >= 1 && t.idle.some(x => x.indexOf(idleName2) >= 0) && t.away > 0, '대기 줄은 붉은 바탕 「' + t.idle.join(' / ') + '」 · 다른 배 사람 ' + t.away + '명은 푸른 바탕');
    // 부관을 눌러 역할 고르기
    await E(() => { const nm = G.MATE[__T.first.id].name; [...document.querySelectorAll('.choice')].filter(e => e.textContent.indexOf(nm) >= 0)[0].click(); });
    await page.waitForTimeout(500);
    const roles = await E(() => [...document.querySelectorAll('.choice')].map(e => e.textContent.replace(/\s+/g, ' ').trim()));
    ok(!roles.some(x => /^선장 —/.test(x)) && roles.some(x => /역할 없음/.test(x)), '역할 고르기에 다른 배 선장이 없다: ' + roles.join(' / '));
    await E(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); __restore(); });
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
