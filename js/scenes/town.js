/* 거리 화면: 배경 그림 위에 건물 그림을 세워 놓고, 건물을 누르거나 오른쪽 메뉴에서 골라 들어간다.
   images/bg-styles(또는 backgrounds)와 images/exteriors 그림이 있는 도시에서만 켜진다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art, I = G.Img;
  var T = {};
  G.Town = T;

  var W = 1600, H = 900;
  var GROUND = 768;          // 건물이 서 있는 바닥선
  var WALK_TOP = 742;        // 앞쪽 길이 시작하는 높이
  var PARALLAX = 0.12;       // 배경이 따라 움직이는 정도
  var MARGIN = 230;          // 거리 양 끝 여백
  var GAP = 12;              // 건물 사이 최소 간격 (닿지 않을 만큼만)
  var GAP_VAR = 16;          // 간격에 주는 들쭉날쭉함
  var HERO_H = 178;          // 주인공 키
  var WALK_V = 380;          // 가까운 건물로 걸어갈 때 빠르기 (px/초) — 뛰는 그림이 있을 때만
  var RUN_DIST = 420;        // 이보다 먼 건물은 뛰어간다 (뛰는 그림 characters/<이름>/run_N 이 있을 때)
  var RUN_V = 900;           // 뛰는 빠르기 (px/초). 아주 먼 건물은 1초 남짓에 닿도록 더 빨라진다
  var WALK_STRIDE = 52;      // 걷는 그림 한 장이 넘어가는 걸음 거리 (px)
  var KEY_WALK_V = 300;      // ←→로 걸을 때 빠르기 (px/초)
  var KEY_RUN_V = 680;       // Shift를 누르고 뛸 때 빠르기 (px/초)
  var RUN_FPS = 14;          // 뛰는 그림이 넘어가는 빠르기 (장/초) — 먼 길은 아주 빨리 지나가므로 거리 대신 시간으로 넘긴다

  // 건물 묶음과 같은 분류를 쓰는 거리 바닥. 패턴은 같아도 돌·흙·나무의 빛을 달리해
  // 어두운 남색·적갈색 제독 그림이 어느 고장에서도 바닥에 묻히지 않게 한다.
  var GROUND_STYLE = {
    iberia:    { name: '이베리아', kind: 'calcada',  top: '#d2bd93', mid: '#b79a70', bot: '#80664b', stone: '#cdb58a', alt: '#e0cfaa', accent: '#4f5252', joint: '#67533f', quay: 'stone' },
    espana:    { name: '에스파냐·식민', kind: 'cobble', top: '#c79e70', mid: '#a87955', bot: '#71513e', stone: '#b98c62', alt: '#d2ac7e', accent: '#7f3f32', joint: '#624638', quay: 'stone' },
    italy:     { name: '지중해', kind: 'fan',      top: '#d5b78f', mid: '#bc8668', bot: '#825a4d', stone: '#b96951', alt: '#d8bb91', accent: '#efe0bd', joint: '#745347', quay: 'stone' },
    france:    { name: '서·북유럽', kind: 'cobble', top: '#9d9990', mid: '#7c7973', bot: '#54524f', stone: '#85837d', alt: '#aaa69c', accent: '#556548', joint: '#454641', moss: true, quay: 'stone' },
    east:      { name: '동유럽', kind: 'cobble', top: '#999a99', mid: '#74787a', bot: '#4b5053', stone: '#7d8283', alt: '#a5a6a1', accent: '#58634e', joint: '#41484a', moss: true, quay: 'stone' },
    russia:    { name: '러시아', kind: 'slab',    top: '#a6a49c', mid: '#7b7c79', bot: '#515352', stone: '#8d8d88', alt: '#b5b2a8', accent: '#59615f', joint: '#474946', quay: 'stone' },
    arabia:    { name: '아랍·북아프리카', kind: 'mosaic', top: '#e0c593', mid: '#c39d6a', bot: '#876846', stone: '#d1b27f', alt: '#ead5aa', accent: '#8a493a', accent2: '#374e58', joint: '#7c603e', quay: 'stone' },
    ottoman:   { name: '오스만·레반트', kind: 'mosaic', top: '#d8c096', mid: '#b7926b', bot: '#795c45', stone: '#c8a77d', alt: '#e4d0aa', accent: '#7b3c35', accent2: '#315463', joint: '#71543e', quay: 'stone' },
    swahili:   { name: '동아프리카 해안', kind: 'coral', top: '#d8c49c', mid: '#b59b73', bot: '#77644d', stone: '#cbb58d', alt: '#e2d2ae', accent: '#87684b', joint: '#6f604d', quay: 'timber' },
    africa:    { name: '아프리카 내륙', kind: 'earth', top: '#bd8153', mid: '#9a603e', bot: '#68432f', stone: '#9b7458', alt: '#c19a74', accent: '#5c4b37', joint: '#5a3c2c', grass: '#687344', quay: 'timber' },
    india:     { name: '인도', kind: 'mosaic', top: '#cfaa78', mid: '#ad7957', bot: '#744e3e', stone: '#c49769', alt: '#e0c292', accent: '#8b3f3f', accent2: '#465b60', joint: '#6b4938', quay: 'stone' },
    seasia:    { name: '동남아시아', kind: 'earth', top: '#b88255', mid: '#91603f', bot: '#5e412f', stone: '#98775d', alt: '#c5a17b', accent: '#4d4838', joint: '#533a2b', grass: '#4f7041', quay: 'timber' },
    eastasia:  { name: '동아시아', kind: 'slab', top: '#a9a8a0', mid: '#858780', bot: '#585c58', stone: '#96978f', alt: '#b9b8ad', accent: '#4f5b59', joint: '#4e514c', moss: true, quay: 'stone' },
    japan:     { name: '일본', kind: 'slab', top: '#aaa69b', mid: '#827e75', bot: '#55534f', stone: '#918c81', alt: '#bab4a8', accent: '#5b5149', joint: '#4e4b47', moss: true, quay: 'timber' },
    steppe:    { name: '초원', kind: 'earth', top: '#b79a67', mid: '#96784e', bot: '#654f38', stone: '#8c8066', alt: '#baa982', accent: '#62573f', joint: '#58452f', grass: '#71804b', quay: 'timber' },
    volcanic:  { name: '메소아메리카', kind: 'volcanic', top: '#8c8273', mid: '#665f56', bot: '#413d38', stone: '#68645e', alt: '#938b7c', accent: '#a96f43', joint: '#35332f', moss: true, quay: 'stone' },
    andes:     { name: '안데스', kind: 'inca', top: '#b3a281', mid: '#8d7b60', bot: '#5f5142', stone: '#9f8d6d', alt: '#c2b18f', accent: '#6c5b46', joint: '#514538', quay: 'stone' },
    native:    { name: '북미 마을', kind: 'earth', top: '#aa8059', mid: '#856044', bot: '#594231', stone: '#89745e', alt: '#b09876', accent: '#5c4b3b', joint: '#4d392c', grass: '#657348', quay: 'timber' },
    pueblo:    { name: '푸에블로', kind: 'earth', top: '#c18e63', mid: '#9d694b', bot: '#694838', stone: '#a98267', alt: '#c7a181', accent: '#6e4f40', joint: '#5a3e31', grass: '#777045', quay: 'stone' }
  };
  var GROUND_BY_EXT = {
    iberia: 'iberia', espana: 'espana', france: 'france', italy: 'italy', easteurope: 'east', russia: 'russia',
    arabia: 'arabia', ottoman: 'ottoman', swahili: 'swahili', africa: 'africa', masai: 'africa', india: 'india',
    seasia: 'seasia', tropic: 'seasia', china: 'eastasia', korea: 'eastasia', japan: 'japan', steppe: 'steppe',
    aztec: 'volcanic', inca: 'andes', woodland: 'native', plains: 'steppe', pueblo: 'pueblo'
  };

  // 건물마다 화면에 그릴 높이
  var SIZE = { harbor: 405, shipyard: 385, trade: 360, market: 320, tavern: 345, inn: 352, church: 425,
    library: 365, palace: 430, mansion: 372, guild: 362, home: 340, house2: 310, gate: 372 };
  // 거리에 늘어서는 차례 (왼쪽 = 바다 쪽, 오른쪽 = 성문 쪽)
  var ORDER = ['harbor', 'shipyard', 'trade', 'market', 'tavern', 'inn', 'guild', 'library', 'church', 'mansion', 'palace', 'house2', 'home', 'gate'];
  // 도시마다 거리 한쪽에 서 있는 볼거리 (발견물이면 눌러서 설명을 본다 — T.inspect)
  // 아직 전용 그림이 없는 건물은 비슷한 건물 그림을 좌우로 뒤집어 쓴다
  var SUBSTITUTE = { house2: 'home' };   // 둘째 부인의 집: 전용 그림이 없으면 자택 그림을 뒤집어 쓴다   // 전용 그림이 오면 여기서 비슷한 건물로 돌려 쓸 수 있다
  var LANDMARKS = { 7: [['giralda', 0.60, 430], ['columns', 0.10, 250]] };
  // 발견물 자료(G.DISC)가 없는 볼거리의 설명
  var MARK_INFO = {
    giralda: { name: '히랄다 탑', desc: '세비야 대성당 곁에 우뚝 선 탑. 본디 12세기 알모하드 왕조가 세운 대모스크의 첨탑이었으나, 도시가 카스티야 왕국에 넘어간 뒤 대성당의 종탑이 되었다. 성당 안뜰에는 모스크 시절의 오렌지 나무 정원이 남아 있다.' },
    columns: { name: '로마의 기둥', desc: '세비야가 로마의 도시 히스팔리스였던 시절의 신전 기둥. 천 년이 넘도록 거리 한쪽에 서 있어, 사람들은 도시를 세웠다는 헤라클레스와 율리우스 카이사르의 이야기를 이 기둥에 얹어 들려준다.' }
  };
  // 도시 발견물은 landmarks/<발견물 id> 그림이 있을 때 자동으로 거리 뒤편에 선다.
  var LANDMARK_HEIGHT = {
    pharos: 500, hwangnyong: 460, hagiasophia: 400, djenne: 370, delhimosque: 370,
    potala: 360, isfahanmosque: 380, rockdome: 350, notredame: 410, templomayor: 390,
    apostolic: 400, whitetower: 370, askia: 390, stbasil: 430, belem: 400,
    pisa: 450, porcelain: 470, eiffel: 500, bigben: 460, biosphere: 360,
    unhq: 390, sydneyopera: 320, hue: 330,
    jongmyo: 250, colosseum: 300, uffizi: 250, versailles: 250, orszaghaz: 250,
    maracana: 270, battersea: 290
  };

  var st = null;

  function S() { return G.Game.state; }
  function rngOf(c) { return U.makeRng(U.strHash('town' + c.id)); }

  /** 전용 그림이 있는 도시 건축 발견물을, 이미 놓인 수동 볼거리와 덜 겹치는 자리에 더한다. */
  function landmarksFor(c) {
    var out = (LANDMARKS[c.id] || []).slice(), seen = {}, used = [0, 1];
    out.forEach(function (l) { seen[l[0]] = true; used.push(l[1]); });
    (G.DISCOVERIES || []).filter(function (d) {
      return d.cat === 'ruin' && d.how === 'city' && d.city === c.id && !seen[d.id] &&
        (!G.Disc || !G.Disc.built || G.Disc.built(d)) && I.pick(I.chain.landmark(d.id));
    }).forEach(function (d) {
      var best = 0.5, bestGap = -1;
      for (var i = 1; i < 20; i++) {
        var p = i / 20, gap = Math.min.apply(null, used.map(function (x) { return Math.abs(x - p); }));
        if (gap > bestGap) { best = p; bestGap = gap; }
      }
      used.push(best); seen[d.id] = true;
      out.push([d.id, best, LANDMARK_HEIGHT[d.id] || 340]);
    });
    return out;
  }

  // ---------------------------------------------------------------- 만들기
  T.available = function (c) { return !!(I.count() && (I.pick(I.chain.bg(c)) || (I.extStyle && I.extStyle(c)))); };

  /** 도시의 거리를 준비한다. buildings: G.Scenes.city.buildings(c) */
  T.open = function (c, buildings) {
    var landmarks = landmarksFor(c), chains = [I.chain.bg(c), I.chain.hero()];
    I.chain.heroWalk().forEach(function (k) { chains.push([k]); });
    I.chain.heroRun().forEach(function (k) { chains.push([k]); });
    buildings.forEach(function (b) { chains.push(I.chain.exterior(b.kind, c, b.arg)); });
    landmarks.forEach(function (l) { chains.push(I.chain.landmark(l[0])); });
    chains.push([groundKey(groundStyle(c).id)]);             // 지역 길바닥 그림
    function missing() { return chains.some(function (ch) { var k = I.pick(ch); return k && !I.get(k); }); }
    return I.preload(chains, 5000).then(function () {
      build(c, buildings, landmarks);
      // 기다리는 시간을 넘겨 일부 그림 없이 섰다면(아주 느린 연결), 나머지가 오는 대로 거리를 다시 세운다 — 코드로 그린 임시 건물·빈 배경이 그대로 남지 않게
      if (missing()) {
        var mine = st;
        Promise.all(chains.map(I.resolve)).then(function () {
          if (st !== mine) return;                 // 그 사이 다른 도시로 갔다
          var keep = { hidden: st.hidden, onPick: st.onPick, hx: st.hero.x / Math.max(1, st.streetW), dir: st.hero.dir };
          build(c, buildings, landmarks);
          st.hidden = keep.hidden; st.onPick = keep.onPick; st.hero.dir = keep.dir;
          st.hero.x = keep.hx * st.streetW; st.cam = st.camTo = clampCam(st.hero.x - W / 2); st.dirty = true;
        });
      }
      return st;
    });
  };
  T.close = function () { st = null; };
  T.active = function () { return !!st; };
  T.runtime = function () { return st; };   // 시험용
  T.city = function () { return st && st.city; };
  T.hidden = function (v) {
    if (st && v != null) {
      var back = st.hidden && !v;          // 건물에서 거리로 나왔다 — 거리를 오가는 사람이 바뀐다
      st.hidden = !!v; st.keys = {}; if (!st.hidden) { st.hero.fade = 1; st.hero.entering = false; st.dirty = true; }
      if (back) spawnFolk();
    }
    return st ? st.hidden : true;
  };

  /** 거리 배경 그림이 없는 도시는 도시 풍경을 흐릿한 뒤 배경으로 쓴다 */
  function cityBackdrop(c) {
    try { return G.Scenes.city.view(c); } catch (e) { return null; }
  }
  function prescale(img, h, flip) {
    var w = Math.max(1, Math.round((img.naturalWidth || img.width) * h / (img.naturalHeight || img.height)));
    var cv = A.canvas(w, h), ctx = cv.getContext('2d');
    if (flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(img, 0, 0, w, h);
    return cv;
  }

  function build(c, buildings, landmarks) {
    var rng = rngOf(c);
    var bgKey = I.pick(I.chain.bg(c));
    var es = I.extStyle && I.extStyle(c);
    var items = [];
    var order = {};
    ORDER.forEach(function (k, i) { order[k] = i; });
    buildings.slice().sort(function (a, b) { return (order[a.kind] == null ? 50 : order[a.kind]) - (order[b.kind] == null ? 50 : order[b.kind]); })
      .forEach(function (b) {
        var h = SIZE[b.kind] || 430;
        var key = I.pick(I.chain.exterior(b.kind, c, b.arg));
        // 그 고장 건물 그림을 쓰는 도시에서는, 유럽식 기본 그림 대신 그 고장 양식으로 그린다
        if (key && es && key.indexOf('exterior-styles/') !== 0 && key.indexOf('@') < 0 &&
            A.cultureOf && A.cultureOf(c) !== 'europe') key = null;
        var flip = false;
        if (!key && SUBSTITUTE[b.kind]) { key = I.pick(I.chain.exterior(SUBSTITUTE[b.kind], c, '')); flip = !!key; }
        var img = key && I.get(key);
        var cv = img ? prescale(img, h, flip) : fallback(b.kind, c, h, rng);
        if (!cv) return;
        items.push({ kind: b.kind, arg: b.arg, name: b.name, icon: b.icon, cv: cv, w: cv.width, h: cv.height, x: 0 });
      });
    var x = MARGIN;
    items.forEach(function (it, i) {
      it.x = x;
      it.base = GROUND + Math.round((rng() - 0.5) * 8);
      // 서로 닿지 않을 만큼만 띄워 다닥다닥 붙여 세운다
      it.lift = (i % 2) ? 36 : 0;           // 이름표가 이웃과 겹치지 않도록 한 칸씩 올린다
      x += it.w + GAP + Math.round(rng() * GAP_VAR);
    });
    var streetW = Math.max(W, x - 56 + MARGIN);
    var marks = landmarks.map(function (l) {
      var key = I.pick(I.chain.landmark(l[0])), img = key && I.get(key);
      if (!img) return null;
      return { id: l[0], d: (G.DISC && G.DISC[l[0]]) || null, info: MARK_INFO[l[0]] || null, cv: prescale(img, l[2]), x: Math.round(streetW * l[1]), y: GROUND - 54 };
    }).filter(Boolean);
    var ground = groundStrip(c, rng);
    st = {
      city: c, items: items, marks: marks, streetW: streetW,
      bg: bgKey ? I.get(bgKey) : cityBackdrop(c), ground: ground, groundStyle: ground._style, hidden: false,
      cam: 0, camTo: 0, hover: null, focus: null, t: 0,
      hero: { x: items.length ? items[0].x + items[0].w / 2 : W / 2, to: null, dir: 1, walking: false, dist: 0, fade: 1, entering: false },
      heroFrames: heroFrames(), keys: {}, near: null, onPick: null,
      runFrames: I.chain.heroRun().map(function (k) { return I.get(k); }).filter(Boolean)
    };
    prepare();
    st.dirty = true;
    // 처음에는 항구(또는 첫 건물) 앞에서 시작
    st.cam = st.camTo = clampCam(st.hero.x - W / 2);
    spawnFolk();
  }
  /** 거리를 걷는 마을 사람 3~4명을 새로 풀어 놓는다 (js/systems/streetfolk.js) */
  function spawnFolk() {
    st.folks = [];
    try { if (G.StreetFolk && G.Game.state && G.Game.state.fleet) st.folks = G.StreetFolk.spawn(st.city, st.streetW, st.hero.x, GROUND, st.city.id + ':' + (st.visits = (st.visits || 0) + 1)); }
    catch (e) { st.folks = []; }   // 시험용 가짜 도시 등 — 거리 사람 없이도 거리는 열린다
    st.dirty = true;
  }
  T.folks = function () { return st ? st.folks || [] : []; };   // 시험용
  T._hero = function () { return st ? st.hero : null; };   // 시험용
  T.respawnFolk = function () { if (st) spawnFolk(); };
  /** 매 프레임 다시 계산하지 않도록 배경·덧칠·이름표를 미리 그려 둔다 */
  function prepare() {
    // 배경을 화면 크기에 맞춰 한 번만 확대해 둔다
    st.bgW = Math.max(W, Math.round(W + PARALLAX * (st.streetW - W)));
    if (st.bg) {
      var scale = st.bgW / (st.bg.naturalWidth || st.bg.width);
      var dh = Math.round((st.bg.naturalHeight || st.bg.height) * scale);
      var cv = A.canvas(st.bgW, Math.max(H, dh)), cx = cv.getContext('2d');
      try { cx.filter = 'blur(2.5px)'; } catch (e) { /* 지원 안 하면 그냥 또렷하게 */ }
      cx.drawImage(st.bg, -4, -4, st.bgW + 8, dh + 8);
      cx.filter = 'none';
      var hz = cx.createLinearGradient(0, 0, 0, Math.max(H, dh));
      hz.addColorStop(0, 'rgba(255,250,238,.10)'); hz.addColorStop(0.62, 'rgba(255,246,228,.30)'); hz.addColorStop(1, 'rgba(252,238,214,.42)');
      cx.fillStyle = hz; cx.fillRect(0, 0, cv.width, cv.height);
      st.bgY = Math.round(-(dh - H) * 0.45);
      st.bgCv = cv;
    }
    st.items.forEach(function (it) {
      it.tag = plaqueCanvas(it.name, false);
      it.tagOn = plaqueCanvas(it.name, true);
    });
    st.tod = null;
  }
  /** 하늘빛·시간대·가장자리 어둠을 한 장에 담아 둔다 */
  function overlayFor(tod) {
    var cv = A.canvas(W, H), ctx = cv.getContext('2d');
    var haze = ctx.createLinearGradient(0, H * 0.22, 0, H * 0.72);
    haze.addColorStop(0, 'rgba(255,248,232,.26)'); haze.addColorStop(1, 'rgba(255,248,232,0)');
    ctx.fillStyle = haze; ctx.fillRect(0, 0, W, H * 0.72);
    if (tod !== 'day') {
      ctx.fillStyle = tod === 'dusk' ? 'rgba(255,120,60,.20)' : 'rgba(255,175,90,.13)';
      ctx.fillRect(0, 0, W, H);
      if (tod === 'dusk') { ctx.fillStyle = 'rgba(30,18,40,.16)'; ctx.fillRect(0, 0, W, H); }
    }
    A.vignette(ctx, W, H, 0.45);
    return cv;
  }
  function heroFrames() {
    var out = I.chain.heroWalk().map(function (k) { return I.get(k); }).filter(Boolean);
    if (out.length) return out;
    var k = I.pick(I.chain.hero()), im = k && I.get(k);
    return im ? [im] : [];
  }
  function clampCam(x) { return U.clamp(x, 0, Math.max(0, st ? st.streetW - W : 0)); }

  // ---------------------------------------------------------------- 그림이 없는 건물은 코드로 그린다
  function fallback(kind, c, h, rng) {
    if (kind === 'gate') return paintGate(c, h, rng);
    return paintStalls(c, h, rng);
  }
  /** 성문: 성벽 한 구간과 두 망루, 가운데 아치 */
  function paintGate(c, h, rng) {
    var stl = A.STYLE[c.style] || A.STYLE.ib;
    var w = Math.round(h * 1.35), cv = A.canvas(w, h), ctx = cv.getContext('2d');
    var stone = A.mix(stl.walls[0], '#5f5138', 0.58);
    var dark = A.shade(stone, 0.78), light = A.shade(stone, 1.1);
    var wallTop = h * 0.30, towerTop = h * 0.10, tw2 = w * 0.235;
    function blocks(x, y, bw, bh, big) {
      var rh = big ? 26 : 20, rw = big ? 46 : 36;
      for (var yy = y; yy < y + bh; yy += rh) {
        var off = (Math.round((yy - y) / rh) % 2) * rw / 2;
        for (var xx = x - rw; xx < x + bw; xx += rw) {
          var bx = Math.max(x, xx + off), bw2 = Math.min(x + bw, xx + off + rw - 2) - bx;
          if (bw2 <= 0) continue;
          ctx.fillStyle = A.rgba(A.jitter(stone, rng, 16));
          ctx.fillRect(bx, yy, bw2, Math.min(rh - 2, y + bh - yy));
        }
      }
    }
    function merlons(x, y, bw, mw) {
      for (var mx = x; mx < x + bw - mw * 0.6; mx += mw * 1.9) {
        ctx.fillStyle = A.rgba(A.jitter(light, rng, 12));
        ctx.fillRect(mx, y - mw * 0.9, mw, mw * 0.95);
        ctx.fillStyle = A.rgba(dark, 0.25); ctx.fillRect(mx, y - 4, mw, 4);
      }
    }
    // 성벽
    ctx.fillStyle = A.rgba(dark); ctx.fillRect(w * 0.16, wallTop, w * 0.68, h - wallTop);
    blocks(w * 0.16, wallTop, w * 0.68, h - wallTop, true);
    merlons(w * 0.16, wallTop, w * 0.68, w * 0.035);
    ctx.fillStyle = A.rgba(dark, 0.35); ctx.fillRect(w * 0.16, wallTop, w * 0.68, 7);
    // 아치 통로
    var ax = w * 0.5, aw = w * 0.17, ay = h * 0.52;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ax - aw, h); ctx.lineTo(ax - aw, ay);
    ctx.quadraticCurveTo(ax, h * 0.30, ax + aw, ay); ctx.lineTo(ax + aw, h); ctx.closePath();
    ctx.fillStyle = '#1b130c'; ctx.fill();
    ctx.clip();
    var gl = ctx.createLinearGradient(0, h * 0.4, 0, h);
    gl.addColorStop(0, 'rgba(255,224,170,.10)'); gl.addColorStop(1, 'rgba(255,224,170,.26)');
    ctx.fillStyle = gl; ctx.fillRect(ax - aw, ay - 40, aw * 2, h);
    // 나무 문
    ctx.fillStyle = '#4a3320'; ctx.fillRect(ax - aw * 0.92, h * 0.58, aw * 1.84, h * 0.42);
    ctx.strokeStyle = 'rgba(26,16,8,.6)'; ctx.lineWidth = 3;
    for (var pl = 1; pl < 6; pl++) { ctx.beginPath(); ctx.moveTo(ax - aw * 0.92 + pl * aw * 0.31, h * 0.58); ctx.lineTo(ax - aw * 0.92 + pl * aw * 0.31, h); ctx.stroke(); }
    ctx.fillStyle = '#2e2116'; ctx.fillRect(ax - aw * 0.92, h * 0.66, aw * 1.84, 7); ctx.fillRect(ax - aw * 0.92, h * 0.86, aw * 1.84, 7);
    ctx.restore();
    // 아치 테두리 돌
    ctx.save();
    ctx.lineWidth = 15; ctx.strokeStyle = A.rgba(light);
    ctx.beginPath(); ctx.moveTo(ax - aw, h); ctx.lineTo(ax - aw, ay);
    ctx.quadraticCurveTo(ax, h * 0.30, ax + aw, ay); ctx.lineTo(ax + aw, h); ctx.stroke();
    ctx.restore();
    // 망루 둘
    [w * 0.02, w * 0.745].forEach(function (tx, i) {
      ctx.fillStyle = A.rgba(dark); ctx.fillRect(tx, towerTop, tw2, h - towerTop);
      blocks(tx, towerTop, tw2, h - towerTop, false);
      merlons(tx - 4, towerTop, tw2 + 8, w * 0.034);
      ctx.fillStyle = 'rgba(20,14,8,.75)';
      for (var s2 = 0; s2 < 2; s2++) ctx.fillRect(tx + tw2 * (0.32 + s2 * 0.34), h * (0.36 + s2 * 0.2), tw2 * 0.09, h * 0.1);
      ctx.fillStyle = 'rgba(30,20,10,.18)'; ctx.fillRect(tx + tw2 - 10, towerTop, 10, h - towerTop);
    });
    // 깃발
    ctx.fillStyle = '#8a1e1e'; ctx.fillRect(w * 0.79, h * 0.2, w * 0.05, h * 0.16);
    ctx.fillStyle = '#c9a030'; ctx.fillRect(w * 0.79, h * 0.2, w * 0.05, 5);
    ctx.beginPath(); ctx.moveTo(w * 0.79, h * 0.36); ctx.lineTo(w * 0.815, h * 0.33); ctx.lineTo(w * 0.84, h * 0.36); ctx.fillStyle = '#8a1e1e'; ctx.fill();
    A.grade(ctx, w, h, '#ffb070', 0.18);
    A.applyGrain(ctx, w, h, 0.06);
    return cv;
  }
  /** 시장: 벽이 없는 천막 가판대 줄 (전용 그림이 없을 때) */
  function paintStalls(c, h, rng) {
    var w = Math.round(h * 1.5), cv = A.canvas(w, h), ctx = cv.getContext('2d');
    var cloth = [['#c0553a', '#9a3f2c'], ['#e6dcc0', '#c4b696'], ['#4d6f7a', '#38545e']];
    var n = 3, sw = w / (n + 0.35);
    for (var i = 0; i < n; i++) {
      var sx = 10 + i * (sw * 0.98), top = h * (0.30 + (i % 2) * 0.04), pole = h * 0.98;
      var col = cloth[(i + Math.floor(rng() * 3)) % 3];
      // 바닥 그림자
      ctx.fillStyle = 'rgba(40,26,12,.20)';
      ctx.beginPath(); ctx.ellipse(sx + sw * 0.45, pole, sw * 0.5, 14, 0, 0, 7); ctx.fill();
      // 기둥
      ctx.fillStyle = '#6b4c2c';
      ctx.fillRect(sx + 6, top + 10, 9, pole - top - 10);
      ctx.fillRect(sx + sw * 0.82, top + 10, 9, pole - top - 10);
      // 천막
      var g = ctx.createLinearGradient(sx, top, sx, top + h * 0.13);
      g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx - 12, top + h * 0.10); ctx.quadraticCurveTo(sx + sw * 0.45, top - h * 0.03, sx + sw * 0.9 + 12, top + h * 0.10);
      ctx.lineTo(sx + sw * 0.9 + 12, top + h * 0.15); ctx.quadraticCurveTo(sx + sw * 0.45, top + h * 0.03, sx - 12, top + h * 0.15);
      ctx.closePath(); ctx.fill();
      // 천막 가장자리 물결
      ctx.fillStyle = col[1];
      for (var f = 0; f < 7; f++) {
        var fx = sx - 12 + f * (sw + 24) / 7;
        ctx.beginPath(); ctx.arc(fx + (sw + 24) / 14, top + h * 0.145, (sw + 24) / 14, 0, Math.PI); ctx.fill();
      }
      // 좌판
      ctx.fillStyle = '#8a6a44'; ctx.fillRect(sx - 4, h * 0.62, sw * 0.95, 12);
      ctx.fillStyle = '#6b4c2c'; ctx.fillRect(sx - 4, h * 0.62 + 12, sw * 0.95, 8);
      ctx.fillStyle = 'rgba(60,40,20,.55)'; ctx.fillRect(sx + 2, h * 0.68, sw * 0.86, h * 0.28);
      // 바구니와 과일
      for (var b = 0; b < 4; b++) {
        var bx = sx + 14 + b * sw * 0.21, by = h * 0.62;
        ctx.fillStyle = A.rgba(A.jitter('#b08a4e', rng, 16));
        ctx.beginPath(); ctx.ellipse(bx + 12, by - 4, 18, 9, 0, 0, 7); ctx.fill();
        for (var f2 = 0; f2 < 5; f2++) {
          ctx.fillStyle = A.rgba(A.jitter(['#c9622f', '#8fa63a', '#c9a030', '#8a3a2a', '#6a8a4a'][(b + f2) % 5], rng, 22));
          ctx.beginPath(); ctx.arc(bx + 3 + f2 * 5, by - 9 - (f2 % 2) * 4, 5.5, 0, 7); ctx.fill();
        }
      }
      // 자루와 통
      ctx.fillStyle = A.rgba(A.jitter('#a8916a', rng, 12));
      ctx.beginPath(); ctx.moveTo(sx + sw * 0.08, h * 0.99); ctx.quadraticCurveTo(sx + sw * 0.05, h * 0.86, sx + sw * 0.16, h * 0.87);
      ctx.quadraticCurveTo(sx + sw * 0.25, h * 0.88, sx + sw * 0.22, h * 0.99); ctx.closePath(); ctx.fill();
      ctx.fillStyle = A.rgba(A.jitter('#8a6236', rng, 12));
      ctx.fillRect(sx + sw * 0.62, h * 0.86, 38, 28);
      ctx.fillStyle = 'rgba(40,26,12,.45)'; ctx.fillRect(sx + sw * 0.62, h * 0.90, 38, 5);
    }
    A.grade(ctx, w, h, '#ffb070', 0.16);
    return cv;
  }

  /** 건물 묶음에 맞는 바닥 양식을 고른다. */
  function groundStyle(c) {
    var ext = I.extStyle && I.extStyle(c), id = GROUND_BY_EXT[ext];
    if (!id) {
      id = { ib: 'iberia', co: 'espana', ne: 'france', it: 'italy', gr: 'east', ru: 'russia',
        is: 'arabia', pe: 'arabia', af: 'africa', sw: 'swahili', tr: 'africa', 'in': 'india',
        se: 'seasia', cn: 'eastasia', kr: 'eastasia', jp: 'japan', st: 'steppe', az: 'volcanic',
        an: 'andes', na: 'native' }[c.style];
    }
    id = id || 'iberia';
    return { id: id, ext: ext || c.style, p: GROUND_STYLE[id] };
  }

  function poly(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  /** 한 개의 돌을 위·옆면이 나뉘 다각형으로 그린다. */
  function facetStone(ctx, x, y, w, h, p, rng, sharp) {
    var d = Math.min(w, h) * (sharp ? 0.10 : 0.20);
    var pts = [[x + d * (0.55 + rng() * 0.45), y + rng() * d * 0.35],
      [x + w - d * (0.45 + rng() * 0.5), y + rng() * d * 0.45],
      [x + w - rng() * d * 0.45, y + h - d * (0.35 + rng() * 0.45)],
      [x + w - d * (0.5 + rng() * 0.4), y + h - rng() * d * 0.22],
      [x + d * (0.4 + rng() * 0.5), y + h - rng() * d * 0.30],
      [x + rng() * d * 0.4, y + d * (0.4 + rng() * 0.5)]];
    var col = A.jitter(rng() < 0.22 ? p.alt : p.stone, rng, 13);
    poly(ctx, pts); ctx.fillStyle = A.rgba(col, 0.98); ctx.fill();
    ctx.strokeStyle = A.rgba(p.joint, 0.55); ctx.lineWidth = 1.1; ctx.stroke();
    // 위쪽 받는 면과 아래쪽 그늘을 삼각면으로 나누어 폴리곤 느낌을 준다.
    ctx.fillStyle = 'rgba(255,245,218,.13)';
    poly(ctx, [pts[0], pts[1], [x + w * 0.52, y + h * 0.43], pts[5]]); ctx.fill();
    ctx.fillStyle = 'rgba(44,32,24,.13)';
    poly(ctx, [[x + w * 0.52, y + h * 0.43], pts[2], pts[3], pts[4]]); ctx.fill();
  }

  function cobbles(ctx, tw, th, p, rng, dense) {
    var y = -10, row = 0;
    while (y < th + 12) {
      var scale = 0.82 + Math.max(0, y) / th * 0.45;
      var hh = (dense ? 20 : 25) * scale, x = -(row % 2) * 28;
      while (x < tw + 50) {
        var ww = (dense ? 38 : 48) * scale * (0.82 + rng() * 0.38);
        facetStone(ctx, x, y, ww, hh, p, rng, false);
        if (p.moss && rng() < 0.13) {
          ctx.fillStyle = A.rgba(p.accent, 0.32); ctx.fillRect(x + ww * 0.2, y + hh - 2, ww * 0.42, 2);
        }
        x += ww + 3;
      }
      y += hh + 3; row++;
    }
  }

  function slabs(ctx, tw, th, p, rng, narrow) {
    var y = -8, row = 0;
    while (y < th + 12) {
      var scale = 0.86 + Math.max(0, y) / th * 0.35, hh = (narrow ? 26 : 34) * scale;
      var x = -(row % 2) * (narrow ? 42 : 64);
      while (x < tw + 100) {
        var ww = (narrow ? 82 : 122) * scale * (0.88 + rng() * 0.24);
        facetStone(ctx, x, y, ww, hh, p, rng, true); x += ww + 3;
      }
      y += hh + 3; row++;
    }
  }

  function fanPaving(ctx, tw, th, p, rng) {
    // 테라코타 벽돌을 반원으로 돌려 깔은 지중해 광장.
    ctx.fillStyle = A.rgba(p.stone); ctx.fillRect(0, 0, tw, th);
    ctx.strokeStyle = A.rgba(p.joint, 0.72); ctx.lineWidth = 2;
    for (var by = 18, r = 0; by < th + 62; by += 48, r++) {
      for (var bx = (r % 2) * 78 - 78; bx < tw + 90; bx += 156) {
        for (var ring = 20; ring <= 72; ring += 17) {
          ctx.beginPath(); ctx.arc(bx, by, ring, Math.PI, Math.PI * 2); ctx.stroke();
        }
        for (var a = 0; a <= 8; a++) {
          var ang = Math.PI + Math.PI * a / 8;
          ctx.beginPath(); ctx.moveTo(bx + Math.cos(ang) * 18, by + Math.sin(ang) * 18);
          ctx.lineTo(bx + Math.cos(ang) * 75, by + Math.sin(ang) * 75); ctx.stroke();
        }
      }
    }
    ctx.fillStyle = 'rgba(255,235,205,.10)';
    for (var i = 0; i < 90; i++) ctx.fillRect(rng() * tw, rng() * th, 5 + rng() * 12, 2 + rng() * 4);
  }

  function packedEarth(ctx, tw, th, p, rng) {
    // 다각형의 낮은 디딜돌을 넣은 다져진 흙길.
    for (var i = 0; i < 120; i++) {
      var x = rng() * tw, y = rng() * th, s = 1 + rng() * 4;
      ctx.fillStyle = rng() < 0.5 ? 'rgba(54,35,24,.18)' : 'rgba(255,220,165,.12)';
      ctx.fillRect(x, y, s * 1.7, s * 0.7);
    }
    for (var j = 0; j < 28; j++) {
      var px = rng() * tw, py = 8 + rng() * (th - 18), ss = 0.7 + py / th * 0.65;
      facetStone(ctx, px, py, (20 + rng() * 28) * ss, (8 + rng() * 10) * ss, p, rng, false);
    }
    if (p.grass) {
      ctx.strokeStyle = A.rgba(p.grass, 0.72); ctx.lineWidth = 1.4;
      for (var g = 0; g < 20; g++) {
        var gx = rng() * tw, gy = 10 + rng() * (th - 16);
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 4, gy - 8); ctx.moveTo(gx, gy); ctx.lineTo(gx + 1, gy - 10); ctx.moveTo(gx, gy); ctx.lineTo(gx + 5, gy - 6); ctx.stroke();
      }
    }
  }

  function calcadaAccent(ctx, tw, th, p) {
    // 작은 현무암을 물결로 넣은 포르투갈식 악센트.
    for (var x = -16; x < tw + 20; x += 14) {
      var y = th * 0.53 + Math.sin(x / 58) * 13;
      ctx.fillStyle = p.accent; poly(ctx, [[x, y], [x + 11, y - 2], [x + 13, y + 7], [x + 2, y + 9]]); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.10)'; poly(ctx, [[x, y], [x + 11, y - 2], [x + 7, y + 2], [x + 1, y + 4]]); ctx.fill();
    }
  }

  function mosaicBand(ctx, tw, th, p) {
    var y = Math.round(th * 0.43), s = 13;
    ctx.fillStyle = A.rgba(p.alt, 0.82); ctx.fillRect(0, y - 8, tw, 22);
    ctx.strokeStyle = A.rgba(p.joint, 0.45); ctx.lineWidth = 1; ctx.strokeRect(0, y - 8.5, tw, 22);
    for (var x = -s; x < tw + s; x += s * 2) {
      ctx.fillStyle = p.accent; poly(ctx, [[x + s, y - 6], [x + s * 2, y + 3], [x + s, y + 12], [x, y + 3]]); ctx.fill();
      ctx.fillStyle = p.accent2 || p.joint; poly(ctx, [[x + s, y - 1], [x + s * 1.45, y + 3], [x + s, y + 7], [x + s * 0.55, y + 3]]); ctx.fill();
    }
  }

  function quayEdge(ctx, tw, p, rng) {
    if (p.quay === 'timber') {
      ctx.fillStyle = '#493526'; ctx.fillRect(0, 0, tw, 15);
      for (var x = 0; x < tw; x += 68) {
        ctx.fillStyle = A.rgba(A.jitter('#78583a', rng, 10)); ctx.fillRect(x + 1, 1, 65, 11);
        ctx.fillStyle = 'rgba(255,230,180,.12)'; ctx.fillRect(x + 3, 2, 60, 2);
      }
    } else {
      ctx.fillStyle = A.rgba(A.shade(p.stone, 0.72)); ctx.fillRect(0, 0, tw, 16);
      ctx.strokeStyle = A.rgba(p.joint, 0.75); ctx.lineWidth = 1;
      for (var sx = 0; sx < tw; sx += 72) ctx.strokeRect(sx + 0.5, 0.5, 70, 14);
    }
  }

  /** 지역 길바닥 그림 키: images/street-ground/<양식>.webp — Codex 기준 그림(docs/art/regional-street-ground-reference.png)을
      tools/street_ground.py가 가로로 끝없이 이어지는 띠로 바꾼 것 */
  function groundKey(id) { return 'street-ground/' + id; }

  /** 앞쪽 길 — 지역 길바닥 그림이 있으면 그것을, 없으면 양식별 재료와 문양을 다각형으로 그린다. */
  function groundStrip(c, rng) {
    var th = H - WALK_TOP + 6, style = groundStyle(c), p = style.p;
    var key = I.pick([groundKey(style.id)]), img = key && I.get(key);
    if (img) return groundFromImage(img, th, style, p, c);
    var tw = 960, cv = A.canvas(tw, th), ctx = cv.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, th);
    g.addColorStop(0, p.top); g.addColorStop(0.45, p.mid); g.addColorStop(1, p.bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, tw, th);

    if (p.kind === 'fan') fanPaving(ctx, tw, th, p, rng);
    else if (p.kind === 'slab') slabs(ctx, tw, th, p, rng, false);
    else if (p.kind === 'mosaic') { slabs(ctx, tw, th, p, rng, false); mosaicBand(ctx, tw, th, p); }
    else if (p.kind === 'earth') packedEarth(ctx, tw, th, p, rng);
    else if (p.kind === 'volcanic') cobbles(ctx, tw, th, p, rng, false);
    else if (p.kind === 'inca') slabs(ctx, tw, th, p, rng, true);
    else if (p.kind === 'coral') cobbles(ctx, tw, th, p, rng, true);
    else { cobbles(ctx, tw, th, p, rng, p.kind === 'calcada'); if (p.kind === 'calcada') calcadaAccent(ctx, tw, th, p); }

    if (c.port) quayEdge(ctx, tw, p, rng);
    groundShade(ctx, tw, th);
    A.applyGrain(ctx, tw, th, p.kind === 'earth' ? 0.075 : 0.05);
    cv._style = { id: style.id, name: p.name, exterior: style.ext, material: p.kind, port: !!c.port };
    return cv;
  }
  /** 그림 띠를 앞길 높이에 맞춰 한 장 그려 둔다(가로는 그림의 이음 주기 그대로 되풀이된다). */
  function groundFromImage(img, th, style, p, c) {
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    var tw = Math.max(16, Math.round(iw * th / ih)), cv = A.canvas(tw, th), ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, iw, ih, 0, 0, tw, th);
    groundShade(ctx, tw, th);
    cv._style = { id: style.id, name: p.name, exterior: style.ext, material: p.kind, port: !!c.port, image: groundKey(style.id) };
    return cv;
  }
  function groundShade(ctx, tw, th) {
    // 건물이 닿는 자리에만 엷은 그늘을 두어 투명 건물 그림이 바닥에 자연스럽게 붙어 보이게 한다.
    var sh = ctx.createLinearGradient(0, 0, 0, 68);
    sh.addColorStop(0, 'rgba(29,22,16,.48)'); sh.addColorStop(1, 'rgba(29,22,16,0)');
    ctx.fillStyle = sh; ctx.fillRect(0, 0, tw, 68);
    ctx.fillStyle = 'rgba(43,32,23,.34)'; ctx.fillRect(0, 0, tw, 3);
    // 인물 발에 대는 무늬는 선명하게, 아래쪽은 조금 어둡게 마감한다.
    var depth = ctx.createLinearGradient(0, th * 0.46, 0, th);
    depth.addColorStop(0, 'rgba(255,235,205,0)'); depth.addColorStop(1, 'rgba(42,30,24,.16)');
    ctx.fillStyle = depth; ctx.fillRect(0, th * 0.46, tw, th * 0.54);
  }

  // ---------------------------------------------------------------- 카메라·진행
  T.focusOn = function (kind, arg) {
    var it = T.item(kind, arg);
    if (!it) return Promise.resolve(null);
    st.focus = it;
    st.camTo = clampCam(it.x + it.w / 2 - W / 2);
    st.hero.to = it.x + it.w * 0.5; st.hero.walkV = null;
    st.hero.walking = st.heroFrames.length > 0;
    st.dirty = true;
    return new Promise(function (res) {
      var t0 = performance.now();
      (function wait() {
        if (!st) return res(null);
        var near = st.hero.to == null || Math.abs(st.hero.x - st.hero.to) < 24;
        var still = Math.abs(st.cam - st.camTo) < 10;
        if ((near && still) || performance.now() - t0 > 1500) {
          st.hero.walking = false; st.hero.to = null;
          if (st.heroFrames.length) {           // 문 안으로 들어간다
            st.hero.entering = true;
            setTimeout(function () { if (st) { st.hero.entering = false; st.hero.fade = 1; } res(it); }, 420);
          } else res(it);
          return;
        }
        requestAnimationFrame(wait);
      })();
    });
  };
  T.item = function (kind, arg) {
    if (!st) return null;
    for (var i = 0; i < st.items.length; i++) {
      var it = st.items[i];
      if (it.kind === kind && (arg == null || it.arg === arg)) return it;
    }
    return null;
  };
  T.pan = function (dx) { if (st) st.camTo = clampCam(st.camTo + dx); };
  /** 말을 걸 사람 앞까지 제독이 걸어간다 (js/scenes/city.js C.chatFolk) */
  T.approach = function (f) {
    if (!st || st.hidden) return Promise.resolve();
    var gap = ((G.FX && G.FX.streetFolk) || {}).talkGap || 95, side = st.hero.x <= f.x ? -1 : 1;
    var to = U.clamp(f.x + side * gap * (f.animal ? 0.8 : 1), 40, st.streetW - 40);
    st.hover = null;
    if (Math.abs(to - st.hero.x) < 12) { st.hero.dir = f.x > st.hero.x ? 1 : -1; st.dirty = true; return Promise.resolve(); }
    st.hero.to = to; st.hero.walkV = null; st.camTo = clampCam(to - W / 2);
    var mine = st;
    return new Promise(function (res) {
      var t0 = Date.now();
      // 닿으면 바로 (예전에는 hero.to가 비워지기만 기다려 늘 3.5초를 채웠다 — 걸음은 hero.x가 to에 닿으면 끝난다)
      (function wait() {
        var arrived = st === mine && (st.hero.to == null || Math.abs(st.hero.x - to) < 1);
        if (st !== mine || arrived || Date.now() - t0 > 3500) { if (st === mine) { st.hero.to = null; st.hero.walking = false; st.hero.dir = f.x > st.hero.x ? 1 : -1; st.dirty = true; } res(); return; }
        setTimeout(wait, 30);
      })();
    });
  };

  function hitAt(x, y) {
    if (!st) return null;
    for (var i = st.items.length - 1; i >= 0; i--) {
      var it = st.items[i], sx = it.x - st.cam;
      if (x >= sx && x <= sx + it.w && y >= it.base - it.h - 46 && y <= it.base) return it;
    }
    return null;
  }
  /** 그 볼거리 앞으로 카메라와 제독을 옮긴다 */
  T.focusMark = function (id) {
    var m = st && st.marks.filter(function (x) { return x.id === id; })[0];
    if (!m) return Promise.resolve(null);
    var cx = (m.x + m.cv.width / 2 - W / 2) / 0.72;
    st.camTo = clampCam(cx);
    return new Promise(function (res) { setTimeout(res, 650); });
  };

  /* 거리 뒤편의 볼거리(발견물): 그림이 그려진 곳을 누르면 설명을 본다. 앞의 건물이 투명한 자리(하늘)일 때만 건물보다 먼저 잡힌다. */
  var MARK_PX = 0.72;        // 볼거리가 카메라를 따라 움직이는 정도 (draw 와 같다)
  function solid(o, px, py) {
    if (o.alpha === undefined) { try { o.alpha = o.cv.getContext('2d').getImageData(0, 0, o.cv.width, o.cv.height).data; } catch (e) { o.alpha = null; } }
    if (!o.alpha) return true;             // file:// 처럼 픽셀을 읽을 수 없으면 네모 전체
    for (var dy = -6; dy <= 6; dy += 3) for (var dx = -6; dx <= 6; dx += 3) {
      var qx = Math.round(px + dx), qy = Math.round(py + dy);
      if (qx < 0 || qy < 0 || qx >= o.cv.width || qy >= o.cv.height) continue;
      if (o.alpha[(qy * o.cv.width + qx) * 4 + 3] > 40) return true;
    }
    return false;
  }
  function markAt(x, y) {
    if (!st) return null;
    for (var i = st.marks.length - 1; i >= 0; i--) {
      var m = st.marks[i]; if (!m.d && !m.info) continue;
      var sx = m.x - st.cam * MARK_PX, top = m.y - m.cv.height;
      if (x < sx || x > sx + m.cv.width || y < top || y > m.y) continue;
      if (solid(m, x - sx, y - top)) return m;
    }
    return null;
  }
  /** 이 자리에서 누를 것: 건물(이름표 포함)이 먼저, 건물 그림의 빈 하늘 너머로 보이는 볼거리는 볼거리 */
  function pickAt(x, y) {
    var fk = G.StreetFolk && st.folks ? G.StreetFolk.hit(st.folks, x, y, st.cam) : null;   // 거리를 걷는 사람이 먼저
    if (fk) return fk;
    var it = hitAt(x, y), m = markAt(x, y);
    if (it && m) { var py = y - (it.base - it.h); if (py >= 0 && !solid(it, x - (it.x - st.cam), py)) return m; return it; }
    return it || m;
  }
  /** 볼거리의 설명: 발견한 것은 발견 카드, 아직이면 그림과 설명에 「건물에 들어가 둘러보면 발견」 안내 */
  var inspecting = false;
  T.inspect = async function (m) {
    if (!st || inspecting || !m || (!m.d && !m.info)) return;
    inspecting = true; st.hover = null; st.dirty = true;
    try {
      var d = m.d;
      if (d && G.Disc.foundByMe(d.id)) await G.Scenes.discoveryCard(d, 0);
      else {
        var nm = d ? d.name : m.info.name, desc = d ? d.desc : m.info.desc, key = I.pick(I.chain.landmark(m.id));
        var html = '<div class="disc-card landmark-card"><div class="disc-head">' + (d ? 'LANDMARK' : 'SIGHT') + '</div><div class="lm-art"></div>' +
          '<div class="dname">' + U.esc(nm) + '</div>' +
          '<div class="center">' + (d ? '<span class="tag">' + (G.DISC_CATS[d.cat] || '') + '</span> ' : '') + '<span class="tag">' + U.esc(st.city.name) + '</span></div>' +
          '<div class="desc">' + U.esc(desc) + '</div>' +
          (d ? '<div class="lm-note">' + G.icon('boot') + '<span>거리 너머로 바라보기만 했다. 이 도시의 건물(교역소·시장·교회·왕궁…)에 들어가 가까이에서 둘러보면 발견으로 기록된다.</span></div>' : '') + '</div>';
        var win = UI.window({ title: nm, icon: 'star', width: 720, clickAny: true, html: html, buttons: [{ label: '확인', value: 1, cls: 'navy' }] });
        if (key) { var im = U.el('img'); im.alt = nm; im.src = I.src(key); win.content.querySelector('.lm-art').appendChild(im); }
        await win.result;
      }
    } catch (e) { console.error(e); }
    inspecting = false;
    if (st) st.dirty = true;
  };

  // ---------------------------------------------------------------- 입력
  /** 거리 클릭을 받는 투명한 판. onPick(kind, arg) 로 알려 준다. 뒤편의 볼거리를 누르면 T.inspect */
  T.catcher = function (onPick) {
    if (st) st.onPick = onPick;      // ↑ 키로 들어갈 때도 같은 길로
    if (st && !T._toldKeys) { T._toldKeys = true; UI.toast('거리 — ←→ 걷기 · Shift 뛰기 · ↑ 건물에 들어가기 (건물을 눌러도 됩니다)', 'boot', 5200); }
    var el = U.el('div', 'towncatch');
    el.style.cssText = 'position:absolute;inset:0;z-index:4;cursor:default';
    var down = null, moved = 0;
    function pos(e) {
      var r = G.Game.canvases().scene.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
    }
    el.addEventListener('mousedown', function (e) { if (e.button === 0) { down = pos(e); moved = 0; } });
    el.addEventListener('mousemove', function (e) {
      if (!st) return;
      var p = pos(e);
      if (down) {
        var dx = p[0] - down[0];
        moved += Math.abs(dx);
        st.cam = st.camTo = clampCam(st.cam - dx);
        down = pos(e);
        el.style.cursor = 'grabbing';
        return;
      }
      st.hover = st.hidden ? null : pickAt(p[0], p[1]);
      el.style.cursor = st.hover ? (st.hover.spec ? 'pointer' : st.hover.cv && !st.hover.kind ? 'zoom-in' : 'pointer') : 'default';
    });
    el.addEventListener('mouseup', function (e) {
      if (!st) { down = null; return; }
      var p = pos(e);
      var wasDrag = moved > 8;
      down = null; el.style.cursor = 'default';
      if (wasDrag) return;
      var it = st.hidden ? null : pickAt(p[0], p[1]);
      // 거리를 걷는 사람: 다가가 말을 건다 (city.chatFolk)
      if (it && it.spec) { onPick('folk', it); return; }
      // 아직 찾지 않은 도시 건물 발견물이면 눌러서 발견 (city.lookAt), 그 밖의 볼거리는 들여다보기
      if (it && !it.kind && it.d && G.Disc && G.Disc.isBuilding && G.Disc.isBuilding(it.d) && !G.Disc.foundByMe(it.id) && G.Disc.built(it.d)) onPick('landmark', it.id);
      else if (it && !it.kind) T.inspect(it);
      else if (it) onPick(it.kind, it.arg);
      else st.camTo = clampCam(st.camTo + (p[0] < 120 ? -420 : p[0] > W - 120 ? 420 : 0));
    });
    el.addEventListener('mouseleave', function () { down = null; if (st) st.hover = null; });
    el.addEventListener('wheel', function (e) { e.preventDefault(); T.pan(e.deltaY > 0 ? 180 : -180); }, { passive: false });
    return el;
  };
  /* 걷기: ←→(A·D)를 누르는 동안 제독이 그쪽으로 걷고, Shift를 함께 누르면 뛴다. 카메라가 따라간다.
     ↑(W)를 누르면 지금 서 있는 건물에 들어간다(건물을 누른 것과 같다). 마우스로 건물을 눌러도 그대로 걸어가 들어간다. */
  function keyName(e) {
    var k = String(e.key || '').toLowerCase();
    if (k === 'arrowleft' || k === 'a') return 'left';
    if (k === 'arrowright' || k === 'd') return 'right';
    if (k === 'arrowup' || k === 'w') return 'up';
    if (k === 'shift') return 'shift';
    return null;
  }
  if (!T._keyHooked && typeof document !== 'undefined') {
    T._keyHooked = true;
    document.addEventListener('keyup', function (e) { var k = keyName(e); if (st && k) { st.keys[k] = false; if (k !== 'shift') st.keys.shift = !!e.shiftKey; } });
    window.addEventListener('blur', function () { if (st) st.keys = {}; });
  }
  /** 제독이 서 있는 자리의 건물 (문 앞) */
  function itemAtHero() {
    if (!st) return null;
    var x = st.hero.x, best = null, bd = 1e9;
    st.items.forEach(function (it) {
      var c = it.x + it.w / 2, d = Math.abs(x - c);
      if (d <= it.w * 0.45 && d < bd) { bd = d; best = it; }
    });
    return best;
  }
  T.onKey = function (e) {
    if (!st || st.hidden) return false;
    var k = keyName(e); if (!k) return false;
    st.keys.shift = !!e.shiftKey || (k === 'shift');
    if (k === 'left' || k === 'right') { st.keys[k] = true; st.hero.to = null; st.hero.walkV = null; return true; }
    if (k === 'up') {
      var it = itemAtHero();
      if (it && st.onPick && !e.repeat) { st.keys = {}; st.onPick(it.kind, it.arg); }
      return true;
    }
    return k === 'shift';
  };

  // ---------------------------------------------------------------- 그리기
  T.update = function (dt) {
    if (!st || st.hidden) return;
    st.t += dt;
    var moved = false;
    var k = 1 - Math.pow(0.0009, Math.min(0.05, dt));
    var d0 = st.camTo - st.cam;
    if (Math.abs(d0) > 0.3) { st.cam += d0 * k; moved = true; } else if (st.cam !== st.camTo) { st.cam = st.camTo; moved = true; }
    var hero = st.hero, kd = (st.keys.right ? 1 : 0) - (st.keys.left ? 1 : 0);
    if (kd && hero.to == null && !hero.entering) {
      // 손으로 걷기·뛰기
      var run = !!st.keys.shift, v = run ? KEY_RUN_V : KEY_WALK_V, lo = 40, hi = st.streetW - 40;
      var nx = U.clamp(hero.x + kd * v * dt, lo, hi);
      hero.dist += Math.abs(nx - hero.x); hero.x = nx; hero.dir = kd;
      hero.walking = st.heroFrames.length > 0; hero.running = run && st.runFrames.length > 0; hero.keyRun = run;
      st.camTo = clampCam(hero.x - W / 2);
      moved = true;
    } else if (hero.keyRun != null && hero.to == null) {
      hero.walking = false; hero.running = false; hero.keyRun = null; moved = true;   // 손을 떼면 선다
    }
    var near = itemAtHero();
    if (near !== st.near) { st.near = near; moved = true; }
    if (hero.to != null) {
      // 멀리 갈수록 빨리 걷는다 (어느 건물이든 1초 안팎에 닿도록)
      // 뛰는 그림이 있으면: 가까운 건물은 걸어서, 먼 건물은 뛰어서 간다
      if (hero.walkV == null) {
        var far = Math.abs(hero.to - hero.x), canRun = st.runFrames.length > 0;
        hero.running = canRun && far > RUN_DIST;
        hero.walkV = !canRun ? Math.max(620, far * 1.6) : hero.running ? Math.max(RUN_V, far * 1.5) : WALK_V;
      }
      var d = hero.to - hero.x, sp = hero.walkV * dt;
      if (Math.abs(d) <= sp) { hero.dist += Math.abs(d); hero.x = hero.to; hero.walkV = null; hero.running = false; }
      else { hero.x += Math.sign(d) * sp; hero.dist += sp; hero.dir = d > 0 ? 1 : -1; }
      moved = true;
    }
    if (hero.entering) { hero.fade = Math.max(0, hero.fade - dt / 0.42); hero.dist += 260 * dt; moved = true; }
    if (st.hover !== st.drawnHover || st.focus !== st.drawnFocus) moved = true;
    if (G.Scenes.city.timeOfDay() !== st.tod) moved = true;
    // 거리를 걷는 사람들: 그들만 움직일 때는 초당 folkFps번만 다시 그린다 (거리 전체를 매 틀 다시 그리지 않게 — 끊김 방지)
    var folkMoved = !!(st.folks && st.folks.length && G.StreetFolk && G.StreetFolk.update(st.folks, dt, hero.x));
    st.folkAcc = (st.folkAcc || 0) + dt;
    if (!moved && !st.dirty) {
      if (!folkMoved || st.folkAcc < 1 / (((G.FX && G.FX.streetFolk) || {}).fps || 30)) return;      // 움직임이 없으면 다시 그리지 않는다
    }
    st.folkAcc = 0;
    st.dirty = false;
    draw();
  };
  T.redraw = function () { if (st) { st.dirty = true; st.baseKey = null; } };   // 바탕까지 다시

  /* 거리의 바탕(하늘·길·볼거리·건물)은 카메라·눌린 것·시간대가 그대로면 한 장으로 기억해 두고 그대로 붙인다 —
     거리 사람·제독·이름표·하늘빛만 매번 그린다 (거리 사람이 걸어 다녀도 무겁지 않게) */
  function draw() {
    var ctx = G.Game.sceneCtx();
    var cam = st.cam;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var hv = st.hover && !st.hover.spec ? st.hover : null;     // 거리 사람에 마우스를 올린 것은 바탕을 바꾸지 않는다
    var bkey = Math.round(cam * 4) + '|' + (hv ? st.items.indexOf(hv) + ':' + st.marks.indexOf(hv) : '') + '|' + (st.focus ? st.items.indexOf(st.focus) : '') + '|' + (st.near ? st.items.indexOf(st.near) : '') + '|' + (st.bgCv ? 1 : 0) + '|' + st.items.length;
    if (!st.base) { st.base = document.createElement('canvas'); st.base.width = W; st.base.height = H; st.baseKey = null; }
    if (st.baseKey !== bkey) { drawBase(st.base.getContext('2d'), cam, hv); st.baseKey = bkey; }
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(st.base, 0, 0);
    drawFront(ctx, cam);
  }
  function drawBase(ctx, cam, hover) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // 배경 (미리 확대해 둔 그림에서 필요한 부분만 잘라 붙인다)
    if (st.bgCv) {
      var sx = Math.round(cam * PARALLAX);
      ctx.drawImage(st.bgCv, sx, -st.bgY, W, H, 0, 0, W, H);
    } else { ctx.fillStyle = '#c8d4dc'; ctx.fillRect(0, 0, W, H); }
    // 앞쪽 길 (건물이 이 위에 선다)
    var gy = WALK_TOP, tw = st.ground.width;
    var start = -(((cam * 0.98) % tw) + tw) % tw;
    for (var gx = start; gx < W; gx += tw) ctx.drawImage(st.ground, gx, gy);
    // 볼거리(뒤쪽)
    st.marks.forEach(function (m) {
      var x = m.x - cam * 0.72;
      if (x + m.cv.width < -40 || x > W + 40) return;
      ctx.globalAlpha = 0.96;
      ctx.drawImage(m.cv, x, m.y - m.cv.height);
      ctx.globalAlpha = 1;
      if (hover === m) {            // 누를 수 있는 볼거리: 살짝 밝힌다
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.16;
        ctx.drawImage(m.cv, x, m.y - m.cv.height); ctx.restore();
      }
    });
    // 건물
    st.items.forEach(function (it) {
      var x = it.x - cam;
      if (x + it.w < -60 || x > W + 60) return;
      ctx.save();
      ctx.fillStyle = 'rgba(40,26,12,.22)';
      ctx.beginPath(); ctx.ellipse(x + it.w / 2, it.base + 8, it.w * 0.42, 15, 0, 0, 7); ctx.fill();
      ctx.restore();
      ctx.drawImage(it.cv, x, it.base - it.h);
      if (hover === it || st.focus === it || st.near === it) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = hover === it ? 0.16 : 0.10;
        ctx.drawImage(it.cv, x, it.base - it.h);
        ctx.restore();
      }
    });
  }
  function drawFront(ctx, cam) {
    // 거리를 걷는 사람들 — 제독보다 뒤(위)에 선 사람, 제독, 앞에 선 사람 차례로
    var heroY = GROUND + 34, folks = (st.folks || []).slice().sort(function (a, b) { return a.y - b.y; });
    folks.forEach(function (f) { if (f.y <= heroY) G.StreetFolk.draw(ctx, f, cam, st.hover === f); });
    // 주인공 (그림이 있을 때만)
    drawHero(ctx, cam);
    folks.forEach(function (f) { if (f.y > heroY) G.StreetFolk.draw(ctx, f, cam, st.hover === f); });
    // 건물 이름표
    st.items.forEach(function (it) {
      var x = it.x - cam;
      if (x + it.w < -60 || x > W + 60) return;
      var on = st.hover === it || st.focus === it || st.near === it, tag = on ? it.tagOn : it.tag;
      ctx.drawImage(tag, Math.round(x + it.w / 2 - tag.width / 2), Math.round(it.base - it.h - 16 - (it.lift || 0) - tag.height));
    });
    // 거리 사람 이름표 (마우스를 올렸을 때)
    var hf = st.hover;
    if (hf && hf.spec) {
      var ft = hf.tag || (hf.tag = plaqueCanvas(hf.name + ' — 말 걸기', true));
      ctx.drawImage(ft, Math.round(hf.x - cam - ft.width / 2), Math.round(hf.y - hf.spec.h * hf.sc * (hf.animal ? 1.25 : 1.12) - ft.height));
    }
    // 볼거리 이름표 (마우스를 올렸을 때)
    var hm = st.hover;
    if (hm && !hm.kind && hm.cv) {
      var tg = hm.tag || (hm.tag = plaqueCanvas((hm.d ? hm.d.name : hm.info.name) + ' — 살펴보기', true));
      ctx.drawImage(tg, Math.round(hm.x - cam * MARK_PX + hm.cv.width / 2 - tg.width / 2), Math.max(8, Math.round(hm.y - hm.cv.height - 6 - tg.height)));
    }
    // 문 앞에 서 있으면: ↑ 들어가기
    if (st.near && !st.hero.entering && st.hero.to == null && !st.hidden) enterPrompt(ctx, st.hero.x - cam, GROUND + 34 - HERO_H - 18, st.near);
    // 하늘빛·시간대·가장자리 어둠
    var tod = G.Scenes.city.timeOfDay();
    if (tod !== st.tod) { st.tod = tod; st.overlay = overlayFor(tod); }
    ctx.drawImage(st.overlay, 0, 0);
    // 좌우로 더 갈 수 있다는 표시
    edge(ctx, cam > 6, true);
    edge(ctx, cam < st.streetW - W - 6, false);
    st.drawnHover = st.hover; st.drawnFocus = st.focus;
  }

  var promptFont = null;
  function enterPrompt(ctx, x, y, it) {
    var txt = '↑ ' + (it.label || it.name || '') + ' 들어가기';
    ctx.save();
    ctx.font = promptFont || (promptFont = '700 20px ' + getComputedStyle(document.body).fontFamily);
    var w = ctx.measureText(txt).width + 26, h = 34;
    ctx.translate(Math.round(x - w / 2), Math.round(y - h));
    ctx.fillStyle = 'rgba(28,18,8,.78)'; roundRect(ctx, 0, 0, w, h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(227,198,141,.85)'; ctx.lineWidth = 1.5; roundRect(ctx, 0, 0, w, h, 8); ctx.stroke();
    ctx.fillStyle = '#f2e7cc'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 13, h / 2 + 1);
    ctx.restore();
  }
  function drawHero(ctx, cam) {
    var run = st.hero.running && st.runFrames.length && !st.hero.entering;
    var fr = run ? st.runFrames : st.heroFrames;
    if (!fr.length || st.hero.fade <= 0.01) return;
    var i = run ? Math.floor(st.t * RUN_FPS) % fr.length : st.hero.walking || st.hero.entering ? Math.floor(st.hero.dist / WALK_STRIDE) % fr.length : 0;
    var img = fr[i];
    var h = HERO_H, w = (img.naturalWidth || img.width) * h / (img.naturalHeight || img.height);
    var x = st.hero.x - cam, y = GROUND + 34;
    ctx.save();
    ctx.globalAlpha = st.hero.fade;
    ctx.fillStyle = 'rgba(40,26,12,.28)';
    ctx.beginPath(); ctx.ellipse(x, y - 2, w * 0.3, 8, 0, 0, 7); ctx.fill();
    ctx.translate(x, y);
    if (st.hero.dir < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
  }
  function plaqueCanvas(text, on) {
    var m = A.canvas(8, 8).getContext('2d');
    m.font = '600 21px "Nanum Myeongjo", serif';
    var pw = Math.ceil(m.measureText(text).width) + 30, ph = 34;
    var cv = A.canvas(pw + 4, ph + 4), ctx = cv.getContext('2d');
    ctx.font = '600 21px "Nanum Myeongjo", serif';
    ctx.globalAlpha = on ? 1 : 0.86;
    roundRect(ctx, 2, 2, pw, ph, 5);
    ctx.fillStyle = on ? '#f6ecd2' : '#e8dcbe';
    ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = on ? '#c8a35a' : '#9a7a44'; ctx.stroke();
    ctx.fillStyle = '#2a1d12'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 2 + pw / 2, 2 + ph / 2 + 1);
    return cv;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function edge(ctx, show, left) {
    if (!show) return;
    ctx.save();
    var x = left ? 0 : W - 90;
    var g = ctx.createLinearGradient(x, 0, x + (left ? 90 : -90) + (left ? 0 : 90), 0);
    g.addColorStop(left ? 0 : 1, 'rgba(20,12,6,.30)'); g.addColorStop(left ? 1 : 0, 'rgba(20,12,6,0)');
    ctx.fillStyle = g; ctx.fillRect(x, 0, 90, H);
    ctx.globalAlpha = 0.62;
    ctx.strokeStyle = '#f0e0bc'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    var cx = left ? 34 : W - 34, cy = H / 2, d = left ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(cx - 9 * d, cy - 16); ctx.lineTo(cx + 9 * d, cy); ctx.lineTo(cx - 9 * d, cy + 16); ctx.stroke();
    ctx.restore();
  }
})(window.G = window.G || {});
