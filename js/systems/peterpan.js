/* 피터 팬 — 섬이 데려간 아이 (G.Peter) 2026-10-20 사용자 요청. 사람은 js/data/peterpan.js
   ■ 언제: 견습으로 배에 태운 자녀(아들·딸, 어른이 되기 전 — G.BALANCE.family.adult살 아래)를 데리고 스코틀랜드의 작은 섬에 상륙하면
          (외헤브리디스·스카이·멀·콜·티리·아일레이·주라·오크니·셰틀랜드 — ISLES)
   ■ 흐름: ① 상륙한 날 아이가 섬에 「어른이 되지 않는 아이」가 산다는 이야기를 꺼내고, 해 질 녘 혼자 돌아다니다 온 아이의 옷에서 낯선 약초 냄새가 난다.
            그날 밤 아이가 사라졌다 — 「피터를 찾으러 가요」. 부관이 그 냄새가 이 섬 산비탈의 약초라며, 야영하며 약초를 캐 보자고 한다.
          ② 같은 섬에서 야영하며 「약초를 캔다」를 하면 (캐는 데 실패해도) 수탉 우는 소리와 함께 소년이 아이 손을 잡고 바람을 타고 내려온다.
            약초 냄새를 따라 아이를 찾아온 어른은 처음 본다며 아이를 돌려주고, 「이 섬을 나갈 수만 있다면 어디든 좋다」며 따라와 부하가 된다.
   · 아이가 없는 동안: 견습 목록(G.Family.aboard)에서 빠지고, 배우거나 사이가 변하지 않으며, 뒤를 이을 수 없다(G.Family.heirs). 자택에서는 아내가 걱정한다.
     섬을 떠나도 아이는 그 섬에 남는다 — 다시 상륙하면 부관이 귀띔한다. 에든버러 술집 주인이 옛말로 한 번 귀띔한다.
   · 장면 그림 (없으면 건너뜀): images/legend-events/peter_pan_vanish.webp · peter_pan_return.webp — 프롬프트 images/legend-events/PETER_PAN_PROMPT.md
   · 저장: s.peter = { phase: 'lost'|'done', kid: p.kids 번호, isle: ISLES 열쇠, since: 날번호, back: 날번호 } · 아이에게 k.lost = 'peter' */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var PP = G.Peter = {};
  var ID = 'peter_pan';
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.peter || (s.peter = {}); }
  PP.state = st;
  function F() { return G.Family; }
  function row() { return S().mates.filter(function (x) { return x.id === ID; })[0] || null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function peter(emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(ID, emo) : { name: '피터 팬', portrait: G.Art.mateSpec(ID), lang: 3 }; }
  function kidSp(k) { return G.HomeLife && G.HomeLife.speaker ? G.HomeLife.speaker(k) : { name: k.name, portrait: F().kidSpec(k), lang: 3 }; }
  function first() { return G.Scenes.mateSpeaker('first'); }
  function narrate(t) { return UI.say(t, {}); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  function sonDau(k) { return k.sex === 'f' ? '딸' : '아들'; }

  // ---------------------------------------------------------------- 스코틀랜드의 작은 섬들 [서경, 동경, 남위, 북위] (게임 지도의 뭍 칸에 맞춰 본토는 빠지게)
  var ISLES = {
    hebrides: { name: '외헤브리디스 제도', box: [-7.8, -6.1, 56.75, 58.6] },
    skye: { name: '스카이 섬', box: [-6.85, -5.95, 57.0, 57.75] },
    mull: { name: '멀 섬', box: [-6.45, -5.7, 56.2, 56.56] },
    coll: { name: '콜·티리 섬', box: [-7.0, -6.35, 56.45, 56.75] },
    islay: { name: '아일레이·주라 섬', box: [-6.6, -5.75, 55.55, 56.1] },
    orkney: { name: '오크니 제도', box: [-3.5, -2.3, 58.68, 59.45] },
    shetland: { name: '셰틀랜드 제도', box: [-1.9, -0.6, 59.8, 60.95] }
  };
  PP.ISLES = ISLES;
  /** 이 자리가 스코틀랜드의 작은 섬인가 — 섬 열쇠, 아니면 null */
  PP.isle = function (lon, lat) {
    for (var k in ISLES) { var b = ISLES[k].box; if (lon >= b[0] && lon <= b[1] && lat >= b[2] && lat <= b[3]) return k; }
    return null;
  };

  // ---------------------------------------------------------------- 조건
  /** 데려갈 아이: 견습으로 배에 탄, 어른이 되기 전의 자녀 (여럿이면 가장 어린 아이) */
  PP.kid = function () {
    var s = S(); if (!s || !F()) return null;
    var ad = ((G.BALANCE && G.BALANCE.family) || {}).adult || 16;
    var list = (s.player.kids || []).filter(function (k) { return k.aboard && !k.lost && !k.unnamed && !k.married && F().kidAge(k) < ad; });
    list.sort(function (a, b) { return F().kidAge(a) - F().kidAge(b); });
    return list[0] || null;
  };
  /** 아직 이 일이 일어날 수 있는가 */
  PP.ready = function () {
    var s = S(); if (!s || !G.MATE[ID]) return false;
    var p = st();
    return !p.phase && !row() && !s.flags['gone_' + ID];
  };
  /** 섬에 남은 아이 (없으면 null) */
  PP.lostKid = function () {
    var s = S(), p = st(); if (p.phase !== 'lost') return null;
    return (s.player.kids || [])[p.kid] || null;
  };

  // ---------------------------------------------------------------- ① 상륙: 아이가 사라진다
  /** 바다에서 상륙했을 때 (js/scenes/land.js) */
  PP.onLanding = async function (lon, lat) {
    var s = S(); if (!s || s.loc.mode !== 'land') return false;
    var isle = PP.isle(lon, lat); if (!isle) return false;
    var p = st();
    if (p.phase === 'lost') {                                 // 아이를 찾으러 다시 왔다
      var lk = PP.lostKid(); if (!lk) return false;
      if (p.isle === isle) await UI.say(lk.name + U.jx(lk.name, '은/는') + ' 이 섬 어딘가에 있습니다. 그 아이 옷에서 나던 약초 냄새를 잊지 마십시오 — 야영하며 약초를 캐다 보면 길이 보일 겁니다.', first());
      else UI.toast(lk.name + U.jx(lk.name, '은/는') + ' 이 섬이 아니라 ' + ISLES[p.isle].name + '에서 사라졌다.', 'heart', 4600);
      return false;
    }
    if (!PP.ready()) return false;
    var k = PP.kid(); if (!k) return false;
    return vanish(k, isle);
  };
  async function vanish(k, isle) {
    var s = S(), p = st(), nm = ISLES[isle].name, ks = kidSp(k), pc = null;
    try {
      await narrate('탐험대가 ' + nm + '의 자갈 해안에 올랐다. 낮은 언덕마다 헤더가 자줏빛으로 덮였고, 바닷새 울음만 들린다. 견습 ' + k.name + U.jx(k.name, '이/가') + ' 바람 부는 언덕 쪽을 한참 바라본다.');
      await UI.say('아버지, 선원 아저씨들이 그러는데요… 이 섬에는 어른이 되지 않는 아이가 산대요. 바람을 타고 날 줄도 안대요!\f이름은 피터래요. 밤마다 바위 위에서 수탉처럼 운대요.', ks);
      await UI.say('뱃사람들 옛말이다. 멀리 가지 말고 야영지 곁에 있거라.', me());
      await narrate('해 질 녘, 한동안 보이지 않던 ' + k.name + U.jx(k.name, '이/가') + ' 볼이 발갛게 상기되어 돌아왔다. 아무 일도 없었다며 웃는데, 옷자락에서 이 섬 어디서도 맡아 본 적 없는 낯선 약초 향이 짙게 풍긴다.');
      await UI.say('…아무것도 아니에요. 그냥 언덕에 누워 별을 봤어요.', ks);
      pc = pic('peter_pan_vanish', '비어 있는 잠자리');
      await narrate('그날 밤 늦게, 모닥불 곁을 살펴보니 ' + k.name + '의 잠자리가 비어 있다. 담요 위에 숯으로 꾹꾹 눌러 쓴 쪽지 한 장 — 「피터를 찾으러 가요. 금방 올게요.」 벗어 개켜 둔 겉옷에서 아까 그 약초 향이 아직 난다.');
      k.lost = 'peter';
      p.phase = 'lost'; p.kid = s.player.kids.indexOf(k); p.isle = isle; p.since = s.day;
      G.State.log(nm + '에서 ' + sonDau(k) + ' ' + k.name + U.jx(k.name, '이/가') + ' 사라졌다.');
      await UI.say('제독, 이 향은… 이 섬 산비탈 바위틈에만 나는 약초입니다. 아이가 그 약초밭 근처에 있었다는 뜻이지요.\f이 섬 어딘가에 야영지를 차리고 약초를 캐 보십시오. 같은 약초를 쫓다 보면 ' + k.name + U.jx(k.name, '이/가') + ' 지나간 자리에 닿을 겁니다.', first());
      UI.toast(k.name + U.jx(k.name, '이/가') + ' 섬 어딘가로 사라졌다 — 이 섬에서 야영하며 약초를 캐 보자', 'heart', 6000);
      return true;
    } finally { if (pc) await pc.stop(); }
  }

  // ---------------------------------------------------------------- ② 야영하며 약초를 캔다: 피터가 아이를 돌려주고 따라온다
  /** 야영을 마친 뒤 (js/scenes/land.js — v: 한 일) */
  PP.onCamp = async function (v, lon, lat) {
    var s = S(), p = st();
    if (v !== 'herb' || !s || s.loc.mode !== 'land' || p.phase !== 'lost') return false;
    if (PP.isle(lon, lat) !== p.isle) return false;
    var k = PP.lostKid(); if (!k) { p.phase = 'done'; return false; }
    return reunion(k);
  };
  async function reunion(k) {
    var s = S(), p = st(), nm = ISLES[p.isle].name, ks = kidSp(k), pc = null;
    try {
      await narrate('약초 바구니가 반쯤 찼을 때, 머리 위 바위에서 「꼬끼오—!」 수탉 같은 울음소리가 울린다. 고개를 들자 나뭇잎과 이끼 빛 옷을 걸친 소년 하나가, 바람에 실린 듯 사뿐히 내려선다. 그 손을 잡고 함께 내려오는 아이는— ' + k.name + '이다.');
      pc = pic('peter_pan_return', '바람을 타고 온 소년');
      await UI.say('아버지! 피터는 정말 날 수 있어요! 저도 바위에서 바위로 조금 날았어요!', ks);
      await UI.say('네가 이 녀석 아버지야? 약초 냄새를 따라올 줄 알았어. 이 녀석이 밤새 그 얘기만 했거든 — 우리 아버지는 바다 끝까지 가는 사람이라 나도 꼭 찾으러 온다고.\f어른은 다 싫어. 시시하고, 금방 잊어버리고, 아이들한테 일찍 자라고만 하니까.\f그런데 아이를 찾으러 이 섬 구석까지 와서 약초를 캐는 어른은 처음 봤어. 자, 돌려줄게.', peter());
      k.lost = null; delete k.lost;
      F().addBond(k, 12);
      if (!k.sk) k.sk = {};
      if ((k.sk.med || 0) < 1) k.sk.med = 1;                     // 피터에게 약초로 상처 싸매는 법을 배웠다
      await UI.say('피터한테 바위틈 약초로 상처를 싸매는 법도 배웠어요. 걱정 끼쳐서 죄송해요, 아버지.', ks);
      UI.toast(k.name + U.jx(k.name, '이/가') + ' 돌아왔다. (사이 +12 · 의학 1)', 'heart', 4600);
      await narrate('소년은 바다 쪽, 닻을 내린 배를 오래 바라본다.');
      await UI.say('…이 섬은 너무 작아. 어느 쪽으로 날아도 하루면 바다에 닿고, 늘 같은 갈매기만 날아. 해적도 안 오고.\f이 섬을 나갈 수만 있다면 어디든 좋아! 너희 배에 태워 줘. 품삯 같은 건 필요 없어 — 대신 해적이 나오면 내가 다 해치울게. 별을 보고 길도 찾아 줄게.', peter('happy'));
      var nmRow = G.Legend && G.Legend.join ? G.Legend.join(ID, null) : null;
      p.phase = 'done'; p.back = s.day;
      G.State.log(nm + '에서 ' + sonDau(k) + ' ' + k.name + U.jx(k.name, '을/를') + ' 되찾았다. 피터 팬이 따라왔다.');
      if (nmRow) {
        UI.toast('피터 팬 — 품삯을 받지 않는 항해사', 'heart', 4200);
        if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(ID); } catch (e) { console.error(e); } }
        await UI.say('좋아, 오늘부터 나는 이 배의 선원이야! 그래도 어른이 되라는 말은 하지 마. 그건 절대 안 해.', peter('happy'));
      }
      return true;
    } finally { if (pc) await pc.stop(); }
  }

  /** 섬을 떠날 때 (탐험을 마치고 배로 돌아간다) — 아이가 아직 섬에 있으면 한마디 */
  PP.onLeave = async function () {
    var k = PP.lostKid(); if (!k) return;
    UI.toast(k.name + U.jx(k.name, '은/는') + ' 아직 ' + ISLES[st().isle].name + '에 있다. 다시 상륙해 야영하며 약초를 캐 보자.', 'heart', 5600);
  };
  /** 자택에서 아내가 걱정한다 (js/systems/family.js F.talk) */
  PP.homeLine = function (k) { return k.name + U.jx(k.name, '이/가') + ' 스코틀랜드의 섬에서 사라졌다고요? …당신이 데려간 아이잖아요. 꼭 찾아서 데려와요. 그 아이가 좋아하는 약초 사탕을 만들어 두고 기다릴게요.'; };
  /** 정보 창의 꼬리표 */
  PP.tag = function (k) { if (!k || k.lost !== 'peter') return ''; var i = ISLES[st().isle]; return ' · 행방불명(' + (i ? i.name : '섬') + ')'; };

  // ---------------------------------------------------------------- 에든버러 술집 주인의 귀띔 (한 번)
  PP.tavernHint = async function (c) {
    var s = S(); if (!c || s.flags.ppHint) return;
    var o = R.cityOwner ? R.cityOwner(c) : c.nation;
    if (!(o === '스코틀랜드' || c.id === 42)) return;
    if (!PP.ready() && st().phase !== 'lost') return;
    if (!(s.player.kids || []).some(function (k) { return !k.unnamed; })) return;
    s.flags.ppHint = 1;
    var CC = G.Scenes.city, sp = { name: '술집 주인' };
    try { if (CC && CC.npc && CC.current && CC.current()) sp = CC.npc('tavernkeeper', '술집 주인'); } catch (e) { /* 도시 밖 */ }
    await UI.say('아이를 배에 태우고 다닌다고? 그럼 서쪽 섬들을 조심하게. 그 섬들 어딘가에 어른이 되지 않는 사내아이가 산다는 옛말이 있어. 아이를 데리고 그 섬에 오르면 아이가 그 녀석을 찾아 사라진다나.\f돌아온 아이들 옷에선 늘 산비탈 약초 냄새가 났다더군. 아이를 찾으려면 그 약초부터 찾으라는 말도 있고.', sp);
  };
  PP.install = function () {
    var CC = G.Scenes && G.Scenes.city, B = CC && CC.B; if (!B || !B.tavern || PP._inst) return;
    PP._inst = true;
    var f = B.tavern.enter;
    if (typeof f !== 'function') return;
    B.tavern.enter = async function (c) {
      var r = await f.apply(this, arguments);
      try { if (r !== false && CC.current && CC.current() && CC.current().kind === 'tavern') await PP.tavernHint(c); } catch (e) { console.error(e); }
      return r;
    };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) B.tavern.enter[k] = f[k];
  };
  PP.install();
})(window.G = window.G || {});
