/* 드레이크의 세계 일주 (G.DrakeCirc) 2026-11-08 사용자 요청 「드레이크의 세계일주 이벤트」
   마가야네스의 세계 일주(js/systems/magellan.js)와 같은 꼴 — 함대는 바다 위에서 날짜대로 항로를 가고, 그 곁에서 하루가 끝나거나 신호를 보내 「선장과 이야기한다」를 고르면
   그 구간의 장면이 열린다. 구간마다 한 번. 사람·동료·소지품·항로·조정값: js/data/drakecirc.js (G.BALANCE.drakecirc).
   역사는 바뀌지 않는다 — 다우티는 산훌리안에서 목이 베이고, 골든 하인드호는 남쪽 바다를 털고, 1580년 9월 26일 플리머스로 돌아오고, 1581년 4월 4일 뎃퍼드에서 기사가 된다.
   바뀌는 것은 제독이 어느 편에 섰고, 무엇을 받았고, 누구를 태웠는가다. 날짜: 그 무렵 잉글랜드의 날짜(율리우스력 — 마가야네스 사건과 같은 셈)
   ■ 잉글랜드 쪽 (드레이크의 믿음)
     ① 런던의 출자 (1577.5.1~11.14, 런던): 월싱엄·드레이크·다우티 — 「알렉산드리아로 간다」 · 출자(invest — 1580.10에 shareK배) · 에스파냐 왕의 눈 과라스의 금화(항로를 팔면 믿음 −2)
     바다에서 함대를 만나면:
     ② 모로코·카보베르데 (1577.12.14~1578.3.31): 물·식량 · (1.20부터) 붙잡힌 포르투갈 수로 안내인 누누 다 실바와 이야기한다
     ③ 남쪽 대서양 (1578.4.1~6.19): 다우티와 드레이크의 다툼 — 식량을 나눈다 / 다우티의 이야기를 들어 준다
     ④ 산훌리안의 재판 (1578.6.20~8.17): (가) 드레이크 편에서 말한다 (나) 목숨만은 살려 달라 청한다(웅변) (다) 다우티 편에 선다(그 뒤로 적) (라) 끼지 않는다
        — 역사대로 7월 2일 목이 베인다. 이야기를 들어 줬거나 청을 넣었으면 「다우티의 마지막 편지」(1580.10 뒤 런던에서 아우 존에게)
     ⑤ 골든 하인드호 (1578.8.18~9.6): 해협을 함께 정찰한다
     ⑥ 땅끝의 폭풍 (1578.9.7~11.24): 메리골드호를 찾는다 / 남쪽 끝 너머를 함께 본다(땅끝 해협의 단서)
     ⑦ 칠레 해안 (1578.11.25~1579.1.31): 모카 섬에서 다친 드레이크에게 약재 · 발파라이소의 약탈에 낀다(12.5 전 — 육상전)
     ⑧ 칼라오 (1579.2.1~2.28): 리마의 항구 칼라오에서 닻줄을 끊는 밤 (육상전) — 몫·악명·에스파냐의 적대
     ⑨ 카카푸에고 (1579.2.20~3.7): 보물선 「누에스트라 세뇨라 데 라 콘셉시온」을 쫓는다 → 「카카푸에고의 은 상자」(1580.10에 금화 chest)
     ⑩ 과툴코 (1579.4.1~4.20): 내려지는 누누 다 실바 — ②에서 이야기를 나눴거나 믿음 2 이상이면 배에 태운다 → 동료 dc_nuno
     ⑪ 노바 알비온 (1579.6.10~7.23): 미웍 사람들 · 배 바닥 손질을 돕는다 → 「놋쇠 판 탁본」
     ⑫ 테르나테 (1579.11.1~11.20): 술탄 바불라의 코라코라 — 정향을 싸게 산다
     ⑬ 셀레베스의 산호초 (1580.1.1~1.25): 걸린 골든 하인드호를 끌어낸다 — 믿음 +2 · 덜어 낸 정향을 싸게 · 「골든 하인드호의 판자」
     ⑭ 희망봉과 시에라리온 (1580.3.1~7.31): 물·식량
     ⑮ 뎃퍼드 (1581.3.25~4.30, 런던): 믿음 need 이상이면 드레이크가 부른다 — 여왕이 프랑스 사절에게 칼을 건네 기사로 세운다 (명성·여왕의 신뢰)
        다우티의 편지를 아우 존에게 전한다 (1580.10~1582, 런던)
   ■ 에스파냐 쪽
     ① 과라스에게 항로를 판다 · ⑧ 뒤 리마(1579.2.14~4.30): 부왕 톨레도 — (가) 허가장을 받고 쫓는다 (나) 파나마에 알린다(3.31까지 파나마) (다) 사양한다
     허가장이 있으면 그 뒤 바다에서 함대를 만나는 자리가 사냥이 된다 — 골든 하인드호와 큰 해전 (이기면 상금 · 역사대로 그 배는 안개 속으로 달아난다)
     지도의 함대를 바다에서 직접 쳐부숴도 한 해 늦어지지 않는다(noDelay) — 제독은 그의 적이 된다
   ■ 소식: 플리머스 출항(1577.12.13) · 다우티(1578.7.2) · 골든 하인드호(8.20) · 남쪽 끝(10.28) · 엘리자베스호 귀환(1579.6.2) · 칼라오(2.13) · 카카푸에고(3.1) ·
          귀환(1580.9.26) · 셈(1580.10.15 — 출자·은 상자가 있을 때만) · 뎃퍼드의 기사(1581.4.4)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/dc_*.webp — 개발노트의 그림 주문
   ■ 저장: s.drakeCirc = { trust, seen: {열쇠: 고른 것}, invest, spy, foe, side: 'en'|'es', nuno, doughty, letter, commission, warn, hunt, beat, chest, paid, knight, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var DC = G.DrakeCirc = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.drakecirc) || {}; }
  var LONDON = 38, LIMA = 222, PANAMA = 210, TERNATE = 171;
  var D = DC.D = { lonFrom: 15770501, lonTo: 15771114, limaFrom: 15790214, limaTo: 15790430, warnTo: 15790331, knFrom: 15810325, knTo: 15810430, letterFrom: 15801001, letterTo: 15821231, huntTo: 15790723 };
  var LEGS = DC.LEGS = [
    { key: 'atl', from: 15771214, to: 15780331 },
    { key: 'plata', from: 15780401, to: 15780619 },
    { key: 'julian', from: 15780620, to: 15780817 },
    { key: 'strait', from: 15780818, to: 15780906 },
    { key: 'storm', from: 15780907, to: 15781124 },
    { key: 'chile', from: 15781125, to: 15790131 },
    { key: 'callao', from: 15790201, to: 15790228 },
    { key: 'cacafuego', from: 15790220, to: 15790307 },
    { key: 'guatulco', from: 15790401, to: 15790420 },
    { key: 'albion', from: 15790610, to: 15790723 },
    { key: 'ternate', from: 15791101, to: 15791120 },
    { key: 'reef', from: 15800101, to: 15800125 },
    { key: 'cape', from: 15800301, to: 15800731 }
  ];
  var NEWS_AT = { depart: 15771213, doughty: 15780702, hind: 15780820, south: 15781028, callao: 15790213, cacafuego: 15790301, winter: 15790602, home: 15800926, pay: 15801015, knight: 15810404 };
  DC.NEWS_AT = NEWS_AT;

  function st() {
    var s = S(); if (!s) return null;
    if (!s.drakeCirc) {
      s.drakeCirc = { told: {}, trust: 0, seen: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.drakeCirc.told[k] = 1; });   // 옛 저장 — 지난 소식은 띄우지 않는다
    }
    var b = s.drakeCirc; if (!b.told) b.told = {}; if (!b.seen) b.seen = {}; if (b.trust == null) b.trust = 0;
    return b;
  }
  DC.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function H(id) {
    // 누누는 역사 인물 표가 아니라 사건 동료 표에 있다. 합류 전 대화도 같은 초상을 쓴다.
    if (G.MATE && G.MATE[id] && !(G.HIST_FIG && G.HIST_FIG[id])) return mateSp(id);
    return G.Hist ? G.Hist.speaker(id) : { name: (G.HIST_FIG && G.HIST_FIG[id] && G.HIST_FIG[id].name) || id, lang: 3 };
  }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function queenSp() {
    var keys = ['portraits/history/elizabeth_player', 'portraits/sponsors/en_king_6'];
    return { name: '엘리자베스 1세', lang: 3, portrait: G.Art.withImg(G.Art.npcSpec('elizabeth', 'noble', 'ne', 'f'), keys), half: keys.map(function (k) { return k + '_half'; }) };
  }
  var WHO = { P: me, F: first, NU: function (e) { return mateSp('dc_nuno', e); }, Q: queenSp };
  var CREW = { name: '골든 하인드호의 선원', lang: 3 }, QUEEN = 'Q';
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
  function drop(id) { if (R.removeItem && R.hasItem && R.hasItem(id)) R.removeItem(id); }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  function foe(k) { return (K().foe || {})[k] || 12; }
  function sup(k) { return (K().supply || {})[k] || 20; }
  function noto(k) { var s = S(), n = (K().noto || {})[k] || 0; s.player.notoriety = (s.player.notoriety || 0) + n; return n; }
  function spain() { var c = G.CITY_DATA[LIMA]; return (c && R.cityOwner ? R.cityOwner(c) : null) || '에스파냐'; }
  function hostile(k, why) { var n = (K().hostile || {})[k] || 0; if (n && G.Hostile && G.Hostile.add) G.Hostile.add(spain(), n, why); return n; }
  function trustSp(id, n) { if (G.Sponsor && G.Sponsor.rel && G.Sponsor.addTrust) G.Sponsor.addTrust(G.Sponsor.rel(id), n); }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  function price(id) { return (G.GOOD && G.GOOD[id] && G.GOOD[id].p) || 80; }
  function goodName(id) { return (G.GOOD && G.GOOD[id] && G.GOOD[id].name) || id; }
  function room(id) {
    var f = S().fleet;
    if (!f.cargo[id] && R.maxKinds && Object.keys(f.cargo).length >= R.maxKinds()) return 0;
    return Math.max(0, Math.floor(G.Cargo && G.Cargo.room ? G.Cargo.room(id) : (R.free ? R.free() : 999)));
  }
  function load(id, q, p, cityId) {
    var s = S(), f = s.fleet, cg = f.cargo[id];
    if (cg) { if (R.addCargoLot) R.addCargoLot(cg, cityId, q, p); cg.cost = Math.round((cg.cost * cg.q + p * q) / (cg.q + q)); cg.d = Math.round(((cg.d || s.day) * cg.q + s.day * q) / (cg.q + q)); cg.q += q; }
    else { f.cargo[id] = { q: q, cost: p, from: cityId, d: s.day, lots: {} }; f.cargo[id].lots[cityId] = { q: q, cost: p }; }
  }
  async function buy(id, conf, cityId, who) {
    var s = S(), p = Math.max(1, Math.round(price(id) * conf.k)), q = Math.min(conf.n, room(id), Math.floor(s.player.gold / p));
    var v = await UI.ask(goodName(id) + ' — 한 통에 금화 ' + U.num(p) + '닢 (시세의 ' + Math.round(conf.k * 100) + '%)', [
      { label: q > 0 ? q + '통을 산다 (금화 ' + U.num(q * p) + '닢)' : '실을 자리나 돈이 없다', value: 'buy', icon: 'sack', dis: q <= 0 },
      { label: '사지 않는다', value: 'no' }], who || me());
    if (v !== 'buy' || q <= 0) return 0;
    s.player.gold -= q * p; load(id, q, p, cityId);
    UI.toast(goodName(id) + ' ' + q + '통을 실었다', 'sack', 4200);
    return q;
  }
  function ex() { return (G.EXPEDITIONS || []).filter(function (e) { return e.id === 'drake'; })[0] || null; }
  /** 지도의 함대를 바다에서 쳐부쉈는가 (seafolk afterBattle — noDelay라 한 해 늦어지지는 않는다) */
  function beaten() { var s = S(); return !!(s && (s.flags['expBeat_drake_0'] || (s.drakeCirc && s.drakeCirc.beat))); }

  /** 믿음 — 장면에서 얻은 것. 다우티 편에 섰거나, 에스파냐 편에서 그를 쫓았거나, 그의 함대를 쳐부쉈으면 적 */
  DC.trust = function () {
    var b = st(); if (!b) return 0;
    if (b.foe || b.side === 'es' || beaten()) return -99;
    return b.trust || 0;
  };
  function addTrust(n) { var b = st(); b.trust = (b.trust || 0) + n; }
  DC.need = function () { return K().need || 3; };
  function isFoe() { var b = st(); return !!(b && (b.foe || beaten())); }

  /** 그 날 함대의 자리 {lon, lat} — js/data/drakecirc.js의 항로(seafolk.js가 바닷길로 이어 둔다) */
  DC.fleetPos = function (dayIdx) {
    var e = ex(), t = dayIdx != null ? dayIdx : U.dayIndex(S().date);
    if (!e || !G.SeaFolk || !G.SeaFolk.posAt) return null;
    var p = G.SeaFolk.posAt(e, t); return p ? { lon: p.lon, lat: p.lat } : null;
  };
  function dist(a, b) { if (G.Geo && G.Geo.dist) return G.Geo.dist(a.lon, a.lat, b.lon, b.lat); var dx = ((b.lon - a.lon + 540) % 360) - 180, dy = b.lat - a.lat; return Math.sqrt(dx * dx + dy * dy); }
  /** 사냥 — 부왕의 허가장을 받았고 아직 싸우지 않았다 */
  function huntOpen() { var b = st(); return !!(b && b.commission && !b.hunt && !beaten() && today() <= D.huntTo); }
  /** 지금 열려 있는 바다의 구간 (here: 자리를 따지지 않는다 — 신호를 주고받는 때) */
  function legOpen(here) {
    var b = st(), s = S(); if (!b) return null;
    var t = today(), near = here;
    if (!near) { var l = s.loc; if (!l || l.mode !== 'sea' || l.lon == null) return null; var p = DC.fleetPos(); near = !!(p && dist(l, p) <= (K().meetR || 4.5)); }
    if (!near) return null;
    if (huntOpen()) return { key: 'hunt' };
    if (isFoe() || b.side === 'es') return null;
    for (var i = 0; i < LEGS.length; i++) {
      var L = LEGS[i]; if (b.seen[L.key] || t < L.from || t > L.to) continue;
      return L;
    }
    return null;
  }
  DC._legOpen = legOpen;

  // ================================================================ 소식
  DC.daily = function () {
    var b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, s = S();
    function news(k, icon, text) { if (!told[k] && t >= NEWS_AT[k]) { told[k] = 1; if (text) out.push({ icon: icon, history: true, text: text }); } }
    news('depart', 'ship', '【플리머스를 떠난 다섯 척】 12월 13일, 프랜시스 드레이크가 펠리컨호를 비롯한 다섯 척, 백예순 명 남짓을 이끌고 플리머스를 떠났다. 행선지는 「알렉산드리아의 건포도 장사」라 했다. 그 말을 믿는 뱃사람은 없다.' + (b.invest > 0 ? ' 그대의 이름도 출자 명부에 있다.' : ''));
    news('doughty', 'skull', '【산훌리안의 도끼】 7월 2일, 남쪽 바다의 얼어붙은 만 산훌리안에서 드레이크가 옛 친구 토머스 다우티를 반역과 마술의 죄로 재판에 부쳐 목을 베었다. 두 사람은 그 전날 함께 성찬을 받고 저녁을 먹었다고 한다. 바닷가에는 쉰여덟 해 전 마가야네스가 세운 교수대가 아직 서 있었다.' +
      (b.doughty === 'plead' ? ' 누군가 다우티의 목숨을 청했으나 드레이크는 마지막 청 — 성찬과 저녁 — 만 들어주었다.' : b.doughty === 'rebel' ? ' 다우티를 빼내려던 낯선 배가 있었다는 말이 돈다.' : ''));
    news('hind', 'ship', '【골든 하인드호】 마가야네스 해협 어귀에서 드레이크가 기함 펠리컨호의 이름을 「골든 하인드」(금빛 암사슴)로 바꾸었다. 원정의 뒷돈을 댄 크리스토퍼 해턴 경의 문장이 금빛 암사슴이다 — 다우티는 해턴의 사람이었다. 세 척은 열엿새 만에 해협을 빠져나갔다.');
    news('south', 'ship', '【땅끝의 바다】 해협을 빠져나온 드레이크의 배들이 쉰 날 넘게 폭풍에 밀려 남쪽 끝까지 내려갔다. 메리골드호는 파도에 삼켜졌고, 엘리자베스호는 해협으로 되돌아갔다. 드레이크는 불의 땅 남쪽이 섬들로 끝나고 그 너머로 큰 바다가 이어진다는 것을 보았다고 한다.' + (b.seen.storm === 'south' ? ' 그 곁에 남만 배 한 척이 있었다.' : ''));
    news('callao', 'cannon', '【칼라오의 밤】 2월 13일 밤, 잉글랜드 해적 「드라케」가 리마의 항구 칼라오에 숨어 들어 닻을 내린 배들의 닻줄을 모두 끊고 은을 털어 갔다. 부왕 톨레도가 노하여 사르미엔토 데 감보아에게 배를 내주고 그를 쫓게 했다.' + (b.seen.callao === 'raid' ? ' 해적들 가운데 낯선 남만 선원들이 있었다는 말이 돈다.' : ''));
    news('cacafuego', 'coin', '【카카푸에고】 3월 1일, 적도 바다의 프란시스코 곶 앞에서 드레이크가 페루의 은을 싣고 파나마로 가던 보물선 「누에스트라 세뇨라 데 라 콘셉시온」을 사로잡았다. 은 스물여섯 톤, 금 여든 파운드. 선원들은 그 배를 「불 뿜는 배(카카푸에고)」라 불렀는데, 이제 그 배가 「은 뿜는 배」라는 농담이 돈다.');
    news('winter', 'ship', '【엘리자베스호의 귀환】 남쪽 바다에서 드레이크와 헤어진 존 윈터의 엘리자베스호가 잉글랜드로 돌아왔다. 윈터는 「총대장이 죽었는지 살았는지 모른다」고 말했다.');
    news('home', 'ship', '【골든 하인드호, 플리머스에】 9월 26일, 세 해 가까이 소식이 없던 드레이크의 골든 하인드호가 은과 금과 정향을 바닥까지 싣고 플리머스에 들어왔다. 배를 대자마자 드레이크가 처음 물은 말은 「여왕 폐하는 아직 살아 계시오?」였다고 한다. 마가야네스의 배 다음으로 세상을 한 바퀴 돈 배다. 에스파냐 대사 멘도사는 약탈물을 돌려 달라고 여왕에게 따졌다.');
    if (!told.pay && t >= NEWS_AT.pay) {
      told.pay = 1;
      var inv = b.invest > 0, ch = !!b.chest && !b.paid, txt = '';
      if (inv || ch) {
        var g = 0;
        if (inv) { var a = Math.round(b.invest * (K().shareK || 12)); g += a; txt += ' 출자 증서에 몫이 나왔다 — 금화 ' + U.num(a) + '닢.'; drop('dc_share'); }
        if (ch) { var c = K().chest || 6000; g += c; txt += ' 카카푸에고의 은 상자는 런던 탑의 셈을 거쳐 금화 ' + U.num(c) + '닢이 되었다.'; drop('dc_chest'); }
        s.player.gold += g; b.paid = g;
        out.push({ icon: 'coin', history: true, text: '【골든 하인드호의 셈】 드레이크가 싣고 온 보물이 런던 탑으로 옮겨져 셈을 마쳤다. 출자한 사람들은 낸 돈의 마흔일곱 배를 받았다고 한다. 여왕의 몫이 가장 컸다.' + txt });
      }
    }
    news('knight', 'crown', b.knight ? null : '【뎃퍼드의 기사】 4월 4일, 템스 강가 뎃퍼드에 매어 둔 골든 하인드호 갑판에서 여왕 엘리자베스가 드레이크를 기사로 세웠다. 여왕은 「에스파냐 왕이 이 자의 목을 내놓으라 하니, 금칼로 치겠다」며 칼을 프랑스 사절 마르쇼몽에게 건넸고, 그가 드레이크의 어깨를 쳤다고 한다.');
    return out;
  };

  // ================================================================ ① 런던의 출자 (1577.5.1~11.14)
  function lonOpen() {
    var b = st(), t = today();
    return !!(b && !b.seen.london && !b.foe && cityNow() === LONDON && t >= D.lonFrom && t <= D.lonTo);
  }
  async function london() {
    var b = st(), s = S(), k = K();
    await withPic('dc_london', '알렉산드리아로 가는 배 (1577)', function () { return play([
      [null, '런던, 국무장관 월싱엄의 집. 덧문을 닫은 방, 탁자에 남쪽 바다의 해도가 펼쳐져 있다. 해도 위에 놓인 것은 건포도 상자가 아니라 은괴 그림이다.'],
      ['dc_walsingham', '(낮은 목소리로) 바깥에는 알렉산드리아로 건포도를 사러 간다고 해 두었소. 이 방에서 나간 말은 이 방으로 돌아오지 않소. 알겠소?'],
      ['dc_drake', '(해도의 남쪽 끝을 주먹으로 짚으며) 마가야네스의 해협을 지나 남쪽 바다로 가겠소. 거기 에스파냐 놈들은 대포도 없이 은을 실어 나르지. 펠리페 왕의 수염을 그을리러 가는 거요. 여왕 폐하께서도 몰래 한 몫 내셨소.'],
      ['dc_doughty', '(비단 소매를 털며 웃는다) 총대장은 늘 이렇게 시원하시지. 나는 해턴 경의 몫을 맡아 함께 가오. 신사가 끼어야 원정이 원정다워지는 법이오.'],
      ['dc_drake', '(다우티가 창가로 간 뒤, 제독에게만) 다우티는 말을 잘하오. 너무 잘해서 탈이지. …자, 그대는 어떻소? 남쪽 바다의 은에 한 몫 걸어 보겠소?']
    ]); });
    var v = await UI.ask('드레이크의 원정 — 「알렉산드리아 무역」의 출자 명부', [
      { label: '출자한다 (금화 ' + U.num(k.invest) + '닢 — 배가 돌아오면 몫)', value: 'invest', icon: 'coin', dis: s.player.gold < k.invest },
      { label: '출자하지 않는다', value: 'no' }], me());
    if (v === 'invest' && s.player.gold >= k.invest) {
      s.player.gold -= k.invest; b.invest = k.invest; give('dc_share'); addTrust(1);
      await play([['dc_drake', '(손을 내밀어 꽉 쥔다) 좋소! 돌아오면 그대 금화가 새끼를 쳐 있을 거요. 못 돌아오면… 그땐 바다가 셈을 하겠지.']]);
      log('런던 — 드레이크의 「알렉산드리아 무역」 원정에 금화 ' + U.num(k.invest) + '닢을 출자했다. 「드레이크 원정의 출자 증서」.');
    }
    await play([
      [null, '며칠 뒤, 템스 강가의 여관. 검은 벨벳 망토의 사내가 제독의 탁자에 앉는다. 반지 낀 손가락이 금화를 하나씩 쌓는다.'],
      ['dc_guaras', '드레이크가 정말 알렉산드리아로 가는지, 아니면 다른 바다로 가는지만 알려 주시오. 펠리페 전하께서는 은혜를 잊지 않으시오. 금화 ' + U.num(k.spyGold) + '닢이오.']
    ]);
    var w = await UI.ask('에스파냐 왕의 눈 — 과라스의 금화', [
      { label: '「그 금화 이야기는 드레이크에게 하겠소」 — 그에게 알린다', value: 'warn', icon: 'shield' },
      { label: '금화를 받고 행선지를 넘긴다', value: 'spy', icon: 'coin' },
      { label: '자루를 밀어낸다', value: 'no' }], me());
    if (w === 'warn') {
      b.spy = 'warn'; addTrust(1);
      await play([['dc_drake', '(크게 웃는다) 과라스 그 늙은 여우! 그럼 출항 날짜를 한 번 더 미루는 척하지. 그대는 입이 무거운 사람이군. 마음에 들었소.']]);
    } else if (w === 'spy') {
      s.player.gold += k.spyGold; b.spy = 'es'; addTrust(-2); noto('spy'); trustSp('es_crown', 5);
      await play([['dc_guaras', '(금화 자루를 밀어 주며) 현명하시오. 마드리드에 그대의 이름을 적어 보내겠소.']]);
      log('런던 — 에스파냐 왕의 눈 과라스에게 금화 ' + U.num(k.spyGold) + '닢을 받고 드레이크의 행선지를 넘겼다. (드레이크의 믿음 −2 · 카스티야 국왕의 신뢰 +5 · 악명 +' + ((K().noto || {}).spy || 0) + ')');
    } else b.spy = 'no';
    b.seen.london = v === 'invest' ? 'invest' : 'met';
    var f = fame('so', 'london');
    log('런던 — 드레이크의 원정을 보았다. 1577년 12월 플리머스를 떠나 남쪽으로 간다. 바다에서 그의 배를 만나면 다시 이야기할 수 있다. (사교 명성 +' + f + ')');
    UI.toast('드레이크의 함대 — 바다에서 만나면', 'ship', 6000);
    refresh();
  }

  // ================================================================ 바다의 구간들
  function intro() {
    var b = st(), known = (b.trust || 0) >= 1 || b.seen.london;
    return known ? '(뱃전에서 모자를 흔든다) 또 그대로군! 이 넓은 바다에서 두 번 만나는 건 운이 아니라 인연이오.' : '(고물에서 망원경을 내리고) 낯선 깃발이로군. 잉글랜드의 프랜시스 드레이크요. 싸울 생각이 없으면 가까이 오시오.';
  }
  async function leg_atl() {
    var b = st(), s = S(), t = today(), withNuno = t >= 15780120, n = sup('atl');
    await withPic('dc_capeverde', withNuno ? '카보베르데의 포르투갈 배 (1578)' : '모로코 앞바다 (1577)', function () { return play(withNuno ? [
      [null, '카보베르데 제도 앞바다. 드레이크의 배들 곁에 포르투갈 상선 한 척이 끌려온다 — 「산타 마리아」호. 포도주 통과 직물이 갑판에 쌓였다.'],
      ['dc_drake', intro()],
      ['dc_drake', '배는 돌려주고 짐은 받았소. 그리고 저 배의 수로 안내인을 받았지. 누누 다 실바 — 브라질 바다를 스무 해 넘게 오간 사람이오. 그 사람의 해도 상자가 은 상자보다 값지오.'],
      ['dc_nuno', '(갑판 구석, 해도 상자를 끌어안고 포르투갈 말로 중얼거린다) …브라질 바다를 아는 늙은이는 잡혀가고, 아무것도 모르는 젊은이는 집으로 돌아가는군. 성모님, 이것도 셈이 맞습니까.']
    ] : [
      [null, '모로코 모가도르 앞바다. 다섯 척이 닻을 내리고 섬에서 물을 긷는다. 바닷가 무어 사람들과 손짓으로 흥정하던 선원 하나가 끌려갔다는 소식에 갑판이 술렁인다.'],
      ['dc_drake', intro()],
      ['dc_drake', '선원들이 아직도 알렉산드리아로 가는 줄 아오. 남쪽으로 꺾으면 말이 나올 거요. 그래도 꺾어야지. 물통이 반밖에 안 찼소.']
    ]); });
    var opts = [{ label: '물과 식량을 ' + n + '통씩 나눠 준다', value: 'give', icon: 'drop', dis: (s.fleet.food || 0) < n || (s.fleet.water || 0) < n }];
    if (withNuno) opts.push({ label: '붙잡힌 수로 안내인 누누 다 실바에게 말을 건다', value: 'nuno', icon: 'chat' });
    opts.push({ label: '인사만 하고 지나간다', value: 'pass' });
    var v = await UI.ask(withNuno ? '드레이크의 함대 — 카보베르데 앞바다' : '드레이크의 함대 — 모로코 앞바다', opts, me());
    if (v === 'give' && s.fleet.food >= n && s.fleet.water >= n) {
      s.fleet.food -= n; s.fleet.water -= n; addTrust(1);
      await play([['dc_drake', '(물통이 넘어가는 것을 보며) 데번 사람은 받은 건 꼭 갚소. 받은 매도, 받은 물도. 플레처 목사, 이 일을 일지에 적어 두시오.'], ['dc_fletcher', '(펜을 적시며) 적겠습니다. 「낯선 배가 물 ' + n + '통을 주었다. 하느님의 섭리다.」']]);
    } else if (v === 'nuno') {
      b.nuno = 1;
      await play([
        ['P', '(포르투갈 말로) 누누 선장, 해도 상자를 꽤 아끼시는군요.'],
        ['dc_nuno', '(눈을 크게 뜨고) 이 배에서 내 말을 하는 사람을 만날 줄은. …선장이라 부르지 마시오. 이제 나는 잉글랜드 해적의 길잡이요. 그래도 고맙소. 사람 말을 들으니 사람이 된 것 같군.'],
        ['dc_nuno', '(목소리를 낮춰) 저 붉은 머리 사내는 내 해도를 다 베끼고 나면 나를 어느 바닷가에 내려 줄 거요. 그게 어느 바닷가인지 신만 아시지.']
      ]);
      log('카보베르데 앞바다 — 드레이크에게 붙잡힌 포르투갈 수로 안내인 누누 다 실바와 이야기를 나눴다.');
    }
    b.seen.atl = v; refresh();
    if (v === 'give') { var f = fame('ex', 'atl'); log('대서양 — 드레이크의 함대를 만나 물과 식량을 나눴다. (믿음 ' + DC.trust() + ' · 탐험 명성 +' + f + ')'); }
  }
  async function leg_plata() {
    var b = st(), s = S(), n = sup('plata');
    await withPic('dc_plata', '남쪽 대서양의 다툼 (1578)', function () { return play([
      [null, '브라질 남쪽 바다. 폭풍에 흩어졌던 배들이 다시 모였다. 펠리컨호 갑판에서 고함이 오간다 — 사로잡은 포르투갈 배의 짐에서 장갑 한 켤레와 반지가 사라졌다고 한다.'],
      ['dc_drake', intro()],
      ['dc_drake', '(얼굴이 붉다) 다우티가 내 동생 토머스가 짐을 훔쳤다고 떠들고 다녔소. 그런데 정작 다우티의 상자에서 장갑이 나왔지! 이제 선원들 사이에서 그자가 바람을 부르는 마술을 한다는 말까지 돌아.'],
      ['dc_doughty', '(다른 배 뱃전에서, 제독에게 손짓하며) 남만 선장! 잠깐 이야기 좀 합시다. 이 배에서 내 말을 들어 줄 사람이 없소.']
    ]); });
    var v = await UI.ask('남쪽 대서양 — 드레이크와 다우티', [
      { label: '식량 ' + n + '통을 내려 준다', value: 'give', icon: 'bread', dis: (s.fleet.food || 0) < n },
      { label: '다우티의 이야기를 들어 준다', value: 'listen', icon: 'chat' },
      { label: '인사만 하고 지나간다', value: 'pass' }], me());
    if (v === 'give' && s.fleet.food >= n) {
      s.fleet.food -= n; addTrust(1);
      await play([['dc_drake', '고맙소. 배가 부르면 선원들 입도 좀 다물어지겠지.']]);
      var f = fame('ex', 'plata'); log('남쪽 대서양 — 드레이크의 함대에 식량 ' + n + '통을 내렸다. (믿음 ' + DC.trust() + ' · 탐험 명성 +' + f + ')');
    } else if (v === 'listen') {
      b.listen = 1;
      await play([
        ['dc_doughty', '(포도주 잔을 돌리며) 드레이크는 데번 촌구석의 목사 아들이오. 내가 해턴 경을 소개하지 않았으면 여왕 폐하 얼굴도 못 보았을 거요. 그런 사람이 이제 나를 도둑으로 몰아.'],
        ['dc_doughty', '(잔을 내려놓고, 웃음기가 가신 얼굴로) …우습게도 나는 아직 그 사람이 좋소. 플리머스에서 함께 술을 마시던 밤이 생각나오. 그게 나의 탈이지.']
      ]);
      log('남쪽 대서양 — 토머스 다우티의 이야기를 들어 주었다.');
    }
    b.seen.plata = v; refresh();
  }
  async function leg_julian() {
    var b = st(), s = S(), sp = skill('speech'), pChance = U.clamp(0.3 + sp * 0.18, 0.2, 0.9);
    await withPic('dc_julian', '산훌리안의 재판 (1578)', function () { return play([
      [null, '남위 49도, 산훌리안 만. 잿빛 바닷가에 낡은 교수대가 서 있다 — 쉰여덟 해 전 마가야네스가 반란자들을 매단 그 나무다. 그 아래에서 배심원 마흔 명이 둘러앉았다.'],
      ['dc_drake', '(굳은 얼굴로) 왔군. 하필 오늘. …다우티를 재판에 부쳤소. 반역, 그리고 내 원정을 망치려 한 죄. 그자는 버글리 경에게 이 원정의 행선지를 알렸다고 제 입으로 말했소. 여왕 폐하께서는 버글리 경이 이 일을 모르길 바라셨지.'],
      ['dc_doughty', '(사슬 없이 서서, 제독을 보고 쓴웃음) 총대장의 왕실 위임장을 보여 달라 했소. 그런 게 있으면 말이오. 없지. 그러니 이건 재판이 아니라 데번식 셈이오.'],
      ['dc_fletcher', '(제독에게 낮게) 배심원들은 죄가 있다고 했소. 이제 총대장의 말 한마디만 남았소.']
    ]); });
    var opts = [
      { label: '「총대장의 원정을 흔든 자요」 — 드레이크 편에서 말한다', value: 'side', icon: 'shield' },
      { label: '「목숨만은 살려 잉글랜드에서 재판받게 하시오」 — 청한다 (약 ' + Math.round(pChance * 100) + '%)', value: 'plead', icon: 'handshake' },
      { label: '다우티를 밤에 빼내려 한다 (그 뒤로 드레이크의 적)', value: 'rebel', icon: 'sword' },
      { label: '끼지 않는다', value: 'pass' }];
    var v = await UI.ask('산훌리안 — 다우티의 재판', opts, me());
    b.doughty = v;
    if (v === 'side') {
      addTrust(2);
      await play([['dc_drake', '(오래 제독을 보고, 고개를 끄덕인다) …그 말이 내게 필요했소. 이 일을 나 혼자 짊어지는 줄 알았지.']]);
    } else if (v === 'plead') {
      var ok = U.chance(pChance); b.pleadRes = ok ? 'win' : 'lose';
      await play([
        ['P', '총대장, 그를 사슬에 묶어 잉글랜드로 데려가 여왕 폐하의 법정에 세우시오. 이 바닷가에서 목을 베면, 원정이 끝난 뒤 그 피가 총대장을 쫓아다닐 거요.'],
        ok ? ['dc_drake', '(주먹을 쥐었다 편다) 그대 말이 옳을지도 모르오. 그러나 배 위에 그 사람을 두면 선원들이 둘로 갈라지오. …다만 한 가지는 들어주겠소. 그가 바라는 대로 해 주겠소. 성찬이든 저녁이든.'] : ['dc_drake', '(고개를 젓는다) 그럴 수 없소. 이 배가 바다 한가운데서 둘로 쪼개지는 걸 보고 싶지 않소.']
      ]);
      if (ok) addTrust(1);
    } else if (v === 'rebel') {
      b.foe = true;
      var r = await fight('산훌리안 바닷가의 파수꾼', 12, { leader: '토머스 드레이크' });
      await play([
        [null, r === 'win' ? '파수꾼들을 밀어냈지만, 다우티는 보트에 오르지 않았다. 「나는 신사요. 도망쳐 사는 신사는 없소.」 그는 제 발로 천막으로 돌아갔다.' : '횃불이 켜지고 파수꾼들이 몰려왔다. 다우티는 보트 앞에서 고개를 저었다. 「됐소. 나 때문에 그대까지 다칠 것 없소.」'],
        ['dc_drake', '(바닷가에서 외친다) 남만의 선장! 내 원정에 다시는 다가오지 마시오. 다음엔 그대 배에 대포를 쏘겠소!']
      ]);
      log('산훌리안 — 토머스 다우티를 밤에 빼내려 했다. 그는 떠나지 않았고, 드레이크는 제독을 적으로 안다.');
    }
    // 7월 2일 — 역사대로
    await play([
      [null, '7월 2일 아침. 다우티는 드레이크와 함께 성찬을 받고, 같은 상에서 저녁을 먹었다. 둘은 한참 귓속말을 나누었다. 그러고는 다우티가 도끼 앞에 스스로 목을 내밀었다.'],
      ['dc_doughty', '(형장으로 가기 전, 제독에게 봉한 편지를 건네며) ' + (b.listen || v === 'plead' || v === 'rebel' ? '내 아우 존에게 전해 주시오. 잉글랜드에 닿거든. 원망은 쓰지 않았소. …정말이오.' : '(제독을 한 번 보고 고개를 숙인다) 좋은 바람이 불기를.')]
    ]);
    if (b.listen || v === 'plead' || v === 'rebel') { b.letter = 'carry'; give('dc_letter'); UI.toast('다우티의 마지막 편지 — 잉글랜드에 닿으면 런던의 아우 존에게', 'scroll', 6000); }
    if (v !== 'rebel') {
      await play([
        [null, '한 달 뒤, 같은 바닷가. 드레이크가 모든 사람을 모아 놓고 말했다.'],
        ['dc_drake', '신사와 선원 사이에 이렇게 다툼이 있는 걸 더는 못 보겠소. 오늘부터 신사도 선원과 함께 밧줄을 당기고 돛을 끌어야 하오. 우리는 모두 한 배를 탄 사람이오. 이 말을 거스르는 신사가 있으면 나와 보시오!']
      ]);
    }
    b.seen.julian = v;
    if (v === 'side' || v === 'plead') { var f = fame(v === 'side' ? 'bt' : 'so', 'julian'); log('산훌리안의 재판 — ' + (v === 'side' ? '드레이크 편에서 말했다' : '다우티의 목숨을 청했다') + '. 다우티는 역사대로 7월 2일 목이 베였다. (믿음 ' + DC.trust() + ' · 명성 +' + f + ')'); }
    refresh();
  }
  async function leg_strait() {
    var b = st(), sv = skill('survey') + skill('nav');
    await withPic('dc_hind', '골든 하인드호 (1578)', function () { return play([
      [null, '마가야네스 해협 어귀, 처녀들의 곶. 펠리컨호 고물에 새 이름이 걸린다 — 금빛 암사슴, 골든 하인드. 원정의 뒷돈을 댄 해턴 경의 문장이다.'],
      ['dc_drake', intro()],
      ['dc_drake', '(목소리를 낮추고) 다우티는 해턴 경의 사람이었소. 이 이름이 해턴 경의 노여움을 좀 달래 주겠지. …자, 해협이오. 마가야네스는 서른여드레 걸렸다지. 나는 그보다 빨리 지나가겠소.'],
      ['dc_nuno', '(뱃전에서 해도를 펴며) 섬 사이로 물길이 갈라집니다. 남쪽 물길은 막혀 있다고 들었습니다. 서쪽으로, 늘 서쪽으로.']
    ]); });
    var v = await UI.ask('마가야네스 해협 — 드레이크가 물길을 묻는다', [
      { label: '보트를 내려 앞장서 물길을 잰다' + (sv >= 3 ? ' (측량·항해 솜씨로 더 빨리)' : ''), value: 'scout', icon: 'compass' },
      { label: '인사만 하고 지나간다', value: 'pass' }], me());
    if (v === 'scout') {
      addTrust(1);
      await play([[null, '얼음 덮인 산이 양쪽에 솟은 물길을 열엿새. 펭귄 섬에서 고기를 잡고, 서쪽 어귀에서 큰 바다가 열렸다.'], ['dc_drake', '(크게 웃는다) 열엿새요! 마가야네스의 절반도 안 걸렸소. 이건 그대의 보트 덕이오.']]);
      var f = fame('ex', 'strait'); log('마가야네스 해협 — 드레이크의 배들 앞에서 보트로 물길을 쟀다. 열엿새 만에 남쪽 바다로 나갔다. (믿음 ' + DC.trust() + ' · 탐험 명성 +' + f + ')');
    }
    b.seen.strait = v; refresh();
  }
  async function leg_storm() {
    var b = st();
    await withPic('dc_storm', '땅끝의 폭풍 (1578)', function () { return play([
      [null, '해협을 나오자마자 북서풍이 미친 듯이 불었다. 쉰 날 넘게 배들이 남쪽으로 밀린다. 산 같은 파도 너머로 메리골드호의 등불이 깜박이다가 꺼졌다. 엘리자베스호는 보이지 않는다.'],
      ['dc_drake', '(돛대를 붙잡고, 젖은 얼굴로) 그대도 여기까지 밀려왔군! 메리골드호를 잃었소. 스물아홉 명이오. 윈터의 엘리자베스호는 해협으로 되돌아갔는지 가라앉았는지 모르오.'],
      ['dc_drake', '(남쪽을 가리킨다) 그런데 보시오. 불의 땅이 섬들로 끝나고, 그 너머엔 바다뿐이오. 남쪽 대륙 따위는 없소. 대서양과 이 바다가 여기서 하나로 이어지오!']
    ]); });
    var v = await UI.ask('땅끝의 폭풍 — 흩어진 배들', [
      { label: '메리골드호를 찾아 바다를 뒤진다', value: 'search', icon: 'telescope' },
      { label: '드레이크와 함께 남쪽 끝 너머를 본다', value: 'south', icon: 'compass' },
      { label: '배를 지키며 물러난다', value: 'pass' }], me());
    if (v === 'search') {
      addTrust(1);
      await play([[null, '사흘을 뒤졌다. 떠다니는 노 한 자루와 부서진 물통 하나. 메리골드호의 이름이 새겨진 판자는 끝내 나오지 않았다.'], ['dc_drake', '(모자를 벗는다) 찾아 준 것만으로 됐소. 그들의 이름은 내가 일지에 적겠소.']]);
    } else if (v === 'south') {
      addTrust(1);
      if (G.Disc && G.Disc.addHint) { try { if (G.Disc.addHint('endstrait', 'lead:drake')) UI.toast('단서를 얻었다: 「' + ((G.DISC && G.DISC.endstrait && G.DISC.endstrait.name) || '땅끝 해협') + '」', 'scroll', 4200); } catch (e) { console.error(e); } }
      await play([[null, '드레이크는 보트를 타고 가장 남쪽의 섬에 내려 바위에 엎드렸다. 「세상의 가장 남쪽에 누운 사람」이 되겠다며 웃었다. 그 너머로 회색 바다가 끝없이 이어졌다.']]);
    }
    if (v !== 'pass') { var f = fame('ex', 'storm'); log('땅끝의 폭풍 — ' + (v === 'search' ? '사라진 메리골드호를 찾아 바다를 뒤졌다' : '드레이크와 함께 불의 땅 남쪽 끝 너머의 바다를 보았다') + '. (믿음 ' + DC.trust() + ' · 탐험 명성 +' + f + ')'); }
    b.seen.storm = v; refresh();
  }
  async function leg_chile() {
    var b = st(), s = S(), early = today() < 15781205, n = sup('herbs');
    await withPic('dc_chile', early ? '모카 섬의 화살 (1578)' : '발파라이소 (1578)', function () { return play([
      [null, '칠레 해안. 홀로 남은 골든 하인드호가 북쪽으로 올라간다. 모카 섬에서 물을 긷던 보트가 마푸체 사람들의 화살을 맞았다. 드레이크의 얼굴에 붕대가 감겨 있다.'],
      ['dc_drake', '(붕대를 가리키며 웃는다) 화살 하나가 눈 밑을 스쳤소. 섬사람들은 에스파냐 놈들인 줄 알았던 거지. 탓할 수도 없소. …선원 둘을 잃었소. 약이 모자라오.'],
      early ? ['dc_diego', '(드레이크 곁에서 에스파냐 말로 제독에게) 남쪽 바다의 에스파냐 놈들은 우리가 여기 있는 줄 몰라요. 발파라이소 항구에 큰 배 한 척이 포도주를 싣고 있대요. 총대장은 내일 거기 들어가요.'] : [null, '발파라이소 앞바다. 털린 배에서 끌려 나온 에스파냐 선원들이 바닷가로 헤엄쳐 간다. 골든 하인드호의 선창에 포도주 통과 금 상자가 들어간다.']
    ]); });
    var opts = [{ label: '약재 ' + n + '통을 건넨다', value: 'herbs', icon: 'bread', dis: !(s.fleet.cargo.herbs && s.fleet.cargo.herbs.q >= n) }];
    if (early) opts.push({ label: '내일 발파라이소에 함께 들어간다 (육상전 — 몫·악명·에스파냐의 적대)', value: 'raid', icon: 'sword' });
    opts.push({ label: '인사만 하고 지나간다', value: 'pass' });
    var v = await UI.ask('칠레 해안 — 다친 드레이크', opts, me());
    if (v === 'herbs' && s.fleet.cargo.herbs && s.fleet.cargo.herbs.q >= n) {
      s.fleet.cargo.herbs.q -= n; if (s.fleet.cargo.herbs.q <= 0) delete s.fleet.cargo.herbs; addTrust(1);
      await play([['dc_drake', '(약 냄새에 얼굴을 찡그리며) 쓰기도 하군. 그래도 이 쓴맛이 선원 셋을 살리겠소. 고맙소.']]);
      var f = fame('ex', 'chile'); log('칠레 해안 — 모카 섬에서 다친 드레이크의 선원들에게 약재 ' + n + '통을 건넸다. (믿음 ' + DC.trust() + ' · 탐험 명성 +' + f + ')');
    } else if (v === 'raid') {
      var r = await fight('발파라이소의 에스파냐 선원들', foe('valpo'), { leader: '「남쪽 바다의 대장선」 선장' });
      var g = r === 'win' ? (K().raid || {}).valpo || 1500 : Math.round(((K().raid || {}).valpo || 1500) / 3);
      s.player.gold += g; addTrust(1); var nt = noto('valpo'); hostile('valpo', '발파라이소 약탈');
      await play([[null, '발파라이소는 집 열 몇 채와 작은 교회뿐인 마을이었다. 사람들은 다 산으로 달아났다. 교회의 은잔과 제단포는 플레처 목사에게 넘어갔다.'], ['dc_drake', '(금 상자를 열어 보이며) 몫이오, 받으시오! 펠리페 왕의 수염이 한 올 그을렸소.']]);
      var f2 = fame('bt', 'valpo'); log('발파라이소 — 드레이크와 함께 항구의 배와 마을을 털었다. 몫 금화 ' + U.num(g) + '닢. (믿음 ' + DC.trust() + ' · 악명 +' + nt + ' · 전투 명성 +' + f2 + ')');
    }
    b.seen.chile = v; refresh();
  }
  async function leg_callao() {
    var b = st(), s = S();
    await withPic('dc_callao', '칼라오의 밤 (1579)', function () { return play([
      [null, '2월, 리마의 항구 칼라오 앞바다. 닻을 내린 에스파냐 배 서른 척. 대포를 단 배는 하나도 없다. 남쪽 바다에 적이 들어오리라고는 누구도 생각하지 않았다.'],
      ['dc_drake', intro()],
      ['dc_drake', '오늘 밤 저 배들의 닻줄을 모두 끊겠소. 배들이 바람에 흩어지면 쫓아올 놈이 없지. 그리고 들었소 — 은을 가득 실은 큰 배가 며칠 전에 파나마로 떠났다더군. 이름이 「누에스트라 세뇨라 데 라 콘셉시온」.']
    ]); });
    var v = await UI.ask('칼라오 — 닻줄을 끊는 밤', [
      { label: '보트를 내려 함께 닻줄을 끊는다 (육상전 — 몫·악명·에스파냐의 적대)', value: 'raid', icon: 'sword' },
      { label: '인사만 하고 지나간다', value: 'pass' }], me());
    if (v === 'raid') {
      var r = await fight('칼라오 부두의 에스파냐 병사들', foe('callao'), { leader: '칼라오 항구의 경비대장' });
      var g = r === 'win' ? (K().raid || {}).callao || 2200 : Math.round(((K().raid || {}).callao || 2200) / 3);
      s.player.gold += g; addTrust(1); var nt = noto('callao'); hostile('callao', '칼라오 약탈');
      await play([[null, '닻줄이 끊긴 배들이 어둠 속에서 서로 부딪치며 흘러갔다. 리마 쪽에서 종이 울리기 시작했다. 골든 하인드호는 벌써 북쪽으로 돛을 올리고 있었다.']]);
      var f = fame('bt', 'callao'); log('칼라오 — 드레이크와 함께 리마 항구의 닻줄을 끊고 은을 털었다. 몫 금화 ' + U.num(g) + '닢. (믿음 ' + DC.trust() + ' · 악명 +' + nt + ' · 전투 명성 +' + f + ')');
    }
    b.seen.callao = v; refresh();
  }
  async function leg_cacafuego() {
    var b = st(), s = S();
    await withPic('dc_cacafuego', '카카푸에고 (1579)', function () { return play([
      [null, '3월 1일, 적도 바다의 프란시스코 곶. 골든 하인드호가 물에 포도주 통을 매달아 끌며 일부러 느릿느릿 간다 — 돛을 다 올린 보물선이 다가오도록.'],
      ['dc_drake', '(망루의 소년을 가리키며) 저 녀석이 처음 돛을 본 상으로 금 사슬을 받을 거요. …자, 그대도 이 판에 끼겠소? 저 배의 선장 산 후안 데 안톤은 우리를 그냥 장사꾼 배로 알고 있소.'],
      ['dc_anton', '(멀리서, 다가오는 배에 손나팔로) 어느 나라 배요?! 페루의 배면 돛을 내리시오, 부왕의 배요!']
    ]); });
    var v = await UI.ask('카카푸에고 — 보물선을 사로잡는다', [
      { label: '보물선의 뒤를 막고 함께 쫓는다 (몫 — 은 상자 · 악명 · 에스파냐의 적대)', value: 'chase', icon: 'cannon' },
      { label: '인사만 하고 지나간다', value: 'pass' }], me());
    if (v === 'chase') {
      b.chest = 1; give('dc_chest'); addTrust(1); var nt = noto('cacafuego'); hostile('cacafuego', '카카푸에고');
      await play([
        [null, '골든 하인드호의 첫 포가 보물선의 뒷돛대를 부러뜨렸다. 제독의 배가 앞을 막자 안톤의 배는 돌아설 데가 없었다. 잉글랜드 사람들이 갈고리를 걸고 뱃전을 넘었다.'],
        ['dc_drake', '(갑판에 올라 웃으며) 돛을 내리시오, 안톤 선장. 걱정 마시오, 아무도 죽이지 않소. 은만 주시오. 아주 많이.'],
        ['dc_anton', '(은괴가 줄줄이 옮겨지는 것을 보며 기가 차서) 우리 배가 「불 뿜는 배」라고들 했는데… 이제 「은 뿜는 배」라고 부르시오. 나는 이제 은도 불도 없는 배요.'],
        ['dc_drake', '(봉인한 은 상자 하나를 제독에게 밀어 주며) 그대 몫이오. 잉글랜드에서 셈이 끝나면 런던 탑이 금화로 바꿔 줄 거요. 그때까지 이 상자는 열지 마시오. 여왕 폐하의 셈이 먼저요.']
      ]);
      var f = fame('bt', 'cacafuego'); log('카카푸에고 — 드레이크와 함께 보물선 「누에스트라 세뇨라 데 라 콘셉시온」을 사로잡았다. 「카카푸에고의 은 상자」(1580년 가을 잉글랜드에서 금화로). (믿음 ' + DC.trust() + ' · 악명 +' + nt + ' · 전투 명성 +' + f + ')');
    }
    b.seen.cacafuego = v; refresh();
  }
  async function leg_guatulco() {
    var b = st(), can = b.nuno || DC.trust() >= 2;
    await withPic('dc_guatulco', '과툴코의 바닷가 (1579)', function () { return play([
      [null, '누에바 에스파냐의 작은 항구 과툴코. 골든 하인드호가 물을 긷고 마을 교회에서 종을 떼어 간다. 보트 하나가 바닷가에 노인 하나를 내려 준다 — 해도 상자를 끌어안은 누누 다 실바다.'],
      ['dc_drake', '(보트를 가리키며) 누누는 여기 내려 주오. 열다섯 달 동안 좋은 길잡이였소. 이제부터 내가 갈 바다는 그도 모르는 바다요.'],
      ['dc_nuno', '(바닷가에 서서, 언덕 위의 에스파냐 병사들을 보며) …잉글랜드 해적과 열다섯 달을 함께 다닌 포르투갈 사람이라. 멕시코의 종교 재판소가 나를 무척 반기겠군.']
    ]); });
    var opts = [];
    if (can) opts.push({ label: '「내 배에 타시오, 누누」 — 누누 다 실바를 태운다', value: 'take', icon: 'people' });
    opts.push({ label: '지켜보고 지나간다', value: 'pass' });
    var v = await UI.ask('과툴코 — 바닷가에 남겨진 수로 안내인', opts, me());
    if (v === 'take' && can) {
      await play([
        ['dc_nuno', '(해도 상자를 고쳐 안으며) ' + (b.nuno ? '카보베르데에서 내 말을 하던 사람이군. 신께서 셈을 맞추셨소.' : '드레이크의 친구가 나를 데려가겠다고? 세상은 참 이상한 바다요.') + ' …타겠소. 종교 재판소의 나무 의자보다는 남의 배 갑판이 낫지.'],
        ['dc_drake', '(멀리서 모자를 흔들며) 누누를 잘 부탁하오! 그 사람 일지는 금보다 값지오. 다만 내 항로는 잊으라고 하시오!']
      ]);
      b.nunoJoin = 1;
      var m = (G.Legend && G.Legend.join) ? G.Legend.join('dc_nuno', G.CITY_DATA[S().loc && S().loc.city != null ? S().loc.city : 205]) : null;
      if (m) m.loyal = 80;
      var f = fame('so', 'guatulco');
      log('과툴코 — 드레이크가 내려 준 포르투갈 수로 안내인 누누 다 실바를 배에 태웠다. 그가 부하가 되었다. (사교 명성 +' + f + ')');
      UI.toast('누누 다 실바 — 브라질 바다를 아는 수로 안내인', 'people', 6000);
    }
    b.seen.guatulco = v; refresh();
  }
  async function leg_albion() {
    var b = st(), s = S(), n = sup('chile');
    await withPic('dc_albion', '노바 알비온 (1579)', function () { return play([
      [null, '북위 38도, 안개 낀 만. 골든 하인드호가 바닷가에 눕혀져 배 바닥을 손질한다. 언덕에서 깃털 관을 쓴 사람들이 내려와 노래하고, 여자들은 제 뺨을 할퀴며 운다. 그들은 잉글랜드 사람들을 죽은 조상이 돌아온 것으로 여긴다.'],
      ['dc_drake', intro()],
      ['dc_drake', '이 땅을 「노바 알비온」이라 부르겠소. 저 하얀 벼랑이 도버를 닮았거든. 여왕 폐하의 이름으로 기둥에 놋쇠 판을 박을 거요. …배 바닥이 엉망이오. 은이 너무 무거워서.'],
      ['dc_miwok', '(깃털 망토를 펼치며 드레이크의 머리에 깃털 관을 씌운다. 제독을 향해 손짓한다) …'],
      ['F', '저 어른이 우리에게도 무언가를 주려는 것 같습니다. 이 사람들은 받는 것보다 주는 것을 좋아하는군요.']
    ]); });
    var v = await UI.ask('노바 알비온 — 눕혀진 골든 하인드호', [
      { label: '배 바닥 손질을 돕고 식량 ' + n + '통을 나눈다', value: 'help', icon: 'hammer', dis: (s.fleet.food || 0) < n },
      { label: '인사만 하고 지나간다', value: 'pass' }], me());
    if (v === 'help' && s.fleet.food >= n) {
      s.fleet.food -= n; addTrust(1); give('dc_plate');
      await play([[null, '닷새 만에 배 바닥의 따개비가 긁혀 나가고 새 송진이 발렸다. 떠나는 날, 드레이크가 기둥의 놋쇠 판을 종이에 문질러 떠 주었다.'], ['dc_drake', '(탁본을 건네며) 그대도 이 땅에 있었다는 증거요. 언젠가 누가 이 판을 찾으면 우리 이야기를 믿겠지.']]);
      var f = fame('ex', 'albion'); log('노바 알비온 — 골든 하인드호의 배 바닥 손질을 도왔다. 「노바 알비온의 놋쇠 판 탁본」. (믿음 ' + DC.trust() + ' · 탐험 명성 +' + f + ')');
    }
    b.seen.albion = v; refresh();
  }
  async function leg_ternate() {
    var b = st(), s = S();
    await withPic('dc_ternate', '테르나테의 코라코라 (1579)', function () { return play([
      [null, '테르나테 앞바다. 노 젓는 사람이 백 명씩 탄 코라코라 배 네 척이 북을 울리며 골든 하인드호를 둘러싼다. 가운데 배의 차양 아래 금실 터번의 사내가 앉아 있다.'],
      ['dc_babullah', '(느긋하게 웃으며) 포르투갈 사람들은 내 아버지를 죽였소. 그래서 내가 그들을 이 섬에서 몰아냈지. 그대들은 포르투갈 사람도 에스파냐 사람도 아니라 하니, 정향을 팔겠소. 대신 그대들의 여왕에게 내 이름을 전하시오.'],
      ['dc_drake', '(제독에게) 정향이 산더미요. 그런데 내 배엔 은이 너무 많아서 정향 실을 자리가 모자라오. 그대 배에 좀 싣겠소? 술탄이 그대 값도 쳐 줄 거요.']
    ]); });
    addTrust(1);
    var q = await buy('clove', K().clove || { n: 30, k: 0.45 }, TERNATE, H('dc_babullah'));
    b.clove = q;
    await play([['dc_babullah', q ? '(정향 자루가 넘어가는 것을 보며) 그대도 이 섬의 친구요. 포르투갈 배만 아니면 언제든 오시오.' : '(어깨를 으쓱하며) 다음에 오시오. 정향나무는 해마다 꽃을 피우오.']]);
    var f = fame('so', 'ternate'); log('테르나테 — 술탄 바불라와 드레이크의 흥정 자리에 함께했다.' + (q ? ' 정향 ' + q + '통.' : '') + ' (믿음 ' + DC.trust() + ' · 사교 명성 +' + f + ')');
    b.seen.ternate = q ? 'buy' : 'met'; refresh();
  }
  async function leg_reef() {
    var b = st();
    await withPic('dc_reef', '셀레베스의 산호초 (1580)', function () { return play([
      [null, '1580년 1월 9일 밤, 셀레베스 앞바다. 순풍에 달리던 골든 하인드호가 물속의 산호초에 올라앉았다. 배가 기울고, 선원들이 무릎을 꿇고 기도한다. 썰물이 오면 배가 부서진다.'],
      ['dc_drake', '(갑판에서 외친다) 대포 여덟 문을 버려라! 정향 세 톤도! 밀가루도! …그대, 하느님이 보내셨군. 그대 배로 밧줄을 걸어 주시오. 바람이 바뀌기 전에!'],
      ['dc_fletcher', '(무릎을 꿇은 채) 이건 하느님의 벌이오! 다우티를 죽인 죄의…'],
      ['dc_drake', '(목사를 노려본다) 플레처, 한 마디만 더 하면 그대를 파문하겠소. 목사를 파문하는 총대장은 세상에 나 하나일 거요!']
    ]); });
    var v = await UI.ask('산호초 — 걸린 골든 하인드호', [
      { label: '밧줄을 걸어 골든 하인드호를 끌어낸다', value: 'tow', icon: 'anchor' },
      { label: '지켜본다', value: 'pass' }], me());
    if (v === 'tow') {
      addTrust(2); give('dc_plank');
      await play([
        [null, '스무 시간을 버틴 끝에 바람이 바뀌었다. 제독의 배가 밧줄을 당기자 골든 하인드호가 몸을 떨며 산호에서 미끄러져 깊은 물로 내려앉았다. 갑판에서 함성이 터졌다.'],
        ['dc_drake', '(배 바닥에서 갈아 낸 참나무 판자 하나를 건넨다) 이 배가 나를 놓지 않았듯 그대도 나를 놓지 않았소. 받아 두시오. …그리고 우리가 버린 정향 말이오, 바다에 뜬 걸 그대가 건지면 그건 그대 것이오. 싸게 쳐 주리다.']
      ]);
      b.reefClove = await buy('clove', K().reef || { n: 15, k: 0.3 }, TERNATE, H('dc_drake'));
      var f = fame('ex', 'reef'); log('셀레베스 앞바다 — 산호초에 걸린 골든 하인드호를 밧줄로 끌어냈다. 「골든 하인드호의 판자」. (믿음 ' + DC.trust() + ' · 탐험 명성 +' + f + ')');
    }
    b.seen.reef = v; refresh();
  }
  async function leg_cape() {
    var b = st(), s = S(), n = sup('cape');
    await withPic('dc_cape', '가장 아름다운 곶 (1580)', function () { return play([
      [null, '아프리카 남쪽 끝. 바다는 잔잔하고, 높은 탁자 같은 산 위로 흰 구름이 덮였다. 골든 하인드호의 물통은 바닥이 보인다. 사람들은 하루에 물 세 모금씩만 마신다.'],
      ['dc_drake', intro()],
      ['dc_drake', '(곶을 바라보며) 포르투갈 놈들은 이 곶을 폭풍의 곶이라 했다지. 거짓말이오. 이건 지구를 한 바퀴 돌며 본 곶 가운데 가장 아름다운 곶이오. …물만 있으면 더 아름다울 텐데.']
    ]); });
    var v = await UI.ask('희망봉 — 마지막 바다', [
      { label: '물과 식량을 ' + n + '통씩 나눠 준다', value: 'give', icon: 'drop', dis: (s.fleet.food || 0) < n || (s.fleet.water || 0) < n },
      { label: '인사만 하고 지나간다', value: 'pass' }], me());
    if (v === 'give' && s.fleet.food >= n && s.fleet.water >= n) {
      s.fleet.food -= n; s.fleet.water -= n; addTrust(1);
      await play([['dc_drake', '(물을 한 바가지 들이켜고) 이제 플리머스까지 가겠소! 플리머스 앞바다에서 그대 이름을 크게 부르리다.']]);
      var f = fame('ex', 'cape'); log('희망봉 — 물이 떨어진 골든 하인드호에 물과 식량을 ' + n + '통씩 나눴다. (믿음 ' + DC.trust() + ' · 탐험 명성 +' + f + ')');
    }
    b.seen.cape = v; refresh();
  }

  // ── 에스파냐 쪽: 부왕의 허가장으로 쫓는 사냥 — 골든 하인드호와 큰 해전
  async function leg_hunt() {
    var b = st(), k = K(), hk = k.hunt || {};
    b.hunt = 'met';
    await play([
      [null, '수평선에 돛 하나. 고물에 금빛 암사슴을 단 배 — 골든 하인드호다. 선창이 은으로 무거워 물에 깊이 잠겼다.'],
      ['dc_drake', st().trust > 0 ? '(망원경을 내리고 쓴웃음) 그대였소? 리마의 부왕이 내 뒤에 누구를 붙였나 했더니. …좋소, 바다의 셈은 대포로 하지.' : '(망원경을 내리고) 부왕의 개로군. 대포를 열어라! 저 배에 은 한 닢도 넘기지 마라!']
    ]);
    var spec = { id: 'dc_hunt', foe: '잉글랜드', foeLabel: '골든 하인드호 (드레이크)', ships: (hk.ships || ['galleon']).slice(), names: ['골든 하인드호'], allies: [], noPrize: true,
      ask: '부왕의 허가장 — 골든 하인드호와 싸우겠습니까?', fightLabel: '대포를 연다', noLabel: '물러난다',
      decline: '…저 배가 은을 싣고 수평선 너머로 멀어진다.',
      win: { gold: hk.gold || 5000, so: hk.so || 160, text: '골든 하인드호의 돛대가 부러지고 뱃전이 뚫렸다! 그러나 그 배는 밤안개 속으로 미끄러져 사라졌다 — 부왕이 허가장대로 상금을 내린다.' },
      lose: '골든 하인드호의 대포에 밀려 물러났다. 드레이크는 북쪽으로 달아났다.',
      onWin: function () { var bb = st(); bb.hunt = 'won'; bb.foe = true; trustSp('es_peru', 10); trustSp('es_crown', 5); fame('bt', 'hunt'); drop('dc_commission'); log('부왕의 허가장 — 골든 하인드호와 싸워 크게 부쉈다. 드레이크는 밤안개 속으로 달아났다(역사대로 그는 잉글랜드로 돌아간다). 페루 부왕의 신뢰 +10.'); },
      onLose: function () { var bb = st(); bb.hunt = 'lost'; bb.foe = true; } };
    if (G.Rel && G.Rel.register && G.Rel.greatBattle) {
      G.Rel.register(spec);
      var rs = S().rel; if (rs && rs.battle) delete rs.battle.dc_hunt;
      var went = await G.Rel.greatBattle(spec);
      if (!went) { b.hunt = 'declined'; }
    } else { b.hunt = 'won'; b.foe = true; }
    refresh();
  }

  // ================================================================ 에스파냐 쪽: 리마의 부왕 (1579.2.14~4.30) · 파나마에 알린다
  function limaOpen() {
    var b = st(), t = today();
    if (!b || b.side || b.seen.lima || cityNow() !== LIMA || t < D.limaFrom || t > D.limaTo) return false;
    if (b.seen.callao === 'raid' || b.seen.cacafuego === 'chase' || b.seen.chile === 'raid') return false;   // 해적과 한패였다
    return true;
  }
  async function lima() {
    var b = st(), s = S(), k = K();
    await withPic('dc_lima', '리마의 부왕 (1579)', function () { return play([
      [null, '리마, 부왕의 궁. 칼라오에서 끊긴 닻줄 다발이 회랑에 쌓여 있다. 늙은 부왕이 지팡이로 바닥을 친다.'],
      ['dc_toledo', '잉글랜드 해적 「드라케」가 마가야네스 해협을 넘어 들어왔소! 남쪽 바다에 대포 단 배가 한 척도 없다는 걸 그놈이 알았던 거요. 은을 실은 배가 파나마로 가는 중인데…'],
      ['dc_sarmiento', '(해도를 펴며) 각하, 그자는 북쪽으로 갔습니다. 저는 남쪽 해협으로 돌아오는 길목을 막겠습니다. 그자가 같은 길로 돌아온다면 말이지요. …저 남만 선장의 배가 북쪽을 쫓는다면 좋겠군요.'],
      ['dc_toledo', '(제독을 돌아본다) 그대 배는 빠르다지. 내 허가장을 받겠소? 그 해적의 배를 부수면 왕의 이름으로 상을 내리겠소. 아니면 파나마에 이 소식만이라도 먼저 전해 주시오.']
    ]); });
    var v = await UI.ask('리마의 부왕 — 잉글랜드 해적 「드라케」', [
      { label: '허가장을 받고 드레이크를 쫓는다 (바다에서 그의 배를 만나면 큰 해전)', value: 'hunt', icon: 'cannon' },
      { label: '파나마에 소식을 전한다 (3월 31일까지 파나마)', value: 'warn', icon: 'scroll' },
      { label: '사양한다', value: 'no' }], me());
    b.seen.lima = v;
    if (v === 'hunt') {
      b.side = 'es'; b.commission = 1; give('dc_commission');
      UI.toast('페루 부왕의 허가장 — 1579년 7월까지 바다에서 골든 하인드호를 만나면', 'scroll', 6000);
      log('리마 — 부왕 톨레도에게서 잉글랜드 해적 드레이크를 쫓는 허가장을 받았다. 바다에서 그의 배를 만나면 싸울 수 있다.');
    } else if (v === 'warn') {
      b.side = 'es'; b.warn = 'carry';
      UI.toast('부왕의 편지 — 3월 31일까지 파나마의 총독에게', 'scroll', 6000);
      log('리마 — 드레이크가 칼라오를 털었다는 부왕의 편지를 받았다. 3월 31일까지 파나마에 전한다.');
    }
    refresh();
  }
  function warnOpen() { var b = st(), t = today(); return !!(b && b.warn === 'carry' && cityNow() === PANAMA && t <= D.warnTo); }
  async function warnPanama() {
    var b = st(), s = S(), g = K().warn || 1200, late = today() > NEWS_AT.cacafuego;
    b.warn = 'done'; s.player.gold += g; trustSp('es_panama', 8); trustSp('es_peru', 4);
    await play([
      [null, '파나마, 총독의 집. 땀에 젖은 관리들이 부왕의 봉인을 뜯는다.'],
      [{ name: '파나마 총독', lang: 0 }, late ? '…알고 있소. 「콘셉시온」호가 털렸다는 소식이 어제 닿았소. 그래도 부왕의 편지를 들고 이 먼 길을 온 사람에게 사례는 해야지. 해안의 망루마다 불을 피우게 하겠소.' : '이 소식이 그 해적보다 먼저 닿았군! 해안의 망루마다 불을 피우고, 은 실은 배는 항구에 묶어 두겠소. 사례를 받으시오.']
    ]);
    var f = fame('so', 'warn');
    log('파나마 — 부왕의 편지를 전했다. 사례 금화 ' + U.num(g) + '닢. (파나마 총독의 신뢰 +8 · 사교 명성 +' + f + ')');
    refresh();
  }

  // ================================================================ ⑮ 런던 — 다우티의 편지 · 뎃퍼드의 기사
  function letterOpen() { var b = st(), t = today(); return !!(b && b.letter === 'carry' && R.hasItem && R.hasItem('dc_letter') && cityNow() === LONDON && t >= D.letterFrom && t <= D.letterTo); }
  async function letter() {
    var b = st();
    b.letter = 'given'; drop('dc_letter');
    await withPic('dc_john', '존 다우티 (1580)', function () { return play([
      [null, '런던, 템스 강가의 좁은 셋방. 검은 상복의 젊은이가 형의 반지 자국이 찍힌 밀랍을 한참 쓰다듬는다.'],
      ['dc_john', '(편지를 다 읽고, 오래 말이 없다가) …원망은 한 줄도 없군요. 형다워요. 끝까지 신사였어요. (편지를 접으며 주먹을 쥔다) 그래도 나는 그 사람을 법정에 세울 거예요. 형이 못 한 것을 내가 하겠어요.']
    ]); });
    var f = G.Fame ? G.Fame.add('so', 40) : 0;
    log('런던 — 토머스 다우티의 마지막 편지를 아우 존에게 전했다. 존은 드레이크를 법정에 세우겠다고 했다. (사교 명성 +' + f + ')');
    refresh();
  }
  function knightOpen() {
    var b = st(), t = today();
    return !!(b && !b.knight && !isFoe() && b.side !== 'es' && DC.trust() >= DC.need() && cityNow() === LONDON && t >= D.knFrom && t <= D.knTo);
  }
  async function deptford() {
    var b = st(), s = S();
    b.knight = 1; b.told.knight = 1;
    await withPic('dc_deptford', '뎃퍼드의 기사 (1581.4.4)', function () { return play([
      [null, '1581년 4월 4일, 템스 강가 뎃퍼드. 골든 하인드호의 갑판에 비단 차양이 쳐지고, 강둑에 런던 사람들이 새까맣게 모였다. 사람이 너무 많아 다리 하나가 무너졌다.'],
      ['dc_drake', '(새 비단 옷에 금 사슬, 제독을 끌어당기며) 왔군! 그대는 내 곁에 서시오. 남쪽 바다에서, 산호초에서 나를 놓지 않은 사람이오. 여왕 폐하께 그대 이야기를 했소.'],
      [QUEEN, '(금빛 칼을 들고 웃는다) 에스파냐 왕이 이 자의 목을 내놓으라 하는군요. 그래서 금칼로 치겠다고 했지요. …그런데 내가 치면 펠리페가 더 화를 내겠지. 마르쇼몽 경, 그대가 하시오.'],
      ['dc_marchaumont', '(정중하게 칼을 받아 드레이크의 어깨를 친다) 일어나시오, 프랜시스 드레이크 경.'],
      [QUEEN, '(제독을 돌아본다) 그대가 그 배를 산호초에서 끌어냈다는 사람이군요. 잉글랜드는 빚을 잊지 않아요. 기억하겠어요.']
    ]); });
    trustSp('en_king', 10);
    var f = fame('so', 'deptford');
    if (!R.hasItem('dc_plank')) give('dc_plank');
    log('1581년 4월 4일 뎃퍼드 — 골든 하인드호 갑판에서 드레이크가 기사가 되는 자리에 그의 곁에 섰다. 「골든 하인드호의 판자」. (잉글랜드 국왕의 신뢰 +10 · 사교 명성 +' + f + ')');
    UI.toast('뎃퍼드 — 프랜시스 드레이크 경', 'crown', 6000);
    refresh();
  }

  // ================================================================ 만나는 곳
  var SEA = { atl: leg_atl, plata: leg_plata, julian: leg_julian, strait: leg_strait, storm: leg_storm, chile: leg_chile, callao: leg_callao, cacafuego: leg_cacafuego,
    guatulco: leg_guatulco, albion: leg_albion, ternate: leg_ternate, reef: leg_reef, cape: leg_cape, hunt: leg_hunt };
  DC.pending = function () { return !!(S() && (lonOpen() || limaOpen() || warnOpen() || letterOpen() || knightOpen())); };
  DC.check = async function () {
    if (DC._busy) return false; DC._busy = true;
    try {
      if (lonOpen()) await london();
      if (limaOpen()) await lima();
      if (warnOpen()) await warnPanama();
      if (knightOpen()) await deptford();
      if (letterOpen()) await letter();
    } catch (e) { console.error(e); }
    DC._busy = false; refresh();
    return true;
  };
  DC.seaPending = function () { var s = S(); return !!(s && s.loc && s.loc.mode === 'sea' && legOpen(false)); };
  DC.atSea = async function () {
    if (DC._busy) return false; DC._busy = true;
    try { var L = legOpen(false); if (L) await SEA[L.key](); } catch (e) { console.error(e); }
    DC._busy = false; refresh();
    return true;
  };
  /** 바다에서 함대에 신호를 보내 「선장과 이야기한다」 (js/systems/seafolk.js SF.talk) — 드레이크의 함대면 늘 이 사건이 맡는다(true) */
  DC.talk = async function (n, who) {
    if (!n || !n.exp || n.exp.id !== 'drake') return false;
    if (DC._busy) return true;
    var b = st(); if (!b) return true;
    if (huntOpen()) { DC._busy = true; try { await leg_hunt(); } catch (e) { console.error(e); } DC._busy = false; refresh(); return true; }
    if (isFoe() || b.side === 'es') { await UI.say('(고물에서 드레이크가 등을 돌린다) 그대와 나눌 말은 없소. 대포 사정거리 밖으로 물러나시오.', H('dc_drake')); return true; }
    var L = legOpen(true);
    if (!L) { await UI.say('(뱃전에서 모자를 흔든다) 좋은 바람이오! 잉글랜드의 드레이크요. 우리는 갈 길이 멀어 오래 서 있을 수 없소. 바다에서 또 봅시다!', H('dc_drake')); return true; }
    DC._busy = true;
    try { await SEA[L.key](); } catch (e) { console.error(e); }
    DC._busy = false; refresh();
    return true;
  };
  /** 지도의 함대를 바다에서 쳐부쉈다 (js/systems/seafolk.js afterBattle — noDelay) */
  DC.beaten = function (lines) {
    var b = st(); if (!b) return;
    b.beat = true; b.foe = true;
    var msg = '드레이크의 골든 하인드호가 크게 부서졌다. 그러나 그 배는 밤 사이 수평선 너머로 달아났다.';
    if (b.commission && !b.hunt) { b.hunt = 'won'; var g = (K().hunt || {}).gold || 5000; S().player.gold += g; trustSp('es_peru', 10); drop('dc_commission'); msg += ' 페루 부왕이 허가장대로 상금 금화 ' + U.num(g) + '닢을 내린다.'; }
    log(msg);
    if (lines) lines.push('<b>' + U.esc(msg) + '</b>');
  };

  // ================================================================ 일지의 할 일
  DC.html = function () {
    var s0 = S(), b = s0 && s0.drakeCirc; if (!b) return '';
    var t = today(), li = [], tr = DC.trust(), need = DC.need();
    if (b.letter === 'carry' && t <= D.letterTo) li.push('다우티의 마지막 편지 — ' + (t < D.letterFrom ? '1580년 10월부터 ' : '') + '런던의 아우 존 다우티에게');
    if (b.warn === 'carry' && t <= D.warnTo) li.push('부왕의 편지 — 1579년 3월 31일까지 파나마의 총독에게');
    if (huntOpen()) li.push('페루 부왕의 허가장 — 1579년 7월까지 바다에서 골든 하인드호를 만나면 싸울 수 있다');
    if (!isFoe() && b.side !== 'es') {
      if ((t >= 15771214 || b.seen.london) && t <= 15800731) {
        var next = LEGS.filter(function (L) { return !b.seen[L.key] && t <= L.to; })[0];
        if (next) li.push('바다에서 드레이크의 함대를 만나면 (' + Math.floor(next.from / 10000) + '년 ' + (Math.floor(next.from / 100) % 100) + '월~' + Math.floor(next.to / 10000) + '년 ' + (Math.floor(next.to / 100) % 100) + '월)');
      }
      if (!b.knight && t <= D.knTo && (b.seen.london || t >= 15771214)) li.push('드레이크의 믿음 ' + Math.max(0, tr) + ' — 1581년 4월 런던(뎃퍼드)에 그가 부르려면 ' + need + ' 이상');
    }
    if (!b.seen.london && t >= D.lonFrom && t <= D.lonTo) li.push('1577년 5월~11월 런던 — 드레이크의 「알렉산드리아 무역」 원정');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">세상을 한 바퀴 — 드레이크</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._dcHtml) { G.Court._dcHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + DC.html(); }; }
  DC._t = { london: london, lima: lima, legs: SEA, deptford: deptford, letter: letter, warnPanama: warnPanama };
})(window.G = window.G || {});
