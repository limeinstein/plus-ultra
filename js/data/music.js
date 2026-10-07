/* 배경 음악 파일과 장면·지역별 고르기 표 (js/systems/audio.js가 읽는다).
   파일은 music/ 폴더. 파일이 없거나 읽지 못하면 그 장면은 예전처럼 코드로 만든 음악(Web Audio)으로 돌아간다.

   고르는 차례 — 장면마다:
     town(도시)   : 건물 안이면 byPlace[건물] → byCity[도시 번호] → byRegion[지역 번호] → byStyle[도시 양식] → def
     sea(항해)    : byZone[바다 G.Ships.zone] → def
     land(육상 탐험): byTerrain[지형 G.Geo.terrain] → (byNearCity면) 가까운 도시의 고장 곡(gen:) → def
     battle(해전·일기토·육상전): def
   'gen:이름'은 파일 대신 그 고장의 음계·장단으로 코드가 만드는 음악 (js/systems/audio.js SCALES):
     tavern 주점 지그 · east 중국 5음 · korea 조선 장단 · japan 미야코부시 · arab 히자즈+다르부카 · india 탐푸라+타블라 ·
     africa 손북 · seasia 가믈란 · america 안데스 피리 · seaind 인도양 항해 · seaeast 동아시아 항해
   지역별 음악 파일이 생기면 파일을 music/에 넣고 FILES와 아래 표의 'gen:…'을 파일 이름으로 바꾸면 된다. */
(function (G) {
  'use strict';
  G.MUSIC_FILES = {
    city_med:       'music/city_med.mp3',        // 지중해 도시
    sail_med:       'music/sail_med.mp3',        // 지중해 항해 — 바다 기본
    north_europe:   'music/north_europe.mp3',    // 북유럽 — 북해·발트해 항해, 북유럽 도시
    explore_europe: 'music/explore_europe.mp3',  // 유럽 탐험 — 육상 탐험 기본
    explore_desert: 'music/explore_desert.mp3',  // 사막 탐험
    explore_jungle: 'music/explore_jungle.mp3',  // 정글 탐험
    battle_sea:     'music/battle_sea.mp3'       // 해상 전투
  };
  G.MUSIC = {
    volume: 1.6,   // 설정의 음악 크기(0~1)에 곱한다 (코드 음악보다 파일 음악이 작게 들려서). 1을 넘으면 1
    fade: 1.8,     // 곡이 바뀔 때 겹쳐 넘어가는 시간 (초)
    scenes: {
      town:   { def: 'city_med',
                byPlace: { tavern: 'gen:tavern' },                                     // 주점 안 — 나오면 그 고장 거리의 곡
                byRegion: { 9: 'gen:japan', 10: 'gen:america' },                      // 일본·아메리카는 도시 양식(유럽 식민 도시)보다 고장
                byStyle: { ne: 'north_europe', ru: 'north_europe', st: 'north_europe', kr: 'gen:korea', cn: 'gen:east', jp: 'gen:japan', se: 'gen:seasia',
                  in: 'gen:india', is: 'gen:arab', pe: 'gen:arab', af: 'gen:africa', sw: 'gen:africa', tr: 'gen:africa' } },
      sea:    { def: 'sail_med', byZone: { north: 'north_europe', ind: 'gen:seaind', east: 'gen:seaeast', sea: 'gen:seaeast', amer: 'gen:america' }, hold: 2 },          // hold: 이 날수만큼 연달아 다른 곳이어야 곡을 바꾼다 (경계에서 오락가락하지 않게)
      land:   { def: 'explore_europe', byTerrain: { desert: 'explore_desert', jungle: 'explore_jungle' }, byNearCity: true, hold: 3 },
      battle: { def: 'battle_sea' }
    }
  };
})(window.G = window.G || {});
