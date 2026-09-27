/* Sponsors: audience, proposals, contracts, reporting. (DKJ3-style negotiation loop, original lines) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var SP = {};
  G.Sponsor = SP;
  function S() { return G.Game.state; }

  SP.holder = function (sp, date) {
    date = date || S().date;
    for (var i = 0; i < sp.holders.length; i++) { var h = sp.holders[i]; if (date.y >= h[0] && date.y < h[1]) return h[2]; }
    return null;
  };
  SP.present = function (sp) { return !!SP.holder(sp); };
  /** 0-based index of the current title holder in sp.holders (-1 when vacant) */
  SP.holderIndex = function (sp, date) {
    date = date || S().date;
    for (var i = 0; i < sp.holders.length; i++) { var h = sp.holders[i]; if (date.y >= h[0] && date.y < h[1]) return i; }
    return -1;
  };
  SP.holderName = function (sp) { return SP.holder(sp) || sp.title; };
  SP.rel = function (id) { var s = S(); return s.sponsors[id] || (s.sponsors[id] = { trust: 20, done: 0, fail: 0, anger: 0, met: 0 }); };
  var HONOR = { king: '폐하', pope: '성하', gov: '각하', noble: '각하', priest: '신부님', official: '각하', scholar: '박사님', merchant: '회장님' };
  SP.honor = function (sp) { return HONOR[sp.type] || '님'; };
  SP.speaker = function (sp) {
    return { name: SP.holderName(sp), portrait: A.sponsorSpec(sp, SP.holderIndex(sp)), lang: SP.langLv(sp) };
  };
  SP.langLv = function (sp) { return Math.max(R.lang(sp.lang), R.lang(G.CITY_DATA[sp.city].lang)); };
  SP.butler = function (sp) { var c = G.CITY_DATA[sp.city]; return { name: '집사', portrait: A.withImg(A.npcSpec('butler_' + sp.id, 'keeper', c.style), G.Img.chain.npc('butler', c)), lang: SP.langLv(sp) }; };
  SP.fameNeed = function (sp) { return G.POWER_FAME[sp.pw] || 0; };
  SP.isRivalNation = function (sp) {
    var n = S().player.nation;
    return (n === 'PT' && sp.nation === 'ES') || (n === 'ES' && sp.nation === 'PT');
  };

  // ---------------------------------------------------------------- audience (palace / mansion)
  /** returns true if the audience goes ahead */
  SP.audience = async function (sp) {
    var s = S(), rel = SP.rel(sp.id), bt = SP.butler(sp);
    if (rel.banned && U.dateNum(s.date) < rel.banned) { await UI.say('만날 수 없는 사람은 만날 수 없습니다. 돌아가 주십시오.', bt); return false; }
    if (SP.langLv(sp) === 0) { await UI.say('……', bt); await G.Scenes.city.mate('말이 통하지 않아서 상대해 주지 않았습니다.'); return false; }
    var need = SP.fameNeed(sp);
    if (s.player.fame < need) {
      // 명성이 모자라 만나지 못해도, 작은 일거리는 집사를 통해 맡고 보고할 수 있다
      if (s.contract && s.contract.sponsor === sp.id && s.contract.small && G.Errand) {
        await UI.say('주인께서 맡기신 일 말씀이시군요. 제가 대신 받아 전해 드리지요.', bt);
        await G.Errand.report(sp, bt);
        return false;
      }
      await UI.say('죄송하지만, ' + SP.holderName(sp) + ' ' + SP.honor(sp) + '께서는 바쁘셔서 만나실 수 없습니다. 다른 날에 와 주십시오.', bt);
      UI.toast('명성치가 모자랍니다. (필요 명성 ' + need + ')', 'laurel');
      var gap = need - s.player.fame;
      var bribe = Math.round(gap * 3 + sp.pw * 300);
      var canBribe = !(gap > need * 0.5 && need > 0);
      var opts = [];
      if (!s.contract && G.Errand) opts.push({ label: '주인께서 맡기실 작은 일이 없는지 묻는다', value: 'errand' });
      if (canBribe) opts.push({ label: '집사에게 뇌물을 준다 (금화 ' + U.num(bribe) + '닢)', value: 1 });
      if (!opts.length) return false;
      opts.push({ label: '포기하고 돌아간다', value: 0 });
      var v = await UI.ask('어떻게 할까?', opts, { name: s.player.name, portrait: s.player.portrait });
      if (v === 'errand') {
        await UI.say('주인께서는 만나실 수 없지만, 믿을 만한 항해자에게 맡길 작은 일이 있다고 하셨습니다. 해내시면 주인께 말씀드려 두지요.', bt);
        await G.Errand.offerDialog(sp, bt);
        return false;
      }
      if (!v) return false;
      if (s.player.gold < bribe) { UI.toast('뇌물에 사용할 금화가 모자랍니다.', 'coin'); return false; }
      s.player.gold -= bribe; G.Game.refreshHud();
      if (U.chance(0.55 + R.skill('speech') * 0.1)) { await UI.say('……어쩔 수 없군요. 주인께 여쭈어 보지요. 무기는 여기서 보관하겠습니다.', bt); }
      else { await UI.say('이런 것을 받을 수는 없습니다. 돌아가 주십시오.', bt); return false; }
    } else {
      if (!rel.met) await UI.say('오래 기다리셨습니다. 제가 ' + SP.holderName(sp) + ' ' + SP.honor(sp) + '의 집사입니다. 무기는 여기서 보관하겠습니다. 그러면 안으로 들어가십시오.', bt);
    }
    rel.met = (rel.met || 0) + 1;
    return true;
  };

  // ---------------------------------------------------------------- proposal / contract
  /** interest score for proposing discovery d */
  function interest(sp, d) {
    var s = S(), st = s.disc[d.id] || {};
    var v = 0;
    if (sp.taste.indexOf(d.cat) >= 0) v += 2.2;
    v += (d.val / 10000);
    v += SP.rel(sp.id).trust / 40;
    v -= Math.min(1.5, (SP.rel(sp.id).fail || 0) * 0.4);    // 계약을 깨거나 실패한 적이 있으면 덜 믿는다
    if (st.rival) v -= 2.5;
    if (d.pw > sp.pw) v -= (d.pw - sp.pw) * 1.3;
    // 가깝고 작은 모험(세력 1 이하, 후원자 도시에서 30° 안)은 취향이 아니어도 해 볼 만하다
    var home = G.CITY_DATA[sp.city];
    if (d.pw <= 1 && d.lon != null && home && d.how !== 'trade' && G.Geo.dist(home.lon, home.lat, d.lon, d.lat) < 30) v += 1.0;
    // 제 나라 항해자의 첫 모험은 조금 더 너그럽게 들어 준다
    if (sp.nation && sp.nation === s.player.nation && !SP.rel(sp.id).done) v += 0.4;
    v += U.rf(-0.8, 0.8);
    return v;
  }
  SP.interest = interest;
  function offerFor(sp, d) {
    var s = S(), c = G.CITY_DATA[sp.city];
    var dist = d.how === 'trade' ? 60 : G.Geo.dist(c.lon, c.lat, d.lon, d.lat);
    var years = U.clamp(Math.round(1 + dist / 45), 1, 6);
    if (d.id === 'circum') years = 5;
    var w = sp.wealth;
    var art = G.Disc.artBonus();     // 그림 솜씨가 좋으면 값을 더 쳐 준다
    var adv = Math.round(d.val * (0.2 + 0.055 * w) / 100) * 100;
    var rew = Math.round(d.val * (0.62 + 0.12 * w) * art / 100) * 100;
    return { advance: Math.max(400, adv), reward: Math.max(1200, rew), years: years };
  }

  SP.propose = async function (sp) {
    var s = S(), who = SP.speaker(sp), rel = SP.rel(sp.id);
    if (s.contract) {
      if (s.contract.sponsor === sp.id) await UI.say('자네와의 약속은 아직 끝나지 않았네. 좋은 소식을 기다리고 있겠네.', who);
      else await UI.say('자네는 이미 다른 분의 후원을 받고 있다고 들었네. 그 일부터 마치고 오게.', who);
      return;
    }
    if (rel.anger > 0 && U.dateNum(s.date) < rel.anger) { await UI.say(s.player.name + ', 용건도 없으면서 무턱대고 방문하는 것은 무례한 일일세. 다음에 오게.', who); return; }
    var first = rel.done ? U.pick(['오오, ' + s.player.name + ', 잘 지냈는가. 또 모험 이야긴가?', '오래간만이군. 이번에는 어떤 모험을 할 작정인가?']) : U.pick(['모험 지원인가. 그래, 무엇을 찾으러 갈 건가?', '호오, 그렇다면 모험 목적을 말해 보게.']);
    await UI.say(first, who);
    // candidate proposals: hinted (not yet found by me), or found-but-unreported
    var list = [];
    Object.keys(s.hints).forEach(function (id) { var d = G.DISC[id]; if (d && !G.Disc.foundByMe(id)) list.push({ d: d, found: false }); });
    G.Disc.unreported().forEach(function (d) { list.push({ d: d, found: true }); });
    if (s.player.fame >= 3000 && !G.Disc.foundByMe('circum') && !s.flags.circDone) list.push({ d: G.DISC.circum, found: false, circ: true });
    if (!list.length) {
      if (G.Errand) { await UI.say('흐음, 아직 가져온 이야기가 없는가? 그렇다면 작은 일부터 맡아 보겠나?', who); await G.Errand.offerDialog(sp, who); return; }
      await UI.say('흐음, 아무 이야기도 없는가? 흥미 있는 이야기를 찾아 오게. 기다리고 있겠네.', who); UI.toast('도서관이나 술집에서 단서를 모으십시오.', 'scroll'); return;
    }
    if (G.Errand) list.push({ errand: true });
    for (var tries = 0; tries < 3; tries++) {
      var tasteTxt = sp.taste.map(function (t) { return G.DISC_CATS[t]; }).join('·');
      var pick = await UI.choose('제안 선택', list.map(function (x, i) {
        if (x.errand) return { label: '작은 일거리를 청한다', right: '해도·조달·소문 확인', value: i, icon: 'seal', desc: '큰 모험 대신 후원자가 맡기는 쉬운 일 — 이름과 신뢰를 쌓는다' };
        return { label: (x.circ ? '세계일주' : x.d.name) + (x.found ? ' <span class="tag">발견 완료</span>' : '') + (x.found && G.Disc.isLate(x.d.id) ? ' <span class="tag">늦은 보고 · 명성 절반</span>' : ''), right: G.DISC_CATS[x.d.cat] + (sp.taste.indexOf(x.d.cat) >= 0 ? ' ★' : ''), value: i, icon: x.found ? 'star' : 'scroll', desc: x.d.hint };
      }), { width: 720, text: SP.holderName(sp) + ' ' + SP.honor(sp) + '의 취향: <b>' + tasteTxt + '</b>' });
      if (pick == null) { await UI.say('뭔가, 용건이 없는가? 이쪽은 바쁘네.', who); return; }
      var x = list[pick], d = x.d;
      if (x.errand) return G.Errand.offerDialog(sp, who);
      await UI.say((x.circ ? '저는 지구를 한 바퀴 돌아 이곳으로 돌아오는 항해를 하고자 합니다.' : x.found ? '저는 이미 「' + d.name + '」' + U.jx(d.name, '을/를') + ' 찾아냈습니다. 여기 그 증거가 있습니다.' : d.hint + '\n저는 그것을 찾아내고 싶습니다.'), { name: s.player.name, portrait: s.player.portrait });
      // too heavy?
      var need = G.POWER_FAME[d.pw] || 0;
      if (!x.found && s.player.fame < need * 0.8) {
        await UI.say(U.pick(['자네에게는 짐이 너무 무거우리라 생각되는데... 좀 더 분수에 맞는 이야기를 찾아 오게.', '터무니없는 이야기로군. 자네의 명성으로는 믿기 어렵네.']), who);
        continue;
      }
      if (d.pw > sp.pw + 1) { await UI.say(U.pick(['원조해 주고 싶지만, 그렇게 큰 모험은 나로서는 도저히...', '가능한 한 원조해 주고 싶지만, 너무 이야기가 엄청나네.']), who); continue; }
      var sc = interest(sp, d) + (x.found ? 1.5 : 0) + (x.circ ? 3 : 0);
      var react = sc >= 3.2 ? '마음이 내킴' : sc >= 2.0 ? '좋은 반응' : sc >= 1.0 ? '다른 것을 보여라' : sc >= 0 ? '시시하다' : '장난치지 말게';
      if (react === '다른 것을 보여라') { await UI.say(U.pick(['흐음, 썩 내키지 않는군. 좀 더 흥미 있는 이야기는 없는가?', '그 밖에 흥미 있는 이야기는 없는가?']), who); continue; }
      if (react === '시시하다') { await UI.say(U.pick(['흐~음, 조금도 흥미가 일어나지 않는군. 좀 더 호기심을 불러일으킬 이야기를 찾아 오게.', '그런 가치 없는 이야기에는 원조할 수 없네. 다음 기회로 하세.']), who); return; }
      if (react === '장난치지 말게') { await UI.say('그런 쓸데없는 이야기에 버릴 돈은 없네. 장난치지 말게!', who); rel.trust = Math.max(0, rel.trust - 3); return; }
      await UI.say(react === '마음이 내킴' ? U.pick(['흐음, 흥미 있군!', '그거 흥미 있는 이야기로군!']) : U.pick(['음음, 흥미 있을 것 같군.', '썩 흥미롭지는 않지만 자네 부탁이니 거절할 수 없군.']), who);
      if (x.found) return SP.lateReport(sp, d, react === '마음이 내킴' ? 1 : 0.8);
      return SP.negotiate(sp, d, react === '마음이 내킴' ? 1.1 : 1.0, x.circ);
    }
    await UI.say('오늘은 이만 하세. 흥미 있는 이야기를 찾아 오게.', who);
  };

  /** 정산 뒤: 동료들이 원정의 몫을 기대한다 (다음 원정을 함께할지가 달린 재계약) */
  SP.shareWithMates = async function (reward) {
    var s = S(); if (!s.mates.length || reward < 400) return;
    var share = Math.round(reward * 0.1 / 10) * 10;
    var v = await UI.ask('동료들이 이번 원정의 몫을 기대하는 눈치입니다. 사례금의 1할(금화 ' + U.num(share) + '닢)을 나누어 줄까요?',
      [{ label: '나누어 준다', value: 1 }, { label: '다음에 하자', value: 0 }], G.Scenes.mateSpeaker('first'));
    if (v && s.player.gold >= share) {
      s.player.gold -= share;
      s.mates.forEach(function (m) { m.loyal = Math.min(100, (m.loyal || 70) + 12); });
      UI.toast('동료들의 충성심이 올랐다. 다음 원정도 함께하겠다고 한다.', 'people', 4200);
    } else {
      var leave = [];
      s.mates.forEach(function (m) { m.loyal = (m.loyal || 70) - 6; if (m.loyal < 25 && m.id !== 'rocco') leave.push(m); });
      leave.forEach(function (m) { s.mates.splice(s.mates.indexOf(m), 1); s.flags['gone_' + m.id] = 1; });
      if (leave.length) await UI.say(leave.map(function (m) { return G.MATE[m.id].name; }).join('·') + U.jx(G.MATE[leave[leave.length - 1].id].name, '이/가') + ' 서운하다며 함대를 떠났다.', {});
      else UI.toast('동료들이 조금 서운해한다. (충성심 −6)', 'people');
    }
    G.Game.refreshHud();
  };

  /** already-found discovery brought to a sponsor */
  SP.lateReport = async function (sp, d, k) {
    var s = S(), who = SP.speaker(sp), st = s.disc[d.id], rel = SP.rel(sp.id);
    var o = offerFor(sp, d), pay = Math.round(o.reward * 0.7 * k / 100) * 100;
    // 같은 해에 같은 후원자에게 여러 번 보고하면 사례금이 줄어든다 (후원자의 주머니에도 끝이 있다)
    if (rel.lateY !== s.date.y) { rel.lateY = s.date.y; rel.lateN = 0; }
    var cutK = 1 + ((G.BALANCE && G.BALANCE.lateRepCut) || 0) * rel.lateN, cutTxt = '';
    if (cutK > 1) { pay = Math.max(100, Math.round(pay / cutK / 100) * 100); cutTxt = ' 올해는 벌써 자네에게 여러 번 사례했으니 이번에는 조금 줄이겠네.'; }
    rel.lateN++;
    var fame = G.Disc.isLate(d.id) ? Math.round((G.Disc.fameFor(d) * 0.9 + sp.pw * 25) * G.Disc.artBonus() * G.Disc.LATE_FAME) : Math.round((G.Disc.fameFor(d) * (st.rival ? 0.4 : 0.9) + sp.pw * 25) * G.Disc.artBonus());
    var pr = SP.submitProof(sp, d);
    if (pr.noProof) { pay = Math.round(pay * 0.7 / 100) * 100; fame = Math.round(fame * 0.8); }
    await UI.say(SP.proofLine(pr, d, true) + (G.Disc.isLate(d.id) ? '자네가 먼저 찾았다니 놀랍군. 하지만 ' + st.rival + U.jx(st.rival, '이/가') + ' 이미 발표해 버렸으니 세상이 알아주는 공은 절반이겠지. ' : '훌륭하군! 그 공적은 내가 세상에 널리 알리겠네. ') + '약소하지만 사례로 금화 ' + U.num(pay) + '닢을 주겠네.' + cutTxt, who);
    s.player.gold += pay; s.player.fame += fame; st.reported = sp.id; SP.addTrust(rel, 6 + pr.bonus); rel.done = (rel.done || 0) + 1;
    SP.proofToast(pr);
    G.State.log(SP.holderName(sp) + '에게 「' + d.name + '」의 발견을 보고했다. (금화 ' + pay + ', 명성 +' + fame + ')');
    await UI.alert('금화 ' + U.num(pay) + '닢과 명성 ' + fame + U.jx(String(fame), '을/를') + ' 얻었다!' + (G.Disc.isLate(d.id) ? '<br><span class="muted">경쟁자가 먼저 발표한 뒤의 늦은 보고라 명성은 절반</span>' : ''), '보고');
    if (G.Names) await G.Names.onReport(d);
    G.Game.refreshHud();
  };

  /** 빌려줄 배의 종류 (없으면 null): 재력 3 이상, 먼 길이거나 큰 발견일 때 */
  function loanType(sp, d, circ, o) {
    if (sp.wealth < 3 || !(circ || d.pw >= 3 || o.years >= 2)) return null;
    var y = S().date.y, reg = G.CITY_DATA[sp.city] ? G.CITY_DATA[sp.city].region : 0;
    // 그 고장의 배를 빌려준다
    if (reg === 6) return sp.wealth >= 4 ? 'ljunk' : 'junk';
    if (reg === 9) return sp.wealth >= 5 && y >= 1550 ? 'atakebune' : 'junk';
    if (reg === 8) return sp.wealth >= 4 ? 'jong' : 'junk';
    if (sp.rel === 'I' || sp.rel === 'H' || reg === 5 || reg === 4) return sp.wealth >= 4 ? 'baghlah' : 'dhow';
    if (sp.wealth >= 5) return (circ || d.pw >= 4) ? (y >= 1525 ? 'galleon' : 'lcarrack') : 'carrack';
    if (sp.wealth === 4) return d.pw >= 4 ? 'carrack' : 'lcaravel';
    return 'caravel';
  }
  /** 빌린 배를 돌려준다 (함대·계류지 어디에 있든). 잃었으면 {lost, cost} */
  SP.returnLoan = function (k) {
    var s = S(), out = { returned: null, lost: false, cost: 0 };
    if (!k || !k.loan) return out;
    var i = -1;
    s.fleet.ships.forEach(function (sh, j) { if (sh.uid === k.loan) i = j; });
    if (i >= 0) { out.returned = s.fleet.ships.splice(i, 1)[0]; }
    else {
      for (var cid in (s.moored || {})) {
        var arr = s.moored[cid], j2 = -1;
        arr.forEach(function (sh, j) { if (sh.uid === k.loan) j2 = j; });
        if (j2 >= 0) { out.returned = arr.splice(j2, 1)[0]; break; }
      }
    }
    if (!out.returned) { out.lost = true; out.cost = Math.round((G.SHIP[k.loanType] ? G.SHIP[k.loanType].price : 8000) * 0.6); }
    var CC = G.Scenes && G.Scenes.city;
    if (out.returned && CC && CC.B.harbor && CC.B.harbor.trimCrew) CC.B.harbor.trimCrew();
    k.loan = null;
    return out;
  };
  /** 발견의 증거품을 소지품에서 꺼내 건넨다. 건넸으면 그 물건, 없으면 null */
  SP.takeEvidence = function (discId) {
    var items = S().player.items;
    for (var i = 0; i < items.length; i++) if (items[i].kind === 'evidence' && items[i].disc === discId) return items.splice(i, 1)[0];
    return null;
  };

  /** 돌려줄 가능성: 서적·다음 탐험으로 이어지는 물건 (후원자 성격·신뢰·아직 못 찾은 이어지는 발견) */
  var GIVE_BACK = { king: 0.55, pope: 0.35, gov: 0.55, noble: 0.5, priest: 0.4, official: 0.55, scholar: 0.4, merchant: 0.75 };
  SP.giveBackChance = function (sp, r) {
    var p = GIVE_BACK[sp.type] != null ? GIVE_BACK[sp.type] : 0.5;
    p += (SP.rel(sp.id).trust || 0) / 400;
    if (r.lead && r.lead.some(function (id) { return G.DISC[id] && !G.Disc.foundByMe(id); })) p += 0.2;
    return U.clamp(p, 0.15, 0.95);
  };
  /** 보고할 때 증거를 건넨다: 해도·지도와 유물은 후원자가 가져가고, 서적·이어지는 물건은 돌려받기도 한다.
      {ev, given, back, noProof, bonus} */
  SP.submitProof = function (sp, d) {
    var s = S(), items = s.player.items, given = [], back = [];
    var proof = G.Disc.hasProof(d.id);
    var ev = d.evidence ? SP.takeEvidence(d.id) : null;
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i], r = G.RELIC[it.id];
      if (it.disc !== d.id || it.evidence || !r || it.done) continue;
      if ((r.kind === 'book' || r.lead) && U.chance(SP.giveBackChance(sp, r))) { it.done = true; back.unshift(it); continue; }
      items.splice(i, 1); given.unshift(it);
      if (s.player.equip.weapon === it.id && !R.hasItem(it.id)) s.player.equip.weapon = null;
      if (s.player.equip.armor === it.id && !R.hasItem(it.id)) s.player.equip.armor = null;
    }
    var st = s.disc[d.id]; if (st) st.gaveTo = sp.id;
    var bonus = Math.min(4, given.filter(function (it) { var r = G.RELIC[it.id]; return r.kind !== 'book'; }).length);
    return { ev: ev, given: given, back: back, noProof: G.Disc.needsProof(d) && !proof, bonus: bonus };
  };
  /** 증거를 받는 후원자의 말 */
  SP.proofLine = function (pr, d, short) {
    var nm = function (it) { return '「' + R.itemName(it) + '」'; };
    var out = '';
    if (pr.noProof) return (d.evidence ? '증거가 될 ' + d.evidence + U.jx(d.evidence, '이/가') : '증거가 될 만한 물건이 하나도') + ' 없으니 반신반의하네만... 자네 말을 믿어 보지. ';
    var shown = (pr.ev ? [pr.ev] : []).concat(pr.given);
    if (shown.length) out += shown.map(nm).join(', ') + U.jx(R.itemName(shown[shown.length - 1]), '을/를') + ' 보니 틀림없군! ' + (short ? '' : '이것들은 내가 맡아 두겠네. ');
    else if (pr.back.length) return out + pr.back.map(nm).join(', ') + U.jx(R.itemName(pr.back[pr.back.length - 1]), '을/를') + ' 보니 틀림없군! ' + (pr.back.length > 1 ? '이것들은' : '이것은') + ' 자네가 다음 항해에 쓰는 편이 낫겠군. 돌려주겠네. ';
    if (pr.back.length) out += (short ? '' : '\n') + '다만 ' + pr.back.map(nm).join(', ') + U.jx(R.itemName(pr.back[pr.back.length - 1]), '은/는') + ' 자네가 다음 항해에 쓰는 편이 낫겠군. 돌려주겠네. ';
    return out;
  };
  SP.proofToast = function (pr) {
    if (pr.given.length) UI.toast('후원자에게 바쳤다: ' + pr.given.map(function (it) { return R.itemName(it); }).join(', '), 'seal', 4200);
    if (pr.back.length) setTimeout(function () { UI.toast('돌려받았다: ' + pr.back.map(function (it) { return R.itemName(it); }).join(', ') + ' — 이제 제독의 것', 'book', 4200); }, 600);
  };

  SP.negotiate = async function (sp, d, mood, circ) {
    var s = S(), who = SP.speaker(sp), rel = SP.rel(sp.id);
    var o = offerFor(sp, d);
    o.advance = Math.round(o.advance * mood / 100) * 100;
    var asked = 0;
    for (;;) {
      await UI.say('모험하는 데 돈은 필요하겠지. 먼저 금화 ' + U.num(o.advance) + '닢을 주겠네. ' + o.years + '년 안에 성공하면 거기다 금화 ' + U.num(o.reward) + '닢의 사례를 약속하겠네. 이것으로 어떤가.', who);
      var v = await UI.ask('기간 ' + o.years + '년 · 선금 ' + U.num(o.advance) + '닢 · 성공 보수 ' + U.num(o.reward) + '닢', [{ label: '승낙한다', value: 'ok' }, { label: '교섭한다', value: 'nego', dis: asked >= 2 }, { label: '그만둔다', value: 'no' }], { name: s.player.name, portrait: s.player.portrait });
      if (v === 'ok') break;
      if (v === 'no' || v == null) { await UI.say('그런가. 마음이 바뀌면 다시 오게.', who); return; }
      var w = await UI.choose('무엇을 요구할까?', [{ label: '자금 증가', value: 'money', icon: 'coin' }, { label: '기간 연장', value: 'time', icon: 'hourglass' }, { label: '변경 없음', value: 'none', icon: 'check' }], { width: 420 });
      if (!w || w === 'none') continue;
      asked++;
      var p = 0.55 + R.skill('speech') * 0.12 + (R.stat('cha') - 50) * 0.006 + rel.trust * 0.004 - (asked - 1) * 0.25;
      if (!U.chance(U.clamp(p, 0.05, 0.95))) {
        await UI.say(U.pick(['탐욕스러운 놈! 너 같은 녀석에게 볼일 없다. 썩 꺼져라!', '너 같이 욕심 많은 녀석에게 원조할 수 없다! 썩 꺼져라!!']), who);
        rel.trust = Math.max(0, rel.trust - 10); rel.anger = U.dateNum(U.addDays(s.date, 90));
        return;
      }
      if (w === 'money') { o.advance = Math.round(o.advance * 1.4 / 100) * 100; o.years = Math.max(1, o.years - 1); await UI.say('뭐, 돈을 더 달라고? 흐~음, 좋다. 대신 기간은 ' + o.years + '년으로 줄이겠네. 이의 없겠지.', who); }
      else { o.years += 1; o.advance = Math.round(o.advance * 0.8 / 100) * 100; await UI.say('그것도 그렇군. 기간을 ' + o.years + '년으로 늘리지. 대신 돈은 전부 ' + U.num(o.advance) + '닢이 되겠군.', who); }
    }
    // treaty warning
    if (SP.isRivalNation(sp)) {
      var ok = await UI.confirm('제독, 알고 계시겠지만 우리 조국과 ' + R.nationName(sp.nation) + ' 사이에는 경쟁이 치열합니다. ' + R.nationName(sp.nation) + '의 후원자와 계약하면 조국에서 배반자라는 소리를 듣게 됩니다. 그래도 계약하시겠습니까?', '계약한다', '그만둔다', '부관의 경고');
      if (!ok) return;
      s.player.notoriety += 8;
    }
    // 선박 대여: 넉넉한 후원자는 먼 원정에 쓸 배를 빌려준다 (정산 때 돌려받는다 — 대항해시대 3)
    var loanShip = null, lt = loanType(sp, d, circ, o);
    if (lt) {
      if (s.fleet.ships.length >= G.MAX_SHIPS) await UI.say('배도 한 척 내주려 했는데, 자네 함대는 이미 꽉 찼군.', who);
      else {
        var lv = await UI.ask('먼 길이니 배도 한 척 필요하겠지. 원정이 끝나면 돌려준다는 조건으로 우리 ' + G.SHIP[lt].name + U.jx(G.SHIP[lt].name, '을/를') + ' 빌려주겠네. 선원은 자네가 채우게.', [{ label: '빌린다', value: 1 }, { label: '괜찮습니다', value: 0 }], who);
        if (lv) { loanShip = R.newShip(lt, U.pick(G.SHIP_NAMES), G.Ships.localWood(G.CITY_DATA[sp.city]).id); loanShip.loan = sp.id; s.fleet.ships.push(loanShip); }
      }
    }
    var due = U.addDays(s.date, o.years * 365);
    s.contract = { sponsor: sp.id, disc: d.id, advance: o.advance, reward: o.reward, due: U.dateNum(due), start: U.dateNum(s.date), circ: !!circ,
      loan: loanShip ? loanShip.uid : null, loanType: loanShip ? lt : null, loanName: loanShip ? loanShip.name : null };
    if (!circ) G.Disc.addHint(d.id, 'contract:' + sp.id);
    s.player.gold += o.advance;
    if (loanShip) setTimeout(function () { UI.toast(loanShip.name + '호(' + G.SHIP[lt].name + ')를 빌렸다. 계약을 마치면 돌려준다. 선원을 채워야 움직일 수 있다.', 'ship', 5500); }, 600);
    G.State.log(U.j(SP.holderName(sp), '과/와') + ' 「' + (circ ? '세계일주' : d.name) + '」 탐색 계약을 맺었다. (선금 ' + o.advance + '닢, 기한 ' + U.fmtDate(due) + ')');
    await UI.say(U.pick(['그러면, 기대하고 있겠네. 훌륭히 성공을 거두고 돌아오게.', '긴 여행이 되리라 생각되는데 조심하게. 여행의 성공을 기도하고 있겠네.']), who);
    UI.toast('계약 성립! 선금 ' + U.num(o.advance) + '닢을 받았다.', 'seal', 4000);
    G.Game.refreshHud();
  };

  /** 신뢰: 쌓이되 상한(G.BALANCE.trustMax)을 넘지 않는다 */
  SP.addTrust = function (rel, n) { var mx = (G.BALANCE && G.BALANCE.trustMax) || 1e9; rel.trust = U.clamp((rel.trust || 0) + n, 0, Math.max(mx, n < 0 ? rel.trust || 0 : 0)); };
  /** 계약이 깨졌다. why: 'late' 기한이 지나 실패를 인정 · 'quit' 기한 전에 포기 · 'announce' 계약한 발견을 스스로 발표
      기한 전에 그만두면 선금을 돌려줘야 하고(모자라면 금고에서, 그래도 모자라면 신뢰를 더 잃는다), 한동안 이 후원자를 만날 수 없다 */
  SP.breakContract = async function (sp, why) {
    var s = S(), k = s.contract, who = SP.speaker(sp), rel = SP.rel(sp.id);
    if (!k) return;
    var d = G.DISC[k.disc], name = k.circ ? '세계일주' : d ? d.name : '계약';
    var lines = [];
    if (k.small) SP.addTrust(rel, -8);                     // 작은 일거리: 가볍게
    else { SP.addTrust(rel, why === 'announce' ? -20 : -12); rel.fail = (rel.fail || 0) + 1; s.player.fame = Math.max(0, s.player.fame - Math.round(((d && d.pw) || 1) * 20)); }
    if (why !== 'late' && k.advance > 0) {
      var p = s.player, fromGold = Math.min(p.gold, k.advance), fromBank = Math.min(p.bank || 0, k.advance - fromGold), paid = fromGold + fromBank;
      p.gold -= fromGold; p.bank = (p.bank || 0) - fromBank;
      if (paid < k.advance) SP.addTrust(rel, -10);
      lines.push(why === 'announce' ? '나와 약속한 발견을 제멋대로 세상에 발표하다니! 받아 간 선금 금화 ' + U.num(k.advance) + '닢은 돌려받겠네.' : '그만두겠다니 할 수 없지. 다만 받아 간 선금 금화 ' + U.num(k.advance) + '닢은 돌려주게.');
      if (paid < k.advance) lines.push('...' + U.num(paid) + '닢뿐인가. 나머지는 됐네. 다시는 이런 일이 없도록 하게.');
      UI.toast('선금 ' + U.num(paid) + '닢을 돌려주었다.', 'coin', 4000);
    }
    var ret0 = SP.returnLoan(k);
    if (ret0.returned) lines.push('빌려 간 ' + ret0.returned.name + '호는 돌려받겠네.');
    else if (ret0.lost) { var pay0 = Math.min(s.player.gold, ret0.cost); s.player.gold -= pay0; SP.addTrust(rel, -8); lines.push('빌려 간 배까지 잃었다니... 배값으로 금화 ' + U.num(pay0) + '닢은 받아야겠네.'); }
    rel.anger = U.dateNum(U.addDays(s.date, k.small ? 30 : why === 'announce' ? 180 : why === 'quit' ? 90 : 60));
    if (lines.length) await UI.say(lines.join('\n'), who);
    G.State.log('「' + name + '」 계약' + (why === 'announce' ? '을 어기고 스스로 발표했다.' : why === 'quit' ? '을 기한 전에 포기했다. (선금 반환)' : '에 실패했다.'));
    s.contract = null;
    G.Game.refreshHud();
  };

  // ---------------------------------------------------------------- report
  SP.canReport = function (sp) { var k = S().contract; return !!(k && k.sponsor === sp.id); };
  SP.report = async function (sp) {
    var s = S(), k = s.contract, who = SP.speaker(sp), rel = SP.rel(sp.id);
    if (!k || k.sponsor !== sp.id) { await UI.say('자네와 약속한 일은 없는 것 같은데?', who); return; }
    if (k.small && G.Errand) return G.Errand.report(sp, who);
    var d = G.DISC[k.disc];
    var found = k.circ ? G.Disc.foundByMe('circum') : G.Disc.foundByMe(k.disc);
    var late = U.dateNum(s.date) > k.due;
    if (!found) {
      var v = await UI.ask(late ? '약속한 기한이 이미 지났네. 어떻게 된 건가?' : '아직 찾지 못했는가? 기한까지는 시간이 있네.', late ? [{ label: '실패를 인정한다', value: 'fail' }, { label: '물러난다', value: null }] : [{ label: '계속 찾겠습니다', value: null }, { label: '계약을 포기한다', value: 'fail' }], who);
      if (v !== 'fail') return;
      if (late) await UI.say(U.pick(['인간이니 실패할 수도 있겠지. 이번 실패는 불문에 부쳐 두기로 하지.', '음, 실패 안 하는 사람은 없으니까. 이번은 너그러이 봐 주겠네.']), who);
      await SP.breakContract(sp, late ? 'late' : 'quit');
      return;
    }
    var st = s.disc[k.disc] || {};
    var reward = k.reward, fame = G.Disc.isLate(d.id) ? Math.round((G.Disc.fameFor(d) + sp.pw * 40) * G.Disc.artBonus() * G.Disc.LATE_FAME) : Math.round((G.Disc.fameFor(d) * (st.rival ? 0.5 : 1) + sp.pw * 40) * G.Disc.artBonus());
    if (late) { reward = Math.round(reward * 0.5); fame = Math.round(fame * 0.7); }
    // 증거: 해도·지도와 유물을 건넨다 (서적·다음 탐험으로 이어지는 물건은 돌려받기도 한다). 하나도 없으면 반신반의
    var pr = k.circ ? { noProof: false, given: [], back: [], bonus: 0 } : SP.submitProof(sp, d), noProof = pr.noProof;
    if (noProof) { reward = Math.round(reward * 0.7); fame = Math.round(fame * 0.8); }
    var trustUp = (noProof ? 6 : 15) + pr.bonus;
    // 빌린 배 반환 (잃었으면 배값을 사례금에서 뗀다)
    var ret = SP.returnLoan(k), lostTxt = '';
    if (ret.lost) { var cut = Math.min(reward, ret.cost); reward -= cut; lostTxt = '\n다만 빌려 간 배를 잃었으니 배값 금화 ' + U.num(cut) + '닢은 빼겠네.'; }
    await UI.say('오오, 해냈는가! ' + (k.circ ? '지구를 한 바퀴 돌아오다니, 참으로 대단한 일일세!' : '「' + d.name + '」이라니, 참으로 대단한 발견일세!') + (late ? '\n약속한 기한은 지났지만, 약속은 약속이지.' : '') +
      (k.circ || !SP.proofLine(pr, d, false) ? '' : '\n' + SP.proofLine(pr, d, false)) + lostTxt +
      '\f자, 약속한 사례금 금화 ' + U.num(reward) + '닢일세. 자네의 이름은 온 세상에 알려질 걸세.', who);
    if (ret.returned) UI.toast('빌렸던 ' + ret.returned.name + '호를 돌려주었다.', 'ship', 4000);
    SP.proofToast(pr);
    s.player.gold += reward; s.player.fame += fame;
    st.reported = sp.id; s.disc[k.disc] = st;
    SP.addTrust(rel, trustUp); rel.done = (rel.done || 0) + 1;
    if (k.circ) { s.flags.circDone = true; }
    G.State.log(SP.holderName(sp) + '에게 「' + (k.circ ? '세계일주' : d.name) + '」' + U.jx(k.circ ? '세계일주' : d.name, '을/를') + ' 보고했다. (사례금 ' + reward + '닢, 명성 +' + fame + ')');
    s.contract = null;
    await UI.alert('사례금 금화 ' + U.num(reward) + '닢과 명성 ' + fame + U.jx(String(fame), '을/를') + ' 얻었다!' + (G.Disc.isLate(d.id) ? '<br><span class="muted">경쟁자가 먼저 발표한 뒤의 늦은 보고라 명성은 절반</span>' : '') + '<br><span class="muted">' + R.fameTitle(s.player.fame) + '</span>', '보고 완료');
    if (G.Names && !k.circ) await G.Names.onReport(d);
    G.Game.refreshHud();
    await SP.shareWithMates(reward);
    if (G.Ending && G.Ending.check) await G.Ending.check();
  };

  /** returning home after sailing around the world */
  SP.circumReturn = async function (c) {
    var s = S();
    s.circ.reported = true;
    if (!G.Disc.foundByMe('circum')) await G.Disc.find(G.DISC.circum, 'special');
  };
})(window.G = window.G || {});
