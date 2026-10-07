/* 교역소: 구입, 매각, 회화, 값 깎기 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city;
  function S() { return G.Game.state; }
  var T = { title: '교역소', icon: 'scales', paint: 'trade' };
  C.B.trade = T;
  var GOOD_COL = { food: '#c9a860', drink: '#8a2a3a', spice: '#b5652a', lux: '#5a3a24', fiber: '#e8e0cc', cloth: '#6a4a9a', ore: '#6a6a70', metal: '#e0c050', gem: '#3a8a9a', craft: '#9a6a4a', arms: '#3a3a44', misc: '#7a8a4a' };
  G.goodDot = function (id) {
    var g = G.GOOD[id], key = g && G.Img && G.Img.chain.good ? G.Img.pick(G.Img.chain.good(g)) : null;
    if (key) return '<span class="goodico pic"><img src="' + G.Img.src(key) + '" alt=""></span>';
    return '<span class="goodico" style="background:' + (GOOD_COL[g.cat] || '#888') + '"></span>';
  };

  function keeper() { return C.npc('trader', '교역소 주인'); }
  T.enter = async function (c) {
    var cur = C.current(), mk0 = R.market(c.id); cur.talked = false;
    // 같은 날 다시 들어와도 값 깎기를 새로 굴릴 수 없다 (나갔다 들어오기만 하면 되던 것)
    cur.haggle = mk0.hag && mk0.hag.day === R.S().day ? mk0.hag.h : null;
    cur.hagN = mk0.hag && mk0.hag.day === R.S().day ? (mk0.hag.n || (mk0.hag.h ? 99 : 0)) : 0;   // 오늘 이 교역소에서 흥정한 횟수 (회계 단계만큼 할 수 있다)
    if (G.Ledger) G.Ledger.record(c);
    var lv = C.langLv(c);
    await C.say(keeper(), lv === 0 ? '어서 오게. 무엇을 찾나?' : C.hail(c, 'trade', ['어서 오게. 좋은 물건이 들어와 있다네.', '어서 오게! 오늘은 무엇을 사겠나?', '팔 물건이 있으면 보여 주게.']));
    if (G.Escort) { try { await G.Escort.atTrade(c); } catch (e) { console.error(e); } }   // 가끔 상인이 다가와 호위를 청한다
  };
  T.sub = function (c) { var m = R.market(c.id); return m.ev ? '시세: ' + m.ev : '물건을 사고팝니다'; };
  T.menu = function (c) {
    var cur = C.current(), h = cur && cur.haggle;
    var iv = R.investTick(c), lv = R.investLv(c.id), div = Math.floor(iv.div);
    var debts = G.Quest ? G.Quest.debtAt(c) : [];
    return [
      { label: '구입', icon: 'coin', onClick: function () { return T.buy(c); } },
      { label: '매각', icon: 'sack', sub: R.cargoQty() ? R.cargoQty() + '통' : '', onClick: function () { return T.sell(c); } },
      { label: '투자', icon: 'seal', sub: lv ? '출자 ' + lv + '등급' + (div >= 1 ? ' · 배당 ' + U.num(div) + '닢' : '') : '', onClick: function () { return T.invest(c); } },
      { label: '회화', icon: 'people', onClick: function () { return T.talk(c); } },
      { label: '시세', icon: 'chart', sub: R.market(c.id).ev ? R.market(c.id).ev : '품목 갈래별 값', onClick: function () { return T.quotes(c); } },
      { label: R.purser() ? '값 후려치기' : '값 깎기', icon: 'scales', sub: h ? (h.ok ? '성공' : '실패') : (T.hagLeft(c) < T.hagMax() ? '남은 흥정 ' + T.hagLeft(c) + '번' : R.purser() ? '경리 ' + R.purser().name : G.Court && G.Court.haggle(c) ? '귀족의 권한' : G.Acct && T.hagMax() > 1 ? '흥정 ' + T.hagMax() + '번' : ''), dim: !!h, onClick: function () { return T.haggle(c); } },
      G.BlackMarket && G.BlackMarket.open(c) ? { label: '뒷골목 암시장', icon: 'seal', sub: '회계 ' + G.Acct.lv() + ' · 비밀 거래', onClick: function () { return G.BlackMarket.visit(c); } } : null,
      debts.length ? { label: '빚을 받으러 간다', icon: 'scroll', sub: debts[0].who, onClick: function () { return T.debt(c, debts[0]); } } : null,
      G.Escort ? G.Escort.menuItem(c) : null     // 호위를 청하는 상인 · 호위 중인 상인 (js/systems/escort.js)
    ];
  };
  T.panel = function () { return G.Info.fleetPanel({ compact: true }); };

  function where(b) {
    if (!b) return '<span class="muted">—</span>';
    var ag = b.age;
    return U.num(b.price) + ' <small class="muted">' + G.CITY_DATA[b.city].name + (ag > 60 ? ' · ' + ag + '일 전' : '') + '</small>';
  }
  function hag() { var cur = C.current(); return cur && cur.haggle && cur.haggle.ok && cur.haggle.buy ? cur.haggle : null; }   // 값 깎기에 성공했을 때만
  // 값 깎기는 사는 값을 올리거나 파는 값을 내리는 일이 없다 (예전: 실패 벌칙 ×1.03이 「후려쳤더니 값이 오른」 것처럼 보였다)
  function duty(c) { return G.Court ? G.Court.duty(c) : 0; }   // 면세증: 그 나라 항구에서 관세만큼 싸게 사고 비싸게 판다 (js/systems/court.js)
  /** 유럽 시장의 시대 수요 꼬리표 (js/systems/era.js) — 오르면 ▲, 내리면 ▼ */
  function eraTag(c, id) {
    if (!G.Era) return '';
    var v = G.Era.mult(c, id); if (v < 1.15 && v > 0.87) return '';
    var nt = (G.ERA_DEMAND[id] || {}).note || '';
    return ' <span class="tag ' + (v >= 1 ? 'era-up' : 'era-down') + '" title="' + U.esc('유럽 시장의 시대 수요 ×' + v.toFixed(2) + (nt ? ' — ' + nt : '')) + '">시대 ' + (v >= 1 ? '▲' : '▼') + '</span>';
  }
  /** 살아 있는 경제의 꼬리표 (js/systems/economy.js · js/data/econ.js): 세상의 시장 사건 ▲▼ */
  function evTag(c, id) { return G.Econ ? G.Econ.tag(c, id) : ''; }
  /** 이 물건이 가장 비싸게 팔리는 지역들 (산지에서 먼 곳): [{r, m}] 큰 순 */
  function farRegions(id) {
    return G.REGIONS.map(function (n, r) { return { r: r, m: R.regionalMult(id, r) }; }).sort(function (a, b) { return b.m - a.m; });
  }
  T.farRegions = farRegions;
  /** 구입 창: 이 고장 특산물이면 「특산」 — 멀리 가면 몇 배에 팔리는지 */
  function specTag(c, id) {
    if (!R.sells(c, id) || R.isRelay(c, id)) return '';
    var fr = farRegions(id), x = fr[0].m / 0.62;
    if (x < 1.5) return ' <span class="tag spec" title="이 고장에서 나는 물건이라 싸고 재고가 넉넉하다. 어디서나 흔한 물건이라 멀리 가져가도 크게 남지는 않는다.">특산</span>';
    return ' <span class="tag spec" title="' + U.esc('이 고장에서 나는 물건이라 싸고 재고가 넉넉하다. 산지에서 먼 ' + fr.slice(0, 2).map(function (x) { return G.REGIONS[x.r]; }).join('·') + '에서는 산지 값의 약 ' + x.toFixed(1) + '배에 팔린다 (시세·사건에 따라 다름).') + '">특산 ×' + x.toFixed(1) + '</span>';
  }
  /** 매각 창: 산지에서 먼 곳이면 「귀함」, 그 물건이 나는 고장이면 「산지」 */
  function rareTag(c, id) {
    if (R.isRelay(c, id)) return '';
    if (R.sells(c, id)) return ' <span class="tag cheap" title="이 물건이 나는 고장이라 흔하다 — 팔아도 헐값이고, 조금만 팔아도 값이 곤두박질친다.">산지</span>';
    var m = R.regionalMult(id, c.region);
    return m >= 1.6 ? ' <span class="tag rare" title="' + U.esc('산지에서 멀리 떨어진 고장이라 이 물건이 귀하다 — 기준 값의 약 ' + m.toFixed(1) + '배') + '">귀함</span>' : '';
  }
  /** 이 시장이 값이 무너지기 전에 더 받아 줄 양 (포화 1까지) — 모자람 사건이 있으면 그 모자란 양도 */
  function demandCell(c, id) {
    var mk = R.market(c.id), sat = mk.g[id] ? mk.g[id].sat : 0, cap = R.satCap(c, id), room = Math.max(0, Math.round(cap * (1 - sat) / 10) * 10);
    var need = G.Econ ? G.Econ.needAt(c, id) : 0;
    if (need >= 10) return '<span class="up" title="세상의 시장 사건으로 이 물건이 모자라다 — 그만큼 채워질 때까지 값이 높다">모자람 ' + U.num(Math.round(need / 10) * 10) + '통</span>';
    var lbl = sat >= 1 ? '<span class="up" title="이미 받아 줄 양을 넘었다 — 팔수록 값이 무너진다">넘침</span>' : sat >= 0.5 ? '<span class="muted" title="최근 이 물건이 많이 들어왔다">많음 · 약 ' + U.num(room) + '통</span>' : '<span title="이만큼까지는 값이 완만하게 떨어지고, 넘기면 폭락한다">약 ' + U.num(room) + '통</span>';
    return lbl;
  }
  function buyP(c, id) { var p = R.buyPrice(c, id); var h = hag(), d = duty(c); if (d) p = Math.max(1, Math.round(p * (1 - d))); return h ? Math.max(1, Math.round(p * Math.min(1, h.buy))) : p; }
  // 파는 값 웃돈은 이 도시가 팔지 않는 물건(들여온 물건)에만 — 깎아서 산 그 자리 물건을 웃돈 받고 되팔아 남기던 것을 막는다
  function sellP(c, id) { var p = R.sellPrice(c, id); var h = hag(), d = duty(c); p = h && !R.sells(c, id) ? Math.round(p * Math.max(1, h.sell)) : p;
    if (d && !R.sells(c, id)) p = Math.round(p * (1 + d));
    var cg = S().fleet.cargo[id]; if (G.Cargo && cg) p = Math.max(1, Math.round(p * G.Cargo.fresh(id, cg)));   // 오래 묵은 먹을거리·향신료는 값이 떨어진다
    return p; }
  function keepHag(c, h) { var cur = C.current(); R.market(c.id).hag = { day: R.S().day, h: h, n: cur ? cur.hagN || 0 : 0 }; return h; }
  /** 흥정 횟수: 회계 단계에 따라 (G.Acct.tries) · 오늘 남은 횟수 */
  T.hagMax = function () { return G.Acct ? G.Acct.tries() : 1; };
  T.hagLeft = function (c) { var cur = C.current(); return Math.max(0, T.hagMax() - ((cur && cur.hagN) || 0)); };
  T.buyP = buyP; T.sellP = sellP;

  // ---------------------------------------------------------------- buy
  T.buy = async function (c) {
    var s = S();
    for (;;) {
      var goods = R.cityGoods(c).filter(function (id) { return G.GOOD[id] && (!G.GOOD[id].nw || c.region === 10 || R.S().date.y >= 1520); });
      var rows = goods.map(function (id) {
        var g = G.GOOD[id], have = s.fleet.cargo[id] ? s.fleet.cargo[id].q : 0;
        var bs = G.Ledger ? G.Ledger.bestSell(id, c.id) : null, gain = bs ? bs.price - buyP(c, id) : null;
        var relay = R.isRelay(c, id) ? ' <span class="tag relay" title="이 항구는 산지가 아니라 먼 곳(' + G.TradeGoods.originRegions(id).join('·') + ')에서 들여와 판다 — 산지보다 비싸지만 더 먼 곳에 팔면 남는다">중계</span>' : '';
        return '<tr class="click" data-id="' + id + '"><td>' + G.goodDot(id) + '<b>' + g.name + '</b>' + relay + specTag(c, id) + (G.Fad && G.Fad.at(c, id) ? ' <span class="tag" title="유행하는 물건 — 값이 뛰었다">유행</span>' : '') + eraTag(c, id) + evTag(c, id) + '</td><td class="muted">' + G.GOOD_CATS[g.cat] + (G.Cargo ? ' <small title="1통의 무게 — 배가 버티는 무게에 들어간다">· 무게 ' + G.Cargo.wt(id) + '</small>' : '') + '</td><td class="num">' + U.num(buyP(c, id)) + '</td><td class="num">' + R.supply(c, id) + '</td><td class="num">' + (have || '') + '</td>' +
          '<td class="num">' + where(bs) + '</td><td class="num ' + (gain > 0 ? 'down' : 'up') + '">' + (gain == null ? '' : (gain > 0 ? '+' : '') + U.num(gain)) + '</td></tr>';
      }).join('');
      var html = '<div class="flex" style="margin-bottom:10px;font-size:17px"><span>소지금 <b>' + U.num(s.player.gold) + '</b>닢</span><span class="right">적재 여유 <b>' + Math.max(0, Math.floor(R.freeVol())) + '</b>통' + (G.Cargo ? ' · 무게 여유 <b>' + Math.max(0, Math.floor(G.Cargo.wfree())) + '</b>' : '') + ' · 품목 ' + Object.keys(s.fleet.cargo).length + '/' + R.maxKinds() + '</span></div>' +
        '<table class="tbl"><tr><th>품목</th><th>분류</th><th class="num">가격(1통)</th><th class="num">재고</th><th class="num">보유</th><th class="num">알려진 최고 매각가</th><th class="num">1통 이익</th></tr>' + rows + '</table>' +
        '<div class="muted" style="margin-top:6px;font-size:14px">매각가는 들러 본 교역소의 기록입니다. 교역소에 들를 때마다 시세 수첩이 새로 적힙니다.' + (R.cityGoods(c).some(function (id) { return R.isRelay(c, id); }) ? ' 「중계」는 이 항구가 먼 산지에서 들여온 물건이라 산지보다 비쌉니다.' : '') + ' 「특산 ×N」은 이 고장 산물 — 산지에서 먼 곳에서는 약 N배에 팔립니다. ▲▼는 세상의 시장 사건(가뭄·전쟁·풍작…)으로 모자라거나 넘치는 물건입니다.</div>' +
        (hag() ? '<div class="good-text" style="margin-top:8px">값 깎기에 성공해 ' + Math.round((1 - hag().buy) * 100) + '% 싸게 살 수 있습니다.</div>' : '') +
        (duty(c) ? '<div class="good-text" style="margin-top:6px">면세증 — 관세 없이 ' + Math.round(duty(c) * 100) + '% 싸게 삽니다. 들여온 물건은 ' + Math.round(duty(c) * 100) + '% 비싸게 팝니다.</div>' : '');
      var picked = null;
      var win = UI.window({ title: '구입 — ' + c.name, icon: 'coin', width: 1040, html: html, buttons: [{ label: '돌아간다', value: null }],
        onBuild: function (el, w) { U.$$('tr.click', el).forEach(function (tr) { tr.onclick = function () { picked = tr.dataset.id; w.close('pick'); }; }); } });
      var v = await win.result;
      if (v !== 'pick' || !picked) return;
      await buyOne(c, picked);
    }
  };
  async function buyOne(c, id) {
    var s = S(), g = G.GOOD[id], price = buyP(c, id), f = s.fleet;
    if (!f.cargo[id] && Object.keys(f.cargo).length >= R.maxKinds()) { await C.say(keeper(), '자네 배에는 더 이상 다른 종류의 짐을 실을 곳이 없어 보이는군. (품목 ' + R.maxKinds() + '종까지)'); return; }
    var stock = R.supply(c, id), free = G.Cargo ? G.Cargo.room(id) : Math.max(0, R.free()), byGold = Math.floor(s.player.gold / price);
    var mx = Math.min(stock, free, byGold);
    if (mx <= 0) {
      if (!free && G.Cargo && G.Cargo.heavyBound(id)) await C.mate('제독, 짐칸은 남았지만 배가 더 무게를 버티지 못합니다. ' + g.name + U.jx(g.name, '은/는') + ' 1통에 무게 ' + G.Cargo.wt(id) + '입니다.');
      else if (!free) await C.mate('제독, 더 이상 실을 여유가 없습니다.');
      else if (!byGold) await C.say(keeper(), '가난한 사람에게는 볼일 없네!');
      else await C.say(keeper(), '미안하네, 지금 물건이 떨어지고 없네.');
      return;
    }
    if (G.Slave && G.Slave.is(id) && !(await G.Slave.confirm(c))) return;   // 노예 무역: 처음에는 부관이 말린다
    var q = await UI.number({ title: g.name + ' 구입', text: '1통에 금화 ' + U.num(price) + '닢. 몇 통 사겠습니까?' + (G.Cargo && G.Cargo.heavyBound(id) && free <= Math.min(stock, byGold) ? ' (무게 ' + G.Cargo.wt(id) + ' — 배가 버티는 무게까지 ' + free + '통)' : ''), min: 1, max: mx, value: mx, unit: '통',
      info: function (n) { return '합계 금화 <b>' + U.num(n * price) + '</b>닢 · 남는 돈 ' + U.num(s.player.gold - n * price) + '닢'; } });
    if (!q) return;
    s.player.gold -= q * price;
    var cg = f.cargo[id];
    if (cg) { cg.cost = Math.round((cg.cost * cg.q + price * q) / (cg.q + q)); cg.d = Math.round((cg.d * cg.q + s.day * q) / (cg.q + q)); cg.q += q; }
    else f.cargo[id] = { q: q, cost: price, from: c.id, d: s.day };
    if (id === 'timber' && G.Ships) G.Ships.noteTimber(c, q, cg ? cg.q - q : 0);     // 목재는 산지를 적어 둔다 (조선소에서 쓴다)
    R.onBuy(c, id, q);
    s.stats.trades++;
    if (G.Slave && G.Slave.is(id)) G.Slave.onBuy(c, q);   // 노예 무역: 악명·「노예 상인」
    if (G.Hostile) G.Hostile.trade(c, q * price);   // 그 나라와 교역하면 적대가 줄어든다
    UI.toast(g.name + ' ' + q + '통을 샀다. (금화 ' + U.num(q * price) + '닢)', 'coin');
    G.Game.refreshHud();
    var ds = G.Disc.checkTrade(id, c);
    for (var i = 0; i < ds.length; i++) await G.Disc.find(ds[i], 'trade');
  }

  // ---------------------------------------------------------------- sell
  T.sell = async function (c) {
    var s = S();
    for (;;) {
      var ids = Object.keys(s.fleet.cargo);
      if (!ids.length) { await C.say(keeper(), '응? 도대체 무엇을 팔겠다는 건가?'); return; }
      var rows = ids.map(function (id) {
        var cg = s.fleet.cargo[id], g = G.GOOD[id], p = sellP(c, id), pr = cg.cost ? (p - cg.cost) / cg.cost : 0;
        var spoil = g.life ? Math.max(0, g.life - (s.day - cg.d)) : null, fs = G.Cargo ? G.Cargo.state(id, cg) : null;
        if (G.Cargo) spoil = null;   // 보관은 G.Cargo.state (값이 떨어지는 날·상함)
        var bs = G.Ledger ? G.Ledger.bestSell(id, c.id) : null;
        var better = bs && bs.price > p * 1.08;
        return '<tr class="click" data-id="' + id + '"><td>' + G.goodDot(id) + '<b>' + g.name + '</b>' + (G.Fad && G.Fad.at(c, id) ? ' <span class="tag" title="' + U.esc('이 나라·지역에서 유행하는 물건 — 값이 ' + (G.Fad.at(c, id).m || (G.BALANCE.fad || {}).mult || 3) + '배' + (G.Fad.at(c, id).why ? ' (' + G.Fad.at(c, id).why + ')' : '')) + '">유행 · ' + (G.Fad.at(c, id).until - s.day) + '일</span>' : '') + rareTag(c, id) + eraTag(c, id) + evTag(c, id) + (spoil != null && spoil < 30 ? ' <span class="warn-text" style="font-size:14px">(' + spoil + '일 후 상함)</span>' : '') + (fs && fs.text ? ' <span class="' + (fs.f < 1 ? 'warn-text' : 'muted') + '" style="font-size:14px" title="산 지 ' + fs.age + '일 · 신선하게 파는 기간 ' + fs.keep + '일">(' + fs.text + ')</span>' : '') + '</td><td class="num">' + cg.q + '</td><td class="num">' + U.num(cg.cost) + '</td><td class="num"><b>' + U.num(p) + '</b></td><td class="num ' + (pr >= 0 ? 'down' : 'up') + '">' + (pr >= 0 ? '+' : '') + Math.round(pr * 100) + '%</td>' +
          '<td class="num" style="font-size:14px">' + demandCell(c, id) + '</td><td class="num' + (better ? ' warn-text' : '') + '">' + (bs ? where(bs) : '<span class="muted">—</span>') + '</td></tr>';
      }).join('');
      var html = '<table class="tbl"><tr><th>품목</th><th class="num">수량</th><th class="num">산 값</th><th class="num">여기 시세</th><th class="num">이익</th><th class="num" title="값이 무너지기 전에 이 시장이 더 받아 줄 양">받아 줄 양</th><th class="num">다른 곳 최고가</th></tr>' + rows + '</table>' +
        '<div class="muted" style="margin-top:8px;font-size:15px">같은 물건을 한꺼번에 많이 팔면 값이 떨어지고, 「받아 줄 양」을 넘기면 폭락합니다(이웃 항구 값도 조금 떨어집니다). 그 물건이 나는 고장(「산지」)은 조금만 받아 줍니다. 산지에서 멀리 떨어진 곳(「귀함」)일수록 비싸게 팔립니다. 먹을거리·향신료·기호품은 오래 실어 두면 묵어서 값이 떨어지고, 더 오래되면 상해 줄어듭니다.</div>';
      var picked = null;
      var win = UI.window({ title: '매각 — ' + c.name, icon: 'sack', width: 980, html: html, buttons: [{ label: '모두 판다', value: 'all', cls: 'green' }, { label: '돌아간다', value: null }],
        onBuild: function (el, w) { U.$$('tr.click', el).forEach(function (tr) { tr.onclick = function () { picked = tr.dataset.id; w.close('pick'); }; }); } });
      var v = await win.result;
      if (v === 'all') {
        if (!(await UI.confirm('실은 짐을 모두 팔겠습니까?'))) continue;
        var tot = 0; ids.forEach(function (id) { tot += sellQty(c, id, s.fleet.cargo[id].q); });
        UI.toast('짐을 모두 팔아 금화 ' + U.num(tot) + '닢을 받았다.', 'coin');
        continue;
      }
      if (v !== 'pick' || !picked) return;
      var cg = s.fleet.cargo[picked], g = G.GOOD[picked];
      var q = await UI.number({ title: g.name + ' 매각', text: '몇 통 팔겠습니까? (지금 시세 1통 ' + U.num(sellP(c, picked)) + '닢)', min: 1, max: cg.q, value: cg.q, unit: '통',
        info: function (n) { var es = estimate(c, picked, n); return '받을 돈 약 금화 <b>' + U.num(es.total) + '</b>닢 · 1통 평균 ' + U.num(es.total / n) + '닢' + (n > 1 ? ' <small class="' + (es.last < es.first * 0.75 ? 'warn-text' : 'muted') + '">(첫 통 ' + U.num(es.first) + ' → 마지막 통 ' + U.num(es.last) + ')</small>' : ''); } });
      if (!q) continue;
      var got = sellQty(c, picked, q);
      UI.toast(g.name + ' ' + q + '통을 팔아 금화 ' + U.num(got) + '닢을 받았다.', 'coin');
    }
  };
  /** price falls as you sell: integrate in chunks */
  function estimate(c, id, q) {
    var m = R.market(c.id); var st = m.g[id] ? { sat: m.g[id].sat, dep: m.g[id].dep } : null;
    var sn = G.Econ ? G.Econ.snap(c) : null;     // 모자람 사건의 채운 양도 되돌린다
    var total = 0, left = q, chunk = Math.max(1, Math.ceil(q / 10)), first = sellP(c, id), last = first;
    while (left > 0) { var n = Math.min(chunk, left); last = sellP(c, id); total += last * n; R.onSell(c, id, n); left -= n; }
    if (st) m.g[id] = st; else delete m.g[id];
    if (G.Econ) G.Econ.restore(c, sn);
    return { total: total, first: first, last: last };
  }
  T.estimate = estimate;
  function sellQty(c, id, q) {
    var s = S(), cg = s.fleet.cargo[id]; if (!cg) return 0;
    var total = 0, left = q, chunk = Math.max(1, Math.ceil(q / 10));
    while (left > 0) { var n = Math.min(chunk, left); total += sellP(c, id) * n; R.onSell(c, id, n); left -= n; }
    R.spill(c, id, q);      // 남는 물건은 상인들이 이웃 항구로 실어 돌린다
    var profit = total - cg.cost * q;
    s.player.gold += total; s.stats.profit += profit; s.stats.trades++;
    // 유행: 같은 물건을 같은 나라·지역에 거듭 팔아 큰 이익을 냈다 (js/systems/fad.js)
    var fad = G.Fad ? G.Fad.sold(c, id, q, total, cg.cost) : null;
    if (fad) { var fb = (G.BALANCE.fad || {}); UI.toast(G.Fad.where(fad) + '에서 ' + G.GOOD[id].name + U.jx(G.GOOD[id].name, '이/가') + ' 유행을 탔다! ' + (fb.days || 60) + '일 동안 값이 ' + (fb.mult || 3) + '배로 뛴다.', 'star', 7000); }
    if (G.Hostile) G.Hostile.trade(c, total);
    if (G.Slave && G.Slave.is(id)) G.Slave.onSell(c, q);   // 노예 무역: 악명·「노예 상인」
    if (profit > 0) G.Fame.add('tr', Math.floor(profit / 2500));
    cg.q -= q; if (cg.q <= 0) delete s.fleet.cargo[id];
    G.Game.refreshHud();
    return total;
  }

  // ---------------------------------------------------------------- talk
  T.talk = async function (c) {
    var s = S(), cur = C.current(), k = keeper();
    if (cur.talked) { await C.say(k, '오늘은 해 줄 이야기가 더 없네. 다음에 또 들르게.'); return; }
    cur.talked = true;
    var m = R.market(c.id);
    var lines = [];
    if (m.ev) lines.push('요즘 이 마을은 ' + U.j(m.ev, '이라/라') + ' 물건 값이 들쭉날쭉하다네.');
    // 세상의 시장 사건: 이 고장에 걸린 것, 없으면 가까운 곳 소문 하나 (js/systems/economy.js)
    if (G.Econ) {
      var evs = G.Econ.activeAt(c.id), ev1 = evs[0] || G.Econ.rumors(c, 1)[0];
      if (ev1) { lines.push(evs[0] ? '요즘 이 고장은 ' + G.Econ.say(ev1, c) : '장사꾼들 사이에 도는 이야기일세. ' + G.Econ.say(ev1, c)); G.Econ.learn(ev1); }
    }
    if (G.Fad) {
      var fads = G.Fad.list().filter(function (x) { return G.Fad.at(c, x.g) === x.f; });
      var mineF = fads.filter(function (x) { return x.src === 'me'; }), worldF = fads.filter(function (x) { return x.src !== 'me'; });
      if (mineF.length) lines.push('요즘 이 고장에서는 ' + mineF.map(function (x) { return x.name; }).join('·') + U.jx(mineF[mineF.length - 1].name, '이/가') + ' 없어서 못 판다네. 누가 자꾸 들여와 팔더니 유행이 됐지. 한 ' + mineF[0].left + '일은 더 갈 걸세.');
      if (worldF.length) lines.push(worldF.map(function (x) { return (x.why ? x.why + U.jx(x.why, '으로/로') + ' ' : '') + x.name; }).join(', ') + U.jx(worldF[worldF.length - 1].name, '이/가') + ' 유행이라 값이 ' + worldF[0].m + '배는 뛰었지. 한 ' + worldF[0].left + '일은 갈 걸세.');
      if (!fads.length) lines.push('같은 물건을 한 나라에 거듭 들여와 큰 이문을 남기면, 그 물건이 유행을 타서 값이 몇 배로 뛰는 일이 있다네. 석 달 안에 세 번쯤이면 소문이 나지.');
    }
    // 유럽 시장의 시대 수요: 지금 이 고장에서 값이 크게 오른 물건
    if (G.Era && G.Era.EUROPE.indexOf(c.region) >= 0) {
      var ups = Object.keys(G.ERA_DEMAND).filter(function (id) { return G.GOOD[id] && G.Era.mult(c, id) >= 1.3; }).sort(function (a, b) { return G.Era.mult(c, b) - G.Era.mult(c, a); }).slice(0, 3);
      if (ups.length) lines.push('요즘 이 고장 사람들이 찾는 건 ' + ups.map(function (id) { return G.GOOD[id].name; }).join('·') + '일세. 세상이 바뀌니 입맛도 바뀌는 게지.');
    }
    // a trade tip: something sold here that fetches a good price in a known city
    var best = null;
    c.goods.forEach(function (id) {
      s.known.forEach(function (cid) {
        var t = G.CITY_DATA[cid]; if (!t.port || t.id === c.id || !R.cityExists(t)) return;
        var gain = R.sellPrice(t, id) / Math.max(1, R.buyPrice(c, id));
        if (!best || gain > best.gain) best = { id: id, city: t, gain: gain };
      });
    });
    if (best && best.gain > 1.25) lines.push('여기서 산 ' + U.eul(G.GOOD[best.id].name) + ' ' + best.city.name + '에 가져가면 꽤 좋은 값을 받는다더군.');
    // 교역소의 이야기: 교역품과 보물(책에 실리지 않은 명화·도자기·보석 — 상인과 수집가가 아는 것). 옛 보물은 도서관 사료로 (js/data/clues.js)
    var fame = s.player.fame, maxD = fame < 300 ? 1 : fame < 1500 ? 2 : fame < 3500 ? 3 : 5;
    var cand = G.DISCOVERIES.filter(function (d) {
      if ((d.how !== 'trade' && d.cat !== 'treasure') || G.Disc.foundByMe(d.id) || !G.Disc.rumourW(d, 'trade:' + c.id) || !G.Disc.available(d) || !G.Disc.clueOk(d, 'trade')) return false;   // 아는 이야기는 다른 교역소에서 들으면 겹친다
      if (G.Frontier && G.Frontier.hot(d)) return true;
      if (d.how === 'trade') return d.regions.some(function (r) { return G.REGION_DIST[c.region][r] <= 2; });
      return G.Disc.built(d) && G.REGION_DIST[c.region][d.reg] <= Math.max(1, maxD - 1);   // 보물은 가까운 데 것부터, 이름이 나면 먼 데 것도
    });
    if (cand.length && U.chance(0.7)) {
      // 맛보기(유럽까지 흘러든 향료)를 먼저 이야기한다, 그다음은 교역품 6 : 보물 4
      var hot = cand.filter(function (x) { return G.Frontier && G.Frontier.hot(x); });
      var goods = cand.filter(function (x) { return x.how === 'trade'; }), jewels = cand.filter(function (x) { return x.how !== 'trade'; });
      var pool = hot.length && U.chance(0.7) ? hot : !jewels.length ? goods : !goods.length ? jewels : U.chance(0.6) ? goods : jewels;
      var d = U.weighted(pool, function (x) { return G.Disc.rumourW(x, 'trade:' + c.id); });
      lines.push((G.Disc.hasHint(d.id) ? '자네도 들었을지 모르겠네만, 여기서도 다들 하는 이야기지. ' : d.how === 'trade' ? '그러고 보니 ' : '물건 보는 눈이 있는 손님들 사이에 이런 이야기가 돈다네. ') + d.hint);
      G.Disc.noteHint(d, 'trade:' + c.id);
    }
    if (!lines.length) lines.push(U.pick(['요즘은 장사가 영 시원찮군.', '바닷길이 험해서 물건이 잘 들어오지 않는다네.', '좋은 물건은 먼 곳에서 온다네. 자네 같은 뱃사람 덕분이지.']));
    await C.say(k, lines.join('\f'));
  };

  // ---------------------------------------------------------------- 투자
  var LVNAME = ['없음', '출자자', '단골 출자자', '주요 출자자', '대주주', '조합 명예회원'];
  T.invest = async function (c) {
    var s = S(), k = keeper();
    for (;;) {
      var iv = R.investTick(c), lv = R.investLv(c.id), div = Math.floor(iv.div), next = R.investNext(c.id);
      var extra = R.cityGoods(c).filter(function (id) { return c.goods.indexOf(id) < 0; });
      var html = '<div class="kv" style="margin-bottom:10px">' +
        '<div>지금까지 낸 돈</div><div><b>금화 ' + U.num(iv.amt) + '닢</b></div>' +
        '<div>등급</div><div><b>' + lv + '등급 · ' + LVNAME[lv] + '</b>' + (next ? ' <span class="muted">(다음 등급까지 ' + U.num(next) + '닢)</span>' : ' <span class="muted">(끝까지 올랐다)</span>') + '</div>' +
        '<div>사는 값 · 파는 값</div><div>' + Math.round((1 - R.investBuyMult(c.id)) * 100) + '% 싸게 · ' + Math.round((R.investSellMult(c.id) - 1) * 100) + '% 비싸게</div>' +
        '<div>보급 값</div><div>' + Math.round(6 * lv) + '% 싸게</div>' +
        '<div>늘어난 취급 품목</div><div>' + (extra.length ? extra.map(function (id) { return G.GOOD[id].name; }).join(', ') : '<span class="muted">2등급부터 늘어납니다</span>') + '</div>' +
        '<div>쌓인 배당</div><div><b>금화 ' + U.num(div) + '닢</b> <span class="muted">(90일마다 낸 돈의 ' + (0.75 + 0.22 * c.size).toFixed(1) + '%)</span></div>' +
        '</div>';
      var win = UI.window({ title: c.name + ' 교역소 출자', icon: 'seal', width: 660, html: html,
        buttons: [{ label: '돌아간다', value: null }, { label: '배당을 받는다', value: 'take', cls: div >= 1 ? 'green' : '' }, { label: '출자한다', value: 'put', cls: 'navy' }] });
      var v = await win.result;
      if (!v) return;
      if (v === 'take') {
        if (div < 1) { UI.toast('아직 받을 배당이 없습니다.', 'coin'); continue; }
        iv.div -= div; s.player.gold += div;
        await C.say(k, '이번 몫일세. 금화 ' + U.num(div) + '닢, 세어 보게.');
        G.State.log(c.name + ' 교역소에서 배당 ' + U.num(div) + '닢을 받았다.');
        G.Game.refreshHud();
        continue;
      }
      var max = Math.min(s.player.gold, 200000);
      if (max < 1000) { await C.say(k, '출자는 금화 1,000닢부터 받네.'); continue; }
      var n = await UI.number({ title: '출자', text: '이 도시 교역소에 얼마를 대겠습니까? 낸 돈은 돌려받지 못하지만, 값이 유리해지고 배당이 나옵니다.',
        min: 1000, max: max, value: Math.min(max, 5000), unit: '닢',
        quick: [{ label: '1,000', value: 1000 }, { label: '5,000', value: 5000 }, { label: '2만', value: 20000 }, { label: '전부', value: max }],
        info: function (d) {
          var a = iv.amt + d, l = 0;
          for (var i = 1; i < R.INVEST_LV.length; i++) if (a >= R.INVEST_LV[i]) l = i;
          return '출자 뒤 ' + l + '등급 (' + LVNAME[l] + ')';
        } });
      if (!n) continue;
      if (s.player.gold < n) { UI.toast('소지금이 모자랍니다.', 'coin'); continue; }
      var before = lv;
      s.player.gold -= n; iv.amt += n;
      var after = R.investLv(c.id);
      var ifame = n / 4000; G.Fame.add('tr', Math.floor(ifame) + (U.chance(ifame % 1) ? 1 : 0));   // 잘게 나눠 넣어도 같은 명성 (예전에는 1,000닢씩 넣으면 4배)
      R.S().stats.invested = (R.S().stats.invested || 0) + n;
      G.State.log(c.name + ' 교역소에 금화 ' + U.num(n) + '닢을 출자했다.');
      if (after > before) {
        await C.say(k, '이만한 돈을 대 주시다니! 이제 자네는 이 고장의 ' + LVNAME[after] + '일세.\f앞으로 값은 자네에게 맞춰 주겠네.');
        UI.toast(c.name + ' 출자 ' + after + '등급 — ' + LVNAME[after], 'seal', 4500);
      } else {
        await C.say(k, '잘 맡아 두겠네. 장부에 올려 두지.');
        UI.toast('출자 금화 ' + U.num(n) + '닢', 'seal');
      }
      G.Game.refreshHud();
    }
  };

  // ---------------------------------------------------------------- 빚 독촉
  T.debt = async function (c, q) {
    var s = S(), who = { name: q.who, portrait: G.Art.withImg(G.Art.npcSpec('debt' + q.key, 'merchant', G.Img.folkStyle(c)), G.Img.chain.npc('trader', c)), lang: C.langLv(c), li: c.lang };
    await UI.say('조합이 일러 준 집을 찾아갔다. ' + q.who + U.jx(q.who, '은/는') + ' 반갑지 않은 얼굴이다.', {});
    await UI.say(U.pick(['또 조합에서 보냈나? 지금은 돈이 없네.', '아이고, 그 이야기라면 다음 달에...', '누가 보냈는지 알겠군. 돌아가게.']), who);
    for (;;) {
      var v = await UI.ask('어떻게 할까?', [
        { label: '좋게 타이른다', value: 'talk' },
        { label: '윽박지른다', value: 'push' },
        { label: '오늘은 물러난다', value: null }], { name: s.player.name, portrait: s.player.portrait });
      if (!v) return;
      var lv = C.langLv(c);
      if (!lv) { await C.mate('말이 통하지 않아 이야기가 되지 않습니다.'); return; }
      var p = v === 'talk'
        ? 0.24 + R.skill('speech') * 0.16 + R.skill('acct') * 0.07 + (R.stat('cha') - 50) * 0.005 + (lv - 1) * 0.07
        : 0.22 + R.skill('sword') * 0.12 + (R.stat('mar') - 50) * 0.006 + (s.player.notoriety / 260);
      if (U.chance(U.clamp(p, 0.1, 0.9))) {
        q.collected = true;
        await UI.say(v === 'talk'
          ? '...알았네, 알았어. 조합에는 잘 말해 주게. 여기 있네.'
          : '아, 알겠네! 그만하게! 돈은 줄 테니...', who);
        UI.toast('빚 ' + U.num(q.amount) + '닢을 받았다. ' + G.CITY_DATA[q.to].name + ' 조합으로 돌아가자.', 'scroll', 5200);
        G.State.log(q.who + '에게서 빚 ' + U.num(q.amount) + '닢을 받아 냈다.');
        if (v === 'push') s.player.notoriety += 2;
        return;
      }
      await UI.say(v === 'talk' ? '말은 고맙네만, 없는 돈은 못 주네.' : '허! 나를 치기라도 하겠다는 건가?', who);
      if (v === 'push') { s.player.notoriety += 1; }
      var again = await UI.confirm('한 번 더 해 보겠습니까?', '해 본다', '물러난다');
      if (!again) return;
    }
  };

  // ---------------------------------------------------------------- 시세 (대항해시대 2·3의 시세표)
  /** 품목 갈래마다 이 도시의 시세(보통 = 100%)와 스무 날 전보다 오르내림, 시장 사건, 시장 물건 값, 시세 수첩에 적힌 다른 도시 */
  function idxCell(v, prev) {
    var col = v >= 115 ? '#a3321e' : v >= 105 ? '#b8662a' : v <= 85 ? '#1f6b3a' : v <= 95 ? '#3d7a4a' : '#4a3b2c';
    var arrow = prev == null ? '' : v - prev >= 3 ? ' <small style="color:#a3321e">▲</small>' : prev - v >= 3 ? ' <small style="color:#1f6b3a">▼</small>' : ' <small class="muted">―</small>';
    return '<span style="color:' + col + ';font-weight:700">' + v + '%</span>' + arrow;
  }
  function bar(v) { var w = Math.max(4, Math.min(100, (v - 60) * 1.25)); return '<span class="qbar"><span style="width:' + w + '%;background:' + (v >= 105 ? '#b8662a' : v <= 95 ? '#3d7a4a' : '#8a7a5a') + '"></span></span>'; }
  T.quoteTable = function (c) {
    var s = S(), m = R.market(c.id), cats = Object.keys(G.GOOD_CATS);
    var here = cats.map(function (k) {
      var v = Math.round(R.catIndex(c, k) * 100), was = Math.round(R.drift(c.id, k, s.day - 20) * 100 * (R.catIndex(c, k) / R.drift(c.id, k)));
      var ours = G.GOODS.filter(function (g) { return g.cat === k && R.sells(c, g.id); }).map(function (g) { return g.name; });
      return '<tr><td><b>' + G.GOOD_CATS[k] + '</b>' + (ours.length ? '<div class="muted" style="font-size:12px">이 도시 산물: ' + ours.slice(0, 3).join('·') + (ours.length > 3 ? ' 외' : '') + '</div>' : '') + '</td><td>' + bar(v) + '</td><td class="num">' + idxCell(v, was) + '</td></tr>';
    }).join('');
    var items = Object.keys(R.ITEM_CATS).map(function (kind) {
      var v = Math.round(U.sum(R.ITEM_CATS[kind], function (k) { return R.catIndex(c, k); }) / R.ITEM_CATS[kind].length * 100);
      return '<span class="chip">' + G.ITEM_KIND[kind] + ' ' + idxCell(v) + '</span>';
    }).join(' ');
    var others = G.Ledger ? G.Ledger.quoteRows(c.id, 8) : [];
    var otherHtml = others.length ? '<table class="tbl quotes" style="margin-top:6px"><tr><th>도시</th>' + cats.map(function (k) { return '<th class="num" style="font-size:12px">' + G.GOOD_CATS[k] + '</th>'; }).join('') + '</tr>' +
      others.map(function (o) { return '<tr><td>' + G.CITY_DATA[o.city].name + '<div class="muted" style="font-size:11px">' + (o.age ? o.age + '일 전' : '오늘') + (o.ev ? ' · ' + o.ev : '') + '</div></td>' + cats.map(function (k) { return '<td class="num" style="font-size:13px">' + idxCell(o.ci[k]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'
      : '<div class="muted">아직 다른 도시의 시세를 적어 둔 것이 없습니다. 교역소에 들를 때마다 시세 수첩에 적힙니다.</div>';
    return '<div style="display:flex;gap:22px;align-items:flex-start"><div style="flex:0 0 440px">' +
      '<div class="muted" style="font-size:15px;margin-bottom:6px">100% = 보통 값. 시세는 도시마다 품목 갈래별로 천천히 오르내리고, 시장 사건(풍작·기근·전쟁·축제·호경기…)이 겹칩니다. 화살표는 스무 날 전과 견준 것.</div>' +
      (m.ev ? '<div class="plan-note" style="margin-bottom:6px"><b>' + m.ev + '</b> — 이 도시에 일이 벌어져 값이 크게 흔들리고 있습니다 (' + Math.max(0, m.evEnd - s.day) + '일쯤 더)</div>' : '') +
      econNote(c) +
      '<table class="tbl quotes"><tr><th>갈래</th><th></th><th class="num">시세</th></tr>' + here + '</table>' +
      '<div style="margin-top:8px;font-size:15px">시장 물건 값: ' + items + '</div></div>' +
      '<div style="flex:1;min-width:0"><div style="font-weight:700;margin-bottom:2px">다른 도시 (시세 수첩)</div>' + otherHtml + '</div></div>';
  };
  /** 시세 창: 이 도시에 걸린 세상의 시장 사건과, 이 도시 특산물이 비싸게 팔리는 곳 */
  function econNote(c) {
    var out = '';
    if (G.Econ) G.Econ.activeAt(c.id).forEach(function (e) { G.Econ.learn(e); out += '<div class="plan-note" style="margin-bottom:6px"><b>' + U.esc(G.Econ.title(e)) + '</b> — ' + U.esc(G.Econ.say(e, c)) + '</div>'; });
    var sp = c.goods.filter(function (id) { return G.GOOD[id] && !R.isRelay(c, id); }).map(function (id) { var fr = farRegions(id); return { id: id, fr: fr, x: fr[0].m / 0.62 }; })
      .filter(function (o) { return o.x >= 1.5; }).sort(function (a, b) { return b.x - a.x; }).slice(0, 4);
    if (sp.length) out += '<div style="font-size:15px;margin-bottom:6px"><b>이 고장 산물이 비싸게 팔리는 곳</b> ' + sp.map(function (o) { return '<span class="chip">' + G.goodDot(o.id) + G.GOOD[o.id].name + ' → ' + o.fr.slice(0, 2).map(function (x) { return G.REGIONS[x.r]; }).join('·') + ' <small>×' + o.x.toFixed(1) + '</small></span>'; }).join(' ') + '</div>';
    return out;
  }
  T.quotes = async function (c) {
    await UI.window({ title: c.name + ' 시세', icon: 'chart', width: 1360, html: T.quoteTable(c), buttons: [{ label: '닫는다', value: 1, cls: 'navy' }] }).result;
  };

  // ---------------------------------------------------------------- haggle
  /** 값 깎기. 경리(R.purser)가 있으면 경리가 나서서 값을 후려친다 — 성공률·깎는 폭이 커지고, 한 번 거절당해도 한 번 더 밀어붙일 수 있다.
      결과는 이번 방문 동안 사는 값 ×buy, 파는 값 ×sell (cur.haggle) */
  T.haggleOdds = function (c) {
    var acct = R.skill('acct'), lv = C.langLv(c), cha = R.stat('cha'), pu = R.purser();
    var p = 0.25 + acct * 0.17 + (lv - 1) * 0.08 + (cha - 50) * 0.004 + (pu ? 0.12 + pu.acct * 0.05 : 0) + (G.Cabins ? G.Cabins.fx('account', 'haggle') : 0);
    var disc = 0.04 + acct * 0.03 + (pu ? 0.02 + pu.acct * 0.015 : 0);
    // 귀족의 권한: 작위가 있으면 유럽·이슬람 도시에서 더 잘, 더 많이 깎인다 (js/systems/court.js)
    var nb = G.Court ? G.Court.haggle(c) : null;
    if (nb) { p += nb.p; disc += nb.disc; }
    return { p: U.clamp(p, 0.08, pu || nb ? 0.95 : 0.92), disc: disc, pu: pu, noble: nb };
  };
  T.haggle = async function (c) {
    var cur = C.current(), k = keeper();
    if (cur.haggle) { await C.say(k, cur.haggle.ok ? '이미 충분히 깎아 주지 않았나!' : '더 이상 할 말 없네.'); return; }
    if (C.langLv(c) === 0) { await C.mate('말이 통하지 않는 것만은 어쩔 수가 없군요.'); cur.haggle = keepHag(c, { ok: false }); return; }
    var o = T.haggleOdds(c), pu = o.pu, puSp = pu ? G.Scenes.mateSpeaker('purser') : null;
    if (pu) await UI.say(U.pick(['주인장, 장부를 좀 봅시다. 지난달 시세가 이보다 한참 쌌소. 이 값이면 우리는 옆 가게로 가겠소.', '이 물건 값에 운임과 관세를 다 얹었구려. 우리가 통째로 사 줄 테니 거품은 빼시오.', '현금으로 한꺼번에 치르겠소. 그러니 셈을 다시 하시오 — 한 푼도 허투루 낼 생각 없소.']), puSp);
    else await C.me(U.pick(['주인장, 조금만 싸게 해 주게. 앞으로도 자주 들를 테니.', '이 값은 너무 비싸지 않은가. 옆 가게는 더 싸던데.', '많이 살 테니 값을 좀 깎아 주게.']));
    // 회계 단계만큼 흥정할 수 있다 — 거절당할 때마다 주인이 굳어진다 (G.BALANCE.acct.retryK)
    var used = cur.hagN || 0, max = T.hagMax(), K = (G.BALANCE && G.BALANCE.acct) || {};
    var ok = U.chance(o.p * Math.pow(K.retryK == null ? 0.7 : K.retryK, used));
    cur.hagN = used + 1;
    if (!ok && cur.hagN < max) {
      R.market(c.id).hag = { day: S().day, h: null, n: cur.hagN };
      await C.say(k, U.pick(['허, 그 값에는 못 주네.', '어림없는 소리 말게.', '그 값이면 내가 밑지네.']));
      UI.toast('흥정이 거절당했다 — 오늘 ' + (max - cur.hagN) + '번 더 흥정할 수 있다 (회계 ' + (G.Acct ? G.Acct.lv() : 0) + (pu ? ' · 경리 +1' : '') + '). 거절당할수록 주인이 굳어진다.', 'scales', 4600);
      return;
    }
    if (ok && used) o.disc += 0.01 * used;   // 끈질기게 흥정해 얻으면 조금 더 깎인다
    if (ok) {
      var disc = Math.min(0.25 + (o.noble ? o.noble.disc : 0), o.disc + U.rf(0, 0.04));
      cur.haggle = keepHag(c, { ok: true, buy: 1 - disc, sell: 1 + disc * (pu ? 0.7 : 0.6) });
      await C.say(k, o.noble && !pu ? U.pick([o.noble.adr + '의 청을 어찌 물리치겠습니까. 특별히 그 값에 드리지요.', o.noble.adr + '께서 찾아 주신 것만도 영광입니다. 값은 넉넉히 빼 드리겠습니다.']) : U.pick(pu ? ['자네 경리는 무서운 사람이군… 알았네, 그 값에 주지.', '장부까지 들이밀다니! 좋아, 이번만일세.'] : ['허허, 자네한테는 못 당하겠군. 좋아, 특별히 싸게 해 주지.', '자네, 보는 눈이 있군. 득 보는 걸세.', '알았네, 알았어. 이번만일세.']));
      UI.toast('값 깎기 성공' + (pu ? '(경리 ' + pu.name + ')' : '') + (o.noble ? '(귀족의 권한 — ' + o.noble.title.ko + ')' : '') + '! 사는 값 -' + Math.round(disc * 100) + '%, 들여온 물건 파는 값 +' + Math.round(disc * (pu ? 70 : 60)) + '%', 'scales');
    } else if (!cur.haggle) {
      cur.haggle = keepHag(c, { ok: false });
      await C.say(k, U.pick(['어림없는 소리! 이 값도 밑지고 파는 걸세.', '싫으면 다른 데 가 보게.', '값을 깎으려거든 장사를 좀 더 배우고 오게.']));
    }
  };
})(window.G = window.G || {});
