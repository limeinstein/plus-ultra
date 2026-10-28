/* 명의 베이징 정권 붕괴 · 청의 입관 — 황제의 마지막 편지 (G.MingFall) 2026-10-29 사용자 요청
   「명의 베이징 정권 붕괴·청의 입관 이벤트. 숭정제의 마지막 유언을 숭정제의 옛 여인(진원원)에게 전한다.
     그녀는 절세미녀. 숭정제가 떠난 곳에서 더 지낼 까닭이 없다며 제독의 배에 오른다.」
   역사는 바뀌지 않는다. 북경은 1644년 4월 25일 이자성에게 떨어지고 숭정제는 매산(경산)의 홰나무에 목을 맨다.
   5월 27일 오삼계가 산해관을 열고, 6월 6일 도르곤의 청군이 북경에 든다. 바뀌는 것은 마지막 편지가 누구의 손을 거쳐 누구에게 닿는가다.
   ■ 도시: 북경(188, 내륙 — 바닷가에 내려 뭍길로) · 소식은 어디서나
   ■ 사람: 숭정제·왕승은·아담 샬·유종민 (js/data/mingfall.js) · 진원원 = 지역 사람 동료 h_chenyuanyuan (js/data/regionfolk.js)
     진원원은 이 사건이 끝나기 전(1646년까지)에는 술집에 나오지 않는다 (eventOnly — 끝나면 다시 소주 술집에)
   ■ 흐름
     ① 매산의 밤 (1644.3.20~4.24, 북경): 이자성의 군대가 성을 에워쌌다. 아담 샬이 대포 주조장에서 제독을 맞고, 환관 왕승은이 「바다 건너온 선장」을 매산으로 데려간다.
        흰 겹옷의 황제 — 한 해 전 궁에 들였다가 석 달 만에 돌려보낸 강남의 가희 이야기. 「짐이 떠난 뒤에 그 아이에게」 — 비단에 싼 편지와 옥비녀 (받는다 / 감히 받을 수 없다)
     ② 늙은 궁녀 (1644.4.25~1646.12.31, 북경 — 편지가 없으면): 황제의 소매에서 나온, 끝내 부치지 못한 편지. 옷깃에 쓴 유언 이야기 (받는다 / 거절 — 30일 뒤 다시)
     ③ 마지막 편지 (1644.4.25~1646.12.31, 북경 — 편지가 있으면):
        · 대순의 북경 (~5.26): 유종민이 차지한 저택에 갇혀 있다 — (가) 문지기에게 뇌물 (나) 담을 넘는다(육상전) (다) 다음에
        · 무너지는 북경 (5.27~6.5): 이자성의 군대가 불을 지르고 물러난다. 그녀는 빠져나와 매산의 홰나무 아래에 있다
        · 청의 북경 (6.6~): 변발한 기병들 사이, 매산의 홰나무 아래
        편지를 읽고 비파를 탄 뒤 — 「폐하께서 떠나신 이 성에서 더 지낼 까닭이 없습니다」 → 태운다(동료) / 아직은 (다음 북경 입항 때 다시)
        이미 제독의 배에 있으면(옛 저장 — 소주 술집에서 맞은 경우) 배 위에서 편지를 읽는다
     소식: 이자성이 서안에서 대순을 세우다(1644.2.8) · 북경 함락과 황제의 죽음(4.25) · 산해관(5.27 — 진원원이 이미 배에 있으면 말이 달라진다) ·
           이자성이 자금성을 불태우고 물러나다(6.4) · 청군이 북경에 들다(6.6) · 순치제가 북경에서 즉위하다(10.30) · 남경 함락(1645.6.8)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/ming_*.webp — 개발노트에 그림 주문
   ■ 조정값: G.MingFall.K   ■ 저장: s.mingFall = { night: 'take'|'no', maid: 'take'|'no', maidCool, letter: 'carry'|'done', way: 'bribe'|'wall',
       wallCool, joined, asked, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var MF = G.MingFall = {};
  function S() { return G.Game && G.Game.state; }
  var BEIJING = 188, ID = 'h_chenyuanyuan', LETTER = 'chongzhen_letter';
  var K = MF.K = {
    shun: 16440208, nightFrom: 16440320, nightTo: 16440424, fall: 16440425,
    passAt: 16440527, burn: 16440604, qing: 16440606, shunzhi: 16441030, nanjing: 16450608,
    last: 16461231, maidCool: 30, wallCool: 20,
    bribe: 1200, guards: 35, fameJoin: 150, loyal: 90
  };
  MF.SKILLS = { music: 3, speech: 3, art: 2, cook: 1 };

  // ---------------------------------------------------------------- 진원원: 지역 사람 동료를 이 사건의 동료로
  (function setup() {
    var m = G.MATE && G.MATE[ID]; if (!m) return;
    m.sk = JSON.parse(JSON.stringify(MF.SKILLS)); m.skBoost = 1;
    m.desc = '강남 제일의 미인. 곤곡 무대에서 홍낭을 노래하면 객석이 숨을 죽였다는 소주의 가희. 한때 숭정제의 궁에 들었다가 석 달 만에 돌려보내졌다. 노래와 비파, 시와 그림에 두루 밝다.';
    // 사건이 끝나기 전에는 술집에 나오지 않는다 — 1647년부터, 또는 사건이 끝나면 다시 소주 술집에 (js/systems/frontier.js F.mateReady)
    try {
      Object.defineProperty(m, 'eventOnly', { configurable: true, enumerable: true, get: function () {
        var s = S(); if (!s || !s.date) return true;
        var b = s.mingFall; if (b && (b.joined || b.letter === 'done')) return false;
        return U.dateNum(s.date) <= K.last;
      } });
    } catch (e) { m.eventOnly = true; }
  })();

  var NEWS_AT = { shun: K.shun, fall: K.fall, pass: K.passAt, burn: K.burn, qing: K.qing, shunzhi: K.shunzhi, nanjing: K.nanjing };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.mingFall) {
      s.mingFall = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.mingFall.told[k] = 1; });
    }
    if (!s.mingFall.told) s.mingFall.told = {};
    return s.mingFall;
  }
  MF.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function yuan(emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(ID, emo) : { name: '진원원', lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function aboard() { return S().mates.some(function (x) { return x.id === ID; }); }
  function gone() { return !!S().flags['gone_' + ID]; }
  function hasLetter() { return S().player.items.some(function (x) { return x.id === LETTER; }); }
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var who = l[0] === 'P' ? me() : l[0] === 'YUAN' ? yuan(l[2]) : l[0] && typeof l[0] === 'object' ? l[0] : l[0] ? H(l[0]) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  var MAID = H('ming_old_maid'), GATE = H('ming_gate_guard'), BANNER = H('qing_banner_soldier');
  function giveLetter() {
    var p = S().player; if (hasLetter()) return;
    p.items.push({ id: LETTER, kind: 'keepsake', name: '숭정제의 마지막 편지', desc: '1644년 봄, 명의 마지막 황제 숭정제가 「원원에게」라고 겉봉에 쓴 편지. 노란 비단에 싸여 있고, 매화를 새긴 옥비녀 하나가 함께 들어 있다. 「짐이 떠난 뒤에」 전해 달라고 했다.' });
  }
  function dropLetter() { var p = S().player; p.items = p.items.filter(function (x) { return x.id !== LETTER; }); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  async function fight(name, n, kind) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, { kind: kind, guns: false }); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }

  // ================================================================ 날마다 — 소식
  MF.daily = function () {
    var b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, joined = !!b.joined || aboard();
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('shun', true, 'scroll', '【대순】 섬서의 반란군 우두머리 이자성이 서안에서 스스로 왕이 되어 나라 이름을 「대순」이라 했다. 굶주린 농민들이 「세금을 걷지 않는 틈왕」을 따라 동쪽으로 몰려간다. 그 길 끝에는 북경이 있다.');
    news('fall', true, 'skull', b.night === 'take'
      ? '【북경 함락】 4월 25일 새벽, 창의문이 안에서 열리고 이자성의 군대가 북경에 들었다. 숭정제는 매산의 홰나무에 목을 맸다. 환관 왕승은이 그 곁에서 함께 죽었다. …지난밤 그 나무 아래에서 받은 노란 비단 꾸러미가 아직 제독의 품에 있다.'
      : '【북경 함락】 4월 25일, 이자성의 군대가 북경에 들었다. 명의 숭정제는 자금성 뒤 매산의 홰나무에 목을 맸다고 한다. 옷깃에는 「짐의 몸은 도적이 찢어도 좋으나 백성은 한 사람도 다치게 하지 말라」는 글이 남았다. 이백칠십여 해를 이어 온 명의 북경이 무너졌다.');
    news('pass', true, 'cannon', joined
      ? '【산해관】 산해관을 지키던 장수 오삼계가 관문을 열고 만주의 청군을 들였다. 청군과 함께 이자성의 군대를 크게 무찔렀다고 한다. 사람들은 「오삼계가 빼앗긴 애첩 진원원 때문에 관문을 열었다」고 수군댄다. …그 여인은 그날 이미 제독의 배에 있었다.'
      : '【산해관】 5월 27일, 만리장성 동쪽 끝 산해관을 지키던 오삼계가 관문을 열고 도르곤의 청군을 들였다. 이자성의 군대는 하루 만에 무너졌다. 사람들은 「오삼계가 이자성에게 빼앗긴 애첩 진원원 때문에 관문을 열었다」고 노래한다.');
    news('burn', true, 'skull', '【자금성의 불】 이자성이 서둘러 황제의 자리에 오르더니, 이튿날 자금성 여러 전각에 불을 지르고 서쪽으로 달아났다. 북경 하늘이 사흘 동안 붉었다고 한다.');
    news('qing', true, 'castle', '【청의 입관】 6월 6일, 섭정왕 도르곤이 이끄는 청군이 북경에 들었다. 도르곤은 숭정제를 예를 갖춰 장사 지내라 하고, 사흘 동안 상복을 입게 했다. 그리고 북경 사람들에게 머리를 깎고 뒷머리를 땋으라(변발) 한다.');
    news('shunzhi', true, 'crown', '【순치제】 여섯 살 순치제가 만주의 성경(심양)에서 북경으로 옮겨 와 자금성에서 다시 즉위했다. 이제 북경은 청의 서울이다.');
    news('nanjing', true, 'castle', '【남경 함락】 청군이 양자강을 건너 남경을 차지했다. 남쪽에 세운 명의 황제(홍광제)는 사로잡혔다. 명의 이름은 이제 더 남쪽 바다와 산속에만 남았다.');
    return out;
  };

  // ================================================================ ① 매산의 밤 (1644.3.20~4.24)
  function nightOpen() { var b = st(), t = today(); return !!(b && !b.night && !hasLetter() && cityNow() === BEIJING && t >= K.nightFrom && t <= K.nightTo); }
  async function night() {
    var b = st();
    await withPic('ming_foundry', '흠천감의 대포 (1644.4)', function () { return play([
      [null, '북경. 성문은 닫혔고 성벽 위에는 병사가 드문드문 서 있다. 몇 달째 녹봉을 받지 못했다고 한다. 서쪽 하늘에 이자성 군대의 연기가 오른다.'],
      ['schall', '(대포 주조장에서 그을음을 털며) 바다 건너 사람을 여기서 보다니! 나는 아담 샬이오. 황제께 하늘의 셈을 해 드리고, 요즘은 대포를 부어 드리지. …그러나 대포를 쏠 병사가 없구려.'],
      ['schall', '오늘 밤 누가 그대를 찾아올 거요. 내가 그대 이야기를 했소. 「바다를 건너온 선장이 성안에 있다」고. 미안하오. 그분께는 이제 그런 사람이 필요하다오.']
    ]); });
    await withPic('ming_meishan', '매산의 밤 (1644.4.24)', function () { return play([
      [null, '밤. 등불 하나가 여관 문을 두드린다. 붉은 옷의 환관이 떨리는 손으로 등불을 든다.'],
      ['wangchengen', '사례감의 왕승은이오. 묻지 말고 따라오시오. 폐하께서 바다 건너온 선장을 보자 하시오.'],
      [null, '자금성 뒤, 매산. 궁 안에서 울음소리가 멀리 들린다. 언덕 위 늙은 홰나무 아래, 흰 겹옷 한 벌만 걸친 젊은 사내가 서 있다. 상투는 풀어 헤쳐졌고, 눈은 붉다.'],
      ['chongzhen', '그대가 바다의 선장인가. 짐은 열일곱 해를 이 자리에 앉아 있었다. 신하들은 짐을 그르쳤고, 짐은 하늘을 그르쳤다. 내일이면 이 성은 도적의 것이 된다.'],
      ['chongzhen', '한 해 전, 전 황친이 강남의 가희 하나를 궁에 들였다. 원원이라 했지. 짐은 그 아이의 노래를 꼭 한 번 들었다. 나라 곳곳이 불타는데 짐이 노래를 들을 수는 없었다. 석 달 만에 돌려보냈다.'],
      ['chongzhen', '…짐이 이 자리에서 한 일 가운데, 그것만은 드물게 옳았다. 불타는 집에 새를 들일 수는 없으니.'],
      [null, '황제가 노란 비단 꾸러미 하나를 내민다. 겉에 「원원에게」라고 쓰여 있다. 꾸러미 사이로 옥비녀 끝이 비친다.'],
      ['chongzhen', '그 아이가 어디에 있든, 짐이 떠난 뒤에 전해 다오. 짐의 신하들은 이제 아무도 믿을 수 없다. 바다에서 온 사람이라면… 바다처럼 멀리 가져가 주겠지.']
    ]); });
    var v = await UI.ask('숭정제가 「원원에게」라고 쓴 꾸러미를 내민다.', [
      { label: '두 손으로 받는다 — 「반드시 전하겠습니다」', value: 'take', icon: 'scroll' },
      { label: '감히 황제의 편지를 받을 수 없다', value: 'no' }], me());
    if (v === 'take') {
      b.night = 'take'; giveLetter();
      await play([
        ['chongzhen', '(처음으로 희미하게 웃는다) 고맙다. …이제 가라. 왕승은, 이 사람을 성 아래까지 데려다주어라.'],
        ['wangchengen', '(골목을 내려오며 낮게) 새벽에 성문 하나가 안에서 열릴 거요. 그 틈에 나가든, 숨어 있든 하시오. 나는 폐하께 돌아가오. …끝까지 곁에 있을 거요.']
      ]);
      G.State.log('북경 매산의 홰나무 아래에서 숭정제에게 「원원에게」라고 쓴 마지막 편지를 받았다.');
      UI.toast('숭정제의 마지막 편지 — 황제가 떠난 뒤 진원원에게', 'scroll', 6000);
    } else {
      b.night = 'no';
      await play([['chongzhen', '…그런가. 짐의 마지막 부탁도 바다를 건너지 못하는구나. 가라.']]);
      G.State.log('북경 매산에서 숭정제의 마지막 부탁을 사양했다.');
    }
    refresh();
  }

  // ================================================================ ② 늙은 궁녀 (1644.4.25~ — 편지가 없으면)
  function maidOpen() {
    var b = st(), t = today(), s = S();
    return !!(b && b.maid !== 'take' && !b.letter && !hasLetter() && !gone() && cityNow() === BEIJING && t >= K.fall && t <= K.last && !(b.maidCool && s.day < b.maidCool));
  }
  async function maid() {
    var b = st(), t = today();
    await withPic('ming_robe', '옷깃의 유언 (1644)', function () { return play([
      [null, t < K.qing ? '북경. 거리마다 대순의 붉은 깃발이 걸렸다. 병사들이 부잣집 대문을 두드리며 「은을 내놓으라」고 소리친다.' : '북경. 성문마다 청나라의 깃발이 걸렸다. 변발한 기병들이 거리를 오간다. 자금성 여러 전각은 아직 검게 그을려 있다.'],
      [MAID, '(골목 어귀에서 제독의 소매를 잡는다) 바다 건너온 선장이시지요? 나는 전귀비 마마를 모시던 궁녀요. 마마는 두 해 전에 돌아가셨고… 폐하께서도 떠나셨소.'],
      [MAID, '그날 아침 매산의 홰나무 아래에서 폐하를 내린 것은 우리였소. 옷깃에는 붉은 붓으로 쓴 글이 있었지. 「짐의 몸은 도적이 찢어도 좋으나, 백성은 한 사람도 다치게 하지 말라.」'],
      [MAID, '그리고 소매 안에 이것이 있었소. 「원원에게」. 마마의 아버님 댁에 계시던 그 강남의 아가씨 말이오. 폐하께서 끝내 부치지 못하신 편지요.'],
      [MAID, '궁에 남은 우리는 문밖에도 못 나가오. 바다의 선장은 어디든 가지 않소? 그분께… 전해 주시오.']
    ]); });
    var v = await UI.ask('늙은 궁녀가 숭정제의 마지막 편지를 내민다.', [
      { label: '받는다 — 「제가 전하겠습니다」', value: 'take', icon: 'scroll' },
      { label: '남의 나라 황실의 일이다 — 거절한다', value: 'no' }], me());
    if (v === 'take') {
      b.maid = 'take'; giveLetter();
      await play([[MAID, '(눈물을 훔치며) 그 아가씨는 노래만큼 얼굴이 고운 분이오. 한 번 보면 잊지 못할 거요. …부디.']]);
      G.State.log('북경에서 늙은 궁녀에게 숭정제의 마지막 편지를 받았다. 「원원에게」라고 쓰여 있다.');
    } else {
      b.maid = 'no'; b.maidCool = S().day + K.maidCool;
      G.State.log('북경에서 숭정제의 마지막 편지를 전해 달라는 궁녀의 부탁을 거절했다.');
    }
    refresh();
  }

  // ================================================================ ③ 마지막 편지 (1644.4.25~1646 — 편지가 있으면)
  function deliverOpen() {
    var b = st(), t = today(), s = S();
    if (!b || !hasLetter() || b.letter === 'done' || gone() || t < K.fall) return false;
    if (aboard()) return cityNow() != null;   // 이미 배에 있으면 — 다음에 어느 도시에 들든 배 위에서
    return cityNow() === BEIJING && t <= K.last && !(b.wallCool && s.day < b.wallCool);
  }
  async function deliverAboard() {
    var b = st();
    await play([
      [null, '밤의 갑판. 제독이 노란 비단 꾸러미를 내밀자, 진원원의 손이 멈춘다. 겉봉의 글씨를 알아본 것이다.'],
      ['YUAN', '…이 글씨. 한 해 전 궁에서 꼭 한 번 뵌 그분의 글씨예요.', 'sad']
    ]);
    await readLetter();
    b.letter = 'done'; dropLetter();
    var row = S().mates.filter(function (x) { return x.id === ID; })[0]; if (row) row.loyal = Math.min(100, (row.loyal || 70) + 15);
    await play([['YUAN', '이제 이 배가 제 집이에요. 그분도 그러기를 바라셨을 거예요.', 'happy']]);
    G.State.log('배 위에서 진원원에게 숭정제의 마지막 편지를 전했다.');
    refresh();
  }
  async function readLetter() {
    await play([
      [null, '비단을 풀자 매화를 새긴 옥비녀가 미끄러져 나온다. 그녀가 편지를 소리 내어 읽는다. 목소리가 떨린다.'],
      ['YUAN', '「원원에게. 한 해 전 그대를 돌려보낸 일을 짐은 한 번도 뉘우친 적이 없다. 불타는 집에 새를 들일 수는 없었으니.」', 'sad'],
      ['YUAN', '「이제 그 집이 무너진다. 짐이 떠난 이 성에 그대가 머물 까닭은 없다. 누구의 것도 되지 말고, 노래가 들리는 곳으로 가라. 그대의 노래는 짐이 이 자리에서 들은 마지막 좋은 것이었다. — 유검」', 'sad'],
      [null, '그녀는 옥비녀를 머리에 꽂고, 오래 아무 말이 없다. 이윽고 비파를 무릎에 올린다. 처음 듣는 가락이다. 바람이 멎은 것처럼 둘레가 조용해진다.']
    ]);
  }
  async function deliver() {
    if (aboard()) return deliverAboard();
    var b = st(), t = today(), p = S().player, c = G.CITY_DATA[BEIJING];
    var phase = t < K.passAt ? 'shun' : t < K.qing ? 'burn' : 'qing';
    if (phase === 'shun') {
      await withPic('ming_mansion', '대순의 저택 (1644)', function () { return play([
        [null, '북경 서쪽의 큰 저택. 오삼계의 아버지 오양의 집이었다. 지금 대문에는 대순의 붉은 깃발이 걸렸고, 안에서 술 취한 웃음소리가 흘러나온다.'],
        [GATE, '(창을 가로막으며) 유종민 장군의 집이다. 장군께서 강남의 미인을 얻으셨지. 오늘은 아무도 못 들어간다!']
      ]); });
      var opts = [];
      if (p.gold >= K.bribe) opts.push({ label: '문지기에게 은을 쥐여 준다 (금화 ' + U.num(K.bribe) + ')', value: 'bribe', icon: 'coin' });
      opts.push({ label: '밤에 담을 넘는다 — 칼을 뽑을 각오로', value: 'wall', icon: 'sword' });
      opts.push({ label: '오늘은 물러난다', value: 'later' });
      var v = await UI.ask('진원원은 유종민이 차지한 저택에 있다.', opts, me());
      if (v === 'bribe' && p.gold >= K.bribe) { p.gold -= K.bribe; b.way = 'bribe'; await play([[GATE, '(은을 소매에 넣고 눈을 돌린다) …뒷마당 별채다. 한 식경(30분)만이다.']]); }
      else if (v === 'wall') {
        var res = await fight('대순의 병사들', K.guards, 'garrison');
        if (res !== 'win') {
          b.wallCool = S().day + K.wallCool;
          await play([[null, '담 위에서 들킨 제독의 사람들은 골목으로 쫓겨났다. 저택의 경비가 더 단단해졌다. 며칠 지나 다시 와야겠다.']]);
          G.State.log('북경에서 유종민의 저택 담을 넘다가 쫓겨났다.'); refresh(); return;
        }
        b.way = 'wall';
        await play([[null, '쓰러진 병사들 사이로 뒷마당이 열린다. 술에 취한 장군은 안채에서 아무것도 모른다.']]);
      } else { await play([[null, '제독은 저택 앞을 떠났다. 대문 안에서 비파 소리가 아주 잠깐 들렸다가 끊겼다.']]); refresh(); return; }
      await play([
        [null, '뒷마당 별채. 등불 아래 한 여인이 창가에 앉아 있다가 돌아본다. 그 얼굴에 제독은 숨을 멈춘다. 강남 사람들이 왜 「원원」이라는 이름을 시로 노래하는지 이제야 알 것 같다.'],
        [null, '눈썹은 먼 산처럼 가늘고, 눈은 젖은 듯 맑다. 해진 비단옷을 입고 있는데도, 방 안의 등불이 모두 그녀 쪽으로 기우는 것 같다.'],
        ['YUAN', '…바다 냄새가 나는 분이군요. 대순의 사람은 아니시지요. 무슨 일로 이 갇힌 새를 보러 오셨나요?']
      ]);
    } else {
      await withPic('ming_tree', '매산의 홰나무 (1644)', function () { return play([
        [null, phase === 'burn'
          ? '북경. 자금성 쪽에서 검은 연기가 치솟는다. 이자성의 군대가 짐수레에 은을 싣고 서쪽 성문으로 몰려 나간다. 거리에는 버려진 붉은 깃발이 밟힌다. 오삼계의 집안은 이자성의 손에 몰살당했다고 한다.'
          : '북경. 성문마다 청나라의 깃발이 걸렸다. 변발한 기병들이 거리를 오가고, 자금성의 전각들은 아직 검게 그을려 있다.'],
        [null, '매산에 오른다. 언덕 위 늙은 홰나무 아래, 누군가 향 한 대를 피워 놓았다. 그 앞에 한 여인이 무릎을 꿇고 있다.'],
        phase === 'qing' ? [BANNER, '(언덕 아래에서 말을 세우고) 그 여인을 아는가? 평서왕(오삼계)께서 찾으신다는 소문이 있다. …뭐, 우리 일은 아니지.'] : null,
        [null, '여인이 고개를 든다. 향 연기 너머의 얼굴에 제독은 숨을 멈춘다. 눈썹은 먼 산처럼 가늘고, 눈은 젖은 듯 맑다. 흙 묻은 옷을 입고 있는데도 언덕 위의 빛이 모두 그녀 쪽으로 모이는 것 같다.'],
        ['YUAN', '…그분이 여기서 떠나셨대요. 저는 그분께 꼭 한 번 노래를 불러 드렸을 뿐인데, 어째서인지 여기 와 있고 싶었어요.', 'sad']
      ]); });
    }
    await play([
      ['P', '진원원 아가씨시지요. 전해 드릴 것이 있습니다. 황제께서… 떠나시기 전에 남기신 것입니다.'],
      ['YUAN', '(겉봉의 글씨를 보고 손을 멈춘다) …이 글씨. 한 해 전 궁에서 꼭 한 번 뵌 그분의 글씨예요.', 'sad']
    ]);
    await readLetter();
    b.letter = 'done'; dropLetter();
    await ask(c);
  }
  async function ask(c) {
    var b = st();
    await withPic('ming_join', '노래가 들리는 곳으로', function () { return play([
      ['YUAN', '폐하께서 떠나신 이 성에서, 저는 더 이상 지낼 까닭이 없습니다.'],
      ['YUAN', S().date && today() >= K.passAt ? '장군의 집은 불탔고, 장군은 이제 관문을 열어 다른 나라의 장수가 되었지요. 사람들은 그 관문이 저 때문에 열렸다고 노래한대요. …저는 누구의 관문도 되고 싶지 않아요.' : '저는 이 집의 장군 것도, 산해관의 장군 것도 되고 싶지 않아요. 그분이 「누구의 것도 되지 말라」 하셨으니까요.'],
      ['YUAN', '바다로 나가는 배가 있다면… 저를 태워 주시겠어요? 노래와 비파는 배 위에서도 할 수 있어요. 말을 고르는 일도, 그림을 그리는 일도요.']
    ]); });
    var v = await UI.ask('진원원이 배에 태워 달라고 청한다 (음악·웅변 3단계, 그림 2단계, 요리 1단계)', [
      { label: '함께 가자 — 「노래가 들리는 곳으로」', value: 1, icon: 'people' },
      { label: '아직은 이르다', value: 0 }], me());
    if (v) {
      var nm = G.Legend && G.Legend.join ? G.Legend.join(ID, c) : null;
      if (!nm) { var s = S(); s.mates.push({ id: ID, role: 'none', joined: U.dateNum(s.date), loyal: K.loyal, from: c ? c.id : null }); nm = s.mates[s.mates.length - 1]; }
      nm.loyal = Math.max(nm.loyal || 0, K.loyal);
      b.joined = today();
      var so = G.Fame && G.Fame.add ? G.Fame.add('so', K.fameJoin) : 0;
      await play([
        ['YUAN', '(처음으로 웃는다) 고마워요. 그럼 이 비녀만 꽂고 가겠어요. 다른 것은 모두 이 성에 두고요.', 'happy'],
        [null, '그녀가 배에 오르던 날, 선원들은 한동안 밧줄을 쥔 채 일손을 놓았다. 부관이 헛기침을 하고서야 다들 제자리로 돌아갔다.']
      ]);
      G.State.log('숭정제의 마지막 편지를 진원원에게 전했다. 진원원이 「황제가 떠난 성에 더 머물 까닭이 없다」며 제독의 배에 올랐다.' + (so ? ' (사교 명성 +' + so + ')' : ''));
    } else {
      b.asked = (b.asked || 0) + 1;
      await play([['YUAN', '…그래요. 그럼 저는 매산 아래 작은 절에 있겠어요. 다시 이 성에 오시면 들러 주세요.', 'sad']]);
      G.State.log('숭정제의 마지막 편지를 진원원에게 전했다. 배에 태워 달라는 청은 아직 미뤄 두었다.');
    }
    refresh();
  }
  // 「아직은 이르다」 뒤 — 다시 북경에 들면 매산 아래 절에서
  function againOpen() { var b = st(), t = today(); return !!(b && b.letter === 'done' && !b.joined && !aboard() && !gone() && b.asked && cityNow() === BEIJING && t <= K.last && b.askDay !== S().day); }
  async function again() {
    var b = st(); b.askDay = S().day;
    await play([[null, '매산 아래 작은 절. 비파 소리를 따라가니, 그녀가 마당의 매화나무 아래에서 고개를 든다. 볼 때마다 숨이 멎는 얼굴이다.']]);
    await ask(G.CITY_DATA[BEIJING]);
  }

  // ================================================================ 도시에 들어설 때 · 수첩
  MF.pending = function () {
    var s0 = S(); if (!s0) return false;
    return nightOpen() || deliverOpen() || maidOpen() || againOpen();
  };
  MF.check = async function () {
    if (MF._busy) return false; MF._busy = true;
    MF.evDay = U.dayIndex(S().date);
    try {
      if (nightOpen()) await night();
      else if (deliverOpen()) await deliver();
      else if (maidOpen()) { await maid(); if (deliverOpen()) await deliver(); }   // 궁녀에게 받으면 그 길로 찾아간다
      else if (againOpen()) await again();
    } catch (e) { console.error(e); }
    MF._busy = false;
    return true;
  };
  MF.html = function () {
    var s0 = S(), b = s0 && s0.mingFall; if (!b) return '';
    var t = today(), li = [];
    if (hasLetter() && b.letter !== 'done') li.push(t < K.fall ? '숭정제의 마지막 편지 — 황제가 떠난 뒤(1644년 4월 25일부터) 북경에서 진원원에게' : aboard() ? '숭정제의 마지막 편지 — 배에 있는 진원원에게 (어느 도시에 들든)' : '숭정제의 마지막 편지 — 1646년까지 북경에서 진원원에게');
    if (b.letter === 'done' && !b.joined && !aboard() && b.asked && t <= K.last) li.push('진원원 — 북경 매산 아래 작은 절에서 기다린다 (1646년까지)');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">황제의 마지막 편지</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._mingHtml) { G.Court._mingHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + MF.html(); }; }
  MF._t = { night: night, maid: maid, deliver: deliver, again: again };
})(window.G = window.G || {});
