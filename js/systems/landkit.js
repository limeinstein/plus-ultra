/* 탐험 장비 (G.LandKit) — 육상전 고침 (2026-10-23 사용자 요청)
   ■ 성문에서 탐험대에 화승총·창·흉갑을 사서 갖춘다. 장비는 s.landKit = {musket, pike, armor} 에 (몇 사람 몫인지) 남는다
     · 화승총: 총병 부대의 힘 (다 갖추면 +40%) · 긴 창: 기병을 받는 보병 (+40%) · 흉갑: 근접 피해 −20%
     · 갖춘 만큼만 듣는다 — 그 장비를 쓰는 대원 수에 견주어 (5명 가운데 3명 몫이면 6할)
   ■ 육상전에서 대원이 쓰러지면 그만큼 장비도 잃는다 · 이긴 싸움에서 적의 총을 거두면 화승총이 는다
   ■ 포로를 풀어 준 땅(s.flags.lwFriend_지역)의 원주민은 한동안 우리를 반긴다 — friendly() (js/scenes/land.js 원주민 만남)
   값: G.BALANCE.landwar.kit (js/data/landwarunits.js) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var LK = {};
  G.LandKit = LK;
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.landwar) || {}; }
  var ITEMS = [
    { id: 'musket', name: '화승총', unit: '정', desc: '총병 부대가 쓴다 — 다 갖추면 총병 +40%' },
    { id: 'pike', name: '긴 창', unit: '자루', desc: '보병이 쓴다 — 다 갖추면 기병을 받는 보병 +40%' },
    { id: 'armor', name: '흉갑', unit: '벌', desc: '근접 부대(보병·기병·제독대)가 입는다 — 다 갖추면 근접 피해 −20%' }
  ];
  LK.ITEMS = ITEMS;
  LK.st = function () {
    var s = S(); if (!s) return { musket: 0, pike: 0, armor: 0 };
    var k = s.landKit || (s.landKit = {});
    ITEMS.forEach(function (it) { if (!(k[it.id] >= 0)) k[it.id] = 0; });
    return k;
  };
  LK.price = function (id) { return (K().kit || {})[id] || { musket: 45, pike: 14, armor: 70 }[id]; };
  /** 갖춘 비율 (0~1) — men: 그 장비를 쓰는 대원 수 */
  LK.cover = function (id, men) { var n = LK.st()[id] || 0; return men > 0 ? U.clamp(n / men, 0, 1) : 0; };
  LK.add = function (id, n) { var k = LK.st(); k[id] = Math.max(0, Math.round((k[id] || 0) + n)); };
  /** 대원이 쓰러진 만큼 장비를 잃는다 (frac: 잃은 대원의 비율) */
  LK.lose = function (frac) { var k = LK.st(); frac = U.clamp(frac || 0, 0, 1); ITEMS.forEach(function (it) { k[it.id] = Math.max(0, Math.round(k[it.id] * (1 - frac))); }); };
  LK.summary = function () {
    var k = LK.st(), parts = ITEMS.filter(function (it) { return k[it.id] > 0; }).map(function (it) { return it.name + ' ' + k[it.id] + it.unit; });
    return parts.join(' · ');
  };
  /** 포로를 풀어 준 땅의 원주민인가 */
  LK.friendly = function (lon, lat) {
    var s = S(), LA = G.LANDWAR_ART; if (!s || !LA || !s.flags) return false;
    var reg = LA.regionOf(lon || 0, lat || 0), y = reg && s.flags['lwFriend_' + reg];
    return !!(y && s.date.y - y < (K().friendYears || 20));
  };

  /** 성문: 탐험 장비를 산다 */
  LK.shop = async function (c) {
    var s = S(), p = s.player, men = (s.landReturn && s.landReturn.party) || s.fleet.crew || 0;
    for (;;) {
      var k = LK.st();
      var v = await UI.choose('탐험 장비', ITEMS.map(function (it) {
        var need = Math.max(0, men - k[it.id]), pr = LK.price(it.id);
        return { label: it.name + ' <small>' + k[it.id] + it.unit + ' 갖춤</small>', right: '한 ' + it.unit + ' ' + U.num(pr) + '닢', value: it.id, desc: it.desc + (need ? ' · 대원 ' + men + '명에 ' + need + it.unit + ' 모자란다' : ' · 다 갖추었다') };
      }).concat([{ label: '그만둔다', value: null }]), { width: 600, icon: 'sword', text: '육상전에서 쓰는 장비다. 대원 수(' + men + '명)만큼 갖추면 힘을 다 낸다 — 쓰러진 대원의 장비는 잃는다.' });
      if (!v) return;
      var it = ITEMS.filter(function (x) { return x.id === v; })[0], pr = LK.price(v), have = LK.st()[v], fill = Math.max(0, men - have);
      var opts = [10, 25].map(function (n) { return { label: n + it.unit + ' 산다 (금화 ' + U.num(n * pr) + '닢)', value: n, dis: p.gold < n * pr }; });
      if (fill > 0) opts.unshift({ label: '대원 수만큼 채운다 — ' + fill + it.unit + ' (금화 ' + U.num(fill * pr) + '닢)', value: fill, dis: p.gold < fill * pr });
      if (have > 0) opts.push({ label: '갖춘 것을 판다 — ' + have + it.unit + ' (금화 ' + U.num(Math.floor(have * pr / 2)) + '닢)', value: -have });
      opts.push({ label: '그만둔다', value: 0 });
      var n = await UI.ask(it.name + ' — ' + it.desc + '. 지금 ' + have + it.unit + ' 갖추었다.', opts, G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {});
      if (!n) continue;
      if (n < 0) { p.gold += Math.floor(-n * pr / 2); LK.add(v, n); UI.toast(it.name + ' ' + (-n) + it.unit + U.jx(it.unit, '을/를') + ' 팔았다.', 'coin'); }
      else if (p.gold < n * pr) { UI.toast('소지금이 모자랍니다.', 'coin'); continue; }
      else { p.gold -= n * pr; LK.add(v, n); UI.toast(it.name + ' ' + n + it.unit + U.jx(it.unit, '을/를') + ' 갖추었다.', 'sword'); }
      if (G.Game.refreshHud) G.Game.refreshHud();
    }
  };

  // 성문 메뉴에 「탐험 장비」를 더한다 (js/city/misc.js GT.menu)
  function hook() {
    var C = G.Scenes && G.Scenes.city, GT = C && C.B && C.B.gate;
    if (!GT || GT._kit) return !!GT;
    GT._kit = true;
    var om = GT.menu;
    GT.menu = function (c) {
      var list = om.apply(this, arguments), sm = LK.summary();
      list.push({ label: '탐험 장비', icon: 'sword', sub: sm || '화승총 · 창 · 흉갑', onClick: function () { return LK.shop(c); } });
      return list;
    };
    return true;
  }
  LK.hook = hook;
  if (!hook()) document.addEventListener('DOMContentLoaded', hook);
})(window.G = window.G || {});
