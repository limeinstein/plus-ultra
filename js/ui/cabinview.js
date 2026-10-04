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
     모든 배가 왼쪽이 뱃머리, 오른쪽이 고물이다. 그림을 새로 그리면 여기 값만 다시 재면 된다. */
  var SPOT = {
    atakebune: { hull: [150, 268, 765, 345], deck: 262, mast: [385, 50], stern: [745, 232] },
    baghlah: { hull: [245, 312, 725, 383], deck: 300, mast: [430, 40], stern: [700, 222] },
    balsa: { hull: [130, 298, 700, 333], deck: 292, mast: [437, 40], stern: [560, 252] },
    baochuan: { hull: [70, 302, 820, 382], deck: 292, mast: [385, 40], stern: [775, 205] },
    barca: { hull: [190, 355, 730, 420], deck: 345, mast: [425, 60], stern: [720, 330] },
    caravel: { hull: [210, 325, 700, 395], deck: 315, mast: [345, 40], stern: [670, 300] },
    carrack: { hull: [215, 300, 715, 365], deck: 290, mast: [465, 125], stern: [690, 265] },
    cog: { hull: [185, 295, 705, 360], deck: 285, mast: [420, 40], stern: [670, 245] },
    dhow: { hull: [200, 315, 700, 385], deck: 300, mast: [315, 30], stern: [720, 275] },
    fluyt: { hull: [220, 330, 710, 385], deck: 320, mast: [465, 120], stern: [710, 285] },
    frigate: { hull: [195, 320, 795, 370], deck: 310, mast: [410, 95], stern: [785, 300] },
    fusta: { hull: [220, 345, 750, 375], deck: 335, mast: [345, 40], stern: [740, 320] },
    galleass: { hull: [150, 295, 760, 350], deck: 290, mast: [380, 30], stern: [740, 262] },
    galleon: { hull: [240, 320, 740, 380], deck: 310, mast: [410, 95], stern: [760, 265] },
    galley: { hull: [170, 298, 830, 335], deck: 290, mast: [350, 40], stern: [790, 285] },
    geobukseon: { hull: [170, 290, 770, 360], deck: 265, mast: [325, 40], stern: [740, 290] },
    greatgalley: { hull: [140, 320, 830, 365], deck: 312, mast: [390, 40], stern: [800, 268] },
    hcarrack: { hull: [220, 295, 700, 365], deck: 285, mast: [415, 95], stern: [690, 245] },
    hulk: { hull: [190, 295, 740, 380], deck: 285, mast: [355, 30], stern: [720, 240] },
    jong: { hull: [160, 300, 730, 370], deck: 290, mast: [375, 30], stern: [740, 220] },
    junk: { hull: [160, 315, 760, 385], deck: 300, mast: [315, 30], stern: [730, 260] },
    kobaya: { hull: [120, 315, 820, 355], deck: 305, mast: [420, 50], stern: [815, 295] },
    korakora: { hull: [120, 310, 760, 340], deck: 300, mast: [320, 75], stern: [770, 295] },
    lcaravel: { hull: [200, 320, 720, 385], deck: 310, mast: [450, 50], stern: [710, 285] },
    lcarrack: { hull: [215, 325, 690, 385], deck: 315, mast: [395, 95], stern: [680, 280] },
    lgalleon: { hull: [220, 310, 740, 385], deck: 300, mast: [420, 110], stern: [740, 250] },
    ljunk: { hull: [140, 310, 780, 390], deck: 300, mast: [435, 40], stern: [790, 245] },
    maengseon: { hull: [130, 295, 750, 360], deck: 285, mast: [325, 30], stern: [750, 265] },
    panokseon: { hull: [110, 290, 830, 365], deck: 270, mast: [320, 40], stern: [810, 265] },
    parau: { hull: [180, 335, 820, 375], deck: 325, mast: [455, 90], stern: [800, 320] },
    pinnace: { hull: [190, 320, 740, 375], deck: 310, mast: [355, 30], stern: [730, 280] },
    sambuk: { hull: [170, 350, 720, 405], deck: 340, mast: [370, 70], stern: [700, 320] },
    sekibune: { hull: [130, 305, 830, 345], deck: 280, mast: [462, 40], stern: [790, 240] },
    shachuan: { hull: [150, 330, 820, 395], deck: 315, mast: [370, 40], stern: [780, 275] },
    tartane: { hull: [230, 355, 720, 415], deck: 340, mast: [490, 50], stern: [720, 330] },
    xebec: { hull: [210, 320, 770, 370], deck: 310, mast: [315, 90], stern: [760, 310] }
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
    return best ? G.SKILL_BY_ID[best].name + ' ' + lv : c.lang ? '통역' : ks.length ? '특기 없음' : '';
  }
  function loyalTag(m) {
    var lo = m.loyal == null ? 70 : m.loyal, e = CB().eff(m);
    return '<span class="cb-loyal' + (e < 1 ? ' low' : '') + '">충성 ' + Math.round(lo) + (e < 1 ? ' · 효율 ' + Math.round(e * 100) + '%' : '') + '</span>';
  }
  function face(id, size) { try { return G.Art.portraitCanvas(G.Scenes.mateSpec(id), size); } catch (e) { return U.el('span'); } }

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
    else h += '<div class="cb-none">' + (c.id === 'hold' ? (o.yard ? '눌러서 쓰임을 정한다' : '조선소에서 고친다') : '비어 있음') + '</div>';
    el.innerHTML = h;
    var art = artImage('cabins/' + c.id, 'cb-card-art', '');
    if (art) { el.classList.add('has-art'); el.insertBefore(art, el.firstChild); }
    if (m) el.querySelector('.cb-face').appendChild(face(m.id, 36));
    return el;
  }

  function mateOptions(c, cur) {
    var s = S();
    var opts = s.mates.filter(function (m) { return G.MATE[m.id]; }).map(function (m) {
      return { label: G.MATE[m.id].name + (m === cur ? ' (지금 이 자리)' : ''), right: skillNote(m, c) + ' · ' + CB().placeName(m), value: m.id, icon: 'people', disabled: m === cur,
        desc: Object.keys(G.MATE[m.id].sk).map(function (k) { return G.SKILL_BY_ID[k].name + ' ' + G.MATE[m.id].sk[k]; }).join(' · ') };
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
    var v = await UI.choose(c.name + '에 둘 사람', mateOptions(c, cur), { width: 640, icon: c.icon, text: c.desc + (c.fx ? '<br><span class="muted">사람을 두면: ' + c.fx + '</span>' : '') });
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
      opts.push({ label: c.name, right: skillNote(m, c) + (o && o !== m ? ' · ' + G.MATE[o.id].name + '와 교대' : o === m ? ' · 지금 이 자리' : ''), value: 'r:' + t, icon: c.icon, desc: c.desc, disabled: o === m });
    });
    rooms.forEach(function (t, i) {
      if (t === 'hold') return;
      var c = G.CABIN[t], o = CB().occupant(i);
      opts.push({ label: c.name, right: skillNote(m, c) + (o && o !== m ? ' · ' + G.MATE[o.id].name + ' 대신' : o === m ? ' · 지금 이 자리' : ''), value: 'c:' + i, icon: c.icon, desc: c.desc + (c.fx ? ' — ' + c.fx : ''), disabled: o === m });
    });
    if (m.room != null || ROLE_OF_INV(m.role)) opts.push({ label: '자리에서 뺀다 (대기)', value: '-', icon: 'boot' });
    var v = await UI.choose(d.name + '의 자리', opts, { width: 620, text: Object.keys(d.sk).map(function (k) { return G.SKILL_BY_ID[k].name + ' ' + d.sk[k]; }).join(' · ') + ' — ' + loyalTag(m) });
    if (v == null) return;
    if (v === '-') { if (m.room != null) CB().place(m, null); if (ROLE_OF_INV(m.role)) m.role = 'none'; return; }
    if (v.indexOf('r:') === 0) setRole(m, ROLE_OF[v.slice(2)]); else CB().place(m, +v.slice(2));
  }
  function ROLE_OF_INV(role) { return role === 'first' || role === 'nav' || role === 'surveyor'; }

  /** 조선소: 선실 i를 다른 방으로 고친다 */
  async function remodel(i, c0) {
    var s = S(), rooms = CB().rooms(), now = rooms[i];
    var opts = G.CABINS.filter(function (c) { return !c.fixed; }).map(function (c) {
      return { label: c.name, right: c.id === now ? '지금 이 방' : c.cost ? U.num(c.cost) + '닢 · ' + c.days + '일' : '비운다', value: c.id, icon: c.icon, disabled: c.id === now, desc: c.desc + (c.fx ? ' — ' + c.fx : '') };
    });
    var v = await UI.choose('선실 고치기', opts, { width: 640, icon: 'hammer', text: '소지금 ' + U.num(s.player.gold) + '닢. 방마다 맞는 특기를 가진 부하를 두어야 힘을 냅니다.' });
    if (v == null) return;
    var c = G.CABIN[v];
    if (c.cost > s.player.gold) { UI.toast('돈이 모자랍니다. (' + U.num(c.cost) + '닢)', 'coin'); return; }
    if (c.cost && !await UI.confirm(G.CABIN[now].name + U.j(G.CABIN[now].name, '을/를').slice(G.CABIN[now].name.length) + ' ' + c.name + U.j(c.name, '으로/로').slice(c.name.length) + ' 고치겠습니까? (금화 ' + U.num(c.cost) + '닢 · ' + c.days + '일)', '고친다', '그만둔다')) return;
    s.player.gold -= c.cost;
    CB().remodel(i, v);
    if (c.days) await UI.fade(function () { G.Game.passDays(c.days); });
    UI.toast(c.id === 'hold' ? '선실을 비웠다.' : c.name + U.j(c.name, '을/를').slice(c.name.length) + ' 꾸몄다.', c.icon);
    if (G.Game.cityHud && c0) G.Game.cityHud(); else if (G.Game.refreshHud) G.Game.refreshHud();
  }

  /** 지금 힘을 내는 방들의 효과 풀이 */
  function effects() {
    var rooms = CB().rooms(), seen = {}, out = [];
    ['adjutant', 'helm', 'lookout'].concat(rooms).forEach(function (t) {
      if (seen[t]) return; seen[t] = 1;
      var c = G.CABIN[t], p = CB().power(t);
      if (c && c.fx && p > 0) out.push('<li><b>' + c.name + '</b> <i class="cb-pow">' + (Math.round(p * 10) / 10) + '</i> ' + c.fx + '</li>');
    });
    return out.length ? '<ul class="cb-fx">' + out.join('') + '</ul>' : '<div class="muted">아직 힘을 내는 방이 없습니다. 방에 맞는 특기를 가진 부하를 배치하십시오.</div>';
  }

  /** 끌어다 놓기: 부하를 방(또는 명단)에 놓았을 때 */
  async function dropMate(id, to) {
    var m = mateById(id); if (!m) return;
    if (to.k === 'none') { if (m.room != null) CB().place(m, null); if (ROLE_OF_INV(m.role)) m.role = 'none'; return; }
    if (to.k === 'captain') { UI.toast('함장실은 제독의 방입니다.', 'crown'); return; }
    if (to.k === 'room' && CB().rooms()[to.i] === 'hold') { UI.toast('빈 선실입니다. 조선소의 「선실 개조」에서 쓰임을 정하면 사람을 둘 수 있습니다.', 'hammer'); return; }
    if (m.role === 'captain' && !await UI.confirm(G.MATE[m.id].name + '은(는) 지금 다른 배의 선장입니다. 기함으로 데려오겠습니까?', '데려온다', '그만둔다')) return;
    if (to.k === 'fixed') setRole(m, ROLE_OF[to.type]);
    else if (to.k === 'room') CB().place(m, to.i);
  }

  /** 선실 화면을 연다. opts.yard = 조선소가 있는 도시(방을 고칠 수 있다) */
  CV.open = async function (opts) {
    opts = opts || {};
    var s = S();
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
        '<div class="cb-sub">부하 <small class="muted">— 눌러서 자리를 정한다</small></div>' +
        '<div class="cb-roster" style="max-height:' + (l.rosterH || 360) + 'px"></div>' +
        '<div class="cb-note muted">맞닿은 방에서 지내면 서로의 말을 더 빨리 익히고, 석 달·아홉 달·두 해를 함께하면 제독의 모국어를 한 단계씩 배운다. 자리가 없는 부하는 달마다 충성이 떨어진다.</div>' +
        '<div class="cb-sub">지금 힘을 내는 방</div>' + effects() + '</div></div>';
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
        el.onclick = function () { win.close(act); };
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
        var p = pin(c, i, spots[i - 1], m), cd = card(c, i, m, { pow: CB().powerAt(i), yard: opts.yard });
        [p, cd].forEach(function (el) { el.onclick = function () { win.close(act); }; dragFrom(el, m); dropOn(el, act); hover(el, i); });
        stage.appendChild(p); cards.appendChild(cd);
      });

      // 명단: 자리가 없는 사람을 먼저
      var ros = win.content.querySelector('.cb-roster');
      dropOn(ros, { k: 'none' });
      s.mates.filter(function (m) { return G.MATE[m.id]; }).map(function (m, k) {
        return { m: m, k: k, idle: (!m.role || m.role === 'none') && m.room == null };
      }).sort(function (a, b) { return (b.idle - a.idle) || (a.k - b.k); }).forEach(function (o) {
        var m = o.m, d = G.MATE[m.id];
        var chip = U.el('div', 'cb-mate' + (o.idle ? ' idle' : ''), '<span class="cb-face"></span><span class="cb-nm"><span class="n1">' + U.esc(d.name) + '</span><small>' + U.esc(CB().placeName(m)) + '</small>' + loyalTag(m) + '</span>');
        chip.querySelector('.cb-face').appendChild(face(m.id, 40));
        chip.title = Object.keys(d.sk).map(function (k) { return G.SKILL_BY_ID[k].name + ' ' + d.sk[k]; }).join(' · ');
        chip.onclick = function () { win.close({ k: 'mate', id: m.id }); };
        dragFrom(chip, m);
        ros.appendChild(chip);
      });
      if (!s.mates.length) ros.innerHTML = '<div class="muted">부하가 없습니다. 술집에서 부하를 찾아보십시오.</div>';

      var a = await win.result;
      if (!a) return;
      if (a.k === 'drop') await dropMate(a.id, a.to);
      else if (a.k === 'captain') await UI.say('함장실은 제독의 방입니다. 맞닿은 부관실 사람과는 말을 빨리 익힙니다.', G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {});
      else if (a.k === 'fixed') await pickFor(a.type);
      else if (a.k === 'mate') { var mm = mateById(a.id); if (mm) await pickRoom(mm); }
      else if (a.k === 'room') {
        var type = rooms[a.i];
        if (a.i === 0) await pickFor('deck', 0);
        else if (!opts.yard) { if (type === 'hold') UI.toast('빈 선실입니다. 조선소의 「선실 개조」에서 쓰임을 정할 수 있습니다.', 'hammer'); else await pickFor(type, a.i); }
        else if (type === 'hold') await remodel(a.i, opts.yard);
        else {
          var w = await UI.choose(G.CABIN[type].name, [{ label: '부하를 배치한다', value: 'p', icon: 'people' }, { label: '다른 방으로 고친다', value: 'r', icon: 'hammer' }], { width: 420 });
          if (w === 'p') await pickFor(type, a.i); else if (w === 'r') await remodel(a.i, opts.yard);
        }
      }
    }
  };
})(window.G = window.G || {});
