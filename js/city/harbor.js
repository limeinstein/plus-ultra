/* 항구: 출항, 보급, 함대편성, 마을정보, 발표 (선원 모집·내림은 술집 — H.crew를 술집이 부른다) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city;
  function S() { return G.Game.state; }
  var MAX_SHIPS = 5;
  G.MAX_SHIPS = MAX_SHIPS;

  var H = { title: '항구', icon: 'anchor', paint: 'harbor', exitLabel: '마을로 돌아간다' };
  C.B.harbor = H;

  H.enter = async function (c) {
    var sp = G.Scenes.mateSpeaker('first');
    var s = S();
    if (s.loc.via === 'land') { await UI.say('우리 함대는 이 항구에 없습니다. 탐험대로 돌아가 배가 있는 곳까지 가야 합니다.', sp); return false; }
    var line = c.id === s.player.home ? U.pick(['제독, 역시 모항이 좋군요.', '모항에 돌아오면 안심되는군요.', '출항할 때에는 말해 주십시오. 곧 준비하겠습니다.']) : U.pick(['출항할 때에는 말해 주십시오. 곧 준비하겠습니다.', '제독, 이 마을에서 잠깐 쉽시다.', '배는 잘 정박해 두었습니다.']);
    UI.toast(sp.name + ': ' + line, 'anchor', 2600);
  };
  H.sub = function () { return '부관이 출항 준비를 돕습니다'; };
  H.menu = function (c) {
    var s = S(), unrep = G.Disc.unreported().length;
    return [
      { label: '출항 준비', icon: 'check', sub: H.prepNote(c), onClick: function () { return H.prep(c); } },
      { label: '출항', icon: 'sail', onClick: function () { return H.depart(c); } },
      (G.Monsoon && G.Monsoon.rim(c)) ? { label: '계절풍 형편', icon: 'wind', sub: G.Monsoon.NAME[G.Monsoon.portNote(c).phase], onClick: function () { return H.monsoon(c); } } : null,
      { label: '보급', icon: 'bread', sub: R.daysOfFood() >= 999 ? '' : R.daysOfFood() + '·' + R.daysOfWater() + '일 · 자재 ' + Math.floor(S().fleet.mat || 0), onClick: function () { return H.supply(c); } },
      { label: '함대편성', icon: 'ship', sub: s.fleet.ships.length + '척' + (moored(c).length ? ' +' + moored(c).length : ''), onClick: function () { return H.fleet(c); } },
      { label: '마을정보', icon: 'map', onClick: function () { return H.townInfo(c); } },
      { label: '발표', icon: 'flag', sub: unrep ? unrep + '건' : '', dim: !unrep, onClick: function () { return H.announce(c); } }
    ].concat(G.Colony ? G.Colony.harborItems(c) : []);   // 개척 도시: 개척 물자를 넘긴다
  };
  H.panel = function () { return G.Info.fleetPanel(); };

  function moored(c) { var s = S(); if (!s.moored) s.moored = {}; return s.moored[c.id] || (s.moored[c.id] = []); }
  H.moored = moored;

  // ---------------------------------------------------------------- depart
  H.depart = async function (c) {
    var s = S(), f = s.fleet;
    if (!f.ships.length) { await C.mate('제독, 배를 손에 넣지 않으면 바다에 나갈 수 없습니다.'); return; }
    var cm = R.crewMin();
    if (f.crew < Math.ceil(cm / 3) || f.crew < 5) { await C.mate('선원이 모자랍니다. 이래서는 출항할 수 없습니다!'); return; }
    if (f.crew < cm) {
      var ok0 = await C.mateAsk('제독, 선원이 모자랍니다. 이대로라면 함대의 속도가 늦어지지만, 괜찮으십니까?', [{ label: '그대로 출항', value: true }, { label: '그만둔다', value: false }]);
      if (!ok0) return;
    }
    var days = Math.min(R.daysOfFood(), R.daysOfWater());
    if (days < 2) { await C.mate('이것만으로는 보급 물자가 모자랍니다!'); return; }
    if (R.skill('nav') === 0) await C.mate('제독, 우리 함대에는 항해술을 아는 사람이 없습니다. 항해가 더뎌질 테니 좋은 항해사를 구하십시오.');
    var txt = days >= 40 ? '준비 만반입니다. 언제라도 출항할 수 있습니다! 출항하겠습니까?' : days + '일 정도 항해할 수 있다고 생각합니다. 출항하겠습니까?';
    var dests = autoDests(c), autoTo = null;
    var go = await C.mateAsk(txt, [{ label: '출항한다', value: true },
      { label: dests.length ? '자동항해로 출항한다 (목적지를 고른다)' : '자동항해로 출항한다 — 이 항구에서 익힌 항로가 없다', value: 'auto', icon: 'anchor', dis: !dests.length },
      { label: '그만둔다', value: false }]);
    if (go === 'auto') {
      if (!dests.length) return;
      autoTo = await pickAutoDest(c, dests, days);
      if (autoTo == null) return;
    } else if (!go) return;
    if (s.player.wife && c.id === (R.seat ? R.seat() : s.player.home)) await UI.say(s.player.wifeAboard   // 아내가 배에 함께 탔다면 배웅이 아니라 함께 떠나는 말 (2026-10-21)
      ? U.pick(['자, 가요! 집은 이웃 아주머니께 부탁해 뒀어요.', '이번엔 어디까지 데려가 줄 거예요? 저도 해도 볼 줄 알아요.', '바다 냄새가 벌써 좋네요. 출항해요, 당신.'])
      : U.pick(['부디, 무사히 돌아 오세요.', '꼭 돌아오세요.', '엉뚱한 짓은 하지 말아요. 기다리고 있을 테니.']), G.Family ? G.Family.wifeSpeaker() : {});
    s.flags.departed = true;
    if (c.id === s.player.home) s.circ = { cum: 0, from: c.id };
    await UI.fade(function () { G.Game.go('sea', autoTo != null ? { depart: c.id, autoTo: autoTo } : { depart: c.id }); });
  };
  /** 이 항구에서 자동항해로 곧장 갈 수 있는 항구 (익힌 항로 — G.Routes), 가까운 순 */
  function autoDests(c) {
    if (!G.Routes) return [];
    return G.Routes.reachable(c.id)   // 곧장 오간 항구 + 이어진 항로망의 항구 (js/systems/routes.js — 대항해시대 4처럼)
      .map(function (id) { var o = G.CITY_DATA[id]; return { c: o, days: G.Routes.days(c.id, id) }; })
      .filter(function (x) { return x.c && x.c.port && R.cityExists(x.c); })
      .sort(function (x, y) { return (x.days || 999) - (y.days || 999); });
  }
  H.autoDests = autoDests;
  /* 자동항해 목적지 고르기 (2026-10-20 사용자 요청)
     · 항구마다 이 항구에서 본 방향(북동쪽 …)과 날수
     · 갈 수 있는 항구가 10곳을 넘으면: 즐겨찾기 → 가까운 항구 5곳 → 나머지는 지역(이베리아·서지중해·흑해 …)별로 묶어 눌러서 펼친다
       지역 묶음이 10개가 되면 대륙(유럽·중동·동남아시아·동아시아 …)으로 묶는다. 지역·대륙은 가까운 곳부터, 가장 가까운 묶음이 8곳 이하면 펼친 채로
     · ☆을 누르면 즐겨찾기 (최대 10곳, s.autoFav = [도시 id]) — 즐겨찾기는 늘 맨 위 */
  var FAV_MAX = 10, NEAR_N = 5, GROUP_FROM = 10, AREA_MAX = 10;
  // 지역 → 대륙
  var CONT = {
    '이베리아': '유럽', '대서양 섬': '유럽', '프랑스 서해안': '유럽', '브리튼·아일랜드': '유럽', '북해·저지대': '유럽', '발트해·스칸디나비아': '유럽',
    '서지중해·이탈리아': '유럽', '동지중해': '유럽', '흑해': '유럽',
    '마그레브': '중동·북아프리카', '레반트·이집트': '중동·북아프리카', '홍해·아덴': '중동·북아프리카', '페르시아만·오만': '중동·북아프리카',
    '서아프리카': '아프리카', '남아프리카': '아프리카', '동아프리카': '아프리카',
    '인도 서해안': '인도', '실론·벵골만': '인도',
    '인도차이나·시암': '동남아시아', '말라카·수마트라': '동남아시아', '향료제도·자와': '동남아시아',
    '중국 남부': '동아시아', '중국 북부': '동아시아', '조선': '동아시아', '일본': '동아시아', '시베리아': '동아시아',
    '오세아니아': '오세아니아',
    '누벨프랑스': '북아메리카', '북아메리카 동해안': '북아메리카', '북아메리카 서해안': '북아메리카', '카리브해·누에바 에스파냐': '북아메리카',
    '브라질·라플라타': '남아메리카', '남아메리카 태평양': '남아메리카'
  };
  /** 항구의 지역 (자동항해 목적지 묶음) */
  function areaOf(c) {
    var la = c.lat, lo = c.lon;
    switch (c.region) {
      case 0: return lo < -12 ? '대서양 섬' : '이베리아';
      case 1: return (lo >= 10.5 && la >= 53.8) || la >= 58 ? '발트해·스칸디나비아' : lo < 1.8 && la >= 50.3 ? '브리튼·아일랜드' : la < 50.3 ? '프랑스 서해안' : '북해·저지대';
      case 2: return lo > 27.4 && la > 41.05 ? '흑해' : lo < 16 && la < 37 ? '마그레브' : lo >= 19 ? '동지중해' : '서지중해·이탈리아';
      case 3: return la > 30 ? '마그레브' : lo < 25 && la > -17 ? '서아프리카' : lo < 25 ? '남아프리카' : '동아프리카';
      case 4: return la > 29 && lo < 40 ? '레반트·이집트' : lo < 46 ? '홍해·아덴' : '페르시아만·오만';
      case 5: return lo < 79 ? '인도 서해안' : '실론·벵골만';
      case 6: return lo >= 124.5 && la >= 33 ? '조선' : la < 27 ? '중국 남부' : '중국 북부';
      case 7: return '시베리아';
      case 8: return la < -10 && lo > 140 ? '오세아니아' : la >= 8 && lo < 111 ? '인도차이나·시암' : lo < 107 ? '말라카·수마트라' : '향료제도·자와';
      case 9: return '일본';
      case 10:
        if (lo < -115) return '북아메리카 서해안';
        if (la >= 44) return '누벨프랑스';
        if (la >= 29) return '북아메리카 동해안';
        if (la >= 8 && lo > -101 && lo < -59) return '카리브해·누에바 에스파냐';
        if (lo < -69 && la < 8) return '남아메리카 태평양';
        return '브라질·라플라타';
    }
    return (G.REGIONS && G.REGIONS[c.region]) || '그 밖';
  }
  H.areaOf = areaOf;
  H.contOf = function (c) { var a = areaOf(c); return CONT[a] || a; };
  var DIRS = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  /** a에서 본 b의 방향 (대권 첫 방위, 8방위) */
  function dirName(a, b) {
    var r = Math.PI / 180, la1 = a.lat * r, la2 = b.lat * r, dl = (b.lon - a.lon) * r;
    var y = Math.sin(dl) * Math.cos(la2), x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dl);
    var brg = (Math.atan2(y, x) / r + 360) % 360;
    return DIRS[Math.round(brg / 45) % 8];
  }
  H.dirName = dirName;
  function favs() { var s = S(); return s.autoFav || (s.autoFav = []); }
  H.favs = favs;
  /** 즐겨찾기 넣기·빼기 → true(넣음) · false(뺌) · null(10곳이 다 참) */
  H.toggleFav = function (id) {
    var f = favs(), i = f.indexOf(id);
    if (i >= 0) { f.splice(i, 1); return false; }
    if (f.length >= FAV_MAX) return null;
    f.push(id); return true;
  };
  /** 출항하면서 자동항해할 항구를 고른다 → 도시 id (그만두면 null). 보급이 모자라 보이면 한 번 더 묻는다 */
  async function pickAutoDest(c, dests, days) {
    var open = {}, opened0 = false;   // 펼친 지역 (처음에는 가장 가까운 묶음을 펼쳐 둔다)
    var grouped = dests.length > GROUP_FROM;
    var win = UI.window({ title: '자동항해 — 어디로 갈까요?', icon: 'anchor', width: 680,
      html: '<div style="font-size:17px;margin-bottom:8px;line-height:1.45">익힌 항로의 항구입니다. 고르면 그 항구까지 뱃길을 찾아 ×' + ((G.FX && G.FX.autoSailSpeed) || 4) + ' 배속으로 가서 입항합니다(방향키·바다를 누르면 손으로 몬다). 실은 보급: 약 ' + days + '일분.' +
        '<br><span class="muted" style="font-size:15px">방향·날수는 이 항구에서 본 것 · ☆을 누르면 즐겨찾기 (' + FAV_MAX + '곳까지 · 맨 위에)</span></div><div class="choices autodest" style="max-height:450px;overflow-y:auto;padding-right:4px"></div>' });
    var box = win.content.querySelector('.autodest');
    function row(x) {
      var fav = favs().indexOf(x.c.id) >= 0, short = x.days != null && x.days > days, rt = G.Routes.get(c.id, x.c.id);
      var d = U.el('div', 'choice', G.icon('anchor') + '<span>' + U.esc(x.c.name) + ' <small class="muted">' + U.esc(areaOf(x.c) + (R.cityOwner(x.c) ? ' · ' + R.cityOwner(x.c) : '')) + '</small></span>' +
        '<span class="r">' + dirName(c, x.c) + '쪽' + (x.days != null ? ' · 약 ' + x.days + '일' : '') + (short ? ' · <span class="warn-text">보급 모자람</span>' : '') + '</span>' +
        '<span class="fav-star' + (fav ? ' on' : '') + '" title="' + (fav ? '즐겨찾기에서 뺀다' : '즐겨찾기') + '">' + (fav ? '★' : '☆') + '</span>');
      d.title = G.Routes.label(c.id, x.c.id) + (rt && rt.best ? ' · 가장 빨랐던 항해 ' + rt.best + '일' : '');
      d.onclick = function (e) {
        if (e.target.classList.contains('fav-star')) {
          e.stopPropagation();
          var r0 = H.toggleFav(x.c.id);
          if (r0 === null) UI.toast('즐겨찾기는 ' + FAV_MAX + '곳까지입니다. 하나를 빼고 넣으세요.', 'star', 3200);
          draw(); return;
        }
        win.close(x.c.id);
      };
      return d;
    }
    function head(text, n, key) {
      var h = U.el('div', key ? 'choice autodest-group' : 'autodest-head', (key ? '<span class="tri">' + (open[key] ? '▾' : '▸') + '</span>' : '') + '<span>' + text + '</span>' + (n != null ? '<span class="r">' + n + '곳</span>' : ''));
      if (key) h.onclick = function () { open[key] = !open[key]; draw(); };
      return h;
    }
    function draw() {
      var top = box.scrollTop; box.innerHTML = '';
      var fv = favs(), favRows = dests.filter(function (x) { return fv.indexOf(x.c.id) >= 0; });
      var rest = dests.filter(function (x) { return fv.indexOf(x.c.id) < 0; });
      if (!grouped) {
        if (favRows.length) { box.appendChild(head('★ 즐겨찾기')); favRows.forEach(function (x) { box.appendChild(row(x)); }); box.appendChild(head('그 밖의 항구')); }
        rest.forEach(function (x) { box.appendChild(row(x)); });
      } else {
        if (favRows.length) { box.appendChild(head('★ 즐겨찾기', favRows.length)); favRows.forEach(function (x) { box.appendChild(row(x)); }); }
        var near = rest.slice(0, NEAR_N), far = rest.slice(NEAR_N);
        if (near.length) { box.appendChild(head('가까운 항구', near.length)); near.forEach(function (x) { box.appendChild(row(x)); }); }
        // 지역별로 묶고, 지역이 10개가 되면 대륙별로 — dests는 가까운 순이라 가까운 묶음이 먼저 온다
        var byArea = far.map(function (x) { return areaOf(x.c); }), nArea = byArea.filter(function (a, i) { return byArea.indexOf(a) === i; }).length;
        var cont = nArea >= AREA_MAX, groups = {}, order = [];
        far.forEach(function (x, i) { var k = cont ? (CONT[byArea[i]] || byArea[i]) : byArea[i]; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(x); });
        if (order.length && !opened0) { opened0 = true; if (groups[order[0]].length <= 8) open[order[0]] = true; }   // 가장 가까운 묶음이 작으면 펼쳐 둔다
        if (order.length) box.appendChild(head(cont ? '대륙별 항구 <small class="muted">(가까운 대륙부터)</small>' : '지역별 항구 <small class="muted">(가까운 지역부터)</small>'));
        order.forEach(function (k) {
          var g = groups[k], d0 = g[0];
          box.appendChild(head(U.esc(k) + ' <small class="muted">— ' + dirName(c, d0.c) + '쪽' + (d0.days != null ? ' · 약 ' + d0.days + '일부터' : '') + '</small>', g.length, k));
          if (open[k]) g.forEach(function (x) { var r1 = row(x); r1.classList.add('autodest-sub'); box.appendChild(r1); });
        });
      }
      box.scrollTop = top;
      var first = box.querySelector('.choice:not(.dis)'); if (first && !box.querySelector('.kbd-focus')) first.classList.add('kbd-focus');
    }
    draw();
    var v = await win.result;
    if (v == null) return null;
    var d = dests.filter(function (x) { return x.c.id === v; })[0];
    if (d && d.days != null && d.days > days) {
      var ok = await C.mateAsk('제독, ' + d.c.name + '까지는 ' + d.days + '일쯤 걸리는데 식량·물은 ' + days + '일분뿐입니다. 그대로 떠나시겠습니까?', [{ label: '그대로 출항', value: true }, { label: '그만둔다', value: false }]);
      if (!ok) return null;
    }
    return v;
  }
  H.pickAutoDest = pickAutoDest;

  // ---------------------------------------------------------------- 출항 준비 (선원·수리·보급을 한 번에)
  function prepPlan(c, days) {
    var s = S(), f = s.fleet;
    var cm = R.crewMin(), cx = R.crewMax();
    var crewTo = Math.min(cx, Math.max(f.crew, cm + Math.min(4, cx - cm)));
    var hire = Math.max(0, crewTo - f.crew), hireCost = hire * R.hireCost(c);
    var yard = R.facilities(c).shipyard;
    var broken = f.ships.filter(function (sh) { return sh.hp < sh.maxHp; });
    var repCost = yard ? U.sum(broken, C.B.shipyard.repairCost) : 0;
    var use = R.dailyUse(crewTo), price = R.supplyCost(c);
    // 자재: 배마다 3통 + 6통을 채워 둔다 (바다 위 수리용)
    var matTo = Math.max(f.mat || 0, 6 + f.ships.length * 3), needM = Math.ceil(matTo - (f.mat || 0));
    var room = R.supplyRoom() - matTo;
    var maxDays = Math.max(0, Math.floor(room / (use * 2)));
    var maxEmpty = Math.max(0, Math.floor((R.fleetCap() - (G.Quest ? G.Quest.load() : 0) - matTo) / (use * 2)));   // 짐이 없을 때
    var d = Math.min(days, maxDays);
    var needF = Math.max(0, d * use - f.food), needW = Math.max(0, d * use - f.water);
    var supCost = Math.ceil(needF) * price + Math.ceil(needW) * R.waterCost(c) + needM * R.matCost(c);
    return { crewTo: crewTo, hire: hire, hireCost: hireCost, yard: yard, broken: broken, repCost: repCost, matTo: matTo, needM: needM,
      days: d, maxDays: maxDays, maxEmpty: maxEmpty, cargo: R.cargoQty(), use: use, supCost: supCost, total: hireCost + repCost + supCost };
  }
  H.prepNote = function (c) {
    var s = S(), f = s.fleet; if (!f.ships.length) return '';
    var lacks = [];
    if (f.crew < R.crewMin()) lacks.push('선원');
    if (Math.min(R.daysOfFood(), R.daysOfWater()) < 20) lacks.push('보급');
    if (R.facilities(c).shipyard && f.ships.some(function (sh) { return sh.hp < sh.maxHp * 0.9; })) lacks.push('수리');
    return lacks.length ? lacks.join('·') + ' 필요' : '준비됨';
  };
  /** 이 항구에서 자동항해로 갈 수 있는 곳과 곧 열릴 항로 */
  function routesFrom(c) {
    if (!G.Routes) return '';
    var mine = G.Routes.list().filter(function (r) { return r.a === c.id || r.b === c.id; });
    if (!mine.length) return '<div class="plan-note" style="margin-bottom:8px">이 항구에서 자동항해로 갈 수 있는 곳이 아직 없습니다. 이 항구에서 출항해 다른 항구에 곧장 입항하면(또는 그 반대) 두 항구 사이의 자동항해가 열립니다.</div>';
    var other = function (r) { return G.CITY_DATA[r.a === c.id ? r.b : r.a].name; };
    var open = mine.filter(function (r) { return r.open; }).map(other), soon = mine.filter(function (r) { return !r.open; }).map(function (r) { return other(r) + ' ' + r.n + '/' + r.need; });
    var net = G.Routes.reachable(c.id).filter(function (id) { return !G.Routes.direct(c.id, id) && G.CITY_DATA[id].port && R.cityExists(G.CITY_DATA[id]); }).map(function (id) { return G.CITY_DATA[id].name; });
    return '<div class="plan-note" style="margin-bottom:8px">' + (open.length ? '자동항해: <b>' + open.join('·') + '</b>' : '자동항해로 갈 수 있는 곳 없음') +
      (net.length ? ' · 이어진 항로망으로: ' + net.slice(0, 12).join('·') + (net.length > 12 ? ' 외 ' + (net.length - 12) + '곳' : '') : '') + (soon.length ? ' · 익히는 중: ' + soon.join(', ') : '') + '</div>';
  }
  /** 계절풍 바다 연안 항구: 지금 부는 계절풍과 바뀌는 날 */
  function monsoonNote(c) {
    var n = G.Monsoon ? G.Monsoon.portNote(c) : null;
    return n ? '<div class="plan-note" style="margin-bottom:8px">' + G.icon('wind') + '<b>계절풍</b> — ' + U.esc(n.text) + '</div>' : '';
  }
  H.monsoonNote = monsoonNote;
  /** 라임 없이 오래 바다에 있으면 괴혈병 — 한 번에 실을 수 있는 날수가 번지는 날을 넘을 때만 한 줄 */
  function scurvyNote(c, probe, plan) {
    if (plan || !G.Scenes.sea.scurvyOnset || G.Plan.limes() > 0) return '';
    var onset = G.Scenes.sea.scurvyOnset(); if (probe.maxDays <= onset) return '';
    var here = C.B.market && R.facilities(c).market && C.B.market.stock(c).some(function (it) { return it.id === 'lime'; });
    return '<div class="plan-note" style="margin-bottom:8px">' + G.icon('drop') + '라임 절임 없이 바다에 <b>' + onset + '일</b> 넘게 있으면 괴혈병이 번집니다. ' + (here ? '이 도시 시장에서 팝니다.' : '이베리아·지중해·동아프리카·중근동·인도의 시장에서 팝니다.') + '</div>';
  }
  /** 싣고 있는 교역품 때문에 식량·물을 덜 싣게 되면 알려 준다 */
  function cargoNote(probe) {
    if (!probe.cargo || probe.maxEmpty - probe.maxDays < 3) return '';
    return '<div class="plan-note" style="margin-bottom:8px">' + G.icon('sack') + '교역품 <b>' + U.num(probe.cargo) + '통</b>이 짐칸을 차지해 식량·물은 최대 <b>' + probe.maxDays + '일분</b>까지 실을 수 있습니다. (짐이 없으면 ' + probe.maxEmpty + '일분)</div>';
  }
  /** 원정 계획에 이미 뱃길의 계절풍 안내가 들어가면 항구 안내는 겹치므로 뺀다 */
  function planWind(plan) { return !!(plan && G.Monsoon && plan.from && plan.goal && G.Monsoon.advice(plan.from, plan.goal)); }
  H.prep = async function (c) {
    var s = S(), f = s.fleet;
    if (!f.ships.length) { await C.mate('제독, 배가 없으면 출항 준비도 할 수 없습니다.'); return; }
    var last = s.lastSupply || 40;
    var probe = prepPlan(c, 9999);
    if (probe.maxDays < 2) { await C.mate('짐칸이 꽉 차서 식량과 물을 실을 자리가 없습니다. 짐을 먼저 파십시오.'); return; }
    // 계약이 있으면 원정 계획(왕복 일수·기한·보급)을 함께 보여 준다
    var plan = G.Plan ? G.Plan.forContract() : null;
    var quick = [{ label: '20일', value: Math.min(probe.maxDays, 20) }, { label: '40일', value: Math.min(probe.maxDays, 40) }, { label: '60일', value: Math.min(probe.maxDays, 60) }, { label: '최대', value: probe.maxDays }];
    if (plan) quick.unshift({ label: '목표까지 ' + Math.min(probe.maxDays, plan.oneWaySafe) + '일', value: Math.min(probe.maxDays, plan.oneWaySafe) }, { label: '왕복 ' + Math.min(probe.maxDays, plan.need) + '일', value: Math.min(probe.maxDays, plan.need) });
    var d = await UI.number({
      title: '출항 준비', width: plan ? 720 : 560,
      text: (plan ? G.Plan.html(plan, probe.maxDays) : '') + (planWind(plan) ? '' : monsoonNote(c)) + cargoNote(probe) + scurvyNote(c, probe, plan) + routesFrom(c) + '부관이 선원을 채우고' + (probe.yard ? ' 배를 고치고' : '') + ' 식량·물과 수리 자재(' + probe.matTo + '통까지)를 싣습니다. 따로 정하려면 항구의 「보급」을 쓰십시오. 며칠 항해할 만큼 준비할까요?',
      min: 5, max: probe.maxDays, value: Math.min(probe.maxDays, plan ? Math.max(20, plan.need) : Math.max(20, last)), unit: '일분',
      quick: quick,
      info: function (v) {
        var pl = prepPlan(c, v);
        return (pl.hire ? '선원 ' + pl.hire + '명 고용 ' + U.num(pl.hireCost) + '닢 · ' : '') +
          (pl.repCost ? '수리 ' + pl.broken.length + '척 ' + U.num(pl.repCost) + '닢 · ' : (!pl.yard && f.ships.some(function (sh) { return sh.hp < sh.maxHp; }) ? '<span class="warn-text">이 도시엔 조선소가 없어 수리 불가</span> · ' : '')) +
          '보급 ' + U.num(pl.supCost) + '닢<br>합계 <b>금화 ' + U.num(pl.total) + '닢</b>' + (pl.total > s.player.gold ? ' <span class="warn-text">(소지금 모자람)</span>' : '');
      }
    });
    if (!d) return;
    var pl = prepPlan(c, d);
    if (pl.total > s.player.gold) { await C.mate('제독, 금화가 ' + U.num(pl.total - s.player.gold) + '닢 모자랍니다. 날수를 줄이십시오.'); return; }
    s.player.gold -= pl.total;
    if (pl.hire) { f.crew += pl.hire; f.discipline = Math.max(30, f.discipline - pl.hire * 0.2); }
    if (pl.repCost) pl.broken.forEach(function (sh) { sh.hp = sh.maxHp; });
    var use = R.dailyUse();
    f.food = Math.max(f.food, pl.days * use); f.water = Math.max(f.water, pl.days * use); f.mat = Math.max(f.mat || 0, pl.matTo);
    s.lastSupply = d;
    G.Game.refreshHud();
    var go = await C.mateAsk('준비를 마쳤습니다! ' + (pl.hire ? '선원 ' + pl.hire + '명을 새로 태우고, ' : '') + (pl.repCost ? '배를 고치고, ' : '') + pl.days + '일분 식량과 물' + (pl.needM ? '·자재 ' + pl.needM + '통' : '') + '을 실었습니다. (금화 ' + U.num(pl.total) + '닢)\n바로 출항할까요?', [{ label: '출항한다', value: true }, { label: '아직', value: false }]);
    if (go) await H.depart(c);
  };

  // ---------------------------------------------------------------- 계절풍 형편 (항구 관리인에게 묻는다)
  H.monsoon = async function (c) {
    var n = G.Monsoon.portNote(c); if (!n) return;
    var keeper = C.npc('harbormaster', '항구 관리인');
    var z = n.zone, lines = [n.text];
    // 이 항구에서 자주 가는 곳들의 뱃길 형편
    var s = S(), dk = c.dock || [c.lat, c.lon], from = [dk[1], dk[0]];
    var near = s.known.map(function (id) { return G.CITY_DATA[id]; }).filter(function (x) {
      if (!x.port || x.id === c.id || !R.cityExists(x)) return false;
      var xd = x.dock || [x.lat, x.lon], d = G.Geo.dist(from[0], from[1], xd[1], xd[0]);
      return d > 6 && d < 45 && G.Monsoon.rim(x) === z;
    }).map(function (x) { var xd = x.dock || [x.lat, x.lon]; return { x: x, a: G.Monsoon.advice(from, [xd[1], xd[0]]), d: G.Geo.dist(from[0], from[1], xd[1], xd[0]) }; })
      .filter(function (o) { return o.a; }).sort(function (a, b) { return b.d - a.d; }).slice(0, 5);
    if (near.length) lines.push(near.map(function (o) { return o.x.name + ' 쪽(' + o.a.dir + ') — 지금 ' + o.a.fit + (o.a.head && o.a.fitNext !== '맞바람' ? ', ' + o.a.next.date.m + '월 ' + o.a.next.date.d + '일 무렵부터 ' + o.a.fitNext : ''); }).join('\n'));
    lines.push('바람이 바뀌기를 기다리려면 여관에 묵으면 되네. 맞바람을 거슬러 먼 바다를 건너면 몇 곱절 오래 걸려 식량이 떨어지기 십상이지.');
    await C.say(keeper, lines.join('\f'));
  };

  // ---------------------------------------------------------------- supply
  /** 보급: 식량(일분)·물(일분)·자재(통)를 따로 싣는다 (대항해시대 2식). 셋 다 짐칸을 차지한다 */
  /** 보급: 식량·물·자재를 날수(자재는 통)로 맞춘다. 늘리면 사고, 줄이면 이 항구 보급값 × G.BALANCE.supplyRefund 로 되판다 —
      교역소에서 짐을 더 실으려고 식량·물을 덜어 낼 때 (교역소에서 짐칸이 꽉 차면 여기로 불러온다: opts.need = 비우고 싶은 칸) */
  H.supply = async function (c, opts) {
    opts = opts || {};
    var s = S(), f = s.fleet;
    if (!f.ships.length) { await C.mate('배가 없으면 보급할 수 없습니다.'); return; }
    var use = R.dailyUse(), pF = R.supplyCost(c), pW = R.waterCost(c), pM = R.matCost(c);
    var refund = (G.BALANCE && G.BALANCE.supplyRefund != null) ? G.BALANCE.supplyRefund : 0.5;
    var price = { food: pF, water: pW, mat: pM };
    var room = R.supplyRoom();   // 식량·물·자재에 쓸 수 있는 칸
    var cur = { food: Math.floor(f.food / use), water: Math.floor(f.water / use), mat: Math.floor(f.mat || 0) };
    var have = { food: f.food, water: f.water, mat: f.mat || 0 };
    var want = { food: Math.max(cur.food, s.lastSupply || 30), water: Math.max(cur.water, s.lastSupply || 30), mat: Math.max(cur.mat, s.lastMat != null ? s.lastMat : 6 + f.ships.length * 3) };
    if (opts.need) want = { food: cur.food, water: cur.water, mat: cur.mat };   // 교역소에서 불렀으면 지금 그대로에서 시작
    /** 실제로 남을 양(통): 손대지 않은 것은 지금 양 그대로 */
    function amt(w, k) { return w[k] === cur[k] ? have[k] : (k === 'mat' ? w[k] : w[k] * use); }
    function load(w) { return amt(w, 'food') + amt(w, 'water') + amt(w, 'mat'); }
    function buyCost(w) { var n = 0; ['food', 'water', 'mat'].forEach(function (k) { n += Math.ceil(Math.max(0, amt(w, k) - have[k])) * price[k]; }); return n; }
    function back(w) { var n = 0; ['food', 'water', 'mat'].forEach(function (k) { n += Math.floor(Math.max(0, have[k] - amt(w, k)) * price[k] * refund); }); return n; }
    function cost(w) { return buyCost(w) - back(w); }
    function fit(w, key) {        // 짐칸·소지금에 맞게 key 쪽을 줄인다 (지금보다 늘린 만큼만)
      while (w[key] > cur[key] && (load(w) > room + 1e-6 || cost(w) > s.player.gold)) w[key]--;
    }
    ['mat', 'water', 'food'].forEach(function (k) { fit(want, k); });
    var rows = [['food', '식량', 'bread', '일분', pF + '닢/통 · 하루 ' + use.toFixed(1) + '통'], ['water', '물', 'drop', '일분', pW + '닢/통 · 하루 ' + use.toFixed(1) + '통'], ['mat', '자재', 'hammer', '통', pM + '닢/통 · 바다 위 수리에 씀 (내구 1에 ' + ((G.BALANCE && G.BALANCE.matPerHp) || 0.4) + '통)']];
    function rowMax(k) { return Math.max(cur[k], k === 'mat' ? Math.floor(room - have.food - have.water) : Math.floor((room - have.mat - (k === 'food' ? have.water : have.food)) / use)); }
    var html = (opts.need ? '<div class="woodnote" style="margin-bottom:10px">' + G.icon('ship') + ' 교역품을 더 실으려면 짐칸 <b>' + opts.need + '통</b>이 더 있어야 합니다. 식량·물·자재를 줄이면 그만큼 자리가 나고, 줄인 것은 이 항구 보급값의 ' + Math.round(refund * 100) + '%에 되팝니다.</div>' : '') +
      '<div class="muted" style="font-size:16px;margin-bottom:10px">승원 ' + f.crew + '명 · 짐칸 ' + U.num(R.fleetCap()) + '통 (교역품 ' + U.num(R.cargoQty()) + '통) — 식량·물·자재를 따로 정합니다. <b>지금보다 줄이면</b> 내려서 보급값의 ' + Math.round(refund * 100) + '%에 되팔고, 그 자리에 교역품을 더 실을 수 있습니다.</div>' +
      '<div class="sup-both" style="margin-bottom:10px;padding:8px 10px;border-radius:6px;background:rgba(90,60,30,.08)"><b>' + G.icon('calendar') + ' 식량·물 함께</b> <span class="muted" style="font-size:14px">(며칠 항해할 만큼)</span><br>' +
        '<input type="range" class="b-rng" style="width:230px;vertical-align:middle"> <input type="number" class="b-num num-in" style="width:70px"> 일분 ' +
        [10, 20, 40, 60, 90].map(function (d) { return '<button class="btn small bq" data-d="' + d + '">' + d + '일</button>'; }).join(' ') + ' <button class="btn small bq" data-d="max">최대</button></div>' +
      '<table class="tbl supply"><tr><th></th><th class="num">지금</th><th>남길 양</th><th></th></tr>' +
      rows.map(function (r) { return '<tr data-k="' + r[0] + '"><td>' + G.icon(r[2]) + ' <b>' + r[1] + '</b><div class="muted" style="font-size:13px">' + r[4] + '</div></td><td class="num">' + cur[r[0]] + r[3] + '</td>' +
        '<td><input type="range" min="0" max="' + rowMax(r[0]) + '" value="' + want[r[0]] + '" style="width:260px"> <input type="number" class="num-in" min="0" value="' + want[r[0]] + '" style="width:74px"> ' + r[3] + '</td>' +
        '<td><button class="btn small q" data-q="max">최대</button> <button class="btn small q" data-q="cur">그대로</button> <button class="btn small q" data-q="zero">비움</button></td></tr>'; }).join('') + '</table>' +
      '<div class="sup-info" style="margin-top:10px;font-size:17px"></div><div class="sup-cargo" style="margin-top:8px;font-size:15px"></div>';
    var win = UI.window({ title: '보급 — ' + c.name, icon: 'bread', width: 820, html: html, buttons: [{ label: '그만둔다', value: null }, { label: '맞춘다', value: 'ok', cls: 'navy' }] });
    var el = win.content, info = el.querySelector('.sup-info');
    // 식량·물을 같은 날수로 한꺼번에: 짐칸·소지금에 맞게 둘을 함께 줄인다 (지금보다 적게 하면 내린다)
    var bMax = Math.max(Math.min(cur.food, cur.water), Math.floor((room - have.mat) / (use * 2)));
    var bR = el.querySelector('.b-rng'), bN = el.querySelector('.b-num');
    bR.min = 0; bR.max = bMax; bN.min = 0;
    function setBoth(d) {
      d = Math.max(0, Math.floor(+d || 0));
      want.food = d; want.water = d;
      while ((load(want) > room + 1e-6 || cost(want) > s.player.gold) && (want.food > cur.food || want.water > cur.water)) {
        if (want.food > cur.food) want.food--; if (want.water > cur.water && (load(want) > room + 1e-6 || cost(want) > s.player.gold)) want.water--;
      }
      refresh();
    }
    bR.oninput = function () { setBoth(this.value); };
    bN.onchange = function () { setBoth(this.value); };
    U.$$('.bq', el).forEach(function (b) { b.onclick = function () { setBoth(b.dataset.d === 'max' ? 99999 : +b.dataset.d); }; });
    function refresh(changed) {
      if (changed) fit(want, changed);
      var both = Math.min(want.food, want.water); bR.value = both; bN.value = both;
      rows.forEach(function (r) { var tr = el.querySelector('tr[data-k="' + r[0] + '"]'); tr.querySelector('input[type=range]').max = Math.max(rowMax(r[0]), want[r[0]]); tr.querySelector('input[type=range]').value = want[r[0]]; tr.querySelector('input[type=number]').value = want[r[0]]; });
      var free = room - load(want), days = Math.min(want.food, want.water), buy = buyCost(want), got = back(want);
      // 교역품에 새로 쓸 수 있게 되는 칸 (짐칸 셈 R.used처럼 식량·물·자재는 통 단위로 올려 센다)
      var freed = ['food', 'water', 'mat'].reduce(function (n, k) { return n + Math.ceil(have[k] - 1e-9) - Math.ceil(amt(want, k) - 1e-9); }, 0);
      var gain = Math.max(0, Math.floor(R.free()) + freed) - Math.max(0, Math.floor(R.free()));
      info.innerHTML = '항해 가능 <b>' + days + '일</b> (식량 ' + want.food + '일 · 물 ' + want.water + '일) · 자재 ' + want.mat + '통' +
        (buy ? ' · 사는 값 금화 <b>' + U.num(buy) + '</b>닢' : '') + (got ? ' · 되판 값 <b class="good-text">+' + U.num(got) + '</b>닢' : '') +
        (!buy && !got ? ' · 그대로' : '') + ' · 남는 짐칸 ' + Math.max(0, Math.floor(free)) + '통' +
        (gain > 0 ? '<div class="good-text" style="font-size:15px;margin-top:4px">교역품을 ' + U.num(gain) + '통 더 실을 수 있게 됩니다' + (opts.need ? (gain >= opts.need ? ' — 넉넉합니다.' : ' — 아직 ' + (opts.need - gain) + '통 모자랍니다.') : '.') + '</div>' : '') +
        (days < 5 && (want.food < cur.food || want.water < cur.water) ? '<div class="warn-text" style="font-size:15px;margin-top:4px">식량·물이 ' + days + '일분뿐입니다. 출항 전에 다시 채우십시오.</div>' : '');
    }
    rows.forEach(function (r) {
      var tr = el.querySelector('tr[data-k="' + r[0] + '"]');
      var set = function (v) { want[r[0]] = Math.max(0, Math.floor(+v || 0)); refresh(r[0]); };
      tr.querySelector('input[type=range]').oninput = function () { set(this.value); };
      tr.querySelector('input[type=number]').onchange = function () { set(this.value); };
      U.$$('.q', tr).forEach(function (b) { b.onclick = function () { set(b.dataset.q === 'max' ? 99999 : b.dataset.q === 'zero' ? 0 : cur[r[0]]); }; });
    });
    // 교역품 식량·주류: 모자라면 바다에서 먹고 마시고, 여기서 보급품으로 옮겨 둘 수도 있다
    var cargoEl = el.querySelector('.sup-cargo');
    function cargoLine() {
      var cf = R.provisionCargo('food'), cw = R.provisionCargo('water');
      if (!cf && !cw) { cargoEl.innerHTML = '<span class="muted">곡식·어육·고기·유제품 같은 교역품은 식량으로, 맥주·포도주는 물 대신 쓸 수 있습니다(모자라면 바다에서 먹고 마십니다).</span>'; return; }
      cargoEl.innerHTML = '교역품 가운데 식량 <b>' + cf + '통</b>' + (cw ? ' · 맥주·포도주 <b>' + cw + '통</b>' : '') + ' — 바다에서 식량·물이 모자라면 먹고 마십니다. <button class="btn small mv">지금 보급품으로 옮긴다</button>';
      cargoEl.querySelector('.mv').onclick = function () {
        f.food += R.eatCargo('food', cf); f.water += R.eatCargo('water', cw);
        room = R.supplyRoom();
        have.food = f.food; have.water = f.water;
        cur.food = Math.floor(f.food / use); cur.water = Math.floor(f.water / use);
        want.food = Math.max(want.food, cur.food); want.water = Math.max(want.water, cur.water);
        rows.forEach(function (r) { var tr = el.querySelector('tr[data-k="' + r[0] + '"]'); tr.children[1].textContent = cur[r[0]] + r[3]; });
        UI.toast('교역품을 식량 ' + cf + '통' + (cw ? '·물 ' + cw + '통' : '') + '으로 옮겼다.', 'bread');
        cargoLine(); refresh();
      };
    }
    cargoLine();
    refresh();
    var v = await win.result;
    if (v !== 'ok') return;
    var buy = buyCost(want), got = back(want), pay = buy - got;
    if (!buy && !got && want.food === cur.food && want.water === cur.water && want.mat === cur.mat) return;
    if (pay > s.player.gold) { await C.mate('소지금이 모자랍니다.'); return; }
    var down = ['food', 'water', 'mat'].filter(function (k) { return amt(want, k) < have[k] - 1e-6; });
    s.player.gold -= pay;
    f.food = amt(want, 'food'); f.water = amt(want, 'water'); f.mat = amt(want, 'mat');
    if (!down.length || Math.min(want.food, want.water) >= 10) s.lastSupply = Math.min(want.food, want.water);   // 잠깐 덜어 낸 것은 다음 보급의 기본값으로 삼지 않는다
    s.lastMat = want.mat;
    G.Game.refreshHud();
    UI.toast('식량 ' + want.food + '일분 · 물 ' + want.water + '일분 · 자재 ' + want.mat + '통으로 맞췄다.' + (buy ? ' (산 값 금화 ' + U.num(buy) + '닢)' : '') + (got ? ' (되판 값 +' + U.num(got) + '닢)' : ''), 'bread');
    return { down: down, got: got, buy: buy };
  };

  // ---------------------------------------------------------------- fleet organisation
  H.fleet = async function (c) {
    var s = S();
    for (;;) {
      var dock = moored(c);
      R.tidyCaptains();
      var html = '<div style="font-size:16px;margin-bottom:8px" class="muted">함대에는 최대 ' + MAX_SHIPS + '척까지 편성할 수 있습니다. 맨 위의 배가 기함이고 제독이 지휘합니다. 다른 배는 동료를 선장으로 앉히고, 없으면 갑판장이 몹니다. 편성에서 뺀 배는 이 항구에 계류됩니다.</div>' +
        '<table class="tbl"><tr><th></th><th>선명</th><th>선종</th><th>선장</th><th class="num">내구력</th><th class="num">선원</th><th class="num">적재</th><th class="num">대포</th></tr>' +
        s.fleet.ships.map(function (sh, i) { return shipRow(sh, i === 0 ? '기함' : '함대'); }).join('') +
        dock.map(function (sh) { return shipRow(sh, '계류'); }).join('') + '</table>';
      var v = await UI.window({ title: '함대편성', icon: 'ship', width: 980, html: html, buttons: [
        { label: '기함 변경', value: 'flag' }, { label: '선장 임명', value: 'cap' }, { label: '선박 편입', value: 'add' }, { label: '선박 삭제', value: 'remove' }, { label: '선박 파기', value: 'scrap', cls: 'red' }, { label: '편성 종료', value: null, cls: 'navy' }] }).result;
      if (!v) break;
      if (v === 'flag') {
        if (s.fleet.ships.length < 2) { UI.toast('기함을 바꿀 배가 없습니다.', 'info'); continue; }
        var i = await pickShip('기함으로 할 배', s.fleet.ships.slice(1)); if (i == null) continue;
        var sh = s.fleet.ships.splice(i + 1, 1)[0];
        if (await UI.confirm('기함을 ' + sh.name + '호로 변경하겠습니다. 좋습니까?')) {
          // 새 기함을 맡던 선장은 옛 기함으로 옮겨 간다
          var oldFlag = s.fleet.ships[0];
          s.mates.forEach(function (m) { if (m.role === 'captain' && m.ship === sh.uid) m.ship = oldFlag.uid; });
          s.fleet.ships.unshift(sh);
          if (G.Cabins) G.Cabins.rooms();   // 부하들이 새 기함의 같은 방으로 옮겨 간다 (맞는 방이 없으면 다시 배치해야 한다)
        } else s.fleet.ships.splice(i + 1, 0, sh);
      } else if (v === 'cap') {
        if (s.fleet.ships.length < 2) { UI.toast('기함은 제독이 지휘합니다. 선장을 둘 배가 없습니다.', 'info'); continue; }
        var ci = await pickShip('선장을 둘 배', s.fleet.ships.slice(1)); if (ci == null) continue;
        var tsh = s.fleet.ships[ci + 1];
        if (!s.mates.length) { UI.toast('동료가 없습니다. 술집에서 항해사를 구하십시오.', 'people'); continue; }
        var mv = await UI.choose(tsh.name + '호의 선장', s.mates.map(function (m, k) {
          var d = G.MATE[m.id];
          return { label: d.name, right: R.roleName(m), value: k, icon: 'people', desc: '항해술 ' + R.mateSkill(m, 'nav') + ' · 포술 ' + R.mateSkill(m, 'gun') + ' · 검술 ' + R.mateSkill(m, 'sword') + ' · 조선기술 ' + R.mateSkill(m, 'ship') + ' · 무력 ' + d.st[2] };
        }).concat([{ label: '갑판장에게 맡긴다', value: -1, icon: 'people', desc: '선장이 없으면 속도 −4%, 재장전 +10%, 백병전 ×0.9' }]), { width: 640, text: '선장의 항해술은 그 배의 속도와 폭풍 피해, 포술은 포격, 검술·무력은 백병전, 조선기술은 바다 위 수리에 쓰입니다. 기함 참모(부관·항해사 등)를 선장으로 보내면 그 자리는 비거나 원래 선장이 맡습니다.' });
        if (mv == null) continue;
        if (mv === -1) { s.mates.forEach(function (m) { if (m.role === 'captain' && m.ship === tsh.uid) { m.role = 'none'; delete m.ship; } }); }
        else C.B.tavern.assign(s.mates[mv], 'cap:' + tsh.uid);
      } else if (v === 'add') {
        if (!dock.length) { UI.toast('이 항구에 계류된 배가 없습니다.', 'info'); continue; }
        if (s.fleet.ships.length >= MAX_SHIPS) { UI.toast('이 이상 편입할 수 없습니다.', 'info'); continue; }
        var j = await pickShip('편입선박 선택', dock); if (j == null) continue;
        s.fleet.ships.push(dock.splice(j, 1)[0]);
        if (G.ShipSprite) G.ShipSprite.want(G.ShipSprite.fleetTypes());
      } else if (v === 'remove') {
        if (s.fleet.ships.length < 2) { UI.toast('이 이상 삭제할 수 없습니다.', 'info'); continue; }
        var k = await pickShip('계류할 배 선택', s.fleet.ships.slice(1)); if (k == null) continue;
        var rs = s.fleet.ships[k + 1];
        if (R.used() - (R.shipCargoCap(rs)) > R.fleetCap() - R.shipCargoCap(rs) && R.used() > R.fleetCap() - R.shipCargoCap(rs)) { UI.toast('짐이 너무 많아 이 배를 뺄 수 없습니다.', 'info'); continue; }
        dock.push(s.fleet.ships.splice(k + 1, 1)[0]);
        trimCrew();
      } else if (v === 'scrap') {
        var all = s.fleet.ships.slice(1).concat(dock).filter(function (x) { return !x.loan; });   // 빌린 배는 파기할 수 없다
        if (!all.length) { UI.toast('이 이상 파기할 수 없습니다. (빌린 배는 파기할 수 없습니다)', 'info'); continue; }
        var q = await pickShip('파기할 배 선택', all); if (q == null) continue;
        var ss = all[q];
        if (!(await UI.confirm(ss.name + '호를 파기합니다. 되돌릴 수 없습니다. 좋습니까?', '파기한다', '그만둔다'))) continue;
        var fi = s.fleet.ships.indexOf(ss); if (fi >= 0) s.fleet.ships.splice(fi, 1); else dock.splice(dock.indexOf(ss), 1);
        trimCrew();
      }
    }
  };
  function trimCrew() {
    R.tidyCaptains();
    var s = S(), mx = R.crewMax();
    if (s.fleet.crew > mx) { var n = s.fleet.crew - mx; s.fleet.crew = mx; UI.toast(n + '명의 남은 선원이 해고되었습니다.', 'people'); }
    var over = R.used() - R.fleetCap();
    if (over > 0) { dumpCargo(over); }
  }
  function dumpCargo(n) {
    var f = S().fleet;
    for (var id in f.cargo) { if (n <= 0) break; var t = Math.min(n, f.cargo[id].q); f.cargo[id].q -= t; n -= t; if (!f.cargo[id].q) delete f.cargo[id]; }
    if (n > 0) { var w = Math.min(n, f.water); f.water -= w; n -= w; f.food = Math.max(0, f.food - n); }
    UI.toast('실을 곳이 없는 짐을 내렸습니다.', 'sack');
  }
  H.trimCrew = trimCrew;
  function shipRow(sh, tag) {
    var t = G.SHIP[sh.type];
    return '<tr><td><span class="tag">' + tag + '</span></td><td><b>' + U.esc(sh.name) + '</b>' + (sh.loan ? ' <small class="muted">(빌린 배)</small>' : '') + '</td><td>' + t.name + (sh.wood && G.TIMBER[sh.wood] ? ' <small class="muted">' + G.TIMBER[sh.wood].name + '</small>' : '') + '</td><td>' + (tag === '계류' ? '<span class="muted">—</span>' : U.esc(R.captainName(sh))) + '</td><td class="num">' + Math.round(sh.hp) + '/' + sh.maxHp + '</td><td class="num">' + sh.crewMin + '~' + sh.crewMax + '</td><td class="num">' + R.shipCargoCap(sh) + '</td><td class="num">' + (G.CANNON[sh.guns.type] ? G.CANNON[sh.guns.type].name + ' ' : '') + sh.guns.n + '/' + sh.ports + '</td></tr>';
  }
  function pickShip(title, list) {
    return UI.choose(title, list.map(function (sh, i) { return { label: U.esc(sh.name) + '호', right: G.SHIP[sh.type].name + ' · 내구 ' + Math.round(sh.hp) + '/' + sh.maxHp, value: i, icon: 'ship' }; }), { width: 620 });
  }
  H.pickShip = pickShip;

  // ---------------------------------------------------------------- crew
  /** 선원 수 조정: 목표 인원을 정하면 모자란 만큼 고용하고 남는 만큼 내린다 (한 번에).
      술집의 「선원을 모은다」에서 부른다 (항구 메뉴에서는 빠졌다 — 자동 플레이는 이 함수를 바로 부른다).
      탐험대가 뭍길로 들어온 도시(s.loc.via === 'land')에서는 모은 선원이 탐험대에 합류하고, 내린 선원은 탐험대에서 빠진다.
      배에 다시 태울 수 있어야 하므로 최대는 언제나 함대의 최대 승원 수다 */
  H.crew = async function (c) {
    var s = S(), f = s.fleet, cost = R.hireCost(c), cmin = R.crewMin(), cmax = R.crewMax();
    var lr = s.loc && s.loc.via === 'land' ? s.landReturn : null;   // 성문 밖에서 기다리는 탐험대
    var BAL = G.BALANCE || {}, spare = Math.min(cmax, Math.ceil(cmin * (BAL.spareWatch || 1.3)));
    var byGold = f.crew + Math.floor(s.player.gold / cost), hi = Math.min(cmax, Math.max(f.crew, byGold));
    var lo = lr ? Math.max(1, f.crew - Math.max(0, (lr.party || 0) - 1)) : 0;   // 탐험대에는 적어도 한 사람이 남는다
    var n = await UI.number({
      title: (lr ? '선원을 모은다 — 탐험대 ' + (lr.party || 0) + '명 · 선원 ' : '선원을 모은다 — 지금 ') + f.crew + '명',
      text: (lr ? '배는 바닷가에 두고 왔지만, 이 술집에서 모은 선원은 바로 탐험대에 합류합니다. 함대 전체 선원을 몇 명으로 할까요? 모자라면 모집하고(한 사람 금화 ' + cost + '닢), 남으면 탐험대에서 내보냅니다.<br>'
        : '함대 전체 선원을 몇 명으로 할까요? 모자라면 모집하고(한 사람 금화 ' + cost + '닢), 남으면 이 도시에서 내립니다.<br>') +
        '<span class="muted">최저 ' + cmin + '명(모자라면 느리고 쉽게 지침) · 교대가 넉넉한 ' + spare + '명(피로가 덜 쌓임) · 최대 ' + cmax + '명(백병전·일손). 사람이 많을수록 식량·물이 빨리 줄어듭니다.</span>',
      min: lo, max: hi, value: f.crew, unit: '명',
      quick: [{ label: '최저 ' + cmin, value: Math.min(hi, cmin) }, { label: '교대 넉넉 ' + spare, value: Math.min(hi, spare) }, { label: '최대', value: hi }, { label: '그대로', value: f.crew }],
      info: function (x) {
        var d = x - f.crew, use = R.dailyUse(x);
        var days = x > 0 ? Math.floor(Math.min(f.food, f.water) / use) : 0;
        return (d > 0 ? '모집 <b>' + d + '명</b> · 금화 <b>' + U.num(d * cost) + '</b>닢' : d < 0 ? '내림 <b>' + (-d) + '명</b>' : '그대로') +
          ' · 하루 식량·물 각 ' + use.toFixed(1) + '통 · 지금 실은 것으로 ' + days + '일' + (x < cmin ? ' <span class="warn-text">(최저 인원 모자람)</span>' : '');
      }
    });
    if (n == null || n === f.crew) return;
    if (n > f.crew) {
      var add = n - f.crew;
      if (add * cost > s.player.gold) { await C.mate('그렇게 고용할 수 있을 정도로 돈이 없습니다.'); return; }
      s.player.gold -= add * cost; f.crew = n; f.discipline = Math.max(30, f.discipline - add * 0.2);
      if (lr) lr.party = (lr.party || 0) + add;
      UI.toast('선원 ' + add + '명을 모집했다. (금화 ' + U.num(add * cost) + '닢)' + (lr ? ' 탐험대가 ' + lr.party + '명이 되었다.' : ''), 'people');
    } else {
      if (n < cmin && !(await UI.confirm('선원 수가 최저 승원 수(' + cmin + '명)를 밑돌게 됩니다. 배가 느려지고 쉽게 지칩니다. 괜찮습니까?'))) return;
      var off = f.crew - n;
      if (lr) lr.party = Math.max(1, (lr.party || 0) - off);
      UI.toast('선원 ' + off + '명을 ' + (lr ? '탐험대에서 내보냈다.' : '내렸다.'), 'people');
      f.crew = n;
    }
    G.Game.refreshHud();
  };

  // ---------------------------------------------------------------- town information
  H.townInfo = async function (c) {
    var s = S();
    var keeper = C.npc('harbormaster', '항구 관리인');
    var fee = 40 + c.size * 20;
    var regs = [], EA = G.EAST_ASIA || [], eaSubs = [];
    // 동아시아(중국·조선·일본)는 한 묶음으로 고른 뒤 나라를 고른다 (2026-10-22)
    var unk = function (fn) { return G.CITY_DATA.filter(function (x) { return fn(x) && s.known.indexOf(x.id) < 0 && R.cityExists(x); }).length; };
    G.REGIONS.forEach(function (r, i) {
      if (!(G.REGION_DIST[c.region][i] <= 2 || s.flags['reg' + i])) return;
      if (EA.indexOf(i) >= 0 && G.subRegion) {
        (i === 6 ? ['중국', '조선'] : ['일본']).forEach(function (sub) { eaSubs.push({ sub: sub, n: unk(function (x) { return x.region === i && G.subRegion(x) === sub; }) }); });
        return;
      }
      var unknown = unk(function (x) { return x.region === i; });
      regs.push({ label: r, right: unknown ? '미확인 ' + unknown + '곳' : '모두 앎', value: i, disabled: !unknown });
    });
    if (eaSubs.length) {
      var eaN = eaSubs.reduce(function (a, x) { return a + x.n; }, 0), at = 0;
      regs.forEach(function (x, k) { if (x.value < 6) at = k + 1; });
      regs.splice(at, 0, { label: '동아시아', right: eaN ? '미확인 ' + eaN + '곳' : '모두 앎', value: 'ea', disabled: !eaN, desc: eaSubs.map(function (x) { return x.sub; }).join(' · ') });
    }
    await C.say(keeper, '다른 마을에 대해 듣고 싶나? 그렇다면 한 건당 금화 ' + fee + '닢이네.');
    var r = await UI.choose('어느 지방의 마을?', regs, { width: 560 });
    if (r == null) return;
    var sub = null;
    if (r === 'ea') {
      sub = eaSubs.length === 1 ? eaSubs[0].sub : await UI.choose('동아시아 — 어느 나라의 마을?', eaSubs.map(function (x) { return { label: x.sub, right: x.n ? '미확인 ' + x.n + '곳' : '모두 앎', value: x.sub, disabled: !x.n }; }), { width: 520 });
      if (sub == null) return;
    }
    var list = G.CITY_DATA.filter(function (x) { return (sub ? G.subRegion(x) === sub : x.region === r) && s.known.indexOf(x.id) < 0 && R.cityExists(x); });
    if (!list.length) { await C.say(keeper, '공짜로 가르쳐 줄 것은 없네.'); return; }
    var pick = await UI.choose('어느 마을에 대해 물을까?', list.map(function (x) { return { label: x.name, right: x.port ? '항구' : '내륙', value: x.id }; }), { width: 520 });
    if (pick == null) return;
    if (s.player.gold < fee) { await C.mate('소지금이 모자랍니다.'); return; }
    s.player.gold -= fee;
    var t = G.CITY_DATA[pick];
    s.known.push(t.id);
    var lat = t.lat, lon = t.lon;
    await C.say(keeper, t.name + U.j(t.name, '은/는').slice(t.name.length) + ' ' + (lat >= 0 ? '북' : '남') + '위 ' + Math.round(Math.abs(lat)) + '도, ' + (lon >= 0 ? '동' : '서') + '경 ' + Math.round(Math.abs(lon)) + '도네.' + (t.port ? '' : ' 바다에서 떨어진 내륙에 있지.'));
    UI.toast(t.name + '의 위치가 해도에 기록되었다.', 'map');
  };

  // ---------------------------------------------------------------- announce
  /** 발표할 발견을 체크해서 고른다. 「전부 발표」는 현재 목록 전체를 바로 돌려준다. */
  H.pickAnnouncements = function (list) {
    var rows = list.map(function (d) {
      var pf = G.Disc.proofItems(d.id).filter(function (it) { return !it.evidence; });
      return '<label class="choice" style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">' +
        '<input type="checkbox" data-disc="' + U.esc(d.id) + '" style="margin-top:6px;transform:scale(1.2)">' +
        '<span style="flex:1"><b>' + U.esc(d.name) + '</b>' +
        (G.Disc.isLate(d.id) ? ' <span class="tag">늦은 발표 · 명성 절반</span>' : '') +
        (G.Disc.needsProof(d) && !G.Disc.hasProof(d.id) ? ' <span class="tag">증거 없음</span>' : '') +
        (S().contract && S().contract.disc === d.id ? ' <span class="tag">후원자 계약</span>' : '') +
        '<small class="muted" style="display:block">' + U.esc(G.DISC_CATS[d.cat] + ' · ' + d.desc) +
        (pf.length ? ' · 유물: ' + pf.map(function (it) { return R.itemName(it); }).join(', ') : '') + '</small></span></label>';
    }).join('');
    var picked = [];
    var win = UI.window({ title: '발표할 발견물 — 복수 선택', icon: 'flag', width: 760,
      html: '<div class="muted" style="margin-bottom:10px">여러 발견을 골라 한꺼번에 발표할 수 있습니다. 후원자 계약이 든 발견은 계약이 깨집니다.</div>' +
        '<div style="margin-bottom:10px"><button class="btn small all-toggle">모두 선택 / 해제</button> <span class="pick-count muted">0건 선택</span></div>' +
        '<div style="max-height:52vh;overflow:auto">' + rows + '</div>',
      buttons: [{ label: '취소', value: null }, { label: '선택한 발견 발표', value: 'selected', cls: 'navy', onClick: function () {
        picked = Array.prototype.slice.call(win.content.querySelectorAll('input[data-disc]:checked')).map(function (x) { return x.getAttribute('data-disc'); });
        if (!picked.length) { UI.toast('발표할 발견을 하나 이상 고르십시오.', 'flag'); return false; }
      } }, { label: '전부 발표', value: 'all', icon: 'flag' }]
    });
    function update() { var n = win.content.querySelectorAll('input[data-disc]:checked').length; win.content.querySelector('.pick-count').textContent = n + '건 선택'; }
    Array.prototype.forEach.call(win.content.querySelectorAll('input[data-disc]'), function (x) { x.onchange = update; });
    win.content.querySelector('.all-toggle').onclick = function () {
      var xs = Array.prototype.slice.call(win.content.querySelectorAll('input[data-disc]')), all = xs.every(function (x) { return x.checked; });
      xs.forEach(function (x) { x.checked = !all; }); update();
    };
    return win.result.then(function (v) { return v === 'all' ? list.map(function (d) { return d.id; }) : v === 'selected' ? picked : null; });
  };

  /** 선택한 발견들을 발표한다. 단건은 기존 발표 연출을, 복수는 한 장의 결과 요약을 쓴다. */
  H.announceSelected = async function (c, ids) {
    var s = S(), many = ids.length > 1;
    if (!ids.length) return { count: 0, fame: 0 };
    var contracted = s.contract && ids.indexOf(s.contract.disc) >= 0;
    if (contracted && !(await UI.confirm('고른 발견 가운데 후원자와 계약한 발견이 있습니다. 함께 발표하면 그 계약은 실패로 처리됩니다. 그래도 발표하겠습니까?'))) return { count: 0, fame: 0, canceled: true };
    var broke = contracted ? G.SPONSOR[s.contract.sponsor] : null, total = 0, kept = [], noProof = [], late = [], big = null;
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], d = G.DISC[id];
      if (!d || G.Disc.unreported().indexOf(d) < 0) continue;
      var pitch = !many && G.Pitch ? await G.Pitch.run({ d: d, sp: null, mode: 'announce', city: c }) : null;
      var fame = G.Disc.announce(id, pitch ? pitch.fk : 1), la = G.Disc.lastAnnounce || {};
      if (pitch) await pitch.close();
      total += fame;
      if (G.Disc.isLate(id)) late.push(d.name);
      if (la.noProof) noProof.push(d.name);
      if (la.kept && la.kept.length) kept = kept.concat(la.kept);
      if (!big && G.Fest && G.Fest.big(d) && !G.Disc.isLate(id)) big = d;
      if (G.Names) await G.Names.onReport(d);
    }
    if (broke) await G.Sponsor.breakContract(broke, 'announce');
    else if (contracted && s.contract) s.contract = null;
    if (many) {
      await UI.alert('<b>' + ids.length + '건</b>의 발견을 한꺼번에 발표했다!<br>명성 +<b>' + total + '</b>' +
        (late.length ? '<br><span class="muted">늦은 발표: ' + late.map(U.esc).join(', ') + '</span>' : '') +
        (noProof.length ? '<br><span class="muted">증거가 없어 명성이 줄어든 발견: ' + noProof.map(U.esc).join(', ') + '</span>' : '') +
        (kept.length ? '<br><br>발표한 유물 ' + kept.map(function (it) { return '<b>' + U.esc(R.itemName(it)) + '</b>'; }).join(', ') + U.jx(R.itemName(kept[kept.length - 1]), '은/는') + ' 이제 제독의 것이다.' : ''), '일괄 발표');
    } else {
      var only = G.DISC[ids[0]], last = G.Disc.lastAnnounce || {};
      await UI.alert('「' + only.name + '」의 발견을 발표했다!<br>명성 +' + total + (G.Disc.isLate(only.id) ? '<br><span class="muted">경쟁자가 먼저 발표한 뒤라 명성은 절반</span>' : '') +
        (last.noProof ? '<br><span class="muted">증거를 보이지 못해 사람들이 반신반의한다 (명성 8할)</span>' : '') +
        (last.kept && last.kept.length ? '<br><br>' + last.kept.map(function (it) { return '<b>' + U.esc(R.itemName(it)) + '</b>'; }).join(', ') + U.jx(R.itemName(last.kept[last.kept.length - 1]), '은/는') + ' 이제 제독의 것이다.<br><span class="muted">시장에 팔아 자금을 마련하거나, 장비하고 선물할 수 있다.</span>' : ''), '발표');
    }
    if (big) await G.Fest.begin(c.id, big);
    return { count: ids.length, fame: total, kept: kept.length };
  };

  H.announce = async function (c) {
    var list = G.Disc.unreported();
    if (!list.length) { await C.mate('발표할 발견이 없습니다. 후원자와 계약한 발견은 후원자에게 보고하십시오.'); return; }
    var ids = list.length === 1 ? [list[0].id] : await H.pickAnnouncements(list);
    if (!ids || !ids.length) return;
    await H.announceSelected(c, ids);
  };
})(window.G = window.G || {});
