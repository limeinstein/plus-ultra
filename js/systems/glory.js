/* 명예혁명과 권리장전 (G.Glory) — 자료·대사·조정값: js/data/glory.js (G.GLORY · G.BALANCE.glory)  2026-10-29 사용자 요청
   ■ 갈래 (state.glory.o = 오라녜 편, state.glory.j = 국왕 편 — 한쪽을 맡으면 다른 쪽은 부르지 않는다)
     o: 0 → 1 (암스테르담에서 맡음) → 해협(1688.11.11~1689.1.31)에서 개신교의 바람·토베이 → 'done' (oHelp 'land'|'pamphlet') / 'failed'
     j: 0 → 1 (런던에서 맡음) → 해협·템스 어귀에서 동풍에 묶인 함대(jWind 'chase'|'hold') → 2 → 런던(1688.12.11~1689.1.20) 국왕의 탈출
          → 3 (모신다) → 프랑스의 항구 → 'done' (인장 반지) / 'refused' / 'failed'
   ■ 권리 선언 decl (누구나, 런던 1689.2.23~12.25, 한 번): 조항 하나(clause) · 국왕을 모셔 간 제독은 맹세(oath 'yes'|'no')
   ■ 1689.12.26 권리장전 (G.Glory.billIn): 잉글랜드 국왕의 면세증이 사라진다(js/systems/court.js CT.charters — noDispense) · 지닌 것은 남은 날만큼 돌려받는다
        권리 선언을 보고 맹세를 거절하지 않았으면 의회의 교역 증서(charter) — 잉글랜드·영국 항구에서 사는 값 ×0.95 · 파는 값 ×1.05 (js/core/rules.js)
   ■ 소식: 누구나(그날로부터 30일 안의 저장만) · 낀 사람만(part). 직접 겪은 일은 소식으로 다시 띄우지 않는다(skip).
   ■ 끼어드는 곳: 하루(world.js) · 도시(city.js) · 바다의 하루 끝(sea.js) · 수첩(info.js) · 사고파는 값(rules.js) · 특허장(court.js) · 소문(eventrumors.js)
   ■ 저장: state.glory = { o, oHelp, j, jWind, decl, clause, oath, charter, bill, next: {}, seen: {} } — 없으면 아직 */
(function (G) {
  'use strict';
  var U = G.U;
  var GL = G.Glory = {};
  function S() { return G.Game && G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.glory) || {}; }
  function L() { return G.GLORY; }
  GL.st = function () { var s = S(); return s ? s.glory || null : null; };
  function ensure() { var s = S(); if (!s.glory) s.glory = { o: 0, j: 0, decl: 0 }; var k = s.glory; k.next = k.next || {}; k.seen = k.seen || {}; return k; }
  function today() { return U.dateNum(S().date); }
  function numDate(n) { return { y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }; }
  function inWin(a, b) { var d = today(); return d >= a && d <= b; }
  function tut() { return !!(G.Tutorial && G.Tutorial.active && G.Tutorial.active()); }
  function ready(key) { var k = GL.st(); return !k || !k.next || !k.next[key] || S().day >= k.next[key]; }
  function owner(c) { return G.R.cityOwner ? G.R.cityOwner(c) : c.nation; }
  function english(c) { return !!c && /^(잉글랜드|영국)$/.test(owner(c) || ''); }
  function french(c) { return !!c && c.port && /^프랑스/.test(owner(c) || ''); }
  function who(id) { if (id === 'm') return G.Scenes.mateSpeaker('first'); if (id === 'n') return {}; return G.Hist ? G.Hist.speaker(id) : { name: id }; }
  function fill(t, extra) { var o = { name: S().player.name }; for (var k in extra || {}) o[k] = extra[k]; return String(t).replace(/\{(\w+)\}/g, function (m, a) { return o[a] != null ? o[a] : m; }); }
  async function lines(list, extra) { list = list || []; for (var i = 0; i < list.length; i++) await G.UI.say(fill(list[i][1], extra), who(list[i][0])); }
  async function scene(key, title, fn) { return G.Hist && G.Hist.withScene ? G.Hist.withScene(key, title, fn) : fn(); }
  async function pick(text, opts, w) { var v = await G.UI.ask(text, opts.map(function (x) { return { label: x.label, value: x.id }; }), w); return opts.filter(function (x) { return x.id === v; })[0] || opts[opts.length - 1]; }
  async function yesno(text, yes, no, w) { return (await G.UI.ask(text, [{ label: yes, value: 'yes' }, { label: no, value: 'no' }], w)) === 'yes'; }
  function give(key) {
    var id = B().gifts[key], def = G.ITEM[id]; if (!def) return '';
    if (G.R.hasItem(id)) return def.name;
    var kept = G.R.addItem(id, { value: def.price });
    if (!kept && G.R.storage) G.R.storage().push({ id: id, value: def.price });
    return def.name + (kept ? '' : ' (소지품이 가득해 자택 보관함에 맡겼다)');
  }
  function fame(cat, n) { return G.Fame && n ? G.Fame.add(cat, n) : 0; }
  function trust(id, n) { var SP = G.Sponsor, sp = G.SPONSOR && G.SPONSOR[id]; if (SP && sp && SP.present(sp) && SP.rel && SP.addTrust) SP.addTrust(SP.rel(sp.id), n || 0); }
  function save() { var s = S(); if (G.Game.refreshHud) G.Game.refreshHud(); if (s.settings && s.settings.autosave !== false && G.State.save) G.State.save(0); }
  function toast(t, ic) { G.UI.toast(t, ic || 'scroll', 6000); }

  // ---------------------------------------------------------------- 권리장전이 바꾼 것
  /** 권리장전이 법이 되었는가 */
  GL.billIn = function () { var s = S(); return !!(s && s.date && today() >= B().bill); };
  /** 잉글랜드 국왕은 더는 법을 면제(면세증)할 수 없다 (js/systems/court.js CT.charters) */
  GL.noDispense = function (realm) { return !!realm && realm.id === 'EN' && GL.billIn(); };
  GL.dispenseLine = function () { return L().dispense; };
  /** 의회의 교역 증서 (js/core/rules.js R.buyPrice/sellPrice) */
  GL.mult = function (c, g, side) {
    var k = GL.st(); if (!k || !k.charter || !english(c)) return 1;
    var t = B().charter; return side === 'buy' ? t.buy : t.sell;
  };

  // ---------------------------------------------------------------- 도시에 들어설 때 (js/scenes/city.js)
  GL.arrival = async function (c) {
    if (!c || tut()) return;
    var b = B(), k = GL.st(), o = k ? k.o : 0, j = k ? k.j : 0;
    if (c.id === b.amsterdam && !o && !j && inWin(b.oFrom, b.oUntil) && ready('o')) return oCall();
    if (c.id === b.london) {
      if (!j && !o && inWin(b.jFrom, b.jUntil) && ready('j')) return jCall();
      if (j === 2) { if (today() < b.flightFrom) { toast(L().jEarly); return; } if (today() <= b.flightUntil) return jFlight(); }
      if (!(k && k.decl) && inWin(b.declFrom, b.declUntil)) return decl();
    }
    if (j === 3 && french(c)) return jFrance(c);
  };

  // ================================================================ 오라녜 편
  async function oCall() {
    var D = L(), k = ensure();
    var ok = await scene('glory_amsterdam', '암스테르담의 「청어잡이 배」', async function () {
      if (!k.heardO) await lines(D.oCall); else await lines([['glory_bentinck', '{name} 제독, 바람이 아직 서쪽이오. 마음은 정했소?']]);
      k.heardO = 1;
      var y = await yesno(D.oAsk, D.oYes, D.oNo, who('glory_william3'));
      await lines(y ? D.oYesSay : D.oNoSay);
      return y;
    });
    if (!ok) { k.next.o = S().day + B().retry; return; }
    k.o = 1;
    G.State.log('오라녜 공 빌럼의 부름에 응했다 — 11월, 그의 함대와 함께 영국 해협을 건넌다.');
    toast(D.title + ' — 11월 11일 무렵부터 영국 해협에서 오라녜 공의 함대와 만난다', 'sail');
  }
  // 바다: 해협에 들어섰는가
  function inChannel() { var s = S(), l = s.loc, q = B().channel; return !!(l && l.mode === 'sea' && l.lat >= q[0] && l.lat <= q[1] && l.lon >= q[2] && l.lon <= q[3]); }
  GL.inChannel = inChannel;
  GL.seaPending = function () {
    var k = GL.st(); if (!k || !inChannel()) return false;
    if (k.o === 1 || k.j === 1) return true;
    return false;
  };
  GL.atSea = async function () {
    if (GL._busy || !GL.seaPending()) return;
    var k = GL.st(), b = B();
    if (today() < b.sail) { if (k.earlyDay !== S().day) { k.earlyDay = S().day; toast(k.o === 1 ? L().oEarly : L().jSeaEarly); } return; }
    GL._busy = true;
    try { if (k.o === 1) await oWind(); else if (k.j === 1) await jWind(); } finally { GL._busy = false; }
  };
  async function oWind() {
    var D = L(), b = B(), k = ensure();
    var late = today() > b.landing + 5;
    await scene('glory_wind', '개신교의 바람', async function () {
      await lines(late ? D.oLate : D.oWind);
      var h = await pick(D.oHelpAsk, D.oHelp, who('glory_william3'));
      k.oHelp = h.id;
      await lines(h.say);
      await lines(D.oAfter);
    });
    k.o = 'done'; k.wind = today();
    var got = give('banner');
    S().player.gold += b.oGold;
    var f = fame(k.oHelp === 'land' ? 'bt' : 'so', b.oFame);
    G.State.log('오라녜 공의 함대와 함께 영국 해협을 건너 토베이에 닿았다 — ' + (k.oHelp === 'land' ? '병사와 말을 뭍에 올렸다' : '선언문을 해안 마을에 뿌렸다') + '. (금화 ' + U.num(b.oGold) + '닢 · 「' + got + '」)');
    await G.UI.alert('<div class="center" style="font-size:22px;font-weight:700">' + D.title + ' — 토베이</div><br>오라녜 공 빌럼과 함께 잉글랜드에 닿았다.<br><b>' + U.esc(got) + '</b> · 금화 ' + U.num(b.oGold) + '닢 · ' + (k.oHelp === 'land' ? '전투' : '사교') + ' 명성 +' + f +
      '<br><span class="muted">1689년 2월 23일부터 런던 화이트홀에서 권리 선언이 읽힌다.</span>', D.title);
    save();
  }

  // ================================================================ 국왕 편
  async function jCall() {
    var D = L(), k = ensure();
    var ok = await scene('glory_whitehall', '화이트홀의 수군거림', async function () {
      if (!k.heardJ) await lines(D.jCall); else await lines([['glory_james2', '그대인가. 다트머스 경이 아직 기다리고 있소.']]);
      k.heardJ = 1;
      var y = await yesno(D.jAsk, D.jYes, D.jNo, who('glory_james2'));
      await lines(y ? D.jYesSay : D.jNoSay);
      return y;
    });
    if (!ok) { k.next.j = S().day + B().retry; return; }
    k.j = 1;
    G.State.log('제임스 2세의 부름에 응했다 — 다트머스 경의 함대에 서서 네덜란드 함대를 막는다.');
    toast(D.title + ' — 11월 11일 무렵부터 영국 해협·템스 어귀에서 국왕 함대와 함께', 'sail');
  }
  async function jWind() {
    var D = L(), k = ensure();
    await scene('glory_gunfleet', '동풍에 묶인 함대', async function () {
      await lines(D.jWind);
      var w = await pick(D.jWindAsk, D.jWinds, who('glory_dartmouth'));
      k.jWind = w.id;
      await lines(w.say);
    });
    k.j = 2; k.wind = today();
    if (k.jWind === 'chase') fame('bt', Math.round(B().jFame / 2));
    G.State.log('동풍에 묶인 국왕의 함대 곁에서, 오라녜 공의 함대가 해협을 지나가는 것을 보았다.');
    toast(D.jWindAfter, 'sail');
  }
  async function jFlight() {
    var D = L(), k = ensure();
    var y = await scene('glory_seal', '템스강에 던진 국새', async function () {
      await lines(D.jFlight);
      var v = await yesno(D.jFlightAsk, D.jFlightYes, D.jFlightNo, who('glory_james2'));
      await lines(v ? D.jFlightYesSay : D.jFlightNoSay);
      return v;
    });
    k.flight = today();
    if (!y) { k.j = 'refused'; G.State.log('달아나는 제임스 2세를 바다 건너로 모시는 일을 거절했다.'); return; }
    k.j = 3;
    G.State.log('한밤중 로체스터 강가에서 제임스 2세를 배에 모셨다 — 프랑스의 항구로 간다.');
    toast('제임스 2세를 프랑스의 항구(루앙·낭트 등)로', 'crown');
    save();
  }
  async function jFrance(c) {
    var D = L(), b = B(), k = ensure();
    await scene('glory_france', '바다 건너의 왕', async function () { await lines(D.jFrance); });
    k.j = 'done'; k.jdone = today();
    var got = give('ring'), so = fame('so', b.jFame);
    trust('fr_king', b.frTrust);
    G.State.log(c.name + '에서 제임스 2세를 프랑스 땅에 내려 드렸다 — 「' + got + '」을 받았다.');
    await G.UI.alert('<div class="center" style="font-size:22px;font-weight:700">' + D.title + ' — 바다 건너의 왕</div><br>왕관을 잃은 제임스 2세를 프랑스로 모셨다.<br><b>' + U.esc(got) + '</b> · 사교 명성 +' + so + ' · 프랑스 국왕의 신뢰', D.title);
    save();
  }

  // ================================================================ 권리 선언 (누구나)
  async function decl() {
    var D = L(), b = B(), k = ensure();
    await scene('glory_banqueting', '화이트홀 연회장의 권리 선언', async function () {
      await lines(D.decl);
      var cl = await pick(D.clauseAsk, D.clauses, {});
      k.clause = cl.id;
      await lines(cl.say);
      if (k.j === 'done') {
        var y = await yesno(D.oathAsk, D.oathYes, D.oathNo, who('glory_halifax'));
        k.oath = y ? 'yes' : 'no';
        await lines(y ? D.oathYesSay : D.oathNoSay);
      } else if (k.o === 'done') await lines(D.orangeThanks);
    });
    k.decl = 'seen'; k.declDay = today();
    var got = give('decl'), so = fame('so', b.declFame);
    G.State.log('런던 화이트홀 연회장에서 권리 선언이 읽히고 윌리엄 3세와 메리 2세가 왕관을 받는 것을 보았다.' + (k.oath === 'no' ? ' 새 왕에게 맹세하지 않았다.' : ''));
    toast('권리 선언 — 「' + got + '」 · 사교 명성 +' + so + (k.oath === 'no' ? '' : ' · 권리장전이 법이 되는 날 의회가 무언가를 보낸다고 한다'), 'scroll');
    save();
  }

  // ================================================================ 하루 (js/systems/world.js)
  GL.daily = function () {
    var s = S(), out = []; if (!s || !s.date) return out;
    var b = B(), D = L(), d = today(), k = s.glory || null;
    if (d < D.news[0].d || d > 16941231) return out;   // 이 이야기의 해들 밖에서는 아무것도 하지 않는다 (옛 저장에 state.glory를 만들지 않게)
    // 기한
    if (k) {
      if (k.o === 1 && d > b.oDue) { k.o = 'failed'; out.push({ icon: 'sail', text: '오라녜 공의 함대는 제독 없이 해협을 건넜다.' }); }
      if (k.j === 1 && d > b.oDue) { k.j = 'failed'; out.push({ icon: 'sail', text: '국왕의 함대는 제독 없이 동풍에 묶여 있었다.' }); }
      if (k.j === 2 && d > b.flightUntil) { k.j = 'late'; out.push({ icon: 'crown', text: '제임스 2세는 제독을 기다리지 못하고 다른 배로 프랑스에 건너갔다.' }); }
      if (k.j === 3 && d > b.jDue) { k.j = 'failed'; out.push({ icon: 'crown', text: '제임스 2세를 프랑스에 모시지 못했다 — 그는 다른 배를 갈아타고 건너갔다.' }); }
    }
    D.news.forEach(function (n, i) {
      if (d < n.d) return;
      var kk = k || {}, seen = kk.seen || {}; if (seen[i]) return;
      var show;
      if (n.need === 'all') show = U.dayIndex(S().date) - U.dayIndex(numDate(n.d)) <= 30;
      else show = !!(kk.o === 'done' || kk.j === 'done' || kk.decl === 'seen' || kk.j === 'refused' || kk.j === 'late');
      if (show && n.skip === 'wind' && kk.wind) show = false;
      if (show && n.skip === 'flight' && kk.flight) show = false;
      if (show && n.skip === 'jdone' && (kk.j === 3 || kk.j === 'done')) show = false;
      if (show && n.skip === 'decl' && kk.decl === 'seen') show = false;
      if (!k) { k = ensure(); }
      k.seen[i] = 1;
      if (n.bill) bill(out, show);
      if (!show) return;
      out.push({ icon: n.bill ? 'seal' : 'scroll', text: n.text, history: true });
      G.State.log(n.text);
    });
    return out;
  };
  /** 권리장전의 날: 잉글랜드 면세증 → 돌려받기 · 의회의 교역 증서 */
  function bill(out, show) {
    var s = S(), k = ensure(), D = L();
    if (k.bill) return; k.bill = today();
    var pa = s.court && s.court.papers, ex = pa && pa.exempt && pa.exempt.EN;
    if (ex && ex >= today()) {
      var PP = (G.BALANCE && G.BALANCE.court && G.BALANCE.court.papers) || {}, fee = PP.exemptFee || 12000, yrs = PP.exemptYears || 1;
      var leftDays = U.dayIndex(numDate(ex)) - U.dayIndex(s.date), back = Math.max(0, Math.round(fee * leftDays / (365 * yrs) / 100) * 100);
      delete pa.exempt.EN; s.player.gold += back;
      out.push({ icon: 'seal', text: fill(D.voided, { gold: U.num(back) }) }); G.State.log(fill(D.voided, { gold: U.num(back) }));
    }
    if (k.decl === 'seen' && k.oath !== 'no') { k.charter = 1; out.push({ icon: 'seal', text: D.charterGot, history: !!show }); G.State.log(D.charterGot); }
  }

  // ================================================================ 수첩
  GL.html = function () {
    var k = GL.st(), N = L().note, rows = [];
    if (k && k.o === 1) rows.push(N.o1);
    if (k && k.j === 1) rows.push(N.j1);
    if (k && k.j === 2) rows.push(N.j2);
    if (k && k.j === 3) rows.push(N.j3);
    if (k && (k.o === 'done' || k.j === 'done' || k.j === 'refused' || k.j === 'late') && !k.decl && today() <= B().declUntil) rows.push(N.decl);
    if (!rows.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">명예혁명 (1688~1689)</h4><div class="kv">' + rows.map(function (r) { return '<div>할 일</div><div>' + r + '</div>'; }).join('') + '</div>';
  };
})(window.G = window.G || {});
