/* 무굴 제국의 성립 — 카불의 왕, 힌두스탄으로 (G.Mughal) 2026-10-28 사용자 요청 「무굴 제국 성립 이벤트」
   티무르와 칭기즈 칸의 핏줄을 이은 바부르가 고향 사마르칸트를 잃고 카불의 왕이 되었다가, 1526년 파니파트에서 델리의 술탄 이브라힘 로디를 무너뜨리고
   인도에 무굴 제국을 세운다. 승부를 가른 것은 오스만식 화포와 수레 진(아라바)이었다 — 바다에서 총포를 싣고 오는 제독이 끼어들 자리가 있다.
   역사는 바뀌지 않는다. 바뀌는 것은 제독이 누구에게 총을 팔았고, 누구 곁에 섰는가다. (사람: js/data/mughal.js)
   ■ 흐름
     ① 디우의 포술장 (1519~1526년 3월, 디우 항): 바부르의 포술장 우스타드 알리 쿨리가 프랑크의 총과 대포를 사 모은다.
        짐칸의 총(10정 이상)이나 대포(3문 이상)를 웃돈(premium배)을 받고 팔면 「바부르의 벗」 — 1526년 봄 델리로 오라고 한다.
     ① 카불의 정원 (1504년 11월~1525년 11월, 카불): 바부르를 직접 만난다 — 정원과 멜론, 회고록. 총포를 팔면 마찬가지로 「바부르의 벗」.
     ② 델리의 술탄 (1517~1526년 4월 10일, 델리): 이브라힘 로디의 궁정. 바부르의 벗이 아니면 술탄에게 총포를 팔아 「로디 편」이 될 수 있다.
     ③ 파니파트 (1526년 3월~4월 21일, 델리): 바부르의 벗 — 수레 진 뒤에서 화포로 술탄의 대군과 코끼리를 맞는다 (육상전) /
        로디 편 — 술탄의 진에서 바부르의 화포를 맞고, 두 차례를 버티면 빠져나온다 (퇴각 판) / 그 밖에는 언덕에서 지켜본다.
     ④ 새 황제 (1526년 4월 27일~1530년 12월, 델리 — 누구나): 바부르가 델리에서 파디샤로 선포된다. 후마윤이 「빛의 산」 금강석 이야기를 한다.
        바부르의 벗이면 회고록 한 장(babur_page)과 델리 궁정의 신뢰, 로디 편이었어도 바부르는 너그럽게 맞는다.
     소식 (만난 사람만): 파니파트 · 이브라힘의 어머니의 독(1526.12) · 칸와 전투(1527.3) · 바부르의 죽음과 목숨을 바꾼 기도(1530.12) ·
           카나우지에서 셰르 샤에게 진 후마윤(1540.5) · 후마윤의 귀환(1555.7) · 열세 살 악바르와 제2차 파니파트(1556.11)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/mughal_*.webp — images/legend-events/MUGHAL_PROMPT.md
   ■ 저장: s.mughal = { side: 'babur'|'lodi', met, sold, kabul, court, panipat: 'win'|'lose'|'fled'|'watch', crown, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var MG = G.Mughal = {};
  var DIU = 148, DELHI = 145, KABUL = 136;
  var K = MG.K = {
    aliFrom: 15190101, aliTo: 15260331, kabulFrom: 15041101, kabulTo: 15251116, courtFrom: 15170101, courtTo: 15260410,
    battleFrom: 15260301, battleTo: 15260421, crownFrom: 15260427, crownTo: 15301225,
    guns: 10, cannon: 3, buyMax: { guns: 60, cannon: 12 }, premium: 2.5, lodiPremium: 2.0,
    share: 12000, lodiArmy: 150, baburArmy: 110, hold: 2
  };
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  // 이미 지난 소식은 알린 것으로 친다 (옛 저장·늦게 시작한 판)
  var NEWS = ['panipat', 'poison', 'khanwa', 'baburDies', 'kannauj', 'return', 'akbar'];
  var NEWS_AT = { panipat: 15260421, poison: 15261221, khanwa: 15270317, baburDies: 15301226, kannauj: 15400517, 'return': 15550723, akbar: 15561105 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.mughal) {
      s.mughal = { told: {} };
      NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.mughal.told[k] = 1; });
    }
    s.mughal.told = s.mughal.told || {};
    return s.mughal;
  }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l) continue; await UI.say(l[1], l[0] === 'P' ? me() : l[0] ? H(l[0]) : {}); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title) || { stop: function () { return Promise.resolve(); } }; try { return await fn(); } finally { await pc.stop(); } }
  function hint(id) { if (G.Disc && G.DISC && G.DISC[id] && !G.Disc.foundByMe(id) && G.Disc.addHint) G.Disc.addHint(id, 'lead:mughal'); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function delhiTrust(n) { if (G.Sponsor && G.SPONSOR && G.SPONSOR.in_delhi) { var r = G.Sponsor.rel('in_delhi'); G.Sponsor.addTrust(r, n); } }

  // ---------------------------------------------------------------- 총포 거래
  function qty(id) { var c = S().fleet.cargo || {}; return c[id] ? c[id].q || 0 : 0; }
  /** 짐칸의 총·대포 가운데 사 줄 만큼 (조건에 모자라면 0) */
  MG.arms = function () { var g = qty('guns'), c = qty('cannon'); return { guns: g >= K.guns ? Math.min(g, K.buyMax.guns) : 0, cannon: c >= K.cannon ? Math.min(c, K.buyMax.cannon) : 0 }; };
  function armsOk() { var a = MG.arms(); return a.guns > 0 || a.cannon > 0; }
  function armsText(a) { return [a.guns ? '총 ' + a.guns + '정' : '', a.cannon ? '대포 ' + a.cannon + '문' : ''].filter(Boolean).join(' · '); }
  function armsPrice(a, k) { return Math.round(((a.guns || 0) * G.GOOD.guns.p + (a.cannon || 0) * G.GOOD.cannon.p) * k); }
  function sellArms(a, k) {
    var c = S().fleet.cargo, gold = armsPrice(a, k);
    ['guns', 'cannon'].forEach(function (id) { var n = a[id] || 0; if (!n || !c[id]) return; c[id].q -= n; if (c[id].q <= 0) delete c[id]; });
    S().player.gold += gold;
    return gold;
  }

  // ================================================================ 날마다 — 소식 (만난 사람만)
  MG.daily = function () {
    var b = st(), out = []; if (!b || !b.met) return out;
    var t = today(), told = b.told;
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('panipat', !b.panipat, 'cannon', '【파니파트】 델리 북쪽 파니파트 들판에서 바부르의 군대가 이브라힘 로디의 대군을 무너뜨렸다. 수레를 쇠사슬로 이은 진 뒤에서 우스타드 알리 쿨리의 대포가 불을 뿜자, 술탄의 코끼리들이 놀라 제 편을 짓밟았다고 한다. 술탄은 싸움터에서 죽었다.');
    news('poison', true, 'skull', '【아그라의 독】 아들을 잃은 이브라힘 로디의 어머니가 궁정 요리사를 매수해 바부르의 음식에 독을 탔다. 바부르는 며칠을 앓고 일어나 회고록에 「죽음의 맛을 보았다」고 적었다 한다.');
    news('khanwa', true, 'cannon', '【칸와】 메와르의 라나 상가가 라지푸트 연합군을 이끌고 바부르에게 맞섰다. 바부르는 술잔을 깨뜨리고 다시는 술을 마시지 않겠다고 맹세한 뒤, 또다시 수레 진과 화포로 이겼다. 이제 힌두스탄의 북쪽은 바부르의 것이다.');
    news('baburDies', true, 'skull', '【바부르의 죽음】 아들 후마윤이 열병으로 죽어 가자, 바부르는 그 침상 둘레를 세 번 돌며 「내 목숨을 가져가고 아들을 살려 주소서」 하고 빌었다고 한다. 후마윤은 일어났고, 바부르는 몇 달 뒤 아그라에서 숨을 거두었다. 그의 몸은 그가 사랑한 카불의 정원에 묻힌다.');
    news('kannauj', true, 'scroll', '【카나우지】 아프간의 셰르 샤 수르가 갠지스 강가 카나우지에서 후마윤을 크게 이겼다. 무굴의 황제는 나라를 잃고 페르시아로 달아났다. 셰르 샤는 길을 닦고 역참을 세우고 은화 「루피」를 찍는다.');
    news('return', true, 'castle', '【후마윤의 귀환】 열다섯 해를 떠돌던 후마윤이 페르시아 샤의 도움으로 군대를 이끌고 돌아와 델리를 되찾았다.');
    news('akbar', true, 'cannon', '【제2차 파니파트】 후마윤이 서고(書庫) 계단에서 굴러 세상을 떠나고, 열세 살 아들 악바르가 섭정 바이람 칸과 함께 다시 파니파트 들판에서 헤무의 군대를 꺾었다. 무굴 제국은 이제 흔들리지 않는다.');
    return out;
  };

  // ================================================================ ① 디우의 포술장 (1519~1526.3)
  function aliOpen() { var b = st(), t = today(); return !!(b && !b.sold && b.side !== 'lodi' && cityNow() === DIU && t >= K.aliFrom && t <= K.aliTo && !(b.aliSeen && !armsOk())); }
  async function aliQuli() {
    var b = st(); b.met = 1;
    await withPic('mughal_gunner', '디우의 포술장', function () { return play([
      [null, '디우의 부둣가 화약 창고 앞. 화약에 그을린 얼굴의 사내가 오스만식 붉은 모자를 쓰고, 상인들이 내놓은 화승총을 하나하나 귀에 대고 쇠를 두드려 본다.'],
      ['aliquli', '나는 우스타드 알리 쿨리, 카불의 왕 바부르 폐하의 포술장이오. 이스탄불의 대포 주조장에서 일을 배웠지. 폐하께서는 힌두스탄으로 내려갈 날을 기다리시오.'],
      ['aliquli', '델리의 술탄은 코끼리 천 마리를 가졌다지. 코끼리는 칼로는 못 막아도, 대포 소리에는 놀라 날뛴다오. 폐하의 군대는 겨우 일만 남짓 — 화포와 총이 더 필요하오.'],
      ['aliquli', '프랑크 사람의 총은 가볍고 잘 맞는다고 들었소. 그대 배에 총이나 대포가 있다면, 값은 넉넉히 치르겠소.']
    ]); });
    b.aliSeen = 1;
    return offerArms('aliquli', 'ali');
  }
  /** 총포를 팔지 묻는다 — 팔면 바부르의 벗 */
  async function offerArms(who, where) {
    var b = st(), a = MG.arms();
    if (!armsOk()) {
      await play([[who, '총이 열 정, 아니면 대포가 세 문은 있어야 거래를 하지. 다음에 다시 오시오. 내년 봄이 되기 전에.']]);
      UI.toast('바부르의 사람들이 총포를 산다 — 총 ' + K.guns + '정 또는 대포 ' + K.cannon + '문 이상 (1526년 봄까지)', 'cannon', 5200);
      return;
    }
    var gold = armsPrice(a, K.premium);
    var v = await UI.ask((who === 'babur' ? '바부르' : '알리 쿨리') + U.jx(who === 'babur' ? '바부르' : '알리 쿨리', '이/가') + ' 짐칸의 ' + armsText(a) + U.jx(armsText(a), '을/를') + ' 금화 ' + U.num(gold) + '닢에 사겠다고 한다. (시세의 ' + K.premium + '배)', [
      { label: '판다 — 금화 ' + U.num(gold) + '닢', value: 'sell', icon: 'coin' },
      { label: '남의 나라 싸움에 총을 대지 않겠다', value: 'no' }], me());
    if (v !== 'sell') { if (where === 'ali') await play([['aliquli', '…아쉽군. 그래도 마음이 바뀌면 봄이 오기 전에 오시오.']]); return; }
    var got = sellArms(a, K.premium);
    b.sold = where; b.side = 'babur';
    await play([
      [who, who === 'babur' ? '좋다! 바다의 손님은 말보다 셈이 빠르구나. 내 회고록에 그대의 배 이야기를 적어 두겠다.' : '좋은 쇠요. 폐하께서 기뻐하실 거요. 수레 칠백 대를 쇠사슬로 이어 진을 치고, 그 틈마다 이 총을 세울 것이오.'],
      [who, '봄이 되면 우리는 펀자브를 지나 델리로 내려간다. 1526년 3월에서 4월, 델리로 오시오. 파니파트 들판에서 그대의 총이 어떻게 우는지 보여 주겠소.']
    ]);
    G.State.log((where === 'ali' ? '디우에서 바부르의 포술장 우스타드 알리 쿨리' : '카불에서 바부르') + '에게 ' + armsText(a) + U.jx(armsText(a), '을/를') + ' 금화 ' + U.num(got) + '닢에 팔았다. 1526년 봄 델리로 오라고 한다.');
    UI.toast('바부르의 벗 — 금화 +' + U.num(got) + ' · 1526년 3~4월 델리로', 'cannon', 6000);
    refresh();
  }

  // ================================================================ ① 카불의 정원 (1504.11~1525.11)
  function kabulOpen() { var b = st(), t = today(); return !!(b && !b.kabul && b.side !== 'lodi' && cityNow() === KABUL && t >= K.kabulFrom && t <= K.kabulTo); }
  async function kabul() {
    var b = st(), t = today(); b.met = 1; b.kabul = 1;
    await withPic('mughal_garden', '카불의 정원', function () { return play([
      [null, '카불 성 아래, 물길이 넷으로 나뉘어 흐르는 네모난 정원. 석류나무와 플라타너스 그늘에서 다부진 사내가 무릎에 책을 펴 놓고 무언가를 적고 있다. 곁에는 노란 멜론이 쪼개져 있다.'],
      ['babur', '바다를 건너온 손님이로군. 앉으시오. 이 멜론을 드시오 — 힌두스탄에는 이런 멜론이 없다더군. 나는 바부르, 티무르의 다섯째 대손이고 어머니 쪽으로는 칭기즈 칸의 핏줄이오.'],
      ['babur', t < 15120101 ? '나는 열한 살에 페르가나의 왕이 되었고, 사마르칸트를 두 번 얻었다가 두 번 잃었소. 우즈베크의 샤이바니 칸에게 쫓겨 이 산속 카불까지 왔지. …그래도 이 정원은 내 것이오.'
        : '사마르칸트를 세 번 얻었다가 세 번 잃었소. 북쪽 길은 우즈베크가 막고 있지. 그렇다면 남쪽이오 — 내 조상 티무르가 한 번 다녀간 힌두스탄.'],
      ['babur', t >= 15230101 ? '라호르의 다울라트 칸 로디가 사람을 보내왔소. 델리의 술탄 이브라힘이 귀족들을 의심하여 죽이고 가두니, 와서 그를 끌어내려 달라고. …때가 왔는지도 모르겠소.' : '나는 이 책에 내가 본 모든 것을 적소. 새, 꽃, 강, 사람, 그리고 내가 한 어리석은 짓까지. 왕의 회고록치고는 솔직하지.'],
      ['humayun', t >= 15200101 ? '(곁에서 별자리 그림을 펼치며) 아버지, 이 손님의 배는 별을 보고 바다를 건넌다지요? 저도 언젠가 바다를 보고 싶습니다.' : null]
    ].filter(function (l) { return l && l[1]; })); });
    if (t <= K.aliTo) await offerArms('babur', 'kabul');
    else { var so = G.Fame.add('so', 40); G.State.log('카불의 정원에서 바부르를 만났다. (사교 명성 +' + so + ')'); }
    hint('baburnama');
    refresh();
  }

  // ================================================================ ② 델리의 술탄 (1517~1526.4.10)
  function courtOpen() { var b = st(), t = today(); return !!(b && !b.court && cityNow() === DELHI && t >= K.courtFrom && t <= K.courtTo); }
  async function court() {
    var b = st(), t = today(); b.met = 1; b.court = 1;
    await withPic('mughal_sultan', '델리의 술탄', function () { return play([
      [null, '델리의 궁정. 코끼리 떼가 줄지어 문을 지난다. 비단 휘장 아래 루비 박힌 터번을 쓴 술탄이 아프간 귀족들을 내려다본다. 귀족들의 얼굴이 어둡다.'],
      ['ibrahim', '바다 건너 프랑크의 상인이라고? 내 아버지 시칸다르는 아프간 귀족들을 형제처럼 대했지. 나는 다르다. 술탄은 하나요, 나머지는 모두 신하다. …그래서들 저렇게 얼굴이 어둡지.'],
      ['ibrahim', t >= 15230101 ? '라호르의 다울라트 칸이 카불의 거지 왕 바부르에게 편지를 보냈다더군. 산속의 몇천 기병이 내 코끼리 천 마리와 군사 십만을 어찌하겠나? 하하!' : '북쪽 산 너머에 티무르의 후손이라는 떠돌이 왕이 있다지. 사마르칸트도 못 지킨 자가 감히 힌두스탄을 넘보겠나.']
    ]); });
    var opts = [];
    if (b.side !== 'babur' && armsOk()) { var a = MG.arms(); opts.push({ label: '술탄에게 ' + armsText(a) + U.jx(armsText(a), '을/를') + ' 판다 (금화 ' + U.num(armsPrice(a, K.lodiPremium)) + '닢)', value: 'sell', icon: 'coin' }); }
    opts.push({ label: '「코끼리는 대포 소리에 놀랍니다」 — 술탄에게 귀띔한다', value: 'warn' }, { label: '고개를 숙이고 물러난다', value: 'leave' });
    var v = await UI.ask('델리의 술탄 이브라힘 로디' + (b.side === 'babur' ? ' — 제독은 이미 바부르에게 총을 팔았다' : ''), opts, me());
    if (v === 'sell') {
      var a2 = MG.arms(), got = sellArms(a2, K.lodiPremium);
      b.side = 'lodi'; b.sold = 'lodi';
      await play([['ibrahim', '좋다, 프랑크의 쇠는 사 두지. 쓸 일은 없겠지만. 그대도 봄에 델리에 있다면 내 진에서 구경이나 하게. 거지 왕이 코끼리 발에 밟히는 것을.']]);
      G.State.log('델리에서 술탄 이브라힘 로디에게 ' + armsText(a2) + U.jx(armsText(a2), '을/를') + ' 금화 ' + U.num(got) + '닢에 팔았다.');
      UI.toast('로디 편 — 금화 +' + U.num(got) + ' · 1526년 3~4월 델리', 'coin', 5600);
    } else if (v === 'warn') {
      b.warned = 1;
      await play([['ibrahim', '코끼리가 쇠 막대기 소리에 놀란다고? 내 코끼리들은 전쟁터에서 자랐다. 이방인의 걱정은 고맙지만, 술탄의 코끼리를 우습게 보지 마라.'], [null, '술탄은 웃었지만, 뒤에 선 늙은 아프간 귀족 하나가 제독을 오래 바라보았다.']]);
      var so = G.Fame.add('so', 30); G.State.log('델리에서 술탄 이브라힘 로디에게 대포 이야기를 귀띔했지만 웃어넘겼다. (사교 명성 +' + so + ')');
    } else G.State.log('델리에서 술탄 이브라힘 로디의 궁정을 보았다. 귀족들의 얼굴이 어두웠다.');
    refresh();
  }

  // ================================================================ ③ 파니파트 (1526.3~4.21)
  function battleOpen() { var b = st(), t = today(); return !!(b && b.side && !b.panipat && cityNow() === DELHI && t >= K.battleFrom && t <= K.battleTo); }
  async function battle() {
    var b = st(), s = S();
    if (b.side === 'babur') {
      await withPic('mughal_panipat', '파니파트 (1526.4.21)', function () { return play([
        [null, '델리 북쪽 파니파트 들판. 바부르의 진 앞에 수레 칠백 대가 생가죽 밧줄과 쇠사슬로 이어져 성벽처럼 늘어서 있다. 수레 사이사이 틈마다 대포와 화승총이 고개를 내밀었다.'],
        ['aliquli', '왔군, 바다의 벗! 그대가 판 총이 저기 수레 틈에 서 있소. 오늘은 대포가 말할 차례요.'],
        ['babur', '저 너머가 술탄의 군대다. 군사 십만에 코끼리 천. 우리는 그 열 분의 하나. …하지만 저들은 한 덩어리로 밀려올 뿐이고, 우리는 둘레를 감싼다. 우즈베크에게 배운 「툴루그마」다. 양 날개의 기병이 돌아 들어가 뒤를 친다.'],
        ['babur', '바다의 벗이여, 그대와 그대 사람들은 가운데 수레 진을 맡아 다오. 코끼리가 오거든 알리 쿨리의 대포가 울릴 때까지 버텨라.']
      ]); });
      var r = await fight('이브라힘 로디의 대군', K.lodiArmy, { guns: true, leader: '술탄 이브라힘 로디' });
      b.panipat = r === 'win' ? 'win' : 'lose';
      if (r === 'win') {
        s.player.gold += K.share; var bt = G.Fame.add('bt', 300);
        await play([
          [null, '대포 소리에 놀란 코끼리들이 돌아서서 제 편을 짓밟았다. 양 날개로 돌아 들어간 기병이 뒤를 치자 술탄의 대군은 들판 한가운데서 갇혔다. 해가 중천에 오르기 전에 싸움은 끝났다.'],
          ['babur', '술탄 이브라힘이 쓰러졌다. 그의 주검 둘레에 오륙천의 군사가 함께 누워 있었다. …적이지만 용감하게 죽었다. 그를 정중히 묻어 주어라.'],
          ['babur', '바다의 벗, 이것은 그대의 몫이다. 델리의 보물 창고 열쇠를 받은 날, 나는 그대의 이름을 회고록에 적을 것이다.']
        ]);
        G.State.log('파니파트 들판에서 바부르의 수레 진을 지키며 이브라힘 로디의 대군을 물리쳤다. (금화 +' + U.num(K.share) + ' · 전투 명성 +' + bt + ')');
        UI.toast('파니파트 승리 — 금화 +' + U.num(K.share), 'cannon', 5200);
      } else {
        var bt2 = G.Fame.add('bt', 80);
        await play([[null, '코끼리의 첫 돌격에 제독의 사람들이 수레 뒤로 밀려났다. 그러나 곧 알리 쿨리의 대포가 연달아 울리고, 바부르의 기병이 양 날개로 돌아 들어갔다. 해가 중천에 오르기 전에 술탄의 대군은 무너졌다.'],
          ['babur', '다친 사람이 많구나. 그래도 그대의 수레는 끝까지 무너지지 않았다.']]);
        G.State.log('파니파트 들판에서 바부르의 편에 섰다. 술탄 이브라힘 로디가 쓰러졌다. (전투 명성 +' + bt2 + ')');
      }
      delhiTrust(10);
    } else {
      await withPic('mughal_panipat', '파니파트 (1526.4.21)', function () { return play([
        [null, '파니파트 들판. 술탄의 진은 지평선 끝까지 이어져 있다. 금 장식을 한 코끼리 떼가 앞줄에 서고, 그 뒤로 끝없는 보병과 기병.'],
        ['ibrahim', '프랑크 상인, 왔는가. 그대가 판 총도 저기 있다. 오늘 저 산적 떼를 짓밟고 나면 델리의 잔치에 그대를 부르마. 앞으로!'],
        [null, '술탄의 대군이 한 덩어리로 밀려 나간다. 그런데 저쪽 들판에는 수레가 성벽처럼 늘어서 있고, 수레 틈마다 검은 쇠 주둥이가 보인다.']
      ]); });
      await play([[null, '쾅— 첫 대포 소리에 코끼리들이 귀를 펄럭이며 돌아섰다. 비명과 흙먼지. 술탄의 진이 제 코끼리에 짓밟힌다. 제독의 사람들 앞으로도 바부르의 기병이 돌아 들어온다!']]);
      var r2 = await fight('바부르의 화포와 기병', K.baburArmy, { guns: false, hold: K.hold, flee: false, leader: '후마윤', noSpecial: true });   // 바부르의 군대에는 코끼리가 없다
      b.panipat = 'fled';
      await play([[null, r2 === 'win' ? '제독의 사람들은 겨우 포위를 뚫고 들판을 빠져나왔다. 뒤를 돌아보았을 때, 술탄의 깃발은 보이지 않았다.' : '제독의 사람들은 흩어져 겨우 들판을 빠져나왔다. 술탄의 깃발은 쓰러지고 없었다.'],
        [null, '그날 저녁 소식이 퍼졌다. 술탄 이브라힘 로디는 싸움터에서 죽었다. 델리 술탄국은 끝났다.']]);
      G.State.log('파니파트에서 술탄 이브라힘 로디의 진에 섰다가 바부르의 화포에 무너진 싸움터를 빠져나왔다.');
    }
    refresh();
  }
  /** 도시 안에서 뭍의 싸움 — 함대의 선원으로 (js/systems/incafall.js 와 같은 방식) */
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, n, false, Object.assign({ kind: 'garrison' }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  // 파니파트 날을 놓쳤다 — 그 편이었어도 싸움은 끝났다
  function missedBattle() { var b = st(), t = today(); if (b && b.side && !b.panipat && t > K.battleTo) b.panipat = 'missed'; }

  // ================================================================ ④ 새 황제 (1526.4.27~1530.12.25)
  function crownOpen() { var b = st(), t = today(); return !!(b && !b.crown && cityNow() === DELHI && t >= K.crownFrom && t <= K.crownTo); }
  async function crown() {
    var b = st(), s = S(), ally = b.side === 'babur'; b.met = 1; b.crown = 1;
    await withPic('mughal_crown', '델리의 새 황제 (1526)', function () { return play([
      [null, '델리의 금요 모스크. 설교자가 새 군주의 이름으로 기도를 올린다 — 「자히르 웃딘 무함마드 바부르 파디샤」. 사람들은 이 이름을 처음 듣는다. 티무르의 후손들, 무굴 사람들의 나라가 힌두스탄에 섰다.'],
      ['babur', ally ? '바다의 벗! 그대도 이 날을 보는구나. 힌두스탄은 크고 부유하다. 금도 많고 일꾼도 많지. …허나 정원이 없다. 흐르는 물도, 시원한 바람도, 좋은 멜론도 없다. 나는 여기에 카불의 정원을 짓겠다.'
        : b.side === 'lodi' ? '파니파트에서 술탄의 진에 섰던 프랑크 사람이 그대인가. 겁낼 것 없다. 나는 이브라힘의 어머니도 내 어머니처럼 모시고 있다. 싸움이 끝나면 칼을 거둔다 — 그것이 티무르 집안의 법이다.'
        : '바다를 건너온 손님인가. 힌두스탄은 크고 부유하지만 정원이 없다. 흐르는 물도, 좋은 멜론도. 나는 여기에 카불의 정원을 짓겠다.'],
      ['humayun', '아그라 성을 받던 날, 괄리오르 왕가 사람들이 목숨을 지켜 준 답례로 금강석 하나를 내게 주었습니다. 달걀만 한 돌인데, 값을 매기면 온 세상이 이틀 먹고 살 만하다더군요. 아버지께 바쳤더니 도로 제게 주셨습니다.'],
      ['babur', '돌은 돌일 뿐이다, 아들아. 남쪽 크리슈나 강가 광산에서 나왔다더군. 그런 돌보다 사람을 얻어라.']
    ]); });
    hint('kohinoor'); hint('baburnama');
    if (ally) {
      var got = R.addItem ? R.addItem('babur_page') : false;
      delhiTrust(20); var so = G.Fame.add('so', 200);
      await play([['babur', '이것을 가져가라. 내 회고록의 한 장이다. 파니파트 이야기 옆에 그대의 배 이야기를 적어 두었다. 바다를 건너 그대 나라 사람들에게 보여 주어라 — 티무르의 후손은 은혜를 잊지 않는다고.']]);
      G.State.log('델리에서 무굴 제국의 첫 황제 바부르의 즉위를 보았다. 바부르가 회고록 한 장을 건넸다. (사교 명성 +' + so + ' · 델리 궁정의 신뢰)');
      UI.toast(got !== false ? '바부르의 회고록 한 장 · 델리 궁정의 신뢰 +20' : '소지품이 가득 차 회고록은 받지 못했다 · 델리 궁정의 신뢰 +20', 'scroll', 5600);
    } else {
      delhiTrust(b.side === 'lodi' ? 5 : 3); var so2 = G.Fame.add('so', 60);
      G.State.log('델리에서 무굴 제국의 첫 황제 바부르의 즉위를 보았다. (사교 명성 +' + so2 + ')');
    }
    refresh();
  }

  // ================================================================ 도시에 들어설 때 · 수첩
  MG.pending = function () { var s = S(); if (!s) return false; var c = cityNow(); if (c !== DIU && c !== DELHI && c !== KABUL) return false; missedBattle(); return aliOpen() || kabulOpen() || battleOpen() || courtOpen() || crownOpen(); };
  MG.check = async function () {
    if (MG._busy) return false; MG._busy = true;
    try {
      if (battleOpen()) await battle();
      else if (crownOpen()) await crown();
      else if (kabulOpen()) await kabul();
      else if (aliOpen()) await aliQuli();
      else if (courtOpen()) await court();
    } catch (e) { console.error(e); }
    MG._busy = false;
    return true;
  };
  MG.html = function () {
    var s = S(), b = s && s.mughal; if (!b || !b.side || b.panipat) return '';
    var t = today();
    var li = [t < K.battleFrom ? '1526년 3월~4월 21일, 델리로 — 파니파트 들판에서 ' + (b.side === 'babur' ? '바부르의 수레 진에 선다' : '술탄 이브라힘 로디의 진에 선다') : '4월 21일까지 델리로 — 파니파트 들판'];
    return '<div class="sep"></div><h4 style="margin:0 0 8px">' + (b.side === 'babur' ? '바부르의 벗 — 힌두스탄으로' : '델리의 술탄 — 북쪽의 침입자') + '</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._mughalHtml) { G.Court._mughalHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + MG.html(); }; }
  (function hookDaily() {
    var W = G.World; if (!W || W._mughal) return;
    W._mughal = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(MG.daily()); } catch (e) { console.error(e); } return out; };
  })();
  MG._t = { aliQuli: aliQuli, kabul: kabul, court: court, battle: battle, crown: crown };
})(window.G = window.G || {});
