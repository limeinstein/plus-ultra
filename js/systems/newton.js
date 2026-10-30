/* 아이작 뉴턴 — 사과 · 『프린키피아』 · 남해 회사 주식의 나락 (G.Newton) 2026-10-30 사용자 요청
   「뉴턴과 사과 이벤트와 주식 나락과 프린키피아 저작 이벤트 — 뉴턴은 동료가 될 수 있고 회계 1, 측량·과학·조선기술·세공·항해·웅변 3, 지력 97」
   (사람·조정값: js/data/newton.js)
   ■ ① 사과 (1665.6~1667.4, 링컨셔 울즈소프 둘레 farmR도 안의 뭍을 탐험하면): 흑사병으로 케임브리지가 문을 닫아 고향에 와 있는 젊은 뉴턴.
        사과가 떨어진다 — 「왜 늘 땅으로?」「그럼 달은 왜 떨어지지 않지?」 두 물음에 함께 답한다 (맞히면 탐험 명성). 끝나면 동료 제안.
   ■ ② 『프린키피아』 (1686.4.28~1687.7.4, 런던): 핼리가 원고를 들고 왕립 학회에 왔지만, 학회 금고는 『물고기의 역사』로 바닥났다.
        인쇄비를 대거나(printFund) · 『물고기의 역사』 스무 권을 사 주거나(fishPrice) · 지나친다. 후크가 「거리의 제곱에 반비례」는 내 생각이라며 끼어든다 —
        웅변 2 이상이면 제독이 두 사람을 달래 셋째 권 「세계의 체계」가 빠지지 않게 한다 (아니면 핼리가 달랜다). 끝나면 동료 제안.
        돈을 댔으면 1687.7.5 책이 나오는 날 초판(principia)이 제독에게 온다.
   ■ ③ 주식의 나락 (1720년, 런던): 남해 회사 주식 값이 날마다 바뀐다(price — 1월 128 → 6월 24일 1,050 → 12월 150).
        런던에 들어설 때마다 한 번 사거나(stake, 들인 돈 합 stakeMax까지) 모두 판다(수수료 fee). 1720년이 지나도 들고 있으면 150에 판다.
        뉴턴: 봄에 이익을 보고 팔았다가, 여름 꼭대기에서 전 재산을 다시 사고, 가을에 무너진다 —
        「나는 천체의 움직임은 계산할 수 있지만, 사람들의 광기는 계산할 수 없다」. 6~8월에 웅변 3으로 말리면 절반만 잃는다(소식이 달라진다). 9월 20일 뒤에는 동료 제안.
   ■ 동료: 위 장면이 끝날 때마다 묻는다. 미루면 1720년 9월 20일부터 런던에서 reOffer일마다 다시. 동료여도 ②③은 런던에서 그대로 일어난다(그 자리에 함께 있다).
        1727.3.20 뉴턴이 세상을 떠난다 — 동료였으면 배를 떠난다.
   ■ 소식 (만난 사람만): 『프린키피아』(1687.7.5) · 조폐국장(1699) · 왕립 학회장(1703) · 기사 작위(1705) · 경도법(1714) · 남해 회사의 붕괴(1720.9) · 뉴턴의 죽음(1727.3)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/nt_*.webp — images/legend-events/NEWTON_PROMPT.md
   ■ 저장: s.newton = { met, apple, moon, prin, fund: 'gold'|'fish', hooke, got, bubble: {shares, cost, lastVisit, newtonWarned}, offerAt, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var NT = G.Newton = {}, ID = 'newton';
  function K() { return G.BALANCE.newton; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  function inR(a, b) { var t = today(); return t >= a && t <= b; }
  var NEWS = ['principia', 'mint', 'royal', 'knight', 'longitude', 'crash', 'death'];
  var NEWS_AT = { principia: 16870705, mint: 16991223, royal: 17031130, knight: 17050416, longitude: 17140708, crash: 17200920, death: 17270320 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.newton) { s.newton = { told: {} }; NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.newton.told[k] = 1; }); }
    var b = s.newton; b.told = b.told || {}; b.bubble = b.bubble || { shares: 0, cost: 0 };
    return b;
  }
  NT.state = st;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row() { return (S().mates || []).filter(function (x) { return x.id === ID; })[0] || null; }
  NT.hired = function () { return !!row(); };
  function gone() { return !!(S().flags && S().flags['gone_' + ID]); }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function NS() { return G.Legend && G.Legend.speaker ? G.Legend.speaker(ID) : H(ID); }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(k) { return k === 'P' ? me() : k === 'newton' ? NS() : k === 'halley' ? H('nt_halley') : k === 'hooke' ? H('nt_hooke') : k === 'broker' ? H('nt_broker') : k === 'first' ? (G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {}) : {}; }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function log(t) { G.State.log(t); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : { lv: R.skill(id) }; return b.lv || 0; }

  // ================================================================ 동료
  async function offer(line) {
    var b = st(); if (row() || gone() || today() >= K().death) return false;
    b.offerAt = today();
    var m = G.MATE[ID];
    await play([[ID, line]]);
    var ok = await UI.confirm('아이작 뉴턴을 동료로 맞이하겠습니까? (월급 금화 ' + U.num(m.wage) + '닢)', '동료로 맞이한다', '다음에');
    if (!ok) { await play([[ID, '…그렇소. 나는 혼자 일하는 데 익숙하오.']]); return false; }
    var nm = G.Legend && G.Legend.join ? G.Legend.join(ID, G.CITY_DATA[K().london]) : null;
    if (!nm && !row()) { var s = S(); s.mates.push({ id: ID, role: 'none', joined: today(), loyal: 80 }); }
    await play([[ID, '좋소. 내 공책과 프리즘, 그리고 달의 표를 가져가겠소. 바다 위에서 조수와 달을 재는 일 — 육지의 서재에서는 절대 못 하는 셈이오.']]);
    return true;
  }
  function offerOpen() {
    var b = st(), t = today();
    if (!b || !b.met || row() || gone() || cityNow() !== K().london) return false;
    if (t < 17200920 || t >= K().death) return false;
    return !b.offerAt || U.dayIndex(S().date) - dayIdx(b.offerAt) >= K().reOffer;
  }
  function dayIdx(n) { return U.dayIndex({ y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }); }

  // ================================================================ ① 사과 (울즈소프 — 육상 탐험)
  function nearFarm(lon, lat) { var f = K().farm; return G.Geo.dist(lon, lat, f[0], f[1]) <= K().farmR; }
  NT.appleOpen = function (lon, lat) { var b = st(); return !!(b && !b.apple && inR(K().appleFrom, K().appleTo) && nearFarm(lon, lat)); };
  NT.onLand = async function (lon, lat, ctx) {
    if (!NT.appleOpen(lon, lat) || NT._busy) return false;
    NT._busy = true;
    try { if (ctx && ctx.stop) ctx.stop(); await apple(); } catch (e) { console.error(e); }
    NT._busy = false; return true;
  };
  async function apple() {
    var b = st(); b.met = 1; b.apple = 1;
    await withPic('nt_apple', '울즈소프의 사과나무 (1666)', function () { return play([
      [null, '링컨셔의 낮은 언덕, 돌담에 둘러싸인 작은 농가. 런던에 흑사병이 돌아 케임브리지 대학이 문을 닫았다는 소문이 여기까지 들린다. 과수원 사과나무 아래, 깃펜과 공책을 든 창백한 청년이 하늘을 올려다보고 있다.'],
      ['newton', '…쉿. 움직이지 마시오. 지금 달을 보고 있소. 낮달이지만 똑똑히 보이지. (낯선 일행을 힐끗 보고) 아이작 뉴턴이오. 케임브리지의 학생이오. 학교가 문을 닫아 어머니 농장에 와 있소.'],
      [null, '그때 — 툭. 바람 한 점 없는데 잘 익은 사과 하나가 가지에서 떨어져 청년의 발치로 굴러온다.'],
      ['newton', '(사과를 집어 들고 한참 바라보다가) 선장, 하나 물어봅시다. 이 사과는 왜 늘 땅으로 떨어지오? 옆으로도, 위로도 아니고. 언제나 땅의 한가운데를 향해서.']
    ]); });
    var v = await UI.ask('사과는 왜 늘 땅으로 떨어질까?', [
      { label: '땅이 사과를 끌어당기니까', value: 'pull', icon: 'compass' },
      { label: '사과가 무거워서 제자리로 돌아가는 것', value: 'heavy' },
      { label: '하느님이 그렇게 정하셨으니까', value: 'god' },
      { label: '배가 고파서 떨어진 거요 — 먹으라고 (한 입 베어 문다)', value: 'eat' }], me());
    if (v === 'pull') { await play([['newton', '바로 그거요! 땅이 끌어당긴다. 사과만이 아니라 모든 것을. 그렇다면 그 힘은 어디까지 미칠까? 저 언덕 꼭대기? 구름 위? …저 달까지?']]); }
    else if (v === 'heavy') await play([['newton', '아리스토텔레스는 그렇게 말했지. 무거운 것은 제자리로 간다고. 하지만 「제자리」가 왜 땅의 한가운데요? 땅이 끌어당긴다고 생각하면 훨씬 간단하오. …그렇다면 그 힘은 달까지 닿을까?']]);
    else if (v === 'god') await play([['newton', '하느님이 정하셨다는 데엔 나도 이의가 없소. 다만 나는 하느님이 「어떤 법칙으로」 정하셨는지 알고 싶은 거요. 땅이 끌어당기는 힘 — 그 힘이 달까지 닿는다면?']]);
    else await play([[null, '와삭. 제독이 사과를 한 입 베어 물자 청년이 어이없다는 듯 쳐다보다가, 이윽고 웃음을 터뜨린다.'], ['newton', '하하! 당신 말도 맞소. 사과는 결국 누군가의 입으로 떨어지지. …하지만 하나만 더. 그 끌어당기는 힘이 달까지 닿는다면?']]);
    await play([['newton', '달도 땅이 끌어당긴다면, 달은 왜 사과처럼 떨어지지 않소? 저렇게 하늘에 걸려 있잖소.']]);
    var w = await UI.ask('달은 왜 떨어지지 않을까?', [
      { label: '달도 떨어지고 있다 — 다만 옆으로 아주 빨리 달려서 땅을 비켜 간다', value: 'orbit', icon: 'eye' },
      { label: '달은 너무 멀어서 끌어당기는 힘이 닿지 않는다', value: 'far' },
      { label: '하늘의 수정 껍질에 박혀 있다', value: 'crystal' }], me());
    var ex = 0;
    if (v === 'pull') ex += K().fame.apple;
    if (w === 'orbit') {
      ex += K().fame.moon; b.moon = 1;
      await play([['newton', '(눈을 크게 뜨고) …그렇소. 대포알을 아주 세게 쏘면 멀리 가서 떨어지지. 더 세게 쏘면 더 멀리. 아주아주 세게 쏘면 땅이 둥그니까 떨어져도 떨어져도 땅에 닿지 않고 한 바퀴를 돌 거요. 달이 바로 그 대포알이오! 거리가 멀수록 힘은… 거리의 제곱만큼 약해지겠지. 셈을 해 봐야겠소.'],
        [null, '청년은 사과를 주머니에 넣고 공책에 숫자를 휘갈기기 시작한다. 해가 기울 때까지 고개를 들지 않는다.']]);
    } else await play([['newton', w === 'far' ? '닿지 않는다면 달은 똑바로 날아가 버렸을 거요. 달이 둥글게 도는 건 무언가가 끊임없이 끌어당기기 때문이오. …대포알을 아주 세게 쏘면 어떻게 될까? 셈을 해 봐야겠소.' : '수정 껍질이라… 혜성이 그 껍질을 뚫고 지나가는 걸 보면 껍질은 없는 것 같소. 달은 떨어지고 있는 거요 — 옆으로 달리면서. 셈을 해 봐야겠소.']]);
    var got = fame('ex', ex) + fame('so', 10);
    log('링컨셔 울즈소프의 사과나무 아래에서 젊은 아이작 뉴턴을 만났다. 떨어지는 사과와 떨어지지 않는 달 이야기를 나누었다.' + (ex ? ' (탐험 명성 +' + got + ')' : ''));
    UI.toast(b.moon ? '「달도 떨어지고 있다」 — 뉴턴이 셈을 시작했다' : '사과나무 아래의 청년 — 아이작 뉴턴', 'star', 5200);
    await offer('…선장. 케임브리지가 다시 문을 열 때까지 나는 할 일이 없소. 아니, 할 일은 산더미지만 이 과수원은 좁소. 바다 위에서 조수를 재고 달을 보고 싶소. 밀물이 달 때문이라면 그것도 같은 힘일 테니. 나를 배에 태워 주겠소?');
    refresh();
  }

  // ================================================================ ② 『프린키피아』 (런던)
  function prinOpen() { var b = st(); return !!(b && !b.prin && cityNow() === K().london && inR(K().prinFrom, K().prinTo)); }
  async function principia() {
    var b = st(), s = S(); b.met = 1; b.prin = 1;
    var here = row() ? '(제독의 배에서 내린 뉴턴이 곁에 서 있다) ' : '';
    await withPic('nt_principia', '『프린키피아』 (1686)', function () { return play([
      [null, '런던 그레셤 칼리지, 왕립 학회의 모임방. ' + here + '푸른 외투의 젊은 천문학자가 두툼한 원고를 탁자에 내려놓는다. 「자연철학의 수학적 원리」.'],
      ['halley', '에드먼드 핼리요. 이 원고 좀 보시오, 선장! 뉴턴 선생이 행성이 왜 타원으로 도는지, 혜성이 어디서 오는지, 밀물과 썰물이 왜 생기는지를 하나의 힘으로 풀어냈소. 이 책이 나오면 세상이 바뀌오. 바다도요 — 달의 움직임을 셈할 수 있으면 언젠가 바다 한가운데서도 경도를 잴 수 있을 테니.'],
      ['halley', '…문제는 돈이오. 학회가 올해 『물고기의 역사』라는 도감을 찍느라 금고를 다 털었소. 그림은 근사한데 한 권도 안 팔렸지. 그래서 학회는 이 원고를 찍기로 해 놓고 인쇄비는 나더러 내라는 거요. 내 주머니도 넉넉지 않은데.']
    ]); });
    var gold = s.player.gold;
    var v = await UI.ask('『프린키피아』를 찍을 돈이 없다', [
      { label: '인쇄비를 보탠다 — 금화 ' + U.num(K().printFund) + '닢', value: 'gold', icon: 'coin', dis: gold < K().printFund },
      { label: '팔리지 않은 『물고기의 역사』 스무 권을 사 준다 — 금화 ' + U.num(K().fishPrice) + '닢', value: 'fish', icon: 'book', dis: gold < K().fishPrice },
      { label: '학자들 일은 학자들이 알아서 하겠지', value: 'no' }], me());
    if (v === 'gold') {
      s.player.gold -= K().printFund; b.fund = 'gold';
      await play([['halley', '선장! 이걸로 종이와 활자를 살 수 있소. 책이 나오면 첫 부를 꼭 보내리다.']]);
    } else if (v === 'fish') {
      s.player.gold -= K().fishPrice; b.fund = 'fish';
      for (var i = 0; i < 1; i++) if (R.addItem) R.addItem('fish_history');
      await play([['halley', '하하하! 『물고기의 역사』를 사 주는 사람이 다 있구려! 학회 금고에 숨통이 트였소. 이 돈은 고스란히 인쇄소로 갑니다. 물고기가 행성을 구했군!']]);
    } else await play([['halley', '…그렇지요. 어떻게든 내가 마련해 보겠소. 집을 잡히더라도.']]);
    // 후크의 끼어듦
    await play([
      [null, '그때 모임방 문이 거칠게 열린다. 등이 굽은 깡마른 사내가 성큼성큼 다가온다.'],
      ['hooke', '로버트 후크요! 핼리 군, 그 원고에 「끌어당기는 힘은 거리의 제곱에 반비례한다」는 말이 있다지? 그건 내가 여섯 해 전에 뉴턴에게 편지로 써 보낸 생각이오! 머리말에 내 이름을 넣어야 하오!'],
      ['newton', row() ? '(얼굴이 하얘지며) 후크 씨, 생각만 던지고 증명은 하나도 못 한 사람이 무슨 주인이오! …핼리, 셋째 권 「세계의 체계」는 빼겠소. 이런 다툼에 휘말리느니 차라리 찍지 않는 게 낫지.' : null],
      [null, row() ? null : '케임브리지에서 온 편지를 핼리가 읽는다. 뉴턴은 노발대발하며 셋째 권 「세계의 체계」를 빼 버리겠다고 한다.']
    ]);
    var sp = skill('speech');
    var h = await UI.ask('후크와 뉴턴의 다툼 — 셋째 권이 빠질 판이다', [
      { label: '두 사람을 달랜다 — 「생각을 처음 꺼낸 사람과 그것을 증명한 사람, 둘 다 기억되게 합시다」' + (sp >= 2 ? ' (웅변 ' + sp + ')' : ' (웅변 2 이상)'), value: 'mediate', icon: 'handshake', dis: sp < 2 },
      { label: '핼리에게 맡긴다', value: 'halley' }], me());
    if (h === 'mediate') {
      b.hooke = 'mediate'; fame('so', K().fame.mediate);
      await play([['hooke', '…흥. 증명은 그쪽이 했다는 건 나도 아오. 한 줄이면 되오. 한 줄.'], ['newton', row() ? '…좋소. 본문 주석에 렌, 후크, 핼리가 각자 그 생각에 닿았다고 적겠소. 셋째 권도 그대로 두지.' : null], [null, row() ? null : '며칠 뒤 케임브리지에서 답장이 온다. 「본문 주석에 렌, 후크, 핼리의 이름을 적겠소. 셋째 권도 그대로.」']]);
    } else {
      b.hooke = 'halley';
      await play([['halley', '(제독에게 낮게) 걱정 마시오. 뉴턴 선생 성미는 내가 압니다. 편지를 열 통쯤 쓰면 마음을 돌리실 거요.']]);
    }
    var gotF = b.fund ? fame('so', K().fame.fund) : 0;
    log('런던 왕립 학회에서 핼리와 함께 뉴턴의 『프린키피아』 원고를 보았다.' + (b.fund === 'gold' ? ' 인쇄비 금화 ' + U.num(K().printFund) + '닢을 보탰다.' : b.fund === 'fish' ? ' 팔리지 않은 『물고기의 역사』를 사 주어 학회 금고를 채웠다.' : '') + (gotF ? ' (사교 명성 +' + gotF + ')' : ''));
    if (b.fund) UI.toast('『프린키피아』가 찍힌다 — 1687년 7월 5일, 초판이 제독에게 온다', 'book', 5600);
    await offer('(핼리를 통해 짧은 편지가 온다) 「선장 — 책이 나오면 나는 할 일이 없어질 거요. 조수와 달의 표를 바다에서 맞춰 보고 싶소. 자리가 있다면.」');
    refresh();
  }

  // ================================================================ ③ 주식의 나락 (1720, 런던)
  NT.price = function (t) {
    var P = K().price; t = t || today();
    if (t <= P[0][0]) return P[0][1];
    if (t >= P[P.length - 1][0]) return P[P.length - 1][1];
    for (var i = 1; i < P.length; i++) if (t <= P[i][0]) {
      var a = dayIdx(P[i - 1][0]), z = dayIdx(P[i][0]), x = dayIdx(t);
      return Math.round(P[i - 1][1] + (P[i][1] - P[i - 1][1]) * (x - a) / Math.max(1, z - a));
    }
    return P[P.length - 1][1];
  };
  function phase() { var t = today(); return t < 17200501 ? 'rise' : t < 17200901 ? 'top' : 'fall'; }
  function bubbleOpen() {
    var b = st(), s = S(); if (!b || cityNow() !== K().london) return false;
    var B = b.bubble, t = today();
    if (B.lastVisit === s.portVisit && s.portVisit != null) return false;
    if (t >= K().bubbleFrom && t <= K().bubbleTo) return true;
    return t > K().bubbleTo && B.shares > 0;   // 해가 지나도 들고 있으면 팔 수 있다
  }
  function value() { var B = st().bubble; return Math.round(B.shares * NT.price()); }
  async function bubble() {
    var b = st(), s = S(), B = b.bubble, p = NT.price(), ph = phase(), first = !b.bubbleSeen;
    b.met = 1; b.bubbleSeen = 1; B.lastVisit = s.portVisit;
    var late = today() > K().bubbleTo;
    await withPic('nt_bubble', '익스체인지 앨리 (1720)', function () { return play([
      [null, late ? '익스체인지 앨리의 커피집들은 이제 조용하다. 남해 회사 주식은 한 주 금화 ' + U.num(p) + '닢 언저리에서 꿈쩍도 않는다.' :
        '런던 익스체인지 앨리. 좁은 골목의 커피집마다 사람들이 미어터진다. 공작부인도, 하녀도, 목사도 「남해 회사」를 외친다. 칠판에 적힌 값 — 한 주 금화 ' + U.num(p) + '닢.'],
      first && !late ? ['broker', '남해 회사요, 선장! 남아메리카 무역을 독차지한 회사 — 은광과 노예와 설탕이 쏟아져 들어올 거요! 1월에 백이십팔이던 것이 보시오, 지금 ' + U.num(p) + '! 오늘 사면 내일 부자요!'] : null,
      !late && ph === 'rise' ? ['newton', (row() ? '(곁에서 낮게) ' : '(커피집 구석의 백발 노인 — 왕립 조폐국장 뉴턴이다) ') + '나도 조금 샀다가 벌써 팔았소. 이익을 꽤 남겼지. 이 값은 셈이 맞지 않소. 회사가 실제로 버는 돈으로는 이 값의 반의반도 안 나오오.'] : null,
      !late && ph === 'top' ? ['newton', (row() ? '(곁에서 초조하게) ' : '(커피집 구석의 뉴턴이 창백한 얼굴로 증서를 쥐고 있다) ') + '…내가 판 뒤로 값이 세 배가 됐소. 내 조카도, 하인도 부자가 됐는데 나만 바보가 됐지. 그래서 다시 샀소. 이번엔… 거의 전 재산을.'] : null,
      !late && ph === 'fall' ? ['newton', (row() ? '(곁에서 증서를 구기며) ' : '(텅 빈 커피집 구석에 뉴턴이 무너지듯 앉아 있다) ') + '나는 천체의 움직임은 계산할 수 있소. 하지만 사람들의 광기는 계산할 수 없었소. …이만 파운드요. 평생 모은 것이.'] : null
    ]); });
    var opts = [];
    if (!late) K().stake.forEach(function (amt) {
      var room = K().stakeMax - B.cost;
      opts.push({ label: '금화 ' + U.num(amt) + '닢어치를 산다 (한 주 ' + U.num(p) + ')', value: 'buy' + amt, icon: 'coin', dis: amt > s.player.gold || amt > room });
    });
    if (B.shares > 0) opts.push({ label: '가진 주식을 모두 판다 — ' + B.shares.toFixed(1) + '주 · 지금 값 금화 ' + U.num(value()) + ' (들인 돈 ' + U.num(B.cost) + ')', value: 'sell', icon: 'scales' });
    if (!late && ph === 'top' && !b.warned && !b.bubbleNewtonOk) opts.push({ label: '뉴턴을 말린다 — 「꼭대기에서 다시 사면 안 됩니다」' + (skill('speech') >= 3 ? ' (웅변 3)' : ' (웅변 3이면 귀담아듣는다)'), value: 'warn', icon: 'handshake' });
    opts.push({ label: '구경만 한다', value: 'watch' });
    var v = await UI.ask('남해 회사 주식 — 한 주 금화 ' + U.num(p) + '닢' + (B.shares ? ' · 가진 주식 ' + B.shares.toFixed(1) + '주' : ''), opts, me());
    if (/^buy/.test(v)) {
      var amt = +v.slice(3), fee = Math.round(amt * K().fee), sh = (amt - fee) / p;
      s.player.gold -= amt; B.shares += sh; B.cost += amt;
      log('익스체인지 앨리에서 남해 회사 주식 ' + sh.toFixed(1) + '주를 샀다. (한 주 ' + U.num(p) + ' · 금화 ' + U.num(amt) + ', 수수료 ' + U.num(fee) + ')');
      UI.toast('남해 회사 주식 ' + sh.toFixed(1) + '주를 샀다 — 지금 값어치 금화 ' + U.num(value()), 'coin', 5000);
    } else if (v === 'sell') {
      var gross = value(), fee2 = Math.round(gross * K().fee), net = gross - fee2, gain = net - B.cost;
      s.player.gold += net;
      log('남해 회사 주식 ' + B.shares.toFixed(1) + '주를 모두 팔았다. (한 주 ' + U.num(p) + ' · 금화 ' + U.num(net) + ' — ' + (gain >= 0 ? '이익 ' + U.num(gain) : '손해 ' + U.num(-gain)) + ')');
      UI.toast((gain >= 0 ? '남해 회사 주식을 팔아 이익 금화 +' + U.num(gain) : '남해 회사 주식을 팔아 손해 금화 −' + U.num(-gain)), gain >= 0 ? 'coin' : 'skull', 5600);
      B.sold = (B.sold || 0) + gain; B.shares = 0; B.cost = 0;
      if (gain < 0) await play([['newton', '…당신도 광기에 데었구려. 하늘은 셈이 맞는데, 사람은 셈이 맞지 않소.']]);
      else if (phase() !== 'fall') await play([['broker', '벌써 파시게요? 내일이면 두 배가 될 텐데! …뭐, 선장 마음이지요.']]);
    } else if (v === 'warn') {
      b.warned = 1;
      if (skill('speech') >= 3) { b.bubbleNewtonOk = 1; await play([['newton', '(한참 말없이 칠판을 보다가) …당신 말이 옳소. 셈은 처음부터 맞지 않았지. 산 것의 절반은 오늘 팔겠소. 나머지 절반은… 내 어리석음의 값으로 남겨 두지.']]); log('익스체인지 앨리에서 남해 회사 주식에 다시 뛰어든 뉴턴을 말렸다. 뉴턴은 절반을 팔았다.'); }
      else await play([['newton', '선장, 당신은 바다를 알지 셈은 모르오. 이 값은 아직 오르오. 모두가 그렇게 말하잖소.']]);
    }
    // 무너진 뒤에는 동료 제안
    if (!late && phase() === 'fall' && today() >= 17200920 && !row() && !gone()) await offer('…선장. 이 도시에 있으면 숨이 막히오. 남은 날은 사람이 아니라 별과 바다를 셈하고 싶소. 경도를 재는 일 — 의회가 상금을 걸었지만 아무도 못 푼 문제요. 당신 배에서라면 달의 표를 바다 위에서 맞춰 볼 수 있을 거요. 늙은이 하나 태워 주겠소?');
    refresh();
  }

  // ================================================================ 하루 — 초판이 온다 · 뉴턴의 죽음 · 소식
  NT.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today();
    if (b.fund && !b.got && t >= NEWS_AT.principia) {
      b.got = 1;
      var ok = R.addItem ? R.addItem('principia') : false;
      out.push({ icon: 'book', history: true, text: '【『프린키피아』 초판】 런던에서 상자 하나가 왔다. 핼리의 편지와 함께 『자연철학의 수학적 원리』 초판 한 질. 속표지에 「인쇄를 도운 바다의 벗에게 — I. N.」' + (ok === false ? ' (소지품이 가득 차 책은 런던 학회에 맡겨 두었다)' : '') });
    }
    if (row() && t >= K().death) {
      var i = -1; s.mates.forEach(function (x, k) { if (x.id === ID) i = k; });
      if (i >= 0) { s.mates.splice(i, 1); s.flags['gone_' + ID] = 1; if (R.tidyCaptains) R.tidyCaptains(); }
      b.told.death = 1;
      out.push({ icon: 'skull', history: true, text: '【뉴턴의 죽음】 아이작 뉴턴이 여든넷의 나이로 세상을 떠났다. 마지막 항해를 마치고 런던에 내린 지 며칠 만이었다. 그는 웨스트민스터 사원에 묻힌다. 배에 남은 그의 공책에는 달의 표와 조수 시각이 빼곡하다 — 「나는 바닷가에서 노는 아이였을 뿐, 진리의 큰 바다는 내 앞에 고스란히 놓여 있었다.」' });
      log('아이작 뉴턴이 세상을 떠나 배를 떠났다.');
    }
    if (!b.met) return out;
    var told = b.told;
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('principia', true, 'book', '【『프린키피아』】 아이작 뉴턴의 『자연철학의 수학적 원리』가 런던에서 나왔다. 사과를 떨어뜨리는 힘과 달을 붙잡아 두는 힘이 같은 힘이라는 것, 그 힘이 거리의 제곱에 반비례한다는 것. 행성도 혜성도 밀물과 썰물도 한 법칙을 따른다.' + (b.moon ? ' 울즈소프 과수원의 그 물음 — 「달은 왜 떨어지지 않는가」의 답이다.' : ''));
    news('mint', true, 'coin', '【조폐국장 뉴턴】 아이작 뉴턴이 왕립 조폐국장이 되었다. 그는 가짜 돈 만드는 자들을 직접 쫓아 교수대로 보낸다.');
    news('royal', true, 'book', '【왕립 학회장】 뉴턴이 왕립 학회장이 되었다. 오랜 맞수 후크가 세상을 떠난 이듬해다.');
    news('knight', true, 'crown', '【아이작 경】 앤 여왕이 케임브리지에서 뉴턴에게 기사 작위를 내렸다. 학문으로 작위를 받은 첫 사람이다.');
    news('longitude', true, 'compass', '【경도법】 잉글랜드 의회가 바다 위에서 경도를 재는 방법에 큰 상금을 걸었다 — 오차가 반 도 안이면 이만 파운드. 뉴턴은 의회에서 「좋은 시계나 달의 표가 아니면 불가능하다」고 말했다. 뱃사람들의 오랜 숙제다.');
    news('crash', true, 'skull', '【남해 회사의 붕괴】 한 주 천 파운드를 넘던 남해 회사 주식이 석 달 만에 백오십으로 곤두박질쳤다. 런던의 공작도 하녀도 빈털터리가 되었고, 회사 이사들은 의회로 끌려간다.' + (b.bubbleNewtonOk ? ' 뉴턴은 한 선장의 말을 듣고 절반을 팔아 둔 덕에 그나마 덜 잃었다고 한다.' : ' 뉴턴도 이만 파운드를 잃었다 — 「나는 천체의 움직임은 계산할 수 있지만, 사람들의 광기는 계산할 수 없다.」'));
    news('death', !row(), 'skull', '【뉴턴의 죽음】 아이작 뉴턴이 여든넷의 나이로 런던에서 세상을 떠났다. 그는 웨스트민스터 사원에 묻힌다. 「내가 더 멀리 보았다면, 그것은 거인들의 어깨 위에 서 있었기 때문이다.」');
    return out;
  };

  // ================================================================ 도시에 들어설 때 · 수첩
  NT.pending = function () { var s = S(); if (!s || cityNow() !== K().london) return false; return prinOpen() || bubbleOpen() || offerOpen(); };
  NT.check = async function () {
    if (NT._busy) return false; NT._busy = true;
    try {
      if (prinOpen()) await principia();
      else if (bubbleOpen()) await bubble();
      else if (offerOpen()) await offer('(조폐국 서재에서 노인이 고개를 든다) 다시 왔구려, 선장. 이 늙은이를 아직 바다에 데려갈 생각이 있소? 달의 표를 바다 위에서 맞춰 보고 싶소.');
    } catch (e) { console.error(e); }
    NT._busy = false;
    return true;
  };
  NT.html = function () {
    var s = S(), b = s && s.newton, t = today(), li = [];
    if (!b) return '';
    if (b.fund && !b.got) li.push('1687년 7월 5일 『프린키피아』 초판이 온다');
    if (b.bubble && b.bubble.shares > 0) li.push('남해 회사 주식 ' + b.bubble.shares.toFixed(1) + '주 — 지금 값 금화 ' + U.num(value()) + ' (들인 돈 ' + U.num(b.bubble.cost) + ') · 런던에서 팔 수 있다');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">아이작 뉴턴</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._newtonHtml) { G.Court._newtonHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + NT.html(); }; }
  (function hookDaily() {
    var W = G.World; if (!W || W._newton) return;
    W._newton = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(NT.daily()); } catch (e) { console.error(e); } return out; };
  })();
  NT._t = { apple: apple, principia: principia, bubble: bubble, offer: offer };
})(window.G = window.G || {});
