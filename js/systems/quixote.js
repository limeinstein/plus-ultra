/* 돈키호테와 산초 판사의 산티아고 순례 (G.Quix) — 사람은 js/data/quixote.js. 2026-10-19 사용자 요청
   ■ 만남 — 톨레도(라 만차 들판 어귀)에 들어서면: 풍차를 거인으로 알고 돌격했다 나동그라진 늙은 기사와, 당나귀를 탄 종자.
     기사는 둘시네아 공주를 위해, 그리고 편력 기사의 맹세를 새로 하기 위해 사도 성 야고보의 무덤(산티아고 데 콤포스텔라)까지 「프랑스 길」로 순례하겠다며
     「바다의 기사」인 제독에게 동행을 청한다. 거절하면 coolDays 뒤 톨레도에서 다시 만난다.
   ■ 순례 — 프랑스 길의 두 성소에 들른다 (차례는 상관없다)
     · 투르(생마르탱 대성당): 거지에게 망토를 반 갈라 준 성 마르티노 앞에서, 돈키호테가 제 망토를 통째로 거지에게 준다
     · 툴루즈(생세르냉 대성당): 가론 강의 바자클 물레방아를 「팔이 백 개 달린 거인」으로 보고 또 돌격하려 한다 — 말리거나, 함께 돌격하거나
   ■ 산티아고 — 두 성소를 다 들른 뒤 라코루냐(산티아고 데 콤포스텔라의 바닷길 어귀)에 이르면: 영광의 문, 날아다니는 은 향로(보타푸메이로)를 용으로 아는 소동,
     사도의 상을 껴안는 산초. 순례를 마친 두 사람은 「품삯은 필요 없다」며 제독의 배에 오른다 (무급 항해사 — G.Legend.join).
     세르반테스가 부하로 있으면 그가 한마디 거든다. 산티아고 대성당을 아직 찾지 못했으면 단서가 된다.
   · 저장: s.quix = { stage: 'pilgrim'|'done', cool: 날번호, tours, toulouse, warned }
   · 도시에 들어설 때 G.Quix.pending()/check() (js/scenes/city.js) · 수첩 「할 일」에 순례 줄 (G.Court.taskHtml) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var Q = G.Quix = {};
  var DQ = 'don_quixote', SP = 'sancho_panza';
  var TOLEDO = 4, TOURS = 16, TOULOUSE = 19, CORUNA = 2;
  Q.K = { coolDays: 60, fameStage: 60, fameEnd: 200 };
  // 순례길 — 투르·툴루즈는 내륙 도시라 처음에는 지도에 없다(처음 아는 도시는 이베리아·서지중해와 프랑스의 항구뿐 — js/core/state.js).
  //   순례를 시작하면 세 곳을 지도에 올리고, 어느 항구에 내려 육로로 가는지 알려 준다 (2026-10-25 피드백 「투르가 없다」)
  var ROUTE = [
    { id: TOURS, key: 'tours', name: '투르', what: '생마르탱 대성당', how: '낭트에 내려 성문에서 육로로 루아르 강을 따라 동쪽으로 약 160km' },
    { id: TOULOUSE, key: 'toulouse', name: '툴루즈', what: '생세르냉 대성당', how: '보르도에 내려 성문에서 육로로 가론 강을 거슬러 남동쪽으로 약 220km' },
    { id: CORUNA, key: null, name: '라코루냐', what: '산티아고 데 콤포스텔라', how: '갈리시아의 항구 — 배로 바로 들어간다' }
  ];
  Q.ROUTE = ROUTE;
  /** 순례길의 도시를 지도에 올린다 (옛 저장도 도시에 들어설 때 맞춘다) */
  Q.reveal = function () {
    var s = S(); if (!s || !s.known) return;
    ROUTE.forEach(function (r) { if (s.known.indexOf(r.id) < 0) s.known.push(r.id); });
  };
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.quix || (s.quix = {}); }
  function row(id) { return S().mates.filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { return !!S().flags['gone_' + id]; }
  function who(id, emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id, emo) : { name: G.MATE[id].name, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function say(id, text, emo) { return UI.say(text, id === 'P' ? me() : who(id, emo)); }
  function narrate(text) { return UI.say(text, {}); }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (l[0]) await say(l[0], l[1], l[2]); else await narrate(l[1]); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function cervantes() { return !!row('cervantes'); }

  /** 아직 만날 수 있는가 — 둘 다 배에 없고, 떠나보내지 않았고, 거절한 뒤 쉬는 날이 지났다 */
  Q.ready = function () {
    var q = st(); if (q.stage) return false;
    if (row(DQ) || row(SP) || gone(DQ) || gone(SP)) return false;
    return !(q.cool && S().day < q.cool);
  };
  Q.pending = function () {
    var s = S(); if (!s || !s.quix && cityNow() !== TOLEDO) return false;
    var q = st(), c = cityNow();
    if (q.stage === 'pilgrim') Q.reveal();
    if (c === TOLEDO && Q.ready()) return true;
    if (q.stage !== 'pilgrim') return false;
    return (c === TOURS && !q.tours) || (c === TOULOUSE && !q.toulouse) || (c === CORUNA && (q.tours && q.toulouse || !q.warned));
  };
  Q.check = async function () {
    if (Q._busy) return false; Q._busy = true;
    try {
      var q = st(), c = cityNow();
      if (c === TOLEDO && Q.ready()) await meet();
      else if (q.stage === 'pilgrim' && c === TOURS && !q.tours) await tours();
      else if (q.stage === 'pilgrim' && c === TOULOUSE && !q.toulouse) await toulouse();
      else if (q.stage === 'pilgrim' && c === CORUNA) { if (q.tours && q.toulouse) await santiago(); else await notYet(); }
    } catch (e) { console.error(e); }
    Q._busy = false;
    return true;
  };

  // ================================================================ 만남 — 라 만차의 풍차
  async function meet() {
    var q = st(), pc = pic('quixote_windmill', '라 만차의 풍차');
    try {
      await play([
        [null, '톨레도 남쪽, 라 만차의 메마른 들판. 언덕 위에 풍차 서른 남짓이 느릿느릿 날개를 돌리고 있다. 그때 이발사의 놋대야를 투구처럼 쓴 깡마른 늙은 기사가, 뼈만 남은 말을 몰아 창을 겨누고 언덕을 달려 올라간다.'],
        [DQ, '달아나지 마라, 비겁하고 천한 거인들아! 너희에게 덤비는 것은 단 한 사람의 기사뿐이다!'],
        [SP, '나리, 나리! 그건 거인이 아니라 풍차라니까요! 팔처럼 보이는 건 바람에 도는 날개고요!'],
        [null, '창끝이 날개에 꽂히는 순간, 바람이 거세게 불어 날개가 돌고— 창은 산산조각, 말과 기사는 들판으로 나동그라졌다.'],
        [SP, '아이고, 하느님 맙소사! 제가 뭐라 그랬습니까요, 나리.'],
        [DQ, '…입 다물라, 산초. 이건 내 책과 서재를 훔쳐 간 마법사 프레스톤의 짓이다. 내가 거인을 이기는 영광을 빼앗으려고 거인들을 풍차로 바꿔 놓은 것이지.'],
        [null, '일행이 다가가 기사를 일으켜 세운다. 기사는 흙을 털고, 찌그러진 대야 투구를 바로 쓰더니 제독을 위아래로 훑어본다.'],
        [DQ, '그대의 얼굴에 바닷바람의 소금이 앉았구려. 그대는 필시 이름 높은 「바다의 기사」로다! 나는 라 만차의 돈키호테, 슬픈 몰골의 기사요. 이쪽은 내 충직한 종자 산초 판사.'],
        [SP, '안녕하십니까요, 나리. 저는 나리를 따라가면 섬 하나를 다스리게 해 주신다길래… 아직 섬은 구경도 못 했습니다요.'],
        [DQ, '바다의 기사여, 들으시오. 나는 이 패배를 씻고, 엘 토보소의 둘시네아 공주께 바칠 맹세를 새로 하고자 에스파냐의 수호성인 성 야고보의 무덤— 산티아고 데 콤포스텔라로 순례를 떠나려 하오.'],
        [DQ, '진정한 순례자라면 프랑스 길을 걸어야 하지. 망토를 반 갈라 거지에게 준 기사 성인 마르티노가 잠든 투르, 그리고 성 세르냉이 잠든 툴루즈를 거쳐 피레네를 넘어 산티아고로!'],
        [SP, '나리, 그 길은 로시난테로 가면 내년 이맘때도 못 닿습니다요. …저기, 바다의 기사 나리. 배가 있으시다면서요?']
      ]);
      var v = await UI.ask('돈키호테와 산초 판사가 산티아고 순례에 함께해 달라고 청한다 (투르 · 툴루즈의 성소를 들른 뒤 라코루냐로)', [
        { label: '순례길의 동무가 되어 주겠다', value: 1 }, { label: '바다의 기사는 갈 길이 바쁘다', value: 0 }], me());
      if (!v) {
        await play([[DQ, '…좋소. 기사는 남에게 길을 강요하지 않는 법. 허나 우리는 이 들판에서 그대를 다시 기다리겠소. 산초, 로시난테를 끌어라.'], [SP, '네네, 나리. (작게) 배 타고 가면 금방일 텐데…']]);
        q.cool = S().day + Q.K.coolDays;
        return;
      }
      q.stage = 'pilgrim'; q.from = U.dateNum(S().date);
      await play([
        [DQ, '오오! 하늘이 이 슬픈 몰골의 기사에게 동지를 보내셨구나! 바다의 기사여, 이 순례가 끝나면 그대의 이름을 둘시네아 공주께 반드시 아뢰리다.'],
        [SP, '나리, 그럼 배에 타는 김에 빵이랑 치즈랑 포도주 좀 넉넉히… 아, 아닙니다요. 제가 알아서 챙기겠습니다요.'],
        [SP, '아, 그리고 바다의 기사 나리. 투르랑 툴루즈는 바닷가가 아니랍니다요. 투르는 낭트에서 내려 루아르 강을 따라 걸어 올라가고, 툴루즈는 보르도에서 내려 가론 강을 거슬러 가면 된다고 순례자들이 그럽디다요. 지도에 표시해 두었습니다요!']
      ]);
      Q.reveal();
      G.State.log('라 만차의 풍차 언덕에서 돈키호테와 산초 판사를 만났다. 투르·툴루즈의 성소를 들러 산티아고까지 순례에 함께하기로 했다.');
      UI.toast('순례 — 투르(낭트에서 육로) · 툴루즈(보르도에서 육로)를 들른 뒤 라코루냐(산티아고)로 — 지도에 표시했다', 'scroll', 7000);
      if (G.Game.refreshHud) G.Game.refreshHud();
    } finally { await pc.stop(); }
  }

  // ================================================================ 투르 — 성 마르티노의 망토
  async function tours() {
    var q = st(), pc = pic('quixote_tours_cloak', '반으로 가른 망토');
    try {
      await play([
        [null, '루아르 강가의 투르. 생마르탱 대성당 앞 계단에 순례자들의 조가비가 반짝이고, 문 곁에는 누더기를 걸친 늙은 거지가 떨고 있다.'],
        [DQ, '보아라, 산초. 저 문 위에 새겨진 이가 말 위에서 칼로 제 망토를 반 갈라 헐벗은 이에게 준 기사 성인 마르티노시다. 기사도란 바로 저런 것이다.'],
        [SP, '훌륭하신 분이네요. 망토 반쪽이면 성인이 되는군요. …나리? 나리, 왜 망토를 벗으십니까요?'],
        [DQ, '성인께서는 반을 주셨으나, 나는 아직 성인이 못 되었으니 통째로 드려야 셈이 맞지 않겠느냐.'],
        [null, '돈키호테는 거지의 어깨에 제 망토를 통째로 둘러 주고, 늙은 거지는 그 앞에 무릎을 꿇는다. 지나던 순례자들이 박수를 친다.'],
        [SP, '아이고, 오늘 밤 추우실 텐데… 「주는 손이 받는 손보다 복되다」고는 하지만, 그 복이 담요를 대신해 주진 않습니다요. 제 담요 반쪽 드릴게요, 나리.'],
        [DQ, '산초, 너도 오늘 성인의 길에 한 걸음 들어섰구나!']
      ]);
      q.tours = U.dateNum(S().date);
      var so = G.Fame.add('so', Q.K.fameStage);
      G.State.log('순례 — 투르의 생마르탱 대성당에 들렀다. 돈키호테가 거지에게 제 망토를 통째로 주었다. (사교 명성 +' + so + ')');
      UI.toast('순례 — 투르 생마르탱 ✓' + (q.toulouse ? ' · 이제 라코루냐(산티아고)로' : ' · 다음은 툴루즈(생세르냉)'), 'scroll', 5000);
    } finally { await pc.stop(); }
  }

  // ================================================================ 툴루즈 — 바자클의 물레방아
  async function toulouse() {
    var q = st(), pc = pic('quixote_bazacle', '가론 강의 거인');
    try {
      await play([
        [null, '붉은 벽돌의 도시 툴루즈. 생세르냉 대성당의 팔각 종탑을 바라보며 가론 강 다리를 건너는데, 강을 가로막은 둑 위에 바자클의 물레방아 수십 개가 물보라를 일으키며 철썩철썩 돌고 있다.'],
        [DQ, '산초! 저것을 보아라. 강물 속에 몸을 숨기고 팔 백 개를 휘두르는 거인이다! 지난번 풍차들의 형님이 틀림없다!'],
        [SP, '나리, 그건 물레방아입니다요! 밀가루 빻는 거요! 저기 방앗간 주인들이 자루를 나르는 게 안 보이십니까요?'],
        [DQ, '마법사가 저들의 눈까지 홀려 놓았구나. 바다의 기사여, 그대라면 알아보겠지?']
      ]);
      var v = await UI.ask('돈키호테가 창을 고쳐 잡는다. 어떻게 할까?', [
        { label: '산초와 함께 말린다', value: 'stop' },
        { label: '「거인」과 맞서는 척 함께 돌격한다', value: 'charge' }], me());
      if (v === 'charge') {
        await play([
          [null, '제독이 칼을 뽑아 들고 돈키호테와 나란히 둑으로 뛰어든다. 물레방아 바퀴가 철썩 물을 끼얹자 두 사람은 함께 흠뻑 젖어 강가에 주저앉았다. 방앗간 사람들이 배를 잡고 웃는다.'],
          [DQ, '하하하! 거인이 물을 뿜어 우리를 물리쳤구나. 허나 바다의 기사와 나란히 싸웠으니 오늘은 내 생애 가장 영광스러운 패배다!'],
          [SP, '두 분 다 물에 빠진 생쥐 꼴이십니다요. 「미친 사람 곁에 오래 있으면 미치는 법」이라더니…']
        ]);
        q.charged = 1;
        if (G.Fame) G.Fame.add('bt', 20);
      } else {
        await play([
          [null, '제독과 산초가 양쪽에서 로시난테의 고삐를 붙잡는다. 방앗간 주인이 다가와 갓 빻은 밀가루로 구운 빵 한 덩이를 순례자들에게 건넨다.'],
          [DQ, '…좋소. 오늘은 성인의 도시이니 칼을 거두겠소. 이 빵은 거인이 바친 항복의 예물로 받아 두지.'],
          [SP, '나리, 이게 바로 「배부른 개는 짖지 않는다」는 겁니다요. (빵을 크게 한 입 베어 문다)']
        ]);
      }
      await play([
        [null, '그날 저녁, 생세르냉 대성당. 성 세르냉의 무덤 앞에서 돈키호테는 밤새 무릎을 꿇고 철야 기도를 했다. 산초는 그 곁 기둥에 기대어 코를 골았다.']
      ]);
      q.toulouse = U.dateNum(S().date);
      var so = G.Fame.add('so', Q.K.fameStage);
      G.State.log('순례 — 툴루즈의 생세르냉 대성당에 들렀다. 돈키호테가 바자클의 물레방아를 거인으로 알았다' + (q.charged ? '(함께 돌격했다)' : '') + '. (사교 명성 +' + so + ')');
      UI.toast('순례 — 툴루즈 생세르냉 ✓' + (q.tours ? ' · 이제 라코루냐(산티아고)로' : ' · 다음은 투르(생마르탱)'), 'scroll', 5000);
    } finally { await pc.stop(); }
  }

  async function notYet() {
    var q = st(); if (q.warned) return; q.warned = 1;
    await play([[DQ, '바다의 기사여, 서두르지 마시오! 프랑스 길의 성인들— ' + (!q.tours ? '투르의 성 마르티노' : '') + (!q.tours && !q.toulouse ? '와 ' : '') + (!q.toulouse ? '툴루즈의 성 세르냉' : '') + '께 아직 인사를 드리지 않았소. 순례는 지름길로 가는 것이 아니오.'],
      [SP, '(작게) 지름길이 있으면 지름길로 가는 게 사람 사는 이치인데…']]);
  }

  // ================================================================ 산티아고 — 순례의 끝
  async function santiago() {
    var q = st(), pc = pic('quixote_botafumeiro', '날아다니는 은 향로');
    try {
      await play([
        [null, '라코루냐에서 남쪽으로 하루. 갈리시아의 비 젖은 언덕 위로 산티아고 데 콤포스텔라 대성당의 종탑이 솟아 있다. 순례자들이 조가비를 달고 「영광의 문」을 지나 사도의 무덤으로 들어간다.'],
        [SP, '나리, 다 왔습니다요! 제 발로 걸은 건 절반도 안 되지만요!'],
        [null, '미사가 시작되자 수도사 여덟이 밧줄을 당기고, 사람 키만 한 은 향로가 연기를 뿜으며 대성당 천장을 가로질러 날아오른다.'],
        [DQ, '용이다! 불을 뿜는 은빛 용이 성전을 날고 있다! 산초, 내 창을—'],
        [SP, '나리, 창은 풍차에 부러졌잖습니까요! 그리고 저건 향로입니다요, 향로! 보타푸메이로라고요! 순례자들 땀 냄새 가리려고 피우는 거래요!'],
        [null, '은 향로가 머리 위를 스칠 듯 지나가며 향연기를 뿌리자, 돈키호테는 그 자리에 무릎을 꿇었다. 성가가 울려 퍼진다.'],
        [DQ, '…용이 아니라 향이었구나. 아니, 어쩌면 성인께서 내 어리석음을 향으로 덮어 주신 것인지도 모르지.'],
        [null, '돈키호테는 사도의 무덤 앞에서 둘시네아 공주와 모든 약한 이들을 위해 다시 기사의 맹세를 했다. 산초는 제단 뒤로 올라가 사도의 상을 꼭 껴안고 무언가를 오래 속삭였다.'],
        [SP, '(돌아와서) 사도님께 부탁드렸습니다요. 섬 하나만요. 작아도 좋으니까요.']
      ]);
      if (cervantes()) await play([['cervantes', '(멀찍이서 지켜보다가 혼잣말로) …저 기사와 종자의 이야기, 언젠가 꼭 책으로 써야겠군. 아무도 믿지 않겠지만.']]);
      await play([
        [DQ, '바다의 기사여. 순례는 끝났으나 편력 기사의 길은 끝나지 않소. 이 세상 바다 끝까지, 억울한 이를 돕고 거인을 무찌르러 가야 하오. 그대의 배에 나와 산초를 태워 주시겠소?'],
        [SP, '품삯은 필요 없습니다요, 나리. 제 품삯은 섬 하나로 한꺼번에 받겠습니다요! 바다에는 섬이 많다면서요?'],
        [DQ, '기사는 품삯을 받지 않는다. 받는 것은 영광뿐이지. 로시난테와 잿빛이도 함께 태워 주면 더할 나위 없겠소.']
      ]);
      var v = await UI.ask('돈키호테와 산초 판사가 품삯 없이 함께 바다로 가겠다고 한다.', [{ label: '두 사람을 배에 태운다', value: 1 }, { label: '라 만차로 돌려보낸다', value: 0 }], me());
      if (!v) {
        await play([[DQ, '…그대에게도 그대의 길이 있겠지. 바다의 기사여, 그대의 이름은 둘시네아 공주께 아뢰겠소. 잘 가시오!'], [SP, '나리, 다음에 섬 생기면 꼭 불러 주십쇼!']]);
        q.stage = 'parted'; q.done = U.dateNum(S().date);
        var so0 = G.Fame.add('so', Q.K.fameEnd);
        G.State.log('돈키호테·산초 판사와 산티아고 순례를 마치고 헤어졌다. (사교 명성 +' + so0 + ')');
        return;
      }
      var c = G.CITY_DATA[CORUNA];
      if (G.Legend && G.Legend.join) { G.Legend.join(DQ, c); G.Legend.join(SP, c); }
      q.stage = 'done'; q.done = U.dateNum(S().date);
      var so = G.Fame.add('so', Q.K.fameEnd);
      G.State.log('산티아고 데 콤포스텔라에서 순례를 마쳤다. 돈키호테와 산초 판사가 품삯 없이 항해사로 함께한다. (사교 명성 +' + so + ')');
      UI.toast('돈키호테 · 산초 판사 — 품삯을 받지 않는 항해사', 'heart', 5200);
      if (G.Disc && G.DISC.santiago && !G.Disc.foundByMe('santiago') && G.Disc.addHint) G.Disc.addHint('santiago', 'quixote');   // 대성당 자리를 알게 되었다
      await play([[DQ, '가자, 산초! 바다 너머에도 거인은 있을 것이다!'], [SP, '나리, 제발 이번엔 배의 돛을 거인이라고 하지 마십쇼…']]);
      if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(DQ); } catch (e) { console.error(e); } }
    } finally { await pc.stop(); }
  }

  // ---------------------------------------------------------------- 수첩 「할 일」 줄
  Q.html = function () {
    var s = S(), q = s && s.quix; if (!q || q.stage !== 'pilgrim') return '';
    var li = ROUTE.map(function (r) { var done = r.key && q[r.key]; return (done ? '✓ ' : '') + r.name + ' — ' + r.what + (r.key ? '' : ' (두 성소를 들른 뒤)') + (done ? '' : ' · ' + r.how); });
    return '<div class="sep"></div><h4 style="margin:0 0 8px">돈키호테와 산초의 산티아고 순례</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._quixHtml) { G.Court._quixHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + Q.html(); }; }
})(window.G = window.G || {});
