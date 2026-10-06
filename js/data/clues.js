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
  (G.DISCOVERIES || []).forEach(function (d) { G.CLUE[d.id] = d.clue === 'talk' || d.clue === 'book' ? d.clue : rule(d); });

  G.CLUE_NAME = { talk: '이야기', book: '사료' };
  /** 이야기 갈래 안에서 주로 듣는 곳 */
  G.clueVenue = function (d) {
    if (!d) return null;
    if (G.CLUE[d.id] === 'book') return 'library';
    return d.cat === 'trade' || d.cat === 'treasure' ? 'trade' : 'tavern';
  };
  G.CLUE_WHERE = { library: '도서관 사료', trade: '교역소 상인 · 후원자의 이야기', tavern: '주점의 소문 · 후원자의 이야기' };
  G.clueWhere = function (d) { return G.CLUE_WHERE[G.clueVenue(d)] || ''; };
})(window.G = window.G || {});
