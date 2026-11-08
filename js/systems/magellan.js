/* 마가야네스(마젤란)의 세계 일주 (G.Magellan) 2026-11-08 사용자 요청
   「마젤란의 세계 일주 이벤트를 만들어줘. 중간 중간에 만나면 이벤트가 발생하는 형태로 구성해줘.
     마젤란의 사망 직전에 도와주는 이벤트를 수행하면 마젤란을 부하로 둘 수 있어.」
   사람·동료·소지품·조정값: js/data/magellan.js (G.BALANCE.magellan).
   역사는 바뀌지 않는다 — 반란은 진압되고, 해협을 지나고, 큰 바다에서 굶주리고, 4월 27일 막탄의 여울에서 사령관은 쓰러진다.
   바뀌는 것은 하나: 제독이 그의 믿음을 얻었고 그 새벽 여울 바깥에 보트를 대어 두었다면, 쓰러진 그를 건져 낸다. 함대와 세상은 그가 죽은 줄 안다.
   날짜: 1582년 이전 유럽 쪽 기록의 날짜는 다른 사건들처럼 흔히 쓰는 날짜(율리우스력) — 출항 1519.9.20 · 반란 1520.4.1~2 · 막탄 1521.4.27
   ■ 만나는 곳 — 함대는 바다 위에서 날짜대로 항로를 간다 (js/systems/seafolk.js G.EXPEDITIONS 'magellan' — 해협을 나올 때까지 지도에 보인다)
     그 함대 곁(meetR도 안)에서 하루가 끝나면, 또는 신호를 보내 「선장과 이야기한다」를 고르면 그 구간의 장면이 열린다. 구간마다 한 번.
     해협 너머 큰 바다(1520.11.28~1521.4.27)의 자리는 이 파일의 PAC 항로가 정한다 (지도에는 보이지 않는다)
     ① 세빌리아의 다섯 척 (1518.3.22~1519.9.19, 세빌리아 · 8.10부터는 카디스 — 산루카르): 팔레이루·카르타헤나 · 출자(invest) · 포르투갈 상관장 알바르스의 금화
     ② 대서양 (1519.9.26~12.12): 바르보자의 편지(포르투갈 함대·선장들의 음모) / 무풍대의 목마름 · 카르타헤나 체포 — 물·식량을 나눈다
     ③ 라플라타 (1520.1.10~2.3): 「해협이냐 강이냐」 — 물맛을 보여 준다
     ④ 산훌리안의 부활절 (1520.3.31~4.7): 케사다·멘도사·카르타헤나의 반란 — (가) 빅토리아호 갑판에 오른다(육상전) (나) 사면을 청한다(웅변) (다) 반란자 편(그 뒤로 적) (라) 지나간다
     ⑤ 산훌리안의 겨울 (1520.4.8~8.24): 산티아고호 난파 · 줄어든 배급 — 식량을 나눈다
     ⑥ 모든 성인의 해협 (1520.10.21~11.28): 산안토니오호의 탈주 — 서쪽 물길을 정찰한다 / 사라진 배를 찾는다
     ⑦ 큰 바다의 굶주림 (1520.12.1~1521.3.5): 쥐·소가죽·톱밥 — 식량·물을 건넨다
     ⑧ 도둑의 섬 (1521.3.6~3.15, 괌): 차모로 사람들과 사라진 보트 — 식량을 사서 건넨다 / 보트를 찾으러 상륙한다
     ⑨ 세부 앞바다 (1521.3.16~4.25): 리마사와의 첫 미사 · 수그부의 십자가 → 4.26 밤 → ⑩
     ⑩ 막탄의 새벽 (1521.4.27): (가) 함께 상륙한다 (나) 「사령관을 살린다」 — 믿음 need 이상이면 열린다(여울 바깥에 보트, 퇴로를 지키는 싸움)
        (다) 배에서 지켜본다. (나)에서 이기면 쓰러진 그를 물속에서 끌어내 배에 숨긴다 → 동료 mg_magellan · 「마가야네스의 아스트롤라베」
        향료제도·막탄(js/systems/spicemactan.js)의 길(테르나테·브루나이 → 세부)로 왔으면 그 막탄 장면에 (나)가 함께 나온다 (MG.saveOpt · MG.rescue)
   ■ 믿음: 장면에서 얻은 것 + 세랑의 편지를 전했으면 1 + 말라카의 다리에서 함께 싸웠으면 1. 반란자 편에 서거나 그의 함대를 쳐부쉈으면 적.
   ■ 소식: 바야돌리드 협약(1518.3.22) · 산훌리안의 반란(1520.4.7) · 산티아고호(5.22) · 평화의 바다(11.28) · 도둑의 섬(1521.3.9) · 리마사와의 미사(3.31) ·
          산안토니오호의 귀환(5.6) · 빅토리아호(1522.9.8 — 출자했거나 그를 건졌을 때만: 몫·그의 한마디)   (출항 1519.9·귀환 1522.9 한 줄은 js/data/people.js)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/mg_*.webp — 개발노트의 그림 주문
   ■ 저장: s.magellan = { trust, seen: {열쇠: 고른 것}, invest, spy, foe, mutiny, rescue: 'saved'|'fail'|'none', mactan, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var MG = G.Magellan = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.magellan) || {}; }
  var SEVILLE = 7, CADIZ = 8, CEBU = [123.95, 10.3];
  var D = MG.D = { cap: 15180322, sevTo: 15190919, sanlucar: 15190810 };
  // 바다의 구간 — from·to (날짜) · 어디서 (함대 곁 / 세부 앞바다)
  var LEGS = MG.LEGS = [
    { key: 'atl', from: 15190926, to: 15191212 },
    { key: 'plata', from: 15200110, to: 15200203 },
    { key: 'mutiny', from: 15200331, to: 15200407 },
    { key: 'winter', from: 15200408, to: 15200824 },
    { key: 'strait', from: 15201021, to: 15201128 },
    { key: 'pac', from: 15201201, to: 15210305 },
    { key: 'guam', from: 15210306, to: 15210315 },
    { key: 'cebu', from: 15210316, to: 15210425, cebu: true }
  ];
  var NEWS_AT = { cap: 15180322, mutiny: 15200407, santiago: 15200522, pacific: 15201128, ladrones: 15210309, limasawa: 15210331, gomes: 15210506, victoria: 15220908 };
  MG.NEWS_AT = NEWS_AT;
  // 해협 너머 — 큰 바다를 건너는 자리 [위도, 경도, 날짜]
  var PAC = MG.PAC = [[-52.7, -74.6, '1520-11-28'], [-38.0, -77.0, '1520-12-16'], [-16.2, -138.6, '1521-01-24'], [-10.8, -151.0, '1521-02-04'], [0.0, -172.0, '1521-02-13'],
    [13.4, 144.7, '1521-03-06'], [13.4, 144.7, '1521-03-09'], [10.7, 125.8, '1521-03-16'], [9.93, 125.07, '1521-03-28'], [9.93, 125.07, '1521-04-04'], [10.3, 123.95, '1521-04-07'], [10.3, 123.95, '1521-04-27']];

  function st() {
    var s = S(); if (!s) return null;
    if (!s.magellan) {
      s.magellan = { told: {}, trust: 0, seen: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.magellan.told[k] = 1; });   // 옛 저장 — 지난 소식은 띄우지 않는다
    }
    var b = s.magellan; if (!b.told) b.told = {}; if (!b.seen) b.seen = {}; if (b.trust == null) b.trust = 0;
    return b;
  }
  MG.state = st;
  function today() { return U.dateNum(S().date); }
  function dnOf(str) { var a = str.split('-'); return U.dayIndex({ y: +a[0], m: +a[1], d: +a[2] }); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: (G.HIST_FIG && G.HIST_FIG[id] && G.HIST_FIG[id].name) || id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  var WHO = { P: me, F: first, MM: function (e) { return mateSp('mg_magellan', e); }, EN: function (e) { return mateSp('h_enrique', e); } };
  var CREW = { name: '함대의 선원', lang: 0 }, MUT = { name: '반란 선원', lang: 0 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w && WHO[w] ? WHO[w](l[2]) : w ? H(w) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }
  function fame(kind, key) { var n = (K().fame || {})[key] || 0; return n && G.Fame ? G.Fame.add(kind, n) : 0; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  function foe(k) { return (K().foe || {})[k] || 12; }
  function sup(k) { return (K().supply || {})[k] || 20; }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  async function passTo(day) {
    var n = U.dayIndex({ y: Math.floor(day / 10000), m: Math.floor(day / 100) % 100, d: day % 100 }) - U.dayIndex(S().date);
    if (!(n > 0)) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  function sm() { var s = S(); return (s && s.spiceMactan) || null; }
  function goaMal() { var s = S(); return (s && s.goaMal) || {}; }
  function withMag() { var g = goaMal(); return g.side === 'pt' || g.mal === 'pt'; }
  function letterGiven() { var b = sm(); return !!(b && b.letter === 'given'); }
  function ex() { return (G.EXPEDITIONS || []).filter(function (e) { return e.id === 'magellan'; })[0] || null; }
  /** 함대를 쳐부쉈는가 (seafolk — 한 해 늦어진다) */
  function beaten() { var s = S(), e = ex(); return !!(s && e && G.SeaFolk && (G.SeaFolk.delay(e) > 0 || s.flags['expBeat_magellan_0'])); }

  /** 믿음 — 장면에서 얻은 것 + 세랑의 편지 + 말라카의 다리 */
  MG.trust = function () {
    var b = st(); if (!b) return 0;
    if (b.foe || beaten()) return -99;
    return (b.trust || 0) + (letterGiven() ? 1 : 0) + (withMag() ? 1 : 0);
  };
  function addTrust(n) { var b = st(); b.trust = (b.trust || 0) + n; }
  MG.need = function () { return K().need || 3; };

  /** 그 날 함대의 자리 {lon, lat} — 해협까지는 seafolk 항로, 그 너머는 PAC */
  MG.fleetPos = function (dayIdx) {
    var e = ex(), t = dayIdx != null ? dayIdx : U.dayIndex(S().date);
    if (e && G.SeaFolk && G.SeaFolk.posAt && t < dnOf(PAC[0][2])) { var p = G.SeaFolk.posAt(e, t); return p ? { lon: p.lon, lat: p.lat } : null; }
    if (t < dnOf(PAC[0][2]) || t > dnOf(PAC[PAC.length - 1][2])) return null;
    for (var i = 0; i < PAC.length - 1; i++) {
      var a = PAC[i], c = PAC[i + 1], ta = dnOf(a[2]), tb = dnOf(c[2]);
      if (t <= tb) {
        var f = tb > ta ? (t - ta) / (tb - ta) : 1;
        var dl = G.Geo && G.Geo.wrapLon ? G.Geo.wrapLon(c[1] - a[1]) : (((c[1] - a[1]) + 540) % 360) - 180;
        var lon = a[1] + dl * f; lon = ((lon + 540) % 360) - 180;
        return { lat: a[0] + (c[0] - a[0]) * f, lon: lon };
      }
    }
    return null;
  };
  function dist(a, b) { if (G.Geo && G.Geo.dist) return G.Geo.dist(a.lon, a.lat, b.lon, b.lat); var dx = ((b.lon - a.lon + 540) % 360) - 180, dy = b.lat - a.lat; return Math.sqrt(dx * dx + dy * dy); }
  /** 지금 열려 있는 바다의 구간 (here: 자리를 따지지 않는다 — 신호를 주고받는 때) */
  function legOpen(here) {
    var b = st(), s = S(); if (!b || b.foe || beaten() || b.rescue) return null;
    var t = today();
    for (var i = 0; i < LEGS.length; i++) {
      var L = LEGS[i]; if (b.seen[L.key] || t < L.from || t > L.to) continue;
      if (L.cebu) {
        var smb = sm(); if (smb && smb.cebu) continue;          // 향료제도·막탄의 길로 세부에 갔다
        if (here) return L;
        var l = s.loc; if (!l || l.mode !== 'sea' || l.lon == null) continue;
        if (dist(l, { lon: CEBU[0], lat: CEBU[1] }) <= (K().cebuR || 2.2)) return L;
        continue;
      }
      if (here) return L;
      var l2 = s.loc; if (!l2 || l2.mode !== 'sea' || l2.lon == null) continue;
      var p = MG.fleetPos(); if (p && dist(l2, p) <= (K().meetR || 4.5)) return L;
    }
    return null;
  }
  MG._legOpen = legOpen;

  // ================================================================ 소식
  MG.daily = function () {
    var b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, s = S();
    function news(k, icon, text) { if (!told[k] && t >= NEWS_AT[k]) { told[k] = 1; if (text) out.push({ icon: icon, history: true, text: text }); } }
    news('cap', 'scroll', '【바야돌리드 협약】 3월 22일, 카를로스 왕이 포르투갈에서 건너온 항해가 페르난도 데 마가야네스와 천문학자 루이 팔레이루에게 서쪽으로 돌아 향료제도에 닿는 항해를 맡겼다. 다섯 척을 내주고, 찾은 땅의 스무 몫 가운데 한 몫을 약조했다. 리스본의 마누엘 왕은 몹시 노했다고 한다.');
    news('mutiny', 'skull', '【산훌리안의 반란】 남쪽 바다의 얼어붙은 만에서 겨울을 나던 마가야네스의 함대에서 부활절 밤에 선장들이 들고일어났다. 사령관은 빅토리아호를 되찾고 만 어귀를 막아 반란을 꺾었다. 멘도사 선장은 갑판에서 죽고, 케사다 선장은 목이 베였다. 감찰관 카르타헤나는 떠나는 날 바닷가에 버려질 것이라 한다.' +
      (b.mutiny === 'fight' ? ' 빅토리아호에 오른 사람들 가운데 낯선 남만 선원들이 있었다고 한다.' : b.mutiny === 'plead' ? ' 마흔 명 남짓한 반란 선원들은 목숨을 건졌다. 누군가 사령관 앞에서 그들을 위해 말했다고 한다.' : b.mutiny === 'rebel' ? ' 반란자들의 배에 기름과 화약을 대 준 남만 배가 있었다는 말이 돈다.' : ''));
    news('santiago', 'ship', '【산티아고호를 잃다】 마가야네스가 남쪽으로 먼저 보낸 산티아고호가 산타크루스 강 어귀에서 폭풍에 부서졌다. 선원들은 바위 해안을 따라 몇 주를 걸어 산훌리안으로 돌아왔다고 한다. 이제 남은 배는 넷이다.');
    news('pacific', 'ship', '【평화의 바다】 신대륙 남쪽 끝의 좁은 해협을 서른여드레 만에 빠져나온 마가야네스의 배 세 척이 끝없이 잔잔한 큰 바다에 들어섰다. 사령관은 그 바다를 「마르 파시피코」 — 평화의 바다라 불렀다. 산안토니오호는 해협 안에서 사라졌다.');
    news('ladrones', 'skull', '【도둑의 섬】 큰 바다를 석 달 넘게 건너 굶주림과 괴혈병에 쓰러져 가던 마가야네스의 함대가 마침내 섬에 닿았다. 섬사람들이 배의 보트를 가져가자 사령관은 마을에 불을 질렀다. 선원들은 그곳을 「도둑의 섬」이라 부른다.' + (b.seen.guam === 'buy' ? ' 그 전에 남만 배 한 척이 섬사람들에게서 야자와 생선을 사다 함대에 건넸다.' : ''));
    news('limasawa', 'cross', '【리마사와의 첫 미사】 동쪽 바다의 섬들에 닿은 마가야네스의 함대가 리마사와 섬에서 부활절 미사를 올렸다. 말라카 사람 통역 엔리케의 말을 섬의 라자가 알아들었다고 한다. 동쪽으로 떠난 사람이 서쪽으로 돌아 제 고향 말이 통하는 곳에 닿은 것이다.');
    news('gomes', 'ship', '【산안토니오호의 귀환】 해협에서 사라졌던 산안토니오호가 세빌리아로 돌아왔다. 수로 안내인 이스테방 고메스는 사령관 마가야네스가 카스티야 선장들을 함부로 죽이고 가두었다고 고발했다. 사령관의 장인 디에고 바르보자가 옥에 갇히고, 그의 아내 베아트리스는 감시를 받는다고 한다.');
    if (!told.victoria && t >= NEWS_AT.victoria) {
      told.victoria = 1;
      var saved = b.rescue === 'saved', inv = b.invest > 0;
      if (saved || inv) {
        var txt = '【빅토리아호, 산루카르에】 세 해 전 다섯 척 이백예순 명으로 떠난 함대에서 빅토리아호 한 척과 열여덟 명만이 정향을 싣고 돌아왔다. 선장은 바스크 사람 엘카노. 그 정향 값만으로 원정에 든 돈을 갚고도 남는다고 한다.';
        if (inv) { var g = Math.round(b.invest * (K().shareK || 1.6)); s.player.gold += g; b.paid = g; txt += ' 그대의 출자 증서에도 몫이 나왔다 — 금화 ' + U.num(g) + '닢.'; if (R.removeItem) R.removeItem('mg_share'); }
        if (saved) txt += row('mg_magellan') ? ' 소식을 들은 마가야네스는 한참 말이 없다가 아스트롤라베를 쓰다듬었다. 「엘카노… 그 바스크 사람이 해냈군. 잘됐소. 정말 잘됐소.」' : ' 엘카노는 황제 앞에서 사령관이 막탄에서 죽었다고 말했다.';
        out.push({ icon: 'ship', history: true, text: txt });
      }
    }
    return out;
  };

  // ================================================================ ① 세빌리아의 다섯 척 (1518.3.22~1519.9.19)
  function sevOpen() {
    var b = st(), t = today(), c = cityNow();
    if (!b || b.seen.seville || b.foe || t < D.cap || t > D.sevTo) return false;
    if (!(c === SEVILLE || (c === CADIZ && t >= D.sanlucar))) return false;
    if (G.SpiceMactan && G.SpiceMactan.pending && G.SpiceMactan.pending()) return false;   // 세랑의 편지를 먼저
    return true;
  }
  async function seville() {
    var b = st(), s = S(), k = K(), lt = letterGiven(), wm = withMag();
    await withPic('mg_seville', '세빌리아의 다섯 척 (1519)', function () { return play([
      [null, '과달키비르 강가, 무에예 데 라스 무엘라스. 낡은 배 다섯 척이 기울어진 채 뱃밥을 먹는다 — 트리니다드, 산안토니오, 콘셉시온, 빅토리아, 산티아고. 부두의 사람들이 「포르투갈 놈의 관짝」이라 수군댄다.'],
      ['mg_mag', lt ? '(밧줄 더미 너머에서 제독을 알아보고, 다리를 끌며 다가온다) 테르나테의 편지를 들고 왔던 분. 내가 정말로 카스티야의 길로 왔소. 이 다섯 척이 그 길이오.' : wm ? '(놀라며) 말라카의 다리에서 함께였던 분 아니오? 세상이 좁군. 나는 이제 카스티야 왕의 사람이오. 포르투갈은 나를 버렸소.' : '(해도를 말아 쥐고) 남만 배의 선장이군. 나는 페르난도 데 마가야네스. 카스티야 왕의 명으로 서쪽으로 돌아 향료제도에 가오. 신대륙 남쪽 어딘가에 서쪽 바다로 빠지는 물길이 있소.'],
      ['mg_faleiro', '(별표를 흔들며 끼어든다) 물길이 아니라 경도요, 경도! 내 셈으로는 향료제도는 카스티야 몫의 반구에 있소. 달과 별의 거리만 재면… 아니, 아니, 내 운세가 나쁘다고 나왔소. 나는 이번 배에 안 타오.'],
      ['mg_cartagena', '(깃털 모자를 고쳐 쓰며) 감찰관 후안 데 카르타헤나요. 이 원정에서 왕실의 눈은 나요. 포르투갈 사람이 카스티야의 배를 몬다니, 하느님이 웃으시겠소.'],
      ['mg_mag', '(카르타헤나가 멀어진 뒤, 낮게) 저 사람이 내 등 뒤를 맡소. 선원의 절반은 내 말을 모르고, 선장 셋은 나를 미워하오. 그래도 가오. 돈이 모자라 비스킷을 덜 실었소. 상인 아로 나리가 반을 댔지만.']
    ]); });
    var v = await UI.ask('마가야네스의 원정 — 무역관에서 출자를 받는다', [
      { label: '출자한다 (금화 ' + U.num(k.invest) + '닢 — 정향을 싣고 돌아오면 몫)', value: 'invest', icon: 'coin', dis: s.player.gold < k.invest },
      { label: '출자하지 않는다', value: 'no' }], me());
    if (v === 'invest' && s.player.gold >= k.invest) {
      s.player.gold -= k.invest; b.invest = k.invest; give('mg_share'); addTrust(1);
      await play([['mg_mag', '(증서에 서명하며) 고맙소. 비스킷 한 달 치요. 이 배들이 돌아오면 — 내가 돌아오지 못하더라도 — 그대의 몫은 무역관이 갚을 거요.']]);
      log('세빌리아 — 마가야네스의 원정에 금화 ' + U.num(k.invest) + '닢을 출자했다. 「빅토리아호의 출자 증서」.');
    }
    await play([
      [null, '그날 밤, 세빌리아의 여관. 검은 벨벳 옷깃의 사내가 제독의 탁자에 금화 자루를 내려놓는다.'],
      ['mg_alvares', '리스본의 마누엘 전하께서 걱정이 많으시오. 저 배신자가 어느 바다로 가는지, 어디서 물을 긷는지만 알려 주시오. 아니면 그를 설득해 고국으로 데려와도 좋소. 금화 ' + U.num(k.bribe) + '닢이오.']
    ]);
    var w = await UI.ask('포르투갈 상관장 알바르스의 금화', [
      { label: '「그 금화는 마가야네스에게 보여 주겠소」 — 그에게 알린다', value: 'warn', icon: 'shield' },
      { label: '금화를 받고 항로를 넘긴다', value: 'spy', icon: 'coin' },
      { label: '「나는 아무 편도 아니오」 — 자루를 밀어낸다', value: 'no' }], me());
    if (w === 'warn') {
      addTrust(1); b.spy = 'warn';
      await play([['mg_mag', '(금화 자루 이야기를 듣고 쓴웃음) 알바르스가 나를 찾아와 울며 돌아가자고 한 게 벌써 세 번이오. 이번엔 남의 손을 빌렸군. …고맙소. 나는 아프리카 해안에 붙어서 내려가겠소. 그들이 기다리는 바다를 비켜서.']]);
    } else if (w === 'spy') {
      s.player.gold += k.bribe; b.spy = 'pt'; addTrust(-2); s.player.notoriety = (s.player.notoriety || 0) + 3;
      await play([['mg_alvares', '(웃지 않는 눈으로) 현명하시오. 리스본은 은혜를 잊지 않소.']]);
      log('세빌리아 — 포르투갈 상관장 알바르스에게 금화 ' + U.num(k.bribe) + '닢을 받고 마가야네스의 항로를 넘겼다. 그는 언젠가 알게 될 것이다. (믿음 −2 · 악명 +3)');
    } else b.spy = 'no';
    b.seen.seville = v === 'invest' ? 'invest' : 'met';
    var f = fame('so', 'seville');
    log('세빌리아 — 마가야네스의 다섯 척을 보았다. 1519년 9월 산루카르를 떠나 대서양으로 간다. 바다에서 함대를 만나면 다시 이야기할 수 있다. (사교 명성 +' + f + ')');
    UI.toast('마가야네스의 함대 — 바다에서 만나면', 'ship', 6000);
    refresh();
  }

  // ================================================================ 바다의 구간들
  function intro(key) {
    var tr = MG.trust(), b = st();
    var known = tr >= 1 || b.seen.seville;
    return known ? '(뱃전에서 제독의 깃발을 알아보고 손을 든다) 또 그대로군! 이 넓은 바다에서.' : '(망원경을 내리고) 남만의 깃발이로군. 카스티야 왕의 함대 사령관 마가야네스요. 가까이 오시오.';
  }
  async function leg_atl() {
    var b = st(), s = S(), t = today(), early = t <= 15191020, n = sup('atl');
    await withPic('mg_atlantic', early ? '테네리페의 편지 (1519)' : '무풍대 (1519)', function () { return play(early ? [
      [null, '카나리아 제도 남쪽. 다섯 척이 돛을 반쯤 줄이고 있다. 기함 트리니다드호 고물의 등불이 낮에도 켜져 있다 — 「밤에는 이 불을 따르라」는 사령관의 명령이다.'],
      ['mg_mag', intro('atl')],
      ['mg_mag', '(목소리를 낮추고) 테네리페에서 장인의 편지를 받았소. 선장들이 바다에서 나를 죽이기로 했다고. 그리고 마누엘 왕이 카보베르데와 라플라타에 배를 보냈다고. …그래서 나는 아프리카 해안에 붙어서 가오. 카르타헤나는 길을 왜 묻지 않느냐며 길길이 뛰지.']
    ] : [
      [null, '적도 아래, 바람 한 점 없는 바다. 돛이 늘어지고, 송진이 녹아 갑판에 흐른다. 물통의 물은 초록빛이다. 스무 날째 이렇다.'],
      ['mg_mag', intro('atl')],
      ['mg_mag', '카르타헤나가 저녁마다 나를 「사령관」이 아니라 「선장」이라 불렀소. 어제 회의에서 내 앞에서 대들기에 그 자리에서 멱살을 잡았지. 지금은 메스키타의 배에 갇혀 있소. …선원들은 목이 마르오.'],
      [CREW, '(뱃전에서 소리친다) 남만 사람들! 물 한 통만! 비스킷에는 벌레가 슬었소!']
    ]); });
    var opts = [{ label: '물과 식량을 ' + n + '통씩 나눠 준다', value: 'give', icon: 'drop', dis: (s.fleet.food || 0) < n || (s.fleet.water || 0) < n }];
    if (early) opts.push({ label: '「카보베르데 앞바다에 포르투갈 배를 보았소」 — 본 것을 알려 준다', value: 'warn', icon: 'eye' });
    opts.push({ label: '인사만 하고 지나간다', value: 'pass' });
    var v = await UI.ask(early ? '마가야네스의 함대 — 카나리아 남쪽' : '마가야네스의 함대 — 적도의 무풍대', opts, me());
    if (v === 'give' && s.fleet.food >= n && s.fleet.water >= n) {
      s.fleet.food -= n; s.fleet.water -= n; addTrust(1);
      await play([['mg_mag', '(물통이 넘어가는 것을 보며) 이 바다에서 남의 배가 물을 건네는 일은 없소. 기억하겠소. 피가페타, 이 일을 적어 두게.'], ['mg_piga', '(공책을 펴며) 적었습니다, 사령관. 「남만의 배가 물 ' + n + '통을 주었다」.']]);
    } else if (v === 'warn') {
      addTrust(1);
      await play([['mg_mag', '(해도에 손가락을 짚으며) 역시. 그럼 더 동쪽으로 붙겠소. 시에라리온 앞바다까지. 카르타헤나는 더 길길이 뛰겠군. 고맙소.']]);
    }
    b.seen.atl = v; refresh();
    if (v !== 'pass') { var f = fame('ex', 'atl'); log('대서양 — 마가야네스의 함대를 만나 ' + (v === 'give' ? '물과 식량을 나눴다' : '포르투갈 배를 본 것을 알렸다') + '. (믿음 ' + MG.trust() + ' · 탐험 명성 +' + f + ')'); }
  }
  async function leg_plata() {
    var b = st();
    await withPic('mg_plata', '해협이냐 강이냐 (1520)', function () { return play([
      [null, '흙탕물 바다. 수평선 끝까지 누런 물이 펼쳐지고, 바다 냄새가 엷다. 마가야네스의 배들이 서쪽으로 뱃머리를 돌려 이 물이 어디로 이어지는지 재고 있다.'],
      ['mg_mag', intro('plata')],
      ['mg_mag', '솔리스가 4년 전 이 물을 「민물의 바다」라 했소. 그리고 저 해안에서 잡아먹혔지. 나는 이 물이 서쪽 바다로 빠지는 해협이길 바라오. 벌써 보트를 두 번이나 보냈소.']
    ]); });
    var v = await UI.ask('라플라타 — 마가야네스가 이 물길을 해협이라 믿고 싶어 한다', [
      { label: '두레박으로 물을 떠 맛을 보여 준다 — 「강이오, 사령관」', value: 'tell', icon: 'drop' },
      { label: '말하지 않고 지나간다', value: 'pass' }], me());
    if (v === 'tell') {
      addTrust(1);
      await play([['mg_mag', '(물을 한 모금 머금었다 뱉는다. 오래 말이 없다) …달군. 강이오. (해도의 남쪽을 손바닥으로 덮으며) 그럼 더 남쪽이오. 얼음이 얼 때까지라도. 보트를 거두라!'], ['mg_cartagena', '(멀리서) 들었소? 포르투갈 놈의 해협은 강이었소!']]);
      var f = fame('ex', 'plata'); log('라플라타 — 마가야네스에게 그 물이 강이라는 것을 보였다. 그는 더 남쪽으로 간다. (믿음 ' + MG.trust() + ' · 탐험 명성 +' + f + ')');
    }
    b.seen.plata = v; refresh();
  }
  async function leg_mutiny() {
    var b = st(), s = S(), k = K();
    await withPic('mg_mutiny', '산훌리안의 부활절 (1520)', function () { return play([
      [null, '남위 49도, 산훌리안 만. 잿빛 바다에 살얼음이 낀다. 부활절 밤 — 만 안의 배 다섯 척 가운데 셋에서 등불이 꺼졌다. 산안토니오호 갑판에서 비명이 한 번 들렸다.'],
      ['mg_mag', '(트리니다드호 고물, 망토 깃을 세우고) 왔군. 이 밤에. …케사다와 멘도사가 산안토니오호를 빼앗고 내 사촌 메스키타를 묶었소. 카르타헤나를 풀어 주었고. 항해장 엘로리아가가 칼에 찔렸소. 그들은 「왕의 명령대로 하라」고 편지를 보냈지.'],
      ['mg_quesada', '(산안토니오호 뱃전에서 횃불을 들고 외친다) 우리는 반역자가 아니다! 포르투갈 사람이 왕의 배를 얼음 바다에 처박는 것을 막을 뿐이다! 남만의 배여, 우리 편에 서라. 감찰관 나리께서 몫을 약조하신다!'],
      ['mg_espinosa', '(사령관 곁에서 단검을 매만지며) 사령관, 편지를 빅토리아호의 멘도사에게 가져가겠습니다. 다섯 사람이면 됩니다. 아니, 여섯이면 더 좋겠군요.'],
      ['mg_elcano', '(콘셉시온호 뱃전, 반란자들 사이에서 머뭇거리며) …나는 항해장일 뿐이오. 배만 몰았소.']
    ]); });
    var sp = skill('speech'), pChance = U.clamp(0.35 + sp * 0.18, 0.2, 0.95);
    var v = await UI.ask('산훌리안 — 반란의 밤', [
      { label: '에스피노사와 함께 빅토리아호 갑판에 오른다', value: 'fight', icon: 'sword' },
      { label: '「배를 되찾은 뒤 따른 선원들은 살려 주시오」 — 사면을 청한다 (약 ' + Math.round(pChance * 100) + '%)', value: 'plead', icon: 'handshake' },
      { label: '반란자들 편에 선다 (금화 ' + U.num(k.rebelGold) + '닢 — 그 뒤로 마가야네스의 적)', value: 'rebel', icon: 'coin' },
      { label: '끼지 않는다', value: 'pass' }], me());
    b.mutiny = v;
    if (v === 'fight') {
      var r = await fight('빅토리아호 갑판의 반란 선원', foe('mutiny'), { leader: '루이스 데 멘도사' });
      b.mutinyRes = r; addTrust(r === 'win' ? 2 : 1);
      await play([
        [null, r === 'win' ? '편지를 읽던 멘도사의 목에 에스피노사의 단검이 박혔다. 제독의 선원들이 뱃전을 넘어 갑판을 쓸었다. 빅토리아호에 사령관의 깃발이 올랐다.' : '갑판은 아수라장이 되었다. 제독의 선원들이 밀려났지만, 그 틈에 에스피노사의 단검이 멘도사를 찾았다. 빅토리아호에 사령관의 깃발이 올랐다.'],
        ['mg_mag', '(빅토리아호를 만 어귀에 가로질러 세우게 하고) 이제 그들은 나갈 수 없소. 그대가 오늘 밤 내 등 뒤에 있었소. 세빌리아의 감찰관이 아니라 그대가.']
      ]);
    } else if (v === 'plead') {
      var ok = U.chance(pChance); b.mutinyRes = ok ? 'win' : 'lose';
      await play([
        [null, '반란은 새벽에 꺾였다. 빅토리아호에서 멘도사가 죽고, 산안토니오호는 대포 몇 발에 무너졌다. 사슬에 묶인 마흔여 명이 눈밭에 무릎을 꿇었다. 그 가운데 엘카노도 있다.'],
        ['P', '사령관, 선장들의 일은 사령관의 법대로 하시오. 그러나 저 선원들은 명령을 따랐을 뿐이오. 저들이 없으면 누가 돛을 올리겠소?'],
        ok ? ['mg_mag', '(오래 제독을 본다) …옳은 말이오. 사람이 모자라오. 케사다는 목을 베고, 카르타헤나는 떠나는 날 이 바닷가에 두고 가겠소. 나머지는 사슬을 차고 펌프를 돌리게 하겠소. 살려 두오.'] : ['mg_mag', '(고개를 젓는다) 오늘은 그 말을 들을 수 없소. 본보기가 필요하오. …그래도 그대가 말한 것은 잊지 않겠소.']
      ]);
      if (ok) addTrust(1);
    } else if (v === 'rebel') {
      b.foe = true; s.player.gold += k.rebelGold; s.player.notoriety = (s.player.notoriety || 0) + 5;
      await play([
        ['mg_cartagena', '(산안토니오호에서 금화 자루를 내려보내며) 현명한 선택이오. 저 포르투갈 놈이 무너지면 그대 배도 카스티야의 친구가 될 거요.'],
        [null, '새벽, 반란은 꺾였다. 만 어귀를 가로막은 빅토리아호 너머로, 트리니다드호 고물에서 마가야네스가 제독의 배를 오래 바라보았다.'],
        ['mg_mag', '(바람에 실려 온 목소리) 남만의 선장! 다시는 내 함대에 다가오지 마시오!']
      ]);
      log('산훌리안 — 반란자들 편에 섰다. 금화 ' + U.num(k.rebelGold) + '닢. 반란은 꺾였고, 마가야네스는 이제 제독을 적으로 안다. (악명 +5)');
    }
    b.seen.mutiny = v;
    if (v === 'fight' || v === 'plead') { var f = fame(v === 'fight' ? 'bt' : 'so', 'mutiny'); log('산훌리안의 부활절 — ' + (v === 'fight' ? '빅토리아호 갑판에 올라 반란을 꺾는 데 힘을 보탰다' : '반란 선원들의 사면을 청했다') + '. (믿음 ' + MG.trust() + ' · 명성 +' + f + ')'); }
    refresh();
  }
  async function leg_winter() {
    var b = st(), s = S(), n = sup('winter');
    await withPic('mg_winter', '산훌리안의 겨울 (1520)', function () { return play([
      [null, '산훌리안 만의 겨울. 해안에 거인처럼 큰 사람들이 나타나 춤을 추고, 선원들은 그들을 「파타곤」 — 큰 발이라 부른다. 바닷가 교수대에는 아직 케사다의 몸이 걸려 있다.'],
      ['mg_mag', intro('winter')],
      ['mg_mag', '남쪽으로 정찰을 보낸 산티아고호가 산타크루스 강 어귀에서 부서졌소. 선원들은 바위를 타고 걸어서 돌아왔지. 배급을 반으로 줄였소. 선원들이 「남쪽엔 아무것도 없다, 돌아가자」고 하오. 나는 돌아가지 않소.']
    ]); });
    var v = await UI.ask('산훌리안의 겨울 — 줄어든 배급', [
      { label: '식량 ' + n + '통을 내려 준다', value: 'give', icon: 'bread', dis: (s.fleet.food || 0) < n },
      { label: '인사만 하고 지나간다', value: 'pass' }], me());
    if (v === 'give' && s.fleet.food >= n) {
      s.fleet.food -= n; addTrust(1);
      await play([['mg_mag', '(선원들이 비스킷 통을 굴려 가는 소리를 들으며) 봄까지 버틸 수 있겠소. 해협을 찾으면 그 이름 한쪽은 그대 몫이오.']]);
      var f = fame('ex', 'winter'); log('산훌리안의 겨울 — 마가야네스의 함대에 식량 ' + n + '통을 내렸다. (믿음 ' + MG.trust() + ' · 탐험 명성 +' + f + ')');
    }
    b.seen.winter = v; refresh();
  }
  async function leg_strait() {
    var b = st(), sv = skill('survey') + skill('nav');
    await withPic('mg_strait', '모든 성인의 해협 (1520)', function () { return play([
      [null, '남위 52도. 「처녀들의 곶」을 돌자 바다가 서쪽으로 갈라진다. 밤이면 남쪽 해안에 원주민의 불이 수없이 켜진다. 사령관은 그 땅을 「불의 땅」이라 부른다.'],
      ['mg_mag', intro('strait')],
      ['mg_mag', '물이 짜오. 밀물과 썰물이 있소. 이건 강이 아니오. …그런데 산안토니오호가 사라졌소. 고메스가 메스키타를 묶고 배를 돌렸다는 말이 있소. 비스킷의 절반이 그 배에 있었소.'],
      ['mg_mag', '(갈라진 물길들을 가리키며) 서쪽으로 빠지는 길이 어느 것인지 모르오. 보트로 재려면 엿새가 걸리오.']
    ]); });
    var v = await UI.ask('해협 — 갈라진 물길과 사라진 배', [
      { label: '보트를 내려 서쪽 물길을 함께 정찰한다' + (sv >= 3 ? ' (측량·항해 솜씨로 더 빨리)' : ''), value: 'scout', icon: 'compass' },
      { label: '사라진 산안토니오호를 찾아 동쪽 물길을 뒤진다', value: 'search', icon: 'telescope' },
      { label: '인사만 하고 지나간다', value: 'pass' }], me());
    if (v === 'scout') {
      addTrust(1);
      await play([
        [null, '사흘째 저녁, 앞서 간 보트에서 총소리가 울렸다. 바위 곶 너머로 끝이 보이지 않는 바다가 열렸다.'],
        ['mg_mag', '(뱃머리에서, 오래 그 바다를 본다. 굳은 입이 떨린다) …「바라던 곶」이오. 저 너머가 남쪽 바다요. (얼굴을 돌린다) 늙은 뱃사람이 울면 흉이오. 보지 마시오.'],
        ['mg_piga', '(공책에) 「사령관은 기뻐서 울었다.」 이렇게 적겠습니다.']
      ]);
    } else if (v === 'search') {
      addTrust(1);
      await play([
        [null, '이틀을 뒤졌지만 산안토니오호는 없었다. 바위에 꽂힌 깃대 하나, 그 밑에 묻힌 편지만 남았다 — 사령관이 남겨 둔 것이다.'],
        ['mg_mag', '고메스는 세빌리아로 갔을 거요. 나를 고발하러. …그래도 찾아 준 것은 고맙소. 비스킷이 모자라도 서쪽으로 가겠소. 소가죽을 씹더라도.']
      ]);
    }
    if (v !== 'pass') { var f = fame('ex', 'strait'); log('모든 성인의 해협 — ' + (v === 'scout' ? '보트로 서쪽 물길을 함께 정찰했다. 그 끝에 남쪽 바다가 열렸다' : '사라진 산안토니오호를 찾아 물길을 뒤졌다') + '. (믿음 ' + MG.trust() + ' · 탐험 명성 +' + f + ')'); }
    b.seen.strait = v; refresh();
  }
  async function leg_pac() {
    var b = st(), s = S(), n = sup('pac'), h = sup('pacHalf');
    await withPic('mg_pacific', '큰 바다의 굶주림 (1521)', function () { return play([
      [null, '끝없는 잔잔한 바다. 세 척의 돛은 해어졌고, 갑판에 사람이 드물다. 잇몸이 부어 이를 덮은 선원이 줄에 매달려 있다. 고물에서 누가 쥐 한 마리를 금화 반 닢에 판다.'],
      ['mg_mag', intro('pac')],
      ['mg_mag', '(목소리가 갈라져 있다) 석 달이오. 비스킷은 벌레가 먹은 가루뿐이고, 물은 누렇게 썩었소. 돛대에 감은 소가죽을 바닷물에 나흘 불려 구워 먹소. 톱밥도 먹었소. 열아홉이 죽었소. 마흔이 앓소. …이 바다가 이렇게 클 줄 몰랐소.']
    ]); });
    var v = await UI.ask('큰 바다 한가운데 — 굶주린 함대', [
      { label: '식량·물 ' + n + '통씩 건넨다', value: 'give', icon: 'bread', dis: (s.fleet.food || 0) < n || (s.fleet.water || 0) < n },
      { label: '식량 ' + h + '통만 건넨다', value: 'half', icon: 'bread', dis: (s.fleet.food || 0) < h },
      { label: '우리도 모자라다 — 지나간다', value: 'pass' }], me());
    if (v === 'give' && s.fleet.food >= n && s.fleet.water >= n) { s.fleet.food -= n; s.fleet.water -= n; addTrust(2); }
    else if (v === 'half' && s.fleet.food >= h) { s.fleet.food -= h; addTrust(1); }
    else v = 'pass';
    if (v !== 'pass') {
      await play([
        [null, '보트가 비스킷 통과 물통을 싣고 오가자, 트리니다드호 갑판에서 누군가 쉰 목소리로 「살베 레지나」를 부르기 시작했다.'],
        ['mg_mag', '(제독의 손을 오래 잡는다) 이 바다 한가운데서 사람을 만날 줄은. …나는 그대에게 진 빚을 셈할 수가 없소. 셈할 수 없는 빚은 목숨으로 갚는 거라 하더군.']
      ]);
      var f = fame('ex', 'pac'); log('큰 바다 한가운데 — 굶주린 마가야네스의 함대에 ' + (v === 'give' ? '식량과 물을 ' + n + '통씩' : '식량 ' + h + '통을') + ' 건넸다. (믿음 ' + MG.trust() + ' · 탐험 명성 +' + f + ')');
    }
    b.seen.pac = v; refresh();
  }
  async function leg_guam() {
    var b = st(), s = S(), k = K();
    await withPic('mg_guam', '도둑의 섬 (1521)', function () { return play([
      [null, '석 달 만의 섬. 야자수와 흰 모래. 세모꼴 돛을 단 날렵한 프로아 배 수십 척이 새처럼 함대를 둘러싸고, 섬사람들이 뱃전을 넘어와 쇠붙이란 쇠붙이는 다 가져간다. 기함 뒤에 매단 보트도 사라졌다.'],
      ['mg_mag', intro('guam')],
      ['mg_mag', '(붉어진 눈으로) 보트를 가져갔소. 내 사람들은 걷지도 못하는데. 내일 마흔 명을 데리고 상륙하겠소. 마을에 불을 지르고 보트를 되찾겠소.'],
      ['mg_chamorro', '(붉게 물들인 이를 드러내며 제독의 배에 소리친다) 쇠! 쇠를 다오! 쇠를 주면 야자와 생선과 쌀을 주겠다!']
    ]); });
    var v = await UI.ask('도둑의 섬 — 사라진 보트와 굶주린 사람들', [
      { label: '금화 ' + U.num(k.guamGold) + '닢어치 쇠붙이로 야자·생선·쌀을 사서 함대에 건넨다', value: 'buy', icon: 'coin', dis: s.player.gold < k.guamGold },
      { label: '마가야네스와 함께 상륙해 보트를 찾는다', value: 'land', icon: 'sword' },
      { label: '끼지 않는다', value: 'pass' }], me());
    if (v === 'buy' && s.player.gold >= k.guamGold) {
      s.player.gold -= k.guamGold; addTrust(1);
      await play([['mg_mag', '(야자를 깨 앓는 선원의 입에 흘려 넣으며) …불은 그래도 지를 거요. 본보기가 없으면 이 바다의 섬마다 우리 것을 가져갈 테니. 그러나 오늘 밤 내 사람들이 먹는 것은 그대 덕이오.']]);
    } else if (v === 'land') {
      var r = await fight('차모로의 마을 사람들', foe('guam'), { leader: '차모로의 추장' });
      addTrust(1); s.player.notoriety = (s.player.notoriety || 0) + 2; b.guamRes = r;
      await play([[null, '보트는 되찾았다. 등 뒤에서 야자잎 지붕 마흔여 채가 탔다. 피가페타는 그 섬을 「도둑의 섬」이라 적었다.']]);
    } else v = 'pass';
    if (v !== 'pass') { var f = fame('ex', 'guam'); log('도둑의 섬 — ' + (v === 'buy' ? '섬사람들에게서 먹을 것을 사 마가야네스의 함대에 건넸다' : '마가야네스와 함께 상륙해 보트를 되찾았다') + '. (믿음 ' + MG.trust() + ' · 명성 +' + f + ')'); }
    b.seen.guam = v; refresh();
  }
  // ── ⑨ 세부 앞바다 → ⑩ 막탄
  async function leg_cebu() {
    var b = st(), tr = MG.trust(), early = today() < 15210407;
    b.seen.cebu = 'go';
    var smb = G.SpiceMactan && G.SpiceMactan.state ? G.SpiceMactan.state() : null;
    if (smb) { smb.cebu = 'mg'; smb.cebuFrom = null; }        // 향료제도·막탄의 세부 장면이 따로 열리지 않게
    await withPic('mg_cebu', early ? '리마사와의 부활절 (1521)' : '수그부의 십자가 (1521)', function () { return play([
      early ? [null, '동쪽 바다의 섬들. 리마사와의 해변에 나무 십자가가 서고, 낡은 배의 대포가 미사의 끝을 알린다. 말라카 사람 엔리케가 섬의 라자와 말을 나눈다 — 고향 말이 통한다.'] : [null, '세부, 수그부의 바닷가. 모래 위에 커다란 나무 십자가. 라자 후마본과 그의 사람 수백이 그 앞에 무릎을 꿇는다. 앞바다에 낡고 찢긴 카스티야의 배 세 척.'],
      ['mg_mag', tr >= MG.need() ? '(뱃전에서 제독을 끌어안는다) 그대로군! 대서양에서, 남쪽 바다에서, 이 큰 바다 끝에서도. 하느님께서 그대를 내 함대의 수호성인으로 보내셨나 보오.' : intro('cebu')],
      ['mg_mag', '세랑의 테르나테가 남쪽으로 열흘이라 하오. 거의 다 왔소. 세상을 한 바퀴 거의 다 돈 거요. …그런데 이 섬의 추장들이 하나둘 새 왕에게 엎드리는데, 막탄의 라푸라푸만 버티오.'],
      ['EN', '(사령관 곁에서, 제독에게만 말레이 말로) 사령관은 막탄을 치겠다고 해요. 후마본 라자가 부추겨요. 막탄 사람들은 여울을 알아요. 썰물이면 배가 못 닿아요.']
    ]); });
    await passTo(15210426);
    await mactanSea();
    refresh();
  }
  async function mactanSea() {
    var b = st(), smb = sm();
    await withPic('mg_eve', '막탄 전날 밤 (1521.4.26)', function () { return play([
      [null, '4월 26일 밤, 트리니다드호 선실. 사령관이 흉갑을 닦는다. 밖에서는 후마본의 전사 천 명이 횃불을 들고 노래한다.'],
      ['mg_mag', '후마본이 천 명을 내주겠다 했소. 거절했소. 카스티야의 갑옷이 어떤 것인지 섬사람들이 보아야 하오. 예순이면 충분하오. 내일 새벽, 썰물에 건너가오.'],
      ['mg_piga', '(구석에서 공책을 덮으며) 다들 말렸습니다. 썰물이면 산호 여울이 넓어 보트가 닿지 못하고 대포도 닿지 않는다고요.']
    ]); });
    var opts = [{ label: '마가야네스와 함께 상륙한다', value: 'mag', icon: 'sword' }].concat(MG.saveOpt()).concat([{ label: '배에서 지켜본다', value: 'watch', icon: 'eye' }]);
    var v = await UI.ask('막탄 — 내일 새벽, 마가야네스가 라푸라푸를 치러 간다', opts, me());
    if (v === 'save') { await MG.rescue('mg'); return; }
    b.mactan = v;
    var res = 'watch';
    await withPic('mg_mactan', '막탄의 여울 (1521.4.27)', function () { return play([
      [null, '새벽, 썰물. 산호 여울이 활 두 바탕 넘게 드러났다. 보트들이 멀리 멈추고, 쇠갑옷의 사내들이 허리까지 물에 잠긴 채 걸어 나간다. 해변에서 천오백 명이 넘는 막탄의 전사들이 세 무리로 달려 나온다.']
    ]); });
    if (v === 'mag') res = await fight('막탄의 전사들', foe('land'), { leader: '라푸라푸' });
    await play([
      [null, '독화살이 갑옷 없는 다리에 꽂히고, 대나무 창이 얼굴을 스친다. 사령관은 칼을 반밖에 뽑지 못한 채 얕은 물에 얼굴을 묻었다. 막탄의 전사들이 그 위로 덮쳤다.'],
      ['mg_piga', '(보트 위에서 떨며) 우리의 거울이요, 빛이요, 위안이요, 참된 길잡이였던 분이…!']
    ]);
    b.rescue = 'none'; b.mactanRes = res;
    if (smb) { smb.mactan = v; smb.mactanRes = res; }
    var f = v === 'mag' ? fame('bt', 'land') : 0;
    log('1521년 4월 27일 막탄 — ' + (v === 'mag' ? '마가야네스와 함께 상륙했다. 사령관은 여울에서 쓰러졌다' : '배에서 지켜보았다. 사령관은 여울에서 쓰러졌다') + '.' + (f ? ' (전투 명성 +' + f + ')' : ''));
  }

  /** 막탄 장면에 붙는 「사령관을 살린다」 (향료제도·막탄의 장면도 이것을 쓴다) */
  MG.saveOpt = function () {
    var b = st(); if (!b || b.foe || beaten() || b.rescue) return [];
    var tr = MG.trust(), need = MG.need();
    return [{ label: '「사령관을 살린다」 — 여울 바깥에 보트를 대고 퇴로를 지킨다' + (tr < need ? ' (믿음 ' + Math.max(0, tr) + '/' + need + ' — 그는 그대의 말을 듣지 않는다)' : ''), value: 'save', icon: 'heart', dis: tr < need }];
  };
  /** 사령관을 살린다 (src: 'mg' 이 사건의 바다 길 · 'sm' 향료제도·막탄의 길) */
  MG.rescue = async function (src) {
    var b = st(), s = S(), smb = sm();
    b.mactan = 'save';
    await withPic('mg_eve', '막탄 전날 밤 (1521.4.26)', function () { return play([
      ['P', '사령관, 내일 여울에서는 보트가 닿지 않소. 내 보트 둘을 산호 바깥에 대어 두겠소. 내 사람들이 퇴로를 지키겠소. 물러날 때 — 그때만이라도 내 말을 들어 주시오.'],
      ['mg_mag', '(흉갑을 닦던 손을 멈추고 오래 제독을 본다) …다른 사람이 그 말을 했으면 비웃었을 거요. 그러나 그대는 대서양에서도, 그 얼음 만에서도, 이 바다 한가운데서도 거기 있었소. 좋소. 후마본에게는 말하지 마시오. 그 사람은 구경을 하고 싶어 하니.']
    ]); });
    await withPic('mg_mactan', '막탄의 여울 (1521.4.27)', function () { return play([
      [null, '새벽, 썰물. 카스티야 사람 예순이 허리까지 물에 잠겨 여울을 건넌다. 산호 바깥, 노를 거둔 보트 두 척에 제독의 사람들이 엎드려 있다.'],
      [null, '마을에 불이 오르자 막탄의 전사들이 더 성이 나 쏟아져 나왔다. 독화살이 갑옷 없는 다리로 쏟아진다. 사령관이 「물러나라」를 외친다. 사람들이 등을 보이고 달아난다. 사령관 곁에 남은 것은 일고여덟.']
    ]); });
    var r = await fight('막탄의 여울 — 물러나는 길', foe('save'), { leader: '라푸라푸', hold: true });
    if (r === 'win') {
      b.rescue = 'saved';
      await withPic('mg_saved', '여울 바깥의 보트', function () { return play([
        [null, '대나무 창 하나가 그의 얼굴을 스치고, 언월도 하나가 왼다리를 쳤다. 그가 얼굴을 물에 묻고 쓰러졌다 — 그 위로 전사들이 덮치기 한 걸음 전, 제독의 사람들이 그의 망토를 움켜쥐었다.'],
        [null, '물속으로 끌고, 산호 사이로 끌고. 투구와 흉갑이 벗겨져 물 위에 떴다. 막탄의 전사들은 그 쇠붙이를 들어 올려 함성을 질렀다. 사령관의 몸은 산호 바깥 보트 바닥에 엎어져 있었다.'],
        ['mg_piga', '(멀리 카스티야의 보트 위에서, 물 위의 투구를 가리키며 운다) 사령관이…! 사령관이 쓰러지셨다! 그분의 몸을…!'],
        [null, '그날 밤, 제독의 배 아래 칸. 열에 들뜬 사내가 눈을 뜬다. 얼굴에 대나무 창 자국, 왼다리는 붕대에 감겼다. 손에 놋쇠 아스트롤라베를 쥔 채.'],
        ['mg_mag', '(천장을 보며) …카스티야의 배들은.'],
        ['P', '사령관이 죽은 줄 아오. 피가페타가 투구를 보았소. 라푸라푸는 몸을 돌려주지 않을 거라고들 하오. 내일이면 바르보자와 세랑이 함대를 맡을 거요.'],
        ['mg_mag', '(오래 웃는다. 웃다가 기침을 한다) 그럼 그렇게 두시오. 카스티야의 사령관 마가야네스는 오늘 아침 막탄의 여울에서 죽었소. 내가 살아 돌아가면 후마본은 다시 피를 부르고, 선장들은 또 칼을 갈 거요. 함대는 저들끼리 집에 갈 길을 찾을 거요.'],
        ['mg_mag', '(아스트롤라베를 제독의 손에 쥐여 준다) 남은 것은 다리를 저는 늙은 뱃사람 하나요. 별을 재는 법은 아직 안 잊었소. …그대의 배에 자리가 있다면. 셈할 수 없는 빚은 목숨으로 갚는 거라 했지. 이 목숨으로 갚겠소.']
      ]); });
      give('mg_astrolabe');
      var m = (G.Legend && G.Legend.join) ? G.Legend.join('mg_magellan', G.CITY_DATA[S().loc && S().loc.city != null ? S().loc.city : 170]) : null;
      if (m) m.loyal = 90;
      var f = fame('ex', 'save');
      log('1521년 4월 27일 막탄 — 여울 바깥에 보트를 대고 퇴로를 지켜, 쓰러진 마가야네스를 물속에서 건져 냈다. 세상은 그가 죽은 줄 안다. 그가 부하가 되었다. 「마가야네스의 아스트롤라베」. (탐험 명성 +' + f + ')');
      UI.toast('마가야네스 — 막탄의 여울에서 살아 돌아온 사람', 'people', 7000);
    } else {
      b.rescue = 'fail';
      await play([
        [null, '퇴로는 무너졌다. 보트에 닿기 전, 대나무 창이 그의 얼굴을 스치고 언월도가 다리를 쳤다. 사령관은 얕은 물에 얼굴을 묻었다. 막탄의 전사들이 그 위로 덮쳤다.'],
        ['mg_piga', '(제독의 보트로 끌려 올라오며) 그분은 우리가 보트에 다 오를 때까지 몇 번이고 뒤를 돌아보셨소… 당신이 아니었으면 나도 저 물속에 있었을 거요.']
      ]);
      log('1521년 4월 27일 막탄 — 여울 바깥에 보트를 대고 퇴로를 지켰지만 닿지 못했다. 마가야네스는 여울에서 쓰러졌다.');
    }
    b.mactanRes = r;
    if (smb) { smb.mactan = 'save'; smb.mactanRes = r; }
    refresh();
    return r;
  };

  // ================================================================ 만나는 곳
  var SEA = { atl: leg_atl, plata: leg_plata, mutiny: leg_mutiny, winter: leg_winter, strait: leg_strait, pac: leg_pac, guam: leg_guam, cebu: leg_cebu };
  MG.pending = function () { return !!(S() && sevOpen()); };
  MG.check = async function () {
    if (MG._busy) return false; MG._busy = true;
    try { if (sevOpen()) await seville(); } catch (e) { console.error(e); }
    MG._busy = false; refresh();
    return true;
  };
  MG.seaPending = function () { var s = S(); return !!(s && s.loc && s.loc.mode === 'sea' && legOpen(false)); };
  MG.atSea = async function () {
    if (MG._busy) return false; MG._busy = true;
    try { var L = legOpen(false); if (L) await SEA[L.key](); } catch (e) { console.error(e); }
    MG._busy = false; refresh();
    return true;
  };
  /** 바다에서 함대에 신호를 보내 「선장과 이야기한다」 (js/systems/seafolk.js SF.talk) — 이 사건이 맡았으면 true */
  MG.talk = async function (n, who) {
    if (!n || !n.exp || n.exp.id !== 'magellan' || MG._busy) return false;
    var b = st(); if (!b) return false;
    if (b.foe || beaten()) { await UI.say('(뱃전의 사령관이 등을 돌린다) 남만의 선장, 그대와 나눌 말은 없소. 다가오지 마시오.', H('mg_mag')); return true; }
    var L = legOpen(true); if (!L || L.cebu) return false;
    MG._busy = true;
    try { await SEA[L.key](); } catch (e) { console.error(e); }
    MG._busy = false; refresh();
    return true;
  };

  // ================================================================ 일지의 할 일
  MG.html = function () {
    var s0 = S(), b = s0 && s0.magellan; if (!b) return '';
    var t = today(), li = [], tr = MG.trust(), need = MG.need();
    if (b.foe) return '';
    if (b.rescue || t > 15210427) return '';
    if (t >= 15190926 || b.seen.seville) {
      var next = LEGS.filter(function (L) { return !b.seen[L.key] && t <= L.to; })[0];
      if (next) li.push(next.cebu ? '1521년 3월 중순~4월 25일 세부 앞바다 — 마가야네스의 함대가 닻을 내린다' : '바다에서 마가야네스의 함대를 만나면 (' + Math.floor(next.from / 10000) + '년 ' + (Math.floor(next.from / 100) % 100) + '월~' + (Math.floor(next.to / 100) % 100) + '월)');
      li.push('마가야네스의 믿음 ' + Math.max(0, tr) + ' — 1521년 4월 27일 막탄의 새벽에 그를 살리려면 ' + need + ' 이상');
    } else if (t >= D.cap && t <= D.sevTo) li.push('1518년 3월~1519년 9월 세빌리아(8월 10일부터는 카디스) — 마가야네스의 다섯 척');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">서쪽으로 돌아 — 마가야네스</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._magHtml) { G.Court._magHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + MG.html(); }; }
  MG._t = { seville: seville, legs: SEA, mactanSea: mactanSea };
})(window.G = window.G || {});
