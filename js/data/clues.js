/* 단서의 갈래 — 사람들 입으로 듣는 발견(talk)과 도서관 사료로 읽는 발견(book)을 나눈다.
   talk  지금 살아 있는 것·사고파는 것·눈앞의 고장 이야기
         · 주점(술꾼·여급·이름난 여급): 자연·생물(짐승·물고기)·민족·근세(1400~1799)에 세운 건물
         · 교역소(주인): 교역품·책에 실리지 않은 보물(명화·도자기·보석 — 상인과 수집가가 아는 것)
         · 후원자(이야기): 취향에 맞는 talk 발견 무엇이든
   book  지나간 시대·전설·학문 — 도서관
         · 옛 유적과 옛 건물(1399년까지, 그리고 1800년 이후 안내서에 실린 새 건물), 책에 실린 보물,
           전설·멸종 동물(bookOnly)과 괴물·진기한 동식물(동물(animal) 아닌 생물), 지리(항로·땅)
   · 책이 하나도 없는 발견은 talk (어디서든 찾을 수 있게). 데이터에서 clue:'talk'|'book'으로 고칠 수 있다.
   · 지금 온 세상이 떠드는 이야기(G.Frontier.hot — 맛보기 교역품·차례가 된 관문)는 갈래와 상관없이 어디서나 들린다.
   · 계약·큰 항로 이야기(lead)·유물·연쇄·유산·부하·원주민·항해 중 소식은 갈래와 상관없다 (js/systems/discovery.js D.clueOk). */
(function (G) {
  'use strict';
  var inBook = {};
  (G.BOOKS || []).forEach(function (b) { (b.discs || []).forEach(function (id) { inBook[id] = 1; }); });
  function rule(d) {
    if (G.CLUE_FORCE && G.CLUE_FORCE[d.id]) return 'book';   // 새 발견물의 사료 책(js/data/cluebooks.js)에 실린 것 — 도서관에서
    if (d.bookOnly) return 'book';
    if (d.cat === 'trade') return 'talk';
    if (!inBook[d.id]) return 'talk';
    switch (d.cat) {
      case 'treasure': return 'book';
      case 'ruin': return d.how === 'city' && d.built >= 1400 && d.built < 1800 ? 'talk' : 'book';
      case 'creature': return d.animal ? 'talk' : 'book';
      case 'geo': return 'book';
      default: return 'talk';      // nature · people
    }
  }
  G.CLUE = {};
  (G.DISCOVERIES || []).forEach(function (d) { var ch = d.clueVia || d.clue; G.CLUE[d.id] = ch === 'talk' || ch === 'book' ? ch : rule(d); });

  G.CLUE_NAME = { talk: '이야기', book: '사료' };
  /** 이야기 갈래 안에서 주로 듣는 곳 */
  G.clueVenue = function (d) {
    if (!d) return null;
    if (G.CLUE[d.id] === 'book') return 'library';
    return d.cat === 'trade' || d.cat === 'treasure' ? 'trade' : 'tavern';
  };
  G.CLUE_WHERE = { library: '도서관 사료', trade: '교역소 상인 · 후원자의 이야기', tavern: '주점의 소문 · 후원자의 이야기' };
  G.clueWhere = function (d) { return G.CLUE_WHERE[G.clueVenue(d)] || ''; };

  /* 늦게 나온 책의 필사본 (2026-11-01 사용자 요청)
     게임은 1700년에 끝나는데, 그 전부터 있던 발견물(옛 유적·짐승·화산…) 가운데 사료 갈래이면서 실린 책이 모두 1700년 뒤에 나오는 것이
     44곳 있었다 — 주점에서는 사료 갈래라 단서가 나오지 않고, 도서관에서는 「아직 쓰이지 않은 책」이라 단서를 얻을 길이 없었다.
     그런 발견물마다 가장 먼저 나오는 책 한 권을 골라, 그 책의 초고·필사본이 G.BALANCE.bookEarly.from(1580)년부터 도서관에 돌게 한다.
     1700년 뒤에야 세상에 나오는 것(신기루로 보는 발견)은 빼고, 1700년 전에 나온 책이 하나라도 있는 발견물도 뺀다. */
  var earlyMap = null;
  function earlyBooks() {
    if (earlyMap) return earlyMap;
    var K = (G.BALANCE && G.BALANCE.bookEarly) || { from: 1580, after: 1700 }, by = {};
    earlyMap = {};
    (G.BOOKS || []).forEach(function (b) { (b.discs || []).forEach(function (id) { (by[id] = by[id] || []).push(b); }); });
    (G.DISCOVERIES || []).forEach(function (d) {
      if (G.CLUE[d.id] !== 'book' || (d.built && d.built >= K.after) || d.alwaysMirage) return;
      var bs = by[d.id];
      if (!bs || !bs.length || bs.some(function (b) { return (b.y || 0) < K.after; })) return;   // 게임이 1700년 1월 1일에 끝나므로 1700년 책도 읽을 수 없다
      var first = bs.slice().sort(function (a, b) { return (a.y || 0) - (b.y || 0); })[0];
      if ((first.y || 0) > K.from) earlyMap[first.id] = K.from;
    });
    // 연작(js/data/cluebooks.js)의 앞 책이 1700년 뒤에야 나오면 뒤 책도 막힌다 — 앞 책들도 함께 필사본으로
    var SQ = G.BookSeq;
    if (SQ && SQ.prev) Object.keys(earlyMap).forEach(function (id) {
      var b = (G.BOOKS || []).filter(function (x) { return x.id === id; })[0], p = b && SQ.prev(b);
      while (p) { if ((p.y || 0) >= K.after && !earlyMap[p.id]) earlyMap[p.id] = K.from; p = SQ.prev(p); }
    });
    return earlyMap;
  }
  /** 서가에서 읽을 수 있게 되는 해 — 보통은 간행 해(b.y), 필사본이 먼저 도는 책은 bookEarly.from */
  G.bookOpenY = function (b) { if (!b) return 0; var e = earlyBooks()[b.id]; return e ? Math.min(b.y || 0, e) : b.y || 0; };
  /** 간행 전에 필사본으로 먼저 도는 책인가 */
  G.bookEarly = function (b) { return !!(b && earlyBooks()[b.id]); };
  G.bookEarlyList = function () { var m = earlyBooks(); return (G.BOOKS || []).filter(function (b) { return m[b.id]; }); };
})(window.G = window.G || {});
