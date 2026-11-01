/* 포르투갈의 마카오 거점 — 1554년 광동의 약조에서 1557년 아마항(오문)까지 (사건: js/systems/macao.js). 2026-11-01 사용자 요청
   「1557 포르투갈의 마카오 거점 확보 — 중국과 유럽을 연결하는 무역·선교 거점으로 성장」
   ■ 사람(G.HIST_FIG): 레오넬 드 소자(포르투갈 중국 항해 사령관) · 왕백(광동 해도부사 汪柏) · 아마항의 늙은 어부
   ■ 소지품: 광동 해도의 통상 허가첩(macao_chop) — 가지고 있는 동안 광주에 들어갈 수 있다 (해마다 저절로 다시 써 준다)
   ■ 고증: 1554년 레오넬 드 소자가 왕백과 맺은 약조(포르투갈 상선은 짐의 절반에 2할 세를 내고 광주 교역에 든다), 1557년 무렵 아마항 반도 정착(해마다 지대 은 500냥),
     1573년 관갑(경계 문), 1582년 마테오 리치가 오문에 닿다. 해적을 쓸어 준 공으로 땅을 얻었다는 이야기는 포르투갈 쪽의 전승이다 (명 쪽 기록은 「물에 젖은 짐을 말린다」는 핑계). */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('mc_leonel', { name: '레오넬 드 소자', title: '포르투갈 중국 항해 사령관', st: 'ib', role: 'captain', born: 1520, look: '30대, 검은 수염, 포르투갈 선장의 짧은 망토와 챙 넓은 모자, 손에 접은 해도' });
  fig('mc_wangbo', { name: '왕백', title: '광동 해도부사', st: 'cn', role: 'official', born: 1510, look: '40대, 명나라 관리의 오사모와 흉배 단 관복, 가는 수염, 부채' });
  fig('mc_fisher', { name: '아마항의 늙은 어부', title: '마조각 앞 어촌의 늙은 어부', st: 'cn', role: 'sailor', born: 1490, fiction: true, look: '60대, 삿갓과 해진 무명 웃옷, 그물을 든 거친 손' });

  if (G.ITEMS && G.ITEM && !G.ITEM.macao_chop) {
    var it = { id: 'macao_chop', name: '광동 해도의 통상 허가첩', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '광동 해도부사 왕백의 붉은 관인이 찍힌 종이. 「번선(蕃船)은 짐의 절반에 2할을 내고 광주 교역에 든다」고 적혀 있다. 이것을 보이면 광주의 수비병이 길을 연다.' };
    G.ITEMS.push(it); G.ITEM.macao_chop = it;
  }
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.macao = G.BALANCE.macao || {
    gift: 3000,                        // 해도부사에게 바치는 선물 (금화) — 바치면 반드시 약조가 맺어진다
    talk: { base: 0.3, speech: 0.15, cha: 0.25 },   // 말로 설득할 가망: base + 화술 단계 × speech + 매력/100 × cha
    talkCool: 30,                      // 설득에 실패하면 이만큼 날이 지나야 다시
    pirateGap: 20,                     // 약조 뒤 해적 토벌을 청하기까지 날수
    fame: { deal: 80, pirates: 200, settle: 160 },
    share: 3000                        // 포르투갈 사람이 아닌 제독의 몫 (금화)
  };
})(window.G = window.G || {});
