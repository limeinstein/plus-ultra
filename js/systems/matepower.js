/* 권력자는 부하 후보가 아니다 (G.MatePower) — 2026-10-29 사용자 요청
   「이벤트에서 후원자 급의 권력을 가진 인물은 부하 후보로 등장하지 않게 — 왕, 왕비, 사령관, 대귀족, 총리, 수상, 추기경, 교황, 다이묘, 라이벌 등」
   ■ 막는 사람 (동료 자료 G.MATES는 그대로 두고 — 얼굴·대사에 쓰인다 — 부하로 맞을 수 있는 후보로만 나오지 않게 한다)
     ① 저절로: 후원자 자리에 앉는 사람(G.SPONSORS holders · G.RULERS) · 나라의 군주(G.NATION_LEADERS) · 경쟁 탐험가(G.RIVAL_STAYS · G.RIVAL_VOYAGES)와 이름이 같은 동료
        — 앞으로 사건·후원자·라이벌을 더해도 이름만 같으면 저절로 막힌다. (이름 세 글자 이상만 — 두 글자 이름은 우연히 겹치기 쉬워서)
     ② 손으로: 사건에 군주·사령관·족장으로 나오지만 위 표에는 없는 사람 (아래 BLOCK)
   ■ 막히면: 술집 손님·술집 주인의 귀띔·여급의 행방 찾기·수첩 「철새」·바다에서 남의 배를 모는 항해사·상선대 선장 세대교체에 나오지 않고 (G.Frontier.mateReady),
     사건도 이들을 부하로 들이지 않는다(아즈텍: 구한 쿠아우테목은 마야 해안에 내린다).
     단, 바다에서 기함을 사로잡은 이름난 선장(바르바로사·투르구트·드레이크 …)은 권력자여도 철새가 되어 부하 후보가 된다 (state.capFreed — 사용자 결정 2026-10-29).
     이미 함대에 있는 사람(옛 저장)은 그대로 둔다.
   ■ 동료에 noWander: true 를 붙여도 막힌다 (새 사건 동료를 만들 때). 반대로 wander: true 이거나 ALLOW에 있으면 ①에 걸려도 부하 후보로 둔다. */
(function (G) {
  'use strict';
  var MP = G.MatePower = {};
  // ② 사건에 권력자로 나오는 동료 — id: 까닭
  var BLOCK = {
    kisk: '콩고 왕 은징가 아 은쿠우 (포르투갈과 콩고 — js/systems/kongo.js · 콩고 왕국의 군주 표)',
    h_nezahualpilli: '텍스코코의 왕 (군주 표 dominion_notes)',
    h_caonabo: '마과나의 카시케 (신세계의 첫 만남 — js/systems/newworld.js)',
    h_anacaona: '하라과의 여성 카시케 (신세계의 첫 만남)',
    h_enriquillo: '바오루코 산의 카시케·반란 지도자 (신세계의 첫 만남)',
    h_suriyothai: '아유타야의 왕비 (궁정 혼담 — js/data/court.js)',
    drake: '잉글랜드 해군 부사령관 (칼레 해전 — js/systems/tudor.js)',
    h_turgut: '오스만 함대의 사령관 (바르바로사 — js/systems/barbarossa.js)',
    h_yoshitaka: '오다 가문의 수군 대장·다이묘 (철포 삼백 자루 — js/systems/teppo.js)'
  };
  MP.BLOCK = BLOCK;
  // 후원자 자리에 있어도 권력자가 아닌 사람 — 사건이 일부러 부하로 들인다
  var ALLOW = {
    leonardo: '레오나르도 다 빈치 — 화가·발명가 (밤샘 이야기 뒤 배에 오른다 — js/systems/leonardo.js)',
    piri: '피리 레이스 — 사용자 결정(2026-10-29): 라이벌이지만 부하 후보로 둔다',
    h_zhengchenggong: '정성공 — 사용자 결정(2026-10-29): 동녕 왕국의 군주이지만 부하 후보로 둔다'
  };
  MP.ALLOW = ALLOW;
  var AUTO = null;
  function esc(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function build() {
    // 자리 이름이 붙은 사람(「통제사 이순신」「4개 영주국 공동 통치(시코텐카틀 1세·…)」)도 찾도록 낱말 경계로 본다
    var seats = [];
    function put(n, why) { n = String(n || '').trim(); if (n) seats.push([n, why]); }
    (G.SPONSORS || []).forEach(function (sp) { (sp.holders || []).forEach(function (h) { put(h[2], '후원자 (' + (sp.title || sp.id) + ')'); }); });
    Object.keys(G.RULERS || {}).forEach(function (k) { (G.RULERS[k] || []).forEach(function (h) { put(h[2], '후원자의 대 (' + k + ')'); }); });
    Object.keys(G.NATION_LEADERS || {}).forEach(function (k) { (G.NATION_LEADERS[k] || []).forEach(function (h) { if (h) put(h[2], '나라의 군주 (' + k + ')'); }); });
    var rivals = {};
    Object.keys(G.RIVAL_STAYS || {}).forEach(function (n) { rivals[n] = 1; });
    (G.RIVAL_VOYAGES || []).forEach(function (v) { if (v && v.who) rivals[v.who] = 1; });
    AUTO = {};
    (G.MATES || []).forEach(function (m) {
      if (!m || !m.name || m.wd || m.witch || m.tale || m.eventOnly) return;   // 철새·마녀 · 옛이야기·사건 전용 동료는 어차피 술집에 나오지 않는다
      var n = m.name, why = rivals[n] ? '경쟁 탐험가(라이벌)' : '';
      if (!why && n.length >= 3) {
        var re = new RegExp('(^|[\\s(·,/])' + esc(n) + '($|[\\s)·,/(])');
        for (var i = 0; i < seats.length; i++) if (seats[i][0] === n || re.test(seats[i][0])) { why = seats[i][1]; break; }
      }
      if (why) AUTO[m.id] = why;
    });
  }
  /** 이 사람을 부하 후보로 내지 않는 까닭 (없으면 '') */
  MP.why = function (m) {
    if (!m) return '';
    if (m.wander || ALLOW[m.id]) return '';
    var s = G.Game && G.Game.state; if (s && s.capFreed && s.capFreed[m.id]) return '';   // 바다에서 사로잡아 풀어 준 선장 (js/systems/seacaptains.js) — 사용자 결정(2026-10-29)
    if (m.noWander) return typeof m.noWander === 'string' ? m.noWander : '사건 속 권력자';
    if (BLOCK[m.id]) return BLOCK[m.id];
    if (!AUTO) build();
    return AUTO[m.id] || '';
  };
  MP.blocked = function (m) { return !!MP.why(m); };
  /** 막힌 사람 목록 (시험·문서용): [{id, name, why}] */
  MP.list = function () { return (G.MATES || []).filter(MP.blocked).map(function (m) { return { id: m.id, name: m.name, why: MP.why(m) }; }); };
  MP.rebuild = function () { AUTO = null; };

  // ---------------------------------------------------------------- 끼어들기
  function hook() {
    var F = G.Frontier;
    if (F && F.mateReady && !F._powerWrap) {
      F._powerWrap = true;
      var mr = F.mateReady;
      F.mateReady = function (m) { if (MP.blocked(m)) return false; return mr.apply(this, arguments); };
    }
    var MK = G.MateKnow;
    if (MK && !MK._powerWrap) {
      MK._powerWrap = true;
      // 수첩 「철새」의 「소식을 아는 항해사」 — 옛 저장에 이미 들은 권력자의 소식이 있어도 올리지 않는다
      if (MK.list) { var ls = MK.list; MK.list = function () { return (ls.apply(this, arguments) || []).filter(function (d) { return !MP.blocked(d); }); }; }
      // 여급에게 이름으로 행방을 부탁해도 찾지 못한다
      if (MK.byName) { var bn = MK.byName; MK.byName = function () { return (bn.apply(this, arguments) || []).filter(function (d) { return !MP.blocked(d); }); }; }
    }
  }
  MP.hook = hook;
  hook();
})(window.G = window.G || {});
