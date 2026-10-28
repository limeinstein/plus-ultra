/* 배경 음악 파일과 장면·지역·장소별 고르기 표 (js/systems/audio.js가 읽는다). 2026-10-13 다시 정리
   파일은 music/ 폴더의 「제목.mp3」 — 제목이 곧 곡 이름이다 (지역 · 상황 · 장소).
   파일이 없거나 읽지 못하면 그 곡은 빼고 장면의 기본 곡으로, 그것도 없으면 코드로 만든 음악(Web Audio)으로 돌아간다.

   고르는 차례 — 장면마다 (자세한 갈래는 아래 함수들):
     title(첫 화면·제독 만들기)   : 항해(태평양)
     town(도시)  : 건물 안이면 byPlace(주점·왕궁) → 귀환 잔치·고향 귀항이면 「귀환」 → 도시의 고장(cityRegion) → def
     sea(항해)   : 결혼 뒤 첫 항해 → 전설의 대륙 둘레(단서를 얻었거나 찾은 곳) → 바다(ocean) → def
     land(육상 탐험): 전설의 대륙 둘레 → 세계의 대형 사막 → 북유럽·시베리아 → 동아시아 → 지역별 탐험 곡 → def
     battle(해전) · duel(일기토) · landwar(육상전) · 잠깐 곡(moments: 미니 게임 · 전설의 대륙 발견 · 세계 일주 귀환)
   'gen:이름'은 파일 대신 코드가 만드는 음악 (js/systems/audio.js SCALES). */
(function (G) {
  'use strict';
  var TITLES = [
    // 지역 (도시 거리 · 그 고장 산지)
    '이베리아', '프랑스 오스트리아', '영국', '독일 네덜란드', '북유럽', '이탈리아 그리스', '동유럽', '러시아', '오스만 제국',
    '이집트 중동', '남아프리카', '동아프리카', '인도', '티베트', '몽골 위구르', '중국', '조선', '일본', '동남아시아', '오세아니아',
    '북아메리카 동부', '북아메리카 서부', '남아메리카', '무대륙 아틀란티스',
    // 항해
    '항해(지중해)', '항해(대서양)', '항해(인도양)', '항해(태평양)', '항해(남태평양)', '항해(남극해 북극해)', '결혼 후 첫 항해',
    // 탐험
    '탐험(북부 탐험)', '탐험 (사막 탐험)', '탐험(정글 탐험)', '탐험 (동아시아)', '탐험 (숲 탐험)', '탐험(평지 초원 탐험)',
    // 상황 · 장소
    '해상 전투', '육상 전투', '일기토', '미니 게임', '주점', '왕궁', '귀환'
  ];
  G.MUSIC_FILES = {};
  TITLES.forEach(function (t) { G.MUSIC_FILES[t] = 'music/' + t + '.mp3'; });

  function box(lon, lat, x0, x1, y0, y1) { return lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1; }

  /** 좌표만으로 고장 곡 (뭍 탐험·식민 도시처럼 표에 없는 도시) — 모르면 null */
  function geoRegion(lon, lat) {
    if (lon < -30 && lon > -170) return lat >= 24 ? (lon <= -100 ? '북아메리카 서부' : '북아메리카 동부') : '남아메리카';
    if ((lon >= 110 && lat <= -10) || ((lon >= 160 || lon <= -150) && lat < 30)) return '오세아니아';
    if (box(lon, lat, 79, 99, 27.5, 37)) return '티베트';
    if (box(lon, lat, 129, 146, 30, 46)) return '일본';
    if (box(lon, lat, 124.5, 130.5, 33, 43)) return '조선';
    if (box(lon, lat, 92, 135, -11, 21.5)) return '동남아시아';
    if (box(lon, lat, 97, 135, 18, 42) || box(lon, lat, 115, 135, 42, 54)) return '중국';
    if (lat >= 55 && lon >= 45) return '러시아';
    if (box(lon, lat, 52, 120, 37, 56)) return '몽골 위구르';
    if (box(lon, lat, 60, 92, 5, 36)) return '인도';
    if (box(lon, lat, 26, 45, 36, 42.5) || box(lon, lat, 28, 42, 41, 47.5)) return '오스만 제국';   // 아나톨리아 · 흑해 둘레
    if (box(lon, lat, 32, 63, 12, 42) || box(lon, lat, 24, 37, 21, 32) || box(lon, lat, -17, 24, 27, 37.5)) return '이집트 중동';
    if (lat < 27 && lon > -26 && lon < 52) return (lon >= 38 || (lon >= 30 && lat > -12)) ? '동아프리카' : '남아프리카';
    if (box(lon, lat, -30, -12, 27, 40) || box(lon, lat, -10, 3.3, 35, 43.8)) return '이베리아';
    if (box(lon, lat, -11, 2, 49.9, 61)) return '영국';
    if (lat >= 54.5 && lon >= 4 && lon <= 32) return '북유럽';
    if (box(lon, lat, 6.6, 18.6, 36.5, 46) || box(lon, lat, 19.5, 28, 34.8, 41.5)) return '이탈리아 그리스';
    if (box(lon, lat, -5, 8, 42.3, 51.1) || box(lon, lat, 6, 17.2, 45.8, 49)) return '프랑스 오스트리아';
    if (box(lon, lat, 2.5, 15.5, 47, 55.5)) return '독일 네덜란드';
    if (box(lon, lat, 12, 32, 40, 56)) return '동유럽';
    if (lat >= 46 && lon >= 28 && lon < 60) return '러시아';
    return null;
  }
  var NATION = {
    '잉글랜드': '영국', '스코틀랜드': '영국', '아일랜드': '영국', '영국': '영국',
    '프랑스': '프랑스 오스트리아', '브르타뉴': '프랑스 오스트리아', '오스트리아': '프랑스 오스트리아', '스위스 연방': '프랑스 오스트리아',
    '부르고뉴': '독일 네덜란드', '한자 동맹': '독일 네덜란드', '신성로마제국': '독일 네덜란드', '튜턴 기사단': '독일 네덜란드', '네덜란드': '독일 네덜란드',
    '스웨덴': '북유럽', '덴마크': '북유럽', '노르웨이': '북유럽',
    '보헤미아': '동유럽', '폴란드': '동유럽', '헝가리': '동유럽', '리보니아': '동유럽', '리투아니아': '동유럽', '왈라키아': '동유럽', '몰다비아': '동유럽'
  };
  /** 도시의 고장 곡 — 양식·지역·나라로 먼저, 모르면 좌표로 */
  function cityRegion(c) {
    if (!c) return null;
    var st = c.style, rg = c.region, lon = c.lon, lat = c.lat, nat = c.nation || '';
    if (rg === 10 || lon < -30) return geoRegion(lon, lat);                          // 아메리카 (원주민·식민 도시 모두)
    if ((lon >= 110 && lat <= -10) || lon >= 160) return '오세아니아';
    if (nat === '티베트' || box(lon, lat, 79, 99, 27.5, 37)) return '티베트';
    if (st === 'kr') return '조선';
    if (st === 'jp' || rg === 9) return '일본';
    if (rg === 8 || (st === 'se' && rg !== 7)) return '동남아시아';                 // 대월(유에·교도)도
    if (st === 'cn') return '중국';
    if (st === 'in' || rg === 5) return '인도';
    if (st === 'ru') return nat === '리투아니아' ? '동유럽' : '러시아';
    if (st === 'st' || rg === 7) return '몽골 위구르';                               // 초원의 칸국 · 티무르 · 모굴리스탄 · 몽골
    if (rg === 4) return '이집트 중동';                                              // 맘루크 · 아라비아 · 페르시아
    if (rg === 3) {
      if (st === 'is') return '이집트 중동';                                          // 모로코 · 베르베르
      return (st === 'sw' || lon >= 38 || (lon >= 30 && lat > -12)) ? '동아프리카' : '남아프리카';
    }
    if (rg === 0) return '이베리아';
    if (rg === 2) {
      if (nat === '프랑스') return '프랑스 오스트리아';                               // 마르세유
      if (NATION[nat] === '동유럽') return '동유럽';                                  // 베오그라드 · 부쿠레슈티 · 몬카스트로
      if (st === 'is') return lon >= 26 ? '오스만 제국' : '이집트 중동';                // 이스탄불·앙카라 / 마그레브
      if (st === 'gr') return nat === '오스만 제국' && (lat > 42.5 || lon > 26.5) ? '오스만 제국' : '이탈리아 그리스';
      return '이탈리아 그리스';
    }
    if (NATION[nat]) return NATION[nat];
    return geoRegion(lon, lat);
  }
  /** 바다 — 북극·남극해 · 지중해 · 인도양 · 태평양(적도 남쪽은 남태평양) · 그 밖은 대서양 */
  function pacificAmericas(lon, lat) {
    if (lon < -130) return true;
    if (lat >= 18) return lon < -105;
    if (lat >= 14) return lon < -92;
    if (lat >= 8.5) return lon < -84.5;
    if (lat >= -2) return lon < -77.3;
    return lon < -70.2;
  }
  function ocean(lon, lat) {
    if (lat > 66 || lat < -55) return '항해(남극해 북극해)';
    if (box(lon, lat, -6, 42, 30, 47.5)) return '항해(지중해)';
    if ((lon >= 32 && lon < 100 && lat < 31) || (lon >= 20 && lon < 32 && lat < -30) ||
        (lon >= 100 && lon < 130 && lat < -12) || (lon >= 100 && lon < 147 && lat < -30)) return '항해(인도양)';
    if (lon >= 100 || pacificAmericas(lon, lat)) return lat < -5 && !(lon >= 100 && lon < 135 && lat > -12) ? '항해(남태평양)' : '항해(태평양)';
    return '항해(대서양)';
  }
  /** 전설의 대륙 둘레 (단서를 얻었거나 찾은 곳만 — 모르는 자리를 음악이 알려 주지 않게) */
  var LEGENDS = ['mu', 'atlantis', 'lemuria', 'kumari'];
  function nearLegend(lon, lat) {
    var s = G.Game && G.Game.state; if (!s) return false;
    var R = G.MUSIC.legendR || 4;
    return LEGENDS.some(function (id) {
      var d = G.DISC && G.DISC[id]; if (!d || d.lon == null) return false;
      var known = (s.hints && s.hints[id]) || (s.disc && s.disc[id]);
      return known && G.Geo.dist(lon, lat, d.lon, d.lat) < R;
    });
  }
  /** 사막 곡을 쓰는 세계의 넓은 사막 권역. 이 안에서도 실제 지형이 desert일 때만 사막 곡이 나온다. */
  function majorDesert(lon, lat) {
    return box(lon, lat, -18, 36, 14, 34) ||       // 사하라
      box(lon, lat, 34, 67, 12, 36) ||             // 아라비아·이란
      box(lon, lat, 54, 116, 30, 50) ||            // 중앙아시아·타클라마칸·고비
      box(lon, lat, 67, 80, 20, 31) ||             // 타르
      box(lon, lat, 9, 31, -36, -14) ||            // 나미브·칼라하리
      box(lon, lat, 35, 51, -3, 16) ||             // 다나킬·소말리
      box(lon, lat, -121, -101, 22, 43) ||         // 모하비·소노라·치와와·대분지
      box(lon, lat, -77, -64, -53, -14) ||         // 아타카마·파타고니아
      box(lon, lat, 113, 146, -36, -17);            // 오스트레일리아 내륙
  }
  function amazon(lon, lat) { return box(lon, lat, -74, -44, -19, 8); }
  function africa(lon, lat) { return box(lon, lat, -26, 35, -36, 37) || box(lon, lat, 35, 52, -36, 12); }
  function northLand(reg, lon, lat, ter) {
    return ter === 'ice' || ter === 'snow' || ter === 'tundra' || reg === '북유럽' || (lon >= 45 && lat >= 50);   // 스칸디나비아·시베리아
  }
  var EUROPE_LAND = { '이베리아': 1, '영국': 1, '이탈리아 그리스': 1, '프랑스 오스트리아': 1, '독일 네덜란드': 1, '동유럽': 1, '러시아': 1 };
  /** 뭍 탐험 */
  function landTrack(lon, lat) {
    if (nearLegend(lon, lat)) return '무대륙 아틀란티스';
    var ter = G.Geo && G.Geo.terrain ? G.Geo.terrain(lon, lat) : null, reg = geoRegion(lon, lat);
    if (ter === 'desert' && majorDesert(lon, lat)) return '탐험 (사막 탐험)';
    if (northLand(reg, lon, lat, ter)) return '탐험(북부 탐험)';
    if (reg === '동남아시아') return ter === 'forest' ? '탐험 (숲 탐험)' : '탐험(정글 탐험)';
    if (box(lon, lat, 100, 146, 18, 42) || box(lon, lat, 118, 146, 42, 55)) return '탐험 (동아시아)';   // 중국·만주·조선·일본
    if (africa(lon, lat) || amazon(lon, lat)) return '탐험(정글 탐험)';
    if (reg === '이집트 중동' || reg === '오스만 제국' || reg === '인도') return '탐험 (숲 탐험)';
    if (EUROPE_LAND[reg]) return '탐험(평지 초원 탐험)';
    if (ter === 'grass' || ter === 'steppe') return '탐험(평지 초원 탐험)';
    return reg || '탐험(평지 초원 탐험)';                              // 나머지 산지는 그 고장 곡
  }

  G.MUSIC = {
    volume: 1.6,   // 설정의 음악 크기(0~1)에 곱한다 (코드 음악보다 파일 음악이 작게 들려서). 1을 넘으면 1
    fade: 1.8,     // 곡이 바뀔 때 겹쳐 넘어가는 시간 (초)
    legendR: 4,    // 전설의 대륙에서 이만큼(°) 안이면 「무대륙 아틀란티스」
    geoRegion: geoRegion, cityRegion: cityRegion, ocean: ocean, landTrack: landTrack, nearLegend: nearLegend, majorDesert: majorDesert,
    scenes: {
      title:   { def: '항해(태평양)' },
      town:    { def: '이베리아', byPlace: { tavern: '주점', palace: '왕궁' }, festival: '귀환', home: '귀환', fn: function (c) { return cityRegion(c); } },
      sea:     { def: '항해(대서양)', wed: '결혼 후 첫 항해', fn: function (lon, lat) { return nearLegend(lon, lat) ? '무대륙 아틀란티스' : ocean(lon, lat); }, hold: 2 },   // hold: 이 날수만큼 연달아 다른 곳이어야 곡을 바꾼다
      land:    { def: '탐험(평지 초원 탐험)', fn: landTrack, hold: 3 },
      battle:  { def: '해상 전투' },
      duel:    { def: '일기토', gen: 'battle' },
      landwar: { def: '육상 전투', gen: 'battle' }
    },
    // 장면 사이의 「잠깐」 곡 (js/systems/musicmoments.js 가 감싸 둔 순간). minigame: 퍼즐·포커·낚시
    moments: { legend: '무대륙 아틀란티스', landwar: '육상 전투', minigame: '미니 게임', circum: '귀환' }
  };
})(window.G = window.G || {});
