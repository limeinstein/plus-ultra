/* 특허 회사 (G.Company) — 2026-11-04 사용자 요청 「동인도 회사 같은 회사 · 회원제 · 독점과 중개 무역 · 굵직한 임무 · 주식 투자」
   자료·조정값: js/data/company.js (G.COMPANIES · G.BALANCE.company) · 건물: js/city/company.js (회사 본부 · 상관 · 거래소)
   ■ 회원제: 회사 본부에서 출자금을 내고 든다 (출자금의 80%는 그 회사 주식으로 돌려받는다). 한 번에 한 회사만.
     계급 사원 → 선장 → 이사 → 총독 (공헌 merit, 이사·총독은 자기 회사 주식도). 본부의 「사원 명부」에서 승진 심사.
     떠나면 계급·공헌이 사라지고 한 해 동안 어느 회사에도 들 수 없다.
   ■ 다른 회사 사람이면: 그 회사의 상관 창고·중개 주문서·임무를 쓸 수 없고 세관에 더 자주 걸린다. 회사가 없는 사람은 단속 임무만(보수 60%).
     경쟁사 주식을 사는 것은 자유지만 내 회사 주식보다 많이 쥐면 공헌이 20% 덜 쌓인다.
   ■ 교역소와 다른 것
     · 회사 창고 (상관): 회원은 그 상관의 물건을 교역소 값의 60%(원가)로 산다 — 재고와 상관없이 계급별 할당량까지, 60일마다 새로
     · 독점품 납품 (본부): 회원이 독점품을 본부에 넘기면 시장 값 × 1.25~1.4로 사 준다 — 시장이 포화되지 않는다
     · 세관 (본부 항구): 비회원이 그 회사 독점품을 싣고 들어오면 가끔 세관원이 오른다 — 신고(관세) · 뇌물 · 숨기기(걸리면 몰수·벌금·악명)
     · 중개 주문서 (상관): 아시아 안의 상관을 잇는 사슬 — 고리마다 배수가 오르고 「연계 보너스」가 쌓인다.
       고리를 마칠 때마다 정산하거나 다음 고리를 잇는다. 기한을 넘기면 쌓인 보너스가 날아간다. 끝까지 이으면 보너스 × 1.5
     · 고리의 끝은 그 회사 상관이거나, 상관이 있는 바다의 큰 항구(거래처). 그 도시에 들어서면 바로 넘길지 묻는다
   ■ 회사 임무 (본부·상관 게시판, 30일마다 새로): 단속(밀수선·경쟁사 배 n척) · 귀환 대선단(본부까지, 습격을 막는다) · 상관 건설(물자를 싣고 가 새 상관) · 경쟁사 나포(큰 화물선)
   ■ 주식: 회사마다 주가 = 액면 × 시대 곡선 × 형편(h) 둘레를 달마다 출렁인다. 해마다 1월에 배당. 세상 사건·제독의 임무가 주가를 움직인다.
     거래소(앤트워프·런던·암스테르담)에서 모든 회사, 회사 본부의 주식 창구에서는 그 회사 것만. 중개인의 귀띔으로 다가올 일을 미리 듣는다.
   ■ 저장: s.company = { member, rank, merit, joined, cool, shares{}, basis{}, px{회사: {p, h, hist[]}}, pm(처리한 달), ev[], shock{}, quota{도시: {per, used}},
           posts{회사: [{c, g}]}, took{}, mission, chain, smug{}, done } — 옛 저장에는 없으므로 st()가 만든다 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var CO = G.Company = {};
  function K() { return G.BALANCE.company; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  function city(id) { return G.CITY_DATA[id]; }
  function num(n) { return U.num(Math.round(n)); }
  function cobj(co) { return typeof co === 'string' ? G.COMPANY[co] : co; }
  function st() {
    var s = S(); if (!s) return null;
    var b = s.company || (s.company = { member: null, rank: 0, merit: 0, joined: 0, cool: 0, done: 0 });
    ['shares', 'basis', 'px', 'shock', 'quota', 'posts', 'took', 'smug'].forEach(function (k) { if (!b[k] || typeof b[k] !== 'object') b[k] = {}; });
    if (!Array.isArray(b.ev)) b.ev = [];
    return b;
  }
  CO.state = st;
  function log(t) { G.State.log(t); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function dist(a, b) { return G.Geo.dist(a.lon, a.lat, b.lon, b.lat); }
  function days(a, b) { return Math.max(6, Math.round(dist(a, b) / 1.05)); }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function rngOf(seed) { var h = (U.strHash(String(seed)) >>> 0) || 1; return function () { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; }; }
  function lerpTable(tab, x) {
    if (x <= tab[0][0]) return tab[0][1];
    for (var i = 1; i < tab.length; i++) if (x <= tab[i][0]) { var a = tab[i - 1], z = tab[i]; return a[1] + (z[1] - a[1]) * (x - a[0]) / (z[0] - a[0]); }
    return tab[tab.length - 1][1];
  }
  /** 시대 배수: 임무 보수·귀띔 값이 시대에 따라 커진다 */
  CO.eraK = function () { return lerpTable(K().eraK, S().date.y + (S().date.m - 1) / 12); };
  function nationName() { var n = S().player.nation; return { PT: '포르투갈', ES: '카스티야' }[n] || n; }
  function cargoQ(id) { var cg = S().fleet.cargo[id]; return cg ? cg.q : 0; }
  function takeCargo(id, q, c) {
    var f = S().fleet, cg = f.cargo[id]; if (!cg || q <= 0) return 0;
    q = Math.min(q, cg.q);
    R.takeCargoLots(cg, c ? c.id : 'x', q, 0);
    cg.q -= q; if (cg.q <= 0) delete f.cargo[id];
    return q;
  }
  function addCargo(id, q, price, cityId) {
    var s = S(), f = s.fleet, cg = f.cargo[id];
    if (cg) { R.addCargoLot(cg, cityId, q, price); cg.cost = Math.round((cg.cost * cg.q + price * q) / (cg.q + q)); cg.d = Math.round(((cg.d || s.day) * cg.q + s.day * q) / (cg.q + q)); cg.q += q; }
    else { f.cargo[id] = { q: q, cost: price, from: cityId, d: s.day }; R.cargoLots(f.cargo[id]); }
  }
  CO.takeCargo = takeCargo; CO.addCargo = addCargo;
  /** 회사 사람(서기·상관장·세관원·중개인): 외국 상인을 늘 상대하니 말이 통한다 · co를 주면 그 회사 나라 얼굴 */
  function staff(id, title, co, role) {
    var C = G.Scenes && G.Scenes.city, sp = C && C.npc ? C.npc(id, title) : { name: title };
    delete sp.li; delete sp.lang;
    if (co && G.Art && G.Art.npcSpec) { try { sp.portrait = G.Art.npcSpec('co:' + co.id + ':' + (S().loc.city || 0) + ':' + id, role || (id === 'trader' || id === 'vendor' ? 'merchant' : 'official'), co.id === 'pt' || co.id === 'es' ? 'ib' : 'ne', 'm'); sp.half = null; } catch (e) { console.error(e); } }
    return sp;
  }
  CO.staff = staff;

  // ================================================================ 회사·상관
  CO.active = function (co) { co = cobj(co); return !!(co && S() && today() >= co.from); };
  CO.actives = function () { return G.COMPANIES.filter(CO.active); };
  /** 이 회사의 지금 열린 상관 [{c, g, mine}] — 역사의 상관 + 제독이 세운 상관 */
  CO.posts = function (co) {
    co = cobj(co); if (!CO.active(co)) return [];
    var y = S().date.y, out = [];
    co.posts.forEach(function (p) { var c = city(p.c); if (c && y >= p.y && (!p.to || y < p.to) && R.cityExists(c)) out.push({ c: p.c, g: p.g }); });
    (st().posts[co.id] || []).forEach(function (p) { if (!out.some(function (o) { return o.c === p.c; }) && R.cityExists(city(p.c))) out.push({ c: p.c, g: p.g, mine: true }); });
    return out;
  };
  CO.postAt = function (co, cityId) { return CO.posts(co).filter(function (p) { return p.c === cityId; })[0] || null; };
  CO.factoriesAt = function (cityId) { return CO.actives().filter(function (co) { return co.hq !== cityId && CO.postAt(co, cityId); }); };
  CO.hqsAt = function (cityId) { return CO.actives().filter(function (co) { return co.hq === cityId; }); };
  CO.exchangeAt = function (cityId) { var t = today(); return K().exchanges.filter(function (x) { return x.c === cityId && t >= x.from && t < x.to; })[0] || null; };
  /** 이 회사의 건물이 이 도시에 있나 (본부 또는 상관) */
  CO.presentAt = function (co, cityId) { co = cobj(co); return !!(co && CO.active(co) && (co.hq === cityId || CO.postAt(co, cityId))); };
  /** 거리에 세울 건물 (js/scenes/city.js C.buildings) */
  CO.buildings = function (c) {
    if (!S() || !c) return [];
    var out = [];
    CO.hqsAt(c.id).forEach(function (co) { out.push({ kind: 'company', arg: co.id, name: co.hqName, icon: 'seal' }); });
    var fs = CO.factoriesAt(c.id);
    if (fs.length) out.push({ kind: 'factory', name: fs.length === 1 ? fs[0].short + ' 상관' : '회사 상관', icon: 'flag' });
    var ex = CO.exchangeAt(c.id); if (ex) out.push({ kind: 'exchange', name: ex.name, icon: 'chart' });
    return out;
  };

  // ================================================================ 회원
  CO.me = function () { var b = st(); return b && b.member ? G.COMPANY[b.member] || null : null; };
  CO.isMember = function (co) { var b = st(); co = cobj(co); return !!(b && co && b.member === co.id); };
  CO.rival = function (co) { var b = st(); co = cobj(co); return !!(b && co && b.member && b.member !== co.id); };
  CO.rank = function (co) { var b = st(); return CO.isMember(co) ? b.rank : 0; };
  CO.rankName = function (co, r) { co = cobj(co); return ((co && co.ranks) || K().rankNames)[r] || K().rankNames[r]; };
  CO.perk = function (r) { return K().ranks[Math.max(0, Math.min(4, r || 0))]; };
  CO.founder = function (co) {
    var s = S(), e = s.eindia || {}, w = s.colonyCo || {};
    return { eic: e.eic > 0, voc: e.voc > 0, wic: w.wic > 0, fr: w.fr > 0 }[cobj(co).id] || false;
  };
  CO.fee = function (co) {
    co = cobj(co); var k = K(), b = st();
    var f = co.fee * (co.nation === nationName() ? 1 : k.foreignK) * (1 + k.smuggleFeeK * (b.smug[co.id] || 0));
    return Math.round(f / 100) * 100;
  };
  /** 입회할 수 없는 까닭 (없으면 '') */
  CO.joinBlock = function (co) {
    co = cobj(co); var b = st(), s = S(), k = K();
    if (!CO.active(co)) return '아직 세워지지 않은 회사다.';
    if (b.member === co.id) return '이미 이 회사 사람이다.';
    if (b.member) return '이미 ' + G.COMPANY[b.member].name + U.jx(G.COMPANY[b.member].name, '에') + ' 속해 있다. 먼저 그 회사를 떠나야 한다.';
    if (b.cool > s.day) return '회사를 떠난 지 한 해가 지나지 않았다 (' + (b.cool - s.day) + '일 남음).';
    if (s.player.fame < k.joinFame) return '명성이 모자란다 (통합 명성 ' + num(k.joinFame) + ' 이상).';
    if (!CO.founder(co) && s.player.gold < CO.fee(co)) return '출자금 금화 ' + num(CO.fee(co)) + '닢이 모자란다.';
    return '';
  };
  CO.join = function (co) {
    co = cobj(co); if (CO.joinBlock(co)) return null;
    var b = st(), s = S(), k = K(), founder = CO.founder(co), fee = founder ? 0 : CO.fee(co), p = CO.px(co.id);
    var stake = founder ? co.fee * k.joinShare : fee * k.joinShare, n = Math.max(1, Math.floor(stake / p));
    s.player.gold -= fee;
    b.member = co.id; b.rank = 1; b.merit = founder ? k.founderMerit : 0; b.joined = s.day; b.chain = null;
    if (b.mission && b.mission.co !== co.id) b.mission = null;
    b.shares[co.id] = (b.shares[co.id] || 0) + n; b.basis[co.id] = (b.basis[co.id] || 0) + Math.round(founder ? 0 : stake);
    log(co.name + U.jx(co.name, '에') + ' 입회했다' + (founder ? ' (설립 때의 출자로)' : ' (출자금 금화 ' + num(fee) + '닢)') + '. ' + co.cert + ' ' + n + '주를 받았다.');
    refresh();
    return { fee: fee, shares: n, founder: founder };
  };
  CO.leave = function () {
    var b = st(), co = CO.me(); if (!co) return false;
    log(co.name + U.jx(co.name, '을/를') + ' 떠났다. (' + CO.rankName(co, b.rank) + ' · 공헌 ' + num(b.merit) + ')');
    b.member = null; b.rank = 0; b.merit = 0; b.cool = S().day + K().leaveCool; b.chain = null;
    if (b.mission && b.mission.co === co.id) b.mission = null;
    refresh();
    return true;
  };
  /** 다음 계급과 모자란 것 */
  CO.next = function () {
    var b = st(), co = CO.me(); if (!co || b.rank >= 4) return null;
    var r = b.rank + 1, need = CO.perk(r), sh = b.shares[co.id] || 0;
    return { rank: r, name: CO.rankName(co, r), merit: need.merit, shares: need.shares, haveMerit: b.merit, haveShares: sh, ok: b.merit >= need.merit && sh >= need.shares };
  };
  CO.promote = function () { var nx = CO.next(); if (!nx || !nx.ok) return false; st().rank = nx.rank; log(CO.me().name + '의 ' + nx.name + U.jx(nx.name, '이/가') + ' 되었다.'); refresh(); return nx; };
  /** 경쟁사 주식을 내 회사 주식보다 많이 쥐었나 (공헌이 덜 쌓인다) */
  CO.doubted = function () {
    var b = st(), co = CO.me(); if (!co) return false;
    var own = (b.shares[co.id] || 0) * CO.px(co.id), other = 0;
    CO.actives().forEach(function (x) { if (x.id !== co.id) other += (b.shares[x.id] || 0) * CO.px(x.id); });
    return other > 20000 && other > own;
  };
  CO.addMerit = function (n) {
    var b = st(); if (!b.member || !(n > 0)) return 0;
    var before = CO.next(); n = Math.round(n * (CO.doubted() ? 0.8 : 1));
    b.merit += n;
    var after = CO.next();
    if (after && after.ok && !(before && before.ok)) UI.toast(CO.me().hqName + '에서 ' + after.name + ' 승진 심사를 받을 수 있다.', 'seal', 5200);
    return n;
  };

  // ================================================================ 주식
  function curve(co, y) { return lerpTable(co.curve, y); }
  function yNow() { var d = S().date; return d.y + (d.m - 1) / 12; }
  function row(co) {
    co = cobj(co); var b = st(), r = b.px[co.id];
    if (!r || !(r.p > 0)) r = b.px[co.id] = seedRow(co);
    if (!(r.h > 0)) r.h = 1; if (!Array.isArray(r.hist)) r.hist = [Math.round(r.p)];
    return r;
  }
  /** 처음 볼 때: 지난 4년의 주가를 곡선 둘레로 지어 둔다 (새 일지·옛 저장에서도 시세 그림이 바로 보이게) */
  function seedRow(co) {
    var y0 = yNow(), fy = Math.floor(co.from / 10000) + (Math.floor(co.from / 100) % 100 - 1) / 12, rng = rngOf('px:' + co.id + ':' + Math.floor(y0 * 12)), w = 1, hist = [];
    for (var i = K().stock.hist - 1; i >= 0; i--) {
      var yy = y0 - i / 12; if (yy < fy) continue;
      var u = Math.max(1e-9, rng()), v = rng(), z = Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v);
      w = Math.pow(w, 0.8) * Math.exp(K().stock.sigma * z);
      hist.push(Math.round(co.face * curve(co, yy) * w));
    }
    if (!hist.length) hist.push(Math.round(co.face * curve(co, y0)));
    return { p: hist[hist.length - 1], h: 1, hist: hist };
  }
  CO.px = function (co) { return CO.active(co) ? row(co).p : cobj(co).face; };
  CO.ask = function (co) { return Math.max(1, Math.round(CO.px(co) * (1 + K().stock.spread))); };
  CO.bid = function (co) { return Math.max(1, Math.round(CO.px(co) * (1 - K().stock.spread))); };
  CO.hist = function (co) { return CO.active(co) ? row(co).hist.slice() : []; };
  CO.health = function (co) { return CO.active(co) ? row(co).h : 1; };
  /** 지난달보다 얼마나 (비율) */
  CO.change = function (co) { var h = CO.hist(co); if (h.length < 2) return 0; var a = h[h.length - 2]; return a ? (CO.px(co) - a) / a : 0; };
  /** 한 주의 한 해 배당 (지금 형편대로라면) */
  CO.divPer = function (co) { co = cobj(co); var cv = curve(co, yNow()); return co.face * co.yld * U.clamp(CO.health(co), 0.4, 1.8) * (cv < 1 ? cv : Math.sqrt(cv)); };   // 기우는 회사는 배당도 곡선만큼 준다
  /** 형편과 주가를 함께 출렁인다 — d: +0.08이면 8% 오름. 돌려주는 값: 주가가 바뀐 비율 */
  CO.move = function (co, d) {
    co = cobj(co); if (!CO.active(co) || !d) return 0;
    var r = row(co), k = K().stock;
    r.p = Math.max(1, r.p * (1 + d));
    r.h = U.clamp(r.h + d, k.hMin, k.hMax);
    return d;
  };
  function gauss() { var u = Math.max(1e-9, U.rand()), v = U.rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); }
  function monthStep(co) {
    var r = row(co), k = K().stock, F = co.face * curve(co, yNow()) * r.h;
    r.p = U.clamp(r.p * Math.exp(k.sigma * gauss()) * Math.pow(F / r.p, k.pull), F * 0.15, F * 6);
    r.hist.push(Math.round(r.p)); if (r.hist.length > k.hist) r.hist.splice(0, r.hist.length - k.hist);
    r.h = 1 + (r.h - 1) * k.hDecay;
    if (U.chance(k.evChance)) {
      var ps = CO.posts(co), ev = U.pick(G.COMPANY_EVENTS);
      st().ev.push({ co: co.id, id: ev.id, at: S().day + U.ri(k.evLead[0], k.evLead[1]), post: ps.length ? U.pick(ps).c : co.hq, known: false });
    }
  }
  function fill(t, ev) { var co = G.COMPANY[ev.co], p = city(ev.post); return t.replace(/\{co\}/g, co.short).replace(/\{post\}/g, p ? p.name : '먼 바다'); }
  CO.evText = function (ev, tip) { var d = G.COMPANY_EVENTS.filter(function (x) { return x.id === ev.id; })[0]; return d ? fill(tip ? d.tip : d.text, ev) : ''; };
  function cares(coId) { var b = st(); return b.member === coId || (b.shares[coId] || 0) > 0; }
  function pct(d) { return (d >= 0 ? '+' : '') + Math.round(d * 100) + '%'; }
  /** 달이 바뀌면: 주가 · 다가온 일 · 세상의 큰 사건 · 1월 배당 (G.World.daily에 걸려 날마다 불린다) */
  CO.tick = function () {
    var s = S(), b = st(); if (!b) return [];
    var out = [], key = s.date.y * 12 + (s.date.m - 1);
    if (!b.pm) b.pm = key;
    var steps = Math.min(24, key - b.pm), jan = false;
    for (var i = 1; i <= steps; i++) {
      CO.actives().forEach(monthStep);
      if ((b.pm + i) % 12 === 0) jan = true;
    }
    if (steps > 0) b.pm = key;
    // 다가온 일
    for (var e = b.ev.length - 1; e >= 0; e--) {
      var ev = b.ev[e]; if (ev.at > s.day) continue;
      b.ev.splice(e, 1);
      var d0 = G.COMPANY_EVENTS.filter(function (x) { return x.id === ev.id; })[0]; if (!d0 || !CO.active(ev.co)) continue;
      var d = CO.move(ev.co, d0.d * U.rf(0.7, 1.3));
      if (cares(ev.co)) out.push({ icon: 'chart', text: CO.evText(ev) + ' (' + G.COMPANY[ev.co].short + ' 주가 ' + pct(d) + ')' });
    }
    // 세상의 큰 사건
    var t = today();
    G.COMPANY_SHOCKS.forEach(function (x, j) {
      if (b.shock[j] || t < x[1]) return;
      b.shock[j] = 1;
      if (!CO.active(x[0]) || t - x[1] > 10000) return;   // 아주 오래전 일(새 일지)은 곡선에 이미 들어 있다
      CO.move(x[0], x[2]);
      if (cares(x[0])) out.push({ icon: 'chart', text: x[3] + ' (' + G.COMPANY[x[0]].short + ' 주가 ' + pct(x[2]) + ')' });
    });
    if (jan) out = out.concat(payDividends());
    return out;
  };
  function payDividends() {
    var b = st(), s = S(), out = [], tot = 0, parts = [];
    CO.actives().forEach(function (co) {
      var n = b.shares[co.id] || 0; if (n <= 0) return;
      var g = Math.round(n * CO.divPer(co)); if (g <= 0) return;
      tot += g; parts.push(co.short + ' ' + n + '주 ' + num(g) + '닢');
    });
    if (tot) { s.player.gold += tot; out.push({ icon: 'coin', text: '한 해 배당을 받았다 — ' + parts.join(' · ') + ' (금화 +' + num(tot) + ')' }); log('한 해 주식 배당 금화 ' + num(tot) + '닢 (' + parts.join(' · ') + ')'); }
    var co = CO.me(), sal = co ? CO.perk(b.rank).salary : 0;
    if (sal) { sal = Math.round(sal * CO.eraK()); s.player.gold += sal; out.push({ icon: 'seal', text: co.short + ' ' + CO.rankName(co, b.rank) + '의 한 해 보수 금화 ' + num(sal) + '닢' }); }
    return out;
  }
  CO.buy = function (co, n) {
    co = cobj(co); var b = st(), s = S(), k = K().stock;
    n = Math.max(0, Math.min(Math.floor(n), k.cap - (b.shares[co.id] || 0)));
    var cost = n * CO.ask(co); if (!n || s.player.gold < cost) return 0;
    s.player.gold -= cost; b.shares[co.id] = (b.shares[co.id] || 0) + n; b.basis[co.id] = (b.basis[co.id] || 0) + cost;
    log(co.name + ' ' + co.cert + ' ' + n + '주를 금화 ' + num(cost) + '닢에 샀다.');
    return cost;
  };
  CO.sell = function (co, n) {
    co = cobj(co); var b = st(), s = S(), have = b.shares[co.id] || 0;
    n = Math.max(0, Math.min(Math.floor(n), have)); if (!n) return 0;
    var got = n * CO.bid(co);
    b.basis[co.id] = Math.round((b.basis[co.id] || 0) * (have - n) / have);
    b.shares[co.id] = have - n; if (!b.shares[co.id]) { delete b.shares[co.id]; delete b.basis[co.id]; }
    s.player.gold += got;
    log(co.name + ' ' + co.cert + ' ' + n + '주를 금화 ' + num(got) + '닢에 팔았다.');
    return got;
  };
  CO.holdings = function () {
    var b = st(); if (!b) return [];
    return Object.keys(b.shares).filter(function (id) { return G.COMPANY[id] && b.shares[id] > 0; }).map(function (id) {
      var n = b.shares[id], p = CO.px(id), v = n * p, bs = b.basis[id] || 0;
      return { co: G.COMPANY[id], n: n, p: p, value: v, basis: bs, pl: v - bs };
    });
  };
  /** 중개인의 귀띔: 다가오는 일 하나 (맞을 수도, 틀릴 수도) */
  CO.tip = function () {
    var b = st(), s = S(), k = K().stock;
    var list = b.ev.filter(function (e) { return !e.known && e.at - s.day <= k.tipDays && CO.active(e.co); }).sort(function (a, z) { return a.at - z.at; });
    var e = list[0]; if (!e) return null;
    e.known = true;
    var truth = U.chance(k.tipOk), d0 = G.COMPANY_EVENTS.filter(function (x) { return x.id === e.id; })[0];
    var shown = e;
    if (!truth) { var opp = G.COMPANY_EVENTS.filter(function (x) { return (x.d > 0) !== (d0.d > 0); }); shown = Object.assign({}, e, { id: U.pick(opp).id }); }
    return { co: G.COMPANY[e.co], text: CO.evText(shown, true), up: G.COMPANY_EVENTS.filter(function (x) { return x.id === shown.id; })[0].d > 0, days: e.at - s.day };
  };

  // ================================================================ 회사 창고 (상관의 원가 할당)
  CO.quotaLeft = function (co, cityId) {
    var b = st(), r = CO.rank(co), q = CO.perk(r).quota; if (!q) return 0;
    if (G.Influence) q = Math.round(q * G.Influence.mult(city(cityId), null, 'quota'));   // 항구 영향도만큼 할당이 늘어난다 (js/systems/influence.js)
    var per = Math.floor(S().day / K().quotaDays), e = b.quota[cityId];
    if (!e || e.per !== per || e.co !== cobj(co).id) return q;
    return Math.max(0, q - e.used);
  };
  CO.useQuota = function (co, cityId, n) {
    var b = st(), per = Math.floor(S().day / K().quotaDays), e = b.quota[cityId];
    if (!e || e.per !== per || e.co !== cobj(co).id) e = b.quota[cityId] = { per: per, used: 0, co: cobj(co).id };
    e.used += n;
  };
  CO.costPrice = function (c, id) { return Math.max(1, Math.round(R.buyPrice(c, id) * K().costK)); };
  CO.quotaRenew = function () { var d = K().quotaDays; return d - (S().day % d); };
  /** 회사 창고에서 원가로 싣는다 — 치른 금화 (못 사면 0) */
  CO.buyWarehouse = function (c, co, id, q) {
    co = cobj(co); var s = S(), post = CO.postAt(co, c.id); if (!CO.isMember(co) || !post || post.g.indexOf(id) < 0) return 0;
    var price = CO.costPrice(c, id);
    q = Math.min(Math.floor(q), CO.quotaLeft(co, c.id), Math.floor(s.player.gold / price), Math.max(0, Math.floor(R.free())));
    if (q < 1) return 0;
    if (!s.fleet.cargo[id] && Object.keys(s.fleet.cargo).length >= R.maxKinds()) return 0;
    s.player.gold -= q * price; addCargo(id, q, price, c.id); CO.useQuota(co, c.id, q);
    s.stats.trades = (s.stats.trades || 0) + 1;
    if (G.Influence) { G.Influence.add(c, q / G.BALANCE.influence.act.warehouse, co); }   // 항구 영향도의 실적 (js/systems/influence.js)
    log(c.name + '의 ' + co.short + ' 회사 창고에서 ' + G.GOOD[id].name + ' ' + q + '통을 원가 금화 ' + num(q * price) + '닢에 실었다.');
    return q * price;
  };
  /** 본부에 독점품을 넘긴다 — {value, merit} */
  CO.deliverMono = function (c, co, id, q) {
    co = cobj(co); var s = S(); if (!CO.isMember(co) || co.hq !== c.id || co.mono.indexOf(id) < 0) return { value: 0, merit: 0 };
    q = Math.min(Math.floor(q), cargoQ(id)); if (q < 1) return { value: 0, merit: 0 };
    var price = CO.monoPrice(c, co, id), value = q * price;
    takeCargo(id, q, c); s.player.gold += value;
    var mer = CO.addMerit(Math.round(value / 1500));
    if (G.Influence) G.Influence.add(c, value / G.BALANCE.influence.act.mono, co);
    fame('tr', Math.round(value / 8000));
    if (G.Growth && G.Growth.sell) { try { G.Growth.sell(value); } catch (e) { console.error(e); } }
    log(co.hqName + '에 독점품 ' + G.GOOD[id].name + ' ' + q + '통을 넘기고 금화 ' + num(value) + '닢을 받았다.');
    return { value: value, merit: mer };
  };

  // ================================================================ 독점품
  /** 회원이 본부에 넘기는 독점품 값 */
  CO.monoPrice = function (c, co, id) { return Math.max(1, Math.round(R.sellPrice(c, id) * CO.perk(CO.rank(co)).premium)); };
  CO.monoHeld = function (co) { co = cobj(co); return co.mono.filter(function (id) { return cargoQ(id) > 0; }); };
  CO.isMono = function (id) { return CO.actives().filter(function (co) { return co.mono.indexOf(id) >= 0; }); };

  /** 세관: 회사 본부 항구에 비회원이 그 회사 독점품을 싣고 바다로 들어왔다 */
  CO.customs = async function (c) {
    var b = st(), s = S(), k = K().customs;
    var cos = CO.hqsAt(c.id).filter(function (co) { return !CO.isMember(co); });
    var goods = [], chance = 0;
    cos.forEach(function (co) {
      var held = CO.monoHeld(co); if (!held.length) return;
      chance = Math.max(chance, CO.rival(co) ? k.rival : k.chance);
      held.forEach(function (id) { if (goods.indexOf(id) < 0) goods.push(id); });
    });
    if (!goods.length || b.insp === s.day || !U.chance(chance)) return false;
    b.insp = s.day;
    var owner = cos.filter(function (co) { return co.mono.some(function (id) { return goods.indexOf(id) >= 0; }); });
    var names = owner.map(function (co) { return co.short; }).join('·');
    var value = 0; goods.forEach(function (id) { value += cargoQ(id) * R.sellPrice(c, id); });
    var duty = Math.round(value * k.duty), bribe = Math.max(k.bribeMin, Math.round(value * k.bribe));
    var off = staff('harbormaster', names + ' 세관원');
    var list = goods.map(function (id) { return G.GOOD[id].name + ' ' + cargoQ(id) + '통'; }).join(', ');
    await UI.say('잠깐! ' + names + '의 특허로, 이 항구에 들어오는 ' + goods.map(function (id) { return G.GOOD[id].name; }).join('·') + U.jx(G.GOOD[goods[goods.length - 1]].name, '은/는') + ' 회사만 들여올 수 있소. 짐칸을 보여 주시오.', off);
    var sp = R.skill('speech') || 0, ac = R.skill('acct') || 0;
    var v = await UI.ask('세관원이 짐칸을 뒤지려 한다 — ' + list + ' (시세 약 ' + num(value) + '닢)', [
      { label: '신고하고 관세를 낸다 (금화 ' + num(duty) + '닢)', value: 'duty', dis: s.player.gold < duty },
      { label: '세관원에게 금화 ' + num(bribe) + '닢을 쥐여 준다', value: 'bribe', dis: s.player.gold < bribe },
      { label: '짐을 숨긴다 (회계 ' + ac + ')', value: 'hide' }], off);
    var caught = false;
    if (v === 'duty' && s.player.gold >= duty) {
      s.player.gold -= duty;
      await UI.say('좋소, 장부에 적었소. 다음에는 회사 사람이 되어 오시오. 그러면 이런 셈은 없을 테니.', off);
      log(c.name + ' 세관에서 독점품(' + list + ')의 관세 금화 ' + num(duty) + '닢을 냈다.');
    } else if (v === 'bribe' && s.player.gold >= bribe) {
      s.player.gold -= bribe;
      if (U.chance(k.bribeOk + 0.07 * sp)) { await UI.say('(주머니를 슬쩍 만지며) …흠, 짐칸에 별것 없군. 지나가시오.', off); log(c.name + ' 세관원에게 금화 ' + num(bribe) + '닢을 쥐여 주고 독점품을 들여왔다.'); }
      else { await UI.say('이게 무슨 짓이오! 회사의 세관원을 돈으로 사려 하다니!', off); caught = true; }
    } else {
      if (U.chance(Math.min(0.85, k.hideOk + 0.1 * ac))) { await UI.say('…장부와 짐이 맞는군. 가시오.', off); UI.toast('세관원이 숨긴 짐을 찾지 못했다.', 'sack', 4200); }
      else { await UI.say('바닥 널 밑에 이게 뭐요? 밀수로군!', off); caught = true; }
    }
    if (caught) {
      var fine = Math.min(s.player.gold, Math.max(k.fineMin, Math.round(value * k.fine)));
      goods.forEach(function (id) { delete s.fleet.cargo[id]; });
      s.player.gold -= fine; s.player.notoriety = (s.player.notoriety || 0) + k.noto;
      owner.forEach(function (co) { b.smug[co.id] = (b.smug[co.id] || 0) + 1; });
      await UI.alert('밀수로 걸렸다! ' + U.esc(list) + U.jx(list, '을/를') + ' 모두 빼앗기고 벌금 금화 ' + num(fine) + '닢을 냈다.<br><span class="muted">악명 +' + k.noto + ' · ' + U.esc(names) + '에 들 때 출자금이 늘어난다</span>', '세관 — 몰수');
      log(c.name + ' 세관에서 밀수로 걸려 ' + list + U.jx(list, '을/를') + ' 빼앗기고 벌금 금화 ' + num(fine) + '닢을 냈다.');
    }
    refresh();
    return true;
  };

  // ================================================================ 중개 주문서
  function portPosts(co, exceptId) {
    return CO.posts(co).filter(function (p) { var c = city(p.c); return c && c.port && p.c !== exceptId; });
  }
  /** 주문서가 닿을 수 있는 곳: 그 회사의 상관 + 상관이 있는 바다(유럽 밖)의 큰 항구 (거래처) */
  CO.chainDests = function (co, c) {
    co = cobj(co); var k = K(), posts = portPosts(co).map(function (p) { return p.c; }), regs = {};
    posts.forEach(function (id) { var r = city(id).region; if (r > 1) regs[r] = 1; });
    return G.CITY_DATA.filter(function (t) {
      if (!t.port || t.id === c.id || !R.cityExists(t) || t.colony != null || t.outpost) return false;
      if (posts.indexOf(t.id) < 0 && !(regs[t.region] && t.size >= 2)) return false;
      var d = dist(c, t); return d >= k.legDist[0] && d <= k.legDist[1];
    });
  };
  CO.isPost = function (co, cityId) { return !!CO.postAt(co, cityId); };
  /** 이 도시에서 시작하는 고리 하나 (오늘 이 도시에서는 같은 것) */
  CO.legOffer = function (c, co, leg) {
    co = cobj(co); var k = K(), s = S(), rng = rngOf('leg:' + co.id + ':' + c.id + ':' + s.day + ':' + leg);
    var dests = CO.chainDests(co, c);
    if (!dests.length) return null;
    var goods = R.cityGoods(c).filter(function (id) { var g = G.GOOD[id]; return g && !(g.life > 0 && g.life < 150) && !(G.Slave && G.Slave.is && G.Slave.is(id)) && !(G.Sakoku && G.Sakoku.tradeBlock(c, id, 'buy')); });
    if (!goods.length) return null;
    var best = [];
    dests.forEach(function (t) {
      goods.forEach(function (id) {
        if (G.Sakoku && G.Sakoku.tradeBlock(t, id, 'sell')) return;
        var sp = R.sellPrice(t, id), bp = R.buyPrice(c, id);   // 값진 짐을 고른다: 한 통에 남는 값 (상관이면 조금 더 쳐준다)
        if (sp / bp > 1.05) best.push({ t: t, g: id, r: (sp - bp) * (CO.isPost(co, t.id) ? 1.15 : 1) });
      });
    });
    if (!best.length) return null;
    best.sort(function (a, z) { return z.r - a.r; });
    var o = best[Math.floor(rng() * Math.min(3, best.length))];
    var r = Math.max(1, CO.rank(co));
    return { to: o.t.id, g: o.g, q: k.chainQty[r] || k.chainQty[1], mult: k.chainMult[Math.min(k.chainMult.length - 1, leg - 1)], days: Math.round(days(c, o.t) * k.legDayK + k.legDayAdd), leg: leg };
  };
  CO.chainTake = function (c, co, o) {
    co = cobj(co); var b = st();
    b.chain = { co: co.id, leg: o.leg, max: CO.perk(CO.rank(co)).chain, from: c.id, to: o.to, g: o.g, q: o.q, mult: o.mult, limit: S().day + o.days, pot: 0, paid: 0, path: [c.id] };
    log(co.short + ' 중개 주문서 — ' + c.name + '의 ' + G.GOOD[o.g].name + ' ' + o.q + '통을 ' + city(o.to).name + ' 상관에 넘긴다 (고리 ' + o.leg + ').');
    return b.chain;
  };
  /** 지금 도시에서 납품할 수 있나 */
  CO.chainHere = function (c) { var ch = st() && st().chain; return !!(ch && c && ch.to === c.id && CO.isMember(ch.co)); };
  CO.chainDeliver = function (c) {
    var b = st(), ch = b.chain; if (!ch || ch.to !== c.id || cargoQ(ch.g) < ch.q) return null;
    var price = R.sellPrice(c, ch.g), value = ch.q * price, bonus = Math.round(value * (ch.mult - 1));
    takeCargo(ch.g, ch.q, c);
    S().player.gold += value; ch.pot += bonus; ch.paid += value; ch.path.push(c.id);
    var mer = CO.addMerit(K().chainMerit * ch.leg);
    if (G.Influence) G.Influence.add(c, G.BALANCE.influence.act.chain, ch.co);
    fame('tr', Math.round(value / 6000));
    log(G.COMPANY[ch.co].short + ' 중개 주문서 고리 ' + ch.leg + ' — ' + c.name + ' 상관에 ' + G.GOOD[ch.g].name + ' ' + ch.q + '통을 넘기고 금화 ' + num(value) + '닢 (연계 보너스 +' + num(bonus) + ').');
    return { value: value, bonus: bonus, pot: ch.pot, merit: mer, last: ch.leg >= ch.max };
  };
  /** 다음 고리를 잇는다 */
  CO.chainNext = function (c, o) {
    var ch = st().chain; if (!ch || !o) return null;
    ch.leg = o.leg; ch.from = c.id; ch.to = o.to; ch.g = o.g; ch.q = o.q; ch.mult = o.mult; ch.limit = S().day + o.days;
    return ch;
  };
  /** 정산한다 (끝까지 이었으면 보너스 × jackpot) */
  CO.chainCash = function (full) {
    var b = st(), ch = b.chain; if (!ch) return 0;
    var g = Math.round(ch.pot * (full ? K().jackpot : 1));
    S().player.gold += g; b.chain = null;
    if (full) { CO.addMerit(K().jackpotMerit); CO.move(ch.co, K().moves.chain); }
    log(G.COMPANY[ch.co].short + ' 중개 주문서를 정산했다 — 고리 ' + ch.leg + '개 · 연계 보너스 금화 ' + num(g) + '닢' + (full ? ' (끝까지 이었다 ×' + K().jackpot + ')' : '') + '.');
    return g;
  };
  CO.chainDrop = function () { var b = st(), ch = b.chain; if (!ch) return 0; b.chain = null; log('중개 주문서를 찢었다. 쌓인 연계 보너스 금화 ' + num(ch.pot) + '닢이 날아갔다.'); return ch.pot; };

  // ================================================================ 회사 임무
  CO.KINDS = {
    patrol: { name: '밀수 단속', icon: 'sword' },
    convoy: { name: '귀환 대선단', icon: 'ship' },
    found: { name: '상관 건설', icon: 'hammer' },
    prize: { name: '경쟁사 나포', icon: 'target' }
  };
  /** 이 건물(본부 또는 상관)의 임무 게시판 — 30일마다 새로, 받은 것은 빠진다 */
  CO.offers = function (c, co) {
    co = cobj(co); var b = st(), s = S(), k = K();
    if (!CO.presentAt(co, c.id) || CO.rival(co)) return [];
    var r = CO.rank(co), member = r > 0, per = Math.floor(s.day / k.offerDays), rng = rngOf('off:' + co.id + ':' + c.id + ':' + per);
    var payK = CO.perk(r).payK * CO.eraK(), out = [], big = [];
    var hq = city(co.hq), far = c.port && dist(c, hq) >= k.convoy.minDist && c.id !== co.hq;
    if (member && r >= k.convoy.rank && far) big.push('convoy');
    if (member && r >= k.found.rank) big.push('found');
    if (member && r >= k.prize.rank) big.push('prize');
    for (var j = big.length - 1; j > 0; j--) { var x = Math.floor(rng() * (j + 1)), tmp = big[j]; big[j] = big[x]; big[x] = tmp; }
    // 굵직한 일 둘 + 단속 하나 (굵직한 일이 안 되면 남은 것으로 채운다)
    var kinds = big.slice(0, k.offers - 1).concat(['patrol'], big.slice(k.offers - 1));
    for (var i = 0; i < kinds.length && out.length < k.offers; i++) {
      var o = make(kinds[i], c, co, rng, payK, member);
      if (!o) continue;
      o.key = co.id + ':' + c.id + ':' + per + ':' + kinds[i];
      if (b.took[o.key]) continue;
      out.push(o);
    }
    return out;
  };
  function make(kind, c, co, rng, payK, member) {
    var k = K(), s = S(), o = { kind: kind, co: co.id, from: c.id, free: !member };
    if (kind === 'patrol') {
      var ts = portPosts(co).map(function (p) { return city(p.c); }).concat([city(co.hq)]).filter(function (t) { return t.port && dist(c, t) <= k.patrol.dist; });
      if (!ts.length) return null;
      var t = pick(rng, ts), n = k.patrol.n[0] + Math.floor(rng() * (k.patrol.n[1] - k.patrol.n[0] + 1));
      o.at = t.id; o.n = n; o.got = 0;
      o.pay = Math.round((k.patrol.pay[0] + k.patrol.pay[1] * n) * payK / 100) * 100;
      o.merit = member ? k.patrol.merit[0] + k.patrol.merit[1] * n : 0;
      o.days = days(c, t) + 60 + n * 15;
      o.title = t.name + ' 앞바다의 밀수선·경쟁사 배 ' + n + '척을 쳐부순다';
      o.desc = '회사의 독점을 갉아먹는 밀수선과 경쟁사 무장 상선이 ' + t.name + ' 둘레에 드나든다. 그 앞바다(' + k.patrol.near + '° 안)에 가면 나타난다.' + (member ? '' : ' — 회사 사람이 아니라 보수는 60%, 공헌은 없다.');
    } else if (kind === 'convoy') {
      var hq = city(co.hq), ships = k.convoy.ships[0] + Math.floor(rng() * (k.convoy.ships[1] - k.convoy.ships[0] + 1));
      o.to = co.hq; o.ships = ships; o.ships0 = ships;
      o.value = Math.round(ships * (k.convoy.value[0] + rng() * (k.convoy.value[1] - k.convoy.value[0])) * payK / 100) * 100;
      o.pay = Math.round(o.value * k.convoy.fee * (1 + k.convoy.safe));
      o.merit = k.convoy.merit[0] + k.convoy.merit[1] * ships;
      o.raids = k.convoy.raids + (ships >= 5 ? 1 : 0);
      o.days = Math.round(days(c, hq) * 1.6) + 30;
      o.title = '귀환 대선단 ' + ships + '척을 ' + hq.name + '까지 이끈다';
      o.desc = '화물 값 금화 ' + num(o.value) + '닢을 실은 회사선 ' + ships + '척이 ' + c.name + '에서 본부로 돌아간다. 해적과 경쟁사가 노리고 덤빈다(' + o.raids + '번쯤). 한 척 잃을 때마다 수수료가 준다. 모두 지키면 ' + Math.round(k.convoy.safe * 100) + '% 더.';
    } else if (kind === 'found') {
      var mine = CO.posts(co).map(function (p) { return p.c; });
      var cs = co.cand.map(city).filter(function (t) { return t && t.port && R.cityExists(t) && mine.indexOf(t.id) < 0 && t.id !== co.hq; });
      if (!cs.length) return null;
      var tt = pick(rng, cs), f = k.found;
      function rr(a) { return Math.round(a[0] + rng() * (a[1] - a[0])); }
      o.at = tt.id; o.need = { timber: rr(f.timber), cannon: rr(f.cannon), guns: rr(f.guns) };
      o.pay = Math.round((f.pay[0] + rng() * (f.pay[1] - f.pay[0])) * payK / 100) * 100;
      o.merit = f.merit; o.days = days(c, tt) * 2 + 150;
      o.title = tt.name + '에 새 ' + co.short + ' 상관을 세운다';
      o.desc = '목재 ' + o.need.timber + '통 · 대포 ' + o.need.cannon + '통 · 총 ' + o.need.guns + '통을 싣고 ' + tt.name + '에 들어가면, 그 고장 사람들과 담판을 짓고 상관을 세운다. 세운 상관은 회사의 것이 되어 창고·주문서·임무가 열린다.';
    } else if (kind === 'prize') {
      var rivals = CO.actives().filter(function (x) { return x.id !== co.id && portPosts(x).some(function (p) { var pc = city(p.c); return pc.region >= 3 && pc.region !== 4; }); });
      if (!rivals.length) return null;
      var rv = pick(rng, rivals), ps = portPosts(rv).map(function (p) { return city(p.c); }).filter(function (pc) { return pc.region >= 3 && pc.region !== 4; });
      var at = pick(rng, ps), nm = pick(rng, rv.names);
      o.rival = rv.id; o.at = at.id; o.name = nm; o.ship = rv.ship; o.got = 0;
      o.value = Math.round((k.prize.value[0] + rng() * (k.prize.value[1] - k.prize.value[0])) * CO.eraK() / 100) * 100;
      o.pay = Math.round(o.value * k.prize.bonus * CO.perk(CO.rank(co)).payK);
      o.merit = k.prize.merit; o.days = days(c, at) + 100;
      o.title = rv.short + '의 큰 화물선 「' + nm + '」호를 나포한다';
      o.desc = rv.name + '의 「' + nm + '」호가 ' + at.name + ' 앞바다(' + k.prize.near + '° 안)를 지난다. 붙잡으면 화물 값 약 금화 ' + num(o.value) + '닢 (가라앉히면 ' + Math.round(k.prize.sunk * 100) + '%), 본부에 알리면 회사 포상금 금화 ' + num(o.pay) + '닢.';
    }
    return o;
  }
  CO.accept = function (o) {
    var b = st(), s = S(); if (b.mission) return false;
    var m = JSON.parse(JSON.stringify(o)); m.limit = s.day + o.days; m.took = s.day;
    if (m.kind === 'convoy') m.next = s.day + 6;
    b.mission = m; b.took[o.key] = 1;
    log(G.COMPANY[o.co].short + ' 회사 임무를 맡았다 — ' + o.title + ' (기한 ' + o.days + '일)');
    return m;
  };
  CO.mission = function () { var b = st(); return b ? b.mission : null; };
  CO.done = function (m) { m = m || CO.mission(); if (!m) return false; return m.kind === 'patrol' ? m.got >= m.n : m.kind === 'prize' ? !!m.got : false; };
  /** 이 도시에서 보고할 수 있나 (단속·나포 — 그 회사의 본부나 상관에서) */
  CO.reportHere = function (c, m) { m = m || CO.mission(); return !!(m && CO.done(m) && CO.presentAt(m.co, c.id)); };
  CO.report = function (c) {
    var b = st(), m = b.mission, s = S(); if (!CO.reportHere(c, m)) return null;
    var co = G.COMPANY[m.co], mer = 0, f = 0;
    s.player.gold += m.pay;
    if (!m.free) mer = CO.addMerit(m.merit);
    if (m.kind === 'patrol') { f = fame('bt', 6 + m.n * 3); CO.move(co, K().moves.patrol); }
    else { f = fame('bt', 20); }
    if (G.Influence) { var ka = G.BALANCE.influence.act; G.Influence.add(c, ka.report, co); if (m.at != null && m.at !== c.id && city(m.at)) G.Influence.add(city(m.at), ka.report / 2, co); }   // 보고한 항구 · 단속한 바다의 항구
    b.mission = null; b.done = (b.done || 0) + 1;
    log(co.short + ' 회사 임무를 마쳤다 — ' + m.title + ' (금화 ' + num(m.pay) + '닢' + (mer ? ' · 공헌 +' + mer : '') + ')');
    refresh();
    return { pay: m.pay, merit: mer, fame: f, m: m };
  };
  CO.abandon = function () {
    var b = st(), m = b.mission; if (!m) return false;
    b.mission = null;
    if (CO.isMember(m.co)) { b.merit = Math.max(0, b.merit - K().failMerit); if (m.kind === 'convoy') CO.move(m.co, K().moves.convoyFail); }
    log(G.COMPANY[m.co].short + ' 회사 임무를 그만두었다 — ' + m.title);
    return true;
  };

  // ---------------------------------------------------------------- 귀환 대선단이 본부에 닿았다
  async function convoyHome(c) {
    var b = st(), m = b.mission, s = S(), co = G.COMPANY[m.co], k = K();
    var ratio = m.ships / m.ships0, base = m.value * k.convoy.fee * ratio, safe = m.ships === m.ships0 ? m.value * k.convoy.fee * k.convoy.safe : 0;
    var pay = Math.round((base + safe) * (m.late ? 0.5 : 1));
    s.player.gold += pay;
    var mer = CO.addMerit(Math.round(m.merit * ratio * (m.late ? 0.5 : 1)));
    var d = CO.move(co, k.moves.convoy * ratio);
    var f = fame('tr', 15 + m.ships0 * 5);
    if (G.Influence) { var ka = G.BALANCE.influence.act; G.Influence.add(c, ka.convoy * ratio, co); if (city(m.from)) G.Influence.add(city(m.from), ka.convoyFrom * ratio, co); }
    b.mission = null; b.done = (b.done || 0) + 1;
    var who = staff('guildmaster', co.short + ' 이사', co);
    await UI.say(c.name + ' 부두에 회사 깃발을 단 배들이 줄지어 닻을 내린다. ' + (m.ships === m.ships0 ? '한 척도 잃지 않았다! ' : m.ships0 - m.ships + '척을 잃었지만 ') + '부두의 짐꾼들이 환호하며 궤짝을 내리기 시작한다.', who);
    await UI.alert('<b>귀환 대선단 ' + m.ships + '/' + m.ships0 + '척</b> — 화물 값 금화 ' + num(m.value * ratio) + '닢<br>수수료 금화 <b>' + num(pay) + '</b>닢' + (safe ? ' (모두 지킨 웃돈 포함)' : '') + (m.late ? ' <span class="muted">(기한을 넘겨 절반)</span>' : '') +
      '<br>공헌 +' + mer + ' · 교역 명성 +' + f + ' · ' + U.esc(co.short) + ' 주가 ' + pct(d), '귀환 대선단');
    log(co.short + ' 귀환 대선단 ' + m.ships + '/' + m.ships0 + '척을 ' + c.name + '까지 이끌고 왔다. 수수료 금화 ' + num(pay) + '닢.');
    refresh();
  }
  // ---------------------------------------------------------------- 상관 건설 — 그 도시에 닿았다
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, Object.assign({ kind: 'garrison' }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  CO._fight = fight;
  function newPostGoods(c) {
    return R.cityGoods(c).filter(function (id) { var g = G.GOOD[id]; return g && !(g.life > 0 && g.life < 150); }).sort(function (a, z) { return G.GOOD[z].p - G.GOOD[a].p; }).slice(0, 2);
  }
  async function foundHere(c) {
    var b = st(), m = b.mission, s = S(), co = G.COMPANY[m.co], k = K().found;
    var lack = ['timber', 'cannon', 'guns'].filter(function (id) { return cargoQ(id) < m.need[id]; });
    if (lack.length) { UI.toast('상관을 세울 물자가 모자란다 — ' + ['timber', 'cannon', 'guns'].map(function (id) { return G.GOOD[id].name + ' ' + cargoQ(id) + '/' + m.need[id]; }).join(' · '), 'hammer', 6000); return; }
    var lord = staff('harbormaster', c.name + '의 관리');
    var gift = Math.round(m.pay * k.gift), sp = R.skill('speech') || 0;
    await UI.say('바다 건너 회사가 이 땅에 창고와 담장을 세우겠다고? …우리 군주께서는 낯선 깃발을 반기지 않으시오. 무엇을 내놓겠소?', lord);
    var v = await UI.ask(c.name + '에 ' + co.short + ' 상관을 세우려면', [
      { label: '예물을 바치고 허가를 받는다 (금화 ' + num(gift) + '닢)', value: 'gift', dis: s.player.gold < gift },
      { label: '교역의 이로움을 설득한다 (웅변 ' + sp + (sp >= 2 ? ' — 넉넉하다' : '') + ')', value: 'talk' },
      { label: '무력으로 자리를 잡는다 (뭍의 싸움)', value: 'force' },
      { label: '다음에 한다', value: null }], lord);
    if (!v) return;
    var ok = false;
    if (v === 'gift' && s.player.gold >= gift) { s.player.gold -= gift; ok = true; await UI.say('군주께서 기뻐하실 것이오. 바닷가 모래톱을 내어 드리지.', lord); }
    else if (v === 'talk') {
      ok = sp >= 2 || U.chance(0.35 + 0.15 * sp);
      await UI.say(ok ? '…그대 말대로라면 우리 항구에도 배가 더 들겠군. 좋소, 자리를 내어 드리지.' : '말은 그럴듯하오만, 군주께서는 믿지 않으실 것이오. 돌아가시오.', lord);
    } else if (v === 'force') {
      var r = await fight(c.name + '의 수비대', 25 + Math.round(s.date.y - 1500) / 8, { guns: true, leader: '수비대장', noSpecial: true });
      ok = r === 'win';
      if (!ok) UI.toast('수비대에 밀려났다. 다시 들어와 담판을 지을 수 있다.', 'sword', 5000);
      else s.player.notoriety = (s.player.notoriety || 0) + 4;
    }
    if (!ok) { refresh(); return; }
    ['timber', 'cannon', 'guns'].forEach(function (id) { takeCargo(id, m.need[id], c); });
    var post = { c: c.id, g: newPostGoods(c) };
    (b.posts[co.id] = b.posts[co.id] || []).push(post);
    s.player.gold += m.pay;
    var mer = CO.addMerit(m.merit), d = CO.move(co, K().moves.found), f = fame('tr', 30) + fame('so', 10);
    if (G.Influence) { G.Influence.bump(); G.Influence.add(c, G.BALANCE.influence.act.found, co); }
    b.mission = null; b.done = (b.done || 0) + 1;
    await UI.alert('<b>' + U.esc(c.name) + '에 ' + U.esc(co.short) + ' 상관이 섰다!</b><br>회사 창고: ' + post.g.map(function (id) { return G.GOOD[id].name; }).join('·') + '<br>보수 금화 <b>' + num(m.pay) + '</b>닢 · 공헌 +' + mer + ' · 명성 +' + f + ' · ' + U.esc(co.short) + ' 주가 ' + pct(d), '상관 건설');
    log(c.name + '에 ' + co.name + '의 상관을 세웠다. 보수 금화 ' + num(m.pay) + '닢.');
    refresh();
  }
  CO._foundHere = foundHere; CO._convoyHome = convoyHome;

  // ================================================================ 바다 (js/scenes/sea.js · battle.js)
  function shipsOf(co, n) { var y = S().date.y, ok = co.navy.filter(function (id) { var t = G.SHIP[id]; return t && (!t.from || y >= t.from); }); if (!ok.length) ok = ['carrack']; var out = []; for (var i = 0; i < n; i++) out.push(U.pick(ok)); return out; }
  function placeNear(l, a, z) {
    for (var i = 0; i < 12; i++) { var ang = U.rf(0, 6.2832), d = U.rf(a, z), lon = l.lon + Math.cos(ang) * d, lat = l.lat + Math.sin(ang) * d; if (G.Geo.isSea(lon, lat, 1)) return { lon: lon, lat: lat }; }
    return null;
  }
  function dockOf(c) { var d = c.dock || [c.lat, c.lon]; return { lon: d[1], lat: d[0] }; }
  function rivalOf(coId) { var xs = CO.actives().filter(function (x) { return x.id !== coId; }); return xs.length ? U.pick(xs) : null; }
  /** sea.js spawnNpcs: 회사 임무와 얽힌 배 (없으면 null) */
  CO.spawn = function (npcs) {
    var b = st(), s = S(), m = b && b.mission, l = s.loc; if (!m || !G.Ships || s.loc.mode !== 'sea') return null;
    if (npcs.some(function (n) { return n.co; })) return null;
    var k = K(), y = s.date.y, K2 = Math.min(1, s.player.fame / ((G.BALANCE && G.BALANCE.pirateFame) || 4000));
    var p, z, npc = null;
    if (m.kind === 'patrol' && m.got < m.n && !(m.cd > s.day)) {
      var t = city(m.at); if (dist(l, dockOf(t)) > k.patrol.near || !U.chance(k.patrol.spawn)) return null;
      p = placeNear(l, 2.2, 4.5); if (!p) return null; z = G.Ships.zone(p.lon, p.lat);
      var smug = U.chance(0.6), rv = rivalOf(m.co), n = Math.min(m.n - m.got, U.ri(1, 3));
      if (smug || !rv) npc = { kind: 'merchant', label: '밀수선단', nation: '밀수', ships: G.Ships.enemyTypes('merchant', z, null, n, K2, y), hostile: false, spd: U.rf(0.9, 1.25) };
      else npc = { kind: 'navy', label: rv.short + ' 무장 상선단', nation: rv.short, ships: shipsOf(rv, n), hostile: true, spd: U.rf(0.9, 1.2) };
      m.cd = s.day + k.patrol.cd;
      UI.toast(npc.hostile ? '수평선에 ' + npc.label + U.jx(npc.label, '이/가') + ' 나타나 다가온다!' : '수평선에 밀수선단의 돛이 보인다 — ' + t.name + ' 앞바다를 몰래 드나드는 배다.', 'telescope', 5200);
      npc.co = 'patrol';
    } else if (m.kind === 'convoy' && m.raids > 0 && s.day >= (m.next || 0) && U.chance(k.convoy.raid)) {
      p = placeNear(l, 2.5, 4.2); if (!p) return null; z = G.Ships.zone(p.lon, p.lat);
      var rv2 = rivalOf(m.co), nn = U.ri(2, Math.min(4, 2 + Math.floor(s.player.fame / 2500)));
      if (U.chance(0.55) || !rv2) npc = { kind: 'pirate', ships: G.Ships.enemyTypes('pirate', z, null, nn, Math.max(0.5, K2), y), hostile: true, spd: U.rf(1.1, 1.4) };
      else npc = { kind: 'navy', label: rv2.short + ' 습격 함대', nation: rv2.short, ships: shipsOf(rv2, nn), hostile: true, spd: U.rf(1.0, 1.3) };
      m.raids--; m.next = s.day + k.convoy.gap;
      UI.toast('회사 선단을 노리는 ' + (npc.label || G.Ships.pirateLabel(z) + ' 해적단') + U.jx(npc.label || '해적단', '이/가') + ' 다가온다!', 'skull', 5200);
      npc.co = 'raid';
    } else if (m.kind === 'prize' && !m.got && !(m.cd > s.day)) {
      var at = city(m.at), rv3 = G.COMPANY[m.rival]; if (!rv3 || dist(l, dockOf(at)) > k.prize.near || !U.chance(k.prize.spawn)) return null;
      p = placeNear(l, 2.2, 4.2); if (!p) return null; z = G.Ships.zone(p.lon, p.lat);
      var esc = shipsOf(rv3, U.ri(1, 2)), sh = G.SHIP[m.ship] ? m.ship : esc[0];
      npc = { kind: 'merchant', label: '「' + m.name + '」호', nation: rv3.short, ships: [sh].concat(esc), hostile: false, spd: U.rf(0.75, 0.95), prizeShip: sh };
      m.cd = s.day + k.prize.cd;
      UI.toast('수평선에 거대한 화물선이 보인다 — ' + rv3.short + '의 「' + m.name + '」호다!', 'telescope', 6000);
      npc.co = 'prize';
    }
    if (!npc) return null;
    return Object.assign({ id: 'co_' + Math.random().toString(36).slice(2), lon: p.lon, lat: p.lat, heading: npc.hostile ? Math.atan2(l.lat - p.lat, G.Geo.wrapLon(l.lon - p.lon)) : U.rf(0, 6.28), n: npc.ships.length, K: K2, life: 20, zone: z }, npc);
  };
  CO.encounterText = function (n) {
    if (!n || !n.co) return '';
    if (n.co === 'raid') return '제독! ' + (n.label || '해적단') + ' ' + n.n + '척이 회사 선단을 노리고 덤빕니다! 물러서면 느린 회사선이 붙잡힙니다!';
    if (n.co === 'patrol') return n.hostile ? '제독! ' + n.label + ' ' + n.n + '척입니다. 회사의 바다를 넘보는 놈들입니다!' : '밀수선단 ' + n.n + '척이 있습니다. 회사의 허가 없이 독점품을 나르는 배입니다.';
    if (n.co === 'prize') return n.label + ' — ' + n.nation + '의 큰 화물선과 호위선 ' + (n.n - 1) + '척입니다. 화물선을 붙잡으면 한몫 단단히 잡습니다!';
    return '';
  };
  CO.greet = function (n) {
    if (!n || !n.co) return '';
    if (n.co === 'patrol') return '밀수선이 신호를 못 본 척하며 슬그머니 돛을 더 올린다.';
    if (n.co === 'prize') return n.label + U.jx(n.label, '이/가') + ' 포문을 연 채 경계하며 답한다. "무슨 일이오? 이 배는 ' + n.nation + '의 배요. 가까이 오지 마시오!"';
    return '';
  };
  /** 회사의 이름으로 치는 배 — 악명이 붙지 않는다 */
  CO.lawful = function (n) { return !!(n && n.co && CO.mission()); };
  /** 회사 선단을 노리는 배에게서 도망쳤다 — 느린 회사선 한 척이 붙잡힌다 */
  CO.fled = function (n) {
    var m = CO.mission(); if (!n || n.co !== 'raid' || !m || m.kind !== 'convoy') return;
    lose(m, 1, '도망치는 사이 느린 회사선 한 척이 뒤처져 붙잡혔다');
  };
  function lose(m, k, why) {
    var n = Math.min(m.ships, k); if (!n) return;
    m.ships -= n; CO.move(m.co, K().moves.convoyLost * n);
    if (m.ships <= 0) {
      var b = st(); b.mission = null; if (CO.isMember(m.co)) b.merit = Math.max(0, b.merit - K().failMerit * 2); CO.move(m.co, K().moves.convoyFail);
      UI.toast(why + ' — 회사선을 모두 잃었다. 귀환 대선단 임무는 실패했다.', 'skull', 6500);
      log(G.COMPANY[m.co].short + ' 귀환 대선단을 모두 잃었다.');
    } else UI.toast(why + ' — 회사선 ' + m.ships + '/' + m.ships0 + '척', 'ship', 5200);
  }
  /** battle.js: 해전이 끝났다 */
  CO.afterBattle = function (npc, res, ships, lines) {
    var m = CO.mission(); if (!npc || !npc.co || !m) return;
    var en = (ships || []).filter(function (x) { return x.side === 'en'; }), beaten = en.filter(function (x) { return x.sunk || x.captured; }).length;
    if (npc.co === 'patrol' && m.kind === 'patrol') {
      if (res === 'win' && beaten) { m.got = Math.min(m.n, m.got + beaten); if (lines) lines.push('회사 임무 — 단속 ' + m.got + '/' + m.n + '척' + (m.got >= m.n ? ' <b>다 해냈다. 회사 본부나 상관에 알리자.</b>' : '')); }
    } else if (npc.co === 'raid' && m.kind === 'convoy') {
      if (res === 'win' || res === 'escaped-enemy') { if (lines) lines.push('회사 선단을 지켜 냈다 — ' + m.ships + '/' + m.ships0 + '척'); }
      else lose(m, res === 'retreat' ? 1 : 2, res === 'retreat' ? '물러나는 사이 회사선 한 척이 붙잡혔다' : '싸움에 져서 회사선 두 척을 빼앗겼다');
    } else if (npc.co === 'prize' && m.kind === 'prize' && res === 'win') {
      var tgt = en.filter(function (x) { return x.type === npc.prizeShip && (x.captured || x.sunk); })[0];
      if (!tgt) { if (lines) lines.push('「' + m.name + '」호는 놓쳤다. 그 앞바다에서 다시 찾아보자.'); return; }
      var g = Math.round(m.value * (tgt.captured ? 1 : K().prize.sunk));
      S().player.gold += g; m.got = 1; m.prize = g;
      S().player.notoriety = (S().player.notoriety || 0) + K().prize.noto;
      var dv = CO.move(m.rival, K().moves.prizeVictim); CO.move(m.co, K().moves.prizeOwn);
      if (lines) lines.push('<b>「' + U.esc(m.name) + '」호를 ' + (tgt.captured ? '붙잡았다' : '가라앉혔다') + '!</b> 화물을 팔아 금화 ' + num(g) + '닢 · ' + U.esc(G.COMPANY[m.rival].short) + ' 주가 ' + pct(dv) + ' — 회사 본부나 상관에 알리자.');
      log(G.COMPANY[m.rival].name + '의 「' + m.name + '」호를 ' + (tgt.captured ? '나포했다' : '격침했다') + '. 화물 금화 ' + num(g) + '닢.');
    }
  };

  // ================================================================ 날마다 (G.World.daily)
  CO.daily = function () {
    var b = st(), s = S(); if (!b) return [];
    var out = CO.tick(), m = b.mission;
    if (m && s.day > m.limit) {
      if (m.kind === 'convoy') { if (!m.late) { m.late = true; out.push({ icon: 'ship', text: '귀환 대선단의 기한을 넘겼다 — 본부에 닿아도 수수료가 절반이다.' }); } }
      else {
        b.mission = null; if (CO.isMember(m.co)) b.merit = Math.max(0, b.merit - K().failMerit);
        out.push({ icon: 'scroll', text: G.COMPANY[m.co].short + ' 회사 임무의 기한이 지났다 — ' + m.title + ' (실패)' });
        log(G.COMPANY[m.co].short + ' 회사 임무를 기한 안에 마치지 못했다 — ' + m.title);
      }
    }
    var ch = b.chain;
    if (ch && s.day > ch.limit) {
      b.chain = null;
      out.push({ icon: 'scroll', text: '중개 주문서의 기한이 지나 사슬이 끊겼다 — 쌓인 연계 보너스 금화 ' + num(ch.pot) + '닢이 날아갔다.' });
      log('중개 주문서의 기한을 넘겨 연계 보너스 금화 ' + num(ch.pot) + '닢을 잃었다.');
    }
    return out;
  };

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js C.arrival)
  CO.arrival = async function (c, arg) {
    var b = st(), s = S(); if (!b || !c) return;
    if (arg && arg.arrive && s.loc.via !== 'land') { try { await CO.customs(c); } catch (e) { console.error(e); } }
    var m = b.mission;
    if (m && m.kind === 'convoy' && c.id === m.to) await convoyHome(c);
    else if (m && m.kind === 'found' && c.id === m.at) await foundHere(c);
    if (CO.chainHere(c)) {
      if (cargoQ(b.chain.g) >= b.chain.q && G.CompanyUI) await G.CompanyUI.chainArrive(c);
      else UI.toast('중개 주문서 — 이 도시에 ' + G.GOOD[b.chain.g].name + ' ' + b.chain.q + '통을 넘겨야 한다 (가진 것 ' + cargoQ(b.chain.g) + '통).', 'scroll', 5200);
    }
    if (G.Influence) { try { G.Influence.arrival(c); } catch (e) { console.error(e); } }   // 항구 영향도의 단계가 오르면 알린다
    if (CO.reportHere(c)) UI.toast(G.COMPANY[b.mission.co].short + ' 회사 임무를 마쳤다 — 이 도시의 회사 건물에 알리자.', 'seal', 5200);
  };
  /** 할 일 판 (js/scenes/city.js C.todo) */
  CO.todo = function (c) {
    var b = st(), out = []; if (!b || !c) return out;
    function bld(coId) { return G.COMPANY[coId].hq === c.id ? { kind: 'company', arg: coId } : { kind: 'factory' }; }
    if (CO.chainHere(c) && CO.presentAt(b.chain.co, c.id)) out.push(Object.assign(bld(b.chain.co), { icon: 'scroll', hot: true, text: '중개 주문서 납품 — ' + G.GOOD[b.chain.g].name + ' ' + b.chain.q + '통' }));
    if (CO.reportHere(c)) out.push(Object.assign(bld(b.mission.co), { icon: 'seal', hot: true, text: G.COMPANY[b.mission.co].short + ' 회사 임무 보고' }));
    var co = CO.me(), nx = CO.next();
    if (co && co.hq === c.id && nx && nx.ok) out.push({ kind: 'company', arg: co.id, icon: 'crown', hot: true, text: co.hqName + ' — ' + nx.name + ' 승진 심사' });
    return out;
  };

  // ================================================================ 수첩
  /** 함대 현황 칸: 귀환 대선단 */
  CO.panelHtml = function () {
    var m = CO.mission(); if (!m || m.kind !== 'convoy') return '';
    return '<div class="fp-ship fp-escort"><div class="flex"><b>⚑ ' + U.esc(G.COMPANY[m.co].short) + ' 귀환 선단</b><span class="right cream-muted">' + m.ships + '/' + m.ships0 + '척</span></div>' + UI.bar(m.ships, m.ships0, m.ships / m.ships0 < 0.5 ? 'red dark' : 'green dark') + '</div>';
  };
  CO.missionText = function (m) {
    m = m || CO.mission(); if (!m) return '';
    var left = m.limit - S().day, co = G.COMPANY[m.co];
    var prog = m.kind === 'patrol' ? ' · ' + m.got + '/' + m.n + '척' : m.kind === 'convoy' ? ' · 선단 ' + m.ships + '/' + m.ships0 + '척' + (m.late ? ' (기한 넘김)' : '') : m.kind === 'prize' ? (m.got ? ' · 해냈다' : '') : m.kind === 'found' ? ' · ' + ['timber', 'cannon', 'guns'].map(function (id) { return G.GOOD[id].name + ' ' + cargoQ(id) + '/' + m.need[id]; }).join(' ') : '';
    return co.short + ' — ' + m.title + prog + (left >= 0 ? ' · ' + left + '일 남음' : '');
  };
  CO.chainText = function () {
    var ch = st() && st().chain; if (!ch) return '';
    return G.COMPANY[ch.co].short + ' 중개 주문서 고리 ' + ch.leg + '/' + ch.max + ' — ' + G.GOOD[ch.g].name + ' ' + ch.q + '통을 ' + city(ch.to).name + U.jx(city(ch.to).name, '으로/로') + ' (×' + ch.mult + ' · ' + Math.max(0, ch.limit - S().day) + '일 남음 · ' + (CO.isPost(ch.co, ch.to) ? '상관' : '거래처') + ') · 쌓인 연계 보너스 금화 ' + num(ch.pot) + '닢';
  };
  CO.taskHtml = function () {
    var b = st(); if (!b) return '';
    var li = [], m = CO.mission();
    if (m) li.push(CO.missionText(m));
    if (b.chain) li.push(CO.chainText());
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">회사 일</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  /** 작은 주가 그림 (svg) */
  CO.spark = function (co, w, h) {
    var hs = CO.hist(co); w = w || 120; h = h || 28; if (hs.length < 2) return '';
    var lo = Math.min.apply(null, hs), hi = Math.max.apply(null, hs), sp = Math.max(1, hi - lo);
    var pts = hs.map(function (v, i) { return (i * (w - 2) / (hs.length - 1) + 1).toFixed(1) + ',' + (h - 2 - (v - lo) / sp * (h - 4)).toFixed(1); }).join(' ');
    var up = hs[hs.length - 1] >= hs[0];
    return '<svg class="co-spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline fill="none" stroke="' + (up ? '#3f7a3a' : '#a0322a') + '" stroke-width="1.6" points="' + pts + '"/></svg>';
  };
  /** 수첩 「교역」의 회사 상자 */
  CO.box = function () {
    var b = st(); if (!b || !CO.actives().length) return '';
    var co = CO.me(), nx = CO.next(), hs = CO.holdings();
    var who = co ? '<b>' + U.esc(co.name) + '</b> ' + U.esc(CO.rankName(co, b.rank)) + ' · 공헌 ' + num(b.merit) + (nx ? ' <small class="muted">(다음 ' + U.esc(nx.name) + ': 공헌 ' + num(nx.merit) + (nx.shares ? ' · 자사주 ' + nx.shares + '주' : '') + ')</small>' : '') + (CO.doubted() ? ' <small class="bad-text">경쟁사 주식이 더 많아 공헌이 덜 쌓인다</small>' : '')
      : '<span class="muted">어느 회사에도 속하지 않았다' + (b.cool > S().day ? ' (다시 들 수 있기까지 ' + (b.cool - S().day) + '일)' : ' — 회사 본부에서 입회할 수 있다') + '</span>';
    var rows = hs.map(function (x) { return '<div class="era-row"><span class="era-lbl">' + U.esc(x.co.short) + '</span> ' + x.n + '주 × ' + num(x.p) + '닢 = <b>' + num(x.value) + '</b>닢 <small class="' + (x.pl >= 0 ? 'good-text' : 'bad-text') + '">(' + (x.pl >= 0 ? '+' : '') + num(x.pl) + ')</small> ' + CO.spark(x.co, 90, 20) + '</div>'; }).join('');
    var task = [CO.missionText(), CO.chainText()].filter(Boolean).map(function (t) { return '<div class="era-row"><small>' + U.esc(t) + '</small></div>'; }).join('');
    return '<div class="era-box co-box"><b>' + G.icon('seal') + ' 특허 회사</b> <small class="muted">— 한 회사에만 속한다 · 주식은 어느 회사 것이든</small><div class="era-row">' + who + '</div>' + rows + task + '</div>' + (G.Influence ? G.Influence.box() : '');   // 항구 영향도 (js/systems/influence.js)
  };

  // ================================================================ 걸기
  if (G.Court && G.Court.taskHtml && !G.Court._companyHtml) { G.Court._companyHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + CO.taskHtml(); }; }
  (function hookDaily() {
    var W = G.World; if (!W || W._company) return;
    W._company = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(CO.daily()); } catch (e) { console.error(e); } return out; };
  })();
})(window.G = window.G || {});
