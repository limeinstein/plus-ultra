/* 위구르 8·몽골 10·티베트 6·만주 6명의 창작 성인 남성 항해사.
   초상은 tools/steppe_windsalt_20261117_prompts.json, 발견물·도시·주기 수치는 base.js에 둔다. */
(function (G) {
  'use strict';
  var cfg = G.BALANCE.steppeCrew, groups = {}, byRegion = {};
  var names = { UG: '위구르', MN: '몽골', TB: '티베트', MJ: '만주' };
  Object.keys(cfg.groups).forEach(function (key) {
    G.MATE_ZONES['steppe_' + key] = { name: names[key], ids: cfg.groups[key].cities.slice() };
    byRegion[key] = [];
  });
  var crew = [
  {
    "no": "ug01",
    "id": "steppe_ug01",
    "name": "아르슬란 투르순",
    "nat": "UG",
    "natName": "위구르",
    "steppeRegion": "UG",
    "style": "st",
    "home": 137,
    "zone": "steppe_UG",
    "reg": [
      7
    ],
    "portraitAge": 29,
    "st": [
      84,
      70,
      78,
      72
    ],
    "sk": {
      "ops": 3,
      "nav": 3,
      "ship": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "위구르 출신의 돛줄 항해사. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "ug02",
    "id": "steppe_ug02",
    "name": "티무르 아지즈",
    "nat": "UG",
    "natName": "위구르",
    "steppeRegion": "UG",
    "style": "st",
    "home": 138,
    "zone": "steppe_UG",
    "reg": [
      7
    ],
    "portraitAge": 35,
    "st": [
      87,
      77,
      83,
      74
    ],
    "sk": {
      "ops": 3,
      "sword": 3,
      "nav": 2,
      "speech": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "위구르 출신의 갑판 호위. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "ug03",
    "id": "steppe_ug03",
    "name": "바흐티야르 아흐메트",
    "nat": "UG",
    "natName": "위구르",
    "steppeRegion": "UG",
    "style": "st",
    "home": 311,
    "zone": "steppe_UG",
    "reg": [
      7
    ],
    "portraitAge": 42,
    "st": [
      90,
      84,
      88,
      76
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "sci": 2,
      "hist": 2,
      "ops": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2,
      "13": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "위구르 출신의 밧줄 운반꾼. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "ug04",
    "id": "steppe_ug04",
    "name": "일리아스 카디르",
    "nat": "UG",
    "natName": "위구르",
    "steppeRegion": "UG",
    "style": "st",
    "home": 137,
    "zone": "steppe_UG",
    "reg": [
      7
    ],
    "portraitAge": 31,
    "st": [
      93,
      71,
      93,
      78
    ],
    "sk": {
      "sword": 3,
      "shoot": 3,
      "ops": 2,
      "nav": 2,
      "med": 2,
      "speech": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "위구르 출신의 해도 제작자. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "ug05",
    "id": "steppe_ug05",
    "name": "알리 무라트",
    "nat": "UG",
    "natName": "위구르",
    "steppeRegion": "UG",
    "style": "st",
    "home": 138,
    "zone": "steppe_UG",
    "reg": [
      7
    ],
    "portraitAge": 28,
    "st": [
      96,
      78,
      82,
      80
    ],
    "sk": {
      "ship": 3,
      "craft": 3,
      "ops": 2,
      "nav": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "위구르 출신의 선단 경비. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "ug06",
    "id": "steppe_ug06",
    "name": "에르킨 야쿱",
    "nat": "UG",
    "natName": "위구르",
    "steppeRegion": "UG",
    "style": "st",
    "home": 311,
    "zone": "steppe_UG",
    "reg": [
      7
    ],
    "portraitAge": 33,
    "st": [
      85,
      85,
      87,
      82
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "speech": 2,
      "acct": 2,
      "hist": 2,
      "sci": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2,
      "13": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "위구르 출신의 물 보급관. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "ug07",
    "id": "steppe_ug07",
    "name": "파루크 이민",
    "nat": "UG",
    "natName": "위구르",
    "steppeRegion": "UG",
    "style": "st",
    "home": 137,
    "zone": "steppe_UG",
    "reg": [
      7
    ],
    "portraitAge": 37,
    "st": [
      88,
      72,
      92,
      84
    ],
    "sk": {
      "cook": 3,
      "med": 3,
      "nav": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "위구르 출신의 신호장. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "ug08",
    "id": "steppe_ug08",
    "name": "유수프 카심",
    "nat": "UG",
    "natName": "위구르",
    "steppeRegion": "UG",
    "style": "st",
    "home": 138,
    "zone": "steppe_UG",
    "reg": [
      7
    ],
    "portraitAge": 30,
    "st": [
      91,
      79,
      81,
      86
    ],
    "sk": {
      "ops": 3,
      "ship": 3,
      "craft": 2,
      "sword": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "위구르 출신의 매듭 장인. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mo01",
    "id": "steppe_mo01",
    "name": "바투 에르덴",
    "nat": "MN",
    "natName": "몽골",
    "steppeRegion": "MN",
    "style": "st",
    "home": 310,
    "zone": "steppe_MN",
    "reg": [
      7
    ],
    "portraitAge": 38,
    "st": [
      94,
      86,
      86,
      88
    ],
    "sk": {
      "nav": 3,
      "sci": 3,
      "survey": 2,
      "art": 2,
      "speech": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2,
      "13": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "몽골 출신의 권양기 갑판장. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mo02",
    "id": "steppe_mo02",
    "name": "테무르 바타르",
    "nat": "MN",
    "natName": "몽골",
    "steppeRegion": "MN",
    "style": "st",
    "home": 143,
    "zone": "steppe_MN",
    "reg": [
      7
    ],
    "portraitAge": 34,
    "st": [
      97,
      73,
      91,
      90
    ],
    "sk": {
      "speech": 3,
      "music": 3,
      "acct": 2,
      "nav": 2,
      "ops": 2,
      "cook": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "몽골 출신의 돛 운반꾼. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mo03",
    "id": "steppe_mo03",
    "name": "간볼드",
    "nat": "MN",
    "natName": "몽골",
    "steppeRegion": "MN",
    "style": "st",
    "home": 144,
    "zone": "steppe_MN",
    "reg": [
      7
    ],
    "portraitAge": 46,
    "st": [
      86,
      80,
      80,
      73
    ],
    "sk": {
      "ops": 3,
      "nav": 3,
      "ship": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "몽골 출신의 방향 길잡이. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mo04",
    "id": "steppe_mo04",
    "name": "알탄 수흐",
    "nat": "MN",
    "natName": "몽골",
    "steppeRegion": "MN",
    "style": "st",
    "home": 310,
    "zone": "steppe_MN",
    "reg": [
      7
    ],
    "portraitAge": 41,
    "st": [
      89,
      87,
      85,
      75
    ],
    "sk": {
      "ops": 3,
      "sword": 3,
      "nav": 2,
      "speech": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2,
      "13": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "몽골 출신의 밧줄 장인. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mo05",
    "id": "steppe_mo05",
    "name": "오치르 바야르",
    "nat": "MN",
    "natName": "몽골",
    "steppeRegion": "MN",
    "style": "st",
    "home": 143,
    "zone": "steppe_MN",
    "reg": [
      7
    ],
    "portraitAge": 44,
    "st": [
      92,
      74,
      90,
      77
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "sci": 2,
      "hist": 2,
      "ops": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "몽골 출신의 선단 연락원. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mo06",
    "id": "steppe_mo06",
    "name": "뭉흐 바트",
    "nat": "MN",
    "natName": "몽골",
    "steppeRegion": "MN",
    "style": "st",
    "home": 144,
    "zone": "steppe_MN",
    "reg": [
      7
    ],
    "portraitAge": 32,
    "st": [
      95,
      81,
      79,
      79
    ],
    "sk": {
      "sword": 3,
      "shoot": 3,
      "ops": 2,
      "nav": 2,
      "med": 2,
      "speech": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "몽골 출신의 갑판 살림꾼. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mo07",
    "id": "steppe_mo07",
    "name": "토르곤 바야르",
    "nat": "MN",
    "natName": "몽골",
    "steppeRegion": "MN",
    "style": "st",
    "home": 310,
    "zone": "steppe_MN",
    "reg": [
      7
    ],
    "portraitAge": 29,
    "st": [
      84,
      88,
      84,
      81
    ],
    "sk": {
      "ship": 3,
      "craft": 3,
      "ops": 2,
      "nav": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2,
      "13": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "몽골 출신의 매듭 수선공. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mo08",
    "id": "steppe_mo08",
    "name": "사인 바타르",
    "nat": "MN",
    "natName": "몽골",
    "steppeRegion": "MN",
    "style": "st",
    "home": 143,
    "zone": "steppe_MN",
    "reg": [
      7
    ],
    "portraitAge": 36,
    "st": [
      87,
      75,
      89,
      83
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "speech": 2,
      "acct": 2,
      "hist": 2,
      "sci": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "몽골 출신의 망루 당직. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mo09",
    "id": "steppe_mo09",
    "name": "바타르 후",
    "nat": "MN",
    "natName": "몽골",
    "steppeRegion": "MN",
    "style": "st",
    "home": 144,
    "zone": "steppe_MN",
    "reg": [
      7
    ],
    "portraitAge": 53,
    "st": [
      90,
      82,
      78,
      85
    ],
    "sk": {
      "cook": 3,
      "med": 3,
      "nav": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "몽골 출신의 항로 참모. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mo10",
    "id": "steppe_mo10",
    "name": "도르지 테무르",
    "nat": "MN",
    "natName": "몽골",
    "steppeRegion": "MN",
    "style": "st",
    "home": 310,
    "zone": "steppe_MN",
    "reg": [
      7
    ],
    "portraitAge": 57,
    "st": [
      93,
      89,
      83,
      87
    ],
    "sk": {
      "ops": 3,
      "ship": 3,
      "craft": 2,
      "sword": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2,
      "13": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "몽골 출신의 원정 길잡이. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "tb01",
    "id": "steppe_tb01",
    "name": "텐진 도르제",
    "nat": "TB",
    "natName": "티베트",
    "steppeRegion": "TB",
    "style": "st",
    "home": 139,
    "zone": "steppe_TB",
    "reg": [
      7
    ],
    "portraitAge": 34,
    "st": [
      96,
      76,
      88,
      89
    ],
    "sk": {
      "nav": 3,
      "sci": 3,
      "survey": 2,
      "art": 2,
      "speech": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "티베트 출신의 별길 관측자. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "tb02",
    "id": "steppe_tb02",
    "name": "체링 남걀",
    "nat": "TB",
    "natName": "티베트",
    "steppeRegion": "TB",
    "style": "st",
    "home": 139,
    "zone": "steppe_TB",
    "reg": [
      7
    ],
    "portraitAge": 28,
    "st": [
      85,
      83,
      93,
      72
    ],
    "sk": {
      "speech": 3,
      "music": 3,
      "acct": 2,
      "nav": 2,
      "ops": 2,
      "cook": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "티베트 출신의 구조 담당. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "tb03",
    "id": "steppe_tb03",
    "name": "페마 왕축",
    "nat": "TB",
    "natName": "티베트",
    "steppeRegion": "TB",
    "style": "st",
    "home": 139,
    "zone": "steppe_TB",
    "reg": [
      7
    ],
    "portraitAge": 40,
    "st": [
      88,
      70,
      82,
      74
    ],
    "sk": {
      "ops": 3,
      "nav": 3,
      "ship": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2,
      "13": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "티베트 출신의 물 운반꾼. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "tb04",
    "id": "steppe_tb04",
    "name": "도르제 타시",
    "nat": "TB",
    "natName": "티베트",
    "steppeRegion": "TB",
    "style": "st",
    "home": 139,
    "zone": "steppe_TB",
    "reg": [
      7
    ],
    "portraitAge": 45,
    "st": [
      91,
      77,
      87,
      76
    ],
    "sk": {
      "ops": 3,
      "sword": 3,
      "nav": 2,
      "speech": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "티베트 출신의 해도 길잡이. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "tb05",
    "id": "steppe_tb05",
    "name": "롭상 체펠",
    "nat": "TB",
    "natName": "티베트",
    "steppeRegion": "TB",
    "style": "st",
    "home": 139,
    "zone": "steppe_TB",
    "reg": [
      7
    ],
    "portraitAge": 31,
    "st": [
      94,
      84,
      92,
      78
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "sci": 2,
      "hist": 2,
      "ops": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "티베트 출신의 나침반 당직. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "tb06",
    "id": "steppe_tb06",
    "name": "니마 게렉",
    "nat": "TB",
    "natName": "티베트",
    "steppeRegion": "TB",
    "style": "st",
    "home": 139,
    "zone": "steppe_TB",
    "reg": [
      7
    ],
    "portraitAge": 29,
    "st": [
      97,
      71,
      81,
      80
    ],
    "sk": {
      "sword": 3,
      "shoot": 3,
      "ops": 2,
      "nav": 2,
      "med": 2,
      "speech": 2
    },
    "lg": {
      "9": 3,
      "7": 3,
      "6": 2,
      "5": 2,
      "13": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "티베트 출신의 보급 운반꾼. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mj01",
    "id": "steppe_mj01",
    "name": "하이란",
    "nat": "MJ",
    "natName": "만주",
    "steppeRegion": "MJ",
    "style": "cn",
    "home": 315,
    "zone": "steppe_MJ",
    "reg": [
      6,
      7
    ],
    "portraitAge": 30,
    "st": [
      86,
      78,
      86,
      82
    ],
    "sk": {
      "ship": 3,
      "craft": 3,
      "ops": 2,
      "nav": 2
    },
    "lg": {
      "13": 3,
      "7": 3,
      "9": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "만주 출신의 갑판 당직. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mj02",
    "id": "steppe_mj02",
    "name": "바얀투",
    "nat": "MJ",
    "natName": "만주",
    "steppeRegion": "MJ",
    "style": "cn",
    "home": 189,
    "zone": "steppe_MJ",
    "reg": [
      6,
      7
    ],
    "portraitAge": 33,
    "st": [
      89,
      85,
      91,
      84
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "speech": 2,
      "acct": 2,
      "hist": 2,
      "sci": 2
    },
    "lg": {
      "13": 3,
      "7": 3,
      "9": 2,
      "14": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "만주 출신의 노잡이. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mj03",
    "id": "steppe_mj03",
    "name": "아르간",
    "nat": "MJ",
    "natName": "만주",
    "steppeRegion": "MJ",
    "style": "cn",
    "home": 312,
    "zone": "steppe_MJ",
    "reg": [
      6,
      7
    ],
    "portraitAge": 27,
    "st": [
      92,
      72,
      80,
      86
    ],
    "sk": {
      "cook": 3,
      "med": 3,
      "nav": 2
    },
    "lg": {
      "13": 3,
      "7": 3,
      "9": 2,
      "14": 2,
      "6": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "만주 출신의 돛 수선공. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mj04",
    "id": "steppe_mj04",
    "name": "무쿠리",
    "nat": "MJ",
    "natName": "만주",
    "steppeRegion": "MJ",
    "style": "cn",
    "home": 313,
    "zone": "steppe_MJ",
    "reg": [
      6,
      7
    ],
    "portraitAge": 39,
    "st": [
      95,
      79,
      85,
      88
    ],
    "sk": {
      "ops": 3,
      "ship": 3,
      "craft": 2,
      "sword": 2
    },
    "lg": {
      "13": 3,
      "7": 3,
      "9": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "만주 출신의 키잡이. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mj05",
    "id": "steppe_mj05",
    "name": "토르곤",
    "nat": "MJ",
    "natName": "만주",
    "steppeRegion": "MJ",
    "style": "cn",
    "home": 314,
    "zone": "steppe_MJ",
    "reg": [
      6,
      7
    ],
    "portraitAge": 35,
    "st": [
      84,
      86,
      90,
      90
    ],
    "sk": {
      "nav": 3,
      "sci": 3,
      "survey": 2,
      "art": 2,
      "speech": 2
    },
    "lg": {
      "13": 3,
      "7": 3,
      "9": 2,
      "14": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "만주 출신의 호송대 경비. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  },
  {
    "no": "mj06",
    "id": "steppe_mj06",
    "name": "수오린",
    "nat": "MJ",
    "natName": "만주",
    "steppeRegion": "MJ",
    "style": "cn",
    "home": 315,
    "zone": "steppe_MJ",
    "reg": [
      6,
      7
    ],
    "portraitAge": 32,
    "st": [
      87,
      73,
      79,
      73
    ],
    "sk": {
      "speech": 3,
      "music": 3,
      "acct": 2,
      "nav": 2,
      "ops": 2,
      "cook": 2
    },
    "lg": {
      "13": 3,
      "7": 3,
      "9": 2,
      "14": 2,
      "6": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "만주 출신의 갑판 작업장. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다."
  }
];
  crew.forEach(function (m) {
    m.steppeRotation = true; m.face = 'portraits/mates/steppe-windsalt/' + m.no; m.halfKey = m.face + '_half';
    m.g = 'm'; m.role = 'sailor'; m.typeName = '초원 철새 항해사'; m.y = [0, 9999]; m.skBoost = 1;
    G.MATES.push(m); G.MATE[m.id] = m; G.MATE_RANGE[m.id] = { zones: [m.zone], home: m.home };
    byRegion[m.steppeRegion].push(m.id);
  });
  Object.keys(byRegion).forEach(function (key) {
    groups[key] = G.DiscoveryCrew.create(byRegion[key], 'steppeCrew', 'steppeCrew_' + key, key);
  });
  G.SteppeCrew = {
    ids: crew.map(function (m) { return m.id; }), groups: groups,
    active: function (id, year, seed) {
      var m = G.MATE[id], group = m && groups[m.steppeRegion];
      return !!(group && group.active(id, year, seed));
    },
    rememberDiscovery: function (id) {
      Object.keys(groups).forEach(function (key) { if (cfg.groups[key].gates.indexOf(id) >= 0) groups[key].rememberDiscovery(); });
    },
    periodText: function (id, year) {
      var m = G.MATE[id], group = groups[id] || (m && groups[m.steppeRegion]);
      return group ? group.periodText(year) : '지역별 발견물을 직접 하나 이상 발견한 날부터 ' + cfg.years + '년마다 최대 ' + cfg.count + '명 · 미고용 후보 순환 · ' + cfg.cycle + '년마다 재추첨';
    }
  };
})(window.G = window.G || {});
