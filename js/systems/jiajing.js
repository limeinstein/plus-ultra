/* 가정제의 궁궐 — 임인궁변(1542)과 경술의 변(1550) (G.Jiajing) 2026-11-05 사용자 요청
   「1542 임인궁변 — 궁녀들이 가정제를 살해하려다 실패. 이후 가정제는 서원에 머물며 도교 의례와 장생술에 더욱 몰두」
   「1550 경술의 변 — 몽골의 알탄 칸이 베이징 근교까지 침입. 수도 방어와 북방 군사 체제의 취약성이 드러남」
   사람·소지품·조정값: js/data/jiajing.js (G.BALANCE.jiajing). 큰 역사는 바뀌지 않는다. 날짜는 게임의 양력.
   (임인궁변 음력 가정 21년 10월 21일 = 1542.12.7 · 경술의 변 음력 8월 중순 = 1550.10 초 · 대동 마시 1551 · 융경화의 1571 · 귀화성 1572)
   ■ ① 용연향을 찾는 내관 (1540.1.1~1542.10.31, 명의 항구 — 광주·천주·복주·항주·하문·상해): 사례감의 고 태감이 서원의 도사 도중문이 단약에 쓸 용연향을 찾는다.
        → 약조한다: 「사례감의 통행패」(북경 성문 통행 허가 — G.Sneak.givePass) · 용연향 amber통을 북경으로 / 사양한다
   ■ ② 용연향을 바친다 (북경, ~1542.12.31): 짐칸의 용연향 → 시세의 amberK배 · 서원의 도중문
   ■ ③ 임인년의 밤 (1542.11.1~12.6, 북경 — ①에서 약조했으면 · 12.7까지 날이 지나간다):
        새벽마다 서원의 우물에서 은사발로 단약에 쓸 이슬을 받는 궁녀 소란. 그날 밤 양금영 등 궁녀 십여 명이 잠든 황제의 목을 비단 끈으로 졸랐으나 매듭이 엉켜 실패.
        방 황후가 이슬 받는 궁녀들까지 모두 잡아들이라 명한다 → 소란이 고 태감 집 뒷문으로 —
        (가) 빼낸다: 고 태감을 매수해 빈 용연향 궤짝에 숨긴다(금화) / 서직문의 금의위 순찰을 뚫는다(육상전) → 은사발 (나) 「궁의 일에 끼지 않겠소」
   ■ ④ 경술의 변 (1550): ㉮ 장가구 (1550.9.1~10.6): 변경에 몽골 척후 — (가) 북경으로 사람을 보내 알린다(성문이 하루 일찍 닫힌다) (나) 알탄 칸의 진영으로 —
        「말을 팔고 비단과 차를 살 시장을 열어 달라」 · 교섭(웅변·몽골어·중국어) 성공 → 「알탄 칸의 편지」 / 실패 → 몸값
        ㉯ 북경 (1550.9.20~10.14 — 10.7까지 날이 지나간다): 성 밖에서 약탈하는 몽골 기병 · 엄숭 「성 밖은 털어 가게 두라」 · 구란은 싸우지 않는다
        → (가) 덕승문 밖 마을을 지킨다(육상전) (나) 성문 안에 든다 · 알탄의 편지가 있으면 엄숭에게 — 이듬해 대동 마시의 실마리(금화·명성)
   ■ ⑤ 귀화성의 칸 (1572.6.1~1582.1.12, 후허호토 — ④에서 알탄과 이야기를 나눴으면): 늙은 알탄과 종금 하툰 — 「알탄 칸의 활」
   ■ 소식: 임인궁변(1542.12.7) · 처형(12.12) · 서원으로(1543.1.15) · 방 황후의 죽음(1547.12.31) · 경술의 변(1550.10.7) · 물러간 몽골(10.14) · 대동 마시(1551.5.20)
          · 가정제의 죽음(1567.1.23 — 해서의 상소) · 융경화의(1571.4.21) · 귀화성(1572.6.1)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/jj_*.webp
   ■ 저장: s.jiajing = { call, amber, night, maid, warn, altan, raid, letter, khan, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var JJ = G.Jiajing = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.jiajing) || {}; }
  var BEIJING = 188, ZHANGJIAKOU = 309, HOHHOT = 296, PORTS = [174, 175, 176, 177, 287, 288];
  var D = JJ.D = { callFrom: 15400101, callTo: 15421031, amberTo: 15421231, nightFrom: 15421101, night: 15421207, borderFrom: 15500901, borderTo: 15501006, raidFrom: 15500920, raid: 15501007, raidTo: 15501014, khanFrom: 15720601, khanTo: 15820112 };
  var NEWS_AT = { renyin: 15421207, purge: 15421212, xiyuan: 15430115, fire: 15471231, gengxu: 15501007, withdraw: 15501014, mashi: 15510520, death: 15670123, peace: 15710421, guihua: 15720601 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.jiajing) {
      s.jiajing = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.jiajing.told[k] = 1; });
    }
    if (!s.jiajing.told) s.jiajing.told = {};
    return s.jiajing;
  }
  JJ.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function at(id) { return cityNow() === id; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var VILLAGER = { name: '성 밖 마을 사람', lang: 3 }, SCOUT = { name: '장가구의 파수꾼', lang: 3 }, GUARD = { name: '금의위 순찰', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w === 'P' ? me() : w === 'F' ? first() : w ? H(w) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }
  function fame(kind, key) { var n = (K().fame || {})[key] || 0; return n ? G.Fame.add(kind, n) : 0; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }
  function has(id) { return !!(R.hasItem && R.hasItem(id)); }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  function lang(li) { return R.lang ? R.lang(li) || 0 : 0; }
  function cargo(id) { var c = S().fleet.cargo[id]; return c ? c.q : 0; }
  function takeCargo(id, n) { var f = S().fleet, c = f.cargo[id]; if (!c) return; c.q -= n; if (c.q <= 0) delete f.cargo[id]; }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'bandit', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  async function passTo(day) {
    var n = U.dayIndex({ y: Math.floor(day / 10000), m: Math.floor(day / 100) % 100, d: day % 100 }) - U.dayIndex(S().date);
    if (!(n > 0)) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  function amberGold() { var k = K(), p = (G.GOOD && G.GOOD.ambergris && G.GOOD.ambergris.p) || 190; return Math.round((k.amber || 10) * p * (k.amberK || 3)); }
  JJ.amberGold = amberGold;
  /** 알탄 칸과의 교섭 확률: 웅변·몽골어(9)·중국어(7) */
  function talkP() { var k = K(); return Math.min(0.9, (k.talkBase || 0.25) + skill('speech') * 0.12 + lang(9) * 0.12 + lang(7) * 0.05); }
  JJ.talkP = talkP;

  // ================================================================ 소식
  JJ.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met1 = b.call === 'yes', met2 = !!(b.raid || b.altan || b.warn), met = met1 || met2,
      east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('renyin', east, 'skull', '【임인궁변】 자금성에서 궁녀 양금영 등 십여 명이 잠든 황제의 목을 비단 끈으로 졸랐다. 끈의 매듭이 엉켜 조여지지 않았고, 겁에 질린 궁녀 하나가 방 황후에게 달려가 알렸다. 황제는 숨이 끊어지기 직전에 살아났다.');
    news('purge', met1, 'skull', '【처형】 일에 얽힌 궁녀들이 모두 처형되었다. 그날 밤 황제가 머물던 처소의 주인 단비 조씨와 왕녕빈도 함께였다. 단비가 결백하다는 말이 있었으나 정신을 잃은 황제 대신 황후가 모든 것을 정했다.' + (b.maid === 'saved' ? ' 서원에서 이슬을 받던 궁녀 하나는 끝내 찾지 못했다고 한다.' : b.maid === 'lost' ? ' 서원의 우물에서 이슬을 받던 어린 궁녀들도 여럿 끌려갔다.' : ''));
    news('xiyuan', met1 || east, 'pray', '【서원】 황제가 다시는 건청궁에서 자지 않겠다며 서원으로 거처를 옮겼다. 조회는 거의 열리지 않고, 도사 도중문이 높은 벼슬을 받았다. 황제는 이제 날마다 하늘에 올리는 글(청사)을 짓고 단약을 먹는다고 한다.');
    news('fire', met1, 'skull', '【방 황후】 자금성의 불길 속에서 방 황후가 세상을 떠났다. 황제가 「구하지 말라」고 했다는 소문이 궁 밖까지 흘러나왔다 — 그날 밤 단비를 죽인 일을 끝내 용서하지 않았다고.');
    news('gengxu', east, 'skull', '【경술의 변】 몽골 투메드의 알탄 칸이 고북구를 넘어 북경 성 밖까지 밀려왔다. 성 밖 마을이 불타는 동안 대장군 구란은 싸우지 않았고, 대학사 엄숭은 「성 밖은 털어 가게 두면 저절로 물러간다」고 했다고 한다.' + (b.raid === 'defend' ? ' 덕승문 밖의 마을 하나만은 바다에서 온 이방인들이 지켜 냈다고 한다.' : ''));
    news('withdraw', met2, 'flag', '【물러간 몽골】 여드레 동안 성 밖을 털던 알탄 칸의 군대가 사람과 가축을 끌고 고북구로 물러갔다. 칸은 「말을 팔 시장을 열어 달라」는 글을 남겼다고 한다.' + (b.altan === 'talk' ? ' 그 글을 처음 들고 온 사람은 바다의 상인이었다는 말이 있다.' : ''));
    news('mashi', met2, 'handshake', '【대동 마시】 대동과 선부에 몽골과 말을 사고파는 시장이 열렸다. 그러나 조정에서는 「오랑캐와 장사하는 것은 치욕」이라는 말이 높아, 시장은 한 해 남짓 만에 다시 닫혔다.' + (b.letter === 'given' ? ' 시장을 열자는 첫 글을 엄숭에게 전한 사람이 바다의 상인이었다는 것은 아무도 적지 않았다.' : ''));
    news('death', met, 'skull', '【가정제의 죽음】 마흔다섯 해 동안 다스린 가정제가 세상을 떠났다. 단약을 너무 많이 먹었다는 말이 돈다. 지난해 호부 주사 해서가 미리 관을 사 두고 「천하 사람들이 폐하를 그르다 한 지 오래입니다」라는 상소를 올렸다가 옥에 갇혔는데, 새 황제가 그를 풀어 주었다.');
    news('peace', east, 'handshake', '【융경화의】 명나라가 알탄 칸을 「순의왕」으로 봉하고 변경에 장을 열었다. 이십 년 넘게 이어진 북쪽의 싸움이 멎었다. 알탄의 아내 종금 하툰(삼낭자)이 화의를 이끌었다고 한다.');
    news('guihua', met2, 'castle', '【귀화성】 알탄 칸이 음산 남쪽에 성을 쌓기 시작했다. 몽골 말로 「후허호토(푸른 성)」 — 초원의 말과 중국의 차가 오가는 시장의 도시가 될 것이라 한다.');
    return out;
  };

  // ================================================================ ① 용연향을 찾는 내관 (1540~1542.10)
  function callOpen() { var b = st(), t = today(); return !!(b && !b.call && PORTS.indexOf(cityNow()) >= 0 && t >= D.callFrom && t <= D.callTo); }
  async function call() {
    var b = st(), k = K(), c = G.CITY_DATA[cityNow()];
    await withPic('jj_eunuch', '사례감의 내관 (' + c.name + ')', function () { return play([
      [null, c.name + ' 부두. 붉은 옷의 내관이 가마에서 내려, 바다에서 온 상인들의 짐을 하나하나 들여다본다. 뒤따르는 하인이 주판을 튕긴다.'],
      ['jj_eunuch', '사례감의 고 태감이오. 황상께서 장생의 도를 닦으시는데, 서원의 도사 도중문 진인께서 단약에 쓸 용연향을 찾으시오. 고래 뱃속에서 나온다는 그 향 말이오. 명의 바다에는 없소.'],
      ['jj_eunuch', '(목소리를 낮추며) 바다의 상인이라면 남쪽 먼 바다에서 구할 수 있을 테지. 용연향 ' + (k.amber || 10) + '통을 북경 사례감으로 가져오시오. 값은 시세의 ' + (k.amberK || 3) + '배를 쳐 주겠소. 그리고 — 이 패를 드리지. 북경 성문이 그대에게 열릴 것이오.']
    ]); });
    var v = await UI.ask('고 태감이 상아 패를 내민다 — 용연향 ' + (k.amber || 10) + '통을 북경으로', [
      { label: '약조한다 — 통행패를 받는다', value: 'yes', icon: 'seal' },
      { label: '「황제의 단약에 쓸 물건은 싣지 않소」', value: 'no' }], me());
    b.call = v;
    if (v === 'yes') {
      give('jj_pass');
      if (G.Sneak && G.Sneak.givePass) G.Sneak.givePass(G.CITY_DATA[BEIJING]);
      UI.toast('사례감의 통행패 — 북경 성문이 열린다 · 용연향 ' + (k.amber || 10) + '통을 북경으로 (1542년 말까지)', 'seal', 6500);
      log(c.name + '에서 사례감의 고 태감을 만났다. 서원의 단약에 쓸 용연향을 북경으로 가져오기로 하고 통행패를 받았다.');
    } else {
      await play([['jj_eunuch', '(차갑게 웃으며) 황상의 일에 「싣지 않는다」는 말은 처음 듣는구려. …바다의 사람이니 이번만은 못 들은 것으로 하겠소.']]);
    }
    refresh();
  }

  // ================================================================ ② 용연향을 바친다 (북경 ~1542)
  function amberOpen() { var b = st(); return !!(b && b.call === 'yes' && !b.amber && at(BEIJING) && today() <= D.amberTo && cargo('ambergris') >= (K().amber || 10)); }
  async function amber() {
    var b = st(), s = S(), k = K(), g = amberGold();
    takeCargo('ambergris', k.amber || 10); s.player.gold += g; b.amber = 1;
    await withPic('jj_xiyuan', '서원의 단 (1542)', function () { return play([
      [null, '자금성 서쪽, 서원. 호숫가에 도관이 늘어서고 향 연기가 하루 종일 꺼지지 않는다. 도사들이 붉은 글씨의 청사를 태운다.'],
      ['jj_tao', '(용연향 덩이를 쪼개 냄새를 맡더니 눈을 가늘게 뜬다) 바다 깊은 곳 용의 침이 굳은 것이라… 이것이면 황상의 단약이 백 날은 더 맑아지겠소. 장생의 도에는 바다 끝의 것이 필요하오.'],
      ['jj_eunuch', '(금화 상자를 내밀며) 약조대로요, 바다의 상인. 황상께서는 값을 묻지 않으시오. 물으시는 것은 오직 「얼마나 더 살 수 있느냐」뿐이지.']
    ]); });
    log('북경 서원에 용연향 ' + (k.amber || 10) + '통을 바쳤다. 금화 ' + U.num(g) + '닢을 받았다.');
    UI.toast('용연향의 값 금화 +' + U.num(g), 'coin', 5000);
  }

  // ================================================================ ③ 임인년의 밤 (1542.11.1~12.7)
  function nightOpen() { var b = st(), t = today(); return !!(b && b.call === 'yes' && !b.night && at(BEIJING) && t >= D.nightFrom && t <= D.night); }
  async function night() {
    var b = st(), s = S(), k = K();
    b.night = 1;
    await withPic('jj_dew', '서원의 새벽 이슬', function () { return play([
      [null, '고 태감의 집에 묵는 동안, 제독은 새벽마다 서원 담 너머의 우물가를 지나간다. 서리가 내린 마당에서 어린 궁녀들이 은사발을 들고 풀잎의 이슬을 받는다.'],
      ['jj_maid', '(언 손을 비비며) …쉿. 말 걸면 안 돼요. 이슬을 한 방울이라도 흘리면 매를 맞아요. 지난겨울에 언니 둘이 맞다가 죽었어요. 진인께서 황상의 단약에 새벽 이슬이 있어야 한대요.'],
      ['jj_maid', '저는 소란이에요. 열다섯이요. …바다 냄새가 나네요, 아저씨. 바다는 넓어요? 이 담보다 넓어요?']
    ]); });
    await passTo(D.night);
    await withPic('jj_night', '임인년의 밤 (1542)', function () { return play([
      [null, '한밤. 자금성 쪽에서 북소리와 고함이 울린다. 횃불이 궁 담을 따라 뛰어간다. 고 태감이 신발도 신지 않고 방으로 뛰어든다.'],
      ['jj_eunuch', '(새파랗게 질려) 큰일이오, 큰일! 궁녀들이… 잠드신 황상의 목을 비단 끈으로 졸랐다 하오! 열 명이 넘게! 그런데 매듭이 엉켜 끈이 조여지지 않았고, 그중 하나가 겁에 질려 황후 마마께 알렸다는구려. 황상은 살아 계시오, 숨이 겨우 붙어서.'],
      ['jj_eunuch', '황후 마마께서 일에 얽힌 궁녀들을 모조리 잡으라 하셨소. 서원에서 이슬 받던 아이들까지 하나하나 끌고 가 묻고 있소. 그 처소의 주인 단비 마마까지…'],
      [null, '그때 뒷문을 두드리는 소리가 난다. 아주 작게, 세 번.'],
      ['jj_maid', '(흙투성이 맨발로) 아저씨… 저는 아무것도 몰라요. 정말이에요. 양 언니가 그 끈을 꼬는 걸 봤을 뿐이에요. 그런데 제 이름이 이슬 받는 아이들 명부에 있어요. 잡히면… (말을 잇지 못한다)']
    ]); });
    var bribe = k.bribe || 1500;
    var v = await UI.ask('궁녀 소란이 뒷문 앞에 서 있다', [
      { label: '고 태감에게 금화를 건네 빈 용연향 궤짝에 숨겨 성을 나간다 (' + U.num(bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < bribe },
      { label: '서직문의 금의위 순찰을 뚫는다', value: 'fight', icon: 'sword' },
      { label: '「궁의 일에 끼지 않겠소」', value: 'no' }], me());
    var ok = false;
    if (v === 'bribe' && s.player.gold >= bribe) {
      s.player.gold -= bribe; ok = true;
      await play([['jj_eunuch', '(금화를 소매에 넣으며 한숨) …나는 오늘 밤 아무것도 못 보았소. 사례감의 수레는 성문에서 열어 보지 않소. 빈 궤짝 하나쯤 더 실려도 아무도 모를 것이오.']]);
    } else if (v === 'fight') {
      var r = await fight('서직문의 금의위 순찰', (k.foe || {}).guard || 14, { leader: '금의위 백호' });
      ok = r === 'win';
    }
    if (ok) {
      b.maid = 'saved';
      await play([
        [null, '새벽, 사례감 수레가 서직문을 지난다. 문지기가 궤짝을 두드려 보고 손을 흔든다. 성 밖 운하에서 소란이 궤짝 뚜껑을 밀고 나와 처음으로 하늘을 본다.'],
        ['jj_maid', '(품에서 은사발을 꺼내 제독 손에 쥐여 주며) 이건 두고 갈게요. 다시는 이걸 들고 새벽에 서 있지 않을 거예요. …소주에 이모가 있어요. 바다는 나중에 볼게요, 아저씨.']
      ]);
      give('jj_bowl');
      var nf = fame('so', 'night');
      log('1542년 임인궁변의 밤 — 서원에서 이슬을 받던 어린 궁녀 소란을 ' + (v === 'bribe' ? '사례감의 빈 궤짝에 숨겨' : '금의위 순찰을 뚫고') + ' 북경 성 밖으로 빼냈다. (사교 명성 +' + nf + ')');
    } else {
      b.maid = v === 'no' ? 'left' : 'lost';
      await play([[null, v === 'no' ? '소란은 고개를 숙이고 어둠 속으로 사라졌다. 새벽에 서원 쪽에서 아이들의 울음소리가 들렸다.' : '금의위의 창에 밀려나는 사이, 순찰대가 소란의 팔을 붙잡았다. 소녀는 끌려가면서 한 번 뒤돌아보았다.']]);
      log('1542년 임인궁변의 밤 — 북경에 있었다. ' + (v === 'no' ? '궁의 일에 끼지 않았다.' : '궁녀 소란을 빼내지 못했다.'));
    }
    await play([['jj_eunuch', '(며칠 뒤, 지친 얼굴로) 황상께서 깨어나셨소. 다시는 건청궁에서 주무시지 않겠다 하시오. 서원으로 거처를 옮기신다는구려 — 이제 하늘과 단약밖에 믿지 않으실 것이오.']]);
    refresh();
  }

  // ================================================================ ④ 경술의 변 ㉮ 장가구 (1550.9.1~10.6)
  function borderOpen() { var b = st(), t = today(); return !!(b && !b.warn && !b.altan && !b.raid && at(ZHANGJIAKOU) && t >= D.borderFrom && t <= D.borderTo); }
  async function border() {
    var b = st(), s = S(), k = K(), p = talkP();
    await withPic('jj_border', '장가구 (1550)', function () { return play([
      [null, '장가구. 장성 북쪽 길목의 성곽 마을. 차를 실은 낙타 행렬이 멈춰 섰다. 북쪽 초원에서 연기가 오른다.'],
      [SCOUT, '(망루에서 내려오며) 투메드의 알탄 칸이오! 기병이 수만이라오. 대동을 비켜서 동쪽으로 — 고북구로 가는 길이오. 거기서 장성을 넘으면 북경까지 사흘이오!'],
      [SCOUT, '조정에서는 몇 해째 칸의 말을 듣지 않았소. 칸은 그저 말을 팔고 비단과 차를 살 시장을 열어 달라 했을 뿐인데, 사신의 목을 베어 보냈지. 이제 칼로 시장을 열겠다는 것이오.']
    ]); });
    var v = await UI.ask('알탄 칸의 기병이 장성으로 간다', [
      { label: '북경으로 말을 달려 알린다', value: 'warn', icon: 'horse' },
      { label: '알탄 칸의 진영으로 간다 — 「시장 이야기를 들어 보겠소」 (' + Math.round(p * 100) + '%)', value: 'talk', icon: 'handshake' }], me());
    if (v === 'warn') {
      b.warn = 1;
      await play([[null, '선원 가운데 말을 잘 타는 사내 둘이 역참 말을 얻어 남쪽으로 달려간다. 북경 성문까지 이틀 길이다.'], ['F', '제독, 성문을 하루라도 일찍 닫으면 성 안의 창고는 지킬 수 있을 겁니다. …성 밖 사람들은 모르겠습니다만.']]);
      log('1550년 장가구 — 알탄 칸의 기병이 장성으로 향한다는 소식을 북경으로 보냈다.');
      return;
    }
    await withPic('jj_altan', '알탄 칸의 천막 (1550)', function () { return play([
      [null, '초원 위의 흰 천막 수백. 여우털 모자를 쓴 칸이 활을 무릎에 걸치고 이방인을 내려다본다.'],
      ['jj_altan', '바다의 상인이 내 천막에? 하하. 명나라 사람은 나를 도적이라 부른다. 그런데 나는 장사를 하고 싶을 뿐이다. 말은 많고, 차와 비단과 솥은 없다. 시장을 열어 주면 칼을 거둔다. 그 말을 몇 번이나 보냈는데 사신의 목만 돌아왔지.']
    ]); });
    if (U.chance(p)) {
      b.altan = 'talk';
      await play([
        ['P', '칸이여, 바다에서도 장사는 칼보다 오래 가오. 이 글을 내가 북경으로 가져가겠소. 목을 베일 사신이 아니라, 물건을 파는 상인의 손으로.'],
        ['jj_altan', '(오래 제독을 보다가 웃는다) 상인의 손이라. 좋다. (몽골 글씨로 쓴 편지를 건넨다) 그래도 나는 고북구를 넘을 것이다. 저들이 이 글을 읽게 하려면 먼저 북경의 문을 두드려야 하니까. …성 밖 사람들은 미안하게 되었구나.']
      ]);
      give('jj_letter');
      var ef = fame('so', 'envoy');
      log('1550년 — 알탄 칸의 천막에서 시장 이야기를 나누고 황제에게 보내는 편지를 받았다. (사교 명성 +' + ef + ')');
      UI.toast('알탄 칸의 편지 — 북경의 대신에게 (팔 수 없다)', 'scroll', 5600);
    } else {
      b.altan = 'fail';
      var ransom = Math.min(s.player.gold, k.ransom || 2000); s.player.gold -= ransom;
      await play([['jj_altan', '(코웃음) 혀가 짧구나, 바다의 상인. 말이 안 통하는 사람과는 장사도 안 된다. 몸값이나 두고 가라.'], [null, '금화 ' + U.num(ransom) + '닢을 내놓고서야 천막을 나올 수 있었다.']]);
      log('1550년 — 알탄 칸의 천막에서 교섭에 실패하고 몸값 금화 ' + U.num(ransom) + '닢을 치렀다.');
    }
    refresh();
  }

  // ================================================================ ④ 경술의 변 ㉯ 북경 (1550.9.20~10.14)
  function raidOpen() { var b = st(), t = today(); return !!(b && !b.raid && at(BEIJING) && t >= D.raidFrom && t <= D.raidTo); }
  async function raid() {
    var b = st(), s = S(), k = K();
    await passTo(D.raid);
    await withPic('jj_raid', '경술년의 가을 (1550)', function () { return play([
      [null, '북경 성벽 위. 북쪽 들판에 연기가 기둥처럼 솟는다. 몽골 기병이 덕승문 밖 마을을 휩쓸고, 사람들이 성문으로 몰려와 문을 두드린다. 문은 열리지 않는다.'],
      b.warn ? [null, '장가구에서 제독이 보낸 소식 덕에 성문은 하루 일찍 닫혔고, 성 안의 창고는 지켰다. 그러나 성 밖은 아무도 지키지 않았다.'] : null,
      ['jj_qiu', '(말 위에서 성벽 아래를 내려다보며) 저 기병들과 들에서 맞붙는 것은 미친 짓이오. 성을 지키는 것이 먼저요. 칸이 지치면 돌아갈 것이오.'],
      ['jj_yan', '(부드럽게 웃으며) 대장군 말씀이 옳소. 성 밖은 털어 가게 두시오. 배가 부르면 저절로 물러가오. 변경에서 지면 감출 수 있지만, 황성 아래에서 지면 감출 수가 없지 않소.'],
      [VILLAGER, '(성벽 아래에서 외친다) 문을 여시오! 아이들이 있소! 황제는 서원에서 하늘에 글만 올리고 있단 말이오?']
    ]); });
    var v = await UI.ask('덕승문 밖 마을이 불탄다', [
      { label: '선원들을 이끌고 성 밖 마을을 지킨다', value: 'defend', icon: 'sword' },
      { label: '성문 안에 머문다', value: 'stay' }], me());
    b.raid = v;
    if (v === 'defend') {
      var r = await fight('성 밖을 터는 투메드 기병', (k.foe || {}).raid || 40, { leader: '알탄 칸의 천호장', kind: 'bandit' });
      await play([[null, r === 'win' ? '마을 어귀에서 기병들이 말머리를 돌렸다. 불타던 초가 몇 채를 빼고, 마을 사람들은 살아남았다.' : '기병에게 밀려났지만, 그 사이 마을 사람들은 언덕 뒤 절로 몸을 피했다.'],
        [VILLAGER, '(무릎을 꿇으며) 성 안의 장군들은 문도 안 열어 주었는데, 바다에서 온 사람들이…']]);
      var rf = fame('bt', 'raid');
      log('1550년 경술의 변 — 북경 덕승문 밖 마을을 지켰다. (전투 명성 +' + rf + ')');
    } else {
      await play([[null, '성벽 위에서 여드레 동안 연기를 보았다. 열흘째 아침, 몽골 기병은 사람과 가축을 끌고 북쪽으로 사라졌다.']]);
      log('1550년 경술의 변 — 북경 성 안에서 여드레를 보냈다.');
    }
    if (has('jj_letter')) {
      R.removeItem('jj_letter'); b.letter = 'given';
      await play([
        ['jj_yan', '(몽골 글씨의 편지를 펼쳐 보고 눈썹을 올린다) 시장을 열어 달라… 칸의 편지를 상인이 들고 왔단 말이오? (편지를 소매에 넣으며) 황상께는 내가 알아서 아뢰겠소. 이 일은 그대가 한 것이 아니오. 알겠소?'],
        [null, '이듬해 봄, 대동에 말 시장이 열렸다. 칙서 어디에도 바다의 상인 이름은 없었다.']
      ]);
      s.player.gold += 3000;
      var kf = fame('ex', 'khan');
      log('알탄 칸의 편지를 대학사 엄숭에게 전했다. 엄숭은 그 공을 제 것으로 했지만 금화 3,000닢을 내렸다. (탐험 명성 +' + kf + ')');
    }
    refresh();
  }

  // ================================================================ ⑤ 귀화성의 칸 (1572.6~1582.1)
  function khanOpen() { var b = st(), t = today(); return !!(b && b.altan === 'talk' && !b.khan && at(HOHHOT) && t >= D.khanFrom && t <= D.khanTo); }
  async function khan() {
    var b = st(); b.khan = 1;
    await withPic('jj_guihua', '귀화성의 칸 (1572)', function () { return play([
      [null, '음산 남쪽, 새로 쌓은 성. 초원의 말과 중국의 차 수레가 성문 앞에서 줄을 선다. 성 안에는 라마 사원의 금빛 지붕이 올라간다.'],
      ['jj_altan', '(머리가 하얗게 센 칸이 지팡이를 짚고 일어서며) 경술년의 바다 상인이로구나! 이십 년이 걸렸다. 그때 네가 들고 간 편지가 오늘 이 시장이 되었다.'],
      ['jj_sanniang', '(장부를 덮고 웃으며) 칸께서 그 이야기를 몇 번이나 하셨는지 몰라요. 「목을 베일 사신 대신 물건 파는 상인의 손」이라고요. 이제 명나라는 칸을 「순의왕」이라 불러요. 싸우는 것보다 장사가 훨씬 남는다는 걸 그쪽도 알게 됐죠.'],
      ['jj_altan', '(은 장식 활집을 내밀며) 받아라. 이 활로는 이제 사람을 쏠 일이 없다. 시장을 지키는 것은 칼이 아니라 약속이니까.']
    ]); });
    give('jj_bow');
    var f = fame('so', 'khan');
    log('귀화성(후허호토)에서 늙은 알탄 칸과 종금 하툰을 만났다. 칸이 「알탄 칸의 활」을 건넸다. (사교 명성 +' + f + ')');
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[amberOpen, amber], [nightOpen, night], [callOpen, call], [raidOpen, raid], [borderOpen, border], [khanOpen, khan]];
  JJ.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  JJ.check = async function () {
    if (JJ._busy) return false; JJ._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    JJ._busy = false; refresh();
    return true;
  };
  JJ._t = { call: call, amber: amber, night: night, border: border, raid: raid, khan: khan };
})(window.G = window.G || {});
