/* 사파비 왕조의 성립(1501)과 찰디란 전투(1514) — 사람·소지품·조정값 (사건: js/systems/safavid.js) 2026-11-02 사용자 요청
   ■ 사람 (G.HIST_FIG): 이스마일 1세 · 셀림 1세 · 베흐루제 하눔 · 두르미시 칸 · 우스타질루의 무함마드 칸 · 베네치아 도제 로레단 · 수니파 노학자
     얼굴: images/portraits/history/<id>.webp (없으면 코드 초상)
   ■ 소지품: 하타이의 시집(sf_divan) · 샤의 편지(sf_letter — 팔 수 없다) · 원정군의 화약 궤짝(sf_powder — 팔 수 없다) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('sf_ismail', { name: '이스마일', title: '사파비 교단의 젊은 수장 · 샤', st: 'pe', role: 'noble', born: 1487, look: '10대 소년(1501) / 20대 후반(1514), 열두 주름이 진 붉은 막대의 키질바시 타지(터번), 붉은 수염, 금실 겉옷, 허리에 굽은 칼' });
  fig('sf_selim', { name: '셀림', title: '오스만 제국의 술탄 · 「야우즈(냉혹한 자)」', st: 'is', role: 'noble', born: 1470, look: '40대, 수염 없이 굵은 콧수염, 보석 박힌 흰 터번, 매서운 눈매, 붉은 카프탄' });
  fig('sf_behruzeh', { name: '베흐루제 하눔', title: '샤 이스마일의 아내', st: 'pe', role: 'noble', g: 'f', born: 1492, look: '20대 초반, 사슬 갑옷 위에 비단 망토, 얼굴을 반쯤 가린 베일, 말 위에 탄 여인' });
  fig('sf_durmish', { name: '두르미시 칸', title: '샤루의 키질바시 장수', st: 'pe', role: 'soldier', born: 1480, look: '30대, 붉은 타지, 거만한 웃음, 화려한 말 장식' });
  fig('sf_ustajlu', { name: '무함마드 칸 우스타질루', title: '디야르바크르의 키질바시 장수', st: 'pe', role: 'soldier', born: 1475, look: '40대, 붉은 타지, 흉터 진 얼굴, 오스만 군을 겪어 본 노련한 눈빛' });
  fig('sf_loredan', { name: '레오나르도 로레단', title: '베네치아 공화국의 도제', st: 'it', role: 'noble', born: 1436, look: '60대, 뿔 모양 도제 모자(코르노), 금실 망토, 흰 수염 — 벨리니가 그린 그 얼굴' });
  fig('sf_mulla', { name: '타브리즈의 노학자', title: '수니파 법학자', st: 'pe', role: 'scholar', born: 1440, fiction: true, look: '60대, 흰 터번과 흰 수염, 책을 품에 안은 떨리는 손' });
  G.SAFAVID_FIGS = ['sf_ismail', 'sf_selim', 'sf_behruzeh', 'sf_durmish', 'sf_ustajlu', 'sf_loredan', 'sf_mulla'];
  // 1501년의 소년과 1514년의 성인 샤를 구분한다. 사람 ID는 그대로 둔다.
  F.sf_ismail.youngFace = 'portraits/history/sf_ismail_young';
  F.sf_ismail.youngUntil = 1505;

  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'sf_divan', name: '하타이의 시집', kind: 'special', price: 0, reg: [], rare: true,
      desc: '샤 이스마일이 「하타이(죄 많은 자)」라는 이름으로 튀르크 말로 지은 시를 모은 필사본. 첫 장에 붉은 잉크로 「바다의 손님에게」라고 적혀 있다.' });
    add({ id: 'sf_letter', name: '샤 이스마일의 편지', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '사파비의 샤가 베네치아의 도제에게 보내는 편지. 「함께 오스만을 동과 서에서 치자, 그리고 그대들의 대포를 보내 달라」. 팔 수 없다 — 베니스에 전한다.' });
    add({ id: 'sf_powder', name: '원정군의 화약 궤짝', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '셀림의 동방 원정군에 보내는 화약과 납 탄환. 이스탄불 병기창의 봉인이 찍혀 있다. 팔 수 없다 — 트레비존드에 전한다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.safavid = G.BALANCE.safavid || {
    gift: 1000,              // ① 젊은 샤에게 바치는 선물
    letterGold: 2500,        // 베네치아 도제가 내리는 사례
    powderGold: 3000,        // 트레비존드에 화약을 전한 값
    bribe: 2000,             // ② 예니체리를 매수해 베흐루제를 빼낸다
    foe: { patrol: 18, battle: 80, rescue: 24 },
    fame: { friday: 60, letter: 120, battle: 160, rescue: 200, ottoman: 200 }
  };
})(window.G = window.G || {});
