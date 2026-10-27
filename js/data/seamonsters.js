/* 해상 괴물의 재등장 간격과 전투 방식. 발견물·스프라이트 ID를 함께 쓴다. */
(function (G) {
  'use strict';
  G.SEA_MONSTERS = {
    'kraken': { years: 10, attack: 'volley' },
    'giant-octopus': { years: 10, attack: 'volley' },
    'sea-serpent': { years: 10, attack: 'charge' },
    'sea-dragon': { years: 10, attack: 'volley' },
    'man-eating-shark': { years: 10, attack: 'charge' },
    'ghost-ship': { years: 10, attack: 'volley', element: 'ghost' },
    'isonade': { years: 50, attack: 'charge' },
    'bakunawa': { years: 50, attack: 'volley' },
    'zaratan': { years: 50, attack: 'volley', speed: 0.6 },
    'leviathan': { years: 50, attack: 'volley', element: 'fire' },
    'jormungandr': { years: 50, attack: 'charge' },
    'cipactli': { years: 50, attack: 'charge' }
  };
})(window.G = window.G || {});
