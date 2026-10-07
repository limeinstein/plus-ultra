/* 술집: 술, 한턱, 정보, 여급, 손님(동료·주정뱅이·결투·라이벌), 포카, 부하편성 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art, C = G.Scenes.city;
  function S() { return G.Game.state; }
  function roleName(m) { return R.roleName(m); }
  var T = { title: '술집', icon: 'mug', paint: 'tavern', exitLabel: '술집을 나온다' };
  C.B.tavern = T;
  G.MAX_MATES = Infinity;   // 부하는 몇 명이든 들일 수 있다 (급료가 버거우면 경리·부관이 말린다 — G.Cabins.wageWarning). 옛 코드가 보던 값이라 남겨 둔다

  function master() { return C.npc('tavernkeeper', '술집 주인'); }
  function maidOf(c) { return G.MAIDS.filter(function (m) { return m.city === c.id; })[0] || null; }
  T.maidOf = maidOf;
  T.maidSpeaker = function (m) { var c = G.CITY_DATA[m.city]; return { name: m.name, rigId: 'maid:' + m.id, portrait: A.maidSpec(m), half: G.Img.chain.maidHalf(m.id, c), lang: R.lang(c.lang), li: c.lang }; };
  T.playerSpeaker = function () { var p = S().player; return { name: p.name, rigId: 'player', portrait: p.portrait, half: G.Img.chain.heroHalf() }; };
  /** 마주 보는 대화: 왼쪽 제독 · 오른쪽 상대. 두 사람 다 무릎상(half)이 있으면 서 있는 모습으로 크게 */
  T.duo = function (who, emotion, asking) {
    var o = {}, k; for (k in who) o[k] = who[k];
    if (!o.half && o.portrait && A.portraitKeys) o.half = G.Img.chain.halfOf(A.portraitKeys(o.portrait));
    o.layout = 'duo'; o.side = 'right'; o.partner = T.playerSpeaker(); o.emotion = emotion || 'neutral';
    if (asking) o.choiceSide = 'left';
    return o;
  };
  /** 이름 있는 여급이 없는 도시의 그 지역 여급 */
  T.servantSpeaker = function (c) {
    return { name: '여급', lang: R.lang(c.lang), li: c.lang,
      portrait: A.withImg(A.npcSpec('svc' + c.id, 'maid', G.Img.folkStyle(c), 'f'), G.Img.chain.maidCity(c)) };
  };
  T.servant = async function (c) {
    var who = T.servantSpeaker(c);
    var d = U.chance(0.45) ? T.rumour(c, { stack: true }) : null;
    if (d) {
      var known = G.Disc.hasHint(d.id);
      await UI.say((known ? '그 이야기라면 여기 손님들도 하더군요. ' : '손님들이 이런 이야기를 하더군요. ') + d.hint, who);
      G.Disc.noteHint(d, 'tavern:' + c.id);
      return;
    }
    await UI.say(U.pick(['어서 오세요. 한잔 하고 가세요.', '먼 바다에서 오셨나 보네요.',
      '이 동네 술은 독하답니다. 천천히 드세요.', '오늘은 손님이 많네요. 자리 잡으시죠.',
      '뱃사람 이야기는 언제 들어도 재미있어요.']), who);
  };
  T.preload = function (c) {
    var m = maidOf(c);
    return m ? [G.Img.chain.maidHalf(m.id, c), G.Img.chain.maid(m.id, c)]
             : [G.Img.chain.maidCityHalf(c), G.Img.chain.maidCity(c)];
  };
  /** 술집 안에 여급이 서 있게 한다 (그림이 있을 때만). 눌러도 말을 걸 수 있다 */
  T.panel = function (c) {
    if (!G.Img || !G.Img.count()) return null;
    var m = maidOf(c);
    var chain = m ? G.Img.chain.maidHalf(m.id, c) : G.Img.chain.maidCityHalf(c);
    var key = G.Img.pick(chain); if (!key) return null;
    var wrap = U.el('div', 'tavern-maid');
    var fig = U.el('div', 'fig'); wrap.appendChild(fig);
    if (G.PortraitRig) G.PortraitRig.mount(fig, { chain: chain, profile: 'half', side: 'right', state: 'idle', alt: m ? m.name : '여급' });
    else {
      var im = new Image(); im.alt = m ? m.name : '여급'; im.decoding = 'async'; im.src = G.Img.src(key); fig.appendChild(im);
    }
    wrap.appendChild(U.el('div', 'tag', m ? '여급 ' + U.esc(m.name) : '여급'));
    wrap.title = (m ? m.name : '여급') + '에게 말을 건다';
    wrap.onclick = function () { C.run(function () { return m ? T.maid(c, m) : T.servant(c); }); };
    return wrap;
  };

  T.enter = async function (c) {
    var cur = C.current(); cur.looked = false; cur.drinks = 0; cur.asked = 0;
    var mn = G.Monsoon ? G.Monsoon.portNote(c) : null;
    await C.say(master(), C.hail(c, 'tavern', ['어서 오게! 목을 축이고 가게.', '어서 오게. 오늘도 손님이 많군.', '뱃사람이라면 언제든 환영일세.']) + (mn ? '\f' + (mn.phase === 'sw' ? '요즘은 남서 계절풍이 한창이라 ' : '요즘은 북동 계절풍이라 ') + mn.zone.tip[mn.phase] + '더군. ' + mn.next.date.m + '월 ' + mn.next.date.d + '일 무렵이면 바람이 뒤집힐 걸세.' : ''));
    // 이 도시에 머무는 경쟁 탐험가를 처음 보면 주인이 귀띔한다 (콜론 — 리스본)
    var rv = T.rivalsStaying(c).filter(function (r) { return !r.atSea && !S().flags['seenRival_' + r.name]; })[0];
    if (rv) { S().flags['seenRival_' + rv.name] = 1; if (G.RIVAL_STAYS[rv.name].keeper) await C.say(master(), G.RIVAL_STAYS[rv.name].keeper); return; }
    if (U.chance(0.45)) await T.encounter(c);
  };
  T.sub = function (c) { var m = maidOf(c); return m ? '여급 ' + U.j(m.name, '이/가') + ' 일하고 있다' : '뱃사람들로 북적인다'; };
  T.menu = function (c) {
    var cur = C.current(), m = maidOf(c), cand = T.hireList(c);   // 머무는 경쟁 탐험가(콜론)도 명부에 — 고용은 안 된다
    return [
      { label: '술을 마신다', icon: 'mug', onClick: function () { return T.drink(c); } },
      { label: '한턱 낸다', icon: 'coin', onClick: function () { return T.treat(c); } },
      G.Econ ? { label: '장사 소문을 듣는다', icon: 'scales', sub: T.rumorSub(c), dim: T.rumorLeft(c) <= 0, onClick: function () { return T.rumor(c); } } : null,
      (function () { var k = S().contract; return { label: '정보를 듣는다', icon: 'scroll', sub: k ? '계약: ' + G.Errand.name(k) : '계약한 일이 없다', dim: !k, onClick: function () { return T.info(c); } }; })(),
      (function () { var tg = T.targets(c); return tg.length ? { label: '목표를 수소문한다', icon: 'map', sub: tg.length + '곳', onClick: function () { return T.askTarget(c); } } : null; })(),
      { label: '손님을 둘러본다', icon: 'eye', dim: cur && cur.looked, onClick: function () { return T.look(c); } },
      { label: '선원을 모은다', icon: 'people', sub: T.crewSub(), onClick: function () { return T.crew(c); } },
      { label: '항해사를 찾는다', icon: 'people', sub: cand.length ? cand.length + '명' : '없다', dim: !cand.length, onClick: function () { return T.hire(c); } },
      m ? { label: '여급과 이야기', icon: 'heart', sub: m.name, onClick: function () { return T.maid(c, m); } }
        : (G.Img && G.Img.pick(G.Img.chain.maidCity(c)) ? { label: '여급과 이야기', icon: 'heart', onClick: function () { return T.servant(c); } } : null),
      { label: '포카를 권한다', icon: 'dice', onClick: function () { return G.Games.poker(c); } },
      { label: '부하편성', icon: 'people', sub: S().mates.length + '명', onClick: function () { return T.organize(); } },
      G.MateTalk ? G.MateTalk.menuItem(c) : null
    ];
  };

  // ---------------------------------------------------------------- 선원 모집 (예전 항구의 「선원 수 조정」)
  /* 뱃사람은 술집에 모인다. 탐험대로 뭍길을 걸어 들어온 내륙 도시에서도 선원을 모아 탐험대를 채울 수 있다 (js/city/harbor.js H.crew) */
  T.crewSub = function () {
    var s = S(), lr = s.loc && s.loc.via === 'land' ? s.landReturn : null;
    return (lr ? '탐험대 ' + (lr.party || 0) + '명 · ' : '') + s.fleet.crew + '명 / ' + R.crewMin() + '~' + R.crewMax();
  };
  T.crew = async function (c) {
    var s = S(), lr = s.loc && s.loc.via === 'land' ? s.landReturn : null;
    if (C.langLv(c) === 0 && !lr) await C.say(master(), '말은 잘 안 통해도 일자리 찾는 뱃사람은 어디에나 있지. 손짓으로 불러 보게.');
    else await C.say(master(), lr ? U.pick(['내륙까지 걸어 들어온 탐험대라고? 길 떠날 사람이라면 이 술집에 몇 있지. 짐꾼 노릇도 마다하지 않을 걸세.', '뭍길을 따라 갈 사람을 찾나? 일거리 없는 떠돌이들이 저쪽 구석에 모여 있네.'])
      : U.pick(['배를 탈 사람을 찾나? 일거리를 기다리는 뱃사람들이 늘 여기 모여 있지.', '선원이라면 저기 모여 있는 친구들한테 말해 보게. 한 잔씩 사면 금방 모일 걸세.']));
    await C.B.harbor.crew(c);
  };

  // ---------------------------------------------------------------- 장사 소문 (살아 있는 경제 — js/systems/economy.js)
  /* 술 한 잔 값을 내면 주인이 요즘 장사꾼들 사이에 도는 이야기를 들려준다 — 「어느 도시에서 무슨 까닭으로 무엇이 모자란다/넘친다」.
     가까운 곳·아직 모르는 사건부터, 일어나기 전의 조짐도. 하루에 rumorAsk번 (G.BALANCE.econ) */
  function rumorUsed(c) { var mk = R.market(c.id), r = mk.rum; return r && r.day === S().day ? r.n : 0; }
  T.rumorLeft = function (c) { return ((G.BALANCE.econ || {}).rumorAsk || 2) - rumorUsed(c); };
  T.rumorSub = function (c) { var k = G.Econ.knownList().length; return T.rumorLeft(c) <= 0 ? '오늘은 다 들었다' : '술 한 잔 ' + (4 + c.size * 2) + '닢' + (k ? ' · 아는 소식 ' + k : ''); };
  T.rumor = async function (c) {
    var s = S(), m = master(), K = G.BALANCE.econ || {}, price = 4 + c.size * 2;
    if (C.langLv(c) === 0) { await C.say(m, '……?'); await C.mate('말이 통하지 않으니 장사 이야기는 들을 수가 없군요.'); return; }
    if (T.rumorLeft(c) <= 0) { await C.say(m, '오늘 들은 이야기는 그게 다일세. 며칠 지나면 새 배들이 새 소식을 싣고 오겠지.'); return; }
    if (s.player.gold < price) { await C.say(m, '술 한 잔도 못 시키는 손님한테 해 줄 이야기는 없네.'); return; }
    s.player.gold -= price;
    var mk = R.market(c.id); mk.rum = { day: s.day, n: rumorUsed(c) + 1 };
    var list = G.Econ.rumors(c, K.rumorN || 2);
    if (!list.length) {
      // 사건이 없으면: 이 고장 특산물이 어디서 금값인지
      var sp = c.goods.filter(function (id) { return G.GOOD[id] && !R.isRelay(c, id); }).map(function (id) { var fr = C.B.trade.farRegions(id); return { id: id, r: fr[0].r, x: fr[0].m / 0.62 }; }).sort(function (a, b) { return b.x - a.x; })[0];
      await C.say(m, '요즘은 바다도 장터도 조용하네.' + (sp && sp.x >= 1.5 ? '\f그래도 장사꾼이라면 알아 두게. 여기서 흔한 ' + U.eul(G.GOOD[sp.id].name) + ' ' + G.REGIONS[sp.r] + '에 가져가면 여기 값의 ' + sp.x.toFixed(1) + '배는 받는다더군.' : ''));
      G.Game.refreshHud(); return;
    }
    var open = U.pick(['자, 한 잔 받게. 요즘 배들이 실어 오는 이야기를 들려주지.', '장사꾼들이 이 자리에서 떠드는 걸 들었네만—', '뱃사람들 입이 가볍더군. 들어 보게.']);
    await C.say(m, open + '\f' + list.map(function (e) { G.Econ.learn(e); return G.Econ.say(e, c); }).join('\f'));
    UI.toast('시장 소식 ' + list.length + '가지를 수첩(교역)에 적었다.', 'scales');
    G.Game.refreshHud();
  };

  // ---------------------------------------------------------------- drink / treat
  T.drink = async function (c) {
    var s = S(), cur = C.current(), price = 4 + c.size * 2;
    if (s.player.gold < price) { await C.say(master(), '공짜로 마시게 할 술은 없다!'); return; }
    s.player.gold -= price; cur.drinks++;
    s.fleet.fatigue = Math.max(0, s.fleet.fatigue - 4);
    if (cur.drinks >= 4 && U.chance(0.25 * (cur.drinks - 3) * (1 - R.stat('str') / 200))) {
      await UI.say('기분이 나쁘다......눈이 도는군~ ~우웩~', {});
      await C.say(master(), '손님, 괜찮습니까! 얼굴이 새파랍니다, 손님, 손님!');
      await UI.fade(function () { G.Game.passDays(1); });
      if (U.chance(0.35)) { var lost = Math.floor(s.player.gold * U.rf(0.1, 0.3)); s.player.gold -= lost; await UI.say('정신을 잃었었군... 아무래도 여관 같군.\n돈을 도둑맞았다!! (금화 ' + U.num(lost) + '닢)', {}); }
      else if (U.chance(0.2)) { var got = U.ri(50, 400); s.player.gold += got; await UI.say('정신이 드는군..... 기억에 없는 돈을 쥐고 있었군! (금화 ' + got + '닢)', {}); }
      else await C.mate('제독! 이봐요, 제독! 괜찮습니까? ...어젯밤엔 좀 과하셨습니다.');
      return C.leave();
    }
    await UI.say(U.pick(['꽤 맛있는 술이다!', '기분 좋군!', '맛있다! 살 것 같다.', '몸이 따뜻해졌다!']) + (cur.drinks === 3 ? '\n(술을 마시되, 너무 마시지는 말게.)' : ''), {});
    // 술잔을 나누다 보면 주인이 요즘 도는 이야기를 꺼낸다 (한 번 들르는 동안 한 번) — 큰 항로 이야기(리스본·세비야), 이 고장 동물
    if (cur.chatted || C.langLv(c) === 0) return;
    var lead = G.Frontier && G.Frontier.takeLead ? G.Frontier.takeLead(c.id, 'tavern') : null;
    if (lead) { cur.chatted = true; await C.say(master(), lead.text); UI.toast('단서를 얻었다: 「' + lead.disc.name + '」', 'scroll'); return; }
    if (G.Animals && await G.Animals.tavern(c, master())) cur.chatted = true;
  };
  T.treat = async function (c) {
    var s = S(), cost = Math.max(20, Math.round(s.fleet.crew * (1.5 + c.size * 0.5)));
    var ok = await UI.confirm('선원과 손님들에게 한턱 내면 금화 ' + U.num(cost) + '닢이 듭니다. 한턱 내겠습니까?', '한턱 낸다', '그만둔다');
    if (!ok) return;
    if (s.player.gold < cost) { await C.mate('제독, 안됐지만 빈털터리입니다!'); return; }
    s.player.gold -= cost;
    await UI.say('여~어, 주인! 여기에 있는 자들에게 한잔씩 돌리게.', { name: s.player.name, portrait: s.player.portrait });
    await C.mate(U.pick(['역시 제독! 그럼 사양하지 않겠습니다.', '제독 만세! 모두 잔을 들어라!']));
    s.fleet.discipline = Math.min(100, s.fleet.discipline + 12);
    s.fleet.fatigue = Math.max(0, s.fleet.fatigue - 15);
    G.Fame.add('so', 1);
    UI.toast('선원들의 사기가 올랐다. (규율 +12)', 'mug');
    C.current().looked = false;
    if (U.chance(0.6)) await T.encounter(c, true);
  };

  // ---------------------------------------------------------------- information (rumours about discoveries)
  /* 정보: 후원자와 계약을 맺었을 때만 — 그 계약(발견·해도 작성·물건 조달·세계일주)에 관한 이야기를 들려준다.
     무엇을 맡았는지 모르면 술집 주인도 들려줄 말이 없다. (가벼운 소문은 손님·동료·후원자에게서 따로 듣는다) */
  T.info = async function (c) {
    var s = S(), cur = C.current(), m = master(), k = s.contract;
    if (C.langLv(c) === 0) { await C.say(m, '……?'); await C.mate('말이 통하지 않는 것만은 어쩔 수가 없군요.'); return; }
    if (!k) { await C.say(m, '정보라... 자네가 무슨 일을 맡았는지 알아야 그에 맞는 이야기를 해 주지. 먼저 후원자와 계약을 맺고 오게.'); return; }
    if (cur.asked >= 2) { await C.say(m, '정보? 오늘은 더 이상 그런 것은 없네.'); return; }
    var price = 20 + c.size * 15;
    var v = await C.ask(m, '「' + G.Errand.name(k) + '」 일이라고? 자, 우리 가게 술을 마시면 아는 대로 가르쳐 주지. 한 잔에 금화 ' + price + '닢이네.', [{ label: '술을 산다', value: 1 }, { label: '그만둔다', value: 0 }]);
    if (!v) return;
    if (s.player.gold < price) { await C.say(m, '돈 먼저 지불하게.'); return; }
    s.player.gold -= price; cur.asked++;
    await C.say(m, T.contractInfo(c, k));
  };
  /** 계약한 일에 대해 이 도시 술집 주인이 아는 이야기 (단서·해도 표시도 함께 남긴다) */
  T.contractInfo = function (c, k) {
    var s = S(), t = k.task || {}, src = U.pick(['확실히 ', '그러고 보니 ', '이건 어떤 선원한테서 들은 이야기인데, ']);
    if (k.circ) {
      var left = ['capegood', 'malacca', 'newstrait'].filter(function (id) { return G.DISC[id] && !G.Disc.foundByMe(id); }).map(function (id) { return '「' + G.DISC[id].name + '」'; });
      return left.length ? '세계를 한 바퀴 돈다고? 배짱 좋군. ' + left.join('·') + U.jx(left[left.length - 1], '을/를') + ' 지나야 한 바퀴가 된다더군. 남쪽 바다는 폭풍이 거세니 배를 단단히 손보고 가게.'
        : '이제 남은 건 처음 떠난 항구로 무사히 돌아가는 것뿐이네. 여기까지 왔으면 거의 다 왔군.';
    }
    if (t.kind === 'survey') {
      var dist = G.Geo.dist(c.lon, c.lat, t.lon, t.lat), dir = U.dirName(Math.atan2(t.lat - c.lat, G.Geo.wrapLon(t.lon - c.lon)));
      return dist < 1 ? '그 바다라면 바로 이 앞바다일세. 항구를 나서서 둘러보면 되겠군.'
        : '그 바다라면 여기서 ' + dir + '쪽으로 뱃길 ' + Math.max(1, Math.round(dist / 0.8)) + '일쯤이네. 그 언저리를 한 바퀴 돌며 물길을 적어 오면 될 걸세.';
    }
    if (t.kind === 'procure') {
      var g = G.GOOD[t.good], at = G.CITY_DATA[t.at];
      return src + (g ? g.name : '그 물건') + U.jx(g ? g.name : '물건', '은/는') + ' ' + (t.whereName || (at ? at.name : '먼 곳')) + '에서 많이 판다더군.' + (at ? ' 가까운 곳으로는 ' + at.name + U.jx(at.name, '이/가') + ' 낫겠지.' : '') + ' ' + t.qty + '통이면 배 한 척 짐칸은 비워 두게.';
    }
    var d = G.DISC[k.disc];
    if (!d) return '그런 이야기는 들어 본 적이 없네.';
    G.Disc.addHint(d.id, 'contract:' + k.sponsor);
    if (d.how === 'city') {
      var cc = G.CITY_DATA[d.city], here = cc.id === c.id ? '바로 이 도시일세. ' : cc.name + '에 가면 ';
      if (d.by && G.Disc.artistAround && G.Disc.artistAround(d)) { var am = G.MATE[d.by]; return src + d.hint + ' 그걸 만든 ' + am.name + U.jx(am.name, '을/를') + ' 만나 이야기해 보게. 요즘 어디서 지내는지는 술집마다 소문이 다르더군.'; }
      if (G.Disc.isBuilding && G.Disc.isBuilding(d)) return src + d.hint + ' ' + here + '거리를 걷다 그 건물 앞에 가서 직접 보게.';
      return src + d.hint + ' ' + here + '건물들을 하나하나 둘러보면 눈에 띌 걸세.';
    }
    if (d.how === 'trade' || d.how === 'special' || d.lon == null) return src + d.hint;
    T.markRumour(c, d);
    return src + d.hint + ' ' + T.whereText(c, d);
  };
  // ---------------------------------------------------------------- 현지 소문: 이미 아는 목표의 방향을 좁힌다
  // 책·소문이 '무엇이 있는가'를 알려 준다면, 그 고장 사람들은 '어느 쪽으로 며칠'을 알려 준다 (대항해시대 3의 현지 소문)
  var ASK_RANGE = 24;
  /** 이 도시에서 물어볼 만한 목표: 단서가 있거나 계약한, 아직 못 찾은 곳 중 가까운 것 */
  T.targets = function (c) {
    var s = S(), ids = Object.keys(s.hints);
    if (s.contract && !s.contract.circ && s.contract.disc && ids.indexOf(s.contract.disc) < 0) ids.push(s.contract.disc);
    var mk = s.marks || {};
    return ids.map(function (id) { return G.DISC[id]; }).filter(function (d) {
      if (!d || G.Disc.foundByMe(d.id) || d.how === 'trade' || d.how === 'city' || d.id === 'circum') return false;
      if (d.how === 'special' && !(d.lat || d.lon)) return false;
      if (mk[d.id] && mk[d.id].u != null && mk[d.id].u <= 0.35) return false;      // 이미 충분히 좁혔다
      return G.Geo.dist(c.lon, c.lat, d.lon, d.lat) <= ASK_RANGE;
    }).sort(function (a, b) {
      var ka = s.contract && s.contract.disc === a.id ? 0 : 1, kb = s.contract && s.contract.disc === b.id ? 0 : 1;
      return ka - kb || G.Geo.dist(c.lon, c.lat, a.lon, a.lat) - G.Geo.dist(c.lon, c.lat, b.lon, b.lat);
    });
  };
  /** 이 도시에서 본 그곳의 방향·거리 (뭍길·뱃길 어림) */
  T.whereText = function (c, d) {
    var dist = G.Geo.dist(c.lon, c.lat, d.lon, d.lat);
    var dir = U.dirName(Math.atan2(d.lat - c.lat, G.Geo.wrapLon(d.lon - c.lon)));
    var land = d.how === 'land', where;
    if (dist < 0.8) where = '바로 이 근처라네. 성문을 나서면 금방이지.';
    else if (!c.port && dist > 6) where = dir + '쪽으로 아주 먼 곳일세. 바닷가 항구로 나가 배를 타고 ' + Math.max(1, Math.round(dist / 0.8)) + '일은 가야 할 걸세.';
    else if (land && (dist <= 2.5 || !c.port)) where = '여기서 ' + dir + '쪽으로 뭍길로 ' + Math.max(1, Math.round(dist / 0.3)) + '일쯤 가면 있다고들 하네.';
    else {
      // 먼 곳은 뱃길로 가서 해안에 오르는 길을 일러 준다 (원정 계획과 같은 어림셈)
      var dk = c.dock || [c.lat, c.lon], pl = G.Plan ? G.Plan.expedition([dk[1], dk[0]], d, null) : null;
      var sea = pl ? pl.out : Math.max(1, Math.round(dist / 0.8));
      where = dir + '쪽이지. 뱃길로 ' + sea + '일쯤 가서' + (land ? ' 해안에 오른 뒤 뭍길로 ' + Math.max(1, pl ? pl.walk : 2) + '일쯤 걸어 들어가면 된다더군.' : ' 그 바다에 닿으면 알아볼 수 있다더군.');
    }
    var extra = land ? (G.Geo.terrain(d.lon, d.lat) === 'desert' ? ' 물을 넉넉히 챙기게. 모래뿐인 길이라더군.' : G.Geo.terrain(d.lon, d.lat) === 'mountain' ? ' 산길이 험하다더군.' : G.Geo.terrain(d.lon, d.lat) === 'jungle' ? ' 밀림이라 길 잃기 십상이지.' : '') : '';
    return where + extra;
  };
  /** 해도에 그 방향을 표시한다 (이미 더 좁혀 두었으면 그대로) */
  T.markRumour = function (c, d) {
    var s = S(), dist = G.Geo.dist(c.lon, c.lat, d.lon, d.lat);
    var mk = s.marks || (s.marks = {}), u = U.clamp(dist * 0.15, 0.3, 1.2);
    if (!mk[d.id] || mk[d.id].u == null || mk[d.id].u > u) {
      mk[d.id] = { t: s.day, mode: 'rumor', u: u };
      if (G.Explore) G.Explore.ver++;
      UI.toast('해도에 「' + d.name + '」 쪽을 표시해 두었다.', 'map', 4000);
      return true;
    }
    return false;
  };
  T.askTarget = async function (c) {
    var s = S(), cur = C.current(), m = master();
    if (C.langLv(c) === 0) { await C.say(m, '……?'); await C.mate('말이 통하지 않으니 물어볼 수가 없군요.'); return; }
    var list = T.targets(c);
    if (!list.length) { await C.say(m, '그런 곳은 이 근처에서 들어 본 적이 없네.'); return; }
    var d = list[0];
    if (list.length > 1) {
      var i = await UI.choose('어느 곳을 물어볼까?', list.map(function (x, k) {
        var dist = G.Geo.dist(c.lon, c.lat, x.lon, x.lat);
        return { label: x.name + (s.contract && s.contract.disc === x.id ? ' ★계약' : ''), right: G.DISC_CATS[x.cat] + ' · ' + (dist < 8 ? '이 근처' : '조금 먼 곳'), value: k, icon: 'map', desc: x.hint };
      }), { width: 720 });
      if (i == null) return;
      d = list[i];
    }
    var price = 20 + c.size * 15;
    var v = await C.ask(m, '「' + d.name + '」에 대해서라? 한 잔 사면 아는 대로 말해 주지. 금화 ' + price + '닢이네.', [{ label: '술을 산다', value: 1 }, { label: '그만둔다', value: 0 }]);
    if (!v) return;
    if (s.player.gold < price) { await C.say(m, '돈 먼저 지불하게.'); return; }
    s.player.gold -= price;
    await C.say(m, '「' + d.name + '」 말인가? ' + T.whereText(c, d));
    T.markRumour(c, d);
    if (cur) cur.asked = (cur.asked || 0) + 1;
  };

  /** 아직 모르는 발견물 하나를 소문으로 고른다. 이야기 갈래(talk) 가운데 자연·생물·민족·근세 건물만 (교역품·보물은 교역소, 옛 것은 도서관).
      개척 단계(G.Frontier)가 닿은 것만,
      가까운 지역부터 — 명성이 오르면 먼 곳 이야기도. 맛보기·관문처럼 온 세상이 떠드는 이야기는 멀어도 돈다 */
  T.rumour = function (c, opts) {
    var s = S(), fame = s.player.fame, src = 'tavern:' + c.id, stack = !!(opts && opts.stack);   // stack: 이미 아는 이야기도 다른 술집에서 들으면 단서가 겹친다
    var maxD = fame < 300 ? 1 : fame < 1500 ? 2 : fame < 3500 ? 3 : 5;
    var cand = G.DISCOVERIES.filter(function (d) {
      if (d.id === 'circum' || d.bookOnly || G.Disc.foundByMe(d.id) || (s.hints[d.id] && !(stack && G.Disc.canStack(d.id, src)))) return false;
      if (!G.Disc.available(d)) return false;
      var hot = G.Frontier && G.Frontier.hot(d);
      if (!G.Disc.clueOk(d, 'tavern')) return false;                   // 옛 유적·전설·지리는 도서관 사료로 (js/data/clues.js)
      if ((d.how === 'trade' || d.cat === 'treasure') && !hot) return false;   // 교역품·보물 이야기는 교역소 주인이 한다
      if (d.id === 'mu' || d.id === 'antpeople') return fame > 5000;
      return hot || G.REGION_DIST[c.region][d.reg] <= maxD;
    });
    if (!cand.length) return null;
    return U.weighted(cand, function (d) {
      var w = 1 / (1 + G.REGION_DIST[c.region][d.reg]) * (d.pw <= 2 ? 2 : 1) * G.Disc.rumourW(d, src);
      return G.Frontier && G.Frontier.hot(d) ? w * 3 + 0.4 : w;
    });
  };

  // ---------------------------------------------------------------- random guests
  T.look = async function (c) {
    var cur = C.current();
    if (cur.looked) { UI.toast('눈에 띄는 손님은 없다.', 'eye'); return; }
    cur.looked = true;
    await T.encounter(c, true);
  };
  T.candidates = function (c) {
    var s = S(), y = s.date.y;
    // 항해사는 저마다 한 도시에 머물다 한 달에 한 번 옮겨 다닌다(G.MateMove) — 지금 이 도시에 있는 사람만
    var pool = G.MateMove ? G.MateMove.here(c.id) : G.MATES.filter(function (m) { return m.reg.indexOf(c.region) >= 0; });
    return pool.filter(function (m) {
      if (s.mates.some(function (x) { return x.id === m.id; }) || s.flags['gone_' + m.id]) return false;
      // 해가 맞고, 그 사람이 활약한 바닷길이 알려진 뒤에야 나타난다
      return G.Frontier ? G.Frontier.mateReady(m, y) : (y >= m.y[0] && y <= m.y[1]);
    });
  };
  /** 술집 주인·여관 안주인의 귀띔: 근처 도시에 머문다는 항해사 (많아야 둘). 없으면 빈 글 */
  T.mateHint = function (c) {
    if (!G.MateMove) return '';
    var y = S().date.y;
    var near = G.MateMove.nearby(c, function (m) { return G.Frontier ? G.Frontier.mateReady(m, y) : (y >= m.y[0] && y <= m.y[1]); }).slice(0, 2);
    if (!near.length) return '';
    var by = [];   // 같은 도시면 한데 묶는다
    near.forEach(function (n) { var g = by.filter(function (b) { return b.c === n.c; })[0]; if (g) g.names.push(n.m.name); else by.push({ c: n.c, names: [n.m.name] }); });
    return '\n' + by.map(function (b) { var nm = b.names.join('·'); return U.j(nm, '은/는') + ' 요즘 ' + b.c.name + '에 머문다더군'; }).join('. ') + '. 사람은 늘 옮겨 다니니, 한 달쯤 지나면 또 모르지.';
  };
  T.encounter = async function (c, force) {
    var cur = C.current(); cur.looked = true;
    var r = U.rand();
    var cands = T.candidates(c);
    if (cands.length && r < 0.45) return T.meetMate(c, U.pick(cands));
    if (r < 0.62) return T.drinker(c);
    if (r < 0.77) return T.challenger(c);
    if (r < 0.9 && T.rivalHere(c)) return T.rival(c);
    if (force) { UI.toast('오늘은 눈에 띄는 손님이 없다.', 'eye'); }
  };

  T.meetMate = async function (c, m) {
    var v = await UI.ask('[' + m.name + ']' + U.jx(m.name, '이/가') + ' 술을 마시고 있다.', [{ label: '말을 건다', value: 1 }, { label: '무시한다', value: 0 }], {});
    if (!v) return;
    await T.artWorks(m);
    await T.talkMate(c, m);
  };
  /** 그 시대 사람의 개인 작품: 그린(만든) 사람을 만나 이야기하면 그 작품을 발견한다 (G.Disc.checkPerson) */
  var ART_LINE = {
    monalisa: '피렌체의 한 부인을 그리고 있습니다. 벌써 몇 해째 붓을 놓지 못하고 있지요. 저 미소를 아직 다 옮기지 못했거든요.',
    lastsupper: '밀라노 수도원 식당 벽에 「너희 가운데 하나가 나를 팔리라」 하는 순간을 그렸습니다. 열두 사람의 얼굴이 저마다 다르게 놀라지요.',
    creation: '교황 성하께서 시스티나 예배당 천장을 맡기셨습니다. 날마다 비계 위에 누워 창세기를 그리느라 목이 굳어 버렸소.',
    david: '모두 버린 대리석 덩어리 속에 거인을 쓰러뜨릴 소년이 있었소. 나는 그를 꺼내 주었을 뿐이오.',
    birthvenus: '메디치 가문을 위해 바다에서 태어나는 여신을 그렸습니다. 조개껍데기를 타고 바람에 실려 뭍에 닿는 순간이지요.',
    pirireis: '내가 모은 지도들을 모두 겹쳐 한 장에 그렸소. 제노바 사람 콜롬보의 지도도 들어 있지. 서쪽 바다 건너 새 땅까지.',
    rakubowl: '물레를 쓰지 않고 손으로 빚게 했소. 검고 투박하지만, 손에 쥐면 차 한 잔이 온 세상이 되지.',
    tsukumonasu: '가지 모양의 작은 차통이오. 성 하나와 바꾸겠다는 사람도 있었지만, 다도의 마음은 값으로 매길 수 없소.',
    shahnameh: '샤 타흐마스프의 『샤나메』에 그림을 그려 넣는 일을 이끌고 있소. 영웅 로스탐의 이야기가 이백 장이 넘는 그림이 될 것이오.'
  };
  T.artWorks = async function (m) {
    if (!G.Disc || !G.Disc.checkPerson) return;
    var ds = G.Disc.checkPerson(m.id);
    for (var i = 0; i < ds.length; i++) {
      await UI.say(ART_LINE[ds[i].id] || ('제가 만든 「' + ds[i].name + '」를 보여 드리지요.'), T.mateSpeaker(m));
      await G.Disc.find(ds[i], 'city');
    }
  };

  /** 서로 아는 말 가운데 가장 잘 통하는 것 — {lv:0~3, li:언어번호} */
  function comm(m) {
    var best = { lv: 0, li: -1 };
    for (var k in m.lg) { var lv = Math.min(m.lg[k], R.lang(+k)); if (lv > best.lv) best = { lv: lv, li: +k }; }
    return best;
  }
  T.comm = comm;
  T.mateSpeaker = function (m) { var cm = comm(m), li = cm.li; if (li < 0) for (var k in m.lg) { if (li < 0 || m.lg[k] > m.lg[li]) li = +k; } return { name: m.name, portrait: G.Scenes.mateSpec(m.id), half: G.Img.chain.mateHalf(m.id), lang: cm.lv, li: li >= 0 ? li : null }; };
  function skillLine(m) {
    var out = [];
    for (var k in m.sk) { var d = G.SKILL_BY_ID[k]; if (d) out.push(d.name + ' ' + m.sk[k]); }
    return out.join(' · ');
  }
  function pips(n) { return '●●●'.slice(0, n) + '○○○'.slice(0, 3 - n); }

  /** 항해사 한 사람과 마주 앉는다 — 정보를 듣거나 고용한다 */
  T.talkMate = async function (c, m, quiet) {
    var who = T.duo(T.mateSpeaker(m));
    if (!quiet) await UI.say(m.desc, {});
    for (;;) {
      var w = await UI.ask('무슨 용건인가?', [{ label: '정보를 듣는다', value: 'info' }, { label: '부하로 고용한다', value: 'hire' }, { label: '떠난다', value: null }], who);
      if (!w) return;
      if (w === 'info') {
        var d = T.rumour(c);
        if (d) { G.Disc.addHint(d.id, 'mate:' + m.id); await UI.say('내가 아는 이야기라면... ' + d.hint, who); UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll'); }
        else await UI.say('글쎄, 딱히 해 줄 이야기가 없군.', who);
        continue;
      }
      if (await T.hireMate(c, m, who)) return;
    }
  };

  /** 고용 절차. 말은 일부만 통해도 되며, 덜 통할수록 처음 충성심이 낮다. 성사되면 true */
  T.hireMate = async function (c, m, who) {
    var s = S(), cm = comm(m);
    who = who || T.duo(T.mateSpeaker(m));
    if (!cm.lv) { await C.mate('말이 한 마디도 통하지 않습니다. 통역을 구하거나 저 사람의 말을 익혀야겠습니다.'); return false; }
    if (s.player.fame < m.fame) { await UI.say('자네 밑에서 일하라고? 미안하지만 아직 자네 이름은 들어 본 적이 없군. (필요 명성 ' + U.num(m.fame) + ')', who); return false; }
    var note = cm.lv >= 3 ? '' : '\n' + G.LANGS[cm.li] + '가 ' + (cm.lv === 1 ? '조금' : '어지간히') + '밖에 통하지 않는다. 손짓을 섞으면 뜻은 전해지겠지만, 처음에는 마음을 다 열지 않을 것이다.';
    var ok = await UI.confirm(U.j(m.name, '을/를') + ' 월급 금화 ' + U.num(m.wage) + '닢에 고용하겠습니까?' + note, '고용한다', '그만둔다');
    if (!ok) return false;
    // 급료가 버거우면 경리(없으면 부관)가 말린다 — 그래도 들일 수는 있다
    var warn = G.Cabins && G.Cabins.wageWarning(m.wage);
    if (warn) {
      await UI.say(warn.text, G.Cabins.warnSpeaker());
      if (!await UI.confirm('그래도 ' + U.j(m.name, '을/를') + ' 고용하겠습니까?', '고용한다', '그만둔다')) return false;
    }
    R.tidyCaptains();
    var role = G.ROLES.map(function (r) { return r.id; }).filter(function (rid) { return !s.mates.some(function (x) { return x.role === rid; }); })[0] || 'none';
    var nm = { id: m.id, role: role, joined: U.dateNum(s.date), loyal: 40 + cm.lv * 10, from: c.id };   // from: 처음 만난 도시 (둘째 부인의 집 — wives.js)
    if (role === 'none') { var free = s.fleet.ships.slice(1).filter(function (x) { return !R.captain(x); })[0]; if (free) { nm.role = 'captain'; nm.ship = free.uid; } }   // 빈 배가 있으면 선장으로
    s.mates.push(nm); role = nm;
    G.State.log(U.j(m.name, '이/가') + ' 동료가 되었다.');
    await UI.say(U.pick(['좋소, 당신과 함께 가지. 실망시키지 마시오.', '재미있겠군. 잘 부탁하오, 제독.', '당신의 배에 오르겠소. 세상 끝까지라도.']), who);
    UI.toast(m.name + ' 동료가 되었다. (' + roleName(role) + ')', 'people');
    if (cm.lv < 3) UI.toast('말이 다 통하지 않아 처음 충성심이 낮습니다.', 'info', 4200);
    return true;
  };

  /** 술집·여관에서 손님을 뒤지지 않고 바로 항해사를 찾는다 — 능력치를 보고 고른다 */
  T.hire = async function (c, keeper) {
    var s = S();
    var list = function () { return keeper ? T.candidates(c) : T.hireList(c); };   // 술집 명부에는 머무는 경쟁 탐험가도 (여관 안주인은 모른다)
    var cands = list();
    if (!cands.length) {
      var away = keeper ? null : T.rivalsStaying(c).filter(function (r) { return r.atSea; })[0];
      await C.say(keeper || master(), '배를 타겠다는 사람 말인가? 지금 이 도시에는 눈에 띄는 자가 없군.' + T.mateHint(c) + (away && G.RIVAL_STAYS[away.name].away ? '\f' + G.RIVAL_STAYS[away.name].away : ''));
      return;
    }
    for (;;) {
      var m = await pickMate(c, cands);
      if (!m) return;
      if (m.rival) await T.rivalTalk(c, m.rival);   // 이야기는 하지만 고용은 안 된다
      else await T.talkMate(c, m);
      cands = list();
      if (!cands.length) return;
    }
  };
  /** 「항해사를 찾는다」 명부: 고용할 수 있는 항해사 + 이 도시에 머무는 경쟁 탐험가(바다에 나가 있지 않을 때 — 고용할 수 없다) */
  T.hireList = function (c) {
    return T.candidates(c).concat(T.rivalsStaying(c).filter(function (r) { return !r.atSea; }).map(function (r) { return T.rivalCard(r.name); }));
  };
  /** 명부에 올릴 경쟁 탐험가 카드 (G.RIVAL_STAYS[이름].card) */
  T.rivalCard = function (nm) {
    var k = (G.RIVAL_STAYS[nm] || {}).card || {};
    return { id: 'rival:' + nm, rival: nm, name: nm, g: k.g || 'm', y: k.y || [0, 0], st: k.st || [], sk: k.sk || {}, lg: k.lg || {}, fame: 0, wage: 0, desc: k.desc || '' };
  };

  /** 항해사 명부: 왼쪽에 이름, 오른쪽에 능력치·특기·말. 고르면 그 사람을 돌려준다 */
  function pickMate(c, cands) {
    var s = S();
    var list = cands.slice().sort(function (a, b) {
      var al = s.player.fame < a.fame ? 1 : 0, bl = s.player.fame < b.fame ? 1 : 0;
      return al - bl || a.fame - b.fame;
    });
    var win = UI.window({
      title: '항해사를 찾는다', icon: 'people', width: 1180, height: 700, parch: false,
      html: '<div class="hirebox"><div class="hire-list"></div><div class="hire-card parch"></div></div>'
    });
    var listEl = win.content.querySelector('.hire-list');
    var cardEl = win.content.querySelector('.hire-card');
    var sel = list[0];
    list.forEach(function (d) {
      var lock = !d.rival && s.player.fame < d.fame, cm = comm(d);
      var row = U.el('div', 'hire-row' + (lock ? ' lock' : ''),
        '<span class="nm">' + U.esc(d.name) + '</span>' +
        '<span class="rt">' + (d.rival ? '고용 불가' : lock ? '명성 ' + U.num(d.fame) : U.num(d.wage) + '닢') + '</span>' +
        '<span class="sk">' + U.esc(skillLine(d)) + (cm.lv ? '' : ' · <b>말 안 통함</b>') + '</span>');
      row.onclick = function () { sel = d; render(); };
      row.ondblclick = function () { win.close(d); };
      d._row = row;
      listEl.appendChild(row);
    });
    function render() {
      U.$$('.hire-row', listEl).forEach(function (e, i) { e.classList.toggle('on', list[i] === sel); });
      cardEl.innerHTML = '';
      cardEl.appendChild(mateCard(sel, c, function () { win.close(sel); }));
    }
    render();
    return win.result;
  }

  var STATN = ['힘', '지력', '무력', '매력'];
  /** 대항해시대식 인물 카드: 초상 · 능력치 · 특기 · 말 */
  function mateCard(m, c, onPick) {
    var s = S(), cm = comm(m), lock = s.player.fame < m.fame;
    var wrap = U.el('div', 'mcard');
    var head = U.el('div', 'mc-head');
    var pf = U.el('div', 'mc-face');
    try { pf.appendChild(A.portraitCanvas(m.rival ? A.rivalSpec(m.rival) : G.Scenes.mateSpec(m.id), 150)); } catch (e) { /* 그림이 없으면 비워 둔다 */ }
    head.appendChild(pf);
    head.appendChild(U.el('div', 'mc-id',
      '<div class="nm">' + U.esc(m.name) + (G.Bio ? G.Bio.link(m.name, '📜 이야기') : '') + '</div>' +
      '<div class="mt">' + (m.g === 'f' ? '여자' : '남자') + ' · ' + (m.rival ? U.esc((G.SeaFolk.rivalCity(m.rival) || {}).name || '') + '에 머묾' : G.MateMove ? (function (z) { return z + U.jx(z, '을/를') + ' 떠돎'; })(G.MateMove.zoneNames(m.id)) : m.reg.map(function (r) { return G.REGIONS[r]; }).join('·')) +
      ' · ' + m.y[0] + '~' + m.y[1] + '년' + (m.renown ? ' · <span class="renown" title="실존 인물 — 지명도가 높을수록 특기가 많다">지명도 ' + '★'.repeat(m.renown) + ' ' + G.RENOWN_NAME[m.renown] + '</span>' : '') + '</div>' +
      (m.rival ? '<div class="mt"><b class="warn">고용할 수 없다</b> — 스스로 함대를 꾸려 발견을 다투는 경쟁 탐험가</div>' : '<div class="mt">필요 명성 <b>' + U.num(m.fame) + '</b>' + (lock ? ' <span class="warn">(모자람 — 지금 내 명성 ' + U.num(s.player.fame) + ')</span>' : '') +
      ' · 월급 <b>금화 ' + U.num(m.wage) + '닢</b></div>') +
      '<div class="mc-desc">' + U.esc(m.desc || '') + '</div>'));
    wrap.appendChild(head);

    var cols = U.el('div', 'mc-cols');
    // 능력치
    var st = U.el('div', 'mc-col');
    st.innerHTML = '<h5>능력치</h5>' + (m.st || []).map(function (v, i) {
      return '<div class="statline"><span>' + STATN[i] + '</span><i class="bar"><i style="width:' + Math.min(100, v) + '%"></i></i><b>' + v + '</b></div>';
    }).join('');
    cols.appendChild(st);
    // 특기
    var sk = U.el('div', 'mc-col');
    var skl = G.SKILLS.filter(function (x) { return m.sk && m.sk[x.id]; });
    sk.innerHTML = '<h5>특기</h5>' + (skl.length ? skl.map(function (x) {
      return '<div class="pipline"><span>' + x.name + '</span><i>' + pips(m.sk[x.id]) + '</i></div>';
    }).join('') : '<div class="none">이렇다 할 특기가 없다</div>');
    cols.appendChild(sk);
    // 말
    var lg = U.el('div', 'mc-col wide');
    var keys = Object.keys(m.lg || {}).sort(function (a, b) { return m.lg[b] - m.lg[a]; });
    lg.innerHTML = '<h5>말</h5>' + (keys.length ? keys.map(function (k) {
      var mine = R.lang(+k), lv = Math.min(m.lg[k], mine);
      return '<div class="pipline' + (lv ? ' ok' : '') + '"><span>' + G.LANGS[k] + '</span><i>' + pips(m.lg[k]) + '</i>' +
        '<em>' + (lv ? '통함 ' + G.LANG_LV[lv] : mine ? '내 ' + G.LANG_LV[mine] : '나는 모름') + '</em></div>';
    }).join('') : '<div class="none">—</div>');
    cols.appendChild(lg);
    wrap.appendChild(cols);

    var foot = U.el('div', 'mc-foot');
    var msg = m.rival ? '이야기는 나눌 수 있지만 부하로 들일 수는 없다.'
      : !cm.lv ? '말이 한 마디도 통하지 않아 이야기를 나눌 수 없다.'
      : lock ? '이름이 알려지면 그때 다시 찾아오자.'
      : cm.lv < 3 ? G.LANGS[cm.li] + '로 그럭저럭 뜻이 통한다. 처음에는 마음을 다 열지 않을 것이다.'
      : '말이 잘 통한다. 바로 이야기를 꺼내 볼 만하다.';
    foot.innerHTML = '<div class="mc-note">' + msg + '</div>';
    var btn = U.el('button', 'btn navy', '만나서 이야기한다');
    btn.onclick = onPick;
    foot.appendChild(btn);
    wrap.appendChild(foot);
    return wrap;
  }

  T.drinker = async function (c) {
    var s = S(), who = { name: '술 취한 선원', portrait: A.withImg(A.npcSpec('drunk' + c.id + s.day, 'sailor', G.Img.folkStyle(c)), G.Img.chain.npc('drunk', c)), lang: C.langLv(c), li: c.lang };
    var v = await UI.ask('술을 마시고 있는 남자가 있다.', [{ label: '한잔 산다', value: 1 }, { label: '무시한다', value: 0 }], {});
    if (!v) return;
    var price = 6 + c.size * 3;
    if (s.player.gold < price) { UI.toast('소지금이 모자랍니다.', 'coin'); return; }
    s.player.gold -= price;
    await UI.say(U.pick(['헤헤, 오늘 좋은 일이 있었는데 기분 좋으니 함께 마시자구.', '으음, 기분 좋군. 여, 자네 말일세. 해 둘 말이 있네.', '헤에, 너무 마셨나. 자네, 좀 더 마시고 싶으니 같이 마십시다.']), who);
    if (who.lang === 0) { await C.mate('무슨 말을 하는 건지 전혀 모르겠습니다.'); return; }
    var roll = U.rand();
    if (roll < 0.55) {
      var d = T.rumour(c, { stack: true });
      if (d) { var kn = G.Disc.hasHint(d.id); await UI.say((kn ? '자네도 들었나? 나도 들은 얘긴데... ' : '이건 비밀인데 말이야... ') + d.hint, who); G.Disc.noteHint(d, 'tavern:' + c.id); return; }
    }
    if (roll < 0.8) {
      // price tip
      var t = G.CITY_DATA[U.pick(s.known)], g = t && t.goods.length ? U.pick(t.goods) : null;
      if (g) { await UI.say(t.name + '에서는 ' + G.GOOD[g].name + U.j(G.GOOD[g].name, '이/가').slice(G.GOOD[g].name.length) + ' 싸게 팔린다더군. 한밑천 잡고 싶으면 가 보게.', who); return; }
    }
    await UI.say(U.pick(['바다는 말이야... 넓어... 끄윽.', '내가 젊었을 적에는 말이야, 폭풍 속에서 돛대를 붙잡고...', '쳇, 재미없군.']), who);
  };

  T.challenger = async function (c) {
    var s = S(), who = { name: '거친 사내', portrait: A.withImg(A.npcSpec('brawler' + c.id + s.day, 'soldier', G.Img.folkStyle(c)), G.Img.chain.npc('brawler', c)), lang: C.langLv(c), li: c.lang };
    await UI.say(U.pick(['거기 자네! 마음에 안 드는군, 나랑 결투하자.', '어이, 거기 겁쟁이! 바다의 사나이라면 검을 뽑아라.', '어이, 나보다 강한 놈을 찾고 있다네. 우선 나와 결투해 주겠나?']), who);
    await C.mate(U.pick(['제독, 상대하지 않는 편이 좋습니다.', '그런 말을 듣고 가만히 있을 수 없다. 제독! 해치웁시다.']));
    var px = G.Games.proxy(), pd = px && G.MATE[px.id];
    var v = await UI.ask('어떻게 할까?', [{ label: '도전을 받는다', value: 1 }].concat(pd ? [{ label: '부관 ' + pd.name + '에게 맡긴다', value: 2 }] : []).concat([{ label: '무시한다', value: 0 }]), { name: s.player.name, portrait: s.player.portrait });
    if (!v) { await UI.say(U.pick(['흥, 꼬리를 감추고 도망치긴가!', '겁쟁이! 너는 바다의 사나이가 아니다!', '싫다면 어쩔 수 없군.']), who); return; }
    if (v === 2) { await C.mate(U.pick(['제독께서 나서실 것까지 없습니다. 제가 상대하지요.', '이런 녀석은 제게 맡겨 두십시오.'])); await UI.say('흥, 부하를 내세우겠다고? 좋다, 누구든 덤벼라!', who); }
    else await UI.say('그럼 그래야지! 그래야 바다의 사나이다. 죽더라도 원망하지 말게.', who);
    var res = await G.Games.duel({ name: who.name, portrait: who.portrait, look: 'brawler', str: U.ri(45, 75), atk: U.ri(5, 12), def: U.ri(0, 5), skill: U.ri(0, 2), mar: U.ri(50, 75), int: U.ri(25, 50), cha: U.ri(30, 50) }, v === 2 ? { mate: px, place: 'tavern' } : { place: 'tavern' });
    var ld = G.Games.lastDuel || {}, fm = ld.mate, fd = fm && G.MATE[fm.id];
    if (res === 'win') {
      var prize = U.ri(100, 300) + c.size * 60; s.player.gold += prize;
      var line = ld.how === 'persuade' ? '...자네 말이 맞군. 내가 경솔했네. 사과의 뜻이야, 받아 두게.' : ld.how === 'capture' ? '놔, 놔라! ...알았어, 내가 졌다. 이거 가져가!' : ld.how === 'rout' ? '(허둥지둥 달아나며) 돈은 두고 간다!' : '크윽... 졌다. 자, 가져가라!';
      if (fm) { G.Fame.add('bt', 3); fm.loyal = Math.min(100, (fm.loyal || 70) + 5); await UI.say((ld.how === 'ko' ? '크윽... 부하가 이 정도라니. 자, 가져가라!' : line) + ' (금화 ' + prize + '닢)', who); }
      else { G.Fame.add('bt', 5); await UI.say(line + ' (금화 ' + prize + '닢)', who); }
      if (ld.secret) { s.player.notoriety += 1; UI.toast('술집에서 비밀무기를 꺼낸 일로 뒷말이 돈다. (악명 +1)', 'skull', 3500); }
    } else if (res === 'lose') {
      var loss = Math.min(Math.floor(s.player.gold * 0.1), 400 + c.size * 120); s.player.gold -= loss;   // 판돈보다 터무니없이 많이 잃지는 않는다
      if (fm) { fm.hurt = s.day + 20; await C.mate('면목 없습니다, 제독... 저 녀석, 보통 솜씨가 아니었습니다. (금화 ' + U.num(loss) + '닢을 빼앗겼다. ' + fd.name + U.jx(fd.name, '은/는') + ' 20일 동안 다쳐 능력이 절반이 된다)'); }
      else await C.mate('제독! 이봐요, 제독! 괜찮습니까? ...돈주머니가 가벼워졌군요. (금화 ' + U.num(loss) + '닢)');
    }
  };

  // rival explorers — duel to delay their discovery
  T.rivalHere = function (c) {
    var s = S(), y = s.date.y;
    return G.DISCOVERIES.filter(function (d) {
      if (!d.rival) return false;
      if (G.RIVAL_STAYS && G.RIVAL_STAYS[d.rival[2]]) return false;   // 머무는 도시가 있는 경쟁자는 그 도시 술집 「항해사를 찾는다」 명부에서 만난다 (T.rivalTalk)
      var st = s.disc[d.id]; if (st && (st.rival || st.me)) return false;
      if (G.SeaFolk && G.SeaFolk.rivalAtSea(d)) return false;   // 항해를 떠나 바다에 있다
      // 그 단계에 소문조차 돌지 않으면 (예: 향료제도도 모르는데 지팡그) 아직 나타나지 않는다
      var fr = G.Frontier && G.Frontier.of(d); if (fr && G.Frontier.state(fr.id).lv < 1) return false;
      var ry = d.rival[0] + (s.flags['delay_' + d.id] || 0);
      return ry - y >= 0 && ry - y <= 4 && G.REGION_DIST[c.region][0] <= 2;
    })[0] || null;
  };
  T.rival = async function (c) {
    var s = S(), d = T.rivalHere(c); if (!d) return;
    var nm = d.rival[2];
    var who = T.duo({ name: nm, portrait: A.rivalSpec(nm), half: G.Img.chain.rivalHalf(nm), lang: 3 }, 'neutral', true);
    await UI.say('항해자 같은 남자가 있다. …' + nm + '이라는 사람인 것 같다.', {});
    for (;;) {
      var v = await UI.ask('무슨 용건인가?', [{ label: '정보를 듣는다', value: 'info' }, { label: '일기토를 신청한다', value: 'duel' }, { label: '떠난다', value: null }], who);
      if (!v) return;
      if (v === 'info') { await UI.say('나는 곧 큰 항해를 떠날 걸세. ' + d.hint, who); if (G.Disc.addHint(d.id, 'rival')) UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll'); continue; }
      if (await T.rivalDuel(d, who)) return;
    }
  };
  /** 경쟁자에게 일기토 — 이기면 그 발견을 1~2년 늦춘다. 싸웠으면 true, 그만두었으면 false */
  T.rivalDuel = async function (d, who) {
    var s = S(), nm = d.rival[2];
    for (;;) {
      var px = G.Games.proxy(), pd = px && G.MATE[px.id];
      var fv = await UI.ask('일기토를 신청합니다. 누가 나섭니까?', [{ label: '내가 싸운다', value: 1 }].concat(pd ? [{ label: '부관 ' + pd.name + '에게 맡긴다', value: 2 }] : []).concat([{ label: '그만둔다', value: 0 }]), { name: s.player.name, portrait: s.player.portrait });
      if (!fv) return false;
      var res = await G.Games.duel({ name: nm, portrait: who.portrait, look: 'rival', str: 70, atk: 12, def: 6, skill: 2, mar: 72, int: 70, cha: 65, style: 'thrust' }, fv === 2 ? { mate: px, place: 'tavern' } : { place: 'tavern' });
      var ldr = G.Games.lastDuel || {}, fmr = ldr.mate, fdr = fmr && G.MATE[fmr.id];
      if (res === 'lose' && fmr) { fmr.hurt = s.day + 30; UI.toast(fdr.name + U.jx(fdr.name, '은/는') + ' 30일 동안 다쳐 능력이 절반이 된다.', 'skull', 4000); }
      if (res === 'win' && fmr) fmr.loyal = Math.min(100, (fmr.loyal || 70) + 5);
      if (res === 'win' && ldr.how === 'persuade') { await UI.say('...자네 말대로 서두를 일은 아니군. 이번 항해는 한 해쯤 미루겠네.', who); }
      if (res === 'win') {
        var yrs = U.ri(1, 2);
        s.flags['delay_' + d.id] = (s.flags['delay_' + d.id] || 0) + yrs;
        await UI.say(U.pick(['상처가 깊은 것 같군. 이러면 계획이 늦어져 버릴 텐데. 앞으로 조금인데.', '모처럼 단서를 잡았는데, 이런 일이... 운이 나쁘군.']), who);
        UI.toast(nm + '의 행동이 ' + yrs + '년 늦어졌습니다', 'hourglass', 4000);
      } else await UI.say('생각보다는 꽤 하는군. 하지만 이런 곳에서 쓰러질 수는 없지. 내게는 큰 꿈이 있다.', who);
      return true;
    }
  };

  // ---------------------------------------------------------------- 머무는 경쟁 탐험가 (G.RIVAL_STAYS, seafolk.js) — 고용할 수 없다
  /** 이 도시에 머무는 경쟁 탐험가 [{name, atSea}] */
  T.rivalsStaying = function (c) {
    var SF = G.SeaFolk; if (!SF || !SF.rivalCity || !G.RIVAL_STAYS) return [];
    return Object.keys(G.RIVAL_STAYS).filter(function (nm) { var at = SF.rivalCity(nm); return at && at.id === c.id; })
      .map(function (nm) { return { name: nm, atSea: SF.atSeaName(nm) }; });
  };
  function rivalWhen(d) { return (d.rival[0] + (S().flags['delay_' + d.id] || 0)) * 12 + d.rival[1]; }
  /** 그 경쟁자가 다음에 노리는 발견물 (아직 아무도 알리지 않은 것 가운데 가장 이른 것) */
  T.rivalTarget = function (nm) {
    var s = S();
    return G.DISCOVERIES.filter(function (d) {
      if (!d.rival || d.rival[2] !== nm) return false;
      var st = s.disc[d.id]; return !(st && (st.rival || st.reported || st.announced));
    }).sort(function (a, b) { return rivalWhen(a) - rivalWhen(b); })[0] || null;
  };
  /** 그 경쟁자가 마지막으로 노렸던 발견물과 결과 {d, by: 'rival'|'me'} (없으면 null) */
  T.rivalLast = function (nm) {
    var s = S(), out = null;
    G.DISCOVERIES.forEach(function (d) {
      if (!d.rival || d.rival[2] !== nm) return;
      var st = s.disc[d.id]; if (!st) return;
      var by = st.rival ? 'rival' : (st.reported || st.announced) ? 'me' : null;
      if (by && (!out || rivalWhen(d) > rivalWhen(out.d))) out = { d: d, by: by };
    });
    return out;
  };
  T.rivalTalk = async function (c, nm) {
    var s = S(), info = G.RIVAL_STAYS[nm] || {}, who = T.duo({ name: nm, portrait: A.rivalSpec(nm), half: G.Img.chain.rivalHalf(nm), lang: 3 });
    if (G.SeaFolk.atSeaName(nm)) { await C.say(master(), info.away || nm + '? 얼마 전에 배를 띄워 나갔네.'); return; }
    if (!s.flags['metRival_' + nm]) { s.flags['metRival_' + nm] = 1; await UI.say(info.intro || nm + '이오.', who); }
    for (;;) {
      var d = T.rivalTarget(nm), soon = d && rivalWhen(d) - (s.date.y * 12 + s.date.m) <= 48 && G.Disc.available(d);
      var v = await UI.ask('무슨 용건인가?', [
        { label: '정보를 듣는다', value: 'plan' },
        { label: '부하로 고용한다', value: 'hire' },
        soon ? { label: '일기토를 신청한다', value: 'duel' } : null,
        { label: '떠난다', value: null }].filter(Boolean), who);
      if (!v) return;
      if (v === 'hire') { await UI.say(info.hire || '나는 내 배를 몬다네.', who); UI.toast(nm + U.jx(nm, '은/는') + ' 고용할 수 없다 — 스스로 함대를 꾸려 발견을 다투는 경쟁자다.', 'compass', 4000); continue; }
      if (v === 'duel') { if (await T.rivalDuel(d, who)) return; continue; }
      var last = T.rivalLast(nm), plan = info.plan || {}, done = info.done || {};
      if (last && last.by === 'me' && info.beaten && !s.flags['rivalBeaten_' + last.d.id]) { s.flags['rivalBeaten_' + last.d.id] = 1; await UI.say(info.beaten, who); }
      else if (last && last.by === 'rival' && done[last.d.id] && !s.flags['rivalDone_' + last.d.id]) { s.flags['rivalDone_' + last.d.id] = 1; await UI.say(done[last.d.id], who); }
      if (soon) {
        await UI.say(plan[d.id] || '나는 곧 큰 항해를 떠날 걸세. ' + d.hint, who);
        if (G.Disc.addHint(d.id, 'rival')) UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll');
      } else await UI.say(info.dream || '언젠가 더 먼 바다로 갈 거요.', who);
    }
  };

  // ---------------------------------------------------------------- barmaid
  T.maid = async function (c, m) {
    var s = S(), st = s.maids[m.id] || (s.maids[m.id] = { aff: 0, met: 0 }), who = T.maidSpeaker(m), like = G.LIKES[m.like];
    function scene(emotion, asking) {
      var o = {}, k; for (k in who) o[k] = who[k];
      o.layout = 'duo'; o.side = 'right'; o.partner = T.playerSpeaker(); o.emotion = emotion || 'warm';
      if (asking) o.choiceSide = 'left';
      return o;
    }
    function say(text, emotion) { return UI.say(text, scene(emotion, false)); }
    function ask(text, choices) { return UI.ask(text, choices, scene('warm', true)); }
    st.met++;
    if (s.player.wife === m.id) { await say('어머, 당신! 여기서 뭐 해요? 집에서 기다릴게요.', 'happy'); return; }
    if (G.Wives && G.Wives.of(m.id)) { await say('어머, 당신! 여기서는 일하는 중이에요. 집으로 와요, 기다릴게요.', 'happy'); return; }
    var greet = st.aff < 20 ? '어서 오세요. 처음 뵙는 분이네요.' : st.aff < 50 ? '어머, 또 오셨네요!' : st.aff < 80 ? '와 주셨군요! 기다리고 있었어요.' : '당신 얼굴을 보니 정말 기뻐요.';
    await say(greet, st.aff >= 50 ? 'happy' : 'warm');
    for (;;) {
      var v = await ask(m.name + ' — 호감 ' + heart(st.aff), [
        { label: '한잔 산다', value: 'drink' }, { label: '이야기한다', value: 'talk' }, { label: '선물한다', value: 'gift' },
        { label: '청혼한다', value: 'wed', dis: !(st.aff >= 90) }, { label: '돌아간다', value: null }]);
      if (!v) return;
      if (v === 'drink') {
        var pr = 10 + c.size * 5; if (s.player.gold < pr) { UI.toast('소지금이 모자랍니다.', 'coin'); continue; }
        s.player.gold -= pr;
        var today = U.dateNum(s.date); if (st.last === today) { await say('오늘은 벌써 많이 마셨어요. 또 와 주세요.', 'warm'); continue; }
        st.last = today; var gain = 2 + likeBonus(like);
        st.aff = Math.min(100, st.aff + gain);
        await say(U.pick(['고마워요! 건배!', '어머, 저한테요? 잘 마실게요.', '당신이랑 마시니까 더 맛있네요.']), 'happy');
      } else if (v === 'talk') {
        if (st.aff < 30) await say('저는 ' + like.name + ' 남자가 좋아요. ' + (m.like === 'generous' ? '역시 남자는 통이 커야죠.' : '그런 사람이 이상형이에요.'), 'warm');
        else {
          var d = U.chance(0.5) ? T.rumour(c, { stack: true }) : null;
          if (d) { var kn2 = G.Disc.hasHint(d.id); await say((kn2 ? '그 이야기, 여기 손님들도 똑같이 하던데요. ' : '손님들이 이런 이야기를 하더라고요. ') + d.hint, 'warm'); G.Disc.noteHint(d, 'tavern:' + c.id); }
          else await say(U.pick(['바다 너머에는 뭐가 있을까요? 언젠가 저도 가 보고 싶어요.', '항해 이야기 더 들려주세요!', '몸조심하세요. 바다는 무서운 곳이니까요.']), 'warm');
        }
      } else if (v === 'gift') {
        // 아직 보고·발표하지 않은 발견의 유물(증거)은 선물로 내놓지 않는다
        var gifts = s.player.items.filter(function (it) { return G.ITEM[it.id] && G.ITEM[it.id].kind === 'gift' && !G.ITEM[it.id].ring && !R.isProof(it); });
        if (!gifts.length) { UI.toast('선물할 장신구가 없습니다. 시장에서 살 수 있습니다.' + (s.player.items.some(function (it) { return G.ITEM[it.id] && G.ITEM[it.id].kind === 'gift' && R.isProof(it); }) ? ' (발견의 증거인 장신구는 보고·발표한 뒤에 선물할 수 있습니다)' : ''), 'info'); continue; }
        var gi = await UI.choose('선물', gifts.map(function (it, i) { return { label: G.ITEM[it.id].name + (G.RELIC && G.RELIC[it.id] ? ' <span class="tag">유물</span>' : ''), right: '♥' + G.ITEM[it.id].gv, value: i, icon: 'heart', thumb: G.Img.itemSrc(it) }; }), { width: 460 });
        if (gi == null) continue;
        var it = gifts[gi]; s.player.items.splice(s.player.items.indexOf(it), 1);
        st.aff = Math.min(100, st.aff + G.ITEM[it.id].gv + likeBonus(like) + R.skill('craft'));
        await say(U.pick(['어머, 이렇게 고운 걸 저에게요? 정말 고마워요!', '예뻐라! 소중히 간직할게요.']), 'happy');
      } else if (v === 'wed') {
        if (!R.hasItem('ring')) { UI.toast('청혼하려면 약속 반지가 필요합니다.', 'ring'); continue; }
        if (s.player.wife) { if (G.Wives) { if (await G.Wives.proposeMaid(c, m, say)) return; continue; } UI.toast('이미 결혼했습니다.', 'ring'); continue; }   // 본처가 있으면 둘째 부인으로
        var ok = await UI.confirm(m.name + '에게 청혼하겠습니까?', '청혼한다', '그만둔다');
        if (!ok) continue;
        R.removeItem('ring');
        await say('...정말요? 저, 저라도 괜찮다면... 네, 기꺼이!', 'shy');
        s.player.wife = m.id; st.aff = 100;
        G.State.log(m.name + U.j(m.name, '과/와').slice(m.name.length) + ' 결혼했다.');
        await UI.alert(m.name + U.j(m.name, '과/와').slice(m.name.length) + ' 결혼했다! 고향 ' + G.CITY_DATA[s.player.home].name + '의 자택에서 기다리고 있을 것이다.', '결혼');
        return;
      }
    }
  };
  function heart(a) { var n = Math.round(a / 20); return '♥♥♥♥♥'.slice(0, n) + '♡♡♡♡♡'.slice(0, 5 - n); }
  function likeBonus(like) {
    var p = S().player, k = like.stat;
    if (k === 'fame') return p.fame > 1500 ? 3 : p.fame > 400 ? 1 : 0;
    if (k === 'gold') return p.gold > 20000 ? 3 : p.gold > 6000 ? 1 : 0;
    if (k === 'bank') return p.bank > 20000 ? 3 : p.bank > 5000 ? 1 : 0;
    var v = p.st[k] || 50; return v > 75 ? 3 : v > 60 ? 1 : 0;
  }

  // ---------------------------------------------------------------- companion roles
  T.organize = async function () {
    var s = S();
    for (;;) {
      R.tidyCaptains();
      if (!s.mates.length) { UI.toast('동료가 없습니다.', 'people'); return; }
      var i = await UI.choose('부하편성', [{ label: '기함 선실 — 방마다 부하를 배치한다', right: '선실 ' + (G.Cabins.rooms().length - 1) + '칸', value: 'cabin', icon: 'bed' }].concat(s.mates.map(function (m, k) { var d = G.MATE[m.id]; return { label: d.name, right: G.Cabins.placeName(m) + (G.Cabins.eff(m) < 1 ? ' · 충성 ' + Math.round(m.loyal) : ''), value: k, icon: 'people', desc: skillLine(d) + ' — ' + d.desc }; })), { width: 620, text: '역할을 바꿀 동료를 고르십시오. 기함의 부관·항해사·측량사·통역·경리는 한 명씩이고(경리는 회계로 교역소·시장·후원자 앞에서 값을 후려친다), 기함 말고 다른 배에는 선장을 한 명씩 둘 수 있습니다. 선장의 항해술·포술·검술·조선기술은 그 배에만 쓰입니다.' });
      if (i == null) return;
      if (i === 'cabin') { await G.CabinView.open(); continue; }
      var m = s.mates[i], d = G.MATE[m.id];
      var opts = G.ROLES.map(function (r) {
        var holder = s.mates.filter(function (x) { return x.role === r.id && x !== m; })[0];
        return { label: '기함 ' + r.name, right: holder ? G.MATE[holder.id].name + '와 교대' : '', value: r.id };
      });
      s.fleet.ships.slice(1).forEach(function (sh) {
        var cap = R.captain(sh);
        opts.push({ label: '선장 — ' + U.esc(sh.name) + '호', right: G.SHIP[sh.type].name + (cap && cap !== m ? ' · ' + G.MATE[cap.id].name + '와 교대' : cap === m ? ' · 지금 맡고 있음' : ' · 지금은 갑판장'), value: 'cap:' + sh.uid, icon: 'ship',
          desc: d.name + '의 항해술 ' + R.mateSkill(m, 'nav') + ' · 포술 ' + R.mateSkill(m, 'gun') + ' · 검술 ' + R.mateSkill(m, 'sword') + ' · 조선기술 ' + R.mateSkill(m, 'ship') + ' — 이 배에만 쓰인다' });
      });
      opts = opts.concat([{ label: '대기', value: 'none' }, { label: '해고한다', value: 'fire', icon: 'boot' }]);
      var v = await UI.choose(d.name + '의 역할', opts, { width: 600 });
      if (!v) continue;
      if (v === 'fire') {
        if (m.id === 'rocco') { await UI.say('제독, 저를 버리시겠다는 겁니까? ...농담이시겠지요.', G.Scenes.mateSpeaker('first')); continue; }
        if (await UI.confirm(d.name + U.j(d.name, '을/를').slice(d.name.length) + ' 해고하겠습니까?')) { s.mates.splice(i, 1); s.flags['gone_' + m.id] = 1; UI.toast(d.name + U.j(d.name, '이/가').slice(d.name.length) + ' 떠났다.', 'boot'); }
        continue;
      }
      T.assign(m, v);
    }
  };
  /** 역할을 맡긴다. 그 자리를 맡던 사람은 m이 하던 일을 넘겨받는다 */
  T.assign = function (m, v) {
    var s = S(), oldRole = m.role, oldShip = m.ship, other;
    if (v.indexOf('cap:') === 0) {
      var uid = v.slice(4);
      other = s.mates.filter(function (x) { return x !== m && x.role === 'captain' && x.ship === uid; })[0];
      m.role = 'captain'; m.ship = uid;
    } else {
      other = v === 'none' ? null : s.mates.filter(function (x) { return x !== m && x.role === v; })[0];
      m.role = v; delete m.ship;
    }
    if (other) { other.role = oldRole || 'none'; if (oldRole === 'captain') other.ship = oldShip; else delete other.ship; }
    R.tidyCaptains();
    if (G.Cabins) G.Cabins.tidy();   // 부관·항해사·측량사·선장이 되면 선실을 비운다
  };
})(window.G = window.G || {});
