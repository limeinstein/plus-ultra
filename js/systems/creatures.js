/* 괴물과 거대한 짐승 (2026-11-17 사용자 요청) — 규칙
   ■ G.Monsters — 사람 모양 괴물이 발견물 앞을 막는다 (js/systems/discovery.js D.find 가 무덤의 일기토 다음에 부른다)
     리치·흡혈귀·늑대인간·해골 기사·트롤·미노타우로스·예티 (이야기: js/data/creaturelines.js G.MONSTER_TALES) · 엘프·세계수 (G.ELVES 가운데 하나)
     겨룬다 / 부관에게 맡긴다 / 물러선다 → 이기면 「어떻게 끝낼까」 선택 (애증의 갈림길) · 지거나 물러서면 retryDays 뒤에 다시
     저장: s.disc[id].mon = {done, res} · s.disc[id].monBlock = 다시 다가갈 수 있는 날
   ■ G.Elves — 북방의 숲(elf.zone)에서 엘프가 우연히 길을 막는다. 세계수(발견물) 가까이일수록 자주. 엘프마다 말이 다르다.
     이긴 엘프는 back 확률로 elf.backDays(30)일 뒤 다시 나타나 「그때와는 달리 너를 따라가고 싶다」며 한 번 더 겨루고 → 이기면 동료
     저장: s.elves = {met, beat, back: {id: 날}, joined, declined, last}
   ■ G.Guardian — 힘센 짐승의 새끼·알(r_<발견>_baby, G.GUARDIANS)을 지니고 뭍에 있으면, 그 짐승이 사는 곳에서 range° 안이면
     spawnDist° 밖에서 「?」가 나타나 하루 speed°로 쫓아온다(멈춰 서 있어도). 가까워지면 거대한 짐승의 모습이 보이고, 따라잡히면
     새끼를 놓아준다 · 피한다(탈것·운용술) · 맞서 싸운다(거대한 짐승과 육상전 — js/games/landwar.js e.giant)
     이기면 머리 박제(mount) · 거대한 머리 화석(fossil, 공룡·옛 짐승) · 깃털 부채(fan, 봉황·로크). 지면 새끼를 빼앗긴다.
     저장: s.guard[발견 id] = {res: won|lost|freed, cool: 다시 쫓아오는 날}
   조정값: G.BALANCE.creatures */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  function S() { return G.Game.state; }
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.creatures = G.BALANCE.creatures || {
    retryDays: 30, winFame: 6, fameK: 1.25,
    elf: { zone: [-25, 35, 50, 72], chance: 0.025, nearChance: 0.15, nearR: 6, cool: 25, backDays: 30, terr: ['forest', 'snow', 'tundra', 'mountain', 'grass'], gift: 0.5 },
    guardian: { spawnDist: 3.0, speed: 0.75, catchR: 0.14, nearR: 1.1, range: 25, fleeBase: 0.35, fleeOps: 0.08, fleeMount: 0.2, fleeCool: 6, fameWin: 8 }
  };
  function K() { return G.BALANCE.creatures; }
  function first() { return G.Scenes.mateSpeaker('first'); }
  function fill(t, o) {
    return String(t).replace(/\{(g|d)\}\{([^}]+)\}/g, function (_, k, p) { var v = o[k] || ''; return v + U.jx(v, p); })
      .replace(/\{(g|d)\}/g, function (_, k) { return o[k] || ''; });
  }
  async function play(lines, mon) {
    for (var i = 0; i < (lines || []).length; i++) {
      var w = lines[i][0], who = w === 'M' ? mon : w === 'F' ? first() : w === 'A' ? { name: S().player.name, portrait: S().player.portrait } : {};
      await UI.say(lines[i][1], who || {});
    }
  }
  function fighter(name, du, sprite) {
    return { name: name, str: du.str, atk: du.atk, def: du.def, skill: du.skill, mar: du.mar, int: du.int || 60, cha: du.cha || 50, style: du.style || 'slash', look: 'rival', sprite: sprite };
  }
  function giveItem(id) {
    if (!id || !G.ITEM[id]) return;
    if (R.addItem(id)) UI.toast('「' + G.ITEM[id].name + '」' + U.jx(G.ITEM[id].name, '을/를') + ' 손에 넣었다.', 'chest', 4200);
    else { S().player.items.push({ id: id }); UI.toast('짐이 가득하지만 「' + G.ITEM[id].name + '」만은 품에 넣어 왔다.', 'chest', 4200); }
  }
  /** 겨룰지 묻고 일기토 — 'win' | 'lose' | 'back' (+ 대신 싸운 부하) */
  async function challenge(f, q, place, backLabel, dare) {
    var px = G.Games.proxy ? G.Games.proxy() : null, pd = px && G.MATE[px.id];
    var opts = [{ label: '정정당당히 겨룬다 (일기토)', value: 'duel' }];
    if (pd) opts.push({ label: '부관 ' + pd.name + '에게 맡긴다', value: 'proxy' });
    opts.push({ label: backLabel || '물러선다', value: 'back' });
    var v = await UI.ask(q, opts, first());
    if (v === 'back') return { res: 'back' };
    if (v === 'proxy') await UI.say(U.pick(['제독께서 나서실 것까지 없습니다. 제가 상대하지요.', '이 상대는 제게 맡겨 주십시오.']), first());
    if (dare) await dare();   // 겨루기 직전의 한마디
    var res = await G.Games.duel(f, v === 'proxy' ? { mate: px, place: place } : { place: place });
    var ld = G.Games.lastDuel || {}, fm = ld.mate;
    if (fm && res === 'lose') { fm.hurt = S().day + 20; await UI.say('면목 없습니다, 제독… 보통 상대가 아니었습니다. (' + G.MATE[fm.id].name + U.jx(G.MATE[fm.id].name, '은/는') + ' 20일 동안 다쳐 능력이 절반이 된다)', first()); }
    if (res === 'win' && fm) fm.loyal = Math.min(100, (fm.loyal || 70) + 4);
    return { res: res === 'win' ? 'win' : 'lose', mate: fm };
  }

  // ================================================================ 엘프
  var E = G.Elves = {};
  function ES() { var s = S(); return s.elves || (s.elves = { met: {}, beat: {}, back: {}, joined: {}, declined: {}, last: -999 }); }
  E.get = function (id) { return (G.ELVES || []).filter(function (e) { return e.id === id; })[0] || null; };
  E.speaker = function (e) {
    var A = G.Art, sp = A && A.npcSpec ? A.npcSpec('elf:' + e.id, e.old ? 'priest' : 'soldier', 'ne', e.g) : null;
    if (sp) { sp.noRole = true; A.withImg(sp, ['portraits/creatures/' + e.id, 'portraits/creatures/elf']); }
    return { name: e.name + ' (엘프)', portrait: sp, lang: 3 };
  };
  /** 아직 만나지 않은 엘프 하나 (없으면 null) */
  E.fresh = function () {
    var es = ES(), L = (G.ELVES || []).filter(function (e) { return !es.met[e.id] && !es.joined[e.id]; });
    return L.length ? U.pick(L) : null;
  };
  E.inZone = function (lon, lat) { var z = K().elf.zone; return lon >= z[0] && lon <= z[1] && lat >= z[2] && lat <= z[3]; };
  function treeNear(lon, lat) { var d = G.DISC && G.DISC.worldtree; return d ? G.Geo.dist(lon, lat, d.lon, d.lat) : 999; }
  /** 엘프와 겨룬다 — mode: 'random'(숲에서 우연히) | 'disc'(세계수·엘프 발견물 앞) → 'win' | 'lose' | 'back' */
  E.duel = async function (e, mode, place) {
    var es = ES(), s = S(), who = E.speaker(e);
    es.met[e.id] = s.day; es.last = s.day;
    await UI.say(U.pick(['숲 사이로 은빛이 번뜩이더니, 귀 끝이 뾰족한 이가 나무 그늘에서 걸어 나와 길을 막는다.', '바람도 없는데 나뭇잎이 일제히 뒤집힌다. 잿빛 머리의 엘프가 칼을 비스듬히 든 채 앞을 막아선다.']), {});
    UI.toast('엘프 — ' + e.name + ' · ' + e.title, 'leaf', 5200);
    for (var i = 0; i < e.meet.length; i++) await UI.say(e.meet[i], who);
    if (mode === 'random') await UI.say(U.pick(['제독, 세계수를 지킨다는 엘프입니다. …말은 저래도 정말로 우리가 나무를 해칠까 봐 겁내는 것 같습니다.', '북방 사람들이 말하던 숲의 사람들입니다. 싸우지 않고 돌아설 수도 있습니다, 제독.']), first());
    var c = await challenge(fighter(e.name, e.duel, 'elf'), e.name + U.jx(e.name, '이/가') + ' 칼을 들고 길을 막는다. 어떻게 할까?', place || 'explore', mode === 'random' ? '물러선다 (돌아서 간다)' : '물러선다 (' + K().retryDays + '일 뒤에 다시)', function () { return UI.say(e.dare, who); });
    if (c.res === 'back') { await UI.say(e.lose, who); return 'back'; }
    if (c.res === 'win') {
      await UI.say(e.win, who);
      es.beat[e.id] = s.day;
      G.Fame.add('bt', K().winFame);
      G.State.log('세계수를 지키는 엘프 ' + e.name + U.jx(e.name, '와/과') + ' 겨루어 이겼다.');
      if (U.chance(e.back == null ? 0.7 : e.back)) es.back[e.id] = s.day + K().elf.backDays;
      if (mode === 'random' && U.chance(K().elf.gift)) giveItem('cr_elf_arrowhead');
      return 'win';
    }
    await UI.say(e.lose, who);
    if (s.fleet) s.fleet.fatigue = Math.min(100, (s.fleet.fatigue || 0) + 8);
    return 'lose';
  };
  /** 이긴 엘프가 돌아왔는가 */
  E.due = function () { var es = S() && ES(), s = S(); if (!es) return null; for (var id in es.back) if (s.day >= es.back[id] && !es.joined[id] && E.get(id)) return id; return null; };
  E.pending = function () { return !!(S() && E.due()); };
  /** 30일 뒤: 「그때와는 달리 너를 따라가고 싶다」 — 한 번 더 겨루고, 이기면 동료가 된다 */
  E.comeBack = async function (id, place) {
    var e = E.get(id), es = ES(), s = S(), who = E.speaker(e); if (!e) return;
    delete es.back[id];
    await UI.say(U.pick(['어디선가 낯익은 은빛이 번뜩인다. 그때 길을 막았던 엘프가 이번에는 칼을 내린 채 걸어 나온다.', '어느새 일행 곁에 잿빛 머리의 엘프가 서 있다. 한 달 전, 숲에서 칼을 겨눴던 바로 그 얼굴이다.']), {});
    for (var i = 0; i < e.backTalk.length; i++) await UI.say(e.backTalk[i], who);
    var v = await UI.ask(e.name + U.jx(e.name, '이/가') + ' 따라가고 싶다고 한다. 어떻게 할까?', [{ label: '받아들인다 (한 번 더 겨룬다)', value: 'yes' }, { label: '거절한다', value: 'no' }], first());
    if (v !== 'yes') { await UI.say(e.decline, who); es.declined[id] = s.day; return; }
    await UI.say(e.again, who);
    var res = await G.Games.duel(fighter(e.name, e.duel, 'elf'), { place: place || 'explore' });
    if (res === 'win') {
      await UI.say(e.join, who);
      es.joined[id] = s.day;
      if (G.Legend && G.Legend.join) G.Legend.join(id);
      else { s.mates.push({ id: id, role: 'none', joined: U.dateNum(s.date), loyal: 85 }); UI.toast(e.name + ' 동료가 되었다.', 'people', 3600); }
      var nm = s.mates.filter(function (m) { return m.id === id; })[0]; if (nm) nm.loyal = Math.max(nm.loyal || 0, 88);
      G.State.log('세계수의 엘프 ' + e.name + U.jx(e.name, '이/가') + ' 「그때와는 달리, 너를 따라가고 싶다」며 동료가 되었다.');
    } else {
      await UI.say(e.fail, who);
      es.back[id] = s.day + K().elf.backDays;
    }
  };
  E.check = async function () { var id = E.due(); if (id) await E.comeBack(id, 'city'); };
  /** 뭍의 하루 (js/scenes/land.js runDay) */
  E.onLand = async function (lon, lat, api) {
    var s = S(), es = ES(), k = K().elf;
    var due = E.due();
    if (due) { if (api && api.stop) api.stop(); await E.comeBack(due, 'explore'); return true; }
    if (!E.inZone(lon, lat) || s.day - es.last < k.cool) return false;
    if (k.terr.indexOf(G.Geo.terrain(lon, lat)) < 0) return false;
    var e = E.fresh(); if (!e) return false;
    var near = treeNear(lon, lat) < k.nearR;
    if (!U.chance(near ? k.nearChance : k.chance)) return false;
    if (api && api.stop) api.stop();
    await E.duel(e, 'random', 'explore');
    return true;
  };

  // ================================================================ 사람 모양 괴물 (발견물 앞)
  var M = G.Monsters = {};
  M.tale = function (d) { return d && G.MONSTER_TALES ? G.MONSTER_TALES[d.id] || null : null; };
  function isElfPlace(d) { return d && (d.id === 'worldtree' || d.id === 'elf'); }
  M.pending = function (d) {
    var st = d && S().disc[d.id];
    if (st && st.mon && st.mon.done) return false;
    if (isElfPlace(d)) return !!E.fresh();
    return !!M.tale(d);
  };
  M.blocked = function (d) { var st = d && S().disc[d.id]; return !!(st && st.monBlock && S().day < st.monBlock && M.pending(d)); };
  /** 발견을 기록하기 전에 → {go, fameK, noRelic} */
  M.meet = async function (d, how) {
    var none = { go: true, fameK: 1 };
    if (!M.pending(d)) return none;
    var s = S(), st = s.disc[d.id] || (s.disc[d.id] = {}), k = K(), place = how === 'sea' ? 'deck' : how === 'city' ? 'city' : 'explore';
    if (M.blocked(d)) return { go: false };
    // 세계수·엘프 바위: 엘프 하나가 막아선다
    if (isElfPlace(d)) {
      var r = await E.duel(E.fresh(), 'disc', place);
      if (r === 'win') { st.mon = { done: 1, res: 'win' }; delete st.monBlock; return { go: true, fameK: k.fameK }; }
      st.monBlock = s.day + k.retryDays;
      UI.toast(d.name + U.jx(d.name, '은/는') + ' ' + k.retryDays + '일 뒤에야 다시 다가갈 수 있다.', 'leaf', 4800);
      return { go: false };
    }
    var t = M.tale(d), mon = { name: t.name, lang: 3 };
    UI.toast(t.title + ' — ' + t.name, t.icon || 'skull', 5200);
    await play(t.meet, mon);
    var c = await challenge(fighter(t.name, t.duel, t.sprite), t.name + U.jx(t.name, '이/가') + ' 앞을 막는다. 어떻게 할까?', place, '물러선다 (' + k.retryDays + '일 뒤에 다시)', function () { return play(t.dare, mon); });
    if (c.res === 'win') {
      await play(t.win, mon);
      G.Fame.add('bt', k.winFame);
      var ch = t.choice, out = { go: true, fameK: k.fameK };
      if (ch) {
        var v = await UI.ask(ch.q, ch.opts.map(function (o) { return { label: o.label, value: o.value }; }), first());
        var o = ch.opts.filter(function (x) { return x.value === v; })[0] || ch.opts[0];
        await play(o.lines, mon);
        if (o.give) giveItem(o.give);
        if (o.gold) { s.player.gold += o.gold; UI.toast('금화 ' + U.num(o.gold) + '닢을 얻었다.', 'coin', 4200); }
        if (o.fame) G.Fame.add('ex', o.fame);
        if (o.notor) { s.player.notoriety = (s.player.notoriety || 0) + o.notor; UI.toast('뒷말이 돈다. (악명 +' + o.notor + ')', 'skull', 3600); }
        if (o.log) G.State.log(o.log);
        if (o.relic === false) out.noRelic = true;
        st.mon = { done: 1, res: o.value };
      } else st.mon = { done: 1, res: 'win' };
      delete st.monBlock;
      return out;
    }
    await play(c.res === 'back' ? [['M', U.pick(['…돌아가는 건가. 그것도 나쁘지 않지.', '현명하군. 다음엔 각오하고 오라.'])]] : t.lose, mon);
    if (c.res === 'lose' && t.loseGold) { var lg = Math.round(s.player.gold * t.loseGold); s.player.gold -= lg; if (lg > 0) UI.toast('금화 ' + U.num(lg) + '닢을 빼앗겼다.', 'coin', 3600); }
    if (c.res === 'lose' && s.fleet) s.fleet.fatigue = Math.min(100, (s.fleet.fatigue || 0) + 10);
    st.monBlock = s.day + k.retryDays;
    UI.toast(d.name + U.jx(d.name, '은/는') + ' ' + k.retryDays + '일 뒤에야 다시 다가갈 수 있다.', 'shield', 4800);
    return { go: false };
  };

  // ================================================================ 새끼를 되찾으러 오는 거대한 짐승
  var GD = G.Guardian = {};
  var C = null;   // 지금 쫓아오는 것 {disc, lon, lat, near} — 저장하지 않는다 (뭍에 다시 오르면 멀리서 새로 나타난다)
  function GS() { var s = S(); return s.guard || (s.guard = {}); }
  GD.spec = function (id) { var g = G.GUARDIANS && G.GUARDIANS[id]; return g ? { id: id, sheet: 'cb_' + g[0], name: g[1], trophy: g[2], pow: g[3], n: g[4], k: g[5] } : null; };
  GD.babyOf = function (id) { return 'r_' + id + '_baby'; };
  /** 새끼를 지니고 있고 아직 결판이 나지 않은 짐승 id 들 */
  GD.carried = function () {
    var s = S(), gs = GS(); if (!s || !s.player) return [];
    return Object.keys(G.GUARDIANS || {}).filter(function (id) { var r = gs[id]; return !(r && r.res) && R.hasItem(GD.babyOf(id)); });
  };
  GD.chaser = function () { return C; };
  GD.reset = function () { C = null; };
  function landAt(lon, lat, ang, dist) {
    for (var t = 0; t < 12; t++) {
      var a = ang + (t % 2 ? 1 : -1) * Math.ceil(t / 2) * 0.45, r = dist * (1 - Math.floor(t / 4) * 0.15);
      var x = G.Geo.wrapLon(lon + Math.cos(a) * r), y = lat + Math.sin(a) * r;
      if (G.Geo.isLand(x, y)) return [x, y];
    }
    return null;
  }
  /** 실시간: days 만큼 쫓아온다. 따라잡았으면 true */
  GD.step = function (days, l) {
    if (!l || l.mode !== 'land' || !(days > 0)) return false;
    var s = S(), k = K().guardian, gs = GS();
    var ids = GD.carried().filter(function (id) { var d = G.DISC[id], r = gs[id]; return d && G.Geo.dist(l.lon, l.lat, d.lon, d.lat) <= k.range && !(r && r.cool > s.day); });
    if (!ids.length) { C = null; return false; }
    if (!C || ids.indexOf(C.disc) < 0) {
      var id = ids[0], d = G.DISC[id], ang = Math.atan2(d.lat - l.lat, G.Geo.wrapLon(d.lon - l.lon));
      if (G.Geo.dist(l.lon, l.lat, d.lon, d.lat) < 0.5) ang = Math.random() * Math.PI * 2;
      var p = landAt(l.lon, l.lat, ang, k.spawnDist) || [G.Geo.wrapLon(l.lon + k.spawnDist), l.lat];
      C = { disc: id, lon: p[0], lat: p[1], near: false };
      var L = G.GUARDIAN_LINES || {};
      UI.toast(U.pick(L.spawn || ['무언가 빠르게 다가온다!']), 'paw', 5200);
      setTimeout(function () { if (C && C.disc === id && L.warn) UI.toast(U.pick(L.warn), 'paw', 6000); }, 1500);
      if (G.Audio && G.Audio.beast) G.Audio.beast(G.GUARDIANS[id][0]);
    }
    var dx = G.Geo.wrapLon(l.lon - C.lon), dy = l.lat - C.lat, dist = Math.hypot(dx, dy), stp = k.speed * days;
    if (dist <= k.catchR + stp) { C.lon = l.lon; C.lat = l.lat; return true; }
    C.lon = G.Geo.wrapLon(C.lon + dx / dist * stp); C.lat += dy / dist * stp;
    if (!C.near && dist < k.nearR) {
      C.near = true; var g = GD.spec(C.disc);
      UI.toast(fill((G.GUARDIAN_LINES || {}).near || '{g}다!', { g: g.name }), 'paw', 4800);
    }
    return false;
  };
  /** 땅 지도 위의 「?」 — 가까워지면 거대한 짐승의 모습 */
  GD.draw = function (ctx, toScreen, zoom, t, ff) {
    if (!C) return;
    var s = S(), l = s.loc, p = toScreen(C.lon, C.lat), dist = G.Geo.dist(l.lon, l.lat, C.lon, C.lat), k = K().guardian;
    if (p[0] < -200 || p[0] > 1800 || p[1] < -200 || p[1] > 1100) return;
    var g = GD.spec(C.disc), SP = G.Sprites, seen = dist < k.nearR && SP && SP.ready && SP.ready(g.sheet);
    ctx.save();
    // 흙먼지
    for (var i = 0; i < 6; i++) {
      var ph = (t * 1.6 + i / 6) % 1, ax = Math.atan2(l.lat - C.lat, G.Geo.wrapLon(l.lon - C.lon));
      var bx = p[0] - Math.cos(ax) * (10 + ph * 46) + Math.sin(i * 7.3) * 8, by = p[1] + Math.sin(ax) * (10 + ph * 46) * 0.5 + 4;
      ctx.globalAlpha = (1 - ph) * 0.28; ctx.fillStyle = '#c8a878'; ctx.beginPath(); ctx.arc(bx, by, 6 + ph * 14, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (seen) {
      var fr = SP.at(g.sheet, 0, 'walk', t, 8), face = G.Geo.wrapLon(l.lon - C.lon) < 0, kk = Math.min(0.42, 26 * (g.k || 2) / 150);
      SP.draw(ctx, g.sheet, 0, fr, p[0], p[1] + 8, kk, face);
      ctx.font = '700 15px ' + ff; ctx.textAlign = 'center';
      var tw = ctx.measureText(g.name).width;
      ctx.fillStyle = 'rgba(60,10,6,.72)'; ctx.fillRect(p[0] - tw / 2 - 6, p[1] - 92, tw + 12, 21);
      ctx.fillStyle = '#ffd9c8'; ctx.fillText(g.name, p[0], p[1] - 76);
    } else {
      var pulse = 1 + Math.sin(t * 6) * 0.12, bob = Math.sin(t * 9) * 2;
      ctx.fillStyle = 'rgba(90,14,8,.6)'; ctx.beginPath(); ctx.arc(p[0], p[1] + bob, 17 * pulse, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,90,.9)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffe0d0'; ctx.font = '900 20px ' + ff; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', p[0], p[1] + bob + 1); ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();
  };
  /** 따라잡혔다 — 놓아준다 · 피한다 · 싸운다 */
  GD.encounter = async function (api) {
    if (!C) return;
    var s = S(), id = C.disc, d = G.DISC[id], g = GD.spec(id), gs = GS(), L = G.GUARDIAN_LINES || {}, k = K().guardian;
    var o = { g: g.name, d: d ? d.name : '' }, egg = /알$/.test((G.ITEM[GD.babyOf(id)] || {}).name || '');
    if (G.Audio && G.Audio.beast) G.Audio.beast(G.GUARDIANS[id][0]);
    await UI.say(fill(U.pick(egg && L.egg ? L.egg : L.caught), o), {});
    await UI.say(U.pick(L.mate), first());
    var opt = L.opt || {};
    var v = await UI.ask(fill(L.q, o), [{ label: opt.release, value: 'release' }, { label: opt.flee, value: 'flee' }, { label: opt.fight, value: 'fight' }], first());
    if (v === 'release') {
      R.removeItem(GD.babyOf(id)); gs[id] = { res: 'freed' }; C = null;
      for (var i = 0; i < L.release.length; i++) await UI.say(fill(L.release[i], o), {});
      G.Fame.add('ex', 4);
      G.State.log(g.name + U.jx(g.name, '에게') + ' 새끼를 돌려주었다.');
      return 'freed';
    }
    if (v === 'flee') {
      var mt = s.loc && s.loc.mount, ride = mt && mt.id !== 'walk' && mt.n > 0;
      var p = U.clamp(k.fleeBase + R.skill('ops') * k.fleeOps + (ride ? k.fleeMount : 0) - (g.pow - 6) * 0.03, 0.1, 0.85);
      if (U.chance(p)) {
        await UI.say(fill(U.pick(L.fleeOk), o), {});
        gs[id] = { cool: s.day + k.fleeCool }; C = null;
        if (s.fleet) s.fleet.fatigue = Math.min(100, (s.fleet.fatigue || 0) + 8);
        return 'fled';
      }
      await UI.say(fill(U.pick(L.fleeBad), o), {});
    }
    var res = await api.battle(g.name, g.n, { kind: 'beast', leader: g.name, flee: false, giant: { sheet: g.sheet, k: g.k, pow: g.pow, name: g.name } });
    C = null;
    if (res === 'win') {
      var lines = g.trophy === 'fossil' ? L.winFossil : g.trophy === 'fan' ? L.winFan : L.win;
      for (var j = 0; j < lines.length; j++) await UI.say(fill(lines[j], o), {});
      gs[id] = { res: 'won' };
      G.Fame.add('bt', k.fameWin + g.pow);
      giveItem('tr_' + id);
      G.State.log(g.name + U.jx(g.name, '을/를') + ' 물리쳤다. ' + fill((L.trophy || {})[g.trophy] || '', o));
      return 'won';
    }
    if (res === 'lose') {
      R.removeItem(GD.babyOf(id)); gs[id] = { res: 'lost' };
      for (var q = 0; q < L.lose.length; q++) await UI.say(fill(L.lose[q], o), {});
      return 'lost';
    }
    gs[id] = { cool: s.day + k.fleeCool };
    return res;
  };

  // ---------------------------------------------------------------- 전리품 이름·값 (발견물 자료가 다 읽힌 뒤)
  function nameTrophies() {
    if (!G.GUARDIANS || !G.ITEM || !G.DISC) return;
    Object.keys(G.GUARDIANS).forEach(function (id) {
      var it = G.ITEM['tr_' + id], d = G.DISC[id], kind = G.GUARDIANS[id][2]; if (!it || !d) return;
      it.name = kind === 'fossil' ? '거대한 ' + d.name + ' 머리 화석' : kind === 'fan' ? d.name + ' 깃털 부채' : d.name + ' 머리 박제';
      it.price = Math.max(3000, Math.round((d.val || 10000) * (kind === 'fan' ? 0.5 : 0.6) / 50) * 50);
    });
  }
  nameTrophies();
})(window.G = window.G || {});
