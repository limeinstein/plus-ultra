/* 열여덟 살이 된 딸의 혼례 (G.KidWed) — 자료·대사: js/data/kidwed.js (G.KIDWED · G.BALANCE.kidwed)
   ■ 언제: 자택에 들어설 때(js/systems/homelife.js HL.happen) 열여덟 살이 넘은, 아직 시집가지 않은 딸이 있으면 — 한 번에 한 딸.
   ■ 아버지와 함께한 시간(k.touch — 할 일·집에서 생긴 일마다 1)이 50번을 넘으면: 왕궁 전령이 와서 왕세자비로 청한다 → 혼례 · 결말 낭독 · 딸의 편지.
     그 밖에는 딸이 가장 잘 자란 능력으로 혼처가 정해진다(매력 = 귀족, 지력 = 학자, 무력 = 기사, 힘 = 선장). 사이가 20 아래면 편지 한 장 남기고 떠난다.
   ■ 「아직은 품에 두고 싶다」를 고르면 한 해 뒤에 다시 청한다.
   ■ 저장: k.married = {kind:'prince'|'cha'|'int'|'mar'|'str'|'away', y, title}, k.wedNext = 다시 청하는 날. 시집간 딸은 집(HL.kidsHome)에 없다. */
(function (G) {
  'use strict';
  var U = G.U, KW = {};
  G.KidWed = KW;
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.kidwed) || { age: 18, touch: 50 }; }
  function D() { return G.KIDWED; }
  function F() { return G.Family; }
  function HL() { return G.HomeLife; }

  /** 혼례를 치를 딸 (없으면 null) */
  KW.due = function () {
    var s = S(); if (!s || !s.player || !s.player.kids) return null;
    var age = K().age || 18;
    return s.player.kids.filter(function (k) {
      return k.sex === 'f' && !k.unnamed && !k.married && !k.lost && k.house == null && F().kidAge(k) >= age   // !k.lost: 섬에서 사라진 딸은 혼례를 올리지 않는다 (QA 2026-10-23) && (k.wedNext == null || s.day >= k.wedNext);
    })[0] || null;
  };
  // 이미 왕세자비가 된 딸이 있으면(p.royalKin) 다음 딸은 보통 혼처로 — 딸마다 왕세자비가 되던 것 (QA 2026-10-23)
  KW.royal = function (k) { var p = S() && S().player; if (p && p.royalKin) return false; return HL().touch(k) >= (K().touch || 50); };

  function crown() {
    try { if (G.Colony && G.Colony.crown) { var sp = G.Colony.crown(); if (sp) return sp; } } catch (e) { /* */ }
    var p = S().player, id = p.nation === 'ES' ? 'es_crown' : 'pt_king';
    return G.SPONSOR && G.SPONSOR[id] || null;
  }
  function fill(t, k, extra) {
    var s = S(), p = s.player, sp = crown(), o = {
      name: k ? k.name : '', father: p.name, mother: F().wifeName ? F().wifeName() : '',
      king: sp && G.Sponsor ? G.Sponsor.holderName(sp) : '국왕 전하', court: sp ? G.CITY_DATA[sp.city].name : '',
      nation: G.R.nationName ? G.R.nationName(p.nation) : ''
    };
    for (var x in extra || {}) o[x] = extra[x];
    return String(t).replace(/\{(\w+)(?::([^}]+))?\}/g, function (all, key, pair) {
      if (o[key] == null) return all;
      var w = String(o[key]); return pair ? U.j(w, pair) : w;
    });
  }
  KW.fill = fill;
  async function say(list, who, k, extra) { list = [].concat(list || []); for (var i = 0; i < list.length; i++) await G.UI.say(fill(list[i], k, extra), who); }
  /** 'k:…' 딸 · 'w:…' 아내 · 'n:…' 낭독 */
  async function lines(list, k, extra) {
    list = [].concat(list || []);
    for (var i = 0; i < list.length; i++) {
      var l = list[i], who = l.slice(0, 2), t = fill(l.slice(2), k, extra);
      if (who === 'k:') await G.UI.say(t, HL().speaker(k));
      else if (who === 'w:') { if (S().player.wife) await G.UI.say(t, F().wifeSpeaker()); }
      else await G.UI.say(t, {});
    }
  }
  function npc(seed, role, title, sex) {
    var c = G.CITY_DATA[S().player.home] || G.CITY_DATA[0], A = G.Art;
    return { name: title, portrait: A.withImg(A.npcSpec(seed, role, G.Img.folkStyle(c), sex || 'm'), []), lang: 3 };
  }
  function pic(key, title) {
    if (!G.FamEv || !G.FamEv.showPic || !key) return null;
    try { return G.FamEv.showPic({ img: key, title: title }); } catch (e) { return null; }
  }
  /** 결말 카드 — 프린세스 메이커의 엔딩 화면처럼 */
  function card(k, title, body) {
    return G.UI.alert('<div class="center" style="font-size:15px;letter-spacing:.2em;color:#8a6a3a">— ENDING —</div>' +
      '<div class="center" style="font-size:26px;font-weight:700;margin:6px 0 12px">' + U.esc(fill(D().endingCard, k, { title: title })) + '</div>' +
      '<div style="line-height:1.75">' + body + '</div>', title);
  }

  /** 자택에 들어설 때 — 치렀으면 true */
  KW.check = async function () {
    var k = KW.due(); if (!k) return false;
    if (KW.royal(k)) await prince(k); else await common(k);
    if (G.Game.cityHud) G.Game.cityHud();
    return true;
  };

  async function prince(k) {
    var UI = G.UI, s = S(), p = s.player, d = D().prince, b = K(), sp = crown();
    var herald = G.Scenes.city && G.Scenes.city.npc ? G.Scenes.city.npc('herald', '왕실 전령') : npc('herald', 'official', '왕실 전령');
    herald.lang = 3; herald.li = null;
    await say(d.herald, herald, k);
    if (p.wife) await say(d.mother, F().wifeSpeaker(), k);
    await say(d.daughter, HL().speaker(k), k);
    var v = await UI.ask(fill(d.ask, k), [{ label: fill(d.yes, k), value: 'yes' }, { label: fill(d.no, k), value: 'no' }], HL().speaker(k));
    if (v !== 'yes') { await lines(d.noSay, k); k.wedNext = s.day + (b.waitDays || 365); F().addBond(k, 3); G.State.log(k.name + '의 왕실 혼담을 한 해 미루었다.'); return; }
    var pc = pic('family-events/31_daughter_wedding_father_pov', '왕세자비의 혼례');
    try { await lines(d.wedding, k); } finally { if (pc) await pc.stop(); }
    // 결말 낭독 — 무릎 꿇은 아버지 앞에서
    await card(k, d.title, d.ending.map(function (t) { return U.esc(fill(t, k)); }).join('<br>'));
    await say(d.letter.join('\n'), HL().speaker(k), k);
    await UI.say(fill(d.father, k), { name: p.name, portrait: p.portrait, half: G.Img.chain.heroHalf ? G.Img.chain.heroHalf() : null, lang: 3 });
    k.married = { kind: 'prince', y: s.date.y, title: d.title }; k.aboard = false;
    p.gold += b.royalGift || 0;
    var royalFame = G.Fame ? G.Fame.add('so', b.royalFame || 0) : 0;
    p.royalKin = { name: k.name, y: s.date.y, sp: sp ? sp.id : null };
    F().addBond(k, 10);
    G.State.log(k.name + U.jx(k.name, '이/가') + ' ' + (sp ? G.Sponsor.holderName(sp) + '의 ' : '') + '왕세자비가 되었다. (왕실 예물 금화 ' + U.num(b.royalGift || 0) + '닢)');
    UI.toast(k.name + ' — 왕세자비 · 왕실 예물 금화 ' + U.num(b.royalGift || 0) + '닢 · 사교 명성 +' + royalFame, 'crown', 6000);
    if (G.Audio) G.Audio.sfx('cheer');
  }

  /** 딸이 가장 잘 자란 능력 (사이가 20 아래면 away) */
  KW.kind = function (k) {
    if (F().bond(k) < 20) return 'away';
    var st = k.st || {}, best = 'cha';
    ['cha', 'int', 'mar', 'str'].forEach(function (x) { if ((st[x] || 0) > (st[best] || 0)) best = x; });
    return best;
  };
  async function common(k) {
    var UI = G.UI, s = S(), p = s.player, b = K(), kind = KW.kind(k), E = D().common[kind];
    var c = G.CITY_DATA[p.home] || G.CITY_DATA[0], lo = (b.dowry || [2000, 6000])[0], hi = (b.dowry || [2000, 6000])[1];
    var gift = Math.round(lo + (hi - lo) * ((c.size || 1) - 1) / 2);
    if (kind === 'away') {
      await card(k, E.title, E.ending.map(function (t) { return U.esc(fill(t, k)); }).join('<br>'));
      k.married = { kind: kind, y: s.date.y, title: E.title }; k.aboard = false;
      G.State.log(k.name + U.jx(k.name, '이/가') + ' 편지 한 장을 남기고 집을 떠났다.');
      return;
    }
    var role = kind === 'cha' ? 'noble' : kind === 'int' ? 'scholar' : kind === 'mar' ? 'soldier' : 'captain';
    var groom = npc('groom_' + k.name + k.born.y, role, E.suitor);
    await UI.say(fill(E.groomSay, k), groom);
    var v = await UI.ask(fill(D().commonAsk, k, { suitor: E.suitor }), [
      { label: fill(D().commonYes, k, { gift: U.num(gift) }), value: 'yes' },
      { label: fill(D().commonNo, k), value: 'no' }], HL().speaker(k));
    if (v !== 'yes') { k.wedNext = s.day + (b.waitDays || 365); await lines(['k:…네, 아버지. 조금만 더 이 집에 있을게요.'], k); return; }
    var paid = Math.min(p.gold, gift); p.gold -= paid;
    var pc = pic('family-events/31_daughter_wedding_father_pov', E.title);
    try { await lines(['n:항구의 작은 성당에서 혼례가 열렸다. 선원들이 모자를 흔들며 노래를 불렀다.', 'k:아버지, 저 행복해 보여요? …다행이다.'], k); } finally { if (pc) await pc.stop(); }
    await card(k, E.title, E.ending.map(function (t) { return U.esc(fill(t, k)); }).join('<br>'));
    await say(D().commonLetter.join('\n'), HL().speaker(k), k);
    k.married = { kind: kind, y: s.date.y, title: E.title }; k.aboard = false;
    F().addBond(k, 5);
    G.State.log(k.name + U.jx(k.name, '이/가') + ' ' + E.suitor + U.jx(E.suitor, '과/와') + ' 혼례를 올렸다. (지참금 금화 ' + U.num(paid) + '닢)');
    UI.toast(k.name + ' — ' + E.title + (paid ? ' · 지참금 금화 ' + U.num(paid) + '닢' : ''), 'heart', 5000);
  }
})(window.G = window.G || {});
