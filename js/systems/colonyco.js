/* 식민지 경쟁에 뛰어든 나라와 회사 (G.ColonyCo) — 2026-11-04 사용자 요청
   「네덜란드 서인도 회사(1621) · 프랑스 동인도 회사와 퐁디셰리(1664~1674) · 덴마크의 트랑케바르(1620) · 신스웨덴(1638) · 쿠를란트의 토바고(1654) · 스코틀랜드의 다리엔(1698) 생성 이벤트」
   사람·조정값: js/data/colonyco.js (G.BALANCE.colonyCo). 역사는 바뀌지 않는다.
   ■ 도시에 들어설 때 (js/scenes/city.js)
     ① 암스테르담 1621.6.3~1623: 우셀링크스(정착지)와 열아홉 이사(사략)의 다툼 · 청약 → 1628.9.8 피트 헤인이 마탄사스에서 에스파냐 은 선단을 빼앗고 → 1629년 1주에 액면의 div 배당
     ② 파리 1664.8.27~1665: 콜베르의 프랑스 동인도 회사 · 출자(왕의 신뢰) → 1675년 장사가 시원치 않다는 소식 (주가가 곡선대로 떨어진다)
     청약·출자는 서인도 회사·프랑스 동인도 회사의 주식이 된다 (G.Company.subscribe — 청약 기간 안이면 액면, 그 뒤 추가 출자는 그날 시세) 2026-11-06
     ④ 크리스티나 요새 1638.3.29~1641: 미누이트가 레나페의 마타호른에게서 땅을 산다
        (가) 공정한 흥정을 돕는다(웅변 speech면 더 좋게) (나) 뉴암스테르담에 알린다 — 네덜란드가 금화 bounty (다) 지켜본다
     ⑥ 에든버러 1696.2.26~8.31: 패터슨의 스코틀랜드 회사 · 출자 → 돌아오지 않는다 (다리엔의 실패)
   ■ 바다의 하루 끝, 그 앞바다에 닿으면 (js/scenes/sea.js)
     ② 퐁디셰리 1674~1680: 모래톱 마을의 마르탱과 예순 사람 — (가) 총 guns정 (나) 금화 gold (다) 떠난다
     ③ 트랑케바르 1620.5~1621: 기에데의 함대 · 살아 돌아온 크라페 — 탄자부르 나야크와의 조약을 (가) 힌두어 lang 이상으로 통역 (나) 예물 금화 gold (다) 떠난다
     ⑤ 토바고 1654.5.20~1660: 야코프 공작의 「새 쿠를란트」 — (가) 식량 food일분 (나) 금화 gold (다) 떠난다
     ⑥ 칼레도니아 만 1698.11.4~1699.6.20: 굶주린 스코틀랜드 이주민 — (가) 식량을 나눈다 (나) 비싸게 판다 (다) 떠난다
   ■ 떠나면 180일 뒤 다시(기한 안에서). 소식: 덴마크 동인도 회사 · 트랑케바르 · 서인도 회사 · 마탄사스 · 신스웨덴 · 미누이트 · 토바고 · 신스웨덴의 끝 · 프랑스 동인도 회사 · 퐁디셰리 · 다리엔 · 다리엔의 실패
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/cw_* — COLONYCO_PROMPT.md
   ■ 저장: s.colonyCo = { told: {}, wic, wicDiv, fr, frPaid, nswe, darienSub, pondy, tranq, tobago, darien, <열쇠>How, <열쇠>Cool } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var CC = G.ColonyCo = {};
  function K() { return G.BALANCE.colonyCo; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  var NEWS = ['dk', 'tranq', 'wic', 'heyn', 'nswe', 'minuit', 'tobago', 'nsfall', 'fr', 'pondy', 'darien', 'darienFail'];
  var NEWS_AT = { dk: 16160317, tranq: 16201119, wic: 16210603, heyn: 16280908, nswe: 16380329, minuit: 16380815, tobago: 16540520, nsfall: 16550915, fr: 16640827, pondy: 16740204, darien: 16981104, darienFail: 16990620 };
  CC.NEWS_AT = NEWS_AT;
  function st() {
    var s = S(); if (!s) return null;
    if (!s.colonyCo) { s.colonyCo = { told: {} }; NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.colonyCo.told[k] = 1; }); }
    s.colonyCo.told = s.colonyCo.told || {};
    return s.colonyCo;
  }
  CC.state = st;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(k) {
    if (k === 'P') return me();
    if (k === 'first') return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    return G.Hist ? G.Hist.speaker('cw_' + k) : { name: k, lang: 3 };
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function log(t) { G.State.log(t); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : { lv: R.skill(id), who: null }; return { lv: (b && b.lv) || 0, who: (b && b.who) || '제독' }; }
  function lang(li) { var b = R.langBest ? R.langBest(li) : { lv: 0, who: null }; return { lv: (b && b.lv) || 0, who: (b && b.who) || '제독' }; }
  function item(id) { return R.addItem ? R.addItem(id) !== false : false; }
  function num(n) { return U.num(Math.round(n)); }
  function trust(id, n) { if (G.Sponsor && G.SPONSOR && G.SPONSOR[id]) G.Sponsor.addTrust(G.Sponsor.rel(id), n); }
  function qty(id) { var c = S().fleet.cargo || {}; return c[id] ? c[id].q || 0 : 0; }
  function take(id, n) { var c = S().fleet.cargo, cg = c && c[id]; if (!cg) return 0; n = Math.min(cg.q, n); if (R.takeCargoLots) R.takeCargoLots(cg, null, n, 0); cg.q -= n; if (cg.q <= 0) delete c[id]; return n; }
  function foodNeed(days) { return Math.ceil(R.dailyUse() * days); }
  function later(key, how) { var b = st(); b[key] = null; b[key + 'How'] = how; b[key + 'Cool'] = S().day + 180; }
  function cooled(key) { var b = st(); return !(b[key + 'Cool'] > S().day); }
  function inWin(k) { var t = today(); return t >= k.from && t <= k.to; }
  function subscribe(coId, paid, k) { return G.Company && G.Company.subscribe ? G.Company.subscribe(coId, paid, today() <= k.to) : 0; }
  function shares(coId) { var b = G.Company && G.Company.state ? G.Company.state() : null; return b ? b.shares[coId] || 0 : 0; }
  function cityOpen(key) { var b = st(), k = K()[key], win = G.VoyagePlans ? G.VoyagePlans.window(k, G.VoyagePlans.isSubscription(key)) : k; return !!(b && !b[key] && cooled(key) && cityNow() === k.city && today() >= win.from && today() <= win.to); }
  function seaOpen(key) {
    var b = st(), k = K()[key], s = S(), l = s && s.loc; if (!b || b[key] || !cooled(key) || !l || l.mode !== 'sea' || l.lon == null || !inWin(k)) return false;
    return l.lon >= k.box[0] && l.lon <= k.box[1] && l.lat >= k.box[2] && l.lat <= k.box[3];
  }
  async function invest(opts, title, sp) {
    var g = S().player.gold;
    var v = await UI.ask(title + ' — 소지금 ' + num(g) + '닢', opts.map(function (n) { return { label: '금화 ' + num(n) + '닢을 낸다', value: n, dis: g < n }; }).concat([{ label: '준비한 뒤 다시 결정한다', value: -1 }, { label: '참여하지 않는다', value: 0 }]), sp);
    if (v == null || v === -1) return null;
    v = +v || 0;
    if (v > 0 && g >= v) { S().player.gold -= v; return v; }
    return 0;
  }

  // ================================================================ ① 네덜란드 서인도 회사 (1621)
  CC.wic = async function () {
    var b = st(), k = K().wic;
    if (G.VoyagePlans) await G.VoyagePlans.subscriptionIntro(k);
    await withPic('cw_wic', '서인도 회사 (1621)', function () { return play([
      [null, '암스테르담. 에스파냐와의 열두 해 휴전이 끝났다. 운하 옆 회의실에서 새 회사의 특허장이 읽힌다 — 「서인도 회사」. 아메리카와 서아프리카, 대서양의 장사를 이 회사만 한다.'],
      ['usselincx', '내가 서른 해 동안 외친 회사요! 하지만 들어 보시오 — 나는 농부와 목수를 아메리카에 보내 마을을 세우자 했소. 노예 없이, 땅을 일구는 정착지를.'],
      ['heeren', '(긴 탁자 너머에서) 우셀링크스 선생, 꿈은 좋소. 하지만 출자자들이 바라는 것은 에스파냐의 은 선단이오. 사략선 한 척이 농부 천 명보다 빨리 배당을 가져오지.'],
      ['usselincx', '…저들은 회사를 해적질로 만들려 하오. (제독에게) 그래도 몫은 사 두시오. 회사가 무엇이 되든, 그 배들은 대서양을 바꿀 것이오.']
    ]); });
    var paid = await invest(k.opts, '서인도 회사 주식을 청약할까?', who('heeren'));
    if (paid == null) { b.wicCool = S().day + G.BALANCE.voyagePlans.deferDays; log('출자 결정을 미루었다 — 참여 기한 안에 다시 방문할 수 있다.'); return false; }
    var n = paid ? subscribe('wic', paid, k) : 0;
    b.wic = paid || -1;
    if (paid) { item('wic_share'); log('암스테르담에서 네덜란드 서인도 회사 주식을 금화 ' + num(paid) + '닢어치 청약했다 — ' + n + '주.'); UI.toast('서인도 회사 청약 — ' + n + '주 (금화 ' + num(paid) + '닢)', 'coin', 4800); }
    refresh(); return true;
  };

  // ================================================================ ② 프랑스 동인도 회사 (1664) · 퐁디셰리 (1674)
  CC.fr = async function () {
    var b = st(), k = K().fr;
    if (G.VoyagePlans) await G.VoyagePlans.subscriptionIntro(k);
    await withPic('cw_fr_eic', '프랑스 동인도 회사 (1664)', function () { return play([
      [null, '파리, 루브르 곁의 재무총감 집무실. 왕의 칙령으로 「프랑스 동인도 회사」가 섰다. 네덜란드와 잉글랜드의 회사에 맞설 왕의 회사다. 왕이 몸소 수백만 리브르를 넣었고, 궁정 사람들은 너도나도 명부에 이름을 올린다 — 올리지 않으면 왕의 눈 밖에 난다는 소문과 함께.'],
      ['colbert', '바다의 제독이시오? 잘 오셨소. 나는 콜베르. 프랑스는 땅은 넓으나 바다에서는 네덜란드의 짐꾼 노릇이나 하고 있소. 이제 왕의 이름으로 인도까지 가는 배를 띄우오.'],
      ['colbert', '마다가스카르에 기지를, 인도에 상관을. 폐하께서 출자자들의 이름을 하나하나 보신다는 걸 잊지 마시오.']
    ]); });
    var paid = await invest(k.opts, '프랑스 동인도 회사에 출자할까?', who('colbert'));
    if (paid == null) { b.frCool = S().day + G.BALANCE.voyagePlans.deferDays; log('출자 결정을 미루었다 — 참여 기한 안에 다시 방문할 수 있다.'); return false; }
    var n = paid ? subscribe('fr', paid, k) : 0;
    b.fr = paid || -1;
    if (paid) { item('fr_eic_share'); UI.toast('프랑스 동인도 회사 주식 ' + n + '주', 'seal', 4200); trust('fr_king', k.trust); log('파리에서 콜베르의 프랑스 동인도 회사에 금화 ' + num(paid) + '닢을 출자했다. (프랑스 국왕의 신뢰 +' + k.trust + ')'); UI.toast('프랑스 동인도 회사 출자 — 프랑스 국왕의 신뢰 +' + k.trust, 'coin', 4800); }
    else await play([['colbert', '…그렇소? 폐하께는 그대가 「신중한 분」이라고 아뢰겠소.']]);
    refresh(); return true;
  };
  CC.pondy = async function () {
    var b = st(), k = K().pondy, s = S();
    await withPic('cw_pondy', '퐁디셰리 (1674)', function () { return play([
      [null, '코로만델 해안, 야자수 늘어선 모래톱 마을. 흰 깃발에 금빛 백합 — 프랑스 깃발 하나가 초가 위에 꽂혀 있다. 비자푸르의 총독 셰르 칸 로디가 프랑스 동인도 회사에 이 마을을 내주었다.'],
      ['martin', '배다! 프랑스 배는 아니지만… 반갑소, 바다의 친구. 나는 프랑수아 마르탱. 여기 프랑스 사람은 겨우 예순 남짓이오. 산 토메에서 쫓겨나 이 모래톱에 왔지.'],
      ['martin', '네덜란드 놈들이 언제 올지 모르오. 성벽은커녕 말뚝 울타리도 없소. 총이든 돈이든, 이 마을이 도시가 될 때까지 버틸 힘이 필요하오. 언젠가 여기가 인도에서 가장 아름다운 프랑스 도시가 될 거요. 두고 보시오.']
    ]); });
    var gunsOk = qty('guns') >= k.guns, goldOk = s.player.gold >= k.gold;
    var v = await UI.ask('퐁디셰리의 마르탱을 도울까?', [
      { label: '총 ' + k.guns + '정을 넘긴다', value: 'guns', dis: !gunsOk },
      { label: '금화 ' + num(k.gold) + '닢을 빌려준다', value: 'gold', dis: !goldOk },
      { label: '떠난다', value: 'leave' }], who('martin'));
    if (v === 'guns' && gunsOk) take('guns', k.guns);
    else if (v === 'gold' && goldOk) s.player.gold -= k.gold;
    else { later('pondy', 'leave'); await play([['martin', '…그렇군. 그래도 언젠가 이 모래톱을 다시 지나거든 보시오. 거리가 생겨 있을 테니.']]); log('1674년 퐁디셰리의 프랑스 사람들을 두고 떠났다.'); refresh(); return true; }
    b.pondy = v;
    await play([['martin', '고맙소! 이걸로 첫 망루를 세우겠소. (모래 위에 막대로 선을 긋는다) 여기 성채, 여기 바다로 곧게 뻗은 거리… 이 설계도를 가져가시오. 그대가 다시 왔을 때 얼마나 닮았는지 보시오.']]);
    item('pondy_plan'); trust('fr_king', 6); var so = fame('so', 120);
    log('1674년 코로만델 해안의 퐁디셰리에서 프랑수아 마르탱을 도왔다(' + (v === 'guns' ? '총 ' + k.guns + '정' : '금화 ' + num(k.gold) + '닢') + '). (사교 명성 +' + so + ' · 프랑스 국왕의 신뢰 +6)');
    UI.toast('퐁디셰리의 첫 설계도 · 사교 명성 +' + so, 'scroll', 5200);
    refresh(); return true;
  };

  // ================================================================ ③ 덴마크의 트랑케바르 (1620)
  CC.tranq = async function () {
    var b = st(), k = K().tranq, s = S();
    await withPic('cw_tranq', '트랑케바르 (1620)', function () { return play([
      [null, '코로만델 해안 남쪽, 카베리 강 어귀의 어촌 트랑케바르. 붉은 바탕에 흰 십자 — 덴마크 깃발을 단 배들이 닻을 내렸다. 덴마크 동인도 회사의 첫 함대다. 두 해 걸린 항해 끝에 선원 절반이 죽었다.'],
      ['gjedde', '나는 제독 오베 기에데. 실론 왕과 약속을 맺으러 왔건만 그 왕은 우리를 모른 척하더군. 이제 이 해안에라도 발을 붙여야 하오. 코펜하겐에 빈손으로 돌아갈 수는 없지.'],
      ['crappe', '(맨발에 인도식 터번 차림으로 해안에서 걸어 나오며) 제독! 저 롤란 크라페입니다! 외레순호가 포르투갈 놈들에게 당하고 저는 헤엄쳐 살아남아 탄자부르의 나야크 궁정까지 걸어갔지요. 라구나타 나야크께서 이 마을을 내주실 마음이 있으십니다.'],
      ['crappe', '(제독을 돌아보며) 다만 궁정의 말을 옮길 사람과, 나야크께 올릴 예물이 모자랍니다. 바다의 손님, 도와주실 수 있겠소?']
    ]); });
    var hi = lang(8), goldOk = s.player.gold >= k.gold;
    var v = await UI.ask('트랑케바르 조약을 도울까?', [
      { label: hi.lv >= k.lang ? '나야크 궁정에서 말을 옮긴다 (힌두어 ' + hi.lv + ' — ' + hi.who + ')' : '말을 옮긴다 — 힌두어 ' + k.lang + '단계가 있어야 한다', value: 'lang', dis: hi.lv < k.lang },
      { label: '예물로 금화 ' + num(k.gold) + '닢을 보탠다', value: 'gold', dis: !goldOk },
      { label: '떠난다', value: 'leave' }], who('crappe'));
    if (v === 'lang' && hi.lv >= k.lang) { /* 말로 */ }
    else if (v === 'gold' && goldOk) s.player.gold -= k.gold;
    else { later('tranq', 'leave'); await play([['gjedde', '흥, 우리 덴마크 사람들끼리 하겠소.']]); log('1620년 트랑케바르의 덴마크 함대를 두고 떠났다.'); refresh(); return true; }
    b.tranq = v;
    await play([
      [null, '탄자부르 궁정. 코끼리가 늘어선 마당을 지나 금빛 차양 아래 나야크가 앉아 있다. ' + (v === 'lang' ? hi.who + '의 입을 빌려 덴마크 왕의 편지가 읽힌다.' : '제독이 보탠 예물 상자가 열리자 신하들 사이에 웅성임이 번진다.')],
      ['crappe', '나야크께서 트랑케바르 마을과 해마다 바칠 공물을 정하셨습니다! 우리는 여기에 성을 쌓습니다 — 단스보르, 덴마크의 성이오!'],
      ['gjedde', '…좋소, 그대 덕을 봤구려. 코펜하겐에 가면 크리스티안 폐하께 그대 이름을 아뢰겠소.']
    ]);
    item('dansborg_seal'); trust('dk_king', 10); var so = fame('so', 120);
    log('1620년 트랑케바르에서 덴마크 동인도 회사와 탄자부르의 나야크 사이의 조약을 도왔다' + (v === 'lang' ? ' (통역)' : ' (예물 금화 ' + num(k.gold) + '닢)') + '. (사교 명성 +' + so + ' · 덴마크 국왕의 신뢰 +10)');
    UI.toast('단스보르 요새의 인장 · 덴마크 국왕의 신뢰 +10', 'scroll', 5200);
    refresh(); return true;
  };

  // ================================================================ ④ 신스웨덴 (1638)
  CC.nswe = async function () {
    var b = st(), k = K().nswe, s = S();
    await withPic('cw_nswe', '신스웨덴 (1638)', function () { return play([
      [null, '델라웨어 강의 바위 곶. 칼마르 뉘켈호와 포겔 그리프호 — 스웨덴 깃발을 단 두 배가 닻을 내렸다. 강가에 나무 울타리가 오르고, 이름이 붙는다. 「크리스티나 요새」, 스웨덴의 어린 여왕의 이름이다.'],
      ['minuit', '나를 알아보는구려. 그렇소, 한때 뉴암스테르담의 총독이었던 미누이트요. 맨해튼 섬을 사들인 것도 나였지. 네덜란드 회사에 쫓겨난 뒤 이제 스웨덴의 깃발로 돌아왔소. 회사 일을 처음 꿈꾼 우셀링크스도 지금은 스웨덴에 있다오.'],
      ['mattahorn', '(왐펌 띠를 두른 추장이 사슴 가죽 위에 앉는다) 너희가 원하는 땅은 우리 사냥터다. 우리는 땅을 판다고 하지 않는다. 함께 쓴다고 한다. 그 말을 너희 종이에 똑바로 적을 수 있느냐?'],
      [null, '— 뉴암스테르담의 총독 키프트가 보낸 항의 편지가 도착했다. 「이 강은 네덜란드 서인도 회사의 땅이다.」 편지를 든 네덜란드 사람이 제독에게 슬쩍 다가온다. 「저 스웨덴 놈들의 배와 사람 수를 알려 주면 섭섭지 않게 해 드리겠소.」']
    ]); });
    var sp = skill('speech');
    var v = await UI.ask('크리스티나 요새 — 어떻게 할까?', [
      { label: '레나페와 스웨덴 사이의 공정한 흥정을 돕는다' + (sp.lv >= k.speech ? ' (웅변 ' + sp.lv + ' — ' + sp.who + ')' : ''), value: 'fair' },
      { label: '뉴암스테르담에 스웨덴 사람들 사정을 알린다 (금화 ' + num(k.bounty) + '닢)', value: 'dutch' },
      { label: '지켜본다', value: 'leave' }], who('mattahorn'));
    if (v === 'fair') {
      var good = sp.lv >= k.speech; b.nswe = good ? 'fairGood' : 'fair';
      await play([
        ['P', good ? '추장의 말을 그대로 적으시오, 미누이트. 「판다」가 아니라 「함께 쓴다」. 그리고 사냥터의 강가는 레나페 사람들 몫으로 남겨 두시오. 그래야 이 울타리가 오래 서 있을 것이오.' : '추장의 말을 그대로 적어 두시오. 「함께 쓴다」고.'],
        ['minuit', '…좋소. 종이에 그렇게 적겠소. 주전자와 도끼, 천과 거울을 내겠소.'],
        ['mattahorn', '(왐펌 띠 하나를 풀어 제독에게 건넨다) 이 띠는 약속을 기억한다. 종이는 잊어도 조개는 잊지 않는다.']
      ]);
      item('wampum_belt'); var so = fame('so', good ? 150 : 80);
      log('1638년 크리스티나 요새에서 레나페의 마타호른과 스웨덴의 미누이트 사이의 흥정을 도왔다. (사교 명성 +' + so + ')');
      UI.toast('레나페의 조개 구슬 띠 · 사교 명성 +' + so, 'scroll', 5200);
    } else if (v === 'dutch') {
      b.nswe = 'dutch'; s.player.gold += k.bounty;
      await play([[null, '네덜란드 사람은 금화 자루를 건네고 밤배로 사라졌다. 이튿날 미누이트가 제독을 오래 쳐다보았다. 아무 말도 하지 않았다.']]);
      log('1638년 크리스티나 요새의 스웨덴 사람들 사정을 뉴암스테르담에 알리고 금화 ' + num(k.bounty) + '닢을 받았다.');
    } else { later('nswe', 'leave'); log('1638년 크리스티나 요새에 스웨덴 사람들이 들어서는 것을 지켜보았다.'); }
    refresh(); return true;
  };

  // ================================================================ ⑤ 쿠를란트의 토바고 (1654)
  CC.tobago = async function () {
    var b = st(), k = K().tobago, s = S();
    await withPic('cw_tobago', '새 쿠를란트 (1654)', function () { return play([
      [null, '카리브 바다 남쪽 끝의 푸른 섬 토바고. 검은 가재가 그려진 낯선 깃발을 단 배가 만에 닻을 내렸다. 발트 바다 끝의 작은 공국 쿠를란트 — 야코프 공작이 보낸 이주민들이다. 감비아 강 어귀에 요새를 세운 지 세 해, 이제는 아메리카다.'],
      ['mollens', '쿠를란트 공작의 배요! 나는 선장 몰런스. 여기를 「새 쿠를란트」라 부를 거요. 그런데 섬 반대편에는 네덜란드 람프신스 형제의 사람들이 먼저 와 있다는군. 우리 이주민들은 열병에 걸리고 식량은 바닥났소.'],
      ['mollens', '공작께서는 작은 나라도 바다를 가질 수 있다고 믿으시오. 리가의 상인들도, 프랑스 왕도 비웃지만… 이 사람들이 첫 겨울만 넘기면 됩니다.']
    ]); });
    var need = foodNeed(k.food), foodOk = (s.fleet.food || 0) >= need, goldOk = s.player.gold >= k.gold;
    var v = await UI.ask('쿠를란트 이주민을 도울까?', [
      { label: '식량 ' + k.food + '일분을 나눠 준다', value: 'food', dis: !foodOk },
      { label: '금화 ' + num(k.gold) + '닢을 보탠다', value: 'gold', dis: !goldOk },
      { label: '떠난다', value: 'leave' }], who('mollens'));
    if (v === 'food' && foodOk) s.fleet.food -= need;
    else if (v === 'gold' && goldOk) s.player.gold -= k.gold;
    else { later('tobago', 'leave'); log('1654년 토바고의 쿠를란트 이주민들을 두고 떠났다.'); refresh(); return true; }
    b.tobago = v;
    await play([['mollens', '고맙소! 이 섬에 야코프 요새를 세우면 첫 대포를 그대의 배를 향해 쏘겠소 — 예포로 말이오. 공작께 그대 이야기를 써 보내겠소.']]);
    item('courland_letter'); var so = fame('so', 100);
    log('1654년 토바고에서 쿠를란트 공작의 「새 쿠를란트」 이주민들을 도왔다(' + (v === 'food' ? '식량 ' + k.food + '일분' : '금화 ' + num(k.gold) + '닢') + '). (사교 명성 +' + so + ')');
    UI.toast('쿠를란트 공작의 감사장 · 사교 명성 +' + so, 'scroll', 5200);
    refresh(); return true;
  };

  // ================================================================ ⑥ 스코틀랜드의 다리엔 (1696 청약 · 1698~1699)
  CC.darienSub = async function () {
    var b = st(), k = K().darienSub;
    if (G.VoyagePlans) await G.VoyagePlans.subscriptionIntro(k);
    await withPic('cw_darien_sub', '스코틀랜드 회사 (1696)', function () { return play([
      [null, '에든버러, 밀스 스퀘어의 회사 사무소. 문 앞에 귀족, 상인, 하녀, 장인이 길게 줄을 섰다. 잉글랜드 동인도 회사를 부러워만 하던 스코틀랜드가 제 회사를 세웠다. 몇 달 만에 나라의 돈 4분의 1이 이 명부로 모인다.'],
      ['paterson', '나는 윌리엄 패터슨. 잉글랜드 은행을 세운 사람이지만, 이번엔 고향을 위해서요. 파나마 지협의 다리엔 — 두 바다 사이 가장 좁은 땅에 스코틀랜드의 항구를 세우면, 동쪽과 서쪽의 장사가 모두 그 문을 지나게 되오. 「바다의 문, 세상의 열쇠」지!'],
      ['first', '(제독에게 속삭이며) 제독님, 다리엔이라면 에스파냐 땅 한복판입니다. 늪과 열병의 땅이고요…'],
      ['paterson', '(지도를 펼치며) 잉글랜드 사람들은 겁을 먹고 출자를 거두어 갔소. 그래서 스코틀랜드 사람들이 다 내기로 했소. 그대도 함께하겠소?']
    ]); });
    var paid = await invest(k.opts, '스코틀랜드 회사에 출자할까?', who('paterson'));
    if (paid == null) { b.darienSubCool = S().day + G.BALANCE.voyagePlans.deferDays; log('출자 결정을 미루었다 — 참여 기한 안에 다시 방문할 수 있다.'); return false; }
    b.darienSub = paid || -1;
    if (paid) { item('darien_share'); log('에든버러에서 스코틀랜드 회사(다리엔 계획)에 금화 ' + num(paid) + '닢을 출자했다.'); UI.toast('스코틀랜드 회사에 출자했다 — 금화 ' + num(paid) + '닢', 'coin', 4800); }
    refresh(); return true;
  };
  CC.darien = async function () {
    var b = st(), k = K().darien, s = S();
    await withPic('cw_darien', '칼레도니아 만 (1698~1699)', function () { return play([
      [null, '다리엔 해안의 칼레도니아 만. 「뉴에든버러」라 이름 붙인 오두막들과 「세인트앤드루 요새」의 흙벽이 늪가에 서 있다. 스코틀랜드에서 가져온 모직 옷과 가발은 아무도 사지 않고, 열병이 날마다 사람을 데려간다.'],
      ['paterson', '(마르고 열에 들뜬 얼굴로) 제독… 아내가 지난주에 죽었소. 잉글랜드 왕이 식민지들에 명을 내렸다는구려 — 다리엔의 스코틀랜드 사람들과는 거래도 하지 말고 돕지도 말라고. 자메이카 배들이 우리 곁을 그냥 지나가오.'],
      ['paterson', '식량이 있으면… 무엇이든 내겠소. 가진 것이라곤 회사의 남은 돈뿐이지만.']
    ]); });
    var need = foodNeed(k.food), foodOk = (s.fleet.food || 0) >= need, sell = Math.max(k.minSell || 2000, Math.round(need * k.price * 10));
    var v = await UI.ask('굶주린 다리엔의 이주민들', [
      { label: '식량 ' + k.food + '일분을 그냥 나눈다', value: 'give', dis: !foodOk },
      { label: '식량 ' + k.food + '일분을 비싸게 판다 (금화 ' + num(sell) + '닢)', value: 'sell', dis: !foodOk },
      { label: '떠난다', value: 'leave' }], who('paterson'));
    if (v === 'give' && foodOk) {
      s.fleet.food -= need; b.darien = 'give';
      var so = fame('so', 200);
      await play([['paterson', '…잉글랜드 왕도, 에스파냐 왕도 하지 않은 일을 이름 모를 배가 하는구려. 스코틀랜드는 그대를 잊지 않을 거요.']]);
      log('1699년 다리엔의 굶주린 스코틀랜드 이주민들에게 식량 ' + k.food + '일분을 나누었다. (사교 명성 +' + so + ')');
      UI.toast('다리엔에 식량을 나누었다 — 사교 명성 +' + so, 'heart', 5200);
    } else if (v === 'sell' && foodOk) {
      s.fleet.food -= need; s.player.gold += sell; b.darien = 'sell';
      await play([['paterson', '(회사의 마지막 금화 상자를 내밀며) …받으시오. 장사꾼이 장사를 하는 것을 탓하지는 않겠소.']]);
      log('1699년 다리엔의 스코틀랜드 이주민들에게 식량 ' + k.food + '일분을 금화 ' + num(sell) + '닢에 팔았다.');
    } else { later('darien', 'leave'); log('1699년 다리엔의 칼레도니아 만을 두고 떠났다.'); }
    refresh(); return true;
  };

  // ================================================================ 날마다 — 소식 · 정산
  CC.daily = function () {
    var b = st(), out = [], s = S(); if (!b) return out;
    var t = today(), told = b.told;
    function news(key, icon, text) { if (!told[key] && t >= NEWS_AT[key]) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('dk', 'scroll', '【덴마크 동인도 회사】 덴마크의 크리스티안 4세가 코펜하겐의 상인들에게 동인도 회사의 특허장을 내렸다. 작은 나라도 희망봉 너머로 배를 보낸다.');
    news('tranq', 'scroll', '【트랑케바르】 덴마크 동인도 회사가 탄자부르의 라구나타 나야크와 조약을 맺고 코로만델 해안의 트랑케바르를 얻었다. 바닷가에 단스보르 요새가 선다.' + (b.tranq ? ' 그 조약에 제독의 손길이 있었다.' : ''));
    news('wic', 'scroll', '【네덜란드 서인도 회사】 에스파냐와의 휴전이 끝나자, 네덜란드가 「서인도 회사」를 세웠다. 아메리카와 서아프리카, 대서양의 장사와 — 에스파냐 선단을 노리는 사략을 이 회사가 맡는다.');
    news('heyn', 'cannon', '【마탄사스의 은 선단】 서인도 회사의 피트 헤인이 쿠바의 마탄사스 만에서 에스파냐의 은 선단을 통째로 빼앗았다! 은만 수만 킬로그램 — 싸움 한 번 없이 거둔 전리품에 네덜란드가 들썩인다.');
    news('nswe', 'ship', '【신스웨덴】 페터 미누이트가 이끄는 스웨덴 배 두 척이 델라웨어 강에 「크리스티나 요새」를 세웠다. 스웨덴이 아메리카에 첫 깃발을 꽂았다.');
    news('minuit', 'skull', '【미누이트의 죽음】 신스웨덴을 세우고 돌아가던 페터 미누이트가 카리브 바다의 세인트키츠 앞바다에서 폭풍을 만나 배와 함께 사라졌다.');
    news('tobago', 'ship', '【새 쿠를란트】 발트 바다의 작은 공국 쿠를란트의 야코프 공작이 보낸 이주민들이 카리브의 토바고 섬에 닿아 「새 쿠를란트」를 세웠다. 감비아 강 어귀에 이어 두 번째 해외 땅이다.');
    news('nsfall', 'skull', '【신스웨덴의 끝】 뉴암스테르담의 총독 페터르 스타위베산트가 배 일곱 척과 군사를 이끌고 델라웨어 강의 스웨덴 요새들을 빼앗았다. 신스웨덴은 열일곱 해 만에 끝났다.');
    news('fr', 'scroll', '【프랑스 동인도 회사】 루이 14세의 칙령으로 콜베르의 「프랑스 동인도 회사」가 섰다. 왕이 몸소 큰돈을 넣고, 궁정 사람들도 앞다투어 출자한다. 마다가스카르와 인도가 목표다.');
    news('pondy', 'ship', '【퐁디셰리】 프랑수아 마르탱이 코로만델 해안의 모래톱 마을 퐁디셰리에 프랑스 동인도 회사의 상관을 세웠다. 프랑스 사람은 예순 남짓이지만, 마르탱은 이곳을 도시로 키우겠다고 한다.' + (b.pondy ? ' 그 첫 망루에 제독이 보탠 몫이 있다.' : ''));
    news('darien', 'ship', '【다리엔】 스코틀랜드 회사의 배 다섯 척이 파나마 지협 다리엔의 칼레도니아 만에 닿아 「뉴에든버러」를 세웠다. 스코틀랜드가 제 손으로 세운 첫 식민지다.');
    news('darienFail', 'skull', '【다리엔의 실패】 열병과 굶주림, 잉글랜드 왕의 거래 금지령 끝에 다리엔의 스코틀랜드 이주민들이 정착지를 버리고 떠났다. 나라 돈의 4분의 1이 늪에 가라앉았다.' + (b.darienSub > 0 ? ' 그대가 낸 금화 ' + num(b.darienSub) + '닢도 돌아오지 않는다.' : ''));
    // 정산
    // 정산 — 그날 회사 주식을 쥔 만큼 (G.Company.special)
    var CO = G.Company, cw = G.COMPANY && G.COMPANY.wic, cf = G.COMPANY && G.COMPANY.fr;
    if (CO && cw && !b.wicDiv && t >= K().wic.divAt) { var r1 = CO.special(cw, cw.face * K().wic.div); b.wicDiv = r1.gold || -1; if (r1.gold) out.push({ icon: 'coin', history: true, text: '【서인도 회사의 배당】 피트 헤인이 빼앗은 은 선단 덕에 서인도 회사가 1주에 액면의 50%를 배당했다 — 그대의 ' + r1.n + '주에 금화 ' + num(r1.gold) + '닢.' }); }
    if (CO && cf && !b.frPaid && t >= K().fr.payAt) { var n2 = shares('fr'); b.frPaid = n2 ? 1 : -1; if (n2) out.push({ icon: 'chart', history: true, text: '【프랑스 동인도 회사의 장사】 회사의 장사는 시원치 않다. 첫 출자자들의 몫은 액면에 한참 못 미친다 — 그대의 ' + n2 + '주는 오늘 1주에 금화 ' + num(CO.px(cf)) + '닢 (액면 ' + num(cf.face) + '닢).' }); }
    return out;
  };

  // ================================================================ 도시 · 바다 · 수첩
  CC.pending = function () { var s = S(); if (!s || !s.loc || s.loc.mode !== 'city') return false; return cityOpen('wic') || cityOpen('fr') || cityOpen('nswe') || cityOpen('darienSub'); };
  CC.check = async function () {
    if (CC._busy) return false; CC._busy = true;
    try {
      if (cityOpen('wic')) await CC.wic();
      else if (cityOpen('fr')) await CC.fr();
      else if (cityOpen('nswe')) await CC.nswe();
      else if (cityOpen('darienSub')) await CC.darienSub();
    } catch (e) { console.error(e); }
    CC._busy = false;
    return true;
  };
  CC.seaPending = function () { return !!(S() && (seaOpen('tranq') || seaOpen('pondy') || seaOpen('tobago') || seaOpen('darien'))); };
  CC.atSea = async function () {
    if (CC._busy) return false; CC._busy = true;
    try {
      if (seaOpen('tranq')) await CC.tranq();
      else if (seaOpen('pondy')) await CC.pondy();
      else if (seaOpen('tobago')) await CC.tobago();
      else if (seaOpen('darien')) await CC.darien();
    } catch (e) { console.error(e); }
    CC._busy = false;
    return true;
  };
  CC.html = function () {
    var s = S(), b = s && s.colonyCo; if (!b) return '';
    var li = [];
    if (b.wic > 0 && !b.wicDiv && shares('wic')) li.push('네덜란드 서인도 회사 주식 ' + shares('wic') + '주 (청약 금화 ' + num(b.wic) + '닢) — 배당을 기다린다');
    if (b.darienSub > 0 && !b.told.darienFail) li.push('스코틀랜드 회사(다리엔) 출자 금화 ' + num(b.darienSub) + '닢');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">회사의 몫</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._colonyCoHtml) { G.Court._colonyCoHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + CC.html(); }; }
  (function hookDaily() {
    var W = G.World; if (!W || W._colonyCo) return;
    W._colonyCo = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(CC.daily()); } catch (e) { console.error(e); } return out; };
  })();
})(window.G = window.G || {});
