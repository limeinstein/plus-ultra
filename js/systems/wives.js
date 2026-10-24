/* 둘째 부인부터 (G.Wives) — 첩, 고장의 집, 그 집의 아이, 함께 항해, 본국에서 숨기
   · 첫째 부인(본처)은 고향 자택 (family.js). 본처가 있는데 또 청혼하면 둘째 부인이 된다.
   · 여급: 그 여급이 일하던 도시에 새 집이 생기고 거기서 산다.
   · 부하(여성 항해사·철새·마녀): 처음 만난(고용한) 고장으로 데려다주면 그곳에 집이 생긴다. 또는 부하로 남아 함께 항해한다.
     집에 사는 부하 출신 부인은 그 집에서 다시 배에 태울 수 있다.
   · 함께 항해하는 둘째 부인은 본국(제독 나라의 항구)에 들어서면 남의 눈을 피해 선실에 숨기도 한다 — 그 항구에 있는 동안 특기·말을 쓸 수 없다.
   · 배에 본처가 타고 있으면 둘째 부인은 배에 탈 수 없다 (본처를 태우면 배에 있던 둘째 부인은 제 집으로 간다).
   · 둘째 부인의 집에서도 아이가 생긴다. 아이는 부인 한 사람에게 5명까지 · 아들은 모든 부인을 합쳐 5명까지 · 딸은 부인마다 2명까지
     (2026-10-24 사용자 요청, 조정값 G.BALANCE.family perMother·sons·daughtersPer). 아이를 본국 자택으로 데려올 수 있다.
   · 뒤를 이을 수 있는 것은 아들뿐 (family.js F.heirs).
   상태: s.player.wives2 = [{id, kind:'maid'|'mate', city, house, aboard, deliver, wed, preg, lastBirth, tryDay}]
         s.player.wifeAboard — 본처가 배에 타고 있다
         아이 k.mother = 어머니 id, k.house = 사는 둘째 부인 집의 도시(없으면 본국 자택, -1 = 본국으로 가는 배 위)
         부하 m.hidden = 숨어 있는 항구 번호 (그 항구에 있는 동안만 — R.mateHidden)
   · 배우자는 본처를 합쳐 12명까지. 옛 저장에 더 많으면 그대로 두되 새 혼인은 막는다.
   조정값: G.BALANCE.wives */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var W = {};
  G.Wives = W;
  function S() { return G.Game.state; }
  function P() { return S().player; }
  function Fm() { return G.Family; }
  function C() { return G.Scenes.city; }
  function T() { return C().B.tavern; }
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.wives = G.BALANCE.wives || { hideHome: 0.7, conceive: 0.3, maxSpouses: 12 };
  // 2026-10-21 떠난 부인이 마음을 푸는 날수 · 부하와의 썸에서 결투한 뒤 (피로·규율·부인 충성)
  if (G.BALANCE.wives.coldDays == null) G.BALANCE.wives.coldDays = 120;
  if (!G.BALANCE.wives.affair) G.BALANCE.wives.affair = { fatigueWin: 15, fatigueLose: 25, wifeWin: 25, wifeLose: 15, discipline: 5 };
  function cfg() { return G.BALANCE.wives; }

  // ---------------------------------------------------------------- 누구인가
  W.list = function () { var p = P(); return p.wives2 || (p.wives2 = []); };
  W.count = function () { var p = P(); return (p.wife ? 1 : 0) + W.list().length; };
  W.maxSpouses = function () { return cfg().maxSpouses || 12; };
  W.canMarry = function () { return W.count() < W.maxSpouses(); };
  function full() { UI.toast('배우자는 본처를 포함해 ' + W.maxSpouses() + '명까지 맞을 수 있습니다.', 'ring', 4500); }
  W.of = function (id) { var p = P(); return (p.wives2 || []).filter(function (w) { return w.id === id; })[0] || null; };
  W.name = function (w) { var id = typeof w === 'string' ? w : w.id; return G.MAID[id] ? G.MAID[id].name : G.MATE[id] ? G.MATE[id].name : '부인'; };
  W.speaker = function (w) {
    if (G.MAID[w.id]) return T().maidSpeaker(G.MAID[w.id]);
    var d = G.MATE[w.id];
    return d ? { name: d.name, rigId: 'mate:' + d.id, portrait: G.Scenes.mateSpec(d.id), half: G.Img.chain.mateHalf ? G.Img.chain.mateHalf(d.id) : null, lang: 3 } : { name: '부인' };
  };
  function duo(w, emotion) { return T().duo ? T().duo(W.speaker(w), emotion || 'warm') : W.speaker(w); }
  /** 집이 있는 곳 (데려다주는 중이면 갈 곳) */
  W.cityName = function (w) { var c = G.CITY_DATA[w.city]; return c ? c.name : '?'; };
  /** 그 도시에 서 있는 둘째 부인의 집들 */
  W.housesAt = function (cid) { return W.list().filter(function (w) { return w.house && !w.aboard && w.city === cid; }); };
  /** 배에 함께 타고 있는 둘째 부인들 */
  W.aboard = function () { W.sync(); return W.list().filter(function (w) { return w.aboard; }); };
  function mateRow(id) { return S().mates.filter(function (m) { return m.id === id; })[0] || null; }

  // ---------------------------------------------------------------- 아이 수: 부인마다 5명 · 아들은 모두 합쳐 5명 · 딸은 부인마다 2명
  /* 아들·딸은 아이가 생길 때(임신) 정해 둔다 (preg.sex — 겉으로는 보이지 않는다). 그래야 여러 부인이 한꺼번에 아이를 가져도 수를 넘지 않는다.
     옛 저장의 임신(preg.sex 없음)은 태어날 때 남은 자리를 보고 정한다. 옛 저장에 이미 수를 넘는 아이가 있어도 없애지 않고 새 아이만 막는다. */
  function kc() { var f = G.BALANCE.family || {}; return { mom: f.perMother || 5, sons: f.sons || 5, daughters: f.daughtersPer || 2 }; }
  /** 어머니 열쇠: 본처 = 'main', 둘째 부인부터는 그 id */
  W.momKey = function (w) { return w && w.id ? w.id : 'main'; };
  W.momOf = function (k) { var p = P(); return k.mother && k.mother !== p.wife ? k.mother : 'main'; };
  function pregOf(key) { var p = P(); if (key === 'main') return p.preg || null; var w = W.of(key); return w && w.preg || null; }
  function allPregs() { var p = P(), out = p.preg ? [p.preg] : []; W.list().forEach(function (w) { if (w.preg) out.push(w.preg); }); return out; }
  /** 그 어머니의 아이 수 (배 속 아기 포함): { all, f } */
  W.momCount = function (key, skipPreg) {
    var n = 0, f = 0;
    (P().kids || []).forEach(function (k) { if (W.momOf(k) === key) { n++; if (k.sex === 'f') f++; } });
    var pr = pregOf(key); if (pr && pr !== skipPreg) { n++; if (pr.sex === 'f') f++; }
    return { all: n, f: f };
  };
  /** 모든 부인의 아들 수 (아들로 정해진 배 속 아기 포함) */
  W.sonTotal = function (skipPreg) {
    var n = (P().kids || []).filter(function (k) { return k.sex !== 'f'; }).length;
    allPregs().forEach(function (pr) { if (pr !== skipPreg && pr.sex === 'm') n++; });
    return n;
  };
  /** 그 어머니에게 새로 생길 수 있는 아이의 성별 (빈 배열 = 더는 아이가 생기지 않는다) */
  W.sexesOpen = function (key, skipPreg) {
    var K = kc(), c = W.momCount(key, skipPreg), out = [];
    if (c.all >= K.mom) return out;
    if (W.sonTotal(skipPreg) < K.sons) out.push('m');
    if (c.f < K.daughters) out.push('f');
    return out;
  };
  W.canConceive = function (key) { return W.sexesOpen(key).length > 0; };
  /** 아이가 생긴다: 아들·딸을 이때 정한다 */
  W.newPreg = function (key, day, gestation) { var o = W.sexesOpen(key); return { since: day, due: day + gestation, told: false, sex: o.length ? U.pick(o) : U.pick(['m', 'f']) }; };
  /** 태어날 아이들의 성별: 임신 때 정한 성별, 쌍둥이는 남은 자리가 있을 때만 (twin = 쌍둥이를 굴린 결과) */
  W.birthSexes = function (key, pr, twin) {
    var o0 = W.sexesOpen(key, pr), first = pr && pr.sex ? pr.sex : o0.length ? U.pick(o0) : U.pick(['m', 'f']), out = [first];
    if (twin) {
      var K = kc(), c = W.momCount(key, pr), sons = W.sonTotal(pr) + (first === 'm' ? 1 : 0), f = c.f + (first === 'f' ? 1 : 0), o = [];
      if (c.all + 1 < K.mom) { if (sons < K.sons) o.push('m'); if (f < K.daughters) o.push('f'); }
      if (o.length) out.push(o.indexOf(first) >= 0 ? first : o[0]);   // 쌍둥이는 되도록 같은 성별
    }
    return out;
  };
  /** 아이 수 전체 (예전 호환 — 정보 창 등) */
  W.kidTotal = function () { return (P().kids || []).length + allPregs().length; };
  W.maxKids = function () { var K = kc(); return K.mom * W.count(); };
  W.kidsOf = function (w) { return (P().kids || []).filter(function (k) { return k.mother === w.id && k.house === w.city; }); };

  // ---------------------------------------------------------------- 청혼
  /** 들어온 고장 (부하): 고용한 도시 → 처음 머물던 도시 → 지금 도시 */
  function metCity(m) {
    if (m && m.from != null && G.CITY_DATA[m.from]) return m.from;
    var r = G.MATE_RANGE && G.MATE_RANGE[m && m.id]; if (r && r.home != null && G.CITY_DATA[r.home]) return r.home;
    return S().loc.city;
  }
  function wedLog(name) { var l = W.list(), w = l[l.length - 1]; G.State.log(name + U.jx(name, '을/를') + ' ' + (w ? W.ordinal(w) : '둘째 부인') + '으로 맞았다.'); }   // 막 맞은 부인 (목록 끝)
  /** 여급에게 청혼 (본처가 있을 때) — 그 도시에 집이 생긴다. true = 결혼함 */
  W.proposeMaid = async function (c, m, say) {
    var p = P();
    if (W.of(m.id)) { UI.toast('이미 부인입니다.', 'ring'); return false; }
    if (!W.canMarry()) { full(); return false; }
    var ord = W.ordinal(W.nextNo());
    var ok = await UI.confirm(m.name + '에게 청혼하겠습니까?<br><small>고향에 본처(' + U.esc(Fm().wifeName()) + ')가 있으니 ' + m.name + U.jx(m.name, '은/는') + ' <b>' + ord + '</b>이 되어 이 도시 ' + c.name + '에 새 집을 얻어 삽니다. 그 집에서 아이를 가질 수도 있습니다.</small>', '청혼한다', '그만둔다');
    if (!ok) return false;
    R.removeItem('ring');
    if (G.Outcome) await G.Outcome.show('propose', { sub: m.name + U.jx(m.name, '이/가') + ' 반지를 받아 주었다' });   // 결과 연출 (js/ui/outcome.js)
    await say('…고향에 부인이 계신 건 알아요. 그래도 저는 당신이 좋아요. 이 도시에서 당신을 기다릴게요.', 'shy');
    W.list().push({ id: m.id, kind: 'maid', city: m.city, house: true, aboard: false, wed: S().day, no: W.nextNo() });
    var st = S().maids[m.id]; if (st) st.aff = 100;
    wedLog(m.name);
    if (G.FamEv) { try { await G.FamEv.wedding({ id: m.id, second: true, city: c.id }); } catch (e) { console.error(e); } }   // 술집의 혼례 잔치
    await UI.alert(m.name + U.jx(m.name, '과/와') + ' 혼인했다! ' + c.name + '에 「' + m.name + '의 집」이 생겼다. 도시 메뉴에서 찾아갈 수 있다.', ord);
    if (G.Game.cityHud) G.Game.cityHud();
    return true;
  };
  /** 부하에게 청혼 (본처가 있을 때): 고향으로 데려다주거나 함께 항해한다. true = 결혼함 */
  W.proposeMate = async function (d, m, say) {
    var p = P(), home = metCity(m), hc = G.CITY_DATA[home];
    if (W.of(d.id)) { UI.toast('이미 부인입니다.', 'ring'); return false; }
    if (!W.canMarry()) { full(); return false; }
    var ord = W.ordinal(W.nextNo());
    var ok = await UI.confirm(d.name + '에게 청혼하겠습니까?<br><small>고향에 본처(' + U.esc(Fm().wifeName()) + ')가 있으니 ' + d.name + U.jx(d.name, '은/는') + ' <b>' + ord + '</b>이 됩니다. 처음 만난 고장 ' + hc.name + '에 집을 마련해 데려다주거나, 부하로 남아 함께 항해할 수 있습니다.</small>', '청혼한다', '그만둔다');
    if (!ok) return false;
    R.removeItem('ring');
    if (G.Outcome) await G.Outcome.show('propose', { sub: d.name + U.jx(d.name, '이/가') + ' 반지를 받아 주었다' });   // 결과 연출 (js/ui/outcome.js)
    await say(d.witch ? '…둘째라도 상관없어요. 마녀는 원래 남의 눈 밖에서 사니까요.' : '…고향에 부인이 계신 건 알아요. 그래도 당신 곁에 있을래요.', 'shy');
    var w = { id: d.id, kind: 'mate', city: home, house: false, aboard: true, wed: S().day, no: W.nextNo() };
    W.list().push(w);
    S().flags['gone_' + d.id] = 1;            // 이제 술집에 나타나지 않는다
    S().flags['wed_' + d.id] = 1;
    wedLog(d.name);
    if (G.FamEv) { try { await G.FamEv.wedding({ id: d.id, second: true }); } catch (e) { console.error(e); } }   // 갑판 위의 혼례
    if (G.Achieve && G.Achieve.afterWed) { try { await G.Achieve.afterWed(d.id); } catch (e2) { console.error(e2); } }
    if (p.wifeAboard) {
      // 본처가 배에 있으니 둘째 부인은 배에 남을 수 없다 — 혼자 고장으로 떠난다
      settle(w, true);
      await UI.alert(d.name + U.jx(d.name, '과/와') + ' 혼인했다. 하지만 배에는 본처가 타고 있어 ' + d.name + U.jx(d.name, '은/는') + ' 혼자 ' + hc.name + '로 떠났다. 그곳에 「' + d.name + '의 집」이 생겼다.', ord);
      return true;
    }
    var v = await UI.ask('앞으로 어떻게 할까?', [
      { label: hc.name + '에 집을 마련해 데려다준다', value: 'home' },
      { label: '부하로 남아 함께 항해한다', value: 'sail' }], duo(w, 'warm'));
    if (v === 'home') {
      w.deliver = true;
      if (S().loc.mode === 'city' && S().loc.city === home) { settle(w, false); await UI.alert(hc.name + '에 「' + d.name + '의 집」이 생겼다. ' + d.name + U.jx(d.name, '은/는') + ' 배에서 내려 그 집에서 산다.', ord); }
      else await UI.alert(d.name + U.jx(d.name, '과/와') + ' 혼인했다! ' + hc.name + '에 들어가면 그곳에 집을 마련하고 배에서 내린다. 그때까지는 부하로 함께 간다.', ord);
    } else await UI.alert(d.name + U.jx(d.name, '과/와') + ' 혼인했다! 부하로 남아 함께 항해한다.<br><small class="muted">본국 항구에서는 남의 눈을 피해 숨기도 해서, 그동안은 특기를 쓸 수 없다. 처음 만난 ' + hc.name + '에 가면 집을 마련할 수 있다.</small>', ord);
    return true;
  };
  /** 둘째 부인이 배에서 내려 제 집에서 산다 (집이 없으면 생긴다). alone = 혼자 떠남 */
  function settle(w, alone) {
    w.house = true; w.aboard = false; w.deliver = false;
    if (w.kind === 'mate') { S().mates = S().mates.filter(function (x) { return x.id !== w.id; }); R.tidyCaptains(); }
    G.State.log(W.name(w) + U.jx(W.name(w), '이/가') + ' ' + W.cityName(w) + '의 집에 ' + (alone ? '먼저 가서 ' : '') + '자리 잡았다.');
  }
  W.settle = settle;
  /** 둘째 부인(부하 출신)을 다시 배에 태운다 */
  W.board = async function (w) {
    var p = P();
    if (p.wifeAboard) { await UI.say('본처께서 배에 타고 계시잖아요. 저는 여기서 기다릴게요.', duo(w)); return; }
    if (W.isCold(w)) { await UI.say('…아직은 배에 오르고 싶지 않아요. 당신이랑 한배에 있으면 또 숨이 막힐 것 같아요.', duo(w, 'sad')); return; }
    var mine = W.kidsOf(w).filter(function (k) { return Fm().kidAge(k) < 3; });
    if (w.preg && w.preg.told) { await UI.say('아기가 곧 태어나요. 지금은 배에 탈 수 없어요.', duo(w)); return; }
    if (mine.length) { await UI.say('아기가 아직 어려서 두고 갈 수 없어요. 조금 더 크면 함께 갈게요.', duo(w)); return; }
    var ok = await UI.confirm(W.name(w) + U.jx(W.name(w), '을/를') + ' 다시 배에 태워 부하로 함께 항해할까요?', '함께 간다', '그만둔다');
    if (!ok) return;
    w.aboard = true; w.house = true;          // 집은 그대로 남는다 (데려다주면 다시 산다)
    if (!mateRow(w.id)) S().mates.push({ id: w.id, role: 'none', joined: U.dateNum(S().date), loyal: w.warned ? 60 : 90, from: w.city });
    await UI.say(U.pick(['다시 바다로 나가는군요! 기다렸어요.', '집은 잘 잠가 둘게요. 가요, 당신.']), duo(w, 'happy'));
    UI.toast(W.name(w) + U.jx(W.name(w), '이/가') + ' 부하로 함대에 올랐다. (부하편성에서 역할을 맡기십시오)', 'people', 4500);
  };

  // ---------------------------------------------------------------- 본처를 배에 태운다
  W.boardWife = async function () {
    var p = P(), ws = Fm().wifeSpeaker();
    if (p.wifeAboard) {
      p.wifeAboard = false;
      await UI.say('알겠어요. 집에서 기다릴게요. 꼭 무사히 돌아와요.', ws);
      UI.toast(Fm().wifeName() + U.jx(Fm().wifeName(), '이/가') + ' 집에 남았다.', 'house');
      return;
    }
    if (p.preg) { await UI.say('지금은 몸이 무거워서 배에 탈 수 없어요.', ws); return; }
    var ab = W.aboard();
    var ok = await UI.confirm(Fm().wifeName() + U.jx(Fm().wifeName(), '을/를') + ' 배에 태워 함께 항해할까요?' +
      (ab.length ? '<br><span class="warn-text">배에 있는 둘째 부인(' + ab.map(W.name).join('·') + ')은 본처와 한배에 있을 수 없어 저마다의 집으로 갑니다.</span>' : '') +
      '<br><small class="muted">본처가 배에 있는 동안은 둘째 부인을 배에 태울 수 없습니다. 자택에서 다시 집에 남게 할 수 있습니다.</small>', '태운다', '그만둔다');
    if (!ok) return;
    ab.forEach(function (w) { settle(w, true); });
    if (ab.length) UI.toast(ab.map(W.name).join('·') + U.jx(W.name(ab[ab.length - 1]), '이/가') + ' 배에서 내려 제 집으로 갔다.', 'house', 5000);
    p.wifeAboard = true;
    await UI.say(U.pick(['정말요? 당신이 보는 바다를 저도 보고 싶었어요!', '집은 하인들에게 맡겼어요. 가요, 당신.']), ws);
  };

  // ---------------------------------------------------------------- 본국 항구에서 숨기
  /** 이 부하는 지금 숨어 있어 특기·말을 쓸 수 없나 (rules.js R.mateSkill·R.mateLang) */
  R.mateHidden = function (m) {
    var s = R.S(); return !!(m && m.hidden != null && s && s.loc && s.loc.mode === 'city' && s.loc.city === m.hidden);
  };
  function onArrive(c) {
    var s = S(), p = s.player, out = [];
    // 데려다주기로 한 둘째 부인: 그 고장에 들어오면 집을 마련하고 내린다
    W.list().forEach(function (w) {
      if (w.aboard && w.deliver && w.city === c.id) { settle(w, false); out.push({ icon: 'house', text: c.name + '에 ' + W.name(w) + '의 집을 마련했다. ' + W.name(w) + U.jx(W.name(w), '은/는') + ' 배에서 내려 이 집에서 산다.' }); }
    });
    // 본국 항구: 함께 다니는 둘째 부인이 남의 눈을 피해 숨는다
    var homeland = R.isHomeNation ? R.isHomeNation(c) : c.id === p.home;
    W.aboard().forEach(function (w) {
      var m = mateRow(w.id); if (!m) return;
      if (homeland && U.chance(cfg().hideHome == null ? 0.7 : cfg().hideHome)) {
        m.hidden = c.id;
        out.push({ icon: 'people', text: W.name(w) + U.jx(W.name(w), '은/는') + ' 본국 사람들의 눈을 피해 선실에 숨었다. 이 항구에 있는 동안은 ' + W.name(w) + '의 특기를 쓸 수 없다.' });
      } else delete m.hidden;
    });
    // 본국 자택으로 데려오는 아이
    if (c.id === p.home) (p.kids || []).forEach(function (k) {
      if (k.house !== -1) return;
      delete k.house;
      out.push({ icon: 'heart', text: k.name + U.jx(k.name, '이/가') + ' 본국 자택에 들어왔다. 이제 ' + Fm().wifeName() + U.jx(Fm().wifeName(), '과/와') + ' 함께 산다.' });
      G.State.log(k.name + U.jx(k.name, '을/를') + ' 본국 자택으로 데려왔다.');
    });
    return out;
  }
  W.onArrive = onArrive;

  // ---------------------------------------------------------------- 둘째 부인의 아기
  function inborn(w) {
    var st = P().st || {}, md = G.MATE[w.id], ms = md && md.st;
    function one(v, i) { var mo = ms ? ms[i] : 55; return Math.max(30, Math.min(85, Math.round(((v || 55) + (mo || 55)) / 2 + U.ri(-8, 8)))); }
    return { str: one(st.str, 0), int: one(st.int, 1), mar: one(st.mar, 2), cha: one(st.cha, 3) };
  }
  function there(w) { var s = S(); return s.loc && s.loc.mode === 'city' && s.loc.city === w.city; }
  /** 매일 (family.js F.daily에 붙음): 둘째 부인의 임신 편지·출산 */
  W.daily = function () {
    var s = S(), out = [], fc = G.BALANCE.family || {};
    W.sync();
    W.list().forEach(function (w) {
      var pr = w.preg; if (!pr) return;
      // 배에 함께 탄 부인이면 「배 위의 해산」 — 그 도시의 집에서 편지가 오고 아이가 태어나던 것을 고친다 (QA 2026-10-23)
      var ship = !!w.aboard, here = ship || there(w), nm = W.name(w);
      if (!pr.told && s.day - pr.since >= 75 && ship) { pr.told = true; out.push({ icon: 'heart', text: '배 위에서 ' + nm + U.jx(nm, '이/가') + ' 살며시 귀띔했다. 「당신, 아기가 생겼어요.」' }); }
      if (!pr.told && s.day - pr.since >= 75 && !here) { pr.told = true; out.push({ icon: 'heart', text: W.cityName(w) + '의 ' + nm + '에게서 편지가 왔다. 「당신, 아기가 생겼어요. 이 도시에서 기다릴게요.」' }); }
      if (s.day < pr.due) return;
      var sexes = W.birthSexes(W.momKey(w), pr, U.chance(fc.twins || 0.03)), twins = sexes.length > 1, born = [];
      for (var t = 0; t < sexes.length; t++) {
        var k = { name: '', unnamed: true, sex: sexes[t], born: { y: s.date.y, m: s.date.m, d: s.date.d }, sk: {}, lg: {}, st: inborn(w), edu: {}, mother: w.id, house: w.city };
        k.witness = here; k.bond = here ? (fc.bondBorn || 60) : (fc.bondMissed || 40);
        P().kids.push(k); born.push(k);
      }
      w.preg = null; w.lastBirth = s.day;
      var bk = twins ? '쌍둥이가' : born[0].sex === 'f' ? '딸이' : '아들이';
      out.push({ icon: 'heart', text: ship ? '배 위에서 ' + nm + '에게서 ' + bk + ' 태어났다! 아기는 ' + W.cityName(w) + '의 집에서 자란다 — 그 집에 들러 이름을 지어 주자.'
        : W.cityName(w) + '의 ' + nm + '에게서 ' + bk + ' 태어났다! 그 집에 들러 이름을 지어 주자.' });
      G.State.log(nm + '에게서 ' + (twins ? '쌍둥이' : born[0].sex === 'f' ? '딸' : '아들') + '이 태어났다.');
    });
    return out;
  };
  /** 집에 들렀을 때: 갓난아기 이름 · 임신 소식 · 아이가 생김 */
  W.visit = async function (w, rest) {
    var s = S(), p = s.player, fc = G.BALANCE.family || {}, sp = duo(w);
    var fresh = W.kidsOf(w).filter(function (k) { return k.unnamed && !k.met; });
    var sawBirth = fresh.some(function (k) { return k.witness; });
    if (fresh.length) {
      await UI.say(sawBirth ? '당신이 곁에 있어 줘서 든든했어요. 우리 아기예요.' : '당신이 없는 동안 이 아이가 태어났어요. 안아 봐요.', sp);
      fresh.forEach(function (k) { k.met = true; });
    }
    var kids = W.kidsOf(w);
    if (w.lastBond == null || s.day - w.lastBond >= 15) { w.lastBond = s.day; kids.forEach(function (k) { if (!k.unnamed) Fm().addBond(k, fc.bondVisit || 3); }); }
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i]; if (!k.unnamed) continue;
      await UI.say('이 아이에게 이름을 지어 주세요.', sp);
      var pool = U.shuffle(Fm().names(k.sex).filter(function (n) { return !p.kids.some(function (o) { return o.name === n; }) && n !== p.name; })).slice(0, 4);
      var v = await UI.choose((k.sex === 'f' ? '딸' : '아들') + '의 이름', pool.map(function (n) { return { label: n, value: n, icon: 'heart' }; }).concat([{ label: '직접 짓는다', value: '_', icon: 'scroll' }]), { width: 420, cancel: false });
      if (v === '_' || !v) v = (await UI.prompt('아이의 이름', pool[0], 10)) || pool[0];
      k.name = v; k.unnamed = false;
      G.State.log(W.name(w) + '의 ' + (k.sex === 'f' ? '딸' : '아들') + '에게 「' + v + '」' + U.jx(v, '이라는/라는') + ' 이름을 지어 주었다.');
      await UI.say(v + '… 좋은 이름이에요.', sp);
    }
    if (fresh.length && G.FamEv) { try { await G.FamEv.birth(fresh, sawBirth, w); } catch (e) { console.error(e); } }   // 갓난아기와 맞는 첫 장면 (familyevent.js)
    if (w.preg && !w.preg.told && s.day - w.preg.since >= 40) {
      w.preg.told = true;
      var shown = false; if (G.FamEv) { try { shown = await G.FamEv.pregNews(w); } catch (e) { console.error(e); } }
      if (!shown) await UI.say('당신… 우리에게 아기가 생겼어요.', sp);
      await UI.alert(W.name(w) + U.jx(W.name(w), '이/가') + ' 아이를 가졌다. ' + Math.max(1, Math.round((w.preg.due - s.day) / 30)) + '달쯤 뒤에 태어난다.', '기쁜 소식');
    }
    var md = G.MATE[w.id], tooOld = md && (md.old || (md.bornY && s.date.y - md.bornY > 45));
    if (!w.preg && !tooOld && W.canConceive(W.momKey(w)) && (w.lastBirth == null || s.day - w.lastBirth >= (fc.gapDays || 300)) && (w.tryDay == null || s.day - w.tryDay >= (rest ? 3 : 20))) {
      w.tryDay = s.day;
      if (U.chance((cfg().conceive || 0.3) * (rest ? 1.2 : 1))) w.preg = W.newPreg(W.momKey(w), s.day, fc.gestation || 266);
    }
  };
  W.talk = async function (w) {
    var s = S(), sp = duo(w), kids = W.kidsOf(w).filter(function (k) { return !k.unnamed; });
    await UI.say(U.pick(['당신이 오면 이 집이 환해져요.', '이번에는 얼마나 머물 수 있어요?', '바다 이야기 들려줘요. 당신이 본 것들이 궁금해요.']), sp);
    if (w.preg) await UI.say(w.preg.told ? '배 속의 아기가 잘 자라고 있어요. ' + Math.max(1, Math.round((w.preg.due - s.day) / 30)) + '달만 기다려요.' : '요즘 이상하게 졸려요.', sp);
    if (kids.length) await UI.say(kids.map(function (k) { return k.name; }).join('·') + U.jx(kids[kids.length - 1].name, '이/가') + ' 아버지를 기다려요. 본국에 데려가고 싶으면 말해요. 서운하지만… 아이 앞날이 먼저니까요.', sp);
  };
  /** 아이를 본국 자택으로 데려간다 (배에 태워 고향에 들어가면 자택으로 옮긴다) */
  W.sendHome = async function (w) {
    var kids = W.kidsOf(w).filter(function (k) { return !k.unnamed; });
    if (!kids.length) { UI.toast('데려갈 아이가 없습니다.', 'heart'); return; }
    var i = await UI.choose('본국 자택으로 데려갈 아이', kids.map(function (k, j) { return { label: k.name + ' <small class="muted">' + Fm().kidAge(k) + '세 · ' + (k.sex === 'f' ? '딸' : '아들') + '</small>', value: j, icon: 'heart' }; }), { width: 460, text: '배에 태워 고향 ' + G.CITY_DATA[P().home].name + '에 들어가면 자택에서 본처와 함께 삽니다.' });
    if (i == null) return;
    var k = kids[i];
    if (Fm().kidAge(k) < 3) { await UI.say('아직 젖먹이예요. 조금만 더 크면 보내 줄게요.', duo(w)); return; }
    await UI.say(Fm().bond(k) >= 50 ? '…' + k.name + ', 아버지 말씀 잘 듣고. 편지 꼭 써.' : '…아이가 낯설어해요. 그래도 아버지 곁이 좋겠죠.', duo(w));
    k.house = -1;
    UI.toast(k.name + U.jx(k.name, '이/가') + ' 배에 올랐다. 고향 ' + G.CITY_DATA[P().home].name + '에 들어가면 자택으로 간다.', 'ship', 5000);
  };

  // ---------------------------------------------------------------- 둘째 부인의 집 (도시 건물)
  var H2 = { paint: 'home', icon: 'house', exitLabel: '집을 나온다' };
  W.H2 = H2;
  H2.title = function (c, id) { return W.name(id) + '의 집'; };
  H2.sub = function (c, id) {
    var w = W.of(id); if (!w) return '';
    var kids = W.kidsOf(w);
    return W.ordinal(w) + (W.isCold(w) ? ' · 아직 마음이 풀리지 않음' : '') + (kids.length ? ' · 아이 ' + kids.length : '') + (w.preg && w.preg.told ? ' · 아기를 기다리는 중' : '');
  };
  H2.enter = async function (c, id) {
    var w = W.of(id); if (!w) return false;
    if (W.isCold(w)) { await UI.say(U.pick(LEAVE.coldDoor), duo(w, 'sad')); UI.toast('문이 열리지 않는다. ' + Math.max(1, Math.round((w.cold - S().day) / 30)) + '달쯤 뒤에 다시 와 보자.', 'house', 4500); return false; }
    var thawed = w.cold != null;   // 마음이 풀린 뒤 처음 찾아온 날: 인사 대신 화해의 말
    if (thawed) { delete w.cold; await UI.say(U.pick(LEAVE.thaw), duo(w, 'warm')); G.State.log(W.name(w) + U.jx(W.name(w), '과/와') + ' 다시 마음을 터놓았다.'); }
    if (!thawed) await UI.say(w.aboard   // 배에 함께 탄 둘째 부인이면 같이 돌아온 집 (2026-10-21)
      ? U.pick(['우리 집이에요! 같이 문을 여니까 꼭 새집 같아요.', '먼지부터 털어야겠네요. 배 위에서 내내 이 부엌 생각이 났어요.'])
      : U.pick(['어서 와요, 당신! 오늘은 우리 집에서 쉬어요.', '당신 배가 보였어요. 기다리고 있었어요.', '오셨군요. 따뜻한 수프를 데울게요.']), duo(w, 'happy'));
    if (G.FamEv) { try { await G.FamEv.homeReturn(w); } catch (e) { console.error(e); } }   // 오래 떠났다 돌아온 날 (familyevent.js)
    await W.visit(w, false);
    if (G.FamEv) { try { await G.FamEv.homeDay(w); } catch (e) { console.error(e); } }      // 임신 중의 한때 · 가족의 일상
  };
  H2.menu = function (c, id) {
    var w = W.of(id); if (!w) return [];
    var kids = W.kidsOf(w).filter(function (k) { return !k.unnamed; }), play = kids.filter(function (k) { return Fm().kidAge(k) >= 3; });
    return [
      { label: '쉰다', icon: 'bed', onClick: function () { return H2.rest(c, w); } },
      { label: '이야기한다', icon: 'heart', onClick: function () { return W.talk(w); } },
      play.length && G.HomeLife ? { label: '아이와 함께', icon: 'star', sub: play.map(function (k) { return k.name; }).join('·'), onClick: function () { return H2.kids(w); } } : null,
      kids.length ? { label: '아이를 본국으로 데려간다', icon: 'ship', sub: '고향 ' + G.CITY_DATA[P().home].name + ' 자택으로', onClick: function () { return W.sendHome(w); } } : null,
      w.kind === 'mate' ? { label: '함께 항해에 나선다', icon: 'sail', sub: P().wifeAboard ? '본처가 배에 있다' : '부하로 다시 태운다', dim: !!P().wifeAboard, onClick: function () { return W.board(w); } } : null
    ];
  };
  H2.rest = async function (c, w) {
    var s = S();
    await UI.fade(function () { G.Game.passDays(3); });
    s.player.hp = 100; s.fleet.fatigue = 0;
    await UI.say(W.name(w) + '의 집에서 푹 쉬었다. 몸도 마음도 가벼워졌다.', {});
    await W.visit(w, true);
  };
  H2.kids = async function (w) {
    var kids = W.kidsOf(w).filter(function (k) { return !k.unnamed && Fm().kidAge(k) >= 3; });
    if (!kids.length) return;
    var i = kids.length > 1 ? await UI.choose('누구와 시간을 보낼까?', kids.map(function (k, j) { return { label: k.name + ' <small class="muted">' + Fm().kidAge(k) + '세</small>', right: Fm().bondHearts(k), value: j, icon: 'heart' }; }), { width: 460 }) : 0;
    if (i == null) return;
    await G.HomeLife.kidMenu(kids[i]);
  };
  /** 집 안에 서 있는 둘째 부인과 아이들 */
  H2.panel = function (c, id) {
    var w = W.of(id); if (!w || !G.HomeLife || !G.HomeLife.familyPanel) return null;
    var sp = W.speaker(w), HL = G.HomeLife, babies = W.kidsOf(w).filter(function (k) { return Fm().kidAge(k) < 3; });
    var list = [{ who: 'wife', name: W.name(w), sub: babies.length ? babies.map(function (k) { return Fm().kidName(k); }).join('·') + ' 안고 있다' : (w.preg && w.preg.told ? '아기를 기다리는 중' : W.ordinal(w)), chain: sp.half || [], portrait: sp.portrait, scale: 1, onClick: function () { return W.talk(w); } }];
    W.kidsOf(w).filter(function (k) { return !k.unnamed && Fm().kidAge(k) >= 3; }).sort(function (a, b) { return Fm().kidAge(a) - Fm().kidAge(b); }).forEach(function (k) {
      list.push({ who: 'kid', k: k, name: k.name, sub: Fm().kidAge(k) + '세 ' + Fm().bondHearts(k), chain: HL.chain(k, true), portrait: Fm().kidSpec(k), scale: ((G.FAMILY_LOOK || {}).scale || {})[HL.stage(k)] || 1 });
    });
    return HL.familyPanel(list);
  };
  H2.preload = function (c, id) { var w = W.of(id); if (!w) return null; var sp = W.speaker(w); return sp.half && sp.half.length ? [sp.half] : null; };


  // ================================================================ 2026-10-21 몇째 부인 · 배 위 상태 바로잡기 · 떠나는 이야기 · 세대 교체 · 부하와의 썸
  // ---------------------------------------------------------------- 몇째 부인 (본처가 첫째, 혼인한 차례대로 둘째·셋째·넷째 …)
  var ORD = ['둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째', '열한째', '열두째', '열셋째'];
  function ordWord(n) { return ORD[n - 2] || (n + '째'); }
  /** 옛 저장: 차례(w.no)가 없으면 혼인한 차례대로 매긴다. 한 번 매긴 차례는 누가 떠나도 바뀌지 않는다 */
  function assignNos() {
    var used = {}, list = W.list(); list.forEach(function (w) { if (w.no) used[w.no] = 1; });
    var n = 2; list.forEach(function (w) { if (!w.no) { while (used[n]) n++; w.no = n; used[n] = 1; } });
  }
  W.no = function (w) { if (!w.no) assignNos(); return w.no; };
  /** 다음에 맞을 부인의 차례 */
  W.nextNo = function () { assignNos(); var mx = 1; W.list().forEach(function (w) { mx = Math.max(mx, w.no || 1); }); (P().wivesGone || []).forEach(function (g) { mx = Math.max(mx, g.no || 1); }); return mx + 1; };
  W.ordinal = function (w) { return ordWord(typeof w === 'number' ? w : W.no(w)) + ' 부인'; };

  // ---------------------------------------------------------------- 배 위 상태 바로잡기
  /* 배에 함께 탄다고 적혀 있는데 부하 명단에 없으면(충성이 바닥나 내렸거나 옛 저장) 그 사람은 배에 없다 —
     예전엔 이런 부인이 「실종」되어 수첩에는 「배에 함께」로 남고 배 위의 사건까지 일어났다. 제 집으로 돌려보낸다. */
  W.sync = function () {
    var s = S(); if (!s || !s.player || !s.mates) return;
    (s.player.wives2 || []).forEach(function (w) {
      if (!w.aboard || w.kind !== 'mate' || mateRow(w.id)) return;
      w.aboard = false; w.deliver = false; w.house = true;
      if (w.cold == null) w.cold = s.day + coldDays();
      G.State.log(W.name(w) + U.jx(W.name(w), '은/는') + ' 배에서 내려 ' + W.cityName(w) + '의 집으로 돌아갔다.');
    });
  };
  function coldDays() { return cfg().coldDays || 120; }
  /** 아직 마음이 풀리지 않았나 (집에 찾아가도 문을 열어 주지 않는다) */
  W.isCold = function (w) { return w && w.cold != null && S().day < w.cold; };

  // ---------------------------------------------------------------- 떠나는 이야기 — 「더 이상 당신이랑 못 살겠어요」
  var LEAVE = {
    knock: ['밤이 깊었다. 선실 문을 두드리는 소리 — {w}{이} 작은 짐 꾸러미를 끌어안고 서 있다. 눈가가 붉다.',
      '항해 일지를 덮으려는데 {w}{이} 들어왔다. 말없이 반지를 손가락에서 뺐다 끼웠다 한다.'],
    why: {
      hidden: '항구에 들 때마다 저는 선실에 숨었어요. 당신 나라 사람들 앞에서는 당신 아내라고 말 한마디 못 하고요. 저는 당신 그림자로 살려고 반지를 받은 게 아니에요.',
      idle: '배에서 제가 하는 일이 뭐예요? 방도, 할 일도 없이 하루 종일 당신만 기다려요. 당신은 바다만 보고요.',
      many: '셋째, 넷째… 당신 곁에는 늘 다른 사람이 있어요. 저는 몇 번째인지 세는 것도 지쳤어요.',
      plain: '당신은 늘 다음 항구, 다음 발견뿐이에요. 저는 그 사이 어디쯤에 놓여 있는 짐 같아요.'
    },
    last: ['더 이상 당신이랑은 못 살겠어요. 다음 항구에서 내릴게요.', '이제 그만할래요. 당신이랑은 더 못 살겠어요.'],
    keepOk: ['…당신이 그렇게 말하는 건 처음이네요. 좋아요, 한 번만 더 믿어 볼게요. 다음엔 정말 떠날 거예요.', '…바보 같아요, 저. 또 넘어가 주네요. 이번이 마지막이에요.'],
    keepNo: ['말로 될 일이 아니에요. 집으로 갈게요. 찾아오지 마세요… 당분간은요.', '미안해요. 오늘은 당신 말이 하나도 들리지 않아요.'],
    home: ['…고마워요. {city}의 집에서 마음을 좀 추스를게요. 한동안은 찾아오지 마세요.', '집에 가 있을게요. 언젠가는… 다시 웃으면서 문을 열 수 있겠죠.'],
    part: ['…그래요. 이게 서로에게 나아요. 반지는 돌려드릴게요.', '잘 지내요, 제독. 당신 바다가 늘 순하길 빌게요.'],
    kids: '아이들은 당신 집안 아이예요. 본국으로 데려가 줘요. 가끔… 제 얘기도 해 주고요.',
    coldDoor: ['(문 안쪽에서) …아직은 당신 얼굴 보고 싶지 않아요. 돌아가요.', '(창문 너머로) 오늘은 그냥 가 줘요. 아직이에요.'],
    thaw: ['…생각 많이 했어요. 그래도 당신이 찾아와 주니까 좋네요. 들어와요.', '화가 다 풀린 건 아니에요. 그래도… 수프 데워 놨어요.']
  };
  function lf(t, w, extra) {
    var o = { w: W.name(w), city: W.cityName(w) }; for (var k in extra || {}) o[k] = extra[k];
    var J = { '이': '이/가', '을': '을/를', '은': '은/는', '과': '과/와' };
    return String(t).replace(/\{(\w+)\}\{(이|을|은|과)\}/g, function (a, k, j) { var v = String(o[k] == null ? '' : o[k]); return v + U.jx(v, J[j]); })
      .replace(/\{(\w+)\}/g, function (a, k) { return o[k] == null ? a : o[k]; });
  }
  /** 충성이 바닥난 부인(배에 함께 탄 부하 출신)이 떠나려 한다 — G.Cabins.farewell 이 부른다 */
  W.farewell = async function (m) {
    var s = S(), w = W.of(m.id); if (!w) return;
    var sp = duo(w, 'sad'), nm = W.name(w), kids = W.kidsOf(w), why = m.hidden != null || w.hidHome ? 'hidden' : (!m.role || m.role === 'none') && m.room == null ? 'idle' : W.count() >= 3 ? 'many' : 'plain';
    await UI.say(lf(U.pick(LEAVE.knock), w), {});
    await UI.say(LEAVE.why[why], sp);
    await UI.say(U.pick(LEAVE.last), sp);
    var v = await UI.ask(W.ordinal(w) + ' ' + nm + U.jx(nm, '이/가') + ' 당신 곁을 떠나려 한다.', [
      { label: '붙잡는다 — 「내가 잘못했소. 한 번만 다시 생각해 주오」', value: 'keep', icon: 'heart' },
      { label: '집으로 보내 준다 — 「잠시 떨어져 지냅시다」', value: 'home', icon: 'house' },
      { label: '헤어진다 — 반지를 돌려받는다', value: 'part', icon: 'boot' }], { name: P().name, portrait: P().portrait });
    if (v === 'keep') {
      var b = (G.BALANCE && G.BALANCE.mates) || {};
      var pr = U.clamp((b.persuade == null ? 0.25 : b.persuade) + 0.1 + (R.stat('cha') - 50) / 200 + R.skill('speech') * (b.persuadeSpeech || 0.12) + (kids.length ? 0.1 : 0) - (w.warned ? 0.15 : 0), 0.05, 0.85);
      if (U.chance(pr)) {
        m.loyal = 40; w.warned = s.day;
        await UI.say(U.pick(LEAVE.keepOk), duo(w, 'warm'));
        UI.toast(nm + U.jx(nm, '을/를') + ' 붙잡았다. (충성 40) — 다음에 또 바닥나면 붙잡기 더 어렵다.', 'heart', 5200);
        G.State.log(nm + U.jx(nm, '이/가') + ' 떠나려 했으나 마음을 돌렸다.');   // 조사를 이름에 맞춰 (QA 2026-10-23)
        return;
      }
      await UI.say(U.pick(LEAVE.keepNo), sp);
      v = 'home';
    }
    if (v === 'home') {
      settle(w, !(s.loc && s.loc.mode === 'city' && s.loc.city === w.city));
      w.cold = s.day + coldDays(); m.loyal = 0;
      await UI.say(lf(U.pick(LEAVE.home), w), sp);
      await UI.alert(nm + U.jx(nm, '은/는') + ' 배에서 내려 ' + W.cityName(w) + '의 집으로 갔다.<br><small class="muted">한동안(' + Math.round(coldDays() / 30) + '달쯤) 찾아가도 문을 열어 주지 않는다. 그 뒤에 찾아가면 다시 맞아 준다.</small>', W.ordinal(w));
      G.State.log(nm + U.jx(nm, '이/가') + ' 「더는 당신이랑 못 살겠다」며 ' + W.cityName(w) + '의 집으로 떠났다.');
      return;
    }
    // 헤어진다
    await UI.say(U.pick(LEAVE.part), sp);
    if (kids.length) { await UI.say(LEAVE.kids, sp); kids.forEach(function (k) { k.house = -1; }); }
    W.divorce(w);
    await UI.alert(nm + U.jx(nm, '과/와') + ' 헤어졌다. ' + nm + U.jx(nm, '은/는') + ' 배에서 내려 떠났다.' + (kids.length ? '<br>아이들(' + kids.map(function (k) { return k.name || '갓난아기'; }).join('·') + ')은 배에 태워 본국 자택으로 데려간다.' : ''), '이별');
  };
  /** 헤어진다: 부인 목록에서 빼고(차례는 남긴다), 배와 부하 명단에서도 내린다. 반지를 돌려받는다 */
  W.divorce = function (w) {
    var s = S(), p = P(), nm = W.name(w);
    p.wives2 = W.list().filter(function (x) { return x !== w; });
    (p.wivesGone = p.wivesGone || []).push({ id: w.id, no: W.no(w), city: w.city, day: s.day });
    s.mates = s.mates.filter(function (x) { return x.id !== w.id; }); R.tidyCaptains();
    s.flags['gone_' + w.id] = 1; s.flags['divorced_' + w.id] = 1;
    if (G.Romance && G.Romance.st) { var ps = G.Romance.st().pairs; Object.keys(ps).forEach(function (k) { if (ps[k].f === w.id || ps[k].m === w.id) delete ps[k]; }); }
    R.addItem('ring');
    G.State.log(nm + U.jx(nm, '과/와') + ' 헤어졌다. (' + W.ordinal(w) + ')');
  };

  // ---------------------------------------------------------------- 세대 교체: 선대의 부인들은 사라지지 않는다
  /* F.succeed(family.js)가 새 제독을 세우기 전에 부른다: 배에 탄 부인들은 저마다의 집으로 내리고,
     선대의 본처·부인들을 새 제독의 「선대의 부인」(어머니·○째 부인)으로 남긴다. 돌려주는 값: 새 player.elders */
  W.retire = function (p, heir) {
    var s = S(), out = (p.elders || []).map(function (e) { var o = {}; for (var k in e) o[k] = e[k]; o.gen = (e.gen || 1) + 1; return o; });
    var mother = heir && heir.mother;          // 둘째 부인부터의 아이면 그 어머니 id, 본처의 아이면 없음
    if (p.wife) out.unshift({ id: p.wife, kind: 'main', city: p.home, title: !mother ? '어머니' : '선대의 본처', gen: 1 });
    (p.wives2 || []).forEach(function (w) {
      if (w.aboard) { if (w.kind === 'mate') s.mates = s.mates.filter(function (x) { return x.id !== w.id; }); w.aboard = false; w.house = true; }
      out.push({ id: w.id, kind: w.kind, city: w.city, no: W.no(w), title: mother === w.id ? '어머니' : '선대의 ' + W.ordinal(w), gen: 1 });
    });
    if (R.tidyCaptains) R.tidyCaptains();
    return out;
  };
  W.elders = function () { return P().elders || []; };
  W.infoElders = function () {
    var list = W.elders(); if (!list.length) return '';
    return '<div>선대의 부인</div><div>' + list.map(function (e) {
      var nm = W.name(e.id);
      var c = G.CITY_DATA[e.city];
      return U.esc(e.gen > 1 ? (e.title === '어머니' ? '할머니' : '선선대의 부인') : e.title) + ' ' + U.esc(nm) + (c ? ' <small class="muted">(' + c.name + (e.kind === 'main' ? ' 본가' : '의 집') + ')</small>' : '');
    }).join(', ') + '</div>';
  };

  // ---------------------------------------------------------------- 배 위의 썸 — 부인과 부하 (G.Romance가 부른다)
  var AFFAIR = {
    n: ['달 없는 밤, 고물 쪽 밧줄 더미 그늘에서 웃음소리가 새어 나온다. {w}{과} {he}{이} 나란히 앉아 있다. {he}{이} {w}의 손등에 제 손을 슬며시 얹는다.',
      '저녁 끼니 뒤, 갑판 끝에서 {he}{이} {w}에게 무언가를 건넨다 — 손수 깎은 머리빗이다. {w}{이} 얼굴을 붉히며 받아 든다.'],
    w: ['다, 당신…! 그런 게 아니에요. 그냥 이야기를 했을 뿐이에요.', '당신… 언제부터 거기 있었어요?'],
    me: ['{he}, 칼을 뽑아라. 내 아내에게 손을 댄 값은 이 갑판 위에서 치른다.', '선원들은 물러서라. {he}, 이건 제독과 부하의 일이 아니다. 사내와 사내의 일이다.'],
    he: ['제독… 변명하지 않겠습니다. 피하지도 않겠습니다.', '…좋습니다. 이렇게 된 이상, 칼로 답하겠습니다.'],
    crowd: '선원들이 둥글게 물러선다. 횃불 아래 두 사람이 마주 선다.',
    win: { me: '일어나라. 목숨까지는 거두지 않겠다. 다만 다시는 내 아내 곁에 얼씬거리지 마라.', he: '…졌습니다. 할 말이 없습니다.', w: '…당신이 저를 위해 칼을 뽑을 줄은 몰랐어요. 미안해요. 다시는 한눈팔지 않을게요.' },
    lose: { he: '…제독, 이제 그만하시지요. 저도 더는 싸울 마음이 없습니다.', w: '그만해요! 둘 다 그만! …당신이 다치는 건 보고 싶지 않아요. 제가 잘못했어요. 당신 곁에 있을게요.' },
    after: '그날 밤 배 안은 쉽게 잠들지 못했다. 선원들이 수군거리고, {he}{은} 아무와도 눈을 마주치지 않는다.'
  };
  /** 부인(배에 탄 부하 출신)과 남자 부하 사이에 끌림이 생겼다 — 제독이 그 부하와 결투한다.
      피로가 오르고(밤새 수군거림), 그 부하의 충성은 바닥(0 — 다음 달 떠나겠다고 나선다), 부인의 충성은 오른다. 두 사람은 오래 서먹해진다. */
  W.affair = async function (p) {
    var s = S(), w = W.of(p.f), hm = mateRow(p.m), wm = mateRow(p.f), hd = G.MATE[p.m]; if (!w || !hm || !wm || !hd) return;
    var B = cfg().affair || { fatigueWin: 15, fatigueLose: 25, wifeWin: 25, wifeLose: 15, discipline: 5 };
    var ex = { he: hd.name.split(' ')[0] }, me = { name: P().name, portrait: P().portrait }, hsp = { name: hd.name, portrait: G.Scenes.mateSpec(p.m), lang: 3 };
    await UI.say(lf(U.pick(AFFAIR.n), w, ex), {});
    await UI.say(U.pick(AFFAIR.w), duo(w, 'sad'));
    await UI.say(lf(U.pick(AFFAIR.me), w, ex), me);
    await UI.say(U.pick(AFFAIR.he), hsp);
    await UI.say(AFFAIR.crowd, {});
    var st = hd.st || [60, 50, 60, 50], res = 'win';
    if (G.Games && G.Games.duel) {
      res = await G.Games.duel({ name: hd.name, portrait: G.Scenes.mateSpec(p.m), look: 'rival', str: st[0], atk: 3 + Math.round(st[2] / 10), def: 1 + Math.floor(st[0] / 30),
        skill: R.mateSkill(hm, 'sword'), mar: st[2], int: st[1], cha: st[3] }, { place: 'deck' });
    }
    var won = res === 'win';
    if (won) { await UI.say(AFFAIR.win.me, me); await UI.say(AFFAIR.win.he, hsp); await UI.say(AFFAIR.win.w, duo(w, 'warm')); }
    else { await UI.say(AFFAIR.lose.he, hsp); await UI.say(AFFAIR.lose.w, duo(w, 'warm')); }
    await UI.say(lf(AFFAIR.after, w, ex), {});
    var f = s.fleet, fat0 = f.fatigue || 0;
    f.fatigue = U.clamp(fat0 + (won ? B.fatigueWin : B.fatigueLose), 0, 100);
    f.discipline = U.clamp((f.discipline || 0) - (B.discipline || 0), 0, 100);
    hm.loyal = p.m === 'rocco' ? 5 : 0;                 // 바닥 — 다음 달(G.Cabins.monthly) 배에서 내리겠다고 나선다
    var wl0 = wm.loyal == null ? 70 : wm.loyal; wm.loyal = Math.min(100, wl0 + (won ? B.wifeWin : B.wifeLose));
    p.stage = 'cold'; p.heat = 0; p.cd = s.day + ((G.BALANCE.romance || {}).coldDays || 180) * 3; p.due = null;
    G.State.log(W.ordinal(w) + ' ' + W.name(w) + U.jx(W.name(w), '과/와') + ' 가까워진 ' + hd.name + U.jx(hd.name, '과/와') + ' 갑판에서 결투했다 (' + (won ? '이김' : '짐') + ').');
    await UI.alert('<b>' + U.esc(hd.name) + '</b> 충성 → ' + hm.loyal + ' <small class="muted">(바닥 — 곧 배에서 내리겠다고 할 것이다)</small><br><b>' + U.esc(W.name(w)) + '</b> 충성 ' + Math.round(wl0) + ' → ' + Math.round(wm.loyal) +
      '<br>함대 피로 +' + Math.round(f.fatigue - fat0) + (B.discipline ? ' · 규율 −' + B.discipline : ''), won ? '결투 — 이겼다' : '결투 — 졌다');
    if (G.Game.refreshHud) G.Game.refreshHud();
  };

  // ---------------------------------------------------------------- 수첩
  W.infoWife = function () {
    W.sync();
    var p = P(), list = W.list();
    var h = p.wifeAboard ? ' <small class="muted">(배에 함께)</small>' : '';
    if (list.length) h += '<br><small>' + list.slice().sort(function (a, b) { return W.no(a) - W.no(b); }).map(function (w) { return W.ordinal(w) + ' ' + U.esc(W.name(w)) + ' <span class="muted">(' + (w.aboard ? '배에 함께' + (w.deliver ? ' · ' + W.cityName(w) + '로 가는 중' : '') : W.cityName(w) + '의 집') + (w.preg && w.preg.told ? ' · 아기를 가짐' : '') + (W.isCold(w) ? ' · 마음이 상해 있음' : '') + ')</span>'; }).join(', ') + '</small>';
    return h;
  };
  W.kidTag = function (k) {
    if (k.house === -1) return ' · 본국으로 가는 배';
    if (k.house != null) return ' · ' + W.name(k.mother) + '의 집(' + (G.CITY_DATA[k.house] || {}).name + ')';
    return '';
  };

  // ---------------------------------------------------------------- 다른 코드에 잇기 (스크립트가 모두 읽힌 뒤)
  function hook() {
    var Cc = G.Scenes && G.Scenes.city, F = G.Family;
    if (!Cc || !F || W.hooked) return;
    W.hooked = true;
    Cc.B.house2 = H2;
    // 도시 건물: 둘째 부인의 집
    var ob = Cc.buildings;
    Cc.buildings = function (c) {
      var out = ob.apply(this, arguments);
      try {
        if (G.Game.state && !c.outpost) W.housesAt(c.id).forEach(function (w) {
          var gi = -1; out.forEach(function (b, i) { if (b.kind === 'gate') gi = i; });
          var b = { kind: 'house2', arg: w.id, name: W.name(w) + '의 집', icon: 'house' };
          if (gi >= 0) out.splice(gi, 0, b); else out.push(b);
        });
      } catch (e) { console.error(e); }
      return out;
    };
    // 항구에 들어설 때
    var oa = Cc.arrival;
    Cc.arrival = async function (c, arg) {
      var r = await oa.apply(this, arguments);
      try { var news = onArrive(c); if (news.length) await Cc.news(news); } catch (e) { console.error(e); }
      return r;
    };
    // 날마다: 둘째 부인의 임신·출산
    var od = F.daily;
    F.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(W.daily()); } catch (e) { console.error(e); } return out; };
    // 자택: 본처를 배에 태우기
    var HM = Cc.B.home, om = HM.menu;
    HM.menu = function (c) {
      var items = om.apply(this, arguments), p = P();
      if (p.wife) {
        var it = { label: p.wifeAboard ? '아내를 집에 남긴다' : '아내와 함께 항해한다', icon: 'sail', sub: p.wifeAboard ? '지금 배에 함께 있다' : (W.aboard().length ? '배의 둘째 부인은 제 집으로' : ''), onClick: function () { return W.boardWife(); } };
        var at = -1; items.forEach(function (x, i) { if (x && x.icon === 'save') at = i; });
        if (at >= 0) items.splice(at, 0, it); else items.push(it);
      }
      return items;
    };
  }
  W.hook = hook;
  hook();                                                     // city.js·misc.js·family.js 다음에 읽힌다 (index.html)
  if (!W.hooked) document.addEventListener('DOMContentLoaded', hook);
})(window.G = window.G || {});
