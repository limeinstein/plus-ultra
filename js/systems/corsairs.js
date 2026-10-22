/* 해적 함대의 꼴과 이름난 해적의 함대 (G.Corsair) — 2026-10-22 사용자 요청
   ■ 이름 없는 해적 (바다에 나타날 때 sea.js spawnNpcs → G.SeaFolk.decorate 를 감싸 고친다)
     · 아랍 해적 (지중해 바르바리 · 인도양): 다우 2~4척 + 기함 (대형 갤리 · 1555년 갤리어스가 나오면 갤리어스도)
     · 서양 사략 해적 (대서양 · 북해 · 아메리카): 카라벨 · 대형 카라벨 3~5척
     · 초반: 척수는 우리 함대 척수 + 1 + 명성 1,500마다 1척을 넘지 않는다. 기함도 세기(K)가 낮으면 작다 (푸스타 → 갤리 → 대형 갤리 / 카라벨 → 대형 카라벨).
     · 동중국해·남양(왜구 등)은 그대로.
   ■ 이름난 해적 (G.Captains 가 고른다 — 해적 떼가 나타날 때 namedChance(3%) · 그 바다·그 해에 활약하는 해적이 있을 때)
     · 하이레딘 바르바로사: 대형 갤리 5척 → 갤리어스가 나오는 해(1555)부터 갤리어스 5척.
     · 그 밖의 아랍 해적(오루츠·투르구트·케말 레이스 …): 대형 갤리(갤리어스) 기함 + 갤리·지벡 4척.
       전술 swarm: 부하 배들은 무조건 갈고리를 걸고 뛰어든다(백병전). 기함은 뒤에서 포를 쏘다가 부하 배가 다 없어지면 돌진해 뛰어든다.
     · 서양 사략 해적(플뢰리·르 클레르·오말리 …): 중카락·대형카락 5척, 갤리온이 나오면(1515) 기함만 갤리온, 프리깃이 나오면(1580) 기함만 프리깃.
       전술 crane: 부하 배들이 우리 기함을 학익진으로 감싸 포격만 한다(포위되면 적의 포격이 세진다). 기함은 사정거리 끝에서 쏜다.
     · 선원·포는 거의 다 채웠다 (crewK · gunK). 일기토에는 그 해적이 직접 나온다.
   ■ 해전 쪽: js/scenes/battle.js enemyTactic (npc.tactic) · 포위 사격(envelop) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var CO = {};
  G.Corsair = CO;
  function S() { return G.Game && G.Game.state; }
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.corsair = G.BALANCE.corsair || {
    namedChance: 0.03,          // 해적 떼가 이름난 해적일 확률
    fameStep: 1500,             // 이름 없는 해적: 명성 이만큼마다 한 척 더 올 수 있다
    named: { crewK: 0.92, gunK: 0.75 }    // 이름난 해적: 선원·포문을 거의 다 채운다
  };
  function B() { return G.BALANCE.corsair; }
  var ARAB = { med: 1, ind: 1 }, WEST = { atl: 1, north: 1, amer: 1 };
  // 이름난 해적의 갈래 — 적히지 않은 사람(철새 출신 두목 등)은 바다로 정한다
  var STYLE = { pr_hayreddin: 'hayreddin', pr_oruc: 'arab', pr_ishak: 'arab', pr_turgut: 'arab', pr_sinan: 'arab', pr_kemal: 'arab', pr_kurtoglu: 'arab', pr_salih: 'arab', pr_muratreis: 'arab',
    pr_fleury: 'west', pr_leclerc: 'west', pr_sores: 'west', pr_omalley: 'west', pr_coullon: 'west', pr_bissipat: 'west', pr_danser: 'west', pr_ward: 'west', pr_jansz: 'west' };
  CO.STYLE = STYLE;
  function avail(id, y) { var t = G.SHIP[id]; return !!t && (!t.from || y >= t.from); }
  CO.styleOf = function (n) {
    var c = n && n.cap; if (!c) return null;
    if (STYLE[c.id]) return STYLE[c.id];
    return ARAB[n.zone] ? 'arab' : WEST[n.zone] ? 'west' : null;
  };

  // ---------------------------------------------------------------- 이름 없는 해적
  /** 이 해적 떼가 올 수 있는 척수 (초반에는 적게) */
  function capCount() {
    var s = S();
    return Math.max(1, s.fleet.ships.length + 1 + Math.floor((s.player.fame || 0) / B().fameStep));
  }
  function setShips(n, list) {
    n.ships = n.ships || [];
    n.ships.length = 0;                       // 같은 배열을 고친다 (sea.js 가 이 배열로 배 그림을 미리 푼다)
    list.forEach(function (id) { n.ships.push(id); });
    n.n = n.ships.length;
  }
  CO.generic = function (n) {
    var s = S(), y = s.date.y, K = n.K || 0;
    if (ARAB[n.zone]) {
      var total = Math.min(1 + U.ri(2, 4), capCount());
      var flag = K < 0.15 ? 'fusta' : K < 0.35 ? 'galley' : 'greatgalley';
      if (flag === 'greatgalley' && K >= 0.7 && avail('galleass', y) && U.chance(0.5)) flag = 'galleass';
      var a = [flag]; for (var i = 1; i < total; i++) a.push('dhow');
      setShips(n, a); n.style = 'arab';
    } else if (WEST[n.zone]) {
      var tw = Math.min(U.ri(3, 5), capCount());
      var b = [K < 0.35 ? 'caravel' : 'lcaravel'];
      for (var j = 1; j < tw; j++) b.push(U.chance(0.15 + K * 0.5) ? 'lcaravel' : 'caravel');
      setShips(n, b); n.style = 'west';
    }
    // 위용: 기함이 거대한 보선이면 작은 해적 떼(2척 이하)는 덤비지 않는다 — 척수가 바뀌었으니 다시 본다
    var f0 = s.fleet.ships[0];
    var awe = !!(f0 && G.Ships && G.Ships.has(f0, 'awe') && n.n <= 2);
    if (n.awed && !awe) { n.awed = false; n.hostile = true; }
    else if (!n.awed && awe) { n.awed = true; n.hostile = false; }
    return n;
  };

  // ---------------------------------------------------------------- 이름난 해적
  CO.named = function (n) {
    var c = n.cap, st = CO.styleOf(n), y = S().date.y; if (!c || !st) return n;
    var a = [];
    if (st === 'hayreddin') {
      var big = avail('galleass', y) ? 'galleass' : 'greatgalley';
      for (var i = 0; i < 5; i++) a.push(big);
      n.tactic = 'swarm';
    } else if (st === 'arab') {
      a.push(avail('galleass', y) && U.chance(0.5) ? 'galleass' : 'greatgalley');
      for (var j = 0; j < 4; j++) a.push(avail('xebec', y) && U.chance(0.5) ? 'xebec' : 'galley');
      n.tactic = 'swarm';
    } else {
      var hc = avail('hcarrack', y) ? 'hcarrack' : 'lcarrack';
      var fl = avail('frigate', y) ? 'frigate' : avail('galleon', y) ? 'galleon' : hc;
      a.push(fl);
      for (var k = 0; k < 4; k++) a.push(U.chance(0.5) ? hc : 'lcarrack');
      n.tactic = 'crane';
    }
    setShips(n, a);
    n.K = 1; n.crewK = B().named.crewK; n.gunK = B().named.gunK; n.style = st;
    n.awed = false; n.hostile = true;
    var short = c.name.replace(/\s*\(.*\)$/, '');
    n.names = [short + '의 기함'];   // 나머지는 「해적선 2호」…
    // 일기토에 그 해적이 직접 나선다 (하이레딘은 역사 인물 초상)
    n.boss = st === 'hayreddin' && G.HIST_FIG && G.HIST_FIG.hayreddin
      ? { hist: 'hayreddin', line: '바다의 주인이 누구인지 가르쳐 주마!', str: 90, atk: 15, def: 8, skill: 3, mar: 92, int: 80, cha: 85, look: 'pirate' }
      : { name: short, line: st === 'west' ? '사략허가장은 내 칼에 새겨져 있다!' : '알라의 이름으로, 갑판을 내놓아라!', str: U.ri(78, 88), atk: U.ri(12, 15), def: U.ri(5, 8), skill: 2, mar: U.ri(80, 90), int: U.ri(55, 75), cha: U.ri(60, 80), look: 'pirate' };
    n.tacticNote = n.tactic === 'swarm'
      ? short + '의 배들이 갈고리를 들고 몰려온다! 기함은 뒤에 남아 포를 쏜다 — 부하 배가 다 쓰러지면 기함이 돌진해 온다.'
      : short + '의 함대가 날개를 편다 — 학익진으로 우리 기함을 감싸 포격한다! 에워싸이지 않게 빠져나가자.';
    return n;
  };

  // ---------------------------------------------------------------- 잇기
  function hook() {
    var SF = G.SeaFolk; if (!SF || CO.hooked) return;
    CO.hooked = true;
    if (G.BALANCE.captains) G.BALANCE.captains.namedPirate = B().namedChance;   // 이름난 해적은 3% 안팎으로 드물다 (G.Captains.assign)
    var od = SF.decorate;
    SF.decorate = function (n) {
      var plain = n && n.kind === 'pirate' && !n.court && !n.princess && !n.exp && !n.chaser;
      if (plain) { try { CO.generic(n); } catch (e) { console.error(e); } }
      var r = od.apply(this, arguments);
      if (plain && n.cap) { try { CO.named(n); n.label = SF.label(n); } catch (e) { console.error(e); } }
      return r;
    };
  }
  CO.hook = hook;
  hook();
  if (!CO.hooked) document.addEventListener('DOMContentLoaded', hook);
})(window.G = window.G || {});
