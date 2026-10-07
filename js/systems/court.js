/* 궁정 — 국왕의 부름, 왕명(작은 임무), 작위 (자료: js/data/court.js, 조정값: G.BALANCE.court)
   ■ 흐름
     · 통합 명성이 10,000 오를 때마다(step) 제 나라 국왕이 제독을 부른다 — 소식으로 알리고, 수도에 들어서면 전령이 찾아온다.
     · 왕궁에서 알현하면 국왕이 왕명 넷(탐험·교역·전투·사교에서 하나씩)을 내놓는다. 하나를 골라 해내고 돌아와 아뢰면 작위가 한 칸 오른다.
       제 나라: 피달구/이달고 → 영주 → 남작 → 자작 → 백작 → 후작 → 공작 (명성 10,000마다 한 칸, 70,000이면 공작까지)
     · 다른 나라 군주를 알현해도 같은 일이 벌어진다 — 그 나라의 명예 작위(제국 기사 → 제국 남작 → 제국 백작 …)를 받는다.
     · 왕명은 한 번에 하나만 맡는다. 기한(years)을 넘기거나 내려놓으면 신뢰·명성이 깎이고 again일 뒤에 다시 부른다.
   ■ 왕명: 지리상의 발견·보물 발견·동물원 건설 / 교역품 납품·비용 지불 / 적국 선박 나포·왕녀 구출·해적 토벌 / 외교 문서·외교 특사
   ■ 작위가 있으면 유럽·이슬람 도시의 사람들이 공손해진다 (C.hail — 건물에 들어설 때의 인사, 위병·집사).
     작위는 가문의 것이라 제독의 뒤를 이은 자녀에게 그대로 이어진다.
   ■ 저장: s.court = {titles:{나라:칸}, task, offers, called, herald, seen, wait, zoo, zooUsed, done} — 없으면 빈 것으로 본다(옛 저장 그대로 열림) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var CT = {};
  G.Court = CT;
  function S() { return G.Game.state; }
  function B() { return G.BALANCE.court; }
  function SP() { return G.Sponsor; }
  function st() {
    var s = S(); if (!s.court) s.court = {};
    var c = s.court;
    ['titles', 'offers', 'called', 'herald', 'seen', 'wait', 'zoo', 'zooUsed'].forEach(function (k) { if (!c[k]) c[k] = {}; });
    return c;
  }
  CT.state = st;
  function today() { return U.dateNum(S().date); }
  function female() { var p = S().player; return p.g === 'f'; }
  function lin(a, x) { return Math.min(a[2] == null ? 1e9 : a[2], Math.floor(a[0] + a[1] * x)); }

  // ================================================================ 나라·작위
  CT.realmOf = function (sp) { var k = sp && G.COURT.bySponsor[sp.id]; return k ? G.COURT.realms[k] : null; };
  /** 작위를 선포하는 군주별 전속 신하. 얼굴과 무릎상은 반드시 같은 생성 그림을 쓴다. */
  CT.courtier = function (sp) {
    var row = sp && G.COURT.courtiers && G.COURT.courtiers[sp.id];
    if (!row) return null;
    var c = G.CITY_DATA[sp.city], style = G.Img.folkStyle(c), key = 'portraits/courtiers/' + sp.id;
    var portrait = G.Art.withImg(G.Art.npcSpec('courtier:' + sp.id, 'official', style, 'm'), [key]);
    return { name: row.name, title: sp.title + '의 신하', portrait: portrait, portraitChain: [key], half: [key + '_half'], lang: SP().langLv(sp), li: SP().langLi(sp) };
  };
  CT.isHome = function (realm) { return !!realm.nation && realm.nation === S().player.nation; };
  CT.ladder = function (realm) { return CT.isHome(realm) ? realm.ranks : realm.honor; };
  /** 이 나라에서 받은 작위의 칸 (0 = 없음) */
  CT.rank = function (realm) { return st().titles[realm.id] || 0; };
  function titleObj(realm, n) {
    var t = CT.ladder(realm)[n - 1]; if (!t) return null;
    var ko = t[0], call = ko.split(' ').pop();
    return { realm: realm, n: n, ko: ko, native: female() ? t[2] : t[1], w: t[3], adr: t[4], call: call === '귀족' ? '' : call, home: CT.isHome(realm) };
  }
  CT.title = function (realm, n) { return titleObj(realm, n == null ? CT.rank(realm) : n); };
  /** 가진 작위 모두 — 높은 것부터 (같으면 제 나라 것이 앞) */
  CT.titles = function () {
    var c = st(), out = [];
    Object.keys(c.titles).forEach(function (k) { var r = G.COURT.realms[k], t = r && titleObj(r, c.titles[k]); if (t) out.push(t); });
    return out.sort(function (a, b) { return b.w - a.w || (b.home ? 1 : 0) - (a.home ? 1 : 0); });
  };
  CT.best = function () { return CT.titles()[0] || null; };
  /** '포르투갈 백작' · '신성로마제국 제국 백작' */
  CT.fullName = function (t, withNative) {
    var nm = t.ko.indexOf(t.realm.name) >= 0 ? t.ko : t.realm.name + ' ' + t.ko;
    return nm + (withNative && t.native ? ' (' + t.native + ')' : '');
  };
  /** 통합 명성의 단계 (10,000마다 1) */
  CT.level = function () { return Math.floor((S().player.fame || 0) / B().step); };
  /** 이 군주가 지금 왕명을 내릴 수 있는가 (알현하면 일이 벌어진다) */
  CT.pending = function (sp) {
    var realm = CT.realmOf(sp); if (!realm || !SP().present(sp)) return false;
    var c = st(), rank = CT.rank(realm);
    if (rank >= CT.ladder(realm).length) return false;
    if (c.wait[realm.id] && S().day < c.wait[realm.id]) return false;
    return CT.level() > rank;
  };
  function homeSponsor() {
    var p = S().player, out = null;
    Object.keys(G.COURT.realms).forEach(function (k) {
      var r = G.COURT.realms[k]; if (r.nation !== p.nation || out) return;
      r.sponsors.forEach(function (id) { var sp = G.SPONSOR[id]; if (!out && sp && SP().present(sp) && sp.city === p.home) out = sp; });
      r.sponsors.forEach(function (id) { var sp = G.SPONSOR[id]; if (!out && sp && SP().present(sp)) out = sp; });
    });
    return out;
  }
  CT.homeSponsor = homeSponsor;

  // ================================================================ 공손한 말씨
  function polite(c) { return !!c && (c.rel === 'C' || c.rel === 'O' || c.rel === 'I'); }
  /** 이 도시 사람들이 제독을 부르는 말 ('백작 각하'). 작위가 없거나 유럽·이슬람 도시가 아니면 '' */
  CT.address = function (c) {
    if (!S() || !polite(c)) return '';
    var ts = CT.titles(); if (!ts.length) return '';
    var own = R.cityOwner(c);
    return adr(ts.filter(function (x) { return x.realm.lands.indexOf(own) >= 0; })[0] || ts[0]);
  };
  function adr(t) {
    if (t.adr === '경') return S().player.name.split(' ')[0] + ' 경';
    return (t.call ? t.call + ' ' : '') + t.adr;
  }
  var HAIL = {
    inn: ['{a}께서 저희 여관에 드시다니 영광입니다. 가장 좋은 방을 내어 드리지요.', '어서 오십시오, {a}. 방은 벌써 데워 두었습니다.'],
    market: ['{a}, 어서 오십시오! 귀한 분께는 귀한 물건만 보여 드립지요.', '아이고, {a}께서 몸소 오시다니요. 천천히 둘러보십시오.'],
    library: ['{a}, 어서 오십시오. 찾으시는 책이 있으면 제가 꺼내 드리겠습니다.', '{a}께서 오셨군요. 조용한 자리를 마련해 드리지요.'],
    guild: ['{a}, 조합에 오신 것을 환영합니다. 무엇이든 말씀만 하십시오.', '{a}께서 오시니 조합의 격이 오릅니다. 무슨 일이신지요?'],
    shipyard: ['{a}, 어서 오십시오. 저희 목수들이 정성을 다해 모시겠습니다.', '{a}의 배라면 못 하나까지 살펴 드려야지요.'],
    tavern: ['{a}께서 이런 누추한 곳까지! 가장 좋은 술통을 따겠습니다.', '어서 오십시오, {a}. 자리부터 치워 드리지요.'],
    trade: ['어서 오십시오, {a}. 좋은 물건을 먼저 보여 드리겠습니다.', '{a}, 오늘은 무엇을 찾으십니까? 말씀만 하십시오.'],
    church: ['{a}, 어서 오십시오. 그대의 집안에 은총이 함께하기를.', '{a}께서 오셨군요. 그대와 그대의 뱃사람들을 위해 기도하겠소.'],
    mosque: ['평화가 함께하기를, {a}. 귀한 손님을 맞게 되어 기쁘오.', '{a}, 먼 길을 오셨소. 편히 쉬어 가시오.'],
    gate: ['{a}, 성 밖은 위험합니다. 부디 조심해서 다녀오십시오.', '{a}께서 나가신다! 길을 비켜라! …살펴 가십시오.'],
    guard: ['{a}, 송구하오나 이곳의 주인께서는 지금 계시지 않습니다.', '{a}, 주인께서 자리를 비우셨습니다. 다음에 다시 찾아 주십시오.']
  };
  /** 건물에 들어설 때의 인사: 작위가 있고 유럽·이슬람 도시면 공손한 인사, 아니면 예전 인사(lines에서 하나) */
  CT.hail = function (c, kind, lines) {
    var a = CT.address(c), L = HAIL[kind === 'church' && c && c.rel === 'I' ? 'mosque' : kind];
    if (!a || !L) return U.pick(lines);
    return U.pick(L).replace('{a}', a);
  };

  /** 귀족의 권한 — 값 깎기: 유럽·이슬람 도시에서 작위가 높을수록 잘 깎이고 더 깎인다. {p 성공률에 더할 값, disc 깎는 폭에 더할 값, adr 부르는 말, title} 또는 null */
  CT.haggle = function (c) {
    if (!S() || !polite(c)) return null;
    var ts = CT.titles(); if (!ts.length) return null;
    var own = R.cityOwner(c), mine = ts.filter(function (x) { return x.realm.lands.indexOf(own) >= 0; })[0], t = mine || ts[0];
    var h = B().haggle || { p: 0.04, disc: 0.005, own: 1.5 }, k = t.w * (mine ? h.own : 1);
    return { p: h.p * k, disc: h.disc * k, adr: adr(t), title: t, own: !!mine };
  };
  /** 수첩에 보일 글: 지금 가장 높은 작위로 받는 값 깎기 덤 */
  CT.perkText = function () {
    var t = CT.best(); if (!t) return '';
    var h = B().haggle || { p: 0.04, disc: 0.005, own: 1.5 };
    return '귀족의 권한 — 유럽·이슬람 도시에서 값 깎기 성공률 +' + Math.round(h.p * t.w * 100) + '%, 깎는 폭 +' + (Math.round(h.disc * t.w * 1000) / 10) + '%p (작위를 내린 나라의 땅에서는 ' + h.own + '배)';
  };

  // ================================================================ 왕명 만들기
  function kindOf(t) { return G.COURT.kinds[t.kind]; }
  function foesNow(realm) {
    var y = S().date.y, mine = R.nationName(S().player.nation), own = {};
    G.CITY_DATA.forEach(function (c) { if (c.port && R.cityExists(c)) own[R.cityOwner(c)] = 1; });
    return (realm.foes || []).filter(function (f) {
      if (y < f[1] || y >= f[2] || !own[f[0]]) return false;
      if (realm.lands.indexOf(f[0]) >= 0) return false;
      // 제 나라 배를 치라는 왕명은 받지 않는다
      var home = G.COURT.realms[S().player.nation];
      return !(home && home.lands.indexOf(f[0]) >= 0) && f[0] !== mine;
    }).map(function (f) { return f[0]; });
  }
  function courtsFor(sp) {
    var here = G.CITY_DATA[sp.city], mine = CT.realmOf(sp), out = [];
    Object.keys(G.COURT.bySponsor).forEach(function (id) {
      var o = G.SPONSOR[id]; if (!o || o.id === sp.id || !SP().present(o)) return;
      var r = CT.realmOf(o), c = G.CITY_DATA[o.city];
      if (r === mine || !R.cityExists(c)) return;
      out.push({ sp: o, realm: r, d: G.Geo.dist(here.lon, here.lat, c.lon, c.lat) });
    });
    return out.sort(function (a, b) { return a.d - b.d; });
  }
  function discCands(cats) {
    return G.DISCOVERIES.filter(function (d) { return cats.indexOf(d.cat) >= 0 && !d.bookOnly && d.how !== 'special' && !G.Disc.foundByMe(d.id) && G.Disc.available(d) && (!G.Disc.built || G.Disc.built(d)); });
  }
  function zooAnimals() {
    var c = st();
    return G.DISCOVERIES.filter(function (d) { return d.cat === 'creature' && d.how !== 'city' && G.Disc.foundByMe(d.id) && !c.zooUsed[d.id]; });
  }
  function supplyGoods(sp, n) {
    var here = G.CITY_DATA[sp.city], best = {};
    G.CITY_DATA.forEach(function (c) {
      if (!c.goods || !R.cityExists(c)) return;
      var rd = (G.REGION_DIST[here.region] || [])[c.region]; if (rd == null) return;
      var d = G.Geo.dist(here.lon, here.lat, c.lon, c.lat);
      c.goods.forEach(function (id) { if (!G.GOOD[id] || (G.Slave && G.Slave.is(id))) return; var b = best[id]; if (!b || rd < b.rd || (rd === b.rd && d < b.d)) best[id] = { id: id, rd: rd, d: d, city: c.id }; });
    });
    var need = n < 2 ? 1 : n < 4 ? 2 : 3, list = [];
    for (; need >= 1 && !list.length; need--) list = Object.keys(best).map(function (k) { return best[k]; }).filter(function (b) { return b.rd >= need && G.GOOD[b.id].p >= 30; });
    return list;
  }
  var COST_WHY = { eu: ['새 함대를 짓는 비용', '왕실 혼례의 비용', '대성당을 올리는 비용', '국경 요새를 고치는 비용'], is: ['새 함대를 짓는 비용', '큰 모스크를 올리는 비용', '성지 순례단의 비용', '국경 성채를 고치는 비용'], as: ['새 궁궐을 올리는 비용', '큰 절을 고치는 비용', '수군을 기르는 비용'] };

  /** 왕명 하나를 만든다 (만들 수 없으면 null). n = 지금 작위의 칸 */
  function make(kind, sp, realm, n, rng) {
    var b = B(), K = G.COURT.kinds[kind], home = CT.isHome(realm), s = S();
    var t = { kind: kind, cat: K.cat, fame: b.fame[0] + b.fame[1] * (n + 1), gold: b.gold[0] + b.gold[1] * (n + 1) };
    function pick(a) { return a[Math.floor(rng() * a.length)]; }
    if (kind === 'geo') {
      t.cats = ['geo', 'nature']; t.n = lin(b.geoN, n);
      if (discCands(t.cats).length < t.n + 1) return null;
      t.title = '아직 알려지지 않은 땅과 바다, 자연의 경이를 ' + t.n + '곳 찾아낸다';
      t.desc = '왕명을 받은 뒤 새로 찾은 지리·자연 발견물 ' + t.n + '건. 찾기만 하면 된다(보고는 따로 해도 좋다).';
    } else if (kind === 'treasure') {
      t.cats = ['treasure']; t.n = n >= 4 ? 2 : 1;
      if (discCands(t.cats).length < t.n + 1) return null;
      t.title = '세상에 묻힌 보물을 ' + t.n + '점 찾아낸다';
      t.desc = '왕명을 받은 뒤 새로 찾은 보물 발견물 ' + t.n + '건.';
    } else if (kind === 'zoo') {
      if (st().zoo[realm.id]) return null;
      t.n = b.zooN;
      if (zooAnimals().length + discCands(['creature']).length < t.n) return null;
      t.title = '왕립 동물원을 세울 신기한 동물 ' + t.n + '종을 찾아 그려 온다';
      t.desc = '제독이 직접 찾아낸 신기한 동물(생물 발견물 — 도시의 개·고양이·말은 빼고) ' + t.n + '종. 이미 찾아 둔 것도 쳐 준다. 다 모이면 ' + G.CITY_DATA[sp.city].name + '에 왕립 동물원이 선다.';
      t.fame += 150;
    } else if (kind === 'supply') {
      var gl = supplyGoods(sp, n); if (!gl.length) return null;
      var g = pick(gl), good = G.GOOD[g.id];
      t.good = g.id; t.qty = lin(b.supplyQty, n); t.from = g.city;
      t.gold = Math.round(good.p * t.qty * b.supplyPay / 100) * 100;
      t.title = good.name + ' ' + t.qty + '통을 궁정에 바친다';
      t.desc = good.name + ' ' + t.qty + '통을 배에 싣고 와 아뢴다. ' + G.CITY_DATA[g.city].name + ' 쪽에서 난다고 한다. 값은 넉넉히 쳐 준다.';
    } else if (kind === 'tribute') {
      t.amount = Math.round((b.tribute[0] + b.tribute[1] * n) * (home ? 1 : 0.5));
      t.why = pick(COST_WHY[realm.kind] || COST_WHY.eu);
      t.gold = 0; t.fame = Math.round(t.fame * 0.5);
      t.title = t.why + ' 금화 ' + U.num(t.amount) + '닢을 바친다';
      t.desc = '그 자리에서 금화 ' + U.num(t.amount) + '닢을 낸다. 가장 빠르지만 하사금이 없고 명성도 절반이다.';
    } else if (kind === 'capture') {
      var foes = foesNow(realm); if (!foes.length) return null;
      t.nation = pick(foes); t.n = lin(b.shipsN, n); t.got = 0;
      t.title = t.nation + '의 배 ' + t.n + '척을 나포하거나 가라앉힌다';
      t.desc = t.nation + '의 상선·군함을 ' + t.n + '척. 그 나라 항구 가까운 바다에 자주 나타난다. 왕의 이름으로 하는 싸움이라 악명은 오르지 않지만, ' + t.nation + '의 적대는 오른다.';
    } else if (kind === 'rescue') {
      var dens = (realm.dens || []).filter(function (id) { var c = G.CITY_DATA[id]; return c && R.cityExists(c); }); if (!dens.length) return null;
      t.den = pick(dens); t.who = pick(realm.ladies || ['왕녀']); t.stage = 0;
      t.ships = U.clamp(2 + Math.floor(n / 2), 2, 4);
      t.title = '해적에게 붙잡혀 간 ' + t.who + U.jx(t.who, '을/를') + ' 구해 온다';
      t.desc = t.who + U.jx(t.who, '이/가') + ' 탄 배가 해적에게 붙잡혔다. 해적단은 ' + G.CITY_DATA[t.den].name + ' 앞바다에 숨어 있다고 한다. 그 바다로 가서 해적단(' + t.ships + '척쯤)을 쳐부수고 모셔 온다.';
      t.fame += 200;
    } else if (kind === 'pirates') {
      t.n = lin(b.shipsN, n) + 1; t.got = 0;
      t.title = '바다를 어지럽히는 해적선 ' + t.n + '척을 쳐부순다';
      t.desc = '어느 바다에서든 해적선 ' + t.n + '척을 나포하거나 가라앉힌다.';
    } else if (kind === 'letter' || kind === 'envoy') {
      var cs = courtsFor(sp); if (!cs.length) return null;
      var pool;
      if (kind === 'letter') pool = cs.slice(0, Math.min(cs.length, 3 + n));
      else {
        pool = cs.filter(function (x) { return x.realm.kind !== realm.kind || x.d > 22; });
        if (!pool.length) pool = cs.slice(Math.floor(cs.length / 2));
        pool = pool.slice(0, Math.min(pool.length, 3 + n * 2));
      }
      var to = pick(pool), who = to.sp.title, city = G.CITY_DATA[to.sp.city].name;
      t.to = to.sp.id; t.stage = 0;
      if (kind === 'letter') {
        t.title = city + '의 ' + who + '에게 친서를 전하고 답서를 받아 온다';
        t.desc = city + ' 왕궁에서 알현해 「친서를 올린다」를 고르고, 답서를 받아 돌아와 아뢴다. 그 나라 말이 통해야 알현할 수 있다.';
      } else {
        t.title = '특사로서 ' + city + '의 ' + who + U.jx(who, '과/와') + ' 우호 조약을 맺고 온다';
        t.desc = city + ' 왕궁에서 알현해 「특사로서 교섭한다」를 고른다. 웅변·매력·회계와 말이 통하는 정도가 교섭을 가른다. 예물을 올리면 쉬워진다. 깨지면 ' + b.envoyRetry + '일 뒤에 다시 교섭할 수 있다.';
        t.fame += 250; t.gold += 2000;
      }
    } else return null;
    return t;
  }
  /** 이 군주가 내놓는 왕명들 (알현할 때 정해 두고, 맡을 때까지 그대로) */
  CT.offers = function (sp) {
    var realm = CT.realmOf(sp), c = st(), n = CT.rank(realm), s = S();
    var o = c.offers[realm.id];
    if (o && o.rank === n && s.day - o.day < 120 && o.list.length) return o.list;
    var rng = U.makeRng(U.strHash('court:' + realm.id + ':' + n + ':' + s.seed + ':' + Math.floor(s.day / 120)));
    var list = [];
    ['ex', 'tr', 'bt', 'so'].slice(0, B().choices).forEach(function (cat) {
      var kinds = G.COURT.byCat[cat].slice(), got = null;
      // 섞어서 앞에서부터 — 만들 수 있는 첫 왕명
      for (var i = kinds.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), x = kinds[i]; kinds[i] = kinds[j]; kinds[j] = x; }
      // 비용 지불은 늘 고를 수 있게 교역 갈래의 둘째로 둔다
      if (cat === 'tr') kinds = ['supply', 'tribute'];
      for (var k = 0; k < kinds.length && !got; k++) got = make(kinds[k], sp, realm, n, rng);
      if (got) list.push(got);
    });
    // 납품을 내놓았으면 비용 지불도 함께 (돈으로 갚는 길은 늘 열어 둔다)
    if (list.some(function (t) { return t.kind === 'supply'; })) { var tb = make('tribute', sp, realm, n, rng); if (tb) list.push(tb); }
    c.offers[realm.id] = { rank: n, day: s.day, list: list };
    return list;
  };

  // ================================================================ 진행 상황
  function foundSince(t) {
    var s = S(), n = 0;
    Object.keys(s.disc).forEach(function (id) { var d = G.DISC[id], x = s.disc[id]; if (d && x.me && x.found >= t.taken && t.cats.indexOf(d.cat) >= 0) n++; });
    return n;
  }
  /** {done, text} */
  CT.progress = function (t) {
    var s = S();
    if (t.kind === 'geo' || t.kind === 'treasure') { var n = Math.min(t.n, foundSince(t)); return { done: n >= t.n, text: '발견 ' + n + '/' + t.n }; }
    if (t.kind === 'zoo') { var z = Math.min(t.n, zooAnimals().length); return { done: z >= t.n, text: '신기한 동물 ' + z + '/' + t.n + '종' }; }
    if (t.kind === 'supply') { var cg = s.fleet.cargo[t.good], q = cg ? cg.q : 0; return { done: q >= t.qty, text: G.GOOD[t.good].name + ' ' + Math.min(q, t.qty) + '/' + t.qty + '통' }; }
    if (t.kind === 'capture' || t.kind === 'pirates') return { done: t.got >= t.n, text: (t.kind === 'capture' ? t.nation + ' 배 ' : '해적선 ') + Math.min(t.got, t.n) + '/' + t.n + '척' };
    if (t.kind === 'rescue') return { done: t.stage >= 1, text: t.stage >= 1 ? t.who + U.jx(t.who, '을/를') + ' 배에 모셨다' : G.CITY_DATA[t.den].name + ' 앞바다의 해적단을 찾는다' };
    if (t.kind === 'letter') return { done: t.stage >= 1, text: t.stage >= 1 ? '답서를 받았다' : G.CITY_DATA[G.SPONSOR[t.to].city].name + ' 왕궁으로' };
    if (t.kind === 'envoy') return { done: t.stage >= 1, text: t.stage >= 1 ? (t.grade === 2 ? '조약을 크게 유리하게 맺었다' : '조약을 맺었다') : G.CITY_DATA[G.SPONSOR[t.to].city].name + ' 왕궁으로' };
    return { done: false, text: '' };
  };
  CT.task = function () { return st().task || null; };
  CT.dueDate = function (t) { return { y: Math.floor(t.due / 10000), m: Math.floor(t.due / 100) % 100, d: t.due % 100 }; };
  CT.remain = function (t) { return U.dayIndex(CT.dueDate(t)) - U.dayIndex(S().date); };

  // ================================================================ 알현
  function line(realm, eu, is, as) { return realm.kind === 'is' ? (is || eu) : realm.kind === 'as' ? (as || eu) : eu; }
  /** 왕궁 메뉴의 「왕명」: 부름에 답해 왕명을 고르거나, 맡은 왕명을 아뢴다 */
  CT.audience = async function (sp, auto) {
    var realm = CT.realmOf(sp); if (!realm) return;
    var c = st(), s = S(), t = c.task, who = SP().speaker(sp), n = CT.rank(realm), lad = CT.ladder(realm), home = CT.isHome(realm), me = s.player.name;
    c.seen[realm.id] = CT.level();
    if (t && t.sp === sp.id) return CT.report(sp);
    if (t) { await UI.say('자네는 지금 ' + G.SPONSOR[t.sp].title + '의 일을 맡고 있다고 들었네. 한 번에 두 군주를 섬길 수는 없는 법. 그 일부터 마치고 오게.', who); return; }
    if (!CT.pending(sp)) {
      if (n >= lad.length) await UI.say(home ? me + ', 그대는 이미 이 나라에서 오를 수 있는 가장 높은 자리에 있네. 이제 그 이름에 걸맞게 살게.' : '그대에게는 이미 이 나라가 이방인에게 내릴 수 있는 가장 큰 영예를 내렸네.', who);
      else if (c.wait[realm.id] && s.day < c.wait[realm.id]) await UI.say('지난번 일은 아직 잊지 않았네. 때가 되면 다시 부르겠네.', who);
      else await UI.say((n ? '그대의 공은 잘 알고 있네. ' : '') + '하지만 더 큰 일을 맡기기에는 아직 이르군. 그대의 이름이 더 널리 알려지거든 다시 이야기하세.\n(통합 명성 ' + U.num((n + 1) * B().step) + '이 되면 왕명을 받을 수 있습니다 — 지금 ' + U.num(s.player.fame) + ')', who);
      return;
    }
    var next = titleObj(realm, n + 1);
    // 부름의 말
    if (home) {
      await UI.say(n === 0
        ? me + ', 그대의 이름이 이 궁정에까지 들려오고 있네. 바다에서 세운 공이 그만하면, 나라가 그대를 귀족의 반열에 올려도 좋겠지.\f다만 작위는 그냥 내리는 것이 아닐세. 내가 맡기는 일 하나를 해내게. 그러면 그대를 ' + next.ko + '(' + next.native + ')에 봉하겠네.'
        : me + ', 잘 왔네. 그대의 명성이 또 한 번 온 나라에 퍼졌더군. 이번 일을 해내면 그대를 ' + next.ko + '(' + next.native + ')에 올리겠네.', who);
    } else {
      await UI.say(line(realm,
        '그대가 ' + R.nationName(s.player.nation) + '의 ' + me + '인가. 그 이름은 이 궁정에서도 들었네.\f남의 나라 사람이라도 큰 공을 세우면 영예를 내리는 것이 우리의 법도일세. 내 일을 하나 해 주게. 그러면 그대를 ' + next.ko + '(' + next.native + ')로 삼겠네.',
        '프랑크의 뱃사람 ' + me + '. 그대의 이름은 바자르의 상인들 입에도 오르내리더군.\f믿음이 달라도 공은 공일세. 내 일을 하나 해 주게. 그러면 그대에게 ' + next.ko + '(' + next.native + ')의 영예를 내리겠네.',
        '먼 서쪽 바다에서 온 ' + me + '. 그대의 소문은 이곳까지 닿았네.\f내 일을 하나 해 주게. 그러면 그대에게 ' + next.ko + '(' + next.native + ')의 자리를 내리겠네.'), who);
    }
    for (;;) {
      var list = CT.offers(sp);
      if (!list.length) { await UI.say('…지금은 그대에게 맡길 만한 일이 없군. 달이 바뀌거든 다시 오게.', who); return; }
      var pickd = await UI.choose('왕명 — ' + SP().holderName(sp), list.map(function (o) {
        var K = kindOf(o);
        return { value: o, icon: K.icon, label: '<b>' + U.esc(o.title) + '</b><br><small class="muted">' + K.name + ' · ' + G.Fame.NAME[o.cat] + ' 명성 +' + o.fame + '</small>',
          right: o.gold ? U.num(o.gold) + '닢' : '—' };
      }), { width: 860, icon: 'crown', text: '하나를 골라 해내고 돌아와 아뢰면 <b>' + U.esc(CT.fullName(next, true)) + '</b>의 작위를 받습니다. 왕명은 한 번에 하나만 맡을 수 있고, 기한은 ' + B().years + '년입니다.' });
      if (!pickd) { if (!auto) await UI.say('마음이 정해지거든 다시 오게.', who); return; }
      var K = kindOf(pickd);
      if (pickd.kind === 'tribute') {
        var okPay = await UI.confirm('<b>' + U.esc(pickd.title) + '</b><br><br>' + U.esc(pickd.desc) + '<br><br>지금 가진 금화 ' + U.num(s.player.gold) + '닢', '바친다', '그만둔다', '왕명 — ' + K.name);
        if (!okPay) continue;
        if (s.player.gold < pickd.amount) { UI.toast('금화가 모자랍니다.', 'coin'); continue; }
        s.player.gold -= pickd.amount; G.Game.refreshHud();
        pickd.sp = sp.id; pickd.realm = realm.id;
        delete c.offers[realm.id];
        await UI.say(line(realm, '나라가 어려울 때 곳간을 여는 사람이야말로 참된 귀족일세. 고맙네.', '그대의 손은 넉넉하군. 그 마음을 잊지 않겠네.', '그대의 정성을 잘 받았네.'), who);
        await finish(sp, realm, pickd);
        return;
      }
      var ok = await UI.confirm('<b>' + U.esc(pickd.title) + '</b><br><br>' + U.esc(pickd.desc) + '<br><br>하사금 금화 ' + U.num(pickd.gold) + '닢 · ' + G.Fame.NAME[pickd.cat] + ' 명성 +' + pickd.fame + ' · 기한 ' + B().years + '년<br>해내면 <b>' + U.esc(CT.fullName(next, true)) + '</b>', '맡는다', '다른 왕명을 본다', '왕명 — ' + K.name);
      if (!ok) continue;
      accept(sp, realm, pickd);
      await UI.say(acceptLine(pickd, realm), who);
      UI.toast('왕명을 받았다 — ' + pickd.title, 'crown', 5000);
      return;
    }
  };
  function acceptLine(t, realm) {
    if (t.kind === 'geo') return '세상의 끝이 어디인지, 그대의 눈으로 보고 와서 내게 들려주게.';
    if (t.kind === 'treasure') return '옛사람들이 감춘 것을 찾아내게. 그 이야기만으로도 궁정이 떠들썩해질 걸세.';
    if (t.kind === 'zoo') return '코끼리며 기린이며, 책에서만 보던 짐승들을 내 백성에게 보여 주고 싶네. 그대가 그 길을 열어 주게.';
    if (t.kind === 'supply') return G.GOOD[t.good].name + U.jx(G.GOOD[t.good].name, '은/는') + ' 궁정에서 늘 모자라는 물건일세. 값은 섭섭지 않게 치르겠네.';
    if (t.kind === 'capture') return t.nation + '의 깃발을 단 배를 보거든 사정 두지 말게. 이것은 해적질이 아니라 나라의 싸움일세.';
    if (t.kind === 'rescue') return '…' + t.who + U.jx(t.who, '은/는') + ' 내게 둘도 없는 아이일세. 부디 무사히 데려와 주게. 그대만 믿겠네.';
    if (t.kind === 'pirates') return '해적 때문에 상인들의 원성이 높네. 그대의 대포 소리로 바다를 조용하게 해 주게.';
    if (t.kind === 'letter') return '이 친서에는 내 인장이 찍혀 있네. 그대 손으로 직접 전하고, 답서를 받아 오게.';
    return '그대는 이제 내 입이요 내 얼굴일세. 예를 다하되 굽히지는 말게. 좋은 소식을 기다리겠네.';
  }
  function accept(sp, realm, o) {
    var c = st(), s = S(), t = U.clone(o);
    t.sp = sp.id; t.realm = realm.id; t.taken = today(); t.day0 = s.day;
    t.due = U.dateNum(U.addDays(s.date, Math.round(B().years * 365)));
    c.task = t; delete c.offers[realm.id];
    // 발견 왕명: 실마리를 하나 쥐여 준다
    if (t.cats) {
      var cand = discCands(t.cats).filter(function (d) { return !s.hints[d.id] && G.Disc.clueOk(d, 'sponsor'); });   // 궁정의 이야기 — 사료 갈래는 도서관에서
      if (cand.length) { var d = cand[Math.floor(U.rand() * cand.length)]; if (G.Disc.addHint(d.id, 'sponsor:' + sp.id)) UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll', 4200); }
    }
    G.State.log(SP().holderName(sp) + '의 왕명을 받았다 — ' + t.title + ' (기한 ' + U.fmtDate(CT.dueDate(t)) + ')');
    return t;
  }
  /** 맡은 왕명을 그 군주에게 아뢴다 */
  CT.report = async function (sp) {
    var c = st(), s = S(), t = c.task, realm = CT.realmOf(sp), who = SP().speaker(sp);
    if (!t || t.sp !== sp.id) return;
    var p = CT.progress(t);
    if (!p.done) {
      var v = await UI.ask('맡긴 일은 어찌 되었나?\n(' + t.title + ' — ' + p.text + ' · 남은 ' + Math.max(0, CT.remain(t)) + '일)', [
        { label: '아직 하는 중이라고 아뢴다', value: 0 },
        { label: '왕명을 내려놓는다 (신뢰 −' + B().failTrust + ' · 명성 −' + B().failFame + ')', value: 'quit' }], who);
      if (v === 'quit') {
        if (!(await UI.confirm('왕명을 내려놓겠습니까? 신뢰와 명성이 깎이고, ' + B().again + '일 동안은 다시 부르지 않습니다.', '내려놓는다', '그만둔다'))) return;
        fail(t, 'quit');
        await UI.say('…그런가. 그대를 너무 크게 보았나 보군. 물러가게.', who);
      } else await UI.say('서두르되 그르치지는 말게. 좋은 소식을 기다리겠네.', who);
      return;
    }
    if (t.kind === 'supply') { var cg = s.fleet.cargo[t.good]; cg.q -= t.qty; if (cg.q <= 0) delete s.fleet.cargo[t.good]; if (G.Cargo && G.Cargo.touch) G.Cargo.touch(); }
    if (t.kind === 'zoo') { zooAnimals().slice(0, t.n).forEach(function (d) { c.zooUsed[d.id] = 1; }); c.zoo[realm.id] = s.date.y; }
    var thanks = t.kind === 'rescue' ? '오오… ' + t.who + '! 무사했구나!\f' + s.player.name + ', 이 은혜는 평생 잊지 않겠네.'
      : t.kind === 'zoo' ? '이 그림들 좀 보게! 이런 짐승이 정말 세상에 있단 말인가. 당장 사람을 보내 데려오게 하고, 성 밖에 동물원을 짓겠네.'
      : t.kind === 'supply' ? '오, 정말로 구해 왔군. 창고지기가 기뻐하겠네.'
      : t.kind === 'capture' ? t.nation + ' 놈들이 그대의 깃발만 보아도 뱃머리를 돌린다지. 통쾌한 일일세!'
      : t.kind === 'pirates' ? '상인들이 그대 이름을 부르며 잔을 든다더군. 잘해 주었네.'
      : t.kind === 'letter' ? '답서로군. …흠, 좋아. 그대가 길을 잘 닦아 주었네.'
      : t.kind === 'envoy' ? (t.grade === 2 ? '이런 조건을 받아 오다니! 내 신하들 가운데도 그대만 한 사람이 없네.' : '조약을 맺고 왔군. 수고했네. 두 나라 사이가 한결 편안해지겠어.')
      : '그대가 본 것을 들으니 내가 다스리는 땅이 얼마나 작은지 알겠네. 훌륭하네.';
    await UI.say(thanks, who);
    c.task = null;
    await finish(sp, realm, t);
  };
  /** 보상과 서임 */
  async function finish(sp, realm, t) {
    var c = st(), s = S(), who = SP().speaker(sp), rel = SP().rel(sp.id);
    var late = t.due && today() > t.due, fame = t.fame, gold = t.gold || 0;
    if (t.kind === 'envoy' && t.grade === 2) { fame = Math.round(fame * 1.3); gold = Math.round(gold * 1.3); }
    if (late) { fame = Math.round(fame * 0.7); gold = Math.round(gold * 0.5); }
    s.player.gold += gold; G.Fame.add(t.cat, fame);
    SP().addTrust(rel, B().trust); rel.done = (rel.done || 0) + 1;
    c.done = (c.done || 0) + 1;
    var n = CT.rank(realm) + 1, tt = titleObj(realm, n), home = CT.isHome(realm), me = s.player.name;
    c.titles[realm.id] = n;
    delete c.called[realm.id]; delete c.herald[realm.id];
    G.Game.refreshHud();
    if (G.Audio) G.Audio.sfx('discover');
    await UI.say(line(realm,
      '무릎을 꿇게, ' + me + '.\f…이 칼이 그대의 어깨에 닿는 순간부터, 그대는 ' + (home ? '' : '이 나라의 ') + tt.ko + '일세. 일어나게, ' + (tt.call || tt.ko) + '.',
      '가까이 오게, ' + me + '.\f이 예복과 칼을 받게. 오늘부터 그대는 ' + tt.ko + '일세. 내 땅 어디서든 그 이름으로 대접받을 걸세.',
      '가까이 오게, ' + me + '.\f이 교지를 받게. 오늘부터 그대는 ' + tt.ko + '일세.'), who);
    var courtier = CT.courtier(sp);
    if (courtier) await UI.say(line(realm,
      SP().holderName(sp) + '의 이름으로 선포합니다. ' + me + U.jx(me, '은/는') + ' 이제 ' + CT.fullName(tt, true) + '이며, 이 교서가 그 권리와 의무를 증명할 것입니다.',
      SP().holderName(sp) + '의 명에 따라 선포합니다. ' + me + U.jx(me, '은/는') + ' 오늘부터 ' + CT.fullName(tt, true) + '의 지위와 예우를 받습니다.',
      SP().holderName(sp) + '의 교지입니다. ' + me + U.jx(me, '을/를') + ' ' + CT.fullName(tt, true) + U.jx(CT.fullName(tt, true), '으로/로') + ' 삼았음을 널리 알립니다.'), courtier);
    G.State.log(SP().holderName(sp) + '에게서 ' + CT.fullName(tt, true) + '의 작위를 받았다. (' + kindOf(t).name + ' — 하사금 ' + U.num(gold) + '닢, ' + G.Fame.NAME[t.cat] + ' 명성 +' + fame + ')');
    var more = n < CT.ladder(realm).length ? '<br><span class="muted">다음 작위: ' + U.esc(CT.ladder(realm)[n][0]) + ' — 통합 명성 ' + U.num((n + 1) * B().step) + '부터</span>' : '<br><span class="muted">이 나라에서 받을 수 있는 가장 높은 작위입니다.</span>';
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">' + U.esc(realm.name) + (home ? '' : ' · 명예 작위') + '</div>' +
      '<div style="font-size:34px;font-weight:800;margin:6px 0">' + U.esc(tt.ko) + '</div><div style="font-size:20px;font-style:italic">' + U.esc(tt.native) + '</div></div><br>' +
      (gold ? '하사금 금화 <b>' + U.num(gold) + '</b>닢 · ' : '') + G.Fame.NAME[t.cat] + ' 명성 <b>+' + fame + '</b> · 신뢰 +' + B().trust + (late ? '<br><span class="muted">기한을 넘겨 보상이 줄었다</span>' : '') +
      '<br>이제 유럽과 이슬람의 도시에서는 사람들이 제독을 「' + U.esc(adr(tt)) + '」' + U.jx(adr(tt), '이라/라') + ' 부르며 예를 갖춥니다.' +
      (t.kind === 'zoo' ? '<br>' + G.CITY_DATA[sp.city].name + '에 왕립 동물원이 섰습니다.' : '') + more, '서임');
    UI.toast(CT.fullName(tt, true) + '의 작위를 받았다!', 'crown', 6500);
    G.Game.refreshHud();
    if (s.settings.autosave !== false && G.State.save) G.State.save(0);
  }
  function fail(t, why) {
    var c = st(), s = S(), sp = G.SPONSOR[t.sp], rel = SP().rel(t.sp);
    SP().addTrust(rel, -B().failTrust); rel.fail = (rel.fail || 0) + 1;
    G.Fame.add(t.cat, -B().failFame);
    c.wait[t.realm] = s.day + B().again;
    c.task = null;
    G.State.log(SP().holderName(sp) + '의 왕명을 ' + (why === 'late' ? '기한 안에 해내지 못했다' : '내려놓았다') + ' — ' + t.title);
    G.Game.refreshHud();
  }

  // ================================================================ 다른 궁정에서: 친서·특사
  /** 이 군주가 맡은 친서·특사의 상대인가 */
  CT.missionAt = function (sp) { var t = st().task; return t && (t.kind === 'letter' || t.kind === 'envoy') && t.to === sp.id && !t.stage ? t : null; };
  CT.mission = async function (sp) {
    var t = CT.missionAt(sp); if (!t) return;
    var s = S(), who = SP().speaker(sp), from = G.SPONSOR[t.sp], fromName = SP().holderName(from), rel = SP().rel(sp.id);
    if (t.kind === 'letter') {
      await UI.say(from.title + ' ' + fromName + '의 친서를 가져왔습니다. 직접 전해 올리라는 분부였습니다.', SP().me(sp));
      await UI.say('…' + fromName + '의 인장이 맞군. 먼 길을 왔네.\f(한참 뒤) 답서를 썼네. 이것을 그대의 군주에게 전하게. 그리고 길에서 본 것 가운데 재미있는 이야기가 있으면 다음에 들려주게.', who);
      t.stage = 1; SP().addTrust(rel, 3);
      G.State.log(SP().holderName(sp) + '에게 ' + fromName + '의 친서를 전하고 답서를 받았다.');
      UI.toast('답서를 받았다. ' + G.CITY_DATA[from.city].name + '로 돌아가 아뢰자.', 'scroll', 5000);
      return;
    }
    if (t.retry && s.day < t.retry) { await UI.say('그 이야기는 지난번에 끝났네. 생각이 바뀌려면 시간이 더 필요하네.\n(' + (t.retry - s.day) + '일 뒤에 다시 교섭할 수 있습니다)', who); return; }
    var lang = SP().langLv(sp), sp1 = R.skill('speech'), cha = R.stat('cha'), score = 0, b = B();
    function p(base, sk, stat) { return U.clamp(base + sk * 0.15 + (stat - 50) * 0.006 + (lang - 1) * 0.06, 0.08, 0.95); }
    function pct(x) { return Math.round(x * 100) + '%'; }
    await UI.say(from.title + ' ' + fromName + '의 특사로 왔습니다. 두 나라의 우의를 글로 남기고자 합니다.', SP().me(sp));
    await UI.say('특사라… 좋네, 들어 보지. 그대의 군주는 내게 무엇을 바라는가?', who);
    // ① 첫인사
    var gift = 1500 + sp.pw * 700, p1 = p(0.4, sp1, cha);
    var a = await UI.ask('어떻게 말을 꺼낼까?', [
      { label: '예물을 올린다 (금화 ' + U.num(gift) + '닢)', value: 'gift' },
      { label: '격식을 갖춰 길게 인사한다 (' + pct(p1) + ')', value: 'bow' },
      { label: '곧바로 용건을 꺼낸다', value: 'go' }], SP().me(sp));
    if (a === 'gift' && s.player.gold < gift) { UI.toast('예물을 살 금화가 모자랍니다.', 'coin'); a = 'go'; }
    if (a === 'gift') { s.player.gold -= gift; score += 2; G.Game.refreshHud(); await UI.say('호오, 이런 것을 다. 그대의 군주는 예를 아는 사람이로군.', who); }
    else if (a === 'bow') { if (U.chance(p1)) { score += 1; await UI.say('말솜씨가 좋군. 듣기 싫지 않네.', who); } else await UI.say('…인사가 길군. 요점을 말하게.', who); }
    else await UI.say('성미가 급하군. 뭐, 좋네.', who);
    // ② 무엇을 내세울까
    var by = G.Fame.sync(), p2a = p(0.3 + Math.min(0.2, by.tr / 60000), R.skill('acct'), cha), p2b = p(0.3 + Math.min(0.2, by.bt / 60000), sp1, R.stat('mar')), p2c = p(0.35, sp1, cha);
    var v2 = await UI.ask('무엇을 내세울까?', [
      { label: '두 나라가 교역으로 얻을 이익을 셈해 보인다 (' + pct(p2a) + ')', value: 'a' },
      { label: '함께 맞설 적이 있음을 일깨운다 (' + pct(p2b) + ')', value: 'b' },
      { label: '두 군주의 오랜 우의를 말한다 (' + pct(p2c) + ')', value: 'c' }], SP().me(sp));
    var ok2 = U.chance(v2 === 'a' ? p2a : v2 === 'b' ? p2b : p2c);
    if (ok2) { score += 2; await UI.say(v2 === 'a' ? '…셈이 맞군. 내 재무관도 같은 말을 하더군.' : v2 === 'b' ? '그 말은 옳네. 적의 적은 벗이지.' : '그대의 군주가 그리 생각한다니 반가운 일일세.', who); }
    else await UI.say(v2 === 'a' ? '그 셈은 그대들에게만 좋은 셈이 아닌가?' : v2 === 'b' ? '내 적은 내가 정하네.' : '말은 듣기 좋군. 하지만 말뿐이라면 곤란하네.', who);
    // ③ 마무리
    var p3 = p(0.35, sp1, cha);
    var v3 = await UI.ask('조약문의 마지막 조항을 두고 맞서고 있다.', [
      { label: '한 걸음 물러나 조약을 맺는다', value: 'yield' },
      { label: '끝까지 버틴다 (' + pct(p3) + ' — 깨질 수도 있다)', value: 'hold' }], SP().me(sp));
    if (v3 === 'yield') score += 1; else score += U.chance(p3) ? 3 : -2;
    if (score >= 2) {
      t.stage = 1; t.grade = score >= 5 ? 2 : 1; SP().addTrust(rel, 5);
      await UI.say(t.grade === 2 ? '…졌네. 그대 같은 사람을 특사로 보낸 그대의 군주가 부럽군. 조약문에 인장을 찍겠네.' : '좋네. 이 정도면 두 나라 모두 체면이 서겠지. 인장을 찍겠네.', who);
      G.State.log(SP().holderName(sp) + U.jx(SP().holderName(sp), '과/와') + ' ' + fromName + '의 우호 조약을 맺었다.' + (t.grade === 2 ? ' (크게 유리한 조건)' : ''));
      UI.toast('조약을 맺었다. ' + G.CITY_DATA[from.city].name + '로 돌아가 아뢰자.', 'handshake', 5000);
    } else {
      t.retry = s.day + b.envoyRetry;
      await UI.say('이야기는 여기까지 하세. 오늘은 뜻이 맞지 않는군.', who);
      UI.toast('교섭이 깨졌다. ' + b.envoyRetry + '일 뒤에 다시 교섭할 수 있다.', 'handshake', 5000);
    }
  };

  // ================================================================ 왕궁 메뉴·들어설 때
  /** 왕궁 메뉴에 끼워 넣을 줄 */
  CT.palaceItems = function (sp) {
    var realm = CT.realmOf(sp), out = [], t = st().task;
    var m = CT.missionAt(sp);
    if (m) out.push({ label: m.kind === 'letter' ? '친서를 올린다' : '특사로서 교섭한다', icon: m.kind === 'letter' ? 'scroll' : 'handshake', sub: G.SPONSOR[m.sp].title + '의 왕명', onClick: function () { return CT.mission(sp); } });
    if (realm) {
      var sub = '', dim = false;
      if (t && t.sp === sp.id) sub = CT.progress(t).done ? '아뢸 수 있다' : '수행 중';
      else if (CT.pending(sp) && !t) sub = CT.isHome(realm) ? '부르심' : '명예 작위';
      else { var tt = CT.title(realm); sub = tt ? tt.ko : ''; dim = true; }
      out.push({ label: '왕명', icon: 'crown', sub: sub, dim: dim, onClick: function () { return CT.audience(sp); } });
      var held = CT.marques().filter(function (x) { return x.realm === realm; }).length + CT.exempts().filter(function (x) { return x.realm === realm; }).length;
      out.push({ label: '특허장', icon: 'seal', sub: CT.rank(realm) ? (held ? '가진 것 ' + held + '장' : '사략허가장 · 면세증') : '작위 필요', dim: !CT.rank(realm), onClick: function () { return CT.charters(sp); } });
    }
    return out;
  };
  /** 알현 인사 뒤: 부름이 있으면(다른 나라는 이 단계에서 처음 알현했을 때) 군주가 먼저 말을 꺼낸다 */
  CT.onEnter = async function (sp) {
    var realm = CT.realmOf(sp); if (!realm) return;
    var c = st(), t = c.task;
    if (t && t.sp === sp.id && CT.progress(t).done) return CT.report(sp);
    if (t || !CT.pending(sp)) return;
    if (!CT.isHome(realm) && c.seen[realm.id] === CT.level()) return;   // 다른 나라: 한 단계에 한 번만 먼저 꺼낸다 (그 뒤로는 메뉴의 「왕명」)
    return CT.audience(sp, true);
  };
  /** 도시에 들어설 때: 제 나라 수도면 왕실 전령이 부름을 전한다 */
  CT.arrival = async function (c) {
    var sp = homeSponsor(); if (!sp || sp.city !== c.id) return;
    var cs = st(), realm = CT.realmOf(sp), lv = CT.level();
    var t = cs.task;
    if (t && t.sp === sp.id && CT.progress(t).done) { UI.toast(SP().holderName(sp) + '에게 왕명을 마쳤다고 아뢸 수 있습니다.', 'crown', 5000); return; }
    if (t || !CT.pending(sp) || cs.herald[realm.id] === lv) return;
    cs.herald[realm.id] = lv; cs.called[realm.id] = lv;
    var C = G.Scenes.city, who = C.npc('herald', '왕실 전령');
    await C.say(who, S().player.name + ' 제독이십니까? 한참을 찾았습니다!\f' + SP().holderName(sp) + ' ' + SP().honor(sp) + '께서 제독을 부르십니다. 왕궁으로 드시어 알현하라는 분부입니다.');
  };
  /** 날마다: 부름의 소식, 왕명의 기한 */
  CT.daily = function () {
    var s = S(), out = [], c = st(), t = c.task;
    papersDaily(out);
    if (t && today() > t.due && !CT.progress(t).done && !t.lateTold) {
      t.lateTold = true;
      var spT = G.SPONSOR[t.sp];
      out.push({ icon: 'hourglass', text: SP().holderName(spT) + '의 왕명 기한이 지났다 — ' + t.title + '. 군주의 신뢰가 떨어졌다.' });
      fail(t, 'late');
    }
    // 왕명을 내린 궁정·찾아갈 궁정·칠 나라가 사라졌으면 왕명을 거둔다 (벌은 없다)
    t = c.task;
    if (t) {
      var gone = !SP().present(G.SPONSOR[t.sp]) ? '왕명을 내린 궁정이 비어'
        : (t.kind === 'letter' || t.kind === 'envoy') && !t.stage && !SP().present(G.SPONSOR[t.to]) ? '찾아갈 궁정이 비어'
        : t.kind === 'capture' && t.got < t.n && s.date.d === 1 && !G.CITY_DATA.some(function (x) { return x.port && R.cityExists(x) && R.cityOwner(x) === t.nation; }) ? t.nation + U.jx(t.nation, '이/가') + ' 바다에서 사라져' : '';
      if (gone) {
        c.task = null;
        out.push({ icon: 'crown', text: gone + ' 왕명이 거두어졌다 — ' + t.title });
        G.State.log(gone + ' 왕명이 거두어졌다 — ' + t.title);
      }
    }
    var sp = homeSponsor();
    if (sp && !c.task && CT.pending(sp)) {
      var realm = CT.realmOf(sp), lv = CT.level();
      if (c.called[realm.id] !== lv) {
        c.called[realm.id] = lv;
        var msg = SP().holderName(sp) + ' ' + SP().honor(sp) + '께서 제독을 부르신다 — ' + G.CITY_DATA[sp.city].name + ' 왕궁으로 알현하러 오라는 전갈이다. (통합 명성 ' + U.num(s.player.fame) + ')';
        out.push({ icon: 'crown', text: msg, history: true });
        G.State.log(msg);
      }
    }
    return out;
  };

  // ================================================================ 특허장: 사략허가장·면세증
  function PP() { return B().papers || { marqueFee: 6000, marqueYears: 2, bounty: 500, bountyFame: 10, marqueSpawn: 0.12, exemptFee: 12000, exemptYears: 1, duty: 0.08, rankCut: 0.05 }; }
  function papers() { var c = st(); if (!c.papers) c.papers = {}; if (!c.papers.marque) c.papers.marque = {}; if (!c.papers.exempt) c.papers.exempt = {}; return c.papers; }
  function dateOfNum(n) { return { y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }; }
  /** 지금 쓸 수 있는 사략허가장: [{realm, nation, until}] */
  CT.marques = function () {
    if (!S()) return [];
    var mq = papers().marque, now = today();
    return Object.keys(mq).filter(function (k) { return G.COURT.realms[k] && mq[k].until >= now; }).map(function (k) { return { realm: G.COURT.realms[k], nation: mq[k].nation, until: mq[k].until }; });
  };
  CT.marqueFor = function (nation) { return nation ? CT.marques().filter(function (m) { return m.nation === nation; })[0] || null : null; };
  /** 지금 쓸 수 있는 면세증: [{realm, until}] */
  CT.exempts = function () {
    if (!S()) return [];
    var ex = papers().exempt, now = today();
    return Object.keys(ex).filter(function (k) { return G.COURT.realms[k] && ex[k] >= now; }).map(function (k) { return { realm: G.COURT.realms[k], until: ex[k] }; });
  };
  /** 이 도시 교역소에서 면세증으로 덜어지는 관세 (0이면 없음) — 사는 값 ×(1−값), 들여온 물건 파는 값 ×(1+값) */
  CT.duty = function (c) {
    if (!c || !S() || !S().court || !S().court.papers) return 0;
    var own = R.cityOwner(c);
    return CT.exempts().some(function (e) { return e.realm.lands.indexOf(own) >= 0; }) ? PP().duty : 0;
  };
  function paperFee(base, realm) { var t = CT.title(realm); return Math.round(base * Math.max(0.5, 1 - PP().rankCut * (t ? t.w : 0)) / 100) * 100; }
  /** 왕궁 메뉴 「특허장」: 사략허가장·면세증을 받는다 (그 나라의 작위가 있어야 한다) */
  CT.charters = async function (sp) {
    var realm = CT.realmOf(sp); if (!realm) return;
    var s = S(), who = SP().speaker(sp), pp = PP(), pa = papers(), tt = CT.title(realm);
    if (!tt) { await UI.say('특허장은 내 사람에게만 내리는 것일세. 먼저 내가 맡기는 일을 해내고 작위를 받게.', who); return; }
    await UI.say(line(realm, tt.ko + ' ' + s.player.name + ', 무엇을 청하러 왔나? 내 인장이 필요한 일이라면 말해 보게.', tt.ko + ' ' + s.player.name + ', 무엇을 청하러 왔는가? 내 투그라가 필요한 일이라면 말해 보게.', tt.ko + ' ' + s.player.name + ', 무엇을 청하러 왔는가?'), who);
    for (;;) {
      var mq = pa.marque[realm.id], mqOn = mq && mq.until >= today(), exOn = pa.exempt[realm.id] && pa.exempt[realm.id] >= today();
      var foes = foesNow(realm), mFee = paperFee(pp.marqueFee, realm), eFee = paperFee(pp.exemptFee, realm);
      var v = await UI.choose('특허장 — ' + SP().holderName(sp), [
        { value: { kind: 'marque' }, icon: 'sword', label: '<b>사략허가장</b><br><small class="muted">' + (foes.length ? '적국 하나를 정해 ' + pp.marqueYears + '년 — 그 나라 배를 쳐도 악명이 오르지 않고, 한 척마다 포상금 ' + U.num(pp.bounty) + '닢·전투 명성 +' + pp.bountyFame : '지금은 이 나라가 싸우는 나라가 없다') + (mqOn ? ' · 지금: ' + U.esc(mq.nation) + ' (' + U.fmtDate(dateOfNum(mq.until)) + '까지)' : '') + '</small>', right: U.num(mFee) + '닢' },
        { value: { kind: 'exempt' }, icon: 'seal', label: '<b>면세증</b><br><small class="muted">' + pp.exemptYears + '년 — ' + U.esc(realm.name) + '의 항구 교역소에서 사는 값 −' + Math.round(pp.duty * 100) + '%, 들여온 물건 파는 값 +' + Math.round(pp.duty * 100) + '%' + (exOn ? ' · 지금: ' + U.fmtDate(dateOfNum(pa.exempt[realm.id])) + '까지' : '') + '</small>', right: U.num(eFee) + '닢' }
      ], { width: 860, icon: 'seal', text: '작위가 높을수록 값이 쌉니다. 이미 가진 특허장을 다시 받으면 기한이 오늘부터 새로 잡힙니다. 소지금 ' + U.num(s.player.gold) + '닢' });
      if (!v) return;
      if (v.kind === 'marque') {
        if (!foes.length) { await UI.say('지금은 칼을 겨눌 나라가 없네. 평화는 좋은 것이지.', who); continue; }
        var nat = await UI.choose('어느 나라의 배를 칠 것인가', foes.map(function (f) { return { value: { kind: 'nation', nation: f }, icon: 'flag', label: U.esc(f), right: G.Hostile ? '적대 ' + G.Hostile.get(f) : '' }; }),
          { width: 520, icon: 'sword', text: '사략허가장에는 한 나라만 적습니다. 그 나라의 적대는 예전대로 오릅니다(사략함대가 제독을 쫓을 수 있습니다).' });
        if (!nat) continue;
        if (s.player.gold < mFee) { UI.toast('금화가 모자랍니다. (' + U.num(mFee) + '닢)', 'coin'); continue; }
        s.player.gold -= mFee; G.Game.refreshHud();
        pa.marque[realm.id] = { nation: nat.nation, until: U.dateNum(U.addDays(s.date, Math.round(pp.marqueYears * 365))) };
        await UI.say(nat.nation + '의 깃발을 단 배라면 상선이든 군함이든 그대의 것일세. 다만 그 밖의 배에 손을 대면 그대는 그저 해적일 뿐이야. 명심하게.', who);
        G.State.log(SP().holderName(sp) + '에게서 ' + nat.nation + '에 대한 사략허가장을 받았다. (' + U.fmtDate(dateOfNum(pa.marque[realm.id].until)) + '까지, ' + U.num(mFee) + '닢)');
        UI.toast('사략허가장을 받았다 — ' + nat.nation + ' · ' + U.fmtDate(dateOfNum(pa.marque[realm.id].until)) + '까지', 'sword', 5500);
      } else {
        if (s.player.gold < eFee) { UI.toast('금화가 모자랍니다. (' + U.num(eFee) + '닢)', 'coin'); continue; }
        s.player.gold -= eFee; G.Game.refreshHud();
        pa.exempt[realm.id] = U.dateNum(U.addDays(s.date, Math.round(pp.exemptYears * 365)));
        await UI.say('이 문서를 세관에 보이게. 내 항구에서는 누구도 그대의 짐에 관세를 매기지 못할 걸세.', who);
        G.State.log(SP().holderName(sp) + '에게서 ' + realm.name + '의 면세증을 받았다. (' + U.fmtDate(dateOfNum(pa.exempt[realm.id])) + '까지, ' + U.num(eFee) + '닢)');
        UI.toast(realm.name + '의 면세증을 받았다 — ' + U.fmtDate(dateOfNum(pa.exempt[realm.id])) + '까지', 'seal', 5500);
      }
    }
  };
  /** 기한이 끝난 특허장을 알리고 치운다 (CT.daily) */
  function papersDaily(out) {
    var c = S().court; if (!c || !c.papers) return;
    var now = today(), pa = papers();
    Object.keys(pa.marque).forEach(function (k) { if (pa.marque[k].until < now) { out.push({ icon: 'sword', text: (G.COURT.realms[k] ? G.COURT.realms[k].name : k) + '의 사략허가장(' + pa.marque[k].nation + ') 기한이 끝났다.' }); delete pa.marque[k]; } });
    Object.keys(pa.exempt).forEach(function (k) { if (pa.exempt[k] < now) { out.push({ icon: 'seal', text: (G.COURT.realms[k] ? G.COURT.realms[k].name : k) + '의 면세증 기한이 끝났다.' }); delete pa.exempt[k]; } });
  }
  /** 수첩: 가진 특허장 */
  CT.papersHtml = function () {
    var a = CT.marques().map(function (m) { return '<span class="tag" title="그 나라 배를 쳐도 악명이 오르지 않고 한 척마다 포상금">사략허가장 — ' + U.esc(m.realm.name) + ' → ' + U.esc(m.nation) + ' (' + U.fmtDate(dateOfNum(m.until)) + '까지)</span>'; })
      .concat(CT.exempts().map(function (e) { return '<span class="tag" title="그 나라 항구 교역소에서 사는 값 −' + Math.round(PP().duty * 100) + '%, 들여온 물건 파는 값 +' + Math.round(PP().duty * 100) + '%">면세증 — ' + U.esc(e.realm.name) + ' (' + U.fmtDate(dateOfNum(e.until)) + '까지)</span>'; }));
    return a.join(' ');
  };

  // ================================================================ 바다: 나포·구출
  /** 왕명으로 치는 배인가 (악명이 오르지 않는다) */
  CT.lawful = function (npc) { var t = st().task; if (!npc || npc.kind === 'pirate') return false; return !!(t && t.kind === 'capture' && npc.nation === t.nation) || !!CT.marqueFor(npc.nation); };
  /** sea.js spawnNpcs: 왕명과 얽힌 배를 내보낸다 (없으면 null) */
  CT.spawn = function (npcs) { return spawnTask(npcs) || spawnMarque(npcs); };
  /** 사략허가장: 겨눈 나라의 항구 가까운 바다에 그 나라 배가 나타난다 */
  function spawnMarque(npcs) {
    var s = S(), l = s.loc, b = B(), pp = PP(); if (!G.Ships || npcs.length >= 4) return null;
    var ms = CT.marques().filter(function (m) {
      return !npcs.some(function (n) { return n.nation === m.nation && n.kind !== 'pirate'; }) &&
        G.CITY_DATA.some(function (c) { return c.port && R.cityExists(c) && R.cityOwner(c) === m.nation && G.Geo.dist(l.lon, l.lat, c.lon, c.lat) < b.warNear; });
    });
    if (!ms.length || !U.chance(pp.marqueSpawn)) return null;
    var m = ms[Math.floor(U.rand() * ms.length)];
    for (var i = 0; i < 10; i++) {
      var ang = U.rf(0, Math.PI * 2), dist = U.rf(2.5, 5), lon = l.lon + Math.cos(ang) * dist, lat = l.lat + Math.sin(ang) * dist;
      if (!G.Geo.isSea(lon, lat, 1)) continue;
      var kind = U.chance(0.7) ? 'merchant' : 'navy', n = U.ri(1, 3), z = G.Ships.zone(lon, lat), K = Math.min(1, s.player.fame / ((G.BALANCE && G.BALANCE.pirateFame) || 4000)) * 0.8;
      var npc = { id: 'court_' + Math.random().toString(36).slice(2), kind: kind, court: 'marque', nation: m.nation, lon: lon, lat: lat, heading: U.rf(0, 6.28), n: n, K: K,
        spd: U.rf(0.9, 1.3), life: U.ri(8, 14), hostile: false, zone: z, ships: G.Ships.enemyTypes(kind, z, m.nation, n, K, s.date.y) };
      if (G.SeaFolk) G.SeaFolk.decorate(npc, npcs);
      return npc;
    }
    return null;
  }
  function spawnTask(npcs) {
    var s = S(), t = st().task, l = s.loc, b = B(); if (!t || !G.Ships) return null;
    function place(minD, maxD) {
      for (var i = 0; i < 10; i++) {
        var ang = U.rf(0, Math.PI * 2), dist = U.rf(minD, maxD), lon = l.lon + Math.cos(ang) * dist, lat = l.lat + Math.sin(ang) * dist;
        if (G.Geo.isSea(lon, lat, 1)) return { lon: lon, lat: lat };
      }
      return null;
    }
    if (t.kind === 'rescue' && !t.stage) {
      var den = G.CITY_DATA[t.den], dk = den.dock || [den.lat, den.lon];
      if (G.Geo.dist(l.lon, l.lat, dk[1], dk[0]) > b.denNear || npcs.some(function (n) { return n.court === 'rescue'; }) || (t.cd && s.day < t.cd)) return null;
      var p = place(1.2, 2.2); if (!p) return null;
      var zone = G.Ships.zone(p.lon, p.lat), K = Math.min(1, 0.45 + 0.08 * (st().titles[t.realm] || 0));
      t.cd = s.day + 2;
      UI.toast('수평선에 해적단의 검은 돛이 보인다 — ' + t.who + U.jx(t.who, '을/를') + ' 붙잡아 간 놈들이다!', 'skull', 5200);
      return { id: 'court_' + Math.random().toString(36).slice(2), kind: 'pirate', court: 'rescue', lon: p.lon, lat: p.lat, heading: Math.atan2(l.lat - p.lat, G.Geo.wrapLon(l.lon - p.lon)), n: t.ships, K: K,
        spd: U.rf(1.0, 1.3), life: 20, hostile: true, zone: zone, ships: G.Ships.enemyTypes('pirate', zone, null, t.ships, K, s.date.y) };
    }
    if (t.kind === 'capture' && t.got < t.n) {
      if (npcs.length >= 4 || npcs.some(function (n) { return n.nation === t.nation && n.kind !== 'pirate'; }) || !U.chance(b.warSpawn)) return null;
      var near = G.CITY_DATA.some(function (c) { return c.port && R.cityExists(c) && R.cityOwner(c) === t.nation && G.Geo.dist(l.lon, l.lat, c.lon, c.lat) < b.warNear; });
      if (!near) return null;
      var q = place(2.5, 5); if (!q) return null;
      var kind = U.chance(0.6) ? 'merchant' : 'navy', n = U.ri(1, 3), z2 = G.Ships.zone(q.lon, q.lat), K2 = Math.min(1, s.player.fame / ((G.BALANCE && G.BALANCE.pirateFame) || 4000)) * 0.8;
      var npc = { id: 'court_' + Math.random().toString(36).slice(2), kind: kind, court: 'capture', nation: t.nation, lon: q.lon, lat: q.lat, heading: U.rf(0, 6.28), n: n, K: K2,
        spd: U.rf(0.9, 1.3), life: U.ri(8, 14), hostile: false, zone: z2, ships: G.Ships.enemyTypes(kind, z2, t.nation, n, K2, s.date.y) };
      if (G.SeaFolk) G.SeaFolk.decorate(npc, npcs);
      return npc;
    }
    return null;
  }
  /** sea.js encounter: 왕녀를 붙잡아 간 해적단을 만났을 때의 말 */
  CT.encounterText = function (n) {
    var t = st().task; if (!t || n.court !== 'rescue' || t.kind !== 'rescue') return '';
    return '제독! 저 검은 돛 — ' + t.who + U.jx(t.who, '을/를') + ' 붙잡아 간 해적단입니다! ' + n.n + '척입니다. 쳐부수고 구해 내야 합니다!';
  };
  /** battle.js finish: 이긴 해전을 왕명에 적는다 */
  CT.afterBattle = function (npc, res, ships, lines) {
    if (res !== 'win' || !npc) return;
    var beaten = (ships || []).filter(function (x) { return x.side === 'en' && (x.sunk || x.captured); }).length;
    // 사략허가장: 겨눈 나라의 배를 꺾으면 한 척마다 포상금과 전투 명성
    var mq = npc.kind !== 'pirate' && CT.marqueFor(npc.nation);
    if (mq && beaten) {
      var pp = PP(), bg = beaten * pp.bounty, bf = beaten * pp.bountyFame;
      S().player.gold += bg; G.Fame.add('bt', bf);
      if (lines) lines.push('사략 포상금 금화 ' + U.num(bg) + '닢 · 전투 명성 +' + bf + ' <span class="muted">(' + U.esc(mq.realm.name) + '의 사략허가장 — ' + U.esc(npc.nation) + ' 배 ' + beaten + '척)</span>');
    }
    var t = st().task; if (!t) return;
    if (t.kind === 'rescue' && npc.court === 'rescue' && !t.stage) {
      t.stage = 1;
      var m = '해적선의 선창에 갇혀 있던 ' + t.who + U.jx(t.who, '을/를') + ' 구해 냈다! 「…고맙습니다, 제독. 이 은혜는 잊지 않겠어요.」';
      if (lines) lines.push('<b>' + U.esc(m) + '</b>');
      G.State.log(t.who + U.jx(t.who, '을/를') + ' 해적에게서 구해 냈다.');
      UI.toast(t.who + U.jx(t.who, '을/를') + ' 배에 모셨다. ' + G.CITY_DATA[G.SPONSOR[t.sp].city].name + '로 돌아가자.', 'crown', 6000);
    } else if (t.kind === 'capture' && npc.kind !== 'pirate' && npc.nation === t.nation && beaten && t.got < t.n) {
      t.got = Math.min(t.n, t.got + beaten);
      if (lines) lines.push('왕명 — ' + t.nation + ' 배 ' + t.got + '/' + t.n + '척' + (t.got >= t.n ? ' <b>다 해냈다. 돌아가 아뢰자.</b>' : ''));
    } else if (t.kind === 'pirates' && npc.kind === 'pirate' && beaten && t.got < t.n) {
      t.got = Math.min(t.n, t.got + beaten);
      if (lines) lines.push('왕명 — 해적선 ' + t.got + '/' + t.n + '척' + (t.got >= t.n ? ' <b>다 해냈다. 돌아가 아뢰자.</b>' : ''));
    }
  };

  // ================================================================ 수첩
  /** 제독 쪽: 가진 작위 */
  CT.titlesHtml = function () {
    var ts = CT.titles(); if (!ts.length) return '<span class="muted">없음 — 통합 명성 ' + U.num(B().step) + '부터 국왕이 부른다</span>';
    return ts.map(function (t) { return '<span class="tag" title="' + U.esc(t.realm.name) + (t.home ? '' : ' · 명예 작위') + '">' + U.esc(CT.fullName(t, true)) + '</span>'; }).join(' ');
  };
  /** 계약·의뢰 쪽: 맡은 왕명 */
  CT.taskHtml = function () {
    var c = st(), t = c.task, html = '<div class="sep"></div><h4 style="margin:0 0 8px">왕명</h4>';
    if (t) {
      var sp = G.SPONSOR[t.sp], p = CT.progress(t), left = CT.remain(t), realm = G.COURT.realms[t.realm], next = titleObj(realm, CT.rank(realm) + 1);
      html += '<div class="kv"><div>군주</div><div>' + SP().holderName(sp) + ' (' + sp.title + ', ' + G.CITY_DATA[sp.city].name + ')</div>' +
        '<div>왕명</div><div><b>' + U.esc(t.title) + '</b> <span class="tag">' + kindOf(t).name + '</span></div>' +
        '<div>상태</div><div>' + (p.done ? '<span class="good-text">' + U.esc(p.text) + ' — 돌아가 아뢰십시오</span>' : U.esc(p.text)) + '</div>' +
        '<div>기한</div><div>' + U.fmtDate(CT.dueDate(t)) + (left < 0 ? ' <span class="warn-text">(지남)</span>' : ' (남은 ' + left + '일)') + '</div>' +
        '<div>보상</div><div>' + (next ? '<b>' + U.esc(CT.fullName(next, true)) + '</b> · ' : '') + (t.gold ? '금화 ' + U.num(t.gold) + '닢 · ' : '') + G.Fame.NAME[t.cat] + ' 명성 +' + t.fame + '</div></div>' +
        '<div class="hint-item" style="margin-top:10px"><div class="tx">' + U.esc(t.desc) + '</div></div>';
    } else {
      var hs = homeSponsor(), msg = '맡은 왕명이 없습니다. ';
      if (hs && CT.pending(hs)) msg = '<span class="good-text">' + SP().holderName(hs) + ' ' + SP().honor(hs) + '께서 부르십니다 — ' + G.CITY_DATA[hs.city].name + ' 왕궁에서 알현하십시오.</span> ';
      else if (hs) { var r = CT.realmOf(hs), n = CT.rank(r); if (n < CT.ladder(r).length) msg += '통합 명성 ' + U.num((n + 1) * B().step) + '이 되면 국왕이 부릅니다. '; }
      html += '<div class="muted">' + msg + '다른 나라의 군주를 알현해도 명예 작위가 걸린 왕명을 받을 수 있습니다.</div>';
    }
    var ph = CT.papersHtml();
    if (ph) html += '<div style="margin-top:8px"><span class="muted">특허장</span> ' + ph + '</div>';
    var zs = Object.keys(c.zoo);
    if (zs.length) html += '<div class="muted" style="margin-top:6px;font-size:15px">제독이 세운 왕립 동물원: ' + zs.map(function (k) { var r = G.COURT.realms[k]; return G.CITY_DATA[G.SPONSOR[r.sponsors[0]].city].name + ' (' + c.zoo[k] + '년)'; }).join(' · ') + '</div>';
    return html;
  };
})(window.G = window.G || {});
