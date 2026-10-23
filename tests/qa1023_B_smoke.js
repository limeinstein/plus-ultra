/* QA 2026-10-23 B 그룹(항해·해전) 고침 시험 — node tests/qa1023_B_smoke.js
   [6]  사건 간격(G.Pace)이 막아도 이야기의 배(왕녀를 잡아간 해적 등)는 덤빈다 · 보통 해적은 막힌다
   [33b] 기본 설정(지그재그 끔)에서도 맞바람에 사각돛 배가 굼뜨면 부관이 「개조」를 귀띔한다
   [33c] 하단 메뉴 너비(G.Ctrl.fitBar): 글·창 크기가 그대로면 다시 재지 않는다
   [21] 물러나는 목표점은 전장 원 ×0.75 안
   [24a][22] 제노바 해전: 끝나면 제노바로 돌아가고, 이겨도 악명이 오르지 않는다
   [24b] 제노바의 일 도중 끊겨 'genoa'에 머물면 기한 뒤 매듭짓는다
   [24c] 카를 5세의 부름: 왕녀 이야기가 먼저 끝나도 건너뛰지 않는다
   [33a] 일기토가 끝나면 시작할 때의 곡으로 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '))); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea && G.Scenes.city && G.Scenes.city.B.palace && G.Barb, null, { timeout: 90000 });
  const out = await page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'ES', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0;
    const s = G.Game.state, RR = G.R, UI = G.UI;
    s.fleet.food = 400; s.fleet.water = 400; s.fleet.scurvy = 0;
    const SEA = G.Scenes.sea;
    const closeAll = async () => { for (let i = 0; i < 10 && document.querySelector('.modal-back'); i++) { const mb = [...document.querySelectorAll('.modal-back')].pop(); const bt = [...mb.querySelectorAll('button')].pop(); if (bt) bt.click(); else mb.remove(); await sleep(30); } };

    // ---- [6] 사건 간격이 막아도 이야기의 배는 덤빈다
    G.Game.go('sea', { depart: 83 }); let st = SEA.runtime(); await sleep(300); await closeAll();
    for (let i = 0; i < 40 && (UI.busy() || st.busy); i++) { await closeAll(); await sleep(50); }
    st.npcs = []; st.paused = true;
    const busy0 = UI.busy() || st.busy > 0;
    const pace0 = G.Pace.ok; G.Pace.ok = () => false;
    const ask0 = UI.ask; UI.ask = async () => null;   // 마주침 물음에는 답하지 않는다 (해전으로 넘어가 뒤 시험을 흔들지 않게)
    let prMet = 0; const pet0 = G.Princess.encounterText; G.Princess.encounterText = function (n) { prMet++; return pet0.apply(this, arguments); };
    const at = () => ({ lon: s.loc.lon + 0.05, lat: s.loc.lat, heading: 0, spd: 0, life: 30, hostile: true, n: 1, K: 0.3, zone: G.Ships.zone(s.loc.lon, s.loc.lat) });
    const plain = Object.assign(at(), { id: 'plainP', kind: 'pirate', ships: ['caravel'] });
    st.npcs.push(plain);
    for (let i = 0; i < 30; i++) { SEA.update(0.05); await sleep(10); }
    const blocked = !UI.busy() && plain.cooldown > 0;
    const dbg = { frame: st.frame, alive: st.alive, busy: st.busy, paused: st.paused, pend: st.pendingPort, scene: G.Game.sceneName, same: st === SEA.runtime(), npcs: st.npcs.length, d: G.Geo.dist(s.loc.lon, s.loc.lat, plain.lon, plain.lat).toFixed(3) };
    st.npcs = []; plain.cooldown = 0;
    const story = Object.assign(at(), { id: 'storyP', kind: 'pirate', princess: 'levant', ships: ['caravel'] });
    st.npcs.push(story);
    let met = false;
    for (let i = 0; i < 30 && !met; i++) { SEA.update(0.05); await sleep(20); met = prMet > 0; }
    G.Pace.ok = pace0; G.Princess.encounterText = pet0;
    for (let i = 0; i < 40 && st.busy; i++) await sleep(25); UI.ask = ask0;
    ok(!busy0 && blocked, '사건 간격이 막으면 보통 해적은 덤비지 않는다 (cooldown ' + plain.cooldown + ' · 처음 창 ' + busy0 + ' ' + JSON.stringify(dbg) + ')');
    ok(met, '이야기의 배(왕녀를 잡아간 해적)는 사건 간격에 막히지 않고 덤빈다');
    await closeAll(); await sleep(200); await closeAll();
    for (let i = 0; i < 40 && (UI.busy() || st.busy); i++) { await closeAll(); await sleep(50); }

    // ---- [33b] 기본(지그재그 끔)에서도 맞바람 안내
    G.Game.go('sea', { depart: 83 }); st = SEA.runtime(); await sleep(300); await closeAll();
    st.npcs = []; G.Pace.ok = () => false;
    s.loc.lon = -35; s.loc.lat = 30;
    const sh = RR.newShip('frigate', '산타 루치아'); s.fleet.ships = [sh]; s.fleet.crew = G.SHIP.frigate.crew[1]; s.mates = []; s.flags.upTipDay = null;
    const tm = G.Ctrl.tackMode();
    SEA.takeCourse(0); st.speed = 4;
    const toasts = []; const toast0 = UI.toast; UI.toast = (t, i, d) => { toasts.push(t); };
    for (let i = 0; i < 600 && s.flags.upTipDay == null; i++) { st.wind = { dir: Math.PI, spd: 0.62 }; st.calm = 0; st.npcs = []; SEA.update(0.1); if (UI.busy()) await closeAll(); if (i % 20 === 0) await sleep(0); }
    UI.toast = toast0; G.Pace.ok = pace0;
    ok(tm === 'off' && s.flags.upTipDay != null && toasts.some(t => /개조/.test(t) && /사각돛/.test(t)), '지그재그 「끔」(' + tm + ')에서도 맞바람에 굼뜨면 「개조」 귀띔 (upwind ' + st.upwind + ')');

    // ---- [33c] fitBar: 그대로면 다시 재지 않는다
    const bar = document.createElement('div'); bar.style.cssText = 'position:absolute;left:50%;bottom:0;white-space:nowrap';
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:60px'; document.body.appendChild(host); host.appendChild(bar);
    const btn = document.createElement('button'); btn.textContent = '마우스 따라가기'; bar.appendChild(btn);
    let reads = 0; const ow = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    Object.defineProperty(bar, 'offsetWidth', { get() { reads++; return ow.get.call(this); } });
    G.Ctrl.fitBar(bar); G.Ctrl.fitBar(bar); G.Ctrl.fitBar(bar);
    const r1 = reads; btn.textContent = '마우스 따라가기 켬'; G.Ctrl.fitBar(bar); const r2 = reads;
    btn.style.display = 'none'; G.Ctrl.fitBar(bar); const r3 = reads;
    host.remove();
    ok(r1 === 1 && r2 === 2 && r3 === 3, '하단 메뉴: 같은 글·같은 창이면 너비를 다시 재지 않고, 글·보임이 바뀌면 다시 잰다 (' + [r1, r2, r3].join('→') + ')');

    // ---- [21] 물러나는 목표점은 전장 원 ×0.75 안
    const T = G.Scenes.battle._t();
    const p1 = T.inArena([T.arena * 2, 0]), p2 = T.inArena([100, 50]);
    ok(Math.abs(Math.hypot(p1[0], p1[1]) - T.arena * 0.75) < 1e-6 && p2[0] === 100 && p2[1] === 50, '전장 밖 목표점은 원 ×0.75로 잘리고, 안쪽은 그대로');

    // ---- [24c] 카를 5세의 부름: 왕녀 이야기(onEnter true)가 있어도 건너뛰지 않는다
    UI.say = async () => {}; UI.ask = async (q, o) => o[0].value; UI.alert = async () => {};
    if (G.Hist) G.Hist.play = async () => {};
    const C = G.Scenes.city, SP = G.Sponsor;
    s.date = { y: 1543, m: 5, d: 1 }; s.barb = { ok: 1 };
    const sp = G.SPONSOR.es_crown;
    const due = G.Barb.callDue(sp);
    const pr0 = G.Princess && G.Princess.onEnter, aud0 = SP.audience, jl0 = SP.jealousy, say0 = C.say;
    let prCalled = 0;
    if (G.Princess) G.Princess.onEnter = async () => { prCalled++; return true; };
    SP.audience = async () => true; SP.jealousy = async () => true; C.say = async () => {};
    await C.B.palace.enter(G.CITY_DATA[sp.city], sp.id);
    ok(due && s.barb.stage === 'call' && prCalled === 0, '카를 5세의 부름을 왕녀 이야기보다 먼저 꺼낸다 (부름 ' + due + ' · 단계 ' + s.barb.stage + ')');
    if (G.Princess) G.Princess.onEnter = pr0; SP.audience = aud0; SP.jealousy = jl0; C.say = say0;

    // ---- [24b] 'genoa'에 머물면 기한 뒤 매듭
    s.barb = { ok: 1, stage: 'genoa', met: 1, genoa: 'fight' }; s.date = { y: 1544, m: 8, d: 2 };
    const dl = G.Barb.daily();
    s.date = { y: 1544, m: 9, d: 20 }; const dl2 = G.Barb.daily();
    ok(s.barb.stage === 'done' && dl.length >= 1 && dl2.some(m => /크레피 화약/.test(m.text)), '해전 도중 끊겨 genoa에 머물던 것: 기한 뒤 done으로 매듭 · 크레피 화약 소식도 온다');

    // ---- [24a][22] 제노바 해전 → 제노바로 · 악명 그대로
    s.barb = { ok: 1, stage: 'call', toulon: 1 }; s.date = { y: 1544, m: 5, d: 1 };
    s.fleet.ships = [RR.newShip('galleon', '산 펠리페')]; s.fleet.crew = 150; s.player.notoriety = 10;
    s.loc = { mode: 'city', city: 28, lon: G.CITY_DATA[28].lon, lat: G.CITY_DATA[28].lat };
    UI.ask = async (q, o) => { const f = o.find(x => x.value === 'fight'); return f ? f.value : o[0].value; };
    G.Barb.check();
    for (let i = 0; i < 400 && !(G.Game.sceneName === 'battle' && G.Scenes.battle.debug() && G.Scenes.battle.debug().npc && G.Scenes.battle.debug().npc.great); i++) await sleep(50);
    const bst = G.Scenes.battle.debug && G.Scenes.battle.debug();
    const npc = bst && bst.npc;
    ok(npc && npc.great === 'barb_genoa' && npc.backCity === 28, '제노바 해전: 큰 해전이고 끝나면 돌아갈 도시는 제노바(28) — ' + (npc && npc.great) + ' · ' + (npc && npc.backCity));
    if (bst) {
      bst.ships.filter(x => x.side === 'en').forEach(x => { x.alive = false; x.sunk = 1; }); bst.over = true; G.Scenes.battle._t().finish('win');
      for (let i = 0; i < 300 && G.Game.sceneName !== 'city'; i++) await sleep(50);
    }
    ok(G.Game.sceneName === 'city' && s.loc.city === 28, '제노바 해전이 끝나면 바다가 아니라 제노바로 (' + G.Game.sceneName + ' ' + s.loc.city + ')');
    ok(s.player.notoriety === 10, '큰 해전에서 이겨도 악명이 오르지 않는다 (악명 ' + s.player.notoriety + ')');
    ok(s.barb.stage === 'done' && s.barb.genoa === 'won', '제노바 해전 승리가 적힌다');

    // ---- [33a] 일기토가 끝나면 시작할 때의 곡으로
    if (G.Audio && G.Games && G.Games.duel) {
      G.Audio.music('land'); const w0 = G.Audio.want;
      await Promise.race([G.Games.duel({ name: '해적 두목', look: 'pirate', str: 30, mar: 20, skill: 0, atk: 2, def: 0 }, { fastEnd: true, stance: 'allout' }), sleep(40000)]).catch(() => null);
      ok(w0 === 'land' && G.Audio.want === 'land', '일기토가 끝나면 시작할 때의 곡(뭍)으로 돌아간다 (' + G.Audio.want + ')');
    }
    return R;
  });
  console.log(out.join('\n')); console.log(errs.slice(0, 5).join('\n') || '✓ 콘솔 오류 없음'); await b.close();
  process.exitCode = out.some(x => x[0] === '✗') || errs.length ? 1 : 0;
})();
