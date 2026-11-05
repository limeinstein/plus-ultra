/* 영원성의 여포수 · 수방의 장부 (G.NingChong) 2026-11-05 사용자 요청
   「1620~1627 천계제 시기 환관 정치 · 1626 영원성 전투(원숭환) · 1627 숭정제 즉위와 위충현 세력 숙청 — 등장하는 미인들이 동료가 될 수 있는 스토리」
   사람·소지품·조정값: js/data/ningchong.js (G.HIST_FIG nc_* · nc_ledger · nc_shard · nc_iou · G.BALANCE.ningchong)
   천계제 시기의 동림당 탄압·소주 민변은 다른 사건(donglin)이 맡는다. 영원성의 홍이포 퀘스트와 큰 싸움은 js/systems/houjin.js ② 가 맡고,
   이 사건은 그 뒤의 이야기를 잇는다 — 두 사건이 같은 제독에게 영원성 큰 싸움을 두 번 벌이지 않는다 (아래 wallOpen).
   날짜는 게임의 양력이다 (천계제 붕어 1627.9.30 · 숭정제 즉위 10.2 · 위충현 자결 12.11).
   ■ ⓪ 성벽의 포수 (1626.2.1~2.21, 요동 — houjin ② 의 군관에게 「끼지 않겠다」고 했거나 houjin 사건이 없을 때만): 팔기가 몰려오는 영원성,
        일손이 모자란 홍이포의 포수가 제독의 포수들을 부른다 → 성벽 밑의 작은 싸움 (houjin 의 큰 싸움이 아니다) / 떠난다
   ■ ① 영원성의 여포수 (1626.2.22~1627.6.30, 요동): 진수 태감 기용이 영원성의 공을 위충현에게 돌리고, 대포를 쏜 「오랑캐 계집」의 입을 막으려 한다
        — houjin ② 를 했으면 「그대가 가져온 대포 곁의 포수」, ⓪ 을 했으면 「함께 성벽을 지킨 포수」, 아니면 쫓기는 낯선 여인으로 만난다
        → 배에 숨긴다(부두의 육상전) / 태감에게 은자 / 원숭환에게 호소(영원성을 함께 지켰을 때만) / 못 본 척(동창에 끌려간다)
        → 이네스가 동료로 (지면 끌려간다 — ③ 에서 구한다)
   ■ ② 수방의 장부 (1627.6.1~11.30, 요동): 영원성의 생사에 입힐 망포를 들고 온 수방 궁녀 옥란이 동창에 쫓긴다. 안감에 위충현 일당의 장부
        → 숨겨 준다(육상전 — 이기면 옥란이 동료로) / 당두에게 은자 / 외면 — 지든 외면하든 옥란은 장부와 수방의 출입패를 제독에게 던지고 끌려간다
        → 수방의 출입패 = 북경 성문 통행 허가 (G.Sneak.givePass)
   ■ ③ 자경궁의 밤 (1627.10.2~12.10, 북경 — 장부가 있으면): 동창의 당두가 장부를 사겠다 한다 → 판다(금화·악명 — 옥란이 떠난다) /
        거절하고 천계제의 황후 장씨에게 → 새 황제 숭정제에게 장부가 간다 (하사금·명성). 기한이 지나면 장부는 쓸 데가 없어진다
   ■ ④ 옥문이 열리다 (1627.12.11~1628.6.30, 요동·북경·오문 — 끌려간 이가 있으면): 위충현이 죽고 동창의 옥이 열렸다 → 이네스·옥란이 동료로
        (장부를 팔았으면 옥란은 따르지 않는다)
   ■ ⑤ 빈 곳간 (1628.6.1~1629.3.31, 요동): 원숭환이 독사로 돌아왔으나 넉 달째 녹봉이 밀렸다 → 쌀·밀 60통(시세 0.7배) / 금화를 빌려준다(차용증) /
        싣고 오겠다 / 사양 — 영원의 병변(1628.8) 소식이 달라진다
   ■ 소식: 대포에 내린 장군 칭호(1626.4) · 징성의 왕이(1627.4) · 영금 싸움(1627.7) · 원숭환 사직(1627.8) · 천계제 붕어(9.30) · 숭정제 즉위(10.2)
           · 위충현 자결(12.11) · 객씨(12.20) · 영원의 병변(1628.8.25) · 흠정역안(1629.4.15) · 역참 감축과 이자성(1629.6.1)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/nc_*.webp
   ■ 저장: s.ningChong = { wall: 'won'|'lost'|'no', ines: 'joined'|'taken'|'free', inesHow, okran: 'joined'|'taken'|'gone', palace: 'empress'|'sold'|'late',
           freed, grain: 'quest'|'done'|'loan'|'no'|'late', told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var NC = G.NingChong = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.ningchong) || {}; }
  var LIAODONG = 189, PEKING = 188, MACAO = 173;
  var D = NC.D = { wallFrom: 16260201, wallTo: 16260221, inesFrom: 16260222, inesTo: 16270630, okFrom: 16270601, okTo: 16271130,
    palFrom: 16271002, palTo: 16271210, freeFrom: 16271211, freeTo: 16280630, grainFrom: 16280601, grainTo: 16290331 };
  var NEWS_AT = { general: 16260420, wanger: 16270420, ningjin: 16270705, quit: 16270820, tianqi: 16270930, chongzhen: 16271002,
    wei: 16271211, ke: 16271220, mutiny: 16280825, nian: 16290415, yizhan: 16290601 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.ningChong) {
      s.ningChong = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.ningChong.told[k] = 1; });   // 옛 저장
    }
    if (!s.ningChong.told) s.ningChong.told = {};
    return s.ningChong;
  }
  NC.state = st;
  // 두 사람은 이 사건으로만 만난다. 배에 오른 뒤에 떠나보내면 그 뒤로는 술집에도 나온다 (js/systems/frontier.js — eventOnly)
  (function setup() {
    [['nc_ines', 'inesMet'], ['nc_okran', 'okranMet']].forEach(function (x) {
      var m = G.MATE && G.MATE[x[0]]; if (!m) return;
      try { Object.defineProperty(m, 'eventOnly', { configurable: true, enumerable: true, get: function () { var s = S(), b = s && s.ningChong; return !(b && b[x[1]]); } }); }
      catch (e) { m.eventOnly = true; }
    });
  })();
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function hj() { var s = S(); return (s && s.houjin) || {}; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var BANNER = { name: '팔기의 기병', lang: 3 }, FANYI = { name: '동창의 번역(番役)', lang: 3 }, SOLDIER = { name: '영원의 병사', lang: 3 }, MAID = { name: '자경궁의 궁녀', lang: 3 };
  var STRANGER = { name: '남장한 포수', lang: 3 }, EMBROIDERER = { name: '수방의 궁녀', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w === 'P' ? me() : w === 'F' ? first() : w === 'I' ? mateSp('nc_ines', l[2]) : w === 'O' ? mateSp('nc_okran', l[2]) : w ? H(w) : {};
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
  function drop(id) { if (R.removeItem) R.removeItem(id); else { var p = S().player; p.items = (p.items || []).filter(function (x) { return x.id !== id; }); } }
  function notoriety(n, why) { var p = S().player; p.notoriety = (p.notoriety || 0) + n; UI.toast(why + ' (악명 +' + n + ')', 'skull', 4200); }
  function join(id, city, loyal) {
    var b = st(); b[id === 'nc_ines' ? 'inesMet' : 'okranMet'] = 1;
    if (row(id) || !G.Legend || !G.Legend.join) return row(id);
    var m = G.Legend.join(id, G.CITY_DATA[city || cityNow() || LIAODONG]); if (m && loyal) m.loyal = loyal; return m;
  }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  function food() { var c = S().fleet.cargo; return ((c.rice || {}).q || 0) + ((c.wheat || {}).q || 0); }
  /** 쌀부터, 모자라면 밀에서 덜어 낸다 — 시세의 k배를 받는다 */
  function takeFood(q, k) {
    var s = S(), f = s.fleet, gold = 0;
    ['rice', 'wheat'].forEach(function (id) {
      var cg = f.cargo[id]; if (!cg || q <= 0) return; var n = Math.min(q, cg.q);
      if (R.takeCargoLots) R.takeCargoLots(cg, null, n, 0);
      cg.q -= n; q -= n; if (cg.q <= 0) delete f.cargo[id];
      gold += Math.round(((G.GOOD[id] || {}).p || 9) * n * k);
    });
    s.player.gold += gold; return gold;
  }
  function passOk() { var c = G.CITY_DATA[PEKING]; return !!(G.Sneak && G.Sneak.hasPass && c && G.Sneak.hasPass(c)); }
  function givePass() { var s = S(), c = G.CITY_DATA[PEKING]; if (!c) return; if (G.Sneak && G.Sneak.givePass) { if (!passOk()) G.Sneak.givePass(c); } else s.flags['pass' + c.id] = U.dateNum(s.date); }
  function heldYuan() { var h = hj(); return h.ning === 'won' || h.ning === 'lost'; }

  // ================================================================ 소식
  NC.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!(b.wall || b.ines || b.okran), east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 100);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    var inesSaved = b.ines === 'joined';
    news('general', east, 'cannon', '【대포에 내린 장군 칭호】 북경의 조정이 영원성에서 누르하치를 맞힌 홍이포에 「안국전군평요정로대장군(安國全軍平遼靖虜大將軍)」이라는 칭호를 내렸다고 한다. 공은 「구천세」 위충현의 지휘 덕으로 돌아갔다. ' + (inesSaved || b.ines === 'taken'
      ? '그 포의 화승을 쥐었던 이가 오문에서 온 여인이었다는 말은 어느 상소에도 없다.' : '대포를 쏜 포수의 이름은 어디에도 적히지 않았다.'));
    news('wanger', east, 'skull', '【징성의 왕이】 섬서 징성현에 가뭄이 들었는데도 현령 장두요가 세금을 다그쳤다. 왕이(王二)라는 농민이 굶주린 사람 수백을 이끌고 현청에 들어가 현령을 죽였다. 「누가 감히 현령을 죽이겠느냐」 — 「내가 죽이겠다」.');
    news('ningjin', east, 'castle', '【영금의 싸움】 새 칸 홍타이지가 금주와 영원을 잇달아 쳤으나 원숭환의 명군이 또 막아 냈다. 그러나 조정의 상은 위충현의 집안에 먼저 갔다. 위충현의 갓난 조카 손자가 백작에 봉해졌다고 한다.');
    news('quit', east, 'scroll', '【원숭환 사직】 영금에서 이기고도 「금주를 구하러 나가지 않았다」는 탄핵을 받은 원숭환이 병을 핑계로 벼슬을 내놓고 고향 광동으로 내려갔다. 위충현의 사람들이 요동의 공을 나누어 가졌다.');
    news('tianqi', east, 'skull', '【천계제 붕어】 명의 천계제가 스물셋의 나이로 세상을 떠났다. 대패와 끌을 손에서 놓지 않던 「목수 황제」였다. 지난해 서원의 연못에서 배가 뒤집힌 뒤로 앓아 왔고, 위충현이 올린 「영로음(靈露飮)」이라는 선약을 마셨다고 한다. 아들이 없어 아우 신왕이 뒤를 잇는다.');
    news('chongzhen', east, 'crown', '【숭정제 즉위】 열일곱 살의 신왕 주유검이 황제에 올랐다. 연호는 숭정(崇禎). 즉위하던 밤 새 황제는 궁의 음식을 입에 대지 않고, 소매에 넣어 온 떡만 먹었다고 한다. 위충현은 아직 동창과 사례감을 쥐고 있다.' + (b.okran === 'joined' ? ' 옥란이 소식을 듣고 바늘을 내려놓았다. 「이제예요, 선장님.」' : ''));
    var led = b.palace === 'empress';
    news('wei', east, 'skull', '【위충현 자결】 「구천세」 위충현이 봉양의 황릉을 지키라는 명을 받고 내려가던 길에, 부성(阜城)의 객점에서 목을 맸다. 그날 밤 옆방에서 한 서생이 그의 몰락을 비웃는 노래를 불렀다고 한다. 천하 곳곳에 세운 그의 생사(生祠)가 헐리기 시작했다.' + (led
      ? ' 새 황제의 책상에는 위충현 일당의 이름과 은자가 적힌 얇은 장부가 펼쳐져 있었다고 한다 — 비단 망포의 안감에서 나온 것이라 했다.' : b.palace === 'sold' ? ' 동창의 당두가 품고 다니던 장부 하나가 불 속에 던져졌다는 말이 돈다.' : ''));
    news('ke', east, 'skull', '【객씨】 천계제의 유모 봉성부인 객씨가 완의국에서 매를 맞아 죽었다. 그녀의 집에서 궁녀 여럿이 아이를 밴 채 발견되었다고 한다 — 아들 없는 황제에게 「황자」를 바치려 했다는 것이다.' + (b.okran === 'joined' ? ' 옥란은 그날 하루 바늘을 잡지 않았다.' : ''));
    var fed = b.grain === 'done' || b.grain === 'loan';
    news('mutiny', east, 'skull', '【영원의 병변】 넉 달째 녹봉을 받지 못한 영원의 병사들이 들고일어나 순무 필자숙을 성루에 묶었다. 원숭환이 달려와 주모자를 베고 병변을 가라앉혔으나, 필자숙은 부끄러움을 이기지 못해 목을 맸다. 나라의 곳간이 비었다.' + (fed ? ' 이방인 선장의 쌀이 먼저 닿은 진영만은 조용했다고 한다.' : ''));
    news('nian', east, 'scroll', '【흠정역안】 숭정제가 위충현과 객씨의 무리 이백육십여 명의 이름을 적은 「흠정역안(欽定逆案)」을 천하에 내렸다. 죽은 위충현의 시신은 다시 찢겼다. 그러나 동림과 그 반대편의 다툼은 끝나지 않았다.');
    news('yizhan', east, 'scroll', '【역참을 줄이다】 비어 버린 곳간을 메우려고 숭정제가 천하의 역참을 줄였다. 섬서 미지현 은천역의 역졸 이자성도 일자리를 잃었다고 한다. 굶주린 섬서의 산마다 「도적」이 늘어 간다.');
    return out;
  };

  // ================================================================ ⓪ 성벽의 포수 (1626.2, 요동)
  /** houjin ② 와 겹치지 않는다: 군관에게 대포를 약조했거나(quest) 이미 싸웠으면(won·lost) 열리지 않는다.
      요동에 들어서면 houjin 의 군관이 먼저 말을 걸기 때문에(js/scenes/city.js 순서), 이 장면은 그 청을 거절한(no) 제독에게만 열린다 */
  function wallOpen() {
    var b = st(), t = today(), h = hj();
    if (!b || b.wall || cityNow() !== LIAODONG || t < D.wallFrom || t > D.wallTo) return false;
    if (h.ning === 'quest' || h.ning === 'won' || h.ning === 'lost') return false;
    if (G.Houjin && G.Houjin.pending && !G.Houjin._busy && G.Houjin.pending()) return false;
    return true;
  }
  async function wall() {
    var b = st(), k = K(), h = hj();
    await withPic('nc_wall', '영원성의 성벽 (1626)', function () { return play([
      [null, '영원성. 얼어붙은 바닷가의 작은 성 둘레로 봉화가 잇달아 오른다. 북쪽 눈벌판에 팔기의 깃발이 새까맣게 밀려온다. 성문이 닫히기 직전, 부두로 달려 내려오는 포수 하나 — 두건 아래 얼굴이 앳되다.'],
      [STRANGER, h.ning === 'no' ? '「명과 후금의 싸움에 끼지 않겠다」던 그 선장이죠? 들었어요. 끼라는 게 아니에요 — 포수만 빌려줘요! 우리 포에 붙을 사람이 둘이나 죽었어요.' : '선장님! 배에 포수 있죠? 우리 홍이포에 붙을 사람이 모자라요. 둘이 어제 얼어 죽었어요!'],
      [STRANGER, '(화약에 그을린 손으로 성벽을 가리키며) 저 포는 아버지가 다루던 거예요. 화약 재는 손, 포신 돌리는 손, 불 붙이는 손 — 셋이 있어야 해요. 사흘만요. 사흘이면 저 깃발들이 돌아가요.']
    ]); });
    var v = await UI.ask('포수가 성벽 위의 홍이포에 붙을 손을 빌려 달라 한다', [
      { label: '포수들과 함께 성벽에 오른다 (성벽 밑의 싸움)', value: 'help', icon: 'cannon' },
      { label: '닻을 올리고 떠난다', value: 'no' }], me());
    if (v !== 'help') {
      b.wall = 'no';
      await play([[STRANGER, '…그래요. 그럼 바다에서 기도나 해 줘요. Meu Deus — 하느님이 들으시게요.'], [null, '성문이 닫힌다. 멀리서 대포 소리가 바다를 건너온다.']]);
      log('팔기가 몰려오는 영원성을 뒤로하고 떠났다.'); return;
    }
    await play([
      [null, '정월의 바람. 팔기가 성벽에 사다리를 걸고, 성벽 밑에 굴을 판다. 포수가 두건을 질끈 동이고 포신에 손을 얹는다.'],
      [STRANGER, '화약은 이만큼, 포탄은 천천히! 서두르면 포가 터져요 — 북경에서 우리 아버지가 그렇게 죽었어요. …선장님 사람들은 사다리만 막아 줘요!']
    ]);
    var res = await fight('성벽에 붙은 팔기', (k.foe || {}).wall || 28, { guns: true, leader: '팔기의 니루 어전', hold: 2 });
    b.wall = res === 'win' ? 'won' : 'lost';
    await play([
      [null, res === 'win' ? '사다리가 하나씩 꺾여 떨어진다. 그 사이 포수가 화승을 내리꽂는다 — 홍이포가 눈벌판 한가운데의 노란 일산을 향해 불을 뿜는다.' : '사다리 하나를 끝내 못 막아 선원들이 성벽에서 밀려났다. 그래도 그 짧은 틈에 포수가 화승을 내리꽂는다 — 홍이포가 노란 일산을 향해 불을 뿜는다.'],
      [null, '흙기둥이 솟고, 일산이 기운다. 팔기가 술렁인다. 이틀 뒤 후금의 군사가 포위를 풀었다.'],
      [STRANGER, '(두건을 벗자 검은 머리가 쏟아진다) 봤어요? 맞았어요, 맞았다고요! …아, 이거요? 여자는 성벽에 못 오른대서요. Obrigada, 선장님. 제 이름은 이네스예요.']
    ]);
    b.inesMet = 1;
    var bt = fame('bt', 'wall');
    log('영원성 성벽에서 오문의 포수 이네스와 함께 홍이포를 지켰다. 포탄이 누르하치의 일산 곁에 떨어졌다. (전투 명성 +' + bt + ')');
    UI.toast('영원성 — 포수 이네스와 함께 성벽을 지켰다', 'cannon', 5200);
  }

  // ================================================================ ① 영원성의 여포수 (1626.2.22~1627.6.30, 요동)
  function inesOpen() { var b = st(), t = today(); return !!(b && !b.ines && cityNow() === LIAODONG && t >= D.inesFrom && t <= D.inesTo); }
  async function inesScene() {
    var b = st(), s = S(), k = K(), h = hj();
    var via = heldYuan() ? 'houjin' : (b.wall === 'won' || b.wall === 'lost') ? 'wall' : 'none';
    var known = via !== 'none';
    var open = via === 'houjin'
      ? [[null, '영원성 아래 부두. 포위가 풀린 지 여러 날, 성벽 위의 홍이포에는 붉은 비단이 감겼다. 그 대포 곁에서 제독과 함께 화승을 쥐었던 앳된 포수가, 두건도 없이 창고 뒤로 달려온다. 검은 머리가 어깨에 쏟아진다.'],
        ['I', h.fire === 'center' ? '선장님! 저 기억해요? 노란 일산을 겨눈 그 포 — 불은 선장님이 붙였지만 포신을 돌린 건 저였어요. 이네스예요. 오문에서 온 포수요.' : '선장님! 저 기억해요? 사다리를 겨누던 그 포 옆에 있던 포수요. 이네스예요. 선장님이 가져온 대포를 제가 닦았어요.', 'surprised']]
      : via === 'wall'
      ? [[null, '영원성 아래 부두. 포위가 풀린 지 여러 날, 성벽 위의 홍이포에는 붉은 비단이 감겼다. 함께 성벽을 지킨 그 포수 — 이네스가 창고 뒤로 달려온다. 숨이 차다.'],
        ['I', '선장님! 아직 안 떠나셨구나, 다행이다…!', 'surprised']]
      : [[null, '영원성 아래 부두. 포위가 풀린 지 여러 날. 창고 뒤에서 남장한 여인 하나가 갈색 두건의 사내들에게 쫓겨 달려 나온다. 뺨에 화약 그을음이 남았다.'],
        [STRANGER, '포르투갈 배죠? 그 깃발 — 오문에서 봤어요! 제발, 저를 좀 숨겨 줘요. 저는 이네스예요. 이 성벽에서 홍이포를 쏜 포수예요.']];
    await withPic('nc_ines', '영원성의 여포수 (1626)', function () { return play(open.concat([
      ['nc_jiyong', '(부채를 부치며 사내들 뒤에서 나선다) 진수 태감 기용이다. 구천세의 명으로 요동의 공을 살피러 왔지. 영원성의 승리는 구천세의 위엄이 하늘에 닿은 덕 — 그렇게 북경에 아뢰었다.'],
      ['nc_jiyong', '그런데 저 오랑캐 계집이 「누르하치를 맞힌 건 내 포탄」이라며 떠들고 다닌다지 뭐냐. 계집이, 그것도 서양 계집이 성벽에 올랐다는 말이 북경에 들어가면 구천세의 공이 웃음거리가 된다. 입을 막아야지.'],
      [known ? 'I' : STRANGER, '제 아버지는 오문에서 온 포수였어요. 삼 년 전 북경에서 시험 사격을 하다 포가 터져 죽었죠. 그때도 다들 「서양 포수는 재수가 없다」고 했어요. …이번엔 제가 맞혔어요. 그게 죄예요?'],
      known ? ['nc_yuan', '(성문 쪽에서 굳은 얼굴로 다가오며) 태감, 저 아이는 내 성의 포수요. 성을 지킨 사람을 내 손으로 내줄 수는 없소. …그러나 나는 태감의 붓 한 자루를 이길 힘이 없소.'] : null
    ])); });
    var bribe = k.bribeInes || 2500;
    var v = await UI.ask('동창의 사내들이 이네스를 끌고 가려 한다', [
      { label: '배에 숨긴다 — 부두의 번역들을 막는다 (육상전)', value: 'fight', icon: 'sword' },
      { label: '태감에게 은자를 바친다 (금화 ' + U.num(bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < bribe },
      known ? { label: '원숭환에게 길을 묻는다 — 「대인, 성을 함께 지킨 사람이오」', value: 'yuan', icon: 'castle' } : null,
      { label: '못 본 척한다', value: 'no' }].filter(Boolean), me());
    if (v === 'bribe' && s.player.gold < bribe) v = 'no';
    if (v === 'no') {
      b.ines = 'taken';
      await play([[FANYI, '(이네스의 팔을 비틀며) 가자. 북경 동창의 옥은 넓다.'], [known ? 'I' : STRANGER, '(돌아보지 않고) …괜찮아요. 포탄은 이미 날아갔으니까요.']]);
      log('영원성의 포수 이네스가 동창에 끌려가는 것을 보고만 있었다.'); return;
    }
    var ok = true;
    if (v === 'bribe') {
      s.player.gold -= bribe;
      await play([['nc_jiyong', '(은자 꾸러미를 손바닥에 올려 보며) 흠, 바다 건너의 은이로군. 구천세의 생사에 기와 한 장 더 얹겠다. 계집은 — 오늘 아침 바다에 빠져 죽은 걸로 하지.']]);
    } else if (v === 'yuan') {
      await play([['nc_yuan', '(낮은 목소리로) 오늘 밤 서문의 수문을 열어 두겠소. 내 병사들은 그 시각에 졸 것이오. …바다의 사람, 영원성의 포탄 하나가 이 성을 살렸소. 그 포탄을 쏜 사람을 살려 주시오.']]);
    } else {
      await play([[FANYI, '막는 놈도 함께 끌고 가라!']]);
      ok = (await fight('동창의 번역', (k.foe || {}).dock || 16, { guns: false, leader: '동창의 당두' })) === 'win';
    }
    if (!ok) {
      b.ines = 'taken';
      await play([[null, '징이 울리고 갈색 두건들이 몰려든다. 끌려가던 이네스가 무언가를 제독에게 던진다 — 끈에 꿴 쇳조각이다.'], [known ? 'I' : STRANGER, '그거 갖고 있어요! 다시 받으러 갈 거예요!', 'surprised']]);
      give('nc_shard');
      log('동창의 번역들에게 막혀 이네스를 지키지 못했다. 그녀는 북경 동창의 옥으로 끌려갔다.'); return;
    }
    b.ines = 'joined'; b.inesHow = v;
    await play([
      [null, v === 'yuan' ? '자정, 서문의 수문이 소리 없이 열린다. 횃불 하나 없는 물길로 작은 배가 빠져나간다.' : '그날 밤, 이네스가 포탄 상자 사이에 웅크린 채 제독의 배에 오른다. 등 뒤에서 영원성의 불빛이 멀어진다.'],
      ['I', '(목에 걸린 쇳조각을 만지며) 이거요? 누르하치의 일산 곁에 떨어진 포탄 조각이에요. 눈밭에서 주웠어요. …선장님 배의 포, 제가 봐도 돼요? 아버지가 가르쳐 준 걸 다 써먹고 싶어요.', 'happy'],
      ['I', '아, 그리고 — 이제 두건 안 써도 되죠? 여기선 여자가 포에 올라도 아무도 뭐라 안 하죠?', 'happy']
    ]);
    join('nc_ines', LIAODONG, 85);
    var so = fame('so', 'ines');
    log('영원성의 여포수 이네스를 동창의 손에서 빼내 배에 태웠다. (사교 명성 +' + so + ')');
    UI.toast('이네스 — 오문의 포수가 배에 올랐다', 'heart', 6000);
    refresh();
  }

  // ================================================================ ② 수방의 장부 (1627.6.1~11.30, 요동)
  function okOpen() { var b = st(), t = today(); return !!(b && !b.okran && cityNow() === LIAODONG && t >= D.okFrom && t <= D.okTo); }
  async function okranScene() {
    var b = st(), s = S(), k = K(), after = today() >= 16271002, ines = !!row('nc_ines');
    await withPic('nc_okran', '수방의 장부 (1627)', function () { return play([
      [null, '요동의 부두. 새로 지은 사당 하나에 금박이 번쩍인다 — 「구천세」 위충현의 생사(生祠)다. 살아 있는 사람을 신처럼 모시는 사당이 천하에 마흔 곳이 넘는다. 그 앞에서 비단 보따리를 안은 여인이 갈색 두건의 사내들을 피해 제독의 배 쪽으로 달려온다.'],
      [EMBROIDERER, '(숨을 몰아쉬며, 고개를 숙인 채) 실례를 무릅쓰고 여쭈어요. 바다로 나가는 배인가요? …저는 궁에서 객씨 마님의 수방에 있던 옥란이라 해요. 생사의 소상에 입힐 망포를 지어 가지고 왔어요.'],
      [EMBROIDERER, '(보따리를 풀어 안감 한쪽을 뒤집는다) 이 안에 장부가 꿰매져 있어요. 생사를 세운다며 누가 은자를 얼마 바쳤는지, 동림의 선비 누구를 누가 고발했는지… 구천세의 붉은 붓 자국까지 다 있어요. 바늘을 대다가 알았어요.'],
      [EMBROIDERER, after ? '새 황제께서 서셨어요. 위충현이 오직 한 사람 두려워하던 분이에요. 이걸 그분께 — 아니면 장 황후마마께 드려야 해요. 마마는 객씨가 마마의 아기를 빼앗아 간 걸 잊지 않으셨어요.' : '황제 폐하께서 위독하시대요. 아드님이 없으니 아우이신 신왕께서 뒤를 이으실 거예요. 위충현이 오직 한 사람 두려워하는 분이에요. 그날이 오면 이걸 장 황후마마께 드려야 해요.'],
      ines ? ['I', '(옥란 앞을 막아서며) 저 두건들, 영원에서 저를 끌고 가려던 놈들이에요. 선장님 — 이번에도 그냥 못 보내죠?', 'surprised'] : null,
      ['nc_dangtou', '(사내들 사이에서 웃으며 나선다) 동창의 당두요. 수방 궁녀가 구천세의 망포를 들고 달아났다기에 쫓아왔소. 선장, 계집과 보따리만 넘기면 그대는 아무것도 못 본 거요.']
    ]); });
    var bribe = k.bribeOkran || 1800;
    var v = await UI.ask('동창의 당두가 옥란과 망포를 내놓으라 한다', [
      { label: '옥란을 배에 숨긴다 — 동창을 막는다 (육상전)', value: 'fight', icon: 'sword' },
      { label: '당두에게 은자를 쥐여 보낸다 (금화 ' + U.num(bribe) + '닢)', value: 'bribe', icon: 'coin', dis: s.player.gold < bribe },
      { label: '「궁의 일에는 끼지 않겠소」', value: 'no' }], me());
    if (v === 'bribe' && s.player.gold < bribe) v = 'no';
    var ok = v !== 'no';
    if (v === 'bribe') {
      s.player.gold -= bribe;
      await play([['nc_dangtou', '(은자를 달아 보며) …수방 궁녀는 압록강에 몸을 던졌다고 아뢰지. 망포는 불에 탔고. 선장, 다음엔 이 값으로 안 되오.']]);
    } else if (v === 'fight') {
      ok = (await fight('동창의 번역', (k.foe || {}).okran || 18, { guns: false, leader: '동창의 당두' })) === 'win';
    }
    // 어느 쪽이든 장부와 출입패는 제독에게 — 옥란은 끌려가더라도 그것만은 넘긴다
    give('nc_ledger'); givePass();
    if (!ok) {
      b.okran = 'taken';
      await play([
        [null, '갈색 두건들이 옥란의 팔을 잡아챈다. 그녀가 보따리에서 얇은 책 한 권과 나무 패 하나를 뜯어 제독의 발밑으로 던진다.'],
        [EMBROIDERER, '수방의 출입패예요! 그걸 보이면 북경 성문이 열려요 — 자경궁으로, 장 황후마마께로…! 제 바늘이 헛되지 않게 해 주세요!'],
        [null, '사내들은 보따리의 망포만 챙겨 옥란을 끌고 간다. 장부는 그들이 펼쳐 보기 전에 제독의 품에 들어갔다.']
      ]);
      log('수방 궁녀 옥란이 동창에 끌려갔다. 그녀가 던진 위충현 일당의 장부와 수방의 출입패를 받았다 — 북경의 장 황후께.');
      UI.toast('수방의 장부 — 북경(1627.10.2~12.10) 자경궁의 장 황후께 · 수방의 출입패로 북경 성문 통행', 'scroll', 7000);
      return;
    }
    b.okran = 'joined';
    await play([
      [null, '밤의 선실. 옥란이 등잔 아래에서 망포의 실밥을 한 땀 한 땀 뜯어 장부를 꺼낸다. 바늘을 쥔 손가락이 목련 꽃잎처럼 희다.'],
      ['O', '이 패는 수방의 출입패예요. 수방 궁녀는 비단을 사러 성문을 드나들어요. 이걸 보이면 북경 성문을 지나실 수 있어요. 자경궁의 장 황후마마께 데려다 드릴게요.', 'happy'],
      ['O', after ? '…그리고, 고맙습니다. 궁에서 열세 해를 사는 동안 저를 위해 칼을 뽑은 분은 처음이에요.' : '새 황제께서 서시면, 그때 북경으로 가요. 그 전에는 위충현의 눈이 너무 많아요. …고맙습니다. 궁에서 열세 해를 사는 동안 저를 위해 칼을 뽑은 분은 처음이에요.', 'shy']
    ]);
    join('nc_okran', LIAODONG, 80);
    var so = fame('so', 'okran');
    log('동창에 쫓기던 수방 궁녀 옥란을 배에 태웠다. 위충현 일당의 장부와 수방의 출입패(북경 성문)를 받았다. (사교 명성 +' + so + ')');
    UI.toast('옥란 — 수방의 장부를 들고 배에 올랐다 · 북경(1627.10.2~12.10) 장 황후께', 'heart', 6400);
    refresh();
  }

  // ================================================================ ③ 자경궁의 밤 (1627.10.2~12.10, 북경)
  function palOpen() { var b = st(), t = today(); return !!(b && !b.palace && has('nc_ledger') && cityNow() === PEKING && t >= D.palFrom && t <= D.palTo); }
  function palLateOpen() { var b = st(); return !!(b && !b.palace && has('nc_ledger') && today() > D.palTo); }
  async function palace() {
    var b = st(), s = S(), k = K(), okr = !!row('nc_okran'), ines = !!row('nc_ines');
    await withPic('nc_palace', '자경궁의 밤 (1627)', function () { return play([
      [null, '북경. 새 황제가 선 지 며칠, 거리마다 위충현의 생사 앞에 향불이 꺼지지 않는다. 수방의 출입패를 내보이자 성문의 병사가 비단 짐을 흘끗 보고 길을 비킨다.'],
      okr ? ['O', '이쪽이에요. 비단 수레가 드나드는 서화문 옆 골목이요. …손이 떨리네요. 열세 해를 산 곳인데.'] : [null, '옥란이 일러 준 대로 비단 수레가 드나드는 서화문 옆 골목으로 들어선다.'],
      ['nc_dangtou', '(골목 그늘에서 나타나며) 기다렸소, 선장. 요동에서 사라진 장부가 북경으로 올 줄 알았지. …싸우자는 게 아니오. 사겠소. 금화 ' + U.num(k.sell || 12000) + '닢. 구천세께서는 아직 사례감과 동창을 쥐고 계시오. 새 황제는 열일곱 살 아이고.']
    ]); });
    var v = await UI.ask('동창의 당두가 장부를 사겠다 한다', [
      { label: '판다 (금화 ' + U.num(k.sell || 12000) + '닢 · 악명 +' + (k.notoSell || 10) + ')', value: 'sell', icon: 'coin' },
      { label: '「이건 팔 물건이 아니오」 — 자경궁으로 간다', value: 'empress', icon: 'crown' }], me());
    if (v === 'sell') {
      b.palace = 'sold'; drop('nc_ledger');
      s.player.gold += k.sell || 12000; notoriety(k.notoSell || 10, '위충현의 사람에게 장부를 팔았다');
      await play([['nc_dangtou', '(장부를 등잔불에 대며) 현명하오. 종이는 불에 타면 아무 말도 하지 않지.']]);
      if (okr) {
        await play([['O', '(장부가 타는 것을 보며) …제 바늘은 무엇을 위해 그 안감을 지었을까요. 선장님은 좋은 분이셨어요. 오늘 전까지는요.'], [null, '옥란은 출입패를 제독의 손에 쥐여 주고, 비단 수레 사이로 걸어 들어가 다시 나오지 않았다.']]);
        var m = row('nc_okran'); if (m) s.mates = s.mates.filter(function (x) { return x !== m; });
        b.okran = 'gone';
      }
      log('북경에서 위충현 일당의 장부를 동창의 당두에게 팔았다.' + (okr ? ' 옥란이 배를 떠났다.' : ''));
      refresh(); return;
    }
    await play([
      [null, '자경궁. 등불 아래 소복에 가까운 엷은 비단을 입은 여인이 홀로 앉아 있다. 키가 크고, 눈매가 서늘하다. 천계제의 황후 장씨 — 이제는 의안황후다.'],
      [MAID, '(문간에서 막아서며) 바깥 사내가 어찌 여기를…!'],
      ['nc_empress', '두어라. ' + (okr ? '옥란이 데려온 사람이다. …살아 있었구나, 옥란아. 객씨의 수방에서 네가 사라졌다기에 우물을 뒤지게 했다.' : '수방의 출입패를 가진 이방인이라 했지. 그 패의 주인은 어찌 되었느냐?')],
      okr ? ['O', '(엎드려 망포의 안감을 펼쳐 올린다) 마마, 생사를 세운 은자의 장부예요. 동림의 선비들을 누가 고발했는지도 있어요.'] : ['P', '동창에 끌려갔습니다. 마지막에 이 장부를 마마께 드려 달라 했습니다.'],
      ['nc_empress', '(장부를 넘기며, 목소리가 낮아진다) 객씨가 보낸 궁녀가 내 허리를 주무른 날, 나는 아이를 잃었다. 위충현은 내 아버지를 역적으로 몰려 했지. 나는 선제께 열 번을 아뢰었으나 선제께서는 대패만 잡으셨다.'],
      ['nc_empress', '신왕 — 아니, 새 황제께 나는 「궁의 음식을 들지 마시오」라고만 일렀다. 이제 이것을 드리겠다. 이방인, 네가 이 나라의 칼집에 칼을 꽂아 주었구나.'],
      [null, '며칠 뒤 밤, 자경궁의 뒤뜰. 마른 얼굴의 열일곱 살 황제가 장부를 덮으며 이를 악문다.'],
      ['nc_chongzhen', '구천세라… 천하에 만세는 하나뿐이고, 구천세는 없다. (제독을 내려다보며) 바다의 사람, 짐은 이 일을 잊지 않겠다. 그러나 짐의 나라에는 이 장부보다 무거운 것이 많다. 요동의 군량, 섬서의 굶주림, 텅 빈 곳간…'],
      ines ? ['I', '(성문을 나서며 작게) 저 황제, 눈이 우리 아버지 같아요. 포가 터질 걸 알면서도 화승을 놓지 못하는 눈이요.'] : null
    ]);
    b.palace = 'empress'; drop('nc_ledger');
    s.player.gold += k.reward || 3000;
    var so = fame('so', 'ledger');
    log('북경 자경궁에서 장 황후에게 위충현 일당의 장부를 바쳤다. 장부가 새 황제 숭정제의 손에 들어갔다. (금화 +' + U.num(k.reward || 3000) + ' · 사교 명성 +' + so + ')');
    UI.toast('수방의 장부 — 장 황후를 거쳐 숭정제에게', 'crown', 6000);
    refresh();
  }
  async function palLate() {
    var b = st(); b.palace = 'late';
    log('위충현이 무너진 뒤에야 수방의 장부를 펼쳤다. 이제는 아무도 그 이름들을 묻지 않는다.');
    UI.toast('수방의 장부 — 북경으로 가져갈 날이 지났다', 'hourglass', 4200);
  }

  // ================================================================ ④ 옥문이 열리다 (1627.12.11~1628.6.30)
  function freeOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.freed && (b.ines === 'taken' || b.okran === 'taken') && (c === LIAODONG || c === PEKING || c === MACAO) && t >= D.freeFrom && t <= D.freeTo); }
  async function freed() {
    var b = st(), c = cityNow(), sold = b.palace === 'sold';
    var I = b.ines === 'taken', O = b.okran === 'taken';
    b.freed = 1;
    var lines = [[null, (c === MACAO ? '오문의 부두.' : c === PEKING ? '북경 동창의 옥문 앞.' : '요동의 부두.') + ' 위충현이 부성의 객점에서 목을 맨 뒤, 새 황제의 명으로 동창의 옥문이 열렸다. 야윈 사람들이 햇빛에 눈을 가리며 줄지어 걸어 나온다.' + (c === MACAO ? ' 그 가운데 몇이 남쪽 바다로 가는 배를 얻어 탔다.' : '')]];
    if (I) lines.push(['I', (has('nc_shard') ? '(손을 내밀며) 그 포탄 조각, 아직 갖고 있죠? 받으러 온다고 했잖아요.' : '선장님…? 정말 선장님이에요?') + ' 옥에서 날마다 포 쏘는 소리를 흉내 냈어요. 안 그러면 미칠 것 같아서요.', 'happy']);
    if (O && !sold) lines.push(['O', b.palace === 'empress' ? '장부가 마마께 닿았다고 옥리들이 수군거렸어요. 그 날부터 저를 때리지 않았어요. …선장님 덕분이에요.' : '장부는… 어찌 되었든, 이제 상관없어요. 그분이 무너졌으니까요. 저를 데려가 주시겠어요? 궁에는 돌아가고 싶지 않아요.', 'shy']);
    if (O && sold) lines.push(['O', '(제독을 보고 걸음을 멈춘다) …장부를 파셨다는 걸 알아요. 당두가 옥에 와서 자랑했거든요. 고맙다고는 못 하겠어요. 저는 소주로 돌아가요.']);
    await withPic('nc_freed', '옥문이 열리다 (1627)', function () { return play(lines); });
    var who = [];
    if (I) { b.ines = 'joined'; b.inesHow = 'freed'; join('nc_ines', c, 80); who.push('이네스'); }
    if (O && !sold) { b.okran = 'joined'; join('nc_okran', c, 78); who.push('옥란'); }
    if (O && sold) b.okran = 'gone';
    if (I && has('nc_shard')) { /* 포탄 조각은 제독이 간직한다 — 그녀가 「선장님이 갖고 있어요」라고 한다 */ }
    var so = fame('so', 'freed');
    log('동창의 옥문이 열렸다.' + (who.length ? ' ' + who.join('·') + '이(가) 제독의 배에 올랐다.' : '') + ' (사교 명성 +' + so + ')');
    if (who.length) UI.toast(who.join('·') + ' — 동창의 옥에서 나와 배에 올랐다', 'heart', 6000);
    refresh();
  }

  // ================================================================ ⑤ 빈 곳간 (1628.6.1~1629.3.31, 요동)
  function grainOpen() { var b = st(), t = today(); return !!(b && !b.grain && cityNow() === LIAODONG && t >= D.grainFrom && t <= D.grainTo); }
  function grainDeliverOpen() { var b = st(); return !!(b && b.grain === 'quest' && cityNow() === LIAODONG && today() <= D.grainTo && food() >= ((K().grain || {}).q || 60)); }
  function grainLateOpen() { var b = st(); return !!(b && b.grain === 'quest' && today() > D.grainTo); }
  async function grainAsk() {
    var b = st(), s = S(), k = K(), g = k.grain || {}, q = g.q || 60, loan = k.loan || 3000;
    await withPic('nc_granary', '빈 곳간 (1628)', function () { return play([
      [null, '요동의 부두. 영원으로 가는 길목의 곡물 창고 문이 활짝 열려 있다 — 텅 비어서다. 해진 솜옷의 병사들이 창고 앞에 앉아 있다.'],
      [SOLDIER, '넉 달이오. 넉 달째 녹봉도 쌀도 오지 않았소. 성벽 위에서 오랑캐는 막았는데, 배고픔은 못 막겠구려.'],
      ['nc_yuan', '(독사의 관복을 입고 다가오며) 다시 왔소, 바다의 사람. 새 황제께서 나를 불러 「다섯 해 안에 요동을 되찾으라」 하셨소. 나는 그러겠다고 아뢰었지. 그런데 호부는 「곳간이 비었다」는 말만 보내오.'],
      ['nc_grain', '(빈 장부를 펼쳐 보이며) 위충현의 무리가 생사에 쏟은 은자가 산을 이루었는데, 그 은자는 다 어디로 갔는지… 섬서는 가물어 세금이 안 걷히고, 요동의 군량은 바다로 실어 와야 하오.'],
      ['nc_yuan', '쌀이든 밀이든 ' + q + '통이면 이 진영이 겨울을 넘기오. 값은 — 부끄럽지만 시세대로 치를 수가 없소.'],
      row('nc_ines') ? ['I', '(병사들 사이에서 낯익은 얼굴을 찾아내고는) 저 사람, 영원에서 같이 포를 닦던 사람이에요… 선장님.'] : null,
      row('nc_okran') ? ['O', '(빈 장부를 흘끗 보고) 생사 한 곳에 든 은자면 이 창고를 세 번 채워요. 제가 그 장부를 꿰맸으니 알아요.'] : null
    ]); });
    var have = food() >= q;
    var v = await UI.ask('원숭환이 군량을 청한다', [
      have ? { label: '짐칸의 쌀·밀 ' + q + '통을 넘긴다 (시세의 ' + (g.k || 0.7) + '배)', value: 'give', icon: 'ship' } : null,
      { label: '금화 ' + U.num(loan) + '닢을 빌려준다 (차용증)', value: 'loan', icon: 'coin', dis: s.player.gold < loan },
      !have ? { label: '쌀·밀 ' + q + '통을 싣고 오겠다 (1629년 3월 31일까지)', value: 'quest', icon: 'ship' } : null,
      { label: '「장사꾼이 밑지는 장사를 할 수는 없소」', value: 'no' }].filter(Boolean), me());
    if (v === 'loan' && s.player.gold < loan) v = 'no';
    if (v === 'no') { b.grain = 'no'; await play([['nc_yuan', '…옳은 말이오. 나라의 곳간을 장사꾼이 채울 수는 없지.']]); log('요동의 빈 곳간 앞에서 원숭환의 청을 거절했다.'); return; }
    if (v === 'quest') { b.grain = 'quest'; log('원숭환에게 쌀·밀 ' + q + '통을 요동으로 실어 오기로 했다 (1629.3.31까지).'); UI.toast('요동의 군량 — 쌀·밀 ' + q + '통 (1629.3.31까지)', 'ship', 6000); return; }
    if (v === 'give') return grainDeliver();
    s.player.gold -= loan; give('nc_iou'); b.grain = 'loan';
    await play([['nc_yuan', '(관인을 찍으며) 나라의 곳간이 차면 갚겠소. …그날이 올지는 나도 모르겠구려.']]);
    var so = fame('so', 'loan');
    log('요동의 군량을 대라고 원숭환에게 금화 ' + U.num(loan) + '닢을 빌려주었다. 숭정 원년의 차용증을 받았다. (사교 명성 +' + so + ')');
    refresh();
  }
  async function grainDeliver() {
    var b = st(), k = K(), g = k.grain || {}, q = g.q || 60;
    var gold = takeFood(q, g.k || 0.7);
    b.grain = 'done';
    await play([
      [null, '쌀가마가 부두에 내려지자 병사들이 일어선다. 누군가 웃고, 누군가 운다.'],
      ['nc_yuan', '이 쌀은 성벽보다 단단하오. (값을 치르며) 제값을 못 드려 미안하오 — 금화 ' + U.num(gold) + '닢이오. 황제께서 아시면… 아니, 황제께서는 이미 너무 많은 것을 아시오.']
    ]);
    var so = fame('so', 'grain');
    log('요동의 빈 곳간에 쌀·밀 ' + q + '통을 시세보다 싸게 넘겼다. (금화 +' + U.num(gold) + ' · 사교 명성 +' + so + ')');
    UI.toast('요동의 군량 — 영원의 진영이 겨울을 넘긴다', 'ship', 5000);
    refresh();
  }
  async function grainLate() { var b = st(); b.grain = 'late'; log('요동으로 군량을 실어 가기로 한 날이 지났다.'); UI.toast('요동으로 군량을 가져갈 날이 지났다', 'hourglass', 4200); }

  // ================================================================ 도시에 들어설 때
  var STEPS = [[palLateOpen, palLate], [grainLateOpen, grainLate], [freeOpen, freed], [palOpen, palace], [inesOpen, inesScene], [okOpen, okranScene],
    [wallOpen, wall], [grainDeliverOpen, grainDeliver], [grainOpen, grainAsk]];
  NC.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  NC.check = async function () {
    if (NC._busy) return false; NC._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    NC._busy = false; refresh();
    return true;
  };
  NC._t = { wall: wall, ines: inesScene, okran: okranScene, palace: palace, freed: freed, grain: grainAsk, deliver: grainDeliver };
})(window.G = window.G || {});
