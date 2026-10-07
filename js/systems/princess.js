/* 사라진 에스파냐 왕녀 (G.Princess) — 자료·대사·조정값: js/data/princess.js (G.BALANCE.princess)
   ■ 언제: 통합 명성이 50,000을 넘고, 결혼하지 않은 남자 제독이면(나라는 가리지 않는다) 에스파냐 국왕이 부른다 — 소식 · 세빌리아 왕궁 메뉴 「사라진 왕녀」.
   ■ 흐름 (state.princess.stage)
     0 부름을 받았다 → 왕궁에서 특명을 받는다 (기한 3년)
     1 레반트 바다(알렉산드리아·베이루트·안티오키아 앞바다)에서 바르바리 해적 함대를 쳐부순다 → 사로잡은 두목이 「홍해, 수에즈 만의 요새」라고 실토
     2 수에즈 만 서쪽 기슭의 해적 요새로 — 배로 오면 요새의 함대와 해전 / 뭍으로(카이로·알렉산드리아 성문에서 사막을 건너) 오면 요새 수비대와 육상전
     3 왕녀를 모셨다 → 특명을 내린 군주에게 돌아간다
     → 그때 결혼하지 않았으면 왕녀가 청혼한다: 받아들이면 아내(G.MAID['m_princess'] — 다른 아내와 똑같이 집에서 기다린다), 에스파냐 작위 한 칸 특진, 칭호 「부마」.
       결혼한 몸이거나 사양하면 하사금과 명성만.
   ■ 끝: done(구출을 마침) · failed(기한을 넘김 / 특명을 내려놓음). 한 번뿐이다.
   ■ 저장: state.princess = { stage, sp, due, day0, cd, tell, wed, end }. 없으면 아직 일어나지 않은 것(옛 저장 그대로 열린다). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var P = {};
  G.Princess = P;
  var D = G.PRINCESS, L = G.PRINCESS_LINES;
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.princess) || {}; }
  function SP() { return G.Sponsor; }
  /** 아내가 되면 다른 아내(여급)와 똑같이 다룬다 — 술집 목록(G.MAIDS)에는 넣지 않는다 */
  if (G.MAID && D && !G.MAID[D.id]) G.MAID[D.id] = { id: D.id, city: D.city, name: D.name, like: 'brave', royal: true };

  P.st = function () { var s = S(); return s && s.princess ? s.princess : null; };
  /** 지금 진행 중인가 (부름 ~ 귀환 전) */
  P.active = function () { var p = P.st(); return !!p && !p.end; };
  function fill(t, extra) {
    var s = S(), p = P.st(), sp = p && G.SPONSOR[p.sp], o = { name: s.player.name, king: sp ? SP().holderName(sp) + ' ' + SP().honor(sp) : '에스파냐 국왕', city: sp ? G.CITY_DATA[sp.city].name : '세빌리아' };
    for (var k in extra || {}) o[k] = extra[k];
    return String(t).replace(/\{(\w+)\}/g, function (m, a) { return o[a] != null ? o[a] : m; });
  }
  async function say(lines, who, extra) { lines = [].concat(lines); for (var i = 0; i < lines.length; i++) await UI.say(fill(lines[i], extra), who); }
  /** 특명을 내리는 군주: 카스티야 국왕(세빌리아) → 없으면 아라곤 국왕 */
  function crown() {
    var ids = (G.COURT && G.COURT.realms.ES && G.COURT.realms.ES.sponsors) || ['es_crown'];
    for (var i = 0; i < ids.length; i++) { var sp = G.SPONSOR[ids[i]]; if (sp && SP().present(sp)) return sp; }
    return null;
  }
  P.crown = crown;
  function realm() { return G.COURT && G.COURT.realms.ES; }
  function single() { var p = S().player; return !p.wife && p.g !== 'f'; }
  P.single = single;
  /** 왕녀의 얼굴 (그림이 있으면 images/portraits/npc/princess_es) */
  P.speaker = function () {
    var A = G.Art, sp = { name: D.name, lang: 3 };
    try {
      var spec = A.npcSpec('princess_es', 'noble', 'ib', 'f'), base = A.portraitKeys ? A.portraitKeys(spec) || [] : [];
      sp.portrait = A.withImg(spec, ['portraits/npc/princess_es'].concat(base));
      sp.half = ['portraits/npc/princess_es_half'].concat(G.Img.chain.halfOf ? G.Img.chain.halfOf(base) : []);   // 무릎상: 전용 그림 → 이베리아 귀부인 그림
      sp.rigId = 'npc:princess_es';
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
    if (!p) {
      if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return out;
      if ((s.player.fame || 0) < b.fame || !single()) return out;
      var sp = crown(); if (!sp) return out;
      s.princess = p = { stage: 0, sp: sp.id, day0: s.day };
      var msg = fill(L.news);
      out.push({ icon: 'crown', text: msg, history: true });
      G.State.log(msg);
      return out;
    }
    if (p.end) return out;
    if (p.stage >= 1 && p.due) {
      var left = P.remain();
      if (left === 180 && !p.reminded && p.stage < 3) { p.reminded = 1; out.push({ icon: 'hourglass', text: L.remind }); }
      if (left < 0 && p.stage < 3) { out.push({ icon: 'crown', text: L.late, history: true }); fail('late'); }
    }
    // 특명을 내린 궁정이 비면 지금 있는 에스파냐 궁정으로 옮긴다
    if (!SP().present(G.SPONSOR[p.sp])) { var sp2 = crown(); if (sp2) p.sp = sp2.id; }
    return out;
  };
  function fail(why) {
    var p = P.st(), s = S(); if (!p) return;
    p.end = 'failed'; p.why = why;
    var lost = -G.Fame.add('so', -K().fail);
    G.State.log('국왕의 특명 「사라진 왕녀」를 ' + (why === 'quit' ? '내려놓았다' : '기한 안에 해내지 못했다') + '. (명성 −' + lost + ')');
    if (G.Game.refreshHud) G.Game.refreshHud();
  }

  // ================================================================ 왕궁
  /** 왕궁 메뉴에 붙는 줄 */
  P.palaceItems = function (sp) {
    var p = P.st(); if (!p || p.end || !sp || sp.id !== p.sp) return [];
    var sub = p.stage === 0 ? '부르심' : p.stage === 3 ? '왕녀를 모셨다' : '찾는 중';
    return [{ label: '사라진 왕녀', icon: 'crown', sub: sub, onClick: function () { return P.audience(sp); } }];
  };
  /** 알현 인사 뒤: 부름이 있거나 왕녀를 모셨으면 군주가 먼저 꺼낸다. 무언가 했으면 true */
  P.onEnter = async function (sp) {
    var p = P.st(); if (!p || p.end || !sp || sp.id !== p.sp) return false;
    if (p.stage === 0 && !p.heard) { await P.audience(sp); return true; }
    if (p.stage === 3) { await P.audience(sp); return true; }
    return false;
  };
  P.audience = async function (sp) {
    var p = P.st(), s = S(); if (!p || p.end) return;
    var who = SP().speaker(sp);
    if (p.stage === 0) {
      if (!p.heard) { p.heard = 1; await say(L.plea, who); }
      var v = await UI.ask(L.ask, [{ label: '왕녀를 찾아 나선다 (기한 ' + K().years + '년)', value: 'yes' }, { label: '조금 더 생각해 본다', value: 'later' }], who);
      if (v !== 'yes') { await say(L.later, who); return; }
      p.stage = 1; p.taken = U.dateNum(s.date);
      p.due = U.dateNum(U.addDays(s.date, Math.round(K().years * 365)));
      [78, 121].forEach(function (id) { if (s.known.indexOf(id) < 0) s.known.push(id); });   // 알렉산드리아·베이루트를 해도에
      G.State.log(SP().holderName(sp) + '의 특명을 받았다 — 해적에게 납치된 ' + D.name + '를 찾아 데려온다 (기한 ' + dueText(p) + ')');
      await say(L.yes, who, { due: dueText(p) });
      UI.toast('국왕의 특명 — 레반트 바다(알렉산드리아·베이루트 앞바다)에서 해적 함대를 찾는다', 'crown', 6000);
      return;
    }
    if (p.stage === 3) return report(sp);
    var where = p.stage === 1 ? '레반트 바다에서 왕녀를 붙잡아 간 해적 함대를 찾는다' : '홍해 수에즈 만의 해적 요새로 간다';
    var a = await UI.ask('…그 아이의 소식은 아직인가?\n(' + where + ' · 남은 ' + Math.max(0, P.remain()) + '일)', [
      { label: '반드시 찾아오겠다고 아뢴다', value: 0 }, { label: '특명을 내려놓는다 (명성 −' + K().fail + ')', value: 'quit' }], who);
    if (a === 'quit') {
      if (!(await UI.confirm('국왕의 특명을 내려놓겠습니까? 다시는 받을 수 없습니다.', '내려놓는다', '그만둔다', '사라진 왕녀'))) return;
      fail('quit');
      await UI.say('…그런가. 그대를 탓하지는 않겠네. 물러가게.', who);
      return;
    }
    await UI.say('부탁하네. 그 아이에게는 그대밖에 없네.', who);
  };

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
    return (K().levant || []).some(function (q) { var c = G.CITY_DATA[q[0]], d = c && (c.dock || [c.lat, c.lon]); return d && G.Geo.dist(l.lon, l.lat, d[1], d[0]) < q[1]; });
  }
  P.inLevant = function () { var l = S().loc; return inLevant(l); };
  P.nearDen = function (r) { var l = S().loc, d = den(); return G.Geo.dist(l.lon, l.lat, d.lon, d.lat) < (r || K().denSea); };
  /** sea.js spawnNpcs: 특명과 얽힌 해적 함대를 내보낸다 (없으면 null) */
  P.spawn = function (npcs) {
    var p = P.st(), s = S(), b = K(); if (!p || p.end || !G.Ships) return null;
    if (p.stage !== 1 && p.stage !== 2) return null;
    if (npcs.some(function (n) { return n.princess; }) || (p.cd && s.day < p.cd)) return null;
    var l = s.loc, kind = p.stage === 1 ? 'levant' : 'den';
    if (kind === 'levant' ? !inLevant(l) : !P.nearDen()) return null;
    var q = seaPoint(l.lon, l.lat, 1.0, 1.9); if (!q) return null;
    var n = kind === 'levant' ? b.levantShips : b.denShips, Kk = kind === 'levant' ? b.levantK : b.denK, zone = G.Ships.zone(q.lon, q.lat);
    p.cd = s.day + b.cool;
    UI.toast(kind === 'levant' ? L.levantSight : L.denSight, kind === 'levant' ? 'skull' : 'castle', 5600);
    return { id: 'princess_' + Math.random().toString(36).slice(2), kind: 'pirate', princess: kind, lon: q.lon, lat: q.lat, heading: Math.atan2(l.lat - q.lat, G.Geo.wrapLon(l.lon - q.lon)),
      n: n, K: Kk, spd: U.rf(1.1, 1.35), life: 30, hostile: true, zone: zone, label: kind === 'levant' ? '바르바리 해적 함대' : '「검은 매」의 함대',
      ships: G.Ships.enemyTypes('pirate', zone, null, n, Kk, s.date.y) };
  };
  /** sea.js encounter: 그 함대를 만났을 때의 말 */
  P.encounterText = function (n) {
    if (!n || !n.princess) return '';
    return (n.princess === 'levant' ? L.levantMeet : L.denMeet).replace('{n}', n.n);
  };
  /** battle.js finish: 이긴 해전을 특명에 적는다 (말은 P.tell에서) */
  P.afterBattle = function (npc, res, ships, lines) {
    var p = P.st(); if (!p || p.end || !npc || !npc.princess) return;
    if (res !== 'win') { p.cd = S().day + K().cool; return; }
    if (npc.princess === 'levant' && p.stage === 1) {
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
    if (t === 'levant') {
      await say(L.levantWon, pirate);
      await say(L.levantMate, mate());
      var s = S(); [79].forEach(function (id) { if (s.known.indexOf(id) < 0) s.known.push(id); });   // 카이로를 해도에
      UI.toast('다음: 홍해 수에즈 만 서쪽 기슭의 해적 요새 — 뭍으로는 카이로 동쪽 사막, 배로는 아덴에서 홍해로', 'map', 7000);
    } else if (t === 'rescued') await meet();
  };
  function rescue(how) {
    var p = P.st(); p.stage = 3; p.how = how; p.tell = 'rescued';
    G.Fame.add('bt', Math.round(K().fameBt / 3));
    G.State.log('홍해 수에즈 만의 해적 요새에서 ' + D.name + '를 구해 냈다.');
  }
  async function meet() {
    var w = P.speaker();
    await UI.say(L.rescued[0], w);
    await UI.say(L.rescued[1], me());
    await UI.say(L.rescued[2], w);
    UI.toast(fill(L.aboard), 'crown', 6000);
  }

  // ================================================================ 뭍: 요새 수비대
  /** land.js runDay: 요새에 다가가면 수비대가 막아선다. api = { battle(이름, 수, o) → 'win'|'lose'|… , stop() } */
  P.onLand = async function (api) {
    var p = P.st(), s = S(), b = K(); if (!p || p.end || p.stage !== 2) return;
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
    await UI.say(fill(L.reunion[0]), who);
    await UI.say(fill(L.reunion[1]), who);
    p.end = 'done';
    G.Fame.add('bt', b.fameBt - Math.round(b.fameBt / 3)); G.Fame.add('so', b.fameSo);
    if (SP().rel && SP().addTrust) { var rel = SP().rel(sp.id); SP().addTrust(rel, 20); }
    s.stats.princess = 1;
    if (single()) {
      await UI.say(L.proposeKing, who);
      await UI.say(L.proposePrincess, w);
      var v = await UI.ask(L.proposeAsk, [{ label: '왕녀와 혼인한다', value: 'yes' }, { label: '정중히 사양한다', value: 'no' }], me());
      if (v === 'yes') return wed(sp, who, w);
      await UI.say(L.wedNo, w);
    } else await UI.say(L.marriedKing, who);
    await UI.say(L.reward, who);
    s.player.gold += b.gold;
    G.State.log(SP().holderName(sp) + '에게 ' + D.name + '를 모셔 왔다 — 하사금 금화 ' + U.num(b.gold) + '닢.');
    await UI.alert('<div class="center" style="font-size:22px;font-weight:700">사라진 왕녀를 찾았다</div><br>하사금 금화 <b>' + U.num(b.gold) + '</b>닢 · 전투 명성 +' + b.fameBt + ' · 사교 명성 +' + b.fameSo, '국왕의 특명');
    G.Game.refreshHud();
    if (s.settings.autosave !== false && G.State.save) G.State.save(0);
  }
  async function wed(sp, who, w) {
    var p = P.st(), s = S(), b = K(), CT = G.Court, rl = realm();
    await say(L.wedYes, who);
    s.player.wife = D.id;
    s.maids = s.maids || {}; s.maids[D.id] = { aff: 100 };
    p.wed = U.dateNum(s.date);
    s.player.gold += b.dowry; G.Fame.add('so', b.fameWed);
    // 한 계급 특진: 에스파냐의 작위 사다리에서 한 칸 (에스파냐 제독은 제 나라 작위, 다른 나라 제독은 에스파냐의 명예 작위)
    var up = null, extra = 0;
    if (CT && rl) {
      var c = CT.state(), n = CT.rank(rl), lad = CT.ladder(rl);
      if (n < lad.length) { c.titles[rl.id] = n + 1; up = CT.title(rl, n + 1); }
      else { extra = Math.round(b.dowry / 2); s.player.gold += extra; }
    }
    await UI.say(L.wedPrincess, w);
    var tt = up ? CT.fullName(up, true) : '';
    G.State.log(D.name + U.jx(D.name, '과/와') + ' 혼인했다. 에스파냐 국왕의 부마가 되었다' + (tt ? ' — ' + tt + '로 특진' : '') + '. (지참금 금화 ' + U.num(b.dowry) + '닢)');
    if (G.Audio) G.Audio.sfx('discover');
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">에스파냐 국왕의 사위</div><div style="font-size:36px;font-weight:800;margin:6px 0">부마</div>' +
      (up ? '<div style="font-size:20px">' + U.esc(CT.fullName(up, true)) + '<span class="muted"> — 한 계급 특진</span></div>' : '<div class="muted">이미 가장 높은 작위라 특진 대신 금화 ' + U.num(extra) + '닢을 더 받았다</div>') + '</div><br>' +
      D.name + U.jx(D.name, '과/와') + ' 혼인했다! 고향 ' + G.CITY_DATA[s.player.home].name + '의 자택에서 기다리고 있을 것이다.<br>' +
      '지참금 금화 <b>' + U.num(b.dowry) + '</b>닢 · 사교 명성 +' + (b.fameSo + b.fameWed) + ' · 전투 명성 +' + b.fameBt, '혼인');
    UI.toast('부마가 되었다!' + (up ? ' — ' + up.ko : ''), 'crown', 6500);
    G.Game.refreshHud();
    if (s.settings.autosave !== false && G.State.save) G.State.save(0);
  }

  // ================================================================ 칭호 · 수첩 · 할 일
  /** 「부마」 — 왕녀가 아내일 때만 (대를 이은 자녀에게는 이어지지 않는다) */
  P.title = function () { var s = S(), p = P.st(); return p && p.wed && s && s.player.wife === D.id ? '부마' : ''; };
  P.html = function () {
    var p = P.st(); if (!p || p.end || !p.stage) return '';
    var sp = G.SPONSOR[p.sp], left = P.remain();
    var step = p.stage === 1 ? '<b>레반트 바다</b>(알렉산드리아·베이루트·안티오키아 앞바다)에서 왕녀를 붙잡아 간 바르바리 해적 함대를 찾아 쳐부순다'
      : p.stage === 2 ? '<b>홍해 수에즈 만 서쪽 기슭의 해적 요새</b>로 간다 — 뭍으로는 카이로·알렉산드리아 성문에서 동쪽 사막을 건너고, 배로는 아프리카를 돌아 아덴에서 홍해를 거슬러 오른다'
      : '<span class="good-text">' + D.name + '를 배에 모셨다 — ' + G.CITY_DATA[sp.city].name + ' 왕궁으로 돌아가 아뢴다</span>';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">국왕의 특명 — 사라진 왕녀</h4><div class="kv">' +
      '<div>군주</div><div>' + SP().holderName(sp) + ' (' + sp.title + ', ' + G.CITY_DATA[sp.city].name + ')</div>' +
      '<div>할 일</div><div>' + step + '</div>' +
      '<div>기한</div><div>' + dueText(p) + (left < 0 ? ' <span class="warn-text">(지남)</span>' : ' (남은 ' + left + '일)') + '</div>' +
      '<div>보상</div><div>하사금·명성' + (single() ? ' — 그리고 왕녀의 마음' : '') + '</div></div>';
  };
  /** 「이 도시에서 할 일」 판 */
  P.todo = function (c) {
    var p = P.st(); if (!p || p.end || !c) return [];
    var sp = G.SPONSOR[p.sp];
    if (sp && sp.city === c.id && (p.stage === 0 || p.stage === 3)) return [{ kind: 'palace', arg: R.bldArg ? R.bldArg(sp) : undefined, icon: 'crown', hot: true, text: p.stage === 0 ? SP().holderName(sp) + '께서 부르신다 — 사라진 왕녀' : D.name + '를 국왕께 모셔 간다' }];
    return [];
  };
  /** 도시에 들어설 때: 부름을 받았는데 아직 알현하지 않았으면, 에스파냐 땅의 도시에서 전령이 찾아온다 (한 번) */
  P.arrival = async function (c) {
    var p = P.st(); if (!p || p.end || p.stage !== 0 || p.heraldDone || !c) return;
    var rl = realm(); if (!rl || rl.lands.indexOf(R.cityOwner(c)) < 0) return;
    p.heraldDone = 1;
    var C = G.Scenes.city;
    await C.say(C.npc('herald', '왕실 전령'), fill(L.herald));
  };
})(window.G = window.G || {});
