/* 항해 일지의 중요도 (G.Journal) — 2026-10-23 베타 피드백
   「자식과 무엇을 했다」 같은 작은 일은 적히는데, 경쟁자가 발견물을 찾아 움직인 일·나라 사이의 전쟁·천재지변은 일지에 남지 않았다.
   ■ 일지 한 줄 = { d: 날짜, t: 글, g: 등급 } — 등급
     A 발견·탐험  : 경쟁 탐험가의 채비·출항·발표, 내 발견·발표, 개척 소식, 대륙 이름, 업적·칭호·작위
     B 전쟁·정치  : 나라 사이의 전쟁·강화·동맹, 조약, 도시의 주인이 바뀜, 왕위, 정복, 큰 해전·해적의 습격
     C 재해·세상  : 지진·화산·해일·홍수·폭풍·역병·기근, 시장 사건, 세상의 유행
     D 일상      : 가족·부하·거래·의뢰·자택 — 그 밖의 모든 것
     F 가문      : 은퇴하고 뒤를 이음·결혼·둘째 부인·아이가 태어남·이름 지음·자식의 혼례·세상을 떠남·모험의 첫걸음 (2026-10-23 QA 1·2 — 가계도가 읽는 줄)
   ■ 소식(하루가 지날 때 뜨는 알림)만 띄우고 일지에 적지 않던 것을, 그 소식을 낸 체계에 따라 등급을 붙여 적는다 (아래 SOURCES).
     그 체계가 이미 일지에 적은 줄은 등급만 고친다. 같은 날 같은 일(같은 「이름」이 든 줄)은 두 번 적지 않는다.
     경쟁 탐험가의 항해 소식은 제독이 그 발견을 쫓지 않아 알림이 뜨지 않아도 일지에는 적는다 (js/systems/discovery.js D.rivals).
   ■ 따로 등급을 주지 않은 G.State.log(글)은 글을 보고 가린다 (J.grade). 옛 저장의 줄(g 없음)도 보여 줄 때 가린다.
   ■ 일지 창(수첩 「일지」)에는 등급을 보이지 않고 날짜와 내용만 적는다 (2026-10-23 사용자 요청) — 등급은 넘칠 때 일상부터 지우는 데만 쓴다
   ■ 일지는 G.BALANCE.journal.cap(800)줄까지 — 넘치면 등급마다 몫(G.BALANCE.journal.share)을 가장 많이 넘은 등급의 가장 오래된 줄부터 지운다 (J.trim)
     (예전엔 오래된 D부터 지워, 달마다 오는 해전 분위기 소식(B)이 일지 절반을 채우고 일상 줄은 1년 만에 사라졌다 — QA 1)
     · 한 등급 안에서는 「작은 소식」(나라끼리의 해전 분위기 소식 — js/systems/relations.js)부터, 가문 줄은 「뒤를 이었다」 줄을 맨 나중에 지운다
     · 맨 뒤 keep(50)줄은 되도록 지우지 않는다 · 몫을 다 쓰지 않은 등급의 자리는 다른 등급이 함께 쓴다
     · 작은 소식은 넘치지 않아도 minor(40)줄까지만 둔다
   ■ 옛 저장: 불러올 때 한 번 줄마다 등급을 붙이고 바뀐 갈래(가문 F·해적 함대 격파 B·술집 항해사 소문 D)를 고친다 (J.migrate — s.flags.journalV) */
(function (G) {
  'use strict';
  var U = G.U;
  var J = G.Journal = {};
  function S() { return G.Game && G.Game.state; }
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.journal = G.BALANCE.journal || {};
  // cap: 일지 줄 수 · keep: 되도록 지우지 않는 맨 뒤 줄 수 · share: 넘칠 때 등급마다의 몫 (합이 cap 과 다르면 비율로 맞춘다)
  (function (b) {
    if (b.cap == null) b.cap = 800;
    if (b.keep == null) b.keep = 50;
    if (!b.share) b.share = { F: 60, A: 200, B: 190, C: 100, D: 250 };
    if (b.minor == null) b.minor = 40;   // 작은 소식(나라끼리의 해전 분위기 소식)은 일지 전체에서 이만큼까지 — 넘으면 오래된 것부터
  })(G.BALANCE.journal);

  J.GRADES = {
    A: { name: '발견·탐험', note: '경쟁 탐험가의 움직임, 발견과 발표, 업적·작위' },
    B: { name: '전쟁·정치', note: '나라 사이의 전쟁·동맹·조약, 도시의 주인, 왕위' },
    C: { name: '재해·세상', note: '천재지변·역병·기근, 시장 사건과 유행' },
    D: { name: '일상', note: '가족·부하·거래·의뢰' },
    F: { name: '가문', note: '은퇴하고 뒤를 이음·결혼·아이가 태어남' }
  };
  J.ORDER = ['F', 'A', 'B', 'C', 'D'];   // 앞일수록 무겁다 (같은 날 같은 일이면 무거운 쪽으로)

  // ---------------------------------------------------------------- 글로 가리기
  var RX = {
    // 가문: 가계도·옛 저장 옮기기(js/systems/familytree.js·maidswap.js)가 읽는 줄 — 나라·왕실의 혼인 소식은 빼고
    F: /[이가] 은퇴하고 .+ 뒤를 이었다|결혼했다\.?$|부인으로 맞았다|(?:아들|딸|쌍둥이)이 태어났다|이름을 지어 주었다|혼례를 올렸다|세로 세상을 떠났다|에서 모험의 첫걸음을 내디뎠다/,   // 마지막: 1대 제독의 첫 줄 (js/core/state.js 새 게임)
    notF: /^【|^소문|^시장 소식|국왕|왕녀|왕자|왕실|여왕|황제|황태자|공작|술탄|교황|왕비|대공/,
    D: /^배 위의 하루:|^자택 |^낚시:|보낸 시간\.$|태어났다|이름을 지어 주었다|아내|부인|혼례|동생들|견습 선원/,   // 가족 이야기는 글에 「발견」·「항해」가 들어 있어도 일상
    C: /지진|화산|분화|해일|쓰나미|홍수|범람|산사태|폭풍우|태풍|허리케인|돌풍|눈사태|역병|흑사병|천연두|전염병|기근|가뭄|흉년|대풍작|풍작|재해|구호금|시장 소식|유럽 시장|세상의 유행|유행이|한파|혹서|메뚜기/,
    B: /해적 함대|함대를 쳐부|격파|전쟁|선전 포고|선전포고|강화|휴전|동맹|조약|해전|전투에서|맞붙었|점령|함락|정복|멸망|반란|봉기|왕위|즉위|섭정|대관|폐위|주인이 바뀌|의 손에 넘어|십자군|무적함대|레판토|습격|침공|포위|사략|해적단|군함|국왕|황제|술탄|교황|특명|헨리 8세|엘리자베스 1세|카를 5세|메디치|피사로|잉카|아즈텍|하이레딘|바르바로사/,
    A: /발견|발표|단서|실마리|항로|탐험|원정|채비|떠났다고|대륙|명명|이름을 붙|업적|작위|서임|칭호|불리게 되었다|명성 \+|세계 ?일주|해도|적도를 넘|보물 지도|신기루|새로운 항구|새 도시를 세울/
  };
  /** 글을 보고 등급을 정한다 */
  J.grade = function (text) {
    var t = String(text || '');
    if (RX.F.test(t) && !RX.notF.test(t)) return 'F';
    if (/^소문: 「.+」.{1,3} .+의 술집에 나타났다/.test(t)) return 'D';   // 항해사가 술집에 나타났다는 소문은 일상 (QA 18)
    if (/^시장 소식|^유럽 시장|^세상의 유행/.test(t)) return 'C';              // 「시장 소식: 왕실 혼례」가 일상(혼례)으로 가지 않게
    if (RX.D.test(t)) return 'D';
    if (RX.C.test(t)) return 'C';
    if (RX.B.test(t)) return 'B';
    if (RX.A.test(t)) return 'A';
    return 'D';
  };
  /** 일지 한 줄의 등급 (옛 줄은 글로) */
  J.of = function (e) { return e && J.GRADES[e.g] ? e.g : J.grade(e && e.t); };

  // ---------------------------------------------------------------- 넘칠 때 지우기 (js/core/state.js ST.log 가 부른다)
  /** 나라끼리의 해전 분위기 소식 (js/systems/relations.js 달마다) — 한 등급 안에서 먼저 지운다 */
  var MINOR = /맞붙었다는 소식이 들려온다|의 배를 쫓아 포를 쏘았다고 한다|의 싸움이 바다로 번졌다/;
  J.minor = function (e) { return !!(e && (e.k === 'sea' || MINOR.test(String(e.t || '')))); };
  var SUCC = /[이가] 은퇴하고 .+ 뒤를 이었다/;
  /** 등급마다의 몫 (합을 cap 에 맞춘다) */
  J.shares = function (cap) {
    var b = G.BALANCE.journal || {}, sh = b.share || {}, sum = 0, out = {};
    J.ORDER.forEach(function (g) { sum += Math.max(0, +sh[g] || 0); });
    J.ORDER.forEach(function (g) { out[g] = sum > 0 ? (Math.max(0, +sh[g] || 0)) * cap / sum : cap / J.ORDER.length; });
    return out;
  };
  /** 일지가 cap 줄을 넘으면 줄인다: 몫을 가장 많이 넘은 등급(같으면 가벼운 등급)의 가장 오래된 줄 — 그 안에서 작은 소식부터, 가문은 「뒤를 이었다」 줄을 맨 나중에 */
  J.trim = function (log, cap) {
    var b = G.BALANCE.journal || {};
    cap = cap || b.cap || 800;
    if (!log) return 0;
    var cut = 0, i, mc = b.minor == null ? 40 : b.minor, minors = [], gone = [];
    // 지워진 줄은 항해일지 책(40년마다 한 권)의 묶음으로 옮긴다 (js/systems/logbooks.js — 2026-10-24)
    function done() { if (gone.length && G.LogBooks && G.LogBooks.onDrop) { try { G.LogBooks.onDrop(log, gone); } catch (e) { console.error(e); } } return cut; }
    for (i = 0; i < log.length; i++) if (J.minor(log[i])) minors.push(i);
    if (mc >= 0 && minors.length > mc) {           // 작은 소식이 너무 많으면 오래된 것부터 (뒤에서부터 지워야 자리가 어긋나지 않는다)
      var drop = minors.slice(0, minors.length - mc);
      for (i = drop.length - 1; i >= 0; i--) gone.push(log.splice(drop[i], 1)[0]);
      cut += drop.length;
    }
    if (log.length <= cap) return done();
    var keep = Math.max(0, Math.min(b.keep == null ? 50 : b.keep, cap - 1));
    var q = J.shares(cap), n = {};
    J.ORDER.forEach(function (g) { n[g] = 0; });
    for (i = 0; i < log.length; i++) { var g0 = J.of(log[i]); if (!log[i].g) log[i].g = g0; n[g0] = (n[g0] || 0) + 1; }
    while (log.length > cap) {
      var pick = null, over = -Infinity;
      for (var oi = J.ORDER.length - 1; oi >= 0; oi--) {   // 가벼운 등급부터 — 넘은 정도가 같으면 가벼운 쪽을 지운다
        var g = J.ORDER[oi], v = n[g] - q[g];
        if (n[g] > 0 && v > over) { over = v; pick = g; }
      }
      var lim = log.length - keep, at = -1, first = -1;
      for (i = 0; i < lim; i++) {
        var e = log[i]; if (e.g !== pick) continue;
        if (first < 0) first = i;
        if (pick === 'F' ? !SUCC.test(String(e.t || '')) : J.minor(e)) { at = i; break; }
      }
      if (at < 0) at = first;
      if (at < 0) for (i = 0; i < log.length; i++) if (log[i].g === pick) { at = i; break; }   // 그 등급이 모두 맨 뒤에만 있다
      if (at < 0) at = 0;
      n[log[at].g] = (n[log[at].g] || 1) - 1;
      gone.push(log.splice(at, 1)[0]);
      cut++;
    }
    return done();
  };

  // ---------------------------------------------------------------- 옛 저장
  /** 불러올 때 한 번 (js/core/state.js ST.deserialize): 줄마다 등급을 붙이고, 갈래가 바뀐 줄(가문·해적 함대 격파·술집 항해사 소문)을 고친다 */
  J.VERSION = 2;
  J.migrate = function (s) {
    if (!s || !Array.isArray(s.log)) return 0;
    var f = s.flags || (s.flags = {});
    if ((f.journalV || 0) >= J.VERSION) return 0;
    var n = 0;
    s.log.forEach(function (e) {
      if (!e) return;
      var g = J.grade(e.t), old = e.g;
      if (!J.GRADES[old]) e.g = g;                                     // 등급이 없던 줄 (2026-10-23 전 저장)
      else if (g === 'F' && old === 'D') e.g = 'F';                     // 일상으로 적혔던 가문 줄
      else if (old === 'D' && g === 'B' && /해적 함대|함대를 쳐부|격파/.test(e.t)) e.g = 'B';
      else if (old === 'A' && g === 'D' && /^소문: 「/.test(e.t)) e.g = 'D';
      if (MINOR.test(String(e.t || ''))) e.k = 'sea';
      if (e.g !== old) n++;
    });
    f.journalV = J.VERSION;
    return n;
  };

  // ---------------------------------------------------------------- 같은 일 두 번 적지 않기
  function norm(t) { return String(t || '').replace(/<[^>]+>/g, '').replace(/[\s【】「」『』\[\]().,·…!?'"“”‘’—–\-:]/g, ''); }
  /** 글 속 이름: 「…」·【…】 안의 말 */
  function names(t) { var out = [], re = /[「【]([^」】]{2,})[」】]/g, m; t = String(t || ''); while ((m = re.exec(t))) out.push(norm(m[1])); return out.filter(function (x) { return x.length >= 2; }); }
  function same(a, b) {
    var na = norm(a), nb = norm(b); if (!na || !nb) return false;
    if (na === nb) return true;
    if (na.length > 14 && nb.length > 14 && (na.indexOf(nb) >= 0 || nb.indexOf(na) >= 0)) return true;
    var A = names(a), B = names(b);
    var named = A.some(function (x) { return B.indexOf(x) >= 0 || (x.length >= 3 && nb.indexOf(x) >= 0); }) || B.some(function (x) { return x.length >= 3 && na.indexOf(x) >= 0; });
    // 이름만 같다고 같은 일로 치면 같은 날 다른 소식(같은 도시의 입항과 시세 폭락 등)이 합쳐졌다 — 글도 대부분(80%) 겹칠 때만 (QA 2026-10-23)
    return named && overlap(na, nb) >= 0.8;
  }
  /** 두 글의 공통 글자 비율 (짧은 쪽 글자 수에 대해 — 짧은 머리글 「디아스: 희망봉 발견 발표」와 긴 본문은 같은 일로) */
  function overlap(na, nb) {
    var cnt = {}, common = 0, i, c;
    for (i = 0; i < na.length; i++) { c = na.charAt(i); cnt[c] = (cnt[c] || 0) + 1; }
    for (i = 0; i < nb.length; i++) { c = nb.charAt(i); if (cnt[c] > 0) { cnt[c]--; common++; } }
    return common / Math.max(1, Math.min(na.length, nb.length));
  }
  function tidy(t) { return String(t || '').replace(/<[^>]+>/g, '').replace(/【([^】]+)】\s*/g, '$1 — ').replace(/\s+/g, ' ').trim(); }
  /** 오늘 이미 적은 줄 가운데 같은 일이 있는가 */
  J.loggedToday = function (text) {
    var s = S(); if (!s || !s.log) return false;
    var d = U.dateNum(s.date);
    for (var i = s.log.length - 1; i >= 0 && s.log[i].d === d; i--) if (same(s.log[i].t, text)) return true;
    return false;
  };
  /** 등급을 붙여 적는다 (같은 날 같은 일이면 등급만 높인다) */
  J.add = function (text, g) {
    var s = S(); if (!s || !s.log || !text) return false;
    text = tidy(text);
    var d = U.dateNum(s.date);
    for (var i = s.log.length - 1; i >= 0 && s.log[i].d === d; i--) {
      if (same(s.log[i].t, text)) { if (J.ORDER.indexOf(g) < J.ORDER.indexOf(J.of(s.log[i]))) s.log[i].g = g; return false; }
    }
    G.State.log(text, g);
    return true;
  };

  // ---------------------------------------------------------------- 소식을 낸 체계별 등급
  var caps = [];
  /** ST.log 가 부른다: 지금 감싼 체계 안에서 적힌 줄을 모은다 */
  J.onLog = function (e) { if (caps.length) caps[caps.length - 1].push(e); };
  /* grade: 그 체계의 소식·줄에 붙일 등급 (함수면 소식마다)
     self: 그 체계가 소식마다 스스로 일지에 적는다 → 등급만 고치고 소식은 다시 적지 않는다 */
  var SOURCES = [
    ['Disc', 'rivals', 'A'],                 // 경쟁 탐험가: 채비·출항·발표 (G.RIVAL_NEWS)
    ['Frontier', 'tick', function (m) { return /^소문: 「/.test(String(m && m.text || '')) ? 'D' : 'A'; }],   // 개척 단계가 열렸다는 소식 A · 항해사가 술집에 나타났다는 소문은 D (QA 18)
    ['Names', 'daily', 'A'],                 // 새 대륙의 이름
    ['Rel', 'daily', 'B'],                   // 나라 사이의 전쟁·강화·동맹, 역사 사건, 다른 나라끼리의 해전 소식 (해전 분위기 소식은 나라 쌍마다 해마다 한 줄 — nolog)
    ['Dominion', 'monthly', 'B', true],      // 도시의 주인이 바뀌었다
    ['Treaty', 'daily', 'B'],                // 토르데시야스·사라고사 조약
    ['Barb', 'daily', 'B'],                  // 하이레딘 바르바로사
    ['Tudor', 'daily', 'B'],                 // 튜더 왕실·무적함대
    ['Aztec', 'daily', 'B'],                 // 아즈텍 정복
    ['IncaFall', 'daily', 'B'],              // 잉카 정복
    ['GoaMal', 'daily', 'B'],                // 포르투갈의 고아·말라카 점령
    ['Mina', 'daily', 'B'],                  // 엘미나 요새 건설
    ['MingFall', 'daily', 'B'],              // 명의 북경 붕괴·청의 입관
    ['Westphalia', 'daily', 'B'],            // 베스트팔렌 조약
    ['Nzinga', 'daily', 'B'],                // 은징가 여왕의 저항
    ['Potosi', 'daily', 'B'],                // 포토시 은광
    ['RomeSack', 'daily', 'B'],              // 1527년 로마 약탈
    ['GalPisa', 'daily', 'B'],               // 갈릴레오와 피사의 사탑
    ['Imjin', 'daily', 'B'],                 // 임진왜란
    ['Globe', 'daily', 'B'],                 // 셰익스피어와 글로브의 불
    ['Succession', 'year', function (m) { return m && m.icon === 'crown' ? 'B' : null; }],   // 군주·후원자의 대가 바뀜 (유품·기억은 일상)
    ['Disaster', 'daily', 'C'],              // 지진·화산·산사태·해일·홍수
    ['Econ', 'daily', 'C', true],            // 시장 사건 (가뭄·전쟁·풍작…)
    ['Era', 'daily', 'C', true]              // 유럽 시장·세상의 유행
  ];
  function textOf(m) { return m && typeof m === 'object' && typeof m.text === 'string' && !m.kind ? m.text : null; }
  function wrap(objName, fn, grade, self) {
    var o = G[objName]; if (!o || typeof o[fn] !== 'function' || o[fn]._journal) return false;
    var f0 = o[fn];
    var w = function () {
      caps.push([]);
      var out, got;
      try { out = f0.apply(this, arguments); }
      finally { got = caps.pop(); }
      try {
        var gFix = typeof grade === 'function' ? null : grade;
        if (gFix) got.forEach(function (e) { if (e.g !== 'F') e.g = gFix; });   // 가문 줄은 그대로
        if (!self && Array.isArray(out)) out.forEach(function (m) {
          var t = textOf(m); if (!t || m.nolog) return;                      // nolog: 알림만 띄우고 일지에는 적지 않는다
          var g = typeof grade === 'function' ? grade(m) : grade; if (!g) return;
          if (got.some(function (e) { return same(e.t, t); })) return;     // 그 체계가 이 일을 이미 적었다
          if (J.add(t, g) && m.minor) { var s = S(), l = s && s.log && s.log[s.log.length - 1]; if (l) l.k = 'sea'; }   // 작은 소식: 넘칠 때 먼저 지운다
        });
      } catch (e) { console.error(e); }
      return out;
    };
    w._journal = true;
    o[fn] = w;
    return true;
  }
  J.hook = function () {
    var n = 0;
    SOURCES.forEach(function (x) { if (wrap(x[0], x[1], x[2], x[3])) n++; });
    // 해가 바뀔 때: 새 도시가 세워지거나 이름이 바뀐 소식은 B (새 책 소식은 적지 않는다)
    if (wrap('World', 'newYear', function (m) { return m && m.icon === 'castle' ? 'B' : null; })) n++;
    J.hooked = n;
    return n;
  };
  /** 역사의 흐름(G.HISTORY — js/systems/world.js): 도시를 차지한 일은 B, 큰 항해·발견은 A, 재해는 C, 그 밖의 나라 일은 B */
  J.historyGrade = function (h) {
    var t = String(h && h.text || '');
    if (h && h.g) return h.g;
    if (h && h.city) return 'B';
    if (RX.C.test(t)) return 'C';
    if (/닿았|귀환|땅을 보았|나섰|한 바퀴|발견|표착|돌아/.test(t)) return 'A';
    return 'B';
  };

  J.hook();
})(window.G = window.G || {});
