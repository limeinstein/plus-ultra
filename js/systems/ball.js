/* 무도회 · 데뷔탕트 (G.Ball) — 자료·대사·조정값: js/data/ball.js (G.BALL_LADIES · G.BALL_LINES · G.BALANCE.ball) — 2026-11-03 사용자 요청
   ■ 언제: 작위를 하나라도 받으면(G.Court.best()) 자택 메뉴에 「무도회를 연다」(gap일에 한 번, 비용은 작위가 높을수록 크다).
     열다섯~열일곱 살 딸이 집에 있으면 「데뷔탕트를 준비한다」 — 딸마다 한 번, 드레스를 골라 그 딸을 위한 무도회를 연다.
     처음 작위를 받고 집에 들르면 집사가, 딸이 데뷔할 나이가 되면 아내가 귀띔한다.
   ■ 무도회 한 번
     ① 손님 아가씨 guests명(데뷔탕트 guestsDebut명)이 온다 — 「미인 갤러리」의 미인들과 합스부르크 대공녀들(시대를 앞당겨 언제든).
     ② (데뷔탕트) 딸이 계단을 내려온다 — 딸의 매력·드레스·아버지와의 사이로 점수. belle 이상이면 「사교계의 꽃」 → 열여덟 살 혼례에서 왕궁의 청혼이 쉬워진다(js/systems/kidwed.js).
     ③ 아가씨 하나가 다가와 제독(남자 제독)이나 다 자란 아들을 꼬신다. 제독은 춤·바다 이야기·정치와 학문·음악 가운데 하나로 다가간다 —
        아가씨마다 좋아하는 것이 있어 그것이면 호감이 크게 오른다. 아들을 소개해 아들 쪽으로 돌릴 수도 있다.
        · 시기: 한 아가씨를 아끼면 그 맞수가 시샘한다(envy). 아내가 있으면 아내도 시샘한다(정 −).
        · 정치: 아끼면 그 아가씨 나라 군주의 신뢰 +, 혼인하면 크게 +, 청혼을 물리치면 −, 혼인하면 맞수의 나라는 −.
     ④ 시샘이 envyScheme 넘게 쌓인 아가씨가 손님 가운데 있으면 일을 꾸민다 — 뒷말·고자질·술잔 엎기·토라짐. 맞받아치거나 달래거나 모른 척한다.
     ⑤ 초대받지 못한 마녀(엉겅퀴 마녀 그리젤다)가 쳐들어온다 (witch · 데뷔탕트 witchDebut · witchSure번 안 오면 반드시) —
        춤을 청하거나, 사과하고 상석을 내주거나, 칼로 맞서 감명을 주면 동료가 되기를 청한다. 위병으로 내쫓으면 망친다.
     ⑥ 호감이 affWed에 이른 아가씨는 청혼한다 — 제독이 혼자면 본처, 아내가 있으면 둘째 부인(그 아가씨 고장에 집), 아들이면 아들의 신부.
        아들의 신부는 집에서 기다리다가 그 아들이 뒤를 이으면 새 제독의 아내가 된다(js/systems/family.js F.succeed).
   ■ 저장: state.ball = { n, last, hinted, witch: {tries, fails, joined}, ladies: {id: {aff, envy, met, tgt: 'p'|'s', wed: 'p'|'s'}} }
           딸 k.debut = {y, belle, score} · k.debutHinted · 아들 k.bride = {id, y}
     옛 저장에는 없다 — 쓸 때 만든다. 아가씨는 G.MAID에도 오른다(아내가 되면 다른 아내와 똑같이 — 술집에는 나오지 않는다). */
(function (G) {
  'use strict';
  var U = G.U, BL = {};
  G.Ball = BL;
  function S() { return G.Game && G.Game.state; }
  function K() { return G.BALANCE.ball; }
  function L() { return G.BALL_LINES; }
  function UI() { return G.UI; }
  function R() { return G.R; }

  // 아내가 될 수 있도록 G.MAID에 올린다 (그림: portraits/maids/<id> → 없으면 궁정 공주 그림)
  G.BALL_LADIES.forEach(function (l) {
    if (G.MAID && !G.MAID[l.id]) G.MAID[l.id] = { id: l.id, city: l.city, name: l.name, like: 'brave', lady: true, pic: 'portraits/princesses/court_princess_' + l.pic };
  });

  function st() {
    var s = S(), b = s.ball || (s.ball = { n: 0, last: null, ladies: {}, witch: { tries: 0, fails: 0 } });
    b.ladies = b.ladies || {}; b.witch = b.witch || { tries: 0, fails: 0 };
    return b;
  }
  BL.state = st;
  function rec(id) { var b = st(); return b.ladies[id] || (b.ladies[id] = { aff: 0, envy: 0, met: 0 }); }
  BL.rec = rec;

  // ---------------------------------------------------------------- 누가 · 언제
  BL.best = function () { return G.Court && G.Court.best ? G.Court.best() : null; };
  BL.noble = function () { return !!BL.best(); };
  function rankN() { var t = BL.best(); return t ? t.n : 0; }
  BL.cost = function () { var k = K(); return k.cost[0] + k.cost[1] * rankN(); };
  BL.left = function () { var b = st(), s = S(); return b.last == null ? 0 : Math.max(0, b.last + K().gap - s.day); };
  function callName() { var t = BL.best(); return t && t.call ? t.call + '님' : '제독님'; }
  function male() { var p = S().player; return p.g !== 'f' && !(p.heir && p.heir.sex === 'f'); }   // 뒤를 이은 딸 제독은 p.g 가 비어 있다 (princess.js와 같게)
  function single() { var p = S().player; return !p.wife && male(); }
  function playerCanWed() { return male() && (!S().player.wife || (G.Wives && G.Wives.canMarry())); }
  function age(k) { return G.Family.kidAge(k); }
  /** 꼬실 수 있는 아들: 다 자랐고, 신부가 없다 */
  BL.sons = function () {
    var ad = (G.BALANCE.family && G.BALANCE.family.adult) || 16;
    return (S().player.kids || []).filter(function (k) { return k.sex !== 'f' && !k.unnamed && !k.lost && !k.bride && !k.away && age(k) >= ad; })
      .sort(function (a, b) { return age(b) - age(a); });
  };
  /** 데뷔탕트를 치를 딸: 열다섯~열일곱, 자택에 산다, 아직 데뷔하지 않았다 */
  BL.debutKids = function () {
    var a = K().debutAge;
    return (S().player.kids || []).filter(function (k) { return k.sex === 'f' && !k.unnamed && !k.lost && !k.married && !k.debut && k.house == null && age(k) >= a[0] && age(k) <= a[1]; });
  };

  // ---------------------------------------------------------------- 말하는 사람
  function fill(t, x) {
    var s = S(), o = { P: s.player.name, call: callName() };
    for (var key in x || {}) o[key] = x[key];
    return String(t).replace(/\{([A-Za-z]+)([^}]*)\}/g, function (all, key, pair) {
      if (o[key] == null) return all;
      var w = String(o[key]); return pair ? U.j(w, pair) : w;
    });
  }
  BL.fill = fill;
  function ladySp(l, emo) {
    var A = G.Art, key = 'portraits/maids/' + l.id, pk = 'portraits/princesses/court_princess_' + l.pic;
    var sp = { name: l.name, portrait: A.withImg(A.npcSpec('ball:' + l.id, 'noble', l.style, 'f'), [key, pk]), half: [key + '_half', pk + '_half'], lang: 3, special: true, emotion: emo || null };
    var T = G.Scenes.city && G.Scenes.city.B.tavern;
    return T && T.duo ? T.duo(sp, emo || 'warm') : sp;
  }
  BL.ladySp = ladySp;
  function butler() {
    var c = G.CITY_DATA[S().player.home] || G.CITY_DATA[0], A = G.Art;
    return { name: '집사', portrait: A.withImg(A.npcSpec('ball_butler_' + c.id, 'official', G.Img.folkStyle(c), 'm'), []), lang: 3 };
  }
  function witchSp(emo) {
    var id = G.BALL_WITCH.id;
    return { name: G.MATE[id].name, portrait: G.Art.mateSpec(id), half: G.Img.chain.mateHalf ? G.Img.chain.mateHalf(id) : null, lang: 3, special: true, emotion: emo || null };
  }
  function kidSp(k) { return G.HomeLife && G.HomeLife.speaker ? G.HomeLife.speaker(k) : { name: k.name }; }
  function wifeSp() { return S().player.wife ? G.Family.wifeSpeaker() : null; }
  function say(t, who, x) { return UI().say(fill(t, x), who || {}); }
  async function sayAll(list, who, x) { list = [].concat(list || []); for (var i = 0; i < list.length; i++) await say(list[i], who, x); }
  function pic(key, title) {
    if (!G.FamEv || !G.FamEv.showPic) return null;
    try { return G.FamEv.showPic({ img: key, title: title, noStand: true }); } catch (e) { return null; }
  }
  async function stopPic(p) { if (p && p.stop) { try { await p.stop(); } catch (e) { /* */ } } }

  // ---------------------------------------------------------------- 정치: 그 나라 군주의 신뢰
  function realmSponsor(realmId) {
    var r = realmId && G.COURT && G.COURT.realms[realmId], id = r && r.sponsors && r.sponsors[0];
    return id && G.SPONSOR && G.SPONSOR[id] || null;
  }
  function trust(realmId, n, out) {
    var sp = realmSponsor(realmId), SP = G.Sponsor; if (!sp || !SP || !SP.rel || !n) return;
    SP.addTrust(SP.rel(sp.id), n);
    if (out) out.push((G.COURT.realms[realmId].name) + ' 군주의 신뢰 ' + (n > 0 ? '+' : '') + n);
  }
  BL.trust = trust;
  function fame(n, out, why) {
    var got = G.Fame.add('so', n);
    if (out && got) out.push((why ? why + ' — ' : '') + '사교 명성 ' + (got > 0 ? '+' : '') + got);
    return got;
  }

  // ---------------------------------------------------------------- 손님
  function free(l) { var r = rec(l.id); return !r.wed; }
  function pickGuests(n) {
    var pool = G.BALL_LADIES.filter(free), out = [];
    while (out.length < n && pool.length) {
      var tot = 0, w = pool.map(function (l) { var r = rec(l.id), x = 1 + (r.aff > 0 ? 1.5 : 0) + (r.envy > 0 ? 0.8 : 0); tot += x; return x; });
      var roll = U.rand() * tot, i = 0;
      for (; i < pool.length - 1; i++) { roll -= w[i]; if (roll <= 0) break; }
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }
  BL.pickGuests = pickGuests;

  /** 메뉴 (자택) */
  BL.menuItem = function (c) {
    if (!BL.noble() || S().regency) return null;
    var left = BL.left();
    return { label: '무도회를 연다', icon: 'note', sub: left > 0 ? left + '일 뒤에 다시' : '금화 ' + U.num(BL.cost()) + '닢', dim: left > 0, onClick: function () { return BL.host(c); } };
  };
  BL.debutItem = function (c) {
    if (!BL.noble() || S().regency) return null;
    var ks = BL.debutKids(); if (!ks.length) return null;
    return { label: '데뷔탕트를 준비한다', icon: 'star', sub: ks.map(function (k) { return G.Family.given(k); }).join('·'), onClick: function () { return BL.debut(c); } };
  };

  /** 자택에 들어설 때: 집사·아내의 귀띔 (한 번씩) */
  BL.homeHint = async function (c) {
    var s = S(); if (!BL.noble() || s.regency) return;
    var b = st();
    if (!b.hinted && !b.n) { b.hinted = true; await say(L().butlerHint, butler()); return; }
    var k = BL.debutKids().filter(function (x) { return !x.debutHinted; })[0];
    if (k && s.player.wife) { k.debutHinted = true; await say(L().wifeDebutHint, wifeSp(), { d: G.Family.given(k) }); }
  };

  // ---------------------------------------------------------------- 무도회
  /** opts: {debut: 딸, dress: 0~2} — 데뷔탕트는 BL.debut에서 값을 치르고 부른다 */
  BL.host = async function (c, opts) {
    opts = opts || {};
    var s = S(), b = st(), k = K(), Ln = L(), out = [];
    if (!BL.noble() || BL.running) return false;
    if (!opts.debut) {
      var left = BL.left();
      if (left > 0) { UI().toast('지난 무도회의 소문이 아직 가라앉지 않았습니다. ' + left + '일 뒤에 다시 열 수 있습니다.', 'note', 4200); return false; }
      var cost = BL.cost();
      if (s.player.gold < cost) { await say('{call}, 무도회를 열려면 금화 ' + U.num(cost) + '닢이 듭니다. 지금은 모자랍니다.', butler()); return false; }
      if (!(await UI().confirm('무도회를 엽니다. 금화 ' + U.num(cost) + '닢이 들고 하루가 지납니다.<br><small class="muted">다른 나라의 공주와 귀족 아가씨들이 옵니다. 초대하지 않은 손님이 올지도 모릅니다.</small>', '연다', '그만둔다'))) return false;
      s.player.gold -= cost;
    }
    b.n = (b.n || 0) + 1; b.last = s.day;
    BL.running = s;
    var guests = BL.pickGuests(opts.debut ? k.guestsDebut : k.guests), shot = null;
    var ctx = { guests: guests, debut: opts.debut || null, dress: opts.dress || 0, out: out, wifeHurt: false, fav: null, score: 0 };
    try {
      shot = pic(opts.debut ? 'events/ball/debut' : 'events/ball/ball_open', opts.debut ? G.Family.given(opts.debut) + '의 데뷔탕트' : '무도회');
      await sayAll(opts.debut ? Ln.openDebut : Ln.open, {}, { d: opts.debut ? G.Family.given(opts.debut) : '' });
      for (var i = 0; i < guests.length; i++) {
        var l = guests[i]; rec(l.id).met++;
        if (S() !== s) return true;
        await say(Ln.herald, butler(), { house: l.house, name: l.name, title: l.title });
        await say(l.lines.entry, ladySp(l));
      }
      if (opts.debut) await debutScene(ctx);
      await spotlight(ctx);
      await scheme(ctx);
      await witch(c, ctx);
      await proposal(ctx);
      if (S() !== s) return true;
      await stopPic(shot); shot = null;
      var royalGuest = G.RoyalCourtship && await G.RoyalCourtship.ball();
      if (S() !== s) return true;
      await say(Ln.closing, {});
      fame(k.fame[0] + k.fame[1] * rankN() + (opts.debut ? 100 : 0), out, opts.debut ? '데뷔탕트' : '무도회');
      if (s.player.wife && !ctx.wifeHurt) s.player.wifeLove = Math.min(100, (s.player.wifeLove == null ? 70 : s.player.wifeLove) + 3);
      var names = guests.map(function (x) { return x.short; });
      if (royalGuest) names.push(royalGuest.name);
      G.State.log((opts.debut ? G.Family.given(opts.debut) + '의 데뷔탕트 무도회를 열었다' : '자택에서 무도회를 열었다') +
        (names.length ? ' — ' + names.join('·') + U.jx(names[names.length - 1], '이/가') + ' 왔다.' : '.'));
      await UI().fade(function () { G.Game.passDays(1); });
      if (S() !== s) return true;
      if (G.Game.refreshHud) G.Game.refreshHud();
      if (out.length) await UI().alert(out.map(function (x) { return '· ' + U.esc(x); }).join('<br>'), opts.debut ? '데뷔탕트를 마치고' : '무도회를 마치고');
      return true;
    } finally { await stopPic(shot); if (BL.running === s) BL.running = null; }
  };

  // ---------------------------------------------------------------- ② 데뷔탕트
  BL.debut = async function (c) {
    var s = S(), k = K(), Ln = L(), ks = BL.debutKids(); if (!ks.length || BL.running) return false;
    var kid = ks[0];
    if (ks.length > 1) {
      var ki = await UI().choose('데뷔탕트를 치를 딸', ks.map(function (x, i) { return { label: G.Family.given(x), right: age(x) + '살', value: i, icon: 'star' }; }), { width: 520 });
      if (ki == null) return false; kid = ks[ki];
    }
    var nm = G.Family.given(kid), base = BL.cost();
    var v = await UI().ask(fill(Ln.dressAsk, { d: nm }), k.dress.map(function (g, i) { return { label: Ln.dressOpts[i], right: '금화 ' + U.num(g + base) + '닢', value: i }; }).concat([{ label: '다음에', value: -1 }]), {});
    if (v == null || v < 0) return false;
    var cost = base + k.dress[v];
    if (s.player.gold < cost) { await say('{call}, 금화 ' + U.num(cost) + '닢이 모자랍니다 (드레스와 무도회 비용).', butler()); return false; }
    s.player.gold -= cost;
    return BL.host(c, { debut: kid, dress: v });
  };
  async function debutScene(ctx) {
    var kid = ctx.debut, k = K(), Ln = L(), nm = G.Family.given(kid), x = { d: nm };
    await say(Ln.debutStep, {}, x);
    var kst = kid.st || {}, bond = G.Family.bond(kid), msk = (kid.sk && kid.sk.music) || 0;
    var score = Math.round((kst.cha || 50) * 0.6 + k.dressScore[ctx.dress || 0] + bond * 0.2 + (R().stat('cha') || 50) * 0.1 + msk * 4 + U.ri(-8, 8));
    ctx.score = score;
    var belle = score >= k.belle;
    await sayAll(belle ? Ln.debutBelle : score >= k.belle - 15 ? Ln.debutGood : Ln.debutPlain, {}, x);
    // 시샘하는 아가씨 — 뒷말·고자질을 하는 사람이 먼저
    var jl = ctx.guests.filter(function (l) { return l.scheme === 'gossip' || l.scheme === 'politics'; })[0];
    if (jl && belle) { await say(Ln.debutEnvy, ladySp(jl, 'angry'), x); rec(jl.id).envy += 1; }
    kid.debut = { y: S().date.y, belle: belle, score: score };
    G.Family.addBond(kid, 5);
    await say(Ln.kidThanks, kidSp(kid));
    ctx.out.push(nm + '의 데뷔 — ' + (belle ? '「사교계의 꽃」 (열여덟 살 혼례에서 왕궁의 청혼이 쉬워진다)' : '무사히 마쳤다') + ' · 점수 ' + score + ' · 아버지와의 사이 +5');
  }

  // ---------------------------------------------------------------- ③ 아가씨가 다가온다
  function sonByName(name) { return BL.sons().filter(function (k) { return k.name === name; })[0] || null; }
  function gainOf(l, ap, who) {
    var a = K().aff, d = G.BALL_APPROACH[ap], stat, skill;
    if (who) { stat = (who.st && who.st[d.stat]) || 50; skill = (who.sk && who.sk[d.skill]) || 0; }
    else { stat = R().stat(d.stat) || 50; skill = R().skill(d.skill) || 0; }
    return Math.max(1, Math.round((a.base + stat * a.stat + skill * a.skill) * (l.like === ap ? a.like : a.other)));
  }
  BL.gainOf = gainOf;
  async function spotlight(ctx) {
    var s = S(), Ln = L(), k = K(), guests = ctx.guests; if (!guests.length) return;
    var sons = BL.sons(), canP = playerCanWed();
    if (!canP && !sons.length) return;   // 꼬실 사람이 없다 (여자 제독에 다 자란 아들이 없음 · 배우자 자리가 가득)
    // 호감이 쌓인 아가씨가 먼저 다가온다
    var by = guests.slice().sort(function (a, b) { return rec(b.id).aff - rec(a.id).aff; });
    var l = by[0] && rec(by[0].id).aff > 0 && U.chance(0.7) ? by[0] : U.pick(guests), r = rec(l.id);
    var son = r.tgt === 's' && r.son ? sonByName(r.son) : null;
    var tgt = r.tgt === 's' && son ? 's' : r.tgt === 'p' && canP ? 'p' : null;
    if (!tgt) { tgt = canP && (!sons.length || single() || U.chance(0.5)) ? 'p' : 's'; son = tgt === 's' ? sons[0] : null; }
    var x = { son: son ? son.name : '', name: l.short };
    await say(tgt === 'p' ? l.lines.flirtP : l.lines.flirtS, ladySp(l, 'warm'), x);
    // 고를 것: 좋아하는 것 + 다른 둘 (섞어서) · 아들 소개 · 물러서기
    var aps = Object.keys(G.BALL_APPROACH), others = U.shuffle ? U.shuffle(aps.filter(function (a) { return a !== l.like; })) : aps.filter(function (a) { return a !== l.like; });
    var shown = [l.like].concat(others.slice(0, 2));
    if (U.shuffle) shown = U.shuffle(shown); else shown.sort(function () { return U.rand() - 0.5; });
    var opts = shown.map(function (a) { var d = G.BALL_APPROACH[a]; return { label: tgt === 's' ? son.name + '에게 — ' + d.label : d.label, value: a }; });
    if (tgt === 'p' && sons.length) opts.push({ label: fill(Ln.introduceSon, { son: sons[0].name }), value: 'son' });
    opts.push({ label: Ln.stepBack, value: 'back' });
    var v = await UI().ask(fill(Ln.approachAsk, { name: l.short }), opts, {});
    if (S() !== s) return;
    if (v === 'back' || v == null) { r.aff = Math.max(0, r.aff - 3); await say(Ln.stepBackLine, ladySp(l, 'sad')); return; }
    if (v === 'son') {
      tgt = 's'; son = sons[0]; x.son = son.name;
      await say(l.lines.flirtS, ladySp(l, 'warm'), x);
      v = await UI().ask(fill(Ln.approachAsk, { name: l.short }), shown.map(function (a) { return { label: son.name + '에게 — ' + G.BALL_APPROACH[a].label, value: a }; }), {});
      if (S() !== s || v == null) return;
    }
    r.tgt = tgt; if (tgt === 's') r.son = son.name; else delete r.son;
    var g = gainOf(l, v, tgt === 's' ? son : null);
    r.aff = Math.min(k.affWed, r.aff + g);
    ctx.fav = l;
    await say(v === l.like ? l.lines.happy : l.lines.cool, ladySp(l, v === l.like ? 'happy' : 'neutral'), x);
    ctx.out.push(l.short + '의 호감 +' + g + ' (' + r.aff + '/' + k.affWed + (tgt === 's' ? ' · ' + son.name + '에게' : '') + ')' + (v === l.like ? ' — 좋아하는 것을 알아맞혔다' : ''));
    trust(l.realm, k.trust.favor, ctx.out);
    // 시기: 맞수
    var rv = l.rival && G.BALL_LADY[l.rival];
    if (rv && free(rv)) {
      rec(rv.id).envy += 1;
      if (guests.indexOf(rv) >= 0) await say(rv.lines.envy, ladySp(rv, 'angry'), { name: rv.short });
      ctx.out.push(rv.short + '의 시샘 +1 (맞수 ' + l.short + U.jx(l.short, '을/를') + ' 아꼈다)');
    }
    // 시기: 아내
    if (tgt === 'p' && s.player.wife && g >= 10) {
      var w = wifeSp(); ctx.wifeHurt = true;
      s.player.wifeLove = Math.max(0, (s.player.wifeLove == null ? 70 : s.player.wifeLove) - k.wifeJealous);
      if (w) await sayAll(L().wifeJealous, w);
      ctx.out.push('아내가 시샘했다 — 아내의 정 −' + k.wifeJealous);
    }
  }

  // ---------------------------------------------------------------- ④ 꾸밈 (시기와 질투, 정치질)
  async function scheme(ctx) {
    var s = S(), k = K(), Ln = L();
    var l = ctx.guests.filter(function (x) { return rec(x.id).envy >= k.envyScheme; }).sort(function (a, b) { return rec(b.id).envy - rec(a.id).envy; })[0];
    if (!l) return;
    var r = rec(l.id), rv = l.rival && G.BALL_LADY[l.rival], x = { rival: rv ? rv.short : '', name: l.short };
    await say(l.lines.scheme, l.scheme === 'gossip' ? {} : ladySp(l, 'angry'), x);
    var O = Ln.schemeOpts;
    var v = await UI().ask(fill(Ln.schemeAsk, x), [{ label: O.counter, value: 'counter' }, { label: fill(O.soothe, x), value: 'soothe' }, { label: O.ignore, value: 'ignore' }], {});
    if (S() !== s) return;
    if (v === 'soothe') {
      r.envy = 0; r.aff = Math.min(k.affWed, r.aff + 6);
      if (rv && free(rv)) rec(rv.id).aff = Math.max(0, rec(rv.id).aff - 4);
      await say(Ln.sootheLine, ladySp(l, 'shy'));
      ctx.out.push(l.short + U.jx(l.short, '을/를') + ' 달랬다 — 호감 +6' + (rv ? ' · ' + rv.short + '의 호감 −4' : ''));
      return;
    }
    var mult = 1;
    if (v === 'counter') {
      var ch = U.clamp(0.35 + (R().skill('speech') || 0) * 0.15 + ((R().stat('cha') || 50) - 50) / 200, 0.1, 0.9);
      if (U.chance(ch)) { r.envy = 0; await say(Ln.counterWin, {}); fame(40, ctx.out, l.short + '의 꾀를 웃음으로 넘겼다'); return; }
      await say(Ln.counterLose, {}); mult = 1.5;
    }
    r.envy = 0;
    if (l.scheme === 'gossip') fame(-Math.round(k.gossip * mult), ctx.out, l.short + '의 뒷말');
    else if (l.scheme === 'politics') {
      var realm = l.realm || homeRealm();   // 나라가 없는 아가씨(무희·구두장이 딸)는 제독 나라의 궁정에 고자질한다
      trust(realm, Math.round(k.trust.politics * mult), ctx.out);
      if (!realmSponsor(realm)) fame(-Math.round(k.gossip * mult), ctx.out, l.short + '의 고자질');
    } else if (l.scheme === 'spill') {
      if (rv && free(rv)) { var lost = Math.round(8 * mult); rec(rv.id).aff = Math.max(0, rec(rv.id).aff - lost); ctx.out.push(rv.short + U.jx(rv.short, '이/가') + ' 망신을 당했다 — 호감 −' + lost); }
    } else { var l2 = Math.round(8 * mult); r.aff = Math.max(0, r.aff - l2); ctx.out.push(l.short + U.jx(l.short, '이/가') + ' 토라져 먼저 돌아갔다 — 호감 −' + l2); }
  }
  function homeRealm() {
    var nat = S().player.nation, rs = G.COURT && G.COURT.realms;
    for (var id in rs || {}) if (rs[id].nation === nat) return id;
    return null;
  }

  // ---------------------------------------------------------------- ⑤ 초대받지 못한 마녀
  BL.witchJoined = function () { var id = G.BALL_WITCH.id, s = S(); return s.mates.some(function (m) { return m.id === id; }) || !!s.flags['wed_' + id] || !!st().witch.joined; };
  async function witch(c, ctx) {
    var s = S(), k = K(), b = st(), Ln = L(), w = b.witch;
    if (BL.witchJoined()) return;
    if (BL.forceWitch === 'none') return;
    var ch = ctx.debut ? k.witchDebut : k.witch;
    if (!(w.tries + 1 >= k.witchSure || U.chance(ch) || BL.forceWitch)) { w.tries++; return; }
    w.tries = 0;
    var shot = pic('events/ball/witch', '초대받지 못한 손님');
    try {
      await say(Ln.witchCome[0], {});
      await say(Ln.witchCome[1], witchSp('happy'));
      await say(Ln.witchCome[2], {});
      if (ctx.debut) await say(Ln.witchDebut, witchSp('happy'), { d: G.Family.given(ctx.debut) });
      await say(Ln.witchMenace, witchSp());
      var O = Ln.witchOpts;
      var v = await UI().ask(Ln.witchAsk, [{ label: O.dance, value: 'dance' }, { label: O.talk, value: 'talk' }, { label: O.duel, value: 'duel' }, { label: O.guard, value: 'guard' }], {});
      if (S() !== s) return;
      var win = false, cha = R().stat('cha') || 50;
      if (v === 'dance') win = U.chance(U.clamp(0.3 + (cha - 50) / 100 + (R().skill('music') || 0) * 0.12, 0.1, 0.95));
      else if (v === 'talk') win = U.chance(U.clamp(0.3 + (cha - 50) / 120 + (R().skill('speech') || 0) * 0.15, 0.1, 0.95));
      else if (v === 'duel') {
        if (G.Games && G.Games.duel && !BL.noDuel) {
          var m = G.MATE[G.BALL_WITCH.id];
          var res = await G.Games.duel({ name: m.name, portrait: G.Art.mateSpec(m.id), look: 'rival', str: m.st[0], atk: 10, def: 6, skill: 2, mar: m.st[2], int: m.st[1], cha: m.st[3], style: 'ne' }, { place: 'city', noSwap: true });
          win = res === 'win';
        } else win = U.chance(U.clamp(0.3 + (R().skill('sword') || 0) * 0.18, 0.1, 0.9));
      }
      if (S() !== s) return;
      if (BL.forceWitch === 'win') win = true; else if (BL.forceWitch === 'lose') win = false;
      if (win) {
        await sayAll(v === 'dance' ? Ln.witchDanceWin : v === 'talk' ? Ln.witchTalkWin : Ln.witchDuelWin, witchSp('happy'));
        fame(80, ctx.out, '마녀의 소동을 멋지게 넘겼다');
        await say(Ln.witchJoin, witchSp('shy'));
        var ok = BL.autoJoin != null ? BL.autoJoin : await UI().confirm(fill(Ln.witchJoinAsk, { witch: G.BALL_WITCH.name }) + ' (월급 금화 ' + U.num(G.MATE[G.BALL_WITCH.id].wage) + '닢)', '동료로 맞는다', '다음에');
        if (ok && G.Legend && G.Legend.join) {
          var j = G.Legend.join(G.BALL_WITCH.id, c);
          if (j) { j.loyal = 85; w.joined = true; ctx.out.push(G.BALL_WITCH.name + ' — 동료가 되었다'); G.State.log('무도회에 쳐들어온 ' + G.BALL_WITCH.name + U.jx(G.BALL_WITCH.name, '이/가') + ' 제독에게 감명받아 동료가 되었다.'); }
        } else await say(Ln.witchJoinNo, witchSp());
      } else {
        await sayAll(Ln.witchFail, witchSp('happy'));
        if (ctx.debut) { await say(Ln.witchFailDebut, {}, { d: G.Family.given(ctx.debut) }); if (ctx.debut.debut) { ctx.debut.debut.score -= 15; ctx.debut.debut.belle = ctx.debut.debut.score >= k.belle; } }
        w.fails = (w.fails || 0) + 1;
        ctx.guests.forEach(function (l) { var r = rec(l.id); r.aff = Math.max(0, r.aff - 3); });
        fame(-k.witchFail, ctx.out, '마녀가 무도회를 망쳤다');
        ctx.out.push(Ln.witchNote);
      }
    } finally { await stopPic(shot); }
  }

  // ---------------------------------------------------------------- ⑥ 청혼
  async function proposal(ctx) {
    var s = S(), k = K(), Ln = L();
    var l = ctx.guests.filter(function (x) { var r = rec(x.id); return free(x) && r.aff >= k.affWed && (r.tgt === 'p' ? playerCanWed() : r.tgt === 's' && !!sonByName(r.son)); })
      .sort(function (a, b) { return rec(b.id).aff - rec(a.id).aff; })[0];
    if (!l) return;
    var r = rec(l.id), son = r.tgt === 's' ? sonByName(r.son) : null, x = { son: son ? son.name : '', name: l.short, city: (G.CITY_DATA[l.city] || {}).name || '' };
    var shot = pic('events/ball/proposal', l.short + '의 청혼');
    try {
      await say(son ? l.lines.proposeS : l.lines.proposeP, ladySp(l, 'shy'), x);
      if (son) { await say(Ln.sonAsk, {}, x); await say(Ln.sonYes, kidSp(son), x); }
      var v = BL.autoWed != null ? (BL.autoWed ? 'yes' : 'no') : await UI().ask(fill(Ln.proposeAsk, x), [{ label: Ln.proposeYes, value: 'yes' }, { label: Ln.proposeNo, value: 'no' }], {});
      if (S() !== s) return;
      if (v !== 'yes') {
        r.aff = 40; r.envy = 0;
        await say(l.lines.refused, ladySp(l, 'sad'));
        trust(l.realm, k.trust.refuse, ctx.out);
        ctx.out.push(l.short + '의 청혼을 사양했다');
        return;
      }
      await wed(l, son, ctx);
    } finally { await stopPic(shot); }
  }
  async function wed(l, son, ctx) {
    var s = S(), p = s.player, k = K(), Ln = L(), r = rec(l.id), x = { name: l.short, city: (G.CITY_DATA[l.city] || {}).name || '' };
    var dowry = k.dowry[l.rank] || 0;
    if (son) {
      son.bride = { id: l.id, y: s.date.y };
      r.wed = 's';
      G.State.log(son.name + U.jx(son.name, '이/가') + ' 무도회에서 만난 ' + l.name + U.jx(l.name, '과/와') + ' 혼약했다. 그가 뒤를 이으면 아내로 맞는다.');
      ctx.out.push(son.name + U.jx(son.name, '과/와') + ' ' + l.name + '의 혼약 — 뒤를 이으면 아내가 된다');
    } else if (!p.wife) {
      p.wife = l.id;
      s.maids = s.maids || {}; s.maids[l.id] = { aff: 100 };
      if (G.Growth) G.Growth.once('wed', 'cha', 1, '혼인 — 한 집안의 가장이 되었다');
      r.wed = 'p';
      G.State.log('무도회에서 만난 ' + l.name + U.jx(l.name, '과/와') + ' 혼인했다.');
      ctx.out.push(l.name + U.jx(l.name, '과/와') + ' 혼인했다 — 자택에서 기다린다');
    } else {
      var W = G.Wives;
      W.list().push({ id: l.id, kind: 'maid', city: l.city, house: true, aboard: false, wed: s.day, no: W.nextNo() });
      s.maids = s.maids || {}; s.maids[l.id] = { aff: 100 };
      r.wed = 'p';
      p.wifeLove = Math.max(0, (p.wifeLove == null ? 70 : p.wifeLove) - 15);
      await say(Ln.married, {}, x);
      G.State.log(l.name + U.jx(l.name, '을/를') + ' ' + W.ordinal(W.list()[W.list().length - 1]) + '으로 맞았다. ' + x.city + '에 집이 생겼다.');
      ctx.out.push(l.name + ' — ' + W.ordinal(W.list()[W.list().length - 1]) + ' (' + x.city + '에 집) · 아내의 정 −15');
    }
    await say(l.lines.wed, ladySp(l, 'happy'));
    if (dowry) { p.gold += dowry; ctx.out.push('지참금 금화 +' + U.num(dowry)); }
    fame(l.rank === 'royal' ? 600 : 300, ctx.out, '혼인');
    trust(l.realm, k.trust.wed, ctx.out);
    var rv = l.rival && G.BALL_LADY[l.rival];
    if (rv && free(rv)) {
      rec(rv.id).envy = 0;
      await say(Ln.rivalWed, {}, { name: rv.short });
      trust(rv.realm, k.trust.rivalWed, ctx.out);
    }
    if (G.Audio) G.Audio.sfx('discover');
    if (G.Game.cityHud) G.Game.cityHud();
  }

  BL._t = { spotlight: spotlight, scheme: scheme, witch: witch, proposal: proposal, debutScene: debutScene, pickGuests: pickGuests };   // 시험용
})(window.G = window.G || {});
