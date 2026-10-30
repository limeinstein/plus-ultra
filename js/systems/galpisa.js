/* 갈릴레오와 피사의 사탑 (G.GalPisa) 2026-10-30 사용자 요청 「갈릴레오와 피사의 사탑 이벤트를 만들어줘」
   갈릴레오의 피사 시절만 다룬다 — 망원경(1609~)·재판(1633)·원고(1636~)는 이미 「하늘을 재는 사람들」(js/systems/skylore.js)에 있다.
   갈릴레오는 동료(G.MATE.galileo, 1589~1600년 피사 술집)이기도 하다 — 그 그림과 말하는 사람을 그대로 쓴다.
   ■ ① 흔들리는 등불 (1583.1.1~1585.6.30, 피사): 의학을 배우던 열아홉 살 갈릴레오가 대성당의 흔들리는 등불을 맥박으로 잰다.
        (가) 배의 모래시계를 빌려준다 (나) 곁에서 함께 센다 (다) 「기도나 하게」 — 이어서 물음 「흔들림이 작아지면 한 번 오가는 시간은?」(같다 = 등시성)
   ■ ② 사탑의 두 공 (1589.10.1~1592.6.30, 피사): 수학 강사가 된 갈릴레오가 「무거운 것이 먼저 떨어진다」는 아리스토텔레스파 교수들에게 맞서
        사탑에서 무게가 다른 두 공을 떨어뜨린다. 제독의 배에서 대포알과 머스킷 총알을 내준다.
        ⑴ 교수들과 내기 — 무거운 공이 먼저 / 동시에 / 가벼운 공이 먼저 (금화 bet)
        ⑵ 이백아흔네 계단을 올라 함께 놓는다 — 「하나, 둘, 셋」 언제 놓는가: 셋에(맞다) / 둘에(너무 일찍 — 다시) / 그가 놓는 것을 보고(조금 늦다)
        ⑶ 깃털과 공 — 공기의 저항 (덤)
        → 거의 동시에 떨어진다 (무거운 공이 손가락 두 마디쯤 먼저 — 갈릴레오 스스로 『새로운 두 과학』에 적은 대로). 학생들 환호, 교수들 분노.
        보상: 내기 돈 · 명성 · 소지품 「사탑에서 떨어뜨린 쇠공」 · 지력 +1 · 피사의 사탑 단서 · 그리고 갈릴레오가 「바다에서 물체가 어떻게 움직이는지 보고 싶다」며 동료가 되겠다고 한다
        (동료 품삯은 원래 값 — 받지 않으면 1592년 파도바로 떠난다는 소식)
   ■ 소식 (만난 사람에게): 1592 파도바로 · 1612 코레시오의 반박 실험 · 1654 비비아니가 사탑 이야기를 처음 적다
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/galileo_lamp.webp · galileo_tower.webp · galileo_feather.webp
   ■ 조정값: G.BALANCE.galPisa   ■ 저장: s.galPisa = { met, lamp: 'glass'|'count'|'pray', iso, tower: 'done'|'declined', bet, betWin, drop, tries, join, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var GP = G.GalPisa = {};
  function S() { return G.Game && G.Game.state; }
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.galPisa = G.BALANCE.galPisa || { bet: 500, lampFame: 40, towerFame: 160, towerSo: 80 };
  function K() { return G.BALANCE.galPisa; }
  var PISA = 31;
  var D = GP.D = { lampFrom: 15830101, lampTo: 15850630, towerFrom: 15891001, towerTo: 15920630, padua: 15920926, coresio: 16120601, viviani: 16540101 };
  var NEWS_AT = { padua: D.padua, coresio: D.coresio, viviani: D.viviani };
  // 소지품: 사탑에서 떨어뜨린 쇠공
  if (G.ITEMS && G.ITEM && !G.ITEM.galileo_ball) {
    var it = { id: 'galileo_ball', name: '사탑에서 떨어뜨린 쇠공', kind: 'special', price: 0, reg: [], rare: true,
      desc: '피사의 사탑에서 갈릴레오와 함께 떨어뜨린 제독의 배의 대포알. 땅에 박힌 자국이 아직 남아 있다. 함께 떨어진 머스킷 총알보다 손가락 두 마디쯤 먼저 닿았을 뿐이다 — 아리스토텔레스의 말대로라면 열 배는 먼저 닿았어야 했다.' };
    G.ITEMS.push(it); G.ITEM.galileo_ball = it;
  }
  function st() {
    var s = S(); if (!s) return null;
    if (!s.galPisa) {
      s.galPisa = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.galPisa.told[k] = 1; });   // 옛 저장
    }
    if (!s.galPisa.told) s.galPisa.told = {};
    return s.galPisa;
  }
  GP.state = st;
  function today() { return U.dateNum(S().date); }
  function atPisa() { var s = S(); return !!(s && s.loc && s.loc.mode === 'city' && s.loc.city === PISA); }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function gal(emo) { return G.Legend && G.Legend.speaker && G.MATE.galileo ? G.Legend.speaker('galileo', emo) : { name: '갈릴레오 갈릴레이', lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  // 이름만 나오던 피사의 조연도 각각 전용 초상을 쓴다.
  var figs = G.HIST_FIG = G.HIST_FIG || {};
  [['gp_professor', '아리스토텔레스파 교수', 'scholar'], ['gp_student', '피사 대학의 학생', 'scholar'], ['gp_sexton', '대성당 성당지기', 'priest']].forEach(function (a) {
    if (!figs[a[0]]) figs[a[0]] = { id: a[0], name: a[1], title: '피사의 사람', st: 'it', role: a[2], g: 'm', fiction: true };
  });
  var PROF = 'gp_professor', STUDENT = 'gp_student', SEXTON = 'gp_sexton';
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var who = l[0] === 'P' ? me() : l[0] === 'G' ? gal(l[2]) : l[0] && typeof l[0] === 'object' ? l[0] : l[0] && G.Hist ? G.Hist.speaker(l[0]) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }

  // ================================================================ 날마다 — 소식
  GP.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!b.met, saw = b.tower === 'done';
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('padua', met && !row('galileo') && b.join !== 'yes', 'scroll', '【파도바로】 피사 대학이 갈릴레오 갈릴레이의 계약을 다시 맺지 않았다. 교수들의 미움을 산 젊은 수학자는 베네치아 공화국의 파도바 대학으로 떠났다. 그곳의 봉급은 피사의 세 배라고 한다.');
    news('coresio', saw, 'scroll', '【사탑의 반박】 피사의 교수 조르조 코레시오가 사탑 꼭대기에서 무게가 다른 물체를 떨어뜨려 「아리스토텔레스가 옳았다」고 책에 썼다. …제독은 그날 사탑에서 손을 놓던 순간을 떠올렸다. 손가락 두 마디였다.');
    news('viviani', saw, 'book', '【사탑의 이야기】 갈릴레오의 마지막 제자 빈첸초 비비아니가 스승의 생애를 적으며, 젊은 갈릴레오가 피사의 사탑에서 무게가 다른 물체를 떨어뜨려 교수들 앞에서 아리스토텔레스를 꺾었다고 썼다. …그 자리에 바다의 제독과 대포알이 있었다는 이야기는 적혀 있지 않다.');
    return out;
  };

  // ================================================================ ① 흔들리는 등불 (1583~1585)
  function lampOpen() { var b = st(), t = today(); return !!(b && !b.lamp && atPisa() && t >= D.lampFrom && t <= D.lampTo); }
  async function lamp() {
    var b = st(); b.met = 1;
    await withPic('galileo_lamp', '피사 대성당의 등불 (1583)', function () { return play([
      [null, '피사 대성당. 미사가 길어진다. 성당지기가 높은 천장에 매달린 청동 등불에 기름을 붓고 놓자, 등불이 크게 흔들리기 시작한다.'],
      [null, '맨 뒤 의자의 앳된 학생 하나가 기도는 하지 않고 등불만 올려다보며, 손가락으로 제 손목을 짚고 입술을 달싹인다. 「…열하나, 열둘….」'],
      ['G', '(제독의 눈길을 느끼고 속삭인다) 쉿 — 맥박을 세고 있어요. 의학을 배우는 갈릴레오라고 합니다. 저 등불이 처음엔 크게, 이제는 작게 흔들리는데… 한 번 오가는 데 드는 맥박 수가 똑같아요. 이상하지 않아요?'],
      ['G', '배를 모시는 분이죠? 배에는 시간을 재는 물건이 있다던데요.']
    ]); });
    var v = await UI.ask('젊은 갈릴레오가 흔들리는 등불을 재고 있다.', [
      { label: '배의 반 분 모래시계를 빌려준다', value: 'glass', icon: 'hourglass' },
      { label: '곁에 앉아 함께 맥박을 센다', value: 'count', icon: 'people' },
      { label: '「미사 중이오. 기도나 하게」', value: 'pray' }], me());
    b.lamp = v || 'pray';
    if (b.lamp === 'pray') {
      await play([['G', '…네, 네. (그러나 눈은 여전히 등불을 좇는다)'], [SEXTON, '(뒤에서 혀를 차며) 저 학생, 또 저러는군. 아버지는 의사가 되라고 보냈는데 맨날 천장만 본다니까.']]);
      G.State.log('피사 대성당에서 흔들리는 등불을 세는 의학도 갈릴레오를 보았다.');
      return;
    }
    await play([
      [null, b.lamp === 'glass' ? '모래시계의 모래가 흘러내리는 동안 등불은 똑같은 박자로 열여섯 번 오갔다. 흔들림이 절반으로 줄었을 때 다시 뒤집어 보았다 — 여전히 열여섯 번.' : '둘이 나란히 앉아 각자 맥박을 셌다. 크게 흔들릴 때도, 거의 멈춰 갈 때도 한 번 오가는 데 맥박 일곱.'],
      ['G', '보세요! 그렇다면 — 흔들림이 작아지면, 한 번 오가는 시간은 어떻게 될까요?']
    ]);
    var q = await UI.ask('흔들림이 작아지면 한 번 오가는 시간은?', [
      { label: '짧아진다 — 덜 움직이니까', value: 'short' },
      { label: '같다', value: 'same' },
      { label: '길어진다 — 힘이 빠지니까', value: 'long' }], me());
    b.iso = q === 'same';
    if (b.iso) {
      await play([['G', '그렇죠! 같아요! 줄의 길이만 같으면 크게 흔들리든 작게 흔들리든 박자가 같아요. 이걸로 맥박을 잴 수도 있겠어요 — 아니, 언젠가는 시계를 만들 수도 있을지 몰라요!', 'happy']]);
      var ex = G.Fame.add('ex', K().lampFame || 40);
      if (G.Growth && G.Growth.once) G.Growth.once('gal_lamp', 'int', 1, '흔들리는 등불의 박자가 같다는 것을 알았다');
      G.State.log('피사 대성당에서 의학도 갈릴레오와 흔들리는 등불을 재었다 — 흔들림이 작아져도 한 번 오가는 시간은 같다. (탐험 명성 +' + ex + ')');
    } else {
      await play([['G', '저도 처음엔 그렇게 생각했어요. 그런데 세어 보니 같았어요! 줄의 길이만 같으면 박자가 같아요. 이상하죠? 세상이 우리가 생각한 대로 움직이지 않아요.']]);
      G.State.log('피사 대성당에서 의학도 갈릴레오와 흔들리는 등불을 재었다.');
    }
    if (b.lamp === 'glass') await play([['G', '모래시계는 꼭 돌려드릴게요. …아, 가져가셔야 한다고요? 그럼 이 일을 잊지 않을게요. 바다의 선장님.']]);
    refresh();
  }

  // ================================================================ ② 사탑의 두 공 (1589.10~1592.6)
  function towerOpen() { var b = st(), t = today(); return !!(b && !b.tower && atPisa() && t >= D.towerFrom && t <= D.towerTo); }
  async function tower() {
    var b = st(), s = S(), k = K(); b.met = 1;
    var known = b.lamp && b.lamp !== 'pray', aboard = !!row('galileo');
    await withPic('galileo_tower', '피사의 사탑 (1590)', function () { return play([
      [null, '피사 대성당 광장. 흰 대리석 종탑이 금방이라도 쓰러질 듯 기울어 있다. 그 아래 검은 학자 옷의 교수들과 떠들썩한 학생들이 모여 있다.'],
      ['G', aboard ? '제독! 우리 배의 대포알을 좀 써야겠어요. 오늘 교수님들께 아리스토텔레스가 틀렸다는 걸 보여 드릴 거예요.' : known ? '어, 대성당의 그 선장님! 등불 기억하세요? 저 이제 이 대학 수학 강사예요. 오늘 또 재미있는 걸 재요!' : '바다의 선장님이시죠? 부탁이 있어요. 저는 이 대학의 수학 강사 갈릴레오 갈릴레이라고 합니다.'],
      [PROF, '(팔짱을 끼고) 아리스토텔레스께서 말씀하셨네. 무거운 것은 그 무게만큼 빨리 떨어진다. 열 배 무거운 돌은 열 배 빨리 떨어지지. 이천 년 동안 아무도 의심하지 않은 진리를, 스물다섯 살 강사가?'],
      ['G', '그럼 떨어뜨려 보면 되죠! 같은 쇠로 된 공 두 개 — 하나는 아주 무겁고 하나는 아주 가볍게. 선장님 배에 대포알이랑 머스킷 총알이 있잖아요. 둘 다 쇠고 납이고, 무게는 수백 배 차이가 나요.'],
      [PROF, '좋아. 내기를 하지. 무거운 쪽이 먼저 떨어진다는 데 금화 ' + U.num(k.bet || 500) + '닢. 바다 사람, 자네는 어느 쪽에 걸겠나?']
    ]); });
    var opts = [];
    if (s.player.gold >= (k.bet || 500)) opts.push({ label: '「동시에 떨어진다」에 건다 (금화 ' + U.num(k.bet || 500) + '닢)', value: 'same', icon: 'coin' }, { label: '「무거운 공이 먼저」에 건다', value: 'heavy' }, { label: '「가벼운 공이 먼저」에 건다', value: 'light' });
    opts.push({ label: '내기는 하지 않는다', value: 'none' });
    var bet = await UI.ask('교수가 내기를 건다 — 사탑에서 떨어뜨린 대포알과 총알, 어느 쪽이 먼저 땅에 닿을까?', opts, me());
    b.bet = bet || 'none';
    // ⑵ 이백아흔네 계단 — 함께 놓는다
    await play([
      [null, '이백아흔네 계단. 기운 탑이라 계단이 한쪽으로 쏠려, 오를수록 몸이 벽에 붙는다. 꼭대기 종 사이로 바닷바람이 분다 — 저 멀리 아르노 강 하구에 제독의 배가 보인다.'],
      ['G', '제가 총알을, 선장님이 대포알을 들어요. 난간 밖으로 팔을 내밀고 — 꼭 동시에 놓아야 해요. 제가 「하나, 둘, 셋」 하고 세면, 셋에!']
    ]);
    var ok = false; b.tries = 0;
    while (!ok && b.tries < 3) {
      b.tries++;
      var when = await UI.ask('「하나… 둘…」 언제 손을 놓는가?', [
        { label: '「셋」에 놓는다', value: 'three' },
        { label: '「둘」에 놓는다 — 빨리 해치우자', value: 'two' },
        { label: '갈릴레오가 놓는 것을 보고 놓는다', value: 'watch' }], me());
      if (when === 'two') {
        await play([[null, '「둘」에 대포알이 먼저 손을 떠났다. 땅에서 쿵 소리가 나고, 한참 뒤에 총알이 떨어졌다.'], [PROF, '(아래에서 손뼉을 치며) 보게! 무거운 것이 먼저 떨어졌네! 아리스토텔레스 만세!'], ['G', '아니에요! 선장님이 먼저 놓으셨잖아요! 다시요, 다시! 이번엔 꼭 셋에!', 'angry']]);
        continue;
      }
      b.drop = when === 'watch' ? 'late' : 'three';
      ok = true;
    }
    if (!ok) b.drop = 'three';
    await play([
      [null, b.drop === 'late' ? '갈릴레오의 손이 펴지는 것을 보고 손을 놓았다 — 눈 깜짝할 사이 늦었다. 두 공은 나란히 떨어져… 거의 함께 땅에 박혔다.' : '「셋!」 두 손이 동시에 펴졌다. 대포알과 총알이 나란히 떨어진다. 광장의 웅성거림이 멎었다.'],
      [null, '쿵 — 툭. 소리는 거의 하나였다. 대포알이 손가락 두 마디쯤 먼저 닿았을 뿐이다. 열 배는커녕 두 배도 아니었다.'],
      [STUDENT, '(광장에서) 같이 떨어졌다! 같이 떨어졌어! 수백 배 무거운데!'],
      [PROF, '(얼굴이 붉어지며) 대포알이 먼저 닿았네! 분명히 먼저 닿았어!'],
      ['G', '(난간에 몸을 기대고 아래로 외친다) 손가락 두 마디요, 교수님! 아리스토텔레스 말대로라면 총알은 아직 반도 안 떨어졌어야 해요! 그 손가락 두 마디는 공기가 막은 거예요 — 작은 것일수록 공기에 더 붙잡히거든요.', 'happy']
    ]);
    // 내기
    if (b.bet === 'same') { s.player.gold += (k.bet || 500); b.betWin = true; await play([[PROF, '(이를 갈며 금화 주머니를 던진다) …오늘은 바람이 이상했을 뿐이네.']]); UI.toast('내기에 이겼다 — 금화 +' + U.num(k.bet || 500), 'coin', 4600); }
    else if (b.bet === 'heavy') { b.betWin = false; await play([[PROF, '하! 대포알이 먼저 닿았으니 내기는 비긴 걸로 하지. …손가락 두 마디를 이겼다고 할 수는 없으니.']]); }
    else if (b.bet === 'light') { s.player.gold = Math.max(0, s.player.gold - (k.bet || 500)); b.betWin = false; await play([[PROF, '가벼운 쪽이 먼저라니, 그건 아리스토텔레스도 갈릴레오도 아닌 바다 사람만의 학설이군. 금화는 내가 가져가겠네.']]); UI.toast('내기에 졌다 — 금화 −' + U.num(k.bet || 500), 'coin', 4600); }
    // ⑶ 깃털과 공 — 공기
    var f = await UI.ask('갈릴레오가 주머니에서 거위 깃털을 꺼낸다. 「하나 더 해 볼까요?」', [{ label: '깃털과 총알을 같이 떨어뜨려 본다', value: 'yes', icon: 'feather' }, { label: '이 정도면 됐다', value: 'no' }], me());
    if (f === 'yes') await withPic('galileo_feather', '깃털과 총알', function () { return play([
      [null, '총알은 곧장 떨어지고, 깃털은 바람에 이리저리 흔들리며 한참 뒤에야 광장 바닥에 내려앉았다. 교수들이 다시 기세등등해진다.'],
      ['G', '보셨죠? 깃털이 늦은 건 가벼워서가 아니라 공기 때문이에요. 공기가 없는 곳이 있다면 — 깃털과 대포알이 똑같이 떨어질 거예요. 언젠가 누군가 그런 곳에 가서 보여 주겠죠.'],
      ['P', '공기 없는 곳이라. 바다 끝보다 먼 곳이겠군.'],
      ['G', '하하, 그럴지도요. 선장님은 바다 끝까지 가 보셨으니, 그다음은 누군가가 하늘 끝까지 가겠죠.']
    ]); });
    b.tower = 'done';
    give('galileo_ball');
    var ex = G.Fame.add('ex', k.towerFame || 160), so = G.Fame.add('so', k.towerSo || 80);
    if (G.Growth && G.Growth.once) G.Growth.once('gal_tower', 'int', 1, '피사의 사탑에서 떨어지는 물체를 재었다');
    if (G.Disc && G.Disc.addHint && G.DISC && G.DISC.pisa && !G.Disc.foundByMe('pisa')) G.Disc.addHint('pisa', 'lead:galpisa');
    G.State.log('피사의 사탑에서 갈릴레오 갈릴레이와 대포알과 총알을 함께 떨어뜨렸다 — 거의 동시에 닿았다. 아리스토텔레스파 교수들이 분을 삼켰다. (탐험 명성 +' + ex + ' · 사교 명성 +' + so + ')');
    // 동료가 되겠다고
    if (!row('galileo') && !(s.flags && s.flags.gone_galileo) && G.MATE.galileo) {
      await play([
        ['G', '(계단을 내려오며) 교수님들이 저를 가만두지 않겠죠. 계약이 끝나면 피사를 떠나야 할 거예요. …그런데 선장님, 저는 늘 궁금했어요. 흔들리는 배 위에서도 물체는 똑바로 떨어질까요? 돛대 꼭대기에서 돌을 떨어뜨리면 배가 나아가는 사이 고물 쪽에 떨어질까요, 돛대 밑에 떨어질까요?'],
        ['G', '그걸 보려면 배를 타야 해요. 선장님 배에 태워 주시겠어요? 별도 재고, 물살도 재고, 배의 판자도 셈해 드릴게요.']
      ]);
      var j = await UI.ask('갈릴레오가 배에 타고 싶다고 한다. (' + (G.wageNote ? G.wageNote('galileo') : '월급 ' + (G.MATE.galileo.wage || 0) + '닢') + ' · 과학 3 · 측량 2 · 조선 1)', [
        { label: '태운다 — 「돛대 밑에 떨어지는지 직접 보시오」', value: 'yes', icon: 'ship' }, { label: '파도바 대학이 그대를 기다릴 거요', value: 'no' }], me());
      b.join = j === 'yes' ? 'yes' : 'no';
      if (b.join === 'yes') {
        var nm = G.Legend && G.Legend.join ? G.Legend.join('galileo', G.CITY_DATA[PISA]) : null;
        if (nm) { nm.loyal = 85; await play([['G', '돛대 실험부터 해요! 제 생각엔 — 돛대 밑에 떨어질 거예요. 배와 돌이 함께 앞으로 가니까요. 지구가 돈다 해도 우리가 날아가지 않는 것처럼요… 아, 이건 아직 비밀이에요.', 'happy']]); }
      } else await play([['G', '그렇겠죠. 파도바는 베네치아 땅이니 바다가 가까워요. 언젠가 바다에서 다시 만나요, 선장님.']]);
    }
    refresh();
  }

  // ================================================================ 도시에 들어설 때
  GP.pending = function () { if (!S()) return false; return lampOpen() || towerOpen(); };
  GP.check = async function () {
    if (GP._busy) return false; GP._busy = true;
    try { if (towerOpen()) await tower(); else if (lampOpen()) await lamp(); } catch (e) { console.error(e); }
    GP._busy = false;
    return true;
  };
  GP._t = { lamp: lamp, tower: tower };
})(window.G = window.G || {});
