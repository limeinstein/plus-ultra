/* 아즈텍 제국의 멸망 — 호수 위의 도시 (G.Aztec) 2026-10-19 사용자 요청 「아즈텍 제국 멸망 시나리오」 → 「이벤트 개발해」
   기획 문서: Claude Docs 「아즈텍 제국 멸망 시나리오」. 잉카 제국의 멸망(js/systems/incafall.js)과 같은 꼴 — 역사 날짜·장소에 제독이 있으면 이야기에 끼어든다.
   역사는 바뀌지 않는다. 어느 갈래로 가도 테노치티틀란은 1521년 8월 13일에 무너진다. 바뀌는 것은 누가 살아남고, 무엇이 남고, 제독이 무엇을 얻고 잃는가다.
   ■ 열두 장 (사람: js/data/aztec.js)
     1 황금의 소문 (1517.3~1519.2.17, 산티아고·아바나): 코르테스와 술잔 · 벨라스케스 총독의 밀명
     2 떠밀려 온 수도사 (1519.2.18~4.20, 바다 — 코르테스의 함대와 이야기할 때): 코수멜의 아길라르를 먼저 구하면 부하로
     3 배를 불사르다 (1519.4.21~8.15, 베라크루스): 선원과 화약을 빌려준다(정복자의 편) · 거절(방관) · 총독에게 알린다
     4 틀락스칼라의 동맹 (1519.8.16~10.31, 투라스칼라): 정복자의 편 — 시코텐카틀과 일기토(이기면 피 없이 동맹) 또는 육상전
     5 호수 위의 도시 (1519.6~1520.5.21, 테노치티틀란): 목테수마 알현 — 「하얀 사람들을 어떻게 보느냐」 → 황제의 편이면 깃털관을 받는다
     6 셈포알라의 밤 (1520.4.20~5.27, 베라크루스): 나르바에스의 토벌대. 여기까지 편을 바꿀 수 있고, 그 뒤로는 굳는다
     7 대신전의 학살과 황제의 죽음 (1520.5.22~6.29, 테노치티틀란): 「멈추라」 · 함께 · 외면 / 귀족을 지킨다 → 목테수마의 마지막 부탁 (보물 · 아이들)
     8 슬픈 밤 (1520.6.30~7.6, 테노치티틀란 — 7장에서 머물러도): 정복자의 편은 「퇴각 판」 육상전(살아 끝까지 가면 승리, 금괴를 지면 더 오래), 황제의 편은 둑길을 지킨다
     9 오툰바 (8장에 이어서, 또는 1520.7.7~8.15 투라스칼라): 깃발을 진 대장을 쓰러뜨리면 흩어진다
     10 천연두 (1520.9.15~12.31, 테노치티틀란·투라스칼라·베라크루스): 역병 — 약재 값이 뛰고 선원이 앓는다. 도울 수는 있어도 막을 수는 없다
     11 호수의 포위 (1521.4.28~8.12): 정복자의 편은 투라스칼라·베라크루스, 황제의 편은 테노치티틀란에서 큰 해전 — 브리건틴 대 카누 선단 (G.Rel.greatBattle)
     12 독수리가 내려앉다 (1521.8.13 뒤 어느 도시든): 갈래별 결말 — 작위·악명 / 쿠아우테목의 탈출·에스파냐의 노여움 / 살아남은 그림 문서
   ■ 저장: s.aztec = { side: 'cortes'|'aztec'|'none', met, vel, rumor, sea, vc, tlax, aud, cemp, lock, mass, wish, noche, otumba, pox, lake, end, ban, told: {} }
     side가 없으면 아직 고르지 않았다(6장이 지나면 'none'으로 굳는다). 1522년 뒤의 오래된 저장은 「방관」으로 열린다.
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/aztec_*.webp — images/legend-events/AZTEC_PROMPT.md */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var AZ = G.Aztec = {};
  function S() { return G.Game && G.Game.state; }
  function st() {
    var s = S(); if (!s) return null;
    if (!s.aztec) {
      s.aztec = U.dateNum(s.date) > 15221231 ? { side: 'none', lock: 1, end: 'old', told: {} } : { told: {} };   // 오래된 저장은 방관으로
      // 옛 저장을 늦게 불러오면 이미 지난 소식·시장 사건(천연두·정복 전쟁)이 엉뚱한 해에 한꺼번에 뜨던 것 — 오늘 전에 지난 일은 알린 것으로 친다 (QA 2026-10-23)
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (NEWS_AT[k] < t0) s.aztec.told[k] = 1; });
    }
    return s.aztec;
  }
  // 날마다 소식의 날짜 (AZ.daily와 같은 값) — 상태를 새로 만들 때 이미 지난 것을 가려낸다
  var NEWS_AT = { sail: 15190218, enter: 15191108, narvaez: 15200423, toxcatl: 15200522, moct: 15200630, noche: 15200701, otumba: 15200708,
    pox: 15200915, cuitla: 15201204, war: 15210101, brig: 15210428, crown: 15200801, mexico: 15220301 };
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], l[0] === 'P' ? me() : l[0] ? H(l[0]) : {}); }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }

  var SANTIAGO = 195, HAVANA = 196, VERACRUZ = 199, TENOCH = 200, MEXICO = 201, TLAX = 202;
  AZ.CITY = { SANTIAGO: SANTIAGO, HAVANA: HAVANA, VERACRUZ: VERACRUZ, TENOCH: TENOCH, MEXICO: MEXICO, TLAX: TLAX };
  var K = AZ.K = {
    rumorFrom: 15170301, rumorTo: 15190217, cortesCaptain: 15181023,
    seaFrom: 15190218, seaTo: 15190420,
    vcFrom: 15190421, vcTo: 15190815,
    tlaxFrom: 15190816, tlaxTo: 15191031,
    audFrom: 15190601, cortesIn: 15191108, audTo: 15200521,
    cempFrom: 15200420, cempTo: 15200527,
    massFrom: 15200522, massTo: 15200629,
    nocheFrom: 15200630, nocheTo: 15200706,
    otumbaFrom: 15200707, otumbaTo: 15200815,
    poxFrom: 15200915, poxTo: 15201231,
    lakeFrom: 15210428, lakeTo: 15210812,
    fall: 15210813, banTo: 15260101,
    lendCrew: 20, lendGold: 600, velGold: 800, giftGold: 1500, raidGold: 2000, massGold: 2500, carryGold: 3000, shareGold: 4000, wishGold: 2500,
    notoMass: 8, notoEnd: 6, poxK: 0.06
  };
  // 시장 사건 (js/systems/economy.js): 천연두 — 약재가 동난다 · 정복 전쟁 — 무기·말·약재 값이 뛴다 (방관하는 상인의 몫)
  var POX_EV = { id: 'aztecpox', name: '천연두', scope: 'area', r: 3, regions: [10], need: 'big', years: [9999, 9999], dur: [100, 120], lead: [0, 0],
    goods: { herbs: 2.8, maize: 1.6, beans: 1.5, wine: 1.3, salt: 1.3 }, cats: { lux: 0.7, gem: 0.7 },
    why: ['{place}에 얼굴에 고름이 돋는 낯선 병이 번져 사람들이 집집마다 쓰러져 있다', '{place} 둘레 마을마다 천연두로 장사 지낼 사람조차 모자란다'] };
  var WAR_EV = { id: 'aztecwar', name: '정복 전쟁', scope: 'area', r: 4, regions: [10], need: 'port', years: [9999, 9999], dur: [240, 260], lead: [0, 0],
    goods: { guns: 2.0, cannon: 1.8, horses: 2.2, herbs: 1.7, iron: 1.5, wine: 1.4, hides: 1.2 },
    why: ['{place}로 쿠바와 이스파뇰라의 배들이 무기와 말을 실어 나른다 — 호수의 도시를 둘러싼 싸움에 무엇이든 모자란다'] };
  if (G.Econ && G.Econ.DEF) { if (!G.Econ.DEF.aztecpox) G.Econ.DEF.aztecpox = POX_EV; if (!G.Econ.DEF.aztecwar) G.Econ.DEF.aztecwar = WAR_EV; }
  function startEv(id, cid) { if (G.Econ && G.Econ.start && G.Econ.DEF && G.Econ.DEF[id]) { try { var e = G.Econ.start(id, cid, { k: 1 }); if (e) e.told = 'on'; return e; } catch (er) { console.error(er); } } return null; }

  function trust(ids, n) {
    if (!G.Sponsor || !G.SPONSOR) return;
    ids.forEach(function (id) { var sp = G.SPONSOR[id]; if (sp && G.Sponsor.present(sp)) { var r = G.Sponsor.rel(id); if (r.met || n < 0) G.Sponsor.addTrust(r, n); } });
  }
  function notoriety(n, why) { var p = S().player; p.notoriety = (p.notoriety || 0) + n; UI.toast(why + ' (악명 +' + n + ')', 'skull', 4200); }
  function keepsake(id, name, desc) {
    var p = S().player; if (p.items.some(function (x) { return x.id === id; })) return false;
    p.items.push({ id: id, kind: 'keepsake', name: name, desc: desc }); return true;
  }
  function hint(id) { if (G.Disc && G.DISC && G.DISC[id] && !G.Disc.foundByMe(id) && G.Disc.addHint) G.Disc.addHint(id, 'lead:aztec'); }
  function hasMate(id) { return S().mates.some(function (x) { return x.id === id; }); }
  /** 사건으로 부하가 된다 (술집의 고용 절차 없이 — 급료는 그대로) */
  function joinMate(id, loyal) {
    var s = S(), m = G.MATE && G.MATE[id]; if (!m || hasMate(id)) return false;
    delete s.flags['gone_' + id];
    if (R.tidyCaptains) R.tidyCaptains();
    var role = G.ROLES.map(function (r) { return r.id; }).filter(function (rid) { return !s.mates.some(function (x) { return x.role === rid; }); })[0] || 'none';
    var nm = { id: id, role: role, ev: 1, joined: today(), loyal: loyal || 70, from: cityNow() };   // ev: 사건으로 얻은 부하 (이별에서 뺀다 — js/systems/mateleave.js)
    if (role === 'none') { var free = s.fleet.ships.slice(1).filter(function (x) { return !R.captain(x); })[0]; if (free) { nm.role = 'captain'; nm.ship = free.uid; } }
    s.mates.push(nm);
    if (G.CrewAuto) G.CrewAuto.refresh();   // 기함의 빈 방이나 다른 배 자리에 능력에 맞게 (js/systems/crewauto.js)
    log(U.j(m.name, '이/가') + ' 동료가 되었다.');
    UI.toast(m.name + ' 동료가 되었다. (' + (R.roleName ? R.roleName(nm) : nm.role) + ')', 'people', 5000);
    return true;
  }
  function leaveMate(id) {
    var s = S(), i = -1; s.mates.forEach(function (x, k) { if (x.id === id) i = k; });
    if (i < 0) return false;
    s.mates.splice(i, 1); s.flags['gone_' + id] = 1; return true;
  }
  /** 에스파냐의 작위 사다리 한 칸 (에스파냐 제독은 제 나라 작위, 다른 나라 제독은 에스파냐의 명예 작위 — js/systems/court.js) */
  function titleStep(n) {
    var CT = G.Court, rl = G.COURT && G.COURT.realms && G.COURT.realms.ES; if (!CT || !rl) return null;
    var c = CT.state(), cur = CT.rank(rl), lad = CT.ladder(rl), nx = U.clamp(cur + n, 0, lad.length);
    if (nx === cur) return null;
    c.titles[rl.id] = nx; if (!nx) delete c.titles[rl.id];
    return nx ? CT.title(rl, nx) : { ko: '없음' };
  }
  /** 도시 안에서 뭍의 싸움 — 함대의 선원으로 (incafall.js와 같은 방식). o: {kind, leader, hold, guns} */
  async function fight(name, n, o) {
    o = o || {};
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, n, false, { kind: o.kind || 'native', guns: !!o.guns, leader: o.leader, hold: o.hold, flee: o.hold ? false : undefined, winText: o.winText }); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  /** 머물며 며칠을 보낸다 (테노치티틀란에 남아 슬픈 밤까지) */
  async function wait(days) {
    if (!(days > 0)) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(days); });
    var news = msgs.filter(function (m) { return m && m.history; });
    if (news.length && G.Scenes.city && G.Scenes.city.news) { try { await G.Scenes.city.news(news); } catch (e) { console.error(e); } }
    refresh();
  }
  function daysTo(dn) { var s = S(); return U.dayIndex({ y: Math.floor(dn / 10000), m: Math.floor(dn / 100) % 100, d: dn % 100 }) - U.dayIndex(s.date); }
  function open(from, to) { var t = today(); return t >= from && t <= to; }
  function sideName(x) { return x === 'cortes' ? '정복자의 편' : x === 'aztec' ? '황제의 편' : '방관'; }
  AZ.sideName = sideName;
  /** 6장이 지나면 편이 굳는다 — 고르지 않았으면 방관 */
  function lockSide(b) { if (!b.lock) { b.lock = 1; if (!b.side) b.side = 'none'; } }

  // ================================================================ 날마다 — 소식
  AZ.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told || (b.told = {}), met = !!(b.met || b.side), here = cityNow();
    function news(key, when, ok, icon, text) { if (!told[key] && t >= when && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    if (!b.lock && t > K.cempTo) lockSide(b);
    news('sail', 15190218, true, 'sail', '【코르테스의 출항】 쿠바 총독 벨라스케스가 원정대장 자리를 빼앗으려 하자, 에르난 코르테스가 배 열한 척과 오백 명을 이끌고 몰래 쿠바를 떠났다. 서쪽 뭍 깊은 곳에 황금의 왕국이 있다고 한다.');
    news('enter', K.cortesIn, true, 'scroll', '【호수 위의 도시】 코르테스의 원정대가 둑길을 건너 테노치티틀란에 들어갔다. 아즈텍 황제 목테수마가 몸소 나와 맞았다 한다. 병사들은 호수 위에 떠 있는 도시를 보고 꿈을 꾸는 것 같았다고 했다.');
    news('narvaez', 15200423, met, 'sail', '【나르바에스의 함대】 쿠바 총독이 보낸 판필로 데 나르바에스의 배 열여덟 척이 베라크루스 앞바다에 닻을 내렸다. 명을 어긴 코르테스를 붙잡으러 왔다고 한다.');
    news('toxcatl', 15200522, met, 'skull', '【대신전의 학살】 코르테스가 자리를 비운 사이, 테노치티틀란 대신전의 톡스카틀 축제에서 알바라도의 병사들이 춤추던 귀족들을 베었다. 도시가 들고 일어났다.');
    news('moct', 15200630, met && b.wish == null, 'skull', '【목테수마의 죽음】 사로잡혀 있던 아즈텍 황제 목테수마가 숨을 거두었다. 지붕 위에서 백성을 달래다 돌에 맞았다는 말도, 에스파냐 사람 손에 죽었다는 말도 있다.');
    news('noche', 15200701, true, 'skull', b.noche ? '【슬픈 밤】 그 밤의 둑길이 아직도 꿈에 나온다. 에스파냐 사람들은 그날을 「슬픈 밤」이라 부른다.' : '【슬픈 밤】 6월 30일 밤, 에스파냐 사람들이 몰래 테노치티틀란을 빠져나가다 둑길에서 들켜 절반을 잃었다. 금괴를 너무 많이 짊어진 병사들이 호수에 가라앉았다.');
    news('otumba', 15200708, met && !b.otumba, 'cannon', '【오툰바】 쫓기던 코르테스의 남은 무리가 오툰바 들판에서 아즈텍의 대군에 둘러싸였다가, 적의 깃발을 진 대장을 쓰러뜨려 포위를 뚫었다고 한다.');
    if (!told.pox && t >= K.poxFrom) { told.pox = 1; startEv('aztecpox', TENOCH); if (met) out.push({ icon: 'skull', history: true, text: '【천연두】 나르바에스의 배에 탔던 병든 사람에게서 옮은 천연두가 멕시코 고원에 번진다. 이 병을 모르던 사람들이 마을마다 쓰러진다.' }); }
    news('cuitla', 15201204, met, 'skull', '【쿠이틀라우아크의 죽음】 슬픈 밤 뒤에 황제가 된 쿠이틀라우아크가 여든 날 만에 천연두로 세상을 떠났다. 젊은 쿠아우테목이 뒤를 잇는다.');
    if (!told.war && t >= 15210101) { told.war = 1; startEv('aztecwar', VERACRUZ); if (met) out.push({ icon: 'coin', history: true, text: '【정복 전쟁】 베라크루스로 쿠바와 이스파뇰라의 배들이 무기·말·약재를 실어 나른다. 멕시코 만의 무기와 말 값이 뛰어오른다.' }); }
    news('brig', K.lakeFrom, met, 'sail', '【호수의 브리건틴】 코르테스가 뭍에서 조각조각 지어 산 너머로 나른 브리건틴 열세 척을 텍스코코 호수에 띄웠다. 테노치티틀란으로 이어진 둑길을 끊는다.');
    // 깃털관: 정복자의 편이면 코르테스가 발표하며 제독에게 몫을 나눈다 (발견물은 코르테스의 것)
    if (!told.crown && t >= 15200801 && b.side === 'cortes' && G.DISC && G.DISC.moctezuma && !(G.Disc && G.Disc.foundByMe('moctezuma'))) {
      told.crown = 1; var half = Math.round((G.DISC.moctezuma.val || 12000) / 2); s.player.gold += half;
      out.push({ icon: 'coin', history: true, text: '【목테수마의 깃털관】 코르테스가 황제의 깃털관과 황금 원반을 카를로스 1세께 올려 보냈다. 동업자의 몫이라며 금화 ' + U.num(half) + '닢을 보내왔다.' });
    }
    news('mexico', 15220301, met, 'scroll', '【멕시코】 무너진 테노치티틀란의 돌로 에스파냐 사람들의 새 도시 멕시코를 짓는다. 대신전 자리에 성당이 선다.');
    return out;
  };

  // ================================================================ 1 황금의 소문 (쿠바)
  function rumorOpen() { var b = st(), c = cityNow(); return !!(b && !b.rumor && (c === SANTIAGO || c === HAVANA) && open(K.rumorFrom, K.rumorTo)); }
  async function rumor() {
    var b = st(), s = S(), t = today(); b.rumor = 1; b.met = 1;
    if (t < 15181101) await play([
      [null, '쿠바의 항구 술집. 서쪽 바다에서 돌아온 사내들이 붕대 감은 팔로 금붙이를 굴리고 있다.'],
      ['bernal', '코르도바 대장을 따라 서쪽으로 갔다 왔소. 돌로 지은 신전이 있는 땅이었소 — 사람들은 솜 갑옷을 입고, 돌 칼날을 단 나무 몽둥이로 싸웁디다. 반을 잃고 왔지.'],
      ['bernal', '그래도 보시오, 이 금 귀걸이. 그 너머 산속에 이런 걸 산더미처럼 가진 왕이 있다더군. 「멕시코」라고 하던가.'],
      ['cortes', '(구석 자리에서 잔을 들며) 이보게 베르날, 그 이야기는 내가 아까 세 번 들었네. …제독, 바다를 아는 분 같군. 나는 코르테스, 이 섬에서 금광과 농장을 하오. 그대도 서쪽이 궁금하오?']
    ]);
    else await play([
      [null, '쿠바의 항구가 술렁인다. 부두에 배 열한 척이 늘어서 있고, 대포와 말을 싣느라 법석이다.'],
      ['cortes', '총독께서 나를 원정대장으로 뽑으셨소. 서쪽 뭍 깊은 곳의 황금 왕국 — 나는 거기까지 가 볼 생각이오. 장사꾼의 배가 아니라 정복자의 배로.'],
      ['velazquez', t >= 15190101 ? '(제독을 따로 불러 낮게) 코르테스 녀석이 내 말을 듣지 않소. 대장 자리를 거두려 했더니 밤새 배를 몰고 나가려 한다는 말이 들리오.' : '(제독을 따로 불러 낮게) 코르테스는 영리하오. 너무 영리하지. 원정대를 맡기긴 했지만… 그대 같은 사람이 곁에서 지켜봐 준다면 내 마음이 놓이겠소.']
    ]);
    var opts = [{ label: '코르테스와 술잔을 나누며 서쪽 이야기를 듣는다', value: 'cortes' }];
    if (t >= K.cortesCaptain) opts.push({ label: '총독의 밀명을 받는다 — 코르테스를 지켜보고 알린다 (금화 ' + U.num(K.velGold) + '닢)', value: 'vel' });
    opts.push({ label: '귀만 기울이고 자리를 뜬다', value: 'no' });
    var v = await UI.ask('쿠바, ' + s.date.y + '년 — 서쪽 뭍의 황금 소문', opts, me());
    if (v === 'cortes') {
      b.friend = 1;
      await play([['cortes', '좋소! 그곳 사람들은 금을 「신들의 똥」이라 부른다더군. 하하. 제독, 서쪽 바다에서 다시 만납시다. 유카탄의 코수멜 섬을 지나 해안을 따라 서쪽으로 — 그 끝에 무엇이 있는지 보러.']]);
      hint('aztec'); G.Fame.add('so', 20);
      log('쿠바에서 에르난 코르테스와 술잔을 나누었다. 서쪽 뭍 깊은 곳에 황금의 왕국이 있다고 한다.');
    } else if (v === 'vel') {
      b.vel = 1; s.player.gold += K.velGold; trust(['es_cuba'], 5);
      await play([['velazquez', '고맙소. 그자가 내 허락 없이 제멋대로 나라를 세우려 하면 — 알려 주시오. 그대의 말이면 국왕 폐하께도 닿을 거요.']]);
      log('쿠바 총독 디에고 벨라스케스에게서 코르테스를 지켜보라는 밀명과 금화 ' + U.num(K.velGold) + '닢을 받았다.');
    } else log('쿠바의 술집에서 서쪽 뭍의 황금 소문을 들었다.');
    refresh();
  }

  // ================================================================ 2 떠밀려 온 수도사 (바다 — 코르테스의 함대)
  function seaOpen(n) { var b = st(); return !!(b && !b.sea && n && n.exp && n.exp.id === 'cortes' && open(K.seaFrom, K.seaTo)); }
  async function sea() {
    var b = st(); b.sea = 1; b.met = 1;
    await play([
      ['cortes', b.friend ? '쿠바에서 만난 제독이로군! 바다에서 다시 보니 반갑소.' : '이 바다에서 남의 배를 만나다니. 우리는 쿠바에서 왔소.'],
      ['cortes', '코수멜 섬 사람들 말이, 몇 해 전 배가 부서져 떠밀려 온 수염 난 사람 둘이 뭍의 마야 사람들에게 붙잡혀 산다더군. 하나는 수도사라오. 사람을 보내 찾고 있는데 아직 소식이 없소.'],
      ['bernal', '(갑판에서) 그 사람이 마야 말을 안다면 우리 원정에 하느님이 보내 주신 선물이겠지.']
    ]);
    var v = await UI.ask('코르테스의 함대가 코수멜 섬 앞바다에 있다. 제독은?', [
      { label: '작은 배를 내어 먼저 해안을 뒤져 수도사를 찾는다', value: 'rescue' },
      { label: '코르테스의 함대와 함께 해안을 따라간다', value: 'follow' },
      { label: '제 갈 길을 간다', value: 'no' }], me());
    if (v === 'rescue') {
      await withPic('aztec_aguilar', '떠밀려 온 수도사 (1519)', function () { return play([
        [null, '해안의 마을. 원주민들 사이에서 그을린 몸에 허리옷만 걸친 사내가 카누를 저어 다가온다. 손에는 다 해진 기도서가 들려 있다.'],
        ['aguilar', '(더듬더듬) 하느님… 성모님…. 오늘이 수요일이오? 나는 그 날짜를 여덟 해 동안 세어 왔소. 나는 헤로니모 데 아길라르, 에시하 사람이오.'],
        ['aguilar', '같이 떠밀려 온 곤살로 게레로는 오지 않겠다 하오. 마야 여자와 혼인해 아이가 셋이고, 얼굴에 문신까지 했소. 「나는 여기 사람이다」라더군.'],
        ['aguilar', '나를 구해 준 은혜를 갚겠소. 마야 말이라면 내가 다 옮겨 드리리다.']
      ]); });
      joinMate('aguilar', 75);
      await play([['cortes', '…허, 내 사람들보다 그대가 먼저 찾았구려. 할 수 없지. 대신 서쪽에서 통역이 필요하면 그대 배에 묻겠소.']]);
      log('코수멜 섬 해안에서 여덟 해 동안 마야 사람들 사이에 살던 수도사 헤로니모 데 아길라르를 구했다.');
      G.Fame.add('so', 40);
    } else if (v === 'follow') {
      b.friend = 1;
      await play([
        [null, '함대는 유카탄의 해안을 따라 서쪽으로 간다. 타바스코 강어귀에서 원주민들과 큰 싸움이 붙었다 — 말을 처음 본 사람들은 사람과 짐승이 한 몸인 괴물이라 여겼다.'],
        [null, '싸움 뒤 그 고장 우두머리들이 화해의 선물로 금붙이와 여인 스무 명을 보냈다. 그 가운데 한 사람이 눈에 띄었다 — 마야 말도, 산 너머 멕시코의 말도 하는 여인.'],
        ['marina', '저는 말리날리라고 합니다. 어려서 팔려 왔습니다. 저 사람들이 원하는 나라의 말 — 나우아틀어는 제 어머니의 말입니다.'],
        ['cortes', '아길라르가 마야 말을, 이 여인이 멕시코 말을 옮기면 목테수마와 이야기를 나눌 수 있겠군. 하느님이 길을 열어 주시는구려. 제독, 서쪽의 새 항구에서 봅시다.']
      ]);
      hint('aztec');
      log('코르테스의 함대를 따라 유카탄 해안을 돌았다. 타바스코에서 두 말을 아는 여인 말린체가 원정대에 들어왔다.');
    } else log('바다에서 코르테스의 함대를 만났다. 코수멜 섬에 떠밀려 온 에스파냐 사람이 있다고 한다.');
    refresh();
  }

  // ================================================================ 3 배를 불사르다 (베라크루스)
  function vcOpen() { var b = st(); return !!(b && !b.vc && !b.lock && cityNow() === VERACRUZ && open(K.vcFrom, K.vcTo)); }
  async function vc() {
    var b = st(), s = S(), t = today(); b.vc = 1; b.met = 1;
    await withPic('aztec_veracruz', '참된 십자가의 부유한 마을 (1519)', function () { return play([
      [null, '모래 언덕 사이에 나무와 진흙으로 지은 집 몇 채. 코르테스의 사람들이 이곳을 「비야 리카 데 라 베라크루스 — 참된 십자가의 부유한 마을」이라 이름 지었다.'],
      [null, '바다 쪽에서 화려한 망토를 두른 사람들이 다가온다. 목테수마 황제의 사자들이다. 수레바퀴만 한 금 원반과 은 원반, 초록 깃털 옷을 가져왔다.'],
      ['marina', '(사자의 말을 옮기며) 「황제께서 손님들께 선물을 보내셨습니다. 그러나 산 너머 도시까지 오는 길은 멀고 험하니, 이것을 받고 돌아가시라 하십니다.」'],
      ['cortes', '…이 선물을 보고 돌아가라고? 이건 「어서 오라」는 말이오. 제독, 들어 보시오. 나는 총독의 허락 없이 이 땅에 도시를 세웠소. 이 마을의 시의회가 나를 대장으로 뽑았으니, 이제 나는 국왕 폐하께 바로 답하오.'],
      ['cortes', '그런데 사람이 모자라오. 선원 ' + K.lendCrew + '명과 화약을 빌려 주시오. 산을 넘어갈 때 그대의 사람들이 내 뒤를 지켜 준다면, 저 금 원반의 몫을 나누겠소.']
    ]); });
    var opts = [];
    if (s.fleet.crew > K.lendCrew + R.crewMin()) opts.push({ label: '선원 ' + K.lendCrew + '명과 화약을 빌려준다 — 코르테스의 편에 선다', value: 'cortes' });
    else opts.push({ label: '화약과 금화 ' + U.num(K.lendGold) + '닢어치 보급을 대 준다 — 코르테스의 편에 선다 (선원이 모자란다)', value: 'cortes' });
    opts.push({ label: '거절한다 — 남의 나라를 치는 일에는 끼지 않겠다', value: 'none' });
    opts.push({ label: b.vel ? '총독과의 약속대로 — 이 일을 쿠바에 알리겠다' : '이것은 반역이다 — 쿠바 총독에게 알리겠다', value: 'vel' });
    var v = await UI.ask('베라크루스, 1519년 — 코르테스의 청', opts, H('cortes'));
    if (v === 'cortes') {
      b.side = 'cortes';
      if (s.fleet.crew > K.lendCrew + R.crewMin()) s.fleet.crew -= K.lendCrew; else s.player.gold = Math.max(0, s.player.gold - K.lendGold);
      await play([
        ['cortes', '하하! 이제 우리는 동업자요. 말린체를 그대 배에 붙여 주겠소 — 저 산 너머 황제의 말을 아는 사람이 그대에게도 있어야 하니. 아길라르가 있으니 나는 어떻게든 되오.'],
        ['marina', '(제독을 똑바로 보며) 저는 이 사람들이 어디까지 가는지 보고 싶습니다. 그리고 그 길에서 누가 무엇을 하는지도.']
      ]);
      if (!hasMate('marina')) joinMate('marina', 65);
      log('베라크루스에서 코르테스에게 선원과 화약을 빌려주었다. 정복자의 편에 섰다.');
    } else if (v === 'vel') {
      b.side = 'none'; b.vel = 1; trust(['es_cuba'], 8);
      await play([['cortes', '(눈빛이 차가워지며) …그렇군. 총독의 개였소? 좋소, 알리시오. 그 편지가 쿠바에 닿을 즈음엔 내 배는 한 척도 남아 있지 않을 테니.']]);
      log('베라크루스에서 코르테스의 청을 물리치고, 그가 총독의 명을 어긴 일을 쿠바에 알리기로 했다.');
    } else {
      b.side = 'none';
      await play([['cortes', '아쉽구려. 장사꾼은 장사꾼이로군. 그래도 이 바다를 오가거든 내 소식은 듣게 될 거요.']]);
      log('베라크루스에서 코르테스의 청을 정중히 거절했다.');
    }
    await play([[null, t >= 15190801 ? '며칠 뒤, 코르테스는 자기 배들의 바닥에 구멍을 뚫어 모래톱에 가라앉혔다. 돌아갈 배가 없으니 앞으로 갈 수밖에 없다 — 그는 병사들에게 그렇게 말했다.' : '코르테스가 배들을 하나씩 모래톱으로 끌어 올리게 한다는 소문이 돈다. 「배가 썩었다」고 하지만, 병사들은 그 뜻을 안다 — 돌아갈 길을 끊는 것이다.']]);
    refresh();
  }

  // ================================================================ 4 틀락스칼라의 동맹 (투라스칼라)
  function tlaxOpen() { var b = st(); return !!(b && !b.tlax && cityNow() === TLAX && open(K.tlaxFrom, K.tlaxTo)); }
  async function tlax() {
    var b = st(), s = S(); b.tlax = 1; b.met = 1;
    if (b.side !== 'cortes') {
      await play([
        [null, '산으로 둘러싸인 나라 틀락스칼라. 메시카(아즈텍)에 둘러싸여 백 년 가까이 소금도 목화도 들여오지 못하고 버텨 온 사람들이다.'],
        ['xicotencatl', '바다에서 온 손님이로군. 해안에서 하얀 사람들이 산을 넘어온다는 소식이 왔다. 내 아버지와 늙은 우두머리들은 그들과 손을 잡아 메시카를 치자고 한다.'],
        ['xicotencatl', '나는 반대다. 메시카는 우리의 원수지만, 저 하얀 자들은 더 나쁠지도 모른다. 원수의 원수가 벗이라는 법은 없다. …너는 어느 쪽이냐?']
      ]);
      b.xico = 'met';
      log('틀락스칼라에서 젊은 전사 시코텐카틀을 만났다. 그는 하얀 사람들과 손을 잡는 데 반대한다.');
      return;
    }
    await play([
      [null, '산을 넘는 길. 돌로 쌓은 긴 성벽을 지나자 들판을 붉고 흰 줄무늬의 전사들이 가득 메우고 있다. 틀락스칼라의 군대다.'],
      ['cortes', '사흘째 싸우고 있소. 저들은 밤에도 덤비오. 우두머리들은 화친하자는데 저 젊은 장수가 듣지 않는다오. 시코텐카틀이라던가.'],
      ['xicotencatl', '(들판 건너에서 외친다) 수염 난 자들아! 네 배에서 내린 대장이 남자라면 나와라! 내가 이기면 너희는 해안으로 돌아가라!'],
      ['marina', hasMate('marina') ? '(제독 곁에서) 저 사람은 자존심으로 싸웁니다. 한 사람과 한 사람이 겨루면 그의 백성은 그 결과를 따를 겁니다.' : null]
    ]);
    var v = await UI.ask('틀락스칼라의 들판 — 시코텐카틀이 일기토를 청한다', [
      { label: '제독이 나서서 일기토로 겨룬다 (이기면 피 없이 동맹)', value: 'duel' },
      { label: '코르테스의 군대와 함께 맞서 싸운다', value: 'battle' }], me());
    var res = 'lose';
    if (v === 'duel' && G.Games && G.Games.duel) {
      var m = G.MATE && G.MATE.h_xicotencatl, stt = m ? m.st : [76, 62, 84, 64];
      res = await G.Games.duel({ name: '시코텐카틀', portrait: G.Art && G.Art.mateSpec ? G.Art.mateSpec('h_xicotencatl') : null, look: 'rival', str: stt[0], atk: 14, def: 6, skill: 3, mar: stt[2], int: stt[1], cha: stt[3], style: 'az' }, { place: 'land' });
      if (res === 'win') {
        b.xico = 'duel';
        await play([
          ['xicotencatl', '(흑요석 칼날이 부러진 몽둥이를 내려놓으며) …졌다. 너는 물러서지 않았고, 쓰러진 나를 베지도 않았다. 약속대로 우리 군대는 길을 비킨다.'],
          ['xicotencatl', '그러나 기억해라, 바다의 사람. 나는 저 대장이 아니라 너에게 진 것이다.']
        ]);
        G.Fame.add('bt', 120); G.Fame.add('so', 60);
        log('틀락스칼라의 들판에서 시코텐카틀과 일기토를 벌여 이겼다. 피를 흘리지 않고 틀락스칼라와 동맹을 맺었다.');
        refresh(); return;
      }
      await play([['xicotencatl', '하! 바다의 사람은 칼이 무디구나. 싸움은 계속된다!']]);
    }
    res = await fight('시코텐카틀의 틀락스칼라 전사', 120, { kind: 'native', leader: '시코텐카틀' });
    b.xico = res === 'win' ? 'battle' : 'lost';
    await play([[null, res === 'win' ? '해 질 녘, 틀락스칼라의 늙은 우두머리들이 흰 깃발을 들고 왔다. 그들은 메시카를 치는 데 함께하겠다고 했다. 시코텐카틀은 끝내 고개를 숙이지 않았다.' : '제독의 사람들은 물러났지만, 며칠 뒤 틀락스칼라의 우두머리들은 결국 코르테스와 손을 잡았다. 메시카에 대한 백 년의 미움이 더 컸다.']]);
    if (res === 'win') G.Fame.add('bt', 80);
    log(res === 'win' ? '틀락스칼라의 전사들과 싸워 이겼다. 틀락스칼라가 코르테스와 동맹을 맺었다.' : '틀락스칼라의 전사들에게 밀려났다. 그래도 틀락스칼라는 코르테스와 동맹을 맺었다.');
    refresh();
  }

  // ================================================================ 5 호수 위의 도시 (테노치티틀란 — 황제 알현)
  function audOpen() { var b = st(); return !!(b && !b.aud && !b.lock && cityNow() === TENOCH && open(K.audFrom, K.audTo)); }
  async function aud() {
    var b = st(), s = S(), t = today(), before = t < K.cortesIn; b.aud = 1; b.met = 1;
    await withPic('aztec_tenochtitlan', '호수 위의 도시 (1519)', function () { return play([
      [null, '산에 둘러싸인 넓은 호수. 그 한가운데 하얀 도시가 떠 있다. 세 갈래 둑길이 뭍에서 도시로 뻗고, 그 위를 카누와 사람이 끝없이 오간다. 도시 가운데 두 개의 신전을 얹은 피라미드가 솟아 있다.'],
      ['bernal', before ? null : '(둑길 위에서 넋을 놓고) 이것이 꿈이 아닌가 싶소. 세비야보다도, 로마보다도 크다는 사람이 있소. 시장에서는 하루에 육만 명이 사고판다오.'],
      [null, before ? '궁궐의 넓은 방. 맨발로 들어서야 한다. 신하들은 고개를 들지 못하고, 황제는 얇은 금 장식 신을 신은 채 낮은 의자에 앉아 있다.' : '궁궐의 넓은 방. 그런데 문 앞에 에스파냐 병사들이 서 있다. 코르테스가 들어온 지 엿새 만에, 황제는 손님들의 궁에 「머물고」 있다 — 사실은 붙잡혀 있다.'],
      ['yaocihuatl', before ? '(황제의 의자 곁에서 방패를 내리지 않은 채) 바다의 사람이라 해도 이 방에서는 진실만 말하라. 황제의 물음은 곧 도시의 물음이다.' : '(문 앞의 병사들을 노려보며) 손님이 주인의 문을 지키는 법은 없다. 이들의 쇠붙이가 번쩍일수록 나는 더 믿지 않는다.'],
      ['moctezuma', before ? '바다에서 온 사람. 해안에서 하얀 얼굴의 사람들이 산을 넘어온다는 그림 편지가 날마다 온다. 그들은 케찰코아틀이 돌아오는 것인가, 아니면 그저 금을 찾는 사람들인가.' : '바다에서 온 사람. 그대는 저 수염 난 사람들과 같은 바다를 건너왔으나 그들과 함께 있지 않구나.'],
      ['moctezuma', '그대에게 묻는다. 하얀 사람들을 어떻게 보는가?']
    ]); });
    var opts = [
      { label: '「믿지 마십시오. 저들은 황금을 찾아 온 사람들입니다」', value: 'aztec' },
      { label: b.side === 'cortes' ? '「그들과 손을 잡으십시오. 싸우면 피만 흐릅니다」 (정복자의 편 그대로)' : '「그들과 손을 잡으십시오. 싸우면 피만 흐릅니다」', value: 'peace' },
      { label: '「저는 장사꾼입니다. 거래를 하러 왔을 뿐입니다」', value: 'trade' }];
    var v = await UI.ask('목테수마 황제의 물음 — ' + (b.side ? '지금은 ' + sideName(b.side) : '아직 어느 편도 아니다'), opts, H('moctezuma'));
    if (v === 'aztec') {
      if (b.side === 'cortes') b.switched = 1;
      b.side = 'aztec';
      await play([
        ['moctezuma', '…그대의 말이 내 마음과 같구나. 그러나 나는 이미 신들의 말을 너무 오래 기다렸다.'],
        ['moctezuma', '이것을 가져가라. 케찰 새 깃털 사백 개로 엮은 관이다. 수염 난 자들은 이것도 녹여 금으로 만들 것이다. 바다 건너 그대의 나라에 — 우리가 누구였는지 보여 다오.'],
        ['cuauhtemoc', '(황제 곁에서) 숙부님, 이 사람을 믿으십니까? …좋습니다. 바다의 사람, 나는 쿠아우테목이다. 저 자들이 칼을 뽑는 날, 너는 어디에 서 있을 것이냐.'],
        ['yaocihuatl', '나는 야오시우아틀. 황제의 궁과 운하를 지키는 전사다. 그날이 오면 말이 아니라 네 방패가 대답할 것이다.'],
        ['marina', b.switched && hasMate('marina') ? '(낮게) 제독… 코르테스를 등지시는군요. 저는 그래도 제독의 배에 남겠습니다. 두 말 사이에 다리가 필요할 테니까요.' : null]
      ]);
      if (!b.switched && !hasMate('marina')) {
        await play([['marina', '(궁궐 복도에서 제독을 불러 세우며) 저는 코르테스의 통역 말린체입니다. …황제와 제독이 하는 말을 들었습니다. 저도 두 말 사이에 다리가 필요하다는 걸 압니다. 제독의 배에 태워 주십시오.']]);
        joinMate('marina', 60);
      }
      if (G.DISC && G.DISC.moctezuma && G.Disc && !G.Disc.foundByMe('moctezuma') && !(s.disc.moctezuma && s.disc.moctezuma.rival)) {
        try { await G.Disc.find(G.DISC.moctezuma, 'special'); } catch (e) { console.error(e); }
        UI.toast('「목테수마의 깃털관」 — 코르테스가 발표하기 전(1520년 8월)에 보고하면 제독의 이름으로 남는다', 'scroll', 7000);
      }
      G.Fame.add('so', 120);
      log('테노치티틀란에서 목테수마 황제를 알현했다. 하얀 사람들을 믿지 말라고 아뢰자 황제가 깃털관을 맡겼다. 황제의 편에 섰다.');
    } else {
      if (!b.side) b.side = 'none';
      s.player.gold += K.giftGold;
      await play([['moctezuma', v === 'peace' ? '피만 흐른다… 그래, 나도 그렇게 생각했다. 그래서 그들을 맞아들였다. 그대에게 카카오와 금을 내리마. 바다로 돌아가 평안하라.' : '장사꾼이라. 그렇다면 내 시장 틀라텔롤코를 보아라. 세상의 물건이 다 모인다. 이것은 손님에게 주는 선물이다.']]);
      G.Fame.add('so', 60);
      log('테노치티틀란에서 목테수마 황제를 알현했다. 황제가 금화 ' + U.num(K.giftGold) + '닢어치 선물을 내렸다.');
    }
    refresh();
  }

  // ================================================================ 6 셈포알라의 밤 (베라크루스)
  function cempOpen() { var b = st(); return !!(b && !b.cemp && cityNow() === VERACRUZ && open(K.cempFrom, K.cempTo)); }
  async function cemp() {
    var b = st(), s = S(); b.cemp = 1; b.met = 1;
    await play([
      [null, '베라크루스 앞바다에 배 열여덟 척. 해안 마을 셈포알라의 신전 꼭대기에 쿠바 총독의 깃발이 걸려 있다. 판필로 데 나르바에스가 구백 명을 데리고 코르테스를 잡으러 왔다.'],
      ['narvaez', b.vel ? '총독께 소식을 보낸 그 제독이로군! 덕분에 내가 왔소. 반역자 코르테스는 고작 이백여 명을 데리고 산에서 내려오고 있다더군.' : '바다에서 온 제독이로군. 나는 총독의 명을 받은 판필로 데 나르바에스요. 반역자 코르테스를 잡으러 왔소.']
    ]);
    if (b.side === 'aztec') {
      await play([
        [null, '밤이 깊자 빗속에서 함성이 울렸다. 산에서 내려온 코르테스의 무리가 셈포알라를 덮쳤다. 나르바에스는 신전 꼭대기에서 창에 한쪽 눈을 잃고 사로잡혔다.'],
        ['cuauhtemoc', '(나중에 온 전령의 그림 편지) 하얀 자들끼리 서로 죽인다니 좋다. 그러나 이긴 자가 진 자의 병사를 다 얻었다. 저들은 더 많아져서 돌아온다.']
      ]);
      lockSide(b); log('셈포알라에서 코르테스가 밤에 나르바에스의 토벌대를 덮쳐 사로잡는 것을 보았다.'); return;
    }
    var opts = [];
    if (b.side === 'cortes') opts.push({ label: '코르테스의 밤습에 함께한다', value: 'cortes' });
    else {
      opts.push({ label: '나르바에스의 편에서 셈포알라를 지킨다', value: 'narvaez' });
      opts.push({ label: '산에서 내려오는 코르테스에게 간다 — 정복자의 편에 선다', value: 'cortes' });
    }
    opts.push({ label: '어느 편에도 서지 않고 배로 물러난다', value: 'no' });
    var v = await UI.ask('셈포알라, 1520년 5월 — 에스파냐 사람끼리의 싸움', opts, me());
    if (v === 'cortes') {
      b.side = 'cortes';
      await play([
        ['cortes', '왔구려! 나르바에스는 사람은 많지만 머리가 없소. 오늘 밤 비가 오면 저들의 화승총은 불이 붙지 않을 거요. 우리는 창으로 신전을 오른다.'],
        ['cortes', '제독, 그대는 저들의 대포를 맡아 주시오. 대포만 잠재우면 나머지는 금화 몇 닢에 내 편이 될 거요.']
      ]);
      var res = await fight('나르바에스의 토벌대', 90, { kind: 'garrison', leader: '판필로 데 나르바에스', guns: true });
      b.cemp = res === 'win' ? 'won' : 'fought';
      await play([[null, '빗속에서 신전의 계단을 오른 코르테스의 사람들이 나르바에스를 사로잡았다. 그는 창에 한쪽 눈을 잃었다. 아침이 되자 토벌대의 병사들은 금 이야기에 넘어가 거의 다 코르테스의 편이 되었다.']]);
      if (res === 'win') { s.player.gold += K.raidGold; var bt = G.Fame.add('bt', 150); log('셈포알라의 밤습에서 나르바에스의 대포를 잠재웠다. 토벌대가 코르테스의 편이 되었다. (금화 +' + U.num(K.raidGold) + ' · 전투 명성 +' + bt + ')'); }
      else log('셈포알라의 밤습에 함께했다. 나르바에스가 사로잡혔다.');
    } else if (v === 'narvaez') {
      await play([['narvaez', '좋소! 총독께서 그대의 이름을 기억하실 거요. 그대 사람들은 바닷가 쪽 진지를 맡아 주시오.']]);
      var r2 = await fight('코르테스의 밤습대', 70, { kind: 'garrison', leader: '곤살로 데 산도발' });
      b.cemp = 'narvaez';
      await play([[null, r2 === 'win' ? '제독의 진지는 무너지지 않았다. 그러나 신전 꼭대기에서 나르바에스가 창에 눈을 잃고 사로잡혔다는 외침이 들려왔다. 아침이 되자 그의 병사들은 앞다투어 코르테스에게 갔다.' : '어둠 속에서 창을 든 무리가 쏟아져 들어왔다. 신전 꼭대기에서 나르바에스가 사로잡혔다. 아침이 되자 그의 병사들은 앞다투어 코르테스에게 갔다.']]);
      trust(['es_cuba'], 10); if (r2 === 'win') G.Fame.add('bt', 80);
      log('셈포알라에서 쿠바 총독의 토벌대 편에 서서 코르테스의 밤습을 막았다. 그러나 나르바에스는 사로잡혔다.');
    } else { b.cemp = 'no'; log('셈포알라에서 코르테스와 나르바에스의 싸움을 피해 배로 물러났다.'); }
    lockSide(b);
    refresh();
  }

  // ================================================================ 7 대신전의 학살 · 황제의 죽음 (테노치티틀란)
  function massOpen() { var b = st(); return !!(b && !b.mass && cityNow() === TENOCH && open(K.massFrom, K.massTo)); }
  async function mass() {
    var b = st(), s = S(); b.met = 1;
    await withPic('aztec_toxcatl', '톡스카틀 축제 (1520.5)', function () { return play([
      [null, '대신전의 뜰. 톡스카틀 축제 — 깃털과 꽃으로 꾸민 귀족과 전사 수백 명이 북소리에 맞춰 춤을 춘다. 출입구마다 에스파냐 병사들이 서 있다.'],
      ['alvarado', '(칼자루에 손을 얹고) 코르테스 대장이 나르바에스를 잡으러 가 있는 동안 내가 이 도시를 맡았소. 저들이 축제가 끝나면 우리를 덮칠 거라는 말이 있소. …먼저 치는 수밖에.']
    ]); });
    var opts;
    if (b.side === 'cortes') opts = [
      { label: '「멈추라! 칼을 거두게 하라」 — 알바라도를 막아선다', value: 'stop' },
      { label: '알바라도의 병사들과 함께 귀족들의 금붙이를 거둔다', value: 'join' },
      { label: '눈을 돌린다', value: 'watch' }];
    else if (b.side === 'aztec') opts = [
      { label: '춤추는 귀족들을 지키러 뛰어든다', value: 'fight' },
      { label: '살아남은 사람들을 몰래 빼내 숨긴다', value: 'hide' }];
    else opts = [
      { label: '다친 사람들을 배 쪽으로 옮겨 숨긴다', value: 'help' },
      { label: '도시를 떠난다', value: 'leave' }];
    var v = await UI.ask('대신전의 뜰 — 북소리가 그치기 전에', opts, me());
    b.mass = v || 'watch';
    if (v === 'stop') {
      await play([
        ['P', '멈추라! 저들은 맨손으로 춤추고 있다!'],
        ['alvarado', '(비웃으며) 장사꾼 제독이 군인에게 명령을 하시오? …흥, 그대 사람들은 빼 주지.'],
        [null, '알바라도는 멈추지 않았다. 그러나 제독의 사람들은 출입구 하나를 열어 두었고, 그리로 수십 명이 빠져나갔다.'],
        ['marina', hasMate('marina') ? '(떨리는 목소리로) …보았습니다. 제독은 멈추라고 하셨습니다. 저는 그것을 잊지 않겠습니다.' : null]
      ]);
      G.Fame.add('so', 100);
      log('톡스카틀 축제에서 알바라도의 학살을 막아서려 했다. 출입구 하나를 열어 수십 명을 살렸다.');
    } else if (v === 'join') {
      await play([[null, '북소리가 비명으로 바뀌었다. 칼이 춤추는 사람들의 팔과 머리를 베었다. 병사들은 쓰러진 귀족들의 금 팔찌와 귀걸이를 떼어 냈다.']]);
      s.player.gold += K.massGold; notoriety(K.notoMass, '대신전의 학살에 함께했다');
      log('톡스카틀 축제에서 알바라도의 병사들과 함께 귀족들의 금붙이를 거두었다. (금화 +' + U.num(K.massGold) + ')');
    } else if (v === 'fight') {
      var res = await fight('알바라도의 병사들', 50, { kind: 'garrison', leader: '페드로 데 알바라도', guns: true });
      b.massRes = res;
      await play([
        [null, res === 'win' ? '제독의 사람들이 뜰의 한쪽을 막아서자 알바라도의 병사들이 궁으로 물러났다. 그래도 뜰 바닥은 피로 미끄러웠다.' : '알바라도의 병사들이 쏜 화승총 연기 속에서 제독의 사람들도 쓰러졌다. 그래도 몇몇 귀족이 그 틈에 빠져나갔다.'],
        ['cuauhtemoc', '…보았다. 바다의 사람이 우리를 위해 피를 흘렸다. 이제 이 도시는 저들을 가두고, 저들을 굶길 것이다.'],
        ['yaocihuatl', '북쪽 출입구는 내가 지킨다. 살아 있는 사람들을 운하로 보내라. 오늘의 피는 잊지 않되, 더 흘리지는 마라.']
      ]);
      b.cuauh = (b.cuauh || 0) + 1; G.Fame.add('so', 80); if (res === 'win') G.Fame.add('bt', 100);
      log('톡스카틀 축제에서 귀족들을 지키러 알바라도의 병사들과 싸웠다.');
    } else if (v === 'hide' || v === 'help') {
      await play([[null, '제독의 사람들은 신전 뒤 운하에 카누를 대고, 피투성이가 된 사람들을 하나둘 실어 날랐다. 그날 밤 도시의 모든 북이 다시 울렸다 — 이번에는 싸움의 북이었다.']]);
      if (v === 'hide') b.cuauh = (b.cuauh || 0) + 1;
      G.Fame.add('so', 80);
      log('톡스카틀 축제의 학살에서 다친 사람들을 카누로 실어 숨겼다.');
    } else log(v === 'leave' ? '톡스카틀 축제의 학살을 보고 테노치티틀란을 떠났다.' : '톡스카틀 축제의 학살에서 눈을 돌렸다.');
    if (v === 'leave') { refresh(); return; }
    // 황제의 마지막 부탁
    await withPic('aztec_moctezuma', '목테수마의 마지막 부탁 (1520.6)', function () { return play([
      [null, '도시는 한 달 가까이 에스파냐 사람들의 궁을 에워싸고 있다. 코르테스가 나르바에스의 병사들을 이끌고 돌아왔지만, 들어오자마자 함께 갇혔다.'],
      ['moctezuma', '(지친 얼굴로 제독을 부른다) 내일 나는 지붕에 올라 백성을 달래라는 말을 들었다. 그들은 이제 내 말을 듣지 않는다. 내 아우 쿠이틀라우아크를 새 황제로 세웠다고 한다.'],
      ['moctezuma', '바다의 사람. 나는 그대에게 두 가지 가운데 하나를 부탁할 수 있다. 내 보물방의 마지막 것들, 아니면 — 내 아이들.']
    ]); });
    var w = await UI.ask('목테수마의 마지막 부탁', [
      { label: '보물방의 마지막 것들을 맡는다', value: 'treasure' },
      { label: '황제의 아이들을 지키겠다고 약속한다', value: 'children' }], H('moctezuma'));
    b.wish = w || 'children';
    if (b.wish === 'treasure') {
      s.player.gold += K.wishGold;
      keepsake('moctezuma_mask', '목테수마의 청록 가면', '작은 청록 조각을 모자이크로 붙여 만든 가면. 목테수마가 갇힌 궁에서 마지막으로 제독에게 맡긴 보물이다.');
      log('목테수마가 보물방의 마지막 것들을 맡겼다 — 청록 가면과 금화 ' + U.num(K.wishGold) + '닢어치 금붙이.');
    } else {
      keepsake('tecuichpo_jade', '테크이치포 공주의 옥 목걸이', '목테수마의 딸 테크이치포(뒷날 도냐 이사벨)가 건넨 옥 구슬 목걸이. 황제는 제독에게 아이들의 목숨을 부탁했다.');
      G.Fame.add('so', 150);
      log('목테수마가 아이들을 부탁했다. 테크이치포 공주가 옥 목걸이를 건넸다.');
    }
    await play([[null, '이튿날 황제는 지붕에 올랐다. 돌과 화살이 날아왔다. 사흘 뒤, 목테수마는 숨을 거두었다.']]);
    log('아즈텍 황제 목테수마 2세가 세상을 떠났다.');
    b.told.moct = 1;
    // 머무르면 슬픈 밤까지
    var left = daysTo(K.nocheFrom);
    if (b.side !== 'none' && left > 0 && left <= 45) {
      var stay = await UI.ask('도시가 에스파냐 사람들의 궁을 에워싸고 있다. 슬픈 밤까지 ' + left + '일.', [
        { label: '도시에 머문다 (' + left + '일)', value: 1 }, { label: '이 도시를 떠난다', value: 0 }], me());
      if (stay) { await wait(left); if (nocheOpen()) await noche(); }
    } else if (!left || left <= 0) { if (nocheOpen()) await noche(); }
    refresh();
  }

  // ================================================================ 8 슬픈 밤 · 9 오툰바
  function nocheOpen() { var b = st(); return !!(b && !b.noche && cityNow() === TENOCH && open(K.nocheFrom, K.nocheTo)); }
  async function noche() {
    var b = st(), s = S(); b.met = 1;
    await withPic('aztec_noche_triste', '슬픈 밤 (1520.6.30)', function () { return play([
      [null, '6월 30일, 비 내리는 밤. 에스파냐 사람들이 궁을 몰래 빠져나와 서쪽 틀라코판 둑길로 향한다. 끊긴 다리 자리에 놓을 나무 다리를 짊어지고.'],
      [null, '둑길의 네 번째 다리에서 물을 길던 여인이 소리쳤다. 「메시카여! 저들이 달아난다!」 대신전의 큰 북이 울리고, 호수가 순식간에 카누로 뒤덮였다.']
    ]); });
    if (b.side === 'cortes') {
      await play([['cortes', '보물방의 금괴는 다 가져갈 수 없소. 왕의 몫 오분의 일만 챙기고 나머지는 원하는 자가 지고 가라 했소. …제독, 그대는 어떻게 하겠소?']]);
      var c = await UI.ask('슬픈 밤 — 둑길 앞', [
        { label: '금괴를 지고 간다 (빠져나오면 금화 ' + U.num(K.carryGold) + '닢 — 더 오래 버텨야 한다)', value: 'carry' },
        { label: '몸만 빠져나간다', value: 'light' }], me());
      var carry = c === 'carry';
      var res = await fight('둑길의 메시카 전사들', 170, { kind: 'native', leader: '쿠이틀라우아크', hold: carry ? 6 : 4, winText: '둑길 끝까지 빠져나왔다!' });
      b.noche = res === 'win' ? (carry ? 'carry' : 'light') : 'lost';
      if (res === 'win') {
        if (carry) s.player.gold += K.carryGold;
        G.Fame.add('bt', 150);
        await play([[null, carry ? '금괴를 진 채 둑길 끝에 닿았다. 뒤를 돌아보니 금을 너무 많이 진 병사들이 호수에 빠져 떠오르지 않았다.' : '맨몸으로 둑길 끝에 닿았다. 뒤에서 금을 진 병사들이 하나둘 호수로 가라앉았다.'],
          ['bernal', '(나무 아래에 주저앉아 우는 코르테스를 보며) 대장이 운다. 우리 가운데 절반이 돌아오지 못했다.']]);
        log('슬픈 밤 — 테노치티틀란에서 둑길로 빠져나왔다.' + (carry ? ' 금괴를 지고 나와 금화 ' + U.num(K.carryGold) + '닢어치를 건졌다.' : ''));
      } else {
        await play([[null, '둑길이 끊긴 자리에서 제독의 사람들이 호수로 떨어졌다. 짐을 버리고 겨우 기어 나왔다.']]);
        log('슬픈 밤 — 둑길에서 많은 사람을 잃고 겨우 빠져나왔다.');
      }
      await otumba(true);
    } else if (b.side === 'aztec') {
      await play([
        ['cuauhtemoc', '바다의 사람! 둑길의 끊긴 다리를 지켜라. 저들은 금을 지고 있어 느리다. 한 사람도 호수를 건너게 하지 마라!'],
        ['yaocihuatl', '카누는 양쪽 갈대밭으로 돌렸다. 나는 둑길 앞을 막겠다. 화승이 번쩍이면 엎드리고, 다시 일어나라!']
      ]);
      var r2 = await fight('둑길로 달아나는 에스파냐 군', 90, { kind: 'garrison', leader: '페드로 데 알바라도', guns: true });
      b.noche = r2 === 'win' ? 'held' : 'broken';
      if (r2 === 'win') { s.player.gold += 1500; G.Fame.add('bt', 180); }
      b.cuauh = (b.cuauh || 0) + 1;
      await play([
        [null, r2 === 'win' ? '제독의 사람들이 지키던 다리에서 에스파냐 사람들이 무너졌다. 금발의 알바라도가 창대를 짚고 끊긴 다리를 훌쩍 뛰어넘어 달아났다 — 사람들은 그 자리를 「알바라도의 도약」이라 부를 것이다.' : '에스파냐 사람들은 쓰러진 동료와 짐을 밟고 끊긴 다리를 건넜다. 그래도 절반이 돌아가지 못했다.'],
        ['cuauhtemoc', '저들은 달아났다. 그러나 다시 올 것이다. 나는 이 도시를 버리지 않는다.']
      ]);
      log('슬픈 밤 — 아즈텍 편에서 둑길의 다리를 지켰다.' + (r2 === 'win' ? ' 호수에서 건진 금괴로 금화 1,500닢을 얻었다.' : ''));
    } else {
      b.noche = 'fled';
      await play([[null, '제독은 비명이 들려오는 둑길을 등지고 남쪽 둑길로 도시를 빠져나갔다. 그날 밤 호수는 붉었다고 한다.']]);
      log('슬픈 밤 — 싸움을 피해 테노치티틀란을 빠져나왔다.');
    }
    refresh();
  }
  function otumbaOpen() { var b = st(); return !!(b && !b.otumba && cityNow() === TLAX && open(K.otumbaFrom, K.otumbaTo)); }
  async function otumba(chained) {
    var b = st(), s = S(); b.met = 1;
    if (b.side === 'cortes') {
      if (chained) {
        await withPic('aztec_otumba', '오툰바 (1520.7.7)', function () { return play([
          [null, '엿새 뒤, 틀락스칼라로 가는 길의 오툰바 들판. 언덕을 넘자 하얀 솜 갑옷의 대군이 들판을 가득 메우고 있다. 쫓기던 무리는 다친 사람이 반이다.'],
          ['cortes', '저 가운데 깃발을 등에 진 장수가 보이오? 저들은 대장의 깃발이 쓰러지면 싸움을 멈추오. 저것만 노리시오!']
        ]); });
        var res = await fight('오툰바의 메시카 대군', 180, { kind: 'native', leader: '깃발을 진 대장 (시우아코아틀)' });
        b.otumba = res;
        if (res === 'win') { G.Fame.add('bt', 200); await play([[null, '깃발이 쓰러지자 들판의 대군이 물결처럼 흩어졌다. 남은 무리는 틀락스칼라에 닿았다. 동맹은 지켜졌다.']]); log('오툰바 들판에서 깃발을 진 대장을 쓰러뜨려 포위를 뚫었다.'); }
        else { await play([[null, '코르테스가 말을 몰아 깃발을 진 대장을 쓰러뜨렸다. 대군이 흩어지고, 남은 무리는 겨우 틀락스칼라에 닿았다.']]); log('오툰바 들판의 싸움에서 밀렸지만, 코르테스가 적 대장을 쓰러뜨려 살아남았다.'); }
      } else {
        b.otumba = 'heard';
        await play([['cortes', '(붕대를 감은 손으로) 제독, 슬픈 밤에는 어디 있었소. 우리는 오툰바에서 죽을 뻔했소. …틀락스칼라가 등을 돌리지 않았으니 아직 끝나지 않았소. 내년 봄, 호수로 돌아갈 거요.']]);
        log('틀락스칼라에서 슬픈 밤과 오툰바에서 살아 돌아온 코르테스를 만났다.');
      }
    } else {
      b.otumba = 'heard';
      await play([['xicotencatl', '하얀 자들이 살아 돌아왔다. 우리 우두머리들은 메시카의 사자를 돌려보내고 그들을 다시 받아들였다. …나는 이 결정을 끝내 따르지 않을 것이다.']]);
      log('틀락스칼라에서 살아 돌아온 코르테스의 무리를 보았다.');
    }
    refresh();
  }

  // ================================================================ 10 천연두
  function poxOpen() { var b = st(), c = cityNow(); return !!(b && !b.pox && b.met && (c === TENOCH || c === TLAX || c === VERACRUZ) && open(K.poxFrom, K.poxTo)); }
  async function pox() {
    var b = st(), s = S(), med = R.skill('med') || 0; b.pox = 1;
    await play([
      [null, '집집마다 거적에 덮인 사람들이 누워 있다. 얼굴과 몸에 고름 물집이 돋았고, 살갗이 벗겨진 사람도 있다. 돌봐 줄 사람마저 앓아누워 굶어 죽는 집도 많다.'],
      ['marina', hasMate('marina') ? '이 병은… 수염 난 사람들은 잘 걸리지 않는데, 우리는 걸리면 열에 서넛이 죽습니다. 신들이 우리를 버리셨다고들 합니다.' : null]
    ]);
    var opts = [{ label: '배의 의원과 약재로 앓는 사람들을 돌본다' + (med ? ' (의학 ' + med + ')' : ''), value: 'help' }, { label: '선원들을 배로 물리고 거리를 피한다', value: 'avoid' }];
    var v = await UI.ask('천연두가 번진 거리', opts, me());
    var k = v === 'help' ? K.poxK * (1 - Math.min(0.75, med * 0.25)) : K.poxK * 0.3;
    var lost = Math.min(Math.max(0, s.fleet.crew - R.crewMin()), Math.round(s.fleet.crew * k));
    s.fleet.crew -= lost;
    if (v === 'help') { var so = G.Fame.add('so', 80 + med * 30); log('천연두가 번진 거리에서 앓는 사람들을 돌보았다. 선원 ' + lost + '명이 병을 얻어 배를 떠났다. (사교 명성 +' + so + ')'); await play([[null, '죽어 가는 사람들은 막을 수 없었다. 그래도 물과 죽을 받은 아이들 가운데 몇몇은 살아남았다.']]); }
    else log('천연두가 번진 거리를 피해 선원들을 배로 물렸다.' + (lost ? ' 그래도 ' + lost + '명이 병을 얻었다.' : ''));
    if (lost) UI.toast('선원 ' + lost + '명이 천연두를 앓아 배를 떠났다.', 'skull', 4800);
    refresh();
  }

  // ================================================================ 11 호수의 포위 (큰 해전)
  function lakeOpen() {
    var b = st(), c = cityNow(); if (!b || b.lake || !open(K.lakeFrom, K.lakeTo)) return false;
    if (b.side === 'cortes') return c === TLAX || c === VERACRUZ;
    if (b.side === 'aztec') return c === TENOCH;
    return false;
  }
  var LAKE_CENTER = { lon: -94.6, lat: 22.4 };   // 해전 장면은 막힘 없는 물 위에서 (호수를 넓게 그린 셈 — npc.lake)
  function lakeSpec() {
    var b = st(), cortes = b.side === 'cortes', here = cityNow();
    var brig = ['라 카피타나', '산티아고', '산 페드로', '산 후안', '라 콘셉시온', '산 미겔', '산타 마리아', '산 안드레스', '라 트리니다드', '산 크리스토발', '산 루카스', '산 마테오', '라 비토리아'];
    var canoe = ['독수리 카누', '재규어 카누', '테스카틀리포카의 카누', '우이칠로포치틀리의 카누', '틀라텔롤코 카누', '이스타팔라파 카누', '코요아칸 카누', '소치밀코 카누', '틀라코판 카누', '찰코 카누', '믹스코악 카누', '아스카포찰코 카누', '쿨우아칸 카누', '테페약 카누', '텍스코코 카누', '마지막 카누'];
    function shipsOf(type, n) { var a = []; for (var i = 0; i < n; i++) a.push(type); return a; }
    var spec = cortes ? {
      id: 'aztec_lake', foe: '메시카', ships: shipsOf('korakora', 14), names: canoe.slice(0, 14), foeLabel: '메시카의 카누 선단',
      allies: brig.slice(4, 12).map(function (n) { return { type: 'pinnace', name: n, gun: 'saker' }; }),
      myFleet: brig.slice(0, 4).map(function (n) { return { type: 'pinnace', name: n, gun: 'saker' }; }),
      gun: 'perrier', gunK: 0.5, crewK: 1.0, gunNote: '카누 선단은 대포 대신 화살과 투석으로 덤빈다 — 배에 바짝 붙으면 백병전이 된다. 브리건틴의 포로 다가오기 전에 흩어 놓으시오.',
      who: { hist: 'cortes' },
      intro: '제독, 브리건틴 열세 척이 호수에 떴소. 오늘 둑길을 끊으러 나가오. 그대에게 네 척을 맡기겠소 — 내 사람들보다 그대가 배를 더 잘 아니까. 저 카누 떼를 흩으면 도시는 굶어 무너질 거요.',
      ask: '호수의 큰 싸움 — 브리건틴 네 척을 맡아 함께 싸우겠는가?',
      decline: '…그대의 사정도 있겠지. 우리끼리 호수를 끊겠소.',
      win: { fame: 280, gold: 2500, text: '텍스코코 호수에서 메시카의 카누 선단을 흩었다. 둑길이 끊기고 테노치티틀란이 고립되었다.' },
      lose: '호수의 싸움에서 브리건틴이 카누 떼에 둘러싸였다. 간신히 물러났다.'
    } : {
      id: 'aztec_lake', foe: '에스파냐', ships: shipsOf('pinnace', 9), names: brig.slice(0, 9), foeLabel: '코르테스의 브리건틴',
      allies: canoe.slice(5, 15).map(function (n) { return { type: 'korakora', name: n, gun: 'perrier' }; }),
      myFleet: canoe.slice(0, 5).map(function (n) { return { type: 'korakora', name: n, gun: 'perrier' }; }),
      gun: 'saker', gunK: 0.7, crewK: 0.75, gunNote: '브리건틴은 멀리서 포를 쏜다 — 카누는 빠르고 날래다. 포를 다시 재기 전에 파고들어 배에 오르시오 (B: 백병전).',
      who: { hist: 'cuauhtemoc' },
      intro: '바다의 사람. 수염 난 자들이 산에서 배를 지고 와 호수에 띄웠다. 저 떠다니는 집들이 둑길을 끊고 우리 카누를 부수고 있다. 네가 카누 다섯 척을 이끌어라. 저 대장의 배만 가라앉히면 나머지는 흩어진다.',
      ask: '호수의 큰 싸움 — 카누 선단을 이끌고 브리건틴과 싸우겠는가?',
      decline: '…알았다. 우리끼리 싸운다. 호수는 우리 것이다.',
      win: { fame: 320, so: 120, text: '텍스코코 호수에서 코르테스의 기함 브리건틴을 무찔렀다. 그러나 둑길의 포위는 풀리지 않았다.' },
      lose: '호수의 싸움에서 카누 선단이 브리건틴의 포에 흩어졌다.'
    };
    spec.center = LAKE_CENTER; spec.lake = true; spec.backCity = here; spec.noPrize = true; spec.place = '텍스코코 호수';
    spec.onWin = function () { var x = st(); if (x) x.lake = 'won'; };
    spec.onLose = function () { var x = st(); if (x && x.lake !== 'won') x.lake = 'lost'; };
    return spec;
  }
  AZ.lakeSpec = lakeSpec;
  async function lake() {
    var b = st(); b.met = 1;
    if (!G.Rel || !G.Rel.greatBattle) { b.lake = 'none'; return; }
    await withPic('aztec_lake', '호수의 포위 (1521)', function () { return play([
      [null, b.side === 'cortes' ? '텍스코코 호숫가. 틀락스칼라 사람 팔천 명이 산 너머에서 조각조각 지어 나른 배를 이어 붙였다. 돛대 둘에 노를 단 브리건틴 열세 척이 호수에 내려진다.' : '테노치티틀란의 운하마다 카누가 빽빽하다. 둑길 너머 호수 위에 하얀 돛을 단 떠다니는 집들이 보인다. 물을 대던 차풀테펙 수도관은 이미 끊겼다.'],
      ['yaocihuatl', b.side === 'aztec' ? '식수는 모자라도 노를 젓는 팔은 남았다. 전사들을 카누마다 나누었다. 저 떠다니는 집 사이로 들어가 돛과 노를 끊겠다.' : null]
    ]); });
    var spec = lakeSpec();
    G.Rel.register(spec);
    var go = await G.Rel.greatBattle(spec);
    if (!go) b.lake = 'declined';
    else if (!b.lake) b.lake = 'fighting';
  }

  // ================================================================ 12 독수리가 내려앉다 · 결말
  function endOpen() {
    var b = st(); if (!b || b.end || today() < K.fall || !cityNow()) return false;
    if (b.side === 'cortes' || b.side === 'aztec') return true;
    return b.side === 'none' && !!b.met && (cityNow() === VERACRUZ || cityNow() === MEXICO || cityNow() === TENOCH || cityNow() === HAVANA || cityNow() === SANTIAGO);
  }
  async function ending() {
    var b = st(), s = S(); b.end = b.side; b.endDay = U.dayIndex(s.date);   // endDay: 포카혼타스가 같은 입항에 연달아 뜨지 않게 (js/systems/pocahontas.js)
    if (b.lake === 'fighting') b.lake = 'lost';
    await withPic('aztec_fall', '독수리가 내려앉다 (1521.8.13)', function () { return play([
      [null, '1521년 8월 13일, 틀라텔롤코. 일흔닷새의 포위 끝에 마지막 구역이 무너졌다. 굶주린 사람들이 무너진 집 사이를 헤맨다. 시장이 있던 자리에 시체가 쌓였다.'],
      [null, '호수를 빠져나가려던 카누 한 척이 브리건틴에 붙잡혔다. 그 안에 젊은 황제 쿠아우테목이 있었다.'],
      ['bernal', '그날 밤 하늘에서 벼락과 비가 그치지 않았다. 사람들은 호수의 도시가 끝났다고 말했다.']
    ]); });
    if (b.side === 'cortes') return endCortes(b, s);
    if (b.side === 'aztec') return endAztec(b, s);
    return endNone(b, s);
  }
  async function endCortes(b, s) {
    await play([['cortes', '(쿠아우테목을 앞에 두고) 제독, 그대가 없었으면 이 날은 오지 않았을 거요. 이제 무너진 도시의 금을 나눌 차례요. 그런데 병사들이 금이 너무 적다고 웅성거리오. 황제가 금을 숨겼다며 그의 발을 불에 지지자는 자들도 있소.']]);
    var v = await UI.ask('틀라텔롤코의 마지막 날 — 금을 나누는 자리', [
      { label: '「멈추라」 — 포로를 괴롭히지 말라고 한다 (몫은 절반, 악명은 오르지 않는다)', value: 'stop' },
      { label: '정해진 몫을 챙긴다 (금화 ' + U.num(K.shareGold) + '닢)', value: 'take' }], me());
    var gold = v === 'stop' ? Math.round(K.shareGold / 2) : K.shareGold;
    s.player.gold += gold;
    if (v !== 'stop') notoriety(K.notoEnd, '정복자의 몫을 나누어 가졌다');
    var up = null;
    if (b.lake === 'won') up = titleStep(1);
    trust(['es_crown', 'es_cuba', 'es_newspain'], 10);
    var bt = G.Fame.add('bt', 300);
    var lines = [['cortes', up ? '카를로스 폐하께 그대의 이름을 올렸소. 호수에서 카누 떼를 흩은 사람이라고. 폐하께서 작위를 내리셨소 — ' + (G.Court ? G.Court.fullName(up, true) : up.ko) + '.' : '그대의 이름을 폐하께 올리겠소. 호수에서 함께 싸웠다면 작위도 받았을 텐데.']];
    if (hasMate('marina')) {
      if (b.mass === 'stop' || v === 'stop') lines.push(['marina', '…제독은 두 번 「멈추라」고 하셨습니다. 저는 제독의 배에 남겠습니다. 이 땅의 말을 아는 사람이 하나쯤은 정복자 곁에 있어야지요.']);
      else { lines.push(['marina', '제독, 저는 대신전의 뜰을 보았습니다. 오늘 이 자리도 보았습니다. …저는 여기서 내리겠습니다. 제 어머니의 말을 하는 사람들 곁에 남겠습니다.']); }
    }
    await play(lines);
    if (hasMate('marina') && !(b.mass === 'stop' || v === 'stop')) { leaveMate('marina'); b.marina = 'left'; UI.toast('말린체가 배를 떠났다.', 'boot', 4800); }
    log('테노치티틀란이 무너졌다. 정복자의 편으로 끝까지 싸워 금화 ' + U.num(gold) + '닢의 몫을 받았다.' + (up ? ' 에스파냐 국왕이 작위를 내렸다 — ' + (G.Court ? G.Court.fullName(up, true) : up.ko) + '.' : '') + ' (전투 명성 +' + bt + ')');
    UI.toast('아즈텍 제국의 멸망 — 정복자의 편' + (up ? ' · ' + up.ko : '') + ' · 금화 +' + U.num(gold), 'crown', 6500);
    refresh();
  }
  async function endAztec(b, s) {
    var saved = b.lake === 'won';
    if (saved) {
      await withPic('aztec_escape', '마지막 밤의 카누 (1521.8.13)', function () { return play([
        [null, '…그러나 그 카누에 탄 사람은 황제의 옷을 입은 다른 전사였다. 그 시각, 제독의 배에서 내린 작은 배 한 척이 비구름 아래 호수의 갈대 사이를 빠져나가고 있었다.'],
        ['yaocihuatl', '(갈대 사이에서 마지막 카누를 밀어내며) 황제를 데려가라. 나는 남은 사람들을 남쪽 물길로 이끌겠다. 메시카의 이야기가 둘로 갈라져야 하나라도 살아남는다.'],
        ['cuauhtemoc', '나는 독수리다. 내려앉았지만 죽지는 않았다. 바다의 사람, 너의 배에 나를 태워 다오. 메시카의 이름을 바다 건너까지 가지고 가겠다.'],
        ['bernal', '(훗날의 기록) 사로잡힌 쿠아우테목은 몇 해 뒤 남쪽 원정 길에서 목이 매달렸다. …그런데 그를 끝까지 지켜본 이들은 그 사람이 정말 쿠아우테목이었는지 끝내 말하지 않았다.']
      ]); });
      joinMate('h_cuauhtemoc', 80); b.cuauh = 'saved';
      var m = G.MATE && G.MATE.h_cuauhtemoc; if (m && m.y && m.y[1] < 1560) m.y = [m.y[0], 1560];
    } else {
      await play([['cuauhtemoc', '(포로가 되어 코르테스 앞에서, 그의 허리의 칼을 가리키며) 나는 내 도시를 위해 할 수 있는 일을 다 했다. 그 칼로 나를 죽여라. …바다의 사람, 너는 끝까지 우리 곁에 있었다. 그것으로 됐다.']]);
      b.cuauh = 'captured';
    }
    // 에스파냐의 노여움
    var down = s.player.nation === 'ES' ? titleStep(-1) : null;
    trust(['es_crown', 'es_cuba', 'es_newspain'], -25);
    b.ban = K.banTo;
    var lines = [['cortes', '(편지로) 제독, 그대는 폐하의 적과 한편이 되었소. 누에바 에스파냐의 항구 — 베라크루스와 멕시코 — 에는 앞으로 몇 해 동안 그대의 배를 들이지 않을 것이오.' + (down ? ' 폐하께서 그대의 작위 한 칸을 거두셨소.' : '')]];
    if (hasMate('marina')) lines.push(['marina', '제독, 여기서 헤어지겠습니다. 저는 코르테스의 편도, 메시카의 편도 아니었습니다. 두 말 사이에 서 있었을 뿐이지요. …이제 그 다리를 거두어야겠습니다.']);
    await play(lines);
    if (hasMate('marina')) { leaveMate('marina'); b.marina = 'left'; }
    var so = G.Fame.add('so', 250);
    log('테노치티틀란이 무너졌다. 끝까지 아즈텍의 편에 섰다.' + (saved ? ' 쿠아우테목을 배에 태워 호수를 빠져나갔다.' : ' 쿠아우테목이 사로잡혔다.') + ' 에스파냐가 베라크루스·멕시코의 입항을 1525년까지 막았다.' + (down ? ' 에스파냐 작위가 한 칸 깎였다.' : '') + ' (사교 명성 +' + so + ')');
    UI.toast('아즈텍 제국의 멸망 — 황제의 편' + (saved ? ' · 쿠아우테목이 동료로' : ''), 'crown', 6500);
    refresh();
  }
  async function endNone(b, s) {
    await play([
      [null, '베라크루스 부두. 정복이 끝나자 무기와 말을 팔러 왔던 배들이 이번에는 금과 노예를 싣고 떠난다.'],
      [null, '부두 구석에서 그을린 노인 하나가 낡은 천 보따리를 안고 있다. 무너진 도시의 「틀라쿠일로」 — 그림으로 글을 쓰던 사람이다.'],
      [null, '(손짓과 몇 마디 말로) 수도사들이 그림책을 모아 불태운다. 이것은 내 손자가 신전에서 빼낸 마지막 것이다. 바다 건너, 불이 닿지 않는 곳으로 가져가 다오.']
    ]);
    var v = await UI.ask('그림 문서를 맡겠는가?', [{ label: '배에 싣는다', value: 1 }, { label: '정중히 사양한다', value: 0 }], me());
    if (v) {
      keepsake('aztec_codex', '메시카의 그림 문서', '사슴 가죽을 병풍처럼 접어 그림 글자로 메시카의 달력과 신들, 공물의 목록을 적은 책. 수도사들의 불을 피해 살아남은 몇 안 되는 것 가운데 하나다.');
      var so = G.Fame.add('so', 150);
      log('베라크루스에서 틀라쿠일로 노인에게서 메시카의 그림 문서를 받아 배에 실었다. (사교 명성 +' + so + ')');
    } else log('테노치티틀란이 무너졌다. 끝까지 어느 편에도 서지 않았다.');
    refresh();
  }

  // ================================================================ 입항 금지 (황제의 편 결말) — js/scenes/city.js C.entryCheck
  var BAN_CITIES = [VERACRUZ, MEXICO, TENOCH];
  AZ.banned = function (c) { var s = S(), b = s && s.aztec; return !!(b && b.ban && c && BAN_CITIES.indexOf(c.id) >= 0 && today() < b.ban); };
  function wrapEntry() {
    var C = G.Scenes && G.Scenes.city; if (!C || !C.entryCheck || C._aztecWrap) return; C._aztecWrap = true;
    var ec = C.entryCheck;
    C.entryCheck = function (c) {
      var r = ec.apply(this, arguments); if (r) return r;
      if (AZ.banned(c)) return { reason: 'aztecban', text: '코르테스 총사령관의 명이다. 메시카와 한편이 되었던 제독의 배는 누에바 에스파냐의 항구에 들일 수 없다!', bribe: 3000 + (c.size || 1) * 800 };
      return null;
    };
  }
  // 말린체·아길라르는 술집에 나오지 않는다 — 사건으로만 합류 (js/systems/frontier.js F.mateReady)
  function wrapMates() {
    var F = G.Frontier; if (!F || !F.mateReady || F._aztecWrap) return; F._aztecWrap = true;
    var mr = F.mateReady;
    F.mateReady = function (m) { if (m && (m.id === 'marina' || m.id === 'aguilar')) return false; return mr.apply(this, arguments); };
  }
  // 바다에서 코르테스의 함대와 이야기할 때 (js/systems/seafolk.js SF.talk)
  function wrapSea() {
    var SF = G.SeaFolk; if (!SF || !SF.talk || SF._aztecWrap) return; SF._aztecWrap = true;
    var tk = SF.talk;
    SF.talk = async function (n) {
      var r = await tk.apply(this, arguments);
      if (seaOpen(n)) { try { await sea(); } catch (e) { console.error(e); } }
      return r;
    };
  }
  wrapEntry(); wrapMates(); wrapSea();
  AZ.init = function () { wrapEntry(); wrapMates(); wrapSea(); };

  // ================================================================ 도시에 들어설 때 · 수첩
  AZ.pending = function () {
    var s = S(); if (!s || !cityNow()) return false;
    AZ.init();
    return rumorOpen() || vcOpen() || tlaxOpen() || audOpen() || cempOpen() || massOpen() || nocheOpen() || otumbaOpen() || poxOpen() || lakeOpen() || endOpen();
  };
  AZ.check = async function () {
    if (AZ._busy) return false; AZ._busy = true;
    AZ.evDay = U.dayIndex(S().date);   // 오늘 아즈텍 장면이 떴다 — 같은 입항의 포카혼타스는 다음으로 (QA 2026-10-23)
    try {
      if (endOpen()) await ending();
      else if (rumorOpen()) await rumor();
      else if (vcOpen()) await vc();
      else if (cempOpen()) await cemp();
      else if (tlaxOpen()) await tlax();
      else if (nocheOpen()) await noche();
      else if (massOpen()) await mass();
      else if (audOpen()) await aud();
      else if (otumbaOpen()) await otumba(false);
      else if (lakeOpen()) await lake();
      else if (poxOpen()) await pox();
    } catch (e) { console.error(e); }
    AZ._busy = false;
    return true;
  };
  AZ.html = function () {
    var s = S(), b = s && s.aztec; if (!b || !b.side || b.side === 'none' || b.end) return '';
    var t = today(), li = [];
    if (b.side === 'cortes') {
      if (!b.tlax && t <= K.tlaxTo) li.push('1519년 9~10월 투라스칼라 — 틀락스칼라의 들판');
      if (!b.cemp && t <= K.cempTo) li.push('1520년 5월 베라크루스 — 셈포알라의 나르바에스');
      if (!b.mass && t <= K.massTo) li.push('1520년 5월 말~6월 테노치티틀란 — 대신전과 황제');
      if (!b.lake && t <= K.lakeTo) li.push('1521년 5~8월 투라스칼라·베라크루스 — 호수의 브리건틴');
    } else {
      if (!b.mass && t <= K.massTo) li.push('1520년 5월 말~6월 테노치티틀란 — 톡스카틀 축제');
      if (!b.noche && t <= K.nocheTo) li.push('1520년 6월 30일 테노치티틀란 — 둑길');
      if (!b.lake && t <= K.lakeTo) li.push('1521년 5~8월 테노치티틀란 — 호수의 카누 선단');
    }
    if (t >= K.fall) li.push('호수의 도시가 무너졌다 — 아무 도시에나 들르면 이야기가 끝난다');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">호수 위의 도시 — ' + sideName(b.side) + '</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._aztecHtml) { G.Court._aztecHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + AZ.html(); }; }
  AZ._t = { rumor: rumor, sea: sea, vc: vc, tlax: tlax, aud: aud, cemp: cemp, mass: mass, noche: noche, otumba: otumba, pox: pox, lake: lake, ending: ending, joinMate: joinMate, titleStep: titleStep };
  AZ._open = { rumor: rumorOpen, sea: seaOpen, vc: vcOpen, tlax: tlaxOpen, aud: audOpen, cemp: cempOpen, mass: massOpen, noche: nocheOpen, otumba: otumbaOpen, pox: poxOpen, lake: lakeOpen, end: endOpen };
})(window.G = window.G || {});
