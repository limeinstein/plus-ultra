/* 식물 특산물 (G.PlantTrade) — 2026-10-22 사용자 요청
   찾은 식물 발견물(js/data/plantdisc.js)을 들고 교역소에 가면, 교역소 주인이 그 식물을 이 고장에서 길러 특산물로 삼고 싶어 한다.
   · 들어설 때: 심을 수 있는 식물이 있으면 주인이 먼저 청한다 (거절하면 G.BALANCE.plantTrade.askDays 동안은 먼저 묻지 않는다)
   · 교역소 메뉴 「식물을 심는다」: 언제든 골라서 심는다 — 심을 수 없는 식물은 까닭(기후·이미 파는 물건·자리 없음)을 보여 준다
   · 심으면 그 식물의 교역품(G.PLANT_CROP)이 그 교역소의 특산물(c.goods)이 된다 — 산지 값으로 사고, 그 지역은 산지로 친다(R.origins)
   · 발견물은 사라지지 않는다 — 다른 교역소에도 심을 수 있고 왕실 정원에도 바칠 수 있다
   · 한 교역소에 심을 수 있는 식물은 G.BALANCE.plantTrade.max(2)종까지
   · 기후: 열대 식물은 열대의 교역소에만, 한대 식물은 추운 곳에만 (G.BALANCE.plantTrade.zones — 위도 범위)
   저장: s.plantTrade = { at: {도시 id: [교역품 id…]}, ask: {도시 id: 다시 물을 날}, n: 심은 횟수 } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var PT = G.PlantTrade = { ver: 0 };
  function S() { return G.Game && G.Game.state; }
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.plantTrade = G.BALANCE.plantTrade || {
    max: 2,            // 한 교역소에 더할 수 있는 식물 특산물
    askDays: 30,       // 주인의 청을 거절하면 이만큼은 먼저 묻지 않는다
    fame: 3,           // 심을 때마다 교역 명성
    zones: { trop: [0, 28], sub: [0, 38], temp: [20, 58], cold: [45, 90], any: [0, 90] }
  };
  function K() { return G.BALANCE.plantTrade; }
  PT.ZONE_NAME = { trop: '열대', sub: '따뜻한 땅', temp: '온대', cold: '추운 북쪽 땅', any: '어디서나' };

  function st() {
    var s = S(); if (!s) return null;
    var p = s.plantTrade || (s.plantTrade = { at: {}, ask: {}, n: 0 });
    if (!p.at) p.at = {}; if (!p.ask) p.ask = {};
    return p;
  }
  PT.state = st;
  /** 식물 발견물의 교역품 */
  PT.crop = function (d) { var g = d && G.PLANT_CROP && G.PLANT_CROP[d.id]; return g && G.GOOD[g.id] ? G.GOOD[g.id] : null; };
  PT.isPlantGood = function (id) { var g = G.GOOD[id]; return !!(g && g.plant); };
  /** 이 교역소에 심은 교역품 id들 */
  PT.planted = function (c) { var p = st(); return p && c ? (p.at[c.id] || []).slice() : []; };
  PT.room = function (c) { return Math.max(0, (K().max || 2) - PT.planted(c).length); };
  /** 기후가 맞는가 */
  PT.fits = function (d, c) {
    var z = (G.PLANT_ZONE && G.PLANT_ZONE[d.id]) || 'any', r = K().zones[z] || [0, 90], a = Math.abs(c.lat);
    return a >= r[0] && a <= r[1];
  };
  /** 제독이 찾아서 들고 다니는 식물 (교역품이 있는 것) */
  PT.held = function () {
    if (!S() || !G.Disc) return [];
    return (G.PLANTS || []).map(function (id) { return G.DISC[id]; }).filter(function (d) { return d && PT.crop(d) && G.Disc.foundByMe(d.id); });
  };
  /** 이 교역소에 심을 수 있는가: null(된다) 또는 까닭 */
  PT.why = function (d, c) {
    var g = PT.crop(d); if (!g) return '교역품이 되지 않는 식물';
    if (PT.planted(c).indexOf(g.id) >= 0) return '이미 이곳에 심었다';
    if (R.sells(c, g.id)) return '이미 이곳에서 판다';
    if (!PT.fits(d, c)) return PT.ZONE_NAME[(G.PLANT_ZONE || {})[d.id]] + '에서만 자란다';
    if (!PT.room(c)) return '이 교역소에는 더 심을 자리가 없다 (' + (K().max || 2) + '종까지)';
    return null;
  };
  PT.cands = function (c) {
    if (!c || !c.goods) return [];
    return PT.held().filter(function (d) { return !PT.why(d, c); })
      .sort(function (a, b) { return PT.crop(b).p - PT.crop(a).p; });
  };

  // ---------------------------------------------------------------- 특산물 목록 (c.goods)과 산지 (R.origins)
  var synced = null;
  /** 지금 상태에 맞게 도시 특산물을 맞춘다: 심은 것은 넣고, (다른 일지에서) 심었던 것은 뺀다 */
  PT.sync = function () {
    var s = S(); synced = s; PT.ver++;
    var at = s && s.plantTrade && s.plantTrade.at || {};
    (G.CITY_DATA || []).forEach(function (c) {
      if (!c || !c.goods) return;
      var want = at[c.id] || [];
      var keep = c.goods.filter(function (id) { return !PT.isPlantGood(id) || want.indexOf(id) >= 0; });
      want.forEach(function (id) { if (G.GOOD[id] && keep.indexOf(id) < 0) keep.push(id); });
      if (keep.length !== c.goods.length || keep.some(function (id, i) { return c.goods[i] !== id; })) c.goods = keep;
    });
  };
  function ensure() { if (synced !== S()) PT.sync(); }
  PT.ensure = ensure;

  var baseOrigins = R.origins, oc = null, ocVer = -1;
  R.origins = function () {
    ensure();
    if (oc && ocVer === PT.ver) return oc;
    var base = baseOrigins(), out = {};
    for (var k in base) out[k] = base[k];
    var s = S(), at = s && s.plantTrade && s.plantTrade.at || {};
    (G.PLANTS || []).forEach(function (pid) {
      var g = G.PLANT_CROP[pid]; if (!g) return;
      var o = {}; o[g.reg] = true;                                    // 본디 자라는 지역
      for (var cid in at) if (at[cid].indexOf(g.id) >= 0 && G.CITY_DATA[cid]) o[G.CITY_DATA[cid].region] = true;   // 심은 교역소의 지역
      out[g.id] = o;
    });
    oc = out; ocVer = PT.ver;
    return oc;
  };
  var baseCityGoods = R.cityGoods;
  R.cityGoods = function (c) { ensure(); return baseCityGoods(c); };

  /** 심는다 */
  PT.plant = function (d, c) {
    var g = PT.crop(d), p = st(); if (!g || !p || PT.why(d, c)) return false;
    (p.at[c.id] = p.at[c.id] || []).push(g.id);
    p.n = (p.n || 0) + 1;
    delete p.ask[c.id];
    PT.sync();
    var mk = R.market(c.id), e = mk.g[g.id]; if (e) { e.dep = 0; e.sat = 0; }
    if (G.Fame && G.Fame.add && K().fame) G.Fame.add('tr', K().fame);
    if (G.State && G.State.log) G.State.log('「' + d.name + '」' + U.jx(d.name, '을/를') + ' ' + c.name + '에 심었다 — ' + c.name + ' 교역소의 특산물에 「' + g.name + '」' + U.jx(g.name, '이/가') + ' 더해졌다.');
    return true;
  };

  // ---------------------------------------------------------------- 교역소에서
  function C() { return G.Scenes.city; }
  function keeper() { return C().npc('trader', '교역소 주인'); }
  function thumb(d) { var k = G.Img && G.Img.pick ? G.Img.pick(G.Img.chain.discovery(d)) : null; return k ? G.Img.src(k) : null; }
  function homeOf(d) { return G.REGIONS[d.reg] || '먼 땅'; }
  /** 주인과의 대화: 심으면 true */
  async function offer(c, d, first) {
    var g = PT.crop(d), k = keeper();
    var ask = first
      ? '그런데 제독, 소문을 들었네. ' + homeOf(d) + '에서 「' + d.name + '」' + U.jx(d.name, '을/를') + ' 찾아 왔다지? 그 씨앗과 묘목을 우리에게 조금 나눠 주지 않겠나.\f이 고장 땅과 날씨라면 잘 자랄 걸세. 길러서 「' + g.name + '」' + U.jx(g.name, '을/를') + ' 이 교역소의 특산물로 삼고 싶네.'
      : '「' + d.name + '」 말인가? 이 고장에서 길러 「' + g.name + '」' + U.jx(g.name, '을/를') + ' 내다 팔 수 있다면 더할 나위 없지. 정말 나눠 주겠나?';
    var v = await C().ask(k, ask + '\n— 「' + g.name + '」 기준 값 ' + g.p + '닢 · 이 교역소에 더할 수 있는 식물 ' + PT.room(c) + '종 남음 · 찾은 발견물은 그대로 남는다', [
      { label: '씨앗과 묘목을 나눠 준다', value: 1, icon: 'leaf' },
      { label: '다음에 하겠다', value: 0 }]);
    if (!v) {
      if (first) st().ask[c.id] = S().day + (K().askDays || 30);
      await C().say(k, '아쉽군. 마음이 바뀌면 언제든 들러 주게.');
      return false;
    }
    if (!PT.plant(d, c)) return false;
    await C().say(k, U.pick([
      '고맙네, 제독! 당장 성 밖 밭에 심겠네. 이 고장 농부들 솜씨라면 곧 장에 내놓을 수 있을 걸세.',
      '이걸로 이 교역소에도 남들이 부러워할 물건이 생겼군. 고맙네, 정말 고마워.',
      '자네가 먼 바다에서 가져온 것이 이 땅에 뿌리를 내리는구먼. 오늘부터 우리 장에서 「' + g.name + '」' + U.jx(g.name, '을/를') + ' 팔겠네.']));
    UI.toast('「' + g.name + '」 — ' + c.name + ' 교역소의 특산물이 되었다 (발견물 「' + d.name + '」은 그대로)', { icon: 'leaf', src: thumb(d) }, 5200);
    return true;
  }
  /** 교역소에 들어설 때: 주인이 먼저 청한다 */
  PT.atTrade = async function (c) {
    var p = st(); if (!p || !PT.room(c)) return false;
    if (p.ask[c.id] && S().day < p.ask[c.id]) return false;
    var list = PT.cands(c); if (!list.length) return false;
    return offer(c, list[0], true);
  };
  /** 교역소 메뉴 한 줄 */
  PT.menuItem = function (c) {
    var held = PT.held(); if (!held.length) return null;
    var n = PT.planted(c).length, cand = PT.cands(c).length;
    return { label: '식물을 심는다', icon: 'leaf', sub: '식물 특산물 ' + n + '/' + (K().max || 2) + (cand ? ' · 심을 수 있는 식물 ' + cand + '종' : ''), onClick: function () { return PT.visit(c); } };
  };
  /** 메뉴에서: 들고 있는 식물을 고른다 */
  PT.visit = async function (c) {
    for (;;) {
      var held = PT.held(), planted = PT.planted(c);
      var head = planted.length ? '이 교역소에 심은 식물: ' + planted.map(function (id) { return '「' + G.GOOD[id].name + '」'; }).join(' · ') : '아직 이 교역소에 심은 식물은 없다.';
      var opts = held.map(function (d) {
        var g = PT.crop(d), why = PT.why(d, c);
        return { label: U.esc(d.name) + ' → ' + U.esc(g.name), right: why ? '<span class="muted">' + U.esc(why) + '</span>' : g.p + '닢', value: d.id, disabled: !!why, thumb: thumb(d),
          desc: homeOf(d) + ' · ' + PT.ZONE_NAME[(G.PLANT_ZONE || {})[d.id] || 'any'] };
      });
      var id = await UI.choose('식물을 심는다 — ' + c.name + ' 교역소', opts, { icon: 'leaf', width: 640, text: U.esc(head) + '<br><span class="muted">한 교역소에 ' + (K().max || 2) + '종까지 · 심어도 발견물은 남는다 · 기후가 맞아야 자란다</span>' });
      if (id == null) return;
      var d = G.DISC[id], why = PT.why(d, c);
      if (why) { UI.toast('「' + d.name + '」 — ' + why, 'leaf', 3600); continue; }
      await offer(c, d, false);
      return;
    }
  };

  // ---------------------------------------------------------------- 걸어 두기
  function hook() {
    var T = G.Scenes && G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.trade;
    if (!T || PT.hooked) return;
    var enter0 = T.enter, menu0 = T.menu;
    T.enter = async function (c) {
      var r = await enter0.apply(this, arguments);
      try { await PT.atTrade(c); } catch (e) { console.error(e); }
      return r;
    };
    T.menu = function (c) {
      var list = menu0.apply(this, arguments) || [], it = PT.menuItem(c);
      if (it) list.splice(Math.min(4, list.length), 0, it);
      return list;
    };
    var C0 = G.Scenes.city, arr0 = C0.arrival;
    if (arr0) C0.arrival = function () { ensure(); return arr0.apply(this, arguments); };
    PT.hooked = true;
  }
  hook();
})(window.G = window.G || {});
