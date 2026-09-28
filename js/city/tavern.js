/* 술집: 술, 한턱, 정보, 여급, 손님(동료·주정뱅이·결투·라이벌), 포카, 부하편성 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art, C = G.Scenes.city;
  function S() { return G.Game.state; }
  function roleName(m) { return R.roleName(m); }
  var T = { title: '술집', icon: 'mug', paint: 'tavern', exitLabel: '술집을 나온다' };
  C.B.tavern = T;
  G.MAX_MATES = 9;     // 기함 참모 다섯 자리(부관·항해사·측량사·통역·경리) + 다른 배의 선장 네 자리

  function master() { return C.npc('tavernkeeper', '술집 주인'); }
  function maidOf(c) { return G.MAIDS.filter(function (m) { return m.city === c.id; })[0] || null; }
  T.maidOf = maidOf;
  T.maidSpeaker = function (m) { var c = G.CITY_DATA[m.city]; return { name: m.name, portrait: A.maidSpec(m), lang: R.lang(c.lang), li: c.lang }; };
  /** 이름 있는 여급이 없는 도시의 그 지역 여급 */
  T.servantSpeaker = function (c) {
    return { name: '여급', lang: R.lang(c.lang), li: c.lang,
      portrait: A.withImg(A.npcSpec('svc' + c.id, 'maid', c.style, 'f'), G.Img.chain.maidCity(c)) };
  };
  T.servant = async function (c) {
    var who = T.servantSpeaker(c);
    var d = U.chance(0.45) ? T.rumour(c) : null;
    if (d) {
      G.Disc.addHint(d.id, 'tavern:' + c.id);
      await UI.say('손님들이 이런 이야기를 하더군요. ' + d.hint, who);
      UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll');
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
    var im = new Image();
    im.className = 'fig'; im.alt = m ? m.name : '여급'; im.decoding = 'async';
    im.src = G.Img.src(key);
    wrap.appendChild(im);
    wrap.appendChild(U.el('div', 'tag', m ? '여급 ' + U.esc(m.name) : '여급'));
    wrap.title = (m ? m.name : '여급') + '에게 말을 건다';
    wrap.onclick = function () { C.run(function () { return m ? T.maid(c, m) : T.servant(c); }); };
    return wrap;
  };

  T.enter = async function (c) {
    var cur = C.current(); cur.looked = false; cur.drinks = 0; cur.asked = 0;
    var mn = G.Monsoon ? G.Monsoon.portNote(c) : null;
    await C.say(master(), U.pick(['어서 오게! 목을 축이고 가게.', '어서 오게. 오늘도 손님이 많군.', '뱃사람이라면 언제든 환영일세.']) + (mn ? '\f' + (mn.phase === 'sw' ? '요즘은 남서 계절풍이 한창이라 ' : '요즘은 북동 계절풍이라 ') + mn.zone.tip[mn.phase] + '더군. ' + mn.next.date.m + '월 ' + mn.next.date.d + '일 무렵이면 바람이 뒤집힐 걸세.' : ''));
    if (U.chance(0.45)) await T.encounter(c);
  };
  T.sub = function (c) { var m = maidOf(c); return m ? '여급 ' + U.j(m.name, '이/가') + ' 일하고 있다' : '뱃사람들로 북적인다'; };
  T.menu = function (c) {
    var cur = C.current(), m = maidOf(c), cand = T.candidates(c);
    return [
      { label: '술을 마신다', icon: 'mug', onClick: function () { return T.drink(c); } },
      { label: '한턱 낸다', icon: 'coin', onClick: function () { return T.treat(c); } },
      { label: '정보를 듣는다', icon: 'scroll', onClick: function () { return T.info(c); } },
      (function () { var tg = T.targets(c); return tg.length ? { label: '목표를 수소문한다', icon: 'map', sub: tg.length + '곳', onClick: function () { return T.askTarget(c); } } : null; })(),
      { label: '손님을 둘러본다', icon: 'eye', dim: cur && cur.looked, onClick: function () { return T.look(c); } },
      { label: '항해사를 찾는다', icon: 'people', sub: cand.length ? cand.length + '명' : '없다', dim: !cand.length, onClick: function () { return T.hire(c); } },
      m ? { label: '여급과 이야기', icon: 'heart', sub: m.name, onClick: function () { return T.maid(c, m); } }
        : (G.Img && G.Img.pick(G.Img.chain.maidCity(c)) ? { label: '여급과 이야기', icon: 'heart', onClick: function () { return T.servant(c); } } : null),
      { label: '포카를 권한다', icon: 'dice', onClick: function () { return G.Games.poker(c); } },
      { label: '부하편성', icon: 'people', sub: S().mates.length + '/' + G.MAX_MATES, onClick: function () { return T.organize(); } }
    ];
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
    s.player.fame += 1;
    UI.toast('선원들의 사기가 올랐다. (규율 +12)', 'mug');
    C.current().looked = false;
    if (U.chance(0.6)) await T.encounter(c, true);
  };

  // ---------------------------------------------------------------- information (rumours about discoveries)
  T.info = async function (c) {
    var s = S(), cur = C.current(), m = master();
    if (C.langLv(c) === 0) { await C.say(m, '……?'); await C.mate('말이 통하지 않는 것만은 어쩔 수가 없군요.'); return; }
    if (cur.asked >= 2) { await C.say(m, '정보? 오늘은 더 이상 그런 것은 없네.'); return; }
    var price = 20 + c.size * 15;
    var v = await C.ask(m, '정보라... 자, 우리 가게 술을 마시면 가르쳐 주지. 한 잔에 금화 ' + price + '닢이네.', [{ label: '술을 산다', value: 1 }, { label: '그만둔다', value: 0 }]);
    if (!v) return;
    if (s.player.gold < price) { await C.say(m, '돈 먼저 지불하게.'); return; }
    s.player.gold -= price; cur.asked++;
    // 리스본·세비야: 앞선 발견이 알려지면 다음 큰 항로 이야기가 먼저 돈다
    var lead = G.Frontier && G.Frontier.takeLead ? G.Frontier.takeLead(c.id, 'tavern') : null;
    if (lead) { await C.say(m, lead.text); UI.toast('단서를 얻었다: 「' + lead.disc.name + '」', 'scroll'); return; }
    var d = T.rumour(c);
    if (!d) { await C.say(m, T.quietLine()); return; }
    G.Disc.addHint(d.id, 'tavern:' + c.id);
    var src = U.pick(['확실히 ', '그러고 보니 ', '이건 어떤 선원한테서 들은 이야기인데, ']);
    await C.say(m, src + d.hint);
    UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll');
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
    var dist = G.Geo.dist(c.lon, c.lat, d.lon, d.lat);
    var dir = U.dirName(Math.atan2(d.lat - c.lat, G.Geo.wrapLon(d.lon - c.lon)));
    var land = d.how === 'land', where;
    if (dist < 0.8) where = '바로 이 근처라네. 성문을 나서면 금방이지.';
    else if (land && (dist <= 2.5 || !c.port)) where = '여기서 ' + dir + '쪽으로 뭍길로 ' + Math.max(1, Math.round(dist / 0.3)) + '일쯤 가면 있다고들 하네.';
    else {
      // 먼 곳은 뱃길로 가서 해안에 오르는 길을 일러 준다 (원정 계획과 같은 어림셈)
      var dk = c.dock || [c.lat, c.lon], pl = G.Plan ? G.Plan.expedition([dk[1], dk[0]], d, null) : null;
      var sea = pl ? pl.out : Math.max(1, Math.round(dist / 0.8));
      where = dir + '쪽이지. 뱃길로 ' + sea + '일쯤 가서' + (land ? ' 해안에 오른 뒤 뭍길로 ' + Math.max(1, pl ? pl.walk : 2) + '일쯤 걸어 들어가면 된다더군.' : ' 그 바다에 닿으면 알아볼 수 있다더군.');
    }
    var extra = land ? (G.Geo.terrain(d.lon, d.lat) === 'desert' ? ' 물을 넉넉히 챙기게. 모래뿐인 길이라더군.' : G.Geo.terrain(d.lon, d.lat) === 'mountain' ? ' 산길이 험하다더군.' : G.Geo.terrain(d.lon, d.lat) === 'jungle' ? ' 밀림이라 길 잃기 십상이지.' : '') : '';
    await C.say(m, '「' + d.name + '」 말인가? ' + where + extra);
    var mk = s.marks || (s.marks = {}), u = U.clamp(dist * 0.15, 0.3, 1.2);
    if (!mk[d.id] || mk[d.id].u == null || mk[d.id].u > u) {
      mk[d.id] = { t: s.day, mode: 'rumor', u: u };
      if (G.Explore) G.Explore.ver++;
      UI.toast('해도에 「' + d.name + '」 쪽을 표시해 두었다.', 'map', 4000);
    }
    if (cur) cur.asked = (cur.asked || 0) + 1;
  };

  /** 들려줄 소문이 없을 때: 지금 뱃사람들이 떠드는 다음 개척 목표를 귀띔한다 */
  T.quietLine = function () {
    var g = G.Frontier ? G.Frontier.goals()[0] : null;
    if (g && g.st.lv === 1) {
      var f = G.FRONTIER[g.st.id], tease = f.tease.map(function (id) { return G.DISC[id].name; }).join('·');
      return '미안하네, 새 소문은 없군. 요즘 뱃사람들은 〈' + f.name + '〉에서 건너온 ' + tease + ' 이야기뿐이라네. 그런 것부터 알아보게.';
    }
    if (g && g.st.lv === 2) { var gd = G.DISC[G.FRONTIER[g.st.id].gate]; return '미안하네, 새 소문은 없군. 다들 「' + gd.name + '」 이야기만 하는데, 제대로 아는 사람은 아직 없더군.'; }
    return '미안하네. 요즘은 별다른 소문이 없군. 더 먼 바다의 소식이 들려오면 다시 오게.';
  };
  /** 아직 모르는 발견물 하나를 소문으로 고른다. 개척 단계(G.Frontier)가 닿은 것만,
      가까운 지역부터 — 명성이 오르면 먼 곳 이야기도. 맛보기·관문처럼 온 세상이 떠드는 이야기는 멀어도 돈다 */
  T.rumour = function (c) {
    var s = S(), fame = s.player.fame;
    var maxD = fame < 300 ? 1 : fame < 1500 ? 2 : fame < 3500 ? 3 : 5;
    var cand = G.DISCOVERIES.filter(function (d) {
      if (d.id === 'circum' || G.Disc.foundByMe(d.id) || s.hints[d.id]) return false;
      if (!G.Disc.available(d)) return false;
      var hot = G.Frontier && G.Frontier.hot(d);
      if (d.how === 'trade' && !hot) return false;
      if (d.id === 'mu' || d.id === 'antpeople') return fame > 5000;
      return hot || G.REGION_DIST[c.region][d.reg] <= maxD;
    });
    if (!cand.length) return null;
    return U.weighted(cand, function (d) {
      var w = 1 / (1 + G.REGION_DIST[c.region][d.reg]) * (d.pw <= 2 ? 2 : 1);
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
    return G.MATES.filter(function (m) {
      if (m.reg.indexOf(c.region) < 0 || s.mates.some(function (x) { return x.id === m.id; }) || s.flags['gone_' + m.id]) return false;
      // 해가 맞고, 그 사람이 활약한 바닷길이 알려진 뒤에야 나타난다
      return G.Frontier ? G.Frontier.mateReady(m, y) : (y >= m.y[0] && y <= m.y[1]);
    });
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
    await T.talkMate(c, m);
  };

  /** 서로 아는 말 가운데 가장 잘 통하는 것 — {lv:0~3, li:언어번호} */
  function comm(m) {
    var best = { lv: 0, li: -1 };
    for (var k in m.lg) { var lv = Math.min(m.lg[k], R.lang(+k)); if (lv > best.lv) best = { lv: lv, li: +k }; }
    return best;
  }
  T.comm = comm;
  T.mateSpeaker = function (m) { var cm = comm(m), li = cm.li; if (li < 0) for (var k in m.lg) { if (li < 0 || m.lg[k] > m.lg[li]) li = +k; } return { name: m.name, portrait: G.Scenes.mateSpec(m.id), lang: cm.lv, li: li >= 0 ? li : null }; };
  function skillLine(m) {
    var out = [];
    for (var k in m.sk) { var d = G.SKILL_BY_ID[k]; if (d) out.push(d.name + ' ' + m.sk[k]); }
    return out.join(' · ');
  }
  function pips(n) { return '●●●'.slice(0, n) + '○○○'.slice(0, 3 - n); }

  /** 항해사 한 사람과 마주 앉는다 — 정보를 듣거나 고용한다 */
  T.talkMate = async function (c, m, quiet) {
    var who = T.mateSpeaker(m);
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
    who = who || T.mateSpeaker(m);
    if (s.mates.length >= G.MAX_MATES) { await C.mate('부하는 동시에 ' + G.MAX_MATES + '명밖에 고용할 수 없습니다.'); return false; }
    if (!cm.lv) { await C.mate('말이 한 마디도 통하지 않습니다. 통역을 구하거나 저 사람의 말을 익혀야겠습니다.'); return false; }
    if (s.player.fame < m.fame) { await UI.say('자네 밑에서 일하라고? 미안하지만 아직 자네 이름은 들어 본 적이 없군. (필요 명성 ' + U.num(m.fame) + ')', who); return false; }
    var note = cm.lv >= 3 ? '' : '\n' + G.LANGS[cm.li] + '가 ' + (cm.lv === 1 ? '조금' : '어지간히') + '밖에 통하지 않는다. 손짓을 섞으면 뜻은 전해지겠지만, 처음에는 마음을 다 열지 않을 것이다.';
    var ok = await UI.confirm(U.j(m.name, '을/를') + ' 월급 금화 ' + U.num(m.wage) + '닢에 고용하겠습니까?' + note, '고용한다', '그만둔다');
    if (!ok) return false;
    R.tidyCaptains();
    var role = G.ROLES.map(function (r) { return r.id; }).filter(function (rid) { return !s.mates.some(function (x) { return x.role === rid; }); })[0] || 'none';
    var nm = { id: m.id, role: role, joined: U.dateNum(s.date), loyal: 40 + cm.lv * 10 };
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
    var cands = T.candidates(c);
    if (!cands.length) { await C.say(keeper || master(), '배를 타겠다는 사람 말인가? 지금 이 근방에는 눈에 띄는 자가 없군.'); return; }
    for (;;) {
      var m = await pickMate(c, cands);
      if (!m) return;
      await T.talkMate(c, m);
      cands = T.candidates(c);
      if (!cands.length) return;
    }
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
      var lock = s.player.fame < d.fame, cm = comm(d);
      var row = U.el('div', 'hire-row' + (lock ? ' lock' : ''),
        '<span class="nm">' + U.esc(d.name) + '</span>' +
        '<span class="rt">' + (lock ? '명성 ' + U.num(d.fame) : U.num(d.wage) + '닢') + '</span>' +
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
    var s = S(), cm = comm(m), lock = s.player.fame < m.fame, full = s.mates.length >= G.MAX_MATES;
    var wrap = U.el('div', 'mcard');
    var head = U.el('div', 'mc-head');
    var pf = U.el('div', 'mc-face');
    try { pf.appendChild(A.portraitCanvas(G.Scenes.mateSpec(m.id), 150)); } catch (e) { /* 그림이 없으면 비워 둔다 */ }
    head.appendChild(pf);
    head.appendChild(U.el('div', 'mc-id',
      '<div class="nm">' + U.esc(m.name) + '</div>' +
      '<div class="mt">' + (m.g === 'f' ? '여자' : '남자') + ' · ' + m.reg.map(function (r) { return G.REGIONS[r]; }).join('·') +
      ' · ' + m.y[0] + '~' + m.y[1] + '년</div>' +
      '<div class="mt">필요 명성 <b>' + U.num(m.fame) + '</b>' + (lock ? ' <span class="warn">(모자람 — 지금 내 명성 ' + U.num(s.player.fame) + ')</span>' : '') +
      ' · 월급 <b>금화 ' + U.num(m.wage) + '닢</b></div>' +
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
    var msg = !cm.lv ? '말이 한 마디도 통하지 않아 이야기를 나눌 수 없다.'
      : lock ? '이름이 알려지면 그때 다시 찾아오자.'
      : full ? '부하는 ' + G.MAX_MATES + '명까지만 데리고 다닐 수 있다.'
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
    var s = S(), who = { name: '술 취한 선원', portrait: A.withImg(A.npcSpec('drunk' + c.id + s.day, 'sailor', c.style), G.Img.chain.npc('drunk', c)), lang: C.langLv(c), li: c.lang };
    var v = await UI.ask('술을 마시고 있는 남자가 있다.', [{ label: '한잔 산다', value: 1 }, { label: '무시한다', value: 0 }], {});
    if (!v) return;
    var price = 6 + c.size * 3;
    if (s.player.gold < price) { UI.toast('소지금이 모자랍니다.', 'coin'); return; }
    s.player.gold -= price;
    await UI.say(U.pick(['헤헤, 오늘 좋은 일이 있었는데 기분 좋으니 함께 마시자구.', '으음, 기분 좋군. 여, 자네 말일세. 해 둘 말이 있네.', '헤에, 너무 마셨나. 자네, 좀 더 마시고 싶으니 같이 마십시다.']), who);
    if (who.lang === 0) { await C.mate('무슨 말을 하는 건지 전혀 모르겠습니다.'); return; }
    var roll = U.rand();
    if (roll < 0.55) {
      var d = T.rumour(c);
      if (d) { G.Disc.addHint(d.id, 'tavern:' + c.id); await UI.say('이건 비밀인데 말이야... ' + d.hint, who); UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll'); return; }
    }
    if (roll < 0.8) {
      // price tip
      var t = G.CITY_DATA[U.pick(s.known)], g = t && t.goods.length ? U.pick(t.goods) : null;
      if (g) { await UI.say(t.name + '에서는 ' + G.GOOD[g].name + U.j(G.GOOD[g].name, '이/가').slice(G.GOOD[g].name.length) + ' 싸게 팔린다더군. 한밑천 잡고 싶으면 가 보게.', who); return; }
    }
    await UI.say(U.pick(['바다는 말이야... 넓어... 끄윽.', '내가 젊었을 적에는 말이야, 폭풍 속에서 돛대를 붙잡고...', '쳇, 재미없군.']), who);
  };

  T.challenger = async function (c) {
    var s = S(), who = { name: '거친 사내', portrait: A.withImg(A.npcSpec('brawler' + c.id + s.day, 'soldier', c.style), G.Img.chain.npc('brawler', c)), lang: C.langLv(c), li: c.lang };
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
      if (fm) { s.player.fame += 3; fm.loyal = Math.min(100, (fm.loyal || 70) + 5); await UI.say((ld.how === 'ko' ? '크윽... 부하가 이 정도라니. 자, 가져가라!' : line) + ' (금화 ' + prize + '닢)', who); }
      else { s.player.fame += 5; await UI.say(line + ' (금화 ' + prize + '닢)', who); }
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
      var st = s.disc[d.id]; if (st && (st.rival || st.me)) return false;
      // 그 단계에 소문조차 돌지 않으면 (예: 향료제도도 모르는데 지팡그) 아직 나타나지 않는다
      var fr = G.Frontier && G.Frontier.of(d); if (fr && G.Frontier.state(fr.id).lv < 1) return false;
      var ry = d.rival[0] + (s.flags['delay_' + d.id] || 0);
      return ry - y >= 0 && ry - y <= 4 && G.REGION_DIST[c.region][0] <= 2;
    })[0] || null;
  };
  T.rival = async function (c) {
    var s = S(), d = T.rivalHere(c); if (!d) return;
    var nm = d.rival[2];
    var who = { name: nm, portrait: A.rivalSpec(nm), lang: 3 };
    await UI.say('항해자 같은 남자가 있다. …' + nm + '이라는 사람인 것 같다.', {});
    for (;;) {
      var v = await UI.ask('무슨 용건인가?', [{ label: '정보를 듣는다', value: 'info' }, { label: '일기토를 신청한다', value: 'duel' }, { label: '떠난다', value: null }], who);
      if (!v) return;
      if (v === 'info') { await UI.say('나는 곧 큰 항해를 떠날 걸세. ' + d.hint, who); if (G.Disc.addHint(d.id, 'rival')) UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll'); continue; }
      var px = G.Games.proxy(), pd = px && G.MATE[px.id];
      var fv = await UI.ask('일기토를 신청합니다. 누가 나섭니까?', [{ label: '내가 싸운다', value: 1 }].concat(pd ? [{ label: '부관 ' + pd.name + '에게 맡긴다', value: 2 }] : []).concat([{ label: '그만둔다', value: 0 }]), { name: s.player.name, portrait: s.player.portrait });
      if (!fv) continue;
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
      return;
    }
  };

  // ---------------------------------------------------------------- barmaid
  T.maid = async function (c, m) {
    var s = S(), st = s.maids[m.id] || (s.maids[m.id] = { aff: 0, met: 0 }), who = T.maidSpeaker(m), like = G.LIKES[m.like];
    st.met++;
    if (s.player.wife === m.id) { await UI.say('어머, 당신! 여기서 뭐 해요? 집에서 기다릴게요.', who); return; }
    var greet = st.aff < 20 ? '어서 오세요. 처음 뵙는 분이네요.' : st.aff < 50 ? '어머, 또 오셨네요!' : st.aff < 80 ? '와 주셨군요! 기다리고 있었어요.' : '당신 얼굴을 보니 정말 기뻐요.';
    await UI.say(greet, who);
    for (;;) {
      var v = await UI.ask(m.name + ' — 호감 ' + heart(st.aff), [
        { label: '한잔 산다', value: 'drink' }, { label: '이야기한다', value: 'talk' }, { label: '선물한다', value: 'gift' },
        { label: '청혼한다', value: 'wed', dis: !(st.aff >= 90) }, { label: '돌아간다', value: null }], who);
      if (!v) return;
      if (v === 'drink') {
        var pr = 10 + c.size * 5; if (s.player.gold < pr) { UI.toast('소지금이 모자랍니다.', 'coin'); continue; }
        s.player.gold -= pr;
        var today = U.dateNum(s.date); if (st.last === today) { await UI.say('오늘은 벌써 많이 마셨어요. 또 와 주세요.', who); continue; }
        st.last = today; var gain = 2 + likeBonus(like);
        st.aff = Math.min(100, st.aff + gain);
        await UI.say(U.pick(['고마워요! 건배!', '어머, 저한테요? 잘 마실게요.', '당신이랑 마시니까 더 맛있네요.']), who);
      } else if (v === 'talk') {
        if (st.aff < 30) await UI.say('저는 ' + like.name + ' 남자가 좋아요. ' + (m.like === 'generous' ? '역시 남자는 통이 커야죠.' : '그런 사람이 이상형이에요.'), who);
        else {
          var d = U.chance(0.5) ? T.rumour(c) : null;
          if (d) { G.Disc.addHint(d.id, 'tavern:' + c.id); await UI.say('손님들이 이런 이야기를 하더라고요. ' + d.hint, who); UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll'); }
          else await UI.say(U.pick(['바다 너머에는 뭐가 있을까요? 언젠가 저도 가 보고 싶어요.', '항해 이야기 더 들려주세요!', '몸조심하세요. 바다는 무서운 곳이니까요.']), who);
        }
      } else if (v === 'gift') {
        // 아직 보고·발표하지 않은 발견의 유물(증거)은 선물로 내놓지 않는다
        var gifts = s.player.items.filter(function (it) { return G.ITEM[it.id] && G.ITEM[it.id].kind === 'gift' && !G.ITEM[it.id].ring && !R.isProof(it); });
        if (!gifts.length) { UI.toast('선물할 장신구가 없습니다. 시장에서 살 수 있습니다.' + (s.player.items.some(function (it) { return G.ITEM[it.id] && G.ITEM[it.id].kind === 'gift' && R.isProof(it); }) ? ' (발견의 증거인 장신구는 보고·발표한 뒤에 선물할 수 있습니다)' : ''), 'info'); continue; }
        var gi = await UI.choose('선물', gifts.map(function (it, i) { return { label: G.ITEM[it.id].name + (G.RELIC && G.RELIC[it.id] ? ' <span class="tag">유물</span>' : ''), right: '♥' + G.ITEM[it.id].gv, value: i, icon: 'heart' }; }), { width: 460 });
        if (gi == null) continue;
        var it = gifts[gi]; s.player.items.splice(s.player.items.indexOf(it), 1);
        st.aff = Math.min(100, st.aff + G.ITEM[it.id].gv + likeBonus(like) + R.skill('craft'));
        await UI.say(U.pick(['어머, 이렇게 고운 걸 저에게요? 정말 고마워요!', '예뻐라! 소중히 간직할게요.']), who);
      } else if (v === 'wed') {
        if (!R.hasItem('ring')) { UI.toast('청혼하려면 약속 반지가 필요합니다.', 'ring'); continue; }
        if (s.player.wife) { UI.toast('이미 결혼했습니다.', 'ring'); continue; }
        var ok = await UI.confirm(m.name + '에게 청혼하겠습니까?', '청혼한다', '그만둔다');
        if (!ok) continue;
        R.removeItem('ring');
        await UI.say('...정말요? 저, 저라도 괜찮다면... 네, 기꺼이!', who);
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
      var i = await UI.choose('부하편성', s.mates.map(function (m, k) { var d = G.MATE[m.id]; return { label: d.name, right: roleName(m), value: k, icon: 'people', desc: skillLine(d) + ' — ' + d.desc }; }), { width: 620, text: '역할을 바꿀 동료를 고르십시오. 기함의 부관·항해사·측량사·통역·경리는 한 명씩이고(경리는 회계로 교역소·시장·후원자 앞에서 값을 후려친다), 기함 말고 다른 배에는 선장을 한 명씩 둘 수 있습니다. 선장의 항해술·포술·검술·조선기술은 그 배에만 쓰입니다.' });
      if (i == null) return;
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
  };
})(window.G = window.G || {});
