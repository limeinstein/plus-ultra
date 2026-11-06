/* 해적의 소굴 (G.Lair) — 자료: js/data/pirate_lairs.js · 조정값: G.BALANCE.lair (js/data/base.js). 2026-11-06 사용자 요청
   ■ 드러내기: 한 바다(G.Ships.zone)에서 이름난 해적(js/data/seacaptains.js — 하이레딘·티치·앤 보니 … 와 그 바다를 떠도는 소굴의 간부들)을
     서로 다른 사람으로 kills(3)명 무찌르면(해전에서 이기면), 사로잡은 해적이 그 바다 소굴의 자리를 털어놓는다 → 지도에 「○○ 해적 소굴」이 나타난다.
   ■ 손에 넣기: 소굴 앞바다(near°)에 들어서면 소굴의 두목이 함대를 몰고 나온다. 두목 chiefs(2)명을 차례로 무찌르면 섬을 손에 넣는다.
     손에 넣기 전에는 항구에 들어갈 수 없다(수비대가 막는다). 지거나 놓치면 cool일 뒤에 다시 나온다.
   ■ 손에 넣은 섬: 항구·교역소·술집·여관과 「해적 본부」만 있다. 해적 본부는 총독부 대신 자택처럼 쓴다 — 쉬기·금고·보관함·저장,
     둘째 부인부터 다른 부인들을 데려와 함께 지내게 할 수 있다(js/systems/wives.js의 숨은 거처 w.lodge, kind 'lair' — 아이들도 함께 온다).
     그 바다의 소굴 간부들은 더는 바다에 나오지 않는다.
   ■ 일곱 바다의 소굴을 모두 손에 넣으면 업적 「해적왕」 (js/data/achievements.js — custom 규칙 'lairs').
   ■ 소굴 도시는 자료(G.CITY_DATA)에 없는 도시라, 드러난 소굴만 G.Lair.apply()가 정해진 번호(1200번대)로 끼워 넣는다 (새 게임·일지 열기 때).
   ■ 저장: s.lair = { kills: {바다: [해적 id…]}, rev: {바다: 드러난 날}, beat: {바다: 무찌른 두목 수}, held: {바다: 손에 넣은 날}, cd: {바다: 두목 함대가 다시 나올 날}, tell: [해전 뒤 장면] }
     없으면 아직 아무 일도 없다 (옛 저장 그대로 열린다). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var LR = {};
  G.Lair = LR;
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.lair) || {}; }
  function st() {
    var s = S(); if (!s) return null;
    var x = s.lair || (s.lair = {});
    ['kills', 'rev', 'beat', 'held', 'cd'].forEach(function (k) { if (!x[k] || typeof x[k] !== 'object') x[k] = {}; });
    if (!Array.isArray(x.tell)) x.tell = [];
    return x;
  }
  LR.st = st;
  LR.list = function () { return G.PIRATE_LAIRS || []; };
  LR.data = function (zone) { return (G.PIRATE_LAIR || {})[zone] || null; };
  LR.of = function (c) { return c && c.lair ? LR.data(c.lair) : null; };
  LR.revealed = function (zone) { var x = st(); return !!(x && x.rev[zone] != null); };
  LR.held = function (zone) { var x = st(); return !!(x && x.held[zone] != null); };
  LR.heldCount = function () { return LR.list().filter(function (d) { return LR.held(d.zone); }).length; };
  LR.zoneName = function (zone) { return (G.Ships && G.Ships.ZONE_NAME && G.Ships.ZONE_NAME[zone]) || zone; };
  function need() { return K().kills || 3; }
  function chiefsNeed(d) { return Math.min(K().chiefs || 2, d.chiefs.length); }

  // ================================================================ 도시 자료에 끼워 넣기
  var injected = [];
  function cityOf(d) {
    var ref = G.CITY_DATA[d.ref] || {}, held = LR.held(d.zone);
    var old = G.CITY_DATA[d.id], c = old && old.lair === d.zone ? old : { id: d.id };   // 같은 물건을 고쳐 써서 바다의 도시 목록(캐시)에도 새 이름이 보이게
    c.name = held ? d.place : d.place + ' 해적 소굴';
    c.lat = d.lat; c.lon = d.lon; c.dock = d.dock.slice();
    c.port = 1; c.region = ref.region != null ? ref.region : 1; c.lang = ref.lang != null ? ref.lang : 3; c.rel = ref.rel || 'C';
    c.size = 1; c.style = ref.style || 'ib'; c.nation = '해적'; c.founded = 0; c.flags = ''; c.lair = d.zone; c.bgRef = d.ref;
    c.goods = d.goods.filter(function (g) { return G.GOOD && G.GOOD[g]; });
    return c;
  }
  function inject(d) {
    G.CITY_DATA[d.id] = cityOf(d);
    if (injected.indexOf(d.id) < 0) injected.push(d.id);
    if (R.resetOrigins) R.resetOrigins();   // 교역소 물건이 늘었으니 산지 셈을 다시
    return G.CITY_DATA[d.id];
  }
  /** 이 게임(state)에서 드러난 소굴을 G.CITY_DATA에 넣는다 — 지난 게임의 것은 걷어 낸다. 새 게임·일지 열기 때 부른다 */
  LR.apply = function () {
    injected.forEach(function (id) { var c = G.CITY_DATA[id]; if (c && c.lair) delete G.CITY_DATA[id]; });
    injected = [];
    if (!S()) return;
    LR.list().forEach(function (d) { if (LR.revealed(d.zone)) inject(d); });
  };

  /** 소굴 섬의 시설 (rules.js R.facilities) */
  LR.facilities = function () {
    return { harbor: true, trade: true, tavern: true, inn: true, gate: false, church: false, market: false, shipyard: false, palace: false, library: false, guild: false, mansion: [] };
  };
  var KEEP = { harbor: 1, trade: 1, tavern: 1, inn: 1, house2: 1 };

  // ================================================================ 해전: 이름난 해적 셋 → 소굴이 드러난다 · 소굴의 두목 → 섬을 손에 넣는다
  /** battle.js finish (이긴 해전) */
  LR.afterBattle = function (npc, res, ships, lines) {
    var x = st(); if (!x || !npc || npc.kind !== 'pirate' || res !== 'win') return;
    lines = lines || [];
    if (npc.lairChief) {
      var z = npc.lairChief, d = LR.data(z); if (!d || x.held[z] != null) return;
      var no = npc.chiefNo || 0, ch = d.chiefs[no] || d.chiefs[0];
      x.beat[z] = Math.max(x.beat[z] || 0, no + 1);
      if (x.beat[z] >= chiefsNeed(d)) {
        hold(d);
        lines.push('<b>' + U.esc(ch.name) + U.jx(ch.name, '이/가') + ' 무릎을 꿇었다! ' + U.esc(d.place) + U.jx(d.place, '을/를') + ' 손에 넣었다.</b> 이제 이 섬의 해적 본부를 자택처럼 쓸 수 있다.');
        x.tell.push({ kind: 'hold', zone: z });
      } else {
        x.cd[z] = S().day + (K().nextChief == null ? 2 : K().nextChief);
        var nx = d.chiefs[x.beat[z]];
        lines.push('<b>' + U.esc(ch.name) + '의 함대를 무찔렀다!</b> 그러나 ' + U.esc(d.place) + ' 소굴의 깃대에는 아직 ' + U.esc(nx.name) + '의 깃발이 걸려 있다.');
        x.tell.push({ kind: 'chief', zone: z, no: no });
      }
      return;
    }
    var c = npc.cap, zone = npc.zone; if (!c || !LR.data(zone) || x.rev[zone] != null) return;
    var list = x.kills[zone] || (x.kills[zone] = []);
    if (list.indexOf(c.id) < 0) list.push(c.id);
    var d2 = LR.data(zone);
    if (list.length >= need()) {
      reveal(d2);
      lines.push('<b>' + U.esc(c.name) + U.jx(c.name, '이/가') + ' 목숨을 빌며 ' + U.esc(LR.zoneName(zone)) + ' 해적들의 소굴을 털어놓았다 — ' + U.esc(d2.place) + '!</b> 해도에 소굴의 자리를 적었다.');
      x.tell.push({ kind: 'reveal', zone: zone, cap: { id: c.id, name: c.name, src: c.src, desc: c.desc, g: c.g, mate: c.mate, k: 'p' } });
    } else {
      lines.push('<span class="muted">' + U.esc(LR.zoneName(zone)) + '의 이름난 해적을 ' + list.length + '/' + need() + '명 무찔렀다 — 더 무찌르면 누군가 해적의 소굴을 털어놓을 것이다.</span>');
    }
  };
  function reveal(d) {
    var s = S(), x = st();
    x.rev[d.zone] = s.day;
    var c = inject(d);
    if (s.known.indexOf(c.id) < 0) s.known.push(c.id);
    if (G.State.revealChart) { try { G.State.revealChart(d.lon, d.lat, 1.5); } catch (e) { /* 해도 밝히기는 없어도 된다 */ } }
    G.State.log(LR.zoneName(d.zone) + '의 해적 소굴 「' + d.place + '」의 자리를 알아냈다.');
  }
  function hold(d) {
    var s = S(), x = st(), b = K();
    x.held[d.zone] = s.day; delete x.cd[d.zone];
    inject(d);   // 이름이 「○○ 해적 소굴」 → 「○○」
    // 그 바다의 소굴 간부들은 이제 제독의 부하 — 바다에 나오지 않는다
    var r = s.capRoster || (G.Captains && G.Captains.ensure ? (G.Captains.ensure(), s.capRoster) : null);
    if (r) { r.out = r.out || {}; (G.SEA_PIRATES || []).forEach(function (p) { if (p.lair === d.zone) r.out[p.id] = 1; }); }
    if (b.gold) s.player.gold += b.gold;
    var fm = b.fame && G.Fame ? G.Fame.add('bt', b.fame) : 0;
    G.State.log(d.place + U.jx(d.place, '을/를') + ' 손에 넣었다 — ' + LR.zoneName(d.zone) + ' 해적들의 소굴이 제독의 것이 되었다. (금화 ' + U.num(b.gold || 0) + ', 명성 +' + fm + ')');
  }
  LR._reveal = function (zone) { var d = LR.data(zone); if (d && !LR.revealed(zone)) reveal(d); };   // 시험용
  LR._hold = function (zone) { var d = LR.data(zone); if (!d) return; if (!LR.revealed(zone)) reveal(d); if (!LR.held(zone)) hold(d); };   // 시험용

  // ================================================================ 소굴 앞바다: 두목의 함대
  function seaPoint(lon, lat, minD, maxD) {
    var tries = [[minD, maxD, 0.4], [minD * 0.6, maxD * 0.7, 0.2], [0.35, 0.9, 0.08]];
    for (var k = 0; k < tries.length; k++) for (var i = 0; i < 16; i++) {
      var a = U.rf(0, Math.PI * 2), r = U.rf(tries[k][0], tries[k][1]), x = lon + Math.cos(a) * r, y = lat + Math.sin(a) * r;
      if (G.Geo.isSea(x, y, tries[k][2])) return { lon: x, lat: y };
    }
    return null;
  }
  /** 지금 배가 들어선, 손에 넣지 않은 소굴 */
  LR.nearLair = function () {
    var s = S(), x = st(); if (!x || !s.loc) return null;
    var l = s.loc, near = K().near || 2.5;
    return LR.list().filter(function (d) { return x.rev[d.zone] != null && x.held[d.zone] == null && G.Geo.dist(l.lon, l.lat, d.dock[1], d.dock[0]) <= near; })[0] || null;
  };
  /** sea.js spawnNpcs: 소굴 앞바다에 들어서면 두목이 함대를 몰고 나온다 */
  LR.spawn = function (npcs) {
    var s = S(), x = st(), b = K(); if (!x || !G.Ships || !s.loc || s.loc.mode !== 'sea') return null;
    if ((npcs || []).some(function (n) { return n.lairChief; })) return null;
    var d = LR.nearLair(); if (!d) return null;
    if (x.cd[d.zone] && s.day < x.cd[d.zone]) return null;
    var no = Math.min(x.beat[d.zone] || 0, d.chiefs.length - 1), ch = d.chiefs[no], l = s.loc;
    var sp = b.spawn || [0.9, 1.6], q = seaPoint(l.lon, l.lat, sp[0], sp[1]); if (!q) return null;
    var sh = b.ships || [4, 5], kk = b.K || [0.75, 0.9];
    var n = Math.min(6, U.ri(sh[0], sh[1]) + no), Kk = Math.min(1, U.rf(kk[0], kk[1]) + no * 0.05);
    x.cd[d.zone] = s.day + (b.cool || 20);   // 놓치거나 지면 이만큼 뒤에 다시 (이기면 afterBattle이 다시 맞춘다)
    UI.toast(d.place + ' 쪽에서 해적선들이 몰려나온다! — ' + ch.name + '의 깃발', 'skull', 5600);
    return { id: 'lair_' + d.zone + '_' + no + '_' + s.day, kind: 'pirate', lairChief: d.zone, chiefNo: no, lon: q.lon, lat: q.lat,
      heading: Math.atan2(l.lat - q.lat, G.Geo.wrapLon(l.lon - q.lon)), n: n, K: Kk, spd: U.rf(1.05, 1.3), life: 30, hostile: true, zone: d.zone,
      label: ch.name + '의 ' + d.place + ' 수비대', ships: G.Ships.enemyTypes('pirate', d.zone, null, n, Kk, s.date.y),
      cap: { id: 'lairchief_' + d.zone + '_' + no, name: ch.name, src: 'lair', desc: ch.desc + ' — ' + d.place + ' 소굴의 두목.', g: ch.g || 'm', k: 'p' } };
  };

  // ================================================================ 해전이 끝난 뒤의 장면
  function mate() { return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {}; }
  function pirateSp(cap, zone) {
    var n = { kind: 'pirate', zone: zone, cap: cap };
    return (G.Captains && G.Captains.speaker && G.Captains.speaker(n)) || { name: cap.name };
  }
  LR.tell = async function () {
    var x = st(); if (!x || !x.tell.length) return;
    var list = x.tell.splice(0, x.tell.length), held = false;
    for (var i = 0; i < list.length; i++) {
      var t = list[i], d = LR.data(t.zone); if (!d) continue;
      // 위치를 들은 순간부터 점령 결과까지, 그 바다의 소굴 원화를 대사와 함께 보여 준다.
      await G.Hist.withScene('lair_' + d.zone, d.place + '의 해적 소굴', async function () {
        if (t.kind === 'reveal') {
          var who = pirateSp(t.cap, t.zone);
          await UI.say('…좋소, 좋아. 목숨만 살려 주면 말하리다. 이 바다의 우리 같은 놈들이 모이는 곳은 ' + d.place + '요. ' + d.desc, who);
          await UI.say('그곳엔 ' + d.chiefs[0].name + U.jx(d.chiefs[0].name, '과/와') + ' ' + d.chiefs[1].name + U.jx(d.chiefs[1].name, '이/가') + ' 버티고 있소. 소굴 앞바다에 들어서는 순간 두목들의 배가 몰려나올 거요.', who);
          await UI.say('제독, ' + d.place + '의 자리를 해도에 적어 두었습니다. 두목 둘을 차례로 꺾으면 섬이 우리 것이 됩니다.', mate());
        } else if (t.kind === 'chief') {
          var nx = d.chiefs[(t.no || 0) + 1] || d.chiefs[d.chiefs.length - 1];
          await UI.say(d.chiefs[t.no || 0].name + '의 함대가 무너졌다. 하지만 ' + d.place + ' 소굴의 깃대에는 아직 ' + nx.name + '의 깃발이 펄럭인다.', {});
          await UI.say('제독, 남은 두목은 ' + nx.name + '입니다. 소굴 앞바다에 머물면 곧 나올 겁니다.', mate());
        } else if (t.kind === 'hold') {
          held = true;
          await UI.say(d.place + '의 해적들이 하나둘 무기를 내려놓았다. 부두에 늘어선 사내들이 새 우두머리에게 모자를 벗는다.', {});
          await UI.say('제독, ' + d.place + U.jx(d.place, '은/는') + ' 이제 우리 섬입니다! 해적 본부는 자택처럼 쓰시면 됩니다 — 쉬어 가실 수도, 금고와 보관함을 쓰실 수도 있습니다. 다른 부인들을 모셔 와 지내게 하실 수도 있고요.', mate());
          await UI.alert('<b>' + U.esc(d.place) + U.jx(d.place, '을/를') + ' 손에 넣었다!</b><br>항구·교역소·술집·여관과 <b>해적 본부</b>가 있다. 해적 본부는 자택처럼 쓴다 — 쉬기 · 금고 · 보관함 · 항해 일지 기록, ' +
            '그리고 둘째 부인부터 다른 부인들을 데려와 함께 지내게 할 수 있다.<br><small class="muted">일곱 바다의 소굴 가운데 ' + LR.heldCount() + '곳을 손에 넣었다. 모두 손에 넣으면 「해적왕」.</small>', '해적의 섬');
        }
      });
    }
    if (held && G.Achieve && G.Achieve.afterEvent) await G.Achieve.afterEvent();   // 해적왕
  };

  // ================================================================ 해적 본부 (자택처럼)
  function hq() {
    var HQ = { icon: 'skull', paint: 'tavern', exitLabel: '본부를 나온다' };
    HQ.title = function () { return '해적 본부'; };
    HQ.sub = function (c) { var n = wivesHere(c).length; return '소굴의 우두머리 자리' + (n ? ' · 부인 ' + n + '명' : ''); };
    HQ.enter = async function (c) {
      var d = LR.of(c); if (!d || !LR.held(d.zone)) return false;
      var ws = wivesHere(c);
      if (ws.length && G.Wives) await UI.say(U.pick(['오셨어요? 해적들 틈에서 지내는 것도 이제 익숙해요.', '당신 섬이라더니, 정말 다들 당신 이름만 대면 길을 비켜요.', '바닷바람이 거칠어도, 여기는 우리만 아는 곳이라 마음이 편해요.']), G.Wives.speaker(U.pick(ws)));
      else await UI.say(U.pick(['두목, 돌아오셨소! 술통은 가득 채워 두었소.', '두목이 없는 동안 섬은 조용했소. 털어 온 짐도 장부에 적어 두었고.', '어서 오시오, 두목. 오늘은 누구 배를 털러 갈 거요?']), boatswain(c));
      return true;
    };
    HQ.menu = function (c) {
      var s = S(), here = wivesHere(c), can = bringable(c);
      return [
        { label: '쉰다', icon: 'bed', sub: '사흘', onClick: function () { return rest(c); } },
        { label: '부인을 데려온다', icon: 'heart', sub: can.length ? can.length + '명' : '모실 부인이 없다', dim: !can.length, onClick: function () { return bring(c); } },
        { label: '금고', icon: 'chest', sub: U.num(s.player.bank) + '닢', onClick: function () { return G.Scenes.city.B.home.bank(c); } },
        { label: '보관함', icon: 'chest', sub: '맡긴 물건 ' + R.storage().length + '점', onClick: function () { return G.Scenes.city.B.home.storage(c); } },
        { label: '항해 일지 기록 (저장)', icon: 'save', onClick: function () { return G.Info.saveMenu(); } },
        here.length ? { label: '이 섬의 부인들', icon: 'people', sub: here.map(function (w) { return G.Wives.name(w); }).join('·'), dim: true, onClick: function () { UI.toast('부인들은 거리의 「해적 본부 — 이름」 집에서 만날 수 있습니다.', 'house', 4000); } } : null
      ];
    };
    return HQ;
  }
  function boatswain(c) { return { name: '소굴의 갑판장', portrait: G.Art && G.Art.npcSpec ? G.Art.npcSpec('lairhq' + c.id, 'sailor', c.style, 'm') : null, lang: 3 }; }
  function wivesHere(c) { return G.Wives ? G.Wives.list().filter(function (w) { return w.house && !w.aboard && w.city === c.id; }) : []; }
  /** 해적 본부로 데려올 수 있는 부인: 둘째 부인부터 — 이 섬에 이미 있거나, 데려다주는 길이거나, 본가에서 공주들과 함께 사는 사람은 빼고 */
  function bringable(c) {
    if (!G.Wives) return [];
    return G.Wives.list().filter(function (w) { return w.city !== c.id && !w.deliver && !w.dream && (w.house || w.aboard); });
  }
  async function rest(c) {
    var s = S();
    await UI.fade(function () { G.Game.passDays(3); });
    if (S() !== s || (s.life && s.life.end)) return;
    s.player.hp = 100; s.fleet.fatigue = 0;
    var ws = wivesHere(c);
    await UI.say(ws.length ? '해적 본부에서 ' + ws.map(function (w) { return G.Wives.name(w); }).join('·') + U.jx(G.Wives.name(ws[ws.length - 1]), '과/와') + ' 함께 푹 쉬었다. 몸도 마음도 가벼워졌다.' : '해적 본부의 해먹에서 푹 쉬었다. 파도 소리에 몸도 마음도 가벼워졌다.', {});
    for (var i = 0; i < ws.length; i++) if (!G.Wives.isCold(ws[i])) { try { await G.Wives.visit(ws[i], true); } catch (e) { console.error(e); } }   // 함께 쉬면 아이가 생기기도 한다
  }
  /** 부인과 그 아이들을 해적 본부로 옮긴다 (숨은 거처 w.lodge — kind 'lair', from: 본래 집) */
  function moveHere(w, c) {
    var old = w.city;
    if (!w.lodge) w.lodge = { from: old };
    w.lodge.kind = 'lair'; w.lodge.day = S().day;
    (S().player.kids || []).forEach(function (k) { if (k.mother === w.id && k.house === old) k.house = c.id; });
    w.city = c.id;
    if (w.aboard) G.Wives.settle(w, false); else w.house = true;
  }
  LR.moveHere = moveHere;
  async function bring(c) {
    var W = G.Wives, list = bringable(c);
    if (!list.length) { UI.toast('해적 본부로 모실 부인이 없습니다. (둘째 부인부터 — 본처는 본가를 지킵니다)', 'heart', 4500); return; }
    var i = await UI.choose('해적 본부로 모실 부인', list.map(function (w, j) {
      return { label: W.ordinal(w) + ' ' + W.name(w), desc: (w.aboard ? '배에 함께 — 이 섬에서 내린다' : '지금 ' + W.cityName(w) + '의 집') + (W.kidsOf(w).length ? ' · 아이 ' + W.kidsOf(w).length + '명도 함께' : ''), value: j, icon: 'heart' };
    }), { width: 560, text: '<small class="muted">해적 본부는 외딴 섬이라 본부인이 알기 어렵습니다. 다만 본부인을 배에 태우고 이 섬에 들어오면 들킬 수 있습니다. 거리의 「해적 본부 — 이름」에서 본래 집으로 돌려보낼 수 있습니다.</small>' });
    if (i == null) return;
    var w = list[i], nm = W.name(w);
    if (W.isCold(w)) { await UI.say('…지금은 당신이 정해 주는 곳에서 살고 싶지 않아요.', W.speaker(w)); return; }
    moveHere(w, c);
    await UI.say(U.pick(['해적들의 섬이라니… 무섭기도 하지만, 당신 곁이라면 괜찮아요.', '바다 한가운데 우리만의 집이네요. 마음에 들어요.', '여기선 아무도 우리를 손가락질하지 않겠죠?']), W.speaker(w));
    G.State.log(nm + U.jx(nm, '을/를') + ' ' + c.name + '의 해적 본부로 데려왔다.');
    UI.toast(nm + U.jx(nm, '이/가') + ' ' + c.name + ' 해적 본부에서 지내게 되었다. 거리의 「해적 본부 — ' + nm + '」에서 만날 수 있다.', 'house', 5600);
    if (G.Game.cityHud) G.Game.cityHud();
  }

  // ================================================================ 수첩 「할 일」 아래
  LR.html = function () {
    var x = st(); if (!x) return '';
    var started = LR.list().some(function (d) { return (x.kills[d.zone] || []).length || x.rev[d.zone] != null; });
    if (!started) return '';
    var rows = LR.list().map(function (d) {
      var z = d.zone, k = (x.kills[z] || []).length;
      var state = x.held[z] != null ? '<b>손에 넣음</b> — ' + U.esc(d.place) : x.rev[z] != null ? U.esc(d.place) + ' — 두목 ' + (x.beat[z] || 0) + '/' + chiefsNeed(d) : '이름난 해적 ' + Math.min(k, need()) + '/' + need();
      return '<tr><td>' + U.esc(LR.zoneName(z)) + '</td><td>' + state + '</td></tr>';
    }).join('');
    return '<div class="sep"></div><div style="font-size:17px"><b>해적의 소굴</b> <span class="muted">' + LR.heldCount() + '/' + LR.list().length + ' — 모두 손에 넣으면 「해적왕」</span></div>' +
      '<table class="tbl" style="width:100%;font-size:15px">' + rows + '</table>';
  };

  // ================================================================ 다른 코드에 잇기 (스크립트가 모두 읽힌 뒤)
  function hook() {
    var C = G.Scenes && G.Scenes.city; if (!C || !C.buildings || LR.hooked) return;
    LR.hooked = true;
    C.B.lairhq = hq();
    var of = R.facilities;
    R.facilities = function (c) { return c && c.lair ? LR.facilities(c) : of.apply(this, arguments); };
    var ob = C.buildings;
    C.buildings = function (c) {
      var out = ob.apply(this, arguments); if (!c || !c.lair) return out;
      out = out.filter(function (b) { return KEEP[b.kind]; });
      if (LR.held(c.lair)) {
        var at = -1; out.forEach(function (b, i) { if (at < 0 && b.kind === 'house2') at = i; });
        var b = { kind: 'lairhq', name: '해적 본부', icon: 'skull' };
        if (at >= 0) out.splice(at, 0, b); else out.push(b);
      }
      return out;
    };
    var oc = C.entryCheck;
    C.entryCheck = function (c) { return c && c.lair && LR.held(c.lair) ? null : oc.apply(this, arguments); };
    var oh = C.handleEntry;
    C.handleEntry = async function (c) {
      if (c && c.lair && !LR.held(c.lair)) {
        var d = LR.of(c), x = st(), ch = d.chiefs[Math.min(x.beat[d.zone] || 0, d.chiefs.length - 1)];
        await UI.say('제독, 소굴 어귀를 해적선들이 막고 있습니다. ' + ch.name + '의 깃발입니다 — 두목들의 함대를 먼저 꺾어야 들어갈 수 있습니다. 앞바다에서 기다리면 놈들이 나올 겁니다.', mate());
        if (x.cd[d.zone] && x.cd[d.zone] > S().day + 1) x.cd[d.zone] = S().day + 1;   // 문 앞까지 왔으니 곧 나온다
        return false;
      }
      return oh.apply(this, arguments);
    };
    if (G.Achieve) {
      G.Achieve.rules = G.Achieve.rules || {};
      G.Achieve.rules.lairs = function () { return LR.list().map(function (d) { return { label: LR.zoneName(d.zone) + ' — ' + d.place, count: LR.held(d.zone) ? 1 : 0, n: 1 }; }); };
    }
  }
  LR.hook = hook;
  hook();                                                     // city.js·misc.js·wives.js 다음에 읽힌다 (index.html 끝)
  if (!LR.hooked) document.addEventListener('DOMContentLoaded', hook);
})(window.G = window.G || {});
