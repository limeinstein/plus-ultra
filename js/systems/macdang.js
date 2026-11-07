/* 막 왕조의 성립 (G.MacDang) 2026-11-07 사용자 요청
   「1527 베트남 — 막 왕조 성립. 막당중이 레 왕조의 왕위를 차지함. 이후 레 왕조 복구 세력과의 장기적인 권력 투쟁으로 이어짐」 · 「플레이어와 관계되는 미형 인물 등장하게 해」
   사람·동료·소지품·조정값: js/data/macdang.js (G.BALANCE.macdang). 큰 역사는 바뀌지 않는다. 날짜는 게임의 양력(음력을 바꿔 셈).
   (위목제 「돼지 임금」 양익제가 찔려 죽음 1516.5.18 · 소종이 탕롱을 버리고 달아남·공황 옹립 1522.8.2 · 소종이 죽음 1526.1.17 ·
    막당중 즉위(음력 6.15) 1527.7.22 · 공황과 태후가 죽음 1527.7.25 · 막당영에게 물려줌 1530.1.10 · 장종이 아이라오에서 즉위 1533.2.4 ·
    진남관에서 명에 엎드림(음력 11.3) 1540.12.10 · 막당중이 죽음(음력 8.22) 1541.9.21 · 응우옌 낌이 독살됨 1545.7.8)
   ■ ① 꼬짜이에서 온 씨름꾼 (1522.8.2~1527.6.14, 교도 — 누구나 한 번): 탕롱 성 앞 봄 씨름판. 인국공 막당중 · 허수아비 임금 공황 · 태후전의 여관 후옌
        → 씨름꾼 끼엔이 「남만 선장」에게 샅바를 내민다: 맞붙는다(힘 — 이기든 지든 벗이 된다) / 사양한다
        → 인국공의 주문: 남만의 총 n통을 기한 안에 (시세의 k배) — 약조 / 사양
        → 후옌: 태후의 약 — 배의 약재를 지어 준다(금화) / 이야기만 나눈다
   ■ ①' 총을 바친다 (교도, 약조한 뒤 기한 안, 1527.7.21까지 · 총을 실었으면): 끼엔이 짐을 부린다(벗) · 금화 · 「막당중의 그물추」
   ■ ② 여섯째 달 보름 (1527.6.15~7.21, 교도 — 누구나): 막당중이 왕위를 받는다는 날이 다가온다. 후옌이 부엌 머슴 옷을 입힌 열두 살의 왕손 레 주이 닌을 데려온다
        → (가) 왕손을 배로 빼낸다: 홍강 부두 — 끼엔이 벗이면 「오늘 밤 아무것도 못 봤습니다」(싸우지 않는다 · 함께 가자 → 동료 / 돌아가라)
               벗이 아니면 금위와 육상전 → 이기면 사흘 뒤 마 강 어귀, 응우옌 낌 · 「후옌의 대모 빗」 → 함께 간다(동료 「후옌」) / 왕손 곁에 남는다(1533에 다시)
               지면 후옌이 왕손을 고깃배에 숨겨 어둠 속으로 사라진다
           (나) 막의 즉위 잔치에 남는다 — 7.22까지 날이 지나간다 · 하사금 · 그물추 (후옌은 떠난다)  (다) 떠난다
   ■ ③ 깃발이 오르다 (1533.2.4~1535.12.31, 유에 — ②에서 후옌이 왕손 곁에 남았으면): 응우옌 낌의 사자가 된 후옌 — 「레의 깃발이 다시 올랐어요」 → 동료 「후옌」
   ■ ④ 진남관의 밧줄 (교도 — ②에서 돌아가라 했으면 1528.1.1부터, 끼엔을 만났으면 1540.12.10부터 · 1542.12.31까지): 끼엔 → 동료 「끼엔」 · 「진남관의 밧줄 한 토막」
   ■ 소식: 돼지 임금(1516) · 소종의 도망(1522) · 소종의 죽음(1526) · 막당중 즉위(1527.7.22) · 공황과 태후(7.25) · 막당영(1530) · 장종(1533) · 진남관(1540) · 막당중의 죽음(1541) · 응우옌 낌(1545)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/md_*.webp
   ■ 저장: s.macDang = { met, wrestle: 'win'|'lose'|'no', kien: 'met'|'friend'|'joined'|'stay'|'free', order: 'take'|'no'|'done'|'late', dueDay, huyen: 'met'|'friend'|'joined'|'stay'|'gone'|'lost'|'free',
            night: 'ship'|'mac'|'no', esc: 'won'|'lost'|'pass', told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var MD = G.MacDang = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.macdang) || {}; }
  var THANGLONG = 165, HUE = 164;
  var D = MD.D = { meetFrom: 15220802, meetTo: 15270614, nightFrom: 15270615, nightTo: 15270721, throne: 15270722,
    flagFrom: 15330204, flagTo: 15351231, kienStay: 15280101, kienFrom: 15401210, kienTo: 15421231 };
  var NEWS_AT = MD.NEWS_AT = { pig: 15160518, flee: 15220802, chieu: 15260117, throne: 15270722, cung: 15270725, doanh: 15300110, trang: 15330204, pass: 15401210, death: 15410921, kim: 15450708 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.macDang) {
      s.macDang = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.macDang.told[k] = 1; });   // 옛 저장 — 지난 소식은 띄우지 않는다
    }
    if (!s.macDang.told) s.macDang.told = {};
    return s.macDang;
  }
  MD.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 13 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 13 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  // 말하는 사람: HY 후옌 · KI 끼엔 · NK 응우옌 빈 키엠 (아직 동료가 아니어도 동료 얼굴로 선다)
  var WHO = { P: me, F: first, HY: function (e) { return mateSp('md_huyen', e); }, KI: function (e) { return mateSp('md_kien', e); }, NK: function (e) { return mateSp('h_nguyenbinhkhiem', e); } };
  var CROWD = { name: '구경꾼', lang: 13 }, HERALD = { name: '내관', lang: 13 };
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
  function cargo(id) { var c = S().fleet.cargo[id]; return c ? c.q : 0; }
  function takeCargo(id, n) { var f = S().fleet, c = f.cargo[id]; if (!c) return; c.q -= n; if (c.q <= 0) delete f.cargo[id]; }
  function join(id, loyal, cityId) { if (row(id) || !G.Legend || !G.Legend.join) return row(id); var m = G.Legend.join(id, G.CITY_DATA[cityId]); if (m && loyal) m.loyal = loyal; return m; }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  async function passN(n) {
    if (!(n > 0)) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  async function passTo(day) { await passN(U.dayIndex({ y: Math.floor(day / 10000), m: Math.floor(day / 100) % 100, d: day % 100 }) - U.dayIndex(S().date)); }
  function order() { var o = K().order || {}; return { good: o.good || 'guns', n: o.n || 20, k: o.k || 2, days: o.days || 240 }; }
  function orderGold() { var o = order(), p = (G.GOOD && G.GOOD[o.good] && G.GOOD[o.good].p) || 85; return Math.round(o.n * p * o.k); }
  MD.orderGold = orderGold;
  function goodName() { var g = G.GOOD && G.GOOD[order().good]; return g ? g.name : '총'; }
  function strength() { var p = S().player; return (p.st && p.st.str) || 0; }
  function hasKhiem() { return !!(G.MATE && G.MATE.h_nguyenbinhkhiem); }

  // ================================================================ 소식
  MD.daily = function () {
    var b = st(), out = []; if (!b) return out;
    var s = S(), t = today(), told = b.told;
    function news(k, icon, text) { if (!told[k] && t >= NEWS_AT[k]) { told[k] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('pig', 'skull', '【대월 — 돼지 임금의 죽음】 탕롱에서 레 왕조의 양익제가 장수 찐 주이 산의 손에 찔려 죽었다. 백성의 등골로 아홉 층 누대(구중대)를 쌓다 「돼지 임금」이라 불린 임금이었다. 앞의 위목제는 「귀신 임금」이라 불렸다. 남쪽에서는 쩐 까오가 군사를 일으켰다.');
    news('flee', 'crown', '【대월 — 소종이 탕롱을 버리다】 레 왕조의 소종이 밤에 몰래 궁을 빠져나가 서쪽으로 달아났다. 권신 막당중은 임금의 아우를 새 임금(공황)으로 세웠다. 이제 대월에는 임금이 둘이다. 막당중은 꼬짜이 바닷가 어부의 아들로, 씨름 시험에 붙어 금위가 된 사람이다.');
    news('chieu', 'skull', '【대월 — 소종의 죽음】 붙잡혀 온 소종이 탕롱에서 목숨을 잃었다. 막당중이 시킨 일이라고들 한다. 소종의 어린 아들은 어디로 갔는지 아무도 모른다.');
    news('throne', 'crown', '【막 왕조】 대월의 막당중이 공황에게서 왕위를 물려받아 임금이 되었다. 연호는 명덕(明德). 레 왕조가 선 지 백 년 만이다. 꼬짜이의 어부가 용상에 올랐다.' +
      (b.night === 'mac' ? ' 즉위 잔치에는 남만의 배를 몰고 온 선장도 앉아 있었다고 한다.' : b.esc === 'won' ? ' 그날 아침 탕롱의 부엌에서 머슴 아이 하나가 사라졌는데, 아무도 그 일을 입에 올리지 않았다.' : ''));
    news('cung', 'skull', '【공황과 태후】 왕위에서 물러난 공황과 그 어머니 태후가 막당중이 내린 명으로 스스로 목숨을 끊었다. 태후는 마지막까지 염주를 놓지 않았다고 한다.' +
      (b.huyen === 'joined' || b.huyen === 'stay' ? ' 태후전의 여관 하나가 그 전에 궁을 빠져나갔다는 말이 있다.' : ''));
    news('doanh', 'scroll', '【대월 — 막당영】 막당중이 맏아들 막당영에게 왕위를 물려주고 상황(上皇)이 되었다. 그러나 나라의 큰일은 여전히 꼬짜이의 상황이 정한다고 한다.');
    news('trang', 'flag', '【레 왕조의 깃발】 서쪽 산 너머 아이라오(란상)에서 레 왕조의 옛 장수 응우옌 낌이 소종의 아들 레 주이 닌을 임금으로 세웠다 — 장종이다. 연호는 원화(元和). 이제 북쪽에는 막, 남쪽에는 레 — 대월이 둘로 갈라졌다.' +
      (b.esc === 'won' ? ' 열두 살에 남만 배를 타고 탕롱을 빠져나온 그 소년이다.' : ''));
    news('pass', 'seal', '【진남관】 명이 대군을 국경에 모으자, 막당중이 목에 밧줄을 걸고 맨발로 진남관에 나가 명의 장수 앞에 엎드렸다. 땅의 장부를 바치고 국경의 다섯 고을을 내주었다. 명은 그를 「안남 도통사」라 불렀다 — 나라가 아니라 한 고을의 우두머리라는 뜻이다.');
    news('death', 'skull', '【막당중의 죽음】 막 왕조를 연 막당중이 고향 꼬짜이에서 숨을 거두었다. 어부의 아들로 태어나 씨름으로 이름을 얻고, 칼로 용상에 올랐다가, 밧줄로 나라를 지킨 사람이었다.');
    news('kim', 'skull', '【응우옌 낌의 죽음】 레 왕조를 되살린 응우옌 낌이 숨졌다. 막에서 넘어온 항장 즈엉 쩝 녓이 독을 썼다고 한다. 군사는 사위 찐 끼엠이 이어받았다. 남북의 싸움은 아직 끝날 기미가 없다.' +
      (b.huyen === 'joined' ? ' 「장군님은 강 어귀에서 그 아이를 받아 안던 분이었어요.」' : ''));
    // ① 인국공의 기한
    if (b.order === 'take' && b.dueDay != null && s.day > b.dueDay) { b.order = 'late'; out.push({ icon: 'scroll', text: '탕롱의 인국공 막당중과 약조한 ' + goodName() + '의 기한이 지났다.' }); }
    return out;
  };

  // ================================================================ ① 꼬짜이에서 온 씨름꾼 (1522.8.2~1527.6.14, 교도)
  function meetOpen() { var b = st(), t = today(); return !!(b && !b.met && cityNow() === THANGLONG && t >= D.meetFrom && t <= D.meetTo); }
  async function meet() {
    var b = st(), s = S(), K0 = K(), o = order(), gn = goodName(), g = orderGold();
    b.met = 1;
    await withPic('md_wrestle', '탕롱의 씨름판', function () { return play([
      [null, '탕롱 성 앞 너른 마당. 북소리가 울리고 맨몸에 샅바만 찬 사내들이 모래판에서 맞붙는다. 붉은 일산 아래 몸에 맞지 않는 곤룡포를 입은 젊은 임금이 앉았고, 그 곁에 어깨가 떡 벌어진 사내가 팔짱을 끼고 섰다.'],
      [CROWD, '저분이 인국공이시오. 꼬짜이 바닷가 어부의 아들인데, 씨름 시험에 붙어 금위가 되셨지. 지금은 임금님보다 높으시고.'],
      [null, '모래판에서 키 큰 젊은이가 상대를 번쩍 들어 메친다. 구릿빛 등에 젖은 검은 머리가 늘어지고, 웃자 검게 칠한 이가 반짝인다. 구경하던 처녀들이 소리를 지른다.'],
      ['KI', '(가쁜 숨으로 모래를 털며) 꼬짜이의 끼엔이오! 또 나올 사람 없소? (구경꾼 사이의 남만 옷을 보고 눈을 반짝인다) 거기 남만 선장 나으리 — 바다 사람끼리 한판 어떻소?']
    ]); });
    var w = await UI.ask('끼엔이 샅바를 내민다', [
      { label: '웃옷을 벗고 모래판에 오른다', value: 'yes', icon: 'people' },
      { label: '「배 위에서라면 모를까」 — 사양한다', value: 'no' }], me());
    if (w === 'yes') {
      var won = strength() >= (K0.wrestle || 62);
      b.wrestle = won ? 'win' : 'lose'; b.kien = 'friend';
      await play(won ? [
        [null, '두 사람이 샅바를 쥐고 한참을 버틴다. 끼엔의 발이 모래를 파고드는 순간, 제독이 허리를 틀어 그를 모래판에 눕힌다. 마당이 뒤집힌다.'],
        ['KI', '(모래판에 누운 채 크게 웃으며) 하하! 배 위에서 단련된 허리구려! 꼬짜이에선 날 눕힌 사람이 인국공 나으리 말고는 없었소. 오늘부터 형님이라 부르리다.']
      ] : [
        [null, '샅바를 쥐자마자 몸이 붕 뜬다. 하늘과 모래가 한 바퀴 돌고, 제독은 등으로 모래판을 받는다.'],
        ['KI', '(손을 내밀어 일으키며) 바다 사람치고 허리가 좋소! 버틴 시간이 제일 길었소. 꼬짜이에선 이런 사람을 벗이라 하오. 내 배가 있으면 태워 주고 싶구려.']
      ]);
      var f0 = fame('so', 'wrestle');
      log('탕롱의 씨름판에서 꼬짜이의 씨름꾼 끼엔과 맞붙었다 — ' + (won ? '이겼다.' : '졌다.') + ' 그는 제독을 벗이라 불렀다. (사교 명성 +' + f0 + ')');
    } else {
      b.wrestle = 'no'; b.kien = 'met';
      await play([['KI', '(어깨를 으쓱하며) 배 위라니, 그럼 언젠가 배 위에서 하십시다. 바다 사람은 약속을 잊지 않소.']]);
    }
    await play([
      ['md_mac', '(팔짱을 풀고 다가오며) 남만의 선장인가. 나는 막당중이오. 나도 고기를 잡던 손이라, 바다 사람의 손은 알아보오.'],
      ['md_mac', '서쪽 산에 달아난 옛 임금의 무리가 아직 남았소. 활과 창으로는 끝이 나지 않소. 남만의 총 ' + o.n + '통을 ' + o.days + '일 안에 이 탕롱으로 가져오면 시세의 ' + o.k + '배 — 금화 ' + U.num(g) + '닢을 치르리다.']
    ]);
    var v = await UI.ask('인국공의 주문', [
      { label: '약조한다 — ' + gn + ' ' + o.n + '통을 ' + o.days + '일 안에 (금화 ' + U.num(g) + '닢)', value: 'take', icon: 'ship' },
      { label: '「남의 나라 싸움에 총은 팔지 않소」 — 사양한다', value: 'no' }], me());
    b.order = v;
    if (v === 'take') {
      b.dueDay = s.day + o.days;
      await play([['md_mac', '(고개를 한 번 끄덕이며) 그물은 던지면 거두는 것이오. 기다리겠소.']]);
      log('탕롱의 인국공 막당중 — 남만의 ' + gn + ' ' + o.n + '통을 ' + o.days + '일 안에. 시세의 ' + o.k + '배.');
      UI.toast('인국공의 주문 — ' + gn + ' ' + o.n + '통 → 교도(탕롱) (' + o.days + '일)', 'ship', 6000);
    } else {
      await play([['md_mac', '(눈썹 하나 움직이지 않고) 그럼 포르투갈 사람에게 사지. 바다는 넓고 장사꾼은 많소.']]);
    }
    // 후옌 — 태후의 약
    await withPic('md_huyen', '태후전의 여관', function () { return play([
      [null, '씨름판이 파하고 사람들이 흩어질 무렵, 옥빛 교령포의 여인이 일산을 접어 들고 다가온다. 검은 비단 띠로 감아 올린 머리, 웃자 옻칠처럼 검은 이가 반짝인다.'],
      ['HY', '태후전의 여관 후옌이에요. 남만 선장님, 실례를 무릅쓰고 여쭐게요. 배에 의원이 있나요? 태후마마께서 밤마다 가슴이 답답해 잠을 못 이루세요.'],
      ['HY', '(목소리를 낮추어) 궁의 의원들은 인국공 나으리 눈치만 봐요. 바다 건너의 약이라면… 마마께서 조금은 마음을 놓으실 것 같아요.']
    ]); });
    var m = await UI.ask('후옌의 부탁', [
      { label: '배의 약재로 약을 지어 준다 (금화 ' + (K0.medicine || 200) + ')', value: 'med', icon: 'heart', dis: s.player.gold < (K0.medicine || 200) },
      { label: '이야기만 나눈다', value: 'talk' }], me());
    if (m === 'med' && s.player.gold >= (K0.medicine || 200)) {
      s.player.gold -= (K0.medicine || 200); b.huyen = 'friend';
      await play([['HY', '(약봉지를 두 손으로 받아 품에 넣으며) 이 은혜를 마마께 꼭 아뢸게요. 선장님 배 이름도요. …궁에서 누가 제게 이렇게 해 준 건 처음이에요.']]);
      log('태후전의 여관 후옌에게 태후의 약을 지어 주었다. 그녀는 배의 이름을 외워 갔다.');
    } else {
      b.huyen = 'met';
      await play([['HY', '(쓸쓸히 웃으며) 그렇겠지요. 남의 나라 궁의 일이니까요. 그래도 바다 이야기는 고마웠어요. 강 끝에서 바다가 그렇게 넓은지 몰랐어요.']]);
    }
    if (hasKhiem()) await play([['NK', '(돌아가는 길, 강둑에서 낚싯대를 드리운 선비가 혼잣말을 한다) 용이 바다에서 올라오면 물이 뒤집히는 법이지. 몇 해 안 남았어.']]);
    refresh();
  }

  // ================================================================ ①' 총을 바친다 (교도)
  function deliverOpen() { var b = st(), t = today(), o = order(); return !!(b && b.order === 'take' && cityNow() === THANGLONG && t <= D.nightTo && S().day <= b.dueDay && cargo(o.good) >= o.n); }
  async function deliver() {
    var b = st(), s = S(), o = order(), g = orderGold();
    takeCargo(o.good, o.n); s.player.gold += g; b.order = 'done';
    var wasFriend = b.kien === 'friend';
    if (b.kien !== 'friend') b.kien = 'friend';
    await withPic('md_guns', '홍강 부두', function () { return play([
      [null, '홍강 부두. 금위 병사들이 남만의 총 궤짝을 줄지어 나른다. 맨 앞에서 궤짝 두 개를 한꺼번에 어깨에 멘 사내가 돌아본다.'],
      ['KI', wasFriend ? '(궤짝을 내려놓으며) 형님! 이 총, 형님 배가 가져온 것이오? 이제 금위가 됐소. 인국공 나으리가 꼬짜이 사람이라고 거두어 주셨지.' : '(궤짝을 내려놓으며) 씨름판의 그 선장 나으리 아니오? 이 총을 가져오셨구려. 나도 이제 금위요. 인국공 나으리가 꼬짜이 사람이라고 거두어 주셨지.'],
      ['md_mac', '(총 하나를 들어 총구를 들여다보며) 그물을 거둘 줄 아는 사람이구려. 값은 치렀소. 그리고 이것 — 내가 꼬짜이에서 쓰던 그물추요. 뭍에 올라온 뒤로는 쓸 일이 없었소.'],
      ['KI', '(제독에게만 들리게) 형님, 저 총이 서쪽 산의 옛 임금을 쏘겠지요… 나는 씨름판이 좋았소. 그건 사람을 눕혀도 죽이지는 않으니까.']
    ]); });
    give('md_sinker');
    var f = fame('tr', 'guns');
    log('인국공 막당중에게 ' + goodName() + ' ' + o.n + '통을 바쳤다. 금화 ' + U.num(g) + '닢 · 「막당중의 그물추」. 부두에서 금위가 된 끼엔을 다시 만났다. (교역 명성 +' + f + ')');
    UI.toast('인국공의 값 금화 +' + U.num(g), 'coin', 5200);
    refresh();
  }

  // ================================================================ ② 여섯째 달 보름 (1527.6.15~7.21, 교도)
  function nightOpen() { var b = st(), t = today(); return !!(b && !b.night && cityNow() === THANGLONG && t >= D.nightFrom && t <= D.nightTo); }
  async function night() {
    var b = st(), s = S(), K0 = K();
    if (!b.met) b.met = 1;
    var knows = b.huyen === 'friend' || b.huyen === 'met';
    await withPic('md_kitchen', '탕롱의 부엌', function () { return play([
      [null, '탕롱이 술렁인다. 성문마다 막의 붉은 깃발이 늘었고, 내관들이 즉위 잔치에 쓸 비단을 나른다. 「보름날, 공황께서 인국공께 왕위를 넘기신다」는 말이 저자에 돈다.'],
      ['HY', knows ? (b.huyen === 'friend' ? '(해 질 녘 부두, 쓰개를 눌러쓴 여인) 선장님… 저예요, 후옌. 약은 잘 들었어요. 마마께서 선장님 배 이름을 부르시며 「그 배라면」 하셨어요.' : '(해 질 녘 부두, 쓰개를 눌러쓴 여인) 선장님, 씨름판에서 뵌 후옌이에요. 바다 이야기를 해 주신 분이라 — 여기밖에 올 데가 없었어요.')
        : '(해 질 녘 부두, 쓰개를 눌러쓴 여인이 배를 하나하나 살피다 제독 앞에 선다) 남만 선장님이시지요. 태후전의 여관 후옌이에요. 이 부두에서 막의 깃발을 달지 않은 배는 선장님 배뿐이에요.'],
      [null, '그녀 뒤에 부엌 머슴의 무명옷을 입은 소년이 서 있다. 볼에 그을음이 묻었지만 고개를 숙이지 않는다.'],
      ['HY', '(소년의 어깨를 감싸며) 소종 임금의 아드님, 레 주이 닌 왕손이세요. 아버님이 돌아가신 뒤로 태후마마께서 부엌에 숨겨 두셨어요. 보름이 지나면 막은 레의 핏줄을 남겨 두지 않을 거예요.'],
      ['md_ninh', '(떨리는 목소리를 누르며) 할머님께서 「바다로 가라」고 하셨소. 남쪽 탄호아에 응우옌 낌 장군이 기다린다고.'],
      ['HY', '마 강 어귀까지 사흘이에요. 선장님, 이 아이를 배에 태워 주세요. 저는… 마마께 끝까지 곁에 있겠다고 약속했는데, 마마께서 저더러 이 아이를 따라가라 하셨어요.']
    ]); });
    var v = await UI.ask('여섯째 달 보름 — 레의 마지막 핏줄', [
      { label: '왕손을 배에 태워 홍강을 빠져나간다', value: 'ship', icon: 'ship' },
      { label: '막의 즉위 잔치에 남는다 — 「남의 나라 왕실 일이오」', value: 'mac', icon: 'crown' },
      { label: '못 들은 걸로 하고 떠난다', value: 'no' }], me());
    b.night = v;
    if (v === 'mac') return coronation(b);
    if (v === 'no') {
      b.huyen = 'gone';
      await play([['HY', '(쓰개를 깊이 눌러쓰며) 알겠어요. 바다 사람에게 너무 큰 것을 바랐어요. 왕손님, 가요 — 고깃배라도 찾아봐요.']]);
      log('탕롱 부두에서 태후전의 여관 후옌이 레의 왕손을 배에 태워 달라 청했으나 거절했다.');
      refresh(); return;
    }
    // (가) 홍강 부두를 빠져나간다
    var kienFriend = b.kien === 'friend';
    await withPic('md_wharf', '홍강 부두의 밤', function () { return play([
      [null, '자정. 소년과 후옌을 짐칸에 숨기고 닻줄을 푼다. 부두 끝 망루에 횃불이 켜지고, 붉은 전포의 금위들이 창을 세우고 길을 막는다.'],
      ['md_guard', '거기 남만 배! 보름까지는 어떤 배도 홍강을 내려가지 못한다는 인국공 나으리의 영이다. 짐칸을 열어라!'],
      kienFriend ? ['KI', '(금위들 사이에서 키 큰 사내가 횃불을 들고 나선다) 이 배는 내가 낮에 다 뒤졌소. 짐칸엔 소금에 절인 생선뿐이오. (제독과 눈이 마주치자 검은 이를 드러내며 웃는다) 형님, 오늘 밤 나는 아무것도 못 봤소.'] : null
    ]); });
    if (kienFriend) {
      await play([
        ['md_guard', '(의심스러운 눈으로 보다가) 꼬짜이 놈이 그렇다면 그렇겠지. 가라!'],
        ['KI', '(배가 부두를 떠날 때 뱃전에 바짝 붙어 낮게) 형님, 짐칸에 생선이 아니라 사람이 있는 것쯤은 나도 아오. 날이 밝으면 이 일이 들통날 거요.']
      ]);
      var k = await UI.ask('끼엔이 길을 열어 주었다', [
        { label: '「뛰어올라라 — 함께 가자」', value: 'join', icon: 'people' },
        { label: '「돌아가라. 그대까지 잃고 싶지 않다」', value: 'stay' }], me());
      if (k === 'join') {
        b.kien = 'joined';
        await play([['KI', '(부두를 박차고 뱃전으로 뛰어오른다. 배가 크게 흔들린다) 하하! 결국 배 위에서 만나는구려! 형님, 인국공 나으리께는… 꼬짜이의 바다가 나를 불렀다고 전해 주시오.']]);
        join('md_kien', 82, THANGLONG);
        var fk = fame('so', 'kien');
        log('홍강 부두의 금위였던 꼬짜이의 씨름꾼 끼엔이 길을 열어 주고 배에 뛰어올랐다. (사교 명성 +' + fk + ')');
        UI.toast('끼엔 — 꼬짜이의 씨름꾼이 배에 올랐다', 'people', 6000);
      } else {
        b.kien = 'stay';
        await play([['KI', '(부두에 서서 손을 흔들며) 곤장 몇 대쯤이야 씨름판에서 넘어지는 것보다 덜 아프오! 형님, 언젠가 또 봅시다!']]);
      }
      b.esc = 'pass';
    } else {
      if (b.kien === 'met') await play([['KI', '(창을 든 금위들 사이에서 씨름판의 그 젊은이가 보인다. 그가 이를 악물고 창을 고쳐 쥔다) 선장 나으리… 미안하오. 이건 내 일이오.']]);
      var res = await fight('홍강 부두의 금위', (K0.foe || {}).wharf || 16, { hold: true });
      if (res !== 'win') {
        b.esc = 'lost'; b.huyen = 'lost';
        await play([
          [null, '금위들이 배를 에워싸는 사이, 후옌이 소년의 손을 잡고 반대쪽 뱃전에서 물로 뛰어든다. 어둠 속에서 고깃배 하나가 노를 젓는 소리가 멀어진다.'],
          ['HY', '(멀리서, 물소리에 섞여) 선장님 — 고마웠어요! 살아 있으면… 꼭!']
        ]);
        log('홍강 부두에서 막의 금위에게 막혔다. 후옌과 레의 왕손은 고깃배를 타고 어둠 속으로 사라졌다.');
        refresh(); return;
      }
      b.esc = 'won';
    }
    // 사흘 뒤 마 강 어귀 — 응우옌 낌
    await passN(K0.voyage || 3);
    await withPic('md_mariver', '마 강 어귀의 새벽', function () { return play([
      [null, '사흘 뒤 새벽, 탄호아의 마 강 어귀. 갈대숲 사이에서 횃불 셋이 흔들리고, 도롱이를 걸친 흰 수염의 장수가 물가로 걸어 나온다.'],
      ['md_kim', '(소년 앞에 무릎을 꿇으며) 왕손 마마… 살아 계셨습니다. 신 응우옌 낌이옵니다. 아이라오의 산으로 모시겠습니다. 언젠가 레의 깃발을 다시 올릴 날이 옵니다.'],
      ['md_ninh', '(배에서 내리다 돌아서서 제독에게 두 손을 모은다) 남만의 선장. 이 바다를 잊지 않겠소. 내가 임금이 되면 — 그대의 배 이름을 부르겠소.'],
      ['md_kim', '(제독에게) 레의 신하로서 갚을 길이 없소. 다만 이름을 기억하리다.'],
      ['HY', '(뱃전에 서서 대모 빗을 머리에서 뽑아 제독의 손에 쥐여 준다) 태후마마께서 주신 빗이에요. 이제 제게는 이것밖에 없어요. 선장님이 가지고 계세요.']
    ]); });
    give('md_comb');
    var fe = fame('so', 'escape');
    log('레의 왕손 레 주이 닌을 탄호아 마 강 어귀에서 응우옌 낌에게 넘겼다. 후옌이 태후의 대모 빗을 건넸다. (사교 명성 +' + fe + ')');
    var h = await UI.ask('후옌이 강 어귀와 바다 사이에 서 있다', [
      { label: '「이 배에 자리가 있소 — 함께 가자」', value: 'join', icon: 'heart' },
      { label: '「왕손 곁에 남으시오. 언젠가 다시 만납시다」', value: 'stay' }], me());
    if (h === 'join') {
      b.huyen = 'joined';
      await play([['HY', '(갈대숲의 소년이 돌아보며 고개를 끄덕이자, 눈물을 훔치고 웃는다) 마마께서 그러셨어요. 「그 배라면」이라고요. 이제야 무슨 뜻인지 알겠어요. 선장님, 바다를 가르쳐 주세요.']]);
      join('md_huyen', 86, THANGLONG);
      var fh = fame('so', 'huyen');
      log('태후전의 여관이던 후옌이 배에 남았다. (사교 명성 +' + fh + ')');
      UI.toast('후옌 — 태후전의 여관이 배에 올랐다', 'heart', 6000);
    } else {
      b.huyen = 'stay';
      await play([['HY', '(갈대숲으로 내려서며) 그럴게요. 이 아이가 깃발을 올리는 날, 제가 선장님을 찾아갈게요. 남쪽 바닷가 — 투언호아(유에)의 부두로요.']]);
      log('후옌은 왕손 곁에 남았다. 레의 깃발이 오르는 날 투언호아(유에)의 부두로 찾아오겠다고 했다.');
    }
    refresh();
  }

  // ② (나) 막의 즉위 잔치
  async function coronation(b) {
    var s = S(), K0 = K();
    b.huyen = 'gone';
    await play([['HY', '(한참 제독을 보다가 고개를 숙인다) …그렇겠지요. 인국공 나으리의 잔치에는 바다 건너 손님이 필요하겠지요. 왕손님, 가요.']]);
    await passTo(D.throne);
    var gold = (K0.gift || 2000) + (b.order === 'done' ? 1000 : 0);
    await withPic('md_throne', '막당중의 즉위', function () { return play([
      [null, '보름날, 경천전. 공황이 노란 곤룡포를 벗어 두 손으로 바치고, 막당중이 그것을 입는다. 문무백관이 엎드린다. 「명덕(明德)」 — 새 연호가 선포된다.'],
      [HERALD, '남만의 선장은 앞으로 나오라. 새 임금께서 손수 잔을 내리신다.'],
      ['md_mac', '(곤룡포 소매 밖으로 씨름꾼의 팔뚝이 드러난다) 꼬짜이의 어부가 용상에 앉는 날, 바다 사람이 잔치에 앉았구려. 나는 그물을 던졌고, 이제 거두는 것이오. 받으시오.'],
      ['md_mac', '(낮은 목소리로) 레의 부엌에서 아이 하나가 사라졌다 하오. 그대는 아무것도 모르겠지. 모르는 것이 오래 사는 길이오.'],
      b.kien === 'friend' ? ['KI', '(용상 아래 금위의 맨 앞줄에서, 굳은 얼굴로 제독을 본다. 웃지 않는다) …'] : null
    ]); });
    s.player.gold += gold;
    give('md_sinker');
    var f = fame('so', 'mac');
    log('막당중의 즉위 잔치에서 잔을 받았다. 하사금 금화 ' + U.num(gold) + '닢 · 「막당중의 그물추」. (사교 명성 +' + f + ')');
    UI.toast('막 임금의 하사금 금화 +' + U.num(gold), 'coin', 5600);
    refresh();
  }

  // ================================================================ ③ 깃발이 오르다 (1533.2.4~1535.12.31, 유에)
  function flagOpen() { var b = st(), t = today(); return !!(b && b.huyen === 'stay' && cityNow() === HUE && t >= D.flagFrom && t <= D.flagTo && !row('md_huyen')); }
  async function flag() {
    var b = st();
    await withPic('md_flag', '투언호아의 부두', function () { return play([
      [null, '투언호아(유에)의 부두. 고깃배 사이로 갈색 도롱이를 걸친 여인이 뛰어온다. 햇볕에 그을렸지만, 웃자 검은 이가 반짝이는 그 얼굴이다.'],
      ['HY', '선장님! 정말 오셨네요. 날마다 부두에 나와서 남만 돛을 셌어요.'],
      ['HY', '그 아이가 임금이 되셨어요. 아이라오의 산속에서 응우옌 낌 장군이 세우셨어요 — 장종이세요. 「바다의 선장을 찾거든 고맙다고 전하라」 하셨어요. 정말로 배 이름을 부르셨어요.'],
      ['HY', '(대모 빗이 없는 맨머리를 만지며) 이제 레의 깃발이 다시 올랐으니, 제 약속은 끝났어요. 장군님은 저더러 궁으로 들라 하셨지만… 저는 산속 궁보다 그 배가 그리웠어요.']
    ]); });
    var v = await UI.ask('후옌이 부두에 서 있다', [
      { label: '「약속대로 왔소 — 이제 함께 갑시다」', value: 'join', icon: 'heart' },
      { label: '「그대는 레의 사람이오」 — 놓아준다', value: 'no' }], me());
    if (v !== 'join') {
      b.huyen = 'free';
      await play([['HY', '(빈손을 꼭 쥐며) …네. 그 말씀이 맞아요. 그래도 와 주셔서 고마웠어요. 빗은 돌려주지 마세요.']]);
      refresh(); return;
    }
    b.huyen = 'joined';
    await play([['HY', '(도롱이를 벗어 던지고 뱃전을 넘는다) 여섯 해를 기다렸어요. 이제 강 말고 바다를 보고 싶어요. 선장님 곁에서요.']]);
    join('md_huyen', 90, HUE);
    var f = fame('so', 'huyen');
    log('투언호아(유에)의 부두에서 후옌을 다시 만났다. 레의 깃발이 오른 뒤, 그녀는 산속 궁 대신 배를 골랐다. (사교 명성 +' + f + ')');
    UI.toast('후옌 — 약속대로 배에 올랐다', 'heart', 6000);
    refresh();
  }

  // ================================================================ ④ 진남관의 밧줄 (교도)
  function kienOpen() {
    var b = st(), t = today(); if (!b || cityNow() !== THANGLONG || row('md_kien') || t > D.kienTo) return false;
    if (b.kien === 'stay') return t >= D.kienStay;
    return (b.kien === 'friend' || b.kien === 'met') && t >= D.kienFrom;
  }
  async function kien() {
    var b = st(), t = today(), afterPass = t >= NEWS_AT.pass, wasStay = b.kien === 'stay';
    var lines = wasStay && !afterPass ? [
      [null, '홍강 부두 끝, 그물을 깁는 사내가 있다. 등에 곤장 자국이 길게 났지만, 구릿빛 어깨는 그대로다. 고개를 드는 얼굴 — 끼엔이다.'],
      ['KI', '(검은 이를 드러내며 웃는다) 형님! 곤장 백 대를 맞고 금위에서 쫓겨났소. 인국공 — 아니, 임금님은 꼬짜이 사람이라고 목숨만은 살려 주셨지.'],
      ['KI', '그 뒤로 이렇게 그물을 깁고 있소. 씨름판에도 못 나가오. 역적의 배를 놓아 준 놈이라고. (그물을 내려놓으며) 형님, 그 배에 아직 자리가 있소?']
    ] : [
      [null, '홍강 부두. 붉은 전포를 벗어 던진 키 큰 사내가 뱃전 아래에 서 있다. 손에 굵은 밧줄 한 토막을 쥐었다 — 끼엔이다.'],
      ['KI', '형님. 들으셨소? 임금님이… 우리 꼬짜이의 막당중 나으리가 목에 밧줄을 걸고 맨발로 진남관에 나가셨소. 명의 장수 앞에 엎드려 땅의 장부를 바치셨지.'],
      ['KI', '나라를 지키려는 것이라고들 하오. 그렇겠지. 그 덕에 명의 대군은 오지 않았소. 그런데 형님, 그분은 씨름판에서 한 번도 엎드린 적이 없던 분이오.'],
      ['KI', '(밧줄 토막을 내밀며) 그날 이 밧줄 끝을 내가 끊어 왔소. 씨름꾼은 목에 밧줄을 걸지 않소. 나는 바다로 가겠소 — ' + (b.wrestle === 'win' ? '나를 눕힌 형님의 배로.' : b.wrestle === 'lose' ? '모래판에서 제일 오래 버틴 형님의 배로.' : '언젠가 배 위에서 한판 하자던 그 약속대로.')]
    ];
    await withPic('md_rope', '홍강 부두의 씨름꾼', function () { return play(lines); });
    var v = await UI.ask('끼엔이 배에 오르고 싶어 한다', [
      { label: '「올라와라 — 이번엔 배 위에서 한판 하자」', value: 'join', icon: 'people' },
      { label: '「꼬짜이의 바다가 그대를 기다린다」 — 놓아준다', value: 'no' }], me());
    if (v !== 'join') {
      b.kien = 'free';
      await play([['KI', '(웃으며 그물을 다시 든다) 형님 말이 맞소. 꼬짜이의 바다도 바다니까. 잘 가시오!']]);
      refresh(); return;
    }
    b.kien = 'joined';
    await play([['KI', '(뱃전에 한 발로 뛰어오르자 배가 기우뚱한다) 하하! 이 배는 내 무게를 견디는구려. 장가 이야기만 하지 마시오 — 나는 바다와 혼인할 거니까.']]);
    if (afterPass) give('md_rope');
    join('md_kien', 84, THANGLONG);
    var f = fame('so', 'kien');
    log('꼬짜이의 씨름꾼 끼엔이 배에 올랐다.' + (R.hasItem && R.hasItem('md_rope') ? ' 「진남관의 밧줄 한 토막」을 건넸다.' : '') + ' (사교 명성 +' + f + ')');
    UI.toast('끼엔 — 꼬짜이의 씨름꾼이 배에 올랐다', 'people', 6000);
    refresh();
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[deliverOpen, deliver], [nightOpen, night], [flagOpen, flag], [kienOpen, kien], [meetOpen, meet]];
  MD.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  MD.check = async function () {
    if (MD._busy) return false; MD._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    MD._busy = false; refresh();
    return true;
  };
  MD._t = { meet: meet, deliver: deliver, night: night, flag: flag, kien: kien };
})(window.G = window.G || {});
