/* 민족 발견물에서 나서는 동료 (G.FolkJoin) — 2026-11-05 사용자 요청
   · 민족(cat 'people') 발견물을 직접 찾으면(js/systems/discovery.js D.find 끝) chance(3%)로 그 민족의 젊은 남자나 여자(반반)가
     뒤따라와 배에 태워 달라고 한다. 받아들이면 동료가 된다(G.Legend.join — 빈 역할이나 다른 배 선장 자리) · 거절하면 마을로 돌아간다.
   · 사람은 그 민족 자료(js/data/folkjoin.js G.FOLK_JOIN)로 짓는다: 이름 · 얼굴(그 고장 양식의 완성 초상 한 쌍) · 모국 말 능숙(+장사 말) ·
     갈래(측량·항해·통역·검객…)에 맞는 능력과 특기. 명성 0 · 품삯은 철새보다 싸다(payK).
   · 한 민족에 한 번만 굴린다 (거절해도 다시 오지 않는다). 남극인처럼 자료가 없는 민족은 나서지 않는다.
   · 저장: 정의는 철새 명부(s.wander.defs — d.wd·d.folk)에 올려 불러오기에도 그대로 · 굴린 기록 s.folkJoin = {rolled: {발견물 ID: 1}, joined: [ID…]}
   조정값: G.BALANCE.folkJoin = { chance, payK } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var FJ = G.FolkJoin = {};
  function S() { return G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.folkJoin) || { chance: 0.03, payK: 0.8 }; }
  function st() { var s = S(); return s.folkJoin || (s.folkJoin = { rolled: {}, joined: [] }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var WHO = { vampire: '트란실바니아 사람', punt: '푼트 사람', orangutan: '긴집 사람', cannibal: '바탁 사람', blemmyes: '와라오 사람',
    skraeling: '베오투크 사람', nestorian: '경교 신자', padaung: '카얀 사람', aborigine: '아넘랜드 사람' };
  /** 그 민족을 부르는 말 (「코이코이 사람」) */
  FJ.who = function (d) {
    if (WHO[d.id]) return WHO[d.id];
    // 아직 못 찾은 것은 단서 이름이 붙어 있다 — 본디 이름으로 (js/data/cluenames.js)
    return String(d.realName || d.name).split(' — ')[0].replace(/\s*\(.*\)\s*/, ' ').replace(/사람들$/, '사람').replace(/\s+/g, ' ').trim();
  };
  FJ.can = function (d) { return !!(d && d.cat === 'people' && G.FOLK_JOIN && G.FOLK_JOIN[d.id]); };

  // ---------------------------------------------------------------- 얼굴: 그 고장 양식의 완성 초상 (부족 사람 그림 → 같은 성별의 역할 그림)
  function pairOk(k) { return !G.Img || !G.Img.has || (G.Img.has(k) && G.Img.has(k + '_half')); }
  FJ.faces = function (style, g, folk) {
    var P = G.FOLK_JOIN && G.FOLK_JOIN[folk], own = P && P.portraits && P.portraits[g];
    var ready = own && own.filter(pairOk);
    if (ready && ready.length) return ready;
    var A = G.Art, roles = g === 'f' ? ['native', 'maid', 'keeper', 'merchant'] : ['native', 'sailor', 'soldier', 'captain'];
    return roles.map(function (r) { return 'portraits/npc-roles/' + style + '/' + r; })
      .filter(function (k) { var r = k.split('/').pop(); return pairOk(k) && (!A || !A.rolePortraitGender || A.rolePortraitGender(r, style) === g); });
  };

  // ---------------------------------------------------------------- 한 사람 짓기
  function taken() { var t = {}; G.MATES.forEach(function (m) { t[m.name] = 1; }); return t; }
  FJ.make = function (d, g) {
    var s = S(), P = G.FOLK_JOIN[d.id]; if (!P) return null;
    g = g || (U.chance(0.5) ? 'f' : 'm');
    var who = FJ.who(d), used = taken();
    var names = (g === 'f' ? P.f : P.m).filter(function (n) { return !used[n]; });
    var name = names.length ? U.pick(names) : U.pick(g === 'f' ? P.f : P.m) + ' ' + U.ri(2, 9);
    var tk = U.pick(P.types), T = G.WANDER_TYPES[tk] || G.WANDER_TYPES.survey;
    var stv = T.st.map(function (v) { return clamp(v + U.ri(-6, 12), 30, 90); });
    var sk = {}, skSum = 0;
    T.sk.forEach(function (x) { var lv = U.ri(Math.max(1, x[1]), x[2]); if (lv > 0) { sk[x[0]] = lv; skSum += lv; } });
    var lg = {}; lg[P.lang[0]] = 3; if (P.lang[1] != null) lg[P.lang[1]] = tk === 'tongue' ? 2 : 1;
    var faces = FJ.faces(P.style, g, d.id), face = faces.length ? faces[Math.abs(U.strHash(d.id + ':' + g + ':' + s.day)) % faces.length] : null;
    var stSum = stv[0] + stv[1] + stv[2] + stv[3];
    var wage = Math.max(20, Math.round((28 + skSum * 12 + (stSum - 200) / 3) * (K().payK || 0.8) / 5) * 5);
    s.wander = s.wander || { seq: 0, gen: G.Wander && G.Wander.genOf ? G.Wander.genOf(s.date.y) : 0, defs: {} };
    s.wander.seq = (s.wander.seq || 0) + 1;
    var id = 'fj_' + d.id + '_' + s.date.y + '_' + s.wander.seq;
    var def = {
      id: id, name: name, g: g, wd: true, folk: d.id, nat: 'folk', natName: who, type: tk, typeName: T.nm, st: stv, sk: sk, lg: lg, fame: 0, wage: wage,
      y: [s.date.y, 9999], reg: [d.reg], style: P.style, role: g === 'f' ? 'maid' : (T.role[0] || 'sailor'),
      desc: who + ' ' + (g === 'f' ? '여자' : '남자') + '. ' + d.name + U.j(d.name, '을/를').slice(d.name.length) + ' 찾았을 때 배에 태워 달라며 따라나섰다. 솜씨는 ' + T.nm + '.',
      story: who + '의 마을에서 나고 자랐다. 바다 건너에서 온 배를 처음 보고, 수평선 너머를 보고 싶어 제독을 따라나섰다.',
      face: face, halfKey: face ? face + '_half' : null, zones: [], home: null, gen: G.Wander && G.Wander.genOf ? G.Wander.genOf(s.date.y) : 0, born: s.date.y, line: id
    };
    return G.MateSkills && G.MateSkills.wander ? G.MateSkills.wander(def) : def;
  };
  // 옛 저장에서 이미 합류한 대상도 같은 민족의 새 얼굴·무릎상으로 함께 바꾼다.
  // 전용 초상 설정이 없거나 원화 한 쪽이 없는 경우에는 저장된 얼굴을 유지한다.
  FJ.fixPortrait = function (def) {
    var P = def && G.FOLK_JOIN[def.folk], own = P && P.portraits && P.portraits[def.g];
    var ready = own && own.filter(pairOk);
    if (!ready || !ready.length) return def;
    var face = ready.indexOf(def.face) >= 0 ? def.face : ready[Math.abs(U.strHash(def.id)) % ready.length];
    def.face = face; def.halfKey = face + '_half';
    return def;
  };
  function register(def) {
    var s = S();
    s.wander.defs[def.id] = def;
    if (!G.MATE[def.id]) { G.MATES.push(def); G.MATE[def.id] = def; }
    G.MATE_RANGE[def.id] = { zones: def.zones, home: def.home };
  }
  function unregister(id) {
    var s = S();
    for (var i = G.MATES.length - 1; i >= 0; i--) if (G.MATES[i].id === id) G.MATES.splice(i, 1);
    delete G.MATE[id]; delete G.MATE_RANGE[id];
    if (s && s.wander) delete s.wander.defs[id];
  }

  // ---------------------------------------------------------------- 발견 뒤 (D.find 끝)
  FJ.afterFind = async function (d) {
    if (!FJ.can(d)) return false;
    var s = S(), T = st();
    if (T.rolled[d.id]) return false;
    T.rolled[d.id] = U.dateNum(s.date);
    if (!U.chance(K().chance == null ? 0.03 : K().chance)) return false;
    return FJ.offer(d);
  };
  /** 그 민족의 한 사람이 나선다 — 받아들이면 동료가 된다 (시험·사건에서 바로 부를 수도 있다) */
  FJ.offer = async function (d, g) {
    var s = S(), def = FJ.make(d, g); if (!def) return false;
    register(def);   // 말하는 동안 얼굴을 보이려고 먼저 올린다 (거절하면 내린다)
    var who = FJ.who(d), sp = { name: def.name, portrait: G.Scenes.mateSpec(def.id), half: G.Img.chain.mateHalf(def.id), lang: 3 };
    var line = (G.FOLK_JOIN_LINES[def.type] || G.FOLK_JOIN_LINES.survey).replace('{who}는', who + U.jx(who, '은/는')).replace(/\{who\}/g, who);
    var me = { name: R.fullName ? R.fullName() : s.player.name, portrait: s.player.portrait, lang: 3 };
    await UI.say(d.name + U.j(d.name, '을/를').slice(d.name.length) + ' 뒤로하고 돌아서는데, ' + who + ' ' + (def.g === 'f' ? '젊은 여자' : '젊은 남자') + ' 하나가 숨을 몰아쉬며 뒤따라온다.', {});
    await UI.say('나는 ' + def.name + U.jx(def.name, '이라고/라고') + ' 해요. 당신들의 커다란 배를 보았어요. 저 배를 타고 바다 끝까지 가 보고 싶어요.\f' + line, sp);
    var v = await UI.ask(def.name + '(' + who + ' · ' + def.typeName + ')' + U.jx(def.name, '을/를') + ' 동료로 맞을까? (월급 금화 ' + U.num(def.wage) + '닢)', [
      { label: '함께 가자 — 동료로 맞는다', value: 1, icon: 'people' },
      { label: '고향에 남으라고 달랜다', value: 0, icon: 'home' }
    ], me);
    if (v !== 1) {
      await UI.say(U.pick(['…그래요. 그래도 언젠가 당신들 배가 다시 오면, 그때는 꼭 데려가 줘요.', '알겠어요. 바다 건너 이야기를 마을 사람들에게 들려줄게요.']), sp);
      unregister(def.id);
      G.State.log(who + ' ' + def.name + U.jx(def.name, '이/가') + ' 배에 태워 달라고 했지만, 고향에 남으라고 달랬다.');
      return false;
    }
    var nm = G.Legend && G.Legend.join ? G.Legend.join(def.id, null) : null;
    if (!nm) { s.mates.push({ id: def.id, role: 'none', joined: U.dateNum(s.date), loyal: 80 }); G.State.log(def.name + U.jx(def.name, '이/가') + ' 동료가 되었다.'); }
    st().joined.push(def.id);
    await UI.say(U.pick(['고마워요! 바다가 어떤 얼굴을 하고 있는지, 이제 내 눈으로 보겠어요.', '약속할게요. 당신들이 길을 잃지 않게, 내가 아는 것을 다 쓰겠어요.']), sp);
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
})(window.G = window.G || {});
