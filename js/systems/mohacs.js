/* 모하치 전투 (G.Mohacs) 2026-11-02 사용자 요청
   「오스만이 헝가리군을 격파. 헝가리 왕국의 분열과 합스부르크·오스만 경쟁이 심화됨」
   사람·소지품·조정값: js/data/mohacs.js (G.BALANCE.mohacs). 술탄·대재상은 js/data/ottomaneurope.js 의 ot_suleyman · ot_ibrahim.
   전투 그날의 짧은 소식은 이미 js/data/relevents.js cr_mohacs 에 있다 — 여기서는 장면과 그 뒤의 소식만 만든다. 역사는 바뀌지 않는다.
   ■ ① 부다의 궁정 (1526.6.1~8.20, 부다페스트): 스무 살의 왕 러요시 2세와 왕비 마리아. 국고는 비었고, 서포여이의 군대는 아직 오지 않았다.
        수도사 출신의 총사령관 토모리. 고르는 것: (가) 「서포여이를 기다려 성벽 뒤에서」 — 귀족들이 들고일어난다 (나) 왕에게 금화를 빌려준다(용병 — 오스만 군이 준다) (다) 함께 간다
        → 8월 29일까지 날이 지나간다 → 모하치 들판(육상전 — 결과는 역사대로) → 왕이 첼레 개울에 빠진다
        → 부다로 달려 왕비에게 알린다: 도나우 강의 배(항해) / 아큰즈 기병을 뚫는다(육상전) — 왕비가 국고와 함께 포조니로 빠져나가면 헝가리의 명예 작위 · 코르비누스 문고의 필사본
   ■ ② 오스만 편 (1526.7.1~8.10, 베오그라드): 대재상 이브라힘 파샤가 드라바 강(에세크)에 놓을 다리를 맡긴다 — 배를 이은 부교(조선) / 말뚝 다리(세공)
        → 다리를 놓으면 금화 · 원정군을 따라 모하치로(육상전) → 오스만의 명예 작위 · 부다 궁의 책 한 권
   ■ ③ 두 왕의 헝가리 (1526.11.1~1527.12.31, ①·②에 함께한 사람 — 부다페스트에서 서포여이의 사절, 비엔나에서 페르디난트의 재상): 한쪽을 돕는다(금화)
   ■ 소식: 부다 입성(1526.9.10) · 왕의 주검(10.18, 만난 사람) · 서포여이 대관(11.10) · 페르디난트 선출(12.17) · 토커이(1527.9.27, 만난 사람)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/mh_*.webp
   ■ 저장: s.mohacs = { side, court, loan, bridge, march, battle, mary, title, king, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var MH = G.Mohacs = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.mohacs) || {}; }
  var BUDA = 63, BELGRADE = 69, VIENNA = 54;
  var D = MH.D = { courtFrom: 15260601, courtTo: 15260820, otFrom: 15260701, otTo: 15260810, battle: 15260829, kingFrom: 15261101, kingTo: 15271231 };
  var NEWS_AT = { buda: 15260910, body: 15261018, zapolya: 15261110, ferdinand: 15261217, tokaj: 15270927 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.mohacs) {
      s.mohacs = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.mohacs.told[k] = 1; });
    }
    if (!s.mohacs.told) s.mohacs.told = {};
    return s.mohacs;
  }
  MH.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function at(id) { return cityNow() === id; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var NOBLE = { name: '헝가리 귀족', lang: 3 }, ENVOY = { name: '서포여이의 사절', lang: 3 }, CHANCELLOR = { name: '페르디난트의 재상', lang: 3 };
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
  function trust(id, n) { if (G.Sponsor && G.SPONSOR && G.SPONSOR[id] && G.Sponsor.addTrust && G.Sponsor.rel) G.Sponsor.addTrust(G.Sponsor.rel(id), n); }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  async function passTo(day) {
    var n = U.dayIndex({ y: Math.floor(day / 10000), m: Math.floor(day / 100) % 100, d: day % 100 }) - U.dayIndex(S().date);
    if (!(n > 0)) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  async function titleUp(rid, by, why) {
    var CT = G.Court, realm = G.COURT && G.COURT.realms && G.COURT.realms[rid], s = S();
    if (!CT || !realm) return null;
    var c = CT.state(), n = CT.rank(realm) + 1, tt = CT.title(realm, n);
    if (!tt) { s.player.gold += 4000; UI.toast(realm.name + ' 궁정의 하사금 금화 +4,000', 'coin', 5000); log(why + ' ' + realm.name + ' 궁정이 하사금 금화 4,000닢을 내렸다.'); return 'gold'; }
    c.titles[realm.id] = n;
    if (G.Growth && G.Growth.event) G.Growth.event('cha', 1, tt.ko + ' 서임 — 궁정의 예법을 익혔다');
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">' + U.esc(realm.name) + ' · 명예 작위</div><div style="font-size:34px;font-weight:800;margin:6px 0">' + U.esc(tt.ko) + '</div><div style="font-size:16px" class="muted">' + U.esc(by) + '</div><div style="margin-top:10px">' + U.esc(why) + '</div></div>', '명예 작위');
    log(why + ' ' + realm.name + '의 명예 작위 ' + (CT.fullName ? CT.fullName(tt, true) : tt.ko) + '를 받았다.');
    UI.toast((CT.fullName ? CT.fullName(tt, true) : tt.ko) + ' — ' + realm.name + '의 명예 작위', 'crown', 6000);
    if (G.Audio) G.Audio.sfx('discover');
    return tt.ko;
  }

  // ================================================================ 소식 (전투 그날의 소식은 relevents.js cr_mohacs)
  MH.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!b.side, eu = met || !!(s.loc && s.loc.lon != null && s.loc.lon > -12 && s.loc.lon < 45 && s.loc.lat > 34);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('buda', eu, 'castle', '【부다 입성】 술탄 쉴레이만이 텅 빈 부다에 들어왔다. 대재상 이브라힘 파샤는 왕궁의 청동 조각상들을 배에 실어 이스탄불로 보냈고, 마차시 왕이 모은 코르비누스 문고의 책들이 흩어졌다.' + (b.mary === 'saved' ? ' 왕비 마리아는 그보다 먼저 국고를 싣고 포조니로 빠져나갔다 — 이방인 선장의 배를 탔다고 한다.' : ' 왕비 마리아는 간신히 포조니로 몸을 피했다.'));
    news('body', met, 'skull', '【왕의 주검】 모하치 북쪽 첼레 개울의 진흙 속에서 러요시 2세의 주검이 발견되었다. 무거운 갑옷을 입은 채 말과 함께 물에 빠졌다고 한다. 스무 살이었다. 그에게는 아들이 없었다.');
    news('zapolya', eu, 'crown', '【서포여이 대관】 트란실바니아의 영주 서포여이 야노시가 세케슈페헤르바르에서 헝가리의 왕관을 썼다. 중소 귀족들이 「외국인 왕은 안 된다」며 그를 밀었다.' + (b.king === 'zapolya' ? ' 대관식 연회에 바다의 선장 자리가 하나 놓여 있었다.' : ''));
    news('ferdinand', eu, 'crown', '【두 왕의 헝가리】 포조니의 의회가 합스부르크의 페르디난트를 헝가리의 왕으로 뽑았다. 죽은 러요시 왕의 누이 언너가 그의 아내다. 이제 헝가리에는 왕이 둘이다.' + (b.mary === 'saved' ? ' 왕비 마리아가 의회에서 오라비를 위해 말했다고 한다.' : ''));
    news('tokaj', met, 'sword', '【토커이】 페르디난트의 군대가 토커이에서 서포여이를 무찔렀다. 서포여이는 폴란드로 달아나 술탄에게 사절을 보냈다고 한다. 오스만과 합스부르크가 헝가리를 사이에 두고 마주 섰다 — 다음은 빈이다.');
    return out;
  };

  // ================================================================ ① 부다의 궁정 (1526.6~8)
  function courtOpen() { var b = st(), t = today(); return !!(b && !b.side && at(BUDA) && t >= D.courtFrom && t <= D.courtTo); }
  async function court() {
    var b = st(), s = S(), k = K();
    await withPic('mh_court', '부다의 궁정 (1526)', function () { return play([
      [null, '부다 왕궁. 마차시 왕이 지은 화려한 홀에 촛불이 반만 켜졌다. 초를 살 돈이 없다는 말이 시종들 사이에 돈다.'],
      ['mh_louis', '바다에서 온 선장이라고? …술탄 쉴레이만이 십만 대군을 이끌고 베오그라드를 지나 올라온다. 나는 왕이지만, 군대에 줄 돈이 없다. 귀족들은 저마다 제 성에 앉아 있다.'],
      ['mh_mary', '(남편 곁에서) 제 오라버니 카를 황제는 독일에서 루터파와, 이탈리아에서 프랑스와 싸우느라 군대를 보낼 수 없다고 합니다. 페르디난트 오라버니도 마찬가지고요. 우리끼리 싸워야 해요.'],
      ['mh_tomori', '칼로처의 대주교 토모리요. 나는 원래 프란치스코회 수도사였소 — 지금은 이 나라의 총사령관이 되었지. 서포여이 영주의 트란실바니아 군대가 아직 오지 않았소. 그래도 귀족들은 「들판에서 싸우자」고 외치오.']
    ]); });
    var v = await UI.ask('왕이 그대의 생각을 묻는다', [
      { label: '「서포여이가 올 때까지 부다의 성벽 뒤에서 기다리시오」', value: 'wait', icon: 'castle' },
      { label: '왕에게 금화를 빌려준다 — 용병을 사시오 (' + U.num(k.loan) + '닢)', value: 'loan', icon: 'coin', dis: s.player.gold < k.loan },
      { label: '「함께 가겠소」', value: 'go', icon: 'sword' }], me());
    b.court = v;
    if (v === 'wait') await play([
      [NOBLE, '(홀 뒤에서 외친다) 성벽 뒤에 숨으라고? 헝가리 귀족은 들판에서 싸운다! 왕이 숨으면 우리가 왕을 바꾸겠다!'],
      ['mh_tomori', '(한숨) …들었소? 이것이 이 나라요. 모하치의 들판에서 맞설 수밖에 없소.']
    ]);
    else if (v === 'loan' && s.player.gold >= k.loan) {
      s.player.gold -= k.loan; b.loan = 1; trust('hu_king', 8);
      await play([['mh_louis', '(금화 자루를 받아 들고 한참 말이 없다가) 왕이 이방인에게 돈을 빌리는구나. …갚을 수 있을지 모르겠다. 이 돈으로 보헤미아의 용병 천 명을 사겠다.'], ['mh_mary', '고마워요, 선장. 이 빚은 제가 기억할게요 — 무슨 일이 있어도.']]);
    }
    await play([['mh_louis', '선장, 함께 가 주겠는가? 그대의 사람들은 바다에서 대포를 다뤄 보았겠지.']]);
    var j = await UI.ask('왕의 군대와 함께 모하치로 가겠는가? (8월 29일까지 날이 지나간다)', [
      { label: '함께 간다', value: 'go', icon: 'sword' },
      { label: '사양한다', value: 'no' }], me());
    if (j !== 'go') { b.side = 'none'; await play([['mh_mary', '…그래요. 그래도 고마웠어요.']]); log('1526년 부다 — 러요시 2세의 궁정에 들렀다.' + (b.loan ? ' 왕에게 금화를 빌려주었다.' : '')); return; }
    b.side = 'hu'; b.march = 'go';
    await passTo(D.battle);
    await battle('hu');
  }

  // ================================================================ ② 오스만 편 — 드라바 강의 다리 (1526.7~8)
  function otOpen() { var b = st(), t = today(); return !!(b && !b.side && at(BELGRADE) && t >= D.otFrom && t <= D.otTo); }
  async function bridge() {
    var b = st(), s = S(), k = K();
    await withPic('mh_drava', '드라바 강 (1526)', function () { return play([
      [null, '베오그라드. 다섯 해 전 오스만이 빼앗은 이 요새에 원정군의 천막이 끝없이 이어진다. 비가 그치지 않아 강물이 불었다.'],
      ['ot_ibrahim', '대재상 이브라힘이오. 술탄께서 북쪽 헝가리로 가시오. 그런데 에세크에서 드라바 강을 건너야 하오. 강이 넓고 물살이 세오. 배를 아는 프랑크의 선장이라면 다리를 놓을 수 있겠지?']
    ]); });
    var ship = skill('ship'), craft = skill('craft');
    var p1 = Math.min(0.95, 0.5 + ship * 0.15), p2 = Math.min(0.95, 0.45 + craft * 0.15);
    var v = await UI.ask('드라바 강에 다리를 놓겠는가?', [
      { label: '강배를 이어 부교를 놓는다 — 조선 (' + Math.round(p1 * 100) + '%)', value: 'boats', icon: 'ship' },
      { label: '말뚝을 박아 나무 다리를 놓는다 — 세공 (' + Math.round(p2 * 100) + '%)', value: 'piles', icon: 'map' },
      { label: '사양한다', value: 'no' }], me());
    if (v === 'no') { b.side = 'none'; await play([['ot_ibrahim', '그렇다면 우리 공병들이 하겠지. 조금 늦어질 뿐이오.']]); return; }
    b.side = 'ot';
    var ok = U.chance(v === 'boats' ? p1 : p2);
    b.bridge = ok ? v : 'fail';
    if (ok) {
      s.player.gold += k.bridgeGold || 2500; trust('ot_sultan', 8);
      var bf = fame('ex', 'bridge');
      await play([[null, '닷새 밤낮. 다리가 놓였다. 십만 대군과 대포가 그 위로 드라바 강을 건넌다. 마지막 병사가 건너자 이브라힘은 다리를 불태우라고 명했다.'], ['ot_ibrahim', '돌아갈 다리는 필요 없소. 이기거나 죽거나. …그대의 솜씨는 술탄께 아뢰겠소.']]);
      log('1526년 — 오스만 원정군을 위해 에세크의 드라바 강에 다리를 놓았다. (금화 +' + U.num(k.bridgeGold || 2500) + ' · 탐험 명성 +' + bf + ')');
    } else {
      await play([[null, '불어난 물살이 놓던 다리를 두 번이나 쓸어 갔다. 결국 오스만 공병들이 다리를 마저 놓았다.'], ['ot_ibrahim', '바다와 강은 다르구려. 그래도 애썼소.']]);
    }
    var j = await UI.ask('원정군을 따라 모하치로 가겠는가? (8월 29일까지 날이 지나간다)', [
      { label: '따라간다', value: 'go', icon: 'boot' }, { label: '여기서 돌아간다', value: 'no' }], me());
    if (j !== 'go') { b.march = 'no'; return; }
    b.march = 'go';
    await passTo(D.battle);
    await battle('ot');
  }

  // ================================================================ 모하치 들판 (1526.8.29)
  async function battle(side) {
    var b = st(), k = K();
    await withPic('mh_field', '모하치 들판 (1526.8.29)', function () { return play([
      [null, '모하치. 도나우 강 서쪽의 늪이 많은 들판. 늦은 오후, 헝가리의 중기병이 갑옷을 번쩍이며 오스만의 전위로 돌격한다.'],
      side === 'hu' ? ['mh_tomori', '(말 위에서 십자가를 들어 올리며) 성모여, 헝가리를 지켜 주소서! 돌격하라!'] : ['ot_suleyman', '(언덕 위의 붉은 천막 앞에서) 저들이 먼저 달려오게 두어라. 예니체리와 대포는 그 뒤에 있다.'],
      [null, '헝가리 기병이 오스만의 전위를 뚫는다 — 그 너머에 쇠사슬로 묶은 대포 수백 문이 기다리고 있다.']
    ]); });
    var n = (k.foe || {})[side === 'hu' ? 'battle' : 'magyar'] || 80;
    if (side === 'hu' && b.loan) n = Math.round(n * (k.loanCut || 0.85));
    var res = side === 'hu'
      ? await fight('쉴레이만의 예니체리와 포병', n, { guns: true, leader: '예니체리 아아', hold: 3 })
      : await fight('헝가리 중기병', n, { leader: '토모리 팔', hold: 3 });
    b.battle = res === 'win' ? 'win' : 'lose';
    var bf = fame('bt', 'battle');
    if (side === 'ot') return otAfter(bf);
    return huAfter(res, bf);
  }
  async function huAfter(res, bf) {
    var b = st(), s = S(), k = K();
    await withPic('mh_csele', '첼레 개울의 밤 (1526)', function () { return play([
      [null, res === 'win' ? '제독의 일행이 대포 한 줄을 침묵시켰다. 그러나 오스만의 대포는 끝이 없었다. 해가 지기 전, 헝가리 군은 두 시간 만에 무너졌다. 토모리도 쓰러졌다.' : '대포 소리 속에 헝가리 기병이 쓰러진다. 두 시간 만에 모든 것이 끝났다. 토모리도 쓰러졌다.'],
      [null, '어둠 속, 비에 젖은 북쪽 길. 왕의 깃발을 든 몇 기의 말이 늪 쪽으로 달려간다. 첼레 개울을 건너던 왕의 말이 비탈에서 미끄러졌다.'],
      ['mh_page', '(진흙투성이로 울며) 폐하가… 폐하가 물에 빠지셨어요! 갑옷이 너무 무거워서… 말이 폐하 위로…!'],
      ['F', '제독, 강물이 불어 아무것도 보이지 않습니다! …부다에는 왕비가 계십니다. 오스만이 사흘이면 닿을 겁니다!']
    ]); });
    var nav = skill('nav'), p = Math.min(0.95, 0.5 + nav * 0.15);
    var v = await UI.ask('부다의 왕비에게 — 어떻게 빼낼 것인가?', [
      { label: '도나우 강에 배를 띄워 밤에 강을 거슬러 오른다 — 항해 (' + Math.round(p * 100) + '%)', value: 'river', icon: 'ship' },
      { label: '부다까지 말을 달려 아큰즈 기병을 뚫는다', value: 'ride', icon: 'sword' },
      { label: '살아남은 사람들을 데리고 물러난다', value: 'no' }], me());
    var ok = false;
    if (v === 'river') {
      ok = U.chance(p);
      if (!ok) { await play([[null, '불어난 강물에 배가 두 번 모래톱에 걸렸다. 결국 말을 내려 뭍길로 달려야 했다 — 아큰즈 기병이 길을 막는다!']]); var r0 = await fight('부다 길목의 아큰즈 기병', (k.foe || {}).raid || 22, { leader: '아큰즈 대장' }); ok = r0 === 'win'; }
    } else if (v === 'ride') { var r = await fight('부다 길목의 아큰즈 기병', (k.foe || {}).raid || 22, { leader: '아큰즈 대장' }); ok = r === 'win'; }
    b.mary = ok ? 'saved' : v === 'no' ? 'left' : 'late';
    if (ok) {
      await withPic('mh_mary', '왕비의 배 (1526.8.31)', function () { return play([
        ['mh_mary', '(소식을 듣고 한참 창가에 서 있다가) …그이가 물에. (목소리가 떨리지만 무너지지 않는다) 울 시간은 나중에 있어요. 국고와 왕실 문서, 그리고 서재의 책을 배에 실어요.'],
        [null, '새벽, 왕비의 배가 국고 상자와 왕실 문서를 싣고 도나우 강을 거슬러 포조니로 떠난다. 서재의 책 몇 권도 함께 실렸다.'],
        ['mh_mary', '(배 위에서 책 한 권을 건네며) 마차시 왕의 서재에 있던 책이에요. 오스만에게 두고 갈 수는 없지요. 선장이 가져가요 — 빌려준 돈은 갚지 못했지만' + (b.loan ? ', 약속은 기억해요.' : '.') + ' …언젠가 제가 다른 나라에서 그대를 다시 맞을 날이 있을 거예요.']
      ]); });
      give('mh_corvina');
      if (b.loan) s.player.gold += Math.round(k.loan / 2);
      var tt = await titleUp('HU', '왕비 마리아의 이름으로', '모하치 뒤 부다에서 왕비와 국고를 포조니로 빼낸 공으로.');
      b.title = tt || 'none'; trust('hu_king', 12);
      var mf = fame('so', 'mary');
      log('1526년 모하치 — 왕의 군대와 함께 싸웠다. 왕은 첼레 개울에 빠졌다. 부다로 달려 왕비 마리아와 국고를 포조니로 빼냈다. (전투 명성 +' + bf + ' · 사교 명성 +' + mf + ')' + (b.loan ? ' 왕비가 빌려준 돈의 절반을 갚았다.' : ''));
    } else {
      await play([[null, v === 'no' ? '살아남은 사람들을 이끌고 북쪽으로 물러났다. 왕비는 제 힘으로 포조니까지 몸을 피했다고 한다.' : '부다에 닿았을 때 왕궁은 이미 비어 있었다. 왕비는 몇 시간 먼저 떠났다. 서재의 책들은 그대로 남아 있었다.']]);
      log('1526년 모하치 — 왕의 군대와 함께 싸웠다. 헝가리 군이 무너지고 왕이 첼레 개울에 빠졌다. (전투 명성 +' + bf + ')');
    }
    refresh();
  }
  async function otAfter(bf) {
    var b = st(), s = S();
    await play([
      [null, '두 시간. 헝가리의 중기병이 대포 앞에서 무너지고, 들판에 깃발이 쓰러졌다. 그날 밤 비가 내렸다.'],
      ['ot_suleyman', '(전장을 둘러보며) 헝가리의 왕은 어디 있느냐? …물에 빠졌다고? (잠시 말이 없다가) 나는 그 젊은 왕을 벌하려 했지, 이렇게 끝나기를 바라지는 않았다. 하느님이 그 영혼을 불쌍히 여기시기를.'],
      [null, '열하루 뒤, 원정군은 텅 빈 부다에 들어섰다.'],
      ['ot_ibrahim', '(왕궁 서재의 금박 책을 하나 집어 들며) 마차시 왕의 책들이오. 술탄께서 이 일부를 이스탄불로 가져가신다. …이것은 그대 몫이오, 바다의 선장. 다리를 놓은 사람에게 책 한 권쯤은 주어도 되겠지.']
    ]);
    give('mh_corvina');
    var tt = await titleUp('OT', '술탄 쉴레이만 1세의 칙령으로', '모하치 원정에서 ' + (b.bridge && b.bridge !== 'fail' ? '드라바 강에 다리를 놓고 ' : '') + '함께 싸운 공으로.');
    b.title = tt || 'none'; trust('ot_sultan', 10);
    log('1526년 모하치 — 술탄 쉴레이만의 원정군과 함께 헝가리 군을 무찔렀다. 부다 궁의 책 한 권을 받았다. (전투 명성 +' + bf + ')');
    refresh();
  }

  // ================================================================ ③ 두 왕의 헝가리 (1526.11~1527)
  function kingOpen() { var b = st(), t = today(); return !!(b && (b.side === 'hu' || b.side === 'ot' || b.court) && !b.king && t >= D.kingFrom && t <= D.kingTo && (at(BUDA) || at(VIENNA))); }
  async function king() {
    var b = st(), s = S(), k = K(), buda = at(BUDA), cost = k.support || 2000;
    await withPic('mh_kings', '두 왕의 헝가리 (1526)', function () { return play(buda
      ? [[null, '부다. 오스만 군이 물러간 뒤 불탄 거리에 사람들이 돌아왔다.'],
        [ENVOY, '서포여이 야노시 왕의 사절이오. 헝가리는 헝가리 사람이 다스려야 하오 — 독일 사람의 왕은 안 되오. 우리 왕에게 무기를 대 줄 바다의 상인을 찾고 있소.'],
        ['mh_zapolya', '(옆방에서 나와) 모하치에 늦었다고 사람들이 나를 욕하오. 내가 일부러 늦었다고까지. …그래도 나는 왕관을 썼소. 합스부르크가 이 왕관을 가져가게 둘 수는 없소.']]
      : [[null, '비엔나 호프부르크. 검은 벨벳 옷의 젊은 대공이 지도를 내려다본다.'],
        [CHANCELLOR, '페르디난트 전하의 재상이오. 헝가리의 왕관은 혼인 약조에 따라 전하의 것이오. 서포여이라는 자는 왕관을 훔쳤소.'],
        ['mh_ferdinand', '(지도에서 눈을 들며) 내 누이 마리아가 남편을 잃었고, 내 아내 언너는 오라비를 잃었소. 헝가리를 지키는 것은 이제 합스부르크의 일이오. 오스만이 다음에는 빈까지 올 테니까.']]
        .concat(b.mary === 'saved' ? [['mh_mary', '(창가에서 돌아보며) 선장! 다시 만났네요. …오라버니를 도와줘요. 그이가 지키려던 나라예요.']] : [])); });
    var v = await UI.ask(buda ? '서포여이 야노시를 돕겠는가?' : '페르디난트를 돕겠는가?', [
      { label: (buda ? '서포여이' : '페르디난트') + '에게 금화와 무기를 댄다 (' + U.num(cost) + '닢)', value: 'yes', icon: 'coin', dis: s.player.gold < cost },
      { label: '「바다의 상인은 왕을 고르지 않소」', value: 'no' }], me());
    if (v === 'yes' && s.player.gold >= cost) {
      s.player.gold -= cost; b.king = buda ? 'zapolya' : 'ferdinand';
      trust(buda ? 'hu_king' : 'de_emperor', 8);
      var kf = fame('so', 'king');
      await play([[buda ? 'mh_zapolya' : 'mh_ferdinand', buda ? '고맙소. 언젠가 내가 이 나라를 하나로 묶으면 그대의 이름을 기억하겠소. …그러지 못하면, 나는 술탄에게라도 손을 내밀 것이오.' : '고맙소. 합스부르크는 빚을 잊지 않소. 이 돈으로 토커이까지 군대를 보내겠소.']]);
      log('1526년 — 헝가리의 두 왕 가운데 ' + (buda ? '서포여이 야노시' : '페르디난트') + '를 도왔다. (사교 명성 +' + kf + ')');
    } else { b.king = 'none'; await play([[buda ? ENVOY : CHANCELLOR, '…알았소. 이 나라는 이제 둘로 갈라질 것이오. 그 틈으로 술탄이 다시 들어오겠지.']]); }
    refresh();
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[courtOpen, court], [otOpen, bridge], [kingOpen, king]];
  MH.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  MH.check = async function () {
    if (MH._busy) return false; MH._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    MH._busy = false; refresh();
    return true;
  };
  MH._t = { court: court, bridge: bridge, battle: battle, king: king };
})(window.G = window.G || {});
