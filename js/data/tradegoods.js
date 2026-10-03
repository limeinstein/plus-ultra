/* 지역마다 다른 교역품과 중계무역 (G.TradeGoods)
   cities.js(도시 특산물)는 그대로 두고, 읽어 들인 뒤 여기서 고쳐 끼운다 — 도시가 늘어나도 규칙대로 나뉜다.

   1) 이름은 같아도 산지마다 다른 물건을 나눈다 (SPLIT)
      · 도자기  → 중국 도자기(porcelain: 명·조선·대월의 자기) / 유럽 도기(faience: 이베리아·이탈리아·오스만의 채색 도기)
      · 견직물  → 견직물(silk: 유럽·이슬람 세계) / 중국 비단(cnsilk: 명·조선·대월)
      · 면직물  → 면직물(cottoncloth) / 인도 캘리코(calico: 인도에서 짠 무명)
      · 미술품  → 미술품(art: 유럽·아프리카) / 동양 서화(eaart: 명·조선·일본)
      예전에는 발렌시아·이스탄불의 도자기도 '도자기'라서 남유럽이 도자기 산지로 쳐졌고, 중국 도자기를 유럽에 가져가도 값이 안 났다.

   2) 중계무역 (RELAY): 산지가 아닌 큰 항구가 먼 곳의 물건을 들여와 판다.
      · 그 항구는 '산지'로 치지 않는다 → 물건 값은 진짜 산지에서 얼마나 먼지로 정해진다 (R.regionalMult)
      · 사는 값 = 그 항구에서의 시세 × buy(0.72) — 산지보다 비싸고, 더 먼 곳에 팔면 남는다 (최소 산지 값 × floor)
      · 그 항구가 사 주는 값 = 시세 × sell(0.6), 재고 = 보통의 stock(0.6)배
      예) 후추: 캘리컷 34닢 → 알렉산드리아(중계) 53닢 → 베니스(중계) 68닢 → 리스본에 팔면 116닢 · 런던 135닢
      from: 이 해부터 (앤트워프의 포르투갈 향신료 창고 1501, 나가사키 남만무역 1571 …)
   조정값: G.BALANCE.relay (이 파일 아래) */
(function (G) {
  'use strict';
  var EAST = { 6: 1, 8: 1, 9: 1 };          // 중국(조선 포함)·동남아시아·일본

  // 새 교역품 (G.GOODS 끝에 붙인다 — 시세 수첩이 순번(idx)으로 적으므로 앞의 순번은 그대로)
  var NEW = [
    { id: 'faience', name: '유럽 도기', cat: 'craft', p: 48, life: 0, el: 0.75 },
    { id: 'cnsilk', name: '중국 비단', cat: 'cloth', p: 118, life: 0, el: 0.95 },
    { id: 'calico', name: '인도 캘리코', cat: 'cloth', p: 44, life: 0, el: 0.7 },
    { id: 'eaart', name: '동양 서화', cat: 'craft', p: 160, life: 0, el: 0.85 }
  ];
  /** 이름을 지역에 맞게 */
  var RENAME = { porcelain: '중국 도자기' };

  /** (특산물 id, 도시) → 그 도시에서는 무엇으로 볼지. 바꾸지 않으면 그대로 */
  var SPLIT = {
    porcelain: function (c) { return EAST[c.region] ? 'porcelain' : 'faience'; },
    silk: function (c) { return c.region === 6 || c.region === 8 ? 'cnsilk' : c.region === 9 ? null : 'silk'; },   // 일본은 중국 비단을 들여왔다 (아래 중계)
    cottoncloth: function (c) { return c.region === 5 ? 'calico' : 'cottoncloth'; },
    art: function (c) { return c.region === 6 || c.region === 9 ? 'eaart' : 'art'; }
  };
  /** 산지에 더해 이 도시들도 만든다 (채색 도기: 피렌체 마욜리카) */
  var ADD = { '피렌체': ['faience'] };

  /** 중계무역 항구: 도시 이름 → [물건 id, …] 또는 {id, from} */
  var RELAY = {
    '알렉산드리아': ['pepper', 'clove', 'cinnamon'],      // 홍해를 거쳐 온 인도 향신료 → 베네치아 갤리선
    '카이로': ['ginger', 'pepper'],
    '베이루트': ['cinnamon', 'nutmeg'],
    '베니스': ['pepper', 'clove', 'cnsilk'],               // 레반트에서 들여와 알프스 너머로
    '앤트워프': [{ id: 'pepper', from: 1501 }, { id: 'clove', from: 1501 }],   // 포르투갈 향신료 창고(feitoria)
    '이스탄불': ['porcelain', 'cnsilk'],                    // 오스만 궁정이 모은 명 자기 · 비단길 비단
    '카파': ['cnsilk'],                                     // 흑해의 제노바 상관, 비단길 끝
    '호르무즈': ['carpet', 'pepper', 'porcelain'],          // 페르시아만 어귀의 섬 시장
    '메카': ['musk', 'pepper'],                              // 순례 시장
    '아덴': ['pepper', 'calico'],
    '말라카': ['pepper', 'clove', 'nutmeg', 'sandalwood', 'porcelain', 'calico'],   // 동서 바다가 만나는 큰 시장
    '캘리컷': ['clove', 'cinnamon', 'porcelain'],
    '고아': ['cinnamon', 'sandalwood', { id: 'porcelain', from: 1510 }],
    '오문': ['cnsilk', 'porcelain', 'silkraw'],             // 포르투갈 상관 (1557~)
    '나가사키': [{ id: 'cnsilk', from: 1571 }, { id: 'porcelain', from: 1571 }],   // 남만무역: 마카오의 비단을 일본 은과 바꾼다
    '쿄토': ['cnsilk'],
    '에도': ['cnsilk']
  };

  /** 새 물건의 지역별 수요 (G.GOOD_DEMAND에 더함): 유럽은 비단을 짜니 중국 비단 웃돈이 덜하고, 일본은 중국 비단을 몹시 찾는다 */
  var DEMAND = {
    faience: { 6: 0.5, 9: 0.6, 8: 0.7, 5: 0.8 },
    silk: { 6: 0.6, 9: 0.7, 8: 0.7, 5: 0.85 },
    cnsilk: { 0: 0.8, 1: 0.8, 2: 0.75, 4: 0.9, 9: 1.5 },
    porcelain: { 0: 0.9, 1: 0.9, 2: 0.9, 9: 1.3, 4: 1.1 },
    eaart: { 0: 0.6, 1: 0.6, 2: 0.6, 3: 0.6, 10: 0.6, 4: 0.7, 5: 0.8, 7: 0.8 },
    art: { 6: 0.6, 8: 0.7, 9: 0.6, 5: 0.7 }
  };

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.relay = G.BALANCE.relay || { buy: 0.72, sell: 0.6, floor: 1.15, stock: 0.6 };

  var TG = G.TradeGoods = { SPLIT: SPLIT, RELAY: RELAY, NEW: NEW };

  // ---- 적용
  NEW.forEach(function (g) { if (!G.GOOD[g.id]) { g.idx = G.GOODS.length; G.GOODS.push(g); G.GOOD[g.id] = g; } });
  for (var k in RENAME) if (G.GOOD[k]) G.GOOD[k].name = RENAME[k];
  for (var d in DEMAND) { var o = G.GOOD_DEMAND[d] || (G.GOOD_DEMAND[d] = {}); for (var r in DEMAND[d]) o[r] = (o[r] || 1) * DEMAND[d][r]; }

  var byName = {};
  (G.CITY_DATA || []).forEach(function (c) {
    if (!c || !c.goods) return;
    byName[c.name] = c;
    var out = [];
    c.goods.forEach(function (id) {
      var to = SPLIT[id] ? SPLIT[id](c) : id;
      if (to && out.indexOf(to) < 0) out.push(to);
    });
    c.goods = out;
  });
  for (var nm in ADD) { var ca = byName[nm]; if (ca) ADD[nm].forEach(function (id) { if (ca.goods.indexOf(id) < 0) ca.goods.push(id); }); }
  for (var rn in RELAY) {
    var c = byName[rn]; if (!c) continue;
    c.relay = RELAY[rn].map(function (x) { return typeof x === 'string' ? { id: x } : x; }).filter(function (x) { return G.GOOD[x.id]; });
    // 중계하는 물건은 그 도시의 '산지' 특산물에서 뺀다
    c.goods = c.goods.filter(function (id) { return !c.relay.some(function (x) { return x.id === id; }); });
  }

  /** 지금(그 해) 이 도시가 들여와 파는 물건 id들 */
  TG.relayGoods = function (c, year) {
    if (!c || !c.relay) return [];
    var y = year != null ? year : (G.Game && G.Game.state ? G.Game.state.date.y : 9999);
    return c.relay.filter(function (x) { return !x.from || y >= x.from; }).map(function (x) { return x.id; });
  };
  TG.isRelay = function (c, id, year) { return TG.relayGoods(c, year).indexOf(id) >= 0; };
  /** 그 물건의 진짜 산지 지역 이름들 (중계 항구 안내에 쓴다) */
  TG.originRegions = function (id) {
    var o = G.R && G.R.origins ? G.R.origins()[id] || {} : {};
    return Object.keys(o).map(function (r) { return G.REGIONS[+r]; });
  };

  /** 옛 저장 파일: 나뉘기 전에 산 짐을 산지에 맞는 새 물건으로 바꾼다 (발렌시아에서 산 '도자기' → 유럽 도기) */
  TG.migrate = function (S) {
    var cargo = S && S.fleet && S.fleet.cargo; if (!cargo) return;
    Object.keys(cargo).forEach(function (id) {
      var cg = cargo[id], c = cg && cg.from != null ? G.CITY_DATA[cg.from] : null;
      if (!SPLIT[id] || !c) return;
      var to = SPLIT[id](c);
      if (!to || to === id) return;
      var dst = cargo[to];
      if (dst) { dst.cost = Math.round((dst.cost * dst.q + cg.cost * cg.q) / (dst.q + cg.q)); dst.q += cg.q; }
      else cargo[to] = cg;
      delete cargo[id];
    });
  };
})(window.G = window.G || {});
