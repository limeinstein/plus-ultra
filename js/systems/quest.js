/* 조합 의뢰: 상품 수송·상품 구입·사람 이송·해적 퇴치·빚 독촉.
   대항해시대 2의 조합 의뢰를 본떠, 기한 안에 다른 도시를 오가며 해내는 일거리를 준다.
   상태는 state.quests 에 쌓이고, 도시에 들어올 때마다 기한과 달성 여부를 살핀다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var Q = {};
  G.Quest = Q;
  function S() { return G.Game.state; }
  function list() { var s = S(); if (!s.quests) s.quests = []; return s.quests; }
  Q.list = list;
  Q.MAX = 3;

  Q.KINDS = {
    carry: { name: '상품 수송', icon: 'sack', desc: '조합이 맡긴 짐을 다른 도시 조합까지 실어다 준다.' },
    buy: { name: '상품 구입', icon: 'coin', desc: '부탁받은 교역품을 사서 이 조합으로 가져온다.' },
    passenger: { name: '사람 이송', icon: 'people', desc: '손님을 배에 태워 다른 도시까지 데려다 준다.' },
    pirate: { name: '해적 퇴치', icon: 'sword', desc: '그 바다를 휘젓는 해적선을 쳐부순다.' },
    debt: { name: '빚 독촉', icon: 'scroll', desc: '다른 도시에 있는 빚진 자를 찾아가 돈을 받아 온다.' }
  };

  // ---------------------------------------------------------------- 거리·기한
  function days(a, b) {
    var d = G.Geo.dist(a.lon, a.lat, b.lon, b.lat);   // 도(°) 단위
    return Math.max(6, Math.round(d / 1.05));
  }
  /** 조합이 있는 도시라야 의뢰를 주고받을 수 있다 */
  function hasGuild(c) { return c.flags.indexOf('G') >= 0 || c.size >= 3; }
  Q.hasGuild = hasGuild;
  function pickCity(rng, from, minD, maxD) {
    var known = S().known || [];
    var all = G.CITY_DATA.filter(function (c) {
      if (c.id === from.id || !c.port || !R.cityExists(c, S().date)) return false;
      if (!hasGuild(c)) return false;
      var d = G.Geo.dist(from.lon, from.lat, c.lon, c.lat);
      return d >= minD && d <= maxD;
    });
    // 가 본 적 있는 도시를 먼저 고른다 (아주 없으면 아무 데나)
    var cand = all.filter(function (c) { return known.indexOf(c.id) >= 0; });
    if (!cand.length) cand = all;
    if (!cand.length) return null;
    return cand[Math.floor(rng() * cand.length)];
  }
  function goodsOf(c) {
    return (c.goods || []).filter(function (id) { return G.GOOD[id] && !(G.Slave && G.Slave.is(id)); });   // 조합은 노예를 맡기지 않는다
  }
  var NAMES = ['안토니오', '미겔', '조반니', '피에르', '한스', '유수프', '알리', '디에고', '루이스', '마르코',
    '페드루', '야코프', '이반', '오마르', '라미레스', '베르나르', '토마스', '필립', '살바도르', '엔리케'];
  var LADY = ['이사벨', '마리아', '카트린', '안나', '조반나', '레오노르', '클라라', '베아트리스'];

  // ---------------------------------------------------------------- 의뢰 만들기
  /** 도시마다 열흘 단위로 정해지는 의뢰 세 건 */
  Q.offers = function (c) {
    var s = S(), blk = Math.floor(s.day / 10);
    var rng = U.makeRng(U.strHash('quest' + c.id + ':' + blk));
    var out = [];
    for (var i = 0; i < 3; i++) {
      var q = make(c, rng, i, blk);
      if (q) out.push(q);
    }
    return out.filter(function (q) { return !taken(q.key) && !done(q.key); });
  };
  function taken(key) { return list().some(function (q) { return q.key === key; }); }
  function done(key) { var s = S(); return !!(s.questDone && s.questDone[key]); }

  function make(c, rng, i, blk) {
    var s = S(), fame = s.player.fame;
    var kinds = ['carry', 'buy', 'passenger', 'debt'];
    if (fame >= 300) kinds.push('pirate');
    if (c.size >= 2) kinds.push('carry');
    var kind = kinds[Math.floor(rng() * kinds.length)];
    var key = c.id + ':' + blk + ':' + i;
    var q = { key: key, kind: kind, from: c.id, city: c.name };
    var far = 8 + Math.floor(rng() * 34);
    if (kind === 'carry') {
      var to = pickCity(rng, c, 5, 42 + fame / 90);
      if (!to) return null;
      var g = goodsOf(c); if (!g.length) return null;
      var good = g[Math.floor(rng() * g.length)];
      var qty = 15 + Math.floor(rng() * 26);
      q.to = to.id; q.good = good; q.qty = qty; q.load = qty;
      q.dayNeed = days(c, to);
      q.pay = Math.round(G.GOOD[good].p * qty * (0.35 + rng() * 0.15) + q.dayNeed * 42 + qty * 14);
      q.fame = 3 + Math.round(q.dayNeed / 14);
      q.title = to.name + '까지 ' + G.GOOD[good].name + ' ' + qty + '통 수송';
    } else if (kind === 'buy') {
      var far2 = G.CITY_DATA.filter(function (x) {
        if (x.id === c.id || !x.goods || !x.goods.length || !R.cityExists(x, S().date)) return false;
        var rd = G.REGION_DIST[c.region][x.region];
        return rd >= 1 && rd <= 2;
      });
      if (!far2.length) return null;
      var src = far2[Math.floor(rng() * far2.length)];
      var gs = goodsOf(src); if (!gs.length) return null;
      var good2 = gs[Math.floor(rng() * gs.length)];
      var qty2 = 10 + Math.floor(rng() * 21);
      q.good = good2; q.qty = qty2; q.to = c.id;
      q.dayNeed = U.clamp(days(c, src) * 2, 24, 150);
      q.pay = Math.round(G.GOOD[good2].p * qty2 * (1.35 + rng() * 0.45) + q.dayNeed * 18);
      q.fame = 3 + Math.round(q.dayNeed / 18);
      q.title = G.GOOD[good2].name + ' ' + qty2 + '통을 구해 온다';
      q.hint = src.name + ' 근처에서 난다고 한다';
    } else if (kind === 'passenger') {
      var to2 = pickCity(rng, c, 6, 46 + fame / 80);
      if (!to2) return null;
      var lady = rng() < 0.3;
      q.who = (lady ? LADY : NAMES)[Math.floor(rng() * (lady ? LADY.length : NAMES.length))];
      q.to = to2.id; q.load = 1;
      q.dayNeed = days(c, to2);
      q.pay = Math.round(320 + q.dayNeed * 52 + rng() * 420);
      q.fame = 4 + Math.round(q.dayNeed / 12);
      q.title = q.who + U.jx(q.who, '을/를') + ' ' + to2.name + '까지 모신다';
    } else if (kind === 'pirate') {
      var n = 1 + Math.floor(rng() * 3);
      q.qty = n; q.got = 0; q.to = c.id;
      q.dayNeed = 40 + n * 22;
      q.pay = Math.round((880 + rng() * 620) * n);
      q.fame = 14 * n;
      q.title = '이 근해의 해적선 ' + n + '척을 쳐부순다';
    } else {
      var to3 = pickCity(rng, c, 5, 40);
      if (!to3) return null;
      q.who = NAMES[Math.floor(rng() * NAMES.length)];
      q.at = to3.id; q.to = c.id;
      q.amount = Math.round((900 + rng() * 2600) * (1 + c.size * 0.2));
      q.dayNeed = days(c, to3) * 2 + 10;
      q.pay = Math.round(q.amount * (0.2 + rng() * 0.12) + q.dayNeed * 22);
      q.fame = 4 + Math.round(q.dayNeed / 16);
      q.title = to3.name + '의 ' + q.who + '에게서 빚을 받아 온다';
    }
    q.limit = Math.max(14, Math.round(q.dayNeed * 1.7) + 8);
    q.reward = q.pay;
    return q;
  }

  // ---------------------------------------------------------------- 받기·포기
  Q.canAccept = function (q) {
    var s = S();
    if (list().length >= Q.MAX) return '한 번에 맡을 수 있는 의뢰는 ' + Q.MAX + '건까지입니다.';
    if (q.load && R.free() < q.load) return '짐을 실을 자리가 ' + q.load + '통 더 있어야 합니다.';
    if (q.kind === 'pirate' && !s.fleet.ships.length) return '배가 있어야 합니다.';
    return null;
  };
  Q.accept = function (q) {
    var s = S();
    var k = U.clone(q);
    k.taken = U.dateNum(s.date);
    k.due = U.dateNum(U.addDays(s.date, q.limit));
    k.got = 0;
    list().push(k);
    G.State.log('조합 의뢰를 맡았다 — ' + k.title + ' (기한 ' + U.fmtDate(U.addDays(s.date, q.limit)) + ')');
    return k;
  };
  Q.give_up = function (q) {
    var s = S(), i = list().indexOf(q);
    if (i >= 0) list().splice(i, 1);
    G.Fame.add(G.Fame.questCat(q.kind), -Math.round(q.fame * 1.5));
    if (!s.questDone) s.questDone = {};
    s.questDone[q.key] = 'fail';
    G.State.log('조합 의뢰를 포기했다 — ' + q.title);
  };

  /** 의뢰가 차지한 짐칸 */
  Q.load = function () {
    return list().reduce(function (n, q) { return n + (q.load || 0); }, 0);
  };

  // ---------------------------------------------------------------- 날짜·전투
  /** 하루가 지날 때마다 기한을 살핀다. 넘긴 의뢰는 알려 주고 지운다 */
  Q.daily = function () {
    var s = S(), out = [], now = U.dateNum(s.date);
    list().slice().forEach(function (q) {
      if (now > q.due) {
        var i = list().indexOf(q); if (i >= 0) list().splice(i, 1);
        if (!s.questDone) s.questDone = {};
        s.questDone[q.key] = 'late';
        G.Fame.add(G.Fame.questCat(q.kind), -q.fame);
        out.push({ icon: 'hourglass', text: '조합 의뢰의 기한이 지났다 — ' + q.title });
        G.State.log('조합 의뢰 기한을 넘겼다 — ' + q.title);
      }
    });
    return out;
  };
  /** 해적을 쳐부술 때마다 부른다 */
  Q.onPirateBeaten = function (n) {
    var hit = [];
    list().forEach(function (q) {
      if (q.kind !== 'pirate' || q.got >= q.qty) return;
      q.got = Math.min(q.qty, (q.got || 0) + (n || 1));
      hit.push(q);
    });
    hit.forEach(function (q) {
      if (q.got >= q.qty) UI.toast('의뢰를 다 해냈다. ' + G.CITY_DATA[q.to].name + ' 조합에 알리자.', 'sword', 5000);
      else UI.toast('해적 퇴치 ' + q.got + '/' + q.qty, 'sword');
    });
    return hit.length;
  };

  /** 지금 이 도시에서 보고할 수 있는 의뢰 */
  Q.readyAt = function (c) {
    var s = S();
    return list().filter(function (q) {
      if (q.to !== c.id) return false;
      if (q.kind === 'carry' || q.kind === 'passenger') return true;
      if (q.kind === 'pirate') return q.got >= q.qty;
      if (q.kind === 'buy') { var cg = s.fleet.cargo[q.good]; return !!(cg && cg.q >= q.qty); }
      if (q.kind === 'debt') return !!q.collected;
      return false;
    });
  };
  /** 빚을 받으러 가야 하는 도시인가 */
  Q.debtAt = function (c) {
    return list().filter(function (q) { return q.kind === 'debt' && !q.collected && q.at === c.id; });
  };

  Q.remain = function (q) {
    var s = S();
    return U.dayIndex(dateOf(q.due)) - U.dayIndex(s.date);
  };
  function dateOf(n) { return { y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }; }
  Q.dateOf = dateOf;
})(window.G = window.G || {});
