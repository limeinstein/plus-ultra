/* 괴물과 거대한 짐승 (2026-11-17 사용자 요청) — 자료 (앞쪽: 발견물·유물·전리품·그림 시트)
   ■ 사람 모양 괴물과의 일기토: 리치·흡혈귀·늑대인간·해골 기사·트롤·미노타우로스·예티·엘프 (js/systems/creatures.js G.Monsters)
     새 발견물: 세들레츠 납골당의 리치 · 리보니아의 늑대인간 · 크라크 데 슈발리에의 해골 기사 · 세계수 (나머지는 이미 있던 발견물에 이야기를 붙였다)
   ■ 새끼를 지키는 거대한 짐승: 힘센 짐승의 새끼(유물)를 지니고 뭍에 있으면 멀리서 「?」가 빠르게 쫓아온다 (G.Guardian)
     → 새끼를 놓아준다 · 피한다 · 맞서 싸운다(육상전). 이기면 머리 박제 · 공룡은 거대한 머리 화석 · 깃털 달린 것은 깃털 부채
   ■ 그림: Codex가 만든 시트 (images/creature-*-20261117 — 만드는 법은 tools/package_creature_*_20261117.py)
     · 일기토 8종: 2592×1216, 6열×4행(공격·방어·피격·대기), 칸 432×304, 기준점 (165,278) — 기존 일기토 시트와 같은 규격
     · 육상전 28종: 2048×256, 8칸(대기·걷기 좌·걷기 우·공격 준비·돌진·타격·복귀·피격), 칸 256, 기준점 (128,239)
   대사·이야기는 js/data/creaturelines.js (뒤쪽에 읽는다) */
(function (G) {
  'use strict';
  var W = G.WONDERS = G.WONDERS || { list: [], relics: [], books: [], meta: {}, text: {}, leads: {}, front: {} };

  // ---------------------------------------------------------------- 그림 파일 이름표 (images/manifest.js를 다시 만들기 전에도 찾게)
  var DUEL_DIR = { elf: 'creature-combat-20261117', minotaur: 'creature-combat-20261117', troll: 'creature-combat-20261117', yeti: 'creature-combat-20261117',
    lich: 'creature-duel-extra4-20261117', vampire: 'creature-duel-extra4-20261117', werewolf: 'creature-duel-extra4-20261117', skeleton_warrior: 'creature-duel-extra4-20261117' };
  var LAND_A = ['tiger', 'trex', 'komodo', 'reddragon'];
  var LAND_B = ['lion', 'hyena', 'elephant', 'rhino', 'gorilla', 'cheetah', 'whitetiger', 'cloudleopard', 'moonbear', 'boa', 'mammoth', 'unicorn', 'phoenix',
    'smilodon', 'brachio', 'trike', 'stego', 'hippo', 'crocodile', 'polarbear', 'roc', 'mokele', 'nessie', 'warthog'];
  var F = G.IMAGE_FILES = G.IMAGE_FILES || {};
  function file(key) { if (!F[key]) F[key] = key + '.png'; return key; }
  G.CREATURE_ART = { duel: {}, land: {} };
  Object.keys(DUEL_DIR).forEach(function (id) { G.CREATURE_ART.duel[id] = file(DUEL_DIR[id] + '/' + id); });
  LAND_A.forEach(function (id) { G.CREATURE_ART.land[id] = file('creature-combat-20261117/' + id); });
  LAND_B.forEach(function (id) { G.CREATURE_ART.land[id] = file('creature-combat-extra24-20261117/' + id); });

  // 일기토 시트: 기존 규격 그대로 — 그림 열쇠만 더한다 (js/games/duel.js fighterSprite 가 DUEL_ART.fighterFiles 를 먼저 본다)
  if (G.DUEL_ART) {
    G.DUEL_ART.fighterFiles = G.DUEL_ART.fighterFiles || {};
    Object.keys(G.CREATURE_ART.duel).forEach(function (id) { G.DUEL_ART.fighterFiles[id] = G.CREATURE_ART.duel[id]; });
  }
  // 육상전 시트: 짐승마다 한 줄짜리 시트 (G.Sprites — 'cb_<짐승>'). 열쇠는 sprites/ 밖이라 key를 따로 적는다 (js/art/sprites.js keyOf)
  if (G.SPRITE_SHEETS) Object.keys(G.CREATURE_ART.land).forEach(function (id) {
    G.SPRITE_SHEETS['cb_' + id] = { key: G.CREATURE_ART.land[id], cw: 256, ch: 256, px: 128, py: 239, cols: 8, rows: [id], n: [8], h: 200, bh: 150,
      acts: { idle: [0], walk: [1, 0, 2, 0], run: [1, 2], charge: [3, 4, 5], attack: [3, 4, 5, 6], hurt: [7], dead: [7], back: [6, 1, 2], cheer: [3, 0] } };
  });

  // ---------------------------------------------------------------- 새 발견물 (생물) — W.list: [id, 이름, 갈래, 위도, 경도, 찾는 법, 난이도, 가치, 언어, 지역, 설명, 소문, 덧붙임]
  function a(id, name, lat, lon, pw, val, lang, reg, desc, hint, x) {
    x = x || {}; x.r = x.r || 0.6; x.legendBeast = true;   // 전설·미신 (js/data/interests.js myth)
    W.list.push([id, name, 'creature', lat, lon, 'land', pw, val, lang, reg, desc, hint, x]);
  }
  a('lich', '세들레츠 납골당의 리치', 49.962, 15.289, 4, 15000, 4, 1,
    '보헤미아 쿠트나호라 곁 세들레츠 수도원의 납골당. 흑사병과 전쟁으로 죽은 사만 명의 뼈로 샹들리에와 제단을 엮었다. 그 뼈 더미 속에 죽지 못하는 마법사가 산다고 한다.',
    '프라하 동쪽 은광 도시 쿠트나호라의 뼈 성당에, 죽지도 살지도 못한 마법사가 딸의 뼈를 찾고 있다고 한다.', { built: 1400 });
  a('werewolf', '리보니아의 늑대인간', 57.05, 25.30, 3, 11000, 4, 1,
    '발트 바닷가 리보니아의 자작나무 숲. 해마다 세 번의 밤, 늑대가 되어 지옥으로 내려가 마녀들과 싸운다는 늙은 농부의 이야기가 전한다.',
    '리가 동쪽 리보니아 숲에서, 보름밤마다 두 발로 선 늑대가 길을 막는다고 한다.');
  a('deadknight', '크라크 데 슈발리에의 해골 기사', 34.757, 36.294, 4, 14000, 5, 4,
    '시리아 산마루의 거대한 기사단 성채. 1271년 술탄 바이바르스가 위조한 항복 명령서로 무너뜨렸다. 맨 안쪽 탑에는 아직 그 명령을 믿지 않는 기사가 서 있다고 한다.',
    '트리폴리 동쪽 산 위의 기사단 성채 탑에, 녹슨 갑옷을 입은 해골이 아직도 원군을 기다린다고 한다.');
  a('worldtree', '세계수 이그드라실', 61.05, 15.10, 5, 22000, 3, 1,
    '북방 사람들이 아홉 세상을 떠받친다고 믿은 거대한 물푸레나무. 브레멘의 아담은 웁살라 신전 곁에 겨울에도 푸른 큰 나무가 있다고 적었다. 그 뿌리를 엘프들이 지킨다.',
    '웁살라 북서쪽 깊은 숲 속에, 겨울에도 잎이 지지 않는 하늘만 한 나무가 있다고 한다. 엘프들이 사람을 쫓아낸다지.', { bookOnly: true, r: 0.8 });
  (W.leads.b_munster = W.leads.b_munster || []).push('lich');
  (W.leads.b_olaus = W.leads.b_olaus || []).push('werewolf');
  (W.leads.b_edda = W.leads.b_edda || []).push('worldtree');

  // ---------------------------------------------------------------- 새끼를 지키는 거대한 짐승 (G.Guardian)
  // 발견 id: [시트, 이름, 전리품(mount 머리 박제 · fossil 거대한 머리 화석 · fan 깃털 부채), 힘, 머릿수(체력), 그림 배율]
  G.GUARDIANS = {
    tiger: ['tiger', '거대한 어미 호랑이', 'mount', 7, 14, 2.1], whitetiger: ['whitetiger', '서쪽을 지키는 거대한 백호', 'mount', 8, 16, 2.2],
    lion: ['lion', '갈기가 검은 거대한 사자', 'mount', 7, 14, 2.0], hyena: ['hyena', '거대한 우두머리 하이에나', 'mount', 5, 12, 1.9],
    cheetah: ['cheetah', '바람보다 빠른 거대한 치타', 'mount', 5, 10, 1.9], cloudleopard: ['cloudleopard', '나무 위의 거대한 구름표범', 'mount', 6, 12, 2.0],
    moonbear: ['moonbear', '가슴에 흰 달을 단 거대한 반달곰', 'mount', 7, 15, 2.1], polarbear: ['polarbear', '얼음산 같은 거대한 북극곰', 'mount', 8, 18, 2.2],
    komodo: ['komodo', '섬의 왕 거대한 코모도왕도마뱀', 'mount', 6, 14, 2.0], crocodile: ['crocodile', '배만 한 거대한 악어', 'mount', 7, 16, 2.0],
    boa: ['boa', '나무둥치만 한 거대한 보아뱀', 'mount', 6, 14, 2.0], gorilla: ['gorilla', '은빛 등의 거대한 고릴라', 'mount', 7, 15, 2.0],
    elephant: ['elephant', '성난 거대한 어미 코끼리', 'mount', 8, 20, 2.2], rhino: ['rhino', '바위 같은 거대한 코뿔소', 'mount', 8, 18, 2.1],
    hippo: ['hippo', '강을 막아선 거대한 하마', 'mount', 7, 18, 2.1], warthog: ['warthog', '엄니가 낫 같은 거대한 혹멧돼지', 'mount', 5, 12, 1.9],
    unicorn: ['unicorn', '달빛 갈기의 유니콘', 'mount', 7, 14, 2.0], reddragon: ['reddragon', '디나스 엠리스의 붉은 용', 'mount', 11, 26, 2.4],
    mokele: ['mokele', '텔레 호수의 수룡', 'mount', 9, 22, 2.4], nessie: ['nessie', '네스 호의 괴수', 'mount', 8, 20, 2.3],
    smilodon: ['smilodon', '역청 늪에서 걸어 나온 거대한 검치호', 'fossil', 8, 16, 2.2], mammoth: ['mammoth', '언 땅에서 깨어난 거대한 매머드', 'fossil', 9, 22, 2.4],
    trex: ['trex', '신기루에서 걸어 나온 폭군 도마뱀', 'fossil', 10, 24, 2.6], trike: ['trike', '세 뿔의 거대한 트리케라톱스', 'fossil', 9, 22, 2.4],
    stego: ['stego', '등에 판을 세운 거대한 스테고사우루스', 'fossil', 8, 22, 2.4], brachio: ['brachio', '구름에 머리가 닿는 브라키오사우루스', 'fossil', 9, 26, 2.8],
    phoenix: ['phoenix', '오색 불꽃의 봉황', 'fan', 9, 18, 2.1], roc: ['roc', '하늘을 가리는 로크', 'fan', 9, 20, 2.3]
  };

  // ---------------------------------------------------------------- 유물 (js/data/relics.js 가 G.DISC_RELICS 뒤에 읽는다) — [발견, 유물 id, 이름, 종류, 값 배율, 설명, 덧붙임]
  var EGG = '돌처럼 굳은 줄 알았는데 품에 안으니 안에서 무언가 꿈틀거린다. 신기루 속 옛 땅에서 굴러 나온 것이다. 어미가 가만있을 리 없다.';
  G.CREATURE_RELICS = [
    ['whitetiger', 'r_whitetiger_baby', '백호 새끼', 'animal', 0.2, '눈처럼 흰 털에 검은 줄무늬가 막 돋기 시작한 새끼 호랑이. 숲 깊은 곳에서 어미를 부르듯 가늘게 운다.'],
    ['smilodon', 'r_smilodon_baby', '검치호 새끼', 'animal', 0.2, '역청 늪가에서 울고 있던, 송곳니가 아직 손톱만 한 새끼 검치호. 옛날에 사라졌다던 짐승이 어떻게 살아 있는지 아무도 모른다.', { mirageOk: true }],
    ['mammoth', 'r_mammoth_baby', '새끼 매머드', 'animal', 0.2, '언 땅이 녹은 구덩이에서 비틀거리며 걸어 나온 털북숭이 새끼. 긴 코로 선원의 손을 더듬는다.', { mirageOk: true }],
    ['trex', 'r_trex_baby', '티라노사우루스 알', 'animal', 0.2, EGG, { mirageOk: true }],
    ['trike', 'r_trike_baby', '트리케라톱스 알', 'animal', 0.2, EGG, { mirageOk: true }],
    ['stego', 'r_stego_baby', '스테고사우루스 알', 'animal', 0.2, EGG, { mirageOk: true }],
    ['brachio', 'r_brachio_baby', '브라키오사우루스 알', 'animal', 0.2, EGG, { mirageOk: true }],
    ['reddragon', 'r_reddragon_baby', '붉은 용의 알', 'animal', 0.25, '디나스 엠리스 언덕 아래 웅덩이에서 건진 붉은 알. 손에 쥐면 화로처럼 뜨겁고, 이따금 안에서 톡톡 두드리는 소리가 난다.'],
    ['unicorn', 'r_unicorn_baby', '유니콘 망아지', 'animal', 0.25, '이마에 작은 은빛 혹이 돋은 흰 망아지. 아직 뿔이라 부르기엔 이르다. 선원들은 서로 먹이를 주겠다고 다툰다.'],
    ['phoenix', 'r_phoenix_baby', '봉황 새끼', 'animal', 0.25, '오동나무 가지 아래 재 속에서 깨어난 작은 새. 깃털 끝에 다섯 빛깔이 막 물들기 시작했다.'],
    ['roc', 'r_roc_baby', '로크의 알', 'animal', 0.25, '사람 몸통만 한 흰 알. 신드바드가 「하늘을 가리는 새」의 알이라 부른 바로 그것이다. 굴려서 옮겨야 한다.'],
    ['mokele', 'r_mokele_baby', '수룡의 새끼', 'animal', 0.25, '호숫가 갈대 속에서 건진, 목이 긴 도마뱀 같은 새끼. 물통에 넣어 두면 머리만 내밀고 사람을 빤히 본다.'],
    ['nessie', 'r_nessie_baby', '네스 호 괴수의 새끼', 'animal', 0.25, '호숫가 바위틈에 걸려 있던 검푸른 새끼. 목을 길게 빼고 물소리가 나는 쪽을 자꾸 돌아본다.'],
    // 괴물의 유물
    ['lich', 'r_lich_legend', '리치의 부러진 지팡이', 'treasure', 0.3, '끝에 금 간 푸른 돌이 박힌 검은 지팡이. 돌은 이제 숨 쉬듯 깜빡이지 않는다. 쿠트나호라 사람들은 이것을 보면 성호를 긋는다.'],
    ['werewolf', 'r_werewolf_legend', '신의 사냥개의 송곳니', 'treasure', 0.3, '사람 손가락만 한 늑대 송곳니. 리보니아의 늙은 농부가 「다시는 필요 없을 거요」라며 뽑아 준 것이다.'],
    ['deadknight', 'r_deadknight_legend', '기사단 탑의 은잔', 'treasure', 0.35, '성채 맨 안쪽 탑에서 굴러 나온 소박한 은잔. 안쪽에 기사단의 여덟 끝 십자가가 새겨져 있다.'],
    ['worldtree', 'r_worldtree_legend', '세계수의 겨울 잎', 'gift', 0.3, '한겨울에도 시들지 않는 물푸레나무 잎 한 장. 손바닥 위에서 아주 천천히 숨을 쉬는 듯하다.', { gv: 30 }]
  ];
  // 괴물과의 결판에서 얻는 물건 (G.Monsters 의 선택지)
  var IT = [
    { id: 'cr_lich_heart', name: '리치의 심장석', kind: 'treasure', price: 24000, ward: 'deathblow', desc: '오스발트 박사가 제 심장을 담은 푸른 돌. 금이 갔지만 아직 따뜻하다. 지니고 있으면 죽음이 한 걸음 비켜 간다 — 일기토의 일격필살을 막는다. 돌이 있는 한 그는 끝나지 못한다.' },
    { id: 'cr_ilona_locket', name: '일로나의 은 로켓', kind: 'gift', gv: 28, price: 6000, desc: '세베린 백작이 마지막 아침까지 쥐고 있던 작은 은 로켓. 안에는 웃는 여인의 작은 초상이 들어 있다.' },
    { id: 'cr_hell_barley', name: '지옥에서 되찾은 보리 씨앗', kind: 'treasure', price: 5000, desc: '리보니아의 늙은 늑대인간이 마녀들에게서 되찾아 왔다는 보리 씨앗 한 주머니. 어디에 심든 이삭이 무겁게 팬다고 한다.' },
    { id: 'cr_knight_sword', name: '기사 르노의 장검', kind: 'weapon', atk: 18, price: 9000, desc: '이백 년 동안 탑 문을 지킨 기사의 장검. 녹이 슬었어도 날은 살아 있다. 「원군이 온다」는 거짓말 한 마디와 바꾼 칼이다.' },
    { id: 'cr_minotaur_horn', name: '아스테리온의 뿔', kind: 'treasure', price: 8000, desc: '미궁의 소머리 사내에게서 거둔 검은 뿔. 별 무늬처럼 흰 점이 박혀 있다.' },
    { id: 'cr_elf_arrowhead', name: '엘프의 은 화살촉', kind: 'gift', gv: 18, price: 2400, desc: '세계수를 지키던 엘프가 물러나며 떨어뜨린 은 화살촉. 사람의 솜씨로는 이렇게 얇게 벼리지 못한다.' }
  ];
  // 거대한 짐승의 전리품: 머리 박제 · 거대한 머리 화석 · 깃털 부채 (값은 발견 가치에 따라 — js/systems/creatures.js 가 처음 읽을 때 매긴다)
  var TROPHY = { mount: ['머리 박제', 'treasure', '제독의 방 벽에 걸면 손님이 모두 걸음을 멈춘다. 새끼를 지키려다 쓰러진 어미라는 이야기를 들으면 다들 잠시 말이 없어진다.'],
    fossil: ['거대한 머리 화석', 'treasure', '쓰러지자마자 살이 모래처럼 흩어지고 돌이 된 머리만 남았다. 신기루에서 걸어 나온 옛 짐승의 마지막 모습이다.'],
    fan: ['깃털 부채', 'gift', '쓰러진 거대한 새의 깃털로 엮은 부채. 부칠 때마다 깃 끝에서 빛이 일렁인다. 귀부인들이 무엇보다 탐내는 선물이다.'] };
  G.CREATURE_TROPHY = TROPHY;
  if (G.ITEMS && G.ITEM) {
    IT.forEach(function (x) { x.rare = true; x.reg = []; if (!G.ITEM[x.id]) { G.ITEMS.push(x); G.ITEM[x.id] = x; } });
    Object.keys(G.GUARDIANS).forEach(function (id) {
      var g = G.GUARDIANS[id], t = TROPHY[g[2]], tid = 'tr_' + id;
      if (G.ITEM[tid]) return;
      var it = { id: tid, name: '(' + id + ') ' + t[0], kind: t[1], price: 6000, rare: true, reg: [], trophy: id, trophyKind: g[2], desc: t[2] };
      if (t[1] === 'gift') it.gv = 30;
      G.ITEMS.push(it); G.ITEM[tid] = it;
    });
  }
})(window.G = window.G || {});
