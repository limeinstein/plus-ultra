/* 도시 점령 (G.Conquest): 성문 공격은 통행, 점령은 수비대·증원군 격퇴와 영토 획득.
   저장 s.conquests[도시] = {owner, from, date, day}. 없던 저장은 처음 점령할 때 만든다. */
(function (G) {
  'use strict';
  var Q = G.Conquest = {}, R = G.R, U = G.U, UI = G.UI, fighting = false;
  function S() { return G.Game && G.Game.state; }
  function K() { return G.BALANCE.conquest; }
  function stamp(d) { return d.y * 10000 + d.m * 100 + d.d; }
  Q.holding = function (c) { var s = S(); return s && s.conquests && s.conquests[c.id] || null; };
  /** 도시 문화권·좌표에 맞는 선행 항로. 처음부터 알려진 지역은 null. */
  Q.route = function (c) {
    var areas = K().routeAreas || [];
    for (var i = 0; i < areas.length; i++) {
      var a = areas[i];
      if (c.region === a.region && (!a.lon || (c.lon >= a.lon[0] && c.lon <= a.lon[1])) && (!a.lat || (c.lat >= a.lat[0] && c.lat <= a.lat[1]))) return a.disc;
    }
    return (K().regionRoutes || {})[c.region] || null;
  };
  function routeKnown(id) {
    if (G.Frontier) return G.Frontier.known(id);
    var d = S().disc && S().disc[id]; return !!(d && (d.me || d.rival));
  }
  function european(owner) {
    var d = G.RELATIONS, p = d && (d.alias[owner] || (d.powers[owner] && owner));
    if (p) return d.christian.indexOf(p) >= 0;
    // 관계표에 없는 유럽 소국도 유럽 본토의 도시 자료에서 알아낸다. 오스만·아랍 왕조는 제외.
    return G.CITY_DATA.some(function (c) { return c.region <= 2 && c.rel !== 'I' && c.nation === owner; });
  }
  Q.profile = function (c) {
    var holy = c.name !== '예루살렘' && (c.name === '메카' || c.name === '메디나' || (c.rel === 'I' && c.flags.indexOf('H') >= 0));
    var capital = K().capitals.indexOf(c.name) >= 0;
    var tier = holy ? 'holy' : capital ? 'capital' : c.size >= 3 ? 'large' : c.size >= 2 ? 'medium' : 'small';
    var waves = K().waves[tier].slice();
    return { tier: tier, waves: waves, total: U.sum(waves, function (n) { return n; }), protected: holy || capital, militia: capital && c.name === '한양',
      label: { holy: '이슬람 성지', capital: '주요 수도', large: '대도시', medium: '중규모 도시', small: '소규모 도시' }[tier] };
  };
  /** 금지 사유는 메뉴와 실행 직전에 함께 검사한다. 성문 공격에는 적용하지 않는다. */
  Q.block = function (c) {
    var s = S();
    if (!s || !c || !R.cityExists(c) || c.outpost || c.colony != null) return '이곳은 점령 대상 도시가 아닙니다.';
    if (stamp(s.date) < K().from) return '고아 함락 이후인 1510년 11월 25일부터 도시 점령을 시도할 수 있습니다.';
    if (Q.holding(c) || R.isHomeNation(c)) return '이미 우리나라가 다스리는 도시입니다.';
    if (european(R.cityOwner(c))) return '유럽 국가가 다스리는 도시는 점령을 위해 공격할 수 없습니다.';
    if (c.region <= 2 && c.rel !== 'I') return '유럽 본토 도시는 점령할 수 없습니다.';
    if ((c.nation === '조선' || (c.style === 'kr' && c.rel === 'K')) && stamp(s.date) < K().joseonFrom) return '조선 도시는 임진왜란이 시작되는 1592년 5월 23일까지 점령을 시도할 수 없습니다.';
    var route = Q.route(c);
    if (route && !routeKnown(route)) {
      var discovery = G.DISC[route], frontier = G.Frontier && discovery && G.Frontier.of(discovery);
      return '이 지역을 점령하려면 먼저 「' + (frontier ? frontier.name : discovery ? discovery.name : route) + '」 항로가 발견되어야 합니다. 직접 발견하거나 경쟁자의 발표로 항로가 알려진 뒤에 시도하십시오.';
    }
    return null;
  };
  Q.note = function (c) {
    var block = Q.block(c); if (block) return block;
    var p = Q.profile(c);
    return p.label + ' · 수비대 ' + U.num(p.waves[0]) + '명 · 증원 ' + p.waves.slice(1).map(function (n) { return U.num(n) + '명'; }).join(' → ') + ' · 총 ' + U.num(p.total) + '명' + (p.protected ? ' 이상 동원 / 점령 불가' : '') + (p.militia ? ' · 관군과 의병이 함께 방어' : '');
  };
  Q.menuItem = function (c) {
    if (c.outpost || c.colony != null || R.isHomeNation(c)) return null;
    return { label: '도시 점령', icon: 'sword', sub: Q.note(c), onClick: function () { return Q.assault(c); } };
  };
  function force(s) {
    if (s.loc.mode === 'land') return Math.min(s.fleet.crew, s.loc.party || 0);
    if (s.loc.via === 'land') return Math.min(s.fleet.crew, s.landReturn ? s.landReturn.party : 0);
    return s.fleet.crew;
  }
  Q.assault = async function (c) {
    if (fighting) return false;
    var s = S(), block = Q.block(c);
    if (block) { await UI.say(block, G.Scenes.mateSpeaker('first')); return false; }
    var p = Q.profile(c), party = force(s), loc = s.loc;
    if (party < 1) { await UI.say('공략에 나설 대원이 없습니다.', G.Scenes.mateSpeaker('first')); return false; }
    var text = c.name + ' 도시 점령\n' + Q.note(c) + '\n우리 공략대 ' + U.num(party) + '명. 성문 공격과 별개의 전투입니다. 두 차례 증원군까지 모두 격퇴해야 합니다.\n' +
      (p.militia ? '관군과 전국 각지의 의병이 한양 방어에 참전합니다. 의병이 계속 집결하므로 한양은 점령할 수 없습니다. ' : p.protected ? '국가 방위군이 계속 집결하므로 이 도시는 점령할 수 없습니다. ' : '') + '공격하면 악명 +' + K().notoriety + '.';
    fighting = true;
    var oldParty = loc.party, oldLon = loc.lon, oldLat = loc.lat, started = false;
    try {
      if (!(await UI.confirm(text, '점령을 시도한다', '그만둔다'))) return false;
      if (S() !== s || s.loc !== loc || Q.block(c)) return false;
      // 원정대 규모를 다시 읽는다. 해상 선원과 뭍의 탐험대를 중복 동원하지 않는다.
      loc.party = force(s); loc.lon = c.lon; loc.lat = c.lat; started = true;
      s.player.notoriety += K().notoriety;
      G.State.log(c.name + ' 점령을 시도했다. ' + Q.note(c));
      for (var i = 0; i < p.waves.length; i++) {
        if (loc.party <= 0) return false;
        var label = p.militia ? ['관군 수비대', '1차 의병 증원군', '2차 관군·의병 연합군'][i] : i ? i + '차 증원군' : '수비대';
        if (i) {
          var militiaNews = p.militia ? i === 1 ? '전국 각지에서 모인 의병이 한양 방어에 참전했습니다. ' : '추가 의병과 지방 관군이 한양 방어에 합류했습니다. ' : '';
          await UI.say(militiaNews + c.name + '에 ' + label + ' ' + U.num(p.waves[i]) + '명이 도착했습니다. 남은 공략대는 ' + U.num(loc.party) + '명입니다.', G.Scenes.mateSpeaker('first'));
          if (!(await UI.confirm('증원군과 계속 싸우겠습니까? 물러나면 점령은 이루어지지 않습니다.', '계속 싸운다', '철수한다'))) return false;
        }
        var result = await G.Scenes.land.landBattle(c.name + ' ' + label, p.waves[i], false, { kind: 'garrison', guns: true, conquest: true, winText: c.name + ' ' + label + ' 격퇴' });
        if (S() !== s || s.loc !== loc) return false;
        if (result !== 'win') { await UI.say('공략대가 물러났습니다. 도시 점령에 실패했습니다.', G.Scenes.mateSpeaker('first')); return false; }
      }
      if (p.protected) {
        await UI.say(p.militia ? '관군을 돕기 위해 전국에서 의병이 끊임없이 모여듭니다. 한양의 관군과 의병이 함께 항전하여 점령할 수 없습니다. 공략대가 철수합니다.' : '지방군과 국가 방위군이 계속 집결합니다. ' + c.name + '은 점령할 수 없습니다. 공략대가 철수합니다.', G.Scenes.mateSpeaker('first'));
        G.State.log(c.name + ' 공략을 중단했다. ' + (p.militia ? '관군과 의병의 참전 및 계속되는 추가 동원으로 점령 불가.' : p.label + '의 추가 동원으로 점령 불가.'));
        return false;
      }
      var owner = s.player.nation === 'PT' ? '포르투갈' : s.date.y < 1516 ? '카스티야' : '에스파냐';
      var holdings = s.conquests || (s.conquests = {});
      holdings[c.id] = { owner: owner, from: R.cityOwner(c), date: { y: s.date.y, m: s.date.m, d: s.date.d }, day: s.day };
      G.State.log(c.name + '의 수비대와 증원군을 모두 격퇴하여 ' + owner + ' 영토로 점령했다.');
      await UI.say(c.name + U.jx(c.name, '을/를') + ' 점령했습니다. 이제 ' + owner + '의 영토입니다.', G.Scenes.mateSpeaker('first'));
      return true;
    } finally {
      if (started) {
        if (loc.mode !== 'land') {
          if (loc.via === 'land' && s.landReturn) s.landReturn.party = Math.min(s.landReturn.party, loc.party);
          if (oldParty == null) delete loc.party; else loc.party = Math.min(oldParty, loc.party);
        }
        loc.lon = oldLon; loc.lat = oldLat;
      }
      fighting = false;
    }
  };
})(window.G = window.G || {});
