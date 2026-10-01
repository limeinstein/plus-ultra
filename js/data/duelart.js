/* 일기토 그림 규격과 인물·배경 이름표.
   그림 파일은 images/duel/ 아래에 둔다. 전투원 시트는 6열×4행이며 행은 공격·방어·피격·행동이다.
   Codex 원본(1536×1024, 칸 256, 피벗 128,246)은 찌르기 칼날·머리가 옆 칸으로 넘어가 있어
   tools/duel_repack.py로 칸 432×304(피벗 165,278) 시트로 다시 짜서 쓴다 — 그림 크기(픽셀 배율)는 같다.
   원본 규격 시트를 그대로 넣어도 그림 크기로 알아보고 옛 칸으로 그린다(source). */
(function (G) {
  'use strict';

  var fighters = [
    ['main_admiral', '주인공', ['제독', '주인공']],
    ['first_mate', '부관', ['부관']],
    ['western_brawler', '털복숭이 웃통 벗은 서양 남자', ['거친 사내', '주정뱅이']],
    ['columbus', '콜럼버스', ['콜럼버스', '크리스토발 콜론']],
    ['cortes', '코르테스', ['코르테스', '에르난 코르테스']],
    ['redhair_pirate', '빨간머리 여자 해적', ['빨간머리 여자 해적']],
    ['blonde_pirate', '금발 여자 해적', ['금발 여자 해적']],
    ['african_warrior', '아프리카 전사', ['아프리카 전사']],
    ['mesoamerican_warrior', '아메리카 전사', ['아메리카 전사', '재규어 전사']],
    ['guan_yu', '관우', ['관우']],
    ['zhang_fei', '장비', ['장비']],
    ['joseon_swordsman', '하얀 도포를 입은 조선인 무사', ['조선인 무사', '조선 무사']],
    ['east_asian_attendant', '동양 여급', ['동양 여급']],
    ['samurai', '사무라이', ['사무라이']],
    ['barbary_corsair', '이슬람 해적', ['이슬람 해적', '하이레딘 바르바로사']],
    ['caribbean_pirate', '카리브 해적', ['카리브 해적', '해적 두목']],
    ['explorer', '탐험가', ['탐험가']],
    ['vietnamese_woman', '아오자이를 입은 베트남 여인', ['베트남 여인']],
    ['indian_warrior', '인도 발리우드 전사', ['인도 전사', '발리우드 전사']],
    ['native_chief', '인디언 추장', ['인디언 추장', '원주민 추장']],
    ['spanish_soldier', '스페인 군인', ['스페인 군인', '적 함장']]
  ];
  var byName = {};
  fighters.forEach(function (f) { f[2].forEach(function (n) { byName[n] = f[0]; }); });

  G.DUEL_ART = {
    sheet: {
      width: 2592, height: 1216, columns: 6, rows: 4,
      cell: [432, 304], pivot: [165, 278], safeMargin: 8,
      source: { width: 1536, height: 1024, cell: [256, 256], pivot: [128, 246] },
      animations: {
        attack: { row: 0, frames: 6, frameMs: [120, 90, 80, 70, 100, 140] },
        defense: { row: 1, frames: 4, frameMs: [90, 110, 80, 130] },
        hit: { row: 2, frames: 3, frameMs: [70, 110, 170] },
        action: { row: 3, frames: 6, frameMs: [180, 180, 180, 180, 150, 180] }
      }
    },
    fighters: fighters.map(function (f) { return { id: f[0], name: f[1], aliases: f[2] }; }),
    byName: byName,
    byLook: {
      admiral: 'main_admiral', mate: 'first_mate', brawler: 'western_brawler',
      pirate: 'caribbean_pirate', captain: 'spanish_soldier', rival: 'explorer'
    },
    backgrounds: {
      deck: 'deck', land: 'land_battle', battle: 'land_battle',
      explore: 'exploration', exploration: 'exploration', city: 'city', tavern: 'tavern'
    }
  };

  // ---------------------------------------------------------------- 누구에게 어떤 그림을
  // 도시·함대 양식(style) → 전투원 문화권. 초상 spec의 style·g(성별)를 먼저 보고, 없으면 지금 도시.
  var GROUP = { ib: 'ib', ne: 'eu', it: 'eu', gr: 'eu', ru: 'eu', co: 'eu', is: 'islam', pe: 'islam', sw: 'islam',
    af: 'af', tr: 'af', 'in': 'south', se: 'south', cn: 'cn', st: 'islam', kr: 'kr', jp: 'jp', az: 'meso', an: 'meso', na: 'na' };
  var BY_LOOK = {
    pirate: { islam: 'barbary_corsair', jp: 'samurai', cn: 'samurai', kr: 'samurai', '*': 'caribbean_pirate' },            // 동아시아 바다는 왜구
    captain: { ib: ['spanish_soldier', 'cortes'], eu: 'spanish_soldier', islam: 'barbary_corsair', jp: 'samurai', kr: 'joseon_swordsman', cn: 'guan_yu',
      south: 'indian_warrior', af: 'african_warrior', meso: 'mesoamerican_warrior', na: 'native_chief', '*': 'spanish_soldier' },
    brawler: { ib: 'western_brawler', eu: 'western_brawler', islam: 'barbary_corsair', jp: 'samurai', kr: 'joseon_swordsman', cn: 'zhang_fei',
      south: 'indian_warrior', af: 'african_warrior', meso: 'mesoamerican_warrior', na: 'native_chief', '*': 'western_brawler' },
    mate: { islam: 'barbary_corsair', jp: 'samurai', kr: 'joseon_swordsman', cn: 'zhang_fei', south: 'indian_warrior', af: 'african_warrior',
      meso: 'mesoamerican_warrior', na: 'native_chief', '*': 'first_mate' },
    rival: { '*': 'explorer' }
  };
  var FEMALE = { cn: 'east_asian_attendant', kr: 'east_asian_attendant', jp: 'east_asian_attendant', south: 'vietnamese_woman', '*': ['redhair_pirate', 'blonde_pirate'] };
  // 게임이 흔히 붙이는 이름(해적 두목·적 함장·거친 사내…)은 이름표 대신 문화권으로 고른다
  var GENERIC = { '해적 두목': 1, '적 함장': 1, '거친 사내': 1, '주정뱅이': 1, '제독': 1, '주인공': 1, '부관': 1, '탐험가': 1 };
  function hash(t) { var h = 7; t = String(t || ''); for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return Math.abs(h); }
  function one(v, seed) { return Array.isArray(v) ? v[hash(seed) % v.length] : v; }

  /** 싸우는 사람 f({name, portrait, look, admiral, m, sprite}) → 전투원 시트 id.
      ctx.style: 초상에 양식이 없을 때 쓸 도시·바다 양식 */
  G.DUEL_ART.pick = function (f, ctx) {
    if (!f) return null;
    if (f.sprite) return f.sprite;
    if (byName[f.name] && !GENERIC[f.name]) return byName[f.name];   // 콜럼버스·코르테스처럼 이름이 정해진 사람
    var sp = f.portrait && typeof f.portrait === 'object' ? f.portrait : {};
    var style = sp.style || (ctx && ctx.style) || 'ib', grp = GROUP[style] || 'eu', seed = (f.name || '') + (sp.seed || '');
    if (sp.g === 'f') return one(FEMALE[grp] || FEMALE['*'], seed);
    if (f.admiral) return f.hero || 'main_admiral';           // 제독: 생김새의 시트(playerFighter가 있는 것만 넣음)
    var look = f.m ? 'mate' : f.look, t = BY_LOOK[look];
    if (!t) return G.DUEL_ART.byLook[look] || 'western_brawler';
    return one(t[grp] || t['*'], seed);
  };
  /** 시트 그림으로 칸·피벗을 고른다. 가로세로 비로 규격(다시 짠 시트 2.13 / Codex 원본 1.5)을 알아보고,
      아티팩트처럼 줄인 사본이면 배율 f(그림 픽셀 ÷ 규격 픽셀)를 함께 돌려준다 */
  G.DUEL_ART.layout = function (img) {
    var sh = G.DUEL_ART.sheet, w = (img && (img.naturalWidth || img.width)) || sh.width, h = (img && (img.naturalHeight || img.height)) || sh.height;
    var L = Math.abs(w / h - sh.source.width / sh.source.height) < 0.05 ? sh.source : sh, f = w / L.width;
    return { cw: L.cell[0] * f, ch: L.cell[1] * f, px: L.pivot[0] * f, py: L.pivot[1] * f, f: f };
  };
})(window.G = window.G || {});
