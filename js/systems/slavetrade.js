/* 노예 무역의 대가 — 악명과 「노예 상인」이라는 이름 (자료·조정값: js/data/slavetrade.js)
   · 노예를 사거나 팔 때마다 악명이 오른다 (G.BALANCE.slave.buy·sell). 처음 살 때는 부관이 한 번 말린다.
   · 한 번이라도 사고팔면 「노예 상인」이라는 이름이 붙는다 — 위쪽 「직위」 칸과 수첩에 나온다.
     마지막으로 사고판 날부터 titleYears(5)해가 지나야 잊힌다. 뒤를 이은 자녀에게는 이어지지 않는다.
   · 저장: s.slaver = {first, last, bought, sold, gen} — 없으면 손댄 적 없음 (옛 저장 그대로 열림) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var SL = {};
  G.Slave = SL;
  function S() { return G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.slave) || { buy: [2, 15], sell: [3, 10], titleYears: 5 }; }
  SL.ID = 'slaves';
  SL.is = function (goodId) { return goodId === SL.ID; };
  function gen() { return S().player.generation || 1; }
  /** 지금 「노예 상인」으로 불리는가 — 불리면 그 이름, 아니면 ''. 기한이 지났으면 여기서 지운다 */
  SL.title = function () {
    var s = G.Game && G.Game.state, r = s && s.slaver; if (!r) return '';
    if ((r.gen || 1) !== gen()) return '';                       // 아버지의 일은 자녀의 이름이 아니다
    if (s.day - r.last >= B().titleYears * 365) {
      if (!r.over) { r.over = s.day; G.State.log('「' + G.SLAVE.title + '」이라는 이름이 세상에서 잊혔다.'); if (UI && UI.toast) UI.toast('세월이 흘러 「' + G.SLAVE.title + '」이라는 이름이 잊혔다.', 'hourglass', 5000); }
      return '';
    }
    return G.SLAVE.title;
  };
  /** 남은 날 (이름이 잊히기까지) */
  SL.remain = function () { var s = S(), r = s.slaver; return r && SL.title() ? Math.max(0, Math.round(B().titleYears * 365 - (s.day - r.last))) : 0; };
  /** 처음 사려 할 때: 부관이 말린다. false면 사지 않는다 */
  SL.confirm = async function (c) {
    var s = S(); if (s.slaver && (s.slaver.gen || 1) === gen()) return true;
    var mate = G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    var v = await UI.ask('제독, 저 쇠사슬에 묶인 것은 짐이 아니라 사람입니다. …정말 이 장사에 손을 대시겠습니까?\n한번 「노예 상인」이라는 이름이 붙으면 쉽게 떨어지지 않습니다. 사고팔 때마다 악명도 오릅니다.',
      [{ label: '그만둔다', value: 0 }, { label: '그래도 산다', value: 1 }], mate);
    return !!v;
  };
  function mark(kind, q) {
    var s = S(), b = B(), a = b[kind], add = a[0] + Math.floor(q / a[1]);
    var had = !!SL.title();
    if (!s.slaver || (s.slaver.gen || 1) !== gen()) s.slaver = { first: s.day, last: s.day, bought: 0, sold: 0, gen: gen() };
    var r = s.slaver; r.last = s.day; delete r.over;
    if (kind === 'buy') r.bought += q; else r.sold += q;
    s.player.notoriety = (s.player.notoriety || 0) + add;
    s.stats.slaves = (s.stats.slaves || 0) + (kind === 'sell' ? q : 0);
    UI.toast('사람을 ' + (kind === 'buy' ? '사들인' : '팔아넘긴') + ' 일이 항구에 퍼진다. (악명 +' + add + ' → ' + s.player.notoriety + ')', 'skull', 4200);
    if (!had) {
      G.State.log('노예 무역에 손을 댔다 — 세상은 이제 제독을 「' + G.SLAVE.title + '」이라 부른다.');
      UI.toast('세상은 이제 제독을 「' + G.SLAVE.title + '」이라 부른다.', 'skull', 6500);
    }
    if (G.Game.refreshHud) G.Game.refreshHud();
    return add;
  }
  SL.onBuy = function (c, q) { return mark('buy', q); };
  SL.onSell = function (c, q) { return mark('sell', q); };
  /** 수첩에 보일 글 */
  SL.html = function () {
    var s = S(), r = s.slaver; if (!SL.title()) return '';
    return '<span class="tag dark" title="노예를 사고판 사람 — 산 것 ' + U.num(r.bought) + '통 · 판 것 ' + U.num(r.sold) + '통. 마지막으로 사고판 날부터 ' + B().titleYears + '해가 지나야 잊힌다 (남은 ' + U.num(SL.remain()) + '일)">' + G.SLAVE.title + '</span>';
  };
})(window.G = window.G || {});
