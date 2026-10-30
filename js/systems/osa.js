/* 소꿉친구 (G.Osa — 2026-10-30)
   뒤를 이은 새 제독(2대부터)이 모항에 배로 돌아오면, 가끔 어릴 적 소꿉친구와 다시 만난다. 성격마다 이야기가 다르다.
   · 성격(G.OSA.pers): bold 직진 · cheer 명랑 · tsun 츤데레 · shy 수줍음 · calm 다정 — 재회(회상)·마주침·양아치·시장 도움·고백·혼례/합류·작별
   · 특기(G.OSA.skill): 친구의 특기마다 모항의 그 건물에 들어가면 펼쳐지는 장면 하나 (요리→항구 도시락, 의학→여관 간호 …) — 효과가 붙는다
   · 이어지는 고리: 열 살 무렵 함께 그린 「바닷가 집」 그림 (건축학개론처럼 회상이 겹친다)
   · 수줍음: 후계자가 마음을 말하려 하면 용기 판정 — 용기(courage)·매력·친구의 성격·지난 실패만큼 쉬워진다. 실패하면 말을 삼키고 다음 기회로
   · 아들이 뒤를 이었으면 친구는 여자 — 고백 뒤 모항에 돌아오면 혼례를 올려 아내가 된다(p.wife = 친구 ID, 집에서 기다린다)
     딸이 뒤를 이었으면 친구는 남자 — 고백 뒤 함대에 올라 평생 곁에 있기로 한다(G.Legend.join)
   · 후계자가 다른 사람과 혼인하면 다음 귀항 때 웃으며 작별한다
   상태: s.osa = {gen, id, pers, skill, stage(0 없음 · 1 재회 · 2 양아치를 넘김 · 3 고백함 · 4 끝), aff, courage, fails, seen{}, done, mkStay, last}
         s.osaDefs[id] = 친구의 항해사 정의 (불러올 때 G.MATES에 다시 올린다 — 아내·합류한 동료로 쓰이므로)
   조정값: G.BALANCE.osa */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var O = G.Osa = {};
  function S() { return G.Game && G.Game.state; }
  function R() { return G.R; }
  function D() { return G.OSA || {}; }
  O.cfg = function () {
    var b = (G.BALANCE && G.BALANCE.osa) || {};
    function v(k, d) { return b[k] == null ? d : b[k]; }
    return { meet: v('meet', 0.35), beat: v('beat', 0.55), chance: v('chance', 0.4), enter: v('enter', 0.6), market: v('market', 0.75), confessAff: v('confessAff', 60), minAge: v('minAge', 15), maxAge: v('maxAge', 45) };
  };
  var PERS = ['bold', 'cheer', 'tsun', 'shy', 'calm'];
  var SKILLS = ['cook', 'nav', 'med', 'music', 'art', 'acct', 'craft', 'theo', 'sword', 'speech'];
  var TYPE = { cook: 'cook', nav: 'nav', med: 'doctor', music: 'bard', art: 'scholar', acct: 'trade', craft: 'wright', theo: 'priest', sword: 'war', speech: 'tongue' };
  var BRAVE = { bold: 0.12, cheer: 0.06, tsun: -0.04, shy: -0.1, calm: 0.02 };   // 친구의 성격이 후계자의 용기를 거드는 정도

  // ---------------------------------------------------------------- 상태
  function st() { var s = S(); return s.osa || (s.osa = { gen: 0, stage: 0 }); }
  O.state = st;
  function P() { return S().player; }
  function gen() { return P().generation || 1; }
  O.heirFemale = function () { var p = P(); return p.g === 'f' || !!(p.heir && p.heir.sex === 'f'); };
  function age() { var p = P(), s = S(); return p.born ? s.date.y - p.born.y : 25; }
  function def() { var o = st(); return o.id ? G.MATE[o.id] || (S().osaDefs || {})[o.id] : null; }
  O.def = def;
  function pers() { return (D().pers || {})[st().pers] || null; }
  function skill() { return (D().skill || {})[st().skill] || null; }
  function home() { return G.CITY_DATA[P().home]; }

  /** 이번 대의 친구 기록이 아니면 새로 (대가 바뀌면 그 대의 소꿉친구가 따로 있다) */
  function sync() {
    var o = st(); if (o.gen === gen()) return o;
    var s = S(); s.osa = { gen: gen(), stage: 0, aff: 0, courage: 0, fails: 0, seen: {} };
    return s.osa;
  }
  /** 이야기가 열릴 수 있는가: 2대부터, 알맞은 나이, (아들 제독이면) 아직 혼인하지 않음 */
  O.open = function () {
    var p = P(); if (!p || gen() < 2) return false;
    var a = age(), K = O.cfg(); if (a < K.minAge || a > K.maxAge) return false;
    var o = sync(); if (o.stage >= 4) return false;
    // 세대 교체 때 이미 소꿉친구가 함대에 올라왔다면(js/systems/oldguard.js 'friend' — 그쪽의 이야기가 있다) 모항의 소꿉친구 이야기는 열지 않는다
    if (o.stage === 0 && (S().mates || []).some(function (m) { var d = G.MATE[m.id]; return d && d.kin === 'friend'; })) return false;
    return true;
  };

  // ---------------------------------------------------------------- 친구 짓기 · 불러오기
  function register(d) {
    if (!G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; }
    if (G.MATE_RANGE) G.MATE_RANGE[d.id] = { zones: [], home: d.home };
  }
  /** 새 게임·불러오기 (G.Wander.apply 끝에서): 지난 게임의 친구를 치우고 이 게임의 친구들을 올린다 */
  O.apply = function () {
    for (var i = G.MATES.length - 1; i >= 0; i--) if (G.MATES[i].osa) { delete G.MATE[G.MATES[i].id]; if (G.MATE_RANGE) delete G.MATE_RANGE[G.MATES[i].id]; G.MATES.splice(i, 1); }
    var s = S(); if (!s || !s.osaDefs) return;
    for (var id in s.osaDefs) register(s.osaDefs[id]);
  };
  function natKey(p) {
    var N = G.WANDER_NATIONS || {};
    if (N[p.nation]) return p.nation;
    var nl = R().nativeLang ? R().nativeLang(p.nation) : 0;
    return Object.keys(N).filter(function (k) { return N[k].lang === nl; })[0] || 'ES';
  }
  O.make = function (opt) {
    opt = opt || {};
    var s = S(), p = P(), o = sync();
    var pk = opt.pers || U.pick(PERS.filter(function (k) { return (D().pers || {})[k]; })) || 'calm';
    var sk = opt.skill || U.pick(SKILLS.filter(function (k) { return (D().skill || {})[k]; })) || 'cook';
    var g = O.heirFemale() ? 'm' : 'f';
    var d = G.Wander && G.Wander.make ? G.Wander.make({ nat: natKey(p), g: g, type: TYPE[sk] }) : null;
    if (!d) return null;
    d.id = 'osa_' + gen() + '_' + s.date.y + '_' + (s.day || 0);
    delete d.wd; d.osa = true; d.kin = 'osa'; d.kinTag = '소꿉친구'; d.line = d.id;   // kin 'osa' — 세대 교체 때 함대에 오는 소꿉친구(oldguard.js 'friend', 첫사랑 이야기)와 섞이지 않게
    d.home = p.home; d.zones = []; d.gen = undefined; d.prevName = null;
    d.born = p.born ? p.born.y : d.born;
    d.sk = d.sk || {}; d.sk[sk] = Math.max(2, d.sk[sk] || 0);
    var hc = home(), PS = (D().pers || {})[pk] || {};
    d.desc = (hc ? hc.name : '고향') + '에서 ' + (p.given || p.name) + U.jx(p.given || p.name, '과/와') + ' 함께 자란 소꿉친구. ' + (PS.desc || '');
    d.story = d.desc;
    (s.osaDefs || (s.osaDefs = {}))[d.id] = d; register(d);
    o.id = d.id; o.pers = pk; o.skill = sk; o.father = fatherName();
    return d;
  };
  function fatherName() {
    var line = S().lineage || [], g = gen() - 1;
    for (var i = line.length - 1; i >= 0; i--) if (line[i].gen === g) return line[i].name;
    return '아버지';
  }

  // ---------------------------------------------------------------- 말하기
  function T() { return G.Scenes.city.B.tavern; }
  function given(name) { return String(name || '').split(' ')[0]; }
  function fill(t, extra) {
    var o = st(), d = def(), p = P(), hc = home();
    t = String(t)
      .replace(/\{heir\}/g, p.given || given(p.name))
      .replace(/\{f\}/g, d ? given(d.name) : '')
      .replace(/\{home\}/g, hc ? hc.name : '고향')
      .replace(/\{father\}/g, o.father || '아버지')
      .replace(/\{keeper\}/g, (extra && extra.keeper) || '아저씨');
    return t;
  }
  O.fill = fill;
  function friendSp(emo) {
    var d = def(), w = T() && T().mateSpeaker ? T().mateSpeaker(d) : { name: d.name, portrait: G.Scenes.mateSpec(d.id) }, o = {}, k;
    for (k in w) o[k] = w[k];
    o.layout = 'duo'; o.side = 'right'; o.partner = T().playerSpeaker(); o.emotion = emo || 'warm'; o.lang = 3; o.li = null;
    return o;
  }
  function heirSp(asking) {
    var w = T().playerSpeaker(), o = {}, k; for (k in w) o[k] = w[k];
    o.layout = 'duo'; o.side = 'left'; o.partner = friendSp(); o.lang = 3;
    if (asking) o.choiceSide = 'left';
    return o;
  }
  /** 회상: 화면이 바랜 빛으로 바뀌고 한 줄씩 떠오른다. 누르거나 Enter·Space로 다음 줄 */
  O.memory = function (title, lines) {
    lines = (lines || []).map(function (l) { return fill(l); });
    return new Promise(function (resolve) {
      var root = document.getElementById('ui') || document.body;
      var el = document.createElement('div'); el.className = 'osa-mem';
      el.innerHTML = '<div class="osa-mem-in"><div class="osa-mem-t">' + U.esc(fill(title || '')) + '</div><div class="osa-mem-l"></div><div class="osa-mem-more">▼</div></div>';
      root.appendChild(el); document.body.classList.add('osa-sepia');
      var box = el.querySelector('.osa-mem-l'), i = 0, t0 = Date.now(), done = false;
      function next() {
        if (done || Date.now() - t0 < 260) return; t0 = Date.now();
        if (i < lines.length) { var p = document.createElement('p'); p.textContent = lines[i++]; box.appendChild(p); return; }
        done = true; if (unkey) unkey(); el.classList.add('out'); document.body.classList.remove('osa-sepia');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); resolve(); }, 650);
      }
      var unkey = UI.pushKey ? UI.pushKey(function (e) { if (G.Keys && (G.Keys.is(e, 'confirm') || G.Keys.is(e, 'confirmAlt') || G.Keys.is(e, 'cancel'))) { next(); return true; } return false; }) : null;
      el.addEventListener('click', next);
      setTimeout(function () { el.classList.add('on'); t0 = 0; next(); }, 40);
    });
  };
  /** 후계자가 마음을 말할 수 있는가 — 용기·매력·친구의 성격·지난 실패 */
  O.braveOdds = function () {
    var o = st(), cha = (R().stat ? R().stat('cha') : P().st.cha) || 50;
    return U.clamp(0.3 + (o.courage || 0) * 0.16 + (cha - 50) / 200 + (BRAVE[o.pers] || 0) + (o.fails || 0) * 0.15, 0.1, 0.95);
  };
  O.brave = function () { return O.forceBrave != null ? O.forceBrave : U.chance(O.braveOdds()); };

  /** 장면 하나 (G.OSA의 스크립트) */
  O.run = async function (list, extra) {
    var o = st();
    for (var i = 0; i < (list || []).length; i++) {
      var n = list[i];
      if (Array.isArray(n)) {
        if (n[0] === 'f') await UI.say(fill(n[1], extra), friendSp(n[2]));
        else if (n[0] === 'h') await UI.say(fill(n[1], extra), heirSp());
        else if (n[0] === 'n') await UI.say(fill(n[1], extra), {});
        else if (n[0] === 'mem') await O.memory(n[1], n[2]);
      } else if (n && n.ask) {
        var opts = n.opts || [];
        var v = await UI.ask(fill(n.ask, extra), opts.map(function (x, j) { return { label: fill(x.label, extra), value: j }; }), heirSp(true));
        var pick = opts[v == null ? opts.length - 1 : v] || opts[0];
        if (!pick) continue;
        O.gain(pick.aff || 0, pick.courage || 0);
        await O.run(pick.then || [], extra);
      } else if (n && n.try) {
        var ok = O.brave();
        if (!ok) o.fails = (o.fails || 0) + 1;
        await O.run(ok ? n.ok : n.fail, extra);
      }
    }
  };
  O.gain = function (aff, courage) {
    var o = st();
    o.aff = U.clamp((o.aff || 0) + (aff || 0), 0, 100);
    o.courage = Math.min(5, (o.courage || 0) + (courage || 0));
  };
  function cool() { var o = st(), s = S(); return o.last != null && s.day - o.last < 2; }
  function mark() { st().last = S().day; }
  function atHome(c) { return c && c.id === P().home; }

  // ---------------------------------------------------------------- 모항에 배로 돌아왔을 때
  O.arrival = async function (c, arg) {
    var s = S(); if (!s || !arg || !arg.arrive || (s.loc && s.loc.via === 'land') || !atHome(c)) return false;
    if (!O.open()) return false;
    var o = st(), K = O.cfg();
    // 다른 사람과 혼인했다: 작별
    if (o.stage >= 1 && o.stage < 4 && !O.heirFemale() && P().wife && P().wife !== o.id) return O.bye();
    if (cool()) return false;
    if (o.stage === 0) {
      if (!(O.forceAll || U.chance(K.meet))) return false;
      if (!def() && !O.make()) return false;
      return O.meet();
    }
    if (o.stage === 3) return O.ending();
    if (o.stage === 1 && (O.forceAll || U.chance(K.beat))) return O.thug();
    if (o.stage === 2 && o.aff >= K.confessAff && (o.seen.skill || o.aff >= K.confessAff + 15) && (O.forceAll || U.chance(K.beat))) return O.confess();
    if (O.forceAll || U.chance(K.chance)) return O.chanceScene();
    return false;
  };
  O.meet = async function () {
    var o = st(), ps = pers(); if (!ps) return false;
    mark();
    if (ps.memory) await O.memory(ps.memory.title, ps.memory.lines);
    await O.run(ps.meet);
    o.stage = 1; o.met = S().date.y; O.gain(12, 0);
    if (G.MateKnow && G.MateKnow.know) { try { G.MateKnow.know(o.id, P().home, 'meet'); } catch (e) { /* */ } }
    G.State.log('고향 ' + home().name + '에서 소꿉친구 ' + def().name + U.jx(def().name, '과/와') + ' 다시 만났다.');
    return true;
  };
  O.chanceScene = async function () {
    var o = st(), ps = pers(); if (!ps || !ps.chance || !ps.chance.length) return false;
    mark();
    var n = (o.seen.chance || 0) % ps.chance.length;
    o.seen.chance = (o.seen.chance || 0) + 1;
    await O.run(ps.chance[n]);
    O.gain(5, 0);
    return true;
  };
  /** 마을 양아치들 — 맞서 싸운다(일기토) · 말로 쫓는다 · 모른 척한다(다음에 또) */
  O.thug = async function () {
    var o = st(), ps = pers(), s = S(), c = home(); if (!ps || !ps.thug) return false;
    mark();
    await O.run(ps.thug.pre);
    var v = await UI.ask('어떻게 할까?', [{ label: '맞서 싸운다', value: 'fight' }, { label: '말로 쫓아낸다', value: 'talk' }, { label: '…모른 척 지나간다', value: 'away' }], heirSp(true));
    if (v === 'away' || v == null) { await O.run(ps.thug.away); O.gain(0, 0); o.seen.away = (o.seen.away || 0) + 1; return true; }
    if (v === 'talk') {
      var pt = U.clamp(0.35 + (R().skill ? R().skill('speech') : 0) * 0.15 + (((R().stat ? R().stat('cha') : 50) || 50) - 50) / 150, 0.15, 0.9);
      if (O.forceTalk != null ? O.forceTalk : U.chance(pt)) { await O.run(ps.thug.talk); O.gain(12, 1); o.stage = 2; o.seen.thug = 'talk'; return true; }
      await UI.say('양아치들이 코웃음을 치며 칼을 뽑았다. 말로는 안 되겠다.', {});
    }
    var who = { name: '골목 양아치', portrait: G.Art.withImg(G.Art.npcSpec('osathug' + s.day, 'soldier', G.Img.folkStyle(c)), G.Img.chain.npc('brawler', c)), lang: 3 };
    var res = G.Games && G.Games.duel ? await G.Games.duel({ name: who.name, portrait: who.portrait, look: 'brawler', str: U.ri(45, 70), atk: U.ri(4, 10), def: U.ri(0, 4), skill: U.ri(0, 2), mar: U.ri(45, 70), int: U.ri(25, 45), cha: U.ri(25, 45) }, { place: 'city' }) : 'win';
    if (res === 'win') { await O.run(ps.thug.win); O.gain(20, 1); o.seen.thug = 'win'; G.Fame.add('so', 5); }
    else { await O.run(ps.thug.lose); O.gain(15, 0); o.seen.thug = 'lose'; }
    o.stage = 2;
    return true;
  };
  /** 고백 — 친구가 먼저(직진·명랑) 또는 후계자가 용기를 내어 */
  O.confess = async function () {
    var o = st(), ps = pers(), cf = ps && ps.confess; if (!cf) return false;
    mark();
    if (cf.first && cf.first.length && !o.seen.firstTried) {
      o.seen.firstTried = 1;
      await O.run(cf.first);
      return O.won();
    }
    await O.run(o.fails && cf.retry ? cf.retry : cf.heir);
    var v = await UI.ask('…지금 말할까?', [{ label: '좋아한다고 말한다', value: 1 }, { label: '…말을 삼킨다', value: 0 }], heirSp(true));
    var ok = v === 1 && O.brave();
    if (!ok) { o.fails = (o.fails || 0) + 1; await O.run(cf.fail); return true; }
    await O.run(cf.ok);
    return O.won();
  };
  O.won = function () {
    var o = st(); o.stage = 3; o.lovedY = S().date.y; O.gain(20, 1);
    G.State.log('소꿉친구 ' + def().name + U.jx(def().name, '과/와') + ' 서로 마음을 확인했다.');
    UI.toast('소꿉친구와 마음이 닿았다 — 다음에 ' + home().name + '에 돌아오면 ' + (O.heirFemale() ? '함께 떠나기로 했다' : '혼례를 올린다'), 'heart', 6000);
    return true;
  };
  /** 끝: 아들 제독 — 혼례 · 딸 제독 — 함대에 오른다 */
  O.ending = async function () {
    var o = st(), ps = pers(), s = S(), p = P(), d = def(); if (!ps || !d) return false;
    mark();
    if (O.heirFemale()) {
      await O.run(ps.join);
      var row = G.Legend && G.Legend.join ? G.Legend.join(d.id, home()) : null;
      if (row) { delete row.ev; row.loyal = 100; row.kin = 'osa'; }
      o.stage = 4; o.done = 'join';
      G.State.log('소꿉친구 ' + d.name + U.jx(d.name, '이/가') + ' 함대에 올랐다 — 평생 곁에 있기로 했다.');
      await UI.alert(d.name + U.jx(d.name, '이/가') + ' 함대에 올랐다! 평생 ' + p.name + '의 곁에 있기로 했다.', '함께 떠나는 바다');
      return true;
    }
    if (p.wife) return O.bye();
    await O.run(ps.wed);
    p.wife = d.id;
    s.flags['wed_' + d.id] = 1; s.flags['gone_' + d.id] = 1;
    if (G.Growth && G.Growth.once) G.Growth.once('wed', 'cha', 1, '혼인 — 한 집안의 가장이 되었다');
    o.stage = 4; o.done = 'wed';
    G.State.log('소꿉친구 ' + d.name + U.jx(d.name, '과/와') + ' 고향 ' + home().name + '의 성당에서 혼례를 올렸다.');
    if (G.Achieve && G.Achieve.afterWed) { try { await G.Achieve.afterWed(d.id); } catch (e) { console.error(e); } }
    await UI.alert(d.name + U.jx(d.name, '과/와') + ' 결혼했다! 고향 ' + home().name + '의 자택에서 기다리고 있을 것이다.', '결혼');
    G.Game.refreshHud();
    return true;
  };
  O.bye = async function () {
    var o = st(), ps = pers(); if (!ps) return false;
    mark();
    await O.run(ps.bye);
    o.stage = 4; o.done = 'gone';
    return true;
  };

  // ---------------------------------------------------------------- 모항의 건물에 들어갈 때 — 특기 장면
  O.enter = async function (c, kind) {
    if (!atHome(c) || !O.open()) return false;
    var o = st(), sk = skill();
    if (!sk || o.stage < 1 || o.stage > 3 || o.seen.skill || sk.at !== kind || !def()) return false;
    if (!(O.forceAll || U.chance(O.cfg().enter))) return false;
    await O.run(sk.scene);
    var pl = sk.pers && sk.pers[o.pers]; if (pl) await O.run([pl]);
    o.seen.skill = S().date.y; O.gain(15, 1);
    O.effect(o.skill);
    return true;
  };
  /** 특기 장면의 효과 */
  O.effect = function (k) {
    var s = S(), p = P(), f = s.fleet, msg = '';
    if (k === 'cook') { f.fatigue = Math.max(0, (f.fatigue || 0) - 15); msg = '선원들의 피로가 풀렸다 (피로 −15)'; }
    else if (k === 'nav') { s.flags.blessed = Math.max(s.flags.blessed || 0, s.day + 90); msg = '하늘을 읽는 귀띔 — 석 달 동안 폭풍을 덜 만난다'; }
    else if (k === 'med') { p.hp = 100; f.fatigue = 0; msg = '몸이 가뿐하다 (체력 회복 · 피로 0)'; }
    else if (k === 'music') { f.fatigue = Math.max(0, (f.fatigue || 0) - 20); s.mates.forEach(function (m) { m.loyal = Math.min(100, (m.loyal || 70) + 2); }); msg = '그 노래에 선원들의 마음이 풀렸다 (피로 −20 · 부하 충성 +2)'; }
    else if (k === 'art') { if (G.Fame) G.Fame.add('so', 20); msg = '그림이 사람들 입에 오르내린다 (사교 명성 +20)'; }
    else if (k === 'acct') { var g = U.clamp(Math.round((p.gold || 0) * 0.01 / 10) * 10, 150, 1500); p.gold += g; msg = '장부의 셈 실수를 바로잡았다 (금화 +' + U.num(g) + ')'; }
    else if (k === 'craft') { p.luck = Math.min(100, (p.luck || 50) + 4); msg = '손수 깎은 부적 — 운이 조금 트인다 (운 +4)'; }
    else if (k === 'theo') { s.flags.blessed = Math.max(s.flags.blessed || 0, s.day + 120); f.discipline = Math.min(100, (f.discipline || 0) + 5); msg = '함께 올린 기도 — 넉 달 동안 폭풍을 덜 만난다 (규율 +5)'; }
    else if (k === 'sword') { if (G.Growth && G.Growth.once) G.Growth.once('osa_sword_' + gen(), 'str', 1, '소꿉친구와의 대련'); else if (p.st) p.st.str = Math.min(99, p.st.str + 1); msg = '대련으로 몸이 단단해졌다 (힘 +1)'; }
    else if (k === 'speech') { if (G.Fame) G.Fame.add('so', 10); p.notoriety = Math.max(0, (p.notoriety || 0) - 3); msg = '말하는 법을 익혔다 (명성 +10 · 악명 −3)'; }
    if (msg) UI.toast(msg, 'heart', 5200);
    if (G.Game.refreshHud) G.Game.refreshHud();
    return msg;
  };

  // ---------------------------------------------------------------- 시장·교역소에서 값이 안 깎였을 때
  /** 모항에서 흥정이 막히면 친구가 나타나 거든다 — {disc} 또는 null. 한 번 머무는 동안 한 번 */
  O.haggleHelp = async function (c, kind) {
    if (!atHome(c) || !O.open()) return null;
    var o = st(), ps = pers(), sk = skill();
    if (!ps || !ps.market || o.stage < 1 || o.stage > 3 || !def()) return null;
    var stay = R().stayNo ? R().stayNo() : S().day;
    if (o.mkStay === stay) return null;
    if (!(O.forceAll || U.chance(O.cfg().market))) return null;
    o.mkStay = stay;
    var list = ps.market.slice();
    if (sk && sk.market) list.splice(Math.min(2, list.length), 0, sk.market);
    await O.run(list, { keeper: '아저씨' });
    var disc = 0.08 + (o.skill === 'acct' ? 0.08 : o.skill === 'speech' ? 0.05 : 0.02);
    o.seen.market = (o.seen.market || 0) + 1;
    O.gain(o.seen.market <= 2 ? 6 : 2, 0);
    UI.toast('소꿉친구 ' + given(def().name) + '의 흥정 — 값이 ' + Math.round(disc * 100) + '% 깎였다', 'heart', 5200);
    return { disc: disc };
  };
})(window.G = window.G || {});
