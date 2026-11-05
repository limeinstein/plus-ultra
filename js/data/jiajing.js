/* 가정제의 궁궐 — 임인궁변(1542)과 경술의 변(1550) · 사람·소지품·조정값 (사건: js/systems/jiajing.js) 2026-11-05 사용자 요청
   ■ 사람 (G.HIST_FIG): 가정제 · 방 황후 · 도사 도중문 · 엄숭 · 구란 · 알탄 칸 · 삼낭자(종금 하툰) · 사례감 고 태감(지어낸 인물) · 이슬 받는 궁녀 소란(지어낸 인물)
     얼굴: images/portraits/history/<id>.webp (없으면 코드 초상)
   ■ 소지품: 사례감의 통행패(jj_pass — 북경 성문 통행 허가 · 팔 수 없다) · 이슬 받던 은사발(jj_bowl) · 알탄 칸의 편지(jj_letter — 팔 수 없다) · 알탄 칸의 활(jj_bow) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('jj_emperor', { name: '가정제', title: '대명의 황제', st: 'cn', role: 'noble', born: 1507, look: '30대(1542) / 40대(1550), 도사의 푸른 도포 위에 용포, 여윈 얼굴, 단약에 물든 붉은 입술, 의심 가득한 눈' });
  fig('jj_fang', { name: '방 황후', title: '가정제의 황후', st: 'cn', role: 'noble', g: 'f', born: 1516, look: '20대 중반, 봉관을 쓴 단정한 얼굴, 차가운 눈매, 흐트러진 잠옷 위에 걸친 금실 겉옷' });
  fig('jj_tao', { name: '도중문', title: '서원의 도사 · 「신소보국진인」', st: 'cn', role: 'priest', born: 1475, look: '60대, 흰 수염, 팔괘가 수놓인 검은 도포, 향로를 든 손' });
  fig('jj_yan', { name: '엄숭', title: '예부 상서 · 뒷날의 수보 대학사', st: 'cn', role: 'official', born: 1480, look: '60대, 비단 관복, 웃는 듯 가늘게 뜬 눈, 붓을 쥔 부드러운 손' });
  fig('jj_qiu', { name: '구란', title: '평로대장군', st: 'cn', role: 'soldier', born: 1505, look: '40대, 번쩍이는 갑옷, 겁에 질린 눈, 말에서 내리지 않는 장수' });
  fig('jj_altan', { name: '알탄 칸', title: '투메드 몽골의 칸', st: 'st', role: 'noble', born: 1507, look: '40대(1550) / 60대(1572), 여우털 모자, 매서운 눈, 은 장식 활집, 말 위의 칸' });
  fig('jj_sanniang', { name: '종금 하툰', title: '알탄 칸의 아내 · 명나라 사람들은 「삼낭자」라 부른다', st: 'st', role: 'noble', g: 'f', born: 1550, look: '20대, 은과 산호로 엮은 머리 장식, 말을 잘 타는 날렵한 몸, 장부를 읽는 눈' });
  fig('jj_eunuch', { name: '고 태감', title: '사례감의 물건을 사들이는 내관', st: 'cn', role: 'official', born: 1490, fiction: true, look: '50대, 수염 없는 둥근 얼굴, 붉은 내관 옷, 주판을 품은 소매' });
  fig('jj_maid', { name: '소란', title: '새벽마다 이슬을 받는 궁녀', st: 'cn', role: 'maid', g: 'f', born: 1527, fiction: true, look: '열다섯, 해진 궁녀 옷, 언 손에 든 은사발, 겁먹었지만 맑은 눈' });
  G.JIAJING_FIGS = ['jj_emperor', 'jj_fang', 'jj_tao', 'jj_yan', 'jj_qiu', 'jj_altan', 'jj_sanniang', 'jj_eunuch', 'jj_maid'];
  // 귀화성 재회에서는 세월이 흐른 칸의 얼굴을 쓴다.
  F.jj_altan.periodFaces = [{ from: 1572, face: 'portraits/history/jj_altan_late' }];

  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'jj_pass', name: '사례감의 통행패', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '자금성의 물건을 사들이는 사례감 내관 고 태감이 내준 상아 패. 「궁에 들일 향약을 나르는 자」라고 새겨져 있어 북경의 성문이 열린다. 팔 수 없다.' });
    add({ id: 'jj_bowl', name: '이슬 받던 은사발', kind: 'special', price: 0, reg: [], rare: true,
      desc: '서원의 궁녀들이 새벽마다 황제의 단약에 쓸 이슬을 받던 작은 은사발. 궁에서 빠져나간 소녀가 「다시는 이걸 들지 않을 거예요」라며 두고 갔다.' });
    add({ id: 'jj_letter', name: '알탄 칸의 편지', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '알탄 칸이 명나라 황제에게 보내는 몽골 글 편지. 「말을 팔고 비단과 차를 살 시장을 열어 달라. 그러면 칼을 거두겠다.」 팔 수 없다 — 북경에 전한다.' });
    add({ id: 'jj_bow', name: '알탄 칸의 활', kind: 'special', price: 0, reg: [], rare: true,
      desc: '귀화성(후허호토)에서 늙은 알탄 칸이 건넨 뿔활. 「경술년에 시장 이야기를 처음 꺼낸 바다의 사람에게」라고 활집에 은으로 새겨져 있다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.jiajing = G.BALANCE.jiajing || {
    amber: 10,           // ① 사례감이 청하는 용연향 (통)
    amberK: 3,           // 그 값 — 시세의 k배
    bribe: 1500,         // 소란을 빼낼 때 고 태감에게 건네는 금화
    talkBase: 0.25,      // ② 알탄 칸과의 교섭: 기본 확률 (+ 웅변·몽골어·중국어)
    ransom: 2000,        // 교섭에 실패하면 몸값
    foe: { guard: 14, raid: 40 },
    fame: { night: 100, raid: 160, envoy: 180, khan: 120 }
  };
})(window.G = window.G || {});
