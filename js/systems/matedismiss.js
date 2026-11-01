/* 동료 해고와 재등용 — 저장: m.devoted, s.mateDismiss[id]. 기존 인물 정의는 바꾸지 않는다. */
(function (G) {
  'use strict';
  var MD = G.MateDismiss = {}, U = G.U;
  function S() { return G.Game.state; }
  function K() { return G.BALANCE.mateDismiss; }
  function row(id) { return S().mates.filter(function (m) { return m.id === id; })[0]; }
  MD.record = function (id) { var s = S(); return s && s.mateDismiss && s.mateDismiss[id] || null; };
  MD.days = function (m) {
    if (m.joinedDay != null) return Math.max(0, S().day - m.joinedDay);
    if (!m.joined) return Math.max(0, S().day || 0);
    var n = m.joined, d = S().date;
    return Math.max(0, Math.floor((Date.UTC(d.y, d.m - 1, d.d) - Date.UTC(Math.floor(n / 10000), Math.floor(n / 100) % 100 - 1, n % 100)) / 86400000));
  };
  /** 짧게 함께한 해고 동료만 다시 술집에 등장한다. 권력자·가족의 기존 제한은 유지한다. */
  MD.returning = function (id) {
    var r = MD.record(id), d = G.MATE[id], s = S();
    return !!(r && r.available && d && !s.flags['gone_' + id] && !row(id) &&
      !(G.MatePower && G.MatePower.blocked(d)) && (!d.y || (s.date.y >= d.y[0] && s.date.y <= d.y[1])));
  };
  MD.wage = function (id, base) {
    var r = MD.record(id);
    return r && r.count ? Math.max(base, r.wage || 0) : base;
  };
  /** 이야기 동료처럼 정해진 고장이 없으면 하선한 항구 주변을 떠돈다. */
  MD.range = function (id) {
    var r = MD.record(id), d = G.MATE[id], c = r && G.CITY_DATA[r.city];
    if (!r || !r.available || !c || !d || (d.reg || []).length || (G.MATE_RANGE || {})[id]) return null;
    return G.CITY_DATA.filter(function (x) { return x.port && x.region === c.region; }).map(function (x) { return x.id; });
  };
  MD.hired = function (m) {
    var r = MD.record(m.id);
    m.joinedDay = S().day;
    if (r) {
      Object.keys(r.kept || {}).forEach(function (k) { m[k] = U.clone(r.kept[k]); });
      r.available = false; m.rehired = r.count;
    }
  };
  function speaker(d) { return { name: d.name, portrait: G.Scenes.mateSpec(d.id), half: G.Img.chain.mateHalf(d.id), lang: 3 }; }
  function clearPending(id) {
    var s = S();
    if (s.leaving) s.leaving = s.leaving.filter(function (x) { return x !== id; });
    if (s.mateLeave && s.mateLeave.pend) s.mateLeave.pend = s.mateLeave.pend.filter(function (x) { return x.id !== id; });
  }
  function register(m, c) {
    var s = S(), d = G.MATE[m.id], old = MD.record(m.id), wage = G.R.mateWage(m.id);
    var wife = G.Wives && G.Wives.of && G.Wives.of(m.id);
    var canReturn = !wife && s.player.wife !== m.id && !d.sib && MD.days(m) < K().returnMaxDays &&
      !(G.MatePower && G.MatePower.blocked(d));
    if (canReturn) {
      var r = { count: (old ? old.count : 0) + 1, day: s.day, city: c.id, available: true,
        wage: Math.max((d.wage || 0) + K().rehireMin, wage + Math.max(K().rehireMin, Math.ceil(wage * K().rehireRate))) };
      r.kept = {};
      ['sk', 'skg', 'skd', 'skw', 'lgx', 'aff', 'ev', 'vtale', 'taleHeard', 'hurt'].forEach(function (k) { if (m[k] != null) r.kept[k] = U.clone(m[k]); });
      (s.mateDismiss || (s.mateDismiss = {}))[m.id] = r;
      if (s.oldGuard && s.oldGuard.ret) s.oldGuard.ret = s.oldGuard.ret.filter(function (x) { return x.id !== m.id || x.done; });
      delete s.flags['gone_' + m.id];
      if (s.mateFate) delete s.mateFate[m.id];
      (s.mateLoc || (s.mateLoc = {}))[m.id] = c.id;
      (s.mateRumorStay || (s.mateRumorStay = {}))[m.id] = { city: c.id, until: s.day + K().returnStayDays, any: true };
      if (G.MateKnow) G.MateKnow.know(m.id, c.id, 'crew');
    } else {
      if (old) old.available = false;
      if (!wife && G.OldGuard) G.OldGuard.left(m.id, 'fire');
      if (!wife) s.flags['gone_' + m.id] = 1;
    }
    clearPending(m.id);
    return canReturn;
  }
  /** 모든 해고 버튼의 공통 입구. true: 하선, false: 취소 또는 충성 서약으로 잔류. */
  MD.fire = async function (m, c) {
    var s = S(), d = m && G.MATE[m.id], UI = G.UI;
    if (!d || !row(m.id)) return false;
    c = c || (s.loc && s.loc.mode === 'city' && G.CITY_DATA[s.loc.city]);
    if (!c) { UI.toast('항구의 술집이나 여관에서 해고할 수 있습니다.', 'people'); return false; }
    if (m.id === 'rocco') { await UI.say('제독, 저를 버리시겠다는 겁니까? ...농담이시겠지요.', speaker(d)); return false; }
    var ML = G.MateLeave, sp = ML && ML.spouseOf(m.id), sr = sp && row(sp), words = sp && ML.spouseWords(sp, m.id);
    var short = MD.days(m) < K().returnMaxDays;
    var note = short ? '짧게 함께한 동료는 다시 항구를 떠돕니다. 재등용할 때는 월급이 오릅니다.' : '오래 함께한 동료와 작별합니다.';
    if (!await UI.confirm(U.esc(U.j(d.name, '을/를')) + ' 해고하겠습니까?<br><small>' + U.esc(note) + (sp ? '<br>' + U.esc(ML.fireWarn(m.id, sp)) : '') + '</small>', '해고한다', '그만둔다')) return false;
    if (!m.devoted && U.chance(K().devotionChance)) {
      var keep = await UI.ask('제독, 저는 계속 따라가고 싶습니다. 월급은 금화 ' + K().devotionWage + '닢이면 됩니다. 어떤 일이 있어도 끝까지 충성을 다하겠습니다.',
        [{ label: '함께 항해한다', value: true }, { label: '뜻을 거절하고 해고한다', value: false }], speaker(d));
      if (keep) {
        m.devoted = true; G.R.setLoyal(m, 100); clearPending(m.id);
        G.State.log(d.name + '의 충성 서약 — 월급 금화 ' + K().devotionWage + '닢, 충성 100 유지.');
        UI.toast(d.name + ' — 월급 ' + K().devotionWage + '닢 · 충성 100 유지', 'heart', 5000);
        if (G.Game.refreshHud) G.Game.refreshHud();
        return false;
      }
    }
    var wife = G.Wives && G.Wives.of && G.Wives.of(m.id), returns = register(m, c);
    s.mates = s.mates.filter(function (x) { return x.id !== m.id; });
    G.R.tidyCaptains(); if (G.Cabins) G.Cabins.tidy();
    if (sp && !wife) {
      await ML.follow(m.id, 'fire', { spouse: sp, words: words });
      if (sr) register(sr, c);
    }
    if (G.Wives && G.Wives.sync) G.Wives.sync();
    G.State.log(d.name + ' 해고' + (returns ? ' — ' + c.name + '에서 철새로 다시 만날 수 있다. 재등용 월급 ' + MD.record(m.id).wage + '닢.' : '.'));
    UI.toast(wife ? d.name + ' — 집으로 돌아갔다.' : d.name + ' — 배에서 내렸다.' + (returns ? ' ' + c.name + ' 술집에서 다시 만날 수 있다.' : ''), 'boot', 5000);
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
})(window.G = window.G || {});
