/* 서유기 — 네 아가씨의 천축 길 (사건은 js/systems/xiyou.js · G.XiYou). 2026-11-13 사용자 요청
   조선 · 명 · 왜(일본) · 몽골에서 온 네 사람이 각자 삼장법사 · 손오공 · 사오정 · 저팔계를 맡아 인도(천축)까지 간다. 넷 모두 성인(스무 살 남짓)이다.
     최미수 (삼장법사) — 조선 통신사를 따라 불경 수송을 맡은 조선 관리의 딸. 석장과 염주, 모든 것을 꿰뚫어 보는 듯한 미소
     유키노 (손오공) — 몰락한 일본 무사의 딸. 절에서 훔친 금테(긴고아)가 머리에서 빠지지 않아, 미수가 경을 외면 머리를 싸쥐고 쩔쩔맨다. 양갈래 머리 · 목에 두른 호랑이 꼬리
     뭉군 (사오정) — 몽골 출신 말 장수의 딸. 말을 잘 타고, 늘 나비가 주위를 맴돈다. 말을 자꾸 잘못 알아듣는다(사오정)
     나잉 (저팔계) — 항주 식당 주인의 딸. 먹을 것 앞에서는 앞뒤를 가리지 않는다. 쇠스랑 대신 큰 국자와 식칼
   ■ 열리는 때: 조선 통신사 이벤트가 생긴 뒤(에도의 마상재를 겪었거나 1637년 봄 첫 통신사 기간이 지나간 뒤)
     + 「인도항로」를 찾았고 + 중국 · 조선 · 일본에서 발견물을 하나씩 이상 찾았을 때 — 사카이에서 시작한다
   ■ 길: 사카이(미수 · 유키노) → 항주(뭉군 · 나잉, 보물 지도) → [곁길: 화과산 수렴동 — 연운항 앞바다] → 아유타야(사라진 나잉)
         → 말라카(납치된 나잉: 산적 두목 → 말라카 해협의 왜구) → 캘리컷(카레 잔치 → 넷 모두 동료)
   그림: images/legend-events/XIYOU_PROMPT.md — 동료 portraits/legendary/<id> · 인물 portraits/history/xy_* · 장면 legend-events/xy_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.xiyou = G.BALANCE.xiyou || {
    envoyFrom: 16370331,                       // 첫 조선 통신사(에도의 마상재 1636.11~1637.3)가 지나간 뒤 — 또는 그 사건을 겪었으면
    sakai: 192, hangzhou: 177, ayutthaya: 162, malacca: 160, india: [152, 154, 150],   // 캘리컷 · 코친 · 고아
    ronin: 30,                                  // 사카이 — 낭인 패거리 (뭍의 싸움)
    payRonin: 1500,
    speech: 2,                                  // 항주 — 건달들을 말로 쫓는다 (웅변)
    thugs: 24,
    huaguo: { box: [119.45, 120.9, 34.2, 35.3], gold: 20000, food: 2 },   // 화과산 수렴동 — 연운항 앞바다
    search: 1000,                               // 아유타야 — 뱃사공들에게 수로를 뒤지게 한다
    stall: 300,                                 // 나잉이 먹어 치운 꼬치 값
    bandit: 45,                                 // 말라카 — 흑풍대왕(산적 두목)
    wokou: { box: [100.9, 102.2, 1.6, 2.7], ships: ['sekibune', 'kobaya', 'kobaya', 'junk'], gold: 15000, fame: 900 },
    again: 30,                                  // 왜구에게 지거나 물러나면 이만큼 뒤에 다시
    decline: 180,
    loyal: 88
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  // 동료 넷 — 동료가 되기 전에도 같은 얼굴로 선다
  fig('xy_misu', { name: '최미수', title: '조선 관리의 딸 · 불경을 지키는 사람', st: 'kr', g: 'f', role: 'priest', born: 1616, face: 'portraits/legendary/xy_misu', look: '(동료 초상 portraits/legendary/xy_misu)' });
  fig('xy_yukino', { name: '유키노', title: '몰락한 무사의 딸', st: 'jp', g: 'f', role: 'soldier', born: 1618, face: 'portraits/legendary/xy_yukino', look: '(동료 초상 portraits/legendary/xy_yukino)' });
  fig('xy_mungun', { name: '뭉군', title: '몽골 말 장수의 딸', st: 'cn', g: 'f', role: 'merchant', born: 1617, face: 'portraits/legendary/xy_mungun', look: '(동료 초상 portraits/legendary/xy_mungun)' });
  fig('xy_naing', { name: '나잉', title: '항주 식당 주인의 딸', st: 'cn', g: 'f', role: 'merchant', born: 1618, face: 'portraits/legendary/xy_naing', look: '(동료 초상 portraits/legendary/xy_naing)' });
  // 이야기 속 사람들 (지어낸 인물)
  fig('xy_choi', { name: '최 역관', title: '통신사의 불경 수송을 맡은 조선 관리 · 미수의 아버지', st: 'kr', role: 'official', born: 1585, fiction: true,
    look: '50대, 갓과 도포, 단정한 흰 수염, 손에 불경 목록을 적은 두루마리, 딸을 걱정하는 눈' });
  fig('xy_ronin', { name: '낭인 두목', title: '사카이의 낭인 패거리 우두머리', st: 'jp', role: 'soldier', born: 1600, fiction: true,
    look: '30대, 덥수룩한 수염, 해진 하카마, 허리에 큰 칼, 비뚜름한 웃음' });
  fig('xy_hangzhou_boss', { name: '소금 상인의 건달 두목', title: '항주 서호 거리의 건달', st: 'cn', role: 'soldier', born: 1605, fiction: true,
    look: '30대, 기름진 얼굴, 비단 옷에 금 반지, 부채를 든 손, 뒤에 몽둥이 든 졸개들' });
  fig('xy_blackwind', { name: '흑풍대왕', title: '말라카 밀림의 산적 두목', st: 'se', role: 'soldier', born: 1600, fiction: true,
    look: '40대, 곰 같은 덩치, 검은 털가죽 망토, 검게 칠한 얼굴, 손에 큰 창, 목에 짐승 이빨 목걸이' });
  fig('xy_wokou', { name: '왜구 두목 구로나미', title: '말라카 해협의 왜구 두목', st: 'jp', role: 'soldier', born: 1605, fiction: true,
    look: '40대, 사카야키 머리가 반쯤 자란 거친 얼굴, 칼자국, 낡은 갑옷 조각, 허리에 두 자루 칼, 손에 화승총' });
  fig('xy_cook', { name: '캘리컷의 카레 할머니', title: '말라바르 해안 부엌의 주인', st: 'in', g: 'f', role: 'merchant', born: 1570, fiction: true,
    look: '70대, 하얗게 센 머리를 틀어 올림, 노란 사리, 이마의 붉은 점, 손에 향신료 접시, 다정한 주름' });
  G.XIYOU_FIGS = ['xy_misu', 'xy_yukino', 'xy_mungun', 'xy_naing', 'xy_choi', 'xy_ronin', 'xy_hangzhou_boss', 'xy_blackwind', 'xy_wokou', 'xy_cook'];

  // ---------------------------------------------------------------- 동료 넷 — 술집에는 나오지 않고 사건으로만
  var M = [
    { id: 'xy_misu', name: '최미수', short: '미수', g: 'f', style: 'kr', role: 'priest', tone: 'polite', pic: 'xy_misu', age: 'young',
      st: [50, 88, 34, 94], sk: { theo: 3, survey: 3, speech: 2, hist: 2, med: 1 }, skBoost: 1, lg: { 14: 3, 13: 3, 7: 3, 9: 3, 8: 3 },   // 조선어·일본어·중국어·위구르어·힌두어 3 (2026-11-14)
      desc: '(삼장법사) 조선 통신사를 따라 불경 수송을 맡은 관리 최 역관의 딸. 석장을 짚고 염주를 감은 손으로 합장하며, 모든 것을 꿰뚫어 보는 듯한 미소를 짓는다. 겁이 없다기보다 겁낼 줄을 모르고, 위험 앞에서도 「인연이지요」 하고 웃는다. 그녀가 경을 외기 시작하면 유키노의 금테가 조여 든다. 일본에 실어 간 불경에 빠진 마지막 권을 찾으러 천축까지 가겠다고 나섰다.' },
    { id: 'xy_yukino', name: '유키노', short: '유키노', g: 'f', style: 'jp', role: 'soldier', tone: 'rush', pic: 'xy_yukino', age: 'young',
      st: [82, 58, 92, 80], sk: { sword: 3, gun: 2, shoot: 1, ops: 1 }, skBoost: 1, lg: { 14: 2, 13: 3, 7: 1, 9: 1 },   // 조선어 2 · 일본어 3 · 중국어 1 · 위구르어 1 (2026-11-14)
      desc: '(손오공) 몰락한 무사 집안의 딸. 양갈래로 묶은 머리에 호랑이 꼬리를 목도리처럼 두르고 다닌다. 절에서 「금이니까」 하고 훔쳐 쓴 금테(긴고아)가 머리에서 빠지지 않아, 미수가 경을 외면 머리를 싸쥐고 데굴데굴 구른다. 지붕에서 지붕으로 뛰고 칼은 바람보다 빠르지만, 미수 앞에서만은 쩔쩔맨다. 「스, 스님… 아니 아가씨, 그 경만은 제발!」' },
    { id: 'xy_mungun', name: '뭉군', short: '뭉군', g: 'f', style: 'cn', role: 'merchant', tone: 'cute', pic: 'xy_mungun', age: 'young',
      st: [80, 60, 74, 82], sk: { gun: 3, ship: 3, ops: 2, survey: 2, sci: 2, nav: 1, shoot: 1, sword: 1 }, skBoost: 1, lg: { 14: 2, 13: 1, 7: 1, 9: 3 },   // 조선어 2 · 일본어 1 · 중국어 1 · 위구르어 3 (2026-11-14)
      desc: '(사오정) 몽골 출신 말 장수의 딸. 이름은 몽골말로 「은」. 말 위에서 태어났다는 말을 들을 만큼 말을 잘 타고, 짐을 가장 많이 지고도 지치지 않는다. 어디를 가든 나비가 주위를 아른거린다. 다만 남의 말을 자꾸 엉뚱하게 알아듣는다 — 「천축 간다고? 천 마리 가축을 사러 간다고?」' },
    { id: 'xy_naing', name: '나잉', short: '나잉', g: 'f', style: 'cn', role: 'merchant', tone: 'charm', pic: 'xy_naing', age: 'young',
      st: [78, 62, 70, 86], sk: { cook: 3, sci: 3, acct: 1, sword: 1 }, skBoost: 1, lg: { 14: 2, 13: 1, 7: 3, 9: 1, 12: 1 },   // 조선어 2 · 일본어 1 · 중국어 3 · 위구르어 1 (2026-11-14)
      desc: '(저팔계) 항주 서호 가의 식당 「팔보루」 주인의 딸. 앞치마를 두르고 큰 국자와 식칼을 허리에 차고 다니며, 쇠스랑 대신 국자로 건달을 때려눕힌다. 먹을 것 앞에서는 앞뒤를 가리지 않아 툭하면 사라지고, 그 바람에 납치까지 당한다. 그래도 그녀가 끓인 국 한 그릇이면 배 전체가 웃는다. 천축에 간 까닭은 오직 하나, 「세상에서 제일 매운 국물」.' }
  ];
  M.forEach(function (m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.halfKey = m.face + '_half'; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });

  var IT = [
    { id: 'xy_last_sutra', name: '빠진 마지막 권의 빈 두루마리', kind: 'book', gv: 30, desc: '천축에서 미수가 받아 든 마지막 권. 펼쳐 보니 글자가 한 자도 없다. 미수는 웃으며 말했다. 「무자진경(無字眞經) — 글 없는 경이 참된 경이지요. 여기까지 오는 길이 곧 그 글이었어요.」' },
    { id: 'xy_golden_staff', name: '수렴동의 금테 쇠막대', gv: 32, desc: '화과산 수렴동의 폭포 뒤 동굴에서 찾은, 양 끝에 금테를 두른 무거운 쇠막대. 유키노가 「내 거!」라며 휘두르다가 미수의 경 한 마디에 얌전히 내려놓았다.' },
    { id: 'xy_butterfly_pin', name: '나비 머리꽂이', gv: 20, desc: '뭉군의 주위를 맴돌던 나비를 본떠 만든 은 머리꽂이. 나잉을 찾던 아유타야의 물길에서 나비가 앉았던 자리에 떨어져 있었다.' },
    { id: 'xy_curry_recipe', name: '말라바르 카레 비법서', gv: 26, desc: '캘리컷의 카레 할머니가 나잉에게 건넨 향신료 배합 쪽지. 나잉은 이것을 받고 울었다. 「사부님…!」' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) {
    if (G.ITEM[x.id]) return;
    var it = { id: x.id, name: x.name, kind: x.kind || 'keepsake', price: 0, gv: x.gv, reg: [], desc: x.desc };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  });
})(window.G = window.G || {});
