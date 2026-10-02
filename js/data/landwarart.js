/* 육상전 그림 짝짓기 (js/games/landwar.js) — Codex가 만든 육상전투 스프라이트 시트 15장(images/sprites/, js/data/sprites.js)을 부대에 잇는다.
   · 우리 편: 시트의 줄이 단계(0~3)다. 보병 = 검술, 총병 = 사격술, 포병 = 포술 솜씨대로, 제독대 = 세 솜씨의 평균(셋 다 3이면 전설)
       swordsmen  몽둥이 마을 사람 · 민병 검객 · 정예 결투가 · 소드 마스터
       musketeers 마을 사냥꾼 · 민병 명사수 · 베테랑 화승총병 · 정예 총사대
       cannons    훈련 포병 · 정규 포병 · 베테랑 포술장 · 포병 장교
       officers   일반 제독 · 숙련 제독 · 정예 제독 · 전설적인 제독
   · 적: 싸우는 땅(regionOf)마다 병종 [시트, 줄] — m 근접(창·칼·도적) · r 원거리(활·총·투석) · l 우두머리 · c 포대 · b 짐승 [떼, 우두머리]
     줄 이름은 tools/sprite_repack.py 의 rows 와 같다 */
(function (G) {
  'use strict';
  var AF = ['natives', 'shaman'], AM = ['natives', 'warrior'];        // 06 시트: 서·중앙아프리카 주술 전사 / 아메리카 원주민 주술 전사
  var GUN_ASIA = ['musketeers', 'lv1'], CANNON = ['cannons', 'lv1'], CANNON_E = ['cannons', 'lv0'];
  var R = {
    iberia: { name: '이베리아', m: ['west_europe', 'rodelero'], r: ['west_europe', 'crossbow'], l: ['west_europe', 'rodelero'], c: CANNON, b: ['boar', 'bear'] },
    weurope: { name: '서유럽', m: ['west_europe', 'landsknecht'], r: ['west_europe', 'crossbow'], l: ['west_europe', 'landsknecht'], c: CANNON, b: ['boar', 'bear'] },
    eeurope: { name: '동유럽', m: ['west_europe', 'stradiot'], r: ['west_europe', 'crossbow'], l: ['west_europe', 'stradiot'], c: CANNON, b: ['boar', 'bear'] },
    russia: { name: '러시아', m: ['west_europe', 'stradiot'], r: ['west_europe', 'streltsy'], l: ['west_europe', 'streltsy'], c: CANNON, b: ['bear', 'bear'] },
    ottoman: { name: '오스만', m: ['ottoman', 'shield'], r: ['ottoman', 'janissary'], l: ['ottoman', 'shield'], c: ['ottoman', 'topcu'], b: ['hyena', 'hyena'] },
    persia: { name: '페르시아', m: ['india_central', 'qizilbash'], r: ['india_central', 'horse_archer'], l: ['india_central', 'qizilbash'], c: ['ottoman', 'topcu'], b: ['hyena', 'hyena'] },
    afghan: { name: '중앙아시아', m: ['india_central', 'afghan'], r: ['india_central', 'horse_archer'], l: ['india_central', 'afghan'], c: CANNON, b: ['hyena', 'bear'] },
    india: { name: '인도', m: ['india_central', 'rajput'], r: ['india_central', 'mughal_gun'], l: ['india_central', 'rajput'], c: CANNON, b: ['tiger', 'tiger'] },
    china: { name: '중국', m: ['east_fighters', 'spearman'], r: GUN_ASIA, l: ['east_fighters', 'swordsman'], c: CANNON_E, bandit: ['east_fighters', 'brute'], b: ['tiger', 'tiger'] },
    korea: { name: '조선', m: ['east_fighters', 'spearman'], r: GUN_ASIA, l: ['east_fighters', 'scholar'], c: CANNON_E, bandit: ['east_fighters', 'brute'], b: ['bear', 'bear'] },
    japan: { name: '일본', m: ['east_fighters', 'ninja'], r: GUN_ASIA, l: ['east_fighters', 'swordsman'], c: CANNON_E, bandit: ['east_fighters', 'ninja'], b: ['boar', 'boar'] },
    thai: { name: '아유타야', m: ['southeast_asia', 'ayutthaya'], r: GUN_ASIA, l: ['southeast_asia', 'ayutthaya'], c: CANNON_E, b: ['tiger', 'tiger'] },
    vietnam: { name: '대월', m: ['southeast_asia', 'daiviet'], r: GUN_ASIA, l: ['southeast_asia', 'daiviet'], c: CANNON_E, b: ['tiger', 'tiger'] },
    malay: { name: '말레이', m: ['southeast_asia', 'malay'], r: ['southeast_asia', 'moluccan'], l: ['southeast_asia', 'malay'], c: CANNON_E, b: ['tiger', 'tiger'] },
    java: { name: '자바', m: ['southeast_asia', 'javanese'], r: ['southeast_asia', 'moluccan'], l: ['southeast_asia', 'javanese'], c: CANNON_E, b: ['tiger', 'tiger'] },
    moluccas: { name: '몰루카·필리핀', m: ['southeast_asia', 'moluccan'], r: ['southeast_asia', 'moluccan'], l: ['southeast_asia', 'malay'], c: CANNON_E, b: ['boar', 'boar'] },
    wafrica: { name: '서아프리카', m: ['africa_regions', 'sahel_spear'], r: ['africa_regions', 'w_archer'], l: AF, c: CANNON, b: ['hyena', 'lion'] },
    sahel: { name: '사헬', m: ['africa_regions', 'sahel_spear'], r: ['africa_regions', 'w_archer'], l: ['africa_regions', 'sahel_spear'], c: CANNON, b: ['hyena', 'lion'] },
    congo: { name: '콩고', m: ['africa_regions', 'kongo_axe'], r: ['africa_regions', 'w_archer'], l: AF, c: CANNON, b: ['hyena', 'lion'] },
    ethiopia: { name: '에티오피아', m: ['africa_regions', 'ethiopian'], r: ['africa_regions', 'w_archer'], l: ['africa_regions', 'ethiopian'], c: CANNON, b: ['hyena', 'lion'] },
    swahili: { name: '스와힐리 해안', m: ['africa_regions', 'swahili'], r: ['africa_regions', 'w_archer'], l: ['africa_regions', 'swahili'], c: CANNON, b: ['hyena', 'lion'] },
    mexico: { name: '멕시카', m: ['meso_south', 'eagle'], r: ['meso_south', 'amazon_bow'], l: ['meso_south', 'eagle'], c: CANNON, b: ['jaguar', 'jaguar'] },
    maya: { name: '마야', m: ['meso_south', 'maya_spear'], r: ['meso_south', 'amazon_bow'], l: AM, c: CANNON, b: ['jaguar', 'jaguar'] },
    caribbean: { name: '카리브', m: ['meso_south', 'taino'], r: ['meso_south', 'amazon_bow'], l: AM, c: CANNON, b: ['jaguar', 'jaguar'] },
    andes: { name: '안데스', m: ['meso_south', 'maya_spear'], r: ['meso_south', 'inca_sling'], l: AM, c: CANNON, b: ['jaguar', 'bear'] },
    amazon: { name: '아마존', m: ['meso_south', 'taino'], r: ['meso_south', 'amazon_bow'], l: AM, c: CANNON, b: ['jaguar', 'jaguar'] },
    woodland: { name: '북아메리카 삼림', m: ['north_america', 'woodland'], r: ['north_america', 'algonquin'], l: AM, c: CANNON, b: ['bear', 'bear'] },
    plains: { name: '대평원', m: ['north_america', 'plains'], r: ['north_america', 'algonquin'], l: AM, c: CANNON, b: ['bear', 'bear'] },
    pueblo: { name: '푸에블로', m: ['north_america', 'pueblo'], r: ['north_america', 'algonquin'], l: AM, c: CANNON, b: ['jaguar', 'bear'] },
    northwest: { name: '북서 해안', m: ['north_america', 'northwest'], r: ['north_america', 'algonquin'], l: ['north_america', 'northwest'], c: CANNON, b: ['bear', 'bear'] },
    maori: { name: '아오테아로아', m: ['pacific', 'maori'], r: ['pacific', 'micronesian'], l: ['pacific', 'maori'], c: CANNON, b: ['boar', 'boar'] },
    polynesia: { name: '폴리네시아', m: ['pacific', 'polynesian'], r: ['pacific', 'micronesian'], l: ['pacific', 'polynesian'], c: CANNON, b: ['boar', 'boar'] },
    australia: { name: '오스트레일리아', m: ['pacific', 'aboriginal'], r: ['pacific', 'aboriginal'], l: ['pacific', 'aboriginal'], c: CANNON, b: ['boar', 'boar'] },
    papua: { name: '파푸아', m: ['pacific', 'polynesian'], r: ['pacific', 'papuan'], l: ['pacific', 'papuan'], c: CANNON, b: ['boar', 'boar'] },
    micronesia: { name: '미크로네시아', m: ['pacific', 'micronesian'], r: ['pacific', 'micronesian'], l: ['pacific', 'polynesian'], c: CANNON, b: ['boar', 'boar'] }
  };
  function inb(lon, lat, x0, x1, y0, y1) { return lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1; }
  /** 경도·위도 → 지역 이름 (R의 키) */
  function regionOf(lon, lat) {
    // 태평양·오세아니아
    if (inb(lon, lat, 165, 180, -48, -33)) return 'maori';
    if (inb(lon, lat, 112, 155, -45, -11)) return 'australia';
    if (inb(lon, lat, 130, 155, -11, 0)) return 'papua';
    if (inb(lon, lat, 130, 178, 0, 23) && !inb(lon, lat, 130, 146, 23, 46)) return lon < 133 && lat < 14 ? 'moluccas' : 'micronesia';
    if ((lon >= 155 || lon <= -125) && lat >= -30 && lat <= 30) return 'polynesia';
    // 동아시아·동남아시아
    if (inb(lon, lat, 129, 147, 30, 46)) return 'japan';
    if (inb(lon, lat, 124, 131, 33, 43.5)) return 'korea';
    if (inb(lon, lat, 92, 135, -11, 23)) {
      if (lon >= 116) return 'moluccas';
      if (lat < -5 && lon >= 105) return 'java';
      if (lat < 8 || (lon >= 108 && lat < 8)) return 'malay';
      if (lon >= 103.5 && lat >= 8) return 'vietnam';
      return 'thai';
    }
    if (inb(lon, lat, 97, 135, 18, 54)) return 'china';
    // 남·중앙·서아시아
    if (inb(lon, lat, 66, 92, 5, 32)) return 'india';
    if (inb(lon, lat, 60, 76, 29, 39)) return 'afghan';
    if (inb(lon, lat, 50, 97, 35, 55)) return 'afghan';
    if (inb(lon, lat, 44, 66, 24, 40)) return 'persia';
    if (lat > 50 && lon > 30) return 'russia';
    if (inb(lon, lat, 33, 48, 3, 15.5) && !inb(lon, lat, 42.5, 48, 12, 15.5)) return 'ethiopia';   // 에티오피아 고원 (아라비아 남단·홍해 건너편과 가르기)
    if (inb(lon, lat, 18, 48, 12, 46.5) || inb(lon, lat, -11, 36, 20, 36) || inb(lon, lat, 34, 60, 12, 30)) return 'ottoman';
    // 유럽
    if (inb(lon, lat, -12, 45, 36, 72)) {
      if (lon < 3.5 && lat < 44) return 'iberia';
      if (lon >= 16) return 'eeurope';
      return 'weurope';
    }
    // 아프리카
    if (inb(lon, lat, -20, 52, -36, 20)) {
      if (inb(lon, lat, 33, 48, 3, 16)) return 'ethiopia';
      if (inb(lon, lat, 31, 52, -27, 3)) return 'swahili';
      if (lat >= 12) return 'sahel';
      if (lon < 10 && lat >= 0) return 'wafrica';
      return 'congo';
    }
    // 아메리카
    if (lon < -30) {
      if ((lon > -86 && lat > 17 && lat < 27.5 && !inb(lon, lat, -82, -80, 25, 27.5)) || inb(lon, lat, -66, -59, 10, 18)) return 'caribbean';
      if (inb(lon, lat, -94, -76, 7, 22)) return 'maya';
      if (inb(lon, lat, -118, -94, 14, 32)) return 'mexico';
      if (lat >= 30) {
        if (lon < -116 && lat >= 40) return 'northwest';
        if (lon < -100 && lat < 38) return 'pueblo';
        if (lon < -95) return 'plains';
        return 'woodland';
      }
      if (lat < 13) return lon < -68 && lat < 5 ? 'andes' : 'amazon';
      return 'mexico';
    }
    return 'weurope';
  }
  G.LANDWAR_ART = {
    regions: R,
    regionOf: regionOf,
    /** 우리 편 부대 종류 → 시트 (줄은 솜씨 단계) */
    mine: { inf: ['swordsmen', 'sword'], gun: ['musketeers', 'shoot'], art: ['cannons', 'gun'], adm: ['officers', null] },
    /** 기병은 탐험대 질주 시트 (탈것마다) */
    cav: { '말': 'mounted_gallop', '낙타': 'camel_gallop', '코끼리': 'elephant_charge' }
  };
})(window.G = window.G || {});
