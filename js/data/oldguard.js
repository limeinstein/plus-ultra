/* 노장(老將) — 세대 교체 때 새 제독 곁에 남는 두 사람 · 배에서 내린 사건 동료가 스무 해 뒤 철새로 (규칙: js/systems/oldguard.js). 2026-10-29 사용자 요청
   {old} 물러나는 제독 · {heir} 새 제독 · {young} 도련님/아가씨 · {name} 부하 · {yrs} 함께한 햇수 · {home} 고향 · {old:이/가} 처럼 쓰면 조사를 붙인 말
   한 줄 앞의 'm:' 부하 · 'h:' 새 제독 · 'n:' 낭독 */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.oldGuard = {
    years: 40,           // 노장: 이만큼 넘게 함께 항해했고, 기함의 선실에도 들지 못하고 다른 배의 선장도 아닌 부하 (js/systems/mateleave.js 와 같은 기준)
    keep: 2,             // 세대 교체 때 새 제독 곁에 남길 수 있는 사람 수 (친족·소꿉친구도 한 자리를 쓴다)
    kinChance: 0.6,      // 세대 교체 때 친족이나 소꿉친구가 함께 하겠다고 찾아올 가능성
    kinKinds: { cousin: 0.4, uncle: 0.2, friend: 0.4 },   // 사촌 · 외삼촌 · 소꿉친구
    friendLocalChance: 0.65, // 여성 소꿉친구: 같은 출신권 우선. 나머지는 항구에 이주해 함께 자란 집안
    aideLoyal: 100,      // 남은 노장의 충성
    aideCalm: 3650,      // 남은 노장은 새 제독이 자리를 잡을 때까지(일) 배를 떠나지 않는다
    kinLoyal: 90,        // 함께 온 친족·소꿉친구의 충성
    returnYears: 20      // 배에서 내린 사건 동료는 이만큼 지난 해에 다른 이름의 철새로 나타난다
  };
  G.OLD_GUARD = {
    shots: {
      arrange: '후계자를 위한 안배', aide: '새 제독의 곁을 부탁하네',
      visit: '소꿉친구가 찾아오다', council: '후계를 위한 안배', farewell: '노장들의 작별',
      visitBg: 'family-events/childfriend_visit', councilBg: 'family-events/heir_council',
      joinKey: 'family-events/childfriend_join', farewellKey: 'family-events/oldguard_farewell',
      mourning: '선대의 뜻을 이어', friend: '어린 날의 약속 — 함께 항해하자', kin: '같은 배를 타는 가족',
      cabin: 'legend-events/oldguard_arrange', joinPrefix: 'legend-events/oldguard_join_'
    },
    intro: '{old:과/와} 함께 {yrs}년 넘게 바다를 누빈 노장들이 있다. 기함의 선실에도, 다른 배의 선장 자리에도 들지 못한 채 묵묵히 갑판을 지켜 온 사람들 — 이들은 {old:과/와} 함께 뭍에 오르려 한다.<br>그 가운데 두 사람은 {heir}의 곁에 남아 새 제독을 도울 수 있다.',
    introKin: '노장은 없지만, {heir}의 곁을 지키겠다고 찾아온 사람이 있다.',
    pickTitle: '새 제독 곁에 남을 사람',
    pickHead: '{heir}의 곁에 남을 사람을 고르십시오 (둘까지). 고르지 않은 노장은 {old:과/와} 함께 배에서 내립니다.',
    pickNone: '아무도 남기지 않습니까?<br>노장들은 모두 {old:과/와} 함께 배에서 내립니다.',
    askAide: '{names}, 내 뒤를 이을 {heir}의 곁을 지켜 주게. 자네들과 건넌 바다를, 이제 이 아이도 배울 수 있도록.',
    stay: [
      ['m:{young}… 아니, 이제는 제독이시지요. 선대께 받은 은혜를 갚을 차례입니다.', 'm:처음 몇 해는 제가 곁에서 바람을 읽어 드리겠습니다. 모르는 것은 언제든 물으십시오.'],
      ['m:{old}께서 처음 배를 몰던 날도 제가 곁에 있었습니다. 오늘 또 그 자리에 서는군요.', 'm:제독, 이 늙은이가 아직 쓸모가 있을 겁니다. 함께 가지요.'],
      ['m:뭍에 올라가 봐야 할 일도 없습니다. 바다에 두고 온 일이 아직 많지요.', 'm:{young}께서 혼자 서실 수 있을 때까지만, 딱 그때까지만 곁에 있겠습니다.']
    ],
    stayHeir: 'h:고맙습니다. 아버지가 믿던 사람이면 저도 믿겠습니다.',
    goRetire: '{namesW} {old:과/와} 함께 배에서 내렸다. 「이제 바다는 젊은 제독의 것입니다.」 — 마지막으로 갑판을 한 바퀴 돌고, 저마다 고향으로 떠났다.',
    goDeath: '{namesW} {old}의 장례를 치른 뒤 배에서 내렸다. 「제독이 없는 바다는 우리에게 너무 넓습니다.」 — 저마다 고향으로 떠났다.',
    log: '{name:이/가} 선대 제독 {old:과/와} 함께 배에서 내렸다 — 고향 {home}. 함께한 {yrs}년.',
    aideLog: '{name:이/가} 새 제독 {heir}의 곁에 남았다 (후견).',
    // 함께 오는 친족·소꿉친구
    kin: {
      cousin: { tag: '사촌', desc: '{heir}의 사촌. 어릴 적 여름마다 {home} 부두에서 함께 게를 잡던 사이다. {old:을/를} 「삼촌」이라 부르며 자랐고, 언젠가 그 배를 타겠다고 혼자 뱃일을 익혔다.',
        lines: ['m:{heir}, 나 기억해? 여름마다 {home} 부두에서 같이 게 잡던 사촌 {name}.', 'm:삼촌께는 늘 신세만 졌어. 이번엔 내가 너를 도울 차례야. 같은 핏줄끼리 한 배를 타자.'] },
      uncle: { tag: '외삼촌', desc: '{heir}의 외삼촌. 누이의 아이가 제독이 된다는 소식을 듣고 {home}까지 달려왔다. 젊은 날 상선을 탔고, 바다의 쓴맛 단맛을 다 안다.',
        lines: ['m:{heir}, 네 어머니가 걱정이 많더구나. 바다는 아버지 이름만으로 버틸 수 있는 곳이 아니라고.', 'm:그래서 이 외삼촌이 왔다. 몇 해만 곁에 있어 주마. 잔소리는 좀 참아라.'] },
      friend: { tag: '소꿉친구', desc: '{heir}의 소꿉친구. {home}의 골목에서 함께 나무 칼을 휘두르며 해적 놀이를 하던 사이다. 「네가 제독이 되면 나는 부관」이라던 어릴 적 약속을 아직 잊지 않았다.',
        lines: ['m:{heir}! 어릴 적 {home} 골목에서 나무 칼 들고 해적 놀이 하던 거 기억나?', 'm:「네가 제독이 되면 나는 부관」이라고 했잖아. 약속 지키러 왔어. 이번엔 진짜 배에 태워 줘.'] },
      join: '{name:이/가} {heir}의 곁에 남는다 ({tag}).'
    },
    // 성인으로 다시 만난 소꿉친구의 계층별 솜씨와 말. 영애는 지배권 없는 작은 향사 집안이다.
    friendClasses: {
      "villager": {
        "tag": "마을 주민",
        "types": [
          "cook",
          "doctor",
          "trade"
        ],
        "role": "keeper",
        "desc": "항구 마을의 일손을 거들며 자랐다. 살림과 손재주로 이웃을 돕던 어른이 되어, 이번에는 {heir}의 배를 든든하게 꾸리려 한다.",
        "lines": [
          "m:마을에서 배운 일이야 많지. 밥 짓고, 약초 고르고, 물건값 흥정하는 일은 내게 맡겨. 네 첫 항해를 빈손으로 보내겠어?"
        ]
      },
      "sailor": {
        "tag": "열혈 항해사 지망생",
        "types": [
          "nav",
          "survey"
        ],
        "role": "sailor",
        "desc": "어릴 때부터 부두 끝에서 수평선을 바라보던 항해사 지망생. 성인이 된 뒤에도 해도와 나침반을 손에서 놓지 않았다. {heir:과/와} 같은 배로 먼바다에 나설 날을 기다렸다.",
        "lines": [
          "m:수평선 너머를 직접 보려고 해도도 읽고 바람도 공부했어! 아직 배울 건 많지만 누구보다 먼저 갑판에 나갈 자신은 있어."
        ]
      },
      "knight": {
        "tag": "기사",
        "types": [
          "war"
        ],
        "role": "soldier",
        "desc": "작은 영지의 검술 수련을 마치고 독립한 기사. 지휘권이나 영지는 없지만 지킬 약속은 있다. 어린 날 골목을 함께 달리던 {heir}의 곁에서 검을 들기로 했다.",
        "lines": [
          "m:골목에서는 나무 칼이었지만 이젠 진짜 검을 맡길 수 있어. 거창한 영지보다 친구와 한 약속을 지키는 기사가 되고 싶어."
        ]
      },
      "noble": {
        "tag": "귀족 영애",
        "types": [
          "trade",
          "scholar"
        ],
        "role": "noble",
        "desc": "항구의 작은 향사 집안에서 자란 영애. 군주나 대귀족의 권력과는 관계없이, 장부와 외국말을 배웠다. 성인이 된 지금은 {heir:과/와}의 오랜 우정을 따라 스스로 항해를 택했다.",
        "lines": [
          "m:집에서 배운 말씨와 장부 보는 법도 바다에서 쓸모가 있겠지? 영애라는 호칭보다 네 곁에서 함께 일할 친구로 불러 줘."
        ]
      }
    },
    // 스무 해 뒤의 철새
    ret: {
      desc: '{adj} 출신이라는 떠돌이 {type}. 그 솜씨를 어디서 배웠는지는 좀처럼 말하지 않는다.',
      story: '{born}에서 왔다고만 한다. 스무 해쯤 전 {admiral}의 함대에 있던 {old:과/와} 꼭 닮았다는 말을 들으면, 웃기만 할 뿐 대답하지 않는다.',
      news: '철새 소식: {city}에 떠돌이 {type} {name:이/가} 나타났다 — 스무 해 전 배에서 내린 {old:과/와} 꼭 닮았다는 소문이다.'
    }
  };
  // 그림과 출신 양식은 한 쌍으로 저장한다. 옛 친족 저장에는 이 목록을 강제로 입히지 않는다.
  G.OLD_GUARD_FRIEND_LOOKS = [
    {
      "id": "cf_med_villager",
      "kind": "villager",
      "origin": "지중해",
      "styles": [
        "ib",
        "it",
        "gr"
      ],
      "face": "portraits/childhood-friends/cf_med_villager",
      "halfKey": "portraits/childhood-friends/cf_med_villager_half",
      "adult": true
    },
    {
      "id": "cf_med_sailor",
      "kind": "sailor",
      "origin": "지중해",
      "styles": [
        "ib",
        "it",
        "gr"
      ],
      "face": "portraits/childhood-friends/cf_med_sailor",
      "halfKey": "portraits/childhood-friends/cf_med_sailor_half",
      "adult": true
    },
    {
      "id": "cf_med_knight",
      "kind": "knight",
      "origin": "지중해",
      "styles": [
        "ib",
        "it",
        "gr"
      ],
      "face": "portraits/childhood-friends/cf_med_knight",
      "halfKey": "portraits/childhood-friends/cf_med_knight_half",
      "adult": true
    },
    {
      "id": "cf_med_noble",
      "kind": "noble",
      "origin": "지중해",
      "styles": [
        "ib",
        "it",
        "gr"
      ],
      "face": "portraits/childhood-friends/cf_med_noble",
      "halfKey": "portraits/childhood-friends/cf_med_noble_half",
      "adult": true
    },
    {
      "id": "cf_north_villager",
      "kind": "villager",
      "origin": "북유럽",
      "styles": [
        "ne",
        "ru"
      ],
      "face": "portraits/childhood-friends/cf_north_villager",
      "halfKey": "portraits/childhood-friends/cf_north_villager_half",
      "adult": true
    },
    {
      "id": "cf_north_sailor",
      "kind": "sailor",
      "origin": "북유럽",
      "styles": [
        "ne",
        "ru"
      ],
      "face": "portraits/childhood-friends/cf_north_sailor",
      "halfKey": "portraits/childhood-friends/cf_north_sailor_half",
      "adult": true
    },
    {
      "id": "cf_north_knight",
      "kind": "knight",
      "origin": "북유럽",
      "styles": [
        "ne",
        "ru"
      ],
      "face": "portraits/childhood-friends/cf_north_knight",
      "halfKey": "portraits/childhood-friends/cf_north_knight_half",
      "adult": true
    },
    {
      "id": "cf_north_noble",
      "kind": "noble",
      "origin": "북유럽",
      "styles": [
        "ne",
        "ru"
      ],
      "face": "portraits/childhood-friends/cf_north_noble",
      "halfKey": "portraits/childhood-friends/cf_north_noble_half",
      "adult": true
    },
    {
      "id": "cf_east_villager",
      "kind": "villager",
      "origin": "동아시아",
      "styles": [
        "cn",
        "kr",
        "jp"
      ],
      "face": "portraits/childhood-friends/cf_east_villager",
      "halfKey": "portraits/childhood-friends/cf_east_villager_half",
      "adult": true
    },
    {
      "id": "cf_east_sailor",
      "kind": "sailor",
      "origin": "동아시아",
      "styles": [
        "cn",
        "kr",
        "jp"
      ],
      "face": "portraits/childhood-friends/cf_east_sailor",
      "halfKey": "portraits/childhood-friends/cf_east_sailor_half",
      "adult": true
    },
    {
      "id": "cf_east_knight",
      "kind": "knight",
      "origin": "동아시아",
      "styles": [
        "cn",
        "kr",
        "jp"
      ],
      "face": "portraits/childhood-friends/cf_east_knight",
      "halfKey": "portraits/childhood-friends/cf_east_knight_half",
      "adult": true
    },
    {
      "id": "cf_east_noble",
      "kind": "noble",
      "origin": "동아시아",
      "styles": [
        "cn",
        "kr",
        "jp"
      ],
      "face": "portraits/childhood-friends/cf_east_noble",
      "halfKey": "portraits/childhood-friends/cf_east_noble_half",
      "adult": true
    },
    {
      "id": "cf_south_villager",
      "kind": "villager",
      "origin": "남아시아",
      "styles": [
        "in"
      ],
      "face": "portraits/childhood-friends/cf_south_villager",
      "halfKey": "portraits/childhood-friends/cf_south_villager_half",
      "adult": true
    },
    {
      "id": "cf_south_sailor",
      "kind": "sailor",
      "origin": "남아시아",
      "styles": [
        "in"
      ],
      "face": "portraits/childhood-friends/cf_south_sailor",
      "halfKey": "portraits/childhood-friends/cf_south_sailor_half",
      "adult": true
    },
    {
      "id": "cf_south_knight",
      "kind": "knight",
      "origin": "남아시아",
      "styles": [
        "in"
      ],
      "face": "portraits/childhood-friends/cf_south_knight",
      "halfKey": "portraits/childhood-friends/cf_south_knight_half",
      "adult": true
    },
    {
      "id": "cf_south_noble",
      "kind": "noble",
      "origin": "남아시아",
      "styles": [
        "in"
      ],
      "face": "portraits/childhood-friends/cf_south_noble",
      "halfKey": "portraits/childhood-friends/cf_south_noble_half",
      "adult": true
    },
    {
      "id": "cf_sea_villager",
      "kind": "villager",
      "origin": "동남아시아",
      "styles": [
        "se"
      ],
      "face": "portraits/childhood-friends/cf_sea_villager",
      "halfKey": "portraits/childhood-friends/cf_sea_villager_half",
      "adult": true
    },
    {
      "id": "cf_sea_sailor",
      "kind": "sailor",
      "origin": "동남아시아",
      "styles": [
        "se"
      ],
      "face": "portraits/childhood-friends/cf_sea_sailor",
      "halfKey": "portraits/childhood-friends/cf_sea_sailor_half",
      "adult": true
    },
    {
      "id": "cf_sea_knight",
      "kind": "knight",
      "origin": "동남아시아",
      "styles": [
        "se"
      ],
      "face": "portraits/childhood-friends/cf_sea_knight",
      "halfKey": "portraits/childhood-friends/cf_sea_knight_half",
      "adult": true
    },
    {
      "id": "cf_sea_noble",
      "kind": "noble",
      "origin": "동남아시아",
      "styles": [
        "se"
      ],
      "face": "portraits/childhood-friends/cf_sea_noble",
      "halfKey": "portraits/childhood-friends/cf_sea_noble_half",
      "adult": true
    },
    {
      "id": "cf_mena_villager",
      "kind": "villager",
      "origin": "서아시아·북아프리카",
      "styles": [
        "is",
        "pe"
      ],
      "face": "portraits/childhood-friends/cf_mena_villager",
      "halfKey": "portraits/childhood-friends/cf_mena_villager_half",
      "adult": true
    },
    {
      "id": "cf_mena_sailor",
      "kind": "sailor",
      "origin": "서아시아·북아프리카",
      "styles": [
        "is",
        "pe"
      ],
      "face": "portraits/childhood-friends/cf_mena_sailor",
      "halfKey": "portraits/childhood-friends/cf_mena_sailor_half",
      "adult": true
    },
    {
      "id": "cf_mena_knight",
      "kind": "knight",
      "origin": "서아시아·북아프리카",
      "styles": [
        "is",
        "pe"
      ],
      "face": "portraits/childhood-friends/cf_mena_knight",
      "halfKey": "portraits/childhood-friends/cf_mena_knight_half",
      "adult": true
    },
    {
      "id": "cf_mena_noble",
      "kind": "noble",
      "origin": "서아시아·북아프리카",
      "styles": [
        "is",
        "pe"
      ],
      "face": "portraits/childhood-friends/cf_mena_noble",
      "halfKey": "portraits/childhood-friends/cf_mena_noble_half",
      "adult": true
    },
    {
      "id": "cf_africa_villager",
      "kind": "villager",
      "origin": "아프리카",
      "styles": [
        "af",
        "sw"
      ],
      "face": "portraits/childhood-friends/cf_africa_villager",
      "halfKey": "portraits/childhood-friends/cf_africa_villager_half",
      "adult": true
    },
    {
      "id": "cf_africa_sailor",
      "kind": "sailor",
      "origin": "아프리카",
      "styles": [
        "af",
        "sw"
      ],
      "face": "portraits/childhood-friends/cf_africa_sailor",
      "halfKey": "portraits/childhood-friends/cf_africa_sailor_half",
      "adult": true
    },
    {
      "id": "cf_africa_knight",
      "kind": "knight",
      "origin": "아프리카",
      "styles": [
        "af",
        "sw"
      ],
      "face": "portraits/childhood-friends/cf_africa_knight",
      "halfKey": "portraits/childhood-friends/cf_africa_knight_half",
      "adult": true
    },
    {
      "id": "cf_africa_noble",
      "kind": "noble",
      "origin": "아프리카",
      "styles": [
        "af",
        "sw"
      ],
      "face": "portraits/childhood-friends/cf_africa_noble",
      "halfKey": "portraits/childhood-friends/cf_africa_noble_half",
      "adult": true
    },
    {
      "id": "cf_america_villager",
      "kind": "villager",
      "origin": "아메리카",
      "styles": [
        "co",
        "az",
        "an",
        "na",
        "tr"
      ],
      "face": "portraits/childhood-friends/cf_america_villager",
      "halfKey": "portraits/childhood-friends/cf_america_villager_half",
      "adult": true
    },
    {
      "id": "cf_america_sailor",
      "kind": "sailor",
      "origin": "아메리카",
      "styles": [
        "co",
        "az",
        "an",
        "na",
        "tr"
      ],
      "face": "portraits/childhood-friends/cf_america_sailor",
      "halfKey": "portraits/childhood-friends/cf_america_sailor_half",
      "adult": true
    },
    {
      "id": "cf_america_knight",
      "kind": "knight",
      "origin": "아메리카",
      "styles": [
        "co",
        "az",
        "an",
        "na",
        "tr"
      ],
      "face": "portraits/childhood-friends/cf_america_knight",
      "halfKey": "portraits/childhood-friends/cf_america_knight_half",
      "adult": true
    },
    {
      "id": "cf_america_noble",
      "kind": "noble",
      "origin": "아메리카",
      "styles": [
        "co",
        "az",
        "an",
        "na",
        "tr"
      ],
      "face": "portraits/childhood-friends/cf_america_noble",
      "halfKey": "portraits/childhood-friends/cf_america_noble_half",
      "adult": true
    }
  ];
})(window.G = window.G || {});
