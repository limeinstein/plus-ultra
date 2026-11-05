/* 항구 영향도 (G.Influence) — 2026-11-05 사용자 요청 「동인도 회사나 투자가 커지면 제독이 몸담은 나라의 항구 영향도가 높아진다 · 1602년부터 · 영향도가 높으면 교역에 이점」
   조정값: js/data/influence.js (G.BALANCE.influence)
   ■ 언제: 1602년 3월 20일(연합 동인도 회사 설립)부터. 그 전에는 어느 항구도 0이고 화면에 보이지 않는다.
   ■ 누구의 영향도: 제독의 나라(포르투갈·에스파냐 — G.Colony.natName). 항구마다 0~100.
   ■ 무엇이 올리나 (세 갈래를 더한다)
     · 투자 — 그 항구 교역소 출자 등급 × perInvest (5등급 35)
     · 회사 — 그 항구에 본부·상관이 있는 회사 가운데 가장 큰 몫 (상한 companyMax):
               회사 사람이면 계급만큼(member) · 그 회사 주식(주가 × 주식 수)만큼(stakeMax까지) · 제독이 세운 상관이면 built. 다른 나라 회사는 foreignK배(절반)
     · 실적 — 그 항구에서 한 회사 일(주문서 고리·회사 창고·독점품 납품·임무 보고·귀환 선단·상관 건설)이 쌓인다. 두 해마다 절반으로 줄고 act.max까지
   ■ 이점 (영향도에 비례 — 100일 때): 사는 값 −15% · 파는 값 +12% · 교역소 재고 +50% · 시장이 받아 주는 양 +40% · 회사 창고 할당 +50%
     (js/core/rules.js R.buyPrice·R.sellPrice·R.stockCapacity·R.satCap 이 IF.mult를 곱한다 · js/systems/company.js CO.quotaLeft)
   ■ 단계: 발판 10 · 우세 30 · 지배 55 · 독점 80 — 항구에 들어설 때 단계가 오르면 알린다. 교역소 메뉴 글에 「포르투갈 영향도 42 · 우세」.
     수첩 「교역」의 회사 상자 아래에 영향도가 높은 항구 (IF.box).
   ■ 저장: s.influence = { act: {도시: {v, d(날)}}, tier: {도시: 알린 단계}, told: 1602년 소식을 알렸나 } — 옛 저장에는 없으므로 st()가 만든다 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var IF = G.Influence = {};
  function K() { return G.BALANCE.influence; }
  function S() { return G.Game && G.Game.state; }
  function st() {
    var s = S(); if (!s) return null;
    var b = s.influence || (s.influence = {});
    if (!b.act || typeof b.act !== 'object') b.act = {};
    if (!b.tier || typeof b.tier !== 'object') b.tier = {};
    return b;
  }
  IF.state = st;
  /** 영향도를 셈하는 때인가 (1602년 3월 20일부터) */
  IF.on = function () { var s = S(); return !!(s && s.date && U.dateNum(s.date) >= K().from); };
  /** 나라 이름 → 기호 (PT·ES·EN·NL·FR…) */
  IF.code = function (name) { return (G.COLONY_POWERS || {})[name] || null; };
  IF.myCode = function () { var s = S(); return G.Colony && G.Colony.natCode ? G.Colony.natCode() : (s && s.player.nation === 'ES' ? 'ES' : 'PT'); };
  IF.myName = function () { return G.Colony && G.Colony.natName ? G.Colony.natName() : (IF.myCode() === 'ES' ? '에스파냐' : '포르투갈'); };
  /** 이 회사 일이 제독의 나라에 주는 몫 (같은 나라 1 · 다른 나라 foreignK) */
  IF.natK = function (co) { co = typeof co === 'string' ? G.COMPANY[co] : co; return co && IF.code(co.nation) === IF.myCode() ? 1 : K().foreignK; };

  // ================================================================ 세 갈래
  function investPart(c) {
    var s = S(); if (!s.invest || !s.invest[c.id] || !R.investLv) return 0;   // 출자한 적 없는 항구는 R.invest가 빈 기록을 만들지 않게
    return K().perInvest * R.investLv(c.id);
  }
  var cache = {}, cacheDay = null;
  /** 회사 갈래 — 하루 동안 기억한다 (입회·승진·주식 매매·상관 건설 때 IF.bump로 비운다) */
  function companyPart(c) {
    var s = S(), CO = G.Company, b = CO && CO.state && CO.state();
    if (!b) return 0;
    if (cacheDay !== s.day) { cache = {}; cacheDay = s.day; }
    if (c.id in cache) return cache[c.id];
    var k = K(), best = 0, why = null;
    CO.actives().forEach(function (co) {
      if (!CO.presentAt(co, c.id)) return;
      var v = 0, mem = CO.isMember(co), n = b.shares[co.id] || 0, post = CO.postAt(co, c.id);
      if (mem) v += k.member[b.rank] || 0;
      if (n > 0) v += k.stakeMax * Math.min(1, n * CO.px(co) / k.stakeFull);
      if (post && post.mine) v += k.built;
      v *= IF.natK(co);
      if (v > best) { best = v; why = co.id; }
    });
    best = Math.min(k.companyMax, best);
    cache[c.id] = best; cache['w' + c.id] = why;
    return best;
  }
  IF.bump = function () { cache = {}; cacheDay = null; };
  function decayed(e) { var s = S(); return (e.v || 0) * Math.pow(0.5, Math.max(0, s.day - (e.d || 0)) / K().act.half); }
  function actPart(c) { var b = st(), e = b && b.act[c.id]; return e ? Math.min(K().act.max, decayed(e)) : 0; }
  /** 실적을 더한다 — pts 점 (co를 주면 다른 나라 회사 일은 절반). 1602년 전에는 쌓이지 않는다 */
  IF.add = function (c, pts, co) {
    if (!c || !IF.on() || !(pts > 0)) return 0;
    if (co) pts *= IF.natK(co);
    var b = st(), s = S(), e = b.act[c.id], v = Math.min(K().act.max, (e ? decayed(e) : 0) + pts);
    b.act[c.id] = { v: Math.round(v * 100) / 100, d: s.day };
    return pts;
  };
  /** 이 항구의 영향도 갈래 {invest, company, act, total, via(회사 id)} */
  IF.parts = function (c) {
    if (!c || !IF.on()) return { invest: 0, company: 0, act: 0, total: 0, via: null };
    var a = investPart(c), b = companyPart(c), d = actPart(c);
    return { invest: a, company: b, act: d, total: Math.min(100, Math.round(a + b + d)), via: cache['w' + c.id] || null };
  };
  /** 이 항구의 영향도 (0~100) */
  IF.level = function (c) {
    if (!c || !IF.on()) return 0;
    return Math.min(100, Math.round(investPart(c) + companyPart(c) + actPart(c)));
  };
  /** 단계 {i, name, at(그 단계가 시작되는 값), next(다음 단계 값)} */
  IF.tier = function (v) {
    var T = K().tiers, i = 0;
    for (var j = 0; j < T.length; j++) if (v >= T[j][0]) i = j;
    return { i: i, name: T[i][1], at: T[i][0], next: T[i + 1] ? T[i + 1][0] : null };
  };
  /** 교역 값·재고·수요에 곱하는 값 (rules.js) — side: 'buy' | 'sell' | 'stock' | 'demand' | 'quota' */
  IF.mult = function (c, goodId, side) {
    if (!c || !IF.on()) return 1;
    var v = IF.level(c); if (!v) return 1;
    var e = K().effect, i = v / 100;
    if (side === 'buy') return 1 - e.buy * i;
    if (side === 'sell') return 1 + e.sell * i;
    if (side === 'stock') return 1 + e.stock * i;
    if (side === 'demand') return 1 + e.demand * i;
    if (side === 'quota') return 1 + e.quota * i;
    return 1;
  };
  function pct(x) { return Math.round(x * 100); }
  /** 「사는 값 −6% · 파는 값 +5% · 재고 +21%」 */
  IF.effText = function (v) {
    var e = K().effect, i = v / 100;
    return '사는 값 −' + pct(e.buy * i) + '% · 파는 값 +' + pct(e.sell * i) + '% · 재고 +' + pct(e.stock * i) + '% · 받아 주는 양 +' + pct(e.demand * i) + '%';
  };
  /** 교역소 메뉴 글: 「포르투갈 영향도 42 · 우세」 (없으면 '') */
  IF.tag = function (c) {
    var v = IF.level(c); if (!v) return '';
    return IF.myName() + ' 영향도 ' + v + ' · ' + IF.tier(v).name;
  };

  // ================================================================ 들어설 때 · 날마다
  /** 항구에 들어설 때 (js/systems/company.js CO.arrival): 단계가 오르면 알린다 */
  IF.arrival = function (c) {
    if (!c || !IF.on()) return null;
    var b = st(), v = IF.level(c), t = IF.tier(v), was = b.tier[c.id] || 0;
    if (t.i === was) return null;
    b.tier[c.id] = t.i;
    if (t.i < was) return null;   // 줄어든 것은 조용히 (교역소 글에는 보인다)
    var text = c.name + ' — ' + IF.myName() + '의 영향도가 「' + t.name + '」(' + v + ')에 올랐다. ' + IF.effText(v);
    UI.toast(text, 'flag', 6200);
    G.State.log(text);
    return text;
  };
  /** 날마다 (G.World.daily) — 1602년이 되면 한 번 알린다 */
  IF.daily = function () {
    var b = st(); if (!b || b.told || !IF.on()) return [];
    b.told = 1;
    return [{ icon: 'flag', history: true, text: '연합 동인도 회사가 세워졌다 — 이제 회사와 투자가 항구마다 나라의 힘을 심는다. 교역소에 출자하고, 회사에서 일하고, 회사 주식을 쥐면 그 항구에서 ' + IF.myName() + '의 영향도가 오른다. 영향도가 높은 항구에서는 싸게 사고 비싸게 판다. (수첩 「교역」)' }];
  };

  // ================================================================ 수첩
  /** 영향도가 있는 항구 [{c, v, p}] — 높은 것부터 */
  IF.list = function () {
    if (!IF.on()) return [];
    var out = [];
    G.CITY_DATA.forEach(function (c) {
      if (!c || !c.port || !R.cityExists(c)) return;
      var p = IF.parts(c); if (p.total > 0) out.push({ c: c, v: p.total, p: p });
    });
    return out.sort(function (a, z) { return z.v - a.v; });
  };
  IF.box = function () {
    if (!IF.on()) return '';
    var L = IF.list(), k = K();
    var head = '<b>' + G.icon('flag') + ' ' + U.esc(IF.myName()) + '의 항구 영향도</b> <small class="muted">— 교역소 출자 · 회사(계급·주식·세운 상관) · 회사 일의 실적. 높을수록 싸게 사고 비싸게 판다 (100이면 ' + U.esc(IF.effText(100)) + ')</small>';
    if (!L.length) return '<div class="era-box inf-box">' + head + '<div class="era-row"><small class="muted">아직 영향도가 있는 항구가 없다 — 교역소에 출자하거나 회사에 들어 상관이 있는 항구에서 일하자.</small></div></div>';
    var rows = L.slice(0, k.list).map(function (x) {
      var t = IF.tier(x.v), via = x.p.via && G.COMPANY[x.p.via];
      var bits = [];
      if (x.p.invest) bits.push('투자 ' + Math.round(x.p.invest));
      if (x.p.company) bits.push('회사 ' + Math.round(x.p.company) + (via ? '(' + via.short + ')' : ''));
      if (x.p.act >= 0.5) bits.push('실적 ' + Math.round(x.p.act));
      return '<div class="era-row"><span class="era-lbl">' + U.esc(x.c.name) + '</span> <span style="display:inline-block;width:90px;vertical-align:middle">' + UI.bar(x.v, 100, x.v >= 55 ? 'green' : '') + '</span> <b>' + x.v + '</b> ' + U.esc(t.name) + ' <small class="muted">' + U.esc(bits.join(' · ')) + '</small></div>';
    }).join('');
    return '<div class="era-box inf-box">' + head + rows + (L.length > k.list ? '<div class="era-row"><small class="muted">그 밖에 ' + (L.length - k.list) + '곳</small></div>' : '') + '</div>';
  };

  // ================================================================ 걸기
  (function hookDaily() {
    var W = G.World; if (!W || W._influence) return;
    W._influence = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(IF.daily()); } catch (e) { console.error(e); } return out; };
  })();
  // 교역소 메뉴 글에 영향도 (js/city/trade.js T.sub)
  (function hookTrade() {
    var C = G.Scenes && G.Scenes.city, T = C && C.B && C.B.trade; if (!T || T._influence) return;
    T._influence = true;
    var os = T.sub;
    T.sub = function (c) { var a = os ? os.apply(this, arguments) : '', t = ''; try { t = IF.tag(c); } catch (e) { console.error(e); } return t ? (a ? a + ' · ' : '') + t : a; };
  })();
  // 회사의 입회·탈퇴·승진·주식 매매는 회사 갈래를 바꾼다 — 그날의 셈을 비운다
  (function hookCompany() {
    var CO = G.Company; if (!CO || CO._influence) return;
    CO._influence = true;
    ['join', 'leave', 'promote', 'buy', 'sell'].forEach(function (k) {
      var f = CO[k]; if (typeof f !== 'function') return;
      CO[k] = function () { var r = f.apply(this, arguments); IF.bump(); return r; };
    });
  })();
})(window.G = window.G || {});
