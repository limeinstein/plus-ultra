/* 천계제의 궁궐과 동림당 (G.Donglin) 2026-11-05 사용자 요청
   「1620~1627 천계제 시기 환관 정치와 동림당 탄압 — 만력제와 태창제가 잇달아 사망한 뒤 천계제가 즉위. 환관 위충현이 권력을 장악하고 동림당 계열 관료들을 탄압」
   「등장하는 미인들이 동료가 될 수 있는 스토리를 구성해줘」 — 1626 영원성과 1627 숭정제의 위충현 숙청은 js/systems/ningchong.js
   사람·동료·소지품·조정값: js/data/donglin.js (G.BALANCE.donglin). 큰 역사는 바뀌지 않는다. 날짜는 게임의 양력.
   (만력제 붕어 1620.8.18 · 홍환안 1620.9.26 · 이궁안·천계제 즉위 1620.10.1 · 양련의 상소 1624.7 · 육군자 체포 1625.4 · 옥사 1625.8.26~28
    · 소주 민변 음력 천계 6년 3월 18일 ≈ 1626.4.14 · 왕공창 폭발 1626.5.30 · 서호의 첫 생사 1626 윤6월 ≈ 1626.8 · 다섯 사람의 처형 1626 가을)
   ■ ① 목수 황제의 주문 (1621.1.1~1626.12.31, 오문·광주·천주·복주·항주·하문·상해·남경): 어용감의 유 태감이 황제가 손수 깎을 남만의 나무를 찾는다.
        → 약조한다: 「어용감 목재 패」(북경·항주·소주 성문 통행 허가 — G.Sneak.givePass) · 백단향 n통을 북경으로 / 사양한다
   ■ ② 대패 소리 (북경, 약조한 뒤 기한 안 · 1627.9.29까지 · 백단향을 실었으면): 건청궁 뒤뜰의 공방. 대패질하는 황제 곁에서 위충현이 상소를 읽는다 —
        「짐은 다 알았다. 그대들이 알아서 하라」 · 시세의 k배 · 「목수 황제의 작은 누각」 · 객씨
        → 궁녀 취연: 객씨가 이성비를 가두고 먹을 것을 끊었다 — 배의 마른 양식을 준다(양식 10) / 못 본 척
        → 그날 밤 객씨의 사람들이 취연을 찾는다: (가) 유 태감을 매수해 빈 나무 궤짝에 숨긴다(금화) (나) 동안문의 동창을 뚫는다(육상전) (다) 두고 간다 → 동료 「취연」
   ■ ③ 서호의 탄궁 (1625.4.25~1626.3.31, 항주): 늙은 명기 설소소와 제자 소만의 말 위 탄궁 → 동창 교위가 붙잡혀 간 동림 선비의 아내와 아들을 쫓는다
        → 소만이 흙탄으로 신호 등불을 끊는다 → (가) 제독의 배에 태운다(부두의 교위와 육상전) (나) 교위에게 은을 쥐여 준다 (다) 모른 척
        → 설소소 「서호가 좁다고 우는 아이예요. 바다를 보여 주세요」 → 동료 「소만」 · 「설소소의 난초 그림」 · 소주 통행
   ■ ④ 다섯 사람 — 소주 민변 (1626.3.1~4.14, 소주 · 항주에서는 왕미의 거룻배로 운하를 따라 — 4.14까지 날이 지나간다):
        시인 왕미 · 동창이 주순창을 잡으러 온다 → 서찰원 앞, 체포 문서를 읽는 날 만 명의 소주 백성 · 안패위
        → (가) 군중과 함께 교위들을 친다(육상전) (나) 주순창을 배로 빼내자고 청한다 — 「내가 가지 않으면 소주가 피를 본다」 (다) 지켜본다
        → 다섯 사람의 이름 · 왕미 「이번엔 바다로 가 볼까요」 — 함께 간다(동료 「왕미」) / 놓아준다
   ■ ④' 서호의 배 (1626.4.15~1627.12.31, 항주·소주 — ④를 놓쳤으면): 불계원(不繫園) 배 위의 왕미 — 시 한 수를 청하면 동료
   ■ 소식: 만력제(1620.8.18) · 홍환안(9.26) · 이궁안(10.1) · 객씨와 후궁들(1623.6) · 양련의 상소(1624.7.16) · 육군자의 옥사(1625.8.27)
          · 소주 민변(1626.4.14) · 왕공창 폭발(1626.5.30) · 주순창의 죽음(1626.7.20) · 서호의 생사(1626.8.1) · 다섯 사람(1626.9.1)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/dl_*.webp
   ■ 저장: s.donglin = { call, dueDay, wood, cui, cuiWay, food, lake, lakeWay, man, riot, riotWay, wang, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var DL = G.Donglin = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.donglin) || {}; }
  var BEIJING = 188, HANGZHOU = 177, SUZHOU = 286, NANJING = 178, PORTS = [173, 174, 175, 176, 177, 178, 287, 288];
  var D = DL.D = { callFrom: 16210101, callTo: 16261231, woodTo: 16270929, lakeFrom: 16250425, lakeTo: 16260331, riotFrom: 16260301, riot: 16260414, lateTo: 16271231 };
  var NEWS_AT = { wanli: 16200818, redpill: 16200926, yigong: 16201001, harem: 16230615, yanglian: 16240716, six: 16250827, suzhou: 16260414, blast: 16260530, zhou: 16260720, shrine: 16260801, five: 16260901 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.donglin) {
      s.donglin = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.donglin.told[k] = 1; });   // 옛 저장 — 지난 소식은 띄우지 않는다
    }
    if (!s.donglin.told) s.donglin.told = {};
    return s.donglin;
  }
  DL.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  // 말하는 사람: CY 취연 · XM 소만 · WW 왕미 (아직 동료가 아니어도 동료 얼굴로 선다)
  var WHO = { P: me, F: first, CY: function (e) { return mateSp('dl_cuiyan', e); }, XM: function (e) { return mateSp('dl_xiaoman', e); }, WW: function (e) { return mateSp('dl_wangwei', e); } };
  var CROWD = { name: '구경꾼', lang: 3 }, MOB = { name: '소주 백성', lang: 3 }, MAID = { name: '객씨의 궁녀', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w && WHO[w] ? WHO[w](l[2]) : w ? H(w) : {};
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
  function cargo(id) { var c = S().fleet.cargo[id]; return c ? c.q : 0; }
  function takeCargo(id, n) { var f = S().fleet, c = f.cargo[id]; if (!c) return; c.q -= n; if (c.q <= 0) delete f.cargo[id]; }
  function pass(ids) { if (G.Sneak && G.Sneak.givePass) ids.forEach(function (id) { if (G.CITY_DATA[id]) G.Sneak.givePass(G.CITY_DATA[id]); }); }
  function join(id, loyal, cityId) { if (row(id) || !G.Legend || !G.Legend.join) return row(id); var m = G.Legend.join(id, G.CITY_DATA[cityId]); if (m && loyal) m.loyal = loyal; return m; }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  async function passTo(day) {
    var n = U.dayIndex({ y: Math.floor(day / 10000), m: Math.floor(day / 100) % 100, d: day % 100 }) - U.dayIndex(S().date);
    if (!(n > 0)) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  function wood() { var w = K().wood || {}; return { good: w.good || 'sandalwood', n: w.n || 12, k: w.k || 3, days: w.days || 300 }; }
  function woodGold() { var w = wood(), p = (G.GOOD && G.GOOD[w.good] && G.GOOD[w.good].p) || 88; return Math.round(w.n * p * w.k); }
  DL.woodGold = woodGold;
  function goodName() { var g = G.GOOD && G.GOOD[wood().good]; return g ? g.name : '백단향'; }

  // ================================================================ 소식
  DL.daily = function () {
    var b = st(), out = []; if (!b) return out;
    var s = S(), t = today(), told = b.told;
    function news(k, icon, text) { if (!told[k] && t >= NEWS_AT[k]) { told[k] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('wanli', 'skull', '【만력제 붕어】 명의 만력제가 48년의 재위 끝에 세상을 떠났다. 서른 해 가까이 조회에 나오지 않은 황제였다. 요동에서는 후금의 기병이 성을 넘보고, 국고는 세 번의 큰 원정으로 비었다.');
    news('redpill', 'skull', '【홍환안】 즉위한 지 한 달 남짓 된 태창제가 숨을 거두었다. 병석에서 이가작이 올린 붉은 환약 두 알을 먹은 이튿날 새벽이었다고 한다. 「붉은 환약에 독이 들었다」는 말이 북경에 돈다.');
    news('yigong', 'scroll', '【이궁안 · 천계제 즉위】 태창제의 총비 이선시가 건청궁을 비우지 않고 버티다 끝내 쫓겨났다. 열다섯 살의 주유교가 즉위했다 — 천계제다. 새 황제는 글보다 대패와 끌을 좋아한다는 소문이다.');
    news('harem', 'skull', '【객씨와 후궁들】 회임한 유비 장씨가 객씨의 손에 갇혀 먹을 것을 끊기고 끝내 숨졌다고 한다. 성비 이씨도 같은 일을 당했으나 ' +
      (b.food ? '벽 틈에 숨겨 둔 마른 양식으로 보름을 버텨 살아남았다. 「바다 건너 배의 마른 떡이었다」는 궁녀들의 귓속말이 돈다.' : '미리 벽 틈에 숨겨 둔 먹을 것으로 보름을 버텨 살아남았다.') + ' 황제의 유모 객씨를 누구도 막지 못한다.');
    news('yanglian', 'scroll', '【양련의 상소】 좌부도어사 양련이 위충현의 「스물네 가지 큰 죄」를 들어 상소했다. 그러나 글을 잘 읽지 못하는 황제에게 상소를 읽어 준 것은 위충현 쪽 사람이었다. 황제는 양련을 꾸짖었다.');
    news('six', 'skull', '【육군자의 옥사】 북경 진무사의 옥에서 양련·좌광두·위대중·원화중·주조서·고대장 여섯 사람이 고문 끝에 숨졌다. 동림의 여섯 군자라 불린다. 좌광두의 제자 사가법은 옥졸로 변장해 스승을 찾아갔으나, 스승은 이미 사람의 모습이 아니었다고 한다.' +
      (b.lake === 'saved' ? ' 강남으로 달아난 동림 선비의 식구 몇은 남만 배를 타고 바다로 나갔다고 한다.' : ''));
    news('suzhou', 'people', '【소주 민변】 동창의 교위들이 소주의 주순창을 잡으러 왔다가, 체포 문서를 읽는 서찰원 앞에서 들고일어난 만여 명의 소주 백성에게 얻어맞았다. 교위 하나가 죽고 나머지는 담을 넘어 달아났다.' +
      (b.riotWay === 'fight' ? ' 군중 속에서 남만 옷을 입은 선원들이 교위의 쇠사슬을 빼앗았다는 이야기도 돈다.' : '') + ' 그래도 주순창은 스스로 걸어 나가 북경으로 끌려갔다.');
    news('blast', 'cannon', '【왕공창 폭발】 북경 서남쪽의 화약 공장 왕공창에서 하늘이 무너지는 듯한 폭발이 일어났다. 거리 수십 곳이 무너지고 죽은 사람이 수천이라 한다. 사람들은 「하늘이 노했다」고 수군거린다.');
    news('zhou', 'skull', '【주순창의 죽음】 소주에서 끌려간 주순창이 북경의 옥에서 숨졌다. 그는 끝까지 위충현을 꾸짖었다고 한다.');
    news('shrine', 'scroll', '【서호의 생사】 절강 순무 반여정이 서호 가에 위충현의 생사(生祠 — 산 사람을 모시는 사당)를 세웠다. 황제는 「보덕(普德)」이라는 이름을 내렸다. 이제 고을마다 앞다투어 「구천세」의 사당을 세운다고 한다.');
    news('five', 'skull', '【다섯 사람】 소주 민변의 주모자로 몰린 안패위·양념여·마걸·심양·주문원 다섯 사람이 목이 베였다. 다섯은 웃으며 죽었고, 소주 사람들은 그 머리를 거두어 묻었다고 한다.' +
      (b.wang === 'joined' ? ' 그 이름을 적어 간 시인 하나가 바다로 떠났다는 말이 있다.' : ''));
    // ① 어용감의 기한
    if (b.call === 'take' && b.dueDay != null && s.day > b.dueDay) { b.call = 'late'; out.push({ icon: 'scroll', text: '어용감 유 태감과 약조한 ' + goodName() + '의 기한이 지났다. 북경의 목재 패도 쓸모가 없어졌다.' }); }
    return out;
  };

  // ================================================================ ① 목수 황제의 주문 (1621~1626, 명의 항구)
  function callOpen() { var b = st(), t = today(); return !!(b && !b.call && PORTS.indexOf(cityNow()) >= 0 && t >= D.callFrom && t <= D.callTo); }
  async function call() {
    var b = st(), s = S(), w = wood(), gn = goodName(), g = woodGold();
    await withPic('dl_timber', '어용감의 태감', function () { return play([
      [null, '부두의 목재 더미 사이. 푸른 내관 옷의 사내가 허리에 꽂은 자를 꺼내 통나무를 재더니, 코를 대고 나무 냄새를 맡는다.'],
      ['dl_yu', '(제독을 보고) 남만 배의 선장인가? 어용감의 유가라 하오. 만세야(황제)께 쓰실 나무를 찾고 있소.'],
      ['dl_yu', '(목소리를 낮추며) 우스운 소리 같지만 — 만세야께서는 손수 대패질을 하시오. 건청궁 뒤뜰에 공방을 차리시고, 누각이며 궤짝이며 손바닥만 한 궁궐까지 깎으신다오. 솜씨가 목수장이보다 낫소.'],
      ['dl_yu', '요즘 만세야께서 바다 건너의 단단하고 향기로운 나무를 찾으시오. ' + gn + ' ' + w.n + '통을 북경으로 날라 주면 시세의 ' + w.k + '배(금화 ' + U.num(g) + '닢)를 쳐 주겠소. 어용감의 목재 패를 내주리다 — 북경과 항주·소주의 성문이 열릴 거요.'],
      ['dl_yu', '(웃으며) 상소문이요? 그건 사례감의 위 공공(위충현)께서 알아서 하시오. 요즘 대궐에서는 위 공공의 말이 곧 성지(聖旨)요.']
    ]); });
    var v = await UI.ask('목수 황제의 나무', [
      { label: '약조한다 — ' + gn + ' ' + w.n + '통을 ' + w.days + '일 안에 북경으로 (금화 ' + U.num(g) + '닢)', value: 'take', icon: 'ship' },
      { label: '사양한다', value: 'no' }], me());
    b.call = v;
    if (v === 'take') {
      b.dueDay = s.day + w.days;
      pass([BEIJING, HANGZHOU, SUZHOU, NANJING]);
      await play([['dl_yu', '(목재 패를 건네며) 북경 동안문 밖 어용감으로 오시오. 나무 냄새만 맡아도 알아볼 거요.']]);
      log('어용감 유 태감 — 천계제가 손수 깎을 ' + gn + ' ' + w.n + '통을 ' + w.days + '일 안에 북경으로. 「어용감 목재 패」로 북경·항주·소주·남경에 들어갈 수 있다.');
      UI.toast('목수 황제의 나무 — ' + gn + ' ' + w.n + '통 → 북경 (' + w.days + '일)', 'ship', 6000);
    } else {
      await play([['dl_yu', '(어깨를 으쓱하며) 그럼 포르투갈 놈들에게 맡기지. 나무는 어디에나 있소.']]);
    }
    refresh();
  }

  // ================================================================ ② 대패 소리 (북경)
  function woodOpen() { var b = st(), s = S(), t = today(); return !!(b && b.call === 'take' && !b.wood && cityNow() === BEIJING && t <= D.woodTo && (b.dueDay == null || s.day <= b.dueDay) && cargo(wood().good) >= wood().n); }
  async function deliver() {
    var b = st(), s = S(), w = wood(), gn = goodName(), g = woodGold(), t = today();
    takeCargo(w.good, w.n); s.player.gold += g; b.wood = t; b.call = 'done';
    await withPic('dl_workshop', '건청궁 뒤뜰의 공방', function () { return play([
      [null, '건청궁 뒤뜰. 나뭇밥이 눈처럼 쌓인 공방에서 곤룡포 소매를 걷어붙인 젊은 황제가 대패를 밀고 있다. 내관들이 숨을 죽이고 섰다.'],
      ['dl_tianqi', '(나무를 쓰다듬고 코를 대며) …이것이 바다 건너의 나무인가. 결이 비단 같고 향이 절간 같구나. 이걸로 처마를 깎으면 비가 와도 향이 나겠지.'],
      [null, '공방 한쪽, 붉은 망의를 입은 수염 없는 사내가 무릎을 꿇고 상소문을 읽는다. 위충현이다. 대패 소리에 글 읽는 소리가 묻힌다.'],
      ['dl_wei', '…하여 신 아무개가 아뢰기를, 요동의 군량이 석 달째 끊겨 —'],
      ['dl_tianqi', '(대패를 멈추지 않고) 짐은 다 알았다. 그대들이 알아서 하라.'],
      ['dl_wei', '(상소를 접으며 제독을 흘끗 본다) 성은이 망극하옵니다. …남만의 선장, 수고했소. 어용감에서 값을 치르게 하겠소.'],
      ['dl_tianqi', '(손바닥만 한 누각을 내밀며) 지난달에 깎은 것이다. 문짝이 열리지? 바다의 사람이니 바다의 나무로 지은 집을 하나 가져라.'],
      [null, '그때 금비녀를 잔뜩 꽂은 여인이 궁녀들을 거느리고 들어온다. 황제의 얼굴이 아이처럼 밝아진다.'],
      ['dl_ke', '만세야, 손 다치십니다. 점심 드실 시간이에요. (제독을 훑어보고) …이 오랑캐는 누구요? 만세야 앞에서 고개를 들다니.'],
      ['dl_tianqi', '유모, 나무를 가져온 사람이야. 좋은 나무를.']
    ]); });
    give('dl_pavilion');
    var f1 = fame('so', 'wood');
    log('북경 건청궁 — 목수 황제 천계제에게 ' + gn + ' ' + w.n + '통을 바쳤다. 금화 ' + U.num(g) + '닢과 「목수 황제의 작은 누각」을 받았다. 위충현이 상소를 읽고, 황제는 「짐은 다 알았다」고만 했다. (사교 명성 +' + f1 + ')');
    pass([BEIJING, HANGZHOU, SUZHOU, NANJING]);   // 목재 패를 새로
    // ── 궁녀 취연
    var dead = t >= NEWS_AT.harem;
    await withPic('dl_wall', '성비의 궁', function () { return play([
      [null, '공방을 나서는 회랑. 기둥 뒤에서 푸른 옷의 궁녀 하나가 제독의 소매를 잡는다. 가는 몸에 버들잎 같은 눈썹 — 떨리는 손이 차갑다.'],
      ['CY', '(속삭이며) 놀라지 마세요. 이성비 마마를 모시는 취연이라고 해요. …봉성부인(객씨)이 마마를 궁에 가두고 먹을 것을 끊었어요. 마마께서 만세야께 부인의 일을 아뢰셨다고요.'],
      ['CY', dead ? '유비 마마는 그렇게 굶어 돌아가셨어요. 회임 중이셨는데… 빗물을 받아 드시다가요.' : '이 궁에서는 그렇게 사라진 분이 처음이 아니에요. 아무도 소리 내어 말하지 않을 뿐이에요.'],
      ['CY', '(벽돌 한 장을 소리 없이 빼 보이며) 만세야께서 목공을 하시느라 궁 벽을 몇 번 뜯었다 고치셨어요. 틈이 있어요. 배에서 쓰는 오래가는 마른 양식이 있으면… 이 틈에 숨길 수 있어요.']
    ]); });
    var foodOk = (s.fleet.food || 0) >= 10;
    var v = await UI.ask('벽 틈에 숨길 먹을 것', [
      { label: '배의 마른 양식을 준다 (양식 10)', value: 'food', icon: 'bread', dis: !foodOk },
      { label: '못 본 척 지나간다 — 「궁의 일에 끼지 않겠소」', value: 'no' }], me());
    if (v !== 'food' || !foodOk) {
      b.cui = 'pass';
      await play([['CY', '(손을 놓으며) …그렇겠지요. 선장님 탓이 아니에요. 이 궁에서는 다들 그렇게 지나가요.']]);
      refresh(); return;
    }
    s.fleet.food -= 10; b.food = 1;
    await play([
      [null, '해 질 녘, 마른 떡과 말린 고기가 나무 궤짝 바닥에 실려 성비의 궁 담 밑으로 들어갔다. 취연이 벽돌을 하나씩 빼고 끼운다. 소리 하나 나지 않는다.'],
      [null, '그날 밤 어용감 숙소. 문을 두드리는 소리 — 취연이다. 소매가 찢겼다.'],
      ['CY', '(숨을 몰아쉬며) 들켰어요. 봉성부인의 궁녀가 벽돌 가루를 봤어요. 마마께서는 「모르는 일」이라고 하셨어요 — 그래야 마마가 사세요. 저는… 내일 아침이면 우물 속이에요.'],
      [MAID, '(멀리서) 취연이를 찾아라! 동안문을 닫아라!']
    ]);
    var bribe = K().bribe || 1500;
    var v2 = await UI.ask('객씨의 사람들이 취연을 찾는다', [
      { label: '유 태감을 매수해 빈 나무 궤짝에 숨긴다 (금화 ' + U.num(bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < bribe },
      { label: '동안문의 동창을 뚫고 나간다', value: 'gate', icon: 'sword' },
      { label: '두고 간다', value: 'leave' }], me());
    var good = false;
    if (v2 === 'bribe' && s.player.gold >= bribe) {
      s.player.gold -= bribe; good = true;
      await play([['dl_yu', '(금화를 세며 콧등을 찡그린다) …백단향 궤짝 하나가 비었구려. 궤짝에 든 것이 나무인지 사람인지 어용감은 냄새로만 알지. 오늘은 코가 막혔소.']]);
    } else if (v2 === 'gate') {
      var r = await fight('동안문의 동창 교위들', (K().foe || {}).gate || 16, { leader: '동창의 첩형' });
      good = r === 'win';
      if (!good) await play([[null, '쇠사슬을 든 교위들이 문을 막았다. 어둠 속에서 취연의 손이 제독의 손에서 빠져나갔다.']]);
    }
    b.cuiWay = v2;
    if (!good) {
      b.cui = v2 === 'leave' ? 'left' : 'lost';
      log('북경 — 성비의 궁녀 취연이 객씨의 사람들에게 붙잡혔다. 그 뒤로 그녀를 본 사람은 없다.');
      refresh(); return;
    }
    await withPic('dl_cart', '새벽의 운하', function () { return play([
      [null, '새벽, 통주의 운하 나루. 나무 궤짝 뚜껑이 열리고 나뭇밥을 뒤집어쓴 궁녀가 몸을 일으킨다. 한쪽 볼에만 보조개가 팬다.'],
      ['CY', '(나뭇밥을 털며 웃는다) 백단향 냄새가 배었어요. 열 해 만에 궁 밖 하늘이에요. …마마께서는 사실 거예요. 벽 틈에 보름 치가 있으니까요.'],
      ['CY', '저는 궁에서 곳간 열쇠와 장부를 맡았어요. 쌀 한 톨도 안 틀려요. 선장님 배의 곳간도 맡겨 주세요. 이제 제 이름으로 사는 법을 배우고 싶어요.']
    ]); });
    b.cui = 'joined';
    join('dl_cuiyan', 86, BEIJING);
    var f2 = fame('so', 'cui');
    log('북경 — 객씨에게 쫓기던 성비의 궁녀 취연을 ' + (v2 === 'bribe' ? '빈 백단향 궤짝에 숨겨' : '동안문을 뚫고') + ' 궁 밖으로 빼냈다. 그녀가 배의 곳간을 맡았다. (사교 명성 +' + f2 + ')');
    UI.toast('취연 — 자금성의 궁녀가 배에 올랐다', 'people', 6000);
    refresh();
  }

  // ================================================================ ③ 서호의 탄궁 — 설소소와 소만 (1625.4.25~1626.3.31, 항주)
  function lakeOpen() { var b = st(), t = today(); return !!(b && !b.lake && cityNow() === HANGZHOU && t >= D.lakeFrom && t <= D.lakeTo && !row('dl_xiaoman')); }
  async function lake() {
    var b = st(), s = S(), k = K();
    await withPic('dl_westlake', '서호의 탄궁', function () { return play([
      [null, '서호, 소제(蘇堤)의 버드나무 길. 구경꾼이 겹겹이 둘러섰다. 흰머리를 옥비녀 하나로 틀어 올린 늙은 여인이 남장한 승마복 차림으로 말에 올라 있다.'],
      [CROWD, '설소소요, 설소소! 젊어서는 진회의 으뜸 명기, 그림은 동기창이 칭찬했고 바둑은 사내들을 이겼다지. 예순이 넘어도 활은 여전하다오!'],
      [null, '스무 걸음 앞, 머리를 높이 묶은 아가씨가 정수리에 흙탄 하나를 얹고 선다. 붉은 입술을 꼭 다물었다. 말이 달린다 — 탄궁 소리 — 흙탄이 가루가 되어 흩어진다. 아가씨의 머리카락 한 올 흔들리지 않았다.'],
      ['dl_susu', '(말을 세우며 웃는다) 이번엔 네 차례다, 만아.'],
      [null, '이번엔 늙은 여인이 옥비녀 끝에 흙탄을 얹는다. 아가씨가 말에 올라 달리며 시위를 당긴다 — 그때만 그녀가 웃는다. 흙탄이 터지고, 옥비녀는 그대로다. 구경꾼들이 함성을 지른다.'],
      ['XM', '(말에서 뛰어내려 제독을 흘끗 보고) 뭘 그렇게 봐요? 남만 배 선장이죠? 바다 냄새가 나요. …스승님 비녀는 제가 맞힌 적 없어요. 일부러 안 맞히는 거예요.']
    ]); });
    await play([
      [null, '그때 둑 건너편이 소란해진다. 갈색 관복에 흰 가죽 장화 — 동창의 교위들이다. 무명 옷의 여인이 어린 아들을 안고 버드나무 사이로 달려온다.'],
      ['dl_lu', '(숨이 넘어가며) 살려 주세요… 남편은 동림의 선비예요. 북경에서 좌광두 어른의 옥바라지를 하다 붙잡혔어요. 이제 식구까지 잡아들인대요.'],
      ['dl_tiqi', '(쇠사슬을 흔들며) 동림의 잔당이다! 구천세의 명이다. 숨겨 주는 놈도 같은 죄다! 호수에 등불을 올려라, 배를 다 막아라!'],
      [null, '호숫가 망루에 신호 등불이 하나둘 오른다. 소만이 말없이 흙탄을 집어 든다 — 탄궁 소리 셋. 등불 심지 셋이 끊겨 어둠이 내린다.'],
      ['XM', '(시위를 거두며) 등불은 내가 끊었어요. 나머지는 선장님 몫이에요. 저 사람들 태울 배가 있잖아요.']
    ]);
    var bribe = k.bribe || 1500;
    var v = await UI.ask('동창이 동림 선비의 식구를 쫓는다', [
      { label: '제독의 배에 태운다 — 부두의 교위들과 싸운다', value: 'ship', icon: 'sword' },
      { label: '교위에게 은을 쥐여 준다 (금화 ' + U.num(bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < bribe },
      { label: '모른 척한다', value: 'no' }], me());
    var good = false;
    if (v === 'ship') {
      var r = await fight('서호 부두의 동창 교위', (k.foe || {}).lake || 12, { leader: '동창의 교위' });
      good = r === 'win';
      if (!good) await play([[null, '쇠사슬이 여인의 팔을 감았다. 아이의 울음소리가 호수 위로 멀어졌다.']]);
    } else if (v === 'bribe' && s.player.gold >= bribe) {
      s.player.gold -= bribe; good = true;
      await play([['dl_tiqi', '(은을 저울질하다 품에 넣고) …어두워서 아무것도 못 봤다. 등불이 왜 꺼졌는지 모르겠구먼.']]);
    }
    b.lakeWay = v;
    if (!good) {
      b.lake = v === 'no' ? 'pass' : 'lost';
      if (v === 'no') await play([['XM', '(차갑게) 그럴 줄 알았어요. 바다 사람도 별수 없네요.'], ['dl_susu', '(한숨) 만아, 그만. 저 사람에게도 돌아갈 배가 있다.']]);
      log('항주 서호 — 동림 선비의 식구가 동창에 붙잡혔다.');
      refresh(); return;
    }
    b.lake = 'saved';
    await withPic('dl_orchid', '배 위의 난초', function () { return play([
      [null, '밤, 제독의 배. 여인과 아이가 선창에 잠들었다. 설소소가 갑판에 먹을 갈아 단숨에 난초 한 폭을 친다.'],
      ['dl_susu', '나는 젊어서 열 가지 재주로 사내들을 줄 세웠지요. 그런데 끝내 한 번도 멀리 가 보지 못했어요. 누구의 첩, 누구의 집, 누구의 호수.'],
      ['dl_susu', '(소만을 돌아보며) 이 아이는 서호가 좁다고 우는 아이예요. 활도 말도 다 가르쳤지만 바다는 내가 못 가르쳐요. …데려가 주세요. 제 이름으로 쏘고, 제 이름으로 달리게.'],
      ['XM', '(고개를 돌린 채) …울긴 누가 울었다고요. (잠시 뒤, 작게) 스승님 비녀는, 언젠가 돌아와서 맞힐 거예요.'],
      ['dl_susu', '(난초 그림을 건네며) 소주에 가거든 창문(閶門) 밖 제 옛 집 사람들을 찾으세요. 성문 지키는 사람들도 내 그림 한 장쯤은 받아 봤답니다.']
    ]); });
    give('dl_orchid');
    pass([SUZHOU, HANGZHOU]);
    join('dl_xiaoman', 84, HANGZHOU);
    var f = fame('so', 'man');
    log('항주 서호 — 동창에 쫓기던 동림 선비의 식구를 ' + (v === 'bribe' ? '교위를 매수해' : '부두의 교위를 물리치고') + ' 배에 태웠다. 설소소의 제자 소만이 탄궁을 메고 배에 올랐다. 「설소소의 난초 그림」을 받았다. (사교 명성 +' + f + ')');
    UI.toast('소만 — 서호의 탄궁이 배에 올랐다', 'people', 6000);
    refresh();
  }

  // ================================================================ ④ 다섯 사람 — 소주 민변 (1626.3.1~4.14, 소주 · 항주)
  function riotOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.riot && (c === SUZHOU || c === HANGZHOU) && t >= D.riotFrom && t <= D.riot && !row('dl_wangwei')); }
  async function riot() {
    var b = st(), s = S(), k = K(), fromHz = cityNow() === HANGZHOU, man = !!row('dl_xiaoman'), cui = !!row('dl_cuiyan');
    await withPic('dl_skiff', '책을 실은 거룻배', function () { return play([
      [null, fromHz ? '서호의 물가. 책을 가득 실은 거룻배 한 척이 매여 있다. 풀빛 옷에 맨 비녀 하나 — 뱃머리에 앉아 시를 읽던 여인이 고개를 든다. 달빛 아래 호수처럼 서늘한 얼굴이다.'
        : '소주 창문(閶門) 밖 운하. 책을 가득 실은 거룻배 한 척이 다리 밑에 매여 있다. 풀빛 옷에 맨 비녀 하나 — 뱃머리에서 시를 읽던 여인이 고개를 든다. 달빛 아래 호수처럼 서늘한 얼굴이다.'],
      ['WW', '바다 냄새가 나는 분이네요. 양주의 왕미예요. 사람들은 초의도인이라고도 부르고요. 이 배로 강과 호수를 떠돌며 산 이름을 모으는 사람이에요.'],
      ['WW', '(책을 덮으며) 북경의 동창이 소주의 주순창 어른을 잡으러 온대요. 벼슬을 내놓고도 굶는 백성 편만 들던 분이에요. 위충현의 생사를 세우자는 말에 침을 뱉으셨다고요.'],
      ['WW', fromHz ? '저는 소주로 내려가요. 시인이 할 수 있는 건 보고 적는 것뿐이지만 — 그날을 적을 사람은 있어야 하니까요. 함께 가 보시겠어요? 운하로 사흘이에요.' : '저는 그날을 보려고 여기 배를 댔어요. 시인이 할 수 있는 건 보고 적는 것뿐이지만 — 적을 사람은 있어야 하니까요.']
    ]); });
    if (fromHz) await play([[null, '제독은 배를 항주에 남겨 두고 선원 몇과 함께 왕미의 거룻배에 올랐다. 운하의 버드나무가 사흘 내내 이어졌다.']]);
    await passTo(D.riot);
    await withPic('dl_riot', '서찰원 앞 (1626)', function () { return play([
      [null, '소주 서찰원 앞. 비가 내린다. 만 명이 넘는 사람이 향을 들고 길을 메웠다. 선비도, 비단 짜는 직공도, 가마꾼도, 떡장수도.'],
      ['dl_zhou', '(쇠사슬에 묶인 채, 군중을 향해) 돌아들 가시오. 나 하나 때문에 소주가 피를 보아서는 안 되오.'],
      ['dl_tiqi', '(붉은 체포 문서를 펼치며) 동창이 잡는 사람이다! 감히 길을 막아? 구천세의 명이다 — 모두 물러서라!'],
      ['dl_yan', '(맨 앞에서 소리친다) 성지(聖旨)는 천자에게서 나온다더니 — 동창에서도 나오는가!'],
      [MOB, '(함성) 동창에서 나온다고? 그럼 가짜 성지다! 쳐라!'],
      ['WW', '(제독의 소매를 잡으며, 처음으로 목소리가 떨린다) …보세요. 저 사람들 이름을 아무도 모를 거예요. 내일이면.']
    ]); });
    var v = await UI.ask('서찰원 앞, 들고일어난 소주 백성', [
      { label: '군중과 함께 교위들을 친다', value: 'fight', icon: 'sword' },
      { label: '주순창을 배로 빼내자고 청한다', value: 'save', icon: 'anchor' },
      { label: '지켜본다 — 「시인 곁에서 보고 적겠소」', value: 'watch', icon: 'eye' }], me());
    b.riotWay = v;
    if (v === 'fight') {
      var r = await fight('서찰원의 동창 교위', (k.foe || {}).riot || 14, { leader: '동창의 첩형' });
      await play([[null, r === 'win' ? '교위의 쇠사슬을 빼앗아 던졌다. 교위들은 담을 넘고 뒷간에 숨고 운하에 뛰어들어 달아났다. 하나는 다시 일어나지 못했다.' : '교위들의 칼에 밀려났다. 그러나 그 뒤로 군중이 밀려들어, 교위들은 결국 담을 넘어 달아났다.']]);
      if (man) await play([['XM', '(지붕 위에서 탄궁을 거두며) 체포 문서 든 손만 맞혔어요. 문서가 진흙탕에 빠졌네요. 아깝다.']]);
    } else if (v === 'save') {
      await play([
        ['dl_zhou', '(제독을 똑바로 보며) 고맙소, 바다의 사람. 그러나 내가 가지 않으면 다음엔 소주의 성문마다 교위가 설 것이오. 저 사람들의 목이 내 목 대신 걸릴 것이오.'],
        ['dl_zhou', '나는 걸어서 가겠소. (군중을 향해) 소주 사람들은 할 만큼 했소!']
      ]);
      if (cui) await play([['CY', '(작게) 궁에서도 그랬어요. 마마께서 「모르는 일」이라고 하셔야 제가 살았듯이… 저분은 스스로 걸어가셔야 소주가 사는 거예요.']]);
    } else {
      await play([[null, '빗속에서 함성과 비명이 오갔다. 교위들이 담을 넘어 달아났다. 왕미는 젖은 종이에 무언가를 계속 적었다.']]);
    }
    await play([
      [null, '며칠 뒤. 주순창은 끝내 스스로 걸어 나가 북경으로 끌려갔다. 순무는 「주모자」를 내놓으라 했고, 다섯 사내가 스스로 관아에 걸어 들어갔다 — 안패위, 양념여, 마걸, 심양, 주문원.'],
      ['dl_yan', '(관아 앞에서 제독을 보고 씩 웃는다) 소주 사람이 다 잡혀가느니 우리 다섯이면 되오. 바다 양반, 이름이나 기억해 주시오.'],
      ['WW', '(종이에 다섯 이름을 적어 내밀며) 이건 팔 수 없는 거예요. 제가 한 장, 선장님이 한 장. …누구든 한 사람은 살아서 이걸 읽어야 하니까요.']
    ]);
    give('dl_wuren');
    b.riot = 'done';
    var f = fame('so', 'riot');
    log('1626년 소주 민변 — 동창이 주순창을 잡으러 온 날, 서찰원 앞에서 ' + (v === 'fight' ? '군중과 함께 교위들을 쳤다' : v === 'save' ? '주순창을 빼내려 했으나 그는 스스로 걸어갔다' : '시인 왕미와 함께 그날을 지켜보았다') + '. 다섯 사람의 이름을 받았다. (사교 명성 +' + f + ')');
    await wangAsk(b, 'riot');
  }
  async function wangAsk(b, from) {
    await play([
      ['WW', from === 'riot' ? '(운하에 빗방울이 그친다) 저는 이 배로 동정호도 가고 여산도 올랐어요. 산 이름은 다 모았는데… 바다 이름은 하나도 몰라요.' : '(뱃전에 기대어) 산 이름은 다 모았어요. 그런데 바다 이름은 하나도 몰라요.'],
      ['WW', '선장님 배는 책 실을 자리 있어요? 서른 권쯤. 그리고 시인 하나. 『명산기』 다음엔 『명해기』를 쓰고 싶어요.']
    ]);
    var v = await UI.ask('왕미가 바다를 보고 싶어 한다', [
      { label: '「책 서른 권쯤이야」 — 함께 간다', value: 'yes', icon: 'people' },
      { label: '「그대의 배는 강과 호수가 어울리오」 — 놓아준다', value: 'no' }], me());
    if (v !== 'yes') {
      b.wang = 'free';
      await play([['WW', '(웃으며 노를 잡는다) 그 말도 시 같네요. 언젠가 바다 이름 하나만 편지로 보내 주세요.']]);
      refresh(); return;
    }
    b.wang = 'joined';
    await play([['WW', '(책 보따리를 안고 뱃전을 넘으며) 배 위가 제 집이에요. 이번엔 조금 큰 배일 뿐이죠. 첫 줄은 벌써 생각했어요 — 「물에는 길이 없다더니, 별이 길이었구나」.']]);
    join('dl_wangwei', 84, from === 'riot' ? SUZHOU : HANGZHOU);
    var f = fame('so', 'wang');
    log('시인 왕미(초의도인)가 책 서른 권을 안고 배에 올랐다. 『명산기』 다음엔 『명해기』를 쓰겠다고 한다. (사교 명성 +' + f + ')');
    UI.toast('왕미 — 강남의 시인이 배에 올랐다', 'people', 6000);
    refresh();
  }

  // ================================================================ ④' 서호의 배 — 왕미 (1626.4.15~1627.12.31, 항주·소주 — ④를 놓쳤으면)
  function lateOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.riot && !b.wang && (c === HANGZHOU || c === SUZHOU) && t > D.riot && t <= D.lateTo && !row('dl_wangwei')); }
  async function late() {
    var b = st(), t = today();
    b.riot = 'late';
    await withPic('dl_buxi', '불계원의 배', function () { return play([
      [null, '서호에 떠 있는 커다란 놀잇배 「불계원(不繫園)」 — 매이지 않은 정원이라는 뜻이다. 휘주 상인 왕연명이 문사들을 태우려고 지은 배다. 뱃전에 풀빛 옷의 여인이 혼자 앉아 있다.'],
      ['WW', '양주의 왕미예요. 초의도인이라고도 하고요. (먼 데를 보며) 봄에 소주에서 사람들이 들고일어났어요. 동창이 주순창 어른을 잡으러 와서요. 저는 그날 그 자리에 있었어요.'],
      ['WW', t >= NEWS_AT.five ? '그 일로 다섯 사람이 목이 베였어요. 웃으면서 갔대요. 저는 그 이름을 적었고요. 그런데 이 호숫가엔 위충현의 생사가 섰어요. 매일 그 앞을 지나요.' : '다섯 사람이 「우리가 주모자」라며 스스로 관아에 걸어 들어갔어요. 저는 그 이름을 적었고요.'],
      ['WW', '선장님, 시 한 수 청해도 될까요? 바다의 사람은 무슨 노래를 하는지 궁금해요.']
    ]); });
    await play([[{ name: S().player.name, portrait: S().player.portrait, rigId: 'player' }, '(뱃노래 한 자락을 흥얼거린다) …시는 모르오. 우리 배에서는 이걸 부르며 닻을 올리오.'],
      ['WW', '(눈을 감고 듣다가) 글자가 하나도 없는데 시네요. 「매이지 않은 정원」은 이 배가 아니라 선장님 배였어요.']]);
    await wangAsk(b, 'late');
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[woodOpen, deliver], [lakeOpen, lake], [riotOpen, riot], [lateOpen, late], [callOpen, call]];
  DL.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  DL.check = async function () {
    if (DL._busy) return false; DL._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    DL._busy = false; refresh();
    return true;
  };
  DL._t = { call: call, deliver: deliver, lake: lake, riot: riot, late: late };
})(window.G = window.G || {});
