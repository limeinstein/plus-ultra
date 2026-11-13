/* 서유기 — 네 아가씨의 천축 길 (G.XiYou) — 2026-11-13 사용자 요청. 사람·동료·조정값: js/data/xiyou.js (G.BALANCE.xiyou)
   ■ 열리는 때: 조선 통신사 이벤트가 생긴 뒤(s.beauxEA.mu — 에도의 마상재를 겪었거나, 첫 통신사 기간 envoyFrom이 지났다)
     + 발견물 「인도항로」 + 중국 · 조선 · 일본에서 찾은 발견물이 하나씩 이상 → 사카이에서 시작 (모자라면 사카이에서 한 번 귀띔)
   ■ 흐름 (s.xiyou.step) — 넷은 동료가 되기 전까지 제독의 배에 손님으로 탄다
     0 → 사카이: 통신사의 불경 수레를 노리는 낭인 패거리 · 금테를 쓴 유키노가 수레에 매달려 있다
           (가) 낭인들과 싸운다(뭍의 싸움 ronin) (나) 금화 payRonin로 물린다 (다) 미수의 경 — 유키노의 금테가 조여 들고, 낭인들은 기겁해 달아난다
         → 「빠진 마지막 권은 천축에만 있어요」 — 태운다 / 사양(decline일 뒤)
     1 → 항주: 서호 가 식당 「팔보루」 — 나잉과, 말을 몰고 잘못 찾아온 뭉군 · 네 사람을 노리는 소금 상인의 건달들
           (가) 말로 쫓는다(웅변 speech) (나) 맞서 싸운다(뭍의 싸움 thugs) → 넷이 모인다 · 나잉이 손님에게 밥값 대신 받은 보물 지도 — 화과산 수렴동
     [곁길] 연운항 앞바다(huaguo.box): 화과산의 폭포 — 유키노가 폭포를 뚫고 뛰어든다 · 원숭이 떼가 식량을 훔친다 → 금화 · 수렴동의 금테 쇠막대
     2 → 아유타야: 수상 시장에서 나잉이 사라졌다 — (가) 뭉군의 나비를 따라간다 (나) 뱃사공들에게 수로를 뒤지게 한다(금화 search) (다) 유키노가 탑 꼭대기에서 찾는다
           → 꼬치 서른 개를 먹고 있는 나잉 · 꼬치 값 stall · 나비 머리꽂이
     3 → 말라카: 「세상에서 제일 맛있는 두리안」에 꾀여 나잉이 납치되었다 — 흑풍대왕(산적 두목)의 소굴(뭍의 싸움 bandit)
           → 이기면 「그 아가씨는 해협의 왜구에게 팔았다」 / 지면 again일 뒤 다시
     4 → 말라카 해협(wokou.box): 왜구 두목 구로나미의 배들(큰 해전) — 이기면 나잉을 구한다(금화 · 전투 명성) · 지거나 물러나면 again일 뒤
     5 → 인도(캘리컷 · 코친 · 고아): 카레 할머니의 부엌 — 카레 잔치 · 글 없는 마지막 권 → 넷 모두 동료 (다음 여행을 위해)
   ■ 저장: s.xiyou = { step, hinted, cool, map, mapDone, fight, after, tries, how: {} }
   ■ 장면 그림: images/legend-events/xy_* — XIYOU_PROMPT.md */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var XY = G.XiYou = {};
  var FOUR = ['xy_misu', 'xy_yukino', 'xy_mungun', 'xy_naing'];
  function K() { return G.BALANCE.xiyou; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); if (!s) return null; if (!s.xiyou) s.xiyou = { step: 0, how: {} }; s.xiyou.how = s.xiyou.how || {}; return s.xiyou; }
  XY.state = st;
  function today() { return U.dateNum(S().date); }
  function num(n) { return U.num(Math.round(n)); }
  function log(t) { G.State.log(t); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function giveItem(id) { if (!(R.addItem && R.addItem(id) !== false)) S().player.items.push({ id: id }); }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { var s = S(); return !!(s.flags && s.flags['gone_' + id]); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : null; return { lv: (b && b.lv) || 0, who: (b && b.who) || S().player.name }; }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function inBox(box) { var l = S().loc; return !!(l && l.mode === 'sea' && l.lon != null && l.lon >= box[0] && l.lon <= box[1] && l.lat >= box[2] && l.lat <= box[3]); }
  function cooled() { var b = st(); return !(b.cool > S().day); }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  var ALIAS = { misu: 'xy_misu', yukino: 'xy_yukino', mungun: 'xy_mungun', naing: 'xy_naing' };
  function who(k) {
    if (k === 'P') return me();
    if (k === 'first') return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 };
    var id = ALIAS[k] || ('xy_' + k);
    if (ALIAS[k] && row(id) && G.Legend && G.Legend.speaker) return G.Legend.speaker(id);
    return G.Hist && G.HIST_FIG[id] ? G.Hist.speaker(id) : { name: k, lang: 3 };
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(6, Math.round(n)), !!(o && o.beasts), Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  function joinMate(id) {
    if (row(id) || gone(id) || !G.MATE[id]) return false;
    var nm = G.Legend && G.Legend.join ? G.Legend.join(id, G.CITY_DATA[cityNow()] || null) : null;
    if (!nm && !row(id)) { nm = { id: id, role: 'none', joined: today(), loyal: K().loyal || 85 }; S().mates.push(nm); }
    if (nm) nm.loyal = Math.max(nm.loyal || 0, K().loyal || 85);
    if (G.Achieve && G.Achieve.afterHire) { try { G.Achieve.afterHire(id); } catch (e) { console.error(e); } }
    return true;
  }

  // ---------------------------------------------------------------- 열리는 조건
  function found(id) { return !!(G.Disc && G.Disc.foundByMe ? G.Disc.foundByMe(id) : (S().disc && S().disc[id] && S().disc[id].found)); }
  function korea(d) { return d.reg === 6 && d.lon >= 124.4 && d.lon <= 131 && d.lat >= 33 && d.lat <= 43.1; }
  var AREA = { china: function (d) { return d.reg === 6 && !korea(d); }, korea: korea, japan: function (d) { return d.reg === 9; } };
  function foundIn(area) { var f = AREA[area], L = G.DISCOVERIES || []; for (var i = 0; i < L.length; i++) if (f(L[i]) && found(L[i].id)) return true; return false; }
  XY.foundIn = foundIn;
  function envoyOK() { var s = S(); return !!((s.beauxEA && s.beauxEA.mu) || today() > K().envoyFrom); }
  /** 모자란 것 — 없으면 [] */
  XY.lacks = function () {
    var out = [];
    if (!envoyOK()) out.push('조선 통신사');
    if (!found('indiaroute')) out.push('인도항로 발견');
    if (!foundIn('china')) out.push('중국의 발견물');
    if (!foundIn('korea')) out.push('조선의 발견물');
    if (!foundIn('japan')) out.push('일본의 발견물');
    return out;
  };
  function anyGone() { return FOUR.some(function (id) { return row(id) || gone(id); }); }
  XY.ready = function () { var b = st(); return !!(b && b.step === 0 && cooled() && !anyGone() && XY.lacks().length === 0); };

  // ================================================================ 0 귀띔 — 사카이
  XY.hint = async function () {
    var b = st(); b.hinted = 1;
    var miss = XY.lacks().filter(function (x) { return x !== '조선 통신사'; });
    await play([[null, '사카이 부두. 조선 통신사의 깃발이 걸린 짐수레 곁에서, 석장을 짚은 아가씨 하나가 제독의 배를 오래 바라본다. 그러다 고개를 갸웃하고 돌아선다.'],
      ['misu', '(혼잣말처럼, 미소를 머금고) 저 배는 아직 천축을 몰라요. 동쪽 바다의 이야기도 다 듣지 못했고요. …인연이 익으면 다시 만나겠지요.']]);
    UI.toast('서유기: ' + miss.join(' · ') + '을 찾은 뒤에 사카이에서 다시 만난다', 'info', 6400);
    refresh(); return true;
  };

  // ================================================================ 1 사카이 — 미수와 유키노
  XY.start = async function () {
    var b = st(), k = K(), s = S();
    await withPic('xy_sakai', '사카이 부두의 불경 수레', function () { return play([
      [null, '사카이 부두. 조선 통신사의 깃발 아래, 불경 상자를 실은 수레가 절로 떠날 채비를 한다. 수레 곁에 석장을 짚고 염주를 감은 아가씨가 서 있다. 부두의 사내들이 힐끔거리며 수군댄다.'],
      ['choi', '미수야, 사카이의 절까지만 실어 주면 우리 일은 끝이다. …사내들 눈길이 곱지 않구나. 수레 곁을 떠나지 마라.'],
      [null, '그때 부두 창고 지붕에서 그림자 하나가 수레 위로 뛰어내린다. 양갈래로 묶은 머리, 목에 두른 호랑이 꼬리, 이마에 번쩍이는 금테. 그 뒤를 따라 칼을 찬 낭인 패거리가 우르르 몰려온다.'],
      ['yukino', '쳇, 경전 상자에 금이 들었다더니 종이뿐이잖아! …야, 너희는 왜 따라와? 이건 내 몫이라고!'],
      ['ronin', '금테 쓴 계집이 앞장섰으니 좋지. 상자는 우리가, 아가씨들은… 덤으로 데려가 볼까? 조선 아가씨 몸값이 꽤 나갈 텐데.'],
      ['misu', '(놀라지도 않고 미소를 지으며 제독을 돌아본다) 바다의 손님, 마침 잘 오셨어요. 이것도 인연이겠지요?']
    ]); });
    var v = await UI.ask('불경 수레를 노리는 낭인들', [
      { label: '낭인들과 맞서 싸운다', value: 'fight' },
      { label: '금화 ' + num(k.payRonin) + '닢으로 물린다', value: 'pay', dis: s.player.gold < k.payRonin },
      { label: '미수에게 맡긴다', value: 'chant' }], who('misu'));
    if (v === 'fight') {
      var res = await fight('사카이의 낭인 패거리', k.ronin, { leader: '낭인 두목' });
      await play([[null, res === 'win' ? '낭인들이 칼을 떨어뜨리고 달아났다. 수레 위의 금테 아가씨가 「오, 제법인데?」 하고 휘파람을 분다.' : '낭인들에게 밀렸지만, 소란에 통신사 호위 군관들이 달려오자 패거리는 흩어졌다.']]);
    } else if (v === 'pay' && s.player.gold >= k.payRonin) {
      s.player.gold -= k.payRonin;
      await play([[null, '금화 주머니를 던지자 낭인 두목이 낚아채며 히죽 웃는다. 「말이 통하는 양반이군.」 패거리가 부두 골목으로 사라졌다.']]);
    } else v = 'chant';
    await withPic('xy_circlet', '조여 드는 금테', function () { return play([
      v === 'chant' ? [null, '미수가 염주를 굴리며 나지막이 경을 외기 시작한다. 「관자재보살 행심반야바라밀다시…」 그 순간 수레 위의 아가씨가 머리를 싸쥐고 비명을 지른다. 이마의 금테가 조여 든다. 낭인들이 귀신이라도 본 듯 뒷걸음질 치더니 줄행랑을 놓았다.'] : [null, '소란이 가라앉자 미수가 수레 위의 금테 아가씨를 올려다보며 염주를 굴린다. 「관자재보살 행심반야바라밀다시…」 아가씨가 머리를 싸쥐고 수레에서 굴러떨어진다. 이마의 금테가 조여 든다.'],
      ['yukino', '아, 아, 아야야야! 그만! 그 경 그만! …이 금테, 절에서 금인 줄 알고 썼더니 빠지지가 않아! 너 무슨 짓을 한 거야!'],
      ['misu', '(합장하며 빙그레) 제가 한 게 아니라 부처님이 하신 거예요. 그 금테는 마음이 날뛰는 사람을 붙잡아 주는 물건이랍니다. 이름이 뭐예요?'],
      ['yukino', '…유키노. 아버지는 무사였는데 주군이 망하는 바람에… 아, 아니, 내 사정을 왜 말해! (미수가 염주를 들자) 아, 알았어, 알았다고요, 아가씨!'],
      ['misu', '저는 최미수예요. 아버지와 함께 통신사를 따라 불경을 싣고 왔지요. 그런데 사카이의 절에 드릴 경전 가운데 마지막 한 권이 빠져 있어요. 그 원본은 천축 — 인도에만 있다고 해요.'],
      ['choi', '(한숨을 쉬며) 이 아이가 또 시작이군. 미수야, 천축은 바다 끝이다.'],
      ['misu', '(제독을 바라보며, 모든 걸 꿰뚫어 보는 듯한 미소) 하지만 이분은 인도항로를 아시잖아요. 동쪽 바다의 옛것들도 찾아다니셨고요. 저를 천축까지 태워 주시겠어요? 유키노도 함께요. 이 금테가 저와 떨어지면 더 조여 들지도 모르니까요.'],
      ['yukino', '뭐어?! …에잇, 어차피 갈 데도 없어. 대신 밥은 배불리 먹여 줘!']
    ]); });
    var j = await UI.ask('천축 가는 길', [{ label: '미수와 유키노를 태운다 — 먼저 명나라 항주로', value: 'go' }, { label: '사양한다', value: 'no' }], who('misu'));
    b.how.sakai = v;
    if (j !== 'go') { b.cool = s.day + (k.decline || 180); await play([['misu', '(조금도 실망하지 않은 얼굴로) 그래요. 인연은 서두르지 않는 법이지요. 다음에 또 뵈어요.']]); log('사카이에서 조선 관리의 딸 최미수와 금테를 쓴 유키노를 만났다. 천축까지 태워 달라는 청은 사양했다.'); refresh(); return true; }
    b.step = 1; b.cool = 0;
    var so = fame('so', 150);
    log('사카이에서 통신사의 불경 수레를 노리는 낭인들을 물리쳤다(' + ({ fight: '맞서 싸웠다', pay: '금화로 물렸다', chant: '미수의 경' })[v] + '). 조선 관리의 딸 최미수(삼장법사)와 금테를 쓴 무사의 딸 유키노(손오공)가 천축까지 함께 간다. 먼저 항주로. (사교 명성 +' + so + ')');
    UI.toast('서유기 — 다음: 명나라 항주', 'map', 5600);
    refresh(); return true;
  };

  // ================================================================ 2 항주 — 뭉군과 나잉
  XY.hangzhou = async function () {
    var b = st(), k = K(), sp = skill('speech');
    await withPic('xy_hangzhou', '서호 가의 식당 「팔보루」', function () { return play([
      [null, '항주, 서호 가의 식당 「팔보루」. 동파육 냄새가 골목을 채운다. 앞치마를 두르고 허리에 큰 국자를 찬 아가씨가 손님상 사이를 날아다니며, 틈틈이 손님 접시의 고기를 한 점씩 집어 먹는다.'],
      ['naing', '어서 오세요! 오늘은 동파육에 서호초어, 용정 새우… 아, 이건 제가 먹을 거니까 주문하시면 안 돼요!'],
      [null, '그때 식당 앞에 말 열댓 마리가 우르르 멈춰 선다. 맨 앞 말에서 몽골식 옷을 입은 아가씨가 가볍게 뛰어내린다. 그녀의 어깨 위로 흰 나비 두 마리가 아른거린다.'],
      ['mungun', '여기가 광주예요? 말을 사겠다는 사람이 광주에 있다던데.'],
      ['naing', '여긴 항주예요. 광주는 저 아래 남쪽이고요.'],
      ['mungun', '(고개를 갸웃하며) 응? 광주를 아래로 내렸다고요? …뭐, 아무튼 배고파요. 고기 있어요?'],
      [null, '네 아가씨가 한 식탁에 둘러앉자 식당 안 사내들의 눈길이 모두 그쪽으로 쏠린다. 이윽고 비단옷에 부채를 든 사내가 졸개들을 이끌고 다가온다.'],
      ['hangzhou_boss', '서호에 꽃이 넷이나 피었군. 아가씨들, 우리 소금 상인 나리 댁 잔치에 가 주셔야겠어. 싫다고 하면… 이 식당이 내일도 문을 열지 모르겠는데?'],
      ['yukino', '(칼자루에 손을 얹으며) 이 녀석들 베어 버려도 되지? 응? 아가씨, 제발 경은 외지 말고!']
    ]); });
    var opts = [
      { label: '말로 쫓는다 (웅변 ' + k.speech + ' 이상 — ' + sp.who + ' ' + sp.lv + ')', value: 'talk', dis: sp.lv < k.speech },
      { label: '맞서 싸운다', value: 'fight' }];
    var v = await UI.ask('서호의 건달들', opts, who('naing'));
    if (v === 'talk' && sp.lv >= k.speech) {
      await play([['P', '이 아가씨는 조선 통신사의 사람이고, 저 아가씨는 일본 무사의 딸이다. 손끝 하나라도 대면 명과 조선과 일본 세 나라가 너희 나리 집 대문을 두드릴 거다. 그래도 하겠나?'],
        [null, '사내의 부채가 멈췄다. 졸개들이 서로 눈치를 보더니, 사내는 헛기침을 하며 물러났다.']]);
    } else {
      v = 'fight';
      var res = await fight('소금 상인의 건달들', k.thugs, {});
      await play([[null, res === 'win' ? '나잉이 큰 국자로 졸개 셋의 머리를 연달아 때리고, 뭉군이 말 위에서 밧줄을 던져 두목을 묶었다. 유키노는 탁자 위를 날아다니며 칼등으로 남은 놈들을 쓰러뜨렸다.' : '건달들에게 밀렸지만, 나잉이 끓는 국솥을 들고 나오자 놈들은 혼비백산 달아났다.']]);
    }
    b.how.hangzhou = v;
    await withPic('xy_four', '넷이 모이다', function () { return play([
      ['naing', '(국자를 허리에 꽂으며) 휴, 우리 집 식당 지켜 줘서 고마워요! 그런데… 천축에 간다고요? 거기엔 세상에서 제일 매운 국물이 있다던데! 저도 갈래요! 아버지, 저 천축 다녀올게요!'],
      ['mungun', '천축? …천 마리 가축을 사러 간다고요? 그럼 저도 가야죠. 말 장수 딸이 가축을 놓칠 순 없죠.'],
      ['misu', '(염주를 굴리며 빙그레) 반은 맞았어요. 인연이 맞으니 함께 가요. 저는 최미수, 이쪽은 유키노.'],
      ['naing', '저는 나잉! 그리고 이거 — (앞치마 주머니에서 꼬깃꼬깃한 종이를 꺼낸다) 지난달 밥값 대신 받은 지도예요. 「화과산 수렴동」이래요. 북쪽 연운항 앞바다, 폭포 뒤 동굴에 보물이 있대요!'],
      ['yukino', '(지도를 낚아채며 눈을 반짝인다) 보물! 금? 금이지? 나 그런 거 좋아해!'],
      ['misu', '(제독에게) 천축 가는 길에서 조금 돌아가는 길이지만… 원하시면 들러도 좋아요. 이제 남쪽으로 — 아유타야를 거쳐 말라카, 그리고 천축이에요.']
    ]); });
    b.step = 2; b.map = 1;
    log('항주 서호 가의 식당 「팔보루」에서 몽골 말 장수의 딸 뭉군(사오정)과 식당 주인의 딸 나잉(저팔계)을 만났다. 네 아가씨가 모였다. 나잉이 밥값 대신 받은 보물 지도 — 화과산 수렴동(연운항 앞바다). 다음은 아유타야.');
    UI.toast('서유기 — 넷이 모였다 · 다음: 아유타야 (곁길: 연운항 앞바다의 화과산)', 'map', 6400);
    refresh(); return true;
  };

  // ================================================================ 곁길 — 화과산 수렴동
  XY.huaguo = async function () {
    var b = st(), k = K().huaguo, s = S();
    await withPic('xy_huaguo', '화과산 수렴동', function () { return play([
      [null, '연운항 앞바다. 바다에서 솟은 산 중턱에 하얀 폭포가 커튼처럼 드리워져 있다. 산 곳곳에서 원숭이 떼가 끽끽거리며 배를 내려다본다.'],
      ['naing', '지도랑 똑같아요! 「물 커튼 뒤에 동굴이 있다」 — 수렴동!'],
      ['yukino', '내가 먼저! (말릴 틈도 없이 바위를 박차고 폭포 속으로 뛰어든다) …와아! 안이 넓어! 돌 탁자에 돌 의자에, 그리고 — 이거 봐!'],
      [null, '폭포 뒤 동굴 깊은 곳, 이끼 낀 돌 상자 안에 옛 금화와 은덩이가 가득하다. 그 위에 양 끝에 금테를 두른 무거운 쇠막대 하나.'],
      [null, '그 사이 배에서는 원숭이 떼가 식량 창고에 몰려들어 쌀자루를 끌고 산으로 달아난다. 뭉군이 말 대신 원숭이를 쫓아 달리다가 나비를 따라 엉뚱한 데로 사라진다.'],
      ['yukino', '(쇠막대를 빙글빙글 돌리며) 이건 내 거! 내 거야! 늘어나라, 늘어나라…! (미수가 염주를 들자) …아, 안 늘어나네. 알았어, 내려놓을게.']
    ]); });
    s.fleet.food = Math.max(0, (s.fleet.food || 0) - Math.ceil(R.dailyUse() * k.food));
    s.player.gold += k.gold; giveItem('xy_golden_staff'); b.mapDone = today();
    var ex = fame('ex', 200);
    log('연운항 앞바다의 화과산 수렴동에서 나잉의 보물 지도를 따라 보물을 찾았다 — 금화 +' + num(k.gold) + ' · 수렴동의 금테 쇠막대. 원숭이 떼가 식량을 조금 훔쳐 갔다. (탐험 명성 +' + ex + ')');
    UI.toast('화과산 수렴동의 보물 — 금화 +' + num(k.gold), 'coin', 5600);
    refresh(); return true;
  };

  // ================================================================ 3 아유타야 — 사라진 나잉
  XY.ayutthaya = async function () {
    var b = st(), k = K(), s = S();
    await withPic('xy_market', '아유타야의 수상 시장', function () { return play([
      [null, '아유타야. 강과 운하마다 작은 배들이 과일과 국수와 꼬치를 싣고 떠다니는 수상 시장. 숯불 냄새와 향신료 냄새가 물 위를 덮는다.'],
      ['mungun', '어? 나잉이 어디 갔지? 아까까지 망고 먹고 있었는데.'],
      ['yukino', '또야?! 아까는 국수 냄새 따라가더니! 미수 아가씨, 저 녀석 금테라도 씌워야 하는 거 아니에요?'],
      ['misu', '(염주를 굴리며, 조금도 걱정하지 않는 미소) 배고픈 사람은 냄새를 따라가는 법이지요. 냄새를 따라가면 나잉이 있을 거예요. 다만 이 시장엔 냄새가 천 가지네요.']
    ]); });
    var v = await UI.ask('사라진 나잉', [
      { label: '뭉군의 나비를 따라간다', value: 'butterfly' },
      { label: '뱃사공들에게 수로를 뒤지게 한다 (금화 ' + num(k.search) + '닢)', value: 'boat', dis: s.player.gold < k.search },
      { label: '유키노가 탑 꼭대기에 올라가 찾는다', value: 'tower' }], who('misu'));
    if (v === 'boat' && s.player.gold >= k.search) { s.player.gold -= k.search; await play([[null, '뱃사공들이 노를 저어 운하 구석구석으로 흩어졌다. 한 시진 뒤, 한 사공이 손을 흔든다. 「꼬치 배 앞에 앞치마 두른 아가씨가 있소!」']]); }
    else if (v === 'tower') await play([[null, '유키노가 사원 탑의 벽을 다람쥐처럼 타고 올라 꼭대기에 섰다. 손차양을 하고 둘러보더니 외친다. 「찾았다! 저기, 연기 제일 많이 나는 꼬치 배!」']]);
    else { v = 'butterfly'; await play([[null, '뭉군의 어깨에서 흰 나비 한 마리가 날아올라 운하를 따라 팔랑팔랑 간다. 「저 나비가 나잉 냄새를 안대요.」 「…나비가?」 반신반의하며 따라가자, 정말로 나비가 꼬치 배 위에 내려앉는다. 나비가 앉았던 자리에 은 머리꽂이 하나가 떨어져 있다.']]); giveItem('xy_butterfly_pin'); }
    await play([[null, '꼬치 배 앞. 나잉이 양손에 꼬치를 다섯 개씩 들고 볼이 터지도록 먹고 있다. 발치에는 빈 꼬치 막대가 서른 개쯤 쌓였다. 꼬치 장수가 팔짱을 끼고 서 있다.'],
      ['naing', '(입 안 가득) 어, 다들 왜 왔어요? …이거 진짜 맛있어요! 사테라는 건데, 땅콩 소스가… 아, 돈? 돈은 저분이 내실 거예요! (제독을 가리킨다)'],
      ['misu', '(웃음을 참으며) 인연이네요.']]);
    s.player.gold = Math.max(0, s.player.gold - k.stall);
    b.how.ayutthaya = v; b.step = 3;
    log('아유타야의 수상 시장에서 사라진 나잉을 찾았다(' + ({ butterfly: '뭉군의 나비를 따라', boat: '뱃사공들이 수로를 뒤져', tower: '유키노가 탑 꼭대기에서' })[v] + ') — 꼬치 서른 개 값 금화 ' + num(k.stall) + '닢. 다음은 말라카.');
    UI.toast('서유기 — 다음: 말라카', 'map', 5200);
    refresh(); return true;
  };

  // ================================================================ 4 말라카 — 납치된 나잉 · 흑풍대왕
  XY.malacca = async function () {
    var b = st(), k = K(), s = S();
    await withPic('xy_kidnap', '사라진 앞치마', function () { return play([
      [null, '말라카 항구. 부두에 내리자마자 수상한 사내 하나가 나잉에게 속삭인다. 「밀림 속에 세상에서 제일 맛있는 두리안이 열렸소. 따라오면 공짜로…」 나잉의 눈이 반짝인다.'],
      [null, '한 시진 뒤. 나잉은 돌아오지 않았다. 밀림 어귀에 큰 국자 하나와 반쯤 먹은 두리안 껍질만 떨어져 있다.'],
      ['mungun', '(국자를 주워 들고, 처음으로 웃음기 없는 얼굴로) …이번엔 냄새 따라간 게 아니에요. 바닥에 끌려간 자국이 있어요. 말발굽이 아니라 맨발, 열 명쯤.'],
      ['yukino', '(금테가 번쩍일 만큼 이를 악물고) 누구야. 누가 감히 우리 돼지— 아니, 나잉을! 미수 아가씨, 이번엔 경 외워도 안 멈춰요!'],
      ['misu', '(처음으로 미소가 사라진 얼굴로 석장을 쥔다) …멈추라고 하지 않을게요. 제독, 함께 가 주세요.']
    ]); });
    await play([[null, '밀림 깊은 곳, 검은 바위 아래 산적 소굴. 곰 같은 덩치의 사내가 검은 털가죽 망토를 걸치고 큰 창을 짚고 섰다.'],
      ['blackwind', '흑풍대왕님 소굴에 제 발로 걸어 들어오다니. 어젯밤 잡아 온 앞치마 아가씨? 하하, 그 계집은 먹기만 해서 하루 만에 쌀 한 섬을 축냈다! 그래서 해협의 왜구 놈들한테 팔아 버렸지. 이제 너희 셋도 값을 좀 받아 볼까?']]);
    var res = await fight('흑풍대왕의 산적 떼', k.bandit, { leader: '흑풍대왕' });
    if (res !== 'win') { b.cool = s.day + (k.again || 30); await play([[null, '산적 떼에 밀려 밀림 밖으로 물러났다. 유키노가 칼을 거두며 이를 간다. 「다시 와. 반드시.」']]); log('말라카 밀림에서 납치된 나잉을 찾아 흑풍대왕의 산적 떼와 싸웠다가 밀려났다.'); refresh(); return true; }
    await play([[null, '유키노의 칼이 창 자루를 두 동강 냈다. 흑풍대왕이 무릎을 꿇는다.'],
      ['blackwind', '사, 살려 주시오! 그 아가씨는 정말로 왜구 두목 구로나미한테 넘겼소! 해협 한가운데 닻을 내린 왜구 배들 — 내일이면 남쪽으로 떠날 거요!'],
      ['misu', '(석장을 거두며) 해협이에요. 바다는 제독의 것이지요.']]);
    b.step = 4; b.cool = 0; b.tries = 0;
    log('말라카 밀림의 흑풍대왕(산적 두목)을 물리쳤다. 나잉은 말라카 해협의 왜구 두목 구로나미에게 팔려 갔다.');
    UI.toast('서유기 — 말라카 해협의 왜구 배로', 'sword', 5600);
    refresh(); return true;
  };

  // ================================================================ 5 말라카 해협 — 왜구
  XY.wokou = async function () {
    var b = st(), k = K().wokou, s = S();
    await withPic('xy_wokou', '말라카 해협의 왜구', function () { return play([
      [null, '말라카 해협. 수마트라 쪽 섬 그늘에 낡은 관선 한 척과 작은 배 여럿이 닻을 내렸다. 돛대 끝에 해골 대신 「팔번대보살」 깃발이 펄럭인다. 뱃전에서 왜구들이 술을 마시며 떠든다.'],
      [null, '— 그런데 어딘가 이상하다. 왜구들이 다들 배를 문지르며 투덜거린다. 「두목, 그 앞치마 계집이 밥을 다 먹어 치웠소! 쌀이 한 톨도 안 남았다고!」 큰 배 고물에서 익숙한 목소리가 들린다. 「반찬이 너무 짜요! 이 생선 누가 절였어요?!」'],
      ['wokou', '(화승총을 들고 뱃전에 서서) 저 배는 뭐냐! 이 계집 찾으러 왔으면 데려가— 아니, 몸값을 내놔라! 저 계집 먹은 쌀값까지!'],
      ['yukino', '(칼을 뽑으며) 같은 일본 사람이라고 봐줄 줄 알아? 우리 나잉 내놔!']
    ]); });
    b.tries = (b.tries || 0) + 1;
    var spec = { id: 'xy_wokou_' + b.tries, foe: '왜구', foeLabel: '왜구 두목 구로나미의 배들', ships: k.ships.slice(), names: ['구로나미의 관선', '파도칼 소조', '검은 갈매기 소조', '훔친 정크'],
      boss: { hist: 'xy_wokou', str: 78, mar: 82, int: 56, cha: 40, line: '해협은 우리 바다다!' },
      ask: '왜구의 배들과 싸우겠습니까?', fightLabel: '덮친다', noLabel: '물러난다', decline: '…흥, 겁쟁이 배로군. 그 계집은 내일 남쪽에 팔아 버린다!',
      win: { fame: k.fame, gold: k.gold, text: '왜구의 배들을 물리쳤다! 큰 배의 창고에서 왜구가 모아 둔 은과 — 빈 쌀독 옆에서 생선을 다시 절이고 있는 나잉을 찾았다.' },
      lose: '왜구의 배들에 밀려났다. 해협 너머에서 나잉의 외침이 들린다. 「반찬 짜다니까요!」',
      onWin: function () { var z = st(); z.after = 1; z.fight = 0; },
      onLose: function () { var z = st(); z.fight = 0; z.cool = S().day + (K().again || 30); } };
    b.fight = 1;
    var go = G.Rel && G.Rel.greatBattle ? (G.Rel.register(spec), await G.Rel.greatBattle(spec)) : false;
    if (!go) { b.fight = 0; b.cool = s.day + (K().again || 30); log('말라카 해협의 왜구 배들 앞에서 물러났다.'); }
    refresh(); return true;
  };
  XY.afterWokou = async function () {
    var b = st(); b.after = 0; b.step = 5;
    await withPic('xy_rescue', '돌아온 앞치마', function () { return play([
      ['naing', '(빈 쌀독을 끌어안고 배로 건너오며) 다들 왔어요?! 늦었잖아요! 저 사람들 밥이 너무 맛없어서 제가 부엌을 차지했거든요. 사흘 동안 쌀을 다 먹어 치웠더니 다들 저를 무서워해요!'],
      ['yukino', '(나잉의 볼을 꼬집으며, 눈가가 빨갛다) 이 돼지! 걱정했잖아!'],
      ['mungun', '(나잉의 앞치마에 국자를 꽂아 주며) 국자 여기요. 이거 없으면 나잉이 아니잖아요. …응? 국자가 아니라 국수요? 국수도 좋죠.'],
      ['misu', '(합장하며 빙그레 웃는다) 여든한 가지 어려움 가운데 이제 하나만 남았네요. 천축이에요.']
    ]); });
    log('말라카 해협에서 왜구 두목 구로나미의 배들을 물리치고 나잉을 구했다. 이제 천축 — 인도로.');
    UI.toast('서유기 — 마지막: 인도 (캘리컷 · 코친 · 고아)', 'map', 5600);
    refresh(); return true;
  };

  // ================================================================ 6 천축 — 카레 잔치
  XY.curry = async function () {
    var b = st(), here = G.CITY_DATA[cityNow()].name;
    await withPic('xy_curry', '천축의 카레 잔치 (' + here + ')', function () { return play([
      [null, here + '. 부두에 내리자 후추와 생강, 계피와 정향 냄새가 파도처럼 밀려온다. 나잉이 코를 킁킁거리다가 그대로 냄새를 따라 달려간다. 이번엔 아무도 말리지 않았다.'],
      [null, '골목 끝 작은 부엌. 노란 사리를 입은 할머니가 큰 냄비 앞에서 향신료를 볶는다. 바나나 잎 위에 밥과 노란 국물과 붉은 국물과 녹색 국물이 차례로 올라온다.'],
      ['cook', '멀리서 왔구나, 아가씨들. 자, 먹어 보렴. 이게 이 바다의 카레란다.'],
      ['naing', '(한 숟갈 떠 넣고 그대로 굳는다. 눈물이 주르륵 흐른다) …매워. 매운데… 맛있어. 세상에서 제일 매운 국물… 찾았어요… 사부님이라고 불러도 돼요?!'],
      ['yukino', '(혀를 내밀고 펄쩍펄쩍 뛰며) 물! 물! 이거 불이야! …한 숟갈 더 줘.'],
      ['mungun', '(땀을 뻘뻘 흘리며) 카레? 칼에? 칼에 뭘 발라 먹는다고요? …아, 이거구나. 맛있다.'],
      [null, '다들 정신없이 먹는 사이, 할머니가 미수에게 낡은 비단 보자기 하나를 건넨다. 「옛날 이 바다에 왔던 스님들이 두고 간 거란다.」 보자기 안에는 두루마리 한 권. 펼쳐 보니 글자가 한 자도 없다.'],
      ['misu', '(두루마리를 오래 바라보다가, 처음으로 소리 내어 웃는다) 무자진경 — 글 없는 경이네요. 옛날 삼장법사도 처음엔 글 없는 경을 받았대요. …아니, 이게 맞아요. 여기까지 오는 길이 곧 마지막 권이었어요.'],
      ['misu', '(합장하고 제독을 바라보며) 그래서 말인데요, 제독. 경은 다 읽었지만, 길은 아직 다 걷지 않았어요. 다음 여행도 함께 가도 될까요? 넷이 함께요.'],
      ['yukino', '나, 나는 아가씨가 간다니까 가는 거야! 금테 때문이야, 금테!'],
      ['mungun', '다음엔 어디 가요? 천 마리 가축 아직 못 샀는데.'],
      ['naing', '(카레 그릇을 끌어안고) 사부님 비법은 받았으니까, 이제 배 위 부엌은 제 거예요!']
    ]); });
    giveItem('xy_last_sutra'); giveItem('xy_curry_recipe');
    var n = 0; FOUR.forEach(function (id) { if (joinMate(id)) n++; });
    b.step = 6; b.done = today();
    var so = fame('so', 400), ex = fame('ex', 300);
    log(here + '에서 천축 길의 끝 — 카레 잔치. 최미수 · 유키노 · 뭉군 · 나잉이 다음 여행을 위해 동료가 되었다. 글 없는 마지막 권 · 말라바르 카레 비법서 (사교 명성 +' + so + ' · 탐험 명성 +' + ex + ')');
    UI.toast('서유기 — 네 아가씨가 동료가 되었다', 'heart', 6400);
    refresh(); return true;
  };

  // ================================================================ 도시 · 바다
  function cityStep() {
    var b = st(); if (!b) return null; var c = cityNow(), k = K();
    if (b.after) return 'afterWokou';
    if (b.step === 0) { if (c !== k.sakai || !cooled() || anyGone()) return null; if (XY.lacks().length === 0) return 'start'; return envoyOK() && !b.hinted ? 'hint' : null; }
    if (b.step === 1 && c === k.hangzhou) return 'hangzhou';
    if (b.step === 2 && c === k.ayutthaya) return 'ayutthaya';
    if (b.step === 3 && c === k.malacca && cooled()) return 'malacca';
    if (b.step === 5 && k.india.indexOf(c) >= 0) return 'curry';
    return null;
  }
  function seaStep() {
    var b = st(); if (!b) return null; var k = K();
    if (b.after) return 'afterWokou';
    if (b.map && !b.mapDone && b.step >= 2 && b.step < 6 && inBox(k.huaguo.box)) return 'huaguo';
    if (b.step === 4 && !b.fight && cooled() && inBox(k.wokou.box)) return 'wokou';
    return null;
  }
  XY.cityStep = cityStep; XY.seaStep = seaStep;
  /** 지금 가야 할 곳 (소문·수첩용) */
  XY.goal = function () { var b = st(); if (!b) return null; return ({ 1: '항주', 2: '아유타야', 3: '말라카', 4: '말라카 해협', 5: '인도 (캘리컷 · 코친 · 고아)' })[b.step] || null; };
  XY.pending = function () { var s = S(); return !!(s && s.loc && s.loc.mode === 'city' && cityStep()); };
  XY.check = async function () {
    if (XY._busy) return false; XY._busy = true;
    try { var w = cityStep(); if (w) await XY[w](); } catch (e) { console.error(e); }
    XY._busy = false; return true;
  };
  XY.seaPending = function () { var s = S(); return !!(s && s.loc && s.loc.mode === 'sea' && seaStep()); };
  XY.atSea = async function () {
    if (XY._busy) return false; XY._busy = true;
    try { var w = seaStep(); if (w) await XY[w](); } catch (e) { console.error(e); }
    XY._busy = false; return true;
  };
  /** 해전 도중 새로고침한 저장 — 해전 장면 밖인데 싸우는 중 표시가 남았으면 푼다 */
  (function hookDaily() {
    var W = G.World; if (!W || W._xiyou) return; W._xiyou = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { var b = S() && S().xiyou; if (b && b.fight && !(G.Game && G.Game.sceneName === 'battle')) b.fight = 0; } catch (e) { console.error(e); } return out; };
  })();
})(window.G = window.G || {});
