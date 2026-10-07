/* 동물·식물을 발견했을 때 부하들끼리 주고받는 말 (js/systems/banter.js 가 고르고 띄운다)
   - 말투 12가지: 남자 — 돌진형·귀공자형·상인형·숨은 능력자형·천재형·소년 만화형 / 여자 — 매혹녀형·귀여운형·츤데레형·항시 불만형·일반형·예의바른형
     부하마다 생김새(옷차림·나이·장식)와 능력치로 정해진다(banter.js toneOf). G.MATES 에 tone: '…' 을 적으면 그것이 먼저.
   - 한 번에 세 마디: 한 사람이 엉뚱한(또는 그럴듯한) 생각을 내놓고 → 다른 사람이 받고 → 처음 사람이 맞받거나 바로 저질러 버린다.
   - 「생각」(IDEAS)은 동사 앞부분만 적는다: '공격해 ' + '볼까요' / '보겠습니다' / '보자' …  위험도(risk): danger(위험) · silly(엉뚱) · ok(괜찮음) · myth(전설)
   글자리: {obj} 발견물 이름(부르는 이름), {obj을}·{obj이}·{obj은}·{obj와}·{obj이라}·{obj이구나} 조사 붙여서, {pre} 생각의 동사 앞부분, {a} 먼저 말한 부하 이름, {nation} 제독의 나라 */
(function (G) {
  'use strict';
  G.BANTER = {
    toneName: {
      rush: '돌진형', noble: '귀공자형', merch: '상인형', hidden: '숨은 능력자형', genius: '천재형', shonen: '소년 만화형',
      charm: '매혹녀형', cute: '귀여운형', tsun: '츤데레형', grumpy: '항시 불만형', plain: '일반형', polite: '예의바른형'
    },
    male: ['rush', 'noble', 'merch', 'hidden', 'genius', 'shonen'],
    female: ['charm', 'cute', 'tsun', 'grumpy', 'plain', 'polite'],

    // 생각: pre(동사 앞부분), act(바로 저지르는 말 — go: 덤벼듦, talk: 말을 건다)
    ideas: {
      attack: { pre: '공격해 ', act: 'go' }, pet: { pre: '쓰다듬어 ', act: 'go' }, tame: { pre: '길들여 ' },
      ride: { pre: '등에 올라타 ', act: 'go' }, takeHome: { pre: '배에 데려가 ' }, race: { pre: '달리기 시합을 해 ', act: 'go' },
      bone: { pre: '뼈를 하나 들고 가 ' }, rebuild: { pre: '뼈를 맞춰 다시 세워 ' }, teach: { pre: '말을 가르쳐 ' }, shake: { pre: '악수를 해 ', act: 'go' },
      hug: { pre: '안아 ', act: 'go' }, name: { pre: '이름을 지어 ' }, feather: { pre: '깃털을 하나만 얻어 ' }, flyAfter: { pre: '따라서 날아 ', act: 'go' },
      swim: { pre: '같이 헤엄쳐 ', act: 'go' }, catch: { pre: '잡아 ' }, eat: { pre: '구워 먹어 ' }, handle: { pre: '손바닥에 올려 ', act: 'go' },
      climb: { pre: '올라가 ', act: 'go' }, mast: { pre: '베어다 돛대로 써 ' }, fruit: { pre: '열매를 따 먹어 ' }, ball: { pre: '수액으로 공을 만들어 ' },
      paper: { pre: '종이를 만들어 ' }, rideLeaf: { pre: '잎 위에 올라타 ', act: 'go' }, smell: { pre: '냄새를 맡아 ', act: 'go' },
      finger: { pre: '손가락을 넣어 ', act: 'go' }, hair: { pre: '머리에 꽂아 ' }, taste: { pre: '한 입 먹어 ', act: 'go' },
      talk: { pre: '말을 걸어 ', act: 'talk' }, flyRide: { pre: '등에 타고 날아 ' }
    },
    // 갈래 → [생각, 위험도] 여럿 (그 가운데 하나)
    kinds: {
      predator: [['attack', 'danger'], ['pet', 'danger'], ['tame', 'danger']],
      big: [['ride', 'ok'], ['tame', 'ok'], ['takeHome', 'silly']],
      brute: [['ride', 'danger'], ['attack', 'danger']],
      runner: [['race', 'silly'], ['ride', 'silly']],
      fossil: [['bone', 'silly'], ['rebuild', 'silly']],
      ape: [['teach', 'silly'], ['shake', 'ok'], ['takeHome', 'ok']],
      small: [['takeHome', 'ok'], ['hug', 'ok'], ['name', 'ok']],
      dog: [['takeHome', 'ok'], ['pet', 'ok'], ['name', 'ok']],
      cat: [['pet', 'ok'], ['takeHome', 'ok']],
      reptile: [['pet', 'ok'], ['takeHome', 'ok']],
      bird: [['feather', 'ok'], ['flyAfter', 'silly']],
      talker: [['teach', 'ok'], ['takeHome', 'ok']],
      sea: [['ride', 'silly'], ['swim', 'silly']],
      fish: [['catch', 'ok'], ['eat', 'ok']],
      venomfish: [['eat', 'danger'], ['catch', 'danger']],
      venom: [['handle', 'danger']],
      tree: [['climb', 'ok'], ['mast', 'silly']],
      flower: [['smell', 'silly'], ['hair', 'silly']],
      dragon: [['talk', 'myth'], ['ride', 'danger']],
      giant: [['talk', 'myth']],
      mythbird: [['flyRide', 'myth'], ['talk', 'myth']],
      mythbeast: [['tame', 'myth'], ['talk', 'myth']]
    },
    // 발견물 → 갈래 (없으면 이름으로 짐작: banter.js kindOf)
    kindOf: {
      tiger: 'predator', whitetiger: 'predator', lion: 'predator', hyena: 'predator', cheetah: 'predator', cloudleopard: 'predator', polarbear: 'predator',
      moonbear: 'predator', floridawolf: 'predator', hudsonwolf: 'predator', arcticwolf: 'predator', graywolf: 'predator', himalwolf: 'predator',
      coyote: 'predator', dingo: 'predator', crocodile: 'predator', komodo: 'predator', boa: 'predator',
      llama: 'big', moose: 'big', elephant: 'big', giraffe: 'big', zebra: 'big', shire: 'big', friesian: 'big', redhare: 'big', buffalo: 'big', tortoise: 'big',
      rhino: 'brute', hippo: 'brute', warthog: 'brute',
      ostrich: 'runner', antelope: 'runner', kangaroo: 'runner', roadrunner: 'runner',
      brachio: 'fossil', trex: 'fossil', trike: 'fossil', stego: 'fossil', smilodon: 'fossil', mammoth: 'fossil',
      chimp: 'ape', gorilla: 'ape', mandrill: 'ape', lemur: 'ape',
      prairiedog: 'small', sable: 'small', panda: 'small', porcupine: 'small', meerkat: 'small', fennec: 'small', redpanda: 'small', squirrel: 'small',
      koala: 'small', platypus: 'small', otter: 'small', armadillo: 'small', anteater: 'small', skunk: 'small', penguin: 'small', kiwi: 'small',
      shiba: 'dog', pomeranian: 'dog', pug: 'dog', corgi: 'dog', yorkie: 'dog', shihtzu: 'dog', golden: 'dog', bostonterrier: 'dog', dachshund: 'dog', papillon: 'dog',
      siamese: 'cat', russianblue: 'cat', persian: 'cat', angora: 'cat', koreancat: 'cat',
      iguana: 'reptile', chameleon: 'reptile', hermitcrab: 'reptile',
      frigatebird: 'bird', albatross: 'bird', paradise: 'bird', flamingo: 'bird', peacock: 'bird', vinousbird: 'bird', crane: 'bird', eagle: 'bird', falcon: 'bird',
      mallard: 'bird', stork: 'bird', turkey: 'bird', ploverbird: 'bird',
      parrot: 'talker', budgie: 'talker',
      narwhal: 'sea', manatee: 'sea', humpback: 'sea', whale: 'sea', dolphin: 'sea', sealion: 'sea', manta: 'sea',
      coelacanth: 'fish', f_bluefin: 'fish', f_swordfish: 'fish', f_sturgeon: 'fish', f_flying: 'fish', f_sunfish: 'fish', f_marlin: 'fish', f_oarfish: 'fish',
      f_seadragon: 'fish', shiri: 'fish', flyingfish: 'fish', sailfish: 'fish', angelfish: 'fish', clownfish: 'fish', bluetang: 'fish', lobster: 'fish',
      f_puffer: 'venomfish', pufferfish: 'venomfish', lionfish: 'venomfish', tarantula: 'venom', jellyfish: 'venom',
      rubber: 'tree', sequoia: 'tree', breadfruit: 'tree', mangrove: 'tree',
      lotus: 'flower', rafflesia: 'flower', welwitschia: 'flower', papyrus: 'flower', carnivplant: 'flower', startower: 'flower', bullocho: 'flower',
      reddragon: 'dragon', dragon: 'dragon', blackdragon: 'dragon', mokele: 'dragon', nessie: 'dragon', xiangliu: 'dragon', bakunawa: 'dragon', leviathan: 'dragon',
      apophis: 'dragon', jormungandr: 'dragon', yakumama: 'dragon', cipactli: 'dragon', hyeonmu: 'dragon', zaratan: 'dragon', isonade: 'dragon', kraken: 'dragon', f_giantsquid: 'dragon',
      yeti: 'giant', troll: 'giant', minotaur: 'giant', cyclops: 'giant', titan: 'giant', oni: 'giant', dokkaebi: 'giant', gumiho: 'giant', gwisin: 'giant',
      elf: 'giant', mermaid: 'giant', yelbegen: 'giant', chimera: 'giant',
      roc: 'mythbird', phoenix: 'mythbird', phoenixw: 'mythbird', fenrir: 'mythbeast', unicorn: 'mythbeast'
    },
    // 그 발견물만의 생각 (사용자가 든 예: 호랑이는 공격, 연꽃은 잎 위에 올라타기, 용은 말 걸기)
    ideaOf: {
      tiger: [['attack', 'danger']], whitetiger: [['attack', 'danger'], ['pet', 'danger']], lotus: [['rideLeaf', 'silly']],
      dragon: [['talk', 'myth']], reddragon: [['talk', 'myth']], blackdragon: [['talk', 'myth']],
      breadfruit: [['fruit', 'ok']], rubber: [['ball', 'silly']], papyrus: [['paper', 'ok']], rafflesia: [['smell', 'silly']],
      carnivplant: [['finger', 'danger']], startower: [['climb', 'silly']], bullocho: [['taste', 'silly']], sequoia: [['climb', 'ok'], ['mast', 'silly']]
    },
    // 부르는 이름 (발견물 이름이 짐승 이름이 아닌 것)
    call: {
      humpback: '혹등고래', manatee: '저 바다짐승', f_oarfish: '바다뱀 같은 놈', f_giantsquid: '거대한 오징어', f_bluefin: '참다랑어 떼',
      f_swordfish: '칼고기', f_sturgeon: '철갑상어', blackdragon: '흑룡', phoenixw: '불사조', gwisin: '귀신', yelbegen: '옐베겐', bullocho: '불로초', titan: '아틀라스'
    },

    // ---------------------------------------------------------------- 말투별 말
    // prop: 생각을 내놓음 / re: 남의 생각을 받음(위험도별) / back: 맞받음(말렸을 때) / cheer: 좋다고 했을 때 / go·talk: 바로 저지름 / stop: 저지른 사람을 보고
    lines: {
      rush: {
        prop: ['제독! 저 {obj}, 제가 먼저 {pre}보겠습니다! 몸이 근질근질합니다!', '생각할 것 없습니다! 저 {obj}, 당장 {pre}봅시다!'],
        re: {
          danger: ['좋소, 나도 끼워 주시오! 둘이 덤비면 못 이길 놈은 없소!', '하하! 위험할수록 피가 끓는구먼!'],
          silly: ['하하하! 재밌겠소! 안 되면 몸으로 부딪치면 그만이지!', '엉뚱하긴 해도 마음에 드오! 나부터 해 보지!'],
          ok: ['좋소! 당장 합시다! 꾸물거릴 시간 없소!', '그럼 내가 앞장서겠소!'],
          myth: ['말 같은 소리! 칼이 더 빠르오!', '전설이든 뭐든 한 대 쳐 보면 알게 될 거요!']
        },
        back: ['걱정 마시오! 나는 늘 앞만 보고 달리는 사람이오!', '…알았소. 대신 다음엔 꼭 내가 먼저요!'],
        cheer: ['좋소, 좋소! 이래서 바다가 좋은 거요!'],
        go: ['생각은 나중에! 간다아아아!', '에잇, 비키시오! 내가 간다!'],
        talk: ['이봐, {obj}! 우리는 {nation}에서 온 모험가들이다! 한판 붙을 테냐, 길을 비킬 테냐!'],
        stop: ['좋아, 나도 간다! 아무도 나를 말리지 마시오!', '하하! 저 친구, 배짱 하나는 마음에 드는군!']
      },
      noble: {
        prop: ['후후, 저 {obj}… 우아하게 {pre}보는 건 어떻겠소? 물론 내 옷이 더럽혀지지 않는 선에서.', '제독, 이런 진귀한 것을 두고 그냥 지나칠 수는 없지요. 저 {obj}, {pre}봅시다.'],
        re: {
          danger: ['이런, 품위 없게. 잘못되면 장례식 옷부터 맞춰야 할 거요.', '용맹한 것과 무모한 것은 다르오. 이건 뒤쪽이오.'],
          silly: ['참으로 기발한 생각이로군요. 칭찬은 아니오만.', '후후, 그런 광경이라면 초상화로 남겨 둘 만하겠소.'],
          ok: ['나쁘지 않군요. 내가 손수 해 드리지요.', '좋소. 이런 일에도 격식이라는 게 있는 법이오.'],
          myth: ['괴물과 담소라니, 이야기책 같군요. 마음에 드오.', '상대가 전설이라면 예법부터 갖춰야겠지요.']
        },
        back: ['걱정 마시오. 나는 무엇을 하든 우아하니까.', '흠, 오늘은 내키지 않는군요. 다음으로 미룹시다.'],
        cheer: ['후후, 함께하니 한결 우아하군요.'],
        go: ['자, 잘 보시오. 이런 일은 이렇게 하는 거요.'],
        talk: ['실례하오, {obj} 님. 우리는 {nation}에서 온 모험가들이오. 차라도 한잔하시겠소?'],
        stop: ['누가 저 사람 좀 말려 주시오. 나는 여기서 구경이나 하겠소.', '이런, 내 장화에 흙이 튀겠군.']
      },
      merch: {
        prop: ['제독, 저 {obj}, {pre}보는 건 어떻습니까? 잘만 하면 값이 꽤 나가겠는데요.', '이건 장사가 됩니다, 제독! 저 {obj}, 일단 {pre}보시죠!'],
        re: {
          danger: ['잠깐, 잠깐! 다치면 치료비는 누가 냅니까? 살아 있어야 값도 받죠!', '그거 남는 장사 아닙니다. 목숨값이 제일 비싸요.'],
          silly: ['그거 사람들 앞에서 하면 구경값 받을 수 있겠는데요?', '말이 됩니까? …아, 말이 되면 얼마 벌 수 있죠?'],
          ok: ['좋습니다! 항구에 데려가면 비싸게… 아, 아닙니다. 귀엽네요.', '좋죠. 밑지는 일은 아니겠군요.'],
          myth: ['말이 통하면 거래도 되겠군요. 털이든 비늘이든 하나만 얻어 가도 값이 열 배요.', '전설 속 존재라… 증명서만 받아 두면 값이 열 배요.']
        },
        back: ['에이, 손해 보는 장사는 안 합니다. 계산은 끝났어요.', '…역시 그만두죠. 남는 게 없겠네요.'],
        cheer: ['좋습니다. 이건 우리끼리 비밀로 하죠. 값이 오르게.'],
        go: ['자자, 가만히 계세요. 값은 후하게 쳐 드릴 테니…'],
        talk: ['안녕하십니까, {obj} 님! {nation}에서 온 상단입니다. 혹시 저희와 거래하실 생각은 없으신지…'],
        stop: ['다치면 품삯에서 깝니다! 누가 좀 말려요!', '아이고, 내 투자금…! 누가 저 사람 좀 붙잡아요!']
      },
      hidden: {
        prop: ['…{obj이라}. {pre}볼까. 별일 아니야.', '…저 {obj}, {pre}봐도 되겠지. 금방 끝나.'],
        re: {
          danger: ['…그만둬. 저 녀석, 우리보다 강해.', '…눈을 봐. 저건 장난이 아니야.'],
          silly: ['…해 봐. 안 될 테니까.', '……(말없이 고개를 젓는다)'],
          ok: ['…나쁘지 않아.', '…조용히 다가가. 겁먹지 않게.'],
          myth: ['…저건 말을 알아들어. 말을 고르는 게 좋을 거야.', '…예전에 비슷한 걸 본 적이 있어. 그때 셋이 돌아오지 못했지.']
        },
        back: ['…농담이야. 아마도.', '……알았어.'],
        cheer: ['…(희미하게 웃는다)'],
        go: ['…(어느새 바로 옆에 다가가 있다)'],
        talk: ['…{obj}. 우리는 {nation}에서 왔다. 해칠 생각은 없다.'],
        stop: ['…(말없이 칼자루에 손을 얹는다)', '…말려. 지금.']
      },
      genius: {
        prop: ['흥미롭군요. 이론상으로는 저 {obj}, {pre}볼 수 있습니다. 실험해 볼까요?', '제 계산이 맞다면 지금이 기회입니다. 저 {obj}, {pre}봅시다.'],
        re: {
          danger: ['계산해 봤는데 성공할 확률은 3할도 안 됩니다. 나머지 7할은 장례식이고요.', '그건 용기가 아니라 자연의 도태입니다.'],
          silly: ['학문적으로는 권하지 않습니다. 어디가 어떻게 잘못될지 너무 뻔하거든요.', '흥미로운 가설이군요. 틀렸다는 걸 증명하는 데 1초면 됩니다.'],
          ok: ['좋은 생각입니다. 관찰 기록도 남겨 두지요.', '좋습니다. 표본으로서 가치가 충분합니다.'],
          myth: ['전설이 사실이라면 지능도 높을 겁니다. 이론상으로는요.', '드디어 학계가 뒤집히겠군요. 기록할 준비 됐습니다.']
        },
        back: ['기록해 두지요. 「실험은 다음 기회에」.', '제 계산이 틀린 적은 없습니다. …거의요.'],
        cheer: ['기록 완료. 오늘은 학문적으로 아주 쓸모 있는 날이군요.'],
        go: ['이론대로라면 이 각도로 다가가면… 잠깐, 바람의 방향이…'],
        talk: ['{obj}여, {nation}의 학자로서 묻겠습니다. 나이가 몇이십니까? 되도록 숫자로 대답해 주십시오.'],
        stop: ['아, 안 돼요! 제 계산에는 저런 변수가 없었다고요!', '누가 저 사람 좀 말려요! 관찰 대상이 하나 줄겠어요!']
      },
      shonen: {
        prop: ['우오오! 저 {obj}! {pre}보자! 나는 세상에서 제일가는 모험가가 될 사나이다!', '제독! 저 {obj}, {pre}보고 싶어요! 가슴이 막 뛰어요!'],
        re: {
          danger: ['멋지다! 나도 같이 간다! 우리 둘이 힘을 합치면…!', '강한 녀석이다! 그래서 더 두근거려!'],
          silly: ['불가능? 그런 건 해 보기 전엔 모르는 거야!', '좋아! 아무도 안 해 본 거라면 내가 처음 하는 거다!'],
          ok: ['좋아! 오늘부터 우리 동료다!', '와! 나도, 나도! 순서 지켜!'],
          myth: ['전설의 존재다! 이겨서 동료로 만들자!', '이거야! 내가 바다에 나온 건 이런 걸 만나려고였어!']
        },
        back: ['포기하지 않는 게 내 길이다!', '쳇, 다음엔 꼭이다! 약속했어!'],
        cheer: ['역시 모험은 최고야!'],
        go: ['간다! 하나, 둘… 셋!'],
        talk: ['이봐, {obj}! 나는 {nation}에서 온 모험가다! 내 동료가 되어라!'],
        stop: ['치사해! 나도 같이 할 거야!', '멋지다…! 아니, 말려야 하나?!']
      },
      charm: {
        prop: ['어머, 저 {obj}… 한번 {pre}볼까요? 내가 눈짓만 해도 얌전해질걸요.', '후후, 제독. 저 {obj}, {pre}보고 싶지 않아요? 나랑 같이.'],
        re: {
          danger: ['어머, 다치면 누가 날 지켜 주지? 그만둬요.', '그 잘생긴 얼굴에 흉터라도 생기면 아깝잖아요.'],
          silly: ['후후, 귀여워라. 그런 엉뚱한 사람, 싫지 않아요.', '어머, 그런 모습 보여 주면 반할지도 몰라요.'],
          ok: ['어머, 좋아요. 이리 와, 착하지.', '좋아요. 나한테 맡겨요. 이런 건 손길이 중요하거든요.'],
          myth: ['어머, 저렇게 큰 분이라면… 내 매력이 통할까요?', '전설 속 존재라니, 오늘 밤은 잠이 안 오겠네요.']
        },
        back: ['후후, 농담이에요. 반쯤은요.', '그럼 대신 당신이 나를 지켜 줘요.'],
        cheer: ['후후, 오늘 밤 이야깃거리가 생겼네요.'],
        go: ['쉿… 가만히 있어, 착하지. 내 눈을 봐.'],
        talk: ['안녕, 멋진 {obj} 님. {nation}에서 온 여자는 처음 보죠?'],
        stop: ['어머머, 누가 저 사람 좀 말려 봐요.', '후후, 용감한 건지 바보인 건지.']
      },
      cute: {
        prop: ['우와앗! 저 {obj}! {pre}봐도 돼요? 네? 네?', '제독님, 제독님! 저 {obj}, {pre}보면 안 돼요? 딱 한 번만요!'],
        re: {
          danger: ['히익! 안 돼요, 안 돼! 잡아먹히면 어떡해요!', '흐에엥, 무서워요… 저 뒤에 숨어 있을게요.'],
          silly: ['와아, 재밌겠다! 저도, 저도 할래요!', '에헤헤, 그거 정말 되면 좋겠다~'],
          ok: ['꺄아~! 너무 귀여워요! 저 먼저요!', '이름은 제가 지을래요! 음… 뭉치!'],
          myth: ['히이잉… 저, 저 무서운 거 싫어요…', '우와… 진짜 전설이다… 꿈 아니죠? 꼬집어 봐요!']
        },
        back: ['에헤헤, 그래도 한 번만요!', '히잉… 알겠어요.'],
        cheer: ['에헤헤, 오늘은 정말 좋은 날이에요!'],
        go: ['살금살금… 살금살금…'],
        talk: ['아, 안녕하세요, {obj} 님! {nation}에서 왔어요! 무, 물지 마세요!'],
        stop: ['히이익! 누, 누가 좀 말려 주세요!', '으아앙, 가지 마요!']
      },
      tsun: {
        prop: ['벼, 별로 궁금한 건 아니지만… 저 {obj}, {pre}볼래? 너를 위해서 하는 거 아니거든!', '흥, 저 {obj}… 내가 {pre}봐 줄 수도 있어. 딱히 하고 싶어서 그러는 건 아니야!'],
        re: {
          danger: ['바, 바보야! 다치면… 다치면 내가 곤란하잖아! 딱히 걱정하는 건 아니고!', '죽고 싶어? …아, 아니, 그냥 물어본 거야!'],
          silly: ['하, 한심하긴! …근데 잘 되면 나도 한 번만 시켜 줘.', '무슨 바보 같은 소리야! …재밌을 것 같긴 하지만.'],
          ok: ['흥, 뭐… 네가 그렇게까지 하고 싶다면야.', '따, 딱히 귀엽다고 생각한 건 아니야!'],
          myth: ['말이 통할 리가 없잖아! …통하면 어쩌지?', '무, 무섭긴 누가 무서워! 손 떨리는 건 추워서야!']
        },
        back: ['흥! 처음부터 할 생각 없었거든!', '아, 알았어! 그만두면 되잖아!'],
        cheer: ['흥, 나쁘지… 나쁘지 않았어.'],
        go: ['보, 보지 마! 집중 안 되잖아!'],
        talk: ['야, {obj}! {nation}에서 온 우리를 얕보면 혼날 줄 알아! …진짜야!'],
        stop: ['바보야! 당장 돌아와! …걱정해서 그러는 거 아니야!', '정말 못 말려! …누가 좀 말려 봐!']
      },
      grumpy: {
        prop: ['하아… 또 이상한 거야? 뭐, 저 {obj}, {pre}보든가. 어차피 내 말은 안 들을 거잖아.', '저 {obj}, {pre}보자고 하면 하겠지. 늘 그렇듯이.'],
        re: {
          danger: ['진심이야? 다치면 붕대 감는 건 또 나겠지. 하아…', '{a}, 너 혼자 해. 난 관 짤 나무나 알아볼게.'],
          silly: ['또 시작이네. 왜 이 배엔 정상인 사람이 하나도 없어?', '그래, 해 봐. 망하면 웃어 줄게.'],
          ok: ['먹이는 누가 줘? 청소는? …알았어, 알았다고.', '좋겠다, 할 일 하나 더 생겨서.'],
          myth: ['전설이고 뭐고 난 집에 갈래.', '봐, 이럴 줄 알았어. 이 항해는 처음부터 이상했다니까.']
        },
        back: ['그래, 그래. 내가 말을 말지.', '봐, 내 말이 맞잖아.'],
        cheer: ['…뭐, 나쁘진 않네. 아주 조금.'],
        go: ['하아, 결국 내가 하는구나.'],
        talk: ['저기요, {obj}. {nation}에서 왔는데요. 그냥 지나가게만 해 줘요. 피곤하거든요.'],
        stop: ['누가 쟤 좀 말려 봐. 난 몰라.', '말려 봤자 소용없어. 늘 그랬잖아.']
      },
      plain: {
        prop: ['제독님, 저 {obj}, {pre}볼까요?', '와, 저게 {obj이구나}… 우리 {pre}볼래요?'],
        re: {
          danger: ['그건 좀 위험하지 않을까요?', '에이, 그러다 다쳐요. 그만둬요.'],
          silly: ['에이, 설마요. 그게 되겠어요?', '하하, 그건 좀…'],
          ok: ['좋네요. 한번 해 봐요.', '괜찮겠는데요? 조심해서 해요.'],
          myth: ['정말… 정말 있었네요. 눈을 의심하겠어요.', '이거 고향에 가서 말하면 아무도 안 믿겠죠?']
        },
        back: ['하하, 그렇죠? 그냥 해 본 말이에요.', '알았어요. 그럼 구경만 할게요.'],
        cheer: ['와, 진짜 좋다. 그렇죠?'],
        go: ['그, 그럼 갑니다!'],
        talk: ['저, 저기요, {obj}! 저희는 {nation}에서 왔어요!'],
        stop: ['누가 쟤 좀 말려 봐요!', '어, 어떡해! 진짜 하네!']
      },
      polite: {
        prop: ['제독님, 실례가 되지 않는다면 저 {obj}, {pre}보아도 되겠습니까?', '제독님의 허락이 있으시다면, 저 {obj}, {pre}보고 싶습니다.'],
        re: {
          danger: ['외람되오나, 그것은 목숨을 거는 일입니다. 다시 생각해 주십시오.', '부디 몸을 아끼십시오. 다치시면 제독님께서 슬퍼하십니다.'],
          silly: ['그, 그런 일이 가능한지는 잘 모르겠습니다만…', '참 재미있는 생각이십니다. …진심이신가요?'],
          ok: ['좋은 생각이십니다. 조심스럽게 해 보지요.', '그렇다면 제가 옆에서 도와드리겠습니다.'],
          myth: ['부디 무례하지 않게 말씀을 거십시오. 이곳의 주인은 저쪽이니까요.', '살아서 이런 존재를 뵙다니, 영광입니다.']
        },
        back: ['송구합니다. 제가 경솔했습니다.', '말씀 고맙습니다. 그럼 조심하겠습니다.'],
        cheer: ['함께할 수 있어 기쁩니다.'],
        go: ['실례하겠습니다… 조심조심…'],
        talk: ['처음 뵙겠습니다, {obj} 님. 저희는 {nation}에서 온 모험가들입니다. 잠시 지나가도 되겠습니까?'],
        stop: ['어, 어서 말려 주십시오! 큰일 납니다!', '아, 아무도 안 말리십니까?']
      }
    },
    // 동료가 둘이 안 될 때 빈자리를 채우는 뱃사람
    fill: [{ name: '갑판장', tone: 'rush', npc: 'boatswain' }, { name: '견습 선원', tone: 'shonen', npc: 'sailor' }]
  };
})(window.G = window.G || {});
