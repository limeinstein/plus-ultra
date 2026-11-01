/* 오스만과 유럽 세계의 다툼 (G.OttoEu) — 2026-11-01 사용자 요청 「일련의 오스만과 유럽 세계의 다툼 이벤트 · 이미 있는 것들은 스킵」
   백칠십 년 동안 초승달과 십자가가 다툰 바다와 성벽. 역사는 바뀌지 않는다 — 바뀌는 것은 제독이 어디에 서 있었는가다.
   (레판토 해전 1571은 이미 있다: js/data/relevents.js cr_league1571 · 빈 포위·프레베자·빈 전투의 짧은 소식도 relevents.js 에 있어 여기서는 장면만 만든다)
   ■ 흐름 (사람·조정값: js/data/ottomaneurope.js · G.BALANCE.ottoEu)
     ① 제1차 빈 포위 (1529년 9월 1일~10월 14일, 비엔나): 일흔 살의 잘름 백작. 오스만 광부들이 케른트너 성문 밑으로 굴을 판다.
        (가) 굴을 찾는다 — 어떻게? 「물 대야와 북 위의 완두콩」이 정답(과학·측량이 있으면 실마리). 찾으면 굴 속의 싸움(육상전)
        (나) 성문을 열고 예니체리 진으로 돌격(육상전) (다) 성벽 위에서 지켜본다. 10월 14일 밤 술탄이 진을 불태우고 물러난다.
     ② 프레베자 해전 (1538년 9월 1일~28일, 프레베자 앞바다 — 바다의 하루 끝): 머뭇거리는 안드레아 도리아, 성난 베네치아의 카펠로, 교황 함대의 그리마니.
        신성 동맹과 함께 바르바로사의 갤리선에 맞선다(큰 해전) — 이기면 동맹 함대가 코르푸로 물러나는 길을 지켜 낸다. 그날의 바다는 그래도 바르바로사의 것.
     ③ 호르무즈 탈환 (1622년 2월 9일~4월 22일, 호르무즈): 사파비 군과 잉글랜드 동인도 회사 함대가 포르투갈 요새를 에워쌌다.
        (가) 요새를 돕는다 — 잉글랜드 함대와 싸운다(큰 해전, 이기면 장부와 사람들을 건져 낸다) (나) 이맘 쿨리 칸에게 선다 — 포르투갈 함대와 싸운다(조국 궁정의 신뢰가 깎인다)
        (다) 섬을 떠난다. 4월 23일 요새가 항복한다. 샤 아바스는 맞은편 항구를 반다르 아바스라 부르게 한다.
     ④ 무스카트 탈환 (1649년 10월 1일~12월 24일, 무스카트): 수비대장 페레이라가 인도 상인 나로탐의 딸을 아내로 내놓으라 한다. 나로탐은 요새의 물과 화약을 쏟게 했다.
        (가) 나로탐의 편지를 술탄 빈 사이프에게 전하고 성탄 밤의 기습에 함께한다(육상전) (나) 수비대장에게 알린다 — 그는 웃어넘기고, 그 밤 부두에서 포르투갈 가족들을 배에 태운다(육상전)
        (다) 상관하지 않는다. 1650년 1월 무스카트가 무너지고 오만의 배가 인도양으로 나선다 (1698년 몸바사 소식까지).
     ⑤ 제2차 빈 포위 (1683): ㉮ 7월 14일~8월 31일 비엔나 — 포위된 도시의 밀사 콜시츠키를 성 안으로 들여보낸다(튀르크 노래 · 밤의 도나우 · 순찰대를 뚫는다)
        ㉯ 9월 1일~12일 비엔나 — 칼렌베르크 언덕, 소비에스키의 날개 기병과 함께 카라 무스타파의 대군에 맞선다(육상전)
        ㉰ 9월 13일~1684년 말 비엔나 (㉮나 ㉯에 함께했으면) — 오스만 군이 버리고 간 커피 자루, 콜시츠키의 커피 집 (커피 20통 · 잔)
     ⑥ 카를로비츠 조약 (1698년 10월 15일~1699년 1월 25일, 비엔나·베니스·이스탄불·베오그라드): 누가 먼저 문을 들어서느냐로 한 달째 멈춘 회담.
        중재인 패짓 경이 묻는다 — 「문을 사절단 수만큼 낸 둥근 정자」가 정답. 1699년 1월 26일 조약 (관계: 합스부르크·베네치아·폴란드와 오스만이 잠시 숨을 돌린다).
     소식 (누구나): 호르무즈 함락 · 무스카트 함락 · 몸바사 함락 · 카를로비츠 조약 / (함께한 사람만) 잘름 백작의 죽음 · 카라 무스타파의 최후
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/ot_*.webp — images/legend-events/OTTOMANEUROPE_PROMPT.md
   ■ 저장: s.ottoEu = { told: {}, v1, pv, hz, ms, v2spy, v2bat, v2cof, kw, kwTry, mods } — 옛 저장은 처음 쓸 때 만든다(지난 소식은 알린 것으로) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var OE = G.OttoEu = {};
  var VIENNA = 54, HORMUZ = 128, MUSCAT = 125;
  function K() { return G.BALANCE.ottoEu; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  var NEWS = ['salm', 'hormuz', 'muscat', 'karamustafa', 'mombasa', 'karlowitz'];
  var NEWS_AT = { salm: 15300504, hormuz: 16220423, muscat: 16500118, karamustafa: 16831225, mombasa: 16981213, karlowitz: 16990126 };
  OE.NEWS_AT = NEWS_AT;
  function st() {
    var s = S(); if (!s) return null;
    if (!s.ottoEu) {
      s.ottoEu = { told: {} };
      NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.ottoEu.told[k] = 1; });
    }
    s.ottoEu.told = s.ottoEu.told || {};
    return s.ottoEu;
  }
  OE.state = st;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker('ot_' + id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  var HIST0 = { hayreddin: 1, turgut: 1, adoria: 1, sinan: 1 };   // js/data/histfigures.js 에 이미 있는 사람
  function who(k) {
    if (k === 'P') return me();
    if (k === 'first') return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    if (HIST0[k]) return G.Hist ? G.Hist.speaker(k) : { name: k, lang: 3 };
    return k ? H(k) : {};
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function log(t) { G.State.log(t); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : { lv: R.skill(id), who: null }; return { lv: (b && b.lv) || 0, who: (b && b.who) || '제독' }; }
  function trust(id, n) { if (G.Sponsor && G.SPONSOR && G.SPONSOR[id]) G.Sponsor.addTrust(G.Sponsor.rel(id), n); }
  function item(id) { return R.addItem ? R.addItem(id) !== false : false; }
  function itemName(id) { return G.ITEM[id] ? G.ITEM[id].name : id; }
  function gold(n) { S().player.gold += n; }
  /** 도시 안에서 뭍의 싸움 — 함대의 선원으로 (무굴·엘미나의 싸움과 같은 방식) */
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, Object.assign({ kind: 'garrison' }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  /** 큰 해전 (js/systems/relations.js) — 끝나면 onWin/onLose */
  async function sea(spec) {
    if (!G.Rel || !G.Rel.greatBattle) return false;
    G.Rel.register(spec);
    return G.Rel.greatBattle(spec);
  }
  function iberian() { var n = S().player.nation; return n === 'PT' || n === 'ES'; }

  // ================================================================ ① 제1차 빈 포위 (1529)
  function v1Open() { var b = st(), t = today(); return !!(b && !b.v1 && cityNow() === VIENNA && t >= K().v1.from && t <= K().v1.to); }
  var TUNNEL = [
    { value: 'ear', label: '밤마다 성벽에 귀를 대고 곡괭이 소리를 듣는다', no: '성 안은 밤에도 시끄러웠다. 대장간 망치, 말발굽, 기도 소리… 땅 밑의 소리는 묻혀 버렸다.' },
    { value: 'dog', label: '사냥개를 풀어 화약 냄새를 맡게 한다', no: '개들은 화약 창고 앞에서만 짖어 댔다. 땅 밑 깊은 곳의 냄새는 개도 맡지 못했다.' },
    { value: 'bowl', label: '지하실마다 물 대야를 놓고, 북 위에 마른 완두콩을 올려 둔다', ok: true }
  ];
  OE.TUNNEL = TUNNEL;
  async function vienna1() {
    var b = st(), k = K().v1, besieged = today() >= k.siege; b.v1 = 'met';
    await withPic('ot_vienna1529', '빈 포위 (1529)', function () { return play([
      [null, besieged ? '빈. 성벽 밖 마을이 모두 불타 검은 기둥만 남았다. 수비대가 적이 몸을 숨길 곳을 없애려고 일부러 불을 놓았다. 남쪽과 동쪽 지평선까지 오스만 군의 천막이 끝없이 이어진다 — 술탄 쉴레이만의 대군이 도시를 에워쌌다.'
        : '빈. 성벽 밖 마을에 수비대가 불을 놓고 있다. 적이 몸을 숨길 곳을 없애는 것이다. 헝가리를 지나 북쪽으로 올라오는 술탄 쉴레이만의 대군이 며칠 거리에 있다는 소식이다.'],
      ['salm', '바다의 제독이 이 내륙까지 오다니. 나는 니클라스 잘름, 일흔 해를 살았소. 파비아에서는 프랑스 왕을 사로잡는 데도 끼었지. …허나 이번 싸움은 다르오. 술탄의 군대는 십만이 넘고, 우리는 이만이 못 되오.'],
      ['salm', '하늘이 우리 편이긴 하오. 여름 내내 비가 와서, 술탄은 큰 대포를 헝가리의 진흙길에 버리고 왔다더군. 그래서 저들은 대포 대신 땅을 파오. 보스니아와 세르비아의 광부들이 케른트너 성문 밑으로 굴을 뚫어, 화약을 채워 성벽을 날리려는 게지.'],
      ['salm', '어디를 파는지만 알면 우리도 마주 파 들어가 굴을 무너뜨릴 수 있소. 아니면 성문을 열고 나가 저들의 진을 흔들어 놓든가. 제독, 그대의 사람들을 빌려주겠소?']
    ]); });
    var sc = skill('sci'), sv = skill('survey');
    var v = await UI.ask('빈 포위 — 잘름 백작의 부탁', [
      { label: '땅굴을 찾아 무너뜨린다' + (sc.lv || sv.lv ? ' (과학·측량의 눈)' : ''), value: 'tunnel' },
      { label: '성문을 열고 나가 예니체리 진으로 돌격한다', value: 'sortie' },
      { label: '성벽 위에서 지켜본다', value: 'watch' }], who('salm'));
    if (v === 'tunnel') await v1Tunnel(sc.lv >= sv.lv ? sc : sv);
    else if (v === 'sortie') await v1Sortie();
    else { b.v1 = 'watch'; await play([['salm', '…그래, 그대의 배는 바다에 있어야 할 것이니. 성벽 위에서 잘 보아 두시오. 언젠가 그대 나라 사람들에게 이야기해 주시오.']]); }
    await v1End();
    refresh();
  }
  async function v1Tunnel(sk) {
    var b = st(), k = K().v1, found = false, tries = 0;
    if (sk.lv) await play([[null, sk.who + (sk.who === '제독' ? '이' : U.jx(sk.who, '이/가')) + ' 성벽 밑 지하실을 둘러보며 중얼거렸다. 「땅이 떨리면 물이 먼저 압니다. 가만히 있는 것일수록 작은 떨림을 잘 드러내지요.」']]);
    while (!found && tries < k.tries) {
      tries++;
      var v = await UI.ask('땅 밑의 곡괭이를 어떻게 찾을까?', TUNNEL.map(function (x) { return { label: x.label, value: x.value }; }), who('salm'));
      var o = TUNNEL.filter(function (x) { return x.value === v; })[0] || TUNNEL[0];
      if (o.ok) found = true;
      else await play([[null, o.no + (tries < k.tries ? ' 하룻밤이 헛되이 지나갔다.' : '')]]);
    }
    b.v1Try = tries;
    if (!found) {
      await play([['salm', '…늙은 광부 하나가 그러더군. 「물 대야를 놓으십시오. 북 위에 완두콩을 올려 두십시오.」 고향 티롤의 광산에서 하던 방법이라오. 이틀이 늦었소 — 그 사이 성벽 한 귀퉁이가 날아갔지.']]);
    }
    await play([[null, '지하실 하나에서 대야의 물낯에 잔물결이 일었다. 북 위의 완두콩이 톡, 톡 튀었다. 바로 이 밑이다! 마주 파 들어간 굴 끝에서 흙벽이 무너지고, 등잔불 너머로 오스만 광부들과 예니체리가 칼을 뽑았다.']]);
    var r = await fight('땅굴 속의 오스만 광부와 예니체리', k.tunnel, { guns: false, flee: false, leader: '광부 우두머리', noSpecial: true });
    if (r === 'win') {
      b.v1 = 'tunnel';
      var got = item('vienna_bowl'), bt = fame('bt', found && tries === 1 ? 250 : 160), so = fame('so', 80); trust('de_emperor', 10);
      await play([['salm', '굴이 무너졌소! 저들이 채운 화약은 이제 저들 머리 위의 흙일 뿐이오. 제독, 이 대야를 가져가시오. 빈의 성벽이 그대에게 빚을 졌다는 증표요.']]);
      log('빈 포위 — 케른트너 성문 밑의 오스만 땅굴을 찾아 무너뜨렸다. (전투 명성 +' + bt + ' · 사교 명성 +' + so + ' · 황제의 신뢰 +10)');
      UI.toast(got ? itemName('vienna_bowl') + ' · 황제의 신뢰 +10' : '소지품이 가득 차 물 대야는 받지 못했다 · 황제의 신뢰 +10', 'sword', 5600);
    } else {
      b.v1 = 'tunnelLost';
      await play([[null, '굴 속의 싸움에서 밀려났다. 수비대가 굴 어귀를 흙으로 메웠지만, 다음 날 케른트너 성문 곁 성벽 한 자락이 무너져 내렸다. 틈은 밤새 사람의 몸으로 메워졌다.']]);
      log('빈 포위 — 오스만 땅굴 속의 싸움에서 밀려났다.');
    }
  }
  async function v1Sortie() {
    var b = st();
    await play([[null, '새벽, 성문이 열렸다. 제독의 사람들이 란츠크네히트와 함께 이브라힘 파샤의 참호로 뛰어든다. 붉은 깃발 아래 하얀 모자의 예니체리들이 일어선다.']]);
    var r = await fight('이브라힘 파샤의 예니체리', K().v1.sortie, { guns: true, leader: '예니체리 아가', noSpecial: true });
    b.v1 = r === 'win' ? 'sortie' : 'sortieLost';
    if (r === 'win') {
      var bt = fame('bt', 300); trust('de_emperor', 8);
      await play([['salm', '하하! 저들의 참호를 뒤집어 놓았구려. 오늘 밤 술탄의 천막에서는 노한 목소리가 들릴 것이오.']]);
      log('빈 포위 — 성문을 열고 나가 예니체리의 참호를 쳤다. (전투 명성 +' + bt + ' · 황제의 신뢰 +8)');
    } else {
      await play([['salm', '살아 돌아온 것만도 다행이오. 저들은 바다의 해적과는 다르오. 성벽 안에서 버티는 수밖에.']]);
      log('빈 포위 — 성문 밖으로 나섰다가 예니체리에게 밀려 돌아왔다.');
    }
  }
  async function v1End() {
    await play([
      [null, '— 10월 14일 밤. 오스만 진영 곳곳에서 불길이 솟았다. 술탄이 물러나기 전에 천막과 끌고 온 포로들을 불태운 것이다. 첫눈이 내리기 시작했다.'],
      ['salm', '…물러가는구려. 우리가 이긴 것이 아니오. 겨울과 진흙과 먼 길이 이긴 것이지. 그래도 빈은 서 있소. 저 술탄이 다시는 이렇게 멀리 오지 못하기를.'],
      [null, '잘름 백작은 마지막 공격 때 날아온 돌 조각에 넓적다리를 다쳤다. 그는 웃으며 괜찮다고 했다.']
    ]);
    if (st().v1 === 'watch') { var so = fame('so', 30); log('빈 포위 — 성벽 위에서 오스만 군이 물러가는 것을 보았다. (사교 명성 +' + so + ')'); }
  }

  // ================================================================ ② 프레베자 해전 (1538)
  function pvOpen() {
    var b = st(), s = S(), l = s && s.loc, k = K().pv, t = today(); if (!b || b.pv || !l || l.mode !== 'sea' || l.lon == null) return false;
    return t >= k.from && t <= k.to && l.lon >= k.box[0] && l.lon <= k.box[1] && l.lat >= k.box[2] && l.lat <= k.box[3];
  }
  var PV_BATTLE = {
    id: 'ot_preveza', foe: '오스만 제국', foeLabel: '하이레딘 파샤의 함대 (프레베자)',
    ships: ['galley', 'galley', 'galley', 'galley', 'fusta', 'galley', 'fusta', 'galley'],
    names: ['하이레딘 파샤의 기함', '투르구트 레이스의 갤리선', '시난 파샤의 갤리선', '살리흐 레이스의 갤리선', '알제의 푸스타', '로도스의 갤리선', '해적 푸스타', '무라드 레이스의 갤리선'],
    allies: [{ type: 'galleon', name: '베네치아의 큰 갤리온 (콘둘메르)' }, { type: 'galley', name: '도리아의 기함' }, { type: 'galley', name: '교황 갤리선 (그리마니)' }, { type: 'galley', name: '베네치아 갤리선 (카펠로)' }],
    who: { hist: 'adoria' }, gunK: 0.9, crewK: 0.95,
    ask: '프레베자 앞바다 — 신성 동맹 함대와 함께 바르바로사의 갤리선에 맞서겠습니까?', fightLabel: '동맹 함대와 함께 싸운다', noLabel: '물러난다',
    decline: '…그대도 바람을 기다리겠다는 게요? 하기야, 이 늙은이도 그렇소.',
    boss: { hist: 'hayreddin', str: 70, mar: 88, int: 82, cha: 78, line: '도리아는 바람을 기다리고, 나는 노를 젓는다. 그 차이를 보여 주마!' },
    win: { fame: 600, gold: 8000, so: 120, text: '제독의 배와 베네치아의 큰 갤리온이 하이레딘의 갤리선을 붙잡아 두는 사이, 동맹 함대가 코르푸로 물러났다. 그날의 바다는 바르바로사의 것이었지만, 제독이 지킨 배들은 하나도 가라앉지 않았다.' },
    lose: '프레베자 앞바다에서 물러났다. 도리아의 함대도 밤새 코르푸로 노를 저었다.',
    council: [
      [null, '아르타만 어귀, 프레베자 요새 앞바다. 신성 동맹의 갤리선 백오십여 척과 범선들이 바다를 메웠다. 좁은 만 안쪽에는 바르바로사의 갤리선들이 웅크리고 있다.'],
      ['ot_grimani', '교황 성하의 갤리선은 이미 한 번 저 요새에 포를 쏘았소. 만 안으로 쳐들어갑시다! 지금 저들은 독 안에 든 쥐요.'],
      ['ot_capello', '베네치아의 갤리선도 준비되었소. 도리아 제독, 대체 무엇을 기다리는 게요?'],
      ['adoria', '만 어귀가 좁고 요새의 대포가 지키오. 저 안으로 들어가는 건 자루 속으로 기어드는 것이오. 게다가 우리 범선은 바람 없이는 한 뼘도 움직이지 못하오.'],
      ['ot_capello', '제노바 사람들은 늘 베네치아의 배가 먼저 가라앉기를 기다리지. 황제의 배는 아끼고 말이오.'],
      ['adoria', '…(제독을 돌아보며) 그대라면 어찌하겠소? 바람이 잦아들면 저 해적은 노를 저어 나올 것이오. 그때 우리 곁에 서 주겠소?']
    ],
    councilPic: 'ot_preveza', councilTitle: '프레베자 — 신성 동맹 작전 회의',
    foePic: 'ot_preveza', foeTitle: '프레베자 — 하이레딘의 기함',
    foeScene: [
      [null, '— 그 무렵, 아르타만 안쪽의 하이레딘 파샤의 기함.'],
      ['turgut', '대제독, 저들이 머뭇거립니다. 저 늙은 도리아는 제 배를 아끼지요. 베네치아 놈들과 서로 등을 떠밀고 있습니다.'],
      ['hayreddin', '저들의 범선은 바람을 기다리고, 우리 갤리선은 노를 젓는다. 바람이 잦아드는 아침에 나간다. 큰 배는 내버려 두고, 떨어진 갤리선부터 하나씩 물어뜯어라.']
    ],
    onWin: function () { var b = st(); b.pv = 'won'; trust('it_doria', 10); trust('it_pope', 5); trust('it_doge', 8); },
    onLose: function () { var b = st(); b.pv = 'lost'; }
  };
  OE.PV_BATTLE = PV_BATTLE;
  async function preveza() {
    var b = st(); b.pv = 'met';
    var go = await sea(Object.assign({}, PV_BATTLE));
    if (go) { b.pv = 'fight'; return; }
    b.pv = 'declined';
    await play([[null, '이튿날 아침, 바람이 잦아들었다. 바르바로사의 갤리선들이 만 밖으로 쏟아져 나왔고, 도리아는 끝내 큰 싸움을 걸지 않은 채 함대를 코르푸로 돌렸다. 멀리서 그 광경을 본 제독의 사람들은 말이 없었다.']]);
    log('프레베자 앞바다에서 신성 동맹 함대가 바르바로사에게 밀려 물러나는 것을 멀리서 보았다.');
  }

  // ================================================================ ③ 호르무즈 탈환 (1622)
  function hzOpen() { var b = st(), t = today(); return !!(b && !b.hz && cityNow() === HORMUZ && t >= K().hz.from && t <= K().hz.to); }
  var HZ_DEFEND = {
    id: 'ot_hormuz_pt', foe: '잉글랜드', foeLabel: '잉글랜드 동인도 회사 함대',
    ships: ['galleon', 'galleon', 'galleon', 'galleon', 'galleon', 'pinnace', 'pinnace'],
    names: ['런던호 (블라이스)', '조나스호', '고래호', '돌고래호', '사자호', '실링호', '로즈호'],
    allies: [{ type: 'galleon', name: '포르투갈 갈레온 (산 페드루)' }, { type: 'galley', name: '요새의 갤리선' }],
    who: { hist: 'ot_melo' }, gunK: 1.0, crewK: 0.9,
    ask: '호르무즈 앞바다 — 요새를 지키려 잉글랜드 동인도 회사 함대와 싸우겠습니까?', fightLabel: '잉글랜드 함대와 싸운다', noLabel: '물러난다',
    decline: '…그렇소? 그대마저 떠나면 이 섬엔 우리뿐이오.',
    boss: { hist: 'ot_blyth', str: 66, mar: 74, int: 70, cha: 62, line: '마드리드와 런던이 평화를 맺었다고? 이 바다는 회사의 바다요!' },
    backCity: HORMUZ,
    win: { fame: 500, gold: 6000, so: 100, text: '잉글랜드 동인도 회사의 배들을 물리쳤다! …그러나 섬은 이미 페르시아 군에게 에워싸였다. 제독의 배는 요새의 여자와 아이들, 상관의 장부 상자를 싣고 무스카트로 빠져나왔다.' },
    lose: '잉글랜드 함대 앞에서 물러났다. 4월 23일, 호르무즈 요새는 항복했다.',
    onWin: function () { var b = st(); b.hz = 'defendWon'; trust('pt_king', 10); trust('es_crown', 5); var got = item('hz_ledger'); setTimeout(function () { UI.toast(got ? itemName('hz_ledger') + ' · 포르투갈 궁정의 신뢰 +10' : '포르투갈 궁정의 신뢰 +10', 'scroll', 5200); }, 900); },
    onLose: function () { var b = st(); b.hz = 'defendLost'; }
  };
  var HZ_PERSIA = {
    id: 'ot_hormuz_pe', foe: '포르투갈', foeLabel: '호르무즈의 포르투갈 함대',
    ships: ['galleon', 'carrack', 'galleon', 'galley', 'galley', 'caravel'],
    names: ['산 페드루호', '노사 세뇨라 다 루즈호', '산티아구호', '요새의 갤리선', '케슘의 갤리선', '연락선'],
    allies: [{ type: 'galleon', name: '런던호 (블라이스)' }, { type: 'galleon', name: '조나스호' }, { type: 'dhow', name: '사파비 군의 수송선' }],
    who: { hist: 'ot_imamquli' }, gunK: 0.9, crewK: 0.9,
    ask: '호르무즈 앞바다 — 이맘 쿨리 칸과 잉글랜드 함대 편에서 포르투갈 함대와 싸우겠습니까?', fightLabel: '포르투갈 함대와 싸운다', noLabel: '물러난다',
    decline: '…약속을 거두는가. 바다의 사람은 바람처럼 변하는구나.',
    boss: { hist: 'ot_melo', str: 62, mar: 70, int: 60, cha: 58, line: '배신자! 리스본의 이름으로, 이 섬은 내주지 않는다!' },
    backCity: HORMUZ,
    win: { fame: 450, gold: 14000, so: 60, text: '호르무즈 앞바다의 포르투갈 함대를 무너뜨렸다! 바다가 막히자 요새는 물도 화약도 받지 못했다. 이맘 쿨리 칸이 약속한 진주와 비단의 몫을 보냈다.' },
    lose: '포르투갈 함대에 밀려 물러났다. 그래도 요새는 4월 23일 항복했다.',
    onWin: function () { var b = st(); b.hz = 'persiaWon'; trust('pe_shah', 15); var got = item('hz_firman'); setTimeout(function () { UI.toast(got ? itemName('hz_firman') + ' · 샤의 신뢰 +15' : '샤의 신뢰 +15', 'scroll', 5200); }, 900); },
    onLose: function () { var b = st(); b.hz = 'persiaLost'; }
  };
  OE.HZ_DEFEND = HZ_DEFEND; OE.HZ_PERSIA = HZ_PERSIA;
  async function hormuz() {
    var b = st(); b.hzMet = 1;
    await withPic('ot_hormuz1622', '호르무즈 (1622)', function () { return play([
      [null, '호르무즈 섬. 붉은 소금 바위 위에 포르투갈 요새가 서 있다. 바다 건너 본토 해안에는 사파비 군의 천막이 늘어섰고, 그 앞바다에 붉은 십자 깃발 — 잉글랜드 동인도 회사의 배들이 닻을 내렸다. 그 배들이 페르시아 군사를 섬으로 실어 나르고 있다.'],
      ['melo', '제독, 잘 오셨소! 맞은편 케슘 섬의 요새는 벌써 무너졌소. 잉글랜드 놈들이 페르시아 놈들에게 배를 빌려준 거요. 마드리드와 런던이 평화를 맺었다는데, 이 바다에서는 그런 것도 없나 보오.'],
      ['melo', '케슘에서는 저쪽에서도 사람이 죽었다더군. 북쪽 얼음 바다에서 길을 찾던 잉글랜드 항해사 하나가, 요새까지 거리를 재다가 포탄에 맞았다 하오. 배핀이라던가.'],
      ['melo', '샤 아바스는 이 섬을 백 년 동안 벼르고 있었소. 우리 배가 바다를 쥐고 있으면 요새는 버틸 수 있소. 그대의 배가 저 잉글랜드 함대를 흩어 놓아 준다면…'],
      [null, '— 그날 밤, 부두에 페르시아 옷을 입은 사람이 몰래 제독을 찾아왔다.'],
      ['imamquli', '바다의 사람이여, 나는 파르스의 이맘 쿨리 칸이다. 샤께서는 이 섬을 되찾으신다 — 프랑크의 요새는 오래 버티지 못한다. 그대가 우리 편에 서면 이 섬의 진주와 비단에서 그대 몫을 떼어 주겠다.']
    ]); });
    var ib = iberian();
    var v = await UI.ask('호르무즈 — 누구 편에 설까?', [
      { label: '요새를 돕는다 — 잉글랜드 함대와 싸운다', value: 'defend' },
      { label: '이맘 쿨리 칸에게 선다 — 포르투갈 함대와 싸운다' + (ib ? ' (조국을 등진다)' : ''), value: 'persia' },
      { label: '섬을 떠난다', value: 'leave' }], who('melo'));
    if (v === 'defend') {
      b.hz = 'defend';
      var go = await sea(Object.assign({}, HZ_DEFEND));
      if (!go) { b.hz = 'leave'; await hzLeave(); }
      return;
    }
    if (v === 'persia') {
      b.hz = 'persia';
      if (ib) { trust('pt_king', -20); trust('es_crown', -10); }
      await play([['imamquli', '현명하다. 바다는 바다를 아는 자의 것이다. 잉글랜드 사람들이 우리 군사를 섬에 내리는 동안, 그대는 저 포르투갈 배들이 요새에 물과 화약을 대지 못하게 막아라.']]);
      if (ib) log('호르무즈에서 이맘 쿨리 칸의 편에 섰다 — 리스본과 마드리드 궁정이 이 일을 알게 될 것이다. (포르투갈 궁정의 신뢰 -20)');
      var go2 = await sea(Object.assign({}, HZ_PERSIA));
      if (!go2) { b.hz = 'leave'; await hzLeave(); }
      return;
    }
    b.hz = 'leave';
    await hzLeave();
  }
  async function hzLeave() {
    await play([[null, '제독의 배는 호르무즈를 떠났다. 수평선 너머로 요새에서 피어오르는 연기가 오래도록 보였다.']]);
    log('1622년 호르무즈 — 페르시아와 잉글랜드에 에워싸인 포르투갈 요새를 두고 섬을 떠났다.');
  }

  // ================================================================ ④ 무스카트 탈환 (1649~1650)
  function msOpen() { var b = st(), t = today(); return !!(b && !b.ms && cityNow() === MUSCAT && t >= K().ms.from && t <= K().ms.to); }
  async function muscat() {
    var b = st(), ib = S().player.nation === 'PT'; b.msMet = 1;
    await withPic('ot_muscat1650', '무스카트 (1649)', function () { return play([
      [null, '무스카트. 검은 바위산 사이의 좁은 만을 잘랄리와 미라니, 두 요새가 지킨다. 호르무즈를 잃은 지 스물일곱 해 — 포르투갈이 이 바다에 남긴 마지막 큰 항구다. 산 너머 마트라의 골짜기에는 오만의 술탄 빈 사이프가 군사를 모으고 있다는 소문이다.'],
      ['narottam', '제독님, 바다의 손님께 부끄러운 말씀을 드립니다. 저는 나로탐, 신드에서 온 상인으로 요새의 창고를 맡고 있습니다. 수비대장 페레이라 나리가… 제 딸을 아내로 내놓으라 하십니다. 거절하면 가게도 배도 모두 빼앗겠다고요.'],
      ['narottam', '그래서 꾀를 냈습니다. 나리께 「요새의 물과 화약이 오래되어 상했으니 다 내다 버리고 새로 채우셔야 합니다」 하고 아뢰었지요. 나리는 그 말대로 저수조의 물과 묵은 화약을 모두 쏟아 버렸습니다. 새것은 제가 대기로 했습니다.'],
      ['narottam', '…저는 새것을 대지 않을 겁니다. 포르투갈 병사들은 곧 성탄 잔치를 벌입니다. 그 밤에 이 소식을 산 너머 술탄 빈 사이프께 전해야 하는데, 성문은 닫혔고 바닷길은 포르투갈 배가 지킵니다. 제독님의 작은 배라면…']
    ]); });
    var v = await UI.ask('무스카트 — 나로탐의 부탁', [
      { label: '나로탐의 편지를 술탄 빈 사이프에게 전한다' + (ib ? ' (포르투갈을 등진다)' : ''), value: 'imam' },
      { label: '수비대장에게 알린다', value: 'warn' },
      { label: '상관하지 않는다', value: 'leave' }], who('narottam'));
    if (v === 'imam') return msImam(ib);
    if (v === 'warn') return msWarn();
    b.ms = 'leave';
    await play([['narottam', '…그렇습니까. 제독님을 탓하지 않겠습니다. 다만 오늘 들으신 말은 잊어 주십시오.']]);
    log('무스카트에서 인도 상인 나로탐의 부탁을 듣고도 모른 척했다.');
    refresh();
  }
  async function msImam(ib) {
    var b = st(); b.ms = 'imam';
    if (ib) trust('pt_king', -15);
    await play([
      [null, '밤바다를 돌아 마트라의 모래톱에 배를 댔다. 횃불 아래 오만 전사들이 칼자루에 손을 얹는다.'],
      ['saif', '프랑크의 배를 탄 자가 나로탐의 편지를? …(편지를 읽고는 웃는다) 물도 화약도 없는 요새라. 프랑크가 이 해안을 차지한 지 백사십 년, 그 끝이 장인 될 사람의 꾀라니. 좋다. 성탄 밤에 우리는 산을 넘는다. 그대도 함께 가겠는가?'],
      [null, '— 성탄 밤. 요새에서 노랫소리와 웃음소리가 흘러나온다. 사다리가 성벽에 걸리고, 오만 전사들이 소리 없이 올라간다. 제독의 사람들은 잘랄리 요새의 창고 문 앞으로 달린다.']
    ]);
    var r = await fight('잘랄리 요새의 포르투갈 수비대', K().ms.imam, { guns: true, leader: '페레이라 수비대장', noSpecial: true });
    if (r === 'win') {
      b.ms = 'imamWon';
      var bt = fame('bt', 250), so = fame('so', 120); gold(5000); var got = item('narottam_ring');
      await play([
        ['saif', '무스카트는 이제 오만의 것이다! 이 바다에서 프랑크의 배를 몰아내는 날이 머지않았다. 그대에게 금화 오천 닢을 주마.'],
        ['narottam', '제독님, 딸아이는 무사합니다. 이 반지를 받아 주십시오. 저희 집안의 약속을 새긴 반지입니다 — 언제든 신드의 상인을 만나면 보여 주십시오.']
      ]);
      log('무스카트 — 성탄 밤 술탄 빈 사이프의 기습에 함께해 잘랄리 요새를 무너뜨렸다. 나로탐의 딸은 무사했다. (전투 명성 +' + bt + ' · 사교 명성 +' + so + ' · 금화 +5,000' + (ib ? ' · 포르투갈 궁정의 신뢰 -15' : '') + ')');
      UI.toast(got ? itemName('narottam_ring') + ' · 금화 +5,000' : '금화 +5,000', 'coin', 5600);
    } else {
      b.ms = 'imamLost';
      await play([[null, '창고 앞의 싸움에서 밀려났다. 그래도 날이 밝기 전에 오만 전사들이 미라니 요새의 문을 열었다. 무스카트는 그 밤 무너졌다.']]);
      log('무스카트 — 성탄 밤의 기습에 함께했다가 수비대에 밀려났다.');
    }
    refresh();
  }
  async function msWarn() {
    var b = st(); b.ms = 'warn';
    await play([
      ['pereira', '저 반야 상인이? 하하! 그 늙은이는 곧 내 장인이 될 사람이오. 물이야 내일이면 새로 채울 것이고, 화약도 곧 들어오오. 성탄 잔치에나 오시오, 제독. 리스본에서 온 포도주가 있소.'],
      [null, '— 성탄 밤. 노랫소리 사이로 성벽 쪽에서 비명이 들렸다. 사다리, 횃불, 오만 전사들의 함성. 페레이라의 웃음소리는 다시 들리지 않았다. 제독의 사람들은 미라니 요새 아래 부두로 달린다 — 포르투갈 사람들의 가족이 배를 기다리고 있다.']
    ]);
    var r = await fight('술탄 빈 사이프의 오만 전사들', K().ms.warn, { guns: true, hold: 3, flee: false, leader: '오만 전사 대장', noSpecial: true });
    if (r === 'win') {
      b.ms = 'warnWon';
      var bt = fame('bt', 300), so = fame('so', 60); trust('pt_king', 12);
      await play([[null, '제독의 사람들이 부두를 끝까지 지켰다. 여자와 아이들, 늙은 상인들이 배에 올랐다. 그 가운데에는 흰 무명옷의 인도 상인과 그 딸도 있었다. 나로탐은 제독과 눈이 마주치자 말없이 고개를 숙였다.']]);
      log('무스카트 — 성탄 밤 오만 군이 요새를 덮쳤을 때 부두를 지켜 포르투갈 사람들을 배에 태웠다. (전투 명성 +' + bt + ' · 사교 명성 +' + so + ' · 포르투갈 궁정의 신뢰 +12)');
    } else {
      b.ms = 'warnLost';
      await play([[null, '부두에서 밀려나 겨우 제 배로 돌아왔다. 날이 밝았을 때 두 요새에는 오만의 붉은 깃발이 올라 있었다.']]);
      log('무스카트 — 성탄 밤 오만 군에 밀려 부두를 내주었다.');
    }
    refresh();
  }

  // ================================================================ ⑤ 제2차 빈 포위 (1683)
  function inVienna() { return cityNow() === VIENNA; }
  function v2SpyOpen() { var b = st(), t = today(), k = K().v2; return !!(b && !b.v2spy && inVienna() && t >= k.spyFrom && t <= k.spyTo); }
  function v2BatOpen() { var b = st(), t = today(), k = K().v2; return !!(b && !b.v2bat && inVienna() && t >= k.battleFrom && t <= k.battleTo); }
  function v2CofOpen() {
    var b = st(), t = today(), k = K().v2;
    var did = b && ((b.v2spy && b.v2spy !== 'skip') || (b.v2bat && b.v2bat !== 'skip'));
    return !!(did && !b.v2cof && inVienna() && t > k.battleTo && t <= k.coffeeTo);
  }
  async function v2Spy() {
    var b = st(); b.v2met = 1;
    await withPic('ot_vienna1683', '빈 포위 (1683)', function () { return play([
      [null, '빈으로 가는 길은 오스만 군의 천막으로 막혔다. 대재상 카라 무스타파 파샤의 대군이 도시를 에워싸고, 밤낮으로 성벽 밑에 굴을 파 들어간다. 제독 일행은 도나우 강 건너 숲속의 황제군 진영으로 돌아 들어갔다.'],
      ['lorraine', '바다의 제독이 이 숲속까지? 마침 잘 왔소. 저 사람을 좀 도와주시오.'],
      ['kolschitzky', '안녕하시오! 나는 쿨치츠키, 여기 사람들은 콜시츠키라 부르오. 튀르크 말을 하고 튀르크 노래를 알지 — 이스탄불에서 통역으로 오래 살았거든. 그래서 튀르크 상인 차림으로 저 천막들 사이를 걸어 나왔소.'],
      ['kolschitzky', '슈타르헴베르크 백작의 편지를 공작께 전했소. 이제 답장을 들고 다시 성 안으로 돌아가야 하오. 「버티시오, 구원군이 온다」 — 이 한 마디를 기다리며 성 안 사람들이 굶고 있소. 함께 가 주겠소?']
    ]); });
    var sp = skill('speech');
    var v = await UI.ask('콜시츠키를 어떻게 성 안으로 들여보낼까?', [
      { label: '튀르크 상인 차림으로 노래를 부르며 천막 사이를 걷는다' + (sp.lv ? ' (웅변)' : ''), value: 'song' },
      { label: '밤에 도나우 강을 헤엄쳐 건넌다', value: 'night' },
      { label: '순찰대를 정면으로 뚫는다', value: 'fight' },
      { label: '돕지 않는다', value: 'skip' }], who('kolschitzky'));
    if (v === 'skip') { b.v2spy = 'skip'; await play([['kolschitzky', '그렇소? 그럼 혼자 가지. 노래 한 곡이면 충분하오. 살아 있으면 또 봅시다!']]); return; }
    if (v === 'song') {
      await play([
        [null, '콜시츠키가 튀르크 노래를 흥얼거리며 앞장선다. 제독의 사람들도 터번을 두르고 짐 보따리를 진다. 예니체리 하나가 불러 세웠다.'],
        ['kolschitzky', '(튀르크 말로) 형제여, 베오그라드에서 온 장사꾼이오. 대재상 나리 천막에 대추야자를 갖다 드리러 가는 길이지. 한 줌 드시겠소?'],
        [null, sp.lv ? sp.who + (sp.who === '제독' ? '이' : U.jx(sp.who, '이/가')) + ' 맞장구를 치며 너스레를 떨자, 예니체리는 대추야자를 씹으며 손을 휘저었다. 「가라, 가.」' : '예니체리는 한참을 노려보다가 대추야자 한 줌을 받아 들고 손을 휘저었다. 「가라, 가.」'],
        [null, '새벽, 성벽 위에서 신호의 불꽃이 올랐다. 콜시츠키가 성 안으로 들어갔다.']
      ]);
      b.v2spy = 'song'; var so = fame('so', sp.lv ? 120 : 100);
      log('1683년 빈 — 밀사 콜시츠키와 함께 튀르크 상인 차림으로 오스만 진영을 지나 성 안에 구원군 소식을 전했다. (사교 명성 +' + so + ')');
    } else if (v === 'night') {
      var lost = Math.min(3, Math.max(0, S().fleet.crew - 1)); S().fleet.crew -= lost;
      await play([[null, '달 없는 밤, 도나우 강물은 차갑고 거셌다. 콜시츠키는 무사히 건넜지만, 제독의 사람 ' + lost + '명은 물살에 휩쓸려 돌아오지 못했다.']]);
      b.v2spy = 'night'; var so2 = fame('so', 60);
      log('1683년 빈 — 밤에 도나우 강을 헤엄쳐 밀사 콜시츠키를 성 안으로 들여보냈다. 선원 ' + lost + '명을 잃었다. (사교 명성 +' + so2 + ')');
    } else {
      await play([[null, '제독의 사람들이 칼을 뽑았다. 오스만 순찰대가 횃불을 들고 달려온다!']]);
      var r = await fight('오스만 순찰대', K().v2.patrol, { guns: true, leader: '순찰대장', noSpecial: true });
      b.v2spy = r === 'win' ? 'fight' : 'fightLost';
      if (r === 'win') { var bt = fame('bt', 60); await play([[null, '순찰대가 흩어진 틈에 콜시츠키가 성벽 쪽으로 사라졌다. 새벽, 성벽 위에서 신호의 불꽃이 올랐다.']]); log('1683년 빈 — 오스만 순찰대를 뚫고 밀사 콜시츠키를 성 안으로 들여보냈다. (전투 명성 +' + bt + ')'); }
      else { await play([[null, '순찰대에 밀려 숲으로 물러났다. 콜시츠키는 혼자 노래를 부르며 천막 사이로 걸어 들어갔다 — 그리고 새벽에 성벽 위에서 신호의 불꽃이 올랐다.']]); log('1683년 빈 — 오스만 순찰대에 밀렸지만 밀사 콜시츠키는 성 안으로 들어갔다.'); }
    }
    await play([['lorraine', '구원군은 9월 초 칼렌베르크 언덕에 모이오. 폴란드 왕이 날개 기병을 이끌고 온다 하오. 그때 다시 오시오, 제독.']]);
    refresh();
  }
  async function v2Battle() {
    var b = st(); b.v2met = 1;
    await withPic('ot_kahlenberg', '칼렌베르크 (1683)', function () { return play([
      [null, '9월, 빈 북쪽의 칼렌베르크 언덕. 황제군과 작센·바이에른의 군대, 그리고 폴란드의 국왕 얀 3세 소비에스키가 이끄는 군대가 모였다. 언덕 아래로 오스만 군의 천막 바다와 포연에 휩싸인 빈의 성벽이 내려다보인다.'],
      ['sobieski', '바다에서 온 제독인가! 좋소. 오늘은 바다 사람도 산 사람도 없소. 빈의 성벽은 두 달을 버텼소 — 이제 우리가 갚을 차례요.'],
      ['lorraine', '보병과 포병이 먼저 언덕을 내려가 포도밭과 마을을 하나씩 빼앗소. 제독의 사람들은 우리 왼쪽에서 오스만 군의 참호를 맡아 주시오.'],
      ['sobieski', '해가 기울면 내 날개 기병이 내려간다. 그때까지 버텨 주시오. 등에 단 깃털이 바람에 울면 — 저들은 천사가 내려온 줄 알 것이오.'],
      [null, '— 오스만 진영. 카라 무스타파 파샤는 성벽을 무너뜨릴 마지막 굴에 매달려, 언덕 위의 구원군을 제대로 막지 않았다.']
    ]); });
    var v = await UI.ask('칼렌베르크 — 구원군과 함께 언덕을 내려갈까?', [{ label: '함께 싸운다', value: 'fight' }, { label: '언덕 위에서 지켜본다', value: 'watch' }], who('sobieski'));
    if (v !== 'fight') {
      b.v2bat = 'watch';
      await v2Charge(false);
      var so = fame('so', 50); log('1683년 9월 12일 — 칼렌베르크 언덕 위에서 소비에스키의 날개 기병이 내려가는 것을 보았다. (사교 명성 +' + so + ')');
      refresh(); return;
    }
    var r = await fight('카라 무스타파의 오스만 대군', K().v2.army, { guns: true, hold: 3, leader: '카라 무스타파 파샤', noSpecial: true });
    b.v2bat = r === 'win' ? 'won' : 'lost';
    await v2Charge(true);
    if (r === 'win') {
      var bt = fame('bt', 800), so2 = fame('so', 200); gold(10000); trust('de_emperor', 15); trust('pl_king', 15);
      await play([['sobieski', '「왔노라, 보았노라, 신께서 이기셨노라!」 — 교황 성하께 이렇게 써 보낼 참이오. 제독, 그대의 사람들이 참호를 붙잡아 준 덕에 기병이 길을 얻었소. 대재상의 천막에서 나온 금화를 나누어 주겠소.']]);
      log('1683년 9월 12일 칼렌베르크 — 구원군과 함께 오스만 대군을 무너뜨려 빈의 포위를 풀었다. (전투 명성 +' + bt + ' · 사교 명성 +' + so2 + ' · 금화 +10,000 · 황제·폴란드 왕의 신뢰 +15)');
      UI.toast('빈의 포위를 풀었다! 금화 +10,000 · 황제·폴란드 왕의 신뢰 +15', 'sword', 6000);
    } else {
      log('1683년 9월 12일 칼렌베르크 — 오스만 군의 참호에서 밀려났지만, 날개 기병이 포위를 풀었다.');
    }
    refresh();
  }
  async function v2Charge(fought) {
    await play([
      [null, '오후 다섯 시. 칼렌베르크 언덕 위에서 날개를 단 폴란드 기병 이만이 한꺼번에 내리 달렸다. 등에 꽂은 깃털이 바람을 가르며 울었다. 땅이 흔들렸다.'],
      [null, '오스만 군의 진이 무너졌다. 카라 무스타파는 녹색 깃발과 천막과 금고를 버리고 달아났다. 성벽 위의 빈 사람들은 울며 종을 쳤다.' + (fought ? ' 제독의 사람들도 흙투성이가 된 채 그 종소리를 들었다.' : '')]
    ]);
  }
  async function v2Coffee() {
    var b = st(); b.v2cof = 1;
    var room = G.Cargo && G.Cargo.room ? G.Cargo.room('coffee') : R.free ? R.free() : 0;
    var c = S().fleet.cargo || {};
    if (!c.coffee && R.maxKinds && Object.keys(c).length >= R.maxKinds()) room = 0;
    var q = Math.max(0, Math.min(K().v2.coffee, Math.floor(room)));
    await withPic('ot_coffeehouse', '콜시츠키의 커피 집', function () { return play([
      ['kolschitzky', '제독! 살아 있었구려! 이리 오시오. 오스만 군이 버리고 간 천막에서 초록색 콩 자루가 수백 개 나왔소. 다들 낙타 먹이인 줄 알고 태워 버리려 했지. 나는 그게 뭔지 알았소 — 커피! 이스탄불에서 날마다 마시던 것이오.'],
      ['kolschitzky', '그 자루를 상으로 달라고 했소. 그리고 이 「파란 병」 집을 열었지. 한 잔 하시오. 빈 사람들은 쓴 걸 못 마셔서, 찌꺼기를 거르고 우유와 꿀을 넣었소. 이게 빈의 커피요.'],
      [null, '옆 빵집에서는 초승달 모양의 빵을 굽고 있었다. 튀르크 깃발의 초승달을 씹어 먹는다는 것이다. 빈 사람들은 그 빵을 「킵펠」이라 불렀다.'],
      ['kolschitzky', q > 0 ? '그리고 이건 그대 몫이오 — 커피 ' + q + '자루. 바다 건너 어디서든 팔 수 있을 것이오. 잔도 하나 가져가시오. 그대와 내가 그 천막 사이를 걸었던 걸 잊지 않도록.' : '그대 몫의 자루를 떼어 두려 했는데, 배에 실을 자리가 없다니 아쉽구려. 대신 이 잔을 가져가시오.']
    ]); });
    if (q > 0) {
      var f = S().fleet, cg = f.cargo.coffee;
      if (cg) { R.addCargoLot(cg, VIENNA, q, 0); cg.cost = Math.round((cg.cost * cg.q) / (cg.q + q)); cg.q += q; }
      else { f.cargo.coffee = { q: q, cost: 0, from: VIENNA, d: S().day, lots: {} }; f.cargo.coffee.lots[VIENNA] = { q: q, cost: 0 }; }
    }
    var got = item('kolschitzky_cup'), so = fame('so', 80);
    log('1683년 빈 — 콜시츠키의 커피 집에서 우유와 꿀을 넣은 커피를 마셨다.' + (q ? ' 커피 ' + q + '자루를 받았다.' : '') + ' (사교 명성 +' + so + ')');
    UI.toast((q ? '커피 ' + q + '통' : '') + (q && got ? ' · ' : '') + (got ? itemName('kolschitzky_cup') : ''), 'sack', 5600);
    refresh();
  }

  // ================================================================ ⑥ 카를로비츠 조약 (1698~1699)
  function kwOpen() { var b = st(), t = today(), k = K().kw; return !!(b && !b.kw && k.cities.indexOf(cityNow()) >= 0 && t >= k.from && t <= k.to); }
  var KW = [
    { value: 'lots', label: '제비를 뽑아 들어갈 차례를 정한다', no: ['paget', '제비에 진 나라는 평생 그 제비를 원망할 것이오. 술탄의 사절이 제비뽑기로 황제의 사절 뒤에 섰다고 이스탄불에 전해지는 날, 이 회담은 끝이오.'] },
    { value: 'old', label: '가장 오래된 나라의 사절부터 들어간다', no: ['mavro', '그렇다면 로마를 물려받은 콘스탄티노플의 주인, 우리 술탄의 사절이 맨 먼저겠군요. (황제의 사절이 탁자를 내리치며 일어섰다)'] },
    { value: 'round', label: '문을 사절단 수만큼 낸 둥근 정자를 짓고, 둥근 탁자를 놓는다', ok: true }
  ];
  OE.KW = KW;
  async function karlowitz() {
    var b = st(), k = K().kw; b.kw = 'met';
    var cn = (G.CITY_DATA[cityNow()] || {}).name || '이 도시';
    await withPic('ot_karlowitz', '카를로비츠 (1698)', function () { return play([
      [null, cn + '에서 들은 소식을 좇아 도나우 강가의 작은 마을 카를로비츠로 갔다. 열여섯 해의 전쟁에 지친 나라들의 사절이 모였다 — 황제, 술탄, 베네치아, 폴란드. 그런데 회담은 시작도 못 하고 있다.'],
      ['paget', '제독, 그대는 여러 나라 항구를 드나든 사람이니 이 일을 알 것이오. 나는 잉글랜드 대사 패짓, 네덜란드 대사와 함께 이 회담을 맡은 중재인이오. 누가 먼저 문을 들어서느냐, 누가 윗자리에 앉느냐로 벌써 한 달째요.'],
      ['mavro', '술탄 폐하의 사절이 남의 문 앞에서 기다릴 수는 없소. 그렇다고 황제의 사절이 우리 뒤를 따르지도 않겠지요. 먼저 들어가는 쪽이 지고 들어가는 쪽이 된다 — 다들 그렇게 믿소.'],
      ['paget', '그대라면 어떻게 하겠소? 이 겨울이 가기 전에 붓을 들게 해야 하오.']
    ]); });
    var ok = false, tries = 0;
    while (!ok && tries < k.tries) {
      tries++;
      var v = await UI.ask('카를로비츠 — 누구도 먼저 들어서지 않게 하려면?', KW.map(function (x) { return { label: x.label, value: x.value }; }), who('paget'));
      var o = KW.filter(function (x) { return x.value === v; })[0] || KW[0];
      if (o.ok) ok = true; else await play([o.no]);
    }
    b.kwTry = tries;
    if (!ok) await play([['paget', '…그래, 목수에게 물었더니 이러더군. 「문을 여럿 내면 되지 않습니까?」 하하. 때로는 대사보다 목수가 낫소.']]);
    await play([
      ['paget', ok ? '…문이 여럿인 둥근 집이라. 누구도 먼저 들어서지 않고, 누구도 윗자리에 앉지 않는다. 좋소! 당장 목수를 부르겠소.' : '문이 여럿인 둥근 집. 누구도 먼저 들어서지 않고, 누구도 윗자리에 앉지 않소.'],
      [null, '며칠 뒤 강가에 둥근 나무 정자가 섰다. 사절단마다 제 문으로 동시에 들어와, 둥근 탁자에 둘러앉았다. 회담이 시작되었다.'],
      ['mavro', '(제독에게 낮은 목소리로) 문은 여럿이지만 나가는 길은 하나뿐이오. 우리는 헝가리를 내주게 될 것이오. 백오십 년 만에 처음으로, 오스만이 지고 들어온 회담이오.']
    ]);
    b.kw = ok ? 'solved' : 'carpenter';
    var so = fame('so', !ok ? 100 : tries === 1 ? 300 : 200); trust('de_emperor', 5); trust('ot_sultan', 5);
    var got = item('karlowitz_knob');
    log('카를로비츠 강화 회담 — 「문을 사절단 수만큼 낸 둥근 정자」' + (ok ? '를 내놓아' : '가 지어져') + ' 회담이 시작되었다. (사교 명성 +' + so + ')');
    UI.toast(got ? itemName('karlowitz_knob') + ' · 사교 명성 +' + so : '사교 명성 +' + so, 'scroll', 5600);
    refresh();
  }

  // ================================================================ 날마다 — 소식
  OE.daily = function () {
    var b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told;
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    var v1 = b.v1 && b.v1 !== 'watch', v2 = b.v2met;
    news('salm', !!b.v1, 'skull', '【잘름 백작의 죽음】 빈 포위 때 돌 조각에 넓적다리를 다친 니클라스 잘름 백작이 끝내 일어나지 못했다. 일흔한 살. ' + (v1 ? '그는 숨을 거두기 전 「바다에서 온 제독의 사람들」 이야기를 했다고 한다.' : '빈 사람들은 그를 도시를 지킨 노장으로 기억한다.'));
    news('hormuz', true, 'skull', '【호르무즈 함락】 사파비 왕조의 이맘 쿨리 칸과 잉글랜드 동인도 회사의 함대가 열 주 넘게 에워싼 끝에, 호르무즈의 포르투갈 요새가 항복했다. 백 년 넘게 페르시아만 어귀를 쥐고 있던 포르투갈의 열쇠가 떨어졌다. 샤 아바스는 맞은편 본토의 감브룬 항구를 자기 이름을 따 「반다르 아바스」라 부르게 한다.' +
      (b.hz === 'defendWon' ? ' 제독이 건져 낸 상관의 장부와 사람들은 무스카트에 닿았다.' : b.hz === 'persiaWon' ? ' 리스본의 궁정에서는 그 바다에 포르투갈 깃발을 단 배 한 척이 페르시아 편에 섰다는 말이 돈다.' : ''));
    news('muscat', true, 'skull', '【무스카트 함락】 성탄을 지내던 포르투갈 수비대를 오만의 술탄 빈 사이프가 덮쳤다. 잘랄리와 미라니 두 요새가 무너지고, 살아남은 칠백여 명이 배를 타고 인도의 디우로 달아났다. 포르투갈은 아라비아 바다의 마지막 큰 항구를 잃었다 — 이제 오만의 배가 인도양과 동아프리카로 나선다.');
    news('karamustafa', !!v2, 'skull', '【카라 무스타파의 최후】 빈에서 진 대재상 카라 무스타파 파샤가 베오그라드에서 술탄이 보낸 비단 끈에 목숨을 잃었다. 신성 동맹의 군대는 헝가리로 밀고 내려간다.');
    news('mombasa', true, 'skull', '【몸바사 함락】 오만의 함대가 서른세 달을 에워싼 끝에 몸바사의 예수 요새가 무너졌다. 스와힐리 해안이 오만의 것이 되고, 포르투갈은 희망봉 북쪽 동아프리카에서 모잠비크만을 남긴다.');
    news('karlowitz', true, 'scroll', '【카를로비츠 조약】 도나우 강가의 카를로비츠에서 열여섯 해의 대튀르크 전쟁이 끝났다. 오스만 제국이 헝가리 대부분과 트란실바니아를 합스부르크에, 모레아(펠로폰네소스)와 달마티아 일부를 베네치아에, 포돌리아를 폴란드에 넘겼다. 오스만이 처음으로 크게 땅을 내준 조약 — 유럽 동남쪽의 저울이 기울었다.' +
      (b.kw ? ' 사절들은 문이 여럿 달린 둥근 정자에서 서명했다.' : ''));
    if (!b.mods && t >= NEWS_AT.karlowitz && G.Rel && G.Rel.set) {
      b.mods = 1;
      G.Rel.set('HRE', 'OT', 10, 1700, '카를로비츠 조약'); G.Rel.set('VE', 'OT', 10, 1700, '카를로비츠 조약'); G.Rel.set('PL', 'OT', 10, 1700, '카를로비츠 조약');
    }
    return out;
  };

  // ================================================================ 도시에 들어설 때 · 바다의 하루 끝 · 수첩
  OE.pending = function () { var s = S(); if (!s || !s.loc || s.loc.mode !== 'city') return false; return v1Open() || hzOpen() || msOpen() || v2BatOpen() || v2SpyOpen() || v2CofOpen() || kwOpen(); };
  OE.check = async function () {
    if (OE._busy) return false; OE._busy = true;
    try {
      if (v1Open()) await vienna1();
      else if (hzOpen()) await hormuz();
      else if (msOpen()) await muscat();
      else if (v2BatOpen()) await v2Battle();
      else if (v2SpyOpen()) await v2Spy();
      else if (v2CofOpen()) await v2Coffee();
      else if (kwOpen()) await karlowitz();
    } catch (e) { console.error(e); }
    OE._busy = false;
    return true;
  };
  OE.seaPending = function () { return !!(S() && pvOpen()); };
  OE.atSea = async function () {
    if (OE._busy) return false; OE._busy = true;
    try { if (pvOpen()) await preveza(); } catch (e) { console.error(e); }
    OE._busy = false;
    return true;
  };
  OE.html = function () {
    var s = S(), b = s && s.ottoEu; if (!b) return '';
    var t = today(), k = K().v2, li = [];
    if (b.v2spy && b.v2spy !== 'skip' && !b.v2bat && t <= k.battleTo) li.push('1683년 9월 1일~12일 비엔나 — 칼렌베르크 언덕에서 소비에스키의 구원군과 함께');
    if (((b.v2spy && b.v2spy !== 'skip') || (b.v2bat && b.v2bat !== 'skip')) && !b.v2cof && t <= k.coffeeTo) li.push('1684년이 끝나기 전 비엔나 — 콜시츠키가 기다린다');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">빈의 두 번째 포위</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._ottoEuHtml) { G.Court._ottoEuHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + OE.html(); }; }
  (function hookDaily() {
    var W = G.World; if (!W || W._ottoEu) return;
    W._ottoEu = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(OE.daily()); } catch (e) { console.error(e); } return out; };
  })();
  OE._t = { vienna1: vienna1, preveza: preveza, hormuz: hormuz, muscat: muscat, v2Spy: v2Spy, v2Battle: v2Battle, v2Coffee: v2Coffee, karlowitz: karlowitz };
})(window.G = window.G || {});
