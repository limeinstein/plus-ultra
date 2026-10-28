/* 포토시 은광 — 은의 산 (사건: js/systems/potosi.js). 2026-10-29 사용자 요청
   「포토시 은광 개발 시작 이벤트 · 에스파냐와 원주민의 대립 · 원주민 여성 가운데 미인 한 명 · 그 여인을 구하는 작전」
   ■ 실제 인물: 디에고 우알파(은맥을 처음 찾은 원주민 목동) · 후안 데 비야로엘(처음 광구를 등록한 에스파냐 사람)
   ■ 지어낸 인물: 차스카(카라카라 쿠라카의 딸) · 쿠시 마이타(그 아버지) · 로드리고 데 아얄라(엔코멘데로) · 멘도(아얄라의 감독관)
     — 실제 사람에게 없는 일을 덮어씌우지 않으려고, 악역과 여인은 지어낸 사람으로 했다.
   ■ 동료 차스카: 세공 3 · 과학 2 · 음악 2 · 의학 1 / 중남미토착어 3 · 스페인어 1 · 품삯 없음 (이야기 동료)
     그림: images/portraits/legendary/chaska.webp (얼굴상) · chaska_half.webp (무릎상) — 없으면 코드 초상(안데스 양식) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    huallpa: { name: '디에고 우알파', title: '은맥을 처음 찾은 원주민 목동', st: 'an', role: 'native', born: 1510, look: '30대, 햇볕에 그을린 넓은 얼굴, 줄무늬 판초와 귀덮개 달린 털모자(추요), 손에 라마 몰이 끈' },
    villarroel: { name: '후안 데 비야로엘', title: '포토시에 처음 광구를 등록한 에스파냐 사람', st: 'ib', role: 'soldier', born: 1510, look: '30대, 짧은 검은 수염, 낡은 흉갑과 넓은 챙 모자, 허리에 칼과 등록 문서 두루마리' },
    kusimayta: { name: '쿠시 마이타', title: '카라카라 사람들의 쿠라카 (지어낸 인물)', st: 'an', role: 'king', born: 1495, look: '50대, 주름진 얼굴, 금 귀마개, 붉은 줄무늬 망토, 지팡이' },
    ayala: { name: '로드리고 데 아얄라', title: '포토시의 엔코멘데로 (지어낸 인물)', st: 'ib', role: 'noble', born: 1505, look: '40대, 살찐 얼굴과 뾰족한 수염, 검은 벨벳 옷에 금 사슬, 은반지를 여럿 낀 손' },
    mendo: { name: '감독관 멘도', title: '아얄라의 광산 감독관 (지어낸 인물)', st: 'ib', role: 'soldier', born: 1515, look: '30대, 흉터 난 얼굴, 가죽 조끼와 채찍, 허리에 짧은 칼' },
    potosi_soldier: { name: '에스파냐 병사', title: '포토시의 병사', st: 'ib', role: 'soldier', fiction: true, look: '붉은 콧수염, 낡은 모리온 투구와 흉갑, 황토색 군복과 장창' },
    potosi_arriero: { name: '라마 몰이꾼', title: '은을 나르는 라마 행렬의 마부', st: 'an', role: 'native', fiction: true, look: '햇볕에 그을린 좁은 얼굴, 적갈색 판초, 밧줄과 접은 안장 담요' },
    potosi_oidor: { name: '왕실 감찰관', title: '광산 청원을 듣는 왕실 관리', st: 'ib', role: 'official', fiction: true, look: '회색 머리의 수염 없는 긴 얼굴, 검은 법복과 사각 모자, 청원 서류와 깃펜' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.POTOSI_FIGS = ['huallpa', 'villarroel', 'kusimayta', 'ayala', 'mendo'];
  G.POTOSI_EXTRAS = ['potosi_soldier', 'potosi_arriero', 'potosi_oidor'];

  // ── 동료: 차스카 (사건으로만 만난다)
  var m = { id: 'chaska', name: '차스카', g: 'f', style: 'an', role: 'noble', tone: 'polite', pic: 'chaska', age: 'young',
    st: [54, 76, 46, 96], sk: { craft: 3, sci: 2, music: 2, med: 1 }, skBoost: 1, lg: { 11: 3, 0: 1 },
    desc: '포토시 은산 기슭 카라카라 사람들의 쿠라카(우두머리) 쿠시 마이타의 딸. 이름은 케추아 말로 「샛별」. 은산 비탈의 와이라(바람 화로) 불을 지키며 바람을 부르는 노래를 부르고, 녹은 은의 빛깔만 보고도 광석의 질을 알아맞힌다. 포토시 사람들은 그녀가 비탈을 내려오면 노새꾼까지 걸음을 멈춘다고 했다. 에스파냐 엔코멘데로에게 볼모로 붙잡혔다가 바다의 제독에게 구출된 뒤, 「산 너머의 바다를 보고 싶다」며 배에 올랐다.' };
  m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1545, 1600]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }

  // ── 조정값
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.potosi = G.BALANCE.potosi || {
    esGold: 2000, midGold: 800,        // ① 에스파냐 편 첫 은의 몫 · 사이에서 말렸을 때 원주민이 판 은 값
    caravan: 1200,                     // ② 라마 행렬 마부에게 줄 뇌물
    lawCost: 1500,                     // ② 청원에 드는 비용 (서기·증인)
    sneak: [0.55, 0.1],                // 갱도 잠입 성공률: 기본 + 측량 단계마다
    caravanSneak: 0.75,                // 라마 행렬에 숨었을 때 성공률
    law: [0.25, 0.2],                  // 청원 성공률: 기본 + 웅변 단계마다
    team: 20,                          // 잠입대 인원
    escape: [22, 45],                  // 탈출 판의 적: 조용히 / 들켰을 때
    storm: 70,                         // 정면 습격의 적
    retry: 20                          // 실패하면 이만큼(일) 뒤 다시
  };
})(window.G = window.G || {});
