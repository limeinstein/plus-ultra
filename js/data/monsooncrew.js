/* 계절풍의 여성 항해사 30명. 인도항로 발견일부터 5년마다 3명, 40년마다 다시 섞는다.
   얼굴·복식 참고는 tools/indian_ocean_windsalt_20261116_prompts.json. 국가는 지리적 출신 표기다. */
(function (G) {
  'use strict';
  var U = G.U, cfg = G.BALANCE.monsoonCrew;
  G.MATE_ZONES.monsoon_india = {"name": "인도 해안", "ids": [148, 150, 151, 152, 154, 157]};
  G.MATE_ZONES.monsoon_srilanka = {"name": "스리랑카", "ids": [155]};
  G.MATE_ZONES.monsoon_bengal = {"name": "벵골만", "ids": [157]};
  G.MATE_ZONES.monsoon_west = {"name": "인도양 서부", "ids": [148, 125]};
  G.MATE_ZONES.monsoon_islands = {"name": "인도양 섬 항로", "ids": [155, 154, 152]};
  G.MATE_ZONES.monsoon_oman = {"name": "오만", "ids": [125]};
  G.MATE_ZONES.monsoon_sumatra = {"name": "수마트라 인도양 항로", "ids": [166]};
  var crew = [
  {
    "no": "io01",
    "id": "monsoon_io01",
    "name": "아나야 데사이",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 152,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 29,
    "st": [
      66,
      80,
      76,
      86
    ],
    "sk": {
      "nav": 3,
      "ops": 3,
      "survey": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "인도 출신의 돛줄 항해사. 바람을 받는 줄을 잡고 해도를 챙긴다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io02",
    "id": "monsoon_io02",
    "name": "미라 나이르",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 154,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 28,
    "st": [
      71,
      83,
      83,
      88
    ],
    "sk": {
      "nav": 3,
      "speech": 3,
      "survey": 2,
      "sci": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "인도 출신의 해안 안내인. 돌아보며 뒤따르는 동료를 확인한다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io03",
    "id": "monsoon_io03",
    "name": "카비야 라오",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 150,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 31,
    "st": [
      76,
      86,
      90,
      90
    ],
    "sk": {
      "nav": 3,
      "sci": 3,
      "survey": 2,
      "hist": 2,
      "ops": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2,
      "3": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "인도 출신의 나침반지기. 나침반 바늘을 가리고 방위를 읽는다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io04",
    "id": "monsoon_io04",
    "name": "리야 센",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 154,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 27,
    "st": [
      81,
      89,
      82,
      92
    ],
    "sk": {
      "art": 3,
      "hist": 3,
      "nav": 2,
      "speech": 2,
      "acct": 2,
      "music": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "인도 출신의 해도 기록관. 잠깐 앉아 다음 항로를 생각한다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io05",
    "id": "monsoon_io05",
    "name": "이샤니 아이어",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 154,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 34,
    "st": [
      68,
      92,
      89,
      94
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "sci": 2,
      "ops": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "인도 출신의 측량 항해사. 젖은 해도를 펼쳐 얕은 여울을 가른다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io06",
    "id": "monsoon_io06",
    "name": "타라 바르마",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 152,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 30,
    "st": [
      73,
      82,
      81,
      86
    ],
    "sk": {
      "ops": 3,
      "nav": 3,
      "speech": 2,
      "music": 2,
      "sword": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2,
      "3": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "인도 출신의 신호수. 먼 수평선을 가리키며 방향을 알린다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io07",
    "id": "monsoon_io07",
    "name": "릴라 메논",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 150,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 32,
    "st": [
      78,
      85,
      88,
      88
    ],
    "sk": {
      "speech": 3,
      "med": 3,
      "nav": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "인도 출신의 항로 상담역. 턱을 괴고 바뀌는 물길을 헤아린다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io08",
    "id": "monsoon_io08",
    "name": "데비카 셰티",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 150,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 26,
    "st": [
      83,
      88,
      80,
      90
    ],
    "sk": {
      "craft": 3,
      "ship": 3,
      "ops": 2,
      "nav": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "인도 출신의 매듭 기술자. 무릎을 굽혀 매듭을 단단히 묶는다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io09",
    "id": "monsoon_io09",
    "name": "난디니 파텔",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 152,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 35,
    "st": [
      70,
      91,
      87,
      92
    ],
    "sk": {
      "nav": 3,
      "ops": 3,
      "sword": 2,
      "shoot": 2,
      "med": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2,
      "3": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "인도 출신의 야간 당직장. 등불을 들고 당직 구역을 살핀다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io10",
    "id": "monsoon_io10",
    "name": "바수다 카푸르",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 154,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 28,
    "st": [
      75,
      81,
      79,
      94
    ],
    "sk": {
      "speech": 3,
      "acct": 3,
      "nav": 2,
      "music": 2,
      "art": 2,
      "cook": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "인도 출신의 갑판의 교섭가. 웃으며 다가오는 동료를 맞는다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io11",
    "id": "monsoon_io11",
    "name": "산자나 레디",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 157,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 33,
    "st": [
      80,
      84,
      86,
      86
    ],
    "sk": {
      "nav": 3,
      "ops": 3,
      "survey": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "인도 출신의 호위 항해사. 칼집을 짚고 갑판의 질서를 지킨다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io12",
    "id": "monsoon_io12",
    "name": "푸자 말호트라",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 148,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 29,
    "st": [
      67,
      87,
      78,
      88
    ],
    "sk": {
      "nav": 3,
      "speech": 3,
      "survey": 2,
      "sci": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2,
      "3": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "인도 출신의 급수 당직장. 목마른 동료에게 물 한 잔을 건넨다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io13",
    "id": "monsoon_io13",
    "name": "비디야 조시",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 150,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 27,
    "st": [
      72,
      90,
      85,
      90
    ],
    "sk": {
      "nav": 3,
      "sci": 3,
      "survey": 2,
      "hist": 2,
      "ops": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "인도 출신의 해도 전달수. 머리카락을 넘기고 해도 두루마리를 챙긴다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io14",
    "id": "monsoon_io14",
    "name": "키란 바트",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 154,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 36,
    "st": [
      77,
      80,
      77,
      92
    ],
    "sk": {
      "art": 3,
      "hist": 3,
      "nav": 2,
      "speech": 2,
      "acct": 2,
      "music": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "인도 출신의 조타수. 키를 잡고 물살에 맞춰 배를 돌린다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io15",
    "id": "monsoon_io15",
    "name": "아니카 샤르마",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 152,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 25,
    "st": [
      82,
      83,
      84,
      94
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "sci": 2,
      "ops": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2,
      "3": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "인도 출신의 돛 관리인. 젖은 돛감을 어깨에 메고 옮긴다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io16",
    "id": "monsoon_io16",
    "name": "파드마 쿨카르니",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 154,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 30,
    "st": [
      69,
      86,
      76,
      86
    ],
    "sk": {
      "ops": 3,
      "nav": 3,
      "speech": 2,
      "music": 2,
      "sword": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "인도 출신의 갑판 부관. 차분히 팔짱을 끼고 동료의 말을 듣는다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io17",
    "id": "monsoon_io17",
    "name": "암비카 다스",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 157,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 28,
    "st": [
      74,
      89,
      83,
      88
    ],
    "sk": {
      "speech": 3,
      "med": 3,
      "nav": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "인도 출신의 수심 측량사. 측심줄의 무게추로 수심을 잰다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io18",
    "id": "monsoon_io18",
    "name": "슈레야 굽타",
    "nat": "IN",
    "natName": "인도",
    "style": "in",
    "home": 148,
    "zone": "monsoon_india",
    "reg": [
      5
    ],
    "portraitAge": 32,
    "st": [
      79,
      92,
      90,
      90
    ],
    "sk": {
      "craft": 3,
      "ship": 3,
      "ops": 2,
      "nav": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2,
      "3": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "인도 출신의 휴식 당직장. 통에 걸터앉아 당직 뒤 숨을 고른다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io19",
    "id": "monsoon_io19",
    "name": "아말리 페레라",
    "nat": "LK",
    "natName": "스리랑카",
    "style": "in",
    "home": 155,
    "zone": "monsoon_srilanka",
    "reg": [
      5
    ],
    "portraitAge": 29,
    "st": [
      66,
      82,
      82,
      92
    ],
    "sk": {
      "nav": 3,
      "ops": 3,
      "sword": 2,
      "shoot": 2,
      "med": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "스리랑카 출신의 밧줄 감정사. 줄의 상한 결을 찾아 손본다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io20",
    "id": "monsoon_io20",
    "name": "네트미 실바",
    "nat": "LK",
    "natName": "스리랑카",
    "style": "in",
    "home": 155,
    "zone": "monsoon_srilanka",
    "reg": [
      5
    ],
    "portraitAge": 26,
    "st": [
      71,
      85,
      89,
      94
    ],
    "sk": {
      "speech": 3,
      "acct": 3,
      "nav": 2,
      "music": 2,
      "art": 2,
      "cook": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "스리랑카 출신의 항해 일지 기록관. 항해 일지에 새로운 물길을 적는다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io21",
    "id": "monsoon_io21",
    "name": "카빈디 자야싱헤",
    "nat": "LK",
    "natName": "스리랑카",
    "style": "in",
    "home": 155,
    "zone": "monsoon_srilanka",
    "reg": [
      5
    ],
    "portraitAge": 34,
    "st": [
      76,
      88,
      81,
      86
    ],
    "sk": {
      "nav": 3,
      "ops": 3,
      "survey": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2,
      "3": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "스리랑카 출신의 별자리 항해사. 별과 측정판의 각도를 맞춘다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io22",
    "id": "monsoon_io22",
    "name": "타루시 라나싱헤",
    "nat": "LK",
    "natName": "스리랑카",
    "style": "in",
    "home": 155,
    "zone": "monsoon_srilanka",
    "reg": [
      5
    ],
    "portraitAge": 31,
    "st": [
      81,
      91,
      88,
      88
    ],
    "sk": {
      "nav": 3,
      "speech": 3,
      "survey": 2,
      "sci": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "스리랑카 출신의 돛줄 당직장. 몸을 틀어 힘차게 돛줄을 당긴다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io23",
    "id": "monsoon_io23",
    "name": "누스라트 라만",
    "nat": "BD",
    "natName": "방글라데시",
    "style": "in",
    "home": 157,
    "zone": "monsoon_bengal",
    "reg": [
      5
    ],
    "portraitAge": 29,
    "st": [
      68,
      81,
      80,
      90
    ],
    "sk": {
      "nav": 3,
      "sci": 3,
      "survey": 2,
      "hist": 2,
      "ops": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "방글라데시 출신의 돛 수선공. 젖은 돛천을 접고 찢어진 가장자리를 찾는다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io24",
    "id": "monsoon_io24",
    "name": "파르자나 하산",
    "nat": "BD",
    "natName": "방글라데시",
    "style": "in",
    "home": 157,
    "zone": "monsoon_bengal",
    "reg": [
      5
    ],
    "portraitAge": 27,
    "st": [
      73,
      84,
      87,
      92
    ],
    "sk": {
      "art": 3,
      "hist": 3,
      "nav": 2,
      "speech": 2,
      "acct": 2,
      "music": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2,
      "3": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "방글라데시 출신의 신호 항해사. 천을 흔들어 다음 선박에 신호를 보낸다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io25",
    "id": "monsoon_io25",
    "name": "자라 발로치",
    "nat": "PK",
    "natName": "파키스탄",
    "style": "in",
    "home": 148,
    "zone": "monsoon_west",
    "reg": [
      5
    ],
    "portraitAge": 33,
    "st": [
      78,
      87,
      79,
      94
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "sci": 2,
      "ops": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "파키스탄 출신의 선단 호위병. 칼을 낮게 받치고 위험한 뱃길을 지킨다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io26",
    "id": "monsoon_io26",
    "name": "마히라 사이드",
    "nat": "PK",
    "natName": "파키스탄",
    "style": "in",
    "home": 148,
    "zone": "monsoon_west",
    "reg": [
      5
    ],
    "portraitAge": 30,
    "st": [
      83,
      90,
      86,
      86
    ],
    "sk": {
      "ops": 3,
      "nav": 3,
      "speech": 2,
      "music": 2,
      "sword": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "파키스탄 출신의 망원경지기. 망원경으로 먼 배의 돛을 확인한다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io27",
    "id": "monsoon_io27",
    "name": "아이샤트 라티프",
    "nat": "MV",
    "natName": "몰디브",
    "style": "in",
    "home": 155,
    "zone": "monsoon_islands",
    "reg": [
      5
    ],
    "portraitAge": 28,
    "st": [
      70,
      80,
      78,
      88
    ],
    "sk": {
      "speech": 3,
      "med": 3,
      "nav": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2,
      "1": 2,
      "3": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "몰디브 출신의 갑판 기술자. 동료에게 줄뭉치를 던져 건넨다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io28",
    "id": "monsoon_io28",
    "name": "마리얌 이스마일",
    "nat": "MV",
    "natName": "몰디브",
    "style": "in",
    "home": 155,
    "zone": "monsoon_islands",
    "reg": [
      5
    ],
    "portraitAge": 32,
    "st": [
      75,
      83,
      85,
      90
    ],
    "sk": {
      "craft": 3,
      "ship": 3,
      "ops": 2,
      "nav": 2
    },
    "lg": {
      "8": 3,
      "5": 3,
      "6": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "몰디브 출신의 선창 관리인. 바구니 속 항해 도구를 챙긴다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io29",
    "id": "monsoon_io29",
    "name": "라일라 알하르시",
    "nat": "OM",
    "natName": "오만",
    "style": "is",
    "home": 125,
    "zone": "monsoon_oman",
    "reg": [
      4
    ],
    "portraitAge": 35,
    "st": [
      80,
      86,
      77,
      92
    ],
    "sk": {
      "nav": 3,
      "ops": 3,
      "sword": 2,
      "shoot": 2,
      "med": 2
    },
    "lg": {
      "5": 3,
      "8": 3,
      "6": 2,
      "1": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "오만 출신의 인도양 키잡이. 작은 해도를 짚고 키를 움직인다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  },
  {
    "no": "io30",
    "id": "monsoon_io30",
    "name": "라트나 사리",
    "nat": "ID",
    "natName": "인도네시아",
    "style": "se",
    "home": 166,
    "zone": "monsoon_sumatra",
    "reg": [
      8
    ],
    "portraitAge": 29,
    "st": [
      67,
      89,
      84,
      94
    ],
    "sk": {
      "speech": 3,
      "acct": 3,
      "nav": 2,
      "music": 2,
      "art": 2,
      "cook": 2
    },
    "lg": {
      "12": 3,
      "8": 3,
      "5": 2,
      "1": 2,
      "3": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "인도네시아 출신의 돛 수선 항해사. 무릎을 굽혀 돛천에 바느질을 한다. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다."
  }
];
  var ids = crew.map(function (m) { return m.id; });
  crew.forEach(function (m) {
    m.monsoonRotation = true;
    m.face = 'portraits/mates/indian-ocean-windsalt/' + m.no; m.halfKey = m.face + '_half';
    m.g = 'f'; m.role = 'sailor'; m.typeName = '항해사'; m.y = [0, 9999]; m.skBoost = 1;
    G.MATES.push(m); G.MATE[m.id] = m; G.MATE_RANGE[m.id] = { zones: [m.zone], home: m.home };
  });
  G.MonsoonCrew = G.DiscoveryCrew.create(ids, 'monsoonCrew', 'monsoonCrew');
})(window.G = window.G || {});
