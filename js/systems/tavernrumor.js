/* 주점에 도는 소문 (G.TavernRumor) — 조정값 js/data/base.js G.BALANCE.tavernRumor, 특별 소문 js/data/tavernspecial.js
   · 한 도시 주점이 품는 소문은 3건까지(n). 처음 들를 때 정하고, 30일(days)이 지나면 새로 뽑는다.
   · 고르는 법: 아직 찾지 않았고 들을 수 있는 발견 가운데 난이도(pw)가 낮은 것부터 채운다.
     같은 난이도 안에서는 이 도시와 가까울수록(지역 거리·실제 거리) 잘 뽑히고, 온 세상이 떠드는 이야기(개척 단계 맛보기·관문)는 hotK배.
   · 3건 가운데 하나를 찾으면 그 자리에 다음 소문이 들어온다.
   · 화면에는 보이지 않는다 — 술꾼·여급·이름난 여급이 이 3건 안에서만 이야기한다 (js/city/tavern.js T.rumour).
   · 특별 소문(G.TAVERN_SPECIAL)은 그 대륙·도시 주점에서만, 3건과 따로 술집 주인이 꺼낸다 — 증거품을 사면 단서가 한 겹 더. */
(function (G) {
  'use strict';
  var TR = G.TavernRumor = {};
  function S() { return G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.tavernRumor) || {}; }
  function num(v, d) { return v == null ? d : v; }
  function U() { return G.U; }

  /** 어느 주점의 특별 소문인가 */
  TR.isSpecial = function (id) { return !!(G.TAVERN_SPECIAL_BY_DISC && G.TAVERN_SPECIAL_BY_DISC[id]); };
  /** 이 도시 주점의 특별 소문들 — 도시 것이 먼저 */
  TR.specialsAt = function (c) {
    var L = G.TAVERN_SPECIAL || [];
    return L.filter(function (t) { return t.at.city && t.at.city.indexOf(c.id) >= 0; })
      .concat(L.filter(function (t) { return t.at.region && t.at.region.indexOf(c.region) >= 0; }));
  };

  /** 소문 후보: 아직 찾지 않았고, 들을 수 있고, 주점이 말할 갈래(이야기)이고, 이 도시에서 너무 멀지 않은 것 */
  TR.candidates = function (c, src) {
    var s = S(), fame = s.player.fame, D = G.Disc, maxD = fame < 300 ? 1 : fame < 1500 ? 2 : fame < 3500 ? 3 : 5;
    return G.DISCOVERIES.filter(function (d) {
      if (d.id === 'circum' || d.bookOnly || D.foundByMe(d.id) || TR.isSpecial(d.id)) return false;
      if (s.hints[d.id] && !D.canStack(d.id, src)) return false;
      if (!D.available(d)) return false;
      var hot = G.Frontier && G.Frontier.hot(d);
      if (!D.clueOk(d, 'tavern')) return false;
      if ((d.how === 'trade' || d.cat === 'treasure') && !hot) return false;
      if (d.id === 'mu' || d.id === 'antpeople') return fame > 5000;
      return hot || G.REGION_DIST[c.region][d.reg] <= maxD;
    });
  };
  /** 가까울수록 무겁다: 지역 거리 + 실제 거리(도) */
  TR.weight = function (c, d, src) {
    var w = 1 / (1 + G.REGION_DIST[c.region][d.reg]);
    if ((d.lat || d.lon) && G.Geo && G.Geo.dist) w *= 1 / (1 + G.Geo.dist(c.lon, c.lat, d.lon, d.lat) / num(B().geo, 15));
    if (G.Frontier && G.Frontier.hot(d)) w *= num(B().hotK, 3);
    return w * G.Disc.rumourW(d, src);
  };
  /** 난이도 층: pw 1~5 */
  TR.tier = function (d) { return d.pw || 3; };

  function fill(c, p, n) {
    var src = 'tavern:' + c.id, have = {};
    p.ids.forEach(function (id) { have[id] = 1; });
    var cand = TR.candidates(c, src).filter(function (d) { return !have[d.id]; });
    var tiers = {};
    cand.forEach(function (d) { var t = TR.tier(d); (tiers[t] = tiers[t] || []).push(d); });
    Object.keys(tiers).map(Number).sort(function (a, b) { return a - b; }).forEach(function (t) {
      var list = tiers[t];
      while (p.ids.length < n && list.length) {
        var pick = U().weighted(list, function (d) { return TR.weight(c, d, src) || 1e-6; });
        p.ids.push(pick.id); list.splice(list.indexOf(pick), 1);
      }
    });
  }
  /** 이 도시 주점의 소문 3건 {d: 정한 날, ids: [발견 id]} — 30일 지나면 새로, 찾은 것은 빼고 채운다 */
  TR.pool = function (c) {
    var s = S(), n = num(B().n, 3), days = num(B().days, 30);
    var all = s.tavernRumor || (s.tavernRumor = {}), p = all[c.id];
    if (!p || s.day - p.d >= days || s.day < p.d) p = all[c.id] = { d: s.day, ids: [] };
    p.ids = p.ids.filter(function (id) { return G.DISC[id] && !G.Disc.foundByMe(id) && !(G.Disc.taken && G.Disc.taken(id)); });
    if (p.ids.length < n) fill(c, p, n);
    return p;
  };
  /** 지금 이 주점에서 꺼낼 소문 하나 — 3건 가운데 아직 여기서 듣지 않은 것, 쉬운 것부터. 없으면 null */
  TR.next = function (c) {
    var p = TR.pool(c), src = 'tavern:' + c.id, s = S();
    for (var i = 0; i < p.ids.length; i++) {
      var d = G.DISC[p.ids[i]];
      if (!d || !G.Disc.available(d)) continue;
      if (!s.hints[d.id] || G.Disc.canStack(d.id, src)) return d;
    }
    return null;
  };

  // ---------------------------------------------------------------- 특별 소문 · 증거품
  function hasEv(t) { return S().player.items.some(function (it) { return it.kind === 'clue' && it.sp === t.id; }); }
  /** 지금 주인이 꺼낼 특별 소문 — 열린 발견이고, 아직 찾지 않았고, 증거품을 아직 사지 않은 것 */
  TR.special = function (c) {
    var s = S();
    return TR.specialsAt(c).filter(function (t) {
      var d = G.DISC[t.disc];
      return d && !G.Disc.foundByMe(d.id) && !(G.Disc.taken && G.Disc.taken(d.id)) && G.Disc.available(d) && !hasEv(t);
    })[0] || null;
  };
  TR.evPrice = function (t) { return Math.round((t.ev.price || 800) * num(B().evK, 1)); };
  /** 술집 주인이 특별 소문을 꺼내고 증거품을 권한다 (T.drink). 꺼냈으면 true */
  TR.tellSpecial = async function (c, who) {
    var t = TR.special(c); if (!t) return false;
    var s = S(), UI = G.UI, d = G.DISC[t.disc], st = (s.tavernSp = s.tavernSp || {}), told = st[t.id];
    var src = 'special:' + c.id;
    if (!told) {
      st[t.id] = s.day;
      await G.Scenes.city.say(who, t.line);
      G.Disc.noteHint(d, src);
    } else await G.Scenes.city.say(who, '전에 말한 그 이야기 말일세 — ' + t.ev.name + U().jx(t.ev.name, '은/는') + ' 아직 내가 갖고 있네.');
    var price = TR.evPrice(t);
    var ok = await UI.confirm('「' + U().esc(t.ev.name) + '」<div class="muted" style="font-size:16px;margin-top:6px">' + U().esc(t.ev.desc) + '</div>' +
      '<div style="font-size:16px;margin-top:6px">금화 ' + U().num(price) + '닢에 사겠습니까? 가지고 있으면 이 이야기의 단서가 한 겹 더 쌓입니다.</div>', '산다', '그만둔다', '주점의 증거품');
    if (!ok) { await G.Scenes.city.say(who, '생각이 바뀌면 다시 오게. 이건 이 고장에서만 구할 수 있네.'); return true; }
    if (s.player.gold < price) { await G.Scenes.city.mate('제독, 금화가 모자랍니다.'); return true; }
    if (G.R.itemsFull && G.R.itemsFull()) { await G.Scenes.city.mate('제독, 소지품이 가득합니다. 무언가를 버려야 받을 수 있습니다.'); return true; }
    s.player.gold -= price;
    s.player.items.push({ id: 'clue_' + t.id, kind: 'clue', sp: t.id, clue: d.id, name: t.ev.name,
      desc: t.ev.desc + ' — 「' + d.name + '」의 단서를 뒷받침한다.' });
    var r = G.Disc.noteHint(d, 'evidence:' + t.id);
    if (!r) UI.toast(t.ev.name + U().jx(t.ev.name, '을/를') + ' 손에 넣었다.', 'scroll');
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
})(window.G = window.G || {});
