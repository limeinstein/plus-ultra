/* 위그노 내전 — 라로셸 포위 (G.Huguenot) 2026-10-29 사용자 요청 「달타냥과 삼총사가 부하로 있으면 위그노 내전 이벤트가 발생」
   ■ 언제: 달타냥·아토스·포르토스·아라미스 넷이 모두 부하일 때, 1562년(첫 위그노 전쟁) 이후 프랑스 왕의 도시(주인 프랑스)에 들어서면 — 국왕의 전령이 총사들을 부른다.
          (1572~73년 앙주 공작의 라로셸 포위 · 1627~28년 리슐리외 추기경의 라로셸 포위 — 해에 따라 왕군의 대장이 달라진다)
   ■ 흐름: ① 부름 — 총사 넷이 저마다의 마음을 털어놓는다 (아토스의 침묵 · 포르토스의 허세 · 아라미스의 신앙 · 달타냥의 의리)
          ② 라로셸 앞바다(북위 45.9~46.4° · 서경 1.0~1.8°)에 닿으면 — 굶주린 성과 바다를 막은 왕의 함대. 어느 편에 설까?
             · 왕의 군대 — 「생제르베 보루의 아침 식사」: 넷이 내기를 걸고 무너진 보루에서 아침을 먹으며 버틴다 (육상전 퇴각 판 · 두 차례 버티면 이긴다)
             · 굶주린 성 — 식량을 싣고 봉쇄를 뚫는다 (왕실 함대와의 해전 · 식량 30일분을 성에 넘긴다)
             · 화평 — 아라미스와 함께 양쪽 진영을 오가며 화약(和約)을 주선한다 (웅변·신학·매력으로 — 실패하면 다시 고른다)
             · 지금은 물러난다 — 한 달 뒤 다시 그 바다에 오면
          ③ 끝 — 고른 편에 따라 보상 · 총사 넷의 충성 +10 · 넷이 칼을 모으며 「모두는 하나를 위하여」
   · 지면(보루를 내주거나 해전에서 물러나면) 이야기는 그대로 — 한 달 뒤 다시 라로셸 앞바다에서 고를 수 있다
   · 장면 그림 (없으면 건너뜀): images/legend-events/huguenot_call · huguenot_bastion · huguenot_blockade · huguenot_peace — 주문서 images/legend-events/HUGUENOT_PROMPT.md
   · 저장: s.huguenot = { phase: 'call'|'done', at: 날번호, side: 'king'|'city'|'peace', tries } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var HG = G.Huguenot = {};
  var FOUR = ['d_artagnan', 'athos', 'porthos', 'aramis'];
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.huguenot = G.BALANCE.huguenot || {};
  (function (b) {
    if (b.from == null) b.from = 1562;                        // 첫 위그노 전쟁
    if (b.box == null) b.box = [-1.8, -1.0, 45.9, 46.4];       // 라로셸 앞바다 [서경, 동경, 남위, 북위]
    if (b.wait == null) b.wait = 30;                          // 물러나거나 진 뒤 다시 고를 수 있는 날
    if (b.food == null) b.food = 30;                          // 성에 넘기는 식량 (함대 하루치 × 이만큼)
    if (b.king == null) b.king = { gold: 30000, fame: 40, trust: 10 };
    if (b.city == null) b.city = { gold: 20000, fame: 30, so: 20, trust: -10 };
    if (b.peace == null) b.peace = { gold: 10000, so: 60, trust: 6 };
  })(G.BALANCE.huguenot);
  function K() { return G.BALANCE.huguenot; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.huguenot || (s.huguenot = {}); }
  HG.state = st;
  function row(id) { return (S().mates || []).filter(function (m) { return m.id === id; })[0] || null; }
  HG.allFour = function () { return FOUR.every(function (id) { return !!row(id) && !(R.mateHidden && R.mateHidden(row(id))); }); };
  function who(id, emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, portrait: G.Art.mateSpec(id), lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function say(id, t, emo) { return UI.say(t, who(id, emo)); }
  function narrate(t) { return UI.say(t, {}); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  /** 해에 따른 왕군의 대장 (1572~73 앙주 공작 · 1627~28 리슐리외 추기경) */
  function besieger() { var y = S().date.y; return y >= 1620 ? '리슐리외 추기경' : y >= 1589 ? '국왕의 원수' : '앙주 공작 앙리'; }
  function eventSpeaker(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  /** 시대별 지휘관은 이미 있는 재상·국왕 초상을, 이름 없는 원수는 새 전용 초상을 쓴다. */
  function commander() {
    var y = S().date.y, name = besieger(), id = y >= 1620 ? 'fr_minister' : 'fr_king';
    if (y >= 1589 && y < 1620) return eventSpeaker('hg_marshal');
    var sp = G.SPONSOR && G.SPONSOR[id], target = y >= 1620 ? '리슐리외' : '앙리 3세', index = -1;
    if (sp) for (var i = 0; i < sp.holders.length; i++) if (sp.holders[i][2].indexOf(target) >= 0) { index = i; break; }
    if (sp && index >= 0 && G.Art && G.Img) {
      var portrait = G.Art.sponsorSpec(sp, index);
      return { name: name, portrait: portrait, half: G.Img.chain.halfOf(G.Art.portraitKeys(portrait)), lang: 3 };
    }
    var fallback = eventSpeaker('hg_marshal'); fallback.name = name; return fallback;
  }
  function kingSp() { var sp = G.SPONSOR && G.SPONSOR.fr_king; return sp && G.Sponsor && G.Sponsor.present(sp) ? sp : null; }
  function trust(n) { var sp = kingSp(); if (sp && n) { var rel = G.Sponsor.rel(sp.id); G.Sponsor.addTrust(rel, n); } return sp; }
  function loyalUp(n) { FOUR.forEach(function (id) { var m = row(id); if (m) R.setLoyal(m, Math.min(100, (m.loyal == null ? 70 : m.loyal) + n)); }); }

  // ---------------------------------------------------------------- ① 부름 (프랑스 왕의 도시에 들어설 때 — js/scenes/city.js)
  HG.pending = function () {
    var s = S(); if (!s || !s.loc || s.loc.mode !== 'city') return false;
    var p = st(); if (p.phase) return false;
    if (s.date.y < K().from || !HG.allFour()) return false;
    var c = G.CITY_DATA[s.loc.city]; return !!c && (R.cityOwner ? R.cityOwner(c) : c.nation) === '프랑스';
  };
  HG.check = async function () {
    if (!HG.pending() || HG._busy) return false;
    HG._busy = true;
    try { await call(); } finally { HG._busy = false; }
    return true;
  };
  async function call() {
    var s = S(), p = st(), c = G.CITY_DATA[s.loc.city], bs = besieger(), pc = pic('huguenot_call', '왕의 전령');
    try {
      await narrate(c.name + '의 부두에 내리자마자 푸른 제복의 전령이 말을 몰아 달려온다. 가슴에 단 백합 문장 — 국왕의 사자다. 전령은 제독이 아니라 그 뒤에 선 네 사람 앞에 멈춰 선다.');
      await UI.say('국왕 총사대의 달타냥, 아토스, 포르토스, 아라미스! 폐하의 명이오. 라로셸의 위그노들이 성문을 닫고 왕에게 맞섰소. ' + bs + '의 군대가 성을 에워쌌으니, 총사들은 곧장 라로셸 진영으로 오라 하셨소!', eventSpeaker('hg_messenger'));
      await say('d_artagnan', '라로셸이라…. 제독, 위그노들은 같은 프랑스 사람입니다. 그래도 왕명은 왕명입니다. 제 칼은 폐하께 맹세한 칼이니까요.');
      await say('athos', '……성 안에는 굶주린 아이들도 있을 것이오. 같은 하느님께 기도하는 방식이 다르다고 서로 목을 베는 전쟁이지. 나는 명예롭게 싸울 수 있는 싸움인지 내 눈으로 보고 정하겠소.');
      await say('porthos', '하하! 전쟁이라면 내 차례지! 라로셸의 성벽쯤 이 어깨로 밀어 버리겠소. 그런데 거기 가면 밥은 주는 거요?');
      await say('aramis', '저는 언젠가 사제가 될 사람입니다, 제독. 개종을 강요하는 칼에도, 왕을 거역하는 칼에도 하느님의 뜻은 없습니다.\f……양쪽 진영에 아는 이가 있습니다. 어쩌면 칼이 아닌 길도 있을지 모르지요.');
      await say('d_artagnan', '제독, 라로셸은 비스케이 만 — 보르도에서 북쪽으로 반나절 뱃길입니다. 우리를 그 앞바다까지만 데려다주십시오. 어느 편에 설지는…… 제독과 함께 정하겠습니다. 모두는 하나를 위하여!');
      await UI.say('하나는 모두를 위하여!', who('porthos'));
    } finally { await pc.stop(); }
    p.phase = 'call'; p.at = s.day - K().wait; p.tries = 0;
    G.State.log('국왕의 전령이 총사 넷을 라로셸 진영으로 불렀다 — 위그노들이 성문을 닫고 ' + bs + '의 군대가 성을 에워쌌다.', 'B');
    UI.toast('위그노 내전 — 총사들을 라로셸 앞바다(북위 46°·서경 1.2° 언저리)로', 'sword', 6500);
  }

  // ---------------------------------------------------------------- ② 라로셸 앞바다 (바다의 하루 끝 — js/scenes/sea.js)
  HG.inBox = function (lon, lat) { var b = K().box; return lon >= b[0] && lon <= b[1] && lat >= b[2] && lat <= b[3]; };
  HG.seaPending = function () {
    var s = S(), p = s && st(); if (!s || !s.loc || s.loc.mode !== 'sea' || !p || p.phase !== 'call') return false;
    if (s.day - (p.at || 0) < K().wait || !HG.allFour()) return false;
    return HG.inBox(s.loc.lon, s.loc.lat);
  };
  HG.atSea = async function () {
    if (!HG.seaPending() || HG._busy) return false;
    HG._busy = true;
    try { await rochelle(); } finally { HG._busy = false; }
    return true;
  };
  async function rochelle() {
    var s = S(), p = st(), bs = besieger(), first = !p.tries;
    p.tries = (p.tries || 0) + 1; p.at = s.day;
    if (first) {
      await narrate('수평선 너머로 라로셸의 두 탑이 보인다. 항구 어귀에는 왕의 군함들이 닻을 내리고 쇠사슬과 말뚝으로 바닷길을 막았다. 뭍에서는 ' + bs + '의 진영에서 대포 연기가 오르고, 성벽 위에는 위그노들의 깃발이 아직 펄럭인다.');
      await say('athos', '성 안 사람들은 벌써 몇 달째 말과 가죽을 삶아 먹는다더군. 항구가 막혔으니 바다로는 빵 한 조각 못 들어가겠지.');
      await say('d_artagnan', '제독, 왕의 진영에서는 총사대가 앞에 서기를 바랄 겁니다. ……허나 제독이 다른 길을 고른다 해도, 저는 제독을 따르겠습니다.');
    } else await narrate('다시 라로셸 앞바다. 왕의 군함은 여전히 항구 어귀를 막고 있고, 성벽 위의 깃발은 조금 더 해졌다.');
    var food = Math.max(1, Math.round((R.dailyUse ? R.dailyUse() : 10) * K().food)), haveFood = (s.fleet.food || 0) >= food;
    var v = await UI.ask('라로셸 — 어느 편에 설까?', [
      { label: '왕의 군대에 합류한다 — 무너진 생제르베 보루를 지킨다 (육상전)', value: 'king' },
      { label: '굶주린 성에 식량을 들여보낸다 — 왕의 봉쇄를 뚫는다 (해전 · 식량 ' + K().food + '일분)', value: 'city', dis: !haveFood },
      { label: '아라미스와 함께 화평을 주선한다 (웅변·신학·매력)', value: 'peace' },
      { label: '지금은 물러난다', value: null }], me());
    if (v === 'king') return bastion();
    if (v === 'city') return blockade(food);
    if (v === 'peace') return peace();
    await say('aramis', '서두를 일은 아니지요. 하느님도 때로는 기다리십니다. ……다만 성 안 사람들의 배는 기다려 주지 않겠지만요.');
    G.State.log('라로셸 앞바다에서 물러났다. 어느 편에 설지는 아직 정하지 않았다.');
    return false;
  }

  // ---------------------------------------------------------------- 왕의 편: 생제르베 보루의 아침 식사
  async function bastion() {
    var s = S(), p = st(), pc = pic('huguenot_bastion', '생제르베 보루의 아침 식사');
    try {
      await narrate('왕의 진영. 총사들의 막사에서 아침거리를 찾던 포르토스가 큰 소리로 내기를 건다 — 적의 포화 아래 무너진 생제르베 보루에서 한 시간 동안 아침을 먹고 버티겠다고.');
      await say('porthos', '스위스 근위대 녀석들이 그랬지, 그 보루에선 아무도 한 시간을 못 버틴다고! 좋아, 우리 넷이 거기서 아침을 먹겠다! 포도주 한 바구니를 걸지!');
      await say('athos', '……바구니에 포도주를 넉넉히 넣어 오게. 적이 오면 접시를 내려놓고, 가면 다시 들면 되네.');
      await say('d_artagnan', '제독, 대원들 몇을 데리고 함께 가 주십시오. 한 시간 — 두 번만 적을 막아 내면 됩니다!');
    } finally { await pc.stop(); }
    var party = Math.max(8, Math.min(60, s.fleet.crew || 20));
    var r = await G.Games.landWar({ enemy: { name: '라로셸의 위그노 수비대', kind: 'garrison', n: 36, leader: '위그노 대장' }, party: party, terr: 'grass', guns: false, hold: 2, flee: false });
    var lost = party - (r.left == null ? party : r.left); if (lost > 0) s.fleet.crew = Math.max(1, (s.fleet.crew || 0) - lost);
    if (r.res !== 'win') {
      await say('d_artagnan', '……보루를 내주고 말았군요. 하지만 넷 다 살아 있습니다! 한 달 뒤에 다시 오지요, 제독.');
      G.State.log('라로셸 앞 생제르베 보루를 지키지 못하고 물러났다.');
      return false;
    }
    await say('porthos', '한 시간! 아니, 한 시간하고도 반이오! 내기는 우리가 이겼소! 아, 닭다리가 하나 남았는데 누가 먹겠소?');
    await say('athos', '……이 싸움에서 이긴 것은 내기뿐이오. 성은 결국 굶주려 문을 열겠지. 그래도 오늘 우리는 서로를 지켰소.');
    finish('king');
    return true;
  }

  // ---------------------------------------------------------------- 성의 편: 봉쇄를 뚫는다
  var SPEC_ID = 'huguenot_blockade';
  function blockadeSpec() {
    return { id: SPEC_ID, foe: '프랑스', ask: '왕실 함대가 길을 막았다. 봉쇄를 뚫을까?', decline: '…오늘 밤은 물러나지요. 달 없는 밤은 또 옵니다.', ships: ['lgalleon', 'galleon', 'galleon', 'carrack', 'carrack'], foeLabel: '라로셸을 막은 프랑스 왕실 함대',
      win: { fame: K().city.fame, gold: 0, so: K().city.so, text: '라로셸의 봉쇄를 뚫고 굶주린 성에 식량을 들여보냈다!' },
      lose: '라로셸의 봉쇄를 뚫지 못하고 물러났다.',
      onWin: function () { st().won = 'win'; }, onLose: function () { st().won = 'lose'; } };   // 저장에 남겨 둔다 — 바다로 돌아와 하루가 끝나면 G.Huguenot.afterSea
  }
  async function blockade(food) {
    var s = S(), p = st(), pc = pic('huguenot_blockade', '쇠사슬을 끊어라');
    try {
      await say('athos', '좋소, 제독. 왕명을 어기는 일이지만…… 아이들이 굶어 죽는 것을 보고만 있는 것이 더 큰 불명예요.');
      await say('d_artagnan', '…총사의 망토는 잠시 벗어 두겠습니다. 오늘 밤의 저는 그냥 가스코뉴 사람입니다. 쇠사슬은 제가 끊겠습니다!');
      await say('aramis', '왕의 배에 탄 사람들도 같은 프랑스 사람입니다. 되도록 돛과 키만 노리십시오, 제독.');
      await narrate('밤. 등불을 모두 끈 함대가 짐칸 가득 밀과 소금에 절인 고기를 싣고 항구 어귀로 다가간다 — 그때 왕실 함대의 망루에서 경종이 울린다!');
    } finally { await pc.stop(); }
    p.food = food; p.won = null;
    if (G.Rel && G.Rel.register && G.Rel.greatBattle) {
      G.Rel.register(blockadeSpec());
      if (s.rel && s.rel.battle) delete s.rel.battle[SPEC_ID];   // 지난번에 졌거나 물러났어도 다시 싸울 수 있게
      p.pending = 'city';
      var went = await G.Rel.greatBattle(blockadeSpec(), null);   // 해전이 끝나면 G.Huguenot.afterSea (js/scenes/battle.js → G.Rel.afterBattle → onWin)
      if (!went) { p.pending = null; G.State.log('라로셸의 봉쇄 앞에서 뱃머리를 돌렸다.'); }
      return went;
    }
    return false;
  }
  /** 봉쇄 해전이 끝난 뒤 바다로 돌아와서 (js/scenes/sea.js — 하루 끝 훅에서 함께 본다) */
  HG.afterSea = async function () {
    var s = S(), p = st(); if (p.pending !== 'city' || !p.won) return false;
    var won = p.won === 'win'; p.won = null; p.pending = null;
    if (!won) {
      await say('d_artagnan', '쇠사슬이 생각보다 두꺼웠군요……. 한 달 뒤, 달 없는 밤에 다시 해 봅시다.');
      return false;
    }
    s.fleet.food = Math.max(0, (s.fleet.food || 0) - (p.food || 0));
    await narrate('쇠사슬이 끊어지고, 함대가 항구 안으로 미끄러져 들어간다. 부두에 몰려나온 사람들이 자루를 받아 들고 운다. 늙은 목사가 제독의 손을 잡고 오래 놓지 않는다.');
    await UI.say('우리는 왕을 배신한 적이 없소. 다만 우리 식으로 하느님께 기도할 자유를 바랐을 뿐이오. 이 빵을 잊지 않겠소, 바다의 나리.', eventSpeaker('hg_pastor'));
    finish('city');
    return true;
  };

  // ---------------------------------------------------------------- 화평
  HG.peaceChance = function () {
    var p = S().player, cha = ((p.st && p.st.cha) || 50) / 100, ar = row('aramis');
    var theo = ar ? R.mateSkill(ar, 'theo') : 0;
    return U.clamp(0.2 + (R.skill ? R.skill('speech') : 0) * 0.12 + theo * 0.08 + cha * 0.25, 0.1, 0.9);
  };
  async function peace() {
    var s = S(), p = st(), bs = besieger();
    await say('aramis', '양쪽 진영에 아는 이가 있습니다. 성 안의 목사님과 ' + bs + '의 고해 신부님이지요. 제독, 저와 함께 흰 깃발을 들고 가 주시겠습니까?');
    await narrate('흰 깃발 하나를 든 작은 배가 왕의 함대와 성벽 사이를 오간다. 사흘 밤낮, 아라미스와 제독은 막사와 성벽 위를 번갈아 오르내리며 말을 옮긴다.');
    if (G.Game.passDays) G.Game.passDays(3);
    if (!U.chance(HG.peaceChance())) {
      await UI.say('개종하지 않으면 성문을 열 수 없소. 하느님을 팔 수는 없으니.', eventSpeaker('hg_pastor'));
      await say('aramis', '……오늘은 하느님께서 귀를 기울이지 않으시는군요. 제독, 다른 길을 고르셔야겠습니다.');
      G.State.log('라로셸에서 화평을 주선했지만 양쪽이 받아들이지 않았다.');
      var v = await UI.ask('화평은 깨졌다. 어떻게 할까?', [
        { label: '왕의 군대에 합류한다 (생제르베 보루)', value: 'king' },
        { label: '굶주린 성에 식량을 들여보낸다 (봉쇄 돌파)', value: 'city', dis: (s.fleet.food || 0) < Math.round((R.dailyUse ? R.dailyUse() : 10) * K().food) },
        { label: '지금은 물러난다', value: null }], me());
      if (v === 'king') return bastion();
      if (v === 'city') return blockade(Math.max(1, Math.round((R.dailyUse ? R.dailyUse() : 10) * K().food)));
      return false;
    }
    var pc = pic('huguenot_peace', '라로셸의 화약');
    try {
      await UI.say('성 안의 사람들이 제 방식대로 기도하는 것을 막지 않겠소. 대신 성문을 열고 왕의 깃발을 다시 올리시오.', commander());
      await UI.say('……좋소. 그 약속을 왕의 이름으로 적어 준다면.', eventSpeaker('hg_pastor'));
      await say('aramis', '보십시오, 제독. 칼보다 느리지만, 칼보다 오래 가는 길입니다.');
    } finally { await pc.stop(); }
    finish('peace');
    return true;
  }

  // ---------------------------------------------------------------- ③ 끝
  function finish(side) {
    var s = S(), p = st(), k = K()[side] || {}, txt = '';
    p.phase = 'done'; p.side = side; p.end = s.day;
    var bt = k.fame ? G.Fame.add('bt', k.fame) : 0, so = k.so ? G.Fame.add('so', k.so) : 0;
    s.player.gold += k.gold || 0;
    var sp = trust(k.trust || 0);
    loyalUp(10);
    if (G.Growth) G.Growth.once('huguenot_' + side, side === 'peace' ? 'cha' : 'mar', 1, '라로셸 포위');
    txt = side === 'king' ? '라로셸 포위 — 왕의 편에서 생제르베 보루를 지켰다' : side === 'city' ? '라로셸 포위 — 봉쇄를 뚫고 굶주린 성에 식량을 들여보냈다' : '라로셸 포위 — 아라미스와 함께 왕군과 위그노 사이에 화약을 맺게 했다';
    G.State.log(txt + ' (금화 ' + U.num(k.gold || 0) + '닢' + (bt ? ' · 전투 명성 +' + bt : '') + (so ? ' · 사교 명성 +' + so : '') + (sp && k.trust ? ' · 프랑스 국왕 신뢰 ' + (k.trust > 0 ? '+' : '') + k.trust : '') + ' · 총사 넷 충성 +10).', 'B');
    UI.toast(txt, 'sword', 6000);
    HG._ending = side;
  }
  /** 끝맺는 말 — finish 뒤에 바로 (대사가 이어지도록 따로) */
  HG.ending = async function () {
    var side = HG._ending; if (!side) return; HG._ending = null;
    await say('d_artagnan', side === 'king' ? '폐하께서 총사대를 치하하셨습니다. 그런데 제독, 이상하게 마음 한구석이 무겁군요.' : side === 'city' ? '왕명을 어겼으니 파리에 가면 꾸중을 듣겠지요. ……그래도 오늘 밤 저 부두의 얼굴들은 평생 못 잊을 겁니다.' : '칼을 한 번도 뽑지 않고 이긴 싸움이라니! 아라미스, 자네가 오늘의 주인공이야.');
    await say('athos', side === 'city' ? '오늘 우리는 왕이 아니라 명예를 따랐소. 그것으로 됐소.' : '전쟁은 끝나지 않았소. 다만 오늘은 우리 넷이 함께 살아남았지.');
    await say('porthos', '자, 그럼 이제 진짜 아침을 먹으러 갑시다! 이번엔 총알 없는 데서!');
    await narrate('네 사람이 칼을 뽑아 한데 모은다.');
    await say('d_artagnan', '모두는 하나를 위하여—');
    await UI.say('하나는 모두를 위하여!', who('aramis'));
  };
  // 해전에서 돌아오면 끝맺는 말까지 (바다의 하루 끝에서 afterSea → ending)
  var atSea0 = HG.atSea;
  HG.atSea = async function () {
    var r = await atSea0.apply(this, arguments);
    if (HG._ending) await HG.ending();
    return r;
  };
  HG.afterSeaAll = async function () {
    var r = await HG.afterSea();
    if (HG._ending) await HG.ending();
    return r;
  };
  HG.seaAfterPending = function () { var s = S(), p = s && st(); return !!(p && p.pending === 'city' && p.won && s.loc && s.loc.mode !== 'battle'); };
  HG._t = { call: call, rochelle: rochelle, bastion: bastion, blockade: blockade, peace: peace, finish: finish };   // 시험용
})(window.G = window.G || {});
