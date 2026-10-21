/* 기함 선실 화면 (G.CabinView) — 배를 옆에서 자른 그림(images/ships) 위 갑판·돛대에 고정 자리의 얼굴표를 세우고,
   선체 속 칸마다 선실 표를, 그 아래에 방 그림(images/cabins) 카드를 늘어놓는다. 방(표·카드)을 누르거나 부하를 끌어다 놓아
   배치하고(어디서나), 조선소에서는 방을 고친다. 오른쪽은 부하 명단과 힘을 내는 방.
   규칙은 js/systems/cabins.js, 방의 종류는 js/data/cabins.js, 크기 조정값은 G.FX.cabinView (js/data/seafx.js).
   그림이 없거나 받기 전이면 같은 자리표에 맞춘 코드 그림으로 보인다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, CV = {};
  G.CabinView = CV;
  function S() { return G.Game.state; }
  function CB() { return G.Cabins; }
  var L_DEF = { stageW: 920, stageH: 314, side: 300, pin: 38, pinMin: 24, medal: 54, pad: 70, minSpan: 560, below: 40, cardMax: 180, rosterH: 280 };
  function L() { var f = G.FX && G.FX.cabinView; return f && f.stageW ? f : L_DEF; }
  var ROLE_OF = { adjutant: 'first', helm: 'nav', lookout: 'surveyor' };

  /** manifest에 있는 그림을 DOM에 얹는다. 아티팩트판의 빈 자리표도 G.Img가 묶음을 받으면 같은 img를 바꿔 준다. */
  function artImage(key, cls, alt) {
    if (!G.Img || !G.Img.has(key)) return null;
    var im = U.el('img', cls);
    im.alt = alt || '';
    im.decoding = 'async';
    im.src = G.Img.src(key);
    return im;
  }

  /* 배 그림(images/ships/<배 ID>.webp, 880×480) 속 자리 — 그림의 픽셀 좌표로 잰 값.
     hull: 단면으로 열린 선실 칸들이 차지한 네모 [왼쪽, 위, 오른쪽, 아래] (선실 표시가 여기에 놓인다)
     deck: 윗갑판 높이 · mast: 파수대를 둘 큰 돛대 꼭대기 [x, y] · stern: 고물 누각 위(함장실) [x, y]
     모든 배가 왼쪽이 뱃머리, 오른쪽이 고물이다. 그림을 새로 그리면 여기 값만 다시 재면 된다.
     (SPOT 2026-10-09: 액자처럼 둘러진 흐린 테두리를 걷어 낸 그림에 맞춰 옮김 — tools/ship_unframe/) */
  var SPOT = {
    atakebune: { hull: [65, 307, 863, 407], deck: 299, mast: [370, 24], stern: [837, 261] },
    baghlah: { hull: [245, 312, 725, 383], deck: 300, mast: [430, 40], stern: [700, 222] },
    balsa: { hull: [39, 359, 779, 405], deck: 351, mast: [437, 24], stern: [597, 300] },
    baochuan: { hull: [12, 306, 869, 397], deck: 294, mast: [372, 6], stern: [818, 195] },
    barca: { hull: [190, 355, 730, 420], deck: 345, mast: [425, 60], stern: [720, 330] },
    caravel: { hull: [159, 372, 761, 458], deck: 360, mast: [325, 22], stern: [724, 342] },
    carrack: { hull: [149, 318, 798, 402], deck: 305, mast: [474, 91], stern: [766, 272] },
    cog: { hull: [110, 355, 785, 440], deck: 342, mast: [415, 24], stern: [740, 290] },
    dhow: { hull: [147, 372, 761, 458], deck: 354, mast: [288, 22], stern: [785, 323] },
    fluyt: { hull: [156, 357, 792, 428], deck: 344, mast: [474, 84], stern: [792, 298] },
    frigate: { hull: [176, 326, 827, 380], deck: 315, mast: [409, 82], stern: [816, 305] },
    fusta: { hull: [156, 419, 842, 458], deck: 406, mast: [318, 24], stern: [829, 386] },
    galleass: { hull: [65, 367, 857, 439], deck: 361, mast: [363, 23], stern: [831, 324] },
    galleon: { hull: [182, 344, 831, 422], deck: 331, mast: [402, 52], stern: [857, 272] },
    galley: { hull: [94, 303, 868, 346], deck: 293, mast: [305, 0], stern: [821, 287] },
    geobukseon: { hull: [91, 349, 870, 440], deck: 316, mast: [292, 24], stern: [831, 349] },
    greatgalley: { hull: [59, 328, 868, 381], deck: 319, mast: [352, 0], stern: [833, 267] },
    hcarrack: { hull: [156, 311, 779, 402], deck: 298, mast: [409, 52], stern: [766, 246] },
    hulk: { hull: [130, 352, 814, 458], deck: 339, mast: [335, 22], stern: [789, 284] },
    jong: { hull: [160, 300, 730, 370], deck: 290, mast: [375, 30], stern: [740, 220] },
    junk: { hull: [98, 372, 834, 458], deck: 354, mast: [288, 22], stern: [797, 304] },
    kobaya: { hull: [47, 323, 869, 370], deck: 311, mast: [399, 12], stern: [863, 299] },
    korakora: { hull: [64, 317, 815, 352], deck: 305, mast: [299, 41], stern: [827, 299] },
    lcaravel: { hull: [200, 320, 720, 385], deck: 310, mast: [450, 50], stern: [710, 285] },
    lcarrack: { hull: [149, 350, 766, 428], deck: 337, mast: [383, 52], stern: [753, 292] },
    lgalleon: { hull: [156, 331, 831, 428], deck: 318, mast: [415, 71], stern: [831, 253] },
    ljunk: { hull: [116, 315, 811, 402], deck: 305, mast: [436, 22], stern: [821, 245] },
    maengseon: { hull: [39, 367, 844, 452], deck: 354, mast: [292, 23], stern: [844, 328] },
    panokseon: { hull: [24, 293, 868, 381], deck: 270, mast: [270, 0], stern: [845, 264] },
    parau: { hull: [118, 346, 869, 393], deck: 334, mast: [440, 59], stern: [845, 328] },
    pinnace: { hull: [126, 388, 819, 457], deck: 375, mast: [334, 23], stern: [807, 338] },
    sambuk: { hull: [92, 386, 803, 457], deck: 373, mast: [350, 24], stern: [777, 347] },
    sekibune: { hull: [47, 311, 868, 358], deck: 282, mast: [437, 0], stern: [821, 235] },
    shachuan: { hull: [83, 340, 869, 416], deck: 323, mast: [341, 0], stern: [822, 276] },
    tartane: { hull: [230, 355, 720, 415], deck: 340, mast: [490, 50], stern: [720, 330] },
    xebec: { hull: [143, 344, 870, 409], deck: 331, mast: [279, 45], stern: [857, 331] }
  };
  var SPOT_DEF = { hull: [200, 315, 720, 380], deck: 305, mast: [420, 60], stern: [720, 270] };
  CV.SPOT = SPOT;

  /** 배 그림의 어느 부분을 무대에 보일지: 선체가 무대 가로를 채우도록 키우고, 선체 아래 물결이 조금 보이게 자른다 */
  function view(sp) {
    var l = L(), W = l.stageW, H = l.stageH, h = sp.hull;
    var span = U.clamp(h[2] - h[0] + (l.pad || 150), l.minSpan || 640, 880);
    var s = W / span, x0 = U.clamp((h[0] + h[2]) / 2 - span / 2, 0, 880 - span);
    var hs = H / s, y0 = U.clamp(h[3] + (l.below || 46) - hs, 0, Math.max(0, 480 - hs));
    return { s: s, x0: x0, y0: y0, X: function (x) { return Math.round((x - x0) * s); }, Y: function (y) { return Math.round((y - y0) * s); } };
  }

  /** 그림이 없거나 받기 전: 같은 자리표(SPOT_DEF)에 맞춘 단순한 배 */
  function drawFallback(cv, v, sp) {
    var l = L(), W = l.stageW, H = l.stageH, g = cv.getContext('2d'), h = sp.hull;
    cv.width = W; cv.height = H;
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#9fb9c4'); sky.addColorStop(0.6, '#e1d6b4'); sky.addColorStop(1, '#d9c79c');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    var water = v.Y(h[3] - 18);
    g.fillStyle = '#5f8b98'; g.fillRect(0, water, W, H - water);
    var bow = v.X(h[0] - 70), stern = v.X(h[2] + 30), top = v.Y(sp.deck), bot = v.Y(h[3] + 8);
    // 돛대와 돛
    [[sp.mast[0], sp.mast[1], 1], [h[0] + (h[2] - h[0]) * 0.2, sp.mast[1] + 50, 0.75], [h[0] + (h[2] - h[0]) * 0.82, sp.mast[1] + 70, 0.6]].forEach(function (m) {
      var x = v.X(m[0]), y = Math.max(6, v.Y(m[1]));
      g.fillStyle = '#5b4026'; g.fillRect(x - 4, y, 8, top - y);
      var w = 150 * m[2] * v.s, sh = (top - y) * 0.72;
      g.fillStyle = 'rgba(248,240,220,.86)'; g.strokeStyle = 'rgba(90,65,35,.55)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x - w / 2, y + 14); g.lineTo(x + w / 2, y + 14); g.quadraticCurveTo(x + w / 2 + 12, y + 14 + sh / 2, x + w / 2, y + 14 + sh); g.lineTo(x - w / 2, y + 14 + sh); g.closePath(); g.fill(); g.stroke();
    });
    // 선체와 열린 칸
    var wood = g.createLinearGradient(0, top, 0, bot);
    wood.addColorStop(0, '#8a6238'); wood.addColorStop(1, '#4e3520');
    g.fillStyle = wood; g.strokeStyle = '#3b2715'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(bow, top - 10); g.lineTo(stern, v.Y(sp.stern[1])); g.lineTo(stern - 12, bot - 20);
    g.quadraticCurveTo(stern - 40, bot, v.X(h[2] - 40), bot); g.lineTo(v.X(h[0] + 30), bot); g.quadraticCurveTo(bow + 30, bot - 10, bow, top - 10);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(30,18,10,.55)'; g.fillRect(v.X(h[0]), v.Y(h[1]), v.X(h[2]) - v.X(h[0]), v.Y(h[3]) - v.Y(h[1]));
    g.strokeStyle = 'rgba(199,139,64,.5)'; g.lineWidth = 2;
    for (var x = v.X(h[0]); x <= v.X(h[2]); x += 46) { g.beginPath(); g.moveTo(x, v.Y(h[1])); g.lineTo(x, v.Y(h[3])); g.stroke(); }
  }

  /** 배 그림을 무대에 얹는다. 읽기 전·실패 때에는 아래 canvas 그림이 그대로 보인다. */
  function placeShipArt(stage, sh, v) {
    var key = 'ships/' + sh.type, im = artImage(key, 'cb-ship-art', G.SHIP[sh.type].name);
    if (!im) return;
    im.style.left = -Math.round(v.x0 * v.s) + 'px'; im.style.top = -Math.round(v.y0 * v.s) + 'px';
    im.style.width = Math.round(880 * v.s) + 'px'; im.style.height = Math.round(480 * v.s) + 'px';
    var ready = function () { if (im.naturalWidth > 1) stage.classList.add('art-ready'); };
    im.onload = ready;
    stage.insertBefore(im, stage.querySelector('.cb-stage-shade'));
    if (im.complete) ready();
    G.Img.want(key);
  }

  /** 선실 칸의 자리: 화면 아래 선실 카드와 같은 줄·칸 짜임(G.Cabins.cols — 맞닿은 방 판정과 같다)을 선체 안에 줄인다 */
  function pinSpots(v, sp, n) {
    var l = L(), h = sp.hull, per = CB().cols(), rows = Math.max(1, Math.ceil(n / per));
    var x0 = v.X(h[0]) + 4, x1 = v.X(h[2]) - 4, y0 = v.Y(h[1]) + 2, y1 = v.Y(h[3]) - 2;
    var min = l.pinMin || 22;
    if (rows > 1 && (y1 - y0) / rows < min + 6) {      // 낮고 긴 선체(갤리 등): 줄을 줄여 한 줄에 더 늘어놓는다
      while (rows > 1 && (y1 - y0) / rows < min + 6) rows--;
      per = Math.ceil(n / rows);
    }
    var cols = Math.min(per, Math.max(1, n)), cw = (x1 - x0) / cols, ch = (y1 - y0) / rows;
    var size = Math.round(U.clamp(Math.min(ch - 4, cw - 8), min, l.pin || 36));
    var out = [];
    for (var k = 0; k < n; k++) {
      var r = Math.floor(k / per), c = k % per;
      out.push([Math.round(x0 + cw * (c + 0.5)), Math.round(y0 + ch * (r + 0.5)), size]);
    }
    return out;
  }

  /** 고정 자리(함장실·부관실·조타실·갑판·파수대)의 둥근 표 자리 — [가운데 x, 얼굴 가운데 y]. 고물에서 뱃머리 쪽으로 함장실·부관실·조타실·갑판 */
  function medalSpots(v, sp) {
    var l = L(), W = l.stageW, r = (l.medal || 54) / 2, gap = (l.medal || 54) + 40, h = sp.hull;
    var lift = r + 26;                                    // 얼굴 아래 이름표까지 갑판 위에 선다
    var cx = Math.min(W - 52, v.X(sp.stern[0]) - 8), cy = Math.max(r + 6, v.Y(sp.stern[1]) - lift);
    var deckY = Math.max(r + 6, v.Y(sp.deck) - lift);
    var adj = [cx - gap, deckY], helm = [cx - gap * 2, deckY];
    var aft = [[cx, cy], adj, helm];
    var clash = function (p, list) { return list.some(function (q) { return Math.abs(p[0] - q[0]) < gap - 4 && Math.abs(p[1] - q[1]) < r * 2 + 44; }); };
    var settle = function (p, list) {           // 겹치면 뱃머리 쪽, 그다음 고물 쪽으로 한 칸씩 비킨다
      for (var k = 0; k < 8; k++) {
        var tries = [p[0] - gap * k, p[0] + gap * k];
        for (var j = 0; j < 2; j++) { var q = [tries[j], p[1]]; if (q[0] >= 52 && q[0] <= W - 52 && !clash(q, list)) return q; }
      }
      return p;
    };
    var look = settle([U.clamp(v.X(sp.mast[0]), 52, W - 52), Math.max(r + 8, v.Y(sp.mast[1]) + r)], aft);
    var deck = settle([U.clamp(Math.min(helm[0] - gap, v.X(h[0] + (h[2] - h[0]) * 0.3)), 52, W - 52), deckY], aft.concat([look]));
    return { captain: aft[0], adjutant: adj, helm: helm, deck: deck, lookout: look };
  }

  function skillNote(m, c) {
    var R = G.R, ks = c.skills || G.ROLE_SKILLS[c.role] || [], best = null, lv = 0;
    ks.forEach(function (k) { var v = R.mateSkill(m, k); if (v > lv) { lv = v; best = k; } });
    return best ? G.SKILL_BY_ID[best].name + ' ' + lv : c.lang ? langNote(m) : ks.length ? '특기 없음' : '';   // 통역실: 옮겨 주는 말 (2026-10-20)
  }
  function loyalTag(m) {
    var lo = m.loyal == null ? 70 : m.loyal, e = CB().eff(m);
    return '<span class="cb-loyal' + (e < 1 ? ' low' : '') + '">충성 ' + Math.round(lo) + (e < 1 ? ' · 효율 ' + Math.round(e * 100) + '%' : '') + '</span>';
  }
  function face(id, size) { try { return G.Art.portraitCanvas(G.Scenes.mateSpec(id), size); } catch (e) { return U.el('span'); } }

  /* 2026-10-17 추천 인물 · 특기와 능력치 ------------------------------------------------ */
  var ST_NAME = ['체력', '지력', '무력', '매력'], ST_SHORT = ['체', '지', '무', '매'];
  /** 부하의 특기 (배에서 늘린 것·다친 동안 줄어든 것까지 — G.R.mateSkill) */
  function skillsOf(m) {
    var out = [];
    (G.SKILLS || []).forEach(function (sk) { var v = G.R.mateSkill(m, sk.id); if (v > 0) out.push(sk.name + ' ' + v); });
    return out.length ? out.join(' · ') : '특기 없음';
  }
  /** 능력치 네 가지 (short: 「체62 지71 …」) */
  function statsOf(m, short) {
    var st = (G.MATE[m.id] && G.MATE[m.id].st) || [];
    return (short ? ST_SHORT : ST_NAME).map(function (n, k) { return n + (short ? '' : ' ') + (st[k] == null ? '—' : st[k]); }).join(short ? ' ' : ' · ');
  }
  function langCount() { var L = G.LANGS || []; return L.length || Object.keys(L).length; }
  /** 통역실: 제독보다 잘하는 말 — 「아랍어 3 · 페르시아어 2(제독 1)」 (숫자는 그 사람의 말 단계, 괄호는 제독의 단계) */
  function langGains(m) {
    var p = S().player, out = [];
    for (var li = 0; li < langCount(); li++) {
      var a = CB().mateLang(m, li), b = (p.lg && p.lg[li]) || 0;
      if (a > b) out.push(G.LANGS[li] + ' ' + a + (b ? '(제독 ' + b + ')' : ''));
    }
    return out;
  }
  /** full이면 모두, 아니면 둘까지 보이고 나머지는 「외 n가지」 */
  function langCountNote(m) { var n = langGains(m).length; return n ? '제독이 모르는 말 ' + n + '가지' : '더할 말 없음'; }
  function langNote(m, full) {
    var g = langGains(m);
    if (!g.length) return '더할 말 없음';
    return '통역 ' + (full || g.length <= 2 ? g.join(' · ') : g.slice(0, 2).join(' · ') + ' 외 ' + (g.length - 2) + '가지');
  }
  /** 이 방에 얼마나 맞는가: 방의 특기 가운데 가장 높은 단계(+ 나머지 조금) × 충성 효율. 통역실은 제독보다 잘하는 말의 단계 차 */
  function fitScore(m, c) {
    if (!G.MATE[m.id]) return 0;
    if (c.lang) {
      var p = S().player, n = 0;
      for (var li = 0; li < langCount(); li++) { var a = CB().mateLang(m, li), b = (p.lg && p.lg[li]) || 0; if (a > b) n += a - b; }
      return n * CB().eff(m);
    }
    var ks = c.skills || G.ROLE_SKILLS[c.role] || [], best = 0, sum = 0;
    ks.forEach(function (k) { var v = G.R.mateSkill(m, k); best = Math.max(best, v); sum += v; });
    return best ? (best + (sum - best) * 0.1) * CB().eff(m) : 0;
  }
  /** 이 방에 맞는 순서로 늘어선 부하들. 같으면 자리 없는 사람 먼저, 다른 배 선장은 나중 */
  function recommend(c) {
    return S().mates.filter(function (m) { return G.MATE[m.id]; }).map(function (m, k) {
      var idle = (!m.role || m.role === 'none') && m.room == null;
      return { m: m, k: k, score: fitScore(m, c), pref: (idle ? 1 : 0) - (m.role === 'captain' ? 1 : 0) };
    }).sort(function (a, b) { return (b.score - a.score) || (b.pref - a.pref) || (a.k - b.k); });
  }
  /** 추천 순위 (맞는 특기가 있는 사람 가운데 세 명까지) {부하 id: 1~3} */
  function recRanks(c) { var r = {}; recommend(c).filter(function (o) { return o.score > 0; }).slice(0, 3).forEach(function (o, k) { r[o.m.id] = k + 1; }); return r; }
  function recTag(rank) { return rank === 1 ? ' <span class="tag cb-rec">★ 추천</span>' : rank ? ' <span class="tag">추천 ' + rank + '</span>' : ''; }
  function fitNote(m, c) { return c.lang ? langNote(m) : skillNote(m, c); }
  /** 방을 눌렀을 때 보여 줄 추천 한 줄 */
  function recLine(c) {
    var top = recommend(c).filter(function (o) { return o.score > 0; }).slice(0, 3);
    if (!top.length) return '<br><span class="muted">추천: 이 방에 맞는 ' + (c.lang ? '말(제독이 모르는 말)' : '특기') + '을 가진 부하가 없습니다.</span>';
    return '<br>★ <b>추천</b> ' + top.map(function (o, k) {
      var nm = U.esc(G.MATE[o.m.id].name);
      return (k ? nm : '<b>' + nm + '</b>') + ' <span class="muted">(' + fitNote(o.m, c) + ' · ' + U.esc(CB().placeName(o.m)) + ')</span>';
    }).join(' · ');
  }
  function recShort(c) { var t = recommend(c)[0]; return t && t.score > 0 ? '★ 추천 ' + G.MATE[t.m.id].name + ' (' + fitNote(t.m, c) + ')' : ''; }
  /** 이 부하가 이 방에 가장 잘 맞는 사람인가 (부하의 자리 고르기 목록) */
  function fitTag(m, c) { var t = recommend(c)[0]; return t && t.m === m && t.score > 0 ? ' <span class="tag cb-rec">★ 잘 맞음</span>' : ''; }

  function powTag(pow) { return pow > 0 ? '<i class="cb-pow" title="방의 힘 (1 + 특기 단계, 충성이 낮으면 줄어든다)">' + (Math.round(pow * 10) / 10) + '</i>' : ''; }
  function adminFace(size) {
    try { if (S().player.portrait) return G.Art.portraitCanvas(S().player.portrait, size); } catch (e) { /* 얼굴 그림이 없으면 왕관 */ }
    return U.el('span', 'cb-ico', G.icon('crown'));
  }
  function roomTitle(c) { return c.name + ' — ' + c.desc + (c.fx ? '\n사람을 두면: ' + c.fx : ''); }

  /** 갑판 위의 고정 자리: 둥근 얼굴표 + 이름표 */
  function medal(c, pos, m, o) {
    var l = L(), d = l.medal || 54;
    var el = U.el('div', 'cb-medal' + (m || o.admiral ? ' on' : ' empty') + (c.id === 'lookout' ? ' mast' : ''));
    el.style.left = pos[0] + 'px'; el.style.top = (pos[1] - d / 2) + 'px';
    el.title = roomTitle(c);
    var who = o.admiral ? U.esc(G.R.fullName ? G.R.fullName() : '제독') : m ? U.esc(G.MATE[m.id].name) : '비어 있음';
    el.innerHTML = '<div class="cb-ring" style="width:' + d + 'px;height:' + d + 'px"></div>' + powTag(o.pow) +
      '<div class="cb-plate"><b>' + G.icon(c.icon) + c.name + '</b><small>' + who + '</small></div>';
    var ring = el.querySelector('.cb-ring');
    if (o.admiral) ring.appendChild(adminFace(d));
    else if (m) ring.appendChild(face(m.id, d));
    else ring.innerHTML = G.icon(c.icon);
    return el;
  }

  /** 선체 안의 선실 표 (번호는 아래 카드와 같다) */
  function pin(c, i, spot, m) {
    var el = U.el('div', 'cb-pin' + (m ? ' on' : '') + (c.id === 'hold' ? ' hold' : ''));
    el.dataset.i = i;
    el.style.left = spot[0] + 'px'; el.style.top = spot[1] + 'px'; el.style.width = el.style.height = spot[2] + 'px';
    el.title = i + '. ' + roomTitle(c) + (m ? '\n— ' + G.MATE[m.id].name : '');
    if (m) el.appendChild(face(m.id, spot[2]));
    else el.innerHTML = G.icon(c.icon);
    el.appendChild(U.el('i', 'cb-no', String(i)));
    return el;
  }

  /** 아래쪽 선실 카드: 방 그림 · 이름 · 앉은 사람 */
  function card(c, i, m, o) {
    var el = U.el('div', 'cb-card' + (m ? ' on' : '') + (c.id === 'hold' ? ' hold' : ''));
    el.dataset.i = i;
    el.title = roomTitle(c);
    var h = '<div class="cb-h"><i class="cb-no">' + i + '</i>' + G.icon(c.icon) + '<b>' + c.name + '</b>' + powTag(o.pow) + '</div>';
    if (m) h += '<div class="cb-who"><span class="cb-face"></span><span class="cb-nm"><span class="n1">' + U.esc(G.MATE[m.id].name) + '</span><small>' + skillNote(m, c) + '</small></span></div>';
    else h += '<div class="cb-none">' + (c.id === 'hold' ? (o.yard ? '눌러서 쓰임을 정한다' : '조선소에서 고친다') : c.noStaff ? (o.storeLine || '짐칸') : '비어 있음') + '</div>';
    el.innerHTML = h;
    var art = artImage('cabins/' + c.id, 'cb-card-art', '') || (c.art ? artImage('cabins/' + c.art, 'cb-card-art', '') : null);   // 전용 그림이 없는 새 방은 비슷한 방 그림을 빌린다
    if (art) { el.classList.add('has-art'); el.insertBefore(art, el.firstChild); }
    if (m) el.querySelector('.cb-face').appendChild(face(m.id, 36));
    return el;
  }

  function mateOptions(c, cur) {
    var ranks = recRanks(c);
    var opts = recommend(c).map(function (o) {
      var m = o.m, d = G.MATE[m.id];
      return { label: d.name + recTag(ranks[m.id]) + (m === cur ? ' (지금 이 자리)' : '') +
          '<small class="muted cb-opt-sub" style="display:block;font-size:14px;line-height:1.35;margin-top:2px">특기 ' + U.esc(skillsOf(m)) + '<br>' + statsOf(m) + ' · 충성 ' + Math.round(m.loyal == null ? 70 : m.loyal) + (c.lang ? '<br><b>' + U.esc(langNote(m, true)) + '</b>' : '') + '</small>', right: (c.lang ? langCountNote(m) : fitNote(m, c)) + ' · ' + CB().placeName(m), value: m.id, icon: 'people', disabled: m === cur,
        desc: '특기 ' + skillsOf(m) + ' — ' + statsOf(m) + ' · 충성 ' + Math.round(m.loyal == null ? 70 : m.loyal) + (c.lang ? ' — ' + langNote(m, true) : '') };
    });
    if (cur) opts.push({ label: '자리를 비운다', value: '-', icon: 'boot' });
    return opts;
  }
  function mateById(id) { return S().mates.filter(function (m) { return m.id === id; })[0]; }
  function setRole(m, role) { var T = G.Scenes.city.B.tavern; if (m.room != null) CB().place(m, null); T.assign(m, role); }

  /** 방을 고른 뒤: 부하를 앉힌다 */
  async function pickFor(type, i) {
    var c = G.CABIN[type], role = ROLE_OF[type];
    var cur = role ? CB().roleMate(role) : CB().occupant(i);
    if (!S().mates.length) { UI.toast('배치할 부하가 없습니다. 술집에서 부하를 찾아보십시오.', 'people'); return; }
    var v = await UI.choose(c.name + '에 둘 사람', mateOptions(c, cur), { width: 720, icon: c.icon, text: c.desc + (c.fx ? '<br><span class="muted">사람을 두면: ' + c.fx + '</span>' : '') + (c.lang ? '<br><span class="muted">「통역」 뒤는 그 사람이 옮겨 주는 말과 말 단계(3이 가장 능숙) — 괄호는 제독의 단계</span>' : '') + recLine(c) });
    if (v == null) return;
    if (v === '-') { if (role) { cur.role = 'none'; } else CB().place(cur, null); return; }
    var m = mateById(v); if (!m) return;
    if (role) setRole(m, role); else CB().place(m, i);
  }
  /** 부하를 고른 뒤: 어느 방에 둘지 */
  async function pickRoom(m) {
    var rooms = CB().rooms(), d = G.MATE[m.id], opts = [];
    ['adjutant', 'helm', 'lookout'].forEach(function (t) {
      var c = G.CABIN[t], o = CB().roleMate(ROLE_OF[t]);
      opts.push({ label: c.name + fitTag(m, c), right: fitNote(m, c) + (o && o !== m ? ' · ' + G.MATE[o.id].name + '와 교대' : o === m ? ' · 지금 이 자리' : ''), value: 'r:' + t, icon: c.icon, desc: c.desc, disabled: o === m });
    });
    rooms.forEach(function (t, i) {
      if (t === 'hold' || CB().noStaff(t)) return;
      var c = G.CABIN[t], o = CB().occupant(i);
      opts.push({ label: c.name + fitTag(m, c), right: fitNote(m, c) + (o && o !== m ? ' · ' + G.MATE[o.id].name + ' 대신' : o === m ? ' · 지금 이 자리' : ''), value: 'c:' + i, icon: c.icon, desc: c.desc + (c.fx ? ' — ' + c.fx : ''), disabled: o === m });
    });
    if (m.room != null || ROLE_OF_INV(m.role)) opts.push({ label: '자리에서 뺀다 (대기)', value: '-', icon: 'boot' });
    var v = await UI.choose(d.name + '의 자리', opts, { width: 660, text: '<b>특기</b> ' + skillsOf(m) + '<br><b>능력</b> ' + statsOf(m) + ' — ' + loyalTag(m) });
    if (v == null) return;
    if (v === '-') { if (m.room != null) CB().place(m, null); if (ROLE_OF_INV(m.role)) m.role = 'none'; return; }
    if (v.indexOf('r:') === 0) setRole(m, ROLE_OF[v.slice(2)]); else CB().place(m, +v.slice(2));
  }
  function ROLE_OF_INV(role) { return role === 'first' || role === 'nav' || role === 'surveyor'; }

  /** 조선소: 선실 i를 다른 방으로 고친다 */
  async function remodel(i, c0) {
    var s = S(), rooms = CB().rooms(), now = rooms[i];
    var opts = G.CABINS.filter(function (c) { return !c.fixed; }).map(function (c) {
      var plus = c.id === 'store' ? (function () { var t = G.SHIP[CB().flagship().type], k = (G.BALANCE.cabins && G.BALANCE.cabins.store) || {}, sr = CB().storeRooms(); return sr.n >= (k.max != null ? k.max : 4) ? ' <small class="warn-text">이미 ' + sr.n + '칸 — 더는 늘지 않는다</small>' : ' <small class="muted">짐칸 +' + Math.floor(t.cap * (k.per != null ? k.per : 0.05)) + '통</small>'; })() : '';
      return { label: c.name + plus, right: c.id === now ? '지금 이 방' : c.cost ? U.num(c.cost) + '닢 · ' + c.days + '일' : '비운다', value: c.id, icon: c.icon, disabled: c.id === now, desc: c.desc + (c.fx ? ' — ' + c.fx : '') };
    });
    var v = await UI.choose('선실 고치기', opts, { width: 640, icon: 'hammer', text: '소지금 ' + U.num(s.player.gold) + '닢. 방마다 맞는 특기를 가진 부하를 두어야 힘을 냅니다.' });
    if (v == null) return;
    var c = G.CABIN[v];
    if (c.cost > s.player.gold) { UI.toast('돈이 모자랍니다. (' + U.num(c.cost) + '닢)', 'coin'); return; }
    if (now === 'store' && v !== 'store') {   // 창고를 없애면 짐칸이 준다 — 넘치는 짐이 있으면 먼저 덜어 내야 한다
      var sh0 = CB().flagship(), before = CB().storeBonus(sh0); rooms[i] = v; var after = CB().storeBonus(sh0); rooms[i] = now;
      var over = R0().used() - (R0().fleetCap() - (before - after));
      if (over > 0) { UI.toast('창고에 실린 짐이 넘칩니다. 짐칸을 ' + U.num(over) + '통 비운 뒤에 고칠 수 있습니다.', 'chest', 5200); return; }
    }
    if (c.cost && !await UI.confirm(G.CABIN[now].name + U.j(G.CABIN[now].name, '을/를').slice(G.CABIN[now].name.length) + ' ' + c.name + U.j(c.name, '으로/로').slice(c.name.length) + ' 고치겠습니까? (금화 ' + U.num(c.cost) + '닢 · ' + c.days + '일)', '고친다', '그만둔다')) return;
    s.player.gold -= c.cost;
    CB().remodel(i, v);
    if (c.days) await UI.fade(function () { G.Game.passDays(c.days); });
    UI.toast(c.id === 'hold' ? '선실을 비웠다.' : c.name + U.j(c.name, '을/를').slice(c.name.length) + ' 꾸몄다.', c.icon);
    if (G.Game.cityHud && c0) G.Game.cityHud(); else if (G.Game.refreshHud) G.Game.refreshHud();
  }

  // ---------------------------------------------------------------- 함대에 적용되는 능력 합계 (2026-10-19)
  /* 오른쪽 아래 판: 지금 배치로 함대가 실제로 쓰는 특기 단계(R.skill — 제독·부관·항해사·측량사·경리·특기를 쓰는 방)와
     선실이 내는 효과의 수치(G.Cabins.fx — 쓰는 곳의 계산 그대로). 배치를 바꾸면 바로 전과 달라진 줄에 ▲▼를 붙인다. */
  var ROLE_OK = { first: 'first', nav: 'nav', surveyor: 'surveyor', purser: 'purser' };
  /** 이 특기를 함대에 쓰는 사람과 단계 (R.skill과 같은 규칙) */
  function skillSource(id) {
    var s = S(), best = { lv: s.player.sk[id] || 0, who: '제독' };
    s.mates.forEach(function (m) {
      var d = G.MATE[m.id]; if (!d) return;
      var lv = G.R.mateSkill(m, id); if (!lv || lv <= best.lv) return;
      var ok = CB().activates(m, id) || (ROLE_OK[m.role] && (G.ROLE_SKILLS[ROLE_OK[m.role]] || []).indexOf(id) >= 0);
      if (ok) best = { lv: lv, who: d.name };
    });
    best.lv = G.R.skill(id);   // 다침·충성까지 셈한 실제 값
    if (!best.lv) best.who = '';
    return best;
  }
  function pct(v) { return Math.round(v * 1000) / 10; }
  function num(v) { return Math.round(v * 100) / 100; }
  /** 함대에 적용되는 값 모두 */
  function fleetTotals() {
    var cb = CB(), F = function (t, k) { return cb.fx(t, k); }, B = (G.BALANCE && G.BALANCE.cabins) || {};
    var sk = (G.SKILLS || []).map(function (k) { var o = skillSource(k.id); return { id: k.id, name: k.name, lv: o.lv, who: o.who }; });
    var fat = F('galley', 'galley') + F('mess', 'mess') + F('helm', 'helm') + F('musicroom', 'musicroom');
    var dis = F('chapel', 'chapel') + F('rec', 'rec') + F('deck', 'deck') + F('mess', 'messD');
    var gm = cb.galleyMeal ? cb.galleyMeal() : null;   // 요리실의 차림: 요리사 고장의 음식 (식당이 있으면 더) — js/systems/cabins.js
    if (gm) { fat += gm.fat; dis += gm.disc; }
    var fx = [
      { k: 'fat', ic: 'bed', label: '하루 피로', v: fat, text: fat ? '−' + num(fat) : '', rooms: '요리실·식당·조타실·음악실' },
      { k: 'dis', ic: 'flag', label: '하루 규율', v: dis, text: dis ? '+' + num(dis) : '', rooms: '예배실·오락실·갑판·식당' },
      { k: 'meal', ic: 'bread', label: '요리실의 차림', v: gm ? gm.fat + gm.disc : 0, text: gm ? '「' + gm.dish.name + '」' : '',
        rooms: gm ? gm.zoneName + ' 음식 · 요리사 ' + gm.name + ' (요리 ' + gm.lv + ') · 7일마다 바뀜 · 하루 피로 −' + num(gm.fat) + ' · 규율 +' + num(gm.disc) + (gm.mess ? ' · 식당 ×' + num(gm.mult) : ' · 식당이 있으면 더 좋아진다') + (gm.home ? ' · 고향의 맛' : '') + (gm.flavorText ? ' · 풍미 ×' + num(gm.flavor) + ' (' + gm.flavorText + ' — 차림이 바뀔 때 1통씩)' : ' · 짐칸에 후추 같은 향신료나 식자재가 있으면 풍미가 더해진다') + ' · 요리 단계가 높을수록 값비싼 음식' : '요리실' },
      { k: 'spd', ic: 'sail', label: '함대 속도', v: Math.min(B.rigMax || 1, F('rig', 'rig')), rooms: '조범실', fmt: function (v) { return '+' + pct(v) + '%'; } },
      { k: 'gun', ic: 'cannon', label: '기함 포 장전', v: F('gun', 'gun') * 0.5, rooms: '포격실', fmt: function (v) { return '+' + pct(v) + '% 빠르게'; } },
      { k: 'mar', ic: 'sword', label: '기함 백병전', v: F('marine', 'marine'), rooms: '해병 대기실', fmt: function (v) { return '+' + pct(v) + '%'; } },
      { k: 'hag', ic: 'coin', label: '값 깎기 성공', v: F('account', 'haggle'), rooms: '회계실', fmt: function (v) { return '+' + pct(v) + '%p'; } },
      { k: 'wage', ic: 'coin', label: '급료', v: Math.min(0.5, F('account', 'wage')), rooms: '회계실', fmt: function (v) { return '−' + pct(v) + '%'; } },
      { k: 'look', ic: 'telescope', label: '발견물 알아보는 거리', v: F('lookout', 'lookout'), rooms: '파수대', fmt: function (v) { return '+' + num(v) + '°'; } },
      { k: 'chart', ic: 'chart', label: '해도에 밝히는 넓이', v: F('chart', 'chart'), rooms: '지도 제작실', fmt: function (v) { return '+' + num(v) + '°'; } },
      { k: 'sick', ic: 'cross', label: '괴혈병 번짐', v: Math.min(0.6, F('sick', 'sick')), rooms: '진료실', fmt: function (v) { return '−' + pct(v) + '%'; } },
      { k: 'rep', ic: 'hammer', label: '바다 위 기함 수리', v: F('repair', 'repair'), rooms: '선박 수리실', fmt: function (v) { return '내구 +' + num(v) + '/일'; } },
      { k: 'pen', ic: 'bread', label: '식량', v: F('pen', 'pen'), rooms: '사육실', fmt: function (v) { return '+' + num(v) + '/일'; } },
      { k: 'stf', ic: 'strategy', label: '육상전 계략', v: F('staff', 'staff'), rooms: '참모실', fmt: function (v) { return '성공 +' + pct(v) + '%p · 피해 +' + pct(F('staff', 'staffDmg')) + '%'; } },
      { k: 'adj', ic: 'people', label: '불만 다독이기 (충성 ' + ((G.BALANCE.mates || {}).settle || 70) + ' 아래 부하)', v: cb.power('adjutant'), rooms: '부관실 — 급료를 치른 달마다', fmt: function () { return '충성 +' + (((G.BALANCE.mates || {}).adjutantLoyal == null ? 1 : G.BALANCE.mates.adjutantLoyal)) + '/달'; } },
      { k: 'art', ic: 'palette', label: '화실·조각실의 힘', v: cb.power('studio') + cb.power('sculpt'), rooms: '화실·조각실', fmt: function (v) { return '힘 ' + num(v); } },
      (function () { var sb = cb.storeBonus ? cb.storeBonus() : 0, sr = cb.storeRooms ? cb.storeRooms() : { n: 0, used: 0 };
        return { k: 'store', ic: 'chest', label: '기함 짐칸', v: sb, rooms: '창고 ' + sr.n + '칸' + (sr.n > sr.used ? ' (' + sr.used + '칸까지만 센다)' : '') + ' · 무게 한도는 그대로 — 가벼운 짐에 좋다', fmt: function (v) { return '+' + U.num(v) + '통'; } }; })()
    ];
    fx.forEach(function (o) { if (!o.text) o.text = o.v > 0 ? o.fmt(o.v) : ''; });
    return { sk: sk, fx: fx };
  }
  CV._totals = fleetTotals;   // 시험용
  var lastTotals = null;
  function totalsHtml() {
    var t = fleetTotals(), prev = lastTotals; lastTotals = t;
    function delta(a, b) { if (!prev || a === b) return ''; return a > b ? '<i class="cb-up">▲</i>' : '<i class="cb-dn">▼</i>'; }
    var psk = {}, pfx = {}; if (prev) { prev.sk.forEach(function (x) { psk[x.id] = x.lv; }); prev.fx.forEach(function (x) { pfx[x.k] = x.v; }); }
    // 쓰는 특기는 점(●●●)으로, 아무도 쓰지 않는 특기는 한 줄로 (자리를 아끼려고)
    var used = t.sk.filter(function (x) { return x.lv; }), none = t.sk.filter(function (x) { return !x.lv; });
    var skHtml = used.map(function (x) {
      var dots = ''; for (var i = 1; i <= 3; i++) dots += '<i class="cb-dot' + (x.lv >= i ? ' on' : '') + '"></i>';
      return '<div class="cb-tsk" title="' + U.esc(x.name + ' ' + x.lv + '단계 — ' + x.who) + '"><span>' + U.esc(x.name) + '</span><span class="cb-dots">' + dots + '</span>' + delta(x.lv, psk[x.id]) + '</div>';
    }).join('') + none.filter(function (x) { return psk[x.id]; }).map(function (x) {   // 방금 잃은 특기
      return '<div class="cb-tsk zero" title="' + U.esc(x.name + ' — 이제 함대에 쓰는 사람이 없다') + '"><span>' + U.esc(x.name) + '</span><span class="cb-dots"><i class="cb-dot"></i><i class="cb-dot"></i><i class="cb-dot"></i></span><i class="cb-dn">▼</i></div>';
    }).join('');
    var noneHtml = none.length ? '<div class="cb-tnone-sk muted" title="이 특기를 가진 부하를 그 특기를 쓰는 방이나 역할에 두면 함대에 쓰인다">쓰지 않음 · ' + none.map(function (x) { return U.esc(x.name); }).join(' · ') + '</div>' : '';
    var on = t.fx.filter(function (o) { return o.v > 0; });
    var fxHtml = on.length ? on.map(function (o) {
      return '<div class="cb-tfx" title="' + U.esc(o.rooms) + '">' + G.icon(o.ic) + '<span>' + U.esc(o.label) + '</span><b>' + U.esc(o.text) + '</b>' + delta(o.v, pfx[o.k]) + '</div>';
    }).join('') : '<div class="muted cb-tnone">아직 효과를 내는 방이 없습니다. 방에 맞는 특기를 가진 부하를 배치하십시오.</div>';
    var n = t.sk.filter(function (x) { return x.lv; }).length;
    return '<div class="cb-totals"><div class="cb-sub">함대에 적용되는 능력 <small class="muted">— 지금 배치</small></div>' +
      '<div class="cb-tsub">특기 <small class="muted">' + n + '/' + t.sk.length + ' · 함대가 쓰는 단계</small></div><div class="cb-tsks">' + skHtml + '</div>' + noneHtml +
      '<div class="cb-tsub">선실 효과</div><div class="cb-tfxs">' + fxHtml + '</div></div>';
  }

  /** 끌어다 놓기: 부하를 방(또는 명단)에 놓았을 때 */
  async function dropMate(id, to) {
    var m = mateById(id); if (!m) return;
    if (to.k === 'none') { if (m.room != null) CB().place(m, null); if (ROLE_OF_INV(m.role)) m.role = 'none'; return; }
    if (to.k === 'captain') { UI.toast('함장실은 제독의 방입니다.', 'crown'); return; }
    if (to.k === 'room' && CB().noStaff(CB().rooms()[to.i])) { UI.toast('창고에는 사람을 두지 않습니다.', 'chest'); return; }
    if (to.k === 'room' && CB().rooms()[to.i] === 'hold') { UI.toast('빈 선실입니다. 조선소의 「선실 개조」에서 쓰임을 정하면 사람을 둘 수 있습니다.', 'hammer'); return; }
    if (m.role === 'captain' && !await UI.confirm(G.MATE[m.id].name + '은(는) 지금 다른 배의 선장입니다. 기함으로 데려오겠습니까?', '데려온다', '그만둔다')) return;
    if (to.k === 'fixed') setRole(m, ROLE_OF[to.type]);
    else if (to.k === 'room') CB().place(m, to.i);
  }

  CV._pickFor = pickFor;   // 시험용 (tests/cabin_recommend_smoke.js)

  /* 2026-10-17 선실 화면 위의 작은 팝업 — 선실이 보이는 채로 고른다.
     방(표·카드·갑판 위 얼굴표)을 누르면 둘 사람(추천 순 · 작은 얼굴 · 특기 · 능력치), 부하를 누르면 둘 방(잘 맞는 순).
     고르면 창을 닫고 { k: 'set' | 'clear' | 'remodel' | 'drop' }을 돌려준다 — CV.open 이 처리하고 다시 그린다. */
  function closePop(win) {
    var p = win.content.querySelector('.cb-pop'); if (p) p.remove();
    win.content.querySelectorAll('.cb-sel').forEach(function (x) { x.classList.remove('cb-sel'); });
  }
  /** 팝업을 누른 것 옆에 놓는다 (오른쪽 → 왼쪽 → 아래). 화면 배율(transform)과 창 스크롤을 셈한다 */
  function placePop(win, pop, anchor) {
    var host = win.content;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(pop);
    anchor.classList.add('cb-sel');
    var hr = host.getBoundingClientRect(), ar = anchor.getBoundingClientRect(), k = (hr.width / (host.offsetWidth || hr.width)) || 1;
    var ax = (ar.left - hr.left) / k + host.scrollLeft, ay = (ar.top - hr.top) / k + host.scrollTop, aw = ar.width / k, ah = ar.height / k;
    var pw = pop.offsetWidth, ph = pop.offsetHeight, W = host.clientWidth, H = Math.max(host.clientHeight, host.scrollHeight), gap = 10;
    var x = ax + aw + gap, y = ay + ah / 2 - ph / 2;
    if (x + pw > W - 6) x = ax - pw - gap;
    if (x < 6) { x = U.clamp(ax + aw / 2 - pw / 2, 6, Math.max(6, W - pw - 6)); y = ay + ah + gap; if (y + ph > H - 6) y = ay - ph - gap; }
    pop.style.left = Math.round(x) + 'px';
    pop.style.top = Math.round(U.clamp(y, host.scrollTop + 6, Math.max(host.scrollTop + 6, H - ph - 6))) + 'px';
  }
  function popButton(f, label, icon, fn, cls) { var b = U.el('button', 'btn small' + (cls ? ' ' + cls : ''), (icon ? G.icon(icon) : '') + label); b.onclick = fn; f.appendChild(b); }
  /** 방을 눌렀을 때: 이 방에 둘 사람. type = 방 종류, i = 선실 번호(고정 자리는 null), o.yard = 조선소에서 */
  function popRoom(win, anchor, type, i, o) {
    closePop(win);
    var c = G.CABIN[type], role = ROLE_OF[type], cur = role ? CB().roleMate(role) : CB().occupant(i), ranks = recRanks(c), rec = recommend(c);
    var pw = role ? CB().power(type) : CB().powerAt(i);
    var pop = U.el('div', 'cb-pop');
    pop.innerHTML = '<div class="cb-pop-h">' + G.icon(c.icon) + '<b>' + (i ? i + '. ' : '') + c.name + '</b>' + powTag(pw) + '<button class="cb-pop-x" title="닫기 (Esc)">×</button></div>' +
      '<div class="cb-pop-d">' + c.desc + (c.fx ? '<br><span class="muted">사람을 두면: ' + c.fx + '</span>' : '') +
      (rec.some(function (x) { return x.score > 0; }) ? '' : '<br><span class="warn-text">이 방에 맞는 ' + (c.lang ? '말(제독이 모르는 말)' : '특기') + '을 가진 부하가 없습니다.</span>') + '</div>' +
      '<div class="cb-pop-list"></div><div class="cb-pop-f"></div>';
    var list = pop.querySelector('.cb-pop-list');
    if (!rec.length) list.innerHTML = '<div class="muted">부하가 없습니다. 술집에서 부하를 찾아보십시오.</div>';
    rec.forEach(function (x) {
      var m = x.m, d = G.MATE[m.id], rk = ranks[m.id];
      var row = U.el('div', 'cb-pop-row' + (rk === 1 ? ' best' : rk ? ' rec' : '') + (m === cur ? ' cur' : ''),
        '<span class="cb-face"></span><span class="cb-nm"><span class="n1">' + U.esc(d.name) + recTag(rk) + (m === cur ? ' <span class="tag">지금 이 자리</span>' : '') + '</span>' +
        '<small class="cb-fit">' + fitNote(m, c) + ' · ' + U.esc(CB().placeName(m)) + '</small>' +
        '<small>특기 ' + U.esc(skillsOf(m)) + '</small><small>' + statsOf(m, true) + ' · ' + loyalTag(m) + '</small></span>');
      row.dataset.mate = m.id;
      row.querySelector('.cb-face').appendChild(face(m.id, 36));
      if (m !== cur) row.onclick = function () { win.close({ k: 'set', type: type, i: i, id: m.id }); };
      list.appendChild(row);
    });
    var f = pop.querySelector('.cb-pop-f');
    if (cur) popButton(f, '자리를 비운다', 'boot', function () { win.close({ k: 'clear', type: type, i: i }); });
    if (o && o.yard && i > 0) popButton(f, '다른 방으로 고친다', 'hammer', function () { win.close({ k: 'remodel', i: i }); });
    if (!f.childNodes.length) f.remove();
    pop.querySelector('.cb-pop-x').onclick = function () { closePop(win); };
    placePop(win, pop, anchor);
  }
  /** 부하를 눌렀을 때: 이 사람을 둘 방 (잘 맞는 방 먼저) */
  function popMate(win, anchor, m) {
    closePop(win);
    var d = G.MATE[m.id], rooms = CB().rooms(), ent = [];
    ['adjutant', 'helm', 'lookout'].forEach(function (t) { ent.push({ type: t, i: null, c: G.CABIN[t], o: CB().roleMate(ROLE_OF[t]) }); });
    rooms.forEach(function (t, i) { if (t !== 'hold' && !CB().noStaff(t)) ent.push({ type: t, i: i, c: G.CABIN[t], o: CB().occupant(i) }); });
    ent.forEach(function (e, k) { e.k = k; e.score = fitScore(m, e.c); });
    ent.sort(function (a, b) { return (b.score - a.score) || (a.k - b.k); });
    var pop = U.el('div', 'cb-pop cb-pop-mate');
    pop.innerHTML = '<div class="cb-pop-h"><span class="cb-face big"></span><span class="cb-nm"><b class="n1">' + U.esc(d.name) + '</b><small>' + U.esc(CB().placeName(m)) + '</small></span><button class="cb-pop-x" title="닫기 (Esc)">×</button></div>' +
      '<div class="cb-pop-d"><b>특기</b> ' + U.esc(skillsOf(m)) + '<br><b>능력</b> ' + statsOf(m) + ' · ' + loyalTag(m) + '</div>' +
      '<div class="cb-pop-list"></div><div class="cb-pop-f"></div>';
    pop.querySelector('.cb-face').appendChild(face(m.id, 44));
    var list = pop.querySelector('.cb-pop-list');
    ent.forEach(function (e) {
      var here = e.o === m, best = fitTag(m, e.c);
      var row = U.el('div', 'cb-pop-row room' + (best ? ' best' : '') + (here ? ' cur' : ''),
        G.icon(e.c.icon) + '<span class="cb-nm"><span class="n1">' + (e.i ? e.i + '. ' : '') + e.c.name + best + (here ? ' <span class="tag">지금 이 자리</span>' : '') + '</span>' +
        '<small class="cb-fit">' + fitNote(m, e.c) + '</small></span>' +
        '<span class="cb-occ">' + (e.o && !here ? '<span class="cb-face"></span>' + U.esc(G.MATE[e.o.id].name) + (e.i == null ? '와 교대' : ' 대신') : e.o ? '' : '비어 있음') + '</span>');
      if (e.o && !here) row.querySelector('.cb-occ .cb-face').appendChild(face(e.o.id, 24));
      if (!here) row.onclick = function () { win.close({ k: 'set', type: e.type, i: e.i, id: m.id }); };
      list.appendChild(row);
    });
    var f = pop.querySelector('.cb-pop-f');
    if (m.room != null || ROLE_OF_INV(m.role)) popButton(f, '자리에서 뺀다 (대기)', 'boot', function () { win.close({ k: 'drop', id: m.id, to: { k: 'none' } }); });
    if (!f.childNodes.length) f.remove();
    pop.querySelector('.cb-pop-x').onclick = function () { closePop(win); };
    placePop(win, pop, anchor);
  }
  /** 팝업에서 고른 사람을 그 자리에 앉힌다 (다른 배 선장이면 묻는다) */
  async function setFromPop(a) {
    var m = mateById(a.id); if (!m) return;
    if (m.role === 'captain' && !await UI.confirm(G.MATE[m.id].name + '은(는) 지금 다른 배의 선장입니다. 기함으로 데려오겠습니까?', '데려온다', '그만둔다')) return;
    var role = ROLE_OF[a.type];
    if (role) setRole(m, role); else CB().place(m, a.i);
  }
  CV._pop = { room: popRoom, mate: popMate, close: closePop };   // 시험용

  function R0() { return G.R; }
  /** 창고 칸 i 의 한 줄: 짐칸 +N통 (센 칸을 넘으면 헛방) */
  function storeLine(i) {
    var sh = CB().flagship(), t = sh && G.SHIP[sh.type], k = (G.BALANCE && G.BALANCE.cabins && G.BALANCE.cabins.store) || {}, max = k.max != null ? k.max : 4;
    var rooms = CB().rooms(), nth = 0; for (var j = 0; j <= i; j++) if (rooms[j] === 'store') nth++;
    if (nth > max) return '헛방 (' + max + '칸까지만 센다)';
    return '짐칸 +' + U.num(Math.floor(((t && t.cap) || 0) * (k.per != null ? k.per : 0.05))) + '통';
  }
  /** 선실 화면을 연다. opts.yard = 조선소가 있는 도시(방을 고칠 수 있다) */
  CV.open = async function (opts) {
    opts = opts || {};
    var s = S();
    lastTotals = null;   // 창을 새로 열 때는 ▲▼ 없이
    for (;;) {
      var sh = CB().flagship();
      if (!sh) { UI.toast('기함이 없습니다.', 'ship'); return; }
      CB().tidy();
      var rooms = CB().rooms(), l = L(), n = rooms.length - 1;
      var hasArt = G.Img && G.Img.has('ships/' + sh.type);
      var sp = (hasArt && SPOT[sh.type]) || SPOT_DEF, v = view(sp);
      var wage = CB().wages(), warn = CB().wageWarning();
      var idle = s.mates.filter(function (m) { return G.MATE[m.id] && (!m.role || m.role === 'none') && m.room == null; }).length;
      var html = '<div class="cb-top"><span>' + G.icon('bed') + '선실 <b>' + n + '</b>칸 <small class="muted">(큰 배일수록 많다)</small></span>' +
        '<span>' + G.icon('people') + '부하 <b>' + s.mates.length + '</b>명' + (idle ? ' <small class="warn-text">· 자리 없음 ' + idle + '</small>' : '') + '</span>' +
        '<span' + (warn ? ' class="warn-text"' : '') + '>' + G.icon('coin') + '급료 한 달 <b>' + U.num(wage) + '</b>닢' + (warn ? ' — 가진 돈으로 ' + Math.max(0, warn.months) + '달' : '') + '</span>' +
        '<span class="muted cb-tip">' + (opts.yard ? '방을 누르면 사람을 두거나 고칩니다.' : '방을 누르면 사람을 둡니다 · 방을 고치는 일은 조선소에서.') + ' 부하를 끌어다 방에 놓아도 됩니다.</span></div>' +
        '<div class="cb-body"><div class="cb-main">' +
        '<div class="cb-stage" style="width:' + l.stageW + 'px;height:' + l.stageH + 'px"><canvas class="cb-stage-base"></canvas><div class="cb-stage-shade"></div>' +
        '<div class="cb-ship-name">' + U.esc(sh.name) + '호 <small>· ' + U.esc(G.SHIP[sh.type].name) + '</small></div></div>' +
        '<div class="cb-cards" style="width:' + l.stageW + 'px;grid-template-columns:repeat(' + Math.min(CB().cols(), Math.max(1, n)) + ',minmax(0,' + (l.cardMax || 180) + 'px))"></div>' +
        '</div><div class="cb-side">' +
        '<div class="cb-sub" title="맞닿은 방에서 지내면 서로의 말을 더 빨리 익히고, 석 달·아홉 달·두 해를 함께하면 제독의 모국어를 한 단계씩 배운다. 자리가 없는 부하는 달마다 충성이 떨어진다.">부하 <small class="muted">— 눌러서 자리를 정한다</small></div>' +
        '<div class="cb-roster" style="max-height:' + Math.min(l.rosterH || 360, 200) + 'px"></div>' +
        totalsHtml() + '</div></div>';   // 오른쪽 아래: 함대에 적용되는 능력 합계 (지금 힘을 내는 방·말 배우기 풀이는 제목에 마우스를 올리면)
      var win = UI.window({ title: '기함 선실 — ' + U.esc(sh.name) + '호', icon: 'ship', width: l.stageW + (l.side || 300) + 66, html: html, buttons: [{ label: '닫는다', value: null }], clickAny: false });
      var stage = win.content.querySelector('.cb-stage'), cards = win.content.querySelector('.cb-cards');
      drawFallback(stage.querySelector('.cb-stage-base'), v, sp);
      if (hasArt) placeShipArt(stage, sh, v);

      // 끌어다 놓기 (마우스). 누르기만 해도 같은 일을 고를 수 있다.
      var dragging = null;
      var dragFrom = function (el, m) {
        if (!m) return;
        el.draggable = true;
        el.addEventListener('dragstart', function (e) { dragging = m.id; try { e.dataTransfer.setData('text/plain', 'mate:' + m.id); e.dataTransfer.effectAllowed = 'move'; } catch (x) { /* 오래된 브라우저 */ } win.content.classList.add('cb-dragging'); });
        el.addEventListener('dragend', function () { dragging = null; win.content.classList.remove('cb-dragging'); });
      };
      var dropOn = function (el, to) {
        el.addEventListener('dragover', function (e) { if (!dragging) return; e.preventDefault(); el.classList.add('drop-ok'); });
        el.addEventListener('dragleave', function () { el.classList.remove('drop-ok'); });
        el.addEventListener('drop', function (e) { e.preventDefault(); el.classList.remove('drop-ok'); if (dragging) win.close({ k: 'drop', id: dragging, to: to }); });
      };
      // 카드와 선체 속 표를 함께 밝힌다
      var hot = function (i, on) { win.content.querySelectorAll('[data-i="' + i + '"]').forEach(function (x) { x.classList.toggle('hot', on); }); };
      var hover = function (el, i) { el.addEventListener('mouseenter', function () { hot(i, true); }); el.addEventListener('mouseleave', function () { hot(i, false); }); };

      // 고정 자리
      var ms = medalSpots(v, sp);
      var put = function (c, m, o, act) {
        var el = medal(c, ms[c.id], m, o);
        el.onclick = function () {   // 갑판 위 자리: 함장실은 제독의 방, 나머지는 팝업
          if (act.k === 'captain') win.close(act); else popRoom(win, el, act.k === 'fixed' ? act.type : 'deck', act.k === 'fixed' ? null : 0, opts);
        };
        dragFrom(el, m); dropOn(el, act.k === 'captain' ? { k: 'captain' } : act.k === 'fixed' ? { k: 'fixed', type: act.type } : { k: 'room', i: 0 });
        stage.appendChild(el);
      };
      put(G.CABIN.lookout, CB().roleMate('surveyor'), { pow: CB().power('lookout') }, { k: 'fixed', type: 'lookout' });
      put(G.CABIN.deck, CB().occupant(0), { pow: CB().powerAt(0) }, { k: 'room', i: 0 });
      put(G.CABIN.helm, CB().roleMate('nav'), { pow: CB().power('helm') }, { k: 'fixed', type: 'helm' });
      put(G.CABIN.adjutant, CB().roleMate('first'), { pow: CB().power('adjutant') }, { k: 'fixed', type: 'adjutant' });
      put(G.CABIN.captain, null, { admiral: true }, { k: 'captain' });

      // 선체 속 표와 아래 카드
      var spots = pinSpots(v, sp, n);
      rooms.forEach(function (t, i) {
        if (i === 0) return;
        var c = G.CABIN[t], m = CB().occupant(i), act = { k: 'room', i: i };
        var p = pin(c, i, spots[i - 1], m), cd = card(c, i, m, { pow: CB().powerAt(i), yard: opts.yard, storeLine: c.noStaff ? storeLine(i) : null });
        [p, cd].forEach(function (el) {
          el.onclick = function () { if (t === 'hold' || CB().noStaff(t)) win.close(act); else popRoom(win, el, t, i, opts); };   // 빈 선실·창고는 고치기(조선소)·알림
          dragFrom(el, m); dropOn(el, act); hover(el, i);
        });
        stage.appendChild(p); cards.appendChild(cd);
      });

      // 명단: 자리가 없는 사람을 먼저
      var ros = win.content.querySelector('.cb-roster');
      dropOn(ros, { k: 'none' });
      s.mates.filter(function (m) { return G.MATE[m.id]; }).map(function (m, k) {
        return { m: m, k: k, idle: (!m.role || m.role === 'none') && m.room == null };
      }).sort(function (a, b) { return (b.idle - a.idle) || (a.k - b.k); }).forEach(function (o) {
        var m = o.m, d = G.MATE[m.id];
        var chip = U.el('div', 'cb-mate' + (o.idle ? ' idle' : ''), '<span class="cb-face"></span><span class="cb-nm"><span class="n1">' + U.esc(d.name) + '</span><small>' + U.esc(CB().placeName(m)) + '</small><small class="cb-sk">' + U.esc(skillsOf(m)) + '</small><small class="cb-st">' + statsOf(m, true) + '</small>' + loyalTag(m) + '</span>');
        chip.querySelector('.cb-face').appendChild(face(m.id, 40));
        chip.title = '특기 ' + skillsOf(m) + '\n능력 ' + statsOf(m);
        chip.onclick = function () { popMate(win, chip, m); };
        dragFrom(chip, m);
        ros.appendChild(chip);
      });
      if (!s.mates.length) ros.innerHTML = '<div class="muted">부하가 없습니다. 술집에서 부하를 찾아보십시오.</div>';

      // 팝업 밖을 누르거나 Esc면 팝업만 닫는다 (Esc가 선실 창까지 닫지 않게)
      var outside = function (e) { if (win.content.querySelector('.cb-pop') && !(e.target.closest && e.target.closest('.cb-pop, .cb-medal, .cb-pin, .cb-card, .cb-mate'))) closePop(win); };
      var esc = function (e) { if (e.key === 'Escape' && win.content.querySelector('.cb-pop')) { e.preventDefault(); e.stopImmediatePropagation(); closePop(win); } };
      document.addEventListener('mousedown', outside, true);
      window.addEventListener('keydown', esc, true);
      var a;
      try { a = await win.result; } finally { window.removeEventListener('keydown', esc, true); document.removeEventListener('mousedown', outside, true); }
      if (!a) return;
      if (a.k === 'set') await setFromPop(a);
      else if (a.k === 'clear') { if (ROLE_OF[a.type]) { var rm = CB().roleMate(ROLE_OF[a.type]); if (rm) rm.role = 'none'; } else { var oc = CB().occupant(a.i); if (oc) CB().place(oc, null); } }
      else if (a.k === 'remodel') await remodel(a.i, opts.yard);
      else if (a.k === 'drop') await dropMate(a.id, a.to);
      else if (a.k === 'captain') await UI.say('함장실은 제독의 방입니다. 맞닿은 부관실 사람과는 말을 빨리 익힙니다.', G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {});
      else if (a.k === 'fixed') await pickFor(a.type);
      else if (a.k === 'mate') { var mm = mateById(a.id); if (mm) await pickRoom(mm); }
      else if (a.k === 'room') {
        var type = rooms[a.i];
        if (a.i === 0) await pickFor('deck', 0);
        else if (!opts.yard) { if (type === 'hold') UI.toast('빈 선실입니다. 조선소의 「선실 개조」에서 쓰임을 정할 수 있습니다.', 'hammer'); else if (CB().noStaff(type)) UI.toast('창고 — ' + storeLine(a.i) + '. 사람을 두지 않는 방입니다. 다른 방으로 고치는 일은 조선소에서.', 'chest', 5200); else await pickFor(type, a.i); }
        else if (type === 'hold' || CB().noStaff(type)) await remodel(a.i, opts.yard);
        else {
          var w = await UI.choose(G.CABIN[type].name, [{ label: '부하를 배치한다', right: recShort(G.CABIN[type]), value: 'p', icon: 'people' }, { label: '다른 방으로 고친다', value: 'r', icon: 'hammer' }], { width: 420 });
          if (w === 'p') await pickFor(type, a.i); else if (w === 'r') await remodel(a.i, opts.yard);
        }
      }
    }
  };
})(window.G = window.G || {});
