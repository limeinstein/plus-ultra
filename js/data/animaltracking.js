/* 전체 동물 발견물의 종별 원화·이동 방식. 제작: tools/build_animal_tracking_20261117.py */
(function(G){
  'use strict';
  G.ANIMAL_TRACKING = {
  "tarantula": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#29271f",
      "#564d35",
      "#99875b",
      "#d1bd83"
    ],
    "slot": 0,
    "sheet": 4
  },
  "llama": {
    "kind": "camel",
    "habitat": "land",
    "palette": [
      "#463123",
      "#94714c",
      "#ceb17d",
      "#f4e1ba"
    ],
    "slot": 1,
    "sheet": 4
  },
  "prairiedog": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 2,
    "sheet": 4
  },
  "moose": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 3,
    "sheet": 4
  },
  "frigatebird": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 4,
    "sheet": 4
  },
  "tortoise": {
    "kind": "lizard",
    "habitat": "land",
    "palette": [
      "#27362c",
      "#536b46",
      "#9caf67",
      "#e4d69b"
    ],
    "slot": 5,
    "sheet": 4
  },
  "albatross": {
    "kind": "bird",
    "habitat": "special",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 6,
    "sheet": 4
  },
  "kangaroo": {
    "kind": "hop",
    "habitat": "land",
    "palette": [
      "#423026",
      "#93603e",
      "#ca9c69",
      "#eddbb3"
    ],
    "slot": 15,
    "sheet": 3
  },
  "paradise": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#233e45",
      "#3b9272",
      "#dbb94c",
      "#d76c4d"
    ],
    "slot": 7,
    "sheet": 4
  },
  "sable": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 8,
    "sheet": 4
  },
  "tiger": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292525",
      "#d78631",
      "#eeb55b",
      "#f4e0b3"
    ],
    "slot": 9,
    "sheet": 4
  },
  "panda": {
    "kind": "bear",
    "habitat": "land",
    "palette": [
      "#20262c",
      "#fbf4df"
    ],
    "slot": 10,
    "sheet": 4
  },
  "porcupine": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 11,
    "sheet": 4
  },
  "coelacanth": {
    "kind": "water",
    "habitat": "special",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 12,
    "sheet": 4
  },
  "warthog": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 13,
    "sheet": 4
  },
  "komodo": {
    "kind": "lizard",
    "habitat": "land",
    "palette": [
      "#27362c",
      "#536b46",
      "#9caf67",
      "#e4d69b"
    ],
    "slot": 14,
    "sheet": 4
  },
  "penguin": {
    "kind": "web",
    "habitat": "land",
    "palette": [
      "#20262c",
      "#fbf4df"
    ],
    "slot": 15,
    "sheet": 4
  },
  "mandrill": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 0,
    "sheet": 5
  },
  "ostrich": {
    "kind": "ostrich",
    "habitat": "land",
    "palette": [
      "#252427",
      "#736664",
      "#d4a3a0",
      "#f3eee1"
    ],
    "slot": 1,
    "sheet": 5
  },
  "flamingo": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#34303a",
      "#d35c7c",
      "#f1a2b4",
      "#f9d4cc"
    ],
    "slot": 2,
    "sheet": 5
  },
  "hippo": {
    "kind": "hippo",
    "habitat": "land",
    "palette": [
      "#343634",
      "#6b746b",
      "#a4aa91",
      "#d9d2b3"
    ],
    "slot": 3,
    "sheet": 5
  },
  "crocodile": {
    "kind": "lizard",
    "habitat": "land",
    "palette": [
      "#27362c",
      "#536b46",
      "#9caf67",
      "#e4d69b"
    ],
    "slot": 4,
    "sheet": 5
  },
  "polarbear": {
    "kind": "bear",
    "habitat": "land",
    "palette": [
      "#39424d",
      "#b7c4c5",
      "#f9f1da"
    ],
    "slot": 5,
    "sheet": 5
  },
  "yeti": {
    "kind": "biped",
    "habitat": "land",
    "palette": [
      "#302c34",
      "#625b72",
      "#b8b1bd",
      "#eee3d1"
    ],
    "slot": 6,
    "sheet": 5
  },
  "roc": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 7,
    "sheet": 5
  },
  "mokele": {
    "kind": "elephant",
    "habitat": "land",
    "palette": [
      "#33353a",
      "#777b82",
      "#a9a9a2",
      "#eee0b7"
    ],
    "slot": 8,
    "sheet": 5
  },
  "minotaur": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 9,
    "sheet": 5
  },
  "troll": {
    "kind": "biped",
    "habitat": "land",
    "palette": [
      "#302c34",
      "#625b72",
      "#b8b1bd",
      "#eee3d1"
    ],
    "slot": 10,
    "sheet": 5
  },
  "nessie": {
    "kind": "water",
    "habitat": "land",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 11,
    "sheet": 5
  },
  "narwhal": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 12,
    "sheet": 5
  },
  "manatee": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 13,
    "sheet": 5
  },
  "humpback": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 14,
    "sheet": 5
  },
  "f_bluefin": {
    "kind": "water",
    "habitat": "special",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 15,
    "sheet": 5
  },
  "f_swordfish": {
    "kind": "water",
    "habitat": "special",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 0,
    "sheet": 6
  },
  "f_sturgeon": {
    "kind": "water",
    "habitat": "special",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 1,
    "sheet": 6
  },
  "f_flying": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 2,
    "sheet": 6
  },
  "f_sunfish": {
    "kind": "water",
    "habitat": "special",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 3,
    "sheet": 6
  },
  "f_marlin": {
    "kind": "water",
    "habitat": "special",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 4,
    "sheet": 6
  },
  "f_puffer": {
    "kind": "water",
    "habitat": "special",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 5,
    "sheet": 6
  },
  "f_oarfish": {
    "kind": "water",
    "habitat": "special",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 6,
    "sheet": 6
  },
  "f_giantsquid": {
    "kind": "water",
    "habitat": "special",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 7,
    "sheet": 6
  },
  "f_seadragon": {
    "kind": "water",
    "habitat": "special",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 8,
    "sheet": 6
  },
  "shiba": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 9,
    "sheet": 6
  },
  "pomeranian": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 0,
    "sheet": 1
  },
  "pug": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 10,
    "sheet": 6
  },
  "corgi": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 11,
    "sheet": 6
  },
  "yorkie": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#30383e",
      "#676e73",
      "#b58a53",
      "#e4c68b"
    ],
    "slot": 1,
    "sheet": 1
  },
  "shihtzu": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 12,
    "sheet": 6
  },
  "golden": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 2,
    "sheet": 1
  },
  "bostonterrier": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#25272b",
      "#777b7e",
      "#f2ead7"
    ],
    "slot": 3,
    "sheet": 1
  },
  "dachshund": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 13,
    "sheet": 6
  },
  "papillon": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 14,
    "sheet": 6
  },
  "siamese": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#382c29",
      "#81664c",
      "#cbb488",
      "#f0dfb7"
    ],
    "slot": 15,
    "sheet": 6
  },
  "russianblue": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#30383f",
      "#687984",
      "#9dabb0",
      "#d2d7d1"
    ],
    "slot": 0,
    "sheet": 7
  },
  "persian": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292323",
      "#aa7141",
      "#e7bc72",
      "#fff0d3"
    ],
    "slot": 1,
    "sheet": 7
  },
  "angora": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#8d9095",
      "#c1c7c4",
      "#f7efdc"
    ],
    "slot": 2,
    "sheet": 7
  },
  "koreancat": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292323",
      "#aa7141",
      "#e7bc72",
      "#fff0d3"
    ],
    "slot": 3,
    "sheet": 7
  },
  "shire": {
    "kind": "hoof",
    "habitat": "land",
    "palette": [
      "#282321",
      "#72503b",
      "#b58a5b",
      "#e8d4af"
    ],
    "slot": 4,
    "sheet": 7
  },
  "friesian": {
    "kind": "hoof",
    "habitat": "land",
    "palette": [
      "#282321",
      "#72503b",
      "#b58a5b",
      "#e8d4af"
    ],
    "slot": 5,
    "sheet": 7
  },
  "buffalo": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 6,
    "sheet": 7
  },
  "redhare": {
    "kind": "hoof",
    "habitat": "land",
    "palette": [
      "#282321",
      "#72503b",
      "#b58a5b",
      "#e8d4af"
    ],
    "slot": 7,
    "sheet": 7
  },
  "lion": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292323",
      "#aa7141",
      "#e7bc72",
      "#fff0d3"
    ],
    "slot": 14,
    "sheet": 3
  },
  "hyena": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 8,
    "sheet": 7
  },
  "giraffe": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#65402b",
      "#bd8544",
      "#e7c976",
      "#f3dfb0"
    ],
    "slot": 9,
    "sheet": 7
  },
  "elephant": {
    "kind": "elephant",
    "habitat": "land",
    "palette": [
      "#33353a",
      "#777b82",
      "#a9a9a2",
      "#eee0b7"
    ],
    "slot": 10,
    "sheet": 7
  },
  "zebra": {
    "kind": "hoof",
    "habitat": "land",
    "palette": [
      "#272a2c",
      "#eee6d3"
    ],
    "slot": 11,
    "sheet": 7
  },
  "rhino": {
    "kind": "rhino",
    "habitat": "land",
    "palette": [
      "#343634",
      "#6b746b",
      "#a4aa91",
      "#d9d2b3"
    ],
    "slot": 12,
    "sheet": 7
  },
  "chimp": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 13,
    "sheet": 7
  },
  "gorilla": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 14,
    "sheet": 7
  },
  "meerkat": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 15,
    "sheet": 7
  },
  "cheetah": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#25262b",
      "#ac834c",
      "#e0c38b",
      "#f6ecd3"
    ],
    "slot": 0,
    "sheet": 8
  },
  "antelope": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 1,
    "sheet": 8
  },
  "fennec": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 2,
    "sheet": 8
  },
  "lemur": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 3,
    "sheet": 8
  },
  "chameleon": {
    "kind": "lizard",
    "habitat": "land",
    "palette": [
      "#27362c",
      "#536b46",
      "#9caf67",
      "#e4d69b"
    ],
    "slot": 4,
    "sheet": 8
  },
  "ploverbird": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 5,
    "sheet": 8
  },
  "whitetiger": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#25262b",
      "#777d81",
      "#bec2bc",
      "#f6ecd3"
    ],
    "slot": 4,
    "sheet": 1
  },
  "peacock": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#233e45",
      "#3b9272",
      "#dbb94c",
      "#d76c4d"
    ],
    "slot": 6,
    "sheet": 8
  },
  "redpanda": {
    "kind": "bear",
    "habitat": "land",
    "palette": [
      "#352b29",
      "#ba5c35",
      "#e2a365",
      "#f1e2bb"
    ],
    "slot": 7,
    "sheet": 8
  },
  "cloudleopard": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292323",
      "#aa7141",
      "#e7bc72",
      "#fff0d3"
    ],
    "slot": 8,
    "sheet": 8
  },
  "moonbear": {
    "kind": "bear",
    "habitat": "land",
    "palette": [
      "#241f1b",
      "#624831",
      "#b48959",
      "#ebd7b0"
    ],
    "slot": 9,
    "sheet": 8
  },
  "squirrel": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 10,
    "sheet": 8
  },
  "vinousbird": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 11,
    "sheet": 8
  },
  "crane": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#242c32",
      "#c95142",
      "#f5f0de"
    ],
    "slot": 12,
    "sheet": 8
  },
  "shiri": {
    "kind": "water",
    "habitat": "land",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 13,
    "sheet": 8
  },
  "eagle": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 14,
    "sheet": 8
  },
  "falcon": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 15,
    "sheet": 8
  },
  "mallard": {
    "kind": "web",
    "habitat": "land",
    "palette": [
      "#20282e",
      "#496875",
      "#d9b875",
      "#f3f1df"
    ],
    "slot": 0,
    "sheet": 9
  },
  "stork": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#242c32",
      "#c95142",
      "#f5f0de"
    ],
    "slot": 1,
    "sheet": 9
  },
  "anteater": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 2,
    "sheet": 9
  },
  "armadillo": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 3,
    "sheet": 9
  },
  "boa": {
    "kind": "snake",
    "habitat": "land",
    "palette": [
      "#203b2c",
      "#417448",
      "#a2a955",
      "#e8d598"
    ],
    "slot": 4,
    "sheet": 9
  },
  "parrot": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#233e45",
      "#3b9272",
      "#dbb94c",
      "#d76c4d"
    ],
    "slot": 5,
    "sheet": 9
  },
  "iguana": {
    "kind": "lizard",
    "habitat": "land",
    "palette": [
      "#27362c",
      "#536b46",
      "#9caf67",
      "#e4d69b"
    ],
    "slot": 6,
    "sheet": 9
  },
  "hermitcrab": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#4b302a",
      "#a34d34",
      "#d68b4e",
      "#ebd6ab"
    ],
    "slot": 7,
    "sheet": 9
  },
  "turkey": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 8,
    "sheet": 9
  },
  "roadrunner": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 9,
    "sheet": 9
  },
  "skunk": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#25272b",
      "#777b7e",
      "#f2ead7"
    ],
    "slot": 10,
    "sheet": 9
  },
  "coyote": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 11,
    "sheet": 9
  },
  "sealion": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 12,
    "sheet": 9
  },
  "floridawolf": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 13,
    "sheet": 9
  },
  "hudsonwolf": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 14,
    "sheet": 9
  },
  "arcticwolf": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#39424d",
      "#b7c4c5",
      "#f9f1da"
    ],
    "slot": 15,
    "sheet": 9
  },
  "graywolf": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 0,
    "sheet": 10
  },
  "otter": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 1,
    "sheet": 10
  },
  "whale": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 2,
    "sheet": 10
  },
  "lobster": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#4b302a",
      "#a34d34",
      "#d68b4e",
      "#ebd6ab"
    ],
    "slot": 3,
    "sheet": 10
  },
  "dolphin": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 4,
    "sheet": 10
  },
  "mammoth": {
    "kind": "elephant",
    "habitat": "land",
    "palette": [
      "#30271f",
      "#79523a",
      "#bc8b56",
      "#ead9ad"
    ],
    "slot": 5,
    "sheet": 1
  },
  "elf": {
    "kind": "biped",
    "habitat": "land",
    "palette": [
      "#333b22",
      "#55743a",
      "#b89459",
      "#f0d8a7"
    ],
    "slot": 6,
    "sheet": 1
  },
  "kraken": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#412d55",
      "#7c4b91",
      "#b784c3",
      "#e6c993"
    ],
    "slot": 7,
    "sheet": 1
  },
  "reddragon": {
    "kind": "lizard",
    "habitat": "land",
    "palette": [
      "#8f302c",
      "#c84b2d",
      "#ec9636",
      "#f5cd5a"
    ],
    "slot": 8,
    "sheet": 1
  },
  "unicorn": {
    "kind": "hoof",
    "habitat": "land",
    "palette": [
      "#887550",
      "#c7af72",
      "#e7dab7",
      "#fff2d8"
    ],
    "slot": 9,
    "sheet": 1
  },
  "mermaid": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#21595e",
      "#3f9c98",
      "#d77c67",
      "#f1d4ac"
    ],
    "slot": 10,
    "sheet": 1
  },
  "dragon": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 5,
    "sheet": 10
  },
  "phoenix": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#8f302c",
      "#c84b2d",
      "#ec9636",
      "#f5cd5a"
    ],
    "slot": 11,
    "sheet": 1
  },
  "koala": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 6,
    "sheet": 10
  },
  "platypus": {
    "kind": "web",
    "habitat": "land",
    "palette": [
      "#20282e",
      "#496875",
      "#d9b875",
      "#f3f1df"
    ],
    "slot": 7,
    "sheet": 10
  },
  "dingo": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 8,
    "sheet": 10
  },
  "budgie": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#233e45",
      "#3b9272",
      "#dbb94c",
      "#d76c4d"
    ],
    "slot": 9,
    "sheet": 10
  },
  "kiwi": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 10,
    "sheet": 10
  },
  "sailfish": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 11,
    "sheet": 10
  },
  "pufferfish": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 12,
    "sheet": 10
  },
  "jellyfish": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#65568e",
      "#9a9dca",
      "#c5dce6",
      "#f3e8e8"
    ],
    "slot": 13,
    "sheet": 10
  },
  "manta": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 14,
    "sheet": 10
  },
  "lionfish": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#292525",
      "#d78631",
      "#eeb55b",
      "#f4e0b3"
    ],
    "slot": 15,
    "sheet": 10
  },
  "angelfish": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203550",
      "#387eaa",
      "#e2c052",
      "#f0e5bf"
    ],
    "slot": 0,
    "sheet": 11
  },
  "clownfish": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#25282c",
      "#d36b27",
      "#efa342",
      "#fff0d6"
    ],
    "slot": 1,
    "sheet": 11
  },
  "bluetang": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#1b2b40",
      "#225aab",
      "#5899ca",
      "#e4c74a"
    ],
    "slot": 2,
    "sheet": 11
  },
  "himalwolf": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#302721",
      "#875436",
      "#cf9b60",
      "#f7e6c4"
    ],
    "slot": 3,
    "sheet": 11
  },
  "smilodon": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292323",
      "#aa7141",
      "#e7bc72",
      "#fff0d3"
    ],
    "slot": 12,
    "sheet": 1
  },
  "brachio": {
    "kind": "elephant",
    "habitat": "land",
    "palette": [
      "#33353a",
      "#777b82",
      "#a9a9a2",
      "#eee0b7"
    ],
    "slot": 13,
    "sheet": 1
  },
  "trex": {
    "kind": "raptor",
    "habitat": "land",
    "palette": [
      "#303829",
      "#677646",
      "#b5a15f",
      "#e5d3a3"
    ],
    "slot": 14,
    "sheet": 1
  },
  "trike": {
    "kind": "rhino",
    "habitat": "land",
    "palette": [
      "#343634",
      "#6b746b",
      "#a4aa91",
      "#d9d2b3"
    ],
    "slot": 15,
    "sheet": 1
  },
  "stego": {
    "kind": "rhino",
    "habitat": "land",
    "palette": [
      "#623b2b",
      "#a55d3d",
      "#d49b52",
      "#eddbac"
    ],
    "slot": 0,
    "sheet": 2
  },
  "phoenixw": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#8f302c",
      "#c84b2d",
      "#ec9636",
      "#f5cd5a"
    ],
    "slot": 1,
    "sheet": 2
  },
  "blackdragon": {
    "kind": "lizard",
    "habitat": "land",
    "palette": [
      "#242a30",
      "#495867",
      "#889ca2",
      "#d4ae57"
    ],
    "slot": 2,
    "sheet": 2
  },
  "chimera": {
    "kind": "lizard",
    "habitat": "land",
    "palette": [
      "#27362c",
      "#536b46",
      "#9caf67",
      "#e4d69b"
    ],
    "slot": 3,
    "sheet": 2
  },
  "cyclops": {
    "kind": "biped",
    "habitat": "land",
    "palette": [
      "#302c34",
      "#625b72",
      "#b8b1bd",
      "#eee3d1"
    ],
    "slot": 4,
    "sheet": 2
  },
  "titan": {
    "kind": "biped",
    "habitat": "land",
    "palette": [
      "#302c34",
      "#625b72",
      "#b8b1bd",
      "#eee3d1"
    ],
    "slot": 5,
    "sheet": 2
  },
  "oni": {
    "kind": "biped",
    "habitat": "land",
    "palette": [
      "#392f32",
      "#8d3436",
      "#c65c4c",
      "#ecdcb0"
    ],
    "slot": 6,
    "sheet": 2
  },
  "dokkaebi": {
    "kind": "biped",
    "habitat": "land",
    "palette": [
      "#2d3b30",
      "#497c5b",
      "#8f7653",
      "#e5d8b5"
    ],
    "slot": 7,
    "sheet": 2
  },
  "gumiho": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#633e2f",
      "#b96e45",
      "#e6c796",
      "#f8edcf"
    ],
    "slot": 8,
    "sheet": 2
  },
  "gwisin": {
    "kind": "ghost",
    "habitat": "land",
    "palette": [
      "#34394e",
      "#70879e",
      "#bbd5df",
      "#eff4e8"
    ],
    "slot": 9,
    "sheet": 2
  },
  "hyeonmu": {
    "kind": "lizard",
    "habitat": "land",
    "palette": [
      "#252e31",
      "#326762",
      "#769082",
      "#d5b465"
    ],
    "slot": 10,
    "sheet": 2
  },
  "isonade": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 11,
    "sheet": 2
  },
  "bakunawa": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#243e52",
      "#286c79",
      "#65aaa3",
      "#e3d9a8"
    ],
    "slot": 12,
    "sheet": 2
  },
  "xiangliu": {
    "kind": "snake",
    "habitat": "land",
    "palette": [
      "#203b2c",
      "#417448",
      "#a2a955",
      "#e8d598"
    ],
    "slot": 13,
    "sheet": 2
  },
  "zaratan": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 14,
    "sheet": 2
  },
  "leviathan": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#243e52",
      "#286c79",
      "#65aaa3",
      "#e3d9a8"
    ],
    "slot": 15,
    "sheet": 2
  },
  "apophis": {
    "kind": "snake",
    "habitat": "land",
    "palette": [
      "#203b2c",
      "#417448",
      "#a2a955",
      "#e8d598"
    ],
    "slot": 0,
    "sheet": 3
  },
  "jormungandr": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#284c38",
      "#507a48",
      "#89a360",
      "#e8dcaa"
    ],
    "slot": 1,
    "sheet": 3
  },
  "fenrir": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#30343a",
      "#727c82",
      "#b6bfc0",
      "#eee4cb"
    ],
    "slot": 2,
    "sheet": 3
  },
  "yakumama": {
    "kind": "snake",
    "habitat": "land",
    "palette": [
      "#203b2c",
      "#417448",
      "#a2a955",
      "#e8d598"
    ],
    "slot": 3,
    "sheet": 3
  },
  "cipactli": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 4,
    "sheet": 3
  },
  "giant-octopus": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 5,
    "sheet": 3
  },
  "sea-serpent": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 6,
    "sheet": 3
  },
  "sea-dragon": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#243e52",
      "#286c79",
      "#65aaa3",
      "#e3d9a8"
    ],
    "slot": 7,
    "sheet": 3
  },
  "man-eating-shark": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 8,
    "sheet": 3
  },
  "ghost-ship": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 9,
    "sheet": 3
  },
  "yelbegen": {
    "kind": "lizard",
    "habitat": "land",
    "palette": [
      "#27362c",
      "#536b46",
      "#9caf67",
      "#e4d69b"
    ],
    "slot": 10,
    "sheet": 3
  },
  "sunbear": {
    "kind": "bear",
    "habitat": "land",
    "palette": [
      "#241f1b",
      "#624831",
      "#b48959",
      "#ebd7b0"
    ],
    "slot": 4,
    "sheet": 11
  },
  "tapir": {
    "kind": "hippo",
    "habitat": "land",
    "palette": [
      "#343634",
      "#6b746b",
      "#a4aa91",
      "#d9d2b3"
    ],
    "slot": 5,
    "sheet": 11
  },
  "gibbon": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 6,
    "sheet": 11
  },
  "proboscis": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 7,
    "sheet": 11
  },
  "tarsier": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 8,
    "sheet": 11
  },
  "flyingfox": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#252736",
      "#3567a4",
      "#73b9dd",
      "#e8dfb8"
    ],
    "slot": 9,
    "sheet": 11
  },
  "dugong": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 10,
    "sheet": 11
  },
  "hornbill": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#233e45",
      "#3b9272",
      "#dbb94c",
      "#d76c4d"
    ],
    "slot": 11,
    "sheet": 11
  },
  "babirusa": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 12,
    "sheet": 11
  },
  "kingcobra": {
    "kind": "snake",
    "habitat": "land",
    "palette": [
      "#203b2c",
      "#417448",
      "#a2a955",
      "#e8d598"
    ],
    "slot": 13,
    "sheet": 11
  },
  "amurtiger": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292525",
      "#d78631",
      "#eeb55b",
      "#f4e0b3"
    ],
    "slot": 14,
    "sheet": 11
  },
  "snowleopard": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#25262b",
      "#ac834c",
      "#e0c38b",
      "#f6ecd3"
    ],
    "slot": 15,
    "sheet": 11
  },
  "yak": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 0,
    "sheet": 12
  },
  "bactrian": {
    "kind": "camel",
    "habitat": "land",
    "palette": [
      "#463123",
      "#94714c",
      "#ceb17d",
      "#f4e1ba"
    ],
    "slot": 1,
    "sheet": 12
  },
  "przewalski": {
    "kind": "hoof",
    "habitat": "land",
    "palette": [
      "#282321",
      "#72503b",
      "#b58a5b",
      "#e8d4af"
    ],
    "slot": 2,
    "sheet": 12
  },
  "saiga": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 3,
    "sheet": 12
  },
  "reindeer": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 4,
    "sheet": 12
  },
  "baikalseal": {
    "kind": "water",
    "habitat": "land",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 5,
    "sheet": 12
  },
  "argali": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 6,
    "sheet": 12
  },
  "chiru": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 7,
    "sheet": 12
  },
  "kulan": {
    "kind": "hoof",
    "habitat": "land",
    "palette": [
      "#282321",
      "#72503b",
      "#b58a5b",
      "#e8d4af"
    ],
    "slot": 8,
    "sheet": 12
  },
  "snowyowl": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#39424d",
      "#b7c4c5",
      "#f9f1da"
    ],
    "slot": 9,
    "sheet": 12
  },
  "muskdeer": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 10,
    "sheet": 12
  },
  "manul": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292323",
      "#aa7141",
      "#e7bc72",
      "#fff0d3"
    ],
    "slot": 11,
    "sheet": 12
  },
  "bncrane": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#242c32",
      "#c95142",
      "#f5f0de"
    ],
    "slot": 12,
    "sheet": 12
  },
  "oryx": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 13,
    "sheet": 12
  },
  "dromedary": {
    "kind": "camel",
    "habitat": "land",
    "palette": [
      "#463123",
      "#94714c",
      "#ceb17d",
      "#f4e1ba"
    ],
    "slot": 14,
    "sheet": 12
  },
  "nubianibex": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 15,
    "sheet": 12
  },
  "sacredibis": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#242c32",
      "#c95142",
      "#f5f0de"
    ],
    "slot": 0,
    "sheet": 13
  },
  "vancat": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292323",
      "#aa7141",
      "#e7bc72",
      "#fff0d3"
    ],
    "slot": 1,
    "sheet": 13
  },
  "leopard": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#25262b",
      "#ac834c",
      "#e0c38b",
      "#f6ecd3"
    ],
    "slot": 2,
    "sheet": 13
  },
  "baboon": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 3,
    "sheet": 13
  },
  "wildebeest": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 4,
    "sheet": 13
  },
  "okapi": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 5,
    "sheet": 13
  },
  "asianelephant": {
    "kind": "elephant",
    "habitat": "land",
    "palette": [
      "#33353a",
      "#777b82",
      "#a9a9a2",
      "#eee0b7"
    ],
    "slot": 6,
    "sheet": 13
  },
  "snowmonkey": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 7,
    "sheet": 13
  },
  "bison": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 8,
    "sheet": 13
  },
  "beaver": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 9,
    "sheet": 13
  },
  "baldeagle": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#242c32",
      "#c95142",
      "#f5f0de"
    ],
    "slot": 10,
    "sheet": 13
  },
  "jaguar": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#25262b",
      "#ac834c",
      "#e0c38b",
      "#f6ecd3"
    ],
    "slot": 11,
    "sheet": 13
  },
  "sloth": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 12,
    "sheet": 13
  },
  "toucan": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 13,
    "sheet": 13
  },
  "capybara": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 14,
    "sheet": 13
  },
  "brownbear": {
    "kind": "bear",
    "habitat": "land",
    "palette": [
      "#241f1b",
      "#624831",
      "#b48959",
      "#ebd7b0"
    ],
    "slot": 15,
    "sheet": 13
  },
  "redfox": {
    "kind": "dog",
    "habitat": "land",
    "palette": [
      "#352b29",
      "#ba5c35",
      "#e2a365",
      "#f1e2bb"
    ],
    "slot": 0,
    "sheet": 14
  },
  "lynx": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292323",
      "#aa7141",
      "#e7bc72",
      "#fff0d3"
    ],
    "slot": 1,
    "sheet": 14
  },
  "wombat": {
    "kind": "small",
    "habitat": "land",
    "palette": [
      "#322920",
      "#786047",
      "#b99a6a",
      "#eddfbc"
    ],
    "slot": 2,
    "sheet": 14
  },
  "emu": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 3,
    "sheet": 14
  },
  "emperorpenguin": {
    "kind": "web",
    "habitat": "sea",
    "palette": [
      "#20262c",
      "#fbf4df"
    ],
    "slot": 4,
    "sheet": 14
  },
  "walrus": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 5,
    "sheet": 14
  },
  "condor": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 6,
    "sheet": 14
  },
  "hummingbird": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#282c2e",
      "#756a42",
      "#d6b365",
      "#f1e8cf"
    ],
    "slot": 7,
    "sheet": 14
  },
  "anaconda": {
    "kind": "snake",
    "habitat": "land",
    "palette": [
      "#203b2c",
      "#417448",
      "#a2a955",
      "#e8d598"
    ],
    "slot": 8,
    "sheet": 14
  },
  "piranha": {
    "kind": "water",
    "habitat": "land",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 9,
    "sheet": 14
  },
  "boto": {
    "kind": "water",
    "habitat": "land",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 10,
    "sheet": 14
  },
  "vicuna": {
    "kind": "camel",
    "habitat": "land",
    "palette": [
      "#463123",
      "#94714c",
      "#ceb17d",
      "#f4e1ba"
    ],
    "slot": 11,
    "sheet": 14
  },
  "grizzly": {
    "kind": "bear",
    "habitat": "land",
    "palette": [
      "#241f1b",
      "#624831",
      "#b48959",
      "#ebd7b0"
    ],
    "slot": 12,
    "sheet": 14
  },
  "raccoon": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#2b2e31",
      "#6d7373",
      "#b5b5a5",
      "#eee2c5"
    ],
    "slot": 13,
    "sheet": 14
  },
  "opossum": {
    "kind": "hand",
    "habitat": "land",
    "palette": [
      "#29241f",
      "#736044",
      "#b5986c",
      "#eee1c8"
    ],
    "slot": 14,
    "sheet": 14
  },
  "puma": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#292323",
      "#aa7141",
      "#e7bc72",
      "#fff0d3"
    ],
    "slot": 15,
    "sheet": 14
  },
  "marineiguana": {
    "kind": "lizard",
    "habitat": "sea",
    "palette": [
      "#27362c",
      "#536b46",
      "#9caf67",
      "#e4d69b"
    ],
    "slot": 0,
    "sheet": 15
  },
  "magellanpenguin": {
    "kind": "web",
    "habitat": "sea",
    "palette": [
      "#20262c",
      "#fbf4df"
    ],
    "slot": 1,
    "sheet": 15
  },
  "muskox": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 2,
    "sheet": 15
  },
  "bighorn": {
    "kind": "split",
    "habitat": "land",
    "palette": [
      "#302b25",
      "#856346",
      "#c8a575",
      "#eee1bb"
    ],
    "slot": 3,
    "sheet": 15
  },
  "dartfrog": {
    "kind": "frog",
    "habitat": "land",
    "palette": [
      "#252b30",
      "#2c88c7",
      "#e6c643",
      "#e87b35"
    ],
    "slot": 4,
    "sheet": 15
  },
  "electriceel": {
    "kind": "snake",
    "habitat": "land",
    "palette": [
      "#203b2c",
      "#417448",
      "#a2a955",
      "#e8d598"
    ],
    "slot": 5,
    "sheet": 15
  },
  "seaotter": {
    "kind": "water",
    "habitat": "sea",
    "palette": [
      "#203c51",
      "#437d98",
      "#95c8cf",
      "#eee7cd"
    ],
    "slot": 6,
    "sheet": 15
  },
  "morpho": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#25253b",
      "#245fc0",
      "#6bc8ed",
      "#e5f3e5"
    ],
    "slot": 7,
    "sheet": 15
  },
  "glasswing": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#25253b",
      "#245fc0",
      "#6bc8ed",
      "#e5f3e5"
    ],
    "slot": 8,
    "sheet": 15
  },
  "hercules": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 9,
    "sheet": 15
  },
  "titanus": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 10,
    "sheet": 15
  },
  "monarchwinter": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#28262a",
      "#d77b32",
      "#efc65b",
      "#f4e5bf"
    ],
    "slot": 11,
    "sheet": 15
  },
  "silverscarab": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 12,
    "sheet": 15
  },
  "lanternfly": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 13,
    "sheet": 15
  },
  "lunamoth": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#385c43",
      "#7ebc83",
      "#b7d8a2",
      "#e9e4be"
    ],
    "slot": 14,
    "sheet": 15
  },
  "periodical": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 15,
    "sheet": 15
  },
  "eightyeight": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#28262a",
      "#d77b32",
      "#efc65b",
      "#f4e5bf"
    ],
    "slot": 0,
    "sheet": 16
  },
  "swallowtail": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#28262a",
      "#d77b32",
      "#efc65b",
      "#f4e5bf"
    ],
    "slot": 1,
    "sheet": 16
  },
  "emeraldswallow": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#233330",
      "#377750",
      "#8cba54",
      "#e5cc5a"
    ],
    "slot": 2,
    "sheet": 16
  },
  "birdwing": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#233330",
      "#377750",
      "#8cba54",
      "#e5cc5a"
    ],
    "slot": 3,
    "sheet": 16
  },
  "sasakia": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#252736",
      "#3567a4",
      "#73b9dd",
      "#e8dfb8"
    ],
    "slot": 4,
    "sheet": 16
  },
  "atlasmoth": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#4c382f",
      "#946a49",
      "#cca56f",
      "#eddbab"
    ],
    "slot": 5,
    "sheet": 16
  },
  "deadleaf": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#4c382f",
      "#946a49",
      "#cca56f",
      "#eddbab"
    ],
    "slot": 6,
    "sheet": 16
  },
  "bhutanglory": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#252736",
      "#3567a4",
      "#73b9dd",
      "#e8dfb8"
    ],
    "slot": 7,
    "sheet": 16
  },
  "chalcosoma": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 8,
    "sheet": 16
  },
  "giraffestag": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 9,
    "sheet": 16
  },
  "tamamushi": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 10,
    "sheet": 16
  },
  "fireflyriver": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#252736",
      "#3567a4",
      "#73b9dd",
      "#e8dfb8"
    ],
    "slot": 11,
    "sheet": 16
  },
  "orchidmantis": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 12,
    "sheet": 16
  },
  "rainbowstag": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 13,
    "sheet": 16
  },
  "sunsetmoth": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#302d3f",
      "#6c4e8b",
      "#be723d",
      "#dfbc4a"
    ],
    "slot": 14,
    "sheet": 16
  },
  "cometmoth": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#4c382f",
      "#946a49",
      "#cca56f",
      "#eddbab"
    ],
    "slot": 15,
    "sheet": 16
  },
  "giantswallow": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#252736",
      "#3567a4",
      "#73b9dd",
      "#e8dfb8"
    ],
    "slot": 0,
    "sheet": 17
  },
  "goliath": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 1,
    "sheet": 17
  },
  "sacredscarab": {
    "kind": "insect",
    "habitat": "land",
    "palette": [
      "#242d26",
      "#496544",
      "#a1a25b",
      "#e0cb87"
    ],
    "slot": 2,
    "sheet": 17
  },
  "motherpearl": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#28262a",
      "#d77b32",
      "#efc65b",
      "#f4e5bf"
    ],
    "slot": 3,
    "sheet": 17
  },
  "peacockbf": {
    "kind": "flutter",
    "habitat": "land",
    "palette": [
      "#252736",
      "#3567a4",
      "#73b9dd",
      "#e8dfb8"
    ],
    "slot": 4,
    "sheet": 17
  },
  "siberiancrane": {
    "kind": "bird",
    "habitat": "land",
    "palette": [
      "#242c32",
      "#c95142",
      "#f5f0de"
    ],
    "slot": 11,
    "sheet": 3
  },
  "wolverine": {
    "kind": "bear",
    "habitat": "land",
    "palette": [
      "#241f1b",
      "#624831",
      "#b48959",
      "#ebd7b0"
    ],
    "slot": 12,
    "sheet": 3
  },
  "amurleopard": {
    "kind": "cat",
    "habitat": "land",
    "palette": [
      "#25262b",
      "#ac834c",
      "#e0c38b",
      "#f6ecd3"
    ],
    "slot": 13,
    "sheet": 3
  }
};
})(window.G=window.G||{});
