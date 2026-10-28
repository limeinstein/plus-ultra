/* 하늘을 재는 사람들 — 나침반과 망원경 (G.Sky) — 자료·대사·조정값: js/data/skylore.js (G.SKY · G.BALANCE.sky)  2026-10-29 사용자 요청
   제1부 「하늘의 한가운데」(나침반): ① 코페르니쿠스의 원고(state.sky.cop) → ② 케플러와 나침반(state.sky.kep)
   제2부 「별의 전령」(망원경): ③ 갈릴레이의 망원경(state.sky.gal) → ④ 재판(state.sky.trial)·원고(state.sky.ms) — ④는 ③을 해낸 제독만
   ■ ① cop: 0 → 1 원고를 뉘른베르크로(1년) → 2 찍는 중(240일, 다 찍히면 첫 책이 제독에게 온다) → 3 단치히로(2년) → 'done'(1543.5.24 전) / 'late'(뒤 — 기제 주교) / 'failed'
       뉘른베르크에서 오시안더의 머리말: pref 'accept' | 'protest' (protest면 1609년 케플러가 머리말의 주인을 밝히는 소식)
   ■ ② kep: 0 → 1 나침반으로 네 바다 가운데 세 곳(reads) → 프라하 → 'done'(편차 나침반) / 'failed'. 바다에서 잴 때 나침반(compass 또는 편차 나침반)이 있어야 한다.
   ■ ③ gal: 0 → 1 갈릴레이의 망원경을 받고 먼 바다(항구를 떠나 4일 넘게)에서 시험(test 'chair'|'calm') → 2 베니스·피렌체에서 알린다 → 'done' / 'failed'
       갈릴레이의 망원경은 보통 망원경보다 발견 거리를 1.5배 늘린다 (js/systems/explore.js).
   ■ ④ trial: 1633.4.12~6.22 로마 → 'seen'(testify 'testify'|'silent') · ms: 1636~1638.6 피렌체·베니스 → 1 암스테르담으로 → 'done' / 'failed'
   ■ 케플러·갈릴레이가 동료로 배에 타 있으면 그 사람의 도시가 아니어도 그 자리에서 이야기한다.
   ■ 소식(G.SKY.news): 해낸 사람에게만 — 코페르니쿠스의 죽음 · 『새 천문학』 · 금서(1616) · 세 번째 법칙 · 루돌프 표(물건) · 케플러의 죽음 · 『대화』 · 맹세 · 『새로운 두 과학』 · 갈릴레이의 죽음 · 뉴턴
   ■ 끼어드는 곳: 하루(world.js) · 도시에 들어설 때(city.js) · 바다의 하루 끝(sea.js) · 수첩(info.js) · 발견 거리(explore.js) · 소문(eventrumors.js)
   ■ 저장: state.sky = { cop, pref, ready, copDone, kep, reads: {바다: 날}, kepDone, gal, test, galDone, trial, testify, ms, msDone, due: {}, next: {}, seen: {} } — 없으면 아직 */
(function (G) {
  'use strict';
  var U = G.U;
  var SK = G.Sky = {};
  function S() { return G.Game && G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.sky) || {}; }
  function L() { return G.SKY; }
  SK.st = function () { var s = S(); return s ? s.sky || null : null; };
  function ensure() { var s = S(); if (!s.sky) s.sky = { cop: 0, kep: 0, gal: 0, trial: 0, ms: 0 }; var k = s.sky; k.due = k.due || {}; k.next = k.next || {}; k.seen = k.seen || {}; k.reads = k.reads || {}; return k; }
  function today() { return U.dateNum(S().date); }
  function numDate(n) { return { y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }; }
  function addDays(n) { return U.dateNum(U.addDays(S().date, n)); }
  function left(due) { return U.dayIndex(numDate(due)) - U.dayIndex(S().date); }
  function fmt(n) { return U.fmtDate(numDate(n)); }
  function tut() { return !!(G.Tutorial && G.Tutorial.active && G.Tutorial.active()); }
  function has(id) { return G.R.hasItem(id); }
  function aboard(id) { var s = S(); return !!(s && s.mates && s.mates.some(function (m) { return m.id === id; })); }
  function inWin(a, b) { var d = today(); return d >= a && d <= b; }
  function ready(key) { var k = SK.st(); return !k || !k.next || !k.next[key] || S().day >= k.next[key]; }

  // ---------------------------------------------------------------- 말하는 사람
  function face(seed, role, style, g, key) { var A = G.Art; return { portrait: A.withImg(A.npcSpec(seed, role, style, g), key ? [key] : []), half: key ? [key + '_half'] : null }; }
  function npc(name, seed, role, style, key, special) { var f = face(seed, role, style, 'm', key); return { name: name, portrait: f.portrait, half: f.half, lang: 3, special: !!special }; }
  function sponsor(id, name, seed, role, style) {
    var sp = G.SPONSOR && G.SPONSOR[id];
    if (sp && G.Sponsor && G.Sponsor.present(sp)) { try { return G.Sponsor.speaker(sp); } catch (e) { /* 아래로 */ } }
    return npc(name, seed, role, style, 'portraits/sponsors/' + id, true);
  }
  function mate(id) { var d = G.MATE && G.MATE[id]; return { name: d ? d.name : id, rigId: 'mate:' + id, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true }; }
  function who(code) {
    switch (code) {
      case 'c': return sponsor('pl_copernicus', '니콜라우스 코페르니쿠스', 'sky_cop', 'scholar', 'ne');
      case 'r': return npc('레티쿠스', 'sky_rheticus', 'scholar', 'ne', 'portraits/npc-roles/ne/scholar', true);
      case 'o': return npc('안드레아스 오시안더', 'sky_osiander', 'priest', 'ne', 'portraits/npc-roles/ne/priest');
      case 't': return npc('인쇄업자 페트레이우스', 'sky_petreius', 'merchant', 'ne', 'portraits/npc-roles/ne/merchant');
      case 'g': return npc('티데만 기제 주교', 'sky_giese', 'noble', 'ne', 'portraits/npc-roles/ne/noble');
      case 'k': return mate('kepler');
      case 'l': return mate('galileo');
      case 'd': return sponsor('it_doge', '베네치아 도제', 'sky_doge', 'king', 'it');
      case 'q': return npc('종교재판관', 'sky_inq', 'priest', 'it', 'portraits/npc-roles/it/priest');
      case 'f': return npc('풀젠치오 미칸치오 수사', 'sky_micanzio', 'scholar', 'it', 'portraits/npc-roles/it/scholar');
      case 'e': return npc('로데베이크 엘제비르', 'sky_elzevir', 'merchant', 'ne', 'portraits/npc-roles/ne/merchant');
      case 'm': return G.Scenes.mateSpeaker('first');
    }
    return {};
  }
  function fill(t, extra) {
    var o = { name: S().player.name };
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
  async function scene(img, title, fn) { var pc = pic(img, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function give(key) {
    var id = B().gifts[key], def = G.ITEM[id]; if (!def) return '';
    if (has(id)) return def.name;
    var kept = G.R.addItem(id, { value: def.price });
    if (!kept && G.R.storage) G.R.storage().push({ id: id, value: def.price });
    return def.name + (kept ? '' : ' (소지품이 가득해 자택 보관함에 맡겼다)');
  }
  function fame(cat, n) { return G.Fame && n ? G.Fame.add(cat, n) : 0; }
  function trust(id, n) { var SP = G.Sponsor, sp = G.SPONSOR && G.SPONSOR[id]; if (SP && sp && SP.present(sp) && SP.rel && SP.addTrust) SP.addTrust(SP.rel(sp.id), n || 0); }
  function save() { var s = S(); if (G.Game.refreshHud) G.Game.refreshHud(); if (s.settings && s.settings.autosave !== false && G.State.save) G.State.save(0); }
  async function ask(text, opts, w) { return G.UI.ask(text, opts, w); }
  async function offer(key, D, w) {   // 맡을까? — 사양하면 두 달 뒤
    var v = await ask(D.ask, [{ label: D.yes, value: 'yes' }, { label: D.no, value: 'no' }], w);
    if (v === 'yes') return true;
    ensure().next[key] = S().day + 60;
    if (D.noSay) await lines(D.noSay);
    return false;
  }
  async function alertDone(title, html) { if (G.Audio) G.Audio.sfx('discover'); await G.UI.alert('<div class="center" style="font-size:22px;font-weight:700">' + title + '</div><br>' + html, title); }

  // ---------------------------------------------------------------- 도시에 들어설 때 (js/scenes/city.js)
  SK.arrival = async function (c) {
    if (!c || tut()) return;
    var b = B(), k = SK.st(), id = c.id;
    var cop = k ? k.cop : 0, kep = k ? k.kep : 0, gal = k ? k.gal : 0;
    // ① 코페르니쿠스
    if (id === b.danzig && !cop && inWin(b.copFrom, b.copUntil) && ready('cop')) return copOffer();
    if (id === b.nuremberg && cop === 1) return copPrint();
    if (id === b.danzig && cop === 3) return copDeliver();
    // ② 케플러 (동료로 타 있으면 어디서나)
    var kepHere = id === b.prague || aboard('kepler');
    if (kepHere && !kep && inWin(b.kepFrom, b.kepUntil) && ready('kep')) return kepOffer();
    if (kepHere && kep === 1 && SK.reads() >= b.kepNeed) return kepDone();
    // ③ 갈릴레이 (베니스 — 1610.9부터는 피렌체도)
    var galHere = id === b.venice || (id === b.florence && today() >= 16100901) || aboard('galileo');
    if (galHere && !gal && inWin(b.galFrom, b.galUntil) && ready('gal')) return galOffer();
    if ((galHere || id === b.florence) && gal === 2) return galReport();
    // ④ 재판 · 원고 (③을 해낸 제독)
    if (gal === 'done') {
      if (id === b.rome && !k.trial && inWin(b.trialFrom, b.trialUntil)) return trial();
      if ((id === b.florence || id === b.venice) && !k.ms && inWin(b.msFrom, b.msUntil) && ready('ms')) return msOffer(id === b.venice);
      if (id === b.amsterdam && k.ms === 1) return msDone();
    }
  };

  // ================================================================ ① 코페르니쿠스의 원고
  async function copOffer() {
    var D = L(), b = B(), k = ensure();
    var ok = await scene('sky_frauenburg', '프라우엔부르크의 탑 방', async function () {
      if (!k.heardCop) await lines(D.cop); else await lines(['r:{name} 제독! 선생님의 원고는 아직 서랍 안에 있습니다.']);
      k.heardCop = 1;
      var y = await offer('cop', { ask: D.copAsk, yes: D.copYes, no: D.copNo, noSay: D.copNoSay }, who('c'));
      if (y) await lines(D.copYesSay);
      return y;
    });
    if (!ok) return;
    k.cop = 1; k.due.cop = addDays(b.copDays);
    G.State.log('코페르니쿠스의 원고 『천구의 회전에 관하여』를 맡았다 — 뉘른베르크의 페트레이우스 인쇄소로 (기한 ' + fmt(k.due.cop) + ').');
    G.UI.toast(L().title1 + ' — 원고를 뉘른베르크 인쇄소로', 'scroll', 6000);
  }
  async function copPrint() {
    var D = L(), b = B(), k = ensure();
    await scene('sky_nuremberg', '뉘른베르크의 인쇄소', async function () {
      await lines(D.nur);
      var v = await ask(D.prefAsk, D.pref.map(function (x) { return { label: x.label, value: x.id }; }), who('o'));
      var p = D.pref.filter(function (x) { return x.id === v; })[0] || D.pref[0];
      k.pref = p.id;
      await lines(p.say);
      await lines([D.nurAfter]);
    });
    k.cop = 2; k.ready = addDays(b.printDays); k.due.cop = 0;
    G.State.log('뉘른베르크 페트레이우스 인쇄소에 코페르니쿠스의 원고를 넘겼다' + (k.pref === 'protest' ? ' — 이름 없는 머리말은 오시안더가 쓴 것이라고 일지에 적어 두었다.' : '.'));
    UI_toast('첫 책이 찍히면 제독 앞으로 온다 (' + fmt(k.ready) + ' 무렵)', 'scroll');
    save();
  }
  function UI_toast(t, ic) { G.UI.toast(t, ic || 'scroll', 5500); }
  async function copDeliver() {
    var D = L(), b = B(), k = ensure(), d = today();
    var alive = d <= b.copDeath, deathbed = alive && left(b.copDeath) <= 45;
    await scene(alive ? 'sky_firstbook' : 'sky_frauenburg', alive ? '첫 책' : '프라우엔부르크의 종소리', async function () {
      if (alive) { await lines(deathbed ? D.copBook : D.copBookWell); if (k.pref) await lines([D.prefTold]); }
      else await lines(D.copLate);
    });
    k.cop = alive ? 'done' : 'late'; k.copDone = d; k.due.cop = 0;
    var got = give('book'), gold = alive ? b.copGold : 0;
    if (gold) S().player.gold += gold;
    var so = fame('so', alive ? b.copFame : Math.round(b.copFame / 2)), ex = fame('ex', Math.round(b.copFame / 2));
    if (alive) trust('pl_copernicus', b.copTrust);
    G.State.log(alive ? '프라우엔부르크에서 코페르니쿠스께 『천구의 회전에 관하여』 첫 책을 전했다.' : '코페르니쿠스는 책을 보지 못하고 세상을 떠났다. 기제 주교가 첫 책을 받았다.');
    await alertDone(L().title1 + ' — 코페르니쿠스의 책', (alive ? '코페르니쿠스가 살아서 자기 책을 받았다.' : '코페르니쿠스는 이미 세상을 떠났다.') + '<br><b>' + U.esc(got) + '</b>' + (gold ? ' · 금화 ' + U.num(gold) + '닢' : '') + '<br>사교 명성 +' + so + ' · 탐험 명성 +' + ex);
    save();
  }

  // ================================================================ ② 케플러와 나침반
  SK.reads = function () { var k = SK.st(); return k && k.reads ? Object.keys(k.reads).length : 0; };
  async function kepOffer() {
    var D = L(), b = B(), k = ensure();
    var ok = await scene('sky_prague', '프라하의 셈하는 방', async function () {
      if (!k.heardKep) { await lines(D.kep); if (has(b.gifts.book)) await lines([D.kepBook]); }
      else await lines(['k:선장, 바다의 나침반 이야기 — 생각해 보셨습니까?']);
      k.heardKep = 1;
      var y = await offer('kep', { ask: D.kepAsk, yes: D.kepYes, no: D.kepNo, noSay: D.kepNoSay }, who('k'));
      if (y) await lines(D.kepYesSay);
      return y;
    });
    if (!ok) return;
    k.kep = 1; k.reads = {}; k.due.kep = addDays(Math.round(b.kepYears * 365));
    G.State.log('케플러의 부탁 — 네 바다 가운데 세 곳에서 나침반 바늘이 북극성에서 비켜 가는 각도를 잰다 (기한 ' + fmt(k.due.kep) + ').');
    UI_toast(L().title1 + ' — 아조레스 서쪽·아굴랴스 곶·인도 서해안·카리브 해 가운데 세 곳에서 나침반을 재자', 'compass');
    if (!has('compass') && !has(b.gifts.compass)) UI_toast(L().noCompass, 'compass');
  }
  async function kepDone() {
    var D = L(), b = B(), k = ensure();
    await scene('sky_ellipse', '타원', async function () { await lines(D.kepDone); });
    k.kep = 'done'; k.kepDone = today(); k.due.kep = 0;
    var got = give('compass');
    S().player.gold += b.kepGold;
    var ex = fame('ex', b.kepFameEx), so = fame('so', b.kepFameSo);
    if (G.Growth) G.Growth.once('sky_kepler', 'int', 1, '바다의 나침반으로 하늘의 법칙을 함께 찾았다');
    G.State.log('프라하에서 케플러에게 세 바다의 나침반 기록을 전했다. 화성의 길은 타원이었다 — 「' + got + '」을 받았다.');
    await alertDone(L().title1 + ' — 케플러의 법칙', '행성은 해를 한쪽 초점에 둔 <b>타원</b>을 그리며, 같은 시간에 같은 넓이를 쓸고 간다.<br><b>' + U.esc(got) + '</b> · 금화 ' + U.num(b.kepGold) + '닢<br>탐험 명성 +' + ex + ' · 사교 명성 +' + so);
    save();
  }

  // ================================================================ ③ 갈릴레이의 망원경
  async function galOffer() {
    var D = L(), b = B(), k = ensure();
    var ok = await scene('sky_campanile', '산 마르코 종탑의 망원경', async function () {
      if (!k.heardGal) {
        await lines(D.gal);
        await lines(D.galNight);
        await lines(today() >= b.galMoons ? D.galMoons : [D.galNoMoons]);
        if (has(b.gifts.compass)) await lines([D.galKep]);
        else if (has(b.gifts.book)) await lines([D.galBook]);
        await lines(D.galLong);
      } else await lines(['l:선장! 목성의 시계 이야기 — 아직 마음이 있으십니까?']);
      k.heardGal = 1;
      return offer('gal', { ask: D.galAsk, yes: D.galYes, no: D.galNo, noSay: D.galNoSay }, who('l'));
    });
    if (!ok) return;
    k.gal = 1; k.due.gal = addDays(Math.round(b.galYears * 365));
    var got = give('scope');
    G.State.log('갈릴레이에게서 「' + got + '」을 받았다 — 먼 바다에서 목성의 달을 겨누어 본다 (기한 ' + fmt(k.due.gal) + ').');
    UI_toast(L().title2 + ' — 항구를 떠나 ' + b.testDays + '일 넘게 지난 먼 바다에서 목성을 겨누자', 'star');
  }
  async function galTest() {
    var D = L(), k = ensure();
    await scene('sky_deck', '흔들리는 갑판의 목성', async function () {
      await lines(D.test);
      var v = await ask(D.testAsk, D.tests.map(function (x) { return { label: x.label, value: x.id }; }), who('m'));
      var t = D.tests.filter(function (x) { return x.id === v; })[0] || D.tests[0];
      k.test = t.id;
      await lines(t.say);
    });
    k.gal = 2;
    G.State.log('바다에서 갈릴레이의 망원경으로 목성의 달을 겨누어 보았다 — ' + (k.test === 'calm' ? '잔잔한 밤 한 번, 달이 숨는 순간을 적었다.' : '매단 의자 위에서 네 달을 보았다.'));
    UI_toast(D.testDone, 'star');
  }
  async function galReport() {
    var D = L(), b = B(), k = ensure();
    await scene('sky_campanile', '하늘의 시계', async function () { await lines(D.galReport); });
    k.gal = 'done'; k.galDone = today(); k.due.gal = 0;
    S().player.gold += b.galGold;
    var ex = fame('ex', b.galFameEx), so = fame('so', b.galFameSo);
    trust('it_medici', 10);
    if (G.Growth) G.Growth.once('sky_galileo', 'int', 1, '망원경으로 하늘을 보았다');
    G.State.log('갈릴레이에게 바다에서 본 목성의 달을 알렸다 — 금화 ' + U.num(b.galGold) + '닢.');
    await alertDone(L().title2 + ' — 갈릴레이의 망원경', '바다 위에서 처음으로 목성의 달을 본 선장이 되었다.<br><b>' + U.esc(G.ITEM[b.gifts.scope].name) + '</b>은 제독의 것 — 수평선 너머를 더 멀리 본다.<br>금화 ' + U.num(b.galGold) + '닢 · 탐험 명성 +' + ex + ' · 사교 명성 +' + so);
    save();
  }

  // ================================================================ ④ 재판 · 원고
  async function trial() {
    var D = L(), b = B(), k = ensure();
    await scene('sky_trial', '1633년 로마', async function () {
      await lines(D.trial);
      var v = await ask(D.trialAsk, D.testify.map(function (x) { return { label: x.label, value: x.id }; }), who('q'));
      var t = D.testify.filter(function (x) { return x.id === v; })[0] || D.testify[1];
      k.testify = t.id;
      await lines(t.say);
      await lines(D.abjure);
    });
    k.trial = 'seen';
    if (k.testify === 'testify') { fame('so', b.testifyFame); trust('it_pope', b.popeTrust); }
    G.State.log('로마에서 갈릴레이의 재판을 지켜보았다' + (k.testify === 'testify' ? ' — 종교재판관 앞에서 바다에서 본 목성의 달을 증언했다.' : '.') + ' 갈릴레이는 무릎을 꿇었다.');
    UI_toast(D.trialAfter, 'scroll');
    save();
  }
  async function msOffer(venice) {
    var D = L(), b = B(), k = ensure();
    var ok = await scene('sky_arcetri', '아르체트리의 창가', async function () {
      if (venice) await lines(['n:베니스의 세르비테 수도원에서 제독을 찾는 전갈이 왔다.', D.msVenice]);
      else await lines(D.ms);
      var y = await offer('ms', { ask: D.msAsk, yes: D.msYes, no: D.msNo }, venice ? who('f') : who('l'));
      if (y) await lines(D.msYesSay);
      return y;
    });
    if (!ok) return;
    k.ms = 1; k.due.ms = addDays(b.msDays);
    G.State.log('갈릴레이의 『새로운 두 과학』 원고를 맡았다 — 암스테르담의 엘제비르에게 (기한 ' + fmt(k.due.ms) + ').');
    UI_toast('『새로운 두 과학』 원고를 암스테르담으로', 'scroll');
  }
  async function msDone() {
    var D = L(), b = B(), k = ensure();
    await scene('sky_elzevir', '레이던에서 찍힌 책', async function () { await lines(D.msDone); });
    k.ms = 'done'; k.msDone = today(); k.due.ms = 0;
    var got = give('twosci');
    S().player.gold += b.msGold;
    var so = fame('so', b.msFameSo);
    G.State.log('암스테르담의 엘제비르에게 갈릴레이의 원고를 전했다. 『새로운 두 과학』이 레이던에서 찍혀 나왔다.');
    await alertDone(L().title2 + ' — 『새로운 두 과학』', '이탈리아가 내쫓은 책이 네덜란드에서 세상에 나왔다.<br><b>' + U.esc(got) + '</b> · 금화 ' + U.num(b.msGold) + '닢 · 사교 명성 +' + so);
    save();
  }

  // ================================================================ 바다의 하루 끝 (js/scenes/sea.js)
  function seaHere() { var s = S(), b = B(), l = s.loc; if (!l || l.mode !== 'sea') return null; for (var i = 0; i < b.seas.length; i++) { var q = b.seas[i]; if (G.Geo.dist(l.lon, l.lat, q[2], q[1]) < q[3]) return q; } return null; }
  SK.seaPending = function () {
    var k = SK.st(), s = S(); if (!k || !s.loc || s.loc.mode !== 'sea') return false;
    if (k.kep === 1) { var q = seaHere(); if (q && !k.reads[q[0]]) return true; }
    if (k.gal === 1 && (s.fleet.daysOut || 0) >= B().testDays) return true;
    return false;
  };
  SK.atSea = async function () {
    if (SK._busy || !SK.seaPending()) return;
    SK._busy = true;
    try {
      var k = SK.st(), b = B(), D = L();
      if (k.kep === 1) {
        var q = seaHere();
        if (q && !k.reads[q[0]]) {
          if (!has('compass') && !has(b.gifts.compass)) { if (k.noCompassDay !== S().day) { k.noCompassDay = S().day; UI_toast(D.noCompass, 'compass'); } }
          else {
            k.reads[q[0]] = today();
            var n = SK.reads();
            G.State.log(fill(D.read, { sea: q[4], val: q[5], n: n, need: b.kepNeed }));
            UI_toast(fill(D.read, { sea: q[4], val: q[5], n: n, need: b.kepNeed }), 'compass');
            if (n === b.kepNeed) UI_toast(D.readAll, 'compass');
          }
        }
      }
      if (k.gal === 1 && (S().fleet.daysOut || 0) >= b.testDays) await galTest();
    } finally { SK._busy = false; }
  };

  // ================================================================ 하루 (js/systems/world.js): 기한 · 첫 책 · 소식
  SK.daily = function () {
    var s = S(), out = []; if (!s || !s.sky) return out;
    var k = ensure(), b = B(), D = L(), d = today();
    function fail(key, text) { k[key] = 'failed'; k.due[key] = 0; out.push({ icon: 'scroll', text: text }); G.State.log(text); }
    if (k.cop === 1 && k.due.cop && d > k.due.cop) fail('cop', D.failCop);
    if (k.cop === 2 && k.ready && d >= k.ready) { k.cop = 3; k.due.cop = addDays(b.bookDays); out.push({ icon: 'scroll', text: D.bookCome }); G.State.log(D.bookCome); }
    if (k.cop === 3 && k.due.cop && d > k.due.cop) fail('cop', D.failBook);
    if (k.kep === 1 && k.due.kep && d > k.due.kep) fail('kep', D.failKep);
    if ((k.gal === 1 || k.gal === 2) && k.due.gal && d > k.due.gal) fail('gal', D.failGal);
    if (k.ms === 1 && k.due.ms && d > k.due.ms) fail('ms', D.failMs);
    // 소식 — 해낸 날 뒤의 것만 (옛 저장에 지난 소식이 몰려 뜨지 않게)
    var copOk = (k.cop === 'done' || k.cop === 'late'), galOk = k.gal === 'done';
    D.news.forEach(function (n, i) {
      if (d < n.d || k.seen[i]) return;
      var ok = false;
      switch (n.need) {
        case 'copWell': ok = k.cop === 'done' && k.copDone < n.d; break;
        case 'copProtest': ok = copOk && k.pref === 'protest' && k.copDone < n.d; break;
        case 'kep': ok = k.kep === 'done' && k.kepDone < n.d; break;
        case 'copgal': ok = (copOk && k.copDone < n.d) || (galOk && k.galDone < n.d); break;
        case 'gal': ok = galOk && k.galDone < n.d; break;
        case 'trialNot': ok = galOk && k.galDone < n.d && k.trial !== 'seen'; break;
        case 'msNot': ok = galOk && k.galDone < n.d && k.ms !== 'done'; break;
      }
      k.seen[i] = 1;
      if (!ok) return;
      var text = n.text;
      if (n.item) { var got = give(n.item); if (got) text += ' (「' + got + '」)'; }
      out.push({ icon: 'scroll', text: text, history: true });
      G.State.log(text);
    });
    return out;
  };

  // ================================================================ 수첩
  SK.html = function () {
    var k = SK.st(); if (!k) return ''; var D = L(), N = D.note, b = B(), rows = [];
    function row(title, note, due) { rows.push('<div>' + title + '</div><div>' + note + (due ? ' <span class="muted">(기한 ' + fmt(due) + ', 남은 ' + Math.max(0, left(due)) + '일)</span>' : '') + '</div>'); }
    if (k.cop === 1) row('코페르니쿠스', N.cop1, k.due.cop);
    if (k.cop === 2) row('코페르니쿠스', fill(N.cop2, { ready: fmt(k.ready) }));
    if (k.cop === 3) row('코페르니쿠스', N.cop3, k.due.cop);
    if (k.kep === 1) row('케플러', fill(N.kep1, { seas: b.seas.map(function (q) { return (k.reads[q[0]] ? '✔ ' : '· ') + q[4]; }).join(' ') + ' (' + SK.reads() + '/' + b.kepNeed + ')' }), k.due.kep);
    if (k.gal === 1) row('갈릴레이', N.gal1, k.due.gal);
    if (k.gal === 2) row('갈릴레이', N.gal2, k.due.gal);
    if (k.ms === 1) row('갈릴레이', N.ms1, k.due.ms);
    if (!rows.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">하늘을 재는 사람들 — 나침반과 망원경</h4><div class="kv">' + rows.join('') + '</div>';
  };
})(window.G = window.G || {});
