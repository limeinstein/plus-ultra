/* 상선 호위 (G.Escort) — 자료·조정값: js/data/escort.js (G.BALANCE.escort)
   ■ 흐름
     ① 교역소에 들어서면 가끔 그 고장 상인이 다가와 호위를 청한다 (도시마다 열흘 단위로 정해진다. 교역소 메뉴 「호위 요청」으로 다시 들을 수 있다).
     ② 맡으면 상인의 배가 함대에 들어와 함께 다닌다 — 내 배가 아니라 따라오는 배다(state.escort.now.ship). 짐칸·선원·함대 5척 제한과 상관없다.
        · 함대는 상인 배보다 빨리 가지 못한다 (R.fleetMotion → E.speedK)   · 바다 그림에 함께 그려진다 (E.seaShips)
        · 해전에서는 기함 뒤에 숨는 아군 배로 나온다 (battle.js). 가라앉거나 적에게 넘어가면 호위는 실패.
        · 상선과 함께면 해적이 더 꾄다 (E.pirateK) — 짐을 실은 뒤에는 더.
     ③ 상인이 정한 항구에 닿으면 상인이 제 돈으로 물건을 싣는다 (그 도시의 재고·값을 따른다).
     ④ 기한 안에 떠난 항구로 데려오면 상인이 그 물건을 팔고, 남긴 이익의 일부(share)를 준다. 이익이 적어도 품삯(왕복 날수 × feeDay)은 준다. 기한을 넘기면 절반.
   ■ 저장: state.escort = { now: 지금 호위(없으면 null), cool: 다음 요청이 나오는 날, no: 거절한 요청, said: 들은 요청, done, lost }. 옛 저장에는 없으므로 E.st()가 만든다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var E = {};
  G.Escort = E;
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.escort) || {}; }
  E.st = function () { var s = S(); if (!s) return { now: null }; if (!s.escort) s.escort = { now: null, cool: 0, no: null, said: null, done: 0, lost: 0 }; return s.escort; };
  /** 지금 호위하는 일 (없으면 null) */
  E.now = function () { var s = S(); return s && s.escort && s.escort.now ? s.escort.now : null; };
  /** 지금 함께 다니는 상인의 배 (없으면 null) */
  E.ship = function () { var n = E.now(); return n ? n.ship : null; };
  function city(id) { return G.CITY_DATA[id]; }
  function fill(text, n, extra) {
    var o = { name: n.name, ship: G.SHIP[n.ship.type].name, to: city(n.to).name, from: city(n.from).name, good: G.GOOD[n.good].name, q: n.q != null ? n.q : n.plan, due: U.fmtDate(dateAt(n.due)) };
    for (var k in extra || {}) o[k] = extra[k];
    return String(text).replace(/\{(\w+)\}\{([^}]+)\}/g, function (m, a, josa) {
      var w = String(o[a] != null ? o[a] : '');
      var pair = { '을': '을/를', '이': '이/가', '으로': '으로/로', '은': '은/는', '과': '과/와' }[josa];
      return w + (pair ? U.jx(w, pair) : josa);
    }).replace(/\{(\w+)\}/g, function (m, a) { return o[a] != null ? o[a] : m; });
  }
  function line(key, n, extra) { return fill(U.pick(G.ESCORT_LINES[key]), n, extra); }
  /** 상인의 얼굴 (떠난 고장 사람) */
  E.speaker = function (n) {
    var c = city(n.from), sp = { name: '상인 ' + n.name, lang: 3 };
    try {
      var A = G.Art;
      sp.portrait = A.withImg(A.npcSpec('escort' + n.from + n.name, 'merchant', G.Img.folkStyle(c), 'm'), G.Img.chain.npc('vendor', c));
      sp.half = G.Img.chain.npcHalf('vendor', c);
      sp.rigId = 'npc:' + c.id + ':escort';
    } catch (e) { /* 그림이 없어도 말은 한다 */ }
    return sp;
  };

  // ---------------------------------------------------------------- 요청 만들기
  /* 만든 요청은 저장 상태(e.off)에 적어 둔다 — 다시 불러와도 같은 상인·같은 배 */
  function tripDays(a, b) { return Math.max(4, Math.round(G.Geo.dist(a.lon, a.lat, b.lon, b.lat) * (K().dayPerDeg || 1.05))); }
  function goodsOf(c) {
    var y = S().date.y;
    return (c.goods || []).filter(function (id) { var g = G.GOOD[id]; return g && !(G.Slave && G.Slave.is(id)) && (!g.nw || c.region === 10 || y >= 1520); });
  }
  /** 이 도시 교역소에서 지금 나와 있는 호위 요청 (없으면 null). 열흘 단위로 같은 요청이 유지된다 */
  E.offer = function (c) {
    var s = S(), e = E.st(), B = K();
    if (!s || e.now || !c || !c.port || s.day < (e.cool || 0)) return null;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return null;
    if (!s.fleet.ships.length) return null;
    var key = c.id + ':' + Math.floor(s.day / 10);
    if (e.no === key) return null;
    if (e.off && e.off.key === key) return e.off.offer;
    var rng = U.makeRng(U.strHash('escort' + key)), offer = null;
    if (rng() < B.chance) {
      var known = s.known || [];
      var all = G.CITY_DATA.filter(function (d) {
        if (d.id === c.id || !d.port || !R.cityExists(d, s.date) || !goodsOf(d).length) return false;
        var dist = G.Geo.dist(c.lon, c.lat, d.lon, d.lat);
        return dist >= B.dist[0] && dist <= B.dist[1];
      });
      var cand = all.filter(function (d) { return known.indexOf(d.id) >= 0; });
      if (!cand.length) cand = all.filter(function (d) { return G.Geo.dist(c.lon, c.lat, d.lon, d.lat) <= (B.dist[0] + B.dist[1]) / 2; });
      // 섞어서 앞의 몇 곳만 따져 본다: 그 도시에서 사 와 여기서 팔 때 가장 많이 남는 물건
      cand = cand.map(function (d) { return [rng(), d]; }).sort(function (a, b) { return a[0] - b[0]; }).slice(0, 6).map(function (x) { return x[1]; });
      var best = null;
      cand.forEach(function (d) {
        goodsOf(d).forEach(function (g) {
          if ((c.goods || []).indexOf(g) >= 0) return;
          var buy = R.buyPrice(d, g), gain = R.sellPrice(c, g) - buy;
          if (gain > buy * 0.12 && (!best || gain > best.gain)) best = { d: d, g: g, gain: gain };
        });
      });
      if (best) {
        var zone = G.Ships.zone(c.lon, c.lat), big = Math.min(1, s.player.fame / B.bigFame);
        // 그 바다의 상선 가운데서 고른다: 이름이 덜 났으면 작은 배를 모는 상인, 이름이 나면 큰 배를 모는 상인
        var pool = (G.Ships.enemyTypes('merchant', zone, null, 6, big, s.date.y) || []).filter(function (id, i, a) { return a.indexOf(id) === i; }).sort(function (x, y) { return G.SHIP[x].cap - G.SHIP[y].cap; });
        var type = pool[Math.min(pool.length - 1, Math.floor(rng() * (1 + big * (pool.length - 1))))] || 'cog';
        var t = G.SHIP[type], names = G.ESCORT_NAMES[c.region >= 3 && c.region <= 5 && t.cult === 'is' && rng() < 0.5 ? 'ind' : t.cult] || G.ESCORT_NAMES.eu;
        var days = tripDays(c, best.d);
        offer = { key: key, from: c.id, to: best.d.id, good: best.g, type: type, name: names[Math.floor(rng() * names.length)], shipName: G.SHIP_NAMES[Math.floor(rng() * G.SHIP_NAMES.length)],
          days: days, len: Math.round(days * 2 * B.deadline[0] + B.deadline[1]), plan: Math.max(10, Math.floor(t.cap * B.load)), share: B.share };
      }
    }
    e.off = { key: key, offer: offer };
    return offer;
  };
  /** 요청으로 임시 호위 묶음을 만든다 (대사·창에 쓴다) */
  function draft(o) {
    var sh = R.newShip(o.type, o.shipName), t = G.SHIP[o.type];
    sh.guns = { type: 'saker', n: Math.min(K().guns || 2, t.ports) };
    sh.crew = Math.round((t.crew[0] + t.crew[1]) / 2);
    sh.escort = true;
    return { key: o.key, from: o.from, to: o.to, good: o.good, name: o.name, ship: sh, days: o.days, plan: o.plan, share: o.share, start: S().day, due: S().day + o.len, stage: 'out', q: null, cost: 0 };
  }
  function termsHtml(n) {
    var s = S(), t = G.SHIP[n.ship.type], B = K(), to = city(n.to);
    var gain = Math.max(0, R.sellPrice(city(n.from), n.good) - R.buyPrice(to, n.good)), guess = Math.max(Math.round(n.days * 2 * B.feeDay), Math.round(gain * n.plan * n.share * 0.75));
    return '<div class="kv" style="font-size:18px">' +
      '<div>상인</div><div><b>' + U.esc(n.name) + '</b> · ' + t.name + ' ' + U.esc(n.ship.name) + '호 (짐칸 ' + R.shipCargoCap(n.ship) + '통)</div>' +
      '<div>갈 곳</div><div><b>' + to.name + '</b> (' + R.cityOwner(to) + ') — 편도 약 ' + n.days + '일' + ((s.known || []).indexOf(to.id) < 0 ? ' · <span class="muted">처음 가는 항구 (상인이 해도에 적어 준다)</span>' : '') + '</div>' +
      '<div>실어 올 물건</div><div>' + G.goodDot(n.good) + '<b>' + G.GOOD[n.good].name + '</b> 약 ' + n.plan + '통 <span class="muted">(상인의 돈으로 산다)</span></div>' +
      '<div>기한</div><div><b>' + U.fmtDate(dateAt(n.due)) + '</b>까지 ' + city(n.from).name + U.jx(city(n.from).name, '으로/로') + ' (' + (n.due - s.day) + '일)</div>' +
      '<div>받는 몫</div><div>상인이 남긴 이익의 <b>' + Math.round(n.share * 100) + '%</b> <span class="muted">(지금 시세면 약 ' + U.num(guess) + '닢 · 적어도 품삯 ' + U.num(Math.round(n.days * 2 * B.feeDay)) + '닢 · 기한을 넘기면 절반)</span></div></div>' +
      '<div class="muted" style="margin-top:10px;font-size:15px;line-height:1.5">상인의 배는 함대를 따라다닙니다. 내 짐칸·선원과는 상관없지만, <b>함대가 그 배보다 빨리 가지 못합니다.</b> 상선과 함께면 해적이 더 꾀고, 해전에서 그 배를 잃으면 호위는 실패합니다(명성 −' + B.fameLost + ').</div>';
  }
  function dateAt(day) {
    var s = S(), d = { y: s.date.y, m: s.date.m, d: s.date.d }, n = Math.max(0, day - s.day);
    if (U.addDays) return U.addDays(d, n);
    var md = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    while (n-- > 0) { d.d++; if (d.d > md[d.m - 1]) { d.d = 1; d.m++; if (d.m > 12) { d.m = 1; d.y++; } } }
    return d;
  }
  /** 호위를 맡을지 묻는다 → 맡으면 true */
  E.propose = async function (c, o, pitch) {
    var e = E.st(), n = draft(o), who = E.speaker(n);
    if (pitch !== false) await UI.say(line('ask', n), who);
    var v = await UI.window({ title: '호위 요청 — ' + city(n.to).name + '까지', icon: 'ship', width: 760, html: termsHtml(n),
      buttons: [{ label: '거절한다', value: 'no' }, { label: '다음에 답한다', value: null }, { label: '호위를 맡는다', value: 'yes', cls: 'navy' }] }).result;
    if (v === 'no') { e.no = o.key; await UI.say(line('no', n), who); return false; }
    if (v !== 'yes') return false;
    e.now = n; e.off = null;
    var s = S(); if ((s.known || []).indexOf(n.to) < 0) { s.known.push(n.to); UI.toast('상인이 해도에 ' + city(n.to).name + U.jx(city(n.to).name, '을/를') + ' 적어 주었다.', 'map', 4200); }
    if (G.ShipSprite) G.ShipSprite.want([n.ship.type]);
    G.State.log(city(n.from).name + '에서 상인 ' + n.name + '의 ' + G.SHIP[n.ship.type].name + ' ' + n.ship.name + '호를 호위하기로 했다 — ' + city(n.to).name + '까지.');
    await UI.say(line('yes', n, { due: U.fmtDate(dateAt(n.due)) }), who);
    UI.toast(n.ship.name + '호가 함대를 따른다. (호위 — ' + city(n.to).name + '까지)', 'ship', 4500);
    G.Game.refreshHud();
    return true;
  };
  /** 교역소에 들어섰을 때: 처음 보는 요청이면 상인이 다가온다 */
  E.atTrade = async function (c) {
    var e = E.st(), o = E.offer(c);
    if (!o || e.said === o.key) return;
    e.said = o.key;
    await E.propose(c, o);
  };
  /** 교역소 메뉴에 붙는 줄 (없으면 null) */
  E.menuItem = function (c) {
    var n = E.now();
    if (n) return { label: '호위 중인 상인', icon: 'ship', sub: E.statusText(n), onClick: function () { return E.statusWindow(); } };
    var o = E.offer(c);
    if (o) return { label: '호위 요청', icon: 'ship', sub: city(o.to).name + '까지 · 상인 ' + o.name, onClick: function () { return E.propose(c, o); } };
    return null;
  };
  /** 「이 도시에서 할 일」 판 */
  E.todo = function (c) {
    var n = E.now();
    if (!n) { var o = E.offer(c); return o ? [{ kind: 'trade', icon: 'ship', text: '교역소에 호위를 청하는 상인이 있다 (' + city(o.to).name + '까지)' }] : []; }
    return [];
  };

  // ---------------------------------------------------------------- 진행
  E.late = function (n) { n = n || E.now(); return !!n && S().day > n.due; };
  E.statusText = function (n) {
    n = n || E.now(); if (!n) return '';
    var left = n.due - S().day;
    return (n.stage === 'out' ? city(n.to).name + U.jx(city(n.to).name, '으로/로') + ' 가는 길' : G.GOOD[n.good].name + ' ' + n.q + '통을 싣고 ' + city(n.from).name + U.jx(city(n.from).name, '으로/로')) + ' · ' + (left >= 0 ? '남은 ' + left + '일' : '기한 ' + (-left) + '일 넘김');
  };
  function end(n, why) {
    var e = E.st(), s = S();
    e.now = null; e.cool = s.day + (K().cool || 25); e.off = null;
    if (why === 'done') e.done = (e.done || 0) + 1; else e.lost = (e.lost || 0) + 1;
    G.Game.refreshHud();
  }
  /** 호위가 깨졌다: why = lost(배를 잃음) · scatter(싸움에 져 흩어짐) · quit(그만둠) · gone(너무 늦어 떠남). 깎인 명성을 돌려준다 */
  E.fail = function (why) {
    var n = E.now(); if (!n) return 0;
    var B = K(), loss = why === 'lost' ? B.fameLost : why === 'gone' ? B.fameLate : B.fameQuit;
    var took = -G.Fame.add('so', -loss);
    G.State.log('상인 ' + n.name + '의 호위가 깨졌다 — ' + ({ lost: '상인의 배를 잃었다', scatter: '싸움에 져 함대가 흩어졌다', quit: '호위를 그만두었다', gone: '기한을 크게 넘겨 상인이 떠났다' }[why] || why) + '. (명성 −' + took + ')');
    end(n, why);
    return took;
  };
  /** 항구에 들어섰을 때 (city.js): 상인이 물건을 싣거나, 팔고 몫을 준다 */
  E.arrival = async function (c) {
    var n = E.now(); if (!n) return;
    var s = S(), B = K(), who = E.speaker(n);
    n.ship.hp = n.ship.maxHp;                           // 상인은 항구에서 제 배를 고친다
    if (s.day > n.due + Math.round((n.due - n.start) * B.grace)) {
      await UI.say(line('gone', n), who);
      var lostF = E.fail('gone');
      UI.toast('상인 ' + n.name + U.jx(n.name, '이/가') + ' 함대를 떠났다. (명성 −' + lostF + ')', 'ship', 5000);
      return;
    }
    if (n.stage === 'out' && c.id === n.to) {
      // 상인이 제 돈으로 싣는다: 재고만큼, 살수록 값이 오른다
      var want = Math.min(n.plan, R.supply(c, n.good)), left = want, cost = 0, chunk = Math.max(1, Math.ceil(want / 10));
      while (left > 0) { var k = Math.min(chunk, left); cost += R.buyPrice(c, n.good) * k; R.onBuy(c, n.good, k); left -= k; }
      n.q = want; n.cost = cost; n.stage = 'back';
      if (want < n.plan) await UI.say(line('loadNone', n), who);
      await UI.say(line('load', n), who);
      G.State.log(c.name + '에서 상인 ' + n.name + U.jx(n.name, '이/가') + ' ' + G.GOOD[n.good].name + ' ' + want + '통을 실었다. ' + city(n.from).name + U.jx(city(n.from).name, '으로/로') + ' 돌아간다.');
      UI.toast('상인의 배에 ' + G.GOOD[n.good].name + ' ' + want + '통 — ' + U.fmtDate(dateAt(n.due)) + '까지 ' + city(n.from).name + U.jx(city(n.from).name, '으로/로'), 'ship', 5200);
      return;
    }
    if (n.stage === 'back' && c.id === n.from) {
      var q = n.q || 0, rev = 0, l2 = q, ch2 = Math.max(1, Math.ceil(q / 10));
      while (l2 > 0) { var k2 = Math.min(ch2, l2); rev += R.sellPrice(c, n.good) * k2; R.onSell(c, n.good, k2); l2 -= k2; }
      var profit = Math.max(0, rev - n.cost), fee = Math.round(n.days * 2 * B.feeDay), part = Math.round(profit * n.share), late = E.late(n);
      var pay = Math.max(fee, part); if (late) pay = Math.round(pay * B.late);
      var key = !q ? 'homeEmpty' : late ? 'homeLate' : part < fee ? 'homeThin' : 'home';
      await UI.say(line(key, n, { profit: U.num(profit), pay: U.num(pay) }), who);
      s.player.gold += pay;
      var fTr = late ? 0 : Math.min(B.tradeFameMax, Math.floor(pay / B.tradeFame)), fSo = late ? 0 : B.fameOk;
      if (fTr) G.Fame.add('tr', fTr); if (fSo) G.Fame.add('so', fSo);
      s.stats.escorts = (s.stats.escorts || 0) + 1;
      G.State.log('상인 ' + n.name + '의 호위를 마쳤다 — 몫 금화 ' + U.num(pay) + '닢' + (late ? ' (기한을 넘겨 절반)' : '') + '.');
      UI.toast('호위를 마쳤다 — 금화 ' + U.num(pay) + '닢' + (fTr + fSo ? ' · 명성 +' + (fTr + fSo) : ''), 'coin', 5200);
      end(n, 'done');
    }
  };
  /** 하루가 지날 때 (world.js): 기한이 지나면 한 번 알린다 */
  E.daily = function () {
    var n = E.now(), out = []; if (!n) return out;
    if (S().day > n.due && !n.warned) { n.warned = 1; out.push({ icon: 'ship', text: line('warn', n) }); }
    return out;
  };
  /** 호위를 그만둔다 (교역소 메뉴·수첩) */
  E.quit = async function () {
    var n = E.now(); if (!n) return false;
    if (!(await UI.confirm('상인 ' + U.esc(n.name) + '의 호위를 그만두겠습니까? 상인의 배는 함대를 떠나고, 명성이 ' + K().fameQuit + ' 깎입니다.', '그만둔다', '계속 호위한다', '호위'))) return false;
    var who = E.speaker(n);
    await UI.say(line('quit', n), who);
    var took = E.fail('quit');
    UI.toast('호위를 그만두었다. (명성 −' + took + ')', 'ship', 4200);
    return true;
  };
  E.statusWindow = async function () {
    var n = E.now(); if (!n) return;
    var v = await UI.window({ title: '호위 — 상인 ' + n.name, icon: 'ship', width: 700, html: E.html(true),
      buttons: [{ label: '호위를 그만둔다', value: 'quit' }, { label: '닫는다', value: null, cls: 'navy' }] }).result;
    if (v === 'quit') await E.quit();
  };

  // ---------------------------------------------------------------- 바다·해전에 끼치는 것
  /** 바다에 그릴 배들: 내 함대 + 상인의 배 */
  E.seaShips = function (ships) { var sh = E.ship(); return sh ? ships.concat([sh]) : ships; };
  /** 함대가 상인 배보다 빨리 가지 못한다: v(이 방향의 함대 속력)에 곱할 값 (1 이하) */
  E.speedK = function (v, ang, wind, env) {
    var n = E.now(); if (!n || !(v > 0)) return 1;
    var sh = n.ship, t = G.SHIP[sh.type];
    var loadK = n.stage === 'back' && n.q ? 1 - R.FORM.load * Math.min(1, n.q / Math.max(1, R.shipCargoCap(sh))) * (t.traits.indexOf('thrift') >= 0 ? 0.5 : 1) : 1;
    var best = R.shipSpeed(sh, ang, wind, env);
    for (var th = 25; th <= 75; th += 10) {              // 맞바람이면 상인 배도 지그재그로 간다
      var rad = th * Math.PI / 180, c = Math.cos(rad) * 0.92;
      best = Math.max(best, Math.max(R.shipSpeed(sh, ang + rad, wind, env), R.shipSpeed(sh, ang - rad, wind, env)) * c);
    }
    var lim = best * loadK;
    if (v > lim) lim += (v - lim) * (K().tow || 0);          // 빠른 배들이 돛을 줄이고 기다려 주지만, 조금은 끌어 준다
    return Math.min(1, lim / v);
  };
  /** 상선과 함께면 해적이 더 꾄다 */
  E.pirateK = function () { var n = E.now(), p = K().pirate || [1, 1]; return !n ? 1 : n.stage === 'back' && n.q ? p[1] : p[0]; };
  /** 해전이 끝났을 때 (battle.js): ships = 해전의 배들, res = 결과, lines = 결과 창에 덧붙일 줄 */
  E.afterBattle = function (ships, res, lines) {
    var n = E.now(); if (!n) return;
    var b = (ships || []).filter(function (x) { return x.escort; })[0]; if (!b) return;
    if (b.sunk || b.lostBoard || !b.alive && !b.fled) {
      var f1 = E.fail('lost');
      if (lines) lines.push('<span class="warn-text">상인 ' + U.esc(n.name) + '의 ' + U.esc(n.ship.name) + '호를 잃었다 — 호위 실패 (명성 −' + f1 + ')</span>');
      else UI.toast('상인의 배를 잃었다 — 호위 실패 (명성 −' + f1 + ')', 'ship', 6000);
      return;
    }
    n.ship.hp = Math.max(1, Math.round(b.hp));
    if (res === 'lose' || res === 'flaglost') {
      var f2 = E.fail('scatter');
      UI.toast('함대가 흩어지는 사이 상인 ' + n.name + '의 배는 제 갈 길로 달아났다 — 호위 실패 (명성 −' + f2 + ')', 'ship', 6000);
    }
  };

  // ---------------------------------------------------------------- 보여 주기
  /** 수첩 「계약·의뢰」·교역소 창 */
  E.html = function (bare) {
    var n = E.now(), s = S();
    if (!n) return '';
    var t = G.SHIP[n.ship.type], B = K(), left = n.due - s.day;
    var h = (bare ? '' : '<div class="sep"></div><h4 style="margin:0 0 8px">상선 호위</h4>') + '<div class="kv">' +
      '<div>상인</div><div><b>' + U.esc(n.name) + '</b> · ' + t.name + ' ' + U.esc(n.ship.name) + '호 (내구 ' + Math.round(n.ship.hp) + '/' + n.ship.maxHp + ')</div>' +
      '<div>할 일</div><div>' + (n.stage === 'out' ? '<b>' + city(n.to).name + '</b>' + U.jx(city(n.to).name, '으로/로') + ' 데려간다 — 닿으면 상인이 ' + G.GOOD[n.good].name + U.jx(G.GOOD[n.good].name, '을/를') + ' 싣는다'
        : G.goodDot(n.good) + G.GOOD[n.good].name + ' ' + n.q + '통을 실었다 — <b>' + city(n.from).name + '</b>' + U.jx(city(n.from).name, '으로/로') + ' 데려온다') + '</div>' +
      '<div>기한</div><div>' + U.fmtDate(dateAt(n.due)) + (left >= 0 ? ' (남은 ' + left + '일)' : ' <span class="warn-text">(기한 ' + (-left) + '일 넘김 — 몫 절반)</span>') + '</div>' +
      '<div>받는 몫</div><div>상인이 남긴 이익의 ' + Math.round(n.share * 100) + '% · 적어도 품삯 ' + U.num(Math.round(n.days * 2 * B.feeDay)) + '닢</div></div>';
    return h;
  };
  /** 함대 현황판에 붙는 줄 */
  E.panelHtml = function () {
    var n = E.now(); if (!n) return '';
    var sh = n.ship;
    return '<div class="fp-ship fp-escort"><div class="flex"><b>⚑ ' + U.esc(sh.name) + '</b><span class="right cream-muted">호위 · ' + G.SHIP[sh.type].name + '</span></div>' + UI.bar(sh.hp, sh.maxHp, sh.hp / sh.maxHp < 0.4 ? 'red dark' : 'green dark') + '</div>';
  };
})(window.G = window.G || {});
