/* Game rules & formulas: skills, fleet stats, supplies, prices. */
(function (G) {
  'use strict';
  var U = G.U;
  var R = {};
  G.R = R;

  R.S = function () { return G.Game.state; };

  // ---------------------------------------------------------------- city helpers
  R.city = function (id) { return G.CITY_DATA[id]; };
  R.cityExists = function (c, date) {
    date = date || R.S().date;
    if (c.founded && date.y < c.founded) return false;
    if (c.until && date.y >= c.until) return false;   // 사라진 마을 (호셸라가·스타다코나, 뉴암스테르담 → 뉴욕)
    if (c.id === 200 && (date.y > 1521 || (date.y === 1521 && date.m >= 8))) return false; // Tenochtitlan -> Mexico
    return true;
  };
  R.cityOwner = function (c) {
    var d = G.Dominion && G.Dominion.owner(c); if (d) return d;     // 연도별 지배 국가 (js/data/dominion.js)
    var S = R.S(); return (S && S.owners && S.owners[c.id]) || c.nation;
  };
  // 작은 항구지만 그 고장 배를 짓는 조선소가 있는 곳 (나가사키·향료 제도·잉카 해안·말라바르·요동 등)
  R.SMALL_YARDS = [191, 171, 172, 220, 221, 151, 125, 106, 166, 167, 189, 205, 229];
  R.facilities = function (c) {
    var f = { harbor: !!c.port, trade: true, tavern: true, inn: true, gate: true, church: true, market: c.size >= 2, shipyard: !!c.port && (c.size >= 2 || R.SMALL_YARDS.indexOf(c.id) >= 0), palace: false, library: false, guild: false, mansion: [] };
    if (c.flags.indexOf('P') >= 0) f.palace = true;
    if (c.flags.indexOf('L') >= 0) f.library = true;
    if (c.flags.indexOf('G') >= 0 || c.size >= 3) f.guild = true;
    G.BOOKS.forEach(function (b) { if (b.libs.indexOf(c.id) >= 0) f.library = true; });
    G.SPONSORS.forEach(function (s) { if (s.city === c.id) { if (s.bld === 'palace') f.palace = true; else f.mansion.push(s.id); } });
    if (c.id === 92) { f.market = false; }
    return f;
  };
  R.churchName = function (c) {
    if (c.places && c.places.church) return c.places.church;   // 이름 있는 곳 (경주 불국사 등)
    return c.rel === 'I' ? '모스크' : c.rel === 'H' || c.rel === 'B' || c.rel === 'J' ? '사원' : c.rel === 'K' ? '사당' : c.rel === 'N' ? '신전' : '교회';
  };
  R.libraryName = function (c) { return (c.places && c.places.library) || '도서관'; };
  /** 이름을 가진 왕궁 (한양 경복궁·창덕궁, 경주 반월성처럼 후원자 자료에 place가 있는 곳)이면 왕궁마다 따로 세운다 */
  R.namedPalaces = function (c) { return G.SPONSORS.some(function (s) { return s.city === c.id && s.bld === 'palace' && s.place; }); };
  /** 후원자가 사는 건물을 여는 인자: 저택은 후원자 id, 왕궁은 이름 있는 왕궁일 때만 id */
  R.bldArg = function (sp) { return sp.bld !== 'palace' || R.namedPalaces(G.CITY_DATA[sp.city]) ? sp.id : undefined; };
  R.palaceName = function (c, who) {
    if (who && who.place) return who.place;
    var sp = G.SPONSORS.filter(function (s) { return s.city === c.id && s.bld === 'palace'; })[0];
    if (sp && sp.type === 'gov') return '총독부';
    if (sp && sp.type === 'pope') return '교황청';
    if (sp && sp.type === 'official') return '시청';
    return '왕궁';
  };

  // ---------------------------------------------------------------- people & skills
  R.mateDef = function (id) { return G.MATE[id]; };
  /** effective skill level (0..3) combining admiral + companions in suitable roles */
  R.skill = function (id) {
    var S = R.S(); var best = S.player.sk[id] || 0;
    S.mates.forEach(function (m) {
      var d = G.MATE[m.id]; if (!d) return;
      var lv = (m.sk && m.sk[id] != null ? m.sk[id] : d.sk[id]) || 0;
      if (lv && R.mateHurt(m)) lv = Math.floor(lv / 2);      // 다친 동안은 절반
      if (!lv) return;
      var roleOK = m.role === 'first' ? G.ROLE_SKILLS.first.indexOf(id) >= 0 : m.role === 'nav' ? G.ROLE_SKILLS.nav.indexOf(id) >= 0 : m.role === 'surveyor' ? G.ROLE_SKILLS.surveyor.indexOf(id) >= 0 : m.role === 'purser' ? G.ROLE_SKILLS.purser.indexOf(id) >= 0 : false;
      if (roleOK && lv > best) best = lv;
    });
    return best;
  };
  /** 도서관: 데리고 있는 모든 부하(역할·배와 상관없이)와 제독의 능력을 합친다 — {lv, who: 가장 잘하는 사람 이름(제독이면 null)}.
      아랍어를 못하는 통역뿐이어도 아랍어를 아는 다른 부하가 있으면 함께 읽는다. 다친 동료는 학문이 절반 */
  R.langBest = function (li) {
    var S = R.S(), best = { lv: S.player.lg[li] || 0, who: null };
    S.mates.forEach(function (m) { var d = G.MATE[m.id]; if (!d) return; var lv = d.lg[li] || 0; if (lv > best.lv) best = { lv: lv, who: d.name }; });
    return best;
  };
  R.langRead = function (li) { return R.langBest(li).lv; };
  R.skillBest = function (id) {
    var S = R.S(), best = { lv: S.player.sk[id] || 0, who: null };
    S.mates.forEach(function (m) { var d = G.MATE[m.id]; if (!d) return; var lv = R.mateSkill(m, id); if (lv > best.lv) best = { lv: lv, who: d.name }; });
    return best;
  };
  R.skillRead = function (id) { return R.skillBest(id).lv; };
  /** language level (admiral, 부관, 통역) */
  R.lang = function (li) {
    var S = R.S(); var best = S.player.lg[li] || 0;
    S.mates.forEach(function (m) {
      if (m.role !== 'interp' && m.role !== 'first') return;
      var d = G.MATE[m.id]; if (!d) return; var lv = d.lg[li] || 0; if (lv > best) best = lv;
    });
    return best;
  };
  /** 의술: 배에 탄 사람이면 역할과 상관없이 가장 잘 아는 사람의 것을 쓴다 (괴혈병·열병) */
  R.medSkill = function () {
    var S = R.S(), best = R.skill('med');
    S.mates.forEach(function (m) { var lv = R.mateSkill(m, 'med'); if (lv > best) best = lv; });
    return best;
  };
  R.skillCap = function (intel) { return 2 + Math.floor(intel / 20); };
  R.langCap = function (intel) { return 2 + Math.floor(intel / 25); };
  R.stat = function (k) { return R.S().player.st[k]; };
  R.age = function () { var S = R.S(); return S.date.y - S.player.born.y - ((S.date.m < S.player.born.m || (S.date.m === S.player.born.m && S.date.d < S.player.born.d)) ? 1 : 0); };
  R.fullName = function () { return R.S().player.name; };
  R.nationName = function (n) { return n === 'PT' ? '포르투갈' : n === 'ES' ? '에스파냐' : n; };
  R.nativeLang = function (n) { return n === 'PT' ? 1 : 0; };
  R.homeCity = function () { return R.S().player.home; };
  R.isHomeNation = function (c) {
    var S = R.S(); var own = R.cityOwner(c);
    if (S.player.nation === 'PT') return own === '포르투갈';
    return own === '카스티야' || own === '아라곤' || own === '에스파냐';
  };
  /** 이베리아 두 왕실(포르투갈·에스파냐)의 땅인가 */
  R.iberOwner = function (own) { return own === '포르투갈' || own === '카스티야' || own === '아라곤' || own === '에스파냐'; };

  // ---------------------------------------------------------------- items
  R.hasItem = function (id) { return R.S().player.items.some(function (it) { return it.id === id; }); };
  /** 소지품 칸 수 */
  R.ITEM_MAX = 40;
  R.itemsFull = function (n) { return R.S().player.items.length + (n || 1) > R.ITEM_MAX; };
  /** 아직 보고·발표하지 않은 발견의 증거로 쓰이는 물건인가 (해도·지도 증거품, 발견 유물) */
  R.isProof = function (it) { return !!(it && it.disc && !it.done && (it.evidence || (G.RELIC && G.RELIC[it.id]))); };
  R.addItem = function (id, extra) {
    var S = R.S(); if (S.player.items.length >= R.ITEM_MAX) return false;
    var o = { id: id }; if (extra) for (var k in extra) o[k] = extra[k];
    var def = G.ITEM[id]; if (def && def.consumable) o.n = def.consumable;
    S.player.items.push(o); return true;
  };
  R.removeItem = function (id) { var S = R.S(); for (var i = 0; i < S.player.items.length; i++) if (S.player.items[i].id === id) { S.player.items.splice(i, 1); return true; } return false; };
  R.useCharge = function (id) {
    var S = R.S(); for (var i = 0; i < S.player.items.length; i++) { var it = S.player.items[i]; if (it.id === id) { it.n = (it.n || 1) - 1; if (it.n <= 0) S.player.items.splice(i, 1); return true; } }
    return false;
  };
  R.itemName = function (it) { if (it.name) return it.name; var d = G.ITEM[it.id]; return d ? d.name : it.id; };
  R.atk = function () { var S = R.S(); var w = S.player.equip.weapon && G.ITEM[S.player.equip.weapon]; return (w ? w.atk : 2); };
  R.def = function () { var S = R.S(); var a = S.player.equip.armor && G.ITEM[S.player.equip.armor]; return (a ? a.def : 0); };

  // ---------------------------------------------------------------- ships & fleet
  /** 새 배. wood: 목재 id (G.TIMBER) — 내구력과 속도가 목재에 따라 달라진다 */
  R.newShip = function (typeId, name, wood) {
    var t = G.SHIP[typeId], w = wood && G.TIMBER[wood];
    var hp = Math.max(1, Math.round(t.hp * (w ? w.hp : 1)));
    return {
      uid: 's' + Math.floor(U.rand() * 1e9).toString(36), type: typeId, name: name || U.pick(G.SHIP_NAMES),
      hp: hp, maxHp: hp, cap: t.cap, sails: t.sails.slice(), maxMast: t.maxMast, spdMod: w ? w.spd : 0, wood: w ? wood : null,
      crewMin: t.crew[0], crewMax: t.crew[1], ports: Math.min(t.ports, Math.max(4, Math.round(t.ports * 0.5))),
      guns: { type: 'saker', n: Math.min(4, t.ports) }, fig: null, loan: null
    };
  };
  R.shipDef = function (s) { return G.SHIP[s.type]; };
  R.gunLoad = function (s) { return s.guns.n * (G.CANNON[s.guns.type] ? G.CANNON[s.guns.type].load : 1); };
  R.shipCargoCap = function (s) { return Math.max(0, Math.floor(s.cap - R.gunLoad(s))); };
  R.fleetCap = function () { return U.sum(R.S().fleet.ships, R.shipCargoCap); };
  R.cargoQty = function () { var c = R.S().fleet.cargo, n = 0; for (var k in c) n += c[k].q; return n; };
  R.used = function () { var f = R.S().fleet; return R.cargoQty() + Math.ceil(f.food) + Math.ceil(f.water) + Math.ceil(f.mat || 0) + (G.Quest ? G.Quest.load() : 0); };
  R.free = function () { return R.fleetCap() - R.used(); };
  R.crewMin = function () { return U.sum(R.S().fleet.ships, function (s) { return s.crewMin; }); };
  R.crewMax = function () { return U.sum(R.S().fleet.ships, function (s) { return s.crewMax; }); };
  R.maxKinds = function () { return 3 + R.S().fleet.ships.length * 2; };
  R.dailyUse = function (crew) { var k = (G.BALANCE && G.BALANCE.ration) || 0.025; return Math.max(0.4, (crew == null ? R.S().fleet.crew : crew) * k); };
  /** 교역품 가운데 먹고 마실 수 있는 것: 식량이 떨어지면 곡식·어육·고기·유제품을, 물이 떨어지면 맥주·포도주를 먹고 마신다
      (상하기 쉬운 것부터). 1통 = 식량·물 1통 */
  R.PROVISION = { food: ['fish', 'beef', 'dairy', 'potato', 'maize', 'wheat', 'rice', 'beans'], water: ['beer', 'wine'] };
  R.provisionCargo = function (kind) { var c = R.S().fleet.cargo; return U.sum(R.PROVISION[kind], function (id) { return c[id] ? c[id].q : 0; }); };
  /** 교역품에서 need통까지 덜어 먹는다 — 덜어 낸 양을 돌려준다 */
  R.eatCargo = function (kind, need) {
    var c = R.S().fleet.cargo, got = 0;
    R.PROVISION[kind].forEach(function (id) {
      if (got >= need || !c[id]) return;
      var take = Math.min(c[id].q, Math.ceil(need - got));
      c[id].q -= take; got += take; if (c[id].q <= 0) delete c[id];
    });
    return got;
  };
  R.daysOfFood = function () { var f = R.S().fleet; return f.crew > 0 ? Math.floor((f.food + R.provisionCargo('food')) / R.dailyUse() + 1e-6) : 999; };
  R.daysOfWater = function () { var f = R.S().fleet; return f.crew > 0 ? Math.floor((f.water + R.provisionCargo('water')) / R.dailyUse() + 1e-6) : 999; };
  R.shipPrice = function (typeId) { return G.SHIP[typeId].price; };
  R.shipValue = function (s) {
    var t = G.SHIP[s.type]; var v = t.price * 0.55 * (0.4 + 0.6 * s.hp / s.maxHp) * (0.7 + 0.3 * s.maxHp / t.hp);
    v += s.guns.n * (G.CANNON[s.guns.type] ? G.CANNON[s.guns.type].price : 0) * 0.3;
    return Math.floor(v);
  };
  R.figure = function (s) { return s.fig ? G.FIGUREHEAD[s.fig] : null; };
  /** 선수상의 덕: 함대에서 가장 센 것 하나는 그대로, 나머지 배의 것은 G.BALANCE.figRest만큼만 더한다 (여러 척에 같은 상을 달아도 한없이 쌓이지 않게) */
  R.fleetBonus = function (key) {
    var vs = [], k = (G.BALANCE && G.BALANCE.figRest != null) ? G.BALANCE.figRest : 1;
    R.S().fleet.ships.forEach(function (s) { var f = R.figure(s); if (f && f[key]) vs.push(f[key]); });
    vs.sort(function (a, b) { return b - a; });
    return vs.reduce(function (sum, x, i) { return sum + (i ? x * k : x); }, 0);
  };

  /** sail efficiency for relative wind angle a (0 = wind from astern, PI = head wind) */
  function sailEff(kind, a) {
    var d = a * 180 / Math.PI;
    if (kind === 'sq') {
      if (d < 60) return 1.0 - d / 600;
      if (d < 100) return 0.9 - (d - 60) * 0.0125;
      if (d < 135) return 0.4 - (d - 100) * 0.0094;
      return 0.07;
    }
    if (kind === 'bat') {                       // 대나무 살 돛: 순풍에도 무난하고 맞바람에도 버틴다
      if (d < 45) return 0.84 + d * 0.0015;
      if (d < 110) return 0.9 + Math.sin((d - 45) / 65 * Math.PI) * 0.06;
      if (d < 145) return 0.9 - (d - 110) * 0.0145;
      if (d < 165) return 0.39 - (d - 145) * 0.0135;
      return 0.1;
    }
    if (d < 45) return 0.72 + d * 0.004;
    if (d < 110) return 0.9 + Math.sin((d - 45) / 65 * Math.PI) * 0.1;
    if (d < 140) return 0.9 - (d - 110) * 0.017;
    if (d < 160) return 0.39 - (d - 140) * 0.014;
    return 0.1;
  }
  R.sailEff = sailEff;
  /** ship speed in degrees/day for heading ang (radians, 0=east ccw) and wind {dir (toward, radians), spd 0..1, calm}
      env: {off: 해안에서 떨어진 거리(°), mon: 계절풍 바다} — 없으면 지금 함대가 있는 바다 */
  R.shipSpeed = function (s, ang, wind, env) {
    var t = G.SHIP[s.type];
    var rel = Math.abs(U.angDiff(ang, wind.dir)); // 0 when sailing downwind
    var thrust = 0;
    s.sails.forEach(function (k) { thrust += sailEff(k, rel); });
    thrust /= Math.max(1, t.sails.length);
    var base = t.spd * (1 + s.spdMod) * (1 + (R.figure(s) && R.figure(s).spd || 0));
    var w = 0.35 + 0.8 * wind.spd;
    var hpF = 0.6 + 0.4 * s.hp / s.maxHp;
    var v = base * thrust * w * hpF * (wind.calm ? 0.25 : 1);
    s._row = false;
    if (t.oar) { var ov = t.oar * (1 + s.spdMod) * hpF; if (ov > v) { v = ov; s._row = true; } }   // 노: 바람과 상관없이
    env = env === undefined ? (G.Ships && G.Ships.env()) : env;
    if (env) {
      var tr = t.traits;
      if (env.off > G.Ships.OPEN && tr.indexOf('coast') >= 0) v *= 0.8;       // 연안선은 먼 바다에서 느리다
      if (env.off < G.Ships.NEAR && tr.indexOf('shallow') >= 0) v *= 1.08;    // 얕은 배는 뭍 가까이에서 빠르다
      if (env.mon && tr.indexOf('monsoon') >= 0) v *= 1.12;                   // 계절풍 항해
    }
    return Math.max(0.12, v);
  };
  // ---------------------------------------------------------------- 선장: 배마다 지휘하는 사람
  /** 이 배의 선장: 기함은 제독('admiral'), 다른 배는 선장으로 임명한 동료(상태 객체), 없으면 null(갑판장이 몬다) */
  R.captain = function (sh) {
    var S = R.S(); if (!sh) return null;
    if (S.fleet.ships[0] === sh) return 'admiral';
    for (var i = 0; i < S.mates.length; i++) { var m = S.mates[i]; if (m.role === 'captain' && m.ship === sh.uid) return m; }
    return null;
  };
  R.mateSkill = function (m, id) { var d = G.MATE[m.id]; var lv = d ? ((m.sk && m.sk[id] != null ? m.sk[id] : d.sk[id]) || 0) : 0; return R.mateHurt(m) ? Math.floor(lv / 2) : lv; };
  /** 대리 결투에서 진 동료는 한동안 다쳐 있다 (남은 날, 0이면 멀쩡) */
  R.mateHurt = function (m) { var S = R.S(); return m && m.hurt && S && S.day < m.hurt ? m.hurt - S.day : 0; };
  /** 배 한 척을 맡은 사람의 특기: 기함은 제독과 기함 참모(부관·항해사·측량사), 다른 배는 그 배 선장 한 사람 */
  R.shipSkill = function (sh, id) {
    var c = R.captain(sh);
    if (c === 'admiral') return R.skill(id);
    return c ? R.mateSkill(c, id) : 0;
  };
  /** 경리: 경리 자리의 동료 {m, name, acct} — 없으면 null. 다친 동안은 회계가 절반(R.mateSkill) */
  R.purser = function () {
    var S = R.S(), m = S && S.mates.filter(function (x) { return x.role === 'purser'; })[0];
    if (!m || !G.MATE[m.id]) return null;
    return { m: m, id: m.id, name: G.MATE[m.id].name, acct: R.mateSkill(m, 'acct') };
  };
  /** 역할 이름: 부관·항해사·측량사·통역·경리·선장(○○호)·대기 */
  R.roleName = function (m) {
    var role = typeof m === 'string' ? m : m && m.role;
    if (role === 'captain') { var sh = m && R.S().fleet.ships.filter(function (x) { return x.uid === m.ship; })[0]; return sh ? '선장 · ' + sh.name + '호' : '선장'; }
    var r = G.ROLES.filter(function (x) { return x.id === role; })[0];
    return r ? r.name : '대기';
  };
  /** 함대를 떠난 배나 기함이 된 배의 선장은 대기로 돌린다 */
  R.tidyCaptains = function () {
    var S = R.S(), f = S.fleet;
    S.mates.forEach(function (m) {
      if (m.role !== 'captain') return;
      var i = -1; f.ships.forEach(function (x, k) { if (x.uid === m.ship) i = k; });
      if (i <= 0) { m.role = 'none'; delete m.ship; }
    });
  };
  R.captainName = function (sh) { var c = R.captain(sh); return c === 'admiral' ? '제독' : c ? G.MATE[c.id].name : '갑판장'; };
  /** 백병전 공격력: 제독은 차고 있는 무기, 동료 선장은 무력, 갑판장은 맨손 */
  R.shipAtk = function (sh) { var c = R.captain(sh); if (c === 'admiral') return R.atk(); if (!c) return 2; var d = G.MATE[c.id]; return 3 + Math.round(((d && d.st && d.st[2]) || 50) / 10); };

  // ---------------------------------------------------------------- 함대 속력 (편대 규칙)
  /* 1) 배마다 선속을 따로 구한다 = 돛·노 성능 × 바람 × 선체 손상 × 목재 × 조함(그 배 선장의 항해술) × 그 배의 짐
     2) 함대는 편대를 지키므로 가장 느린 배에 맞춘다
     3) 보정 — 예인 보조: 두 번째로 느린 배와의 차이 가운데 τ만큼 끌어올린다 (τ = 0.15 + 0.08 × 운용술, 최대 0.4)
               편대 유지: 배 한 척이 늘 때마다 1.2%씩 늦어진다 (운용술 1마다 그 부담 20% 감소)
               짐 배분: 함대의 짐은 빠른 배부터 싣는다 — 느린 배일수록 가벼워진다
     4) 맞바람이면 지그재그(태킹)로 가장 잘 나아가는 방향을 고르고, 선원 수·피로를 곱한다 */
  R.FORM = { assist: 0.15, assistOps: 0.08, assistMax: 0.4, drag: 0.012, dragOps: 0.2, noCaptain: 0.96, handle: 0.035, load: 0.18 };
  function baseSpd(s) { var t = G.SHIP[s.type]; return Math.max(t.spd, t.oar || 0) * (1 + (s.spdMod || 0)); }
  /** 짐 배분: 빠른 배부터 채운다. 배마다 짐 비율(0~1) */
  R.loadShares = function () {
    var f = R.S().fleet, left = R.used(), out = {};
    f.ships.slice().sort(function (a, b) { return baseSpd(b) - baseSpd(a); }).forEach(function (s) {
      var cap = Math.max(1, R.shipCargoCap(s)), q = U.clamp(left, 0, cap); out[s.uid] = q / cap; left -= q;
    });
    return out;
  };
  /** 조함 보정: 선장의 항해술 1마다 +3.5%, 선장이 없으면(갑판장) −4% */
  R.handleK = function (sh) { var c = R.captain(sh); return c ? 1 + (c === 'admiral' ? R.skill('nav') : R.mateSkill(c, 'nav')) * R.FORM.handle : R.FORM.noCaptain; };
  function formation(vs, ops) {
    var n = vs.length, idx = vs.map(function (v, i) { return i; }).sort(function (a, b) { return vs[a] - vs[b]; });
    if (n === 1) return { v: vs[0], slow: 0, assist: 0, drag: 0 };
    var vmin = vs[idx[0]], tau = Math.min(R.FORM.assistMax, R.FORM.assist + R.FORM.assistOps * ops);
    var assist = (vs[idx[1]] - vmin) * tau, drag = R.FORM.drag * (n - 1) * Math.max(0, 1 - R.FORM.dragOps * ops);
    return { v: (vmin + assist) * (1 - drag), slow: idx[0], assist: assist, drag: drag, vmin: vmin };
  }
  R.formation = formation;
  /** 배마다의 선속 (조함·짐 포함) */
  R.shipLegSpeeds = function (ang, wind, env, pre) {
    var f = R.S().fleet;
    pre = pre || R.fleetPre();
    return f.ships.map(function (s, i) { return R.shipSpeed(s, ang, wind, env) * pre.hand[i] * pre.load[i]; });
  };
  R.fleetPre = function () {
    var f = R.S().fleet, shares = R.loadShares();
    return {
      hand: f.ships.map(R.handleK),
      load: f.ships.map(function (s) { return 1 - R.FORM.load * (shares[s.uid] || 0) * (G.SHIP[s.type].traits.indexOf('thrift') >= 0 ? 0.5 : 1); }),
      shares: shares, ops: R.skill('ops')
    };
  };
  R.rawFleetSpeed = function (ang, wind, env, pre) {
    pre = pre || R.fleetPre();
    return formation(R.shipLegSpeeds(ang, wind, env, pre), pre.ops).v;
  };
  R.rowing = false;     // 가장 느린 배가 노를 젓고 있는가 (선원이 지친다)
  R.fleetInfo = null;   // 마지막 계산: {slow, assist, drag, vs, tack}
  /** 함대의 움직임: 이 방향(ang)으로 곧장 가는 속력과, 맞바람이면 지그재그(태킹)로 거슬러 오르는 풀이
      {vmg: 목적 방향으로 실제로 다가가는 속력, straight: 뱃머리를 ang에 둘 때의 속력, theta: 태킹 각(0이면 곧장), legP/legM: ang±theta로 달릴 때의 속력} */
  R.fleetMotion = function (ang, wind, env) {
    var S = R.S(), f = S.fleet;
    if (!f.ships.length) return { vmg: 0, straight: 0, theta: 0, legP: 0, legM: 0 };
    if (env === undefined) env = G.Ships ? G.Ships.env() : null;
    var pre = R.fleetPre();
    var vs0 = R.shipLegSpeeds(ang, wind, env, pre), r0 = formation(vs0, pre.ops), row0 = !!f.ships[r0.slow]._row, v = r0.v, th0 = 0, lp = 0, lm = 0;
    for (var th = 25; th <= 75; th += 10) {
      var rad = th * Math.PI / 180, c = Math.cos(rad) * 0.92;
      var a = R.rawFleetSpeed(ang + rad, wind, env, pre), b = R.rawFleetSpeed(ang - rad, wind, env, pre);
      if (Math.max(a, b) * c > v) { v = Math.max(a, b) * c; th0 = rad; lp = a * 0.92; lm = b * 0.92; }
    }
    R.rowing = row0 && th0 === 0;
    var cm = R.crewMin();
    var crewF = f.crew >= cm ? 1 : Math.max(0.25, f.crew / cm);
    var fat = f.fatigue > 60 ? 1 - (f.fatigue - 60) / ((G.BALANCE && G.BALANCE.fatigueDiv) || 100) : 1, k = crewF * fat;
    R.fleetInfo = { slow: f.ships[r0.slow], assist: r0.assist, drag: r0.drag, vmin: r0.vmin, vs: vs0, tack: th0 > 0, row: row0, crewF: crewF, fat: fat };
    return { vmg: v * k, straight: r0.v * k, theta: th0, legP: lp * k, legM: lm * k };
  };
  R.fleetSpeed = function (ang, wind, env) { return R.fleetMotion(ang, wind, env).vmg; };
  /** 바람을 고르게 받을 때(8방향 평균)의 함대 속력 풀이 — 수첩·조선소에서 보여 준다 */
  R.fleetReport = function () {
    var f = R.S().fleet; if (!f.ships.length) return null;
    var pre = R.fleetPre(), n = 8, sum = f.ships.map(function () { return 0; });
    for (var i = 0; i < n; i++) {
      var w = { dir: i / n * Math.PI * 2, spd: 0.55 }, best = R.shipLegSpeeds(0, w, null, pre);
      for (var th = 25; th <= 75; th += 10) {        // 맞바람이면 배마다 지그재그로 가장 잘 나아가는 값
        var rad = th * Math.PI / 180, c = Math.cos(rad) * 0.92, a1 = R.shipLegSpeeds(rad, w, null, pre), a2 = R.shipLegSpeeds(-rad, w, null, pre);
        best = best.map(function (v, k) { return Math.max(v, a1[k] * c, a2[k] * c); });
      }
      best.forEach(function (v, k) { sum[k] += v / n; });
    }
    var fm = formation(sum, pre.ops);
    return { each: f.ships.map(function (s, k) { return { sh: s, v: sum[k], hand: pre.hand[k], share: pre.shares[s.uid] || 0, cap: R.captainName(s) }; }), slow: f.ships[fm.slow], vmin: fm.vmin != null ? fm.vmin : sum[0], assist: fm.assist, drag: fm.drag, v: fm.v, ops: pre.ops };
  };

  // ---------------------------------------------------------------- wind model
  /** returns {dir: radians wind blows TOWARD (0 east), spd 0..1} */
  R.wind = function (lon, lat, date, t) {
    var doy = U.dayOfYear(date);
    var alat = Math.abs(lat), sgn = lat >= 0 ? 1 : -1;
    var from; // direction wind comes FROM in degrees (0 = east, 90 = north)
    var spd;
    if (alat < 5) { from = 90 + sgn * 0; spd = 0.25; from = 45 + 90 * Math.sin(doy / 30); }
    else if (alat < 30) { from = lat > 0 ? 45 : -45; spd = 0.62; } // trades: from NE / SE
    else if (alat < 60) { from = lat > 0 ? 200 : 160; spd = 0.7; } // westerlies from W-SW / W-NW
    else { from = lat > 0 ? 20 : -20; spd = 0.55; }
    // blend near boundaries
    // 계절풍 (인도양·남중국해 — G.MONSOON): 여름은 남서풍, 겨울은 북동풍
    (G.MONSOON || []).forEach(function (z) {
      var b = z.box;
      if (lon > b[0] && lon < b[1] && lat > b[2] && lat < b[3]) { var sw = doy > z.sw[0] && doy < z.sw[1]; from = sw ? 225 : 45; spd = sw ? z.spdSW : z.spdNE; }
    });
    // Mediterranean: variable NW
    if (lon > -6 && lon < 36 && lat > 30 && lat < 46) { from = 150 + 40 * Math.sin(doy / 17); spd = 0.45; }
    // local noise
    var n1 = G.Geo.vnoise((lon + 180) * 0.12 + doy * 0.21, (lat + 90) * 0.12 + (t || 0) * 0.001);
    var n2 = G.Geo.vnoise((lon + 180) * 0.3 + 7.1, (lat + 90) * 0.3 + doy * 0.35);
    from += (n1 - 0.5) * 70;
    spd = U.clamp(spd * (0.6 + n2 * 0.8), 0.05, 1);
    var toward = (from + 180) * Math.PI / 180;
    return { dir: toward, spd: spd, from: from };
  };

  // ---------------------------------------------------------------- economy
  var DIST_MULT = [0.58, 1.0, 1.35, 1.72, 2.1, 2.45];
  var ORIGINS = null;
  R.origins = function () {
    if (ORIGINS) return ORIGINS;
    ORIGINS = {};
    G.CITY_DATA.forEach(function (c) { c.goods.forEach(function (g) { (ORIGINS[g] = ORIGINS[g] || {})[c.region] = true; }); });
    return ORIGINS;
  };
  R.regionalMult = function (goodId, region) {
    var o = R.origins()[goodId] || {}, d = 5;
    for (var r in o) d = Math.min(d, G.REGION_DIST[region][+r]);
    var g = G.GOOD[goodId];
    var m = 1 + (DIST_MULT[d] - 1) * g.el;
    var dm = G.GOOD_DEMAND[goodId]; if (dm && dm[region]) m *= dm[region];
    if (g.nw && region !== 10) m *= 1.15;
    return m;
  };
  R.market = function (cityId) {
    var S = R.S();
    var m = S.market[cityId];
    if (!m) { m = S.market[cityId] = { g: {}, ev: null, evEnd: 0, t: S.day }; }
    // decay saturation since last access
    var dt = S.day - (m.t || S.day);
    if (dt > 0) {
      var k = Math.pow(0.5, dt / 25);
      for (var id in m.g) { m.g[id].sat *= k; m.g[id].dep *= k; if (m.g[id].sat < 0.01 && m.g[id].dep < 0.01) delete m.g[id]; }
      m.t = S.day;
    }
    if (m.ev && S.day > m.evEnd) m.ev = null;
    return m;
  };
  function mg(m, id) { return m.g[id] || (m.g[id] = { sat: 0, dep: 0 }); }
  var EVENTS = {
    '풍작': { cats: { food: 0.72 } }, '대풍작': { cats: { food: 0.55 } }, '기근': { cats: { food: 1.45 } }, '대기근': { cats: { food: 1.9 } },
    '전쟁': { cats: { arms: 1.6, food: 1.15, misc: 1.1 } }, '축제': { cats: { drink: 1.4, lux: 1.3, gem: 1.2, craft: 1.15 } },
    '호경기': { all: 1.15 }, '불경기': { all: 0.85 }, '대조선': { goods: { timber: 1.8, iron: 1.4, hemp: 1.5, linen: 1.3 } },
    '역병': { goods: { herbs: 1.9 }, all: 0.95 }, '혹서': { goods: { wine: 1.3, beer: 1.4, fur: 0.7 } }, '대한파': { goods: { fur: 1.6, wool: 1.3, woolcloth: 1.3 } },
    '노동력부족': { cats: { craft: 1.3, cloth: 1.25 } }
  };
  R.MARKET_EVENTS = EVENTS;
  /** 시세의 출렁임 (대항해시대 2·3처럼 도시마다 품목 갈래의 값이 천천히 오르내린다): 도시·갈래마다 정해진 주기와 폭의 물결 두 개 */
  R.drift = function (cityId, cat, day) {
    var S = R.S(), B = G.BALANCE || {}, A = B.driftAmp || [0.08, 0.15], P = B.driftPeriod || [70, 200];
    var h = U.strHash('drift:' + cityId + ':' + cat) >>> 0, d = day == null ? S.day : day;
    var per = P[0] + (h % 1000) / 1000 * (P[1] - P[0]), ph = ((h >>> 10) % 628) / 100, amp = A[0] + ((h >>> 20) % 100) / 100 * (A[1] - A[0]);
    return 1 + amp * 0.8 * Math.sin(6.2832 * d / per + ph) + amp * 0.2 * Math.sin(6.2832 * d / (per * 0.37) + ph * 1.7);
  };
  function eventCat(m, cat) { if (!m.ev) return 1; var e = EVENTS[m.ev]; if (!e) return 1; return (e.all || 1) * (e.cats && e.cats[cat] || 1); }
  /** 이 도시의 품목 갈래 시세 (1 = 보통): 출렁임 × 시장 사건 */
  R.catIndex = function (c, cat, day) { return R.drift(c.id, cat, day) * (day == null ? eventCat(R.market(c.id), cat) : 1); };
  /** 시장 물건(무기·방어구·도구·선물)이 따르는 교역품 갈래 */
  R.ITEM_CATS = { weapon: ['arms'], armor: ['arms', 'metal'], tool: ['misc', 'craft'], gift: ['gem', 'lux', 'craft'] };
  R.itemMult = function (c, item) {
    var d = G.ITEM[item.id] || item, cats = R.ITEM_CATS[d.kind];
    if (!c || !cats || d.rare || (G.RELIC && G.RELIC[item.id])) return 1;
    return U.sum(cats, function (k) { return R.catIndex(c, k); }) / cats.length;
  };
  function eventMult(m, g) {
    if (!m.ev) return 1; var e = EVENTS[m.ev]; if (!e) return 1;
    var v = e.all || 1;
    if (e.cats && e.cats[g.cat]) v *= e.cats[g.cat];
    if (e.goods && e.goods[g.id]) v *= e.goods[g.id];
    return v;
  }
  R.sells = function (c, goodId) { return R.cityGoods(c).indexOf(goodId) >= 0; };
  /** price the city asks when you buy */
  R.buyPrice = function (c, goodId) {
    var g = G.GOOD[goodId], m = R.market(c.id), st = mg(m, goodId);
    var p = g.p * 0.62 * (1 + st.dep * 0.9) * eventMult(m, g) * R.drift(c.id, g.cat) * R.investBuyMult(c.id);
    if (c.region !== 0 && c.region !== 1 && c.region !== 2 && (goodId === 'guns' || goodId === 'cannon')) p *= 1.2;
    return Math.max(1, Math.round(p));
  };
  /** price the city pays when you sell */
  R.sellPrice = function (c, goodId) {
    var g = G.GOOD[goodId], m = R.market(c.id), st = mg(m, goodId);
    var base = R.sells(c, goodId) ? g.p * 0.55 : g.p * R.regionalMult(goodId, c.region);
    var p = base * Math.exp(-st.sat * 0.55) * eventMult(m, g) * R.drift(c.id, g.cat) * R.investSellMult(c.id);
    return Math.max(1, Math.round(p));
  };
  // ---------------------------------------------------------------- 투자
  R.INVEST_LV = [0, 4000, 12000, 30000, 70000, 150000];   // 등급 1~5 문턱
  R.invest = function (cityId) {
    var S = R.S();
    if (!S.invest) S.invest = {};
    return S.invest[cityId] || (S.invest[cityId] = { amt: 0, div: 0, t: S.day });
  };
  /** 투자 등급 0~5 */
  R.investLv = function (cityId) {
    var a = R.invest(cityId).amt, lv = 0;
    for (var i = 1; i < R.INVEST_LV.length; i++) if (a >= R.INVEST_LV[i]) lv = i;
    return lv;
  };
  R.investNext = function (cityId) {
    var lv = R.investLv(cityId);
    return lv >= 5 ? null : R.INVEST_LV[lv + 1] - R.invest(cityId).amt;
  };
  /** 쌓인 배당을 지금 날짜까지 계산해 둔다 */
  R.investTick = function (c) {
    var S = R.S(), iv = R.invest(c.id);
    var dt = S.day - (iv.t == null ? S.day : iv.t);     // 0일째도 있으므로 == null 로 살핀다
    if (dt > 0 && iv.amt > 0) {
      var rate = (0.0075 + 0.0022 * c.size) / 90;      // 90일에 0.75~1.6%
      iv.div += iv.amt * rate * dt;
    }
    iv.t = S.day;
    return iv;
  };
  /** 이 도시에 투자해 두면 사고파는 값이 조금 유리해진다 */
  R.investBuyMult = function (cityId) { return 1 - 0.03 * R.investLv(cityId); };
  R.investSellMult = function (cityId) { return 1 + 0.03 * R.investLv(cityId); };
  /** 투자한 도시는 다루는 교역품이 늘어난다 */
  R.cityGoods = function (c) {
    var lv = R.investLv(c.id);
    var extra = lv >= 4 ? 2 : lv >= 2 ? 1 : 0;
    if (!extra) return c.goods;
    var rng = U.makeRng(U.strHash('inv' + c.id));
    var pool = G.GOODS.filter(function (g) {
      return c.goods.indexOf(g.id) < 0 && !g.nw && R.regionalMult(g.id, c.region) < 1.25;
    });
    var out = c.goods.slice();
    for (var i = 0; i < extra && pool.length; i++) {
      var k = Math.floor(rng() * pool.length);
      out.push(pool[k].id); pool.splice(k, 1);
    }
    return out;
  };
  R.onBuy = function (c, goodId, q) { var m = R.market(c.id), st = mg(m, goodId); st.dep += q / (40 + c.size * 40); };
  R.onSell = function (c, goodId, q) { var m = R.market(c.id), st = mg(m, goodId); st.sat += q / (60 + c.size * 50); };
  R.supply = function (c, goodId) { var m = R.market(c.id), st = mg(m, goodId); return Math.max(0, Math.round((30 + c.size * 45) * (1 - Math.min(0.95, st.dep * 0.9)))); };
  R.maybeMarketEvent = function (c) {
    var m = R.market(c.id), S = R.S();
    if (m.ev) return;
    var r = U.makeRng((c.id * 131 + Math.floor(S.day / 90) * 17) >>> 0);
    if (r() < 0.22) { var keys = Object.keys(EVENTS); m.ev = keys[Math.floor(r() * keys.length)]; m.evEnd = S.day + 40 + Math.floor(r() * 80); }
  };

  // ---------------------------------------------------------------- misc formulas
  R.hireCost = function (c) { return Math.round((c.region <= 2 ? 12 : 18) * (1 + c.size * 0.1)); };
  /** 물·자재 한 통 값 */
  R.waterCost = function (c) { return Math.max(1, Math.round(R.supplyCost(c) * ((G.BALANCE && G.BALANCE.waterPrice) || 0.5))); };
  R.matCost = function (c) { return Math.max(2, Math.round(R.supplyCost(c) * ((G.BALANCE && G.BALANCE.matPrice) || 3) * (R.facilities(c).shipyard ? 0.85 : 1) * R.catIndex(c, 'misc'))); };
  R.supplyCost = function (c) { return Math.max(1, Math.round((c.region <= 2 ? 2 : 3) * (1 - 0.06 * R.investLv(c.id)))); }; // per 통
  R.innCost = function (c) { return 8 + c.size * 6; };
  R.surveyRange = function () { return [0.9, 1.4, 1.9, 2.6][R.skill('survey')] + (G.Ships && G.Ships.fleetHas('scout') ? 0.4 : 0); };
  R.fameTitle = function (f) {
    if (f < 400) return '무명의 항해자'; if (f < 1600) return '신참 모험가'; if (f < 4000) return '이름난 모험가';
    if (f < 8000) return '저명한 항해가'; if (f < 15000) return '위대한 탐험가'; return '대항해자';
  };
})(window.G = window.G || {});
