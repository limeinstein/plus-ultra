/* Family, succession, retirement and endings. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var F = {};
  G.Family = F;
  function S() { return G.Game.state; }

  F.wifeSpeaker = function () {
    var s = S(), m = G.MAID[s.player.wife];
    if (!m) return { name: '', portrait: null };
    return G.Scenes.city.B.tavern.maidSpeaker(m);
  };
  F.kidAge = function (k) { var s = S(); return s.date.y - k.born.y - ((s.date.m < k.born.m || (s.date.m === k.born.m && s.date.d < k.born.d)) ? 1 : 0); };
  F.kidSpec = function (k) {
    var sp = A.portraitSpec({ seed: 'kid_' + k.name + k.born.y, culture: 'med', g: k.sex === 'f' ? 'f' : 'm', age: 'young', beard: 0 });
    var kids = (S().player.kids || []).filter(function (x) { return (x.sex === 'f') === (k.sex === 'f'); });
    var order = Math.max(1, kids.indexOf(k) + 1);
    return A.withImg(sp, G.Img.chain.kid(k.sex, order));
  };

  F.talk = async function () {
    var s = S(), p = s.player, w = F.wifeSpeaker();
    await UI.say(U.pick(['당신, 이번 항해는 어땠어요? 이야기 들려주세요.', '아이들이 당신을 많이 보고 싶어 했어요.', '몸 건강히 돌아와 줘서 고마워요.']), w);
    for (var i = 0; i < p.kids.length; i++) {
      var k = p.kids[i], age = F.kidAge(k);
      var sp = { name: k.name + ' (' + age + '세)', portrait: F.kidSpec(k), lang: 3 };
      if (age < 6) await UI.say(U.pick(['아빠! 아빠! 안아 줘!', '난 햄이 좋아! 햄햄~.', '아빠 배 타고 싶어!']), sp);
      else if (age < 15) {
        await UI.say(U.pick(['아버지, 저도 크면 아버지처럼 먼 바다로 나갈 거예요.', '아버지, 바다 이야기 해 주세요!', '오늘 선생님께 지도 읽는 법을 배웠어요.']), sp);
        var v = await UI.ask(k.name + '의 교육', [{ label: '항해술을 가르친다', value: 'nav' }, { label: '검술을 가르친다', value: 'sword' }, { label: '글과 말을 가르친다', value: 'lang' }, { label: '그냥 둔다', value: null }], sp);
        if (v) {
          var cost = 800;
          if (p.gold < cost) { UI.toast('교육비(금화 800닢)가 모자랍니다.', 'coin'); continue; }
          p.gold -= cost;
          if (v === 'lang') { var li = U.pick([0, 1, 2, 3, 5]); k.lg[li] = Math.min(3, (k.lg[li] || 0) + 1); }
          else k.sk[v] = Math.min(3, (k.sk[v] || 0) + 1);
          UI.toast(k.name + '에게 가정교사를 붙였다. (금화 800닢)', 'book');
        }
      } else await UI.say(U.pick(['아버지, 이제 저도 어엿한 어른입니다. 언제든 배를 맡겨 주십시오.', '아버지의 뒤를 잇는 것이 제 꿈입니다.']), sp);
    }
  };

  F.innEvent = async function (c) {
    var s = S(); if (!s.player.kids.length || c.id !== s.player.home) return;
    if (U.chance(0.3)) { var k = U.pick(s.player.kids); await UI.say(U.pick(['앗, 아버지! 지금 여관 아주머니가 과자 주셨어요.', '아버지는 이 여관에 머문 적 있어요?']), { name: k.name, portrait: F.kidSpec(k), lang: 3 }); }
  };

  F.heirs = function () { return S().player.kids.filter(function (k) { return F.kidAge(k) >= 16; }); };

  F.retire = async function (forced) {
    var s = S(), p = s.player;
    // 후원 계약이 끝나지 않았으면 물러날 수 없다 (대항해시대 3: 계약 중에는 세대교체 불가)
    if (!forced && s.contract) {
      var kd = G.Errand.name(s.contract);
      await UI.alert('후원자와 맺은 계약(「' + kd + '」)이 아직 끝나지 않았습니다.<br>후원자에게 보고하거나 계약을 포기한 뒤에 물러날 수 있습니다.', '은퇴할 수 없습니다');
      return;
    }
    if (forced && s.contract) {
      // 쓰러지면 계약은 실패로 끝나고, 빌린 배는 후원자가 거두어 간다
      var sp0 = G.SPONSOR[s.contract.sponsor];
      if (sp0 && G.Sponsor) { var r0 = G.Sponsor.rel(sp0.id); r0.fail = (r0.fail || 0) + 1; r0.trust = Math.max(0, r0.trust - 10); if (G.Sponsor.returnLoan) G.Sponsor.returnLoan(s.contract); }
    }
    if (!forced) {
      var ok = await UI.confirm('제독의 자리에서 물러나 은퇴하겠습니까?' + (F.heirs().length ? '<br>성인이 된 자녀에게 뒤를 잇게 할 수 있습니다.' : '<br><span class="warn-text">뒤를 이을 자녀가 없으면 모험은 여기서 끝납니다.</span>'), '은퇴한다', '그만둔다');
      if (!ok) return;
    }
    var heirs = F.heirs();
    if (heirs.length) {
      var i = heirs.length > 1 ? await UI.choose('뒤를 이을 자녀', heirs.map(function (k, j) { return { label: k.name, right: F.kidAge(k) + '세', value: j }; }), { width: 420, cancel: false }) : 0;
      if (i == null) i = 0;
      return F.succeed(heirs[i]);
    }
    return G.Ending.show(forced ? 'death' : 'retire');
  };

  F.succeed = async function (k) {
    var s = S(), p = s.player;
    var old = p.name;
    G.State.log(old + U.j(old, '이/가').slice(old.length) + ' 은퇴하고 ' + k.name + U.j(k.name, '이/가').slice(k.name.length) + ' 뒤를 이었다.');
    await UI.alert(old + '의 모험은 여기서 막을 내린다.<br>그리고 그 뜻은 ' + k.name + '에게 이어진다...', '세대 교체');
    var sk = {}; G.SKILLS.forEach(function (x) { sk[x.id] = Math.max(k.sk[x.id] || 0, Math.floor((p.sk[x.id] || 0) / 2)); });
    var lg = p.lg.map(function (v, i) { return Math.max(k.lg[i] || 0, i === R.nativeLang(p.nation) ? 3 : Math.floor(v / 2)); });
    s.player = {
      name: k.name, nation: p.nation, job: p.job, born: k.born, st: { str: U.ri(50, 70), int: U.ri(45, 70), mar: U.ri(45, 70), cha: U.ri(45, 70) },
      luck: U.ri(30, 70), sk: sk, lg: lg, fame: Math.round(p.fame * 0.5), notoriety: Math.round(p.notoriety * 0.3), gold: p.gold, bank: p.bank,
      items: p.items, equip: p.equip, hp: 100, home: p.home, wife: null, kids: [], generation: (p.generation || 1) + 1, jailed: 0,
      portrait: F.kidSpec(k)
    };
    s.player.portrait.age = 'young';
    s.contract = null;
    G.Game.refreshHud();
    UI.toast(k.name + '의 항해가 시작된다.', 'ship', 4000);
  };

  // ---------------------------------------------------------------- endings
  var E = {};
  G.Ending = E;
  E.check = async function () {
    var s = S();
    var found = G.DISCOVERIES.filter(function (d) { return G.Disc.foundByMe(d.id); }).length;
    if (found >= G.DISCOVERIES.length && !s.flags.allFound) { s.flags.allFound = true; await UI.alert('세상의 모든 발견을 이루었다! 그대의 이름은 영원히 역사에 남으리라.', '위업 달성'); }
  };
  E.show = async function (reason) {
    var s = S(), p = s.player;
    var found = G.DISCOVERIES.filter(function (d) { return G.Disc.foundByMe(d.id); });
    var title = R.fameTitle(p.fame);
    var html = '<div class="center" style="font-family:var(--latin);letter-spacing:.4em;color:#7a5c33;font-size:20px">FINIS</div>' +
      '<div class="center" style="font-size:34px;font-weight:800;margin:10px 0">' + U.esc(p.name) + '</div>' +
      '<div class="center muted" style="font-size:18px">' + (reason === 'death' ? '바다 위에서 생을 마치다' : '은퇴하여 여생을 보내다') + ' · ' + U.fmtDate(s.date) + '</div>' +
      '<div class="sep brass"></div><div class="kv" style="grid-template-columns:200px 1fr;font-size:19px">' +
      '<div>칭호</div><div><b>' + title + '</b></div><div>명성</div><div>' + U.num(p.fame) + '</div>' +
      '<div>발견</div><div>' + found.length + ' / ' + G.DISCOVERIES.length + '</div>' +
      '<div>해도 작성</div><div>' + (G.State.chartPercent() * 100).toFixed(1) + '%</div>' +
      '<div>교역</div><div>' + U.num(s.stats.trades) + '회 · 이익 ' + U.num(s.stats.profit) + '닢</div>' +
      '<div>해전</div><div>' + s.stats.battles + '회 · 승리 ' + s.stats.wins + '</div>' +
      '<div>항해 거리</div><div>' + U.num(Math.round(s.stats.distance * 111)) + ' km</div>' +
      '<div>재산</div><div>' + U.num(p.gold + p.bank) + '닢</div></div>' +
      (found.length ? '<div class="sep"></div><div style="font-size:16px;line-height:1.7">' + found.map(function (d) { return d.name; }).join(' · ') + '</div>' : '');
    await UI.window({ title: '항해의 끝', icon: 'log', width: 820, html: html, closable: false, buttons: [{ label: '타이틀로', value: 1, cls: 'navy' }] }).result;
    UI.fade(function () { G.Game.go('title'); });
    return 'end';
  };
})(window.G = window.G || {});
