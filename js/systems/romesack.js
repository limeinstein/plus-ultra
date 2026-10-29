/* 1527년 로마 약탈 (G.RomeSack) 2026-10-29 사용자 요청
   「신성로마제국 황제 측 군대가 로마를 약탈하면서 교황권과 이탈리아 정치에 큰 충격 · 마키아벨리와 이탈리아인들은 치를 떨고 ·
     이들의 공격으로부터 로마를 지키면 군주론 · 클레멘스 7세를 도피시키는 내용까지 · 보상으로 명예 작위 · 부하들이 약탈꾼을 약탈한 돈 —
     하지만 이탈리아인들에게 기부하면 귀한 선수상」
   사람·물건·조정값: js/data/romesack.js (G.HIST_FIG · G.ITEM.il_principe · G.FIGUREHEAD.r_santangelo · G.BALANCE.romeSack)
   역사는 바뀌지 않는다 — 로마는 1527년 5월 6일에 무너지고 여드레 넘게 약탈당한다. 바뀌는 것은 제독이 그날 성벽과 회랑에서 무엇을 지켜 냈는가다.
   ■ ① 동맹 진영의 경고 (1527.3.1~5.3, 피렌체·피사): 마키아벨리와 귀차르디니 — 급료를 못 받은 황제군이 남쪽으로 내려온다. 「로마로 가 주시오」
   ■ ② 안개 낀 성벽 (1527.4.15~5.6, 로마): 5월 6일 새벽 안개 속에 부르봉 공작의 황제군이 보르고의 성벽에 사다리를 건다.
        일찍 왔으면 5월 5일까지 로마에 머물며 기다린다(날이 지나간다). (가) 성벽을 지킨다(육상전 110) — 흰 망토의 부르봉 공작이 사다리 위에서 총에 맞는다
        (나) 곧장 바티칸으로 (다) 로마를 떠난다
        → 교황 클레멘스 7세를 산탄젤로성으로: 스위스 근위대가 성 베드로 대성당 계단에서 마지막까지 버티는 사이, 비밀 회랑 「파세토」를 달린다 (퇴각 판 — 적의 차례 hold번)
        → 약탈의 여드레: 부하들이 짐을 잔뜩 진 약탈꾼 무리를 덮친다(육상전 35) — 되찾은 금은을 (가) 부하들의 몫으로(금화 loot) (나) 로마 사람들에게 기부한다(「산탄젤로의 천사상」 선수상)
        성벽을 지켰거나 교황을 산탄젤로성까지 데려갔으면 「로마를 지켰다」(defended)
   ■ ③ 마키아벨리의 분노 (1527.5.7~6.20, 피렌체·피사·로마 — 로마를 지켰으면): 이탈리아를 짓밟은 야만에 치를 떠는 마키아벨리가 『군주론』 필사본을 건넨다 (지력 +2).
        만나지 못하고 6월 21일(그의 죽음)이 지나면 귀차르디니가 편지와 함께 보낸다
   ■ ④ 행상인 옷을 입은 교황 (1527.11.1~12.6, 로마): 산탄젤로성에 갇힌 교황을 빼낸다 — (가) 행상 수레에 숨겨 북문으로(웅변) — 들키면 에스파냐 장교와 일기토
        (나) 장교를 매수(금화 bribe) (다) 끼지 않는다 → 오르비에토로. 해내면 교황청의 명예 작위(황금 박차 기사 → 라테라노 궁정백)
   ■ 소식: 메디치가 피렌체에서 쫓겨나다(5.17) · 교황의 항복과 몸값(6.6) · 마키아벨리의 죽음(6.21) · 교황의 탈출(12.7) · 볼로냐의 대관식(1530.2.24) · 『군주론』이 책으로(1532)
     (5.6의 「로마 약탈」 소식은 이미 G.REL_EVENTS rf_sack에 있다)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/romesack_*.webp — 개발노트에 그림 주문
   ■ 저장: s.romeSack = { met, warn, wall: 'win'|'lose'|'skip'|'leave', escort: 'win'|'lose', defended, loot: 'keep'|'donate'|'lost', prince, flee: 'hide'|'bribe'|'no', fleeRes, title, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var RS = G.RomeSack = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.romeSack) || {}; }
  var ROME = 33, FLORENCE = 30, PISA = 31;
  var D = RS.D = { warnFrom: 15270301, warnTo: 15270503, wallFrom: 15270415, sack: 15270506, sackEnd: 15270514, machFrom: 15270507, machTo: 15270620,
    medici: 15270517, surrender: 15270606, machDeath: 15270621, fleeFrom: 15271101, fleeTo: 15271206, escape: 15271207, crown: 15300224, print: 15320101 };
  var NEWS_AT = { medici: D.medici, surrender: D.surrender, machDeath: D.machDeath, escape: D.escape, crown: D.crown, print: D.print };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.romeSack) {
      s.romeSack = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.romeSack.told[k] = 1; });   // 옛 저장
    }
    if (!s.romeSack.told) s.romeSack.told = {};
    return s.romeSack;
  }
  RS.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  var LANDSK = 'rs_landsknecht', ROMAN = 'rs_roman', SPOFF = 'rs_spanish_officer';
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      await UI.say(l[1], l[0] === 'P' ? me() : l[0] && typeof l[0] === 'object' ? l[0] : l[0] ? H(l[0]) : {});
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function trust(ids, n) {
    if (!G.Sponsor || !G.SPONSOR) return;
    ids.forEach(function (id) { if (G.SPONSOR[id]) { var r = G.Sponsor.rel(id); if (r.met || n < 0) G.Sponsor.addTrust(r, n); } });
  }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  /** 소지품에 넣는다 — 칸이 차도 받는다 (다시 얻을 수 없는 물건) */
  function give(id, extra) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id, extra) : false; if (!ok) { var o = { id: id }; for (var k in (extra || {})) o[k] = extra[k]; s.player.items.push(o); } }
  async function landBattle(name, n, kind, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, n, false, Object.assign({ kind: kind, guns: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }

  // ================================================================ 날마다 — 소식
  RS.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!b.met;
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('medici', met, 'castle', '【피렌체】 로마 약탈 소식에 피렌체 사람들이 들고일어나 메디치 가를 몰아내고 공화국을 되살렸다. 메디치 교황이 산탄젤로성에 갇혀 있는 사이의 일이다.');
    news('surrender', met, 'scroll', '【교황의 항복】 산탄젤로성에서 한 달을 버틴 교황 클레멘스 7세가 황제군에 항복했다. 몸값으로 금화 사십만 두카트를 내기로 하고, 성 안에 갇힌 몸이 되었다. 로마에는 페스트까지 돈다.');
    // 마키아벨리의 죽음 — 로마를 지킨 제독이 아직 『군주론』을 받지 못했으면 귀차르디니가 보낸다
    if (!told.machDeath && t >= D.machDeath && met) {
      told.machDeath = 1;
      var late = b.defended && !b.prince;
      if (late) { b.prince = 'letter'; give('il_principe'); if (G.Growth && G.Growth.event) G.Growth.event('int', 2, '마키아벨리의 『군주론』을 읽었다'); }
      out.push({ icon: 'skull', history: true, text: '【마키아벨리의 죽음】 피렌체에서 니콜로 마키아벨리가 세상을 떠났다. 되살아난 공화국은 그를 「메디치의 사람」이라며 다시 쓰지 않았다고 한다.' +
        (late ? ' …며칠 뒤 귀차르디니의 편지와 함께 꾸러미 하나가 왔다. 「로마의 성벽에 섰던 바다의 사람에게 — 니콜로가 마지막으로 부탁한 것이오.」 손때 묻은 『군주론』 필사본이었다.' : b.prince ? ' …제독의 짐 속에는 그가 건넨 『군주론』 필사본이 있다.' : '') });
    }
    news('escape', met, 'ship', b.fleeRes === 'ok'
      ? '【교황의 탈출】 교황 클레멘스 7세가 행상인 옷을 입고 산탄젤로성을 빠져나와 오르비에토에 닿았다. …그 수레를 몬 것이 바다의 제독이었다는 것은 교황과 몇 사람만 안다.'
      : '【교황의 탈출】 교황 클레멘스 7세가 하인의 옷을 입고 산탄젤로성을 빠져나가 북쪽 오르비에토로 피했다.');
    news('crown', met, 'crown', '【볼로냐의 대관식】 클레멘스 7세가 볼로냐에서 카를 5세에게 황제의 관을 씌웠다. 로마를 약탈한 군대의 황제와 약탈당한 교황이 손을 잡았다 — 이탈리아의 앞날은 이제 황제의 손에 있다.');
    news('print', met, 'book', '【『군주론』】 마키아벨리의 『군주론』이 로마와 피렌체에서 책으로 찍혀 나왔다. 「사랑받기보다 두려움을 받는 편이 안전하다」 — 사람들은 그 글에 치를 떨면서도 읽기를 멈추지 못한다.' +
      (R.hasItem && R.hasItem('il_principe') ? ' 제독의 필사본은 그보다 다섯 해 먼저였다.' : ''));
    return out;
  };

  // ================================================================ ① 동맹 진영의 경고 (1527.3~5.3, 피렌체·피사)
  function warnOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && !b.warn && (c === FLORENCE || c === PISA) && t >= D.warnFrom && t <= D.warnTo); }
  async function warn() {
    var b = st(); b.met = 1;
    await play([
      [null, '피렌체 성벽 위. 깡마른 사내가 석공들에게 성벽의 높이를 재게 하고 있다. 곁에 흉갑을 입은 둥근 얼굴의 귀족이 지도를 펼친다.'],
      ['machiavelli', '니콜로 마키아벨리요. 요즘은 성벽 감독관 노릇을 하고 있지. 이 사람은 프란체스코 귀차르디니 — 교황군의 총대리요.'],
      ['guicciardini', '황제의 군대가 볼로냐를 지나 남쪽으로 내려오고 있소. 이만이 넘소. 독일 란츠크네히트와 에스파냐 병사들인데, 몇 달째 급료를 한 푼도 못 받았지. 늙은 프룬츠베르크 장군은 반란을 막다가 쓰러졌다 하오.'],
      ['machiavelli', '급료를 못 받은 군대는 군대가 아니오. 굶주린 늑대 떼지. 늑대는 가장 살찐 양을 찾소 — 피렌체가 아니면 로마요. 교황 성하는 아직도 황제와 협상을 하시겠다는군. 협상! 늑대와 말이오!'],
      ['machiavelli', '바다의 사람, 그대에게 배와 총이 있다면 로마로 가 주시오. 우리 동맹군 대장 우르비노 공작은 느림보라 제때 닿지 못할 거요. 「운명은 강물과 같다」 — 둑을 쌓아 두지 않은 곳을 덮치지.']
    ]);
    var v = await UI.ask('마키아벨리가 로마로 가 달라고 한다.', [{ label: '로마로 가겠다', value: 'go', icon: 'ship' }, { label: '사양한다', value: 'no' }], me());
    b.warn = v === 'go' ? 'go' : 'no';
    if (b.warn === 'go') { G.State.log('피렌체에서 마키아벨리와 귀차르디니에게 황제군이 로마로 내려온다는 경고를 들었다. 로마로 가겠다고 했다.'); UI.toast('1527년 5월 6일 전에 로마로', 'scroll', 5600); }
    else G.State.log('피렌체에서 마키아벨리의 부탁을 사양했다.');
    refresh();
  }

  // ================================================================ ② 안개 낀 성벽 → 파세토 → 약탈의 여드레 (로마)
  function wallOpen() { var b = st(), t = today(); return !!(b && !b.wall && cityNow() === ROME && t >= D.wallFrom && t <= D.sack); }
  async function wall() {
    var b = st(), s = S(), k = K(), t = today(); b.met = 1;
    if (t < D.sack - 1) {
      await play([
        [null, '로마. 거리에는 아직 순례자와 상인이 오간다. 그러나 추기경들의 저택은 대문을 걸어 잠그고, 북쪽 성문에서는 짐을 싼 수레들이 빠져나간다.'],
        ['roist', '바다의 선장이시오? 나는 스위스 근위대장 카스파르 뢰이스트. 황제군이 북쪽에서 내려오고 있소. 성벽 안에는 근위대 백팔십구 명과 급히 모은 시민 민병뿐이오. 그대의 사람들이 있다면 성벽에 서 주시오.']
      ]);
      var w = await UI.ask('황제군은 5월 6일 무렵 로마에 닿는다. 로마에 머물며 기다리겠는가?', [{ label: '로마에 머문다 (5월 5일까지 날이 지나간다)', value: 'stay', icon: 'hourglass' }, { label: '로마를 떠난다', value: 'leave' }], me());
      if (w !== 'stay') { b.wall = 'leave'; G.State.log('황제군이 다가오는 로마를 떠났다.'); return; }
      var n = Math.max(0, U.dayIndex({ y: 1527, m: 5, d: 5 }) - U.dayIndex(s.date)), msgs = [];
      if (n > 0) {
        await UI.fade(function () { msgs = G.Game.passDays(n); });
        msgs.filter(function (m) { return !m.history; }).forEach(function (m) { UI.toast(m.text, m.icon); });
        var nw = msgs.filter(function (m) { return m.history; }); if (nw.length && G.Scenes.city.news) await G.Scenes.city.news(nw);
      }
    }
    await withPic('romesack_fog', '안개 낀 성벽 (1527.5.6)', function () { return play([
      [null, '1527년 5월 6일 새벽. 테베레 강에서 올라온 짙은 안개가 보르고의 성벽을 덮었다. 성벽 위의 대포는 안개 속 어디를 쏴야 할지 모른다.'],
      [LANDSK, '(안개 너머에서, 독일 말로) 교황의 금! 교황의 금! 급료는 로마에서 받는다!'],
      ['bourbon', '(흰 망토를 두르고 사다리를 짚으며) 병사들이여, 저 성벽 너머에 그대들의 급료가 있다! 내가 먼저 오른다!'],
      ['roist', '산토 스피리토 쪽 성벽이 낮소! 저기로 사다리가 몰려든다. 선장, 어떻게 하겠소?']
    ]); });
    var v = await UI.ask('1527년 5월 6일 새벽 — 황제군이 로마의 성벽에 사다리를 건다.', [
      { label: '산토 스피리토의 성벽을 지킨다', value: 'wall', icon: 'castle' },
      { label: '곧장 바티칸으로 — 교황을 피신시킨다', value: 'skip', icon: 'boot' },
      { label: '로마를 떠난다', value: 'leave' }], me());
    if (v === 'leave' || !v) { b.wall = 'leave'; G.State.log('1527년 5월 6일, 황제군이 성벽에 오르기 전에 로마를 떠났다.'); refresh(); return; }
    if (v === 'wall') {
      trust(['es_crown', 'de_emperor'], -6);
      var res = await landBattle('부르봉 공작의 황제군', k.wallFoe || 110, 'garrison', { leader: '부르봉 공작 샤를' });
      b.wall = res === 'win' ? 'win' : 'lose';
      if (res === 'win') {
        var bt = G.Fame.add('bt', (k.fame || {}).wall || 220);
        await play([
          [null, '안개 속에서 흰 망토가 사다리 꼭대기에 나타났다. 성벽 위에서 화승총 한 발이 울렸다 — 부르봉 공작이 사다리에서 떨어졌다. 황제군의 함성이 비명으로 바뀌었다.'],
          ['cellini', '(성벽 위에서 화승총을 내리며) 보았소? 흰 망토 — 내가 맞혔소! 내 총알이오! …아니, 저기 그대의 사람이 쏜 것일 수도 있겠군. 아무튼 피렌체 사람의 총알이오!'],
          [null, '그러나 대장을 잃은 황제군은 오히려 미쳐 날뛰었다. 안개를 틈타 조금 아래쪽 성벽의 허술한 틈으로 무리가 쏟아져 들어왔다. 제독이 지킨 성벽은 무너지지 않았지만, 로마는 다른 곳에서 뚫렸다.']
        ]);
        G.State.log('1527년 5월 6일, 로마 산토 스피리토의 성벽에서 부르봉 공작의 황제군을 막아 냈다. 부르봉 공작이 사다리 위에서 쓰러졌다. (전투 명성 +' + bt + ')');
      } else {
        await play([[null, '사다리가 하나둘 성벽에 걸리고, 안개 속에서 끝없이 사람이 올라왔다. 제독의 사람들은 성벽에서 밀려났다. 그 와중에 흰 망토의 대장이 총에 맞아 떨어졌다는 고함이 들렸다 — 그래도 황제군은 멈추지 않았다.']]);
        G.State.log('1527년 5월 6일, 로마의 성벽에서 황제군에 밀려났다.');
      }
    } else b.wall = 'skip';
    await escort();
    await looters();
    refresh();
  }
  /** 파세토 — 교황을 산탄젤로성으로 (퇴각 판) */
  async function escort() {
    var b = st(), s = S(), k = K();
    await withPic('romesack_passetto', '파세토 (1527.5.6)', function () { return play([
      [null, '성 베드로 대성당. 교황 클레멘스 7세는 아직 제단 앞에서 기도하고 있었다. 성당 계단 아래에서 칼 부딪는 소리가 올라온다 — 스위스 근위대가 오벨리스크 둘레에 마지막 진을 쳤다.'],
      ['roist', '(피투성이로 계단을 오르며) 성하! 지금 가셔야 합니다! 파세토로 — 산탄젤로성까지 이어진 회랑으로! 근위대 마흔 명이 모시겠습니다. 나머지는… 여기 남습니다.'],
      ['clement', '(떨리는 손으로 묵주를 쥐고) 나는… 황제와 협상을 하고 있었소. 황제의 군대가 교황의 도시를…. 하느님, 이것이 내 죄의 값입니까.'],
      [null, '누군가 교황의 흰 옷 위에 주교의 보랏빛 망토를 던져 씌웠다. 흰 옷은 회랑의 창으로 너무 잘 보이기 때문이다.'],
      ['roist', '선장! 그대 사람들이 회랑 입구를 막아 주시오! 성하께서 성에 닿을 때까지만!']
    ]); });
    var team = Math.min(k.escortTeam || 40, Math.max(1, s.fleet.crew)), r = { res: 'win', left: team };
    if (G.Games && G.Games.landWar) r = await G.Games.landWar({ enemy: { name: '보르고로 쏟아져 들어온 황제군', kind: 'bandit', n: k.escortFoe || 60, leader: '란츠크네히트 대장' }, party: team, terr: 'grass', guns: true, hold: k.hold || 2, flee: false });
    var lost = Math.max(0, team - (r.left == null ? team : r.left)); s.fleet.crew = Math.max(1, s.fleet.crew - lost);
    b.escort = r.res === 'win' ? 'win' : 'lose';
    if (b.escort === 'win') {
      var so = G.Fame.add('so', (k.fame || {}).escort || 160);
      await play([
        [null, '회랑 위의 좁은 길을 교황과 추기경들이 달린다. 아래 거리에서 화승총 탄이 날아와 돌벽을 깨뜨린다. 제독의 사람들이 회랑 입구를 막는 사이, 산탄젤로성의 문이 닫혔다.'],
        ['clement', '(성벽 안에서 숨을 몰아쉬며) …바다의 사람이여, 그대가 막아 준 그 몇 분이 아니었다면 나는 지금 저들의 포로였을 것이오. 이 은혜를 잊지 않겠소.']
      ]);
      G.State.log('교황 클레멘스 7세를 비밀 회랑 파세토로 산탄젤로성까지 피신시켰다. 스위스 근위대는 백팔십구 명 가운데 마흔두 명만 살아남았다. (사교 명성 +' + so + ')');
    } else {
      await play([[null, '회랑 입구에서 제독의 사람들은 밀려났다. 그러나 남은 스위스 근위대가 몸으로 길을 막았고, 교황은 간신히 산탄젤로성에 닿았다.']]);
      G.State.log('파세토 입구에서 황제군에 밀려났다. 교황은 스위스 근위대 덕에 산탄젤로성에 닿았다.');
    }
    b.defended = !!(b.wall === 'win' || b.escort === 'win');
    if (b.defended) trust(['it_pope'], 10);
  }
  /** 약탈의 여드레 — 부하들이 약탈꾼을 약탈한다 */
  async function looters() {
    var b = st(), s = S(), k = K();
    await withPic('romesack_sack', '로마 약탈 (1527.5)', function () { return play([
      [null, '그날부터 여드레 동안 로마는 지옥이었다. 성당의 제단이 부서지고, 교황들의 무덤이 파헤쳐지고, 추기경들은 몸값을 위해 거리로 끌려 나왔다. 루터파 란츠크네히트들은 교황의 옷을 걸치고 말을 타며 조롱했다.'],
      [ROMAN, '(무너진 집 앞에서) 고트족도 반달족도 이렇게 하지는 않았소! 그리스도교를 믿는다는 황제의 군대가 — 그리스도의 도시를!'],
      [null, '닷새째 밤. 제독의 부하들이 테베레 강가 골목에서, 금 잔과 은 촛대를 자루에 가득 지고 술에 취한 약탈꾼 무리를 발견했다.']
    ]); });
    var res = await landBattle('짐을 잔뜩 진 약탈꾼 무리', k.lootFoe || 35, 'bandit', { winText: '약탈꾼 무리를 쫓아냈다! 놈들이 버리고 간 자루가 산더미다.' });
    if (res !== 'win') {
      b.loot = 'lost';
      await play([[null, '약탈꾼들은 생각보다 많았다. 제독의 부하들은 자루 몇 개만 건지고 물러났다.']]);
      G.State.log('로마 약탈 중에 약탈꾼 무리를 덮쳤지만 물러났다.');
      return;
    }
    var v = await UI.ask('약탈꾼들이 버리고 간 자루 — 성당의 금 잔과 은 촛대, 은화가 가득하다. 부하들이 눈을 반짝인다.', [
      { label: '부하들의 몫으로 나눈다 (금화 ' + U.num(k.loot || 7000) + '닢)', value: 'keep', icon: 'coin' },
      { label: '로마 사람들에게 돌려준다 — 성당과 집을 잃은 이들에게 기부한다', value: 'donate', icon: 'heart' }], me());
    b.loot = v === 'donate' ? 'donate' : 'keep';
    if (b.loot === 'keep') {
      s.player.gold += k.loot || 7000;
      await play([[null, '부하들이 환호했다. 「약탈꾼을 약탈했으니 죄는 아니지요, 제독!」 …로마 사람들은 그 배의 깃발을 오래 기억할 것이다.']]);
      G.State.log('로마 약탈 중에 부하들이 약탈꾼을 털어 금화 ' + U.num(k.loot || 7000) + '닢을 나눠 가졌다.');
      UI.toast('약탈꾼을 약탈했다 — 금화 +' + U.num(k.loot || 7000), 'coin', 5000);
    } else {
      give('r_santangelo', { disc: 'romesack', done: true });
      var so = G.Fame.add('so', (k.fame || {}).donate || 180);
      trust(['it_pope'], 6);
      await play([
        [null, '제독은 자루를 산토 스피리토 병원의 수도사들에게 넘겼다. 집을 잃은 사람들, 부모를 잃은 아이들에게 빵과 옷이 되었다.'],
        ['cellini', '(약탈이 잦아든 뒤, 산탄젤로성에서 내려와) 바다의 사람. 성 사람들과 내가 그대에게 줄 것이 있소. 성 꼭대기의 대천사를 본떠 내가 깎은 것이오. 칼을 든 천사 — 그대 배의 이물에 다시오. 로마를 위해 싸운 배라면 천사가 지킬 거요.']
      ]);
      G.State.log('로마 약탈 중에 약탈꾼에게서 되찾은 금은을 로마 사람들에게 기부했다. 첼리니와 로마 사람들이 「산탄젤로의 천사상」을 깎아 주었다. (사교 명성 +' + so + ')');
      UI.toast('산탄젤로의 천사상 — 조선소에서 배에 달 수 있다', 'feather', 5600);
    }
  }

  // ================================================================ ③ 마키아벨리의 분노 (1527.5.7~6.20)
  function machOpen() { var b = st(), t = today(), c = cityNow(); return !!(b && b.defended && !b.prince && (c === FLORENCE || c === PISA || c === ROME) && t >= D.machFrom && t <= D.machTo); }
  async function mach() {
    var b = st();
    await withPic('romesack_machiavelli', '마키아벨리 (1527)', function () { return play([
      [null, cityNow() === ROME ? '로마 북쪽 성문 밖. 동맹군의 기병 몇이 폐허가 된 거리를 내려다보고 있다. 그 가운데 깡마른 사내가 말에서 내린다.' : '피렌체. 메디치 가를 몰아낸 시민들이 광장에서 종을 울린다. 그 소란 속에서 깡마른 사내가 제독을 알아본다.'],
      ['machiavelli', '로마의 성벽에 섰다는 바다의 사람 — 그대로군. 다 들었소. 성 베드로의 계단, 파세토, 그리고 그 뒤의 여드레.'],
      ['machiavelli', '(목소리가 떨린다) 교회의 제단에서 말이 여물을 먹고, 교황들의 뼈가 거리에 흩어졌다지. 독일놈들과 에스파냐놈들이 — 아니, 그들을 탓할 것도 없소. 이탈리아가 스스로 지키지 못했으니. 용병에 기대고, 동맹을 믿고, 협상을 믿었으니!'],
      ['machiavelli', '나는 열네 해 전에 이 일을 썼소. 「남의 군대로는 나라를 지킬 수 없다」고. 「운명은 강물과 같아서 둑을 쌓지 않은 곳을 덮친다」고. 메디치 사람에게 바쳤지만 아무도 읽지 않았지.'],
      ['machiavelli', '(품에서 손때 묻은 원고 묶음을 꺼내며) 『군주론』이오. 내가 고쳐 쓴 필사본이지. 그대는 이탈리아 사람도 아니면서 이탈리아를 위해 싸웠소. 마지막 장을 읽어 보시오 — 「이탈리아를 야만인들로부터 해방하라는 권고」. 그대 같은 사람이 읽어야 하오.']
    ]); });
    b.prince = 'given';
    give('il_principe');
    if (G.Growth && G.Growth.event) G.Growth.event('int', 2, '마키아벨리의 『군주론』을 읽었다');
    var so = G.Fame.add('so', 80);
    G.State.log('로마를 지킨 일을 들은 니콜로 마키아벨리가 『군주론』 필사본을 건넸다. (지력 +2 · 사교 명성 +' + so + ')');
    UI.toast('『군주론』 필사본 — 지력 +2', 'book', 5600);
    refresh();
  }

  // ================================================================ ④ 행상인 옷을 입은 교황 (1527.11~12.6)
  function fleeOpen() { var b = st(), t = today(); return !!(b && !b.flee && cityNow() === ROME && t >= D.fleeFrom && t <= D.fleeTo); }
  RS.hideP = function () { var h = K().hide || [0.5, 0.15]; return Math.min(0.95, h[0] + h[1] * skill('speech')); };
  async function flee() {
    var b = st(), s = S(), k = K(); b.met = 1;
    var known = b.escort === 'win' || b.wall === 'win';
    await withPic('romesack_peddler', '행상인 옷을 입은 교황 (1527.12)', function () { return play([
      [null, '로마는 반쯤 비었다. 약탈과 페스트에 사람들이 죽거나 떠났다. 산탄젤로성 둘레에는 아직 에스파냐 병사들이 진을 치고 있다.'],
      ['cellini', '(성 아래 골목에서 제독의 소매를 끌며) 선장, 이리 오시오. 성하께서 몸값을 반쯤 치르고 풀려나실 날을 기다리고 계시지만 — 황제의 장교들은 또 무슨 핑계를 댈지 모르오. 성하께서 몰래 빠져나가시려 하오. 북쪽 오르비에토로.'],
      ['clement', known ? '(성 안 작은 방에서, 길게 자란 수염을 쓰다듬으며) …그대로군. 파세토의 그 선장. 하느님께서 또 그대를 보내셨구려. 나는 이 수염을 로마가 당한 일을 슬퍼하는 뜻으로 기르고 있소.' : '(성 안 작은 방에서, 길게 자란 수염을 쓰다듬으며) 바다에서 왔다는 선장이오? 첼리니가 믿을 만한 사람이라 하더군.'],
      ['clement', '행상인 옷은 마련했소. 하인 하나와 함께 수레를 끌고 성문을 나설 거요. 그대가 그 수레를 몰아 주겠소?']
    ]); });
    var opts = [{ label: '행상 수레에 숨겨 북문으로 빠져나간다 (성공률 ' + Math.round(RS.hideP() * 100) + '%)', value: 'hide', icon: 'boot' }];
    if (s.player.gold >= (k.bribe || 3000)) opts.push({ label: '북문의 에스파냐 장교를 매수한다 (금화 ' + U.num(k.bribe || 3000) + '닢)', value: 'bribe', icon: 'coin' });
    opts.push({ label: '끼지 않는다', value: 'no' });
    var v = await UI.ask('교황 클레멘스 7세를 오르비에토로 빼낸다.', opts, me());
    b.flee = v || 'no';
    if (b.flee === 'no') { G.State.log('산탄젤로성에 갇힌 교황을 빼내 달라는 부탁을 사양했다.'); refresh(); return; }
    var ok = true;
    if (b.flee === 'bribe') {
      s.player.gold -= k.bribe || 3000;
      await play([[SPOFF, '(금화 주머니를 저울질하며) 행상인이라. 요즘 로마에는 행상인이 많지. 지나가시오. …나는 아무것도 못 봤소.']]);
    } else if (U.chance(RS.hideP())) {
      await play([[null, '새벽 안개 속 북문. 제독이 수레 위 천 꾸러미를 툭툭 치며 병사들에게 농을 건넨다. 「포도주 찌꺼기와 헌 옷이오. 냄새 맡아 보시겠소?」 병사들이 코를 막고 손을 내저었다.']]);
    } else {
      await play([[SPOFF, '잠깐. 그 행상인 — 손이 너무 곱군. 얼굴을 들어라!'], [null, '수레 곁의 「하인」이 고개를 숙인 채 굳었다. 제독이 장교 앞을 막아섰다.']]);
      var dr = 'win';
      if (G.Games && G.Games.duel) dr = await G.Games.duel({ name: '에스파냐 장교', look: 'captain', str: 66, atk: 10, def: 4, skill: 2, mar: 64, int: 50, cha: 40 }, { place: 'land' });
      ok = dr === 'win';
      if (ok) await play([[null, '장교가 칼을 떨어뜨리고 쓰러지자, 제독은 수레를 몰아 안개 속으로 내달렸다.']]);
      else await play([[null, '제독이 쓰러진 사이, 다른 수레를 몰던 교황의 사람들이 소란을 틈타 성하를 북쪽으로 빼냈다. 제독은 붙잡혀 밤새 심문을 당하고 이튿날에야 풀려났다.']]);
    }
    b.fleeRes = ok ? 'ok' : 'fail';
    if (ok) await grantTitle(); else G.State.log('교황 클레멘스 7세를 빼내려다 북문에서 붙잡혔다. 교황은 다른 사람들 손에 오르비에토로 피했다.');
    refresh();
  }
  /** 교황청의 명예 작위 — 한 칸 오른다 (이미 맨 위면 하사금) */
  async function grantTitle() {
    var b = st(), s = S(), k = K(), CT = G.Court, realm = G.COURT && G.COURT.realms && G.COURT.realms.PAPAL;
    await play([
      [null, '오르비에토. 산 위의 낡은 주교관에 닿은 교황은 행상인 옷을 벗고, 제독 앞에서 처음으로 웃었다.'],
      ['clement', '교황이 행상인이 되어 도망치는 날이 올 줄이야. …그대는 두 번이나 나를 구했소.' + (b.escort === 'win' ? ' 한 번은 파세토에서, 한 번은 수레 위에서.' : '')]
    ]);
    var so = G.Fame.add('so', (k.fame || {}).flee || 200);
    trust(['it_pope'], 10);
    if (!CT || !realm) { b.title = 'none'; G.State.log('교황 클레멘스 7세를 오르비에토로 빼냈다. (사교 명성 +' + so + ')'); return; }
    var c = CT.state(), n = CT.rank(realm) + 1, tt = CT.title(realm, n);
    if (!tt) {
      s.player.gold += 6000; b.title = 'top';
      await play([['clement', '그대는 이미 교황청이 줄 수 있는 가장 높은 이름을 가졌구려. 그렇다면 이것을 받으시오 — 교황의 금고에 남은 것이 많지는 않지만.']]);
      G.State.log('교황 클레멘스 7세를 오르비에토로 빼냈다. 교황이 하사금 금화 6,000닢을 내렸다. (사교 명성 +' + so + ')');
      UI.toast('하사금 금화 +6,000', 'coin', 5000);
      return;
    }
    c.titles[realm.id] = n; b.title = tt.ko;
    if (G.Growth && G.Growth.event) G.Growth.event('cha', 1, tt.ko + ' 서임 — 궁정의 예법을 몸에 익혔다');
    await play([['clement', '무릎을 꿇으시오. …이 칼이 그대의 어깨에 닿는 순간부터, 그대는 교황청의 ' + tt.ko + '이오. 로마가 가장 어두웠던 날, 그대가 로마의 빛이었소.']]);
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">' + U.esc(realm.name) + ' · 명예 작위</div><div style="font-size:34px;font-weight:800;margin:6px 0">' + U.esc(tt.ko) + '</div><div style="font-size:20px;font-style:italic">' + U.esc(tt.native) + '</div></div><br>' +
      '교황 클레멘스 7세를 산탄젤로성에서 오르비에토로 빼낸 공으로. 사교 명성 <b>+' + so + '</b>', '명예 작위');
    G.State.log('교황 클레멘스 7세를 오르비에토로 빼낸 공으로 ' + CT.fullName(tt, true) + '의 명예 작위를 받았다. (사교 명성 +' + so + ')');
    UI.toast(CT.fullName(tt, true) + '의 명예 작위를 받았다!', 'crown', 6500);
    if (G.Audio) G.Audio.sfx('discover');
  }

  // ================================================================ 도시에 들어설 때 · 수첩
  RS.pending = function () { if (!S()) return false; return warnOpen() || wallOpen() || machOpen() || fleeOpen(); };
  RS.check = async function () {
    if (RS._busy) return false; RS._busy = true;
    try {
      if (wallOpen()) await wall();
      else if (machOpen()) await mach();
      else if (fleeOpen()) await flee();
      else if (warnOpen()) await warn();
    } catch (e) { console.error(e); }
    RS._busy = false;
    return true;
  };
  RS.html = function () {
    var s = S(), b = s && s.romeSack; if (!b || !b.met) return '';
    var t = today(), li = [];
    if (b.warn === 'go' && !b.wall && t <= D.sack) li.push('1527년 5월 6일 전에 로마 — 황제군이 내려온다');
    if (b.defended && !b.prince && t <= D.machTo) li.push('6월 20일까지 피렌체·피사·로마 — 마키아벨리');
    if (!b.flee && t >= D.surrender && t <= D.fleeTo) li.push('1527년 11월~12월 6일 로마 — 산탄젤로성에 갇힌 교황');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">로마 약탈 (1527)</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._romeHtml) { G.Court._romeHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + RS.html(); }; }
  RS._t = { warn: warn, wall: wall, escort: escort, looters: looters, mach: mach, flee: flee, grantTitle: grantTitle };
})(window.G = window.G || {});
