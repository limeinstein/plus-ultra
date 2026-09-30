/* 탐험의 설렘: 망루·정찰대가 발견물을 먼저 알아채는 '탐지', 가까워질수록 좁혀지는 지도 표식,
   적도·새 바다 같은 항해 이정표, 바다와 육지의 사건들. 바다(sea.js)와 육지(land.js)가 함께 쓴다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var X = {};
  G.Explore = X;
  function S() { return G.Game.state; }
  function marks() { var s = S(); return s.marks || (s.marks = {}); }
  function mate(role) { return G.Scenes.mateSpeaker(role); }

  // ================================================================ 탐지 범위 (°)
  /** 바다에서 망루가 수평선 너머를 살피는 거리 */
  X.seaRange = function () { return 3.0 + R.skill('survey') * 0.9 + (R.hasItem('telescope') ? 1.4 : 0); };
  /** 배에서 해안 가까운 육상 발견물을 알아보는 거리 */
  X.coastRange = function () { return 0.9 + R.skill('survey') * 0.25 + (R.hasItem('telescope') ? 0.5 : 0); };
  /** 육지에서 정찰대가 알아채는 거리 */
  X.landRange = function () { return 1.0 + R.skill('survey') * 0.3 + R.skill('hist') * 0.2 + (R.hasItem('telescope') ? 0.3 : 0); };

  var CAT_COL = { geo: '#7fc4ff', nature: '#8fe08a', ruin: '#f0c070', treasure: '#ffd24a', creature: '#ff9a7a', people: '#e0a8ff', trade: '#e8e0c8' };
  X.catColor = function (cat) { return CAT_COL[cat] || '#f2e7cc'; };

  var SEEN_LINE = {
    geo: ['낯선 바다 빛깔이 보입니다.', '물길이 심상치 않습니다. 무언가 있습니다!'],
    nature: ['하늘빛이 이상합니다. 무언가 있는 것 같습니다.', '보기 드문 풍경이 어른거립니다.'],
    ruin: ['사람이 쌓은 듯한 돌무더기가 보입니다.', '무너진 성벽 같은 것이 보입니다!'],
    treasure: ['무언가 번쩍였습니다. 예사롭지 않습니다.', '오래된 표식이 새겨진 바위가 보입니다.'],
    creature: ['처음 보는 짐승의 흔적이 있습니다.', '커다란 그림자가 지나갔습니다!'],
    people: ['연기가 오릅니다. 사람이 사는 것 같습니다.', '북소리 같은 것이 들립니다.'],
    trade: ['무언가 있습니다.']
  };
  X.ver = 0;        // 표식이 늘 때마다 올라간다 (장면이 표식을 다시 계산하도록)

  /** 새로 알아챈 발견물을 돌려준다. mode: 'sea' | 'land' */
  X.sense = function (mode, lon, lat, boost) {
    var s = S(), mk = marks(), out = [];
    var rs = X.seaRange() * (boost || 1), rc = X.coastRange() * (boost || 1), rl = X.landRange() * (boost || 1);
    G.DISCOVERIES.forEach(function (d) {
      if (mk[d.id] || G.Disc.foundByMe(d.id)) return;
      if (d.how !== 'sea' && d.how !== 'land') return;
      if (!G.Disc.available(d)) return;          // 아직 소문조차 없는 것은 알아보지 못한다
      var hint = s.hints[d.id] ? 1.4 : 1;
      var dist = G.Geo.dist(lon, lat, d.lon, d.lat);
      var r = mode === 'sea' ? (d.how === 'sea' ? rs : rc) : (d.how === 'land' ? rl : 0);
      if (dist < r * hint && dist > (d.r || 0.3) * 0.9) out.push({ d: d, dist: dist });
    });
    out.sort(function (a, b) { return a.dist - b.dist; });
    return out;
  };
  /** 알아챈 것을 표식으로 남기고 부하가 알려 준다 */
  X.report = async function (list, lon, lat, mode) {
    var s = S(), mk = marks();
    for (var i = 0; i < list.length && i < 2; i++) {
      var d = list[i].d;
      mk[d.id] = { t: s.day, mode: mode };
      if (G.Reel) G.Reel.prefetch(d);            // 곧 닿을지 모르니 발견 장면 판을 미리 받아 둔다
      var dx = G.Geo.wrapLon(d.lon - lon), dy = d.lat - lat;
      var dir = U.dirName(Math.atan2(dy, dx));
      var far = list[i].dist < 1 ? '가까운' : list[i].dist < 2.5 ? '멀지 않은' : '먼';
      var line = U.pick(SEEN_LINE[d.cat] || SEEN_LINE.trade);
      var extra = mode === 'sea' && d.how === 'land' ? ' 상륙해서 조사해 볼 만합니다.' : '';
      G.Disc.addHint(d.id, 'lookout');
      UI.toast((mode === 'sea' ? '망루' : '정찰대') + ' · ' + dir + '쪽 ' + far + ' 곳 — ' + line + extra, 'eye', 6000);
      X.ver++;
      G.State.log(dir + '쪽에서 무언가를 보았다 — 「' + d.name + '」의 단서를 얻었다.');
      if (G.Audio) G.Audio.sfx('bell');
    }
    return list.length;
  };

  /** 지도에 그릴 표식 목록. 가까이 갈수록 원이 줄어 실제 자리로 모인다 */
  X.markers = function (lon, lat, mode) {
    var s = S(), mk = marks(), out = [];
    for (var id in mk) {
      var d = G.DISC[id];
      if (!d || G.Disc.foundByMe(id)) continue;
      if (mode === 'land' && d.how !== 'land') continue;
      var dist = G.Geo.dist(lon, lat, d.lon, d.lat);
      var u = U.clamp(dist * 0.32, 0.05, 1.6);
      if (mk[id].u != null) u = Math.min(u, mk[id].u);      // 현지 소문으로 좁혀 둔 범위
      var rng = U.makeRng(U.strHash('mk' + id));
      var a = rng() * Math.PI * 2, k = 0.35 + rng() * 0.55;
      out.push({ d: d, lon: d.lon + Math.cos(a) * u * k, lat: d.lat + Math.sin(a) * u * k, r: Math.max(d.r || 0.3, u), dist: dist, col: X.catColor(d.cat) });
    }
    return out;
  };
  /** 표식 하나 그리기 (sea/land 오버레이 공용) */
  X.drawMarker = function (ctx, m, p, rpx, t, ff) {
    var pulse = 0.5 + Math.sin(t * 2.6 + m.d.lon) * 0.5;
    ctx.save();
    ctx.strokeStyle = m.col; ctx.globalAlpha = 0.55 + pulse * 0.35; ctx.lineWidth = 2.2;
    ctx.setLineDash([7, 6]); ctx.lineDashOffset = -t * 18;
    ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(14, rpx), 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = 'rgba(20,14,8,.78)'; ctx.beginPath(); ctx.arc(p[0], p[1], 13, 0, 7); ctx.fill();
    ctx.strokeStyle = m.col; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = m.col; ctx.font = '800 17px ' + ff; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', p[0], p[1] + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  };
  /** 화면의 (x,y) 가까이 있는 표식 */
  X.markerAt = function (list, toScreen, x, y) {
    var best = null, bd = 22 * 22;
    list.forEach(function (m) { var p = toScreen(m.lon, m.lat), dd = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y); if (dd < bd) { bd = dd; best = m; } });
    return best;
  };

  // ================================================================ 항해 이정표
  var OCEANS = [
    ['black', '흑해', function (lon, lat) { return lon > 27.4 && lon < 42 && lat > 41.05 && lat < 47.5; }],
    ['med', '지중해', function (lon, lat) { return lon > -6 && lon < 36.5 && lat > 30 && lat < 46.5; }],
    // 브리튼 섬 동쪽만 북해로 친다 (브리스틀 해협·아일랜드해·영국 해협 서쪽은 대서양)
    ['north', '북해·발트해', function (lon, lat) { return lon < 31 && lat > 51 && lat < 66 && lon > (lat < 57 ? -2.2 : -4.5); }],
    ['carib', '카리브해', function (lon, lat) { return lon > -90 && lon < -59 && lat > 8 && lat < 25; }],
    ['red', '홍해', function (lon, lat) { return lon > 32 && lon < 44 && lat > 12 && lat < 30; }],
    ['gulf', '페르시아만', function (lon, lat) { return lon > 47 && lon < 57 && lat > 23 && lat < 31; }],
    ['scs', '남중국해', function (lon, lat) { return lon > 100 && lon < 122 && lat > 0 && lat < 24; }],
    ['ecs', '동중국해', function (lon, lat) { return lon > 118 && lon < 142 && lat > 24 && lat < 42; }],
    ['south', '남빙양', function (lon, lat) { return lat < -55; }],
    ['arctic', '북극해', function (lon, lat) { return lat > 70; }],
    ['indian', '인도양', function (lon, lat) { return lon > 30 && lon < 112 && lat > -50 && lat < 26; }],
    ['pacific', '태평양', function (lon, lat) { return (lon > 142 || lon < -78) && lat > -55 && lat < 62; }],
    ['atlantic', '대서양', function (lon, lat) { return lon > -78 && lon < 20 && lat > -55 && lat < 70; }]
  ];
  X.oceanOf = function (lon, lat) {
    for (var i = 0; i < OCEANS.length; i++) if (OCEANS[i][2](lon, lat)) return OCEANS[i];
    return null;
  };
  /** 하루에 한 번: 새 바다, 적도·회귀선·극권을 넘었는지 본다 */
  X.milestones = async function (lon, lat, prevLat) {
    var s = S(), f = s.fleet, m = s.miles || (s.miles = {});
    var oc = X.oceanOf(lon, lat);
    if (oc && !m['o_' + oc[0]]) {
      m['o_' + oc[0]] = s.day;
      var fame = oc[0] === 'med' || oc[0] === 'atlantic' ? 0 : 12;
      if (fame) {
        s.player.fame += fame;
        UI.toast('새로운 바다 — ' + oc[1] + '에 들어섰다! (명성 +' + fame + ')', 'globe', 5000);
        G.State.log(oc[1] + '에 처음 들어섰다.');
      }
    }
    if (prevLat == null) return;
    // 적도제
    if ((prevLat > 0) !== (lat > 0)) {
      if (!m.equator) {
        m.equator = s.day;
        await UI.say('제독! 적도를 넘었습니다! 처음 넘는 녀석들은 바다의 신께 인사를 올려야지요!\f선원들이 바다의 신 분장을 하고, 처음 적도를 넘는 선원에게 바닷물을 끼얹으며 한바탕 떠들썩한 잔치를 벌였다.', mate('first'));
        s.player.fame += 20; f.discipline = Math.min(100, f.discipline + 15); f.fatigue = Math.max(0, f.fatigue - 12);
        UI.toast('적도제! 사기가 올랐다. (명성 +20)', 'sun', 5000);
        G.State.log('처음으로 적도를 넘었다. 적도제를 열었다.');
      } else UI.toast('적도를 넘었다.', 'sun');
    }
    var TROP = 23.44, POLAR = 66.56;
    [[TROP, 'cancer', '북회귀선'], [-TROP, 'capri', '남회귀선'], [POLAR, 'arcticC', '북극권'], [-POLAR, 'antarcticC', '남극권']].forEach(function (L) {
      if ((prevLat - L[0]) * (lat - L[0]) < 0 && !m[L[1]]) {
        m[L[1]] = s.day;
        var fm = Math.abs(L[0]) > 60 ? 18 : 5;
        s.player.fame += fm;
        UI.toast(L[2] + '을 넘었다. (명성 +' + fm + ')', 'globe', 4200);
        G.State.log(L[2] + '을 처음 넘었다.');
      }
    });
  };

  // ================================================================ 바다의 사건
  /** 가까운, 아직 모르는 발견물 하나 (단서용) */
  function nearUnknown(lon, lat, maxD, filter) {
    var s = S(), best = null, bd = maxD;
    G.DISCOVERIES.forEach(function (d) {
      if (d.how === 'special' || d.how === 'trade' || d.how === 'city' || G.Disc.foundByMe(d.id) || s.hints[d.id] || !G.Disc.available(d)) return;
      if (filter && !filter(d)) return;
      var dd = G.Geo.dist(lon, lat, d.lon, d.lat);
      if (dd < bd) { bd = dd; best = d; }
    });
    return best;
  }
  X.nearUnknown = nearUnknown;

  /** 오늘 바다에서 일어나는 일. ctx: {st, refresh} — 일어나면 true */
  X.seaEvent = async function (ctx) {
    var s = S(), f = s.fleet, l = s.loc;
    var st = ctx.st;
    if (st.lastEvt != null && s.day - st.lastEvt < 4) return false;
    var nearLand = !G.Geo.isSea(l.lon, l.lat, 2.5);
    var cold = Math.abs(l.lat) > 48, trop = Math.abs(l.lat) < 24;
    var table = [
      ['bottle', 9], ['drift', 7], ['crate', 6], ['dolphins', trop ? 8 : 3], ['fish', 7], ['ghost', 3],
      ['wreck', 5], ['birds', nearLand ? 9 : 1], ['redsky', 5], ['fever', 4], ['whales', cold ? 7 : 4],
      ['trader', 5], ['iceberg', cold ? 7 : 0], ['songs', st.calm ? 8 : 2], ['map', 2], ['monster', 1], ['shoal', nearLand ? 6 : 0]
    ];
    // 최근에 겪은 일은 덜 나오게 한다 (같은 사건이 되풀이되지 않도록)
    var recent = s.evtRecent || (s.evtRecent = []);
    table.forEach(function (e) { if (recent.indexOf(e[0]) >= 0) e[1] *= 0.2; });
    var pick = U.weighted(table, function (e) { return e[1]; })[0];
    recent.push(pick); if (recent.length > 6) recent.shift();
    st.lastEvt = s.day;
    var first = mate('first');
    var luck = R.fleetBonus('luck') * 2;                    // 선수상의 행운: 나쁜 일을 피할 가능성
    var deathCap = function (n) { var k = (G.BALANCE && G.BALANCE.eventDeath) || 1; return Math.max(0, Math.min(f.crew - 1, n, Math.max(1, Math.round(f.crew * k)))); };
    switch (pick) {
      case 'bottle': {
        var d = nearUnknown(l.lon, l.lat, 26);
        await UI.say('파도 사이로 초록빛 병 하나가 떠내려왔다. 코르크 마개로 단단히 막혀 있다.', {});
        if (d) {
          G.Disc.addHint(d.id, 'bottle');
          await UI.say('병 속 편지: "…' + d.hint + '"\n\n누군가 남긴 기록이다. 글씨가 번져 있지만 알아볼 수는 있다.', {});
          UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll', 4200);
        } else {
          await UI.say('병 속 편지: "이 편지를 줍는 사람에게. 나는 무사히 고향에 돌아갔다오. 바다가 그대에게도 친절하기를."', {});
          f.discipline = Math.min(100, f.discipline + 4);
        }
        break;
      }
      case 'drift': {
        var n = U.ri(3, 12);
        var v = await UI.ask('바다 위에 표류하는 보트가 있다! 사람이 타고 있는 것 같다.', [{ label: '구조한다', value: 1 }, { label: '지나친다', value: 0 }], first);
        if (v) {
          // 선원으로 받는 것은 배에 자리가 있고, 가는 곳까지(모르면 30일) 먹일 수 있는 만큼 — 나머지는 물·식량을 나눠 주고 가까운 뭍을 가르쳐 준다
          var room = R.crewMax() - f.crew, eta = (G.Scenes.sea.etaDays && G.Scenes.sea.etaDays()) || 30;
          var feed = Math.floor(Math.min(f.food, f.water) / (0.04 * (eta + 5))) - f.crew;
          var k = Math.max(0, Math.min(n, room, feed)); f.crew += k; s.player.fame += 5;
          if (k && G.Scenes.sea.rearmSupplyWarn) G.Scenes.sea.rearmSupplyWarn();
          var why = room <= feed ? ' 배에 자리가 모자라 나머지는' : ' 식량이 넉넉지 않아 나머지는';
          UI.toast('조난자 ' + n + '명을 구조했다.' + (k ? ' ' + k + '명이 선원이 되었다.' : '') + (k < n ? why.replace(' 나머지는', k ? ' 나머지는' : ' 선원으로 받지는 못하고,') + ' 물과 식량을 조금 나눠 주고 가까운 뭍을 가르쳐 주었다.' : ''), 'people', 5000);
        }
        else { f.discipline = Math.max(0, f.discipline - 4); UI.toast('선원들이 수군거린다...', 'people'); }
        break;
      }
      case 'crate': {
        var gold = U.ri(120, 700) + Math.round(Math.min(s.player.fame, 8000) / 20);
        await UI.say('떠다니는 나무 상자를 건져 올렸다. 안에 금화 ' + U.num(gold) + '닢이 들어 있었다!', {});
        s.player.gold += gold;
        break;
      }
      case 'dolphins':
        await UI.say('돌고래 떼가 뱃머리를 따라 헤엄친다. 선원들의 얼굴이 밝아졌다.', {});
        f.fatigue = Math.max(0, f.fatigue - 10); f.discipline = Math.min(100, f.discipline + 5);
        break;
      case 'fish': {
        var got = Math.round(R.dailyUse() * U.ri(3, 8) * (1 + R.skill('ops') * 0.2));
        await UI.say('물고기 떼를 만났다! 그물을 던져 식량 ' + got + '통을 보충했다.', {});
        f.food += got;
        break;
      }
      case 'ghost': {
        var v2 = await UI.ask('안개 속에서 돛이 찢어진 배 한 척이 소리 없이 다가온다... 갑판에 사람의 그림자가 없다.', [{ label: '올라가 본다', value: 1 }, { label: '멀리 피한다', value: 0 }], first);
        if (!v2) { UI.toast('유령선이 안개 속으로 사라졌다. 선원들이 성호를 긋는다.', 'skull'); f.discipline = Math.max(0, f.discipline - 3); break; }
        var p = 0.45 + R.skill('theo') * 0.14 + R.skill('sword') * 0.06 + luck;
        if (U.chance(p)) {
          var g2 = U.ri(600, 2200);
          await UI.say('선실 깊은 곳에서 녹슨 궤짝을 찾았다. 안에는 금화 ' + U.num(g2) + '닢과 누군가의 항해 일지가 있었다.', {});
          s.player.gold += g2; s.player.fame += 6;
          var d2 = nearUnknown(l.lon, l.lat, 40);
          if (d2) { G.Disc.addHint(d2.id, 'ghost'); UI.toast('항해 일지에서 단서를 얻었다: 「' + d2.name + '」', 'scroll', 4200); }
        } else {
          var lost = deathCap(U.ri(2, 6));
          f.crew -= lost; f.discipline = Math.max(0, f.discipline - 12);
          await UI.say('갑판에 오르는 순간 썩은 널빤지가 무너졌다! 선원 ' + lost + '명이 다치고, 모두 겁에 질려 돌아왔다.', {});
        }
        break;
      }
      case 'wreck': {
        var k2 = 0.06 + R.skill('ship') * 0.05;
        f.ships.forEach(function (sh) { sh.hp = Math.min(sh.maxHp, sh.hp + sh.maxHp * k2); });
        await UI.say('난파선의 잔해가 떠 있다. 쓸 만한 목재와 밧줄을 건져 배를 손보았다. (내구력 +' + Math.round(k2 * 100) + '%)', {});
        break;
      }
      case 'birds': {
        var s2 = S(), best = null, bd = 12;
        G.CITY_DATA.forEach(function (c) {
          if (!c.port || s2.known.indexOf(c.id) >= 0 || !R.cityExists(c)) return;
          var dd = G.Geo.dist(l.lon, l.lat, c.lon, c.lat); if (dd < bd) { bd = dd; best = c; }
        });
        if (best && U.chance(0.45 + R.skill('survey') * 0.18)) {
          s2.known.push(best.id);
          var dir = U.dirName(Math.atan2(best.lat - l.lat, G.Geo.wrapLon(best.lon - l.lon)));
          await UI.say('바닷새 떼가 ' + dir + '쪽으로 날아간다. 새들을 따라가 보니 해안에 마을이 보였다 — ' + best.name + '!', mate('surveyor'));
          UI.toast('새로운 항구 「' + best.name + '」' + U.jx(best.name, '을/를') + ' 해도에 적었다.', 'anchor', 4200);
          s2.player.fame += 4;
        } else {
          await UI.say('바닷새가 돛대에 앉았다. 육지가 멀지 않은 모양이다.', first);
          f.discipline = Math.min(100, f.discipline + 2);
        }
        break;
      }
      case 'redsky': {
        var v3 = await UI.ask('아침 하늘이 핏빛으로 물들었다. 늙은 선원이 중얼거린다. "붉은 아침 하늘은 폭풍의 전조요."', [{ label: '돛을 줄이고 대비한다', value: 1 }, { label: '그대로 나아간다', value: 0 }], mate('nav'));
        if (v3) { st.stormGuard = 4; f.fatigue = Math.min(100, f.fatigue + 4); st.slowDays = 2; UI.toast('돛을 줄이고 밧줄을 다시 맸다. (나흘 동안 폭풍 피해 절반, 이틀간 느려짐)', 'wind', 5000); }
        else { st.stormRisk = 4; UI.toast('선원들이 불안한 얼굴로 하늘을 본다...', 'wind'); }
        break;
      }
      case 'fever': {
        var pm = 0.35 + R.medSkill() * 0.2 + R.skill('sci') * 0.08 + luck;
        if (U.chance(pm)) { await UI.say('선원 몇이 열병 기운을 보였지만, 일찍 격리하고 돌본 덕에 번지지 않았다.', mate('first')); }
        else {
          var sick = deathCap(U.ri(2, 7));
          f.crew -= sick; f.fatigue = Math.min(100, f.fatigue + 8);
          await UI.say('배 안에 열병이 돌았다... 선원 ' + sick + '명이 끝내 일어나지 못했다.', {});
        }
        break;
      }
      case 'whales': {
        var art = R.skill('art');
        if (art) {
          var fm = 4 + art * 4;
          s.player.fame += fm;
          await UI.say('거대한 고래 떼가 물을 뿜으며 지나간다. 제독은 그 모습을 화첩에 그려 두었다. (명성 +' + fm + ')', {});
        } else { await UI.say('거대한 고래 떼가 물을 뿜으며 지나간다. 선원들이 넋을 놓고 바라본다.', {}); f.discipline = Math.min(100, f.discipline + 4); }
        break;
      }
      case 'trader': {
        var price = 3 + (s.player.fame > 2000 ? 1 : 0);
        var need = Math.max(0, Math.round(R.dailyUse() * 20 - Math.min(f.food, f.water)));
        var v4 = await UI.ask('작은 상선이 신호를 보낸다. "물과 식량이 남는데, 사겠소? 한 통에 금화 ' + price + '닢이오."', [{ label: '20일분 산다', value: 1 }, { label: '됐소', value: 0 }], { name: '상선 선장', portrait: G.Art.withImg(G.Art.npcSpec('seatrader' + s.day, 'sailor', 'ib'), G.Img.chain.npc('captain')) });
        if (v4) {
          var qty = Math.max(10, need), cost = qty * price;
          if (R.free() < qty) qty = Math.max(0, R.free());
          cost = qty * price;
          if (qty <= 0) { UI.toast('실을 자리가 없다.', 'sack'); break; }
          if (s.player.gold < cost) { UI.toast('금화가 모자란다.', 'coin'); break; }
          s.player.gold -= cost; f.food += qty / 2; f.water += qty / 2;
          UI.toast('식량과 물 ' + qty + '통을 샀다. (금화 ' + U.num(cost) + '닢)', 'bread');
          var tip = X.marketTip();
          if (tip) await UI.say('덤으로 하나 알려 주지. ' + tip, { name: '상선 선장' });
        }
        break;
      }
      case 'iceberg': {
        if (U.chance(0.4 + R.skill('nav') * 0.18 + luck)) { await UI.say('앞쪽에 거대한 빙산이 떠 있다! 조타수가 아슬아슬하게 비껴 지나갔다.', mate('nav')); }
        else {
          var sh = U.pick(f.ships); sh.hp = Math.max(1, sh.hp - sh.maxHp * U.rf(0.1, 0.22));
          await UI.say('안개 속에서 빙산에 부딪쳤다! ' + sh.name + '호의 뱃전이 크게 부서졌다.', {});
        }
        break;
      }
      case 'shoal': {
        // 여울: 바닥이 얕은 배(얕은 흘수·뗏목)는 스치고 지나간다
        var deep = f.ships.filter(function (sh) { return !G.Ships.has(sh, 'shallow') && !G.Ships.has(sh, 'raft'); });
        var some = deep.length < f.ships.length ? ' 바닥이 얕은 배들은 걱정 없이 지나갔다.' : '';
        if (!deep.length) { await UI.say('물빛이 옅어졌다. 여울이다! 하지만 우리 배들은 바닥이 얕아 가볍게 스치고 지나갔다.', mate('nav')); break; }
        if (U.chance(0.35 + R.skill('nav') * 0.15 + luck)) { await UI.say('물빛이 옅어졌다. 여울이다! 측심줄을 던지며 조심조심 빠져나왔다.' + some, mate('nav')); break; }
        var shS = U.pick(deep); shS.hp = Math.max(1, shS.hp - shS.maxHp * U.rf(0.08, 0.18)); f.fatigue = Math.min(100, f.fatigue + 5);
        await UI.say('쿵! ' + shS.name + '호가 여울에 걸렸다! 한나절을 애쓴 끝에 빠져나왔지만 배 밑이 상했다.' + some, {});
        break;
      }
      case 'songs':
        await UI.say('바람이 없는 밤, 누군가 고향 노래를 부르기 시작했다. 하나둘 따라 부르는 소리가 바다 위로 퍼져 나간다.', {});
        f.fatigue = Math.max(0, f.fatigue - 8); f.discipline = Math.min(100, f.discipline + 6);
        break;
      case 'map': {
        var d3 = nearUnknown(l.lon, l.lat, 120, function (x) { return x.cat === 'treasure' || x.cat === 'ruin'; });
        if (!d3) return false;
        await UI.say('그물에 걸린 가죽 통 안에 반쯤 불탄 지도 조각이 들어 있었다. 해적이 남긴 것 같다.', {});
        G.Disc.addHint(d3.id, 'map');
        UI.toast('보물 지도 조각: 「' + d3.name + '」의 단서', 'scroll', 5000);
        break;
      }
      case 'monster': {
        if (R.fleetBonus('monster') && !U.chance(0.3)) { await UI.say('뱃머리 장식이 번뜩이자, 물속의 거대한 그림자가 물러갔다.', {}); break; }
        await UI.say('으악! 거대한 바다 괴물이 배를 덮친다!', {});
        var sh2 = U.pick(f.ships); sh2.hp = Math.max(1, sh2.hp - sh2.maxHp * 0.25); var lost2 = deathCap(U.ri(1, 6)); f.crew -= lost2;
        UI.toast(sh2.name + '호가 부서지고 선원 ' + lost2 + '명을 잃었다.', 'skull');
        break;
      }
    }
    if (ctx.refresh) ctx.refresh();
    return true;
  };

  /** 상인들이 들려주는 시세 이야기 (가 본 도시의 기록을 바탕으로) */
  X.marketTip = function () {
    var L = G.Ledger && G.Ledger.bestRoute ? G.Ledger.bestRoute() : null;
    if (L) return G.GOOD[L.good].name + U.jx(G.GOOD[L.good].name, '은/는') + ' ' + G.CITY_DATA[L.buy].name + '에서 사서 ' + G.CITY_DATA[L.sell].name + '에 가져가면 한 통에 ' + U.num(L.gain) + '닢은 남는다더군.';
    var s = S(), known = s.known.map(function (id) { return G.CITY_DATA[id]; }).filter(function (c) { return c && c.goods && c.goods.length; });
    if (!known.length) return null;
    var c = U.pick(known), g = U.pick(c.goods);
    return G.GOOD[g] ? c.name + '의 ' + G.GOOD[g].name + U.jx(G.GOOD[g].name, '이/가') + ' 싸다더군.' : null;
  };
})(window.G = window.G || {});
