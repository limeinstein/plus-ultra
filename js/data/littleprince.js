/* 사막에서 만난 어린 왕자 (만나는 일은 js/systems/littleprince.js). 2026-10-24 사용자 요청
   · 명성 7만(G.BALANCE.littlePrince.minFame) 이상의 제독이 사막에서 야영하며 정찰하면, 모래 언덕 위에 혼자 선 배고픈 「어린 왕자」를 만난다. 소년 왕자로 다니는 여자이며, 마지막 우물가에서 이를 밝힌다.
     모닥불 곁에서 음식과 고기를 나누어 주면 그가 말하는 곳의 지도를 그려 달라고 하고, 지도를 받아 들고는 이 탐험이 재미있다며 동료가 된다.
     지도의 X(사막 속 숨은 우물)에 가면 금화 10만 닢의 보물.
   · 거대한 사막이 있는 땅의 말을 모두 안다: 아랍어(사하라·아라비아) · 아프리카토착어(사하라·칼라하리) · 페르시아어(이란 고원) · 힌두어(타르) ·
     위굴어·중국어(타클라마칸·고비) · 중남미토착어(아타카마) · 북미토착어(북미 서부의 사막) — 그리고 로망스어(그녀가 처음 배운 말)
   · 측량·항해·과학·조선기술 3 · 품삯은 이야기 동료 규칙(G.taleWage)
   · 생텍쥐페리의 『어린 왕자』(1943)에서 빌려 온 인물. 인물화와 사건 그림은 사용자가 제공한 푸른 꽃무늬 두건의 참고 사진을 바탕으로 새로 제작했다. */
(function (G) {
  'use strict';
  var m = { id: 'little_prince', name: '어린 왕자', g: 'm', style: 'ne', role: 'scholar', tone: 'shonen', age: 'young',
    st: [40, 88, 30, 92], sk: { survey: 3, nav: 3, sci: 3, ship: 3 }, skBoost: 1,
    lg: { 2: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 15: 3 },
    desc: '아주 작은 별에서 왔다는 「왕자」. 검은 머리 위로 푸른 꽃무늬 두건을 둘러쓰고 아이보리색 여행옷과 같은 꽃무늬 숄을 겹쳐 입었다. 곱상한 얼굴이지만 누구에게나 자신을 소년 왕자라고 소개하며, 까닭을 물으면 「우물을 찾으면 말해 줄게」라고만 한다. 사막 한가운데 모래 언덕 위에 혼자 서 있다가 제독의 정찰대를 만났다. 무엇이든 「왜?」라고 묻고, 대답을 들을 때까지 같은 질문을 놓지 않는다. 별을 보고 길을 찾고 바람의 냄새로 모래 폭풍을 알아채며, 배의 돛과 키를 한 번 보고는 어떻게 움직이는지 그림으로 그려 낸다. 숫자만 늘어놓는 어른의 지도는 싫어하고, 그림이 들어간 지도를 좋아한다. 해 지는 것을 보는 것을 무엇보다 좋아해서, 배 위에서도 해 질 녘이면 늘 고물에 앉아 있다.' };
  m.minor = true;   // 이야기 동료 — 부하끼리의 썸·청혼 대상이 아니다
  m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1480, 1700]; m.reg = []; m.eventOnly = true;
  m.face = 'portraits/legendary/little_prince'; m.halfKey = m.face + '_half';
  // 남장 여자: 우물가에서 밝히기 전에는 소년(m), 밝힌 뒤에는 소녀(f)로 다룬다.
  delete m.g;
  Object.defineProperty(m, 'g', { enumerable: true, configurable: true, get: function () { var s = G.Game && G.Game.state; return s && s.lprince && s.lprince.revealed ? 'f' : 'm'; } });
  m.descRevealed = '아주 작은 별에서 왔다는 「왕자」 — 사실은 소년 왕자로 다니던 소녀다. 혼자 여행하는 여자아이에게는 다들 「집에 가라」고만 하는데 왕자라고 하면 길을 물어봐 준다며, 별을 떠날 때부터 푸른 꽃무늬 두건으로 머리를 가리고 왕자라고 자신을 소개했다. 사막의 우물가에서 정체를 밝힌 뒤에도 「어린 왕자」라고 불러 달라며 아이보리색 여행옷과 푸른 숄도 그대로다.';
  var desc0 = m.desc; delete m.desc;
  Object.defineProperty(m, 'desc', { enumerable: true, configurable: true, get: function () { var s = G.Game && G.Game.state; return s && s.lprince && s.lprince.revealed ? m.descRevealed : desc0; } });
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  var B = G.BIOS = G.BIOS || {};
  if (!B['어린 왕자']) B['어린 왕자'] = '앙투안 드 생텍쥐페리의 이야기(1943)에 나오는 소년. 장미 한 송이가 있는 작은 별을 떠나 여러 별을 돌다 지구의 사막에 내려왔다. 사막에 불시착한 비행사에게 그림을 그려 달라고 조른 일로 시작되는 그 이야기를, 이 게임에서는 사막에서 야영하던 제독이 만난다.';
})(window.G = window.G || {});
