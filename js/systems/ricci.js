/* 마테오 리치의 중국 내륙 선교 시작 (G.Ricci) 2026-11-05 사용자 요청
   「리치와 루지에리가 중국 내륙에 선교 거점을 마련. 서양의 수학·천문학·지리학과 중국 지식인의 교류가 확대된다」
   사람·소지품·조정값: js/data/ricci.js (G.BALANCE.ricci). 리치가 오문에 닿은 소식(1582.8.7)은 js/systems/macao.js 에 있다 — 여기서는 그 뒤.
   ■ ① 조경으로 가는 길 (1583.6.1~9.9, 오문·광주): 루지에리와 리치가 조경 지부 왕반의 허락을 기다린다. 「들어갈 배도, 바칠 선물도 모자랍니다」
        → 자명종을 대 준다(금화) / 서강을 거슬러 오르는 배를 내 준다 / 지나친다 — 배를 내면 9.10까지 날이 지나가고 조경에 닿는다
        왕반이 숭희탑 곁 강가의 땅을 내준다 · 「승복이냐, 선비 옷이냐」(리치는 열두 해 뒤 선비 옷으로 갈아입는다)
   ■ ② 산해여지도 (1584.6.1~1585.12.31, 오문·광주 — ①에서 조경에 함께 갔으면): 지도 앞에서 선비들이 굳는다 — 「중국이 세상의 한 귀퉁이란 말이오?」
        리치가 묻는다: 명나라를 가운데에 둘까 → 가운데에 / 그대로 둔다(유럽 지도대로) · 제독의 해도를 내놓는다 — 아는 도시·발견물이 많을수록 바닷길이 바로잡힌다
        → 산해여지도 사본 · 탐험 명성
   ■ ③ 북경의 두 사람 (1601.1.24~1610.5.10, 북경 — ①에 함께했으면): 선비 옷의 리치와 서광계. 『원론』을 옮기다 막힌 곳 —
        「배 위에서 별의 높이로 위도를 재는 법」을 풀어 준다(항해·측량) → 『기하원본』(1607년부터 — 그 전이면 「다 옮기면 보내 드리지요」)
   ■ 소식: 조경의 선화사(1583.9.10) · 산해여지도(1584.10) · 소주로 쫓겨남(1589.8) · 북경 입성(1601.1.24) · 곤여만국전도(1602.9) · 『기하원본』(1607) · 리치의 죽음(1610.5.11)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/rc_*.webp
   ■ 저장: s.ricci = { zq: 'clock'|'boat'|'pass', robe, map, mapGrade, beijing, euclid, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var RC = G.Ricci = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.ricci) || {}; }
  var MACAO = 173, CANTON = 174, PEKING = 188;
  var D = RC.D = { zqFrom: 15830601, zqTo: 15830909, zq: 15830910, mapFrom: 15840601, mapTo: 15851231, bjFrom: 16010124, bjTo: 16100510, euclid: 16070101 };
  var NEWS_AT = { xianhua: 15830910, mapNews: 15841015, shaozhou: 15890815, peking: 16010124, kunyu: 16020901, euclidNews: 16070601, death: 16100511 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.ricci) {
      s.ricci = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.ricci.told[k] = 1; });
    }
    if (!s.ricci.told) s.ricci.told = {};
    return s.ricci;
  }
  RC.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w === 'P' ? me() : w === 'F' ? first() : w ? H(w) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }
  function fame(kind, key) { var n = (K().fame || {})[key] || 0; return n ? G.Fame.add(kind, n) : 0; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  async function passTo(day) {
    var n = U.dayIndex({ y: Math.floor(day / 10000), m: Math.floor(day / 100) % 100, d: day % 100 }) - U.dayIndex(S().date);
    if (!(n > 0)) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  async function passDays(n) {
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  /** 제독의 해도 — 아는 도시 수 · 발견물 수 */
  function charts() { var s = S(); return { known: (s.known || []).length, found: (s.stats && s.stats.found) || 0 }; }
  RC.charts = charts;

  // ================================================================ 소식
  RC.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!b.zq && b.zq !== 'pass', east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('xianhua', east, 'church', '【조경의 선화사】 예수회 신부 루지에리와 리치가 광동 조경 지부 왕반의 허락을 얻어 서강 가 숭희탑 곁에 집을 지었다. 서양 사람이 명나라 땅 안에 머물러 사는 것은 처음이다. 사람들은 그 집을 「선화사(仙花寺)」라 부른다.' + (b.zq === 'boat' || b.zq === 'clock' ? ' 강을 거슬러 그들을 태워 온 것은 바다의 한 선장이었다고 한다.' : ''));
    news('mapNews', met, 'map', '【산해여지도】 조경의 리치가 그린 세계 지도가 판에 새겨져 선비들 사이에 돈다. 명나라가 한가운데에 있고, 그 둘레로 처음 듣는 땅들이 그려져 있다.' + (b.mapGrade === 'big' ? ' 바닷길은 바다의 한 선장이 내놓은 해도로 고쳐 그렸다고 한다.' : ''));
    news('shaozhou', met, 'boot', '【소주로】 새 양광 총독이 조경의 선화사를 빼앗고 리치를 소주로 내쫓았다. 루지에리는 이미 로마로 돌아갔다. 리치는 이제 혼자다.');
    news('peking', east, 'castle', '【북경의 리치】 마테오 리치가 열여덟 해 만에 북경에 들어가 만력제에게 자명종과 서양 거문고를 바쳤다. 황제는 그를 직접 만나지는 않았지만, 북경에 머물러도 좋다고 했다. 그는 이제 승복이 아니라 선비의 옷을 입는다.');
    news('kunyu', east, 'map', '【곤여만국전도】 북경에서 리치의 큰 세계 지도 「곤여만국전도」가 여섯 폭 병풍으로 새겨졌다. 조선과 일본의 사신들도 그 지도를 베껴 갔다고 한다.' + (b.mapGrade === 'big' ? ' 남쪽 바다의 섬들 가운데 몇은 이방인 선장이 처음 알려 준 것이라 한다.' : ''));
    news('euclidNews', met, 'book', '【기하원본】 리치가 말로 옮기고 서광계가 붓으로 적은 에우클레이데스의 『원론』 앞 여섯 권이 『기하원본』이라는 이름으로 나왔다. 「점」·「선」·「면」·「평행」이라는 말이 처음 생겼다.');
    news('death', east, 'skull', '【리치의 죽음】 마테오 리치가 북경에서 쉰일곱으로 세상을 떠났다. 만력제는 서양 사람으로서는 처음으로 북경 성 밖에 묻힐 땅을 내렸다. 「이 사람이 쓴 책 한 권만으로도 땅을 줄 만하다」는 말이 조정에 돌았다.');
    return out;
  };

  // ================================================================ ① 조경으로 가는 길 (1583.6.1~9.9)
  function zqOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.zq && (c === MACAO || c === CANTON) && t >= D.zqFrom && t <= D.zqTo); }
  async function zq() {
    var b = st(), s = S(), k = K(), macaoMet = !!(s.macao && (s.macao.settle || s.macao.deal));
    await withPic('rc_macao', '두 신부 (1583)', function () { return play([
      [null, cityNow() === MACAO ? '오문, 성 바울 성당 아래 예수회 숙소. 회색 승복에 머리를 깎은 서양 신부 둘이 한문 책을 펼쳐 놓고 있다.' : '광주, 외국인이 머물 수 있는 강가의 객관. 회색 승복에 머리를 깎은 서양 신부 둘이 한문 책을 펼쳐 놓고 있다.'],
      ['rc_ruggieri', '미켈레 루지에리요. 중국 이름은 나명견이라 하오. 이쪽은 마테오 리치 — 작년 여름 오문에 닿았소. ' + (macaoMet ? '오문의 첫 집들을 지을 때 그대가 있었다고 들었소.' : '바다의 선장이시라고?')],
      ['rc_ricci', '(유창하지는 않지만 또박또박한 광동말로) 우리는 명나라 땅 안으로 들어가고 싶습니다. 오문은 문 앞일 뿐이니까요. 조경의 지부 왕반 대인이 서양의 신기한 물건을 보고 싶어 한답니다.'],
      ['rc_ruggieri', '문제는 둘이오. 서강을 거슬러 조경까지 데려다줄 배가 없고, 지부께 바칠 자명종이 아직 인도에서 오지 않았소. 리치가 가진 삼릉경(프리즘) 하나로는 모자라오.']
    ]); });
    var v = await UI.ask('두 신부를 도울 것인가?', [
      { label: '자명종을 대 준다 (금화 ' + U.num(k.clock) + '닢) — 그리고 배로 데려다준다', value: 'clock', icon: 'gear', dis: s.player.gold < k.clock },
      { label: '서강을 거슬러 오르는 배를 내 준다', value: 'boat', icon: 'ship' },
      { label: '「선교는 내 일이 아니오」 — 지나친다', value: 'pass' }], me());
    if (v === 'clock' && s.player.gold < k.clock) v = 'boat';
    b.zq = v;
    if (v === 'pass') { await play([['rc_ricci', '(웃으며) 괜찮습니다. 하느님은 다른 배를 보내 주실 겁니다. 조금 늦게요.']]); log('오문에서 예수회 신부 루지에리와 리치를 만났다.'); return; }
    if (v === 'clock') { s.player.gold -= k.clock; await play([['rc_ricci', '(태엽 감는 자명종을 귀에 대 보며) 이 소리면 지부의 마음도 열리겠습니다. 중국 사람들은 해시계와 물시계는 알아도, 스스로 시각을 알리는 기계는 처음 볼 겁니다.']]); }
    await passTo(D.zq);
    await withPic('rc_zhaoqing', '조경 (1583.9.10)', function () { return play([
      [null, '서강을 거슬러 사흘. 산이 강을 좁히는 곳에 조경이 있다. 강가에 아홉 층 숭희탑이 섰다. 지부의 관아 뜰에 두 신부와 제독이 무릎을 꿇는다.'],
      ['rc_wangpan', v === 'clock' ? '(자명종이 정오를 치자 깜짝 놀라 일어서며) 허, 이것이 저 혼자 시각을 안단 말이오? …좋소, 좋소! 서쪽 끝에서 온 중들이 이런 것을 만든다면 머물 만도 하오.' : '(삼릉경에 햇빛을 비추어 벽에 무지개를 띄워 보고) 유리 속에 무지개가 들었구려. 서쪽 끝에서 온 중들이라니, 머물 곳을 내주겠소.'],
      ['rc_wangpan', '숭희탑 곁 강가의 땅을 쓰시오. 다만 조용히 지내시오. 광주의 상인들처럼 장사를 하거나 사람을 모으면 안 되오.'],
      ['rc_ricci', '(제독에게 작게) 우리는 지금 「서쪽에서 온 중」으로 보입니다. 머리를 깎고 승복을 입었으니까요. 이 나라에서 중은… 그리 높이 대접받지 못하더군요. 선장님이 보기엔 어떻습니까?']
    ]); });
    var r = await UI.ask('리치가 묻는다 — 「승복을 입은 채로 둘까요?」', [
      { label: '「선비의 옷을 입으시오 — 이 나라는 글 읽는 사람을 높이오」', value: 'scholar', icon: 'book' },
      { label: '「처음엔 낮은 곳에서 시작하는 게 좋소」', value: 'monk' }], me());
    b.robe = r;
    await play(r === 'scholar'
      ? [['rc_ricci', '(오래 생각하다) …선비의 옷이라. 머리를 기르고 수염을 길러야겠군요. 언젠가는 그렇게 하겠습니다. 이 나라의 학자들과 같은 자리에서 별과 숫자를 이야기하려면.']]
      : [['rc_ricci', '그렇지요. 낮은 곳에서 배우겠습니다. 이 나라 말과 글을, 그리고 공자의 책을.']]);
    var zf = fame('so', 'zq');
    log('1583년 — 예수회 신부 루지에리와 리치를 ' + (v === 'clock' ? '자명종과 함께 ' : '') + '조경까지 배로 데려다주었다. 지부 왕반이 숭희탑 곁의 땅을 내주었다. (사교 명성 +' + zf + ')');
    UI.toast('조경의 선화사 — 서양 사람이 명나라 땅 안에 머물게 되었다', 'church', 5600);
    refresh();
  }

  // ================================================================ ② 산해여지도 (1584.6~1585)
  function mapOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && (b.zq === 'clock' || b.zq === 'boat') && !b.map && (c === MACAO || c === CANTON) && t >= D.mapFrom && t <= D.mapTo); }
  async function map() {
    var b = st(), k = K(), ch = charts(), M = k.map || {};
    await passDays(3);
    await withPic('rc_map', '산해여지도 (1584)', function () { return play([
      [null, '조경의 선화사. 벽 한 면을 덮은 커다란 종이에 둥근 세상이 그려져 있다. 리치가 한자로 땅 이름을 적고, 선비들이 둘러서서 웅성거린다.'],
      ['rc_scholar', '(지도를 노려보며) 이것이 천하란 말이오? 대명은 왜 이렇게 오른쪽 끝에 붙어 있소? 중국은 천하의 가운데요! 중국(中國)이라는 이름이 무슨 뜻인지 모르시오?'],
      ['rc_ricci', '(제독에게 작게) 유럽에서 가져온 지도를 그대로 옮겼더니 이렇습니다. 지구는 둥그니 어디를 가운데 두어도 거짓은 아닙니다만…. 선장님이라면 어떻게 하시겠습니까?']
    ]); });
    var v = await UI.ask('리치가 묻는다 — 지도의 가운데에 무엇을 둘까?', [
      { label: '「명나라를 가운데에 — 둥근 세상에 가운데는 정하기 나름이오」', value: 'center', icon: 'globe' },
      { label: '「바다를 아는 사람의 지도대로 두시오」', value: 'europe', icon: 'map' }], me());
    b.map = v;
    await play(v === 'center'
      ? [['rc_ricci', '(지도를 접었다 다시 펴며) 그렇지요. 세상을 둘로 갈라 대명을 한가운데로. 태평양이 가운데 오게 하겠습니다. …(선비들이 고개를 끄덕인다) 보세요, 이제 사람들이 다음 말을 들어 줍니다.']]
      : [['rc_scholar', '(소매를 떨치며) 오랑캐의 지도로군!'], ['rc_ricci', '(쓴웃음) …사람들이 문을 닫는군요. 이 판은 다시 새기겠습니다. 대명을 가운데로. 그래도 선장님의 말씀은 옳습니다 — 바다는 어디가 가운데인지 묻지 않으니까요.']]);
    await play([['rc_ricci', '그런데 선장님, 동쪽과 남쪽 바다의 물길은 제 지도가 엉터리입니다. 선장님이 다닌 바다의 해도를 보여 주시겠습니까? 아시는 항구와 땅을 다 적어 넣고 싶습니다.']]);
    var big = ch.known >= (M.known || 60) || ch.found >= (M.found || 20);
    b.mapGrade = big ? 'big' : 'small';
    await play(big
      ? [[null, '제독이 해도 상자를 연다. 리치의 눈이 커진다. 항구 ' + ch.known + '곳, 손으로 적어 넣은 발견 ' + ch.found + '가지.'], ['rc_ricci', '이건… 리스본의 지리학자들도 이런 것은 못 가졌습니다! 남쪽 바다의 섬들, 동쪽 바다의 물길 — 이제 이 지도는 바다에서 온 사람의 눈을 가집니다.']]
      : [[null, '제독이 해도 몇 장을 내놓는다. 항구 ' + ch.known + '곳.'], ['rc_ricci', '고맙습니다. 몇 줄은 바로잡을 수 있겠군요. 선장님이 더 먼 바다를 다녀오시면 그때 또 보여 주십시오.']]);
    give('rc_map');
    var mf = fame('ex', big ? 'map' : 'mapSmall');
    log('1584년 조경 — 마테오 리치의 세계 지도 「산해여지도」에 제독의 해도를 보탰다. 리치가 사본 한 장을 건넸다. (탐험 명성 +' + mf + ')');
    refresh();
  }

  // ================================================================ ③ 북경의 두 사람 (1601.1.24~1610.5.10)
  function bjOpen() { var b = st(), t = today(); return !!(b && (b.zq === 'clock' || b.zq === 'boat') && !b.beijing && cityNow() === PEKING && t >= D.bjFrom && t <= D.bjTo); }
  async function beijing() {
    var b = st(), s = S(), k = K(), done = today() >= D.euclid;
    b.beijing = 1;
    await withPic('rc_peking', '북경의 두 사람', function () { return play([
      [null, '북경 선무문 안, 서양 사람의 집. 서재에 자명종이 똑딱거린다. 긴 수염에 선비의 비단 도포를 입은 사내가 일어서는데 — 조경의 그 승복 신부다.'],
      ['rc_ricci', '(두 손으로 제독의 손을 잡으며) 선장님! 서강의 그 배를 기억합니다. ' + (b.robe === 'scholar' ? '보십시오, 선장님 말대로 선비의 옷을 입었습니다. 열두 해가 걸렸지만요.' : '보십시오, 결국 선비의 옷을 입었습니다. 이 나라는 글 읽는 사람의 말만 듣더군요.')],
      ['rc_xu', '서광계라 하오. 이마두 선생과 함께 서양의 『원론』을 옮기고 있소. 「점은 나뉘지 않는 것이다」 — 이 첫 줄에 한 달이 걸렸소.'],
      ['rc_xu', '그런데 막힌 데가 있소. 선생 말로는 서양 배는 넓은 바다 한가운데서도 제 자리를 안다 하오. 별의 높이를 재서 어떻게 위도를 아는지, 그게 이 책의 도형들과 무슨 상관이 있는지 — 배를 모는 사람에게 듣고 싶소.']
    ]); });
    var nav = skill('nav'), sur = skill('survey'), lv = Math.max(nav, sur);
    var v = await UI.ask('서광계가 묻는다 — 「별의 높이로 위도를 재는 법」', [
      { label: '육분의를 꺼내 북극성의 높이를 재 보인다 (항해·측량 ' + lv + '단계)', value: 'show', icon: 'compass' },
      { label: '「뱃사람은 손으로 익힐 뿐, 말로는 못 하오」', value: 'no' }], me());
    if (v === 'show') {
      b.euclid = lv >= 1 ? 'clear' : 'rough';
      await play(lv >= 1
        ? [[null, '밤, 마당. 제독이 북극성에 기구를 겨누고 눈금을 읽는다. 「서른아홉 도와 조금.」 서광계가 종이에 원을 그리고, 지평선과 별 사이에 선을 긋는다.'], ['rc_xu', '(붓을 멈추고) …아, 각이로구나! 별이 지평선과 이루는 각이 곧 땅 위의 자리. 이 책의 각과 원이 바다 위에서 길이 되는 것이오!']]
        : [[null, '밤, 마당. 제독이 서툴게 기구를 겨눈다. 눈금이 흔들린다. 그래도 서광계는 무언가를 알아챈 얼굴이다.'], ['rc_xu', '서툴러도 알겠소. 각이오. 별과 땅 사이의 각. 이 책이 왜 각부터 이야기하는지 이제 알겠소.']]);
      if (G.Growth && G.Growth.once) G.Growth.once('ricci_euclid', 'int', 1, '북경에서 서광계·리치와 별의 각을 이야기했다');
      var ef = fame('so', 'euclid');
      if (done) { give('rc_euclid'); await play([['rc_ricci', '(새로 찍은 책 한 권을 건네며) 『기하원본』입니다. 앞 여섯 권뿐이지만, 이 나라에 「평행」이라는 말이 처음 생겼습니다. 선장님 몫입니다.']]); }
      else { b.owe = 1; await play([['rc_ricci', '책이 다 되면 한 권 보내 드리지요. 북경에 다시 오시면 꼭 들러 주십시오.']]); }
      log('북경에서 마테오 리치와 서광계를 만나 별의 높이로 위도를 재는 법을 보였다.' + (done ? ' 『기하원본』 한 권을 받았다.' : '') + ' (사교 명성 +' + ef + ')');
    } else {
      b.euclid = 'no';
      await play([['rc_ricci', '(웃으며) 그것도 맞는 말입니다. 손으로 익힌 것을 말로 옮기는 게 우리 일이지요. 서 선생, 조금 더 씨름해 봅시다.']]);
      log('북경에서 선비의 옷을 입은 마테오 리치와 서광계를 만났다.');
    }
    refresh();
  }
  /** ③에서 약속한 책 — 1607년 뒤 북경에 다시 들르면 */
  function oweOpen() { var b = st(); return !!(b && b.owe && cityNow() === PEKING && today() >= D.euclid && today() <= 16100510); }
  async function owe() {
    var b = st(); b.owe = 0; give('rc_euclid');
    await play([['rc_ricci', '선장님! 약속한 책입니다. 『기하원본』 — 서 선생이 첫 장에 「바다의 사람에게 각을 배웠다」고 적어 넣겠다는 걸 제가 말렸습니다. 하하.']]);
    log('북경에서 마테오 리치가 약속한 『기하원본』을 받았다.');
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[oweOpen, owe], [bjOpen, beijing], [mapOpen, map], [zqOpen, zq]];
  RC.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  RC.check = async function () {
    if (RC._busy) return false; RC._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    RC._busy = false; refresh();
    return true;
  };
  RC._t = { zq: zq, map: map, beijing: beijing, owe: owe };
})(window.G = window.G || {});
