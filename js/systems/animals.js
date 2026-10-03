/* 동물 발견물의 단서 (자료: js/data/animals.js, G.ANIMALS)
   - 그 동물이 사는 고장(near°, 기본 14° 안)의 도시에 오면 술집 「술을 마신다」나 거리의 마을 사람에게서 이야기를 듣는다.
     직접 그 고장에 와 있으므로 개척 단계와 상관없이 들을 수 있다(단서 출처 'local:도시'·'town:도시').
   - 책으로만 단서가 나오는 동물(bookOnly — 전설·희귀·공룡)은 여기서 다루지 않는다.
   - 도시에서 보는 동물(개·고양이·말 — how 'city')은 단서를 들은 뒤에야 눈에 띈다(needHint). 그 도시의 술집에서 들었으면 그 자리에서 바로 본다. */
(function (G) {
  'use strict';
  var U = G.U, AN = {};
  G.Animals = AN;
  function S() { return G.Game.state; }
  AN.NEAR = 14;          // 기본: 이 거리(°) 안의 도시에서 그 동물 이야기를 듣는다
  AN.TAVERN = 0.6;       // 술집에서 정보를 살 때 이 고장 동물 이야기가 먼저 나올 확률
  AN.TOWN = 0.35;        // 도시에 들어설 때 마을 사람이 이 고장 동물 이야기를 꺼낼 확률

  /** 이 도시에서 들을 수 있는 이 고장 동물 (아직 모르고, 찾지 않았고, 책으로만 나오는 것이 아닌 것) — 가까운 순 */
  AN.local = function (c) {
    var s = S(); if (!c || !G.ANIMALS) return [];
    var out = [];
    G.ANIMALS.forEach(function (id) {
      var d = G.DISC[id]; if (!d || d.bookOnly || s.hints[id] || G.Disc.foundByMe(id) || !G.Disc.built(d)) return;
      var near = d.near || AN.NEAR, dist = d.how === 'city' && d.city === c.id ? 0 : G.Geo.dist(c.lon, c.lat, d.lon, d.lat);
      if (dist <= near) out.push({ d: d, dist: dist });
    });
    return out.sort(function (a, b) { return a.dist - b.dist; }).map(function (o) { return o.d; });
  };
  /** 하나 고르기: 가까울수록 자주 */
  AN.pick = function (c) {
    var l = AN.local(c); if (!l.length) return null;
    return U.weighted(l, function (d) { return 1 / (1 + G.Geo.dist(c.lon, c.lat, d.lon, d.lat) * 0.25); });
  };
  /** 단서를 들은 뒤: 이 도시에서 보는 동물이면 그 자리에서 찾는다 */
  AN.after = async function (d, c) {
    if (d.how === 'city' && d.city === c.id && !G.Disc.foundByMe(d.id)) {
      if (!(G.Scenes.hasReveal && G.Scenes.hasReveal(d))) await G.Scenes.city.mate('제독, 방금 들은 「' + d.name + '」' + U.jx(d.name, '이/가') + ' 바로 저기 있습니다!');
      await G.Disc.find(d, 'city');
    }
  };
  /** 술집 주인에게서 (T.info): 이 고장 동물 이야기를 했으면 true */
  AN.tavern = async function (c, who) {
    if (!U.chance(AN.TAVERN)) return false;
    var d = AN.pick(c); if (!d || !G.Disc.addHint(d.id, 'local:' + c.id)) return false;
    await G.Scenes.city.say(who, U.pick(['이 근방에서는 다들 아는 이야기인데, ', '이 고장에 왔으면 이건 알아 두게. ', '여기 사람이라면 누구나 아는 짐승 이야기지. ']) + d.hint);
    G.UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll');
    await AN.after(d, c);
    return true;
  };
  /** 도시에 들어설 때 (C.arrival): 거리의 마을 사람이 이 고장 동물 이야기를 꺼낸다 */
  AN.town = async function (c) {
    if (!U.chance(AN.TOWN)) return;
    var d = AN.pick(c); if (!d || !G.Disc.addHint(d.id, 'town:' + c.id)) return;
    var C = G.Scenes.city, who = C.npc('vendor', '마을 사람');
    who.name = '마을 사람';
    await C.say(who, U.pick(['처음 오신 분인가 보군요. ', '바다 건너 오셨다고요? 그럼 이건 모르시겠네. ', '여기 오셨으면 구경 한번 해 보시구려. ']) + d.hint);
    G.UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll');
    await AN.after(d, c);
  };
})(window.G = window.G || {});
