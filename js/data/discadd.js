/* 발견물 더하기 도우미 (G.DiscAdd) — 2026-10-18
   지역별로 더한 발견물 파일(dh3disc.js · seasiadisc.js · northasiadisc.js · arabiadisc.js · zoodisc.js)이 함께 쓴다.
   moredisc.js·animals.js와 같은 방식으로 G.WONDERS 묶음(list·relics·front·leads)에 넣는다 → discoveries.js·relics.js·frontiers.js가 그대로 읽는다.

   ruin(id, 이름, 위도, 경도, 찾는 법, 난이도, 가치, 언어, 지역, 개척 단계, 칸, 세운 해, 설명, 소문, 덧붙임)   — 유적·종교 건축 (cat ruin)
   nat (id, 이름, 위도, 경도, 찾는 법, 난이도, 가치, 언어, 지역, 개척 단계, 칸, 설명, 소문, 덧붙임)          — 자연 경관 (cat nature)
   ani (id, 이름, 위도, 경도, 찾는 법, 난이도, 가치, 언어, 지역, 개척 단계, 칸, 설명, 소문, 덧붙임)          — 동물 (cat creature, animal)
   relic(발견 id, 이름, 종류, 값 비율, 설명, 덧붙임)  — 그 자리에서 손에 넣는 유물 (relics.js의 add와 같다)
   lead(책 id, [발견 id…])                         — 이미 있는 책에 단서를 덧붙인다
     · 찾는 법: 'land' 뭍(탐험) · 'sea' 배로 그 바다 · 도시 번호(도시 안 — 유적은 거리의 볼거리·메뉴에서 눌러야 찾는다)
     · 가치는 discoveries.js의 add()가 1.75배 한다 (다른 파일과 같다)
     · 세운 해(built): 그 해 전에는 없다. 1600년 뒤 1800년 전은 1600년부터 신기루, 1800년 이후 건물은 언제든 「신기루로 본 발견」이 된다 (js/systems/mirage.js)
     · 개척 단계·칸: frontiers.js의 단계 id와 칸(1 가벼움 · 2 무거움 · 3 가장 무거움). 1700년 뒤에 세워진 것은 단계에 넣지 않는다 */
(function (G) {
  'use strict';
  var W = G.WONDERS = G.WONDERS || { list: [], relics: [], books: [], meta: {}, text: {}, leads: {}, front: {} };
  var A = G.DiscAdd = { ids: [] };
  function front(f, tier, id) { if (f && tier != null) (W.front[f] = W.front[f] || [[], [], [], []])[tier].push(id); }
  function city(x, how) { if (typeof how === 'number') { x.city = how; return 'city'; } return how; }
  A.ruin = function (id, name, lat, lon, how, pw, val, lang, reg, f, tier, built, desc, hint, extra) {
    var x = extra || {};
    x.wonder = true; x.added = 'regional';
    if (built) x.built = built;
    how = city(x, how);
    W.list.push([id, name, 'ruin', lat, lon, how, pw, val, lang, reg, desc, hint, x]);
    A.ids.push(id);
    if (!built || built <= 1700) front(f, tier, id);
  };
  A.nat = function (id, name, lat, lon, how, pw, val, lang, reg, f, tier, desc, hint, extra) {
    var x = extra || {};
    x.natural = true; x.added = 'regional';
    how = city(x, how);
    W.list.push([id, name, 'nature', lat, lon, how, pw, val, lang, reg, desc, hint, x]);
    (G.NATURALS = G.NATURALS || []).push(id);
    A.ids.push(id);
    front(f, tier, id);
  };
  A.ani = function (id, name, lat, lon, how, pw, val, lang, reg, f, tier, desc, hint, extra) {
    var x = extra || {};
    x.animal = true; x.added = 'regional';
    if (typeof how === 'number') { x.city = how; how = 'city'; if (x.needHint == null) x.needHint = true; }
    if (x.book) { x.bookOnly = true; delete x.book; }
    if (how === 'land' && x.r == null) x.r = 0.6;
    if (how === 'sea' && x.r == null) x.r = 2.0;
    W.list.push([id, name, 'creature', lat, lon, how, pw, val, lang, reg, desc, hint, x]);
    (G.ANIMALS = G.ANIMALS || []).push(id);
    A.ids.push(id);
    if (!x.built || x.built <= 1700) front(f, tier, id);
  };
  /** 보물 (cat treasure) — treasure(id, 이름, 위도, 경도, 찾는 법, 난이도, 가치, 언어, 지역, 개척 단계, 칸, 설명, 소문, 덧붙임) */
  A.treasure = function (id, name, lat, lon, how, pw, val, lang, reg, f, tier, desc, hint, extra) {
    var x = extra || {};
    x.added = 'regional';
    how = city(x, how);
    W.list.push([id, name, 'treasure', lat, lon, how, pw, val, lang, reg, desc, hint, x]);
    A.ids.push(id);
    front(f, tier, id);
  };
  A.relic = function (disc, name, kind, v, desc, extra) { W.relics.push([disc, name, kind, v, desc, extra]); };
  A.lead = function (book, ids) { var a = W.leads[book] = W.leads[book] || []; ids.forEach(function (id) { if (a.indexOf(id) < 0) a.push(id); }); };
})(window.G = window.G || {});
