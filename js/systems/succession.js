/* 후원자의 대가 바뀔 때 (G.Succession)
   · 군주·후원자가 세상을 떠나거나 물러나 다음 사람이 자리를 이으면, 그 자리와 쌓은 신뢰는 절반만 남는다(G.BALANCE.succession.sponsorKeep).
   · 제독이 직접 만나 본 사람이었다면 제독이 그를 떠올리는 말이 소식에 실린다 (처음 알현한 해·알현 횟수·함께 이룬 항해·신뢰).
   · 신뢰가 높았으면 유언으로 물건이나 돈을 남기기도 한다 (학자는 연구 노트 — 발견 단서).
   · 제독의 자녀가 뒤를 이으면 모든 후원자의 신뢰는 30%만 남는다(G.BALANCE.succession.heirKeep) — family.js의 F.succeed.
   상태: s.spHolder[후원자] = 지금 대의 열쇠, rel.know[열쇠] = {y, m, n, gen, done0} (그 사람을 만난 기록), rel.who = 마지막으로 알현한 사람의 열쇠 */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var SC = {};
  G.Succession = SC;
  function S() { return G.Game.state; }
  function cfg() { return (G.BALANCE && G.BALANCE.succession) || {}; }

  /** 그 대(代) 사람의 열쇠 — 이름이 같아도 시작 해가 다르면 다른 사람 */
  SC.key = function (sp, idx) { var h = sp.holders[idx]; return h ? sp.id + ':' + h[0] + ':' + h[2] : null; };
  SC.curKey = function (sp, date) { return SC.key(sp, G.Sponsor.holderIndex(sp, date)); };
  function holderOf(sp, key) { for (var i = 0; i < sp.holders.length; i++) if (SC.key(sp, i) === key) return { h: sp.holders[i], i: i }; return null; }

  /** 새 게임·옛 저장: 지금 자리에 있는 사람들을 조용히 기억해 둔다 */
  SC.sync = function () {
    var s = S(); if (!s) return;
    if (!s.spHolder) s.spHolder = {};
    G.SPONSORS.forEach(function (sp) { if (!(sp.id in s.spHolder)) s.spHolder[sp.id] = SC.curKey(sp); });
  };

  /** 알현할 때 (G.Sponsor.audience) — 누구를 언제 만났는지 */
  SC.meet = function (sp) {
    var s = S(), rel = G.Sponsor.rel(sp.id), k = SC.curKey(sp);
    if (!k) return;
    rel.know = rel.know || {};
    SC.firstMeetingBefore = rel.who !== k;          // 이번 알현이 이 사람과의 첫 만남인가 (궁정 인사말이 읽는다)
    SC.newHolderBefore = !!rel.who && rel.who !== k; // 전에 다른 사람(선대)을 만난 적이 있다
    var kn = rel.know[k] || (rel.know[k] = { y: s.date.y, m: s.date.m, n: 0, gen: s.player.generation || 1, done0: rel.done || 0 });
    kn.n++;
    rel.who = k;
  };

  function ended(h) { return h[4] === 'x' ? '자리에서 물러나셨다' : '세상을 떠나셨다'; }
  function endedPlain(sp, h) {
    if (h[4] === 'x') return '자리에서 물러났다';
    return sp.type === 'king' || sp.type === 'pope' || h[4] !== 'g' ? '세상을 떠났다' : '자리를 내주었다';
  }

  /** 제독이 떠올리는 말 */
  function remember(sp, h, kn, trust0, doneN) {
    var s = S(), nm = h[2], hon = G.Sponsor.honor(sp), heirView = (kn.gen || 1) < (s.player.generation || 1);
    var who = nm + ' ' + hon;
    if (heirView) {
      return U.pick([
        '「아버지께서 자주 말씀하시던 ' + who + '께서 ' + ended(h) + '. ' + kn.y + '년 처음 알현하던 날 이야기를 몇 번이고 들었었지.」',
        '「' + who + '… 아버지의 항해를 믿어 주셨던 분이다. 이제 그 믿음은 내가 다시 쌓아야 한다.」'
      ]);
    }
    var times = kn.n > 1 ? kn.n + '번이나 알현했었는데' : '단 한 번 알현했을 뿐이지만';
    if (trust0 >= 60) {
      return U.pick([
        '「' + who + '께서 ' + ended(h) + '니… ' + kn.y + '년에 처음 뵈었을 때 내 이야기를 끝까지 들어 주시던 모습이 눈에 선하다.' + (doneN ? ' 그분이 믿어 주신 덕분에 ' + doneN + '번의 항해를 마칠 수 있었다.' : '') + '」',
        '「' + times + ', ' + who + '께서는 늘 먼 바다 이야기를 반기셨다. 그 믿음에 끝내 다 보답하지 못했구나.」',
        '「' + who + '… ' + kn.y + '년 그날의 알현이 내 항해의 시작이었다. 편히 쉬소서.」'
      ]);
    }
    if (trust0 >= 25) {
      return U.pick([
        '「' + who + '께서 ' + ended(h) + '. ' + kn.y + '년 처음 알현하던 날의 긴장이 아직도 생생하다.」',
        '「' + times + ' ' + who + '의 마음을 다 얻지는 못했다. 다음 분께는 더 나은 항해를 보여 드려야지.」'
      ]);
    }
    return U.pick([
      '「' + who + '… 끝내 믿음을 얻지는 못했지만, 바다 이야기에 귀를 기울이시던 순간은 있었다.」',
      '「' + who + '께서 ' + ended(h) + '. ' + kn.y + '년의 알현은 차가웠지만, 그래도 문을 열어 주신 분이었다.」'
    ]);
  }

  /** 유산 — 신뢰가 높았던 사람이 남기는 것 */
  var LEGACY = {
    king: ['flamberge', 'plate', 'breast', 'telescope', 'sextant', 'pearlnk', 'tears'],
    pope: ['charm', 'tears', 'rose', 'astrolabe'],
    priest: ['charm', 'astrolabe', 'rose'],
    noble: ['estoc', 'brigandine', 'pearlnk', 'shawl', 'telescope'],
    gov: ['breast', 'telescope', 'sextant', 'saber'],
    official: ['sextant', 'compass', 'telescope', 'perfume'],
    merchant: ['pearlnk', 'tears', 'telescope', 'shawl'],
    scholar: ['astrolabe', 'sextant', 'telescope', 'compass']
  };
  function legacy(sp, h, trust0) {
    var c = cfg(), s = S(), p = s.player, out = [];
    var need = c.legacyTrust || 70;
    if (trust0 < need || !U.chance(Math.min(0.9, (c.legacyBase || 0.35) + (trust0 - need) / 60))) return out;
    var who = h[2] + ' ' + G.Sponsor.honor(sp);
    var gold = Math.round((sp.wealth || 2) * (sp.pw || 1) * (c.legacyGold || 250) * (0.8 + trust0 / 100));
    var pool = (LEGACY[sp.type] || LEGACY.noble).filter(function (id) { return G.ITEM[id] && !R.hasItem(id); });
    var item = pool.length ? U.pick(pool) : null;
    if (item && R.addItem(item, { legacy: h[2] })) {
      out.push({ icon: 'chest', text: who + '의 유언에 따라 「' + G.ITEM[item].name + '」' + U.jx(G.ITEM[item].name, '을/를') + ' 물려받았다. (' + G.ITEM[item].desc + ')' });
      G.State.log(h[2] + '의 유품 「' + G.ITEM[item].name + '」' + U.jx(G.ITEM[item].name, '을/를') + ' 물려받았다.');
      gold = Math.round(gold * 0.4);
    }
    if (gold > 0) {
      p.gold += gold;
      out.push({ icon: 'coin', text: who + U.jx(G.Sponsor.honor(sp), '이/가') + ' 남긴 뜻에 따라 금화 ' + U.num(gold) + '닢을 받았다.' });
    }
    // 학자는 연구 노트를 남긴다 — 아직 모르는 발견 하나의 단서
    if (sp.type === 'scholar' && G.Disc && G.DISCOVERIES) {
      var cand = G.DISCOVERIES.filter(function (d) {
        return !s.hints[d.id] && !G.Disc.foundByMe(d.id) && sp.taste.indexOf(d.cat) >= 0 && G.Disc.available(d);
      });
      if (cand.length) {
        var d = U.pick(cand);
        if (G.Disc.addHint(d.id, 'legacy:' + sp.id)) out.push({ icon: 'scroll', text: h[2] + '의 연구 노트에서 「' + d.name + '」에 관한 단서를 얻었다.' });
      }
    }
    return out;
  }

  /** 해마다 (W.newYear) — 대가 바뀐 자리를 찾아 처리한다 */
  SC.year = function () {
    var s = S(), out = [], c = cfg();
    if (!s.spHolder) { SC.sync(); return out; }
    G.SPONSORS.forEach(function (sp) {
      var prev = s.spHolder[sp.id], cur = SC.curKey(sp);
      if (prev === undefined) { s.spHolder[sp.id] = cur; return; }
      if (prev === cur) return;
      s.spHolder[sp.id] = cur;
      if (!prev) {       // 비어 있던 자리에 새 사람 (교황 선출 등)
        var nh = cur && G.Sponsor.holder(sp);
        if (nh && nh !== sp.title && (s.sponsors[sp.id] || ((sp.type === 'king' || sp.type === 'pope') && sp.pw >= 4)))
          out.push({ icon: 'crown', history: true, text: sp.title + ' 자리에 ' + nh + U.jx(nh, '이/가') + ' 올랐다.' });
        return;
      }
      var old = holderOf(sp, prev); if (!old) return;
      var h = old.h, rel = s.sponsors[sp.id];
      var nxt = cur ? G.Sponsor.holder(sp) : null;
      var base = function (n) { return String(n || '').replace(/\(.*?\)/g, '').replace(/\s/g, ''); };
      if (nxt && base(h[2]) === base(nxt)) {          // 섭정·수렴청정이 끝나 몸소 다스리기 시작 (같은 사람)
        if (/섭정|수렴청정/.test(h[2]) && (rel || ((sp.type === 'king' || sp.type === 'pope') && sp.pw >= 4)))
          out.push({ icon: 'crown', history: true, text: sp.title + ' ' + nxt + U.jx(nxt, '이/가') + ' 섭정을 거두고 몸소 다스리기 시작했다.' });
        if (rel && rel.know && rel.know[prev]) rel.know[cur] = rel.know[prev];
        return;
      }
      // 소식: 큰 나라의 군주이거나 제독이 아는 자리일 때
      if (rel || ((sp.type === 'king' || sp.type === 'pope') && sp.pw >= 4)) {
        var sameGen = h[4] === 'g' && nxt === sp.title;
        var who0 = h[2] === sp.title ? sp.title : sp.title + ' ' + h[2];
        if (!sameGen) out.push({ icon: 'crown', history: true, text: who0 + U.jx(h[2], '이/가') + ' ' + endedPlain(sp, h) + '.' + (nxt ? ' ' + nxt + U.jx(nxt, '이/가') + ' 뒤를 이었다.' : '') });
      }
      if (!rel) return;
      // 자리와 쌓은 신뢰는 절반만 남는다
      var trust0 = rel.trust || 0;
      rel.trust = Math.round(trust0 * (c.sponsorKeep != null ? c.sponsorKeep : 0.5));
      rel.anger = 0;
      var kn = rel.know && rel.know[prev];
      if (kn) {
        out.push({ icon: 'people', memory: true, text: remember(sp, h, kn, trust0, Math.max(0, (rel.done || 0) - (kn.done0 || 0))) });
        out = out.concat(legacy(sp, h, trust0));
      }
      if (trust0 > 0) out.push({ icon: 'seal', text: (nxt || sp.title) + U.jx(nxt || sp.title, '과/와') + '의 신뢰는 새로 쌓아야 한다. (' + sp.title + ' 신뢰 ' + trust0 + ' → ' + rel.trust + ')' });
    });
    return out;
  };

  /** 제독의 자녀가 뒤를 이을 때 — 모든 후원자의 신뢰가 줄어든다 */
  SC.heir = function () {
    var s = S(), keep = cfg().heirKeep != null ? cfg().heirKeep : 0.3;
    for (var id in s.sponsors) {
      var r = s.sponsors[id];
      r.trust = Math.round((r.trust || 0) * keep);
      r.anger = 0;
      r.who = null;            // 새 제독은 처음 인사를 드려야 한다
    }
  };
})(window.G = window.G || {});
