/* 은퇴 뒤의 동생들 (G.Siblings) — 대사·조정값: js/data/siblings.js (G.SIBLINGS · G.BALANCE.siblings). 2026-10-21 사용자 요청
   ■ 세대 교체(G.Family.succeed): 뒤를 이은 아들 말고 남은 아이들은 새 제독의 집에서 함께 산다 → s.player.siblings
     (열다섯 살 아래 아이는 물론, 15~21세도 집을 떠날 나이가 될 때까지는 집에 남는다. 시집간 딸·섬에서 사라진 아이는 빼고,
      이름이 없는 갓난아기는 이름을 지어 준다). 아이 때의 그림(폴더·순번·변형)은 그대로 기억한다 (k.artFolder · k.sibOrder · k.portraitVariant).
   ■ 집(자택 메뉴 「동생들」·방 안에 선 가족)에서 이야기를 나누면 형제 사이(k.sibBond)가 가까워진다.
   ■ 스무 살(hireAge)부터 항해사로 데려갈 수 있다 — 함께 항해하는 동생은 둘(maxHire)까지. 가족이라 월급은 절반(wageK).
     항해사 정의는 s.sibs.defs 에 두고 불러올 때 G.MATES 에 다시 올린다 (G.Siblings.apply — 철새와 같은 방식). 해고되거나 배를 떠나면 집으로 돌아온다.
   ■ 스물두 살(leaveAge)이 넘은, 집에 있는 동생은 집에 들를 때 떠난다 — 아들은 제 삶을 찾아(가장 잘 자란 능력으로 선장·학자·기사·상인),
     딸은 시집을 간다(시집가는 날 — 신랑 인사 · 동생의 부탁 · 지참금 · 혼례 그림 · 앞날 카드 · 동생의 편지). 배에 함께 탄 동생은 떠나지 않는다.
   ■ 저장: s.player.siblings = [아이 객체 + k.sib{father, mother, gen, y}] · k.mateId · k.sibBond · k.left = {kind, y, title}
           s.sibs = {seq, defs: {id: 항해사 정의}} (s.player 가 바뀌어도 남는다) */
(function (G) {
  'use strict';
  var U = G.U;
  var SB = G.Siblings = {};
  function S() { return G.Game && G.Game.state; }
  function F() { return G.Family; }
  function HL() { return G.HomeLife; }
  function K() { var b = (G.BALANCE && G.BALANCE.siblings) || {}; return { stayUnder: b.stayUnder || 15, hireAge: b.hireAge || 20, maxHire: b.maxHire || 2, leaveAge: b.leaveAge || 22, wageK: b.wageK == null ? 0.5 : b.wageK, chatBond: b.chatBond || 2, dowry: b.dowry || [1500, 4000], dowryFame: b.dowryFame || 0, purse: b.purse || 800 }; }
  SB.K = K;
  function D() { return G.SIBLINGS; }
  function st() { var s = S(); return s.sibs || (s.sibs = { seq: 0, defs: {} }); }
  function age(k) { return F().kidAge(k); }
  var busy = {};
  function key(k) { return k.name + ':' + (k.born ? k.born.y + '-' + k.born.m + '-' + k.born.d : ''); }

  // ---------------------------------------------------------------- 누구
  /** 이 세대의 동생들 (떠난 동생 빼고) */
  SB.all = function () { var s = S(); return s && s.player && s.player.siblings ? s.player.siblings.filter(function (k) { return !k.left; }) : []; };
  /** 배에 함께 탄 동생인가 */
  SB.hired = function (k) { var s = S(); return !!(k && k.mateId && s.mates.some(function (m) { return m.id === k.mateId; })); };
  SB.aboard = function () { return SB.all().filter(SB.hired); };
  /** 집에 있는 동생들 (어린 순) */
  SB.home = function () { return SB.all().filter(function (k) { return !SB.hired(k); }).sort(function (a, b) { return age(a) - age(b); }); };
  /** 항해사 정의의 주인 (동생) */
  SB.ofMate = function (id) { return SB.all().filter(function (k) { return k.mateId === id; })[0] || null; };

  // ---------------------------------------------------------------- 글
  function sexOf(p) { return p && (p.g === 'f' || (p.heir && p.heir.sex === 'f')) ? 'f' : 'm'; }
  function bornN(x) { return x && x.born ? x.born.y * 10000 + (x.born.m || 1) * 100 + (x.born.d || 1) : 0; }
  /** 새 제독보다 먼저 태어난 형제인가 (막내가 뒤를 이으면 위의 아이들은 형·누나다 — 2026-10-23 사용자 요청) */
  SB.elder = function (k) { var p = S().player, a = bornN(k), b = bornN(p); return !!(a && b && a < b); };
  /** 새 제독이 그 형제를 이르는 말: 남동생·여동생 / 형·누나(제독이 남자) · 오빠·언니(제독이 여자) */
  SB.rel = function (k) {
    var f = k && k.sex === 'f';
    if (!SB.elder(k)) return f ? '여동생' : '남동생';
    return sexOf(S().player) === 'f' ? (f ? '언니' : '오빠') : (f ? '누나' : '형');
  };
  SB.relShort = function (k) { return SB.elder(k) ? SB.rel(k) : '동생'; };
  /** 형제가 새 제독을 부르는 말: 동생은 형·오빠·누나·언니, 손위 형제는 이름으로 */
  SB.call = function (k) {
    var p = S().player;
    if (SB.elder(k)) return String(p.name || '').split(' ')[0] || p.name;
    return D().call[sexOf(p)][k && k.sex === 'f' ? 'f' : 'm'];
  };
  function fill(t, k, extra) {
    var s = S(), p = s.player, sb = (k && k.sib) || {};
    var a = k && k.born ? age(k) : 0, el = !!(k && SB.elder(k));
    var o = { name: k ? k.name : '', me: p.name, call: k ? SB.call(k) : '', inlaw: el ? (sexOf(p) === 'f' ? '처제' : '처남') : D().inlaw[sexOf(p)], father: sb.father || '아버지', mother: sb.mother || '어머니',
      home: (G.CITY_DATA[p.home] || {}).name || '',
      rel: k ? SB.relShort(k) : '동생',                                   // 새 제독이 그 형제를 이르는 말 (동생·형·누나·오빠·언니)
      fcall: k ? (el ? '네 동생' : '네 ' + SB.call(k)) : '',                // 아버지가 그 형제에게 새 제독을 이르는 말
      agesay: !k || a === (K().leaveAge || 22) ? '스물두 살이' : a + '세가' };   // 「어느새 ○○ 되었다」 — 손위 형제는 이미 나이가 많다
    for (var x in extra || {}) o[x] = extra[x];
    return String(t).replace(/\{(\w+)(?::([^}]+))?\}/g, function (all, key, pair) {
      if (o[key] == null) return all;
      var w = String(o[key]); return pair ? U.j(w, pair) : w;
    });
  }
  SB.fill = fill;
  SB.speaker = function (k) { var sp = HL().speaker(k); sp.name = k.name; return sp; };
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, half: G.Img.chain.heroHalf ? G.Img.chain.heroHalf() : null, lang: 3 }; }
  /** 'k:' 동생 · 'p:' 제독 · 'g:' 신랑 · 'n:' 낭독 */
  async function lines(list, k, extra, groom) {
    list = [].concat(list || []);
    for (var i = 0; i < list.length; i++) {
      var l = list[i], who = l.slice(0, 2), t = fill(l.slice(2), k, extra);
      if (who === 'k:') await G.UI.say(t, SB.speaker(k));
      else if (who === 'p:') await G.UI.say(t, me());
      else if (who === 'g:' && groom) await G.UI.say(t, groom);
      else await G.UI.say(t, {});
    }
  }
  function card(k, title, body) {
    return G.UI.alert('<div class="center" style="font-size:15px;letter-spacing:.2em;color:#8a6a3a">— ENDING —</div>' +
      '<div class="center" style="font-size:26px;font-weight:700;margin:6px 0 12px">' + U.esc(fill(D().wed.endingCard, k, { title: title })) + '</div>' +
      '<div style="line-height:1.75">' + body + '</div>', title);
  }
  function pic(key, title) {
    if (!G.FamEv || !G.FamEv.showPic || !key) return null;
    try { return G.FamEv.showPic({ img: key, title: title }); } catch (e) { return null; }
  }
  function best(k) {
    var x = k.st || {}, b = 'cha';
    ['cha', 'int', 'mar', 'str'].forEach(function (i) { if ((x[i] || 0) > (x[b] || 0)) b = i; });
    return b;
  }
  SB.best = best;

  // ---------------------------------------------------------------- 세대 교체
  /** G.Family.succeed 에서 — 옛 제독(p)의 남은 아이들을 새 제독의 동생으로. 돌려주는 것: 새 s.player.siblings */
  SB.fromRetire = async function (p, heir) {
    var s = S(), out = [], Fm = F(), H = HL();
    // 아버지 대의 동생들(새 제독의 숙부·고모)은 집에 남아 있으면 이제 떠난다 — 배에 탄 사람은 항해사로 남는다
    var elders = (p.siblings || []).filter(function (k) { return !k.left && !SB.hired(k); });
    if (elders.length) G.State.log(fill(D().elders, null, { names: elders.map(function (k) { return k.name; }).join('·') }));
    var kids = (p.kids || []).slice(), used = {};
    kids.forEach(function (k) { if (k.name) used[Fm.given ? Fm.given(k) : k.name] = 1; });
    // 피터 팬의 섬에서 사라진 채 대가 바뀌면 그 아이는 돌아오지 못한다 — 새 대의 같은 번호 아이를 「되찾지」 않게 이야기를 닫는다 (QA 2026-10-23)
    if (G.Peter && G.Peter.closeLost && s.peter && s.peter.phase === 'lost') { try { G.Peter.closeLost(G.Peter.lostKid ? G.Peter.lostKid() : null); } catch (e) { console.error(e); } }
    var mother = Fm.wifeName ? Fm.wifeName() : '';
    // 같은 성별 형제와 얼굴(그림 변형 1~5)이 겹치지 않게 — 뒤를 이은 제독의 얼굴이 먼저
    var usedV = { m: {}, f: {} }; if (H && H.variant) usedV[heir.sex === 'f' ? 'f' : 'm'][H.variant(heir)] = 1;
    kids.forEach(function (k) {
      if (k === heir || k.lost || k.married) return;
      if (k.unnamed || !k.name) {   // 이름이 없는 갓난아기 — 남은 이름 가운데 하나
        var pool = Fm.names(k.sex).filter(function (n) { return !used[n]; });
        var nm = pool.length ? pool[0] : Fm.names(k.sex)[0];
        if (Fm.setKidName) Fm.setKidName(k, nm); else { k.name = nm; k.unnamed = false; }   // 성은 아버지를 따른다 (family.js)
        used[nm] = 1;
      }
      // 아이 때의 그림을 그대로 (옛 제독이 사라지면 어머니·순번을 다시 셀 수 없으니)
      if (H) {
        k.artFolder = H.folder(k) || '';
        k.sibOrder = Math.max(1, kids.filter(function (x) { return (x.sex === 'f') === (k.sex === 'f'); }).indexOf(k) + 1);
        if (H.variant) {
          var sx = k.sex === 'f' ? 'f' : 'm', v = H.variant(k);
          for (var t = 0; t < 5 && usedV[sx][v]; t++) v = v % 5 + 1;
          if (!usedV[sx][v]) k.portraitVariant = v;
          usedV[sx][k.portraitVariant] = 1;
        }
      }
      if (!k.mother && p.wife) k.mother = p.wife;
      // 어머니는 그 아이를 낳은 부인 (둘째 부인의 아이에게도 늘 본처 이름이 적히던 것 — QA 2026-10-23)
      var mom = k.mother && k.mother !== p.wife && G.Wives && G.Wives.name ? G.Wives.name(k.mother) : mother;
      k.sib = { father: p.name, mother: mom || mother, gen: (p.generation || 1) + 1, y: s.date.y };
      k.aboard = false; k.house = null; delete k.wedNext;
      if (k.sibBond == null) k.sibBond = U.clamp(45 + Math.round((Fm.bond(k) - 50) / 3), 20, 80);
      out.push(k);
    });
    if (out.length) {
      var heirName = heir.name;
      G.State.log(out.map(function (k) { return k.name; }).join('·') + ' — ' + heirName + '의 형제자매는 ' + heirName + '의 집에서 함께 살게 되었다.');
      var pc = pic('family-events/36_adult_siblings_homecoming', '형제자매의 새 출발');
      try {
        await G.UI.alert(U.esc(fill(D().moveIn, null, { me: heirName, father: p.name })) +
          '<br><br>서로의 손을 맞잡은 형제자매는, 이 집을 다시 함께 지켜 가기로 했다.' +
          '<div style="margin:10px 0 4px">' + out.map(function (k) { return '<b>' + U.esc(k.name) + '</b> <span class="muted">(' + SB.rel(k) + ' · ' + age(k) + '세)</span>'; }).join('<br>') + '</div>' +
          '<span class="muted" style="font-size:16px">' + U.esc(D().moveInNote) + '</span>', '형제자매의 새 출발');
      } finally {
        if (pc) await pc.stop();
      }
    }
    return out;
  };

  // ---------------------------------------------------------------- 항해사 정의 (철새처럼 G.MATES 에 올린다)
  function register(d) {
    if (!G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; }
    G.MATE_RANGE[d.id] = { zones: [], home: d.home };
  }
  /** 새 게임·불러오기 (js/core/state.js · js/scenes/common.js) — 지난 게임의 동생 항해사를 치우고 이 게임의 것을 올린다 */
  SB.apply = function () {
    var s = S(); if (!s) return;
    for (var i = G.MATES.length - 1; i >= 0; i--) if (G.MATES[i].sib) { delete G.MATE[G.MATES[i].id]; delete G.MATE_RANGE[G.MATES[i].id]; G.MATES.splice(i, 1); }
    if (!s.sibs) return;
    for (var id in s.sibs.defs) {
      register(s.sibs.defs[id]);
      if (!s.mates.some(function (m) { return m.id === id; })) s.flags['gone_' + id] = 1;   // 집에 있는 동생은 술집·항구에 나타나지 않는다
    }
  };
  function artKey(k, half) {
    var H = HL(), I = G.Img;
    var ch = I.chain.kid(k.sex, k.sibOrder || 1, H.stage(k) || 20, H.folder(k), half, H.variant(k));
    return I.pick(ch);
  }
  SB.makeDef = function (k) {
    var s = S(), p = s.player, c = K(), T = st();
    var x = k.st || {}, stv = [x.str || 55, x['int'] || 55, x.mar || 55, x.cha || 55].map(function (v) { return U.clamp(Math.round(v), 30, 92); });
    var sk = {}, skSum = 0; Object.keys(k.sk || {}).forEach(function (id) { if (k.sk[id] > 0) { sk[id] = k.sk[id]; skSum += k.sk[id]; } });
    var lg = {}; Object.keys(k.lg || {}).forEach(function (i) { if (k.lg[i] > 0) lg[i] = k.lg[i]; });
    var nl = G.R.nativeLang ? G.R.nativeLang(p.nation) : 0; lg[nl] = 3;
    var stSum = stv[0] + stv[1] + stv[2] + stv[3];
    var wage = Math.max(15, Math.round((28 + skSum * 12 + (stSum - 200) / 3) * c.wageK / 5) * 5);
    var b = best(k), role = k.sex === 'f' ? 'maid' : b === 'int' ? 'scholar' : b === 'mar' ? 'soldier' : b === 'cha' ? 'merchant' : 'sailor';
    var hc = G.CITY_DATA[p.home] || {};
    T.seq = (T.seq || 0) + 1;
    var id = k.mateId || ('sib_' + s.date.y + '_' + T.seq);
    var face = artKey(k, false), half = artKey(k, true);
    var d = { id: id, name: k.name, g: k.sex === 'f' ? 'f' : 'm', sib: true, st: stv, sk: sk, lg: lg, fame: 0, wage: wage, y: [k.born.y, 9999], reg: [],
      desc: fill(D().hire.desc, k), story: fill(D().hire.story, k), style: hc.style || 'ib', role: role, face: face, halfKey: half, home: p.home, bornY: k.born.y };
    if (G.MateSkills && G.MateSkills.wander) { try { G.MateSkills.wander(d); } catch (e) { /* 특기는 아이 때 익힌 만큼 */ } }
    T.defs[id] = d;
    return d;
  };

  // ---------------------------------------------------------------- 집
  /** 형제 이야기 — 자택 「동생들」 · 방 안의 동생을 눌렀을 때 */
  SB.talk = async function (k, c) {
    var UI = G.UI, s = S(), c0 = K(), a = age(k), sx = k.sex === 'f' ? 'f' : 'm';
    var band = SB.elder(k) && D().chat.elder ? 'elder' : a >= c0.hireAge ? 'adult' : a >= 10 ? 'teen' : 'child';
    var today = U.dateNum(s.date);
    for (var turn = 0; ; turn++) {
      var n = SB.aboard().length, can = a >= c0.hireAge, full = n >= c0.maxHire;
      var opts = [{ label: '이야기한다', value: 'chat' }];
      if (a >= 10) opts.push({ label: '항해사로 데려간다', value: 'hire', dis: !can || full });
      opts.push({ label: '그만둔다', value: null });
      var head = turn ? '또 할 이야기 있어, ' + SB.call(k) + '?' : fill(U.pick(D().chat[band][sx]), k);
      var v = await UI.ask(head + (a >= 10 && !can ? ' — ' + D().near20 : ''), opts, SB.speaker(k));
      if (!v) return;
      if (v === 'chat') {
        await UI.say(fill(U.pick(D().chat[band][sx]), k), SB.speaker(k));
        if (k.sibChat !== today) { k.sibChat = today; k.sibBond = Math.min(100, (k.sibBond == null ? 50 : k.sibBond) + c0.chatBond); if (HL().addTouch) HL().addTouch(k); }
      } else if (v === 'hire') {
        if (!can) { await UI.alert(fill(D().hire.young, k)); continue; }
        if (full) { await UI.alert(fill(D().hire.full, k)); continue; }
        if (await SB.hire(k, c)) return;
      }
    }
  };
  /** 항해사로 데려간다 — 데려갔으면 true */
  SB.hire = async function (k, c) {
    var UI = G.UI, s = S(), c0 = K();
    if (age(k) < c0.hireAge || SB.aboard().length >= c0.maxHire || SB.hired(k)) return false;
    var d = (k.mateId && st().defs[k.mateId]) || SB.makeDef(k);
    k.mateId = d.id; register(d);
    await UI.say(fill(D().hire.ask, k), SB.speaker(k));
    if (!(await UI.confirm(U.esc(k.name) + U.jx(k.name, '을/를') + ' 항해사로 데려가겠습니까?<br><span class="muted">월급 금화 ' + U.num(d.wage) + '닢 (가족이라 절반) · 함께 항해하는 형제 ' + SB.aboard().length + '/' + c0.maxHire + '</span>', '데려간다', '다음에'))) return false;
    if (!G.Legend || !G.Legend.join(d.id, c)) return false;
    k.wasAboard = true;
    await lines(D().hire.yes.map(function (t) { return 'k:' + t; }), k);
    if (G.Game.cityHud) G.Game.cityHud();
    return true;
  };
  /** 자택 메뉴 이름: 모두 동생이면 「동생들」, 손위 형제가 있으면 「형제자매」 */
  SB.menuLabel = function () { return SB.home().some(SB.elder) ? '형제자매' : '동생들'; };
  /** 자택 메뉴 「동생들」 */
  SB.menu = async function (c) {
    for (;;) {
      var home = SB.home(); if (!home.length) return;
      var k = home.length === 1 ? home[0] : await G.UI.choose(SB.menuLabel(), home.map(function (x) {
        return { label: x.name, right: age(x) + '세 · ' + SB.rel(x) + (age(x) >= K().hireAge ? ' · 항해사로 데려갈 수 있다' : ''), value: x };
      }), { width: 520, text: '함께 항해하는 형제 ' + SB.aboard().length + '/' + K().maxHire });
      if (!k) return;
      await SB.talk(k, c);
      if (home.length === 1) return;
    }
  };
  /** 자택 방 안에 세울 동생들 (homelife.js HL.family) */
  SB.family = function () {
    var H = HL(), LOOK = G.FAMILY_LOOK || { scale: {} };
    return SB.home().filter(function (k) { return age(k) >= 3; }).map(function (k) {
      return { who: 'kid', k: k, name: k.name, sub: age(k) + '세 · ' + SB.rel(k), chain: H.chain(k, true), portrait: F().kidSpec(k), scale: (LOOK.scale || {})[H.stage(k)] || 1,
        onClick: function () { return SB.talk(k); } };
    });
  };

  // ---------------------------------------------------------------- 집에 들어설 때 (homelife.js HL.happen)
  /** 배를 떠난 동생은 집으로 · 스물두 살이 넘은 동생 하나가 떠난다 — 사건이 있었으면 true */
  SB.check = async function () {
    var s = S(); if (!s || !s.player || !s.player.siblings) return false;
    var c0 = K();
    SB.all().forEach(function (k) {   // 해고되거나 배를 떠난 동생 — 집에 돌아와 있다
      if (k.mateId && !SB.hired(k) && k.wasAboard) { k.wasAboard = false; s.flags['gone_' + k.mateId] = 1; G.UI.toast(k.name + ': ' + fill(D().home, k), 'house', 4000); }
    });
    var k = SB.home().filter(function (x) { return age(x) >= c0.leaveAge; }).sort(function (a, b) { return age(b) - age(a); })[0];
    if (!k) return false;
    if (k.sex === 'f') await SB.wedding(k); else await SB.farewell(k);
    if (G.Game.cityHud) G.Game.cityHud();
    return true;
  };

  /** 아들 — 제 삶을 찾아 떠난다 */
  SB.farewell = async function (k) {
    if (!k || k.left || busy[key(k)]) return; busy[key(k)] = 1;   // 한 번만 (저장되지 않는 표시)
    var UI = G.UI, s = S(), p = s.player, c0 = K(), E = D().farewell, b = best(k), P = E[b];
    await lines(E.intro, k);
    await lines(P.say, k);
    var gift = c0.purse;
    var v = await UI.ask(fill(E.ask, k), [{ label: fill(E.give, k, { gift: U.num(gift) }), value: 'give', dis: p.gold < gift }, { label: fill(E.hug, k), value: 'hug' }], SB.speaker(k));
    if (v === 'give' && p.gold >= gift) { p.gold -= gift; await lines(E.giveSay, k); } else { v = 'hug'; await lines(E.hugSay, k); }
    await card(k, P.title, P.ending.map(function (t) { return U.esc(fill(t, k)); }).join('<br>'));
    k.left = { kind: 'life', path: b, y: s.date.y, title: P.title, purse: v === 'give' ? gift : 0 };
    G.State.log(k.name + U.jx(k.name, '이/가') + ' 집을 떠나 제 길을 갔다 — ' + P.title + '.' + (v === 'give' ? ' (노자 금화 ' + U.num(gift) + '닢)' : ''));
    UI.toast(k.name + ' — ' + P.title, 'boot', 5000);
    delete busy[key(k)];
  };

  /** 딸 — 시집가는 날 */
  SB.wedding = async function (k) {
    if (!k || k.left || busy[key(k)]) return; busy[key(k)] = 1;   // 한 번만 (저장되지 않는 표시)
    var UI = G.UI, s = S(), p = s.player, c0 = K(), W = D().wed, b = best(k), E = W[b];
    var hc = G.CITY_DATA[p.home] || G.CITY_DATA[0], lo = c0.dowry[0], hi = c0.dowry[1];
    var grow = 1 + ((hc.size || 1) - 1) * 0.25, fair = Math.round(lo * grow / 50) * 50, rich = Math.round(hi * grow / 50) * 50;
    var role = b === 'cha' ? 'noble' : b === 'int' ? 'scholar' : b === 'mar' ? 'soldier' : 'captain', A = G.Art;
    var groom = { name: E.suitor, portrait: A.withImg(A.npcSpec('sibgroom_' + k.name + k.born.y, role, G.Img.folkStyle(hc), 'm'), []), lang: 3 };
    await lines(W.intro, k);
    await UI.say(fill(E.groomSay, k), groom);
    await lines(W.sister, k);
    var v = await UI.ask(fill(W.ask, k, { suitor: E.suitor }), [
      { label: fill(W.rich, k, { gift: U.num(rich) }), value: 'rich', dis: p.gold < rich },
      { label: fill(W.fair, k, { gift: U.num(fair) }), value: 'fair', dis: p.gold < fair },
      { label: fill(W.bless, k), value: 'bless' }], SB.speaker(k));
    if (v === 'rich' && p.gold < rich) v = p.gold >= fair ? 'fair' : 'bless';
    if (v === 'fair' && p.gold < fair) v = 'bless';
    var paid = v === 'rich' ? rich : v === 'fair' ? fair : 0;
    p.gold -= paid;
    await lines(W[v + 'Say'], k);
    var pc = pic(p.g === 'f' ? 'family-events/33_daughter_wedding_sister_pov' : 'family-events/32_daughter_wedding_brother_pov', E.title);
    try { await lines(W.wedding, k); } finally { if (pc) await pc.stop(); }
    await card(k, E.title, E.ending.map(function (t) { return U.esc(fill(t, k)); }).join('<br>'));
    await UI.say(fill(W.letter.join('\n'), k), SB.speaker(k));
    var fame = v === 'rich' && G.Fame && c0.dowryFame ? G.Fame.add('so', c0.dowryFame) : 0;
    k.married = { kind: b, y: s.date.y, title: E.title, sib: true };
    k.left = { kind: 'wed', path: b, y: s.date.y, title: E.title, dowry: paid };
    G.State.log(k.name + U.jx(k.name, '이/가') + ' ' + E.suitor + U.jx(E.suitor, '과/와') + ' 혼례를 올렸다.' + (paid ? ' (지참금 금화 ' + U.num(paid) + '닢)' : ''));
    UI.toast(k.name + ' — ' + E.title + (paid ? ' · 지참금 금화 ' + U.num(paid) + '닢' : '') + (fame ? ' · 사교 명성 +' + fame : ''), 'heart', 5000);
    if (G.Audio) G.Audio.sfx('cheer');
    delete busy[key(k)];
  };

  // ---------------------------------------------------------------- 해마다 (js/systems/world.js)
  SB.newYear = function () {
    var out = [], c0 = K();
    SB.home().forEach(function (k) {
      var a = age(k);
      if (a >= 3 && k.st) ['str', 'int', 'mar', 'cha'].forEach(function (x) { if (U.chance(0.5)) k.st[x] = Math.min(90, (k.st[x] || 50) + 1); });
      if (a === c0.hireAge) out.push({ icon: 'star', text: SB.relShort(k) + ' ' + k.name + U.jx(k.name, '이/가') + ' 스무 살이 되었다. 집에 들르면 항해사로 데려갈 수 있다. (함께 항해 ' + c0.maxHire + '명까지)' });
      if (a === c0.leaveAge) out.push({ icon: 'house', text: SB.relShort(k) + ' ' + k.name + U.jx(k.name, '이/가') + ' 스물두 살이 되었다. ' + (k.sex === 'f' ? '혼담이 오간다 — 집에 들르면 시집을 간다.' : '제 길을 찾아 떠날 채비를 한다 — 집에 들르면 작별한다.') });
    });
    return out;
  };
})(window.G = window.G || {});
