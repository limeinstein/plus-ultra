/* 전체 동물 발견물의 종별 원화·이동 방식. 제작: tools/build_animal_tracking_20261117.py */
(function(G){
  'use strict';
  G.ANIMAL_TRACKING = {
  "tarantula": {
    "kind": "insect",
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
    "palette": [
      "#20262c",
      "#fbf4df"
    ],
    "slot": 10,
    "sheet": 4
  },
  "porcupine": {
    "kind": "small",
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
    "palette": [
      "#20262c",
      "#fbf4df"
    ],
    "slot": 15,
    "sheet": 4
  },
  "mandrill": {
    "kind": "hand",
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
    "palette": [
      "#272a2c",
      "#eee6d3"
    ],
    "slot": 11,
    "sheet": 7
  },
  "rhino": {
    "kind": "rhino",
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
    "palette": [
      "#20262c",
      "#fbf4df"
    ],
    "slot": 4,
    "sheet": 14
  },
  "walrus": {
    "kind": "water",
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
    "palette": [
      "#20262c",
      "#fbf4df"
    ],
    "slot": 1,
    "sheet": 15
  },
  "muskox": {
    "kind": "split",
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
