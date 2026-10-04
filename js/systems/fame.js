/* 명성의 네 갈래 — 탐험·교역·전투·사교.
   · 통합 명성(player.fame)은 네 갈래(player.fameBy = {ex, tr, bt, so})를 합친 값이다.
     후원자 알현·항해사 고용·해적의 세기처럼 예전부터 명성을 보던 곳은 그대로 통합 명성을 본다.
   · 명성을 줄 때는 G.Fame.add('갈래', 값)을 쓴다. 갈래를 모르는 감점은 G.Fame.add(null, −값) — 네 갈래에서 고르게 깎는다.
   · 다른 코드가 player.fame을 바로 고쳤더라도 G.Fame.sync()가 차이를 맞춘다(오른 몫은 탐험, 깎인 몫은 고르게).
   · 옛 저장(fameBy 없음)은 처음 열 때 발견·교역·해전 기록을 보고 어림해 나눈다. 제독의 뒤를 이은 자녀는 비율대로 물려받는다. */
(function (G) {
  'use strict';
  var F = {};
  G.Fame = F;
  F.CATS = [
    { id: 'ex', name: '탐험', icon: 'compass', desc: '발견·보고·새 항구와 새 바다·이름 붙이기' },
    { id: 'tr', name: '교역', icon: 'coin', desc: '교역 이익·투자·물자 조달과 납품' },
    { id: 'bt', name: '전투', icon: 'sword', desc: '해전·일기토·해적 퇴치·뭍의 싸움' },
    { id: 'so', name: '사교', icon: 'people', desc: '기부·사절·사람을 돕는 일·궁정의 일' }
  ];
  F.NAME = { ex: '탐험', tr: '교역', bt: '전투', so: '사교' };
  var IDS = ['ex', 'tr', 'bt', 'so'];
  function P() { var s = G.Game && G.Game.state; return s && s.player; }
  function sum(b) { return (b.ex || 0) + (b.tr || 0) + (b.bt || 0) + (b.so || 0); }
  /** 값 n을 무게 w대로 나눈다 (합이 꼭 n이 되게) */
  function split(n, w) {
    var tot = IDS.reduce(function (a, k) { return a + Math.max(0, w[k] || 0); }, 0), out = {}, used = 0;
    if (tot <= 0) { w = { ex: 1, tr: 0, bt: 0, so: 0 }; tot = 1; }
    IDS.forEach(function (k) { out[k] = Math.floor(n * Math.max(0, w[k] || 0) / tot); used += out[k]; });
    var top = IDS.slice().sort(function (a, b) { return (w[b] || 0) - (w[a] || 0); })[0];
    out[top] += n - used;
    return out;
  }
  /** 옛 저장: 지금까지의 기록으로 어림한다 */
  function guess(s) {
    var st = (s && s.stats) || {};
    return { ex: 60 + (st.found || 0) * 160, tr: Math.max(0, st.profit || 0) / 2500 + (st.trades || 0) * 0.5, bt: (st.wins || 0) * 35 + (st.sunk || 0) * 10, so: (st.quests || 0) * 8 };
  }
  /** 갈래의 합을 통합 명성과 맞춘다. 갈래 묶음을 돌려준다 */
  F.sync = function () {
    var p = P(); if (!p) return { ex: 0, tr: 0, bt: 0, so: 0 };
    p.fame = Math.max(0, Math.round(p.fame || 0));
    if (!p.fameBy) { p.fameBy = split(p.fame, guess(G.Game.state)); return p.fameBy; }
    var b = p.fameBy, d = p.fame - sum(b);
    if (d > 0) b.ex = (b.ex || 0) + d;
    else if (d < 0) p.fameBy = b = split(p.fame, b);
    return b;
  };
  /** 명성을 더한다(빼려면 음수). cat이 없으면 오르는 몫은 탐험, 깎이는 몫은 네 갈래에서 고르게. 실제로 바뀐 값을 돌려준다 */
  F.add = function (cat, n) {
    var p = P(); if (!p) return 0;
    n = Math.round(n || 0);
    var b = F.sync(); if (!n) return 0;
    if (n > 0) { cat = F.NAME[cat] ? cat : 'ex'; b[cat] = (b[cat] || 0) + n; p.fame += n; return n; }
    var lose = Math.min(p.fame, -n);
    if (F.NAME[cat]) {
      var own = Math.min(b[cat] || 0, lose); b[cat] -= own; p.fame -= own;
      if (lose > own) { p.fame -= lose - own; F.sync(); }
    } else { p.fame -= lose; F.sync(); }
    return -lose;
  };
  F.get = function (cat) { var b = F.sync(); return cat ? (b[cat] || 0) : P() ? P().fame : 0; };
  /** 가장 높은 갈래 */
  F.top = function () { var b = F.sync(); return IDS.slice().sort(function (x, y) { return (b[y] || 0) - (b[x] || 0); })[0]; };
  /** 조합 의뢰의 갈래 */
  F.questCat = function (kind) { return kind === 'pirate' ? 'bt' : kind === 'carry' || kind === 'buy' ? 'tr' : 'so'; };
  /** 수첩·도움말에 쓰는 글: 탐험 1,200 · 교역 300 · … */
  F.text = function () {
    var b = F.sync(), U = G.U;
    return F.CATS.map(function (c) { return c.name + ' ' + U.num(b[c.id] || 0); }).join(' · ');
  };
  F.html = function () {
    var b = F.sync(), U = G.U, tot = Math.max(1, sum(b));
    return '<div class="famebars">' + F.CATS.map(function (c) {
      var v = b[c.id] || 0;
      return '<div class="famebar" title="' + c.desc + '"><span class="fn">' + c.name + '</span><span class="fb"><i style="width:' + Math.round(v / tot * 100) + '%"></i></span><b>' + U.num(v) + '</b></div>';
    }).join('') + '</div>';
  };
})(window.G = window.G || {});
