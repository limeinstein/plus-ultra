/* 미남 항해사 — 인도양·신대륙 (G.BeauxIS) 2026-11-05 사용자 요청 「미남 항해사가 나오는 형태로 이벤트를 추가해줘」 (연애 없이 동료로만)
   사람·동료·소지품·조정값: js/data/beauxis.js (G.BALANCE.beauxIS). 두 이야기는 서로 따로 열린다.
   ■ 사이드 — 이븐 마지드의 손자 (1498.4.1~1520.12.31)
     ① 별을 읽는 청년 (말린디·몸바사·무스카트·캘리컷): 부두의 노인이 가리킨다 — 「저 잘생긴 녀석이 그 큰 길잡이의 손자요. 프랑크에게는 길을 안 가르친다지」
        할아버지가 프랑크(바스코 다 가마)에게 인도로 가는 길을 가르쳤다는 말 — 「할아버지는 끝까지 아니라 하셨소」
        시험 둘: 아프리카에서 인도로 건너는 바람(남서 계절풍) · 카말 판의 윗단에 맞추는 별(북극성) — 하나라도 맞히면 다음 장면으로
        (둘 다 틀리면 「바다는 아직 그대를 모르오」 — 60일 뒤 다시)
     ② 붙잡힌 길잡이: 포르투갈 선장이 사이드를 억지로 길잡이로 끌고 가려 한다 → 막는다(육상전) / 매수(금화) / 「그대의 할아버지라면 어쩌겠소」(웅변)
        → 동료로 합류 · 『이로움의 책』 사본
   ■ 와이나 — 툼베스의 발사 뗏목 선장 (1526.1.1~1532.3.31 — 카하마르카 이전)
     ① 파나마의 포로 (1526.6.1~1531.12.31, 파나마): 루이스의 배가 붙잡아 온 뗏목 사공들 가운데 통역으로 쓰겠다고 남긴 젊은이 → 풀어 준다(매수 / 말) / 지나친다
     ② 툼베스의 해변 (툼베스): 풀어 주었으면 고향에서 다시 만난다 · 아니면 스스로 달아나 뗏목을 손보고 있다
        「바람을 거슬러 가는 뗏목」 — 과라 판자의 물음 → 「턱수염의 사람들이 다시 오기 전에, 수평선 너머를 보고 싶소」 → 동료로 합류 · 과라 판자
        (js/systems/incafall.js 의 파나마 동업자 이야기와 겹치지 않는다 — 동업자라면 피사로가 지나가는 말을 한다)
   ■ 소식: 바르톨로메 루이스의 뗏목(1526.11.1) · 예멘 역사가의 이븐 마지드 이야기(1577.1.1)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/bx_*.webp
   ■ 저장: s.beauxIS = { said: 'met'|'quizFail'|'joined'|'left', saidCool, quiz, saidWay, wayna: 'freed'|'passed'|'joined', waynaWay, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var BX = G.BeauxIS = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.beauxIS) || {}; }
  var SAID_CITIES = [108, 107, 125, 152], PANAMA = 210, TUMBES = 220;
  var D = BX.D = { saidFrom: 14980401, saidTo: 15201231, waynaFrom: 15260101, waynaTo: 15320331, panamaFrom: 15260601, panamaTo: 15311231 };
  var NEWS_AT = { raft: 15261101, nahrawali: 15770101 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.beauxIS) {
      s.beauxIS = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.beauxIS.told[k] = 1; });
    }
    if (!s.beauxIS.told) s.beauxIS.told = {};
    return s.beauxIS;
  }
  BX.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var WOMEN = { name: '그물 깁던 아낙들', lang: 3 }, VILLAGE = { name: '툼베스 사람들', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w === 'P' ? me() : w === 'F' ? first() : w === 'SA' ? mateSp('bx_said', l[2]) : w === 'WA' ? mateSp('bx_wayna', l[2]) : w ? H(w) : {};
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
  function join(id, loyal) { if (row(id) || !G.Legend || !G.Legend.join) return row(id); var c = G.CITY_DATA[cityNow()]; var m = G.Legend.join(id, c || null); if (m && loyal) m.loyal = loyal; return m; }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }

  // ================================================================ 소식
  BX.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, nw = !!b.wayna || !!(s.loc && s.loc.lon != null && s.loc.lon < -60);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('raft', nw, 'ship', '【바다의 뗏목】 피사로의 길잡이 바르톨로메 루이스가 적도 남쪽 바다에서 커다란 무명 돛을 단 뗏목을 붙잡았다고 한다. 뗏목에는 금은 그릇과 에메랄드, 고운 무명이 실려 있었다. 남쪽 어딘가에 큰 나라가 있다는 말이 파나마에 퍼진다.' + (b.wayna === 'freed' || b.wayna === 'joined' ? ' 그 뗏목의 젊은 사공 하나가 바다의 선장 덕에 고향으로 돌아갔다는 말도 있다.' : ''));
    news('nahrawali', !!b.said && b.said !== 'none', 'book', '【예멘의 연대기】 예멘의 역사가 쿠트브 앗딘 안나흐라왈리가 『예멘의 번개』에 이렇게 적었다고 한다 — 「큰 길잡이 이븐 마지드가 술에 취해 프랑크에게 인도로 가는 길을 가르쳤다.」' + (b.said === 'joined' ? ' 그 손자는 바다 위에서 그 이야기를 듣고 웃었다. 「할아버지는 술을 입에 대지 않으셨소.」' : ''));
    return out;
  };

  // ================================================================ 사이드 ① 별을 읽는 청년
  function saidOpen() { var b = st(), s = S(), t = today(), c = cityNow(); return !!(b && (!b.said || (b.said === 'quizFail' && s.day >= (b.saidCool || 0))) && !row('bx_said') && SAID_CITIES.indexOf(c) >= 0 && t >= D.saidFrom && t <= D.saidTo); }
  async function said() {
    var b = st(), s = S(), k = K(), c = G.CITY_DATA[cityNow()], again = b.said === 'quizFail';
    await withPic('bx_said', c.name + '의 부두', function () { return play(again
      ? [[null, c.name + ' 부두. 그 청년이 그대로 앉아 있다. 이번에는 먼저 고개를 든다.'], ['SA', '또 왔구려, 선장. 바다가 그대를 조금은 알게 되었소?']]
      : [
        [null, c.name + ' 부두. 해 질 녘, 그물 깁던 아낙들이 손을 멈추고 한곳을 본다. 돌 계단 끝에 흰 터번의 청년이 앉아, 매듭 지은 줄이 달린 작은 나무판을 눈앞에 들고 있다.'],
        [WOMEN, '(서로 팔꿈치를 찌르며 웃는다) 또 저기 앉았네. 저 얼굴로 별만 본다니, 아까워라.'],
        ['bx_oldman', '(그물을 내려놓으며 제독에게) 저 녀석이 그 큰 길잡이 이븐 마지드의 손자요. 할아버지가 몇 해 전 죽었는데, 사람들은 그 노인이 프랑크 사람들에게 인도로 가는 길을 가르쳐 주었다고 수군대지. 그래서 저 녀석은 프랑크 배에는 발도 안 올리오.'],
        ['SA', '(나무판을 내리고 제독을 본다. 숯처럼 검은 눈썹 아래 눈이 깊다) …할아버지는 끝까지 아니라 하셨소. 그 프랑크 함대를 인도로 데려간 건 구자라트의 다른 길잡이였다고. 그래도 사람들은 「큰 길잡이」의 이름이 더 재미있는 모양이오.'],
        ['SA', '선장, 그대도 길을 묻으러 왔소? 바다를 아는 사람에게만 가르쳐 드리오. 둘만 묻겠소.']
      ]); });
    var q1 = await UI.ask('「아프리카 해안에서 인도로 건너려면 어느 바람을 타야 하오?」', [
      { label: '여름의 남서 계절풍 — 봄이 끝날 무렵 떠난다', value: 'sw', icon: 'wind' },
      { label: '겨울의 북동 계절풍', value: 'ne', icon: 'wind' },
      { label: '바람은 상관없다 — 노를 저으면 된다', value: 'oar' }], me());
    var q2 = await UI.ask('「카말 판의 줄을 이로 물고, 판의 아랫단을 수평선에 맞추면 — 윗단은 무엇에 맞추오?」', [
      { label: '북극성', value: 'polaris', icon: 'star' },
      { label: '한낮의 해', value: 'sun', icon: 'sun' },
      { label: '보름달', value: 'moon', icon: 'moon' }], me());
    var right = (q1 === 'sw' ? 1 : 0) + (q2 === 'polaris' ? 1 : 0);
    b.quiz = right;
    if (right === 0) {
      b.said = 'quizFail'; b.saidCool = s.day + 60;
      await play([['SA', '(웃으며 다시 나무판을 든다) 바다는 아직 그대를 모르오, 선장. 계절풍이 한 번 더 바뀌면 다시 오시오.']]);
      log(c.name + ' 부두에서 이븐 마지드의 손자 사이드를 만났다. 그의 물음에 답하지 못했다.');
      return;
    }
    var qf = fame('ex', 'quiz');
    await play([['SA', right === 2 ? '(눈이 반짝인다) 둘 다요. 할아버지라면 그대를 배에 태우셨겠소. 남서풍은 사월 끝에 불기 시작하오. 그 바람을 놓치면 넉 달을 기다려야 하지. 그리고 별 — 줄의 매듭 하나가 손가락 하나만큼이오. 북극성이 매듭 몇 개 높이에 걸리느냐로 우리가 남북 어디쯤 있는지 아오.' : '하나는 맞혔구려. 나머지는 바다에서 배우면 되오.']]);
    b.said = 'met';
    await saidTrouble(c);
  }
  // 사이드 ② 붙잡힌 길잡이
  async function saidTrouble(c) {
    var b = st(), s = S(), k = K(), bribe = k.bribe || 600, talk = Math.min(0.9, 0.35 + skill('speech') * 0.15);
    await withPic('bx_pt', '붙잡힌 길잡이', function () { return play([
      [null, '그때 부두 끝에서 붉은 십자가 망토의 사내들이 다가온다. 앞선 선장이 사이드의 팔을 붙든다.'],
      ['bx_pt', '이븐 마지드의 손자라지? 잘됐다. 국왕 폐하의 함대에 길잡이가 모자라다. 너는 오늘부터 우리 배에서 별을 본다. 싫다면 — (칼자루를 툭 친다)'],
      ['SA', '(팔을 뿌리치지 않고 차분하게) 할아버지는 길을 가르쳤다는 말 때문에 평생을 괴로워하셨소. 나는 칼 끝에서 길을 가르치지 않소.']
    ]); });
    var v = await UI.ask('포르투갈 선장이 사이드를 끌고 가려 한다', [
      { label: '선원들과 함께 막아선다', value: 'fight', icon: 'sword' },
      { label: '선장에게 금화를 건넨다 (' + U.num(bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < bribe },
      { label: '「억지로 끌고 간 길잡이는 배를 암초로 몬다오」 — 말로 (' + Math.round(talk * 100) + '%)', value: 'talk', icon: 'scroll' }], me());
    var ok = false;
    if (v === 'bribe' && s.player.gold >= bribe) {
      s.player.gold -= bribe; ok = true;
      await play([['bx_pt', '(금화를 저울질하며) 흥, 길잡이야 다른 데서도 구하지. 이 녀석은 너무 곱상해서 선원들이 일을 안 할 거야.']]);
    } else if (v === 'talk' && U.chance(talk)) {
      ok = true;
      await play([['bx_pt', '(잠시 사이드를 노려보다가 팔을 놓는다) …그 말이 맞다. 칼로 끌고 간 길잡이 때문에 소코트라 앞에서 배 두 척을 잃었지. 가라.']]);
    } else {
      if (v === 'talk') await play([['bx_pt', '말이 많구나, 이방인. 끌고 가라!']]);
      var r = await fight('포르투갈 선원들', (k.foe || {}).pt || 14, { leader: '포르투갈 선장' });
      ok = r === 'win';
      if (!ok) await play([[null, '선원들에게 밀리는 사이 — 사이드가 스스로 몸을 빼어 부두 끝에서 바다로 뛰어들었다. 한참 뒤, 제독의 배 닻줄을 타고 젖은 몸으로 올라온다.'], ['SA', '(물을 털며 웃는다) 바다는 내 편이오. 늘.']]);
      ok = true;   // 지더라도 사이드는 바다로 빠져나온다
    }
    b.saidWay = v;
    await withPic('bx_said_deck', '갑판의 길잡이', function () { return play([
      [null, '그날 밤, 제독의 배 갑판. 사이드가 나무판을 들어 북극성을 잰다. 달빛이 그의 옆얼굴에 걸린다. 망대의 선원이 넋을 놓고 보다가 갑판장에게 꿀밤을 맞았다.'],
      ['SA', '선장, 나는 할아버지의 이름을 칼 끝에 두고 싶지 않소. 그대의 배라면 — 별을 읽어 드리겠소. 할아버지의 책도 함께.'],
      ['SA', '(종이 묶음을 내밀며) 『이로움의 책』, 할아버지가 쓰신 것을 내가 베꼈소. 별자리 스물여덟 집과 계절풍의 달력이 들어 있소. …다만 하나, 나는 바다와 혼인한 사람이오. 바다 말고는 아무것도 붙잡지 않소.']
    ]); });
    join('bx_said', 88); give('bx_fawaid'); b.said = 'joined';
    var sf = fame('ex', 'said');
    log(c.name + '에서 이븐 마지드의 손자 사이드를 ' + (v === 'bribe' ? '금화로 빼내' : v === 'talk' ? '말로 빼내' : '포르투갈 선원들에게서 지켜') + ' 항해사로 맞았다. 『이로움의 책』 사본을 받았다. (탐험 명성 +' + sf + ')');
    UI.toast('사이드 — 별을 읽는 길잡이가 배에 올랐다', 'star', 5600);
    refresh();
  }

  // ================================================================ 와이나 ① 파나마의 포로
  function panamaOpen() { var b = st(), t = today(); return !!(b && !b.wayna && !row('bx_wayna') && cityNow() === PANAMA && t >= D.panamaFrom && t <= D.panamaTo); }
  async function panama() {
    var b = st(), s = S(), k = K(), bribe = k.bribe || 600, talk = Math.min(0.9, 0.3 + skill('speech') * 0.15), partner = s.incaFall && s.incaFall.side === 'partner';
    await withPic('bx_panama', '파나마의 부두', function () { return play([
      [null, '파나마. 적도 남쪽에서 돌아온 바르톨로메 루이스의 배 곁에, 처음 보는 커다란 뗏목이 끌려와 묶여 있다. 발사나무 통나무를 엮고 무명 돛을 단 배다.'],
      ['bx_bosun', '남쪽 바다에서 저걸 붙잡았소. 금은 그릇에 에메랄드까지! 사공들은 거의 풀어 줬는데, 말을 배우게 하려고 젊은 놈 셋은 남겼지. 통역으로 쓰려고.'],
      [null, '갑판 기둥에 묶인 젊은이 하나가 고개를 든다. 구릿빛 넓은 어깨, 바닷바람에 그을렸어도 반듯한 이목구비. 묶인 채로도 그는 부두의 뗏목만 본다.'],
      ['WA', '(서툰 에스파냐 말로) …내 배. 저건 내 배요. 바람을 거슬러 가는 배. 당신들 배는 바람이 없으면 못 가지만, 저건 가오.'],
      partner ? ['bx_bosun', '(낄낄거리며) 피사로 나리께서 이 녀석을 남쪽 나라의 말을 배울 「예쁜 앵무새」라 부르시오. 그대도 동업자시니 알아 두시오.'] : null
    ]); });
    var v = await UI.ask('묶여 있는 뗏목 사공', [
      { label: '갑판장에게 금화를 건네 풀어 준다 (' + U.num(bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < bribe },
      { label: '「통역이라면 내 배에도 하나 있소」 — 말로 데려온다 (' + Math.round(talk * 100) + '%)', value: 'talk', icon: 'scroll' },
      { label: '지나친다', value: 'pass' }], me());
    var ok = false;
    if (v === 'bribe' && s.player.gold >= bribe) { s.player.gold -= bribe; ok = true; }
    else if (v === 'talk') ok = U.chance(talk);
    if (ok) {
      b.wayna = 'freed'; b.waynaWay = v;
      await play([['bx_bosun', v === 'bribe' ? '(금화를 받고 밧줄을 끊는다) 하나쯤 없어져도 아무도 모르오.' : '(어깨를 으쓱하며) 둘 남았으니 됐소. 데려가시오.'], ['WA', '(손목을 문지르며 제독의 눈을 똑바로 본다) …고맙소. 툼베스로 데려다주시오. 내 이름은 와이나요. 그곳에서 이 빚을 갚겠소.']]);
      log('파나마에서 루이스의 배에 묶여 있던 툼베스의 뗏목 사공 와이나를 풀어 주었다 — 툼베스로 데려다 달라고 한다.');
      UI.toast('와이나 — 툼베스로 데려다 달라고 한다', 'ship', 5200);
    } else {
      b.wayna = 'passed';
      await play([[null, v === 'talk' ? '갑판장이 고개를 젓는다. 「이 녀석은 피사로 나리 몫이오.」' : '제독은 발길을 돌렸다.'], [null, '돌아보니 묶인 젊은이는 여전히 부두의 뗏목만 보고 있었다.']]);
    }
    refresh();
  }

  // ================================================================ 와이나 ② 툼베스의 해변
  function tumbesOpen() { var b = st(), t = today(); return !!(b && b.wayna !== 'joined' && !row('bx_wayna') && cityNow() === TUMBES && t >= D.waynaFrom && t <= D.waynaTo); }
  async function tumbes() {
    var b = st(), freed = b.wayna === 'freed';
    await withPic('bx_tumbes', '툼베스의 해변', function () { return play(freed
      ? [[null, '툼베스. 맹그로브 숲 너머 해변에서 사람들이 환성을 지른다. 뱃머리에서 와이나가 뛰어내리자 아이들과 노인들이 그를 에워싼다.'],
        ['bx_curaca', '(금 귀마개를 흔들며 다가와) 바다가 삼킨 줄 알았던 와이나를 데려온 이가 그대요? 툼베스가 그대를 잊지 않겠소.']]
      : [[null, '툼베스. 해변에 커다란 발사 뗏목이 끌어 올려져 있다. 구릿빛 어깨의 젊은이가 새 무명 돛을 깁고 있다. 마을 처녀들이 바구니를 이고 지나가며 자꾸 뒤를 돌아본다.'],
        ['WA', '(제독을 보고 바늘을 멈춘다) …턱수염의 배에서 달아난 사공이오. 밤에 밧줄을 이로 끊었지. ' + (b.wayna === 'passed' ? '파나마 부두에서 그대 얼굴을 보았소. 그냥 지나간 사람.' : '그대는 처음 보는 얼굴이구려.')]]); });
    await play([['WA', '(뗏목 틈에 꽂힌 판자들을 두드리며) 선장, 바다 사람이라면 맞혀 보시오. 이 뗏목에는 키가 없소. 그런데 어떻게 바람을 거슬러 가겠소?']]);
    var q = await UI.ask('「키 없는 뗏목이 어떻게 바람을 거슬러 가겠소?」', [
      { label: '통나무 틈에 꽂은 판자(과라)를 넣었다 뺐다 하며 방향을 잡는다', value: 'guara', icon: 'compass' },
      { label: '사공들이 물속에서 헤엄쳐 민다', value: 'swim' },
      { label: '거스르지 못한다 — 바람 부는 쪽으로만 간다', value: 'no' }], me());
    b.waynaQuiz = q;
    await play(q === 'guara'
      ? [['WA', '(하얀 이를 드러내며 웃는다) 맞소! 뱃머리 쪽 판자를 내리면 바람을 비켜 가고, 꼬리 쪽을 내리면 바람을 안소. 할아버지의 할아버지 때부터 이렇게 바다를 건넜소.']]
      : [['WA', '(웃으며 고개를 젓는다) 아니오, 아니오. 이 판자요 — 과라. 이걸 넣었다 뺐다 하면 뗏목이 물고기처럼 꼬리를 트오. 바다 사람인데 이것도 몰랐소?']]);
    await withPic('bx_horizon', '수평선 너머', function () { return play([
      ['WA', '(돛 깁던 손을 멈추고 먼바다를 본다) 턱수염의 사람들은 다시 올 것이오. 그들은 금을 보았으니까. 쿠라카 어른은 걱정만 하시지.'],
      ['WA', '나는 그들이 오기 전에 수평선 너머를 보고 싶소. 그들이 어디서 오는지, 그 너머에 무엇이 있는지. 뗏목으로는 거기까지 못 가오. 그대의 배라면 — 데려가 주시오. 바람 거스르는 법은 내가 가르쳐 드리겠소.'],
      [VILLAGE, '(처녀들이 웅성거린다) 와이나가 떠난대! …아이고, 해변이 쓸쓸해지겠네.'],
      ['WA', '(어깨를 으쓱하며) 나는 바다와 혼인한 사람이오. 툼베스의 처녀들도 다 알지.']
    ]); });
    join('bx_wayna', freed ? 90 : 82); give('bx_guara'); b.wayna = 'joined';
    if (q === 'guara') fame('ex', 'quiz');
    var wf = fame('ex', 'wayna');
    log('툼베스에서 발사 뗏목 선장 와이나를 항해사로 맞았다. 「과라 판자」를 받았다. (탐험 명성 +' + wf + ')');
    UI.toast('와이나 — 바람을 거스르는 뗏목 선장이 배에 올랐다', 'ship', 5600);
    refresh();
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[saidOpen, said], [tumbesOpen, tumbes], [panamaOpen, panama]];
  BX.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  BX.check = async function () {
    if (BX._busy) return false; BX._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    BX._busy = false; refresh();
    return true;
  };
  BX._t = { said: said, panama: panama, tumbes: tumbes };
})(window.G = window.G || {});
