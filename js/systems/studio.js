/* 화실·조각실 (G.Studio) — 기함의 화실에 그림에 밝은 부하를, 조각실에 세공에 밝은 부하를 두면 날마다 일이 쌓여
   미술품(동아시아 사람은 동양 서화)·조각품을 짐칸에 싣는다. 실존한 화가·조각가는 틈틈이 명작을 완성해 제독에게 바친다.
   명작은 발견물처럼 이름·풀이·값을 가진 보물(소지품)이고, 받는 순간 사교 명성이 오른다 (G.Fame.add('so')).
   표: js/data/masterworks.js · 방: js/data/cabins.js (studio·sculpt) · 조정값: G.BALANCE.studio (js/data/base.js)

   저장 상태 (옛 저장에는 없다 — 쓸 때 만든다)
   · 부하: m.stP = 미술품·조각품 일감, m.mwP = 명작 일감, m.stFull = 짐칸이 차서 알린 적이 있다
   · state.studio = { pend: [바칠 명작], works: [받은 명작 기록], made: {부하 id: {paint: n, sculpt: n}}, home: [짐칸이 없어 집에 걸어 둔 명작] } */
(function (G) {
  'use strict';
  var U = G.U, ST = {};
  G.Studio = ST;
  var KIND = { studio: 'paint', sculpt: 'sculpt' };
  var EAST_LANG = { 7: 1, 13: 1, 14: 1 };      // 중국어 · 동아시아토착어(일본) · 조선어 → 동양 서화
  function S() { return G.Game && G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.studio) || { need: 60, qty: [1, 1, 2, 3], mwNeed: 360, value: [3000, 5], sculptK: 1.2, fame: [40, 0.06], generic: 3 }; }
  function st(s) { s = s || S(); return s.studio || (s.studio = { pend: [], works: [], made: {}, home: [] }); }
  function R() { return G.R; }

  /** 실존 인물인가 (이야기·전설·옛이야기·마녀·떠돌이가 아닌, 지명도가 있는 사람) */
  ST.historic = function (d) { return !!(d && (d.fame || 0) >= 100 && !d.tale && !d.fairy && !d.witch && !d.legend); };
  /** 이 부하가 이 방(paint|sculpt)에서 남길 명작 목록 (없으면 []) */
  ST.worksOf = function (id, kind) {
    var d = G.MATE[id]; if (!d || !ST.historic(d)) return [];
    var T = G.MASTERWORKS && G.MASTERWORKS[id];
    if (T && T[kind]) return T[kind];
    if (kind === 'paint' && ((d.sk && d.sk.art) || 0) >= 3) return ((G.MASTERWORKS_GENERIC || {}).paint || []).slice(0, B().generic || 3);
    return [];
  };
  /** 이 부하가 이 방에서 명작을 남길 수 있는가 (아직 남은 작품이 있나) */
  ST.master = function (m, kind) { var made = (st().made[m.id] || {})[kind] || 0; return ST.worksOf(m.id, kind).length > made; };
  /** 명작 하나의 값과 사교 명성 */
  ST.worth = function (id, kind) {
    var b = B(), f = (G.MATE[id] && G.MATE[id].fame) || 0;
    var v = (b.value[0] + f * b.value[1]) * (kind === 'sculpt' ? (b.sculptK || 1) : 1);
    return { value: Math.round(v / 100) * 100, so: Math.round(b.fame[0] + f * b.fame[1]) };
  };
  /** 화실에서 그리는 물건: 동아시아 사람은 동양 서화 */
  ST.goodOf = function (m, kind) {
    if (kind === 'sculpt') return 'sculpture';
    var li = G.Cabins && G.Cabins.nativeLang ? G.Cabins.nativeLang(m) : null;
    return li != null && EAST_LANG[li] && G.GOOD.eaart ? 'eaart' : 'art';
  };

  // ---------------------------------------------------------------- 글 채우기
  function portName(s) {
    var l = s.loc || {}, id = l.city != null ? l.city : l.from != null ? l.from : s.voyage && s.voyage.from != null ? s.voyage.from : s.player.home;
    var c = id != null && G.CITY_DATA[id]; return c ? c.name : '고향';
  }
  function seaName(s) {
    var l = s.loc || {};
    if (l.mode === 'sea' && l.lon != null && G.Ships && G.Ships.zone) return (G.Ships.ZONE_NAME || {})[G.Ships.zone(l.lon, l.lat)] || '먼바다';
    if (l.lon != null && G.Ships && G.Ships.zone) return (G.Ships.ZONE_NAME || {})[G.Ships.zone(l.lon, l.lat)] || '먼바다';
    return '먼바다';
  }
  function fill(t, s, who) {
    var adm = (R() && R().fullName ? R().fullName() : s.player.name) || '제독';
    return String(t).replace(/\{admiral\}/g, adm).replace(/\{port\}/g, portName(s)).replace(/\{sea\}/g, seaName(s))
      .replace(/\{who\}\{이\/가\}/g, who + U.jx(who, '이/가')).replace(/\{who\}/g, who);
  }

  // ---------------------------------------------------------------- 날마다
  /** 하루 (js/systems/world.js): 일감이 차면 짐을 싣고, 명작은 바칠 차례로 넣는다. 알림 [{icon, text}]을 돌려준다 */
  ST.daily = function () {
    var s = S(), out = []; if (!s || !s.mates || !s.fleet || !s.fleet.ships.length || !G.Cabins) return out;
    var CB = G.Cabins, rooms = CB.rooms(), b = B();
    rooms.forEach(function (type, i) {
      var kind = KIND[type]; if (!kind) return;
      var m = CB.occupant(i), d = m && G.MATE[m.id]; if (!d) return;
      var lv = R().mateSkill(m, kind === 'paint' ? 'art' : 'craft'); if (lv <= 0) return;   // 그림·세공을 모르면 손을 놓고 있다
      var pw = CB.powerAt(i); if (pw <= 0) return;
      // 1) 미술품·조각품
      m.stP = (m.stP || 0) + pw;
      if (m.stP >= b.need) {
        var gid = ST.goodOf(m, kind), want = b.qty[Math.min(3, lv)] || 1;
        var room = G.Cargo && G.Cargo.room ? G.Cargo.room(gid) : want, q = Math.min(want, room);
        if (q > 0) {
          var f = s.fleet, cg = f.cargo[gid];
          if (cg) { cg.cost = Math.round(cg.cost * cg.q / (cg.q + q)); cg.q += q; } else f.cargo[gid] = { q: q, cost: 0, from: null, d: s.day, made: m.id };
          m.stP -= b.need; m.stFull = false;
          out.push({ icon: kind === 'paint' ? 'palette' : 'bust', text: d.name + U.jx(d.name, '이/가') + ' ' + G.CABIN[type].name + '에서 ' + G.GOOD[gid].name + ' ' + q + '통을 ' + (kind === 'paint' ? '그려' : '깎아') + ' 짐칸에 실었다.' });
        } else {
          m.stP = b.need;                                   // 짐칸이 비면 그때 싣는다
          if (!m.stFull) { m.stFull = true; out.push({ icon: 'sack', text: d.name + U.jx(d.name, '이/가') + ' 만든 ' + G.GOOD[gid].name + U.jx(G.GOOD[gid].name, '을/를') + ' 실을 짐칸이 없다.' }); }
        }
      }
      // 2) 명작 — 실존한 화가·조각가만, 남은 작품이 있을 때
      if (ST.master(m, kind) && !st(s).pend.some(function (p) { return p.by === m.id; })) {
        m.mwP = (m.mwP || 0) + pw;
        if (m.mwP >= b.mwNeed) { m.mwP = 0; ST.make(m.id, kind); }
      }
    });
    return out;
  };
  /** 명작 하나를 완성해 바칠 차례에 넣는다 (시험에서도 부른다) */
  ST.make = function (id, kind) {
    var s = S(), S2 = st(s), d = G.MATE[id]; if (!d) return null;
    var list = ST.worksOf(id, kind), made = S2.made[id] || (S2.made[id] = {}), n = made[kind] || 0;
    var w = list[n]; if (!w) return null;
    made[kind] = n + 1;
    var wt = ST.worth(id, kind);
    var p = { by: id, kind: kind, n: n, name: fill(w[0], s, d.name), desc: fill(w[1], s, d.name), value: wt.value, so: wt.so, date: { y: s.date.y, m: s.date.m, d: s.date.d } };
    S2.pend.push(p);
    return p;
  };
  ST.pending = function () { var s = S(); return !!(s && s.studio && s.studio.pend.length); };

  // ---------------------------------------------------------------- 바치기
  /** 명작 그림: 전용 그림(images/masterworks/<부하 id>_<kind><n>)이 없으면 코드로 그린 액자 */
  function drawWork(p) {
    var cv = document.createElement('canvas'), W = 420, H = 300; cv.width = W; cv.height = H;
    var x = cv.getContext('2d'), seed = 0, i;
    for (i = 0; i < p.name.length; i++) seed = (seed * 31 + p.name.charCodeAt(i)) >>> 0;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    if (p.kind === 'sculpt') {
      var g = x.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H / 2, W * 0.7); g.addColorStop(0, '#5a4a38'); g.addColorStop(1, '#1e1610'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      var bronze = /청동/.test(p.name), lac = /칠기|상자/.test(p.name);
      var c0 = lac ? '#1a1412' : bronze ? '#7a5a32' : '#e8e2d6', c1 = lac ? '#3a2a1a' : bronze ? '#3e2a14' : '#a8a092';
      x.fillStyle = '#3a2e22'; x.fillRect(W / 2 - 70, H - 46, 140, 30); x.fillStyle = '#2a2018'; x.fillRect(W / 2 - 80, H - 20, 160, 12);
      var gg = x.createLinearGradient(W / 2 - 60, 0, W / 2 + 60, 0); gg.addColorStop(0, c1); gg.addColorStop(0.45, c0); gg.addColorStop(1, c1); x.fillStyle = gg;
      if (lac) { x.fillRect(W / 2 - 90, H - 120, 180, 74); x.strokeStyle = '#d8b050'; x.lineWidth = 2; for (i = 0; i < 4; i++) { x.beginPath(); x.moveTo(W / 2 - 84, H - 92 + i * 9); for (var k = 0; k <= 12; k++) x.lineTo(W / 2 - 84 + k * 14, H - 92 + i * 9 + Math.sin(k * 1.3 + i) * 5); x.stroke(); } }
      else {
        x.beginPath(); x.ellipse(W / 2, 74, 26, 32, 0, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.moveTo(W / 2 - 18, 100); x.quadraticCurveTo(W / 2 - 64 - rnd() * 10, 150, W / 2 - 52, H - 46); x.lineTo(W / 2 + 52, H - 46); x.quadraticCurveTo(W / 2 + 60 + rnd() * 10, 150, W / 2 + 18, 100); x.closePath(); x.fill();
      }
    } else {
      var east = /두루마리|병풍|수묵|진경|화첩|초충|산수|서른여섯|포도|고목/.test(p.name);
      var sky = x.createLinearGradient(0, 0, 0, H * 0.62);
      if (east) { sky.addColorStop(0, '#efe6cf'); sky.addColorStop(1, '#d8cba8'); } else { sky.addColorStop(0, ['#6f8fb0', '#c8925a', '#8aa0b8'][Math.floor(rnd() * 3)]); sky.addColorStop(1, '#e8d4a8'); }
      x.fillStyle = sky; x.fillRect(0, 0, W, H);
      var sea = x.createLinearGradient(0, H * 0.6, 0, H); sea.addColorStop(0, east ? '#9a947e' : '#3a5a6a'); sea.addColorStop(1, east ? '#6a6450' : '#1a2e3a');
      x.fillStyle = sea; x.fillRect(0, H * 0.6, W, H * 0.4);
      x.strokeStyle = east ? 'rgba(40,36,30,.55)' : 'rgba(240,240,230,.35)'; x.lineWidth = 1.5;
      for (i = 0; i < 9; i++) { var yy = H * 0.64 + i * 12; x.beginPath(); x.moveTo(0, yy); for (var k2 = 0; k2 <= 20; k2++) x.lineTo(k2 * W / 20, yy + Math.sin(k2 * 0.9 + i) * 3); x.stroke(); }
      x.fillStyle = east ? 'rgba(40,36,30,.55)' : '#3a3428';                       // 먼 산
      x.beginPath(); x.moveTo(0, H * 0.6); for (i = 0; i <= 8; i++) x.lineTo(i * W / 8, H * 0.6 - (east ? 40 : 18) * rnd()); x.lineTo(W, H * 0.6); x.fill();
      var sx = W * (0.3 + rnd() * 0.4), sy = H * 0.66;                                // 배
      x.fillStyle = east ? '#2a2620' : '#2a1e14'; x.beginPath(); x.moveTo(sx - 40, sy); x.lineTo(sx + 42, sy); x.lineTo(sx + 30, sy + 14); x.lineTo(sx - 30, sy + 14); x.fill();
      x.fillRect(sx - 1, sy - 62, 3, 62);
      x.fillStyle = east ? 'rgba(250,246,232,.9)' : '#f2e8d2'; x.beginPath(); x.moveTo(sx + 3, sy - 58); x.quadraticCurveTo(sx + 34, sy - 34, sx + 3, sy - 8); x.fill(); x.beginPath(); x.moveTo(sx - 2, sy - 52); x.quadraticCurveTo(sx - 30, sy - 30, sx - 2, sy - 10); x.fill();
      if (east) { x.fillStyle = '#b8322a'; x.fillRect(W - 46, H - 70, 18, 18); }       // 낙관
    }
    return cv;
  }
  /** 명작의 그림 주소 (전용 그림 images/masterworks/<부하 id>_<kind><n>, 없으면 코드로 그린 그림) — 박물관에서도 쓴다. it: 바칠 차례의 명작이나 소지품의 명작 */
  ST.picture = function (it) {
    var p = { by: it.by, kind: it.kind || it.wk, n: it.n || 0, name: it.name || '' }, key = 'masterworks/' + p.by + '_' + p.kind + p.n;
    if (G.Img && G.Img.has(key)) return G.Img.src(key);
    try { return drawWork(p).toDataURL('image/png'); } catch (e) { return ''; }
  };
  /** 명작 카드 (UI.alert에 넣는 글) */
  function card(p) {
    var d = G.MATE[p.by], key = 'masterworks/' + p.by + '_' + p.kind + p.n, src = G.Img && G.Img.has(key) ? G.Img.src(key) : null;
    if (!src) { try { src = drawWork(p).toDataURL('image/png'); } catch (e) { src = ''; } }
    return '<div class="mw-card"><div class="mw-frame' + (p.kind === 'sculpt' ? ' sculpt' : '') + '">' + (src ? '<img class="mw-img" alt="" src="' + src + '">' : '') + '</div>' +
      '<div class="mw-name">' + U.esc(p.name) + '</div><div class="mw-by">' + U.esc(d ? d.name : '') + ' · ' + (p.kind === 'sculpt' ? '조각' : '그림') + ' · ' + p.date.y + '년</div>' +
      '<div class="mw-desc">' + U.esc(p.desc) + '</div>' +
      '<div class="mw-gain">값 금화 <b>' + U.num(p.value) + '</b>닢 · 사교 명성 <b>+' + p.so + '</b></div></div>';
  }
  /** 바칠 명작이 있으면 화가가 들고 와 바친다 (바다의 하루 끝 · 도시에 들어설 때). 바쳤으면 true */
  ST.present = async function () {
    var s = S(), UI = G.UI; if (!s || !s.studio || !s.studio.pend.length || ST._busy) return false;
    ST._busy = true;
    try {
      while (s.studio.pend.length) {
        var p = s.studio.pend.shift(), d = G.MATE[p.by]; if (!d) continue;
        var sp = { name: d.name, portrait: G.Scenes.mateSpec(p.by), half: G.Img.chain.mateHalf ? G.Img.chain.mateHalf(p.by) : null, lang: 3 };
        await UI.say(U.pick((G.MASTERWORK_LINES || {})[p.kind] || ['제독, 받아 주십시오.']), sp);
        await UI.alert(card(p), '명작 — ' + d.name);
        var item = { id: 'masterwork', name: p.name, desc: p.desc + ' — ' + d.name + ' 작 (' + p.date.y + '년)', value: p.value, mw: true, by: p.by, wk: p.kind, n: p.n, y: p.date.y };
        var kept = G.R.addItem('masterwork', item);
        if (!kept) s.studio.home.push(item);
        s.studio.works.push({ by: p.by, kind: p.kind, name: p.name, value: p.value, so: p.so, date: p.date, home: !kept });
        if (G.Fame) G.Fame.add('so', p.so); else s.player.fame += p.so;
        G.State.log(d.name + U.jx(d.name, '이/가') + ' 명작 ' + p.name + U.jx(p.name, '을/를') + ' 완성해 제독에게 바쳤다. (사교 명성 +' + p.so + ')');
        UI.toast(p.name + ' — 사교 명성 +' + p.so + (kept ? ' · 소지품에 넣었다 (값 ' + U.num(p.value) + '닢)' : ' · 소지품이 가득해 고향 집에 걸어 두었다'), p.kind === 'sculpt' ? 'bust' : 'palette', 6000);
      }
    } catch (e) { console.error(e); }
    ST._busy = false;
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
  /** 수첩·도감용: 받은 명작 목록 */
  ST.works = function () { var s = S(); return s && s.studio ? s.studio.works.slice() : []; };

  // 소지품 정의: 명작 (값·이름·풀이는 소지품 칸마다 따로)
  if (G.ITEMS && G.ITEM && !G.ITEM.masterwork) {
    var def = { id: 'masterwork', name: '명작', kind: 'treasure', price: 5000, rare: true, reg: [], desc: '함께 항해한 화가·조각가가 완성해 바친 작품.' };
    G.ITEMS.push(def); G.ITEM.masterwork = def;
  }
})(window.G = window.G || {});
