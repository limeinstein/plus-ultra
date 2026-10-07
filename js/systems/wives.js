/* 둘째 부인부터 (G.Wives) — 첩, 고장의 집, 그 집의 아이, 함께 항해, 본국에서 숨기
   · 첫째 부인(본처)은 고향 자택 (family.js). 본처가 있는데 또 청혼하면 둘째 부인이 된다.
   · 여급: 그 여급이 일하던 도시에 새 집이 생기고 거기서 산다.
   · 부하(여성 항해사·철새·마녀): 처음 만난(고용한) 고장으로 데려다주면 그곳에 집이 생긴다. 또는 부하로 남아 함께 항해한다.
     집에 사는 부하 출신 부인은 그 집에서 다시 배에 태울 수 있다.
   · 함께 항해하는 둘째 부인은 본국(제독 나라의 항구)에 들어서면 남의 눈을 피해 선실에 숨기도 한다 — 그 항구에 있는 동안 특기·말을 쓸 수 없다.
   · 배에 본처가 타고 있으면 둘째 부인은 배에 탈 수 없다 (본처를 태우면 배에 있던 둘째 부인은 제 집으로 간다).
   · 둘째 부인의 집에서도 아이가 생긴다. 아이는 모두 합쳐 5명까지(본처의 아이와 함께 센다). 아이를 본국 자택으로 데려올 수 있다.
   · 뒤를 이을 수 있는 것은 아들뿐 (family.js F.heirs).
   상태: s.player.wives2 = [{id, kind:'maid'|'mate', city, house, aboard, deliver, wed, preg, lastBirth, tryDay}]
         s.player.wifeAboard — 본처가 배에 타고 있다
         아이 k.mother = 어머니 id, k.house = 사는 둘째 부인 집의 도시(없으면 본국 자택, -1 = 본국으로 가는 배 위)
         부하 m.hidden = 숨어 있는 항구 번호 (그 항구에 있는 동안만 — R.mateHidden)
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
  G.BALANCE.wives = G.BALANCE.wives || { hideHome: 0.7, conceive: 0.3, maxKids: 5 };
  function cfg() { return G.BALANCE.wives; }

  // ---------------------------------------------------------------- 누구인가
  W.list = function () { var p = P(); return p.wives2 || (p.wives2 = []); };
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
  W.aboard = function () { return W.list().filter(function (w) { return w.aboard; }); };
  function mateRow(id) { return S().mates.filter(function (m) { return m.id === id; })[0] || null; }

  // ---------------------------------------------------------------- 아이 수 (모두 합쳐 5명)
  W.kidTotal = function () {
    var p = P(), n = (p.kids || []).length + (p.preg ? 1 : 0);
    W.list().forEach(function (w) { if (w.preg) n++; });
    return n;
  };
  W.maxKids = function () { return cfg().maxKids || ((G.BALANCE.family || {}).maxKids) || 5; };
  W.kidsOf = function (w) { return (P().kids || []).filter(function (k) { return k.mother === w.id && k.house === w.city; }); };

  // ---------------------------------------------------------------- 청혼
  /** 들어온 고장 (부하): 고용한 도시 → 처음 머물던 도시 → 지금 도시 */
  function metCity(m) {
    if (m && m.from != null && G.CITY_DATA[m.from]) return m.from;
    var r = G.MATE_RANGE && G.MATE_RANGE[m && m.id]; if (r && r.home != null && G.CITY_DATA[r.home]) return r.home;
    return S().loc.city;
  }
  function wedLog(name) { G.State.log(name + U.jx(name, '을/를') + ' 둘째 부인으로 맞았다.'); }
  /** 여급에게 청혼 (본처가 있을 때) — 그 도시에 집이 생긴다. true = 결혼함 */
  W.proposeMaid = async function (c, m, say) {
    var p = P();
    if (W.of(m.id)) { UI.toast('이미 부인입니다.', 'ring'); return false; }
    var ok = await UI.confirm(m.name + '에게 청혼하겠습니까?<br><small>고향에 본처(' + U.esc(Fm().wifeName()) + ')가 있으니 ' + m.name + U.jx(m.name, '은/는') + ' <b>둘째 부인</b>이 되어 이 도시 ' + c.name + '에 새 집을 얻어 삽니다. 그 집에서 아이를 가질 수도 있습니다.</small>', '청혼한다', '그만둔다');
    if (!ok) return false;
    R.removeItem('ring');
    await say('…고향에 부인이 계신 건 알아요. 그래도 저는 당신이 좋아요. 이 도시에서 당신을 기다릴게요.', 'shy');
    W.list().push({ id: m.id, kind: 'maid', city: m.city, house: true, aboard: false, wed: S().day });
    var st = S().maids[m.id]; if (st) st.aff = 100;
    wedLog(m.name);
    if (G.FamEv) { try { await G.FamEv.wedding({ id: m.id, second: true, city: c.id }); } catch (e) { console.error(e); } }   // 술집의 혼례 잔치
    await UI.alert(m.name + U.jx(m.name, '과/와') + ' 혼인했다! ' + c.name + '에 「' + m.name + '의 집」이 생겼다. 도시 메뉴에서 찾아갈 수 있다.', '둘째 부인');
    if (G.Game.cityHud) G.Game.cityHud();
    return true;
  };
  /** 부하에게 청혼 (본처가 있을 때): 고향으로 데려다주거나 함께 항해한다. true = 결혼함 */
  W.proposeMate = async function (d, m, say) {
    var p = P(), home = metCity(m), hc = G.CITY_DATA[home];
    var ok = await UI.confirm(d.name + '에게 청혼하겠습니까?<br><small>고향에 본처(' + U.esc(Fm().wifeName()) + ')가 있으니 ' + d.name + U.jx(d.name, '은/는') + ' <b>둘째 부인</b>이 됩니다. 처음 만난 고장 ' + hc.name + '에 집을 마련해 데려다주거나, 부하로 남아 함께 항해할 수 있습니다.</small>', '청혼한다', '그만둔다');
    if (!ok) return false;
    R.removeItem('ring');
    await say(d.witch ? '…둘째라도 상관없어요. 마녀는 원래 남의 눈 밖에서 사니까요.' : '…고향에 부인이 계신 건 알아요. 그래도 당신 곁에 있을래요.', 'shy');
    var w = { id: d.id, kind: 'mate', city: home, house: false, aboard: true, wed: S().day };
    W.list().push(w);
    S().flags['gone_' + d.id] = 1;            // 이제 술집에 나타나지 않는다
    S().flags['wed_' + d.id] = 1;
    wedLog(d.name);
    if (G.FamEv) { try { await G.FamEv.wedding({ id: d.id, second: true }); } catch (e) { console.error(e); } }   // 갑판 위의 혼례
    if (p.wifeAboard) {
      // 본처가 배에 있으니 둘째 부인은 배에 남을 수 없다 — 혼자 고장으로 떠난다
      settle(w, true);
      await UI.alert(d.name + U.jx(d.name, '과/와') + ' 혼인했다. 하지만 배에는 본처가 타고 있어 ' + d.name + U.jx(d.name, '은/는') + ' 혼자 ' + hc.name + '로 떠났다. 그곳에 「' + d.name + '의 집」이 생겼다.', '둘째 부인');
      return true;
    }
    var v = await UI.ask('앞으로 어떻게 할까?', [
      { label: hc.name + '에 집을 마련해 데려다준다', value: 'home' },
      { label: '부하로 남아 함께 항해한다', value: 'sail' }], duo(w, 'warm'));
    if (v === 'home') {
      w.deliver = true;
      if (S().loc.mode === 'city' && S().loc.city === home) { settle(w, false); await UI.alert(hc.name + '에 「' + d.name + '의 집」이 생겼다. ' + d.name + U.jx(d.name, '은/는') + ' 배에서 내려 그 집에서 산다.', '둘째 부인'); }
      else await UI.alert(d.name + U.jx(d.name, '과/와') + ' 혼인했다! ' + hc.name + '에 들어가면 그곳에 집을 마련하고 배에서 내린다. 그때까지는 부하로 함께 간다.', '둘째 부인');
    } else await UI.alert(d.name + U.jx(d.name, '과/와') + ' 혼인했다! 부하로 남아 함께 항해한다.<br><small class="muted">본국 항구에서는 남의 눈을 피해 숨기도 해서, 그동안은 특기를 쓸 수 없다. 처음 만난 ' + hc.name + '에 가면 집을 마련할 수 있다.</small>', '둘째 부인');
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
    var mine = W.kidsOf(w).filter(function (k) { return Fm().kidAge(k) < 3; });
    if (w.preg && w.preg.told) { await UI.say('아기가 곧 태어나요. 지금은 배에 탈 수 없어요.', duo(w)); return; }
    if (mine.length) { await UI.say('아기가 아직 어려서 두고 갈 수 없어요. 조금 더 크면 함께 갈게요.', duo(w)); return; }
    var ok = await UI.confirm(W.name(w) + U.jx(W.name(w), '을/를') + ' 다시 배에 태워 부하로 함께 항해할까요?', '함께 간다', '그만둔다');
    if (!ok) return;
    w.aboard = true; w.house = true;          // 집은 그대로 남는다 (데려다주면 다시 산다)
    if (!mateRow(w.id)) S().mates.push({ id: w.id, role: 'none', joined: U.dateNum(S().date), loyal: 90, from: w.city });
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
    W.list().forEach(function (w) {
      var pr = w.preg; if (!pr) return;
      var here = there(w), nm = W.name(w);
      if (!pr.told && s.day - pr.since >= 75 && !here) { pr.told = true; out.push({ icon: 'heart', text: W.cityName(w) + '의 ' + nm + '에게서 편지가 왔다. 「당신, 아기가 생겼어요. 이 도시에서 기다릴게요.」' }); }
      if (s.day < pr.due) return;
      var twins = U.chance(fc.twins || 0.03) && W.kidTotal() < W.maxKids(), born = [];
      for (var t = 0; t < (twins ? 2 : 1); t++) {
        var k = { name: '', unnamed: true, sex: U.pick(['m', 'f']), born: { y: s.date.y, m: s.date.m, d: s.date.d }, sk: {}, lg: {}, st: inborn(w), edu: {}, mother: w.id, house: w.city };
        k.witness = here; k.bond = here ? (fc.bondBorn || 60) : (fc.bondMissed || 40);
        P().kids.push(k); born.push(k);
      }
      w.preg = null; w.lastBirth = s.day;
      out.push({ icon: 'heart', text: W.cityName(w) + '의 ' + nm + '에게서 ' + (twins ? '쌍둥이가' : born[0].sex === 'f' ? '딸이' : '아들이') + ' 태어났다! 그 집에 들러 이름을 지어 주자.' });
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
    if (!w.preg && !tooOld && W.kidTotal() < W.maxKids() && (w.lastBirth == null || s.day - w.lastBirth >= (fc.gapDays || 300)) && (w.tryDay == null || s.day - w.tryDay >= (rest ? 3 : 20))) {
      w.tryDay = s.day;
      if (U.chance((cfg().conceive || 0.3) * (rest ? 1.2 : 1))) w.preg = { since: s.day, due: s.day + (fc.gestation || 266), told: false };
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
    return '둘째 부인' + (kids.length ? ' · 아이 ' + kids.length : '') + (w.preg && w.preg.told ? ' · 아기를 기다리는 중' : '');
  };
  H2.enter = async function (c, id) {
    var w = W.of(id); if (!w) return false;
    await UI.say(U.pick(['어서 와요, 당신! 오늘은 우리 집에서 쉬어요.', '당신 배가 보였어요. 기다리고 있었어요.', '오셨군요. 따뜻한 수프를 데울게요.']), duo(w, 'happy'));
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
    var list = [{ who: 'wife', name: W.name(w), sub: babies.length ? babies.map(function (k) { return Fm().kidName(k); }).join('·') + ' 안고 있다' : (w.preg && w.preg.told ? '아기를 기다리는 중' : '둘째 부인'), chain: sp.half || [], portrait: sp.portrait, scale: 1, onClick: function () { return W.talk(w); } }];
    W.kidsOf(w).filter(function (k) { return !k.unnamed && Fm().kidAge(k) >= 3; }).sort(function (a, b) { return Fm().kidAge(a) - Fm().kidAge(b); }).forEach(function (k) {
      list.push({ who: 'kid', k: k, name: k.name, sub: Fm().kidAge(k) + '세 ' + Fm().bondHearts(k), chain: HL.chain(k, true), portrait: Fm().kidSpec(k), scale: ((G.FAMILY_LOOK || {}).scale || {})[HL.stage(k)] || 1 });
    });
    return HL.familyPanel(list);
  };
  H2.preload = function (c, id) { var w = W.of(id); if (!w) return null; var sp = W.speaker(w); return sp.half && sp.half.length ? [sp.half] : null; };

  // ---------------------------------------------------------------- 수첩
  W.infoWife = function () {
    var p = P(), list = W.list();
    var h = p.wifeAboard ? ' <small class="muted">(배에 함께)</small>' : '';
    if (list.length) h += '<br><small>둘째 부인: ' + list.map(function (w) { return U.esc(W.name(w)) + ' <span class="muted">(' + (w.aboard ? '배에 함께' + (w.deliver ? ' · ' + W.cityName(w) + '로 가는 중' : '') : W.cityName(w) + '의 집') + (w.preg && w.preg.told ? ' · 아기를 가짐' : '') + ')</span>'; }).join(', ') + '</small>';
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
