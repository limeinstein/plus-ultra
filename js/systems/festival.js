/* 귀환 잔치 (G.Fest) — 큰 발견(세력 3 이상·세계일주·전설)을 후원자에게 보고하거나 항구에서 발표하면 그 도시가 며칠 동안 잔치를 벌인다.
   - 시작할 때: 종·축포 소리와 함께 잔치가 열리는 장면, 부관의 한마디, 선원들 피로가 풀리고 부하들 충성이 조금 오른다
   - 잔치 동안: 그 도시의 거리 사람들이 잔치 이야기를 하고(js/systems/streetfolk.js), 거리 음악이 잔치 가락으로 바뀐다(js/systems/audio.js · ytmusic.js)
   - 도시 이름판에 「○○ 귀환 잔치가 한창이다」
   상태: state.fest = { city, disc, name, since, until }  · 대사는 js/data/festival.js */
(function (G) {
  'use strict';
  var F = {}, U = G.U, UI = G.UI;
  G.Fest = F;
  function S() { return G.Game.state; }
  function D() { return G.FESTIVAL || { lines: {}, open: [], openBig: [], mate: [] }; }

  /** 잔치를 열 만한 발견인가 */
  F.big = function (d) { return !!(d && (d.id === 'circum' || d.pw >= 3 || (d.real && d.real.legend))); };
  F.grand = function (d) { return !!(d && (d.id === 'circum' || d.pw >= 4 || (d.real && d.real.legend))); };
  /** 이 도시에서 지금 잔치가 열리고 있는가 */
  F.active = function (c) { var s = S(), f = s && s.fest; return !!(f && c && f.city === c.id && s.day < f.until); };
  F.now = function () { var s = S(), f = s && s.fest; return f && s.day < f.until ? f : null; };

  function fill(t, c, f) {
    var s = S();
    t = String(t).replace(/\{city\}/g, c ? c.name : '').replace(/\{admiral\}/g, s.player.name)
      .replace(/\{church\}/g, c && G.R.churchName ? G.R.churchName(c) : '교회');
    var nm = f ? f.name : '';
    return t.replace(/\{(\^?)d(?:\|([^}]+))?\}/g, function (m, only, pair) { return pair ? (only ? U.jx(nm, pair) : nm + U.jx(nm, pair)) : nm; });
  }
  /** 거리 사람의 잔치 이야기 (없으면 null) */
  F.line = function (type, c) {
    var f = F.now(); if (!f || !c || f.city !== c.id) return null;
    var L = D().lines[type]; if (!L || !L.length) return null;
    return fill(U.pickFresh('fest:' + type, L), c, f);
  };
  /** 잔치를 연다. 같은 도시에서 이미 열려 있으면 날만 늘린다 */
  F.begin = async function (cityId, d) {
    var s = S(), c = G.CITY_DATA[cityId];
    if (!c || !F.big(d)) return false;
    var days = F.grand(d) ? (D().bigDays || 10) : (D().days || 7);
    if (F.active(c)) { s.fest.until = Math.max(s.fest.until, s.day + days); if (s.fest.disc !== d.id) { s.fest.disc = d.id; s.fest.name = d.name; } return false; }
    s.fest = { city: c.id, disc: d.id, name: d.name, since: s.day, until: s.day + days };
    var fl = s.fleet; if (fl) fl.fatigue = U.clamp((fl.fatigue || 0) - (D().fatigue || 15), 0, 100);
    (s.mates || []).forEach(function (m) { m.loyal = Math.min(100, (m.loyal || 70) + (D().loyal || 3)); });
    if (G.Audio) { G.Audio.sfx('bell'); setTimeout(function () { G.Audio.sfx('cheer'); }, 500); }
    await UI.say(fill(U.pickFresh('fest:open', F.grand(d) ? D().openBig : D().open), c, s.fest), {});
    if (s.mates && s.mates.length && G.Scenes.mateSpeaker) await UI.say(U.pickFresh('fest:mate', D().mate), G.Scenes.mateSpeaker('first'));
    UI.toast('「' + d.name + '」 귀환 잔치 · 선원들 피로가 풀리고 부하들 사기가 올랐다', 'star', 5000);
    G.State.log(c.name + '에서 「' + d.name + '」 귀환 잔치가 열렸다.');
    // 거리에 나서면 잔치 가락이 들린다 (건물 안이면 나올 때 바뀐다)
    if (G.Audio && G.Audio.want === 'town' && !G.Audio.place) G.Audio.music('town', true);
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
  /** 도시 이름판에 붙일 말 */
  F.banner = function (c) { return F.active(c) ? '「' + S().fest.name + '」 귀환 잔치가 한창이다' : ''; };
})(window.G = window.G || {});
