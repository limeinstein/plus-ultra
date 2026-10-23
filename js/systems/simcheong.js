/* 공양미 삼백 석 — 심청 (G.Sim) · 사람은 js/data/simcheong.js. 2026-10-19 사용자 요청
   ■ 조건: 쌀(rice)을 교역품으로 300 이상 싣고 조선의 항구(한양·동래·한산도)에 들어선다
   ■ 이야기: 포구에 「인당수 제물로 바칠 처녀를 쌀 삼백 석에 산다」는 남경 뱃사람들의 방. 앞 못 보는 아버지의 눈을 뜨게 하려고
     몽운사에 공양미 삼백 석을 바치기로 한 심청이 그 쌀을 받고 제 몸을 팔았다. 오늘이 배에 오르는 날 — 심 봉사가 「청아!」 하고 울부짖는다.
     · 짐칸의 쌀 300을 뱃사람들에게 도로 내주고 약조를 푼다 → 딸의 목소리를 들은 심 봉사가 눈을 번쩍 뜬다. 심청이 은혜를 갚겠다며 품삯 없이 합류
     · 지나치면 그녀는 뱃사람들의 배에 오른다 — coolDays 뒤 다시 쌀 300을 싣고 오면, 인당수에서 용왕이 연꽃에 태워 돌려보낸 그녀를 포구에서 만난다
   · 저장: s.sim = { met, done, cool, lotus }   · 도시에 들어설 때 G.Sim.pending()/check() (js/scenes/city.js) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var SM = G.Sim = {};
  var ID = 'simcheong', NEED = 300;
  SM.K = { coolDays: 90, fame: 150 };
  var PORTS = [190, 226, 229];   // 한양 · 동래 · 한산도
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.sim || (s.sim = {}); }
  function row(id) { return S().mates.filter(function (x) { return x.id === id; })[0] || null; }
  function rice() { var c = (S().fleet && S().fleet.cargo) || {}; return c.rice ? c.rice.q || 0 : 0; }
  function takeRice(n) { var c = S().fleet.cargo; if (!c.rice || c.rice.q < n) return false; c.rice.q -= n; if (c.rice.q <= 0) delete c.rice; return true; }
  function who(id, emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id, emo) : { name: G.MATE[id].name, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  var DAD = { name: '심 봉사', lang: 3 }, BOSS = { name: '남경 뱃사람 두목', lang: 3 };
  function art(role, style, seed) { try { return G.Art.withImg(G.Art.npcSpec(seed, role, style, 'm'), ['portraits/npc-roles/' + style + '/' + role]); } catch (e) { return null; } }
  function say(k, text, emo) {
    if (k === 'P') return UI.say(text, me());
    if (k === 'D') { if (!DAD.portrait) DAD.portrait = art('priest', 'kr', 'sim_dad'); return UI.say(text, DAD); }
    if (k === 'B') { if (!BOSS.portrait) BOSS.portrait = art('sailor', 'cn', 'sim_boss'); return UI.say(text, BOSS); }
    if (k === 'M') return UI.say(text, G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {});
    if (k) return UI.say(text, who(k, emo));
    return UI.say(text, {});
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) await say(lines[i][0], lines[i][1], lines[i][2]); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }

  SM.ready = function () {
    var s = S(), q = st();
    if (q.done || row(ID) || s.flags['gone_' + ID]) return false;
    return !(q.cool && s.day < q.cool);
  };
  SM.pending = function () { var s = S(); return !!(s && PORTS.indexOf(cityNow()) >= 0 && rice() >= NEED && SM.ready()); };
  SM.check = async function () {
    if (SM._busy) return false; SM._busy = true;
    try { if (SM.pending()) { if (st().lotus) await lotus(); else await meet(); } } catch (e) { console.error(e); }
    SM._busy = false;
    return true;
  };

  // ================================================================ 포구에서 — 인당수 제물
  async function meet() {
    var q = st(), c = G.CITY_DATA[cityNow()], pc = pic('simcheong_harbor', '인당수 제물');
    q.met = (q.met || 0) + 1;
    try {
      await play([
        [null, c.name + ' 포구. 돛대 셋 달린 큰 당선 앞에 사람들이 웅성거린다. 기둥에 붙은 방에는 「인당수 용왕께 바칠 처녀를 쌀 삼백 석에 산다 — 남경 뱃사람」이라 적혀 있다.'],
        [null, '흰 소복을 입은 열다섯 남짓한 처녀가 뱃사람들 사이로 걸어 나온다. 그 뒤를 지팡이를 더듬으며 앞 못 보는 늙은이가 비틀비틀 쫓아온다.'],
        ['D', '청아! 청아, 이게 무슨 소리냐! 내 눈 뜨자고 네가 죽으러 간단 말이냐! 눈을 뜬들 너를 못 보면 무엇에 쓰겠느냐!'],
        [ID, '아버지… 몽운사 스님께서 공양미 삼백 석을 부처님께 바치면 아버지 눈이 뜨인다 하셨어요. 우리 집에 쌀 삼백 석이 어디 있겠어요. 이 뱃사람들이 그 쌀을 절에 바쳐 주셨으니, 저는 약조대로 가야 해요.'],
        ['B', '처녀, 물때가 다 됐소. 인당수 물귀신이 성나면 배가 통째로 가라앉으니 우리도 어쩔 수 없소. 쌀 삼백 석을 받았으면 배에 오르시오.'],
        ['M', '제독… 우리 짐칸에 쌀이 ' + U.num(rice()) + ' 실려 있습니다. 꼭 삼백 석이 넘습니다.']
      ]);
      var v = await UI.ask('짐칸의 쌀 300을 남경 뱃사람들에게 내주고 처녀의 약조를 풀어 줄까? (쌀 ' + U.num(rice()) + ' 실음)', [
        { label: '쌀 300을 내주고 약조를 푼다', value: 1 }, { label: '남의 나라 일이다 — 지나친다', value: 0 }], me());
      if (!v || !takeRice(NEED)) {
        await play([
          [ID, '…괜찮아요. 아버지 눈만 뜨이시면 돼요. 아버지, 부디 진지 거르지 마세요.'],
          [null, '처녀는 아버지의 손을 놓고 당선에 오른다. 돛이 오르고, 배는 서쪽 바다 인당수 쪽으로 멀어져 간다. 포구에 심 봉사의 울음소리만 남았다.']
        ]);
        q.cool = S().day + SM.K.coolDays; q.lotus = 1;   // 인당수에 몸을 던진 그녀를 용왕이 연꽃에 태워 돌려보낸다 — 다음에 쌀을 싣고 오면
        G.State.log(c.name + ' 포구에서 인당수 제물로 팔려 가는 처녀 심청을 보았다.');
        return;
      }
      await play([
        [null, '선원들이 쌀가마를 줄지어 내린다. 삼백 석이 당선 앞에 산처럼 쌓였다.'],
        ['B', '…허, 이런 일은 처음이오. 쌀 삼백 석을 도로 받으면 약조는 없던 일이지. 인당수는 우리가 알아서 비켜 가겠소. 처녀, 좋은 사람을 만났구려.'],
        [ID, '어찌… 어찌 이런 은혜를… 생전 처음 보는 분이신데.'],
        ['P', '쌀이야 다시 사면 그만이오. 아버지 곁에 있으시오.'],
        [null, '처녀가 아버지에게 달려가 목을 끌어안는다.'],
        [ID, '아버지! 저 안 가요! 이제 안 가도 돼요!'],
        ['D', '청아… 우리 청이 목소리로구나. 어디, 어디 우리 딸 얼굴 좀 보자. 내 평생 한 번만이라도 보자!'],
        [null, '심 봉사가 두 눈을 비비며 딸의 얼굴을 더듬는 순간— 감겨 있던 눈꺼풀이 파르르 떨리더니 번쩍 뜨인다. 몽운사 부처님께 바친 공양미가 이제야 닿은 것일까. 포구 사람들이 일제히 탄성을 지른다.'],
        ['D', '보인다… 보인다! 청아, 네가 이렇게 곱게 컸구나! 아이고 내 딸아!'],
        [ID, '아버지…!', 'happy']
      ]);
      await join(c);
    } finally { await pc.stop(); }
  }

  // ================================================================ 연꽃 — 인당수에서 돌아온 심청 (지나친 뒤 다시 쌀을 싣고 오면)
  async function lotus() {
    var c = G.CITY_DATA[cityNow()], pc = pic('simcheong_lotus', '인당수의 연꽃');
    try {
      await play([
        [null, c.name + ' 포구에 이상한 소문이 돈다. 서쪽 인당수 바다에서 집채만 한 연꽃 한 송이가 떠내려와 이 포구에 닿았는데, 그 꽃잎 속에서 처녀 하나가 걸어 나왔다는 것이다.'],
        [ID, '…저를 기억하시나요? 그날 이 포구에서 저를 바라보시던 분이죠. 인당수에 몸을 던졌는데, 용왕님께서 효심이 갸륵하다며 연꽃에 태워 돌려보내 주셨어요.'],
        [ID, '그런데 아버지 눈은… 아직 그대로세요. 몽운사에 바친 쌀은 뱃사람들 것이었다며, 스님께서 공양이 온전치 않다 하셨대요. 짐칸에 쌀을 많이 싣고 계시네요. 혹시…'],
      ]);
      var v = await UI.ask('짐칸의 쌀 300을 심청의 이름으로 몽운사에 공양미로 바칠까? (쌀 ' + U.num(rice()) + ' 실음)', [
        { label: '쌀 300을 공양미로 바친다', value: 1 }, { label: '지금은 안 된다', value: 0 }], me());
      if (!v || !takeRice(NEED)) {
        await say(ID, '…네. 언젠가 제 손으로 꼭 모아 볼게요.');
        st().cool = S().day + 30;
        return;
      }
      await play([
        [null, '쌀 삼백 석이 몽운사로 올라간 이튿날, 심청이 아버지 손을 잡고 포구로 내려온다. 심 봉사가 딸의 얼굴을 더듬다가 — 눈을 번쩍 뜬다.'],
        ['D', '보인다! 청아, 네 얼굴이 보인다! 연꽃에서 나왔다더니 정말 선녀 같구나!'],
        [ID, '아버지…!', 'happy']
      ]);
      await join(c);
    } finally { await pc.stop(); }
  }

  async function join(c) {
    var q = st();
    await play([
      [ID, '제독님. 저는 이 은혜를 갚을 길이 없어요. 가진 것이라곤 바느질하던 손과, 장터에서 부르던 노래와, 포구에서 배운 물때 읽는 눈뿐이에요.'],
      [ID, '품삯은 뱃사람들 받는 만큼만 주시면 돼요. 저를 배에 태워 주세요. 부엌일이든 장부든 돛줄이든 무엇이든 하겠어요. 인당수 너머 바다 끝에 무엇이 있는지, 이제는 살아서 보고 싶어요.'],
      ['D', '청아, 가거라. 눈을 떴으니 이 아비는 이제 혼자서도 살 수 있다. 은인을 따라가 큰 바다를 보고, 이 아비에게 이야기해 다오.']
    ]);
    var v = await UI.ask('심청이 항해사로 함께 가겠다고 한다. (' + G.wageNote(ID) + ')', [{ label: '배에 태운다', value: 1 }, { label: '아버지 곁에 남게 한다', value: 0 }], me());
    var so = G.Fame.add('so', SM.K.fame);
    q.done = U.dateNum(S().date);
    if (!v) {
      await say(ID, '…네. 그럼 아버지 곁에서 이 은혜를 날마다 빌게요. 언제든 이 포구에 오시면 밥 한 끼는 꼭 지어 올릴게요.', 'happy');
      q.stay = 1;
      G.State.log('공양미 삼백 석 — 심청의 약조를 풀어 주었다. 심 봉사가 눈을 떴다. (사교 명성 +' + so + ')');
      return;
    }
    if (G.Legend && G.Legend.join) G.Legend.join(ID, c);
    G.State.log('공양미 삼백 석 — 심 봉사가 눈을 떴다. 심청이 항해사로 함께한다. (사교 명성 +' + so + ')');
    UI.toast('심청 — 항해사 (' + G.wageNote(ID) + ' · 요리·음악·세공·항해·운용·웅변·회계 3단계)', 'heart', 5600);
    await say(ID, '이제 이 배가 제 집이에요. 오늘 저녁은 제가 지을게요 — 쌀은… 조금 남았죠?', 'happy');
    if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(ID); } catch (e) { console.error(e); } }
  }
})(window.G = window.G || {});
