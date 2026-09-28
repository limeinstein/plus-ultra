/* Family, succession, retirement and endings. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var F = {};
  G.Family = F;
  function S() { return G.Game.state; }

  /** 아내: 여급(G.MAID) 또는 부하였던 사람(G.MATE — 여성 항해사·철새·마녀) */
  F.wifeMate = function () { var w = S().player.wife; return w && !G.MAID[w] && G.MATE[w] ? G.MATE[w] : null; };
  F.wifeName = function () {
    var w = S().player.wife; if (!w) return '';
    return G.MAID[w] ? G.MAID[w].name : G.MATE[w] ? G.MATE[w].name : '아내';
  };
  F.wifeSpeaker = function () {
    var s = S(), m = G.MAID[s.player.wife];
    if (m) return G.Scenes.city.B.tavern.maidSpeaker(m);
    var md = F.wifeMate();
    if (md) return { name: md.name, rigId: 'mate:' + md.id, portrait: G.Scenes.mateSpec(md.id), lang: 3 };
    return { name: '', portrait: null };
  };
  F.kidAge = function (k) { var s = S(); return s.date.y - k.born.y - ((s.date.m < k.born.m || (s.date.m === k.born.m && s.date.d < k.born.d)) ? 1 : 0); };
  F.kidSpec = function (k) {
    var sp = A.portraitSpec({ seed: 'kid_' + k.name + k.born.y, culture: 'med', g: k.sex === 'f' ? 'f' : 'm', age: 'young', beard: 0 });
    var kids = (S().player.kids || []).filter(function (x) { return (x.sex === 'f') === (k.sex === 'f'); });
    var order = Math.max(1, kids.indexOf(k) + 1);
    return A.withImg(sp, G.Img.chain.kid(k.sex, order));
  };

  function cfg() { return (G.BALANCE && G.BALANCE.family) || {}; }
  var NAMES = {
    PT: { m: ['주앙', '마누엘', '디오구', '페드루', '안토니우', '프란시스쿠', '루이스', '가스파르', '베르나르두'], f: ['마리아', '이자벨', '레오노르', '베아트리스', '카타리나', '이네스', '주아나', '브리테스'] },
    ES: { m: ['후안', '페드로', '루이스', '디에고', '안토니오', '프란시스코', '알론소', '곤살로', '에르난도'], f: ['마리아', '이사벨', '레오노르', '베아트리스', '카탈리나', '이네스', '후아나', '엘비라'] }
  };
  F.names = function (sex) { var n = NAMES[S().player.nation] || NAMES.PT; return n[sex === 'f' ? 'f' : 'm']; };
  F.kidName = function (k) { return k.unnamed ? (k.sex === 'f' ? '갓 태어난 딸' : '갓 태어난 아들') : k.name; };

  /** 아이의 타고난 능력: 제독을 닮고 조금씩 다르다 */
  function inborn() {
    var p = S().player, st = p.st || {}, mw = F.wifeMate(), ms = mw && mw.st;   // 부하였던 아내라면 엄마도 닮는다
    function one(v, i) { var mo = ms ? ms[i] : 55; return Math.max(30, Math.min(85, Math.round(((v || 55) + (mo || 55)) / 2 + U.ri(-8, 8)))); }
    return { str: one(st.str, 0), int: one(st.int, 1), mar: one(st.mar, 2), cha: one(st.cha, 3) };
  }
  function newKid(sex) {
    var s = S();
    return { name: '', unnamed: true, sex: sex, born: { y: s.date.y, m: s.date.m, d: s.date.d }, sk: {}, lg: {}, st: inborn(), edu: {} };
  }

  /** 매일 (W.daily): 임신 소식·출산 */
  F.daily = function () {
    var s = S(), p = s.player, out = [], c = cfg();
    if (!p.wife || !p.preg) return out;
    var pr = p.preg, days = s.day - pr.since, atHome = s.loc && s.loc.mode === 'city' && s.loc.city === p.home;
    if (!pr.told && days >= 75 && !atHome) {
      pr.told = true;
      out.push({ icon: 'heart', text: '고향 ' + G.CITY_DATA[p.home].name + '의 아내에게서 편지가 왔다. 「당신, 우리에게 아기가 생겼어요. 몸조심하고 꼭 돌아와요.」' });
      G.State.log('아내에게서 아기가 생겼다는 편지를 받았다.');
    }
    if (s.day >= pr.due) {
      var twins = U.chance(c.twins || 0.03), born = [];
      for (var t = 0; t < (twins ? 2 : 1); t++) {
        var sex = U.pick(['m', 'f']); var k = newKid(sex); p.kids.push(k); born.push(k);
      }
      p.preg = null; p.lastBirth = s.day;
      var what = twins ? '쌍둥이가' : (born[0].sex === 'f' ? '딸이' : '아들이');
      out.push({ icon: 'heart', text: (atHome ? '집에서 ' : '고향 ' + G.CITY_DATA[p.home].name + '에서 ') + what + ' 태어났다! ' + (atHome ? '자택에서 이름을 지어 주자.' : '집에 돌아가 이름을 지어 주자.') });
      G.State.log((twins ? '쌍둥이' : born[0].sex === 'f' ? '딸' : '아들') + '이 태어났다.');
    }
    return out;
  };
  /** 해마다 (W.newYear): 아이들이 자란다 */
  F.newYear = function () {
    var s = S(), out = [], c = cfg();
    (s.player.kids || []).forEach(function (k) {
      if (!k.st) k.st = inborn();
      var age = F.kidAge(k);
      if (age >= 3) ['str', 'int', 'mar', 'cha'].forEach(function (x) { if (U.chance(0.5)) k.st[x] = Math.min(90, k.st[x] + 1); });
      if (!k.unnamed && (age === 6 || age === 12)) out.push({ icon: 'heart', text: k.name + U.jx(k.name, '이/가') + ' ' + age + '살이 되었다. ' + (age === 6 ? '글을 배우기 시작할 나이다.' : '바다를 동경하는 눈빛이 제법 날카롭다.') });
      if (!k.unnamed && age === (c.adult || 16)) out.push({ icon: 'star', text: k.name + U.jx(k.name, '이/가') + ' 어른이 되었다. 이제 제독의 뒤를 이을 수 있다.' });
    });
    return out;
  };

  /** 자택에 들렀을 때: 아이가 생기거나, 소식을 듣거나, 갓난아이의 이름을 짓는다 */
  F.homeVisit = async function (rest) {
    var s = S(), p = s.player, c = cfg();
    if (!p.wife) return;
    var w = F.wifeSpeaker();
    // 이름 없는 아기
    for (var i = 0; i < p.kids.length; i++) {
      var k = p.kids[i]; if (!k.unnamed) continue;
      await UI.say(U.pick(['당신, 우리 아기 좀 봐요. 당신을 꼭 닮았어요.', '이 아이가 당신을 기다렸어요. 이름을 지어 주세요.']), w);
      var pool = U.shuffle(F.names(k.sex).filter(function (n) { return !p.kids.some(function (o) { return o.name === n; }) && n !== p.name; })).slice(0, 4);
      var v = await UI.choose((k.sex === 'f' ? '딸' : '아들') + '의 이름', pool.map(function (n) { return { label: n, value: n, icon: 'heart' }; }).concat([{ label: '직접 짓는다', value: '_', icon: 'scroll' }]), { width: 420, cancel: false });
      if (v === '_' || !v) v = (await UI.prompt('아이의 이름', pool[0], 10)) || pool[0];
      k.name = v; k.unnamed = false;
      G.State.log((k.sex === 'f' ? '딸' : '아들') + '에게 「' + v + '」' + U.jx(v, '이라는/라는') + ' 이름을 지어 주었다.');
      await UI.say(v + '… 좋은 이름이에요. ' + (k.sex === 'f' ? '분명 당신처럼 용감한 아이로 자랄 거예요.' : '언젠가 당신처럼 먼 바다로 나가겠죠.'), w);
    }
    // 아기 소식
    if (p.preg && !p.preg.told && s.day - p.preg.since >= 40) {
      p.preg.told = true;
      await UI.say('당신… 할 이야기가 있어요. 우리에게 아기가 생겼어요.', w);
      await UI.alert('아내가 아이를 가졌다. ' + Math.max(1, Math.round((p.preg.due - s.day) / 30)) + '달쯤 뒤에 태어난다.', '기쁜 소식');
      G.State.log('아내가 아이를 가졌다.');
    }
    // 아이가 생긴다
    var today = s.day, kidsN = p.kids.length + (p.preg ? 1 : 0), wm = F.wifeMate();
    var tooOld = wm && (wm.old || (wm.bornY && s.date.y - wm.bornY > 45));   // 늙은 마녀·나이 든 아내
    if (!p.preg && !tooOld && kidsN < (c.maxKids || 5) && (p.lastBirth == null || today - p.lastBirth >= (c.gapDays || 300)) &&
        (p.tryDay == null || today - p.tryDay >= (rest ? 3 : 20))) {
      p.tryDay = today;
      if (U.chance((c.conceive || 0.35) * (rest ? 1.2 : 1))) p.preg = { since: today, due: today + (c.gestation || 266), told: false };
    }
  };

  F.talk = async function () {
    var s = S(), p = s.player, w = F.wifeSpeaker(), c = cfg();
    await UI.say(U.pick(['당신, 이번 항해는 어땠어요? 이야기 들려주세요.', '아이들이 당신을 많이 보고 싶어 했어요.', '몸 건강히 돌아와 줘서 고마워요.']), w);
    if (p.preg) await UI.say(p.preg.told ? '배 속의 아기가 오늘 발로 찼어요. ' + Math.max(1, Math.round((p.preg.due - s.day) / 30)) + '달만 기다리면 만나요.' : U.pick(['요즘 이상하게 신 것이 당겨요.', '요즘 몸이 조금 나른해요.']), w);
    if (!p.kids.length && !p.preg) await UI.say(U.pick(['우리에게도 아이가 생기면 좋겠어요. 집에 자주 들러 줘요.', '당신이 집에 오래 있으면 좋겠어요.']), w);
    for (var i = 0; i < p.kids.length; i++) {
      var k = p.kids[i], age = F.kidAge(k); if (!k.st) k.st = inborn(); if (!k.edu) k.edu = {};
      if (k.unnamed) continue;
      var sp = { name: k.name + ' (' + age + '세)', portrait: F.kidSpec(k), lang: 3 };
      if (age < 3) { await UI.say(U.pick(['아기가 당신을 보고 방긋 웃어요. 안아 줘요.', '밤마다 조금 울지만, 당신 목소리를 들으면 금방 그쳐요.']), w); continue; }
      if (age < 6) {
        await UI.say(U.pick(['아빠! 아빠! 안아 줘!', '아빠 배 타고 싶어!', '아빠, 바다에 고래 있어?']), sp);
        var play = await UI.ask(k.name + U.jx(k.name, '과/와') + ' 무엇을 할까?', [{ label: '함께 놀아 준다', value: 'play' }, { label: '옛날이야기를 들려준다', value: 'tale' }, { label: '그냥 둔다', value: null }], sp);
        if (play && k.edu[s.date.y + ':' + play] == null) {
          k.edu[s.date.y + ':' + play] = 1;
          if (play === 'play') { k.st.str = Math.min(90, k.st.str + 2); k.st.cha = Math.min(90, k.st.cha + 1); await UI.say('아빠 최고! 또 놀아 줘!', sp); }
          else { k.st.int = Math.min(90, k.st.int + 2); await UI.say('그래서 그 배는 어떻게 됐어? 또 들려줘!', sp); }
        } else if (play) await UI.say('올해는 벌써 많이 놀았어요. 이제 자야 해요.', w);
        continue;
      }
      if (age < (c.adult || 16)) {
        await UI.say(U.pick(['아버지, 저도 크면 아버지처럼 먼 바다로 나갈 거예요.', '아버지, 바다 이야기 해 주세요!', '오늘 선생님께 지도 읽는 법을 배웠어요.']), sp);
        if (k.edu[s.date.y]) { await UI.say(U.pick(['올해 배울 것은 선생님께 잘 배우고 있어요.', '선생님이 저더러 열심이래요!']), sp); continue; }
        var v = await UI.ask(k.name + '의 교육 (올해 한 가지, 금화 ' + U.num(c.eduCost || 800) + '닢)', [
          { label: '항해술을 가르친다', value: 'nav' }, { label: '검술을 가르친다', value: 'sword' },
          { label: '글과 말을 가르친다', value: 'lang' }, { label: '예법과 말솜씨를 가르친다', value: 'speech' },
          { label: '그냥 둔다', value: null }], sp);
        if (v) {
          var cost = c.eduCost || 800;
          if (p.gold < cost) { UI.toast('교육비(금화 ' + U.num(cost) + '닢)가 모자랍니다.', 'coin'); continue; }
          p.gold -= cost; k.edu[s.date.y] = v;
          if (v === 'lang') { var li = U.pick([0, 1, 2, 3, 5]); k.lg[li] = Math.min(3, (k.lg[li] || 0) + 1); k.st.int = Math.min(90, k.st.int + 2); }
          else {
            k.sk[v] = Math.min(3, (k.sk[v] || 0) + 1);
            if (v === 'sword') k.st.str = Math.min(90, k.st.str + 2);
            if (v === 'nav') k.st.int = Math.min(90, k.st.int + 1);
            if (v === 'speech') k.st.cha = Math.min(90, k.st.cha + 2);
          }
          UI.toast(k.name + '에게 가정교사를 붙였다. (금화 ' + U.num(cost) + '닢)', 'book');
        }
      } else await UI.say(U.pick(['아버지, 이제 저도 어엿한 어른입니다. 언제든 배를 맡겨 주십시오.', '아버지의 뒤를 잇는 것이 제 꿈입니다.']), sp);
    }
  };

  F.innEvent = async function (c) {
    var s = S(), kids = (s.player.kids || []).filter(function (k) { return !k.unnamed && F.kidAge(k) >= 3; });
    if (!kids.length || c.id !== s.player.home) return;
    if (U.chance(0.3)) { var k = U.pick(kids); await UI.say(U.pick(['앗, 아버지! 지금 여관 아주머니가 과자 주셨어요.', '아버지는 이 여관에 머문 적 있어요?']), { name: k.name, portrait: F.kidSpec(k), lang: 3 }); }
  };

  F.heirs = function () { var ad = cfg().adult || 16; return S().player.kids.filter(function (k) { return !k.unnamed && F.kidAge(k) >= ad; }); };

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
    await UI.alert(old + '의 모험은 여기서 막을 내린다.<br>그리고 그 뜻은 ' + k.name + '에게 이어진다...<br><br><span class="muted">후원자들은 새 제독을 아직 잘 모른다 — 쌓아 온 신뢰는 30%만 이어진다.</span>', '세대 교체');
    var sk = {}; G.SKILLS.forEach(function (x) { sk[x.id] = Math.max(k.sk[x.id] || 0, Math.floor((p.sk[x.id] || 0) / 2)); });
    // 자라며 쌓은 능력 (F.newYear·가정교사). 옛 저장의 아이는 예전처럼 무작위
    var kst = k.st || { str: U.ri(50, 70), int: U.ri(45, 70), mar: U.ri(45, 70), cha: U.ri(45, 70) };
    function cl(v) { return Math.max(40, Math.min(85, Math.round(v))); }
    // 후원자들은 새 제독을 처음부터 다시 믿어야 한다 — 신뢰가 30%만 남는다
    if (G.Succession) G.Succession.heir();
    var lg = p.lg.map(function (v, i) { return Math.max(k.lg[i] || 0, i === R.nativeLang(p.nation) ? 3 : Math.floor(v / 2)); });
    s.player = {
      name: k.name, nation: p.nation, job: p.job, born: k.born, st: { str: cl(kst.str), int: cl(kst.int), mar: cl(kst.mar), cha: cl(kst.cha) },
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
