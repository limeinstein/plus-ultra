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
      var age = R.age(), aged = age >= 40 && !s.flags.aged40;
      if (aged) {
        // 마흔: 대화·수첩의 얼굴과 무릎상이 40대 모습(수염)으로 바뀐다 (G.Img.chain.heroPortrait·heroHalf가 나이를 본다)
        s.flags.aged40 = 1;
        var fk = G.Img && G.Img.pick(G.Img.chain.heroPortrait(s.player));
        out.push({ icon: fk ? { src: G.Img.src(fk), icon: 'star' } : 'star', text: R.fullName() + '의 ' + age + '번째 생일 — 얼굴에 세월이 내려앉았다. 이제 40대의 모습이다.', birthday: true, aged: true });
        G.State.log(R.fullName() + '이(가) ' + age + '세가 되었다.');
      } else out.push({ icon: 'star', text: R.fullName() + '의 생일입니다. (' + age + '세)', birthday: true });
    }
    // 계절풍이 바뀐 날 (계절풍 바다나 그 연안 항구에 있을 때)
    if (G.Monsoon) out = out.concat(G.Monsoon.daily());
    // in port: slow recovery
    if (s.loc.mode === 'city') {
      s.fleet.fatigue = Math.max(0, s.fleet.fatigue - 0.6);
      s.fleet.discipline = Math.min(100, s.fleet.discipline + 0.5);
      s.fleet.daysOut = 0; s.fleet.scurvy = Math.max(0, (s.fleet.scurvy || 0) * 0.75 - 2);   // 뭍의 신선한 먹을거리로 빨리 낫는다
    }
    // 가족: 임신 소식·출산 (family.js — 아이는 자택에 들러야 생긴다)
    if (G.Family && G.Family.daily) out = out.concat(G.Family.daily());
    // 후원자의 대(代) — 옛 저장이면 지금 자리에 있는 사람들을 기억해 둔다
    if (!s.spHolder && G.Succession) G.Succession.sync();
    return out;
  };

  W.newMonth = function () {
    var s = S(), out = [];
    // 가족: 아이와의 사이(떨어져 지내면 서먹해진다)·견습 아이의 성장 (family.js)
    if (G.Family && G.Family.newMonth) out = out.concat(G.Family.newMonth());
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
    // 이 달에 주인이 바뀐 도시 (dominion.js)
    if (G.Dominion) out = out.concat(G.Dominion.monthly());
    return out;
  };

  W.newYear = function () {
    var s = S(), out = [];
    // 군주·후원자가 세상을 떠나거나 물러나면 다음 사람이 뒤를 잇는다 (신뢰 절반, 회상, 유산 — succession.js)
    if (G.Succession) out = out.concat(G.Succession.year());
    // 아이들이 자란다
    if (G.Family && G.Family.newYear) out = out.concat(G.Family.newYear());
    if (G.Wander) out = out.concat(G.Wander.newYear());
    // 새로 간행된 책: 도서관을 다시 찾을 이유가 생긴다
    G.BOOKS.forEach(function (b) {
      if (b.y !== s.date.y || b.y <= 1480) return;
      var libs = b.libs.map(function (id) { return G.CITY_DATA[id].name; }).join('·');
      out.push({ icon: 'book', history: true, text: '새 책: ' + b.title + U.jx(b.title, '이/가') + ' 나왔다. ' + libs + '의 도서관에서 읽을 수 있다.' });
    });
    // 새로 세워진 도시·사라진 마을 (cities.js 의 founded / until): 개척 도시가 역사 연도에 맞춰 열린다
    var born = [], gone = [];
    G.CITY_DATA.forEach(function (c) {
      if (c.founded === s.date.y && c.founded > 1480) born.push(c);
      if (c.until === s.date.y) gone.push(c);
    });
    if (born.length) out.push({ icon: 'castle', history: true, text: '새 도시 소식: ' + born.map(function (c) { return c.nation + '의 ' + c.name; }).join(', ') +
      U.jx(born[born.length - 1].name, '이/가') + ' 세워졌다.' });
    gone.forEach(function (c) {   // 같은 자리에 새 도시가 섰으면 이름이 바뀐 것 (뉴암스테르담 → 뉴욕)
      var nw = born.filter(function (b) { return Math.abs(b.lat - c.lat) + Math.abs(b.lon - c.lon) < 0.5; })[0];
      out.push({ icon: 'castle', history: true, text: nw ? c.name + U.jx(c.name, '이/가') + ' ' + nw.nation + '의 ' + nw.name + U.jx(nw.name, '으로/로') + ' 바뀌었다.'
        : c.name + '의 옛 마을은 이제 남아 있지 않다고 한다.' });
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
