/* 이야기 해전의 승패를 사건별로 저장한다. 퇴각·패배와 다른 해전의 승리는 구출 보상이 아니다. */
(function (G) {
  'use strict';
  var SB = G.StoryBattle = {};
  var MODES = { jhook: ['JHOOK', 'jh_'], gold: ['GOLD', 'gs_'], song: ['SONG', 'song_'], arslan: ['ARSLAN', 'ar_'] };
  function state(mode) { var s = G.Game && G.Game.state; return s && s[mode]; }
  function beats(mode) { var d = G[MODES[mode][0]]; return d && d.beats || []; }
  function battleBeat(mode, option) {
    return beats(mode).filter(function (b) { return b.then && b.then.battle && (b.then.battle === option || b.then.battle.label === option.label); })[0];
  }
  function idOf(mode, b) { return MODES[mode][1] + b.then.battle.label; }
  function predecessor(mode, b) {
    return beats(mode).filter(function (x) { return (b.after || []).indexOf(x.id) >= 0 && x.then && x.then.battle; })[0];
  }
  SB.start = function (mode, option, npc) {
    var t = state(mode), b = battleBeat(mode, option); if (!t || !b) return;
    npc.storyBattle = { mode: mode, beat: b.id };
    t.battlePending = { beat: b.id, id: npc.id };
  };
  SB.won = function (mode, b) {
    var t = state(mode), pre = predecessor(mode, b);
    return !!(t && pre && t.battleWins && t.battleWins[pre.id] != null);
  };
  SB.finish = function (npc, result) {
    if (!npc) return;
    Object.keys(MODES).forEach(function (mode) {
      var t = state(mode); if (!t) return;
      // 옛판의 해전 도중 저장도 NPC의 고정 ID로 이어받는다.
      var b = beats(mode).filter(function (x) { return x.then && x.then.battle && idOf(mode, x) === npc.id; })[0];
      if (!b || t.beats[b.id] == null) return;
      if (npc.storyBattle && (npc.storyBattle.mode !== mode || npc.storyBattle.beat !== b.id)) return;
      if (result === 'win') (t.battleWins || (t.battleWins = {}))[b.id] = G.U.dateNum(G.Game.state.date);
      else {
        delete t.beats[b.id]; // 같은 해역에서 원래 사건에 다시 도전할 수 있다.
        var d = G[MODES[mode][0]];
        G.State.log('「' + (d.short || d.title) + '」 — 해전에서 물러났다. 준비를 갖추고 같은 해역에서 다시 도전할 수 있다.');
      }
      delete t.battlePending;
    });
  };
  /** 승패 기록이 없던 옛 저장은 미완료 전투를 다시 연다. 이미 받은 후속 보상은 건드리지 않는다. */
  SB.recover = function (mode) {
    var t = state(mode), s = G.Game && G.Game.state; if (!t) return;
    if (G.Game.sceneName === 'battle' || s.battle || (G.UI.busy && G.UI.busy())) return;
    beats(mode).forEach(function (b) {
      if (!b.battles || t.beats[b.id] != null || SB.won(mode, b)) return;
      var pre = predecessor(mode, b);
      if (pre && t.beats[pre.id] != null) { delete t.beats[pre.id]; delete t.battlePending; }
    });
  };
  // 번역할 문장을 먼저 찾고 값을 끼운다. 쪽 구분을 사이에 둔 두 문장도 각각 번역한다.
  G.StoryText = { format: function (text, vars) {
    return String(text).split('\f').map(function (part) { return G.T(part, vars); }).join('\f');
  } };
})(window.G = window.G || {});
