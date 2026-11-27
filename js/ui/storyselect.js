/* 이야기 등록·기본 지도 API. 실제 고지도 선택 화면은 다음에 읽는 storyselect_folio.js에서 제공한다.
   새 이야기의 이름·초상·공개 조건·시작 함수는 이 파일의 G.STORY_MODES에 추가한다.
   아래 기본 지도는 예전 호출과의 호환을 위해 보존한다.
   이야기 고르기 (G.StorySelect) — 타이틀 「이야기 모드」 → 세계 지도 위 주인공 초상을 골라 그 이야기를 시작한다. 2026-11-21 사용자 요청
   · 지도: G.Geo.isLand 로 그린 양피지 땅 + 물결무늬 바다 + 금테. 초상은 주인공의 고향 항구 곁에 액자로 서고, 가는 금줄로 항구와 잇는다.
   · 지도는 두 장: 처음엔 유럽만(에스파냐·포르투갈·영국·네덜란드·오스만을 색과 국경·이름으로) → 오른쪽 화살표(▶)나 → 키로 밀면 동쪽 바다(조선)와 소영.
     이야기가 없는 지도는 빠진다(바닷길 노래 공개 전엔 동쪽 바다도 화살표도 없음).
   · 마우스를 올리면 초록 테, 누르면 아래에 이야기 소개(무릎상·제목·시작·동료·줄거리)와 「이 이야기로 시작」.
   · ← → 로 고르고 Enter 로 연다. 이야기마다 G.STORY_MODES 에 한 줄 — ok()가 거짓이면 지도에 나오지 않는다(공개 전 등). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var SL = G.StorySelect = {};
  var starting = null;
  SL.begin = async function (story) {
    if (starting) return starting;
    // 선택창이 닫힌 뒤 연대 진행·첫 장면까지 준비한다. 그동안 타이틀을 다시 보이지 않는다.
    starting = G.Loader.during('이야기를 준비하는 중…', async function () {
      await G.Loader.frames(2);
      await G.Game.prepareRenderer();
      await story.begin();
      if (G.Game.sceneName !== 'title') await G.Game.sceneShown();
    });
    try { return await starting; }
    finally { starting = null; }
  };
  G.STORY_MODES = [
    { id: 'photo', hero: '마테우스 다 코스타', title: '아버지의 사진', city: 0, page: 'eu', year: '1480년 · 리스본', bg: '#2f6b3a', dx: -171, dy: -196,
      face: 'portraits/player/navigator_white', half: 'characters/player_half_navigator_white',
      party: '자코모 카사노바 · 안셀무 신부 · 에스테방 누네스', tag: '아버지를 찾아가는 항해',
      synopsis: '행방불명된 아버지가 남긴 「있을 수 없는 그림」 한 장 — 붓 자국이 없고, 세상 어디에도 없는 옷과 지붕이 찍힌 사진. 하얀 남방의 항해사는 남작의 아들, 신부, 늙은 항해사와 함께 아버지의 자취를 따라 동쪽으로 떠난다.',
      ok: function () { return !!(G.Story && G.Story.begin); }, begin: function () { return G.Story.begin(true); } },
    { id: 'jhook', hero: '제시카 후크', title: '해적여제', sub: '교수대 아래서 올린 깃발', city: 38, page: 'eu', year: '1545년 · 런던', bg: '#7a1f24', dx: -319, dy: -125,
      face: 'portraits/player/jessica', half: 'characters/player_half_jessica',
      party: '스미스 호킨스 · 윌리엄 호킨스 · 코난 홈즈 …', tag: '아버지를 버린 세상에 복수하러 나간 항해',
      synopsis: '사략선장 로저 후크가 왕실의 동맹 거래에 버려져 교수대에 오른다. 딸 제시카는 늙은 선원 스미스와 그 아들 윌리엄과 함께 도망쳐 바다로 나간다. 왕을 죽이러 떠난 항해는, 끝내 자신이 지킬 가족과 나라를 만드는 항해가 된다.',
      ok: function () { return !!(G.JHook && G.JHook.begin); }, begin: function () { return G.JHook.begin(true); } },
    { id: 'gold', hero: '아드리안 판데르펠더', title: '황금의 바다', sub: '세계를 잇는 상인', city: 24, page: 'eu', year: '1598년 · 암스테르담', bg: '#8a5a1a', dx: 150, dy: -60,
      face: 'portraits/story-player/adrian', half: 'portraits/story-player/adrian_half',
      party: '엘리너르 더비트 · 마리커 판레이우언 · 브람 판호른 …', tag: '세상의 길을 사러 가는 항해',
      synopsis: '아버지는 해적에게 배를 잃고 빚만 남긴 채 죽었다. 스물두 살 상인에게 남은 것은 작은 배 한 척과 장부 마지막 줄의 한 문장. 밀린 급료를 받으러 온 공증인의 딸, 소문을 파는 소꿉친구, 돈을 빌려준 친구와 함께 — 연합 동인도 회사와 해적섬, 배신과 사랑을 지나 세계에서 가장 부유한 사람이 되는 서른 해.',
      ok: function () { return !!(G.GoldSea && G.GoldSea.begin); }, begin: function () { return G.GoldSea.begin(true); } },
    { id: 'song', hero: '김소영', title: '바닷길 노래', sub: '바다에 길을 내는 노래', city: 229, page: 'ea', year: '1480년 · 한산도', bg: '#22558a', dx: -126, dy: 52,
      face: 'portraits/player/soyoung', half: 'characters/player_half_soyoung',
      party: '황규 · 박월담 · 임처사 …', tag: '들려준 세상을 직접 만나러 가는 항해',
      synopsis: '여섯 해 전 갯바위에서 건진 사내는 세상 이야기와 물음표투성이 지도, 끝맺지 못한 노래 한 곡을 남기고 사라졌다. 열여덟 소리꾼은 재담꾼과 낙방 선비를 데리고 그 세상을 만나러 떠난다. 그녀가 노래하면 어느 나라든 공연장이 된다.',
      ok: function () { return !!(G.SongStory && G.SongStory.begin && G.SongStory.released()); }, begin: function () { return G.SongStory.begin(true); } }
  ];
  /* 지도는 두 장 — 유럽(기본)과 동쪽 바다(조선). 옆 화살표나 ← → 로 오른쪽으로 밀면 동쪽 바다가 나온다.
     나라는 여섯 — 에스파냐·포르투갈·영국·네덜란드·오스만·조선 — 만 색을 칠하고 이름을 쓴다(2026-11-21 사용자 요청). 나머지 땅은 양피지 그대로. */
  var W = 1180, H = 540;
  var PAGES = [
    { id: 'eu', short: '유럽', banner: '유럽 — 대서양에서 흑해까지', lon0: -22, lon1: 50, lat1: 60, lat0: 34,
      seas: [['대서양', -16, 47], ['북해', 3, 56.6], ['발트해', 19.5, 57.6], ['지중해', 5.6, 39.4], ['흑해', 34, 43.4]] },
    { id: 'ea', short: '조선', banner: '동쪽 바다 — 조선', lon0: 104, lon1: 154, lat1: 46, lat0: 24,
      seas: [['황해', 123.6, 35.6], ['동해', 134, 40.4], ['동중국해', 125.5, 28.6], ['태평양', 146, 31]] }
  ];
  /** 칠하는 나라 — 색 · 지도 이름 · 이 나라로 셀 도시의 나라(c.nation) · 땅 모양을 잡는 씨앗 점 [경도, 위도] */
  var NATIONS = {
    PT: { name: '포르투갈', color: '#2f62b8', from: ['포르투갈'], seeds: [[-8, 40.5], [-8, 37.6], [-7.6, 41.7], [-8.2, 39.4], [-7.4, 38.4]], lab: [-8.1, 40.9] },
    ES: { name: '에스파냐', color: '#d6a52a', from: ['카스티야', '아라곤', '그라나다 왕국'], seeds: [[-4.5, 42], [-3.7, 40.4], [-6, 39], [-2, 39], [-0.5, 41.5], [-5.5, 42.8], [-2.4, 37.8], [-1.5, 40.5], [-6.6, 41.6], [-1.8, 42.6]], lab: [-2.6, 39.5] },
    EN: { name: '영국', color: '#c4343a', from: ['잉글랜드', '스코틀랜드'], seeds: [[-2, 53], [-1.5, 52], [-3.8, 50.6], [-3.6, 52.3], [-4, 57], [-4, 55.8], [-2.6, 54.8], [-4.6, 58.1], [0.6, 52.4], [-5, 50.3]] },
    NL: { name: '네덜란드', color: '#e8801c', from: ['부르고뉴'], seeds: [[5.6, 52.2], [6.2, 52.7], [4.6, 51.8], [6.6, 53.1], [4.4, 50.8], [5.4, 51.3]], box: [2, 7.3, 50.3, 53.6] },
    OT: { name: '오스만', color: '#2f8f4e', from: ['오스만 제국'], seeds: [[21, 42], [25, 42], [27, 40], [31, 39], [35, 39], [38, 39], [20, 40], [18.3, 44], [21, 44], [22.4, 39.4], [30, 37.6], [36, 37.6], [24.8, 41.2], [33, 41.4], [39.5, 40.2]], lab: [32.6, 39.2], north: 44.5 },
    KR: { name: '조선', color: '#3d72c8', from: ['조선'], seeds: [[127, 37.5], [128, 36], [127, 35], [126.5, 39], [127.5, 40.5], [129.5, 42], [128.5, 38], [125.3, 40.1], [129.8, 41.6], [128.4, 41], [126.7, 35.4], [128.8, 35.6]] }
  };
  /* 나라 사이 경계를 바로잡는 다른 땅 씨앗 (칠하지 않음) */
  var OTHER = [[-8, 53], [-8, 52.2], [-7.6, 54.5], [3, 47], [0, 46], [2, 45.5], [4, 48.5], [-3, 48], [-1, 43.6], [1.5, 42.9], [3, 43.4], [2.6, 50.2], [7.6, 50.6], [7.8, 52.4],
    [33, 47.5], [37, 48], [41, 47], [43.5, 44.5], [44, 42.2], [34, 45.3], [19, 47], [22, 47], [17, 46], [23.5, 46.8], [16, 45.3], [25, 44.5], [27, 47], [28.5, 45], [42, 39], [44, 37], [37, 35], [38, 36.5], [41.5, 36.8],
    [-6, 34], [-4, 34.8], [-1, 34.8], [5, 35.6], [9, 35.4], [-5.6, 35.4],
    [114, 30], [112, 34], [116, 37], [118, 32], [122.2, 40.6], [124, 41.6], [126.2, 41.6], [128, 42.7], [130.6, 43], [138, 36], [140, 38], [131, 33], [133, 34], [140.5, 40.5], [127.8, 26.3]];
  function natOf(c) {
    for (var k in NATIONS) { var n = NATIONS[k]; if (n.from.indexOf(c.nation) < 0) continue;
      if (n.box && !(c.lon >= n.box[0] && c.lon <= n.box[1] && c.lat >= n.box[2] && c.lat <= n.box[3])) return 'x';
      if ((k === 'ES' || k === 'PT') && !(c.lon < 4.5 && c.lat > 35.95)) return 'x'; // 이베리아 밖(세우타·칼리아리)은 칠하지 않음
      if (n.north && c.lat > n.north) return 'x'; // 오스만: 흑해 북쪽(카파·타나)은 초원 쪽이라 칠하지 않음
      return k; }
    return 'x';
  }
  function pageOf(id) { for (var i = 0; i < PAGES.length; i++) if (PAGES[i].id === id) return PAGES[i]; return PAGES[0]; }
  function px(pg, lon, lat) { if (typeof pg === 'string') pg = pageOf(pg); return [(lon - pg.lon0) / (pg.lon1 - pg.lon0) * W, (pg.lat1 - lat) / (pg.lat1 - pg.lat0) * H]; }
  SL.px = px; SL.PAGES = PAGES; SL.NATIONS = NATIONS;
  /** 이야기의 지도 — m.page 가 없으면 고향 경도로 (동경 90도 넘으면 동쪽 바다) */
  function modePage(m) { if (m.page) return m.page; var c = G.CITY_DATA[m.city]; return c && c.lon >= 90 ? 'ea' : 'eu'; }

  var CSS = '.ss-stage{position:relative;width:1180px;height:540px;margin:0 auto;border-radius:4px;overflow:hidden;box-shadow:inset 0 0 0 3px #3a2410,inset 0 0 0 7px #c9a35a,inset 0 0 0 9px #3a2410;user-select:none;background:#173f8c}' +
    '.ss-strip{position:absolute;left:0;top:0;height:540px;transition:transform .7s cubic-bezier(.65,0,.35,1)}.ss-page{position:absolute;top:0;width:1180px;height:540px}' +
    '.ss-page canvas.ss-map{position:absolute;inset:0}.ss-page svg{position:absolute;inset:0;pointer-events:none}' +
    '.ss-frame{position:absolute;inset:0;pointer-events:none;z-index:4;box-shadow:inset 0 0 0 3px #3a2410,inset 0 0 0 7px #c9a35a,inset 0 0 0 9px #3a2410}' +
    '.ss-corner{position:absolute;width:46px;height:46px;color:#d8b45e;font-size:40px;line-height:46px;text-align:center;text-shadow:0 2px 3px #000;pointer-events:none;z-index:4}' +
    '.ss-card{position:absolute;width:118px;height:132px;padding:5px;background:#5a3a16;border:3px solid #d8b45e;box-shadow:0 4px 12px rgba(0,0,0,.55),inset 0 0 0 2px #2a1806;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s}' +
    '.ss-card canvas{display:block;width:102px;height:116px;border:2px solid #2a1806}' +
    '.ss-card:hover,.ss-card.on{border-color:#3fd16e;box-shadow:0 0 0 2px #0d4a22,0 0 18px 4px rgba(63,209,110,.55);transform:translateY(-3px) scale(1.04);z-index:3}' +
    '.ss-card .nm{position:absolute;left:50%;bottom:-27px;transform:translateX(-50%);white-space:nowrap;padding:2px 10px;background:rgba(30,16,4,.88);color:#f3dfae;font-size:14px;border:1px solid #c9a35a;border-radius:3px}' +
    '.ss-banner{position:absolute;left:50%;top:14px;transform:translateX(-50%);white-space:nowrap;padding:5px 26px;background:rgba(36,20,6,.84);border:2px solid #c9a35a;color:#f3dfae;font-size:19px;letter-spacing:3px;border-radius:3px;pointer-events:none}' +
    '.ss-hint{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);white-space:nowrap;color:#f3dfae;font-size:13px;text-shadow:0 1px 3px #000;pointer-events:none;z-index:4}' +
    '.ss-arrow{position:absolute;top:50%;width:58px;height:132px;margin-top:-66px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(36,20,6,.82);border:2px solid #c9a35a;color:#f3dfae;cursor:pointer;z-index:4;transition:background .15s,transform .15s}' +
    '.ss-arrow b{font-size:30px;line-height:30px;color:#f1d98f}.ss-arrow span{font-size:13px;writing-mode:vertical-rl;letter-spacing:2px}' +
    '.ss-arrow.r{right:12px;border-radius:8px 0 0 8px;animation:ssNudge 1.6s ease-in-out infinite}.ss-arrow.l{left:12px;border-radius:0 8px 8px 0}' +
    '.ss-stage.inf .ss-arrow{display:none}.ss-arrow:hover{background:rgba(13,74,34,.92);border-color:#3fd16e}.ss-arrow.off{display:none}' +
    '@keyframes ssNudge{0%,100%{transform:none}50%{transform:translateX(-5px)}}' +
    '.ss-info{position:absolute;left:24px;right:24px;bottom:18px;height:228px;display:flex;gap:18px;padding:14px 18px;background:rgba(244,232,204,.97);color:#2b1d0d;border:3px solid #9b7a3c;border-radius:6px;box-shadow:0 8px 28px rgba(0,0,0,.6);z-index:5;animation:ssPop .25s ease-out both}' +
    '@keyframes ssPop{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}' +
    '.ss-info .half{flex:0 0 150px;height:200px;margin-top:-50px}.ss-info .half canvas{width:150px;height:225px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.4))}' +
    '.ss-info .tx{flex:1;font-size:15px;line-height:1.6;overflow:hidden}.ss-info h3{margin:0;font-size:22px}.ss-info h3 small{font-size:14px;color:#6a5030;font-weight:normal;margin-left:8px}' +
    '.ss-info .meta{color:#6a5030;font-size:14px;margin:2px 0 6px}.ss-info .bt{flex:0 0 190px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px}.ss-info .bt .btn{white-space:nowrap}';
  var cssOn = false;
  function css() { if (cssOn) return; cssOn = true; var el = document.createElement('style'); el.id = 'ss-css'; el.textContent = CSS; document.head.appendChild(el); }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  /** 땅 칸마다 나라 — 가장 가까운 씨앗(도시 + 씨앗 점)의 나라. 6도 넘게 멀면 빈 땅 */
  function nationGrid(pg, step) {
    var cols = Math.ceil(W / step), rows = Math.ceil(H / step), g = new Int8Array(cols * rows).fill(-1), keys = ['x'].concat(Object.keys(NATIONS));
    var seeds = [], k, m = 8;
    function add(lon, lat, key) { if (lon > pg.lon0 - m && lon < pg.lon1 + m && lat > pg.lat0 - m && lat < pg.lat1 + m) seeds.push([lon, lat, keys.indexOf(key)]); }
    (G.CITY_DATA || []).forEach(function (c) { if (c && typeof c.lon === 'number') add(c.lon, c.lat, natOf(c)); });
    for (k in NATIONS) NATIONS[k].seeds.forEach(function (s) { add(s[0], s[1], k); });
    OTHER.forEach(function (s) { add(s[0], s[1], 'x'); });
    var R2 = 36, isLand = G.Geo && G.Geo.isLand;
    for (var y = 0; y < rows; y++) {
      var lat = pg.lat1 - (y + 0.5) * step / H * (pg.lat1 - pg.lat0), cl = Math.cos(lat * Math.PI / 180), cl2 = cl * cl;
      for (var x = 0; x < cols; x++) {
        var lon = pg.lon0 + (x + 0.5) * step / W * (pg.lon1 - pg.lon0);
        if (!isLand || !isLand(lon, lat)) continue;
        var best = R2, bk = 0;
        for (var i = 0; i < seeds.length; i++) { var s = seeds[i], dx = s[0] - lon, dy = s[1] - lat, d = dx * dx * cl2 + dy * dy; if (d < best) { best = d; bk = s[2]; } }
        g[y * cols + x] = bk;
      }
    }
    return { g: g, cols: cols, rows: rows, keys: keys, step: step };
  }

  var cached = {};
  /** 지도 그림 한 장 (한 번 그려 두고 다시 쓴다) */
  SL.mapCanvas = function (pid) {
    var pg = pageOf(pid || 'eu');
    if (cached[pg.id]) return cached[pg.id];
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d'), r = rng(pg.id === 'eu' ? 1480 : 1592), step = 2, x, y, i;
    var sea = ctx.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, '#173f8c'); sea.addColorStop(1, '#1d5aae');
    ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
    for (i = 0; i < 1500; i++) { // 물결무늬
      x = r() * W; y = r() * H; var len = 6 + r() * 16;
      ctx.strokeStyle = 'rgba(' + (120 + r() * 80 | 0) + ',' + (170 + r() * 60 | 0) + ',255,' + (0.12 + r() * 0.25) + ')'; ctx.lineWidth = 1 + r();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y - 2 - r() * 3, x + len, y); ctx.stroke();
    }
    var ng = nationGrid(pg, step), cols = ng.cols, rows = ng.rows, gr = ng.g, keys = ng.keys;
    var land = document.createElement('canvas'); land.width = W; land.height = H;
    var lc = land.getContext('2d'), rgb = keys.map(function (k) { return k === 'x' ? null : hex(NATIONS[k].color); });
    var BASE = [[185, 143, 85], [201, 160, 102], [216, 183, 124], [223, 194, 140]];
    for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
      var n = gr[y * cols + x]; if (n < 0) continue;
      var v = r(), b = BASE[v < 0.08 ? 0 : v < 0.2 ? 1 : v < 0.5 ? 2 : 3], c = rgb[n];
      if (c) { var t = 0.72; b = [b[0] * (1 - t) + c[0] * t | 0, b[1] * (1 - t) + c[1] * t | 0, b[2] * (1 - t) + c[2] * t | 0]; }
      lc.fillStyle = 'rgb(' + b[0] + ',' + b[1] + ',' + b[2] + ')'; lc.fillRect(x * step, y * step, step, step);
    }
    // 그림자(바다 쪽으로 어둡게) → 땅
    ctx.save(); ctx.globalAlpha = 0.55; ctx.filter = 'brightness(0)'; ctx.drawImage(land, 4, 5); ctx.restore();
    ctx.drawImage(land, 0, 0);
    // 땅의 결 (잔줄)
    var mask = document.createElement('canvas'); mask.width = W; mask.height = H; var mc = mask.getContext('2d'); mc.drawImage(land, 0, 0);
    mc.globalCompositeOperation = 'source-in'; mc.strokeStyle = 'rgba(120,80,30,.2)'; mc.lineWidth = 1;
    for (i = 0; i < 900; i++) { x = r() * W; y = r() * H; mc.beginPath(); mc.moveTo(x, y); mc.lineTo(x + 4 + r() * 10, y + (r() - 0.5) * 3); mc.stroke(); }
    ctx.drawImage(mask, 0, 0);
    // 국경 — 칠한 나라와 다른 땅이 맞닿는 곳에 굵은 갈색 줄
    ctx.fillStyle = 'rgba(48,22,8,.85)';
    for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
      var a = gr[y * cols + x]; if (a < 0) continue;
      var rt = x + 1 < cols ? gr[y * cols + x + 1] : -1, dn = y + 1 < rows ? gr[(y + 1) * cols + x] : -1;
      if (rt >= 0 && rt !== a && (a > 0 || rt > 0)) ctx.fillRect((x + 1) * step - 1, y * step, 2, step);
      if (dn >= 0 && dn !== a && (a > 0 || dn > 0)) ctx.fillRect(x * step, (y + 1) * step - 1, step, 2);
    }
    // 나라 이름 — 나라마다 가장 큰 덩어리의 가운데에
    var seen = new Uint8Array(cols * rows), comps = {};
    for (i = 0; i < gr.length; i++) {
      if (gr[i] <= 0 || seen[i]) continue;
      var key = gr[i], st = [i], cells = 0, sx = 0, sy = 0, pts = []; seen[i] = 1;
      while (st.length) { var q = st.pop(), qx = q % cols, qy = (q - qx) / cols; cells++; sx += qx; sy += qy; pts.push(q);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var nx = qx + d[0], ny = qy + d[1]; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return; var j = ny * cols + nx; if (!seen[j] && gr[j] === key) { seen[j] = 1; st.push(j); } }); }
      if (!comps[key] || comps[key].cells < cells) comps[key] = { cells: cells, cx: sx / cells, cy: sy / cells, pts: pts };
    }
    Object.keys(comps).forEach(function (kk) {
      var cp = comps[kk], NN = NATIONS[keys[kk]], nm = NN.name, bx = cp.cx, by = cp.cy, bd = 1e9;
      // 가운데가 바다면 덩어리 안에서 가장 가까운 칸으로
      cp.pts.forEach(function (q) { var qx = q % cols, qy = (q - qx) / cols, d = (qx - cp.cx) * (qx - cp.cx) + (qy - cp.cy) * (qy - cp.cy); if (d < bd) { bd = d; bx = qx; by = qy; } });
      if (NN.lab) { var lp = px(pg, NN.lab[0], NN.lab[1]); bx = lp[0] / step; by = lp[1] / step; } // 이름 자리를 정해 둔 나라
      var fs = Math.max(15, Math.min(30, Math.sqrt(cp.cells) * step * 0.3)), X = bx * step, Y = by * step + fs * 0.35;
      ctx.save(); ctx.font = '700 ' + fs + 'px "Nanum Myeongjo","Noto Serif KR",serif'; ctx.textAlign = 'center';
      ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(250,238,205,.92)'; ctx.strokeText(nm, X, Y);
      ctx.fillStyle = '#2a1406'; ctx.fillText(nm, X, Y); ctx.restore();
      SL._labels = SL._labels || {}; SL._labels[pg.id + ':' + nm] = [Math.round(X), Math.round(Y), cp.cells];
    });
    // 바다 이름
    ctx.font = 'italic 18px "Nanum Myeongjo",serif'; ctx.fillStyle = 'rgba(210,230,255,.62)'; ctx.textAlign = 'center';
    pg.seas.forEach(function (s) { var p = px(pg, s[1], s[2]); ctx.fillText(s[0], p[0], p[1]); });
    // 둘레의 어두운 가장자리
    var vg = ctx.createRadialGradient(W / 2, H / 2, H / 2.4, W / 2, H / 2, W / 1.6); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,20,.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    cached[pg.id] = cv; return cv;
  };

  function list() { return G.STORY_MODES.filter(function (m) { try { return m.ok(); } catch (e) { return false; } }); }
  SL.list = list;
  /** 이야기 고르기 창 */
  SL.open = async function () {
    await G.State.ready;
    try { await G.Game.ensureGeo(); } catch (e) { /* 지도 없이도 */ }
    css();
    var all = list(); if (!all.length) return;
    // 이야기가 있는 지도만, 지도 차례대로
    var pages = PAGES.filter(function (pg) { return all.some(function (m) { return modePage(m) === pg.id; }); });
    var modes = []; pages.forEach(function (pg) { all.forEach(function (m) { if (modePage(m) === pg.id) modes.push(m); }); });
    var html = '<div class="ss-stage"><div class="ss-strip"></div><div class="ss-frame"></div><div class="ss-hint">초상을 누르면 이야기를 볼 수 있습니다 · ← → 고르기' + (pages.length > 1 ? ' (끝에서 옆 바다로)' : '') + ' · Enter 열기</div></div>';
    var sel = 0, cur = 0, picked = null, info = null;
    var win = UI.window({ title: '이야기 모드 — 주인공을 고른다', icon: 'scroll', width: 1230, parch: false, html: html, clickAny: false,
      onKey: function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { pick((sel + 1) % modes.length); return true; }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { pick((sel + modes.length - 1) % modes.length); return true; }
        if (e.key === 'PageDown') { goPage(cur + 1); return true; }
        if (e.key === 'PageUp') { goPage(cur - 1); return true; }
        if (e.key === 'Enter') { if (info) { start(); } else show(sel); return true; }
        return false;
      },
      buttons: [{ label: '타이틀로', value: null }] });
    var stage = win.content.querySelector('.ss-stage'), strip = stage.querySelector('.ss-strip');
    strip.style.width = (W * pages.length) + 'px';
    ['❦', '❦', '❦', '❦'].forEach(function (g, i) { var c = U.el('div', 'ss-corner', g); c.style[i < 2 ? 'top' : 'bottom'] = '6px'; c.style[i % 2 ? 'right' : 'left'] = '8px'; if (i % 2) c.style.transform = 'scaleX(-1)'; stage.appendChild(c); });
    var pageEls = pages.map(function (pg, k) {
      var el = U.el('div', 'ss-page'); el.style.left = (k * W) + 'px'; el.dataset.page = pg.id;
      el.appendChild(cvClass(SL.mapCanvas(pg.id)));
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', W); svg.setAttribute('height', H); el.appendChild(svg);
      el.appendChild(U.el('div', 'ss-banner', U.esc(pg.banner)));
      strip.appendChild(el); return { el: el, svg: svg };
    });
    var cards = modes.map(function (m, i) {
      var k = pages.findIndex(function (pg) { return pg.id === modePage(m); }), pg = pages[k], pe = pageEls[k];
      var c = G.CITY_DATA[m.city], p = px(pg, c.lon, c.lat), cx = Math.max(24, Math.min(W - 196, p[0] + m.dx)), cy = Math.max(56, Math.min(H - 170, p[1] + m.dy));
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('d', 'M' + p[0] + ',' + p[1] + ' L' + (cx + 62) + ',' + (cy + 70)); line.setAttribute('stroke', '#f1d98f'); line.setAttribute('stroke-width', '2'); line.setAttribute('stroke-dasharray', '5 3'); line.setAttribute('fill', 'none'); line.setAttribute('opacity', '.9');
      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('cx', p[0]); dot.setAttribute('cy', p[1]); dot.setAttribute('r', 5); dot.setAttribute('fill', '#a3221a'); dot.setAttribute('stroke', '#f1d98f'); dot.setAttribute('stroke-width', '2');
      pe.svg.appendChild(line); pe.svg.appendChild(dot);
      var card = U.el('div', 'ss-card'); card.style.left = cx + 'px'; card.style.top = cy + 'px'; card.style.background = m.bg; card.dataset.page = pg.id;
      card.title = m.hero + ' — 「' + m.title + '」';
      var face = G.Img.make([m.face], 102, 116, function () { var x = document.createElement('canvas'); x.width = 102; x.height = 116; var g = x.getContext('2d'); g.fillStyle = m.bg; g.fillRect(0, 0, 102, 116); g.fillStyle = '#f3dfae'; g.font = '40px serif'; g.textAlign = 'center'; g.fillText(m.hero.charAt(0), 51, 72); return x; }, { fit: 'cover', fx: 0.5, fy: 0.35 });
      card.appendChild(face); card.appendChild(U.el('div', 'nm', U.esc(m.hero)));
      card.onmouseenter = function () { focus(i); };
      card.onclick = function () { show(i); };
      pe.el.appendChild(card);
      return card;
    });
    // 옆 화살표 — 오른쪽(동쪽 바다로) · 왼쪽(유럽으로)
    var arR = U.el('div', 'ss-arrow r'), arL = U.el('div', 'ss-arrow l');
    arR.onclick = function () { goPage(cur + 1); }; arL.onclick = function () { goPage(cur - 1); };
    stage.appendChild(arR); stage.appendChild(arL);
    function cvClass(cv) { var c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.className = 'ss-map'; c.getContext('2d').drawImage(cv, 0, 0); return c; }
    function setPage(k) {
      cur = Math.max(0, Math.min(pages.length - 1, k));
      strip.style.transform = 'translateX(' + (-cur * W) + 'px)';
      var nx = pages[cur + 1], pv = pages[cur - 1];
      arR.classList.toggle('off', !nx); arL.classList.toggle('off', !pv);
      if (nx) arR.innerHTML = '<b>▶</b><span>' + U.esc(nx.short) + '</span>';
      if (pv) arL.innerHTML = '<b>◀</b><span>' + U.esc(pv.short) + '</span>';
      stage.dataset.page = pages[cur].id;
    }
    function focus(i) { sel = i; cards.forEach(function (c, k) { c.classList.toggle('on', k === i); }); }
    /** 키로 고르기 — 다른 지도의 주인공이면 그쪽으로 민다. 소개가 열려 있으면 소개도 바꾼다 */
    function pick(i) {
      var k = pages.findIndex(function (pg) { return pg.id === modePage(modes[i]); });
      if (k !== cur) { closeInfo(); setPage(k); }
      if (info) show(i); else focus(i);
    }
    function closeInfo() { if (info) { info.remove(); info = null; } stage.classList.remove('inf'); }
    function goPage(k) {
      if (k < 0 || k >= pages.length || k === cur) return;
      closeInfo();
      setPage(k);
      var first = modes.findIndex(function (m) { return modePage(m) === pages[k].id; }); if (first >= 0) focus(first);
    }
    function show(i) {
      focus(i); var m = modes[i];
      if (info) info.remove();
      info = U.el('div', 'ss-info');
      info.innerHTML = '<div class="half"></div><div class="tx"><h3>「' + U.esc(m.title) + '」' + (m.sub ? '<small>— ' + U.esc(m.sub) + '</small>' : '') + '</h3>' +
        '<div class="meta">' + U.esc(m.hero) + ' · ' + U.esc(m.year) + ' · ' + U.esc(m.tag) + '</div>' + U.esc(m.synopsis) +
        '<div class="meta" style="margin-top:6px">함께 떠나는 사람 — ' + U.esc(m.party) + '</div></div>' +
        '<div class="bt"><button class="btn navy ss-go">' + G.icon('sail') + '이 이야기로 시작</button><button class="btn ss-back">다른 사람을 고른다</button></div>';
      var hc = G.Img.make([m.half, m.face], 150, 225, function () { var x = document.createElement('canvas'); x.width = 150; x.height = 225; return x; }, { fit: 'contain' });
      info.querySelector('.half').appendChild(hc);
      info.querySelector('.ss-go').onclick = start;
      info.querySelector('.ss-back').onclick = closeInfo;
      stage.appendChild(info); stage.classList.add('inf');
    }
    function start() { picked = modes[sel]; win.close('go'); }
    SL._go = goPage; // 시험용
    setPage(0); focus(0);
    var v = await win.result;
    if (v === 'go' && picked) await SL.begin(picked);
  };
})(window.G = window.G || {});
