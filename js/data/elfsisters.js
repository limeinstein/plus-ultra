/* 엘프 자매 10쌍. 이름만 기존 작품에서 차용하며 자매 관계·인물 설정은 이 게임의 별도 설정이다. */
(function (G) {
  'use strict';
  var crew = [
  {
    "id": "elf_galadriel",
    "name": "갈라드리엘",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_arwen",
    "sisterRank": "언니",
    "sisterPair": "elf_sisters_01",
    "portraitAge": 32,
    "face": "portraits/mates/elf-sisters/galadriel",
    "halfKey": "portraits/mates/elf-sisters/galadriel_half",
    "home": 64,
    "reg": [
      1
    ],
    "st": [
      77,
      74,
      87,
      88
    ],
    "sk": {
      "sword": 3,
      "ops": 3,
      "nav": 2,
      "speech": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "금빛 바람 자매의 언니. 아르웬의 언니이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 검과 돛줄을 함께 다루며 거친 바람 앞에서 일행을 이끈다.",
    "nameOrigin": "톨킨의 가운데땅"
  },
  {
    "id": "elf_arwen",
    "name": "아르웬",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_galadriel",
    "sisterRank": "여동생",
    "sisterPair": "elf_sisters_01",
    "portraitAge": 27,
    "face": "portraits/mates/elf-sisters/arwen",
    "halfKey": "portraits/mates/elf-sisters/arwen_half",
    "home": 64,
    "reg": [
      1
    ],
    "st": [
      77,
      74,
      87,
      88
    ],
    "sk": {
      "sword": 3,
      "ops": 3,
      "nav": 2,
      "speech": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "금빛 바람 자매의 여동생. 갈라드리엘의 여동생이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 먼저 미소를 건네고, 뜻밖의 돌풍에도 침착하게 돛을 고른다.",
    "nameOrigin": "톨킨의 가운데땅"
  },
  {
    "id": "elf_celebrian",
    "name": "켈레브리안",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_luthien",
    "sisterRank": "언니",
    "sisterPair": "elf_sisters_02",
    "portraitAge": 32,
    "face": "portraits/mates/elf-sisters/celebrian",
    "halfKey": "portraits/mates/elf-sisters/celebrian_half",
    "home": 65,
    "reg": [
      1
    ],
    "st": [
      78,
      75,
      86,
      89
    ],
    "sk": {
      "sword": 3,
      "nav": 3,
      "survey": 2,
      "sci": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "은빛 달 자매의 언니. 루시엔의 언니이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 달과 별의 위치로 항로를 짚는 차분한 창전사다.",
    "nameOrigin": "톨킨의 가운데땅"
  },
  {
    "id": "elf_luthien",
    "name": "루시엔",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_celebrian",
    "sisterRank": "여동생",
    "sisterPair": "elf_sisters_02",
    "portraitAge": 27,
    "face": "portraits/mates/elf-sisters/luthien",
    "halfKey": "portraits/mates/elf-sisters/luthien_half",
    "home": 65,
    "reg": [
      1
    ],
    "st": [
      78,
      75,
      86,
      89
    ],
    "sk": {
      "sword": 3,
      "nav": 3,
      "survey": 2,
      "sci": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "은빛 달 자매의 여동생. 켈레브리안의 여동생이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 은빛 창끝으로 물결을 가리키며 새로운 항로를 찾는다.",
    "nameOrigin": "톨킨의 가운데땅"
  },
  {
    "id": "elf_idril",
    "name": "이드릴",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_nimrodel",
    "sisterRank": "언니",
    "sisterPair": "elf_sisters_03",
    "portraitAge": 32,
    "face": "portraits/mates/elf-sisters/idril",
    "halfKey": "portraits/mates/elf-sisters/idril_half",
    "home": 66,
    "reg": [
      1
    ],
    "st": [
      79,
      76,
      85,
      90
    ],
    "sk": {
      "sword": 3,
      "survey": 3,
      "nav": 2,
      "med": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "숲의 맹세 자매의 언니. 님로델의 언니이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 숲길의 흔적으로 길을 찾고 긴 활로 동료를 지킨다.",
    "nameOrigin": "톨킨의 가운데땅"
  },
  {
    "id": "elf_nimrodel",
    "name": "님로델",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_idril",
    "sisterRank": "여동생",
    "sisterPair": "elf_sisters_03",
    "portraitAge": 27,
    "face": "portraits/mates/elf-sisters/nimrodel",
    "halfKey": "portraits/mates/elf-sisters/nimrodel_half",
    "home": 66,
    "reg": [
      1
    ],
    "st": [
      79,
      76,
      85,
      90
    ],
    "sk": {
      "sword": 3,
      "survey": 3,
      "nav": 2,
      "med": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "숲의 맹세 자매의 여동생. 이드릴의 여동생이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 나뭇잎과 해류의 작은 변화를 빠르게 알아챈다.",
    "nameOrigin": "톨킨의 가운데땅"
  },
  {
    "id": "elf_aredhel",
    "name": "아레델",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_finduilas",
    "sisterRank": "언니",
    "sisterPair": "elf_sisters_04",
    "portraitAge": 32,
    "face": "portraits/mates/elf-sisters/aredhel",
    "halfKey": "portraits/mates/elf-sisters/aredhel_half",
    "home": 67,
    "reg": [
      1
    ],
    "st": [
      80,
      77,
      87,
      91
    ],
    "sk": {
      "sword": 3,
      "speech": 3,
      "music": 2,
      "craft": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "장미의 검 자매의 언니. 핀두일라스의 언니이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 예의 바른 말과 빈틈없는 세검 솜씨를 갖췄다.",
    "nameOrigin": "톨킨의 가운데땅"
  },
  {
    "id": "elf_finduilas",
    "name": "핀두일라스",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_aredhel",
    "sisterRank": "여동생",
    "sisterPair": "elf_sisters_04",
    "portraitAge": 27,
    "face": "portraits/mates/elf-sisters/finduilas",
    "halfKey": "portraits/mates/elf-sisters/finduilas_half",
    "home": 67,
    "reg": [
      1
    ],
    "st": [
      80,
      77,
      87,
      91
    ],
    "sk": {
      "sword": 3,
      "speech": 3,
      "music": 2,
      "craft": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "장미의 검 자매의 여동생. 아레델의 여동생이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 웃음 띤 눈으로 상대를 살피며 가볍고 빠르게 검을 쓴다.",
    "nameOrigin": "톨킨의 가운데땅"
  },
  {
    "id": "elf_alleria",
    "name": "알레리아",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_vereesa",
    "sisterRank": "언니",
    "sisterPair": "elf_sisters_05",
    "portraitAge": 32,
    "face": "portraits/mates/elf-sisters/alleria",
    "halfKey": "portraits/mates/elf-sisters/alleria_half",
    "home": 68,
    "reg": [
      1
    ],
    "st": [
      77,
      78,
      86,
      92
    ],
    "sk": {
      "sword": 3,
      "ops": 3,
      "nav": 2,
      "ship": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "황혼의 불꽃 자매의 언니. 베리사의 언니이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 쌍검을 쓰며 위험한 순간에는 누구보다 먼저 앞으로 나선다.",
    "nameOrigin": "워크래프트"
  },
  {
    "id": "elf_vereesa",
    "name": "베리사",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_alleria",
    "sisterRank": "여동생",
    "sisterPair": "elf_sisters_05",
    "portraitAge": 27,
    "face": "portraits/mates/elf-sisters/vereesa",
    "halfKey": "portraits/mates/elf-sisters/vereesa_half",
    "home": 68,
    "reg": [
      1
    ],
    "st": [
      77,
      78,
      86,
      92
    ],
    "sk": {
      "sword": 3,
      "ops": 3,
      "nav": 2,
      "ship": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "황혼의 불꽃 자매의 여동생. 알레리아의 여동생이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 기운찬 웃음과 재빠른 쌍검으로 동료들의 용기를 북돋운다.",
    "nameOrigin": "워크래프트"
  },
  {
    "id": "elf_tyrande",
    "name": "티란데",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_shandris",
    "sisterRank": "언니",
    "sisterPair": "elf_sisters_06",
    "portraitAge": 32,
    "face": "portraits/mates/elf-sisters/tyrande",
    "halfKey": "portraits/mates/elf-sisters/tyrande_half",
    "home": 64,
    "reg": [
      1
    ],
    "st": [
      78,
      74,
      85,
      93
    ],
    "sk": {
      "sword": 3,
      "ops": 2,
      "craft": 3,
      "cook": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "새벽의 날개 자매의 언니. 샨드리스의 언니이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 사람과 장비를 세심하게 챙기는 잎새검 전사다.",
    "nameOrigin": "워크래프트"
  },
  {
    "id": "elf_shandris",
    "name": "샨드리스",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_tyrande",
    "sisterRank": "여동생",
    "sisterPair": "elf_sisters_06",
    "portraitAge": 27,
    "face": "portraits/mates/elf-sisters/shandris",
    "halfKey": "portraits/mates/elf-sisters/shandris_half",
    "home": 64,
    "reg": [
      1
    ],
    "st": [
      78,
      74,
      85,
      93
    ],
    "sk": {
      "sword": 3,
      "ops": 2,
      "craft": 3,
      "cook": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "새벽의 날개 자매의 여동생. 티란데의 여동생이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 돛 수선과 요리를 즐기고 잎새검을 능숙하게 다룬다.",
    "nameOrigin": "워크래프트"
  },
  {
    "id": "elf_sylvanas",
    "name": "실바나스",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_maiev",
    "sisterRank": "언니",
    "sisterPair": "elf_sisters_07",
    "portraitAge": 32,
    "face": "portraits/mates/elf-sisters/sylvanas",
    "halfKey": "portraits/mates/elf-sisters/sylvanas_half",
    "home": 65,
    "reg": [
      1
    ],
    "st": [
      79,
      75,
      87,
      88
    ],
    "sk": {
      "sword": 3,
      "ops": 3,
      "survey": 2,
      "speech": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "검은 바람 자매의 언니. 마이에브의 언니이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 침착한 판단과 날카로운 곡도로 갑판의 질서를 지킨다.",
    "nameOrigin": "워크래프트"
  },
  {
    "id": "elf_maiev",
    "name": "마이에브",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_sylvanas",
    "sisterRank": "여동생",
    "sisterPair": "elf_sisters_07",
    "portraitAge": 27,
    "face": "portraits/mates/elf-sisters/maiev",
    "halfKey": "portraits/mates/elf-sisters/maiev_half",
    "home": 65,
    "reg": [
      1
    ],
    "st": [
      79,
      75,
      87,
      88
    ],
    "sk": {
      "sword": 3,
      "ops": 3,
      "survey": 2,
      "speech": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "검은 바람 자매의 여동생. 실바나스의 여동생이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 솔직한 말투와 과감한 움직임으로 위기를 돌파한다.",
    "nameOrigin": "워크래프트"
  },
  {
    "id": "elf_thalyssra",
    "name": "탈리스라",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_liadrin",
    "sisterRank": "언니",
    "sisterPair": "elf_sisters_08",
    "portraitAge": 32,
    "face": "portraits/mates/elf-sisters/thalyssra",
    "halfKey": "portraits/mates/elf-sisters/thalyssra_half",
    "home": 66,
    "reg": [
      1
    ],
    "st": [
      80,
      76,
      86,
      89
    ],
    "sk": {
      "sword": 3,
      "nav": 3,
      "music": 3,
      "ops": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "햇살의 노래 자매의 언니. 리아드린의 언니이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 바람을 읽는 활잡이로, 노래로 긴 항해의 지루함을 달랜다.",
    "nameOrigin": "워크래프트"
  },
  {
    "id": "elf_liadrin",
    "name": "리아드린",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_thalyssra",
    "sisterRank": "여동생",
    "sisterPair": "elf_sisters_08",
    "portraitAge": 27,
    "face": "portraits/mates/elf-sisters/liadrin",
    "halfKey": "portraits/mates/elf-sisters/liadrin_half",
    "home": 66,
    "reg": [
      1
    ],
    "st": [
      80,
      76,
      86,
      89
    ],
    "sk": {
      "sword": 3,
      "nav": 3,
      "music": 3,
      "ops": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "햇살의 노래 자매의 여동생. 탈리스라의 여동생이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 밝은 노래와 유연한 활솜씨로 새로운 바다를 반긴다.",
    "nameOrigin": "워크래프트"
  },
  {
    "id": "elf_deedlit",
    "name": "디드리트",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_marcille",
    "sisterRank": "언니",
    "sisterPair": "elf_sisters_09",
    "portraitAge": 32,
    "face": "portraits/mates/elf-sisters/deedlit",
    "halfKey": "portraits/mates/elf-sisters/deedlit_half",
    "home": 67,
    "reg": [
      1
    ],
    "st": [
      77,
      77,
      85,
      90
    ],
    "sk": {
      "sword": 3,
      "nav": 3,
      "survey": 3,
      "craft": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "바다의 진주 자매의 언니. 마르실의 언니이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 조류와 여울을 읽고 삼지창으로 해안의 길을 연다.",
    "nameOrigin": "로도스도 전기"
  },
  {
    "id": "elf_marcille",
    "name": "마르실",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_deedlit",
    "sisterRank": "여동생",
    "sisterPair": "elf_sisters_09",
    "portraitAge": 27,
    "face": "portraits/mates/elf-sisters/marcille",
    "halfKey": "portraits/mates/elf-sisters/marcille_half",
    "home": 67,
    "reg": [
      1
    ],
    "st": [
      77,
      77,
      85,
      90
    ],
    "sk": {
      "sword": 3,
      "nav": 3,
      "survey": 3,
      "craft": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "바다의 진주 자매의 여동생. 디드리트의 여동생이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 진주 장식을 손수 엮고 삼지창과 항해술을 함께 익혔다.",
    "nameOrigin": "던전밥"
  },
  {
    "id": "elf_frieren",
    "name": "프리렌",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_nellas",
    "sisterRank": "언니",
    "sisterPair": "elf_sisters_10",
    "portraitAge": 32,
    "face": "portraits/mates/elf-sisters/frieren",
    "halfKey": "portraits/mates/elf-sisters/frieren_half",
    "home": 68,
    "reg": [
      1
    ],
    "st": [
      78,
      78,
      87,
      91
    ],
    "sk": {
      "sword": 3,
      "hist": 3,
      "med": 2,
      "nav": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "비취의 불꽃 자매의 언니. 넬라스의 언니이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 오래된 숲의 이야기를 모으며 비취빛 창으로 길을 지킨다.",
    "nameOrigin": "장송의 프리렌"
  },
  {
    "id": "elf_nellas",
    "name": "넬라스",
    "g": "f",
    "style": "ne",
    "race": "elf",
    "role": "soldier",
    "typeName": "엘프 전사",
    "elfSister": true,
    "sisterId": "elf_frieren",
    "sisterRank": "여동생",
    "sisterPair": "elf_sisters_10",
    "portraitAge": 27,
    "face": "portraits/mates/elf-sisters/nellas",
    "halfKey": "portraits/mates/elf-sisters/nellas_half",
    "home": 68,
    "reg": [
      1
    ],
    "st": [
      78,
      78,
      87,
      91
    ],
    "sk": {
      "sword": 3,
      "hist": 3,
      "med": 2,
      "nav": 2
    },
    "skBoost": 1,
    "lg": {
      "3": 3,
      "2": 2,
      "1": 2
    },
    "fame": 300,
    "wage": 125,
    "y": [
      0,
      9999
    ],
    "desc": "비취의 불꽃 자매의 여동생. 프리렌의 여동생이며, 북유럽 항구를 여행하는 성인 엘프 전사다. 호기심이 많고 약초와 바닷바람의 냄새를 잘 구별한다.",
    "nameOrigin": "톨킨의 가운데땅"
  }
];
  crew.forEach(function (m) {
    if (!G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
    G.MATE_RANGE[m.id] = { zones: ['nordic'], home: m.home };
  });
  G.ELF_SISTERS = crew.map(function (m) { return m.id; });
})(window.G = window.G || {});
