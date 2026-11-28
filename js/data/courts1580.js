/* 1580~1700년 궁정. 재위일은 YYYYMMDD, 일반 후원 활동에서 사료가 해·달까지만
   알려 주는 경우에는 각각 00을 쓴다. 날짜와 인물·겸직·초상은 같은 표를 따른다. */
(function (G) {
  'use strict';
  var H = G.CourtHistory = { changes: {}, nations: {}, people: {}, capitals: [] };
  var START = 15800101, END = 17010101;
  H.inPeriod = function (d) { return !!d && d.y >= 1580 && d.y <= 1700; };
  H.time = function (d) { return d.y + ((d.m || 1) - 1) / 12 + ((d.d || 1) - 1) / 384; };
  function number(n) {
    return H.time({ y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 });
  }
  function day() {
    var s = G.Game && G.Game.state, d = s && s.date;
    return d ? d.y * 10000 + (d.m || 1) * 100 + (d.d || 1) : 14800101;
  }
  function boundaries(n, sp) {
    if (n < START || n >= END) return;
    if (n % 100 === 0) n += 1;
    if (Math.floor(n / 100) % 100 === 0) n += 100;
    var seats = H.changes[n] || (H.changes[n] = []);
    if (seats.indexOf(sp) < 0) seats.push(sp);
  }
  // 궁정이 옮겨도 기존 후원자 ID, 계약과 신뢰는 함께 간다.
  function itinerant(sp, field, moves) {
    var original = sp[field];
    Object.defineProperty(sp, field, { configurable: true, enumerable: true, get: function () {
      var now = day(), value = original;
      if (now >= START && now < END) moves.forEach(function (v) { if (now >= v[0]) value = v[1]; });
      return value;
    } });
  }
  var tastes = { king:['treasure','geo','people'], gov:['trade','geo','ruin'], noble:['art','treasure','people'],
    official:['people','trade','geo'], merchant:['trade','geo','nature'], scholar:['nature','ruin','geo'], priest:['faith','art','people'] };
  function seat(id, title, city, type, palace) {
    var old = G.SPONSOR[id];
    if (old) return old;
    var c = G.CITY_DATA[city];
    var sp = { id:id, title:title, city:city, type:type, bld:palace ? 'palace':'mansion',
      lang:c.lang, rel:c.rel, pw:type === 'king' ? 5 : type === 'scholar' ? 2 : 3,
      wealth:type === 'merchant' || type === 'king' ? 5 : 3, taste:tastes[type], holders:[] };
    if (palace) sp.place = palace;
    G.SPONSORS.push(sp); G.SPONSOR[id] = sp;
    return sp;
  }
  function register(id, rows) {
    var sp = G.SPONSOR[id], before = [], after = [];
    sp.historicalCourt = true;
    sp.holders.forEach(function (h, i) {
      function part(a, b) {
        var copy = h.slice(); copy[0] = a; copy[1] = b;
        if (copy[3] == null) copy[3] = i + 1;
        return copy;
      }
      if (h[0] < 1580) before.push(part(h[0], Math.min(1580, h[1])));
      if (h[1] > 1701) after.push(part(Math.max(1701, h[0]), h[1]));
    });
    var middle = rows.map(function (r) {
      var p = H.people[r[2]], a = Math.max(START,r[0]), b = Math.min(END,r[1]);
      boundaries(a, sp); boundaries(b, sp);
      var row = [number(a), number(b), r[3] || p[0], p ? 'court1580/' + r[2] : 0, r[4] || (p ? '' : 'g'), p ? p[1] : '', r[2]];
      // 옛 저장의 알현 기록은 자리·시작 연도·이름을 열쇠로 썼다.
      function plain(name) { return name.split(' (')[0].trim(); }
      var old = p && sp.holders.find(function (h) {
        return h[0] < row[1] && row[0] < h[1] && (plain(h[2]) === plain(row[2]) || plain(h[2]) === plain(p[0]));
      });
      if (old) row[7] = sp.id + ':' + old[0] + ':' + old[2];
      return row;
    });
    sp.holders = before.concat(middle, after);
    if (G.RULERS && G.RULERS[id]) G.RULERS[id] = sp.holders;
  }
  H.leader = function (sp, date) {
    var t = H.time(date), h = sp.holders.find(function (row) { return row[0] <= t && t < row[1]; });
    var title = H.titleAt(sp, date), name = h ? h[2] : null;
    return { name:name, title:title, text:name || title + ' 공석' };
  };
  H.titleAt = function (sp, date) {
    var t = date.y*10000+(date.m||1)*100+(date.d||1), v = sp.historicTitle || sp.title;
    (sp.historicTitles || []).forEach(function (p) { if (t >= p[0]) v = p[1]; });
    return v;
  };
  // 새 궁정 도시는 고정 번호를 쓰므로 기존 저장의 도시 번호를 밀어내지 않는다.
  function town(id, name, lon, lat, template, nation, goods, flags) {
    var c = G.CITY_DATA[template];
    G.CITY_DATA[id] = { id:id, name:name, lon:lon, lat:lat, port:0, region:c.region, lang:c.lang, rel:c.rel,
      size:3, style:c.style, nation:nation, founded:0, goods:goods, flags:flags || 'LP' };
    G.DOMINION[id] = [[1480,nation]];
  }
  town(327,'마드리드',-3.704,40.416,7,'카스티야',['wheat','wool','wine']);
  town(328,'바야돌리드',-4.726,41.652,7,'카스티야',['wheat','wool','wine']);
  town(329,'헤이그',4.313,52.081,24,'부르고뉴',['fish','wool','art']);
  town(330,'프레스부르크',17.108,48.143,54,'헝가리',['wine','wheat','horses']);
  town(331,'크라쿠프',19.938,50.061,62,'폴란드',['salt','wheat','timber']);
  town(332,'허투알라',124.902,41.714,312,'건주여진',['fur','herbs','horses']);
  town(333,'베를린',13.405,52.52,54,'브란덴부르크',['wheat','timber','beer']);
  G.DOMINION[327] = G.DOMINION[328] = [[1480,'카스티야'],[1516,'에스파냐']];
  G.DOMINION[329] = [[1480,'부르고뉴'],[1556,'에스파냐'],[1572,'네덜란드']];
  G.DOMINION[332] = [[1480,'건주여진'],[1616,'후금'],[1636,'청']];
  town(334,'순천',127.487,34.95,190,'조선',['rice','fish','timber'],'L');
  town(335,'삼척',129.166,37.45,190,'조선',['fish','timber','herbs'],'L');
  town(336,'해남',126.6,34.57,190,'조선',['rice','fish','herbs'],'L');
  town(337,'영양',129.128,36.66,190,'조선',['herbs','rice','timber'],'L');
  // 같은 사람이 세자 때와 왕위에 오른 뒤에는 서로 다른 복식을 입는다.
  H.people = {
    luisa: ["루이자 드 구스망","f"],
    mariana: ["마리아나 데 아우스트리아","f"],
    amalia: ["아말리아 판 솔름스","f"],
    olimpia: ["올림피아 마이달키니","f"],
    morosina: ["모로시나 모로시니","f"],
    inmok: ["인목왕후","f"],
    meisho: ["메이쇼 천황","f"],
    xiaozhuang: ["효장문황후","f"],
    christina: ["크리스티나","f"],
    medici_marie: ["마리 드 메디시스","f"],
    henrietta: ["헨리에타 마리아","f"],
    safiye: ["사피예 술탄","f"],
    kosem: ["쾨셈 술탄","f"],
    henrique: ["엔히크 추기경왕","m"],
    antonio: ["안토니우","m"],
    philip2: ["펠리페 2세","m"],
    philip3: ["펠리페 3세","m"],
    philip4: ["펠리페 4세","m"],
    carlos2: ["카를로스 2세","m"],
    philip5: ["펠리페 5세","m"],
    joao4: ["주앙 4세","m"],
    afonso6: ["아폰수 6세","m"],
    pedro2: ["페드루 2세","m"],
    elizabeth: ["엘리자베스 1세","f"],
    james1: ["제임스 1세","m"],
    charles1: ["찰스 1세","m"],
    oliver: ["올리버 크롬웰","m"],
    richard: ["리처드 크롬웰","m"],
    charles2: ["찰스 2세","m"],
    james2: ["제임스 2세","m"],
    william3: ["윌리엄 3세","m"],
    mary2: ["메리 2세","f"],
    henri3: ["앙리 3세","m"],
    henri4: ["앙리 4세","m"],
    louis13: ["루이 13세","m"],
    louis14: ["루이 14세","m"],
    rudolf: ["루돌프 2세","m"],
    matthias: ["마티아스","m"],
    ferd2: ["페르디난트 2세","m"],
    ferd3: ["페르디난트 3세","m"],
    leopold: ["레오폴트 1세","m"],
    winter: ["프리드리히 5세","m"],
    orange: ["빌럼 1세","m"],
    maurice: ["마우리츠","m"],
    frederik: ["프레데리크 헨드리크","m"],
    william2: ["빌럼 2세","m"],
    francesco1: ["프란체스코 1세 데 메디치","m"],
    ferdinando1: ["페르디난도 1세 데 메디치","m"],
    cosimo2: ["코시모 2세 데 메디치","m"],
    ferdinando2: ["페르디난도 2세 데 메디치","m"],
    cosimo3: ["코시모 3세 데 메디치","m"],
    murad3: ["무라드 3세","m"],
    mehmed3: ["메흐메트 3세","m"],
    ahmed1: ["아흐메트 1세","m"],
    mustafa1: ["무스타파 1세","m"],
    osman2: ["오스만 2세","m"],
    murad4: ["무라드 4세","m"],
    ibrahim: ["이브라힘","m"],
    mehmed4: ["메흐메트 4세","m"],
    suleiman2: ["쉴레이만 2세","m"],
    ahmed2: ["아흐메트 2세","m"],
    mustafa2: ["무스타파 2세","m"],
    greg13: ["그레고리오 13세","m"],
    sixtus5: ["식스토 5세","m"],
    urban7: ["우르바노 7세","m"],
    greg14: ["그레고리오 14세","m"],
    inn9: ["인노첸시오 9세","m"],
    clem8: ["클레멘스 8세","m"],
    leo11: ["레오 11세","m"],
    paul5: ["바오로 5세","m"],
    greg15: ["그레고리오 15세","m"],
    urban8: ["우르바노 8세","m"],
    inn10: ["인노첸시오 10세","m"],
    alex7: ["알렉산데르 7세","m"],
    clem9: ["클레멘스 9세","m"],
    clem10: ["클레멘스 10세","m"],
    inn11: ["인노첸시오 11세","m"],
    alex8: ["알렉산데르 8세","m"],
    inn12: ["인노첸시오 12세","m"],
    clem11: ["클레멘스 11세","m"],
    ponte: ["니콜로 다 폰테","m"],
    cicogna: ["파스콸레 치코냐","m"],
    grimani: ["마리노 그리마니","m"],
    dona: ["레오나르도 도나","m"],
    memmo: ["마르칸토니오 멤모","m"],
    bembo: ["조반니 벰보","m"],
    ndona: ["니콜로 도나","m"],
    priuli: ["안토니오 프리울리","m"],
    fcontarini: ["프란체스코 콘타리니","m"],
    gcorner: ["조반니 1세 코르나로","m"],
    ncontarini: ["니콜로 콘타리니","m"],
    erizzo: ["프란체스코 에리초","m"],
    molin: ["프란체스코 몰린","m"],
    ccontarini: ["카를로 콘타리니","m"],
    fcorner: ["프란체스코 코르나로","m"],
    bvalier: ["베르투치 발리에르","m"],
    pesaro: ["조반니 페사로","m"],
    dcontarini: ["도메니코 2세 콘타리니","m"],
    sagredo: ["니콜로 사그레도","m"],
    acontarini: ["알비세 콘타리니","m"],
    giustinian: ["마르칸토니오 주스티니안","m"],
    fmorosini: ["프란체스코 모로시니","m"],
    svalier: ["실베스트로 발리에르","m"],
    mocenigo: ["알비세 2세 모체니고","m"],
    seonjo: ["선조","m"],
    gwanghae: ["광해군","m"],
    injo: ["인조","m"],
    hyojong: ["효종","m"],
    hyeonjong: ["현종","m"],
    sukjong: ["숙종","m"],
    wanli: ["만력제","m"],
    taichang: ["태창제","m"],
    tianqi: ["천계제","m"],
    chongzhen: ["숭정제","m"],
    nurhaci: ["누르하치","m"],
    hongtaiji: ["홍타이지","m"],
    shunzhi: ["순치제","m"],
    kangxi: ["강희제","m"],
    lizicheng: ["이자성","m"],
    ogimachi: ["오기마치 천황","m"],
    goyozei: ["고요제이 천황","m"],
    gomizunoo: ["고미즈노오 천황","m"],
    gokomyo: ["고코묘 천황","m"],
    gosai: ["고사이 천황","m"],
    reigen: ["레이겐 천황","m"],
    higashiyama: ["히가시야마 천황","m"],
    nobunaga: ["오다 노부나가","m"],
    hideyoshi: ["도요토미 히데요시","m"],
    ieyasu: ["도쿠가와 이에야스","m"],
    hidetada: ["도쿠가와 히데타다","m"],
    iemitsu: ["도쿠가와 이에미쓰","m"],
    ietsuna: ["도쿠가와 이에쓰나","m"],
    tsunayoshi: ["도쿠가와 쓰나요시","m"],
    dkfre2: ["프레데리크 2세","m"],
    dkchr4: ["크리스티안 4세","m"],
    dkfre3: ["프레데리크 3세","m"],
    dkchr5: ["크리스티안 5세","m"],
    dkfre4: ["프레데리크 4세","m"],
    johan3: ["요한 3세","m"],
    sigismund: ["지그문트 3세 바사","m"],
    karl9: ["칼 9세","m"],
    gustav2: ["구스타브 2세 아돌프","m"],
    karl10: ["칼 10세 구스타브","m"],
    karl11: ["칼 11세","m"],
    karl12: ["칼 12세","m"],
    batory: ["스테판 바토리","m"],
    anna_j: ["안나 야기엘론카","f"],
    wlad4: ["브와디스와프 4세","m"],
    jan2: ["얀 2세 카지미에시","m"],
    michal: ["미하우 코리부트","m"],
    sobieski: ["얀 3세 소비에스키","m"],
    august2: ["아우구스트 2세","m"],
    ivan4: ["이반 4세","m"],
    feodor1: ["표도르 1세","m"],
    irina: ["이리나 고두노바","f"],
    boris: ["보리스 고두노프","m"],
    feodor2: ["표도르 2세","m"],
    dmitry: ["가짜 드미트리 1세","m"],
    vasili: ["바실리 4세","m"],
    mikhail: ["미하일 1세","m"],
    alexei: ["알렉세이","m"],
    feodor3: ["표도르 3세","m"],
    ivan5: ["이반 5세","m"],
    peter: ["표트르 1세","m"],
    turhan: ["투르한 술탄","f"],
    nurbanu: ["누르바누 술탄","f"],
    catherine_b: ["브라간사 공작부인 카타리나","f"],
    elizabeth_b: ["이사벨 데 보르본","f"],
    margaret_at: ["마르가리타 데 아우스트리아","f"],
    anne_a: ["안 도트리슈","f"],
    anne_d: ["덴마크의 앤","f"],
    christine_l: ["로렌의 크리스티나","f"],
    vittoria: ["비토리아 델라 로베레","f"],
    masako: ["도쿠가와 마사코","f"],
    jangryeol: ["장렬왕후","f"],
    inhyeon: ["인현왕후","f"],
    sofia: ["소피야 알렉세예브나","f"],
    maria_aragon: ["아란다 백작부인 루이사 데 파디야","f"],
    anna_maria: ["안나 마리아 판 쉬르만","f"],
    hongguang: ["홍광제","m"],
    longwu: ["융무제","m"],
    shaowu: ["소무제","m"],
    yongli: ["영력제","m"],
    emanf: ["에마누엘레 필리베르토","m"],
    carloeman1: ["카를로 에마누엘레 1세","m"],
    vittam1: ["비토리오 아메데오 1세","m"],
    franchy: ["프란체스코 자친토","m"],
    carloeman2: ["카를로 에마누엘레 2세","m"],
    vittam2: ["비토리오 아메데오 2세","m"],
    christine_f: ["프랑스의 크리스틴","f"],
    marie_n: ["마리 잔 바티스트","f"],
    margaret_c: ["마거릿 캐번디시","f"],
    louis_dg: ["루이즈 드 콜리니","f"],
    olivarez: ["올리바레스 백작공작","m"],
    williamlala: ["윌리엄 세실","m"],
    richelieu: ["리슐리외 추기경","m"],
    mazarin: ["마자랭 추기경","m"],
    colbert: ["장바티스트 콜베르","m"],
    sully: ["쉴리 공작","m"],
    betke: ["베스 하드윅","f"],
    hatice: ["하티제 술탄","f"],
    empressli: ["자성황태후 이씨","f"],
    empresszhang: ["의안황후 장씨","f"],
    delmonte: ["프란체스코 마리아 델 몬테","m"],
    barberini: ["프란체스코 바르베리니","m"],
    gidpower: ["카타리나 드 브라간사","f"],
    ferd4: ["페르디난트 4세","m"],
    joseph1: ["요제프 1세","m"],
    bethlen: ["베틀렌 가보르","m"],
    dorgon: ["도르곤","m"],
    juniorhide: ["도요토미 히데요리","m"],
    witt: ["요한 더 비트","m"],
    sultan_gul: ["귈누시 술탄","f"],
    gabr: ["가브리엘 데스트레","f"],
    sohyeon: ["소현세자","m"],
    christina_h: ["헤드비그 엘레오노라","f"],
    maria_cas: ["마리 카지미르","f"],
    sophie_dk: ["메클렌부르크의 소피","f"],
    robertcecil: ["로버트 세실","m"],
    ridwan: ["리드완 베이 알피카리","m"],
    johangeorg: ["요한 게오르크","m"],
    joachimf: ["요아힘 프리드리히","m"],
    johansig: ["요한 지기스문트","m"],
    georgw: ["게오르크 빌헬름","m"],
    greatel: ["프리드리히 빌헬름","m"],
    fredericki: ["프리드리히 3세","m"],
    albertf: ["알브레히트 프리드리히","m"],
    genoa_15800101: ["니콜로 도리아","m"],
    genoa_15811021: ["제롤라모 데 프란키 토소","m"],
    genoa_15831104: ["제롤라모 키아바리","m"],
    genoa_15851108: ["암브로조 디 네그로","m"],
    genoa_15871114: ["다비데 바카","m"],
    genoa_15891120: ["바티스타 네그로네","m"],
    genoa_15911127: ["조반니 아고스티노 주스티니아니 캄피","m"],
    genoa_15931127: ["안토니오 그리말디 체바","m"],
    genoa_15951205: ["마테오 세나레가","m"],
    genoa_15971207: ["라차로 그리말디 체바","m"],
    genoa_15990222: ["로렌초 사울리","m"],
    genoa_16010224: ["아고스티노 도리아","m"],
    genoa_16030226: ["피에트로 데 프란키 사코","m"],
    genoa_16050301: ["루카 그리말디 데 카스트로","m"],
    genoa_16070303: ["실베스트로 인브레아","m"],
    genoa_16070322: ["제롤라모 아세레토","m"],
    genoa_16090401: ["아고스티노 피넬리 루차니","m"],
    genoa_16110406: ["알레산드로 주스티니아니 롱고","m"],
    genoa_16130421: ["토마소 스피놀라","m"],
    genoa_16150425: ["베르나르도 클라바레차","m"],
    genoa_16170425: ["조반니 자코모 임페리알레 타르타로","m"],
    genoa_16190502: ["피에트로 두라초","m"],
    genoa_16210504: ["암브로조 도리아","m"],
    genoa_16210622: ["조르조 첸투리오네","m"],
    genoa_16230625: ["페데리코 데 프란키 토소","m"],
    genoa_16250616: ["자코모 로멜리니","m"],
    genoa_16270628: ["조반니 루카 키아바리","m"],
    genoa_16290626: ["안드레아 스피놀라","m"],
    genoa_16310630: ["레오나르도 델라 토레","m"],
    genoa_16330705: ["조반니 스테파노 도리아","m"],
    genoa_16350711: ["조반니 프란체스코 1세 브리뇰레 살레","m"],
    genoa_16370713: ["아고스티노 팔라비치니","m"],
    genoa_16390728: ["조반니 바티스타 두라초","m"],
    genoa_16410814: ["조반니 아고스티노 데 마리니","m"],
    genoa_16420704: ["조반니 바티스타 레르카리","m"],
    genoa_16440721: ["루카 주스티니아니","m"],
    genoa_16460724: ["조반니 바티스타 로멜리니","m"],
    genoa_16480801: ["자코모 데 프란키 토소","m"],
    genoa_16500823: ["아고스티노 첸투리오네","m"],
    genoa_16520908: ["제롤라모 데 프란키 토소","m"],
    genoa_16541009: ["알레산드로 스피놀라","m"],
    genoa_16561012: ["줄리오 사울리","m"],
    genoa_16581015: ["조반니 바티스타 첸투리오네","m"],
    genoa_16601028: ["잔 베르나르도 프루고니","m"],
    genoa_16610328: ["안토니오토 인브레아","m"],
    genoa_16630413: ["스테파노 데 마리","m"],
    genoa_16650418: ["체사레 두라초","m"],
    genoa_16670510: ["체사레 젠틸레","m"],
    genoa_16690618: ["프란체스코 가르바리노","m"],
    genoa_16710627: ["알레산드로 그리말디","m"],
    genoa_16730705: ["아고스티노 살루초","m"],
    genoa_16750711: ["안토니오 다 파사노","m"],
    genoa_16770716: ["잔네티노 오도네","m"],
    genoa_16790729: ["아고스티노 스피놀라","m"],
    genoa_16810813: ["루카 마리아 인브레아","m"],
    genoa_16830818: ["프란체스코 마리아 임페리알레 레르카리","m"],
    genoa_16850823: ["피에트로 두라초","m"],
    genoa_16870827: ["루카 스피놀라","m"],
    genoa_16890831: ["오베르토 델라 토레","m"],
    genoa_16910904: ["조반니 바티스타 카타네오 델라 볼타","m"],
    genoa_16930909: ["프란체스코 인브레아","m"],
    genoa_16950916: ["벤디넬리 네그로네","m"],
    genoa_16970919: ["프란체스코 마리아 사울리","m"],
    genoa_16990603: ["지롤라모 데 마리","m"],
    seongjong: ["성종","m"],
    yeonsan: ["연산군","m"],
    jungjong: ["중종","m"],
    injong: ["인종","m"],
    myeongjong: ["명종","m"],
    cp_yeonsan: ["세자 이융","m"],
    yi_hwang: ["폐세자 이황","m"],
    cp_injong: ["세자 이호","m"],
    sunhoe: ["순회세자","m"],
    cp_gwanghae: ["세자 광해군","m"],
    yi_ji: ["폐세자 이지","m"],
    cp_hyojong: ["세자 봉림대군","m"],
    cp_hyeonjong: ["세자 이연","m"],
    cp_sukjong: ["세자 이순","m"],
    gyeongjong: ["왕세자 이윤","m"],
    ryu: ["류성룡","m"],
    wonik: ["이원익","m"],
    kimyuk: ["김육","m"],
    sugwang: ["이수광","m"],
    heogyun: ["허균","m"],
    yunseondo: ["윤선도","m"],
    gyeyang: ["장계향","f"],
    heojun: ["허준","m"],
    heoim: ["허임","m"],
    hongsuneon: ["홍순언","m"],
    janghyeon: ["장현","m"],
    kimjinam: ["김지남","m"],
  };

  seat("sc_king", "스코틀랜드 국왕", 42, "king", "스코틀랜드 왕실 알현처");
  seat("nl_stad", "홀란트·제일란트 총독", 329, "gov", "총독 관저");
  seat("at_archduke", "오스트리아 대공", 54, "noble", "오스트리아 궁정");
  seat("bo_king", "보헤미아 국왕", 53, "king", "프라하성");
  seat("savoy_duke", "사보이아 공작", 27, "noble", "사보이아 공궁");
  seat("it_genoa", "제노바 도제", 28, "gov", "제노바 공작궁");
  seat("se_king", "스웨덴 국왕", 64, "king", "스톡홀름 왕궁");
  seat("jp_emperor", "일본 천황", 193, "king", "교토 어소");
  seat("cn_ming", "명 황제", 188, "king", "자금성");
  seat("cn_qing", "후금 칸", 312, "king", "후금·청 궁정");
  seat("cn_shun", "대순 황제", 188, "king", "대순 정권");
  seat("sm_nanjing", "남명 황제", 178, "king", "남경 궁정");
  seat("sm_fuzhou", "남명 황제", 176, "king", "복주 궁정");
  seat("sm_guangzhou", "남명 황제", 174, "king", "광주 궁정");
  seat("sm_yongli", "남명 황제", 181, "king", "영력 조정 연락처");
  seat("de_brandenburg", "브란덴부르크 선제후", 333, "noble", "베를린 선제후궁");
  seat("de_prussia", "프로이센 공작", 57, "noble", "쾨니히스베르크성");
  seat("it_naples", "나폴리 국왕", 34, "king", "나폴리 왕실 연락처");
  seat("it_sicily", "시칠리아 국왕", 36, "king", "팔레르모 왕실 연락처");
  seat("en_joint_mary", "잉글랜드 공동 군주", 38, "king", "메리 여왕 알현실");
  seat("sc_joint_mary", "스코틀랜드 공동 군주", 42, "king", "메리 여왕의 스코틀랜드 연락처");
  seat("ru_joint_peter", "공동 차르", 60, "king", "표트르 알현처");
  seat("pl_anna", "폴란드 공동 군주", 331, "king", "안나 여왕 알현처");
  seat("hu_junior", "헝가리 공동 대관왕", 330, "noble");
  seat("bo_junior", "보헤미아 공동 대관왕", 53, "noble");
  seat("hu_bethlen", "트란실바니아 공의 연락처", 330, "noble");
  seat("ot_women", "오스만 황실 여성 후원자", 112, "noble");
  seat("kr_women", "조선 왕실의 여성 후원자", 190, "noble");
  seat("kr_inhyeon", "조선 왕비", 190, "noble");
  seat("fr_women", "프랑스 왕실의 여성 후원자", 14, "noble");
  seat("fr_beaufort", "보포르 공작부인", 14, "noble");
  seat("en_royal_women", "스튜어트 왕실의 왕비", 38, "noble");
  seat("en_cavendish", "뉴캐슬 공작부인의 연락처", 38, "scholar");
  seat("en_hardwick", "슈루즈버리 백작부인의 연락처", 38, "noble");
  seat("nl_orange_women", "오라녜 공가의 공비", 329, "noble");
  seat("nl_witt", "홀란트 대법률고문", 329, "official");
  seat("nl_schurman", "위트레흐트 학자의 서신처", 24, "scholar");
  seat("it_dogaressa", "베네치아 도가레사", 29, "noble");
  seat("it_flor_women", "토스카나 대공비", 30, "noble");
  seat("it_vittoria", "로베레 가문의 대공비", 30, "noble");
  seat("it_rome_women", "로마 귀족 미술 후원자", 33, "noble");
  seat("it_rome_cardinal", "델 몬테 추기경", 33, "priest");
  seat("it_barberini", "바르베리니 추기경", 33, "priest");
  seat("savoy_women", "사보이아 섭정 공작부인", 27, "noble");
  seat("es_royal_women", "에스파냐 왕실 여성 후원자", 327, "noble");
  seat("es_guzman", "올리바레스 백작공작", 327, "official");
  seat("aragon_women", "아란다 백작부인의 연락처", 5, "scholar");
  seat("pt_braganza_lady", "브라간사 공작부인의 연락처", 0, "noble");
  seat("jp_masako", "일본 황실 여성 후원자", 193, "noble");
  seat("cn_women", "명 황실의 여성 후원자", 188, "noble");
  seat("qing_women", "청 황실의 여성 후원자", 312, "noble");
  seat("qing_regent", "청 섭정왕", 312, "noble");
  seat("ru_women", "러시아 섭정 황녀", 60, "noble");
  seat("se_women", "스웨덴 왕대비", 64, "noble");
  seat("pl_women", "폴란드 왕비", 62, "noble");
  seat("dk_women", "덴마크 왕비", 66, "noble");
  seat("ot_hatice", "오스만 황녀", 112, "noble");
  seat("eg_ridwan", "이집트의 순례대 사령관", 79, "noble");
  seat('kr_ryu', '의정부 대신', 190, 'official');
  G.SPONSOR.kr_ryu.taste = ["people","geo","trade"];
  G.SPONSOR.kr_ryu.historicalGreeting = "군량을 실을 항구와 백성을 피란시킬 뱃길을 지도에 함께 표시해 주시오.";
  seat('kr_wonik', '의정부 원로대신', 190, 'official');
  G.SPONSOR.kr_wonik.taste = ["trade","people","geo"];
  G.SPONSOR.kr_wonik.historicalGreeting = "공물 한 짐이 어느 고을에 얼마나 무거운지, 장부와 백성의 말을 맞춰 보고 싶소.";
  seat('kr_kimyuk', '대동법을 추진한 대신', 190, 'official');
  G.SPONSOR.kr_kimyuk.taste = ["trade","geo","people"];
  G.SPONSOR.kr_kimyuk.historicalGreeting = "세금으로 거둔 쌀을 옮기려면 물때부터 알아야 하오. 어느 포구에서 짐을 부릴 수 있겠소?";
  seat('kr_sugwang', '순천부사', 334, 'official');
  G.SPONSOR.kr_sugwang.taste = ["people","ruin","geo"];
  G.SPONSOR.kr_sugwang.historicalGreeting = "순천의 산천과 물산을 읍지에 적고 있소. 그대가 둘러본 포구의 옛 이름도 듣고 싶구려.";
  seat('kr_heogyun', '삼척부사', 335, 'official');
  G.SPONSOR.kr_heogyun.taste = ["people","art","geo"];
  G.SPONSOR.kr_heogyun.historicalGreeting = "삼척 어민들이 바다에서 부르는 노래를 적어 주시오. 고을을 알려면 그들의 목소리부터 들어야지.";
  seat('kr_yunseondo', '해남 윤씨 사족·시인', 336, 'scholar');
  G.SPONSOR.kr_yunseondo.taste = ["art","nature","geo"];
  G.SPONSOR.kr_yunseondo.historicalGreeting = "배 위에서 물결이 바뀔 때마다 노의 장단도 달라지더이다. 그대 고장의 뱃노래는 어떻소?";
  seat('kr_gyeyang', '영양 사족가의 저술가', 337, 'scholar');
  G.SPONSOR.kr_gyeyang.taste = ["nature","trade","people"];
  G.SPONSOR.kr_gyeyang.historicalGreeting = "말린 해산물을 먼 길에 싣고 오셨군요. 집에서 쓰는 갈무리법과 어떻게 다른지 들려주시겠어요?";
  seat('kr_heojun', '내의원 의관', 190, 'scholar');
  G.SPONSOR.kr_heojun.taste = ["nature","people","trade"];
  G.SPONSOR.kr_heojun.historicalGreeting = "같은 이름으로 부르는 약초라도 고장마다 잎이 다르오. 어디서 채집했는지 적어 주시겠소?";
  seat('kr_heoim', '침의', 190, 'scholar');
  G.SPONSOR.kr_heoim.taste = ["people","nature","geo"];
  G.SPONSOR.kr_heoim.historicalGreeting = "긴 항해 뒤 뱃사람들이 어느 곳을 아파하는지 알려 주시오. 내가 보던 환자들과 견주어 보겠소.";
  seat('kr_hongsuneon', '사역원 한어 역관', 190, 'official');
  G.SPONSOR.kr_hongsuneon.taste = ["people","geo","trade"];
  G.SPONSOR.kr_hongsuneon.historicalGreeting = "문서의 글자 하나가 두 나라 사이에서 뜻을 달리하기도 하지요. 사행에서 들은 지명을 맞춰 봅시다.";
  seat('kr_janghyeon', '사역원 청어 역관', 190, 'official');
  G.SPONSOR.kr_janghyeon.taste = ["trade","people","geo"];
  G.SPONSOR.kr_janghyeon.historicalGreeting = "의주를 지나면 물건 이름부터 달라집니다. 상인들이 실제로 쓰는 말을 들려드리지요.";
  seat('kr_kimjinam', '사행 통역관', 190, 'official');
  G.SPONSOR.kr_kimjinam.taste = ["people","geo","trade"];
  G.SPONSOR.kr_kimjinam.historicalGreeting = "사행길에 적은 일기입니다. 바다에서 만난 이들은 이 섬을 어떻게 부르던가요?";
  register('pt_king', [
    [15800101,15800201,"henrique"],
    [15800201,15800623,null,"오인 섭정평의회"],
    [15800623,15800825,"antonio","안토니우 (크라투 수도원장)","x"],
    [15800825,15810417,null,"합스부르크군의 리스본 점령 행정"],
    [15810417,15980913,"philip2","필리프 1세 (에스파냐의 펠리페 2세)"],
    [15980913,16210331,"philip3","필리프 2세 (에스파냐의 펠리페 3세)"],
    [16210331,16401201,"philip4","필리프 3세 (에스파냐의 펠리페 4세)","x"],
    [16401201,16561106,"joao4"],
    [16561106,16830912,"afonso6"],
    [16830912,17010101,"pedro2"]
  ]);
  register('es_crown', [
    [15800101,15980913,"philip2"],
    [15980913,16210331,"philip3"],
    [16210331,16650917,"philip4"],
    [16650917,17001101,"carlos2"],
    [17001101,17010101,"philip5"]
  ]);
  register('fr_king', [
    [15800101,15890802,"henri3"],
    [15890802,16100514,"henri4"],
    [16100514,16430514,"louis13"],
    [16430514,17010101,"louis14"]
  ]);
  register('en_king', [
    [15800101,16030324,"elizabeth"],
    [16030324,16250327,"james1"],
    [16250327,16490130,"charles1"],
    [16490130,16531216,null,"잉글랜드 공화국 의회"],
    [16531216,16580903,"oliver","호국경 올리버 크롬웰"],
    [16580903,16590525,"richard","호국경 리처드 크롬웰","x"],
    [16590525,16600529,null,"잉글랜드 공화국 의회"],
    [16600529,16850206,"charles2"],
    [16850206,16881223,"james2",null,"x"],
    [16890213,16941228,"william3","윌리엄 3세·메리 2세 (공동 군주)","x"],
    [16941228,17010101,"william3",null,"x"]
  ]);
  register('sc_king', [
    [15800101,16250327,"james1","제임스 6세"],
    [16250327,16490130,"charles1"],
    [16490205,16510903,"charles2","찰스 2세 (스코틀랜드에서 선포)","x"],
    [16510903,16531216,null,"잉글랜드 공화국 점령 행정"],
    [16531216,16580903,"oliver","호국경 올리버 크롬웰"],
    [16580903,16590525,"richard","호국경 리처드 크롬웰","x"],
    [16590525,16600529,null,"연방 의회"],
    [16600529,16850206,"charles2"],
    [16850206,16890404,"james2","제임스 7세","x"],
    [16890511,16941228,"william3","윌리엄 2세·메리 2세 (공동 군주)"],
    [16941228,17010101,"william3","윌리엄 2세"]
  ]);
  register('nl_stad', [
    [15800101,15840710,"orange"],
    [15851114,16250423,"maurice"],
    [16250423,16470314,"frederik"],
    [16470314,16501106,"william2"],
    [16720704,17010101,"william3","빌럼 3세"]
  ]);
  register('de_emperor', [
    [15800101,16120121,"rudolf"],
    [16120613,16190321,"matthias"],
    [16190828,16370215,"ferd2"],
    [16370215,16570403,"ferd3"],
    [16580718,17010101,"leopold"]
  ]);
  register('at_archduke', [
    [15800101,16080626,"rudolf",null,"x"],
    [16080626,16190320,"matthias"],
    [16190320,16370215,"ferd2"],
    [16370215,16570402,"ferd3"],
    [16570402,17010101,"leopold"]
  ]);
  register('hu_king', [
    [15800101,16080626,"rudolf","루돌프","x"],
    [16080626,16190320,"matthias","마차시 2세"],
    [16190320,16370215,"ferd2"],
    [16370215,16570402,"ferd3"],
    [16570402,17010101,"leopold","리포트 1세"]
  ]);
  register('bo_king', [
    [15800101,16110523,"rudolf",null,"x"],
    [16110523,16170629,"matthias",null,"x"],
    [16170629,16190819,"ferd2",null,"x"],
    [16190826,16201108,"winter",null,"x"],
    [16201108,16370215,"ferd2"],
    [16370215,16570402,"ferd3"],
    [16570402,17010101,"leopold"]
  ]);
  register('it_medici', [
    [15800101,15871019,"francesco1"],
    [15871019,16090207,"ferdinando1"],
    [16090207,16210228,"cosimo2"],
    [16210228,16700523,"ferdinando2"],
    [16700523,17010101,"cosimo3"]
  ]);
  register('savoy_duke', [
    [15800101,15800830,"emanf"],
    [15800830,16300726,"carloeman1"],
    [16300726,16371007,"vittam1"],
    [16371007,16381004,"franchy"],
    [16381004,16750612,"carloeman2"],
    [16750612,17010101,"vittam2"]
  ]);
  register('it_pope', [
    [15800101,15850411,"greg13"],
    [15850424,15900828,"sixtus5"],
    [15900915,15900928,"urban7"],
    [15901205,15911017,"greg14"],
    [15911029,15911231,"inn9"],
    [15920130,16050304,"clem8"],
    [16050401,16050428,"leo11"],
    [16050516,16210129,"paul5"],
    [16210209,16230709,"greg15"],
    [16230806,16440730,"urban8"],
    [16440915,16550108,"inn10"],
    [16550407,16670523,"alex7"],
    [16670620,16691210,"clem9"],
    [16700429,16760723,"clem10"],
    [16760921,16890813,"inn11"],
    [16891006,16910202,"alex8"],
    [16910712,17000928,"inn12"],
    [17001123,17010101,"clem11"]
  ]);
  register('it_doge', [
    [15800101,15850731,"ponte"],
    [15850818,15950403,"cicogna"],
    [15950426,16051226,"grimani"],
    [16060110,16120717,"dona"],
    [16120724,16151101,"memmo"],
    [16151202,16180317,"bembo"],
    [16180405,16180510,"ndona"],
    [16180517,16230813,"priuli"],
    [16230908,16241207,"fcontarini"],
    [16250104,16291224,"gcorner"],
    [16300118,16310403,"ncontarini"],
    [16310410,16460104,"erizzo"],
    [16460120,16550228,"molin"],
    [16550327,16560502,"ccontarini"],
    [16560517,16560606,"fcorner"],
    [16560615,16580330,"bvalier"],
    [16580408,16591001,"pesaro"],
    [16591016,16750127,"dcontarini"],
    [16750206,16760815,"sagredo"],
    [16760826,16840116,"acontarini"],
    [16840126,16880324,"giustinian"],
    [16880403,16940117,"fmorosini"],
    [16940225,17000708,"svalier"],
    [17000717,17010101,"mocenigo"]
  ]);
  register('ot_sultan', [
    [15800101,15950116,"murad3"],
    [15950116,16031222,"mehmed3"],
    [16031222,16171122,"ahmed1"],
    [16171122,16180226,"mustafa1",null,"x"],
    [16180226,16220519,"osman2",null,"x"],
    [16220520,16230910,"mustafa1",null,"x"],
    [16230910,16400208,"murad4"],
    [16400209,16480808,"ibrahim",null,"x"],
    [16480808,16871108,"mehmed4",null,"x"],
    [16871108,16910622,"suleiman2"],
    [16910622,16950206,"ahmed2"],
    [16950206,17010101,"mustafa2"]
  ]);
  register('dk_king', [
    [15800101,15880404,"dkfre2"],
    [15880404,16480229,"dkchr4"],
    [16480706,16700209,"dkfre3"],
    [16700209,16990825,"dkchr5"],
    [16990825,17010101,"dkfre4"]
  ]);
  register('se_king', [
    [15800101,15921117,"johan3"],
    [15921117,15990724,"sigismund","시기스문드","x"],
    [15990724,16040322,"karl9","칼 공작 (섭정)","x"],
    [16040322,16111030,"karl9"],
    [16111030,16321106,"gustav2"],
    [16321106,16540606,"christina","크리스티나 여왕","x"],
    [16540606,16600213,"karl10"],
    [16600213,16970405,"karl11"],
    [16970405,17010101,"karl12"]
  ]);
  register('pl_king', [
    [15800101,15861212,"batory","스테판 바토리·안나 야기엘론카"],
    [15861212,15870819,"anna_j"],
    [15870819,16320501,"sigismund"],
    [16321108,16480521,"wlad4"],
    [16481120,16680917,"jan2",null,"x"],
    [16690619,16731111,"michal"],
    [16740519,16960618,"sobieski"],
    [16970915,17010101,"august2"]
  ]);
  register('ru_prince', [
    [15800101,15840328,"ivan4"],
    [15840328,15980117,"feodor1"],
    [15980117,15980303,"irina",null,"x"],
    [15980303,16050423,"boris"],
    [16050423,16050620,"feodor2"],
    [16050620,16060527,"dmitry"],
    [16060529,16100727,"vasili",null,"x"],
    [16100727,16100906,null,"일곱 보야르의 평의회"],
    [16100906,16121107,null,"일곱 보야르 (명목상 차르 블라디슬라프)"],
    [16121107,16130303,null,"임시정부"],
    [16130303,16450723,"mikhail"],
    [16450723,16760208,"alexei"],
    [16760208,16820507,"feodor3"],
    [16820507,16820605,"peter"],
    [16820605,16960208,"ivan5","이반 5세·표트르 1세 (공동 차르)"],
    [16960208,17010101,"peter"]
  ]);
  register('kr_king', [
    [15800101,16080316,"seonjo"],
    [16080316,16230413,"gwanghae",null,"x"],
    [16230413,16490617,"injo"],
    [16490617,16590623,"hyojong"],
    [16590623,16740917,"hyeonjong"],
    [16740917,17010101,"sukjong"]
  ]);
  register('jp_emperor', [
    [15800101,15861217,"ogimachi",null,"x"],
    [15861217,16110509,"goyozei",null,"x"],
    [16110509,16291222,"gomizunoo",null,"x"],
    [16291222,16431114,"meisho","메이쇼 천황","x"],
    [16431114,16541031,"gokomyo"],
    [16550105,16630305,"gosai",null,"x"],
    [16630305,16870502,"reigen",null,"x"],
    [16870502,17010101,"higashiyama"]
  ]);
  register('jp_shogun', [
    [15800101,15820621,"nobunaga","오다 노부나가 (천하인)"],
    [15820702,15980918,"hideyoshi","도요토미 히데요시 (야마자키 승리 이후)"],
    [15980918,16001021,null,"오대로·오봉행 (도요토미 정권)"],
    [16001021,16030324,"ieyasu","도쿠가와 이에야스 (세키가하라 뒤 실권)","x"],
    [16030324,16050416,"ieyasu",null,"x"],
    [16050602,16230823,"hidetada",null,"x"],
    [16230823,16510608,"iemitsu"],
    [16510910,16800604,"ietsuna"],
    [16800812,17010101,"tsunayoshi"]
  ]);
  register('cn_ming', [
    [15800101,16200819,"wanli"],
    [16200828,16200927,"taichang"],
    [16201001,16271001,"tianqi"],
    [16271002,16440426,"chongzhen"]
  ]);
  register('cn_shun', [
    [16440425,16440604,"lizicheng","이자성 (대순)"]
  ]);
  register('cn_qing', [
    [16160217,16261001,"nurhaci","누르하치 (후금 칸)"],
    [16261020,16360515,"hongtaiji","홍타이지 (후금 칸)"],
    [16360515,16430922,"hongtaiji","홍타이지 (청 태종)"],
    [16431008,16610205,"shunzhi"],
    [16610205,17010101,"kangxi"]
  ]);
  register('sm_nanjing', [
    [16440619,16450615,"hongguang"]
  ]);
  register('sm_fuzhou', [
    [16450818,16461006,"longwu"]
  ]);
  register('sm_guangzhou', [
    [16461211,16470120,"shaowu"]
  ]);
  register('sm_yongli', [
    [16461224,16620601,"yongli"]
  ]);
  register('de_brandenburg', [
    [15800101,15980108,"johangeorg"],
    [15980108,16080718,"joachimf"],
    [16080718,16191223,"johansig",null,"x"],
    [16191223,16401201,"georgw"],
    [16401201,16880509,"greatel"],
    [16880509,17010101,"fredericki"]
  ]);
  register('de_prussia', [
    [15800101,16180828,"albertf"],
    [16180828,16191223,"johansig"],
    [16191223,16401201,"georgw"],
    [16401201,16880509,"greatel"],
    [16880509,17010101,"fredericki"]
  ]);
  register('eg_ridwan', [
    [16310000,16560000,"ridwan",null,"x"]
  ]);
  register('eg_sultan', [
    [15800101,17010101,null,"이집트 에야레트 총독 파샤"]
  ]);
  register('pt_behaim', [
    [15800101,17010101,null,"포르투갈 왕실 우주지 학자"]
  ]);
  register('it_moro', [
    [15800101,15980913,"philip2","필리포 2세 (밀라노 공작)"],
    [15980913,16210331,"philip3"],
    [16210331,16650917,"philip4"],
    [16650917,17001101,"carlos2"],
    [17001101,17010101,"philip5","필리포 5세 (밀라노 공작)"]
  ]);
  register('es_aragon', [
    [15800101,15980913,"philip2"],
    [15980913,16210331,"philip3"],
    [16210331,16650917,"philip4"],
    [16650917,17001101,"carlos2"],
    [17001101,17010101,"philip5"]
  ]);
  register('it_naples', [
    [15800101,15980913,"philip2"],
    [15980913,16210331,"philip3"],
    [16210331,16650917,"philip4"],
    [16650917,17001101,"carlos2"],
    [17001101,17010101,"philip5"]
  ]);
  register('it_sicily', [
    [15800101,15980913,"philip2"],
    [15980913,16210331,"philip3"],
    [16210331,16650917,"philip4"],
    [16650917,17001101,"carlos2"],
    [17001101,17010101,"philip5"]
  ]);
  register('kr_seja', [
    [15920608,16080316,"cp_gwanghae","세자 광해군","x"],
    [16100701,16230413,"yi_ji","세자 이지","x"],
    [16250305,16450521,"sohyeon"],
    [16451114,16490617,"cp_hyojong","세자 봉림대군","x"],
    [16511012,16590623,"cp_hyeonjong","세자 이연","x"],
    [16670214,16740917,"cp_sukjong","세자 이순","x"],
    [16900721,17010101,"gyeongjong","세자 이윤"]
  ]);
  register('jp_tenka', [
    [15980918,16150604,"juniorhide","도요토미 히데요리 (도요토미 가주)"]
  ]);
  register('pt_queen', [
    [16401201,16660227,"luisa","루이자 드 구스망 (왕비·왕대비)"],
    [16920000,17010101,"gidpower","카타리나 드 브라간사 (영국 왕대비)"]
  ]);
  register('en_joint_mary', [
    [16890213,16941228,"mary2"]
  ]);
  register('sc_joint_mary', [
    [16890511,16941228,"mary2"]
  ]);
  register('ru_joint_peter', [
    [16820605,16960208,"peter",null,"x"]
  ]);
  register('pl_anna', [
    [15800101,15861212,"anna_j",null,"x"]
  ]);
  register('hu_junior', [
    [16470616,16540709,"ferd4"],
    [16871209,17010101,"joseph1","요제프 (공동 대관왕)"]
  ]);
  register('bo_junior', [
    [16460805,16540709,"ferd4"]
  ]);
  register('hu_bethlen', [
    [16200825,16211231,"bethlen","베틀렌 가보르 (선출 대립왕)","x"]
  ]);
  register('ot_women', [
    [15800101,15831207,"nurbanu","누르바누 술탄 (발리데 술탄)"],
    [15950116,16031222,"safiye","사피예 술탄 (발리데 술탄)","x"],
    [16230910,16510902,"kosem","쾨셈 술탄 (왕대비·대왕대비)"],
    [16510902,16830804,"turhan","투르한 술탄 (왕대비)"],
    [16950206,17010101,"sultan_gul","귈누시 술탄 (왕대비)"]
  ]);
  register('kr_women', [
    [16020829,16180222,"inmok",null,"x"],
    [16230413,16320813,"inmok"],
    [16390105,16880920,"jangryeol"]
  ]);
  register('kr_inhyeon', [
    [16810617,16890618,"inhyeon",null,"x"],
    [16940505,17010101,"inhyeon"]
  ]);
  register('fr_women', [
    [16001217,16310719,"medici_marie","마리 드 메디시스 (왕비·왕대비)","x"],
    [16430514,16660120,"anne_a","안 도트리슈 (왕대비)"]
  ]);
  register('fr_beaufort', [
    [15970000,15990410,"gabr"]
  ]);
  register('fr_minister', [
    [15980000,16110000,"sully","쉴리 공작 (재무경)"],
    [16240813,16421204,"richelieu","리슐리외 추기경"],
    [16421204,16610309,"mazarin","마자랭 추기경"],
    [16651212,16830906,"colbert","장바티스트 콜베르 (재무총감)"]
  ]);
  register('en_royal_women', [
    [16030324,16190302,"anne_d"],
    [16250600,16440700,"henrietta",null,"x"],
    [16601000,16610000,"henrietta",null,"x"],
    [16620000,16650000,"henrietta",null,"x"]
  ]);
  register('en_cavendish', [
    [16600000,16731215,"margaret_c"]
  ]);
  register('en_hardwick', [
    [15800101,16080213,"betke"]
  ]);
  register('nl_orange_women', [
    [15830400,16201113,"louis_dg"],
    [16250404,16750908,"amalia"]
  ]);
  register('nl_witt', [
    [16530730,16720804,"witt",null,"x"]
  ]);
  register('nl_schurman', [
    [16360000,16690000,"anna_maria",null,"x"]
  ]);
  register('it_dogaressa', [
    [15950426,16051225,"morosina",null,"x"]
  ]);
  register('it_flor_women', [
    [15890000,16371219,"christine_l"]
  ]);
  register('it_vittoria', [
    [16340000,16940305,"vittoria"]
  ]);
  register('it_rome_women', [
    [16440915,16550107,"olimpia",null,"x"],
    [16551200,16560000,"christina","크리스티나 (퇴위한 스웨덴 여왕)","x"],
    [16590000,16890419,"christina","크리스티나 (로마의 예술 후원자)","x"]
  ]);
  register('it_rome_cardinal', [
    [15881214,16270827,"delmonte"]
  ]);
  register('it_barberini', [
    [16231002,16791210,"barberini"]
  ]);
  register('savoy_women', [
    [16371007,16480000,"christine_f","프랑스의 크리스틴 (섭정 공작부인)","x"],
    [16750612,16840300,"marie_n","마리 잔 바티스트 (섭정 공작부인)","x"]
  ]);
  register('es_royal_women', [
    [15990418,16111003,"margaret_at"],
    [16210331,16441006,"elizabeth_b"],
    [16491007,16960516,"mariana"]
  ]);
  register('es_guzman', [
    [16210000,16430123,"olivarez",null,"x"]
  ]);
  register('aragon_women', [
    [16050000,16460000,"maria_aragon",null,"x"]
  ]);
  register('pt_braganza_lady', [
    [15800101,16141115,"catherine_b"]
  ]);
  register('jp_masako', [
    [16200000,16780802,"masako","도쿠가와 마사코 (도후쿠몬인)"]
  ]);
  register('cn_women', [
    [15800101,16140318,"empressli"],
    [16210000,16440425,"empresszhang"]
  ]);
  register('qing_women', [
    [16431008,16880127,"xiaozhuang"]
  ]);
  register('qing_regent', [
    [16431008,16501231,"dorgon"]
  ]);
  register('ru_women', [
    [16820600,16890900,"sofia","소피야 알렉세예브나 (섭정)","x"]
  ]);
  register('se_women', [
    [16600213,17010101,"christina_h"]
  ]);
  register('pl_women', [
    [16740519,16960617,"maria_cas",null,"x"]
  ]);
  register('dk_women', [
    [15800101,15880000,"sophie_dk",null,"x"]
  ]);
  register('ot_hatice', [
    [16870000,17010101,"hatice"]
  ]);
  register('en_minister', [
    [15800101,15980804,"williamlala"],
    [15980804,16120524,"robertcecil","로버트 세실"]
  ]);
  register('kr_ryu', [
    [15920500,15981200,"ryu",null,"x"]
  ]);
  register('kr_wonik', [
    [16230000,16340000,"wonik",null,"x"]
  ]);
  register('kr_kimyuk', [
    [16490000,16580900,"kimyuk",null,"x"]
  ]);
  register('kr_sugwang', [
    [16160000,16190000,"sugwang",null,"x"]
  ]);
  register('kr_heogyun', [
    [16070000,16080000,"heogyun",null,"x"]
  ]);
  register('kr_yunseondo', [
    [16400000,16500000,"yunseondo",null,"x"]
  ]);
  register('kr_gyeyang', [
    [16770000,16800000,"gyeyang",null,"x"]
  ]);
  register('kr_heojun', [
    [15800000,16080316,"heojun",null,"x"]
  ]);
  register('kr_heoim', [
    [16040000,16160000,"heoim",null,"x"]
  ]);
  register('kr_hongsuneon', [
    [15800000,15980000,"hongsuneon",null,"x"]
  ]);
  register('kr_janghyeon', [
    [16500000,16800000,"janghyeon",null,"x"]
  ]);
  register('kr_kimjinam', [
    [16820000,17010101,"kimjinam"]
  ]);
  register('it_genoa', [
    [15800101,15811021,"genoa_15800101",null,"x"],
    [15811021,15831022,"genoa_15811021",null,"x"],
    [15831104,15851105,"genoa_15831104",null,"x"],
    [15851108,15871114,"genoa_15851108",null,"x"],
    [15871114,15891115,"genoa_15871114",null,"x"],
    [15891120,15911116,"genoa_15891120",null,"x"],
    [15911127,15931127,"genoa_15911127",null,"x"],
    [15931127,15951127,"genoa_15931127",null,"x"],
    [15951205,15971205,"genoa_15951205",null,"x"],
    [15971207,15990216,"genoa_15971207",null,"x"],
    [15990222,16010222,"genoa_15990222",null,"x"],
    [16010224,16030226,"genoa_16010224",null,"x"],
    [16030226,16050228,"genoa_16030226",null,"x"],
    [16050301,16070303,"genoa_16050301",null,"x"],
    [16070303,16070318,"genoa_16070303",null,"x"],
    [16070322,16090324,"genoa_16070322",null,"x"],
    [16090401,16110403,"genoa_16090401",null,"x"],
    [16110406,16130407,"genoa_16110406",null,"x"],
    [16130421,16150422,"genoa_16130421",null,"x"],
    [16150425,16170425,"genoa_16150425",null,"x"],
    [16170425,16190430,"genoa_16170425",null,"x"],
    [16190502,16210503,"genoa_16190502",null,"x"],
    [16210504,16210613,"genoa_16210504"],
    [16210622,16230623,"genoa_16210622",null,"x"],
    [16230625,16250616,"genoa_16230625",null,"x"],
    [16250616,16270626,"genoa_16250616",null,"x"],
    [16270628,16290626,"genoa_16270628",null,"x"],
    [16290626,16310627,"genoa_16290626",null,"x"],
    [16310630,16330701,"genoa_16310630",null,"x"],
    [16330705,16350706,"genoa_16330705",null,"x"],
    [16350711,16370712,"genoa_16350711",null,"x"],
    [16370713,16390714,"genoa_16370713",null,"x"],
    [16390728,16410729,"genoa_16390728",null,"x"],
    [16410814,16420620,"genoa_16410814"],
    [16420704,16440705,"genoa_16420704",null,"x"],
    [16440721,16460722,"genoa_16440721",null,"x"],
    [16460724,16480725,"genoa_16460724",null,"x"],
    [16480801,16500802,"genoa_16480801",null,"x"],
    [16500823,16520824,"genoa_16500823",null,"x"],
    [16520908,16540909,"genoa_16520908",null,"x"],
    [16541009,16561010,"genoa_16541009",null,"x"],
    [16561012,16581013,"genoa_16561012",null,"x"],
    [16581015,16601016,"genoa_16581015",null,"x"],
    [16601028,16610323,"genoa_16601028"],
    [16610328,16630330,"genoa_16610328",null,"x"],
    [16630413,16650413,"genoa_16630413",null,"x"],
    [16650418,16670419,"genoa_16650418",null,"x"],
    [16670510,16690511,"genoa_16670510",null,"x"],
    [16690618,16710619,"genoa_16690618",null,"x"],
    [16710627,16730628,"genoa_16710627",null,"x"],
    [16730705,16750705,"genoa_16730705",null,"x"],
    [16750711,16770712,"genoa_16750711",null,"x"],
    [16770716,16790717,"genoa_16770716",null,"x"],
    [16790729,16810730,"genoa_16790729",null,"x"],
    [16810813,16830814,"genoa_16810813",null,"x"],
    [16830818,16850819,"genoa_16830818",null,"x"],
    [16850823,16870824,"genoa_16850823",null,"x"],
    [16870827,16890828,"genoa_16870827",null,"x"],
    [16890831,16910902,"genoa_16890831",null,"x"],
    [16910904,16930906,"genoa_16910904",null,"x"],
    [16930909,16950910,"genoa_16930909",null,"x"],
    [16950916,16970917,"genoa_16950916",null,"x"],
    [16970919,16990527,"genoa_16970919"],
    [16990603,17010101,"genoa_16990603",null,"x"]
  ]);
  // 궁정 위치, 칭호와 지도에서 쓰는 나라 이름.
  itinerant(G.SPONSOR.es_crown, 'city', [[15800101,327],[16010111,328],[16060304,327]]);
  itinerant(G.SPONSOR.es_royal_women, 'city', [[15800101,327],[16010111,328],[16060304,327]]);
  itinerant(G.SPONSOR.hu_king, 'city', [[15800101,330]]);
  itinerant(G.SPONSOR.de_emperor, 'city', [[15830101,53],[16120120,54]]);
  itinerant(G.SPONSOR.pl_king, 'city', [[15800101,331],[15960101,62]]);
  itinerant(G.SPONSOR.jp_shogun, 'city', [[16030324,297]]);
  // 사카이는 오사카 바로 남쪽의 항구로, 도요토미 가문에 서신을 전한다.
  itinerant(G.SPONSOR.jp_tenka, 'city', [[15980918,192]]);
  itinerant(G.SPONSOR.jp_tenka, 'place', [[15980918,'오사카성 연락처']]);
  itinerant(G.SPONSOR.sm_yongli, 'city', [[16461224,174],[16560000,181],[16590000,158]]);
  itinerant(G.SPONSOR.sm_yongli, 'place', [[16461224,'영력 조정의 광동·광서 연락처'],[16560000,'운남의 영력 조정'],[16590000,'미얀마 망명 조정 연락처']]);
  itinerant(G.SPONSOR.cn_qing, 'city', [[16160217,332],[16210101,314],[16250401,312],[16441030,188]]);
  itinerant(G.SPONSOR.qing_women, 'city', [[16441030,188]]);
  itinerant(G.SPONSOR.qing_regent, 'city', [[16441030,188]]);
  itinerant(G.SPONSOR.kr_king, 'place', [[15920609,'피란 조정 연락처'],[15931024,'정릉동 행궁'],[16111108,'창덕궁']]);
  itinerant(G.SPONSOR.kr_seja, 'place', [[15800101,'동궁']]);
  itinerant(G.SPONSOR.es_crown, 'place', [[15800101,'에스파냐 왕궁']]);
  itinerant(G.SPONSOR.de_emperor, 'place', [[15800101,'황제 알현실']]);
  itinerant(G.SPONSOR.jp_shogun, 'place', [[15800101,'천하인의 알현처'],[16030324,'에도성']]);
  titles('pt_queen', [[15800101,"포르투갈 왕실 여성 후원자"]]);
  titles('es_crown', [[15800101,"에스파냐 국왕 · 카스티야 왕위"]]);
  titles('fr_king', [[15800101,"프랑스 국왕"]]);
  titles('ru_prince', [[15800101,"러시아 차르"],[16100727,"모스크바 임시정부"],[16130303,"러시아 차르"]]);
  titles('dk_king', [[15800101,"덴마크·노르웨이 국왕"]]);
  titles('pl_king', [[15800101,"폴란드 국왕·리투아니아 대공"]]);
  titles('it_medici', [[15800101,"토스카나 대공"]]);
  titles('eg_sultan', [[15800101,"오스만령 이집트 총독"]]);
  titles('en_king', [[15800101,"잉글랜드 국왕"],[16490130,"잉글랜드 공화국"],[16531216,"잉글랜드 호국경"],[16590525,"잉글랜드 공화국"],[16600529,"잉글랜드 국왕"]]);
  titles('sc_king', [[15800101,"스코틀랜드 국왕"],[16510903,"연방 행정청"],[16531216,"연방 호국경"],[16590525,"연방 행정청"],[16600529,"스코틀랜드 국왕"]]);
  titles('jp_shogun', [[15800101,"천하의 실권자"],[16030324,"도쿠가와 쇼군"]]);
  titles('cn_qing', [[16160217,"후금 칸"],[16360515,"청 황제"]]);
  titles('it_moro', [[15800101,"밀라노 공작"]]);
  titles('jp_tenka', [[15800101,"도요토미 가문"]]);
  titles('kr_apgujeong', [[15800101,"청주 한씨 가문"]]);
  titles('de_prussia', [[15800101,"프로이센 공작"]]);
  function titles(id, list) {
    var sp = G.SPONSOR[id], old = sp.eraTitles;
    sp.historicTitle = sp.title; sp.historicTitles = list;
    if (old) delete sp.eraTitles;
    Object.defineProperty(sp, 'title', { configurable:true, enumerable:true, get:function () {
      var d = G.Game && G.Game.state && G.Game.state.date;
      if (H.inPeriod(d)) return H.titleAt(sp, d);
      var title = sp.historicTitle;
      if (d && old) old.forEach(function (e) { if (d.y >= e[0]) title = e[1]; });
      return title;
    } });
  }
  H.civilOffice = function (sp) {
    var d = G.Game && G.Game.state && G.Game.state.date;
    if (!sp || !H.inPeriod(d)) return false;
    var n = day(), id = sp.id;
    return id === 'eg_sultan' || (id === 'en_king' && n >= 16490130 && n < 16600529) ||
      (id === 'sc_king' && n >= 16510903 && n < 16600529) ||
      (id === 'ru_prince' && n >= 16100727 && n < 16130303) || (id === 'pt_king' && ((n >= 15800201 && n < 15800623) || (n >= 15800825 && n < 15810417)));
  };
  H.nations = {"포르투갈":"pt_king","에스파냐":"es_crown","카스티야":"es_crown","아라곤":"es_aragon","네덜란드":"nl_stad","잉글랜드":"en_king","영국":"en_king","스코틀랜드":"sc_king","프랑스":"fr_king","교황령":"it_pope","베네치아":"it_doge","토스카나":"it_medici","토스카나 대공국":"it_medici","피렌체":"it_medici","제노바":"it_genoa","사보이아":"savoy_duke","신성로마제국":"de_emperor","신성 로마 제국":"de_emperor","오스트리아":"at_archduke","헝가리":"hu_king","헝가리 왕국":"hu_king","보헤미아":"bo_king","오스만 제국":"ot_sultan","조선":"kr_king","명":"cn_ming","후금":"cn_qing","청":"cn_qing","순":"cn_shun","대순":"cn_shun","일본":"jp_emperor","폴란드":"pl_king","폴란드-리투아니아":"pl_king","폴란드·리투아니아":"pl_king","모스크바 대공국":"ru_prince","러시아 차르국":"ru_prince","덴마크":"dk_king","노르웨이":"dk_king","덴마크-노르웨이":"dk_king","스웨덴":"se_king","브란덴부르크":"de_brandenburg","프로이센 공국":"de_prussia","밀라노 공국":"it_moro","나폴리 왕국":"it_naples","시칠리아 왕국":"it_sicily","리투아니아":"pl_king","교황":"it_pope"};
  // 왕, 세자가 되기 전후로 원화 이름을 따로 보존한다.
  // 같은 신분으로 등장한 사건 인물은 사건의 얼굴과 무릎상을 함께 쓴다.
  H.eventPortraits = {"court1580/seongjong":"portraits/legendary/seongjong","court1580/yeonsan":"portraits/legendary/yeonsangun","court1580/seonjo":"portraits/legendary/seonjo","court1580/gwanghae":"portraits/history/br_gwanghae_king","court1580/injo":"portraits/history/injo","court1580/cp_gwanghae":"portraits/history/gwanghae"};
  var earlyKings = {'성종':'seongjong','연산군':'yeonsan','중종':'jungjong','인종':'injong','명종':'myeongjong','선조':'seonjo'};
  var earlyPrinces = {'세자 이융':'cp_yeonsan','세자 이황':'yi_hwang','세자 이호':'cp_injong','순회세자':'sunhoe'};
  function earlier(sp, ids) {
    sp.holders.forEach(function (h) {
      if (h[0] >= 1580) return;
      var id = ids[h[2].split(' ')[0]] || ids[h[2]];
      if (id) { h[3] = 'court1580/' + id; h[5] = 'm'; h[6] = id; }
    });
  }
  earlier(G.SPONSOR.kr_king, earlyKings);
  earlier(G.SPONSOR.kr_seja, earlyPrinces);
  var joseonHonors = {kr_women:'마마', kr_inhyeon:'마마', kr_ryu:'대감', kr_wonik:'대감', kr_kimyuk:'대감',
    kr_sugwang:'사또', kr_heogyun:'사또', kr_yunseondo:'선생', kr_gyeyang:'부인', kr_heojun:'선생', kr_heoim:'선생',
    kr_hongsuneon:'나리', kr_janghyeon:'나리', kr_kimjinam:'나리'};
  Object.keys(joseonHonors).forEach(function (id) { G.SPONSOR[id].honor = joseonHonors[id]; });
  // 관아의 이름은 근무지에 붙인다. 지방 수령은 맡은 고을에서 만난다.
  G.SPONSOR.kr_sugwang.place = '순천도호부 관아';
  G.SPONSOR.kr_heogyun.place = '삼척도호부 관아';
  // 실명이 전하지 않는 자리는 직책으로 표시한다. 공위기에도 도시의 후원 활동은 계속된다.
  function civic(city, from, until, roles) {
    H.capitals.push([city, from, until]);
    roles.forEach(function (role, i) {
      var id = 'civic_' + city + '_' + (i+1), sp = seat(id, role[1], city, role[0]);
      sp.place = role[1] + ' 집무처';
      register(id, [[from, until, null, role[1], 'g']]);
    });
  }
  civic(0, 15800101, 17010101, [["official","리스본 시의회 의원"],["priest","리스본 대성당 참사회원"]]);
  civic(5, 15800101, 17010101, [["official","아라곤 왕국 법무관"],["official","아라곤 의회 대표"],["priest","사라고사 대성당 참사회원"],["merchant","에브로강 곡물상"],["scholar","사라고사 법학자"]]);
  civic(7, 15800101, 17010101, [["merchant","세비야 상인조합 대표"],["scholar","항해도 제작 장인"]]);
  civic(14, 15800101, 17010101, [["official","파리 고등법원 판사"],["merchant","센강 상인조합 대표"],["scholar","파리 대학 학자"],["priest","노트르담 참사회원"],["noble","파리의 법복귀족"]]);
  civic(24, 15800101, 17010101, [["official","시 참사회원"],["merchant","발트해 곡물상"],["scholar","해도 출판인"],["merchant","암스텔강 선주"],["official","항만 세관원"]]);
  civic(26, 15800101, 17010101, [["official","밀라노 원로원 의원"],["priest","밀라노 대성당 참사회원"],["merchant","롬바르디아 직물상"],["noble","밀라노 귀족가 대표"],["scholar","밀라노 법학자"]]);
  civic(27, 15800101, 17010101, [["official","피에몬테 원로원 의원"],["official","사보이아 회계원 관리"],["scholar","토리노 대학 학자"],["merchant","포강 상인"],["noble","피에몬테 궁정 귀족"]]);
  civic(28, 15800101, 17010101, [["official","제노바 원로원 의원"],["merchant","산 조르조 은행 관계인"],["merchant","리구리아 선주"],["priest","산로렌초 대성당 참사회원"],["noble","제노바 도시 귀족"]]);
  civic(29, 15800101, 17010101, [["official","원로원 의원"],["official","산마르코 대성당 재무관"],["merchant","리알토 상인"],["official","국영 조선소 감독관"],["scholar","베네치아 인쇄업자"]]);
  civic(30, 15800101, 17010101, [["official","토스카나 궁정 서기관"],["merchant","비단 길드 상인"],["merchant","양모 길드 상인"],["scholar","피렌체 학술원 회원"],["priest","산타 마리아 델 피오레 참사회원"]]);
  civic(33, 15800101, 17010101, [["official","교황청 회계원 관리"],["priest","추기경단 대표"],["official","로타 법원 판사"],["noble","로마 원로 귀족"],["scholar","바티칸 도서관 학자"]]);
  civic(34, 15800101, 17010101, [["official","부왕청 서기관"],["merchant","나폴리 선주"],["scholar","나폴리 대학 학자"],["noble","나폴리 귀족 의석 대표"],["priest","나폴리 대성당 참사회원"]]);
  civic(36, 15800101, 17010101, [["official","시칠리아 왕실 재정관"],["merchant","시칠리아 곡물상"],["noble","시칠리아 의회 남작"],["priest","팔레르모 대성당 참사회원"],["official","팔레르모 원로원 의원"]]);
  civic(38, 15800101, 17010101, [["official","런던 시장"],["merchant","모스크바 회사 상인"],["merchant","머천트 어드벤처러스 조합원"],["scholar","인스 오브 코트 법률가"],["priest","세인트폴 대성당 참사회원"]]);
  civic(42, 15800101, 17010101, [["official","스코틀랜드 고등민사법원 판사"],["official","에든버러 시 참사회원"],["merchant","리스 항구 선주"],["merchant","왕실 자치도시 상인"],["priest","세인트자일스 교회 목사"]]);
  civic(53, 15800101, 17010101, [["official","보헤미아 귀족의회 의원"],["scholar","프라하 대학 학자"],["merchant","블타바강 상인"],["noble","보헤미아 영주"],["priest","성 비투스 대성당 참사회원"]]);
  civic(54, 15800101, 17010101, [["official","궁정 회계원 관리"],["noble","오스트리아 주의회 귀족"],["merchant","도나우강 상인"],["scholar","빈 대학 교수"],["priest","성 슈테판 대성당 참사회원"]]);
  civic(57, 15800101, 17010101, [["official","공작령 서기관"],["noble","프로이센 지주 귀족"],["merchant","발트해 호박상"],["scholar","쾨니히스베르크 대학 학자"],["official","시 참사회원"]]);
  civic(60, 15800101, 17010101, [["noble","보야르 회의 귀족"],["official","사절청 서기관"],["priest","크렘린 대성당 사제"],["merchant","모스크바 대외무역상"],["official","궁정 재무 관리"]]);
  civic(62, 15800101, 17010101, [["official","왕국 대법관청 서기관"],["noble","마조프셰 의회 귀족"],["official","바르샤바 시 참사회원"],["merchant","비스와강 곡물상"],["priest","성 요한 성당 참사회원"]]);
  civic(64, 15800101, 17010101, [["official","왕실 서기관"],["merchant","발트해 철물상"],["noble","스웨덴 귀족의회 대표"],["merchant","스톡홀름 선주"],["official","시 참사회원"]]);
  civic(66, 15800101, 17010101, [["official","왕실 서기관"],["merchant","외레순 해협 선주"],["scholar","코펜하겐 대학 교수"],["noble","셸란 귀족"],["official","시 참사회원"]]);
  civic(67, 15800101, 17010101, [["official","아케르스후스 성 관리"],["merchant","노르웨이 목재 수출상"],["priest","오슬로 주교좌 목사"],["noble","노르웨이 지주 귀족"],["official","시 참사회원"]]);
  civic(79, 15800101, 17010101, [["official","카이로 카디"],["scholar","알아즈하르 학자"],["noble","맘루크 베이 가문 대표"],["merchant","홍해 무역상"],["official","카이로 시장 감독관"]]);
  // 오스만 정복 이전의 같은 도시에는 맘루크 시대의 관직과 상인들이 있다.
  ['샤피이파 카디','알아즈하르 학자','맘루크 아미르','홍해 무역상','카이로 무흐타시브'].forEach(function (name, i) {
    var sp = G.SPONSOR['civic_79_' + (i + 1)];
    sp.holders.unshift([1480, 1517, name, 0, 'g']);
    var ottomanPlace = sp.place;
    Object.defineProperty(sp, 'place', { enumerable:true, get:function () {
      return day() < 15170101 ? name + ' 집무처' : ottomanPlace;
    } });
  });
  civic(112, 15800101, 17010101, [["official","제국 재무관"],["official","카푸단 파샤의 관저 서기관"],["scholar","쉴레이마니예 메드레세 교수"],["merchant","갈라타 상인"],["official","이스탄불 카디"]]);
  civic(158, 16590000, 16620601, [["official","아바 궁정 서기관"],["priest","이라와디 강변 승원 주지"],["merchant","이라와디 선주"],["merchant","버마산 직물 상인"],["scholar","팔리어 학승"]]);
  civic(192, 15980918, 16150604, [["merchant","사카이 회합중 상인"],["merchant","사카이 연안 선주"],["scholar","다도 사범"],["merchant","철물상"],["priest","사카이 사찰 주지"]]);
  civic(174, 16461211, 16560000, [["official","광동 포정사 관원"],["official","광주부 관리"],["merchant","주강 선주"],["merchant","광동 비단상"],["scholar","광주 유학 교수"]]);
  civic(176, 16450818, 16461007, [["official","복건 포정사 관원"],["scholar","복주 유학 교수"],["merchant","복건 해상 상인"],["merchant","민강 선주"],["noble","복건 사족 대표"]]);
  civic(178, 16440619, 16450616, [["official","남경 예부 관원"],["official","남경 호부 관원"],["scholar","국자감 학관"],["merchant","양쯔강 선주"],["merchant","강남 비단상"]]);
  civic(181, 16560000, 16590000, [["official","운남부 관리"],["merchant","차마 무역상"],["noble","운남 토사 대표"],["official","성곽 수비관"],["scholar","운남부 학관"]]);
  civic(188, 15800101, 17010101, [["official","예부 관원"],["official","호부 관원"],["scholar","한림원 학사"],["merchant","운하 곡물상"],["official","도찰원 어사"]]);
  civic(190, 15800101, 17010101, [["official","호조 판서"],["official","예조 판서"],["scholar","성균관 대사성"],["merchant","한성 시전 상인"],["official","한성부 판윤"]]);
  civic(193, 15800101, 17010101, [["noble","조정 공가 대표"],["scholar","고잔 사찰의 학승"],["merchant","니시진 직물상"],["priest","교토 사찰 주지"],["merchant","교토 서적상"]]);
  civic(297, 16030324, 17010101, [["official","막부 재정 담당자"],["noble","하타모토 가신"],["merchant","니혼바시 어물상"],["merchant","에도성 납품 상인"],["priest","조조지 승려"]]);
  civic(312, 16250401, 17010101, [["noble","만주 귀족가 대표"],["official","궁정 문서관"],["merchant","요동 모피상"],["official","군량 담당관"],["merchant","인삼 교역상"]]);
  civic(314, 16210101, 17010101, [["noble","여진 귀족 대표"],["merchant","요동 인삼상"],["official","성곽 수비관"],["merchant","모피 교역상"],["official","군량 담당관"]]);
  civic(327, 15800101, 17010101, [["official","카스티야 평의회 위원"],["official","인디아스 평의회 위원"],["merchant","왕실 납품 상인"],["noble","카스티야 귀족가 대표"],["priest","왕실 예배당 사제"]]);
  civic(328, 15800101, 17010101, [["official","왕립 고등법원 판사"],["scholar","바야돌리드 대학 법학교수"],["priest","산파블로 수도원장"],["merchant","메세타 양모상"],["noble","카스티야 지주 귀족"]]);
  civic(329, 15800101, 17010101, [["official","홀란트 주의회 의원"],["official","홀란트 법원 판사"],["noble","홀란트 기사단 대표"],["merchant","홀란트 연안 선주"],["scholar","홀란트 지도 제작자"]]);
  civic(330, 15800101, 17010101, [["official","헝가리 왕실 회계원 관리"],["noble","헝가리 의회 귀족"],["priest","성 마르틴 성당 참사회원"],["merchant","도나우강 선주"],["official","자유왕립도시 참사회원"]]);
  civic(331, 15800101, 17010101, [["scholar","크라쿠프 대학 교수"],["official","시 참사회원"],["noble","마워폴스카 귀족"],["merchant","비스와강 소금상"],["priest","바벨 대성당 참사회원"]]);
  civic(332, 16160217, 17010101, [["noble","건주여진 귀족"],["official","칸의 서기관"],["merchant","여진 인삼상"],["merchant","요동 말 상인"],["official","성곽 수비관"]]);
  civic(333, 15800101, 17010101, [["official","선제후 비서관"],["noble","브란덴부르크 의회 귀족"],["merchant","슈프레강 상인"],["priest","궁정 설교자"],["official","베를린 참사회원"]]);
})(window.G = window.G || {});
