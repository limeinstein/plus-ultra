/* 코스타 델 솔 3 OST — 설정 「배경 음악」을 「코스타 델 솔 3 OST」로 고르면 장면마다 이 곡을 유튜브 영상으로 튼다 (js/systems/ytmusic.js).
   곡 파일을 게임에 넣지 않고, 사용자가 알려 준 유튜브 영상을 그 시각(s~e초)만큼 퍼가기 재생기로 틀어 준다.
   - 영상을 올린 사람이 퍼가기를 막았거나 지워지면, 또는 유튜브를 막는 환경(Claude 아티팩트·인터넷 없음)이면 저절로 기존 음악으로 돌아간다
   - 유튜브 규칙에 따라 재생기는 화면 구석에 200×200 이상으로 보인다(끌어서 옮길 수 있다)
   고르는 차례는 ytmusic.js 의 pick() — 장면(도시·바다·뭍·해전·육상전·건물·미니 게임·사건)과 자리(도시 양식·바다 갈래·좌표). */
(function (G) {
  'use strict';
  G.OST = {
    title: 'Costa del Sol 3 OST',
    videos: { main: 'cnYv1JIAmaE', africa: '8PxICPkhHgc', joseon: 'yso8EiY36dg' },
    tracks: {
      t01: { v: 'main', s: 7, e: 147, name: '01 아프리카 남단' },
      t02: { v: 'main', s: 147, e: 259, name: '02 고향 (결혼·청혼)' },
      t03: { v: 'main', s: 259, e: 364, name: '03 신대륙' },
      t04: { v: 'main', s: 364, e: 487, name: '04 지중해 유럽 (이탈리아·프랑스·오스트리아·독일)' },
      t05: { v: 'main', s: 487, e: 635, name: '05 중국' },
      t06: { v: 'main', s: 635, e: 775, name: '06 이슬람 (오스만·페르시아·이집트)' },
      t07: { v: 'main', s: 775, e: 905, name: '07 북유럽(영국)·동유럽(시베리아)' },
      t08: { v: 'main', s: 905, e: 1062, name: '08 이베리아 (포르투갈·에스파냐)' },
      t09: { v: 'main', s: 1062, e: 1158, name: '09 인도 지역' },
      t10: { v: 'main', s: 1158, e: 1311, name: '10 해전·해적' },
      t11: { v: 'main', s: 1311, e: 1410, name: '11 인도' },
      t12: { v: 'main', s: 1410, e: 1613, name: '12 인도양' },
      t13: { v: 'main', s: 1613, e: 1800, name: '13 집으로 귀환' },
      t14: { v: 'main', s: 1800, e: 1930, name: '14 지중해' },
      t15: { v: 'main', s: 1930, e: 2074, name: '15 세계 일주' },
      t16: { v: 'main', s: 2074, e: 2199, name: '16 아틀란티스·무 대륙' },
      t17: { v: 'main', s: 2199, e: 2385, name: '17 동남아시아' },
      t18: { v: 'main', s: 2385, e: 2517, name: '18 북해 (스칸디나비아·영국 연안)' },
      t19: { v: 'main', s: 2517, e: 2627, name: '19 귀족 알현' },
      t20: { v: 'main', s: 2627, e: 2755, name: '20 왕궁 알현' },
      t21: { v: 'main', s: 2755, e: 2862, name: '21 주점' },
      t22: { v: 'main', s: 2862, e: 2970, name: '22 미니 게임' },
      t23: { v: 'main', s: 2970, e: 3144, name: '23 대서양 횡단' },
      t24: { v: 'main', s: 3144, e: 3259, name: '24 신대륙 연안·카리브 해' },
      t25: { v: 'main', s: 3259, e: 3437, name: '25 태평양 횡단' },
      t26: { v: 'main', s: 3437, e: 3570, name: '26 일본 육상 탐험' },
      t27: { v: 'main', s: 3570, e: 3710, name: '27 육상 전투' },
      t28: { v: 'main', s: 3710, e: null, name: '28 Game Over' },
      africa: { v: 'africa', s: 0, e: 83, name: '아프리카' },
      joseon: { v: 'joseon', s: 0, e: null, name: '조선' }
    },
    // 건물·사건 장면 → 곡
    moments: { palace: 't20', mansion: 't19', tavern: 't21', minigame: 't22', landwar: 't27', battle: 't10', circum: 't15', legend: 't16', gameover: 't28', love: 't02', home: 't13' }
  };
})(window.G = window.G || {});
