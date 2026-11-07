/* 자리를 옮긴 발견물 (G.DiscMove, 2026-11-07) — 자료 js/data/discmove.js (G.DISC_MOVES)
   도시가 무너지거나 물건이 다른 곳으로 건너가도 단서는 그대로 쓸 수 있다. 날짜가 그 단계에 이르면
   발견물의 찾는 도시(d.city)·자리(lat/lon)·단서(d.hint)·말(lang)을 그 단계의 것으로 바꾼다 — 술집·계약·해도·수첩이 모두 새 자리를 말한다.
   · 단서나 계약을 쥔 채 단계가 바뀌면 그날 소식으로 알린다
   · 옛 자리(ask 도시)의 건물에 들어가면 부하가 현지에서 들은 말을 전한다 (단계마다 한 번)
   · 새 자리에서 찾을 때 그 자리의 장면 한 줄(on)
   · 이미 찾은 발견물은 찾은 때의 자리에 그대로 둔다 (두고 온 유물·해도 표시가 어긋나지 않게)
   저장: state.discMove = { stage: {id: 단계}, got: {id: 찾은 단계}, told: {id: 알려 준 단계} } — 옛 저장에는 처음 쓸 때 만든다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var DM = {};
  G.DiscMove = DM;

  function S() { return G.Game && G.Game.state; }
  function M() { return G.DISC_MOVES || {}; }
  function st() {
    var s = S(); if (!s) return null;
    var b = s.discMove || (s.discMove = {});
    if (!b.stage) b.stage = {}; if (!b.got) b.got = {}; if (!b.told) b.told = {};
    return b;
  }
  function found(id) { return !!(G.Disc && G.Disc.foundByMe(id)); }
  function tx(t) { return G.Names && G.Names.tx ? G.Names.tx(t) : t; }
  /** 처음 자리 (자료 그대로) */
  function base(d) {
    if (!d._mv) d._mv = { city: d.city, lat: d.lat, lon: d.lon, lang: d.lang, hint: d.hint, val: d.val, goneY: d.goneY };
    return d._mv;
  }

  /** 지금 그 발견물의 단계 (0 = 처음 자리) — 이미 찾았으면 찾은 때의 단계 */
  DM.stage = function (id) {
    var L = M()[id], b = st(); if (!L || !b) return 0;
    if (found(id)) return b.got[id] || 0;
    var t = U.dateNum(S().date), k = 0;
    for (var i = 0; i < L.length; i++) if (t >= L[i].from) k = i + 1;
    return k;
  };
  /** 지금 단계의 자료 (처음 자리면 null) */
  DM.cur = function (id) { var k = DM.stage(id); return k ? M()[id][k - 1] : null; };
  /** 단서나 계약을 쥐고 있고 아직 못 찾았는가 */
  DM.holds = function (id) {
    var s = S(); if (!s || found(id)) return false;
    return !!((s.hints && s.hints[id]) || (s.contract && s.contract.disc === id));
  };

  /** 발견물 자료를 그 단계에 맞춘다 */
  function set(d, k) {
    var b = base(d), m = k ? M()[d.id][k - 1] : null;
    if (!m) { d.city = b.city; d.lat = b.lat; d.lon = b.lon; d.lang = b.lang; d.hint = b.hint; d.val = b.val; d.goneY = b.goneY; d.noStreet = false; d.moved = 0; return; }
    var cityId = m.city != null ? m.city : b.city, c = G.CITY_DATA[cityId];
    d.city = cityId; d.lat = c.lat; d.lon = c.lon;
    d.lang = m.lang === 'city' ? c.lang : b.lang;
    d.hint = m.hint ? tx(m.hint) : b.hint;   // 단서를 적지 않은 단계는 처음 단서 그대로 (그 도시가 처음 자리)
    d.val = m.valK ? Math.round(b.val * m.valK) : b.val;   // 터만 남은 곳은 값이 줄어든다
    d.goneY = m.site ? 0 : b.goneY;   // site: 건물은 허물어졌어도 그 터·흩어진 돌·조각상으로 찾는다 (D.built의 goneY를 끈다)
    d.noStreet = m.street === false || !!m.site;   // 거리에 볼거리 그림을 세우지 않는다 (js/scenes/town.js)
    d.moved = k;
  }
  /** 찾는 도시가 지금 있는가 (없으면 새 단서가 돌지 않는다) */
  DM.cityOk = function (d) {
    if (!d || d.how !== 'city' || d.city == null || !G.R || !G.R.cityExists) return true;
    var c = G.CITY_DATA[d.city], s = S();
    return !c || !s || G.R.cityExists(c, s.date);
  };

  /** 불러오기·새 게임·이름 붙이기 뒤 (G.Names.apply 다음) — 알리지 않고 맞춘다 */
  DM.apply = function () {
    var b = st(); if (!b) return;
    Object.keys(M()).forEach(function (id) {
      var d = G.DISC && G.DISC[id]; if (!d) return;
      var k = DM.stage(id); set(d, k); b.stage[id] = k;
    });
  };

  /** 날마다 (G.World.daily) — 단계가 바뀌면 자료를 고치고, 단서를 쥐고 있으면 소식으로 알린다 */
  DM.daily = function () {
    var b = st(), out = []; if (!b) return out;
    Object.keys(M()).forEach(function (id) {
      var d = G.DISC && G.DISC[id]; if (!d) return;
      var k = DM.stage(id), was = b.stage[id] || 0;
      if (k === was && (d.moved || 0) === k) return;
      set(d, k); b.stage[id] = k;
      if (k > was && DM.holds(id)) {
        var c = G.CITY_DATA[d.city];
        out.push({ icon: 'scroll', text: '【단서가 바뀌었다】 「' + d.name + '」 — ' + d.hint + ' (찾는 곳: ' + c.name + ')' });
        G.State.log('「' + d.name + '」의 단서가 바뀌었다 — 이제 ' + c.name + '에서 찾는다.');
      }
    });
    return out;
  };

  /** 이 도시가 옛 자리인 단서 — 건물에 들어가면 부하가 전한다 (단계마다 한 번) */
  DM.tellsAt = function (cityId) {
    var b = st(); if (!b) return [];
    return Object.keys(M()).filter(function (id) {
      var m = DM.cur(id);
      return m && m.tell && m.ask && m.ask.indexOf(cityId) >= 0 && G.DISC[id].city !== cityId && DM.holds(id) && b.told[id] !== DM.stage(id);
    });
  };
  DM.tell = async function (c, say) {
    var b = st(), ids = DM.tellsAt(c.id);
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], d = G.DISC[id], m = DM.cur(id), to = G.CITY_DATA[d.city];
      b.told[id] = DM.stage(id);
      await say(tx(m.tell));
      UI.toast('단서가 바뀌었다 — 「' + d.name + '」은 이제 ' + to.name + '에서 찾는다', 'scroll', 6000);
      G.State.log('「' + d.name + '」 — ' + c.name + '에서 들은 말: 이제 ' + to.name + '에서 찾는다.');
    }
    return ids.length;
  };
  /** 이 도시에 들어가 곧 찾게 될 옮겨 온 발견물의 장면 한 줄 (도시 안 건물 발견물은 눌러서 찾으므로 빼고) */
  DM.onLines = function (cityId) {
    return Object.keys(M()).filter(function (id) {
      var d = G.DISC && G.DISC[id], m = DM.cur(id);
      return d && m && m.on && d.city === cityId && !found(id) && G.Disc.needMet(d) && !(G.Disc.isBuilding && G.Disc.isBuilding(d)) && (!G.Disc.built || G.Disc.built(d));
    }).map(function (id) { return tx(DM.cur(id).on); });
  };

  // ================================================================ 걸기
  // 이름(대륙)이 바뀌면 발견물 글이 처음 것으로 다시 입혀진다 — 그 다음에 단계를 다시 맞춘다 (새 게임·불러오기도 이 길로 온다)
  (function hookNames() {
    var N = G.Names; if (!N || N._discMove) return;
    N._discMove = true;
    var oa = N.apply;
    N.apply = function () {
      var r = oa.apply(this, arguments);
      try {
        // N.apply가 발견물 글을 처음 것(대륙 이름만 바꾼)으로 되돌렸다 — 그것을 처음 자리의 단서로 적어 두고 단계를 다시 맞춘다
        Object.keys(M()).forEach(function (id) { var d = G.DISC && G.DISC[id]; if (d) base(d).hint = d.hint; });
        DM.apply();
      } catch (e) { console.error(e); }
      return r;
    };
  })();
  (function hookDaily() {
    var W = G.World; if (!W || W._discMove) return;
    W._discMove = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(DM.daily()); } catch (e) { console.error(e); } return out; };
  })();
  // 찾으면 그 단계를 적어 둔다 — 찾은 자리에 그대로 둔다
  (function hookFind() {
    var D = G.Disc; if (!D || D._discMove) return;
    D._discMove = true;
    var of = D.find;
    D.find = async function (d) {
      var id = d && d.id, k = id && M()[id] ? DM.stage(id) : 0;
      var r = await of.apply(this, arguments);
      try { var b = st(); if (b && id && M()[id] && found(id) && b.got[id] == null) { b.got[id] = k; b.stage[id] = k; } } catch (e) { console.error(e); }
      return r;
    };
  })();
  // 단서가 도는가: 찾는 도시가 아직 없거나(뉴욕 1664 · 몬트리올 1642 · 필라델피아 1682 · 멕시코 1522) 이미 사라졌으면 새 단서가 돌지 않는다
  // (술집·후원자·책·거리 사람… 모든 단서가 G.Frontier.available → G.Disc.available을 거친다. 이미 쥔 단서는 그대로 두고 단계가 자리를 옮긴다)
  (function hookAvailable() {
    var F = G.Frontier; if (!F || F._discMove || !F.available) return;
    F._discMove = true;
    var ofa = F.available;
    F.available = function (d) {
      var r = ofa.apply(this, arguments);
      try { if (r && d && d.how === 'city' && !found(d.id) && !DM.cityOk(d)) return false; } catch (e) { console.error(e); }
      return r;
    };
  })();
  // 건물에 들어갔을 때: 옛 자리면 바뀐 단서를 전해 듣고, 새 자리면 그 자리의 장면 한 줄 뒤에 찾는다 (js/scenes/city.js C.findInside)
  (function hookCity() {
    var C = G.Scenes && G.Scenes.city; if (!C || C._discMove || !C.findInside) return;
    C._discMove = true;
    var ofi = C.findInside;
    C.findInside = async function (c, kind) {
      try {
        await DM.tell(c, function (t) { return C.mate ? C.mate(t) : UI.say(t, G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {}); });
        var on = DM.onLines(c.id);
        for (var i = 0; i < on.length; i++) await UI.say(on[i], {});
      } catch (e) { console.error(e); }
      return ofi.apply(this, arguments);
    };
    // 도시 안 건물 발견물(터만 남은 곳)을 눌렀을 때: 그 자리의 장면 한 줄 뒤에 찾는다
    var ola = C.lookAt;
    if (ola) C.lookAt = async function (id) {
      try {
        var d = G.DISC[id], m = DM.cur(id), c = C.city && C.city();
        if (d && m && m.on && c && d.city === c.id && !found(id) && !UI.busy() && !(C.isBusy && C.isBusy()) && G.Disc.isBuilding(d) && (G.Disc.inTown ? G.Disc.inTown(d) : G.Disc.built(d))) await UI.say(tx(m.on), {});
      } catch (e) { console.error(e); }
      return ola.apply(this, arguments);
    };
  })();
})(window.G = window.G || {});
