/* 식당 — 도시·문화권별 대표 음식 여섯 가지 (자료: js/data/cuisine.js).
   한 도시에서 하루 한 끼만 항해 피로를 회복하고, 규율과 사교 명성이 살짝 오른다 (G.BALANCE.restaurant.disc·so). 옛 저장에는 restaurant가 없어도 즉석에서 만든다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city;
  function S() { return G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.restaurant) || { base: 5, size: 3, tier: 4, rest: [0, 6, 8, 10], hp: [0, 1, 2, 3] }; }
  function owner() { return C.npc('innkeeper', '식당 주인'); }
  // 건물에 들어갈 때마다 하루가 흘러 나갔다 들어오면 또 먹을 수 있던 것 — 이번 입항(R.sameStay)에도 한 끼로 막는다 (QA 2026-10-23)
  function used(c) { var s = S(), r = s.restaurant; return !!(r && r.last && R.sameStay(r.last[c.id], r.lastPv && r.lastPv[c.id])); }
  function price(c, d) { var k = K(); return Math.max(1, Math.round(k.base + c.size * k.size + d.tier * k.tier)); }
  function thumb(d) { var key = 'foods/' + d.id; return G.Img && G.Img.has(key) ? G.Img.src(key) : null; }

  var T = { title: '식당', icon: 'bread', paint: 'restaurant', exitLabel: '식당을 나온다' };
  C.B.restaurant = T;
  T.sub = function (c) {
    var ds = G.CUISINE.dishes(c);
    var cafe = G.Coffee ? G.Coffee.menu(c).length : 0;
    return (ds[0] ? ds[0].name + ' 외 ' + (ds.length - 1) + '가지' : '오늘의 음식') + (cafe ? ' · 커피 ' + cafe + '가지' : '') + (used(c) ? ' · 오늘 식사함' : '');
  };
  T.enter = async function (c) {
    await C.say(owner(), C.hail(c, 'restaurant', ['어서 오십시오. 이 고장에서 난 것으로 든든하게 차려 드리지요.', '먼 길 오셨군요. 따뜻한 음식부터 드십시오.', '오늘도 좋은 재료가 들어왔습니다. 차림표를 보시지요.']));
  };
  T.menu = function (c) {
    var rows = [{ label: '차림표를 본다', icon: 'bread', sub: used(c) ? '오늘은 이미 먹었다' : G.CUISINE.dishes(c).length + '가지', onClick: function () { return T.choose(c); } }];
    // 커피 메뉴 — 이 문화권에 커피를 팔아 연 것만 (js/systems/coffee.js · 2026-10-30)
    var cafe = G.Coffee ? G.Coffee.menu(c) : [];
    if (cafe.length) rows.push({ label: '커피를 마신다', icon: 'mug', sub: G.Coffee.used(c) ? '오늘은 이미 마셨다' : cafe.length + '가지', onClick: function () { return T.coffee(c); } });
    return rows;
  };
  T.coffee = async function (c) {
    var CF = G.Coffee, ds = CF.menu(c), already = CF.used(c), s = S();
    if (!ds.length) return;
    var d = await UI.choose(c.name + ' 식당 커피', ds.map(function (x) {
      var p = CF.price(c, x), tasted = s.coffee && s.coffee.tasted && s.coffee.tasted[x.id];
      var key = 'drinks/' + x.id, img = G.Img && G.Img.has(key) ? G.Img.src(key) : null;
      return { value: x, thumb: img, icon: img ? null : 'mug',
        label: '<b>' + U.esc(x.name) + '</b>' + (tasted ? '' : ' <small class="good-text">처음 맛본다</small>') + '<br><small class="muted">' + U.esc(x.desc) + '</small>',
        right: U.num(p) + '닢', disabled: already || s.player.gold < p, desc: x.desc };
    }), { width: 790, icon: 'mug', text: already ? '이번에 이 도시에 들러서는 이미 한 잔 마셨습니다. 다음에 들르면 다시 마실 수 있습니다.' : '커피를 이 고장에 들여온 제독이 직접 한 잔 마시면 사람들 사이에 이름이 오르내립니다. 처음 맛보는 커피는 이야깃거리가 더 됩니다. (식사와는 따로, 들를 때마다 한 잔)' });
    if (!d) return;
    var r = CF.drink(c, d);
    if (r === 'used') { await C.say(owner(), '오늘은 벌써 한 잔 하셨지요. 너무 많이 드시면 밤에 잠을 못 이루십니다.'); return; }
    if (r === 'gold') { await C.say(owner(), '소지금이 모자랍니다.'); return; }
    if (!r || typeof r === 'string') return;
    var gain = (r.so > 0 ? '사교 명성 +' + r.so : '') + (r.rest > 0 ? (r.so > 0 ? ' · ' : '') + '피로 −' + r.rest : '');
    if (G.Game.refreshHud) G.Game.refreshHud();
    if (G.State && G.State.log) G.State.log(c.name + ' 식당에서 ' + d.name + U.jx(d.name, '을/를') + ' 마셨다. (금화 ' + r.price + '닢' + (gain ? ' · ' + gain : '') + ')');
    if (G.Audio) { G.Audio.sfx('pot'); setTimeout(function () { if (G.Audio) G.Audio.sfx('coin'); }, 380); }
    var n = CF.count();
    await C.say(owner(), (r.first ? '이 고장에 커피를 들여오신 그 제독이시라고요? 손님들이 다들 쳐다봅니다. ' : '늘 드시던 그것으로 내렸습니다. ') + d.name + U.jx(d.name, '은/는') + ' 이 집의 자랑이지요.\f향이 오래 남는 한 잔이었다. (' + gain + (r.first ? ' · 맛본 커피 ' + n.tasted + '/' + n.all : '') + ')');
  };
  T.choose = async function (c) {
    var ds = G.CUISINE.dishes(c), already = used(c);
    var d = await UI.choose(c.name + ' 식당 차림표', ds.map(function (x) {
      var p = price(c, x);
      return { value: x, thumb: thumb(x), icon: thumb(x) ? null : 'bread',
        label: '<b>' + U.esc(x.name) + '</b><br><small class="muted">' + U.esc(x.desc) + '</small>',
        right: U.num(p) + '닢', disabled: already || S().player.gold < p, desc: x.desc };
    }), { width: 790, icon: 'bread', text: already ? '이번에 이 도시에 들러서는 이미 한 끼를 먹었습니다. 다음에 들르면 다시 맛볼 수 있습니다.' : '이 고장의 대표 음식을 한 끼 먹으면 항해 피로가 줄고, 선원들의 규율이 오르며, 사교 명성도 살짝 오릅니다.' });
    if (!d) return;
    await T.eat(c, d);
  };
  T.eat = async function (c, d) {
    var s = S(), p = price(c, d), k = K();
    if (used(c)) { await C.say(owner(), '오늘은 이미 든든히 드셨습니다. 다음에 또 들러 주십시오.'); return; }
    if (s.player.gold < p) { await C.say(owner(), '소지금이 모자랍니다.'); return; }
    s.player.gold -= p;
    s.restaurant = s.restaurant || {}; s.restaurant.last = s.restaurant.last || {}; s.restaurant.last[c.id] = s.day; (s.restaurant.lastPv = s.restaurant.lastPv || {})[c.id] = R.stayNo();
    var before = s.fleet.fatigue || 0, rest = (k.rest[d.tier] == null ? 6 : k.rest[d.tier]);
    s.fleet.fatigue = Math.max(0, before - rest);
    s.player.hp = Math.min(100, (s.player.hp || 100) + (k.hp[d.tier] || 0));
    // 든든한 한 끼는 선원들의 규율도 다잡고, 이 고장 사람들 사이에 제독의 이름이 살짝 오르내린다 (2026-10-17)
    var d0 = s.fleet.discipline == null ? 60 : s.fleet.discipline, dUp = (k.disc && k.disc[d.tier]) || 0;
    s.fleet.discipline = Math.min(100, d0 + dUp); dUp = Math.round(s.fleet.discipline - d0);
    var so = (k.so && k.so[d.tier]) ? (G.Fame ? G.Fame.add('so', k.so[d.tier]) : 0) : 0;
    if (G.Growth) G.Growth.meal(d.tier, d.id || d.name);   // 미식 경험 — 처음 맛본 음식은 두 배 (js/systems/growth.js)
    var gain = '피로 −' + (before - s.fleet.fatigue) + (dUp > 0 ? ' · 규율 +' + dUp : '') + (so > 0 ? ' · 사교 명성 +' + so : '');
    if (G.Game.refreshHud) G.Game.refreshHud();
    if (G.State && G.State.log) G.State.log(c.name + ' 식당에서 ' + d.name + U.jx(d.name, '을/를') + ' 먹었다. (금화 ' + p + '닢 · ' + gain + ')');
    if (G.Audio) { G.Audio.sfx('pot'); setTimeout(function () { if (G.Audio) G.Audio.sfx('coin'); }, 380); }   // 냄비 소리, 값을 치른다
    await C.say(owner(), d.name + U.jx(d.name, '은/는') + ' 이 고장의 맛을 잘 보여 주는 음식입니다.\f배도 든든해졌으니 좋은 항해가 되시길! (' + gain + ')');
  };
})(window.G = window.G || {});
