/* 개척 도시 (G.Colony) — 자료·대사·조정값: js/data/colony.js · 건물(감찰관 저택·총독부): js/city/colonyhall.js
   ■ 언제: 통합 명성이 G.BALANCE.colony.fame[n](200,000 · 400,000)을 넘을 때마다 제독의 나라 국왕이 부른다 (소식 · 왕궁 메뉴 「새 도시 개척」).
   ■ 흐름 (도시마다 state.colony.list[i].stage)
     부름 → 왕궁에서 세울 곳을 고른다 (나라가 진출한 바다: 에스파냐 = 아메리카, 포르투갈 = 아프리카·인도·동남아시아) → stage 0 「○○ 개척지」(항구만)
     0 → 개척지에 입항하면 제독이 이름을 지어 도시를 세운다 → 1 항구·술집·교역소·여관(+성문)
     1·2·3 → 개척민이 곡물(밀)이나 목재를 청한다 — 항구 메뉴 「개척 물자를 넘긴다」 → 2 시장·교회 / 3 조합·감찰관 저택 / 4 총독부
     4 → 총독부에서 총독에 오른다(칭호 「○○ 총독」) · 아내와 아이들을 총독 관저로 모실 수 있다(state.player.seat = 그 도시)
   ■ 개척 도시는 자료(G.CITY_DATA)에 없는 도시라, 일지를 열 때·새로 시작할 때 G.Colony.apply()가 1000번부터 끼워 넣는다 (옛 저장·자료와 번호가 겹치지 않게).
   ■ 저장: state.colony = { list: [{ id, key, nat, owner, name, stage, founded, need: {good, qty}, nextDay, gov, built: [] }], call: { sp, day, heard, n } }
     없으면 아직 일어나지 않은 것 (옛 저장 그대로 열린다). state.player.seat — 가족이 사는 도시 (없으면 고향 player.home). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var CO = {};
  G.Colony = CO;
  var L = G.COLONY_LINES, STAGES = G.COLONY_STAGES, BN = G.COLONY_BUILD_NAMES;
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.colony) || {}; }
  function SP() { return G.Sponsor; }

  // ================================================================ 자료
  CO.sites = function () { return G.COLONY_SITES || []; };
  CO.site = function (key) { return CO.sites().filter(function (x) { return x.key === key; })[0] || null; };
  CO.st = function () { var s = S(); return s && s.colony ? s.colony : null; };
  function ensure() { var s = S(); if (!s.colony) s.colony = { list: [], call: null }; return s.colony; }
  CO.list = function () { var c = CO.st(); return c ? c.list : []; };
  CO.get = function (id) { var l = CO.list(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; };
  CO.of = function (c) { return c && c.colony != null ? CO.get(c.colony) : null; };
  CO.isColony = function (c) { return !!(c && c.colony != null); };
  /** 제독의 나라 이름(그 해 고향을 다스리는 나라 — 「포르투갈」·「카스티야」·「에스파냐」)과 나라 기호 */
  function natCode() { var p = S().player; return p.nation === 'ES' ? 'ES' : p.nation === 'PT' ? 'PT' : (G.CITY_DATA[p.home] && G.CITY_DATA[p.home].lang === 1 ? 'PT' : 'ES'); }
  CO.natCode = natCode;
  function natName() { var s = S(), hc = G.CITY_DATA[s.player.home]; return (hc && R.cityOwner(hc)) || (natCode() === 'PT' ? '포르투갈' : '카스티야'); }
  CO.natName = natName;
  /** 군주 이름 (자료의 덧붙임 「(…와 공동 국왕, …)」은 뺀다) */
  function kingName(sp) { return String(SP().holderName(sp) || '').replace(/\s*\([^)]*\)/g, '').trim(); }
  function fill(t, extra) {
    var s = S(), cl = CO.st(), sp = cl && cl.call && G.SPONSOR[cl.call.sp], o = { name: s.player.name, king: sp ? kingName(sp) + ' ' + SP().honor(sp) : '국왕 전하', city: sp ? G.CITY_DATA[sp.city].name : '' };
    for (var k in extra || {}) o[k] = extra[k];
    return String(t).replace(/\{(\w+)\}/g, function (m, a) { return o[a] != null ? o[a] : m; });
  }
  CO.fill = fill;
  async function say(lines, who, extra) { lines = [].concat(lines); for (var i = 0; i < lines.length; i++) await UI.say(fill(lines[i], extra), who); }
  CO.say = say;
  /** 개척을 맡기는 군주: 제독의 나라 군주 자리 가운데 지금 계신 분 */
  function crown() {
    var nat = natCode(), ids = (G.COURT && G.COURT.realms[nat] && G.COURT.realms[nat].sponsors) || [nat === 'PT' ? 'pt_king' : 'es_crown'];
    var seat = G.Dominion && G.Dominion.SEAT[natName()]; if (seat && ids.indexOf(seat) < 0) ids = [seat].concat(ids);
    for (var i = 0; i < ids.length; i++) { var sp = G.SPONSOR[ids[i]]; if (sp && SP().present(sp)) return sp; }
    return null;
  }
  CO.crown = crown;
  function goodName(id) { return (G.GOOD[id] && G.GOOD[id].name) || id; }
  function kindsOf(stage) { return (STAGES[stage] && STAGES[stage].builds) || []; }
  CO.kindsOf = kindsOf;
  function listName(kinds) { return kinds.map(function (k) { return BN[k] || k; }).join(' · '); }

  // ================================================================ 도시 자료에 끼워 넣기
  var injected = [];
  /** 이 게임(state)의 개척 도시를 G.CITY_DATA에 넣는다 — 지난 게임의 것은 걷어 낸다. 새 게임·일지 열기 때 부른다 */
  CO.apply = function () {
    injected.forEach(function (id) { if (G.CITY_DATA[id] && G.CITY_DATA[id].colony != null) delete G.CITY_DATA[id]; });
    injected = [];
    var s = S(); if (!s) return;
    CO.list().forEach(function (e) { G.CITY_DATA[e.id] = cityOf(e); injected.push(e.id); });
    if (s.player && s.player.seat != null && !G.CITY_DATA[s.player.seat]) delete s.player.seat;   // 사라진 도시에 가족을 두지 않는다
  };
  function cityOf(e) {
    var site = CO.site(e.key) || {}, c = G.CITY_DATA[e.id] && G.CITY_DATA[e.id].colony === e.id ? G.CITY_DATA[e.id] : { id: e.id };
    c.name = e.name || ((site.place || '새') + ' 개척지');
    c.lat = site.lat; c.lon = site.lon; c.dock = site.dock;
    c.port = 1; c.region = site.area; c.lang = e.nat === 'PT' ? 1 : 0; c.rel = 'C';
    c.size = e.stage >= 3 ? 2 : 1; c.style = 'co'; c.nation = e.owner || (e.nat === 'PT' ? '포르투갈' : '카스티야');
    c.founded = 0; c.flags = ''; c.colony = e.id; c.bgRef = site.ref;
    c.goods = e.stage >= 1 ? (site.goods || []).filter(function (g) { return G.GOOD && G.GOOD[g]; }) : [];
    return c;
  }
  CO.sync = function (e) { var c = cityOf(e); G.CITY_DATA[e.id] = c; if (injected.indexOf(e.id) < 0) injected.push(e.id); return c; };

  /** 개척 도시의 시설 (rules.js R.facilities) */
  CO.facilities = function (c) {
    var e = CO.of(c), st = e ? e.stage : 0;
    return { harbor: true, trade: st >= 1, tavern: st >= 1, inn: st >= 1, gate: st >= 1, church: st >= 2, market: st >= 2, shipyard: false, palace: false, library: false, guild: st >= 3, mansion: [], inspector: st >= 3, govhall: st >= 4 };
  };
  /** 개척 도시의 거리·메뉴의 건물 (city.js C.buildings) */
  CO.buildings = function (c) {
    var e = CO.of(c), st = e ? e.stage : 0, s = S(), out = [{ kind: 'harbor', name: '항구', icon: 'anchor' }];
    if (st >= 1) out.push({ kind: 'trade', name: '교역소', icon: 'scales' }, { kind: 'tavern', name: '술집', icon: 'mug' }, { kind: 'inn', name: '여관', icon: 'bed' });
    if (st >= 2) out.push({ kind: 'market', name: '시장', icon: 'sack' }, { kind: 'church', name: '교회', icon: 'church' });
    if (st >= 3) out.push({ kind: 'guild', name: '조합', icon: 'seal' }, { kind: 'inspector', name: '감찰관 저택', icon: 'mansion' });
    if (st >= 4) out.push({ kind: 'govhall', name: '총독부', icon: 'crown' });
    if (st >= 1) out.push({ kind: 'gate', name: '성문', icon: 'gate' });
    if (st >= 4 && s.player.seat === c.id) out.push({ kind: 'home', name: '총독 관저', icon: 'house' });
    return out;
  };
  /** 가족이 사는 도시 (총독 관저로 모셨으면 그 개척 도시, 아니면 고향) */
  CO.seat = function () { var s = S(), p = s && s.player; if (!p) return null; var c = p.seat != null && G.CITY_DATA[p.seat]; return c && c.colony != null ? p.seat : p.home; };

  // ================================================================ 날마다: 부름 · 개척민의 청
  CO.daily = function () {
    var s = S(), out = [], b = K(); if (!s || !s.player) return out;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return out;
    if (G.Story && G.Story.active && G.Story.active()) return out;   // 이야기 모드는 아버지를 찾는 이야기 — 개척은 하지 않는다
    var cl = CO.st(), n = cl ? cl.list.length : 0, th = b.fame || [];
    if ((!cl || !cl.call) && n < th.length && (s.player.fame || 0) >= th[n] && CO.sites().some(function (x) { return x.nat === natCode() && !used(x.key); })) {
      var sp = crown();
      if (sp) {
        cl = ensure(); cl.call = { sp: sp.id, day: s.day, n: n };
        var msg = fill(n ? L.newsAgain : L.news);
        out.push({ icon: 'crown', text: msg, history: true });
        G.State.log(msg);
      }
    }
    CO.list().forEach(function (e) {
      if (e.stage >= 1 && e.stage <= 3 && !e.need && e.nextDay != null && s.day >= e.nextDay) {
        e.need = newNeed(e); e.nextDay = null;
        out.push({ icon: 'seal', text: fill(L.askNews, { colony: e.name, good: goodName(e.need.good), qty: e.need.qty }), history: true });
      }
    });
    // 부름을 내린 군주가 바뀌면 지금 계신 분이 이어 받는다
    if (cl && cl.call && !SP().present(G.SPONSOR[cl.call.sp])) { var sp2 = crown(); if (sp2) cl.call.sp = sp2.id; }
    return out;
  };
  function used(key) { return CO.list().some(function (e) { return e.key === key; }); }
  function newNeed(e) {
    var b = K(), gs = b.goods || ['wheat', 'timber'], step = e.stage - 1;   // stage 1 → 물자 ①
    var good = gs[(U.strHash(e.key + e.stage) >>> 0) % gs.length];
    if (e.lastGood && gs.length > 1 && good === e.lastGood && U.chance(0.6)) good = gs[(gs.indexOf(good) + 1) % gs.length];   // 같은 것만 잇달아 청하지 않게
    return { good: good, qty: (b.qty || [40, 70, 100])[Math.max(0, Math.min(2, step))] };
  }

  // ================================================================ 왕궁
  CO.palaceItems = function (sp) {
    var cl = CO.st(); if (!cl || !cl.call || !sp || sp.id !== cl.call.sp) return [];
    return [{ label: '새 도시 개척', icon: 'flag', sub: '부르심', onClick: function () { return CO.audience(sp); } }];
  };
  CO.onEnter = async function (sp) {
    var cl = CO.st(); if (!cl || !cl.call || !sp || sp.id !== cl.call.sp || cl.call.heard) return false;
    await CO.audience(sp); return true;
  };
  CO.audience = async function (sp) {
    var cl = CO.st(), s = S(); if (!cl || !cl.call) return;
    var who = SP().speaker(sp);
    if (!cl.call.heard) { cl.call.heard = 1; await say(cl.list.length ? L.again : L.plea, who); }
    var v = await UI.ask(fill(L.ask), [{ label: '세울 곳을 고른다', value: 'pick' }, { label: '조금 더 생각해 본다', value: 'later' }], who);
    if (v !== 'pick') { await say(L.later, who); return; }
    var key = await CO.chooseSite();
    if (!key) { await say(L.later, who); return; }
    var site = CO.site(key), e = CO.plant(key);
    await say(L.chosen, who, { place: site.place, grant: U.num(K().grant || 0) });
    UI.toast('해도에 「' + G.CITY_DATA[e.id].name + '」 — ' + site.name + '. 그곳에 입항하면 도시를 세운다.', 'flag', 7000);
  };
  /** 개척지를 정한다: 도시 자료에 「○○ 개척지」(항구만)를 넣고 해도에 올린다 */
  CO.plant = function (key) {
    var s = S(), cl = ensure(), site = CO.site(key), b = K();
    var id = (b.idBase || 1000) + cl.list.length;
    while (G.CITY_DATA[id] && G.CITY_DATA[id].colony == null) id++;   // 혹시 자료의 도시 번호와 겹치면 다음 번호
    var e = { id: id, key: key, nat: natCode(), owner: natName(), name: '', stage: 0, chosen: U.dateNum(s.date), built: [] };
    cl.list.push(e); cl.call = null;
    var c = CO.sync(e);
    if (s.known.indexOf(id) < 0) s.known.push(id);
    if (G.State.revealChart) G.State.revealChart(site.lon, site.lat, 4);
    s.player.gold += b.grant || 0;
    G.State.log('국왕에게서 새 도시를 세울 곳으로 「' + site.name + '」을 받았다 (개척 자금 ' + U.num(b.grant || 0) + '닢).');
    if (G.Game.refreshHud) G.Game.refreshHud();
    return e;
  };

  /** 세울 곳 고르기 — 해도 위의 후보와 목록. 고른 key (그만두면 null) */
  CO.chooseSite = function () {
    var s = S(), b = K(), nat = natCode();
    var sites = CO.sites().filter(function (x) { return x.nat === nat && !used(x.key); });
    sites.forEach(function (x) { x._why = CO.reach(x); });
    var lon0 = Math.min.apply(null, sites.map(function (x) { return x.lon; })) - 14, lon1 = Math.max.apply(null, sites.map(function (x) { return x.lon; })) + 14;
    var lat0 = Math.min.apply(null, sites.map(function (x) { return x.lat; })) - 12, lat1 = Math.max.apply(null, sites.map(function (x) { return x.lat; })) + 12;
    // 지도는 가로:세로 = 1.6:1 로 맞춘다 (경도·위도 1:1)
    var W = 680, H = 470, spanX = lon1 - lon0, spanY = lat1 - lat0;
    if (spanX / spanY > W / H) { var cy = (lat0 + lat1) / 2, hy = spanX * H / W / 2; lat0 = cy - hy; lat1 = cy + hy; } else { var cx = (lon0 + lon1) / 2, hx = spanY * W / H / 2; lon0 = cx - hx; lon1 = cx + hx; }
    var pick = (sites.filter(function (x) { return !x._why; })[0] || {}).key || null;
    var html = '<div class="col-pick"><div class="cp-map"></div><div class="cp-side"><div class="cp-list"></div><div class="cp-desc"></div></div></div>';
    var win = UI.window({ title: '새 도시를 세울 곳 — ' + natName() + '의 바다', icon: 'flag', width: 1240, html: html,
      buttons: [{ label: '그만둔다', value: null }, { label: '이곳에 세운다', value: 'ok', cls: 'navy', id: 'go', onClick: function () { if (!pick) return false; } }] });
    var mapEl = win.content.querySelector('.cp-map'), listEl = win.content.querySelector('.cp-list'), descEl = win.content.querySelector('.cp-desc');
    var base = G.Info.chartCanvas(W, H, { lon0: lon0, lon1: lon1, lat0: lat0, lat1: lat1, noMarks: true, noTarget: true, reveal: true });
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'cp-cv'; mapEl.appendChild(cv);
    function px(lon, lat) { return [(lon - lon0) / (lon1 - lon0) * W, (lat1 - lat) / (lat1 - lat0) * H]; }
    function draw() {
      var ctx = cv.getContext('2d'); ctx.drawImage(base, 0, 0);
      var fam = getComputedStyle(document.body).fontFamily, placed = [];
      // 이름표가 서로 겹치지 않게: 오른쪽 아래 → 오른쪽 위 → 왼쪽 아래 → 왼쪽 위 → 더 아래
      function spot(x, p, on) {
        ctx.font = (on ? '700 ' : '600 ') + '15px ' + fam;
        var tw = ctx.measureText(x.place).width, th = 16, cand = [[8, 16], [18, -24], [-tw - 8, 16], [-tw - 8, -26], [8, 34], [-tw / 2, 34]];
        for (var i = 0; i < cand.length; i++) {
          var r = [p[0] + cand[i][0], p[1] + cand[i][1] - th + 3, tw, th];
          if (r[0] < 2 || r[0] + tw > W - 2 || r[1] < 2 || r[1] + th > H - 2) continue;
          if (!placed.some(function (q) { return r[0] < q[0] + q[2] + 4 && q[0] < r[0] + r[2] + 4 && r[1] < q[1] + q[3] + 2 && q[1] < r[1] + r[3] + 2; })) { placed.push(r); return cand[i]; }
        }
        return cand[0];
      }
      var order = sites.slice().sort(function (a, b) { return (b.key === pick) - (a.key === pick); });   // 고른 곳의 이름표가 먼저 자리를 잡는다
      // 깃발 영역도 이름표가 덮지 않게 미리 잡아 둔다
      sites.forEach(function (x) { var p = px(x.lon, x.lat); placed.push([p[0] - 2, p[1] - 23, 18, 26]); });
      var off = {}; order.forEach(function (x) { off[x.key] = spot(x, px(x.lon, x.lat), x.key === pick); });
      sites.forEach(function (x) {
        var p = px(x.lon, x.lat), on = x.key === pick, ok = !x._why;
        ctx.save();
        if (on) { ctx.fillStyle = 'rgba(217,180,95,.28)'; ctx.beginPath(); ctx.arc(p[0], p[1], 26, 0, 7); ctx.fill(); }
        // 깃발
        ctx.strokeStyle = ok ? '#3a2410' : 'rgba(58,36,16,.45)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - 22); ctx.stroke();
        ctx.fillStyle = ok ? (on ? '#b01e1e' : '#8a2a1e') : 'rgba(120,100,80,.55)';
        ctx.beginPath(); ctx.moveTo(p[0], p[1] - 22); ctx.lineTo(p[0] + 15, p[1] - 17); ctx.lineTo(p[0], p[1] - 12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = ok ? '#2a1f16' : 'rgba(60,45,30,.55)'; ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, 7); ctx.fill();
        ctx.font = (on ? '700 ' : '600 ') + '15px ' + fam; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(242,231,204,.9)';
        var o2 = off[x.key];
        ctx.strokeText(x.place, p[0] + o2[0], p[1] + o2[1]); ctx.fillStyle = ok ? '#2a1f16' : 'rgba(60,45,30,.6)'; ctx.fillText(x.place, p[0] + o2[0], p[1] + o2[1]);
        ctx.restore();
      });
    }
    function render() {
      listEl.innerHTML = '';
      sites.forEach(function (x) {
        var d = U.el('div', 'choice cp-item' + (x.key === pick ? ' on' : '') + (x._why ? ' dis' : ''), G.icon('flag') + '<span>' + U.esc(x.name) + '</span>' + (x._why ? '<span class="r">' + U.esc(x._why) + '</span>' : ''));
        d.onclick = function () { if (x._why) { UI.toast(x.name + ' — ' + x._why, 'map', 3500); } pick = x._why ? pick : x.key; render(); };
        listEl.appendChild(d);
      });
      var cur = CO.site(pick);
      descEl.innerHTML = cur ? '<b>' + U.esc(cur.place) + '</b> — ' + U.esc(cur.desc) + '<div class="muted" style="margin-top:6px">교역품: ' + cur.goods.filter(function (g) { return G.GOOD[g]; }).map(goodName).join(' · ') + '</div>'
        : '<span class="muted">아직 우리 나라 배가 닿지 않은 바다뿐입니다. 그 바다의 도시에 먼저 들러 보십시오.</span>';
      if (win.go) win.go.classList.toggle('disabled', !pick);
      draw();
    }
    cv.onclick = function (ev) {
      var r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H, best = null, bd = 30 * 30;
      sites.forEach(function (st) { var p = px(st.lon, st.lat), d = (p[0] - x) * (p[0] - x) + (p[1] - 12 - y) * (p[1] - 12 - y); if (d < bd) { bd = d; best = st; } });
      if (best) { if (best._why) UI.toast(best.name + ' — ' + best._why, 'map', 3500); else { pick = best.key; render(); } }
    };
    render();
    return win.result.then(function (v) { return v === 'ok' ? pick : null; });
  };
  /** 그 개척지를 고를 수 없는 까닭 (고를 수 있으면 '') — 우리 나라 도시가 가까이 있거나, 제독이 근처 도시에 들러 보았어야 한다 */
  CO.reach = function (x) {
    var s = S(), b = K(), nat = natName(), visited = s.visited || {}, nearNat = false, seen = false;
    G.CITY_DATA.forEach(function (c) {
      if (!c || c.colony != null || !R.cityExists(c)) return;
      var d = G.Geo.dist(x.lon, x.lat, c.lon, c.lat);
      if (d <= (b.near || 15) && R.cityOwner(c) === nat) nearNat = true;
      if (d <= (b.seen || 12) && visited[c.id]) seen = true;
    });
    return nearNat || seen ? '' : '아직 닿지 않은 바다';
  };

  // ================================================================ 도시를 세운다 (개척지에 입항)
  CO.arrival = async function (c) {
    var e = CO.of(c); if (!e) return;
    if (e.stage === 0) { await CO.found(c, e); return; }
    if (e.need && haveQty(e.need.good) >= e.need.qty) UI.toast(c.name + ' — 개척 물자 ' + goodName(e.need.good) + ' ' + e.need.qty + '통을 항구에서 넘길 수 있다.', 'seal', 5500);
  };
  function settler(c) { return G.Scenes.city.npc('harbormaster', '개척민 대표'); }
  CO.found = async function (c, e) {
    var s = S(), site = CO.site(e.key), C = G.Scenes.city;
    await C.mate(fill(L.landMate));
    var who = settler(c);
    await say(L.settler, who);
    var name = await askName(site);
    e.name = name; e.stage = 1; e.founded = U.dateNum(s.date); e.built = kindsOf(0).concat(kindsOf(1));
    e.need = newNeed(e);
    CO.sync(e);
    G.State.log(fill(L.founded, { place: site.name, colony: name }));
    if (G.Fame) G.Fame.add('ex', K().foundFame || 0);
    if (G.Game.refreshHud) G.Game.refreshHud();
    await say(L.named, who, { colony: name });
    await CO.showStage(c, e, 1, { title: '신도시 「' + name + '」', sub: listName(kindsOf(1)) + '이 섰다', scene: 'found' });
    await say(L.cheer, who, { colony: name });
    await say(L.ask1, who, { good: goodName(e.need.good), qty: e.need.qty });
  };
  async function askName(site) {
    var used0 = {}; G.CITY_DATA.forEach(function (c) { if (c) used0[c.name] = 1; });
    var def = site.place.replace(/ (만|섬|언덕|강 어귀)$/, ''), name = null;
    for (var i = 0; i < 5; i++) {
      var v = await UI.prompt(L.nameAsk + ' (' + site.place + ')', name || def, 10);
      v = (v || '').replace(/[<>{}"'`\\]/g, '').replace(/\s+/g, ' ').trim();
      if (!v) v = def;
      if (used0[v]) { UI.toast('「' + v + '」은 이미 있는 도시 이름이다. 다른 이름을 지어 주십시오.', 'flag', 4000); name = v + ' 신도시'; continue; }
      return v;
    }
    return def + ' ' + (CO.list().length + 1);
  }

  // ================================================================ 개척 물자
  function haveQty(g) { var cg = S().fleet.cargo[g]; return cg ? cg.q : 0; }
  CO.harborItems = function (c) {
    var e = CO.of(c); if (!e || !e.need) return [];
    var have = haveQty(e.need.good);
    return [{ label: '개척 물자를 넘긴다', icon: 'seal', sub: goodName(e.need.good) + ' ' + have + '/' + e.need.qty + '통', dim: have < e.need.qty, onClick: function () { return CO.deliver(c); } }];
  };
  CO.todo = function (c) {
    var out = [];
    CO.list().forEach(function (e) {
      if (!e.need) return;
      var have = haveQty(e.need.good), here = c.id === e.id;
      if (here) out.push({ kind: 'harbor', icon: 'seal', hot: have >= e.need.qty, text: '개척 물자 — ' + goodName(e.need.good) + ' ' + e.need.qty + '통 (실은 것 ' + have + '통)' + (have >= e.need.qty ? ' — 항구에서 넘긴다' : '') });
      else if (c.goods && c.goods.indexOf(e.need.good) >= 0 && R.facilities(c).trade) out.push({ kind: 'trade', icon: 'seal', text: e.name + '에 보낼 ' + goodName(e.need.good) + '을 여기 교역소에서 살 수 있다 (' + have + '/' + e.need.qty + '통)' });
    });
    var cl = CO.st();
    if (cl && cl.call && R.facilities(c).palace) { var sp = G.SPONSOR[cl.call.sp]; if (sp && sp.city === c.id) out.push({ kind: 'palace', arg: R.bldArg(sp), icon: 'flag', hot: true, text: kingName(sp) + '께서 새 도시 일로 부르신다' }); }
    return out;
  };
  CO.deliver = async function (c) {
    var s = S(), e = CO.of(c), C = G.Scenes.city; if (!e || !e.need) return;
    var g = e.need.good, q = e.need.qty, have = haveQty(g), who = settler(c);
    if (have < q) { await say('제독님, ' + goodName(g) + ' ' + q + '통이 있어야 합니다. 지금 배에는 ' + have + '통뿐입니다.', who); return; }
    var price = Math.max(1, (G.GOOD[g] && G.GOOD[g].p) || 10), pay = Math.round(price * q * (K().pay || 1.6));
    if (!(await UI.confirm(goodName(g) + ' ' + q + '통을 개척민에게 넘깁니까?<br><small>국왕의 금고에서 금화 ' + U.num(pay) + '닢을 치러 줍니다.</small>', '넘긴다', '그만둔다', '개척 물자'))) return;
    var cg = s.fleet.cargo[g]; cg.q -= q; if (cg.q <= 0) delete s.fleet.cargo[g];
    s.player.gold += pay;
    var step = e.stage - 1;
    if (G.Fame) G.Fame.add('tr', (K().fame3 || [])[step] || 1000);
    await say(L.thanks, who);
    e.lastGood = g; e.need = null; e.stage++;
    e.built = (e.built || []).concat(kindsOf(e.stage));
    if (e.stage <= 3) e.nextDay = s.day + (K().gap || 10);
    CO.sync(e);
    var msg = fill(L.built, { colony: e.name, list: listName(kindsOf(e.stage)), jx: U.jx(BN[kindsOf(e.stage).slice(-1)[0]] || '', '이/가') });
    G.State.log(msg);
    if (G.Game.refreshHud) G.Game.refreshHud();
    // 거리로 나가 새 건물을 보여 준다
    if (C.current()) await C.leave();
    await CO.showStage(c, e, e.stage, { title: e.name + ' — ' + (STAGES[e.stage] || {}).name, sub: listName(kindsOf(e.stage)) + U.jx(BN[kindsOf(e.stage).slice(-1)[0]] || '', '이/가') + ' 섰다', scene: 'stage' + e.stage });
    if (e.stage === 4) await say(L.govAsk, who, { colony: e.name });
  };

  // ================================================================ 그림: 새 건물이 선 거리
  /** 거리를 새 건물로 다시 세우고, 새 건물을 하나씩 비추며 금빛 글귀를 띄운다. 그림(images/events/colony/<scene>)이 있으면 먼저 보여 준다 */
  CO.showStage = async function (c, e, stage, o) {
    var C = G.Scenes.city, T = G.Town, kinds = kindsOf(stage).filter(function (k) { return k !== 'gate'; });
    if (stage === 1) kinds = ['harbor', 'trade', 'tavern', 'inn'];
    try {
      if (T && T.available(c)) { await T.open(c, C.buildings(c)); if (G.Scenes.city.isBusy && G.Game.scene === C) C.main(); }
      else if (G.Game.scene === C) C.main();
    } catch (err) { console.error(err); }
    var pic = CO.picture(o.scene, c);
    var card = banner(o.title, o.sub, pic);
    if (T && T.active() && T.highlight) T.highlight(kinds, 9000);
    var skip = false; card.onclick = function () { skip = true; };
    for (var i = 0; i < kinds.length && !skip; i++) {
      if (T && T.active() && T.lookAt) T.lookAt(kinds[i]);
      card.querySelector('.cb-now').textContent = (BN[kinds[i]] || kinds[i]);
      for (var w = 0; w < 14 && !skip; w++) await U.sleep(100);
    }
    if (T && T.active() && T.lookAt) T.lookAt(kinds[0]);
    await waitClick(card, skip ? 200 : 900);
    card.classList.add('out'); await U.sleep(450); if (card.parentNode) card.parentNode.removeChild(card);
  };
  /** 그 장면의 그림 열쇠 (있을 때만) */
  CO.picture = function (scene, c) {
    var e = CO.of(c), site = e && CO.site(e.key), I = G.Img;
    if (!I || !I.pick) return null;
    var k = I.pick(['events/colony/' + scene + '_' + (site ? site.area : ''), 'events/colony/' + scene]);
    return k && I.src ? I.src(k) : null;
  };
  function banner(title, sub, pic) {
    var root = document.getElementById('ui'), el = U.el('div', 'colony-banner' + (pic ? ' with-pic' : ''),
      (pic ? '<div class="cb-pic"><img src="' + pic + '" alt=""></div>' : '') +
      '<div class="cb-box"><div class="cb-kicker">' + G.icon('flag') + ' 개척 도시</div><div class="cb-title">' + U.esc(title) + '</div><div class="cb-sub">' + U.esc(sub) + '</div><div class="cb-now"></div><div class="cb-more">누르면 넘어갑니다</div></div>');
    root.appendChild(el);
    root.classList.add('colony-show');   // 글귀가 떠 있는 동안 거리의 판(할 일·메뉴·아래 단추)을 걷어 새 거리가 잘 보이게
    var mo = new MutationObserver(function () { if (!el.parentNode || el.classList.contains('out')) { if (!root.querySelector('.colony-banner:not(.out)')) root.classList.remove('colony-show'); if (!el.parentNode) mo.disconnect(); } });
    mo.observe(root, { childList: true }); mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return el;
  }
  function waitClick(el, minMs) {
    return new Promise(function (res) {
      var t0 = Date.now(), done = false;
      function go() { if (done || Date.now() - t0 < minMs) return; done = true; el.removeEventListener('click', go); document.removeEventListener('keydown', key, true); res(); }
      function key(ev) { if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Escape') { ev.preventDefault(); go(); } }
      el.addEventListener('click', go); document.addEventListener('keydown', key, true);
      setTimeout(go, Math.max(minMs, 4500)); setTimeout(go, Math.max(minMs, 4500) + 50);
    });
  }

  // ================================================================ 총독
  CO.governed = function () { return CO.list().filter(function (e) { return e.gov; }); };
  /** 윗줄 직위에 붙는 칭호 (총독이면 「○○ 총독」) */
  CO.title = function () { var g = CO.governed(); return g.length ? g.map(function (e) { return e.name; }).join('·') + ' 총독' : ''; };
  CO.becomeGov = async function (c) {
    var e = CO.of(c), s = S(); if (!e || e.gov || e.stage < 4) return;
    e.gov = U.dateNum(s.date);
    if (G.Fame) G.Fame.add('so', K().govFame || 0);
    G.State.log(fill(L.govLog, { colony: e.name }));
    if (G.Game.refreshHud) G.Game.refreshHud();
    var pic = CO.picture('governor', c);
    var card = banner(e.name + ' 총독', s.player.name + ' — 국왕 전하의 임명장을 받았다', pic);
    await waitClick(card, 900);
    card.classList.add('out'); await U.sleep(450); if (card.parentNode) card.parentNode.removeChild(card);
  };
  /** 가족을 총독 관저로 / 고향 집으로 */
  CO.moveFamily = async function (c, toHere) {
    var s = S(), p = s.player, e = CO.of(c);
    if (toHere) { p.seat = c.id; G.State.log(fill(L.famMove, { colony: e.name })); UI.toast(fill(L.famMove, { colony: e.name }), 'house', 6000); }
    else { delete p.seat; var hn = G.CITY_DATA[p.home].name; G.State.log(fill(L.famBack, { home: hn })); UI.toast(fill(L.famBack, { home: hn }), 'house', 5000); }
    // 거리에 관저가 생기거나 없어진다
    var C = G.Scenes.city;
    if (G.Town && G.Town.available(c)) { try { await G.Town.open(c, C.buildings(c)); } catch (err) { console.error(err); } }
  };

  // ================================================================ 수첩 (계약·의뢰 탭)
  CO.html = function () {
    var cl = CO.st(); if (!cl || (!cl.list.length && !cl.call)) return '';
    var h = '<div class="sep"></div><h4 style="margin:0 0 8px">개척 도시</h4>';
    if (cl.call) { var sp = G.SPONSOR[cl.call.sp]; h += '<div class="hint-item"><div class="tx">' + U.esc(sp ? kingName(sp) : '국왕') + '께서 새 도시를 세울 사람으로 부르신다 — ' + U.esc(sp ? G.CITY_DATA[sp.city].name : '') + ' 왕궁</div></div>'; }
    cl.list.forEach(function (e) {
      var site = CO.site(e.key) || {}, st = STAGES[e.stage] || {};
      var next = e.stage === 0 ? '개척지에 입항하면 도시를 세운다' : e.need ? '개척 물자: ' + goodName(e.need.good) + ' ' + e.need.qty + '통 (실은 것 ' + haveQty(e.need.good) + '통) — 항구에서 넘긴다'
        : e.stage < 4 ? '개척민이 다음 물자를 헤아리는 중 (약 ' + Math.max(0, (e.nextDay || 0) - S().day) + '일)' : e.gov ? '총독 ' + S().player.name + (S().player.seat === e.id ? ' · 가족이 총독 관저에 산다' : '') : '총독부가 섰다 — 총독에 오를 수 있다';
      h += '<div class="kv colony-kv"><div>' + U.esc(G.CITY_DATA[e.id] ? G.CITY_DATA[e.id].name : e.name) + '</div><div>' + U.esc(site.name || '') + ' · <b>' + U.esc(st.name || '') + '</b> (' + e.stage + '/4)<br><small class="muted">' + U.esc(next) + '</small></div></div>';
    });
    return h;
  };
})(window.G = window.G || {});
