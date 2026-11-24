/* 시대 상징을 돛 장식으로 간략화한 도안. 국명 표장은 역사 문장이 아닌 창작임을 명시한다. */
(function(G){'use strict';
  G.SAIL_SHAPES=[
    {id:'native',name:'선종 고유 범장',kind:null,desc:'이 배에 처음 달린 돛 모양과 구성을 복원합니다.'},
    {id:'sq',name:'사각돛',kind:'sq',desc:'가로 활대에 펼친 돛 · 순풍에 유리'},
    {id:'lat',name:'라틴 삼각돛',kind:'lat',desc:'긴 대각선 활대의 삼각돛 · 옆바람·맞바람에 유리'},
    {id:'gaff',name:'사다리꼴 종범장',kind:'lat',desc:'위·아래 활대로 세로로 펼친 돛 · 삼각돛 성능 계열'},
    {id:'bat',name:'대나무 살돛',kind:'bat',desc:'가로 돛살을 넣은 접이식 돛 · 여러 바람에 무난'},
    {id:'tanja',name:'기울어진 탄자돛',kind:'lat',desc:'위·아래 활대 사이의 기울어진 사각돛 · 삼각돛 성능 계열'}
  ];
  G.SAIL_DESIGN_GROUPS={plain:'단색·줄무늬',nation:'국가',royal:'왕실·황실',noble:'귀족·가문',pirate:'해적'};
  var all=G.SAIL_DESIGNS=[],map=G.SAIL_DESIGN={},covered={};
  function add(id,name,group,pattern,motif,ink,field,extra){var d=Object.assign({id:id,name:name,group:group,pattern:pattern,motif:motif,ink:ink||'#ad302c',field:field||null,note:'시대 상징을 간략화한 게임용 돛 장식'},extra||{});all.push(d);map[id]=d;return d;}
  add('plain','단색 천','plain','plain',null);
  add('stripes','세로 줄무늬','plain','stripes',null);
  add('bands','가로 줄무늬','plain','bands',null);
  add('saltire','사선 십자','plain','saltire',null);
  add('diamonds','마름모 띠','plain','diamonds',null);
  function nation(code,name,pattern,motif,ink,field,names){add('nation_'+code,name,'nation',pattern,motif,ink,field);(names||[name.split(' — ')[0]]).forEach(function(n){covered[n]=true;});}
  nation('portugal','포르투갈 — 그리스도 기사단 십자','emblem','christ','#b62c2a',null,['포르투갈']);
  nation('spain','에스파냐 — 부르고뉴 십자','saltire','ragged','#ad2529',null,['에스파냐']);
  nation('castile','카스티야 — 성채','emblem','castle','#d7ae46','#a52b30',['카스티야']);
  nation('aragon','아라곤 — 네 붉은 기둥','fourbars',null,'#ae2c30','#e3bf59',['아라곤']);
  nation('england','잉글랜드 — 성 조지 십자','cross',null,'#ac2d32',null,['잉글랜드','영국']);
  nation('scotland','스코틀랜드 — 성 안드레아 십자','saltire',null,'#eee4c9','#31568b',['스코틀랜드']);
  nation('france','프랑스 — 세 백합','emblem','lilies','#e4bf53','#294d86',['프랑스']);
  nation('dutch','네덜란드 — 오렌지·흰색·푸른색 띠','tricolor',null,'#c47c40','#315a87',['네덜란드']);
  nation('denmark','덴마크 — 흰 십자','cross',null,'#eee5cd','#aa3038',['덴마크']);
  nation('sweden','스웨덴 — 금빛 십자','cross',null,'#d8b24c','#315887',['스웨덴']);
  nation('venice','베네치아 — 날개 달린 사자','emblem','winglion','#ddbb62','#973633',['베네치아']);
  nation('genoa','제노바 — 붉은 십자','cross',null,'#ac2d32',null,['제노바']);
  nation('papal','교황령 — 교차한 열쇠','emblem','keys','#c7a451',null,['교황령']);
  nation('russia','러시아 — 쌍두독수리','emblem','doubleeagle','#40332b','#d0ac58',['러시아','모스크바 대공국']);
  nation('poland','폴란드 — 흰 독수리','emblem','eagle','#eee5cf','#a62d37',['폴란드']);
  nation('joseon','조선 — 태극 표장','emblem','taeguk','#ae383a',null,['조선']);
  nation('ming','명 — 일월 표장','emblem','sunmoon','#d6ac48','#9f3030',['명','남명']);
  nation('qing','청 — 용 표장','emblem','dragon','#355b79','#d2ad4b',['청','후금']);
  nation('japan','일본 — 붉은 해','emblem','sun','#b33632',null,['일본']);
  nation('ottoman','오스만 제국 — 초승달 표장','emblem','crescent','#e7d8b2','#416654',['오스만 제국']);
  function royal(id,name,motif,field,ink,extra){return add('royal_'+id,name,'royal','shield',motif,ink||'#d6b35c',field,extra);}
  royal('avis','아비스 왕가 — 포르투갈 방패','portugal','#a73232','#e7d9b1');
  royal('braganza','브라간사 왕가 — 왕관과 포르투갈 방패','portugal','#315d54','#e7d9b1',{crown:true});
  royal('habsburg','합스부르크 왕가 — 쌍두독수리','doubleeagle','#d6b456','#352e2b',{crown:true});
  royal('bourbon','부르봉 왕가 — 세 백합','lilies','#2c4f86','#e5bd50',{crown:true});
  royal('tudor','튜더 왕가 — 겹장미','rose','#a03335','#e9d8ac',{crown:true});
  royal('stuart','스튜어트 왕가 — 사자와 백합 분할 방패','quartered','#9f3134','#e4ba51',{crown:true});
  royal('oldenburg','올덴부르크 왕가 — 붉은 가로띠','twobars','#d8b45c','#b53534',{crown:true});
  royal('vasa','바사 왕가 — 곡식단','sheaf','#315889','#e3bd58',{crown:true});
  royal('romanov','로마노프 왕가 — 쌍두독수리','doubleeagle','#d3b255','#342e2c',{crown:true});
  royal('joseon','조선 왕실 — 용보','dragon','#a23135','#d8b354',{crown:true,note:'오조룡보를 참고한 원형 용 장식. 왕실 의복의 문양을 돛용으로 재구성'});
  royal('ming','명 황실 — 용 표장','dragon','#cfad4f','#90402e',{crown:true});
  royal('qing','청 황실 — 용과 여의주','dragon','#d6b356','#315774',{crown:true});
  royal('japan','일본 황실 — 국화','chrysanthemum','#4f4269','#d9b55b');
  royal('ottoman','오스만 왕실 — 튜그라풍 표장','calligraphy','#375c53','#d9b65d',{note:'왕실 서명 형식에서 착안한 창작 장식이며 특정 술탄의 실제 튜그라 복제가 아님'});
  royal('mughal','무굴 황실 — 해 표장','sun','#863b42','#dbb55c',{note:'황실의 태양 상징을 간략화한 게임용 장식'});
  function noble(id,name,motif,field,ink){add('noble_'+id,name,'noble','shield',motif,ink,field);}
  noble('medici','메디치 가문 — 여섯 구슬','medici','#dabb5a','#b43936');
  noble('farnese','파르네세 가문 — 여섯 백합','sixlilies','#d9b95b','#335389');
  noble('orange','오라녜나사우 가문 — 금빛 사자','lion','#31548b','#dfb652');
  noble('percy','퍼시 가문 — 푸른 사자','lion','#deba5b','#31568c');
  noble('douglas','더글러스 가문 — 별과 심장','douglas','#e5ddc7','#ad3335');
  noble('sforza','스포르차 가문 — 비스초네 뱀','serpent','#e5dcc4','#416d55');
  noble('este','에스테 가문 — 흰 독수리','eagle','#31578b','#e9dec4');
  noble('tokugawa','도쿠가와 가문 — 세 접시꽃잎','aoi','#303b36','#d9b854');
  noble('toyotomi','도요토미 가문 — 오동나무','paulownia','#573d61','#d7b453');
  noble('oda','오다 가문 — 오이꽃','mokko','#653d46','#dabb61');
  noble('takeda','다케다 가문 — 네 마름모','takeda','#813d3c','#d8b557');
  noble('shimazu','시마즈 가문 — 원 안의 십자','circlecross','#344856','#e5d7b2');
  noble('mori','모리 가문 — 한 줄과 세 별','mori','#3d5451','#e5d9b8');
  // 동아시아의 용보·가몬에는 서양식 방패와 왕관 대신 원형 바탕을 쓴다.
  ['royal_joseon','royal_ming','royal_qing','royal_japan','royal_ottoman','royal_mughal','noble_tokugawa','noble_toyotomi','noble_oda','noble_takeda','noble_shimazu','noble_mori'].forEach(function(id){map[id].pattern='roundel';map[id].crown=false;});
  add('pirate_skull','해골과 교차 뼈','pirate','emblem','skull','#e8dfca','#292b2e',{note:'시대를 넓게 아우르는 게임용 해적 도안'});
  add('pirate_sabers','해골과 교차 칼','pirate','emblem','sabers','#e9dfc9','#28292b');
  add('pirate_red','붉은 줄무늬와 해골','pirate','stripes','skull','#a82f32',null,{emblemInk:'#292a2b'});
  add('pirate_black','검은 줄무늬와 해골','pirate','stripes','skull','#35373a','#a5a29a',{emblemInk:'#e9dfc7'});
  // 시대별 소유국 목록 전체를 지원한다. 출처가 없는 나라에 역사 문장을 만들어 붙이지 않는다.
  Object.keys(G.NATION_COLORS||{}).sort().forEach(function(n){if(!covered[n])add('nation:'+n,n+' — 국명 표장(창작)','nation','seal','text',G.NATION_COLORS[n],null,{text:n,note:'게임의 국가색과 국명을 조합한 창작 표장. 역사적 국기·왕가 문장이 아님'});});
})(window.G=window.G||{});
