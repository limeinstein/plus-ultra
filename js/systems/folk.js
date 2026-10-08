/* 부족 도시 둘레의 민족 발견물 단서 (자료: js/data/folkdisc.js, G.FOLK_CITY)
   - 아메리카 원주민 마을(230~245)과 아프리카 부족 마을(298~308) 둘레에는 그 부족의 민족 발견물이 있다(도시 밖 뭍).
   - 그 도시에 들어서면 마을 사람이, 술집에서 술을 마시면 주인이 그 사람들의 노래·춤 이야기를 꺼낸다.
     그 고장에 직접 와서 들은 것이므로 개척 단계와 상관없이 단서가 된다(출처 'town:도시'·'local:도시' — js/systems/discovery.js D.addHint). */
(function (G) {
  'use strict';
  var U = G.U, FK = {};
  G.Folk = FK;
  function S() { return G.Game.state; }
  FK.TOWN = 0.7;          // 도시에 들어설 때 마을 사람이 이야기할 확률 (처음 들른 날은 꼭)
  FK.TAVERN = 0.8;        // 술집에서 술을 마실 때 주인이 이야기할 확률

  /** 이 도시 둘레의 민족 발견물 가운데 아직 모르고 찾지 않은 것 */
  FK.local = function (c) {
    var s = S(); if (!c || !G.FOLK_CITY) return [];
    return (G.FOLK_CITY[c.id] || []).map(function (id) { return G.DISC[id]; }).filter(function (d) {
      return d && !s.hints[d.id] && !G.Disc.foundByMe(d.id) && G.Disc.built(d);
    });
  };
  /** 소문 + 그 사람들의 노래나 춤 한 줄 */
  function line(d) {
    var f = d.folk || {}, bits = [];
    if (f.music) bits.push('노래: ' + f.music);
    if (f.dance) bits.push('춤: ' + f.dance);
    return d.hint + (bits.length ? '\n(' + bits[0] + ')' : '');
  }
  /** 도시에 들어설 때 (C.arrival) */
  FK.town = async function (c, first) {
    var l = FK.local(c); if (!l.length) return false;
    if (!first && !U.chance(FK.TOWN)) return false;
    var d = l[0]; if (!G.Disc.addHint(d.id, 'town:' + c.id)) return false;
    var C = G.Scenes.city, who = C.npc('vendor', '마을 사람');
    who.name = '마을 사람';
    await C.say(who, U.pick(['손님이 오셨으니 오늘 밤엔 북이 울리겠군요. ', '우리 노래를 들어 보셨소? ', '바다 건너 오신 분이면 이건 꼭 보고 가시오. ']) + line(d));
    G.UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll');
    return true;
  };
  /** 술집 주인에게서 (T.drink): 이야기했으면 true */
  FK.tavern = async function (c, who) {
    var l = FK.local(c); if (!l.length || !U.chance(FK.TAVERN)) return false;
    var d = l[0]; if (!G.Disc.addHint(d.id, 'local:' + c.id)) return false;
    await G.Scenes.city.say(who, U.pick(['이 술을 빚은 사람들 이야기를 해 주지. ', '여기 사람이라면 누구나 아는 이야기인데, ', '잔치 철에 맞춰 오셨구려. ']) + line(d));
    G.UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll');
    return true;
  };
})(window.G = window.G || {});
