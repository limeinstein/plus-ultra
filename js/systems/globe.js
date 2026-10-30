/* 셰익스피어와 글로브 극장의 불 — 앤 해서웨이의 불멸의 사랑 (G.Globe) 2026-10-30 사용자 요청
   「셰익스피어와 지구 극장 화재 사건 그리고 앤 해서웨이의 불멸의 사랑 — 그날 둘은 사라지고 항해사가 되어 바다에서 이야기를 노래한다」
   사람·조정값: js/data/globe.js (G.MATE.anne_hathaway · G.HIST_FIG.burbage · G.GLOBE_SONGS · G.BALANCE.globe). 셰익스피어는 원래 있던 동료(G.MATE.shakespeare).
   ■ ① 폭풍의 이야기 (1610.1.1~1611.10.31, 런던): 버뮤다에서 난파한 시 벤처호 소식에 빠진 셰익스피어가 제독에게 바다의 폭풍 이야기를 청한다 →
        (가) 난파와 무인도 이야기 (나) 바다 괴물 이야기 (다) 사양 — 이야기를 들려주면 1611.11.1 『템페스트』 궁정 공연 소식에 제독의 이야기가 들어간다
   ■ ② 앤이 런던에 온 날 (1613.6.1~6.29, 런던): 스트랫퍼드에서 앤 해서웨이가 올라왔다. 「스무 해 넘게 런던에만 있었으니 이제 집으로」.
        6월 29일 새 연극 『모든 것이 진실(헨리 8세)』 첫 공연에 제독을 부른다 → 29일까지 머문다 (날이 지나간다)
   ■ ③ 글로브의 불 (1613.6.29): 헨리 왕이 등장할 때 쏜 축포의 불씨가 초가지붕에 붙는다. 한 시간 만에 극장이 타 버렸다(죽은 사람은 없었다).
        ⑴ 관객 — 선원들에게 두 출구를 맡겨 질서 있게 내보낸다 / 곧장 앤을 찾는다 (바지에 불붙은 사내에게 맥주를 끼얹는 이야기)
        ⑵ 앤이 남편의 원고를 가지러 불타는 분장실로 — 셰익스피어가 뒤따라 들어간다. 제독이 들어가는 길:
           무대 바닥의 뚜껑문(「지옥」이라 부르는 무대 밑 통로) / 분장실 뒤 계단 / 객석 회랑에서 마당으로 뛰어내려 무대로 — 실패하면 제독이 덴다(체력 −). 둘은 늘 살아 나온다
        ⑶ 성공하면 원고 궤짝을 건질지 고른다
        ⑷ 템스 강가의 밤 — 「세상은 우리가 불에 탔다고 믿게 두자. 온 세상이 무대라면, 바다는 가장 큰 무대지」 → 둘이 함께 배에 오른다 (동료 둘)
           사양하면 둘은 스트랫퍼드로 돌아간다 (역사 그대로)
   ■ ④ 바다의 이야기 노래: 둘이 함께 배에 있으면 바다의 하루에 song 확률(사이 songGap일)로 갑판의 노래 — 피로 − · 규율 + (G.GLOBE_SONGS 여섯 편 차례로)
   ■ 소식: 『템페스트』(1611.11.1) · 글로브의 불(1613.6.30) · 새 글로브(1614.6) · 스트랫퍼드의 장례(1616.4.23 — 둘이 배에 있으면 「관이 가벼웠다」) · 첫 전집(1623.11)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/globe_*.webp
   ■ 저장: s.globe = { met, tale: 'wreck'|'monster'|'no', anne, stay, evac, path, pathOk, papers, joined: 'yes'|'no', songN, songDay, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var GL = G.Globe = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.globe) || {}; }
  var LONDON = 38;
  var D = GL.D = { taleFrom: 16100101, taleTo: 16111031, tempest: 16111101, anneFrom: 16130601, fire: 16130629, fireNews: 16130630, rebuilt: 16140601, funeral: 16160423, folio: 16231108 };
  var NEWS_AT = { tempest: D.tempest, fireNews: D.fireNews, rebuilt: D.rebuilt, funeral: D.funeral, folio: D.folio };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.globe) {
      s.globe = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.globe.told[k] = 1; });   // 옛 저장
    }
    if (!s.globe.told) s.globe.told = {};
    return s.globe;
  }
  GL.state = st;
  function today() { return U.dateNum(S().date); }
  function atLondon() { var s = S(); return !!(s && s.loc && s.loc.mode === 'city' && s.loc.city === LONDON); }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function sp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  var CROWD = { name: '관객', lang: 3 }, WOMAN = { name: '사과 파는 아낙', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var who = l[0] === 'P' ? me() : l[0] === 'W' ? sp('shakespeare', l[2]) : l[0] === 'A' ? sp('anne_hathaway', l[2]) : l[0] && typeof l[0] === 'object' ? l[0] : l[0] ? H(l[0]) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }
  function both() { return !!(row('shakespeare') && row('anne_hathaway')); }
  /** 사건으로 배에 오른 두 사람은 「역사 속 활약을 마친 해」가 지나도 떠나지 않게 (js/systems/mateleave.js MLV.past) */
  function keepYears() {
    var b = S() && S().globe; if (!b || b.joined !== 'yes') return;
    var w = G.MATE.shakespeare; if (w && w.y && w.y[1] < 1660) w.y = [w.y[0], 1660];
  }
  GL.keepYears = keepYears;

  // ================================================================ 날마다 — 소식
  GL.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    keepYears();
    var t = today(), told = b.told, met = !!b.met, gone = b.joined === 'yes';
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('tempest', met && b.tale && b.tale !== 'no', 'book', '【템페스트】 화이트홀 궁전에서 셰익스피어의 새 연극 『템페스트』가 국왕 앞에 올랐다. 폭풍에 난파한 배, 마법사가 다스리는 섬' + (b.tale === 'monster' ? ', 그리고 섬에 사는 괴물 캘리번' : ', 그리고 무인도에서 살아남은 사람들') + ' — 제독이 술잔을 사이에 두고 들려준 이야기가 거기 있었다.');
    news('fireNews', met, 'skull', gone
      ? '【글로브의 불】 어제 오후 글로브 극장이 한 시간 만에 타 버렸다. 축포의 불씨가 초가지붕에 붙었다고 한다. 죽은 사람은 없다 — 다만 극장의 주인 가운데 하나인 셰익스피어와, 시골에서 올라온 그의 아내가 보이지 않는다고 사람들이 수군거린다.'
      : '【글로브의 불】 어제 오후 『모든 것이 진실』 첫 공연 중에 글로브 극장이 한 시간 만에 타 버렸다. 축포의 불씨가 초가지붕에 붙었다. 바지에 불이 붙은 사내 하나가 맥주를 뒤집어써 불을 껐을 뿐, 다친 사람은 없다고 한다.');
    news('rebuilt', met, 'castle', '【새 글로브】 불탄 자리에 글로브 극장이 다시 섰다. 이번에는 초가 대신 기와를 얹었다.' + (gone ? ' 개막 날 무대 위에 빈 의자 둘이 놓여 있었다고 한다.' : ''));
    news('funeral', met, 'scroll', gone
      ? '【스트랫퍼드의 장례】 스트랫퍼드의 성삼위일체 교회에 「윌리엄 셰익스피어」의 무덤이 섰다. 관을 멘 사람들은 관이 이상하게 가벼웠다고 수군거렸다. 묘비에는 이렇게 새겨졌다 — 「벗이여, 여기 묻힌 흙을 파지 말라. 이 돌을 아끼는 자에게 복이, 내 뼈를 옮기는 자에게 저주가 있으리.」 …그날 제독의 배 갑판에서는 셰익스피어가 그 묘비명을 읊으며 낄낄 웃고, 앤이 그의 등을 때렸다.'
      : '【셰익스피어의 죽음】 극작가 윌리엄 셰익스피어가 고향 스트랫퍼드에서 세상을 떠났다. 묘비에는 「내 뼈를 옮기는 자에게 저주가 있으리」라고 새겨졌다. 유언장에서 아내 앤에게 남긴 것은 「두 번째로 좋은 침대」뿐이었다고 한다.');
    if (!told.folio && t >= D.folio && met) {
      told.folio = 1;
      out.push({ icon: 'book', history: true, text: b.papers
        ? '【첫 전집】 셰익스피어의 동료 배우 헤밍스와 콘델이 그의 극 서른여섯 편을 한 권으로 묶어 펴냈다. 『템페스트』, 『맥베스』, 『십이야』…. 절반은 이 책이 아니었다면 영영 사라졌을 것이다. 원고는 어디서 났느냐는 물음에 둘은 「바다에서 왔다」고만 했다 — 제독이 런던에 들렀을 때 베껴 쓰라고 빌려준, 그을린 궤짝의 원고였다.'
        : '【첫 전집】 셰익스피어의 동료 배우 헤밍스와 콘델이 그의 극 서른여섯 편을 한 권으로 묶어 펴냈다. 「그는 한 시대의 사람이 아니라 모든 시대의 사람이다」 — 벤 존슨이 머리말에 쓴 말이다.' });
    }
    return out;
  };

  // ================================================================ ① 폭풍의 이야기 (1610~1611.10)
  function taleOpen() { var b = st(), t = today(); return !!(b && !b.tale && atLondon() && t >= D.taleFrom && t <= D.taleTo && !row('shakespeare')); }
  async function tale() {
    var b = st(); b.met = 1;
    await play([
      [null, '런던, 템스 강 남쪽 뱅크사이드의 술집. 잉크 묻은 손가락의 사내가 버지니아에서 온 편지를 몇 번이고 다시 읽고 있다.'],
      ['W', '윌리엄 셰익스피어요. 이 편지 좀 보시오 — 시 벤처호가 버지니아로 가다 폭풍을 만나 버뮤다 섬에 처박혔는데, 모두 죽은 줄 알았던 사람들이 열 달 뒤에 손수 지은 배를 타고 나타났다는 거요! 악마의 섬이라던 그곳에서!'],
      ['W', '바다의 선장이시니 묻겠소. 폭풍 속에서 배가 부서질 때 사람은 무슨 생각을 하오? 그리고 그 섬에는… 무엇이 사오?']
    ]);
    var v = await UI.ask('셰익스피어가 바다의 폭풍 이야기를 청한다.', [
      { label: '난파와 무인도에서 살아남은 이야기를 들려준다', value: 'wreck', icon: 'ship' },
      { label: '섬에 사는 괴물과 마법 같은 이야기를 들려준다', value: 'monster', icon: 'scroll' },
      { label: '「극장 사람에게 들려줄 이야기는 없소」', value: 'no' }], me());
    b.tale = v || 'no';
    if (b.tale === 'no') { G.State.log('런던에서 극작가 셰익스피어가 바다 이야기를 청했지만 사양했다.'); return; }
    await play([
      [null, b.tale === 'wreck' ? '제독은 폭풍에 돛대가 부러지던 밤, 이름 없는 섬의 모래밭에서 깨어난 아침, 부서진 배의 판자로 다시 배를 짓던 날들을 이야기했다.' : '제독은 안개 낀 섬에서 들은 노랫소리, 바위 그늘의 반은 사람이고 반은 물고기 같은 것, 바람을 부린다는 섬 노인의 소문을 이야기했다.'],
      ['W', '(펜이 종이 위를 날아다닌다) 좋소, 좋소! 마법사가 다스리는 섬… 폭풍을 부르는 공기의 정령… 그리고 난파한 왕의 아들. 제목은 — 「폭풍」, 『템페스트』요! 그대의 이야기가 무대에 오를 거요.']
    ]);
    var so = G.Fame.add('so', 60);
    G.State.log('런던에서 셰익스피어에게 바다의 폭풍 이야기를 들려주었다. 그가 새 연극 『템페스트』를 쓰겠다고 한다. (사교 명성 +' + so + ')');
    refresh();
  }

  // ================================================================ ② 앤이 런던에 온 날 → ③ 글로브의 불 (1613.6.1~6.29)
  function anneOpen() { var b = st(), t = today(); return !!(b && !b.anne && atLondon() && t >= D.anneFrom && t <= D.fire && !(row('shakespeare') && row('anne_hathaway'))); }
  async function anne() {
    var b = st(), s = S(); b.met = 1; b.anne = 1;
    var aboard = !!row('shakespeare'), t = today();
    await withPic('globe_anne', '앤이 런던에 온 날 (1613)', function () { return play([
      [null, aboard ? '런던 부두. 배에서 내리는 셰익스피어를 시골 옷차림의 여인이 기다리고 있다. 쉰이 넘은 얼굴인데 눈매가 맑다.' : '뱅크사이드, 글로브 극장 앞. 깃발이 펄럭이고, 극장 문 앞에서 시골 옷차림의 여인이 극단 사람들과 실랑이를 하고 있다.'],
      ['A', '저는 앤이에요. 스트랫퍼드에서 왔어요. 윌리엄 셰익스피어의 아내요. …스무 해 넘게 이 극장이 제 남편을 붙들고 있었잖아요. 이번엔 데리고 갈 거예요.'],
      ['W', '(뒤에서 나타나 머리를 긁으며) 앤! 정말 왔구려. …선장, 내 아내요. 내가 스무 해 동안 쓴 어떤 여주인공보다 무서운 사람이지.'],
      ['A', '무섭긴요. 당신이 쓴 여자들은 다 말이 많잖아요. 저는 말 대신 빵을 구워요.', 'happy'],
      ['W', '이달 스무아흐레 날 새 연극 『모든 것이 진실』 — 헨리 8세 이야기의 첫 공연이 있소. 그걸 마치면 앤과 스트랫퍼드로 내려가려 하오. 선장도 와 주시오. 내 마지막 런던 무대가 될지도 모르니.']
    ]); });
    if (t < D.fire) {
      var v = await UI.ask('6월 29일 글로브의 첫 공연까지 런던에 머물겠는가?', [{ label: '머문다 (6월 28일까지 날이 지나간다)', value: 'stay', icon: 'hourglass' }, { label: '머물 수 없다', value: 'no' }], me());
      b.stay = v === 'stay';
      if (!b.stay) { G.State.log('런던에서 셰익스피어와 아내 앤 해서웨이를 만났다. 글로브의 첫 공연에는 가지 않았다.'); return; }
      var n = Math.max(0, U.dayIndex({ y: 1613, m: 6, d: 28 }) - U.dayIndex(s.date)), msgs = [];
      if (n > 0) {
        await UI.fade(function () { msgs = G.Game.passDays(n); });
        msgs.filter(function (m) { return !m.history; }).forEach(function (m) { UI.toast(m.text, m.icon); });
        var nw = msgs.filter(function (m) { return m.history; }); if (nw.length && G.Scenes.city.news) await G.Scenes.city.news(nw);
      }
    } else b.stay = true;
    await fire();
  }
  async function fire() {
    var b = st(), s = S(), k = K();
    await withPic('globe_fire', '글로브의 불 (1613.6.29)', function () { return play([
      [null, '1613년 6월 29일 오후. 글로브 극장은 빈자리 하나 없다. 마당에는 1페니를 낸 사람들이 서 있고, 회랑에는 귀족들이 앉았다. 앤과 제독은 무대 곁 회랑에 자리를 얻었다.'],
      ['burbage', '(헨리 8세의 붉은 망토를 두르고) 울지 추기경의 저택에 왕이 납시었다! 축포를 쏘아라!'],
      [null, '무대 위 지붕에서 작은 대포가 연거푸 울렸다. 연기가 걷히고 연극이 이어진다. 그런데 — 대포의 솜뭉치 하나가 초가지붕 위에 내려앉아 연기를 피우고 있었다. 사람들은 무대만 보고 있다.'],
      [null, '연기가 불꽃이 되고, 불꽃이 지붕을 따라 달리기 시작했을 때야 누군가 소리를 질렀다. 「불이야!」 둥근 극장의 초가지붕이 순식간에 불의 고리가 되었다.'],
      [CROWD, '문! 문이 둘뿐이다! 밀지 마! 밀지 말라고!']
    ]); });
    // ⑴ 관객
    var v1 = await UI.ask('글로브가 불탄다 — 출구는 둘뿐이다.', [
      { label: '선원들에게 두 출구를 맡겨 사람들을 질서 있게 내보낸다', value: 'order', icon: 'people' },
      { label: '앤의 손을 잡고 곧장 빠져나간다', value: 'go', icon: 'boot' }], me());
    b.evac = v1 === 'order' ? 'order' : 'go';
    if (b.evac === 'order') {
      await play([
        [null, '제독의 선원들이 출구 양쪽에 서서 팔을 벌렸다. 「한 줄로! 아이와 늙은이 먼저!」 뱃사람의 고함에 사람들이 정신을 차리고 줄을 섰다.'],
        [CROWD, '(출구 앞에서 비명) 내 바지! 내 바지에 불이 붙었어!'],
        [WOMAN, '(망설임 없이 맥주병을 들이부으며) 가만히 있어요, 이 양반아! …불 끄는 데는 맥주가 최고지!'],
        [null, '사람들이 웃음을 터뜨렸고, 그 웃음 속에서 마지막 관객까지 빠져나왔다. 죽은 사람은 하나도 없었다.']
      ]);
      G.Fame.add('so', 60);
    } else await play([[null, '앤의 손을 잡고 사람들 틈을 헤쳐 나왔다. 뒤에서 누군가의 바지에 불이 붙었다는 비명과, 맥주를 끼얹는 소리, 그리고 웃음소리가 들렸다.']]);
    // ⑵ 앤이 분장실로
    await play([
      [null, '극장 밖 마당. 불길이 지붕을 다 삼켰다. 그런데 앤이 보이지 않는다.'],
      ['W', '(창백해져서) 앤은? 앤은 어디 있소? …설마. 분장실이오! 내 원고 궤짝이 거기 있소. 앤이 아까 「당신 글이 타 버리면 당신도 타 버리는 거예요」 하더니 —'],
      [null, '셰익스피어가 말리는 손을 뿌리치고 불타는 극장 안으로 뛰어 들어갔다.']
    ]);
    var P = k.path || {}, bonus = 0.05 * (skill('sword') + skill('med'));
    var v2 = await UI.ask('불타는 분장실로 — 어느 길로 들어가겠는가?', [
      { label: '무대 바닥의 뚜껑문 — 「지옥」이라 부르는 무대 밑 통로로 (' + Math.round(Math.min(0.95, (P.trap || 0.7) + bonus) * 100) + '%)', value: 'trap', icon: 'map' },
      { label: '분장실 뒤 계단으로 (' + Math.round(Math.min(0.95, (P.stair || 0.55) + bonus) * 100) + '%)', value: 'stair', icon: 'boot' },
      { label: '회랑에서 마당으로 뛰어내려 무대를 가로지른다 (' + Math.round(Math.min(0.95, (P.jump || 0.45) + bonus) * 100) + '%)', value: 'jump', icon: 'sword' }], me());
    b.path = v2 || 'trap';
    b.pathOk = U.chance(Math.min(0.95, (P[b.path] || 0.5) + bonus));
    if (b.pathOk) {
      await play([
        [null, b.path === 'trap' ? '무대 뚜껑문을 젖히고 유령과 마녀가 솟아오르던 무대 밑으로 내려갔다. 위에서 불붙은 서까래가 무너지는 소리. 무대 밑 통로는 곧장 분장실 아래로 이어졌다.' : b.path === 'stair' ? '분장실 뒤 좁은 계단. 연기가 위에서 쏟아져 내려온다. 젖은 소매로 입을 막고 한 계단씩 올라갔다.' : '회랑 난간에서 마당으로 뛰어내려, 불붙은 휘장 사이로 무대를 가로질렀다.'],
        [null, '분장실. 연기 속에서 앤이 참나무 궤짝을 끌어안고 있고, 셰익스피어가 그녀를 감싸 안고 있다. 의상 걸이가 불타며 왕관과 가면들이 녹아내린다.'],
        ['A', '(기침을 하며) 윌의 원고예요! 『템페스트』도, 『맥베스』도 — 이게 타 버리면 안 돼요!', 'sad']
      ]);
      var v3 = await UI.ask('궤짝이 무겁다. 연기가 짙어진다.', [{ label: '궤짝째 들고 나간다', value: 'take', icon: 'chest' }, { label: '궤짝을 두고 두 사람만 데리고 나간다', value: 'leave' }], me());
      b.papers = v3 === 'take';
      await play([[null, b.papers ? '궤짝을 어깨에 메고 두 사람을 앞세워 무대 밑 통로로 빠져나왔다. 등 뒤에서 무대가 통째로 무너져 내렸다.' : '두 사람의 팔을 붙잡고 빠져나왔다. 등 뒤에서 무대가 통째로 무너져 내렸다. 궤짝은 불길 속에 남았다.']]);
      if (b.papers) give('globe_papers');
    } else {
      s.player.hp = Math.max(1, (s.player.hp == null ? 100 : s.player.hp) - (k.burn || 25));
      b.papers = false;
      await play([
        [null, b.path === 'jump' ? '뛰어내리다 불붙은 휘장에 감겨 팔에 화상을 입었다.' : '연기에 숨이 막혀 한 번 쓰러졌다가, 불똥에 등을 데었다.'],
        [null, '그래도 기어가듯 분장실에 닿았다. 셰익스피어와 앤을 끌고 나오는 사이 원고 궤짝은 불길에 삼켜졌다. 앤이 마지막 순간 원고 몇 장을 품에 넣었을 뿐이다.']
      ]);
      UI.toast('화상을 입었다 — 체력 −' + (k.burn || 25), 'skull', 4200);
    }
    // ⑷ 템스 강가의 밤
    await withPic('globe_thames', '템스 강가의 밤 (1613.6.29)', function () { return play([
      [null, '밤. 템스 강가에서 세 사람이 그을린 얼굴로 앉아 있다. 강 건너에서 보면 글로브가 있던 자리에 붉은 숯만 남았다.'],
      ['W', '(오래 말이 없다가) …앤. 아까 불 속에서, 나는 처음으로 내가 쓴 것들이 하나도 아깝지 않았소. 당신만 살아 있으면 되었소.'],
      ['A', '스무 해를 기다렸어요, 윌. 그 말 한마디를.', 'sad'],
      ['W', '사람들은 우리가 불에 탔다고 생각할 거요. 극장 안으로 뛰어 들어가는 걸 다들 봤으니까. …그렇게 믿게 둡시다.'],
      ['W', '「온 세상이 무대요, 모든 남녀는 배우일 뿐」 — 내가 쓴 말이지만, 나는 늘 육지의 무대만 알았소. 선장, 바다는 가장 큰 무대 아니오? 우리 둘을 그 무대에 태워 주겠소? 나는 이야기를 짓고, 앤은 거기에 가락을 붙이겠소. 갑판이 우리의 극장이오.'],
      ['A', '저는 빵도 굽고 약초도 달여요. 선원들이 굶거나 앓을 일은 없을 거예요.', 'happy']
    ]); });
    var v4 = await UI.ask('「그날 둘은 사라졌다」 — 셰익스피어와 앤을 배에 태우겠는가?', [{ label: '태운다 — 「바다가 당신들의 무대요」', value: 'yes', icon: 'heart' }, { label: '스트랫퍼드로 돌아가시오', value: 'no' }], me());
    b.joined = v4 === 'yes' ? 'yes' : 'no';
    if (b.joined === 'yes') {
      var c = G.CITY_DATA[LONDON];
      if (!row('shakespeare') && G.Legend && G.Legend.join) { var w = G.Legend.join('shakespeare', c); if (w) w.loyal = 90; }
      if (G.Legend && G.Legend.join) { var a = G.Legend.join('anne_hathaway', c); if (a) a.loyal = 90; }
      keepYears();
      var so = G.Fame.add('so', 200);
      await play([[null, '새벽, 썰물을 타고 배가 템스 강을 빠져나갔다. 선미에 선 두 사람은 런던을 한 번도 돌아보지 않았다. 대신 셰익스피어가 낮게 읊었다 — 「우리는 꿈과 같은 재료로 만들어졌으니….」']]);
      G.State.log('글로브 극장이 불탄 날, 셰익스피어와 아내 앤 해서웨이를 불길에서 구했다. 둘은 세상에서 사라지기로 하고 배에 올랐다 — 이제 바다에서 이야기를 노래한다. (사교 명성 +' + so + ')');
      UI.toast('셰익스피어 · 앤 해서웨이 — 둘이 함께 배에 있으면 바다에서 이야기를 노래한다', 'heart', 6000);
      if (G.Audio) G.Audio.sfx('cheer');
    } else {
      await play([['A', '그럼 우리는 스트랫퍼드로 가요. 윌은 이제 펜 대신 사과나무를 돌볼 거예요. …고마워요, 선장님.']]);
      G.State.log('글로브 극장이 불탄 날 셰익스피어와 아내 앤을 구했다. 둘은 스트랫퍼드로 돌아갔다.');
    }
    refresh();
  }

  // ================================================================ ④ 바다의 이야기 노래
  GL.seaDay = async function () {
    var s = S(), b = s && s.globe, k = K(); if (!b || !both() || !s.loc || s.loc.mode !== 'sea') return false;
    if (b.songDay != null && s.day - b.songDay < (k.songGap || 20)) return false;
    if (!U.chance(k.song == null ? 0.06 : k.song)) return false;
    var L = G.GLOBE_SONGS || [], n = b.songN || 0, x = L[n % L.length]; if (!x) return false;
    b.songDay = s.day; b.songN = n + 1;
    var f = s.fleet, fat = k.songFatigue || 10, dis = k.songDisc || 6;
    await withPic('globe_deck', '갑판 위의 무대 — ' + x[0], function () { return play([
      [null, '해 질 녘 갑판. 셰익스피어가 뱃머리에 올라서고, 앤이 밧줄 더미에 앉아 가락을 고른다. 선원들이 하나둘 모여 앉는다. 오늘의 이야기는 ' + x[0] + '.'],
      [x[1] === 'anne_hathaway' ? 'A' : 'W', x[2]],
      [null, x[3]]
    ]); });
    f.fatigue = Math.max(0, (f.fatigue || 0) - fat); f.discipline = Math.min(100, (f.discipline || 0) + dis);
    UI.toast('갑판 위의 무대 — 피로 −' + fat + ' · 규율 +' + dis, 'people', 4200);
    if (G.Audio) G.Audio.sfx('cheer');
    return true;
  };

  // ================================================================ 도시에 들어설 때 · 바다에 걸기
  GL.pending = function () { if (!S()) return false; return anneOpen() || taleOpen(); };
  GL.check = async function () {
    if (GL._busy) return false; GL._busy = true;
    try { if (anneOpen()) await anne(); else if (taleOpen()) await tale(); } catch (e) { console.error(e); }
    GL._busy = false;
    return true;
  };
  function hook() {
    var RM = G.Romance; if (!RM || !RM.seaDay || GL.hooked) return;
    GL.hooked = true;
    var sea0 = RM.seaDay;
    RM.seaDay = async function () { var r = await sea0.apply(this, arguments); if (r) return r; try { return await GL.seaDay(); } catch (e) { console.error(e); return false; } };
  }
  hook();
  if (!GL.hooked) document.addEventListener('DOMContentLoaded', hook);
  GL._t = { tale: tale, anne: anne, fire: fire };
})(window.G = window.G || {});
