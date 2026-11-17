/* 아프리카 흑인 남성 항해사 30명. 희망봉 발견일부터 5년마다 3명·40년마다 재추첨.
   초상·국적·포즈는 tools/african_windsalt_20261116_assets.json에서 이어 받는다. */
(function (G) {
  'use strict';
  G.MATE_ZONES.afcrew_senegal = {"name": "세네갈 해안", "ids": [90, 91]};
  G.MATE_ZONES.afcrew_mali = {"name": "말리의 서아프리카 항로", "ids": [90, 91]};
  G.MATE_ZONES.afcrew_ghana = {"name": "기니만 서부", "ids": [97, 91]};
  G.MATE_ZONES.afcrew_nigeria = {"name": "기니만 동부", "ids": [97, 99]};
  G.MATE_ZONES.afcrew_congo = {"name": "콩고 강 하구 항로", "ids": [99, 100]};
  G.MATE_ZONES.afcrew_angola = {"name": "앙골라 해안", "ids": [100, 99]};
  G.MATE_ZONES.afcrew_tanzania = {"name": "탄자니아 해안", "ids": [105, 106]};
  G.MATE_ZONES.afcrew_kenya = {"name": "케냐 해안", "ids": [107, 108]};
  G.MATE_ZONES.afcrew_mozambique = {"name": "모잠비크 해안", "ids": [102, 103]};
  G.MATE_ZONES.afcrew_ethiopia = {"name": "아프리카 북동부 해안 항로", "ids": [109, 108]};
  var crew = [
  {
    "no": "af01",
    "id": "afcrew_af01",
    "name": "마마두 은다오",
    "nat": "SN",
    "natName": "세네갈",
    "style": "af",
    "home": 90,
    "zone": "afcrew_senegal",
    "reg": [
      3
    ],
    "portraitAge": 38,
    "blackAfrican": true,
    "st": [
      88,
      70,
      78,
      74
    ],
    "sk": {
      "ops": 3,
      "nav": 3,
      "ship": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "세네갈 출신의 바람과 소금 항해사. 돛줄을 당기며 뒤돌아보기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af02",
    "id": "afcrew_af02",
    "name": "말리크 사르",
    "nat": "SN",
    "natName": "세네갈",
    "style": "af",
    "home": 91,
    "zone": "afcrew_senegal",
    "reg": [
      3
    ],
    "portraitAge": 29,
    "blackAfrican": true,
    "st": [
      91,
      77,
      83,
      76
    ],
    "sk": {
      "ops": 3,
      "craft": 3,
      "nav": 2,
      "speech": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "세네갈 출신의 바람과 소금 항해사. 젖은 밧줄을 들어 올리기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af03",
    "id": "afcrew_af03",
    "name": "아마두 디옵",
    "nat": "SN",
    "natName": "세네갈",
    "style": "af",
    "home": 90,
    "zone": "afcrew_senegal",
    "reg": [
      3
    ],
    "portraitAge": 34,
    "blackAfrican": true,
    "st": [
      94,
      84,
      88,
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
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2,
      "8": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "세네갈 출신의 바람과 소금 항해사. 팔짱을 끼고 당직 살피기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af04",
    "id": "afcrew_af04",
    "name": "바카리 트라오레",
    "nat": "ML",
    "natName": "말리",
    "style": "af",
    "home": 91,
    "zone": "afcrew_mali",
    "reg": [
      3
    ],
    "portraitAge": 32,
    "blackAfrican": true,
    "st": [
      97,
      72,
      79,
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
      "10": 3,
      "5": 3,
      "1": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "말리 출신의 바람과 소금 항해사. 당직 뒤 어깨 풀기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af05",
    "id": "afcrew_af05",
    "name": "세쿠 디아라",
    "nat": "ML",
    "natName": "말리",
    "style": "af",
    "home": 90,
    "zone": "afcrew_mali",
    "reg": [
      3
    ],
    "portraitAge": 28,
    "blackAfrican": true,
    "st": [
      90,
      79,
      84,
      82
    ],
    "sk": {
      "ship": 3,
      "craft": 3,
      "ops": 2,
      "nav": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "말리 출신의 바람과 소금 항해사. 닻을 올리며 환호하기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af06",
    "id": "afcrew_af06",
    "name": "무사 쿨리발리",
    "nat": "ML",
    "natName": "말리",
    "style": "af",
    "home": 91,
    "zone": "afcrew_mali",
    "reg": [
      3
    ],
    "portraitAge": 36,
    "blackAfrican": true,
    "st": [
      93,
      86,
      89,
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
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2,
      "8": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "말리 출신의 바람과 소금 항해사. 돌아보며 물길 가리키기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af07",
    "id": "afcrew_af07",
    "name": "코피 멘사",
    "nat": "GH",
    "natName": "가나",
    "style": "af",
    "home": 97,
    "zone": "afcrew_ghana",
    "reg": [
      3
    ],
    "portraitAge": 41,
    "blackAfrican": true,
    "st": [
      96,
      74,
      80,
      86
    ],
    "sk": {
      "cook": 3,
      "med": 3,
      "nav": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "가나 출신의 바람과 소금 항해사. 노를 비스듬히 받치기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af08",
    "id": "afcrew_af08",
    "name": "콰메 오우수",
    "nat": "GH",
    "natName": "가나",
    "style": "af",
    "home": 91,
    "zone": "afcrew_ghana",
    "reg": [
      3
    ],
    "portraitAge": 30,
    "blackAfrican": true,
    "st": [
      89,
      81,
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
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "가나 출신의 바람과 소금 항해사. 닻걸이 막대 밀기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af09",
    "id": "afcrew_af09",
    "name": "야오 아산테",
    "nat": "GH",
    "natName": "가나",
    "style": "af",
    "home": 97,
    "zone": "afcrew_ghana",
    "reg": [
      3
    ],
    "portraitAge": 35,
    "blackAfrican": true,
    "st": [
      92,
      88,
      90,
      74
    ],
    "sk": {
      "nav": 3,
      "sci": 3,
      "survey": 2,
      "art": 2,
      "speech": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2,
      "8": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "가나 출신의 바람과 소금 항해사. 항로를 생각하며 턱 짚기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af10",
    "id": "afcrew_af10",
    "name": "툰데 아데예미",
    "nat": "NG",
    "natName": "나이지리아",
    "style": "af",
    "home": 99,
    "zone": "afcrew_nigeria",
    "reg": [
      3
    ],
    "portraitAge": 31,
    "blackAfrican": true,
    "st": [
      95,
      76,
      81,
      76
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
      "10": 3,
      "5": 3,
      "1": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "나이지리아 출신의 바람과 소금 항해사. 나무 상자에 앉아 휴식하기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af11",
    "id": "afcrew_af11",
    "name": "치디 오카포르",
    "nat": "NG",
    "natName": "나이지리아",
    "style": "af",
    "home": 97,
    "zone": "afcrew_nigeria",
    "reg": [
      3
    ],
    "portraitAge": 43,
    "blackAfrican": true,
    "st": [
      88,
      83,
      86,
      78
    ],
    "sk": {
      "ops": 3,
      "nav": 3,
      "ship": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "나이지리아 출신의 바람과 소금 항해사. 말아 둔 돛천 운반하기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af12",
    "id": "afcrew_af12",
    "name": "이브라힘 발로군",
    "nat": "NG",
    "natName": "나이지리아",
    "style": "af",
    "home": 99,
    "zone": "afcrew_nigeria",
    "reg": [
      3
    ],
    "portraitAge": 46,
    "blackAfrican": true,
    "st": [
      91,
      71,
      91,
      80
    ],
    "sk": {
      "ops": 3,
      "craft": 3,
      "nav": 2,
      "speech": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2,
      "8": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "나이지리아 출신의 바람과 소금 항해사. 옷깃을 정돈하며 대화하기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af13",
    "id": "afcrew_af13",
    "name": "음펨바 은쿠루",
    "nat": "CD",
    "natName": "콩고민주공화국",
    "style": "af",
    "home": 99,
    "zone": "afcrew_congo",
    "reg": [
      3
    ],
    "portraitAge": 39,
    "blackAfrican": true,
    "st": [
      94,
      78,
      82,
      82
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "sci": 2,
      "hist": 2,
      "ops": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "콩고민주공화국 출신의 바람과 소금 항해사. 젖은 천을 비틀어 짜기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af14",
    "id": "afcrew_af14",
    "name": "루켄가 마부카",
    "nat": "CD",
    "natName": "콩고민주공화국",
    "style": "af",
    "home": 100,
    "zone": "afcrew_congo",
    "reg": [
      3
    ],
    "portraitAge": 35,
    "blackAfrican": true,
    "st": [
      97,
      85,
      87,
      84
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
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "콩고민주공화국 출신의 바람과 소금 항해사. 먼 배에 손 흔들기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af15",
    "id": "afcrew_af15",
    "name": "키알라 음반자",
    "nat": "CD",
    "natName": "콩고민주공화국",
    "style": "af",
    "home": 99,
    "zone": "afcrew_congo",
    "reg": [
      3
    ],
    "portraitAge": 49,
    "blackAfrican": true,
    "st": [
      90,
      73,
      78,
      86
    ],
    "sk": {
      "ship": 3,
      "craft": 3,
      "ops": 2,
      "nav": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2,
      "8": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "콩고민주공화국 출신의 바람과 소금 항해사. 무거운 닻줄 끌어 올리기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af16",
    "id": "afcrew_af16",
    "name": "앙고마 은종고",
    "nat": "AO",
    "natName": "앙골라",
    "style": "af",
    "home": 99,
    "zone": "afcrew_angola",
    "reg": [
      3
    ],
    "portraitAge": 42,
    "blackAfrican": true,
    "st": [
      93,
      80,
      83,
      88
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
      "10": 3,
      "5": 3,
      "1": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "앙골라 출신의 바람과 소금 항해사. 폭풍 속 동료에게 구령하기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af17",
    "id": "afcrew_af17",
    "name": "키상가 루캄바",
    "nat": "AO",
    "natName": "앙골라",
    "style": "af",
    "home": 100,
    "zone": "afcrew_angola",
    "reg": [
      3
    ],
    "portraitAge": 27,
    "blackAfrican": true,
    "st": [
      96,
      87,
      88,
      74
    ],
    "sk": {
      "cook": 3,
      "med": 3,
      "nav": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "앙골라 출신의 바람과 소금 항해사. 팔에 물을 부어 소금 씻기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af18",
    "id": "afcrew_af18",
    "name": "마누엘 무콘다",
    "nat": "AO",
    "natName": "앙골라",
    "style": "af",
    "home": 99,
    "zone": "afcrew_angola",
    "reg": [
      3
    ],
    "portraitAge": 29,
    "blackAfrican": true,
    "st": [
      89,
      75,
      79,
      76
    ],
    "sk": {
      "ops": 3,
      "ship": 3,
      "craft": 2,
      "sword": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2,
      "8": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "앙골라 출신의 바람과 소금 항해사. 닻줄 고리를 감아 정리하기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af19",
    "id": "afcrew_af19",
    "name": "하미시 바카리",
    "nat": "TZ",
    "natName": "탄자니아",
    "style": "af",
    "home": 105,
    "zone": "afcrew_tanzania",
    "reg": [
      3
    ],
    "portraitAge": 33,
    "blackAfrican": true,
    "st": [
      92,
      82,
      84,
      78
    ],
    "sk": {
      "nav": 3,
      "sci": 3,
      "survey": 2,
      "art": 2,
      "speech": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "탄자니아 출신의 바람과 소금 항해사. 나침반과 해도 대조하기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af20",
    "id": "afcrew_af20",
    "name": "살림 음완가",
    "nat": "TZ",
    "natName": "탄자니아",
    "style": "af",
    "home": 106,
    "zone": "afcrew_tanzania",
    "reg": [
      3
    ],
    "portraitAge": 37,
    "blackAfrican": true,
    "st": [
      95,
      70,
      89,
      80
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
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "탄자니아 출신의 바람과 소금 항해사. 밧줄 꾸러미 메고 걷기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af21",
    "id": "afcrew_af21",
    "name": "주마 음바루크",
    "nat": "TZ",
    "natName": "탄자니아",
    "style": "af",
    "home": 105,
    "zone": "afcrew_tanzania",
    "reg": [
      3
    ],
    "portraitAge": 47,
    "blackAfrican": true,
    "st": [
      88,
      77,
      80,
      82
    ],
    "sk": {
      "ops": 3,
      "nav": 3,
      "ship": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2,
      "8": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "탄자니아 출신의 바람과 소금 항해사. 갈고리 장대로 배를 밀기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af22",
    "id": "afcrew_af22",
    "name": "오마리 키부야",
    "nat": "KE",
    "natName": "케냐",
    "style": "af",
    "home": 108,
    "zone": "afcrew_kenya",
    "reg": [
      3
    ],
    "portraitAge": 28,
    "blackAfrican": true,
    "st": [
      91,
      84,
      85,
      84
    ],
    "sk": {
      "ops": 3,
      "craft": 3,
      "nav": 2,
      "speech": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "케냐 출신의 바람과 소금 항해사. 난간에 기대어 수평선 보기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af23",
    "id": "afcrew_af23",
    "name": "바라카 음와카",
    "nat": "KE",
    "natName": "케냐",
    "style": "af",
    "home": 107,
    "zone": "afcrew_kenya",
    "reg": [
      3
    ],
    "portraitAge": 26,
    "blackAfrican": true,
    "st": [
      94,
      72,
      90,
      86
    ],
    "sk": {
      "nav": 3,
      "survey": 3,
      "sci": 2,
      "hist": 2,
      "ops": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "케냐 출신의 바람과 소금 항해사. 동료를 두 팔 벌려 맞이하기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af24",
    "id": "afcrew_af24",
    "name": "이디 하산",
    "nat": "KE",
    "natName": "케냐",
    "style": "af",
    "home": 108,
    "zone": "afcrew_kenya",
    "reg": [
      3
    ],
    "portraitAge": 30,
    "blackAfrican": true,
    "st": [
      97,
      79,
      81,
      88
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
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2,
      "8": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "케냐 출신의 바람과 소금 항해사. 물동이를 허리에 받쳐 들기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af25",
    "id": "afcrew_af25",
    "name": "파리드 마칸데",
    "nat": "MZ",
    "natName": "모잠비크",
    "style": "af",
    "home": 102,
    "zone": "afcrew_mozambique",
    "reg": [
      3
    ],
    "portraitAge": 36,
    "blackAfrican": true,
    "st": [
      90,
      86,
      86,
      74
    ],
    "sk": {
      "ship": 3,
      "craft": 3,
      "ops": 2,
      "nav": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2
    },
    "fame": 300,
    "wage": 85,
    "desc": "모잠비크 출신의 바람과 소금 항해사. 돛천을 펼쳐 찢어진 곳 찾기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af26",
    "id": "afcrew_af26",
    "name": "사무엘 은코모",
    "nat": "MZ",
    "natName": "모잠비크",
    "style": "af",
    "home": 103,
    "zone": "afcrew_mozambique",
    "reg": [
      3
    ],
    "portraitAge": 44,
    "blackAfrican": true,
    "st": [
      93,
      74,
      91,
      76
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
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2
    },
    "fame": 400,
    "wage": 90,
    "desc": "모잠비크 출신의 바람과 소금 항해사. 나무 도르래 수선하기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af27",
    "id": "afcrew_af27",
    "name": "자카리아 음반데",
    "nat": "MZ",
    "natName": "모잠비크",
    "style": "af",
    "home": 102,
    "zone": "afcrew_mozambique",
    "reg": [
      3
    ],
    "portraitAge": 40,
    "blackAfrican": true,
    "st": [
      96,
      81,
      82,
      78
    ],
    "sk": {
      "cook": 3,
      "med": 3,
      "nav": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2,
      "8": 2
    },
    "fame": 500,
    "wage": 95,
    "desc": "모잠비크 출신의 바람과 소금 항해사. 두 팔을 올려 등 펴기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af28",
    "id": "afcrew_af28",
    "name": "테스파이 베켈레",
    "nat": "ET",
    "natName": "에티오피아",
    "style": "af",
    "home": 108,
    "zone": "afcrew_ethiopia",
    "reg": [
      3
    ],
    "portraitAge": 45,
    "blackAfrican": true,
    "st": [
      89,
      88,
      87,
      80
    ],
    "sk": {
      "ops": 3,
      "ship": 3,
      "craft": 2,
      "sword": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2
    },
    "fame": 600,
    "wage": 100,
    "desc": "에티오피아 출신의 바람과 소금 항해사. 해도를 들고 항로 설명하기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af29",
    "id": "afcrew_af29",
    "name": "다위트 아바테",
    "nat": "ET",
    "natName": "에티오피아",
    "style": "af",
    "home": 109,
    "zone": "afcrew_ethiopia",
    "reg": [
      3
    ],
    "portraitAge": 38,
    "blackAfrican": true,
    "st": [
      92,
      76,
      78,
      82
    ],
    "sk": {
      "nav": 3,
      "sci": 3,
      "survey": 2,
      "art": 2,
      "speech": 2
    },
    "lg": {
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2
    },
    "fame": 700,
    "wage": 105,
    "desc": "에티오피아 출신의 바람과 소금 항해사. 돛줄 매듭 고쳐 묶기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  },
  {
    "no": "af30",
    "id": "afcrew_af30",
    "name": "요나스 테클레",
    "nat": "ET",
    "natName": "에티오피아",
    "style": "af",
    "home": 108,
    "zone": "afcrew_ethiopia",
    "reg": [
      3
    ],
    "portraitAge": 34,
    "blackAfrican": true,
    "st": [
      95,
      83,
      83,
      84
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
      "10": 3,
      "5": 3,
      "1": 2,
      "3": 2,
      "8": 2
    },
    "fame": 800,
    "wage": 110,
    "desc": "에티오피아 출신의 바람과 소금 항해사. 천을 여미며 바람 맞기 동작에 익숙하며 아프리카 해안의 바람과 물살을 읽는다."
  }
];
  var ids = crew.map(function (m) { return m.id; });
  crew.forEach(function (m) {
    m.africanRotation = true; m.face = 'portraits/mates/african-windsalt/' + m.no; m.halfKey = m.face + '_half';
    m.g = 'm'; m.role = 'sailor'; m.typeName = '항해사'; m.y = [0, 9999]; m.skBoost = 1;
    G.MATES.push(m); G.MATE[m.id] = m; G.MATE_RANGE[m.id] = { zones: [m.zone], home: m.home };
  });
  G.AfricanCrew = G.DiscoveryCrew.create(ids, 'africanCrew', 'africanCrew');
})(window.G = window.G || {});
