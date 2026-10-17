/* 식당과 음식의 자리 (js/data/cuisine.js 다음에 읽는다) — 어느 도시에 식당이 있고, 그 식당이 무엇을 내는가.
   · 식당은 중도시 이상(size ≥ G.BALANCE.restaurant.minSize)이거나 그 고장 이름난 음식이 있는 도시에만 선다.
     부족 마을(T)과 사람이 살지 않는 섬에는 없다. 개척 도시는 js/systems/colony.js가 정한다.
   · 차림표 = 그 도시의 이름난 음식(FAMOUS) → 그 고장 갈래(SUB) → 큰 음식권(zone) 순서로 최대 6가지.
     cuisine.js의 큰 음식권이 어긋나던 곳(마르세유·툴루즈가 이탈리아·이베리아로, 아조레스가 북아메리카로, 메카·메디나가 북아프리카로,
     중남미의 몇 도시가 서아프리카로, 아메리카 원주민 마을이 클램 차우더로, 오스트레일리아가 독일로 들어가던 것)을 바로잡는다. */
(function (G) {
  'use strict';
  var CP = G.CUISINE; if (!CP) return;
  var baseZone = CP.zone, byId = CP.byId;

  // ---------------------------------------------------------------- 도시마다 이름난 음식 (앞에 올수록 그 도시의 얼굴)
  var FAMOUS = {
    // 이베리아
    0: ['bacalhau', 'caldo_verde'], 1: ['caldo_verde', 'bacalhau'], 2: ['empanada_gallega'], 6: ['gazpacho'], 7: ['gazpacho', 'tortilla_espanola'],
    8: ['gazpacho'], 11: ['paella'], 12: ['paella'], 4: ['tortilla_espanola'], 86: ['bacalhau'], 87: ['bacalhau'],
    // 프랑스
    14: ['pot_au_feu', 'coq_au_vin'], 17: ['crepe'], 15: ['crepe'], 19: ['cassoulet'], 20: ['coq_au_vin'], 21: ['bouillabaisse'],
    49: ['quiche_lorraine', 'bratwurst_sauerkraut'],
    // 브리튼
    38: ['fish_chips', 'pie_mash'], 42: ['scotch_broth'], 43: ['irish_stew'],
    // 독일·저지대·중부 유럽
    44: ['hamburg_steak', 'herring_bread'], 45: ['herring_bread'], 46: ['herring_bread'], 24: ['herring_bread'], 22: ['stoofvlees'], 23: ['stoofvlees'],
    25: ['stoofvlees'], 51: ['bratwurst_sauerkraut'], 54: ['schnitzel'], 63: ['goulash'], 62: ['pierogi'], 56: ['pierogi'],
    // 이탈리아·그리스
    34: ['pizza_napoletana'], 26: ['risotto', 'osso_buco'], 29: ['polenta', 'risotto'], 33: ['pasta_ragu'], 30: ['pasta_ragu'],
    72: ['greek_moussaka'], 73: ['greek_moussaka'], 74: ['greek_moussaka'],
    // 북유럽·러시아·초원
    64: ['swedish_meatballs', 'gravlax'], 66: ['smorrebrod'], 68: ['gravlax'], 60: ['blini', 'beef_stroganoff', 'pelmeni'], 61: ['borscht'],
    141: ['beshbarmak'], 132: ['plov', 'manti'], 133: ['plov', 'manti'], 140: ['plov'], 144: ['beshbarmak'],
    // 오스만·레반트·아라비아·페르시아
    137: ['plov', 'manti'], 112: ['kebab', 'baklava', 'pide'], 119: ['hummus'], 120: ['hummus'], 121: ['hummus', 'dolma'], 127: ['dolma'], 130: ['kebab'], 131: ['dolma'],
    122: ['mansaf'], 123: ['mansaf'],
    // 북아프리카
    79: ['koshari', 'ful_medames'], 78: ['ful_medames'], 82: ['brik', 'couscous'], 81: ['brik'], 83: ['couscous'], 85: ['harira', 'tagine'], 10: ['harira', 'tagine'],
    // 아프리카
    89: ['thieboudienne'], 91: ['thieboudienne'], 96: ['jollof_rice'], 98: ['fufu_soup'], 93: ['peanut_stew'], 110: ['injera_wat'], 111: ['injera_wat'],
    101: ['bobotie', 'biltong_plate'], 102: ['grilled_fish_cassava'], 103: ['grilled_fish_cassava'], 106: ['seafood_curry'], 109: ['coconut_rice'],
    // 인도·동남아시아
    145: ['delhi_curry', 'chole_bhature', 'butter_chicken'], 146: ['tandoori_chicken', 'biryani'], 156: ['biryani'], 152: ['dosa'], 154: ['dosa'], 153: ['dosa'],
    162: ['pad_thai'], 163: ['amok'], 164: ['pho'], 165: ['pho'], 160: ['laksa'], 167: ['rendang'], 168: ['nasi_goreng'], 169: ['nasi_goreng'],
    // 중국
    188: ['peking_duck', 'zhajiangmian', 'jiaozi'], 182: ['jiaozi', 'sichuan_hotpot', 'mapo_tofu', 'kungpao_chicken'], 174: ['dim_sum', 'char_siu', 'wonton_noodle'],
    177: ['beggars_chicken'], 286: ['xiaolongbao'], 288: ['xiaolongbao'],
    // 조선·일본
    190: ['galbi', 'samgyeopsal', 'bulgogi'], 226: ['dwaeji_gukbap'], 227: ['bibimbap'], 228: ['naengmyeon'],
    192: ['sushi', 'okonomiyaki', 'takoyaki'], 193: ['soba', 'udon'], 297: ['sushi', 'tempura'], 191: ['tempura'],
    // 아메리카·오세아니아
    255: ['clam_chowder'], 256: ['clam_chowder'], 259: ['clam_chowder'], 266: ['gumbo'], 197: ['jerk_chicken'],
    200: ['tamales', 'mole_poblano'], 201: ['mole_poblano', 'tamales'], 202: ['mole_poblano'], 199: ['tamales'],
    222: ['ceviche', 'lomo_saltado'], 223: ['pachamanca'], 216: ['feijoada'], 215: ['feijoada'], 214: ['feijoada'], 217: ['empanadas'], 275: ['empanadas'],
    243: ['bison_stew'], 245: ['salmon_berries'], 285: ['hangi']
  };

  // ---------------------------------------------------------------- 큰 음식권 안의 고장 갈래 (차림표를 그 고장 것으로 채운다)
  var SUB = {
    greek: ['greek_moussaka', 'dolma', 'baklava', 'pide'],
    balkan: ['goulash', 'greek_moussaka', 'borscht', 'pierogi'],
    nordic: ['swedish_meatballs', 'gravlax', 'smorrebrod', 'herring_bread'],
    baltic: ['pierogi', 'herring_bread', 'borscht', 'smorrebrod'],
    russia: ['blini', 'pelmeni', 'beef_stroganoff', 'borscht'],
    steppe: ['plov', 'beshbarmak', 'manti', 'pelmeni'],
    arabia: ['mansaf', 'kebab', 'hummus', 'dolma', 'baklava'],
    persia: ['kebab', 'dolma', 'plov', 'baklava', 'manti'],
    egypt: ['koshari', 'ful_medames', 'couscous', 'brik'],
    maghreb: ['couscous', 'tagine', 'harira', 'brik'],
    swahili: ['coconut_rice', 'seafood_curry', 'ugali_stew', 'grilled_fish_cassava'],
    horn: ['injera_wat', 'ful_medames', 'ugali_stew'],
    na_native: ['maize_bean_stew', 'bison_stew', 'salmon_berries', 'cornbread_stew'],
    caribbean: ['pepperpot', 'jerk_chicken', 'gumbo', 'tamales'],
    mexico: ['tamales', 'mole_poblano', 'empanadas'],
    andes: ['pachamanca', 'ceviche', 'lomo_saltado', 'tamales', 'empanadas'],
    brazil: ['feijoada', 'empanadas', 'tamales'],
    southcone: ['empanadas', 'lomo_saltado', 'tamales'],
    pacific: ['hangi', 'poi_fish'],
    vietnam: ['pho', 'amok', 'nasi_goreng'],
    burma: ['laksa', 'pad_thai', 'amok'],
    north_china: ['peking_duck', 'jiaozi', 'zhajiangmian', 'kungpao_chicken'],
    jiangnan: ['xiaolongbao', 'beggars_chicken', 'wonton_noodle', 'fried_rice', 'jiaozi'],
    sichuan: ['sichuan_hotpot', 'mapo_tofu', 'kungpao_chicken', 'jiaozi'],
    himalaya: ['jiaozi', 'zhajiangmian', 'plov']
  };
  var ZONE_FIX = { 19: 'french', 21: 'french', 86: 'iberia', 87: 'iberia', 90: 'iberia', 282: 'british', 283: 'british', 284: 'british', 285: 'british',
    164: 'seasia', 165: 'seasia', 139: 'china_north', 78: 'north_africa', 79: 'north_africa', 80: 'north_africa' };
  var SUB_FIX = { 285: 'pacific', 139: 'himalaya', 164: 'vietnam', 165: 'vietnam', 110: 'horn', 111: 'horn', 158: 'burma', 159: 'burma', 113: 'steppe', 181: 'sichuan', 182: 'sichuan' };

  /** 큰 음식권 (cuisine.js의 zone을 바로잡은 것) */
  function zone(c) {
    if (!c) return 'europe';
    if (ZONE_FIX[c.id]) return ZONE_FIX[c.id];
    var s = c.style, lon = c.lon || 0, lat = c.lat || 0;
    if (s === 'na') return 'native_oceania';                                  // 아메리카 원주민 마을 (클램 차우더가 아니라)
    if (lon < -30 && (s === 'tr' || s === 'af' || s === 'sw')) return 'latin';   // 중남미의 도시가 서아프리카 음식으로 들어가던 것
    if ((s === 'is' || s === 'pe') && lon >= 35) return 'ottoman_levant';      // 아라비아·페르시아 (쿠스쿠스가 아니라)
    if (s === 'co' && lat <= 27) return 'latin';                             // 에스파냐령 카리브·멕시코 (클램 차우더가 아니라 — 아래 SUB에서 카리브·멕시코 차림)
    return baseZone(c);
  }
  /** 큰 음식권 안의 고장 갈래 */
  function sub(c, z) {
    if (SUB_FIX[c.id]) return SUB_FIX[c.id];
    var s = c.style, lon = c.lon || 0, lat = c.lat || 0;
    if (z === 'east_europe') { if (s === 'gr') return lat < 42 ? 'greek' : 'balkan'; if (lon < 20 || lat >= 59) return 'nordic'; return 'baltic'; }
    if (z === 'russia_steppe') return s === 'st' || lon > 45 && lat < 50 ? 'steppe' : 'russia';
    if (z === 'ottoman_levant') { if (s === 'pe') return 'persia'; if (lat < 30 && lon >= 35) return 'arabia'; return null; }
    if (z === 'north_africa') return lon >= 25 ? 'egypt' : 'maghreb';
    if (z === 'china_north') return lat < 33 && lon > 115 ? 'jiangnan' : lon < 106 ? 'sichuan' : 'north_china';   // 강남(항주·남경·소주·상해) · 사천 · 북쪽
    if (z === 'africa' || z === 'south_africa') { if (s === 'sw' || (lon > 34 && lat < 5)) return 'swahili'; if (lon > 32 && lat > 5) return 'horn'; return null; }
    if (z === 'native_oceania') { if (s === 'na') return 'na_native'; if (s === 'an') return 'andes'; if (lon > 100 || lon < -150) return 'pacific'; return null; }
    if (z === 'north_america') return s === 'na' ? 'na_native' : null;
    if (z === 'latin') {
      if (s === 'an' || (lat < 0 && lon < -65 && lat > -25)) return 'andes';
      if (s === 'az' || (lat > 14 && lon < -86)) return 'mexico';
      if (lon > -50 && lat < 0) return 'brazil';
      if (lat < -25) return 'southcone';
      if (lat > 8) return 'caribbean';
      return null;
    }
    return null;
  }
  /** 그 도시 식당의 차림표 (최대 6가지, 이름난 음식이 먼저) */
  function dishes(c) {
    var ids = [], push = function (id) { if (byId[id] && ids.indexOf(id) < 0) ids.push(id); };
    (FAMOUS[c.id] || []).forEach(push);
    (CP.special[c.id] || []).forEach(push);
    var z = zone(c), sb = sub(c, z);
    if (sb && SUB[sb]) SUB[sb].forEach(push);
    if (ids.length < 6) CP.list.forEach(function (d) { if (d.zone === z) push(d.id); });
    return ids.slice(0, 6).map(function (id) { return byId[id]; });
  }
  /** 이 도시에 식당이 있는가 */
  function hasRestaurant(c) {
    if (!c || c.outpost) return false;
    if (c.colony != null) return true;                                         // 개척 도시는 colony.js가 단계마다 정한다
    if (c.flags && c.flags.indexOf('T') >= 0) return false;                    // 부족 마을: 마을 사람의 음식은 거리·잔치에서
    var k = (G.BALANCE && G.BALANCE.restaurant) || {}, min = k.minSize == null ? 2 : k.minSize;
    return (c.size || 1) >= min || !!FAMOUS[c.id] || !!CP.special[c.id];
  }
  CP.zone = zone; CP.sub = sub; CP.dishes = dishes; CP.hasRestaurant = hasRestaurant; CP.famous = FAMOUS;
})(window.G = window.G || {});
