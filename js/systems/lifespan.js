/* 제독의 수명과 생일 선물 (G.Life)
   · 수명: 제독은 maxAge세(80)를 넘겨 살지 못한다. maxAge세 생일(옛 저장이면 그 나이를 넘긴 날)에 조용히 눈을 감고,
     어른이 된 아들이 있으면 뒤를 잇고(G.Family.retire(true) → succeed) 없으면 모험이 끝난다.
     warnFrom세부터는 생일마다 남은 날이 많지 않다고 알린다 (후계를 준비하라는 귀띔).
   · 생일 선물: 충성이 giftLoyal(90) 이상인 항해사(부하) 가운데 가장 충성스러운 한 사람이 잘하는 일에 맞는 선물 하나를 준다 —
     항해 도구·무기·라임·장신구·잔치·노래·금화 등. 고맙다는 말에 충성이 giftLoyalUp 오른다.
     배에 함께 탄 아내(본처 p.wifeAboard · 둘째 부인 G.Wives.aboard())와 견습으로 탄 아이(G.Family.aboard())도 저마다 선물을 준다
     (아내: 손수 지은 옷·부적·생일상, 아이: 나이에 맞는 손수 만든 것 — 고맙다는 말에 아이와의 사이 +kidBond). 한 창에 모아 보여 준다.
   · 대화 창은 도시·바다·뭍에서 다른 창이 없을 때 띄운다 (main.js 의 loop가 G.Life.tick을 부른다).
   · 저장: s.life = {bday: 선물을 기다리는 생일의 해, bdayDone: 선물을 받은 해, end: 수명이 다함(나이)}
   조정값: G.BALANCE.life */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var LF = G.Life = {};
  function S() { return G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.life) || { maxAge: 80, warnFrom: 75, giftLoyal: 90, giftLoyalUp: 2 }; }
  function st() { var s = S(); return s.life || (s.life = {}); }
  LF.maxAge = function () { return K().maxAge || 80; };

  /** 날마다 (js/systems/world.js) — 생일이면 선물을 예약하고, 수명이 다했으면 표시한다. 알림 목록을 돌려준다 */
  LF.daily = function () {
    var s = S(), out = [], T = st(), k = K();
    if (!s || !s.player || !s.player.born) return out;
    var age = R.age(), bday = s.date.m === s.player.born.m && s.date.d === s.player.born.d;
    if (bday) {
      if (T.bdayDone !== s.date.y && LF.givers().length) T.bday = s.date.y;
      if (age >= (k.warnFrom || 75) && age < LF.maxAge()) out.push({ icon: 'hourglass', text: R.fullName() + '도 어느덧 ' + age + '세. 남은 날이 많지 않다는 것을 스스로도 안다' + (G.Family && G.Family.heirs && G.Family.heirs().length ? '.' : ' — 뒤를 이을 아들이 아직 없다.'), lifeWarn: true });
    }
    if (!T.end && age >= LF.maxAge()) { T.end = age; G.State.log(R.fullName() + U.j(R.fullName(), '이/가').slice(R.fullName().length) + ' ' + age + '세가 되었다.'); }
    return out;
  };

  /** 배에 함께 탄 아내들: [{id, name, main: 본처인가, speaker}] */
  LF.wivesAboard = function () {
    var p = S().player, out = [];
    if (p.wife && p.wifeAboard && G.Family) out.push({ id: p.wife, name: G.Family.wifeName(), main: true, speaker: G.Family.wifeSpeaker() });
    if (G.Wives) G.Wives.aboard().forEach(function (w) { out.push({ id: w.id, name: G.Wives.name(w), main: false, speaker: G.Wives.speaker(w) }); });
    return out;
  };
  /** 선물을 줄 사람들: 가장 충성스러운 부하 한 사람(충성 giftLoyal 이상, 함께 탄 아내는 빼고) + 함께 탄 아내 + 견습으로 탄 아이 */
  LF.givers = function () {
    var s = S(), lim = K().giftLoyal || 90, wives = LF.wivesAboard(), wifeIds = wives.map(function (w) { return w.id; });
    var mates = (s.mates || []).filter(function (m) { return G.MATE[m.id] && wifeIds.indexOf(m.id) < 0 && (m.loyal == null ? 70 : m.loyal) >= lim && !(R.mateHidden && R.mateHidden(m)); })
      .sort(function (a, b) { return (b.loyal || 0) - (a.loyal || 0); });
    var out = mates.length ? [{ kind: 'mate', m: mates[0] }] : [];
    wives.forEach(function (w) { out.push({ kind: 'wife', w: w }); });
    var kids = G.Family && G.Family.aboard ? G.Family.aboard().filter(function (k) { return !k.unnamed; }) : [];
    kids.forEach(function (k) { out.push({ kind: 'kid', k: k }); });
    return out;
  };

  // ---------------------------------------------------------------- 선물 고르기
  function owned(id) { return R.hasItem(id); }
  function yearOk(id) { var d = G.ITEM[id]; return d && (!d.from || S().date.y >= d.from); }
  function firstNew(list) { for (var i = 0; i < list.length; i++) if (yearOk(list[i]) && !owned(list[i])) return list[i]; return null; }
  function goldGift(m) { var p = S().player; return U.clamp(Math.round((p.gold || 0) * 0.02 / 50) * 50, 200, 3000); }
  /* 특기마다 선물 — 가장 잘하는 특기부터 차례로 보고, 줄 수 없으면 다음 특기 */
  var BY = {
    nav: function () { var id = firstNew(['sextant', 'astrolabe', 'telescope', 'compass']); return id && { item: id, line: '바다 위에서 길을 잃지 마시라고요. 제가 아끼던 것입니다.' }; },
    survey: function () { var id = firstNew(['telescope', 'sextant', 'astrolabe']); return id && { item: id, line: '멀리 보시라고요. 수평선 너머까지.' }; },
    sword: function () { var id = firstNew(['estoc', 'broadsword', 'longsword', 'saber']); return id && { item: id, line: '제 손에 익은 칼보다 제독께 어울리는 칼입니다. 대장장이를 몇이나 찾아다녔습니다.' }; },
    shoot: function () { var id = firstNew(['saber', 'longsword']); return id && { item: id, line: '총만 쏘는 줄 아셨지요? 칼 보는 눈도 있답니다.' }; },
    gun: function () { return { fx: 'shells', line: '작렬탄입니다. 포 다루는 놈한테서 받는 선물이 뭐 별수 있겠습니까. 하하.' }; },
    med: function () { return { item: 'lime', line: '라임 절임입니다. 생일에 드리기엔 시큼하지만, 오래 사시라는 뜻입니다.' }; },
    cook: function () { return { fx: 'feast', line: '오늘 저녁은 제가 차립니다. 다들 배 터지게 먹읍시다!' }; },
    music: function () { return { fx: 'song', line: '제독을 위해 지은 노래입니다. 선원들도 다 외웠지요. 자, 하나 둘 셋!' }; },
    craft: function () { var id = firstNew(['hairpin', 'shawl', 'perfume', 'ribbon', 'pearlnk']); return id && { item: id, line: '제가 손본 장신구입니다. 좋은 분께 건네실 날이 오겠지요.' }; },
    acct: function (m) { return { gold: goldGift(m), line: '장부를 맞춰 보니 남는 돈이 좀 있더군요. 제 몫에서 떼어 드리는 겁니다.' }; },
    theo: function () { return { fx: 'bless', line: '오늘 미사에서 제독을 위해 기도했습니다. 앞으로의 항해에 축복이 함께하기를.' }; },
    art: function () { return { fx: 'portrait', line: '제독의 초상을 그렸습니다. 항구 사람들이 보고 다들 감탄하더군요.' }; },
    ship: function () { return { fx: 'mat', line: '쓸 만한 목재와 밧줄을 모아 두었습니다. 배는 제가 늘 돌보겠습니다.' }; },
    ops: function () { return { fx: 'drill', line: '선원들이 오늘만큼은 군말 없이 일하겠답니다. 제독의 생일이니까요.' }; }
  };
  var ORDER = ['nav', 'survey', 'sword', 'shoot', 'gun', 'med', 'cook', 'music', 'craft', 'acct', 'theo', 'art', 'ship', 'ops'];
  LF.giftFor = function (m) {
    var sk = ORDER.map(function (id, i) { return { id: id, lv: R.mateSkill(m, id), i: i }; }).filter(function (x) { return x.lv > 0; })
      .sort(function (a, b) { return b.lv - a.lv || a.i - b.i; });
    for (var i = 0; i < sk.length; i++) { var g = BY[sk[i].id](m); if (g) { g.sk = sk[i].id; return g; } }
    return { gold: goldGift(m), line: '변변치 않지만 받아 주십시오. 늘 감사하고 있습니다.', sk: null };
  };
  /** 아내의 선물 (해마다 바뀐다) */
  LF.wifeGift = function (w) {
    var y = S().date.y, list = [
      { fx: 'shirt', line: w.main ? '바닷바람에 해지지 말라고 밤마다 바느질했어요. 꼭 입고 다니세요.' : '배 위에서 몰래 지었어요. 소매가 조금 짧아도 웃지 마세요.' },
      { fx: 'meal', line: '오늘 저녁은 제가 갑판 부엌을 빌렸어요. 선원들 몫까지 넉넉히 했답니다.' }
    ];
    if (!owned('charm')) list.push({ item: 'charm', line: '항구 시장에서 산 부적이에요. 늘 지니고 다니시면 제 마음이 놓여요.' });
    return list[Math.abs(U.strHash(w.id + ':' + y)) % list.length];
  };
  /** 아이의 선물 (나이에 맞게) */
  LF.kidGift = function (k) {
    var age = G.Family.kidAge(k), f = k.sex === 'f';
    if (age < 10) return { fx: 'drawing', line: '아버지 배를 그렸어요! 돛이 제일 크게 나왔어요. 선원 아저씨들도 다 그렸어요!' };
    if (age < 16) return { fx: 'model', line: f ? '조개껍데기를 모아 목걸이를 만들었어요. 바다에 나가실 때 걸고 가세요.' : '갑판장 아저씨한테 배워서 작은 배를 깎았어요. 우리 기함이에요!' };
    return { fx: 'watch', line: '오늘 밤 당직은 제가 서겠습니다. 아버지는 푹 쉬십시오. 생신 축하드립니다.' };
  };
  /** 선물을 받는다 — 받은 것을 한 줄로 돌려준다 */
  function receive(g) {
    var s = S(), f = s.fleet, p = s.player;
    if (g.item) {
      if (!R.itemsFull() && R.addItem(g.item)) return '「' + G.ITEM[g.item].name + '」';
      g.gold = goldGift(); delete g.item;     // 소지품이 가득하면 금화로
    }
    if (g.gold) { p.gold += g.gold; return '금화 ' + U.num(g.gold) + '닢'; }
    switch (g.fx) {
      case 'shells': if (!R.itemsFull() && R.addItem('shells')) return '「작렬탄」'; p.gold += 800; return '금화 800닢';
      case 'feast': f.fatigue = 0; f.discipline = Math.min(100, (f.discipline || 60) + 8); return '생일 잔치 (피로 0 · 규율 +8)';
      case 'song': f.fatigue = Math.max(0, f.fatigue - 20); f.discipline = Math.min(100, (f.discipline || 60) + 10); return '생일 노래 (피로 −20 · 규율 +10)';
      case 'bless': p.hp = 100; return '축복 기도 (제독 체력 100)';
      case 'portrait': G.Fame.add('so', 15); return '제독의 초상화 (명성 사교 +15)';
      case 'mat': f.mat = (f.mat || 0) + 15; return '자재 15통';
      case 'drill': f.discipline = Math.min(100, (f.discipline || 60) + 15); return '규율 +15';
      case 'shirt': p.hp = 100; f.fatigue = Math.max(0, f.fatigue - 10); return '손수 지은 옷 (제독 체력 100 · 피로 −10)';
      case 'meal': f.fatigue = Math.max(0, f.fatigue - 15); f.discipline = Math.min(100, (f.discipline || 60) + 5); return '생일상 (피로 −15 · 규율 +5)';
      case 'drawing': f.discipline = Math.min(100, (f.discipline || 60) + 4); return '아버지 배 그림 (선원들이 웃는다 · 규율 +4)';
      case 'model': f.fatigue = Math.max(0, f.fatigue - 6); return '손수 만든 선물 (피로 −6)';
      case 'watch': f.fatigue = Math.max(0, f.fatigue - 12); return '대신 서는 밤 당직 (피로 −12)';
    }
    return '';
  }

  // ---------------------------------------------------------------- 창
  function ready() {
    var s = S(), g = G.Game;
    if (!s || !s.player || UI.busy() || (LF.running && LF.running === s)) return false;   // 끝 장면에서 새 게임·불러오기로 넘어가면(상태가 바뀌면) 다시 돈다
    if (['city', 'sea', 'land'].indexOf(g.sceneName) < 0) return false;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return false;   // 첫 항해 안내 중에는 미룬다
    var rt = g.scene && g.scene.runtime ? g.scene.runtime() : null;
    if (rt && rt.busy) return false;
    if (g.sceneName === 'city' && G.Scenes.city.busy && G.Scenes.city.busy()) return false;
    return true;
  }
  /** 날마다 화면 틈에 (main.js loop) */
  LF.tick = function () {
    var s = G.Game.state; if (!s || !s.life) return;
    var T = s.life; if (!(T.bday && T.bdayDone !== T.bday) && !T.end) return;
    if (!ready()) return;
    LF.running = s;
    (async function () {
      try {
        if (T.bday && T.bdayDone !== T.bday) await LF.birthday();
        if (T.end) await LF.die();
      } catch (e) { console.error(e); }
      if (LF.running === s) LF.running = null;
    })();
  };

  LF.birthday = async function () {
    var s = S(), T = st(), k = K(), age = R.age();
    T.bdayDone = T.bday; delete T.bday;
    var list = LF.givers(); if (!list.length) return;
    var rows = list.map(function (gv) {
      var g = gv.kind === 'mate' ? LF.giftFor(gv.m) : gv.kind === 'wife' ? LF.wifeGift(gv.w) : LF.kidGift(gv.k), got = receive(g), r = { gv: g, got: got, kind: gv.kind };
      if (gv.kind === 'mate') { gv.m.loyal = Math.min(100, (gv.m.loyal || 70) + (k.giftLoyalUp || 2)); r.name = G.MATE[gv.m.id].name; r.tag = '부하 · 충성 ' + Math.round(gv.m.loyal); r.spec = G.Scenes.mateSpec(gv.m.id); }
      else if (gv.kind === 'wife') { r.name = gv.w.name; r.tag = gv.w.main ? '아내' : '둘째 부인'; r.spec = gv.w.speaker && gv.w.speaker.portrait; }
      else { G.Family.addBond(gv.k, k.kidBond || 3); r.name = gv.k.name; r.tag = (gv.k.sex === 'f' ? '딸' : '아들') + ' · ' + G.Family.kidAge(gv.k) + '세 · 견습'; r.spec = G.Family.kidSpec(gv.k); }
      return r;
    });
    var fam = rows.some(function (r) { return r.kind !== 'mate'; }), mate = rows.some(function (r) { return r.kind === 'mate'; });
    var head = R.fullName() + '의 ' + age + '번째 생일. ' + (fam && mate ? '함께 배에 탄 가족과 오랜 항해사가 선물을 들고 찾아왔다.' : fam ? '함께 배에 탄 가족이 선물을 들고 찾아왔다.' : '오랫동안 곁을 지켜 온 항해사가 선물을 들고 찾아왔다.');
    var html = '<div class="bday-head">' + head + '</div><div class="bday-list">' +
      rows.map(function (r, i) { return '<div class="bday-row bd-' + r.kind + '"><div class="bd-face" data-i="' + i + '"></div><div class="bd-body"><b>' + U.esc(r.name) + '</b> <small class="muted">' + r.tag + '</small><div class="bd-line">「' + r.gv.line + '」</div><div class="bd-got">' + G.icon('star') + ' ' + r.got + '</div></div></div>'; }).join('') + '</div>';
    var w = UI.window({ title: '생일 선물', icon: 'star', width: 760, html: '<div class="bday">' + html + '</div>', buttons: [{ label: rows.length > 1 ? '모두에게 고맙다고 한다' : '고맙다고 한다', value: 1, cls: 'navy' }] });
    rows.forEach(function (r, i) { try { var el = w.content.querySelector('.bd-face[data-i="' + i + '"]'); if (el && r.spec) el.appendChild(A.portraitCanvas(r.spec, 72)); } catch (e) { /* 그림 없음 */ } });
    if (G.Audio) G.Audio.sfx('discover');
    await w.result;
    var last = rows[rows.length - 1].name;
    G.State.log(age + '번째 생일에 ' + rows.map(function (r) { return r.name; }).join('·') + U.jx(last, '이/가') + ' 선물을 주었다.');
    if (G.Game.refreshHud) G.Game.refreshHud();
    if (G.Game.sceneName === 'land' && G.Scenes.land.refreshBar) G.Scenes.land.refreshBar();
  };

  LF.die = async function () {
    var s = S(), T = st(), name = R.fullName(), age = R.age();
    delete T.end;
    var heirs = G.Family && G.Family.heirs ? G.Family.heirs() : [];
    var where = s.loc.mode === 'sea' ? '흔들리는 선실에서' : s.loc.mode === 'land' ? '야영지의 모닥불 곁에서' : (G.CITY_DATA[s.loc.city] ? G.CITY_DATA[s.loc.city].name + '의 여관 방에서' : '조용한 방에서');
    G.State.log(name + U.j(name, '이/가').slice(name.length) + ' ' + age + '세로 세상을 떠났다.');
    await UI.alert(age + '세 생일이 지난 어느 밤, ' + name + U.jx(name, '은/는') + ' ' + where + ' 조용히 눈을 감았다.<br>' +
      '평생을 바다와 함께한 제독이었다. 곁을 지키던 이들이 마지막으로 들은 말은 바람과 물때에 관한 것이었다고 한다.<br><br>' +
      (heirs.length ? '<span class="muted">이제 뜻을 이을 아들이 나설 차례다.</span>' : '<span class="warn-text">뒤를 이을 아들이 없어 모험은 여기서 막을 내린다.</span>'), '세월');
    await G.Family.retire(true);
  };
})(window.G = window.G || {});
