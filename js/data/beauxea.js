/* 미남 항해사 — 동아시아 (사건: js/systems/beauxea.js) 2026-11-05 사용자 요청 「미남 항해사가 나오는 형태로 이벤트를 추가해줘」 (연애 없이 동료로만)
   ■ 동료 셋 (사건으로만 — eventOnly · wed: 'sea' — 연애 없음 — 바다와 혼인한 사람: js/systems/romance.js · js/city/matetalk.js 가 d.wed를 「이미 짝이 있다」로 본다)
     · 란(bx_ranmaru) — 모리 란마루. 노부나가의 시동. 혼노지의 불길에서 살아 나온 이름 없는 뱃사람 (지어낸 갈래 — 역사에서는 혼노지에서 죽었다)
     · 옥랑(bx_okrang) — 소주 곤곡 무대에서 『모란정』의 류몽매를 부르던 젊은 배우 (지어낸 인물)
     · 무진(bx_mujin) — 조선 통신사를 따라 에도에 간 마상재(말 위 곡예) 재인 (지어낸 인물)
   ■ 사람 (G.HIST_FIG): 오다 노부나가 · 아케치의 무사 · 소금 상인 왕 대인 · 곤곡 극단의 반주(班主) · 통신사 정사 · 쇼군의 근시
   ■ 얼굴: images/portraits/mates/bx_*.webp · _half.webp (없으면 코드 초상) — 개발노트의 그림 주문 */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('bx_nobunaga', { name: '오다 노부나가', title: '천하를 거의 손에 쥔 사내', st: 'jp', role: 'noble', born: 1534, face: 'portraits/legendary/oda_nobunaga', look: '40대 후반, 날카로운 콧수염, 흰 잠옷 위에 활을 든 모습, 불길을 등진 차가운 눈' });
  fig('bx_akechi', { name: '아케치의 무사', title: '도라지꽃 문장의 깃발 아래', st: 'jp', role: 'soldier', born: 1550, fiction: true, look: '30대, 도라지꽃 문장의 깃발을 등에 꽂은 갑옷 무사, 조총' });
  fig('bx_salt', { name: '왕 대인', title: '양주의 소금 상인 · 곤곡 극단의 후원자', st: 'cn', role: 'merchant', born: 1560, fiction: true, look: '40대, 살찐 얼굴, 비단 장포에 옥 반지 셋, 눈웃음 속의 집착' });
  fig('bx_banzhu', { name: '극단의 반주', title: '소주 곤곡 극단의 우두머리', st: 'cn', role: 'merchant', born: 1550, fiction: true, look: '50대, 부채를 쥔 마른 사내, 늘 계산하는 눈' });
  fig('bx_envoy', { name: '통신사 정사', title: '조선 통신사의 우두머리', st: 'kr', role: 'official', born: 1590, fiction: true, look: '40대, 사모관대, 단정한 수염, 일본 땅에서도 흐트러지지 않는 자세' });
  fig('bx_hatamoto', { name: '쇼군의 근시', title: '에도성의 하타모토', st: 'jp', role: 'soldier', born: 1610, fiction: true, look: '20대, 가몬이 찍힌 하오리, 칼 두 자루, 거만한 눈' });
  G.BEAUXEA_FIGS = ['bx_nobunaga', 'bx_akechi', 'bx_salt', 'bx_banzhu', 'bx_envoy', 'bx_hatamoto'];

  // ── 동료 (사건으로만 · 연애 없음)
  function mate(o) {
    o.tale = true; o.legend = true; o.fame = 0; o.wage = 0; o.reg = []; o.eventOnly = true;
    o.wed = 'sea';   // 연애 없음 — 바다와 혼인한 사람 (부하끼리의 썸·제독의 청혼 대상이 아니다)
    o.face = 'portraits/mates/' + o.id;
    if (G.MATES && G.MATE && !G.MATE[o.id]) { G.MATES.push(o); G.MATE[o.id] = o; }
  }
  mate({ id: 'bx_ranmaru', name: '란', g: 'm', style: 'jp', role: 'soldier', tone: 'noble', age: 'young', st: [66, 80, 72, 96], sk: { sword: 2, nav: 1, acct: 1, speech: 1 }, lg: { 13: 3, 1: 1 }, y: [1582, 1640],
    desc: '「란」이라고만 이름을 대는 열일곱 살의 젊은이. 먹으로 그린 듯한 눈썹과 눈매, 하얀 목덜미 — 그가 갑판을 지나가면 선원들이 하던 일을 잊는다. 그러나 장부를 펼치면 한 푼도 틀리지 않고, 칼을 뽑으면 아무도 웃지 않는다. 오른손등에 불에 덴 흉터가 있다. 한때 오다 노부나가의 시동 모리 란마루였다는 것은 제독만 안다.' });
  mate({ id: 'bx_okrang', name: '옥랑', g: 'm', style: 'cn', role: 'sailor', tone: 'charm', age: 'young', st: [52, 78, 46, 98], sk: { music: 3, speech: 2, nav: 1, survey: 1 }, lg: { 7: 3 }, y: [1599, 1650],
    desc: '소주 곤곡 무대에서 『모란정』의 서생 류몽매를 부르던 배우. 버들가지 같은 몸에 달처럼 흰 얼굴, 부채를 펼치면 객석의 숨이 멎는다는 그 미남이다. 노래 속에서만 바다를 보았다며 배에 올랐다. 별자리를 노랫말처럼 외워서 밤바다의 길을 잘 읽는다.' });
  mate({ id: 'bx_mujin', name: '무진', g: 'm', style: 'kr', role: 'sailor', tone: 'rush', age: 'young', st: [82, 62, 76, 92], sk: { nav: 2, survey: 1, sword: 1, ship: 1 }, lg: { 14: 3, 13: 1 }, y: [1636, 1690],
    desc: '조선 통신사를 따라 에도에 간 마상재 재인. 햇볕에 그을린 매끈한 얼굴에 웃으면 덧니가 보인다. 달리는 말 위에 거꾸로 서고 말 배 밑으로 몸을 숨기는 재주에 에도 사람들이 「조선의 하늘 사람」이라 불렀다. 흔들리는 갑판 위에서도 말 등처럼 중심을 잃지 않아, 돛대 꼭대기 망대를 도맡는다.' });

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.beauxEA = G.BALANCE.beauxEA || {
    honnoji: { from: 15820520, night: 15820621, foe: 30 },          // ① 교토 · 혼노지의 밤
    kunqu: { from: 15990101, to: 16201231, ransom: 2000, foe: 14 },  // ② 소주 · 몸값 · 왕 대인의 하인
    tsushinsa: [[16361101, 16370331], [16430701, 16431130], [16550901, 16560131]],   // ③ 통신사가 에도에 머문 때 (1636 · 1643 · 1655 — 마상재가 쇼군 앞에서 재주를 보인 해)
    horse: 1200,                                                     // ③ 다친 말 대신 사 줄 말 값
    fame: { ran: 160, ok: 100, mu: 100 }
  };
})(window.G = window.G || {});
