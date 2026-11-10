/* 아이가 자라는 길 (G.KidGrow) — 교육의 밸런스와 운 · 어머니의 말과 솜씨 (2026-11-10 사용자 요청)
   「자식들이 교육을 통해 성장하는데 밸런스나 운빨 요소를 넣어줘. 너무 강한 2세가 쉽게 탄생한다.
     자식들은 어머니의 언어도 배울 수 있어. 어머니는 각 지역별 언어와 해당 지역에서 통용되는 언어를 배우고 있어.
     여급인 경우 웅변 요리 노래 회계 같은 특기를 랜덤하게 가지고 있어.」  조정값 G.BALANCE.kidEdu

   ■ 타고난 그릇(k.pot): 능력마다 처음 볼 때 「지금 + potLo~potHi」로 정한다 (타고난 재주 +gift, 처진 곳 −gift). 운이다.
     그릇 아래에서는 잘 자라고(남은 폭/room — 적어도 minP), 그릇에 닿으면 좀처럼 오르지 않는다(breakP — 가끔 뛰어넘는 아이도 있다).
     해마다 오르는 것·놀아 주기·가정교사·견습·집에서 함께 할 일·바다의 사건·백과사전… 아이 능력이 오르는 곳은 모두 KG.stat을 거친다.
   ■ 특기: 단계가 높을수록 배우기 어렵고(lvK), 지력이 높을수록 잘 배운다(intK). 어른(16세)이 되기 전에는 skillMax(2)까지 —
     3단계는 어른이 되어 배에서(선실 수련)·조합에서 익힌다. 가정교사도 해마다 반드시 붙지는 않는다 (tutorSkill).
   ■ 해마다의 운 (6~15세): goodYear 확률로 「좋은 해」(능력 하나가 그릇과 상관없이 +1), badYear 확률로 「힘든 해」(열병·방황 — 그해 저절로 자라는 몫이 없다).
   ■ 어머니: 아이와 함께 사는 어머니의 말과 특기를 해마다 조금씩 배운다 (momLang · momSkill — 어머니의 단계까지, 특기는 skillMax까지, 해마다 하나씩).
     · 어머니의 말: 부하였던 아내는 그 사람이 아는 말. 여급·아가씨는 제 고장 말(능숙)과 그 고장에서 통용되는 말(보통 — COMMON 표).
       무도회의 아가씨(lady)는 궁정 말로 로망스어를 한다.
     · 여급의 특기: 웅변·요리·음악(노래)·회계 가운데 한두 가지, 1~2단계 — 이름으로 정해져 늘 같다 (MAID_POOL).
   ■ 저장: k.pot = {str,int,mar,cha} · k.luckY = 마지막으로 운을 본 해 */
(function (G) {
  'use strict';
  var U = G.U, KG = G.KidGrow = {};
  function S() { return G.Game && G.Game.state; }
  function K() {
    var d = { potLo: 6, potHi: 26, giftPot: 6, room: 12, minP: 0.25, breakP: 0.05, statMax: 90, skillMax: 2, lvK: [1, 0.55, 0.3], intK: [0.7, 1.3],
      tutorSkill: 0.7, apprSkill: 0.1, goodYear: 0.12, badYear: 0.1, momLang: 0.35, momSkill: 0.15 };
    var c = (G.BALANCE && G.BALANCE.kidEdu) || {}; Object.keys(c).forEach(function (k) { d[k] = c[k]; });
    return d;
  }
  KG.K = K;
  var STK = ['str', 'int', 'mar', 'cha'], SN = { str: '체력', int: '지력', mar: '무력', cha: '매력' };
  function adultAge() { return ((G.BALANCE && G.BALANCE.family) || {}).adult || 16; }
  function age(k) { return G.Family ? G.Family.kidAge(k) : 0; }
  function skName(id) { return (G.SKILL_BY_ID && G.SKILL_BY_ID[id] || {}).name || id; }

  // ---------------------------------------------------------------- 타고난 그릇
  KG.pot = function (k, x) {
    var c = K(); k.pot = k.pot || {};
    if (k.pot[x] == null) {
      var v = (k.st && k.st[x]) || 50, g = k.gen || {};
      var p = v + U.ri(c.potLo, c.potHi) + (g.gift === x ? c.giftPot : 0) - (g.flaw === x ? c.giftPot : 0);
      k.pot[x] = U.clamp(Math.round(p), Math.min(v + 2, c.statMax), c.statMax);
    }
    return k.pot[x];
  };
  /** 능력 x를 n번 키워 본다 — 오른 만큼 돌려준다 */
  KG.stat = function (k, x, n) {
    var c = K(), got = 0; if (!k.st) k.st = { str: 50, int: 50, mar: 50, cha: 50 };
    for (var i = 0; i < (n || 1); i++) {
      var v = k.st[x] || 50, pot = KG.pot(k, x); if (v >= c.statMax) break;
      var p = v < pot ? U.clamp((pot - v) / c.room, c.minP, 1) : c.breakP;
      if (U.chance(p)) { k.st[x] = v + 1; got++; }
    }
    return got;
  };
  /** 깎을 때는 그대로 (바다의 사건 등) */
  KG.statAdd = function (k, x, n) { if (n > 0) return KG.stat(k, x, n); if (!k.st) return 0; var b = k.st[x] || 50; k.st[x] = Math.max(1, b + n); return k.st[x] - b; };
  /** 특기 id를 배워 본다 (base: 이 배움의 기본 확률 · cap: 이 배움이 올릴 수 있는 끝) — 늘었으면 true */
  KG.skill = function (k, id, base, cap) {
    var c = K(); k.sk = k.sk || {};
    var lv = k.sk[id] || 0, lim = Math.min(3, cap == null ? 3 : cap, age(k) < adultAge() ? c.skillMax : 3);
    if (lv >= lim) return false;
    var it = (k.st && k.st['int']) || 50, iF = U.clamp(c.intK[0] + (c.intK[1] - c.intK[0]) * (it - 30) / 60, c.intK[0], c.intK[1]);
    if (!U.chance(U.clamp((base == null ? 0.6 : base) * (c.lvK[lv] == null ? 0.2 : c.lvK[lv]) * iF, 0, 1))) return false;
    k.sk[id] = lv + 1;
    return true;
  };
  KG.skillCap = function (k) { return age(k) < adultAge() ? K().skillMax : 3; };

  // ---------------------------------------------------------------- 해마다의 운 (6~15세)
  var GOOD = ['{n}에게는 좋은 해였다 — 무엇이든 쑥쑥 배웠다.', '{n}{이/가} 좋은 스승을 만나 눈이 트였다.', '{n}{이/가} 무언가에 푹 빠져 한 해 만에 부쩍 자랐다.'];
  var BAD = ['{n}{이/가} 열병을 앓아 한 해를 쉬었다.', '{n}{이/가} 말썽꾼 친구들과 어울리느라 공부를 등졌다.', '{n}{이/가} 마음이 흔들려 무엇도 손에 잡히지 않는 해를 보냈다.'];
  function fillN(t, k) { var n = G.Family.given(k) || k.name; return t.replace('{n}', n).replace('{이/가}', U.jx(n, '이/가')); }
  /** 해마다 한 번: 'good' · 'bad' · null — out에 알림을 더한다 */
  KG.year = function (k, out) {
    var c = K(), s = S(), a = age(k);
    if (k.unnamed || k.lost || a < 6 || a >= adultAge() || k.luckY === s.date.y) return null;
    k.luckY = s.date.y;
    var r = U.rand();
    if (r < c.goodYear) {
      var x = U.pick(STK), b = (k.st && k.st[x]) || 50;
      if (b < c.statMax) k.st[x] = b + 1;
      if (out) out.push({ icon: 'star', text: fillN(U.pick(GOOD), k) + ' (' + SN[x] + ' +1)' });
      return 'good';
    }
    if (r < c.goodYear + c.badYear) { if (out) out.push({ icon: 'info', text: fillN(U.pick(BAD), k) + ' (올해는 저절로 자라지 않았다)' }); return 'bad'; }
    return null;
  };

  // ---------------------------------------------------------------- 어머니의 말과 솜씨
  /* 그 고장에서 통용되는 말 (도시의 말 → 두 번째 말). 아프리카·중남미는 경도로 나눈다 */
  var COMMON = { 0: 2, 1: 0, 2: 0, 3: 2, 4: 5, 5: 6, 6: 5, 7: 12, 8: 6, 9: 6, 12: 7, 13: 7, 14: 7, 15: 3 };
  KG.common = function (c) {
    if (!c) return null;
    if (c.lang === 10) return c.lon < 20 ? 1 : 5;       // 서아프리카 해안은 포르투갈어, 동아프리카·사헬은 아랍어
    if (c.lang === 11) return c.lon > -55 ? 1 : 0;      // 브라질은 포르투갈어, 나머지는 스페인어
    var v = COMMON[c.lang]; return v == null ? null : v;
  };
  /** 어머니의 말 {말 번호: 단계} */
  KG.momLangs = function (id) {
    var out = {}; if (!id) return out;
    var md = G.MATE && G.MATE[id];
    if (md) { Object.keys(md.lg || {}).forEach(function (i) { if (md.lg[i] > 0) out[i] = md.lg[i]; }); return out; }
    var m = G.MAID && G.MAID[id]; if (!m) return out;
    var c = G.CITY_DATA[m.city]; if (!c) return out;
    out[c.lang] = 3;
    var com = m.lady ? 2 : KG.common(c);                // 무도회의 아가씨는 궁정 말(로망스어)
    if (com != null && com !== c.lang) out[com] = 2;
    return out;
  };
  /* 여급의 특기: 웅변·요리·음악(노래)·회계 가운데 한두 가지 — 이름으로 정해 늘 같다 */
  var MAID_POOL = ['speech', 'cook', 'music', 'acct'];
  KG.momSkills = function (id) {
    if (!id) return {};
    var md = G.MATE && G.MATE[id];
    if (md) return md.sk || {};
    var m = G.MAID && G.MAID[id]; if (!m) return {};
    if (m.sk) return m.sk;
    var h = U.strHash(String(id)) >>> 0, n = 1 + (h % 2), pool = MAID_POOL.slice(), out = {};   // >>> 0: 음수 해시도 0 이상으로
    for (var i = 0; i < n && pool.length; i++) { var j = (h >>> (2 + i * 3)) % pool.length; out[pool.splice(j, 1)[0]] = 1 + ((h >>> (9 + i)) % 2); }
    m.sk = out;
    return out;
  };
  /** 「요리 2 · 음악 1」 */
  KG.skillText = function (sk) { return Object.keys(sk || {}).filter(function (id) { return sk[id] > 0; }).map(function (id) { return skName(id) + ' ' + sk[id]; }).join(' · '); };
  /** 아이와 함께 사는 어머니 (없으면 null) — 본가의 아이는 본처, 둘째 부인의 집 아이는 그 부인 */
  KG.momOf = function (k) {
    var p = S().player;
    if (k.aboard || k.away || k.married || k.lost) return null;
    if (k.house != null) return k.house === -1 ? null : k.mother || null;
    if (!p.wife) return null;
    return !k.mother || k.mother === p.wife ? p.wife : null;   // 본국에 데려온 둘째 부인의 아이는 어머니와 떨어져 산다
  };
  /** 해마다: 함께 사는 어머니에게서 말 하나·특기 하나를 배울 수 있다 */
  KG.fromMother = function (k, out) {
    var c = K(), a = age(k); if (k.unnamed || a < 3 || a >= adultAge()) return;
    var mom = KG.momOf(k); if (!mom) return;
    var mn = G.Wives && G.Wives.name ? G.Wives.name(mom) : '어머니', kn = G.Family.given(k) || k.name;
    k.lg = k.lg || {};
    var langs = KG.momLangs(mom), got = false;
    Object.keys(langs).forEach(function (li) {
      if (got) return;
      var cur = k.lg[li] || 0; if (cur >= Math.min(3, langs[li]) || !U.chance(c.momLang)) return;
      k.lg[li] = cur + 1; got = true;
      if (out) out.push({ icon: 'chat', text: kn + U.jx(kn, '이/가') + ' 어머니(' + mn + ')에게서 ' + G.LANGS[li] + U.jx(G.LANGS[li], '을/를') + ' 배웠다. (' + G.LANG_LV[k.lg[li]] + ')' });
    });
    var sks = KG.momSkills(mom), got2 = false;
    Object.keys(sks).forEach(function (id) {
      if (got2 || !G.SKILL_BY_ID[id]) return;
      var cur = (k.sk && k.sk[id]) || 0; if (cur >= Math.min(sks[id], c.skillMax) || !U.chance(c.momSkill)) return;
      k.sk = k.sk || {}; k.sk[id] = cur + 1; got2 = true;
      if (out) out.push({ icon: 'star', text: kn + U.jx(kn, '이/가') + ' 어머니(' + mn + ')의 솜씨를 보고 ' + skName(id) + U.jx(skName(id), '을/를') + ' 익혔다. (' + skName(id) + ' ' + k.sk[id] + ')' });
    });
  };
})(window.G = window.G || {});
