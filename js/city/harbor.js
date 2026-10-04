/* 항구: 출항, 보급, 함대편성, 선원편성, 마을정보, 발표 */
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
      { label: '선원 수 조정', icon: 'people', sub: s.fleet.crew + '명 / ' + R.crewMin() + '~' + R.crewMax(), onClick: function () { return H.crew(c); } },
      { label: '마을정보', icon: 'map', onClick: function () { return H.townInfo(c); } },
      { label: '발표', icon: 'flag', sub: unrep ? unrep + '건' : '', dim: !unrep, onClick: function () { return H.announce(c); } }
    ];
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
    var go = await C.mateAsk(txt, [{ label: '출항한다', value: true }, { label: '그만둔다', value: false }]);
    if (!go) return;
    if (s.player.wife && c.id === s.player.home) await UI.say(U.pick(['부디, 무사히 돌아 오세요.', '꼭 돌아오세요.', '엉뚱한 짓은 하지 말아요. 기다리고 있을 테니.']), G.Family ? G.Family.wifeSpeaker() : {});
    s.flags.departed = true;
    if (c.id === s.player.home) s.circ = { cum: 0, from: c.id };
    await UI.fade(function () { G.Game.go('sea', { depart: c.id }); });
  };

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
    return '<div class="plan-note" style="margin-bottom:8px">' + (open.length ? '자동항해: <b>' + open.join('·') + '</b>' : '자동항해로 갈 수 있는 곳 없음') + (soon.length ? ' · 익히는 중: ' + soon.join(', ') : '') + '</div>';
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
  H.supply = async function (c) {
    var s = S(), f = s.fleet;
    if (!f.ships.length) { await C.mate('배가 없으면 보급할 수 없습니다.'); return; }
    var use = R.dailyUse(), pF = R.supplyCost(c), pW = R.waterCost(c), pM = R.matCost(c);
    var room = R.supplyRoom();   // 식량·물·자재에 쓸 수 있는 칸
    var cur = { food: Math.floor(f.food / use), water: Math.floor(f.water / use), mat: Math.floor(f.mat || 0) };
    var want = { food: Math.max(cur.food, s.lastSupply || 30), water: Math.max(cur.water, s.lastSupply || 30), mat: Math.max(cur.mat, s.lastMat != null ? s.lastMat : 6 + f.ships.length * 3) };
    function load(w) { return Math.max(f.food, w.food * use) + Math.max(f.water, w.water * use) + Math.max(f.mat || 0, w.mat); }
    function cost(w) { return Math.ceil(Math.max(0, w.food * use - f.food)) * pF + Math.ceil(Math.max(0, w.water * use - f.water)) * pW + Math.ceil(Math.max(0, w.mat - (f.mat || 0))) * pM; }
    function fit(w, key) {        // 짐칸·소지금에 맞게 key 쪽을 줄인다
      while (w[key] > cur[key] && (load(w) > room + 1e-6 || cost(w) > s.player.gold)) w[key]--;
    }
    ['mat', 'water', 'food'].forEach(function (k) { fit(want, k); });
    var rows = [['food', '식량', 'bread', '일분', pF + '닢/통 · 하루 ' + use.toFixed(1) + '통'], ['water', '물', 'drop', '일분', pW + '닢/통 · 하루 ' + use.toFixed(1) + '통'], ['mat', '자재', 'hammer', '통', pM + '닢/통 · 바다 위 수리에 씀 (내구 1에 ' + ((G.BALANCE && G.BALANCE.matPerHp) || 0.4) + '통)']];
    var html = '<div class="muted" style="font-size:16px;margin-bottom:10px">승원 ' + f.crew + '명 · 짐칸 ' + U.num(R.fleetCap()) + '통 (교역품 ' + U.num(R.cargoQty()) + '통) — 식량·물·자재를 따로 정합니다.</div>' +
      '<div class="sup-both" style="margin-bottom:10px;padding:8px 10px;border-radius:6px;background:rgba(90,60,30,.08)"><b>' + G.icon('calendar') + ' 식량·물 함께</b> <span class="muted" style="font-size:14px">(며칠 항해할 만큼)</span><br>' +
        '<input type="range" class="b-rng" style="width:230px;vertical-align:middle"> <input type="number" class="b-num num-in" style="width:70px"> 일분 ' +
        [20, 40, 60, 90].map(function (d) { return '<button class="btn small bq" data-d="' + d + '">' + d + '일</button>'; }).join(' ') + ' <button class="btn small bq" data-d="max">최대</button></div>' +
      '<table class="tbl supply"><tr><th></th><th class="num">지금</th><th>실을 양</th><th></th></tr>' +
      rows.map(function (r) { return '<tr data-k="' + r[0] + '"><td>' + G.icon(r[2]) + ' <b>' + r[1] + '</b><div class="muted" style="font-size:13px">' + r[4] + '</div></td><td class="num">' + cur[r[0]] + r[3] + '</td>' +
        '<td><input type="range" min="' + cur[r[0]] + '" max="' + Math.max(cur[r[0]], r[0] === 'mat' ? cur.mat + Math.floor(room) : Math.floor(room / use)) + '" value="' + want[r[0]] + '" style="width:260px"> <input type="number" class="num-in" min="' + cur[r[0]] + '" value="' + want[r[0]] + '" style="width:74px"> ' + r[3] + '</td>' +
        '<td><button class="btn small q" data-q="max">최대</button> <button class="btn small q" data-q="cur">그대로</button></td></tr>'; }).join('') + '</table>' +
      '<div class="sup-info" style="margin-top:10px;font-size:17px"></div><div class="sup-cargo" style="margin-top:8px;font-size:15px"></div>';
    var win = UI.window({ title: '보급 — ' + c.name, icon: 'bread', width: 820, html: html, buttons: [{ label: '그만둔다', value: null }, { label: '싣는다', value: 'ok', cls: 'navy' }] });
    var el = win.content, info = el.querySelector('.sup-info');
    // 식량·물을 같은 날수로 한꺼번에: 짐칸·소지금에 맞게 둘을 함께 줄인다
    var bMin = Math.min(cur.food, cur.water), bMax = Math.max(bMin, Math.floor(room / (use * 2)) + bMin);
    var bR = el.querySelector('.b-rng'), bN = el.querySelector('.b-num');
    bR.min = bMin; bR.max = bMax; bN.min = bMin;
    function setBoth(d) {
      d = Math.max(bMin, Math.floor(+d || 0));
      want.food = Math.max(cur.food, d); want.water = Math.max(cur.water, d);
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
      rows.forEach(function (r) { var tr = el.querySelector('tr[data-k="' + r[0] + '"]'); tr.querySelector('input[type=range]').value = want[r[0]]; tr.querySelector('input[type=number]').value = want[r[0]]; });
      var free = room - load(want), days = Math.min(want.food, want.water);
      info.innerHTML = '항해 가능 <b>' + days + '일</b> (식량 ' + want.food + '일 · 물 ' + want.water + '일) · 자재 ' + want.mat + '통 · 비용 금화 <b>' + U.num(cost(want)) + '</b>닢 · 남는 짐칸 ' + Math.max(0, Math.floor(free)) + '통';
    }
    rows.forEach(function (r) {
      var tr = el.querySelector('tr[data-k="' + r[0] + '"]');
      var set = function (v) { want[r[0]] = Math.max(cur[r[0]], Math.floor(+v || 0)); refresh(r[0]); };
      tr.querySelector('input[type=range]').oninput = function () { set(this.value); };
      tr.querySelector('input[type=number]').onchange = function () { set(this.value); };
      U.$$('.q', tr).forEach(function (b) { b.onclick = function () { set(b.dataset.q === 'max' ? 99999 : cur[r[0]]); }; });
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
        cur.food = Math.floor(f.food / use); cur.water = Math.floor(f.water / use);
        want.food = Math.max(want.food, cur.food); want.water = Math.max(want.water, cur.water);
        rows.forEach(function (r) { var tr = el.querySelector('tr[data-k="' + r[0] + '"]'); tr.children[1].textContent = cur[r[0]] + r[3]; tr.querySelector('input[type=range]').min = cur[r[0]]; tr.querySelector('input[type=number]').min = cur[r[0]]; });
        UI.toast('교역품을 식량 ' + cf + '통' + (cw ? '·물 ' + cw + '통' : '') + '으로 옮겼다.', 'bread');
        cargoLine(); refresh();
      };
    }
    cargoLine();
    refresh();
    var v = await win.result;
    if (v !== 'ok') return;
    var pay = cost(want);
    if (pay <= 0) return;
    if (pay > s.player.gold) { await C.mate('소지금이 모자랍니다.'); return; }
    s.player.gold -= pay;
    f.food = Math.max(f.food, want.food * use); f.water = Math.max(f.water, want.water * use); f.mat = Math.max(f.mat || 0, want.mat);
    s.lastSupply = Math.min(want.food, want.water); s.lastMat = want.mat;
    G.Game.refreshHud();
    UI.toast('식량 ' + want.food + '일분 · 물 ' + want.water + '일분 · 자재 ' + want.mat + '통을 실었다. (금화 ' + U.num(pay) + '닢)', 'bread');
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
  /** 선원 수 조정: 목표 인원을 정하면 모자란 만큼 고용하고 남는 만큼 내린다 (한 번에) */
  H.crew = async function (c) {
    var s = S(), f = s.fleet, cost = R.hireCost(c), cmin = R.crewMin(), cmax = R.crewMax();
    var BAL = G.BALANCE || {}, spare = Math.min(cmax, Math.ceil(cmin * (BAL.spareWatch || 1.3)));
    var byGold = f.crew + Math.floor(s.player.gold / cost), hi = Math.min(cmax, Math.max(f.crew, byGold));
    var n = await UI.number({
      title: '선원 수 조정 — 지금 ' + f.crew + '명',
      text: '함대 전체 선원을 몇 명으로 할까요? 모자라면 모집하고(한 사람 금화 ' + cost + '닢), 남으면 이 항구에서 내립니다.<br>' +
        '<span class="muted">최저 ' + cmin + '명(모자라면 느리고 쉽게 지침) · 교대가 넉넉한 ' + spare + '명(피로가 덜 쌓임) · 최대 ' + cmax + '명(백병전·일손). 사람이 많을수록 식량·물이 빨리 줄어듭니다.</span>',
      min: 0, max: hi, value: f.crew, unit: '명',
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
      UI.toast('선원 ' + add + '명을 모집했다. (금화 ' + U.num(add * cost) + '닢)', 'people');
    } else {
      if (n < cmin && !(await UI.confirm('선원 수가 최저 승원 수(' + cmin + '명)를 밑돌게 됩니다. 배가 느려지고 쉽게 지칩니다. 괜찮습니까?'))) return;
      UI.toast('선원 ' + (f.crew - n) + '명을 내렸다.', 'people');
      f.crew = n;
    }
    G.Game.refreshHud();
  };

  // ---------------------------------------------------------------- town information
  H.townInfo = async function (c) {
    var s = S();
    var keeper = C.npc('harbormaster', '항구 관리인');
    var fee = 40 + c.size * 20;
    var regs = [];
    G.REGIONS.forEach(function (r, i) {
      var unknown = G.CITY_DATA.filter(function (x) { return x.region === i && s.known.indexOf(x.id) < 0 && R.cityExists(x); }).length;
      if (G.REGION_DIST[c.region][i] <= 2 || s.flags['reg' + i]) regs.push({ label: r, right: unknown ? '미확인 ' + unknown + '곳' : '모두 앎', value: i, disabled: !unknown });
    });
    await C.say(keeper, '다른 마을에 대해 듣고 싶나? 그렇다면 한 건당 금화 ' + fee + '닢이네.');
    var r = await UI.choose('어느 지방의 마을?', regs, { width: 560 });
    if (r == null) return;
    var list = G.CITY_DATA.filter(function (x) { return x.region === r && s.known.indexOf(x.id) < 0 && R.cityExists(x); });
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
  H.announce = async function (c) {
    var list = G.Disc.unreported();
    if (!list.length) { await C.mate('발표할 발견이 없습니다. 후원자와 계약한 발견은 후원자에게 보고하십시오.'); return; }
    var s = S();
    var opts = list.map(function (d) {
      var pf = G.Disc.proofItems(d.id).filter(function (it) { return !it.evidence; });
      return { label: d.name + (G.Disc.isLate(d.id) ? ' <span class="tag">늦은 발표 · 명성 절반</span>' : '') + (G.Disc.needsProof(d) && !G.Disc.hasProof(d.id) ? ' <span class="tag">증거 없음</span>' : ''),
        right: G.DISC_CATS[d.cat], value: d.id, desc: d.desc + (pf.length ? ' — 유물: ' + pf.map(function (it) { return R.itemName(it); }).join(', ') + ' (발표하면 제독의 것)' : '') };
    });
    var id = await UI.choose('발표할 발견물', opts, { width: 660, text: '후원자 없이 발견을 세상에 발표하면 명성을 얻고, 그 자리에서 가져온 유물은 제독의 것이 됩니다(시장에 팔 수 있다). 후원자에게 보고하면 사례금을 받는 대신 유물을 바칩니다.' });
    if (id == null) return;
    if (s.contract && s.contract.disc === id && !(await UI.confirm('이것은 후원자와 계약한 발견입니다. 그래도 발표하겠습니까? 계약은 실패로 처리됩니다.'))) return;
    var broke = s.contract && s.contract.disc === id ? G.SPONSOR[s.contract.sponsor] : null;
    var fame = G.Disc.announce(id);
    // 계약한 발견을 스스로 발표하면 계약은 깨진다 — 선금을 돌려주고, 후원자에게 보고해 사례금을 또 받을 수는 없다
    if (broke) await G.Sponsor.breakContract(broke, 'announce');
    else if (s.contract && s.contract.disc === id) s.contract = null;
    var la = G.Disc.lastAnnounce || {};
    await UI.alert('「' + G.DISC[id].name + '」의 발견을 발표했다!<br>명성 +' + fame + (G.Disc.isLate(id) ? '<br><span class="muted">경쟁자가 먼저 발표한 뒤라 명성은 절반</span>' : '') +
      (la.noProof ? '<br><span class="muted">증거를 보이지 못해 사람들이 반신반의한다 (명성 8할)</span>' : '') +
      (la.kept && la.kept.length ? '<br><br>' + la.kept.map(function (it) { return '<b>' + U.esc(R.itemName(it)) + '</b>'; }).join(', ') + U.jx(R.itemName(la.kept[la.kept.length - 1]), '은/는') + ' 이제 제독의 것이다.<br><span class="muted">시장에 팔아 자금을 마련하거나, 장비하고 선물할 수 있다.</span>' : ''), '발표');
    if (G.Names) await G.Names.onReport(G.DISC[id]);
  };
})(window.G = window.G || {});
