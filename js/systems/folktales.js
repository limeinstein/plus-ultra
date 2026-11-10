/* 유럽 옛이야기 셋 (G.Folktales) — 2026-11-10 사용자 요청. 사람·조정값: js/data/folktales.js (G.BALANCE.folk)
   조건의 능력은 제독이나 동료 가운데 가장 높은 사람의 것(R.skillBest). 모자라면 그 도시에서 한 번 귀띔한다.
   ■ ① 로빈 후드 — 요크(명성 minFame · 사격술 shoot 이상)
     주인공은 로빈 후드의 조수 「배트 후드」 — 조로처럼 눈 뚫린 안대 · 검은 늑대 귀가 솟은 모자 · 검은 망토 (2026-11-10 고침)
     노팅엄 장관의 활쏘기 대회: 우리 사수와 검은 망토의 궁수가 결승 — 배트 후드가 화살을 쪼개고, 로빈 후드의 조수로 드러나 장관의 병사들이 덮친다
       화살 장인의 딸 캐시가 도와 달라 한다 — (가) 배트 후드의 탈출을 돕는다(뭍의 싸움 guards — 이기면 금 화살) (나) 모른 척한다(again일 뒤 다시)
     셔우드 숲의 큰 참나무 아래 잔치 — 로빈 후드가 맞는다. 부자 상인(헤리퍼드 주교의 회계 담당)의 금화 상자가 숲길로 온다
       로빈은 이번 일을 배트 후드에게 맡긴다 — 배트 후드가 묻는다: 부자 상인을 털 것인가
       (가) 함께 턴다(금화 rob · 악명 noto) (나) 셔우드의 방식 — 저녁을 대접하고 「밥값」으로 절반(금화 toll · 사교 명성) (다) 털지 않는다
     → 대회에서 얼굴(안대)이 알려진 배트 후드와, 장관의 눈 밖에 난 캐시 — 로빈 후드가 제독에게 둘을 맡긴다: 맡는다(둘 다 동료) / 사양(again일 뒤 다시 요크에서)
   ■ ② 라푼젤 — 프라하 · 바르샤바 · 부다페스트(명성 minFame · 측량 survey · 과학 sci 이상)
     나무꾼: 큰 숲 한가운데 문도 계단도 없는 탑, 해 질 녘의 노랫소리 → 측량으로 숲 위로 솟은 탑 꼭대기를 겨누어 길을 찾는다
       (가) 과학 — 그녀의 머리채에 가는 줄을 묶어 올려 도르래와 줄사다리를 건다 (마녀가 와도 머리채가 아니라 사다리로 내려온다)
       (나) 「라푼젤, 라푼젤, 머리카락을 내려 다오」 — 머리채를 타고 오른다 → 마녀 고텔이 돌아와 머리채를 자른다 → 가시덤불과 까마귀(뭍의 싸움 witch, 짐승)
     → 라푼젤 동료 · 금빛 머리채 / 싸움에 지면 again일 뒤 다시
   ■ ③ 빌헬름 텔 — 베른(명성 minFame · 사격술 shoot · 항해술 nav 이상)
     우리 주 알트도르프 광장, 장대 끝 게슬러의 모자. 절하지 않은 텔에게 아들 발터의 머리 위 사과를 쏘라 한다
       (가) 우리 사수가 바람(푄)을 읽어 텔에게 귀띔한다 (나) 게슬러에게 항의한다 — 「그럼 네 사수가 쏴라」 → 우리 사수가 쏜다
     두 번째 화살 때문에 텔이 묶여 게슬러의 배로 — 루체른 호수의 폭풍
       (가) 우리 보트로 뒤따라, 우리 항해사가 파도 사이로 배를 바위에 붙인다 → 텔이 바위로 뛰어내린다(텔의 바위)
       (나) 게슬러의 배를 덮친다(뭍의 싸움 guards)
     → 빌헬름 텔 동료 · 게슬러의 모자
   ■ 저장: s.folk = { robin: {step, how, cool, hinted}, rapunzel: {...}, tell: {...} }
   ■ 장면 그림: images/legend-events/ft_* — FOLKTALES_PROMPT.md */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var FT = G.Folktales = {};
  function K() { return G.BALANCE.folk; }
  function S() { return G.Game && G.Game.state; }
  function st() {
    var s = S(); if (!s) return null;
    var f = s.folk || (s.folk = {}); f.robin = f.robin || { step: 0 }; f.rapunzel = f.rapunzel || { step: 0 }; f.tell = f.tell || { step: 0 };
    return f;
  }
  FT.state = st;
  function today() { return U.dateNum(S().date); }
  function num(n) { return U.num(Math.round(n)); }
  function log(t) { G.State.log(t); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function fameNow() { return G.Fame ? G.Fame.get() : (S().player.fame || 0); }
  function giveItem(id) { if (!(R.addItem && R.addItem(id) !== false)) S().player.items.push({ id: id }); }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { var s = S(); return !!(s.flags && s.flags['gone_' + id]); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : null; return { lv: (b && b.lv) || 0, who: (b && b.who) || S().player.name }; }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function cool(o) { return !(o.cool > S().day); }
  function later(o) { o.cool = S().day + (K().again || 180); }
  function jx(n, p) { return n + U.jx(n, p); }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function npc(key, name, kind, g) {
    // 전령·나무꾼·수사도 전용 초상의 얼굴과 무릎상을 함께 쓴다.
    if (G.Hist && G.HIST_FIG && G.HIST_FIG[key]) return G.Hist.speaker(key);
    return { name: name, portrait: G.Art.withImg(G.Art.npcSpec(key, kind, 'ne', g || 'm'), []), lang: 3 };
  }
  var MATE_OF = { bathood: 'bat_hood', cathy: 'cathy', rapunzel: 'rapunzel', tell: 'tell' };
  function who(k) {
    if (k === 'P') return me();
    if (MATE_OF[k] && row(MATE_OF[k]) && G.Legend && G.Legend.speaker) return G.Legend.speaker(MATE_OF[k]);
    if (k === 'woodcutter') return npc('ft_woodcutter', '숲의 나무꾼', 'peasant');
    if (k === 'herald') return npc('ft_herald', '장관의 전령', 'soldier');
    if (k === 'tuck') return npc('ft_tuck', '터크 수사', 'priest');
    return G.Hist ? G.Hist.speaker('ft_' + k) : { name: k, lang: 3 };
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
  function joinMate(id, msg) {
    if (row(id) || gone(id) || !G.MATE[id]) return;
    var nm = G.Legend && G.Legend.join ? G.Legend.join(id, G.CITY_DATA[cityNow()] || null) : null;
    if (!nm && !row(id)) { nm = { id: id, role: 'none', joined: today(), loyal: 85 }; S().mates.push(nm); }
    if (nm) nm.loyal = Math.max(nm.loyal || 0, 85);
    if (G.Achieve && G.Achieve.afterHire) { try { G.Achieve.afterHire(id); } catch (e) { console.error(e); } }
    log(msg); UI.toast(msg, 'heart', 5600);
  }
  /** 모자란 능력 — ['사격술 3', …] */
  function lacks(need) { var out = []; Object.keys(need).forEach(function (id) { if (skill(id).lv < need[id]) { var d = (G.SKILLS || []).filter(function (x) { return x.id === id; })[0]; out.push((d ? d.name : id) + ' ' + need[id]); } }); return out; }
  var NEED = { robin: function () { return { shoot: K().robin.shoot }; }, rapunzel: function () { return { survey: K().rapunzel.survey, sci: K().rapunzel.sci }; }, tell: function () { return { shoot: K().tell.shoot, nav: K().tell.nav }; } };
  /** 이야기가 시작될 수 있나 (도시는 빼고) — 소문용 */
  FT.ready = function (key) {
    var b = st() && st()[key], k = K()[key]; if (!b || b.step || !cool(b) || fameNow() < k.minFame) return false;
    if (key === 'robin' && (row('bat_hood') || gone('bat_hood'))) return false;
    if (key === 'rapunzel' && (row('rapunzel') || gone('rapunzel'))) return false;
    if (key === 'tell' && (row('tell') || gone('tell'))) return false;
    return lacks(NEED[key]()).length === 0;
  };

  // ================================================================ ① 로빈 후드
  FT.robinHint = async function () {
    var b = st().robin; b.hinted = 1;
    await play([[null, '요크의 장터. 노팅엄 장관의 전령이 북을 치며 방을 붙인다.'],
      ['herald', '들으시오! 노팅엄 장관께서 활쏘기 대회를 여신다! 상은 금 화살 한 자루! 단, 과녁 한가운데를 세 번 맞힐 자만 나오시오 — 어설픈 활잡이는 웃음거리가 될 뿐이니! …그리고 밤마다 검은 망토를 쓰고 다니는 도둑놈은 목을 내놓고 나오너라!']]);
    UI.toast('로빈 후드: 사격술 ' + K().robin.shoot + ' 이상인 사수가 있어야 노팅엄의 활쏘기 대회에 나갈 수 있다', 'info', 6000);
    refresh(); return true;
  };
  FT.robin = async function () {
    var b = st().robin, k = K().robin, s = S(), sh = skill('shoot');
    await withPic('ft_bat_contest', '노팅엄의 활쏘기 대회', function () { return play([
      [null, '요크에서 남쪽으로 이틀, 셔우드 숲 가장자리의 노팅엄. 성벽 아래 풀밭에 과녁이 줄지어 섰다. 구경꾼이 구름처럼 몰렸고, 높은 단 위에서 장관이 금 화살을 들어 보인다.'],
      ['sheriff', '이 금 화살은 잉글랜드 최고의 궁수에게! …물론 로빈 후드의 졸개들이 감히 나타난다면, 화살 대신 밧줄을 받게 될 테지.'],
      [null, jx(sh.who, '이/가') + ' 활을 받아 들었다. 첫 과녁, 둘째 과녁 — 화살이 한가운데에 꽂힐 때마다 함성이 커진다. 끝까지 남은 사람은 둘. ' + sh.who + ', 그리고 검은 망토에 검은 모자를 깊이 눌러 쓴 날렵한 젊은이.'],
      [null, sh.who + '의 마지막 화살이 과녁 한가운데에 꽂혔다. 망토의 젊은이가 씩 웃으며 시위를 당긴다 — 그의 화살이 ' + sh.who + '의 화살 꽁무니를 쪼개며 같은 자리에 박혔다. 풀밭이 숨을 죽인다.'],
      [null, '바람에 망토가 펄럭이며 모자 위로 검은 늑대 귀 두 개가 솟는 게 보인다. 눈만 뚫린 검은 안대. 구경꾼들이 웅성거린다. 「배트 후드다! 밤마다 장관의 금고를 터는 그 박쥐 같은 놈!」'],
      ['sheriff', '(벌떡 일어나) 로빈 후드의 조수 놈이다! 저 박쥐 망토를 잡아라!'],
      ['bathood', '(망토 자락을 휙 젖히며) 박쥐가 아니라 늑대라니까! 귀를 좀 보라고, 장관 나리!'],
      [null, '장관의 병사들이 창을 겨누고 사방에서 몰려든다. 구경꾼 사이에서 화살통을 멘 아가씨가 제독의 소매를 붙잡는다.'],
      ['cathy', '부탁이에요, 저 바보를 도와주세요! 혼자 대회에 나가겠다고 고집을 부리더니… 장관은 그를 미끼로 로빈까지 잡으려는 거예요!']
    ]); });
    var v = await UI.ask('배트 후드', [{ label: '배트 후드의 탈출을 돕는다', value: 'help' }, { label: '모른 척한다', value: 'no' }], who('cathy'));
    if (v !== 'help') { later(b); await play([[null, '배트 후드는 망토를 펼치고 성벽을 타고 넘어 숲으로 사라졌다. 화살통을 멘 아가씨가 실망한 눈으로 제독을 한 번 돌아보았다.']]); log('노팅엄의 활쏘기 대회에서 로빈 후드의 조수 배트 후드를 보았지만 모른 척했다.'); refresh(); return true; }
    var res = await fight('노팅엄 장관의 병사들', k.guards, { guns: true, leader: '노팅엄 장관' });
    if (res === 'win') {
      giveItem('ft_golden_arrow');
      await play([[null, '병사들이 흩어지는 사이, 배트 후드가 단 위로 뛰어올라 칼끝으로 장관의 허리띠를 툭 끊었다. 장관이 흘러내리는 바지를 붙잡는 틈에 금 화살을 낚아챈다. 「대회의 상이니 받아 가야지!」 그는 그 화살을 제독에게 던져 주고, 캐시의 손을 잡고 숲으로 달렸다.']]);
    } else await play([[null, '병사들에게 밀렸지만, 그 틈에 배트 후드와 캐시는 숲으로 빠져나갔다.']]);
    b.step = 1;
    await withPic('ft_bat_sherwood', '셔우드 숲의 잔치', function () { return play([
      [null, '그날 밤, 셔우드 숲 한가운데 속이 빈 큰 참나무 아래. 모닥불 위에서 왕의 사슴이 구워지고, 녹색 옷의 사내들이 술잔을 부딪친다. 거인 같은 리틀 존, 배가 불룩한 터크 수사. 그리고 녹색 두건의 사내가 일어나 제독을 맞는다.'],
      ['robin', '내 조수를 구해 준 선장이로군! 나는 로빈, 이 숲의 주인이오. 이 녀석은 내가 키운 아이인데, 「배트 후드」 소리를 듣고 다니더니 간이 배 밖으로 나왔소.'],
      ['bathood', '(안대를 올려 쓰며) 늑대 후드라고요, 늑대! …어쨌든 고마워요, 선장. 캐시가 아니었으면 지금쯤 장관네 지하 감옥이었을 거예요.'],
      ['cathy', '(배트 후드의 귀를 잡아당기며) 내가 기워 준 안대를 대회에서 쓰고 나가다니. 이제 노팅엄 사람 모두가 그 안대를 알아요. 우리 아버지 공방에서 화살 사 가던 병사들까지요!'],
      ['littlejohn', '(숲길 쪽에서 뛰어오며) 로빈! 헤리퍼드 주교의 회계 담당이 숲길로 온다. 노새 네 마리, 금화 상자 둘. 가난한 소작인들한테 짜낸 세금이다!'],
      ['robin', '(배트 후드의 어깨를 두드리며) 이번 일은 네가 맡아라. 선장과 함께 네 식대로 해 봐.'],
      ['bathood', '(눈을 빛내며 제독을 돌아본다) 선장, 어떻게 할래요? 저 부자 상인을 털 것인가?']
    ]); });
    var r = await UI.ask('부자 상인을 털 것인가', [
      { label: '함께 턴다 (금화 ' + num(k.rob) + '닢 · 악명이 오른다)', value: 'rob' },
      { label: '셔우드의 방식 — 저녁을 대접하고 「밥값」을 받는다', value: 'toll' },
      { label: '털지 않는다', value: 'spare' }], who('bathood'));
    if (r === 'rob') {
      s.player.gold += k.rob; s.player.notoriety = (s.player.notoriety || 0) + k.noto;
      await play([[null, '달 없는 숲길, 나뭇가지 위에서 검은 망토가 박쥐처럼 내려앉았다. 배트 후드의 화살이 노새 고삐를 끊고, 녹색 옷들이 양쪽에서 쏟아져 나온다. 호위병들은 활 한 번 쏘지 못하고 달아났다. 금화 상자가 열리자 배트 후드가 절반을 덜어 마을 쪽으로 보낸다.'],
        ['bathood', '절반은 소작인들에게, 절반은 선장에게. 공평하죠? …장관이 선장 얼굴도 기억하겠지만요.']]);
    } else if (r === 'toll') {
      s.player.gold += k.toll; var so = fame('so', 150);
      await play([[null, '배트 후드가 늑대 귀 모자를 벗어 들고 회계 담당에게 공손히 절했다. 모닥불 앞으로 모셔 사슴 고기와 맥주를 실컷 대접한 뒤, 터크 수사가 엄숙하게 「밥값」을 읽는다 — 가진 돈의 절반.'],
        ['tuck', '주님께서 이 식탁을 축복하셨으니, 밥값도 축복받은 만큼이오. 아멘.'],
        ['bathood', '봤죠? 피 한 방울 안 흘리고 정직하게 받았어요. 캐시가 셈해 줬으니 한 닢도 안 틀려요. 이 몫은 선장 것, 나머지는 소작인들 것.']]);
    } else {
      await play([['bathood', '(입을 삐죽이다가 이내 웃으며) 정직한 선장이네요. 좋아요, 오늘은 저 친구를 그냥 보내죠. 대신 캐시가 내일 그 마을에 빵을 실어 보낼 거예요.']]);
    }
    b.how = r;
    await play([['robin', '(모닥불 너머로 제독을 오래 바라보다가) 선장, 부탁이 하나 있소. 이 녀석은 오늘 대회에서 안대와 모자를 온 노팅엄에 보여 줬소. 캐시도 장관의 눈 밖에 났지. 셔우드의 그물이 날마다 좁혀 오는데, 둘이 여기 있다간 언젠가 장관의 밧줄에 걸릴 거요.'],
      ['robin', '나는 이 숲을 떠날 수 없소. 소작인들이 나를 기다리니까. 하지만 이 둘은… 넓은 세상을 봐야 하오. 그대 배에 내 조수와 캐시를 맡기겠소.'],
      ['bathood', '(놀라서) 스승님! 나는 셔우드를 떠나기 싫— (캐시가 다시 귀를 잡아당긴다) …아야! 알았어요, 알았어. 바다도 숲만큼 넓다니까요.'],
      ['cathy', '선장님, 저는 화살도 만들고 셈도 해요. 이 늑대 귀 바보가 사고를 치면 제가 잡아당길게요.']]);
    var j = await UI.ask('로빈 후드의 부탁', [{ label: '배트 후드와 캐시를 맡는다', value: 'join' }, { label: '셔우드에 남게 한다', value: 'no' }], who('robin'));
    if (j === 'join') {
      b.step = 2; b.done = today();
      joinMate('bat_hood', '로빈 후드의 조수 배트 후드가 동료가 되었다 (사격술 3)');
      joinMate('cathy', '화살 장인의 딸 캐시가 동료가 되었다');
      await play([['robin', '(활을 들어 인사하며) 이 녀석을 사람 만들어 주시오, 선장. 셔우드는 언제나 그대의 숲이오.']]);
      log('셔우드 숲에서 로빈 후드가 조수 배트 후드와 캐시를 제독에게 맡겼다.' + (r === 'rob' ? ' (주교의 회계 담당을 함께 털었다 — 금화 +' + num(k.rob) + ')' : r === 'toll' ? ' (「밥값」으로 금화 +' + num(k.toll) + ')' : ''));
    } else { later(b); b.step = 1; await play([['robin', '그래, 아직은 숲이 이 둘의 집이지. 언젠가 다시 요크에 오거든 셔우드에 들르시오.']]); log('셔우드 숲에서 로빈 후드와 배트 후드, 캐시와 작별했다.'); }
    refresh(); return true;
  };
  /** 숲에 남겨 두었다가 다시 요크에 오면 — 이번엔 바로 맡을지 묻는다 */
  FT.robinAgain = async function () {
    var b = st().robin;
    await play([[null, '요크의 술집 구석, 검은 늑대 귀 모자를 쓴 젊은이와 화살통을 멘 아가씨가 손을 흔든다. 젊은이의 망토 끝이 찢어져 있다.'],
      ['bathood', '선장! 장관의 병사들이 셔우드를 이 잡듯 뒤지고 있어요. 스승님이 이번엔 꼭 선장을 따라가라고… 우리 둘, 태워 줄 거죠?']]);
    var j = await UI.ask('배트 후드와 캐시', [{ label: '둘 다 맞는다 — 함께 가자', value: 'join' }, { label: '아직은 아니다', value: 'no' }], who('bathood'));
    if (j === 'join') { b.step = 2; b.done = today(); joinMate('bat_hood', '로빈 후드의 조수 배트 후드가 동료가 되었다 (사격술 3)'); joinMate('cathy', '화살 장인의 딸 캐시가 동료가 되었다'); }
    else later(b);
    refresh(); return true;
  };

  // ================================================================ ② 라푼젤
  FT.rapHint = async function () {
    var b = st().rapunzel, k = K().rapunzel; b.hinted = 1;
    await play([[null, '성문 밖 장터에서 장작을 팔던 늙은 나무꾼이 숲 쪽을 가리키며 중얼거린다.'],
      ['woodcutter', '저 큰 숲 한가운데엔 문도 계단도 없는 탑이 있소. 해 질 녘이면 노랫소리가 들리지. 하지만 숲길이 사람을 홀려서, 별과 해로 길을 잴 줄 아는 사람이 아니면 찾아갈 수 없다오. 찾아간들 문 없는 탑에 어떻게 오르겠소? 기계 장치라도 만들 줄 안다면 모를까.']]);
    UI.toast('라푼젤: ' + lacks(NEED.rapunzel()).join(' · ') + '이 모자라다 — 측량 ' + k.survey + ' · 과학 ' + k.sci + ' 이상이 있어야 숲속 탑에 갈 수 있다', 'info', 6400);
    refresh(); return true;
  };
  FT.rapunzel = async function () {
    var b = st().rapunzel, k = K().rapunzel, sv = skill('survey'), sc = skill('sci'), here = G.CITY_DATA[cityNow()].name;
    await withPic('ft_forest', '문 없는 탑 (' + here + ' 동쪽의 큰 숲)', function () { return play([
      ['woodcutter', '저 큰 숲 한가운데엔 문도 계단도 없는 탑이 있소. 해 질 녘이면 노랫소리가 들리지. 탑 주인은 마녀 고텔이라오. 들상추 한 줌을 훔친 대가로 갓난아기를 빼앗아 갔다는…'],
      [null, here + '에서 동쪽으로 사흘. 숲은 한낮에도 어둡고, 같은 자리를 몇 번이나 돌게 만든다. ' + jx(sv.who, '이/가') + ' 가장 높은 나무에 올라 나무 위로 솟은 탑 꼭대기를 겨누고, 해의 높이와 나침반으로 방위를 재어 숲길에 표식을 남긴다. 저녁 무렵, 마침내 나무 사이로 돌탑이 나타났다.'],
      [null, '문도 계단도 없는 탑. 꼭대기 창에서 맑은 노랫소리가 흘러나온다. 노래가 멈추고, 금빛 머리의 처녀가 창밖을 내다본다.'],
      ['rapunzel', '누구세요? 고텔 아주머니가 아니네요. …사람이에요? 진짜 바깥 사람이요?'],
      ['rapunzel', '아주머니는 해 질 녘에 오셔서 「라푼젤, 라푼젤, 머리카락을 내려 다오」 하고 부르세요. 그러면 제 머리채를 타고 올라오시지요. 저는 한 번도 이 탑을 나가 본 적이 없어요.']
    ]); });
    var v = await UI.ask('문 없는 탑', [
      { label: jx(sc.who, '이/가') + ' 머리채에 가는 줄을 묶어 올려, 도르래와 줄사다리를 건다 (과학 ' + sc.lv + ')', value: 'ladder' },
      { label: '「라푼젤, 라푼젤, 머리카락을 내려 다오」 — 머리채를 타고 오른다', value: 'hair' }], who('rapunzel'));
    if (v === 'ladder') {
      await play([[null, '라푼젤이 내려 준 머리채 끝에 가는 명주실을 묶어 올렸다. 그 실로 밧줄을, 밧줄로 도르래를 끌어올려 창틀에 걸었다. ' + jx(sc.who, '은/는') + ' 탑 돌 틈에 쐐기를 박아 줄사다리를 단단히 고정했다. 해가 지기 전에 사다리가 완성되었다.'],
        [null, '라푼젤이 떨리는 발로 사다리를 내려와 처음으로 풀밭을 밟는다. 그때 숲 저쪽에서 보라 망토가 나타났다.'],
        ['gothel', '라푼젤! 누가 너를… 이 도둑놈들! (커다란 가위를 휘두르며 줄사다리를 자르려 하지만, 사다리는 쇠고리와 도르래에 걸려 끄떡없다)'],
        ['rapunzel', '(제독 뒤에 숨었다가 고개를 내밀며) 아주머니, 저… 이제 머리카락으로 아무도 올려 주지 않을래요. 이걸로 끝이에요.'],
        [null, '마녀는 한참 노려보다가, 들상추 다발을 땅에 내동댕이치고 숲속으로 사라졌다. 라푼젤이 스스로 무거운 금빛 머리채를 잘라 제독에게 건넸다.']]);
    } else {
      await play([[null, '「라푼젤, 라푼젤, 머리카락을 내려 다오!」 금빛 머리채가 창에서 땅까지 쏟아져 내린다. 머리채를 붙잡고 탑 꼭대기까지 오른 순간 — 아래에서 날카로운 웃음소리.'],
        ['gothel', '감히 내 라푼젤을 넘봐? (가위가 번뜩이며 머리채가 잘려 나간다) 그 탑에서 영원히 내려오지 못할 거다!'],
        [null, '숲의 가시덤불이 꿈틀거리며 탑을 감싸고, 하늘에서 까마귀 떼가 내리꽂힌다.']]);
      var res = await fight('마녀 고텔의 가시덤불과 까마귀 떼', k.witch, { beasts: true });
      if (res !== 'win') { later(b); await play([[null, '가시덤불에 쫓겨 숲 밖으로 물러났다. 등 뒤로 라푼젤의 노랫소리가 점점 멀어진다.']]); log(here + ' 동쪽 숲의 탑에서 라푼젤을 구하려다 마녀 고텔에게 밀려났다.'); refresh(); return true; }
      await play([[null, '가시덤불을 헤치고 까마귀를 쫓아낸 뒤, 잘린 머리채를 밧줄 삼아 라푼젤을 안고 내려왔다. 마녀는 보라 망토를 끌며 숲속으로 사라졌다.']]);
    }
    giveItem('ft_rapunzel_braid'); b.step = 1; b.how = v; b.done = today();
    await play([['rapunzel', '(풀밭을 맨발로 밟으며 눈물을 글썽인다) 땅이 이렇게 부드러운 줄 몰랐어요. 탑 창으로 별만 세면서 살았는데… 바다는 별이 더 많이 보인다던데요. 저도 데려가 주실래요? 노래라면 얼마든지 불러 드릴게요.']]);
    joinMate('rapunzel', '탑에서 내려온 라푼젤이 동료가 되었다');
    log(here + ' 동쪽의 큰 숲에서 문 없는 탑에 갇힌 라푼젤을 구했다' + (v === 'ladder' ? ' — 도르래와 줄사다리로.' : ' — 마녀 고텔의 가시덤불을 헤치고.'));
    refresh(); return true;
  };

  // ================================================================ ③ 빌헬름 텔
  FT.tellHint = async function () {
    var b = st().tell, k = K().tell; b.hinted = 1;
    await play([[null, '베른의 술집. 산에서 내려온 사냥꾼들이 낮은 목소리로 수군거린다. 「알트도르프의 대관 게슬러가 장대에 모자를 걸어 놓고 절하라 한다지. 우리 주의 텔이 가만있을 리 없어…」'],
      [null, '「루체른 호수는 폭풍이 잦아. 그 호수에서 텔을 도우려면 활 솜씨도, 배 다루는 솜씨도 남달라야 할걸.」']]);
    UI.toast('빌헬름 텔: ' + lacks(NEED.tell()).join(' · ') + '이 모자라다 — 사격술 ' + k.shoot + ' · 항해술 ' + k.nav + ' 이상이 있어야 한다', 'info', 6400);
    refresh(); return true;
  };
  FT.tell = async function () {
    var b = st().tell, k = K().tell, sh = skill('shoot'), nv = skill('nav');
    await withPic('ft_altdorf', '알트도르프 광장의 모자', function () { return play([
      [null, '베른에서 산길로 나흘, 우리 주 알트도르프. 광장 한가운데 장대 끝에 깃털 달린 모자 하나가 걸려 있다. 지나가는 사람마다 그 앞에서 모자를 벗고 절을 한다. 합스부르크의 대관 게슬러의 명령이다.'],
      [null, '석궁을 멘 사냥꾼 하나가 어린 아들의 손을 잡고 모자 앞을 그냥 지나친다. 병사들이 그를 붙잡아 꿇린다.'],
      ['gessler', '빌헬름 텔. 우리 주에서 가장 활을 잘 쏜다는 놈이군. 내 모자에 절하지 않은 죄 — 그 솜씨로 갚아라. 여든 걸음 밖, 네 아들 머리 위의 사과를 쏘아 맞혀라. 못 맞히면 둘 다 죽는다.'],
      ['walter', '(보리수 아래 똑바로 서서, 머리 위에 사과를 얹고) 아버지, 저 무섭지 않아요. 아버지는 안 빗나가요.'],
      ['tell', '(석궁에 화살을 메기며, 손이 떨린다) …대관 나리, 이건 사람이 할 짓이 아니오.']
    ]); });
    var v = await UI.ask('아들의 머리 위 사과', [
      { label: jx(sh.who, '이/가') + ' 산바람(푄)을 읽어 텔에게 귀띔한다 (사격술 ' + sh.lv + ')', value: 'wind' },
      { label: '게슬러에게 항의한다', value: 'protest' }], who('tell'));
    if (v === 'wind') {
      await play([[null, sh.who + U.jx(sh.who, '이/가') + ' 광장 깃발의 펄럭임과 보리수 잎의 떨림을 지켜보다가 텔의 귀에 속삭인다. 「골짜기 쪽에서 푄이 불어 옵니다. 숨 두 번 쉬고, 바람이 잦아드는 틈에 — 사과 꼭지 반 뼘 왼쪽.」'],
        [null, '텔이 숨을 두 번 쉬었다. 바람이 멎는 찰나, 시위가 울었다. 화살이 사과를 둘로 가르며 보리수 줄기에 박혔다. 발터가 웃으며 아버지에게 달려간다.']]);
    } else {
      await play([['P', '대관, 아이를 과녁으로 삼다니 그대가 기사요, 도살자요?'],
        ['gessler', '(차갑게 웃으며) 이방인이 말이 많군. 그럼 네 사수가 쏴라. 빗나가면 저 아이도 텔도, 너희 배도 이 호수에 가라앉는다.'],
        [null, jx(sh.who, '이/가') + ' 텔의 석궁을 받아 든다. 여든 걸음. 산바람이 골짜기에서 불어 온다. 바람이 잦아드는 찰나 — 화살이 사과를 둘로 갈랐다. 발터가 「아저씨, 아버지만큼 잘 쏘시네요!」 하고 외친다.']]);
    }
    await play([[null, '그때 텔의 겉옷 속에서 두 번째 화살이 떨어졌다.'],
      ['gessler', '그 화살은 무엇이냐?'],
      ['tell', '(고개를 들며) 첫 화살이 내 아들을 맞혔다면, 이 두 번째 화살은 그대의 심장을 겨눴을 것이오.'],
      ['gessler', '저놈을 묶어라! 퀴스나흐트 성 감옥으로 끌고 간다 — 내 배에 실어라!']]);
    await withPic('ft_storm', '루체른 호수의 폭풍', function () { return play([
      [null, '게슬러의 배가 텔을 싣고 루체른 호수를 건넌다. 호수 한가운데에서 산에서 내리꽂히는 푄 폭풍이 덮쳤다. 집채만 한 파도에 노잡이들이 비명을 지르고, 배가 바위 절벽 쪽으로 밀려간다.'],
      [null, '제독 일행은 호숫가 어부에게서 빌린 보트로 그 뒤를 따르고 있었다. 게슬러의 배에서 텔의 밧줄을 풀어 노를 맡기는 것이 보인다 — 이 호수에서 그보다 배를 잘 다루는 사람은 없다.']
    ]); });
    var w = await UI.ask('폭풍 속의 호수', [
      { label: jx(nv.who, '이/가') + ' 보트를 몰아 파도 사이로 바위 곁에 붙인다 (항해술 ' + nv.lv + ')', value: 'rock' },
      { label: '게슬러의 배에 뛰어올라 덮친다', value: 'board' }], who('tell'));
    if (w === 'rock') {
      await play([[null, nv.who + U.jx(nv.who, '이/가') + ' 파도의 마루와 골을 읽으며 보트를 몰아 절벽 아래 평평한 바위에 바짝 붙였다. 신호를 받은 텔이 게슬러의 배를 바위 쪽으로 몰고 — 석궁을 움켜쥔 채 바위로 뛰어내리며 배를 발로 힘껏 밀어냈다. 게슬러의 배가 파도 속으로 밀려 나간다.'],
        ['tell', '(바위 위에서 젖은 머리를 털며 웃는다) 이 바위가 언젠가 내 이름으로 불리겠군!']]);
    } else {
      var res = await fight('게슬러의 병사들', k.guards, { guns: true, leader: '대관 게슬러' });
      if (res !== 'win') { later(b); await play([[null, '흔들리는 갑판에서 병사들에게 밀려 보트로 물러났다. 그 사이 텔은 스스로 바위로 뛰어내려 산속으로 사라졌다.']]); log('루체른 호수의 폭풍 속에서 게슬러의 배를 덮쳤다가 밀려났다. 텔은 홀로 달아났다.'); refresh(); return true; }
      await play([[null, '흔들리는 갑판에서 병사들을 쓰러뜨리고 텔의 밧줄을 끊었다. 게슬러는 겁에 질려 뱃전에 매달린다.']]);
    }
    giveItem('ft_gessler_hat'); b.step = 1; b.how = v; b.how2 = w; b.done = today();
    var so = fame('so', 200);
    await play([[null, '며칠 뒤, 알트도르프 광장의 장대에서 게슬러의 모자가 내려졌다. 우리·슈비츠·운터발덴의 사람들이 뤼틀리 풀밭에 모여 서로의 손을 잡았다는 소문이 산골짜기마다 퍼진다. 장대에서 떨어진 모자는 제독의 손에 들어왔다.'],
      ['tell', '헤트비히와 발터는 뷔르글렌의 처가에 맡겼소. 대관의 병사들이 이 산골에서 다 물러날 때까지 나는 쫓기는 몸이오. 그대 배에 태워 주시오. 내 석궁과, 이 호수에서 배운 노 솜씨를 빌려 드리리다.']]);
    joinMate('tell', '스위스의 사냥꾼 빌헬름 텔이 동료가 되었다 (사격술 3)');
    log('스위스 알트도르프에서 빌헬름 텔이 아들 발터의 머리 위 사과를 쏘아 맞혔다' + (v === 'protest' ? ' — 우리 사수가 대신 쏘았다' : '') + '. 루체른 호수의 폭풍 속에서 텔을 구했다. 게슬러의 모자 (사교 명성 +' + so + ')');
    refresh(); return true;
  };

  // ================================================================ 도시
  function open(key, cityOk) {
    var b = st()[key], k = K()[key]; if (!cityOk || b.step || !cool(b) || fameNow() < k.minFame) return null;
    var mid = { robin: 'bat_hood', rapunzel: 'rapunzel', tell: 'tell' }[key]; if (row(mid) || gone(mid)) return null;
    if (lacks(NEED[key]()).length === 0) return key;
    return b.hinted ? null : key + 'Hint';
  }
  function cityStep() {
    var f = st(); if (!f) return null; var c = cityNow(), K0 = K();
    if (f.robin.step === 1 && c === K0.robin.city && cool(f.robin) && !row('bat_hood') && !gone('bat_hood')) return 'robinAgain';
    return open('robin', c === K0.robin.city) || open('rapunzel', K0.rapunzel.cities.indexOf(c) >= 0) || open('tell', c === K0.tell.city);
  }
  var FN = { robin: 'robin', robinHint: 'robinHint', robinAgain: 'robinAgain', rapunzel: 'rapunzel', rapunzelHint: 'rapHint', tell: 'tell', tellHint: 'tellHint' };
  FT.cityStep = cityStep;
  FT.pending = function () { var s = S(); return !!(s && s.loc && s.loc.mode === 'city' && cityStep()); };
  FT.check = async function () {
    if (FT._busy) return false; FT._busy = true;
    try { var w = cityStep(); if (w && FN[w]) await FT[FN[w]](); } catch (e) { console.error(e); }
    FT._busy = false; return true;
  };
})(window.G = window.G || {});
