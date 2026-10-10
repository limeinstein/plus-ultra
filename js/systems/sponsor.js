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
  SP.honor = function (sp) { if (sp.honor) return sp.honor; if (/왕비|왕대비/.test(SP.holder(sp) || '')) return '전하'; return HONOR[sp.type] || '님'; };   // honor: 조선 국왕 「전하」처럼 자료에서 정한 호칭
  /** 후원자 얼굴: 흉상(portrait) + 무릎상(half — portraits/sponsors/<그림>_half, 있을 때만) */
  SP.face = function (sp) {
    var spec = A.sponsorSpec(sp, SP.holderIndex(sp)), half = G.Img.chain.halfOf(G.Art.portraitKeys(spec));
    // 이야기 모드의 후원자(카사노바 남작)처럼 전용 그림이 없는 사람: 그 고장 귀족(왕·성직자·상인)의 무릎상으로 선다 — 흉상 대화창으로 돌아가지 않게
    if (sp.tale) half = half.concat(['portraits/npc-roles/' + ((spec && spec.style) || 'ib') + '/' + ({ king: 'king', church: 'priest', merchant: 'merchant' }[sp.type] || 'noble') + '_half']);
    return { name: SP.holderName(sp), portrait: spec, half: half, lang: SP.langLv(sp), li: SP.langLi(sp) };
  };
  function playerFace() { var p = S().player; return { name: p.name, rigId: 'player', portrait: p.portrait, half: G.Img.chain.heroHalf() }; }
  /** 후원자와 마주 보는 대화 (왼쪽 제독 · 오른쪽 후원자). 두 사람 다 무릎상이 있으면 서 있는 모습으로 크게 */
  SP.speaker = function (sp) {
    var o = SP.face(sp); o.layout = 'duo'; o.side = 'right'; o.partner = playerFace(); o.emotion = 'neutral';
    return o;
  };
  /** 같은 자리에서 제독이 하는 말 */
  SP.me = function (sp) {
    var o = playerFace(); o.layout = 'duo'; o.side = 'left'; o.partner = SP.face(sp); o.emotion = 'neutral'; o.choiceSide = 'left';
    return o;
  };
  SP.langLv = function (sp) { return Math.max(R.lang(sp.lang), R.cityLang(G.CITY_DATA[sp.city]).lv); };
  /** 후원자와 나누는 말: 후원자의 말과 그 도시의 말 가운데 일행이 더 잘하는 쪽 */
  SP.langLi = function (sp) { var a = sp.lang, b = G.CITY_DATA[sp.city].lang; return a == null ? b : b == null ? a : (R.lang(b) > R.lang(a) ? b : a); };
  SP.butler = function (sp) { var c = G.CITY_DATA[sp.city]; return { name: '집사', portrait: A.withImg(A.npcSpec('butler_' + sp.id, 'keeper', G.Img.folkStyle(c)), G.Img.chain.npc('butler', c)), lang: SP.langLv(sp), li: SP.langLi(sp) }; };
  SP.fameNeed = function (sp) { return G.POWER_FAME[sp.pw] || 0; };
  // ---------------------------------------------------------------- 말투 (js/data/sponsorvoice.js) · 성품
  function femRe() { return G.SPONSOR_FEMALE || /이사벨|엘리자베스|여왕|왕비|왕대비|공작부인|여제|수녀/; }
  SP.female = function (sp) { return femRe().test(SP.holder(sp) || sp.title); };
  /** 이 후원자의 말투: king · queen · noble · merchant · scholar · priest · official (왕궁의 왕명·특허장 대사도 군주 말투(하오체)로 맞췄다 — js/systems/court.js) */
  SP.voiceKey = function (sp) {
    if (sp.voice) return sp.voice;
    if (SP.female(sp)) return sp.type === 'king' ? 'king' : 'queen';    // 여왕(군주)은 군주의 말투, 왕비·귀부인은 해요체
    return (G.SPONSOR_VOICE_OF || {})[sp.type] || 'noble';
  };
  /** 후원자의 한마디. ctx의 값이 {키}에 들어간다 ({x|을/를} 조사 붙임, {^x|을/를} 조사만) */
  SP.line = function (sp, key, ctx) {
    var VV = G.SPONSOR_VOICE || {}, v = VV[SP.voiceKey(sp)] || {}, t = v[key];
    if (t == null) t = (VV.noble || {})[key];
    if (t == null) return '';
    if (Array.isArray(t)) t = U.pickFresh(SP.voiceKey(sp) + ':' + key, t);     // 바로 앞에 한 말은 되풀이하지 않는다
    ctx = ctx || {};
    var base = { p: S().player.name, me: SP.holderName(sp), I: (G.SPONSOR_SELF || {})[sp.id] || '짐', bro: sp.type === 'pope' ? '아들' : '형제' };
    return t.replace(/\{(\^?)(\w+)(?:\|([^}]+))?\}/g, function (m, only, k, pair) {
      var val = ctx[k] != null ? ctx[k] : base[k];
      val = val == null ? '' : String(val);
      if (!pair) return val;
      return only ? U.jx(val, pair) : val + U.jx(val, pair);
    });
  };
  /** 성품 (G.SPONSOR_TEMPERS): 자료에 정했으면 그것, 아니면 자리와 그 대(代) 사람으로 정해진다 */
  SP.temper = function (sp) {
    if (sp.temper) return sp.temper;
    var keys = Object.keys(G.SPONSOR_TEMPERS || {});
    if (!keys.length) return null;
    return keys[Math.abs(U.strHash(sp.id + '|' + (SP.holder(sp) || ''))) % keys.length];
  };
  SP.temperOf = function (sp) { var t = SP.temper(sp); return t ? G.SPONSOR_TEMPERS[t] : null; };
  SP.is = function (sp, t) { return SP.temper(sp) === t; };
  /** 세계일주를 제안할 수 있는가: 명성 3000, 그리고 아프리카 남단·말라카 해협·신세계 해협이 세상에 알려진 뒤 */
  SP.CIRC_NEED = ['capegood', 'malacca', 'newstrait'];
  SP.circReady = function () {
    var s = S();
    if (s.player.fame < 3000 || G.Disc.foundByMe('circum') || G.Disc.taken('circum') || s.flags.circDone) return false;
    return SP.CIRC_NEED.every(function (id) { return G.Frontier && G.Frontier.known ? G.Frontier.known(id) : G.Disc.foundByMe(id); });
  };

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
    if (G.Succession) { G.Succession.sync(); G.Succession.meet(sp); }
    return true;
  };

  // ---------------------------------------------------------------- proposal / contract
  /** interest score for proposing discovery d */
  function interest(sp, d) {
    var s = S(), st = s.disc[d.id] || {};
    var v = 0;
    if (G.tasteHit(sp.taste, d)) v += 2.2;
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
    // 시샘하던 후원자에게 「다음 발견은 먼저 가져오겠다」고 약속했고, 그 약속을 지키러 왔다
    if (SP.rel(sp.id).promise) v += 0.8;
    v += U.rf(-0.8, 0.8);
    return v;
  }
  SP.interest = interest;
  SP.offerFor = function (sp, d) { return offerFor(sp, d); };
  /** 관심사 밖 이야기를 웅변으로 설득할 확률 (웅변이 없으면 0). sc = 반응 점수 */
  SP.persuadeChance = function (sp, sc) {
    var T = (G.BALANCE && G.BALANCE.sponsorTaste) || {}, sk = R.skill('speech');
    if (!sk) return 0;
    return U.clamp((T.persuade || 0) + sk * (T.persuadeSpeech || 0) + (R.stat('cha') - 50) * (T.persuadeCha || 0) + SP.rel(sp.id).trust * (T.persuadeTrust || 0) + sc * (T.persuadeScore || 0), 0.05, 0.9);
  };
  /** 관심사 밖이라 시큰둥할 때: 웅변으로 설득해 볼지 묻고 굴린다. true = 설득했다, false = 실패, null = 하지 않았다 */
  async function persuade(sp, d, sc, who) {
    var T = (G.BALANCE && G.BALANCE.sponsorTaste) || {}, sk = R.skill('speech'), p = SP.persuadeChance(sp, sc);
    var tasteTxt = sp.taste.map(G.tasteName).join('·');
    // 웅변 특기가 없으면 누를 수 없는 창을 띄우지 않는다 — 처음 한 번만 귀띔 (QA 2026-10-10)
    if (!sk) { var fl = S().flags; if (!fl.persuadeTip) { fl.persuadeTip = 1; UI.toast('웅변 특기가 있으면 관심사 밖의 이야기도 설득해 볼 수 있다', 'scroll', 5000); } return null; }
    var v = await UI.ask('「' + d.name + '」' + U.jx(d.name, '은/는') + ' ' + SP.honor(sp) + '의 관심사(' + tasteTxt + ')가 아니다.', [
      { label: sk ? '웅변으로 설득한다 (웅변 ' + sk + ' · 약 ' + Math.round(p * 100) + '%)' : '설득한다 (웅변 특기가 없다)', value: 'go', dis: !sk },
      { label: '그만둔다', value: 'no' }], SP.me(sp));
    if (v !== 'go') return null;
    await UI.say(U.pick(['그 일이 왜 중요한지 들어 주십시오. 이것을 아는 나라가 다음 바다를 쥡니다.', '아무도 눈여겨보지 않는 지금이 기회입니다. 남보다 먼저 손에 넣는 사람이 이름을 남깁니다.',
      '관심 밖의 이야기라는 것을 압니다. 하지만 이 일이 끝나면 ' + SP.honor(sp) + '께서 아끼시는 것들과도 이어질 겁니다.']), SP.me(sp));
    // 결과 연출 (js/ui/outcome.js): 설득해 냈으면 승리, 못 했으면 좌절하는 제독
    if (U.chance(p)) { if (G.Outcome) await G.Outcome.show('win', { sub: SP.holderName(sp) + U.jx(SP.holderName(sp), '을/를') + ' 설득했다' }); await UI.say(SP.line(sp, 'persOk'), who); return true; }
    SP.rel(sp.id).trust = Math.max(0, SP.rel(sp.id).trust - (T.failTrust || 0));
    if (G.Outcome) await G.Outcome.show('lose', { sub: SP.holderName(sp) + '의 마음을 움직이지 못했다' });
    await UI.say(SP.line(sp, 'persFail'), who);
    return false;
  }
  function offerFor(sp, d) {
    var s = S(), c = G.CITY_DATA[sp.city];
    var dist = d.how === 'trade' ? 60 : G.Geo.dist(c.lon, c.lat, d.lon, d.lat);
    var years = U.clamp(Math.round(1 + dist / 45), 1, 6);
    if (d.id === 'circum') years = 5;
    var w = sp.wealth;
    var art = G.Disc.artBonus();     // 그림 솜씨가 좋으면 값을 더 쳐 준다
    // 관심사에 맞는 이야기는 후하게 (G.BALANCE.sponsorTaste) — 세계일주는 관심사와 상관없다
    var T = (G.BALANCE && G.BALANCE.sponsorTaste) || {}, liked = d.id !== 'circum' && G.tasteHit(sp.taste, d);
    var adv = Math.round(d.val * (0.2 + 0.055 * w) * (liked ? T.advance || 1 : 1) / 100) * 100;
    var rew = Math.round(G.Disc.value(d) * (0.62 + 0.12 * w) * art * (liked ? T.reward || 1 : 1) / 100) * 100;   // 그림·세공은 G.Disc.value에 들어 있다
    // 성품: 조급하면 기한이 짧고 선금이 후하다 · 신중하면 선금은 적고 사례가 크다 · 욕심이 많으면 사례가 적다 · 너그러우면 선금을 조금 더
    var tp = SP.temper(sp);
    if (tp === 'hasty') { if (d.id !== 'circum') years = Math.max(1, years - 1); adv *= 1.15; }
    else if (tp === 'careful') { adv *= 0.9; rew *= 1.1; }
    else if (tp === 'greedy') rew *= 0.9;
    else if (tp === 'generous') adv *= 1.05;
    adv = Math.round(adv / 100) * 100; rew = Math.round(rew / 100) * 100;
    return { advance: Math.max(400, adv), reward: Math.max(1200, rew), years: years, liked: liked };
  }

  SP.propose = async function (sp) {
    var s = S(), who = SP.speaker(sp), rel = SP.rel(sp.id);
    var L = function (k, ctx) { return SP.line(sp, k, ctx); };
    if (s.contract) {
      await UI.say(L(s.contract.sponsor === sp.id ? 'busyMine' : 'busyOther'), who);
      return;
    }
    // 계약을 그만두며 못 갚은 선금: 갚기 전에는 새 후원을 받을 수 없다 (선금으로 물건을 사 두고 빈손으로 그만두면 남던 것)
    if (rel.debt > 0) {
      var pw = s.player, dGold = Math.min(pw.gold, rel.debt), dBank = Math.min(pw.bank || 0, rel.debt - dGold);
      if (dGold + dBank < rel.debt) { await UI.say(L('debtLeft', { debt: U.num(rel.debt) }), who); return; }
      var payDebt = await UI.ask('못 갚은 선금 금화 ' + U.num(rel.debt) + '닢을 갚겠습니까?', [{ label: '갚는다', value: 1 }, { label: '다음에', value: 0 }], who);
      if (!payDebt) return;
      pw.gold -= dGold; pw.bank = (pw.bank || 0) - dBank; rel.debt = 0; rel.anger = 0; SP.addTrust(rel, 4);
      G.Game.refreshHud();
      await UI.say(L('debtPaid'), who);
    }
    if (rel.anger > 0 && U.dateNum(s.date) < rel.anger) { await UI.say(L('rude'), who); return; }
    await UI.say(L(rel.done ? 'openAgain' : 'openNew'), who);
    // candidate proposals: hinted (not yet found by me), or found-but-unreported
    var list = [];
    Object.keys(s.hints).forEach(function (id) { var d = G.DISC[id]; if (d && !G.Disc.foundByMe(id)) list.push({ d: d, found: false }); });
    G.Disc.unreported().forEach(function (d) { list.push({ d: d, found: true }); });
    // 모조품을 증거로 보고 (못 찾았어도, 다른 후원자에게 이미 판 것이어도 — 이중 계약)
    if (G.Fakes) G.Fakes.list().forEach(function (d) { if (!list.some(function (x) { return x.found && x.d === d; })) list.push({ d: d, found: false, fake: true, dbl: G.Fakes.soldElsewhere(sp, d) }); });
    // 세계일주: 아프리카 남단·말라카 해협·신세계 해협이 알려진 뒤에야 (그 전에는 꿈같은 이야기다)
    if (SP.circReady()) list.push({ d: G.DISC.circum, found: false, circ: true });
    if (!list.length) {
      if (G.Errand) { await UI.say(L('emptyErrand'), who); await G.Errand.offerDialog(sp, who); return; }
      await UI.say(L('emptyNone'), who); UI.toast('도서관이나 술집에서 단서를 모으십시오.', 'scroll'); return;
    }
    if (G.Errand) list.push({ errand: true });
    var tm = SP.temperOf(sp);
    for (var tries = 0; tries < 3; tries++) {
      var tasteTxt = sp.taste.map(G.tasteName).join('·');
      var pick = await UI.choose('제안 선택', list.map(function (x, i) {
        if (x.errand) return { label: '작은 일거리를 청한다', right: '해도·조달·소문 확인', value: i, icon: 'seal', desc: '큰 모험 대신 후원자가 맡기는 쉬운 일 — 이름과 신뢰를 쌓는다' };
        var gr = x.found && G.Disc.gradeOf ? G.Disc.gradeOf(x.d) : null;
        return { label: (x.circ ? '세계일주' : x.d.name) + (x.found ? ' <span class="tag">발견 완료</span>' : '') + (gr ? ' <span class="tag">증거 · ' + gr.name + '</span>' : '') + (x.fake ? ' <span class="tag">모조품으로 보고</span>' : '') + (x.dbl ? ' <span class="tag">이중 계약</span>' : '') + (x.found && G.Disc.isLate(x.d.id) ? ' <span class="tag">늦은 보고 · 명성·사례금 절반</span>' : ''), right: G.DISC_CATS[x.d.cat] + (G.tasteHit(sp.taste, x.d) ? ' ★' : ''), value: i, icon: x.found ? 'star' : 'scroll', desc: x.d.hint };
      }), { width: 720, text: SP.holderName(sp) + ' ' + SP.honor(sp) + '의 취향: <b>' + tasteTxt + '</b> <span class="muted">— ★ 취향에 맞으면 선금·사례를 후하게, 취향 밖이면 웅변으로 설득해 볼 수 있다</span>' + (tm ? ' · 성품: <b>' + tm.name + '</b> <span class="muted">— ' + tm.desc + '</span>' : '') });
      if (pick == null) { await UI.say(L('pickCancel'), who); return; }
      var x = list[pick], d = x.d;
      if (x.errand) return G.Errand.offerDialog(sp, who);
      await UI.say((x.circ ? '저는 지구를 한 바퀴 돌아 이곳으로 돌아오는 항해를 하고자 합니다.' : x.found || x.fake ? '저는 이미 「' + d.name + '」' + U.jx(d.name, '을/를') + ' 찾아냈습니다. 여기 그 증거가 있습니다.' : d.hint + '\n저는 그것을 찾아내고 싶습니다.'), SP.me(sp));
      // too heavy?
      var need = G.POWER_FAME[d.pw] || 0;
      if (!x.found && !x.fake && s.player.fame < need * 0.8) { await UI.say(L('heavy'), who); continue; }
      if (d.pw > sp.pw + 1) { await UI.say(L('tooBig'), who); continue; }
      var sc = interest(sp, d) + (x.found || x.fake ? 1.5 : 0) + (x.circ ? 3 : 0);
      var react = sc >= 3.2 ? '마음이 내킴' : sc >= 2.0 ? '좋은 반응' : sc >= 1.0 ? '다른 것을 보여라' : sc >= 0 ? '시시하다' : '장난치지 말게';
      // 관심사 밖이라 시큰둥하면 웅변으로 설득해 볼 수 있다 (같은 이야기는 한 번만). 설득해 내면 보통 값으로 계약·보고
      var cold = react === '다른 것을 보여라' || react === '시시하다' || react === '장난치지 말게';
      if (cold && !x.circ && !G.tasteHit(sp.taste, d) && !x.persuaded) {
        await UI.say(SP.line(sp, react === '장난치지 말게' ? 'coldInsult' : 'coldTaste'), who);
        x.persuaded = true;
        var pv = await persuade(sp, d, sc, who);
        if (pv) react = '좋은 반응';
        else if (pv === false) { if (react === '다른 것을 보여라') continue; return; }
        else if (react === '다른 것을 보여라') continue;
        else { if (react === '장난치지 말게') rel.trust = Math.max(0, rel.trust - 3); await UI.say(SP.line(sp, 'nextTime'), who); return; }
      }
      if (react === '다른 것을 보여라') { await UI.say(L('meh'), who); continue; }
      // 설득 실패: 좌절하는 제독 (결과 연출 js/ui/outcome.js)
      if (react === '시시하다') { if (G.Outcome) await G.Outcome.show('lose', { sub: SP.holderName(sp) + '의 마음을 움직이지 못했다' }); await UI.say(L('dull'), who); return; }
      if (react === '장난치지 말게') { if (G.Outcome) await G.Outcome.show('lose', { sub: SP.holderName(sp) + U.jx(SP.holderName(sp), '이/가') + ' 언짢아한다' }); await UI.say(L('insult'), who); rel.trust = Math.max(0, rel.trust - 3); return; }
      await UI.say(L(react === '마음이 내킴' ? 'like' : 'ok'), who);
      if (x.found || x.fake) return SP.lateReport(sp, d, react === '마음이 내킴' ? 1 : 0.8);
      return SP.negotiate(sp, d, react === '마음이 내킴' ? 1.1 : 1.0, x.circ);
    }
    await UI.say(L('byeToday'), who);
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
    var s = S(), who = SP.speaker(sp), found = G.Disc.foundByMe(d.id), st = s.disc[d.id] || {}, rel = SP.rel(sp.id);
    var L = function (key, ctx) { return SP.line(sp, key, ctx); }, tp = SP.temper(sp);
    var ev = G.Fakes ? await G.Fakes.choose(sp, d, found) : 'real';
    if (!ev) { await UI.say(L('lateNone'), who); return; }
    // 증거의 등급 (실물·정밀 도판·해도·스케치·구술): 스케치나 말뿐이면 미심쩍어할 수 있다 — 물러나면 보고하지 않은 채로 남는다
    var gr = ev !== 'fake' && found && G.Disc.gradeOf ? G.Disc.gradeOf(d, true) : null, gk = 1;
    if (gr) { var dv = await SP.doubt(sp, d, gr); if (dv.abort) return; gk = gr.k * dv.k; }
    var o = offerFor(sp, d), pay = Math.round(o.reward * 0.7 * k * gk / 100) * 100;
    if (o.liked) await UI.say(L('likedReport'), who);
    // 같은 해에 같은 후원자에게 여러 번 보고하면 사례금이 줄어든다 (후원자의 주머니에도 끝이 있다)
    if (rel.lateY !== s.date.y) { rel.lateY = s.date.y; rel.lateN = 0; }
    var cutK = 1 + ((G.BALANCE && G.BALANCE.lateRepCut) || 0) * rel.lateN, cutTxt = '';
    if (cutK > 1) { pay = Math.max(100, Math.round(pay / cutK / 100) * 100); cutTxt = L('lateCut'); }
    rel.lateN++;
    var fame = G.Disc.isLate(d.id) ? Math.round((G.Disc.fameFor(d) * 0.9 + sp.pw * 25) * G.Disc.artBonus(d) * G.Disc.LATE_FAME) : Math.round((G.Disc.fameFor(d) * (st.rival ? 0.4 : 0.9) + sp.pw * 25) * G.Disc.artBonus(d));
    fame = Math.round(fame * gk);
    if (found && G.Disc.isLate(d.id)) pay = Math.max(100, Math.round(pay * G.Disc.LATE_GOLD / 100) * 100);   // 경쟁자보다 늦은 보고: 사례금도 절반
    if (ev === 'fake' && !(await G.Fakes.tryFake(sp, d, pay))) return;
    var pr = ev === 'fake' ? { noProof: false, given: [], back: [], bonus: 0 } : SP.submitProof(sp, d), bothUp = 0;
    if (pr.noProof) { pay = Math.round(pay * SP.noProofK(sp) / 100) * 100; fame = Math.round(fame * 0.8); }
    if (ev === 'both') { G.Fakes.give(d.id, -1); pay = Math.round(pay * ((G.BALANCE.fakes && G.BALANCE.fakes.bothK) || 1.3) / 100) * 100; bothUp = (G.BALANCE.fakes && G.BALANCE.fakes.bothTrust) || 10; }
    await UI.say(SP.proofLine(pr, d, true, sp) + (G.Disc.isLate(d.id) ? L('lateRival', { rival: st.rival }) : L('lateGood') + (U.chance(0.55) ? L('cat_' + d.cat) + ' ' : '')) + L('latePay', { pay: U.num(pay) }) + cutTxt, who);
    if (ev === 'both') await UI.say(L('bothLate'), who);
    if (G.Fakes) G.Fakes.after(sp, d, ev, found);
    if (found) { st = s.disc[d.id] || st; st.reported = sp.id; s.disc[d.id] = st; }
    s.player.gold += pay; G.Fame.add('ex', fame); SP.addTrust(rel, 6 + pr.bonus + bothUp + (tp === 'generous' ? 3 : 0)); rel.done = (rel.done || 0) + 1; rel.promise = 0;
    SP.proofToast(pr);
    if (found) SP.stirJealousy(sp, d);
    G.State.log(SP.holderName(sp) + '에게 「' + d.name + '」의 발견을 보고했다. (금화 ' + pay + ', 명성 +' + fame + (gr ? ', 증거 ' + gr.name : '') + ')');
    await UI.alert('금화 ' + U.num(pay) + '닢과 명성 ' + fame + U.jx(String(fame), '을/를') + ' 얻었다!' + (gr && gr.k !== 1 ? '<br><span class="muted">증거 등급 「' + gr.name + '」 — 사례·명성 ×' + gr.k + '</span>' : '') + (G.Disc.isLate(d.id) ? '<br><span class="muted">경쟁자가 먼저 발표한 뒤의 늦은 보고라 명성·사례금은 절반</span>' : ''), '보고');
    if (G.Names && found) await G.Names.onReport(d);
    if (G.Fest && found && !G.Disc.isLate(d.id)) await G.Fest.begin(sp.city, d);
    G.Game.refreshHud();
  };

  /** 증거가 하나도 없을 때 사례금 비율 (성품: 신중하면 더 깎고, 너그러우면 덜 깎는다) */
  SP.noProofK = function (sp) { var tp = SP.temper(sp); return tp === 'careful' ? 0.55 : tp === 'generous' ? 0.8 : 0.7; };

  /** 증거가 스케치·구술뿐일 때: 후원자가 미심쩍어한다 (G4). {k: 사례·명성 비율, abort: 물러났다} */
  SP.doubt = async function (sp, d, gr) {
    var out = { k: 1, abort: false };
    if (!gr || (gr.key !== 'sketch' && gr.key !== 'word')) return out;
    var s = S(), rel = SP.rel(sp.id), tp = SP.temper(sp);
    var p = (gr.key === 'word' ? 0.35 : 0.2) + (tp === 'careful' ? 0.15 : tp === 'generous' ? -0.15 : 0) - (rel.trust || 0) / 400;
    if (d.pw <= 1) p *= 0.5;           // 가까운 작은 발견은 크게 따지지 않는다
    // 한 번 물러났던 보고: 같은 증거(또는 그보다 못한 것)를 들고 다시 오면 다시 굴리지 않고 그대로 의심한다 —
    // 물러났다 오기를 되풀이해 의심을 피할 수 없게 (더 나은 증거를 마련해 오면 처음처럼 따진다) (QA 2026-10-10)
    var doubted = rel.doubted && rel.doubted[d.id], GR = G.Disc.GRADES || {};
    var again = doubted && GR[doubted] && GR[gr.key] && GR[gr.key].rank <= GR[doubted].rank;
    if (!again && !U.chance(U.clamp(p, 0.05, 0.85))) return out;
    var who = SP.speaker(sp);
    await UI.say(SP.line(sp, gr.key === 'word' ? 'doubtWord' : 'doubtSketch'), who);
    UI.toast('그림에 밝은 부하를 두면 기억을 더듬어 도판을 다시 그릴 수 있다', 'book', 5000);
    var v = await UI.ask('「' + d.name + '」의 증거는 ' + gr.name + '뿐이다. 어떻게 할까?', [
      { label: '증인을 세운다 — 함께 본 부하·선원들이 말한다', value: 'witness' },
      { label: '명예를 걸고 맹세한다', value: 'oath' },
      { label: '더 나은 증거를 마련해 다시 오겠다며 물러난다', value: 'later' }], SP.me(sp));
    if (v === 'later' || v == null) { (rel.doubted = rel.doubted || {})[d.id] = gr.key; await UI.say(SP.line(sp, 'doubtLater'), who); out.abort = true; return out; }
    if (rel.doubted) delete rel.doubted[d.id];
    var ok;
    if (v === 'witness') {
      if (s.mates.length) await UI.say(U.pick(['제독 말씀 그대로입니다. 저희가 두 눈으로 똑똑히 보았습니다.', '거짓이라면 제 목을 거셔도 좋습니다. 그 자리에 저도 있었습니다.']), G.Scenes.mateSpeaker('first'));
      ok = U.chance(U.clamp(0.4 + Math.min(4, s.mates.length) * 0.06 + R.skill('speech') * 0.08, 0.1, 0.9));
    } else ok = U.chance(U.clamp(0.25 + (rel.trust || 0) / 100 + (s.player.fame >= 2000 ? 0.1 : 0), 0.1, 0.9));
    if (G.Outcome) await G.Outcome.show(ok ? 'win' : 'lose', { sub: ok ? '의심을 풀었다' : '의심을 풀지 못했다 — 사례·명성이 줄어든다' });
    if (ok) { await UI.say(SP.line(sp, 'doubtOk'), who); SP.addTrust(rel, 1); }
    else { await UI.say(SP.line(sp, 'doubtFail'), who); out.k = 0.8; SP.addTrust(rel, -3); }
    return out;
  };

  /** 보고를 마친 뒤: 같은 고장·같은 나라의, 이 갈래를 좋아하는 다른 후원자가 시샘한다 (G3). 다음 알현 때 꺼낸다 */
  SP.stirJealousy = function (sp, d) {
    var s = S(), n = 0;
    G.SPONSORS.forEach(function (y) {
      if (n >= 2 || y.id === sp.id || !SP.present(y)) return;
      var ry = s.sponsors[y.id];
      if (!ry || !(ry.done > 0) || ry.jealous) return;
      if (!(y.city === sp.city || (y.nation && y.nation === sp.nation))) return;
      if (!G.tasteHit(y.taste, d) && !ry.promise) return;
      var tp = SP.temper(y), p = ry.promise ? 1 : tp === 'generous' ? 0.35 : tp === 'careful' ? 0.6 : 0.85;
      if (!U.chance(p)) return;
      ry.jealous = { by: sp.id, d: d.id, broke: ry.promise ? 1 : 0 }; ry.promise = 0; n++;
    });
  };
  /** 이중 계약이 들통났다: 먼저 보고받은 후원자가 다음 알현 때 따진다 (js/systems/fakes.js) */
  SP.markDouble = function (prevId, bySp, d) { var r = SP.rel(prevId); r.jealous = { by: bySp.id, d: d.id, dbl: 1 }; };
  /** 알현 때 시샘을 꺼낸다. 알현이 이어지면 true, 쫓겨나면 false */
  SP.jealousy = async function (sp) {
    var rel = SP.rel(sp.id), j = rel.jealous;
    if (!j) return true;
    delete rel.jealous;
    var by = G.SPONSOR[j.by], d = G.DISC[j.d];
    if (!by || !d) return true;
    var s = S(), who = SP.speaker(sp), ctx = { rival: SP.holderName(by), d: d.name };
    if (j.dbl) {
      await UI.say(SP.line(sp, 'jealousDbl', ctx), who);
      SP.addTrust(rel, -15);
      var cost = Math.max(800, sp.pw * 600);
      var v = await UI.ask('어떻게 할까?', [{ label: '사죄의 뜻으로 금화 ' + U.num(cost) + '닢을 바친다', value: 'pay', dis: s.player.gold < cost }, { label: '아무 말 없이 물러난다', value: 'go' }], SP.me(sp));
      if (v === 'pay' && s.player.gold >= cost) { s.player.gold -= cost; SP.addTrust(rel, 6); G.Game.refreshHud(); await UI.say(SP.line(sp, 'jealousSorry'), who); return true; }
      rel.anger = U.dateNum(U.addDays(s.date, 60));
      G.State.log(SP.holderName(sp) + U.jx(SP.holderName(sp), '이/가') + ' 「' + d.name + '」 이중 보고를 알고 크게 노했다.');
      return false;
    }
    await UI.say(SP.line(sp, 'jealous', ctx), who);
    if (j.broke) SP.addTrust(rel, -4);           // 먼저 가져오겠다던 약속까지 어겼다
    var gift = Math.max(300, sp.pw * 200);
    var v2 = await UI.ask('어떻게 할까?', [{ label: '다음 발견은 먼저 가져오겠다고 약속한다', value: 'promise' }, { label: '선물을 바친다 (금화 ' + U.num(gift) + '닢)', value: 'gift', dis: s.player.gold < gift }, { label: '대수롭지 않게 넘긴다', value: 'shrug' }], SP.me(sp));
    if (v2 === 'promise') { rel.promise = 1; SP.addTrust(rel, -2); await UI.say(SP.line(sp, 'jealousPromise'), who); }
    else if (v2 === 'gift' && s.player.gold >= gift) { s.player.gold -= gift; SP.addTrust(rel, 2); G.Game.refreshHud(); await UI.say(SP.line(sp, 'jealousGift'), who); }
    else { SP.addTrust(rel, -5); await UI.say(SP.line(sp, 'jealousShrug'), who); }
    return true;
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
    var tp = SP.temper(sp); if (tp === 'greedy') p -= 0.2; else if (tp === 'generous') p += 0.1;   // 성품
    return U.clamp(p, 0.1, 0.95);
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
  /** 증거를 받는 후원자의 말 (sp: 말투) */
  SP.proofLine = function (pr, d, short, sp) {
    var nm = function (it) { return '「' + R.itemName(it) + '」'; };
    var L = function (k, ctx) { return sp ? SP.line(sp, k, ctx) : (G.SPONSOR_VOICE ? SP.line({ type: 'noble', holders: [], title: '', id: '' }, k, ctx) : ''); };
    var out = '';
    if (pr.noProof) return d.evidence ? L('noProofEv', { ev: d.evidence }) : L('noProofAny');
    var shown = (pr.ev ? [pr.ev] : []).concat(pr.given);
    if (shown.length) out += L('proofSeen', { items: shown.map(nm).join(', '), last: R.itemName(shown[shown.length - 1]) }) + (short ? '' : L('keepIt'));
    else if (pr.back.length) return out + L('backOnly', { items: pr.back.map(nm).join(', '), last: R.itemName(pr.back[pr.back.length - 1]), these: pr.back.length > 1 ? '이것들은' : '이것은' });
    if (pr.back.length) out += (short ? '' : '\n') + L('backToo', { items: pr.back.map(nm).join(', '), last: R.itemName(pr.back[pr.back.length - 1]) });
    return out;
  };
  SP.proofToast = function (pr) {
    if (pr.given.length) UI.toast('후원자에게 바쳤다: ' + pr.given.map(function (it) { return R.itemName(it); }).join(', '), 'seal', 4200);
    if (pr.back.length) setTimeout(function () { UI.toast('돌려받았다: ' + pr.back.map(function (it) { return R.itemName(it); }).join(', ') + ' — 이제 제독의 것', 'book', 4200); }, 600);
  };

  SP.negotiate = async function (sp, d, mood, circ) {
    var s = S(), who = SP.speaker(sp), rel = SP.rel(sp.id);
    var L = function (k, ctx) { return SP.line(sp, k, ctx); }, tp = SP.temper(sp), tm = SP.temperOf(sp);
    var o = offerFor(sp, d);
    o.advance = Math.round(o.advance * mood / 100) * 100;
    var asked = 0, pu = R.purser(), maxAsk = pu ? 3 : 2;
    if (o.liked) await UI.say(L('likedFund'), who);    // 경리가 있으면 한 번 더 교섭하고, 줄 것 없이 더 받아 낸다
    for (;;) {
      await UI.say(L('offer', { adv: U.num(o.advance), yrs: o.years, rew: U.num(o.reward) }), who);
      var v = await UI.ask('기간 ' + o.years + '년 · 선금 ' + U.num(o.advance) + '닢 · 성공 보수 ' + U.num(o.reward) + '닢' + (tm ? '\n' + SP.holderName(sp) + U.jx(SP.holderName(sp), '은/는') + ' ' + tm.like + '. ' + tm.desc : ''), [{ label: '승낙한다', value: 'ok' }, { label: pu ? '교섭한다 (경리 ' + pu.name + ')' : '교섭한다', value: 'nego', dis: asked >= maxAsk }, { label: '그만둔다', value: 'no' }], SP.me(sp));
      if (v === 'ok') break;
      if (v === 'no' || v == null) { await UI.say(L('negoNo'), who); return; }
      var w = await UI.choose('무엇을 요구할까?', [{ label: '자금 증가', value: 'money', icon: 'coin' }, { label: '기간 연장', value: 'time', icon: 'hourglass' }, { label: '변경 없음', value: 'none', icon: 'check' }], { width: 420 });
      if (!w || w === 'none') continue;
      asked++;
      var hon = SP.honor(sp);
      if (pu) await UI.say(w === 'money' ? U.pick([hon + ', 선원 급료와 보급을 셈해 보면 이 선금으로는 절반도 못 갑니다. 장부를 보시지요.', '배 수리와 식량 값이 올해 크게 올랐습니다. 선금을 조금만 더 얹어 주시면 기한 안에 반드시 해내겠습니다.'])
        : U.pick(['뱃길과 계절풍을 따져 보면 이 기한은 빠듯합니다. 한 해만 더 주시면 선금은 그대로 두셔도 됩니다.', hon + '의 돈이 헛되이 쓰이지 않도록, 서두르지 않을 시간을 조금만 더 주십시오.']), G.Scenes.mateSpeaker('purser'));
      var p = 0.55 + R.skill('speech') * 0.12 + (R.stat('cha') - 50) * 0.006 + rel.trust * 0.004 - (asked - 1) * 0.25 + (pu ? 0.10 + pu.acct * 0.05 : 0);
      // 성품: 조급한 이는 기한을, 욕심 많은 이는 돈을 더 내주기 싫어한다 · 너그러운 이는 잘 들어준다
      if ((tp === 'hasty' && w === 'time') || (tp === 'greedy' && w === 'money')) p -= 0.15;
      if (tp === 'generous') p += 0.12;
      if (!U.chance(U.clamp(p, 0.05, 0.95))) {
        if (G.Outcome) await G.Outcome.show('lose', { title: '교섭 결렬…', sub: '욕심이 지나쳤다 — 계약이 없던 일이 되었다' });
        await UI.say(L('greed'), who);
        rel.trust = Math.max(0, rel.trust - 10); rel.anger = U.dateNum(U.addDays(s.date, tp === 'generous' ? 45 : tp === 'hasty' || tp === 'greedy' ? 120 : 90));
        return;
      }
      if (G.Outcome) await G.Outcome.show('win', { title: '교섭 성공!', sub: w === 'money' ? '자금을 더 받아 냈다' : '기한을 늘려 받았다' });
      if (w === 'money' && pu) { o.advance = Math.round(o.advance * (1.35 + pu.acct * 0.05) / 100) * 100; await UI.say(L('moneyPurser', { adv: U.num(o.advance), yrs: o.years }), who); }
      else if (w === 'money') { o.advance = Math.round(o.advance * 1.4 / 100) * 100; o.years = Math.max(1, o.years - 1); await UI.say(L('moneyUp', { yrs: o.years }), who); }
      else if (pu) { o.years += 1; o.advance = Math.round(o.advance * (pu.acct >= 2 ? 1 : 0.92) / 100) * 100; await UI.say(L(pu.acct >= 2 ? 'timePurserSame' : 'timePurserCut', { yrs: o.years, adv: U.num(o.advance) }), who); }
      else { o.years += 1; o.advance = Math.round(o.advance * 0.8 / 100) * 100; await UI.say(L('timeUp', { yrs: o.years, adv: U.num(o.advance) }), who); }
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
      if (s.fleet.ships.length >= G.MAX_SHIPS) await UI.say(L('loanFull'), who);
      else {
        var lv = await UI.ask(L('loanOffer', { ship: G.SHIP[lt].name }), [{ label: '빌린다', value: 1 }, { label: '괜찮습니다', value: 0 }], who);
        if (lv) { loanShip = R.newShip(lt, U.pick(G.SHIP_NAMES), G.Ships.localWood(G.CITY_DATA[sp.city]).id); loanShip.loan = sp.id; s.fleet.ships.push(loanShip); if (G.ShipSprite) G.ShipSprite.want([lt]); }
      }
    }
    var due = U.addDays(s.date, o.years * 365);
    s.contract = { sponsor: sp.id, disc: d.id, advance: o.advance, reward: o.reward, valueK: circ ? null : G.Disc.valueK(d), due: U.dateNum(due), start: U.dateNum(s.date), circ: !!circ,
      loan: loanShip ? loanShip.uid : null, loanType: loanShip ? lt : null, loanName: loanShip ? loanShip.name : null };
    if (!circ) G.Disc.addHint(d.id, 'contract:' + sp.id);
    s.player.gold += o.advance;
    rel.promise = 0;
    if (loanShip) setTimeout(function () { UI.toast(loanShip.name + '호(' + G.SHIP[lt].name + ')를 빌렸다. 계약을 마치면 돌려준다. 선원을 채워야 움직일 수 있다.', 'ship', 5500); }, 600);
    G.State.log(U.j(SP.holderName(sp), '과/와') + ' 「' + (circ ? '세계일주' : d.name) + '」 탐색 계약을 맺었다. (선금 ' + o.advance + '닢, 기한 ' + U.fmtDate(due) + ')');
    if (G.Outcome) await G.Outcome.show('win', { title: '계약 성립!', sub: SP.holderName(sp) + '의 후원으로 「' + (circ ? '세계일주' : d.name) + '」' + U.jx(circ ? '세계일주' : d.name, '을/를') + ' 찾아 나선다' });
    await UI.say(L('sealed'), who);
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
    else { SP.addTrust(rel, why === 'announce' ? -20 : -12); rel.fail = (rel.fail || 0) + 1; G.Fame.add('ex', -Math.round(((d && d.pw) || 1) * 20)); }
    if (why !== 'late' && k.advance > 0) {
      var p = s.player, fromGold = Math.min(p.gold, k.advance), fromBank = Math.min(p.bank || 0, k.advance - fromGold), paid = fromGold + fromBank;
      p.gold -= fromGold; p.bank = (p.bank || 0) - fromBank;
      if (paid < k.advance) { SP.addTrust(rel, -10); rel.debt = (rel.debt || 0) + (k.advance - paid); }   // 못 갚은 선금은 빚으로 남는다
      lines.push(SP.line(sp, why === 'announce' ? 'brkAnnounce' : 'brkQuit', { adv: U.num(k.advance) }));
      if (paid < k.advance) lines.push(SP.line(sp, 'brkDebt', { paid: U.num(paid), rest: U.num(k.advance - paid) }));
      UI.toast('선금 ' + U.num(paid) + '닢을 돌려주었다.', 'coin', 4000);
    }
    var ret0 = SP.returnLoan(k);
    if (ret0.returned) lines.push(SP.line(sp, 'brkLoanBack', { ship: ret0.returned.name }));
    else if (ret0.lost) { var pay0 = Math.min(s.player.gold, ret0.cost); s.player.gold -= pay0; SP.addTrust(rel, -8); lines.push(SP.line(sp, 'brkLoanLost', { pay: U.num(pay0) })); }
    rel.anger = U.dateNum(U.addDays(s.date, k.small ? 30 : why === 'announce' ? 180 : why === 'quit' ? 90 : 60));
    if (lines.length) await UI.say(lines.join('\n'), who);
    G.State.log('「' + name + '」 계약' + (why === 'announce' ? '을 어기고 스스로 발표했다.' : why === 'quit' ? '을 기한 전에 포기했다. (선금 반환)' : '에 실패했다.'));
    s.contract = null;
    G.Game.refreshHud();
  };

  // ---------------------------------------------------------------- report
  SP.report = async function (sp) {
    var s = S(), k = s.contract, who = SP.speaker(sp), rel = SP.rel(sp.id);
    var L = function (key, ctx) { return SP.line(sp, key, ctx); }, tp = SP.temper(sp);
    if (!k || k.sponsor !== sp.id) { await UI.say(L('noContract'), who); return; }
    if (k.small && G.Errand) return G.Errand.report(sp, who);
    var d = G.DISC[k.disc];
    var found = k.circ ? G.Disc.foundByMe('circum') : G.Disc.foundByMe(k.disc);
    var late = U.dateNum(s.date) > k.due;
    // 모조품을 가졌으면 무엇을 내밀지 고른다 (진짜만·모조품만·둘 다) — js/systems/fakes.js
    var hasFake = !k.circ && G.Fakes && G.Fakes.count(k.disc) > 0;
    var ev = hasFake ? await G.Fakes.choose(sp, d, found) : (found ? 'real' : null);
    if (hasFake && !ev) return;
    if (!found && ev !== 'fake') {
      var v = await UI.ask(L(late ? 'askLate' : 'askNotYet'), late ? [{ label: '실패를 인정한다', value: 'fail' }, { label: '물러난다', value: null }] : [{ label: '계속 찾겠습니다', value: null }, { label: '계약을 포기한다', value: 'fail' }], who);
      if (v !== 'fail') return;
      if (late) await UI.say(L('forgive'), who);
      await SP.breakContract(sp, late ? 'late' : 'quit');
      return;
    }
    var st = s.disc[k.disc] || {};
    // 증거의 등급: 스케치·구술뿐이면 미심쩍어할 수 있다 (물러나면 계약은 그대로, 다시 와서 보고한다)
    var gr = !k.circ && ev !== 'fake' && found && G.Disc.gradeOf ? G.Disc.gradeOf(d, true) : null, gk = 1;
    if (gr) { var dv = await SP.doubt(sp, d, gr); if (dv.abort) return; gk = gr.k * dv.k; }
    var reward = k.reward, bothTxt = '';
    // 계약 뒤에 그림·세공에 밝은 부하가 생겼으면(또는 떠났으면) 발견물의 값어치가 달라진 만큼 사례금도 달라진다
    if (!k.circ && k.valueK) { var kNow = G.Disc.valueK(d); if (Math.abs(kNow - k.valueK) > 0.001) reward = Math.round(reward * kNow / k.valueK / 100) * 100; }
    var fame = G.Disc.isLate(d.id) ? Math.round((G.Disc.fameFor(d) + sp.pw * 40) * G.Disc.artBonus(d) * G.Disc.LATE_FAME) : Math.round((G.Disc.fameFor(d) * (st.rival ? 0.5 : 1) + sp.pw * 40) * G.Disc.artBonus(d));
    if (gk !== 1) { reward = Math.round(reward * gk / 100) * 100; fame = Math.round(fame * gk); }
    // 기한을 넘겼다: 성품에 따라 깎는 정도가 다르다 (조급하면 더, 너그러우면 덜)
    if (late) { reward = Math.round(reward * (tp === 'hasty' ? 0.35 : tp === 'generous' ? 0.7 : 0.5)); fame = Math.round(fame * 0.7); }
    if (!k.circ && G.Disc.isLate(d.id)) reward = Math.round(reward * G.Disc.LATE_GOLD);   // 경쟁자보다 늦은 보고: 사례금도 절반
    // 증거: 해도·지도와 유물을 건넨다 (서적·다음 탐험으로 이어지는 물건은 돌려받기도 한다). 하나도 없으면 반신반의
    if (ev === 'fake' && !(await G.Fakes.tryFake(sp, d, reward))) return;     // 들켰다 — 벌을 받고 계약도 끝
    var pr = k.circ || ev === 'fake' ? { noProof: false, given: [], back: [], bonus: 0 } : SP.submitProof(sp, d), noProof = pr.noProof;
    if (noProof) { reward = Math.round(reward * SP.noProofK(sp)); fame = Math.round(fame * 0.8); }
    var trustUp = (noProof ? 6 : 15) + pr.bonus + (tp === 'generous' ? 3 : 0);
    if (ev === 'both') {      // 진짜와 똑같이 만든 모조품까지 바치면 감동한다
      G.Fakes.give(d.id, -1);
      reward = Math.round(reward * ((G.BALANCE.fakes && G.BALANCE.fakes.bothK) || 1.3) / 100) * 100; trustUp += (G.BALANCE.fakes && G.BALANCE.fakes.bothTrust) || 10;
      bothTxt = '\n' + L('both');
    }
    // 세계일주: 그려 온 「세계 일주 지도」를 후원자에게 건넨다 (증거품)
    var circTxt = '';
    if (k.circ) { var cmap = SP.takeEvidence('circum'); if (cmap) { circTxt = '\n' + L('circMap', { ev: cmap.name || '세계 일주 지도' }); pr.given = [cmap]; } }
    // 토르데시야스 조약: 새로 찾은 땅이 후원자 왕실의 몫이면 사례금이 오르고, 상대 왕실의 몫이면 줄어든다 (js/systems/treaty.js)
    var trm = !k.circ && found && ev !== 'fake' && G.Treaty ? G.Treaty.reportMod(sp, d) : null, trTxt = '';
    if (trm) { reward = Math.round(reward * trm.k / 100) * 100; trTxt = '\n' + trm.line; }
    // 빌린 배 반환 (잃었으면 배값을 사례금에서 뗀다)
    var ret = SP.returnLoan(k), lostTxt = '';
    if (ret.lost) { var cut = Math.min(reward, ret.cost); reward -= cut; lostTxt = '\n' + L('loanLost', { cut: U.num(cut) }); }
    var pl = k.circ || ev === 'fake' ? '' : SP.proofLine(pr, d, false, sp);
    // 맞이하는 말: 늦었는지, 몇 번째 거래인지, 무엇을 찾았는지에 따라 (js/data/sponsorvoice.js)
    var hailKey = late ? 'hailLate' : ((rel.done || 0) >= 3 && U.chance(0.5) ? 'hailFriend' : 'hail');
    var catLine = !k.circ && d && U.chance(0.55) && L('cat_' + d.cat);       // 무엇을 찾았는지에 맞춘 한마디 (늘 하지는 않는다)
    await UI.say((k.circ ? L('hailCirc') : L(hailKey, { d: d.name }) + (catLine ? ' ' + catLine : '')) + (late && k.circ ? '\n' + L('pastDue') : '') +
      (pl ? '\n' + pl : '') + circTxt + bothTxt + trTxt + lostTxt +
      '\f' + L('payout', { rew: U.num(reward) }), who);
    if (ret.returned) UI.toast('빌렸던 ' + ret.returned.name + '호를 돌려주었다.', 'ship', 4000);
    SP.proofToast(pr);
    s.player.gold += reward; G.Fame.add('ex', fame);
    if (!k.circ && G.Fakes) G.Fakes.after(sp, d, ev, found);
    if (found) { st = s.disc[k.disc] || st; st.reported = sp.id; if (trm) st.claim = trm.claim; s.disc[k.disc] = st; }
    SP.addTrust(rel, trustUp); rel.done = (rel.done || 0) + 1; rel.promise = 0;
    if (k.circ) { s.flags.circDone = true; }
    if (found && !k.circ) SP.stirJealousy(sp, d);
    G.State.log(SP.holderName(sp) + '에게 「' + (k.circ ? '세계일주' : d.name) + '」' + U.jx(k.circ ? '세계일주' : d.name, '을/를') + ' 보고했다. (사례금 ' + reward + '닢, 명성 +' + fame + (gr ? ', 증거 ' + gr.name : '') + ')');
    s.contract = null;
    await UI.alert('사례금 금화 ' + U.num(reward) + '닢과 명성 ' + fame + U.jx(String(fame), '을/를') + ' 얻었다!' + (gr && gr.k !== 1 ? '<br><span class="muted">증거 등급 「' + gr.name + '」 — 사례·명성 ×' + gr.k + '</span>' : '') + (G.Disc.isLate(d.id) ? '<br><span class="muted">경쟁자가 먼저 발표한 뒤의 늦은 보고라 명성·사례금은 절반</span>' : '') + '<br><span class="muted">' + R.fameTitle(s.player.fame) + '</span>', '보고 완료');
    if (G.Names && !k.circ && found) await G.Names.onReport(d);
    G.Game.refreshHud();
    await SP.shareWithMates(reward);
    // 큰 발견이면 후원자의 도시가 귀환 잔치를 벌인다 (js/systems/festival.js)
    if (G.Fest && found && !(d && G.Disc.isLate(d.id))) await G.Fest.begin(sp.city, k.circ ? G.DISC.circum : d);
    if (G.Ending && G.Ending.check) await G.Ending.check();
  };

  /** returning home after sailing around the world */
  SP.circumReturn = async function (c) {
    var s = S();
    s.circ.reported = true;
    if (!G.Disc.foundByMe('circum')) await G.Disc.find(G.DISC.circum, 'special');
    if (G.Fest && c) await G.Fest.begin(c.id, G.DISC.circum);      // 고향 부두의 귀환 잔치
  };
})(window.G = window.G || {});
