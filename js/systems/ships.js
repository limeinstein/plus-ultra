/* 배의 특성·바다의 구역·목재 (G.Ships).
   배와 목재의 데이터는 js/data/ships.js. 여기서는 그 데이터를 게임 규칙에 잇는다. */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var SH = {};
  G.Ships = SH;
  function S() { return G.Game.state; }

  SH.OPEN = 2.5;       // 해안에서 이만큼(°) 넘게 떨어지면 먼 바다
  SH.NEAR = 1.0;       // 해안에서 이만큼 안이면 뭍 가까이

  SH.def = function (x) { return typeof x === 'string' ? G.SHIP[x] : !x ? null : x.type ? G.SHIP[x.type] : G.SHIP[x.id] === x ? x : null; };
  SH.has = function (x, tr) { var t = SH.def(x); return !!t && t.traits.indexOf(tr) >= 0; };
  SH.fleetHas = function (tr) { return S().fleet.ships.some(function (s) { return SH.has(s, tr); }); };
  SH.wood = function (sh) { return sh && sh.wood ? G.TIMBER[sh.wood] : null; };

  // ---------------------------------------------------------------- 바다의 구역
  /** 해적·함대의 배 모양과 나라를 고르는 넓은 구역 */
  SH.zone = function (lon, lat) {
    if (lon > -6 && lon < 42 && lat > 30 && lat < 47.5) return 'med';
    if (lat > 47 && lon > -15 && lon < 35) return 'north';
    if (lon >= 104 && lon < 150 && lat >= 18 && lat < 46) return 'east';
    if (lon >= 94 && lon < 150 && lat > -15 && lat < 18) return 'sea';
    if (lon >= 32 && lon < 100 && lat > -40 && lat < 31) return 'ind';
    if (lon < -30 && lon > -130) return 'amer';
    return 'atl';
  };
  SH.ZONE_NAME = { med: '지중해', north: '북해·발트해', east: '동아시아', sea: '동남아시아', ind: '인도양', amer: '아메리카', atl: '대서양' };
  /** 해안에서 떨어진 거리 (°) */
  SH.offshore = function (lon, lat) {
    if (!G.Geo.sdfRaw || !G.Geo.TEX_PER_DEG) return 0;
    return Math.max(0, -G.Geo.sdfRaw(lon, lat) / G.Geo.TEX_PER_DEG);
  };
  SH.monsoonSea = function (lon, lat) { return lon > 40 && lon < 125 && lat > -12 && lat < 26; };
  /** 지금 함대가 있는 바다의 사정 (바다에 있을 때만) */
  var envKey = '', envVal = null;
  SH.env = function () {
    var s = S(); if (!s || !s.loc || s.loc.mode !== 'sea') return null;
    var k = Math.round(s.loc.lon * 20) + ':' + Math.round(s.loc.lat * 20);
    if (k !== envKey) { envKey = k; envVal = { off: SH.offshore(s.loc.lon, s.loc.lat), mon: SH.monsoonSea(s.loc.lon, s.loc.lat) }; }
    return envVal;
  };
  SH.pirateLabel = function (zone) { return zone === 'east' ? '왜구' : zone === 'med' ? '바르바리 해적' : '해적'; };

  // ---------------------------------------------------------------- 적 함대의 배
  function avail(id, y) { var t = G.SHIP[id]; return t && (!t.from || y >= t.from); }
  // 약한 배부터 강한 배 순서 — 명성이 높을수록 뒤쪽 배가 나온다
  var POOLS = {
    atl:   { pirate: ['caravel', 'caravel', 'lcaravel', 'carrack', 'lcarrack'], navy: ['carrack', 'lcarrack', 'hcarrack', 'galleon'], merchant: ['cog', 'carrack', 'lcarrack', 'caravel'] },
    north: { pirate: ['cog', 'caravel', 'pinnace', 'hulk', 'carrack'], navy: ['carrack', 'lcarrack', 'hcarrack', 'galleon'], merchant: ['cog', 'hulk', 'carrack', 'fluyt'] },
    med:   { pirate: ['fusta', 'fusta', 'galley', 'xebec', 'galley'], navy: ['galley', 'greatgalley', 'carrack', 'galleass', 'lcarrack'], merchant: ['tartane', 'carrack', 'greatgalley', 'cog'] },
    ind:   { pirate: ['parau', 'sambuk', 'dhow', 'fusta', 'baghlah'], navy: ['dhow', 'baghlah', 'galley', 'baghlah'], merchant: ['sambuk', 'dhow', 'baghlah', 'jong'] },
    sea:   { pirate: ['korakora', 'parau', 'junk', 'junk', 'jong'], navy: ['junk', 'jong', 'ljunk'], merchant: ['junk', 'jong', 'dhow', 'ljunk'] },
    east:  { pirate: ['kobaya', 'kobaya', 'sekibune', 'junk', 'atakebune'], navy: ['junk', 'ljunk', 'ljunk'], merchant: ['shachuan', 'junk', 'ljunk', 'maengseon'] },
    amer:  { pirate: ['caravel', 'pinnace', 'lcaravel', 'carrack', 'galleon'], navy: ['carrack', 'galleon', 'lgalleon'], merchant: ['caravel', 'carrack', 'galleon', 'lgalleon'] }
  };
  var NAVY_POOL = {
    '명': ['junk', 'ljunk', 'ljunk', 'ljunk'],
    '조선': ['maengseon', 'maengseon', 'panokseon', 'panokseon', 'geobukseon'],
    '일본': ['kobaya', 'sekibune', 'sekibune', 'atakebune'],
    '오스만 제국': ['fusta', 'galley', 'galley', 'galleass'],
    '베네치아': ['galley', 'greatgalley', 'galleass', 'lcarrack'],
    '맘루크 왕조': ['galley', 'dhow', 'baghlah'],
    '캘리컷 왕국': ['parau', 'parau', 'dhow', 'baghlah'],
    '구자라트 술탄국': ['dhow', 'baghlah', 'fusta', 'baghlah'],
    '말라카 술탄국': ['korakora', 'junk', 'jong'],
    '아유타야 왕국': ['junk', 'junk', 'ljunk'],
    '반텐': ['jong', 'junk', 'jong']
  };
  var WEST = ['카스티야', '포르투갈', '잉글랜드', '프랑스', '아라곤', '제노바', '한자 동맹', '덴마크', '스웨덴'];
  /** 이 구역의 해군은 어느 나라인가 */
  SH.navyNation = function (zone, y) {
    var L = {
      atl: ['카스티야', '포르투갈', '잉글랜드', '프랑스'],
      north: ['잉글랜드', '프랑스', '한자 동맹', '덴마크', '스웨덴'],
      med: ['베네치아', '제노바', '오스만 제국', '아라곤', '카스티야', '프랑스'],
      ind: [y < 1517 ? '맘루크 왕조' : '오스만 제국', '구자라트 술탄국', '캘리컷 왕국'].concat(y >= 1500 ? ['포르투갈', '포르투갈'] : []),
      sea: ['아유타야 왕국', '반텐', y < 1511 ? '말라카 술탄국' : '포르투갈'],
      east: ['명', '명', '조선', '일본'],
      amer: ['카스티야', '카스티야', '프랑스'].concat(y >= 1500 ? ['포르투갈'] : [])
    }[zone] || ['카스티야', '포르투갈'];
    return U.pick(L);
  };
  /** 적 함대의 배 종류 n척 */
  SH.enemyTypes = function (kind, zone, nation, n, fameK, y) {
    var pool = (nation && NAVY_POOL[nation] && kind === 'navy') ? NAVY_POOL[nation] : ((POOLS[zone] || POOLS.atl)[kind] || POOLS.atl.merchant);
    if (kind === 'navy' && nation && WEST.indexOf(nation) >= 0 && (zone === 'ind' || zone === 'sea' || zone === 'east')) pool = POOLS.atl.navy;
    var ok = pool.filter(function (id) { return avail(id, y); });
    if (!ok.length) ok = ['caravel'];
    var out = [];
    for (var i = 0; i < n; i++) {
      var idx = Math.min(ok.length - 1, Math.floor(U.rand() * (2 + fameK * 3)));
      if (ok[idx] === 'geobukseon' && U.chance(0.6)) idx = Math.max(0, idx - 1);     // 거북선은 드물다
      out.push(ok[idx]);
    }
    return out;
  };

  // ---------------------------------------------------------------- 문화권과 수리
  var MED_ISLAM = [78, 118, 121];               // 알렉산드리아·안티오키아·베이루트: 지중해 조선 전통도 있다
  /** 이 도시의 조선소가 익숙한 배의 문화권들 */
  SH.cityYards = function (c) {
    var own = R.cityOwner(c), iber = R.iberOwner(own);
    var r = c.region, out = [];
    if (r <= 2) out.push('eu');
    else if (r === 3) { if (c.style === 'sw' || c.rel === 'I') out.push('is'); }
    else if (r === 4 || r === 5 || r === 7) out.push('is');
    else if (r === 6 || r === 9) out.push('ea');
    else if (r === 8) out.push('sa', 'ea', 'is');
    else if (r === 10) out.push(c.rel === 'N' ? 'am' : 'eu');
    if (MED_ISLAM.indexOf(c.id) >= 0) out.push('eu');
    if (iber && out.indexOf('eu') < 0) out.push('eu');
    return out;
  };
  /** 수리비 배수: 낯선 문화권의 배 · 목재 · 꿰맨 선체 */
  SH.repairK = function (sh, c) {
    var t = SH.def(sh), k = 1;
    if (c && SH.cityYards(c).indexOf(t.cult) < 0) k *= 1.5;
    var w = SH.wood(sh); if (w) k *= w.rep;
    if (SH.has(sh, 'sewn')) k *= 0.6;
    return k;
  };
  /** 폭풍 피해 배수 (off: 해안에서 떨어진 거리) */
  SH.stormK = function (sh, off) {
    var k = 1;
    if (SH.has(sh, 'coast') && off > SH.OPEN) k *= 1.6;
    if (SH.has(sh, 'sturdy')) k *= 0.75;
    if (SH.has(sh, 'raft')) k *= 0.7;
    if (SH.has(sh, 'bulkhead')) k *= 0.9;
    var bat = sh.sails.filter(function (x) { return x === 'bat'; }).length;
    if (bat && bat * 2 >= sh.sails.length) k *= 0.85;                 // 살 돛은 빨리 줄인다
    return k;
  };
  SH.unsinkable = function (sh) { return SH.has(sh, 'bulkhead') || SH.has(sh, 'raft'); };

  // ---------------------------------------------------------------- 목재
  var BALTIC = [44, 45, 46, 56, 57, 58], SCANDI = [64, 65, 66, 67, 68], DALM = [29, 71, 32];
  var BLACKSEA = [112, 113, 114, 115, 116, 76, 77], BARBARY = [81, 82, 83], LEVANT = [118, 121], ARABIA = [124, 125, 126, 128], BRAZIL = [214, 215, 216];
  /** 이 도시의 조선소가 늘 쓰는 목재 {id, k: 값 배수} */
  SH.localWood = function (c) {
    var id = c.id, r = c.region;
    if (BALTIC.indexOf(id) >= 0) return { id: 'oak', k: 1 };
    if (SCANDI.indexOf(id) >= 0) return { id: 'pine', k: 1 };
    if (DALM.indexOf(id) >= 0) return { id: 'dalm', k: 1 };
    if (BLACKSEA.indexOf(id) >= 0) return { id: 'blacksea', k: 1 };
    if (BARBARY.indexOf(id) >= 0) return { id: 'med', k: 1.15 };
    if (LEVANT.indexOf(id) >= 0) return { id: 'cedar', k: 1 };
    if (id === 78 || id === 79) return { id: 'cedar', k: 1.1, imp: true };      // 레바논에서 들여온다
    if (ARABIA.indexOf(id) >= 0) return { id: 'teak', k: 1.2, imp: true };   // 인도에서 들여온 티크
    if (c.style === 'kr') return { id: 'kpine', k: 1 };   // 조선 소나무 (한양·동래·한산도)
    if (BRAZIL.indexOf(id) >= 0) return { id: 'brazil', k: 1 };
    if (r === 0) return { id: 'iberian', k: 1 };
    if (r === 1) return { id: 'oak', k: 1.05 };
    if (r === 2) return { id: 'med', k: 1 };
    if (r === 3) return c.style === 'sw' || c.style === 'is' ? { id: 'mangrove', k: 1 } : { id: 'african', k: 1 };
    if (r === 4) return { id: 'cedar', k: 1.15, imp: true };
    if (r === 5 || r === 8) return { id: 'teak', k: 1 };
    if (r === 6) return { id: 'camphor', k: 1 };
    if (r === 9) return { id: 'hinoki', k: 1 };
    if (r === 10) return c.rel === 'N' && c.style === 'an' ? { id: 'balsawood', k: 1 } : { id: 'mahog', k: 1 };
    return { id: 'pine', k: 1 };
  };
  /** 목재 시장이 있는 도시인가 (교역품에 목재가 있다 — 투자로 늘어난 품목 포함) */
  SH.timberMarket = function (c) { return R.cityGoods(c).indexOf('timber') >= 0; };
  /** 이 목재가 나는 곳 가운데 내가 아는 가장 가까운 도시 */
  SH.woodSource = function (wid, near) {
    var s = S(), best = null, bd = 99;
    G.CITY_DATA.forEach(function (c) {
      if (!c.port || !R.cityExists(c) || s.known.indexOf(c.id) < 0) return;
      var lw = SH.localWood(c); if (lw.id !== wid || lw.imp) return;         // 들여다 쓰는 고장은 산지가 아니다
      var d = near ? G.REGION_DIST[near.region][c.region] : 0;
      if (d < bd) { bd = d; best = c; }
    });
    return best;
  };
  /** 배에 실린 목재를 산지별로 (통) */
  SH.cargoWoods = function () {
    var cg = S().fleet.cargo.timber, out = {};
    if (!cg || cg.q <= 0) return out;
    var w = cg.woods;
    if (!w) { if (cg.from != null && G.CITY_DATA[cg.from]) out[SH.localWood(G.CITY_DATA[cg.from]).id] = cg.q; return out; }
    var sum = 0; for (var k in w) sum += w[k];
    if (sum <= 0) return out;
    for (var k2 in w) { var q = Math.floor(w[k2] * cg.q / sum); if (q > 0) out[k2] = q; }
    return out;
  };
  /** 목재를 샀을 때 산지를 적어 둔다 (trade.js) */
  SH.noteTimber = function (c, q, prevQ) {
    var cg = S().fleet.cargo.timber; if (!cg) return;
    if (!cg.woods) { cg.woods = {}; if (prevQ > 0 && cg.from != null && G.CITY_DATA[cg.from]) cg.woods[SH.localWood(G.CITY_DATA[cg.from]).id] = prevQ; }
    var w = SH.localWood(c).id; cg.woods[w] = (cg.woods[w] || 0) + q;
  };
  SH.useCargoWood = function (wid, n) {
    var f = S().fleet, cg = f.cargo.timber; if (!cg) return;
    var have = SH.cargoWoods();
    cg.woods = have; cg.woods[wid] = Math.max(0, (have[wid] || 0) - n);
    cg.q = Math.max(0, cg.q - n);
    if (cg.q <= 0) delete f.cargo.timber;
  };
  /** 배 한 척을 지을 때 드는 목재 (통) */
  SH.woodNeed = function (typeId) { return Math.max(10, Math.ceil(G.SHIP[typeId].cap * 0.25)); };
  SH.INV_NEAR = 2; SH.INV_WORLD = 4;
  /** 이 조선소에서 고를 수 있는 목재들
     · 이 고장 목재는 언제나
     · 교역품에 목재가 있는 도시: 투자 2등급이면 가까운 지역의 목재, 4등급이면 세계 각지의 목재 (산지를 알아야 한다)
     · 투자 2등급 이상인 도시: 배에 싣고 온 목재 */
  SH.woodOptions = function (c, typeId) {
    var lw = SH.localWood(c), out = [{ id: lw.id, how: 'local', k: G.TIMBER[lw.id].price * lw.k }];
    var lv = R.investLv(c.id), mk = SH.timberMarket(c);
    if (mk && lv >= SH.INV_NEAR) {
      G.TIMBERS.forEach(function (w) {
        if (w.id === lw.id || w.local) return;
        var src = SH.woodSource(w.id, c); if (!src) return;
        var d = G.REGION_DIST[c.region][src.region];
        if (d > 2 && lv < SH.INV_WORLD) return;
        out.push({ id: w.id, how: d > 2 ? 'world' : 'near', k: w.price * (1.1 + 0.06 * d), src: src.id });
      });
    }
    if (lv >= SH.INV_NEAR && typeId) {
      var cw = SH.cargoWoods(), need = SH.woodNeed(typeId);
      for (var wid in cw) if (cw[wid] >= need) out.push({ id: wid, how: 'cargo', k: G.TIMBER[wid].price * 0.9, need: need });
    }
    return out;
  };
  /** 목재를 고를 수 없는 까닭 (조선소 목수가 알려 준다) */
  SH.woodHint = function (c) {
    var lv = R.investLv(c.id), mk = SH.timberMarket(c);
    if (!mk) return lv >= SH.INV_NEAR ? '이 도시에는 목재 시장이 없어 다른 고장 목재는 들여오지 못하네. 목재를 직접 실어 오면 그걸로 지어 주지.' : '다른 고장 목재를 쓰려면 목재 시장이 있는 도시에서 사업에 투자하거나, 투자한 도시에 목재를 실어 오게.';
    if (lv < SH.INV_NEAR) return '이 도시 사업에 더 투자하면(' + SH.INV_NEAR + '등급) 가까운 고장의 목재를, 더 많이(' + SH.INV_WORLD + '등급) 투자하면 세계 각지의 목재를 들여올 수 있네.';
    if (lv < SH.INV_WORLD) return '투자가 ' + SH.INV_WORLD + '등급이 되면 먼 나라의 목재도 들여올 수 있네.';
    return '';
  };

  // ---------------------------------------------------------------- 조선 기술 (대항해시대 2의 공업치)
  /* 도시마다 조선 기술 등급(1~5)이 있다. 기본 = 도시 크기(1~3) + 이름난 조선소면 1 (최대 4).
     조선소에 기술 투자를 하면 1만·3만·7만 닢에서 한 등급씩(최대 +3, 전체 5등급까지) 오른다.
     배마다 등급(lv)이 있어 그 도시 기술이 모자라면 짓지 못한다. 어느 배를 짓는지는 여전히 그 고장의 전통(조선소 목록)이 정한다. */
  SH.TECH_CENTERS = [0, 7, 3, 12, 29, 28, 112, 24, 23, 38, 45, 44, 56, 152, 148, 169, 176, 175, 174, 177, 190, 192, 196];
  SH.TECH_INV = [0, 10000, 30000, 70000];
  SH.techBase = function (c) { return Math.min(4, Math.max(1, c.size) + (SH.TECH_CENTERS.indexOf(c.id) >= 0 ? 1 : 0)); };
  SH.techAmt = function (c) { var s = S(); return (s.tech && s.tech[c.id]) || 0; };
  SH.techBonus = function (c) { var a = SH.techAmt(c), b = 0; for (var i = 1; i < SH.TECH_INV.length; i++) if (a >= SH.TECH_INV[i]) b = i; return b; };
  SH.tech = function (c) { return Math.min(5, SH.techBase(c) + SH.techBonus(c)); };
  /** 다음 등급까지 더 넣어야 할 돈 (더 오를 수 없으면 null) */
  SH.techNext = function (c) {
    var b = SH.techBonus(c); if (b >= SH.TECH_INV.length - 1 || SH.tech(c) >= 5) return null;
    return SH.TECH_INV[b + 1] - SH.techAmt(c);
  };
  SH.techInvest = function (c, amt) {
    var s = S(), before = SH.tech(c);
    s.tech = s.tech || {}; s.tech[c.id] = (s.tech[c.id] || 0) + amt;
    return SH.tech(c) - before;
  };

  // ---------------------------------------------------------------- 보여 주기
  /** 특성 칩 (HTML) */
  SH.traitChips = function (t) {
    t = SH.def(t);
    return t.traits.map(function (k) { var d = G.SHIP_TRAITS[k]; return '<span class="trait" title="' + U.esc(d.desc) + '">' + d.name + '</span>'; }).join('');
  };
  SH.woodLine = function (w) {
    var p = [];
    p.push('내구 ' + (w.hp >= 1 ? '+' : '') + Math.round((w.hp - 1) * 100) + '%');
    if (w.spd) p.push('속도 ' + (w.spd > 0 ? '+' : '') + Math.round(w.spd * 100) + '%');
    if (w.rep !== 1) p.push('수리비 ' + (w.rep > 1 ? '+' : '') + Math.round((w.rep - 1) * 100) + '%');
    return p.join(' · ');
  };
})(window.G = window.G || {});
