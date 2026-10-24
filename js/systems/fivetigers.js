/* 갑판 위의 오호장군 (G.Tigers) — 대사·조정값: js/data/fivetigers.js (G.FIVE_TIGERS · G.BALANCE.fiveTigers). 2026-10-24 사용자 요청
   ■ 누가: 관우·장비·아토스·포르토스·아라미스가 모두 배에 있을 때 (함께 탄 지 together일 넘게). 돈키호테·달타냥이 있으면 끼어든다.
   ■ 언제: 바다의 하루(seaChance) 또는 입항(portChance) — 부하들 사이의 썸(js/systems/romance.js) 사건이 없을 때. 한 판에 한 번.
   ■ 끝나면: 모인 사람 능력치가 조금 오른다(gain) · 충성 + · 규율 +.
     능력치는 항해사 정의(G.MATE[id].st)에 더해 두고(본래 값은 st0), 저장은 s.tigers.bonus — 불러오거나 새 게임이면 다시 입힌다 (G.Tigers.apply).
   ■ 저장: s.tigers = { since: 다섯이 처음 함께한 날, done: 날짜, bonus: {id: [힘, 지력, 무력, 매력]} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var TG = G.Tigers = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.fiveTigers) || {}; }
  function D() { return G.FIVE_TIGERS; }
  function st() { var s = S(); return s ? (s.tigers || (s.tigers = {})) : {}; }
  function row(id) { var s = S(); return s && (s.mates || []).filter(function (m) { return m.id === id; })[0] || null; }
  function aboard(id) { var m = row(id); return !!(m && !(G.R.mateHidden && G.R.mateHidden(m))); }
  TG.aboard = aboard;
  /** 다섯이 모두 배에 있는가 */
  TG.ready = function () { return !!(D() && D().core.every(aboard)); };
  /** 날마다(바다·항구): 다섯이 처음 함께한 날을 적고, 흩어지면 지운다 */
  TG.track = function () {
    var s = S(), T = st(); if (!s || T.done) return;
    if (TG.ready()) { if (T.since == null) T.since = s.day; } else delete T.since;
  };
  /** 지금 벌어질 수 있는가 */
  TG.due = function () {
    var s = S(), T = st(); if (!s || T.done || !TG.ready()) return false;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return false;
    TG.track();
    return s.day - T.since >= (K().together == null ? 30 : K().together);
  };

  // ---------------------------------------------------------------- 능력치
  /** 저장된 오름을 항해사 정의에 입힌다 (불러오기·새 게임 — G.Siblings.apply 뒤에 불린다) */
  TG.apply = function () {
    var s = S(), bonus = s && s.tigers && s.tigers.bonus || {};
    Object.keys(K().gain || {}).forEach(function (id) {
      var d = G.MATE && G.MATE[id]; if (!d || !d.st) return;
      if (!d.st0) d.st0 = d.st.slice();
      var b = bonus[id] || [0, 0, 0, 0];
      d.st = d.st0.map(function (v, i) { return Math.min(100, v + (b[i] || 0)); });
    });
  };
  /** 오름을 더한다 → 실제로 오른 값 */
  function grow(id) {
    var T = st(), g = (K().gain || {})[id]; if (!g) return null;
    var b = (T.bonus = T.bonus || {})[id] || [0, 0, 0, 0];
    T.bonus[id] = b.map(function (v, i) { return v + (g[i] || 0); });
    TG.apply();
    return g;
  }
  var STN = ['힘', '지력', '무력', '매력'];
  function gainText(g) { return g.map(function (v, i) { return v ? STN[i] + ' +' + v : ''; }).filter(Boolean).join(' · '); }

  // ---------------------------------------------------------------- 이야기
  function sp(id, other) {
    var d = G.MATE[id]; if (!d) return {};
    var me = { name: d.name, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true };
    var o = other && G.MATE[other];
    if (o) {
      me.layout = 'duo'; me.side = 'left';
      me.partner = { name: o.name, portrait: G.Scenes.mateSpec(other), half: G.Img.chain.mateHalf(other), lang: 3, special: true };
    }
    return me;
  }
  async function lines(list) {
    for (var i = 0; i < list.length; i++) {
      var l = list[i];
      if (l[0] === 'n') await UI.say(l[1], {});
      else if (G.MATE[l[0]]) await UI.say(l[1], sp(l[0], l[2] && aboard(l[2]) ? l[2] : null));
    }
  }
  function card(rows) {
    var html = '<div class="center" style="font-size:15px;letter-spacing:.2em;color:#8a6a3a">이 배의 오호장군</div>' +
      '<table class="tbl" style="margin-top:10px;font-size:18px"><tr><th>본디 촉한의 장수</th><th>이 배에서는</th></tr>' +
      rows.map(function (r) { return '<tr><td>' + U.esc(r[0]) + '</td><td><b>' + U.esc(G.MATE[r[1]].name) + '</b></td></tr>'; }).join('') + '</table>';
    return UI.alert(html, '갑판 위의 오호장군');
  }
  /** 이야기를 치른다 */
  TG.play = async function () {
    var s = S(), T = st(), L = D(); if (!s || T.done) return false;
    T.done = U.dateNum(s.date);
    var dq = aboard('don_quixote'), da = aboard('d_artagnan');
    await lines(L.intro);
    await lines(L.zilong);
    await lines(L.machao);
    await lines(L.huangzhong);
    if (dq) await lines(L.quixote);
    if (da) await lines(L.dartagnan);
    await lines([L.sum]);
    await card(dq ? L.tableQ : L.table);
    await lines(L.outro);
    // 끝: 능력치·충성·규율
    var who = L.core.slice(); if (dq) who.push('don_quixote'); if (da) who.push('d_artagnan');
    var got = who.map(function (id) { var g = grow(id); var m = row(id); if (m) m.loyal = U.clamp((m.loyal == null ? 70 : m.loyal) + (K().loyal || 5), 0, 100); return g ? G.MATE[id].name + ' ' + gainText(g) : null; }).filter(Boolean);
    var f = s.fleet; f.discipline = U.clamp((f.discipline || 0) + (K().discipline || 3), 0, 100);
    G.State.log('갑판에서 관우·장비와 삼총사가 「이 배의 오호장군」을 정했다' + (dq ? ' — 돈키호테도 끼었다' : '') + '. (' + got.join(', ') + ')');
    await UI.alert('동쪽과 서쪽의 장수들이 서로의 이야기에서 배운 것이 있다.<br><br>' + got.map(function (t) { return U.esc(t); }).join('<br>') +
      '<br><br><span class="muted">모두 충성 +' + (K().loyal || 5) + ' · 함대 규율 +' + (K().discipline || 3) + '</span>', '능력치가 올랐다');
    if (G.Audio) G.Audio.sfx('cheer');
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
  /** 바다의 하루 — 썸 사건이 없을 때 (romance.seaDay 뒤) */
  TG.seaDay = async function () { if (TG.due() && U.chance(K().seaChance == null ? 0.12 : K().seaChance)) return TG.play(); return false; };
  /** 입항 */
  TG.arrival = async function () { if (TG.due() && U.chance(K().portChance == null ? 0.3 : K().portChance)) await TG.play(); };

  // ---------------------------------------------------------------- 걸어 두기
  function hook() {
    var RM = G.Romance;
    if (RM && !RM._tigers) {
      var sea0 = RM.seaDay, arr0 = RM.arrival;
      RM.seaDay = async function () { TG.track(); var r = await sea0.apply(this, arguments); if (r) return r; try { return await TG.seaDay(); } catch (e) { console.error(e); return false; } };
      RM.arrival = async function () { TG.track(); await arr0.apply(this, arguments); try { await TG.arrival(); } catch (e) { console.error(e); } };
      RM._tigers = true;
    }
    var SB = G.Siblings;   // 불러오기·새 게임 때 부르는 자리 (js/core/state.js · js/scenes/common.js)
    if (SB && SB.apply && !SB._tigers) { var ap0 = SB.apply; SB.apply = function () { var r = ap0.apply(this, arguments); TG.apply(); return r; }; SB._tigers = true; }
    TG.hooked = true;
  }
  hook();
})(window.G = window.G || {});
