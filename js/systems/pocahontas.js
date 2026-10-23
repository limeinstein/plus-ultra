/* 포카혼타스 — 두 세계 사이에 선 여성 (G.Pocahontas) 2026-10-20 사용자 요청
   ■ 언제: 아즈텍 제국이 무너진 뒤(1521년 8월 13일 테노치티틀란 함락 이후) 북아메리카·중앙아메리카(카리브 포함)의 항구 도시에 들어서면.
          제독이 노예 무역을 한 적이 없을 때만 (s.slaver — 이 대의 제독이 노예를 사고판 적이 있으면 그녀는 나타나지 않는다).
   ■ 흐름: 항구 밖 옥수수밭 가장자리에서 정착민 민병대와 원주민 전사들이 맞선다 — 제독은 (가) 정착민 편 (나) 원주민 편 (다) 사이에서 말린다.
          어느 쪽이든 활시위와 화승이 먼저 당겨져 싸움(육상전)이 벌어지고, 첫 차례의 화살과 총알이 오간 뒤(그 전에 끝나도) 사슴 가죽 옷의 소녀가 두 줄 사이로 달려 나와
          제 몸으로 싸움을 막는다 — 포와탄의 성인 딸 마토아카, 사람들이 「포카혼타스(장난꾸러기)」라 부르는 여성. 양쪽이 무기를 내리고, 그녀가 두 세계 사이의 말을 옮겨 화해시킨다.
          그녀는 바다 건너 이방인의 나라를 보고 싶다며 제독의 배에 오르기를 청한다 → 동료로 합류 (거절하면 coolDays 뒤 다른 항구에서 다시).
   ■ 동료: 요리·웅변·세공·음악·조선 3단계, 검술 2단계 (지역 사람 h_pocahontas — 술집에는 나오지 않고 이 사건으로만 만난다: eventOnly)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/pocahontas_*.webp — images/legend-events/POCAHONTAS_PROMPT.md
   ■ 저장: s.poca = { done, side: 'settler'|'native'|'between', res, cool, declined } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var PC = G.Pocahontas = {};
  var ID = 'h_pocahontas';
  PC.K = { aztecFall: 15210813, afterAztecEnd: 30, coolDays: 90, haltTurn: 1, natives: 24, militia: 18, scale: 0.9, fameSo: 120 };
  PC.SKILLS = { cook: 3, speech: 3, craft: 3, music: 3, ship: 3, sword: 2 };

  // ---------------------------------------------------------------- 사람: 지역 사람 h_pocahontas를 사건 전용 동료로
  (function setup() {
    var m = G.MATE && G.MATE[ID]; if (!m) return;
    m.sk = U.clone ? U.clone(PC.SKILLS) : JSON.parse(JSON.stringify(PC.SKILLS));
    m.skBoost = 1; m.eventOnly = true;
    m.y = [1521, 1700];
    m.desc = '체서피크 강가 포와탄 연맹의 대추장의 성인 딸 마토아카. 장난기 많고 겁이 없어 「포카혼타스(장난꾸러기)」라 불린다. 옥수수빵과 사슴고기 스튜를 끓이고, 조개껍데기 구슬과 깃털로 장신구를 엮고, 노래와 북으로 사람들을 모은다. 통나무를 불로 파내 카누를 만드는 솜씨가 뛰어나고, 두 세계 사이에서 말을 옮겨 싸움을 그치게 한다.';
    if (!m.lg) m.lg = {}; m.lg[15] = 3; if (!m.lg[3]) m.lg[3] = 1;
  })();

  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.poca || (s.poca = {}); }
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row() { return S().mates.filter(function (x) { return x.id === ID; })[0] || null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function poca(emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(ID, emo) : { name: '포카혼타스', portrait: G.Scenes.mateSpec ? G.Scenes.mateSpec(ID) : null, lang: 3 }; }
  function eventSpeaker(name, key, role, style) {
    var A = G.Art, portrait = A.withImg(A.npcSpec('pocahontas_' + key, role, style, 'm'), ['portraits/history/' + key]);
    return { name: name, portrait: portrait, half: ['portraits/history/' + key + '_half'], lang: 3 };
  }
  var MILITIA = eventSpeaker('정착민 민병대장', 'pocahontas_militia', 'soldier', 'ne');
  var WARRIOR = eventSpeaker('포와탄 전사의 우두머리', 'pocahontas_warrior', 'native', 'na');
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      await UI.say(l[1], l[0] === 'P' ? me() : l[0] === 'POCA' ? poca(l[2]) : l[0] === 'MIL' ? MILITIA : l[0] === 'WAR' ? WARRIOR : {});
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }

  /** 북아메리카·중앙아메리카(카리브 포함)의 항구 도시인가 — 남아메리카 본토의 카리브 해안은 빼고 */
  PC.isPort = function (c) { return !!(c && c.port && c.region === 10 && c.lat >= 7.2 && c.lon < -50 && !(c.lat < 12.6 && c.lon > -77.3)); };   // 남아메리카 북쪽 해안(카르타헤나·산타마르타·베네수엘라)은 뺀다
  /** 이 대의 제독이 노예 무역을 한 적이 있는가 */
  PC.slaver = function () { var s = S(), r = s && s.slaver; return !!(r && (r.gen || 1) === (s.player.generation || 1)); };
  /** 지금 만날 수 있는가 */
  PC.ready = function () {
    var s = S(); if (!s || !G.MATE[ID]) return false;
    var p = st();
    if (p.done || row() || s.flags['gone_' + ID]) return false;
    if (p.cool && s.day < p.cool) return false;
    if (today() < PC.K.aztecFall) return false;
    if (PC.slaver()) return false;
    if (PC.busyDay()) return false;
    return true;
  };
  /** 아즈텍 결말과 포카혼타스(육상전 포함)가 같은 입항에서 연달아 뜨던 것 — 아즈텍 결말 뒤 30일, 또는 오늘 아즈텍·잉카 장면이 이미 떴으면 다음으로 (QA 2026-10-23) */
  PC.busyDay = function () {
    var s = S(), now = U.dayIndex(s.date), az = s.aztec;
    if (az && az.endDay != null && now - az.endDay < PC.K.afterAztecEnd) return true;
    if (G.Aztec && G.Aztec.evDay === now) return true;
    if (G.IncaFall && G.IncaFall.evDay === now) return true;
    return false;
  };
  PC.pending = function () { var c = cityNow(); return c != null && PC.isPort(G.CITY_DATA[c]) && PC.ready(); };
  PC.check = async function () {
    if (PC._busy) return false; PC._busy = true;
    try { await meet(G.CITY_DATA[cityNow()]); } catch (e) { console.error(e); }
    PC._busy = false;
    return true;
  };

  /** 도시 안에서 뭍의 싸움 — 함대의 선원으로 (js/systems/incafall.js 와 같은 방식). 첫 차례가 끝나면 포카혼타스가 끼어든다 */
  async function fight(name, n, kind) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'truce';
    var keep = s.loc.party; s.loc.party = Math.max(1, Math.min(s.fleet.crew, 40));
    try {
      return await L.landBattle(name, n, false, { kind: kind, guns: kind === 'garrison',
        halt: { turn: PC.K.haltTurn, banner: '멈추세요!', text: '그때 사슴 가죽 옷을 입은 젊은 여성이 두 줄 사이로 달려 나와 두 팔을 벌렸다. 「멈추세요! 이 사람들을 쏘려거든 나부터 쏘세요!」',
          after: '여성이 두 줄 사이에 버티고 서자, 양쪽이 하나둘 무기를 내렸다.', toast: '포카혼타스가 싸움을 멈추게 했다.' } });
    } finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }

  async function meet(c) {
    var p = st(), cn = c ? c.name : '항구';
    if (p.res) return again(c);          // 싸움을 말린 뒤 한 번 거절했다 — 이번에는 그녀가 부두로 찾아온다
    await play([
      [null, cn + ' 항구에 배를 대자마자 성 밖에서 고함이 들린다. 정착민들이 새로 일군 옥수수밭 가장자리 — 화승총을 든 민병대와, 활과 곤봉을 든 원주민 전사들이 마주 서 있다.'],
      ['MIL', '저놈들이 밤마다 우리 밭의 옥수수를 훔쳐 간다! 오늘은 본때를 보여 주겠다. 바다에서 온 손님, 마침 잘 왔소. 우리를 도우시오!'],
      ['WAR', '(손짓을 섞어) 이 땅은 우리 조상이 사슴을 쫓던 땅이다. 너희가 울타리를 치고 나무를 베어 냈다. 옥수수는 우리가 너희에게 나누어 준 것이었다!'],
      [null, '활시위가 당겨지고, 화승에 불이 붙는다. 선원들이 제독을 돌아본다.']
    ]);
    var side = await UI.ask('정착민과 원주민이 금방이라도 싸울 기세다. 어떻게 하겠는가?', [
      { label: '정착민 편에 선다', value: 'settler', icon: 'sword' },
      { label: '원주민 편에 선다', value: 'native', icon: 'people' },
      { label: '두 줄 사이로 나가 말린다', value: 'between', icon: 'scales' }
    ], me());
    side = side || 'between';
    p.side = side;
    if (side === 'settler') await play([['P', '총을 내려놓을 생각이 없다면, 우리도 손님으로만 있을 수는 없지. 모두 정착민 쪽으로!']]);
    else if (side === 'native') await play([['P', '먼저 땅을 빼앗은 쪽이 누구인지는 보면 안다. 우리는 이 땅 사람들 편에 서겠다!']]);
    else await play([['P', '모두 무기를 내려라! 옥수수 몇 자루 때문에 피를 흘릴 셈인가!'], [null, '그러나 말이 끝나기도 전에 누군가의 화살이 날았고, 화승총이 불을 뿜었다. 선원들도 휘말려 칼을 뽑는다.']]);
    var crew = Math.max(1, Math.min(S().fleet.crew, 40)), k = PC.K.scale;     // 적은 우리 대원 수만큼 — 한 차례 만에 끝나지 않게
    var res = side === 'native' ? await fight('정착민 민병대', Math.max(PC.K.militia, Math.round(crew * k)), 'garrison') : await fight('원주민 전사', Math.max(PC.K.natives, Math.round(crew * k)), 'native');
    p.res = res;
    var pc = pic('pocahontas_truce', '두 줄 사이에 선 여성');
    try {
      await play([
        [null, res === 'truce' ? '연기가 걷히자, 두 줄 사이에 젊은 여성이 두 팔을 벌리고 서 있다. 활동적인 사슴 가죽 옷에 조개껍데기 구슬을 두르고, 검은 머리를 한 갈래로 땋았다.'
          : '싸움이 끝나 갈 무렵, 사슴 가죽 옷의 여성이 쓰러진 사람들 사이로 달려 나와 두 팔을 벌렸다. 더는 아무도 활도 총도 들지 못했다.'],
        ['POCA', '멈추세요! 옥수수는 다시 심으면 자라요. 죽은 사람은 다시 자라지 않아요!'],
        ['WAR', '…마토아카. 대추장 포와탄의 딸이 어찌 여기에.'],
        ['POCA', '아버지의 말을 바닷가 마을들에 전하러 가던 길이었어요. (전사들에게, 자기 말로) 활을 내려요. 이 사람들의 늙은이와 아이들도 겨울을 넘겨야 해요.'],
        ['POCA', '(정착민들에게, 서툰 이방인의 말로) 당신들, 울타리, 너무 많아요. 사슴 길, 막지 마세요. 옥수수, 우리가 심는 법 가르쳐 줄게요. 대신 쇠 도끼와 구리 냄비를 주세요.'],
        ['MIL', '…이 아이가 하는 말이 틀리지 않소. 굶주린 겨울에 우리에게 옥수수를 가져다준 것도 저 사람들이었지. 좋소, 밭 가장자리에 표를 세우고 사슴 길은 열어 두겠소.'],
        ['WAR', '마토아카의 말이라면 우리도 따르겠다. 오늘은 피 대신 담배를 나누자.'],
        [null, '양쪽이 무기를 내려놓고, 옥수수밭 가운데서 담뱃대가 돌았다. 소녀는 두 사람 사이에서 말을 옮기며 웃는다.']
      ]);
      if (side === 'settler') await play([['POCA', '당신은 정착민 편에 섰지요. 그래도 내가 나섰을 때 제일 먼저 총을 내리라고 한 사람도 당신이었어요.']]);
      else if (side === 'native') await play([['POCA', '이방인인데 우리 편에 서 주었지요. 아버지께 꼭 이야기할게요 — 바다에서 온 사람 가운데에도 우리 말을 들을 줄 아는 사람이 있다고.']]);
      else await play([['POCA', '당신은 처음부터 싸움을 말리려 했지요. 이방인들 사이에서 그런 사람은 처음 봤어요.']]);
    } finally { await pc.stop(); }
    var so = G.Fame.add('so', PC.K.fameSo);
    G.State.log(cn + ' 밖 옥수수밭에서 정착민과 원주민의 싸움이 벌어졌으나, 포와탄의 딸 포카혼타스가 나서서 말렸다. (사교 명성 +' + so + ')');
    await ask(c);
  }
  /** 거절한 뒤 다시: 다른 항구의 부두에서 */
  async function again(c) {
    await play([
      [null, (c ? c.name : '항구') + '의 부두. 카누 한 척이 배 곁에 와 닿더니, 사슴 가죽 옷의 여성이 뱃전으로 훌쩍 올라온다.'],
      ['POCA', '또 만났네요! 옥수수밭에서 싸움을 말리던 날 기억하지요? 그 뒤로 그 마을은 조용해요. 사슴 길도 열려 있고요.']
    ]);
    await ask(c);
  }
  async function ask(c) {
    var p = st();
    var pc2 = pic('pocahontas_join', '바다 건너를 보고 싶은 아이');
    try {
      await play([
        ['POCA', '당신의 배는 저 큰 물 건너에서 왔지요? 이방인들은 해가 뜨는 쪽 끝에 커다란 마을들이 있다고 해요. 돌로 지은 집과, 물 위에 떠 있는 집들이 있다고.'],
        ['POCA', '나는 보고 싶어요. 그 사람들이 어떻게 사는지, 무엇을 먹고 무엇을 노래하는지. 그래야 두 세계 사이에서 말을 제대로 옮길 수 있으니까요.'],
        ['POCA', '나를 데려가 줘요. 옥수수빵도 굽고, 사슴고기 스튜도 끓이고, 카누도 만들 줄 알아요. 노래도 하고요. 칼도… 조금은 써요.']
      ]);
      var ok = await UI.ask('포카혼타스가 배에 태워 달라고 청한다 (요리·웅변·세공·음악·조선 3단계, 검술 2단계)', [
        { label: '함께 가자', value: 1, icon: 'people' }, { label: '아직은 이르다', value: 0 }], me());
      if (ok) {
        var nm = G.Legend && G.Legend.join ? G.Legend.join(ID, c) : null;
        if (!nm) { var s = S(); s.mates.push({ id: ID, role: 'none', joined: U.dateNum(s.date), loyal: 85, from: c ? c.id : null }); }
        p.done = 1;
        await play([['POCA', '고마워요! 아버지께는 바닷가 마을 사람들 편에 말을 남길게요. 이제부터 나는 당신 배의 사람이에요.', 'happy']]);
        G.State.log('포카혼타스가 동료가 되었다. 두 세계 사이의 말을 옮기겠다고 한다.');
      } else {
        p.cool = S().day + PC.K.coolDays; p.declined = (p.declined || 0) + 1;
        await play([['POCA', '…그래요. 그럼 다음에 또 바닷가 어딘가에서 만나요. 그때는 꼭 데려가 줘요.']]);
      }
    } finally { await pc2.stop(); }
    if (G.Game.refreshHud) G.Game.refreshHud();
  }
  PC._test = { meet: meet, speakers: { militia: MILITIA, warrior: WARRIOR } };
})(window.G = window.G || {});
