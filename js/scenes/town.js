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

  // 건물마다 화면에 그릴 높이
  var SIZE = { harbor: 405, shipyard: 385, trade: 360, market: 320, tavern: 345, inn: 352, church: 425,
    library: 365, palace: 430, mansion: 372, guild: 362, home: 340, gate: 372 };
  // 거리에 늘어서는 차례 (왼쪽 = 바다 쪽, 오른쪽 = 성문 쪽)
  var ORDER = ['harbor', 'shipyard', 'trade', 'market', 'tavern', 'inn', 'guild', 'library', 'church', 'mansion', 'palace', 'home', 'gate'];
  // 도시마다 거리 한쪽에 서 있는 볼거리 (누를 수는 없다)
  // 아직 전용 그림이 없는 건물은 비슷한 건물 그림을 좌우로 뒤집어 쓴다
  var SUBSTITUTE = {};   // 전용 그림이 오면 여기서 비슷한 건물로 돌려 쓸 수 있다
  var LANDMARKS = { 7: [['giralda', 0.60, 430], ['columns', 0.10, 250]] };
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
    return I.preload(chains, 5000).then(function () { build(c, buildings, landmarks); return st; });
  };
  T.close = function () { st = null; };
  T.active = function () { return !!st; };
  T.runtime = function () { return st; };   // 시험용
  T.city = function () { return st && st.city; };
  T.hidden = function (v) {
    if (st && v != null) { st.hidden = !!v; st.keys = {}; if (!st.hidden) { st.hero.fade = 1; st.hero.entering = false; st.dirty = true; } }
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
      return { cv: prescale(img, l[2]), x: Math.round(streetW * l[1]), y: GROUND - 54 };
    }).filter(Boolean);
    st = {
      city: c, items: items, marks: marks, streetW: streetW,
      bg: bgKey ? I.get(bgKey) : cityBackdrop(c), ground: groundStrip(c, rng), hidden: false,
      cam: 0, camTo: 0, hover: null, focus: null, t: 0,
      hero: { x: items.length ? items[0].x + items[0].w / 2 : W / 2, to: null, dir: 1, walking: false, dist: 0, fade: 1, entering: false },
      heroFrames: heroFrames(), keys: {}, near: null, onPick: null,
      runFrames: I.chain.heroRun().map(function (k) { return I.get(k); }).filter(Boolean)
    };
    prepare();
    st.dirty = true;
    // 처음에는 항구(또는 첫 건물) 앞에서 시작
    st.cam = st.camTo = clampCam(st.hero.x - W / 2);
  }
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

  /** 앞쪽 길 — 항구는 돌 부두, 내륙은 자갈길 */
  function groundStrip(c, rng) {
    var tw = 900, th = H - WALK_TOP + 6, cv = A.canvas(tw, th), ctx = cv.getContext('2d');
    var port = !!c.port;
    var top = port ? '#9d8c68' : '#a89268';
    var bot = port ? '#6d5f45' : '#776547';
    var g = ctx.createLinearGradient(0, 0, 0, th);
    g.addColorStop(0, top); g.addColorStop(0.4, port ? '#8a7a59' : '#937e58'); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, tw, th);
    // 돌 무늬
    for (var y = 6; y < th; y += 30) {
      var row = Math.floor(y / 30);
      for (var x = -40; x < tw; x += 62) {
        var ox = (row % 2) * 31, ss = 1 + (y / th) * 0.5;
        ctx.fillStyle = A.rgba(A.jitter(port ? '#a0906c' : '#a48f66', rng, 13), 0.95);
        if (port) { ctx.fillRect(x + ox, y, 58 * ss - 3, 26 * ss - 3); }
        else { ctx.beginPath(); ctx.ellipse(x + ox + 28, y + 13, 26 * ss, 10.5 * ss, 0, 0, 7); ctx.fill(); }
        ctx.strokeStyle = 'rgba(48,34,18,.18)'; ctx.lineWidth = 1;
        if (port) ctx.strokeRect(x + ox + 0.5, y + 0.5, 58 * ss - 3, 26 * ss - 3);
      }
    }
    // 건물이 닿는 자리의 그늘
    var sh = ctx.createLinearGradient(0, 0, 0, 72);
    sh.addColorStop(0, 'rgba(34,22,10,.55)'); sh.addColorStop(1, 'rgba(34,22,10,0)');
    ctx.fillStyle = sh; ctx.fillRect(0, 0, tw, 72);
    ctx.fillStyle = 'rgba(60,42,20,.35)'; ctx.fillRect(0, 0, tw, 3);
    // 소품
    for (var i = 0; i < 4; i++) {
      var px = 60 + i * 210 + rng() * 60, py = th * (0.52 + rng() * 0.3);
      var kind = Math.floor(rng() * 3);
      ctx.save();
      ctx.fillStyle = 'rgba(30,18,8,.22)';
      ctx.beginPath(); ctx.ellipse(px + 18, py + 34, 34, 9, 0, 0, 7); ctx.fill();
      if (kind === 0) {           // 통
        ctx.fillStyle = A.rgba(A.jitter('#8a6236', rng, 16));
        ctx.beginPath(); ctx.ellipse(px + 18, py + 4, 22, 9, 0, 0, 7); ctx.fill();
        ctx.fillRect(px - 4, py + 4, 44, 30);
        ctx.fillStyle = 'rgba(40,26,12,.4)'; ctx.fillRect(px - 4, py + 12, 44, 4); ctx.fillRect(px - 4, py + 24, 44, 4);
      } else if (kind === 1) {    // 궤짝
        ctx.fillStyle = A.rgba(A.jitter('#9a7a4c', rng, 14)); ctx.fillRect(px, py + 2, 46, 32);
        ctx.strokeStyle = 'rgba(50,32,14,.5)'; ctx.lineWidth = 3; ctx.strokeRect(px + 2, py + 4, 42, 28);
        ctx.beginPath(); ctx.moveTo(px + 2, py + 4); ctx.lineTo(px + 44, py + 32); ctx.stroke();
      } else if (port) {          // 계선주와 밧줄
        ctx.fillStyle = '#6b5436'; ctx.fillRect(px + 8, py - 6, 20, 40);
        ctx.beginPath(); ctx.ellipse(px + 18, py - 6, 13, 7, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#c9b48c'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(px + 18, py + 6); ctx.bezierCurveTo(px + 70, py + 30, px + 110, py + 12, px + 150, py + 26); ctx.stroke();
      } else {                    // 화분
        ctx.fillStyle = '#a9673c'; ctx.beginPath(); ctx.moveTo(px + 4, py + 8); ctx.lineTo(px + 34, py + 8); ctx.lineTo(px + 29, py + 34); ctx.lineTo(px + 9, py + 34); ctx.fill();
        A.roundTree(ctx, px + 19, py + 2, 15, '#4a6a34', rng);
      }
      ctx.restore();
    }
    A.applyGrain(ctx, tw, th, 0.06);
    return cv;
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

  function hitAt(x, y) {
    if (!st) return null;
    for (var i = st.items.length - 1; i >= 0; i--) {
      var it = st.items[i], sx = it.x - st.cam;
      if (x >= sx && x <= sx + it.w && y >= it.base - it.h - 46 && y <= it.base) return it;
    }
    return null;
  }

  // ---------------------------------------------------------------- 입력
  /** 거리 클릭을 받는 투명한 판. onPick(kind, arg) 로 알려 준다. */
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
      st.hover = hitAt(p[0], p[1]);
      el.style.cursor = st.hover ? 'pointer' : 'default';
    });
    el.addEventListener('mouseup', function (e) {
      if (!st) { down = null; return; }
      var p = pos(e);
      var wasDrag = moved > 8;
      down = null; el.style.cursor = 'default';
      if (wasDrag) return;
      var it = hitAt(p[0], p[1]);
      if (it) onPick(it.kind, it.arg);
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
    if (!moved && !st.dirty) return;      // 움직임이 없으면 다시 그리지 않는다
    st.dirty = false;
    draw();
  };
  T.redraw = function () { if (st) st.dirty = true; };

  function draw() {
    var ctx = G.Game.sceneCtx();
    var cam = st.cam;
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
      if (st.hover === it || st.focus === it || st.near === it) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = st.hover === it ? 0.16 : 0.10;
        ctx.drawImage(it.cv, x, it.base - it.h);
        ctx.restore();
      }
    });
    // 주인공 (그림이 있을 때만)
    drawHero(ctx, cam);
    // 건물 이름표
    st.items.forEach(function (it) {
      var x = it.x - cam;
      if (x + it.w < -60 || x > W + 60) return;
      var on = st.hover === it || st.focus === it || st.near === it, tag = on ? it.tagOn : it.tag;
      ctx.drawImage(tag, Math.round(x + it.w / 2 - tag.width / 2), Math.round(it.base - it.h - 16 - (it.lift || 0) - tag.height));
    });
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
