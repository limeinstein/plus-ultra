/* 항해사(부하 후보)가 돌아다니는 곳.
   항해사는 저마다 한 도시에 머물다가 한 달에 한 번 이웃 도시로 옮기거나 그대로 있는다(js/systems/matemove.js).
   옮겨 다니는 곳은 자기 고장(아래 zones)의 도시뿐이다. 만날 수 있는 곳은 그 도시의 술집·여관.

   G.MATE_ZONES: 고장 → {name, ids: 도시 번호}
   G.MATE_RANGE: 항해사 → {zones: [고장…], home: 처음 머무는 도시 번호}
   고장이 여러 개이고 서로 멀면(이베리아와 인도, 이베리아와 카리브 같은) 가끔 배를 타고 건너간다(G.MATE_MOVE.voyage). */
(function (G) {
  'use strict';
  G.MATE_ZONES = {
    iberia:  { name: '이베리아', ids: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 84, 86, 87, 88] },          // 반도와 세우타·아조레스·마디라·카나리아
    maghreb: { name: '마그레브·사헬', ids: [9, 10, 81, 82, 83, 85, 92, 93, 94, 95, 96] },                        // 그라나다·말라가(무어인의 땅)·트리폴리~카사블랑카·통북투
    egypt:   { name: '이집트·레반트', ids: [78, 79, 80, 111, 118, 119, 120, 121, 122, 123] },
    ottoman: { name: '오스만', ids: [112, 113, 114, 115, 116, 117, 72, 73, 76] },
    arabia:  { name: '아라비아·페르시아', ids: [124, 125, 126, 127, 128, 129, 130, 131] },
    italy:   { name: '이탈리아', ids: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37] },                        // 이탈리아 반도와 사르데냐·시칠리아
    france:  { name: '프랑스', ids: [14, 15, 16, 17, 18, 19, 20, 21] },
    lowlands:{ name: '네덜란드', ids: [22, 23, 24, 25] },
    britain: { name: '브리튼', ids: [38, 39, 40, 41, 42, 43] },
    germany: { name: '독일·중부 유럽', ids: [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58] },
    nordic:  { name: '북유럽', ids: [64, 65, 66, 67, 68] },
    easteu:  { name: '동유럽', ids: [59, 60, 61, 62, 63, 69, 70, 77] },
    greece:  { name: '발칸·그리스', ids: [71, 72, 73, 74, 75, 76] },
    wafrica: { name: '서아프리카', ids: [89, 90, 91, 97, 98, 99, 100, 101] },
    eafrica: { name: '동아프리카', ids: [102, 103, 105, 106, 107, 108, 109, 110] },
    india:   { name: '인도', ids: [145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157] },
    casia:   { name: '중앙아시아', ids: [132, 133, 134, 135, 136, 137, 138, 140, 141] },
    seasia:  { name: '동남아시아', ids: [158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172] },
    china:   { name: '명', ids: [173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189] },
    korea:   { name: '조선', ids: [190, 226, 227, 228, 229] },
    japan:   { name: '일본', ids: [191, 192, 193] },
    antilles:{ name: '카리브', ids: [194, 195, 196, 197, 198, 208, 209, 210, 211, 212, 213] },
    mexico:  { name: '누에바 에스파냐', ids: [199, 200, 201, 202, 203, 204, 205, 206, 207] },
    andes:   { name: '안데스', ids: [218, 219, 220, 221, 222, 223, 224, 225] },
    brazil:  { name: '브라질', ids: [214, 215, 216, 217] }
  };

  // 항해사마다 돌아다니는 고장과 처음 머무는 도시
  G.MATE_RANGE = {
    rocco:        { zones: ['iberia', 'italy'], home: 0 },          // 제노바 뱃사람, 리스본에서 만나 첫 부관이 된다
    duarte:       { zones: ['iberia', 'wafrica'], home: 0 },
    lacosa:       { zones: ['iberia', 'antilles'], home: 8 },
    pinzon_m:     { zones: ['iberia'], home: 8 },                   // 팔로스 — 카디스·세비야 근방
    pinzon_v:     { zones: ['iberia', 'antilles'], home: 8 },
    triana:       { zones: ['iberia', 'antilles'], home: 7 },
    torres:       { zones: ['iberia', 'antilles'], home: 7 },
    arana:        { zones: ['iberia', 'antilles'], home: 6 },
    vespucci:     { zones: ['italy', 'iberia'], home: 30 },         // 피렌체 → 세비야
    dias:         { zones: ['iberia', 'wafrica'], home: 0 },
    zacuto:       { zones: ['iberia', 'maghreb'], home: 0 },        // 유대인 천문학자 — 쫓겨나 튀니스로
    ibnmajid:     { zones: ['arabia', 'eafrica', 'india'], home: 125 },
    hasan:        { zones: ['maghreb', 'egypt', 'ottoman', 'arabia'], home: 79 },
    pigafetta:    { zones: ['italy', 'iberia'], home: 29 },
    elcano:       { zones: ['iberia'], home: 3 },
    serrao:       { zones: ['india', 'seasia'], home: 150 },
    correia:      { zones: ['india'], home: 150 },
    aguilar:      { zones: ['mexico', 'antilles'], home: 206 },
    marina:       { zones: ['mexico'], home: 200 },
    xavier:       { zones: ['india', 'seasia', 'japan'], home: 150 },
    bokuden:      { zones: ['japan'], home: 193 },
    nakoda:       { zones: ['seasia'], home: 160 },
    leonardo:     { zones: ['italy'], home: 26 },                   // 이탈리아 반도 안에서만
    michelangelo: { zones: ['italy'], home: 30 },
    raffaello:    { zones: ['italy'], home: 33 },
    donatello:    { zones: ['italy'], home: 30 },
    botticelli:   { zones: ['italy'], home: 30 },
    gutenberg:    { zones: ['germany'], home: 48 },
    verrocchio:   { zones: ['italy'], home: 30 },
    manutius:     { zones: ['italy'], home: 29 },
    regiomontanus:{ zones: ['germany', 'italy'], home: 51 },
    tycho:        { zones: ['nordic', 'germany'], home: 66 },
    kepler:       { zones: ['germany'], home: 53 },
    galileo:      { zones: ['italy'], home: 31 },
    ariosto:      { zones: ['italy'], home: 30 },
    camoes:       { zones: ['iberia', 'india'], home: 0 },
    cervantes:    { zones: ['iberia', 'italy', 'maghreb'], home: 7 },
    shakespeare:  { zones: ['britain'], home: 38 },
    drake:        { zones: ['britain', 'antilles'], home: 39 },
    shylock:      { zones: ['italy'], home: 29 },
    piri:         { zones: ['ottoman', 'greece', 'egypt'], home: 112 },
    barbarossa:   { zones: ['maghreb', 'ottoman'], home: 83 },
    cabot:        { zones: ['britain', 'iberia'], home: 40 },
    verrazzano:   { zones: ['france', 'italy'], home: 15 },
    urdaneta:     { zones: ['iberia', 'mexico'], home: 3 },
    orellana:     { zones: ['andes', 'antilles'], home: 219 },
    coronado:     { zones: ['mexico'], home: 201 },
    cadamosto:    { zones: ['italy', 'iberia'], home: 0 },
    covilha:      { zones: ['iberia', 'egypt', 'arabia', 'eafrica'], home: 0 },
    leoafricanus: { zones: ['maghreb', 'egypt', 'italy'], home: 85 },
    garcia:       { zones: ['india'], home: 150 },
    paracelsus:   { zones: ['germany'], home: 55 },
    mercator:     { zones: ['lowlands', 'germany'], home: 23 },
    amina:        { zones: ['iberia', 'maghreb', 'egypt'], home: 10 },   // 그라나다의 아랍어 사용자 — 이베리아와 이슬람 땅
    isaac:        { zones: ['iberia', 'italy'], home: 0 },
    manuel:       { zones: ['iberia'], home: 0 },
    zara:         { zones: ['iberia', 'maghreb', 'egypt'], home: 85 },   // 모로코 출신 아랍어 사용자
    giorgio:      { zones: ['italy', 'iberia'], home: 0 },
    ahmad:        { zones: ['arabia', 'india'], home: 128 },
    chen:         { zones: ['china', 'seasia'], home: 176 },
    kim:          { zones: ['korea', 'china'], home: 190 },
    tupac:        { zones: ['andes'], home: 223 },
    kisk:         { zones: ['wafrica'], home: 100 }
  };

  // 옮겨 다니는 규칙 (조정값)
  G.MATE_MOVE = {
    stay: 0.5,        // 한 달 동안 그대로 머물 확률
    near: 4,          // 옮길 때 고르는 가까운 도시 수 (큰 도시일수록 잘 간다)
    voyage: 0.06,     // 고장이 여럿이고 멀 때, 항구에 있으면 배를 타고 다른 고장 항구로 건너갈 확률 (한 달)
    homeStart: 0.5,   // 처음 자리: 이 확률로 고향 도시, 아니면 첫 고장의 아무 도시
    hintDeg: 14       // 술집 주인이 알려 주는 "근처" 항해사의 거리 (°)
  };
})(window.G = window.G || {});
