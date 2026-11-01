/* 정묘호란·병자호란 — 남한산성의 마흔엿새 (사건: js/systems/horan.js). 2026-11-01 사용자 요청
   「정묘호란·병자호란 — 후금과 청이 조선을 침공. 병자호란 이후 플레이어가 개입하여 삼전도의 굴욕을 피할 수도 있게」
   ■ 사람(대화에 세우는 실존 인물 — G.HIST_FIG): 인조 · 김상헌 · 홍타이지 · 용골대(잉굴다이) · 봉림대군 · 정봉수 · 김경징 · 아민
     얼굴: images/portraits/history/<id>.webp (없으면 코드 초상)
   ■ 동료: 최명길(h_choemyeonggil)·임경업(h_imgyeongeop)은 원래 있던 지역 사람(js/data/regionfolk.js) — 굴욕을 피한 결말에서 배에 태울 수 있다
   ■ 날짜는 게임의 양력 (음력 1636.12.9 압록강 → 양력 1637.1.4 · 음력 1637.1.30 삼전도 → 양력 1637.2.24) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('injo', { name: '인조', title: '조선의 임금', st: 'kr', role: 'noble', born: 1595, look: '40대 초반, 해진 곤룡포 위에 털옷, 수척한 얼굴, 남한산성 행궁의 등잔 아래' });
  fig('kimsangheon', { name: '김상헌', title: '예조 판서 — 척화의 대신', st: 'kr', role: 'official', born: 1570, look: '60대, 흰 수염, 꼿꼿한 등, 손에 찢어진 국서' });
  fig('hongtaiji', { name: '홍타이지', title: '청의 황제 (숭덕제)', st: 'cn', role: 'noble', born: 1592, look: '40대 중반, 변발, 누런 비단 갑옷, 탄천 가 황옥 장막 안의 높은 자리' });
  fig('yonggoldae', { name: '용골대', title: '청의 장수 (잉굴다이)', st: 'cn', role: 'soldier', born: 1596, look: '40대, 변발, 털 달린 투구, 조선 말을 조금 하는 사신 겸 장수' });
  fig('bongrim', { name: '봉림대군', title: '임금의 둘째 아들', st: 'kr', role: 'noble', born: 1619, look: '열여덟 살, 갑옷 위에 도포, 강화도 갑곶 나루의 젊은 왕자' });
  fig('jeongbongsu', { name: '정봉수', title: '용골산성의 의병장', st: 'kr', role: 'soldier', born: 1572, look: '50대, 낡은 철릭, 활을 멘 늙은 무관, 산성 성벽 위' });
  fig('kimgyeongjing', { name: '김경징', title: '강화도 검찰사', st: 'kr', role: 'official', born: 1589, look: '40대 후반, 비단 도포, 술잔, 「강화는 하늘이 낸 요새」라 자신하는 얼굴' });
  fig('amin', { name: '아민', title: '후금의 패륵 (정묘년 침공의 대장)', st: 'cn', role: 'soldier', born: 1586, look: '40대, 변발, 털옷 위 갑옷, 말 위에서 내려다보는 눈' });
  G.HORAN_FIGS = ['injo', 'kimsangheon', 'hongtaiji', 'yonggoldae', 'bongrim', 'jeongbongsu', 'kimgyeongjing', 'amin'];

  // ── 조정값
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.horan = G.BALANCE.horan || {
    foodCost: 2000,                 // 남한산성에 들일 군량 값 (수원·남양의 마을에서 사 모은다)
    foe: { yonggol: 36, namhan: 50, baekma: 40 },   // 육상전 적의 수
    retry: 10,                      // 남한산성 군량 길에서 지면 다시 나설 수 있는 날수
    need: 2,                        // 굴욕을 피하려면: 강화도를 지키고(필수) 세 가지 가운데 이만큼 해내야
    fame: { ferry: 80, yonggol: 120, food: 160, ganghwa: 260, baekma: 140, talk: 400 }
  };
})(window.G = window.G || {});
