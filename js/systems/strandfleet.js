/* 남겨 둔 함대 (2026-10-21) — G.Strand
   육상 탐험대가 배에서 멀리 떨어진 항구에 닿으면, 그 항구 조선소에서 새 배를 지어 곧바로 바다로 나갈 수 있다.
   · 조선소 「구입」: 탐험대가 뭍길로 들어온 항구(s.loc.via === 'land')이고 배(상륙 지점·출발 항구)가 farDeg° 넘게 떨어져 있으면
     「남겨 둔 배는 keepDays일 안에 찾으러 가지 않으면 버려진다」를 묻고, 그러면 새 배 한 척으로 이 항구에서 함대를 새로 꾸린다.
     - 원래 배들은 그 자리에 남는다 — 싣고 있던 교역품·식량·물·자재도 배와 함께 (탐험대는 맨몸으로 새 배에 오른다)
     - 육상 탐험은 여기서 끝난다: 탈것은 이 도시 마구간에 맡기고, 이 항구에서 출항할 수 있다
   · 되찾기: 바다에서 남겨 둔 배의 자리 findR° 안에 들거나, 출발 항구에 남겼으면 그 항구에 들어가면 다시 함대에 든다
     — 함대가 5척(G.MAX_SHIPS)을 넘으면 넘는 수만큼 제독이 골라 폐기한다 (기함은 고를 수 없다)
   · 버려짐: keepDays일이 지나도 찾으러 가지 않으면 배와 짐이 모두 사라진다 — warn 날 남았을 때마다 부관이 일러 준다
   · 저장: s.strands = [{ id, ships, cargo, food, water, mat, lon, lat, city(출발 항구면 그 번호), place, since, until, warned }]
   조정값: G.BALANCE.strand */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var SF = G.Strand = {};
  function S() { return G.Game && G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.strand) || {}; }
  function num(v, d) { return v == null ? d : v; }
  SF.list = function () { var s = S(); return (s && s.strands) || []; };

  /** 탐험대가 뭍길로 들어온 이 항구에서, 배가 멀리 떨어져 있는가 — {base, dist, place} 또는 null */
  SF.farFrom = function (c) {
    var s = S(); if (!s || !c || !c.port || s.loc.via !== 'land' || !s.landReturn || !s.landReturn.base) return null;
    var b = s.landReturn.base;
    if (b.type === 'city' && b.city === c.id) return null;
    var bl = b.type === 'city' ? (G.CITY_DATA[b.city].dock || [G.CITY_DATA[b.city].lat, G.CITY_DATA[b.city].lon]) : [b.lat, b.lon];
    var d = G.Geo.dist(c.lon, c.lat, bl[1], bl[0]);
    if (d <= num(B().farDeg, 3)) return null;
    return { base: b, dist: d, lon: bl[1], lat: bl[0], place: b.type === 'city' ? G.CITY_DATA[b.city].name + ' 항구' : coastName(bl[1], bl[0]) };
  };
  /** 상륙했던 해안의 이름: 가장 가까운 항구 이름으로 ('리스본 근처 해안') */
  function coastName(lon, lat) {
    var best = null, bd = 1e9;
    G.CITY_DATA.forEach(function (o) { if (!o || !o.port || (R.cityExists && !R.cityExists(o))) return; var d = G.Geo.dist(lon, lat, o.lon, o.lat); if (d < bd) { bd = d; best = o; } });
    return best && bd < 8 ? best.name + ' 근처 해안' : '상륙했던 해안';
  }
  SF.coastName = coastName;
  /** 조선소에서 묻는 말 (HTML 없이 한 덩어리) */
  SF.askText = function (c, far) {
    var f = S().fleet, n = f.ships.length, days = num(B().keepDays, 730);
    return '제독, 우리 배' + (n ? ' ' + n + '척은 ' + far.place + '(여기서 ' + Math.round(far.dist * 111) + 'km쯤)에' : '는 멀리') + ' 있습니다.\n' +
      '여기서 새 배를 지어 떠나면, 남겨 둔 배는 ' + Math.round(days / 365) + '년(' + days + '일) 안에 찾으러 가지 않으면 버려집니다.' +
      (Object.keys(f.cargo).length || f.food || f.water ? ' 싣고 있던 짐과 식량·물도 그 배에 남습니다.' : '') + '\n새 배로 이 항구에서 떠나시겠습니까?';
  };
  /** 새 배(sh)로 이 항구에서 함대를 새로 꾸린다: 원래 배와 짐은 그 자리에 남기고, 육상 탐험을 마친다 */
  SF.leaveAndBoard = async function (c, sh, far) {
    var s = S(), f = s.fleet, b = B();
    if (f.ships.length) {
      var rec = { id: 'sf' + s.day + '_' + Math.floor(Math.random() * 1e6), ships: f.ships.slice(), cargo: f.cargo, food: f.food || 0, water: f.water || 0, mat: f.mat || 0,
        lon: far.lon, lat: far.lat, city: far.base.type === 'city' ? far.base.city : null, place: far.place, since: s.day, until: s.day + num(b.keepDays, 730), warned: {} };
      (s.strands = s.strands || []).push(rec);
      G.State.log(far.place + '에 배 ' + rec.ships.length + '척(' + rec.ships.map(function (x) { return x.name + '호'; }).join('·') + ')을 남기고 ' + c.name + '에서 새 배로 떠나기로 했다.');
    }
    f.ships = [sh]; f.cargo = {}; f.food = 0; f.water = 0; f.mat = 0;
    // 육상 탐험을 여기서 마친다: 탈것은 이 도시 마구간에 · 이 항구에서 출항한다
    var lr = s.landReturn, mt = lr && lr.mount;
    if (mt && mt.id !== 'walk' && mt.n > 0 && G.Mounts && !G.Mounts.get(mt.id).hire) {
      s.stable = s.stable || {}; var old = s.stable[c.id];
      s.stable[c.id] = old && old.id === mt.id ? { id: mt.id, n: old.n + mt.n, draft: mt.draft } : { id: mt.id, n: mt.n, draft: mt.draft };
    }
    var island = lr && lr.base && lr.base.type !== 'city';
    delete s.landReturn;
    s.loc.via = 'sea';
    if (island && G.Peter && G.Peter.onLeave) { try { await G.Peter.onLeave(); } catch (e) { console.error(e); } }   // 섬에 두고 가는 아이 (js/systems/peterpan.js)
    G.State.log('육상 탐험을 마치고 ' + c.name + '에서 새 배 ' + sh.name + '호로 함대를 꾸렸다.');
    if (G.Game.refreshHud) G.Game.refreshHud();
  };

  /** 남겨 둔 배를 되찾는다 (rec): 배와 짐을 모두 다시 싣고, 함대가 MAX_SHIPS(5척)를 넘으면 넘는 수만큼 제독이 골라 폐기한다 (기함은 고를 수 없다).
      알릴 말을 돌려준다 */
  async function rejoin(rec) {
    var s = S(), f = s.fleet, max = G.MAX_SHIPS || 5, took = rec.ships.slice();
    s.strands.splice(s.strands.indexOf(rec), 1);
    took.forEach(function (sh) { f.ships.push(sh); });
    // 짐·식량·물·자재는 모두 옮겨 싣는다
    Object.keys(rec.cargo || {}).forEach(function (id) {
      var a = rec.cargo[id], b = f.cargo[id];
      if (!b) { f.cargo[id] = a; return; }
      b.cost = Math.round((b.cost * b.q + a.cost * a.q) / Math.max(1, b.q + a.q)); b.q += a.q;
      if (a.lots) { b.lots = b.lots || {}; Object.keys(a.lots).forEach(function (k) { var x = a.lots[k], y = b.lots[k]; if (!y) b.lots[k] = x; else { y.cost = Math.round((y.cost * y.q + x.cost * x.q) / Math.max(1, y.q + x.q)); y.q += x.q; } }); }
    });
    f.food = (f.food || 0) + (rec.food || 0); f.water = (f.water || 0) + (rec.water || 0); f.mat = (f.mat || 0) + (rec.mat || 0);
    var names = took.map(function (x) { return x.name + '호'; }).join('·') || '배';
    G.State.log(rec.place + '에 남겨 두었던 ' + names + U.jx(names, '을/를') + ' 되찾았다.');
    // 5척을 넘으면 넘는 수만큼 폐기 — 하나씩 고른다 (답이 없으면 가장 값어치가 낮은 배)
    var gone = [];
    while (f.ships.length > max) {
      var over = f.ships.length - max, cands = f.ships.slice(1);
      var worth = function (sh) { return R.shipValue ? R.shipValue(sh) : (G.SHIP[sh.type].price || 0) * sh.hp / Math.max(1, sh.maxHp); };
      var pick = null;
      try {
        pick = await UI.choose('함대는 ' + max + '척까지입니다 — 폐기할 배를 고르십시오 (' + over + '척 더)', cands.map(function (sh) {
          return { label: sh.name + '호', right: G.SHIP[sh.type].name, value: sh, icon: 'ship', desc: '내구력 ' + Math.round(sh.hp) + '/' + sh.maxHp + (took.indexOf(sh) >= 0 ? ' · 남겨 두었던 배' : '') };
        }), { width: 620, text: '되찾은 배까지 ' + f.ships.length + '척 — 기함은 폐기할 수 없습니다.' });
      } catch (e) { console.error(e); }
      if (!pick || cands.indexOf(pick) < 0) pick = cands.slice().sort(function (a, b) { return worth(a) - worth(b); })[0];
      f.ships.splice(f.ships.indexOf(pick), 1); gone.push(pick.name + '호');
    }
    if (gone.length) G.State.log('함대가 ' + max + '척을 넘어 ' + gone.join('·') + U.jx(gone.join('·'), '을/를') + ' 폐기했다.');
    if (G.Game.refreshHud) G.Game.refreshHud();
    return rec.place + '에 남겨 두었던 ' + names + U.jx(names, '을/를') + ' 되찾았다! 싣고 있던 짐도 그대로다.' +
      (gone.length ? ' 함대가 ' + max + '척을 넘어 ' + gone.join('·') + U.jx(gone.join('·'), '을/를') + ' 폐기했다.' : '');
  }
  /** 바다에서 하루가 지날 때: 남겨 둔 배 곁에 왔으면 되찾는다 — 알릴 말들 (Promise) */
  SF.atSea = async function (lon, lat) {
    var out = [], R0 = num(B().findR, 1.0), recs = SF.list().slice();
    for (var i = 0; i < recs.length; i++) if (G.Geo.dist(lon, lat, recs[i].lon, recs[i].lat) <= R0) out.push({ icon: 'ship', text: await rejoin(recs[i]) });
    return out;
  };
  /** 항구에 들어올 때: 이 항구에 남겨 둔 배가 있으면 되찾는다 — 알릴 말 또는 null (Promise) */
  SF.atCity = async function (c) {
    var out = null, recs = SF.list().slice();
    for (var i = 0; i < recs.length; i++) if (recs[i].city === c.id) out = await rejoin(recs[i]);
    return out;
  };
  /** 날마다 (js/systems/world.js W.daily): 남은 날을 일러 주고, 기한이 지나면 버려진다 */
  SF.daily = function () {
    var s = S(), out = []; if (!s || !s.strands || !s.strands.length) return out;
    var warn = B().warn || [365, 90, 30];
    s.strands.slice().forEach(function (rec) {
      var left = rec.until - s.day, nm = rec.ships.map(function (x) { return x.name + '호'; }).join('·');
      if (left <= 0) {
        s.strands.splice(s.strands.indexOf(rec), 1);
        G.State.log(rec.place + '에 남겨 두었던 ' + nm + U.jx(nm, '이/가') + ' 끝내 찾으러 오지 않아 버려졌다.');
        out.push({ icon: 'skull', text: rec.place + '에 남겨 두었던 ' + nm + U.jx(nm, '은/는') + ' ' + Math.round(num(B().keepDays, 730) / 365) + '년이 지나도록 찾으러 가지 않아 폐기되었다. 싣고 있던 짐도 모두 잃었다.', history: true });
        return;
      }
      warn.forEach(function (w) { if (left <= w && !rec.warned[w]) { rec.warned[w] = 1; if (left > 1) out.push({ icon: 'hourglass', text: rec.place + '에 남겨 둔 ' + nm + U.jx(nm, '이/가') + ' ' + left + '일 뒤면 버려집니다. 그 전에 찾으러 가야 합니다.' }); } });
    });
    return out;
  };
  /** 함대 현황에 덧붙일 줄 (HTML) */
  SF.panelHtml = function () {
    var s = S(); if (!s || !s.strands || !s.strands.length) return '';
    return s.strands.map(function (rec) {
      var left = rec.until - s.day;
      return '<div class="fp-strand" style="margin-top:6px;font-size:14px">' + G.icon('anchor') + '남겨 둔 배 ' + rec.ships.length + '척 · ' + U.esc(rec.place) +
        ' <span class="' + (left <= 90 ? 'warn-text' : 'cream-muted') + '">— ' + left + '일 안에 찾으러 가지 않으면 폐기</span></div>';
    }).join('');
  };
})(window.G = window.G || {});
