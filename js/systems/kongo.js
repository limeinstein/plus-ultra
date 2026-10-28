/* 포르투갈과 콩고 왕국 (G.Kongo) — 자료·대사·조정값: js/data/kongo.js (G.KONGO · G.BALANCE.kongo)  2026-10-28 사용자 요청
   ■ 1편 「강가의 돌기둥」 (state.kongo.ep1) — 1482.8~1484년 리스본에 들어서면 주앙 2세가 부른다 (사양하면 두 달 뒤 다시)
     1 콩고 강 어귀(바다, G.BALANCE.kongo.mouth) 찾기 — 기한 2년. 닿으면 디오구 캉과 돌기둥 · 「넷을 데려가자」 → hostage(볼모) / willing(선물을 남기고 스스로 가겠다는 사람)
     2 은사쿠와 세 젊은이를 리스본으로 (1년) → 국왕이 맞고 하사금 · 마니 콩고에게 보낼 선물
     3 콩고 왕국의 항구(르완다)로 돌려보낸다 — 「열다섯 달」을 넘기면 늦은 것(보상이 준다), 3년을 넘기면 디오구 캉이 대신(실패)
     → 'done': 콩고 왕의 사자가 사제·장인을 청한다 = 외교·교역 관계가 생긴다 (르완다의 값 · 포르투갈어)
   ■ 2편 「주앙 1세의 세례」 (state.kongo.ep2) — 1편을 마친 제독에게만. 1490.10~1491년에 소식 → 리스본에 들어서면 국왕이 맡긴다
     1 사절 주앙 다 실바·사제·장인을 르완다로 (1년) → 마니 소요(마누엘)·주앙 1세·레오노르·아폰수의 세례 → 임금의 청: march(총병) / church(성당 금화) / trade(교역의 약속)
     2 왕의 편지·콩고 젊은이들을 리스본으로 (1년) → 'done': 하사금·명성·상아 뿔피리 · 르완다의 값이 더 좋아진다
   ■ 역사가 바뀌는 곳: 1491.5.3(또는 제독이 본 세례 날)부터 콩고 왕국의 항구는 가톨릭(교회·신부) — G.CITY_DATA[100].rel 을 날짜·저장으로 셈한다.
     1편을 마쳤거나 세례 날이 지나면 르완다에서 포르투갈어가 통한다 (G.Treaty.ptLang).
   ■ 소식: 은사쿠의 리스본 도착(1편) · 세례(2편을 하지 않은 모두 — 역사 소식) · 주앙 1세의 변심 · 아폰수 1세 · 엔히크 주교 · 아폰수의 편지(1526) · 성당의 종(church)
   ■ 끼어드는 곳: 하루(world.js) · 도시에 들어설 때(city.js) · 바다의 하루 끝(sea.js) · 수첩(info.js) · 사고파는 값(rules.js R.buyPrice/sellPrice) · 포르투갈어(treaty.js) · 소문(eventrumors.js)
   ■ 저장: state.kongo = { ep1, ep2, next, due, contact, how, late, met, help, bapt, done1, done2, call2, seen: {} } — 없으면 아직(옛 저장 그대로) */
(function (G) {
  'use strict';
  var U = G.U;
  var K = G.Kongo = {};
  function S() { return G.Game && G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.kongo) || {}; }
  function L() { return G.KONGO; }
  K.st = function () { var s = S(); return s ? s.kongo || null : null; };
  function ensure() { var s = S(); if (!s.kongo) s.kongo = { ep1: 0, ep2: 0 }; if (!s.kongo.seen) s.kongo.seen = {}; return s.kongo; }
  function today() { return U.dateNum(S().date); }
  function numDate(n) { return { y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }; }
  function addDays(n) { return U.dateNum(U.addDays(S().date, n)); }
  function left(due) { return U.dayIndex(numDate(due)) - U.dayIndex(S().date); }
  function tut() { return !!(G.Tutorial && G.Tutorial.active && G.Tutorial.active()); }

  // ---------------------------------------------------------------- 말하는 사람
  function face(seed, role, style, g, key) {
    var A = G.Art; return { portrait: A.withImg(A.npcSpec(seed, role, style, g), key ? [key] : []), half: key ? [key + '_half'] : null };
  }
  function king() {
    var sp = G.SPONSOR && G.SPONSOR.pt_king;
    if (sp && G.Sponsor && G.Sponsor.present(sp)) { try { return G.Sponsor.speaker(sp); } catch (e) { /* 아래로 */ } }
    var f = face('kongo_ptking', 'king', 'ib', 'm', 'portraits/npc-roles/ib/king'); return { name: '주앙 2세', portrait: f.portrait, half: f.half, lang: 3 };
  }
  function kingName() { var sp = G.SPONSOR && G.SPONSOR.pt_king; return sp && G.Sponsor && G.Sponsor.present(sp) ? G.Sponsor.holderName(sp) : '주앙 2세'; }
  function person(id, name) {
    var sp = G.Hist ? G.Hist.speaker(id) : { name: name, lang: 3 };
    if (name) sp.name = name;
    sp.special = true;
    return sp;
  }
  function who(code) {
    var k = K.st() || {}, f;
    if (code === 'k') return king();
    if (code === 'm') return G.Scenes.mateSpeaker('first');
    if (code === 'c') { f = face('kongo_cao', 'captain', 'ib', 'm', 'portraits/rivals/디오구 캉'); return { name: '디오구 캉', portrait: f.portrait, half: f.half, lang: 3, special: true }; }
    if (code === 's') return person(k.ep2 ? 'kongo_nsaku_envoy' : 'kongo_nsaku');
    if (code === 'y') return person('kongo_soyo');
    if (code === 'g') return person('kongo_nkuwu', k.bapt ? '주앙 1세 (은징가 아 은쿠우)' : '마니 콩고 은징가 아 은쿠우');
    if (code === 'a') return person('kongo_afonso', k.bapt ? '아폰수 왕자 (음벰바 아 은징가)' : '음벰바 아 은징가 왕자');
    if (code === 'p') return person('kongo_priest');
    return {};
  }
  function fill(t, extra) {
    var o = { name: S().player.name, king: kingName(), gifts: U.num(B().gifts) };
    for (var k in extra || {}) o[k] = extra[k];
    return String(t).replace(/\{(\w+)\}/g, function (m, a) { return o[a] != null ? o[a] : m; });
  }
  async function lines(list, extra) {
    list = [].concat(list || []);
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i]), code = l.charAt(0), t = l.slice(2);
      await G.UI.say(fill(t, extra), code === 'n' ? {} : who(code));
    }
  }
  function pic(img, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + img, title: title }) : null; }
  function give(id) {
    var def = G.ITEM[id]; if (!def) return '';
    var kept = G.R.addItem(id, { value: def.price });
    if (!kept && G.R.storage) G.R.storage().push({ id: id, value: def.price });
    return def.name + (kept ? '' : ' (소지품이 가득해 자택 보관함에 맡겼다)');
  }
  function trust(n) { var SP = G.Sponsor, sp = G.SPONSOR && G.SPONSOR.pt_king; if (SP && sp && SP.present(sp) && SP.rel && SP.addTrust) SP.addTrust(SP.rel(sp.id), n || 0); }
  function fame(cat, n) { return G.Fame && n ? G.Fame.add(cat, n) : 0; }
  function know(id) { var s = S(); if (s.known && s.known.indexOf(id) < 0) s.known.push(id); }
  function save() { var s = S(); if (G.Game.refreshHud) G.Game.refreshHud(); if (s.settings && s.settings.autosave !== false && G.State.save) G.State.save(0); }

  // ---------------------------------------------------------------- 지금의 사이 (값·말·믿음)
  /** 0 없음 · 1 1편을 마침 · 2 2편을 마침 · 3 2편에서 교역의 약속 */
  K.level = function () { var k = K.st(); if (!k) return 0; if (k.ep2 === 'done') return k.help === 'trade' ? 3 : 2; return k.ep1 === 'done' ? 1 : 0; };
  /** 르완다의 사고파는 값 (js/core/rules.js) */
  K.mult = function (c, g, side) {
    if (!c || c.id !== B().kongo || (G.R.cityOwner && G.R.cityOwner(c) !== '콩고 왕국')) return 1;   // 1576년 포르투갈령 루안다가 되면 콩고 왕과의 약속은 끝난다
    var lv = K.level(); if (!lv) return 1;
    var t = side === 'buy' ? B().buy : B().sell; return (t && t[lv - 1]) || 1;
  };
  /** 콩고 왕국 사람들이 그리스도교를 받아들였는가 (세례 날이 지났거나 제독이 세례를 보았다 — 2편으로 가는 중이면 아직) */
  K.christian = function () { var s = S(); if (!s || !s.date) return false; var k = s.kongo; if (k && k.bapt) return true; if (k && k.ep2 === 1) return false; return U.dateNum(s.date) >= B().baptism; };   // 제독이 사제들을 싣고 가는 중이면 세례는 제독이 닿는 날
  /** 르완다에서 포르투갈어가 통하는가 (js/systems/treaty.js T.ptLang) */
  K.ptLang = function (c) {
    if (!c || c.id !== B().kongo || !S()) return null;
    if (K.level() >= 1) return '리스본에서 돌아온 콩고 사람들과 왕의 사절 덕에 포르투갈어를 아는 사람이 많다';
    if (K.christian()) return '세례를 받은 콩고 왕실이 포르투갈과 사절을 주고받아 포르투갈어가 통한다';
    return null;
  };
  // 콩고 왕국 항구의 믿음: 세례 뒤에는 가톨릭(교회·신부) — 날짜와 저장으로 셈한다 (새 게임·불러오기에도 맞게)
  (function () {
    var c = G.CITY_DATA && G.CITY_DATA[B().kongo]; if (!c || c._kongoRel) return;
    var base = c.rel;
    try {
      Object.defineProperty(c, 'rel', { enumerable: true, configurable: true,
        get: function () { try { return K.christian() ? 'C' : base; } catch (e) { return base; } },
        set: function (v) { base = v; } });
      Object.defineProperty(c, '_kongoRel', { value: true });
    } catch (e) { /* 그대로 */ }
  })();

  // ---------------------------------------------------------------- 도시에 들어설 때 (js/scenes/city.js)
  K.arrival = async function (c) {
    if (!c || tut()) return;
    var k = K.st(), b = B(), d = today(), s = S();
    if (c.id === b.lisbon) {
      if ((!k || (!k.ep1 && (!k.next || s.day >= k.next))) && d >= b.from1 && d <= b.until1) return call1();
      if (k && k.ep1 === 2) return lisbon1();
      if (k && k.ep1 === 'done' && !k.ep2 && d >= b.from2 && d <= b.until2 && (!k.next2 || s.day >= k.next2)) return call2();
      if (k && k.ep2 === 2) return lisbon2b();
      return;
    }
    if (c.id === b.kongo && k) {
      if (k.ep1 === 3) return return1();
      if (k.ep2 === 1) return baptism();
    }
  };

  // ================================================================ 1편
  async function call1() {
    var D = L(), s = S(), b = B(), k = ensure();
    var pc = pic('kongo_call', '적도 너머의 큰 강');
    try {
      if (!k.asked1) await lines(D.call1);
      else await lines(['k:{name} 제독, 남쪽의 큰 강 말이다. 디오구 캉은 이미 떠났다. 마음을 정했는가?']);
      k.asked1 = 1;
      var v = await G.UI.ask(fill(D.ask1), [{ label: D.yes1, value: 'yes' }, { label: D.no1, value: 'no' }], who('k'));
      if (v !== 'yes') { k.next = s.day + (b.retry || 60); await lines(D.noSay1); return; }
      k.ep1 = 1; k.due = addDays(Math.round(b.findYears * 365));
      await lines(D.yesSay1);
    } finally { if (pc) await pc.stop(); }
    G.State.log(kingName() + '의 명 — 적도 남쪽의 큰 강(콩고 강)을 찾아 그 강가의 임금을 만난다 (기한 ' + U.fmtDate(numDate(k.due)) + ').');
    G.UI.toast(D.title1 + ' — 남위 6°·동경 12° 언저리, 바다가 흙빛으로 바뀌는 곳', 'compass', 6500);
  }
  /** 바다의 하루 끝 (js/scenes/sea.js): 강 어귀에 왔는가 */
  K.seaPending = function () {
    var k = K.st(), s = S(); if (!k || k.ep1 !== 1 || !s.loc || s.loc.mode !== 'sea') return false;
    var m = B().mouth; return G.Geo.dist(s.loc.lon, s.loc.lat, m[1], m[0]) < B().mouthR;
  };
  K.atSea = async function () {
    if (!K.seaPending() || K._busy) return;
    K._busy = true;
    try { await mouth(); } finally { K._busy = false; }
  };
  async function mouth() {
    var D = L(), s = S(), b = B(), k = K.st();
    var pc = pic('kongo_padrao', '상 조르즈의 돌기둥');
    try {
      await lines(D.mouth);
      var opts = D.how.map(function (x) { return { label: fill(x.label), value: x.id, dis: x.id === 'willing' && s.player.gold < b.gifts }; });
      var v = await G.UI.ask(D.ask1b, opts, who('c'));
      var h = D.how.filter(function (x) { return x.id === v; })[0] || D.how[0];
      if (h.id === 'willing' && s.player.gold < b.gifts) h = D.how[0];
      if (h.id === 'willing') s.player.gold -= b.gifts;
      k.how = h.id; k.contact = today(); k.met = k.contact;
      k.promise = U.dateNum(U.addDays(s.date, Math.round(b.promiseMonths * 30.4)));
      k.giveUp = addDays(Math.round(b.giveUpYears * 365));
      k.ep1 = 2; k.due = addDays(b.toLisbonDays);
      await lines(h.say);
      await lines(D.after1b);
    } finally { if (pc) await pc.stop(); }
    fame('ex', Math.round(b.fameEx1 / 2));
    know(b.kongo);
    G.State.log('콩고 강 어귀에서 디오구 캉과 함께 돌기둥을 세웠다. 콩고 사람 넷(은사쿠와 세 젊은이)이 배에 올랐다' + (k.how === 'willing' ? ' — 스스로 가겠다고 나선 사람들이다.' : ' — 열다섯 달 뒤에 돌려보내기로 했다.'));
    G.UI.toast('콩고 사람 넷을 리스본의 국왕께 모셔 간다', 'people', 6000);
    if (G.Growth) G.Growth.once('kongo_mouth', 'int', 1, '바다를 밀어내는 큰 강을 보았다');
  }
  async function lisbon1() {
    var D = L(), s = S(), b = B(), k = K.st();
    var pc = pic('kongo_lisbon1', '리스본의 손님');
    try { await lines(D.lisbon1, { gold: U.num(b.gold1a) }); } finally { if (pc) await pc.stop(); }
    s.player.gold += b.gold1a; trust(Math.round(b.trust1 / 2));
    k.ep1 = 3; k.due = k.giveUp;
    G.State.log('리스본에서 ' + kingName() + '께 콩고 사람 넷을 모셨다 — 하사금 금화 ' + U.num(b.gold1a) + '닢. 이제 그들을 콩고로 돌려보낸다 (약속 ' + U.fmtDate(numDate(k.promise)) + ').');
    G.UI.toast('은사쿠 일행을 콩고 왕국의 항구 르완다로 — 「열다섯 달」 ' + U.fmtDate(numDate(k.promise)), 'sail', 6500);
    save();
  }
  async function return1() {
    var D = L(), s = S(), b = B(), k = K.st();
    var late = today() > k.promise, f = late ? 0.6 : 1;
    var pc = pic('kongo_return', '돌아온 아들들');
    try {
      await lines(D.return1.slice(0, 2));
      if (late) await lines([D.lateLine1]);
      await lines(D.return1.slice(2));
    } finally { if (pc) await pc.stop(); }
    k.ep1 = 'done'; k.late = late ? 1 : 0; k.done1 = today(); k.due = 0;
    var gold = Math.round(b.gold1 * f);
    s.player.gold += gold;
    var ex = fame('ex', Math.round(b.fameEx1 / 2 * f)), so = fame('so', Math.round(b.fameSo1 * (k.how === 'willing' ? 1.4 : 1) * f));
    trust(Math.round(b.trust1 * f));
    var got = give(b.gift1);
    G.State.log('약속대로 은사쿠 일행을 콩고로 돌려보냈다' + (late ? '(늦었다)' : '') + '. 콩고 왕 은징가 아 은쿠우가 사절을 보내 사제와 장인을 청했다 — 포르투갈과 콩고 왕국 사이에 외교·교역이 열렸다.');
    if (G.Audio) G.Audio.sfx('cheer');
    await G.UI.alert('<div class="center" style="font-size:22px;font-weight:700">' + D.title1 + '</div><br>포르투갈과 콩고 왕국이 처음으로 손을 잡았다.' +
      '<br>금화 <b>' + U.num(gold) + '</b>닢 · <b>' + U.esc(got) + '</b><br>탐험 명성 +' + ex + ' · 사교 명성 +' + so +
      '<br><span class="muted">이제 르완다에서 값을 조금 더 좋게 쳐주고, 포르투갈어가 통한다.</span>', D.title1);
    save();
  }

  // ================================================================ 2편
  async function call2() {
    var D = L(), s = S(), b = B(), k = K.st();
    var pc = pic('kongo_lisbon2', '세례를 받은 사절');
    try {
      if (!k.asked2) await lines(D.lisbon2);
      else await lines(['k:{name} 제독, 콩고로 갈 사제들이 아직 부두에서 기다리고 있다.']);
      k.asked2 = 1;
      var v = await G.UI.ask(D.ask2, [{ label: D.yes2, value: 'yes' }, { label: D.no2, value: 'no' }], who('k'));
      if (v !== 'yes') { k.next2 = s.day + 30; await lines(D.noSay2); return; }
      k.ep2 = 1; k.due = addDays(Math.round(b.years2 * 365));
      await lines(D.yesSay2);
    } finally { if (pc) await pc.stop(); }
    G.State.log(kingName() + '의 명 — 사절 주앙 다 실바와 사제·장인을 콩고 왕국으로 실어 간다 (기한 ' + U.fmtDate(numDate(k.due)) + ').');
    G.UI.toast(D.title2 + ' — 콩고 왕국의 항구 르완다로', 'church', 6000);
  }
  async function baptism() {
    var D = L(), s = S(), b = B(), k = K.st();
    var pc = pic('kongo_baptism', '음반자 콩고의 세례');
    try {
      await lines(D.bapt.slice(0, 4));
      k.bapt = today();   // 이날부터 콩고 왕국은 가톨릭 (말하는 사람 이름도 주앙 1세로)
      await lines(D.bapt.slice(4));
      var crew = Math.max(1, Math.round((s.fleet.crew || 0) * b.marchCrew));
      var opts = D.help.map(function (x) {
        return { label: fill(x.label, { crew: crew, gold: U.num(b.churchGold) }), value: x.id, dis: x.id === 'church' && s.player.gold < b.churchGold };
      });
      var v = await G.UI.ask(D.ask2b, opts, who('g'));
      var h = D.help.filter(function (x) { return x.id === v; })[0] || D.help[2];
      if (h.id === 'church' && s.player.gold < b.churchGold) h = D.help[2];
      k.help = h.id;
      if (h.id === 'march') { s.fleet.crew = Math.max(G.R.crewMin ? Math.min(G.R.crewMin(), s.fleet.crew) : 1, s.fleet.crew - crew); fame('bt', b.fameBt2); }
      if (h.id === 'church') { s.player.gold -= b.churchGold; fame('so', Math.round(b.fameSo2 / 2)); }
      await lines(h.say);
      await lines(D.letter2);
    } finally { if (pc) await pc.stop(); }
    k.ep2 = 2; k.due = addDays(Math.round(b.years2 * 365));
    fame('ex', b.fameEx2);
    var got = give(b.gift2);
    G.State.log('음반자 콩고에서 콩고 왕 은징가 아 은쿠우가 세례를 받아 주앙 1세가 되었다. 제독은 그 자리를 지켜보았다' + (got ? ' — 「' + got + '」을 받았다' : '') + '. 이제 왕의 편지와 콩고 젊은이들을 리스본으로 모셔 간다.');
    G.UI.toast('주앙 1세의 편지와 콩고 젊은이들을 리스본으로', 'scroll', 6500);
    save();
  }
  async function lisbon2b() {
    var D = L(), s = S(), b = B(), k = K.st();
    var pc = pic('kongo_students', '산투 엘로이로 가는 아이들');
    try { await lines(D.lisbon2b); } finally { if (pc) await pc.stop(); }
    k.ep2 = 'done'; k.done2 = today(); k.due = 0;
    s.player.gold += b.gold2;
    var so = fame('so', b.fameSo2), ex = fame('ex', Math.round(b.fameEx2 / 2));
    trust(b.trust2);
    if (G.Growth) G.Growth.once('kongo_bapt', 'cha', 1, '두 왕국을 이었다');
    G.State.log('리스본에서 ' + kingName() + '께 콩고 왕 주앙 1세의 편지를 전했다. 두 왕국 사이에 사절과 사제, 배움의 길이 열렸다 — 하사금 금화 ' + U.num(b.gold2) + '닢.');
    if (G.Audio) G.Audio.sfx('cheer');
    var lv = K.level(), pb = Math.round((1 - b.buy[lv - 1]) * 100), ps = Math.round((b.sell[lv - 1] - 1) * 100);
    await G.UI.alert('<div class="center" style="font-size:22px;font-weight:700">' + D.title2 + '</div><br>포르투갈과 콩고 왕국 사이에 외교·종교 교류가 넓어졌다.' +
      '<br>하사금 금화 <b>' + U.num(b.gold2) + '</b>닢 · 사교 명성 +' + so + ' · 탐험 명성 +' + ex +
      '<br><span class="muted">르완다에서 사는 값 −' + pb + '%' + (ps ? ' · 파는 값 +' + ps + '%' : '') + ' · 콩고 왕국의 항구에 교회가 섰다.</span>', D.title2);
    save();
  }

  // ================================================================ 하루 (js/systems/world.js): 기한 · 2편의 부름 · 소식
  function fail(ep, text) {
    var k = K.st(); k['ep' + ep] = 'failed'; k.due = 0;
    G.State.log(text);
    return { icon: 'scroll', text: text, history: true };
  }
  K.daily = function () {
    var s = S(), out = []; if (!s || !s.date) return out;
    var k = K.st(), b = B(), d = today(), D = L();
    if (k) {
      // 1편의 기한
      if (k.ep1 === 1 && k.due && d > k.due) out.push(fail(1, D.fail1find));
      if (k.ep1 === 2 && k.due && d > k.due) { k.ep1 = 3; k.due = k.giveUp; }   // 리스본에 늦어도 — 돌려보낼 약속은 남는다
      if (k.ep1 === 3) {
        if (!k.reminded && k.promise && left(k.promise) <= 60 && left(k.promise) >= 0) { k.reminded = 1; out.push({ icon: 'hourglass', text: D.remind1 }); }
        if (k.giveUp && d > k.giveUp) out.push(fail(1, D.fail1give));
      }
      // 2편의 부름 (1편을 마친 제독에게만)
      if (k.ep1 === 'done' && !k.ep2 && !k.call2 && d >= b.from2 && d <= b.until2) { k.call2 = 1; out.push({ icon: 'church', text: fill(D.call2), history: true }); }
      if (k.ep1 === 'done' && !k.ep2 && d > b.until2) k.ep2 = 'missed';
      if ((k.ep2 === 1 || k.ep2 === 2) && k.due && d > k.due) {
        var was = k.ep2;
        out.push(fail(2, D.fail2));
        if (was === 1 && d >= b.baptism) { k.seen.bapt = 1; out.push({ icon: 'scroll', text: D.news[1].text, history: true }); }
        if (was === 2) k.ep2 = 'half';   // 세례는 보았다 — 리스본에는 가지 못했다
      }
    }
    // 소식
    var N = D.news;
    for (var i = 0; i < N.length; i++) {
      var n = N[i], key = i === 1 ? 'bapt' : i;
      if (d < n.d) continue;
      var kk = ensureSeen(); if (kk[key]) continue;
      var ok;
      if (n.need === 'none') {
        // 역사 소식: 2편으로 제독이 직접 겪는(겪은) 사람에게는 오지 않는다. 오래 지난 저장에는 띄우지 않는다
        ok = !(k && (k.ep2 === 1 || k.ep2 === 2 || k.ep2 === 'done' || k.ep2 === 'half' || k.bapt)) && (U.dayIndex(S().date) - U.dayIndex(numDate(n.d)) <= 30);
        if (k && k.ep2 === 1) continue;   // 아직 가는 중 — 실패하면 그때 띄운다
      } else if (n.need === 'met1') ok = !!(k && k.ep1 === 'done' && k.done1 < n.d);
      else ok = !!(k && k.ep2 === 'done' && k.done2 < n.d && (!n.help || k.help === n.help));
      kk[key] = 1;
      if (!ok) continue;
      out.push({ icon: 'scroll', text: n.text, history: true });
      G.State.log(n.text);
    }
    return out;
  };
  function ensureSeen() { var s = S(); if (!s.kongo) s.kongo = { ep1: 0, ep2: 0, seen: {} }; if (!s.kongo.seen) s.kongo.seen = {}; return s.kongo.seen; }

  // ================================================================ 수첩
  K.html = function () {
    var k = K.st(); if (!k) return '';
    var D = L(), ep = (k.ep1 === 1 || k.ep1 === 2 || k.ep1 === 3) ? 1 : (k.ep2 === 1 || k.ep2 === 2) ? 2 : 0; if (!ep) return '';
    var st = ep === 1 ? k.ep1 : k.ep2, note = ep === 1 ? D.note1[st] : D.note2[st];
    var rows = '<div>맡긴 사람</div><div>' + kingName() + ' (포르투갈 국왕, 리스본)</div><div>할 일</div><div>' + note + '</div>';
    if (ep === 1 && st === 3 && k.promise) { var lp = left(k.promise); rows += '<div>약속</div><div>열다섯 달 — ' + U.fmtDate(numDate(k.promise)) + (lp < 0 ? ' <span class="warn-text">(지났다)</span>' : ' (남은 ' + lp + '일)') + '</div>'; }
    if (k.due) { var l = left(k.due); rows += '<div>기한</div><div>' + U.fmtDate(numDate(k.due)) + (l < 0 ? ' <span class="warn-text">(지남)</span>' : ' (남은 ' + l + '일)') + '</div>'; }
    return '<div class="sep"></div><h4 style="margin:0 0 8px">포르투갈과 콩고 — ' + (ep === 1 ? D.title1 : D.title2) + '</h4><div class="kv">' + rows + '</div>';
  };
})(window.G = window.G || {});
