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
    if (md) return { name: md.name, rigId: 'mate:' + md.id, portrait: G.Scenes.mateSpec(md.id), half: G.Img.chain.mateHalf ? G.Img.chain.mateHalf(md.id) : null, lang: 3 };
    return { name: '', portrait: null };
  };
  F.kidAge = function (k) { var s = S(); return s.date.y - k.born.y - ((s.date.m < k.born.m || (s.date.m === k.born.m && s.date.d < k.born.d)) ? 1 : 0); };
  F.kidSpec = function (k) {
    var sp = A.portraitSpec({ seed: 'kid_' + k.name + k.born.y, culture: 'med', g: k.sex === 'f' ? 'f' : 'm', age: 'young', beard: 0 });
    var kids = (S().player.kids || []).filter(function (x) { return (x.sex === 'f') === (k.sex === 'f'); });
    var order = Math.max(1, kids.indexOf(k) + 1);
    return A.withImg(sp, G.HomeLife ? G.HomeLife.chain(k, false) : G.Img.chain.kid(k.sex, order));   // 나이·어머니 고장에 맞는 그림 (homelife.js)
  };

  function cfg() { return (G.BALANCE && G.BALANCE.family) || {}; }
  var NAMES = {
    PT: { m: ['주앙', '마누엘', '디오구', '페드루', '안토니우', '프란시스쿠', '루이스', '가스파르', '베르나르두'], f: ['마리아', '이자벨', '레오노르', '베아트리스', '카타리나', '이네스', '주아나', '브리테스'] },
    ES: { m: ['후안', '페드로', '루이스', '디에고', '안토니오', '프란시스코', '알론소', '곤살로', '에르난도'], f: ['마리아', '이사벨', '레오노르', '베아트리스', '카탈리나', '이네스', '후아나', '엘비라'] }
  };
  F.names = function (sex) { var n = NAMES[S().player.nation] || NAMES.PT; return n[sex === 'f' ? 'f' : 'm']; };
  F.kidName = function (k) { return k.unnamed ? (k.sex === 'f' ? '갓 태어난 딸' : '갓 태어난 아들') : k.name; };

  // ---------------------------------------------------------------- 아이와 제독의 사이 (k.bond 0~100)
  /* 대항해시대 3처럼 아이는 제독을 보고 자란다. 집에 자주 들르고, 놀아 주고, 가르치고, 견습으로 데리고 다니면 가까워지고
     오래 떨어져 지내면 서먹해진다. 사이가 좋을수록 뒤를 이을 때 명성·특기를 많이 물려받는다. */
  F.bond = function (k) { return k.bond == null ? 50 : k.bond; };
  F.addBond = function (k, n) { k.bond = Math.max(0, Math.min(100, F.bond(k) + n)); return k.bond; };
  F.bondWord = function (k) { var b = F.bond(k); return b >= 85 ? '아버지를 존경함' : b >= 65 ? '아버지를 따름' : b >= 40 ? '보통' : b >= 20 ? '서먹함' : '마음을 닫음'; };
  F.bondHearts = function (k) { var b = F.bond(k), n = Math.round(b / 20); return '<span class="kid-bond" title="' + F.bondWord(k) + ' (' + b + ')">' + '♥'.repeat(n) + '<span class="muted">' + '♡'.repeat(5 - n) + '</span></span>'; };
  function atHome() { var s = S(); return s.loc && s.loc.mode === 'city' && s.loc.city === s.player.home; }
  F.atHome = atHome;
  /** 지금 견습으로 배에 타고 있는 아이들 */
  F.aboard = function () { return (S().player.kids || []).filter(function (k) { return k.aboard; }); };

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
    var pr = p.preg, days = s.day - pr.since, atHome = F.atHome();
    if (!pr.told && days >= 75 && !atHome) {
      pr.told = true;
      out.push({ icon: 'heart', text: '고향 ' + G.CITY_DATA[p.home].name + '의 아내에게서 편지가 왔다. 「당신, 우리에게 아기가 생겼어요. 몸조심하고 꼭 돌아와요.」' });
      G.State.log('아내에게서 아기가 생겼다는 편지를 받았다.');
    }
    // 해산이 가까워지면 (한 달 앞) — 집에 돌아가 곁을 지켜 주면 아이와 처음부터 가깝다
    if (pr.told && !pr.near && pr.due - s.day <= (c.nearDays || 30)) {
      pr.near = true;
      if (!atHome) out.push({ icon: 'heart', text: '고향의 아내가 곧 해산한다 (약 ' + Math.max(1, pr.due - s.day) + '일 뒤). 집에 돌아가 곁을 지켜 주자.' });
    }
    if (s.day >= pr.due) {
      var twins = U.chance(c.twins || 0.03), born = [];
      for (var t = 0; t < (twins ? 2 : 1); t++) {
        var sex = U.pick(['m', 'f']); var k = newKid(sex);
        k.witness = !!atHome;                                         // 제독이 해산을 지켜보았나 — 출산 장면·첫 사이
        k.bond = atHome ? (c.bondBorn || 60) : (c.bondMissed || 40);
        p.kids.push(k); born.push(k);
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

  /** 달마다 (W.newMonth): 떨어져 지내면 사이가 멀어지고, 견습으로 배에 탄 아이는 배우며 가까워진다 */
  F.newMonth = function () {
    var s = S(), p = s.player, out = [], c = cfg(), home = F.atHome();
    (p.kids || []).forEach(function (k) {
      if (k.unnamed) return;
      var age = F.kidAge(k);
      if (k.aboard) {
        k.sea = (k.sea || 0) + 1;                                    // 함께 바다에 나간 달 수
        F.addBond(k, c.bondAboard || 2);
        if (U.chance(0.5)) { var x = U.pick(['str', 'int', 'mar', 'cha']); k.st[x] = Math.min(90, k.st[x] + 1); }
        if (U.chance(c.apprenticeSkill || 0.22)) {
          var sk = U.pick(['nav', 'survey', 'sword', 'ops', 'gunnery'].filter(function (id) { return G.SKILL && G.SKILL[id] ? true : G.SKILLS.some(function (x) { return x.id === id; }); }));
          if (sk && (k.sk[sk] || 0) < 3) {
            k.sk[sk] = (k.sk[sk] || 0) + 1;
            var nm = (G.SKILLS.filter(function (x) { return x.id === sk; })[0] || {}).name || sk;
            out.push({ icon: 'star', text: '견습 ' + k.name + U.jx(k.name, '이/가') + ' 선원들 틈에서 ' + nm + U.jx(nm, '을/를') + ' 익혔다. (' + nm + ' ' + k.sk[sk] + ')' });
          }
        }
      } else if (k.house === -1) { /* 본국으로 가는 배 위 — 아버지 곁 */ }
      else if (!(k.house != null ? (s.loc.mode === 'city' && s.loc.city === k.house) : home) && age >= 3) F.addBond(k, -(c.bondAway || 1));    // 집을 비운 달 (둘째 부인의 아이는 그 집)
    });
    return out;
  };

  /** 해산 장면 — 제독이 집에 있을 때 (곁을 지킬지 고른다) */
  async function birthScene(born) {
    var w = F.wifeSpeaker(), mid = { name: '산파', portrait: A.withImg(A.npcSpec('midwife' + S().player.home, 'keeper', G.CITY_DATA[S().player.home].style, 'f'), []), lang: 3 };
    await UI.say('나리, 마님께서 진통을 시작하셨습니다! 물을 끓이고 깨끗한 천을 가져오십시오!', mid);
    var v = await UI.ask('아내의 해산이 시작되었다. 어떻게 할까?', [
      { label: '방에 들어가 아내의 손을 잡아 준다', value: 'hand' },
      { label: '문밖에서 기도하며 기다린다', value: 'pray' },
      { label: '의원을 부르러 달려간다 (금화 300닢)', value: 'doc' }], {});
    var p = S().player;
    if (v === 'hand') { await UI.say('당신… 와 줬군요. 손을 놓지 말아요…', w); born.forEach(function (k) { F.addBond(k, 10); }); }
    else if (v === 'doc') {
      if (p.gold >= 300) { p.gold -= 300; await UI.say('의원이 왔으니 이제 안심하십시오. 산모도 아기도 튼튼합니다.', mid); born.forEach(function (k) { ['str', 'cha'].forEach(function (x) { k.st[x] = Math.min(90, k.st[x] + 2); }); }); }
      else await UI.say('…주머니가 비어 의원을 부르지 못했다. 문밖에서 기다릴 수밖에 없다.', {});
    } else await UI.say('긴 밤이 지나도록 문밖을 서성였다. 바다의 폭풍보다 길게 느껴진다.', {});
    await UI.say((born.length > 1 ? '응애—! 응애—! 두 울음소리가 겹쳐 울린다!' : '응애—! 힘찬 울음소리가 집 안에 울려 퍼졌다!'), {});
    await UI.say('나리, 축하드립니다! ' + (born.length > 1 ? '쌍둥이 ' + born.map(function (k) { return k.sex === 'f' ? '따님' : '아드님'; }).join('과 ') + '입니다!' : (born[0].sex === 'f' ? '예쁜 따님입니다!' : '튼튼한 아드님입니다!')), mid);
    await UI.say('당신… 우리 아기예요. 안아 봐요.', w);
  }
  /** 해산을 놓친 제독이 집에 돌아와 아이를 처음 만난다 */
  async function firstMeet(born) {
    var w = F.wifeSpeaker();
    await UI.say('당신이 바다에 있는 동안 이 아이가 태어났어요. ' + (born.length > 1 ? '둘이나요!' : '') + ' 처음엔 당신 얼굴을 낯설어할지도 몰라요. 자주 안아 줘요.', w);
  }

  /** 자택에 들렀을 때: 아이가 생기거나, 소식을 듣거나, 갓난아이의 이름을 짓는다 */
  F.homeVisit = async function (rest) {
    var s = S(), p = s.player, c = cfg();
    if (!p.wife) return;
    var w = F.wifeSpeaker();
    // 갓 태어난 아기: 해산 장면(곁에 있었으면) 또는 첫 만남
    var fresh = p.kids.filter(function (k) { return k.unnamed && !k.met && k.house == null; });   // 둘째 부인의 집 아이(k.house)는 그 집에서 (wives.js)
    if (fresh.length) {
      if (fresh.some(function (k) { return k.witness; })) await birthScene(fresh); else await firstMeet(fresh);
      fresh.forEach(function (k) { k.met = true; });
    }
    // 집에 들르면 아이들과 가까워진다 (보름에 한 번)
    if (p.lastHomeBond == null || s.day - p.lastHomeBond >= 15) {
      p.lastHomeBond = s.day;
      p.kids.forEach(function (k) { if (!k.unnamed && !k.aboard && k.house == null) F.addBond(k, c.bondVisit || 3); });
    }
    // 이름 없는 아기
    for (var i = 0; i < p.kids.length; i++) {
      var k = p.kids[i]; if (!k.unnamed || k.house != null) continue;
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
    var today = s.day, kidsN = G.Wives ? G.Wives.kidTotal() : p.kids.length + (p.preg ? 1 : 0), wm = F.wifeMate();   // 아이는 둘째 부인의 아이까지 모두 합쳐 5명
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
    var low = p.kids.filter(function (k) { return !k.unnamed && !k.aboard && F.kidAge(k) >= 4 && F.bond(k) < 30; })[0];
    if (low) await UI.say(low.name + U.jx(low.name, '이/가') + ' 요즘 당신 이야기를 잘 안 해요. 아버지 얼굴이 가물가물한가 봐요. 집에 좀 더 자주 와 줘요.', w);
    for (var i = 0; i < p.kids.length; i++) {
      var k = p.kids[i], age = F.kidAge(k), b; if (!k.st) k.st = inborn(); if (!k.edu) k.edu = {};
      if (k.unnamed || k.house != null) continue;          // 둘째 부인의 집에 사는 아이는 그 집에서 만난다
      b = F.bond(k);
      var sp = G.HomeLife ? G.HomeLife.speaker(k, true) : { name: k.name + ' (' + age + '세 · ' + F.bondWord(k) + ')', portrait: F.kidSpec(k), lang: 3 };
      if (k.aboard) {
        await UI.say(U.pick(['아버지, 다음 항해는 어디로 가요? 저 밧줄 매는 법 다 익혔어요!', '아버지, 바다는 정말 넓어요. 고래도 봤어요!', '선원 아저씨들이 저더러 제법이래요.']), sp);
        var ab = await UI.ask(k.name + U.jx(k.name, '은/는') + ' 견습으로 함대에 타고 있다 (' + (k.sea || 0) + '달째).', [{ label: '계속 데리고 다닌다', value: 1 }, { label: '집에 남게 한다', value: 0 }], sp);
        if (ab === 0) { k.aboard = false; await UI.say(b >= 60 ? '…알겠어요. 다음에 또 데려가 주세요, 아버지.' : '네.', sp); UI.toast(k.name + U.jx(k.name, '이/가') + ' 집에 남았다.', 'house'); }
        continue;
      }
      if (age < 3) { await UI.say(U.pick(['아기가 당신을 보고 방긋 웃어요. 안아 줘요.', '밤마다 조금 울지만, 당신 목소리를 들으면 금방 그쳐요.']), w); continue; }
      if (age < 6) {
        await UI.say(b >= 40 ? U.pick(['아빠! 아빠! 안아 줘!', '아빠 배 타고 싶어!', '아빠, 바다에 고래 있어?']) : U.pick(['……(엄마 치마 뒤에 숨는다)', '아저씨 누구야?']), sp);
        var play = await UI.ask(k.name + U.jx(k.name, '과/와') + ' 무엇을 할까?', [{ label: '함께 놀아 준다', value: 'play' }, { label: '옛날이야기를 들려준다', value: 'tale' }, { label: '그냥 둔다', value: null }], sp);
        if (play && k.edu[s.date.y + ':' + play] == null) {
          k.edu[s.date.y + ':' + play] = 1; F.addBond(k, 6);
          if (play === 'play') { k.st.str = Math.min(90, k.st.str + 2); k.st.cha = Math.min(90, k.st.cha + 1); await UI.say('아빠 최고! 또 놀아 줘!', sp); }
          else { k.st.int = Math.min(90, k.st.int + 2); await UI.say('그래서 그 배는 어떻게 됐어? 또 들려줘!', sp); }
        } else if (play) await UI.say('올해는 벌써 많이 놀았어요. 이제 자야 해요.', w);
        continue;
      }
      if (age < (c.adult || 16)) {
        await UI.say(b >= 65 ? U.pick(['아버지, 저도 크면 아버지처럼 먼 바다로 나갈 거예요.', '아버지, 바다 이야기 해 주세요!', '오늘 선생님께 지도 읽는 법을 배웠어요.'])
          : b >= 30 ? U.pick(['아버지, 오셨어요?', '이번에는 오래 계세요?', '오늘 선생님께 지도 읽는 법을 배웠어요.'])
          : U.pick(['…아버지는 늘 바다에만 계시잖아요.', '어머니가 아버지 이야기를 해 주셨어요. 잘 기억이 안 나요.']), sp);
        var opts = [];
        if (!k.edu[s.date.y]) opts.push({ label: '가정교사를 붙인다 (금화 ' + U.num(c.eduCost || 800) + '닢)', value: 'edu' });
        if (!k.edu[s.date.y + ':story']) opts.push({ label: '항해 이야기를 들려준다', value: 'story' });
        if (age >= (c.apprenticeAge || 12)) opts.push({ label: '견습으로 배에 태운다', value: 'aboard' });
        opts.push({ label: '그냥 둔다', value: null });
        var act = await UI.ask(k.name + U.jx(k.name, '과/와') + ' 무엇을 할까?', opts, sp);
        if (act === 'story') {
          k.edu[s.date.y + ':story'] = 1; F.addBond(k, 5); k.st.int = Math.min(90, k.st.int + 1);
          await UI.say(b >= 30 ? '정말요? 그 바다 끝에 그런 게 있었어요? 저도 언젠가 꼭 가 볼래요!' : '……그런 일이 있었군요. (조금 귀를 기울인다)', sp);
        } else if (act === 'aboard') {
          if (b < 30) { await UI.say('…아버지 배에요? 저는… 아직 잘 모르겠어요.', sp); F.addBond(k, 2); continue; }
          var okA = await UI.confirm(k.name + U.jx(k.name, '을/를') + ' 견습 선원으로 함대에 태울까요?<br><small class="muted">함께 바다에 있는 동안 달마다 사이가 가까워지고 항해술·측량·검술 같은 특기를 익힙니다. 자택 「가족」에서 집에 남게 할 수 있습니다.</small>', '태운다', '그만둔다');
          if (okA) { k.aboard = true; F.addBond(k, 4); G.State.log(k.name + U.jx(k.name, '이/가') + ' 견습 선원이 되어 함대에 올랐다.'); await UI.say('정말요?! 아버지 배에 타는 거예요? 열심히 할게요!', sp); }
        } else if (act === 'edu') {
          var v = await UI.ask(k.name + '의 교육 (올해 한 가지, 금화 ' + U.num(c.eduCost || 800) + '닢)', [
            { label: '항해술을 가르친다', value: 'nav' }, { label: '검술을 가르친다', value: 'sword' },
            { label: '글과 말을 가르친다', value: 'lang' }, { label: '예법과 말솜씨를 가르친다', value: 'speech' },
            { label: '그만둔다', value: null }], sp);
          if (v) {
            var cost = c.eduCost || 800;
            if (p.gold < cost) { UI.toast('교육비(금화 ' + U.num(cost) + '닢)가 모자랍니다.', 'coin'); continue; }
            p.gold -= cost; k.edu[s.date.y] = v; F.addBond(k, 2);
            if (v === 'lang') { var li = U.pick([0, 1, 2, 3, 5]); k.lg[li] = Math.min(3, (k.lg[li] || 0) + 1); k.st.int = Math.min(90, k.st.int + 2); }
            else {
              k.sk[v] = Math.min(3, (k.sk[v] || 0) + 1);
              if (v === 'sword') k.st.str = Math.min(90, k.st.str + 2);
              if (v === 'nav') k.st.int = Math.min(90, k.st.int + 1);
              if (v === 'speech') k.st.cha = Math.min(90, k.st.cha + 2);
            }
            UI.toast(k.name + '에게 가정교사를 붙였다. (금화 ' + U.num(cost) + '닢)', 'book');
          }
        }
        continue;
      }
      // 어른
      await UI.say(b >= 65 ? U.pick(['아버지, 이제 저도 어엿한 어른입니다. 언제든 배를 맡겨 주십시오.', '아버지의 뒤를 잇는 것이 제 꿈입니다.'])
        : b >= 30 ? U.pick(['아버지, 다녀오셨습니까.', '아버지의 배를 맡게 된다면 부끄럽지 않게 하겠습니다.'])
        : U.pick(['…아버지는 저보다 바다를 더 사랑하시지요.', '뒤를 이으라 하시면 따르겠습니다. 그게 집안의 일이니까요.']), sp);
      if (!k.aboard && !k.edu[s.date.y + ':story']) {
        var ad = await UI.ask(k.name + U.jx(k.name, '과/와') + ' 무엇을 할까?', [{ label: '항해 이야기를 나눈다', value: 'story' }, { label: '배에 태워 함께 다닌다', value: 'aboard' }, { label: '그냥 둔다', value: null }], sp);
        if (ad === 'story') { k.edu[s.date.y + ':story'] = 1; F.addBond(k, 5); }
        else if (ad === 'aboard') { k.aboard = true; F.addBond(k, 3); UI.toast(k.name + U.jx(k.name, '이/가') + ' 함대에 올랐다.', 'ship'); }
      }
    }
  };

  /** 해산이 한 달 안으로 다가왔고 집에 있으면: 집에서 기다린다 (날이 지나 해산 → 출산 장면) */
  F.canAwait = function () { var p = S().player, pr = p.preg; return !!(p.wife && pr && pr.told && pr.due - S().day <= (cfg().nearDays || 30) && F.atHome()); };
  F.awaitBirth = async function () {
    var s = S(), p = s.player, pr = p.preg; if (!F.canAwait()) return;
    var n = Math.max(1, pr.due - s.day);
    var ok = await UI.confirm('아내의 해산까지 약 ' + n + '일 남았습니다. 집에서 곁을 지키며 기다릴까요?', '기다린다', '그만둔다');
    if (!ok) return;
    await UI.fade(function () { G.Game.passDays(n); });
    s.player.hp = 100; s.fleet.fatigue = 0;
    await F.homeVisit(true);
  };

  F.innEvent = async function (c) {
    var s = S(), kids = (s.player.kids || []).filter(function (k) { return !k.unnamed && F.kidAge(k) >= 3; });
    if (!kids.length || c.id !== s.player.home) return;
    if (U.chance(0.3)) { var k = U.pick(kids); await UI.say(U.pick(['앗, 아버지! 지금 여관 아주머니가 과자 주셨어요.', '아버지는 이 여관에 머문 적 있어요?']), G.HomeLife ? G.HomeLife.speaker(k) : { name: k.name, portrait: F.kidSpec(k), lang: 3 }); }
  };

  /** 뒤를 이을 수 있는 아이: 어른이 된 아들 (딸은 뒤를 잇지 않는다) */
  F.heirs = function () { var ad = cfg().adult || 16; return S().player.kids.filter(function (k) { return !k.unnamed && k.sex !== 'f' && F.kidAge(k) >= ad; }); };

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
      var ok = await UI.confirm('제독의 자리에서 물러나 은퇴하겠습니까?' + (F.heirs().length ? '<br>어른이 된 아들에게 뒤를 잇게 할 수 있습니다.' : '<br><span class="warn-text">뒤를 이을 아들(16세 이상)이 없으면 모험은 여기서 끝납니다.</span>'), '은퇴한다', '그만둔다');
      if (!ok) return;
    }
    var heirs = F.heirs();
    if (heirs.length) {
      var i = heirs.length > 1 ? await UI.choose('뒤를 이을 아들', heirs.map(function (k, j) { return { label: k.name, right: F.kidAge(k) + '세 · ' + F.bondWord(k), value: j }; }), { width: 420, cancel: false }) : 0;
      if (i == null) i = 0;
      return F.succeed(heirs[i]);
    }
    return G.Ending.show(forced ? 'death' : 'retire');
  };

  F.succeed = async function (k) {
    var s = S(), p = s.player;
    var old = p.name;
    G.State.log(old + U.j(old, '이/가').slice(old.length) + ' 은퇴하고 ' + k.name + U.j(k.name, '이/가').slice(k.name.length) + ' 뒤를 이었다.');
    // 아버지와의 사이가 물려받는 것을 정한다 — 가까울수록 명성(40~70%)과 특기(절반~3/4)를 많이, 견습으로 함께 다닌 해만큼 더
    var bd = F.bond(k), sea = k.sea || 0, c = cfg();
    var fameK = Math.min(0.8, 0.4 + 0.3 * bd / 100 + (sea >= 12 ? 0.05 : 0)), skK = bd >= 70 ? 0.75 : bd >= 40 ? 0.5 : 0.35;
    var said = bd >= 65 ? '「아버지께 배운 모든 것을 바다에서 증명하겠습니다.」' : bd >= 30 ? '「아버지의 이름에 부끄럽지 않게 하겠습니다.」' : '「…이제 제 방식대로 하겠습니다.」';
    await UI.alert(old + '의 모험은 여기서 막을 내린다.<br>그리고 그 뜻은 ' + k.name + '에게 이어진다...<br><br>' + k.name + ': ' + said +
      '<br><br><span class="muted">아버지와의 사이: ' + F.bondWord(k) + ' (' + bd + ')' + (sea ? ' · 견습 ' + sea + '달' : '') + ' — 명성의 ' + Math.round(fameK * 100) + '%, 특기의 ' + Math.round(skK * 100) + '%를 물려받는다.' +
      '<br>후원자들은 새 제독을 아직 잘 모른다 — 쌓아 온 신뢰는 30%만 이어진다.</span>', '세대 교체');
    var sk = {}; G.SKILLS.forEach(function (x) { sk[x.id] = Math.max(k.sk[x.id] || 0, Math.min(3, Math.floor((p.sk[x.id] || 0) * skK + (skK > 0.5 ? 0.5 : 0)))); });
    // 자라며 쌓은 능력 (F.newYear·가정교사). 옛 저장의 아이는 예전처럼 무작위
    var kst = k.st || { str: U.ri(50, 70), int: U.ri(45, 70), mar: U.ri(45, 70), cha: U.ri(45, 70) };
    function cl(v) { return Math.max(40, Math.min(85, Math.round(v))); }
    // 후원자들은 새 제독을 처음부터 다시 믿어야 한다 — 신뢰가 30%만 남는다
    if (G.Succession) G.Succession.heir();
    var lg = p.lg.map(function (v, i) { return Math.max(k.lg[i] || 0, i === R.nativeLang(p.nation) ? 3 : Math.floor(v / 2)); });
    s.player = {
      name: k.name, nation: p.nation, job: p.job, born: k.born, st: { str: cl(kst.str), int: cl(kst.int), mar: cl(kst.mar), cha: cl(kst.cha) },
      luck: U.ri(30, 70), sk: sk, lg: lg, fame: Math.round(p.fame * fameK), fameBy: p.fameBy ? U.clone(p.fameBy) : undefined,   // 갈래의 비율은 그대로 (G.Fame.sync가 줄어든 합에 맞춘다)
      notoriety: Math.round(p.notoriety * 0.3), gold: p.gold, bank: p.bank,
      items: p.items, equip: p.equip, hp: 100, home: p.home, wife: null, kids: [], generation: (p.generation || 1) + 1, jailed: 0,
      portrait: F.kidSpec(k)
    };
    s.player.portrait.age = 'young';
    s.contract = null;
    // 선원이 모두 쓰러져 뒤를 이었다면 배는 주인 없이 떠돈다 — 새 제독은 고향에서 작은 배 한 척으로 다시 시작한다
    // (예전에는 선원 0명인 함대를 그대로 물려받아 이튿날 끝나거나, 뭍에서는 움직일 수 없게 되었다)
    if (!s.fleet.ships.length || s.fleet.crew <= 0) {
      s.fleet = R.restartFleet(s.fleet.ships[0] && s.fleet.ships[0].type);
      delete s.landReturn;
      UI.toast(k.name + '의 항해가 시작된다.', 'ship', 4000);
      UI.fade(function () { G.Game.go('city', { cityId: s.player.home }); });
      return;
    }
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
