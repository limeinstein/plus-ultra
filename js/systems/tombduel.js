/* 무덤 발견물의 일기토 (G.TombDuel)
   무덤 발견물(js/data/tombguards.js에 적힌 것)에 다가가면 그 고장의 무사가 나와 앞을 막는다.
   · 무덤지기(guard): 조상의 무덤을 지키는 후손·무덤지기. 이기면 길을 내주고 명성이 더 오른다(guardFame).
     지거나 물러서면 그날은 발견하지 못하고, retryDays일이 지나야 다시 다가갈 수 있다.
   · 도굴꾼(rob): 보물을 탐해 무덤을 파헤치는 자. 이기면 도굴꾼이 모아 둔 금붙이를 챙긴다(robLoot).
     지거나 물러서면 무덤은 찾지만 부장품(발견 유물)을 도굴꾼이 들고 달아난다 — 명성도 줄어든다(robbedFame).
   G.Disc.find가 발견을 기록하기 전에 TD.meet를 부른다. 한 무덤에서 한 번 결판이 나면(이기거나 도굴당하면) 다시 나오지 않는다.
   저장: s.disc[id].tomb = {done: 1, res: 'win'|'robbed'} · 막힌 날: s.disc[id].tombBlock = 다시 다가갈 수 있는 날(s.day)
   조정값: G.BALANCE.tombDuel */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var TD = G.TombDuel = {};
  function S() { return G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.tombDuel) || {}; }
  function val(v, y) { return typeof v === 'function' ? v(y) : v; }

  /** 이 발견물에 나오는 무사 (없으면 null) */
  TD.spec = function (d) { return (d && G.TOMB_GUARDS && G.TOMB_GUARDS[d.id]) || null; };
  /** 아직 결판이 나지 않았는가 */
  TD.pending = function (d) { var g = TD.spec(d), st = d && S().disc[d.id]; return !!(g && !(st && st.tomb && st.tomb.done)); };
  /** 무덤지기에게 밀려나 아직 다시 다가갈 수 없는가 */
  TD.blocked = function (d) { var st = d && S().disc[d.id]; return !!(st && st.tombBlock && S().day < st.tombBlock && TD.pending(d)); };
  /** 며칠 뒤에 다시 갈 수 있는가 */
  TD.blockLeft = function (d) { var st = d && S().disc[d.id]; return st && st.tombBlock ? Math.max(0, st.tombBlock - S().day) : 0; };

  /** 무사의 모습 (이름·초상·일기토 능력) */
  TD.fighter = function (d) {
    var g = TD.spec(d), y = S().date.y, k = 1 + ((d.pw || 3) - 3) * (K().statPerPw == null ? 0.04 : K().statPerPw);
    var A = G.Art, portrait = A.withImg(A.npcSpec('tomb' + d.id, g.role || 'soldier', g.style || 'ib', 'm'), (g.pic ? [g.pic] : []).concat(['portraits/npc-roles/' + (g.style || 'ib') + '/' + (g.role || 'soldier')]));
    return {
      name: val(g.name, y), title: val(g.title, y), portrait: portrait, look: g.kind === 'rob' ? 'brawler' : 'rival', sprite: g.sprite || null,
      str: Math.round(g.str * k), atk: Math.round(g.atk * k), def: g.def, skill: g.skill, mar: Math.min(99, Math.round(g.mar * k)), int: g.int, cha: g.cha, style: g.move || 'slash'
    };
  };
  function speaker(f) { return { name: f.name, portrait: f.portrait, lang: 3 }; }

  /** 발견을 기록하기 전에 부른다 → {go: 발견을 이어 가는가, res, fameK, loot, stolen: 유물을 잃었는가}
      how: 'land' | 'sea' | 'city' (바다에서는 갑판 위에서 싸운다) */
  TD.meet = async function (d, how) {
    var none = { go: true, res: null, fameK: 1, loot: 0, stolen: false };
    if (!TD.pending(d)) return none;
    var s = S(), g = TD.spec(d), k = K(), st = s.disc[d.id] || (s.disc[d.id] = {}), y = s.date.y;
    if (TD.blocked(d)) return { go: false, res: 'blocked' };
    var f = TD.fighter(d), who = speaker(f), rob = g.kind === 'rob', place = how === 'sea' ? 'deck' : how === 'city' ? 'city' : 'explore';
    var meet = val(g.meet, y) || [];
    if (meet[0]) await UI.say(meet[0], {});
    UI.toast((rob ? '도굴꾼' : '무덤지기') + ' — ' + f.title, rob ? 'skull' : 'shield', 5200);
    if (meet[1]) await UI.say(meet[1], who);
    var px = G.Games.proxy ? G.Games.proxy() : null, pd = px && G.MATE[px.id];
    var opts = [{ label: rob ? '도굴꾼과 맞선다' : '정정당당히 겨룬다', value: 'duel' }];
    if (pd) opts.push({ label: '부관 ' + pd.name + '에게 맡긴다', value: 'proxy' });
    opts.push({ label: rob ? '물러선다 (도굴꾼이 부장품을 가져간다)' : '물러선다 (' + (k.retryDays || 30) + '일 뒤에 다시)', value: 'back' });
    var v = await UI.ask(rob ? '도굴꾼이 무덤 앞을 막아섰다. 어떻게 할까?' : '무덤을 지키는 이가 길을 막는다. 어떻게 할까?', opts, G.Scenes.mateSpeaker('first'));
    var res = 'flee', ld = {};
    if (v === 'duel' || v === 'proxy') {
      if (v === 'proxy') await UI.say(U.pick(['제독께서 나서실 것까지 없습니다. 제가 상대하지요.', '이 사람은 제게 맡겨 주십시오.']), G.Scenes.mateSpeaker('first'));
      await UI.say(g.dare, who);
      res = await G.Games.duel(f, v === 'proxy' ? { mate: px, place: place } : { place: place });
      ld = G.Games.lastDuel || {};
    }
    var fm = ld.mate, fd = fm && G.MATE[fm.id];
    if (res === 'win') {
      st.tomb = { done: 1, res: 'win' }; delete st.tombBlock;
      G.Fame.add('bt', (k.battleFame || 4) + (fm ? -1 : 0));
      if (fm) fm.loyal = Math.min(100, (fm.loyal || 70) + 4);
      await UI.say(g.win, who);
      if (ld.secret) { s.player.notoriety = (s.player.notoriety || 0) + 1; UI.toast('무덤 앞에서 비밀무기를 꺼낸 일로 뒷말이 돈다. (악명 +1)', 'skull', 3500); }
      if (rob) {
        var loot = Math.round((G.Disc.value ? G.Disc.value(d) : d.val) * (k.robLoot == null ? 0.08 : k.robLoot));
        s.player.gold += loot;
        G.State.log(d.name + '에서 ' + f.name + U.jx(f.name, '을/를') + ' 물리쳤다. (금화 ' + U.num(loot) + '닢)');
        UI.toast('도굴꾼이 모아 둔 금붙이를 챙겼다 — 금화 ' + U.num(loot) + '닢', 'coin', 4200);
        return { go: true, res: 'win', fameK: k.robFame || 1.1, loot: loot, stolen: false };
      }
      G.State.log(d.name + '에서 ' + f.name + U.jx(f.name, '와/과') + ' 겨루어 이기고 길을 얻었다.');
      return { go: true, res: 'win', fameK: k.guardFame || 1.25, loot: 0, stolen: false };
    }
    // 졌거나 물러섰다
    if (fm && res === 'lose') fm.hurt = s.day + 20;
    if (res === 'lose' || res === 'flee') await UI.say(v === 'back' ? (rob ? '흥, 현명한 선택이다. 구경이나 해라!' : '돌아가시오. 마음이 바뀌면 그때 다시 오시오.') : g.lose, who);
    if (fd && res === 'lose') await UI.say('면목 없습니다, 제독... 보통 솜씨가 아니었습니다. (' + fd.name + U.jx(fd.name, '은/는') + ' 20일 동안 다쳐 능력이 절반이 된다)', G.Scenes.mateSpeaker('first'));
    if (rob) {
      st.tomb = { done: 1, res: 'robbed' };
      G.State.log(f.name + U.jx(f.name, '이/가') + ' ' + d.name + '의 부장품을 들고 달아났다.');
      UI.toast('도굴꾼이 부장품을 들고 달아났다 — 무덤은 찾았지만 손에 넣은 것은 없다', 'skull', 5200);
      return { go: true, res: 'robbed', fameK: k.robbedFame || 0.7, loot: 0, stolen: true };
    }
    st.tombBlock = s.day + (k.retryDays || 30);
    if (v !== 'back' && s.fleet) s.fleet.fatigue = Math.min(100, (s.fleet.fatigue || 0) + (k.loseFatigue || 10));
    UI.toast(d.name + U.jx(d.name, '은/는') + ' ' + (k.retryDays || 30) + '일 뒤에야 다시 다가갈 수 있다.', 'shield', 4800);
    return { go: false, res: v === 'back' ? 'back' : res };
  };
})(window.G = window.G || {});
