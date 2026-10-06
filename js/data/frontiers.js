/* 개척 단계 — 발견물 단서(증빙)와 항해사 등장을 역사의 흐름에 맞춘다. 대항해시대 3의 순서를 본떴다.
     동쪽 길: 아프리카 서안 → 아프리카 남단 → 인도 → 말라카 → 향료제도 → 중국·지팡그 (·남방대륙)
     서쪽 길: 서인도 → 누에바 에스파냐·남미 동안 → 신세계 해협 → 페루·태평양
   한 단계 안에서는 ① 맛보기(유럽·중근동까지 흘러든 가벼운 교역품) → ② 관문(항로) → ③ 가벼운 발견 → ④ 무거운 발견 →
   ⑤ 가장 무거운 발견 순서로 단서가 열린다. 앞 단계가 '알려졌다'는 것은 내가 찾았거나 역사 속 경쟁자가 발표했다는 뜻이다.
   (단서만 막는다. 우연히 그 자리에 가면 무엇이든 발견할 수 있다.) */
(function (G) {
  'use strict';
  // road: home(처음부터 아는 세계) | east | west
  // pre: 모두 알려져야 소문이 돈다 · preAny: 하나만 알려져도 · gate: 단계를 여는 관문 발견물
  // light: 관문의 단서가 나오기 전에 먼저 찾아야 하는 맛보기 발견 수 (관문의 역사 연도 4년 전부터는 없어도 된다)
  G.FRONTIERS = [
    { id: 'europe', name: '유럽', road: 'home' },
    { id: 'levant', name: '중근동', road: 'home' },
    { id: 'north', name: '북방 바다', road: 'home' },
    { id: 'guinea', name: '아프리카 서안', road: 'east' },
    { id: 'cape', name: '아프리카 남단', road: 'east', gate: 'capegood' },
    { id: 'eafrica', name: '동아프리카', road: 'east', pre: ['capegood'] },
    { id: 'india', name: '인도', road: 'east', pre: ['capegood'], gate: 'indiaroute', light: 1 },
    { id: 'inner', name: '내륙 아시아', road: 'east', pre: ['indiaroute'] },
    { id: 'malacca', name: '말라카', road: 'east', pre: ['indiaroute'], gate: 'malacca', light: 1 },
    { id: 'spice', name: '향료제도', road: 'east', pre: ['malacca'], gate: 'spiceis', light: 1 },
    { id: 'china', name: '중국', road: 'east', pre: ['spiceis'], gate: 'china', light: 1 },
    { id: 'japan', name: '지팡그', road: 'east', pre: ['spiceis'], gate: 'zipang' },
    { id: 'austral', name: '남방대륙', road: 'east', pre: ['spiceis'], gate: 'australia' },
    { id: 'west', name: '서인도', road: 'west', gate: 'westroute' },
    { id: 'mexico', name: '누에바 에스파냐', road: 'west', pre: ['westroute'], gate: 'aztec', light: 1 },
    { id: 'brazil', name: '남미 동안', road: 'west', pre: ['westroute'] },
    { id: 'magellan', name: '신세계 해협', road: 'west', pre: ['westroute'], gate: 'newstrait' },
    { id: 'peru', name: '페루', road: 'west', preAny: ['aztec', 'newstrait'], gate: 'inca' },
    { id: 'pacific', name: '태평양', road: 'west', pre: ['newstrait'] }
  ];
  G.ROADS = { home: '처음부터 아는 세계', east: '동쪽 길', west: '서쪽 길' };

  // 단계별 발견물: [맛보기, 가벼움, 무거움, 가장 무거움]  (관문은 위의 gate)
  var MAP = {
    europe: [[], ['carnac', 'stonehenge', 'poitiers', 'montstmichel', 'stave', 'parthenon', 'delphi', 'mycenae', 'knossos', 'troy', 'hagiasophia', 'alhambra', 'reliquary', 'beowulf', 'kingjohn', 't_coral', 'holylance'],
      ['pamukkale', 'cappadocia', 'rusch', 'troll', 'nessie', 'agamemnon', 'stcrown'], ['minotaur', 'vampire', 'grail']],
    levant: [[], ['papyrus', 'sepulchre', 'rockdome', 't_carpet', 't_antique', 't_frank', 't_pearl'],
      ['pyramid', 'giza', 'kings', 'thebes', 'rosetta', 'edom', 'petra', 't_coffee'],
      ['abusimbel', 'ishtar', 'babel', 'ur', 'persepolis', 'ark', 'tutankh', 'sargon', 'urcrown', 'goldplate', 'ewer', 'isfahanmosque']],
    north: [[], ['aurora', 'brendan'], ['skraeling', 'moose', 'inuit', 'polarbear'], ['niagara']],
    guinea: [[], ['djenne', 'ifehead', 't_ivory'], ['startower', 'mandrill'], ['mokele']],
    cape: [[], ['penguin', 'khoikhoi'], ['welwitschia', 'ostrich'], ['albatross']],
    eafrica: [[], ['t_ambergris', 'hippo', 'flamingo'], ['warthog', 'porcupine', 'zimbabwe', 't_rhino', 't_tortoise'], ['crocodile', 'roc', 'coelacanth', 'prester']],
    india: [['t_pepper', 't_clove', 't_ginger', 't_cinnamon'], ['t_chintz', 'madurai', 'tiger', 'mangrove'], ['shiva', 'qutb', 'mohenjo', 'delhimosque', 'kohinoor'], ['tajmahal']],
    inner: [[], ['t_musk', 't_jade'], ['sable'], ['potala', 'yeti', 'genghis']],
    malacca: [['t_sandal', 't_rice'], ['shwedagon', 'ayubuddha', 'goldelephant', 'padaung'], ['ananda', 'cannibal', 'rafflesia', 'orangutan', 'carnivplant'], ['angkor', 'borobudur']],
    spice: [['t_nutmeg'], ['breadfruit'], ['komodo'], ['paradise']],
    china: [['t_silkraw', 't_herbs'], ['t_tea', 'greatwall', 'cloisonne', 'jongmyo', 'emille', 'hwangnyong'], ['huangshan', 'yungang', 'qianling', 'muryeong', 'bulguksa', 'seokguram', 'munmu', 'bronze', 'sillacrown', 'baekjecenser', 'guanyublade', 'libai', 'nestorian', 'seismo'], ['qinshi', 'jadesuit', 'panda', 'hanseal', 'cheonmado']],
    japan: [[], ['goldseal'], ['glassbowl', 'konjiki'], ['fertile']],
    austral: [[], ['kangaroo'], ['aborigine'], ['uluru']],
    west: [[], ['t_tobacco', 't_allspice'], ['tarantula', 'eldorado'], ['blemmyes']],
    mexico: [['t_cacao', 't_maize'], ['tula', 'jademask'], ['crystalskull', 'prairiedog', 'pueblo'], ['canyon', 'monument', 'cibola', 'sequoia']],
    brazil: [[], ['rubber', 'lotus'], ['iguazu'], []],
    magellan: [['patagon'], [], ['endstrait'], ['antarctic', 'antpeople']],
    peru: [['t_potato'], ['llama', 'nazca'], ['sacsay', 'tiwanaku'], ['machupicchu']],
    pacific: [[], ['frigatebird', 'tortoise'], ['moai', 'northstrait'], ['mu']]
  };
  // 도자기·보석·세계 국보·예술품 보물 (2026-10-02)
  [
    ['china', 2, ['goryeoceladon', 'tangsancai', 'qinghua', 'moonjar', 'qingming', 'tripitaka', 'hunmin']],
    ['china', 3, ['ruware', 'lanting']],
    ['europe', 1, ['iznikware', 'lustreware', 'blackprince', 'ironcrown', 'wenceslas', 'laocoon', 'birthvenus', 'david', 'ghentaltar', 'durer', 'earthlydelights', 'urbinovenus', 'babeltower', 'orgaz', 'ambassadors', 'saliera', 'belemmonstrance']],
    ['europe', 2, ['paladoro', 'venusmilo', 'nike', 'monalisa', 'creation', 'lastsupper', 'pirireis']],
    ['japan', 2, ['aritaware', 'rakubowl', 'tsukumonasu', 'nanbanscreen']],
    ['inner', 2, ['timurruby']],
    ['india', 2, ['lankasapphire', 'ajanta', 'baburnama']],
    ['india', 3, ['peacockthrone']],
    ['malacca', 2, ['mogokruby']],
    ['west', 2, ['muzoemerald', 'peregrina']],
    ['levant', 2, ['shahnameh']],
    ['levant', 3, ['nefertiti', 'hammurabi']],
    ['guinea', 2, ['benin']],
    ['mexico', 2, ['moctezuma', 'sunstone', 'mayacodex']],
    ['peru', 2, ['incadisc']]
  ].forEach(function (a) { MAP[a[0]][a[1]] = MAP[a[0]][a[1]].concat(a[2]); });
  // 건물 불가사의 (js/data/wonders.js — 1700년까지 세워진 것만)
  if (G.WONDERS) Object.keys(G.WONDERS.front).forEach(function (fk) {
    if (!MAP[fk]) MAP[fk] = [[], [], [], []];
    G.WONDERS.front[fk].forEach(function (ids, t) { ids.forEach(function (id) { MAP[fk][t].push(id); }); });
  });
  G.FRONTIER = {};
  G.DISC_FRONT = {};            // 발견물 번호 → { f: 단계, t: 0 맛보기 | 'G' 관문 | 1 | 2 | 3 }
  G.FRONTIERS.forEach(function (f, i) {
    f.idx = i; G.FRONTIER[f.id] = f; f.ids = [];
    (MAP[f.id] || []).forEach(function (ids, tier) {
      ids.forEach(function (id) { if (G.DISC && G.DISC[id]) { G.DISC_FRONT[id] = { f: f.id, t: tier }; f.ids.push(id); } });
    });
    if (f.gate) { G.DISC_FRONT[f.gate] = { f: f.id, t: 'G' }; f.ids.push(f.gate); }
    f.n = f.ids.length;
    f.tease = (MAP[f.id] && MAP[f.id][0]) || [];
  });
  // 발견의 연쇄: 앞의 것을 내가 찾아야 뒤의 것의 단서가 열린다 (예: 모아이 → 트로아노 고사본 → 무 제국)
  // 찾는 순간 그 자리에서 뒤의 것의 실마리를 얻는다
  G.DISC_CHAIN = {
    agamemnon: ['mycenae'], minotaur: ['knossos'], rosetta: ['papyrus'], tutankh: ['kings'], babel: ['ishtar'],
    urcrown: ['ur'], goldplate: ['persepolis'], antpeople: ['antarctic'], mu: ['moai'], cibola: ['pueblo'],
    machupicchu: ['sacsay'], uluru: ['aborigine'], jadesuit: ['qianling'], konjiki: ['goldseal'], cheonmado: ['sillacrown']
  };
  // 꼬리에 꼬리를 무는 발견(js/data/chaindisc.js): 발견에 적힌 need를 합치고, 무 제국처럼 앞 고리가 바뀐 것은 덮어쓴다
  (G.DISCOVERIES || []).forEach(function (d) { if (d.need && !G.DISC_CHAIN[d.id]) G.DISC_CHAIN[d.id] = d.need.slice(); });
  if (G.CHAIN_OVERRIDE) for (var oid in G.CHAIN_OVERRIDE) G.DISC_CHAIN[oid] = G.CHAIN_OVERRIDE[oid].slice();
  for (var cid in G.DISC_CHAIN) if (G.DISC && G.DISC[cid]) G.DISC[cid].need = G.DISC_CHAIN[cid];
  var CHAIN_LINE = {
    agamemnon: '무너진 무덤 구덩이 한쪽에서 황금빛이 비쳤다는 인부들의 이야기를 들었다.',
    minotaur: '궁전 지하 미궁 깊은 곳에서 짐승 울음 같은 소리가 들린다고 한다.',
    rosetta: '파피루스에 적힌 옛 글자를 풀 열쇠가 나일 하구의 돌에 새겨져 있다고 한다.',
    tutankh: '도굴꾼들도 놓친 소년왕의 무덤이 계곡 어딘가에 남아 있다고 한다.',
    babel: '바빌론 폐허 한가운데 하늘에 닿으려 했던 탑의 기단이 있다고 한다.',
    urcrown: '우르의 왕릉에서 황금 머리장식이 나왔다는 소문이 돈다.',
    goldplate: '페르세폴리스의 보물고에서 흘러나온 금은 접시가 있다고 한다.',
    antpeople: '얼음 대륙 가장자리에서 사람의 발자국을 보았다는 선원이 있다.',
    mu: '거인상의 받침에 새겨진 기호가 트로아노 고사본의 글자와 닮았다. 가라앉은 대륙의 기록일까?',
    cibola: '석조촌 사람들이 북쪽 황야에 황금 도시 일곱이 있다고 말한다.',
    machupicchu: '돌 요새의 석공들이 더 높은 산 위에 숨은 태양의 신전을 이야기한다.',
    uluru: '남방대륙 사람들이 대륙 한가운데의 붉은 거대한 바위를 신성하게 여긴다고 한다.',
    jadesuit: '당나라 여제의 능을 지키는 이가 옥으로 지은 옷을 입은 왕의 무덤을 이야기한다.',
    konjiki: '왜국의 금도장처럼 온통 금으로 덮인 절이 북쪽에 있다고 한다.',
    cheonmado: '금관이 나온 무덤 곁의 다른 무덤에서 하늘을 달리는 흰 말 그림이 나왔다고 한다.'
  };
  if (G.CHAIN_LINE_MORE) for (var lk in G.CHAIN_LINE_MORE) CHAIN_LINE[lk] = G.CHAIN_LINE_MORE[lk];
  G.chainLine = function (id) { return CHAIN_LINE[id] || (G.DISC && G.DISC[id] && G.DISC[id].chainLine) || ''; };

  // 큰 항로의 단서 (대항해시대 3처럼 앞선 발견이 알려진 뒤에야 들을 수 있다): 리스본·세비야의 술집 주인과 후원자에게서 듣는다.
  // after: 모두 알려져야(내가 찾았거나 경쟁자가 발표) 이야기가 돈다 · line: 들려주는 말 (그 뒤에 발견물의 단서 문장이 이어진다)
  G.LEAD_CITIES = [0, 7];
  // 도시마다 먼저 도는 길: 리스본은 동쪽 길(아프리카·인도), 세비야는 서쪽 길(서인도·신세계)
  G.LEAD_ROAD = { 0: 'east', 7: 'west' };
  G.GEO_LEADS = [
    { disc: 'capegood', road: 'east', after: [], line: '부두의 늙은 선원들이 입을 모아 말하더군.' },
    { disc: 'westroute', road: 'west', after: [], line: '피렌체 학자가 보냈다는 편지 이야기가 뱃사람들 사이에 돌고 있네.' },
    { disc: 'indiaroute', road: 'east', after: ['capegood'], line: '아프리카 남단을 돌아 나온 배가 있다지? 그 뒤로 부두에서는 이 이야기뿐일세. 무어 상인들 말로는 그 바다에는 반년마다 방향이 뒤바뀌는 바람이 분다더군 — 여름(5~9월)에는 동아프리카에서 인도로, 겨울에는 인도에서 돌아오는 바람이라지.' },
    { disc: 'malacca', road: 'east', after: ['indiaroute'], line: '인도에서 돌아온 선원들이 무어 상인에게 들었다며 떠들더군.' },
    { disc: 'spiceis', road: 'east', after: ['malacca'], line: '말라카까지 다녀온 사람이 정향 한 줌을 보여 주며 말하더군.' },
    { disc: 'china', road: 'east', after: ['spiceis'], line: '향료제도의 상인들이 북쪽 큰 나라의 비단과 자기를 자랑하더라는 이야기가 들어왔네.' },
    { disc: 'zipang', road: 'east', after: ['china'], line: '중국 바다를 다녀온 뱃사람이 황금의 섬 이야기를 하더군.' },
    { disc: 'australia', road: 'east', after: ['spiceis'], line: '향료제도 남쪽 바다에서 끝없는 해안을 보았다는 뱃사람이 있네.' },
    { disc: 'newstrait', road: 'west', after: ['westroute'], line: '서쪽 바다 건너 땅이 남쪽으로 한없이 이어진다는군. 지도 제작자들은 그 끝 어딘가에 길이 있을 거라 하네.' },
    { disc: 'endstrait', road: 'west', after: ['newstrait'], line: '신세계 해협보다 더 남쪽으로 내려간 배가 있었다는 소문이 도네.' },
    { disc: 'antarctic', road: 'west', after: ['endstrait'], line: '땅끝 해협 남쪽의 얼음 바다 이야기를 들었나?' },
    { disc: 'northstrait', road: 'east', after: ['zipang'], line: '지팡그 북쪽 바다가 신대륙과 맞닿는지 아무도 모른다더군.' }
  ];

  // 무거운 층이 열리는 조건: 그 단계에서 찾은 발견 수(전체의 몇 %), 또는 단계가 열린 뒤 흐른 해
  G.TIER_NEED = { 2: { part: 0.2, min: 1, years: 12 }, 3: { part: 0.4, min: 2, years: 25 } };
  G.frontierNeed = function (f, t) { var k = G.TIER_NEED[t]; return Math.max(k.min, Math.round(f.n * k.part)); };

  function names(ids) { return ids.map(function (id) { return G.DISC[id] ? G.DISC[id].name : id; }); }
  G.frontierPreText = function (f) {
    if (f.pre) return names(f.pre).join('·');
    if (f.preAny) return names(f.preAny).join(' 또는 ');
    return '';
  };
  /** 도감·설명용: 이 발견물의 단서를 언제부터 들을 수 있는가 */
  G.frontierText = function (d) {
    var t = frontierTextBase(d);
    if (d.need && d.need.length) t += ' · 먼저 ' + names(d.need).map(function (n) { return '「' + n + '」'; }).join('·') + U_j(names(d.need).join('·'), '을/를') + ' 찾아야 한다';
    return t;
  };
  function frontierTextBase(d) {
    var m = G.DISC_FRONT[d.id];
    if (!m) return '처음부터 (특별한 조건)';
    var f = G.FRONTIER[m.f], pre = G.frontierPreText(f);
    var head = '〈' + f.name + '〉 ';
    if (m.t === 0) return head + '맛보기 — ' + (pre ? pre + U_j(pre) + ' 알려지면' : '처음부터') + ' 곧바로';
    if (m.t === 'G') {
      if (!f.light) return head + '관문 — ' + (pre ? pre + U_j(pre) + ' 알려지면 곧바로' : '처음부터');
      return head + '관문 — ' + (pre ? pre + U_j(pre) + ' 알려지고 ' : '') + '맛보기 발견 ' + f.light + '개를 찾으면 (또는 역사 속 발표 4년 전부터)';
    }
    var open = f.gate ? G.DISC[f.gate].name + U_j(G.DISC[f.gate].name) + ' 알려진 뒤' : (pre ? pre + U_j(pre) + ' 알려진 뒤' : '처음부터');
    if (m.t === 1) return head + '가벼움 — ' + open;
    var k = G.TIER_NEED[m.t];
    return head + (m.t === 2 ? '무거움' : '가장 무거움') + ' — ' + open + ', 이 단계에서 발견 ' + G.frontierNeed(f, m.t) + '곳 (또는 열린 지 ' + k.years + '년)';
  };
  function U_j(w, pair) { pair = pair || '이/가'; return G.U && G.U.jx ? G.U.jx(w, pair) : '(' + pair + ')'; }
})(window.G = window.G || {});
