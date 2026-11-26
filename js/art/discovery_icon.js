/* 발견한 유적·자연 경관을 항해·해도·육상 탐험 지도에 표시하는 투명 미니어처. */
(function (G) {
  'use strict';
  var DI = {};
  G.DiscoveryIcon = DI;

  var COLS = 4, ROWS = 4, BASE = 42;
  var SHEETS = [
    ['map-discoveries/ruins-1', ['carnac', 'stonehenge', 'mycenae', 'delphi', 'knossos', 'pyramid', 'giza', 'kings', 'thebes', 'abusimbel', 'troy', 'ishtar', 'babel']],
    ['map-discoveries/ruins-2', ['persepolis', 'mohenjo', 'angkor', 'yungang', 'qinshi', 'greatwall', 'qianling', 'muryeong', 'bulguksa', 'seokguram', 'munmu', 'fertile', 'borobudur']],
    ['map-discoveries/ruins-3', ['tula', 'nazca', 'tiwanaku', 'poitiers', 'montstmichel', 'stave', 'rusch', 'prester', 'cappadocia', 'edom', 'ur', 'petra', 'brendan']],
    ['map-discoveries/ruins-4', ['cibola', 'ark', 'tajmahal', 'qutb', 'madurai', 'shwedagon', 'konjiki', 'pueblo', 'machupicchu', 'sacsay', 'moai', 'mu', 'ananda']],
    ['map-discoveries/ruins-5', ['muyeol', 'hanging', 'artemis', 'colossus', 'mausoleum', 'zeus', 'barkal', 'mahabodhi', 'nalanda', 'sanchi', 'teotihuacan', 'tikal', 'cahokia', 'dursharrukin', 'theodoric', 'haamonga']],
    ['map-discoveries/ruins-6', ['chichen', 'kamakura', 'samarra', 'brihadeeswarar', 'nanmadol', 'serpentmound', 'haleokeawe', 'rila', 'reykholt', 'xiengthong', 'oxford', 'boudhanath', 'doisuthep', 'himeji', 'escorial', 'neuschwanstein']],
    ['map-discoveries/ruins-7', ['brandenburg', 'hermitage', 'ruhr', 'goldengate', 'amundsen', 'pentagon', 'rushmore', 'threegorges', 'prora', 'cntower', 'hubble', 'iss', 'chengde', 'dogo', 'kasubi', 'ubudiah']],
    ['map-discoveries/ruins-8', ['santamaria', 'haeinsa', 'mireuksa', 'baidinh', 'yonaguni', 'yonggung', 'sarnath', 'goree', 'shaolin', 'anjiqiao', 'qufu', 'wudang', 'ellora', 'khajuraho', 'konark', 'harmandir']],
    ['map-discoveries/ruins-9', ['krak', 'shibam', 'lelu', 'akrotiri', 'gadir', 'atlantis', 'qeswachaka', 'vilcabamba', 'paititi', 'guge', 'skycaves', 'shambhala', 'langya', 'seobul', 'shingu', 'marib']],
    ['map-discoveries/ruins-10', ['shabwa', 'ubar', 'tintagel', 'arthurtomb', 'hvalsey', 'lanseaux', 'mahabali', 'poompuhar', 'dwarka', 'chicomoztoc', 'paquime', 'mesaverde']],
    ['map-discoveries/nature-1', ['pamukkale', 'huangshan', 'uluru', 'canyon', 'monument', 'niagara', 'iguazu', 'gibraltar', 'matterhorn', 'vihren', 'gullfoss', 'eyjafjalla', 'sinai', 'kilimanjaro', 'lengai', 'solomon']],
    ['map-discoveries/nature-2', ['adamspeak', 'flowers', 'kailash', 'machapuchare', 'everest', 'zhangjiajie', 'seongsan', 'nachi', 'fuji', 'reef', 'mapuavaea', 'bermuda', 'youth', 'bluehole', 'barringer', 'redwood']],
    ['map-discoveries/nature-3', ['craterlake', 'devilstower', 'oldfaithful', 'joatinga', 'roraima', 'vinicunca', 'cerrorico', 'torrespaine', 'corryvreckan', 'maelstrom', 'icebergs', 'surtsey', 'sargasso', 'milkysea']],
    ['map-discoveries/nature-4', ['trangan', 'halong', 'pinklake', 'sahara', 'gobi', 'deadsea', 'blacksea', 'serengeti', 'amazon', 'uyuni', 'angelfalls', 'hawaii', 'waikiki', 'mojave', 'moraine', 'guilin']],
    ['map-discoveries/nature-5', ['taishan', 'emeishan', 'huashan', 'wuyishan', 'lushan', 'sanxia', 'hukou', 'qiantang', 'shilin', 'huangguoshu', 'yulong', 'dongting', 'putuo', 'tianchi', 'qinghaihu', 'mingsha']],
    ['map-discoveries/nature-6', ['huoyan', 'yandang', 'manasarovar', 'dallake', 'gangotri', 'chilika', 'jogfalls', 'cedars', 'damavand', 'wadirum', 'socotra', 'rubalkhali', 'azoresridge', 'guatavita', 'penglai', 'tor']],
    ['map-discoveries/nature-7', ['avalon', 'ultimathule', 'hyperborea', 'ramsetu', 'aztlan']],
    ['map-discoveries/new-ruins-1', ['sphinx', 'luxor', 'angkorthom', 'santiago', 'monreale', 'chartres', 'durham', 'utrecht', 'hwaseong', 'sagres', 'burjkhalifa', 'palenque', 'uxmal', 'prambanan', 'taprohm', 'banteaysrei']],
    ['map-discoveries/new-ruins-2', ['preahvihear', 'shwezigon', 'kyaiktiyo', 'sukhothai', 'myson', 'ponagar', 'watphou', 'plainofjars', 'ifugao', 'sanagustin', 'besakih', 'tanahlot', 'trowulan', 'sukuh', 'samye', 'tashilhunpo']],
    ['map-discoveries/new-ruins-3', ['ganden', 'sera', 'drepung', 'sakya', 'kumbum', 'gyantsekumbum', 'karakorumturtle', 'orkhon', 'xanadu', 'deerstone', 'pazyryk', 'arzhan', 'isker', 'sikachi', 'karabalgasun', 'shamanrock']],
    ['map-discoveries/new-ruins-4', ['hegra', 'stcatherine', 'selimiye', 'sumela', 'nemrut', 'hattusa', 'ani', 'philae']],
    ['map-discoveries/new-nature-1', ['kinabalu', 'phongnha', 'toba', 'bromo', 'krakatau', 'mayon', 'chocolatehills', 'phangnga', 'kuangsi', 'tubbataha', 'baikal', 'lenapillars', 'kamgeysers', 'klyuchevskaya', 'yarlung', 'namtso']],
    ['map-discoveries/new-nature-2', ['khovsgol', 'bayanzag', 'belukha', 'oymyakon', 'whitedesert', 'siwa', 'lakevan', 'rasmohammed', 'jebelshams']],
    ['map-discoveries/mystery-ruins-1', ['altamira', 'coavalley', 'menga', 'almendres', 'millares', 'tudons', 'briteiros', 'azahara', 'canchoroano', 'atapuerca', 'lascaux', 'niaux', 'newgrange', 'skarabrae', 'callanish', 'externsteine']],
    ['map-discoveries/mystery-ruins-2', ['biskupin', 'trelleborg', 'alesstenar', 'tanum', 'celsus', 'hypogeum', 'sunuraxi', 'baiae', 'pavlopetri', 'antikythera', 'catalhoyuk', 'camonica', 'varnagold', 'banditaccia', 'meroe', 'tiya']],
    ['map-discoveries/mystery-ruins-3', ['wassu', 'mapungubwe', 'tsodilo', 'gedi', 'laasgeel', 'twyfelfontein', 'igboukwu', 'nok', 'gobeklitepe', 'baalbekstones', 'jerichotower', 'rujmelhiri', 'qumranscrolls', 'nabtaplaya', 'osireion', 'swimmerscave']],
    ['map-discoveries/mystery-ruins-4', ['dilmunmounds', 'atlityam', 'roopkund', 'bhimbetka', 'dholavira', 'barabarcaves', 'elephantacaves', 'edakkal', 'sigiriya', 'ranikivav', 'unakoti', 'hirebenakal', 'caocaotomb', 'sanxingdui', 'mawangdui', 'tunximigul']],
    ['map-discoveries/mystery-ruins-5', ['niuheliang', 'xixiatombs', 'bangudae', 'ganghwadolmen', 'janggunchong', 'jisandong', 'loulan', 'xiaohetomb', 'kharakhoto', 'porbajin', 'arkaim', 'issykkurgan', 'tamgaly', 'shahrisokhta', 'gonurtepe', 'tillyatepe']],
    ['map-discoveries/mystery-ruins-6', ['gunungpadang', 'marospaint', 'niahcave', 'badamegalith', 'tagahouse', 'gwiongwion', 'kabayan', 'banchiang', 'oceo', 'pasemah', 'daisenkofun', 'ishibutai', 'iwafune', 'sannaimaruyama', 'oyustone', 'yoshinogari']],
    ['map-discoveries/mystery-ruins-7', ['kamegaoka', 'hashihaka', 'yoshimihyakuana', 'iwatoyama', 'chavin', 'caral', 'kuelap', 'laventa', 'sagustinstatue', 'teyuna', 'diquis', 'cuevamanos', 'pedrainga', 'povertypoint']]
  ];
  var POS = {};
  // 신규 신기루 32곳은 도시 밖 외관을 별도의 4×4 판 두 장으로 쓴다.
  SHEETS.push(
    ['map-discoveries/mirage-ruins-1', ['bernabeu', 'ponte25abril', 'forthbridge', 'berlintv', 'corinthcanal', 'oceanomonaco', 'bosphorusbridge', 'vicfallsbridge', 'yamoussoukro', 'tablemtn', 'ugandarail', 'suezcanal', 'aswandam', 'azaditower', 'kuwaittowers', 'victoriaterminus']],
    ['map-discoveries/mirage-ruins-2', ['gatewayindia', 'mysorepalace', 'bochinatower', 'baikalrail', 'medeu', 'novosibopera', 'petronas', 'raffles', 'longbien', 'sansebastian', 'tomioka', 'goryokaku', 'akashibridge', 'disneyworld', 'wtc', 'nasajsc']]
  );
  SHEETS.forEach(function (s) { s[1].forEach(function (id, i) { POS[id] = { key: s[0], slot: i }; }); });
  // 기존 4×4 판의 산치 칸 윗부분에는 위 칸(제우스상)의 받침대가 걸쳐 있다.
  // 경계가 겹치지 않는 전용 투명 그림을 쓴다.
  POS.sanchi = { key: 'map-discoveries/sanchi', slot: 0, cols: 1, rows: 1 };
  // 강서대묘는 봉분과 낮은 돌방 입구를 담은 전용 외관을 쓴다.
  POS.gangseo = { key: 'map-discoveries/completion/gangseo', slot: 0, cols: 1, rows: 1 };
  // 흩어진 그리스 성소: 자연 경관과 건축물 각각의 전용 투명 외관.
  ['pergusa', 'hermescave', 'yria', 'heraion', 'hephaistia', 'aretias', 'vesta'].forEach(function (id) {
    POS[id] = { key: 'map-discoveries/completion/' + id, slot: 0, cols: 1, rows: 1 };
  });

  // 바닷길 노래의 첫 항해에서 만나는 두 유적의 전용 지도 외관.
  ['sy_longmen', 'sy_todaiji'].forEach(function (id) {
    POS[id] = { key: 'map-discoveries/completion/' + id, slot: 0, cols: 1, rows: 1 };
  });

  // 2026-10-31 누락 외관 자동 등록 시작
  POS.aurora = { key: "map-discoveries/completion/aurora", slot: 0, cols: 1, rows: 1 };
  POS.maldives = { key: "map-discoveries/completion/maldives", slot: 0, cols: 1, rows: 1 };
  POS.yosemite = { key: "map-discoveries/completion/yosemite", slot: 0, cols: 1, rows: 1 };
  POS.prismatic = { key: "map-discoveries/completion/prismatic", slot: 0, cols: 1, rows: 1 };
  POS.delicatearch = { key: "map-discoveries/completion/delicatearch", slot: 0, cols: 1, rows: 1 };
  POS.bryce = { key: "map-discoveries/completion/bryce", slot: 0, cols: 1, rows: 1 };
  POS.deathvalley = { key: "map-discoveries/completion/deathvalley", slot: 0, cols: 1, rows: 1 };
  POS.mammothcave = { key: "map-discoveries/completion/mammothcave", slot: 0, cols: 1, rows: 1 };
  POS.everglades = { key: "map-discoveries/completion/everglades", slot: 0, cols: 1, rows: 1 };
  POS.fundy = { key: "map-discoveries/completion/fundy", slot: 0, cols: 1, rows: 1 };
  POS.atacama = { key: "map-discoveries/completion/atacama", slot: 0, cols: 1, rows: 1 };
  POS.titicaca = { key: "map-discoveries/completion/titicaca", slot: 0, cols: 1, rows: 1 };
  POS.pantanal = { key: "map-discoveries/completion/pantanal", slot: 0, cols: 1, rows: 1 };
  POS.galapagos = { key: "map-discoveries/completion/galapagos", slot: 0, cols: 1, rows: 1 };
  POS.peritomoreno = { key: "map-discoveries/completion/peritomoreno", slot: 0, cols: 1, rows: 1 };
  POS.aconcagua = { key: "map-discoveries/completion/aconcagua", slot: 0, cols: 1, rows: 1 };
  POS.lencois = { key: "map-discoveries/completion/lencois", slot: 0, cols: 1, rows: 1 };
  POS.copan = { key: "map-discoveries/completion/copan", slot: 0, cols: 1, rows: 1 };
  POS.quirigua = { key: "map-discoveries/completion/quirigua", slot: 0, cols: 1, rows: 1 };
  POS.joyaceren = { key: "map-discoveries/completion/joyaceren", slot: 0, cols: 1, rows: 1 };
  POS.elmirador = { key: "map-discoveries/completion/elmirador", slot: 0, cols: 1, rows: 1 };
  POS.pisac = { key: "map-discoveries/completion/pisac", slot: 0, cols: 1, rows: 1 };
  POS.ollantaytambo = { key: "map-discoveries/completion/ollantaytambo", slot: 0, cols: 1, rows: 1 };
  POS.moray = { key: "map-discoveries/completion/moray", slot: 0, cols: 1, rows: 1 };
  POS.choquequirao = { key: "map-discoveries/completion/choquequirao", slot: 0, cols: 1, rows: 1 };
  POS.sipan = { key: "map-discoveries/completion/sipan", slot: 0, cols: 1, rows: 1 };
  POS.tierradentro = { key: "map-discoveries/completion/tierradentro", slot: 0, cols: 1, rows: 1 };
  POS.pachacamac = { key: "map-discoveries/completion/pachacamac", slot: 0, cols: 1, rows: 1 };
  POS.etowah = { key: "map-discoveries/completion/etowah", slot: 0, cols: 1, rows: 1 };
  POS.moundville = { key: "map-discoveries/completion/moundville", slot: 0, cols: 1, rows: 1 };
  POS.casagrande = { key: "map-discoveries/completion/casagrande", slot: 0, cols: 1, rows: 1 };
  POS.yale = { key: "map-discoveries/completion/yale", slot: 0, cols: 1, rows: 1 };
  POS.princeton = { key: "map-discoveries/completion/princeton", slot: 0, cols: 1, rows: 1 };
  POS.dartmouth = { key: "map-discoveries/completion/dartmouth", slot: 0, cols: 1, rows: 1 };
  POS.cornell = { key: "map-discoveries/completion/cornell", slot: 0, cols: 1, rows: 1 };
  POS.stanford = { key: "map-discoveries/completion/stanford", slot: 0, cols: 1, rows: 1 };
  POS.jhu = { key: "map-discoveries/completion/jhu", slot: 0, cols: 1, rows: 1 };
  POS.worcesterwall = { key: "map-discoveries/completion/worcesterwall", slot: 0, cols: 1, rows: 1 };
  POS.manwoldae = { key: "map-discoveries/completion/manwoldae", slot: 0, cols: 1, rows: 1 };
  POS.somnath = { key: "map-discoveries/completion/somnath", slot: 0, cols: 1, rows: 1 };
  POS.alnuri = { key: "map-discoveries/completion/alnuri", slot: 0, cols: 1, rows: 1 };
  POS.aleppomosque = { key: "map-discoveries/completion/aleppomosque", slot: 0, cols: 1, rows: 1 };
  POS.samui = { key: "map-discoveries/completion/samui", slot: 0, cols: 1, rows: 1 };
  POS.phuket = { key: "map-discoveries/completion/phuket", slot: 0, cols: 1, rows: 1 };
  POS.langkawi = { key: "map-discoveries/completion/langkawi", slot: 0, cols: 1, rows: 1 };
  POS.penang = { key: "map-discoveries/completion/penang", slot: 0, cols: 1, rows: 1 };
  POS.bali = { key: "map-discoveries/completion/bali", slot: 0, cols: 1, rows: 1 };
  POS.boracay = { key: "map-discoveries/completion/boracay", slot: 0, cols: 1, rows: 1 };
  POS.cebu = { key: "map-discoveries/completion/cebu", slot: 0, cols: 1, rows: 1 };
  POS.palawan = { key: "map-discoveries/completion/palawan", slot: 0, cols: 1, rows: 1 };
  POS.srilanka = { key: "map-discoveries/completion/srilanka", slot: 0, cols: 1, rows: 1 };
  POS.seychelles = { key: "map-discoveries/completion/seychelles", slot: 0, cols: 1, rows: 1 };
  POS.zanzibar = { key: "map-discoveries/completion/zanzibar", slot: 0, cols: 1, rows: 1 };
  POS.mauritius = { key: "map-discoveries/completion/mauritius", slot: 0, cols: 1, rows: 1 };
  POS.okinawa = { key: "map-discoveries/completion/okinawa", slot: 0, cols: 1, rows: 1 };
  POS.jeju = { key: "map-discoveries/completion/jeju", slot: 0, cols: 1, rows: 1 };
  POS.mallorca = { key: "map-discoveries/completion/mallorca", slot: 0, cols: 1, rows: 1 };
  POS.ibiza = { key: "map-discoveries/completion/ibiza", slot: 0, cols: 1, rows: 1 };
  POS.sardinia = { key: "map-discoveries/completion/sardinia", slot: 0, cols: 1, rows: 1 };
  POS.capri = { key: "map-discoveries/completion/capri", slot: 0, cols: 1, rows: 1 };
  POS.sicily = { key: "map-discoveries/completion/sicily", slot: 0, cols: 1, rows: 1 };
  POS.malta = { key: "map-discoveries/completion/malta", slot: 0, cols: 1, rows: 1 };
  POS.milos = { key: "map-discoveries/completion/milos", slot: 0, cols: 1, rows: 1 };
  POS.santorini = { key: "map-discoveries/completion/santorini", slot: 0, cols: 1, rows: 1 };
  POS.madeira = { key: "map-discoveries/completion/madeira", slot: 0, cols: 1, rows: 1 };
  POS.azores = { key: "map-discoveries/completion/azores", slot: 0, cols: 1, rows: 1 };
  POS.skye = { key: "map-discoveries/completion/skye", slot: 0, cols: 1, rows: 1 };
  POS.bahamas = { key: "map-discoveries/completion/bahamas", slot: 0, cols: 1, rows: 1 };
  POS.jamaica = { key: "map-discoveries/completion/jamaica", slot: 0, cols: 1, rows: 1 };
  POS.dominica = { key: "map-discoveries/completion/dominica", slot: 0, cols: 1, rows: 1 };
  POS.stlucia = { key: "map-discoveries/completion/stlucia", slot: 0, cols: 1, rows: 1 };
  POS.grenada = { key: "map-discoveries/completion/grenada", slot: 0, cols: 1, rows: 1 };
  POS.aruba = { key: "map-discoveries/completion/aruba", slot: 0, cols: 1, rows: 1 };
  POS.goldenisles = { key: "map-discoveries/completion/goldenisles", slot: 0, cols: 1, rows: 1 };
  POS.maui = { key: "map-discoveries/completion/maui", slot: 0, cols: 1, rows: 1 };
  POS.oahu = { key: "map-discoveries/completion/oahu", slot: 0, cols: 1, rows: 1 };
  POS.fiji = { key: "map-discoveries/completion/fiji", slot: 0, cols: 1, rows: 1 };
  POS.tahiti = { key: "map-discoveries/completion/tahiti", slot: 0, cols: 1, rows: 1 };
  POS.borabora = { key: "map-discoveries/completion/borabora", slot: 0, cols: 1, rows: 1 };
  POS.cookisles = { key: "map-discoveries/completion/cookisles", slot: 0, cols: 1, rows: 1 };
  // 2026-10-31 누락 외관 자동 등록 끝

  // 초원·북유럽·시베리아 묶음에서 야외 외관이 있는 곳만 지도에 올린다.
  (G.STEPPE_NORSE || []).forEach(function (id) {
    var key = 'map-discoveries/completion/' + id;
    if (G.Img && G.Img.has(key)) POS[id] = { key: key, slot: 0, cols: 1, rows: 1 };
  });

  function nature(d) { return d&&G.NATURE_LANDMARKS&&G.NATURE_LANDMARKS[d.id]; }
  function model(d) {
    return nature(d)||(d && d.cat === 'ruin' && ((G.RUIN_MODELS && G.RUIN_MODELS[d.id]) || (G.RUIN_ADDITIONS && G.RUIN_ADDITIONS[d.id])));
  }
  DI.isMapLandmark = function (d) { return !!(nature(d)||(d && (d.cat === 'ruin' || d.cat === 'nature' || d.natural) && d.how !== 'city' && (POS[d.id] || model(d)))); };
  DI.replacesFormation = function (id) { return !!(G.NATURE_LANDMARKS&&G.NATURE_LANDMARKS[id]&&G.Disc&&G.Disc.foundByMe(id)); };
  var groundMemo = new WeakMap();
  DI.position = function (d) {
    var r=nature(d);
    if(r)return G.NatureLandmark.place(d,r,G.FX.natureLandmark.markerMin,1,0).point;
    if (!model(d) || d.how !== 'land' || !G.Geo || !G.Geo.ready) return [d.lon,d.lat];
    var memo = groundMemo.get(d);
    if (memo) return memo;
    var p = [d.lon,d.lat], fx = G.FX.mapRuins;
    // 다리는 하천 위에 있고, 둑에 있는 건물의 발치만 가까운 육지로 보정한다.
    if (d.id !== 'qeswachaka' && G.Geo.sdf(d.lon,d.lat) <= 0) {
      for (var band=1; band<=fx.shoreBands; band++) {
        var radius = fx.shoreStep*band, best = .025;
        for (var i=0; i<16; i++) {
          var a = Math.PI*i/8, lon = G.Geo.wrapLon(d.lon+radius*Math.cos(a)), lat = d.lat+radius*Math.sin(a);
          var land = G.Geo.sdf(lon,lat);
          if (land > best) { best=land; p=[lon,lat]; }
        }
        if (best>.025) break;
      }
    }
    groundMemo.set(d,p);
    return p;
  };
  /* 지도 위에 남는 발견물 — 매 프레임 발견물 1,200여 개를 다 훑던 것(1~2ms)을 0.25초 동안 다시 쓴다 (항해 버벅임 2026-11-01) */
  var visMemo = null;
  DI.visible = function () {
    if (!G.DISCOVERIES || !G.Disc) return [];
    var now = performance.now(), s = G.Game && G.Game.state;
    if (visMemo && visMemo.s === s && now - visMemo.at < 250) return visMemo.list;
    visMemo = { s: s, at: now, list: visibleNow() };
    return visMemo.list;
  };
  function visibleNow() {
    return G.DISCOVERIES.filter(function (d) {
      if (!DI.isMapLandmark(d)) return false;
      // 미래의 신기루 외관은 출현·소멸하는 동안만 보이고 지도에 영구히 남지 않는다.
      if ((d.mirage50 || d.alwaysMirage) && G.Disc.mirageNow && G.Disc.mirageNow(d)) {
        return G.Disc.built(d) && G.Mirage && G.Mirage.mapAlpha && G.Mirage.mapAlpha(d) > 0;
      }
      return G.Disc.foundByMe(d.id);
    });
  }
  DI.count = function () { return Object.keys(POS).length + Object.keys(Object.assign({},G.RUIN_ADDITIONS,G.RUIN_MODELS,G.NATURE_LANDMARKS)).filter(function (id) {
    return !POS[id] && G.DISC && DI.isMapLandmark(G.DISC[id]);
  }).length; };
  DI.source = function (d) {
    var p = d && POS[d.id];
    return p ? { key:p.key, slot:p.slot, cols:p.cols || COLS, rows:p.rows || ROWS } : null;
  };
  DI.key = function (d) {
    var r = model(d), p = d && POS[d.id];
    return r ? r[0] : p ? p.key : null;
  };

  function request(key) { if (key && G.Img && G.Img.has(key)) G.Img.want(key); }
  DI.preload = function (list) {
    var keys = {}, jobs = [];
    (list || DI.visible()).forEach(function (d) { var key = DI.key(d); if (key) keys[key] = 1; });
    Object.keys(keys).forEach(function (key) { if (G.Img && G.Img.has(key)) jobs.push(G.Img.load(key)); });
    return Promise.all(jobs);
  };

  function modelWidth(r, scale, zoom, fx) {
    var tier = r[7], width = fx.chart[tier];
    if (zoom) {
      var t = Math.max(0, Math.min(1, (zoom-fx.zoomStart)/(fx.zoomEnd-fx.zoomStart)));
      width = fx.width[tier] + t*(fx.close[tier]-fx.width[tier]);
    }
    return width*scale;
  }
  function modelMetrics(r, width) {
    var height = width*r[4]/r[3], left = -r[5]*width, top = -r[6]*width;
    return {width:width, height:height, radius:Math.max(width,height)*.46,
      left:left, right:left+width, top:top, base:top+height};
  }

  DI.metrics = function (d, scale, zoom) {
    scale = scale || 1;
    var r = model(d);
    if (r) return modelMetrics(r,modelWidth(r,scale,zoom,nature(d)?G.FX.natureLandmark:G.FX.mapRuins));
    if(zoom&&G.Terrain){
      if(d.id==='siwa'&&G.Terrain.microSites().length)return{width:24,height:24,radius:14,top:-12,base:12};
      var formation=G.Terrain.formationFor(d.id);if(formation&&G.TerrainArt){var w=Math.min(G.FX.terrainBiomes.detailMaxPx,zoom*formation.width),fm=G.TerrainArt.metrics(G.TerrainArt.formationId(formation),w);if(fm)return{width:w,height:fm.height,radius:Math.max(w,fm.height)*.46,top:-fm.height*.93,base:fm.height*.07};}
    }
    if(zoom&&G.TerrainArt&&G.TerrainArt.has(d.id)){
      var wide=Math.min(G.FX.terrainWorld.landmarkMax,Math.max(BASE,zoom*.36))*scale;
      var m=G.TerrainArt.metrics('wonder-'+d.id,wide);
      return {width:m.width,height:m.height,radius:Math.max(m.width,m.height)*.46,top:-m.height/2,base:m.height/2};
    }
    var p = d && POS[d.id], im = p && G.Img && G.Img.get(p.key), ratio = 1;
    if (im) ratio = (im.naturalHeight || im.height) / (im.naturalWidth || im.width);
    var w = BASE * scale, h = BASE * ratio * scale;
    return { width: w, height: h, radius: Math.max(12, Math.max(w, h) * 0.46), top: -h / 2, base: h / 2 };
  };

  DI.layout = function(d,scale,zoom,chartZoom){
    var r=nature(d);
    if(!r)return {point:DI.position(d),metrics:DI.metrics(d,scale,zoom)};
    var visual=G.NatureLandmark.place(d,r,modelWidth(r,scale||1,zoom,G.FX.natureLandmark),zoom,chartZoom);
    var m=visual.marker?{width:5,height:5,left:-2.5,right:2.5,top:-2.5,base:2.5,radius:3}:modelMetrics(r,visual.width);
    return {point:visual.point,metrics:m,marker:visual.marker,hidden:visual.hidden};
  };

  DI.screen = function(d,toScreen,scale,zoom,chartZoom,box){
    // 멀리 벗어난 경관의 육지 검사는 화면에 들어올 때까지 미룬다.
    var r=nature(d), fixed=r&&G.NatureLandmark.bakedPoint(d,r), z=zoom||chartZoom||0;
    var p=fixed?toScreen(fixed[0],fixed[1]):toScreen(d.lon,d.lat);
    var pad=120;
    if(r&&!fixed&&d.how!=='sea'&&d.how!=='special'){
      var f=G.FX.natureLandmark, local=f.local[f.local.length-1];
      var needsBank=G.Geo&&G.Geo.ready&&(G.Geo.sdf(d.lon,d.lat)<f.bankMargin||G.Terrain.isLake(d.lon,d.lat));
      pad+=z*(local+(needsBank?f.search[f.search.length-1]:0));
    }
    if(p[0]<box[0]-pad||p[0]>box[2]+pad||p[1]<box[1]-pad||p[1]>box[3]+pad)return null;
    var view=DI.layout(d,scale,zoom,chartZoom);
    if(view.hidden)return null;
    if(!fixed)p=toScreen(view.point[0],view.point[1]);
    var size=view.metrics, left=size.left==null?-size.width/2:size.left, right=size.right==null?size.width/2:size.right;
    if(p[0]+right<box[0]-12||p[0]+left>box[2]+12||p[1]+size.base<box[1]-12||p[1]+size.top>box[3]+12)return null;
    view.x=p[0];view.y=p[1];return view;
  };

  function drawModel(ctx, d, r, im, m, x, y, opts, scale) {
    var px = x + m.left, py = y + m.top, cx = px + m.width*.5;
    ctx.save();
    var landNature=nature(d)&&d.how!=='sea'&&d.how!=='special', p=landNature?null:DI.position(d);
    if (opts.zoom && (landNature || d.how === 'land' && (!G.Geo || !G.Geo.sdf || G.Geo.sdf(p[0],p[1]) >= 0))) {
      // 외곽은 투명이고, 건축물 아래에만 부드러운 접지 그림자를 남긴다.
      var radius = m.width*.37, depth = Math.max(2,m.width*.087), sy = y+Math.max(0,m.base)*.56;
      var shade = ctx.createRadialGradient(0,0,0,0,0,1);
      shade.addColorStop(0,'rgba(27,30,23,'+(landNature?G.FX.natureLandmark.shadowOpacity:G.FX.mapRuins.shadowOpacity)+')');
      shade.addColorStop(1,'rgba(27,30,23,0)');
      ctx.save(); ctx.translate(cx,sy); ctx.scale(radius,depth); ctx.fillStyle=shade;
      ctx.fillRect(-1,-1,2,2); ctx.restore();
    }
    if (nature(d)&&(d.mirage50||d.alwaysMirage)&&G.Disc&&G.Disc.mirageNow(d)&&G.Mirage&&G.Mirage.mapAlpha)ctx.globalAlpha*=G.Mirage.mapAlpha(d);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(im,r[1],r[2],r[3],r[4],px,py,m.width,m.height);
    if (opts.selected) {
      ctx.strokeStyle='rgba(242,215,145,.9)'; ctx.lineWidth=Math.max(1.2,1.7*scale); ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.ellipse(cx,y+Math.max(0,m.base)*.4,m.width*.48,Math.max(4,m.width*.12),0,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
    return m;
  }

  /** 발견물 좌표에 발치를 맞춰 투명 미니어처를 그린다. */
  DI.draw = function (ctx, d, x, y, opts) {
    opts = opts || {};
    var p = d && POS[d.id], scale = opts.scale || 1, view=opts.layout;
    var met = view?view.metrics:DI.metrics(d, scale, opts.zoom);
    if(view&&view.marker){
      ctx.save();ctx.fillStyle=opts.selected?'#f9d889':'#d3b980';ctx.strokeStyle='#473922';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();return met;
    }
    var r = model(d), art = r && G.Img && G.Img.get(r[0]);
    if (art) return drawModel(ctx, d, r, art, met, x, y, opts, scale);
    if (r) { request(r[0]); if(opts.pending)opts.pending(r[0]); }
    if(nature(d))return met;
    if(opts.zoom&&G.Terrain&&(G.Terrain.formationFor(d.id)||d.id==='siwa'&&G.Terrain.microSites().length))return met;
    if(!r&&opts.zoom&&G.TerrainArt&&G.TerrainArt.has(d.id)&&G.TerrainArt.sprite(ctx,'wonder-'+d.id,x-met.width/2,y-met.height/2,met.width,met.height))return met;
    if (!p || !G.Img) return met;
    var im = G.Img.get(p.key);
    if (!im) { request(p.key); if(opts.pending)opts.pending(p.key); return met; }
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    var cols = p.cols || COLS, rows = p.rows || ROWS;
    var col = p.slot % cols, row = Math.floor(p.slot / cols), sw = iw / cols, sh = ih / rows;
    var dw = BASE * scale, dh = dw * sh / sw;
    met = { width: dw, height: dh, radius: Math.max(12, Math.max(dw, dh) * 0.46), top: -dh / 2, base: dh / 2 };
    ctx.save();
    if ((d.mirage50 || d.alwaysMirage) && G.Disc && G.Disc.mirageNow && G.Disc.mirageNow(d) && G.Mirage && G.Mirage.mapAlpha) ctx.globalAlpha *= G.Mirage.mapAlpha(d);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(im, col * sw + 0.5, row * sh + 0.5, sw - 1, sh - 1, x - dw / 2, y - dh / 2, dw, dh);
    if (opts.selected) {
      ctx.strokeStyle = 'rgba(242,215,145,.9)'; ctx.lineWidth = Math.max(1.2, 1.7 * scale); ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.ellipse(x, y + dh * 0.28, dw * 0.42, Math.max(4, dh * 0.13), 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
    return met;
  };

  DI.at = function (list, toScreen, x, y, scale, zoom, chartZoom) {
    var best = null, bd = Infinity;
    (list || DI.visible()).forEach(function (d) {
      var view=DI.screen(d,toScreen,scale,zoom,chartZoom,[x,y,x,y]);
      if(!view)return;
      var p=[view.x,view.y], m=view.metrics, cy=p[1]+(m.top+m.base)/2;
      var cx = m.left == null ? p[0] : p[0]+(m.left+m.right)/2;
      var dd = (cx-x)*(cx-x)+(cy-y)*(cy-y), hit = Math.max(14,m.radius+3);
      var inside = m.left == null ? dd <= hit*hit :
        x >= p[0]+m.left-3 && x <= p[0]+m.right+3 && y >= p[1]+m.top-3 && y <= p[1]+m.base+3;
      if (inside && dd < bd) { best = d; bd = dd; }
    });
    return best;
  };
})(window.G = window.G || {});
