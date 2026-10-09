/* 부하들 사이의 썸 (G.Romance) — 자료·대사·조정값: js/data/romance.js (G.BALANCE.romance)
   ■ 누가: 제독과 3년(minYears) 넘게 함께 항해한 남녀 부하 한 쌍. 한 번에 한 커플만 이어진다(엮인 짝이 있으면 새 짝은 생기지 않는다).
     사건은 1년(cool 365일)에 한 번만. 한 커플이 혼례를 올리면(완성) 썸은 그걸로 끝 — 다음 커플로 이어지지 않는다(state.romance.done).
   ■ (옛 규칙) 한 사람은 한 번에 한 사람하고만. 궁합(ROMANCE_LIKE 말투 궁합 + 같은 모국어 + 두 사람마다 정해진 끌림)이 chemMin 아래면 끌리지 않는다.
   ■ 끌림(heat): 날마다 궁합 × rate (방이 맞닿았으면 1, 아니면 far). 한 사람이 배에 없으면 줄어든다.
   ■ 단계: none → (간식) spark 눈길 → (달밤) some 썸 → (고백 상담·고백) lover 연인 → (혼례) wed 부부.  다툼: 연인·부부. 헤어지면 cold(서먹 — coldDays 동안 끌리지 않음).
     끌림이 그 단계의 문턱(steps)을 넘으면 사건이 터진다 — 바다에서 하루 seaChance, 입항할 때 portChance, 사건 사이는 cool일. 혼례는 항구에서만.
     사건마다 제독이 고른다(밀어 준다 · 모른 척 · 말린다 …). 제독이 호감을 쌓던 여자 부하라면 고백 상담 때 남자 쪽이 먼저 묻는다(질투).
   ■ 효과: 연인·부부가 맞닿은 방이면 날마다 충성이 조금씩 오르고, 사이좋은 짝이 있으면 규율이 조금씩 오른다. 혼례를 올리면 두 사람 충성 +15, 규율 +10, 피로 −10, 사교 명성.
     부부·연인인 여자 부하에게는 제독이 청혼할 수 없다(matetalk.js). 부부 한쪽이 배를 떠나면 남은 사람 충성 −10.
   ■ 저장: state.romance = { pairs: {'남id|여id': {m, f, heat, stage, since, cd, apart, due}}, next, done('남id|여id' — 완성된 커플) } — 옛 저장에는 없으므로 처음 쓸 때 만든다.
   ■ 그림: G.ROMANCE_PICS (images/romance-events/) — 가족 사건과 같은 액자(G.FamEv.showPic)로 대화 위에 띄운다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var RM = {};
  G.Romance = RM;
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.romance) || {}; }
  function L() { return G.ROMANCE_LINES; }
  function R() { return G.R; }
  RM.st = function () { var s = S(); if (!s) return { pairs: {} }; if (!s.romance) s.romance = { pairs: {}, next: 0 }; return s.romance; };
  function tut() { return !!(G.Tutorial && G.Tutorial.active && G.Tutorial.active()); }
  function mateRow(id) { var s = S(); return (s.mates || []).filter(function (m) { return m.id === id; })[0] || null; }
  function sexOf(id) { var d = G.MATE[id]; return d ? (d.g === 'f' ? 'f' : 'm') : null; }
  RM.key = function (m, f) { return m + '|' + f; };
  /** 제독과 minYears(3년) 넘게 함께 항해한 부하인가 — joined(yyyymmdd)가 0이면 처음부터 함께한 부하(게임 날수로 센다) */
  RM.veteran = function (id) {
    var s = S(), m = mateRow(id), y = K().minYears == null ? 3 : K().minYears; if (!s || !m) return false;
    if (!m.joined) return (s.day || 0) >= y * 365;
    return U.dateNum(s.date) >= m.joined + y * 10000;
  };
  function active(p) { return p.stage !== 'none' && p.stage !== 'cold'; }
  /** 지금 이어지고 있는 커플 (눈길·썸·연인·부부) — 한 번에 하나뿐 */
  RM.current = function () { var ps = RM.st().pairs; for (var k in ps) if (active(ps[k])) return ps[k]; return null; };
  function short(id) { var d = G.MATE[id]; return d ? String(d.name).replace(/\s*\(.*\)\s*$/, '').split(' ')[0] : '?'; }
  function toneOf(id) { return G.Banter && G.Banter.toneOf ? G.Banter.toneOf(id) : sexOf(id) === 'f' ? 'plain' : 'rush'; }

  // ================================================================ 궁합
  /** 두 사람의 궁합 0~1 (날마다 바뀌지 않는다) */
  RM.chem = function (m, f) {
    var h = (U.strHash('romance:' + m + '|' + f) % 1000) / 1000;
    var c = 0.3 + h * 0.4;
    var like = (G.ROMANCE_LIKE || {})[toneOf(m)] || [];
    if (like.indexOf(toneOf(f)) >= 0) c += 0.2;
    try { var CB = G.Cabins, a = mateRow(m), b = mateRow(f); if (CB && a && b && CB.nativeLang(a) != null && CB.nativeLang(a) === CB.nativeLang(b)) c += 0.1; } catch (e) { /* 말을 몰라도 궁합은 있다 */ }
    return Math.min(1, c);
  };
  /** 방(또는 자리 — 부관실·조타실·파수대·갑판)이 맞닿았는가 (js/systems/cabins.js) */
  function near(a, b) { try { var x = mateRow(a), y = mateRow(b); return !!(G.Cabins && x && y && G.Cabins.near(x, y)); } catch (e) { return false; } }
  RM.near = near;
  /** 지금 누구와 엮여 있나 (헤어진 짝·아무것도 아닌 짝은 빼고) */
  function partnerOf(id) {
    var ps = RM.st().pairs;
    for (var k in ps) { var p = ps[k]; if (p.stage !== 'none' && p.stage !== 'cold' && (p.m === id || p.f === id)) return p; }
    return null;
  }
  RM.pairOf = partnerOf;
  RM.stageName = function (p) { return (G.ROMANCE_STAGE || {})[p.stage] || ''; };

  // ================================================================ 하루
  var NEXT = { none: 'snack', spark: 'moon', some: 'confess' };
  function capOf(p) { var st = K().steps; return p.stage === 'none' ? st.snack + 5 : p.stage === 'spark' ? st.moon + 5 : p.stage === 'some' ? st.confess + 5 : 100; }
  RM.daily = function () {
    var s = S(), out = [], b = K(); if (!s || !s.mates || tut()) return out;
    var st = RM.st(), ps = st.pairs, day = s.day;
    var here = {}; s.mates.forEach(function (m) { if (G.MATE[m.id]) here[m.id] = m; });
    // 옛 저장: 이미 부부가 된 짝이 있으면 완성된 것으로
    if (!st.done) Object.keys(ps).forEach(function (k) { if (ps[k].stage === 'wed') st.done = k; });
    // 한 커플이 완성되었거나 이어지고 있으면 다른 짝은 없다
    var cur = st.done ? ps[st.done] : RM.current();
    if (cur) Object.keys(ps).forEach(function (k) { if (ps[k] !== cur && ps[k].stage !== 'cold') delete ps[k]; });
    // 1) 이미 엮인 짝
    Object.keys(ps).forEach(function (k) {
      var p = ps[k], both = here[p.m] && here[p.f];
      if (p.stage === 'cold') { if (day >= (p.cd || 0)) { p.stage = 'none'; p.heat = 0; } return; }
      if (!both) {
        if (!p.apart) {
          p.apart = day;
          if (p.stage === 'wed' || p.stage === 'lover') {
            var stay = here[p.m] ? p.m : here[p.f] ? p.f : null, gone = stay === p.m ? p.f : p.m;
            if (stay && p.stage === 'wed') { here[stay].loyal = Math.max(0, (here[stay].loyal || 70) - 10); out.push({ icon: 'heart', text: fill(L().widow, p, { a: short(gone), b: short(stay) }) }); }
            else if (stay) out.push({ icon: 'heart', text: fill(stay === p.m ? L().apart : L().apartF, p) });
          }
        }
        p.heat = Math.max(0, p.heat - b.fade);
        if (p.stage === 'none' && p.heat <= 0) delete ps[k];
        else if ((p.stage === 'spark' || p.stage === 'some' || p.stage === 'lover') && day - p.apart > 60) { p.stage = 'cold'; p.cd = day + b.coldDays; p.heat = 0; }
        return;
      }
      p.apart = 0;
      if (p.stage === 'none') return;          // 아직 아무것도 아닌 짝은 아래(2)에서 — 그 여자 부하가 지금 가장 끌리는 사람만
      var nr = near(p.m, p.f);
      p.heat = Math.min(capOf(p), p.heat + RM.chem(p.m, p.f) * b.rate * (nr ? 1 : b.far));
      if (p.stage === 'lover' || p.stage === 'wed') {
        if (nr) { var g = b.nearLoyal * (p.stage === 'wed' ? 1.5 : 1); [p.m, p.f].forEach(function (id) { here[id].loyal = Math.min(100, (here[id].loyal || 70) + g); }); }
        s.fleet.discipline = Math.min(100, (s.fleet.discipline || 0) + b.discipline);
        if (!st.done && !p.due && day >= (p.cd || 0) && U.chance(b.quarrel * (nr ? 1 : 2))) p.due = 'quarrel';
        if (p.stage === 'lover' && !p.due && p.heat >= b.steps.wed && day - (p.since || day) >= b.wedDays) p.due = 'wed';
      } else if (!p.due && NEXT[p.stage] && p.heat >= b.steps[NEXT[p.stage]]) p.due = NEXT[p.stage];
    });
    // 2) 아직 아무와도 엮이지 않은 여자 부하: 가장 잘 맞는 남자 부하에게 끌린다 — 완성된 커플이 있거나 이어지는 커플이 있으면 없음, 3년 넘은 부하끼리만
    if (st.done || RM.current()) return out;
    var busy = {};
    Object.keys(ps).forEach(function (k) { var p = ps[k]; if (p.stage !== 'none') { busy[p.m] = 1; busy[p.f] = 1; } });
    var males = Object.keys(here).filter(function (id) { return sexOf(id) === 'm' && !busy[id] && RM.veteran(id); });
    Object.keys(here).filter(function (id) { return sexOf(id) === 'f' && !busy[id] && s.player.wife !== id && RM.veteran(id); }).forEach(function (f) {
      var best = null, bc = b.chemMin;
      males.forEach(function (m) { if (busy[m]) return; var key = RM.key(m, f), old = ps[key]; if (old && old.stage === 'cold') return; var c = RM.chem(m, f); if (c >= bc) { bc = c; best = m; } });
      if (!best) return;
      busy[best] = 1;
      var key = RM.key(best, f), p = ps[key] || (ps[key] = { m: best, f: f, heat: 0, stage: 'none', since: 0, cd: 0 });
      // 다른 남자와 쌓던 끌림은 천천히 식는다
      Object.keys(ps).forEach(function (k2) { var q = ps[k2]; if (q !== p && q.f === f && q.stage === 'none') { q.heat = Math.max(0, q.heat - b.fade); if (q.heat <= 0) delete ps[k2]; } });
      p.heat = Math.min(capOf(p), p.heat + RM.chem(best, f) * b.rate * (near(best, f) ? 1 : b.far));
      if (!p.due && p.heat >= b.steps.snack) p.due = 'snack';
    });
    return out;
  };

  // ================================================================ 사건
  function fill(t, p, extra) {
    var s = S(), o = { he: short(p.m), she: short(p.f), ship: s.fleet.ships[0] ? s.fleet.ships[0].name : '', city: s.loc && s.loc.city != null && G.CITY_DATA[s.loc.city] ? G.CITY_DATA[s.loc.city].name : '' };
    for (var k in extra || {}) o[k] = extra[k];
    var J = { '이': '이/가', '을': '을/를', '은': '은/는', '과': '과/와', '와': '과/와', '으로': '으로/로' };
    return String(t).replace(/\{(\w+)\}\{(이|을|은|과|와|으로)\}/g, '{$1$2}').replace(/\{(\w+?)(이|을|은|과|와|으로)?\}/g, function (all, k, j) {
      if (o[k] == null) return all;
      var w = String(o[k]); return j ? w + U.jx(w, J[j]) : w;
    });
  }
  function one(a) { return Array.isArray(a) ? U.pick(a) : a; }
  function speaker(id, other) {
    var d = G.MATE[id], o = G.MATE[other];
    var me = { name: d.name, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true };   // special: 바다에서도 무릎상으로 마주 선다 (js/ui/ui.js isSpecial)
    if (!o) return me;
    me.layout = 'duo'; me.side = sexOf(id) === 'm' ? 'left' : 'right';
    me.partner = { name: o.name, portrait: G.Scenes.mateSpec(other), half: G.Img.chain.mateHalf(other), lang: 3, special: true };
    return me;
  }
  async function sayM(p, set) { await UI.say(fill(one(set[toneOf(p.m)] || set.rush), p), speaker(p.m, p.f)); }
  async function sayF(p, set) { await UI.say(fill(one(set[toneOf(p.f)] || set.plain), p), speaker(p.f, p.m)); }
  async function narr(p, t) { await UI.say(fill(one(t), p), {}); }
  async function choose(p, list, extra) {
    return UI.ask('어떻게 할까?', list.map(function (c) { return { label: fill(c[0], p, extra), value: c[1] }; }), {});
  }
  function loyal(id, n) { var m = mateRow(id); if (m) m.loyal = U.clamp((m.loyal || 70) + n, 0, 100); }
  function disc(n) { var f = S().fleet; f.discipline = U.clamp((f.discipline || 0) + n, 0, 100); }
  function log(t) { G.State.log(t); }
  function names(p) { return G.MATE[p.m].name + U.jx(G.MATE[p.m].name, '과/와') + ' ' + G.MATE[p.f].name; }

  var EV = {};
  EV.snack = async function (p) {
    var Ln = L().snack;
    await narr(p, Ln.n); await sayM(p, Ln.m); await sayF(p, Ln.f);
    var v = await choose(p, Ln.ch);
    if (v === 'scold') { p.heat = Math.max(0, p.heat - 15); disc(3); loyal(p.m, -2); loyal(p.f, -2); }
    else { p.heat += v === 'cheer' ? 15 : 8; p.stage = 'spark'; if (v === 'cheer') { loyal(p.m, 3); loyal(p.f, 3); } }
    await narr(p, Ln.res[v] || Ln.res.pass);
  };
  EV.moon = async function (p) {
    var Ln = L().moon;
    await narr(p, Ln.n); await sayF(p, Ln.f); await sayM(p, Ln.m);
    var v = await choose(p, Ln.ch);
    if (v === 'scold') { p.heat = Math.max(0, p.heat - 12); disc(2); }
    else { p.heat += v === 'cheer' ? 15 : 6; p.stage = 'some'; if (v === 'cheer') disc(-1); }
    await narr(p, Ln.res[v] || Ln.res.pass);
  };
  EV.confess = async function (p) {
    var Ln = L().advice, b = K(), fr = mateRow(p.f);
    await narr(p, Ln.n); await sayM(p, Ln.m);
    // 제독이 호감을 쌓던 여자 부하라면 먼저 묻는다
    if (fr && (fr.aff || 0) >= 40) {
      await UI.say(fill(Ln.jealous.m, p), speaker(p.m, null));
      var j = await choose(p, Ln.jealous.ch);
      if (j === 'mine') {
        p.heat = Math.max(0, p.heat - 40); p.stage = 'cold'; p.cd = S().day + b.coldDays; loyal(p.m, -10); fr.aff = Math.min(100, (fr.aff || 0) + 5);
        await narr(p, Ln.res.mine); log(G.MATE[p.m].name + U.jx(G.MATE[p.m].name, '이/가') + ' ' + G.MATE[p.f].name + '에 대한 마음을 접었다 (제독 때문에).'); return;
      }
      fr.aff = Math.floor((fr.aff || 0) / 2);
    }
    var v = await choose(p, Ln.ch, { gift: U.num(b.giftCost) });
    if (v === 'scold') { p.heat = Math.max(0, p.heat - 10); loyal(p.m, -3); await narr(p, Ln.res.scold); return; }
    if (v === 'gift') {
      var s = S();
      if (s.player.gold < b.giftCost) { UI.toast('금화가 모자랍니다.', 'coin'); }
      else { s.player.gold -= b.giftCost; loyal(p.f, 5); G.Game.refreshHud(); }
    }
    var C2 = L().confess;
    await narr(p, C2.n); await sayM(p, C2.m); await sayF(p, C2.f);
    p.stage = 'lover'; p.since = S().day; p.heat = Math.max(p.heat, b.steps.confess + 10); loyal(p.m, 5); loyal(p.f, 5);
    await narr(p, C2.res);
    log(names(p) + U.jx(G.MATE[p.f].name, '이/가') + ' 연인이 되었다.');
    UI.toast(short(p.m) + ' ♥ ' + short(p.f) + ' — 연인이 되었다', 'heart', 5000);
  };
  EV.quarrel = async function (p) {
    var Ln = L().quarrel;
    await narr(p, Ln.n); await sayF(p, Ln.f); await sayM(p, Ln.m);
    var v = await choose(p, Ln.ch);
    if (v === 'talk') {
      var pr = U.clamp(0.45 + R().skill('speech') * 0.12 + ((R().stat('cha') || 50) - 50) * 0.006, 0.2, 0.92);
      if (U.chance(pr)) { p.heat = Math.min(100, p.heat + 5); loyal(p.m, 2); loyal(p.f, 2); await narr(p, Ln.res.talkOk); }
      else { p.heat -= 15; await narr(p, Ln.res.talkNo); }
    } else if (v === 'rest') { p.heat = Math.min(100, p.heat + 10); disc(-2); await narr(p, Ln.res.rest); }
    else { p.heat -= 20; await narr(p, Ln.res.leave); }
    // 부부는 헤어지지 않는다(끌림이 바닥에 닿지 않는다). 연인은 끌림이 30 아래로 떨어지면 헤어진다
    if (p.stage === 'wed') p.heat = Math.max(40, p.heat);
    else if (p.heat < 30) {
      await narr(p, Ln.broke);
      p.stage = 'cold'; p.cd = S().day + K().coldDays; p.heat = 0; loyal(p.m, -5); loyal(p.f, -5);
      log(names(p) + U.jx(G.MATE[p.f].name, '이/가') + ' 헤어졌다.');
      UI.toast(short(p.m) + ' · ' + short(p.f) + ' — 헤어졌다', 'heart', 5000);
    }
  };
  EV.wed = async function (p) {
    var Ln = L().wed, s = S(), b = K(), cost = b.wedCost[0] + b.wedCost[1] * s.fleet.ships.length;
    await narr(p, Ln.n); await sayM(p, Ln.m); await sayF(p, Ln.f);
    var v = await choose(p, Ln.ch, { cost: U.num(cost) });
    if (v === 'yes' && s.player.gold < cost) { UI.toast('금화가 모자랍니다. (' + U.num(cost) + '닢)', 'coin'); v = 'later'; }
    if (v !== 'yes') { p.cd = s.day + 60; await narr(p, Ln.later); return; }
    s.player.gold -= cost;
    for (var i = 0; i < Ln.feast.length; i++) await narr(p, Ln.feast[i]);
    p.stage = 'wed'; p.wed = U.dateNum(s.date); p.heat = 100;
    var stR = RM.st(); stR.done = RM.key(p.m, p.f);      // 한 커플 완성 — 썸 사건은 여기서 끝 (다음 커플로 이어지지 않는다)
    Object.keys(stR.pairs).forEach(function (k) { if (k !== stR.done) delete stR.pairs[k]; });
    loyal(p.m, 15); loyal(p.f, 15); disc(10); s.fleet.fatigue = Math.max(0, (s.fleet.fatigue || 0) - 10);
    G.Fame.add('so', 20);
    log(names(p) + U.jx(G.MATE[p.f].name, '이/가') + ' 혼례를 올렸다. (금화 ' + U.num(cost) + '닢)');
    if (G.Audio) G.Audio.sfx('discover');
    await UI.alert('<div class="center" style="font-size:24px;font-weight:700">' + U.esc(G.MATE[p.m].name) + ' ♥ ' + U.esc(G.MATE[p.f].name) + '</div><br>두 사람이 부부가 되었다. 함께 배에 남아 항해를 계속한다.<br>두 사람 충성 +15 · 규율 +10 · 피로 −10 · 사교 명성 +20', '혼례');
    G.Game.refreshHud();
  };
  RM.EV = EV;

  /** 지금 터질 사건 (없으면 null) */
  RM.due = function (where) {
    var s = S(), st = RM.st(); if (!s || tut() || st.done || s.day < (st.next || 0)) return null;
    var list = Object.keys(st.pairs).map(function (k) { return st.pairs[k]; }).filter(function (p) {
      if (!p.due || p.apart || !mateRow(p.m) || !mateRow(p.f) || s.day < (p.cd || 0)) return false;
      if (!RM.veteran(p.m) || !RM.veteran(p.f)) return false;
      return p.due !== 'wed' || where === 'city';
    });
    list.sort(function (a, b) { return b.heat - a.heat; });
    return list[0] || null;
  };
  /** 사건을 치른다 */
  RM.play = async function (p) {
    var ev = p.due; p.due = null;
    var st = RM.st(); st.next = S().day + K().cool;      // 1년에 한 번
    var pc = (G.ROMANCE_PICS || {})[ev], pic = null;
    if (pc && G.FamEv && G.FamEv.showPic) {
      try { if (G.Img && G.Img.preload) await G.Img.preload([[pc[0]]], 1200); } catch (e) { /* 그림이 늦으면 글부터 */ }
      pic = G.FamEv.showPic({ img: pc[0], title: pc[1] });
    }
    try { if (EV[ev]) await EV[ev](p); }
    finally { if (pic) await pic.stop(); }
    G.Game.refreshHud();
  };
  /** sea.js runDay */
  RM.seaDay = async function () { var p = RM.due('sea'); if (p && U.chance(K().seaChance)) await RM.play(p); };
  /** city.js 입항 */
  RM.arrival = async function () { var p = RM.due('city'); if (p && U.chance(K().portChance)) await RM.play(p); };

  // ================================================================ 다른 기능과 얽힌 곳
  /** 제독이 이 여자 부하에게 청혼할 수 없는 까닭 (없으면 '') — matetalk.js */
  RM.blocksWed = function (id) {
    var p = partnerOf(id); if (!p || p.f !== id) return '';
    return fill(p.stage === 'wed' ? L().taken : p.stage === 'lover' ? L().takenLover : '', p);
  };
  /** 부하 이름 옆에 붙는 짧은 꼬리표 ('♥ 후안과 연인') */
  RM.tag = function (id) {
    var p = partnerOf(id); if (!p || p.stage === 'spark') return '';
    var other = p.m === id ? p.f : p.m;
    return '♥ ' + short(other) + U.jx(short(other), '과/와') + ' ' + RM.stageName(p);
  };
  /** 수첩 「동료」: 부하들 사이 */
  RM.html = function () {
    var st = RM.st(), rows = Object.keys(st.pairs).map(function (k) { return st.pairs[k]; }).filter(function (p) { return p.stage !== 'none' && G.MATE[p.m] && G.MATE[p.f]; });
    if (!rows.length) return '<div class="sep"></div><h4 style="margin:0 0 6px">부하들 사이</h4><div class="muted" style="font-size:15px">아직 눈에 띄는 사이는 없다. 3년 넘게 함께 항해한 남녀 부하를 맞닿은 방에 두면 서로 가까워지기도 한다(수첩 「함대」 → 기함 선실). 이런 일은 1년에 한 번쯤, 한 커플만.</div>';
    rows.sort(function (a, b) { return b.heat - a.heat; });
    return '<div class="sep"></div><h4 style="margin:0 0 6px">부하들 사이</h4><table class="tbl"><tr><th>두 사람</th><th>사이</th><th>끌림</th><th></th></tr>' + rows.map(function (p) {
      var n = Math.round(Math.max(0, p.heat) / 20);
      return '<tr><td>' + U.esc(G.MATE[p.m].name) + ' · ' + U.esc(G.MATE[p.f].name) + '</td><td><b>' + RM.stageName(p) + '</b>' + (p.wed ? ' <span class="muted">(' + U.fmtDate({ y: Math.floor(p.wed / 10000), m: Math.floor(p.wed / 100) % 100, d: p.wed % 100 }) + ' 혼례)</span>' : '') + '</td><td>' + '♥♥♥♥♥'.slice(0, n) + '<span class="muted">' + '♡♡♡♡♡'.slice(0, 5 - n) + '</span></td><td class="muted">' + (p.apart ? '한 사람이 배에 없다' : p.stage === 'cold' ? '' : near(p.m, p.f) ? '방이 맞닿음' : '방이 떨어짐') + '</td></tr>';
    }).join('') + '</table>';
  };
})(window.G = window.G || {});
