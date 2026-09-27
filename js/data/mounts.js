/* 육상 탐험의 탈것·짐 나르기 (지원 동물). 값만 바꿔 균형을 다듬을 수 있게 표로 모았다.
   · spd  : 지형별 걸음 배율 (도보 = 1). '_'는 표에 없는 지형의 값. 알맞은 땅에서 1.2~3배.
   · fat  : 하루 피로가 쌓이는 배율 (작을수록 덜 지친다)
   · food / water : 하루 식량·물 쓰는 양의 배율 (짐을 많이 실어 덜 상하고 덜 흘린다 = 오래 버틴다)
   · risk : 그 지형에서 하루에 짐승 하나를 잃을 확률 (더위·늪·추위, 마차는 바퀴가 부서진다)
   · per  : 짐승(또는 마차·썰매·짐꾼 한 패) 하나가 맡는 대원 수 — 모자라면 효과가 그만큼 줄어든다
   · price: 하나 값(금화), sell: 되팔 때 값의 비율, hire: 품삯(짐꾼은 탐험이 끝나면 돌아간다)
   · combat: 지상전 힘 +비율, scout: 정찰·지도 채우기 +반경
   · look : 탐험대 모형을 그릴 때 (js/art/party.js)
   지형: grass 초원 · steppe 스텝 · desert 사막 · forest 숲 · jungle 밀림 · mountain 산악 · snow 설원 · tundra 툰드라 · ice 빙원 */
(function (G) {
  'use strict';
  G.MOUNT_TERR = ['grass', 'steppe', 'desert', 'forest', 'jungle', 'mountain', 'snow', 'tundra', 'ice'];
  G.MOUNT_TERR_NAME = { grass: '초원', steppe: '스텝', desert: '사막', forest: '숲', jungle: '밀림', mountain: '산악', snow: '설원', tundra: '툰드라', ice: '빙원' };
  G.MOUNTS = {
    walk: {
      name: '도보', per: 0, price: 0, sell: 0,
      spd: { _: 1 }, fat: { _: 1 },
      look: { kind: 'walk' },
      desc: '짐을 저마다 지고 걷는다. 돈이 들지 않고 어디든 갈 수 있지만 느리고 쉽게 지친다.'
    },
    porter: {
      name: '짐꾼', per: 3, price: 25, hire: true, sell: 0,
      spd: { _: 1.2, forest: 1.25, jungle: 1.3 }, fat: { _: 0.78, jungle: 0.72, forest: 0.74 }, food: 1.12,
      look: { kind: 'porter' },
      desc: '짐을 머리에 이거나 장대에 메고 가는 그 고장 사람들. 짐승이 살기 어려운 밀림에서도 걸음이 덜 무너진다. 탐험이 끝나면 품삯을 받고 돌아간다.'
    },
    donkey: {
      name: '당나귀', per: 2, price: 60, sell: 0.5,
      spd: { _: 1.35, grass: 1.4, steppe: 1.4, desert: 1.35, forest: 1.25, jungle: 1.1, mountain: 1.5, snow: 1.1, tundra: 1.15, ice: 1.0 },
      fat: { _: 0.72, mountain: 0.65, jungle: 0.9 },
      risk: { jungle: 0.02, snow: 0.02, ice: 0.04 },
      look: { kind: 'pack', animal: 'donkey' },
      desc: '짐바구니를 얹은 당나귀 행렬. 빠르지는 않아도 산길과 메마른 땅에 강하고 값이 싸다.'
    },
    horse: {
      name: '말', per: 1, price: 180, sell: 0.5, combat: 0.25, scout: 0.4,
      spd: { _: 2.0, grass: 2.2, steppe: 2.4, desert: 1.5, forest: 1.6, jungle: 1.1, mountain: 1.3, snow: 1.2, tundra: 1.4, ice: 1.0 },
      fat: { _: 0.6, desert: 0.8, jungle: 0.9, mountain: 0.75, snow: 0.85, ice: 0.95 },
      water: { desert: 1.25 },
      risk: { desert: 0.04, jungle: 0.05, snow: 0.03, ice: 0.06 },
      look: { kind: 'rider', animal: 'horse' },
      desc: '대원 모두 말을 탄 기마 탐험대. 초원과 평야에서 가장 빠르고 멀리 살피며 싸움에도 강하다. 사막·밀림·설원에서는 말이 쓰러진다.'
    },
    wagon: {
      name: '마차', per: 6, price: 450, sell: 0.5, combat: 0.1,
      spd: { _: 1.8, grass: 2.8, steppe: 2.6, desert: 1.2, forest: 1.3, jungle: 0.8, mountain: 0.6, snow: 0.7, tundra: 1.0, ice: 0.6 },
      fat: { _: 0.5, grass: 0.45, steppe: 0.45, forest: 0.7, mountain: 1.15, jungle: 1.1, snow: 1.0, ice: 1.1 },
      food: 0.88, water: 0.9,
      risk: { mountain: 0.05, jungle: 0.04, snow: 0.03, ice: 0.06 },
      look: { kind: 'cart' },
      desc: '포장을 씌운 짐마차와 끄는 짐승(유럽·초원은 말, 인도·중국·아프리카는 소). 평지에서는 가장 편하고 짐이 넉넉해 오래 버틴다. 산과 밀림에서는 오히려 걷는 것보다 느리고 바퀴가 부서진다.'
    },
    camel: {
      name: '낙타', per: 1, price: 160, sell: 0.5, combat: 0.15, scout: 0.3,
      spd: { _: 1.5, desert: 3.0, steppe: 2.1, grass: 1.7, forest: 1.2, jungle: 0.9, mountain: 1.2, snow: 0.9, tundra: 1.0, ice: 0.8 },
      fat: { _: 0.7, desert: 0.4, steppe: 0.55 },
      water: { _: 0.8, desert: 0.55 },
      risk: { jungle: 0.05, snow: 0.05, ice: 0.08, forest: 0.02 },
      look: { kind: 'rider', animal: 'camel' },
      desc: '낙타를 타고 짐을 실은 대상 행렬. 사막에서는 누구보다 빠르고 물을 적게 쓴다. 습한 숲과 눈밭에서는 약하다.'
    },
    llama: {
      name: '라마', per: 2, price: 45, sell: 0.5,
      spd: { _: 1.4, mountain: 2.4, snow: 1.9, grass: 1.5, steppe: 1.6, desert: 1.4, forest: 1.3, jungle: 1.0, tundra: 1.4, ice: 1.2 },
      fat: { _: 0.72, mountain: 0.5, snow: 0.55 },
      food: 0.95,
      risk: { jungle: 0.03, desert: 0.01 },
      look: { kind: 'pack', animal: 'llama' },
      desc: '안데스 사람들이 짐을 싣는 라마 행렬. 사람은 걷지만 짐이 가벼워져 높은 산과 고원에서 걸음이 크게 빨라진다.'
    },
    elephant: {
      name: '코끼리', per: 6, price: 1200, sell: 0.55, combat: 0.4, scout: 0.3,
      spd: { _: 1.6, jungle: 2.2, forest: 2.0, grass: 1.9, steppe: 1.8, desert: 1.2, mountain: 1.1, snow: 0.8, tundra: 0.8, ice: 0.6 },
      fat: { _: 0.55, jungle: 0.45, desert: 0.8, mountain: 0.85 },
      food: 1.1,
      risk: { snow: 0.06, ice: 0.08, desert: 0.02 },
      look: { kind: 'elephant' },
      desc: '등에 가마(하우다)를 얹은 코끼리. 밀림과 숲을 헤치고 나아가며, 들짐승과 도적이 함부로 덤비지 못한다. 값이 비싸고 추위에 약하다.'
    },
    reindeer: {
      name: '순록 썰매', per: 3, price: 90, sell: 0.5,
      spd: { _: 1.2, snow: 2.8, tundra: 3.0, ice: 2.6, forest: 1.6, grass: 1.2, steppe: 1.2, mountain: 1.3, desert: 0.7, jungle: 0.6 },
      fat: { _: 0.8, snow: 0.4, tundra: 0.4, ice: 0.45, forest: 0.6 },
      cold: 0.5,
      risk: { desert: 0.08, jungle: 0.08, grass: 0.02, steppe: 0.02 },
      look: { kind: 'sled', animal: 'reindeer' },
      desc: '북쪽 사람들의 순록 썰매. 눈밭·툰드라·얼음 위에서는 가장 빠르고 추위에 덜 지친다. 눈이 없는 땅에서는 힘을 못 쓴다.'
    },
    yak: {
      name: '야크', per: 2, price: 80, sell: 0.5,
      spd: { _: 1.4, mountain: 2.2, snow: 2.4, tundra: 1.8, ice: 1.6, steppe: 1.6, grass: 1.4, desert: 1.1, forest: 1.2, jungle: 0.7 },
      fat: { _: 0.72, mountain: 0.5, snow: 0.5, ice: 0.6 },
      cold: 0.7,
      risk: { jungle: 0.06, desert: 0.03 },
      look: { kind: 'pack', animal: 'yak' },
      desc: '티베트와 몽골 고원의 털 많은 야크. 높은 산과 눈밭에서 짐을 지고 묵묵히 걷는다.'
    }
  };

  /* 성문 마구간: 도시의 문화(style)마다 파는 탈것. from = 그 해부터 (아메리카의 말·당나귀는 정복 뒤), north = 그 위도 위에서만
     도시 번호로 따로 정한 곳이 먼저다. 짐수레를 끄는 짐승(draft)은 문화마다 다르다. */
  G.MOUNT_MARKET = {
    style: {
      ib: ['horse', 'donkey', 'wagon'], ne: ['horse', 'wagon', 'donkey'], it: ['horse', 'donkey', 'wagon'], gr: ['horse', 'donkey', 'wagon'],
      ru: ['horse', 'wagon', { id: 'reindeer', north: 57 }],
      is: ['camel', 'horse', 'donkey'], af: ['camel', 'horse', 'donkey'], pe: ['camel', 'horse', 'donkey'],
      tr: ['porter', 'donkey'], sw: ['donkey', 'porter'],
      st: ['horse', 'camel', 'wagon', { id: 'reindeer', north: 56 }],
      in: ['elephant', 'horse', 'wagon', 'porter'], se: ['elephant', 'porter'],
      cn: ['horse', 'donkey', 'wagon'], jp: ['horse', 'porter'], kr: ['horse', 'porter'],
      az: ['porter', { id: 'horse', from: 1525 }, { id: 'donkey', from: 1525 }],
      co: ['horse', 'donkey', 'wagon'],
      an: ['llama', 'porter', { id: 'horse', from: 1540 }, { id: 'donkey', from: 1540 }]
    },
    city: {
      59: ['horse', 'wagon', 'reindeer'],            // 노브고로드 — 북쪽 숲 사람들의 순록
      139: ['yak', 'horse', 'porter'],               // 라사
      137: ['camel', 'horse', 'yak'], 138: ['camel', 'horse', 'donkey'],   // 카슈가르 · 투르판
      143: ['horse', 'camel', 'yak'], 144: ['horse', 'camel', 'wagon'],    // 호브드 · 카라코룸
      142: ['horse', 'reindeer', 'wagon'],           // 시빌
      145: ['elephant', 'camel', 'horse', 'wagon'], 146: ['camel', 'horse', 'wagon'], 147: ['camel', 'elephant', 'horse', 'wagon'],   // 델리 · 라호르 · 아마다바드
      183: ['camel', 'horse', 'donkey'], 184: ['horse', 'camel', 'donkey', 'wagon'],   // 감주 · 서안 (비단길 들머리)
      181: ['horse', 'donkey', 'porter'], 182: ['horse', 'donkey', 'porter'],          // 운남 · 성도 (차마고도)
      218: ['porter', { id: 'horse', from: 1540 }, { id: 'donkey', from: 1540 }],       // 보고타 (라마가 살지 않는 땅)
      104: ['porter', 'donkey']                      // 짐바브웨
    },
    // 마차를 끄는 짐승
    draft: { in: 'ox', cn: 'ox', af: 'ox', tr: 'ox', sw: 'ox', se: 'ox', co: 'ox', an: 'ox', az: 'ox', jp: 'ox', kr: 'ox' }
  };

  /* 규칙 (land.js·성문에서 쓴다) */
  var M = {};
  G.Mounts = M;
  function val(tab, terr, d) { if (tab == null) return d; if (typeof tab === 'number') return tab; return tab[terr] != null ? tab[terr] : tab._ != null ? tab._ : d; }
  M.get = function (id) { return G.MOUNTS[id] || G.MOUNTS.walk; };
  /** 이 도시 성문 마구간에서 파는 것 (연도·위도에 맞게) */
  M.offers = function (c, year) {
    var list = (G.MOUNT_MARKET.city[c.id] || G.MOUNT_MARKET.style[c.style] || ['horse', 'donkey']);
    var out = [];
    list.forEach(function (o) {
      var id = typeof o === 'string' ? o : o.id;
      if (typeof o === 'object') { if (o.from && year < o.from) return; if (o.north && c.lat < o.north) return; }
      if (G.MOUNTS[id] && out.indexOf(id) < 0) out.push(id);
    });
    return out;
  };
  M.draft = function (c) { return (c && G.MOUNT_MARKET.draft[c.style]) || 'horse'; };
  /** 짐승이 몇 필 있어야 대원 모두를 맡는가 */
  M.need = function (id, party) { var m = M.get(id); return m.per ? Math.max(1, Math.ceil(party / m.per)) : 0; };
  /** 모자라면 효과가 그만큼 줄어든다 (0~1) */
  M.cover = function (mt, party) { if (!mt || mt.id === 'walk' || !mt.n) return 0; return Math.min(1, mt.n / M.need(mt.id, party)); };
  function blend(x, cov) { return 1 + (x - 1) * cov; }
  M.speed = function (mt, terr, party) { var m = M.get(mt && mt.id), cov = M.cover(mt, party); return blend(val(m.spd, terr, 1), cov); };
  M.fatigue = function (mt, terr, party) { var m = M.get(mt && mt.id), cov = M.cover(mt, party); return blend(val(m.fat, terr, 1), cov); };
  M.use = function (mt, terr, party, what) { var m = M.get(mt && mt.id), cov = M.cover(mt, party); return blend(val(m[what], terr, 1), cov); };
  M.risk = function (mt, terr) { var m = M.get(mt && mt.id); return val(m.risk, terr, 0); };
  M.combat = function (mt, party) { var m = M.get(mt && mt.id); return (m.combat || 0) * M.cover(mt, party); };
  M.scout = function (mt, party) { var m = M.get(mt && mt.id); return (m.scout || 0) * M.cover(mt, party); };
  M.cold = function (mt, party) { var m = M.get(mt && mt.id); return m.cold != null ? blend(m.cold, M.cover(mt, party)) : 1; };
  /** 지형 적합도: ◎ 아주 좋음 · ○ 좋음 · △ 보통 · × 나쁨 */
  M.suit = function (id, terr) {
    var m = M.get(id), v = val(m.spd, terr, 1), r = val(m.risk, terr, 0);
    if (id === 'walk') return { mark: '·', cls: 'mid', v: 1 };
    if (r >= 0.04 || v < 1.05) return { mark: '×', cls: 'bad', v: v };
    if (v >= 2.2) return { mark: '◎', cls: 'best', v: v };
    if (v >= 1.5) return { mark: '○', cls: 'good', v: v };
    return { mark: '△', cls: 'mid', v: v };
  };
  M.best = function (id) { var m = M.get(id), b = 1, bt = null; G.MOUNT_TERR.forEach(function (t) { var v = val(m.spd, t, 1); if (v > b) { b = v; bt = t; } }); return { v: b, terr: bt }; };
  /** 짐승을 잃을 때의 말 */
  M.lossText = function (id, terr) {
    var n = M.get(id).name;
    if (id === 'wagon') return terr === 'mountain' ? '험한 비탈에서 마차 바퀴가 부서져 한 대를 버렸다.' : '마차 한 대가 진창에 빠져 끝내 버리고 왔다.';
    if (terr === 'desert') return n + ' 하나가 더위와 목마름에 쓰러졌다.';
    if (terr === 'jungle') return n + ' 하나가 늪과 벌레에 시달리다 쓰러졌다.';
    if (terr === 'snow' || terr === 'ice' || terr === 'tundra') return n + ' 하나가 추위를 견디지 못했다.';
    return n + ' 하나가 지쳐 쓰러졌다.';
  };
  M.val = val;
})(window.G = window.G || {});
