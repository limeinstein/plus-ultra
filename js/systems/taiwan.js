/* 타이완 — 정성공의 질란디아 공략(1661~1662) · 청의 타이완 정복(1683) (G.Taiwan) 2026-11-01 사용자 요청
   사람·소지품·조정값: js/data/taiwan.js. 정성공(h_zhengchenggong)·시랑(h_shilang)은 지역 사람 동료. 날짜는 게임의 양력.
   타이완에는 도시가 없다 — 하문(정씨의 근거지)·천주·나가사키·반탐에서 사건이 열리고, 해전은 타이완·팽호 앞바다에서 벌어진다(G.Rel.greatBattle center).
   ■ ① 녹이문을 건너다 (1661.3.1~5.29, 하문 — 네덜란드 사람이 아닐 때): 국성야 정성공이 금문에 함대를 모았다. 옛 네덜란드 통역 하빈의 바다 그림 —
        「사리 때 물이 차오르면 녹이문의 얕은 물길로 큰 배가 들어간다」 → 함께 건너 네덜란드 배(헥토르호 등)와 해전 (끝나면 하문으로)
        정성공을 부하로 데리고 있었으면 그는 제 함대로 돌아간다(1662년이 그의 마지막 해)
   ■ ② 질란디아의 항복 (1661.12.1~1662.1.31, 하문 — 정씨 편): 아홉 달의 포위 → 항복 조건 (명예롭게 내보낸다 / 회사의 재물을 다 빼앗는다) → 1662.2.1 항복 · 질란디아 성의 열쇠
   ■ ③ 구원 함대 (1661.6.1~12.31, 나가사키·반탐 — 정씨 편이 아닐 때, 네덜란드 사람이면 하문에서도): 바타비아 평의회가 카우의 구원 함대에 붙어 달라고 한다
        → 정씨의 정크 함대와 해전 (끝나면 그 항구로) · 이기면 성 안에 화약과 쌀을 들여보낸다. 그래도 카우는 달아나고, 질란디아는 끝내 넘어간다 (역사 그대로)
   ■ ④ 팽호 (1683.5.1~7.15, 하문·천주): 청의 수군 제독 시랑이 동산에 함대를 모았다. 그날 밤 정씨의 밀사도 찾아온다
        → 시랑의 편 / 정씨의 편 / 어느 편도 들지 않는다 → 팽호 앞바다 해전 (끝나면 그 항구로)
   ■ ⑤ 마지막 연평왕 (1683.10.3~, 하문·천주·나가사키): 정극상의 항복 · 시랑이 정성공의 사당에서 운다 · 시랑 편이면 시랑을 부하로 맞을 수 있다 / 정씨 편이면 대명의 마지막 깃발
   ■ 소식: 녹이문(1661.4.30) · 질란디아 항복(1662.2.1) · 국성야의 죽음(1662.6.23) · 정경의 죽음(1681.3.17) · 팽호 해전(1683.7.17) · 정극상의 항복(1683.10.3) · 대만부 설치(1684.5.27)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/tw_*.webp
   ■ 저장: s.taiwan = { met, side: 'zheng'|'dutch'|'none', cross, crossSaid, terms, surrender, relief, reliefSaid, p83: 'qing'|'zheng'|'none', penghu, penghuSaid, last, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var TW = G.Taiwan = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.taiwan) || {}; }
  var AMOY = 287, QUANZHOU = 175, NAGASAKI = 191, BANTAM = 168;
  var ZEELANDIA = { lon: 120.02, lat: 23.0 }, PENGHU = { lon: 119.45, lat: 23.5 };
  TW.PLACES = { zeelandia: ZEELANDIA, penghu: PENGHU };
  var D = TW.D = { crossFrom: 16610301, crossTo: 16610529, reliefFrom: 16610601, reliefTo: 16611231, termsFrom: 16611201, termsTo: 16620131, surrender: 16620201,
    pFrom: 16830501, pTo: 16830715, last: 16831003 };
  var NEWS_AT = { crossNews: 16610430, surrenderNews: 16620201, koxDeath: 16620623, jingDeath: 16810317, penghuNews: 16830717, lastNews: 16831003, prefecture: 16840527 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.taiwan) {
      s.taiwan = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.taiwan.told[k] = 1; });   // 옛 저장
    }
    if (!s.taiwan.told) s.taiwan.told = {};
    return s.taiwan;
  }
  TW.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function atCity(id) { return cityNow() === id; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var VOC = { name: '바타비아 평의회의 사자', lang: 3 }, ENVOY = { name: '정씨의 밀사', lang: 3 }, OFFICER = { name: '시랑의 부장', lang: 3 };
  var WHO = { P: me, Z: function (e) { return mateSp('h_zhengchenggong', e); }, SL: function (e) { return mateSp('h_shilang', e); }, F: first };
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
  function fame(kind, key) { var n = (K().fame || {})[key] || 0; return n ? G.Fame.add(kind, n) : 0; }
  function gold(key, k) { var n = Math.round(((K().gold || {})[key] || 0) * (k == null ? 1 : k)); S().player.gold += n; return n; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }
  function dutch() { return S().player.nation === 'NL'; }
  function leaveMate(id) { var s = S(), i = -1; s.mates.forEach(function (x, k) { if (x.id === id) i = k; }); if (i < 0) return false; s.mates.splice(i, 1); return true; }
  function join(id, loyal) {
    if (row(id) || !G.Legend || !G.Legend.join) return row(id);
    var m = G.Legend.join(id, G.CITY_DATA[cityNow() != null ? cityNow() : AMOY]); if (m && loyal) m.loyal = loyal;
    return m;
  }

  // ================================================================ 해전 자료
  function ships(list) { var a = [], n = []; list.forEach(function (x) { for (var i = 0; i < x[1]; i++) { a.push(x[0]); n.push(x[2][i % x[2].length]); } }); return { ships: a, names: n }; }
  function allies(list) { var out = []; list.forEach(function (x) { x[2].slice(0, x[1]).forEach(function (nm) { out.push({ type: x[0], name: nm, gun: x[3] || 'culverin' }); }); }); return out; }
  function spec(o) {
    var f = ships(o.foe);
    var x = { id: o.id, foe: o.foeName, ships: f.ships, names: f.names, foeLabel: o.label, allies: allies(o.allies || []), who: o.who, intro: o.intro, ask: o.ask,
      decline: o.decline, fightLabel: o.fightLabel, noLabel: o.noLabel, gun: o.gun || 'saker', gunK: o.gunK || 0.85, crewK: o.crewK || 1, gunNote: o.gunNote,
      win: o.win, lose: o.lose, backCity: o.back, center: o.center, place: o.place, noPrize: !!o.noPrize };
    x.onWin = function () { var b = st(); if (b) b[o.key] = 'won'; };
    x.onLose = function () { var b = st(); if (b && b[o.key] !== 'won') b[o.key] = 'lost'; };
    return x;
  }
  async function sea(sp) {
    var s = S(); if (!G.Rel || !G.Rel.greatBattle) return false;
    G.Rel.register(sp);
    if (s.rel && s.rel.battle) delete s.rel.battle[sp.id];
    return await G.Rel.greatBattle(sp);
  }
  var JUNK_NAMES = ['국성야의 대선', '좌선봉 대선', '우선봉 대선', '금문의 정크', '하문의 정크', '해징의 정크', '동산의 정크', '팽호의 정크', '화공선', '화공선'];
  var QING_NAMES = ['시랑의 대선', '청 수군 좌영 대선', '청 수군 우영 대선', '동산의 대선', '천주의 정크', '하문의 정크', '복주의 정크', '조주의 정크', '조선(鳥船)', '조선(鳥船)'];
  function crossSpec() {
    return spec({ id: 'tw_cross', key: 'cross', foeName: '네덜란드', label: '질란디아 앞바다의 동인도 회사 함대', back: AMOY, center: ZEELANDIA, place: '타이완 대원 앞바다',
      foe: [['lgalleon', 1, ['헥토르호']], ['galleon', 1, ["스흐라베란더호"]], ['pinnace', 2, ['핑크호', '마리아호']]],
      allies: [['ljunk', 3, ['국성야의 대선', '좌선봉 대선', '우선봉 대선']], ['junk', 4, ['금문의 정크', '하문의 정크', '해징의 정크', '동산의 정크']]],
      who: { mate: 'h_zhengchenggong' },
      intro: '녹이문으로 들어간 배들이 뭍에 군사를 내리고 있소. 그런데 질란디아의 붉은 머리 배 넷이 바다로 나와 우리 정크를 막는구려. 저 큰 배 — 헥토르호만 꺾으면 나머지는 성으로 숨을 것이오. 선장, 그대의 배는 저들과 같은 서양 배요. 맞상대가 되어 주시오!',
      ask: '타이완 앞바다 — 국성야의 정크 함대와 함께 네덜란드 배와 싸우겠는가?', decline: '…좋소. 우리 정크만으로도 저들을 성으로 몰아넣을 수 있소.',
      gunNote: '네덜란드 배는 포가 많고 멀리 쏜다 — 정크 함대가 둘러싸 붙는 사이에 큰 배(헥토르호)를 노리시오.',
      win: { fame: K().fame.cross, gold: K().gold.cross, text: '타이완 앞바다에서 헥토르호를 꺾었다. 네덜란드 배들이 질란디아 성 아래로 물러났다.' },
      lose: '타이완 앞바다에서 물러났다. 국성야의 정크들은 그래도 녹이문 안쪽을 지켰다.' });
  }
  function reliefSpec(back) {
    return spec({ id: 'tw_relief', key: 'relief', foeName: '정씨', label: '국성야의 정크 함대', back: back, center: ZEELANDIA, place: '질란디아 앞바다',
      foe: [['ljunk', 3, JUNK_NAMES.slice(0, 3)], ['junk', 5, JUNK_NAMES.slice(3, 8)], ['shachuan', 2, JUNK_NAMES.slice(8)]],
      allies: [['fluyt', 3, ['카우의 기함 「호흐란트」', '「쿠데케르케」', '「텍셀」']], ['pinnace', 1, ['「베스트카펠러」']]],
      who: { hist: 'tw_caeuw' },
      intro: '(바람 방향만 묻던 카우가 마지못해 지휘봉을 든다) 저 정크 떼를 뚫어야 성에 화약과 쌀이 들어가오. 그대가 앞장서 주면… 우리도 따라가겠소. 아마도.',
      ask: '질란디아 구원 — 카우의 구원 함대와 함께 정씨의 정크 함대를 뚫겠는가?', fightLabel: '앞장서 뚫는다', decline: '…역시 바람이 좋지 않군. 바타비아에 그렇게 보고하겠소.',
      gunNote: '정크 함대는 수가 많고 화공선을 쓴다 — 붙기 전에 포로 흩고, 국성야의 대선을 노리시오.',
      win: { fame: K().fame.relief, gold: K().gold.relief, text: '정씨의 정크 함대를 뚫고 질란디아 성 아래에 화약과 쌀을 내렸다!' },
      lose: '정크 떼에 둘러싸여 물러났다. 질란디아 성의 깃발은 아직 걸려 있다.' });
  }
  function penghuSpec(side, back) {
    var qing = side === 'qing';
    return spec(qing ? { id: 'tw_penghu', key: 'penghu', foeName: '동녕', label: '유국헌의 정씨 수군', back: back, center: PENGHU, place: '팽호 앞바다',
      foe: [['ljunk', 3, ['유국헌의 대선', '좌영 대선', '우영 대선']], ['junk', 6, JUNK_NAMES.slice(3, 9)], ['shachuan', 2, ['화공선', '화공선']]],
      allies: [['ljunk', 4, QING_NAMES.slice(0, 4)], ['junk', 3, QING_NAMES.slice(4, 7)]],
      who: { mate: 'h_shilang' },
      intro: '남풍이 부는 여름에는 아무도 바다를 건너지 않는다고들 하지. 그래서 지금 가는 것이오. 유국헌은 태풍이 우리를 막아 줄 거라 믿고 있소. 팽호만 떨어지면 타이완은 저절로 무릎을 꿇을 것이오.',
      ask: '팽호 해전 — 시랑의 청 수군과 함께 싸우겠는가?', decline: '…좋소. 이 바다는 내가 잘 아니까.',
      gunNote: '정씨 수군은 팽호의 포대 아래에 진을 쳤다 — 다섯 척씩 짝을 지어 한 척을 둘러싸는 것이 시랑의 싸움법이오.',
      win: { fame: K().fame.penghu, gold: K().gold.penghu, text: '팽호 해전 — 시랑의 함대와 함께 유국헌의 정씨 수군을 무너뜨렸다.' },
      lose: '팽호 앞바다에서 물러났다. 시랑의 함대는 그래도 이튿날 다시 나섰다.' }
    : { id: 'tw_penghu', key: 'penghu', foeName: '청', label: '시랑의 청 수군', back: back, center: PENGHU, place: '팽호 앞바다',
      foe: [['ljunk', 4, QING_NAMES.slice(0, 4)], ['junk', 6, QING_NAMES.slice(4, 10)]],
      allies: [['ljunk', 2, ['유국헌의 대선', '좌영 대선']], ['junk', 3, ['팽호의 정크', '동녕의 정크', '안평의 정크']]],
      who: { hist: 'tw_liu' },
      intro: '태풍 철에 시랑이 바다를 건너오다니, 미친 자로다. 하지만 그자는 이 바다를 우리만큼 아오 — 원래 우리 사람이었으니. 선장, 팽호가 떨어지면 대명의 마지막 땅도 끝이오. 함께 막아 주시오.',
      ask: '팽호 해전 — 유국헌의 정씨 수군과 함께 청의 함대를 막겠는가?', decline: '…그대를 탓하지 않소. 이 싸움은 이길 수 없는 싸움일지도 모르니.',
      gunNote: '청의 함대는 다섯 척이 한 척을 둘러싼다 — 시랑의 대선을 꺾으면 그 무리가 흩어진다.',
      win: { fame: K().fame.penghu, gold: Math.round(K().gold.penghu * 0.6), text: '팽호 앞바다에서 시랑의 대선을 물리쳤다! 그러나 다른 물목에서 정씨의 배들이 무너지고 있었다.' },
      lose: '팽호 앞바다에서 물러났다. 정씨 수군이 무너졌다.' });
  }
  TW._specs = { cross: crossSpec, relief: reliefSpec, penghu: penghuSpec };

  // ================================================================ 소식
  TW.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, east = !!b.met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('crossNews', east && !b.cross, 'ship', '【녹이문】 국성야 정성공의 함대 사백 척이 사리 물때를 타고 타이완 녹이문의 얕은 물길로 들어갔다. 네덜란드 사람들은 큰 배가 지날 수 없는 물길이라 믿고 있었다.');
    news('surrenderNews', east, 'castle', b.terms === 'honor'
      ? '【질란디아 항복】 아홉 달을 버틴 질란디아 성의 코이엣 총독이 항복 문서에 서명했다. 네덜란드 사람들은 깃발을 들고 북을 치며 성을 나섰다 — 그 조건을 국성야에게 권한 것은 바다의 이방인 선장이었다고 한다.'
      : b.relief === 'won'
        ? '【질란디아 항복】 아홉 달을 버틴 질란디아 성의 코이엣 총독이 끝내 항복했다. 마지막 몇 달을 버틴 화약과 쌀은 정크 함대를 뚫고 들어온 어느 선장의 배가 실어 온 것이었다.'
        : '【질란디아 항복】 아홉 달을 버틴 질란디아 성의 코이엣 총독이 항복했다. 서른여덟 해 동안 타이완에 있던 네덜란드 동인도 회사가 섬을 떠난다. 국성야는 이 섬을 동녕이라 부르고 명의 연호를 쓴다.');
    news('koxDeath', east, 'skull', '【국성야의 죽음】 타이완의 정성공이 서른여덟의 나이로 세상을 떠났다. 학질이라고도 하고, 아들의 일로 분을 삭이지 못해서라고도 한다. 「나는 선왕을 뵐 낯이 없다」 — 그가 남긴 마지막 말이라 한다.');
    news('jingDeath', east, 'skull', '【정경의 죽음】 동녕을 다스리던 정성공의 아들 정경이 세상을 떠났다. 열두 살 손자 정극상이 뒤를 이었으나, 신하들이 서로 다툰다고 한다.');
    news('penghuNews', east && !b.penghu, 'ship', '【팽호 해전】 청의 수군 제독 시랑이 남풍을 타고 팽호를 쳤다. 다섯 척이 한 척을 둘러싸는 싸움법에 유국헌의 정씨 수군이 무너졌다.');
    news('lastNews', east, 'flag', b.p83 === 'zheng'
      ? '【마지막 연평왕】 열세 살 연평왕 정극상이 머리를 깎고 청에 항복했다. 바다 위에서 쓰던 명의 연호가 끝났다. 팽호의 불길 속에서 대명의 깃발 하나를 건져 간 이방인 선장이 있었다고 한다.'
      : '【마지막 연평왕】 열세 살 연평왕 정극상이 머리를 깎고 청에 항복했다. 시랑은 정성공의 사당에 제사를 올리며 울었다고 한다. 「나는 그대의 원수였으나, 그대의 아들과 손자에게는 원한이 없소.」');
    news('prefecture', east, 'castle', '【대만부】 청 조정이 타이완을 버리자는 말을 물리치고 대만부를 두어 복건에 붙였다. 바닷길을 막던 해금도 풀렸다.');
    return out;
  };

  // ================================================================ ① 녹이문을 건너다 (1661.3~5, 하문)
  function crossOpen() { var b = st(), t = today(); return !!(b && !b.side && !dutch() && atCity(AMOY) && t >= D.crossFrom && t <= D.crossTo); }
  async function cross() {
    var b = st(); b.met = 1;
    var aboard = row('h_zhengchenggong');
    await withPic('tw_jinmen', '금문의 함대 (1661)', function () { return play([
      [null, '하문 앞 금문도. 수백 척의 정크가 돛을 걷고 바람을 기다린다. 뱃전마다 「明」 자 깃발과 「國姓」 깃발이 섞여 펄럭인다.'],
      aboard ? ['Z', '선장, 여기까지 함께 와 주어 고맙소. 이제 나는 내 함대로 돌아가야 하오. …그대의 배는 내 깃발 옆에 서 주겠소?'] : ['Z', '국성야 정성공이오. 아버지는 청에 항복했지만 나는 하지 않았소. 청은 하문과 금문을 조여 오고, 남경을 치다 진 뒤로 군사들은 먹을 것이 모자라오. 바다 건너 타이완 — 붉은 머리(네덜란드 사람)들이 차지한 그 섬이 우리의 새 땅이 될 것이오.'],
      ['tw_hebin', '(소매에서 바다 그림을 꺼내며) 질란디아에서 통역을 하던 하빈이오. 붉은 머리들은 녹이문의 물길이 얕아 큰 배가 못 들어온다고 믿소. 그런데 사리 때 물이 차오르면 — 한 자 반이 더 깊어지오. 그날 밤 아무도 지키지 않는 물길로 사백 척이 들어갈 수 있소.'],
      ['Z', '하빈의 말이 맞다면, 하늘이 이 섬을 우리에게 주는 것이오. 선장, 그대는 붉은 머리들의 배를 잘 아는 서양 선장이오. 함께 건너 주겠소?']
    ]); });
    if (aboard) { leaveMate('h_zhengchenggong'); UI.toast('정성공이 제 함대로 돌아갔다', 'boot', 4600); }
    var went = await sea(crossSpec());
    b.side = went ? 'zheng' : 'none';
    log(went ? '하문에서 국성야 정성공의 함대와 함께 타이완으로 건넜다.' : '국성야 정성공의 타이완 원정에 함께하지 않았다.');
  }
  function crossAfterOpen() { var b = st(); return !!(b && b.side === 'zheng' && b.cross && !b.crossSaid && atCity(AMOY)); }
  async function crossAfter() {
    var b = st(); b.crossSaid = 1;
    await play(b.cross === 'won'
      ? [['Z', '헥토르호가 불길에 휩싸여 가라앉는 것을 보았소. 그대가 아니었으면 우리 정크가 그 배 하나에 수십 척은 잃었을 것이오. 프로방시아 성(적감성)은 벌써 항복했소. 이제 질란디아만 남았소 — 굶겨서 떨어뜨릴 것이오.'],
        ['Z', '겨울이 오면 다시 하문으로 와 주시오. 성이 무너질 때, 항복 조건을 정하는 자리에 서양 사람이 하나쯤 있어야 하오.']]
      : [['Z', '바다에서는 졌지만 뭍에서는 이겼소. 프로방시아 성이 항복했소. 질란디아는 굶겨서 떨어뜨릴 것이오. …겨울에 하문으로 오시오. 항복 자리에 그대가 필요하오.']]);
    UI.toast('1661년 12월~1662년 1월 하문으로 — 질란디아의 항복 자리', 'castle', 5600);
  }

  // ================================================================ ② 질란디아의 항복 (1661.12~1662.1, 하문)
  function termsOpen() { var b = st(), t = today(); return !!(b && b.side === 'zheng' && b.crossSaid && !b.terms && atCity(AMOY) && t >= D.termsFrom && t <= D.termsTo); }
  async function terms() {
    var b = st(), s = S();
    await UI.fade(function () { var d = Math.max(1, U.dayIndex({ y: 1662, m: 2, d: 1 }) - U.dayIndex(s.date)); if (G.Game.passDays) G.Game.passDays(Math.min(d, 62)); });
    await withPic('tw_zeelandia', '질란디아의 항복 (1662)', function () { return play([
      [null, '1662년 2월 1일. 질란디아 성의 붉은 벽돌 성벽은 포탄 자국투성이다. 성 안에서는 굶주림과 이질로 수백 명이 죽었다. 흰 깃발을 단 작은 배 하나가 국성야의 진영으로 건너온다.'],
      ['tw_coyett', '포르모사 총독 코이엣이오. …더 버틸 화약도 쌀도 없소. 우리 사람들의 목숨만은 구하고 싶소.'],
      ['Z', '(제독을 돌아보며) 선장, 그대는 서양 사람이니 서양의 법을 알 것이오. 어떻게 내보내는 것이 옳겠소?']
    ]); });
    var v = await UI.ask('질란디아의 항복 조건', [
      { label: '「깃발과 북을 들고 명예롭게 나가게 하시오」 — 무기·짐을 지니고 떠나게 한다', value: 'honor', icon: 'flag' },
      { label: '「회사의 재물은 모두 거두시오」 — 사람만 내보낸다 (몫 금화 ×1.5)', value: 'loot', icon: 'coin' }], me());
    b.terms = v; b.surrender = 1;
    var g = gold('surrender', v === 'loot' ? 1.5 : 1), f = fame('so', 'surrender');
    await play(v === 'honor'
      ? [['Z', '좋소. 바다의 사람은 바다의 사람을 존중해야지. (코이엣에게) 그대들은 깃발을 들고 북을 치며 나가시오. 그러나 이 섬에는 다시 오지 마시오.'],
        ['tw_coyett', '(오래 제독을 바라보다가) …고맙소. 바타비아는 나를 벌하겠지만, 이 사람들은 살아서 집에 갈 것이오.']]
      : [['Z', '회사의 은과 비단은 이 섬을 지킬 군사들의 쌀이 될 것이오. 사람들은 빈손으로 나가시오.'],
        ['tw_coyett', '…이것이 바다의 법이오? 기억해 두겠소.']]);
    give('tw_key');
    await play([['Z', '(쇠 열쇠를 제독의 손에 쥐여 주며) 서른여덟 해 만에 이 섬이 바다의 사람들에게 돌아왔소. 이 열쇠를 가져가시오. …나는 이 섬을 동녕(東寧)이라 부를 것이오. 언젠가 대명이 다시 서는 날까지.']]);
    log('질란디아 성이 항복했다. 국성야 정성공 곁에서 항복 조건을 정했다 — ' + (v === 'honor' ? '네덜란드 사람들을 명예롭게 내보냈다.' : '회사의 재물을 거두었다.') + ' (금화 +' + U.num(g) + ' · 사교 명성 +' + f + ')');
    UI.toast('질란디아 성의 열쇠 · 금화 +' + U.num(g), 'castle', 6000);
    refresh();
  }

  // ================================================================ ③ 구원 함대 (1661.6~12, 나가사키·반탐 — 네덜란드면 하문에서도)
  function reliefOpen() {
    var b = st(), t = today(), c = cityNow(); if (!b || b.side === 'zheng' || b.relief || t < D.reliefFrom || t > D.reliefTo) return false;
    return c === NAGASAKI || c === BANTAM || (dutch() && c === AMOY);
  }
  async function relief() {
    var b = st(); b.met = 1;
    await withPic('tw_relief', '바타비아의 구원 함대 (1661)', function () { return play([
      [VOC, '선장, 바타비아 평의회의 명이오. 포르모사의 질란디아 성이 국성야의 군대에 에워싸였소. 야코프 카우가 배 열두 척으로 구원 함대를 이끌고 가는데… 솔직히 말하면, 평의회는 카우를 믿지 않소.'],
      [VOC, dutch() ? '그대는 우리나라 사람이오. 회사의 깃발 아래 앞장서 주시오. 성 안에는 여자와 아이들도 있소.' : '그대는 회사 사람이 아니지만, 바다에서 이름난 선장이라 들었소. 회사는 값을 후하게 치르오. 성 안에는 여자와 아이들도 있소.'],
      ['tw_caeuw', '(뒤에서 끼어들며) 질란디아 앞바다는 겨울 북풍이 거세오. 배를 대기도 어렵소. 나는… 신중하게 갈 생각이오.']
    ]); });
    var went = await sea(reliefSpec(cityNow()));
    if (went && b.side !== 'zheng') b.side = 'dutch';
    if (!went) log('바타비아의 질란디아 구원 함대에 붙지 않았다.');
  }
  function reliefAfterOpen() { var b = st(); return !!(b && b.relief && !b.reliefSaid && (atCity(NAGASAKI) || atCity(BANTAM) || atCity(AMOY))); }
  async function reliefAfter() {
    var b = st(); b.reliefSaid = 1;
    if (b.relief === 'won') {
      give('tw_medal');
      await play([
        [null, '질란디아 성 아래 모래톱에 화약 통과 쌀자루가 내려졌다. 성벽 위에서 굶주린 병사들이 모자를 흔든다.'],
        ['tw_coyett', '(성문에서 제독의 손을 잡고) 석 달은 더 버틸 수 있겠소. …그런데 카우의 배들이 보이지 않소. 그자가 어디로 갔소?'],
        ['F', '제독… 카우는 「성과 협상하러 간다」며 빠져나가서는 시암 쪽으로 달아났답니다. 구원 함대는 사실상 우리 배뿐이었습니다.'],
        ['tw_coyett', '…그렇다면 이 성은 결국 넘어가겠지. 그래도 오늘 그대가 가져온 쌀로 아이들이 겨울을 넘길 것이오. 이 메달을 받으시오. 회사가 그대에게 진 빚이오.']
      ]);
      log('질란디아 성에 화약과 쌀을 들여보냈다. 코이엣 총독이 동인도 회사의 은 메달을 주었다. 구원 함대의 카우는 달아났다.');
    } else await play([['tw_caeuw', '(멀리서) 바람이 나쁘오, 바람이! 바타비아로 돌아가 다시 오겠소!'], ['F', '…제독, 저 사람은 다시 오지 않을 겁니다.']]);
    UI.toast('질란디아는 1662년 2월 1일에 항복한다 (역사 그대로)', 'castle', 5200);
  }

  // ================================================================ ④ 팽호 (1683.5~7.15, 하문·천주)
  function penghuOpen() { var b = st(), t = today(); return !!(b && !b.p83 && (atCity(AMOY) || atCity(QUANZHOU)) && t >= D.pFrom && t <= D.pTo); }
  async function penghu() {
    var b = st(); b.met = 1;
    var aboard = row('h_shilang');
    await withPic('tw_dongshan', '동산의 청 수군 (1683)', function () { return play([
      [null, '동산만. 청의 수군 삼백 척이 남풍을 기다린다. 시랑의 대선 돛대에 「靖海」 두 글자가 걸렸다.'],
      aboard ? ['SL', '제독, 조정이 나를 다시 수군 제독으로 불렀소. 이 바다를 끝낼 사람이 나밖에 없다고. …그대도 함께 가 주겠소?'] : ['SL', '시랑이오. 나는 국성야의 장수였소. 그가 내 아비와 아우를 죽였지. 그래서 청에 귀순했소. …원한으로 바다를 건너는 것이 아니오. 이 바다의 싸움을 끝내려는 것이오.'],
      [null, '그날 밤, 제독의 배에 작은 배 하나가 몰래 다가왔다. 검은 옷의 사내가 뱃전으로 올라온다.'],
      [ENVOY, '동녕의 유국헌 장군이 보냈소. 대명의 마지막 땅을 지키는 데 서양 선장의 포가 필요하오. 시랑은 배신자요. 국성야께서 살아 계셨다면…']
    ]); });
    var v = await UI.ask('1683년 여름 — 누구의 편에 서겠는가?', [
      { label: '시랑의 청 수군과 함께 팽호로', value: 'qing', icon: 'flag' },
      { label: '밀사를 따라 유국헌의 정씨 수군으로', value: 'zheng', icon: 'ship' },
      { label: '어느 편도 들지 않는다', value: 'none' }], me());
    if (v === 'none') { b.p83 = 'none'; await play([['F', '…현명한 판단일지도 모릅니다. 이 싸움에 끼면 한쪽은 원수가 됩니다.']]); log('1683년 팽호의 싸움에 끼지 않았다.'); return; }
    if (aboard && v === 'zheng') { leaveMate('h_shilang'); await play([['SL', '…그렇다면 우리는 바다에서 적으로 만나겠구려. 잘 가시오, 제독.']]); UI.toast('시랑이 배를 떠났다', 'boot', 4600); }
    b.p83 = v;
    var went = await sea(penghuSpec(v, cityNow()));
    if (!went) { b.p83 = 'none'; log('팽호 해전에 나서지 않았다.'); }
  }
  function lastOpen() { var b = st(), t = today(); return !!(b && (b.p83 === 'qing' || b.p83 === 'zheng') && b.penghu && !b.last && t >= D.last && (atCity(AMOY) || atCity(QUANZHOU) || atCity(NAGASAKI))); }
  function penghuAfterOpen() { var b = st(); return !!(b && b.penghu && !b.penghuSaid && (atCity(AMOY) || atCity(QUANZHOU))); }
  async function penghuAfter() {
    var b = st(); b.penghuSaid = 1;
    await play(b.p83 === 'qing'
      ? [['SL', b.penghu === 'won' ? '팽호가 떨어졌소. 유국헌은 작은 배로 타이완으로 달아났소. …그대의 배가 저들의 대선을 묶어 둔 덕이오.' : '팽호는 이튿날 떨어졌소. 유국헌은 작은 배로 달아났소.'], ['SL', '이제 동녕은 스스로 무릎을 꿇을 것이오. 가을에 다시 오시오. 그 자리를 함께 봅시다.']]
      : [['tw_liu', b.penghu === 'won' ? '(피 묻은 얼굴로) 그대의 배는 시랑의 대선을 물리쳤소. 그러나 다른 물목이 모두 무너졌소… 팽호는 끝났소.' : '팽호는 끝났소. 우리 배는 거의 다 불탔소.'], ['tw_liu', '타이완으로 돌아가 왕께 아뢰겠소. …가을에 이 바다로 다시 오시오. 마지막을 봐 줄 사람이 있어야 하오.']]);
    UI.toast('1683년 10월 이후 하문·천주(·나가사키)에서 — 마지막 연평왕', 'flag', 5600);
  }

  // ================================================================ ⑤ 마지막 연평왕 (1683.10.3~)
  async function last() {
    var b = st(); b.last = 1;
    var lf = fame('so', 'last');
    if (b.p83 === 'qing') {
      await withPic('tw_shrine', '국성야의 사당 (1683)', function () { return play([
        [null, '타이완 안평. 열세 살 연평왕 정극상이 너무 큰 왕포를 입고 나와 무릎을 꿇는다. 앞머리를 막 깎아 변발을 했다.'],
        ['tw_keshuang', '(떨리는 목소리로) 동녕의 땅과 백성을… 대청 황제께 바치옵니다.'],
        [null, '그날 저녁, 시랑은 혼자 정성공의 사당에 들어가 오래 머물렀다. 문밖까지 울음소리가 들렸다.'],
        ['SL', '(사당을 나서며) …나는 그의 원수였소. 그래도 그는 이 바다에서 가장 큰 사람이었소. 이제 바다는 조용해질 것이오. 해금도 풀릴 것이고. 제독 같은 장사꾼들이 마음껏 오가겠지.']
      ]); });
      var v = await UI.ask('시랑에게', [
        { label: '「함께 바다로 가시겠소?」 — 부하로 청한다', value: 'ask', icon: 'people' },
        { label: '「정해후(靖海侯)의 이름이 어울리시오」 — 작별한다', value: 'bye' }], me());
      if (v === 'ask' && !row('h_shilang')) { await play([['SL', '…황제께서 나를 정해후로 봉하신다는구려. 하지만 후작의 관복은 갑갑하오. 좋소! 몇 해쯤은 그대의 배에서 바람을 쐬어도 되겠지.']]); join('h_shilang', 85); b.shilang = 'join'; }
      else await play([['SL', '하하, 그 이름은 무겁구려. 잘 가시오, 제독. 이제 이 바다에서는 아무도 그대를 쏘지 않을 것이오.']]);
      log('정극상이 청에 항복했다. 시랑이 정성공의 사당에서 울었다. (사교 명성 +' + lf + ')');
    } else {
      give('tw_banner');
      await withPic('tw_banner', '대명의 마지막 깃발 (1683)', function () { return play([
        [null, '안평 바닷가. 정씨의 사람들이 마지막 배에 오르지 못한 채 바다를 바라본다. 성 안에서는 어린 왕이 청의 사신 앞에 무릎을 꿇었다.'],
        ['tw_liu', '(그을린 깃발을 접어 제독에게 건네며) 왕께서는 청에 항복하셨소. 나도 그 길을 따를 것이오. 그러나 이 깃발만은 청의 손에 넘길 수 없소.'],
        ['tw_liu', '국성야께서 바다에 띄운 대명의 이름이오. 그대의 배에 실어 가 주시오. 언젠가 누가 이 깃발을 보고 묻거든 — 바다 위에 명이 마지막까지 있었다고 말해 주시오.']
      ]); });
      log('정극상이 청에 항복했다. 유국헌이 대명의 마지막 깃발을 맡겼다. (사교 명성 +' + lf + ')');
    }
    UI.toast('타이완이 청의 땅이 되었다 — 동녕의 끝', 'flag', 5600);
    refresh();
  }

  // ================================================================ 도시에 들어설 때
  var STEPS = [[crossAfterOpen, crossAfter], [termsOpen, terms], [reliefAfterOpen, reliefAfter], [crossOpen, cross], [reliefOpen, relief],
    [penghuAfterOpen, penghuAfter], [lastOpen, last], [penghuOpen, penghu]];
  TW.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  TW.check = async function () {
    if (TW._busy) return false; TW._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    TW._busy = false; refresh();
    return true;
  };
  TW._t = { cross: cross, crossAfter: crossAfter, terms: terms, relief: relief, reliefAfter: reliefAfter, penghu: penghu, penghuAfter: penghuAfter, last: last };
})(window.G = window.G || {});
