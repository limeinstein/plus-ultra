/* 바람과 소금의 항해사 30명. 1487년부터 10명씩 10년간 세 차례 등장하고,
   마지막 10년은 쉰다. 40년마다 고용 중인 동료를 빼고 저장별로 다시 섞는다.
   영국·스페인·포르투갈·네덜란드만 배정하며 기본 특기 3~6개·언어 3~5개를 갖는다. */
(function (G) {
  'use strict';
  var U = G.U, cfg = G.BALANCE.windsaltCrew;
  // 이베리아 안에서도 포르투갈과 스페인의 활동 지역을 나눈다. 점령으로 국적이 바뀌어도 이동 범위는 유지한다.
  var iberia = G.MATE_ZONES.iberia.ids;
  var portuguese = [0, 1, 84, 86, 87];   // 리스본·오포르토·세우타·아조레스·마디라 (도시 표를 읽기 전에도 등록할 수 있다.)
  G.MATE_ZONES.windsalt_portugal = { name: '포르투갈', ids: portuguese };
  G.MATE_ZONES.windsalt_spain = { name: '스페인', ids: iberia.filter(function (id) { return portuguese.indexOf(id) < 0; }) };
  G.MATE_ZONES.windsalt_britain = { name: '영국', ids: [38, 39, 40, 41, 42] }; // 아일랜드 제외
  G.MATE_ZONES.windsalt_netherlands = { name: '네덜란드', ids: [24] }; // 현재 도시 표의 암스테르담. 벨기에·해외 식민지는 제외
  var crew = [
    { no: "pt01", id: "wscrew_pt01", name: "디오구 살가두", nat: "PT", natName: "포르투갈", style: "ib", home: 0, zone: "windsalt_portugal", reg: [0], portraitAge: 36,
      st: [91,65,77,76], sk: {"ops":3,"nav":3,"ship":2}, lg: {"0":3,"1":3,"3":2}, fame: 300, wage: 85,
      desc: "포르투갈 출신의 돛줄을 맡는 갑판장. 비에 젖은 밧줄도 손에서 놓치지 않고, 바람이 바뀌면 몸을 뒤로 젖혀 돛을 받아 낸다." },
    { no: "pt02", id: "wscrew_pt02", name: "누누 세이샤스", nat: "PT", natName: "포르투갈", style: "ib", home: 1, zone: "windsalt_portugal", reg: [0], portraitAge: 29,
      st: [89,69,84,78], sk: {"sword":3,"ops":3,"gun":2,"shoot":2,"med":2}, lg: {"0":3,"1":3,"2":2,"5":2}, fame: 400, wage: 90,
      desc: "포르투갈 출신의 상선의 호위 부관. 갑판 한가운데 팔짱을 끼고 당직을 살피며, 다툼이 나면 먼저 두 사람 사이에 선다." },
    { no: "pt03", id: "wscrew_pt03", name: "후이 바헤투", nat: "PT", natName: "포르투갈", style: "ib", home: 84, zone: "windsalt_portugal", reg: [0], portraitAge: 38,
      st: [86,86,70,84], sk: {"survey":3,"nav":3,"sci":3,"hist":2,"art":2,"ops":2}, lg: {"0":3,"1":3,"2":3,"3":2,"5":2}, fame: 500, wage: 95,
      desc: "포르투갈 출신의 해도사. 넓게 펼친 해도에 모래톱과 작은 만까지 그려 넣고, 돌아오는 배에서 새 물길을 듣는다." },
    { no: "pt04", id: "wscrew_pt04", name: "토메 마레스", nat: "PT", natName: "포르투갈", style: "ib", home: 86, zone: "windsalt_portugal", reg: [0], portraitAge: 31,
      st: [88,79,77,73], sk: {"nav":3,"survey":3,"ops":2,"shoot":2}, lg: {"0":3,"1":3,"5":2}, fame: 600, wage: 100,
      desc: "포르투갈 출신의 선단의 망지기. 먼 돛과 해안의 빛을 먼저 알아보고, 망을 본 뒤에는 항로를 동료와 함께 확인한다." },
    { no: "pt05", id: "wscrew_pt05", name: "가스파르 팔캉", nat: "PT", natName: "포르투갈", style: "ib", home: 87, zone: "windsalt_portugal", reg: [0], portraitAge: 51,
      st: [90,72,79,67], sk: {"craft":3,"ops":3,"ship":3,"nav":2,"med":2}, lg: {"0":3,"1":3,"3":2,"10":2}, fame: 700, wage: 105,
      desc: "포르투갈 출신의 밧줄 손질공. 오래된 매듭도 손끝으로 풀어 내고, 해진 줄은 힘이 걸리는 방향부터 살핀다." },
    { no: "pt06", id: "wscrew_pt06", name: "벤투 발레", nat: "PT", natName: "포르투갈", style: "ib", home: 0, zone: "windsalt_portugal", reg: [0], portraitAge: 33,
      st: [93,65,80,75], sk: {"ops":3,"ship":3,"nav":3,"craft":2,"sword":2,"cook":2}, lg: {"0":3,"1":3,"2":3,"5":2,"8":2}, fame: 800, wage: 110,
      desc: "포르투갈 출신의 돛줄 운반꾼. 무거운 밧줄 꾸러미를 어깨에 메고 다니며, 배가 기울기 전에 갑판의 짐부터 붙잡는다." },
    { no: "en01", id: "wscrew_en01", name: "토머스 리드", nat: "EN", natName: "영국", style: "ne", home: 38, zone: "windsalt_britain", reg: [1], portraitAge: 45,
      st: [89,70,78,72], sk: {"ops":3,"ship":3,"sword":2}, lg: {"0":3,"1":2,"3":3}, fame: 300, wage: 85,
      desc: "영국 출신의 갑판 부관. 젖은 소매를 더 걷어 올리고 선원들과 함께 일한다. 거친 파도 뒤에는 선체의 이음새부터 살핀다." },
    { no: "en02", id: "wscrew_en02", name: "개러스 홀트", nat: "EN", natName: "영국", style: "ne", home: 39, zone: "windsalt_britain", reg: [1], portraitAge: 35,
      st: [87,77,72,86], sk: {"nav":3,"ops":3,"survey":2,"music":2,"sci":2}, lg: {"1":2,"2":3,"3":3,"5":2}, fame: 400, wage: 90,
      desc: "영국 출신의 바람잡이. 바람에 날리는 머리를 쓸어 넘기며 풍향을 읽고, 갑작스러운 돌풍에도 당직의 박자를 지킨다." },
    { no: "en03", id: "wscrew_en03", name: "에드먼드 쇼", nat: "EN", natName: "영국", style: "ne", home: 40, zone: "windsalt_britain", reg: [1], portraitAge: 58,
      st: [90,85,76,74], sk: {"nav":3,"survey":3,"ops":3,"ship":2,"hist":2,"speech":2}, lg: {"0":3,"1":3,"2":2,"3":3,"4":2}, fame: 500, wage: 95,
      desc: "영국 출신의 노련한 조타수. 난간에 두 손을 짚고 물살을 오래 바라본다. 낯선 만에 들어가기 전에는 깊은 곳과 얕은 곳을 나눠 말한다." },
    { no: "en04", id: "wscrew_en04", name: "마일스 플린트", nat: "EN", natName: "영국", style: "ne", home: 38, zone: "windsalt_britain", reg: [1], portraitAge: 32,
      st: [88,72,74,77], sk: {"craft":3,"ship":3,"ops":2,"nav":2}, lg: {"0":2,"2":3,"3":3}, fame: 600, wage: 100,
      desc: "영국 출신의 돛 수선공. 파도에 젖은 천을 짜고 펼치며 찢어진 결을 찾는다. 작은 수선도 다음 돌풍을 견디도록 마무리한다." },
    { no: "en05", id: "wscrew_en05", name: "일라이어스 크로", nat: "EN", natName: "영국", style: "ne", home: 42, zone: "windsalt_britain", reg: [1], portraitAge: 40,
      st: [85,86,69,86], sk: {"acct":3,"speech":3,"hist":3,"craft":2,"nav":2}, lg: {"0":3,"1":2,"2":2,"3":3}, fame: 700, wage: 105,
      desc: "영국 출신의 선단의 경리. 나무 상자에 걸터앉아 장부의 셈을 생각한다. 짐의 수량뿐 아니라 선원들의 몫도 빠뜨리지 않는다." },
    { no: "en06", id: "wscrew_en06", name: "네이선 웨스트", nat: "EN", natName: "영국", style: "ne", home: 39, zone: "windsalt_britain", reg: [1], portraitAge: 37,
      st: [89,82,75,82], sk: {"nav":3,"survey":3,"speech":3,"ops":2,"sci":2,"art":2}, lg: {"0":3,"1":3,"2":2,"3":3,"5":2}, fame: 800, wage: 110,
      desc: "영국 출신의 항로 안내인. 해도 두루마리를 끼고 다음 곶을 가리킨다. 처음 온 선원에게도 물길을 쉬운 말로 풀어 준다." },
    { no: "es01", id: "wscrew_es01", name: "알론소 리바스", nat: "ES", natName: "스페인", style: "ib", home: 7, zone: "windsalt_spain", reg: [0], portraitAge: 36,
      st: [90,85,80,75], sk: {"nav":3,"sci":3,"survey":2}, lg: {"0":3,"1":3,"5":2}, fame: 300, wage: 85,
      desc: "스페인 출신의 나침반지기. 나침반의 바늘과 하늘의 별을 번갈아 확인하며, 오래된 항해 기록의 어긋난 방향을 바로잡는다." },
    { no: "es02", id: "wscrew_es02", name: "디에고 카스타뇨", nat: "ES", natName: "스페인", style: "ib", home: 8, zone: "windsalt_spain", reg: [0], portraitAge: 34,
      st: [88,73,83,77], sk: {"nav":3,"sword":3,"ops":2,"shoot":2,"survey":2}, lg: {"0":3,"1":3,"2":2,"3":2}, fame: 400, wage: 90,
      desc: "스페인 출신의 해안 정찰꾼. 몸을 돌려 먼저 길을 나서고, 뒤따르는 동료가 있는지 돌아본다. 낯선 항구의 샛길도 금세 익힌다." },
    { no: "es03", id: "wscrew_es03", name: "마테오 살세도", nat: "ES", natName: "스페인", style: "ib", home: 2, zone: "windsalt_spain", reg: [0], portraitAge: 30,
      st: [93,69,78,85], sk: {"ops":3,"acct":3,"ship":3,"craft":2,"cook":2,"speech":2}, lg: {"0":3,"1":3,"2":3,"3":2,"5":2}, fame: 500, wage: 95,
      desc: "스페인 출신의 선창 관리인. 돛감 자루를 어깨에 들어 올려 짐을 옮기고, 무게가 한쪽으로 쏠리지 않게 자리를 정한다." },
    { no: "es04", id: "wscrew_es04", name: "로드리고 벨라", nat: "ES", natName: "스페인", style: "ib", home: 3, zone: "windsalt_spain", reg: [0], portraitAge: 46,
      st: [88,80,86,76], sk: {"sword":3,"speech":3,"gun":2,"ops":2}, lg: {"0":3,"2":3,"5":2}, fame: 600, wage: 100,
      desc: "스페인 출신의 상선의 협상가. 뒷짐을 지고 상대의 말을 끝까지 듣는다. 날카로운 눈빛과 침착한 말씨로 갑판의 다툼을 가라앉힌다." },
    { no: "es05", id: "wscrew_es05", name: "후안 세라노", nat: "ES", natName: "스페인", style: "ib", home: 11, zone: "windsalt_spain", reg: [0], portraitAge: 39,
      st: [89,70,78,85], sk: {"ops":3,"music":3,"speech":3,"sword":2,"nav":2}, lg: {"0":3,"1":3,"2":2,"5":2}, fame: 700, wage: 105,
      desc: "스페인 출신의 갑판의 구령꾼. 목 뒤에 막대를 걸치고 쉬다가도 닻을 올릴 때면 노래로 박자를 맞춰 동료의 힘을 모은다." },
    { no: "es06", id: "wscrew_es06", name: "이니고 발데스", nat: "ES", natName: "스페인", style: "ib", home: 12, zone: "windsalt_spain", reg: [0], portraitAge: 42,
      st: [88,82,77,78], sk: {"nav":3,"cook":3,"ops":3,"survey":2,"med":2,"sci":2}, lg: {"0":3,"1":3,"2":3,"3":2,"11":2}, fame: 800, wage: 110,
      desc: "스페인 출신의 조타수 겸 선상 요리사. 난간에 기대어 물을 한 모금 마시며 물살을 살핀다. 당직 뒤에는 지친 동료에게 따뜻한 끼니를 챙긴다." },
    { no: "de01", id: "wscrew_de01", name: "코엔라트 판 덴 베르흐", nat: "NL", natName: "네덜란드", style: "ne", home: 24, zone: "windsalt_netherlands", reg: [1], portraitAge: 40,
      st: [94,73,82,71], sk: {"ship":3,"ops":3,"craft":2}, lg: {"1":3,"2":2,"3":3}, fame: 300, wage: 85,
      desc: "네덜란드 출신의 선목수. 거친 목재를 두 팔로 받쳐 들고 선체에 맞는 결을 고른다. 삐걱거리는 소리만으로 헐거운 곳을 찾는다." },
    { no: "de02", id: "wscrew_de02", name: "루커스 브랜트", nat: "EN", natName: "영국", style: "ne", home: 40, zone: "windsalt_britain", reg: [1], portraitAge: 31,
      st: [89,76,79,80], sk: {"ops":3,"speech":3,"nav":2,"ship":2,"sword":2}, lg: {"0":3,"1":2,"2":2,"3":3}, fame: 400, wage: 90,
      desc: "영국 출신의 갑판 부관. 옷깃을 정돈하고 당직을 나누지만 손에 흙 묻는 일도 마다하지 않는다. 처음 탄 선원에게 일을 차근히 가르친다." },
    { no: "de03", id: "wscrew_de03", name: "엔히크 코스타", nat: "PT", natName: "포르투갈", style: "ib", home: 1, zone: "windsalt_portugal", reg: [0], portraitAge: 48,
      st: [94,68,81,69], sk: {"ops":3,"ship":3,"med":3,"craft":2,"cook":2,"nav":2}, lg: {"0":3,"1":3,"2":3,"3":2,"5":2}, fame: 500, wage: 95,
      desc: "포르투갈 출신의 배수 당직장. 물동이를 밧줄로 끌어 올리고 선창의 물을 살핀다. 동료가 다치면 일을 멈추고 먼저 손을 내민다." },
    { no: "de04", id: "wscrew_de04", name: "마티아스 로하스", nat: "ES", natName: "스페인", style: "ib", home: 8, zone: "windsalt_spain", reg: [0], portraitAge: 44,
      st: [92,69,89,73], sk: {"sword":3,"shoot":3,"gun":2,"ops":2}, lg: {"0":3,"1":3,"2":2}, fame: 600, wage: 100,
      desc: "스페인 출신의 선단 호위병. 긴 당직 뒤에는 두 팔을 머리 뒤로 뻗어 몸을 푼다. 갑판의 좁은 곳에서도 검과 총을 침착하게 다룬다." },
    { no: "de05", id: "wscrew_de05", name: "올리버 셰일", nat: "EN", natName: "영국", style: "ne", home: 39, zone: "windsalt_britain", reg: [1], portraitAge: 54,
      st: [91,87,78,76], sk: {"nav":3,"survey":3,"ops":3,"sci":2,"hist":2}, lg: {"0":3,"1":2,"2":2,"3":3}, fame: 700, wage: 105,
      desc: "영국 출신의 노장 키잡이. 하얀 머리카락을 바람에 맡기고 키를 돌린다. 격한 물살에서도 다음 번 파도가 배를 드는 순간을 기다린다." },
    { no: "de06", id: "wscrew_de06", name: "펠리스 테이셰이라", nat: "PT", natName: "포르투갈", style: "ib", home: 0, zone: "windsalt_portugal", reg: [0], portraitAge: 28,
      st: [89,76,75,84], sk: {"craft":3,"ops":3,"ship":3,"nav":2,"speech":2,"cook":2}, lg: {"0":3,"1":3,"2":3,"3":2,"5":2}, fame: 800, wage: 110,
      desc: "포르투갈 출신의 돛줄 기술자. 일을 마치면 두 손의 소금기를 털며 웃는다. 도르래와 매듭을 고쳐 적은 힘으로도 돛을 움직이게 한다." },
    { no: "nl01", id: "wscrew_nl01", name: "빌럼 포스", nat: "NL", natName: "네덜란드", style: "ne", home: 24, zone: "windsalt_netherlands", reg: [1], portraitAge: 37,
      st: [89,76,76,80], sk: {"ops":3,"speech":3,"nav":2}, lg: {"0":3,"1":2,"3":3}, fame: 300, wage: 85,
      desc: "네덜란드 출신의 선단 신호수. 멀리 오는 동료에게 한 손을 높이 들어 인사하고, 함대의 신호를 또렷한 동작으로 전한다." },
    { no: "nl02", id: "wscrew_nl02", name: "피터르 드로스트", nat: "NL", natName: "네덜란드", style: "ne", home: 24, zone: "windsalt_netherlands", reg: [1], portraitAge: 32,
      st: [90,80,75,89], sk: {"speech":3,"acct":3,"craft":2,"nav":2,"hist":2}, lg: {"0":3,"1":2,"2":2,"3":3}, fame: 400, wage: 90,
      desc: "네덜란드 출신의 상선의 교섭꾼. 두 팔을 벌려 낯선 손님도 호쾌하게 맞는다. 장사에서는 웃음을 잃지 않으면서도 셈을 놓치지 않는다." },
    { no: "nl03", id: "wscrew_nl03", name: "마르턴 스밋", nat: "NL", natName: "네덜란드", style: "ne", home: 24, zone: "windsalt_netherlands", reg: [1], portraitAge: 35,
      st: [92,75,80,76], sk: {"ship":3,"craft":3,"ops":3,"nav":2,"survey":2,"art":2}, lg: {"0":3,"1":3,"2":2,"3":3,"5":2}, fame: 500, wage: 95,
      desc: "네덜란드 출신의 돛 제작자. 두 팔에 말아 놓은 돛천을 안고 다니며, 바람을 받을 결에 맞춰 천을 잇고 수선한다." },
    { no: "nl04", id: "wscrew_nl04", name: "야스퍼르 판 레인", nat: "NL", natName: "네덜란드", style: "ne", home: 24, zone: "windsalt_netherlands", reg: [1], portraitAge: 29,
      st: [87,83,74,82], sk: {"craft":3,"ship":3,"ops":2,"sci":2}, lg: {"1":3,"2":2,"3":3}, fame: 600, wage: 100,
      desc: "네덜란드 출신의 밧줄 감정사. 끊어진 줄을 눈앞에 들어 올려 살핀다. 매듭의 겉모양보다 안쪽에서 상한 섬유를 먼저 찾아낸다." },
    { no: "nl05", id: "wscrew_nl05", name: "헨드릭 본", nat: "NL", natName: "네덜란드", style: "ne", home: 24, zone: "windsalt_netherlands", reg: [1], portraitAge: 43,
      st: [85,89,69,85], sk: {"acct":3,"hist":3,"survey":3,"art":2,"speech":2}, lg: {"0":3,"1":2,"2":2,"3":3}, fame: 700, wage: 105,
      desc: "네덜란드 출신의 항해 기록관. 작은 수첩에 물때와 교역 기록을 적는다. 오래된 항해의 경험도 지금의 길찾기에 알맞게 풀어 낸다." },
    { no: "nl06", id: "wscrew_nl06", name: "클라스 펠트", nat: "NL", natName: "네덜란드", style: "ne", home: 24, zone: "windsalt_netherlands", reg: [1], portraitAge: 41,
      st: [90,78,77,84], sk: {"cook":3,"med":3,"ops":3,"sci":2,"acct":2,"nav":2}, lg: {"0":3,"1":3,"3":3,"5":2,"8":2}, fame: 800, wage: 110,
      desc: "네덜란드 출신의 물과 식량의 관리인. 팔에 물을 부어 소금기를 씻고 나면 물통의 양을 다시 잰다. 긴 항해에서 동료가 마실 물과 먹을 것을 아껴 챙긴다." }
  ];
  // 저장 호환을 위해 초기 원화의 de 접두사도 ID·파일명으로만 유지한다. 현재 국적과 활동 지역은 위 자료를 따른다.
  var ids = crew.map(function (m) { return m.id; });
  crew.forEach(function (m) {
    m.windsaltRotation = true;
    m.face = 'portraits/mates/windsalt-men/' + m.no;
    m.halfKey = m.face + '_half';
    m.g = 'm'; m.role = 'sailor'; m.typeName = '항해사'; m.y = [cfg.start, 9999]; m.skBoost = 1;
    G.MATES.push(m); G.MATE[m.id] = m;
    G.MATE_RANGE[m.id] = { zones: [m.zone], home: m.home };
  });

  function state() { return G.Game && G.Game.state; }
  function busy(s, id) {
    return !!(s && ((s.flags && s.flags['gone_' + id]) || (s.mates || []).some(function (m) { return m.id === id; })));
  }
  function cycleOf(year) { return Math.floor((year - cfg.start) / cfg.cycle); }
  function periodOf(year) { return Math.floor((year - cfg.start) / cfg.years); }
  function validOrder(order) {
    return Array.isArray(order) && order.every(function (id, i) { return ids.indexOf(id) >= 0 && order.indexOf(id) === i; });
  }
  // 추첨할 때 고용·퇴장한 인물을 제외하고, 그 결과를 저장한다. 고용할 때마다 다음 후보를 끌어오지는 않는다.
  function roster(year, seed) {
    var s = state(), cycle = cycleOf(year), key = String(seed == null ? 0 : seed), saved = s && s.windsaltCrew;
    if (saved && saved.cycle === cycle && saved.seed === key && validOrder(saved.order)) return saved.order;
    var eligible = ids.filter(function (id) { return !busy(s, id); });
    var rand = U.makeRng(U.strHash('windsalt-crew:' + key + ':' + cycle));
    var order = U.shuffle(eligible, rand);
    if (s) s.windsaltCrew = { cycle: cycle, seed: key, order: order };
    return order;
  }
  G.WindsaltCrew = {
    ids: ids.slice(),
    active: function (id, year, seed) {
      if (ids.indexOf(id) < 0 || year < cfg.start || busy(state(), id)) return false;
      var period = periodOf(year), slot = period % (cfg.cycle / cfg.years);
      if (slot >= Math.ceil(ids.length / cfg.count)) return false;
      var index = roster(year, seed).indexOf(id), start = slot * cfg.count;
      return index >= start && index < start + cfg.count;
    },
    roster: function (year, seed) { return year < cfg.start ? [] : roster(year, seed).slice(); },
    periodText: function (year) {
      var restYears = Math.max(0, cfg.cycle - Math.ceil(ids.length / cfg.count) * cfg.years);
      if (year == null || year < cfg.start) return cfg.start + '년부터 ' + cfg.years + '년마다 최대 ' + cfg.count + '명 · ' + cfg.cycle + '년 주기' + (restYears ? '(마지막 ' + restYears + '년 휴식)' : '');
      var start = cfg.start + periodOf(year) * cfg.years;
      var rest = periodOf(year) % (cfg.cycle / cfg.years) >= Math.ceil(ids.length / cfg.count);
      return start + '~' + (start + cfg.years - 1) + '년' + (rest ? ' (등장 휴식)' : '');
    }
  };
})(window.G = window.G || {});
