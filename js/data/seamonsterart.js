/* 해상 괴물 그림 자료. 전투 규칙과 별개이며 보선과 같은 수면 기준점을 쓴다. */
(function (G) {
  'use strict';
  G.SEA_MONSTER_LAYOUT = {
    cell: 224, cols: 8, rows: 6, dirs: 8, anchor: [112, 139], baseLen: 158,
    directions: ['동', '북동', '북', '북서', '서', '남서', '남', '남동'],
    states: ['idle', 'swim', 'attack', 'dive', 'submerged', 'emerge']
  };
  G.SEA_MONSTER_ART = {
    'kraken': { name: '크라켄', key: 'sea-monsters/kraken' },
    'giant-octopus': { name: '대왕문어', key: 'sea-monsters/giant-octopus' },
    'sea-serpent': { name: '바다뱀', key: 'sea-monsters/sea-serpent' },
    'sea-dragon': { name: '해룡', key: 'sea-monsters/sea-dragon' },
    'man-eating-shark': { name: '식인상어', key: 'sea-monsters/man-eating-shark' },
    'ghost-ship': { name: '유령선', key: 'sea-monsters/ghost-ship', spectral: true },
    'isonade': { name: '이소나데', key: 'sea-monsters/isonade' },
    'bakunawa': { name: '바쿠나와', key: 'sea-monsters/bakunawa' },
    'zaratan': { name: '자라탄', key: 'sea-monsters/zaratan' },
    'leviathan': { name: '레비아탄', key: 'sea-monsters/leviathan' },
    'jormungandr': { name: '요르문간드', key: 'sea-monsters/jormungandr' },
    'cipactli': { name: '시팍틀리', key: 'sea-monsters/cipactli' }
  };
})(window.G = window.G || {});
