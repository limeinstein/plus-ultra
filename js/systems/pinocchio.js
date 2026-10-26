/* 피노키오 (G.Pino) — 사람·조정값은 js/data/pinocchio.js (G.MATE.pinocchio · G.BALANCE.pinocchio). 2026-10-25 사용자 요청
   ① 고래를 센다 — 바다의 사건 「고래 떼」(js/systems/explore.js) · 고래 발견물(고래·혹등고래·뿔고래). (따로 「멀리 보이는 고래」를 만들지 않는다 — 늦게 벌어져도 괜찮다)
   ② 고래를 need(5)번 만난 뒤 대양(대서양·태평양·인도양 — X.oceanOf)에서 또 고래를 만나면:
      고래를 쫓는 작은 고깃배의 철없는 사내 피노키오 (서른 줄 — 아이 아님). 「아버지가 저 고래 배 속에 있어요!」
      어촌 목수 제페토의 아들 — 아버지 말을 듣지 않고, 비 오는 날 고래를 봤다고 거짓말을 하고는 그 고래를 잡겠다고 나가 늘 허탕.
      오늘은 걱정된 제페토가 함께 탔다가 고래에게 삼켜졌다.
        · 구한다 → 방법을 고른다: 포를 쏜다(피노키오가 막는다 — 「아버지가 안에 있어요!」) · 횃불 보트로 입속에 들어간다(피로 +) · 지칠 때까지 따라간다(식량·물 −)
          → 제페토를 구한다(명성 +). 고깃배는 부서져 둘 다 손님으로 탄다 (stage 'carry').
        · 지나친다 → coolDays 뒤 대양에서 고래를 만나면 다시.
   ③ 둘을 태우고 아무 도시에 들어서면: 제페토가 「사내라면 자기가 본받을 만한 사람을 따라가는 거다」 하며 피노키오를 맡긴다 → 동료(G.Legend.join).
   · 지중해 도시의 술집 주인이 한 번 귀띔한다 (고래를 need−2번 넘게 만났을 때).
   · 떠나며 피노키오 인형(소지품)을 준다 — 뱃노래가 울릴 때 chance로 춤춰 피로 풀림·규율 오름 × mult (P.dance · G.BALANCE.pinocchio.doll)
   · 저장: s.pino = { whales: 만난 번, stage: 'carry'|'done', cool: 날번호, metDay, doll: 인형을 받았으면 1 } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, P = {};
  G.Pino = P;
  function K() { return (G.BALANCE && G.BALANCE.pinocchio) || {}; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s ? (s.pino || (s.pino = {})) : {}; }
  P.state = st;
  P.OCEANS = { atlantic: 1, pacific: 1, indian: 1 };
  P.WHALE_DISC = { whale: 1, humpback: 1, narwhal: 1 };
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function need() { return K().need == null ? 5 : K().need; }
  function who(emo) { var m = G.MATE.pinocchio; return G.Legend && G.Legend.speaker ? G.Legend.speaker('pinocchio', emo) : { name: m.name, portrait: G.Art.mateSpec('pinocchio'), lang: 3, special: true }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function pino(text, emo) { return UI.say(text, who(emo)); }
  function narrate(text) { return UI.say(text, {}); }
  var gepSpec = null;
  function gep(emo) {
    if (!gepSpec) {
      try {
        gepSpec = G.Art.npcSpec('tale_geppetto', 'sailor', 'it', 'm');
        if (G.Art.withImg) G.Art.withImg(gepSpec, ['portraits/legendary/geppetto']);
      } catch (e) { gepSpec = null; }
    }
    return { name: '제페토', portrait: gepSpec, half: ['portraits/legendary/geppetto_half'], lang: 3, special: true, emotion: emo || null };
  }
  function geppetto(text, emo) { return UI.say(text, gep(emo)); }
  function pic(img, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: img, title: title }) : null; }

  // ---------------------------------------------------------------- 고래를 센다
  /** 대양(대서양·태평양·인도양)인가 — 지중해·카리브해 같은 안쪽 바다는 아니다 */
  P.inOcean = function (lon, lat) {
    var X = G.Explore, oc = X && X.oceanOf ? X.oceanOf(lon, lat) : null;
    return !!(oc && P.OCEANS[oc[0]]);
  };
  /** 아직 피노키오를 만날 수 있는가 */
  P.ready = function () {
    var s = S(), q = st(); if (!s) return false;
    if (q.stage || row('pinocchio') || (s.flags && s.flags.gone_pinocchio)) return false;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return false;
    return !(q.cool && s.day < q.cool);
  };
  /** 고래를 만났다 — 이번 만남 전에 이미 need번 넘게 만났고, 대양이면 이야기가 벌어진다 (벌어지면 true) */
  P.whale = async function (lon, lat) {
    var s = S(), q = st(); if (!s) return false;
    var l = s.loc || {}; if (lon == null) { lon = l.lon; lat = l.lat; }
    var before = q.whales || 0;
    q.whales = before + 1;
    if (before >= need() && P.ready() && P.inOcean(lon, lat)) { await P.meet(); return true; }
    return false;
  };
  /** 고래 발견물(고래·혹등고래·뿔고래)을 찾으면 한 번으로 센다 (G.Disc.find 뒤) */
  P.countFind = function (d) {
    var id = typeof d === 'string' ? d : d && d.id;
    if (id && P.WHALE_DISC[id] && S()) { st().whales = (st().whales || 0) + 1; return true; }
    return false;
  };

  // ---------------------------------------------------------------- ② 고래 배 속의 아버지
  P.meet = async function () {
    var s = S(), q = st(), f = s.fleet, pc = pic('legend-events/pinocchio_whale', '고래를 쫓는 작은 고깃배');
    try {
      await narrate('집채만 한 고래가 물을 뿜으며 뱃전을 스쳐 간다. 그런데 그 꼬리를 바짝 따라붙는 것이 있다. 돛 하나짜리 작은 고깃배. 뱃머리에 선 해진 조끼 차림의 젊은 어부가 노를 휘두르며 목이 터져라 외친다. 나이는 서른 줄로 보이는데, 하는 짓은 영락없는 개구쟁이다.');
      await pino('거기 큰 배! 도와줘요, 제발! 우리 아버지가…… 아버지가 저 고래 배 속에 있어요!', 'sad');
      await UI.say('진정하시오. 무슨 일이오? 차근차근 말해 보시오.', me());
      await pino('저는 피노키오예요. 토스카나 바닷가 어촌에 살아요. 아버지는 목수 제페토고요. 동네 고깃배는 다 아버지가 고쳐요. ……서른이 다 됐는데 아직 아버지 집에 얹혀살아요.\f……비가 억수같이 오던 날, 마을 사람들한테 집채만 한 고래를 봤다고 했어요. 사실은 아무것도 못 봤어요. 다들 웃기에 분해서, 그럼 진짜로 잡아 오겠다고 아버지 고깃배를 몰고 나갔어요.');
      await narrate('말하는 동안 사내의 코끝이 새빨갛게 달아오른다. 다 큰 어른이 부끄러운 듯 손등으로 코를 문지른다.');
      await pino('아버지는 그만두라고 했어요. 「바다는 거짓말을 받아 주지 않는다」고, 몇 번이나요. 그래도 저는 안 들었어요. 나갈 때마다 허탕이었고요. 고래 그림자도 못 봤어요.\f그런데 오늘은 아버지가 걱정된다고 제 배에 같이 탔어요. 그랬더니……');
      await pino('진짜로 나타났어요. 제가 지어낸 것보다 훨씬 큰 놈이요. 고래가 입을 쩍 벌리고 지나가는데, 뱃머리에 계시던 아버지가 그대로…… 빨려 들어갔어요.\f이번엔 거짓말 아니에요! 정말이에요! 제 코 좀 보세요, 하얗잖아요!', 'sad');
      await narrate('고래는 아직 멀리 가지 않았다. 등 위로 숨구멍이 열릴 때마다, 물줄기에 섞여 희미하게…… 늙은 사내가 기침하는 소리가 들려오는 것 같다.');
      var v = await UI.ask('고래 배 속의 제페토를 구할까?', [
        { label: '구한다 — 「배를 고래 쪽으로 돌려라!」', value: 1, icon: 'heart' },
        { label: '못 본 척 지나간다', value: 0 }], me());
      if (!v) {
        await pino('……그럼 저 혼자라도 갈 거예요. 아버지는 제가 꺼낼 거예요!', 'angry');
        await narrate('작은 고깃배는 고래가 사라진 쪽으로 멀어져 갔다. 선원 몇이 오래도록 그쪽을 돌아보았다.');
        q.cool = s.day + (K().coolDays || 40);
        f.discipline = Math.max(0, (f.discipline || 0) - 3);
        return true;
      }
      await rescue();
      return true;
    } finally { if (pc) await pc.stop(); }
  };
  /** 구하는 방법 — 포를 쏘면 피노키오가 막는다 */
  async function rescue() {
    var s = S(), q = st(), f = s.fleet, K0 = K(), tried = {};
    var how = null;
    while (!how) {
      var opts = [];
      if (!tried.cannon) opts.push({ label: '포를 쏴서 고래를 멈춰 세운다', value: 'cannon', icon: 'cannon' });
      opts.push({ label: '횃불과 젖은 짚을 실은 보트로 고래 입속에 들어간다', value: 'torch', icon: 'fire' });
      opts.push({ label: '고래가 지칠 때까지 돛을 다 펴고 따라간다', value: 'chase', icon: 'ship' });
      var v = await UI.ask('어떻게 구할까?', opts, me());
      if (v === 'cannon') {
        tried.cannon = 1;
        await pino('안 돼요!! 아버지가 저 안에 있다고요! 포탄이 아버지한테 맞으면요? 고래가 그대로 가라앉으면요?!', 'angry');
        await UI.say('……네 말이 맞다. 다른 방법을 찾자.', me());
      } else if (v === 'chase' || v === 'torch') how = v;
      else how = 'torch';   // 창을 그냥 닫으면 — 가장 빠른 길로
    }
    if (how === 'torch') {
      await narrate('고래가 숨을 쉬러 떠올라 입을 벌린 틈을 타, 보트가 노를 저어 그 안으로 미끄러져 들어간다. 피노키오가 맨 앞에서 횃불을 든다.\f컴컴한 고래 배 속. 삼켜진 난파선의 판자와 궤짝 사이로, 촛불 하나를 켜 놓고 궤짝 식탁에 앉은 노인이 보인다.');
      await geppetto('……피노키오? 피노키오냐? 이 녀석, 여기까지 따라 들어오면 어쩌자는 게냐!', 'surprised');
      await narrate('젖은 짚에 횃불을 대자 매캐한 연기가 고래 배 속에 가득 찬다. 바닥이 크게 출렁이더니 —\f「에— 취!!」\f고래의 재채기와 함께 보트와 노인이 한꺼번에 바다로 튕겨 나왔다.');
      f.fatigue = Math.min(100, (f.fatigue || 0) + (K0.fatigue || 12));
    } else {
      var days = K0.chase || 3, use = Math.round((R.dailyUse ? R.dailyUse() : 1) * days);
      await narrate('돛을 있는 대로 펴고 선원들이 노까지 붙잡았다. 고래가 잠수하면 기다리고, 떠오르면 다시 쫓는다. 해가 지고 또 뜰 때까지.\f마침내 지친 고래가 물 위에 둥실 떠서 하품을 하듯 입을 벌린다. 그 입안 판자 더미 위에서, 촛불을 든 노인이 손을 흔든다.');
      await geppetto('여기요! 여기 사람 있소! ……허, 피노키오? 네가 이 큰 배를 데려온 게냐?', 'surprised');
      await narrate('밧줄을 던져 노인을 끌어냈다. 고래는 귀찮다는 듯 꼬리를 한 번 치고 깊이 잠수해 사라졌다. (식량·물 각 ' + use + '통을 썼다)');
      f.food = Math.max(0, (f.food || 0) - use); f.water = Math.max(0, (f.water || 0) - use);
    }
    await narrate('그 꼬리질에 피노키오의 고깃배는 산산조각이 났다. 갑판으로 끌어 올린 노인은 흠뻑 젖은 채로 아들을 끌어안았다.');
    await pino('아버지! 잘못했어요…… 다시는 거짓말 안 할게요. 다시는요!', 'sad');
    await geppetto('그래, 그래. 어디 보자…… 코가 하얗구나. 이번엔 참말이로구나.', 'happy');
    await geppetto('선장님, 고맙소. 이 늙은이 목숨을 건져 주셨구려. 염치없지만, 고깃배가 부서졌으니 가까운 항구까지만 우리 부자를 태워 주시오.');
    q.stage = 'carry'; q.metDay = s.day;
    G.Fame.add('ex', K0.fame || 40);
    G.State.log('대양에서 고래에게 삼켜진 어촌의 목수 제페토를 구했다. 아들 피노키오와 함께 가까운 항구까지 태워 주기로 했다.');
    UI.toast('제페토를 구했다! 가까운 도시에 내려 주자. (명성 +' + (K0.fame || 40) + ')', 'heart', 5200);
    if (G.Audio) G.Audio.sfx('cheer');
    if (G.Game.refreshHud) G.Game.refreshHud();
  }

  // ---------------------------------------------------------------- ③ 항구에서 — 아들을 맡긴다
  P.farewell = async function (c) {
    var s = S(), q = st(); if (q.stage !== 'carry') return false;
    if (row('pinocchio')) { q.stage = 'done'; return false; }
    var cname = c && c.name ? c.name : '항구', pc = pic('legend-events/geppetto_farewell', cname + ' 부두의 작별');
    try {
      await narrate(cname + ' 부두. 배다리를 내려선 제페토는 한참 동안 아들의 어깨를 붙잡은 채 놓지 않았다.');
      await geppetto('선장님. 고래 배 속에 있는 동안 내가 제일 무서웠던 게 뭔지 아시오? 죽는 것도 아니고, 이 녀석이 영영 철들지 못할까 봐서였소.');
      await geppetto('피노키오야. 이 아비는 목수라 판자 맞추는 법, 별 보고 길 찾는 법밖에 못 가르쳤다.\f사내라면 자기가 본받을 만한 사람을 따라가는 거다. 고래 입속까지 너를 따라 들어와 준 분이 저기 계시지 않느냐. 저분을 따라가거라.');
      await pino('아버지…… 저 이제 거짓말 안 해요. 허풍도 안 떨고요. 그러니까 이건 진짜 약속이에요. 저분 배에서 제대로 된 뱃사람이 돼서, 아버지 보러 돌아올게요.', 'sad');
      await geppetto('그래. 바다에서 본 것은 본 대로만 말하거라. 그거면 된다.', 'happy');
      await geppetto('선장님, 이 철부지를 부탁하오. 서른이 넘도록 철이 안 든 놈이지만, 판자 한 장 허투루 붙이지 않고, 별 하나 물결 한 줄 허투루 보지 않게 가르쳐 두었소. 쓸모가 있을 거요.\f나는 여기서 고향 가는 배를 기다리겠소.');
      var nm = G.Legend && G.Legend.join ? G.Legend.join('pinocchio', c) : null;
      q.stage = 'done';
      if (nm) {
        nm.loyal = K().loyal || 85;
        await pino('잘 부탁드려요, 선장님! 다음에 고래를 보면 제가 제일 먼저 외칠게요. ……진짜로 봤을 때만요!', 'happy');
      }
      await P.giveDoll();
      if (!nm) return true;
      G.State.log((c && c.name ? c.name + ' 부두에서 ' : '') + '제페토가 아들 피노키오를 맡겼다. 「사내라면 자기가 본받을 만한 사람을 따라가는 거다.」');
      UI.toast('피노키오 — 항해술 3 · 측량 3 · 과학 3 · 조선기술 3 · 로망스어 (' + (G.wageNote ? G.wageNote('pinocchio') : '') + ')', 'heart', 5200);
      return true;
    } finally { if (pc) await pc.stop(); }
  };

  // ---------------------------------------------------------------- 피노키오 인형 — 아들의 분신
  /** 제페토가 떠나며 인형을 준다 (소지품 칸이 차도 기념품이라 받는다) */
  P.giveDoll = async function () {
    var s = S(), q = st(); if (!s || q.doll || !G.ITEM || !G.ITEM.pinocchio_doll) return false;
    await narrate('배다리를 오르려던 제페토가 돌아서더니, 젖은 보따리를 풀어 무언가를 내민다. 손바닥만 한 나무 인형이다. 팔다리가 실로 이어져 있고, 코가 조금 길다.');
    await geppetto('고래 배 속에서 난파선 판자로 깎은 거요. 이 녀석을 다시 못 볼까 봐, 얼굴을 잊지 않으려고 밤마다 깎았지.\f이제 진짜가 곁에 있으니 나한텐 없어도 되오. 선장님이 가져가시오. 이 녀석의 분신이라 생각하고.');
    await pino('아버지, 코는 왜 이렇게 길게 깎으셨어요?', 'surprised');
    await geppetto('네가 거짓말할 때 얼굴이 딱 이렇다. 허허. 이 인형 코가 짧아 보이는 날이 오면, 그때 고향에 한번 오거라.', 'happy');
    q.doll = 1;
    var R0 = G.R, okAdd = R0 && R0.addItem ? R0.addItem('pinocchio_doll') : false;
    if (!okAdd && R0 && !R0.hasItem('pinocchio_doll')) s.player.items.push({ id: 'pinocchio_doll' });   // 칸이 차도 받는다 — 기념품
    await narrate('제페토는 손을 한 번 흔들고 부두의 사람들 사이로 사라졌다. 피노키오는 그 뒷모습이 보이지 않을 때까지 뱃전에 서 있었다.');
    G.State.log('제페토가 떠나며 「아들의 분신」이라며 피노키오 인형을 남겼다.');
    UI.toast('피노키오 인형을 얻었다 — 뱃노래가 울릴 때 이따금 춤을 춘다', 'heart', 5200);
    return true;
  };
  /** 뱃노래(음악 사건, js/systems/explore.js 'songs')가 벌어질 때: 인형이 있으면 chance로 춤춘다 → 효과 배수 (춤추지 않으면 1) */
  P.dance = async function () {
    var R0 = G.R, k = K().doll || {};
    if (!R0 || !R0.hasItem || !R0.hasItem('pinocchio_doll')) return 1;
    if (!U.chance(k.chance == null ? 0.5 : k.chance)) return 1;
    var mult = k.mult || 1.5;
    await narrate(U.pick([
      '그때 선실 선반에 앉혀 둔 피노키오 인형이 노랫가락에 맞춰 팔다리를 들썩이기 시작했다. 실도 당기지 않았는데 나무 발끝이 탁, 탁, 장단을 맞춘다. 선원들이 손뼉을 치며 노래가 더 커졌다.',
      '흔들리는 등불 아래, 피노키오 인형이 저 혼자 고개를 까딱이더니 기다란 코를 앞세우고 빙글빙글 돈다. 「저 녀석 또 춘다!」 웃음이 터지고, 노래가 한 소절 더 신이 났다.',
      '노래가 무르익자 선반 위 나무 인형이 덜그럭덜그럭 춤을 추었다. 피노키오가 「아버지 솜씨예요!」 하고 외치고, 다들 발을 구르며 따라 춘다.']), {});
    if (G.Audio) G.Audio.sfx('cheer');
    return mult;
  };

  // ---------------------------------------------------------------- 술집 주인의 귀띔 (지중해 도시에서 한 번)
  P.tavernHint = async function (c) {
    var s = S(), q = st(); if (!c || s.flags.pinoHint || !P.ready()) return;
    if (c.region !== 2 || (q.whales || 0) < Math.max(1, need() - 2)) return;
    s.flags.pinoHint = 1;
    await UI.say('고래 이야기라면 토스카나 뱃사람들한테 재미난 게 있지. 비 오는 날 고래를 봤다고 큰소리치다 망신을 당하고는, 진짜로 잡아 오겠다고 고깃배를 몰고 대양까지 나간 목수네 아들이 있다는군.\f고래를 자주 보는 뱃사람이라면, 큰 바다 어디선가 그 녀석과 마주칠지도 모르지.', { name: '술집 주인' });
  };

  // ---------------------------------------------------------------- 다른 코드에 잇기
  function hook() {
    var Cc = G.Scenes && G.Scenes.city, D = G.Disc, T = G.Tale;
    if (!Cc || !Cc.arrival || P.hooked) return;
    P.hooked = true;
    // 고래 발견물도 센다
    if (D && D.find) {
      var f0 = D.find;
      D.find = async function (d) {
        var r = await f0.apply(this, arguments);
        try { if (r) P.countFind(d); } catch (e) { console.error(e); }
        return r;
      };
      P.findHooked = true;   // (js/systems/musicmoments.js가 나중에 한 겹 더 감싼다 — 사슬은 그대로)
    }
    // 도시에 들어서면: 제페토가 아들을 맡긴다
    var oa = Cc.arrival;
    Cc.arrival = async function (c) {
      var r = await oa.apply(this, arguments);
      try { if (st().stage === 'carry') await P.farewell(c); } catch (e) { console.error(e); }
      return r;
    };
    // 술집 주인의 귀띔
    if (T && T.tavernHints) {
      var oh = T.tavernHints;
      T.tavernHints = async function (c) { var r = await oh.apply(this, arguments); try { await P.tavernHint(c); } catch (e) { console.error(e); } return r; };
    }
  }
  P.hook = hook;
  hook();
  if (!P.hooked) document.addEventListener('DOMContentLoaded', hook);
})(window.G = window.G || {});
