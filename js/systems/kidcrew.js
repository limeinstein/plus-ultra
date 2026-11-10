/* 어른이 된 자식과 함께 항해 · 서른 넘은 아들의 독립 (G.KidCrew) — 2026-11-10 사용자 요청
   「아들이나 딸(시집 안 간 딸)이 성년이 되면 배에 태워 부하처럼 같이 다닐 수 있게. 배에 따라가지 않은 아들은 30세가 넘어가면
     자기 살 길을 찾아 떠나게. 해당 아들도 후계가 될 수 있게.」  조정값 G.BALANCE.kidCrew

   ■ 함께 항해: 열여섯(G.BALANCE.family.adult)이 넘은 아들·시집가지 않은 딸을 자택 「가족」에서 「배에 태워 함께 다닌다」 →
     동생 항해사와 같은 항해사 정의(G.Siblings.makeDef — d.sib: 청혼·선물 호감·썸·스스로 떠남·노장에서 빠진다)로 함대에 합류한다.
     선실·역할·다른 배의 선장… 부하와 똑같이 쓰인다. 월급은 가족이라 절반. 충성은 아버지와의 사이로 정한다.
     · 견습으로 탄 아이가 열여섯이 되면 저절로 정식 항해사가 된다 (옛 저장의 「어른 견습」도 이렇게 옮긴다)
     · 선실에서 는 특기·말은 날마다 아이 기록(k.sk·k.lg)에 옮겨 적는다 — 집에 내려도, 뒤를 이어도 그대로
     · 「집에 남게 한다」·해고·배를 떠남 → 집으로 돌아간다 (다시 태울 수 있다)
   ■ 독립: 배에 타지 않은 아들이 서른 살(leaveAge 31)이 넘으면, 자택에 들를 때 제 살 길을 찾아 떠난다(가장 잘 자란 능력 — 선장·학자·기사·상인).
     「노자를 준다」·「축복한다」·「그럼 내 배에 타거라」(함께 항해로). 끝내 집에 들르지 않으면 letterAge에 편지를 남기고 떠난다.
     떠난 아들(k.away)은 집에 없지만 후계 자격은 그대로다 — 은퇴할 때 고를 수 있고, 뒤를 이으면 돌아온다. 해마다 아내가 편지를 전하고, 「배로 부른다」로 다시 태울 수 있다.
   ■ 뒤를 잇는 날(F.succeed 첫머리 KC.beforeSucceed): 배에 탄 아들은 함대에서 내려 제독이 되고(배운 것은 그대로), 떠나 있던 아들은 돌아온다.
     남은 형제 가운데 배에 탄 사람은 동생 항해사로 그대로 배에 남는다 (js/systems/siblings.js).
   ■ 저장: 아이 k.mateId(항해사 id — 정의는 s.sibs.defs) · k.crew(항해사로 탔다) · k.away = {path, title, y, letter} · k.awayLetterY */
(function (G) {
  'use strict';
  var U = G.U, KC = G.KidCrew = {};
  function S() { return G.Game && G.Game.state; }
  function F() { return G.Family; }
  function K() { var b = (G.BALANCE && G.BALANCE.kidCrew) || {}; return { leaveAge: b.leaveAge || 31, letterAge: b.letterAge || 33, purse: b.purse == null ? 3000 : b.purse }; }
  function adultAge() { return ((G.BALANCE && G.BALANCE.family) || {}).adult || 16; }
  function age(k) { return F().kidAge(k); }
  function nm(k) { return F().given(k) || k.name; }
  function register(d) { if (!G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; } if (G.MATE_RANGE) G.MATE_RANGE[d.id] = { zones: [], home: d.home }; }
  function row(k) { var s = S(); return k && k.mateId ? s.mates.filter(function (m) { return m.id === k.mateId; })[0] || null : null; }
  KC.row = row;
  KC.hired = function (k) { return !!row(k); };
  /** 배에 태울 수 있는 자식 (어른 · 시집가지 않음 · 집을 떠나지 않음) */
  KC.can = function (k) { return !!k && !k.unnamed && !k.lost && !k.married && !k.away && age(k) >= adultAge() && !KC.hired(k); };
  function kidSp(k) { return G.HomeLife && G.HomeLife.speaker ? G.HomeLife.speaker(k, true) : { name: k.name, portrait: F().kidSpec(k), lang: 3 }; }
  function wifeSp() { return S().player.wife ? F().wifeSpeaker() : null; }

  /** 함께 항해: 항해사로 함대에 합류한다 — 합류한 부하 줄(m)을 돌려준다 */
  KC.board = function (k, c, quiet) {
    var s = S(); if (!KC.can(k) || !G.Siblings || !G.Siblings.makeDef || !G.Legend) return null;
    var d = G.Siblings.makeDef(k);   // 같은 아이를 다시 태우면 같은 id — 아이 때 익힌 능력·특기·말로 다시 맞춘다
    var p = s.player, son = k.sex !== 'f';
    d.kid = true;
    // 동생 항해사는 떠돌이처럼 특기 1~3을 덤으로 받지만(MateSkills.wander), 자식은 집에서 실제로 익힌 만큼만 — 덤이 아이 기록·후계로 번지지 않게 (2세 밸런스)
    var own = {}; Object.keys(k.sk || {}).forEach(function (id) { if (k.sk[id] > 0) own[id] = k.sk[id]; }); d.sk = own;
    d.desc = p.name + '의 ' + (son ? '아들' : '딸') + '. 아버지의 배에서 바다를 배우며 언젠가 ' + (son ? '가문의 함대를 이끌 날을 꿈꾼다.' : '제 이름으로 바다를 건널 날을 꿈꾼다.');
    d.story = '자택에서 자라 어른이 된 뒤 아버지의 함대에 올랐다. 가족이라 월급은 절반만 받는다.';
    k.mateId = d.id; register(d);
    var m = G.Legend.join(d.id, c); if (!m) return null;
    m.loyal = U.clamp(55 + Math.round(F().bond(k) * 0.45), 50, 100);
    k.aboard = true; k.crew = true; k.house = null; delete k.away;
    if (!quiet) G.State.log(nm(k) + U.jx(nm(k), '이/가') + ' 아버지의 함대에 항해사로 올랐다.');
    if (G.Game.cityHud) G.Game.cityHud();
    return m;
  };
  /** 배에서 익힌 특기·말을 아이 기록에 옮겨 적는다 */
  KC.syncKid = function (k) {
    var m = row(k); if (!m) return;
    var CB = G.Cabins; k.sk = k.sk || {}; k.lg = k.lg || {};
    G.SKILLS.forEach(function (x) { var lv = CB && CB.rawSkill ? CB.rawSkill(m, x.id) : 0; if (lv > (k.sk[x.id] || 0)) k.sk[x.id] = lv; });
    if (CB && CB.mateLang) G.LANGS.forEach(function (n, li) { var lv = CB.mateLang(m, li); if (lv > (k.lg[li] || 0)) k.lg[li] = lv; });
  };
  /** 집에 내려 둔다 */
  KC.home = function (k) {
    var s = S(); if (!k) return;
    KC.syncKid(k);
    if (k.mateId) {
      s.mates = s.mates.filter(function (m) { return m.id !== k.mateId; });
      s.flags['gone_' + k.mateId] = 1;
    }
    if (G.R.tidyCaptains) G.R.tidyCaptains(); if (G.Cabins && G.Cabins.tidy) G.Cabins.tidy(); if (G.CrewAuto) G.CrewAuto.refresh();
    k.aboard = false; k.crew = false;
    if (G.Game.cityHud) G.Game.cityHud();
  };

  /** 날마다 (W.daily): 배운 것을 옮겨 적고 · 배를 떠난 자식은 집으로 · 열여섯이 된 견습은 정식 항해사로 */
  KC.daily = function () {
    var s = S(), out = []; if (!s || !s.player || !s.player.kids || s.regency) return out;
    s.player.kids.forEach(function (k) {
      if (k.unnamed || k.lost) return;
      if (k.crew) {
        if (KC.hired(k)) { k.aboard = true; KC.syncKid(k); return; }
        k.crew = false; k.aboard = false; if (k.mateId) s.flags['gone_' + k.mateId] = 1;   // 해고되거나 배를 떠났다 — 집으로
        out.push({ icon: 'house', text: nm(k) + U.jx(nm(k), '이/가') + ' 함대에서 내려 집으로 돌아갔다. 자택 「가족」에서 다시 배에 태울 수 있다.' });
        return;
      }
      if (k.aboard && !k.married && age(k) >= adultAge() && KC.can(k)) {   // 견습이 어른이 되었다
        var m = KC.board(k, null, true);
        if (m) out.push({ icon: 'star', text: '견습 ' + nm(k) + U.jx(nm(k), '이/가') + ' 어른이 되어 정식 항해사가 되었다. 이제 선실·역할을 맡길 수 있다.' });
      }
    });
    return out;
  };

  // ---------------------------------------------------------------- 서른이 넘은 아들의 독립
  var PATH = {
    str: { title: '상선의 선장', say: '제 배를 구해 먼 바다로 짐을 나르겠습니다. 아버지께 배운 뱃길이 있으니까요.' },
    'int': { title: '대학의 학자', say: '대학에서 공부를 이어 가려 합니다. 아버지가 찾은 땅들을 책으로 남기고 싶어요.' },
    mar: { title: '어느 군주의 기사', say: '칼 한 자루로 섬길 주군을 찾겠습니다. 아버지 이름에 먹칠하지 않을게요.' },
    cha: { title: '항구의 상인', say: '항구에 상관을 열겠습니다. 사람 사귀는 재주는 아버지를 닮았나 봅니다.' }
  };
  function bestStat(k) { var st = k.st || {}, b = 'str'; ['str', 'int', 'mar', 'cha'].forEach(function (x) { if ((st[x] || 0) > (st[b] || 0)) b = x; }); return b; }
  function leavers(minAge, homeOnly) {
    return (S().player.kids || []).filter(function (k) {
      return k.sex !== 'f' && !k.unnamed && !k.lost && !k.away && !k.aboard && !KC.hired(k) && age(k) >= minAge && (!homeOnly || k.house == null);
    }).sort(function (a, b) { return age(b) - age(a); });
  }
  KC.leavers = leavers;
  function leave(k, how, purse) {
    var s = S(), P = PATH[bestStat(k)];
    k.away = { path: bestStat(k), title: P.title, y: s.date.y, how: how, purse: purse || 0 };
    delete k.house;
    G.State.log(nm(k) + U.jx(nm(k), '이/가') + ' 서른이 넘어 제 살 길을 찾아 집을 떠났다 — ' + P.title + '. (뒤를 이을 자격은 그대로)');
  }
  /** 자택에 들어설 때 (js/city/misc.js HM.enter): 서른이 넘은 아들 하나가 인사하고 떠난다 — 일이 있었으면 true */
  KC.homeCheck = async function (c) {
    var s = S(); if (!s || !s.player || s.regency) return false;
    var k = leavers(K().leaveAge, true)[0]; if (!k) return false;
    var UI = G.UI, p = s.player, P = PATH[bestStat(k)], sp = kidSp(k), b = F().bond(k), c0 = K();
    await UI.say(b >= 40 ? '아버지, 드릴 말씀이 있습니다. 저도 서른이 넘었습니다. 언제까지 아버지 집에서 지낼 수는 없지요.' : '…아버지. 저, 이 집을 떠나겠습니다. 서른이 넘도록 기다렸으니까요.', sp);
    await UI.say(P.say, sp);
    var opts = [{ label: '노자를 쥐여 준다 (금화 ' + U.num(c0.purse) + '닢)', value: 'give', dis: p.gold < c0.purse }, { label: '축복하며 안아 준다', value: 'hug' }];
    if (KC.can(k)) opts.push({ label: '「그럼 내 배에 타거라」 — 함께 항해한다', value: 'board' });
    var v = await UI.ask(nm(k) + U.jx(nm(k), '이/가') + ' 제 살 길을 찾아 떠나려 한다.', opts, sp);
    if (v === 'board') {
      await UI.say(b >= 30 ? '…아버지 배에요? 네, 기꺼이! 오래 기다렸습니다.' : '…그렇게까지 말씀하신다면. 따르겠습니다.', sp);
      if (KC.board(k, c)) { F().addBond(k, 6); return true; }
    }
    if (v === 'give' && p.gold >= c0.purse) { p.gold -= c0.purse; F().addBond(k, 5); await UI.say('…감사합니다, 아버지. 이 돈은 헛되이 쓰지 않겠습니다.', sp); leave(k, 'home', c0.purse); }
    else { F().addBond(k, 3); await UI.say('아버지 품은 여전히 넓으시네요. 건강하세요.', sp); leave(k, 'home', 0); }
    await UI.say('가문의 뒤를 이을 날이 오면 부르십시오. 어디에 있든 달려오겠습니다.', sp);
    UI.toast(nm(k) + ' — ' + P.title + ' (뒤를 이을 자격은 그대로)', 'boot', 5000);
    if (G.Game.cityHud) G.Game.cityHud();
    return true;
  };
  /** 해마다 (W.newYear): 끝내 집에 들르지 않으면 편지를 남기고 떠난다 */
  KC.newYear = function () {
    var out = [], s = S(); if (!s || !s.player || s.regency) return out;
    leavers(K().letterAge, false).forEach(function (k) {
      leave(k, 'letter', 0);
      out.push({ icon: 'scroll', text: nm(k) + U.jx(nm(k), '이/가') + ' 편지를 남기고 집을 떠났다 — 「아버지를 기다리다 서른을 넘겼습니다. 제 길을 찾아 ' + PATH[k.away.path].title + U.jx(PATH[k.away.path].title, '이/가') + ' 되겠습니다. 부르시면 돌아오겠습니다.」 (뒤를 이을 자격은 그대로)' });
    });
    return out;
  };
  /** 자택 「가족」에서: 떠난 아들의 편지 (해마다 한 번) · 배로 부른다 */
  KC.awayTalk = async function (k, c) {
    var s = S(), UI = G.UI, w = wifeSp(), a = k.away || {};
    if (k.awayLetterY === s.date.y) return;
    k.awayLetterY = s.date.y;
    var line = nm(k) + U.jx(nm(k), '이/가') + ' 편지를 보냈어요. ' + (a.title || '제 길') + U.jx(a.title || '제 길', '으로/로') + ' 잘 지낸대요. 「아버지 뒤를 이을 날이 오면 언제든 부르세요」라고 적었네요.';
    if (w) await UI.say(line, w); else await UI.say(line, {});
    var v = await UI.ask(nm(k) + '에게 답장을 쓸까?', [{ label: '「내 배로 오너라」 — 불러서 함께 항해한다', value: 'call', dis: s.loc.via === 'land' }, { label: '안부만 전한다', value: 'note' }], {});
    if (v === 'call') {
      delete k.away;
      if (KC.board(k, c)) { F().addBond(k, 5); UI.toast(nm(k) + U.jx(nm(k), '이/가') + ' 아버지의 부름을 받고 돌아와 함대에 올랐다.', 'ship', 4500); }
      else { k.away = a; }
    } else F().addBond(k, 2);
  };

  // ---------------------------------------------------------------- 뒤를 잇는 날
  /** F.succeed 첫머리: 배에 탄 아들은 함대에서 내려 제독이 되고, 떠나 있던 아들은 돌아온다 */
  KC.beforeSucceed = function (k) {
    var s = S(); if (!k) return;
    if (k.mateId && KC.hired(k)) {
      KC.syncKid(k);
      s.mates = s.mates.filter(function (m) { return m.id !== k.mateId; });
      if (G.R.tidyCaptains) G.R.tidyCaptains(); if (G.Cabins && G.Cabins.tidy) G.Cabins.tidy();
    }
    if (k.mateId) {   // 이제 제독 자신 — 항해사 정의는 거둔다
      if (s.sibs && s.sibs.defs) delete s.sibs.defs[k.mateId];
      for (var i = G.MATES.length - 1; i >= 0; i--) if (G.MATES[i].id === k.mateId) G.MATES.splice(i, 1);
      delete G.MATE[k.mateId];
      delete k.mateId;
    }
    if (k.away) { G.State.log('집을 떠나 ' + k.away.title + U.jx(k.away.title, '이/가') + ' 되었던 ' + nm(k) + U.jx(nm(k), '이/가') + ' 돌아와 가문의 뒤를 잇는다.'); delete k.away; }
    k.aboard = false; k.crew = false;
  };
  /** 뒤를 이을 아들 목록에 붙이는 말 */
  KC.heirNote = function (k) { return k.away ? ' · 독립 (' + k.away.title + ')' : KC.hired(k) ? ' · 함께 항해 중' : ''; };
})(window.G = window.G || {});
