/* 제독의 LV3 특기 세 가지가 만나 열리는 숨은 능력.
   저장값을 따로 만들지 않고 제독 자신의 p.sk만 보고 매번 계산하므로 옛 저장도 곧바로 적용된다. */
(function (G) {
  'use strict';
  var C = {};
  G.SkillCombos = C;

  C.ALL = [
    { id: 'invincible', name: '무적제독', sk: ['sword', 'shoot', 'gun'], desc: '육상전에서 아군이 주는 피해 +10%.', fx: { landPower: 0.10 } },
    { id: 'survivor', name: '생존전문가', sk: ['nav', 'ops', 'med'], desc: '육상 이동 경비 −15%, 육상 피로 증가 −10%.', fx: { landCost: -0.15, landFatigue: -0.10 } },
    { id: 'mafia', name: '마피아', sk: ['speech', 'acct', 'sword'], desc: '흥정과 빚 독촉 성공률 +6%p.', fx: { haggle: 0.06, debt: 0.06 } },
    { id: 'saint', name: '성녀탄생', sk: ['theo', 'med', 'music'], desc: '육상 질병 위험 −15%, 항해 중 규율 하락 −10%.', fx: { landSick: -0.15, disciplineLoss: -0.10 } },
    { id: 'navigator', name: '대항해사', sk: ['nav', 'ops', 'survey'], desc: '함대 항해 속도 +5%.', fx: { seaSpeed: 0.05 } },
    { id: 'iron_fleet', name: '철갑함대장', sk: ['gun', 'ship', 'ops'], desc: '함포 피해 +6%, 바다 위 수리량 +10%.', fx: { cannonPower: 0.06, repairPower: 0.10 } },
    { id: 'marine', name: '해병사령관', sk: ['sword', 'shoot', 'ops'], desc: '육상전 피해 +5%, 아군 피해 −8%.', fx: { landPower: 0.05, landLoss: -0.08 } },
    { id: 'storm', name: '폭풍추적자', sk: ['nav', 'ship', 'sci'], desc: '폭풍 피해 −15%, 함대 항해 속도 +2%.', fx: { stormDamage: -0.15, seaSpeed: 0.02 } },
    { id: 'merchant', name: '대상인', sk: ['acct', 'speech', 'survey'], desc: '교역품 구입가 −2%, 매각가 +2%.', fx: { buyPrice: -0.02, sellPrice: 0.02 } },
    { id: 'treasure', name: '보물박사', sk: ['hist', 'craft', 'survey'], desc: '발견물 가치와 발견 명성 +6%.', fx: { discoveryReward: 0.06 } },
    { id: 'renaissance', name: '르네상스인', sk: ['hist', 'sci', 'art'], desc: '발견물 가치와 발견 명성 +5%.', fx: { discoveryReward: 0.05 } },
    { id: 'physician', name: '명의', sk: ['med', 'sci', 'cook'], desc: '육상 질병 위험 −20%, 육상 피로 증가 −5%.', fx: { landSick: -0.20, landFatigue: -0.05 } },
    { id: 'idol', name: '선원들의 우상', sk: ['music', 'speech', 'theo'], desc: '항해 중 규율 하락 −15%.', fx: { disciplineLoss: -0.15 } },
    { id: 'diplomat', name: '왕실외교관', sk: ['speech', 'hist', 'theo'], desc: '흥정과 빚 독촉 성공률 +4%p, 매각가 +1%.', fx: { haggle: 0.04, debt: 0.04, sellPrice: 0.01 } },
    { id: 'polymath', name: '만물학자', sk: ['hist', 'sci', 'theo'], desc: '발견물 가치와 발견 명성 +4%, 육상 질병 위험 −5%.', fx: { discoveryReward: 0.04, landSick: -0.05 } },
    { id: 'master', name: '거장', sk: ['craft', 'art', 'hist'], desc: '발견물 가치와 발견 명성 +4%, 교역품 매각가 +1%.', fx: { discoveryReward: 0.04, sellPrice: 0.01 } },
    { id: 'sea_wolf', name: '바다의 늑대', sk: ['nav', 'sword', 'gun'], desc: '함대 항해 속도 +2%, 해전 백병전 공격력 +8%.', fx: { seaSpeed: 0.02, boardingPower: 0.08 } },
    { id: 'marksman', name: '백발백중', sk: ['shoot', 'gun', 'survey'], desc: '함포 명중률 +5%, 함포 피해 +4%.', fx: { cannonAccuracy: 0.05, cannonPower: 0.04 } },
    { id: 'quartermaster', name: '병참의 달인', sk: ['acct', 'ops', 'cook'], desc: '식량·물 소비 −8%, 육상 이동 경비 −8%.', fx: { supplyUse: -0.08, landCost: -0.08 } },
    { id: 'shipwright', name: '조선왕', sk: ['ship', 'craft', 'sci'], desc: '바다 위 수리량 +15%, 폭풍 피해 −5%.', fx: { repairPower: 0.15, stormDamage: -0.05 } }
  ];

  function own(id) {
    var s = G.Game && G.Game.state, p = s && s.player;
    return p && p.sk ? p.sk[id] || 0 : 0;
  }
  C.has = function (combo) {
    if (typeof combo === 'string') combo = C.ALL.filter(function (x) { return x.id === combo; })[0];
    return !!combo && combo.sk.every(function (id) { return own(id) >= 3; });
  };
  C.active = function () { return C.ALL.filter(C.has); };
  C.CAPS = {
    landPower: [0.8, 1.15], landCost: [0.75, 1.2], landFatigue: [0.8, 1.2], landLoss: [0.85, 1.2], landSick: [0.7, 1.2],
    seaSpeed: [0.9, 1.08], stormDamage: [0.75, 1.2], repairPower: [0.8, 1.20], cannonPower: [0.8, 1.10], cannonAccuracy: [0.8, 1.05],
    boardingPower: [0.8, 1.08], supplyUse: [0.85, 1.2], disciplineLoss: [0.75, 1.2], buyPrice: [0.96, 1.1], sellPrice: [0.9, 1.04],
    discoveryReward: [0.9, 1.15], haggle: [1, 1.08], debt: [1, 1.08]
  };
  C.factor = function (key) {
    var add = C.active().reduce(function (n, x) { return n + ((x.fx && x.fx[key]) || 0); }, 0);
    var cap = C.CAPS[key] || [0.8, 1.2];
    return Math.max(cap[0], Math.min(cap[1], 1 + add));
  };
  C.bonus = function (key) { return C.factor(key) - 1; };
  C.skillNames = function (x) { return x.sk.map(function (id) { return G.SKILL_BY_ID[id].name + ' LV3'; }).join(' + '); };
  C.html = function () {
    var a = C.active();
    if (!a.length) return '<p class="muted" style="margin:6px 0 0">제독 본인이 서로 맞는 특기 세 가지를 LV3까지 익히면 숨은 능력이 드러납니다.</p>';
    return '<div class="skill-combos">' + a.map(function (x) {
      return '<div class="card" title="' + G.U.esc(C.skillNames(x)) + '"><b>' + G.U.esc(x.name) + '</b><small>' + G.U.esc(x.desc) + '</small></div>';
    }).join('') + '</div>';
  };
})(window.G);
