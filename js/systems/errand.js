/* 후원자의 작은 일거리 (G.Errand) — 이름도 기반도 없는 처음에도 맺을 수 있는 쉬운 계약.
   · 해도 작성: 후원자 도시에서 6~18° 떨어진 바다 한 곳에 가서 둘러보고(0.8° 안) 돌아와 보고한다
   · 물자 조달: 이 도시에서 나지 않는 가까운 고장의 물건을 몇 통 사다 바친다 (보고할 때 짐칸에서 넘긴다)
   · 소문 확인: 가까운 작은 발견(세력 1 이하)의 단서를 후원자가 주고, 찾아오면 보고한다 (보통 계약과 같은 흐름)
   계약은 s.contract에 {small: true, task: {kind, ...}} 로 담긴다 — 해도·조달은 disc가 없고, 소문 확인은 disc가 있다.
   후원자를 만날 명성이 모자라도 집사를 통해 맡고 보고할 수 있다. 보수는 작지만 명성·신뢰가 쌓여 큰 계약으로 이어진다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var E = {};
  G.Errand = E;
  function S() { return G.Game.state; }
  function dockOf(c) { var d = c.dock || [c.lat, c.lon]; return [d[1], d[0]]; }

  /** 계약의 이름 (계약이 무엇이든) */
  E.name = function (k) {
    if (!k) return '';
    if (k.task && k.task.title) return k.task.title;
    if (k.circ) return '세계일주';
    var d = G.DISC[k.disc]; return d ? d.name : '';
  };
  /** 해낸 일인가 (보고할 수 있나) */
  E.done = function (k) {
    if (!k) return false;
    var t = k.task;
    if (t && t.kind === 'survey') return !!t.done;
    if (t && t.kind === 'procure') { var cg = S().fleet.cargo[t.good]; return !!(cg && cg.q >= t.qty); }
    if (k.circ) return G.Disc.foundByMe('circum');
    return G.Disc.foundByMe(k.disc);
  };
  /** 진행 상황 한 줄 */
  E.status = function (k) {
    var t = k && k.task;
    if (!t) return E.done(k) ? '발견 완료 — 후원자에게 보고하십시오' : '탐색 중';
    if (t.kind === 'survey') return t.done ? '해도 작성 완료 — 후원자에게 보고하십시오' : '목표 해역(' + latlon(t.lon, t.lat) + ')까지 가서 둘러보십시오 (0.8° 안)';
    if (t.kind === 'procure') { var cg = S().fleet.cargo[t.good], q = cg ? cg.q : 0; return q >= t.qty ? G.GOOD[t.good].name + ' ' + t.qty + '통 준비 완료 — 후원자에게 가져가십시오' : G.GOOD[t.good].name + ' ' + q + '/' + t.qty + '통 (' + t.whereName + ' 등에서 삽니다)'; }
    return E.done(k) ? '발견 완료 — 후원자에게 보고하십시오' : '탐색 중';
  };
  function latlon(lon, lat) { return (lat >= 0 ? '북위 ' : '남위 ') + Math.abs(lat).toFixed(0) + '° · ' + (lon >= 0 ? '동경 ' : '서경 ') + Math.abs(lon).toFixed(0) + '°'; }

  // ---------------------------------------------------------------- 일거리 만들기
  /** 해도 작성: 후원자 항구와 같은 바다에서 이어진, 뭍에서 떨어진 먼바다 한 점 */
  function survey(sp, rng) {
    var c = G.CITY_DATA[sp.city], from = c.port ? dockOf(c) : nearestPort(c);
    if (!from) return null;
    var comp = G.Nav && G.Nav.component ? G.Nav.component(from[0], from[1]) : null;
    for (var i = 0; i < 80; i++) {
      var a = rng() * Math.PI * 2, r = 6 + rng() * 12;
      var lon = G.Geo.wrapLon(from[0] + Math.cos(a) * r), lat = from[1] + Math.sin(a) * r;
      if (Math.abs(lat) > 58) continue;
      if (G.Geo.sdf(lon, lat) > -3) continue;                                   // 뭍에서 0.3° 넘게 떨어진 바다
      if (comp != null && G.Nav.component(lon, lat) !== comp) continue;           // 배로 갈 수 있는 바다
      if (G.Geo.berg && G.Geo.berg(lon, lat)) continue;
      var oc = G.Explore && G.Explore.oceanOf ? G.Explore.oceanOf(lon, lat) : null;
      var dir = U.dirName(Math.atan2(lat - from[1], G.Geo.wrapLon(lon - from[0])));
      var w = sp.wealth || 2;
      return { kind: 'survey', lon: lon, lat: lat, r: r, title: (c.port ? c.name : G.CITY_DATA[portCityOf(c)].name) + ' ' + dir + '쪽 ' + (oc ? oc[1] : '먼바다') + ' 해도',
        advance: round100(150 + r * 15), reward: round100((500 + r * 95) * (0.8 + 0.1 * w)), fame: Math.round(20 + r * 2), years: 1,
        desc: (oc ? oc[1] : '먼바다') + ' ' + latlon(lon, lat) + ' 부근의 물길과 바람을 살펴 해도를 그려 오게. (' + Math.round(r) + '° 거리)' };
    }
    return null;
  }
  function portCityOf(c) { var best = null, bd = 1e9; G.CITY_DATA.forEach(function (x) { if (!x.port || !R.cityExists(x)) return; var d = G.Geo.dist(c.lon, c.lat, x.lon, x.lat); if (d < bd) { bd = d; best = x; } }); return best ? best.id : c.id; }
  function nearestPort(c) { var p = G.CITY_DATA[portCityOf(c)]; return p && p.port ? dockOf(p) : null; }
  /** 물자 조달: 후원자 도시에 없는 물건을 가까운 항구에서 */
  function procure(sp, rng) {
    var c = G.CITY_DATA[sp.city], here = R.cityGoods(c), cand = [];
    G.CITY_DATA.forEach(function (x) {
      if (!x.port || x.id === c.id || !R.cityExists(x)) return;
      var d = G.Geo.dist(c.lon, c.lat, x.lon, x.lat); if (d > 26 || d < 2) return;
      R.cityGoods(x).forEach(function (g) { if (here.indexOf(g) < 0 && G.GOOD[g] && G.GOOD[g].cat !== 'food') cand.push({ g: g, x: x, d: d }); });
    });
    if (!cand.length) return null;
    cand.sort(function (a, b) { return a.d - b.d; });
    var pick = cand[Math.floor(rng() * Math.min(cand.length, 6))];
    var gd = G.GOOD[pick.g], qty = 8 + Math.floor(rng() * 3) * 4;
    var cost = R.buyPrice(pick.x, pick.g) * qty;
    var where = cand.filter(function (o) { return o.g === pick.g; }).map(function (o) { return o.x.name; }).filter(function (n, i, a) { return a.indexOf(n) === i; }).slice(0, 3);
    return { kind: 'procure', good: pick.g, qty: qty, at: pick.x.id, whereName: where.join('·'), title: gd.name + ' ' + qty + '통 조달',
      advance: 0, reward: Math.max(900, round100(cost * 1.8 + 400)), fame: 15 + Math.round(pick.d), years: 1,
      desc: '이곳에서는 ' + gd.name + U.jx(gd.name, '을/를') + ' 구하기 어렵네. ' + where.join('·') + ' 같은 곳에서 ' + qty + '통만 사다 주게. 값은 넉넉히 치르겠네.' };
  }
  /** 소문 확인: 가까운 작은 발견 (후원자의 취향이면 먼저) */
  function confirm(sp, rng) {
    var s = S(), c = G.CITY_DATA[sp.city];
    var cand = G.DISCOVERIES.filter(function (d) {
      if (d.pw > Math.max(1, Math.min(2, sp.pw)) || d.how === 'special' || d.how === 'trade' || d.lon == null) return false;
      if (G.Disc.foundByMe(d.id) || (s.disc[d.id] && s.disc[d.id].rival) || !G.Disc.available(d)) return false;
      return G.Geo.dist(c.lon, c.lat, d.lon, d.lat) <= 35;
    });
    if (!cand.length) return null;
    cand.sort(function (a, b) { var ta = G.tasteHit(sp.taste, a) ? 0 : 1, tb = G.tasteHit(sp.taste, b) ? 0 : 1; return ta - tb || G.Geo.dist(c.lon, c.lat, a.lon, a.lat) - G.Geo.dist(c.lon, c.lat, b.lon, b.lat); });
    var d = cand[Math.floor(rng() * Math.min(cand.length, 3))], dist = G.Geo.dist(c.lon, c.lat, d.lon, d.lat);
    return { kind: 'confirm', disc: d.id, title: '「' + d.name + '」 소문 확인',
      advance: 300, reward: Math.max(1200, round100(d.val * (0.28 + 0.03 * (sp.wealth || 2)))), fame: 0, years: dist > 18 ? 2 : 1,
      desc: '요즘 이런 소문이 도네. ' + d.hint + ' 정말인지 가서 확인해 오게.' };
  }
  function round100(x) { return Math.max(100, Math.round(x / 100) * 100); }

  /** 이 후원자가 맡길 만한 일거리 (같은 달에는 같은 것) */
  E.offers = function (sp) {
    var s = S(), rng = U.makeRng(U.strHash(sp.id + ':' + s.date.y + ':' + s.date.m));
    var out = [], a = survey(sp, rng), b = procure(sp, rng), c = confirm(sp, rng);
    // 후원자의 성격에 맞는 것을 앞에: 학자·지리는 해도, 상인·교역은 조달, 유적·민족·보물은 확인
    var pref = sp.taste.indexOf('geo') >= 0 || sp.type === 'scholar' ? [a, c, b] : sp.taste.indexOf('trade') >= 0 || sp.type === 'merchant' ? [b, a, c] : [c, a, b];
    pref.forEach(function (x) { if (x) out.push(x); });
    return out;
  };

  /** 일거리를 고르고 맺는다. via = 말하는 사람(후원자 또는 집사). 맺었으면 true */
  E.offerDialog = async function (sp, via) {
    var s = S(), list = E.offers(sp);
    if (!list.length) { await UI.say('지금은 맡길 만한 일이 없군. 다음 달에 다시 와 보게.', via); return false; }
    var v = await UI.choose('작은 일거리 — ' + G.Sponsor.holderName(sp), list.map(function (t, i) {
      return { label: t.title, right: '보수 ' + U.num(t.reward) + '닢' + (t.fame ? ' · 명성 +' + t.fame : ''), value: i, icon: t.kind === 'survey' ? 'map' : t.kind === 'procure' ? 'sack' : 'scroll',
        desc: t.desc + ' — 기한 ' + t.years + '년' + (t.advance ? ', 선금 ' + U.num(t.advance) + '닢' : '') };
    }).concat([{ label: '그만둔다', value: -1, icon: 'boot' }]), { width: 760, text: '큰 모험을 맡기기엔 아직 이르지만, 이런 일이라면 맡겨 보겠네. 해내면 이름이 알려지고 신뢰도 쌓일 걸세.' });
    if (v == null || v < 0) { await UI.say('그런가. 마음이 바뀌면 다시 오게.', via); return false; }
    var t = list[v], due = U.addDays(s.date, t.years * 365);
    s.contract = { sponsor: sp.id, disc: t.kind === 'confirm' ? t.disc : null, advance: t.advance, reward: t.reward, due: U.dateNum(due), start: U.dateNum(s.date), circ: false, small: true,
      task: { kind: t.kind, title: t.title, lon: t.lon, lat: t.lat, good: t.good, qty: t.qty, at: t.at, whereName: t.whereName, fame: t.fame, desc: t.desc } };
    if (t.kind === 'confirm') G.Disc.addHint(t.disc, 'contract:' + sp.id);
    s.player.gold += t.advance;
    G.State.log(U.j(G.Sponsor.holderName(sp), '과/와') + ' 작은 일거리 「' + t.title + '」' + U.jx(t.title, '을/를') + ' 맡았다. (보수 ' + t.reward + '닢, 기한 ' + U.fmtDate(due) + ')');
    await UI.say(t.kind === 'survey' ? '좋네. 바다를 잘 살피고 오게. 해도는 항해자의 첫 밑천이지.' : t.kind === 'procure' ? '고맙네. 물건만 가져오면 약속한 값은 치르겠네.' : '잘 부탁하네. 소문이 사실이라면 큰 공이 될 걸세.', via);
    UI.toast('작은 계약 성립 — 「' + t.title + '」' + (t.advance ? ' (선금 ' + U.num(t.advance) + '닢)' : ''), 'seal', 4500);
    G.Game.refreshHud();
    return true;
  };

  /** 바다에서: 해도 목표에 닿았는가 (배가 움직일 때마다) */
  E.onSea = function (lon, lat) {
    var k = S().contract, t = k && k.task;
    if (!t || t.kind !== 'survey' || t.done) return;
    if (G.Geo.dist(lon, lat, t.lon, t.lat) < 0.8) {
      t.done = true;
      G.State.revealChart(t.lon, t.lat, 2.5);
      UI.toast('목표 해역을 둘러보고 해도를 그렸다 — 후원자에게 돌아가 보고하십시오.', 'map', 5500);
      G.State.log('「' + t.title + '」 해도를 그렸다.');
    }
  };

  /** 작은 일거리 보고 (해도·조달, 그리고 소문 확인). via = 말하는 사람 */
  E.report = async function (sp, via) {
    var s = S(), k = s.contract, t = k.task, rel = G.Sponsor.rel(sp.id), butler = via && via.name === '집사';
    var late = U.dateNum(s.date) > k.due;
    if (!E.done(k)) {
      var v = await UI.ask(late ? '약속한 기한이 이미 지났네. 어떻게 된 건가?' : '아직 다 못 했는가? 기한까지는 시간이 있네.', late ? [{ label: '실패를 인정한다', value: 'fail' }, { label: '물러난다', value: null }] : [{ label: '계속하겠습니다', value: null }, { label: '일을 그만둔다', value: 'fail' }], via);
      if (v !== 'fail') return;
      await UI.say('작은 일이라도 약속은 약속일세. 다음에는 끝까지 해내게.', via);
      G.Sponsor.addTrust(rel, -5);            // 작은 일의 실패는 큰 계약 교섭(rel.fail)에는 치지 않는다
      if (!late && k.advance > 0) { var back = Math.min(s.player.gold, k.advance); s.player.gold -= back; if (back) UI.toast('선금 ' + U.num(back) + '닢을 돌려주었다.', 'coin'); }
      G.State.log('작은 일거리 「' + E.name(k) + '」' + U.jx(E.name(k), '을/를') + ' 끝내지 못했다.');
      s.contract = null;
      return;
    }
    var reward = k.reward, fame = t.fame || 0;
    if (t.kind === 'procure') { var cg = s.fleet.cargo[t.good]; cg.q -= t.qty; if (cg.q <= 0) delete s.fleet.cargo[t.good]; }
    if (t.kind === 'confirm') { var d = G.DISC[k.disc], st = s.disc[k.disc] || {}; fame = G.Disc.isLate(d.id) ? Math.round((G.Disc.fameFor(d) + sp.pw * 20) * G.Disc.LATE_FAME) : Math.round(G.Disc.fameFor(d) * (st.rival ? 0.5 : 1) + sp.pw * 20); st.reported = sp.id; s.disc[k.disc] = st; }
    if (late) { reward = Math.round(reward * 0.5); fame = Math.round(fame * 0.7); }
    if (butler) await UI.say((t.kind === 'survey' ? '해도는 틀림없이 주인께 올리겠습니다.' : t.kind === 'procure' ? '물건은 틀림없이 받았습니다.' : '소문이 사실이었다니, 주인께서 기뻐하시겠군요.') + '\f주인께서 약속하신 금화 ' + U.num(reward) + '닢입니다. 당신의 이름은 주인께 말씀드려 두지요.', via);
    else await UI.say((t.kind === 'survey' ? '오오, 이 해도는 아주 쓸 만하군! 바다 사람들이 고마워할 걸세.' : t.kind === 'procure' ? '틀림없이 받았네. 이 물건이 꼭 필요했지.' : '소문이 사실이었군! 자네 덕분에 확실히 알게 되었네.') + '\f약속한 금화 ' + U.num(reward) + '닢일세. 다음에는 더 큰 일을 맡겨 봄 직하군.', via);
    s.player.gold += reward; G.Fame.add(t.kind === 'procure' ? 'tr' : 'ex', fame);
    G.Sponsor.addTrust(rel, 8); rel.done = (rel.done || 0) + 1;
    G.State.log(G.Sponsor.holderName(sp) + '에게 「' + E.name(k) + '」' + U.jx(E.name(k), '을/를') + ' 보고했다. (보수 ' + reward + '닢, 명성 +' + fame + ')');
    s.contract = null;
    await UI.alert('보수 금화 ' + U.num(reward) + '닢과 명성 ' + fame + U.jx(String(fame), '을/를') + ' 얻었다! (후원자의 신뢰 +8)', '보고 완료');
    if (t.kind === 'confirm' && G.Names) await G.Names.onReport(G.DISC[k.disc]);
    G.Game.refreshHud();
  };
})(window.G = window.G || {});
