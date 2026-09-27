/* Discoveries: hints, finding, rivals, announcements. */
(function (G) {
  'use strict';
  var U = G.U, R = G.R, UI = G.UI;
  var D = {};
  G.Disc = D;
  function S() { return G.Game.state; }

  D.state = function (id) { return S().disc[id] || null; };
  D.isFound = function (id) { var d = S().disc[id]; return !!(d && d.found); };
  D.foundByMe = function (id) { var d = S().disc[id]; return !!(d && d.found && d.me); };
  D.announcedBy = function (id) { var d = S().disc[id]; return d && d.rival ? d.rival : null; };
  D.hasHint = function (id) { return !!S().hints[id]; };
  /** 단서를 적는다. 아직 개척 단계가 닿지 않은 발견물은 받지 않는다 (G.Frontier) */
  D.addHint = function (id, src) {
    var s = S(); if (s.hints[id] || D.foundByMe(id)) return false;
    if (G.Frontier && G.DISC[id] && !G.Frontier.canHint(G.DISC[id], src)) return false;
    s.hints[id] = { src: src, d: U.dateNum(s.date) }; return true;
  };
  /** 지금 단서를 들을 수 있는 발견물인가 */
  D.available = function (d) { return !G.Frontier || G.Frontier.available(d); };
  D.value = function (d) { return d.val; };
  D.fameFor = function (d) { return Math.round(d.val / 26 + d.pw * 30); };
  /** 발견을 그림으로 남기면 값어치가 오른다 (그림 특기) */
  D.artBonus = function () { return 1 + R.skill('art') * 0.08; };

  /** player discovers d (object). returns promise after showing the event */
  D.find = async function (d, how) {
    var s = S();
    var st = s.disc[d.id] || (s.disc[d.id] = {});
    if (st.me) return false;
    st.found = U.dateNum(s.date); st.me = true; st.evidence = true;
    s.stats.found++;
    D.collectionReward(s.stats.found);
    delete s.hints[d.id];
    var fame = Math.round(D.fameFor(d) * (st.rival ? 0.45 : 0.75) * D.artBonus());
    s.player.fame += fame;
    // 증거품: 이름 붙은 증거(해도·지도)는 소지품으로 챙긴다 — 보고·발표할 때 건넨다 (잃으면 믿어 주지 않는다)
    if (d.evidence && !s.player.items.some(function (it) { return it.kind === 'evidence' && it.disc === d.id; })) {
      s.player.items.push({ id: 'evidence', kind: 'evidence', evidence: true, name: d.evidence, disc: d.id,
        desc: '「' + d.name + '」의 발견을 증명한다. 후원자에게 보고하거나 항구에서 발표할 때 건넨다.' });
    }
    // 보물·공예 발견은 그 자리에서 값나가는 것을 챙긴다 (세공 솜씨만큼 더)
    var loot = 0;
    if (d.cat === 'treasure' || d.cat === 'ruin') {
      loot = Math.round(d.val * (0.05 + R.skill('craft') * 0.035) * (st.rival ? 0.5 : 1));
      if (loot > 0) s.player.gold += loot;
    }
    G.State.log(d.name + U.j(d.name, '을/를').slice(d.name.length) + ' 발견했다.');
    if (G.Audio) G.Audio.sfx('discover');
    await G.Scenes.discoveryCard(d, fame);
    if (loot > 0) UI.toast('값나가는 것을 챙겼다 — 금화 ' + U.num(loot) + '닢', 'coin', 4200);
    // 곶·해협·항로·대륙: 처음 찾은 사람이 이름을 붙인다
    if (G.Names) await G.Names.offer(d);
    // contract check
    if (s.contract && s.contract.disc === d.id) {
      await UI.say('제독, 이것이 바로 후원자께서 찾던 것입니다! 기한 안에 ' + G.CITY_DATA[G.SPONSOR[s.contract.sponsor].city].name + U.j(G.CITY_DATA[G.SPONSOR[s.contract.sponsor].city].name, '으로/로').slice(G.CITY_DATA[G.SPONSOR[s.contract.sponsor].city].name.length) + ' 돌아가 보고합시다.', G.Scenes.mateSpeaker('first'));
    }
    // 발견의 연쇄: 이것을 찾아서 뒤의 발견물 실마리가 풀렸다
    if (G.DISC_CHAIN) {
      for (var nid in G.DISC_CHAIN) {
        var nd = G.DISC[nid];
        if (!nd || G.DISC_CHAIN[nid].indexOf(d.id) < 0 || D.foundByMe(nid)) continue;
        if (G.Frontier && !G.Frontier.available(nd)) continue;
        if (D.addHint(nid, 'chain:' + d.id)) {
          await UI.say(G.chainLine(nid) + '\n\n— 새 단서: 「' + nd.name + '」', G.Scenes.mateSpeaker(R.skill('hist') ? 'surveyor' : 'first'));
          UI.toast('단서를 얻었다: 「' + nd.name + '」', 'scroll', 4200);
        }
      }
    }
    // 이 발견으로 새 단계가 열렸으면 알린다
    if (G.Frontier) { var fm = G.Frontier.tick(); if (fm.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(fm); }
    G.Game.refreshHud && G.Game.refreshHud();
    return true;
  };

  /** 발견을 일정 수 모을 때마다 모국 왕실이 포상한다 */
  var COLLECT = [5, 12, 25, 40, 60, 85, 115, 150, 186];
  D.collectionReward = function (n) {
    var s = S();
    if (COLLECT.indexOf(n) < 0) return;
    var gold = n * 400, fame = n * 6;
    s.player.gold += gold; s.player.fame += fame;
    var king = s.player.nation === 'ES' ? '에스파냐 왕실' : '포르투갈 왕실';
    setTimeout(function () { UI.toast('발견 ' + n + '가지 달성! ' + king + '에서 포상금 금화 ' + U.num(gold) + '닢을 보내왔다. (명성 +' + fame + ')', 'crown', 6500); }, 900);
    G.State.log('발견 ' + n + '가지를 모았다. ' + king + '의 포상 (금화 ' + U.num(gold) + ', 명성 +' + fame + ')');
  };
  D.nextCollect = function () { var n = S().stats.found; for (var i = 0; i < COLLECT.length; i++) if (COLLECT[i] > n) return COLLECT[i]; return null; };

  /** 늦은 발표: 먼저 찾아 두고도 알리지 않는 사이 경쟁자가 발표했으면, 이제 알려도 명성은 이만큼만 받는다 */
  D.LATE_FAME = 0.5;
  D.isLate = function (id) {
    var st = S().disc[id], d = G.DISC[id]; if (!st || !st.me) return false;
    if (st.late) return true;
    // 예전 기록: 경쟁자 발표일보다 먼저 찾았고 경쟁자가 발표했으면 늦은 발표로 본다
    return !!(st.rival && d && d.rival && st.found && st.found < d.rival[0] * 10000 + d.rival[1] * 100 + 1);
  };
  /** 보고·발표로 받을 명성에 곱할 값 (늦은 발표면 D.LATE_FAME) */
  D.lateK = function (id) { return D.isLate(id) ? D.LATE_FAME : 1; };

  /** rival timeline: called daily */
  D.rivals = function () {
    var s = S(), out = [];
    G.DISCOVERIES.forEach(function (d) {
      if (!d.rival) return;
      var st = s.disc[d.id];
      if (st && (st.rival || st.reported || st.announced)) return;
      var ry = d.rival[0] + (s.flags['delay_' + d.id] || 0), rm = d.rival[1];
      var left = (ry * 12 + rm) - (s.date.y * 12 + s.date.m);
      var mine = D.foundByMe(d.id);
      if (left > 0 && left <= 8 && s.hints[d.id] && !mine && !s.flags['warn_' + d.id]) {
        s.flags['warn_' + d.id] = 1;
        out.push({ icon: 'hourglass', history: true, text: '소문: ' + U.j(d.rival[2], '이/가') + ' 「' + d.name + '」' + U.jx(d.name, '을/를') + ' 찾아 곧 떠난다고 한다. 서두르지 않으면 이름을 빼앗긴다! (앞으로 약 ' + left + '달)' });
      }
      // 찾아 두고 아직 알리지 않았다: 경쟁자가 발표하기 전에 알리라고 일러 준다
      if (left > 0 && left <= 8 && mine && !s.flags['warnf_' + d.id]) {
        s.flags['warnf_' + d.id] = 1;
        out.push({ icon: 'hourglass', history: true, text: '소문: ' + U.j(d.rival[2], '이/가') + ' 「' + d.name + '」의 발견을 곧 발표한다고 한다. 먼저 찾아 둔 제독이 그 전에 후원자에게 보고하거나 항구에서 발표하지 않으면, 나중에 알려도 명성을 절반밖에 받지 못한다! (앞으로 약 ' + left + '달)' });
      }
      if (s.date.y > ry || (s.date.y === ry && s.date.m >= rm)) {
        st = s.disc[d.id] || (s.disc[d.id] = {});
        st.rival = d.rival[2];
        if (st.me) st.late = true;               // 먼저 찾았지만 알리지 않았다 → 늦은 발표
        if (!st.found) st.found = U.dateNum(s.date);
        var nn = G.Names ? G.Names.onRival(d) : null, oldName = G.Names && G.DISC[d.id].aka ? G.DISC[d.id].aka : d.name;
        if (st.me) out.push({ icon: 'flag', text: d.rival[2] + U.j(d.rival[2], '이/가').slice(d.rival[2].length) + ' 「' + oldName + '」의 발견을 발표했다. 제독이 먼저 찾아 두고도 알리지 않은 사이의 일이다 — 이제 알려도 명성은 절반만 받는다.' + (nn ? ' ' + nn : '') });
        else out.push({ icon: 'flag', text: d.rival[2] + U.j(d.rival[2], '이/가').slice(d.rival[2].length) + ' 「' + oldName + '」의 발견을 발표했다.' + (nn ? ' ' + nn : '') });
        G.State.log(d.rival[2] + ': 「' + d.name + '」 발견 발표' + (st.me ? ' (먼저 찾아 두었지만 알리지 않았다 — 늦은 발표는 명성 절반)' : ''));
      }
    });
    return out;
  };

  /** announce (발표) at a harbor/palace without a sponsor: fame only */
  D.announce = function (id) {
    var s = S(), d = G.DISC[id], st = s.disc[id];
    if (!st || !st.me || st.reported || st.announced) return 0;
    st.announced = true;
    var fame = D.isLate(id) ? Math.round(D.fameFor(d) * 0.9 * D.LATE_FAME) : Math.round(D.fameFor(d) * (st.rival ? 0.35 : 0.9));
    // 증거품을 내보이면 제값, 없으면 덜 믿는다
    if (d.evidence) { var ev = G.Sponsor && G.Sponsor.takeEvidence ? G.Sponsor.takeEvidence(id) : null; if (!ev) fame = Math.round(fame * 0.8); }
    s.player.fame += fame;
    G.State.log('「' + d.name + '」의 발견을 발표했다. (명성 +' + fame + (D.isLate(id) ? ', 늦은 발표라 절반' : '') + ')');
    return fame;
  };

  /** discoveries owned by player, not yet reported/announced */
  D.unreported = function () {
    var s = S(); return G.DISCOVERIES.filter(function (d) { var st = s.disc[d.id]; return st && st.me && !st.reported && !st.announced; });
  };

  // ---------------------------------------------------------------- checks while moving
  /** at sea: check sea discoveries near position */
  D.checkSea = function (lon, lat) {
    var s = S(), hits = [];
    G.DISCOVERIES.forEach(function (d) {
      if (d.how !== 'sea' || D.foundByMe(d.id)) return;
      if (G.Geo.dist(lon, lat, d.lon, d.lat) < d.r) hits.push(d);
    });
    // special geography conditions
    function sp(id) { if (!D.foundByMe(id)) hits.push(G.DISC[id]); }
    if (lat < -34.2 && lon > 16 && lon < 30) sp('capegood');
    if (lon > -86 && lon < -60 && lat > 10 && lat < 27 && s.flags.fromEurope) sp('westroute');
    if (lon > 72 && lon < 78 && lat > 8 && lat < 20 && s.flags.viaCape) sp('indiaroute');
    if (lat < -62) { sp('antarctic'); if (lon > -75 && lon < -45) sp('antpeople'); }
    if (lat < -40 && lon > -20 && lon < 110 && U.chance(0.02)) sp('albatross');
    if (G.Geo.dist(lon, lat, 43.3, -11.7) < 1.5 && U.chance(0.05)) sp('coelacanth');
    var winter = s.date.m >= 10 || s.date.m <= 3;
    if (lat > 62 && winter && U.chance(0.03)) sp('aurora');
    if (G.Geo.dist(lon, lat, -170, -5) < 2.5 && s.hints.mu) sp('mu');
    return hits.filter(function (x, i) { return hits.indexOf(x) === i; });
  };
  /** on land expedition */
  D.checkLand = function (lon, lat) {
    var hits = [], near = null, nearD = 99;
    G.DISCOVERIES.forEach(function (d) {
      if (d.how !== 'land' || D.foundByMe(d.id)) return;
      var dist = G.Geo.dist(lon, lat, d.lon, d.lat);
      var r = d.r * (1 + R.skill('hist') * 0.25) * (d.cat === 'creature' || d.cat === 'nature' ? 1 + R.skill('sci') * 0.2 : 1);
      if (dist < r) hits.push(d);
      else if (dist < nearD) { nearD = dist; near = d; }
    });
    return { hits: hits, near: near, nearDist: nearD };
  };
  D.checkCity = function (cityId) {
    return G.DISCOVERIES.filter(function (d) { return d.how === 'city' && d.city === cityId && !D.foundByMe(d.id); });
  };
  D.checkTrade = function (goodId, city) {
    return G.DISCOVERIES.filter(function (d) { return d.how === 'trade' && d.good === goodId && d.regions.indexOf(city.region) >= 0 && !D.foundByMe(d.id); });
  };

  // ---------------------------------------------------------------- circumnavigation tracking
  D.trackCirc = function (dLon) {
    var s = S();
    if (!s.circ) return null;
    s.circ.cum += dLon;
    if (Math.abs(s.circ.cum) >= 360 && !s.circ.done) { s.circ.done = true; return 'done'; }
    return null;
  };
})(window.G = window.G || {});
