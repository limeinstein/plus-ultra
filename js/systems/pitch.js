/* 보고·발표의 자리 (G.Pitch) — 2026-10-12
   후원자에게 보고하거나 항구에서 발표할 때:
   ① 발견물 그림을 사람 없이 먼저 다시 재생하고 완전히 걷는다 (G.Scenes.discoveryReplay)
   ② 제독이 내놓는다 — 매력·웅변에 따라 말투가 다르다
   ③ 후원자가 먼저 반응한다 — 관심사(taste)에 드는가, 왕·성직자·상인·학자 가운데 누구인가
   ④ 지식이 있는 부하가 값어치를 띄운다(아부) — 부하가 가진 지식(역사·과학·측량 / 그림·음악 / 회계·요리·세공 / 신학 / 항해·운용·무예)에 따라
      학문·아름다움·돈·신앙·영광 가운데 한 쪽으로, 지식이 얕고 말만 앞서는 부하는 부풀리기로.
      먹히는가는 후원자의 갈래·성품·관심사, 부하의 지식 단계·매력, 그리고 부하와 후원자의 나이·성별, 제독의 웅변·매력에 따라 다르다.
   ⑤ 넘어가면 사례·명성이 오르고(최대 +25% 남짓), 시큰둥하면 그대로, 부풀린 것을 들키면 깎이고 신뢰가 준다.
   G.Pitch.run({d, sp, mode:'contract'|'late'|'announce', city}) → {k, fk, trust, close()} */
(function (G) {
  'use strict';
  var P = {}, U = G.U, R = G.R, UI = G.UI;
  G.Pitch = P;
  function S() { return G.Game.state; }
  function L() { return G.PITCH; }
  function B() { return (G.BALANCE && G.BALANCE.pitch) || {}; }

  // ------------------------------------------------------------------ 말 다듬기
  var JX = { '을': '을/를', '를': '을/를', '은': '은/는', '는': '은/는', '이': '이/가', '가': '이/가', '과': '과/와', '와': '과/와' };
  function nameJ(nm, j) { return nm + (j === '이라' ? U.jx(nm, '이라/라') : U.jx(nm, JX[j])); }
  P.fmt = function (t, c) {
    c = c || {};
    var dn = c.d || '';
    t = t.replace(/\{d\}(이라|을|를|은|는|이|가|과|와)(?=[\s.,…!?—'」)]|$)/g, function (_, j) { return '「' + dn + '」' + nameJ(dn, j).slice(dn.length); });
    t = t.replace(/\{d\}/g, '「' + dn + '」');
    return t.replace(/\{(\w+)\}/g, function (m, k) { return c[k] != null ? c[k] : m; });
  };
  function pick(key, arr) { return arr && arr.length ? (U.pickFresh ? U.pickFresh('pitch:' + key, arr) : U.pick(arr)) : ''; }

  // ------------------------------------------------------------------ 사람의 나이·성별
  /** 'young' | 'mid' | 'old' */
  P.mateAge = function (id) { var sp = G.Art && G.Art.mateSpec ? G.Art.mateSpec(id) : null; return (sp && sp.age) || 'mid'; };
  P.sponsorAge = function (sp) {
    var spec = G.Art && G.Art.sponsorSpec && G.Sponsor ? G.Art.sponsorSpec(sp, G.Sponsor.holderIndex(sp)) : null;
    return (spec && spec.age) || 'mid';
  };
  P.playerAge = function () { var a = R.age ? R.age() : 30; return a < 28 ? 'young' : a >= 50 ? 'old' : 'mid'; };
  var AGE_N = { young: 0, mid: 1, old: 2 };

  /** 후원자의 갈래 (말과 쪽의 궁합에 쓴다) */
  P.kind = function (sp) {
    if (!sp) return 'crowd';
    var t = sp.type;
    if (t === 'pope' || t === 'priest') return 'church';
    if (t === 'merchant') return 'merchant';
    if (t === 'scholar') return 'scholar';
    if (t === 'king') return 'king';
    return 'noble';      // gov · noble · official
  };

  // ------------------------------------------------------------------ 쪽: 이 발견물에 어울리는 정도 (0~1)
  function faithD(d) { return !!(G.INTERESTS && G.INTERESTS.faith && G.INTERESTS.faith.has(d)); }
  function mythD(d) { return !!(G.INTERESTS && G.INTERESTS.myth && G.INTERESTS.myth.has(d)); }
  function artD(d) { return !!(G.INTERESTS && G.INTERESTS.art && G.INTERESTS.art.has(d)); }
  P.fit = function (a, d) {
    var c = d.cat;
    if (a === 'scholar') return { geo: 1, ruin: 1, creature: 1, nature: 0.9, people: 0.8, treasure: 0.6, trade: 0.5 }[c] || 0.5;
    if (a === 'beauty') return artD(d) ? 1 : ({ nature: 0.9, ruin: 0.9, treasure: 0.8, people: 0.8, creature: 0.6, geo: 0.4, trade: 0.3 }[c] || 0.4);
    if (a === 'profit') return { treasure: 1, trade: 1, creature: 0.5, ruin: 0.4, nature: 0.3, people: 0.3, geo: 0.6 }[c] || 0.3;
    if (a === 'faith') return faithD(d) ? 1 : ({ ruin: 0.5, people: 0.5, nature: 0.3 }[c] || 0.15);
    if (a === 'glory') return Math.min(1, 0.35 + (d.pw || 1) * 0.15 + (c === 'geo' ? 0.3 : 0));
    if (a === 'legend') return mythD(d) ? 1 : 0.5;
    return 0.3;
  };
  /** 쪽과 후원자의 궁합 (−0.3 ~ +0.4) */
  P.aff = function (a, sp, d) {
    var kd = P.kind(sp), tp = sp && G.Sponsor ? G.Sponsor.temper(sp) : null, taste = (sp && sp.taste) || [], v = 0;
    var has = function (t) { return taste.indexOf(t) >= 0; };
    if (a === 'scholar') v += (kd === 'scholar' ? 0.25 : 0) + (tp === 'careful' ? 0.1 : 0) + (has(d.cat) ? 0.08 : 0) + (kd === 'crowd' ? -0.05 : 0);
    if (a === 'beauty') v += (has('art') ? 0.25 : 0) + (kd === 'noble' || kd === 'king' ? 0.08 : 0) + (tp === 'generous' ? 0.05 : 0) + (kd === 'merchant' ? -0.05 : 0);
    if (a === 'profit') v += (kd === 'merchant' ? 0.28 : 0) + (tp === 'greedy' ? 0.2 : 0) + (has('trade') || has('treasure') ? 0.1 : 0) + (kd === 'church' ? -0.15 : 0) + (kd === 'crowd' ? 0.08 : 0);
    if (a === 'faith') v += (kd === 'church' ? 0.32 : 0) + (has('faith') ? 0.2 : 0) + (kd === 'merchant' ? -0.08 : 0) + (kd === 'scholar' ? -0.05 : 0);
    if (a === 'glory') v += (kd === 'king' ? 0.22 : kd === 'noble' ? 0.12 : 0) + (tp === 'hasty' ? 0.1 : 0) + (kd === 'scholar' ? -0.1 : 0) + (kd === 'crowd' ? 0.12 : 0);
    if (a === 'legend') v += (has('myth') ? 0.25 : 0) + (tp === 'generous' ? 0.05 : 0) + (tp === 'careful' ? -0.3 : 0) + (kd === 'scholar' ? -0.25 : 0) + (kd === 'crowd' ? 0.1 : 0);
    return U.clamp(v, -0.3, 0.4);
  };

  // ------------------------------------------------------------------ 누가 어느 쪽으로 말하는가
  var ANGLES = ['scholar', 'beauty', 'profit', 'faith', 'glory'];
  /** 부하마다 가장 잘 맞는 쪽 하나: {m, id, name, angle, lv, score} — 지식이 얕고 매력만 있는 부하는 「부풀리기」 */
  P.candidates = function (d, sp) {
    var s = S(), out = [];
    (s.mates || []).forEach(function (m) {
      var md = G.MATE[m.id]; if (!md) return;
      if (R.mateHidden && R.mateHidden(m)) return;
      var best = null;
      ANGLES.forEach(function (a) {
        var sk = L().angle[a].sk, lv = 0;
        sk.forEach(function (k) { lv = Math.max(lv, R.mateSkill(m, k)); });
        if (!lv) return;
        var sc = lv * P.fit(a, d) + P.aff(a, sp, d) * 2;
        if (!best || sc > best.score) best = { m: m, id: m.id, name: md.name, angle: a, lv: lv, score: sc };
      });
      var st = md.st || [50, 50, 50, 50];
      // 이렇다 할 지식은 없는데 입담만 좋은 부하: 이야기를 부풀린다
      if ((!best || best.lv <= 1) && st[3] >= 60 && st[1] < 60) best = { m: m, id: m.id, name: md.name, angle: 'legend', lv: 1, score: 0.6 + P.aff('legend', sp, d) * 2 + (st[3] - 60) / 40 };
      if (best && best.score > 0.3) out.push(best);
    });
    out.sort(function (a, b) { return b.score - a.score; });
    // 같은 쪽을 두 번 하지 않는다 — 두 사람이면 서로 다른 쪽으로
    var seen = {}, res = [];
    out.forEach(function (c) { if (res.length < 2 && !seen[c.angle]) { seen[c.angle] = 1; res.push(c); } });
    if (res.length === 2 && (res[1].lv < 2 || res[1].score < res[0].score * 0.6)) res.length = 1;
    return res;
  };

  /** 나이·성별의 궁합: {k: 확률 보정, tag: 후원자가 덧붙일 말의 갈래} */
  P.demo = function (c, sp) {
    var md = G.MATE[c.id] || {}, ma = AGE_N[P.mateAge(c.id)], st = md.st || [50, 50, 50, 50];
    if (!sp) return { k: (ma === 0 ? 0.03 : 0) + (st[3] >= 66 ? 0.04 : 0), tag: null };     // 광장: 젊고 말솜씨 좋은 사람이 사람을 모은다
    var sa = AGE_N[P.sponsorAge(sp)], fem = G.Sponsor.female(sp), mfem = md.g === 'f', tp = G.Sponsor.temper(sp), k = 0, tag = null;
    if (ma === 0 && sa === 2) { k += 0.08; tag = 'youngToOld'; }
    else if (ma === 2 && sa === 0) {
      if (c.angle === 'scholar' || c.angle === 'faith') { k += 0.06; tag = 'oldToYoung'; } else { k -= 0.06; tag = 'oldBore'; }
    } else if (ma === 0 && sa === 0 && c.angle === 'legend') { k -= 0.04; tag = 'youngBrash'; }
    else if (ma === sa) { k += 0.03; tag = 'peer'; }
    // 남녀가 다를 때 예를 갖춘 말솜씨(매력)는 듣기 좋다 — 신중한 사람은 말솜씨에 넘어가지 않는다
    if (fem !== mfem && st[3] >= 64) { var g = tp === 'careful' ? 0.01 : 0.06; k += g; if (!tag || tag === 'peer') tag = 'gallant'; }
    return { k: k, tag: tag };
  };
  /** 넘어갈 확률 */
  P.chance = function (c, sp, d, liked) {
    var T = B(), md = G.MATE[c.id] || {}, st = md.st || [50, 50, 50, 50];
    var p = (T.base != null ? T.base : 0.3) + c.lv * (T.perLv != null ? T.perLv : 0.12) + P.aff(c.angle, sp, d) * 0.6 + (P.fit(c.angle, d) - 0.5) * 0.2;
    p += (st[3] - 50) / 300;                                       // 부하의 매력
    p += (R.skill('speech') || 0) * 0.04 + (R.stat('cha') - 50) / 400;   // 제독이 곁에서 거든다
    p += P.demo(c, sp).k;
    if (sp) {
      var tp = G.Sponsor.temper(sp), rel = G.Sponsor.rel(sp.id);
      p += (rel.trust || 0) / 500 + (tp === 'careful' ? -0.08 : tp === 'generous' ? 0.06 : 0);
      if (!liked) p += 0.04;                                       // 관심 밖이면 부하가 더 애를 쓴다 (그래야 마음이 움직인다)
      // 제독과 후원자: 나이가 같은 또래면 조금, 성별이 다르고 매력이 높으면 조금
      var pa = P.playerAge(), sa = P.sponsorAge(sp);
      if (pa === sa) p += 0.02;
      if ((S().player.g === 'f') !== G.Sponsor.female(sp) && R.stat('cha') >= 70) p += 0.03;
    }
    if (c.angle === 'legend') p -= 0.1;
    return U.clamp(p, 0.08, 0.92);
  };
  /** 넘어가면 얼마나 오르는가 (사례·명성 비율에 더한다) */
  P.bonus = function (c, sp, d) {
    var T = B();
    var b = (T.okBase != null ? T.okBase : 0.04) + c.lv * (T.okPerLv != null ? T.okPerLv : 0.03) + Math.max(0, P.aff(c.angle, sp, d)) * 0.12;
    if (c.angle === 'legend') b = 0.06 + Math.max(0, P.aff('legend', sp, d)) * 0.1;
    return Math.round(b * 1000) / 1000;
  };
  /** 시큰둥했을 때 부풀린 말이 들킬 확률 */
  P.caughtP = function (c, sp) {
    if (!sp) return c.angle === 'legend' ? 0.35 : 0;
    var tp = G.Sponsor.temper(sp), kd = P.kind(sp);
    if (c.angle === 'legend') return U.clamp(0.45 + (tp === 'careful' ? 0.3 : 0) + (kd === 'scholar' ? 0.2 : 0) - (tp === 'generous' ? 0.2 : 0), 0.1, 0.95);
    if (c.lv <= 1) return U.clamp(0.15 + (tp === 'careful' ? 0.25 : 0) + (kd === 'scholar' && c.angle === 'scholar' ? 0.2 : 0), 0, 0.8);
    return 0;
  };

  // ------------------------------------------------------------------ 말하는 사람
  function mateSpk(c, sp) {
    var SC = G.Scenes, o = { name: c.name, portrait: SC.mateSpec ? SC.mateSpec(c.id) : null, half: G.Img.chain.mateHalf ? G.Img.chain.mateHalf(c.id) : null, lang: 3 };
    if (sp && G.Sponsor) { o.layout = 'duo'; o.side = 'left'; o.partner = G.Sponsor.face(sp); o.emotion = 'happy'; }
    return o;
  }
  function crowdSpk() { return { name: L().crowdName, noStand: true }; }

  /** 설정에서 끄지 않았는가 (s.settings.pitch === false 면 예전처럼 그림·부하의 말 없이) */
  P.on = function () { var s = S(); return !!G.PITCH && !(s && s.settings && s.settings.pitch === false); };
  // ------------------------------------------------------------------ 자리 전체
  P.run = async function (o) {
    var d = o.d, sp = o.sp || null, s = S(), out = { k: 1, fk: 1, trust: 0, speakers: [], results: [], close: async function () {} };
    if (!d || !G.PITCH) return out;
    if (!P.on()) return out;
    // ① 발견물 그림을 먼저 혼자 다시 돌린다 — 그림이 걷힌 뒤에 사람들이 나와 이야기한다 (QA 2026-10-16)
    var SC = G.Scenes, ttl = o.mode === 'announce' ? '발표' : '보고';
    if (SC.discoveryReplay) { try { out.shown = await SC.discoveryReplay(d, { title: ttl }); } catch (e) { console.error(e); } }
    else { var show = SC.discoveryShow ? SC.discoveryShow(d, { title: ttl }) : null; if (show) { out.close = show.close; out.shown = true; } }
    var SP = G.Sponsor, kd = P.kind(sp), liked = sp ? G.tasteHit(sp.taste, d) : d.pw >= 3;
    var ctx = { d: d.name, h: sp ? SP.honor(sp) : '여러분', who: sp ? SP.holderName(sp) : '', me: s.player.name, reg: G.Disc.regName ? G.Disc.regName(d) : '', cat: (G.DISC_CATS || {})[d.cat] || '' };
    var me = sp ? SP.me(sp) : { name: s.player.name, portrait: s.player.portrait };
    var who = sp ? SP.speaker(sp) : crowdSpk();
    try {
      // ② 제독이 내놓는다
      var bold = (R.skill('speech') || 0) >= 2 || R.stat('cha') >= 68, shy = !bold && R.stat('cha') < 48;
      var opener = o.mode === 'announce' ? '여러분, 보십시오! 이것이 제가 바다 건너에서 본 {d}입니다.' : pick('open', L().open[bold ? 'bold' : shy ? 'shy' : 'plain']);
      await UI.say(P.fmt(opener, ctx), me);
      // ③ 첫 반응
      if (sp) {
        var pool = L().react[liked ? 'liked' : 'cool'], line = pick('react', pool[kd] || pool._);
        var w2 = Object.assign({}, who, { emotion: liked ? 'happy' : 'neutral' });
        await UI.say(P.fmt(line, ctx), w2);
      } else await UI.say(pick('crowd', L().crowd[d.pw >= 3 ? 'big' : 'small']), crowdSpk());
      // ④ 부하가 띄운다
      var cands = P.candidates(d, sp), k = 1, trust = 0;
      for (var i = 0; i < cands.length; i++) {
        var c = cands[i], A = L().angle[c.angle];
        var said = c.angle === 'legend' ? pick('legend', A.any) : pick(c.angle + c.lv, A[Math.min(3, c.lv)] || A[1]);
        await UI.say(P.fmt(said, Object.assign({ mate: c.name }, ctx)), mateSpk(c, sp));
        var p = P.chance(c, sp, d, liked), win = U.chance(p), dm = P.demo(c, sp), r = { id: c.id, angle: c.angle, lv: c.lv, p: p, win: win };
        if (G.Growth) G.Growth.gain('persuade', win ? 8 : 3, win ? '설득 경험 — 곁에서 거들었다' : null);   // 부하의 말을 제독이 곁에서 거든다
        if (win) {
          var b = P.bonus(c, sp, d); r.bonus = b; k += b; trust += 1;
          var okLine = pick('ok' + c.angle, L().ok[c.angle]);
          if (sp && dm.tag && L().demo[dm.tag] && (dm.k > 0) && U.chance(0.6)) okLine = pick('demo' + dm.tag, L().demo[dm.tag]) + ' ' + okLine;
          if (sp) await UI.say(P.fmt(okLine, ctx), Object.assign({}, who, { emotion: 'happy' }));
          else await UI.say(pick('crowdOk', L().crowdOk), crowdSpk());
        } else if (U.chance(P.caughtP(c, sp))) {
          r.caught = true; k -= (B().caughtCut != null ? B().caughtCut : 0.08); trust -= 3;
          if (sp) { var tp = SP.temper(sp), cl = L().caught[tp] || L().caught._; await UI.say(P.fmt(pick('caught', cl), ctx), Object.assign({}, who, { emotion: 'neutral' })); }
          else await UI.say(pick('crowdCaught', L().crowdCaught), crowdSpk());
          out.results.push(r); out.speakers.push(c.id);
          break;                                  // 한 번 들키면 다음 사람은 입을 다문다
        } else {
          var mehLine = pick('meh', L().meh);
          if (sp && dm.tag && dm.k < 0 && L().demo[dm.tag]) mehLine = pick('demo' + dm.tag, L().demo[dm.tag]) + ' ' + mehLine;
          if (sp) await UI.say(P.fmt(mehLine, ctx), who);
          else await UI.say(pick('crowdMeh', L().crowdMeh), crowdSpk());
        }
        out.results.push(r); out.speakers.push(c.id);
      }
      var T = B();
      k = U.clamp(k, T.min != null ? T.min : 0.85, T.max != null ? T.max : 1.35);
      out.k = Math.round(k * 1000) / 1000;
      out.fk = Math.round((1 + (k - 1) * (o.mode === 'announce' ? 0.9 : 0.7)) * 1000) / 1000;
      out.trust = trust;
      if (Math.abs(out.k - 1) > 0.001) UI.toast((out.k > 1 ? '부하들이 값어치를 띄웠다' : '부풀린 말이 들통났다') + ' — ' + (o.mode === 'announce' ? '명성' : '사례·명성') + ' ' + (out.k > 1 ? '+' : '') + Math.round((o.mode === 'announce' ? out.fk - 1 : out.k - 1) * 100) + '%', out.k > 1 ? 'star' : 'scroll', 4200);
    } catch (e) { console.error(e); }
    return out;
  };
})(window.G = window.G || {});
