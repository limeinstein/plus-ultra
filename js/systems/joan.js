/* 오를레앙의 처녀 잔 — 화형대 앞의 일기토 (G.Joan) 2026-10-21 사용자 요청. 사람은 js/data/joan.js
   ■ 조건: 기함에 예배실(기도실)이 있고 그 방이 비어 있다 · 프랑스 도시 근처 숲(G.Tale.frenchForest)에서 야영하며 「약초를 캔다」로 약초를 찾았다
   ■ 흐름: 약초를 캐다 숲 가장자리 마을에서 연기와 고함 — 사람들이 「마녀를 태워라!」 하며 묶인 처녀를 화형대로 끌고 간다.
          제독이 직접(또는 검술이 가장 높은 부하가) 무리의 우두머리 「마녀 사냥꾼」과 일기토 — 이기면 무리가 흩어지고 그녀가 풀려난다.
          「손만 묶여 있지 않았어도 내가 이길 수 있었어」 하며 츤데레 기운을 내뿜다가, 비어 있는 예배실 이야기를 듣고 따라온다 (무급 · 빈 예배실에 든다).
   · 못 본 척하거나 지면: 그녀는 끌려간다 — coolDays일 뒤 같은 조건이면 다시 (화형은 「주교의 판결이 날 때까지」 미뤄진다)
   · 장면 그림 (없으면 건너뜀): images/legend-events/joan_of_arc_stake.webp · joan_of_arc_rescue.webp
   · 저장: s.joan = { met: 만난 수, cool: 다시 만날 수 있는 날번호, done: 합류한 날번호 }
   조정값: G.BALANCE.joan */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var JN = G.Joan = {};
  var ID = 'joan_of_arc';
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.joan) || {}; }
  function st() { var s = S(); return s.joan || (s.joan = {}); }
  JN.state = st;
  function row() { return S().mates.filter(function (x) { return x.id === ID; })[0] || null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function joan(emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(ID, emo) : { name: '잔', portrait: G.Art.mateSpec(ID), lang: 3 }; }
  function first() { return G.Scenes.mateSpeaker('first'); }
  function narrate(t) { return UI.say(t, {}); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }

  // ---------------------------------------------------------------- 조건
  /** 기함의 빈 예배실(기도실) 자리 번호 — 없거나 사람이 있으면 -1 */
  JN.emptyChapel = function () {
    var CB = G.Cabins; if (!CB || !CB.rooms) return -1;
    var rooms = CB.rooms();
    for (var i = 0; i < rooms.length; i++) if (rooms[i] === 'chapel' && !CB.occupant(i)) return i;
    return -1;
  };
  /** 기함에 예배실이 있기는 한가 (부관의 귀띔용) */
  JN.hasChapel = function () { var CB = G.Cabins; return !!(CB && CB.rooms && CB.rooms().indexOf('chapel') >= 0); };
  /** 아직 이 일이 일어날 수 있는가 */
  JN.ready = function () {
    var s = S(); if (!s || !G.MATE[ID] || row() || s.flags['gone_' + ID]) return false;
    var j = st(); if (j.done) return false;
    if (G.Wives && G.Wives.list && G.Wives.list().some(function (w) { return w.id === ID; })) return false;
    return !(j.cool > s.day);
  };
  /** 프랑스 도시 근처 숲인가 (옛이야기의 아가씨들과 같은 숲 — js/systems/fairytales.js) */
  JN.forest = function (lon, lat) { return !!(G.Tale && G.Tale.frenchForest && G.Tale.frenchForest(lon, lat)); };

  // ---------------------------------------------------------------- 야영을 마친 뒤 (js/scenes/land.js — v: 한 일 · found: 약초를 찾았나)
  JN.onCamp = async function (v, lon, lat, found) {
    var s = S();
    if (v !== 'herb' || !found || !s || s.loc.mode !== 'land' || !JN.ready() || !JN.forest(lon, lat)) return false;
    if (JN.emptyChapel() < 0) {
      // 예배실이 없거나 사람이 있다 — 한 번만 소문으로 (비어 있어야 그녀가 마음을 연다)
      if (!s.flags.joanRumor) { s.flags.joanRumor = 1; UI.toast('숲 너머 마을에서 「마녀를 태워라」 하는 고함이 바람에 실려 왔다 — 사람들은 이내 흩어졌다.', 'pray', 5200); }
      return false;
    }
    return stake();
  };

  async function stake() {
    var s = S(), j = st(), pc = null;
    j.met = (j.met || 0) + 1;
    var leader = { name: '마녀 사냥꾼 고셰', portrait: G.Art.withImg(G.Art.npcSpec('joan_hunter', 'soldier', 'ne', 'm'), ['portraits/npc-roles/ne/soldier']), look: 'brawler',
      str: 82, atk: 13, def: 6, skill: 2, mar: 78, int: 46, cha: 30, style: 'bash' };
    var ldr = { name: leader.name, portrait: leader.portrait };
    try {
      await narrate('약초 바구니를 채우던 손이 멈췄다. 숲 가장자리 마을 쪽에서 매캐한 연기와 함께 고함이 몰려온다. 「마녀를 태워라! 마녀를 태워라!」');
      pc = pic('joan_of_arc_stake', '화형대');
      await narrate('광장 한가운데 장작을 높이 쌓은 화형대. 사람들이 밧줄에 묶인 처녀 하나를 끌고 간다. 짧게 자른 머리, 찢긴 남자 옷, 맨발. 그런데도 그녀는 고개를 꼿꼿이 들고 있다.');
      await UI.say('나는 마녀가 아니오! 하늘의 목소리를 들었을 뿐이오. 왕을 랭스에 세우고 오를레앙을 구한 것이 마녀의 짓이란 말이오?', joan());
      await UI.say('들었소? 하늘의 목소리란다! 사내 옷을 입고 칼을 휘두르는 계집이 마녀가 아니면 뭐란 말이냐! 불을 가져와라!', ldr);
      if (pc) { await pc.stop(); pc = null; }
      await UI.say('제독, 저 처녀는 마녀가 아닙니다. 눈빛을 보십시오 — 저건 싸움터의 눈입니다. …우리 배의 예배실이 비어 있는 게 어쩐지 이 때문이었나 봅니다.', first());
      var sw = R.skillBest('sword'), mates = s.mates, px = sw.who ? mates.filter(function (m) { return G.MATE[m.id].name === sw.who; })[0] : null;
      var v = await UI.ask('「마녀 사냥꾼」 고셰가 횃불을 내던지고 도리깨를 집어 들었다. 어떻게 할까?', [
        { label: '제독이 직접 맞선다', value: 1 },
        { label: px ? sw.who + '에게 맡긴다 (검술 ' + sw.lv + ')' : '맡길 검객이 없다', value: 2, dis: !px },
        { label: '못 본 척 숲으로 돌아간다', value: 0 }], Object.assign(me(), { cancel: false }));
      if (!v) {
        await narrate('발길을 돌리는 등 뒤로 고함이 멀어진다. …다행히 「주교의 판결이 날 때까지」 불은 붙이지 않는다는 소리가 들렸다. 그녀는 마을 감옥으로 끌려갔다.');
        j.cool = s.day + (K().coolDays || 30);
        G.State.log('프랑스의 숲 가장자리 마을에서 마녀로 몰린 처녀를 보고도 지나쳤다.');
        return false;
      }
      await UI.say('뱃사람이 끼어들 일이 아니다! 마녀 편을 드는 놈도 함께 태워 주마!', ldr);
      var res = await G.Games.duel(leader, v === 2 && px ? { mate: px, place: 'land' } : { place: 'land' });
      if (res !== 'win') {
        await narrate('도리깨가 어깨를 내리쳤다. 무리에게 밀려나는 사이, 그녀는 마을 감옥으로 끌려갔다. 「주교의 판결이 날 때까지」 불은 붙이지 않는다고 한다 — 아직 늦지 않았다.');
        j.cool = s.day + (K().coolDays || 30);
        G.State.log('프랑스의 숲 가장자리 마을에서 마녀로 몰린 처녀를 구하려다 실패했다.');
        UI.toast('다시 프랑스의 숲에서 야영하며 약초를 찾으면 기회가 온다 (' + (K().coolDays || 30) + '일 뒤)', 'pray', 5200);
        return false;
      }
      pc = pic('joan_of_arc_rescue', '불 꺼진 화형대');
      await narrate('우두머리가 무릎을 꿇자 무리가 하나둘 횃불을 떨어뜨리고 흩어진다. 밧줄을 끊어 주자, 그녀는 손목을 털며 화형대에서 훌쩍 뛰어내렸다.');
      G.Fame.add('bt', 3);
      await UI.say('…흥. 손만 묶여 있지 않았어도 저런 촌뜨기쯤은 내가 이길 수 있었어. 칼 한 자루만 있었으면 셋은 쓰러뜨렸을걸.', joan('angry'));
      await UI.say('그, 그러니까 구해 줬다고 해서 고맙다고 할 줄 알았다면 오산이야. …오산이라고!\f…그래도 불은 뜨거웠을 테니까. 그건 인정해.', joan());
      await UI.say('저희 배에는 비어 있는 예배실이 하나 있습니다. 하늘의 목소리를 듣기에는 바다 한가운데만큼 조용한 곳도 없지요.', first());
      await UI.say('예배실이… 비어 있다고? …하느님은 늘 이런 식으로 말씀하시지.\f착각하지 마. 당신을 따라가는 게 아니라 그 예배실을 지키러 가는 거야. 다들 칼 쓰는 법이 엉망일 테니 가르쳐 줄 사람도 필요할 거고.', joan());
      if (!(await UI.ask('오를레앙의 처녀 잔이 항해사로 함께 가겠다고 한다. (' + G.wageNote('joan_of_arc') + ')', [{ label: '배에 태운다', value: 1 }, { label: '안전한 곳까지만 데려다준다', value: 0 }], me()))) {
        await UI.say('…그래, 마음대로 해. 어차피 나 혼자서도 잘해. 정말이야.', joan());
        j.cool = s.day + (K().coolDays || 30) * 2;
        return false;
      }
      var nm = G.Legend && G.Legend.join ? G.Legend.join(ID, null) : null;
      if (!nm) return false;
      j.done = s.day;
      // 비어 있던 예배실에 든다 — 빈 항해사·측량사 자리를 먼저 받았어도 예배실로 (부관 자리를 받았으면 그대로)
      var ci = JN.emptyChapel();
      if (ci >= 0 && nm.role !== 'first' && G.Cabins && G.Cabins.place) G.Cabins.place(nm, ci);
      G.State.log('프랑스의 숲 가장자리 마을에서 마녀로 몰린 오를레앙의 처녀 잔을 화형대에서 구했다. 잔이 동료가 되었다.');
      UI.toast('오를레앙의 처녀 잔 — 항해사 (' + G.wageNote('joan_of_arc') + ')' + (nm.roomType === 'chapel' ? ' · 예배실' : ''), 'heart', 4600);
      if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(ID); } catch (e) { console.error(e); } }
      await UI.say('…잘 부탁한다는 말은 안 할 거야. 대신 내 깃발 아래에서 지는 일은 없을 거야. 그건 약속하지.', joan('happy'));
      return true;
    } finally { if (pc) await pc.stop(); }
  };

  // ---------------------------------------------------------------- 프랑스 도시 술집 주인의 귀띔 (한 번)
  JN.tavernHint = async function (c) {
    var s = S(); if (!c || s.flags.joanHint || !JN.ready()) return;
    var o = R.cityOwner ? R.cityOwner(c) : c.nation; if (o !== '프랑스') return;
    s.flags.joanHint = 1;
    var CC = G.Scenes.city, sp = { name: '술집 주인' };
    try { if (CC && CC.npc && CC.current && CC.current()) sp = CC.npc('tavernkeeper', '술집 주인'); } catch (e) { /* 도시 밖 */ }
    await UI.say('요즘 숲 가장자리 마을마다 마녀 사냥이 한창이라네. 갑옷 입고 군대 앞에 섰다는 처녀를 마녀라며 끌고 다닌다지.\f숲에서 약초라도 캐다 보면 그 고함을 듣게 될 걸세. …배에 예배실 하나 비워 두고 다니는 신앙 깊은 뱃사람이라면 그냥 지나치진 못하겠지.', sp);
  };
  JN.install = function () {
    var CC = G.Scenes && G.Scenes.city, B = CC && CC.B; if (!B || !B.tavern || JN._inst) return;
    JN._inst = true;
    var f = B.tavern.enter;
    if (typeof f !== 'function') return;
    B.tavern.enter = async function (c) {
      var r = await f.apply(this, arguments);
      try { if (r !== false && CC.current && CC.current() && CC.current().kind === 'tavern') await JN.tavernHint(c); } catch (e) { console.error(e); }
      return r;
    };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) B.tavern.enter[k] = f[k];
  };
  JN.install();
})(window.G = window.G || {});
