/* 정화의 보선 (G.ZhengHe) — 2026-11-08 사용자 요청. 사람·조정값: js/data/zhenghe.js (G.BALANCE.zhenghe)
   ■ 시작 (도시에 들어설 때, js/scenes/city.js): 통합 명성 minFame 이상 · 중국인 항해사(중국말이 모국어이고 항해사 자리이거나 항해 특기 navSkill 이상)가
     함대에 있을 때, 말린디·모가디슈에서 늙은 뱃사람이 「밤바다의 아홉 돛대 배」 이야기를 한다 → 그 항해사가 정화의 보선임을 알아본다
   ■ 여정 (바다의 하루 끝, js/scenes/sea.js): 단계마다 정해진 앞바다(K.stages[n].box)에 닿으면 유령 보선이 나타난다 → 큰 해전(G.Rel.greatBattle)
     이기면 금화(3만 · 5만 · 7만 · 마지막 20만)와 전투 명성 — 유령선은 끌고 갈 수 없다(noPrize) · 해전 그림에서 푸르게 비친다(npc.ghost)
     물러나거나 지면 again일 뒤 같은 바다에 다시 나타난다 (싸울 때마다 해전 열쇠가 달라진다: zh_<단계>_<번째>)
     이긴 다음 날(바다든 항구든) 항해사가 유령선의 패를 읽어 다음 바다를 알려 준다
   ■ 끝: 황해의 보선 다섯 척 — 마지막 보선을 무찌르면 정화의 혼령이 막야(무력 42)를 내준다
   ■ 저장: s.zhenghe = { step: 0 소문 전 · 1~4 찾는 중 · 5 끝, won: {n: 날}, after: 막 이긴 단계, fight: 싸우는 중인 단계, tries, cool, nav: 소문을 함께 들은 항해사 id }
   ■ 장면 그림: images/legend-events/zh_* — ZHENGHE_PROMPT.md */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var ZH = G.ZhengHe = {};
  function K() { return G.BALANCE.zhenghe; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); if (!s) return null; if (!s.zhenghe) s.zhenghe = { step: 0, won: {}, tries: 0 }; s.zhenghe.won = s.zhenghe.won || {}; return s.zhenghe; }
  ZH.state = st;
  function stage(n) { return K().stages[n]; }
  function num(n) { return U.num(Math.round(n)); }
  function log(t) { G.State.log(t); }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fameNow() { return G.Fame ? G.Fame.get() : (S().player.fame || 0); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }

  // ---------------------------------------------------------------- 중국인 항해사
  /** 중국말이 모국어인 사람 (중국 쪽 생김새 · 생김새가 정해지지 않은 사람) */
  function chinese(id) { var d = G.MATE[id]; return !!(d && d.lg && d.lg[7] >= 3 && (!d.style || d.style === 'cn')); }
  ZH.chinese = chinese;
  /** 함대에 있는 중국인 항해사 (항해사 자리가 먼저) — 없으면 null */
  ZH.navigator = function () {
    var s = S(); if (!s || !s.mates) return null;
    var list = s.mates.filter(function (m) { return m && chinese(m.id) && !(R.mateHidden && R.mateHidden(m)); });
    return list.filter(function (m) { return m.role === 'nav'; })[0] || list.filter(function (m) { return R.mateSkill(m, 'nav') >= (K().navSkill || 1); })[0] || null;
  };
  /** 말하는 사람: 'nav' — 소문을 함께 들은 항해사(없으면 지금의 중국인 항해사 → 부관), 'P' — 제독, 그 밖 — 역사 인물 */
  function who(k) {
    if (k === 'P') { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
    if (k === 'nav') {
      var b = st(), s = S(), m = (b.nav && s.mates.filter(function (x) { return x.id === b.nav; })[0]) || ZH.navigator();
      if (m && G.MATE[m.id]) return { name: G.MATE[m.id].name, portrait: G.Scenes.mateSpec(m.id), half: G.Img.chain.mateHalf(m.id), lang: 3 };
      return G.Scenes.mateSpeaker('nav');
    }
    if (k === 'elder') return { name: '말린디의 늙은 뱃사람', portrait: G.Art.withImg(G.Art.npcSpec('zh_elder', 'sailor', 'af', 'm'), ['portraits/history/zh_elder']), half: ['portraits/history/zh_elder_half'], lang: 3 };
    return G.Hist ? G.Hist.speaker(k) : { name: k, lang: 3 };
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }

  // ---------------------------------------------------------------- 어디서
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function inBox(box) { var l = S().loc; return !!(l && l.mode === 'sea' && l.lon != null && l.lon >= box[0] && l.lon <= box[1] && l.lat >= box[2] && l.lat <= box[3]); }
  function cooled() { var b = st(); return !(b.cool > S().day); }
  function rumorOpen() { var b = st(); return !!(b && !b.step && K().rumor.indexOf(cityNow()) >= 0 && fameNow() >= K().minFame && ZH.navigator()); }
  function ghostOpen() { var b = st(), sg; return !!(b && b.step >= 1 && b.step <= 4 && !b.fight && !b.after && cooled() && (sg = stage(b.step)) && inBox(sg.box)); }

  // ================================================================ 시작 — 아프리카 항구의 소문
  ZH.rumor = async function () {
    var b = st(), s = S(), nav = ZH.navigator(), here = G.CITY_DATA[cityNow()].name;
    b.nav = nav.id;
    await withPic('zh_rumor', '아홉 돛대 배의 소문 (' + here + ')', function () { return play([
      [null, here + '의 부두. 그물을 깁던 늙은 뱃사람이 제독의 배에 걸린 깃발을 한참 바라보다가 말을 건다. 손에는 푸른 꽃무늬가 그려진 사기 조각이 쥐어져 있다.'],
      ['elder', '할아버지의 할아버지 때 일이오. 이 바다에 산만 한 배들이 왔지. 돛대가 아홉, 돛은 대나무 살을 댄 붉은 천. 배 한 척에 사람이 오백. 그 배들이 이 사기그릇과 비단을 내리고, 우리 술탄의 기린을 싣고 갔소.'],
      ['elder', '그런데 요즘 밤바다에 그 배가 다시 보인다오. 물 위로 푸른 불을 켜고, 소리도 없이 동쪽으로 간다고. 어부들은 그 배를 보면 그물을 거두고 집으로 돌아오지.'],
      ['nav', '(사기 조각을 받아 들고 한참 들여다보다가) 제독, 이건 영락 연간의 청화 자기입니다. 그리고 아홉 돛대의 배라면… 정화 태감의 보선(寶船)입니다.'],
      ['nav', '백오십 년도 더 전에, 명나라 황제께서 삼보태감 정화를 서양으로 보내셨습니다. 보선 예순 척, 사람 이만 칠천. 일곱 번이나 이 바다를 오갔지요. 캘리컷, 실론, 말라카… 그리고 이 말린디까지.'],
      ['nav', '마지막 원정에서 돌아오던 길에 태감께서 캘리컷 앞바다에서 숨을 거두셨다고 들었습니다. 그 길에 가라앉은 배들이 있었다면 — 아직도 황제께 복명하러 집으로 가는 중일지 모릅니다.'],
      ['P', '그 배들이 간 길을 따라가 보자. 캘리컷부터.'],
      ['elder', '(사기 조각 대신 낡은 두루마리를 내밀며) 이것도 가져가시오. 그 배들이 기린을 싣고 간 날을 그린 그림이라오. 우리 집안에 내려온 것이지만, 이제 그 배를 쫓는 사람에게 가는 게 맞겠지.']
    ]); });
    b.step = 1; b.cool = 0;
    if (R.addItem) R.addItem('zh_qilin_scroll');
    log(here + '에서 정화의 보선 이야기를 들었다. ' + G.MATE[nav.id].name + U.jx(G.MATE[nav.id].name, '이/가') + ' 늙은 뱃사람의 청화 자기 조각을 알아보았다 — 밤바다에 나타나는 아홉 돛대의 유령 보선. 첫 바다는 캘리컷 앞바다다.');
    UI.toast('정화의 보선을 쫓는다 — 첫 바다: 캘리컷 앞바다', 'ship', 5600);
    refresh(); return true;
  };

  // ================================================================ 유령 보선
  var GHOST = {
    1: { title: '캘리컷 앞바다의 유령 보선', pic: 'zh_ghost_calicut',
      hail: [
        [null, '캘리컷 앞바다, 달 없는 밤. 바람이 멎고 바다가 기름처럼 고요해진다. 안개 속에서 푸른 불빛이 하나, 둘 — 그리고 산처럼 큰 배의 그림자가 떠오른다.'],
        [null, '대나무 살을 댄 붉은 돛은 반쯤 썩어 바람도 없이 부풀어 있다. 뱃전에 늘어선 수군들의 얼굴에는 살이 없다. 배 이물에 그린 커다란 눈 하나가 제독의 배를 노려본다.'],
        ['nav', '보선입니다…! 고물의 깃발에 「天妃」 — 뱃사람의 여신 천비마조의 깃발. 정말로 정화 태감의 선단입니다.'],
        ['zh_hongbao', '어느 나라의 배냐. 대명 황제의 보선 앞에서 돛을 내리지 않는가. 우리는 고리(古里)에서 돌아가는 길이다. 태감께서 쓰러지셨다… 길을 비켜라. 황제께 복명해야 한다.']],
      after: [
        [null, '마지막 포성이 안개 속으로 사라지자, 유령 보선은 푸른 불을 하나씩 끄며 천천히 물속으로 가라앉았다. 바다 위에 떠오른 것은 옻칠한 나무 패 하나와 썩지 않은 금은 상자들.'],
        ['nav', '(나무 패를 닦으며) 선단의 행선 패입니다. 「고리를 떠나 석란산(錫蘭山)에서 물과 땔감을 싣는다」 — 석란산은 실론입니다. 다음 배는 실론 남쪽, 갈레 앞바다에 있을 겁니다.'],
        ['nav', '태감께서 갈레에 세운 비석이 있다지요. 한문과 타밀 글과 페르시아 글, 세 가지 글로 부처님과 시바 신과 알라께 똑같이 예물을 바쳤다는 비석입니다.']],
      next: '실론 남쪽 갈레 앞바다' },
    2: { title: '실론 남쪽 바다의 유령 보선', pic: 'zh_ghost_galle',
      hail: [
        [null, '실론 남쪽, 갈레의 곶이 멀리 보이는 바다. 파도 사이로 녹슨 쇠닻 소리가 들린다. 보선 두 척이 큰 정크선을 거느리고 나란히 떠오른다. 갑판 위에 깃발과 북이 늘어서 있다.'],
        ['zh_wangjinghong', '석란산의 왕이 우리를 속이고 길을 막았던 일을 잊었느냐. 이번에도 우리 앞을 막는 배는 모두 부수리라. 대명의 위엄을 서양에 보이라는 것이 황명이다.'],
        ['nav', '왕경홍 부사입니다. 정화 태감의 오른팔이었던 사람… 1411년 이 섬의 알라케스바라 왕과 싸워 이긴 바로 그 선단이에요. 제독, 이번엔 두 척입니다.']],
      after: [
        [null, '두 보선이 차례로 기울어 가라앉는다. 물거품 사이로 떠오른 것은 이번에도 행선 패와 보물 상자, 그리고 탁본 한 장 — 세 가지 글자가 나란히 새겨진 비석의 탁본이다.'],
        ['nav', '「석란산을 떠나 만랄가(滿剌加)의 관창(官廠)에서 짐을 모으고 계절풍을 기다린다」 — 말라카입니다. 태감께서 말라카에 창고와 울타리를 세우고, 원정대의 모든 짐을 거기 모으셨어요.'],
        ['nav', '다음 바다는 말라카 해협. 아마… 더 많은 배가 기다리고 있겠지요.']],
      next: '말라카 해협' },
    3: { title: '말라카 해협의 유령 보선', pic: 'zh_ghost_malacca',
      hail: [
        [null, '말라카 해협. 수마트라 쪽에서 몰려온 비구름 아래, 바다 위에 짙은 안개가 깔린다. 안개 속에서 북소리가 울리고, 보선 세 척과 정크선 두 척이 진을 치고 해협을 막아섰다.'],
        ['zh_houxian', '관창의 짐은 모두 실었다. 계절풍이 불면 북으로 간다. 황제께서 기다리신다. 이 해협을 지나는 배는 모두 대명의 칙서에 고개를 숙여라.'],
        ['nav', '후현 태감…! 칙서를 들고 서역과 벵골을 오간 사신입니다. 제독, 이 배들을 넘으면 — 남은 건 집으로 가는 바다뿐입니다.']],
      after: [
        [null, '해협의 안개가 걷히며 마지막 정크선이 가라앉는다. 떠오른 상자 위에 젖지 않은 칙서 한 장이 놓여 있다.'],
        ['nav', '(칙서를 펼쳐 읽다가 목소리가 떨린다) 「서양을 다녀온 보선은 모두 북경으로 와서 복명하라.」 — 영락제께서 도읍을 북경으로 옮기신 뒤의 칙서입니다.'],
        ['nav', '남은 배들은 북으로, 황제께 복명하러 황해를 건너고 있을 겁니다. 정화 태감의 기함도… 거기 있겠지요. 제독, 황해로 갑시다.']],
      next: '황해' },
    4: { title: '황해의 보선 다섯 척', pic: 'zh_ghost_yellow',
      hail: [
        [null, '황해. 잿빛 바다 위로 차가운 북풍이 분다. 수평선 끝에서 푸른 불빛이 하나씩 켜진다 — 하나, 둘, 셋, 넷, 다섯. 아홉 돛대의 보선 다섯 척이 학의 날개처럼 진을 펼친다.'],
        [null, '가운데 가장 큰 배의 고물에 키가 큰 사람이 서 있다. 붉은 망포 자락이 바람도 없이 펄럭이고, 몸은 달빛처럼 희미하게 비친다.'],
        ['zh_zhenghe', '나는 삼보태감 정화다. 일곱 번 서양을 다녀왔고, 이제 북경의 황제께 복명하러 간다. 그대가 우리 배들을 하나씩 바다에 눕혔다는 것을 안다.'],
        ['zh_zhenghe', '…그대의 배에 우리말을 하는 항해사가 있구나. 그렇다면 알겠지. 우리는 돌아가야 한다. 길을 비키지 않겠다면 — 대명 수군의 마지막 싸움을 받아라.'],
        ['nav', '(갑판에 무릎을 꿇었다가 일어서며) 태감 나리… 원정은 끝났습니다. 황제께서는 오래전에 돌아가셨고, 보선은 더 이상 지어지지 않았습니다. 이제 쉬셔도 됩니다. — 제독, 저분을 보내 드립시다.']],
      next: null }
  };
  ZH.GHOST = GHOST;
  ZH.ghost = async function () {
    var b = st(), n = b.step, sg = stage(n), G0 = GHOST[n], s = S();
    await withPic(G0.pic, G0.title, function () { return play(G0.hail); });
    b.tries = (b.tries || 0) + 1;
    var id = 'zh_' + n + '_' + b.tries, last = n === 4;
    var BAO = ['청화호', '청해호', '안원호', '영녕호', '태평호'], JUNK = ['순풍호', '천비호', '항해호'], bi = 0, ji = 0;
    var names = sg.ships.map(function (t) { return t === 'baochuan' ? BAO[(n - 1 + bi++) % BAO.length] + ' (보선)' : JUNK[ji++ % JUNK.length] + ' (정크)'; });
    if (last) names = ['청화호 (정화의 기함 보선)'].concat(BAO.slice(1).map(function (x) { return x + ' (보선)'; }));
    var bf = G.HIST_FIG[sg.boss];
    var spec = { id: id, foe: '명', foeLabel: '정화의 유령 보선단', ships: sg.ships.slice(), names: names, ghost: true, noPrize: true,
      boss: { hist: sg.boss, str: [0, 78, 84, 86, 96][n], mar: [0, 84, 88, 90, 99][n], int: [0, 70, 76, 80, 92][n], cha: [0, 66, 70, 74, 95][n],
        line: last ? '대명 수군의 칼을 받아라!' : '황명을 받든 배 앞을 막는 자는 누구냐!' },
      ask: G0.title + U.jx(G0.title, '과/와') + ' 맞서 싸우겠습니까?', fightLabel: '맞서 싸운다', noLabel: '돛을 돌려 물러난다',
      decline: last ? '…길을 비키는가. 그렇다면 다시 만날 것이다.' : '…물러나는가. 우리는 이 바다를 떠나지 않는다.',
      win: { fame: sg.fame, gold: sg.gold, text: last ? '황해에서 정화의 보선 다섯 척을 모두 바다에 눕혔다! 기함의 보물 창고에서 금화와 칼 한 자루 — 「막야」를 건졌다.' : G0.title + U.jx(G0.title, '을/를') + ' 물리치고 가라앉는 보선에서 보물 상자를 건졌다!' },
      lose: G0.title + '에 밀려났다. 푸른 불빛이 안개 속으로 사라진다…',
      onWin: function () { var z = st(); z.won[n] = S().day; z.after = n; z.fight = 0; z.tries = 0; if (last && !(R.addItem && R.addItem('moye'))) S().player.items.push({ id: 'moye' }); },   // 짐 칸이 차도 막야는 챙긴다
      onLose: function () { var z = st(); z.fight = 0; z.cool = S().day + (K().again || 30); } };
    b.fight = n;
    var go = G.Rel && G.Rel.greatBattle ? (G.Rel.register(spec), await G.Rel.greatBattle(spec)) : false;
    if (!go) { b.fight = 0; b.cool = s.day + (K().again || 30); log(G0.title + '에서 돛을 돌려 물러났다. 유령선은 그 바다를 떠나지 않는다.'); }
    refresh(); return true;
  };
  /** 이긴 다음 — 항해사가 패를 읽고 다음 바다를 알려 준다 · 마지막은 정화의 혼령과의 작별 */
  ZH.afterWin = async function () {
    var b = st(), n = b.after, sg = stage(n), G0 = GHOST[n];
    b.after = 0;
    if (n === 4) {
      await withPic('zh_farewell', '정화의 혼령', function () { return play([
        [null, '다섯 번째 보선이 기울며 가라앉는다. 그 고물에서 붉은 망포의 사람이 천천히 걸어 나와, 물 위에 선 채로 제독의 배를 바라본다.'],
        ['zh_zhenghe', '…그렇군. 원정은 끝났고, 황제께서도 가셨구나. 우리는 백 년이 넘도록 끝나 버린 명을 받들고 바다를 떠돌았다.'],
        ['zh_zhenghe', '그대는 서쪽 끝에서 와서 우리가 간 길을 거슬러 여기까지 왔다. 말린디, 고리, 석란산, 만랄가. 바다는 넓되 한 길로 이어져 있다는 것을, 그대도 알았겠지.'],
        ['zh_zhenghe', '그 칼은 막야다. 오나라의 칼장인 간장의 아내가 제 머리카락을 화로에 넣어 벼린 칼. 짝인 간장은 끝내 찾지 못했다. 그대가 가져가라. 칼은 바다 밑에서 잠들기보다, 바다를 건너는 사람 손에 있어야 한다.'],
        ['nav', '(깊이 고개를 숙이며) 태감 나리, 편히 가십시오. 천비마조께서 길을 밝혀 주실 겁니다.'],
        [null, '정화의 혼령이 미소를 짓고는 푸른 빛이 되어 흩어진다. 황해의 하늘에 아홉 개의 별이 잠시 반짝이다 사라졌다. 바다가 다시 바람 소리로 가득 찬다.']
      ]); });
      b.step = 5;
      if (G.Fame) G.Fame.add('ex', 3000);
      log('황해에서 정화의 보선 다섯 척을 물리쳤다. 정화의 혼령이 원정의 끝을 받아들이고 칼 「막야」를 내주었다. (금화 +' + num(sg.gold) + ')');
      UI.toast('정화의 보선 — 끝. 막야(무력 42)를 얻었다', 'sword', 6400);
    } else {
      await withPic(G0.pic + '_after', '가라앉는 보선', function () { return play(G0.after); });
      b.step = n + 1;
      log(G0.title + U.jx(G0.title, '을/를') + ' 물리치고 금화 ' + num(sg.gold) + '닢을 건졌다. 행선 패가 다음 바다를 가리킨다 — ' + G0.next + '.');
      UI.toast('정화의 보선 — 다음 바다: ' + G0.next, 'ship', 5600);
    }
    refresh(); return true;
  };

  // ================================================================ 도시 · 바다
  ZH.pending = function () { var b = st(); return !!(b && S().loc && S().loc.mode === 'city' && (b.after || rumorOpen())); };
  ZH.check = async function () {
    if (ZH._busy) return false; ZH._busy = true;
    try { var b = st(); if (b.after) await ZH.afterWin(); else if (rumorOpen()) await ZH.rumor(); } catch (e) { console.error(e); }
    ZH._busy = false; return true;
  };
  ZH.seaPending = function () { var b = st(); return !!(b && S().loc && S().loc.mode === 'sea' && (b.after || ghostOpen())); };
  ZH.atSea = async function () {
    if (ZH._busy) return false; ZH._busy = true;
    try { var b = st(); if (b.after) await ZH.afterWin(); else if (ghostOpen()) await ZH.ghost(); } catch (e) { console.error(e); }
    ZH._busy = false; return true;
  };
  /** 지금 찾는 바다 (수첩·소문용) */
  ZH.goal = function () { var b = st(); return b && b.step >= 1 && b.step <= 4 ? stage(b.step).name : null; };
  /** 해전 장면 밖인데 싸우는 중 표시가 남아 있으면(해전 도중 새로고침한 저장) 푼다 — 해전의 결과는 해전이 끝날 때 바로 onWin/onLose 로 온다 */
  ZH.unstick = function () { var b = st(); if (b && b.fight && !(G.Game && G.Game.sceneName === 'battle')) b.fight = 0; };
  (function hookDaily() {
    var W = G.World; if (!W || W._zhenghe) return;
    W._zhenghe = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { ZH.unstick(); } catch (e) { console.error(e); } return out; };
  })();
})(window.G = window.G || {});
