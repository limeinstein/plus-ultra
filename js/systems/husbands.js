/* 여성 제독의 남편들 (G.Husbands) — 2026-11-23 사용자 요청. 대사·조정값: js/data/husbands.js (G.HUSBANDS · G.BALANCE.husbands)
   ■ 누구: 여성 제독(R.heroFemale)이 「부하와 이야기」에서 청혼한 남성 부하 — 호감이 G.BALANCE.mateTalk.wedAff 이상이고 약속 반지가 있을 때 (js/city/matetalk.js)
           아이·동생·이미 짝이 있는 부하(d.minor · d.sib · d.wed)와 다른 부하의 연인·부부는 안 된다.
   ■ 여럿: 본처·둘째의 구분 없이 혼인한 차례대로 첫째·둘째 남편. 정원은 부인과 같다 (G.BALANCE.wives.maxSpouses).
   ■ 모두 배에 탄다: 남편은 부하로 남아 계속 일한다. 집·숨은 거처·부인들의 다툼(wives.js · wifefeud.js)은 없다.
           해고할 수 없고(matedismiss.js), 노장이 되어도 떠나지 않으며(mateleave.js), 부하들 사이의 썸에 끼지 않는다(romance.js).
   ■ 가끔 서로 싸워 다친다: 남편이 둘 이상이면 입항할 때 brawlChance로 주먹다짐(brawlGap일에 한 번) — 말리거나(매력) 내버려 둔다.
           말리지 못하면 한 사람이 hurtDays 동안 다친다 (부하의 hurt — 능력 절반).
   ■ 자택: 남편들과 함께 돌아온다 (js/city/misc.js HM.enter → H.homeGreet).
   ■ 세대 교체: 어머니의 남자들은 어머니를 따라간다 (js/systems/family.js F.succeed → H.ids · js/systems/maidswap.js MS.retire).
   저장: player.husbands = [{id, wed(혼인한 날), no(몇째)}] · state.husb = {brawl(마지막 다툼 날)} — 옛 저장에는 없다 (없으면 남편이 없는 것). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var H = {};
  G.Husbands = H;
  function S() { return G.Game && G.Game.state; }
  function P() { var s = S(); return s && s.player; }
  function K() { return (G.BALANCE && G.BALANCE.husbands) || {}; }
  function D() { return G.HUSBANDS || {}; }
  function row(id) { var s = S(); return (s && s.mates || []).filter(function (m) { return m.id === id; })[0] || null; }
  function st() { var s = S(); return s.husb || (s.husb = {}); }
  /** 글자리: {a} 값 · {a|이/가} 그 값에 맞는 조사 */
  function fill(t, o) {
    return String(t).replace(/\{(\w+)\|([^}]+)\}/g, function (all, k, j) { return o[k] == null ? all : U.jx(String(o[k]), j); })
      .replace(/\{(\w+)\}/g, function (all, k) { return o[k] == null ? all : o[k]; });
  }
  function speaker(id, emotion) {
    var d = G.MATE[id], T = G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.tavern, who = T && T.mateSpeaker ? T.mateSpeaker(d) : { name: d.name, portrait: G.Scenes.mateSpec(id) };
    var o = {}, k; for (k in who) o[k] = who[k];
    o.lang = 3; o.li = null; o.emotion = emotion || 'warm';
    return o;
  }
  H.speaker = speaker;

  // ---------------------------------------------------------------- 누구인가
  /** 남편들 (배에 있는 사람만). 부하 명단에서 사라진 남편(전사·실종 등)은 여기서 정리한다 */
  H.list = function () {
    var p = P(); if (!p) return [];
    var l = p.husbands; if (!l || !l.length) return l || [];
    var gone = l.filter(function (h) { return !row(h.id); });
    if (gone.length) {
      p.husbands = l = l.filter(function (h) { return !!row(h.id); });
      gone.forEach(function (h) { var d = G.MATE[h.id]; if (d) G.State.log(d.name + U.jx(d.name, '이/가') + ' 배를 떠나 혼인이 끝났다.'); });
    }
    return l;
  };
  H.is = function (id) { return H.list().some(function (h) { return h.id === id; }); };
  H.count = function () { return H.list().length; };
  H.max = function () { return ((G.BALANCE && G.BALANCE.wives) || {}).maxSpouses || 12; };
  H.canMarry = function () { return H.count() < H.max(); };
  H.ids = function () { return H.list().map(function (h) { return h.id; }); };
  /** 세대 교체: 어머니의 남자들은 어머니를 따라간다 — 남편의 ID들을 돌려주고(부하 명단에서 내리는 일은 MaidSwap.retire가 한다),
      가계도에 남길 이름을 물러나는 제독에게 적어 둔다 (p.husbandNames — js/systems/familytree.js) */
  H.retire = function (p) {
    p = p || P(); var l = (p === P() ? H.list() : p.husbands) || [], ids = l.map(function (h) { return h.id; });
    p.husbandNames = l.map(function (h) { return H.name(h); });
    p.husbands = [];
    return ids;
  };
  H.name = function (h) { var d = G.MATE[typeof h === 'string' ? h : h.id]; return d ? d.name : '남편'; };
  function ordWord(n) { return (D().ord || [])[n - 1] || (n + '째'); }
  /** '첫째 남편' · '둘째 남편' … (남편이 한 사람뿐이면 그냥 '남편') */
  H.ordinal = function (h) { return typeof h !== 'number' && H.count() <= 1 ? '남편' : ordWord(typeof h === 'number' ? h : h.no || 1) + ' 남편'; };
  function nextNo() { var mx = 0; (P().husbands || []).forEach(function (h) { mx = Math.max(mx, h.no || 0); }); return mx + 1; }
  /** 이 부하에게 여성 제독이 마음을 줄 수 있나 (호감·선물·청혼) — 남성이고, 아이·동생·이미 짝이 있는 사람이 아니다 */
  H.loveable = function (d) { return !!(d && d.g !== 'f' && !d.sib && !d.minor && !d.wed); };

  // ---------------------------------------------------------------- 청혼
  /** 남성 부하에게 청혼한다 (js/city/matetalk.js). true = 혼인함 */
  H.propose = async function (d, m, say) {
    var s = S(), p = P(), L = D();
    if (!R.heroFemale(p) || !H.loveable(d) || !row(d.id)) return false;
    if (H.is(d.id)) { UI.toast('이미 남편입니다.', 'ring'); return false; }
    if (!H.canMarry()) { UI.toast('남편은 ' + H.max() + '명까지 맞을 수 있습니다.', 'ring', 4500); return false; }
    var pr = G.Romance && G.Romance.pairOf ? G.Romance.pairOf(d.id) : null;   // 다른 부하와 연인·부부인 사람 (js/systems/romance.js)
    if (pr && (pr.stage === 'wed' || pr.stage === 'lover')) { var oth = G.MATE[pr.m === d.id ? pr.f : pr.m]; await say(fill(L.taken, { name: oth ? oth.name : '다른 사람' }), 'shy'); return false; }
    if (!R.hasItem('ring')) { UI.toast('청혼하려면 약속 반지가 필요합니다.', 'ring'); return false; }
    var n = H.count(), no = nextNo();
    var ok = await UI.confirm(d.name + '에게 청혼하겠습니까?<br><small>' + (n ? '이미 남편이 ' + n + '명 있으니 ' + d.name + U.jx(d.name, '은/는') + ' <b>' + ordWord(no) + ' 남편</b>이 됩니다. ' : '') +
      '혼인한 뒤에도 부하로 남아 함께 항해합니다.</small>', '청혼한다', '그만둔다');
    if (!ok) return false;
    R.removeItem('ring');
    if (G.Outcome) await G.Outcome.show('propose', { sub: d.name + U.jx(d.name, '이/가') + ' 반지를 받아 주었다' });   // 결과 연출 (js/ui/outcome.js)
    await say(U.pick(n ? L.yesMore : L.yes), 'shy');
    (p.husbands || (p.husbands = [])).push({ id: d.id, wed: s.day, no: no });
    s.flags['wed_' + d.id] = 1;
    m.aff = 100; R.setLoyal(m, Math.max(m.loyal == null ? 70 : m.loyal, K().wedLoyal || 95));
    if (G.Growth) G.Growth.once('wed', 'cha', 1, '혼인 — 한 집안의 가장이 되었다');   // 첫 혼인: 매력 +1 (js/systems/growth.js)
    G.State.log(d.name + U.jx(d.name, '을/를') + ' ' + (n ? ordWord(no) + ' 남편' : '남편') + '으로 맞았다.');
    if (G.FamEv) await G.FamEv.wedding({ id: d.id, city: s.loc.city });
    await UI.alert(d.name + U.jx(d.name, '과/와') + ' 혼인했다! ' + (n ? ordWord(no) + ' 남편이 되어 ' : '') + '부하로 남아 함께 항해한다.', n ? ordWord(no) + ' 남편' : '혼인');
    if (G.Achieve && G.Achieve.afterWed) { try { await G.Achieve.afterWed(d.id); } catch (e) { console.error(e); } }   // 혼인 업적 (팜므파탈·측천무후 — js/systems/achieve.js)
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
  /** 무도회에서 청혼을 받아들인 귀공자를 남편으로 맞는다 (js/systems/ball.js · js/data/ballgents.js) — 반지 없이, 부하로 배에 오른다.
      몇째 남편인지 돌려준다 (0 = 맞지 못했다) */
  H.wedGuest = function (id) {
    var s = S(), p = P(), d = G.MATE[id]; if (!d || !R.heroFemale(p) || H.is(id) || !H.canMarry()) return 0;
    var m = row(id);
    if (!m) { m = { id: id, role: 'none', joined: U.dateNum(s.date), loyal: K().wedLoyal || 95, from: s.loc ? s.loc.city : null }; s.mates.push(m); }
    var no = nextNo();
    (p.husbands || (p.husbands = [])).push({ id: id, wed: s.day, no: no });
    s.flags['wed_' + id] = 1;
    m.aff = 100; R.setLoyal(m, Math.max(m.loyal == null ? 70 : m.loyal, K().wedLoyal || 95));
    if (G.Growth) G.Growth.once('wed', 'cha', 1, '혼인 — 한 집안의 가장이 되었다');
    return no;
  };
  /** 해고하려 할 때 남편이 하는 말 (js/systems/matedismiss.js) */
  H.fireLine = function () { return D().fire || '나는 그대의 남편이오.'; };

  // ---------------------------------------------------------------- 이야기할 때의 말 (js/city/matetalk.js)
  /** 호감이 높은 남성 부하·남편이 건네는 말 — 없으면 null (보통 말을 쓴다) */
  H.chatLine = function (d, m) {
    var L = D(), a = m.aff || 0;
    if (H.is(d.id)) return U.chance(0.6) ? U.pick(L.chatWed) : U.pick(L.chatHigh);
    if (a >= 80) return U.pick(L.chatHigh);
    if (a >= 50 && U.chance(0.6)) return U.pick(L.chatMid);
    return null;
  };

  // ---------------------------------------------------------------- 자택 (js/city/misc.js HM.enter)
  /** 남편들과 함께 집에 들어선다. true = 인사를 했다 */
  H.homeGreet = async function () {
    var l = H.list(); if (!l.length) return false;
    var L = D(), away = G.FamEv && G.FamEv.awayDays ? G.FamEv.awayDays() : 0;
    var h = U.pick(l), t = l.length >= 2 && U.chance(0.4) ? U.pick(L.homeMany) : away >= 30 ? fill(U.pick(L.homeLong), { n: away }) : U.pick(L.home);
    await UI.say(t, speaker(h.id, 'happy'));
    return true;
  };

  // ---------------------------------------------------------------- 주먹다짐 (입항할 때 — js/scenes/city.js)
  function fit() { var s = S(); return H.list().filter(function (h) { var m = row(h.id); return m && !(m.hurt > s.day); }); }
  H.pending = function () {
    var s = S(), k = K(); if (!s || !R.heroFemale() || (G.Tutorial && G.Tutorial.active && G.Tutorial.active())) return false;
    if (fit().length < 2) return false;
    var o = st(); if (o.brawl != null && s.day - o.brawl < (k.brawlGap || 120)) return false;
    if (o.roll === s.day) return false;       // 같은 날 여러 번 굴리지 않는다
    o.roll = s.day;
    return U.chance(k.brawlChance == null ? 0.25 : k.brawlChance);
  };
  H.check = async function () {
    var s = S(), k = K(), B = D().brawl, two = U.shuffle(fit().slice()).slice(0, 2); if (two.length < 2 || !B) return false;
    var a = two[0].id, b = two[1].id, o = { a: H.name(a), b: H.name(b) };
    st().brawl = s.day;
    await UI.alert(fill(U.pick(B.open), o), B.title);
    await UI.say(U.pick(B.a), speaker(a, 'angry'));
    await UI.say(U.pick(B.b), speaker(b, 'angry'));
    var chance = Math.min(k.calmMax || 0.9, (k.calmBase || 0.35) + R.stat('cha') * (k.calmCha || 0.006));
    var v = await UI.ask(B.ask, [{ label: B.calm, right: '매력 · ' + Math.round(chance * 100) + '%', value: 'calm' }, { label: B.leave, value: 'leave' }], {});
    if (v === 'calm' && U.chance(chance)) {
      await UI.say(U.pick(B.calmOk), speaker(U.pick([a, b]), 'warm'));
      [a, b].forEach(function (id) { var m = row(id); if (m) R.setLoyal(m, (m.loyal == null ? 70 : m.loyal) + (k.calmLoyal || 0)); });
      G.State.log(fill(B.logOk, o));
      return true;
    }
    if (v === 'calm') await UI.say(B.calmFail, {});
    // 무력이 낮은 쪽이 더 자주 진다
    function mar(id) { var d = G.MATE[id], t = d && d.st; return (t && (t.mar != null ? t.mar : t[2])) || 50; }
    var pa = mar(a) / (mar(a) + mar(b)), loser = U.chance(pa) ? b : a, winner = loser === a ? b : a, lm = row(loser), days = k.hurtDays || 20;
    lm.hurt = Math.max(lm.hurt || 0, s.day + days);
    R.setLoyal(lm, (lm.loyal == null ? 70 : lm.loyal) + (k.brawlLoyal || 0));
    await UI.say(U.pick(B.lose), speaker(loser, 'sad'));
    await UI.say(U.pick(B.win), speaker(winner, 'warm'));
    o.l = H.name(loser); o.d = days;
    G.State.log(fill(B.logHurt, o));
    UI.toast(H.name(loser) + ' — ' + days + '일 동안 다쳐 능력이 절반이 된다', 'people', 5000);
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };

  // ---------------------------------------------------------------- 수첩 (js/ui/info.js)
  /** 「배우자」 칸 — 남편이 없으면 null (예전 글을 쓴다) */
  H.info = function () {
    var l = H.list(), s = S(); if (!l.length) return null;
    return l.map(function (h) { var m = row(h.id); return U.esc(H.name(h)) + (l.length > 1 ? ' <small class="muted">(' + H.ordinal(h) + ')</small>' : '') + (m && m.hurt > s.day ? ' <small class="muted">· 다침</small>' : ''); }).join(' · ') +
      ' <small class="muted">— 배에 함께</small>';
  };
})(window.G = window.G || {});
