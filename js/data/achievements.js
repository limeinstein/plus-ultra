/* 업적 — 발견물의 주제 조합으로 이룬다 (js/systems/achieve.js가 발견할 때마다 살핀다).
   규칙:
     ids + n      : 목록 가운데 n가지(없으면 모두)를 찾는다
     cats         : [{ cat: 분류 또는 [분류…], n: 몇 가지, reg: 지역(없으면 어디든) }] — 줄마다 모두 채운다
     chains: n    : 꼬리에 꼬리를 무는 사슬(G.CHAINS)을 n갈래 끝까지 (js/data/chaindisc.js)
     everyReg: n  : 열한 지역마다 n가지씩
     oneReg       : { cats: [분류…], n } — 한 지역에서 분류마다 n가지씩
   보상: fame(탐험 명성) · gold(금화) · title(칭호 — 수첩 「업적」에 모인다). 금액은 대항해시대 3의 수집 보상처럼 크게 잡았다. */
(function (G) {
  'use strict';
  var A = G.ACHIEVEMENTS = [];
  G.ACHV_GROUPS = ['고대 문명', '신대륙', '동아시아', '남·서아시아', '유럽과 예술', '생물', '자연', '교역', '전설과 사슬', '조합'];
  function a(group, id, name, desc, rule, fame, gold, title) {
    var o = { group: group, id: id, name: name, desc: desc, fame: fame, gold: gold, title: title || null };
    for (var k in rule) o[k] = rule[k];
    A.push(o);
  }

  // ------------------------------------------------------------------ 고대 문명
  a('고대 문명', 'wonders7', '고대 세계의 일곱 불가사의', '필론과 헤로도토스가 꼽은 일곱 경이를 모두 제 눈으로 보았다.',
    { ids: ['giza', 'hanging', 'artemis', 'zeus', 'mausoleum', 'colossus', 'pharos'] }, 900, 60000, '불가사의의 순례자');
  a('고대 문명', 'mesopotamia', '두 강 사이 — 문명의 요람', '유프라테스와 티그리스 사이 옛 도시들의 흔적을 모았다.',
    { ids: ['ur', 'ishtar', 'babel', 'hammurabi', 'sargon', 'urcrown', 'dursharrukin', 'hanging'], n: 5 }, 400, 20000);
  a('고대 문명', 'egypt', '파라오의 나라', '나일 강의 피라미드와 신전, 왕들의 보물을 찾았다.',
    { ids: ['pyramid', 'giza', 'kings', 'thebes', 'abusimbel', 'tutankh', 'rosetta', 'nefertiti'], n: 6 }, 500, 25000, '나일의 학자');
  a('고대 문명', 'hellas', '헬라스의 영광', '그리스의 신전과 영웅들의 도시를 두루 밟았다.',
    { ids: ['parthenon', 'delphi', 'knossos', 'mycenae', 'troy', 'agamemnon', 'venusmilo', 'nike', 'akrotiri'], n: 6 }, 450, 22000);
  a('고대 문명', 'rome', '모든 길은 로마로', '로마와 그 그늘 아래 있던 도시들의 자취를 찾았다.',
    { ids: ['colosseum', 'laocoon', 'apostolic', 'theodoric', 'byrsa', 'pisa'], n: 4 }, 300, 15000);
  a('고대 문명', 'indus', '사라진 문자', '아무도 읽지 못하는 글자를 남긴 문명 셋을 찾았다.',
    { ids: ['mohenjo', 'rongorongo', 'mayacodex', 'rosetta', 'kingittor'], n: 3 }, 400, 18000, '옛 글자의 해독자');

  // ------------------------------------------------------------------ 신대륙
  a('신대륙', 'threeciv', '신대륙의 세 문명', '아즈텍·마야·잉카, 세 문명의 중심을 모두 찾았다.',
    { ids: ['aztec', 'chichen', 'inca'] }, 700, 40000, '신대륙의 증인');
  a('신대륙', 'maya', '밀림 속의 마야', '마야의 도시와 비취, 그림 문서를 찾았다.',
    { ids: ['chichen', 'tikal', 'mayacodex', 'jademask', 'crystalskull'], n: 4 }, 400, 20000);
  a('신대륙', 'incas', '태양의 아들들', '안데스의 돌 도시와 황금을 찾았다.',
    { ids: ['machupicchu', 'sacsay', 'incadisc', 'inca', 'tiwanaku', 'nazca', 'qeswachaka', 'vilcabamba'], n: 5 }, 450, 22000);
  a('신대륙', 'golden', '황금을 좇는 자', '엘 도라도의 전설을 이루는 이야기들을 끝까지 쫓았다.',
    { ids: ['eldorado', 'guatavita', 'paititi', 'cibola', 'muzoemerald', 'huascarchain'], n: 4 }, 600, 50000, '황금 사냥꾼');
  a('신대륙', 'northamerica', '북쪽 대지의 사람들', '북아메리카의 흙언덕과 벼랑 집, 그리고 그곳 사람들을 만났다.',
    { ids: ['cahokia', 'serpentmound', 'pueblo', 'mesaverde', 'inuit', 'skraeling', 'lanseaux'], n: 4 }, 350, 16000);

  // ------------------------------------------------------------------ 동아시아
  a('동아시아', 'silla', '천년 왕국 신라', '서라벌의 절과 무덤, 금관을 찾았다.',
    { ids: ['bulguksa', 'seokguram', 'hwangnyong', 'emille', 'sillacrown', 'cheonmado', 'munmu'], n: 5 }, 400, 20000, '서라벌의 손님');
  a('동아시아', 'joseon', '해동의 보물', '고려와 조선이 남긴 글과 그릇, 경판을 찾았다.',
    { ids: ['hunmin', 'tripitaka', 'haeinsa', 'jongmyo', 'moonjar', 'goryeoceladon', 'baekjecenser', 'mireuksa'], n: 5 }, 400, 20000);
  a('동아시아', 'foursymbols', '사신 — 하늘의 네 짐승', '동쪽의 용, 서쪽의 흰 범, 남쪽의 봉황, 북쪽의 현무를 모두 만났다.',
    { ids: ['dragon', 'whitetiger', 'phoenix', 'hyeonmu'] }, 700, 35000, '사신을 거느린 자');
  a('동아시아', 'tianxia', '천자의 나라', '중원의 성벽과 궁궐, 황제들의 보물을 찾았다.',
    { ids: ['greatwall', 'qinshi', 'forbidden', 'weiyang', 'jadesuit', 'hanseal', 'bronze', 'porcelain', 'qingming'], n: 6 }, 450, 24000);
  a('동아시아', 'japan', '해 뜨는 섬나라', '왜국의 산과 절, 다도구를 찾았다.',
    { ids: ['fuji', 'nachi', 'kamakura', 'himeji', 'konjiki', 'goldseal', 'tsukumonasu', 'glassbowl', 'shingu'], n: 5 }, 350, 18000);
  a('동아시아', 'yokai', '동방의 요괴', '도깨비와 구미호, 오니 — 바다 동쪽의 요괴 넷을 만났다.',
    { ids: ['oni', 'dokkaebi', 'gumiho', 'gwisin', 'isonade', 'xiangliu', 'bakunawa'], n: 4 }, 350, 15000, '요괴 이야기꾼');

  // ------------------------------------------------------------------ 남·서아시아
  a('남·서아시아', 'holycities', '세 성지의 순례자', '메카와 메디나, 예루살렘, 로마의 성소를 모두 찾았다.',
    { ids: ['kaaba', 'nabawi', 'rockdome', 'sepulchre', 'apostolic'] }, 700, 35000, '성지의 순례자');
  a('남·서아시아', 'buddha', '부처의 길', '깨달음의 자리에서 바다 건너 큰 불상까지, 부처의 발자취를 따라갔다.',
    { ids: ['mahabodhi', 'sarnath', 'sanchi', 'nalanda', 'borobudur', 'shwedagon', 'yungang', 'seokguram', 'kamakura', 'boudhanath', 'ananda'], n: 7 }, 500, 25000, '구법승');
  a('남·서아시아', 'mughal', '무굴의 영화', '무굴 황제들의 묘와 성, 보석을 찾았다.',
    { ids: ['tajmahal', 'redfort', 'qutb', 'delhimosque', 'kohinoor', 'peacockthrone', 'baburnama'], n: 4 }, 400, 22000);
  a('남·서아시아', 'arabia', '아라비아의 밤', '사막의 도시와 유향 길, 『천일야화』의 괴물을 만났다.',
    { ids: ['petra', 'edom', 'marib', 'shabwa', 'ubar', 'roc', 'zaratan', 't_frank'], n: 5 }, 450, 24000);

  // ------------------------------------------------------------------ 유럽과 예술
  a('유럽과 예술', 'renaissance', '르네상스의 걸작', '피렌체와 로마의 거장들이 남긴 작품을 보았다.',
    { ids: ['monalisa', 'creation', 'lastsupper', 'birthvenus', 'david', 'urbinovenus', 'sistine', 'uffizi'], n: 5 }, 450, 30000, '예술의 후원자');
  a('유럽과 예술', 'northart', '북방의 르네상스', '플랑드르와 독일 화가들의 그림을 보았다.',
    { ids: ['ghentaltar', 'durer', 'earthlydelights', 'babeltower', 'ambassadors'], n: 4 }, 350, 20000);
  a('유럽과 예술', 'crowns', '왕관 수집가', '여러 왕국의 왕관을 찾았다.',
    { ids: ['sillacrown', 'stcrown', 'ironcrown', 'wenceslas', 'kingjohn', 'moctezuma', 'beowulf'], n: 4 }, 400, 25000, '왕관의 감정가');
  a('유럽과 예술', 'arthur', '원탁의 기사', '아서 왕 이야기의 자리를 하나하나 밟아 아발론에 이르렀다.',
    { ids: ['stonehenge', 'grail', 'tintagel', 'tor', 'arthurtomb', 'excalibur', 'avalon'] }, 800, 45000, '원탁의 기사');
  a('유럽과 예술', 'norse', '북구의 신화', '세계뱀과 늑대, 요정과 트롤 — 북쪽 신화의 존재들을 만났다.',
    { ids: ['jormungandr', 'fenrir', 'elf', 'troll', 'kraken', 'aurora', 'reykholt'], n: 5 }, 400, 20000);

  // ------------------------------------------------------------------ 생물
  a('생물', 'dinos', '공룡의 시대', '땅속에서 나온 거대한 옛 짐승들을 찾았다.',
    { ids: ['brachio', 'trex', 'trike', 'stego', 'smilodon', 'mammoth'], n: 5 }, 500, 25000, '화석 사냥꾼');
  a('생물', 'savanna', '사바나의 짐승들', '세렝게티 평원과 그곳의 큰 짐승 다섯을 만났다.',
    { cats: [{ ids: ['serengeti'], n: 1 }, { ids: ['lion', 'elephant', 'rhino', 'giraffe', 'zebra', 'hippo', 'cheetah', 'hyena', 'antelope'], n: 5 }] }, 400, 18000);
  a('생물', 'seamonsters', '바다 괴물 도감', '뱃사람들이 두려워한 바다 괴물들을 찾아냈다.',
    { ids: ['kraken', 'leviathan', 'zaratan', 'isonade', 'bakunawa', 'jormungandr', 'cipactli', 'f_giantsquid', 'f_oarfish', 'nessie', 'mokele'], n: 6 }, 550, 28000, '괴물 사냥꾼');
  a('생물', 'pets', '개와 고양이', '여러 나라의 개 다섯과 고양이 셋을 만났다.',
    { cats: [{ ids: ['shiba', 'pomeranian', 'pug', 'corgi', 'yorkie', 'shihtzu', 'golden', 'bostonterrier', 'dachshund', 'papillon'], n: 5 },
             { ids: ['siamese', 'russianblue', 'persian', 'angora', 'koreancat'], n: 3 }] }, 250, 10000, '동물 애호가');
  a('생물', 'birds', '하늘을 나는 것들', '바다와 들의 새들을 두루 보았다.',
    { ids: ['albatross', 'frigatebird', 'paradise', 'ostrich', 'flamingo', 'penguin', 'peacock', 'crane', 'eagle', 'falcon', 'parrot', 'kiwi', 'budgie', 'stork'], n: 8 }, 350, 15000);
  a('생물', 'reeffish', '산호초의 물고기', '산호초와 그 둘레의 빛깔 고운 물고기들을 보았다.',
    { cats: [{ ids: ['reef', 'bluehole'], n: 1 }, { ids: ['clownfish', 'bluetang', 'angelfish', 'lionfish', 'manta', 'f_seadragon', 'jellyfish'], n: 4 }] }, 300, 14000);
  a('생물', 'naturalist', '박물학자', '생물 발견 마흔 가지를 기록했다.',
    { cats: [{ cat: 'creature', n: 40 }] }, 600, 30000, '박물학자');

  // ------------------------------------------------------------------ 자연
  a('자연', 'roofs', '세계의 지붕', '하늘에 닿은 이름난 산들을 보았다.',
    { ids: ['everest', 'kailash', 'machapuchare', 'kilimanjaro', 'matterhorn', 'fuji', 'sinai', 'adamspeak', 'huangshan', 'roraima'], n: 5 }, 400, 18000, '산을 보는 사람');
  a('자연', 'falls', '물보라', '세계의 큰 폭포들을 보았다.',
    { ids: ['niagara', 'iguazu', 'angelfalls', 'gullfoss', 'nachi'], n: 4 }, 350, 15000);
  a('자연', 'deserts', '모래와 소금의 바다', '사막과 소금 들판을 건넜다.',
    { ids: ['sahara', 'gobi', 'mojave', 'uyuni', 'deadsea', 'aztlan'], n: 4 }, 350, 15000);
  a('자연', 'perils', '바다의 함정', '배를 삼킨다는 바다의 함정들을 지나왔다.',
    { ids: ['maelstrom', 'corryvreckan', 'bermuda', 'sargasso', 'milkysea'], n: 4 }, 400, 20000, '함정을 건넌 선장');
  a('자연', 'fire', '불과 얼음', '불 뿜는 산과 얼음의 땅을 모두 보았다.',
    { cats: [{ ids: ['vesuvius', 'eyjafjalla', 'lengai', 'hawaii', 'surtsey', 'akrotiri'], n: 3 }, { ids: ['icebergs', 'antarctic', 'aurora', 'hyperborea', 'kingittor'], n: 2 }] }, 400, 20000);

  // ------------------------------------------------------------------ 교역
  a('교역', 'spices', '향신료 사냥꾼', '유럽이 탐내던 향신료를 모두 그 산지에서 찾았다.',
    { ids: ['t_pepper', 't_clove', 't_nutmeg', 't_cinnamon', 't_ginger', 't_allspice'] }, 600, 40000, '향신료 왕');
  a('교역', 'newcrops', '신대륙의 작물', '세계의 밥상을 바꿀 신대륙의 작물을 찾았다.',
    { ids: ['t_maize', 't_potato', 't_cacao', 't_tobacco', 't_sweetpotato', 'rubber'], n: 5 }, 400, 25000);
  a('교역', 'drinks', '세 잔의 음료', '커피와 차, 카카오를 모두 그 산지에서 맛보았다.',
    { ids: ['t_coffee', 't_tea', 't_cacao'] }, 300, 20000);
  a('교역', 'luxuries', '사치품의 길', '향과 보석, 상아 같은 값비싼 물건의 산지를 찾았다.',
    { ids: ['t_musk', 't_frank', 't_ambergris', 't_sandal', 't_pearl', 't_jade', 't_ivory', 't_coral', 't_tortoise', 't_rhino'], n: 6 }, 400, 30000);
  a('교역', 'silkroad', '비단길', '사막을 가로지르는 비단길의 물건과 사람들을 만났다.',
    { ids: ['t_silkraw', 't_jade', 't_musk', 'nestorian', 'genghis', 'timurruby', 'gobi', 'erdenezuu', 'guge'], n: 6 }, 450, 26000, '대상의 벗');

  // ------------------------------------------------------------------ 전설과 사슬
  a('전설과 사슬', 'firstchain', '꼬리에 꼬리를', '앞선 발견이 다음 발견을 부르는 사슬 하나를 끝까지 풀었다.',
    { chains: 1 }, 400, 20000);
  a('전설과 사슬', 'threechains', '전설의 수집가', '사슬 세 갈래를 끝까지 풀었다.',
    { chains: 3 }, 800, 50000, '전설의 수집가');
  a('전설과 사슬', 'allchains', '세상 끝의 이야기꾼', '사슬 열한 갈래를 모두 끝까지 풀었다.',
    { chains: 11 }, 3000, 200000, '세상 끝의 이야기꾼');
  a('전설과 사슬', 'sunken', '가라앉은 대륙들', '무, 아틀란티스, 쿠마리 칸담, 레무리아 — 바다가 삼킨 땅을 모두 찾았다.',
    { ids: ['mu', 'atlantis', 'kumari', 'lemuria'] }, 1500, 100000, '가라앉은 대륙의 발견자');
  a('전설과 사슬', 'paradises', '숨은 낙원', '사람의 발길을 거부하던 숨은 땅 다섯을 찾았다.',
    { ids: ['shambhala', 'penglai', 'avalon', 'hyperborea', 'aztlan', 'paititi', 'ubar', 'prester', 'brendan'], n: 5 }, 1200, 80000, '낙원을 본 사람');
  a('전설과 사슬', 'monsters', '전설의 짐승들', '책에서만 보던 전설의 짐승 열을 제 눈으로 보았다.',
    { ids: ['phoenixw', 'blackdragon', 'chimera', 'cyclops', 'titan', 'reddragon', 'unicorn', 'dragon', 'phoenix', 'roc', 'minotaur', 'yeti', 'apophis', 'fenrir', 'jormungandr', 'leviathan', 'mermaid', 'elf', 'troll', 'nessie', 'mokele'], n: 10 }, 900, 50000, '전설의 사냥꾼');

  // ------------------------------------------------------------------ 조합 (분류·지역)
  a('조합', 'allround', '팔방미인', '지리·자연·유적·보물·생물·민족·교역품을 고루 찾았다 (지리 3, 나머지 5가지씩).',
    { cats: [{ cat: 'geo', n: 3 }, { cat: 'nature', n: 5 }, { cat: 'ruin', n: 5 }, { cat: 'treasure', n: 5 }, { cat: 'creature', n: 5 }, { cat: 'people', n: 5 }, { cat: 'trade', n: 5 }] }, 500, 25000, '팔방미인');
  a('조합', 'scholar', '역사가와 박물학자', '유적과 보물 스무 가지씩, 생물과 자연 스무 가지씩을 기록했다.',
    { cats: [{ cat: ['ruin', 'treasure'], n: 40 }, { cat: ['creature', 'nature'], n: 40 }] }, 800, 40000, '학자 제독');
  a('조합', 'onereg', '한 땅을 샅샅이', '한 지역에서 유적·보물·자연·생물을 세 가지씩 찾았다.',
    { oneReg: { cats: ['ruin', 'treasure', 'nature', 'creature'], n: 3 } }, 400, 20000);
  a('조합', 'everyreg', '세계를 누빈 자', '열한 지역 모두에서 발견을 다섯 가지씩 했다.',
    { everyReg: 5 }, 1200, 80000, '세계를 누빈 자');
  a('조합', 'peoples', '세상 사람들', '여러 바닷가와 땅끝의 사람들을 만났다.',
    { cats: [{ cat: 'people', n: 10 }] }, 500, 25000, '사람을 잇는 자');
  a('조합', 'modern', '새 시대의 경이', '근대의 탑과 다리, 운하를 보았다.',
    { ids: ['eiffel', 'liberty', 'bigben', 'panama', 'sydneyopera', 'goldengate', 'cristo', 'brandenburg', 'cntower'], n: 5 }, 400, 30000);
  a('조합', 'stars', '별을 향해', '하늘 너머를 겨누는 사람들의 일을 보았다.',
    { ids: ['hubble', 'iss', 'amundsen', 'kupe'], n: 3 }, 500, 40000, '별을 보는 제독');
})(window.G = window.G || {});
