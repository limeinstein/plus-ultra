/* 일곱 해적섬의 거리·건물·주민 그림. 저장 자료는 건드리지 않고 c.lair로 고른다. */
(function (G) {
  'use strict';
  var I = G.Img, A = G.Art, U = G.U, K = I.chain;
  var P = G.PirateIslandArt = {};
  P.buildings = ['harbor', 'trade', 'tavern', 'inn', 'lairhq'];
  P.roles = {
    harbormaster: { name: '해적 항구지기', g: 'm', role: 'captain' },
    trader: { name: '장물상', g: 'f', role: 'merchant' },
    tavernkeeper: { name: '은퇴한 해적 술집 주인', g: 'm', role: 'keeper' },
    innkeeper: { name: '여해적 출신 여관 안주인', g: 'f', role: 'keeper' },
    boatswain: { name: '소굴의 갑판장', g: 'm', role: 'sailor' },
    servant: { name: '망꾼 출신 여급', g: 'f', role: 'maid' }
  };
  var ALIAS = { captain: 'harbormaster', pirate: 'boatswain', guard: 'boatswain', brawler: 'boatswain', drunk: 'tavernkeeper', gambler: 'tavernkeeper', vendor: 'trader' };
  var STREET = { navigator: 'harbormaster', merchant: 'trader', man: 'tavernkeeper', innkeeper: 'innkeeper', soldier: 'boatswain', woman: 'servant' };
  // 섬마다 거리에서 만나는 생업과 등장 비중. 보행과 대화에는 같은 직업 원화를 쓴다.
  P.regions = {
    med: {
      name: '제르바 섬', line: '갤리선 노꾼으로 시작해 나포선의 갑판까지 밟아 봤소. 이 섬 얕은 물길은 아무 배나 받아 주지 않지.',
      residents: {
        navigator: { name: '모래톱 길잡이', w: 4 }, merchant: { name: '산호 장물상', w: 2 },
        man: { name: '갤리선 노꾼 출신 술집 주인', w: 2 }, innkeeper: { name: '제르바 여관 안주인', w: 1 },
        soldier: { name: '갤리선 갑판장', w: 4 }, woman: { name: '망루지기 출신 여급', w: 1 }
      }
    },
    atl: {
      name: '마모라', line: '잉글랜드 배에서 쫓겨난 자도, 모로코에서 온 자도 이 부두에서는 한패요. 저 강어귀 안개 속에서 내 젊은 날을 다 보냈지.',
      residents: {
        navigator: { name: '강어귀 도선사', w: 4 }, merchant: { name: '모로코 설탕 상인', w: 3 },
        man: { name: '사략선 출신 술집 주인', w: 2 }, innkeeper: { name: '마모라 선원 여관 주인', w: 2 },
        soldier: { name: '강어귀 요새의 갑판장', w: 2 }, woman: { name: '안개 망꾼 출신 여급', w: 1 }
      }
    },
    north: {
      name: '클레어 섬', line: '탑성 아래서 통행세를 받던 손으로 이제는 밧줄을 묶소. 서쪽 먹구름이 낮아지면 배를 단단히 매어 두시오.',
      residents: {
        navigator: { name: '클루 만 뱃길지기', w: 3 }, merchant: { name: '소가죽 장수', w: 2 },
        man: { name: '청어잡이 출신 술집 주인', w: 2 }, innkeeper: { name: '탑성 아래 여관 주인', w: 2 },
        soldier: { name: '탑성 수비선 갑판장', w: 4 }, woman: { name: '절벽 망꾼 출신 여급', w: 1 }
      }
    },
    amer: {
      name: '토르투가', line: '한때는 해안 형제단의 배를 탔지. 럼주와 전리품을 나눌 때만큼은 선장도 몫을 속이지 못했소.',
      residents: {
        navigator: { name: '토르투가 항구지기', w: 2 }, merchant: { name: '버커니어 가죽 상인', w: 3 },
        man: { name: '럼주 술집 주인', w: 4 }, innkeeper: { name: '해안 형제단의 여관 주인', w: 1 },
        soldier: { name: '버커니어 갑판장', w: 3 }, woman: { name: '럼주 선술집 여급', w: 2 }
      }
    },
    ind: {
      name: '생트마리 섬', line: '큰 보물선을 쫓던 때도 있었지만, 이 산호초 사이로 무사히 돌아오는 일이 더 귀하더군. 섬에선 배 고치는 손을 먼저 대접하오.',
      residents: {
        navigator: { name: '산호초 길잡이', w: 4 }, merchant: { name: '인도양 후추 상인', w: 3 },
        man: { name: '보물선 사냥꾼 출신 술집 주인', w: 1 }, innkeeper: { name: '생트마리 선원 여관 주인', w: 2 },
        soldier: { name: '배 수리를 맡은 갑판장', w: 4 }, woman: { name: '보물선 망꾼 출신 여급', w: 1 }
      }
    },
    sea: {
      name: '홀로 섬', line: '노선의 노를 잡던 때엔 바람 한 점 없어도 달렸지. 지금도 술루 바다의 물살은 눈을 감고 짚을 수 있소.',
      residents: {
        navigator: { name: '술루 물길잡이', w: 3 }, merchant: { name: '술루 진주 상인', w: 4 },
        man: { name: '노잡이 출신 술집 주인', w: 2 }, innkeeper: { name: '홀로 부두 여관 주인', w: 1 },
        soldier: { name: '이라눈 노선 갑판장', w: 4 }, woman: { name: '노선 망꾼 출신 여급', w: 2 }
      }
    },
    east: {
      name: '쌍서', line: '명나라 해금도 왜구의 칼도 피해 다녔소. 이 섬에선 어느 깃발을 달았는지보다 약속한 짐을 가져왔는지가 중요하지.',
      residents: {
        navigator: { name: '닝보 앞바다 도선사', w: 3 }, merchant: { name: '비단 밀무역상', w: 4 },
        man: { name: '밀무역선 출신 술집 주인', w: 2 }, innkeeper: { name: '쌍서 객잔 주인', w: 3 },
        soldier: { name: '밀무역선 호위 갑판장', w: 2 }, woman: { name: '해안 망꾼 출신 객잔 여급', w: 2 }
      }
    }
  };
  Object.keys(P.regions).forEach(function (zone) {
    var residents = P.regions[zone].residents;
    Object.keys(residents).forEach(function (type) {
      var role = STREET[type];
      residents[type].walk = 'street-folk/pirate-islands/' + zone + '/' + role;
      residents[type].g = P.roles[role].g;
    });
  });
  var ROLE_LINES = {
    harbormaster: ['옛날엔 남의 배 닻줄을 끊었지만, 이제는 들어오는 배를 단단히 매어 주지. 출항 전에 물통부터 살피시오.', '이 부두에서 칼을 뽑으면 내 손으로 바다에 던지겠소. 배 위에서 배운 규율은 아직 잊지 않았지.'],
    trader: ['전에는 전리품 몫을 셌고, 지금은 물건값을 세지요. 물건 내력보다 무게와 품질을 먼저 봐요.', '비단에 소금기가 배었으면 값을 깎아야 해요. 배를 털어 본 사람이라 그런 흔적은 금세 알지요.'],
    tavernkeeper: ['배에 오르던 손으로 술통을 따니 훨씬 마음이 편하군. 우리 집에선 외상보다 칼부림을 더 싫어하오.', '낡은 귀걸이 자국이 보이오? 처음 전리품을 받던 날 뚫었지. 지금은 술값 장부가 내 보물지도요.'],
    innkeeper: ['밤 당번을 서던 버릇이 남아 작은 발소리에도 깨요. 손님 짐은 안심하고 맡겨요.', '폭풍 속 갑판보다는 우리 집 해먹이 훨씬 나아요. 젖은 장화는 문 앞에 벗어 두세요.'],
    boatswain: ['갈고리로 뱃전을 넘던 팔이 아직 성하오. 하지만 두목이 없는 동안엔 이 섬부터 지켜야지.', '전리품은 나누되 배 수리할 몫은 먼저 떼어 놓소. 그걸 잊은 선장은 오래 못 가더군.'],
    servant: ['돛대 꼭대기에서 군함을 찾던 눈으로 빈 술잔을 찾아요. 저쪽 바다 날씨도 여기서 다 보여요.', '망꾼을 그만뒀어도 수평선부터 보는 버릇은 남았네요. 잔은 내려놓고 편히 쉬세요.']
  };
  P.island = function (c) { return c && P.regions[c.lair]; };
  P.roleOf = function (id) { return P.roles[id] ? id : ALIAS[id]; };
  P.faceKey = function (c, id) { var r = P.roleOf(id); return P.island(c) && r ? 'portraits/npc/pirate-islands/' + c.lair + '/' + r : null; };
  P.walkKey = function (c, type) { var island = P.island(c), resident = island && island.residents[type]; return resident ? resident.walk : null; };
  function first(key, chain) { return key ? [key].concat(chain || []) : chain; }

  var bg = K.bg, city = K.city, exterior = K.exterior, interior = K.interior, npc = K.npc, gender = I.npcGender, maid = I.maidPicCity;
  K.bg = function (c) { return first(P.island(c) && 'pirate-islands/' + c.lair + '/street', bg.apply(this, arguments)); };
  K.city = function (c) { return first(P.island(c) && 'pirate-islands/' + c.lair + '/street', city.apply(this, arguments)); };
  K.exterior = function (kind, c) {
    var own = P.island(c) && (P.buildings.indexOf(kind) >= 0 || kind === 'house2');
    return first(own && 'pirate-islands/' + c.lair + '/exterior/' + (kind === 'house2' ? 'inn' : kind), exterior.apply(this, arguments));
  };
  K.interior = function (kind, c) {
    var own = P.island(c) && (P.buildings.indexOf(kind) >= 0 || kind === 'house2');
    return first(own && 'pirate-islands/' + c.lair + '/interior/' + (kind === 'house2' ? 'inn' : kind), interior.apply(this, arguments));
  };
  K.npc = function (id, c) { return first(P.faceKey(c, id), npc.apply(this, arguments)); };
  I.npcGender = function (id, c) { var r = P.roleOf(id); return P.island(c) && r ? P.roles[r].g : gender.apply(this, arguments); };
  I.maidPicCity = function (c) { return P.faceKey(c, 'servant') || maid.apply(this, arguments); };
  var townSpec = A.townSpec;
  A.townSpec = function (id, c) {
    var out = townSpec.apply(this, arguments), r = P.roleOf(id);
    return P.island(c) && r ? Object.assign({}, out, { g: P.roles[r].g }) : out;
  };

  var SF = G.StreetFolk;
  if (!SF) return;   // 도감에서는 그림 선택만 연결한다.
  var roster = SF.roster, speaker = SF.speaker, talk = SF.talk;
  SF.roster = function (c) { var island = P.island(c); return island ? island.residents : roster(c); };
  SF.speaker = function (f, c) {
    var island = P.island(c), resident = island && island.residents[f.type];
    if (!resident) return speaker.apply(this, arguments);
    var role = STREET[f.type], key = P.faceKey(c, role), d = P.roles[role], cl = G.R.cityLang(c);
    return { name: resident.name, rigId: 'pirate-island:' + c.lair + ':' + role, lang: cl.lv, li: cl.li,
      portrait: A.withImg(A.npcSpec('pirate-island:' + c.lair + ':' + role, d.role, I.folkStyle(c), d.g), [key]), half: [key + '_half'] };
  };
  if (G.StreetCulture) {
    var attach = G.StreetCulture.attach;
    G.StreetCulture.attach = function (f, c) {
      if (!P.island(c)) return attach.apply(this, arguments);
      // 보통 도시의 직업·역사 대사를 붙이면 해적섬 주민의 과거와 어긋난다.
      f.cultureTalks = 0;
    };
  }
  SF.talk = async function (f, c) {
    if (!P.walkKey(c, f.type)) return talk.apply(this, arguments);
    var role = STREET[f.type], who = SF.speaker(f, c), info = null;
    f.talked++;
    if (who.lang > 0 && f.talked > 1 && !f.used && SF.INFO[f.type]) info = SF.INFO[f.type](c);
    var text = info ? info.text : f.talked === 1 ? P.regions[c.lair].line : U.pick(ROLE_LINES[role]);
    await G.UI.say(text, who);
    if (info) { f.used = true; if (info.after) info.after(); if (info.gold) G.Game.refreshHud(); }
    if (!who.lang) await G.Scenes.city.mate('말이 통하지 않아 무슨 이야기인지 알아듣지 못했습니다.');
  };
})(window.G = window.G || {});
