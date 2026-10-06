/* Procedural chiaroscuro profile portraits. */
(function (G) {
  'use strict';
  var A = G.Art, U = G.U;
  var cache = {};

  var SKINS = { eu: '#d9a888', med: '#c89272', arab: '#b07a58', af: '#6e4632', in: '#9a6a4a', asia: '#d2a882', am: '#a8704c' };
  var STYLE_CULTURE = { is: 'arab', pe: 'arab', af: 'af', sw: 'af', tr: 'af', 'in': 'in', se: 'asia', cn: 'asia', kr: 'asia', jp: 'asia', st: 'asia', az: 'am', an: 'am', na: 'am' };
  var NPC_STYLES = ['ib', 'ne', 'it', 'gr', 'ru', 'is', 'pe', 'af', 'sw', 'in', 'se', 'cn', 'kr', 'jp', 'az', 'an', 'co', 'tr', 'st', 'na'];
  var NPC_ROLES = ['king', 'priest', 'noble', 'official', 'merchant', 'scholar', 'keeper', 'sailor', 'soldier', 'maid', 'native', 'captain'];
  var CLOTH = ['#7a2a22', '#2a3a5a', '#3a4a2a', '#5a3a5a', '#2a2a2a', '#6a4a2a', '#1e3552', '#5a1e1e', '#3d5a5a', '#4a3a2a'];
  var HAIR = ['#1e140e', '#3a2616', '#5a3a1e', '#2a1a10', '#7a5a3a', '#888078', '#c8c0b0'];
  A.NPC_STYLES = NPC_STYLES.slice();
  A.NPC_ROLES = NPC_ROLES.slice();
  A.rolePortraitKey = function (spec) {
    return spec && spec.style && spec.role ? 'portraits/npc-roles/' + spec.style + '/' + spec.role : null;
  };
  A.rolePortraitGender = function (role, style) {
    var women = style === 'kr'
      ? ['king', 'noble', 'official', 'merchant', 'scholar', 'keeper', 'maid', 'native']
      : style === 'cn'
        ? ['noble', 'official', 'scholar', 'keeper', 'maid', 'native']
        : ['noble', 'official', 'merchant', 'scholar', 'keeper', 'maid'];
    return women.indexOf(role) >= 0 ? 'f' : 'm';
  };

  /* 성별을 따로 정하지 않은 군중은 씨앗으로 고른다. 조선은 요청한 화려한 군상에 맞춰
     여성 비율을 특히 높이고, 다른 문화권도 상인·여관 주인·학자 등에 여성이 넉넉히 나온다. */
  A.npcGender = function (seed, role, style) {
    if (role === 'pope' || role === 'gov') return 'm';
    return A.rolePortraitGender(role, style);
  };

  /** build a spec from simple hints: {seed, g:'m'|'f', age:'young'|'mid'|'old', culture, role, hat, beard, cloth} */
  A.portraitSpec = function (h) {
    var rng = U.makeRng(U.strHash(String(h.seed || 'x')));
    var cul = h.culture || 'eu';
    var g = h.g || 'm';
    var sp = {
      g: g, skin: h.skin || A.jitter(SKINS[cul] || SKINS.eu, rng, 18), hair: h.hair || HAIR[Math.floor(rng() * (h.age === 'old' ? 7 : 5))],
      cloth: h.cloth || CLOTH[Math.floor(rng() * CLOTH.length)], nose: rng(), chin: rng(), brow: rng(), hairStyle: Math.floor(rng() * 4),
      beard: g === 'm' ? (h.beard != null ? h.beard : Math.floor(rng() * 4)) : 0, hat: h.hat || 'none', age: h.age || 'mid', gold: !!h.gold,
      bg: h.bg || A.jitter('#3a2a1c', rng, 20), facing: h.facing || 1, ruff: !!h.ruff, armor: !!h.armor, veil: h.veil || null, seed: h.seed,
      style: h.style || 'ib', role: h.role || '', dress: h.dress || '', trim: h.trim || null, pattern: h.pattern || '', jewelry: h.jewelry || '',
      badge: h.badge || '', facePaint: h.facePaint || '', braids: h.braids || 0,
      glam: h.glam == null ? (g === 'f' ? 1 : 0) : h.glam, expression: h.expression || 'neutral', roundFace: !!h.roundFace,
      moustache: !!h.moustache, lip: h.lip || (g === 'f' ? '#a94f5d' : '#70483f'), ornament: h.ornament || '', accessory: h.accessory || ''
    };
    if (h.age === 'old') { sp.hair = rng() < 0.6 ? '#c8c0b0' : '#8a8278'; }
    return sp;
  };

  /* 도시 양식마다 옷깃·직물·관모까지 달라지게 한다. 얼굴색만 바꾸는 식으로는
     조선·명·일본이나 메소아메리카·북미가 한 문화처럼 보여서, 역할별 복식을 여기서 갈라 놓는다. */
  function culturalDress(h, style, role, rng) {
    h.style = style; h.role = role;
    if (style === 'kr') {
      h.dress = 'hanbok'; h.trim = '#f2eee2'; h.glam = h.g === 'f' ? 1.35 : .72; h.ornament = h.g === 'f' ? 'daenggi' : '';
      h.beard = h.g === 'm' ? (role === 'soldier' ? 1 : rng() < .24 ? 1 : 0) : 0; h.moustache = h.g === 'm' && (h.beard > 0 || rng() < .18);
      if (role === 'king') { h.hat = h.g === 'f' ? 'hwagwan' : 'ikseongwan'; h.cloth = '#9e2524'; h.badge = 'dragon'; }
      else if (role === 'soldier') { h.hat = 'joseonHelmet'; h.cloth = '#8f3026'; h.armor = true; }
      else if (role === 'noble' || role === 'gov' || role === 'official') { h.hat = h.g === 'f' ? 'hwagwan' : 'samo'; h.cloth = h.g === 'f' ? '#b94761' : '#7d2428'; h.badge = 'crane'; }
      else if (role === 'scholar' || role === 'merchant') { h.hat = h.g === 'f' ? 'gache' : 'gat'; h.cloth = role === 'scholar' ? '#e6e0d1' : '#5f7990'; }
      else if (role === 'priest') { h.hat = 'monk'; h.cloth = '#b87835'; }
      else if (h.g === 'f') { h.hat = 'jokduri'; h.cloth = ['#bd4157', '#e7b54b', '#4e8091'][Math.floor(rng() * 3)]; h.trim = '#f4eee2'; }
      else { h.hat = role === 'sailor' ? 'headband' : 'gat'; h.cloth = ['#e4ded0', '#7890a0', '#9f6d48'][Math.floor(rng() * 3)]; }
    } else if (style === 'cn') {
      h.dress = 'hanfu'; h.trim = '#d7bd68';
      if (role === 'king' || role === 'noble' || role === 'gov' || role === 'official') { h.hat = 'mingOfficial'; h.cloth = role === 'king' ? '#d0a42c' : '#8b2d30'; h.badge = role === 'king' ? 'dragon' : 'crane'; }
      else if (role === 'soldier') { h.hat = 'mingHelmet'; h.cloth = '#6b3b2e'; h.armor = true; }
      else if (role === 'merchant') { h.dress = 'changshan'; h.hat = h.g === 'f' ? 'hairpin' : 'merchantCap'; h.cloth = '#31546b'; h.trim = '#d8b85c'; h.gold = true; h.roundFace = true; h.expression = 'warm'; h.moustache = h.g === 'm'; h.beard = h.g === 'm' ? 1 : 0; h.accessory = 'coinCord'; }
      else if (h.g === 'f') { h.hat = 'hairpin'; h.cloth = '#5d8a85'; }
      else { h.hat = role === 'scholar' ? 'mingCap' : 'headwrap'; h.cloth = '#31546b'; }
    } else if (style === 'jp') {
      h.dress = 'kosode'; h.trim = '#e5d8ba';
      if (h.g === 'f') h.glam = 1.05;
      else if (/^(soldier|captain|noble|official|gov)$/.test(role)) h.expression = 'guarded';
      if (role === 'soldier') { h.hat = 'kabuto'; h.cloth = '#55302b'; h.armor = true; }
      else if (role === 'king' || role === 'noble' || role === 'gov' || role === 'official') h.hat = 'eboshi';
      else if (role === 'priest') { h.hat = 'monk'; h.cloth = '#8b6132'; }
      else if (h.g === 'f') { h.hat = 'hairpin'; h.cloth = '#8a405b'; }
      else h.hat = role === 'sailor' ? 'headband' : 'eboshi';
    } else if (style === 'az') {
      var azWarrior = role === 'soldier' || role === 'native';
      h.dress = role === 'maid' || h.g === 'f' ? 'huipil' : azWarrior ? 'jaguar' : 'tilmatli'; h.pattern = azWarrior ? 'jaguar' : 'meso'; h.jewelry = 'jade'; h.beard = 0; h.armor = false;
      if (role === 'king') h.hat = 'quetzal';
      else if (role === 'soldier' || role === 'native') { h.hat = 'jaguar'; h.cloth = '#b78635'; h.facePaint = 'aztec'; }
      else h.hat = 'featherBand';
    } else if (style === 'na') {
      h.dress = 'buckskin'; h.trim = '#d9b665'; h.jewelry = 'wampum'; h.beard = 0; h.armor = false; h.braids = h.g === 'f' ? 2 : 1;
      if (role === 'king') h.hat = 'warbonnet';
      else if (role === 'soldier') { h.hat = 'roach'; h.facePaint = 'warrior'; }
      else { h.hat = 'wampum'; if (h.g === 'f') { h.age = 'young'; h.cloth = '#9a6745'; } }
    } else if (style === 'an') {
      h.dress = 'unku'; h.pattern = 'andean'; h.jewelry = 'gold'; h.beard = 0; h.armor = false; h.hat = role === 'king' ? 'mascapaicha' : 'llautu'; h.cloth = '#8b3030';
    } else if (style === 'in') {
      h.dress = h.g === 'f' ? 'sari' : 'angarkha'; h.trim = '#d8ae55'; h.jewelry = h.g === 'f' ? 'gold' : '';
      h.hat = h.g === 'f' ? 'veil' : 'rajputTurban'; h.cloth = h.g === 'f' ? '#9a3653' : '#d3b06e';
    } else if (style === 'se') {
      h.dress = 'sarong'; h.pattern = 'seasia'; h.hat = role === 'king' ? 'seCrown' : h.g === 'f' ? 'hairpin' : 'headwrap'; h.jewelry = 'gold';
    } else if (style === 'st') {
      h.dress = 'deel'; h.trim = '#d4a84d'; h.hat = role === 'soldier' ? 'steppeHelmet' : 'furcap';
    } else if (style === 'ru') {
      h.dress = 'kaftan'; h.trim = '#d1aa52'; h.hat = role === 'soldier' ? 'helmetA' : 'furcap';
    } else if (style === 'af' || style === 'tr') {
      h.dress = 'woven'; h.pattern = 'africa'; h.jewelry = 'beads'; h.armor = false; h.hat = h.g === 'f' ? 'headwrap' : role === 'king' ? 'beadCrown' : 'none';
    } else if (style === 'sw') {
      h.dress = 'kanga'; h.pattern = 'swahili'; h.hat = h.g === 'f' ? 'hijab' : 'kufi'; h.jewelry = 'beads'; h.armor = false;
    } else if (style === 'pe') {
      h.dress = 'kaftan'; h.pattern = 'persian'; h.trim = '#d3b465'; if (h.hat === 'turban') h.hat = 'persianTurban';
    } else if (style === 'is') {
      h.dress = 'kaftan'; h.trim = '#d3b465'; h.pattern = 'ottoman';
      if (role === 'soldier') { h.hat = 'helmetA'; h.armor = true; }
      else if (h.g === 'f') h.hat = 'hijab';
      else h.hat = role === 'keeper' || role === 'sailor' ? 'kufi' : 'turban';
    } else if (style === 'ib' || style === 'co') {
      h.dress = style === 'co' ? 'colonial' : 'doublet'; h.trim = '#d9c28a';
      if (role === 'soldier') { h.hat = 'morion'; h.armor = true; }
      else if (h.g === 'f') h.hat = rng() < .5 ? 'kerchief' : 'none';
      else if (role !== 'king') h.hat = role === 'sailor' || role === 'captain' ? 'cap' : 'beret';
    } else if (style === 'ne') {
      h.dress = 'doublet'; h.trim = '#ddd3bd'; h.ruff = /^(king|noble|official|merchant)$/.test(role);
      if (role === 'soldier') { h.hat = 'morion'; h.armor = true; }
      else if (h.g === 'f') h.hat = rng() < .45 ? 'kerchief' : 'none';
    } else if (style === 'it') {
      h.dress = 'giornea'; h.trim = '#d7b85d'; h.ruff = /^(king|noble|official)$/.test(role);
      if (role === 'soldier') { h.hat = 'morion'; h.armor = true; }
      else if (h.g === 'f') h.hat = 'hairpin';
      else if (role !== 'king' && role !== 'priest') h.hat = 'beret';
    } else if (style === 'gr') {
      h.dress = 'balkan'; h.trim = '#d9b45a'; h.pattern = 'balkan';
      if (role === 'soldier') { h.hat = 'helmetA'; h.armor = true; }
      else if (h.g === 'f') h.hat = 'kerchief';
      else h.hat = 'kalpak';
    }
  }

  /** role/culture presets */
  A.npcSpec = function (seed, role, style, gender) {
    var cul = STYLE_CULTURE[style] || (style === 'gr' || style === 'it' || style === 'ib' || style === 'co' ? 'med' : 'eu');
    var h = { seed: seed, culture: cul, style: style, role: role, g: gender || A.npcGender(seed, role, style) };
    var rng = U.makeRng(U.strHash(seed + role));
    var isl = cul === 'arab' || (style === 'in' && rng() < 0.5) || style === 'sw';
    switch (role) {
      case 'king': h.hat = cul === 'arab' ? 'turban' : cul === 'asia' ? (style === 'jp' ? 'eboshi' : 'gauze') : cul === 'am' ? 'feather' : 'crown'; h.gold = true; h.age = 'mid'; h.cloth = '#6a1e1e'; h.ruff = cul === 'eu' || cul === 'med'; break;
      case 'pope': h.hat = 'mitre'; h.gold = true; h.age = 'old'; h.cloth = '#e8e0d0'; h.beard = 0; break;
      case 'priest': h.hat = cul === 'arab' ? 'turban' : cul === 'asia' ? 'none' : 'hood'; h.age = rng() < 0.5 ? 'old' : 'mid'; h.cloth = cul === 'asia' ? '#b8742a' : '#2a2420'; h.beard = cul === 'asia' ? 0 : h.beard; break;
      case 'noble': case 'gov': case 'official': h.hat = cul === 'arab' ? 'turban' : cul === 'asia' ? 'gauze' : 'beret'; h.gold = true; h.ruff = cul === 'eu' || cul === 'med'; h.age = rng() < 0.4 ? 'old' : 'mid'; break;
      case 'merchant': h.hat = isl ? 'turban' : cul === 'asia' ? 'gauze' : 'beret'; h.gold = rng() < 0.5; h.age = 'mid'; break;
      case 'scholar': h.hat = isl ? 'turban' : cul === 'asia' ? 'gauze' : rng() < 0.5 ? 'beret' : 'none'; h.age = 'old'; h.cloth = '#2a2a3a'; break;
      case 'keeper': h.hat = isl ? 'kufi' : cul === 'asia' ? 'none' : rng() < 0.5 ? 'cap' : 'none'; h.age = rng() < 0.5 ? 'mid' : 'old'; h.cloth = '#5a3a24'; break;
      case 'sailor': h.hat = isl ? 'turban' : rng() < 0.6 ? 'cap' : 'none'; h.age = rng() < 0.6 ? 'young' : 'mid'; break;
      case 'captain': h.hat = isl ? 'turban' : cul === 'asia' ? 'gauze' : 'beret'; h.gold = true; h.age = 'mid'; h.cloth = '#28435a'; break;
      case 'soldier': h.hat = cul === 'asia' ? 'helmetA' : 'morion'; h.armor = true; h.age = 'mid'; break;
      case 'maid': h.g = 'f'; h.hat = isl ? 'hijab' : rng() < 0.4 ? 'kerchief' : 'none'; h.age = 'young'; h.cloth = A.jitter(['#7a2a3a', '#2a4a5a', '#5a3a1e', '#3a5a3a'][Math.floor(rng() * 4)], rng, 20); break;
      case 'native': h.hat = cul === 'am' ? 'feather' : cul === 'af' ? 'none' : 'band'; h.age = 'mid'; h.cloth = '#8a5a2a'; break;
      default: break;
    }
    culturalDress(h, style, role, rng);
    if (h.g === 'f') h.beard = 0;
    return A.portraitSpec(h);
  };

  /** 육상에서 만나는 주민의 넓은 문화권. 북미는 여성·추장·전사가 번갈아 나온다. */
  A.nativeStyle = function (lon, lat) {
    if (lon < -30) return lat >= 30 ? 'na' : lat >= -5 ? 'az' : 'an';
    if (lon >= 105) return lat >= 22 ? 'cn' : 'se';
    if (lon >= 62) return 'in';
    if (lon >= 30) return lat >= 25 ? 'is' : 'sw';
    return lat >= 18 ? 'is' : lat >= -5 ? 'af' : 'tr';
  };
  A.nativeSpec = function (seed, lon, lat) {
    var style = A.nativeStyle(lon, lat), rng = U.makeRng(U.strHash(seed + ':' + style)), role = 'native', g = 'm', name = '현지 주민';
    if (style === 'na') {
      var n = rng();
      if (n < 0.34) { g = 'f'; name = '북미 원주민 여성'; }
      else if (n < 0.67) { role = 'king'; name = '북미 원주민 추장'; }
      else { role = 'soldier'; name = '북미 원주민 전사'; }
    } else if (style === 'az') { role = rng() < 0.7 ? 'soldier' : 'native'; name = role === 'soldier' ? '재규어 전사' : '메소아메리카 주민'; }
    else if (style === 'an') name = '안데스 주민';
    var spec = A.npcSpec(seed, role, style, g); spec.localName = name; return spec;
  };

  /** 해전·신호 대화에서도 그 바다와 나라에 맞는 옷차림을 쓴다. */
  A.fleetStyle = function (zone, nation) {
    var byNation = { '명': 'cn', '조선': 'kr', '일본': 'jp', '오스만 제국': 'is', '맘루크 왕조': 'is', '구자라트 술탄국': 'in', '캘리컷 왕국': 'in', '말라카 술탄국': 'se', '아유타야 왕국': 'se', '반텐': 'se', '베네치아': 'it', '제노바': 'it', '잉글랜드': 'ne', '프랑스': 'ne', '포르투갈': 'ib', '카스티야': 'ib', '아라곤': 'ib' };
    return byNation[nation] || { east: 'jp', sea: 'se', ind: 'is', med: 'is', north: 'ne', amer: 'co', atl: 'ib' }[zone] || 'ib';
  };
  A.imageCulture = function (style) {
    return { is: 'islam', pe: 'islam', 'in': 'south', se: 'south', cn: 'eastasia', kr: 'eastasia', jp: 'eastasia', az: 'native', an: 'native', na: 'native', af: 'native', sw: 'native', tr: 'native' }[style] || 'europe';
  };

  // ---------------------------------------------------------------- named people
  var REGION_STYLE = ['ib', 'ne', 'it', 'af', 'is', 'in', 'cn', 'is', 'se', 'jp', 'az'];
  var mateSpecCache = {};
  A.mateSpec = function (id) {
    if (mateSpecCache[id]) return mateSpecCache[id];
    var d = G.MATE[id]; if (!d) return null;
    var sk = d.sk || {}, role = 'sailor';
    if (sk.theo >= 2) role = 'priest';
    else if (sk.sci >= 2 || sk.med >= 2 || sk.hist >= 2 || (sk.survey >= 3 && d.st[1] > 70)) role = 'scholar';
    else if (sk.sword >= 3 || sk.gun >= 2) role = 'soldier';
    else if (sk.acct >= 2) role = 'merchant';
    var style = d.style || REGION_STYLE[(d.reg || [])[0]] || 'ib';
    if (id === 'rocco') style = 'it';
    if (d.g === 'f') role = d.role || 'maid';
    var sp = A.npcSpec('mate_' + id, role, style, d.g);
    if (id === 'rocco') { sp.beard = 2; sp.hat = 'cap'; sp.age = 'mid'; }
    A.withImg(sp, G.Img.chain.mate(id).concat(d.face ? [d.face] : []));   // 철새·마녀는 이미 있는 얼굴을 빌린다
    return (mateSpecCache[id] = sp);
  };
  A.maidSpec = function (m) {
    var c = G.CITY_DATA[m.city];
    return A.withImg(A.npcSpec('maid_' + m.id, 'maid', G.Img.folkStyle(c), 'f'), G.Img.chain.maid(m.id, c));
  };
  /** sponsor portrait; holder = 0-based index into sp.holders (-1 → title only) */
  A.sponsorSpec = function (sp, holder) {
    var h = sp.holders[holder], name = h ? h[2] : sp.title;
    var role = sp.type === 'official' || sp.type === 'gov' ? 'noble' : sp.type;
    var c = G.CITY_DATA[sp.city];
    var female = (G.SPONSOR_FEMALE || /이사벨|엘리자베스|여왕|왕비|왕대비|공작부인|여제|수녀/).test(name);
    var spec = A.npcSpec('sp_' + sp.id + '_' + name, role, c.style, female ? 'f' : 'm');
    var chain = G.Img.chain.sponsor(sp, A.sponsorPic(sp, holder));
    // 자리 공통 그림(<ID>.webp)은 한 사람의 얼굴이다 — 성별이 다른 대(代)에는 쓰지 않는다 (잉글랜드 국왕 그림이 메리 1세·앤 여왕에게 붙지 않게)
    if (female !== A.sponsorBaseFemale(sp)) chain = chain.filter(function (k) { return k !== 'portraits/sponsors/' + sp.id; });
    // 그림이 없는 여왕·여제는 그 고장 귀부인 그림(npc-roles/<양식>/noble — 여성)으로
    if (female && A.rolePortraitGender('noble', c.style) === 'f') chain = chain.concat(['portraits/npc-roles/' + c.style + '/noble']);
    return A.withImg(spec, chain);
  };
  /** 그 대(代) 사람의 초상 그림 번호: holders의 네 번째 값(숫자·다른 후원자 그림 이름, 0 = 공통 그림), 없으면 순번 */
  A.sponsorPic = function (sp, holder) {
    var h = sp.holders[holder];
    if (!h) return 0;
    return h[3] != null ? h[3] : holder + 1;
  };
  /** 자리 공통 그림이 여성인가 — 그 자리의 사람이 모두 여성일 때 (포르투갈 왕비) */
  A.sponsorBaseFemale = function (sp) {
    var re = G.SPONSOR_FEMALE || /이사벨|엘리자베스|여왕|왕비|왕대비|공작부인|여제|수녀/;
    var named = sp.holders.filter(function (h) { return h[4] !== 'g'; });
    return named.length > 0 && named.every(function (h) { return re.test(h[2]); });
  };
  A.rivalSpec = function (name) { return A.withImg(A.npcSpec('rival_' + name, 'noble', 'ib'), G.Img.chain.rival(name)); };
  /** townsfolk who greet you in buildings: id → [portrait role, seed variant, gender] */
  A.TOWNFOLK = { trader: ['merchant', '', null], vendor: ['merchant', 'mk', null], harbormaster: ['official', '', null], innkeeper: ['keeper', 'inn', 'f'],
    tavernkeeper: ['keeper', 'tav', null], shipwright: ['keeper', 'yard', null], priest: ['priest', '', null], librarian: ['scholar', '', null], guildmaster: ['official', 'gd', null] };
  A.townSpec = function (id, c) {
    var t = A.TOWNFOLK[id] || ['merchant', id, 'm'];
    // 도시·문화권 전용 그림이 없더라도 npcSpec의 양식×역할 그림을 이어 쓴다.
    // 시장 상인·술집 주인·조선소 목수도 폴리곤 대용 얼굴로 돌아가지 않는다.
    return A.withImg(A.npcSpec('c' + c.id + ':' + t[0] + t[1], t[0], G.Img.folkStyle(c), t[2]), G.Img.chain.npc(id, c));
  };
  function headPath(ctx, s, cx, cy, R) {
    // profile facing right. R = head radius
    var n = s.nose, ch = s.chin, br = s.brow, f = s.g === 'f', soft = f || s.glam > .5, round = s.roundFace;
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.05, cy - R * 1.02);                                    // crown
    ctx.bezierCurveTo(cx + R * (soft ? .5 : .55), cy - R * 1.05, cx + R * (soft ? .78 : .82), cy - R * .7, cx + R * (0.82 + br * 0.04), cy - R * 0.32); // forehead
    ctx.quadraticCurveTo(cx + R * 0.9, cy - R * 0.2, cx + R * 0.86, cy - R * 0.14);           // brow ridge
    // nose
    var nl = soft ? 0.17 + n * .035 : 0.24 + n * 0.1, nd = n > 0.7 && !soft ? 0.06 : 0;
    ctx.quadraticCurveTo(cx + R * (0.9 + nl * 0.6), cy - R * (0.02 + nd), cx + R * (0.9 + nl), cy + R * 0.14);
    ctx.quadraticCurveTo(cx + R * (0.9 + nl * 0.5), cy + R * 0.2, cx + R * 0.88, cy + R * 0.22);
    // lips
    ctx.quadraticCurveTo(cx + R * 0.93, cy + R * 0.3, cx + R * 0.88, cy + R * 0.36);
    ctx.quadraticCurveTo(cx + R * 0.92, cy + R * 0.42, cx + R * 0.85, cy + R * 0.47);
    // chin
    var cf = (soft ? .75 : .78) + ch * (soft ? .05 : .1);
    ctx.quadraticCurveTo(cx + R * (cf + 0.06), cy + R * 0.62, cx + R * (cf - 0.08), cy + R * 0.72);
    ctx.quadraticCurveTo(cx + R * (round ? .34 : .45), cy + R * (round ? .92 : .82), cx + R * (round ? .12 : .25), cy + R * .66); // jaw
    ctx.lineTo(cx + R * 0.2, cy + R * 1.2);                                     // neck front
    ctx.lineTo(cx - R * 0.35, cy + R * 1.2);                                    // neck back
    ctx.bezierCurveTo(cx - R * 0.3, cy + R * 0.7, cx - R * 0.95, cy + R * 0.45, cx - R * 0.9, cy - R * 0.2); // back of head
    ctx.bezierCurveTo(cx - R * 0.85, cy - R * 0.8, cx - R * 0.5, cy - R * 1.0, cx - R * 0.05, cy - R * 1.02);
    ctx.closePath();
  }

  /** draw portrait into ctx at size sz */
  A.drawPortrait = function (ctx, sz, s) {
    var rng = U.makeRng(U.strHash(String(s.seed || 'p') + 'd'));
    ctx.save();
    // background
    var bg = ctx.createRadialGradient(sz * 0.35, sz * 0.3, sz * 0.05, sz * 0.5, sz * 0.5, sz * 0.8);
    bg.addColorStop(0, A.rgba(A.shade(s.bg, 1.9))); bg.addColorStop(0.55, A.rgba(s.bg)); bg.addColorStop(1, A.rgba(A.shade(s.bg, 0.35)));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, sz, sz);
    if (s.facing < 0) { ctx.translate(sz, 0); ctx.scale(-1, 1); }
    var cx = sz * 0.46, cy = sz * 0.42, R = sz * 0.2;
    // torso
    var cl = A.hex(s.cloth);
    var tg = ctx.createLinearGradient(sz * 0.1, 0, sz * 0.9, 0);
    tg.addColorStop(0, A.rgba(A.shade(cl, 0.45))); tg.addColorStop(0.6, A.rgba(A.shade(cl, 1.0))); tg.addColorStop(1, A.rgba(A.shade(cl, 1.25)));
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.moveTo(sz * 0.02, sz); ctx.bezierCurveTo(sz * 0.05, sz * 0.78, sz * 0.18, sz * 0.7, cx - R * 0.2, sz * 0.66);
    ctx.lineTo(cx + R * 0.45, sz * 0.66); ctx.bezierCurveTo(sz * 0.8, sz * 0.7, sz * 0.95, sz * 0.8, sz * 0.98, sz); ctx.closePath(); ctx.fill();
    if (s.armor) {
      if (/^(kr|cn|jp|st)$/.test(s.style)) {
        ctx.fillStyle = s.style === 'kr' ? '#6f2d2a' : s.style === 'jp' ? '#3d2928' : '#4a3b32'; ctx.beginPath(); ctx.ellipse(sz * 0.62, sz * 0.82, sz * 0.24, sz * 0.15, -0.25, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c69b45'; ctx.lineWidth = sz * 0.008; for (var ar = 0; ar < 4; ar++) { ctx.beginPath(); ctx.moveTo(sz * 0.43, sz * (0.76 + ar * 0.035)); ctx.lineTo(sz * 0.82, sz * (0.76 + ar * 0.035)); ctx.stroke(); }
      } else {
        ctx.fillStyle = 'rgba(190,195,205,.8)'; ctx.beginPath(); ctx.ellipse(sz * 0.62, sz * 0.8, sz * 0.22, sz * 0.12, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(sz * 0.66, sz * 0.76, sz * 0.12, sz * 0.04, -0.3, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (s.ruff) {
      ctx.fillStyle = '#efe8da';
      for (var r = 0; r < 9; r++) { ctx.beginPath(); ctx.arc(cx - R * 0.35 + r * R * 0.12, sz * 0.66 + Math.sin(r) * 2, R * 0.13, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(cx - R * 0.45, sz * 0.67, R * 1.2, R * 0.08);
    }
    if (s.gold) {
      ctx.strokeStyle = '#d9b45f'; ctx.lineWidth = sz * 0.012;
      ctx.beginPath(); ctx.moveTo(cx - R * 0.4, sz * 0.72); ctx.quadraticCurveTo(cx + R * 0.1, sz * 0.92, cx + R * 0.7, sz * 0.72); ctx.stroke();
      ctx.fillStyle = '#e8c56e'; ctx.beginPath(); ctx.arc(cx + R * 0.15, sz * 0.86, sz * 0.03, 0, Math.PI * 2); ctx.fill();
    }
    // 문화권별 옷깃과 직물. 작은 대화창에서도 실루엣과 무늬가 먼저 읽히게 크게 그린다.
    function line(x1, y1, x2, y2, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
    if (s.dress === 'hanbok') {
      line(cx - R * 0.22, sz * 0.67, cx + R * 0.18, sz * 0.86, s.trim || '#eee9dc', sz * 0.035);
      line(cx + R * 0.5, sz * 0.67, cx + R * 0.18, sz * 0.86, s.trim || '#eee9dc', sz * 0.035);
      line(cx + R * 0.12, sz * 0.84, cx + R * 0.68, sz * 0.91, '#d7b44b', sz * 0.018);
    } else if (s.dress === 'hanfu' || s.dress === 'kosode') {
      line(cx - R * 0.18, sz * 0.67, cx + R * 0.34, sz * 0.91, s.trim || '#dfd3ba', sz * 0.03);
      line(cx + R * 0.48, sz * 0.68, cx + R * 0.08, sz * 0.9, s.trim || '#dfd3ba', sz * 0.024);
      if (s.dress === 'kosode') { ctx.fillStyle = 'rgba(35,25,20,.55)'; ctx.fillRect(sz * 0.28, sz * 0.9, sz * 0.52, sz * 0.055); }
    } else if (s.dress === 'kaftan' || s.dress === 'deel' || s.dress === 'angarkha' || s.dress === 'changshan') {
      line(cx + R * 0.1, sz * 0.67, cx + R * 0.1, sz, s.trim || '#d5af5a', sz * 0.025);
      for (var bt = 0; bt < 4; bt++) { ctx.fillStyle = s.trim || '#d5af5a'; ctx.beginPath(); ctx.arc(cx + R * 0.1, sz * (0.72 + bt * 0.075), sz * 0.009, 0, Math.PI * 2); ctx.fill(); }
      if (s.dress === 'changshan') {
        line(cx - R * 0.25, sz * .68, cx + R * .12, sz * .78, s.trim || '#d5af5a', sz * .018);
        line(cx + R * .12, sz * .78, cx + R * .42, sz * .78, s.trim || '#d5af5a', sz * .018);
      }
    } else if (s.dress === 'doublet' || s.dress === 'giornea' || s.dress === 'colonial' || s.dress === 'balkan') {
      var dc = s.trim || '#d7c18c';
      line(cx - R * .28, sz * .67, cx + R * .08, sz * .84, dc, sz * .028);
      line(cx + R * .48, sz * .67, cx + R * .08, sz * .84, dc, sz * .028);
      line(cx + R * .08, sz * .84, cx + R * .08, sz, dc, sz * .018);
      if (s.dress === 'giornea') {
        ctx.strokeStyle = '#d7b44b'; ctx.lineWidth = sz * .012;
        for (var gs = 0; gs < 4; gs++) { ctx.beginPath(); ctx.moveTo(sz * (.2 + gs * .14), sz * .78); ctx.lineTo(sz * (.25 + gs * .14), sz * .93); ctx.stroke(); }
      } else if (s.dress === 'balkan') {
        ctx.strokeStyle = '#e1b84b'; ctx.lineWidth = sz * .01;
        for (var bz = 0; bz < 4; bz++) { ctx.beginPath(); ctx.arc(cx + R * .08, sz * (.76 + bz * .06), sz * (.025 + bz * .006), 0, Math.PI); ctx.stroke(); }
      } else if (s.dress === 'colonial') {
        ctx.fillStyle = 'rgba(235,224,195,.26)'; ctx.fillRect(sz * .15, sz * .9, sz * .65, sz * .055);
      }
    } else if (s.dress === 'sari') {
      ctx.fillStyle = 'rgba(232,185,76,.72)'; ctx.beginPath(); ctx.moveTo(sz * 0.18, sz); ctx.lineTo(sz * 0.34, sz * 0.65); ctx.lineTo(sz * 0.7, sz); ctx.fill();
    } else if (s.dress === 'jaguar') {
      ctx.fillStyle = 'rgba(212,169,67,.72)'; ctx.fillRect(sz * 0.12, sz * 0.68, sz * 0.68, sz * 0.32);
      ctx.fillStyle = 'rgba(48,27,15,.8)'; for (var js = 0; js < 18; js++) { var jx = sz * (0.15 + rng() * 0.62), jy = sz * (0.7 + rng() * 0.28); ctx.beginPath(); ctx.arc(jx, jy, sz * (0.008 + rng() * 0.009), 0, Math.PI * 2); ctx.fill(); }
    } else if (s.dress === 'huipil' || s.dress === 'tilmatli' || s.dress === 'unku' || s.dress === 'sarong' || s.dress === 'woven' || s.dress === 'kanga') {
      var pc = s.pattern === 'andean' ? '#edc24e' : s.pattern === 'africa' ? '#e0aa35' : '#d9c36a';
      ctx.strokeStyle = pc; ctx.lineWidth = sz * 0.012;
      for (var py = 0; py < 3; py++) { var yy = sz * (0.75 + py * 0.075); ctx.beginPath(); for (var px2 = 0; px2 < 7; px2++) ctx.lineTo(sz * (0.18 + px2 * 0.1), yy + (px2 % 2 ? sz * 0.022 : 0)); ctx.stroke(); }
    } else if (s.dress === 'buckskin') {
      ctx.strokeStyle = '#d8b06a'; ctx.lineWidth = sz * 0.012;
      for (var fr = 0; fr < 11; fr++) { ctx.beginPath(); ctx.moveTo(sz * (0.17 + fr * 0.06), sz * 0.73); ctx.lineTo(sz * (0.17 + fr * 0.06), sz * (0.78 + (fr % 2) * 0.025)); ctx.stroke(); }
    }
    if (s.badge) {
      ctx.fillStyle = s.badge === 'dragon' ? '#d9b43f' : '#e5ddd0'; ctx.beginPath(); ctx.arc(cx + R * 0.2, sz * 0.83, sz * 0.065, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = s.badge === 'dragon' ? '#8f2a24' : '#33475a'; ctx.lineWidth = sz * 0.01; ctx.beginPath(); ctx.arc(cx + R * 0.2, sz * 0.83, sz * 0.035, 0, Math.PI * 1.6); ctx.stroke();
    }
    if (s.jewelry) {
      ctx.strokeStyle = s.jewelry === 'jade' ? '#4eb68f' : s.jewelry === 'gold' ? '#e0b94d' : '#5fb1b9'; ctx.lineWidth = sz * 0.014;
      ctx.beginPath(); ctx.arc(cx + R * 0.08, sz * 0.69, R * 0.55, 0.15, 2.9); ctx.stroke();
    }
    if (s.accessory === 'coinCord') {
      ctx.strokeStyle = '#b63e34'; ctx.lineWidth = sz * .012; ctx.beginPath(); ctx.arc(sz * .7, sz * .85, sz * .095, -.4, 2.5); ctx.stroke();
      ctx.fillStyle = '#d5ad42'; for (var ac = 0; ac < 3; ac++) { ctx.beginPath(); ctx.arc(sz * (.665 + ac * .035), sz * (.88 + Math.abs(ac - 1) * .015), sz * .014, 0, 7); ctx.fill(); }
    }
    // back hair (long hair for women / veil)
    var hair = A.hex(s.hair);
    if (s.g === 'f' && /^(none|jokduri|hwagwan|gache|hairpin|wampum|featherBand|headband)$/.test(s.hat)) {
      ctx.fillStyle = A.rgba(A.shade(hair, 0.9));
      ctx.beginPath(); ctx.moveTo(cx - R * 0.2, cy - R * 1.05); ctx.bezierCurveTo(cx - R * 1.3, cy - R * 0.8, cx - R * 1.2, cy + R * 1.4, cx - R * 0.6, sz * 0.8); ctx.lineTo(cx + R * 0.1, sz * 0.7); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
    }
    // head
    var sk = A.hex(s.skin);
    var hg = ctx.createLinearGradient(cx - R, cy - R, cx + R * 1.1, cy + R * 0.5);
    hg.addColorStop(0, A.rgba(A.shade(sk, 0.45))); hg.addColorStop(0.55, A.rgba(A.shade(sk, 0.85))); hg.addColorStop(1, A.rgba(A.shade(sk, 1.18)));
    ctx.fillStyle = hg; headPath(ctx, s, cx, cy, R); ctx.fill();
    // rim light on face edge
    ctx.save(); headPath(ctx, s, cx, cy, R); ctx.clip();
    ctx.strokeStyle = A.rgba(A.shade(sk, 1.45), 0.55); ctx.lineWidth = sz * 0.018; headPath(ctx, s, cx - sz * 0.006, cy, R); ctx.stroke();
    // cheek glow
    var cg = ctx.createRadialGradient(cx + R * 0.45, cy + R * 0.25, 1, cx + R * 0.45, cy + R * 0.25, R * 0.45);
    cg.addColorStop(0, 'rgba(220,105,115,' + (s.glam ? Math.min(.38, .2 + s.glam * .12) : .18) + ')'); cg.addColorStop(1, 'rgba(210,110,90,0)'); ctx.fillStyle = cg; ctx.fillRect(0, 0, sz, sz);
    if (s.glam) {
      ctx.strokeStyle = 'rgba(255,238,220,' + Math.min(.48, .2 + s.glam * .16) + ')'; ctx.lineWidth = sz * .009;
      ctx.beginPath(); ctx.moveTo(cx + R * .72, cy - R * .18); ctx.quadraticCurveTo(cx + R * .82, cy, cx + R * .86, cy + R * .12); ctx.stroke();
    }
    ctx.restore();
    // ear
    ctx.fillStyle = A.rgba(A.shade(sk, 0.75)); ctx.beginPath(); ctx.ellipse(cx - R * 0.1, cy + R * 0.02, R * 0.12, R * 0.2, 0.2, 0, Math.PI * 2); ctx.fill();
    // 눈·눈썹·입술. 여성은 또렷하고 단정한 미형, 경계하는 극중 인물은 가늘고 각진 표정으로 읽힌다.
    var guarded = s.expression === 'guarded', warm = s.expression === 'warm', eyeW = s.glam ? .105 : guarded ? .095 : .08, eyeH = s.glam ? .044 : guarded ? .022 : .035;
    ctx.fillStyle = 'rgba(25,15,10,.92)'; ctx.beginPath(); ctx.ellipse(cx + R * .66, cy - R * .08, R * eyeW, R * eyeH, guarded ? -.08 : .1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,' + (s.glam ? .72 : .35) + ')'; ctx.beginPath(); ctx.arc(cx + R * .69, cy - R * .1, R * (s.glam ? .025 : .015), 0, 7); ctx.fill();
    if (s.glam) {
      ctx.strokeStyle = 'rgba(35,20,18,.82)'; ctx.lineWidth = sz * .009; ctx.beginPath(); ctx.moveTo(cx + R * .56, cy - R * .085); ctx.quadraticCurveTo(cx + R * .69, cy - R * .14, cx + R * .8, cy - R * .075); ctx.stroke();
      ctx.lineWidth = sz * .006; for (var la = 0; la < 3; la++) { ctx.beginPath(); ctx.moveTo(cx + R * (.76 + la * .025), cy - R * (.09 - la * .006)); ctx.lineTo(cx + R * (.8 + la * .03), cy - R * (.14 - la * .004)); ctx.stroke(); }
    }
    ctx.strokeStyle = A.rgba(A.shade(hair, 0.8), 0.88); ctx.lineWidth = sz * (s.glam ? .009 : .012); ctx.beginPath();
    ctx.moveTo(cx + R * .54, cy - R * (guarded ? .18 : .2));
    ctx.quadraticCurveTo(cx + R * .69, cy - R * (guarded ? .31 : s.glam ? .29 : .27), cx + R * .84, cy - R * (guarded ? .25 : .2)); ctx.stroke();
    ctx.strokeStyle = A.rgba(A.hex(s.lip), s.glam ? .9 : .62); ctx.lineWidth = sz * (s.glam ? .012 : .007); ctx.beginPath();
    ctx.moveTo(cx + R * .78, cy + R * .34); ctx.quadraticCurveTo(cx + R * .88, cy + R * (guarded ? .3 : warm ? .37 : .35), cx + R * .9, cy + R * (guarded ? .34 : .37)); ctx.stroke();
    if (s.glam) { ctx.strokeStyle = 'rgba(255,220,218,.42)'; ctx.lineWidth = sz * .004; ctx.beginPath(); ctx.moveTo(cx + R * .81, cy + R * .33); ctx.lineTo(cx + R * .87, cy + R * .34); ctx.stroke(); }
    if (s.age === 'old') { ctx.strokeStyle = 'rgba(60,35,25,.35)'; ctx.lineWidth = sz * 0.006; ctx.beginPath(); ctx.moveTo(cx + R * 0.55, cy + R * 0.35); ctx.quadraticCurveTo(cx + R * 0.65, cy + R * 0.5, cx + R * 0.72, cy + R * 0.52); ctx.stroke(); }
    if (s.facePaint) {
      ctx.strokeStyle = s.facePaint === 'aztec' ? '#1f5d76' : '#a52d28'; ctx.lineWidth = sz * 0.012;
      ctx.beginPath(); ctx.moveTo(cx + R * 0.5, cy + R * 0.08); ctx.lineTo(cx + R * 0.82, cy + R * 0.14); ctx.moveTo(cx + R * 0.48, cy + R * 0.2); ctx.lineTo(cx + R * 0.78, cy + R * 0.26); ctx.stroke();
    }
    // hair (top)
    if (/^(none|cap|band|kufi|feather|jokduri|hwagwan|gache|hairpin|wampum|featherBand|headband|llautu|mascapaicha|roach|merchantCap|kalpak)$/.test(s.hat)) {
      ctx.fillStyle = A.rgba(hair);
      ctx.beginPath(); ctx.moveTo(cx + R * 0.72, cy - R * 0.58);
      ctx.bezierCurveTo(cx + R * 0.6, cy - R * 1.18, cx - R * 0.6, cy - R * 1.25, cx - R * 0.95, cy - R * 0.25);
      if (s.g === 'f') ctx.lineTo(cx - R * 0.9, cy + R * 0.9); else ctx.bezierCurveTo(cx - R * 0.9, cy + R * 0.2, cx - R * 0.6, cy + R * 0.35, cx - R * 0.4, cy + R * 0.3);
      ctx.bezierCurveTo(cx - R * 0.25, cy - R * 0.3, cx + R * 0.2, cy - R * 0.55, cx + R * 0.72, cy - R * 0.58); ctx.fill();
      if (s.hairStyle === 1) { for (var cc = 0; cc < 7; cc++) { ctx.beginPath(); ctx.arc(cx - R * 0.6 + cc * R * 0.2, cy - R * 0.95 + Math.abs(cc - 3) * R * 0.05, R * 0.14, 0, Math.PI * 2); ctx.fill(); } }
      ctx.fillStyle = 'rgba(255,230,190,.12)'; ctx.beginPath(); ctx.ellipse(cx + R * 0.1, cy - R * 0.9, R * 0.4, R * 0.1, -0.2, 0, Math.PI * 2); ctx.fill();
    }
    // beard
    if (s.beard > 0) {
      ctx.fillStyle = A.rgba(A.shade(hair, 0.95), s.beard === 1 ? 0.55 : 0.95);
      ctx.beginPath(); ctx.moveTo(cx + R * 0.05, cy + R * 0.15);
      ctx.bezierCurveTo(cx + R * 0.4, cy + R * 0.25, cx + R * 0.7, cy + R * 0.3, cx + R * 0.86, cy + R * 0.42);
      var bl = s.beard === 3 ? 1.25 : s.beard === 2 ? 0.95 : 0.78;
      ctx.bezierCurveTo(cx + R * 0.9, cy + R * (bl - 0.1), cx + R * 0.6, cy + R * bl, cx + R * 0.3, cy + R * (bl - 0.05));
      ctx.bezierCurveTo(cx + R * 0.05, cy + R * 0.8, cx - R * 0.05, cy + R * 0.4, cx + R * 0.05, cy + R * 0.15); ctx.fill();
      // mustache
      ctx.beginPath(); ctx.ellipse(cx + R * 0.8, cy + R * 0.28, R * 0.12, R * 0.04, 0.2, 0, Math.PI * 2); ctx.fill();
    }
    if (s.moustache && s.beard <= 0) {
      ctx.fillStyle = A.rgba(A.shade(hair, .86), .9); ctx.beginPath();
      ctx.ellipse(cx + R * .76, cy + R * .285, R * .11, R * .035, .16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + R * .82, cy + R * .29); ctx.quadraticCurveTo(cx + R * .9, cy + R * .32, cx + R * .91, cy + R * .37); ctx.strokeStyle = A.rgba(A.shade(hair, .82), .85); ctx.lineWidth = sz * .009; ctx.stroke();
    }
    if (s.braids) {
      ctx.strokeStyle = A.rgba(A.shade(hair, 0.72)); ctx.lineWidth = sz * 0.035; ctx.lineCap = 'round';
      for (var bd = 0; bd < s.braids; bd++) { ctx.beginPath(); ctx.moveTo(cx - R * (0.35 + bd * 0.28), cy + R * 0.18); ctx.quadraticCurveTo(cx - R * (0.48 + bd * 0.24), cy + R * 0.8, cx - R * (0.2 + bd * 0.35), sz * 0.8); ctx.stroke(); }
      ctx.lineCap = 'butt';
    }
    // headwear
    function hatFill(c) { var g = ctx.createLinearGradient(cx - R, 0, cx + R, 0); g.addColorStop(0, A.rgba(A.shade(c, 0.5))); g.addColorStop(1, A.rgba(A.shade(c, 1.15))); ctx.fillStyle = g; }
    switch (s.hat) {
      case 'beret': hatFill('#2a1e18'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.92, R * 1.0, R * 0.34, -0.12, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(cx - R * 0.55, cy - R * 0.95, R * 1.1, R * 0.2); break;
      case 'cap': hatFill('#6a3a22'); ctx.beginPath(); ctx.ellipse(cx - R * 0.1, cy - R * 0.85, R * 0.85, R * 0.4, -0.2, Math.PI, 0); ctx.fill(); break;
      case 'hood': hatFill('#3a2e24'); ctx.beginPath(); ctx.moveTo(cx + R * 0.7, cy - R * 0.6); ctx.bezierCurveTo(cx + R * 0.5, cy - R * 1.5, cx - R * 1.4, cy - R * 1.2, cx - R * 1.1, sz * 0.72); ctx.lineTo(cx + R * 0.1, sz * 0.72); ctx.bezierCurveTo(cx - R * 0.4, cy, cx - R * 0.1, cy - R * 0.7, cx + R * 0.7, cy - R * 0.6); ctx.fill(); break;
      case 'turban': case 'kufi':
        var tc = s.hat === 'kufi' ? '#e8e0cc' : (s.gold ? '#efe6d0' : ['#e8e0cc', '#b44a2a', '#2a5a6a'][Math.floor(rng() * 3)]);
        hatFill(tc); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.82, R * (s.hat === 'kufi' ? 0.8 : 1.05), R * (s.hat === 'kufi' ? 0.35 : 0.62), -0.1, 0, Math.PI * 2); ctx.fill();
        if (s.hat === 'turban') { ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = sz * 0.008; for (var t = 0; t < 4; t++) { ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * (0.95 - t * 0.12), R * 0.95, R * 0.25, -0.1, 0.2, 2.8); ctx.stroke(); } if (s.gold) { ctx.fillStyle = '#d9b45f'; ctx.beginPath(); ctx.arc(cx + R * 0.55, cy - R * 0.8, R * 0.09, 0, Math.PI * 2); ctx.fill(); } }
        break;
      case 'crown': ctx.fillStyle = '#d9b45f'; ctx.beginPath(); ctx.moveTo(cx - R * 0.75, cy - R * 0.72); for (var p = 0; p <= 5; p++) { ctx.lineTo(cx - R * 0.75 + p * R * 0.3, cy - R * (p % 2 ? 1.05 : 1.35)); } ctx.lineTo(cx + R * 0.75, cy - R * 0.72); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#a3261e'; ctx.beginPath(); ctx.arc(cx, cy - R * 0.88, R * 0.07, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = A.rgba(hair); ctx.fillRect(cx - R * 0.9, cy - R * 0.72, R * 0.4, R * 0.9); break;
      case 'mitre': hatFill('#efe6d0'); ctx.beginPath(); ctx.moveTo(cx - R * 0.6, cy - R * 0.7); ctx.lineTo(cx - R * 0.35, cy - R * 1.7); ctx.lineTo(cx + R * 0.05, cy - R * 1.9); ctx.lineTo(cx + R * 0.55, cy - R * 0.7); ctx.fill(); ctx.fillStyle = '#d9b45f'; ctx.fillRect(cx - R * 0.1, cy - R * 1.7, R * 0.12, R); break;
      case 'gauze': hatFill('#1a1a1c'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.9, R * 0.8, R * 0.32, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - R * 0.8, cy - R * 0.95, R * 1.5, R * 0.18); ctx.fillRect(cx - R * 1.35, cy - R * 0.9, R * 0.6, R * 0.08); break;
      case 'eboshi': hatFill('#1a1a1c'); ctx.beginPath(); ctx.moveTo(cx - R * 0.5, cy - R * 0.7); ctx.quadraticCurveTo(cx - R * 0.6, cy - R * 1.8, cx + R * 0.3, cy - R * 1.6); ctx.lineTo(cx + R * 0.5, cy - R * 0.8); ctx.fill(); break;
      case 'gat':
        ctx.fillStyle = 'rgba(16,18,18,.82)'; ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.78, R * 1.35, R * 0.18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(20,22,22,.72)'; ctx.fillRect(cx - R * 0.43, cy - R * 1.45, R * 0.78, R * 0.7); break;
      case 'ikseongwan':
        hatFill('#171719'); ctx.fillRect(cx - R * 0.62, cy - R * 1.18, R * 1.15, R * 0.5); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 1.17, R * 0.58, R * 0.32, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - R * 0.78, cy - R * 1.05, R * 0.3, R * 0.13, -0.5, 0, Math.PI * 2); ctx.ellipse(cx + R * 0.68, cy - R * 1.05, R * 0.3, R * 0.13, 0.5, 0, Math.PI * 2); ctx.fill(); break;
      case 'samo': case 'mingOfficial':
        hatFill('#18181b'); ctx.fillRect(cx - R * 0.62, cy - R * 1.1, R * 1.15, R * 0.42); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 1.08, R * 0.58, R * 0.3, 0, Math.PI, 0); ctx.fill();
        ctx.fillRect(cx - R * 1.35, cy - R * 1.06, R * 0.75, R * 0.09); ctx.fillRect(cx + R * 0.5, cy - R * 1.06, R * 0.8, R * 0.09); break;
      case 'jokduri':
        hatFill('#201b1e'); ctx.beginPath(); ctx.moveTo(cx - R * 0.45, cy - R * 0.8); ctx.lineTo(cx - R * 0.28, cy - R * 1.35); ctx.lineTo(cx + R * 0.25, cy - R * 1.35); ctx.lineTo(cx + R * 0.48, cy - R * 0.8); ctx.fill(); ctx.fillStyle = '#d8b84f'; ctx.beginPath(); ctx.arc(cx, cy - R * 1.12, R * 0.08, 0, 7); ctx.fill(); break;
      case 'hwagwan':
        ctx.fillStyle = '#d9b544'; ctx.beginPath(); ctx.moveTo(cx - R * .55, cy - R * .76); ctx.lineTo(cx - R * .4, cy - R * 1.3); ctx.lineTo(cx - R * .08, cy - R * 1.02); ctx.lineTo(cx + R * .18, cy - R * 1.42); ctx.lineTo(cx + R * .43, cy - R * .76); ctx.closePath(); ctx.fill();
        ['#d04b54', '#3f8d77', '#ede0b9'].forEach(function (col, oi) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx - R * .28 + oi * R * .3, cy - R * (1.08 + (oi % 2) * .12), R * .09, 0, 7); ctx.fill(); }); break;
      case 'gache':
        ctx.fillStyle = A.rgba(A.shade(hair, .72)); ctx.beginPath(); ctx.ellipse(cx - R * .25, cy - R * 1.02, R * .76, R * .48, -.18, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - R * .78, cy - R * .78, R * .38, R * .56, -.3, 0, 7); ctx.fill(); ctx.fillStyle = '#d8b64b'; for (var go = 0; go < 3; go++) { ctx.beginPath(); ctx.arc(cx - R * (.65 - go * .28), cy - R * (1.16 + (go % 2) * .12), R * .07, 0, 7); ctx.fill(); } break;
      case 'joseonHelmet':
        hatFill('#30343a'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.82, R * 0.92, R * 0.58, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#b52e28'; ctx.fillRect(cx - R * 0.07, cy - R * 1.48, R * 0.14, R * 0.48); ctx.fillRect(cx - R * 0.9, cy - R * 0.78, R * 0.28, R * 0.95); break;
      case 'mingCap':
        hatFill('#171719'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.82, R * 0.82, R * 0.28, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(cx - R * 0.52, cy - R * 1.22, R * 0.95, R * 0.4); break;
      case 'merchantCap':
        hatFill('#18242d'); ctx.beginPath(); ctx.ellipse(cx - R * .08, cy - R * .86, R * .9, R * .35, -.08, 0, 7); ctx.fill();
        ctx.fillStyle = '#d4b458'; ctx.fillRect(cx - R * .82, cy - R * .82, R * 1.55, R * .09); ctx.beginPath(); ctx.arc(cx + R * .35, cy - R * .93, R * .07, 0, 7); ctx.fill(); break;
      case 'mingHelmet': case 'steppeHelmet': case 'kabuto':
        hatFill(s.hat === 'kabuto' ? '#302423' : '#3b4142'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.82, R, R * 0.62, 0, Math.PI, 0); ctx.fill();
        ctx.fillRect(cx - R * 1.0, cy - R * 0.82, R * 0.38, R); if (s.hat === 'kabuto') { ctx.strokeStyle = '#d6ad45'; ctx.lineWidth = sz * 0.025; ctx.beginPath(); ctx.arc(cx, cy - R * 1.24, R * 0.55, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); } break;
      case 'monk': ctx.fillStyle = A.rgba(hair); ctx.beginPath(); ctx.arc(cx - R * 0.05, cy - R * 0.75, R * 0.72, Math.PI, 0); ctx.fill(); ctx.fillStyle = A.rgba(sk); ctx.beginPath(); ctx.arc(cx - R * 0.05, cy - R * 0.84, R * 0.45, Math.PI, 0); ctx.fill(); break;
      case 'headband': case 'wampum': case 'featherBand':
        ctx.fillStyle = s.hat === 'wampum' ? '#56a5ad' : s.hat === 'featherBand' ? '#d6ae42' : '#b3332c'; ctx.fillRect(cx - R * 0.96, cy - R * 0.72, R * 1.78, R * 0.16);
        if (s.hat !== 'headband') { ctx.fillStyle = '#b53a2f'; ctx.beginPath(); ctx.ellipse(cx - R * 0.7, cy - R * 1.05, R * 0.08, R * 0.38, -0.25, 0, 7); ctx.fill(); } break;
      case 'jaguar':
        hatFill('#b98737'); ctx.beginPath(); ctx.arc(cx - R * 0.05, cy - R * 0.52, R * 1.04, Math.PI * 0.92, Math.PI * 2.08); ctx.lineTo(cx - R * 0.85, cy + R * 0.45); ctx.lineTo(cx - R * 0.5, cy - R * 0.5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - R * 0.75, cy - R * 1.18); ctx.lineTo(cx - R * 0.55, cy - R * 1.62); ctx.lineTo(cx - R * 0.25, cy - R * 1.18); ctx.moveTo(cx + R * 0.25, cy - R * 1.18); ctx.lineTo(cx + R * 0.5, cy - R * 1.58); ctx.lineTo(cx + R * 0.7, cy - R * 1.08); ctx.fill();
        ctx.fillStyle = '#2b1b12'; for (var jh = 0; jh < 9; jh++) { ctx.beginPath(); ctx.arc(cx - R * 0.72 + rng() * R * 1.4, cy - R * (0.55 + rng() * 0.75), R * 0.06, 0, 7); ctx.fill(); } break;
      case 'quetzal':
        for (var qf = 0; qf < 11; qf++) { ctx.fillStyle = qf % 3 ? '#228a67' : '#3eb79c'; ctx.beginPath(); ctx.ellipse(cx - R * 1.0 + qf * R * 0.2, cy - R * 1.3, R * 0.075, R * 0.62, -0.75 + qf * 0.15, 0, 7); ctx.fill(); } ctx.fillStyle = '#d9b43f'; ctx.fillRect(cx - R * 0.85, cy - R * 0.82, R * 1.65, R * 0.16); break;
      case 'warbonnet':
        for (var wf = 0; wf < 13; wf++) { var wa = -2.6 + wf * 0.2; ctx.fillStyle = wf % 2 ? '#eee3c7' : '#d7c9aa'; ctx.beginPath(); ctx.ellipse(cx - R * 0.2 + Math.cos(wa) * R * 1.05, cy - R * 0.35 + Math.sin(wa) * R * 1.05, R * 0.09, R * 0.48, wa + Math.PI / 2, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#b4312a'; ctx.fillRect(cx - R * 0.95, cy - R * 0.75, R * 1.7, R * 0.18); break;
      case 'roach':
        ctx.fillStyle = '#b5322e'; ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 1.18, R * 0.5, R * 0.22, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#20201f'; ctx.fillRect(cx - R * 0.9, cy - R * 0.72, R * 1.65, R * 0.14); break;
      case 'llautu': case 'mascapaicha':
        ctx.fillStyle = '#b7352d'; for (var lr = 0; lr < 3; lr++) ctx.fillRect(cx - R * 0.94, cy - R * (0.78 - lr * 0.1), R * 1.75, R * 0.07);
        if (s.hat === 'mascapaicha') { ctx.fillStyle = '#d6aa34'; ctx.fillRect(cx + R * 0.35, cy - R * 0.95, R * 0.16, R * 0.65); } break;
      case 'furcap':
        hatFill('#59402e'); ctx.beginPath(); ctx.ellipse(cx - R * 0.08, cy - R * 0.9, R * 0.9, R * 0.48, -0.05, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(235,220,190,.22)'; for (var fc = 0; fc < 8; fc++) { ctx.beginPath(); ctx.arc(cx - R * 0.7 + fc * R * 0.2, cy - R * 0.92, R * 0.1, 0, 7); ctx.fill(); } break;
      case 'kalpak':
        hatFill('#30251e'); ctx.beginPath(); ctx.moveTo(cx - R * .72, cy - R * .7); ctx.lineTo(cx - R * .58, cy - R * 1.46); ctx.lineTo(cx + R * .38, cy - R * 1.42); ctx.lineTo(cx + R * .58, cy - R * .7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(236,220,190,.18)'; for (var kp = 0; kp < 5; kp++) { ctx.beginPath(); ctx.arc(cx - R * .5 + kp * R * .22, cy - R * 1.12, R * .09, 0, 7); ctx.fill(); } break;
      case 'headwrap': case 'rajputTurban': case 'persianTurban':
        var hc = s.hat === 'rajputTurban' ? '#d49a3e' : s.hat === 'persianTurban' ? '#4d7890' : '#9d4937'; hatFill(hc); ctx.beginPath(); ctx.ellipse(cx - R * 0.06, cy - R * 0.9, R, R * 0.52, -0.12, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,240,210,.25)'; ctx.lineWidth = sz * 0.01; for (var hw = 0; hw < 4; hw++) { ctx.beginPath(); ctx.ellipse(cx, cy - R * (1.04 - hw * 0.12), R * 0.85, R * 0.16, -0.12, 0, 3); ctx.stroke(); } break;
      case 'hairpin': ctx.strokeStyle = '#d9b64b'; ctx.lineWidth = sz * 0.018; ctx.beginPath(); ctx.moveTo(cx - R * 0.9, cy - R * 1.1); ctx.lineTo(cx + R * 0.38, cy - R * 0.72); ctx.stroke(); ctx.fillStyle = '#c94852'; ctx.beginPath(); ctx.arc(cx - R * 0.86, cy - R * 1.08, R * 0.12, 0, 7); ctx.fill(); break;
      case 'seCrown': ctx.fillStyle = '#d9b53e'; ctx.beginPath(); ctx.moveTo(cx - R * 0.7, cy - R * 0.72); ctx.lineTo(cx - R * 0.45, cy - R * 1.45); ctx.lineTo(cx - R * 0.15, cy - R * 1.0); ctx.lineTo(cx + R * 0.1, cy - R * 1.6); ctx.lineTo(cx + R * 0.42, cy - R * 0.72); ctx.fill(); break;
      case 'beadCrown': ctx.fillStyle = '#dfbd56'; for (var bc = 0; bc < 8; bc++) { ctx.beginPath(); ctx.arc(cx - R * 0.75 + bc * R * 0.2, cy - R * (0.8 + (bc % 2) * 0.18), R * 0.1, 0, 7); ctx.fill(); } break;
      case 'veil': hatFill('#9d435f'); ctx.beginPath(); ctx.moveTo(cx + R * 0.7, cy - R * 0.55); ctx.quadraticCurveTo(cx - R * 0.2, cy - R * 1.45, cx - R * 1.15, cy - R * 0.4); ctx.lineTo(cx - R * 0.8, sz * 0.78); ctx.lineTo(cx + R * 0.2, sz * 0.7); ctx.quadraticCurveTo(cx - R * 0.05, cy, cx + R * 0.7, cy - R * 0.55); ctx.fill(); break;
      case 'feather':
        for (var fe = 0; fe < 7; fe++) { ctx.fillStyle = ['#2f8a5a', '#d9b45f', '#b8342a', '#2a6a9a'][fe % 4]; ctx.beginPath(); ctx.ellipse(cx - R * 0.6 + fe * R * 0.18, cy - R * 1.25, R * 0.07, R * 0.45, -0.6 + fe * 0.2, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#d9b45f'; ctx.fillRect(cx - R * 0.7, cy - R * 0.92, R * 1.4, R * 0.14); break;
      case 'morion': hatFill('#9aa0aa'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.85, R * 0.85, R * 0.55, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - R * 1.2, cy - R * 0.72); ctx.quadraticCurveTo(cx, cy - R * 0.62, cx + R * 1.1, cy - R * 0.9); ctx.lineTo(cx + R * 1.1, cy - R * 0.8); ctx.quadraticCurveTo(cx, cy - R * 0.5, cx - R * 1.2, cy - R * 0.62); ctx.fill(); ctx.fillRect(cx - R * 0.08, cy - R * 1.55, R * 0.16, R * 0.3); break;
      case 'helmetA': hatFill('#3a3a3a'); ctx.beginPath(); ctx.ellipse(cx - R * 0.05, cy - R * 0.8, R * 0.95, R * 0.6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - R * 1.1, cy - R * 0.85, R * 0.5, R * 0.9); break;
      case 'hijab': case 'kerchief':
        var vc = s.hat === 'hijab' ? '#2f5a5a' : '#8a3a2a'; if (s.veil) vc = s.veil;
        hatFill(vc); ctx.beginPath(); ctx.moveTo(cx + R * 0.72, cy - R * 0.55); ctx.bezierCurveTo(cx + R * 0.6, cy - R * 1.3, cx - R * 1.3, cy - R * 1.2, cx - R * 1.2, cy + R * 0.2);
        if (s.hat === 'hijab') { ctx.bezierCurveTo(cx - R * 1.1, cy + R * 1.3, cx - R * 0.2, sz * 0.8, cx + R * 0.35, sz * 0.72); ctx.lineTo(cx + R * 0.3, cy + R * 0.7); ctx.bezierCurveTo(cx - R * 0.2, cy + R * 0.2, cx - R * 0.1, cy - R * 0.5, cx + R * 0.72, cy - R * 0.55); }
        else { ctx.lineTo(cx - R * 0.5, cy + R * 0.1); ctx.bezierCurveTo(cx - R * 0.3, cy - R * 0.5, cx + R * 0.1, cy - R * 0.6, cx + R * 0.72, cy - R * 0.55); }
        ctx.fill(); break;
      case 'band': ctx.fillStyle = '#b8342a'; ctx.fillRect(cx - R * 0.95, cy - R * 0.7, R * 1.75, R * 0.14); break;
      default: break;
    }
    if (s.ornament === 'daenggi' && s.g === 'f') {
      ctx.fillStyle = '#c83f4b'; ctx.beginPath(); ctx.moveTo(cx - R * .78, cy - R * .18); ctx.lineTo(cx - R * .98, cy + R * 1.2); ctx.lineTo(cx - R * .68, cy + R * .92); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e2b84b'; ctx.fillRect(cx - R * .91, cy + R * .25, R * .12, R * .45);
    }
    ctx.restore();
    // frame glow & vignette
    var vg = ctx.createRadialGradient(sz / 2, sz / 2, sz * 0.3, sz / 2, sz / 2, sz * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, sz, sz);
    A.applyGrain(ctx, sz, sz, 0.05);
  };

  /** attach an override-image chain to a spec (returns the spec) */
  A.withImg = function (spec, chain) { if (spec && chain && chain.length) spec.img = chain; return spec; };
  /** override-image chain for a portrait spec (spec.img, or the player's face index) */
  A.portraitKeys = function (spec) {
    if (!spec || !G.Img) return null;
    var game = G.Game && G.Game.state;
    // 저장된 초상은 젊은 얼굴을 기준으로 생김새를 기억한다. 실제 표시만 현재 나이에 따라 바꾼다.
    if (game && game.player && spec === game.player.portrait && G.Img.chain.heroPortrait) return G.Img.chain.heroPortrait(game.player);
    var out = spec.img ? [].concat(spec.img) : [], roleKey = spec.noRole ? null : A.rolePortraitKey(spec);
    // 역할 그림(npc-roles)은 성별이 정해져 있다 — 다른 성별의 인물에게는 쓰지 않는다 (조선 국왕에게 왕비 그림이 붙지 않게)
    if (roleKey && spec.g && A.rolePortraitGender(spec.role, spec.style) !== spec.g) roleKey = null;
    if (roleKey && out.indexOf(roleKey) < 0) out.push(roleKey);
    if (out.length) return out;
    var m = /^player(\d+)/.exec(String(spec.seed || ''));
    if (m) return G.Img.chain.player(+m[1]);
    return null;
  };
  A.portraitCanvas = function (spec, size) {
    size = size || 134;
    // 무대 전체가 CSS로 확대되므로 논리 크기 2배만 그리면 큰 화면에서 다시 흐려진다.
    // 현재 무대 배율과 화면 DPR을 반영하되 지나친 메모리 사용을 막아 4배에서 멈춘다.
    var stageScale = G.Game && G.Game.scale ? G.Game.scale : 1;
    var dpr = window.devicePixelRatio || 1;
    var ratio = Math.max(2, Math.min(4, stageScale * dpr));
    var px = Math.max(1, Math.round(size * ratio));
    var chain = A.portraitKeys(spec);
    if (chain && G.Img.pick(chain)) {
      var oc = G.Img.make(chain, px, px, function () { var pc = A.canvas(px, px); A.drawPortrait(pc.getContext('2d'), px, spec); return pc; }, { fy: 0.25, bg: '#1a120c' });
      oc.style.width = size + 'px'; oc.style.height = size + 'px';
      return oc;
    }
    var key = JSON.stringify(spec) + '@' + px;
    var c = A.canvas(px, px);
    c.style.width = size + 'px'; c.style.height = size + 'px';
    var ctx = c.getContext('2d');
    if (cache[key]) { ctx.drawImage(cache[key], 0, 0); return c; }
    A.drawPortrait(ctx, px, spec);
    var copy = A.canvas(px, px); copy.getContext('2d').drawImage(c, 0, 0); cache[key] = copy;
    return c;
  };
})(window.G = window.G || {});
