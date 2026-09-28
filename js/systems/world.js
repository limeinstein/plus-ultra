/* World-level time processing: history, rivals, wages, aging, contracts, family. */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var W = {};
  G.World = W;
  function S() { return G.Game.state; }

  W.daily = function () {
    var s = S(), out = [];
    // history
    while (s.history < G.HISTORY.length) {
      var h = G.HISTORY[s.history];
      if (s.date.y > h.y || (s.date.y === h.y && s.date.m >= h.m)) {
        s.history++;
        if (h.city) s.owners[h.city[0]] = h.city[1];
        out.push({ icon: 'scroll', text: h.text, history: true });
        G.State.log(h.text);
      } else break;
    }
    out = out.concat(G.Disc.rivals());
    if (G.Names) out = out.concat(G.Names.daily());       // 아메리고 베스푸치의 보고와 대륙 이름
    if (G.Frontier) out = out.concat(G.Frontier.tick());   // 새로 열린 개척 단계, 새로 나타난 항해사
    // contract deadline warnings
    if (s.contract && !s.contract.warned && U.dateNum(s.date) > s.contract.due) {
      s.contract.warned = true;
      out.push({ icon: 'hourglass', text: '후원자와 약속한 계약 기한이 지났습니다.' });
    }
    // birthday
    if (s.date.m === s.player.born.m && s.date.d === s.player.born.d) {
      out.push({ icon: 'star', text: R.fullName() + '의 생일입니다. (' + R.age() + '세)', birthday: true });
    }
    // 계절풍이 바뀐 날 (계절풍 바다나 그 연안 항구에 있을 때)
    if (G.Monsoon) out = out.concat(G.Monsoon.daily());
    // in port: slow recovery
    if (s.loc.mode === 'city') {
      s.fleet.fatigue = Math.max(0, s.fleet.fatigue - 0.6);
      s.fleet.discipline = Math.min(100, s.fleet.discipline + 0.5);
      s.fleet.daysOut = 0; s.fleet.scurvy = Math.max(0, (s.fleet.scurvy || 0) * 0.75 - 2);   // 뭍의 신선한 먹을거리로 빨리 낫는다
    }
    // children growing / family events
    if (s.player.wife && U.chance(1 / 540) && s.player.kids.length < 2) {
      var sex = s.player.kids.some(function (k) { return k.sex === 'm'; }) ? 'f' : (s.player.kids.some(function (k) { return k.sex === 'f'; }) ? 'm' : U.pick(['m', 'f']));
      s.player.kids.push({ name: sex === 'm' ? U.pick(['후안', '페드로', '루이스', '디오고', '안토니오']) : U.pick(['마리아', '이사벨', '레오노르', '베아트리스']), sex: sex, born: { y: s.date.y, m: s.date.m, d: s.date.d }, sk: {}, lg: {} });
      out.push({ icon: 'heart', text: '고향에서 아이가 태어났다는 소식이 왔다!' });
      G.State.log('아이가 태어났다.');
    }
    return out;
  };

  W.newMonth = function () {
    var s = S(), out = [];
    // wages for companions
    var wage = 0;
    s.mates.forEach(function (m) { var d = G.MATE[m.id]; if (d) wage += d.wage; });
    if (wage > 0) {
      if (s.player.gold >= wage) { s.player.gold -= wage; }
      else {
        // unpaid: loyalty drops
        s.mates.forEach(function (m) { m.loyal = (m.loyal || 70) - 20; });
        out.push({ icon: 'coin', text: '동료들의 급료(' + U.num(wage) + '닢)를 지불하지 못했다! 불만이 쌓이고 있다.' });
        var leaving = s.mates.filter(function (m) { return m.loyal < 0 && m.id !== 'rocco'; });
        leaving.forEach(function (m) { out.push({ icon: 'people', text: G.MATE[m.id].name + U.j(G.MATE[m.id].name, '이/가').slice(G.MATE[m.id].name.length) + ' 함대를 떠났다.' }); });
        s.mates = s.mates.filter(function (m) { return leaving.indexOf(m) < 0; });
      }
    }
    // 항해사들이 이웃 도시로 옮기거나 머문다
    if (G.MateMove) G.MateMove.month();
    // bank interest
    if (s.player.bank > 0) s.player.bank = Math.floor(s.player.bank * 1.003);
    // maid affection slowly fades
    for (var k in s.maids) { if (s.maids[k].aff > 0 && s.player.wife !== k) s.maids[k].aff = Math.max(0, s.maids[k].aff - 1); }
    return out;
  };

  W.newYear = function () {
    var s = S(), out = [];
    // 새로 간행된 책: 도서관을 다시 찾을 이유가 생긴다
    G.BOOKS.forEach(function (b) {
      if (b.y !== s.date.y || b.y <= 1480) return;
      var libs = b.libs.map(function (id) { return G.CITY_DATA[id].name; }).join('·');
      out.push({ icon: 'book', history: true, text: '새 책: ' + b.title + U.jx(b.title, '이/가') + ' 나왔다. ' + libs + '의 도서관에서 읽을 수 있다.' });
    });
    var age = R.age();
    // aging effects
    if (age >= 45) { s.player.st.str = Math.max(10, s.player.st.str - U.ri(1, 3)); s.player.st.mar = Math.max(10, s.player.st.mar - U.ri(0, 2)); }
    if (age < 30) { s.player.st.str = Math.min(99, s.player.st.str + U.ri(0, 1)); }
    if (age >= 62 && U.chance((age - 60) * 0.04)) {
      out.push({ icon: 'skull', text: '나이가 들어 몸이 예전 같지 않다...', old: true });
      s.player.hp = Math.max(10, s.player.hp - 25);
    }
    return out;
  };
})(window.G = window.G || {});
