/* 후원자의 관심사 — 발견물 갈래(G.DISC_CATS: 지리·자연·유적·보물·생물·민족·교역품)에 더해
   갈래를 가로지르는 관심사 세 가지를 둔다. 후원자 taste 에 갈래 이름 대신 이 이름을 적을 수 있다.
     myth  전설·미신 — 전설의 괴물·사라진 땅·전설의 물건 (발견물의 legend·legendBeast 표시 + 아래 목록)
     faith 종교      — 이름난 성당·모스크·절·사원·성지와 성물
     art   예술      — 이름난 그림·조각·그릇과 그것을 모은 곳 (시대 인물의 작품 by 포함)
   G.tasteName(t): 관심사 이름 · G.tasteHit(taste, d): 그 관심사 목록에 이 발견물이 드는가
   (js/systems/sponsor.js · js/city/palace.js · js/systems/errand.js · js/systems/succession.js · js/catalog.js 가 쓴다) */
(function (G) {
  'use strict';
  function set(list) { var o = {}; list.forEach(function (id) { o[id] = 1; }); return o; }
  var MYTH = set(['unicorn', 'dragon', 'phoenix', 'roc', 'minotaur', 'yeti', 'mermaid', 'elf', 'troll', 'nessie', 'mokele', 'reddragon', 'whitetiger',
    'eldorado', 'cibola', 'prester', 'brendan', 'mu', 'grail', 'excalibur', 'tintagel', 'arthurtomb', 'tor', 'atlantis', 'pangboche', 'bullocho',
    'langya', 'seobul', 'shingu', 'yonggung', 'startower', 'timaeus', 'zipang', 'ultimathule']);
  var FAITH = set([
    // 그리스도교
    'poitiers', 'montstmichel', 'stave', 'rusch', 'hagiasophia', 'sepulchre', 'notredame', 'apostolic', 'rila', 'stbasil', 'sistine', 'escorial',
    'sagrada', 'hvalsey', 'holylance', 'paladoro', 'belemmonstrance', 'reliquary', 'stcrown', 'sinai',
    // 이슬람
    'kaaba', 'nabawi', 'rockdome', 'djenne', 'delhimosque', 'isfahanmosque', 'sankore', 'kilwa', 'samarra', 'bluemosque', 'ubudiah', 'umayyad',
    // 불교
    'yungang', 'bulguksa', 'hwangnyong', 'borobudur', 'shwedagon', 'ayubuddha', 'ananda', 'mahabodhi', 'nalanda', 'sanchi', 'kamakura', 'erdenezuu',
    'xiengthong', 'boudhanath', 'doisuthep', 'haeinsa', 'mireuksa', 'baidinh', 'sarnath', 'shaolin', 'dayanta', 'potala', 'konjiki', 'seokguram',
    'tripitaka', 'kalachakra', 'porcelain', 'adamspeak',
    // 힌두·시크·그 밖의 믿음
    'angkor', 'madurai', 'brihadeeswarar', 'ellora', 'khajuraho', 'konark', 'vittala', 'harmandir', 'mahabali', 'shiva', 'kailash', 'manasarovar',
    'tiantan', 'qufu', 'wudang', 'jongmyo', 'haleokeawe', 'templomayor', 'delphi', 'barkal', 'thebes', 'abusimbel', 'gadir', 'machupicchu']);
  var ART = set(['monalisa', 'creation', 'lastsupper', 'birthvenus', 'david', 'urbinovenus', 'sistine', 'uffizi', 'louvre', 'laocoon', 'venusmilo', 'nike',
    'earthlydelights', 'babeltower', 'orgaz', 'saliera', 'qingming', 'nanbanscreen', 'lanting', 'shahnameh', 'cheonmado', 'rakubowl', 'tsukumonasu',
    'moonjar', 'goryeoceladon', 'tangsancai', 'qinghua', 'hermitage', 'bellasartes', 'nefertiti', 'zeus']);
  G.INTERESTS = {
    myth: { name: '전설·미신', has: function (d) { return !!(d.legend || d.legendBeast || MYTH[d.id]); } },
    faith: { name: '종교', has: function (d) { return !!FAITH[d.id]; } },
    art: { name: '예술', has: function (d) { return !!(d.by || ART[d.id]); } }
  };
  G.INTEREST_IDS = { myth: Object.keys(MYTH), faith: Object.keys(FAITH), art: Object.keys(ART) };
  /** 관심사 이름 (갈래 또는 위의 관심사) */
  G.tasteName = function (t) { return (G.DISC_CATS && G.DISC_CATS[t]) || (G.INTERESTS[t] && G.INTERESTS[t].name) || t; };
  /** 후원자 취향(taste 목록)에 이 발견물이 드는가 */
  G.tasteHit = function (taste, d) {
    if (!d || !taste) return false;
    for (var i = 0; i < taste.length; i++) {
      var t = taste[i];
      if (t === d.cat || (G.INTERESTS[t] && G.INTERESTS[t].has(d))) return true;
    }
    return false;
  };
})(window.G = window.G || {});
