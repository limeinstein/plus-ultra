/* 첫사랑 (G.FirstLove) — 대사·조정값: js/data/firstlove.js (G.FIRST_LOVE · G.BALANCE.firstLove). 2026-10-29 사용자 요청
   소꿉친구(js/systems/heirplan.js · oldguard.js — 여성)는 사실 뒤를 이은 제독의 첫사랑이었다.
   ■ 누가: 함대에 있는 여성 소꿉친구(d.kin === 'friend') 가운데, 지금 제독의 소꿉친구(d.kinOf — 옛 저장은 설명의 「○○의 소꿉친구」)
   ■ 차례 (s.oldGuard.fl = {id, st, at, n, dates, sea}):
     ① voyage — 첫 항해: 항구를 떠나 seaDays일 지난 바다에서, 밤 고물에서 말을 꺼내다 그만둔다 (비밀의 실마리)
     ② secret — secretGap일 뒤(바다든 항구든): 선장실 궤짝의 부치지 못한 열두 살의 편지 · 그녀의 조개 목걸이 → 「진심이야」(연애로) · 「친구」 · (아내가 있으면) 「지켜야 할 사람」
     ③ love — 항구에 들어설 때 dateChance로 데이트(시장·노을 부두·등불 축제 — 같은 것은 겹치지 않는다), dateGap일마다, dates번
     ④ propose — 다음 항구에서 청혼 → 혼례(갑판 위의 혼례 G.FamEv.wedding) — 반지 없이도 (조개 목걸이가 약속). 「아직은」이면 proposeLater일 뒤 다시.
     끝: wed · friend · kept. 그사이 다른 사람과 결혼했으면 kept.
   ■ 장면: 전용 그림(images/family-events/firstlove_*)이 있으면 그것을, 없으면 배경 + 제독·소꿉친구 무릎상을 합성한다(G.EventShot).
   ■ 화면 틈에 (main.js loop → FL.tick) — 다른 창이 없을 때 도시·바다에서 */
(function (G) {
  'use strict';
  var U = G.U;
  var FL = G.FirstLove = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return G.BALANCE.firstLove; }
  function D() { return G.FIRST_LOVE; }
  function fill(t, o) { return G.OldGuard ? G.OldGuard.fill(t, o) : String(t); }
  FL.st = function () { var s = S(), o = G.OldGuard.st(); return o.fl || (o.fl = {}); };

  // ---------------------------------------------------------------- 누구
  /** 지금 제독의 소꿉친구인가 */
  FL.isMine = function (d) {
    var p = S().player; if (!d || d.kin !== 'friend' || d.g !== 'f') return false;
    var me = [p.given, p.name].filter(Boolean);
    if (d.kinOf) return me.indexOf(d.kinOf) >= 0;
    return me.some(function (n) { return String(d.desc || '').indexOf(n + '의 소꿉친구') === 0; });
  };
  /** 함대에 있는 첫사랑 (부하 줄) */
  FL.who = function () {
    var s = S(), o = FL.st();
    if (o.id) return (s.mates || []).filter(function (m) { return m.id === o.id; })[0] || null;
    return (s.mates || []).filter(function (m) { return FL.isMine(G.MATE[m.id]); })[0] || null;
  };
  function married() { var p = S().player; return !!p.wife; }

  // ---------------------------------------------------------------- 말 · 장면
  function sp(id) { var d = G.MATE[id]; return { name: d.name, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, half: G.Img.chain.heroHalf ? G.Img.chain.heroHalf() : null, lang: 3 }; }
  async function lines(list, id, o) {
    for (var i = 0; i < list.length; i++) {
      var l = list[i], who = l.slice(0, 2), t = fill(l.slice(2), o);
      if (who === 'm:') await G.UI.say(t, sp(id));
      else if (who === 'p:') await G.UI.say(t, me());
      else await G.UI.say(t, {});
    }
  }
  function here() { var s = S(); return s.loc && s.loc.mode === 'city' ? G.CITY_DATA[s.loc.city] : null; }
  function words(d) { var s = S(), p = s.player, hc = G.CITY_DATA[p.home], c = here(); return { me: p.given || p.name, name: d.name, home: hc ? hc.name : '', city: c ? c.name : '' }; }
  var BG = {
    voyage: ['duel/backgrounds/deck', 'cabins/deck'], secret: ['cabins/captain', 'legend-events/oldguard_arrange'],
    market: ['events/home/market'], harbor: ['events/home/harbor', 'events/home/pier'], festival: ['duel/backgrounds/tavern', 'events/home/night'],
    propose: ['events/home/pier', 'events/home/harbor']
  };
  var LIGHT = { voyage: 'night', secret: 'gold', market: 'day', harbor: 'dusk', festival: 'night', propose: 'dusk' };
  /** 장면: 전용 그림 family-events/firstlove_<key> → 없으면 합성 */
  FL.shot = function (key, id, title) {
    var I = G.Img, own = 'family-events/firstlove_' + key, none = { stop: function () { return Promise.resolve(); } };
    try {
      if (I && I.file && I.file(own) && G.FamEv) return Promise.resolve(G.FamEv.showPic({ img: own, title: title, noStand: true }) || none);
      var c = here(), bg = BG[key].slice();
      if (key === 'market' && c && I.chain.interior) bg = I.chain.interior('market', c).concat(bg);
      if (!G.EventShot || !BG[key].concat(bg).some(function (k) { return I.has ? I.has(k) : true; })) return Promise.resolve(none);
      return G.EventShot.show({ title: title, bg: bg, light: LIGHT[key], sparkle: key === 'propose',
        cast: [{ half: I.chain.heroHalf ? I.chain.heroHalf() : ['characters/player_half'], x: 0.3, h: 1.04, y: 0.04 }, { half: I.chain.mateHalf(id), x: 0.69, lead: true, h: 1.04, y: 0.04, flip: false }] });
    } catch (e) { console.error(e); return Promise.resolve(none); }
  };
  async function scene(key, id, title, fn) {
    var pc = await FL.shot(key, id, title);
    try { return await fn(); } finally { if (pc && pc.stop) await pc.stop(); }
  }

  // ---------------------------------------------------------------- 차례
  FL.voyage = async function (m) {
    var d = G.MATE[m.id], o = FL.st(), V = D().voyage, w = words(d);
    await scene('voyage', m.id, V.title, function () { return lines(V.lines, m.id, w); });
    o.id = m.id; o.st = 'voyage'; o.at = S().day + K().secretGap;
    m.loyal = Math.min(100, (m.loyal || 70) + K().loyal.voyage);
    G.State.log(fill(V.log, w));
  };
  FL.secret = async function (m) {
    var s = S(), d = G.MATE[m.id], o = FL.st(), X = D().secret, w = words(d), k = K();
    var v = await scene('secret', m.id, X.title, async function () {
      await lines(X.lines, m.id, w);
      var opts = married() ? [{ label: X.kept, value: 'kept' }, { label: X.friend, value: 'friend' }] : [{ label: X.confess, value: 'confess' }, { label: X.friend, value: 'friend' }];
      var r = await G.UI.ask(fill(X.ask, w), opts, sp(m.id));
      r = r === 'confess' && !married() ? 'confess' : r === 'kept' ? 'kept' : r === 'friend' ? 'friend' : (married() ? 'kept' : 'friend');
      await lines(r === 'confess' ? X.confessSay : r === 'kept' ? X.keptSay : X.friendSay, m.id, w);
      return r;
    });
    o.st = v === 'confess' ? 'love' : v; o.n = 0; o.dates = []; o.at = s.day + k.dateGap;
    m.loyal = Math.min(100, (m.loyal || 70) + (v === 'confess' ? k.loyal.confess : k.loyal.friend));
    if (!d.flDesc) { d.flDesc = 1; d.desc = (d.desc || '') + fill(X.descAdd[v], w); }
    G.State.log(fill(X.log[v], w));
  };
  FL.date = async function (m) {
    var s = S(), d = G.MATE[m.id], o = FL.st(), k = K(), w = words(d);
    var left = D().dates.filter(function (x) { return (o.dates || []).indexOf(x.id) < 0; });
    var t = left.length ? U.pick(left) : U.pick(D().dates);
    await scene(t.id, m.id, t.title, function () { return lines(t.lines, m.id, w); });
    (o.dates = o.dates || []).push(t.id); o.n = (o.n || 0) + 1; o.at = s.day + k.dateGap;
    m.loyal = Math.min(100, (m.loyal || 70) + k.loyal.date);
    if (o.n >= k.dates) o.st = 'propose';
    G.State.log(fill(D().dateLog, Object.assign({}, w, { title: t.title })));
  };
  FL.propose = async function (m) {
    var s = S(), d = G.MATE[m.id], o = FL.st(), P = D().propose, w = words(d);
    if (married()) { await lines([P.married], m.id, w); o.st = 'kept'; return; }
    var v = await scene('propose', m.id, P.title, async function () {
      await lines(P.lines, m.id, w);
      var r = await G.UI.ask(fill(P.ask, w), [{ label: P.yes, value: 'yes' }, { label: P.later, value: 'later' }], sp(m.id));
      await lines(r === 'yes' ? P.yesSay : P.laterSay, m.id, w);
      return r;
    });
    if (v !== 'yes') { o.at = s.day + K().proposeLater; return; }
    G.State.log(fill(P.log, w));
    FL.wed(m, w);
    o.st = 'wed';
    if (G.FamEv) { try { await G.FamEv.wedding({ id: m.id }); } catch (e) { console.error(e); } }   // 갑판 위의 혼례 (familyevent.js)
    if (G.Achieve && G.Achieve.afterWed) { try { await G.Achieve.afterWed(m.id); } catch (e2) { console.error(e2); } }
    await G.UI.alert(fill(P.alert, w), '혼례');
  };
  /** 혼인 — 술집 「청혼」(js/city/matetalk.js)과 같은 정리: 본처가 되고 배에서 내려 고향 집에서 기다린다 */
  FL.wed = function (m) {
    var s = S(), d = G.MATE[m.id];
    s.player.wife = d.id;
    if (G.Growth) G.Growth.once('wed', 'cha', 1, '혼인 — 한 집안의 가장이 되었다');
    s.mates = s.mates.filter(function (x) { return x !== m; });
    s.flags['gone_' + d.id] = 1; s.flags['wed_' + d.id] = 1;
    if (G.R.tidyCaptains) G.R.tidyCaptains();
    if (G.Wives && G.Wives.sync) G.Wives.sync();
    G.State.log(d.name + U.jx(d.name, '과/와') + ' 결혼했다.');
  };

  // ---------------------------------------------------------------- 무엇이 일어날 차례인가
  /** 지금 띄울 사건 이름 (없으면 null) — 화면 틈마다 */
  FL.due = function () {
    var s = S(); if (!s || !s.player || s.regency) return null;
    var o = FL.st(), m = FL.who(), mode = s.loc && s.loc.mode;
    // 바다에 나간 날 (첫 항해를 센다)
    if (mode === 'sea') { if (o.sea == null) o.sea = s.day; } else if (mode === 'city') o.sea = null;
    if (!m) return null;
    if (o.id && o.id !== m.id) return null;
    if (['wed', 'friend', 'kept'].indexOf(o.st) >= 0) return null;
    if (o.st && o.st !== 'voyage' && married() && o.st !== 'kept') { o.st = 'kept'; return null; }   // 그사이 다른 사람과 결혼했다
    if (!o.st) return mode === 'sea' && o.sea != null && s.day - o.sea >= K().seaDays ? 'voyage' : null;
    if (s.day < (o.at || 0)) return null;
    if (o.st === 'voyage') return mode === 'sea' || mode === 'city' ? 'secret' : null;
    if (o.st === 'love') return mode === 'city' && o.rolled !== s.loc.city + ':' + s.day ? 'date' : null;
    if (o.st === 'propose') return mode === 'city' ? 'propose' : null;
    return null;
  };
  function ready() {
    var s = S(), g = G.Game, UI = G.UI;
    if (!s || !s.player || UI.busy() || FL.running === s) return false;
    if (['city', 'sea'].indexOf(g.sceneName) < 0) return false;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return false;
    if ((G.Life && G.Life.running === s) || (G.MateLeave && G.MateLeave.running === s)) return false;
    var rt = g.scene && g.scene.runtime ? g.scene.runtime() : null;
    if (rt && rt.busy) return false;
    if (g.sceneName === 'city' && G.Scenes.city.busy && G.Scenes.city.busy()) return false;
    return true;
  }
  FL.run = async function (what) {
    var m = FL.who(); if (!m) return false;
    if (what === 'voyage') await FL.voyage(m);
    else if (what === 'secret') await FL.secret(m);
    else if (what === 'date') await FL.date(m);
    else if (what === 'propose') await FL.propose(m);
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
  FL.tick = function () {
    var s = S(); if (!s || !s.player || !s.mates) return;
    var what = FL.due(); if (!what || !ready()) return;
    if (what === 'date') {   // 항구에 들어선 날 한 번만 굴린다
      var o = FL.st(); o.rolled = s.loc.city + ':' + s.day;
      if (!U.chance(K().dateChance)) return;
    }
    FL.running = s;
    (async function () { try { await FL.run(what); } catch (e) { console.error(e); } if (FL.running === s) FL.running = null; })();
  };
})(window.G = window.G || {});
