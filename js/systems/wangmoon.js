/* 왕서방·명월 (G.WangMoon) — 한양·동래에서 조선 물건을 사는 독립 사건.
   저장: s.wangMoon = { met, korea, cool }. 옛 금봉호의 조선 거래 횟수만 처음에 옮긴다.
   금봉호의 거래 횟수·지나 합류·재등장 간격은 읽거나 바꾸지 않는다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var WM = G.WangMoon = {};
  function K() { return G.BALANCE.wangMoon; }
  function S() { return G.Game && G.Game.state; }
  function st() {
    var s = S();
    if (!s.wangMoon) s.wangMoon = { korea: (s.wangMerch && s.wangMerch.korea) || 0 };
    return s.wangMoon;
  }
  function cityNow() {
    var s = S(), loc = s && s.loc;
    return loc && loc.mode === 'city' && K().ports.indexOf(loc.city) >= 0 ? G.CITY_DATA[loc.city] : null;
  }
  function speaker(id) { return G.Hist.speaker(id === 'wang' ? 'wm_wang' : 'wm_myeongwol'); }
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) await UI.say(lines[i][1], lines[i][0] ? speaker(lines[i][0]) : {});
  }
  /** 만남과 품질 확인에 각기 다른 그림을 쓰고, 대화가 끝나면 걷는다. */
  async function playScene(key, title, lines) {
    var pc = G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null;
    try { return await play(lines); }
    finally { if (pc) await pc.stop(); }
  }
  function koreaCity(cid) { var c = G.CITY_DATA[cid]; return !!(c && /조선/.test(c.nation || '')); }
  /** 다른 산지의 짐과 섞여 있어도 조선에서 산 몫만 고른다. */
  WM.koreaLots = function () {
    var s = S(), cargo = (s && s.fleet && s.fleet.cargo) || {}, out = [];
    for (var id in cargo) {
      var cg = cargo[id]; if (!cg || !(cg.q > 0) || !G.GOOD[id]) continue;
      var lots = R.cargoLots(cg), q = 0, cost = 0;
      for (var cid in lots) if (koreaCity(+cid) && lots[cid].q > 0) { q += lots[cid].q; cost += lots[cid].q * lots[cid].cost; }
      q = Math.min(q, cg.q);
      if (q > 0) out.push({ id: id, q: q, cost: cost });
    }
    return out;
  };
  WM.koreaPrice = function (id) {
    // 시세 수첩 계산만 함께 쓴다. 금봉호를 만났는지는 조건이 아니다.
    var seen = G.WangMerch.seen(id);
    return Math.max(1, Math.round(Math.max(seen.p, G.GOOD[id].p) * K().ratio));
  };
  function sellKorea(lots) {
    var s = S(), gold = 0, profit = 0, parts = [];
    lots.forEach(function (x) {
      var cg = s.fleet.cargo[x.id]; if (!cg) return;
      var sources = R.cargoLots(cg), left = x.q, cost = 0;
      for (var cid in sources) {
        if (!left) break;
        if (!koreaCity(+cid)) continue;
        var n = Math.min(left, sources[cid].q);
        sources[cid].q -= n; left -= n; cost += n * sources[cid].cost;
        if (!(sources[cid].q > 0)) delete sources[cid];
      }
      var q = x.q - left, got = q * WM.koreaPrice(x.id);
      if (!q) return;
      cg.q -= q;
      if (cg.q <= 0) delete s.fleet.cargo[x.id];
      else {
        var remain = 0, value = 0;
        for (var key in sources) { remain += sources[key].q; value += sources[key].q * sources[key].cost; }
        if (remain) cg.cost = Math.round(value / remain);
      }
      gold += got; profit += got - cost; parts.push(G.GOOD[x.id].name + ' ' + q + '통');
    });
    s.player.gold += gold;
    if (s.stats) s.stats.profit = (s.stats.profit || 0) + profit;
    return { gold: gold, profit: profit, text: parts.join(' · ') };
  }
  WM.pending = function () {
    if (!cityNow()) return false;
    var o = st();
    return !(o.cool > S().day) && (!o.met || WM.koreaLots().length > 0);
  };
  async function meet() {
    var s = S(), o = st(), city = cityNow(), first = !o.met;
    o.met = (o.met || 0) + 1; o.cool = s.day + K().retryDays;
    if (first) await playScene('wangmoon_port', '조선 포구의 왕서방과 명월', [
      [null, city.name + ' 포구. 비단 견본을 든 중국 상인과 흰 치마 차림의 조선 상인이 짐 꾸러미를 살펴보고 있다.'],
      ['wang', '왕서방이라 하오. 항주 비단을 팔러 왔다가, 이곳에서 명월이라는 좋은 장사 벗을 만났소. 조선 물건이라면 내가 제일 후하게 쳐 드리지.'],
      ['moon', '명월이에요. 후한 값도 좋지만 물건부터 봐야죠. 제독님, 조선 항구에서 사 온 물건이 있나요? 제가 산지와 품질을 살필게요.']
    ]);
    else await play([
      ['moon', '다시 오셨네요. 이번에는 어떤 조선 물건을 가져오셨어요?'],
      ['wang', '명월이가 고른 물건이면 틀림없지. 이번에도 제값보다 넉넉히 쳐 드리겠소!']
    ]);
    var lots = WM.koreaLots();
    if (!lots.length) {
      await play([['moon', '지금 짐에는 조선 항구에서 산 물건이 없네요. 한양이나 동래에서 산 물건이 생기면 다시 들러 주세요.'],
        ['wang', '다른 땅 물건을 조선 물건이라 우기면 명월이가 금세 알아본다오. 하하!']]);
      G.State.log(city.name + '에서 왕서방과 조선 상인 명월을 만났다. 조선에서 산 물건을 후하게 사겠다고 했다.');
      return;
    }
    var text = lots.map(function (x) { return G.GOOD[x.id].name + ' ' + x.q + '통(1통 ' + U.num(WM.koreaPrice(x.id)) + '닢)'; }).join(' · ');
    var total = lots.reduce(function (n, x) { return n + x.q * WM.koreaPrice(x.id); }, 0);
    await playScene('wangmoon_deal', '조선 물건의 품질과 값', [['moon', '(짐의 표식과 결을 살피며) 조선에서 산 몫만 셌어요. ' + text + '. 다른 산지에서 산 짐은 그대로 두세요.'],
      ['wang', '좋소! 이 짐은 모두 내가 사겠소. 금화 ' + U.num(total) + '닢, 값을 깎지는 않으리다.']]);
    var choice = await UI.ask('왕서방·명월의 조선 물건 거래 — ' + text, [
      { label: '판다 (금화 ' + U.num(total) + '닢)', value: 'sell' },
      { label: '지금은 팔지 않는다', value: 'no' }
    ], speaker('moon'));
    if (choice === 'sell') {
      var sold = sellKorea(lots);
      if (sold.gold) {
        o.korea = (o.korea || 0) + 1; o.cool = s.day + K().cool;
        await play([['wang', '좋은 장사였소! 다음에도 조선 물건은 우리에게 가져오시오.'],
          ['moon', '장부에 정확히 적었어요. 바닷길 조심하시고, 다음 장사 때 다시 만나요.']]);
        G.State.log(city.name + '에서 왕서방·명월에게 조선에서 산 짐(' + sold.text + ')을 금화 ' + U.num(sold.gold) + '닢에 넘겼다.');
        UI.toast('왕서방·명월에게 조선 물건을 넘겼다 — 금화 +' + U.num(sold.gold), 'coin', 5200);
      }
    } else await play([['moon', '서두를 필요 없어요. 다음에 팔 마음이 생기면 들러 주세요.'], ['wang', '그때도 좋은 값으로 기다리겠소.']]);
  }
  WM.check = async function () {
    if (WM._busy || !WM.pending()) return false;
    WM._busy = true;
    try { await meet(); return true; }
    finally { WM._busy = false; if (G.Game.refreshHud) G.Game.refreshHud(); }
  };
  WM.todo = function (c) {
    if (!c || !cityNow() || c.id !== cityNow().id || !WM.pending()) return [];
    return [{ icon: 'scales', hot: true, text: '왕서방·명월과 조선 물건을 거래한다', onClick: function () {
      return G.Scenes.city.run(async function () { await WM.check(); G.Scenes.city.main(); });
    } }];
  };
  WM._t = { sellKorea: sellKorea };
})(window.G = window.G || {});
