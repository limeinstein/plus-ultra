/* 정묘호란·병자호란 — 남한산성의 마흔엿새 (G.Horan) 2026-11-01 사용자 요청
   「정묘호란·병자호란 — 후금과 청이 조선을 침공. 병자호란 이후 플레이어가 개입하여 삼전도의 굴욕을 피할 수도 있게 해줘」
   사람·조정값: js/data/horan.js (G.HIST_FIG · G.BALANCE.horan). 최명길(h_choemyeonggil)·임경업(h_imgyeongeop)은 지역 사람 동료
   날짜는 게임의 양력이다 (음력 날짜는 korean-lunar-calendar로 바꾸었다)
   ■ 정묘년 (1627)
     ① 후금이 압록강을 건넜다 (1627.2.28~4.17, 조선 도시): 최명길이 제독을 찾는다 →
        (가) 강화도로 가는 피란 배를 낸다 (날이 지나간다 · 사교 명성) (나) 용골산성의 정봉수에게 화약을 나른다 (다) 사양
     ② 용골산성 (뭍 124.9, 39.9 둘레 — 1627.4.30까지): 정봉수와 함께 후금 기병을 막는다 (육상전)
     소식: 형제의 맹약 (1627.4.18)
   ■ 병자년 (1636~1637)
     ③ 청의 국호 (1636.5.15 소식) · 경고 (1636.12.1~1637.1.8, 조선 도시): 최명길 — 「압록강이 얼면 그들이 온다」. 세 가지 일을 맡긴다
     ④ 세 가지 개입 (하나라도 하면 「개입했다」)
        A 남한산성에 군량을 (뭍 127.18, 37.48 둘레, 1637.1.9~2.23): 수원·남양 마을에서 쌀을 사 모아(금화 foodCost) 포위를 뚫는다 (육상전 — 지면 retry일 뒤 다시)
        B 강화도를 지킨다 (한양에 바닷길로 들어설 때, 1637.1.20~2.16): 봉림대군과 함께 갑곶 나루를 건너오는 청의 배를 막는다 (해전 — 끝나면 한양으로)
        C 백마산성의 임경업 (뭍 124.6, 40.2 둘레, 1637.1.4~2.23): 청군 뒤의 보급 행렬을 끊는다 (육상전)
     ⑤ 남한산성의 담판 (뭍 남한산성 둘레, 1637.2.10~2.23): 강화도를 지켰고(B 필수) 세 가지 가운데 need(2)개 이상이면 —
        최명길이 쓴 국서를 김상헌이 찢는다 → 제독이 최명길과 함께 탄천의 청 진영으로 → 홍타이지 앞에서 무엇을 말할까
        「강화가 버티고, 압록강의 얼음이 곧 녹는다 · 진중에 마마가 돈다」가 맞는 말 (틀리면 웅변 2단계 이상이거나 최명길이 배에 있거나 정묘년에 도왔으면 한 번 더)
        → 성공: 임금은 성문을 나서지 않는다 — 삼배구고두 없이 화약을 맺고 청이 군사를 물린다 · 세자는 볼모로 가지 않는다 · 조선 명예 작위 · 최명길·임경업을 태울 수 있다
        → 실패·조건 미달: 역사 그대로 — 1637.2.24 삼전도의 굴욕, 3.4 소현세자·봉림대군 심양으로
     소식: 청의 도강(1.4) · 남한산성(1.9) · 강화도(2.16 — 지켰으면 「버텼다」) · 삼전도(2.24 — 결말에 따라) · 볼모(3.4)
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/horan_*.webp
   ■ 저장: s.horan = { c1, ferry, yonggol, warn, food, foodCool, ganghwa, baekma, talk, end: 'avoided'|'history', tries, joinChoi, joinIm, title, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var HR = G.Horan = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.horan) || {}; }
  var HANYANG = 190, KOREA = [190, 226, 227, 228, 229];
  var YONGGOL = [124.9, 39.9], NAMHAN = [127.18, 37.48], BAEKMA = [124.6, 40.2];
  HR.PLACES = { yonggol: YONGGOL, namhan: NAMHAN, baekma: BAEKMA };
  var D = HR.D = { c1From: 16270228, c1To: 16270417, yonggolTo: 16270430, warnFrom: 16361201, warnTo: 16370108, cross: 16370104, siege: 16370109,
    foodTo: 16370223, ganghwaFrom: 16370120, ganghwaTo: 16370216, talkFrom: 16370210, samjeon: 16370224 };
  var NEWS_AT = { jinCross: 16270228, brother: 16270418, qingName: 16360515, qingCross: 16370104, namhanNews: 16370109, ganghwaNews: 16370216, samjeonNews: 16370224, hostage: 16370304 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.horan) {
      s.horan = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.horan.told[k] = 1; });   // 옛 저장
    }
    if (!s.horan.told) s.horan.told = {};
    return s.horan;
  }
  HR.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function inKoreaCity() { return KOREA.indexOf(cityNow()) >= 0; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var CROWD = { name: '피란민', lang: 3 }, SOLDIER = { name: '산성의 군졸', lang: 3 }, GUARD = { name: '청의 군사', lang: 3 };
  var WHO = { P: me, C: function (e) { return mateSp('h_choemyeonggil', e); }, I: function (e) { return mateSp('h_imgyeongeop', e); }, F: first };
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
  function dist(lon, lat, p) { return G.Geo.dist(lon, lat, p[0], p[1]); }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  function join(id, loyal) {
    if (row(id) || !G.Legend || !G.Legend.join) return row(id);
    var m = G.Legend.join(id, G.CITY_DATA[HANYANG]); if (m && loyal) m.loyal = loyal;
    return m;
  }
  function battleOf(ctx) { return ctx && ctx.battle ? ctx.battle : function (nm, n, o) { return G.Scenes.land.landBattle(nm, n, false, o); }; }
  function foe(k) { return (K().foe || {})[k] || 30; }
  /** 세 가지 개입 가운데 해낸 수 (A 군량 · B 강화도 · C 백마산성) */
  function score() { var b = st(); return (b.food === 'in' ? 1 : 0) + (b.ganghwa === 'held' ? 1 : 0) + (b.baekma === 'cut' ? 1 : 0); }
  HR.score = score;
  function canTalk() { var b = st(); return b.ganghwa === 'held' && score() >= (K().need || 2); }
  HR.canTalk = canTalk;
  /** 조선의 명예 작위 한 칸 (js/systems/court.js — G.COURT.realms.KR) */
  async function titleUp(by, why) {
    var CT = G.Court, realm = G.COURT && G.COURT.realms && G.COURT.realms.KR, s = S();
    if (!CT || !realm) return null;
    var c = CT.state(), n = CT.rank(realm) + 1, tt = CT.title(realm, n);
    if (!tt) { s.player.gold += 5000; UI.toast('조선 조정의 하사금 금화 +5,000', 'coin', 5000); log(why + ' 조선 조정이 하사금 금화 5,000닢을 내렸다.'); return 'gold'; }
    c.titles[realm.id] = n;
    if (G.Growth && G.Growth.event) G.Growth.event('cha', 1, tt.ko + ' 제수 — 조선 조정의 예법을 익혔다');
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">' + U.esc(realm.name) + ' · 명예 작위</div><div style="font-size:34px;font-weight:800;margin:6px 0">' + U.esc(tt.ko) + '</div><div style="font-size:16px" class="muted">' + U.esc(by) + '</div><div style="margin-top:10px">' + U.esc(why) + '</div></div>', '명예 작위');
    log(why + ' 조선의 명예 작위 ' + (CT.fullName ? CT.fullName(tt, true) : tt.ko) + '를 받았다.');
    UI.toast((CT.fullName ? CT.fullName(tt, true) : tt.ko) + ' — 조선의 명예 작위', 'crown', 6000);
    if (G.Audio) G.Audio.sfx('discover');
    return tt.ko;
  }

  // ================================================================ 날마다 — 소식
  HR.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!(b.c1 || b.warn || b.food || b.ganghwa || b.baekma), east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    var won = b.end === 'avoided';
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('jinCross', east, 'skull', '【정묘년】 후금의 패륵 아민이 군사 삼만을 이끌고 언 압록강을 건넜다. 의주가 무너지고 안주가 떨어졌다. 임금은 강화도로 옮겨 간다고 한다.');
    news('brother', east, 'scroll', '【형제의 맹약】 조선과 후금이 강화도에서 맹약을 맺었다. 후금을 형으로, 조선을 아우로 삼는다. 후금 군사가 물러간다.' +
      (b.yonggol === 'win' ? ' 용골산성의 정봉수가 끝까지 버틴 덕에 후금군의 뒤가 불안했다는 말이 돈다 — 그 곁에 바다의 이방인이 있었다고.' : b.ferry ? ' 강화도로 건너간 피란민 가운데에는 이방인 선장의 배를 탄 사람이 많았다.' : ''));
    news('qingName', true, 'crown', '【청】 후금의 홍타이지가 심양에서 황제의 자리에 오르고 나라 이름을 「대청(大淸)」이라 했다. 조선의 사신들은 절하기를 거부했다고 한다.');
    news('qingCross', east, 'skull', '【병자년】 청의 황제 홍타이지가 몸소 군사 십여만을 이끌고 언 압록강을 건넜다. 백마산성의 임경업을 비켜 곧장 한양으로 달린다.');
    news('namhanNews', east, 'castle', '【남한산성】 강화도로 가는 길이 끊겨 임금이 남한산성에 들었다. 성 안의 군량은 오십 일 치뿐이라고 한다. 청군이 산성을 에워쌌다.');
    news('ganghwaNews', east, 'ship', b.ganghwa === 'held'
      ? '【강화도】 갑곶 나루로 배를 모아 건너오려던 청군이 바다에서 꺾였다. 봉림대군이 지키는 강화도가 버틴다. 그 앞바다에 이방인 선장의 배가 있었다고 한다.'
      : '【강화도 함락】 「하늘이 낸 요새」라던 강화도가 청군에 떨어졌다. 검찰사 김경징은 술을 마시다 달아났고, 세자빈과 봉림대군이 사로잡혔다. 늙은 대신 김상용은 화약에 불을 붙여 죽었다.');
    news('samjeonNews', true, won ? 'flag' : 'skull', won
      ? '【남한산성의 화약】 청의 황제가 군사를 물렸다. 삼전도 나루에 수항단을 쌓았으나 조선의 임금은 끝내 성문을 나서지 않았다. 화약은 맺었되 무릎은 꿇지 않았다 — 압록강의 얼음이 녹기 전에 청이 서둘러 돌아갔다고 한다.'
      : '【삼전도】 조선의 임금이 남한산성 서문을 걸어 나와 삼전도의 수항단 아래에서 청의 황제에게 세 번 무릎 꿇고 아홉 번 머리를 땅에 찧었다. 마흔엿새 만의 항복이었다.');
    news('hostage', !won && east, 'boot', '【볼모】 소현세자와 봉림대군이 볼모가 되어 심양으로 끌려갔다. 척화를 주장한 신하들도 함께 끌려갔고, 수많은 백성이 포로로 북쪽으로 걸어갔다.');
    return out;
  };

  // ================================================================ ① 정묘년 — 후금이 압록강을 건넜다
  function c1Open() { var b = st(), t = today(); return !!(b && !b.c1 && t >= D.c1From && t <= D.c1To && inKoreaCity()); }
  async function c1() {
    var b = st(), s = S();
    await withPic('horan_jeongmyo', '정묘년의 겨울 (1627)', function () { return play([
      [null, '정묘년 겨울. 북쪽에서 온 파발마가 거리를 달린다. 「후금의 아민이 압록강을 건넜다! 의주가 무너졌다!」 사람들이 짐을 꾸리기 시작한다.'],
      ['C', '이조 참판 최명길이오. 바다의 선장이 이 항구에 있다고 들었소. …조정은 임금을 강화도로 모시기로 했소. 오랑캐는 말을 타지만 배는 탈 줄 모르니까.'],
      ['C', '부탁이 둘 있소. 강화도로 건너갈 백성의 배가 모자라오. 그리고 의주 남쪽 용골산성에서 의병장 정봉수가 버티고 있는데, 화약이 떨어져 간다 하오. 어느 쪽이든 도와주겠소?']
    ]); });
    var v = await UI.ask('후금이 쳐들어왔다 — 무엇을 돕겠는가?', [
      { label: '강화도로 가는 피란 배를 낸다 (사흘이 지나간다)', value: 'ferry', icon: 'ship' },
      { label: '용골산성의 정봉수에게 화약을 나른다 (의주 남쪽 — 뭍길)', value: 'yonggol', icon: 'cannon' },
      { label: '「남의 나라 싸움이오」', value: 'no' }], me());
    b.c1 = v;
    if (v === 'ferry') {
      var msgs = G.Game.passDays ? G.Game.passDays(3) : [];
      b.ferry = 1;
      var so = fame('so', 'ferry');
      await play([
        [null, '사흘 밤낮, 제독의 배가 한강 어귀와 강화도 갑곶 나루를 오갔다. 노인과 아이를 업은 아낙, 책 궤짝을 진 선비들이 갑판을 메웠다.'],
        [CROWD, '(나루에 내리며 제독의 손을 잡고) 고맙소, 고맙소… 바다 건너온 양반이 우리를 건네줄 줄이야.'],
        ['C', '이 은혜는 잊지 않겠소. …오랑캐는 곧 화의를 청할 것이오. 그러나 이것으로 끝나지는 않을 것이오. 그들은 다시 올 것이오.']
      ]);
      log('정묘년, 강화도로 가는 피란민을 배로 건네주었다. (사교 명성 +' + so + ')');
      if (msgs && msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
    } else if (v === 'yonggol') {
      await play([['C', '고맙소. 용골산성은 의주에서 남쪽으로 반나절 길, 산 위의 작은 성이오. 4월이 가기 전에 닿아야 하오. 정봉수에게 내 이름을 대시오.']]);
      log('정묘년, 최명길의 부탁으로 용골산성의 정봉수에게 화약을 나르기로 했다.');
      UI.toast('용골산성으로 — 의주 남쪽 산 위의 성 (4월 말까지, 뭍길)', 'map', 6000);
    } else await play([['C', '…그렇겠지. 남의 나라 사람에게 목숨을 걸어 달라 할 수는 없소. 몸조심하시오.']]);
    refresh();
  }

  // ================================================================ ③ 병자년 — 경고
  function warnOpen() { var b = st(), t = today(); return !!(b && !b.warn && t >= D.warnFrom && t <= D.warnTo && inKoreaCity()); }
  async function warn() {
    var b = st(); b.warn = 1;
    var known = !!b.c1 && b.c1 !== 'no';
    await withPic('horan_warn', '얼어붙는 압록강 (1636)', function () { return play([
      [null, '병자년 겨울. 북풍이 매섭다. 사람들은 「올해는 압록강이 일찍 언다」고 수군거린다.'],
      ['C', known ? '선장! 정묘년에 우리를 도왔던 그 선장이구려. 다시 만나 반갑소. …그러나 반가운 일로 만난 것은 아니오.' : '이조 판서 최명길이오. 바다의 선장이 왔다 하여 찾아왔소.'],
      ['C', '후금의 홍타이지가 황제를 칭하고 나라 이름을 청이라 했소. 조정은 그 사신을 내쫓았지. 「오랑캐를 섬길 수 없다」고. …압록강이 얼면 그들이 올 것이오. 이번에는 정묘년과 다르오.'],
      ['C', '세 가지를 부탁하오. 하나 — 산성에 들어갈 군량이오. 둘 — 강화도요. 오랑캐가 배를 모아 건너오면 강화는 무너지오. 셋 — 의주 백마산성의 임경업이 오랑캐의 뒤를 칠 기회를 엿보고 있소.'],
      ['C', '이 가운데 둘만 이루어도, 그리고 강화가 버티기만 하면… 임금께서 오랑캐 앞에 무릎 꿇는 일만은 막을 수 있을지 모르오.']
    ]); });
    log('병자년 겨울, 최명길이 청의 침공을 앞두고 세 가지를 부탁했다 — 남한산성의 군량 · 강화도의 바다 · 백마산성의 임경업.');
    UI.toast('세 가지 — 남한산성 군량(뭍) · 강화도(한양에 바닷길로) · 백마산성 임경업(의주, 뭍) — 강화도는 반드시', 'scroll', 8000);
    refresh();
  }

  // ================================================================ B 강화도의 바다 (한양에 바닷길로 들어설 때)
  function ganghwaOpen() {
    var b = st(), s = S(), t = today();
    return !!(b && (!b.ganghwa || b.ganghwa === 'declined') && t >= D.ganghwaFrom && t <= D.ganghwaTo && cityNow() === HANYANG && s.loc.via === 'sea');
  }
  function ganghwaSpec() {
    return { id: 'horan_ganghwa', foe: '청', ships: ['junk', 'shachuan', 'shachuan', 'shachuan', 'shachuan', 'junk'], names: ['청군 도강선 1호', '공유덕의 배', '경중명의 배', '징발한 고깃배', '징발한 짐배', '청군 도강선 2호'],
      foeLabel: '갑곶 나루를 건너오는 청군의 배', allies: [{ type: 'panokseon', name: '강화 수군 판옥선', gun: 'culverin' }, { type: 'maengseon', name: '충청 수군 맹선', gun: 'saker' }],
      who: { hist: 'bongrim' }, gun: 'perrier', gunK: 0.6, crewK: 1.1, backCity: HANYANG, place: '강화도 갑곶 앞바다',
      intro: '봉림대군이오. 검찰사 김경징은 「오랑캐가 무슨 수로 바다를 건너냐」며 술만 마시고 있소. 그런데 저 건너편을 보시오 — 명나라에서 항복한 공유덕·경중명의 수군이 배를 모아 왔소. 저들이 건너오면 강화는 끝이오. 세자빈과 원손이 여기 계시오.',
      ask: '강화도 갑곶 앞바다 — 청군의 배가 건너온다', fightLabel: '봉림대군과 함께 나루를 막는다', noLabel: '물러난다', decline: '…알겠소. 우리끼리라도 막아 보겠소.',
      gunNote: '청군의 배에는 큰 포가 적다 — 다만 배마다 군사가 가득하니 붙지 말고 멀리서 부수시오. 적 기함(도강선 1호)을 노리시오.',
      win: { fame: (K().fame || {}).ganghwa, so: 80, text: '강화도 갑곶 앞바다에서 청군의 도강선을 깨뜨렸다. 강화도가 버틴다!' },
      lose: '강화도 앞바다에서 물러났다. 청군의 배가 갑곶 나루로 건너간다.',
      onWin: function () { var b = st(); if (b) b.ganghwa = 'held'; },
      onLose: function () { var b = st(); if (b && b.ganghwa !== 'held') b.ganghwa = 'lost'; } };
  }
  HR.ganghwaSpec = ganghwaSpec;
  async function ganghwa() {
    var b = st(), s = S();
    await withPic('horan_ganghwa', '강화도 갑곶 나루 (1637)', function () { return play([
      [null, '한강 어귀. 강 건너 김포 쪽 나루에 배들이 모여든다. 청군의 깃발이다. 강화도 쪽 성벽 위에는 군사가 드문드문할 뿐이다.'],
      ['kimgyeongjing', '(술잔을 든 채 성루에서) 하하, 바다의 선장인가? 걱정 마시오. 강화는 하늘이 낸 요새요. 말 타는 오랑캐가 무슨 수로 바다를 건너겠소?'],
      ['F', '제독… 저쪽 나루의 배가 열 척이 넘습니다. 저 양반은 보지도 않는군요.']
    ]); });
    if (!G.Rel || !G.Rel.greatBattle) { b.ganghwa = 'none'; return; }
    G.Rel.register(ganghwaSpec());
    if (s.rel && s.rel.battle) delete s.rel.battle.horan_ganghwa;
    var went = await G.Rel.greatBattle(ganghwaSpec());
    if (!went) { b.ganghwa = 'declined'; log('강화도 앞바다에서 물러났다.'); }
  }

  // ================================================================ 뭍 (js/scenes/land.js 하루 끝)
  function landDue(lon, lat) {
    var b = st(), t = today(); if (!b) return null;
    if (b.c1 === 'yonggol' && !b.yonggol && t <= D.yonggolTo && dist(lon, lat, YONGGOL) < 0.35) return 'yonggol';
    if (!b.end && t >= D.talkFrom && t < D.samjeon && dist(lon, lat, NAMHAN) < 0.15 && canTalk() && !b.talk) return 'talk';
    if (!b.end && b.food !== 'in' && t >= D.siege && t <= D.foodTo && dist(lon, lat, NAMHAN) < 0.15 && !(b.foodCool && S().day < b.foodCool)) return 'food';
    if (!b.end && !b.baekma && t >= D.cross && t <= D.foodTo && dist(lon, lat, BAEKMA) < 0.4) return 'baekma';
    return null;
  }
  HR.landDue = landDue;
  var LAND = {};
  HR.onLand = async function (lon, lat, ctx) {
    var kind = landDue(lon, lat); if (!kind || HR._busy) return false;
    HR._busy = true;
    try { if (ctx && ctx.stop) ctx.stop(); await LAND[kind](ctx || {}); } catch (e) { console.error(e); }
    HR._busy = false; refresh(); return true;
  };

  // ② 용골산성
  LAND.yonggol = async function (ctx) {
    var b = st();
    await withPic('horan_yonggol', '용골산성 (1627)', function () { return play([
      [null, '의주 남쪽, 바위산 위의 작은 산성. 성벽 아래 들판에 후금 기병의 천막이 늘어섰다. 성 안에서는 농사꾼과 피란민이 활을 들고 있다.'],
      ['jeongbongsu', '최 참판이 보냈다고? 화약이라니… 하늘이 도왔구려. 정봉수요. 관군은 다 달아나고, 남은 것은 이 고을 백성뿐이오. 그래도 이 성은 내주지 않소.'],
      ['jeongbongsu', '오늘 밤 저놈들이 성벽에 붙을 것이오. 그대의 총으로 성문을 함께 지켜 주시오!']
    ]); });
    var res = await battleOf(ctx)('용골산성에 붙은 후금 기병', foe('yonggol'), { kind: 'garrison', guns: false, leader: '후금의 기병 대장', noSpecial: true });
    b.yonggol = res === 'win' ? 'win' : 'lose';
    var bf = fame('bt', 'yonggol');
    await play([[null, res === 'win' ? '새벽, 후금 기병이 성벽 아래 시체를 남기고 물러났다. 성 안에서 함성이 터진다.' : '성문이 한 번 뚫릴 뻔했으나, 정봉수가 몸소 칼을 들고 막았다. 후금 기병은 끝내 성을 넘지 못하고 물러났다.'],
      ['jeongbongsu', '이 성이 버티는 한 오랑캐는 뒤가 불안할 것이오. 그대 이름을 잊지 않겠소.']]);
    log('정묘년, 용골산성에서 정봉수와 함께 후금 기병을 막았다. (전투 명성 +' + bf + ')');
  };

  // A 남한산성에 군량을
  LAND.food = async function (ctx) {
    var b = st(), s = S(), cost = K().foodCost || 2000;
    await withPic('horan_namhan', '남한산성 (1637)', function () { return play([
      [null, '눈 덮인 남한산. 산성을 빙 둘러 청군의 목책과 천막이 늘어섰다. 밤마다 성 안에서 굶주린 말의 울음소리가 산 아래까지 들린다.'],
      ['F', '제독, 수원과 남양의 마을에서 쌀을 사 모을 수는 있습니다. 문제는 저 포위를 뚫고 산을 오르는 일입니다.']
    ]); });
    var v = await UI.ask('남한산성에 군량을 들이겠는가?', [
      { label: '쌀을 사 모아 포위를 뚫는다 (금화 ' + U.num(cost) + '닢 · 육상전)', value: 'go', icon: 'sack', dis: s.player.gold < cost },
      { label: '지금은 물러난다', value: 'no' }], me());
    if (v !== 'go' || s.player.gold < cost) { b.foodCool = s.day + 3; return; }
    s.player.gold -= cost;
    await play([[null, '달 없는 밤. 쌀 자루를 진 선원들과 마을 사람들이 산성의 동문 쪽 골짜기로 숨어든다. 청군 초소의 횃불이 가깝다.']]);
    var res = await battleOf(ctx)('남한산성을 에워싼 청군', foe('namhan'), { kind: 'garrison', guns: true, leader: '청군 초소장', noSpecial: true });
    if (res === 'win') {
      b.food = 'in';
      var bf = fame('bt', 'food');
      await play([
        [null, '동문이 조용히 열리고, 쌀 자루가 하나둘 성 안으로 들어간다. 굶주린 군졸들이 자루를 끌어안고 운다.'],
        [SOLDIER, '쌀이다… 쌀이야! 이걸로 한 달은 더 버틸 수 있겠소!'],
        ['injo', '(행궁의 등잔 아래에서) …바다 건너온 사람이 과인의 군사를 먹이는구나. 고맙다. 정말로 고맙다.']
      ]);
      log('남한산성의 포위를 뚫고 군량을 들였다. (전투 명성 +' + bf + ')');
      UI.toast('남한산성에 군량을 들였다 — 세 가지 가운데 하나', 'sack', 5000);
    } else {
      b.food = 'fail'; b.foodCool = s.day + (K().retry || 10);
      await play([[null, '청군의 횃불에 들켰다. 쌀 자루를 버리고 골짜기로 물러났다.'], ['F', '제독, 열흘쯤 지나 다시 해 봅시다. 포위가 느슨해지는 틈이 있을 겁니다.']]);
      log('남한산성에 군량을 들이려다 청군에 막혔다.');
    }
  };

  // C 백마산성의 임경업
  LAND.baekma = async function (ctx) {
    var b = st();
    await withPic('horan_baekma', '백마산성의 임경업 (1637)', function () { return play([
      [null, '의주 백마산성. 성벽 위에서 장수 하나가 남쪽으로 내려가는 먼지 구름을 노려보고 있다. 청군은 이 성을 비켜 곧장 한양으로 달려갔다.'],
      ['I', '임경업이오. 오랑캐가 이 성을 두려워해 돌아갔소. 싸워 보지도 못하고 길을 내준 꼴이 되었지. …분하오.'],
      ['I', '그러나 저들의 뒤는 비었소. 심양에서 군량과 화약을 실은 수레가 이 길로 내려가오. 그 행렬을 끊으면 홍타이지도 오래 머물 수 없을 것이오. 함께 치겠소?']
    ]); });
    var v = await UI.ask('청군 뒤의 보급 행렬을 끊겠는가?', [
      { label: '임경업과 함께 친다 (육상전)', value: 'go', icon: 'sword' },
      { label: '지금은 물러난다', value: 'no' }], me());
    if (v !== 'go') { await play([['I', '…그렇다면 나 혼자라도 기회를 보겠소.']]); b.baekma = 'no'; return; }
    var res = await battleOf(ctx)('청군의 보급 행렬', foe('baekma'), { kind: 'garrison', guns: true, leader: '보급 행렬의 호위 대장', noSpecial: true });
    b.baekma = res === 'win' ? 'cut' : 'fail';
    if (res === 'win') {
      var bf = fame('bt', 'baekma');
      await play([[null, '군량 수레가 불타고, 화약 궤짝이 터져 하늘을 밝힌다. 청군 호위대가 북쪽으로 달아난다.'], ['I', '이것으로 남쪽의 오랑캐들은 굶을 것이오. 선장, 이 소식을 남한산성에 전해 주시오 — 「오랑캐의 뒤가 끊겼다」고.']]);
      log('백마산성의 임경업과 함께 청군의 보급 행렬을 끊었다. (전투 명성 +' + bf + ')');
      UI.toast('청군의 보급을 끊었다 — 세 가지 가운데 하나', 'sword', 5000);
    } else await play([[null, '호위대가 생각보다 많았다. 몇 수레만 불태우고 물러났다.'], ['I', '…다음은 없소. 저들도 이제 뒤를 지킬 것이오.']]);
  };

  // ⑤ 남한산성의 담판
  LAND.talk = async function (ctx) {
    var b = st(), s = S(); b.talk = 1;
    var got = [b.food === 'in' ? '산성의 군량' : null, '강화도의 바다', b.baekma === 'cut' ? '백마산성 뒤의 보급' : null].filter(Boolean);
    await withPic('horan_debate', '남한산성 행궁 (1637)', function () { return play([
      [null, '남한산성 행궁. 등잔 아래 신하들이 둘로 갈라섰다. 탁자 위에는 최명길이 밤새 쓴 국서가 놓여 있다.'],
      ['kimsangheon', '(국서를 집어 들어 찢으며) 이 글이 무엇이오! 오랑캐를 황제라 부르고 신하를 칭하다니. 살아서 치욕을 당하느니 죽어서 의리를 지키는 것이 낫소!'],
      ['C', '(찢어진 종이를 하나하나 주우며) 대감은 찢으시오. 나는 줍겠소. 나라가 망한 뒤에 의리가 무슨 소용이오. 살아남아야 다음을 도모할 수 있소.'],
      ['injo', '…그만들 하라. (제독을 바라보며) 바다의 사람이 가져온 소식이 있다지. 말해 보라.'],
      ['P', got.join(' · ') + ' — 오랑캐는 생각만큼 강하지 않소. 강화도가 버티고 있소. 이제 저들이 서두를 차례요.'],
      ['C', '(눈빛이 바뀌며) 전하, 이것이면 다르옵니다. 신이 이 사람과 함께 탄천의 오랑캐 진영에 가겠나이다. 무릎 꿇지 않는 화약을 받아 오겠나이다.']
    ]); });
    await withPic('horan_tent', '탄천의 황옥 장막 (1637)', function () { return play([
      [null, '탄천 가의 청 진영. 누런 장막 아래 높은 자리에 변발한 황제가 앉아 있다. 그 곁에 용골대가 칼을 짚고 섰다.'],
      ['yonggoldae', '조선의 신하와… 남만의 선장이라? 황제 폐하 앞이다. 무릎을 꿇어라.'],
      ['hongtaiji', '(손을 들어 막으며) 두어라. 남만의 선장이 무슨 말을 하러 왔는지 들어 보자. …짐은 이미 이겼다. 조선의 임금이 성문을 나와 절하면 돌아가겠다. 무엇이 더 필요한가?']
    ]); });
    var second = skill('speech') >= 2 || !!row('h_choemyeonggil') || !!b.ferry || b.yonggol === 'win';
    for (var tries = 0; tries < 2; tries++) {
      var v = await UI.ask('홍타이지 앞에서 무엇을 말하겠는가?', [
        { label: '「강화도가 버틴다. 압록강의 얼음은 곧 녹고, 진중에는 마마가 돈다」', value: 'ice', icon: 'compass' },
        { label: '「명나라의 대군이 곧 산해관을 넘어온다」', value: 'ming', icon: 'flag' },
        { label: '「조선이 금은을 바칠 것이니 물러나라」', value: 'gold', icon: 'coin' }], me());
      b.tries = tries + 1;
      if (v === 'ice') break;
      await play(v === 'ming'
        ? [['hongtaiji', '(크게 웃으며) 명나라? 명의 장수들은 지금 서로를 죽이느라 바쁘다. 산해관을 넘을 자는 없다. 거짓말이 서툴구나, 남만인.']]
        : [['hongtaiji', '금은이라. 짐의 군사가 이 땅에서 마음대로 거둘 수 있는 것을 왜 받겠느냐.']]);
      if (!second || tries === 1) { v = null; break; }
      await play([['C', '(낮게) 선장, 다시 생각해 보시오. 저 황제가 가장 두려워하는 것이 무엇인지. …저들의 진중에 마마 앓는 군사가 늘고 있다 들었소.']]);
    }
    if (v === 'ice') {
      await play([
        ['P', '강화도는 함락되지 않았소. 갑곶 앞바다에서 폐하의 배들이 가라앉는 것을 내 눈으로 보았소. 산성에는 아직 군량이 있소. 압록강의 얼음이 녹으면 폐하의 군사는 이 땅에 갇히오. 진중에 마마가 돌고 있다는 것도 아오.'],
        [null, '장막 안이 조용해진다. 용골대가 황제의 얼굴을 살핀다. 홍타이지는 오래 말이 없다.'],
        ['hongtaiji', '…남만의 선장이 짐의 진중을 짐보다 잘 아는구나. (최명길을 보며) 좋다. 화약을 맺자. 조선은 청을 섬기고 명과의 사귐을 끊는다. 그러나 — 임금이 성문을 나와 절하는 일은 거두겠다. 짐도 마마가 두렵다.'],
        ['C', '(깊이 엎드리며) …황제의 너그러움을 잊지 않겠나이다.']
      ]);
      await avoided();
    } else {
      b.end = 'history';
      await play([
        ['hongtaiji', '이야기는 끝났다. 돌아가서 너희 임금에게 전하라. 성문을 나와 짐에게 절하라고.'],
        [null, '장막을 나서는 최명길의 어깨가 떨렸다. 산성으로 돌아가는 길, 그는 한마디도 하지 않았다.']
      ]);
      log('탄천의 청 진영에서 홍타이지와 담판했으나 설득하지 못했다.');
    }
    refresh();
  };
  async function avoided() {
    var b = st(); b.end = 'avoided';
    await withPic('horan_gate', '열리지 않은 서문 (1637)', function () { return play([
      [null, '며칠 뒤. 청군이 천막을 걷는다. 삼전도 나루에 쌓았던 수항단이 빈 채로 남았다. 남한산성의 서문은 끝내 열리지 않았다.'],
      ['injo', '(성루에서 북쪽으로 돌아가는 청군의 먼지를 바라보며) …과인은 오늘 무릎을 꿇지 않았다. 그러나 이것은 과인의 힘이 아니다. 저 산성을 먹인 쌀과, 강화의 바다와, 그대의 말이었다.'],
      ['kimsangheon', '(한참 말이 없다가 최명길에게) …지천(遲川), 그대가 옳았소. 오늘만은.'],
      ['C', '(쓴웃음을 지으며) 청음(淸陰), 대감이 찢은 종이가 없었다면 저도 저 장막 안에서 이만큼 버티지 못했을 것이오.']
    ]); });
    var bf = fame('so', 'talk');
    log('병자년, 남한산성에서 청과 화약을 맺었다 — 임금은 삼전도에 나가 무릎 꿇지 않았고, 세자는 볼모로 가지 않았다. (사교 명성 +' + bf + ')');
    UI.toast('삼전도의 굴욕을 피했다 — 임금은 성문을 나서지 않았다', 'flag', 7000);
    var tt = await titleUp('남한산성의 화약으로', '병자년, 남한산성의 군량과 강화도의 바다와 탄천의 담판으로 임금의 무릎을 지킨 공으로.');
    b.title = tt || 'none';
    // 최명길 · 임경업
    var v = await UI.ask('최명길이 말한다 — 「조정은 저를 오랑캐와 화친한 자라 욕할 것이오. 한동안 바다에 나가 있고 싶소」', [
      { label: '최명길을 배에 태운다', value: 'yes', icon: 'people' },
      { label: '「조정에 그대가 필요하오」', value: 'no' }], me());
    b.joinChoi = v;
    if (v === 'yes') { join('h_choemyeonggil', 85); await play([['C', '하하, 붓보다 노가 무겁구려. 그래도 배 위에서는 아무도 내 국서를 찢지 않겠지.']]); }
    if (b.baekma === 'cut') {
      var w = await UI.ask('임경업이 말한다 — 「오랑캐는 다시 올 것이오. 나는 바다에서 명과 손잡을 길을 찾겠소」', [
        { label: '임경업을 배에 태운다', value: 'yes', icon: 'sword' },
        { label: '「백마산성을 지켜 주시오」', value: 'no' }], me());
      b.joinIm = w;
      if (w === 'yes') { join('h_imgyeongeop', 88); await play([['I', '좋소. 백마산성의 칼을 그대의 갑판에 걸겠소.']]); }
    }
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[ganghwaOpen, ganghwa], [warnOpen, warn], [c1Open, c1]];
  HR.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  HR.check = async function () {
    if (HR._busy) return false; HR._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    HR._busy = false; refresh();
    return true;
  };
  HR._t = { c1: c1, warn: warn, ganghwa: ganghwa, LAND: LAND, avoided: avoided };
})(window.G = window.G || {});
