/* 말투 (G.Voice) — 부하·아내·아이가 저마다 다르게 말한다 (2026-10-24 사용자 요청 「남녀노소 별로 다양하게, 이벤트 부하는 유니크하게」)
   · 부하: 이벤트로 얻는 부하는 고유 말투와 옛이야기(G.VOICES[id] — js/data/voices_a·b·c.js),
     보통 부하는 말투 갈래(G.VOICE_TYPES — js/data/voices.js): 12가지 성격(banter.js toneOf) · 나이 든 남녀 · 아이 · 마녀
   · 요령 한마디는 그 사람의 말씨(reg: 하오·하게·해요·하십시오·반말)로 (G.VOICE_TIPS)
   · 아내: 여급의 성품(like 8가지)·마녀, 또는 이벤트 부하였던 아내는 그 사람의 고유 아내 말 (G.WIFE_VOICES, G.VOICES[id].wife)
   · 아이: 나이(3~5 · 6~11 · 12~15 · 16~) × 아들딸 × 성격(kidvoyage.js temper) × 아버지와의 사이 (G.KID_VOICES)
   · 쓰는 곳: js/city/matetalk.js(부하와 이야기) · js/systems/family.js(자택 가족) · js/systems/wives.js(둘째 부인의 집)
   · 저장: 부하 줄 m.vtale = 다음에 들려줄 옛이야기 차례 */
(function (G) {
  'use strict';
  var U = G.U, V = {};
  G.Voice = V;
  function S() { return G.Game && G.Game.state; }
  function types() { return G.VOICE_TYPES || {}; }
  function own(id) { return (G.VOICES || {})[id] || null; }
  function fill(t) { var s = S(), p = s && s.player; return String(t).replace(/\{p\}/g, p && p.name ? p.name : '제독'); }
  function pick(key, list) { if (!list || !list.length) return null; return fill(U.pickFresh ? U.pickFresh(key, list) : U.pick(list)); }
  V.fill = fill;

  // ---------------------------------------------------------------- 부하
  var TONE_WIFE = { charm: 'bold', cute: 'kind', tsun: 'willful', grumpy: 'strong', plain: 'steady', polite: 'delicate', witch: 'witch', old_f: 'generous' };
  /** 말투 갈래 키 */
  V.typeOf = function (d) {
    if (!d) return 'plain';
    var f = d.g === 'f', T = types();
    if (d.minor) return f ? 'child_f' : 'child_m';
    if (d.witch) return 'witch';
    var sp = {}; try { sp = (G.Art && G.Art.mateSpec && G.Art.mateSpec(d.id)) || {}; } catch (e) { sp = {}; }
    var t = G.Banter && G.Banter.toneOf ? G.Banter.toneOf(d.id) : null;
    // 나이 든 사람: 학자(천재형)·장사꾼처럼 성격이 뚜렷하면 그대로, 조용한 사람의 절반과 투덜이·평범한 할머니는 노인 말투로
    if (d.old || sp.age === 'old') {
      if (f && (!t || t === 'grumpy' || t === 'plain' || t === 'cute')) return 'old_f';
      if (!f && (!t || (t === 'hidden' && U.strHash(d.id) % 2 === 0))) return 'old_m';
    }
    if (t && T[t]) return t;
    return f ? 'plain' : 'hidden';
  };
  /** 그 부하의 말투 (고유 말투가 있으면 그것을 먼저, 빈 칸은 갈래 말투로) */
  V.of = function (d) {
    var base = types()[V.typeOf(d)] || {}, o = own(d && d.id), out = {}, k;
    for (k in base) out[k] = base[k];
    if (o) for (k in o) out[k] = o[k];
    return out;
  };
  V.unique = function (d) { return !!(d && own(d.id)); };
  function band(m, hi, lo) { var l = m && m.loyal != null ? m.loyal : 70; return l >= hi ? 'hi' : l < lo ? 'low' : 'mid'; }
  function noLove(d) { return !d || d.g !== 'f' || d.minor || d.sib; }
  /** 마주 앉았을 때 첫마디 (충성 85↑ / 45↓) */
  V.greet = function (d, m) {
    var v = V.of(d), g = v.greet; if (!g) return null;
    var b = band(m, 85, 45), aff = (m && m.aff) || 0;
    if (!noLove(d) && aff >= 70 && v.love && v.love.a50 && U.chance(0.5)) return pick('vo:lg:' + d.id, v.love.a50);
    return pick('vo:g:' + d.id + b, g[b] || g.mid);
  };
  /** 「요즘 어떤가」 대답 — 마음이 기운 여자 부하는 love */
  V.chat = function (d, m) {
    var v = V.of(d), aff = (m && m.aff) || 0;
    if (!noLove(d) && v.love) {
      if (aff >= 80 && v.love.a80) return pick('vo:l8:' + d.id, v.love.a80);
      if (aff >= 50 && v.love.a50) return pick('vo:l5:' + d.id, v.love.a50);
    }
    var c = v.chat; if (!c) return null;
    var b = band(m, 80, 50);
    return pick('vo:c:' + d.id + b, c[b] || c.mid);
  };
  V.again = function (d) { var v = V.of(d); return pick('vo:a:' + d.id, v.again); };
  V.drink = function (d) { var v = V.of(d); return pick('vo:d:' + d.id, v.drink); };
  V.drinkDone = function (d) { var v = V.of(d); return v.drinkDone ? fill(v.drinkDone) : null; };
  V.lifeIntro = function (d) { var v = V.of(d); return pick('vo:li:' + d.id, v.lifeIntro); };
  V.reg = function (d) { var v = V.of(d); return v.reg || (d && d.g === 'f' ? 'yo' : 'hao'); };
  /** 요령 한마디: 가장 잘하는 특기의 요령을 그 사람 말씨로 */
  V.tipKey = function (d) {
    var sk = (d && d.sk) || {}, order = ['nav', 'med', 'acct', 'sword', 'gun', 'theo', 'survey', 'ship', 'speech'];
    for (var i = 0; i < order.length; i++) if ((sk[order[i]] || 0) >= 2) return order[i];
    return 'def';
  };
  V.tip = function (d) {
    var T = G.VOICE_TIPS && G.VOICE_TIPS[V.tipKey(d)]; if (!T) return null;
    var r = V.reg(d); return T[r] || T[d && d.g === 'f' ? 'yo' : 'hao'] || null;
  };

  // ---------------------------------------------------------------- 옛이야기 (고유 말투가 있는 부하만)
  var END = { hao: '내 이야기는 여기까지요. 다음엔 처음부터 다시 들려주겠소.', hage: '내 이야기는 이걸로 다 했네. 듣고 싶으면 처음부터 또 해 주지.',
    yo: '제 이야기는 이걸로 다예요. 다음엔 처음부터 다시 들려드릴게요.', sp: '드릴 이야기는 여기까지입니다. 원하시면 처음부터 다시 말씀드리겠습니다.', ban: '내 이야기는 이게 다야. 또 듣고 싶으면 처음부터 해 줄게.' };
  V.hasStories = function (d) { var o = own(d && d.id); return !!(o && o.stories && o.stories.length); };
  /** 다음 이야기 하나: { t, l: [...], n: 몇째, of: 모두, last } — 다 들었으면 처음으로 */
  V.nextStory = function (d, m) {
    var o = own(d.id); if (!o || !o.stories || !o.stories.length) return null;
    var n = (m.vtale || 0) % o.stories.length, st = o.stories[n];
    m.vtale = n + 1;
    return { t: st.t, l: (st.l || []).map(fill), n: n + 1, of: o.stories.length, last: n + 1 >= o.stories.length, end: END[o.reg] || END.yo };
  };

  // ---------------------------------------------------------------- 아내
  /** 아내의 말투 키: 여급은 성품(like), 부하였던 아내는 말투 갈래로 */
  V.wifeKey = function (wid) {
    if (G.MAID && G.MAID[wid]) return G.MAID[wid].like || 'kind';
    var d = G.MATE && G.MATE[wid]; if (!d) return 'kind';
    return TONE_WIFE[V.typeOf(d)] || 'steady';
  };
  /** 아내의 말 묶음 (고유 아내 말이 있으면 그것을 먼저) */
  V.wife = function (wid) {
    var base = (G.WIFE_VOICES || {})[V.wifeKey(wid)] || {}, o = own(wid), w = o && o.wife, out = {}, k;
    for (k in base) out[k] = base[k];
    if (w) for (k in w) out[k] = w[k];
    return out;
  };
  /** 아내의 한마디: kind = greet·away·nokids·pregHint·preg·lowKid·baby·home2·kids2, sub = 글자리 {n} {kid} {kids} */
  V.wifeLine = function (wid, kind, sub) {
    var l = V.wife(wid)[kind]; if (!l || !l.length) return null;
    var t = pick('vo:w:' + wid + ':' + kind, l);
    if (sub) for (var k in sub) t = t.split('{' + k + '}').join(sub[k]);
    return t;
  };

  // ---------------------------------------------------------------- 아이
  V.kidBand = function (age) { return age < 6 ? 'tod' : age < 12 ? 'kid' : age < 16 ? 'teen' : 'adult'; };
  function temper(k) { return G.KidVoy && G.KidVoy.temper ? G.KidVoy.temper(k) : (k.temper || 'warm'); }
  V.kidTemper = temper;
  /** 아이가 아버지에게 하는 말 — 나이·아들딸·성격·사이(65↑ hi · 30↓ lo) */
  V.kid = function (k, age, bond) {
    var K = G.KID_VOICES, bd = V.kidBand(age); if (!K || !K[bd]) return null;
    var sx = K[bd][k.sex === 'f' ? 'f' : 'm'], t = sx && (sx[temper(k)] || sx.warm); if (!t) return null;
    var b = bond >= 65 ? 'hi' : bond < 30 ? 'lo' : 'mid';
    return pick('vo:k:' + (k.name || '') + bd + b, t[b] || t.mid);
  };
  V.kidAboard = function (k) {
    var A = G.KID_VOICES && G.KID_VOICES.aboard, sx = A && A[k.sex === 'f' ? 'f' : 'm'], l = sx && (sx[temper(k)] || sx.warm);
    return pick('vo:ka:' + (k.name || ''), l);
  };
  /** 놀아 준 뒤·옛날이야기·항해 이야기를 들은 뒤 (kind = play·tale·story·storyCold) */
  V.kidReact = function (k, kind) {
    var R = G.KID_VOICES && G.KID_VOICES.react, t = R && (R[temper(k)] || R.warm);
    return pick('vo:kr:' + (k.name || '') + kind, t && t[kind]);
  };
})(window.G = window.G || {});
