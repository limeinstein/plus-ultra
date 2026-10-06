/* 바다의 이름난 선장들 (G.Captains) — 자료: js/data/seacaptains.js
   ■ 나라별 상선대·군함대의 선장·제독
     · 상선·함대가 바다에 나타나면(seafolk.js SF.decorate) 그 배의 나라(지배 국가 이름 → G.SEA_GROUPS)의 선장 명부에서 한 사람이 배를 이끈다.
       이름 없는 선장은 명부가 모두 바다에 나가 있을 때뿐이다.
     · 명부 = 그해에 활약한 실존 인물 + 고용되지 않아 제독이 된 철새·항해사 + (모자라면) 그 나라 이름으로 지은 선장.
       나라마다 자리(seats: 에스파냐·포르투갈·잉글랜드·네덜란드·이탈리아·오스만 7, 그 밖의 유럽 5, 아시아·아프리카 4)를 늘 채우고,
       상선 선장·군함 제독이 저마다 min명 아래로 내려가지 않게 한다. 해가 지나면 사람이 바뀐다(세대교체).
     · 이름난 제독의 함대는 배가 한 척 더 많고 조금 더 강하다.
   ■ 이름난 해적
     · 해적은 대부분 이름 없는 해적이지만, 그 바다·그 해에 활약한 해적(바르바로사 형제 …)이 해적단을 이끌기도 한다 (namedPirate 확률).
   ■ 철새·항해사가 제독이 된다
     · 고용할 수 있게 된 지 10년(promoteYears)이 지나도록 아무도 고용하지 않은 철새·항해사는 해마다 promoteP 확률로
       그 나라의 상선대 선장·군함대 제독이 되거나 해적단의 두목이 된다 (술집에서 사라진다).
     · 바다에서 그 사람의 기함을 나포하면 사로잡혀 다시 철새가 된다 — 가까운 항구의 술집에서 고용할 수 있다.
       실존 제독·선장을 사로잡으면 몸값(해적이면 현상금)을 받고, 그 사람은 바다를 떠난다.
   저장: s.capRoster = {y, seq, gen: {id: 지은 선장}, prom: {항해사 id: {nat, k, since, until, zone}}, out: {id: 1}, seen: {항해사 id: 처음 고용할 수 있게 된 해}}
   조정값: G.BALANCE.captains */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var CP = {};
  G.Captains = CP;
  function S() { return G.Game.state; }
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.captains = G.BALANCE.captains || {
    promoteYears: 10, promoteP: 0.35, promoteMax: 16,     // 10년 동안 고용되지 않으면 해마다 35%로 제독이 된다 (한꺼번에 16명까지)
    termMin: 12, termMax: 25,                            // 지은 선장·제독이 된 철새가 바다에 있는 해
    namedPirate: 0.35,                                   // 해적단이 이름난 해적일 확률 (그 바다에 활약하는 해적이 있을 때)
    ransom: { n: 1800, m: 1200, p: 2500 }                // 사로잡았을 때 몸값·현상금 (금화)
  };
  function B() { return G.BALANCE.captains; }
  var FEMALE = { mk_malahayati: 1, pr_omalley: 1, pr_chingshih: 1 };

  // ---------------------------------------------------------------- 나라 갈래
  var ALIAS = {};
  Object.keys(G.SEA_GROUPS || {}).forEach(function (k) { G.SEA_GROUPS[k].al.forEach(function (a) { ALIAS[a] = k; }); });
  CP.groupOf = function (nation) { return nation ? ALIAS[nation] || null : null; };

  // 후원자·항해사·탐험가와 같은 사람은 명부에서 뺀다 (항해사와 같은 사람은 mate로 잇는 것만 남긴다)
  var CAPS = [], PIRATES = [], LINKED = {};
  function clean() {
    var taken = {}, mateBy = {};
    (G.MATES || []).forEach(function (m) { if (!m.wd) mateBy[m.name] = m.id; });
    (G.EXPEDITIONS || []).forEach(function (e) { taken[e.who] = 1; });
    (G.SPONSORS || []).forEach(function (sp) { (sp.holders || []).forEach(function (h) { taken[h[2]] = 1; taken[String(h[2]).replace(/\s*\(.*\)$/, '')] = 1; }); });
    function ok(c) {
      if (!c.mate && mateBy[c.name]) c.mate = mateBy[c.name];    // 동료가 될 수 있는 항해사와 같은 사람 — 고용하지 않았을 때만 바다에 나온다
      if (c.mate) { LINKED[c.mate] = 1; return !!G.MATE[c.mate]; }
      if (taken[c.name]) return false;
      if (c.name.length >= 3) for (var t in taken) if (t.indexOf(c.name) >= 0) return false;   // 「통제사 이순신」처럼 자리 이름이 붙은 후원자
      return true;
    }
    CAPS = (G.SEA_CAPTAINS || []).filter(ok);
    PIRATES = (G.SEA_PIRATES || []).filter(ok);
  }
  CP.list = function () { if (!CAPS.length) clean(); return CAPS; };
  CP.pirates = function () { if (!CAPS.length) clean(); return PIRATES; };

  // ---------------------------------------------------------------- 상태
  function st() {
    var s = S(); if (!s) return null;
    return s.capRoster || (s.capRoster = { y: null, seq: 0, gen: {}, prom: {}, out: {}, seen: {} });
  }
  function hired(id) { var s = S(); return s.mates.some(function (m) { return m.id === id; }) || s.player.wife === id || !!(G.Wives && G.Wives.of && G.Wives.of(id)); }
  /** 항해사와 같은 사람(바르바로사 등)이 지금 바다에 나올 수 있나: 고용되지 않았고, 다른 함대를 맡지 않았고 */
  function mateFree(id) { var r = st(); return !!G.MATE[id] && !hired(id) && !(r && r.prom[id]); }
  function active(c, y) { var r = st(); return y >= c.y[0] && y <= c.y[1] && !(r && r.out[c.id]) && (!c.mate || mateFree(c.mate)); }
  function kindOK(k, want) { return want === 'n' ? (k === 'n' || k === 'b') : want === 'm' ? (k === 'm' || k === 'b') : k === want; }

  /** 이 나라 갈래의 지금 명부: [{id, name, k, src:'hist'|'prom'|'gen', desc, g, mate}] */
  CP.roster = function (key, y) {
    var s = S(), r = st(); if (!s || !key) return [];
    y = y == null ? s.date.y : y;
    var out = CP.list().filter(function (c) { return c.nat === key && active(c, y); }).map(function (c) { return { id: c.id, name: c.name, k: c.k, src: 'hist', desc: c.desc, g: FEMALE[c.id] ? 'f' : 'm', mate: c.mate }; });
    Object.keys(r.prom).forEach(function (id) {
      var p = r.prom[id], d = G.MATE[id];
      if (p.nat === key && p.k !== 'p' && d) out.push({ id: id, name: d.name, k: p.k, src: 'prom', desc: d.desc, g: d.g || 'm', mate: id });
    });
    Object.keys(r.gen).forEach(function (id) { var g = r.gen[id]; if (g.nat === key && y >= g.since && y <= g.until) out.push({ id: id, name: g.name, k: g.k, src: 'gen', desc: genDesc(g), g: 'm' }); });
    return out;
  };
  function count(list, want) { return list.filter(function (c) { return kindOK(c.k, want); }).length; }

  /** 자리를 채운다: 나라마다 seats명, 상선 선장·군함 제독은 저마다 min명 이상 */
  function fill(y) {
    var r = st(), b = B();
    Object.keys(r.gen).forEach(function (id) { if (r.gen[id].until < y) delete r.gen[id]; });
    Object.keys(G.SEA_GROUPS).forEach(function (key) {
      var G0 = G.SEA_GROUPS[key], list = CP.roster(key, y), guard = 0;
      while (guard++ < 20) {
        var nN = count(list, 'n'), nM = count(list, 'm');
        if (list.length >= G0.seats && nN >= G0.min && nM >= G0.min) break;
        var k = nN < G0.min ? 'n' : nM < G0.min ? 'm' : (nN <= nM ? 'n' : 'm');
        var g = makeGen(key, k, y);
        if (!g) break;
        r.gen[g.id] = g;
        list.push({ id: g.id, name: g.name, k: g.k, src: 'gen' });
      }
    });
    r.y = y;
  }
  var GEN_LINE = ['바다에서 잔뼈가 굵었다.', '이름을 알리려 애쓰는 중이다.', '항구마다 아는 사람이 많다.', '규율이 엄하기로 소문났다.', '셈이 빠르고 욕심이 많다.'];
  /** 지은 선장의 한 줄 (저장하지 않고 그때그때 만든다) */
  function genDesc(g) { var G0 = G.SEA_GROUPS[g.nat] || {}; return (G0.name || '') + (g.k === 'n' ? '의 군함대를 이끄는 제독. ' : '의 상선대를 이끄는 선장. ') + GEN_LINE[Math.abs(U.strHash(g.name)) % GEN_LINE.length]; }
  function makeGen(key, k, y) {
    var r = st(), G0 = G.SEA_GROUPS[key], used = {}, name = null;
    Object.keys(r.gen).forEach(function (id) { used[r.gen[id].name] = 1; });
    G.MATES.forEach(function (m) { used[m.name] = 1; });
    for (var t = 0; t < 8 && !name; t++) {
      var nm = null; try { nm = G.Wander && G.Wander.makeName ? G.Wander.makeName(G0.wd, 'm') : null; } catch (e) { nm = null; }
      if (nm && nm.name && !used[nm.name]) name = nm.name;
    }
    r.seq = (r.seq || 0) + 1;
    if (!name) name = G0.name + ' 선장 ' + r.seq;
    return { id: 'gc' + r.seq, name: name, nat: key, k: k, since: y, until: y + U.ri(B().termMin, B().termMax) };
  }
  /** 해가 바뀌었으면(또는 처음이면) 명부를 맞춘다 */
  CP.ensure = function () { var s = S(), r = st(); if (s && r && r.y !== s.date.y) fill(s.date.y); };

  // ---------------------------------------------------------------- 철새·항해사가 제독이 된다
  var WD_GROUP = { ES: 'ES', PT: 'PT', IT: 'IT', FR: 'FR', EN: 'EN', NL: 'NL', DE: 'HA', NO: 'DK', GR: 'IT', TR: 'OT', AR: 'MA', PE: 'OM', IN: 'GJ', SE: 'MK', CN: 'CN', KR: 'KR', JP: 'JP', AF: 'SH', MX: 'ES', SA: 'ES', BR: 'PT' };
  var KEYWORD = [[/포르투갈/, 'PT'], [/에스파냐|카스티야|바스크|팔로스|세비야|아라곤/, 'ES'], [/잉글랜드|영국/, 'EN'], [/네덜란드|플랑드르/, 'NL'], [/프랑스/, 'FR'],
    [/제노바|베네치아|피렌체|이탈리아|나폴리|베니스/, 'IT'], [/오스만|튀르크|해적 제독/, 'OT'], [/명나라|중국|복건/, 'CN'], [/조선/, 'KR'], [/일본|왜/, 'JP'],
    [/인도|구자라트|캘리컷/, 'GJ'], [/말레이|말라카|자바|수마트라/, 'MK'], [/이집트|아랍|맘루크/, 'MM'], [/모로코|마그레브|알제/, 'MA'], [/스와힐리|킬와|아프리카 동/, 'SH']];
  var LANG_GROUP = { 0: 'ES', 1: 'PT', 2: 'IT', 3: 'EN', 5: 'MM', 7: 'CN', 8: 'GJ', 12: 'MK', 13: 'JP', 14: 'KR' };
  CP.natOfMate = function (d) {
    if (!d) return null;
    if (d.wd) return WD_GROUP[d.nat] || null;
    var t = (d.desc || '') + ' ' + (d.story || '');
    for (var i = 0; i < KEYWORD.length; i++) if (KEYWORD[i][0].test(t)) return KEYWORD[i][1];
    for (var li in (d.lg || {})) if (d.lg[li] >= 3 && LANG_GROUP[li]) return LANG_GROUP[li];
    return null;
  };
  function kindOfMate(d, nat) {
    var sk = d.sk || {};
    if (!nat) return 'p';
    if ((sk.gun || 0) >= 2 || (sk.sword || 0) >= 3) return U.chance(0.65) ? 'n' : 'p';
    if ((sk.acct || 0) >= 2 || d.type === 'trade') return 'm';
    return U.weighted(['m', 'n', 'p'], function (k) { return k === 'm' ? 5 : k === 'n' ? 3 : 2; });
  }
  function homeZone(id) {
    var c = G.MateMove ? G.MateMove.where(id) : null;
    if (!c && G.MATE_RANGE && G.MATE_RANGE[id] && G.MATE_RANGE[id].home != null) c = G.CITY_DATA[G.MATE_RANGE[id].home];
    return c && G.Ships ? G.Ships.zone(c.lon, c.lat) : 'atl';
  }
  function available(d, y) {
    var s = S();
    if (!d || d.witch || d.id === 'rocco' || LINKED[d.id]) return false;
    if (s.flags['gone_' + d.id] || hired(d.id)) return false;
    return d.wd ? true : (G.Frontier && G.Frontier.mateReady ? G.Frontier.mateReady(d, y) : (y >= d.y[0] && y <= d.y[1]));
  }
  function promote(y) {
    var s = S(), r = st(), b = B(), out = [];
    var nProm = Object.keys(r.prom).length;
    G.MATES.forEach(function (d) {
      if (!available(d, y)) { return; }
      if (r.seen[d.id] == null) { r.seen[d.id] = y; return; }
      if (y - r.seen[d.id] < b.promoteYears || nProm >= b.promoteMax || !U.chance(b.promoteP)) return;
      var nat = CP.natOfMate(d), k = kindOfMate(d, nat);
      r.prom[d.id] = { nat: nat, k: k, since: y, until: y + U.ri(b.termMin, b.termMax), zone: homeZone(d.id) };
      s.flags['gone_' + d.id] = 1;        // 술집에서 사라진다
      nProm++;
      var gn = nat ? G.SEA_GROUPS[nat].name : '';
      out.push(d.name + (k === 'p' ? ' → ' + pirateZoneName(r.prom[d.id].zone) + ' 해적단 두목' : ' → ' + gn + (k === 'n' ? ' 군함대 제독' : ' 상선대 선장')));
      G.State.log((d.wd ? '철새 ' : '항해사 ') + d.name + U.jx(d.name, '이/가') + ' 10년 넘게 일자리를 못 찾다가 ' + (k === 'p' ? '해적이 되었다.' : gn + (k === 'n' ? ' 함대의 제독이 되었다.' : ' 상선대의 선장이 되었다.')));
    });
    return out;
  }
  function pirateZoneName(z) { return { med: '지중해', atl: '대서양', north: '북해', ind: '인도양', sea: '남양', east: '동중국해', amer: '카리브' }[z] || '바다'; }
  /** 제독 자리에서 내려와 다시 철새가 된다 (나포·임기 끝). cid: 머물 항구 */
  function release(id, cid) {
    var s = S(), r = st();
    delete r.prom[id]; delete s.flags['gone_' + id];
    r.seen[id] = s.date.y;                                   // 다시 10년을 센다
    if (G.MateMove && cid != null) {
      var range = G.MateMove.range(id), best = null, bd = 1e9, c0 = G.CITY_DATA[cid];
      range.forEach(function (x) { var c = G.CITY_DATA[x]; if (!c || !c.port || !R.cityExists(c)) return; var d = G.Geo.dist(c0.lon, c0.lat, c.lon, c.lat); if (d < bd) { bd = d; best = x; } });
      if (best != null) G.MateMove.locs()[id] = best;
    }
    var d = G.MATE[id]; if (d) d.exAdmiral = true;
    return G.MateMove ? G.MateMove.where(id) : null;
  }
  CP.release = release;

  // ---------------------------------------------------------------- 해마다
  CP.newYear = function () {
    var s = S(), r = st(), y = s.date.y, out = [];
    if (!r) return out;
    // 임기가 끝난 철새 제독은 뭍에 올라 다시 철새가 된다
    Object.keys(r.prom).forEach(function (id) {
      var p = r.prom[id];
      if (!G.MATE[id]) { delete r.prom[id]; return; }               // 세대가 바뀌어 떠난 철새
      if (p.until <= y) { var c = release(id, G.MateMove && G.MateMove.where(id) ? G.MateMove.where(id).id : s.player.home); G.State.log(G.MATE[id].name + U.jx(G.MATE[id].name, '이/가') + ' 함대를 내려놓고 다시 철새가 되었다' + (c ? ' (' + c.name + ')' : '') + '.'); }
    });
    var pr = promote(y);
    if (pr.length) out.push({ icon: 'people', text: '고용되지 못한 뱃사람들이 바다로 나갔다 — ' + pr.join(', ') + '. 그 함대를 나포하면 사로잡아 다시 고용할 수 있다.' });
    // 새로 바다에 이름을 올린 실존 인물 (큰 나라만, 소식 한 줄)
    var fresh = CP.list().filter(function (c) { return c.y[0] === y && ['ES', 'PT', 'EN', 'NL', 'IT', 'OT'].indexOf(c.nat) >= 0 && active(c, y); });
    if (fresh.length) out.push({ icon: 'ship', history: true, text: '바다의 새 얼굴: ' + fresh.slice(0, 4).map(function (c) { return c.name + '(' + G.SEA_GROUPS[c.nat].name + ' ' + (c.k === 'm' ? '선장' : '제독') + ')'; }).join(', ') + (fresh.length > 4 ? ' 외 ' + (fresh.length - 4) + '명' : '') + '.' });
    var fp = CP.pirates().filter(function (c) { return c.y[0] === y && active(c, y); });
    if (fp.length) out.push({ icon: 'skull', text: '해적 소문: ' + fp.map(function (c) { return c.name + '(' + c.zones.map(pirateZoneName).join('·') + ')'; }).join(', ') + U.jx(fp[fp.length - 1].name, '이/가') + ' 바다에 나타났다고 한다.' });
    fill(y);
    return out;
  };

  // ---------------------------------------------------------------- 바다에 나타난 배에 선장을 붙인다
  function busySet(npcs) { var b = {}; (npcs || []).forEach(function (x) { if (x.cap) b[x.cap.id] = 1; }); return b; }
  function boost(n, extra) {
    n.K = Math.min(1, (n.K || 0.3) + extra);
    if (G.Ships && n.ships && n.n < 5) { var more = G.Ships.enemyTypes(n.kind, n.zone, n.nation, 1, n.K, S().date.y); if (more[0]) { n.ships.push(more[0]); n.n = n.ships.length; } }
  }
  CP.assign = function (n, npcs) {
    var s = S(); if (!s || !n || n.exp || n.court || n.cap) return n;
    CP.ensure();
    var busy = busySet(npcs), y = s.date.y;
    if (n.kind === 'pirate') {
      var r = st(), zone = n.zone;
      var cand = CP.pirates().filter(function (c) { return !busy[c.id] && active(c, y) && c.zones.indexOf(zone) >= 0; }).map(function (c) { return { id: c.id, name: c.name, src: 'hist', desc: c.desc, g: FEMALE[c.id] ? 'f' : 'm', mate: c.mate, k: 'p' }; });
      Object.keys(r.prom).forEach(function (id) { var p = r.prom[id], d = G.MATE[id]; if (p.k === 'p' && p.zone === zone && d && !busy[id]) cand.push({ id: id, name: d.name, src: 'prom', desc: d.desc, g: d.g || 'm', mate: id, k: 'p' }); });
      if (!cand.length || !U.chance(B().namedPirate)) return n;
      n.cap = U.pick(cand); boost(n, 0.2);
      n.label = CP.label(n);
      return n;
    }
    if (n.kind !== 'merchant' && n.kind !== 'navy') return n;
    if (n.captain && n.captain.mate) return n;                     // 아직 동료가 아닌 항해사가 모는 배 (seafolk.js)
    var key = CP.groupOf(n.nation); if (!key) return n;
    var want = n.kind === 'navy' ? 'n' : 'm';
    var list = CP.roster(key, y).filter(function (c) { return kindOK(c.k, want) && !busy[c.id]; });
    if (!list.length) return n;
    n.cap = U.weighted(list, function (c) { return c.src === 'hist' ? 3 : c.src === 'prom' ? 2 : 1; });
    if (n.cap.src !== 'gen') boost(n, n.kind === 'navy' ? 0.15 : 0.05);
    n.label = CP.label(n);
    return n;
  };
  CP.title = function (n) { var c = n.cap; return n.kind === 'pirate' ? '두목' : n.kind === 'navy' || c.k === 'n' ? '제독' : '선장'; };
  CP.label = function (n) {
    var c = n.cap; if (!c) return n.label;
    if (n.kind === 'pirate') return c.name + '의 ' + (G.Ships ? G.Ships.pirateLabel(n.zone) : '해적') + '단';
    var base = (n.nation ? n.nation + ' ' : '') + (n.hunt ? (n.privateer ? '사략함대' : '군함') : n.kind === 'merchant' ? '상선대' : '함대');
    return base + ' — ' + CP.title(n) + ' ' + c.name;
  };
  /** 신호에 답하는 사람 */
  CP.speaker = function (n) {
    var c = n.cap, A = G.Art; if (!c) return null;
    if (c.mate && G.MATE[c.mate]) return { name: c.name, portrait: G.Scenes.mateSpec ? G.Scenes.mateSpec(c.mate) : null, half: G.Img.chain.mateHalf ? G.Img.chain.mateHalf(c.mate) : null, lang: 3 };
    var grp = G.SEA_GROUPS[CP.groupOf(n.nation)] || {}, style = grp.st || (n.zone === 'east' ? 'cn' : n.zone === 'med' ? 'is' : 'ib');
    var role = n.kind === 'pirate' ? 'sailor' : n.kind === 'merchant' ? 'merchant' : 'captain';
    var spec = A && A.npcSpec ? A.npcSpec('cap_' + c.id, role, style, c.g || 'm') : null;
    return { name: c.name, portrait: spec, lang: 3 };
  };
  CP.greet = function (n) {
    var c = n.cap; if (!c) return null;
    return '「' + (n.nation ? n.nation + ' ' : '') + (n.kind === 'merchant' ? '상선대의 선장' : '함대의 제독') + ' ' + c.name + '이오. 무슨 일이오?」';
  };
  CP.talk = async function (n, who) {
    var s = S(), c = n.cap; if (!c) return;
    var first = !s.flags['capMet_' + c.id];
    s.flags['capMet_' + c.id] = 1;
    var line = (first ? c.desc + '\n\n' : '');
    if (c.src === 'prom') line += U.pick(['일자리를 찾아 술집을 떠돌던 때가 엊그제 같소. 이제는 내 함대가 있지.', '그때 누가 나를 고용해 주었더라면 지금쯤 당신 배에 있었겠지.']);
    else if (n.kind === 'merchant') line += U.pick(['요즘은 바닷길이 험해 짐값이 오르고 있소.', '먼 바다의 물건일수록 값이 비싸지. 그만큼 위험하지만.', '좋은 바람이오. 서로 무사히 항구에 닿기를.']);
    else line += U.pick(['이 바다는 우리 왕실의 바다요. 해적질은 꿈도 꾸지 마시오.', '해적을 보거든 알려 주시오. 우리가 쫓겠소.', '항해가 무사하기를 비오.']);
    await UI.say(line, who);
    if (first) G.State.log('바다에서 ' + c.name + U.jx(c.name, '을/를') + ' 만났다.');
  };
  CP.encounterText = function (n, text, byMe) {
    var c = n.cap; if (!c) return null;
    if (n.kind === 'pirate') return byMe ? c.name + '의 해적단 ' + n.n + '척이 있다. 어떻게 할까요?' : '제독! ' + c.name + '의 해적단입니다! ' + n.n + '척이 다가옵니다! — ' + c.desc;
    return null;
  };

  // ---------------------------------------------------------------- 싸운 뒤: 기함을 나포하면 선장을 사로잡는다 (battle.js finish)
  CP.afterBattle = function (n, res, ships, lines) {
    var s = S(), c = n && n.cap; if (!c || res !== 'win') return;
    var flag = (ships || []).filter(function (b) { return b.side === 'en' && b.flag; })[0];
    if (!flag) return;
    var r = st();
    if (!flag.captured) { if (flag.sunk) lines.push(c.name + '의 기함이 가라앉았다 — ' + c.name + U.jx(c.name, '은/는') + ' 작은 배로 간신히 달아났다.'); return; }
    var here = nearestPort();
    if (c.src === 'prom' || (c.mate && G.MATE[c.mate])) {
      // 철새가 된다 — 가까운 항구의 술집에서 고용할 수 있다
      var id = c.mate || c.id;
      if (c.src !== 'prom') r.out[c.id] = 1;                     // 바르바로사처럼 명부에 있는 사람은 그 자리에서 내려온다
      var city = release(id, here ? here.id : s.player.home);
      lines.push('<b>' + c.name + U.jx(c.name, '을/를') + ' 사로잡았다!</b> 함대를 잃은 ' + c.name + U.jx(c.name, '은/는') + ' 철새가 되어 ' + (city ? city.name + '의 술집으로' : '뭍으로') + ' 떠났다 — 그곳에서 고용할 수 있다.');
      G.State.log(c.name + U.jx(c.name, '을/를') + ' 바다에서 사로잡았다. 철새가 되었다.');
      return;
    }
    r.out[c.id] = 1;
    if (c.src === 'gen') delete r.gen[c.id];
    var k = n.kind === 'pirate' ? 'p' : n.kind === 'merchant' ? 'm' : 'n', pay = B().ransom[k] || 1000;
    s.player.gold += pay;
    if (G.Fame && n.kind === 'pirate') G.Fame.add('so', 40);
    lines.push('<b>' + c.name + U.jx(c.name, '을/를') + ' 사로잡았다!</b> ' + (n.kind === 'pirate' ? '현상금' : '몸값') + ' 금화 ' + U.num(pay) + '닢을 받고 풀어 주었다. ' + c.name + U.jx(c.name, '은/는') + ' 다시는 바다에 나오지 않을 것이다.');
    G.State.log(c.name + U.jx(c.name, '을/를') + ' 사로잡아 ' + (n.kind === 'pirate' ? '현상금' : '몸값') + ' ' + U.num(pay) + '닢을 받았다.');
  };
  function nearestPort() {
    var s = S(), l = s.loc, best = null, bd = 1e9;
    G.CITY_DATA.forEach(function (c) { if (!c || !c.port || !R.cityExists(c)) return; var d = G.Geo.dist(l.lon, l.lat, c.lon, c.lat); if (d < bd) { bd = d; best = c; } });
    return best;
  }

  // ---------------------------------------------------------------- 수첩에 쓸 목록
  CP.summary = function () {
    CP.ensure();
    var y = S().date.y;
    return Object.keys(G.SEA_GROUPS).map(function (k) { return { key: k, name: G.SEA_GROUPS[k].name, list: CP.roster(k, y) }; });
  };

  // ---------------------------------------------------------------- 다른 코드에 잇기
  function hook() {
    var SF = G.SeaFolk; if (!SF || CP.hooked) return;
    CP.hooked = true;
    clean();
    var od = SF.decorate;
    SF.decorate = function (n, npcs) { var r = od.apply(this, arguments); try { CP.assign(n, npcs); } catch (e) { console.error(e); } return r; };
    var osp = SF.spawn;
    SF.spawn = function (npcs) { var n = osp.apply(this, arguments); try { if (n && n.hunt) CP.assign(n, npcs); } catch (e) { console.error(e); } return n; };
    var ol = SF.label; SF.label = function (n) { return n && n.cap ? CP.label(n) : ol.apply(this, arguments); };
    var oc = SF.captain; SF.captain = function (n, who) { return n && n.cap && !n.exp ? (CP.speaker(n) || who) : oc.apply(this, arguments); };
    var og = SF.greet; SF.greet = function (n) { return n && n.cap && !n.exp ? CP.greet(n) : og.apply(this, arguments); };
    var ot = SF.canTalk; SF.canTalk = function (n) { return !!(n && n.cap) || ot.apply(this, arguments); };
    var otk = SF.talk; SF.talk = function (n, who) { return n && n.cap && !n.exp ? CP.talk(n, who) : otk.apply(this, arguments); };
    // 해마다 (world.js W.newYear → G.Wander.newYear)
    if (G.Wander && G.Wander.newYear) { var onY = G.Wander.newYear; G.Wander.newYear = function () { var out = onY.apply(this, arguments) || []; try { out = out.concat(CP.newYear()); } catch (e) { console.error(e); } return out; }; }
    // 군함대에 네덜란드(1595~)·잉글랜드(인도양·남양, 1600~)도 나온다
    if (G.Ships && G.Ships.navyNation) {
      var onn = G.Ships.navyNation;
      G.Ships.navyNation = function (zone, y) {
        if (y >= 1595 && (zone === 'atl' || zone === 'north') && U.chance(0.22)) return '네덜란드';
        if (y >= 1600 && (zone === 'ind' || zone === 'sea' || zone === 'east') && U.chance(0.3)) return U.chance(0.55) ? '네덜란드' : '잉글랜드';
        return onn.apply(this, arguments);
      };
    }
  }
  CP.hook = hook;
  hook();
  if (!CP.hooked) document.addEventListener('DOMContentLoaded', hook);
})(window.G = window.G || {});
