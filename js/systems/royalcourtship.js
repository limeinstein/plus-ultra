/* 무도회 손님·왕명으로 구한 왕녀와의 인연. 약속과 연인 관계는 만난 제독에게 귀속된다. */
(function (G) {
  'use strict';
  var RC = G.RoyalCourtship = {}, U = G.U;
  var ladies = G.COURT.princesses.filter(function (p) { return p.courtship; });
  var talkingToPlayer = null;
  function config() { return G.BALANCE.royalCourtship; }
  function court(p) {
    var sponsors = G.COURT.realms[p.realm].sponsors.map(function (id) { return G.SPONSOR[id]; });
    return sponsors.find(function (sp) { return sp && G.Sponsor.present(sp); });
  }
  function missing(p) {
    var t = G.Game.state.court && G.Game.state.court.task;
    return t && t.kind === 'rescue' && t.who === p.name;
  }
  function record(p) { return (G.Game.state.player.royalTies || {})[p.id]; }
  function daysLeft(r) { return r ? Math.max(0, r.day + config().visitDays - G.Game.state.day) : 0; }
  function status(r) { return r.stage === 'lover' ? '연인' : r.stage === 'friend' ? '친구' : '다시 만날 약속'; }
  function place(p) {
    var sp = court(p) || G.SPONSOR[G.COURT.realms[p.realm].sponsors[0]];
    return G.CITY_DATA[sp.city].name + ' ' + (sp.place || '왕궁');
  }
  RC.rescued = function (realm, name) {
    return ladies.find(function (p) { return p.realm === realm.id && p.name === name; });
  };
  async function meet(p, at) {
    var s = G.Game.state, player = s.player, ui = G.UI, l = p.courtship, r = record(p);
    if (talkingToPlayer === player || (at !== 'rescue' && (missing(p) || daysLeft(r)))) return;
    talkingToPlayer = player;
    var who = G.EventShot.princessSpeaker(p.realm, p.name);
    try {
      if (at === 'rescue' || (!r && at === 'ball')) await ui.say(at === 'rescue' ? l.rescue : l.ball, who);
      if (G.Game.state !== s || s.player !== player) return;
      if (!r) {
        var answer = await ui.ask('어떻게 답할까요?', [
          { label: l.invite, value: 'meet' }, { label: '인사만 나눈다', value: 'leave' }
        ], who);
        if (answer !== 'meet' || G.Game.state !== s || s.player !== player) return;
        var ties = player.royalTies || (player.royalTies = {});
        ties[p.id] = { stage: 'invited', day: s.day };
        var next = config().visitDays + '일 뒤부터 ' + place(p) + '에서 다시 만날 수 있다.';
        G.State.log((at === 'ball' ? '무도회에서 ' : '구출한 뒤 ') + p.name + U.jx(p.name, '과/와') + ' 다시 만나기로 했다. ' + next);
        await ui.say(l.promise, who);
        ui.toast(next, 'heart', 6000);
        return;
      }
      if (daysLeft(r)) return;
      if (r.stage === 'invited') {
        var reply = await ui.ask(l.confess, [
          { label: '나도 같은 마음이라고 고백한다', value: 'lover' },
          { label: '좋은 친구로 지내고 싶다고 말한다', value: 'friend' },
          { label: '다음 만남에 답하겠다고 한다', value: 'later' }
        ], who);
        if (!reply || G.Game.state !== s || s.player !== player) return;
        r.day = s.day;
        if (reply === 'later') { await ui.say('기다릴게요. 다음에 만나면 들려주세요.', who); return; }
        r.stage = reply;
        G.State.log(p.name + U.jx(p.name, '과/와') + (reply === 'lover' ? ' 서로 마음을 고백하고 연인이 되었다.' : ' 친구로 지내기로 했다.'));
        await ui.say(reply === 'lover' ? l.date : '솔직히 말해 줘서 고마워요. 다음에도 편히 찾아와 주세요.', who);
      } else {
        r.day = s.day;
        await ui.say(r.stage === 'lover' ? l.date : '반가워요, 제독. 지난번에 다녀온 항구 이야기를 들려주세요.', who);
      }
    } finally { if (talkingToPlayer === player) talkingToPlayer = null; }
  }
  RC.reunion = function (p) { return meet(p, 'rescue'); };
  RC.ball = async function () {
    if (!U.chance(config().ballChance)) return;
    var pool = ladies.filter(function (p) { return court(p) && !missing(p) && !daysLeft(record(p)); });
    if (!pool.length) return;
    var p = U.pick(pool), s = G.Game.state, player = s.player;
    await G.UI.say('다음 곡이 시작될 무렵, ' + p.name + U.jx(p.name, '이/가') + ' 제독에게 다가왔다.');
    if (G.Game.state !== s || s.player !== player) return;
    await meet(p, 'ball');
    return p;
  };
  RC.palaceItem = function (sp, realm) {
    var p = ladies.find(function (x) { return x.realm === realm.id; }), r = p && record(p);
    if (!r || missing(p) || court(p) !== sp) return null;
    var left = daysLeft(r);
    return { label: p.name + ' 만나기', icon: 'heart', sub: left ? left + '일 뒤에 다시' : status(r),
      dim: left > 0, onClick: function () { return meet(p, 'palace'); } };
  };
  RC.info = function () {
    var rows = ladies.filter(function (p) { return record(p); }).map(function (p) {
      return U.esc(p.name + ' · ' + status(record(p)) + ' (' + place(p) + ')');
    });
    return rows.length ? '<div>왕녀와의 인연</div><div style="grid-column:span 3">' + rows.join('<br>') + '</div>' : '';
  };
})(window.G = window.G || {});
