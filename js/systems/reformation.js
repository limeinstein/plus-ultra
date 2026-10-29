/* 루터의 종교 개혁 — 면죄받은 자들 (G.Reform) 2026-10-29 사용자 요청 — 추리 수사극
   「면죄받은 이들이 다시 죄를 짓는다」. 젊은 루터와 수녀 카타리나 폰 보라, 그리고 술통을 실은 제독이 마그데부르크에서 사건을 쫓는다.
   카타리나는 부패한 상관 그라우엔펠스 추기경에게 치를 떨고, 추기경은 그녀를 곁에 두려 한다. 포도주와 맥주로 성직자들의 혀를 풀어 부패를 밝히고,
   루터는 추기경을 고발하며 훗날의 종교 개혁을 준비한다. (사람·조정값: js/data/reformation.js)
   ■ 흐름 (마그데부르크)
     ① 사건 수첩 #1 「면죄받은 자들」 (1499~1510년, 짐칸에 술(포도주·맥주·브랜디·럼)이나 술 선물 아이템을 실은 채 들어서면):
        술집에서 젊은 루터가 제독의 술통을 알아본다. 미리 산 면죄부를 흔들며 다시 죄를 짓는 비단 상인 콘라트와 기사 쿠르트.
        면죄부마다 같은 붉은 인장, 죄보다 앞선 날짜 — 누군가 「앞으로 지을 죄」를 팔고 있다. 카타리나가 수녀원의 장부 한 장을 몰래 들고 온다.
     ② 수사 (그 뒤 들어설 때마다 「수사 수첩」 — 한 번에 여러 가지를, 순서는 자유)
        단서 ① 「참사회원의 포도주」 포도주 wine(또는 술 선물 하나): 취한 참사회원 볼프강 — 추기경의 인장 반지로 찍어 둔 「백지 면죄부」
        단서 ② 「수도사들의 맥주」 맥주 beer(또는 술 선물 하나): 지하 저장고의 수도사들 — 밤마다 비서 루프레히트가 돈궤를 추기경 집으로
        단서 ③ 「추기경의 연회」 (①② 뒤) 술 feast: 성직자들이 곯아떨어진 사이 카타리나가 서재를 연다 — 추기경이 그녀를 붙잡는다. 친필 장부
        추리 「누가, 무엇으로, 왜」 (①②③ 뒤): 세 물음 — wrongMax번 틀리면 그날은 고발하지 못한다(다음에 다시)
     ③ 고발: 루터가 고발장을 쓴다. 그날 밤 추기경의 사병 guards명이 성문에서 덮친다 (육상전 — 지면 다음에 다시).
        이기면 추기경은 로마로 소환되고 카타리나는 빈 맥주 통에 숨어 수녀원을 빠져나간다. 금고의 몫 chest — 가난한 이에게 나눌지, 가질지.
        기념품 「루터의 수첩 한 장」 · 루터(1517년부터 후원자 de_luther)의 신뢰.
     소식 (만난 사람만): 희년 면죄부(1501) · 벼락과 서원(1505) · 로마로 간 수도사(1510) · 신학 박사(1512) · 테첼의 노래(1517.4) ·
           [사건을 풀었으면] 비텐베르크의 문(1517.10.31) · 수녀원의 탈출(1523, 풀지 못했으면) · 루터와 카타리나의 혼례(1525)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/lu_*.webp — images/legend-events/REFORMATION_PROMPT.md
   ■ 저장: s.reform = { met, clue: {canon, monks, feast}, wrong, accused, solved, lostAt, gave: 'poor'|'keep', told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var RF = G.Reform = {};
  function K() { return G.BALANCE.reform; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  var NEWS = ['jubilee', 'storm', 'rome', 'doctor', 'tetzel', 'door', 'escape', 'wed'];
  var NEWS_AT = { jubilee: 15010415, storm: 15050702, rome: 15101115, doctor: 15121019, tetzel: 15170410, door: 15171031, escape: 15230405, wed: 15250613 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.reform) { s.reform = { told: {}, clue: {} }; NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.reform.told[k] = 1; }); }
    var b = s.reform; b.told = b.told || {}; b.clue = b.clue || {};
    return b;
  }
  RF.state = st;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker('lu_' + id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(k) { return k === 'P' ? me() : k ? H(k) : {}; }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function log(t) { G.State.log(t); }
  function luTitle() { var t = today(); return t < 15010101 ? '아이제나흐 라틴어 학교의 학생' : t < 15050717 ? '에르푸르트 대학의 법학도' : '아우구스티노회의 젊은 수도사'; }
  function nClues() { var c = st().clue; return (c.canon ? 1 : 0) + (c.monks ? 1 : 0) + (c.feast ? 1 : 0); }

  // ================================================================ 술 — 교역품(포도주·맥주·브랜디·럼)과 술 선물 아이템
  var DRINKS = ['wine', 'beer', 'brandy', 'rum'];
  function q(id) { var c = S().fleet.cargo || {}; return c[id] ? c[id].q || 0 : 0; }
  function take(id, n) { var c = S().fleet.cargo; if (!c[id]) return 0; var t = Math.min(n, c[id].q); c[id].q -= t; if (c[id].q <= 0) delete c[id]; return t; }
  function drinkItem() { return (S().player.items || []).filter(function (it) { var d = G.ITEM[it.id]; return d && d.mg === 'drink'; })[0] || null; }
  RF.drinkTotal = function () { return U.sum(DRINKS, q); };
  RF.hasDrink = function () { return RF.drinkTotal() > 0 || !!drinkItem(); };
  /** 술 n을 아무 술에서나 덜어 낸다 (많은 것부터) */
  function takeAny(n) { var left = n; DRINKS.slice().sort(function (a, b) { return q(b) - q(a); }).forEach(function (id) { if (left > 0) left -= take(id, left); }); return n - left; }

  // ================================================================ ① 사건 수첩 #1 — 면죄받은 자들
  function meetOpen() { var b = st(), t = today(); return !!(b && !b.met && cityNow() === K().city && t >= K().from && t <= K().to && RF.hasDrink()); }
  async function meet() {
    var b = st(), s = S(); b.met = 1;
    var what = q('wine') ? '포도주' : q('beer') ? '맥주' : q('brandy') ? '브랜디' : q('rum') ? '럼주' : G.ITEM[drinkItem().id].name;
    await withPic('lu_case', '사건 수첩 #1 — 면죄받은 자들', function () { return play([
      [null, '마그데부르크, 대성당 그늘 아래 술집 「황금 사슴」. 탁자 하나에 검은 옷의 젊은이가 앉아 종이에 무언가를 빼곡히 적고 있다. ' + luTitle() + '라고 한다.'],
      ['luther', '(고개를 들고 코를 킁킁거리며) 실례지만 선장, 부두에서 ' + what + ' 냄새가 나는 짐을 내린 분이시오? …좋소. 오늘 밤 그 술통이 하느님의 일에 쓰일지도 모르겠소.'],
      ['luther', '마르틴 루터라 하오. 이 도시에서 이상한 일이 벌어지고 있소. 들어 보시겠소?'],
      [null, '— 사건 수첩 #1. 지난달, 비단 상인 콘라트가 저울에 납을 붙여 과부의 비단을 속여 샀다. 붙잡히자 그는 품에서 붉은 인장이 찍힌 종이를 꺼내 흔들었다.'],
      ['konrad', '이게 뭔지 아시오? 면죄부요! 그것도 「앞으로 지을 죄까지」 사해 주는 것. 값은 이미 치렀소. 그러니 나는 죄인이 아니오!'],
      [null, '— 사건 수첩 #2. 열흘 전, 기사 쿠르트가 세금을 못 낸 농부의 헛간에 불을 질렀다. 불길 앞에서 그는 같은 종이를 들고 웃었다.'],
      ['kurt', '하느님께 미리 값을 치렀다. 연옥 불도 내 몫은 다 꺼졌지. 이깟 헛간 불이 대수냐?'],
      ['luther', '두 종이를 내가 직접 보았소. 같은 붉은 인장. 그리고 이상한 점 — 면죄부에 적힌 날짜가 죄를 지은 날보다 앞서 있소. 누군가 「아직 짓지 않은 죄」를 돈 받고 팔고 있다는 뜻이오.'],
      ['luther', '죄를 돈으로 미리 사면 사람은 죄를 죄로 여기지 않게 되오. 면죄받은 자들이 다시 죄를 짓는 거요. 이건 교회가 영혼을 파는 게 아니라… 죄를 파는 거요.'],
      [null, '그때 술집 문이 조용히 열린다. 흰 두건에 검은 수녀복을 입은 여인이 주위를 살피며 들어와 루터의 탁자에 앉는다. 스물넷쯤 되어 보이는, 눈매가 단호한 여인이다.'],
      ['katharina', '카타리나 폰 보라예요. 그라우엔펠스 추기경님이 거느리는 수녀원의 수녀죠. …마르틴, 가져왔어요. 수녀원 지하 저장고 장부 한 장.'],
      ['katharina', '봐요. 「희년 헌금」으로 들어온 돈이 포도주 서른 통, 사냥개, 비단 이불로 나가요. 그리고 추기경님 연회 날마다 수녀들이 시중을 들러 불려 가요. …저도요. 그분은 저를 곁에 두고 싶어 하세요. 밤마다 서재로 부르시죠. 저는 한 번도 가지 않았어요. 그 손이 닿는 것조차 소름 끼쳐요.'],
      ['luther', '(주먹을 쥐며) 카타리나, 위험한 일이오. 그래도… 장부 한 장으로는 추기경을 고발할 수 없소. 취한 사람의 말, 숨겨 둔 장부, 인장 — 증거가 더 필요하오.'],
      ['luther', '선장. 성직자들은 술 앞에서 입이 가벼워지오. 당신의 술통으로 그 입을 열어 주시오. 나는 머리로, 카타리나는 열쇠로, 당신은 술로. 함께 이 사건을 풀어 봅시다.']
    ]); });
    log('마그데부르크에서 ' + luTitle() + ' 마르틴 루터와 수녀 카타리나 폰 보라를 만났다. 「앞으로 지을 죄」를 사하는 면죄부의 뒤를 함께 쫓기로 했다.');
    UI.toast('사건 수첩 — 술로 성직자들의 입을 열어 단서 셋을 모으자 (포도주 ' + K().wine + ' · 맥주 ' + K().beer + ' · 연회의 술 ' + K().feast + ')', 'scroll', 6500);
    await investigate();
  }

  // ================================================================ ② 수사 수첩
  function caseOpen() { var b = st(); return !!(b && b.met && !b.solved && cityNow() === K().city && today() <= K().until && (!b.lostAt || U.dayIndex(S().date) - b.lostAt >= 7)); }
  async function investigate() {
    var b = st();
    for (var guard = 0; guard < 8 && !b.solved; guard++) {
      var c = b.clue, di = drinkItem(), opts = [];
      if (!c.canon) opts.push({ label: '단서 ① 참사회원 볼프강에게 포도주를 대접한다 (포도주 ' + K().wine + (di ? ' 또는 「' + G.ITEM[di.id].name + '」' : '') + ' · 지금 ' + q('wine') + ')', value: 'canon', icon: 'mug', dis: q('wine') < K().wine && !di });
      if (!c.monks) opts.push({ label: '단서 ② 수도원 지하의 수도사들에게 맥주를 돌린다 (맥주 ' + K().beer + (di ? ' 또는 「' + G.ITEM[di.id].name + '」' : '') + ' · 지금 ' + q('beer') + ')', value: 'monks', icon: 'mug', dis: q('beer') < K().beer && !di });
      if (!c.feast) opts.push({ label: '단서 ③ 추기경의 연회에 술을 들인다 (술 ' + K().feast + ' · 지금 ' + RF.drinkTotal() + (c.canon && c.monks ? '' : ' · 단서 ①② 뒤') + ')', value: 'feast', icon: 'castle', dis: !(c.canon && c.monks) || RF.drinkTotal() < K().feast });
      if (nClues() === 3) opts.push({ label: '추리한다 — 누가, 무엇으로, 왜 (단서 3/3)', value: 'deduce', icon: 'eye' });
      opts.push({ label: '오늘은 여기까지', value: 'later' });
      var v = await UI.ask('수사 수첩 — 단서 ' + nClues() + '/3 · 「면죄받은 자들은 왜 다시 죄를 짓는가」', opts, me());
      if (v === 'canon') await canon();
      else if (v === 'monks') await monks();
      else if (v === 'feast') await feast();
      else if (v === 'deduce') { await deduce(); return; }
      else { if (nClues() < 3) UI.toast('수사는 마그데부르크에 다시 들르면 이어진다 (단서 ' + nClues() + '/3)', 'scroll', 4200); return; }
    }
  }
  function pay(id, n) { if (q(id) >= n) { take(id, n); return G.GOOD[id].name + ' ' + n; } var it = drinkItem(); if (it) { R.removeItemObject(it); return '「' + G.ITEM[it.id].name + '」'; } return ''; }
  async function canon() {
    var b = st(), paid = pay('wine', K().wine); b.clue.canon = 1;
    await withPic('lu_wine', '단서 ① 참사회원의 포도주', function () { return play([
      [null, '대성당 참사회 숙소. 딸기코의 늙은 신부 볼프강이 제독이 가져온 ' + paid + U.jx(paid, '을/를') + ' 보더니 눈을 반짝인다.'],
      ['canon', '오호, 이건 라인 강 것이로군! 한 잔만… 아니, 한 잔 더. 하느님이 포도를 만드신 데는 다 뜻이 있으니까.'],
      [null, '세 잔째. 볼프강의 혀가 꼬이기 시작한다. 루터가 넌지시 묻는다. 「신부님, 요즘 면죄부가 아주 잘 팔린다지요?」'],
      ['canon', '잘 팔리다마다! 히끅. 추기경 각하께서는 머리가 좋으셔. 교황청 사절이 내려오기 전에 미리 찍어 두셨지. 날짜도 이름도 없는 백지 면죄부를 수백 장. 각하의 반지 인장으로 꾹꾹.'],
      ['canon', '사는 놈이 이름을 대면 루프레히트가 날짜를 앞당겨 적어 준다네. 「앞으로 지을 죄까지」라는 말은 값을 두 배로 받는 주문이지. 쉿 — 이건 비밀일세. 한 잔 더 따르게.'],
      ['luther', '(제독에게 낮게) 인장 반지 — 추기경 손가락의 그것이오. 그리고 비서 루프레히트. 단서 하나.']
    ]); });
    log('마그데부르크에서 참사회원 볼프강에게 ' + paid + U.jx(paid, '을/를') + ' 대접했다. 추기경의 인장 반지로 찍은 「백지 면죄부」 이야기를 들었다. (단서 ' + nClues() + '/3)');
    UI.toast('단서 ① 백지 면죄부와 추기경의 인장 반지', 'scroll', 4600);
  }
  async function monks() {
    var b = st(), paid = pay('beer', K().beer); b.clue.monks = 1;
    await withPic('lu_beer', '단서 ② 수도사들의 맥주', function () { return play([
      [null, '수도원 지하 저장고. 촛불 아래 평수사들이 둘러앉아 있다. 제독이 ' + paid + U.jx(paid, '을/를') + ' 굴려 넣자 함성이 터진다.'],
      ['katharina', '(두건을 깊이 눌러쓰고 제독 곁에 서서) 이 사람들은 나쁜 이들이 아니에요. 그저 입이 가벼울 뿐이죠. 맥주가 돌면 무엇이든 말해요.'],
      [null, '한 통이 비고, 두 통째. 얼굴이 벌게진 수사 하나가 탁자를 치며 노래를 부른다. 「돈궤에 동전이 짤랑, 영혼이 연옥에서 펄쩍!」 — 요즘 면죄부 설교사들이 부르는 노래다.'],
      ['luther', '형제여, 그 돈궤는 결국 어디로 가오? 성당 지붕을 고치는 데 쓰이오?'],
      [null, '「지붕?」 수사들이 깔깔 웃는다. 「밤마다 비서 루프레히트 나리가 돈궤를 수레에 싣고 추기경 각하 저택 뒷문으로 가지. 그 저택엔 사냥개가 마흔 마리, 주사위 판이 밤새 돌고… 장부는 각하께서 손수 쓰신다던데. 아무도 못 보게 서재 궤짝에 넣어 두고!」'],
      ['luther', '(제독에게) 돈은 추기경 저택으로. 그리고 장부는 그의 서재 궤짝에. 단서 둘. 이제 서재로 들어갈 길만 남았소.']
    ]); });
    log('마그데부르크 수도원 지하에서 수사들에게 ' + paid + U.jx(paid, '을/를') + ' 돌렸다. 면죄부 돈궤가 밤마다 추기경 저택으로 간다는 것, 장부가 서재 궤짝에 있다는 것을 들었다. (단서 ' + nClues() + '/3)');
    UI.toast('단서 ② 밤마다 추기경 저택으로 가는 돈궤 · 서재의 장부', 'scroll', 4600);
  }
  async function feast() {
    var b = st(); takeAny(K().feast); b.clue.feast = 1;
    await withPic('lu_feast', '단서 ③ 추기경의 연회', function () { return play([
      [null, '그라우엔펠스 추기경의 저택. 제독이 「선물」로 들인 술통이 연회장에 줄지어 놓인다. 참사회원들, 수도원장, 도시의 부자들 — 그리고 품에 면죄부를 넣은 콘라트와 쿠르트도 보인다. 수녀들이 잔을 채우며 오간다.'],
      ['cardinal', '(잔을 들며) 바다에서 온 선장의 술이라니, 하느님이 오늘 밤을 축복하시는구려! 마셔라, 마셔! 죄는 내일 다 사해 줄 테니. 하하하!'],
      [null, '자정. 성직자들이 하나둘 탁자에 엎어진다. 카타리나가 눈짓을 하고 열쇠 꾸러미를 꺼낸다. 루터와 제독이 그 뒤를 따라 어두운 복도로.'],
      [null, '서재. 궤짝 안에 두툼한 장부가 있다. 추기경의 친필 — 이름, 날짜, 그리고 「미래의 죄」라는 칸과 값. 콘라트 40굴덴, 쿠르트 60굴덴… 그 옆에 「포도주 서른 통」, 「사냥개」, 「주사위 빚」.'],
      [null, '그때 문이 열린다. 비틀거리는 추기경이 촛대를 들고 서 있다. 그의 눈이 카타리나에게 꽂힌다.'],
      ['cardinal', '카타리나… 드디어 내 서재에 왔구나. 내가 몇 번이나 불렀는데. (그녀의 손목을 붙잡으며) 넌 내 곁에 있어야 한다. 수녀원 담 안의 짐승들이 아니라 나 같은 사람 곁에.'],
      ['katharina', '(손목을 비틀어 빼며) 손 치우세요! 당신은 하느님의 이름으로 죄를 팔고, 그 돈으로 술을 마시고, 수녀들을 시중꾼으로 부리죠. 당신 곁에 서느니 수녀원 우물에 뛰어들겠어요.'],
      ['luther', '(추기경과 카타리나 사이로 들어서며) 추기경 각하, 많이 취하셨습니다. 이분을 놓아주십시오. …내일 아침이면 오늘 밤 일을 기억하지 못하실 겁니다.'],
      [null, '추기경은 눈을 끔뻑이더니 그대로 소파에 쓰러져 코를 곤다. 카타리나의 손이 떨린다. 그러나 다른 손에는 장부가 꼭 쥐어져 있다.'],
      ['luther', '단서 셋. 이제 머리를 쓸 차례요, 선장.']
    ]); });
    log('추기경의 연회에 술 ' + K().feast + U.jx(String(K().feast), '을/를') + ' 들였다. 성직자들이 곯아떨어진 사이 카타리나와 함께 서재에서 추기경의 친필 장부를 찾았다. (단서 3/3)');
    UI.toast('단서 ③ 추기경의 친필 장부 — 이름·날짜·「미래의 죄」·값', 'scroll', 5000);
  }

  // ================================================================ 추리 — 누가, 무엇으로, 왜
  var QS = [
    { q: '추리 ① — 「앞으로 지을 죄」를 사하는 면죄부를 꾸며 판 사람은?', a: 'cardinal', opts: [['tetzel', '면죄부 설교사 요한 테첼'], ['canon', '참사회원 볼프강'], ['cardinal', '그라우엔펠스 추기경'], ['ruprecht', '비서 루프레히트']],
      ok: '그렇소. 인장은 추기경의 반지, 장부는 추기경의 글씨. 루프레히트는 날짜를 적고 돈궤를 나른 손일 뿐이고, 볼프강은 그저 취한 입이오.',
      no: { tetzel: '테첼은 노래를 부르며 면죄부를 팔지만, 이 마그데부르크의 백지 면죄부에는 그의 인장이 없소. 반지 인장을 떠올려 보시오.', canon: '볼프강은 술을 마시고 떠벌렸을 뿐이오. 그가 인장을 가졌던가?', ruprecht: '루프레히트는 손이오. 그 손을 움직인 머리는 누구요? 서재의 장부는 누구 글씨였소?' } },
    { q: '추리 ② — 고발장에 붙일 결정적 증거는?', a: 'ledger', opts: [['ledger', '추기경의 친필 장부 — 이름·날짜·「미래의 죄」·값'], ['drunk', '취한 참사회원과 수사들의 말'], ['song', '설교사들의 돈궤 노래'], ['kath', '카타리나의 증언 하나']],
      ok: '바로 그거요. 취한 사람의 말은 술이 깨면 사라지지만, 글씨는 남소. 카타리나의 증언은 장부를 받쳐 주는 기둥이 될 거요.',
      no: { drunk: '술이 깨면 그들은 모른다고 할 거요. 술은 입을 여는 열쇠였지, 증거가 아니오.', song: '노래는 백성의 귀를 홀릴 뿐 법정에서는 아무것도 증명하지 못하오.', kath: '카타리나의 용기는 귀하오. 하지만 저들은 「수녀 하나의 앙심」이라 할 거요. 그 말을 받쳐 줄 글씨가 있지 않소?' } },
    { q: '추리 ③ — 면죄받은 자들은 왜 다시 죄를 지었는가?', a: 'paid', opts: [['paid', '죄를 돈으로 미리 샀으니 더는 죄가 아니라고 여겨서'], ['devil', '악마가 씌어서'], ['fake', '면죄부가 가짜라서 효력이 없어서'], ['poor', '가난해서 어쩔 수 없이']],
      ok: '그렇소. 뉘우침 없이 돈으로 산 용서는 죄를 지우지 않고 죄를 부추기오. 참된 회개는 금고에 떨어지는 동전 소리가 아니라 가슴에서 나는 거요. …이 말을 언젠가 모두가 읽을 수 있게 써 붙이겠소.',
      no: { devil: '악마 탓은 쉽소. 하지만 콘라트와 쿠르트는 웃으면서 종이를 흔들었소. 무엇을 믿고 웃었겠소?', fake: '가짜든 진짜든, 그들은 그것을 믿었소. 문제는 그 믿음이 무엇을 허락했느냐요.', poor: '콘라트는 비단 상인이고 쿠르트는 기사요. 가난이 아니었소. 그들 품에 무엇이 있었지?' } }
  ];
  async function deduce() {
    var b = st(); b.wrong = 0;
    await play([['luther', '자, 선장. 사건 수첩을 펼칩시다. 세 가지만 맞히면 고발장을 쓸 수 있소. 틀리면 저들이 우리를 비웃을 거요.']]);
    for (var i = 0; i < QS.length; i++) {
      var Q = QS[i], solved = false;
      while (!solved) {
        var v = await UI.ask(Q.q, Q.opts.map(function (o) { return { label: o[1], value: o[0] }; }), me());
        if (v === Q.a) { solved = true; await play([['luther', Q.ok]]); }
        else {
          b.wrong++;
          await play([['luther', Q.no[v] || '다시 생각해 보시오.']]);
          if (b.wrong >= K().wrongMax) {
            await play([['katharina', '마르틴, 오늘은 그만해요. 이대로 고발했다간 우리가 거짓말쟁이가 돼요. 증거를 다시 들여다보고, 다음에 해요.']]);
            log('마그데부르크에서 루터와 사건을 추리했지만 엇갈렸다. 다음에 다시 맞춰 보기로 했다.');
            UI.toast('추리가 엇갈렸다 — 마그데부르크에 다시 들르면 다시 추리할 수 있다', 'eye', 4800);
            return;
          }
        }
      }
    }
    await accuse();
  }

  // ================================================================ ③ 고발
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, n, false, Object.assign({ kind: 'garrison' }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  async function accuse() {
    var b = st(), s = S(); b.accused = 1;
    await withPic('lu_accuse', '고발', function () { return play([
      ['luther', '(밤새 쓴 고발장을 접으며) 대주교 각하와 교황 사절께 보낼 고발장이오. 장부의 사본, 볼프강과 수사들의 이름, 콘라트와 쿠르트의 면죄부 두 장. 그리고 카타리나의 증언.'],
      ['katharina', '내 이름도 적어요. 숨지 않겠어요.'],
      [null, '그날 밤, 성문 앞. 횃불이 줄지어 켜진다. 추기경의 사병들이 길을 막는다. 앞장선 것은 창백한 얼굴의 비서 루프레히트.'],
      ['ruprecht', '그 장부를 내놓으시오. 각하께서는 오늘 밤 일을 없던 일로 하자 하시오. 수녀는 수녀원으로 돌아가고, 학생은 책상으로, 선장은 바다로. 아니면…']
    ]); });
    var r = await fight('추기경의 사병', K().guards, { kind: 'garrison', guns: true, leader: '비서 루프레히트' });
    if (r !== 'win') {
      b.lostAt = U.dayIndex(s.date); b.accused = 0;
      await play([[null, '사병들에게 밀려 성문 밖으로 쫓겨났다. 다행히 장부는 카타리나의 수녀복 안에 무사하다.'], ['katharina', '아직 끝나지 않았어요. 장부는 내가 지켜요. 일주일 뒤에 다시 와요.']]);
      log('마그데부르크 성문에서 추기경의 사병들에게 밀려났다. 장부는 카타리나가 지켰다.');
      UI.toast('밀려났다 — 일주일 뒤 마그데부르크에서 다시 고발할 수 있다', 'scroll', 4800);
      refresh(); return;
    }
    b.solved = today();
    await withPic('lu_freedom', '빈 맥주 통', function () { return play([
      ['ruprecht', '(무릎을 꿇고) …각하께서 시키신 일이오! 나는 날짜를 적었을 뿐이오! 모두 말하겠소!'],
      [null, '열흘 뒤. 대주교의 법정이 열렸다. 루프레히트의 자백과 친필 장부 앞에서 그라우엔펠스 추기경은 말을 잃었다. 그는 로마로 소환되었고, 백지 면죄부 수백 장은 성당 마당에서 불태워졌다. 콘라트는 과부에게 비단 값을 물어 주었고, 쿠르트는 농부의 헛간을 다시 지어야 했다.'],
      ['katharina', '(빈 맥주 통 하나를 툭툭 두드리며) 선장, 부탁이 하나 있어요. 이 수녀원에 더는 있고 싶지 않아요. 저 통 하나만 빌려줘요. 수레에 실려 성문을 나가면… 아무도 수녀 하나가 맥주 통에 들어 있을 줄은 모를 거예요.'],
      ['luther', '(웃음을 참으며) 카타리나, 당신은 정말… 대담하구려.'],
      ['katharina', '대담한 게 아니라 질린 거예요, 마르틴. 하느님은 담 안에도 밖에도 계세요. 나는 밖에서 그분을 찾겠어요.'],
      [null, '이튿날 새벽, 제독의 수레가 빈 맥주 통을 싣고 성문을 나선다. 성문지기는 하품만 했다.']
    ]); });
    var v = await UI.ask('추기경의 금고에서 나온 몫 — 금화 ' + U.num(K().chest) + '닢', [
      { label: '가난한 이들에게 나눈다 — 면죄부를 산 사람들은 대개 가난한 이들이었다', value: 'poor', icon: 'heart' },
      { label: '수고한 몫으로 챙긴다', value: 'keep', icon: 'coin' }], me());
    var so = fame('so', K().fame + (v === 'poor' ? 120 : 0));
    if (v === 'poor') {
      b.gave = 'poor';
      if (G.Sponsor && G.SPONSOR && G.SPONSOR.de_luther) G.Sponsor.addTrust(G.Sponsor.rel('de_luther'), K().trust);
      await play([['luther', '…고맙소. 당신은 술통으로 시작해서 빵으로 끝냈구려.']]);
    } else {
      b.gave = 'keep'; s.player.gold += K().chest;
      await play([['luther', '(쓴웃음을 지으며) 뱃사람에게도 먹고살 길은 있어야겠지요. 다만 기억하시오 — 동전 소리는 죄를 지우지 못한다는 것을.']]);
    }
    await play([['luther', '이 수첩 한 장을 가져가시오. 오늘 우리가 푼 것을 적어 두었소. 이것은 마그데부르크 한 곳의 일이 아니오. 독일 곳곳에, 로마에까지 같은 금고가 있소. 언젠가 이 모든 것을 낱낱이 적어 교회 문에 붙이겠소. 모든 사람이 읽을 수 있게.']]);
    var got = R.addItem ? R.addItem('luther_note') : false;
    log('마그데부르크에서 루터·카타리나와 함께 「앞으로 지을 죄」를 판 그라우엔펠스 추기경을 고발했다. 추기경은 로마로 소환되었고, 카타리나는 빈 맥주 통에 숨어 수녀원을 떠났다. (사교 명성 +' + so + (v === 'keep' ? ' · 금화 +' + U.num(K().chest) : '') + ')');
    UI.toast(got !== false ? '사건 해결 — 기념품 「루터의 수첩 한 장」' : '사건 해결 — 소지품이 가득 차 수첩은 받지 못했다', 'scroll', 6000);
    refresh();
  }

  // ================================================================ 소식 (만난 사람만)
  RF.daily = function () {
    var b = st(), out = []; if (!b || !b.met) return out;
    var t = today(), told = b.told, sol = !!b.solved;
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('jubilee', true, 'coin', '【희년 면죄부】 교황의 사절이 독일 곳곳을 돌며 희년 면죄부를 판다. 성당 마당마다 돈궤가 놓이고, 사람들은 죽은 부모의 연옥 날수를 동전으로 줄이려 줄을 선다.');
    news('storm', true, 'scroll', '【벼락과 서원】 에르푸르트 가까운 들판에서 벼락을 맞을 뻔한 법학도 마르틴 루터가 「성 안나여, 살려 주시면 수도사가 되겠습니다!」 하고 외쳤다. 그는 약속대로 아우구스티노회 수도원 문을 두드렸다.' + (sol ? ' 마그데부르크 사건 때 그의 눈빛을 본 사람이라면 놀라지 않을 일이다.' : ''));
    news('rome', true, 'church', '【로마로 간 수도사】 루터가 수도회 일로 로마에 갔다. 성 계단을 무릎으로 오르며 기도하던 그는 꼭대기에서 중얼거렸다고 한다. 「이것이 참말인지 누가 아는가?」 로마의 사치는 그의 눈에 마그데부르크의 금고를 떠올리게 했다.');
    news('doctor', true, 'book', '【비텐베르크의 신학 박사】 마르틴 루터가 비텐베르크 대학에서 신학 박사가 되어 성서를 가르치기 시작했다.');
    news('tetzel', true, 'coin', '【테첼의 노래】 도미니코회 설교사 요한 테첼이 면죄부를 팔며 노래한다. 「돈궤에 동전이 짤랑 울리면, 영혼이 연옥에서 펄쩍 뛰어오른다!」 마그데부르크 대주교의 땅이다.' + (sol ? ' 「앞으로 지을 죄」를 팔던 그 금고가 또다시 열렸다.' : ''));
    news('door', sol, 'scroll', '【비텐베르크의 문】 10월 31일, 마르틴 루터가 비텐베르크 성채 교회 문에 95개조 논제를 내걸었다. 그 가운데 한 줄 — 「가난한 이에게 주는 것이 면벌부를 사는 것보다 낫다」. 그 아래쪽에는 오래전 마그데부르크의 술집에서 적었다는 말이 있었다. 「면죄받은 자들은 왜 다시 죄를 짓는가.」 종교 개혁이 시작되었다.');
    news('escape', !sol, 'heart', '【수녀원의 탈출】 부활절 전날 밤, 님프셴 수녀원의 수녀 열둘이 청어 통을 실은 상인의 수레에 숨어 빠져나왔다. 그 가운데 카타리나 폰 보라라는 수녀가 있었다.');
    news('wed', true, 'heart', '【루터와 카타리나의 혼례】 마르틴 루터가 옛 수녀 카타리나 폰 보라와 혼인했다. 그녀는 비텐베르크의 낡은 수도원을 살림집으로 바꾸고, 맥주를 빚고, 손님 서른 명의 밥상을 차린다. 루터는 아내를 「나의 주인 케테」라고 부른다고 한다.' + (sol ? ' 마그데부르크의 빈 맥주 통 이야기를 아는 사람들은 웃음을 참지 못한다.' : ''));
    return out;
  };

  // ================================================================ 도시에 들어설 때 · 수첩
  RF.pending = function () { var s = S(); if (!s || cityNow() !== K().city) return false; return meetOpen() || caseOpen(); };
  RF.check = async function () {
    if (RF._busy) return false; RF._busy = true;
    try {
      if (meetOpen()) await meet();
      else if (caseOpen()) {
        var b = st();
        await play([['luther', b.wrong >= K().wrongMax && nClues() === 3 ? '다시 왔구려, 선장. 증거를 차분히 다시 짚어 봅시다.' : '왔구려, 선장! 수사 수첩을 펼칩시다. 술통은 넉넉하오?']]);
        await investigate();
      }
    } catch (e) { console.error(e); }
    RF._busy = false;
    return true;
  };
  RF.html = function () {
    var s = S(), b = s && s.reform; if (!b || !b.met || b.solved || today() > K().until) return '';
    var c = b.clue, li = [];
    li.push((c.canon ? '✓' : '·') + ' 단서 ① 참사회원 볼프강에게 포도주 ' + K().wine);
    li.push((c.monks ? '✓' : '·') + ' 단서 ② 수도원 지하 수사들에게 맥주 ' + K().beer);
    li.push((c.feast ? '✓' : '·') + ' 단서 ③ 추기경의 연회에 술 ' + K().feast + ' (①② 뒤)');
    if (nClues() === 3) li.push('마그데부르크에서 루터와 추리하고 고발한다');
    return '<div class="sep"></div><h4 style="margin:0 0 8px">사건 수첩 — 면죄받은 자들 (마그데부르크)</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._reformHtml) { G.Court._reformHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + RF.html(); }; }
  (function hookDaily() {
    var W = G.World; if (!W || W._reform) return;
    W._reform = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(RF.daily()); } catch (e) { console.error(e); } return out; };
  })();
  RF._t = { meet: meet, investigate: investigate, canon: canon, monks: monks, feast: feast, deduce: deduce, accuse: accuse };
})(window.G = window.G || {});
