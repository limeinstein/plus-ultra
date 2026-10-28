/* 마녀 모임 (G.Coven): 저장 s.coven={seen:{사건:마지막 날},last}.
   충성 유지·무급은 현재 함께 탄 인원으로 즉시 계산한다. 옛 저장도 처음 쓸 때 기록을 만든다. */
(function (G) {
  'use strict';
  var C = G.Coven = {}, U = G.U;
  function S() { return G.Game && G.Game.state; }
  function K() { return G.BALANCE.coven; }
  function aboard(m) { return !(G.R.mateHidden && G.R.mateHidden(m)); }
  function mem() { var s = S(); return s.coven || (s.coven = { seen: {} }); }
  C.members = function () {
    var s = S(), seen = {};
    return ((s && s.mates) || []).filter(function (m) {
      var d = G.MATE[m.id];
      if (!d || !d.witch || seen[m.id] || !aboard(m)) return false;
      seen[m.id] = true; return true;
    });
  };
  C.protected = function (m) { return !!(m && G.MATE[m.id] && G.MATE[m.id].witch && aboard(m) && C.members().length >= K().oathCount); };
  C.freeWage = function (id) { return !!(G.MATE[id] && G.MATE[id].witch && C.members().length >= K().freeCount); };
  function males() { return (S().mates || []).filter(function (m) { var d = G.MATE[m.id]; return d && d.g === 'm' && aboard(m); }); }
  C.due = function () {
    var s = S(); if (!s || s.regency) return null;
    var n = C.members().length; if (n < G.COVEN_EVENTS[0].count) return null;
    var t = mem(), seen = t.seen || (t.seen = {});
    if (t.last != null && s.day - t.last < K().gap) return null;
    var eligible = G.COVEN_EVENTS.filter(function (e) {
      if (n < e.count || (e.id === 'new_fashion_party' && s.player.gold < 1) || (e.id === 'charm' && !males().length)) return false;
      if (seen[e.id] == null) return true;
      if (e.once || s.day - seen[e.id] < e.days) return false;
      if (e.id === 'curse' && s.player.luck >= K().luckMax) return false;
      if (e.id === 'charm' && !males().some(function (m) { return (m.loyal == null ? 70 : m.loyal) < 100; })) return false;   // 모두 충성 100이면 홀릴 까닭이 없다
      if (e.id === 'potion' && s.fleet.fatigue <= 0 && s.fleet.discipline >= 100) return false;
      return true;
    });
    // 아직 보지 못한 높은 단계가 반복 사건에 밀리지 않게 한다.
    return eligible.filter(function (e) { return seen[e.id] == null; })[0] || eligible[0] || null;
  };
  C.effect = function (e) {
    var s = S(), b = K(), f = s.fleet, before;
    if (e.id === 'curse') { before = s.player.luck == null ? 50 : s.player.luck; s.player.luck = Math.min(b.luckMax, before + b.luck); return '행운 +' + (s.player.luck - before) + ' → ' + s.player.luck + ' (바다의 사고를 피할 가능성 +' + Math.round(G.R.playerLuck() * 100) + '%)'; }
    if (e.id === 'potion') {
      before = f.fatigue; var disc = f.discipline;
      f.fatigue = Math.max(0, before - b.fatigue); f.discipline = Math.min(100, disc + b.discipline);
      return '선원 피로 −' + (before - f.fatigue) + ' · 규율 +' + (f.discipline - disc);
    }
    if (e.id === 'new_fashion_party') { var cost = Math.min(s.player.gold, b.theftMax, Math.max(1, Math.floor(s.player.gold * b.theftRate))); s.player.gold -= cost; return '마녀들이 신상 파티에 금화 ' + U.num(cost) + '닢을 써 버렸다.'; }
    if (e.id === 'charm') { var seen = {}; males().forEach(function (m) { if (seen[m.id]) return; seen[m.id] = true; G.R.setLoyal(m, (m.loyal == null ? 70 : m.loyal) + b.maleLoyal); }); return '남성 동료 충성 +' + b.maleLoyal + ' (최대 100)'; }
    if (e.id === 'coven_oath') return '마녀 ' + b.oathCount + '명 이상이 함께하는 동안 마녀들의 충성이 떨어지지 않는다.';
    return '마녀 ' + b.freeCount + '명 이상이 함께하는 동안 마녀들의 월 급료가 면제된다.';
  };
  C.play = async function () {
    var s = S(), e = C.due(); if (!e || C.running) return false;
    C.running = s;
    var shot;
    try {
      var t = mem(); t.seen[e.id] = s.day; t.last = s.day;
      var result = C.effect(e), lead = C.members()[0];
      G.State.log(e.title + ' — ' + result);
      if (G.Game.refreshHud) G.Game.refreshHud();
      if (G.FamEv) shot = G.FamEv.showPic({ img: 'events/witches/' + e.id, title: e.title, noStand: true });
      await G.UI.say(e.lines[0], {});
      if (S() !== s) return true;
      var d = G.MATE[lead.id];
      await G.UI.say(e.lines[1], { name: d.name, portrait: G.Scenes.mateSpec(lead.id), lang: 3 });
      if (S() === s) await G.UI.alert(U.esc(result), e.title);
      return true;
    } finally { if (shot) await shot.stop(); if (C.running === s) C.running = null; }
  };
  C.tick = function () {
    var s = S(), g = G.Game;
    if (!s || C.running || !C.due() || G.UI.busy() || (G.Life && G.Life.running === s)) return;
    if (['city', 'sea', 'land'].indexOf(g.sceneName) < 0 || (G.Tutorial && G.Tutorial.active())) return;
    var rt = g.scene && g.scene.runtime ? g.scene.runtime() : null;
    if ((rt && rt.busy) || (g.sceneName === 'city' && G.Scenes.city.busy && G.Scenes.city.busy())) return;
    C.play().catch(function (e) { console.error(e); });
  };
})(window.G = window.G || {});
