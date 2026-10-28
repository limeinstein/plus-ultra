/* 여급의 귀띔 — 사례를 하고 바다의 배·떠돌이 항해사의 행방을 묻는다 (G.MaidTip) 2026-10-22 사용자 요청
   · 술집 여급 메뉴 「사례하고 소식을 묻는다」(js/city/tavern.js T.maid). 호감(친밀도)이 minAff 아래면 아무것도 묻지 못한다.
   · 물을 수 있는 것: 상선대 · 군함대 · 해적 · 철새(떠돌이 항해사).
     - 배: 그 도시에서 멀지 않은 항구 앞바다를 짚어 「○○ 앞바다, 이곳에서 ○쪽으로 ○일쯤 · ○일 안에」라고 일러 준다.
       그 앞바다(near° 안)에 기한 안에 들어가면 그 배들이 정말 나타난다 (js/scenes/sea.js spawnNpcs → MT.spawn). 한 번 나타나면 끝.
       상선대는 짐이 무거워 느리고 전리품이 많다 · 해적은 이름난 두목이 붙기 쉽다(현상금) · 군함대는 어느 나라 배인지 미리 안다.
     - 철새: 지금 어느 도시 술집·여관에 있는지 (가까운 순, 호감이 높을수록 여러 명). 소식을 들으면 59일 체류, 같은 소식을 다시 들어도 남은 날만 안내한다.
   · 사례금: 종류마다 기본값 × 도시 크기 × 호감(낮을수록 비쌈) × 만난 횟수(자주 만날수록 쌈). 호감이 높을수록 기한이 넉넉하고 상선대 짐이 많다.
   · 같은 여급에게는 하루에 한 번만 묻는다. 묻고 나면 호감이 조금 오른다.
   · 알려 준 척수 그대로 나타난다 (해적 구성·이름난 선장이 척수를 바꾸지 않는다 — js/systems/corsairs.js·seacaptains.js 가 npc.tip 을 본다).
     나타난 배를 만나기 전에 입항·불러오기로 바다에서 사라지면, 기한 안에 그 앞바다에 다시 가면 또 나타난다 (2026-10-23 QA).
   · 저장: s.maidTips = [{id, kind, nation, lon, lat, port, from, to, n, rich, by, city, spawned, met}] · s.maids[여급].tipDay
   조정값: G.BALANCE.maidTip */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var MT = G.MaidTip = {};
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.maidTip = G.BALANCE.maidTip || {
    minAff: 20,                                   // 호감이 이만큼은 있어야 묻는다 (♥ 한 칸)
    base: { merchant: 320, navy: 260, pirate: 420, wander: 180 },
    sizeK: 0.15,                                  // 도시 크기 한 칸마다 +15%
    affK: [1.6, 0.65],                            // 호감 minAff → ×1.6, 호감 100 → ×0.65
    metK: 0.015, metMin: 0.55,                    // 만난 횟수 한 번마다 −1.5% (많아야 ×0.55까지)
    range: [3, 16],                               // 짚어 주는 앞바다: 이 도시에서 이만큼(°) 떨어진 항구
    near: 4.5,                                    // 그 앞바다에 이만큼(°) 다가가면 배가 나타난다
    days: 18, daysAff: 0.25,                      // 기한 = 가는 날 + days + 호감 × daysAff
    wanderN: [1, 2, 3], wanderD: 30               // 철새: 호감 20/50/80부터 알려 주는 사람 수 · 이만큼(°) 안
  };
  function K() { return G.BALANCE.maidTip; }
  function S() { return G.Game.state; }
  function list() { var s = S(); return s.maidTips || (s.maidTips = []); }
  function city(id) { return G.CITY_DATA[id]; }
  function dist(a, b) { return G.Geo.dist(a.lon, a.lat, b.lon, b.lat); }
  function dirName(a, b) {
    var ang = Math.atan2(b.lat - a.lat, G.Geo.wrapLon(b.lon - a.lon)) * 180 / Math.PI, n = ['동', '북동', '북', '북서', '서', '남서', '남', '남동'];
    return n[Math.round(((ang + 360) % 360) / 45) % 8] + '쪽';
  }
  function daysTo(a, b) { return Math.max(2, Math.round(dist(a, b) * 1.6)); }
  var KIND = {
    merchant: { label: '상선대의 행방', icon: 'sack', desc: '짐을 가득 실은 상선대가 지나는 앞바다' },
    navy: { label: '군함대의 행방', icon: 'flag', desc: '어느 나라 군함이 어디를 지키는지' },
    pirate: { label: '해적의 행방', icon: 'skull', desc: '해적 떼가 숨어 기다리는 앞바다' },
    wander: { label: '철새(떠돌이 항해사)의 행방', icon: 'people', desc: '어느 도시 술집에 머무는지' }
  };
  MT.KIND = KIND;

  /** 사례금 (호감·만난 횟수에 따라) */
  MT.price = function (kind, c, st) {
    var k = K(), aff = Math.max(k.minAff, st.aff || 0), a = (aff - k.minAff) / Math.max(1, 100 - k.minAff);
    var affK = k.affK[0] + (k.affK[1] - k.affK[0]) * a;
    var metK = Math.max(k.metMin, 1 - (st.met || 0) * k.metK);
    return Math.max(20, Math.round(k.base[kind] * (1 + (c.size || 1) * k.sizeK) * affK * metK / 10) * 10);
  };
  MT.canAsk = function (st) { return (st.aff || 0) >= K().minAff; };

  // ---------------------------------------------------------------- 앞바다 고르기
  function candPorts(c, filt) {
    var k = K(), y = S().date.y;
    return G.CITY_DATA.filter(function (p) {
      if (!p.port || p.id === c.id || !R.cityExists(p)) return false;
      var d = dist(c, p); if (d < k.range[0] || d > k.range[1]) return false;
      return !filt || filt(p, y);
    });
  }
  /** 항구 p 앞바다의 한 점 (뭍에서 조금 떨어진, 배가 다닐 물) */
  function offshore(p, toward) {
    var dock = p.dock || [p.lat, p.lon], s0 = G.Nav.nearestSea(dock[1], dock[0], 12) || [dock[1], dock[0]];
    var h = Math.atan2(toward.lat - s0[1], G.Geo.wrapLon(toward.lon - s0[0]));
    for (var r = 1.2; r >= 0.3; r -= 0.3) {
      for (var t = 0; t < 8; t++) {
        var a = h + (t % 2 ? 1 : -1) * Math.ceil(t / 2) * 0.5, x = s0[0] + Math.cos(a) * r, yy = s0[1] + Math.sin(a) * r;
        if (G.Geo.isSea(x, yy, 1)) return [G.Geo.wrapLon(x), yy];
      }
    }
    return G.Geo.isSea(s0[0], s0[1], 0.5) ? s0 : null;
  }
  function pickSpot(kind, c) {
    var s = S(), ports;
    if (kind === 'navy') ports = candPorts(c, function (p, y) { var o = R.cityOwner(p); return o && o !== '원주민' && G.Ships.navyNation(G.Ships.zone(p.lon, p.lat), y); });
    else ports = candPorts(c);
    if (!ports.length) return null;
    if (kind === 'pirate' && G.Scenes.sea && G.Scenes.sea.pirateChance) {
      ports = ports.map(function (p) { return { p: p, w: G.Scenes.sea.pirateChance(p.lon, p.lat) }; }).sort(function (a, b) { return b.w - a.w; }).slice(0, 5).map(function (x) { return x.p; });
    } else if (kind === 'merchant') {
      ports = ports.sort(function (a, b) { return (b.size || 1) - (a.size || 1); }).slice(0, 8);   // 큰 항구를 드나드는 상선대
    }
    for (var tries = 0; tries < 6; tries++) {
      var p = U.pick(ports), spot = offshore(p, c);
      if (spot) return { p: p, lon: spot[0], lat: spot[1] };
    }
    return null;
  }
  function nationFor(kind, p, spot) {
    var y = S().date.y, zone = G.Ships.zone(spot.lon, spot.lat);
    if (kind === 'pirate') return null;
    if (kind === 'navy') { var o = R.cityOwner(p); return o && o !== '원주민' ? o : G.Ships.navyNation(zone, y); }
    return (G.SeaFolk && G.SeaFolk.localNation ? G.SeaFolk.localNation(spot.lon, spot.lat) : null) || R.cityOwner(p) || G.Ships.navyNation(zone, y);
  }

  /** 배의 소식을 하나 만든다 → tip (못 만들면 null) */
  MT.make = function (kind, c, m, st) {
    var s = S(), k = K(), sp = pickSpot(kind, c); if (!sp) return null;
    var aff = st.aff || 0, go = daysTo(c, sp);
    var tip = {
      id: 't' + s.day + '_' + Math.floor(Math.random() * 1e6).toString(36), kind: kind, nation: nationFor(kind, sp.p, sp),
      lon: sp.lon, lat: sp.lat, port: sp.p.id, from: s.day, to: s.day + go + k.days + Math.round(aff * k.daysAff),
      n: kind === 'merchant' ? U.ri(2, 4) : kind === 'navy' ? U.ri(3, 5) : U.ri(2, 4), rich: kind === 'merchant' ? 1 + aff / 100 : 1,
      by: m.id, city: c.id
    };
    list().push(tip);
    return tip;
  };
  /** 소식 한 줄 */
  MT.text = function (tip) {
    var c = city(tip.city), p = city(tip.port), s = S(), left = Math.max(0, tip.to - s.day);
    var where = p.name + ' 앞바다 (' + (c ? c.name + '에서 ' + dirName(c, tip) + ' 약 ' + daysTo(c, tip) + '일' : '') + ')';
    var who = tip.kind === 'merchant' ? (tip.nation ? tip.nation + ' ' : '') + '상선대 ' + tip.n + '척' : tip.kind === 'navy' ? (tip.nation || '어느 나라') + ' 군함 ' + tip.n + '척' : (G.Ships ? G.Ships.pirateLabel(G.Ships.zone(tip.lon, tip.lat)) : '해적') + ' ' + tip.n + '척';
    return who + ' — ' + where + ' · ' + left + '일 안';
  };
  /** 아직 유효한 소식 (나타났지만 만나기 전에 바다에서 사라진 것도 — npcs: 지금 바다의 배들) */
  function onSea(t, npcs) { return (npcs || []).some(function (n) { return n.tip === t.id; }); }
  MT.active = function (npcs) { var s = S(); return list().filter(function (t) { return t.met == null && s.day <= t.to && (t.spawned == null || !npcs || !onSea(t, npcs)); }); };
  /** 알려 준 배를 실제로 만났다 (sea.js 마주침·신호) — 이제 끝난 소식 */
  MT.met = function (id) { var t = list().filter(function (x) { return x.id === id; })[0]; if (t) t.met = S().day; };

  // ---------------------------------------------------------------- 바다에서: 그 앞바다에 들어가면 배가 나타난다 (sea.js spawnNpcs)
  MT.spawn = function (npcs) {
    var s = S(), l = s.loc, k = K();
    var L = list(); if (!L.length) return null;
    s.maidTips = L.filter(function (t) { return t.met == null && s.day <= t.to + 30; });   // 만났거나 오래된 소식은 치운다
    var tip = MT.active(npcs || []).filter(function (t) { return G.Geo.dist(l.lon, l.lat, t.lon, t.lat) <= k.near; })[0];
    if (!tip) return null;
    tip.spawned = s.day;
    var zone = G.Ships.zone(tip.lon, tip.lat), y = s.date.y;
    var K0 = tip.kind === 'pirate' ? (G.Scenes.sea.pirateK ? G.Scenes.sea.pirateK() : 1) : Math.min(1, s.player.fame / ((G.BALANCE && G.BALANCE.pirateFame) || 4000));
    var Kx = tip.kind === 'merchant' ? Math.min(1.6, K0 * 0.6 + 0.3 * tip.rich) : tip.kind === 'navy' ? Math.max(0.5, K0) : K0;
    var lon = tip.lon, lat = tip.lat;
    if (G.Geo.dist(l.lon, l.lat, lon, lat) < 1.5) {   // 너무 가까우면 수평선 끝에 띄운다
      var a = Math.atan2(lat - l.lat, G.Geo.wrapLon(lon - l.lon)) || U.rf(0, 6.28);
      for (var r = 2.5; r <= 4; r += 0.5) { var x = l.lon + Math.cos(a) * r, yy = l.lat + Math.sin(a) * r; if (G.Geo.isSea(x, yy, 1)) { lon = x; lat = yy; break; } }
    }
    var npc = { id: 'tip_' + tip.id, kind: tip.kind, lon: lon, lat: lat, heading: U.rf(0, 6.28), n: tip.n, K: Kx, spd: tip.kind === 'merchant' ? U.rf(0.6, 0.85) : U.rf(0.9, 1.2), life: 30,
      hostile: tip.kind === 'pirate' || (tip.kind === 'navy' && (s.player.notoriety > 40 || (G.Hostile && G.Hostile.hunting(tip.nation)))), nation: tip.nation, zone: zone, tip: tip.id,
      rich: tip.rich };
    npc.ships = G.Ships.enemyTypes(tip.kind, zone, tip.nation, tip.n, Kx, y);
    if (G.SeaFolk) G.SeaFolk.decorate(npc, npcs || []);
    fitCount(npc, tip.n, Kx, y);   // 알려 준 척수 그대로
    if (tip.nation && tip.kind !== 'pirate') { npc.nation = tip.nation; if (G.SeaFolk.label) npc.label = G.SeaFolk.label(npc); }
    var mn = G.MAID && G.MAID[tip.by] ? G.MAID[tip.by].name : '여급';
    UI.toast(mn + U.jx(mn, '이/가') + ' 말한 ' + (npc.label || KIND[tip.kind].label) + U.jx(npc.label || '배', '이/가') + ' 수평선에 보인다!', tip.kind === 'pirate' ? 'skull' : 'ship', 5200);
    G.State.log(mn + '의 귀띔대로 ' + city(tip.port).name + ' 앞바다에서 ' + (npc.label || '배') + U.jx(npc.label || '배', '을/를') + ' 만났다.');
    return npc;
  };

  /** 이름난 선장이 붙어 한 척 늘었거나 구성이 바뀌었어도 알려 준 척수에 맞춘다 (기함 = 첫 배는 그대로) */
  function fitCount(npc, n, Kx, y) {
    var a = npc.ships || (npc.ships = []);
    while (a.length > n) a.pop();
    while (a.length < n) { var more = G.Ships.enemyTypes(npc.kind, npc.zone, npc.nation, 1, Kx, y); a.push(more[0] || a[a.length - 1] || 'caravel'); }
    if (npc.names && npc.names.length > n) npc.names.length = n;
    npc.n = a.length;
  }

  // ---------------------------------------------------------------- 철새의 행방
  MT.wanderers = function (c, st) {
    var k = K(), aff = st.aff || 0, n = aff >= 80 ? k.wanderN[2] : aff >= 50 ? k.wanderN[1] : k.wanderN[0], y = S().date.y;
    if (!G.MateMove) return [];
    return G.MateMove.nearby(c, function (m) { return m.wd && (!G.Frontier || !G.Frontier.mateReady || G.Frontier.mateReady(m, y)); }, k.wanderD).slice(0, n);
  };
  function skillLine(m) {
    var sk = m.sk || {}, ks = Object.keys(sk).sort(function (a, b) { return sk[b] - sk[a]; }).slice(0, 2);
    return ks.map(function (id) { var d = (G.SKILLS || []).filter(function (x) { return x.id === id; })[0]; return (d ? d.name : id) + ' ' + sk[id]; }).join(' · ');
  }

  // ---------------------------------------------------------------- 여급 메뉴
  /** say(text, emotion)·ask는 tavern.js T.maid 의 것을 받는다 */
  MT.ask = async function (c, m, st, say) {
    var s = S(), k = K();
    if (!MT.canAsk(st)) { await say('어머, 그런 이야기는… 아직 잘 모르는 분한테는 좀 그래요. 우리 좀 더 친해지면요.', 'warm'); return; }
    // 술집을 나갔다 들어오기만 하면 하루가 흘러 또 물을 수 있던 것 — 이번 입항(R.sameStay)에도 한 번으로 막는다 (QA 2026-10-23)
    if (G.R.sameStay(st.tipDay, st.tipPv)) { await say('오늘은 제가 아는 건 다 말씀드렸어요. 며칠 지나면 손님들한테 또 들을 거예요.', 'warm'); return; }
    var opts = Object.keys(KIND).map(function (kd) {
      var pr = MT.price(kd, c, st);
      return { label: KIND[kd].label, right: '금화 ' + U.num(pr) + '닢', value: kd, icon: KIND[kd].icon, desc: KIND[kd].desc, disabled: s.player.gold < pr };
    });
    var v = await UI.choose('사례하고 소식을 묻는다 — ' + m.name + ' (호감 ' + Math.round(st.aff) + ' · 만난 횟수 ' + (st.met || 0) + ')', opts,
      { width: 620, icon: 'coin', text: '호감이 높고 자주 만날수록 사례금이 싸고, 알려 주는 기한도 넉넉하다.' });
    if (!v) return;
    var price = MT.price(v, c, st);
    if (s.player.gold < price) { UI.toast('소지금이 모자랍니다.', 'coin'); return; }
    if (v === 'wander') {
      var ws = MT.wanderers(c, st);
      if (!ws.length) { await say('요즘은 떠돌이 항해사 이야기를 못 들었어요. 사례는 됐어요, 다음에 알려 드릴게요.', 'warm'); return; }
      s.player.gold -= price; st.tipDay = s.day; st.tipPv = G.R.stayNo(); st.aff = Math.min(100, (st.aff || 0) + 1);
      ws.forEach(function (w) { w.stayLeft = G.MateMove.hear(w.m.id, w.c.id); if (G.MateKnow) G.MateKnow.know(w.m.id, w.c.id, 'tip'); });
      await say(U.pick(['쉿, 손님들이 하는 얘기를 들었는데요… ', '고마워요. 제가 들은 건 이래요. ']) + ws.map(function (w) {
        return w.m.name + ' (' + (w.m.natName || '') + (w.m.typeName ? ' ' + w.m.typeName : '') + ') — ' + w.c.name + ' 술집, 여기서 ' + dirName(c, w.c) + ' 약 ' + daysTo(c, w.c) + '일 · 앞으로 ' + w.stayLeft + '일 동안 머물러요';
      }).join('\n'), 'warm');
      ws.forEach(function (w) { G.State.log(m.name + '의 귀띔: 철새 ' + w.m.name + '(' + skillLine(w.m) + ')이(가) ' + w.c.name + ' 술집에 머문다.'); });
      if (G.Game.refreshHud) G.Game.refreshHud();
      return;
    }
    var tip = MT.make(v, c, m, st);
    if (!tip) { await say('요즘은 그쪽 소식이 뚝 끊겼어요. 사례는 됐어요.', 'warm'); return; }
    s.player.gold -= price; st.tipDay = s.day; st.tipPv = G.R.stayNo(); st.aff = Math.min(100, (st.aff || 0) + 1);
    var lines = {
      merchant: ['짐을 가득 실은 배들이 지나간대요. 선원들이 술값을 미리 당겨 쓸 만큼요. ', '큰 장사 마치고 돌아가는 상선대가 있대요. '],
      navy: ['군함들이 그쪽 바다를 지킨대요. 괜히 마주치지 마세요. ', '군함이 순찰을 돈대요. 그 나라와 사이가 나쁘면 피하세요. '],
      pirate: ['그쪽에 해적들이 숨어서 기다린대요. 정말 조심하세요… 아니면, 잡으러 가시는 거예요? ', '해적 떼가 그 앞바다에서 배를 노린대요. ']
    };
    await say(U.pick(lines[v]) + '\n' + MT.text(tip), v === 'pirate' ? 'sad' : 'warm');
    G.State.log(m.name + '의 귀띔: ' + MT.text(tip));
    UI.toast('수첩 「할 일」에 적었다 — ' + city(tip.port).name + ' 앞바다', 'scroll', 4200);
    if (G.Game.refreshHud) G.Game.refreshHud();
  };

  /** 수첩 「할 일」 — 여급의 귀띔 (아직 유효한 것) */
  MT.html = function () {
    var s = S(); if (!s || !s.maidTips) return '';
    var L = MT.active(); if (!L.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">여급의 귀띔</h4><ul>' + L.map(function (t) {
      var mn = G.MAID && G.MAID[t.by] ? G.MAID[t.by].name : '여급';
      return '<li>' + U.esc(MT.text(t)) + ' <small class="muted">(' + U.esc(mn) + ')</small></li>';
    }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._maidTipHtml) { G.Court._maidTipHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + MT.html(); }; }
})(window.G = window.G || {});
