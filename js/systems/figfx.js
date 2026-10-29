/* 선수상의 효과를 한곳에 — 글과 실제 계산이 어긋나지 않게 (2026-10-29 사용자 요청 「선수상의 효과를 명확히 하고 전설의 선수상을 만들어줘」)
   ■ 보통 덕 (G.FIGUREHEADS, js/data/base.js) — 실제로 쓰는 곳
     spd     그 배의 속력 × (1 + spd)                                       js/core/rules.js R.shipSpeed
     hp      해전 포격·폭풍에서 받는 피해 × (1 − hp)                          js/scenes/battle.js · js/scenes/sea.js
     luck    바다 사건(유령선·빙산·여울·열병·세이렌 …)을 무사히 넘길 확률 + luck×2 js/systems/explore.js
     storm   폭풍을 만날 확률 × (1 − storm×3, 아래로 stormFloor) · 폭풍 피해 − min(stormDmgCut, storm×2)   js/scenes/sea.js
     monster 바다 괴물이 저절로 물러날 확률 · 괴물에게 받는 피해 × max(0.5, 1 − monster)   js/systems/seamonsters.js · js/scenes/battle.js
     morale  항해 중 날마다 규율 + morale×2                                    js/scenes/sea.js runDay
     battle  해전에서 우리 포격 명중 × (1 + battle)                             js/scenes/battle.js
   ■ 함대에 여러 개를 달면: 같은 덕은 가장 큰 것 하나는 그대로, 다른 배의 것은 G.BALANCE.figRest(¼)만 더한다 (R.fleetBonus). 속력만은 단 배에만.
   ■ 전설의 힘 (sp, js/data/figlegend.js) — 함대의 어느 배에 달아도 함대 전체에 미친다
     calm 폭풍 확률 하한 0.35 → 0.12 · guard 폭풍·사건·괴혈병으로 잃는 선원 절반 · regen 날마다 모든 배 선체 1% 메움
     oracle 바다에 나온 지 30일마다 가까운 발견물의 단서 · wake 그 선수상의 속력 덕이 함대 모든 배에 · terror 적 포격 명중 −12%
     curse 폭풍 ×1.3 · 날마다 규율 −0.3 — 성스러운 선수상(holy)이 함대에 있으면 막힌다 */
(function (G) {
  'use strict';
  var FX = G.FigFx = {};
  var U = G.U;
  function S() { return G.Game.state; }
  function R() { return G.R; }
  function BAL() { return G.BALANCE || {}; }
  function pct(v) { var x = Math.round(Math.abs(v) * 1000) / 10; return (x % 1 ? x.toFixed(1) : String(x)); }
  FX.ORDER = ['spd', 'hp', 'storm', 'monster', 'battle', 'luck', 'morale'];
  FX.NAME = { spd: '속력', hp: '선체', storm: '폭풍', monster: '괴물', battle: '해전', luck: '행운', morale: '규율' };
  FX.SP = {
    calm: { name: '고요한 바다', text: '폭풍을 만날 확률을 최대 −88%까지 줄인다 (보통 선수상은 −65%까지)' },
    guard: { name: '어머니의 품', text: '폭풍·바다 사건·괴혈병으로 잃는 선원이 절반으로 준다' },
    regen: { name: '아무는 등딱지', text: '바다에 있는 동안 날마다 함대 모든 배의 선체가 1%씩 저절로 메워진다 (자재 없이)' },
    oracle: { name: '세상 끝의 속삭임', text: '바다에 나온 지 30일마다 가까운 발견물의 단서를 하나 얻는다' },
    wake: { name: '끌어 주는 꼬리', text: '이 선수상의 속력 덕이 단 배만이 아니라 함대 모든 배에 미친다' },
    terror: { name: '떨리는 포수', text: '해전에서 적의 포격 명중이 12% 떨어진다' },
    curse: { name: '저주', text: '폭풍을 30% 더 자주 만나고, 항해 중 규율이 날마다 0.3씩 깎인다 — 천사상·성모상·대천사 미카엘상·성 니콜라스상이 함대에 있으면 막힌다' }
  };
  /** 덕 하나의 실제 효과 글 */
  FX.keyText = function (k, v) {
    var sg = v < 0 ? '−' : '+', p = pct(v);
    var floor = BAL().stormFloor != null ? BAL().stormFloor : 0.35, cut = BAL().stormDmgCut != null ? BAL().stormDmgCut : 1;
    switch (k) {
      case 'spd': return '속력 ' + sg + p + '%';
      case 'hp': return '받는 피해 ' + (v < 0 ? '+' : '−') + p + '% (해전 포격·폭풍)';
      case 'storm': return '폭풍 만날 확률 −' + pct(Math.min(1 - floor, v * 3)) + '% · 폭풍 피해 −' + pct(Math.min(cut, v * 2)) + '%';
      case 'monster': return '바다 괴물이 ' + pct(Math.min(1, v)) + '% 확률로 물러남 · 괴물에게 받는 피해 −' + pct(Math.min(0.5, v)) + '%';
      case 'battle': return '해전 포격 명중 ' + sg + p + '%';
      case 'luck': return '바다 사건을 무사히 넘길 확률 ' + sg + pct(v * 2) + '%p';
      case 'morale': return '항해 중 규율 하루 ' + sg + (Math.round(Math.abs(v) * 20) / 10) + (v < 0 ? ' (깎임)' : '');
    }
    return '';
  };
  /** 선수상 하나의 효과 목록 [{k, text, sp}] */
  FX.lines = function (f) {
    if (!f) return [];
    var out = [];
    FX.ORDER.forEach(function (k) { if (f[k]) out.push({ k: k, text: FX.keyText(k, f[k]) + (k === 'spd' && !(f.sp && f.sp.indexOf('wake') >= 0) ? ' (단 배만)' : '') }); });
    (f.sp || []).forEach(function (k) { if (FX.SP[k]) out.push({ k: k, sp: true, text: '「' + FX.SP[k].name + '」 ' + FX.SP[k].text }); });
    if (f.holy) out.push({ k: 'holy', sp: true, text: '성스러운 상 — 함대에 깃든 저주를 막는다' });
    return out;
  };
  /** 한 줄 요약 (선택 창의 오른쪽·꼬리표) */
  FX.short = function (f) {
    if (!f) return '';
    var floor = BAL().stormFloor != null ? BAL().stormFloor : 0.35;
    return FX.ORDER.filter(function (k) { return f[k]; }).map(function (k) {
      var v = f[k], sg = v < 0 ? '−' : '+';
      if (k === 'hp') sg = v < 0 ? '+' : '−';
      var val = k === 'luck' ? pct(v * 2) + '%p' : k === 'storm' ? pct(Math.min(1 - floor, v * 3)) + '%' : k === 'morale' ? (Math.round(Math.abs(v) * 20) / 10) + '/일' : k === 'monster' ? pct(Math.min(1, v)) + '%' : pct(v) + '%';
      return { spd: '속력', hp: '피해', storm: '폭풍', monster: '괴물 퇴치', battle: '명중', luck: '사건 회피', morale: '규율' }[k] + (k === 'storm' ? '−' : sg) + val;
    }).join(' · ');
  };
  /** 효과를 보여 주는 HTML (설명 밑에) */
  FX.html = function (f, small) {
    var L = FX.lines(f); if (!L.length) return '';
    return '<div class="figfx" style="font-size:' + (small ? 14 : 15) + 'px;line-height:1.55;margin-top:3px">' + L.map(function (x) {
      return '<div' + (x.sp ? ' style="color:' + (x.k === 'curse' ? '#b23a22' : '#9a6400') + '"' : '') + '>' + (x.sp ? '★ ' : '· ') + U.esc(x.text) + '</div>';
    }).join('') + '</div>';
  };
  /** 글자만 (마우스를 올리면 뜨는 풀이) */
  FX.plain = function (f) { return FX.lines(f).map(function (x) { return (x.sp ? '★ ' : '') + x.text; }).join(' / '); };
  /** 선택 창 이름 밑에 붙는 한 줄 — 덕 요약 + 전설의 힘 이름 */
  FX.labelLine = function (f) {
    var a = FX.short(f), sp = (f.sp || []).filter(function (k) { return FX.SP[k]; }).map(function (k) { return '<span style="color:' + (k === 'curse' ? '#b23a22' : '#9a6400') + '">★' + FX.SP[k].name + '</span>'; });
    if (f.holy) sp.push('<span style="color:#9a6400">✚저주 막음</span>');
    var t = [a].concat(sp).filter(Boolean).join(' · ');
    return t ? '<div style="font-size:15px;opacity:.88;margin-top:2px">' + t + '</div>' : '';
  };
  FX.tag = function (f) { return f && f.legend ? ' <span class="tag" style="background:#6b4a10;color:#ffe08a">전설</span>' : ''; };

  // ---------------------------------------------------------------- 함대에 걸린 힘
  function figs() { var s = S(); return s && s.fleet ? s.fleet.ships.map(function (sh) { return R().figure(sh); }).filter(Boolean) : []; }
  FX.figs = figs;
  FX.has = function (sp) { return figs().some(function (f) { return f.sp && f.sp.indexOf(sp) >= 0; }); };
  FX.holy = function () { return figs().some(function (f) { return f.holy; }); };
  FX.cursed = function () { return FX.has('curse') && !FX.holy(); };
  FX.stormFloor = function () { var b = BAL().stormFloor != null ? BAL().stormFloor : 0.35; return FX.has('calm') ? Math.min(b, 0.12) : b; };
  FX.stormMul = function () { return FX.cursed() ? 1.3 : 1; };
  FX.enemyAccK = function () { return FX.has('terror') ? 0.88 : 1; };
  /** 잃을 선원 수 n → 「어머니의 품」이면 절반 (홀수는 반반) */
  FX.crewLoss = function (n) { if (!n || !FX.has('guard')) return n; var h = n / 2; return Math.floor(h) + (h % 1 && U.chance(0.5) ? 1 : 0); };
  FX.crewLossK = function () { return FX.has('guard') ? 0.5 : 1; };
  /** 「끌어 주는 꼬리」: 함대 모든 배에 미치는 속력 덕 */
  FX.wakeSpd = function () { var v = 0; figs().forEach(function (f) { if (f.sp && f.sp.indexOf('wake') >= 0) v = Math.max(v, f.spd || 0); }); return v; };
  /** 함대 전체에 지금 걸린 효과 [{text, sp}] — 함대 정보 창 */
  FX.fleetLines = function () {
    var out = [], RR = R();
    FX.ORDER.forEach(function (k) {
      if (k === 'spd') {
        var s = S(), sp = s.fleet.ships.map(function (sh) { var f = RR.figure(sh); return { n: sh.name, v: Math.max(f && f.spd || 0, FX.wakeSpd()) }; });
        if (sp.some(function (x) { return x.v; })) out.push({ text: '속력 (단 배만) — ' + sp.map(function (x) { return x.n + '호 ' + (x.v ? '+' + pct(x.v) + '%' : '그대로'); }).join(' · ') });
        return;
      }
      var v = RR.fleetBonus(k); if (v) out.push({ text: FX.keyText(k, v) });
    });
    var seen = {};
    figs().forEach(function (f) { (f.sp || []).forEach(function (k) { if (seen[k] || !FX.SP[k]) return; seen[k] = 1; out.push({ sp: true, k: k, text: '「' + FX.SP[k].name + '」 ' + (k === 'curse' && FX.holy() ? '— 성스러운 선수상이 막고 있다' : FX.SP[k].text) }); }); });
    return out;
  };
  FX.fleetHtml = function () {
    var L = FX.fleetLines();
    if (!L.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 6px">선수상 효과 <small class="muted">(함대 합계 — 같은 효과는 가장 큰 것 하나 + 다른 배의 것 ¼)</small></h4><div style="font-size:16px;line-height:1.6">' +
      L.map(function (x) { return '<div' + (x.sp ? ' style="color:' + (x.k === 'curse' && !FX.holy() ? '#b23a22' : '#9a6400') + '"' : '') + '>' + (x.sp ? '★ ' : '· ') + U.esc(x.text) + '</div>'; }).join('') + '</div>';
  };

  // ---------------------------------------------------------------- 바다에서 하루
  /** js/scenes/sea.js runDay — 아무는 등딱지 · 저주 · 세상 끝의 속삭임 */
  FX.daily = function (msgs) {
    var s = S(), f = s.fleet; if (!f || !f.ships.length) return;
    if (FX.has('regen')) f.ships.forEach(function (sh) { if (sh.hp < sh.maxHp) sh.hp = Math.min(sh.maxHp, sh.hp + sh.maxHp * 0.01); });
    if (FX.cursed()) {
      f.discipline = Math.max(0, f.discipline - 0.3);
      if (U.chance(0.04)) msgs.push({ icon: 'skull', text: '마왕상의 눈이 밤새 붉게 빛났다. 선원들이 그 앞을 지나가지 않으려 한다.' });
    }
    if (FX.has('oracle') && f.daysOut > 0 && f.daysOut % 30 === 0) {
      var d = FX.oracleClue();
      if (d) msgs.push({ icon: 'scroll', text: '요르문간드 고리가 바람 소리로 속삭였다 — 「' + d.name + '」의 단서를 얻었다.' });
    }
  };
  /** 가까운 발견물부터 단서를 붙여 본다 (붙으면 그 발견물) */
  FX.oracleClue = function () {
    var s = S(), l = s.loc, D = G.Disc; if (!D || !G.DISCOVERIES) return null;
    var c = G.DISCOVERIES.filter(function (d) {
      return d.how !== 'special' && d.how !== 'trade' && !d.bookOnly && !D.foundByMe(d.id) && !s.hints[d.id] && D.available(d);
    }).map(function (d) { return { d: d, k: G.Geo.dist(l.lon, l.lat, d.lon, d.lat) }; }).sort(function (a, b) { return a.k - b.k; });
    for (var i = 0; i < Math.min(12, c.length); i++) if (D.addHint(c[i].d.id, 'map') !== false && s.hints[c[i].d.id]) return c[i].d;
    return null;
  };

  // ---------------------------------------------------------------- 얻기 · 돌려받기
  FX.legendOf = function (monster) { return (G.FIG_LEGENDS || []).map(function (id) { return G.FIGUREHEAD[id]; }).filter(function (f) { return f && f.src === monster; })[0] || null; };
  FX.got = function (id) { var s = S(); return !!(s.flags.legendFig && s.flags.legendFig[id]); };
  /** 소지품에 넣고, 칸이 없으면 자택 보관함으로 */
  function keep(id, extra) {
    if (R().addItem(id, extra)) return 'items';
    R().storage().push(U.clone(Object.assign({ id: id }, extra || {}))); return 'storage';
  }
  /** 전설의 바다 괴물을 무찔렀을 때 (js/systems/seamonsters.js M.afterBattle 뒤) */
  FX.afterMonster = function (monster) {
    var f = FX.legendOf(monster), s = S(); if (!f || FX.got(f.id)) return null;
    (s.flags.legendFig = s.flags.legendFig || {})[f.id] = U.clone(s.date);
    var where = keep(f.id);
    var mn = G.DISC[monster] ? G.DISC[monster].name : monster;
    G.State.log(mn + U.jx(mn, '이/가') + ' 가라앉은 자리에서 전설의 선수상 「' + f.name + '」' + U.jx(f.name, '을/를') + ' 건졌다.');
    G.UI.toast('전설의 선수상 「' + f.name + '」' + U.jx(f.name, '을/를') + ' 건졌다!' + (where === 'storage' ? ' (소지품이 가득 차 자택 보관함으로 보냈다)' : ' 조선소 「개조 → 선수상」에서 달 수 있다.'), { src: G.Img.itemSrc(f.id), icon: 'feather' }, 6500);
    return f;
  };
  /** 배가 떠날 때(매각·파기) 유물·전설 선수상은 돌려받는다 */
  FX.salvage = function (sh) {
    var f = sh && sh.fig && G.FIGUREHEAD[sh.fig]; if (!f || !(f.relic || f.legend)) return null;
    var where = keep(f.id, f.relic ? { disc: f.relic, done: true } : null); sh.fig = null;
    G.UI.toast(f.name + U.jx(f.name, '을/를') + ' 떼어 ' + (where === 'storage' ? '자택 보관함으로 보냈다.' : '소지품으로 돌려받았다.'), 'feather');
    return f;
  };
  FX.keepable = function (f) { return !!(f && (f.relic || f.legend)); };

  // 괴물과 싸운 뒤 · 항구의 목격 소식
  var M = G.SeaMonsters;
  if (M && M.afterBattle) {
    var oa = M.afterBattle;
    M.afterBattle = function (npc, result, ships) {
      var r = oa.apply(this, arguments);
      try { var b = (ships || []).filter(function (x) { return x.monster === npc.monster; })[0]; if (result === 'win' && b && b.sunk) FX.afterMonster(npc.monster); } catch (e) { console.error(e); }
      return r;
    };
  }
  if (M && M.newsText) {
    var on = M.newsText;
    M.newsText = function (c, e) {
      var t = on.apply(this, arguments), f = e && FX.legendOf(e.id);
      return f && !FX.got(f.id) ? t + ' 무찌르면 그 괴물이 지키던 전설의 「' + f.name + '」' + U.jx(f.name, '을/를') + ' 건질 수 있다는 말도 돈다.' : t;
    };
  }
})(window.G = window.G || {});
