/* 기존 12명과 구분되는 초대받지 못한 사도 셋. 원화는 greek-apostles-additions-20261115에서 가져온다.
   호칭은 소속이며 이름은 고유 인명. 기존 포세이돈의 사도 니칸드로스를 교체하지 않는다. */
(function (G) {
  'use strict';
  var K=G.BALANCE.uninvitedApostles;
  var mates=[
    { id: 'apostle_dionysus', name: '암펠리오스', g: 'm', god:'디오니소스', tone:'hidden', st:[70,77,62,84], sk:{music:2,speech:2,cook:1},
      desc:'디오니소스의 사도. 담쟁이 관과 술잔 아래 상처받은 자존심을 감춘다. 초대받지 못한 분노로 다른 두 사도를 끌어들이지만, 패배 뒤에는 웃음으로 덮었던 책임을 인정한다.' },
    { id: 'apostle_poseidon_grey', name: '글라우코스', g: 'm', god:'포세이돈', tone:'noble', st:[79,72,78,68], sk:{nav:2,gun:2,survey:1},
      desc:'포세이돈의 또 다른 사도. 은회색 머리와 차가운 눈매. 니칸드로스와 같은 신을 섬기지만 같은 사람이 아니며, 남의 말에 자신의 항로를 맡긴 일을 끝내 뉘우친다.' },
    { id: 'apostle_hades', name: '멜란티오스', g: 'm', god:'하데스', tone:'hidden', st:[76,82,72,61], sk:{theo:2,ops:2,hist:1},
      desc:'하데스의 사도. 검은 관과 저승의 열쇠, 쌍지창을 지녔다. 죽은 자의 침묵을 지켜야 할 자신이 원한 때문에 유령선을 불러낸 잘못을 스스로 거둔다.' }
  ];
  G.UNINVITED_APOSTLES=mates.map(function(m){
    m.style='gr';m.epithet=m.god+'의 사도';m.lg={4:3,2:2};m.wage=K.wage;m.fame=0;m.y=[1480,1700];m.reg=[];m.eventOnly=true;m.uninvitedApostle=true;
    m.face='portraits/mates/'+m.id;m.halfKey=m.face+'_half';
    if(!G.MATE[m.id]){G.MATES.push(m);G.MATE[m.id]=m;}
    return m.id;
  });
  var rewards=G.UNINVITED_APOSTLE_REWARDS=[
    { id:'ua_ivy_cup',name:'암펠리오스의 담쟁이 잔',kind:'gift',wave:1,price:K.rewards.cupPrice,statBonus:{k:'cha',v:K.rewards.cupCha},
      desc:'유령선의 연회탁에서 건진 담쟁이 무늬 술잔. 술의 흥보다 말의 책임을 떠올리게 한다. 소지하면 매력 +'+K.rewards.cupCha+'. 같은 능력치 보너스는 가장 높은 물건 하나만 적용한다.' },
    { id:'ua_underworld_key',name:'명부의 봉인 열쇠',kind:'tool',wave:1,price:K.rewards.keyPrice,statBonus:{k:'int',v:K.rewards.keyInt},
      desc:'멜란티오스가 유령선에 걸어 둔 봉인을 푸는 청동 열쇠. 닫힌 문의 부호를 헤아리며 죽은 자의 경계를 배운다. 소지하면 지력 +'+K.rewards.keyInt+'. 같은 능력치 보너스는 가장 높은 물건 하나만 적용한다.' },
    { id:'ua_coral_trident',name:'글라우코스의 산호 삼지창',kind:'weapon',wave:2,price:K.rewards.tridentPrice,atk:K.rewards.tridentAtk,style:'thrust',
      desc:'세 갈래 포위를 무너뜨린 뒤 글라우코스가 건넨 산호 장식 삼지창. 파도를 거스르던 날을 기억하며 창끝을 적에게만 향하게 했다. 공격 '+K.rewards.tridentAtk+'. 무기로 장착해야 적용한다.' }
  ];
  rewards.forEach(function(it){it.rare=true;it.reg=[];it.eventOnly=true;if(!G.ITEM[it.id]){G.ITEMS.push(it);G.ITEM[it.id]=it;}});
  G.UNINVITED_APOSTLE_EVENTS={
    covenant:{title:'명부에 없던 세 이름',pic:'olympian-events/uninvited_covenant',lines:[
      [null,'한편, 섬 그늘의 옛 부두. 열두 사도가 올랐다는 배의 소문이 술잔보다 먼저 돌았다. 담쟁이 관의 암펠리오스가 초대장 없는 빈 탁자에 잔을 내려놓는다.'],
      ['apostle_dionysus','열두 잔을 채우고도 내 잔 하나 놓을 자리는 없었다더군. 멜란티오스, 산 자의 잔치는 늘 문을 잠근 채 시작하나?'],
      ['apostle_hades','빈자리가 없었던 것인지, 우리를 셀 마음이 없었던 것인지. 묻지 않은 말은 죽은 자보다 오래 남는다.'],
      ['apostle_dionysus','글라우코스. 저 배에는 니칸드로스가 타고 있다지. 같은 바다를 섬기는데, 네 물결은 셈에도 넣지 않았어. 저 선장이 어느 바다를 건너는지 일깨워 주면 어떻겠나?'],
      ['apostle_poseidon_grey','내 이름을 남의 그림자로 부르지 마라. 포세이돈께 받은 삼지창은 나도 들고 있다. 길을 막아 세우겠다. 그가 직접 내 이름을 묻게.'],
      [null,'검은 열쇠가 물에 닿는다. 오래전에 가라앉은 배의 닻줄이 바위 밑에서 울리고, 포도주 빛 거품 아래로 거대한 다리가 뒤틀린다. 세 사람은 말로 얻지 못한 자리를 폭풍으로 빼앗으려 했다.']
    ]},
    two:{title:'술빛 안개와 죽은 배',pic:'olympian-events/uninvited_two',lines:[
      [null,'나침반 바늘은 제자리를 가리키는데 돛이 반대로 부푼다. 술 냄새 같은 단내가 안개에 섞이고, 물 위에 비친 배 그림자가 하나 더 생긴다. 그 그림자에는 살아 있는 선원이 없다.'],
      ['apostle_dionysus','제독! 잔치 끝에 청하지 않은 손님이 왔다. 암펠리오스라는 이름은 기억해 두게. 빈 잔을 돌려받는 기분을 오늘은 자네도 알 테니.'],
      ['apostle_hades','멜란티오스다. 물밑에 잠든 이름을 깨운 것은 내 열쇠다. 저 배를 네 해도에서 지울 수 있는지 보겠다.'],
      [null,'썩은 돛의 유령선이 포문을 열고, 반대편에서는 크라켄이 머리를 든다. 하나를 가라앉혀도 다른 하나는 물러서지 않는다. 두 괴물을 모두 꺾어야 이 포위를 벗어날 수 있다.']
    ]},
    bridge:{title:'막지 못한 세 번째 파도',pic:'olympian-events/uninvited_covenant',lines:[
      [null,'유령선의 불빛과 크라켄의 마지막 물보라가 꺼졌다. 암펠리오스는 입술까지 올렸던 술잔을 내린다. 젖은 갑판에 새 밧줄이 던져진다. 잠시 숨을 돌릴 틈이다.'],
      [null,'유령선의 부서진 연회탁에서 담쟁이 잔이, 끊어진 봉인 사슬에서 청동 열쇠가 건져진다. 목수들이 다음 파도를 맞기 전에 찢긴 돛과 뱃전을 살핀다.'],
      ['apostle_dionysus','잔이 비었군. ……내가 부른 손님들이 먼저 돌아갈 줄은 몰랐어. 글라우코스, 그 삼지창까지 거두려는 건 아니겠지?'],
      ['apostle_poseidon_grey','내 물결을 네 술잔으로 재지 마라. 이제는 내가 저 선장에게 묻는다.'],
      ['apostle_hades','그만두어라. 열쇠를 너무 깊이 돌리면 문밖으로 무엇이 나오는지 나조차 고를 수 없다.'],
      [null,'은회색 머리의 사도가 삼지창을 물속에 박는다. 유령선의 꺼진 등불이 다시 타오르고, 너울 아래로 길고 푸른 몸이 지나간다. 이번에는 셋이다.']
    ]},
    three:{title:'세 갈래의 검은 포위',pic:'olympian-events/uninvited_three',lines:[
      ['apostle_poseidon_grey','글라우코스다. 부서진 바닷길의 이름을 네가 어떻게 적는지 보겠다. 니칸드로스의 항로가 바다의 전부는 아니다!'],
      [null,'왼편에는 되살아난 유령선, 정면에는 크라켄, 오른편에는 길게 솟은 바다뱀. 세 그림자가 기함으로 조여든다. 어느 하나의 깃발을 꺾는 싸움이 아니다. 셋을 모두 쓰러뜨려야 파도가 열린다.'],
      ['apostle_hades','이제 물러서기에는 너무 많이 깨웠다. 제독, 네가 이들을 막는다면 ……내 손으로 잠근 문은 내가 닫겠다.']
    ]},
    reconciliation:{title:'초대장 대신 내민 손',pic:'olympian-events/uninvited_reconciliation',lines:[
      [null,'세 번째 물기둥이 가라앉는다. 멜란티오스가 검은 열쇠를 거꾸로 돌리자 유령선의 사슬이 모래처럼 풀린다. 글라우코스는 삼지창을 내려놓고, 암펠리오스는 한 방울 남은 포도주를 바다에 따른다.'],
      ['apostle_dionysus','청하지 않은 자리라고 판을 엎었으니, 우스운 것은 내가 되었군. 자네의 승리는 술 탓으로 돌리지 않겠네. 암펠리오스. 이번에는 그 이름으로 고개를 숙이지.'],
      ['apostle_poseidon_grey','남의 말에 내 항로를 내준 것은 나였다. 니칸드로스와 겨루고 싶었던 마음을 네 배에 들이댔군. 글라우코스라는 이름으로 그 빚을 갚겠다.'],
      ['apostle_hades','잠든 자를 내 원한의 노로 삼았다. 그들이 쉬는 문은 다시 잠갔다. 멜란티오스. 열쇠는 지키는 데 쓰고, 여는 일에는 네 허락을 구하겠다.']
    ]},
    highfive:{title:'같은 바다를 치는 두 손',pic:'olympian-events/uninvited_poseidon_highfive',objectFit:'contain',lines:[
      [null,'글라우코스가 삼지창을 거두자 니칸드로스가 갑판 한가운데로 걸어 나온다. 서로 다른 편에 섰던 동료들이 길을 비킨다. 두 포세이돈 사도 사이에 젖은 밧줄 한 가닥만 놓여 있다.'],
      ['apostle_poseidon','내 그림자라 불리는 것이 싫었다지. 오늘 자네 물결은 똑똑히 봤네, 글라우코스. 저만한 힘을 내 배 곁에서 썼다면 든든했겠어.'],
      ['apostle_poseidon_grey','너를 꺾어야 내 이름이 남을 줄 알았다. 하지만 부서진 것은 네 이름이 아니라 내가 지켜야 할 배였군.'],
      ['apostle_poseidon','이름은 들었고, 솜씨도 봤네. 다음 물결은 같은 편에서 받자. 자, 손.'],
      [null,'니칸드로스가 무릎을 굽혀 몸을 틀고 팔을 크게 휘두른다. 글라우코스도 한 발을 힘껏 내디디며 손을 뻗는다. 열린 두 손바닥이 허공에서 마주친다. 짝! 그 소리에 양쪽 동료들이 움켜쥐었던 손을 푼다.'],
      ['apostle_poseidon_grey','글라우코스다. ……같은 바다에 길이 하나뿐일 이유는 없겠지. 다음번에는 네 옆을 맡겠다.'],
      [null,'니칸드로스는 이를 드러내며 웃고, 글라우코스의 굳었던 입가에도 작은 웃음이 번진다. 암펠리오스가 빈 잔을 들어 답하고 멜란티오스는 열쇠를 품에 넣는다. 경계를 이루던 두 줄의 동료들이 같은 뱃전으로 다가선다.']
    ]},
    join:[
      ['apostle_dionysus','선원 명부를 펴 주게. 잔을 채우는 일도, 내 잘못을 갚는 일도 암펠리오스가 먼저 나서겠네.'],
      ['apostle_poseidon_grey','내 삼지창은 뱃전 안에 묶겠다. 다음 폭풍에서는 네 앞길이 아니라 네 배의 옆구리를 지키지.'],
      ['apostle_hades','멜란티오스의 자리는 밤 당직에 두어라. 돌아오지 못한 이름을 잊지 않고, 살아 있는 이가 그 뒤를 따르지 않도록 지켜보겠다.']
    ],
    losses:[
      ['apostle_dionysus','아직 대답할 힘이 남지 않았나 보군. ……가게. 닻줄마저 끊어 버리려던 것은 아니야. 다음에는 그 잔을 끝까지 받아 보게.'],
      ['apostle_hades','돌아가라. 오늘은 더 깨우지 않겠다. 배를 고치고 돌아오면, 열지 못한 문 앞에서 다시 보게 될 것이다.']
    ]
  };
})(window.G = window.G || {});
