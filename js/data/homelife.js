/* 자택에서 아이와 보내는 시간 — 할 일(G.HOME_ACTS)과 집에 들어설 때 생기는 일(G.HOME_HAPPEN), 아이 그림 고르기(G.FAMILY_LOOK).
   규칙은 js/systems/homelife.js, 장면 그림은 js/art/homeart.js, 조정값은 G.BALANCE.homelife (js/data/base.js).

   아이 그림 (images/portraits/family/): <고장>/daughter_age5 · _age10 · _age15 (+ _half = 무릎상), son_… — 고장 폴더가 없으면 바로 아래 것.
   · 나이: 3~7살 = age5, 8~12살 = age10, 13살부터 = age15 (G.FAMILY_LOOK.stages)
   · 폴더: 딸은 어머니의 고장(여급 그림 묶음과 같은 이름 — iberia·france·korea…, I.maidStyle), 아들은 제독의 생김새(I.heroLook — sea_dog·muscle_swordsman…). 폴더에 없으면 기본 그림.

   할 일 한 가지 = { id, name, icon, min·max(나이), pic(장면 그림 이름), cost(금화), days(걸리는 날), need(조건 이름), once(평생 한 번),
     intro: [줄…], pick: {text, opts:[{label, cost, fx, say}]}, fx: {bond, str, int, mar, cha, sk:{특기:상한}, keep:'추억 이름'}, done: [줄…], cold: [줄…] }
   줄 = 'k:…'(아이가 말함) · 'w:…'(아내) · 'n:…'(설명). {name} = 아이 이름. 줄이 배열이면 그 가운데 하나.
   cold = 사이가 나쁠 때(30 미만) 아이의 첫마디. */
(function (G) {
  'use strict';
  G.FAMILY_LOOK = {
    stages: [[3, 5], [8, 10], [13, 15]],          // [이 나이부터, 그림 번호]
    scale: { 5: 0.6, 10: 0.76, 15: 0.92 },        // 대화창 위에 설 때의 키 (어른 = 1)
  };

  G.HOME_ACTS = [
    // ------------------------------------------------ 어린아이 (3~7살)
    { id: 'toyship', name: '대야에 장난감 배를 띄운다', icon: 'sail', min: 3, max: 7, pic: 'yard',
      intro: ['n:마당의 대야에 물을 받고, 나무를 깎아 만든 작은 배를 띄웠다.', ['k:아빠 배도 이렇게 가? 바람은 어디서 불어?', 'k:이 배는 내 배야! 이름은… 고래호!']],
      pick: { text: '{name}의 배가 대야 한가운데에 멈춰 섰다.', opts: [
        { label: '입으로 바람을 불어 준다', fx: { bond: 7, cha: 1 }, say: 'k:간다, 간다! 아빠 바람 세다! 한 번 더!' },
        { label: '돛이 바람을 받는 이치를 알려 준다', fx: { bond: 5, int: 2 }, say: 'k:그러면 돛을 이렇게 돌리면… 어, 진짜 간다!' }] },
      cold: ['k:……(대야 건너편에 쪼그려 앉아 배만 본다)'] },
    { id: 'ride', name: '목말을 태우고 부두를 걷는다', icon: 'anchor', min: 3, max: 7, pic: 'harbor',
      intro: ['n:{name:을/를} 어깨에 올리고 해 질 녘의 부두를 걸었다.', ['k:우와, 높다! 저 배가 아빠 배야?', 'k:갈매기다! 아빠, 저 끝까지 가자!']],
      fx: { bond: 7, str: 1 }, done: ['k:내일도 또 태워 줘. 약속!'], cold: ['k:……(어깨 위에서 한참 말이 없다가, 슬며시 머리를 붙잡는다)'] },
    { id: 'draw', name: '함께 그림을 그린다', icon: 'feather', min: 3, max: 9, pic: 'drawing',
      intro: ['n:탁자에 종이를 펴고 숯 조각을 하나씩 나눠 쥐었다.', ['k:이건 아빠, 이건 엄마, 이건 나! 그리고 이건 배야.', 'k:아빠는 고래 그려 줘. 아주 큰 걸로!']],
      fx: { bond: 6, cha: 1, keep: 'drawing' }, done: ['k:이 그림은 아빠 줄게. 배에 걸어 놔!'], cold: ['k:……(말없이 종이 귀퉁이에 작은 배를 그린다)'] },
    { id: 'lullaby', name: '뱃노래를 불러 재운다', icon: 'moon', min: 3, max: 6, pic: 'night',
      intro: ['n:잠자리에 누운 {name}의 머리맡에서, 낮은 목소리로 뱃노래를 불렀다.', ['k:아빠… 그 노래 또 불러 줘…', 'k:바다에도 밤이 와…?']],
      fx: { bond: 6, cha: 1 }, done: ['w:벌써 잠들었네요. 당신 노래를 들으면 금방 자요.'], cold: ['k:……(등을 돌리고 눕지만, 노래가 끝날 때까지 귀를 기울인다)'] },
    // ------------------------------------------------ 소년·소녀 (8~12살)
    { id: 'sword', name: '목검으로 대련한다', icon: 'sword', min: 8, max: 14, pic: 'swords',
      intro: ['n:마당에서 목검 두 자루를 꺼냈다.', ['k:오늘은 꼭 한 대 맞힐 거예요, 아버지!', 'k:자세는 이렇게… 맞죠? 덤비세요!']],
      pick: { text: '{name}의 목검이 허공을 가른다. 어떻게 받아 줄까?', opts: [
        { label: '일부러 한 대 맞아 준다', fx: { bond: 8, cha: 1 }, say: 'k:맞혔다! 봤어요? 제가 아버지를 맞혔어요!' },
        { label: '봐주지 않고 제대로 가르친다', fx: { bond: 4, mar: 2, str: 1, sk: { sword: 1 } }, say: 'k:아야… 한 번 더요! 이번엔 발을 안 꼬을게요.' }] },
      cold: ['k:…하라면 할게요.'] },
    { id: 'chart', name: '해도를 펴 놓고 항로를 짚어 준다', icon: 'chart', min: 8, max: 15, pic: 'chart',
      intro: ['n:서재의 큰 탁자에 해도를 펼쳤다.', ['k:여기가 우리 집이고… 아버지는 여기까지 가셨어요?', 'k:이 선은 뭐예요? 바다에도 길이 있어요?']],
      fx: { bond: 5, int: 2, sk: { survey: 1 } }, done: ['k:저도 크면 여기, 아무것도 안 그려진 데를 채울래요.'], cold: ['k:……(팔짱을 낀 채 듣지만, 눈은 해도를 따라간다)'] },
    { id: 'fishing', name: '부둣가에서 낚시를 한다', icon: 'fish', min: 8, max: 15, pic: 'pier', days: 1,
      intro: ['n:새벽같이 일어나 낚싯대를 메고 부두 끝에 앉았다.', ['k:쉿, 찌가 움직였어요!', 'k:아버지는 바다 한가운데서도 낚시를 해요?']],
      fx: { bond: 6, str: 1, cha: 1 }, done: ['k:제가 잡은 게 더 커요. 어머니께 보여 드려야지!'], cold: ['k:……(한참 뒤에야) 여긴 조용해서 좋네요.'] },
    { id: 'letters', name: '다른 나라 말을 가르친다', icon: 'book', min: 8, max: 15, pic: 'book', need: 'lang',
      intro: ['n:책상에 책을 펴고, 먼 항구에서 익힌 말을 한 마디씩 따라 하게 했다.', ['k:이 말로 「고맙습니다」는 뭐예요?', 'k:혀가 꼬여요… 다시 한 번만요.']],
      fx: { bond: 4, int: 1, lang: 1 }, done: ['k:나중에 그 항구에 가면 제가 통역할게요!'], cold: ['k:…어디에 쓰는 말인데요.'] },
    { id: 'market', name: '시장에 가서 선물을 사 준다', icon: 'sack', min: 5, max: 12, pic: 'market',
      intro: ['n:{name}의 손을 잡고 시장 골목을 돌았다.', ['k:아버지, 저것 좀 보세요!', 'k:하나만… 하나만 사 주세요.']],
      pick: { text: '{name}에게 무엇을 사 줄까?', opts: [
        { label: '팽이와 인형', cost: 60, fx: { bond: 6, cha: 2 }, say: 'k:고맙습니다! 친구들한테 자랑할래요!' },
        { label: '그림이 든 책', cost: 150, fx: { bond: 6, int: 2 }, say: 'k:바다 괴물 그림이다! 밤에 읽어 주세요.' },
        { label: '작은 나침반', cost: 400, fx: { bond: 10, int: 1, sk: { nav: 1 }, keep: 'compass' }, say: 'k:진짜 나침반…! 어디를 가도 북쪽을 알 수 있어요!' },
        { label: '구경만 하고 돌아온다', fx: { bond: 2 }, say: 'k:…다음엔 꼭이에요.' }] },
      cold: ['k:……(한 걸음 떨어져서 따라온다)'] },
    // ------------------------------------------------ 다 자란 아이 (13살부터)
    { id: 'chess', name: '체스를 둔다', icon: 'crown', min: 11, max: 99, pic: 'chess', need: 'chess',
      intro: ['n:난롯가에 체스판을 놓고 마주 앉았다.', ['k:이번에는 봐주지 마세요.', 'k:아버지 차례예요. 오래 생각하시네요?']],
      fx: { bond: 5, int: 1 }, cold: ['k:…한 판만 둘게요.'] },
    { id: 'stars', name: '별로 위도를 재는 법을 가르친다', icon: 'star', min: 12, max: 99, pic: 'stars',
      intro: ['n:맑은 밤, 지붕 위 난간에 사분의를 놓았다.', ['k:저 별이 북극성이에요? 생각보다 흐리네요.', 'k:별의 높이가 곧 우리가 있는 곳… 신기해요.']],
      fx: { bond: 5, int: 1, sk: { nav: 2 } }, done: ['k:구름만 없으면 어디서든 집으로 돌아올 수 있겠네요.'], cold: ['k:…별은 혼자서도 봤어요. 아버지가 안 계실 때.'] },
    { id: 'ledger', name: '집안 장부를 맡겨 본다', icon: 'coin', min: 13, max: 99, pic: 'ledger',
      intro: ['n:금고의 장부와 영수증 뭉치를 {name} 앞에 내려놓았다.', ['k:이걸 제가요? …해 볼게요.', 'k:여기 셈이 안 맞아요. 누가 덜 받았네요.']],
      fx: { bond: 4, int: 1, sk: { acct: 2 }, gold: 1 }, done: ['k:다 맞췄어요. 새는 돈도 찾았고요.'], cold: ['k:…일은 일이니까요.'] },
    { id: 'duel', name: '진검으로 겨룬다', icon: 'sword', min: 15, max: 99, pic: 'duel',
      intro: ['n:마당에 나가 날을 죽인 칼 두 자루를 뽑았다.', ['k:이제 목검은 졸업입니다. 갑니다!', 'k:아버지, 손에 힘을 빼지 마십시오.']],
      fx: { bond: 4, mar: 2, sk: { sword: 3 } }, done: ['k:…아직 멀었군요. 하지만 지난번보다는 오래 버텼습니다.'], cold: ['k:…봐주실 필요 없습니다.'] },
    { id: 'dream', name: '앞날을 이야기한다', icon: 'compass', min: 13, max: 99, pic: 'window', need: 'dream',
      intro: ['n:바다가 보이는 창가에 나란히 섰다.'], cold: ['k:…제 앞날이요. 물어봐 주신 건 처음이네요.'] },
    // ------------------------------------------------ 온 가족
    { id: 'dinner', name: '온 가족이 둘러앉아 저녁을 먹는다', icon: 'bread', family: true, pic: 'dinner', gap: 30,
      intro: ['n:긴 식탁에 온 가족이 둘러앉았다. 스튜 냄새가 집 안에 가득하다.', 'w:이렇게 다 같이 먹는 게 얼마 만이에요. 많이 드세요.'],
      fx: { bond: 3, rest: 1 }, done: [['k:아버지, 바다에서는 뭘 먹어요? 비스킷에 벌레 나온다던데 진짜예요?', 'k:어머니 스튜가 세상에서 제일 맛있어요.']] },
    { id: 'portrait', name: '화가를 불러 가족 그림을 남긴다', icon: 'feather', family: true, pic: 'easel', cost: 1500, days: 2, gapYears: 5,
      intro: ['n:화가가 이젤을 세우고 온 가족을 창가에 세웠다.', 'w:움직이지 말래요. …당신, 웃어요. 좀.', ['k:언제까지 서 있어야 해요? 다리 아파요…', 'k:저 좀 크게 그려 주세요!']],
      fx: { bond: 5, keep: 'portrait' }, done: ['n:이틀 뒤, 물감이 채 마르지 않은 그림이 벽에 걸렸다.'] }
  ];

  /* 집에 들어설 때 생기는 일 — { id, min, max, pic, when(조건 이름), lines, pick:{text, opts:[{label, cost, days, fx, say}]} } */
  G.HOME_HAPPEN = [
    { id: 'height', min: 3, max: 15, pic: 'height', when: 'longAway',
      lines: ['k:아버지! 저 이만큼 컸어요! 문설주에 금 그어 주세요!'],
      pick: { text: '문설주에는 지난번에 그은 금이 한참 아래에 남아 있다.', opts: [
        { label: '칼끝으로 새 금을 긋고 해를 새긴다', fx: { bond: 5 }, say: 'k:다음에 오실 때는 여기까지 클 거예요!' },
        { label: '번쩍 들어 올려 본다', fx: { bond: 4, str: 1 }, say: 'k:으악, 내려 주세요! …한 번 더요!' }] } },
    { id: 'gift', min: 3, max: 9, pic: 'shell',
      lines: ['k:아빠! 이거, 바닷가에서 주운 조개로 만들었어. 아빠 줄게!'],
      pick: { text: '{name:이/가} 조개껍데기를 실에 꿴 목걸이를 내민다.', opts: [
        { label: '목에 걸고 다니겠다고 한다', fx: { bond: 5, keep: 'shell' }, say: 'k:진짜지? 바다에서도 빼면 안 돼!' },
        { label: '선실에 잘 걸어 두겠다고 한다', fx: { bond: 3, keep: 'shell' }, say: 'k:응! 잃어버리면 안 돼.' }] } },
    { id: 'birthday', min: 3, max: 15, pic: 'cake', when: 'birthday',
      lines: ['w:당신, 마침 잘 왔어요. 곧 {name}의 생일이에요.', 'k:아버지가 제 생일에 집에 계신 건 처음이에요!'],
      pick: { text: '{name}의 생일이다.', opts: [
        { label: '잔치를 열고 선물을 준다', cost: 300, fx: { bond: 9, cha: 1 }, say: 'k:최고의 생일이에요! 고맙습니다!' },
        { label: '꿀 과자를 사서 조촐하게 축하한다', cost: 40, fx: { bond: 5 }, say: 'k:맛있어요! 내년에도 계실 거죠?' },
        { label: '바다 이야기로 대신한다', fx: { bond: 2, int: 1 }, say: 'k:…이야기도 좋아요. 그런데 과자는 없어요?' }] } },
    { id: 'vase', min: 4, max: 10, pic: 'vase',
      lines: ['n:집에 들어서자마자 와장창 소리가 났다.', 'k:……제가 그런 거 아니에요. 고양이가… 아니, 제가 그랬어요.'],
      pick: { text: '할머니 때부터 내려온 꽃병이 산산조각 나 있다.', opts: [
        { label: '다친 데는 없는지 먼저 살핀다', fx: { bond: 5 }, say: 'k:…안 혼내요? 죄송해요. 다음부터 집 안에서 안 뛸게요.' },
        { label: '함께 조각을 주워 붙여 본다', fx: { bond: 4, int: 1 }, say: 'k:여기랑 여기가 맞아요! …조금 삐뚤지만 꽃은 꽂을 수 있어요.' },
        { label: '따끔하게 꾸짖는다', fx: { bond: -3, mar: 1 }, say: 'k:…잘못했어요.' }] } },
    { id: 'fever', min: 3, max: 12, pic: 'bed',
      lines: ['w:당신, {name:이/가} 어제부터 열이 나요. 이마가 불덩이예요.'],
      pick: { text: '{name:이/가} 이불 속에서 가쁘게 숨을 쉰다.', opts: [
        { label: '의원을 부른다', cost: 300, fx: { bond: 4 }, say: 'k:…약이 써요. 그래도 아버지가 계셔서 좋아요.' },
        { label: '밤새 곁에서 물수건을 갈아 준다', days: 1, fx: { bond: 9 }, say: 'k:…아버지, 밤새 계셨어요? 이제 안 아파요.' },
        { label: '아내에게 맡긴다', fx: { bond: -2 }, say: 'w:…알겠어요. 제가 볼게요.' }] } },
    { id: 'why', min: 6, max: 14, pic: 'window', when: 'lowBond',
      lines: ['k:아버지는 왜 늘 바다에만 계세요? 다른 집 아버지는 저녁마다 집에 오는데.'],
      pick: { text: '{name:이/가} 창밖의 바다를 보며 묻는다.', opts: [
        { label: '「미안하다. 이번에는 오래 있으마.」', fx: { bond: 6 }, say: 'k:…정말요? 약속이에요.' },
        { label: '「바다 끝에 무엇이 있는지 알고 싶어서다.」', fx: { bond: 2, int: 1 }, say: 'k:…그게 그렇게 궁금해요? …저도 조금은 궁금해요.' },
        { label: '「다 너희를 위해서다.」', fx: { bond: 1 }, say: 'k:…네.' }] } },
    { id: 'stowaway', min: 9, max: 15, pic: 'barrel', when: 'highBond',
      lines: ['n:부두의 선원이 {name}의 귀를 잡고 집으로 데려왔다.', 'n:「제독님 배 식량 통에 숨어 있었습니다요.」', 'k:…저도 바다에 가고 싶었단 말이에요.'],
      pick: { text: '{name:이/가} 고개를 푹 숙이고 서 있다.', opts: [
        { label: '「때가 되면 내 손으로 태워 주마.」', fx: { bond: 6 }, say: 'k:정말이죠? 열두 살이 되면… 꼭이요!' },
        { label: '웃음을 참으며 통에 숨는 법부터 다시 배우라고 한다', fx: { bond: 5, cha: 1 }, say: 'k:…다음엔 안 들킬 거예요. 아, 아니, 안 그럴게요!' },
        { label: '위험한 짓이라고 엄하게 타이른다', fx: { bond: -2, int: 1 }, say: 'k:…네. 죄송합니다.' }] } },
    { id: 'tutor', min: 8, max: 15, pic: 'book', when: 'tutor',
      lines: ['w:가정교사 선생님이 {name} 칭찬을 많이 하셨어요. 배운 것을 보여 드리겠대요.', 'k:아버지, 들어 보세요. 제가 외운 거예요!'],
      pick: { text: '{name:이/가} 떨리는 목소리로 배운 것을 왼다.', opts: [
        { label: '끝까지 듣고 크게 칭찬한다', fx: { bond: 5, cha: 1 }, say: 'k:헤헤… 다음에는 더 긴 것도 외울게요.' },
        { label: '틀린 곳을 하나 짚어 준다', fx: { bond: 2, int: 2 }, say: 'k:아… 거기였구나. 다시 해 볼게요!' }] } },
    { id: 'quarrel', min: 13, max: 99, pic: 'window',
      lines: ['w:당신, {name:과/와} 좀 다퉜어요. 통 말을 안 들어요.', 'k:어머니는 저를 아직도 어린애로 아세요.'],
      pick: { text: '아내와 {name} 사이에 찬바람이 분다.', opts: [
        { label: '두 사람 이야기를 끝까지 들어 준다', fx: { bond: 5, cha: 1 }, say: 'k:…말하고 나니 좀 풀렸어요. 어머니께 사과드릴게요.' },
        { label: '{name}의 편을 든다', fx: { bond: 6 }, say: 'w:당신까지… 알았어요, 내가 졌어요.' },
        { label: '아내의 편을 든다', fx: { bond: -3 }, say: 'k:…아버지는 집에 계시지도 않으면서.' }] } }
  ];

  /* 추억이 담긴 물건 (player.keeps) — 바다에서 가끔 꺼내 보면 피로가 조금 풀린다 */
  G.HOME_KEEPS = {
    drawing: { name: '아이의 그림', icon: 'feather', sea: '선실 벽에 붙여 둔 {name}의 그림을 올려다보았다. 삐뚤빼뚤한 배가 웃음을 준다.' },
    shell: { name: '조개 목걸이', icon: 'heart', sea: '{name:이/가} 꿰어 준 조개 목걸이를 만지작거렸다. 집 앞 바닷가가 떠오른다.' },
    compass: { name: '{name}의 나침반', icon: 'compass', kid: true },
    portrait: { name: '가족 그림', icon: 'house', sea: '함장실에 걸어 둔 가족 그림을 한참 바라보았다. 돌아갈 곳이 있다.' }
  };

  /* 앞날 이야기에서 아이가 품는 꿈 — 가장 높은 능력을 따른다. 해마다 그 능력이 하나 더 자란다 */
  G.HOME_AIMS = {
    str: { name: '탐험가', say: '저는 지도에 없는 땅을 제 발로 밟아 보고 싶습니다.' },
    'int': { name: '학자', say: '저는 별과 바다의 이치를 책으로 남기고 싶습니다.' },
    mar: { name: '무관', say: '저는 칼로 이 집안의 깃발을 지키고 싶습니다.' },
    cha: { name: '상인', say: '저는 온 세상 항구에 우리 집 상관을 세우고 싶습니다.' }
  };
})(window.G = window.G || {});
