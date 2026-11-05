/* 미남 항해사 — 유럽 (G.BeauxEU) 2026-11-05 사용자 요청 「미남 항해사가 나오는 형태로 이벤트를 추가해줘」 — 연애 없이 동료로만
   사람·동료·조정값: js/data/beauxeu.js (G.BALANCE.beauxEU). 큰 역사는 그대로다.
   ■ ① 다비드의 모델 (피렌체 30)
        ㉮ 작업장 (1501.9.13~1504.5.13): 버려진 거대한 대리석 「거인」을 깎는 스물여섯의 미켈란젤로. 돌팔매를 들고 몇 시간이고 서 있는 리보르노 어부의 아들 토마소.
           「돌팔매는 어깨에 걸치게 하시오」(조언 — 미켈란젤로가 투덜대며 받아들인다) / 토마소에게 바다 이야기를 해 준다 / 지켜본다
        ㉯ 광장으로 (1504.5.14~9.8, ㉮ 뒤): 마흔 사람이 나흘에 걸쳐 거인을 시뇨리아 광장으로 옮긴다. 밤마다 돌을 던지는 젊은이들 (실제 기록) —
           돌팔매 패를 막는다(육상전) / 말로 쫓는다(웅변) / 횃불만 지킨다 → 「이제 제 얼굴은 돌 속에 남았어요. 남은 몸은 바다로 가고 싶어요」 → 태운다 / 사양
   ■ ② 카니발의 곤돌라꾼 (베니스 29, 1572~1599년 1~2월): 가면 장인 체칠리아의 금박 모레타 가면이 카니발 밤에 사라지고, 레판토에서 노를 저은 곤돌라꾼 로렌초가 붙잡힌다.
        곤돌라로 진짜 도둑을 쫓는다(항해 — 따라잡으면 일기토, 놓치면 패거리와 육상전) / 「밤의 나리」에게 레판토의 공을 들어 변호한다(웅변)
        → 「운하는 너무 좁소. 레판토에서 본 바다가 잊히지 않소」 → 태운다 / 사양
   ■ 소식: 거인을 깎기 시작하다(1501.9.13) · 광장으로 옮겨진 거인(1504.5.18) · 다비드 제막(1504.9.8) — 작업장을 본 사람
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/bx_*.webp
   ■ 저장: s.beauxEU = { yard, giant, guard, tommaso, lorenzo, how, mask, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var BX = G.BeauxEU = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.beauxEU) || {}; }
  var FLORENCE = 30, VENICE = 29;
  var NEWS_AT = { gigante: 15010913, piazza: 15040518, unveil: 15040908 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.beauxEU) {
      s.beauxEU = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.beauxEU.told[k] = 1; });
    }
    if (!s.beauxEU.told) s.beauxEU.told = {};
    return s.beauxEU;
  }
  BX.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var WHO = { P: me, F: first, MI: function (e) { return mateSp('michelangelo', e); }, TO: function (e) { return mateSp('bx_tommaso', e); }, LO: function (e) { return mateSp('bx_lorenzo', e); } };
  var CROWD = { name: '광장의 구경꾼', lang: 3 };
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
  function join(id, c) { if (row(id) || !G.Legend || !G.Legend.join) return row(id); var m = G.Legend.join(id, G.CITY_DATA[c]); if (m) m.loyal = 85; return m; }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(6, Math.round(n)), false, Object.assign({ kind: 'bandit', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }

  // ================================================================ 소식
  BX.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!b.yard;
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('gigante', met, 'hammer', '【거인】 피렌체 대성당 작업장에서 스물여섯의 조각가 미켈란젤로가 사십 년 동안 버려져 있던 대리석 덩어리 「거인」을 깎기 시작했다. 다윗을 새긴다고 한다.');
    news('piazza', met, 'castle', '【광장의 거인】 대리석 다윗상이 나흘에 걸쳐 대성당 작업장에서 시뇨리아 광장으로 옮겨졌다. 마흔 사람이 나무 틀과 굴림대로 밀었다. 밤에 상에 돌을 던진 젊은이들이 붙잡혔다고 한다.' + (b.guard === 'win' || b.guard === 'talk' ? ' 그 밤 횃불을 들고 거인 곁을 지킨 이방인 선원들이 있었다는 말도 돈다.' : ''));
    news('unveil', met, 'star', '【다비드】 시뇨리아 광장의 다윗상이 마침내 모습을 드러냈다. 사람들은 돌 속에서 살아 나온 듯한 소년의 얼굴 앞에서 오래 말을 잃었다.' + (b.tommaso === 'ship' ? ' 모델이 누구냐고 묻는 사람들에게 작업장 인부들은 「바다로 갔다」고만 했다.' : ''));
    return out;
  };

  // ================================================================ ① ㉮ 작업장 (1501.9.13~1504.5.13)
  function yardOpen() { var b = st(), t = today(), k = K().tommaso || {}; return !!(b && !b.yard && cityNow() === FLORENCE && !row('bx_tommaso') && t >= k.from && t <= k.to); }
  async function yard() {
    var b = st(), mAboard = !!row('michelangelo');
    await withPic('bx_yard', '대성당 작업장의 거인 (1501~1504)', function () { return play([
      [null, '피렌체 대성당 뒤 작업장. 판자 울타리 안에 사람 키 세 배가 넘는 대리석 덩어리가 서 있다. 사십 년 전 누군가 깎다 버린, 사람들이 「거인」이라 부르는 돌이다.'],
      ['bx_overseer', '들어오지 마시오, 이방인. 미켈란젤로 선생은 누가 보는 걸 질색하오. …뭐, 밖에서 보는 것까지야.'],
      [null, '울타리 틈으로 보인다. 돌 앞의 나무 받침대 위에 한 청년이 서 있다. 웃통을 벗은 채, 왼손에 가죽 돌팔매를 늘어뜨리고, 고개를 살짝 돌려 먼 데를 본다. 곱슬머리에 대리석 가루가 앉아 반짝인다.'],
      [CROWD, '(울타리 밖의 아낙들이 수군댄다) 저 청년 좀 봐. 돌에서 나온 사람이 아니라 돌이 저 사람을 닮아 가는 거야.'],
      ['MI', (mAboard ? '(제독의 배에서 잠시 내려 작업장에 틀어박힌 조각가가 끌을 내려놓으며) ' : '(먼지투성이의 사내가 끌을 내려놓으며) ') + '움직이지 마라, 토마소! …그래, 그 눈이다. 골리앗을 보는 눈. 무섭지만 물러서지 않는 눈.'],
      ['TO', '(받침대에서 내려와 울타리로 다가와 웃는다) 리보르노에서 그물 깁던 놈이 어쩌다 다윗이 됐어요. 선생님이 생선 장터에서 저를 보시더니 「네 얼굴이 이 돌 속에 이미 있다」고 하셨거든요. …바다 냄새가 나네요, 손님. 선장이세요?']
    ]); });
    var v = await UI.ask('거인의 작업장', [
      { label: '「돌팔매는 어깨에 걸치게 하시오 — 싸우기 직전의 사내는 그렇게 쥐오」', value: 'sling', icon: 'feather' },
      { label: '토마소에게 바다 이야기를 들려준다', value: 'sea', icon: 'ship' },
      { label: '지켜본다', value: 'watch', icon: 'eye' }], me());
    b.yard = v;
    if (v === 'sling') {
      await play([
        ['MI', '(노려보다가 투덜거린다) 뱃사람이 조각을 가르치는군. …(한참 청년을 보더니) 토마소, 돌팔매를 왼쪽 어깨 위로. 끈은 등 뒤로 늘어뜨리고. 돌은 오른손에 쥐어 허벅지 옆에 숨겨라.'],
        ['MI', '…좋다. 싸움이 끝난 다윗은 많다. 나는 싸우기 직전의 다윗을 깎겠다. (제독에게 등을 돌린 채) 고맙다는 말은 안 하겠소.']
      ]);
      var yf = fame('so', 'yard'); log('피렌체 대성당 작업장에서 미켈란젤로의 「거인」을 보았다. 모델 토마소에게 돌팔매를 어깨에 걸치게 하라고 했더니 조각가가 투덜대며 받아들였다. (사교 명성 +' + yf + ')');
    } else if (v === 'sea') {
      await play([
        [null, '제독은 울타리 너머로 바다 이야기를 했다. 아프리카의 곶, 고래가 뿜는 물줄기, 별을 보고 길을 찾는 밤.'],
        ['TO', '(눈이 반짝인다) 아버지 배는 리보르노 앞바다를 벗어난 적이 없어요. 저는 늘 수평선 너머가 궁금했는데… 이 돌이 다 깎이면, 저는 어디로 가야 할까요.'],
        ['MI', '(등을 돌린 채) 토마소! 수평선은 나중에 봐라. 지금은 골리앗을 봐!']
      ]);
      log('피렌체 대성당 작업장에서 다윗상의 모델 토마소에게 바다 이야기를 들려주었다.');
    } else log('피렌체 대성당 작업장에서 미켈란젤로가 깎는 「거인」과 모델 토마소를 보았다.');
    refresh();
  }

  // ================================================================ ① ㉯ 광장으로 (1504.5.14~9.8)
  function giantOpen() { var b = st(), t = today(), k = K().tommaso || {}; return !!(b && b.yard && !b.giant && cityNow() === FLORENCE && !row('bx_tommaso') && t >= k.moveFrom && t <= k.moveTo); }
  async function giant() {
    var b = st(), k = K().tommaso || {};
    await withPic('bx_move', '광장으로 가는 거인 (1504.5)', function () { return play([
      [null, '밤. 대성당 작업장의 담이 헐리고, 나무 틀에 묶인 거인이 굴림대 위에 누워 있다. 마흔 사람이 밧줄을 당겨 하루에 몇십 걸음씩 시뇨리아 광장으로 민다. 나흘 길이다.'],
      ['TO', '(횃불 아래서 거인의 발치에 앉아 있다가 제독을 보고 일어선다) 선장님! 다 깎였어요. 저 얼굴, 보셨어요? …저는 저렇게 생기지 않았는데. 선생님은 제 얼굴에서 저걸 꺼내셨어요.'],
      [null, '그때 골목에서 휘파람 소리. 붉은 두건을 쓴 젊은이들이 돌팔매를 돌리며 나타난다.'],
      ['bx_slinger', '공화국의 거인이라고? 메디치를 쫓아낸 놈들이 세우는 거인이라면 우리가 먼저 돌팔매 맛을 보여 주지! 다윗이 돌을 던졌으니, 우리도 다윗한테 던진다!']
    ]); });
    var talk = Math.min(0.85, 0.35 + skill('speech') * 0.15);
    var v = await UI.ask('거인에게 돌이 날아온다', [
      { label: '돌팔매 패를 막는다', value: 'fight', icon: 'sword' },
      { label: '「이 돌은 너희 손자들도 보러 올 거다」 — 말로 쫓는다 (' + Math.round(talk * 100) + '%)', value: 'talk', icon: 'scroll' },
      { label: '거인 곁의 횃불만 지킨다', value: 'torch', icon: 'sun' }], me());
    if (v === 'fight') { var r = await fight('돌팔매 패', k.foe || 10, { leader: '돌팔매 패 대장' }); b.guard = r === 'win' ? 'win' : 'lose'; }
    else if (v === 'talk') b.guard = U.chance(talk) ? 'talk' : 'lose';
    else b.guard = 'torch';
    await play([[null, b.guard === 'win' ? '돌팔매 패가 골목으로 흩어졌다. 거인의 발에는 돌 하나 닿지 않았다.'
      : b.guard === 'talk' ? '대장이 돌팔매를 내리고 한참 거인을 올려다보더니, 침을 뱉고 돌아섰다. 젊은이들이 따라갔다.'
        : b.guard === 'torch' ? '돌 몇 개가 나무 틀에 맞고 튕겨 나갔다. 순라꾼들이 달려오자 젊은이들은 달아났다. 거인은 무사했다.'
          : '돌 몇 개가 거인의 다리를 감싼 나무 틀에 맞았다. 순라꾼들이 달려와 몇을 붙잡아 갔다. 거인은 다행히 무사했다.']]);
    b.giant = 1;
    give('bx_marble');
    await withPic('bx_tommaso', '광장의 새벽', function () { return play([
      [null, '나흘째 새벽. 거인이 시뇨리아 광장의 궁전 문 앞에 섰다. 해가 뜨자 대리석 얼굴에 빛이 든다. 광장에 나온 사람들이 저마다 걸음을 멈춘다.'],
      ['TO', '(제독 곁에 서서 오래 거인을 올려다보다가) 이제 제 얼굴은 저 돌 속에 남았어요. 천 년쯤은 저기 서 있겠죠. …그러니까 남은 몸은 바다로 가도 되지 않을까요.'],
      b.yard === 'sea' ? ['TO', '선장님이 울타리 너머로 해 준 고래 이야기, 매일 밤 생각했어요. 돌팔매 대신 돛줄을 쥐어 보고 싶어요.'] : ['TO', '그물은 기울 줄 알고, 돛줄도 맬 줄 알아요. 선생님은 제가 가만히 서 있는 것만 잘한다고 하셨지만요.'],
      ['MI', '(어느새 뒤에 와 서서, 토마소의 어깨를 한 번 짚는다) 가라. 돌은 내가 지킨다. …바다에서 늙어 돌아오면 그때 한 번 더 깎아 주마. 늙은 다윗으로.']
    ]); });
    var j = await UI.ask('토마소를 배에 태우겠는가?', [
      { label: '태운다 — 「돛줄은 돌팔매보다 무겁다」', value: 'ship', icon: 'ship' },
      { label: '「그대는 피렌체의 얼굴이오」 — 사양한다', value: 'no' }], me());
    b.tommaso = j;
    var gf = fame('so', 'giant');
    if (j === 'ship') { join('bx_tommaso', FLORENCE); await play([['TO', '야호— 아니, 고맙습니다, 선장님! 다윗은 광장에 두고, 토마소는 바다로 갑니다.']]); }
    else await play([['TO', '(웃으며) 그럼 저는 이 광장에서 그물을 깁고 있을게요. 거인 발치에서요.']]);
    log('1504년 피렌체 — 다윗상이 시뇨리아 광장으로 옮겨지던 밤 거인을 지켰다. 모델 토마소가 「다비드의 돌가루」를 건넸다.' + (j === 'ship' ? ' 토마소가 배에 올랐다.' : '') + ' (사교 명성 +' + gf + ')');
    refresh();
  }

  // ================================================================ ② 카니발의 곤돌라꾼 (1572~1599년 1~2월)
  function lorenzoOpen() { var b = st(), s = S(), k = K().lorenzo || {}; return !!(b && !b.lorenzo && cityNow() === VENICE && !row('bx_lorenzo') && s.date.y >= k.from && s.date.y <= k.to && (k.months || [1, 2]).indexOf(s.date.m) >= 0); }
  async function lorenzo() {
    var b = st(), s = S(), k = K().lorenzo || {};
    await withPic('bx_carnival', '카니발의 밤 (' + s.date.y + ')', function () { return play([
      [null, '베네치아, 카니발의 밤. 가면을 쓴 사람들이 리알토 다리 위에 넘친다. 운하마다 등불을 단 곤돌라가 미끄러진다.'],
      [null, '나루터에 소란이 났다. 검은 망토의 순라가 젊은 곤돌라꾼의 팔을 비틀어 잡았다. 등불에 비친 얼굴 — 뒤로 묶은 검은 머리, 눈썹 위의 흉터. 구경꾼들 사이에서 탄식이 터진다. 「하필 로렌초를!」'],
      ['bx_maskmaker', '(울음을 삼키며) 제 금박 모레타 가면이에요! 산 마르코의 가면 축제에 내놓으려고 반년을 들인 건데… 손님을 태우고 나간 로렌초의 곤돌라에 마지막으로 실려 있었대요.'],
      ['bx_notte', '이 곤돌라꾼 배에서 사라졌으니 이놈이 가져간 게지. 얼굴 반반한 놈치고 손버릇 깨끗한 놈 없더라.'],
      ['LO', '(팔이 꺾인 채로도 웃는다) 나리, 얼굴로 도둑을 잡으면 베네치아 감옥은 내 얼굴 하나로 꽉 찰 거요. …거기 이방인 선장. 레판토의 바다 냄새가 나는구려. 날 좀 믿어 보겠소? 내 노를 저을 줄 아는 사람이면 진짜 도둑이 어느 운하로 갔는지 알 거요.']
    ]); });
    var nav = skill('nav'), p = Math.min(0.9, (k.chase || 0.55) + nav * 0.1), talk = Math.min(0.85, 0.3 + skill('speech') * 0.15);
    var v = await UI.ask('로렌초가 붙잡혔다', [
      { label: '곤돌라를 빌려 진짜 도둑을 쫓는다 — 항해 (' + Math.round(p * 100) + '%)', value: 'chase', icon: 'ship' },
      { label: '「밤의 나리」에게 레판토의 공을 들어 변호한다 — 웅변 (' + Math.round(talk * 100) + '%)', value: 'plead', icon: 'scroll' }], me());
    b.how = v;
    if (v === 'chase') {
      await play([[null, '순라가 로렌초의 손목을 풀어 주자 그가 곧장 노를 쥔다. 「저 금박 가루 — 물 위에 떠 있소!」 등불 아래 운하 수면에 금빛 가루가 점점이 이어진다.']]);
      if (U.chance(p)) {
        await play([[null, '좁은 운하 셋을 꺾어 들어가자, 다리 밑 그늘에 곤돌라 한 척이 숨어 있다. 소매에 금박을 묻힌 사내가 칼을 뽑는다.'], ['bx_giuseppe', '로렌초 이 녀석! 손님이란 손님은 다 네 배에만 타니, 너도 한번 감옥 맛을 봐야지!']]);
        var res = G.Games && G.Games.duel ? await G.Games.duel({ name: '곤돌라꾼 주세페', look: 'brawler', str: 70, atk: 9, def: 3, skill: 1, mar: 62, int: 44, cha: 38, style: 'thrust' }, { place: 'city' }) : 'win';
        b.duel = res;
        await play([[null, res === 'win' ? '주세페가 칼을 떨어뜨리고 무릎을 꿇었다. 소매에서 금박 가면이 굴러 나왔다.' : '주세페가 가면을 운하에 던지고 달아났다. 로렌초가 물에 뛰어들어 건져 올렸다. 금박이 조금 벗겨졌을 뿐이다.']]);
        b.mask = true;
      } else {
        await play([[null, '운하가 너무 많다. 금빛 가루를 놓친 사이 골목에서 사내들이 몽둥이를 들고 나타난다.']]);
        var r = await fight('주세페의 패거리', k.foe || 8, { leader: '곤돌라꾼 주세페' });
        b.mask = r === 'win';
        await play([[null, b.mask ? '패거리를 쓰러뜨리자 주세페의 품에서 금박 가면이 떨어졌다.' : '패거리는 흩어졌지만 가면은 끝내 찾지 못했다. 그래도 주세페가 도둑이라는 것은 모두가 보았다.']]);
      }
      if (b.mask) { give('bx_mask'); await play([['bx_maskmaker', '(가면을 끌어안고) 이걸 찾아 주시다니! …이건 선장님 거예요. 축제에는 다음 해에 더 좋은 걸 내놓을게요. 도둑을 잡아 준 값이에요.']]); }
    } else {
      var ok = U.chance(talk);
      await play(ok
        ? [['P', '이 사람은 레판토에서 베네치아의 갤리선 노를 저었소. 그날 오스만의 배를 들이받은 노 가운데 하나가 이 사람 것이오. 얼굴이 아니라 그 손을 보시오.'], ['bx_notte', '(로렌초의 손바닥에 박인 굳은살을 보고 한참 말이 없다가) …풀어 줘라. 가면은 우리가 찾겠다.']]
        : [['bx_notte', '레판토? 그 바다에서 노 저은 놈이 수만이오. …그래도 증거가 없긴 하군. 오늘은 풀어 주지. 가면이 나오면 다시 오겠소.']]);
      b.mask = false;
    }
    await withPic('bx_lorenzo', '리알토의 새벽', function () { return play([
      [null, '새벽, 카니발의 등불이 하나둘 꺼진다. 로렌초가 곤돌라에 걸터앉아 노를 무릎에 얹고 바다 쪽을 본다.'],
      ['LO', '레판토에서 노를 저을 때, 고개를 들면 사방이 바다였소. 불타는 배와 연기 사이로도 끝이 안 보였지. 그 뒤로 이 운하가 너무 좁아졌소. 손님들은 내 얼굴을 보러 오지만, 나는 손님 어깨 너머 바다만 보오.'],
      ['LO', '(웃으며 흉터를 긁적인다) 선장, 그대 배에 노 저을 자리 있소? 돛 다는 법도 아오. 얼굴값은 안 받겠소.']
    ]); });
    var j = await UI.ask('로렌초를 배에 태우겠는가?', [
      { label: '태운다 — 「바다는 운하보다 넓소」', value: 'ship', icon: 'ship' },
      { label: '「베네치아가 그대를 그리워할 거요」 — 사양한다', value: 'no' }], me());
    b.lorenzo = j;
    var mf = fame('so', 'mask');
    if (j === 'ship') { join('bx_lorenzo', VENICE); await play([['LO', '좋소! 리알토의 아가씨들한테는 비밀로 해 주시오. 나루터가 울음바다가 될 테니. 하하.']]); }
    else await play([['LO', '그럼 다음 카니발에 또 오시오. 내 곤돌라는 공짜요, 선장.']]);
    log(s.date.y + '년 베네치아 카니발 — 가면 도둑으로 몰린 곤돌라꾼 로렌초를 ' + (v === 'chase' ? '도와 진짜 도둑을 쫓았다' : '변호해 풀려나게 했다') + '.' + (b.mask ? ' 금박 모레타 가면을 받았다.' : '') + (j === 'ship' ? ' 로렌초가 배에 올랐다.' : '') + ' (사교 명성 +' + mf + ')');
    refresh();
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[giantOpen, giant], [yardOpen, yard], [lorenzoOpen, lorenzo]];
  BX.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  BX.check = async function () {
    if (BX._busy) return false; BX._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    BX._busy = false; refresh();
    return true;
  };
  BX._t = { yard: yard, giant: giant, lorenzo: lorenzo };
})(window.G = window.G || {});
