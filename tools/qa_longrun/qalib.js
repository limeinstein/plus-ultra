/* 1700년 장기 QA — 페이지 안 도구 (window.QA). tools/qa_longrun/run.js 가 페이지에 넣는다.
   · 그림 큰 루프(main.js loop)는 막고 장면 update를 직접 돌린다 · 바다 WebGL 그리기는 끈다(머리 없는 소프트웨어 GPU에서 몇 초씩 멈춤)
   · 일기토·육상전·퍼즐은 결과만 (이긴 것 / 포기) — 항해·탐험·세월·대 잇기·끝을 보는 시험이다. 사람 손 대신 창을 넘기고, 항해·탐험·세월을 실제 장면 코드로 돌린다. */
(function () {
  'use strict';
  // 같은 판을 다시 돌릴 수 있게 난수를 고정
  var seed = +(window.__QA_SEED || 20261031);
  Math.random = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // 큰 그림 루프(main.js loop)는 막고(장면은 시험이 직접 돌린다), 창·연출의 작은 움직임은 setTimeout으로 돌린다
  var rafN = 0;
  window.requestAnimationFrame = function (cb) {
    if (cb && cb.name === 'loop') return ++rafN;
    var id = ++rafN; setTimeout(function () { try { cb(performance.now()); } catch (e) { console.error(e); } }, 16); return id;
  };
  window.cancelAnimationFrame = function () {};
  window.createImageBitmap = undefined;
  document.addEventListener('DOMContentLoaded', function () {
    var st = document.createElement('style');
    st.textContent = '*{animation-duration:0s!important;transition:none!important} canvas{display:none!important}';
    document.head.appendChild(st);
  });

  // 화면에 내보내지 않는 머리 없는 소프트웨어 GPU에서는 WebGL 그리기가 명령이 쌓여 몇 초씩 멈춘다 — 시험에서는 바다 셰이더를 그리지 않는다
  document.addEventListener('DOMContentLoaded', function () {
    var t = setInterval(function () { if (window.G && G.WorldRenderer && G.WorldRenderer.prototype.draw) { G.WorldRenderer.prototype.draw = function () {}; clearInterval(t); } }, 50);
  });
  var Q = window.QA = { prompts: {}, stuckUI: [], fights: { duel: 0, land: 0, sea: 0 }, want: null, picks: {}, notes: [] };
  var sleep = Q.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function S() { return G.Game.state; }
  Q.S = S;

  // ---------------------------------------------------------------- 창 넘기기
  var PRI = [
    /입항한다|항구에 들어간다|들어간다$|입성한다/,
    /도망|통행료|피해 간다|그냥 보낸다|모른 척|물러선다/,
    /모두 물려준다|그대로 한다|타이틀로|고맙|확인|알겠|닫는다|닫기|넘긴다|계속|좋다|접는다|받는다|받아들|출발|다음|결정|기다린다|살펴본다/
  ];
  var SAFE = /그만|나중|사양|거절|아니|두고 본다|생각해|지나간다|취소/;
  var NEVER = /처음부터|무르기|다시 고른다/;   // 퍼즐을 맴돌게 하는 단추 — 고르지 않는다 (남은 것이 「포기한다」뿐이면 그것)
  var BAD = /포기|내려놓|은퇴한다|해고|버린다|내쫓|떠나보낸|잠입/;
  function topModal() { var root = document.querySelector('#ui') || document.body; var m = root.querySelectorAll('.modal-back'); return m.length ? m[m.length - 1] : null; }
  function label(b) { return (b.textContent || '').replace(/\s+/g, ' ').trim(); }
  function choose(btns) {
    if (!btns.length) return null;
    var ok = btns.filter(function (b) { return !b.disabled && !b.classList.contains('dis') && !NEVER.test(label(b)); });
    if (!ok.length) return null;
    if (Q.want) { var w = ok.filter(function (b) { return Q.want.test(label(b)); })[0]; if (w) return w; }
    for (var i = 0; i < PRI.length; i++) { var p = ok.filter(function (b) { return PRI[i].test(label(b)) && !BAD.test(label(b)); })[0]; if (p) return p; }
    var safe = ok.filter(function (b) { return SAFE.test(label(b)); })[0]; if (safe) return safe;
    var good = ok.filter(function (b) { return !BAD.test(label(b)); });
    return (good.length ? good : ok)[0];
  }
  Q.uiBusy = function () { return G.UI.busy(); };
  /** 떠 있는 창을 모두 넘긴다. 돌려주는 값: 넘긴 수 */
  Q.clear = async function (max) {
    max = max || 80;
    var n = 0, last = '', same = 0, idle = 0;
    while (n < max) {
      var m = topModal();
      if (!m) {
        if (!G.UI.busy()) return n;
        await sleep(20);
        if (++idle > 50) {
          // 창 층에 .modal-back이 아닌 것이 남아 바쁨이 풀리지 않는다 — 무엇인지 적고 걷어 낸다
          var lay = G.UI._modalRoot ? G.UI._modalRoot() : null;
          var kids = [].slice.call(document.querySelectorAll('#ui > .layer')).map(function (x) { return x.children.length ? [].slice.call(x.children).map(function (c) { return c.className + ':' + (c.innerText || '').replace(/\s+/g, ' ').slice(0, 60); }).join(' / ') : ''; }).filter(Boolean);
          Q.stuckUI.push({ d: S() && U2(S().date), t: 'busy-without-modal: ' + kids.join(' || ').slice(0, 300) });
          return n;
        }
        continue;
      }
      idle = 0;
      var txt = (m.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 110);
      if (txt === last) { if (++same > 30) { Q.stuckUI.push({ d: S() && U2(S().date), t: txt }); m.remove(); same = 0; continue; } } else { same = 0; last = txt; var key = txt.slice(0, 46); Q.prompts[key] = (Q.prompts[key] || 0) + 1; }
      // 세월이 흐르는 창(섭정)처럼 단추 없는 진행 창은 기다린다
      if (m.querySelector('.regency') && !m.querySelector('button')) { await sleep(60); continue; }
      var asks = [].slice.call(m.querySelectorAll('.askrow button, .askrow .btn'));
      var foot = [].slice.call(m.querySelectorAll('.foot button, .foot .btn'));
      var choices = [].slice.call(m.querySelectorAll('.choices .choice'));
      var b = choose(asks) || choose(foot);
      if (!b && choices.length) b = choices.filter(function (c) { return !c.classList.contains('dis'); })[0] || null;
      if (!b) { var dlg = m.querySelector('.dlg'); if (dlg) b = dlg; }
      if (!b) { var other = [].slice.call(m.querySelectorAll('button, .btn')); b = choose(other); }
      if (!b) { var x = m.querySelector('.title .x'); if (x) b = x; }
      if (b) { var lb = label(b).slice(0, 30); if (b.tagName === 'BUTTON' || b.classList.contains('choice')) Q.picks[lb] = (Q.picks[lb] || 0) + 1; b.click(); }
      else { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true })); }
      n++;
      await sleep(same > 3 ? 120 : 25);
    }
    return n;
  };
  function U2(d) { return d.y + '.' + d.m + '.' + d.d; }
  Q.date = function () { return U2(S().date); };

  // ---------------------------------------------------------------- 그림 루프가 하던 곁일
  Q.aux = function () {
    var s = S(); if (!s) return;
    try { if (G.Life) G.Life.tick(); } catch (e) { console.error(e); }
    try { if (G.MateLeave) G.MateLeave.tick(); } catch (e) { console.error(e); }
    try { if (G.FirstLove) G.FirstLove.tick(); } catch (e) { console.error(e); }
    try { if (G.Coven) G.Coven.tick(); } catch (e) { console.error(e); }
  };
  /** 곁일과 창을 함께 넘기며 조용해질 때까지 */
  Q.settle = async function (ms) {
    var t0 = Date.now();
    for (;;) {
      Q.aux(); await Q.clear(40); await sleep(30); Q.aux(); await sleep(30);
      if (!G.UI.busy() && !(G.Life && G.Life.running) && !(G.Life && G.Life.dying)) { await sleep(60); if (!G.UI.busy()) return true; }
      if (Date.now() - t0 > (ms || 120000)) { Q.notes.push(Q.date() + ' settle 시간 초과: ' + ((topModal() || {}).innerText || '').slice(0, 80)); return false; }
    }
  };

  // ---------------------------------------------------------------- 싸움: 미니 게임은 바로 이긴 것으로 (이 시험은 항해·탐험·세월이 목적)
  Q.stubGames = function () {
    G.Games.duel = function (enemy, opt) { Q.fights.duel++; G.Games.lastDuel = { how: 'ko', stance: null, mate: (opt || {}).mate || null, swapped: null, secret: false }; return new Promise(function (r) { setTimeout(function () { r('win'); }, 0); }); };
    // 유적의 장치(퍼즐)는 「포기한다」와 같게 (사람이 푸는 놀이 — 이 시험은 길과 세월을 본다)
    if (G.Games.puzzle) G.Games.puzzle = function () { Q.fights.puzzle = (Q.fights.puzzle || 0) + 1; return Promise.resolve(false); };
    G.Games.landWar = function (opt) { Q.fights.land++; var p = (opt && opt.party) || 10; return new Promise(function (r) { setTimeout(function () { r({ res: 'win', left: Math.max(1, Math.round(p * 0.95)), leaderDown: false }); }, 0); }); };
  };
  Q.fightBattle = async function () {
    var B = G.Scenes.battle; Q.fights.sea++;
    var t0 = Date.now();
    while (G.Game.sceneName === 'battle' && Date.now() - t0 < 120000) {
      var rt = B.runtime && B.runtime();
      if (rt && rt.ships) rt.ships.forEach(function (b) { if (b.side === 'en' && b.alive !== false) { b.alive = false; b.sunk = true; b.hp = 0; } });
      if (G.UI.busy()) await Q.clear(20); else { try { B.update(1 / 6); } catch (e) { console.error(e); } }
      Q.aux(); await sleep(15);
    }
    if (G.Game.sceneName === 'battle') { Q.notes.push(Q.date() + ' 해전이 끝나지 않음'); return false; }
    return true;
  };

  // ---------------------------------------------------------------- 출항 준비 (사람이 항구에서 하는 일을 대신)
  Q.prep = function (days) {
    var s = S(), f = s.fleet, R = G.R, out = {};
    if (!f.ships.length) { s.fleet = f = R.restartFleet(); out.restart = 1; }
    var cm = R.crewMin(); if (f.crew < cm) { out.hired = cm - f.crew; f.crew = cm; }
    var use = R.dailyUse(), want = Math.ceil(use * days);
    var cap = R.fleetCap(), cargo = R.cargoQty ? R.cargoQty() : 0, room = Math.max(0, cap - cargo - (f.mat || 0));
    var each = Math.min(want, Math.floor(room / 2));
    out.short = each < want ? Math.floor(each / use) : 0;
    f.food = Math.max(f.food, each); f.water = Math.max(f.water, each);
    f.fatigue = Math.min(f.fatigue || 0, 20);
    if (s.player.gold < 3000) { out.topup = 20000 - s.player.gold; s.player.gold = 20000; }
    // 배 고치기 (조선소)
    f.ships.forEach(function (sh) { var mx = sh.maxHp || (G.SHIP[sh.type] || {}).hp; if (mx && sh.hp != null && sh.hp < mx) { sh.hp = mx; out.repaired = (out.repaired || 0) + 1; } });
    return out;
  };

  // ---------------------------------------------------------------- 항해
  Q.voyage = async function (destId, opt) {
    opt = opt || {};
    var s = S(), SEA = G.Scenes.sea, c = G.CITY_DATA[destId], from = s.loc.city;
    var r = { from: G.CITY_DATA[from].name, to: c.name, y: s.date.y };
    if (s.known.indexOf(destId) < 0) s.known.push(destId);
    var d0 = s.day, pos0 = [s.loc.lon, s.loc.lat], pre = G.State.serialize(), log0 = (s.log || []).length, trace = [], lastD = s.day;
    G.Game.go('sea', { depart: from }); await Q.settle(30000);
    if (G.Game.sceneName !== 'sea') { r.res = 'no-sea:' + G.Game.sceneName; return r; }
    var st = SEA.runtime(); st.speed = 4;
    SEA.goCity(destId); st = SEA.runtime();
    r.mode = st.pilot ? 'pilot' : st.direct ? 'direct' : st.autoOn ? 'auto' : (st.path ? 'path' : 'none');
    try { r.eta = Math.round(SEA.etaDays()); } catch (e) { r.eta = null; }
    var ticks = 0, lastMv = 0, lp = [s.loc.lon, s.loc.lat], retarget = 0, tw = 0, maxDays = opt.maxDays || Math.max(120, (r.eta || 60) * 3), npcMax = 0, tMs = 0, tN = 0;
    var food0 = s.fleet.food, crew0 = s.fleet.crew, dist = 0, rt0 = performance.now(), busyIdle = 0, stBusy = 0;
    function diag() { var st2 = SEA.runtime() || {}; return { day: Q.date(), busy: st2.busy, paused: st2.paused, path: !!st2.path, auto: st2.autoOn, uiBusy: G.UI.busy(), modal: ((topModal() || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 160), layers: [].slice.call(document.querySelectorAll('#ui > .layer')).map(function (x) { return x.children.length; }).join(','), pos: [+s.loc.lon.toFixed(2), +s.loc.lat.toFixed(2)], pend: !!st2.pendingPort }; }
    for (;;) {
      var sc = G.Game.sceneName;
      if (sc === 'city') { r.res = s.loc.city === destId ? 'arrived' : 'arrived-other:' + (G.CITY_DATA[s.loc.city] || {}).name; break; }
      if (sc === 'battle') { await Q.fightBattle(); if (G.Game.sceneName === 'battle') { r.res = 'battle-stuck'; break; } if (G.Game.sceneName === 'sea') { G.Game.go('sea', { resume: true }); } continue; }
      if (sc === 'land') { r.res = 'landed?'; break; }
      if (sc === 'title') { r.res = 'title(게임 끝)'; break; }
      if (sc !== 'sea') { r.res = 'scene:' + sc; break; }
      st = SEA.runtime();
      if (performance.now() - rt0 > (opt.realMs || 240000)) { r.res = 'real-timeout'; r.diag = diag(); break; }
      if (G.UI.busy()) { var bz = await Q.clear(30); Q.aux(); if (!bz) { if (++busyIdle > 40) { r.res = 'ui-stall'; r.diag = diag(); break; } } else busyIdle = 0; continue; }
      busyIdle = 0;
      if (st && st.busy) { if (++stBusy > 4000) { r.res = 'scene-busy-stall'; r.diag = diag(); break; } } else stBusy = 0;
      var t1 = performance.now();
      try { SEA.update(0.1); } catch (e) { console.error(e); }
      var dtk = performance.now() - t1; tMs += dtk; tN++; Q.tickMs = (Q.tickMs || dtk) * 0.8 + dtk * 0.2; Q.tickAt = Date.now();
      npcMax = Math.max(npcMax, (st.npcs || []).length);
      Q.aux();
      if (st.busy && !G.UI.busy()) { for (var w = 0; w < 40 && st.busy && !G.UI.busy(); w++) await sleep(5); }
      ticks++;
      if (s.day !== lastD) { lastD = s.day; var ff = s.fleet; trace.push([s.day - d0, +s.loc.lon.toFixed(2), +s.loc.lat.toFixed(2), ff.crew, Math.round(ff.food), Math.round(ff.water), Math.round(ff.scurvy || 0), Math.round(ff.sick || 0), Math.round(ff.fatigue || 0), Math.round(ff.discipline || 0), ff.ships.map(function (x) { return Math.round(x.hp); }).join('/'), st.paused ? 'P' : '', st.path ? '' : 'nopath', st.calm || '', st.storm || '']); }
      var mv = G.Geo.dist(lp[0], lp[1], s.loc.lon, s.loc.lat);
      if (mv > 0.02) { dist += mv; lp = [s.loc.lon, s.loc.lat]; lastMv = ticks; }
      // 길을 잃고 멈췄으면(뭍에 막힘 등) 사람이 하듯 다시 목적지를 누른다
      if (ticks - lastMv > 120 && !G.UI.busy()) {
        if (SEA.portNear && SEA.portNear() && SEA.portNear().id === destId) { try { SEA.enterPort(); } catch (e) { console.error(e); } await Q.settle(20000); lastMv = ticks; continue; }
        retarget++; if (st.paused && SEA.resume) SEA.resume();
        SEA.goCity(destId); lastMv = ticks;
        if (retarget > 6) { r.res = 'stuck'; r.at = [+s.loc.lon.toFixed(2), +s.loc.lat.toFixed(2)]; break; }
      }
      if (s.day - d0 > maxDays) { r.res = 'timeout'; r.at = [+s.loc.lon.toFixed(2), +s.loc.lat.toFixed(2)]; break; }
      if (ticks % 25 === 0) await sleep(0);
    }
    r.days = s.day - d0; r.retarget = retarget; r.ticks = ticks; r.npcMax = npcMax; r.msTick = tN ? +(tMs / tN).toFixed(2) : 0;
    r.distDeg = +dist.toFixed(1); r.foodUsed = Math.round(food0 - s.fleet.food); r.crewLost = crew0 - s.fleet.crew;
    if (r.res !== 'arrived' || r.crewLost >= Math.max(3, crew0 / 3) || (r.eta && r.days > r.eta * 2 + 8)) {
      r.anomaly = { trace: trace, log: ((G.Game.state || s).log || []).slice(log0).map(function (x) { return (x.d ? x.d + ' ' : '') + (x.t || x.text || JSON.stringify(x)).slice(0, 160); }).slice(-60), pre: pre };
    }
    if (r.res !== 'arrived' && G.Game.sceneName !== 'title') {
      // 다음 순서를 이어 가려고 도착지로 옮겨 둔다 (결과에는 실패로 남는다)
      await Q.settle(20000);
      s.loc = { mode: 'city', city: destId, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: destId }); await Q.settle(30000);
    } else await Q.settle(30000);
    return r;
  };

  // ---------------------------------------------------------------- 육상 탐험
  function landRun(lon, lat, ang) {
    var n = 0, dx = Math.cos(ang), dy = Math.sin(ang);
    for (var k = 1; k <= 30; k++) { if (G.Geo.isLand(lon + dx * k * 0.1, lat + dy * k * 0.1)) n++; else break; }
    return n;
  }
  Q.explore = async function (cityId, days) {
    var s = S(), L = G.Scenes.land, c = G.CITY_DATA[cityId];
    var r = { city: c.name, y: s.date.y };
    G.Game.go('land', { from: cityId }); await Q.settle(20000);
    if (G.Game.sceneName !== 'land') { r.res = 'no-land:' + G.Game.sceneName; return r; }
    var st = L.runtime(); L.setSpeed(4);
    var l = s.loc, party0 = l.party, food0 = s.fleet.food, found0 = s.stats.found, d0 = l.days;
    var best = 0, bestA = 0; for (var a = 0; a < 16; a++) { var ang = a / 16 * Math.PI * 2, n = landRun(l.lon, l.lat, ang); if (n > best) { best = n; bestA = ang; } }
    r.reach = best;
    var rt0 = performance.now(), walked = 0, lp = [l.lon, l.lat], ticks = 0, blocked = 0, turned = 0, entered = null, still = 0;
    function setDir(ang) { st = L.runtime(); st.dir = [Math.cos(ang), Math.sin(ang)]; st.path = null; st.paused = false; }
    setDir(bestA);
    var phase = 'out', retT = 0;
    for (;;) {
      var sc = G.Game.sceneName;
      if (sc === 'city') { if (phase === 'out') entered = (G.CITY_DATA[s.loc.city] || {}).name; break; }
      if (sc !== 'land') { r.scene = sc; break; }
      st = L.runtime();
      if (performance.now() - rt0 > 400000) { r.res = 'real-timeout'; r.diag = { day: Q.date(), busy: st.busy, paused: st.paused, dir: st.dir, path: st.path, ui: G.UI.busy(), modal: ((topModal() || {}).innerText || '').slice(0, 160) }; break; }
      if (G.UI.busy()) { await Q.clear(30); Q.aux(); continue; }
      try { L.update(0.1); } catch (e) { console.error(e); }
      Q.aux();
      if (st.busy && !G.UI.busy()) { for (var w = 0; w < 40 && st.busy && !G.UI.busy(); w++) await sleep(5); }
      ticks++;
      l = s.loc; if (l.mode !== 'land') continue;
      var mv = G.Geo.dist(lp[0], lp[1], l.lon, l.lat); if (mv > 0.01) { walked += mv; lp = [l.lon, l.lat]; still = 0; } else still++;
      if (phase === 'out') {
        if (st.paused && !st.dir && !st.path) { blocked++; var nb = 0, na = 0; for (var a2 = 0; a2 < 16; a2++) { var an = a2 / 16 * Math.PI * 2, n2 = landRun(l.lon, l.lat, an); if (n2 > nb) { nb = n2; na = an; } } if (nb < 2 || blocked > 12) { phase = 'back'; } else { setDir(na); turned++; } }
        if ((l.days - d0) >= days) phase = 'back';
        if (phase === 'back') { r.outDays = l.days - d0; r.outWalk = +walked.toFixed(2); var b = l.base; st.dir = null; st.path = [b.lon, b.lat]; st.paused = false; st.goalRef = null; retT = ticks; }
      } else {
        var b2 = l.base, near = G.Geo.dist(l.lon, l.lat, b2.lon, b2.lat) < 0.28;
        if (near || (st.paused && !st.path)) {
          // 「도시로 돌아간다」 단추
          var btn = [].slice.call(document.querySelectorAll('button, .btn')).filter(function (x) { return /도시로 돌아간다|배에 오른다|출발지로 돌아간다/.test(label(x)); })[0];
          if (btn) { btn.click(); await sleep(50); await Q.clear(20); if (G.Game.sceneName === 'land' && !near) { st = L.runtime(); st.path = [b2.lon, b2.lat]; st.paused = false; } }
          if (G.Game.sceneName === 'land' && near) { await sleep(30); }
        }
        if (ticks - retT > 6000) { r.res = 'no-return'; r.at = [+l.lon.toFixed(2), +l.lat.toFixed(2)]; break; }
      }
      if (still > 3000) { r.res = 'frozen'; break; }
      if (ticks % 25 === 0) await sleep(0);
    }
    await Q.settle(30000);
    r.res = r.res || (entered ? 'entered:' + entered : G.Game.sceneName === 'city' ? 'returned' : 'scene:' + G.Game.sceneName);
    r.days = (s.loc.mode === 'land' ? s.loc.days : null);
    r.walkDeg = +walked.toFixed(2); r.blocked = blocked; r.turned = turned; r.party = party0 + '→' + (s.fleet.crew);
    r.found = s.stats.found - found0; r.ticks = ticks;
    if (G.Game.sceneName !== 'city') {
      await Q.settle(20000);
      s.loc = { mode: 'city', city: cityId, lon: c.lon, lat: c.lat }; delete s.landReturn; G.Game.go('city', { cityId: cityId }); await Q.settle(30000);
    }
    return r;
  };

  // ---------------------------------------------------------------- 세월 (항구에 머물며)
  Q.pass = async function (days) {
    var s = S(), t0 = performance.now(), n = 0, gen0 = s.player.generation || 1, name0 = s.player.name, ends = [];
    while (n < days) {
      if (G.Game.sceneName === 'title') { ends.push('title'); break; }
      var k = Math.min(30, days - n);
      var before = s.day;
      try { G.Game.passDays(k); } catch (e) { console.error(e); }
      var did = s.day - before; n += did;
      await Q.settle(180000);
      s = S();
      if (!s) break;
      if (did === 0) {   // 수명이 다한 날에서 멈췄다 — 그림 루프가 하듯 Life.tick이 돌 때까지
        for (var i = 0; i < 200 && s.life && s.life.end; i++) { Q.aux(); await Q.clear(40); await sleep(30); }
        await Q.settle(240000); s = S();
        if (s && s.life && s.life.end) { Q.notes.push(Q.date() + ' 수명이 다했는데 넘어가지 않음 (scene ' + G.Game.sceneName + ')'); break; }
      }
      if (s && s.player && s.player.name !== name0) { ends.push('대 이음: ' + name0 + ' → ' + s.player.name + ' (' + Q.date() + ')'); name0 = s.player.name; }
    }
    return { days: n, msDay: n ? +((performance.now() - t0) / n).toFixed(2) : 0, events: ends };
  };

  // ---------------------------------------------------------------- 가족 (아들을 둔다)
  Q.giveSon = function (tag) {
    var s = S(), p = s.player, F = G.Family;
    if (!p.wife) {
      var used = {}; (s.qaWives || []).forEach(function (x) { used[x] = 1; });
      var m = (G.MAIDS || []).filter(function (x) { return !used[x.id]; })[0];
      if (m) { p.wife = m.id; s.qaWives = (s.qaWives || []).concat([m.id]); s.maids = s.maids || {}; s.maids[m.id] = s.maids[m.id] || { aff: 100 }; }
    }
    var k = { name: '', unnamed: true, sex: 'm', born: { y: s.date.y, m: s.date.m, d: s.date.d }, sk: {}, lg: {}, st: { str: 62, int: 63, mar: 60, cha: 61 }, edu: {}, bond: 65, witness: true };
    var nm = F.names('m').filter(function (n) { return !p.kids.some(function (o) { return F.given(o) === n; }) && n !== F.given(p); })[0] || F.names('m')[0];
    F.setKidName(k, nm); k.met = true;
    p.kids.push(k);
    G.State.log('[QA] 아들 ' + k.name + ' (' + tag + ')');
    return k.name;
  };

  // ---------------------------------------------------------------- 상태 점검
  Q.check = function () {
    var s = S(), bad = [];
    if (!s) return ['state 없음'];
    var p = s.player, f = s.fleet;
    [['gold', p.gold], ['bank', p.bank], ['fame', p.fame], ['food', f.food], ['water', f.water], ['crew', f.crew], ['fatigue', f.fatigue], ['day', s.day]].forEach(function (x) {
      if (typeof x[1] !== 'number' || !isFinite(x[1])) bad.push(x[0] + '=' + x[1]);
      else if (x[1] < 0 && x[0] !== 'gold') bad.push(x[0] + '<0 (' + x[1] + ')');
    });
    if (!p.name) bad.push('이름 없음');
    if (!f.ships || !f.ships.length) bad.push('배 없음');
    f.ships.forEach(function (sh, i) { if (!G.SHIP[sh.type]) bad.push('배 종류 모름 ' + sh.type); if (sh.hp != null && !isFinite(sh.hp)) bad.push('배 hp ' + sh.hp); });
    (s.mates || []).forEach(function (m) { if (!G.MATE[m.id]) bad.push('동료 모름 ' + m.id); if (m.loyal != null && !isFinite(m.loyal)) bad.push('충성 ' + m.id + '=' + m.loyal); });
    if (s.loc.mode === 'city' && !G.CITY_DATA[s.loc.city]) bad.push('도시 모름 ' + s.loc.city);
    return bad;
  };
  Q.snap = function () {
    var s = S(), p = s.player, f = s.fleet, R = G.R;
    var t0 = performance.now(), json = G.State.serialize(), ser = performance.now() - t0, back = null;
    try { var t1 = performance.now(); back = G.State.deserialize(json); var de = performance.now() - t1; } catch (e) { back = { err: String(e) }; }
    var ok = back && !back.err && back.player && back.player.name === p.name && back.day === s.day;
    var mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
    var cities = G.CITY_DATA.filter(function (c) { return R.cityExists(c); }).length;
    return { date: Q.date(), name: p.name, gen: p.generation || 1, age: R.age(), gold: Math.round(p.gold), fame: p.fame, ships: f.ships.length, crew: f.crew, mates: (s.mates || []).length,
      kids: p.kids.length, found: s.stats.found, cities: cities, saveKB: Math.round(json.length / 1024), serMs: +ser.toFixed(1), loadOk: !!ok, loadErr: back && back.err, memMB: mem, log: (s.log || []).length, bad: Q.check() };
  };
  Q.counts = function () {
    var o = { dom: document.getElementsByTagName('*').length, toasts: document.querySelectorAll('.toast, .toasts > *').length, layers: [].slice.call(document.querySelectorAll('#ui > .layer')).map(function (x) { return x.children.length; }).join(',') };
    try { var st = G.Scenes.sea.runtime && G.Scenes.sea.runtime(); if (st) { o.trail = (st.trail || []).length; o.npcs = (st.npcs || []).length; o.wakes = (st.wakes || st.wake || []).length; } } catch (e) { /* 없음 */ }
    return o;
  };
  Q.export = function () { return G.State.serialize(); };
})();
