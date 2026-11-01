/* 후금 건국·청 국호 선포 (사건: js/systems/houjin.js). 2026-11-01 사용자 요청
   「1616 / 1636 후금 건국·청 국호 선포 — 누르하치가 후금을 세우고, 홍타이지가 국호를 청으로 바꾸며 중국 정복을 추진」
   ■ 사람(G.HIST_FIG): 누르하치 · 홍타이지 · 원숭환의 군관 · 보카로(오문의 대포 주조장) · 나덕헌(조선 사신) · 북경 옥리
     얼굴: portraits/history/<id> (없으면 코드 초상)
   ■ 동료: 원숭환 h_yuanchonghuan (원래 있던 지역 사람 — js/data/regionfolk.js). 1630년 북경 감옥에서 빼내면 동료로
   ■ 소지품: houjin_cannon 홍이포(오문의 포르투갈 대포) · houjin_seal 후금 칸의 통행 패 */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('hj_nurhaci', { name: '누르하치', title: '건주여진의 칸 · 후금의 천명 칸', st: 'st', role: 'noble', born: 1559, look: '50대 후반, 정수리를 밀고 뒷머리를 땋은 변발, 담비 털옷, 팔기의 노란 깃발' });
  fig('hj_hongtaiji', { name: '홍타이지', title: '후금의 칸 · 대청의 황제', st: 'st', role: 'noble', born: 1592, look: '40대, 다부진 몸집, 변발, 용을 수놓은 짙은 남색 비단옷' });
  fig('hj_officer', { name: '원숭환의 군관', title: '영원성 수비군의 천총', st: 'cn', role: 'soldier', fiction: true, look: '30대, 명나라 군관 갑옷, 화약에 그을린 얼굴' });
  fig('hj_yuan', { name: '원숭환', title: '영원성을 지키는 영전도', st: 'cn', role: 'soldier', born: 1584, mate: 'h_yuanchonghuan', look: '40대 초반, 문관 출신의 장수, 꼿꼿한 수염, 화약 연기 속의 눈빛' });
  fig('hj_bocarro', { name: '마누엘 타바레스 보카로', title: '오문 대포 주조장의 주인', st: 'ib', role: 'merchant', born: 1593, look: '30대, 가죽 앞치마, 쇳물에 그을린 팔뚝, 포르투갈인' });
  fig('hj_naduk', { name: '나덕헌', title: '조선의 춘신사', st: 'kr', role: 'official', born: 1573, look: '60대, 조선 관복, 매를 맞아 찢어진 옷깃, 꼿꼿이 선 늙은 무관' });
  fig('hj_jailer', { name: '북경의 옥리', title: '금의위 감옥의 옥리', st: 'cn', role: 'official', fiction: true, look: '50대, 기름 낀 얼굴, 허리에 열쇠 꾸러미' });
  G.HOUJIN_FIGS = ['hj_nurhaci', 'hj_hongtaiji', 'hj_yuan', 'hj_bocarro', 'hj_naduk'];

  if (G.ITEMS && G.ITEM) {
    if (!G.ITEM.houjin_cannon) {
      var c = { id: 'houjin_cannon', name: '홍이포 (紅夷砲)', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
        desc: '오문(마카오)의 포르투갈 주조장에서 부어 낸 무거운 청동 대포 열 문. 명나라 사람들은 붉은 머리 오랑캐의 대포라 하여 「홍이포」라 불렀다. 영원성의 원숭환에게 전할 물건이다.' };
      G.ITEMS.push(c); G.ITEM.houjin_cannon = c;
    }
    if (!G.ITEM.houjin_seal) {
      var p = { id: 'houjin_seal', name: '후금 칸의 통행 패', kind: 'special', price: 0, reg: [], rare: true,
        desc: '만주 글자로 칸의 이름을 새긴 쇠 패. 이것을 내보이면 팔기의 군사들도 길을 비킨다.' };
      G.ITEMS.push(p); G.ITEM.houjin_seal = p;
    }
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.houjin = G.BALANCE.houjin || {
    gunsQ: 50, gunsK: 2.2,          // 1616 허투알라: 교역품 총 50통을 값의 2.2배로 판다 (악명 +notoGuns)
    notoGuns: 6,
    furGold: 1500, furQ: 15,        // 인삼·담비 가죽: 금화 1500에 약재 15통·모피 15통
    cannonQ: 10, cannonK: 2.0,      // 1626 영원성: 교역품 대포 10통 (값의 2배로) — 또는 오문에서 홍이포를 산다
    bocarro: 5000,                  // 오문 보카로 주조장의 홍이포 값
    ningGold: 4000,                 // 영원성 포상
    ningFoe: 80,                    // 영원성 육상전의 후금 군사
    bribe: 8000, jailFoe: 30,       // 1630 북경 감옥: 뇌물 · 감옥을 깬다
    qingGold: 5000, notoQing: 8,    // 1636 홍타이지가 명을 칠 배를 빌려 달라 할 때
    fame: { khan: 60, ningyuan: 260, yuan: 160, qing: 80 }
  };
})(window.G = window.G || {});
