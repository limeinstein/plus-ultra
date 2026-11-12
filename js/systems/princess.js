/* 왕실 특명 (G.Princess). 첫 전령은 통합 명성 50,000의 총각 제독에게 온다.
   소환일 사이에는 달력으로 최소 7년이 지나야 하며, 진행 중인 사건은 끝날 때까지 이어진다.
   stage 0 알현 → 1 단서나 함대 → 2 구출 → 3 본국 귀환. 혼인 시 해당 궁정의 작위와 부마 칭호를 받는다.
   현재 사건은 state.princess, 이전 결말과 혼인은 state.princessPast에 보관한다. 인물 ID 없는 옛 사건은 블랑카다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var P = {};
  G.Princess = P;
  var stories = G.PRINCESS_STORIES, L = G.PRINCESS_LINES;
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.princess) || {}; }
  function SP() { return G.Sponsor; }
  /** 아내가 되면 다른 아내(여급)와 똑같이 다룬다 — 술집 목록(G.MAIDS)에는 넣지 않는다 */
  stories.forEach(function (d) {
    if (G.MAID && !G.MAID[d.id]) G.MAID[d.id] = { id: d.id, city: d.city, name: d.name, like: 'brave', royal: true };
  });

  P.st = function () { var s = S(); return s && s.princess ? s.princess : null; };
  function lady(id) {
    var key = id || (P.st() || {}).lady;
    return stories.find(function (d) { return d.id === key; }) || G.PRINCESS;
  }
  function trail() {
    var d = lady();
    return d.port == null ? '레반트 바다(알렉산드리아·베이루트·안티오키아 앞바다)' : G.CITY_DATA[d.port].name + ' 앞바다';
  }
  function objective(d, stage) {
    if (stage === 1) return d.clue && !d.fleet ? G.CITY_DATA[d.port].name + '에 가서 왕녀가 남긴 단서를 찾는다'
      : trail() + '에서 ' + (d.fleet || '바르바리 해적 함대') + U.jx(d.fleet || '바르바리 해적 함대', '을/를') + ' 찾는다';
    return d.clue ? G.CITY_DATA[d.target].name + '에 가서 ' + d.name + U.jx(d.name, '을/를') + ' 돕는다' : '홍해 수에즈 만의 해적 요새로 간다';
  }
  function markCity(id) { var known = S().known; if (known.indexOf(id) < 0) known.push(id); }
  function nextCall(date) {
    var y = date.y + K().intervalYears;
    return U.dateNum({ y: y, m: date.m, d: Math.min(date.d, U.daysInMonth(y, date.m)) });
  }
  function shot(d, key) {
    return G.EventShot.show({ key: d.id + '_' + key, title: d.title, cast: [{ half: ['portraits/princesses/' + d.id + '_half'], lead: true }] });
  }
  /** 지금 진행 중인가 (부름 ~ 귀환 전) */
  P.active = function () { var p = P.st(); return !!p && !p.end; };
  function fill(t, extra) {
    var s = S(), p = P.st(), sp = p && G.SPONSOR[p.sp], d = lady();
    var o = { name: s.player.name, king: sp ? SP().holderName(sp) + ' ' + SP().honor(sp) : '군주', city: G.CITY_DATA[sp ? sp.city : d.city].name,
      realm: realm().name, royal: d.name, short: d.short };
    for (var k in extra || {}) o[k] = extra[k];
    return String(t).replace(/\{(\w+)\}/g, function (m, a) { return o[a] != null ? o[a] : m; });
  }
  async function say(lines, who, extra) { lines = [].concat(lines); for (var i = 0; i < lines.length; i++) await UI.say(fill(lines[i], extra), who); }
  /** 해당 왕녀의 궁정에서 지금 알현할 수 있는 군주 */
  function crown(d) {
    var ids = G.COURT.realms[(d || lady()).realm].sponsors;
    for (var i = 0; i < ids.length; i++) { var sp = G.SPONSOR[ids[i]]; if (sp && SP().present(sp)) return sp; }
    return null;
  }
  P.crown = crown;
  function realm() { return G.COURT.realms[lady().realm]; }
  function single() { var p = S().player; return !p.wife && p.g !== 'f' && !(p.heir && p.heir.sex === 'f'); }   // 뒤를 이은 딸 제독은 p.g 가 비어 있다 (2026-10-23)
  P.single = single;
  /** 왕녀의 고유 얼굴·무릎상 */
  P.speaker = function (id) {
    var D = lady(id), A = G.Art, sp = { name: D.name, lang: 3, special: true };
    try {
      var key = 'portraits/princesses/' + D.id;
      var spec = A.npcSpec(D.id, 'noble', G.CITY_DATA[D.city].style, 'f');
      sp.portrait = A.withImg(spec, [key]);
      sp.half = [key + '_half'];
      sp.rigId = D === G.PRINCESS ? 'npc:princess_es' : 'npc:' + D.id;
      // 마주 보는 대화: 왼쪽 제독 · 오른쪽 왕녀 (서 있는 모습)
      if (G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.tavern && G.Scenes.city.B.tavern.playerSpeaker) { sp.layout = 'duo'; sp.side = 'right'; sp.partner = G.Scenes.city.B.tavern.playerSpeaker(); sp.emotion = 'neutral'; }
    } catch (e) { /* 그림이 없어도 말은 한다 */ }
    return sp;
  };
  function me() { var s = S(); return { name: s.player.name, rigId: 'player', portrait: s.player.portrait, half: G.Img.chain.heroHalf ? G.Img.chain.heroHalf() : null }; }
  function mate() { return G.Scenes.mateSpeaker('first'); }
  function dueText(p) { return U.fmtDate({ y: Math.floor(p.due / 10000), m: Math.floor(p.due / 100) % 100, d: p.due % 100 }); }
  P.remain = function () { var p = P.st(); return p && p.due ? U.dayIndex({ y: Math.floor(p.due / 10000), m: Math.floor(p.due / 100) % 100, d: p.due % 100 }) - U.dayIndex(S().date) : 0; };
  function den() { var d = K().den; return { lat: d[0], lon: d[1] }; }

  // ================================================================ 날마다: 부름 · 기한
  P.daily = function () {
    var s = S(), out = [], b = K(); if (!s || !s.player) return out;
    var p = P.st();
    if (!p || p.end) {
      if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return out;
      if ((s.player.fame || 0) < b.fame || (!p && !single())) return out;
      if (p) {
        // 옛 저장의 day0도 전령이 처음 온 날이다.
        if (!p.nextCall) p.nextCall = nextCall(U.addDays(s.date, p.day0 == null ? 0 : p.day0 - s.day));
        if (U.dateNum(s.date) < p.nextCall) return out;
      }
      var past = s.princessPast || {}, last = p && lady().id;
      var choices = stories.filter(function (d) { return d.id !== last && !past[d.id] && crown(d); });
      if (!choices.length) return out;
      var d = U.pick(choices), sp = crown(d);
      if (p) { past[last] = { end: p.end, wed: p.wed || 0 }; s.princessPast = past; }
      s.princess = p = { lady: d.id, stage: 0, sp: sp.id, day0: s.day, nextCall: nextCall(s.date) };
      markCity(sp.city);
      var msg = fill(L.news);
      out.push({ icon: 'crown', text: msg, history: true });
      G.State.log(msg);
      return out;
    }
    if (p.stage >= 1 && p.due) {
      var left = P.remain();
      if (left === 180 && !p.reminded && p.stage < 3) { p.reminded = 1; out.push({ icon: 'hourglass', text: fill(L.remind) }); }
      if (left < 0 && p.stage < 3) { out.push({ icon: 'crown', text: fill(lady().clue ? '{realm} 궁정이 {royal}의 수색을 다른 이에게 맡겼다.' : L.late), history: true }); fail('late'); }
    }
    // 특명을 내린 자리가 비면 같은 나라에서 알현할 수 있는 군주에게로 옮긴다
    if (!SP().present(G.SPONSOR[p.sp])) { var sp2 = crown(); if (sp2) p.sp = sp2.id; }
    return out;
  };
  function fail(why) {
    var p = P.st(), s = S(); if (!p) return;
    p.end = 'failed'; p.why = why;
    var lost = -G.Fame.add('so', -K().fail);
    G.State.log('왕실의 특명 「' + (lady().title || '사라진 왕녀') + '」 — ' + (why === 'quit' ? '내려놓았다' : '기한 안에 해내지 못했다') + '. (명성 −' + lost + ')');
    if (G.Game.refreshHud) G.Game.refreshHud();
  }

  // ================================================================ 왕궁
  /** 왕궁 메뉴에 붙는 줄 */
  P.palaceItems = function (sp) {
    var p = P.st(); if (!p || p.end || !sp || sp.id !== p.sp) return [];
    var sub = p.stage === 0 ? '부르심' : p.stage === 3 ? '왕녀를 모셨다' : '찾는 중';
    return [{ label: lady().title || '사라진 왕녀', icon: 'crown', sub: sub, onClick: function () { return P.audience(sp); } }];
  };
  /** 알현 인사 뒤: 부름이 있거나 왕녀를 모셨으면 군주가 먼저 꺼낸다. 무언가 했으면 true */
  P.onEnter = async function (sp) {
    var p = P.st(); if (!p || p.end || !sp || sp.id !== p.sp) return false;
    if (p.stage === 0 && !p.heard) { await P.audience(sp); return true; }
    if (p.stage === 3) { await P.audience(sp); return true; }
    return false;
  };
  var audienceBusy = false;
  P.audience = async function (sp) {
    if (audienceBusy) return;
    audienceBusy = true;
    try { return await audience(sp); } finally { audienceBusy = false; }
  };
  async function audience(sp) {
    var p = P.st(), s = S(), D = lady(); if (!p || p.end || !sp || sp.id !== p.sp) return;
    var who = SP().speaker(sp);
    if (p.stage === 0) {
      if (!p.heard) {
        p.heard = 1;
        if (D.clue) {
          var pic = await shot(D, 'clue');
          try { await say('{name}, 내 딸 {short}의 행방을 알아봐 주게. ' + D.clue, who); }
          finally { await pic.stop(); }
        } else await say(L.plea, who);
      }
      var v = await UI.ask(L.ask, [{ label: '왕녀를 찾아 나선다 (기한 ' + K().years + '년)', value: 'yes' }, { label: '조금 더 생각해 본다', value: 'later' }], who);
      if (v !== 'yes') { await say(L.later, who); return; }
      p.stage = 1; p.taken = U.dateNum(s.date);
      p.due = U.dateNum(U.addDays(s.date, Math.round(K().years * 365)));
      (D.port == null ? [78, 121] : [D.port]).forEach(markCity);
      G.State.log(SP().holderName(sp) + '의 특명을 받았다 — ' + D.name + U.jx(D.name, '을/를') + ' 찾아 데려온다 (기한 ' + dueText(p) + ')');
      await say(D.clue ? '고맙네. {due}까지 무사히 돌아오기를 기다리겠네.' : L.yes, who, { due: dueText(p) });
      UI.toast('왕실의 특명 — ' + objective(D, 1), 'crown', 6000);
      return;
    }
    if (p.stage === 3) return report(sp);
    var where = objective(D, p.stage);
    var a = await UI.ask('…그 아이의 소식은 아직인가?\n(' + where + ' · 남은 ' + Math.max(0, P.remain()) + '일)', [
      { label: '반드시 찾아오겠다고 아뢴다', value: 0 }, { label: '특명을 내려놓는다 (명성 −' + K().fail + ')', value: 'quit' }], who);
    if (a === 'quit') {
      if (!(await UI.confirm('국왕의 특명을 내려놓겠습니까? 다시는 받을 수 없습니다.', '내려놓는다', '그만둔다', '사라진 왕녀'))) return;
      fail('quit');
      await UI.say('…그런가. 그대를 탓하지는 않겠네. 물러가게.', who);
      return;
    }
    await UI.say('부탁하네. 그 아이에게는 그대밖에 없네.', who);
  }

  // ================================================================ 바다: 레반트의 해적 함대 · 요새의 함대
  /** 우리 배 둘레의 바다 한 점 — 좁은 바다(수에즈 만)에서도 찾도록 차츰 가까이·좁게 */
  function seaPoint(lon, lat, minD, maxD) {
    var tries = [[minD, maxD, 0.4], [minD * 0.6, maxD * 0.7, 0.2], [0.35, 0.9, 0.08]];
    for (var k = 0; k < tries.length; k++) {
      for (var i = 0; i < 16; i++) {
        var ang = U.rf(0, Math.PI * 2), dist = U.rf(tries[k][0], tries[k][1]), x = lon + Math.cos(ang) * dist, y = lat + Math.sin(ang) * dist;
        if (G.Geo.isSea(x, y, tries[k][2])) return { lon: x, lat: y };
      }
    }
    return null;
  }
  function inLevant(l) {
    var d = lady();
    if (d.port != null) {
      var dock = G.CITY_DATA[d.port].dock;
      return G.Geo.dist(l.lon, l.lat, dock[1], dock[0]) < K().trailRadius;
    }
    return (K().levant || []).some(function (q) { var c = G.CITY_DATA[q[0]], d = c && (c.dock || [c.lat, c.lon]); return d && G.Geo.dist(l.lon, l.lat, d[1], d[0]) < q[1]; });
  }
  P.inLevant = function () { var l = S().loc; return inLevant(l); };
  P.nearDen = function (r) { var l = S().loc, d = den(); return G.Geo.dist(l.lon, l.lat, d.lon, d.lat) < (r || K().denSea); };
  /** sea.js spawnNpcs: 특명과 얽힌 해적 함대를 내보낸다 (없으면 null) */
  P.spawn = function (npcs) {
    var p = P.st(), s = S(), b = K(); if (!p || p.end || !G.Ships) return null;
    var d = lady();
    if (d.clue && (!d.fleet || p.stage !== 1)) return null;
    if (p.stage !== 1 && p.stage !== 2) return null;
    if (npcs.some(function (n) { return n.princess; }) || (p.cd && s.day < p.cd)) return null;
    var l = s.loc, kind = p.stage === 1 ? 'levant' : 'den';
    if (kind === 'levant' ? !inLevant(l) : !P.nearDen()) return null;
    var q = seaPoint(l.lon, l.lat, 1.0, 1.9); if (!q) return null;
    var n = kind === 'levant' ? b.levantShips : b.denShips, Kk = kind === 'levant' ? b.levantK : b.denK, zone = G.Ships.zone(q.lon, q.lat);
    p.cd = s.day + b.cool;
    UI.toast(d.fleet ? d.fleet + ' 발견!' : kind === 'levant' ? L.levantSight : L.denSight, kind === 'levant' ? 'skull' : 'castle', 5600);
    return { id: 'princess_' + Math.random().toString(36).slice(2), kind: 'pirate', princess: kind, lady: d.id, lon: q.lon, lat: q.lat, heading: Math.atan2(l.lat - q.lat, G.Geo.wrapLon(l.lon - q.lon)),
      n: n, K: Kk, spd: U.rf(1.1, 1.35), life: 30, hostile: true, zone: zone, label: d.fleet || (kind === 'levant' ? '바르바리 해적 함대' : '「검은 매」의 함대'),
      ships: G.Ships.enemyTypes('pirate', zone, null, n, Kk, s.date.y) };
  };
  /** sea.js encounter: 그 함대를 만났을 때의 말 */
  P.encounterText = function (n) {
    if (!n || !n.princess) return '';
    var d = lady(n.lady);
    if (d.fleet) return d.fleet + '입니다, 제독! 기함에 단서가 있습니다.';
    return (n.princess === 'levant' ? L.levantMeet : L.denMeet).replace('{n}', n.n);
  };
  /** battle.js finish: 이긴 해전을 특명에 적는다 (말은 P.tell에서) */
  P.afterBattle = function (npc, res, ships, lines) {
    var p = P.st(), D = lady(); if (!p || p.end || !npc || !npc.princess || (npc.lady || G.PRINCESS.id) !== D.id) return;
    if (res !== 'win') { p.cd = S().day + K().cool; return; }
    if (npc.princess === 'levant' && p.stage === 1) {
      if (D.fleet) {
        advanceTrail(D); p.tell = 'trace';
        if (lines) lines.push('<b>기함에서 왕녀의 행방을 밝힐 단서를 찾았다.</b>');
        return;
      }
      p.stage = 2; p.tell = 'levant';
      if (lines) lines.push('<b>사로잡은 해적 두목이 무언가 털어놓으려 한다…</b>');
      G.State.log('레반트 바다에서 바르바리 해적 함대를 쳐부쉈다 — 왕녀는 홍해 수에즈 만의 해적 요새로 끌려갔다고 한다.');
    } else if (npc.princess === 'den' && p.stage === 2) {
      rescue('sea');
      if (lines) lines.push('<b>요새의 함대를 무찔렀다! 요새로 뛰어들어 ' + D.name + '를 구해 냈다.</b>');
    }
  };
  /** 해전 결과 창 뒤에: 사로잡은 두목의 실토 · 왕녀와의 만남 */
  P.tell = async function () {
    var p = P.st(); if (!p || !p.tell) return;
    var t = p.tell; p.tell = null;
    var pirate = { name: '바르바리 해적 두목' };
    if (t === 'trace') await UI.say(lady().trace, mate());
    else if (t === 'levant') {
      await say(L.levantWon, pirate);
      await say(L.levantMate, mate());
      var s = S(); [79].forEach(function (id) { if (s.known.indexOf(id) < 0) s.known.push(id); });   // 카이로를 해도에
      UI.toast('다음: 홍해 수에즈 만 서쪽 기슭의 해적 요새 — 뭍으로는 카이로 동쪽 사막, 배로는 아덴에서 홍해로', 'map', 7000);
    } else if (t === 'rescued') await meet();
  };
  function rescue(how) {
    var p = P.st(), D = lady(); p.stage = 3; p.how = how; p.tell = 'rescued';
    G.Fame.add('bt', Math.round(K().fameBt / 3));
    G.State.log((D.clue ? G.CITY_DATA[D.target].name : '홍해 수에즈 만의 해적 요새') + '에서 ' + D.name + U.jx(D.name, '을/를') + ' 구해 냈다.');
    if (G.Growth) G.Growth.once('princess_rescue', 'mar', 1, '왕실의 특명으로 왕녀를 구했다');
  }
  async function meet() {
    var w = P.speaker(), p = P.st();
    if (lady().clue) {
      var d = lady(), pic = await shot(d, 'rescue');
      try { await UI.say(d.found, w); } finally { await pic.stop(); }
      UI.toast(fill(L.aboard), 'crown', 6000);
      return;
    }
    var pc = G.EventShot ? await G.EventShot.princess('es_rescued', { how: p && p.how }) : null;   // 이벤트 샷 (js/art/eventshot.js)
    try {
      await UI.say(L.rescued[0], w);
      await UI.say(L.rescued[1], me());
      await UI.say(L.rescued[2], w);
    } finally { if (pc) await pc.stop(); }
    UI.toast(fill(L.aboard), 'crown', 6000);
  }

  // ================================================================ 뭍: 요새 수비대
  /** land.js runDay: 요새에 다가가면 수비대가 막아선다. api = { battle(이름, 수, o) → 'win'|'lose'|… , stop() } */
  P.onLand = async function (api) {
    var p = P.st(), s = S(), b = K(); if (!p || p.end || p.stage !== 2 || lady().clue) return;
    var l = s.loc, d = den(); if (G.Geo.dist(l.lon, l.lat, d.lon, d.lat) >= b.denLand) return;
    if (p.cd && s.day < p.cd) return;
    if (api && api.stop) api.stop();
    var n = Math.round(U.clamp((l.party || 20) * b.denGuard[0], b.denGuard[1], b.denGuard[2]));
    await UI.say(L.denLandSight, {});
    var v = await UI.ask(L.denLandAsk.replace('{n}', n), [{ label: '쳐들어간다', value: 1 }, { label: '물러나 때를 본다', value: 0 }], mate());
    if (!v) { p.cd = s.day + 1; return; }
    var res = api && api.battle ? await api.battle('「검은 매」 요새 수비대', n, { kind: 'bandit', guns: true }) : 'lose';
    if (res === 'win') { rescue('land'); await P.tell(); }
    else { p.cd = s.day + b.cool; await UI.say(L.denLost, mate()); }
  };

  // ================================================================ 귀환 · 혼인
  async function report(sp) {
    var p = P.st(), s = S(), b = K(), who = SP().speaker(sp), w = P.speaker();
    var face = SP().face ? SP().face(sp) : null;
    var pc = lady().clue ? await shot(lady(), 'return') : await G.EventShot.princess('es_return', { city: G.CITY_DATA[sp.city], kingHalf: face && face.half });
    try { return await reportIn(sp, p, s, b, who, w); } finally { if (pc) await pc.stop(); }
  }
  async function reportIn(sp, p, s, b, who, w) {
    var D = lady();
    if (D.homecoming) await UI.say(D.homecoming, {});
    else await UI.say(fill(L.reunion[0]), who);
    await UI.say(fill(L.reunion[1]), who);
    p.end = 'done';
    G.Fame.add('bt', b.fameBt - Math.round(b.fameBt / 3)); G.Fame.add('so', b.fameSo);
    if (SP().rel && SP().addTrust) { var rel = SP().rel(sp.id); SP().addTrust(rel, 20); }
    s.stats.princess = 1;
    if (single()) {
      await UI.say(L.proposeKing, who);
      await UI.say(D.proposal || L.proposePrincess, w);
      var v = await UI.ask(L.proposeAsk, [{ label: '왕녀와 혼인한다', value: 'yes' }, { label: '정중히 사양한다', value: 'no' }], me());
      if (v === 'yes') {
        if (G.FamEv && G.FamEv.stopPic) await G.FamEv.stopPic();
        var pw = D.clue ? await shot(D, 'wedding') : await G.EventShot.princess('es_wedding', { city: G.CITY_DATA[sp.city] });
        try { return await wed(sp, who, w); } finally { if (pw) await pw.stop(); }
      }
      await UI.say(L.wedNo, w);
    } else await UI.say(L.marriedKing, who);
    await UI.say(L.reward, who);
    s.player.gold += b.gold;
    G.State.log(SP().holderName(sp) + '에게 ' + D.name + U.jx(D.name, '을/를') + ' 모셔 왔다 — 하사금 금화 ' + U.num(b.gold) + '닢.');
    await UI.alert('<div class="center" style="font-size:22px;font-weight:700">사라진 왕녀를 찾았다</div><br>하사금 금화 <b>' + U.num(b.gold) + '</b>닢 · 전투 명성 +' + G.Fame.mul('bt', b.fameBt) + ' · 사교 명성 +' + G.Fame.mul('so', b.fameSo), '국왕의 특명');
    G.Game.refreshHud();
    if (s.settings.autosave !== false && G.State.save) G.State.save(0);
  }
  async function wed(sp, who, w) {
    var p = P.st(), s = S(), b = K(), CT = G.Court, rl = realm(), D = lady();
    await say(D.clue ? '두 사람의 혼인을 허락하네. {name}, 오늘부터 그대도 우리 왕실의 가족일세.' : L.wedYes, who);
    s.player.wife = D.id;
    if (G.Growth) G.Growth.once('wed', 'cha', 1, '혼인 — 한 집안의 가장이 되었다');   // 첫 혼인: 매력 +1 (js/systems/growth.js)
    s.maids = s.maids || {}; s.maids[D.id] = { aff: 100 };
    p.wed = U.dateNum(s.date);
    s.player.gold += b.dowry; G.Fame.add('so', b.fameWed);
    // 왕녀의 궁정에서 작위 한 칸. 외국 제독은 그 궁정의 명예 작위를 받는다.
    var up = null, extra = 0;
    if (CT && rl) {
      var c = CT.state(), n = CT.rank(rl), lad = CT.ladder(rl);
      if (n < lad.length) { c.titles[rl.id] = n + 1; up = CT.title(rl, n + 1); }
      else { extra = Math.round(b.dowry / 2); s.player.gold += extra; }
    }
    await UI.say(L.wedPrincess, w);
    var tt = up ? CT.fullName(up, true) : '';
    G.State.log(D.name + U.jx(D.name, '과/와') + ' 혼인했다. ' + rl.name + ' 왕실의 부마가 되었다' + (tt ? ' — ' + tt + '로 특진' : '') + '. (지참금 금화 ' + U.num(b.dowry) + '닢)');
    if (G.Audio) G.Audio.sfx('discover');
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">' + rl.name + ' 왕실의 사위</div><div style="font-size:36px;font-weight:800;margin:6px 0">부마</div>' +
      (up ? '<div style="font-size:20px">' + U.esc(CT.fullName(up, true)) + '<span class="muted"> — 한 계급 특진</span></div>' : '<div class="muted">이미 가장 높은 작위라 특진 대신 금화 ' + U.num(extra) + '닢을 더 받았다</div>') + '</div><br>' +
      D.name + U.jx(D.name, '과/와') + ' 혼인했다! 고향 ' + G.CITY_DATA[s.player.home].name + '의 자택에서 기다리고 있을 것이다.<br>' +
      '지참금 금화 <b>' + U.num(b.dowry) + '</b>닢 · 사교 명성 +' + G.Fame.mul('so', b.fameSo + b.fameWed) + ' · 전투 명성 +' + G.Fame.mul('bt', b.fameBt), '혼인');
    UI.toast('부마가 되었다!' + (up ? ' — ' + up.ko : ''), 'crown', 6500);
    G.Game.refreshHud();
    if (s.settings.autosave !== false && G.State.save) G.State.save(0);
  }

  // ================================================================ 칭호 · 수첩 · 할 일
  /** 「부마」 — 왕녀가 아내일 때만 (대를 이은 자녀에게는 이어지지 않는다) */
  P.title = function () {
    var s = S(), p = P.st(), wife = s && s.player.wife;
    if (!p || !wife) return '';
    var record = lady().id === wife ? p : (s.princessPast || {})[wife];
    return record && record.wed ? '부마' : '';
  };
  P.wifeRealm = function () { return G.COURT.realms[lady(S().player.wife).realm].name; };
  P.html = function () {
    var p = P.st(); if (!p || p.end) return '';
    var sp = G.SPONSOR[p.sp], left = P.remain(), D = lady();
    var step = p.stage === 0 ? G.CITY_DATA[sp.city].name + ' 왕궁에서 전령을 보낸 군주를 알현한다'
      : D.clue && p.stage < 3 ? objective(D, p.stage) : p.stage === 1 ? '<b>레반트 바다</b>(알렉산드리아·베이루트·안티오키아 앞바다)에서 왕녀를 붙잡아 간 바르바리 해적 함대를 찾아 쳐부순다'
      : p.stage === 2 ? '<b>홍해 수에즈 만 서쪽 기슭의 해적 요새</b>로 간다 — 뭍으로는 카이로·알렉산드리아 성문에서 동쪽 사막을 건너고, 배로는 아프리카를 돌아 아덴에서 홍해를 거슬러 오른다'
      : '<span class="good-text">' + D.name + U.jx(D.name, '을/를') + ' 모셨다 — ' + G.CITY_DATA[sp.city].name + ' 왕궁으로 돌아가 아뢴다</span>';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">왕실의 특명 — ' + (D.title || '사라진 왕녀') + '</h4><div class="kv">' +
      '<div>왕녀</div><div>' + D.name + '</div>' +
      (D.clue && p.stage === 2 ? '<div>단서</div><div>' + D.trace + '</div>' : '') +
      '<div>군주</div><div>' + SP().holderName(sp) + ' (' + sp.title + ', ' + G.CITY_DATA[sp.city].name + ')</div>' +
      '<div>할 일</div><div>' + step + '</div>' +
      '<div>기한</div><div>' + (p.stage === 0 ? '수락한 날부터 ' + K().years + '년' : dueText(p) + (p.stage === 3 ? ' (구출 완료)' : ' (남은 ' + Math.max(0, left) + '일)')) + '</div>' +
      '<div>보상</div><div>하사금·명성' + (single() ? ' — 그리고 왕녀의 마음' : '') + '</div></div>';
  };
  /** 「이 도시에서 할 일」 판 */
  P.todo = function (c) {
    var p = P.st(); if (!p || p.end || !c) return [];
    var sp = G.SPONSOR[p.sp], D = lady();
    if (atStoryCity(D, p, c)) return [{ icon: 'map', hot: true, text: objective(D, p.stage), onClick: async function () {
      await P.arrival(c);
      if (G.Game.scene === G.Scenes.city && S().loc.city === c.id) G.Scenes.city.main();
    } }];
    if (sp && sp.city === c.id && (p.stage === 0 || p.stage === 3)) return [{ kind: 'palace', arg: R.bldArg ? R.bldArg(sp) : undefined, icon: 'crown', hot: true, text: p.stage === 0 ? SP().holderName(sp) + '께서 부르신다 — ' + (D.title || '사라진 왕녀') : D.name + U.jx(D.name, '을/를') + ' 국왕께 모셔 간다' }];
    return [];
  };
  function advanceTrail(d) {
    P.st().stage = 2; markCity(d.target);
    G.State.log(d.title + ' — ' + d.trace);
  }
  function atStoryCity(d, p, c) {
    return d.clue && ((p.stage === 1 && !d.fleet && c.id === d.port) || (p.stage === 2 && c.id === d.target));
  }
  var visiting = false;
  P.arrival = async function (c) {
    var p = P.st(), d = lady(); if (!p || p.end || !c || visiting) return;
    if (atStoryCity(d, p, c)) {
      visiting = true;
      try {
        if (p.stage === 1) { advanceTrail(d); await UI.say(d.trace, {}); }
        else {
          await UI.say(d.greeting, P.speaker());
          var choices = d.choices.map(function (label, i) { return { label: label, value: String(i) }; });
          choices.push({ label: '단서를 더 살핀다', value: 'later' });
          var v = await UI.ask(d.question, choices, mate());
          if (String(v) === String(d.answer)) { rescue('city'); await P.tell(); }
          else if (v !== 'later' && v != null) await UI.say(d.retry, {});
        }
      } finally { visiting = false; }
      return;
    }
    if (p.stage !== 0 || p.heraldDone) return;
    var rl = realm(); if (!rl || rl.lands.indexOf(R.cityOwner(c)) < 0) return;
    p.heraldDone = 1;
    var C = G.Scenes.city;
    await C.say(C.npc('herald', '왕실 전령'), fill(L.herald));
  };
})(window.G = window.G || {});
