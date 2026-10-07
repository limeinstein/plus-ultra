/* 동물·식물 발견 때 부하들의 세 마디 (G.Banter) — 말은 js/data/banter.js (G.BANTER)
   - 부하마다 말투(12가지)는 생김새(옷차림·나이·장식: 초상 spec)와 능력치로 정한다: toneOf
   - compose(d): 누가 무슨 말을 할지 고른다(화면 없이) → play(d): 차례로 띄운다. 설정 「발견 때 부하들의 수다」를 끄면 건너뛴다.
   - 동료가 둘이 안 되면 갑판장·견습 선원이 빈자리를 채운다. */
(function (G) {
  'use strict';
  var BT = {}, U = G.U;
  G.Banter = BT;
  function S() { return G.Game.state; }
  function B() { return G.BANTER; }
  var JOSA = { '을': '을/를', '이': '이/가', '은': '은/는', '와': '과/와', '이라': '이라/라', '이구나': '이구나/구나', '아': '아/야', '으로': '으로/로' };

  // ------------------------------------------------------------------ 말투
  var toneCache = {}, norms = null;
  /** 말투마다의 점수(생김새·능력치) — 높을수록 그 말투답다 */
  function rawScores(id) {
    var d = G.MATE && G.MATE[id]; if (!d) return null;
    var sp = (G.Art && G.Art.mateSpec && G.Art.mateSpec(id)) || {}, st = d.st || [50, 50, 50, 50], sk = d.sk || {};
    var role = sp.role || '', age = sp.age || 'mid', f = d.g === 'f';
    var sc = f ? {
      charm: (st[3] >= 72 ? 3 : st[3] >= 64 ? 1.5 : 0) + (sp.gold ? 1 : 0) + (age === 'mid' ? 0.5 : 0),
      cute: (age === 'young' ? 2 : 0) + (st[3] >= 56 && st[3] < 72 ? 0.8 : 0) + (st[2] < 45 ? 0.8 : 0),
      tsun: (st[2] >= 60 ? 2.2 : st[2] >= 52 ? 1 : 0) + (sp.armor ? 2 : 0) + (sk.sword || 0) * 0.6,
      grumpy: (st[3] < 50 ? 2 : 0) + (age === 'old' ? 1.2 : 0) + 0.4,
      plain: 1.4,
      polite: (role === 'priest' || role === 'noble' || role === 'scholar' ? 2.5 : 0) + (st[1] >= 70 ? 1.5 : 0) + (sk.theo ? 1 : 0)
    } : {
      rush: (sp.armor ? 2.5 : 0) + (st[2] >= 66 ? 2 : st[2] >= 60 ? 1 : 0) + ((sk.sword || 0) + (sk.gun || 0)) * 0.5,
      noble: (sp.gold ? 2 : 0) + (st[3] >= 66 ? 2 : st[3] >= 60 ? 1 : 0) + (sp.ruff ? 1 : 0) - (age === 'old' ? 1 : 0),
      merch: (role === 'merchant' ? 3 : 0) + (sk.acct || 0) * 0.8,
      genius: (role === 'scholar' ? 2 : 0) + (st[1] >= 74 ? 2.5 : st[1] >= 68 ? 1.2 : 0) + ((sk.sci || 0) + (sk.survey || 0)) * 0.3,
      shonen: (age === 'young' ? 2.5 : 0) + (st[0] >= 60 ? 0.5 : 0) + (st[1] < 55 ? 0.8 : 0),
      hidden: (age === 'old' ? 1.5 : 0) + ((sp.beard || 0) >= 2 ? 0.8 : 0) + (role === 'priest' ? 2 : 0) + (st[3] < 50 ? 1 : 0) + 0.6
    };
    return { f: f, sc: sc };
  }
  /** 말투가 한쪽으로 쏠리지 않게, 이름난 부하(철새 제외) 전체에서 말투마다 점수의 평균·퍼짐을 재어 그만큼 맞춘다 */
  function getNorms() {
    if (norms) return norms;
    norms = { m: {}, f: {} };
    var acc = { m: {}, f: {} };
    (G.MATES || []).forEach(function (m) {
      if (m.wd || m.witch) return;
      var r = rawScores(m.id); if (!r) return;
      var g = r.f ? 'f' : 'm';
      Object.keys(r.sc).forEach(function (k) { (acc[g][k] = acc[g][k] || []).push(r.sc[k]); });
    });
    ['m', 'f'].forEach(function (g) {
      Object.keys(acc[g]).forEach(function (k) {
        var a = acc[g][k], mean = a.reduce(function (x, y) { return x + y; }, 0) / a.length;
        var sd = Math.sqrt(a.reduce(function (x, y) { return x + (y - mean) * (y - mean); }, 0) / a.length);
        norms[g][k] = { mean: mean, sd: Math.max(0.4, sd) };
      });
    });
    return norms;
  }
  // 학자·항해가가 많아 천재형이 몰리지 않게 살짝 덜어 낸다
  var BIAS = { genius: -0.45, merch: 0.2, noble: 0.2, shonen: 0.1, charm: 0.25, tsun: 0.15 };
  /** 부하의 말투 키 (rush·noble·merch·hidden·genius·shonen / charm·cute·tsun·grumpy·plain·polite) */
  BT.toneOf = function (id) {
    if (toneCache[id]) return toneCache[id];
    var d = G.MATE && G.MATE[id]; if (!d) return 'plain';
    if (d.tone && B().toneName[d.tone]) return (toneCache[id] = d.tone);
    var r = rawScores(id), N = getNorms()[r.f ? 'f' : 'm'], best = null, bv = -1e9;
    Object.keys(r.sc).forEach(function (k) {
      var n = N[k] || { mean: 0, sd: 1 }, v = (r.sc[k] - n.mean) / n.sd + (BIAS[k] || 0) + (U.strHash(id + ':' + k) % 1000) / 1000 * 0.9;
      if (v > bv) { bv = v; best = k; }
    });
    return (toneCache[id] = best);
  };
  BT.toneName = function (id) { return B().toneName[BT.toneOf(id)]; };

  // ------------------------------------------------------------------ 발견물 → 생각
  /** 갈래: 표에 없으면 이름으로 짐작 */
  BT.kindOf = function (d) {
    var k = B().kindOf[d.id]; if (k) return k;
    var n = d.name || '';
    if (/용|룡|드래곤|뱀|괴물|괴수|귀신|거인|요정|크라켄/.test(n)) return 'giant';
    if (/나무|꽃|풀|버섯|이끼/.test(n)) return 'flower';
    if (/새$|조$|수리|매$/.test(n)) return 'bird';
    if (/물고기|피쉬|어$|치$|고래|상어/.test(n)) return d.how === 'sea' ? 'sea' : 'fish';
    if (/개$|견$|테리어/.test(n)) return 'dog';
    if (/고양이/.test(n)) return 'cat';
    return d.how === 'sea' ? 'sea' : 'small';
  };
  BT.call = function (d) {
    var c = B().call[d.id]; if (c) return c;
    return String(d.name || '').replace(/\s*\(.*\)\s*$/, '').split(' — ')[0];
  };
  function pick(a, rng) { return a[Math.floor(rng() * a.length) % a.length]; }

  // ------------------------------------------------------------------ 누가 말하나
  function speakerOf(id) {
    var d = G.MATE[id];
    return { name: d.name, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3 };
  }
  function people() {
    var s = S(), out = [];
    (s.mates || []).forEach(function (m) {
      var d = G.MATE[m.id]; if (!d) return;
      out.push({ id: m.id, name: d.name, short: String(d.name).split(' ')[0], tone: BT.toneOf(m.id), sp: function () { return speakerOf(m.id); } });
    });
    B().fill.forEach(function (f) {
      if (out.length >= 2) return;
      out.push({ id: 'fill_' + f.npc, name: f.name, short: f.name, tone: f.tone, sp: function () {
        var A = G.Art; return { name: f.name, portrait: A.withImg(A.npcSpec('banter_' + f.npc, 'sailor', 'ib'), G.Img.chain.npc(f.npc)), lang: 3 };
      } });
    });
    return out;
  }
  var PREF = {
    danger: ['rush', 'shonen', 'tsun', 'charm', 'hidden'],
    silly: ['shonen', 'cute', 'genius', 'merch', 'charm'],
    ok: ['cute', 'charm', 'plain', 'merch', 'noble', 'polite'],
    myth: ['shonen', 'noble', 'merch', 'cute', 'genius', 'rush']
  };

  // 남의 생각에 맞장구치는 말투 (위험도별)
  var AGREE = { danger: ['rush', 'shonen'], silly: ['rush', 'shonen', 'cute', 'charm'] };
  function fmt(t, v) {
    return String(t).replace(/\{(obj|a)([가-힣]*)\}/g, function (all, who, j) {
      var w = v[who]; if (!j) return w;
      return w + U.jx(w, JOSA[j] || j);
    }).replace(/\{pre\}/g, v.pre).replace(/\{nation\}/g, v.nation);
  }

  /** 누가 무슨 말을 할지: [{p(사람), text}] (세 마디). rng 를 넘기면 그것으로 고른다(시험용) */
  BT.compose = function (d, rng) {
    rng = rng || Math.random;
    var Bd = B(); if (!Bd || !d) return [];
    var choices = Bd.ideaOf[d.id] || Bd.kinds[BT.kindOf(d)] || Bd.kinds.small;
    var ch = pick(choices, rng), idea = Bd.ideas[ch[0]], risk = ch[1];
    var ppl = people(); if (ppl.length < 2) return [];
    // 먼저 말할 사람: 생각에 어울리는 말투를 조금 더 자주
    var fit = ppl.filter(function (x) { return (PREF[risk] || []).indexOf(x.tone) >= 0; });
    var A = fit.length && rng() < 0.65 ? pick(fit, rng) : pick(ppl, rng);
    var rest = ppl.filter(function (x) { return x !== A; });
    var Bp = pick(rest, rng), rest2 = rest.filter(function (x) { return x !== Bp; }), C = rest2.length ? pick(rest2, rng) : null;
    var nat = (G.R && G.R.nationName) ? G.R.nationName(S().player.nation) : '고향';
    var v = { obj: BT.call(d), pre: idea.pre, nation: nat, a: A.short };
    var L = function (p, part, sub) { var T = Bd.lines[p.tone] || Bd.lines.plain, arr = sub ? T[part][sub] : T[part]; return { p: p, text: fmt(pick(arr, rng), v) }; };
    var out = [L(A, 'prop')];
    var r = rng();
    if (idea.act === 'talk' && r < 0.7) { out.push(L(A, 'talk')); out.push(L(Bp, 'stop')); }
    else if (idea.act === 'go' && (risk === 'danger' || risk === 'silly') && r < 0.35) { out.push(L(A, 'go')); out.push(L(Bp, 'stop')); }
    else if (C && r > 0.72) { out.push(L(Bp, 're', risk)); out.push(L(C, 're', risk)); }
    else {
      out.push(L(Bp, 're', risk));
      // 받은 사람이 맞장구쳤으면(돌진형·소년 만화형은 위험해도 같이 가자고 한다) 신이 나고, 말렸으면 물러서거나 우긴다
      var agreed = risk === 'ok' || (AGREE[risk] || []).indexOf(Bp.tone) >= 0;
      out.push(risk === 'myth' && idea.act === 'talk' ? L(A, 'talk') : agreed ? L(A, 'cheer') : L(A, 'back'));
    }
    out.idea = ch[0]; out.risk = risk;
    return out;
  };

  /** 발견 카드 뒤에 띄운다 (생물 발견물만) */
  BT.play = async function (d) {
    var s = S();
    if (!d || d.cat !== 'creature' || !s || (s.settings && s.settings.banter === false)) return [];
    var lines = BT.compose(d);
    for (var i = 0; i < lines.length; i++) await G.UI.say(lines[i].text, lines[i].p.sp());
    return lines;
  };
})(window.G = window.G || {});
