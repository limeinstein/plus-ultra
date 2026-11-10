/* 대단한 거래 · 교역왕 (2026-11-10 사용자 요청)
   ■ 어느 대륙의 교역소에서 한 번 판 거래(한 품목 매각 · 「모두 판다」 · 「고른 것 한꺼번에 판다」 한 번)의 이익이
     G.BALANCE.tradeDeals.min(100만 닢) 이상이면 그 대륙의 업적 「○○의 대단한 거래」.
     여러 번 나눠 판 이익은 더하지 않는다 — 한 번에 낸 이익만 센다.
   ■ 그 시대에 교역소가 있는 모든 대륙에서 대단한 거래를 이루면 업적 「교역왕」.
     오세아니아는 시드니(1788)부터 도시가 생긴다 — 그 전에는 교역왕의 조건에 넣지 않고, 도시가 생긴 뒤에는 넣는다(이미 이룬 교역왕은 그대로).
   ■ 대륙은 도시의 문화권(region)이 아니라 자리로 가른다: 지중해 문화권의 튀니스·알제·트리폴리와 중근동의 이집트는 아프리카,
     아나톨리아·키프로스는 아시아, 세우타·마디라·카나리아는 아프리카, 볼가 강의 카잔·아스트라한은 유럽, 동남아 문화권의 시드니·웰링턴은 오세아니아.
   ■ 저장: state.bigDeal[대륙] = { p: 가장 큰 한 번의 이익, c: 도시 id, d: 날짜 }
   ■ 연결: js/city/trade.js 매각 뒤 TK.sold(c, profit) → 업적 기록·보상(G.Achieve.check) → 그 자리에서 업적 장면 */
(function (G) {
  'use strict';
  var TK = G.TradeKing = {};
  TK.CONTS = [
    { id: 'eu', name: '유럽' },
    { id: 'af', name: '아프리카' },
    { id: 'as', name: '아시아' },
    { id: 'am', name: '아메리카' },
    { id: 'oc', name: '오세아니아' }
  ];
  TK.achId = function (k) { return 'bigdeal_' + k; };
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.tradeDeals) || { min: 1000000 }; }
  function store() { var s = S(); return s ? (s.bigDeal || (s.bigDeal = {})) : {}; }

  /** 도시 → 대륙 id (eu·af·as·am·oc) */
  TK.continent = function (c) {
    if (!c) return null;
    var r = c.region, la = +c.lat || 0, lo = +c.lon || 0;
    if (r === 10) return lo < -140 || lo > 160 ? 'oc' : 'am';
    if (r === 8) return la < -10 && lo > 112 ? 'oc' : 'as';
    if (r === 3) return 'af';
    if (r === 1) return 'eu';
    if (r === 0) return la < 36.2 ? 'af' : 'eu';                                   // 세우타·마디라·라스팔마스
    if (r === 2) return la < 34 || (la < 37 && lo < 11.5) ? 'af' : la < 42.5 && lo > 29.1 ? 'as' : 'eu';   // 마그레브 · 아나톨리아·키프로스 · 나머지(이스탄불·크레타·크림 포함)
    if (r === 4) return lo < 34 && la < 31.6 ? 'af' : 'as';                        // 이집트
    if (r === 7) return lo < 55 && la > 44 ? 'eu' : 'as';                           // 카잔·아스트라한
    return 'as';
  };
  TK.name = function (k) { var x = TK.CONTS.filter(function (o) { return o.id === k; })[0]; return x ? x.name : k; };
  /** 지금 이 대륙에 교역소가 있는 도시가 하나라도 있나 */
  TK.open = function (k) {
    var R = G.R;
    return (G.CITY_DATA || []).some(function (c) { return c && !c.outpost && TK.continent(c) === k && (!R || !R.cityExists || R.cityExists(c)); });
  };
  TK.best = function (k) { var b = store()[k]; return b ? b.p || 0 : 0; };

  /** 교역소에서 한 번 팔았다 (trade.js) — 대단한 거래를 새로 이루면 장면까지 띄운다 */
  TK.sold = async function (c, profit) {
    var s = S(), k = TK.continent(c);
    if (!s || !k || !(profit > 0)) return [];
    var st = store(), b = st[k];
    if (!b || profit > (b.p || 0)) st[k] = { p: Math.round(profit), c: c.id, d: G.U ? G.U.dateNum(s.date) : 0 };
    if (profit < K().min || !G.Achieve) return [];
    var got = G.Achieve.check();
    if (!got.length) return got;
    got.forEach(function (a) { if (G.UI && G.UI.toast) G.UI.toast('업적 달성 · ' + a.name, 'crown', 4800); });
    await new Promise(function (r) { setTimeout(r, 900); });      // 금화비(G.TradeFX)가 먼저 쏟아지게
    for (var i = 0; i < got.length; i++) { try { await G.Achieve.scene(got[i]); } catch (e) { console.error(e); } }
    return got;
  };

  function hook() {
    var AC = G.Achieve; if (!AC) return;
    AC.rules = AC.rules || {};
    TK.CONTS.forEach(function (o) {
      AC.rules[TK.achId(o.id)] = function () {
        var b = store()[o.id], where = b && G.CITY_DATA[b.c] ? ' (' + G.CITY_DATA[b.c].name + ')' : '';
        return [{ label: o.name + ' 교역소 · 한 번에 낸 가장 큰 이익' + where, count: TK.best(o.id), n: K().min, money: true }];
      };
    });
    AC.rules.tradeking = function () {
      return TK.CONTS.filter(function (o) { return AC.done(TK.achId(o.id)) || TK.open(o.id); }).map(function (o) {
        return { label: o.name + '의 대단한 거래', count: AC.done(TK.achId(o.id)) ? 1 : 0, n: 1 };
      });
    };
  }
  hook();
})(window.G = window.G || {});
