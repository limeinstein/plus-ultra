/* 두 왕자 — 「왕자와 거지」의 광해군과 「지킬과 하이드」의 임해군, 그리고 설화 (사건: js/systems/brothers.js) 2026-11-02 사용자 요청
   「광해군을 왕자와 거지에, 임해군을 지킬과 하이드로 — 두 형제의 비극을 이벤트로. 둘이 함께 마음이 가는 여자가 있다」
   ■ 사람 (G.HIST_FIG): 광해군(젊은 왕자 · 임금) · 임해군(낮) · 복면의 사내(임해군의 밤) · 선조 · 혜민서의 노의원 · 궁궐 수문장 · 교동도의 별장
     얼굴: images/portraits/history/<id>.webp (없으면 코드 초상) — 선조는 이미 있는 portraits/legendary/seonjo
   ■ 동료 (사건으로만 — eventOnly):
     · 설화(br_seolhwa) — 혜민서의 의녀. 허준에게 침과 약을 배웠다. 두 왕자가 함께 마음을 둔 여인 (지어낸 인물)
     · 막동(br_makdong) — 광해군과 똑같이 생긴 궁궐 담장 밑의 거지 소년 (지어낸 인물)
     · 임해(br_imhae) — 1592년 세자를 세우는 날, 왕자의 이름을 버리고 설화와 함께 제독의 배에 오른 맏왕자 (설화와 짝 — js/systems/brothers.js 가 wed를 정한다)
     · 광해(br_gwanghae) — 1623년, 거지가 대신 유배를 떠나면 「이름 없는 선비」로 제독의 배에 오른다 (wed: 이미 짝이 있다)
   ■ 소지품: 광해의 옥패(br_jade) · 두 형제의 편지(br_letter — 팔 수 없다) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('br_gwanghae', { name: '광해군', title: '선조의 둘째 왕자', st: 'kr', role: 'noble', born: 1575, look: '10대 중반(1590) / 30대(1608), 맑고 고집 센 눈, 흰 도포에 옥관자 — 왕위에 오른 뒤에는 붉은 곤룡포' });
  fig('br_imhae', { name: '임해군', title: '선조의 맏왕자', st: 'kr', role: 'noble', born: 1572, look: '10대 후반(1590) / 30대(1608), 창백하고 단정한 얼굴, 책을 든 손, 오른팔에 감은 흰 무명' });
  fig('br_hyde', { name: '복면의 사내', title: '한양 골목의 밤', st: 'kr', role: 'soldier', born: 1572, look: '검은 복면, 핏발 선 눈, 짐승처럼 웅크린 어깨, 비단 도포 자락이 찢긴 채' });
  fig('br_seonjo', { name: '선조', title: '조선의 임금', st: 'kr', role: 'noble', born: 1552, face: 'portraits/legendary/seonjo', look: '30대 후반, 곤룡포, 의심 많은 눈' });
  fig('br_oldmed', { name: '혜민서의 노의원', title: '가난한 사람을 돌보는 혜민서의 의원', st: 'kr', role: 'scholar', born: 1530, fiction: true, look: '60대, 흰 수염, 약 냄새 밴 소매' });
  fig('br_guard', { name: '궁궐 수문장', title: '돈화문을 지키는 장수', st: 'kr', role: 'soldier', born: 1550, fiction: true, look: '40대, 붉은 철릭, 창을 든 무뚝뚝한 얼굴' });
  fig('br_jailer', { name: '교동도의 별장', title: '임해군을 지키는 수비 장수', st: 'kr', role: 'soldier', born: 1570, fiction: true, look: '30대, 거친 수염, 조정의 밀지를 품은 눈' });
  G.BROTHERS_FIGS = ['br_gwanghae', 'br_imhae', 'br_hyde', 'br_seonjo', 'br_oldmed', 'br_guard', 'br_jailer'];
  // 같은 인물의 얼굴상·무릎상을 함께 바꾼다. 청년 왕자, 임금, 이름 없는 선비를 섞지 않는다.
  F.br_gwanghae.periodFaces = [
    { from: 1608, face: 'portraits/history/br_gwanghae_king' },
    { from: 1623, face: 'portraits/legendary/br_gwanghae_exile' }
  ];
  F.br_imhae.periodFaces = [{ from: 1600, face: 'portraits/history/br_imhae_late' }];

  // ── 동료 (사건으로만)
  function mate(o) {
    o.tale = true; o.legend = true; o.fame = 0; o.wage = 0; o.reg = []; o.eventOnly = true;
    if (G.MATES && G.MATE && !G.MATE[o.id]) { G.MATES.push(o); G.MATE[o.id] = o; }
  }
  mate({ id: 'br_seolhwa', name: '설화', g: 'f', style: 'kr', role: 'maid', tone: 'polite', age: 'young', st: [48, 82, 30, 84], sk: { med: 3, cook: 1, music: 1 }, skBoost: 1, lg: { 14: 3, 7: 1 }, y: [1591, 1660],
    desc: '혜민서의 의녀. 어려서 부모를 돌림병에 잃고 혜민서에서 자랐다. 허준에게 침과 약을 배웠다. 가난한 사람의 상처를 싸매 주던 손으로, 한 사람은 거지 옷을 입은 왕자의 손을, 한 사람은 밤마다 피 묻은 왕자의 팔을 잡았다. 「설화(雪花)」 — 눈꽃이라는 뜻이다.' });
  mate({ id: 'br_makdong', name: '막동', g: 'm', style: 'kr', role: 'sailor', tone: 'rush', age: 'young', st: [62, 58, 56, 72], sk: { speech: 2, ops: 1, sword: 1 }, lg: { 14: 3 }, y: [1591, 1660],
    desc: '궁궐 담장 밑에서 동냥하던 거지 소년. 둘째 왕자와 얼굴이 쌍둥이처럼 똑같아, 하루 동안 왕자의 옷을 입고 궁궐에서 살았다. 그날 이후로 「왕자님」이라 불리면 귀까지 빨개진다. 말솜씨 하나로 장터의 엿장수도 웃긴다.' });
  mate({ id: 'br_imhae', name: '임해', g: 'm', style: 'kr', role: 'soldier', tone: 'noble', age: 'young', st: [74, 80, 78, 66], sk: { sword: 2, hist: 2, music: 1 }, lg: { 14: 3, 7: 2 }, y: [1592, 1650],
    desc: '「이름 없는 사내」라고만 하는 창백한 선비. 낮에는 시를 읽고 거문고를 뜯는다. 오른팔에 오래된 침 자국이 있고, 화가 치밀면 스스로 바닷물에 머리를 담근다. 한때 한 나라의 맏왕자였고 밤마다 짐승이 되었다는 것은 설화와 제독만 안다.' });
  mate({ id: 'br_gwanghae', name: '광해', g: 'm', style: 'kr', role: 'scholar', tone: 'noble', age: 'mid', st: [58, 86, 62, 84], sk: { ops: 2, acct: 2, speech: 2, hist: 1 }, lg: { 14: 3, 7: 2 }, y: [1623, 1650], wed: 'queen_yu',
    desc: '「이름 없는 선비」라고만 자신을 소개하는 중년의 사내. 명과 후금 사이의 셈법을 손바닥 보듯 꿰고, 전란에 불탄 궁궐과 『동의보감』 이야기를 할 때는 목이 멘다. 한때 한 나라의 임금이었다는 것은 막동과 제독만 안다.' });
  if (G.MATE) {
    G.MATE.br_seolhwa.face = 'portraits/legendary/br_seolhwa';
    G.MATE.br_gwanghae.face = 'portraits/legendary/br_gwanghae_exile';
    G.MATE.br_imhae.face = 'portraits/history/br_imhae_late';
    G.MATE.br_imhae.youngFace = 'portraits/history/br_imhae';
    G.MATE.br_imhae.youngUntil = 1599;
    G.MATE.br_makdong.face = 'portraits/history/br_makdong_old';
    G.MATE.br_makdong.youngFace = 'portraits/legendary/br_makdong';
    G.MATE.br_makdong.youngUntil = 1599;
  }

  // ── 소지품
  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'br_jade', name: '광해의 옥패', kind: 'special', price: 0, reg: [], rare: true,
      desc: '「琿」 — 광해군의 이름 글자를 새긴 흰 옥패. 거지 옷을 입고 궁 밖에 나섰던 날, 진짜 왕자임을 밝혀 준 물건이다. 왕자가 「그대가 가지시오, 내가 거지였던 하루를 잊지 않게」라며 주었다.' });
    add({ id: 'br_letter', name: '두 형제의 편지', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '임금이 된 동생이 귀양 간 형에게 몰래 쓴 편지, 그리고 그 뒷장에 형이 남긴 답. 팔 수 없다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.brothers = G.BALANCE.brothers || {
    gap: 20,                 // ① 뒤 ② 까지 (날)
    guardFoe: 12,            // ① 담을 넘을 때 궁궐 군사
    escortFoe: 20,           // ④ 교동도의 수비군
    bribe: 1500,             // ④ 교동도 별장을 매수
    fame: { swap: 80, night: 60, leave: 150, kyodong: 150, last: 200 }
  };
})(window.G = window.G || {});
