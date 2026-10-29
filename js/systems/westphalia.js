/* 베스트팔렌 조약 — 여든 해의 겨울이 끝나다 (G.Westphalia) 2026-10-29 사용자 요청
   「1648 베스트팔렌 조약. 네덜란드 독립 전쟁 이벤트와 연결. 30년 전쟁을 끝내고 독일 지역의 종교·영토 질서를 다시 짜며,
     네덜란드의 독립도 나라들 사이에서 인정받는다.」
   네덜란드 독립 전쟁 「개미와 베짱이」(js/systems/dutchwar.js — 1566~1575 암스테르담)의 뒷이야기다.
   그때 고른 편(s.dutchwar.side)·두 해 이른 독립(early)·배에 탄 할리나/페르베르크에 따라 말이 달라진다.
   역사는 바뀌지 않는다 — 뮌스터의 맹세(5.15)와 오스나브뤼크·뮌스터의 서명(10.24)은 그날 그대로 일어난다.
   ■ 도시: 암스테르담(24) · 브레멘(46) — 뮌스터·오스나브뤼크는 게임에 도시가 없어, 대표단을 따라 뭍길로 가는 장면으로 그린다
   ■ 흐름 (사람: js/data/westphalia.js)
     ① 뮌스터의 맹세 (1648.3.1~5.14, 암스테르담): 대표 아드리안 파우가 「여든 해 만의 평화」에 증인으로 함께 가자고 한다 (간다 / 사양)
        가면 5월 15일 뮌스터 시청 — 네덜란드 대표는 오른손 두 손가락을 들고, 에스파냐의 페냐란다 백작은 복음서와 십자가에 손을 얹는다.
        화가 테르보르흐가 그 방을 그린다 — (가) 그림 속 한 자리에 선다(스케치 · 사교 명성 +120) (나) 문가에서 지켜본다(+40)
     ①' 평화의 종 (1648.5.15~8.31, 암스테르담 — ①을 겪지 않았으면): 6월 5일 평화 선포를 앞뒤로 종이 울리는 도시 (사교 명성 +30)
     ② 1624년의 교회 (1648.6.1~10.23, 브레멘): 페르덴 땅의 마을 교회를 두고 루터파 목사와 수녀원장이 오스나브뤼크에 낼 청원서를 들고 다툰다.
        스웨덴 대표 살비우스의 말 — 「1624년 1월 1일에 누가 그 교회를 썼는가로 정한다(기준해)」
        (가) 기준해대로 — 1624년의 주인에게 (나) 한 교회를 두 신앙이 시간을 나눠 쓰게 한다 (다) 끼지 않는다
     소식: 뮌스터 조약 서명(1.30) · 뮌스터의 맹세(5.15) · 평화 선포(6.5) · 베스트팔렌 조약(10.24 — 종교·영토 질서, 시장 사건 westphaliapeace) · 교황의 항의(11.26)
     relevents의 rf_westphalia(10.24) 창은 이 소식이 대신 띄운다 (s.rel.seen) — 일지에는 이 소식이 남는다
   ■ 독립 전쟁과의 연결: side 'free'(할리나 편) · 'spain'(페르베르크 편) · early(독립 선언 1579) · 할리나/페르베르크가 배에 있는가
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/westphalia_*.webp — 개발노트에 그림 주문
   ■ 조정값: G.Westphalia.K   ■ 저장: s.westph = { oath: 'go'|'no', pose: 'in'|'door', feast, church: 'law'|'share'|'leave', told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var WP = G.Westphalia = {};
  function S() { return G.Game && G.Game.state; }
  var AMSTERDAM = 24, BREMEN = 46, FRANKFURT = 48;
  var K = WP.K = {
    sign: 16480130, oathFrom: 16480301, oathTo: 16480514, oath: 16480515, feastTo: 16480831, proclaim: 16480605,
    tableFrom: 16480601, tableTo: 16481023, peace: 16481024, pope: 16481126,
    fameIn: 120, fameDoor: 40, fameFeast: 30, fameLaw: 60, fameShare: 100
  };
  // 전쟁이 끝난 독일 — 총·대포가 남아돌고, 다시 짓는 도시에 목재·밀이 모자란다 (시장 사건, js/systems/economy.js)
  var PEACE_EV = { id: 'westphaliapeace', name: '베스트팔렌의 평화', scope: 'nation', r: 9, regions: [1], need: 'any', years: [9999, 9999], dur: [300, 400], lead: [0, 0],
    cats: { arms: 0.72 }, goods: { timber: 1.3, wheat: 1.22, iron: 1.15 },
    why: ['{place}에 서른 해 전쟁이 끝나 풀려난 용병들이 총과 칼을 헐값에 판다', '{place} 둘레의 불탄 마을들이 다시 집을 짓는다 — 목재와 밀이 모자라다'] };
  if (G.Econ && G.Econ.DEF && !G.Econ.DEF.westphaliapeace) G.Econ.DEF.westphaliapeace = PEACE_EV;

  var NEWS_AT = { sign: K.sign, oath: K.oath, proclaim: K.proclaim, peace: K.peace, pope: K.pope };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.westph) {
      s.westph = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.westph.told[k] = 1; });
    }
    if (!s.westph.told) s.westph.told = {};
    return s.westph;
  }
  WP.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function nation() { return S().player.nation; }
  // ---------------------------------------------------------------- 독립 전쟁 「개미와 베짱이」와의 연결
  function dw() { var s = S(); return (s && s.dutchwar) || {}; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function aboard(id) { var m = row(id); return !!(m && G.MATE[id] && !(R.mateHidden && R.mateHidden(m))); }
  WP.link = function () {
    var b = dw();
    return { side: b.side || null, done: b.step === 2 || !!b.joined || !!b.offer, early: !!b.early, halina: aboard('halina'), verberk: aboard('verberk'), met: !!b.met };
  };
  function MS(id, emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l || !l[1]) continue;
      var who = l[0] === 'P' ? me() : l[0] === 'halina' || l[0] === 'verberk' ? MS(l[0], l[2]) : l[0] && typeof l[0] === 'object' ? l[0] : l[0] ? H(l[0]) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  var PASTOR = 'wp_pastor', ABBESS = 'wp_abbess', COUNCIL = 'wp_councillor', CRIER = 'wp_crier';
  function keepsake(id, name, desc) {
    var p = S().player; if (p.items.some(function (x) { return x.id === id; })) return;
    p.items.push({ id: id, kind: 'keepsake', name: name, desc: desc });
  }
  function fame(kind, n) { return G.Fame && G.Fame.add ? G.Fame.add(kind, n) : 0; }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function years() { return 1648 - (WP.link().early ? 1579 : 1581); }   // 독립을 선언하고 인정받기까지

  // ================================================================ 날마다 — 소식
  WP.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, L = WP.link();
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('sign', true, 'scroll', '【뮌스터 조약】 1월 30일, 베스트팔렌의 뮌스터에서 에스파냐와 네덜란드 연방의 대표들이 평화 조약에 이름을 적었다. 에스파냐 왕이 네덜란드 일곱 주를 「자유롭고 주권을 가진 나라」로 인정한다. 1568년부터 여든 해를 끌어 온 싸움이다.' +
      (L.side === 'free' ? ' …암스테르담 운하 어귀에서 밀을 실어 보낸 그 밤으로부터도 일흔 해가 넘었다.' : L.side === 'spain' ? ' …페르베르크 저택의 「왕의 곳간」 이야기도 이제 옛날 일이 되었다.' : ''));
    news('oath', true, 'handshake', b.oath === 'go'
      ? '【뮌스터의 맹세】 5월 15일, 뮌스터 시청 회의실에서 두 나라 대표가 조약을 지키겠다고 맹세했다. 제독도 그 방에 있었다.'
      : '【뮌스터의 맹세】 5월 15일, 뮌스터 시청에서 에스파냐와 네덜란드의 대표들이 조약을 지키겠다고 맹세했다. 네덜란드 사람들은 오른손 두 손가락을 들었고, 에스파냐 대사는 복음서와 십자가에 손을 얹었다.');
    news('proclaim', true, 'castle', '【평화의 종】 6월 5일, 네덜란드의 모든 도시에서 평화가 선포되었다. 여든 해 전 바로 이날, 에흐몬트 백작과 호른 백작이 브뤼셀 광장에서 목이 잘렸다. 암스테르담의 교회 종이 하루 종일 울리고, 운하마다 불꽃이 오른다.' +
      (L.halina ? ' 할리나가 갑판에서 청어 한 마리를 높이 들고 웃는다. 「겨울이 끝났어요!」' : L.verberk ? ' 페르베르크가 부채를 접고 오래 종소리를 듣는다. 「큰 개미집과 작은 개미집이 이웃이 되었네요.」' : ''));
    if (!told.peace && t >= K.peace) {
      told.peace = 1;
      if (s.rel) { s.rel.seen = s.rel.seen || {}; s.rel.seen.rf_westphalia = 1; } else s.rel = { seen: { rf_westphalia: 1 } };   // 본래 소식(js/data/relevents.js) 대신 이 소식
      if (G.Econ && G.Econ.start && G.Econ.DEF && G.Econ.DEF.westphaliapeace) { try { var e = G.Econ.start('westphaliapeace', FRANKFURT, { k: 1 }); if (e) e.told = 'on'; } catch (er) { console.error(er); } }
      out.push({ icon: 'handshake', history: true, text:
        '【베스트팔렌 조약】 10월 24일, 오스나브뤼크와 뮌스터에서 황제와 스웨덴·프랑스가 평화 조약에 이름을 적었다. 프라하의 창문에서 시작된 서른 해 전쟁이 끝났다.\n' +
        '· 종교: 가톨릭·루터파에 더해 칼뱅파도 제국의 신앙으로 인정된다. 교회와 수도원의 주인은 1624년 1월 1일에 누가 가졌는가로 정한다. 다스리는 이와 믿음이 달라도 백성이 쫓겨나지 않는다.\n' +
        '· 땅: 프랑스는 메스·툴·베르됭과 알자스의 여러 도시를, 스웨덴은 서포메른·비스마르와 브레멘·페르덴 땅을 얻는다. 브란덴부르크는 동포메른과 마그데부르크·민덴 주교령을, 바이에른은 위쪽 팔츠와 선제후 자리를 지키고, 팔츠에는 여덟째 선제후 자리가 새로 생긴다.\n' +
        '· 나라: 스위스가 제국에서 벗어난 나라로 인정받는다. 제국의 제후들은 저마다 다른 나라와 동맹을 맺을 수 있다. 네덜란드의 독립은 이미 뮌스터에서 인정받았다 — 선언한 지 ' + years() + '년 만이다.' +
        (b.church === 'share' ? '\n…페르덴의 한 마을 교회에서는 오늘도 아침에는 라틴어 미사가, 낮에는 독일어 찬송이 울린다고 한다.' : b.church === 'law' ? '\n…페르덴의 한 마을 교회 문에는 「1624년 1월 1일」이라는 날짜가 새겨졌다고 한다.' : '') });
    }
    news('pope', true, 'scroll', '【교황의 항의】 교황 인노첸시오 10세가 베스트팔렌 조약이 교회의 권리를 빼앗았다며 「무효」라는 교서를 냈다. 그러나 조약에 이름을 적은 나라들은 아무도 귀 기울이지 않는다. 나라들 사이의 일을 교황이 정하던 때가 저물었다.');
    return out;
  };

  // ================================================================ ① 뮌스터의 맹세 (1648.3.1~5.14, 암스테르담)
  function oathOpen() { var b = st(), t = today(); return !!(b && !b.oath && cityNow() === AMSTERDAM && t >= K.oathFrom && t <= K.oathTo); }
  async function oath() {
    var b = st(), L = WP.link(), es = nation() === 'ES', nl = nation() === 'NL';
    await withPic('westphalia_barge', '뮌스터로 가는 배 (1648.4)', function () { return play([
      [null, '암스테르담 담 광장. 여든 해 전 청어 상인의 딸이 술통 위에서 외치던 그 광장에, 이제는 돌로 지은 큰 시청이 올라가는 중이다. 운하 어귀에 검은 깃발의 대표단 배가 매여 있다.'],
      ['wp_pauw', '아드리안 파우요. 홀란트의 대표로 뮌스터에 가오. 1월에 이름을 적은 조약을 5월 중순에 두 나라가 맹세로 굳히기로 했소.'],
      ['wp_pauw', L.side === 'free' && L.done
        ? '…그대 이름을 아오. 암스테르담 늙은이들이 아직도 운하의 밤 이야기를 하지. 포위된 도시로 밀을 실어 보낸 바다 사람 이야기를. 그 밤이 우리 독립을 두 해 앞당겼다고들 하오.'
        : L.side === 'spain' && L.done
          ? '그대가 그 옛날 페르베르크 저택의 곳간에 밀을 들였다는 바다 사람이로군. …괜찮소. 오늘은 우리도 그 왕의 사람들과 한 탁자에 앉으러 가니까.'
          : L.met ? '그대는 여든 해 전 담 광장에서 「개미와 베짱이」 다툼을 들었다는 그 바다 사람의 이야기를 아시오? 그 아가씨들의 다툼이 오늘에야 끝나오.'
            : '1568년부터 여든 해요. 할아버지들이 시작한 싸움을 손자들이 끝내러 가는 거요.'],
      L.halina ? ['halina', '(눈을 반짝이며) 뮌스터요? 개미의 곳간이 어느 왕의 것도 아니라고 적힌 종이를 내 눈으로 봐야겠어요. 제독님, 가요!'] : null,
      L.verberk ? ['verberk', '(부채를 천천히 펴며) 에스파냐 대사도 온다지요. 큰 개미집이 작은 개미집을 이웃으로 인정하는 자리라니… 그 얼굴을 보고 싶군요.'] : null,
      ['wp_pauw', es ? '에스파냐 깃발의 배로군. 오히려 잘됐소. 두 나라 모두의 눈이 있는 맹세가 더 무거울 테니. 증인으로 함께 가 주겠소?'
        : nl ? '네덜란드 배의 선장이라면 마땅히 그 방에 있어야지. 함께 갑시다.'
          : '바다 건너 나라의 선장이 그 방에 있으면, 이 평화가 두 나라만의 일이 아니라는 것을 보여 줄 수 있소. 함께 가 주겠소?']
    ]); });
    var v = await UI.ask('아드리안 파우가 뮌스터의 맹세에 증인으로 함께 가자고 한다.', [
      { label: '함께 간다 — 「여든 해의 끝을 보러」', value: 'go', icon: 'scroll' },
      { label: '사양한다 — 남의 나라 조약이다', value: 'no' }], me());
    if (v !== 'go') {
      b.oath = 'no';
      await play([['wp_pauw', '아쉽군. 6월 5일에는 이 도시의 종이 모두 울릴 거요. 그날 암스테르담에 있으면 들을 수 있소.']]);
      G.State.log('암스테르담에서 뮌스터로 가는 네덜란드 대표단의 초대를 사양했다.');
      refresh(); return;
    }
    b.oath = 'go';
    await withPic('westphalia_oath', '뮌스터의 맹세 (1648.5.15)', function () { return play([
      [null, '이레 동안 강과 뭍길을 따라 동쪽으로. 베스트팔렌의 뮌스터 — 성당의 탑과 박공지붕의 집들. 시청 2층 나무 벽의 회의실에 사람들이 빽빽이 들어찼다.'],
      [null, '긴 탁자 위에 두 개의 조약문이 놓였다. 한쪽에 검은 옷의 네덜란드 대표들, 다른 쪽에 붉은 칼 십자가를 단 에스파냐 대사.'],
      ['wp_penaranda', es ? '(제독을 알아보고 낮게) 폐하의 깃발이 이 방에 하나 더 있군. 고맙소. 오늘 나는 폐하의 이름으로, 폐하의 할아버지께서 잃으신 것을 잃었다고 적으러 왔소.' : '(지친 얼굴로 조약문을 내려다보며) 펠리페 국왕 폐하의 이름으로 이 조약을 지키겠다고 맹세하오.'],
      [null, '페냐란다 백작이 복음서와 십자가 위에 두 손을 얹는다. 네덜란드 대표들은 한 사람씩 오른손을 들어 두 손가락을 펴고 맹세의 말을 읽는다.'],
      ['wp_pauw', '…「이 평화를 굳게, 영원히 지키겠노라.」'],
      L.halina ? ['halina', '(제독의 소매를 꼭 쥐고 속삭인다) 담 광장의 술통에서 이 탁자까지, 여든 해가 걸렸네요. 장부 맨 끝에 오늘 날짜를 적을래요.', 'happy'] : null,
      L.verberk ? ['verberk', '(에스파냐 대사의 굽은 등을 오래 바라보다가) 겨울은 함께 났지요. 이제는 이웃으로 봄을 맞는 거예요. …이상하게 눈물이 나네요.'] : null,
      [null, '방 한구석에서 젊은 화가가 조그만 화판에 바쁘게 붓을 놀린다. 그가 제독과 눈이 마주치자 손짓한다.'],
      ['wp_terborch', '헤라르트 테르보르흐입니다. 이 방에 있는 사람을 하나하나 그려 넣고 있지요. 바다 사람의 얼굴이 하나 있으면 좋겠습니다 — 저기 창가, 대표님들 뒤에 서 주시겠습니까?']
    ]); });
    var v2 = await UI.ask('화가 테르보르흐가 그림 속에 서 달라고 한다.', [
      { label: '창가에 선다 — 그림 속 한 사람이 된다', value: 'in', icon: 'star' },
      { label: '문가에서 지켜본다', value: 'door' }], me());
    if (v2 === 'in') {
      b.pose = 'in';
      var so = fame('so', K.fameIn);
      keepsake('terborch_sketch', '테르보르흐의 스케치', '1648년 5월 15일 뮌스터 시청에서 화가 헤라르트 테르보르흐가 그린 작은 밑그림. 맹세하는 대표들 뒤, 창가에 선 바다 사람 하나가 있다. 「그림이 다 되면 이 얼굴도 그 안에 있을 겁니다.」');
      await play([['wp_terborch', '(붓을 멈추고 웃으며) 됐습니다. 이 밑그림은 가지십시오. 큰 그림이 끝나면 바다 사람 얼굴도 그 안에 있을 겁니다.']]);
      G.State.log('뮌스터 시청에서 에스파냐와 네덜란드의 평화 맹세를 지켜보았다. 화가 테르보르흐의 그림 속 창가에 섰다. (사교 명성 +' + so + ')');
    } else {
      b.pose = 'door';
      var so2 = fame('so', K.fameDoor);
      G.State.log('뮌스터 시청에서 에스파냐와 네덜란드의 평화 맹세를 문가에서 지켜보았다. (사교 명성 +' + so2 + ')');
    }
    refresh();
  }

  // ================================================================ ①' 평화의 종 (1648.5.15~8.31, 암스테르담 — ①을 겪지 않았으면)
  function feastOpen() { var b = st(), t = today(); return !!(b && b.oath !== 'go' && !b.feast && cityNow() === AMSTERDAM && t >= K.oath && t <= K.feastTo); }
  async function feast() {
    var b = st(), L = WP.link(), t = today(); b.feast = 1;
    await withPic('westphalia_bells', '평화의 종 (1648.6)', function () { return play([
      [null, t < K.proclaim ? '암스테르담. 운하마다 깃발과 꽃줄이 걸린다. 사람들이 6월 5일에 울릴 종을 기다린다. 뮌스터에서 대표들이 맹세하고 돌아왔다고 한다.'
        : '암스테르담. 교회 종이 하루 종일 울린다. 담 광장에 포도주 통이 굴러 나오고, 운하 위로 불꽃이 오른다. 여든 해 만의 평화다.'],
      [CRIER, '「에스파냐 왕 펠리페 폐하께서 네덜란드 연방의 일곱 주를 자유롭고 주권을 가진 나라로 인정하신다—」 들었소? 이제 우리 배는 누구의 허락도 없이 어느 바다로든 간다!'],
      [null, L.side === 'free' ? '광장 한쪽에서 늙은 어부가 아이들에게 옛이야기를 한다. 「포위된 레이던에 밀을 실어 보낸 바다 사람이 있었단다. 그날 밤 운하 어귀에서…」 제독은 그 이야기의 끝을 안다.'
        : L.side === 'spain' && !L.verberk ? '광장 한쪽에서 페르베르크 집안의 늙은 하녀가 혼잣말을 한다. 「아가씨가 이 종소리를 들으셨으면 뭐라고 하셨을까. 큰 개미집, 작은 개미집…」'
          : '광장의 술통 위에서 붉은 리본을 단 소녀가 「개미와 베짱이」 노래를 부른다. 사람들이 따라 부른다. 「여름 내 청어를 잡은 우리가 개미—」'],
      L.halina ? ['halina', '제독님, 저 노래 들려요? 내가 술통 위에서 외치던 말이 노래가 됐어요. …베짱이들도 오늘은 같이 춤을 추네요.', 'happy'] : null,
      L.verberk ? ['verberk', '종소리가 이렇게 많은 도시는 처음 봐요. 마드리드에서도 오늘 종이 울릴까요? …울렸으면 좋겠어요.'] : null
    ]); });
    var so = fame('so', K.fameFeast);
    G.State.log('암스테르담에서 여든 해 만의 평화를 알리는 종소리를 들었다. (사교 명성 +' + so + ')');
    refresh();
  }

  // ================================================================ ② 1624년의 교회 (1648.6.1~10.23, 브레멘)
  function tableOpen() { var b = st(), t = today(); return !!(b && !b.church && cityNow() === BREMEN && t >= K.tableFrom && t <= K.tableTo); }
  async function table() {
    var b = st(), L = WP.link();
    await withPic('westphalia_church', '1624년의 교회 (1648)', function () { return play([
      [null, '브레멘 시청 앞. 상인들이 수군댄다. 오스나브뤼크에서 스웨덴이 브레멘 둘레의 페르덴 땅을 얻게 된다는 소문이다.'],
      [COUNCIL, '스웨덴 왕관이 우리 성벽 밖을 다 두르게 되오. 그래도 브레멘 시는 황제께 받은 자유시의 특권이 있으니 우리 것이오. …그보다 저 두 사람 좀 보시오. 오스나브뤼크로 가는 마차를 서로 먼저 타겠다고 싸우고 있소.'],
      [PASTOR, '우리 마을 사람은 백 명 중 아흔 명이 루터파요! 서른 해 전쟁 동안 황제군이 교회를 빼앗아 미사를 드렸다고 그게 저 수녀원 것이 될 수는 없소!'],
      [ABBESS, '그 교회는 이백 년 동안 우리 수녀원의 것이었습니다. 루터파가 그걸 빼앗은 것은 고작 여든 해 전이지요.'],
      [null, '마차 곁에 금테 안경을 쓴 스웨덴 신사가 서 있다. 오스나브뤼크 회의에서 잠깐 돌아온 길이라고 한다.'],
      ['wp_salvius', '요한 아들레르 살비우스요, 스웨덴 대표. 오스나브뤼크에서 정한 셈은 이렇소 — 「1624년 1월 1일에 누가 그 교회를 쓰고 있었는가.」 그날이 기준이오. 장부처럼 깔끔하지.'],
      [PASTOR, '1624년 정월이면… 황제군이 우리 마을에 있던 때요! 그날 미사를 드린 건 군대의 사제였소.'],
      [ABBESS, '그러니 그날 교회는 가톨릭의 것이었지요. 조약대로 하면 됩니다.'],
      L.halina ? ['halina', '(제독에게 낮게) 날짜 하나로 신앙을 정하다니, 꼭 장부 마감일 같네요. …그런데 마감일에 우연히 남의 물건이 곳간에 있었으면, 그게 내 것이 되나요?'] : null,
      L.verberk ? ['verberk', '(제독에게 낮게) 규칙은 규칙이에요. 다만 규칙이 사람을 쫓아내지는 않는다고 조약에 적혔다지요. 그 틈을 찾아보세요.'] : null,
      ['wp_salvius', '바다의 선장, 그대가 마차에 같이 타서 두 사람의 말을 정리해 주겠소? 회의에 들고 갈 청원서가 한 장이면 좋겠는데.']
    ]); });
    var v = await UI.ask('페르덴의 마을 교회 — 누구의 교회로 청원서를 쓸까?', [
      { label: '「1624년 1월 1일」 — 조약의 기준해대로 수녀원에', value: 'law', icon: 'scroll' },
      { label: '한 교회를 두 신앙이 시간을 나눠 쓰자 — 아침엔 미사, 낮엔 찬송', value: 'share', icon: 'handshake' },
      { label: '끼지 않는다', value: 'leave' }], me());
    if (v === 'law') {
      b.church = 'law';
      var so = fame('so', K.fameLaw);
      await play([
        ['wp_salvius', '깔끔하오. 날짜는 다툼을 끝내는 가장 값싼 판사지. 회의에서 그대로 읽겠소.'],
        [PASTOR, '(모자를 구겨 쥐고) …교회는 잃었지만, 조약에 다스리는 이와 믿음이 달라도 쫓겨나지 않는다고 적혔다지요. 마을 헛간에서라도 찬송을 부르겠소.']
      ]);
      G.State.log('브레멘에서 페르덴 마을 교회의 청원서를 「1624년 기준해」대로 써 주었다. (사교 명성 +' + so + ')');
    } else if (v === 'share') {
      b.church = 'share';
      var so2 = fame('so', K.fameShare);
      await play([
        [ABBESS, '(한참 말이 없다가) …한 지붕 아래 두 미사라. 옛날 어떤 마을에서는 그렇게 한다고 들은 적이 있습니다. 제단은 우리 것으로 두고, 의자는 함께 쓰지요.'],
        [PASTOR, '종은 누가 치오? …좋소, 번갈아 칩시다. 서른 해를 싸웠는데 종 하나쯤 나눠 못 쓸까.'],
        ['wp_salvius', '(안경을 고쳐 쓰며 웃는다) 장부에 칸이 하나 늘었군. 회의에서 이런 마을이 하나쯤 있다는 걸 말해 두겠소. 위원들이 웃을 거요 — 좋은 뜻으로.']
      ]);
      keepsake('verden_bell_rope', '페르덴 교회의 종줄 한 토막', '1648년 브레멘에서, 한 마을 교회를 가톨릭과 루터파가 시간을 나눠 쓰게 한 청원서의 답례로 받은 종줄 한 토막. 두 가지 색 실로 꼬여 있다.');
      G.State.log('브레멘에서 페르덴 마을 교회를 두 신앙이 나눠 쓰는 청원서를 써 주었다. (사교 명성 +' + so2 + ')');
    } else {
      b.church = 'leave';
      G.State.log('브레멘에서 페르덴 마을 교회를 둘러싼 다툼에 끼지 않았다.');
    }
    refresh();
  }

  // ================================================================ 도시에 들어설 때 · 수첩
  WP.pending = function () { var s0 = S(); if (!s0) return false; return oathOpen() || feastOpen() || tableOpen(); };
  WP.check = async function () {
    if (WP._busy) return false; WP._busy = true;
    WP.evDay = U.dayIndex(S().date);
    try {
      if (oathOpen()) await oath();
      else if (feastOpen()) await feast();
      else if (tableOpen()) await table();
    } catch (e) { console.error(e); }
    WP._busy = false;
    return true;
  };
  WP.html = function () {
    var s0 = S(), b = s0 && s0.westph; if (!b) return '';
    var t = today(), li = [];
    if (!b.oath && t >= K.oathFrom - 200 && t <= K.oathTo && (WP.link().met || nation() === 'NL')) li.push('1648년 3월~5월 14일 암스테르담 — 뮌스터로 가는 네덜란드 대표단');
    if (!b.church && t >= K.tableFrom && t <= K.tableTo) li.push('1648년 6월~10월 브레멘 — 오스나브뤼크 회의로 가는 청원서');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">베스트팔렌의 평화</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._wpHtml) { G.Court._wpHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + WP.html(); }; }
  WP._t = { oath: oath, feast: feast, table: table };
})(window.G = window.G || {});
