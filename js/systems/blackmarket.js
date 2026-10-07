/* 회계 단계의 혜택과 비밀 암시장 (G.Acct · G.BlackMarket)
   회계 단계 = R.skill('acct') — 제독, 부관·경리 자리의 부하, 회계실에 앉은 사람 가운데 가장 높은 것 (0~3)
   · 흥정 성공률: 단계마다 오른다 (js/city/trade.js T.haggleOdds — 바탕 0.25 + 단계 × 0.17)
   · 흥정 횟수: 한 번 들를 때(같은 날) 값을 깎아 볼 수 있는 횟수 tries[단계] (경리가 있으면 +puTry). 거절당할수록 주인이 굳어진다(retryK배씩)
   · 무게 제한 완화: 짐을 고르게 나눠 싣고 묶는 요령 — 배가 버티는 무게 × (1 + wt[단계]) (js/systems/cargo.js CG.fleetWtCap)
   · 비밀 암시장: 단계 blackMarket 이상이면 크기 bmSize 이상인 항구의 교역소에 「뒷골목 암시장」이 열린다 —
     시장에 나오지 않는 물건(속사포·잠수 폭탄·아직 나오지 않은 항해 도구·변장 옷), 먼 고장의 밀수품을 웃돈(bmMarkup·bmGoodMarkup)을 얹어 판다.
     물건은 bmPeriod일마다 바뀌고, 한 번 산 물건은 그 기간에 다시 나오지 않는다. 거래할 때마다 악명 +bmNoto.
   · 명검: 대항해시대 2의 야시장에서 팔던 칼은 그 도시의 암시장에 늘 한 자루 나온다 (BM.SWORDS — 룬 블레이드·성기사의 검·시바신의 마검·
     요도 무라마사·클레이모어 등). 명검이 있는 도시는 내륙(통북투·카이로)이나 작은 항구(페르남부쿠)라도 암시장이 선다.
     다른 도시의 거간꾼은 어디에 어떤 명검이 도는지 귀띔한다 (BM.rumor).
   · 저장: s.bm = {도시 번호: {per: 기간 번호, sold: {물건 id: 1}}}
   조정값: G.BALANCE.acct */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var AC = G.Acct = {}, BM = G.BlackMarket = {};
  function S() { return G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.acct) || {}; }

  /** 회계 단계 (0~3) */
  AC.lv = function () { return G.Game && G.Game.state ? Math.max(0, Math.min(3, R.skill('acct') || 0)) : 0; };
  function at(arr, lv, d) { return arr && arr.length ? arr[Math.min(arr.length - 1, lv)] : d; }
  /** 한 번 들를 때 흥정할 수 있는 횟수 */
  AC.tries = function () { return at(K().tries, AC.lv(), 1) + (R.purser() ? (K().puTry == null ? 1 : K().puTry) : 0); };
  /** 배가 버티는 무게의 덤 (비율) */
  AC.wtBonus = function () { return at(K().wt, AC.lv(), 0); };
  /** 암시장이 열리는 회계 단계 */
  AC.bmLv = function () { return K().blackMarket || 3; };
  /** 단계별 혜택 한 줄 (수첩·도움말) */
  AC.perks = function (lv) {
    if (lv == null) lv = AC.lv();
    var out = ['흥정 ' + at(K().tries, lv, 1) + '번'];
    var w = at(K().wt, lv, 0); if (w) out.push('버티는 무게 +' + Math.round(w * 100) + '%');
    if (lv >= AC.bmLv()) out.push('비밀 암시장');
    return out.join(' · ');
  };

  // ---------------------------------------------------------------- 암시장
  var ITEMS = ['rapidgun', 'divebomb', 'shells', 'telescope', 'sextant', 'turban', 'mingrobe', 'lime', 'flamberge', 'katana'];
  var BASE = { divebomb: 12000 };            // 값이 0인 물건의 암시장 값
  /** 대항해시대 2의 야시장 명검 — 도시 번호 → 물건 (그 도시 암시장에 늘 한 자루) */
  BM.SWORDS = { 64: 'bastard', 21: 'estoc', 45: 'flamberge', 43: 'claymore', 79: 'shamshir', 175: 'guandao', 157: 'shivablade', 214: 'runeblade', 93: 'paladin', 192: 'muramasa' };
  /** 이 도시 암시장의 명검 (아직 벼려지지 않은 칼이면 null) */
  BM.sword = function (c) { var id = c && BM.SWORDS[c.id], d = id && G.ITEM[id]; return d && (!d.made || S().date.y >= d.made) ? id : null; };
  /** 이 도시에 암시장이 서는가 (회계 단계와 상관없이) — 명검이 도는 도시는 내륙·작은 항구라도 */
  BM.here = function (c) { return !!(c && ((c.port && (c.size || 1) >= (K().bmSize || 2)) || BM.SWORDS[c.id])); };
  /** 지금 들어갈 수 있는가 */
  BM.open = function (c) { return BM.here(c) && AC.lv() >= AC.bmLv(); };
  function per() { return Math.floor(S().day / (K().bmPeriod || 30)); }
  function book(c) {
    var s = S(), b = s.bm || (s.bm = {}), x = b[c.id];
    if (!x || x.per !== per()) x = b[c.id] = { per: per(), sold: {} };
    return x;
  }
  function rng(c) { return U.makeRng(Math.abs(U.strHash('bm' + c.id + ':' + per())) + 1); }
  function itemPrice(id) { var d = G.ITEM[id]; return Math.round(((d && d.price) || BASE[id] || 3000) * (K().bmMarkup || 1.5) / 10) * 10; }
  /** 이번 기간에 나온 물건과 밀수품 */
  BM.stock = function (c) {
    var r = rng(c), x = book(c), k = K(), y = S().date.y;
    var sw = BM.sword(c), pool = ITEMS.filter(function (id) { return G.ITEM[id] && id !== sw; }), items = [];
    while (items.length < (k.bmItems || 3) && pool.length) { var i = Math.floor(r() * pool.length); items.push(pool.splice(i, 1)[0]); }
    items = items.map(function (id) { var d = G.ITEM[id]; return { id: id, name: d.name, price: itemPrice(id), early: d.from && y < d.from, sold: !!x.sold[id] }; });
    if (sw) items.unshift({ id: sw, name: G.ITEM[sw].name, price: itemPrice(sw), early: false, sold: !!x.sold[sw], named: true });   // 이 도시의 명검 (물건 수에 세지 않는다)
    // 밀수품: 먼 고장(지역 거리 3 이상)에서 나는 것 가운데, 이 도시가 팔지 않는 것
    var far = G.CITY_DATA.filter(function (o) { return R.cityExists(o) && o.goods && o.goods.length && G.REGION_DIST[c.region] && G.REGION_DIST[c.region][o.region] >= 3; });
    var goods = [], tries = 0;
    while (goods.length < (k.bmGoods || 2) && far.length && tries++ < 40) {
      var src = far[Math.floor(r() * far.length)], gid = src.goods[Math.floor(r() * src.goods.length)];
      if (!G.GOOD[gid] || (G.Slave && G.Slave.is(gid)) || R.sells(c, gid) || goods.some(function (g) { return g.id === gid; })) continue;
      if (G.GOOD[gid].nw && y < 1500 && src.region === 10) continue;
      var q = 6 + Math.floor(r() * 10);
      goods.push({ id: gid, name: G.GOOD[gid].name, from: src.id, q: Math.max(0, q - (x.sold['g:' + gid] || 0)), price: Math.max(1, Math.round(R.buyPrice(src, gid) * (k.bmGoodMarkup || 1.4))) });
    }
    return { items: items, goods: goods };
  };

  /** 거간꾼의 귀띔: 다른 도시 뒷골목에 도는 명검 하나 (기간마다 바뀜) */
  BM.rumor = function (c) {
    var list = Object.keys(BM.SWORDS).map(Number).filter(function (id) { var o = G.CITY_DATA[id]; return id !== c.id && o && R.cityExists(o) && BM.sword(o) && G.ITEM[BM.SWORDS[id]].price >= 100000; });
    if (!list.length) return null;
    var o = G.CITY_DATA[list[Math.floor(rng(c)() * 997) % list.length]], it = G.ITEM[BM.SWORDS[o.id]];
    return { city: o.id, item: it.id, text: '명검을 찾는다면 — ' + o.name + '의 뒷골목에 「' + it.name + '」' + U.jx(it.name, '이/가') + ' 돈다더군.' };
  };

  function dealer(c) {
    var A = G.Art;
    return { name: '뒷골목 거간꾼', portrait: A.withImg(A.npcSpec('bm' + c.id, 'merchant', G.Img.folkStyle(c)), G.Img.chain.npc('trader', c)), lang: G.Scenes.city.langLv(c), li: c.lang };
  }
  BM.visit = async function (c) {
    var s = S(), C = G.Scenes.city, who = dealer(c), k = K();
    if (!BM.open(c)) { await C.say(who, '무슨 소린지 모르겠군. 길을 잘못 들었나 보오.'); return; }
    var x = book(c);
    if (!x.met) { x.met = 1; await C.say(who, U.pick(['장부를 그렇게 꼼꼼히 보는 손님이라면 믿을 만하지. 이리 들어오시오 — 여긴 세관 나리들이 모르는 가게요.', '셈이 밝은 분이시군. 그런 분께만 보여 드리는 물건이 있소. 값은 비싸지만, 어디서도 못 구할 거요.'])); }
    var sw0 = BM.sword(c);
    if (sw0 && !x.swordTold) { x.swordTold = 1; var sn = G.ITEM[sw0].name; await C.say(who, '이 뒷골목에서만 도는 칼이 있소 — 「' + sn + '」. 이 도시를 떠나면 어디서도 구경 못 할 거요.'); }
    for (;;) {
      var st = BM.stock(c);
      var rows = st.items.map(function (it) {
        var d = G.ITEM[it.id] || {}, atk = d.kind === 'weapon' ? ' <small class="muted">공격 ' + d.atk + '</small>' : '';
        return { label: (it.named ? '명검 · ' : '') + it.name + atk + (it.early ? ' <small class="warn-text">아직 시장에 나오지 않은 물건</small>' : ''), right: it.sold ? '팔렸다' : U.num(it.price) + '닢', value: 'i:' + it.id, desc: d.desc, thumb: G.Img.itemSrc ? G.Img.itemSrc({ id: it.id }) : null, icon: d.kind === 'weapon' ? 'sword' : 'seal', disabled: it.sold || it.price > s.player.gold };
      }).concat(st.goods.map(function (g) {
        return { label: '밀수품: ' + g.name + ' <small class="muted">' + G.CITY_DATA[g.from].name + '에서 · ' + g.q + '통</small>', right: U.num(g.price) + '닢/통', value: 'g:' + g.id, icon: 'sack', disabled: !g.q || g.price > s.player.gold };
      }));
      var v = await UI.choose('뒷골목 암시장 — 소지금 ' + U.num(s.player.gold) + '닢 · 악명 ' + Math.round(s.player.notoriety || 0), rows,
        { width: 760, text: '회계 ' + AC.lv() + ' — 셈이 밝은 손님에게만 문을 여는 가게. 물건은 ' + (k.bmPeriod || 30) + '일마다 바뀐다. 거래할 때마다 소문이 나 악명이 ' + (k.bmNoto || 1) + ' 오른다.' + (function () { var rm = BM.rumor(c); return rm ? '<br>거간꾼의 귀띔: ' + rm.text : ''; })() });
      if (!v) return;
      if (v.slice(0, 2) === 'i:') {
        var id = v.slice(2), it = st.items.filter(function (z) { return z.id === id; })[0];
        if (R.itemsFull()) { await C.mate('이 이상 가질 수 없습니다!'); continue; }
        if (!(await UI.confirm(it.name + '<br><span class="muted">' + (G.ITEM[id].desc || '') + '</span><br>금화 ' + U.num(it.price) + '닢에 사겠습니까?', '산다', '그만둔다'))) continue;
        s.player.gold -= it.price; R.addItem(id); x.sold[id] = 1;
        s.player.notoriety = (s.player.notoriety || 0) + (k.bmNoto || 1);
        G.State.log(c.name + '의 뒷골목 암시장에서 ' + it.name + U.jx(it.name, '을/를') + ' 샀다.');
        await C.say(who, U.pick(['좋은 거래였소. 어디서 났는지는 묻지 마시오.', '이 물건 이야기는 우리 둘만 아는 거요.']));
        // 칼이면 지금 찬 것보다 나을 때 바로 찰지 묻는다
        var wd = G.ITEM[id], eq = s.player.equip || (s.player.equip = {}), cur = eq.weapon && G.ITEM[eq.weapon];
        if (wd.kind === 'weapon' && (!cur || (cur.atk || 0) < wd.atk) && await UI.confirm(wd.name + U.jx(wd.name, '을/를') + ' 바로 차겠습니까? (공격 ' + (cur ? cur.atk : 0) + ' → ' + wd.atk + ')', '찬다', '나중에')) { eq.weapon = id; UI.toast(wd.name + U.jx(wd.name, '을/를') + ' 허리에 찼다.', 'sword'); }
      } else {
        var gid = v.slice(2), g = st.goods.filter(function (z) { return z.id === gid; })[0], f = s.fleet;
        if (!f.cargo[gid] && Object.keys(f.cargo).length >= R.maxKinds()) { await C.mate('배에 더 이상 다른 종류의 짐을 실을 곳이 없습니다. (품목 ' + R.maxKinds() + '종까지)'); continue; }
        var room = G.Cargo ? G.Cargo.room(gid) : Math.max(0, R.free()), mx = Math.min(g.q, room, Math.floor(s.player.gold / g.price));
        if (mx <= 0) { await C.mate(room <= 0 ? '제독, 더 실을 곳이 없습니다.' : '돈이 모자랍니다.'); continue; }
        var q = await UI.number({ title: '밀수품 ' + g.name, text: '1통에 금화 ' + U.num(g.price) + '닢. 몇 통 사겠습니까?', min: 1, max: mx, value: mx, unit: '통', info: function (n) { return '합계 금화 <b>' + U.num(n * g.price) + '</b>닢'; } });
        if (!q) continue;
        s.player.gold -= q * g.price;
        var cg = f.cargo[gid];
        if (cg) { cg.cost = Math.round((cg.cost * cg.q + g.price * q) / (cg.q + q)); cg.d = Math.round((cg.d * cg.q + s.day * q) / (cg.q + q)); cg.q += q; }
        else f.cargo[gid] = { q: q, cost: g.price, from: g.from, d: s.day };
        x.sold['g:' + gid] = (x.sold['g:' + gid] || 0) + q;
        s.player.notoriety = (s.player.notoriety || 0) + (k.bmNoto || 1);
        s.stats.trades++;
        UI.toast('밀수품 ' + g.name + ' ' + q + '통을 실었다. (금화 ' + U.num(q * g.price) + '닢)', 'sack');
      }
      G.Game.refreshHud();
    }
  };
})(window.G = window.G || {});
