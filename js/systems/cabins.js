/* 기함의 선실 (G.Cabins) — 방의 쓰임, 부하 배치, 방의 힘, 함께 지내며 말 배우기, 충성과 떠남.
   종류는 js/data/cabins.js, 조정값은 G.BALANCE.cabins · G.BALANCE.mates (js/data/base.js), 화면은 js/ui/cabinview.js.

   저장 상태
   · 배: sh.cabins = ['deck', 'hold', 'galley', …]  (0번은 늘 갑판, 그 뒤가 고칠 수 있는 선실)
   · 부하: m.room = 선실 번호(기함의 sh.cabins 자리), m.roomType = 그 방의 종류(기함을 바꿀 때 같은 방을 찾아 옮긴다)
           m.lgx = {말 번호: 배운 단계}, m.lgd = {말 번호: 함께 지낸 날}
   · 제독: player.lgd = {말 번호: 날}
   · 함대: fleet.cabinUid = 선실을 맞춰 둔 기함, state.leaving = [떠나겠다는 부하 id]
   옛 저장 파일에는 이것들이 없다 — 쓸 때 만들어 채운다. */
(function (G) {
  'use strict';
  var U = G.U, CB = {};
  G.Cabins = CB;
  function S() { return G.Game && G.Game.state; }
  function R() { return G.R; }
  function B() { return (G.BALANCE && G.BALANCE.cabins) || {}; }
  function BM() { return (G.BALANCE && G.BALANCE.mates) || {}; }
  var FIXED_ROLE = { first: 'adjutant', nav: 'helm', surveyor: 'lookout' };

  // ---------------------------------------------------------------- 방의 수와 기함 맞추기
  /** 이 배에서 고칠 수 있는 선실 수 (갑판·조타실·함장실·부관실·파수대는 따로 늘 있다) — 큰 배일수록 많다 */
  CB.slots = function (sh) {
    var t = sh && G.SHIP[sh.type]; if (!t) return 0;
    if (t.cabins != null) return t.cabins;
    var b = B();
    return U.clamp(Math.round((t.crew[1] + t.hp) / (b.slotDiv || 22)), b.slotMin || 2, b.slotMax || 16);
  };
  CB.flagship = function () { var s = S(); return s && s.fleet && s.fleet.ships[0] || null; };
  function ensure(sh) {
    var n = CB.slots(sh) + 1;
    if (!sh.cabins) sh.cabins = ['deck'];
    sh.cabins[0] = 'deck';
    while (sh.cabins.length < n) sh.cabins.push('hold');
    if (sh.cabins.length > n) sh.cabins.length = n;
    return sh.cabins;
  }
  /** 기함의 선실 목록 (없으면 만든다). 기함이 바뀌었으면 부하들을 같은 종류의 방으로 옮긴다 */
  CB.rooms = function () {
    var s = S(), sh = CB.flagship(); if (!sh) return [];
    var rooms = ensure(sh), f = s.fleet;
    if (f.cabinUid !== sh.uid) {
      var first = f.cabinUid == null;
      f.cabinUid = sh.uid;
      var taken = {}, lost = [];
      s.mates.forEach(function (m) {
        if (m.room == null) return;
        var want = m.roomType, i = -1;
        for (var k = 0; k < rooms.length; k++) if (rooms[k] === want && !taken[k]) { i = k; break; }
        if (i >= 0 && want !== 'hold') { m.room = i; taken[i] = 1; }
        else { delete m.room; delete m.roomType; if (m.role === 'purser' && want === 'account') m.role = 'none'; lost.push(m); }
      });
      if (!first && lost.length && G.UI) G.UI.toast('기함이 바뀌어 ' + lost.map(function (m) { return G.MATE[m.id].name; }).join('·') + '의 방이 없어졌다 — 선실에서 다시 배치하십시오.', 'people', 6500);
    }
    return rooms;
  };
  /** 어긋난 배치를 바로잡는다: 부관·항해사·측량사·선장은 제자리가 따로 있고, 한 방에는 한 사람 */
  CB.tidy = function () {
    var s = S(); if (!s) return;
    var rooms = CB.rooms(), seen = {};
    s.mates.forEach(function (m) {
      if (m.room == null) return;
      if (FIXED_ROLE[m.role] || m.role === 'captain' || m.room >= rooms.length || seen[m.room] || rooms[m.room] === 'hold' || (rooms[m.room] === 'account' && m.role !== 'purser')) { delete m.room; delete m.roomType; return; }
      seen[m.room] = 1; m.roomType = rooms[m.room];
    });
  };
  /** 이 선실에 있는 부하 (없으면 null) */
  CB.occupant = function (i) { var s = S(); return s.mates.filter(function (m) { return m.room === i; })[0] || null; };
  /** 고정 자리(부관실·조타실·파수대)에 있는 부하 */
  CB.roleMate = function (role) { var s = S(); return s.mates.filter(function (m) { return m.role === role; })[0] || null; };
  /** 부하가 지금 있는 곳의 이름 */
  CB.placeName = function (m) {
    if (m.role === 'captain') return R().roleName(m);
    if (FIXED_ROLE[m.role]) return G.CABIN[FIXED_ROLE[m.role]].name;
    var rooms = CB.rooms();
    if (m.room != null && rooms[m.room]) return G.CABIN[rooms[m.room]].name + (m.role === 'interp' ? ' · 통역' : '');
    return m.role === 'interp' ? '통역 (방 없음)' : m.role === 'purser' ? '경리 (방 없음)' : '대기';
  };
  /** 부하를 선실 i에 둔다 (i가 null이면 방에서 뺀다). 그 방에 있던 사람은 방을 비운다 */
  CB.place = function (m, i) {
    var s = S(), rooms = CB.rooms();
    if (i == null) { if (m.role === 'purser' && m.roomType === 'account') m.role = 'none'; delete m.room; delete m.roomType; return; }
    var type = rooms[i]; if (!type || type === 'hold') return;
    var old = CB.occupant(i);
    if (old && old !== m) CB.place(old, null);
    if (m.roomType === 'account' && type !== 'account' && m.role === 'purser') m.role = 'none';
    if (FIXED_ROLE[m.role] || m.role === 'captain') { m.role = 'none'; delete m.ship; }
    m.room = i; m.roomType = type;
    if (type === 'account') {          // 회계실에 앉은 사람이 경리다
      s.mates.forEach(function (x) { if (x !== m && x.role === 'purser') x.role = 'none'; });
      m.role = 'purser';
    }
    if (R().tidyCaptains) R().tidyCaptains();
  };
  /** 선실 i를 type으로 고친다 (값은 치르지 않는다 — 조선소 화면이 치른다) */
  CB.remodel = function (i, type) {
    var rooms = CB.rooms(); if (i <= 0 || i >= rooms.length || !G.CABIN[type] || G.CABIN[type].fixed) return false;
    var m = CB.occupant(i);
    rooms[i] = type;
    if (m) { if (type === 'hold') CB.place(m, null); else CB.place(m, i); }
    return true;
  };

  // ---------------------------------------------------------------- 충성과 효율
  /** 충성이 낮으면 일을 건성으로 한다: 특기·능력의 효율 (1 = 온전히) */
  CB.eff = function (m) {
    var b = BM(), lo = m.loyal == null ? 70 : m.loyal;
    return lo <= (b.veryLow == null ? 20 : b.veryLow) ? (b.veryLowEff || 0.5) : lo <= (b.low == null ? 40 : b.low) ? (b.lowEff || 0.75) : 1;
  };
  /** 이 부하의 이 특기가 선실 덕에 함대에 쓰이는가 */
  CB.activates = function (m, skill) {
    if (m.room == null || m.role === 'captain') return false;
    var rooms = CB.rooms(), c = G.CABIN[rooms[m.room]];
    return !!(c && c.skills && c.skills.indexOf(skill) >= 0);
  };
  /** 통역실에 있는가 */
  CB.interprets = function (m) { if (m.room == null) return false; var c = G.CABIN[CB.rooms()[m.room]]; return !!(c && c.lang); };
  function roomPower(c, m) {
    if (!m || !G.MATE[m.id]) return 0;
    var best = 0;
    (c.skills || G.ROLE_SKILLS[c.role] || []).forEach(function (k) { best = Math.max(best, R().mateSkill(m, k)); });
    return (1 + best) * CB.eff(m);
  }
  /** 방 하나의 힘: 비었으면 0, 사람이 있으면 (1 + 특기 단계) × 충성 효율 */
  CB.powerAt = function (i) { var rooms = CB.rooms(), c = G.CABIN[rooms[i]]; return c ? roomPower(c, CB.occupant(i)) : 0; };
  /** 이 종류 방의 힘을 모두 더한 값 (상한 G.BALANCE.cabins.cap). 고정 자리는 그 역할을 맡은 사람으로 센다 */
  CB.power = function (type) {
    var s = S(); if (!s || !s.fleet || !s.fleet.ships.length) return 0;
    var c = G.CABIN[type]; if (!c) return 0;
    var sum = 0;
    if (c.fixed && c.role) sum = roomPower(c, CB.roleMate(c.role));
    else { var rooms = CB.rooms(); for (var i = 0; i < rooms.length; i++) if (rooms[i] === type) sum += roomPower(c, CB.occupant(i)); }
    return Math.min(B().cap || 8, sum);
  };
  /** 효과 값: G.BALANCE.cabins.fx[key] × 그 방의 힘 */
  CB.fx = function (type, key) { var v = ((B().fx || {})[key]) || 0; return v ? v * CB.power(type) : 0; };

  // ---------------------------------------------------------------- 말 배우기
  /** 부하의 모국어 (가장 잘하는 말) */
  CB.nativeLang = function (m) {
    var d = G.MATE[m.id]; if (!d || !d.lg) return null;
    var best = null, lv = 0;
    Object.keys(d.lg).forEach(function (k) { if (d.lg[k] > lv) { lv = d.lg[k]; best = +k; } });
    return best;
  };
  /** 부하의 말 단계: 타고난 것과 배에서 배운 것 가운데 높은 쪽 */
  CB.mateLang = function (m, li) { var d = G.MATE[m.id]; return Math.max((d && d.lg && d.lg[li]) || 0, (m.lgx && m.lgx[li]) || 0); };
  function levelFor(days) { var t = B().langDays || [90, 270, 730], lv = 0; for (var i = 0; i < t.length; i++) if (days >= t[i]) lv = i + 1; return lv; }
  /** 방의 자리 (가까운 방을 가릴 때): 선실 번호 → [칸, 줄] */
  CB.cols = function () { return B().cols || 6; };
  function cell(m) {
    if (m === 'admiral') return [-1, 0];
    if (m.role === 'first') return [-2, 0];
    if (m.role === 'nav') return [-3, 0];
    if (m.role === 'surveyor') return [-3, -1];
    if (m.room == null) return null;
    if (m.room === 0) return [-4, 0];                                   // 갑판 — 조타실 옆
    var k = m.room - 1, c = CB.cols();
    return [k % c, 1 + Math.floor(k / c)];
  }
  function near(a, b) {
    var x = cell(a), y = cell(b); if (!x || !y) return false;
    if (x[0] < 0 || y[0] < 0) return x[0] < 0 && y[0] < 0 && Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) <= 1;   // 갑판 위 자리끼리
    return Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) === 1;
  }
  CB.near = near;
  /** 하루: 한배를 탄 사람들이 서로의 모국어를 익힌다. 모두가 제독의 모국어를 하루만큼, 서로의 말은 가까운 방이면 하루·멀면 farRate 만큼.
      돌려주는 값: 알림 [{icon, text}] */
  CB.daily = function () {
    var s = S(), out = []; if (!s || !s.mates || !s.player) return out;
    CB.rooms();
    var p = s.player, far = B().farRate == null ? 0.3 : B().farRate;
    var aboard = s.mates.filter(function (m) { return G.MATE[m.id] && m.role !== 'captain'; });
    var away = s.mates.filter(function (m) { return G.MATE[m.id] && m.role === 'captain'; });   // 다른 배의 선장 — 제독의 말만 익힌다
    var myNative = R().nativeLang ? R().nativeLang(p.nation) : 0;
    function learn(who, name, gain, get, set) {
      Object.keys(gain).forEach(function (k) {
        var li = +k, cur = get(li); if (cur >= 3) return;
        who.lgd = who.lgd || {};
        who.lgd[li] = (who.lgd[li] || 0) + gain[k];
        var lv = levelFor(who.lgd[li]);
        if (lv > cur) { set(li, lv); out.push({ icon: 'scroll', text: name + U.j(name, '이/가').slice(name.length) + ' 한배에서 지내며 ' + G.LANGS[li] + '를 익혔다 (' + G.LANG_LV[lv] + ').' }); }
      });
    }
    aboard.forEach(function (m) {
      var gain = {}; gain[myNative] = 1;
      aboard.forEach(function (o) { if (o === m) return; var li = CB.nativeLang(o); if (li == null) return; gain[li] = Math.max(gain[li] || 0, near(m, o) ? 1 : far); });
      learn(m, G.MATE[m.id].name, gain, function (li) { return CB.mateLang(m, li); }, function (li, lv) { m.lgx = m.lgx || {}; m.lgx[li] = lv; });
    });
    away.forEach(function (m) { var gain = {}; gain[myNative] = 1; learn(m, G.MATE[m.id].name, gain, function (li) { return CB.mateLang(m, li); }, function (li, lv) { m.lgx = m.lgx || {}; m.lgx[li] = lv; }); });
    var mine = {};
    aboard.forEach(function (o) { var li = CB.nativeLang(o); if (li == null) return; mine[li] = Math.max(mine[li] || 0, near('admiral', o) ? 1 : far); });
    learn(p, '제독', mine, function (li) { return p.lg[li] || 0; }, function (li, lv) { p.lg[li] = lv; });
    return out;
  };

  // ---------------------------------------------------------------- 급료와 떠남
  /** 한 달 급료 (회계실이 있으면 조금 덜 든다) */
  CB.wages = function () {
    var s = S(), w = 0;
    s.mates.forEach(function (m) { var d = G.MATE[m.id]; if (d) w += d.wage || 0; });
    return Math.round(w * Math.max(0.5, 1 - CB.fx('account', 'wage')));
  };
  /** 지금 재산으로 급료를 몇 달 버티나 */
  CB.wageMonths = function (extra) { var s = S(), w = CB.wages() + (extra || 0); return w > 0 ? Math.floor((s.player.gold + (s.player.bank || 0)) / w) : 999; };
  /** 급료가 버거우면 경리나 부관이 하는 말 (괜찮으면 null) — extra: 새로 들일 사람의 급료 */
  CB.wageWarning = function (extra) {
    var mo = CB.wageMonths(extra), lim = BM().warnMonths || 6; if (mo >= lim) return null;
    var w = CB.wages() + (extra || 0);
    return { months: mo, wage: w, text: '제독, 부하들의 급료가 한 달에 금화 ' + U.num(w) + '닢입니다. 지금 가진 돈으로는 ' + (mo <= 0 ? '이번 달 급료도 치르지 못합니다.' : mo + '달밖에 버티지 못합니다.') + ' 급료가 밀리면 충성이 크게 떨어집니다.' };
  };
  /** 경고를 말할 사람: 경리, 없으면 부관, 없으면 갑판장 */
  CB.warnSpeaker = function () { var SC = G.Scenes; return SC.mateSpeaker ? SC.mateSpeaker(R().purser() ? 'purser' : 'first') : {}; };
  /** 달마다: 할 일 없는 부하는 충성이 떨어지고, 부관이 있으면 조금 오른다. 충성이 바닥나면 떠나겠다고 나선다. 알림을 돌려준다 */
  CB.monthly = function (paid) {
    var s = S(), b = BM(), out = [];
    var adj = CB.power('adjutant') > 0 ? (b.adjutantLoyal == null ? 1 : b.adjutantLoyal) : 0;
    CB.tidy();
    s.mates.forEach(function (m) {
      var d = G.MATE[m.id]; if (!d) return;
      var lo = m.loyal == null ? 70 : m.loyal;
      var idle = (!m.role || m.role === 'none') && m.room == null;
      if (idle) lo -= b.idleLoyal == null ? 2 : b.idleLoyal;
      else if (paid && lo < (b.settle || 70)) lo += adj;
      m.loyal = U.clamp(lo, m.id === 'rocco' ? 5 : 0, 100);
      if (m.loyal <= 0) { s.leaving = s.leaving || []; if (s.leaving.indexOf(m.id) < 0) s.leaving.push(m.id); }
    });
    if (paid) { var w = CB.wageWarning(); if (w) out.push({ icon: 'coin', text: (R().purser() ? '경리' : '부관') + ': 급료가 한 달 ' + U.num(w.wage) + '닢 — 가진 돈으로 ' + Math.max(0, w.months) + '달 버틴다.' }); }
    var low = s.mates.filter(function (m) { return m.loyal != null && m.loyal > 0 && m.loyal <= (b.low == null ? 40 : b.low); });
    if (low.length) out.push({ icon: 'people', text: low.map(function (m) { return G.MATE[m.id].name; }).join('·') + '의 충성이 낮아 일을 건성으로 한다.' });
    return out;
  };
  /** 떠나겠다는 부하와 이야기한다 (도시에 들어설 때·바다의 하루 끝에 부른다). 붙잡으면 충성이 조금 돌아온다 */
  CB.farewell = async function () {
    var s = S(), UI = G.UI; if (!s || !s.leaving || !s.leaving.length || CB._busy) return;
    CB._busy = true;
    try {
      while (s.leaving.length) {
        var id = s.leaving.shift(), m = s.mates.filter(function (x) { return x.id === id; })[0], d = G.MATE[id];
        if (!m || !d || m.loyal > 0) continue;
        var b = BM(), sp = { name: d.name, portrait: G.Scenes.mateSpec(id), lang: 3 };
        await UI.say(U.pick(['제독, 더는 함께할 수 없소. 이 배에서 내리겠소.', '할 만큼 했소. 다음 항구에서… 아니, 지금 내 짐을 싸겠소.', '당신 밑에서는 더 볼 것이 없소. 여기서 갈라섭시다.']), sp);
        var v = await UI.ask(d.name + U.j(d.name, '이/가').slice(d.name.length) + ' 배에서 내리려 한다.', [{ label: '붙잡는다 (설득)', value: 1 }, { label: '보내 준다', value: 0 }], sp);
        var p = U.clamp((b.persuade == null ? 0.25 : b.persuade) + (R().stat('cha') - 50) / 200 + R().skill('speech') * (b.persuadeSpeech || 0.12), 0.05, 0.9);
        if (v && U.chance(p)) {
          m.loyal = b.persuadeLoyal || 25;
          await UI.say(U.pick(['…그렇게까지 말한다면, 한 번만 더 믿어 보겠소.', '제독의 말에 마음이 흔들리는군. 좋소, 조금 더 타 보지.']), sp);
          UI.toast(d.name + U.j(d.name, '을/를').slice(d.name.length) + ' 붙잡았다. (충성 ' + m.loyal + ')', 'people', 4000);
        } else {
          if (v) await UI.say(U.pick(['말로 될 일이 아니오. 잘 있으시오.', '이미 마음을 정했소.']), sp);
          s.mates = s.mates.filter(function (x) { return x !== m; });
          s.flags['gone_' + id] = 1;
          G.State.log(d.name + U.j(d.name, '이/가').slice(d.name.length) + ' 함대를 떠났다.');
          UI.toast(d.name + U.j(d.name, '이/가').slice(d.name.length) + ' 함대를 떠났다.', 'boot', 4500);
        }
      }
    } catch (e) { console.error(e); }
    CB._busy = false;
    if (G.Game.refreshHud) G.Game.refreshHud();
  };
})(window.G = window.G || {});
